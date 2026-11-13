import copy
import json
import unittest
from build import ROOT, check_article
from check import deployment_bytes

class PublishingGateTests(unittest.TestCase):
    def setUp(self):
        self.article=json.loads(next((ROOT/'.growth/articles').glob('*.json')).read_text())
    def test_old_deployment_does_not_probe_new_assets(self):
        from unittest.mock import patch
        from urllib.error import HTTPError
        import io
        import check
        requested=[]
        def unavailable(request, **kwargs):
            requested.append(request.full_url)
            raise HTTPError(request.full_url,404,'Not deployed',None,None)
        with patch('sys.argv',['check.py','--live']), patch('check.urlopen',side_effect=unavailable), patch('sys.stdout',new=io.StringIO()):
            self.assertTrue(check.main())
        self.assertTrue(requested)
        self.assertFalse(any('/assets/' in url for url in requested))
    def test_retired_price_is_blocked(self):
        for price in ('$7,500','$7500','USD 7500','7500 dollars'):
            a=copy.deepcopy(self.article);a['body']+=' Phase Zero costs '+price
            with self.assertRaisesRegex(AssertionError,'Obsolete'): check_article(a)
    def test_unreviewed_revision_is_blocked(self):
        a=copy.deepcopy(self.article);a['sources'][0]['checked']='2020-01-01'
        with self.assertRaisesRegex(AssertionError,'checked'): check_article(a)
    def test_missing_image_is_blocked(self):
        a=copy.deepcopy(self.article);a['image']['path']='/assets/missing.jpg'
        with self.assertRaisesRegex(AssertionError,'Missing article image'): check_article(a)
    def test_active_content_is_blocked(self):
        a=copy.deepcopy(self.article);a['body']+='<script>alert(1)</script>'
        with self.assertRaisesRegex(AssertionError,'Active HTML'): check_article(a)
    def test_missing_synthetic_disclosure_is_blocked(self):
        a=copy.deepcopy(self.article);a['body']=a['body'].replace('synthetic','generated')
        with self.assertRaisesRegex(AssertionError,'evidence limits'): check_article(a)
    def test_reviewed_article_passes(self): check_article(self.article)
    def test_hosting_comments_are_normalized(self):
        self.assertEqual(deployment_bytes(b'<p><!--email_off-->contact<!--/email_off--></p>','x.html'),b'<p>contact</p>')
    def test_unexpected_scripts_are_not_ignored(self):
        self.assertNotEqual(deployment_bytes(b'<p>text</p><script src="https://other.example/a.js"></script>','x.html'),b'<p>text</p>')

class BriefGateTests(unittest.TestCase):
    def gated(self):
        from check import BRIEF_RULE_EFFECTIVE
        a=json.loads((ROOT/'.growth/articles/ophthalmology-staffing-forecast-readiness.json').read_text())
        a['published']=a['modified']=a['reviewed']=BRIEF_RULE_EFFECTIVE
        a['slug']='example-gated-article'
        a['body']+=('<p><a href="/product/">Product</a> <a href="/pilot/">Phase Zero</a> '
                    '<a href="/evidence/">Evidence</a> <a href="/ophthalmic-technician-staffing-ratios/">Ratios</a></p>')
        a['sources']=[dict(s,checked=BRIEF_RULE_EFFECTIVE) for s in (a['sources']*2)[:2]]
        a['brief']={'id':'2026-W47-new-example-gated-article','kind':'new','evidence_type':'p2_opportunity',
                    'buyer_question':'How many technicians per session?','nearest_page':'/ophthalmic-technician-staffing-ratios/',
                    'distinct_because':'Answers a different decision.'}
        return a
    slugs={'ophthalmic-technician-staffing-ratios','example-gated-article'}
    def test_grandfathered_articles_pass(self):
        from check import check_brief_gate
        for p in (ROOT/'.growth/articles').glob('*.json'):
            a=json.loads(p.read_text())
            if a['modified']<'2026-11-16': check_brief_gate(a,self.slugs)
    def test_complete_brief_passes(self):
        from check import check_brief_gate
        check_brief_gate(self.gated(),self.slugs)
    def test_missing_brief_is_blocked(self):
        from check import check_brief_gate
        a=self.gated();del a['brief']
        with self.assertRaisesRegex(AssertionError,'missing brief'): check_brief_gate(a,self.slugs)
    def test_bad_evidence_type_is_blocked(self):
        from check import check_brief_gate
        a=self.gated();a['brief']['evidence_type']='hunch'
        with self.assertRaisesRegex(AssertionError,'evidence_type'): check_brief_gate(a,self.slugs)
    def test_missing_required_link_is_blocked(self):
        from check import check_brief_gate
        a=self.gated();a['body']=a['body'].replace('href="/evidence/"','href="/faq/"')
        with self.assertRaisesRegex(AssertionError,'required internal links'): check_brief_gate(a,self.slugs)
    def test_missing_related_article_link_is_blocked(self):
        from check import check_brief_gate
        a=self.gated();a['body']=a['body'].replace('/ophthalmic-technician-staffing-ratios/','/faq/')
        with self.assertRaisesRegex(AssertionError,'related article'): check_brief_gate(a,self.slugs)
    def test_two_new_articles_in_one_week_are_blocked(self):
        from check import check_weekly_cap
        a=self.gated();b=copy.deepcopy(a);b['slug']='second';b['published']='2026-11-18'
        with self.assertRaisesRegex(AssertionError,'More than one new article'): check_weekly_cap([a,b])
        b['published']='2026-11-23'; check_weekly_cap([a,b])

if __name__=='__main__': unittest.main()
