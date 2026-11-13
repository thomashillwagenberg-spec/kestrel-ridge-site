#!/usr/bin/env python3
"""Check indexable pages, reviewed content, local links and optional live deployment."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
from urllib.request import Request, urlopen
import argparse
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from build import ROOT, BASE, NS, check_article
import datetime as dt

# Weekly brief-gated publishing rule (see README.md and BRIEF-TEMPLATE.md).
# Articles created or substantively revised on or after this date must carry a
# brief reference and the required internal links. Earlier revisions are grandfathered.
BRIEF_RULE_EFFECTIVE='2026-11-16'
REQUIRED_LINKS=('/product/','/pilot/','/evidence/')
EVIDENCE_TYPES={'search_console_query','sales_conversation','ai_answer_gap','p2_opportunity'}
BRIEF_KINDS={'new','refresh'}

def internal_links(a):
    text=a.get('answer','')+a.get('body','')
    return {h.split('#')[0] for h in re.findall(r'href="(/[^"]*)"',text)}

def check_brief_gate(a, slugs):
    """Raise AssertionError when a gated article lacks its brief or required links."""
    if a['modified']<BRIEF_RULE_EFFECTIVE: return
    b=a.get('brief')
    assert isinstance(b,dict), f"{a['slug']}: missing brief reference (see .growth/BRIEF-TEMPLATE.md)"
    assert re.fullmatch(r'\d{4}-W\d{2}-(new|refresh)-[a-z0-9-]+',b.get('id','')), f"{a['slug']}: brief id must look like 2026-W47-new-slug"
    assert b.get('kind') in BRIEF_KINDS, f"{a['slug']}: brief kind must be new or refresh"
    assert b.get('kind') in b['id'], f"{a['slug']}: brief id and kind disagree"
    assert b.get('evidence_type') in EVIDENCE_TYPES, f"{a['slug']}: brief evidence_type must be one of {sorted(EVIDENCE_TYPES)}"
    assert b.get('buyer_question','').strip(), f"{a['slug']}: brief buyer_question missing"
    assert b.get('nearest_page','').startswith('/') and b.get('distinct_because','').strip(), f"{a['slug']}: brief must name nearest existing page and why this differs"
    if b['kind']=='new': assert b['nearest_page']!=f"/{a['slug']}/", f"{a['slug']}: nearest page cannot be itself"
    links=internal_links(a)
    missing=[l for l in REQUIRED_LINKS if l not in links]
    assert not missing, f"{a['slug']}: missing required internal links {missing}"
    related={l for l in links if l.strip('/') in slugs and l.strip('/')!=a['slug']}
    assert related, f"{a['slug']}: link at least one related article"
    assert len(a.get('sources',[]))>=2, f"{a['slug']}: brief-gated articles need at least two cited sources"

def check_weekly_cap(articles):
    """At most one new article per ISO week from the effective date onward."""
    weeks={}
    for a in articles:
        if a['published']>=BRIEF_RULE_EFFECTIVE:
            weeks.setdefault(dt.date.fromisoformat(a['published']).isocalendar()[:2],[]).append(a['slug'])
    over={f'{y}-W{w:02d}':s for (y,w),s in weeks.items() if len(s)>1}
    assert not over, f'More than one new article in a week: {over}'

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.h1=0; self.canon=[]; self.links=[]; self.description=[]; self.robots=[]; self.images=[]; self.jsonld=[]; self.capture=False
    def handle_starttag(self,t,a):
        a=dict(a)
        if t=='h1': self.h1+=1
        if t=='link' and a.get('rel')=='canonical': self.canon.append(a.get('href'))
        if t=='meta' and a.get('name')=='description': self.description.append(a.get('content'))
        if t=='meta' and a.get('name')=='robots': self.robots.append(a.get('content',''))
        if t in ('a','link','script','img'):
            v=a.get('href',a.get('src',''))
            if v.startswith('/'): self.links.append(v)
        if t=='img': self.images.append(a)
        if t=='script' and a.get('type')=='application/ld+json': self.capture=True
    def handle_endtag(self,t):
        if t=='script': self.capture=False
    def handle_data(self,d):
        if self.capture: self.jsonld.append(json.loads(d))

def local_path(url):
    p = unquote(urlparse(url).path).lstrip('/')
    path=ROOT/p
    return path/'index.html' if path.is_dir() or not p or p.endswith('/') else path

def deployment_bytes(data, path):
    if not path.endswith('.html'): return data
    # Cloudflare consumes email-off comments and injects its configured RUM beacon.
    # Ignore only this observed hosting transformation, not arbitrary script changes.
    data=data.replace(b'<!--email_off-->',b'').replace(b'<!--/email_off-->',b'')
    data=re.sub(rb'<script\b[^>]*src="https://static\.cloudflareinsights\.com/beacon\.min\.js/[^"<>]+"[^>]*data-cf-beacon=\'[^\']*\'[^>]*></script>',b'',data)
    return re.sub(rb'>\s+<',b'><',data).strip()

def inspect(text,url):
    p=Page();p.feed(text); errors=[]
    if p.h1!=1: errors.append(f'{url}: expected one h1, got {p.h1}')
    if p.canon!=[url]: errors.append(f'{url}: incorrect canonical {p.canon}')
    if len(p.description)!=1 or not p.description[0]: errors.append(f'{url}: missing description')
    if any('noindex' in r for r in p.robots): errors.append(f'{url}: noindex')
    if re.search(r'\$\s*7[,.]?500|\bUSD\s*7[,.]?500|\b7500\s*dollars',text,re.I): errors.append(f'{url}: retired price')
    for link in p.links:
        if not local_path(link).exists(): errors.append(f'{url}: missing local target {link}')
    return errors

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--live',action='store_true');ap.add_argument('--report');args=ap.parse_args()
    articles=[json.loads(p.read_text()) for p in (ROOT/'.growth/articles').glob('*.json')]
    for a in articles: check_article(a)
    slugs={a['slug'] for a in articles}|{p.parent.name for p in ROOT.glob('*/index.html')}
    errors=[]
    for a in articles:
        try: check_brief_gate(a,slugs)
        except AssertionError as e: errors.append(str(e))
    try: check_weekly_cap(articles)
    except AssertionError as e: errors.append(str(e))
    urls=[e.text for e in ET.parse(ROOT/'sitemap.xml').findall(f'.//{{{NS}}}loc')]
    if len(urls)!=len(set(urls)): errors.append('Duplicate sitemap URLs')
    for url in urls:
        p=local_path(url)
        if not p.exists(): errors.append('Missing sitemap page: '+url);continue
        errors.extend(inspect(p.read_text(),url))
    checked=[]
    if args.live:
        paths={'resources/index.html','sitemap.xml','feed.xml','assets/growth.css','assets/growth.js','assets/site-analytics.js','assets/site-analytics.css','assets/article-feedback.js','assets/article-feedback.css','privacy/index.html','downloads/session-readiness-worksheet.csv'}
        for a in articles: paths.update({a['slug']+'/index.html',a['image']['path'].lstrip('/')})
        # Wait for current HTML before requesting newly named assets.
        # A pre-deployment asset request can cache a 404 at the delivery edge.
        for path in sorted(paths, key=lambda path: (not path.endswith('.html'), path)):
            if errors and not path.endswith('.html'):
                continue
            url=BASE+'/'+path.removesuffix('index.html')
            try:
                req=Request(url,headers={'User-Agent':'KRH-Publishing-Verification/1.0','Cache-Control':'no-cache'})
                with urlopen(req,timeout=25) as r:
                    body=r.read();status=r.status
                match=hashlib.sha256(deployment_bytes(body,path)).digest()==hashlib.sha256(deployment_bytes((ROOT/path).read_bytes(),path)).digest()
                checked.append({'url':url,'http_status':status,'matches_source':match})
                if not match: errors.append('Live content differs: '+url)
            except Exception as e: errors.append(f'{url}: {e}')
    report={'sitemap_pages':len(urls),'reviewed_articles':len(articles),'errors':errors,'live_checks':checked,'indexing_note':'HTTP success is not evidence of search engine indexing.'}
    if args.report: Path(args.report).write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2));return bool(errors)

if __name__=='__main__': sys.exit(main())
