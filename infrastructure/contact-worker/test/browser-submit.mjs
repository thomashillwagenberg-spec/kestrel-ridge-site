// Real-browser submission test for the contact form (release blocker B1).
//
// Usage: node infrastructure/contact-worker/test/browser-submit.mjs [--sitekey real|test]
// Needs: playwright (npm i --no-save playwright@1 && npx playwright install chromium)
//
// What is real: Chromium, the committed /contact/ page and its JS chunks, the
// real Cloudflare Turnstile api.js and challenge, the browser's own POST body,
// and the real Worker code (src/worker.mjs) handling that body.
// The page is served under https://kestrelridgehealth.com via request
// routing so the origin and hostname match production.
//
// What is NOT real (and cannot be without the production secret):
// Siteverify. The stub answers with the action the browser actually passed
// to turnstile.render() (recorded by a spy, never invented) and the page
// hostname. The remaining production proof is the staged-version acceptance
// test in PROD-ACCEPTANCE-TESTS.md, run before any version is promoted.
//
// --sitekey test swaps ONLY the sitekey for Cloudflare's documented
// always-pass test key (1x00000000000000000000AA), keeping every other
// render option, for runners where the managed challenge will not issue a
// token to headless Chromium.
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import worker from "../src/worker.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const MODE = process.argv.includes("--sitekey") ? process.argv[process.argv.indexOf("--sitekey") + 1] : "real";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml",
  ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2", ".json": "application/json", ".txt": "text/plain", ".ico": "image/x-icon" };

function local(pathname) {
  let p = join(REPO, decodeURIComponent(pathname));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, "index.html");
  return existsSync(p) ? p : null;
}

const result = { mode: MODE, renderOptions: null, tokenIssued: false, postBody: null, workerStatus: null, siteverifyCalls: 0 };
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.addInitScript(({ mode }) => {
    // Spy (not mock): wrap the real turnstile.render to record its options.
    // A capture-phase load listener on document runs before the page's own
    // load listener on the api.js <script>, so the wrap is in place before
    // the page calls render().
    const wrap = () => {
      const v = window.turnstile;
      if (!v || v.__krhSpy) return;
      const orig = v.render.bind(v);
      v.render = (el, opts) => {
        const { callback, ["expired-callback"]: _e, ["error-callback"]: _x, ...plain } = opts;
        window.__krhRender = JSON.parse(JSON.stringify(plain));
        const o = { ...opts };
        if (mode === "test") o.sitekey = "1x00000000000000000000AA";
        o.callback = (t) => { window.__krhToken = t; return callback && callback(t); };
        return orig(el, o);
      };
      v.__krhSpy = true;
    };
    document.addEventListener("load", (e) => {
      if (e.target?.src?.includes("challenges.cloudflare.com/turnstile/")) wrap();
    }, true);
  }, { mode: MODE });

  await page.route("https://kestrelridgehealth.com/**", async (route) => {
    const url = new URL(route.request().url());
    const f = local(url.pathname);
    if (!f) return route.fulfill({ status: 404, body: "not found" });
    return route.fulfill({ status: 200, body: await readFile(f), headers: { "content-type": TYPES[extname(f)] || "application/octet-stream" } });
  });

  // The browser's real POST goes to the real Worker code.
  await page.route("https://krh-contact-inquiries.thomas-ec7.workers.dev/**", async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") {
      const r = await worker.fetch(new Request(req.url(), { method: "OPTIONS", headers: req.headers() }), env());
      return route.fulfill({ status: r.status, headers: Object.fromEntries(r.headers) });
    }
    result.postBody = Object.fromEntries(new URLSearchParams(req.postData() || ""));
    const old = globalThis.fetch;
    globalThis.fetch = async (u, init) => {
      const href = typeof u === "string" ? u : u.url;
      if (href.includes("siteverify")) {
        result.siteverifyCalls++;
        const r = { success: init.body.get("response") === result.token, hostname: "kestrelridgehealth.com" };
        if (result.renderOptions && "action" in result.renderOptions) r.action = result.renderOptions.action;
        return new Response(JSON.stringify(r));
      }
      if (href.includes("api.resend.com")) return new Response('{"id":"synthetic"}');
      throw new Error("unexpected fetch " + href);
    };
    try {
      const r = await worker.fetch(new Request(req.url(), { method: "POST", headers: req.headers(), body: req.postData() }), env());
      result.workerStatus = r.status;
      return route.fulfill({ status: r.status, body: await r.text(), headers: Object.fromEntries(r.headers) });
    } finally { globalThis.fetch = old; }
  });

  await page.goto("https://kestrelridgehealth.com/contact/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__krhRender, null, { timeout: 30000 });
  result.renderOptions = await page.evaluate(() => window.__krhRender);
  try {
    await page.waitForFunction(() => window.__krhToken, null, { timeout: 45000 });
    result.token = await page.evaluate(() => window.__krhToken);
    result.tokenIssued = true;
  } catch { /* reported below */ }

  if (result.tokenIssued) {
    await page.fill('form [name="name"]', "Synthetic Browser Tester");
    await page.fill('form [name="org"]', "Synthetic Eye Practice");
    await page.fill('form [name="email"]', "synthetic@example.com");
    await page.fill('form [name="message"]', "Synthetic real-browser contract test, not an enquiry.");
    await page.click('form button[type="submit"]');
    await page.waitForFunction(() => document.body.innerText.includes("Received. We will reply by email.")
      || document.body.innerText.includes("did not send"), null, { timeout: 20000 });
    result.uiConfirmation = (await page.evaluate(() => document.body.innerText)).includes("Received. We will reply by email.");
  }
} finally {
  await browser.close();
}

function env() {
  return {
    ENVIRONMENT: "production", RESEND_API_KEY: "synthetic", TURNSTILE_SECRET: "synthetic",
    SENDER_FROM: "KRH Contact <notifications@kestrelridgehealth.com>",
    RATE_LIMITER: { limit: async () => ({ success: true }) },
    WAITLIST_RATE_LIMITER: { limit: async () => ({ success: true }) },
  };
}

const report = { ...result, token: result.token ? `${result.token.slice(0, 12)}... (${result.token.length} chars)` : null };
console.log(JSON.stringify(report, null, 2));
const pass = result.tokenIssued && result.renderOptions?.action === "krh_contact" && result.postBody?.turnstileToken === result.token
  && result.siteverifyCalls === 1 && result.workerStatus === 202 && result.uiConfirmation === true;
console.log(pass ? "BROWSER SUBMIT: PASS" : "BROWSER SUBMIT: FAIL");
process.exit(pass ? 0 : 1);
