#!/usr/bin/env python3
"""Fail if built output references a site page without its ending slash (e.g. "/contact").
Non-JS scanners pick URLs out of HTML, Next flight data (.txt) and JS chunks; a slash-less
address costs them a 301 hop and some scanners drop it. Usage: python3 scripts/check_slash_links.py"""
import re, subprocess, sys
from pathlib import Path
root = Path(__file__).resolve().parent.parent
pages = [l.replace("https://kestrelridgehealth.com/", "").strip("/") for l in
         re.findall(r"<loc>([^<]+)</loc>", (root / "sitemap.xml").read_text())]
pages = [p for p in pages if p] + ["methodology"]
rx = re.compile(r"""["'(]/(%s)["')]""" % "|".join(map(re.escape, sorted(pages, key=len, reverse=True))))
files = subprocess.run(["git", "ls-files", "-co", "--exclude-standard"], cwd=root, capture_output=True, text=True).stdout.split()
bad = {}
for f in files:
    if not f.endswith((".html", ".txt", ".js", ".xml", ".json")) or f.startswith(("node_modules/", ".growth/", "scripts/", "tests/")):
        continue
    hits = sorted(set(m.group(1) for m in rx.finditer((root / f).read_text(errors="ignore"))))
    if hits:
        bad[f] = hits
for f, h in sorted(bad.items()):
    print(f"{f}: /" + ", /".join(h))
print(f"{len(bad)} file(s) with slash-less page links")
sys.exit(1 if bad else 0)
