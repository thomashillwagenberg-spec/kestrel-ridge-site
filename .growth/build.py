#!/usr/bin/env python3
"""Build reviewed article sources into the existing static site. No dependencies."""
from pathlib import Path
from html import escape
import datetime as dt
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://kestrelridgehealth.com'
NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'
ET.register_namespace('', NS)

def write_changed(path, text):
    if path.exists() and path.read_text() == text:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)
    return True

def check_article(a):
    for key in ('slug', 'title', 'description', 'answer', 'body', 'published', 'modified', 'reviewed', 'sources', 'image', 'editorial_note'):
        assert a.get(key), f'Missing article field: {key}'
    assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', a['slug']), 'Unsafe slug'
    assert a['published'] <= a['modified'] <= dt.date.today().isoformat(), 'Invalid article dates'
    assert dt.date.fromisoformat(a['reviewed']) >= dt.date.fromisoformat(a['modified']), 'Source review predates change'
    public = a['title'] + a['description'] + a['answer'] + a['body']
    assert not re.search(r'\$\s*7[,.]?500|\bUSD\s*7[,.]?500|\b7500\s*dollars', public, re.I), 'Obsolete Phase Zero price'
    assert not re.search(r'<(?:script|iframe|form)\b|\bon\w+\s*=|javascript:', a['body'], re.I), 'Active HTML in article'
    assert 'synthetic' in a['body'].lower(), 'Missing evidence limits'
    for s in a['sources']:
        assert s['url'].startswith('https://') and s['supports'] and s['title']
        assert s['checked'] >= a['modified'], 'Source must be checked for this revision'
    im = a['image']
    assert im['path'].startswith('/assets/') and '..' not in im['path']
    assert (ROOT / im['path'].lstrip('/')).is_file(), 'Missing article image'
    assert im['alt'] and im['caption'] and im['provenance'], 'Missing image provenance'

NOSCRIPT_NAV = '<noscript><style>@layer base{@media (max-width:767.98px){#mobile-nav[hidden]{display:block!important}}}@media (max-width:767.98px){button[aria-controls="mobile-nav"]{display:none!important}}</style></noscript>'


def build():
    articles = [json.loads(p.read_text()) for p in sorted((ROOT/'.growth/articles').glob('*.json'))]
    assert len({a['slug'] for a in articles}) == len(articles), 'Duplicate article slug'
    for a in articles:
        check_article(a)
    header = (ROOT/'.growth/templates/header.html').read_text().replace(' aria-current="page"', '')
    footer = (ROOT/'.growth/templates/footer.html').read_text()
    feedback = (ROOT/'.growth/templates/feedback.html').read_text()
    changed = {}
    for a in articles:
        url = f"{BASE}/{a['slug']}/"
        im = a['image']
        schema = {'@context':'https://schema.org','@graph':[
            {'@type':'Organization','@id':BASE+'/#organization','name':'Kestrel Ridge Health','url':BASE+'/'},
            {'@type':'Article','@id':url+'#article','headline':a['title'],'description':a['description'],
             'datePublished':a['published'],'dateModified':a['modified'],'mainEntityOfPage':url,
             'author':({'@type':'Person','name':a['author'],'url':BASE+'/about/'} if a.get('author') else {'@id':BASE+'/#organization'}),'publisher':{'@id':BASE+'/#organization'},
             'image':BASE+im['path'],'citation':[s['url'] for s in a['sources']]},
            {'@type':'BreadcrumbList','itemListElement':[
                {'@type':'ListItem','position':1,'name':'Resources','item':BASE+'/resources/'},
                {'@type':'ListItem','position':2,'name':a['title'],'item':url}]}]}
        sources = ''.join(f'<li><a href="{escape(s["url"])}">{escape(s["title"])}</a><p>{escape(s["supports"])} Checked {escape(s["checked"])}.</p></li>' for s in a['sources'])
        page = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(a['title'])} | Kestrel Ridge Health</title>
<meta name="description" content="{escape(a['description'])}"><meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{url}"><link rel="alternate" type="text/markdown" href="{url}index.md"/><link rel="icon" href="/favicon.ico">
<link rel="stylesheet" href="/_next/static/chunks/krh-site-20261008a.css"><link rel="stylesheet" href="/assets/growth.css"><link rel="stylesheet" href="/assets/article-feedback.css">
<link rel="alternate" type="application/rss+xml" title="KRH resources" href="/feed.xml">
<meta property="og:type" content="article"><meta property="og:title" content="{escape(a['title'])}">
<meta property="og:description" content="{escape(a['description'])}"><meta property="og:url" content="{url}">
<meta property="og:image" content="{BASE+im['path']}"><meta property="og:image:alt" content="{escape(im['alt'])}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{json.dumps(schema).replace('<', chr(92)+'u003c')}</script>{NOSCRIPT_NAV}</head>
<body class="flex min-h-full flex-col bg-background text-foreground"><a class="growth-skip" href="#main">Skip to content</a>
{header}
<main id="main" class="growth"><article>
<nav aria-label="Breadcrumb"><a href="/resources/">Resources</a> / Planning guide</nav>
<p class="growth-label">{escape(a['category'])} / Independent ophthalmology practices</p>
<h1>{escape(a['title'])}</h1><p class="growth-byline">By {escape(a.get('author','Kestrel Ridge Health'))} · Kestrel Ridge Health · Published <time datetime="{a['published']}">{a['published']}</time> · Updated <time datetime="{a['modified']}">{a['modified']}</time> · {max(1, (len(re.sub('<[^>]+>', ' ', a['body']).split()) + 199) // 200)} minute read</p>
<figure><img src="{im['path']}" alt="{escape(im['alt'])}" width="{im['width']}" height="{im['height']}" fetchpriority="high"><figcaption>{escape(im['caption'])}</figcaption></figure>
<aside class="growth-answer" aria-label="Quick answer"><p class="growth-label">The starting point</p><p>{escape(a['answer'])}</p></aside>
<div class="growth-copy">{a['body']}
<section class="growth-sources"><h2>Sources and scope</h2><ul>{sources}</ul></section>
{feedback}
<aside class="growth-cta growth-riskcheck" aria-labelledby="risk-check-title"><h2 id="risk-check-title">Technician coverage risk check</h2><p>Check your technician coverage risk in about 3 minutes. Answer a few questions about your own sessions and staffing, then decide whether a longer conversation is worth having.</p><a class="growth-button" href="/technician-coverage-risk-check/">Start the risk check</a></aside>
<aside class="growth-cta"><h2>Does your session history support a useful test?</h2><p>Start with a conversation about your sites, your current planning method and what you can measure.</p><a class="growth-button" href="/contact/">Discuss Phase Zero</a></aside>
</div></article></main>{footer}<script src="/assets/growth.js" defer></script><script src="/assets/article-feedback.js" defer></script></body></html>'''
        if a.get('presentation') == 'editorial':
            sections = ''.join(f'<a href="#{escape(section[0])}">{escape(section[1])}</a>' for section in a['sections'])
            resource = a.get('resource', {'url': '/downloads/screening-workflow-change-review.pdf', 'label': 'Get the worksheet ↓'})
            opening = f'''<main id="main" class="growth story"><article>
<nav class="story-breadcrumb" aria-label="Breadcrumb"><a href="/resources/">Resources</a><span>/</span>Practice operations</nav>
<header class="story-hero"><div class="story-heading"><p class="growth-label">THE OPERATIONS NOTE / {dt.date.fromisoformat(a['published']).strftime('%d %b %Y').upper()}</p>
<h1>{escape(a['title'])}</h1><p class="story-deck">{escape(a['deck'])}</p>
<p class="growth-byline">By {escape(a['author'])}<br>Kestrel Ridge Health · Published <time datetime="{a['published']}">{dt.date.fromisoformat(a['published']).strftime('%B %-d, %Y')}</time> · {max(1, (len(re.sub('<[^>]+>', ' ', a['body']).split()) + 199) // 200)} minute read</p></div>
<figure><img src="{im['path']}" alt="{escape(im['alt'])}" width="{im['width']}" height="{im['height']}" fetchpriority="high"><figcaption>{escape(im['caption'])}</figcaption></figure></header>
<aside class="story-takeaway"><p class="growth-label">THE PRACTICAL TAKEAWAY</p><p>{escape(a['answer'])}</p></aside>
<div class="story-layout"><nav class="story-toc" aria-label="In this article"><p class="growth-label">IN THIS ARTICLE</p>{sections}<a class="story-toc-download" href="{escape(resource['url'])}">{escape(resource['label'])}</a></nav>
'''
            page = page[:page.index('<main id="main"')] + opening + page[page.index('<div class="growth-copy">'):]
            page = page.replace('</div></article></main>', '</div></div></article></main>')
        if write_changed(ROOT/a['slug']/'index.html', page):
            changed[url] = a['modified']
    # Extend the established resource page; retain all existing articles and navigation.
    resources = ROOT/'resources/index.html'
    original = resources.read_text()
    cards = ''.join(f'<article><a href="/{a["slug"]}/"><img src="{a["image"]["path"]}" alt="{escape(a["image"]["alt"])}" width="480" height="320" loading="lazy"><h3>{escape(a["title"])}</h3></a><p>{escape(a["description"])}</p></article>' for a in sorted(articles,key=lambda a:a['published'],reverse=True))
    block = '<!-- KRH-GROWTH-START --><section class="growth growth-library"><h2>Practice planning guides</h2><p>Practical checks and tools for independently owned eye clinics.</p><div class="growth-cards">'+cards+'</div><p><a href="/feed.xml">Resource RSS feed</a></p></section><!-- KRH-GROWTH-END -->'
    if '<!-- KRH-GROWTH-START -->' in original:
        updated = re.sub(r'<!-- KRH-GROWTH-START -->.*?<!-- KRH-GROWTH-END -->',lambda _:block,original,flags=re.S)
    else:
        updated = original.replace('</main>', block+'</main>')
    if '/assets/growth.css' not in updated:
        updated = updated.replace('</head>','<link rel="stylesheet" href="/assets/growth.css"><link rel="alternate" type="application/rss+xml" title="KRH resources" href="/feed.xml"></head>')
    if '/assets/growth.js' not in updated:
        updated = updated.replace('</body>','<script src="/assets/growth.js" defer></script></body>')
    if write_changed(resources,updated):
        changed[BASE+'/resources/'] = dt.date.today().isoformat()
    tree = ET.parse(ROOT/'sitemap.xml')
    existing = {e.find(f'{{{NS}}}loc').text:e for e in tree.getroot()}
    for a in articles:
        url = f"{BASE}/{a['slug']}/"
        if url not in existing: changed[url]=a['modified']
    for url, date in changed.items():
        el = existing.get(url)
        if el is None:
            el = ET.SubElement(tree.getroot(),f'{{{NS}}}url')
            ET.SubElement(el,f'{{{NS}}}loc').text=url
        mod = el.find(f'{{{NS}}}lastmod')
        if mod is None: mod = ET.SubElement(el,f'{{{NS}}}lastmod')
        mod.text=date
    if changed: tree.write(ROOT/'sitemap.xml',encoding='utf-8',xml_declaration=True)
    # Keep the existing resource archive when adding or revising managed articles.
    feed = ROOT/'feed.xml'
    rss = ET.parse(feed).getroot()
    channel = rss.find('channel')
    items = {item.findtext('link'): item for item in channel.findall('item')}
    for article in sorted(articles, key=lambda entry: entry['published']):
        url = f"{BASE}/{article['slug']}/"
        item = items.get(url)
        if item is None:
            item = ET.Element('item')
            first_item = channel.find('item')
            position = len(channel) if first_item is None else list(channel).index(first_item)
            channel.insert(position, item)
        published = dt.date.fromisoformat(article['published'])
        for tag, value in [('title', article['title']), ('link', url), ('guid', url),
                           ('pubDate', published.strftime('%a, %d %b %Y 00:00:00 +0000')),
                           ('description', article['description'])]:
            element = item.find(tag)
            if element is None:
                element = ET.SubElement(item, tag)
            element.text = value
    write_changed(feed, ET.tostring(rss, encoding='utf-8', xml_declaration=True).decode('utf-8') + '\n')
    print(json.dumps({'articles':len(articles),'changed_urls':list(changed)}))

if __name__ == '__main__': build()
