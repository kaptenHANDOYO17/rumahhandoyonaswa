// ============================================================
//  AKUN & SIMPANAN — SATU DUNIA SAJA.
//  Peran terikat akun: login pakai akunmu -> selalu Handoyo,
//  login pakai akun Naswa -> selalu Naswa. Tidak bisa tertukar.
//  Cloud (api/db) dengan cadangan lokal (localStorage).
// ============================================================
export const DUNIA = 'HNDNS';
export const PERAN = ['Handoyo', 'Naswa'];
export const SLOT = 'dunia';                       // satu-satunya slot simpanan
const LS_SESS = 'griyaasri-sesi-v2';
const LS_AKUN = 'griyaasri-akun-v2';
const LS_SIMPAN = 'griyaasri-dunia-v2';
const LS_GALERI = 'griyaasri-dunia-v2-galeri';
const LS_TUNDA = 'griyaasri-tunda-v1';             // simpanan yang gagal dikirim -> dikirim ulang nanti

const lsGet = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

import { api as alamat, modeAplikasi } from './konfigurasi.js';

export const Acct = { db: null, session: lsGet(LS_SESS), config: null, peran: null, terisi: {}, online: {}, meta: null };
if (Acct.session && Acct.session.peran) Acct.peran = Acct.session.peran;

export async function probe() {
  try { const r = await fetch(alamat('/api/db')); Acct.db = r.ok ? !!(await r.json()).db : false; } catch (e) { Acct.db = false; }
  try { const r = await fetch(alamat('/api/config')); if (r.ok) Acct.config = await r.json(); } catch (e) { Acct.config = null; }
  return Acct.db;
}
async function api(a, body = {}) {
  const r = await fetch(alamat('/api/db'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ a, token: Acct.session && Acct.session.token, ...body }) });
  let j = {}; try { j = await r.json(); } catch (e) { /* abaikan */ }
  if (!r.ok) { const err = new Error(j.error || `Server ${r.status}`); err.status = r.status; err.data = j; if (r.status === 401 && a !== 'login' && a !== 'register') logout(); throw err; }
  return j;
}

// ---------------- akun lokal (kalau database belum diatur) ----------------
// crypto.subtle hanya tersedia di konteks aman (https / localhost).
// Kalau tidak ada (mis. dibuka langsung lewat file://), pakai hash sederhana
// sebagai cadangan agar akun lokal tetap bisa dipakai.
async function sha(s) {
  try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }
  catch (e) { let h1 = 0x811c9dc5, h2 = 0x01000193; for (let i = 0; i < s.length; i++) { h1 = (h1 ^ s.charCodeAt(i)) * 16777619 >>> 0; h2 = (h2 + s.charCodeAt(i) * (i + 7)) >>> 0; } return 'x' + h1.toString(16) + h2.toString(16) + s.length.toString(16); }
}
async function localAuth(a, user, pin) {
  const U = lsGet(LS_AKUN) || {};
  if (!/^[a-z0-9_]{3,20}$/.test(user)) throw new Error('Nama akun 3–20 huruf kecil/angka/_');
  if (pin.length < 4) throw new Error('Kata sandi minimal 4 karakter');
  const h = await sha(user + ':' + pin);
  if (a === 'register') { if (U[user]) throw new Error('Nama akun sudah dipakai di perangkat ini'); U[user] = { h, peran: null }; lsSet(LS_AKUN, U); }
  else if (!U[user] || U[user].h !== h) throw new Error('Nama akun atau kata sandi salah');
  return { user, token: null, local: true, peran: U[user].peran || null };
}
function localPeranSet(user, peran) { const U = lsGet(LS_AKUN) || {}; if (!U[user]) U[user] = {}; U[user].peran = peran; lsSet(LS_AKUN, U); }
const localTerisi = () => { const U = lsGet(LS_AKUN) || {}; const t = {}; for (const u in U) if (U[u].peran) t[U[u].peran] = u; return t; };

export async function auth(a, user, pin) {
  user = String(user || '').toLowerCase().trim();
  const s = Acct.db ? { ...(await api(a, { user, pin })), local: false } : await localAuth(a, user, String(pin || ''));
  Acct.session = { user: s.user, token: s.token || null, local: !!s.local, peran: s.peran || null };
  Acct.peran = s.peran || null;
  lsSet(LS_SESS, Acct.session);
  return Acct.session;
}
export function logout() { Acct.session = null; Acct.peran = null; try { localStorage.removeItem(LS_SESS); } catch (e) { /* abaikan */ } }
export const cloud = () => !!(Acct.db && Acct.session && !Acct.session.local && Acct.session.token);
export const masuk = () => !!(Acct.session && Acct.session.user);

// ---------------- peran: diklaim sekali, lalu permanen ----------------
function simpanPeran(p) { Acct.peran = p; if (Acct.session) { Acct.session.peran = p; lsSet(LS_SESS, Acct.session); } }
export async function klaimPeran(peran) {
  if (!cloud()) {
    const t = localTerisi(); const me = Acct.session.user;
    const punyaku = PERAN.find((x) => t[x] === me);
    if (punyaku && punyaku !== peran) throw new Error(`Akun ini sudah terdaftar sebagai ${punyaku}`);
    if (t[peran] && t[peran] !== me) throw new Error(`${peran} sudah dipakai akun "${t[peran]}"`);
    localPeranSet(me, peran); Acct.terisi = localTerisi(); simpanPeran(peran); return peran;
  }
  const j = await api('claim', { peran }); Acct.terisi = j.terisi || {}; simpanPeran(j.peran); return j.peran;
}
export async function lepasPeran() {
  if (!cloud()) { localPeranSet(Acct.session.user, null); Acct.terisi = localTerisi(); simpanPeran(null); return null; }
  const j = await api('release'); Acct.terisi = j.terisi || {}; simpanPeran(null); return null;
}
// masuk ke dunia; kalau belum punya peran, server memberi yang masih kosong
export async function masukDunia() {
  if (!cloud()) {
    const t = localTerisi(); Acct.terisi = t;
    let p = PERAN.find((x) => t[x] === Acct.session.user) || null;
    if (!p) {
      p = PERAN.find((x) => !t[x]);
      if (!p) throw new Error('Kedua peran sudah dipakai akun lain di perangkat ini. Lepas dulu salah satunya.');
      localPeranSet(Acct.session.user, p); Acct.terisi = localTerisi();
    }
    simpanPeran(p); return { peran: p, terisi: Acct.terisi, online: {}, meta: null };
  }
  const j = await api('enter'); Acct.terisi = j.terisi || {}; Acct.online = j.online || {}; Acct.meta = j.meta || null; simpanPeran(j.peran);
  return j;
}
export async function siapaDiDunia() {
  if (!cloud()) return { terisi: localTerisi(), online: {}, meta: null, peran: Acct.peran };
  try { const j = await api('who'); Acct.terisi = j.terisi || {}; Acct.online = j.online || {}; Acct.meta = j.meta || null; return j; } catch (e) { return { terisi: Acct.terisi, online: {}, meta: Acct.meta, peran: Acct.peran }; }
}

// ---------------- simpanan lokal ----------------
export function bacaLokal() { return lsGet(LS_SIMPAN); }
export const bacaGaleriLokal = () => lsGet(LS_GALERI) || [];
export function tulisLokal(data, gallery) {
  data.savedAt = Date.now();
  if (!lsSet(LS_SIMPAN, data)) return false;
  if (gallery) lsSet(LS_GALERI, batasiGaleri(gallery));
  return true;
}
// galeri lukisan memakai gambar base64 -> paling besar. Dibatasi ±1,6 MB.
export function batasiGaleri(gallery) {
  const out = []; let bytes = 0;
  for (const p of (gallery || []).slice(0, 24)) {
    const b = p && p.img ? p.img.length : 0;
    if (bytes + b > 1600000) { out.push({ ...p, img: null, imgHilang: true }); continue; }
    bytes += b; out.push(p);
  }
  return out;
}

// ---------------- simpan ke cloud, dengan antre-ulang kalau gagal ----------------
let kirimJalan = false;
export async function simpanDunia(data, gallery, { paksa = false } = {}) {
  tulisLokal(data, gallery);
  if (!cloud()) return { local: true };
  try {
    const j = await api('save', { data, gallery: batasiGaleri(gallery), paksa });
    try { localStorage.removeItem(LS_TUNDA); } catch (e) { /* abaikan */ }
    Acct.meta = j.meta || Acct.meta;
    return j.meta;
  } catch (e) {
    if (e.status === 413) {                       // kebesaran: buang gambar lukisan, simpan progres dulu
      try { const j = await api('save', { data, gallery: (gallery || []).map((p) => ({ ...p, img: null, imgHilang: true })), paksa: true }); Acct.meta = j.meta; return j.meta; } catch (e2) { e = e2; }
    }
    if (e.status !== 409) lsSet(LS_TUNDA, { at: Date.now(), pesan: e.message });
    throw e;
  }
}
export const adaTunda = () => lsGet(LS_TUNDA);
// coba kirim ulang simpanan lokal terakhir (dipanggil berkala oleh game)
export async function kirimUlangTunda() {
  if (kirimJalan || !cloud() || !lsGet(LS_TUNDA)) return false;
  kirimJalan = true;
  try { const d = bacaLokal(); if (d) { await simpanDunia(d, bacaGaleriLokal(), { paksa: true }); return true; } } catch (e) { /* nanti lagi */ } finally { kirimJalan = false; }
  return false;
}
// ambil simpanan terbaru antara cloud & lokal
export async function muatDunia() {
  const loc = bacaLokal();
  let best = loc ? { data: loc, gallery: bacaGaleriLokal(), dari: 'perangkat ini', at: loc.savedAt || 0, waktu: (loc.world && loc.world.time) || 0 } : null;
  if (cloud()) {
    try {
      const j = await api('load');
      if (j.data) {
        const w = (j.data.world && j.data.world.time) || 0;
        // pilih yang paling maju waktunya (bukan sekadar paling baru disimpan)
        if (!best || w > best.waktu + 1) best = { data: j.data, gallery: j.gallery || [], dari: 'cloud', at: j.meta ? j.meta.savedAt : 0, waktu: w };
        else if (best && j.gallery && j.gallery.length > (best.gallery || []).length) best.gallery = j.gallery;
      }
    } catch (e) { console.warn('muatDunia', e); }
  }
  return best;
}
// kirim simpanan terakhir saat tab ditutup (tanpa menunggu respons)
export function simpanSaatKeluar(data) {
  tulisLokal(data);
  if (!cloud() || !navigator.sendBeacon) return;
  try {
    const body = JSON.stringify({ a: 'save', token: Acct.session.token, data, paksa: true });
    if (body.length < 500000) navigator.sendBeacon(alamat('/api/db'), new Blob([body], { type: 'application/json' }));
  } catch (e) { /* abaikan */ }
}
// detak kehadiran (supaya pasangan tahu kita online, dan dunia "tetap hidup")
// Detak kehadiran + penentuan server. Mengembalikan seluruh jawaban server
// (siapa yang menjalankan dunia, identitas koneksi pasangan, mode sambungannya).
export async function beat(info = {}) {
  if (!cloud()) return null;
  try { const j = await api('beat', info); Acct.server = j.server; Acct.pasangan = j.pasangan; return j; } catch (e) { return null; }
}
// Relay: titipkan pesan lewat database kalau koneksi langsung tidak bisa terbentuk.
export async function sync(muatan) {
  if (!cloud()) throw new Error('Relay butuh database cloud');
  return api('sync', muatan);
}
export async function resetDunia() { if (!cloud()) { try { localStorage.removeItem(LS_SIMPAN); localStorage.removeItem(LS_GALERI); } catch (e) { /* abaikan */ } return true; } await api('reset', { konfirmasi: 'HAPUS' }); try { localStorage.removeItem(LS_SIMPAN); localStorage.removeItem(LS_GALERI); } catch (e) { /* abaikan */ } return true; }
