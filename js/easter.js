// ============================================================
//  🥚 EASTER EGG GRIYA ASRI — 10 rahasia + jurnal penemuan
//  Tiap rahasia punya pemicu, hadiah, dan efek visual/suara.
//  Menemukan kesepuluhnya membuka gelar & plumbob emas.
// ============================================================
import { TYPES, MOODLETS, fmtRp, clamp, HOUSE } from './data.js';
import { BOOKS } from './books.js';

Object.assign(MOODLETS, {
  juaraHidang: { label: 'Juara Nasi Padang Rush', emoji: '🏆', val: 22, dur: 600 },
  merinding: { label: 'Merinding di perpustakaan', emoji: '👻', val: -6, dur: 180 },
  upacara: { label: 'Khidmat ikut upacara 17-an', emoji: '🇮🇩', val: 20, dur: 600 },
  mimpiSama: { label: 'Bermimpi hal yang sama', emoji: '💭', val: 18, dur: 480 },
  retro: { label: 'Nostalgia mode retro', emoji: '🕹️', val: 14, dur: 420 },
  detektif: { label: 'Merasa jadi detektif', emoji: '🔎', val: 16, dur: 600 },
  rajaCapy: { label: 'Bertemu Raja Capybara', emoji: '👑', val: 20, dur: 480 },
  penjelajah: { label: 'Penjelajah Griya Asri', emoji: '🗺️', val: 25, dur: 100000 },
});
// piala hasil minigame & easter egg (dibuat lewat katalog parametrik)
TYPES.trofiHidang = { name: 'Piala "Juara Hidang"', cat: 'dekor', price: 0, w: 0.4, d: 0.4, icon: '🏆', spots: [{ ax: 0, az: 0.6, yaw: Math.PI }], acts: ['admire'],
  parts: [['b', 0.34, 0.12, 0.34, 0, 0.06, 0, '#3e2723'], ['c', 0.06, 0.1, 0.25, 0, 0.24, 0, '#d4af37', { m: 0.9, r: 0.25 }], ['s', 0.16, 0, 0.46, 0, '#d4af37', { m: 0.9, r: 0.25, sy: 0.9 }], ['t', 0.14, 0.02, -0.17, 0.46, 0, '#d4af37', { m: 0.9 }], ['t', 0.14, 0.02, 0.17, 0.46, 0, '#d4af37', { m: 0.9 }], ['s', 0.05, 0, 0.66, 0, '#ffd740', { e: '#ffd740', ei: 0.6 }]] };
TYPES.trofiPenjelajah = { name: 'Plakat "Penjelajah Griya Asri"', cat: 'dekor', price: 0, w: 0.5, d: 0.3, icon: '🗺️', spots: [{ ax: 0, az: 0.6, yaw: Math.PI }], acts: ['admire'],
  parts: [['b', 0.48, 0.66, 0.06, 0, 0.6, 0, '#4e342e'], ['b', 0.38, 0.5, 0.02, 0, 0.62, 0.04, '#d4af37', { m: 0.9, r: 0.2 }], ['s', 0.07, 0, 0.98, 0, '#7bf1a8', { e: '#46d36b', ei: 0.8 }], ['b', 0.5, 0.06, 0.2, 0, 0.03, 0, '#3e2723']] };

export const EGGS = [
  { id: 'konami', nama: 'Kode Sakti Lawas', ikon: '🕹️', petunjuk: 'Katanya ada kode rahasia legendaris dari zaman konsol 8-bit. Coba ketik di keyboard saat sedang main…', hadiah: 'Rp 17.845.000 & mode retro' },
  { id: 'rosebud', nama: 'Kata Ajaib Tetangga Sebelah', ikon: '🌹', petunjuk: 'Pemain game simulasi rumah zaman dulu tahu satu kata sakti untuk urusan dompet. Ketik di kolom chat.', hadiah: 'Rp 10.000.000 (sekali seumur rumah)' },
  { id: 'plumbob', nama: 'Plumbob Pelangi', ikon: '💎', petunjuk: 'Kristal hijau di atas kepala itu… kalau dicolek berkali-kali, apa dia marah?', hadiah: 'Plumbob berubah warna pelangi' },
  { id: 'hantu', nama: 'Penunggu Perpustakaan', ikon: '👻', petunjuk: 'Ada yang bilang lantai 2 tidak pernah benar-benar kosong pada pukul 03.33 dini hari.', hadiah: 'Buku rahasia terbuka di rak' },
  { id: 'forensik', nama: 'Detektif Rumahan', ikon: '🔎', petunjuk: 'Naswa punya 14 buku forensik. Habiskan semuanya, halaman terakhir sekalipun.', hadiah: 'Gelar & berkas rahasia komplek' },
  { id: 'capy', nama: 'Capy-ccino', ikon: '☕', petunjuk: 'Bagaimana kalau capybara sendiri yang antre memesan kopi di Kopi Griya?', hadiah: 'Mahkota Raja Capybara' },
  { id: 'mona', nama: 'Mona Naswa', ikon: '🖼️', petunjuk: 'Beri judul lukisanmu seperti mahakarya paling terkenal di dunia, dengan nama sang pelukis.', hadiah: 'Tawaran museum 10× lipat' },
  { id: 'daun', nama: 'Hujan Daun Emas', ikon: '🍂', petunjuk: 'Musim gugur itu untuk dinikmati. Lompatlah ke tumpukan daun berkali-kali seperti anak kecil.', hadiah: 'Hujan daun & koin' },
  { id: 'upacara', nama: 'Upacara Bendera RT 05', ikon: '🇮🇩', petunjuk: 'Ada satu pagi dalam setahun ketika seluruh komplek berdiri hormat. Jangan tidur pagi itu.', hadiah: 'Momen khidmat se-RT' },
  { id: 'mimpi', nama: 'Mimpi yang Sama', ikon: '💭', petunjuk: 'Saat badai mengguyur, tidurlah berdua di satu kasur pada waktu yang sama.', hadiah: 'Moodlet mimpi bersama' },
];
const FORENSIK_IDS = BOOKS.filter((b) => b.shelf === 'forensik').map((b) => b.id);
const SECRET_BOOKS = [
  { id: 'sx1', shelf: 'forensik', title: 'Berkas Rahasia Griya Asri (terkunci)', author: 'Anonim · ditemukan di rak paling atas', skill: 'logika', secret: true, pages: [
    'BERKAS 01 — Pos ronda, 03.10. Pak Slamet mencatat: "Ada suara piring beradu dari rumah kosong blok C. Padahal listriknya sudah dicabut sejak 2019."',
    'BERKAS 02 — Perpustakaan lantai 2. Penjaga malam menemukan buku yang selalu kembali ke rak yang sama meski sudah dipindahkan tiga kali. Judulnya: "Bunuh Diri: Sebuah Kajian Sosiologi". Seseorang menyelipkan catatan kecil di dalamnya: "Aku memilih bertahan. Terima kasih sudah membaca sampai sini."',
    'BERKAS 03 — Analisis jejak. Empat bantalan, panjang langkah 22 cm, arah menuju kolam. Kesimpulan penyidik rumah tangga: capybara. Kasus ditutup untuk kedua kalinya.',
    'BERKAS 04 — Catatan Naswa: "Aku suka forensik bukan karena kejahatannya, tapi karena ilmunya membuktikan bahwa kebenaran selalu meninggalkan jejak, sekecil apa pun. Sama seperti kebaikan."',
    'BERKAS 05 — Arsip RT: rumah blok C-7 (rumah Handoyo & Naswa) tercatat sebagai "rumah paling ramai di komplek": 2 manusia, 6+ hewan, 3 ART, dan tetangga yang tidak pernah mengetuk pintu dua kali sebelum masuk. Status: bahagia.',
  ] },
  { id: 'sx2', shelf: 'forensik', title: 'Catatan Penunggu Perpustakaan', author: '???', skill: 'kreatif', secret: true, pages: [
    'Pukul 03.33, lampu gantung berkedip dua kali. Bukan mati listrik — dia hanya menyapa.',
    'Dia bukan hantu yang menakut-nakuti. Dia pembaca yang belum selesai membaca. Setiap malam ia mengambil satu buku, membacanya sampai halaman terakhir, lalu mengembalikannya rapi.',
    'Kalau kamu menemukan buku yang terbuka padahal kamu yakin sudah menutupnya, jangan takut. Tandai saja halamannya. Dia sopan; dia selalu mengembalikan.',
    'Pesan yang tertinggal di meja baca: "Rumah yang penuh buku tidak pernah benar-benar sepi." — tertanda, Penunggu.',
  ] },
];

export function installEaster(hh) {
  const W = hh.world;
  W.eggs = W.eggs || {}; W.readBooks = W.readBooks || [];
  hh.easter = (type, data = {}) => easterEvent(hh, type, data);
  hh.easterMinute = (m) => easterMinute(hh, m);
  if (W.eggs.hantu || W.eggs.forensik) unlockSecretBooks();
}
function unlockSecretBooks() { for (const b of SECRET_BOOKS) if (!BOOKS.some((x) => x.id === b.id)) BOOKS.push(b); }

function found(hh, id, pesan, extra = {}) {
  const W = hh.world; if (W.eggs[id]) return false;
  W.eggs[id] = { at: W.time, day: Math.floor(W.time / 1440) + 1 };
  const E = EGGS.find((e) => e.id === id);
  hh.sfx('fanfare');
  hh.toast(`🥚 EASTER EGG DITEMUKAN (${Object.keys(W.eggs).length}/10): ${E.ikon} ${E.nama} — ${pesan}`, 'good', true);
  hh.addFam(25);
  hh.hooks.eggFound && hh.hooks.eggFound(id, extra);
  if (Object.keys(W.eggs).length >= 10 && !W.eggs.semua) {
    W.eggs.semua = { at: W.time };
    if (!W.objects.some((o) => o.type === 'trofiPenjelajah')) { W.objects.push({ id: W.nextId++, type: 'trofiPenjelajah', x: -7.2, z: 2.2, rot: 0, lvl: 0, s: {} }); W.objVer++; hh.rebuildNav(); }
    for (const h of hh.humans()) h.mood('penjelajah');
    hh.op({ o: 'money', d: 100000000, why: 'Hadiah menemukan semua easter egg' });
    hh.toast('🗺️🏆 SEMUA 10 RAHASIA TERPECAHKAN! Gelar "Penjelajah Griya Asri" terbuka, plumbob jadi emas, plakat dipajang, dan Rp 100.000.000 masuk kas keluarga!', 'money', true);
  }
  return true;
}

function easterEvent(hh, type, d) {
  const W = hh.world;
  switch (type) {
    case 'konami':
      if (found(hh, 'konami', 'Mode retro aktif! Selamat datang kembali, tahun 90-an.')) {
        hh.op({ o: 'money', d: 17845000, why: 'Kode sakti 17-8-45' });
        for (const h of hh.humans()) h.mood('retro');
      } else hh.toast('🕹️ Kode sakti sudah pernah dipakai — tapi nostalgianya tetap gratis.', 'info');
      break;
    case 'chat': {
      const t = String(d.text || '').toLowerCase().trim();
      if (t === 'rosebud' || t === 'motherlode') {
        if (found(hh, 'rosebud', 'Kata sakti dari game simulasi legendaris masih manjur!')) hh.op({ o: 'money', d: 10000000, why: 'Kata ajaib "rosebud"', sim: d.sim });
        else hh.toast('🌹 Kata ajaibnya sudah kadaluarsa, Bos. Kerja lagi ya 😄', 'info');
      }
      if (t === 'griya asri' || t === 'terima kasih claude') hh.toast('🏡 Griya Asri menyapa balik: "Semoga betah tinggal di sini ya!"', 'good');
      break;
    }
    case 'plumbob':
      found(hh, 'plumbob', 'Plumbob-nya ngambek lalu berubah jadi pelangi 🌈');
      break;
    case 'baca': {
      const id = d.book && d.book.id; if (!id) break;
      if (!W.readBooks.includes(id)) W.readBooks.push(id);
      if (FORENSIK_IDS.every((f) => W.readBooks.includes(f))) {
        if (found(hh, 'forensik', 'Semua 14 buku forensik tamat! Berkas rahasia komplek muncul di rak.')) {
          unlockSecretBooks(); W.objVer++;
          for (const h of hh.humans()) h.mood('detektif');
        }
      }
      break;
    }
    case 'kopi':
      if (d.sim && d.sim.species === 'capy') {
        if (found(hh, 'capy', 'Mas Dimas membuatkan "Capy-ccino" spesial dengan busa berbentuk mahkota 👑')) {
          d.sim.hat = 'crown'; d.sim.mood('rajaCapy');
          for (const h of hh.humans()) h.mood('rajaCapy');
        }
      }
      break;
    case 'lukisan': {
      const t = (d.p && d.p.title || '').toLowerCase();
      if (/mona/.test(t)) {
        if (found(hh, 'mona', 'Kurator museum menelepon: "Ini mahakarya!" Tawaran 10× lipat masuk.')) {
          const harga = Math.round((d.p.fair || d.p.price || 2000000) * 10 / 100000) * 100000;
          d.p.status = 'listed'; d.p.price = harga; d.p.offers = d.p.offers || [];
          d.p.offers.push({ id: Math.floor(Math.random() * 1e9), buyer: 'Museum Seni Rupa Nusantara', city: 'Jakarta', amount: harga, max: harga, at: W.time, status: 'pending', msg: `Kami ingin mengoleksi "${d.p.title}" untuk pameran tetap. Kami tawarkan ${fmtRp(harga)}.` });
          hh.galleryChanged && hh.galleryChanged();
        }
      }
      break;
    }
    case 'lompatDaun':
      W.daunCount = (W.daunCount || 0) + 1;
      if (W.daunCount >= 5) {
        if (found(hh, 'daun', 'Angin membawa hujan daun emas — dan beberapa lembar uang yang terselip!')) {
          hh.op({ o: 'money', d: 2500000, why: 'Koin tersembunyi di tumpukan daun' });
          hh.hooks.leafBurst && hh.hooks.leafBurst();
        }
      } else if (!W.eggs.daun) hh.toast(`🍂 Seru juga… (${W.daunCount}/5 lompatan)`, 'info');
      break;
    case 'rushTamat':
      if (d.sempurna) hh.toast('🥇 Gelar "Tangan Emas Etalase" tercatat di jurnal rahasia!', 'good', true);
      break;
  }
}

function easterMinute(hh, m) {
  const W = hh.world; const min = m % 1440, hr = Math.floor(min / 60), mnt = min % 60;
  // 👻 penunggu perpustakaan (03.30–03.40 di lantai 2)
  if (hr === 3 && mnt >= 30 && mnt <= 40 && !W.eggs.hantu) {
    const s = hh.humans().find((h) => (h.lvl || 0) === 1 && !h.hidden);
    if (s) {
      if (found(hh, 'hantu', 'Lampu berkedip, sebuah buku jatuh sendiri… lalu tertata rapi kembali.')) {
        unlockSecretBooks(); W.objVer++; s.mood('merinding'); hh.hooks.ghost && hh.hooks.ghost();
      }
    }
  }
  // 🇮🇩 upacara 17 Agustus (bulan Agustus, dasarian ke-2, jam 07)
  const day = Math.floor(m / 1440), d36 = day % 36;
  if (Math.floor(d36 / 3) === 7 && d36 % 3 === 1 && hr === 7 && mnt === 0) {
    hh.toast('🇮🇩 Pukul 07.00 — warga RT 05 berkumpul di jalan untuk upacara bendera 17 Agustus. Keluarlah rumah dan ikut berdiri hormat!', 'info', true);
    W.upacara = W.time + 60;
    for (const [n, s] of Object.entries(hh.others || {})) { if (s.species !== 'npc' || ['guest', 'courier'].includes(s.role)) continue; s.hidden = false; s.away = false; s.queue = []; hh.queueAct(s, 'go', null, { pos: [-14 + (n.length * 3 % 26), 12.2 + (n.length % 2) * 0.8] }); }
  }
  if (W.upacara && W.time < W.upacara) {
    for (const s of Object.values(hh.others || {})) if (!s.hidden && !s.queue.length && Math.abs(s.z - 12.6) < 2) { s.anim = 'idle'; s.yaw = 0; }
    const ikut = hh.humans().filter((h) => !h.hidden && h.z > 11 && (h.lvl || 0) === 0);
    if (ikut.length && !W.eggs.upacara) {
      if (found(hh, 'upacara', 'Seluruh komplek berdiri hormat bersama kalian. Merdeka! 🇮🇩')) { for (const h of hh.humans()) h.mood('upacara'); hh.hooks.confetti && hh.hooks.confetti(); }
    }
  } else if (W.upacara && W.time >= W.upacara) W.upacara = null;
  // 💭 mimpi yang sama (badai + tidur berdua di kasur yang sama)
  if (!W.eggs.mimpi && (W.weather === 'badai' || W.weather === 'hujan') && m % 5 === 0) {
    const [a, b] = hh.humans();
    const tidur = (s) => s && !s.hidden && ['lie', 'sleep', 'nap'].includes(s.anim);
    if (tidur(a) && tidur(b)) {
      if (Math.hypot(a.x - b.x, a.z - b.z) < 2.2 && (a.lvl || 0) === (b.lvl || 0)) if (found(hh, 'mimpi', 'Keduanya terbangun dan menceritakan mimpi yang persis sama: rumah ini, hujan, dan segelas teh hangat ☕')) for (const h of [a, b]) h.mood('mimpiSama');
    }
  }
}

// ---------------- jurnal rahasia (UI) ----------------
export function openEggs(ui) {
  const g = ui.g, W = g.hh.world, E = W.eggs || {};
  const n = EGGS.filter((e) => E[e.id]).length;
  const rush = W.rush || {};
  const m = ui.modal(`<h2>🥚 Jurnal Rahasia Griya Asri</h2>
    <p class="muted small">Ditemukan <b>${n} dari 10</b> rahasia. ${n >= 10 ? '🏆 Lengkap! Plakat "Penjelajah Griya Asri" sudah dipajang di rumah.' : 'Petunjuk tersedia untuk yang belum ketemu — tidak ada jawaban langsung, biar seru 😉'}</p>
    <div class="eggBar"><i style="width:${n * 10}%"></i></div>
    <div class="eggs">${EGGS.map((e) => { const f = E[e.id]; return `<div class="egg ${f ? 'on' : ''}"><span class="ei">${f ? e.ikon : '❓'}</span><div><b>${f ? e.nama : '???'}</b><small>${f ? `Ditemukan hari ke-${f.day} · Hadiah: ${e.hadiah}` : e.petunjuk}</small></div></div>`; }).join('')}</div>
    <div class="eggExtra"><b>🍛 Nasi Padang Rush</b><small>${rush.tamat ? `✅ Sudah tamat · rekor omzet ${fmtRp(rush.best || 0)}${rush.sempurna ? ' · 🥇 Tangan Emas Etalase' : ''}` : `Level tercapai: ${rush.level || 1}/5 — mainkan lewat etalase RM Padang atau mesin arcade.`}</small></div>
    <div class="mbtns row"><button class="btn ghost" data-close>Tutup</button></div>`, 'wide');
  return m;
}

// urutan tombol kode sakti
export const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
export function konamiWatcher(onHit) {
  let i = 0;
  return (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === KONAMI[i]) { i++; if (i >= KONAMI.length) { i = 0; onHit(); } } else i = (k === KONAMI[0] ? 1 : 0);
  };
}
