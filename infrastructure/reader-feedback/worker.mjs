const ORIGINS = new Set(['https://kestrelridgehealth.com', 'https://www.kestrelridgehealth.com']);
const REASONS = new Set(['', 'examples', 'evidence', 'steps', 'relevance']);
function response(status, data, origin) {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin' };
  if (ORIGINS.has(origin)) Object.assign(headers, {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  return new Response(status === 204 ? null : JSON.stringify(data), { status, headers });
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const path = new URL(request.url).pathname;
    if (path !== '/rating') return response(404, { ok: false }, origin);
    if (!ORIGINS.has(origin)) return response(403, { ok: false }, origin);
    if (request.method === 'OPTIONS') return response(204, null, origin);
    if (request.method !== 'POST') return response(405, { ok: false }, origin);
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return response(415, { ok: false }, origin);
    let input;
    try {
      const reader = request.body?.getReader();
      if (!reader) return response(400, { ok: false }, origin);
      let size = 0;
      const parts = [];
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 2048) { await reader.cancel(); return response(413, { ok: false }, origin); }
        parts.push(value);
      }
      const body = new Uint8Array(size);
      let offset = 0;
      for (const part of parts) { body.set(part, offset); offset += part.byteLength; }
      input = JSON.parse(new TextDecoder().decode(body));
    } catch { return response(400, { ok: false }, origin); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) return response(400, { ok: false }, origin);
    const { article, visitor, rating, improvement = '' } = input;
    if (!/^\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(article || '') || article.length > 180 ||
        !/^[a-f0-9-]{36}$/.test(visitor || '') || ![1, 2, 3].includes(rating) || !REASONS.has(improvement)) {
      return response(400, { ok: false }, origin);
    }
    if (!env.FEEDBACK_DB) return response(503, { ok: false }, origin);
    try {
      // Validate the article against the published canonical resource feed.
      const published = await fetch('https://kestrelridgehealth.com/feed.xml', { cf: { cacheTtl: 300 } });
      if (!published.ok) return response(503, { ok: false }, origin);
      const feed = await published.text();
      if (!feed.includes(`<link>https://kestrelridgehealth.com${article}</link>`)) return response(400, { ok: false }, origin);
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${article}:${visitor}`));
      const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
      const result = await env.FEEDBACK_DB.prepare(
        'INSERT OR IGNORE INTO article_feedback(article, visitor_hash, rating, improvement) VALUES (?, ?, ?, ?)'
      ).bind(article, hash, rating, improvement).run();
      if (!result.success) return response(503, { ok: false }, origin);
      return response(200, { ok: true, recorded: result.meta.changes === 1 }, origin);
    } catch { return response(503, { ok: false }, origin); }
  },
  async scheduled(event, env, context) {
    context.waitUntil(env.FEEDBACK_DB.prepare("DELETE FROM article_feedback WHERE created_at < strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-180 days')").run());
  },
};
