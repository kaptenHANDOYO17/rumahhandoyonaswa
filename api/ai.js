// Vercel Serverless Function: proxy aman ke Gemma (Google Gemini API).
// Set Environment Variable di Vercel: GEMINI_API_KEY (dari Google AI Studio).
// Opsional: GEMMA_MODEL (default gemma-4-26b-a4b-it).
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ ok: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY), model: process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) return res.status(501).json({ error: 'GEMINI_API_KEY belum diset' });
  let body = req.body;
  try { if (typeof body === 'string') body = JSON.parse(body); } catch (e) { body = {}; }
  const prompt = String((body && body.prompt) || '').slice(0, 6000);
  if (!prompt) return res.status(400).json({ error: 'prompt kosong' });
  const model = process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it';
  const maxTokens = Math.min(400, Math.max(32, +(body.maxTokens || 160)));
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9, maxOutputTokens: maxTokens } }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: (j.error && j.error.message) || 'gagal' });
    const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
    const text = parts.filter((p) => !p.thought).map((p) => p.text || '').join('').trim();
    return res.status(200).json({ text, model });
  } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
};
