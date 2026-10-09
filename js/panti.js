// ============================================================
//  PANTI ASUHAN "HARAPAN BUNDA" — di seberang jalan
//
//  Dulu seberang jalan cuma hamparan kosong dan beberapa kotak polos.
//  Sekarang ada panti asuhan lengkap: bangunan berpelana dengan teras
//  bertiang, jendela berkusen, papan nama, tiang bendera, halaman main
//  (ayunan, perosotan, jungkat-jungkit, bak pasir, gawang), kebun sayur
//  anak-anak, jemuran, dan pohon mangga.
//
//  Dihuni 10 anak yatim piatu + Bu Asih (pengasuh) & Kak Rina (relawan).
//  Mereka punya rutinitas sungguhan: mengaji pagi, sekolah, bermain sore,
//  belajar malam. Masing-masing punya nama, umur, sifat, dan cita-cita —
//  dan kisahnya berkembang lewat js/kisah.js.
// ============================================================
import * as THREE from 'three';
import { TYPES, MOODLETS, PI, fmtRp } from './data.js';
import { INTER } from './interactions.js';
import { M, box, buildTree } from './world.js';
import { SimModel } from './sim.js';

export const PANTI = { x: 0, z: 26.5, minX: -11, maxX: 11, minZ: 21.5, maxZ: 31.5, gerbang: [0, 20.2] };

// ---------------- 10 anak + pengasuh ----------------
export const ANAK = [
  { n: 'Riko',   u: 11, sifat: 'Paling tua, suka jadi kapten bola dan menjaga adik-adiknya', cita: 'Jadi polisi', w: { skin: '#a8714a', hair: '#141414', shirt: '#1565c0', pants: '#263238' } },
  { n: 'Sari',   u: 10, sifat: 'Pendiam, selalu menggambar di buku tulis bekas',            cita: 'Jadi pelukis seperti Kak Naswa', w: { skin: '#c99670', hair: '#2a1a12', shirt: '#ec407a', pants: '#6a1b9a', dress: true } },
  { n: 'Bagas',  u: 9,  sifat: 'Energinya tidak habis-habis, juara lari antar-RT',          cita: 'Jadi atlet', w: { skin: '#8a5a38', hair: '#1b1b1b', shirt: '#2e7d32', pants: '#1b5e20' } },
  { n: 'Nabila', u: 9,  sifat: 'Hafal 15 juz, sering jadi imam salat anak-anak',            cita: 'Jadi ustazah', w: { skin: '#d2a07c', hair: '#2a1a12', shirt: '#80cbc4', pants: '#00695c', dress: true, hijab: true } },
  { n: 'Dimas',  u: 8,  sifat: 'Penasaran sama semua barang elektronik, suka bongkar radio', cita: 'Jadi programmer seperti Om Handoyo', w: { skin: '#9a6a44', hair: '#141414', shirt: '#f9a825', pants: '#424242' } },
  { n: 'Putri',  u: 8,  sifat: 'Paling cerewet dan paling cepat akrab dengan tamu',         cita: 'Jadi guru TK', w: { skin: '#c99670', hair: '#3a2a1a', shirt: '#ba68c8', pants: '#4a148c', dress: true } },
  { n: 'Fajar',  u: 7,  sifat: 'Masih suka menempel di Bu Asih kalau ada orang baru',       cita: 'Jadi masinis', w: { skin: '#a8714a', hair: '#1b1b1b', shirt: '#ef6c00', pants: '#3e2723' } },
  { n: 'Aisyah', u: 7,  sifat: 'Suka menyiram kebun dan menghitung tomat satu per satu',    cita: 'Jadi dokter hewan', w: { skin: '#b07a52', hair: '#2a1a12', shirt: '#fff59d', pants: '#827717', dress: true, hijab: true } },
  { n: 'Yoga',   u: 6,  sifat: 'Baru bisa baca, bangga sekali setiap berhasil satu kalimat', cita: 'Jadi pemadam kebakaran', w: { skin: '#8a5a38', hair: '#141414', shirt: '#e53935', pants: '#212121' } },
  { n: 'Melati', u: 6,  sifat: 'Paling kecil, ke mana-mana bawa boneka kain buatan Bu Asih', cita: 'Punya rumah dengan taman bunga', w: { skin: '#d2a07c', hair: '#2a1a12', shirt: '#f48fb1', pants: '#ad1457', dress: true } },
];
export const PENGASUH = [
  { n: 'Bu Asih', u: 54, sifat: 'Mengurus panti sejak 20 tahun lalu, hafal kesukaan tiap anak', w: { skin: '#b07a52', hair: '#9e9e9e', shirt: '#6a1b9a', pants: '#311b92', dress: true, hijab: true } },
  { n: 'Kak Rina', u: 22, sifat: 'Relawan mahasiswa, mengajar calistung tiap sore', w: { skin: '#c99670', hair: '#1b1b1b', shirt: '#26a69a', pants: '#004d40', dress: true, hijab: true } },
];

Object.assign(MOODLETS, {
  berbagi: { label: 'Hati hangat setelah berbagi', emoji: '🤲', val: 22, dur: 600 },
  mainAnak: { label: 'Seru main bareng anak-anak', emoji: '🧒', val: 18, dur: 420 },
  mengajar: { label: 'Bangga bisa mengajari anak', emoji: '📖', val: 16, dur: 420 },
});

// ---------------- benda yang bisa diklik ----------------
export const PANTI_OBJECTS = [
  ['pantiGerbang', 0, 20.3, 0], ['pantiMeja', -3.4, 24.2, 0], ['pantiAyunan', 6.2, 23.4, 0], ['pantiPasir', -7.4, 23.6, 0],
];
Object.assign(TYPES, {
  pantiGerbang: { name: 'Gerbang Panti Harapan Bunda', cat: 'luar', price: 0, w: 2.4, d: 0.3, fixed: true, town: true,
    spots: [{ ax: 0, az: -1.1, yaw: 0 }], acts: ['pantiDonasi', 'pantiMakanan', 'pantiKunjung'] },
  pantiMeja: { name: 'Meja Belajar Panti', cat: 'luar', price: 0, w: 2.6, d: 1.0, fixed: true, town: true,
    spots: [{ ax: 0, az: 1.0, px: 0, pz: 0.6, yaw: PI, seat: 0.44 }, { ax: 0, az: -1.0, px: 0, pz: -0.6, yaw: 0, seat: 0.44 }], acts: ['pantiAjarBaca', 'pantiAjarGambar', 'pantiAjarKomputer'] },
  pantiAyunan: { name: 'Ayunan Panti', cat: 'luar', price: 0, w: 2.6, d: 1.2, fixed: true, town: true,
    spots: [{ ax: 0, az: 1.1, yaw: PI }], acts: ['pantiMain', 'pantiDorongAyunan'] },
  pantiPasir: { name: 'Bak Pasir Panti', cat: 'luar', price: 0, w: 2.2, d: 2.2, fixed: true, town: true,
    spots: [{ ax: 0, az: 1.5, yaw: PI }], acts: ['pantiMain', 'pantiIstana'] },
});

const isH = (c) => c.sim.species === 'human';
const anakAcak = () => ANAK[Math.floor(Math.random() * ANAK.length)];
const tgt = (c) => ({ obj: c.obj.id });

Object.assign(INTER, {
  pantiKunjung: { label: 'Ngobrol dengan Bu Asih', icon: '🤝',
    build: (c) => ({ steps: [{ target: tgt(c), anim: 'talk', dur: 10, eff: { social: 2.5, fun: 0.6 }, label: 'Ngobrol di depan panti',
      onDone: (x) => { const a = anakAcak(); x.g.toast(`Bu Asih: "Alhamdulillah, ${a.n} (${a.u} th) sudah mulai berani tampil. Cita-citanya ${a.cita.toLowerCase()}."`, 'info', true); x.g.kisahMaju && x.g.kisahMaju('Bu Asih', 1, x.sim); x.g.addFam(4); } }] }) },
  pantiDonasi: { label: 'Donasi untuk panti 💛', icon: '🤲',
    check: (c) => (!isH(c) ? 'Hanya Handoyo & Naswa' : c.sim.wallet >= 100000 ? true : 'Siapkan minimal Rp 100.000'),
    build: (c) => ({ steps: [{ target: tgt(c), anim: 'grab', dur: 8, label: 'Menyerahkan donasi', snd: 'cash',
      onDone: (x) => {
        const n = Math.min(x.sim.wallet, Math.max(100000, Math.round(x.sim.wallet * 0.01 / 50000) * 50000));
        x.g.op({ o: 'money', d: -n, why: 'Donasi Panti Harapan Bunda', sim: x.sim.name });
        x.sim.mood('berbagi'); x.g.addFam(30); x.g.sfx('fanfare');
        x.g.pantiDonasi && x.g.pantiDonasi(n);
        x.g.kisahMaju && x.g.kisahMaju('Bu Asih', 3, x.sim);
        x.g.toast(`🤲 ${x.sim.name} berdonasi ${fmtRp(n)} untuk Panti Harapan Bunda. Anak-anak berebut menyalami.`, 'good', true);
      } }] }) },
  pantiMakanan: { label: 'Bagikan makanan ke anak-anak', icon: '🍛',
    check: (c) => (!isH(c) ? 'Hanya Handoyo & Naswa' : c.world.house.stock >= 3 ? true : 'Stok dapur kurang (butuh 3)'),
    build: (c) => ({ steps: [{ target: tgt(c), anim: 'carry', prop: 'plate', dur: 14, label: 'Membagikan makanan',
      onDone: (x) => { x.g.op({ o: 'house', k: 'stock', d: -3 }); x.sim.mood('berbagi'); x.g.addFam(22); x.g.sfx('good');
        x.g.pantiKenyang && x.g.pantiKenyang();
        x.g.toast('🍛 Anak-anak panti makan bersama. "Terima kasih, Om! Terima kasih, Tante!"', 'good', true); } }] }) },
  pantiAjarBaca: { label: 'Ajari anak-anak membaca', icon: '📖',
    check: (c) => (isH(c) ? true : 'Hanya Handoyo & Naswa'),
    build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'seat' }, anim: 'read', prop: 'book', dur: 40, label: 'Mengajari membaca', eff: { fun: 0.4 },
      onTick: (x, gm) => x.sim.xp('karisma', gm * 0.3),
      onDone: (x) => { x.sim.mood('mengajar'); x.g.addFam(14); x.g.kisahMaju && x.g.kisahMaju('Yoga', 2, x.sim);
        x.g.toast('📖 Yoga berhasil membaca satu paragraf penuh tanpa dieja. Matanya berbinar.', 'good', true); } }] }) },
  pantiAjarGambar: { label: 'Ajari anak-anak menggambar 🎨', icon: '🎨',
    check: (c) => (c.sim.name === 'Naswa' ? true : 'Naswa yang pelukis — ajak dia'),
    build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'seat' }, anim: 'paint', prop: 'brushPaint', dur: 45, label: 'Kelas menggambar', eff: { fun: 1.2 },
      onTick: (x, gm) => x.sim.xp('kreatif', gm * 0.35),
      onDone: (x) => { x.sim.mood('mengajar'); x.g.addFam(18); x.g.kisahMaju && x.g.kisahMaju('Sari', 3, x.sim);
        x.g.toast('🎨 Sari menunjukkan gambarnya: rumah dengan taman bunga, ada dua orang dewasa di depan pagar.', 'good', true); } }] }) },
  pantiAjarKomputer: { label: 'Ajari anak-anak komputer 💻', icon: '💻',
    check: (c) => (c.sim.name === 'Handoyo' ? true : 'Handoyo yang programmer — ajak dia'),
    build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'seat' }, anim: 'sitType', prop: 'laptop', dur: 45, label: 'Kelas komputer', eff: { fun: 0.6 },
      onTick: (x, gm) => x.sim.xp('logika', gm * 0.3),
      onDone: (x) => { x.sim.mood('mengajar'); x.g.addFam(18); x.g.kisahMaju && x.g.kisahMaju('Dimas', 3, x.sim);
        x.g.toast('💻 Dimas membuat program pertamanya: tulisan "HALO BU ASIH" yang berkedip warna-warni.', 'good', true); } }] }) },
  pantiMain: { label: 'Main bersama anak-anak', icon: '🧒',
    build: (c) => ({ steps: [{ target: tgt(c), anim: 'dance', dur: 28, eff: { fun: 2.6, energy: -0.3 }, label: 'Main bareng anak panti', snd: 'swish',
      onDone: (x) => { x.sim.mood('mainAnak'); x.g.addFam(12); const a = anakAcak(); x.g.kisahMaju && x.g.kisahMaju(a.n, 1, x.sim);
        x.g.toast(`🧒 ${a.n} tertawa paling kencang. "Besok main lagi ya, Om/Tante!"`, 'good'); } }] }) },
  pantiDorongAyunan: { label: 'Dorong ayunan', icon: '🎠',
    build: (c) => ({ steps: [{ target: tgt(c), anim: 'push', dur: 20, eff: { fun: 2 }, label: 'Mendorong ayunan',
      onDone: (x) => { x.sim.mood('mainAnak'); x.g.addFam(8); x.g.pantiAyun && x.g.pantiAyun();
        x.g.toast('🎠 "Lebih tinggi, Om! Lebih tinggiii!" — Melati memekik senang.', 'good'); } }] }) },
  pantiIstana: { label: 'Bikin istana pasir bareng', icon: '🏰',
    build: (c) => ({ steps: [{ target: tgt(c), anim: 'bend', dur: 26, eff: { fun: 2.2, hygiene: -0.6 }, label: 'Membangun istana pasir',
      onDone: (x) => { x.sim.mood('mainAnak'); x.g.addFam(10); x.g.kisahMaju && x.g.kisahMaju('Melati', 2, x.sim);
        x.g.toast('🏰 Istana pasirnya punya taman bunga di depan. Melati bilang itu rumah impiannya.', 'good', true); } }] }) },
});

// ---------------- helper mesh ----------------
const cyl = (rt, rb, h, mat, x = 0, y = 0, z = 0, p, seg = 12) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; if (p) p.add(m); return m; };
const papanTex = (judul, sub) => {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256); grd.addColorStop(0, '#1b5e4a'); grd.addColorStop(1, '#0f3d31');
  g.fillStyle = grd; g.fillRect(0, 0, 1024, 256);
  g.strokeStyle = '#f3d27a'; g.lineWidth = 6; g.strokeRect(14, 14, 996, 228);
  g.fillStyle = '#ffd98a'; g.font = 'bold 74px "Baloo 2", sans-serif'; g.textAlign = 'center'; g.fillText(judul, 512, 108);
  g.fillStyle = '#cfe8dc'; g.font = '600 38px sans-serif'; g.fillText(sub, 512, 176);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

// ---------------- bangun panti ----------------
export function buildPanti(scene) {
  const F = { anak: [], dewasa: [], ayun: [], jemuran: [], bendera: null, t: 0, lampu: [] };
  const R = new THREE.Group(); R.position.set(PANTI.x, 0, PANTI.z); scene.add(R); F.root = R;

  const dinding = M('#f2ead6', 0.92), trim = M('#1b5e4a', 0.7), atapM = M('#a4452f', 0.85, 0, { flatShading: true });
  const kaca = M('#9fc4d8', 0.12, 0.35), kayu = M('#6d4c41', 0.8), putih = M('#fbfbf7', 0.85);
  const tanah = M('#cdbb98', 0.95);

  // --- halaman & jalan setapak ---
  const hal = new THREE.Mesh(new THREE.PlaneGeometry(22, 10), M('#6ea84a', 1));
  hal.rotation.x = -PI / 2; hal.position.set(0, 0.015, -0.5); hal.receiveShadow = true; R.add(hal);
  const setapak = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 9), M('#c9c3b4', 0.95));
  setapak.rotation.x = -PI / 2; setapak.position.set(0, 0.025, -1.2); setapak.receiveShadow = true; R.add(setapak);

  // --- bangunan utama: badan + sayap kiri-kanan, atap pelana ---
  // atap pelana: dua bidang miring + dua tutup segitiga di ujungnya
  const segitiga = (w, h, mat, x, y, z) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-w / 2, 0, 0, w / 2, 0, 0, 0, h, 0], 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = true; R.add(m); return m;
  };
  const badan = (w, d, h, x, z, tinggiAtap = 1.25) => {
    box(w, h, d, dinding, x, h / 2, z, R);
    box(w + 0.32, 0.2, d + 0.32, trim, x, h + 0.07, z, R);                   // lis atap
    const sisi = Math.hypot(d / 2 + 0.3, tinggiAtap);
    const sudut = Math.atan2(tinggiAtap, d / 2 + 0.3);
    for (const sg of [-1, 1]) {
      const bid = box(w + 0.8, 0.14, sisi, atapM, x, h + 0.17 + tinggiAtap / 2, z + sg * (d / 4 + 0.15), R);
      bid.rotation.x = sg * sudut;
    }
    const tutup = new THREE.MeshStandardMaterial({ color: dinding.color, roughness: 0.92, side: THREE.DoubleSide, flatShading: true });
    segitiga(d + 0.6, tinggiAtap, tutup, x - w / 2 - 0.005, h + 0.17, z).rotation.y = PI / 2;
    segitiga(d + 0.6, tinggiAtap, tutup, x + w / 2 + 0.005, h + 0.17, z).rotation.y = PI / 2;
  };
  badan(11, 6.4, 3.2, 0, 4.2, 1.5);                       // blok tengah (asrama + aula)
  badan(5.2, 5, 2.9, -7.4, 3.0, 1.1);                     // sayap kiri (dapur & ruang makan)
  badan(5.2, 5, 2.9, 7.4, 3.0, 1.1);                      // sayap kanan (kelas)

  // --- teras bertiang di depan blok tengah ---
  box(11.4, 0.22, 2.6, M('#e4ddc8', 0.9), 0, 0.11, -0.2, R);
  for (const x of [-5, -2.5, 0, 2.5, 5]) { cyl(0.13, 0.15, 2.9, putih, x, 1.45, -1.3, R, 10); box(0.34, 0.2, 0.34, trim, x, 2.95, -1.3, R); }
  box(11.4, 0.22, 0.3, trim, 0, 3.05, -1.3, R);
  for (const x of [-5, -2.5, 2.5, 5]) box(2.2, 0.08, 0.08, trim, x + 1.25, 0.85, -1.3, R);   // railing teras
  // bangku teras
  for (const s of [-1, 1]) { box(1.8, 0.1, 0.44, kayu, s * 3.6, 0.55, -0.5, R); for (const d of [-0.7, 0.7]) box(0.12, 0.45, 0.12, kayu, s * 3.6 + d, 0.3, -0.5, R); }

  // --- pintu & jendela berkusen (dengan kaca yang menyala saat malam) ---
  const jendela = (x, y, z, w = 1.3, h = 1.2) => {
    box(w + 0.18, h + 0.18, 0.1, putih, x, y, z, R);
    const kc = box(w, h, 0.06, kaca, x, y, z + 0.04, R); kc.castShadow = false;
    box(0.05, h, 0.07, putih, x, y, z + 0.06, R); box(w, 0.05, 0.07, putih, x, y, z + 0.06, R);   // palang salib
    box(w + 0.3, 0.1, 0.22, trim, x, y + h / 2 + 0.16, z + 0.02, R);                              // kanopi kecil
    F.lampu.push(kc);
    return kc;
  };
  for (const x of [-4.3, -1.6, 1.6, 4.3]) jendela(x, 1.75, 1.02);
  box(1.5, 2.3, 0.12, kayu, 0, 1.15, 1.04, R);                                   // pintu ganda
  box(0.06, 2.3, 0.14, trim, 0, 1.15, 1.1, R);
  for (const s of [-1, 1]) box(0.12, 0.12, 0.1, M('#d4ae4a', 0.3, 0.8), s * 0.45, 1.05, 1.12, R);
  jendela(-7.4, 1.6, 0.52, 1.1, 1.0); jendela(7.4, 1.6, 0.52, 1.1, 1.0);
  for (const s of [-1, 1]) { jendela(s * 9.9, 1.6, 3.0, 1.0, 1.0); }

  // --- papan nama besar di atas teras ---
  const papan = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.8), new THREE.MeshBasicMaterial({ map: papanTex('PANTI ASUHAN HARAPAN BUNDA', 'Yayasan Harapan Bunda · Berdiri 2006 · 10 anak asuh'), side: THREE.DoubleSide }));
  papan.position.set(0, 3.55, -1.52); papan.rotation.y = PI; R.add(papan);          // menghadap ke jalan (-Z)
  box(7.4, 2.0, 0.08, trim, 0, 3.55, -1.46, R);

  // --- tiang bendera merah putih ---
  const tb = new THREE.Group(); tb.position.set(-4.6, 0, -3.2); R.add(tb);
  cyl(0.05, 0.07, 6, M('#e8e8e8', 0.4, 0.5), 0, 3, 0, tb, 8);
  cyl(0.28, 0.3, 0.2, M('#bdbdbd', 0.6), 0, 0.1, 0, tb, 10);
  const bend = new THREE.Group(); bend.position.set(0.02, 5.2, 0); tb.add(bend);
  const kainA = box(1.3, 0.38, 0.02, M('#d32f2f', 0.9, 0, { side: THREE.DoubleSide }), 0.67, 0.19, 0, bend);
  const kainB = box(1.3, 0.38, 0.02, M('#fafafa', 0.9, 0, { side: THREE.DoubleSide }), 0.67, -0.19, 0, bend);
  kainA.castShadow = kainB.castShadow = false; F.bendera = { g: bend, a: kainA, b: kainB };

  // --- pagar depan + gerbang ---
  const pagarM = M('#1b5e4a', 0.6, 0.3);
  box(22, 0.42, 0.3, M('#b9ab8e', 0.95), 0, 0.21, -6.2, R);
  for (let x = -10.8; x <= 10.8; x += 0.34) { if (Math.abs(x) < 1.3) continue; box(0.05, 1.05, 0.05, pagarM, x, 0.95, -6.2, R).castShadow = false; }
  box(22, 0.07, 0.07, pagarM, 0, 1.46, -6.2, R);
  for (const s of [-1, 1]) { box(0.4, 2.1, 0.4, M('#e8e1d0', 0.9), s * 1.45, 1.05, -6.2, R); box(0.52, 0.16, 0.52, trim, s * 1.45, 2.16, -6.2, R); }
  const gerbang = new THREE.Group(); gerbang.position.set(0, 0, -6.2); R.add(gerbang);
  for (let x = -1.1; x <= 1.1; x += 0.22) box(0.045, 1.5, 0.045, pagarM, x, 0.78, 0, gerbang).castShadow = false;
  box(2.4, 0.07, 0.07, pagarM, 0, 1.55, 0, gerbang); box(2.4, 0.07, 0.07, pagarM, 0, 0.1, 0, gerbang);
  // kotak amal di tiang gerbang
  box(0.42, 0.52, 0.3, M('#8d6e63', 0.8), 2.1, 1.2, -6.2, R);
  box(0.2, 0.03, 0.02, M('#2a2a2a'), 2.1, 1.44, -6.36, R);

  // --- halaman bermain ---
  // ayunan
  const ay = new THREE.Group(); ay.position.set(6.2, 0, -3.1); R.add(ay);
  for (const s of [-1, 1]) { const k = cyl(0.07, 0.09, 2.6, M('#c0392b', 0.5, 0.3), s * 1.25, 1.3, 0, ay, 8); k.rotation.z = s * 0.14; }
  box(2.9, 0.1, 0.1, M('#c0392b', 0.5, 0.3), 0, 2.56, 0, ay);
  for (const s of [-1, 1]) {
    const g = new THREE.Group(); g.position.set(s * 0.68, 2.5, 0); ay.add(g);
    for (const d of [-0.22, 0.22]) box(0.03, 1.5, 0.03, M('#455a64', 0.5, 0.6), d, -0.75, 0, g).castShadow = false;
    box(0.5, 0.07, 0.3, M('#f9a825', 0.7), 0, -1.52, 0, g);
    F.ayun.push({ g, f: Math.random() * 6, a: 0.22 + Math.random() * 0.1 });
  }
  // perosotan
  const pr = new THREE.Group(); pr.position.set(9.2, 0, -1.4); pr.rotation.y = -0.5; R.add(pr);
  box(1.0, 0.1, 1.0, M('#1565c0', 0.6), 0, 1.5, 0, pr);
  for (const [dx, dz] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]]) cyl(0.05, 0.05, 1.5, M('#90a4ae', 0.5, 0.5), dx, 0.75, dz, pr, 8);
  const luncur = box(0.82, 0.08, 2.9, M('#f9a825', 0.55), 0, 0.82, 1.72, pr); luncur.rotation.x = 0.44;
  for (const s of [-1, 1]) { const sd = box(0.08, 0.26, 2.9, M('#ef6c00', 0.55), s * 0.45, 0.92, 1.72, pr); sd.rotation.x = 0.44; }
  for (let i = 0; i < 4; i++) box(0.76, 0.07, 0.2, M('#90a4ae', 0.5, 0.5), 0, 0.3 + i * 0.33, -0.55 - i * 0.14, pr);
  // jungkat-jungkit
  const jj = new THREE.Group(); jj.position.set(3.2, 0, -4.4); R.add(jj);
  cyl(0.16, 0.2, 0.5, M('#546e7a', 0.6), 0, 0.25, 0, jj, 10);
  const papanJ = box(3.2, 0.1, 0.3, M('#2e7d32', 0.6), 0, 0.55, 0, jj); F.jungkat = papanJ;
  for (const s of [-1, 1]) box(0.26, 0.2, 0.3, M('#f9a825', 0.6), s * 1.4, 0.68, 0, jj);
  // bak pasir
  const bp = new THREE.Group(); bp.position.set(-7.4, 0, -2.9); R.add(bp);
  const ps = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), tanah); ps.rotation.x = -PI / 2; ps.position.y = 0.05; ps.receiveShadow = true; bp.add(ps);
  for (const [dx, dz, rw, rd] of [[0, -1.15, 2.4, 0.2], [0, 1.15, 2.4, 0.2], [-1.15, 0, 0.2, 2.4], [1.15, 0, 0.2, 2.4]]) box(rw, 0.22, rd, kayu, dx, 0.11, dz, bp);
  for (let i = 0; i < 5; i++) { const t2 = box(0.3 + i * 0.05, 0.28, 0.3 + i * 0.05, tanah, -0.5 + i * 0.26, 0.2, -0.2 + (i % 2) * 0.35, bp); t2.rotation.y = i; }
  // gawang mini
  const gw = new THREE.Group(); gw.position.set(-4.4, 0, -4.6); R.add(gw);
  for (const s of [-1, 1]) cyl(0.05, 0.05, 1.3, putih, s * 1.1, 0.65, 0, gw, 8);
  box(2.3, 0.09, 0.09, putih, 0, 1.3, 0, gw);
  const jala = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.3), new THREE.MeshStandardMaterial({ color: '#eceff1', transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
  jala.position.set(0, 0.65, -0.4); jala.castShadow = false; gw.add(jala);
  const bola = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), M('#fafafa', 0.6)); bola.position.set(-3.2, 0.17, -3.4); bola.castShadow = true; R.add(bola); F.bola = bola;

  // --- meja belajar panjang di teras samping ---
  const mj = new THREE.Group(); mj.position.set(-3.4, 0, -2.3); R.add(mj);
  box(2.6, 0.08, 1.0, kayu, 0, 0.62, 0, mj);
  for (const [dx, dz] of [[-1.15, -0.4], [1.15, -0.4], [-1.15, 0.4], [1.15, 0.4]]) box(0.1, 0.62, 0.1, kayu, dx, 0.31, dz, mj);
  for (const s of [-1, 1]) { box(2.4, 0.08, 0.3, M('#8d6e63', 0.8), 0, 0.42, s * 0.78, mj); for (const d of [-0.9, 0.9]) box(0.1, 0.42, 0.1, M('#8d6e63', 0.8), d, 0.21, s * 0.78, mj); }
  for (let i = 0; i < 5; i++) box(0.22, 0.03, 0.3, M(['#e53935', '#1565c0', '#f9a825', '#2e7d32', '#8e24aa'][i], 0.7), -0.9 + i * 0.45, 0.68, 0, mj);

  // --- kebun sayur anak + jemuran + pohon ---
  for (let i = 0; i < 3; i++) {
    const bd = new THREE.Group(); bd.position.set(-9.6 + i * 1.5, 0, 1.2); R.add(bd);
    box(1.2, 0.2, 2.6, M('#6d4c41', 1), 0, 0.1, 0, bd);
    for (let j = 0; j < 6; j++) { const d2 = box(0.16, 0.3, 0.16, M('#4caf50', 0.9), -0.3 + (j % 2) * 0.6, 0.32, -1 + Math.floor(j / 2) * 0.8, bd); d2.castShadow = false; }
  }
  const jm = new THREE.Group(); jm.position.set(8.4, 0, 1.6); R.add(jm);
  for (const s of [-1, 1]) cyl(0.06, 0.08, 2.1, M('#9e9e9e', 0.6), s * 1.9, 1.05, 0, jm, 8);
  box(3.9, 0.03, 0.03, M('#cfd8dc', 0.7), 0, 2.0, 0, jm);
  const warnaBaju = ['#ef5350', '#42a5f5', '#ffee58', '#66bb6a', '#ab47bc', '#ff7043'];
  for (let i = 0; i < 6; i++) { const b2 = box(0.38, 0.5, 0.02, M(warnaBaju[i], 0.9, 0, { side: THREE.DoubleSide }), -1.6 + i * 0.64, 1.72, 0, jm); b2.castShadow = false; F.jemuran.push({ m: b2, f: i * 0.8 }); }
  buildTree(scene, PANTI.x - 9.8, PANTI.z + 5.4, 1.15);
  buildTree(scene, PANTI.x + 10.2, PANTI.z + 5.0, 1.0);

  // --- lampu teras (menyala malam) ---
  for (const s of [-1, 1]) {
    const lm = box(0.26, 0.3, 0.26, M('#fff6d8', 0.3, 0, { emissive: '#ffd27a', emissiveIntensity: 0, unique: true }), s * 2.6, 2.75, -1.25, R);
    lm.castShadow = false; F.lampu.push(lm); F.lampuTeras = F.lampuTeras || []; F.lampuTeras.push(lm);
  }

  // --- 10 anak + 2 pengasuh ---
  const tempat = [[-6.2, -3.2], [-4.4, -4.2], [-2.2, -3.6], [0.4, -4.4], [2.6, -3.2], [4.8, -4.2], [6.8, -3.4], [-8.2, -2.4], [8.6, -2.2], [1.6, -2.4]];
  ANAK.forEach((a, i) => {
    const m = new SimModel(a.n, { skin: a.w.skin, hair: a.w.hair, hairStyle: a.w.hijab ? 'hijab' : (a.w.dress ? 'long' : 'short'), shirt: a.w.shirt, pants: a.w.pants, dress: !!a.w.dress, height: 0.56 + (a.u - 6) * 0.035 });
    const p = tempat[i]; m.root.position.set(PANTI.x + p[0], 0, PANTI.z + p[1]); scene.add(m.root);
    F.anak.push({ m, def: a, x: PANTI.x + p[0], z: PANTI.z + p[1], tx: PANTI.x + p[0], tz: PANTI.z + p[1], t: Math.random() * 4, anim: 'idle', yaw: Math.random() * 6, rumah: [PANTI.x + p[0], PANTI.z + p[1]] });
  });
  PENGASUH.forEach((d, i) => {
    const m = new SimModel(d.n, { skin: d.w.skin, hair: d.w.hair, hairStyle: 'hijab', shirt: d.w.shirt, pants: d.w.pants, dress: true, height: 0.98 });
    m.root.position.set(PANTI.x + (i ? 3.2 : -1.8), 0, PANTI.z + (i ? -2.0 : -1.0)); scene.add(m.root);
    F.dewasa.push({ m, def: d, x: PANTI.x + (i ? 3.2 : -1.8), z: PANTI.z + (i ? -2.0 : -1.0), tx: 0, tz: 0, t: Math.random() * 5, anim: 'idle', yaw: PI });
  });
  return F;
}

// ---------------- gerak & kehidupan ----------------
const ACAK = (a, b) => a + Math.random() * (b - a);
export function updatePanti(F, game, dt, t, night) {
  if (!F) return;
  F.t = t;
  const W = game.hh.world; const hr = (W.time % 1440) / 60;
  const diLuar = hr >= 6 && hr < 18.5;              // anak-anak main di halaman
  const belajar = (hr >= 7.5 && hr < 11) || (hr >= 18.5 && hr < 20);
  // bendera berkibar
  if (F.bendera) { const k = Math.sin(t * 2.2) * 0.12; F.bendera.a.rotation.y = k; F.bendera.b.rotation.y = k * 0.8; }
  // ayunan & jungkat-jungkit & jemuran bergoyang
  for (const a of F.ayun) a.g.rotation.x = Math.sin(t * 1.6 + a.f) * (diLuar ? a.a : 0.03);
  if (F.jungkat) F.jungkat.rotation.z = Math.sin(t * 1.1) * (diLuar ? 0.16 : 0.02);
  for (const j of F.jemuran) j.m.rotation.x = Math.sin(t * 1.3 + j.f) * 0.14;
  // lampu teras & jendela menyala saat malam
  const nyala = night ? 1 : 0;
  for (const l of F.lampu) if (l.material && l.material.emissive) l.material.emissiveIntensity = nyala * (F.lampuTeras && F.lampuTeras.includes(l) ? 1.6 : 0.5);
  // anak-anak bergerak
  for (const a of F.anak) {
    a.t -= dt;
    if (a.t <= 0) {
      a.t = ACAK(2.5, 7);
      if (!diLuar) { a.tx = a.rumah[0]; a.tz = PANTI.z + 1.5; a.anim = belajar ? 'read' : 'idle'; }
      else if (Math.random() < 0.55) { a.tx = PANTI.x + ACAK(-8.5, 9); a.tz = PANTI.z + ACAK(-5.2, -1.2); a.anim = 'walk'; }
      else a.anim = ['idle', 'dance', 'wave', 'talk', 'bend'][Math.floor(Math.random() * 5)];
    }
    const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
    if (d > 0.12) {
      const v = Math.min(d, dt * (a.anim === 'walk' ? 1.5 : 0.9));
      a.x += (dx / d) * v; a.z += (dz / d) * v;
      let dy = Math.atan2(dx, dz) - a.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); a.yaw += dy * Math.min(1, dt * 7);
      a.m.update(dt * 1.25, 'walk');
    } else a.m.update(dt, a.anim === 'walk' ? 'idle' : a.anim);
    a.m.root.position.set(a.x, 0, a.z); a.m.root.rotation.y = a.yaw;
    a.m.root.visible = !(hr >= 21 || hr < 5);        // malam masuk ke dalam
  }
  // pengasuh
  for (const d of F.dewasa) {
    d.t -= dt;
    if (d.t <= 0) { d.t = ACAK(5, 11); d.anim = diLuar ? ['idle', 'talk', 'wave', 'mop', 'bend'][Math.floor(Math.random() * 5)] : 'idle'; }
    d.m.update(dt, d.anim); d.m.root.position.set(d.x, 0, d.z); d.m.root.rotation.y = d.yaw;
    d.m.root.visible = !(hr >= 22 || hr < 4.5);
  }
  // bola menggelinding pelan saat anak-anak main
  if (F.bola && diLuar) { F.bola.position.x = PANTI.x - 3.2 + Math.sin(t * 0.7) * 1.4; F.bola.rotation.z -= dt * 1.4; }
}
