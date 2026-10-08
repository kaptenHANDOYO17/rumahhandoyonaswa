// ============================================================
//  RELAY — jalan cadangan kalau koneksi langsung (P2P) tidak bisa terbentuk.
//
//  Beberapa jaringan (kantor, kampus, seluler dengan NAT ketat) memblokir
//  koneksi langsung antar-browser. Kalau itu terjadi, dunia tetap dibagi
//  berdua lewat server: yang jadi server menitipkan ringkasan dunia ke
//  database, pasangannya mengambilnya dan menitipkan perintahnya balik.
//
//  Antarmukanya sengaja dibuat sama persis dengan kelas Net (send/onMsg/
//  onOpen/onClose/conn/destroy), jadi seluruh mesin permainan tidak perlu
//  tahu apakah ia sedang lewat P2P atau lewat server.
//
//  Hemat kuota: ringkasan dunia DIGABUNG (bukan ditumpuk) sebelum dikirim,
//  dan denyutnya melambat sendiri saat tidak ada yang berubah.
// ============================================================
import { sync } from './account.js';

const CEPAT = 1200;        // ms saat ada yang berubah
const PELAN = 3000;        // ms saat dunia sedang sepi
const MATI = 30000;        // pasangan dianggap putus kalau sekian lama tidak terdengar

// Gabungkan dua ringkasan beda (delta) jadi satu, supaya tidak ada yang hilang
// walau beberapa denyut digabung. Kunci yang lebih baru menang.
function gabungDelta(lama, baru) {
  const out = { world: { ...(lama.world || {}) }, sims: {}, others: {} };
  for (const bag of ['sims', 'others']) {
    for (const n in lama[bag] || {}) out[bag][n] = { ...lama[bag][n] };
    for (const n in baru[bag] || {}) out[bag][n] = { ...(out[bag][n] || {}), ...baru[bag][n] };
  }
  const tambalLama = out.world.objPatch; delete out.world.objPatch;
  Object.assign(out.world, baru.world || {});
  const tambalBaru = (baru.world || {}).objPatch;
  if (tambalLama || tambalBaru) {
    const peta = new Map();
    for (const o of tambalLama || []) peta.set(o.id, o);
    for (const o of tambalBaru || []) peta.set(o.id, o);
    out.world.objPatch = [...peta.values()];
  }
  return out;
}

export class RelayNet {
  constructor({ sebagai, peran }) {
    this.relay = true;                       // penanda: dipakai mesin permainan
    this.sebagai = sebagai;                  // 'host' | 'guest'
    this.peran = peran;
    this.isHost = sebagai === 'host';
    this.conn = { open: true };              // penjaga jalur di game.js ikut senang
    this.onMsg = () => {}; this.onOpen = () => {}; this.onClose = () => {}; this.onFull = () => {};
    this.onRemoteStream = () => {}; this.onVoiceEnd = () => {};
    this.antre = [];                         // pesan biasa (toast, sfx, chat, cmd…)
    this.ringkas = null;                     // ringkasan dunia terbaru (digabung)
    this.ringkasPenuh = null;                // ringkasan penuh, menang atas delta
    this.seq = 0; this.sejak = 0;
    this.terdengar = 0; this.tersambung = false; this.mati = false;
    this.denyut = CEPAT;
    this._jalan();
  }
  get open() { return this.tersambung; }

  send(m) {
    if (this.mati || !m) return;
    if (m.t === 'snap') { this.ringkasPenuh = m; this.ringkas = null; return; }     // penuh menimpa semua delta
    if (m.t === 'dsnap') { this.ringkas = this.ringkas ? { ...m, s: gabungDelta(this.ringkas.s, m.s) } : m; return; }
    if (this.antre.length > 60) this.antre.shift();                                 // jangan menumpuk tanpa batas
    this.antre.push(m);
  }
  // paket yang akan dikirim pada denyut ini
  _ambilKirim() {
    const out = [];
    if (this.ringkasPenuh) { out.push(this.ringkasPenuh); this.ringkasPenuh = null; }
    else if (this.ringkas) { out.push(this.ringkas); this.ringkas = null; }
    if (this.antre.length) { out.push(...this.antre); this.antre.length = 0; }
    return out;
  }
  async _denyut() {
    if (this.mati) return;
    const kirim = this._ambilKirim();
    // tamu menitipkan denyut tipis tiap ±5 detik supaya server tahu ia masih online
    if (!kirim.length && this.sebagai === 'guest' && Date.now() - (this._ping || 0) > 5000) { this._ping = Date.now(); kirim.push({ t: 'ping' }); }
    let j = null;
    try {
      j = await sync({ sebagai: this.sebagai, kirim, seq: ++this.seq, sejak: this.sejak });
      this.gagal = 0;
    } catch (e) {
      this.gagal = (this.gagal || 0) + 1;
      if (kirim.length) { for (const m of kirim) this.send(m); }                    // kembalikan ke antrean
      if (this.gagal > 8 && this.tersambung) { this.tersambung = false; this.conn = null; this.onClose(); }
      return;
    }
    if (j && typeof j.seq === 'number' && j.seq) this.sejak = j.seq;
    const semua = (j && j.pesan) || [];
    const pesan = semua.filter((m) => m && m.t !== 'ping');          // denyut tidak diteruskan ke permainan
    // "masih terdengar" = server membalas dengan sesuatu yang baru, bukan harus ada pesan.
    // Dulu jalur ini dianggap mati saat dunia sedang sepi, lalu memutus sendiri.
    if (semua.length || (j && j.hidup)) {
      this.terdengar = Date.now();
      if (!this.tersambung) { this.tersambung = true; this.conn = { open: true }; this.onOpen({ t: 'hello', relay: true, peran: this.peran }); }
    }
    for (const m of pesan) { try { this.onMsg(m); } catch (e) { console.warn('relay pesan', e); } }
    // atur kecepatan denyut: cepat saat ramai, pelan saat sepi (hemat kuota database)
    const ramai = kirim.length > 0 || pesan.length > 0;
    this.denyut = ramai ? CEPAT : PELAN;
    if (this.tersambung && this.terdengar && Date.now() - this.terdengar > MATI) {
      this.tersambung = false; this.conn = null; this.onClose();
    }
  }
  _jalan() {
    const putar = async () => {
      if (this.mati) return;
      await this._denyut();
      this._t = setTimeout(putar, this.denyut);
    };
    putar();
  }
  // --- bagian yang tidak berlaku lewat relay, tapi harus ada agar antarmukanya sama ---
  async startVoice() { throw new Error('Obrolan suara hanya tersedia pada koneksi langsung'); }
  setMuted() {}
  callRemote() {}
  destroy() { this.mati = true; clearTimeout(this._t); this.conn = null; }
}
