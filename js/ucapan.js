// ============================================================
//  SUARA OBROLAN — tiap warga benar-benar BERBICARA
//
//  Setiap kalimat yang muncul di atas kepala warga sekarang ada audionya.
//  Dua lapis, otomatis dipilih sesuai kemampuan perangkat:
//
//   1. Suara asli (Web Speech / text-to-speech bahasa Indonesia).
//      Tiap warga punya PROFIL SUARA sendiri — tinggi nada, kecepatan,
//      dan pilihan suara — diturunkan dari namanya, jadi selalu konsisten:
//      Mbah Karso selalu berat & pelan, Melati selalu kecil & cepat.
//
//   2. Kalau perangkat tidak punya suara TTS, dipakai "celoteh" buatan
//      (WebAudio): nada-nada pendek mengikuti pola suku kata kalimatnya,
//      seperti suara karakter di game klasik. Jadi SELALU ada audionya.
//
//  Mulut karakter ikut bergerak selama ia bicara, dan hanya warga yang
//  terlihat di layar yang bersuara supaya tidak berisik.
// ============================================================

const PEREMPUAN = /^(Bu|Mbak|Mbok|Yu|Kak|Bi|Mak|Nyai|Ibu)\b/i;
const TUA = /^(Mbah|Pak Harjo|Mbah Karso|Mbah Warsini)/i;

// Warga yang sifat suaranya memang khas — sisanya diturunkan dari namanya.
const PROFIL = {
  Handoyo: { p: 0.92, r: 1.0, pria: true },
  Naswa: { p: 1.22, r: 1.02, pria: false },
  'Pak Ismail': { p: 0.72, r: 0.92, pria: true },       // badan besar, suara berat
  'Bu Aisyah': { p: 1.18, r: 0.96, pria: false },
  'Mbah Karso': { p: 0.68, r: 0.78, pria: true },       // kakek tertua, pelan
  'Mbah Warsini': { p: 1.04, r: 0.8, pria: false },
  'Pak Harjo': { p: 0.86, r: 0.9, pria: true },         // ketua RT, berwibawa
  'Pak Slamet': { p: 0.8, r: 0.95, pria: true },
  'Bang Jefri': { p: 0.95, r: 1.12, pria: true },       // cepat, agak gugup
  'Mak Ijah': { p: 1.1, r: 1.08, pria: false },
  'Mbak Laras': { p: 1.26, r: 1.0, pria: false },
  'Bu Asih': { p: 1.06, r: 0.9, pria: false },          // pengasuh, lembut
  'Kak Rina': { p: 1.3, r: 1.08, pria: false },
  'Mas Kurir': { p: 1.0, r: 1.18, pria: true },         // buru-buru
};
// anak-anak panti: suara kecil & cepat, makin muda makin tinggi
const ANAK_UMUR = { Riko: 11, Sari: 10, Bagas: 9, Nabila: 9, Dimas: 8, Putri: 8, Fajar: 7, Aisyah: 7, Yoga: 6, Melati: 6 };

function sidik(n) { let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0; return h; }

export function profil(nama) {
  if (PROFIL[nama]) return PROFIL[nama];
  if (ANAK_UMUR[nama]) {
    const u = ANAK_UMUR[nama];
    return { p: 1.75 - (u - 6) * 0.055, r: 1.14 + (11 - u) * 0.012, pria: !/^(Sari|Nabila|Putri|Aisyah|Melati)$/.test(nama), anak: true };
  }
  const h = sidik(nama);
  const perempuan = PEREMPUAN.test(nama);
  const tua = TUA.test(nama);
  const dasar = perempuan ? 1.18 : 0.88;
  return {
    p: Math.max(0.5, Math.min(1.8, dasar + ((h % 17) - 8) * 0.018 - (tua ? 0.16 : 0))),
    r: Math.max(0.65, Math.min(1.35, 1.0 + (((h >> 5) % 13) - 6) * 0.022 - (tua ? 0.14 : 0))),
    pria: !perempuan,
  };
}

// hitung suku kata kasar bahasa Indonesia (untuk celoteh & durasi mulut)
const sukuKata = (t) => Math.max(1, (String(t).toLowerCase().match(/[aiueo]+/g) || []).length);

export class Ucapan {
  constructor(sound) {
    this.sound = sound;                 // SoundFX — dipakai untuk mode celoteh & volume
    this.on = true;
    this.mode = 'auto';                 // 'auto' | 'asli' | 'celoteh' | 'mati'
    this.suara = [];
    this.indo = [];
    this.siap = false;
    this.antre = [];
    this.bicara = new Map();            // nama -> waktu selesai (ms) untuk animasi mulut
    this.terakhir = new Map();          // anti-ulang kalimat yang sama
    this._muat();
  }
  _muat() {
    const tts = typeof speechSynthesis !== 'undefined' ? speechSynthesis : null;
    if (!tts) { this.siap = true; return; }
    const ambil = () => {
      this.suara = tts.getVoices() || [];
      this.indo = this.suara.filter((v) => /^id\b|^id-/i.test(v.lang || ''));
      this.siap = true;
    };
    ambil();
    if (!this.suara.length) { tts.onvoiceschanged = ambil; setTimeout(ambil, 900); }
  }
  get adaTTS() { return this.suara.length > 0; }
  get pakaiAsli() {
    if (this.mode === 'celoteh') return false;
    if (this.mode === 'asli') return true;
    return this.adaTTS;               // auto: pakai suara asli kalau perangkat punya
  }
  // apakah warga ini sedang bicara (untuk gerak mulut)
  sedangBicara(nama) { const t = this.bicara.get(nama); return !!t && t > performance.now(); }

  setel(mode) { this.mode = mode; if (mode === 'mati') this.hentikan(); }
  hentikan() { try { speechSynthesis && speechSynthesis.cancel(); } catch (e) { /* abaikan */ } this.bicara.clear(); this.antre.length = 0; }

  // ---------- bicara ----------
  ucap(nama, teks, { jarak = 0, paksa = false } = {}) {
    if (!this.on || this.mode === 'mati' || !teks) return;
    if (this.sound && !this.sound.on) return;
    const bersih = String(teks).replace(/[*_~`#>|]/g, '').replace(/\s+/g, ' ').trim().slice(0, 220);
    if (!bersih) return;
    // jangan mengulang kalimat yang sama dari orang yang sama dalam 4 detik
    const kunci = nama + '|' + bersih;
    const now = performance.now();
    if (!paksa && this.terakhir.get(kunci) > now - 4000) return;
    this.terakhir.set(kunci, now);
    if (this.terakhir.size > 60) this.terakhir.clear();
    // yang jauh dari kamera tidak usah bersuara
    if (jarak > 26) return;

    const P = profil(nama);
    const suku = sukuKata(bersih);
    const durasi = Math.min(9000, 320 + (suku * 185) / (P.r || 1));
    this.bicara.set(nama, now + durasi);
    const vol = Math.max(0, Math.min(1, (this.sound ? this.sound.vol : 0.8) * (jarak > 10 ? 0.45 : 1)));

    if (this.pakaiAsli) this._tts(bersih, P, vol);
    else this._celoteh(bersih, P, vol, suku);
  }

  _tts(teks, P, vol) {
    try {
      const u = new SpeechSynthesisUtterance(teks);
      u.lang = 'id-ID';
      // pilih suara: utamakan bahasa Indonesia, lalu cocokkan jenis suara
      let v = null;
      if (this.indo.length) {
        const cocok = this.indo.filter((x) => (P.pria ? /male|pria|ardi|gadis/i.test(x.name) === /male|pria|ardi/i.test(x.name) : true));
        v = (P.pria ? this.indo.find((x) => /male|pria|ardi/i.test(x.name)) : this.indo.find((x) => /female|wanita|gadis|andika|sri/i.test(x.name))) || cocok[0] || this.indo[0];
      } else if (this.suara.length) {
        v = this.suara.find((x) => /^(ms|en)-/i.test(x.lang)) || this.suara[0];
      }
      if (v) u.voice = v;
      u.pitch = Math.max(0, Math.min(2, P.p));
      u.rate = Math.max(0.1, Math.min(2, P.r));
      u.volume = vol;
      // jangan menumpuk: kalau antrean panjang, batalkan yang lama
      if (speechSynthesis.pending || speechSynthesis.speaking) {
        this._n = (this._n || 0) + 1;
        if (this._n > 2) { speechSynthesis.cancel(); this._n = 0; }
      }
      u.onend = u.onerror = () => { this._n = Math.max(0, (this._n || 1) - 1); };
      speechSynthesis.speak(u);
    } catch (e) { /* kalau gagal, biarkan — mulut tetap bergerak */ }
  }

  // Celoteh buatan: nada pendek mengikuti pola vokal kalimat.
  // Bukan kata sungguhan, tapi iramanya mengikuti kalimat sehingga terasa
  // seperti karakter yang sedang bicara.
  _celoteh(teks, P, vol, suku) {
    const S = this.sound; if (!S || !S.ensure || !S.ensure()) return;
    const ctx = S.ctx; if (!ctx) return;
    const vokal = (teks.toLowerCase().match(/[aiueo]/g) || ['a']).slice(0, 40);
    const NADA = { a: 0, i: 7, u: -5, e: 3, o: -2 };
    const dasar = 150 * (P.p || 1);
    const jeda = 0.115 / (P.r || 1);
    const t0 = ctx.currentTime + 0.02;
    const n = Math.min(vokal.length, 26);
    for (let i = 0; i < n; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = P.anak ? 'triangle' : 'sawtooth';
      const semi = (NADA[vokal[i]] || 0) + (i % 3) - 1 + (i === n - 1 ? -3 : 0);   // turun di akhir kalimat
      o.frequency.value = dasar * Math.pow(2, semi / 12);
      f.type = 'bandpass'; f.frequency.value = dasar * 4.2; f.Q.value = 1.6;
      const mulai = t0 + i * jeda;
      g.gain.setValueAtTime(0, mulai);
      g.gain.linearRampToValueAtTime(0.055 * vol, mulai + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, mulai + jeda * 0.82);
      o.connect(f).connect(g).connect(S.master || ctx.destination);
      o.start(mulai); o.stop(mulai + jeda);
    }
  }
}
