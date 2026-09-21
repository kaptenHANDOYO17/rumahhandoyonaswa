// ============================================================
//  Klien AI Gemma — membuat warga lebih "hidup" (SMS, obrolan, tawaran pembeli)
//  Urutan: (1) server /api/ai di Vercel (kunci aman di env)  (2) kunci API milik pemain
//  (disimpan di browser)  (3) jika gagal: kembali ke kalimat bawaan game.
// ============================================================
const LS = 'griyaasri-ai-v1';
const load = () => { try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch (e) { return {}; } };
export const AI = { key: '', model: 'gemma-4-26b-a4b-it', enabled: true, ambient: true, server: null, last: 0, calls: [], lastError: '', ...load() };
export function saveAI() { try { localStorage.setItem(LS, JSON.stringify({ key: AI.key, model: AI.model, enabled: AI.enabled, ambient: AI.ambient })); } catch (e) { /* abaikan */ } }
export async function probeServer() {
  try { const r = await fetch('/api/ai', { method: 'GET' }); if (!r.ok) throw new Error(r.status); const j = await r.json(); AI.server = !!j.ok; if (j.model) AI.serverModel = j.model; } catch (e) { AI.server = false; }
  return AI.server;
}
export const aiReady = () => AI.enabled && (AI.server || !!AI.key);
export function aiStatus() { if (!AI.enabled) return 'Mati'; if (AI.server) return `Aktif via server (${AI.serverModel || 'Gemma'})`; if (AI.key) return `Aktif via kunci API pribadi (${AI.model})`; return 'Belum ada kunci — pakai dialog bawaan'; }
const STYLE = 'Gaya: bahasa Indonesia santai sehari-hari (boleh sedikit Jawa/Semarangan), singkat, hangat, tanpa emoji berlebihan, tanpa tanda kutip, tanpa menyebut bahwa kamu AI. Latar: Perumahan Griya Asri, Semarang.';
export async function aiAsk(prompt, maxTokens = 120) {
  if (!aiReady()) return null;
  const now = Date.now(); AI.calls = AI.calls.filter((t) => now - t < 60000);
  if (AI.calls.length >= 14 || now - AI.last < 1200) return null;
  AI.calls.push(now); AI.last = now;
  const full = `${STYLE}\n\n${prompt}`;
  try {
    let text = null;
    if (AI.server) {
      const r = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: full, maxTokens }) });
      if (r.ok) text = (await r.json()).text;
    }
    if (!text && AI.key) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${AI.model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': AI.key },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: full }] }], generationConfig: { temperature: 0.9, maxOutputTokens: maxTokens } }) });
      const j = await r.json();
      if (!r.ok) throw new Error((j.error && j.error.message) || r.status);
      text = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
    }
    if (!text) return null;
    AI.lastError = '';
    return text.replace(/^["'“]|["'”]$/g, '').replace(/\s+/g, ' ').trim().slice(0, 280);
  } catch (e) { AI.lastError = String(e.message || e); return null; }
}
