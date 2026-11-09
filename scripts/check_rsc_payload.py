#!/usr/bin/env python3
"""Validate (and optionally repair) inline Next.js RSC flight payloads in exported HTML.

Hand-editing copy inside self.__next_f.push([1,"..."]) chunks breaks hydration when a
text row ("<id>:T<hexlen>,<text>") changes length: React reads <hexlen> UTF-8 bytes, so the
stream desyncs and the page shows "This page couldn't load" (React error #412).

Usage:
  python3 scripts/check_rsc_payload.py [--fix] [files...]   (default: every **/index.html)
Exit 1 if any file is invalid (after fixing, if --fix).
"""
import glob, json, re, sys

PUSH = re.compile(r'self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)')


def chunks(html):
    return [(m.start(1), m.end(1), json.loads(m.group(1))) for m in PUSH.finditer(html)]


def scan(stream):
    """Walk the flight stream. Return list of (T-row start, declared len, actual len)."""
    b = stream.encode('utf-8')
    i, bad = 0, []
    row = re.compile(rb'([0-9a-f]*):')
    while i < len(b):
        m = row.match(b, i)
        if not m:
            return bad, f'unparseable at byte {i}: {b[i:i+60]!r}'
        j = m.end()
        if b[j:j+1] == b'T':
            k = b.index(b',', j)
            n = int(b[j+1:k], 16)
            start = k + 1
            # actual text ends at the next row header that follows a newline-free text;
            # T rows are not newline terminated, so find the declared end and check alignment
            end = start + n
            nxt = row.match(b, end)
            if not nxt:
                # find the true end: the next "<hex>:" row header that parses validly
                cand = [mm.start() for mm in re.finditer(rb'(?<=[^\n])?([0-9a-f]+):(?:[\[{"$TIHDE]|null)', b[start:])]
                bad.append((i, n, start))
                return bad, None
            i = end
        else:
            nl = b.find(b'\n', j)
            if nl < 0:
                return bad, None
            i = nl + 1
    return bad, None


def true_len(b, start):
    """Find the real byte length of a T row starting at `start`.
    JSON text (JSON-LD) -> raw_decode; otherwise the smallest end where the rest parses."""
    txt = b[start:].decode('utf-8', 'surrogatepass')
    try:
        _, end = json.JSONDecoder().raw_decode(txt)
        return len(txt[:end].encode('utf-8'))
    except ValueError:
        pass
    hdr = re.compile(rb'[0-9a-f]*:')
    for m in hdr.finditer(b, start):
        rest = b[m.start():].decode('utf-8')
        bad, err = scan(rest)
        if not bad and not err:
            return m.start() - start
    return None


def repair(html):
    """Rewrite bad T-row headers in place. Returns (html, fixes)."""
    fixes = []
    for _ in range(50):
        stream = ''.join(c[2] for c in chunks(html)).encode('utf-8')
        bad, err = scan(stream.decode('utf-8'))
        if not bad:
            break
        row_start, declared, start = bad[0]
        header = stream[row_start:start].decode()          # e.g. "16:T5c4,"
        n = true_len(stream, start)
        if n is None:
            break
        new = re.sub(r'T[0-9a-f]+,$', 'T%x,' % n, header)
        if html.count(header) != 1:
            raise SystemExit(f'header {header!r} not unique in raw HTML; fix by hand')
        html = html.replace(header, new)
        fixes.append((header, new))
    return html, fixes


def repair_txt(s):
    fixes = []
    for _ in range(50):
        bad, err = scan(s)
        if not bad:
            break
        row_start, declared, start = bad[0]
        b = s.encode('utf-8')
        header = b[row_start:start].decode()
        n = true_len(b, start)
        if n is None:
            break
        new = re.sub(r'T[0-9a-f]+,$', 'T%x,' % n, header)
        s = (b[:row_start].decode() + new + b[start:].decode())
        fixes.append((header, new))
    return s, fixes


def main():
    if '--txt' in sys.argv:
        failed = 0
        for f in sorted(glob.glob('**/*.txt', recursive=True)):
            if f.startswith(('node_modules', '_next', 'docs')):
                continue
            s = open(f, encoding='utf-8').read()
            if ':T' not in s:
                continue
            if '--fix' in sys.argv:
                s2, fx = repair_txt(s)
                if fx:
                    open(f, 'w', encoding='utf-8').write(s2)
                    print(f'FIXED {f}: {fx}')
                    s = s2
            bad, err = scan(s)
            if bad or err:
                failed += 1
                print(f'FAIL {f}: {err or ""} {bad[:2]}')
        print('txt failures:', failed)
        sys.exit(1 if failed else 0)
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    files = args or sorted(glob.glob('**/index.html', recursive=True)) + ['index.html']
    files = [f for f in dict.fromkeys(files) if not f.startswith(('node_modules', '_next'))]
    failed = 0
    for f in files:
        html = open(f, encoding='utf-8').read()
        cs = chunks(html)
        if not cs:
            continue
        if '--fix' in sys.argv:
            html2, fixes = repair(html)
            if fixes:
                open(f, 'w', encoding='utf-8').write(html2)
                print(f'FIXED {f}: {fixes}')
                html = html2
            cs = chunks(html)
        stream = ''.join(c[2] for c in cs)
        bad, err = scan(stream)
        if bad or err:
            failed += 1
            print(f'FAIL {f}: {err or ""} T-row mismatches={bad[:3]}')
        else:
            print(f'ok   {f}')
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
