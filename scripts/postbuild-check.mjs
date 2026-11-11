#!/usr/bin/env node
// Post-build gate: load every sitemap URL in headless Chromium and FAIL on any
// console error / page exception, crash screen, empty <title>, or missing/wrong canonical.
// Also reports H1 count, heading-level skips, JSON-LD count and the text/markdown alternate.
//
// Usage:
//   node scripts/postbuild-check.mjs [--base http://127.0.0.1:8830] [--json out.json]
// --base rewrites https://kestrelridgehealth.com to a local server (serve the repo ROOT,
// e.g. `python3 -m http.server 8830 -d .`). Omit --base to test production.
// Playwright: uses `playwright` if resolvable, else PLAYWRIGHT_MODULE=<path to playwright/index.mjs>.
// Chromium: PW_EXE=<chrome-headless-shell path> optional.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const BASE = opt('--base', '');
const JSON_OUT = opt('--json', '');
const SITE = 'https://kestrelridgehealth.com';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

let pw;
try { pw = await import('playwright'); }
catch {
  const p = process.env.PLAYWRIGHT_MODULE ||
    path.join(process.env.HOME, 'Developer/krh-qa/node_modules/playwright/index.mjs');
  pw = await import(pathToFileURL(p).href);
}
const { chromium } = pw;

const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
if (urls.length === 0) { console.error('No URLs in sitemap.xml'); process.exit(2); }

const IGNORE = [/cloudflareinsights\.com/i, /beacon\.min\.js/i, /googletagmanager/i];
// When testing a local/staging build (--base set, i.e. not the real production
// origin), Cloudflare Turnstile's challenge iframe legitimately 400s because the
// widget's sitekey is registered only to the production domain. That is Cloudflare's
// own domain-validation response, not an application defect, and the contact form
// already degrades gracefully (see data-krh-ts-status / error-callback in the form
// component). Only ignore it off production so a real production regression still fails.
if (BASE) IGNORE.push(/challenges\.cloudflare\.com/i);
const browser = await chromium.launch(process.env.PW_EXE ? { executablePath: process.env.PW_EXE } : {});
const results = [];
for (const url of urls) {
  const target = BASE ? url.replace(SITE, BASE.replace(/\/$/, '')) : url;
  const page = await browser.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.some(r => r.test(m.text() + (m.location()?.url || '')))) errs.push('console: ' + m.text().slice(0, 300)); });
  page.on('pageerror', e => errs.push('pageerror: ' + String(e.message || e).slice(0, 300)));
  let status = 0;
  try {
    // 'networkidle' is not viable here: /contact/'s Turnstile widget schedules an
    // automatic retry loop (reset + poll) whenever its challenge fails to resolve
    // (e.g. a sitekey/domain mismatch on a non-production --base, or any real
    // widget failure), which keeps a connection open indefinitely and was timing
    // out this check at 45s. 'load' + the explicit settle wait below is enough to
    // let hydration run without depending on third-party polling going quiet.
    const resp = await page.goto(target, { waitUntil: 'load', timeout: 45000 });
    status = resp ? resp.status() : 0;
    await page.waitForTimeout(1500); // let hydration finish / crash
  } catch (e) { errs.push('navigation: ' + e.message.slice(0, 200)); }
  const d = await page.evaluate(() => {
    const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => +h.tagName[1]);
    const skips = []; for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) skips.push(`h${hs[i - 1]}->h${hs[i]}`);
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')];
    let ldBad = 0; for (const s of ld) { try { JSON.parse(s.textContent); } catch { ldBad++; } }
    const md = document.querySelector('link[rel="alternate"][type="text/markdown"]');
    return {
      title: document.title.trim(),
      description: document.querySelector('meta[name="description"]')?.content?.trim() || '',
      canonical: document.querySelector('link[rel="canonical"]')?.href || '',
      h1: hs.filter(x => x === 1).length, skips,
      jsonld: ld.length, jsonldInvalid: ldBad,
      md: md ? md.getAttribute('href') : '',
      crashed: /This page couldn.t load|Application error/i.test(document.body?.innerText || ''),
      words: (document.body?.innerText || '').split(/\s+/).filter(Boolean).length,
    };
  }).catch(e => ({ evalError: e.message }));
  await page.close();
  const fail = [];
  if (status !== 200) fail.push(`HTTP ${status}`);
  if (errs.length) fail.push(`${errs.length} console error(s)`);
  if (d.crashed) fail.push('crash screen');
  if (!d.title) fail.push('empty <title>');
  if (!d.canonical) fail.push('missing canonical');
  else if (d.canonical !== url) fail.push(`canonical ${d.canonical} != ${url}`);
  if (d.jsonldInvalid) fail.push(`${d.jsonldInvalid} invalid JSON-LD`);
  const warn = [];
  if (d.h1 !== 1) warn.push(`H1 count ${d.h1}`);
  if (d.skips?.length) warn.push(`heading skips ${d.skips.join(',')}`);
  if (!d.md) warn.push('no text/markdown alternate');
  if (!d.description) warn.push('no meta description');
  results.push({ url, status, ...d, errors: errs, fail, warn });
  console.log(`${fail.length ? 'FAIL' : 'ok  '} ${url.replace(SITE, '')}  errs=${errs.length} h1=${d.h1} jsonld=${d.jsonld} md=${d.md ? 'y' : 'n'} words=${d.words}` +
    (fail.length ? `  [${fail.join('; ')}]` : '') + (warn.length ? `  (warn: ${warn.join('; ')})` : ''));
  for (const e of errs.slice(0, 3)) console.log('      ' + e);
}
await browser.close();
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(results, null, 2));
const failed = results.filter(r => r.fail.length);
console.log(`\n${results.length} URLs, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
