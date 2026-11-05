#!/usr/bin/env python3
"""Read aggregate feedback through owner-authorized Wrangler; write only outside the public repo."""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser()
p.add_argument('--output', required=True, type=Path)
p.add_argument('--wrangler', default=shutil.which('wrangler'))
a = p.parse_args()
out = a.output.resolve()
if ROOT == out or ROOT in out.parents:
    p.error('Private feedback reports must be written outside the public repository')
if not a.wrangler:
    p.error('Pass the path of the installed authenticated Wrangler executable')
config = ROOT/'infrastructure/reader-feedback/wrangler.jsonc'
sql = ' '.join(line for line in (config.parent/'report.sql').read_text().splitlines() if not line.lstrip().startswith('--'))
# --command returns SELECT results; --file uses the bulk importer, which does not.
r = subprocess.run([a.wrangler, 'd1', 'execute', 'krh-reader-feedback', '--config', str(config),
                    '--remote', '--command', sql, '--json'], capture_output=True, text=True)
if r.returncode:
    raise SystemExit('Feedback reporting unavailable: authenticated database query failed. No zero-response report was written.')
try:
    result = json.loads(r.stdout)
    assert result and all(part.get('success') for part in result)
    rows = [row for part in result for row in part['results']]
except (ValueError, KeyError, AssertionError):
    raise SystemExit('Feedback reporting unavailable: unexpected database response. Existing report preserved.')
report = {'checked_at': dt.datetime.now(dt.timezone.utc).isoformat(), 'status': 'available',
          'window_days': 28, 'timezone': 'UTC', 'articles': rows,
          'responses': sum(row['responses'] for row in rows),
          'limitations': 'Voluntary self-selected responses. Identity unverified. Browser deduplication can be circumvented. No causal SEO or commercial attribution.'}
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({'status': 'available', 'responses': report['responses'], 'private_report': str(out)}))
