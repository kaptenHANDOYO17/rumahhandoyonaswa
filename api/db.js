// ============================================================
//  DATABASE Griya Asri — SATU DUNIA SAJA (room tetap "HNDNS").
//  Peran terikat ke akun: sekali diklaim, Handoyo tetap Handoyo
//  dan Naswa tetap Naswa, tidak mungkin tertukar.
//
//  POST /api/db  { a: 'register'|'login'|'me'|'enter'|'claim'|'save'|'load'|'beat'|'who' }
//  GET  /api/db  -> { db: true/false }
// ============================================================
const crypto = require('crypto');
const kv = require('./_kv.js');

const DUNIA = 'HNDNS';                       // kode satu-satunya dunia
const PERAN = ['Handoyo', 'Naswa'];
const KUNCI_DUNIA = 'dunia:' + DUNIA;        // { peran: { Handoyo: user, Naswa: user }, dibuat }
const KUNCI_SIMPAN = 'simpan:' + DUNIA;      // progres dunia (JSON)
const KUNCI_GALERI = 'galeri:' + DUNIA;      // lukisan (dipisah supaya progres tetap kecil)
const KUNCI_META = 'meta:' + DUNIA;
const KUNCI_HIDUP = 'hidup:' + DUNIA;        // siapa online

const BATAS_SIMPAN = 3000000;                // 3 MB — progres murni ±50 KB, jadi sangat longgar
const BATAS_GALERI = 3000000;

const USER_RE = /^[a-z0-9_]{3,20}$/;
const hash = (pin, salt) => crypto.scryptSync(String(pin), salt, 32).toString('hex');
const samaAman = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
async function auth(token) { if (!token) return null; return (await kv.cmd('GET', 'tok:' + token)) || null; }
async function newToken(user) { const t = crypto.randomBytes(24).toString('hex'); await kv.cmd('SET', 'tok:' + t, user, 'EX', 60 * 60 * 24 * 180); return t; }

async function ambilDunia() {
  let d = await kv.getJSON(KUNCI_DUNIA);
  if (!d) { d = { kode: DUNIA, nama: 'Rumah Handoyo & Naswa', peran: {}, dibuat: Date.now() }; await kv.setJSON(KUNCI_DUNIA, d); }
  if (!d.peran) d.peran = {};
  return d;
}
const peranDari = (d, user) => PERAN.find((p) => d.peran[p] === user) || null;

async function siapaOnline() {
  const live = (await kv.getJSON(KUNCI_HIDUP)) || { users: {} };
  const now = Date.now(); const out = {};
  for (const u in live.users) if (now - live.users[u].at < 45000) out[u] = live.users[u];
  return { live, online: out };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ db: kv.enabled, dunia: DUNIA });
  if (!kv.enabled) return res.status(501).json({ error: 'Database belum diatur (set UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN di Vercel)' });
  const b = kv.body(req); const a = b.a;
  try {
    // ---------------- akun ----------------
    if (a === 'register' || a === 'login') {
      const user = String(b.user || '').toLowerCase().trim(); const pin = String(b.pin || '');
      if (!USER_RE.test(user)) return res.status(400).json({ error: 'Nama akun 3–20 huruf kecil/angka/_' });
      if (pin.length < 4) return res.status(400).json({ error: 'Kata sandi minimal 4 karakter' });
      const rec = await kv.getJSON('user:' + user);
      if (a === 'register') {
        if (rec) return res.status(409).json({ error: 'Nama akun sudah dipakai' });
        const salt = crypto.randomBytes(12).toString('hex');
        await kv.setJSON('user:' + user, { salt, hash: hash(pin, salt), created: Date.now(), display: String(b.display || user).slice(0, 24) });
      } else if (!rec || !samaAman(hash(pin, rec.salt), rec.hash)) {
        return res.status(401).json({ error: 'Nama akun atau kata sandi salah' });
      }
      const d = await ambilDunia();
      return res.status(200).json({ token: await newToken(user), user, peran: peranDari(d, user), dunia: DUNIA });
    }

    const user = await auth(b.token);
    if (!user) return res.status(401).json({ error: 'Sesi habis, silakan masuk lagi' });
    const rec = await kv.getJSON('user:' + user);
    if (!rec) return res.status(401).json({ error: 'Akun tidak ditemukan' });
    const dunia = await ambilDunia();
    let peran = peranDari(dunia, user);

    if (a === 'me') return res.status(200).json({ user, display: rec.display, peran, dunia: DUNIA });

    // ---------------- klaim peran (sekali saja, lalu permanen) ----------------
    if (a === 'claim') {
      const minta = PERAN.includes(b.peran) ? b.peran : null;
      if (!minta) return res.status(400).json({ error: 'Peran harus Handoyo atau Naswa' });
      if (peran && peran !== minta) return res.status(409).json({ error: `Akun ini sudah terdaftar sebagai ${peran}` });
      const pemilik = dunia.peran[minta];
      if (pemilik && pemilik !== user) return res.status(409).json({ error: `${minta} sudah dipakai akun "${pemilik}"` });
      dunia.peran[minta] = user; await kv.setJSON(KUNCI_DUNIA, dunia);
      return res.status(200).json({ peran: minta, dunia: DUNIA, terisi: dunia.peran });
    }
    // ---------------- lepas peran (kalau salah pilih) ----------------
    if (a === 'release') {
      if (!peran) return res.status(200).json({ ok: true, peran: null, terisi: dunia.peran });
      delete dunia.peran[peran]; await kv.setJSON(KUNCI_DUNIA, dunia);
      return res.status(200).json({ ok: true, peran: null, terisi: dunia.peran });
    }
    // ---------------- masuk dunia ----------------
    if (a === 'enter') {
      if (!peran) {
        // belum punya peran: ambil otomatis yang masih kosong supaya pemain tidak tersangkut
        const kosong = PERAN.find((p) => !dunia.peran[p]);
        if (!kosong) return res.status(409).json({ error: 'Kedua peran sudah dipakai akun lain. Minta pasanganmu melepas perannya.', terisi: dunia.peran });
        dunia.peran[kosong] = user; await kv.setJSON(KUNCI_DUNIA, dunia); peran = kosong;
      }
      const { online } = await siapaOnline();
      const meta = await kv.getJSON(KUNCI_META);
      return res.status(200).json({ dunia: DUNIA, peran, terisi: dunia.peran, online, meta });
    }
    if (a === 'who') {
      const { online } = await siapaOnline();
      return res.status(200).json({ dunia: DUNIA, peran, terisi: dunia.peran, online, meta: await kv.getJSON(KUNCI_META) });
    }
    if (a === 'beat') {
      if (!peran) return res.status(403).json({ error: 'Belum punya peran di dunia ini' });
      const { live, online } = await siapaOnline();
      live.users = online;
      live.users[user] = { at: Date.now(), peran, host: !!b.host, hari: b.hari || 0 };
      if (b.host) live.host = user;
      live.at = Date.now();
      await kv.setJSON(KUNCI_HIDUP, live, 120);
      return res.status(200).json({ live, peran, terisi: dunia.peran });
    }

    // ---------------- simpanan: satu dunia, dipakai bersama ----------------
    if (!peran) return res.status(403).json({ error: 'Belum punya peran di dunia ini' });
    if (a === 'save') {
      const data = b.data;
      if (!data || typeof data !== 'object') return res.status(400).json({ error: 'data kosong' });
      const str = JSON.stringify(data);
      if (str.length > BATAS_SIMPAN) return res.status(413).json({ error: `simpanan terlalu besar (${Math.round(str.length / 1024)} KB)` });
      // tolak simpanan yang jauh lebih tua dari yang tersimpan (anti-mundur saat dua host bentrok)
      const lama = await kv.getJSON(KUNCI_META);
      const waktuBaru = (data.world && data.world.time) || 0;
      if (lama && lama.waktu && waktuBaru + 1 < lama.waktu - 240 && !b.paksa) {
        return res.status(409).json({ error: 'simpanan lebih tua dari yang ada di server', meta: lama });
      }
      const meta = { savedAt: Date.now(), by: user, peran, waktu: waktuBaru, hari: Math.floor(waktuBaru / 1440) + 1, uang: data.world && data.world.money, bytes: str.length };
      await kv.cmd('SET', KUNCI_SIMPAN, str);
      await kv.setJSON(KUNCI_META, meta);
      if (Array.isArray(b.gallery)) {
        const gs = JSON.stringify(b.gallery.slice(0, 24));
        if (gs.length <= BATAS_GALERI) await kv.cmd('SET', KUNCI_GALERI, gs);
      }
      return res.status(200).json({ ok: true, meta });
    }
    if (a === 'load') {
      const [d, g, m] = await Promise.all([kv.cmd('GET', KUNCI_SIMPAN), kv.cmd('GET', KUNCI_GALERI), kv.getJSON(KUNCI_META)]);
      return res.status(200).json({ data: d ? JSON.parse(d) : null, gallery: g ? JSON.parse(g) : [], meta: m, peran });
    }
    // ---------------- mulai dunia dari awal (perlu dua-duanya setuju? cukup konfirmasi klien) ----------------
    if (a === 'reset') {
      if (String(b.konfirmasi || '') !== 'HAPUS') return res.status(400).json({ error: 'konfirmasi tidak cocok' });
      await Promise.all([kv.cmd('DEL', KUNCI_SIMPAN), kv.cmd('DEL', KUNCI_GALERI), kv.cmd('DEL', KUNCI_META)]);
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'aksi tidak dikenal' });
  } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
};
