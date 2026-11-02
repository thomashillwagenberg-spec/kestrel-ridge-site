import copy
import json
import unittest
from build import ROOT, check_article

class PublishingGateTests(unittest.TestCase):
    def setUp(self):
        self.article=json.loads(next((ROOT/'.growth/articles').glob('*.json')).read_text())
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

if __name__=='__main__': unittest.main()
