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

if __name__=='__main__': unittest.main()
