import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import worker from '../../infrastructure/reader-feedback/worker.mjs';
globalThis.crypto ||= webcrypto;
const origin = 'https://kestrelridgehealth.com';
const good = { article: '/adding-ophthalmologist-technician-coverage/', visitor: '123e4567-e89b-12d3-a456-426614174000', rating: 3, improvement: 'examples' };
function request(body, options = {}) {
  return new Request('https://feedback.example/rating', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body), ...options });
}
const savedFetch = globalThis.fetch;
function database() {
  const rows = new Map();
  return { rows, prepare(sql) { return { bind(article, hash, rating, improvement) {
    return { async run() { const key = article + hash; const changes = rows.has(key) ? 0 : 1; if (changes) rows.set(key, { article, hash, rating, improvement }); return { success: true, meta: { changes } }; } };
  } }; } };
}
test('rejects disallowed origins and malformed input before database access', async () => {
  assert.equal((await worker.fetch(request(good, { headers: { Origin: 'https://attacker.example', 'Content-Type': 'application/json' } }), {})).status, 403);
  for (const body of [null, [], { ...good, rating: 9 }, { ...good, article: '/contact/' , improvement: 'free text' }, { ...good, visitor: 'bad' }]) {
    assert.equal((await worker.fetch(request(body), {})).status, 400);
  }
});
test('valid preflight works without request body', async () => {
  const result = await worker.fetch(new Request('https://feedback.example/rating', { method: 'OPTIONS', headers: { Origin: origin } }), {});
  assert.equal(result.status, 204);
  assert.equal(result.headers.get('Access-Control-Allow-Origin'), origin);
});
test('enforces request body limit and unavailable storage has no false success', async () => {
  assert.equal((await worker.fetch(request({ ...good, padding: 'x'.repeat(3000) }), {})).status, 413);
  assert.equal((await worker.fetch(request(good), {})).status, 503);
});
test('records one response, hashes browser identifier, and ignores duplicate votes', async () => {
  const db = database();
  globalThis.fetch = async () => new Response(`<rss><link>${origin}${good.article}</link></rss>`);
  try {
    assert.deepEqual(await (await worker.fetch(request(good), { FEEDBACK_DB: db })).json(), { ok: true, recorded: true });
    assert.deepEqual(await (await worker.fetch(request({ ...good, rating: 1 }), { FEEDBACK_DB: db })).json(), { ok: true, recorded: false });
    assert.equal(db.rows.size, 1);
    assert.equal([...db.rows.values()][0].rating, 3);
    assert.match([...db.rows.values()][0].hash, /^[a-f0-9]{64}$/);
    assert.notEqual([...db.rows.values()][0].hash, good.visitor);
  } finally { globalThis.fetch = savedFetch; }
});
test('unpublished article and database failure cannot produce a recorded response', async () => {
  globalThis.fetch = async () => new Response('<rss/>');
  try { assert.equal((await worker.fetch(request(good), { FEEDBACK_DB: database() })).status, 400); }
  finally { globalThis.fetch = savedFetch; }
  globalThis.fetch = async () => new Response(`<link>${origin}${good.article}</link>`);
  try { assert.equal((await worker.fetch(request(good), { FEEDBACK_DB: { prepare() { throw new Error('Offline'); } } })).status, 503); }
  finally { globalThis.fetch = savedFetch; }
});
