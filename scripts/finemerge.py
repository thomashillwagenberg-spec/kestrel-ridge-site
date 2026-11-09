#!/usr/bin/env python3
"""Fine-grained 3-way merge for minified HTML (one huge line).
Splits base/ours/theirs into small tokens, runs `git merge-file`, rejoins.
Usage (during a conflicted merge): python3 scripts/finemerge.py file...
Exit 1 if real conflicts remain (file left with markers)."""
import os, re, subprocess, sys, tempfile

SPLIT = re.compile(r'(?<=>)|(?=<)|(?<=\\n)|(?<=\. )|(?<=,")')
MARK = '\u2063'


def show(stage, f):
    return subprocess.run(['git', 'show', f':{stage}:{f}'], capture_output=True, text=True, check=True).stdout


def tok(s):
    return '\n'.join(p.replace('\n', MARK) for p in SPLIT.split(s) if p != '') + '\n'


rc = 0
for f in sys.argv[1:]:
    with tempfile.TemporaryDirectory() as d:
        paths = []
        for stage, name in ((2, 'ours'), (1, 'base'), (3, 'theirs')):
            p = os.path.join(d, name)
            open(p, 'w', encoding='utf-8').write(tok(show(stage, f)))
            paths.append(p)
        r = subprocess.run(['git', 'merge-file', '-p', *paths], capture_output=True, text=True)
        out = r.stdout
        if r.returncode != 0:
            rc = 1
            print(f'CONFLICT {f}: {r.returncode} hunks')
            open(f + '.finemerge', 'w', encoding='utf-8').write(out)
            continue
        merged = ''.join(out.split('\n')).replace(MARK, '\n')
        open(f, 'w', encoding='utf-8').write(merged)
        print(f'clean {f}')
sys.exit(rc)
