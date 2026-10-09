// ============================================================
//  KEKAYAAN — supaya uang benar-benar berguna
//
//  Empat cara memakai uang, masing-masing memberi sesuatu yang nyata:
//
//   1. STAF PRIBADI  — satpam, asisten Handoyo, manajer galeri Naswa,
//      sopir, koki, tukang taman. Bergaji tiap bulan (3 hari game), dan
//      masing-masing benar-benar mengubah cara rumah ini berjalan.
//
//   2. ASET & INVESTASI — sawah, kebun sawit, kontrakan, ruko, kos-kosan,
//      waralaba, deposito, reksadana. Uang keluar besar, lalu KEMBALI
//      sebagai penghasilan berkala. Tiap aset menampilkan imbal hasil
//      dan berapa lama modal balik.
//
//   3. KENDARAAN — dari motor listrik sampai sedan Eropa. Menaikkan
//      elegansi rumah dan memangkas lelah perjalanan kerja.
//
//   4. ELEGANSI — peningkatan lantai, pencahayaan, taman, fasad, dan
//      perabot. Ini yang mengubah TAMPILAN rumah: marmer, lampu gantung,
//      air mancur, teras bertiang. Makin tinggi elegansi, makin bagus
//      suasana hati, makin mahal lukisan Naswa laku, makin kagum tamu.
// ============================================================
import { MOODLETS, fmtRp } from './data.js';

Object.assign(MOODLETS, {
  rumahMewah: { label: 'Bangga dengan rumah sendiri', emoji: '✨', val: 18, dur: 720 },
  dilayani: { label: 'Segalanya terurus rapi', emoji: '🤵', val: 14, dur: 600 },
  panenAset: { label: 'Penghasilan aset masuk', emoji: '📈', val: 12, dur: 420 },
});

// ---------------- 1. STAF PRIBADI ----------------
//  gaji: per bulan (dibayar tiap 3 hari game, seirama tagihan)
export const STAF_PREMIUM = {
  satpam: { nama: 'Pak Yono', peran: 'Satpam Pribadi', gaji: 4500000, ikon: '🛡️',
    guna: 'Menjaga rumah 24 jam: pencurian & gangguan malam tidak pernah terjadi lagi, tamu disambut di gerbang.' },
  asistenH: { nama: 'Mbak Vina', peran: 'Asisten Pribadi Handoyo', gaji: 7000000, ikon: '🗂️', untuk: 'Handoyo',
    guna: 'Mengurus administrasi proyek: bayaran proyek naik 25% dan tagihan rumah dibayar otomatis.' },
  manajerN: { nama: 'Mas Bagas', peran: 'Manajer Galeri Naswa', gaji: 7000000, ikon: '🖼️', untuk: 'Naswa',
    guna: 'Memajang lukisan otomatis & menegosiasi pembeli: harga jual lukisan naik 25%.' },
  sopir: { nama: 'Pak Eko', peran: 'Sopir Pribadi', gaji: 5000000, ikon: '🚘',
    guna: 'Mengantar ke mana saja: tidak lelah di perjalanan dan mobil selalu bersih.' },
  koki: { nama: 'Chef Renata', peran: 'Koki Pribadi', gaji: 9000000, ikon: '👨‍🍳',
    guna: 'Dapur tidak pernah kehabisan bahan, dan selalu ada masakan hangat siap santap.' },
  taman: { nama: 'Pak Sukir', peran: 'Perawat Taman', gaji: 3500000, ikon: '🌿',
    guna: 'Rumput selalu rapi dan semua tanaman tersiram tanpa perlu kamu urus.' },
};

// ---------------- 2. ASET & INVESTASI ----------------
//  hasil: rupiah per siklus · siklus: berapa hari game sekali cair
export const ASET = {
  deposito: { nama: 'Deposito Bank', harga: 100000000, hasil: 420000, siklus: 3, ikon: '🏦', risiko: 0,
    ket: 'Paling aman. Bunganya kecil tapi tidak pernah meleset. Bisa dicairkan penuh kapan saja.' },
  reksadana: { nama: 'Reksadana Saham', harga: 250000000, hasil: 3800000, siklus: 3, ikon: '📊', risiko: 0.55,
    ket: 'Imbal hasilnya jauh lebih besar, tapi bisa merah di bulan tertentu. Untuk yang sabar.' },
  sawah: { nama: 'Sawah 1 Hektar', harga: 450000000, hasil: 38000000, siklus: 9, ikon: '🌾', risiko: 0.2,
    ket: 'Panen tiap 3 bulan. Dikelola Pak Tarno dan petani komplek — mereka dapat bagi hasil.' },
  sawit: { nama: 'Kebun Sawit 2 Hektar', harga: 1200000000, hasil: 85000000, siklus: 6, ikon: '🌴', risiko: 0.25,
    ket: 'Panen tiap 2 bulan sepanjang tahun. Harga TBS naik-turun ikut pasar.' },
  kontrakan: { nama: 'Kontrakan 6 Pintu', harga: 2400000000, hasil: 120000000, siklus: 3, ikon: '🏘️', risiko: 0.1,
    ket: 'Sewa bulanan dari enam keluarga. Sesekali ada yang telat bayar.' },
  ruko: { nama: 'Ruko 2 Lantai', harga: 4500000000, hasil: 230000000, siklus: 3, ikon: '🏢', risiko: 0.15,
    ket: 'Disewa usaha laundry & apotek. Sewa tahunan dibayar per bulan.' },
  waralaba: { nama: 'Waralaba Kopi Griya', harga: 1800000000, hasil: 105000000, siklus: 3, ikon: '☕', risiko: 0.3,
    ket: 'Bagi hasil dari kedai kopi sebelah rumah. Ramai saat musim hujan.' },
  kos: { nama: 'Kos-kosan 20 Kamar', harga: 6000000000, hasil: 320000000, siklus: 3, ikon: '🛏️', risiko: 0.12,
    ket: 'Dekat kampus, nyaris selalu penuh. Butuh penjaga — sudah termasuk.' },
  apartemen: { nama: 'Apartemen Jakarta', harga: 9000000000, hasil: 400000000, siklus: 3, ikon: '🌃', risiko: 0.18,
    ket: 'Disewakan harian lewat aplikasi. Nilai propertinya ikut naik tiap tahun.' },
  villa: { nama: 'Villa Puncak', harga: 12000000000, hasil: 520000000, siklus: 3, ikon: '🏔️', risiko: 0.35,
    ket: 'Disewakan akhir pekan. Ramai saat libur, sepi saat musim hujan. Elegansi +8.', elegansi: 8 },
};

// ---------------- 3. KENDARAAN ----------------
export const KENDARAAN = {
  motorListrik: { nama: 'Motor Listrik', harga: 45000000, ikon: '🛵', elegansi: 2, warna: '#2e7d32',
    ket: 'Irit dan senyap. Cocok untuk keliling komplek dan belanja ke warung.' },
  mpv: { nama: 'Mobil Keluarga (MPV)', harga: 420000000, ikon: '🚐', elegansi: 5, warna: '#455a64',
    ket: 'Muat banyak. Enak untuk mengantar anak-anak panti jalan-jalan.' },
  suv: { nama: 'SUV Premium', harga: 1100000000, ikon: '🚙', elegansi: 10, warna: '#1c2733',
    ket: 'Tinggi, kokoh, dan nyaman di jalan kampung maupun tol.' },
  sedan: { nama: 'Sedan Eropa', harga: 2300000000, ikon: '🚗', elegansi: 16, warna: '#0f2a4a',
    ket: 'Kabin senyap, interior kulit. Yang lewat selalu menoleh — dengan sopan.' },
  listrikMewah: { nama: 'Sedan Listrik Mewah', harga: 3800000000, ikon: '⚡', elegansi: 22, warna: '#e8eaec',
    ket: 'Tanpa suara, tanpa emisi. Paling elegan tanpa harus berisik.' },
};

// ---------------- 4. UPGRADE ELEGANSI ----------------
//  Tiap kategori punya 3 tingkat. Semua mengubah TAMPILAN rumah.
export const ELEGANSI = {
  lantai: { nama: 'Lantai', ikon: '◻️', tingkat: [
    { n: 'Granit Poles', h: 180000000, e: 6, k: 'Granit abu hangat dengan nat tipis. Pantulan lampunya lembut.' },
    { n: 'Marmer Carrara', h: 850000000, e: 14, k: 'Marmer putih berurat abu. Ruangan langsung terasa lebih luas dan tenang.' },
    { n: 'Marmer & Inlay Kuningan', h: 2600000000, e: 24, k: 'Marmer dengan garis kuningan membingkai tiap ruang. Sangat halus, tidak berlebihan.' },
  ] },
  cahaya: { nama: 'Pencahayaan', ikon: '💡', tingkat: [
    { n: 'Downlight Hangat', h: 120000000, e: 5, k: 'Lampu tanam 2700K. Cahaya merata tanpa silau.' },
    { n: 'Cove Lighting', h: 540000000, e: 12, k: 'Cahaya tersembunyi di balik lis plafon. Langit-langit terasa mengambang.' },
    { n: 'Lampu Gantung Kristal', h: 1900000000, e: 22, k: 'Satu lampu gantung di ruang keluarga. Malam hari rumah ini berubah sama sekali.' },
  ] },
  taman: { nama: 'Taman', ikon: '🌳', tingkat: [
    { n: 'Taman Tertata', h: 160000000, e: 5, k: 'Rumput rapi, semak dipangkas, jalur batu alam.' },
    { n: 'Kolam Koi & Topiari', h: 720000000, e: 13, k: 'Kolam koi kecil dengan gemericik air dan topiari simetris.' },
    { n: 'Air Mancur Marmer', h: 2200000000, e: 23, k: 'Air mancur di tengah halaman depan, menyala lembut saat malam.' },
  ] },
  fasad: { nama: 'Fasad & Pagar', ikon: '🏛️', tingkat: [
    { n: 'Pagar Besi Tempa', h: 220000000, e: 6, k: 'Pagar tempa hitam dengan pilar batu alam.' },
    { n: 'Teras Bertiang', h: 980000000, e: 15, k: 'Portico bertiang di depan pintu utama. Simetris dan teduh.' },
    { n: 'Gerbang Otomatis & Lis Kuningan', h: 2900000000, e: 25, k: 'Gerbang membuka sendiri, lis kuningan membingkai fasad.' },
  ] },
  perabot: { nama: 'Perabot', ikon: '🛋️', tingkat: [
    { n: 'Kayu Jati Solid', h: 260000000, e: 6, k: 'Seluruh perabot diganti jati solid finishing natural.' },
    { n: 'Set Desainer', h: 1400000000, e: 14, k: 'Sofa kulit, meja marmer, karpet wol tenun tangan.' },
    { n: 'Galeri Pribadi', h: 3200000000, e: 24, k: 'Dinding galeri dengan pencahayaan khusus untuk lukisan Naswa.' },
  ] },
};

export const ELEGANSI_MAKS = Object.values(ELEGANSI).reduce((a, k) => a + k.tingkat[k.tingkat.length - 1].e, 0)
  + Object.values(KENDARAAN).reduce((a, k) => Math.max(a, k.elegansi), 0) + 8;

export const GELAR = [
  [0, 'Rumah Sederhana'], [20, 'Rumah Rapi'], [40, 'Rumah Nyaman'], [60, 'Rumah Elegan'],
  [85, 'Kediaman Mewah'], [110, 'Kediaman Istimewa'],
];
export const gelarDari = (e) => (GELAR.filter((g) => e >= g[0]).pop() || GELAR[0])[1];

// ============================================================
//  pemasangan ke dunia
// ============================================================
export function installKekayaan(hh) {
  const W = hh.world;
  if (!W.kaya) W.kaya = { staf: {}, aset: {}, kendaraan: {}, elegansi: {}, log: [], bayarHari: -1 };
  const K = W.kaya;
  for (const k of ['staf', 'aset', 'kendaraan', 'elegansi']) if (!K[k]) K[k] = {};
  if (!Array.isArray(K.log)) K.log = [];

  hh.elegansi = () => nilaiElegansi(W);
  hh.punyaStaf = (k) => !!K.staf[k];
  hh.kayaCmd = (c) => kayaCmd(hh, c);
  hh.kayaHari = (hari) => kayaHari(hh, hari);
}

export function nilaiElegansi(W) {
  const K = W.kaya || {}; let e = 0;
  for (const [kat, tg] of Object.entries(K.elegansi || {})) {
    const def = ELEGANSI[kat]; if (!def) continue;
    for (let i = 0; i < tg; i++) e += def.tingkat[i].e;
  }
  for (const k in K.kendaraan || {}) e += (KENDARAAN[k] || {}).elegansi || 0;
  for (const k in K.aset || {}) e += (ASET[k] || {}).elegansi || 0;
  return e;
}
export const biayaStafBulanan = (W) => Object.keys((W.kaya || {}).staf || {}).reduce((a, k) => a + (STAF_PREMIUM[k] ? STAF_PREMIUM[k].gaji : 0), 0);
export const nilaiAset = (W) => Object.keys((W.kaya || {}).aset || {}).reduce((a, k) => a + (ASET[k] ? ASET[k].harga : 0), 0);
export const hasilBulanan = (W) => Object.keys((W.kaya || {}).aset || {}).reduce((a, k) => {
  const A = ASET[k]; return A ? a + (A.hasil * 3) / A.siklus : a;
}, 0);

function catat(K, teks) { K.log.unshift({ t: Date.now(), teks }); if (K.log.length > 30) K.log.pop(); }

// ---------------- perintah beli / jual ----------------
function kayaCmd(hh, c) {
  const W = hh.world, K = W.kaya;
  const siapa = ['Handoyo', 'Naswa'].includes(c.sim) ? c.sim : 'Handoyo';
  const dompet = hh.sims[siapa];
  const bayar = (n, ket) => {
    if (dompet.wallet < n) { hh.toast(`Saldo ${siapa} kurang. Butuh ${fmtRp(n)}.`, 'bad'); return false; }
    hh.op({ o: 'money', d: -n, why: ket, sim: siapa }); return true;
  };

  if (c.op === 'staf') {
    const S = STAF_PREMIUM[c.k]; if (!S) return;
    if (K.staf[c.k]) {                                    // berhentikan
      delete K.staf[c.k];
      catat(K, `${S.ikon} ${S.nama} (${S.peran}) diberhentikan dengan hormat.`);
      hh.toast(`${S.nama} pamit. "Terima kasih sudah dipercaya, Pak, Bu."`, 'info', true);
    } else {
      if (!bayar(S.gaji, `Gaji pertama ${S.nama}`)) return;
      K.staf[c.k] = { sejak: W.time };
      catat(K, `${S.ikon} ${S.nama} mulai bekerja sebagai ${S.peran}.`);
      hh.toast(`${S.ikon} ${S.nama} resmi bergabung sebagai ${S.peran}. ${S.guna}`, 'good', true);
      for (const h of hh.humans()) h.mood('dilayani');
      hh.addFam(6); hh.sfx('fanfare');
    }
    return;
  }

  if (c.op === 'aset') {
    const A = ASET[c.k]; if (!A || K.aset[c.k]) return;
    if (!bayar(A.harga, `Beli ${A.nama}`)) return;
    K.aset[c.k] = { sejak: W.time, hariBerikut: Math.floor(W.time / 1440) + A.siklus, total: 0 };
    catat(K, `${A.ikon} Membeli ${A.nama} seharga ${fmtRp(A.harga)}.`);
    hh.toast(`${A.ikon} ${A.nama} resmi jadi milik kalian. Hasil pertama cair ${A.siklus} hari lagi.`, 'money', true);
    hh.addFam(12); hh.sfx('cash');
    return;
  }
  if (c.op === 'jualAset') {
    const A = ASET[c.k]; const punya = K.aset[c.k]; if (!A || !punya) return;
    const nilai = Math.round(A.harga * (A.risiko > 0.3 ? 0.88 : 0.95));
    delete K.aset[c.k];
    hh.op({ o: 'money', d: nilai, why: `Jual ${A.nama}`, sim: siapa });
    catat(K, `${A.ikon} Menjual ${A.nama} seharga ${fmtRp(nilai)} (total hasil selama dimiliki: ${fmtRp(punya.total || 0)}).`);
    hh.toast(`${A.nama} terjual ${fmtRp(nilai)}. Selama dimiliki sudah menghasilkan ${fmtRp(punya.total || 0)}.`, 'money', true);
    return;
  }

  if (c.op === 'kendaraan') {
    const V = KENDARAAN[c.k]; if (!V || K.kendaraan[c.k]) return;
    if (!bayar(V.harga, `Beli ${V.nama}`)) return;
    K.kendaraan[c.k] = { sejak: W.time };
    const mobil = W.objects.find((o) => o.type === 'car');
    if (mobil && V.warna) { mobil.s = mobil.s || {}; mobil.s.warna = V.warna; mobil.s.dirt = 0; W.objVer++; }
    catat(K, `${V.ikon} Membeli ${V.nama} seharga ${fmtRp(V.harga)}.`);
    hh.toast(`${V.ikon} ${V.nama} sudah terparkir di carport. Elegansi +${V.elegansi}.`, 'good', true);
    for (const h of hh.humans()) h.mood('rumahMewah');
    hh.addFam(10); hh.sfx('fanfare'); hh.eleganBerubah && hh.eleganBerubah();
    return;
  }

  if (c.op === 'elegansi') {
    const E = ELEGANSI[c.k]; if (!E) return;
    const kini = K.elegansi[c.k] || 0;
    if (kini >= E.tingkat.length) return;
    const T = E.tingkat[kini];
    if (!bayar(T.h, `${E.nama}: ${T.n}`)) return;
    K.elegansi[c.k] = kini + 1;
    catat(K, `${E.ikon} ${E.nama} ditingkatkan ke ${T.n} (${fmtRp(T.h)}).`);
    hh.toast(`${E.ikon} ${E.nama} sekarang ${T.n}. ${T.k}`, 'good', true);
    for (const h of hh.humans()) h.mood('rumahMewah');
    hh.addFam(14); hh.sfx('level');
    hh.eleganBerubah && hh.eleganBerubah();                 // minta tampilan rumah diperbarui
    const e = nilaiElegansi(W);
    hh.toast(`✨ Elegansi rumah: ${e} — "${gelarDari(e)}"`, 'info');
    return;
  }
}

// ---------------- tiap pergantian hari: gaji keluar, hasil aset masuk ----------------
function kayaHari(hh, hari) {
  const W = hh.world, K = W.kaya; if (!K) return;

  // gaji staf tiap 3 hari game (= 1 bulan kalender dalam game ini)
  if (hari > 0 && hari % 3 === 0 && K.bayarHari !== hari) {
    K.bayarHari = hari;
    const total = biayaStafBulanan(W);
    if (total > 0) {
      const H = hh.sims.Handoyo, N = hh.sims.Naswa;
      const dari = H.wallet >= total ? H : (N.wallet >= total ? N : null);
      if (dari) {
        hh.op({ o: 'money', d: -total, why: 'Gaji staf pribadi', sim: dari.name });
        hh.toast(`🤵 Gaji bulanan staf pribadi ${fmtRp(total)} dibayar dari dompet ${dari.name}.`, 'money');
      } else {
        // tidak sanggup bayar: staf termahal pamit baik-baik
        const k = Object.keys(K.staf).sort((a, b) => STAF_PREMIUM[b].gaji - STAF_PREMIUM[a].gaji)[0];
        if (k) { const S = STAF_PREMIUM[k]; delete K.staf[k];
          catat(K, `${S.ikon} ${S.nama} berhenti karena gaji tidak terbayar.`);
          hh.toast(`😔 Gaji staf tidak terbayar. ${S.nama} pamit baik-baik. Sisanya masih bertahan.`, 'bad', true); }
      }
    }
  }

  // hasil aset
  let masuk = 0; const rinci = [];
  for (const [k, p] of Object.entries(K.aset)) {
    const A = ASET[k]; if (!A) continue;
    if (hari < (p.hariBerikut || 0)) continue;
    p.hariBerikut = hari + A.siklus;
    // risiko: sebagian aset bisa di bawah atau di atas perkiraan
    const goyang = A.risiko ? 1 + (Math.random() - 0.45) * 2 * A.risiko : 1;
    const n = Math.max(0, Math.round(A.hasil * goyang));
    p.total = (p.total || 0) + n; masuk += n;
    rinci.push(`${A.ikon} ${A.nama} ${fmtRp(n)}${goyang < 0.9 ? ' (di bawah perkiraan)' : goyang > 1.15 ? ' (di atas perkiraan!)' : ''}`);
  }
  if (masuk > 0) {
    hh.op({ o: 'money', d: masuk, why: 'Hasil aset & investasi', sim: 'Handoyo' });
    hh.toast(`📈 Hasil aset masuk ${fmtRp(masuk)} — ${rinci.join(' · ')}`, 'money', true);
    for (const h of hh.humans()) h.mood('panenAset');
    hh.sfx('cash');
  }

  // elegansi memberi suasana hati tiap pagi
  const e = nilaiElegansi(W);
  if (e >= 40) for (const h of hh.humans()) if (Math.random() < 0.5) h.mood('rumahMewah');
}

// ---------------- pengaruh staf ke bagian lain permainan ----------------
export function pengaruhStaf(hh) {
  const K = hh.world.kaya || {}; const s = K.staf || {};
  return {
    proyek: s.asistenH ? 1.25 : 1,
    lukisan: s.manajerN ? 1.25 : 1,
    aman: !!s.satpam,
    sopir: !!s.sopir,
    koki: !!s.koki,
    taman: !!s.taman,
  };
}
