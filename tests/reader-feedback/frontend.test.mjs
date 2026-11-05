import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../../assets/article-feedback.js', import.meta.url), 'utf8');
function setup(reply, existing = false) {
  const status = { textContent: '' }, button = {}, fieldset = {};
  let submit, request;
  const storage = new Map(existing ? [['krh-rating:/sample/', 'submitted']] : []);
  const form = {
    dataset: { endpoint: 'https://test.invalid/rating' },
    querySelector: selector => selector === '[role="status"]' ? status : selector === 'fieldset' ? fieldset : button,
    reportValidity: () => true,
    addEventListener: (_, callback) => { submit = callback; },
  };
  vm.runInNewContext(source, {
    document: { querySelector: () => form }, location: { pathname: '/sample/' },
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    crypto: { randomUUID: () => '12345678-1234-4234-8234-123456789012' },
    FormData: class { get(key) { return key === 'rating' ? '3' : 'steps'; } },
    fetch: async (url, options) => { request = JSON.parse(options.body); return reply; },
  });
  return { status, button, fieldset, storage, submit: () => submit({ preventDefault() {} }), request: () => request };
}
test('a real submission records local state only after backend acceptance', async () => {
  const f = setup({ ok: true, json: async () => ({ ok: true, recorded: true }) });
  await f.submit();
  assert.equal(f.request().article, '/sample/');
  assert.equal(f.request().rating, 3);
  assert.equal(f.request().improvement, 'steps');
  assert.equal(f.storage.get('krh-rating:/sample/'), 'submitted');
  assert.equal(f.fieldset.disabled, true);
  assert.match(f.status.textContent, /recorded/);
});
test('storage failure never shows a successful rating and permits retry', async () => {
  const f = setup({ ok: false, json: async () => ({ ok: false }) });
  await f.submit();
  assert.equal(f.storage.has('krh-rating:/sample/'), false);
  assert.equal(f.button.disabled, false);
  assert.match(f.status.textContent, /couldn’t be saved/);
});
test('an existing browser response is visibly marked', () => {
  const f = setup(null, true);
  assert.equal(f.button.hidden, true);
  assert.equal(f.fieldset.disabled, true);
  assert.match(f.status.textContent, /already rated/);
});
