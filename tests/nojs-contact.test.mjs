import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// This is a static-export regression test, NOT proof of real mail delivery.
// It ensures browsers with JavaScript turned OFF cannot natively submit the
// contact or legacy waitlist form as GET query parameters.
const html = readFileSync(new URL("../contact/index.html", import.meta.url), "utf8");
const forms = [...html.matchAll(/<form\b[^>]*>/gi)].map((m) => m[0]);

test("contact export has exactly the expected two form openings", () => {
  assert.equal(forms.length, 2, "Unexpected form count: manually review markup");
});

for (let i = 0; i < forms.length; i++) {
  test(`form ${i + 1} cannot use an implicit GET fallback`, () => {
    const tag = forms[i];
    assert.match(tag, /\bmethod=["']post["']/i);
    assert.match(tag, /\benctype=["']text\/plain["']/i);
    assert.match(
      tag,
      /\baction=["']mailto:twagenberg@kestrelridgehealth\.com["']/i,
    );
    assert.doesNotMatch(tag, /\baction=["']https?:/i);
  });
}

test("contact export still contains a direct mail link (legacy, pending source reconciliation)", () => {
  assert.match(html, /mailto:hello@kestrelridgehealth\.com/i);
});
