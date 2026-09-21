// ============================================================
//  AKUN & SIMPANAN — cloud (api/db) dengan cadangan lokal (localStorage)
// ============================================================
const LS_SESS = 'griyaasri-session-v1';
const LS_LOCAL_USERS = 'griyaasri-localusers-v1';
const lsGet = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
export const Acct = { db: null, session: lsGet(LS_SESS), config: null };

export async function probe() {
  try { const r = await fetch('/api/db'); Acct.db = r.ok ? !!(await r.json()).db : false; } catch (e) { Acct.db = false; }
  try { const r = await fetch('/api/config'); if (r.ok) Acct.config = await r.json(); } catch (e) { Acct.config = null; }
  return Acct.db;
}
async function api(a, body = {}) {
  const r = await fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ a, token: Acct.session && Acct.session.token, ...body }) });
  let j = {}; try { j = await r.json(); } catch (e) { /* abaikan */ }
  if (!r.ok) { if (r.status === 401 && a !== 'login' && a !== 'register') logout(); throw new Error(j.error || `Server ${r.status}`); }
  return j;
}
// ---------- akun lokal (tanpa database) ----------
async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }
async function localAuth(a, user, pin) {
  const U = lsGet(LS_LOCAL_USERS) || {};
  if (!/^[a-z0-9_]{3,20}$/.test(user)) throw new Error('Nama akun 3–20 huruf kecil/angka/_');
  if (pin.length < 4) throw new Error('Kata sandi minimal 4 karakter');
  const h = await sha(user + ':' + pin);
  if (a === 'register') { if (U[user]) throw new Error('Nama akun sudah dipakai di perangkat ini'); U[user] = { h, rooms: [] }; lsSet(LS_LOCAL_USERS, U); }
  else if (!U[user] || U[user].h !== h) throw new Error('Nama akun atau kata sandi salah');
  return { user, token: null, local: true };
}
export async function auth(a, user, pin) {
  user = String(user || '').toLowerCase().trim();
  const s = Acct.db ? { ...(await api(a, { user, pin })), local: false } : await localAuth(a, user, String(pin || ''));
  Acct.session = s; lsSet(LS_SESS, s); return s;
}
export function logout() { Acct.session = null; try { localStorage.removeItem(LS_SESS); } catch (e) { /* abaikan */ } }
export const cloud = () => !!(Acct.db && Acct.session && !Acct.session.local);

// ---------- room tetap ----------
const localRooms = () => { const U = lsGet(LS_LOCAL_USERS) || {}; const me = Acct.session && U[Acct.session.user]; return me ? me.rooms || [] : []; };
function addLocalRoom(code, role, name) { const U = lsGet(LS_LOCAL_USERS) || {}; const me = U[Acct.session.user]; if (!me) return; me.rooms = [{ code, role, name }, ...(me.rooms || []).filter((r) => r.code !== code)].slice(0, 10); lsSet(LS_LOCAL_USERS, U); }
export async function myRooms() {
  if (cloud()) { const j = await api('rooms'); return j.rooms.map((r) => ({ code: r.code, name: r.name, role: (r.members.find((m) => m.user === Acct.session.user) || {}).role, members: r.members.map((m) => `${m.user} (${m.role})`), meta: r.meta, online: r.online || [], host: r.host, permanent: r.permanent }));  }
  return localRooms().map((r) => ({ ...r, members: [], meta: readLocal('room:' + r.code) ? { day: readLocal('room:' + r.code).world.time / 1440 + 1 | 0 } : null }));
}
export async function createRoom(role, name, makeCode) {
  if (cloud()) { const j = await api('roomCreate', { role, name }); return { code: j.code, role: j.role }; }
  const code = makeCode(); addLocalRoom(code, role, name); return { code, role };
}
export async function joinRoom(code, role) {
  code = code.toUpperCase().trim();
  if (cloud()) { const j = await api('roomJoin', { code }); return { code, role: j.role }; }
  const ex = localRooms().find((r) => r.code === code); const r = ex ? ex.role : role; addLocalRoom(code, r, 'Rumah Kita'); return { code, role: r };
}
// ---------- simpanan ----------
const localKey = (slot) => `griyaasri-${slot === 'solo' ? 'save-v1' : 'room-' + slot.slice(5)}${Acct.session && Acct.session.user && slot === 'solo' ? '' : ''}`;
export function readLocal(slot) { return lsGet(localKey(slot)); }
export function writeLocal(slot, data, gallery) {
  data.savedAt = Date.now();
  if (!lsSet(localKey(slot), data)) return false;
  if (gallery) lsSet(localKey(slot) + '-gal', gallery.slice(0, 16));
  return true;
}
export const readLocalGallery = (slot) => lsGet(localKey(slot) + '-gal') || [];
export async function saveSlot(slot, data, gallery) {
  writeLocal(slot, data, gallery);
  if (!cloud()) return { local: true };
  const j = await api('save', { slot, data, gallery: (gallery || []).slice(0, 16) });
  return j.meta;
}
// ambil simpanan terbaru antara cloud & lokal
export async function loadSlot(slot) {
  const loc = readLocal(slot); let best = loc ? { data: loc, gallery: readLocalGallery(slot), from: 'perangkat ini', at: loc.savedAt || 0 } : null;
  if (cloud()) {
    try { const j = await api('load', { slot }); if (j.data && (!best || (j.meta && j.meta.savedAt) > best.at)) best = { data: j.data, gallery: j.gallery || [], from: 'cloud', at: j.meta ? j.meta.savedAt : 0 }; } catch (e) { console.warn(e); }
  }
  return best;
}
// kirim simpanan terakhir saat tab ditutup
export function beaconSave(slot, data) {
  writeLocal(slot, data);
  if (!cloud() || !navigator.sendBeacon) return;
  try { const body = JSON.stringify({ a: 'save', token: Acct.session.token, slot, data }); if (body.length < 60000) navigator.sendBeacon('/api/db', new Blob([body], { type: 'application/json' })); } catch (e) { /* abaikan */ }
}

export const PERMANENT_CODE = 'HNDNS';
// detak kehadiran di room (menampilkan siapa yang sedang online di menu)
export async function beat(code, info = {}) { if (!cloud()) return null; try { return (await api('beat', { code, ...info })).live; } catch (e) { return null; } }
