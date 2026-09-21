// Helper Redis REST (Upstash / Vercel KV). Env yang didukung:
// UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN  atau  KV_REST_API_URL + KV_REST_API_TOKEN
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOK = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
exports.enabled = !!(URL_ && TOK);
exports.cmd = async (...args) => {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: `Bearer ${TOK}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  const j = await r.json(); if (j.error) throw new Error(j.error); return j.result;
};
exports.getJSON = async (k) => { const v = await exports.cmd('GET', k); return v ? JSON.parse(v) : null; };
exports.setJSON = async (k, v, ex) => (ex ? exports.cmd('SET', k, JSON.stringify(v), 'EX', ex) : exports.cmd('SET', k, JSON.stringify(v)));
exports.body = (req) => { let b = req.body; try { if (typeof b === 'string') b = JSON.parse(b); } catch (e) { b = {}; } return b || {}; };
