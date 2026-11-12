"""Editorial quality gate for .growth articles (standard library only).

build.check_article() proves an article is structurally publishable. This gate
asks whether it is worth publishing for an ophthalmology practice owner,
administrator or operations lead:

  E1  at least two independent (non-KRH) sources, each with a checked date
      and a specific 'supports' note
  E2  a concise answer (25-90 words) that can stand alone for AEO/GEO
  E3  a relevant business path in the body: /pilot/, /contact/, /product/,
      /how-it-works/ or /technician-coverage-risk-check/
  E4  at least one link to another KRH resource article (topic cluster)
  E5  distinct search intent: title/answer not a near-duplicate of an
      existing article (token Jaccard < 0.5 on titles)
  E6  no unsupported outcome language (guarantees, ROI, savings, clinical
      validation, customer claims) unless the sentence also says 'synthetic'
  E7  ophthalmology relevance named in title, description or answer

ENFORCED for articles published on or after ENFORCE_FROM, so the gate never
breaks the build for pages already live; older articles are reported by
`python3 .growth/editorial_gate.py` so they can be refreshed deliberately.
A pass is necessary, not sufficient: it does not prove a claim is true.
"""
import json
import re
import sys
from pathlib import Path

ENFORCE_FROM = '2026-11-13'
ROOT = Path(__file__).resolve().parents[1]
BUSINESS = ('/pilot/', '/contact/', '/product/', '/how-it-works/', '/technician-coverage-risk-check/')
OPHTHO = re.compile(r'ophthalm|eye clinic|eye care|optometr|retina|glaucoma|cataract|technician', re.I)
CLAIMS = re.compile(
    r'\bguarantee[sd]?\b|\bproven to\b|\bclinically (?:validated|proven)\b|\bROI\b|\breturn on investment\b'
    r'|\bsav(?:e|es|ed|ings) (?:of )?\$|\b\d+(?:\.\d+)?% (?:fewer|less|lower|reduction|improvement|increase)\b'
    r'|\bour (?:clients|customers)\b|\btrusted by\b|\bleading practices\b', re.I)
STOP = set('a an and the of for to in on with by how what when why your our is are do does can should vs before after'.split())


def _words(text):
    return {w for w in re.findall(r'[a-z0-9]+', text.lower()) if w not in STOP}


def _sentences(html):
    text = re.sub(r'<[^>]+>', ' ', html)
    return re.split(r'(?<=[.!?])\s+', re.sub(r'\s+', ' ', text))


def review(article, others=()):
    """Return a list of 'E#: problem' strings; empty means the gate passes."""
    a, problems = article, []
    ext = [s for s in a.get('sources', []) if 'kestrelridgehealth.com' not in s.get('url', '')]
    good = [s for s in ext if re.fullmatch(r'\d{4}-\d{2}-\d{2}', s.get('checked', '')) and len(s.get('supports', '')) >= 40]
    if len(good) < 2:
        problems.append(f'E1: {len(good)} independent source(s) with checked date and specific support note; need 2')
    n = len(a.get('answer', '').split())
    if not 25 <= n <= 90:
        problems.append(f'E2: answer is {n} words; need 25-90')
    links = re.findall(r'href="([^"]+)"', a.get('body', ''))
    paths = [re.sub(r'^https://kestrelridgehealth\.com', '', h).split('#')[0] for h in links]
    if not any(p in BUSINESS for p in paths):
        problems.append('E3: no business path link (pilot, contact, product, how-it-works or risk check) in the body')
    slugs = {o['slug'] for o in others}
    if not any(p.strip('/') in slugs for p in paths if p.startswith('/')):
        problems.append('E4: no link to another KRH resource article')
    tw = _words(a.get('title', ''))
    for o in others:
        ow = _words(o.get('title', ''))
        j = len(tw & ow) / max(1, len(tw | ow))
        if o.get('slug') != a.get('slug') and j >= 0.5:
            problems.append(f'E5: title overlaps "{o["slug"]}" (Jaccard {j:.2f}); state the distinct intent or refresh that article')
    public = ' '.join([a.get('title', ''), a.get('description', ''), a.get('answer', ''), a.get('body', '')])
    for s in _sentences(public):
        if CLAIMS.search(s) and 'synthetic' not in s.lower():
            problems.append(f'E6: unsupported outcome language: "{s.strip()[:120]}"')
    if not OPHTHO.search(' '.join([a.get('title', ''), a.get('description', ''), a.get('answer', '')])):
        problems.append('E7: title/description/answer do not name the ophthalmology context')
    return problems


def enforce(article, others=()):
    if article.get('published', '') >= ENFORCE_FROM:
        problems = review(article, others)
        assert not problems, 'Editorial gate: ' + '; '.join(problems)


def load_all():
    return [json.loads(p.read_text()) for p in sorted((ROOT / '.growth/articles').glob('*.json'))]


if __name__ == '__main__':
    arts = load_all()
    failing = 0
    for a in arts:
        probs = review(a, [o for o in arts if o is not a])
        mode = 'ENFORCED' if a['published'] >= ENFORCE_FROM else 'report-only'
        print(f"{'PASS' if not probs else 'FLAG'}  {a['slug']}  ({a['published']}, {mode})")
        for p in probs:
            print('      ' + p)
        failing += bool(probs) and mode == 'ENFORCED'
    sys.exit(1 if failing else 0)
