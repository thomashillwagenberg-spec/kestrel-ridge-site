import json
import unittest
from build import ROOT
import editorial_gate as eg

SRC = {'title': 'Independent source', 'url': 'https://example.org/a', 'checked': '2026-11-13',
       'supports': 'Describes the specific scheduling mechanism this article explains, section 2.'}


def good():
    return {
        'slug': 'new-guide', 'title': 'How eye clinics staff dilation-heavy afternoons',
        'description': 'A practical guide for ophthalmology administrators.', 'published': '2026-11-14',
        'answer': ' '.join(['word'] * 40),
        'body': '<p>See <a href="/pilot/">Phase Zero</a> and <a href="/older-guide/">the older guide</a>. '
                'On a synthetic holdout the forecast error was 23.76 minutes.</p>',
        'sources': [SRC, dict(SRC, url='https://example.org/b'),
                    {'title': 'KRH', 'url': 'https://kestrelridgehealth.com/pilot/', 'checked': '2026-11-13', 'supports': 'x' * 50}],
    }

OTHERS = [{'slug': 'older-guide', 'title': 'Planning ophthalmic technician training coverage'}]


class EditorialGateTests(unittest.TestCase):
    def test_compliant_article_passes(self):
        self.assertEqual(eg.review(good(), OTHERS), [])

    def test_krh_pages_do_not_count_as_independent_sources(self):
        a = good(); a['sources'] = a['sources'][1:]
        self.assertTrue(any(p.startswith('E1') for p in eg.review(a, OTHERS)))

    def test_missing_business_path_and_cluster_link(self):
        a = good(); a['body'] = '<p>Synthetic only.</p>'
        codes = {p[:2] for p in eg.review(a, OTHERS)}
        self.assertTrue({'E3', 'E4'} <= codes)

    def test_near_duplicate_title_flagged(self):
        a = good(); a['title'] = 'Planning ophthalmic technician training coverage well'
        self.assertTrue(any(p.startswith('E5') for p in eg.review(a, OTHERS)))

    def test_outcome_claim_needs_synthetic_label(self):
        a = good(); a['body'] += '<p>Practices see 30% fewer overtime hours.</p>'
        self.assertTrue(any(p.startswith('E6') for p in eg.review(a, OTHERS)))
        a = good(); a['body'] += '<p>In the synthetic test, 30% fewer late sessions.</p>'
        self.assertFalse(any(p.startswith('E6') for p in eg.review(a, OTHERS)))

    def test_enforced_only_from_cutover(self):
        a = good(); a['sources'] = []
        with self.assertRaises(AssertionError):
            eg.enforce(a, OTHERS)
        a['published'] = '2026-11-12'
        eg.enforce(a, OTHERS)  # report-only for already-live articles

    def test_live_articles_never_break_the_build(self):
        arts = [json.loads(p.read_text()) for p in (ROOT / '.growth/articles').glob('*.json')]
        for a in arts:
            eg.enforce(a, [o for o in arts if o is not a])


if __name__ == '__main__':
    unittest.main()
