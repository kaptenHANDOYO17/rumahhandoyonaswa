// ============================================================
//  Proxy AI untuk warga Griya Asri — mendukung banyak penyedia.
//  Pilih salah satu (cukup isi salah satu kunci di Environment Variables Vercel):
//    1) GROQ_API_KEY      → Groq (cepat & ada paket gratis). Model default: llama-3.3-70b-versatile
//    2) GEMINI_API_KEY    → Google AI Studio (model Gemma / Gemini)
//    3) OPENROUTER_API_KEY→ OpenRouter (banyak model, termasuk Gemma)
//    4) AI_BASE_URL + AI_API_KEY → penyedia lain yang kompatibel OpenAI (mis. Together, DeepInfra, Ollama)
//  Opsional: AI_MODEL untuk menimpa model default, AI_PROVIDER untuk memaksa penyedia.
// ============================================================
const PROVIDERS = {
  groq: { env: 'GROQ_API_KEY', url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile', kind: 'openai' },
  openrouter: { env: 'OPENROUTER_API_KEY', url: 'https://openrouter.ai/api/v1/chat/completions', model: 'google/gemma-3-27b-it', kind: 'openai' },
  gemini: { env: 'GEMINI_API_KEY', altEnv: 'GOOGLE_API_KEY', url: null, model: 'gemma-4-26b-a4b-it', kind: 'google' },
  custom: { env: 'AI_API_KEY', url: null, model: 'gpt-4o-mini', kind: 'openai' },
};
function pick() {
  const forced = (process.env.AI_PROVIDER || '').toLowerCase();
  const order = forced && PROVIDERS[forced] ? [forced] : ['groq', 'gemini', 'openrouter', 'custom'];
  for (const name of order) {
    const p = PROVIDERS[name];
    const key = process.env[p.env] || (p.altEnv ? process.env[p.altEnv] : null);
    if (!key) continue;
    if (name === 'custom' && !process.env.AI_BASE_URL) continue;
    const model = process.env.AI_MODEL || process.env.GEMMA_MODEL || process.env.GROQ_MODEL || p.model;
    const url = name === 'custom' ? String(process.env.AI_BASE_URL).replace(/\/$/, '') + '/chat/completions' : p.url;
    return { name, key, model, url, kind: p.kind };
  }
  return null;
}
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const P = pick();
  if (req.method === 'GET') return res.status(200).json({ ok: !!P, provider: P ? P.name : null, model: P ? P.model : null });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!P) return res.status(501).json({ error: 'Belum ada kunci AI. Isi GROQ_API_KEY atau GEMINI_API_KEY di Environment Variables Vercel, lalu Redeploy.' });
  let body = req.body;
  try { if (typeof body === 'string') body = JSON.parse(body); } catch (e) { body = {}; }
  const prompt = String((body && body.prompt) || '').slice(0, 6000);
  if (!prompt) return res.status(400).json({ error: 'prompt kosong' });
  const maxTokens = Math.min(400, Math.max(32, +(body.maxTokens || 160)));
  try {
    let r, j, text = '';
    if (P.kind === 'google') {
      r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${P.model}:generateContent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': P.key },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9, maxOutputTokens: maxTokens } }),
      });
      j = await r.json();
      if (!r.ok) return res.status(502).json({ error: (j.error && j.error.message) || 'gagal', provider: P.name });
      const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
      text = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
    } else {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${P.key}` };
      if (P.name === 'openrouter') { headers['HTTP-Referer'] = process.env.SITE_URL || 'https://griya-asri.vercel.app'; headers['X-Title'] = 'Rumah Handoyo & Naswa'; }
      r = await fetch(P.url, { method: 'POST', headers, body: JSON.stringify({ model: P.model, temperature: 0.9, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }) });
      j = await r.json();
      if (!r.ok) return res.status(502).json({ error: (j.error && (j.error.message || j.error)) || `gagal (${r.status})`, provider: P.name, model: P.model });
      text = ((j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '').trim();
    }
    return res.status(200).json({ text: text.trim(), provider: P.name, model: P.model });
  } catch (e) { return res.status(500).json({ error: String(e.message || e), provider: P.name }); }
};
