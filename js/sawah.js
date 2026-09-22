// ============================================================
//  SAWAH & KEBUN DI BELAKANG RUMAH
//  Petak padi berair, kebun pisang, kebun sawit, bedeng cabai & tomat,
//  jagung, saluran irigasi, gubuk, orang-orangan sawah, bebek, kuntul —
//  plus 10 petani yang benar-benar sibuk bekerja sepanjang hari.
// ============================================================
import * as THREE from 'three';
import { TYPES, MOODLETS, PI, fmtRp } from './data.js';
import { INTER } from './interactions.js';
import { M, box } from './world.js';
import { SimModel } from './sim.js';
import { NPCS } from './people.js';
import { POSTS, TOWN_OBJECTS } from './town.js';

Object.assign(MOODLETS, {
  turunSawah: { label: 'Segar habis turun ke sawah', emoji: '🌾', val: 16, dur: 300 },
  sayurSegar: { label: 'Dapat sayur segar dari petani', emoji: '🥬', val: 10, dur: 240 },
});
export const PETANI = [
  { n: 'Pak Tarno', t: 'Juragan sawah, ramah, hafal harga semua hasil panen', kerja: 'lapak' },
  { n: 'Pak Jiman', t: 'Membajak & meratakan petak padi', kerja: 'bajak', plot: [-30, -12, -25, -17] },
  { n: 'Bu Marni', t: 'Menanam bibit padi sambil bersenandung', kerja: 'tanam', plot: [-8, 10, -25, -17] },
  { n: 'Mas Yanto', t: 'Mengatur air irigasi dari bendungan kecil', kerja: 'siram', plot: [12, 32, -25, -17] },
  { n: 'Pak Kasdi', t: 'Memanen padi yang sudah menguning', kerja: 'panen', plot: [-30, -12, -25, -17] },
  { n: 'Bu Lastri', t: 'Merawat bedeng cabai merah', kerja: 'cabai', plot: [-28, -8, -35, -29] },
  { n: 'Mas Parjo', t: 'Mengikat tomat ke ajir bambu', kerja: 'tomat', plot: [-4, 16, -35, -29] },
  { n: 'Pak Wardi', t: 'Menebang tandan pisang yang matang', kerja: 'pisang', plot: [-34, -6, -47, -39] },
  { n: 'Bu Ngatmi', t: 'Memilah buah sawit di kebun sebelah', kerja: 'sawit', plot: [6, 36, -47, -39] },
  { n: 'Cak Sueb', t: 'Menjemur gabah & mengurus bebek', kerja: 'gabah', plot: [18, 34, -33, -27] },
];
const OUTFITS = [
  { skin: '#9a6a44', hair: '#1b1b1b', shirt: '#8d6e63', pants: '#4e342e' }, { skin: '#a8714a', hair: '#3a3a3a', shirt: '#558b2f', pants: '#33691e' },
  { skin: '#c99670', hair: '#2a1a12', shirt: '#ec407a', pants: '#4a148c', dress: true, hijab: true }, { skin: '#8a5a38', hair: '#141414', shirt: '#1565c0', pants: '#263238' },
  { skin: '#b07a52', hair: '#616161', shirt: '#f5f5f5', pants: '#37474f' }, { skin: '#d2a07c', hair: '#2a1a12', shirt: '#ffb300', pants: '#5d4037', dress: true, hijab: true },
  { skin: '#9a6a44', hair: '#1b1b1b', shirt: '#00897b', pants: '#004d40' }, { skin: '#8a5a38', hair: '#9e9e9e', shirt: '#6d4c41', pants: '#3e2723' },
  { skin: '#c99670', hair: '#eeeeee', shirt: '#7e57c2', pants: '#311b92', dress: true, hijab: true }, { skin: '#a8714a', hair: '#141414', shirt: '#ef6c00', pants: '#212121' },
];
// Pak Tarno jadi warga sungguhan supaya bisa diajak bicara & berjualan
Object.assign(NPCS, {
  'Pak Tarno': { species: 'npc', role: 'tani', trait: PETANI[0].t, home: 'E', routine: 'work', post: 'tani', hours: [6, 18],
    outfit: { skin: '#9a6a44', hair: '#1b1b1b', hairStyle: 'short', shirt: '#8d6e63', pants: '#4e342e', dress: false, height: 1.0, caping: true } },
});
Object.assign(POSTS, { tani: [0.6, -12.2, 0] });
TOWN_OBJECTS.push(['lapakTani', 0, -12.7, 2]);

// ---------------- lapak hasil panen ----------------
TYPES.lapakTani = { name: 'Lapak Hasil Panen Pak Tarno', cat: 'luar', price: 0, w: 2.6, d: 0.9, fixed: true, sawah: true,
  spots: [{ ax: -0.7, az: 0.95, yaw: PI }, { ax: 0.7, az: 0.95, yaw: PI }], acts: ['beliSayur', 'beliCabai', 'beliPisang', 'beliBeras', 'turunSawah'] };
const isH = (s) => s.species === 'human';
const bayar = (x, p, why) => { if (isH(x.sim)) x.g.op({ o: 'money', d: -p, why, sim: x.sim.name }); };
const jual = (key, label, icon, harga, efek) => {
  INTER[key] = { label: `${label} · ${fmtRp(harga)}`, icon,
    check: (c) => (isH(c.sim) && (c.sim.wallet ?? 0) < harga ? 'Uang kurang' : true),
    build: (c) => ({ steps: [{ target: { obj: c.obj.id }, anim: 'talk', dur: 2, label: 'Memilih hasil panen', onStart: (x) => { const s = x.g.others && x.g.others['Pak Tarno']; if (s) s.busyT = 3; } },
      { target: { obj: c.obj.id }, anim: 'grab', prop: 'bag', dur: 3, label, onDone: (x) => { bayar(x, harga, `Beli dari petani: ${label}`); efek(x); x.sim.mood('sayurSegar'); } }] }) };
};
jual('beliSayur', 'Sayur segar sepaket (bayam, kangkung, terong)', '🥬', 45000, (x) => x.g.op({ o: 'house', k: 'stock', d: 4 }));
jual('beliCabai', 'Cabai merah & tomat sekilo', '🌶️', 32000, (x) => x.g.op({ o: 'house', k: 'stock', d: 3 }));
jual('beliPisang', 'Pisang raja sesisir', '🍌', 25000, (x) => { x.g.op({ o: 'house', k: 'servings', d: 1 }); x.sim.addNeed('hunger', 15); });
jual('beliBeras', 'Beras pandan wangi 5 kg', '🌾', 78000, (x) => x.g.op({ o: 'house', k: 'stock', d: 6 }));
INTER.turunSawah = { label: 'Ikut turun ke sawah bantu menanam', icon: '🌾',
  build: (c) => ({ steps: [{ target: { pos: [-2 + Math.random() * 4, -13.3] }, anim: 'bend', dur: 30, eff: { hygiene: -1.4, energy: -0.8, fun: 0.6 }, label: 'Menanam padi bersama petani', snd: 'swish',
    onTick: (x, gm) => x.sim.xp('bugar', gm * 0.4),
    onDone: (x) => { x.g.op({ o: 'money', d: 60000, why: 'Upah bantu menanam padi', sim: x.sim.name }); x.sim.mood('turunSawah'); x.g.addFam(8); x.g.toast(`${x.sim.name} ikut turun ke sawah. Pak Tarno kasih upah ${fmtRp(60000)} + sekantong sayur 🌾`, 'good'); x.g.op({ o: 'house', k: 'stock', d: 2 }); } }] }) };

export const isSawahType = (t) => !!(TYPES[t] && TYPES[t].sawah);
export function buildSawahObject(obj) {
  const g = new THREE.Group();
  if (obj.type === 'lapakTani') {
    box(2.6, 0.75, 0.9, M('#8d6e40', 0.9), 0, 0.38, 0, g); box(2.7, 0.06, 1.0, M('#c9b36a', 0.9), 0, 0.78, 0, g);
    for (const [x, z] of [[-1.2, -0.38], [1.2, -0.38], [-1.2, 0.38], [1.2, 0.38]]) box(0.08, 0.75, 0.08, M('#5d4037'), x, 0.375, z, g);
    // keranjang hasil panen
    const keranjang = (x, warna, isi) => { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.22, 12), M('#b58a4a', 0.95)); k.position.set(x, 0.92, 0); g.add(k);
      for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), M(warna, 0.7)); b.position.set(x + (Math.random() - 0.5) * 0.25, 1.02 + Math.random() * 0.05, (Math.random() - 0.5) * 0.25); if (isi === 'cabai') b.scale.set(0.5, 1.6, 0.5); g.add(b); } };
    keranjang(-0.95, '#c62828', 'cabai'); keranjang(-0.32, '#e53935'); keranjang(0.32, '#43a047'); keranjang(0.95, '#f9a825');
    // sisir pisang & karung beras
    const ps = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 6, 10, Math.PI), M('#f9a825', 0.7)); ps.position.set(-1.35, 0.95, 0.1); ps.rotation.x = 1.2; g.add(ps);
    box(0.45, 0.5, 0.32, M('#d7c9a0', 1), 1.45, 0.25, 0.1, g);
    // payung & timbangan
    const tiang = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 8), M('#616161')); tiang.position.set(1.1, 1.1, -0.3); g.add(tiang);
    const payung = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.5, 10), M('#2e7d32', 0.85)); payung.position.set(1.1, 2.2, -0.3); payung.castShadow = true; g.add(payung);
    const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.1, 12), M('#b0bec5', 0.4, 0.6)); tb.position.set(0, 0.86, -0.3); g.add(tb);
  }
  g.traverse((o) => { if (o.isMesh) { o.userData.objId = obj.id; o.castShadow = true; } });
  g.userData = { objId: obj.id, type: obj.type, P: {} };
  return g;
}

// ---------------- mesh ----------------
const cyl = (rt, rb, h, m, x, y, z, p, s = 10) => { const k = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), m); k.position.set(x, y, z); k.castShadow = true; p.add(k); return k; };
function inst(parent, geo, mat, list, scale = 1) {
  const m = new THREE.InstancedMesh(geo, mat, list.length); const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  list.forEach((d, i) => { e.set(d.rx || 0, d.ry || 0, d.rz || 0); q.setFromEuler(e); mt.compose(new THREE.Vector3(d.x, d.y, d.z), q, new THREE.Vector3(d.s || scale, d.sy || d.s || scale, d.s || scale)); m.setMatrixAt(i, mt); });
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function kebunPisang(g, spots) {
  const trunk = [], daun = [], tandan = [];
  for (const [x, z] of spots) {
    trunk.push({ x, y: 1.1, z });
    for (let i = 0; i < 7; i++) daun.push({ x: x + Math.cos(i * 0.9) * 0.5, y: 2.5 + (i % 3) * 0.12, z: z + Math.sin(i * 0.9) * 0.5, rx: -0.9 - (i % 3) * 0.12, ry: i * 0.9, rz: 0.2 });
    tandan.push({ x: x + 0.25, y: 2.0, z, rz: 0.4 });
  }
  inst(g, new THREE.CylinderGeometry(0.12, 0.18, 2.2, 8), M('#6b7a3a', 0.9), trunk);
  inst(g, new THREE.PlaneGeometry(0.5, 2.4), M('#2e7d32', 0.9, 0, { side: THREE.DoubleSide }), daun);
  inst(g, new THREE.CylinderGeometry(0.12, 0.1, 0.5, 8), M('#c9b037', 0.8), tandan);
}
function kebunSawit(g, spots) {
  const trunk = [], pelepah = [], buah = [];
  for (const [x, z] of spots) {
    trunk.push({ x, y: 1.6, z });
    for (let i = 0; i < 9; i++) pelepah.push({ x: x + Math.cos(i * 0.7) * 1.1, y: 3.4, z: z + Math.sin(i * 0.7) * 1.1, rx: -1.1, ry: i * 0.7, rz: 0.25 });
    for (let i = 0; i < 3; i++) buah.push({ x: x + Math.cos(i * 2) * 0.4, y: 3.1, z: z + Math.sin(i * 2) * 0.4, s: 1, sy: 0.8 });
  }
  inst(g, new THREE.CylinderGeometry(0.22, 0.3, 3.2, 8), M('#5d4037', 0.95), trunk);
  inst(g, new THREE.PlaneGeometry(0.45, 3.4), M('#2e5e20', 0.9, 0, { side: THREE.DoubleSide }), pelepah);
  inst(g, new THREE.SphereGeometry(0.28, 8, 6), M('#c0392b', 0.8), buah);
}

export function buildSawah(scene) {
  const F = { petani: [], bebek: [], kuntul: [], lampu: [], t: 0 }; const R = new THREE.Group(); scene.add(R); F.root = R;
  const tanah = M('#6f8f3a', 0.95), lumpur = M('#6b5637', 1), air = new THREE.MeshStandardMaterial({ color: '#7fa8c9', roughness: 0.08, metalness: 0.25, transparent: true, opacity: 0.85 });
  // hamparan tanah besar di belakang rumah
  const dasar = new THREE.Mesh(new THREE.PlaneGeometry(120, 62), tanah); dasar.rotation.x = -PI / 2; dasar.position.set(0, -0.02, -44); dasar.receiveShadow = true; R.add(dasar);
  // ---- petak padi (3 petak berair) ----
  const petakPadi = [[-30, -12], [-8, 10], [12, 32]];
  const padiList = [];
  for (const [x0, x1] of petakPadi) {
    const w = x1 - x0, cx = (x0 + x1) / 2;
    box(w, 0.12, 8, lumpur, cx, 0.06, -21, R).receiveShadow = true;
    const a = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.6, 7.4), air); a.rotation.x = -PI / 2; a.position.set(cx, 0.14, -21); R.add(a); F.air = F.air || []; F.air.push(a);
    for (let x = x0 + 0.8; x < x1 - 0.6; x += 0.75) for (let z = -24.4; z < -17.6; z += 0.75) padiList.push({ x: x + (Math.random() - 0.5) * 0.2, y: 0.32, z: z + (Math.random() - 0.5) * 0.2, ry: Math.random() * 3, s: 0.85 + Math.random() * 0.35 });
    // pematang
    box(w + 0.6, 0.22, 0.5, M('#7a6a4a', 1), cx, 0.11, -16.9, R); box(w + 0.6, 0.22, 0.5, M('#7a6a4a', 1), cx, 0.11, -25.1, R);
  }
  const padiGeo = new THREE.ConeGeometry(0.16, 0.7, 5);
  F.padi = inst(R, padiGeo, M('#9ccc65', 0.95, 0, { flatShading: true }), padiList.map((d) => ({ ...d, y: 0.45 })));
  // bulir padi menguning di sebagian petak
  F.bulir = inst(R, new THREE.ConeGeometry(0.07, 0.3, 4), M('#d4b106', 0.9), padiList.filter((_, i) => i % 3 === 0).map((d) => ({ ...d, y: 0.85, s: 1 })));
  // ---- saluran irigasi ----
  box(76, 0.1, 1.0, lumpur, 0, 0.05, -15.6, R); const sal = new THREE.Mesh(new THREE.PlaneGeometry(75, 0.7), air); sal.rotation.x = -PI / 2; sal.position.set(0, 0.12, -15.6); R.add(sal); F.air.push(sal);
  for (let x = -36; x <= 36; x += 12) box(1.2, 0.5, 1.4, M('#9e9e9e', 0.9), x, 0.25, -15.6, R);
  // ---- bedeng cabai & tomat ----
  const cabaiL = [], tomatL = [], ajirL = [];
  for (let x = -28; x < -8; x += 1.1) for (let z = -34.5; z < -29.5; z += 1.3) cabaiL.push({ x, y: 0.3, z, s: 0.8 + Math.random() * 0.4, ry: Math.random() * 3 });
  for (let x = -4; x < 16; x += 1.2) for (let z = -34.5; z < -29.5; z += 1.4) { tomatL.push({ x, y: 0.38, z, s: 0.9 + Math.random() * 0.3, ry: Math.random() * 3 }); ajirL.push({ x: x + 0.25, y: 0.6, z, s: 1 }); }
  for (const [x0, x1] of [[-28.5, -7.5], [-4.5, 16.5]]) box(x1 - x0, 0.18, 6, lumpur, (x0 + x1) / 2, 0.09, -32, R);
  F.cabaiDaun = inst(R, new THREE.SphereGeometry(0.34, 8, 6), M('#2e7d32', 0.95), cabaiL);
  F.cabai = inst(R, new THREE.ConeGeometry(0.07, 0.26, 5), M('#c62828', 0.7), cabaiL.map((d) => ({ ...d, y: 0.42, rx: PI, s: 1 })));
  inst(R, new THREE.SphereGeometry(0.4, 8, 6), M('#388e3c', 0.95), tomatL);
  inst(R, new THREE.SphereGeometry(0.11, 8, 6), M('#e53935', 0.6), tomatL.map((d) => ({ ...d, y: 0.5, s: 1 })));
  inst(R, new THREE.CylinderGeometry(0.02, 0.02, 1.2, 5), M('#c9b36a', 0.9), ajirL);
  // ---- kebun pisang & sawit ----
  const spotPisang = [], spotSawit = [];
  for (let x = -34; x <= -6; x += 3.4) for (let z = -47; z <= -39; z += 2.8) spotPisang.push([x + (Math.random() - 0.5), z + (Math.random() - 0.5)]);
  for (let x = 6; x <= 38; x += 4.6) for (let z = -47; z <= -39; z += 4) spotSawit.push([x + (Math.random() - 0.5), z + (Math.random() - 0.5)]);
  kebunPisang(R, spotPisang); kebunSawit(R, spotSawit);
  // ---- jagung di belakang ----
  const jagung = []; for (let x = -24; x < 20; x += 0.9) for (let z = -56; z < -50; z += 1.1) jagung.push({ x, y: 0.9, z, s: 0.9 + Math.random() * 0.3, ry: Math.random() });
  inst(R, new THREE.CylinderGeometry(0.05, 0.07, 1.8, 5), M('#7cb342', 0.95), jagung);
  inst(R, new THREE.ConeGeometry(0.12, 0.45, 6), M('#f9a825', 0.8), jagung.filter((_, i) => i % 2 === 0).map((d) => ({ ...d, y: 1.35, s: 1 })));
  // ---- gubuk / saung ----
  const gubuk = (x, z) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); R.add(g);
    box(2.6, 0.2, 2.2, M('#c9b36a', 0.9), 0, 0.5, 0, g);
    for (const [a, b] of [[-1.2, -1], [1.2, -1], [-1.2, 1], [1.2, 1]]) cyl(0.07, 0.07, 2.2, M('#8d6e40'), a, 1.1, b, g, 6);
    const atap = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.0, 4), M('#8a7a4a', 1)); atap.position.y = 2.6; atap.rotation.y = PI / 4; atap.castShadow = true; g.add(atap);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), M('#fff3c4', 0.4, 0, { emissive: '#ffcf80', emissiveIntensity: 0 })); lamp.position.set(0, 2.0, 0); g.add(lamp); F.lampu.push(lamp);
    return g;
  };
  F.gubuk = [gubuk(-16, -27.5), gubuk(20, -37)];
  // ---- orang-orangan sawah ----
  F.sawan = []; for (const [x, z] of [[-20, -20], [2, -21], [24, -20.5]]) {
    const g = new THREE.Group(); g.position.set(x, 0, z); R.add(g);
    cyl(0.05, 0.05, 2.0, M('#8d6e40'), 0, 1.0, 0, g, 6); box(1.5, 0.06, 0.06, M('#8d6e40'), 0, 1.5, 0, g);
    const baju = box(0.7, 0.8, 0.2, M(['#c62828', '#1565c0', '#f9a825'][F.sawan.length], 0.9), 0, 1.35, 0, g);
    const kepala = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), M('#d7c9a0', 0.95)); kepala.position.y = 1.85; g.add(kepala);
    const caping = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.25, 12), M('#c9b36a', 0.9)); caping.position.y = 2.0; g.add(caping);
    F.sawan.push(g);
  }
  // ---- jemuran gabah, karung, drum, traktor tangan ----
  box(6, 0.04, 4, M('#cdb47a', 1), 26, 0.03, -30, R);
  inst(R, new THREE.BoxGeometry(0.5, 0.6, 0.35), M('#d7c9a0', 1), [[20, -29], [20.6, -29.4], [21.2, -29], [19.6, -30]].map(([x, z]) => ({ x, y: 0.3, z, ry: Math.random() })));
  cyl(0.4, 0.4, 0.9, M('#1565c0', 0.6), 17.5, 0.45, -27, R, 14);
  const trak = new THREE.Group(); trak.position.set(-12, 0, -18.5); R.add(trak);
  box(1.2, 0.5, 0.6, M('#c62828', 0.5), 0, 0.6, 0, trak); cyl(0.45, 0.45, 0.25, M('#212121'), -0.5, 0.45, 0.45, trak, 14).rotation.z = PI / 2;
  cyl(0.45, 0.45, 0.25, M('#212121'), -0.5, 0.45, -0.45, trak, 14).rotation.z = PI / 2; box(0.08, 0.08, 1.4, M('#616161'), 0.7, 0.8, 0, trak);
  // ---- bebek & kuntul ----
  const bebekL = []; for (let i = 0; i < 16; i++) bebekL.push({ x: -6 + Math.random() * 14, y: 0.28, z: -24 + Math.random() * 6, ry: Math.random() * 6 });
  F.bebekMesh = inst(R, new THREE.SphereGeometry(0.16, 8, 6), M('#fafafa', 0.9), bebekL); F.bebek = bebekL;
  F.kuntulMesh = inst(R, new THREE.PlaneGeometry(0.5, 0.22), M('#ffffff', 0.9, 0, { side: THREE.DoubleSide }), Array.from({ length: 7 }, () => ({ x: 0, y: 6, z: -30 })));
  F.kuntul = Array.from({ length: 7 }, (_, i) => ({ a: i * 0.9, r: 14 + i * 2, y: 5 + i * 0.4, sp: 0.15 + i * 0.02 }));
  // ---- papan nama & pagar pembatas kebun ----
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const cx2 = cv.getContext('2d');
  cx2.fillStyle = '#4e342e'; cx2.fillRect(0, 0, 512, 128); cx2.fillStyle = '#f3d27a'; cx2.font = 'bold 40px "Baloo 2", sans-serif'; cx2.textAlign = 'center';
  cx2.fillText('SAWAH & KEBUN WARGA', 256, 52); cx2.font = 'bold 26px sans-serif'; cx2.fillText('Padi · Pisang · Sawit · Cabai · Tomat', 256, 96);
  const papan = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.05), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(cv), side: THREE.DoubleSide }));
  papan.position.set(6, 1.6, -13.4); R.add(papan); cyl(0.06, 0.06, 1.6, M('#5d4037'), 4.2, 0.8, -13.4, R, 6); cyl(0.06, 0.06, 1.6, M('#5d4037'), 7.8, 0.8, -13.4, R, 6);
  // ---- 10 petani ----
  PETANI.forEach((p, i) => {
    const o = OUTFITS[i];
    const m = new SimModel(p.n, { skin: o.skin, hair: o.hair, hairStyle: o.hijab ? 'hijab' : 'short', shirt: o.shirt, pants: o.pants, dress: !!o.dress, height: 0.94 + (i % 3) * 0.04 });
    const caping = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.16, 14), M('#c9b36a', 0.9)); caping.position.y = 0.12; m.head.add(caping);
    const plot = p.plot || [-2, 2, -13.6, -13]; const pos = { x: (plot[0] + plot[1]) / 2, z: (plot[2] + plot[3]) / 2 };
    m.root.position.set(pos.x, 0, pos.z); scene.add(m.root);
    F.petani.push({ m, def: p, plot, x: pos.x, z: pos.z, tx: pos.x, tz: pos.z, state: 'kerja', t: 2 + Math.random() * 6, anim: 'bend', yaw: Math.random() * 6 });
  });
  return F;
}
const ANIM = { bajak: 'push', tanam: 'bend', siram: 'water', panen: 'bend', cabai: 'bend', tomat: 'grab', pisang: 'grab', sawit: 'grab', gabah: 'mop', lapak: 'talk' };
export function updateSawah(F, game, dt, t, night) {
  if (!F) return; F.t = t;
  const W = game.hh.world; const hr = (W.time % 1440) / 60; const kerja = hr >= 5.5 && hr < 18;
  // air berkilau
  for (const a of F.air || []) a.material.opacity = 0.8 + Math.sin(t * 1.4) * 0.06;
  // padi bergoyang
  if (F.padi) F.padi.rotation.z = Math.sin(t * 0.8) * 0.02;
  for (const s of F.sawan) s.rotation.z = Math.sin(t * 1.2 + s.position.x) * 0.05;
  // lampu gubuk
  for (const l of F.lampu) l.material.emissiveIntensity = night ? 1.1 : 0;
  // bebek berkeliling
  if (F.bebekMesh) { const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    F.bebek.forEach((d, i) => { d.ry += dt * 0.4; d.x += Math.cos(d.ry) * dt * 0.35; d.z += Math.sin(d.ry) * dt * 0.35;
      if (d.x < -7 || d.x > 9) d.ry += PI; if (d.z < -25 || d.z > -17.5) d.ry += PI;
      e.set(0, -d.ry, Math.sin(t * 6 + i) * 0.1); q.setFromEuler(e); m.compose(new THREE.Vector3(d.x, 0.28 + Math.abs(Math.sin(t * 5 + i)) * 0.03, d.z), q, new THREE.Vector3(1, 1, 1)); F.bebekMesh.setMatrixAt(i, m); });
    F.bebekMesh.instanceMatrix.needsUpdate = true; }
  // kuntul terbang berputar
  if (F.kuntulMesh) { const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    F.kuntul.forEach((d, i) => { d.a += dt * d.sp; const x = Math.cos(d.a) * d.r, z = -30 + Math.sin(d.a) * d.r * 0.6;
      e.set(Math.sin(t * 8 + i) * 0.35, -d.a + PI / 2, 0); q.setFromEuler(e); m.compose(new THREE.Vector3(x, d.y + Math.sin(t + i) * 0.3, z), q, new THREE.Vector3(1, 1, 1)); F.kuntulMesh.setMatrixAt(i, m); });
    F.kuntulMesh.instanceMatrix.needsUpdate = true; }
  // petani bekerja
  for (const p of F.petani) {
    p.t -= dt;
    if (p.state === 'kerja' && p.t <= 0) {
      if (!kerja) { p.state = 'pulang'; p.tx = 4 + Math.random() * 3; p.tz = -13.6; p.t = 60; }
      else { p.state = 'jalan'; p.tx = p.plot[0] + Math.random() * (p.plot[1] - p.plot[0]); p.tz = p.plot[2] + Math.random() * (p.plot[3] - p.plot[2]); p.t = 30; }
    }
    if (p.state === 'jalan' || p.state === 'pulang') {
      const dx = p.tx - p.x, dz = p.tz - p.z, d = Math.hypot(dx, dz);
      if (d < 0.25 || p.t <= 0) { p.state = kerja ? 'kerja' : 'diam'; p.t = 6 + Math.random() * 14; p.anim = ANIM[p.def.kerja] || 'bend'; }
      else { const v = 1.25 * dt; p.x += dx / d * v; p.z += dz / d * v; p.yaw = Math.atan2(dx, dz); p.anim = 'walk'; }
    }
    if (p.state === 'diam' && kerja) { p.state = 'kerja'; p.t = 5; }
    if (p.state === 'kerja') p.anim = ANIM[p.def.kerja] || 'bend';
    if (p.state === 'diam') p.anim = 'idle';
    const m = p.m; m.root.position.set(p.x, 0, p.z);
    m.root.rotation.y += ((p.yaw - m.root.rotation.y + PI * 3) % (PI * 2) - PI) * Math.min(1, dt * 8);
    m.update(dt, p.anim);
    m.root.visible = game.viewLvl === 0;
  }
}
