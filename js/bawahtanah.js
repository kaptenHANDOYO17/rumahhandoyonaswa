// ============================================================
//  RUANG BAWAH TANAH — "KAMAR PUTIH"
//  Instalasi seni Naswa tentang depresi.
//
//  Sebuah kotak beton tanpa jendela di bawah rumah. Di dalamnya:
//  kamar serba putih yang terlalu terang, satu lampu neon yang berkedip,
//  pipa bocor yang menetes ke genangan, satu kursi kayu menghadap tembok,
//  deretan kanvas gelap karya Naswa, dan dinding penuh catatan tulisan
//  tangan tentang hari-hari yang berat.
//
//  Instalasi ini punya titik balik yang disengaja: di sudut terakhir ada
//  lampu hangat, telepon tua yang masih menyala, dan satu kalimat.
//  Itulah inti karyanya — ruangan ini dibuat untuk ditinggalkan, bukan
//  untuk ditinggali.
//
//  Berada di dalam terlalu lama membuat suasana hati turun; naik ke atas
//  dan memeluk pasangan memulihkannya.
// ============================================================
import * as THREE from 'three';
import { TYPES, MOODLETS, PI } from './data.js';
import { INTER } from './interactions.js';
import { M, box } from './world.js';

export const BAWAH = { x: 0, z: -20, minX: -6.2, maxX: 6.2, minZ: -24.4, maxZ: -15.6, pintu: [0, -15.8] };
export const TANGGA_ATAS = [6.4, -4.2];        // lubang tangga di dalam rumah (pojok gudang)

Object.assign(MOODLETS, {
  beratSendiri: { label: 'Dadanya terasa berat', emoji: '🫥', val: -20, dur: 240 },
  kamarPutih: { label: 'Masih terngiang kamar putih', emoji: '◻️', val: -10, dur: 420 },
  ditemani: { label: 'Ingat bahwa tidak sendirian', emoji: '☎️', val: 24, dur: 720 },
  naikKeAtas: { label: 'Lega sudah naik ke atas', emoji: '🪜', val: 16, dur: 360 },
});

// ---------------- benda ----------------
export const BAWAH_OBJECTS = [
  ['lubangTangga', 6.4, -4.2, 0], ['tanggaNaik', 0, -16.2, 0], ['kursiPutih', 0, -20.6, 0],
  ['pipaTetes', -4.4, -22.4, 0], ['dindingCatatan', 4.6, -22.0, 0], ['kanvasGelap', -3.4, -23.9, 0], ['teleponTua', 4.8, -17.4, 0],
];
Object.assign(TYPES, {
  lubangTangga: { name: 'Pintu Baja ke Bawah Tanah', cat: 'luar', price: 0, w: 1.1, d: 1.1, fixed: true,
    spots: [{ ax: 0, az: 1.1, yaw: PI }], acts: ['turunBawah'] },
  tanggaNaik: { name: 'Tangga Naik', cat: 'luar', price: 0, w: 1.6, d: 1.0, fixed: true,
    spots: [{ ax: 0, az: 1.1, yaw: PI }], acts: ['naikAtas'] },
  kursiPutih: { name: 'Kursi Kayu', cat: 'luar', price: 0, w: 0.5, d: 0.5, fixed: true,
    spots: [{ ax: 0, az: 0.75, px: 0, pz: 0.05, yaw: 0, seat: 0.45 }], acts: ['dudukPutih'] },
  pipaTetes: { name: 'Pipa Bocor', cat: 'luar', price: 0, w: 0.8, d: 0.8, fixed: true,
    spots: [{ ax: 0, az: 1.0, yaw: PI }], acts: ['dengarTetes'] },
  dindingCatatan: { name: 'Dinding Catatan', cat: 'luar', price: 0, w: 2.6, d: 0.3, fixed: true,
    spots: [{ ax: 0, az: 1.0, yaw: PI }], acts: ['bacaCatatan'] },
  kanvasGelap: { name: 'Kanvas-kanvas Gelap', cat: 'luar', price: 0, w: 2.6, d: 0.3, fixed: true,
    spots: [{ ax: 0, az: 1.0, yaw: PI }], acts: ['amatiKanvas'] },
  teleponTua: { name: 'Telepon Tua & Lampu Hangat', cat: 'luar', price: 0, w: 0.7, d: 0.6, fixed: true,
    spots: [{ ax: 0, az: 0.95, yaw: PI }], acts: ['angkatTelepon'] },
});

// Catatan di dinding: jujur tentang rasanya, tanpa menjadi petunjuk apa pun.
export const CATATAN = [
  '"Hari ini bangun jam 11. Tidak ada yang terjadi. Itu juga melelahkan."',
  '"Semua orang bilang aku kuat. Aku cuma belum sempat berhenti."',
  '"Rasanya seperti menonton hidupku sendiri dari balik kaca."',
  '"Aku masih bisa tertawa. Itu yang bikin orang tidak percaya aku sedang tidak baik-baik saja."',
  '"Yang paling berat bukan sedihnya. Yang paling berat adalah tidak merasa apa-apa."',
  '"Aku menunda mandi tiga hari. Bukan malas. Entah apa."',
  '"Kalau kamu membaca ini dan merasa dikenali: kamu tidak sedang mengada-ada."',
  '"Tulisan ini aku buat waktu sedang di dasar. Aku sudah naik. Itu bisa terjadi."',
  '— N., di ruangan ini, pukul tiga pagi',
];

const isH = (c) => c.sim.species === 'human';
const tgt = (c) => ({ obj: c.obj.id });

Object.assign(INTER, {
  turunBawah: { label: 'Turun ke ruang bawah tanah', icon: '🪜',
    check: (c) => (isH(c) ? true : 'Hanya Handoyo & Naswa'),
    build: (c) => ({ steps: [{ target: tgt(c), anim: 'grab', dur: 6, label: 'Membuka pintu baja', snd: 'door',
      onDone: (x) => { x.g.masukBawah && x.g.masukBawah(x.sim); } }] }) },
  naikAtas: { label: 'Naik kembali ke rumah', icon: '🪜',
    build: (c) => ({ steps: [{ target: tgt(c), anim: 'grab', dur: 5, label: 'Menaiki tangga', snd: 'door',
      onDone: (x) => { x.g.keluarBawah && x.g.keluarBawah(x.sim); } }] }) },
  dudukPutih: { label: 'Duduk di kursi menghadap tembok', icon: '🪑',
    build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'seat' }, anim: 'sit', dur: 45, label: 'Duduk diam', eff: { fun: -0.4, social: -0.5 },
      onDone: (x) => { x.sim.mood('beratSendiri');
        x.g.toast('Tidak ada apa-apa di tembok itu. Justru itu yang membuat betah terlalu lama.', 'info', true); } }] }) },
  dengarTetes: { label: 'Dengarkan tetesan air', icon: '💧',
    build: (c) => ({ steps: [{ target: tgt(c), anim: 'idle', dur: 20, label: 'Mendengarkan tetesan', snd: 'tetes',
      onDone: (x) => { x.sim.xp('logika', 6);
        x.g.toast('Tetesnya tidak teratur. Begitu kamu mulai menghitung, jeda berikutnya selalu terasa terlalu lama.', 'info'); } }] }) },
  bacaCatatan: { label: 'Baca dinding catatan', icon: '📝', ui: 'catatan',
    build: (c) => ({ steps: [{ target: tgt(c), anim: 'read', dur: 22, label: 'Membaca catatan',
      onDone: (x) => { x.sim.mood('kamarPutih'); x.g.bukaCatatan && x.g.bukaCatatan(); } }] }) },
  amatiKanvas: { label: 'Amati kanvas-kanvas gelap', icon: '🖼️',
    build: (c) => ({ steps: [{ target: tgt(c), anim: 'idle', dur: 18, label: 'Mengamati kanvas', eff: { fun: -0.2 },
      onDone: (x) => { x.sim.xp('kreatif', 14); x.sim.mood('kamarPutih');
        x.g.toast('Sembilan kanvas, semuanya hampir hitam. Dari jarak dekat baru terlihat: di setiap kanvas ada satu titik terang kecil.', 'info', true); } }] }) },
  angkatTelepon: { label: 'Angkat telepon tua ☎️', icon: '☎️',
    build: (c) => ({ steps: [{ target: tgt(c), anim: 'phone', dur: 16, label: 'Mengangkat telepon', snd: 'bell',
      onDone: (x) => {
        x.sim.clearMood && x.sim.clearMood('beratSendiri');
        x.sim.mood('ditemani'); x.g.addFam(12); x.g.sfx('good');
        x.g.toast('☎️ Terdengar suara rekaman Naswa sendiri: "Kalau kamu sudah lama di bawah sini — naiklah. Ada orang di atas yang menunggu kamu. Itu intinya karya ini."', 'good', true);
        x.g.teleponHangat && x.g.teleponHangat();
      } }] }) },
});

// ---------------- bangun ruangan ----------------
const kanvasTex = (seed) => {
  const c = document.createElement('canvas'); c.width = 128; c.height = 160; const g = c.getContext('2d');
  g.fillStyle = '#0c0d10'; g.fillRect(0, 0, 128, 160);
  for (let i = 0; i < 180; i++) {
    const v = 10 + Math.random() * 26;
    g.fillStyle = `rgba(${v},${v + 2},${v + 5},${0.25 + Math.random() * 0.3})`;
    g.fillRect(Math.random() * 128, Math.random() * 160, 6 + Math.random() * 30, 3 + Math.random() * 18);
  }
  // satu titik terang kecil di tiap kanvas
  const gx = 20 + ((seed * 37) % 88), gy = 24 + ((seed * 53) % 112);
  const gr = g.createRadialGradient(gx, gy, 0, gx, gy, 14);
  gr.addColorStop(0, 'rgba(255,240,200,.95)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = gr; g.fillRect(gx - 14, gy - 14, 28, 28);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
const catatanTex = () => {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#f6f4ef'; g.fillRect(0, 0, 512, 512);
  g.fillStyle = '#2a2a30'; g.font = 'italic 17px Georgia, serif';
  CATATAN.forEach((s, i) => {
    const baris = s.match(/.{1,46}(\s|$)/g) || [s];
    baris.forEach((b, j) => g.fillText(b.trim(), 22, 42 + i * 54 + j * 21));
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

export function buildBawah(scene) {
  const F = { t: 0, tetes: [], kedip: 0, aktif: false };
  const R = new THREE.Group(); R.position.set(BAWAH.x, 0, BAWAH.z); R.visible = false; scene.add(R); F.root = R;

  const putih = M('#f4f4f2', 0.95), beton = M('#8e8e8a', 0.98), betonGelap = M('#5a5a58', 0.98);
  const baja = M('#6b7075', 0.4, 0.7), kayu = M('#7a5c42', 0.85);
  const W2 = 12.4, D2 = 8.8, H2 = 3.1;

  // --- kotak beton: lantai, 4 dinding, plafon (plafon disembunyikan saat kamera dari atas) ---
  const lantai = new THREE.Mesh(new THREE.PlaneGeometry(W2, D2), putih);
  lantai.rotation.x = -PI / 2; lantai.position.y = 0.02; lantai.receiveShadow = true; R.add(lantai);
  box(W2, H2, 0.25, putih, 0, H2 / 2, -D2 / 2, R);
  box(W2, H2, 0.25, putih, 0, H2 / 2, D2 / 2, R);
  box(0.25, H2, D2, putih, -W2 / 2, H2 / 2, 0, R);
  box(0.25, H2, D2, putih, W2 / 2, H2 / 2, 0, R);
  const plafon = box(W2, 0.2, D2, beton, 0, H2 + 0.1, 0, R); plafon.visible = false; F.plafon = plafon;
  // garis sambungan beton supaya putihnya tidak terasa palsu
  for (const x of [-4.1, 0, 4.1]) box(0.03, H2, 0.03, M('#e2e2de', 1), x, H2 / 2, -D2 / 2 + 0.14, R).castShadow = false;

  // --- tangga & pintu baja di sisi utara ---
  const tg = new THREE.Group(); tg.position.set(0, 0, D2 / 2 - 0.5); R.add(tg);
  for (let i = 0; i < 6; i++) box(1.6, 0.14, 0.34, betonGelap, 0, 0.07 + i * 0.3, -0.1 + i * 0.3, tg);
  box(1.9, 2.3, 0.14, baja, 0, 1.15, 0.42, tg);
  box(0.1, 0.5, 0.1, M('#9aa0a6', 0.3, 0.8), 0.6, 1.1, 0.34, tg);
  for (const s of [-1, 1]) box(0.08, 2.2, 0.08, baja, s * 0.85, 1.3, -0.2, tg);

  // --- lampu neon berkedip di tengah ---
  const neonM = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#eaf4ff', emissiveIntensity: 2.2 });
  const neon = box(2.4, 0.08, 0.16, neonM, 0, H2 - 0.22, 0.4, R); neon.castShadow = false; F.neonM = neonM;
  const cahaya = new THREE.PointLight('#eaf4ff', 14, 26, 1.3); cahaya.position.set(0, H2 - 0.4, 0.4); R.add(cahaya); F.cahaya = cahaya;
  // lampu kedua yang sudah mati (satu sudut selalu lebih gelap)
  box(2.4, 0.08, 0.16, M('#d8d8d4', 0.8), -3.6, H2 - 0.22, -2.6, R).castShadow = false;

  // --- kursi kayu menghadap tembok ---
  const ks = new THREE.Group(); ks.position.set(0, 0, -0.6); R.add(ks);
  box(0.44, 0.06, 0.44, kayu, 0, 0.45, 0, ks);
  box(0.44, 0.5, 0.06, kayu, 0, 0.72, -0.19, ks);
  for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) box(0.05, 0.45, 0.05, kayu, dx, 0.22, dz, ks);

  // --- pipa bocor & genangan ---
  const pp = new THREE.Group(); pp.position.set(-4.4, 0, -2.4); R.add(pp);
  const pipa = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 6.6, 10), M('#8d9499', 0.5, 0.6));
  pipa.rotation.z = PI / 2; pipa.position.set(1.6, H2 - 0.45, 0); pp.add(pipa);
  box(0.16, 0.2, 0.16, M('#6b7075', 0.4, 0.7), 0, H2 - 0.55, 0, pp);
  const genangan = new THREE.Mesh(new THREE.CircleGeometry(0.95, 24), new THREE.MeshStandardMaterial({ color: '#c8d4da', roughness: 0.06, metalness: 0.25, transparent: true, opacity: 0.72 }));
  genangan.rotation.x = -PI / 2; genangan.position.set(0, 0.035, 0); pp.add(genangan); F.genangan = genangan;
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.12, 20), new THREE.MeshBasicMaterial({ color: '#dff0f6', transparent: true, opacity: 0, side: THREE.DoubleSide }));
    r.rotation.x = -PI / 2; r.position.set(0, 0.045, 0); pp.add(r); F.tetes.push({ r, f: i * 1.1 });
  }
  const butir = box(0.045, 0.1, 0.045, new THREE.MeshStandardMaterial({ color: '#dff0f6', transparent: true, opacity: 0.85 }), 0, 1.8, 0, pp);
  butir.castShadow = false; F.butir = butir;

  // --- deretan kanvas gelap ---
  const kv = new THREE.Group(); kv.position.set(-3.4, 0, -4.18); R.add(kv);   // digantung di dinding utara
  for (let i = 0; i < 9; i++) {
    const w = 0.5, h = 0.64;
    const bing = box(w + 0.07, h + 0.07, 0.05, M('#2b2b2e', 0.8), (i % 3) * 0.66 - 0.66, 1.9 - Math.floor(i / 3) * 0.78, 0, kv);
    const kan = box(w, h, 0.02, new THREE.MeshStandardMaterial({ map: kanvasTex(i + 1), roughness: 0.95 }), (i % 3) * 0.66 - 0.66, 1.9 - Math.floor(i / 3) * 0.78, 0.04, kv);
    kan.castShadow = false;
  }

  // --- dinding catatan ---
  const dc = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.1), new THREE.MeshStandardMaterial({ map: catatanTex(), roughness: 0.96 }));
  dc.position.set(4.6, 1.6, -2.0 - 0.1); dc.rotation.y = 0; R.add(dc);
  box(2.75, 2.25, 0.05, M('#e8e6e0', 0.95), 4.6, 1.6, -2.16, R);

  // --- sudut hangat: lampu meja + telepon tua + satu kalimat ---
  const sd = new THREE.Group(); sd.position.set(4.8, 0, 2.6); R.add(sd);
  box(0.9, 0.06, 0.6, kayu, 0, 0.74, 0, sd);
  for (const [dx, dz] of [[-0.38, -0.22], [0.38, -0.22], [-0.38, 0.22], [0.38, 0.22]]) box(0.05, 0.74, 0.05, kayu, dx, 0.37, dz, sd);
  const kapLampu = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.26, 14, 1, true), new THREE.MeshStandardMaterial({ color: '#f3c98b', emissive: '#ffb75e', emissiveIntensity: 1.5, side: THREE.DoubleSide, roughness: 0.7 }));
  kapLampu.position.set(-0.25, 1.1, 0); sd.add(kapLampu); F.kapLampu = kapLampu;
  box(0.04, 0.3, 0.04, M('#6d4c41', 0.7), -0.25, 0.92, 0, sd);
  const hangat = new THREE.PointLight('#ffb75e', 2.6, 6, 1.8); hangat.position.set(-0.25, 1.1, 0); sd.add(hangat); F.hangat = hangat;
  // telepon
  box(0.3, 0.1, 0.22, M('#23252a', 0.5), 0.22, 0.84, 0, sd);
  box(0.26, 0.06, 0.08, M('#1a1c20', 0.4), 0.22, 0.92, 0, sd);
  const gagang = box(0.08, 0.05, 0.2, M('#1a1c20', 0.4), 0.22, 0.95, 0, sd); F.gagang = gagang;

  return F;
}

export function updateBawah(F, game, dt, t) {
  if (!F || !F.root.visible) return;
  F.t = t;
  // neon berkedip tidak teratur
  const n = Math.sin(t * 13.3) * Math.sin(t * 7.1) * Math.sin(t * 2.7);
  const hidup = n > -0.55 ? 1 : 0.12 + Math.random() * 0.3;
  F.neonM.emissiveIntensity = 1.6 + hidup * 1.3;
  F.cahaya.intensity = 5 + hidup * 13;
  // tetesan jatuh & riak di genangan
  const fase = (t * 0.62) % 1;
  F.butir.position.y = 2.42 - fase * 2.3;
  F.butir.visible = fase < 0.92;
  F.tetes.forEach((r, i) => {
    const p = ((t * 0.62) + i * 0.33) % 1;
    r.r.scale.setScalar(0.4 + p * 5.5);
    r.r.material.opacity = Math.max(0, 0.5 - p * 0.5);
  });
  F.genangan.material.opacity = 0.66 + Math.sin(t * 1.3) * 0.05;
  // lampu hangat berdenyut sangat pelan — satu-satunya yang "bernapas" di ruangan ini
  const h = 2.3 + Math.sin(t * 0.8) * 0.35;
  F.hangat.intensity = h; F.kapLampu.material.emissiveIntensity = 1.2 + Math.sin(t * 0.8) * 0.2;
}
