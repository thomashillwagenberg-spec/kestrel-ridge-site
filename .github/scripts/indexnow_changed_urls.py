#!/usr/bin/env python3
"""
Reads a list of changed files (one per line) from stdin and a sitemap.xml in CWD.
Prints a JSON array of sitemap URLs that correspond to changed files.
If sitemap.xml itself is in the changed list, prints all sitemap URLs.
Args: HOST
"""
import sys, json, xml.etree.ElementTree as ET

host = sys.argv[1]
changed_files = set(sys.stdin.read().splitlines())

ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
root = ET.parse("sitemap.xml").getroot()
all_urls = [el.text.strip() for el in root.findall("s:url/s:loc", ns)]

if "sitemap.xml" in changed_files:
    sys.stderr.write("sitemap.xml changed -- submitting all URLs\n")
    print(json.dumps(all_urls))
    sys.exit(0)

def url_to_candidate_files(url):
    path = url.replace(f"https://{host}", "").strip("/")
    if not path:
        return ["index.html"]
    return [f"{path}/index.html", f"{path}.html"]

changed_urls = [
    url for url in all_urls
    if any(c in changed_files for c in url_to_candidate_files(url))
]
print(json.dumps(changed_urls))
