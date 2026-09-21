// ============================================================
//  DATABASE Griya Asri: akun, simpanan progres (solo & berdua), room tetap.
//  POST /api/db  { a: 'register'|'login'|'me'|'save'|'load'|'roomCreate'|'roomJoin'|'rooms'|'roomLeave', ... }
//  GET  /api/db  -> { db: true/false }
// ============================================================
const crypto = require('crypto');
const kv = require('./_kv.js');
const USER_RE = /^[a-z0-9_]{3,20}$/;
const hash = (pin, salt) => crypto.scryptSync(String(pin), salt, 32).toString('hex');
const code5 = () => { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 5; i++) s += A[crypto.randomInt(A.length)]; return s; };
async function auth(token) { if (!token) return null; const u = await kv.cmd('GET', 'tok:' + token); return u || null; }
async function newToken(user) { const t = crypto.randomBytes(24).toString('hex'); await kv.cmd('SET', 'tok:' + t, user, 'EX', 60 * 60 * 24 * 60); return t; }

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ db: kv.enabled });
  if (!kv.enabled) return res.status(501).json({ error: 'Database belum diatur (set UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN di Vercel)' });
  const b = kv.body(req); const a = b.a;
  try {
    if (a === 'register' || a === 'login') {
      const user = String(b.user || '').toLowerCase().trim(); const pin = String(b.pin || '');
      if (!USER_RE.test(user)) return res.status(400).json({ error: 'Nama akun 3–20 huruf kecil/angka/_' });
      if (pin.length < 4) return res.status(400).json({ error: 'Kata sandi minimal 4 karakter' });
      const rec = await kv.getJSON('user:' + user);
      if (a === 'register') {
        if (rec) return res.status(409).json({ error: 'Nama akun sudah dipakai' });
        const salt = crypto.randomBytes(12).toString('hex');
        await kv.setJSON('user:' + user, { salt, hash: hash(pin, salt), rooms: [], created: Date.now(), display: String(b.display || user).slice(0, 24) });
      } else {
        if (!rec || !crypto.timingSafeEqual(Buffer.from(hash(pin, rec.salt)), Buffer.from(rec.hash))) return res.status(401).json({ error: 'Nama akun atau kata sandi salah' });
      }
      return res.status(200).json({ token: await newToken(user), user });
    }
    const user = await auth(b.token); if (!user) return res.status(401).json({ error: 'Sesi habis, silakan masuk lagi' });
    const rec = await kv.getJSON('user:' + user);
    if (a === 'me') return res.status(200).json({ user, rooms: rec.rooms || [], display: rec.display });
    // ---------- room tetap ----------
    if (a === 'roomCreate') {
      let code; for (let i = 0; i < 8; i++) { code = code5(); if (!(await kv.cmd('EXISTS', 'room:' + code))) break; }
      const role = b.role === 'Naswa' ? 'Naswa' : 'Handoyo';
      await kv.setJSON('room:' + code, { code, name: String(b.name || 'Rumah Kita').slice(0, 30), members: [{ user, role }], created: Date.now() });
      rec.rooms = [...new Set([code, ...(rec.rooms || [])])].slice(0, 10); await kv.setJSON('user:' + user, rec);
      return res.status(200).json({ code, role });
    }
    if (a === 'roomJoin') {
      const code = String(b.code || '').toUpperCase().trim(); let room = await kv.getJSON('room:' + code);
      if (!room && code === 'HNDNS') { room = { code, name: 'Rumah Permanen Handoyo & Naswa', permanent: true, members: [], created: Date.now() }; await kv.setJSON('room:' + code, room); }
      if (!room) return res.status(404).json({ error: 'Room tidak ditemukan' });
      let me = room.members.find((m) => m.user === user);
      if (!me) {
        if (room.members.length >= 2) return res.status(409).json({ error: 'Room ini sudah punya 2 pemain terdaftar' });
        const taken = room.members.map((m) => m.role); me = { user, role: taken.includes('Handoyo') ? 'Naswa' : 'Handoyo' };
        room.members.push(me); await kv.setJSON('room:' + code, room);
        rec.rooms = [...new Set([code, ...(rec.rooms || [])])].slice(0, 10); await kv.setJSON('user:' + user, rec);
      }
      return res.status(200).json({ code, role: me.role, room });
    }
    if (a === 'rooms') {
      const out = [];
      for (const c of rec.rooms || []) { const r = await kv.getJSON('room:' + c); if (!r) continue; const meta = await kv.getJSON('meta:room:' + c); const live = await kv.getJSON('live:' + c); const now = Date.now(); const online = live ? Object.keys(live.users || {}).filter((u) => now - live.users[u] < 45000) : []; out.push({ code: c, name: r.name, permanent: !!r.permanent, members: r.members, meta, online, host: live && online.includes(live.host) ? live.host : null }); }
      return res.status(200).json({ rooms: out });
    }
    if (a === 'beat') {
      const code = String(b.code || '').toUpperCase(); const room = await kv.getJSON('room:' + code);
      if (!room || !room.members.some((m) => m.user === user)) return res.status(403).json({ error: 'Bukan anggota room' });
      const live = (await kv.getJSON('live:' + code)) || { users: {} }; const now = Date.now();
      for (const u in live.users) if (now - live.users[u] > 45000) delete live.users[u];
      live.users[user] = now; if (b.host) live.host = user; live.day = b.day || live.day; live.at = now;
      await kv.setJSON('live:' + code, live, 90);
      return res.status(200).json({ live });
    }
    if (a === 'roomLeave') { rec.rooms = (rec.rooms || []).filter((c) => c !== b.code); await kv.setJSON('user:' + user, rec); return res.status(200).json({ ok: true }); }
    // ---------- simpanan ----------
    const slot = String(b.slot || '');
    let key;
    if (slot === 'solo') key = 'save:solo:' + user;
    else if (/^room:[A-Z0-9]{5}$/.test(slot)) {
      const room = await kv.getJSON(slot); if (!room || !room.members.some((m) => m.user === user)) return res.status(403).json({ error: 'Bukan anggota room' });
      key = 'save:' + slot;
    } else return res.status(400).json({ error: 'slot tidak valid' });
    if (a === 'save') {
      const data = b.data; if (!data || typeof data !== 'object') return res.status(400).json({ error: 'data kosong' });
      const str = JSON.stringify(data); if (str.length > 900000) return res.status(413).json({ error: 'simpanan terlalu besar' });
      const meta = { savedAt: Date.now(), by: user, day: Math.floor(((data.world && data.world.time) || 0) / 1440) + 1, money: data.world && data.world.money };
      await kv.cmd('SET', key, str);
      if (Array.isArray(b.gallery)) await kv.cmd('SET', 'gal:' + key, JSON.stringify(b.gallery.slice(0, 16)));
      await kv.setJSON('meta:' + (slot === 'solo' ? 'solo:' + user : slot), meta);
      return res.status(200).json({ ok: true, meta });
    }
    if (a === 'load') {
      const [d, g, m] = await Promise.all([kv.cmd('GET', key), kv.cmd('GET', 'gal:' + key), kv.getJSON('meta:' + (slot === 'solo' ? 'solo:' + user : slot))]);
      return res.status(200).json({ data: d ? JSON.parse(d) : null, gallery: g ? JSON.parse(g) : [], meta: m });
    }
    return res.status(400).json({ error: 'aksi tidak dikenal' });
  } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
};
