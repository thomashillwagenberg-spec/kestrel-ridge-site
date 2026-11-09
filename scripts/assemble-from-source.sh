#!/usr/bin/env bash
# Reproducibly replace the Next.js build output in this deploy repo with a fresh
# static export from the source project (~/Developer/kestrel-ridge-source).
#
#   scripts/assemble-from-source.sh [SOURCE_DIR]
#
# 1. runs `next build` (output: export) in SOURCE_DIR
# 2. for every Next route in out/: replaces index.html, index.txt and any
#    __next.* RSC segment files; keeps non-Next files (index.md etc.)
# 3. replaces 404.html and the whole _next/ directory, except files under
#    _next/ that plain-HTML pages (built by .growth/build.py) still reference
# 4. copies out/krh/ (stable, non-_next mobile assets) and merges out/downloads/
# 5. regenerates .md copies and runs the RSC + slash-link checks (verify only)
# Never hand-edit the output this produces; change the source and re-run.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-$HOME/Developer/kestrel-ridge-source}"
NODE_BIN="${NODE_BIN:-$HOME/.hermes/tools/node-26.7.0-darwin-arm64/bin}"
export PATH="$NODE_BIN:$PATH"

( cd "$SRC" && rm -rf .next out && npx next build )
OUT="$SRC/out"

python3 - "$ROOT" "$OUT" <<'PY'
import os, re, shutil, sys
from pathlib import Path
root, out = Path(sys.argv[1]), Path(sys.argv[2])

next_routes = sorted(p.name for p in out.iterdir()
                     if p.is_dir() and (p / "index.html").exists() and p.name not in ("krh", "_next", "_not-found", "404"))

# _next files still referenced by plain-HTML (non-Next) pages
keep = set()
for html in root.rglob("index.html"):
    rel = html.relative_to(root)
    if rel.parts[0] in next_routes or rel.parts[0] in ("_next", "node_modules", ".git"):
        continue
    for m in re.finditer(r'/_next/[^"\'\s)>]+', html.read_text(errors="ignore")):
        keep.add(m.group(0).lstrip("/"))
for css in list(keep):
    p = root / css
    if p.suffix == ".css" and p.exists():
        for m in re.finditer(r'url\(([^)]+)\)', p.read_text(errors="ignore")):
            u = m.group(1).strip("'\"")
            if u.startswith("/_next/"):
                keep.add(u.lstrip("/"))
            elif not u.startswith(("data:", "http", "/")):
                keep.add(os.path.normpath(os.path.join(os.path.dirname(css), u)))
saved = {k: (root / k).read_bytes() for k in keep if (root / k).is_file()}

shutil.rmtree(root / "_next", ignore_errors=True)
shutil.copytree(out / "_next", root / "_next")
for k, b in saved.items():
    t = root / k
    if not t.exists():
        t.parent.mkdir(parents=True, exist_ok=True)
        t.write_bytes(b)

for r in next_routes:
    d = root / r
    d.mkdir(exist_ok=True)
    for f in d.iterdir():
        if f.is_file() and (f.name in ("index.html", "index.txt") or f.name.startswith("__next")):
            f.unlink()
        elif f.is_dir() and f.name.startswith("__next"):
            shutil.rmtree(f)
    for f in (out / r).iterdir():
        dst = d / f.name
        if f.is_dir():
            shutil.copytree(f, dst, dirs_exist_ok=True)
        else:
            shutil.copy2(f, dst)

# public/downloads from source (merge: plain-page downloads stay in place)
if (out / "downloads").is_dir():
    (root / "downloads").mkdir(exist_ok=True)
    for f in (out / "downloads").iterdir():
        if f.is_file():
            shutil.copy2(f, root / "downloads" / f.name)

shutil.copy2(out / "404.html", root / "404.html")
shutil.rmtree(root / "krh", ignore_errors=True)
shutil.copytree(out / "krh", root / "krh")
print("next routes:", " ".join(next_routes))
print("kept _next files for plain pages:", len(saved))
PY

cd "$ROOT"
# gen_markdown.py needs bs4; pick the first python3 that has it
PY_MD=""
for c in python3 /usr/bin/python3 /opt/homebrew/bin/python3; do
  if command -v "$c" >/dev/null 2>&1 && "$c" -c 'import bs4' 2>/dev/null; then PY_MD="$c"; break; fi
done
[ -n "$PY_MD" ] || { echo "no python3 with bs4 found (pip install beautifulsoup4)" >&2; exit 1; }
"$PY_MD" scripts/gen_markdown.py --root .
# verification only (no --fix): the clean build must not need RSC length repair
python3 scripts/check_rsc_payload.py
# slash-link check reads `git ls-files`, so stage the new output first
git add -A .
python3 scripts/check_slash_links.py
