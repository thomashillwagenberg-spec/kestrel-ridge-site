#!/usr/bin/env python3
"""Build step: write a Markdown copy of every sitemap page and keep llms.txt in sync.

For each <loc> in sitemap.xml:
  * writes <path>/index.md with the page's main content only (no nav/footer/scripts/forms);
  * on plain-HTML pages (no Next.js flight data) inserts
    <link rel="alternate" type="text/markdown" href=".../index.md"> into <head> (idempotent).
    Next.js pages get that link from source metadata, never by editing build output.
Rewrites the generated block of llms.txt between the AUTOGEN markers: every sitemap URL
(slash form) plus its .md copy. Hand-written llms.txt text outside the markers is kept.
_headers serves *.md with X-Robots-Tag: noindex.

Usage: python3 scripts/gen_markdown.py [--root DIR] [--check]
  --check: exit 1 if anything would change (CI drift guard).
"""
import argparse, html, re, sys
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Tag

SITE = "https://kestrelridgehealth.com"
BEGIN = "<!-- AUTOGEN:pages BEGIN (scripts/gen_markdown.py; do not edit by hand) -->"
END = "<!-- AUTOGEN:pages END -->"
DROP = ["script", "style", "noscript", "svg", "nav", "header", "footer", "form", "button",
        "template", "iframe", "dialog", "aside[aria-hidden=true]"]


def inline(node):
    if isinstance(node, NavigableString):
        return re.sub(r"\s+", " ", str(node))
    if not isinstance(node, Tag):
        return ""
    t = node.name
    inner = "".join(inline(c) for c in node.children)
    if t in ("strong", "b"):
        return f"**{inner.strip()}**" if inner.strip() else ""
    if t in ("em", "i"):
        return f"*{inner.strip()}*" if inner.strip() else ""
    if t == "code":
        return f"`{inner.strip()}`"
    if t == "br":
        return "  \n"
    if t == "a":
        href = node.get("href", "")
        txt = inner.strip()
        if not txt:
            return ""
        if href.startswith("/"):
            href = SITE + href
        return f"[{txt}]({href})" if href and not href.startswith("#") else txt
    if t == "img":
        alt = node.get("alt", "").strip()
        return f"![{alt}]({SITE + node['src'] if node.get('src','').startswith('/') else node.get('src','')})" if alt else ""
    return inner


def block(node, out, depth=0):
    for c in node.children:
        if isinstance(c, NavigableString):
            s = str(c).strip()
            if s:
                out.append(re.sub(r"\s+", " ", s))
            continue
        if not isinstance(c, Tag):
            continue
        t = c.name
        if t and re.fullmatch(r"h[1-6]", t):
            txt = inline(c).strip()
            if txt:
                out.append("#" * int(t[1]) + " " + txt)
        elif t == "p":
            txt = inline(c).strip()
            if txt:
                out.append(txt)
        elif t in ("ul", "ol"):
            items = []
            for i, li in enumerate(c.find_all("li", recursive=False), 1):
                sub = []
                block(li, sub, depth + 1) if li.find(["p", "ul", "ol", "div"]) else sub.append(inline(li).strip())
                txt = " ".join(x for x in sub if x).strip()
                if txt:
                    items.append("  " * depth + (f"{i}. " if t == "ol" else "- ") + txt)
            if items:
                out.append("\n".join(items))
        elif t == "table":
            rows = []
            for tr in c.find_all("tr"):
                cells = [inline(td).strip().replace("|", "\\|") for td in tr.find_all(["th", "td"])]
                rows.append("| " + " | ".join(cells) + " |")
                if len(rows) == 1:
                    rows.append("|" + "---|" * len(cells))
            if rows:
                out.append("\n".join(rows))
        elif t == "blockquote":
            sub = []
            block(c, sub, depth)
            out.append("\n".join("> " + l for l in "\n\n".join(sub).splitlines()))
        elif t in ("pre",):
            out.append("```\n" + c.get_text() + "\n```")
        elif t in ("dl",):
            for el in c.find_all(["dt", "dd"]):
                txt = inline(el).strip()
                if txt:
                    out.append(("**" + txt + "**") if el.name == "dt" else txt)
        elif t == "figure":
            cap = c.find("figcaption")
            img = c.find("img")
            if img is not None:
                s = inline(img)
                if s:
                    out.append(s)
            if cap:
                out.append("*" + inline(cap).strip() + "*")
        elif t in ("img",):
            s = inline(c)
            if s:
                out.append(s)
        else:  # div/section/article/span/etc: descend
            if c.find(["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "table", "div", "section", "blockquote", "dl", "figure"]):
                block(c, out, depth)
            else:
                txt = inline(c).strip()
                if txt:
                    out.append(txt)


def page_md(path: Path, url: str):
    soup = BeautifulSoup(path.read_text(), "html.parser")
    title = (soup.title.string or "").strip() if soup.title else ""
    desc_el = soup.find("meta", attrs={"name": "description"})
    desc = desc_el["content"].strip() if desc_el and desc_el.get("content") else ""
    main = soup.find("main") or soup.find("article") or soup.body
    for sel in DROP:
        for el in main.select(sel):
            el.decompose()
    for el in main.select("[aria-hidden=true], .sr-only-focusable, [data-md-skip]"):
        el.decompose()
    out = []
    block(main, out)
    body = "\n\n".join(x.strip() for x in out if x.strip())
    body = re.sub(r"\n{3,}", "\n\n", body)
    head = f"---\ntitle: {json_str(title)}\nurl: {url}\n" + (f"description: {json_str(desc)}\n" if desc else "") + "---\n\n"
    return title, desc, head + body.strip() + "\n"


def json_str(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def ensure_alt_link(path: Path, md_url: str, check: bool):
    s = path.read_text()
    if "self.__next_f" in s:
        return False  # Next.js page: link comes from source metadata
    tag = f'<link rel="alternate" type="text/markdown" href="{md_url}"/>'
    if 'type="text/markdown"' in s:
        new = re.sub(r'<link rel="alternate" type="text/markdown" href="[^"]*"\s*/?>', tag, s, count=1)
    else:
        m = re.search(r'<link rel="canonical"[^>]*>', s)
        new = s[: m.end()] + tag + s[m.end():] if m else s.replace("</head>", tag + "</head>", 1)
    if new != s:
        if not check:
            path.write_text(new)
        return True
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=str(Path(__file__).resolve().parent.parent))
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    root = Path(a.root)
    urls = re.findall(r"<loc>([^<]+)</loc>", (root / "sitemap.xml").read_text())
    changed, lines = [], []
    for url in urls:
        rel = url.replace(SITE, "").strip("/")
        html_path = root / rel / "index.html" if rel else root / "index.html"
        md_path = html_path.with_name("index.md")
        md_url = f"{SITE}/{rel + '/' if rel else ''}index.md"
        title, desc, md = page_md(html_path, url)
        if not md_path.exists() or md_path.read_text() != md:
            changed.append(str(md_path.relative_to(root)))
            if not a.check:
                md_path.write_text(md)
        if ensure_alt_link(html_path, md_url, a.check):
            changed.append(str(html_path.relative_to(root)) + " (alternate link)")
        name = re.sub(r"\s*[|\u2013\u2014-]\s*Kestrel Ridge Health\s*$", "", title) or url
        lines.append(f"- [{name}]({url}) ([markdown]({md_url})): {desc}" if desc else f"- [{name}]({url}) ([markdown]({md_url}))")
    llms = root / "llms.txt"
    s = llms.read_text()
    blockt = f"{BEGIN}\n## All pages ({len(urls)}, with Markdown copies)\n" + "\n".join(lines) + f"\n{END}"
    new = re.sub(re.escape(BEGIN) + r".*?" + re.escape(END), lambda _: blockt, s, flags=re.S) if BEGIN in s else s.rstrip() + "\n\n" + blockt + "\n"
    if new != s:
        changed.append("llms.txt")
        if not a.check:
            llms.write_text(new)
    print(f"{len(urls)} pages; {len(changed)} change(s)")
    for c in changed:
        print("  " + c)
    if a.check and changed:
        sys.exit(1)


if __name__ == "__main__":
    main()
