// ============================================================
//  KAMPUNG SEKITAR: Kopi Griya (samping rumah), Warung Madura 24 jam,
//  pos ronda, pedagang kaki lima, dan detail-detail kecil jalanan.
// ============================================================
import * as THREE from 'three';
import { TYPES, MOODLETS, PI, fmtRp } from './data.js';
import { INTER } from './interactions.js';
import { M, box } from './world.js';

Object.assign(MOODLETS, {
  ngopi: { label: 'Habis ngopi enak', emoji: '☕', val: 12, dur: 180 },
  dipijat: { label: 'Badan enteng habis dipijat', emoji: '💆', val: 14, dur: 200 },
  berendam: { label: 'Segar habis berendam', emoji: '🛁', val: 14, dur: 200 },
  bermusik: { label: 'Asyik bermusik', emoji: '🎵', val: 10, dur: 180 },
  tenang: { label: 'Pikiran tenang', emoji: '🧘', val: 12, dur: 240 },
  jajan: { label: 'Kenyang jajan enak', emoji: '🍢', val: 10, dur: 150 },
  lukisanTerjual: { label: 'Lukisannya laku!', emoji: '🖼️', val: 25, dur: 480 },
  tamu: { label: 'Senang dikunjungi', emoji: '🏠', val: 14, dur: 300 },
  proyekBeres: { label: 'Proyek beres & dibayar', emoji: '💻', val: 20, dur: 360 },
  paketDatang: { label: 'Paket datang!', emoji: '📦', val: 12, dur: 180 },
});

// ---------------- tata letak ----------------
export const CAFE = { minX: -21.6, maxX: -14.4, minZ: -1.0, maxZ: 8.4, door: [-18.5, -17.3] };
export const WARUNG = { minX: 14.4, maxX: 21.6, minZ: 2.4, maxZ: 8.4 };
export const TOWN_WALLS = [
  { a: [CAFE.minX, CAFE.minZ], b: [CAFE.maxX, CAFE.minZ] }, { a: [CAFE.minX, CAFE.minZ], b: [CAFE.minX, CAFE.maxZ] }, { a: [CAFE.maxX, CAFE.minZ], b: [CAFE.maxX, CAFE.maxZ] },
  { a: [CAFE.minX, CAFE.maxZ], b: [CAFE.door[0], CAFE.maxZ] }, { a: [CAFE.door[1], CAFE.maxZ], b: [CAFE.maxX, CAFE.maxZ] },
  { a: [WARUNG.minX, WARUNG.minZ], b: [WARUNG.maxX, WARUNG.minZ] }, { a: [WARUNG.minX, WARUNG.minZ], b: [WARUNG.minX, WARUNG.maxZ] }, { a: [WARUNG.maxX, WARUNG.minZ], b: [WARUNG.maxX, WARUNG.maxZ] },
  { a: [WARUNG.minX, WARUNG.maxZ - 0.2], b: [16.2, WARUNG.maxZ - 0.2] }, { a: [19.8, WARUNG.maxZ - 0.2], b: [WARUNG.maxX, WARUNG.maxZ - 0.2] },
];
export const POSTS = {
  barista: [-18.6, -0.45, 0], kasir: [-17.2, -0.45, 0], warung: [18.6, 7.0, 0], warung2: [16.8, 5.4, 0], satpam: [20.6, 11.3, PI],
};
export const VENDOR_SPOTS = {
  bakso: { pos: [-9.6, 12.95], name: 'Pak Kumis', label: 'Bakso Pak Kumis', hours: [15, 21], price: 20000, eff: { hunger: 5 }, icon: '🍜', call: 'bakso', color: '#c62828' },
  siomay: { pos: [6.8, 12.95], name: 'Mas Siomay', label: 'Siomay Bandung', hours: [10, 14], price: 15000, eff: { hunger: 4 }, icon: '🥟', call: 'kentong', color: '#1565c0' },
  sate: { pos: [-17.6, 12.95], name: 'Bang Toyib', label: 'Sate Ayam Madura', hours: [18, 22], price: 30000, eff: { hunger: 6 }, icon: '🍢', call: 'sate', color: '#6d4c41' },
  cendol: { pos: [11.4, 12.95], name: 'Mbok Darmi', label: 'Es Dawet Ayu', hours: [11, 16], price: 10000, eff: { hunger: 1.5, fun: 2 }, icon: '🥤', call: 'bell', color: '#2e7d32' },
};
export const TOWN_OBJECTS = [
  ['coffeeCounter', -18, 0.25, 0], ['cafeTable', -20.1, 3.5, 0], ['cafeTable', -15.9, 3.5, 0], ['cafeTable', -20.1, 6.5, 0], ['cafeTable', -15.9, 6.5, 0],
  ['cafeTableOut', -20.3, 10.1, 0], ['cafeTableOut', -15.7, 10.1, 0], ['warungCounter', 18.6, 7.75, 0], ['warungBench', 15.2, 9.7, 0], ['posRonda', 20.6, 10.2, 2],
];

// ---------------- tipe benda kota ----------------
const tableSpots = [{ ax: 0, az: 0.95, px: 0, pz: 0.55, yaw: PI, seat: 0.46 }, { ax: 0, az: -0.95, px: 0, pz: -0.55, yaw: 0, seat: 0.46 }];
Object.assign(TYPES, {
  coffeeCounter: { name: 'Bar Kopi Griya', cat: 'luar', price: 0, w: 3.2, d: 0.7, fixed: true, town: true, spots: [{ ax: -0.8, az: 0.95, yaw: PI }, { ax: 0.2, az: 0.95, yaw: PI }, { ax: 1.1, az: 0.95, yaw: PI }], acts: ['kopiSusu', 'americano', 'matcha', 'croissant', 'pisgor', 'kopiPulang'] },
  cafeTable: { name: 'Meja Kopi Griya', cat: 'luar', price: 0, w: 0.8, d: 0.8, fixed: true, town: true, spots: tableSpots, acts: ['nongkrong', 'wfc', 'sketchCafe'] },
  cafeTableOut: { name: 'Meja Teras Kopi Griya', cat: 'luar', price: 0, w: 0.8, d: 0.8, fixed: true, town: true, spots: tableSpots, acts: ['nongkrong', 'wfc', 'sketchCafe'] },
  warungCounter: { name: 'Warung Madura 24 Jam', cat: 'luar', price: 0, w: 2.4, d: 0.6, fixed: true, town: true, spots: [{ ax: -0.6, az: 0.85, yaw: PI }, { ax: 0.6, az: 0.85, yaw: PI }], acts: ['wSnack', 'wStock', 'wEs', 'wToken', 'wGalon'] },
  warungBench: { name: 'Bangku Depan Warung', cat: 'luar', price: 0, w: 1.6, d: 0.5, fixed: true, town: true, spots: [{ ax: -0.4, az: 0.8, px: -0.4, pz: 0.05, yaw: 0, seat: 0.45 }, { ax: 0.4, az: 0.8, px: 0.4, pz: 0.05, yaw: 0, seat: 0.45 }], acts: ['nongkrong'] },
  posRonda: { name: 'Pos Ronda RT', cat: 'luar', price: 0, w: 1.9, d: 1.6, fixed: true, town: true, spots: [{ ax: 0, az: 1.25, px: 0, pz: 0.55, yaw: 0, seat: 0.45 }], acts: ['ronda'] },
  streetCart: { name: 'Gerobak Pedagang', cat: 'luar', price: 0, w: 1.7, d: 0.8, fixed: true, town: true, spots: [{ ax: 0, az: -0.95, yaw: 0 }, { ax: -1.3, az: -0.3, yaw: PI / 2 }], acts: ['buyStreet'] },
  parcel: { name: 'Paket Kiriman', cat: 'luar', price: 0, w: 0.45, d: 0.45, fixed: true, spots: [{ ax: 0, az: 0.6, yaw: PI }], acts: ['openParcel'] },
});

// ---------------- interaksi beli ----------------
const isH = (s) => s.species === 'human';
const pay = (x, price, why) => { if (isH(x.sim)) x.g.op({ o: 'money', d: -price, why, sim: x.sim.name }); };
const canPay = (price) => (c) => (isH(c.sim) && (c.sim.wallet ?? 0) < price ? `Uang kurang (${fmtRp(price)})` : true);
const nudge = (x, role) => { const hh = x.g; for (const o of Object.values(hh.others || {})) if (o.role === role && !o.hidden) o.busyT = 3; };
const menuItem = (label, icon, price, anim, dur, eff, extra = {}) => ({
  label: `${label} · ${fmtRp(price)}`, icon, check: canPay(price),
  build: (c) => ({ steps: [
    { target: { obj: c.obj.id }, anim: 'talk', dur: 2, label: 'Pesan', onStart: (x) => { nudge(x, extra.role || 'barista'); x.g.sfx && x.g.sfx('cash'); }, snd: extra.snd || null },
    { target: { obj: c.obj.id }, anim, prop: extra.prop || null, dur, eff, label, snd: extra.snd2 || null, onDone: (x) => { pay(x, price, label); if (extra.mood) x.sim.mood(extra.mood); if (extra.done) extra.done(x); } },
  ] }),
});
Object.assign(INTER, {
  kopiSusu: menuItem('Kopi susu gula aren', '☕', 25000, 'grab', 6, { energy: 2.2, fun: 0.6 }, { prop: 'cup', mood: 'ngopi', snd: 'espresso' }),
  americano: menuItem('Iced americano', '🧊', 22000, 'grab', 5, { energy: 3 }, { prop: 'cup', mood: 'ngopi', snd: 'espresso' }),
  matcha: menuItem('Matcha latte', '🍵', 30000, 'grab', 6, { fun: 1.4, energy: 0.8 }, { prop: 'cup', mood: 'ngopi' }),
  croissant: menuItem('Croissant mentega', '🥐', 28000, 'eat', 8, { hunger: 3 }, { prop: 'plate' }),
  pisgor: menuItem('Pisang goreng keju', '🍌', 18000, 'eat', 8, { hunger: 2.6, fun: 0.4 }, { prop: 'plate' }),
  kopiPulang: menuItem('Kopi bawa pulang buat pasangan', '🎁', 50000, 'grab', 3, { social: 1 }, { prop: 'cup', done: (x) => { const p = x.g.partner(x.sim); if (p) { p.mood('ngopi'); x.g.bondAdd(x.sim, p, 4); x.g.toast(`${x.sim.name} bawain kopi buat ${p.name} ☕💕`, 'good'); } } }),
  nongkrong: { label: 'Nongkrong sambil ngopi', icon: '☕', build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'seat' }, anim: 'sit', prop: 'cup', dur: 30, eff: { fun: 0.8, social: 0.6, energy: 0.3 }, label: 'Nongkrong di kafe', snd: 'cafe' }] }) },
  wfc: { label: 'Kerja dari kafe (ngoding)', icon: '💻', check: (c) => (c.sim.name === 'Handoyo' ? true : 'Khusus Handoyo si programmer'),
    build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'seat' }, anim: 'sitType', prop: 'phone', dur: 60, eff: { fun: 0.3 }, label: 'Ngoding di kafe', snd: 'type', onTick: (x, gm) => x.g.codeTick && x.g.codeTick(x.sim, gm * 1.1) }] }) },
  sketchCafe: { label: 'Sketsa suasana kafe', icon: '✏️', build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'seat' }, anim: 'sitRead', prop: 'book', dur: 30, eff: { fun: 1 }, label: 'Sketsa di kafe', onTick: (x, gm) => x.sim.xp('kreatif', gm * 0.45) }] }) },
  wSnack: menuItem('Beli roti & camilan', '🍞', 12000, 'eat', 6, { hunger: 2.5 }, { prop: 'bag', role: 'warung' }),
  wStock: menuItem('Belanja telur, mie & beras (+4 stok)', '🥚', 65000, 'grab', 3, {}, { prop: 'bag', role: 'warung', done: (x) => x.g.op({ o: 'house', k: 'stock', d: 4 }) }),
  wEs: menuItem('Es teh manis', '🧋', 5000, 'grab', 4, { fun: 0.8, energy: 0.6 }, { prop: 'cup', role: 'warung' }),
  wToken: menuItem('Beli token listrik', '⚡', 100000, 'phone', 3, {}, { role: 'warung', done: (x) => { if (!x.g.world.house.power) { x.g.op({ o: 'house', k: 'power', v: true }); x.g.toast('Token terisi, listrik rumah menyala lagi ⚡', 'good'); } else x.g.toast('Token listrik tersimpan untuk bulan depan ⚡', 'info'); } }),
  wGalon: menuItem('Pesan galon diantar', '💧', 22000, 'talk', 2, {}, { role: 'warung', done: (x) => x.g.toast('Cak Mamat: "Siap, galonnya tak anter ke rumah!" 💧', 'info') }),
  ronda: { label: 'Ikut ronda malam', icon: '🔦', check: (c) => { const h = (c.world.time % 1440) / 60; return h >= 20 || h < 3 ? true : 'Ronda mulai jam 20.00'; },
    build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'seat' }, anim: 'talk', dur: 45, eff: { social: 1.4, energy: -0.6 }, label: 'Ronda bareng Pak Slamet', onDone: (x) => x.g.toast(`${x.sim.name} ikut ronda. Kampung aman 👮`, 'good') }] }) },
  buyStreet: { label: (c) => { const V = VENDOR_SPOTS[c.obj.s.kind] || {}; return `Beli ${V.label || 'jajanan'} · ${fmtRp(V.price || 0)}`; }, icon: '🍢',
    check: (c) => { const V = VENDOR_SPOTS[c.obj.s.kind]; return canPay(V ? V.price : 0)(c); },
    build: (c) => { const V = VENDOR_SPOTS[c.obj.s.kind]; return { steps: [
      { target: { obj: c.obj.id }, anim: 'talk', dur: 3, label: 'Pesan', onStart: (x) => { const s = x.g.others && x.g.others[V.name]; if (s) s.busyT = 4; } },
      { target: { obj: c.obj.id }, anim: 'eat', prop: 'plate', dur: 10, eff: V.eff, label: `Makan ${V.label}`, onDone: (x) => { pay(x, V.price, V.label); x.sim.mood('jajan'); } }] }; } },
  openParcel: { label: 'Ambil & buka paket', icon: '📦', build: (c) => ({ steps: [{ target: { obj: c.obj.id }, anim: 'bend', dur: 3, label: 'Buka paket', onDone: (x) => x.g.openParcel && x.g.openParcel(x.sim, x.obj) }] }) },
});

// ---------------- helper tekstur & mesh ----------------
function signTex(text, bg, fg, w = 1024, h = 180, sub) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold ${sub ? 86 : 110}px "Baloo 2", sans-serif`; g.fillText(text, w / 2, sub ? h * 0.4 : h / 2);
  if (sub) { g.font = 'bold 44px sans-serif'; g.fillText(sub, w / 2, h * 0.8); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function sign(parent, text, bg, fg, x, y, z, w, h, ry = 0, sub) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: signTex(text, bg, fg, 1024, 180, sub), emissive: '#ffffff', emissiveMap: null, emissiveIntensity: 0, roughness: 0.6 }));
  m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m;
}
const cyl = (rt, rb, h, mat, x, y, z, p, seg = 12) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z); m.castShadow = true; p.add(m); return m; };

export function buildMotor(color = '#c62828') {
  const g = new THREE.Group();
  for (const z of [-0.55, 0.55]) { const w = cyl(0.26, 0.26, 0.09, M('#1a1a1a'), 0, 0.26, z, g, 16); w.rotation.z = PI / 2; }
  box(0.24, 0.3, 1.0, M(color, 0.4, 0.2), 0, 0.55, 0, g); box(0.26, 0.12, 0.55, M('#111'), 0, 0.76, -0.15, g);
  box(0.5, 0.04, 0.04, M('#999', 0.3, 0.8), 0, 0.98, 0.45, g); box(0.14, 0.14, 0.1, M('#fff8d0', 0.3, 0, { emissive: '#fff3b0', emissiveIntensity: 0.3 }), 0, 0.8, 0.62, g);
  return g;
}

// ---------------- bangun kota ----------------
export function buildTown(scene) {
  const T = { lights: [], signs: [], carts: {}, motor: null, steam: [] };
  const root = new THREE.Group(); scene.add(root); T.root = root;
  const brick = M('#b5694a', 0.9), cream = M('#efe5d0'), dark = M('#2e3b35', 0.7), wood = M('#8a5a32', 0.6), woodD = M('#5a3a22', 0.6), glass = new THREE.MeshStandardMaterial({ color: '#a8d8ea', transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.2 });
  // ---------- KOPI GRIYA ----------
  const C = new THREE.Group(); root.add(C);
  const cw = CAFE.maxX - CAFE.minX, cd = CAFE.maxZ - CAFE.minZ, ccx = (CAFE.minX + CAFE.maxX) / 2, ccz = (CAFE.minZ + CAFE.maxZ) / 2;
  const planks = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); for (let i = 0; i < 16; i++) { g.fillStyle = `hsl(28,${35 + Math.random() * 10}%,${32 + Math.random() * 10}%)`; g.fillRect(0, i * 16, 256, 16); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, i * 16 + 15, 256, 1); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 4); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const fl = box(cw, 0.06, cd, new THREE.MeshStandardMaterial({ map: planks, roughness: 0.6 }), ccx, 0.03, ccz, C); fl.castShadow = false;
  box(cw, 2.6, 0.18, brick, ccx, 1.3, CAFE.minZ, C);
  box(0.18, 2.6, cd, brick, CAFE.minX, 1.3, ccz, C); box(0.18, 2.6, cd, cream, CAFE.maxX, 1.3, ccz, C);
  // depan: kusen & kaca besar
  for (const [a, b] of [[CAFE.minX, CAFE.door[0]], [CAFE.door[1], CAFE.maxX]]) { const w = b - a, x = (a + b) / 2; box(w, 0.5, 0.18, brick, x, 0.25, CAFE.maxZ, C); const gl = box(w, 1.9, 0.04, glass, x, 1.45, CAFE.maxZ, C); gl.castShadow = false; box(w, 0.2, 0.2, dark, x, 2.5, CAFE.maxZ, C); }
  box(1.2, 0.2, 0.2, dark, (CAFE.door[0] + CAFE.door[1]) / 2, 2.5, CAFE.maxZ, C);
  // kanopi & papan nama
  const aw = box(cw + 0.4, 0.08, 1.3, M('#1f5a44', 0.7), ccx, 2.75, CAFE.maxZ + 0.6, C); aw.rotation.x = 0.18;
  T.signs.push(sign(C, 'KOPI GRIYA', '#1f3a2e', '#f3d27a', ccx, 3.15, CAFE.maxZ + 0.02, 4.4, 0.75, 0, 'kopi • roti • ruang temu'));
  // bar & mesin espresso & rak
  box(3.3, 1.0, 0.7, woodD, -18, 0.5, 0.25, C); box(3.4, 0.05, 0.8, M('#e8e2d6', 0.3), -18, 1.02, 0.25, C);
  box(0.6, 0.45, 0.45, M('#c9ced4', 0.25, 0.9), -18.9, 1.27, 0.05, C); box(0.25, 0.4, 0.25, M('#1f1f1f'), -17.9, 1.25, 0.05, C);
  for (let i = 0; i < 6; i++) cyl(0.05, 0.04, 0.1, M(['#f2efe8', '#1f3a2e', '#b5694a'][i % 3]), -17.3 + (i % 3) * 0.14, 1.1, 0.35 - Math.floor(i / 3) * 0.14, C, 10);
  box(0.7, 0.3, 0.4, M('#fdf4e3', 0.3, 0, { emissive: '#ffe0a0', emissiveIntensity: 0.25 }), -16.8, 1.2, 0.2, C);
  for (let i = 0; i < 6; i++) cyl(0.07, 0.07, 0.06, M('#d9a05b'), -17.0 + (i % 3) * 0.14, 1.3, 0.2 + (i > 2 ? 0.1 : -0.05), C, 10);
  for (const y of [1.6, 2.1]) box(3.2, 0.05, 0.3, wood, -18, y, -0.78, C);
  for (let i = 0; i < 14; i++) cyl(0.06, 0.06, 0.22, M(['#6d4c41', '#c8a27a', '#3e2723', '#8d6e63'][i % 4]), -19.4 + i * 0.2, i < 7 ? 1.74 : 2.24, -0.78, C, 8);
  // papan menu kapur
  const menu = document.createElement('canvas'); menu.width = 512; menu.height = 384; { const g = menu.getContext('2d'); g.fillStyle = '#1e2522'; g.fillRect(0, 0, 512, 384); g.fillStyle = '#f2efe8'; g.font = 'bold 44px sans-serif'; g.fillText('MENU HARI INI', 90, 60); g.font = '28px sans-serif';
    [['Kopi susu gula aren', '25K'], ['Iced americano', '22K'], ['Matcha latte', '30K'], ['Croissant', '28K'], ['Pisang goreng keju', '18K'], ['Kopi bawa pulang', '50K']].forEach(([a, b], i) => { g.fillText(a, 30, 120 + i * 42); g.fillText(b, 420, 120 + i * 42); }); }
  const mt = new THREE.CanvasTexture(menu); mt.colorSpace = THREE.SRGBColorSpace;
  const mm = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), new THREE.MeshStandardMaterial({ map: mt })); mm.position.set(-16.2, 1.95, -0.88); C.add(mm);
  // lampu gantung, tanaman, sofa dinding
  for (const [x, z] of [[-20.1, 3.5], [-15.9, 3.5], [-20.1, 6.5], [-15.9, 6.5], [-18, 1.2]]) {
    box(0.01, 0.6, 0.01, M('#222'), x, 2.3, z, C);
    const b = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.2, 16, 1, true), M('#1f1f1f', 0.5, 0.3, { side: THREE.DoubleSide })); b.position.set(x, 1.95, z); C.add(b);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), M('#fff6d8', 0.3, 0, { emissive: '#ffcf80', emissiveIntensity: 0.8 })); bulb.position.set(x, 1.86, z); C.add(bulb); T.lights.push(bulb);
  }
  const cl = new THREE.PointLight('#ffcf80', 0, 9, 1.4); cl.position.set(-18, 2.2, 4); root.add(cl); T.lights.push(cl);
  for (const [x, z] of [[-21.2, -0.5], [-14.8, 8.0], [-21.2, 8.0]]) { cyl(0.2, 0.16, 0.4, M('#b5694a'), x, 0.2, z, C); const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), M('#4f9a4a', 0.9)); l.position.set(x, 0.75, z); C.add(l); }
  box(0.5, 0.45, 5.0, M('#6b4a3a', 0.8), -21.25, 0.22, 4.5, C); box(0.12, 0.5, 5.0, M('#6b4a3a', 0.8), -21.45, 0.7, 4.5, C);
  // lampu untai teras
  const bulbM = M('#fff6d8', 0.3, 0, { emissive: '#ffd27a', emissiveIntensity: 0.9 });
  for (let i = 0; i <= 14; i++) { const x = CAFE.minX + 0.3 + i * (cw - 0.6) / 14; const sag = Math.sin((i / 14) * PI) * 0.25; const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), bulbM); b.position.set(x, 2.45 - sag, 11.1); root.add(b); }
  T.lights.push({ isStringLights: true, mat: bulbM });
  for (const x of [CAFE.minX + 0.3, CAFE.maxX - 0.3]) cyl(0.04, 0.04, 2.5, M('#333'), x, 1.25, 11.1, root);
  // payung teras
  for (const x of [-20.3, -15.7]) { cyl(0.03, 0.03, 2.2, M('#ddd'), x, 1.1, 10.1, root); const u = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.4, 8), M('#f3d27a', 0.8)); u.position.set(x, 2.25, 10.1); u.castShadow = true; root.add(u); }
  // ---------- WARUNG MADURA ----------
  const Wg = new THREE.Group(); root.add(Wg);
  const ww = WARUNG.maxX - WARUNG.minX, wd = WARUNG.maxZ - WARUNG.minZ, wcx = (WARUNG.minX + WARUNG.maxX) / 2, wcz = (WARUNG.minZ + WARUNG.maxZ) / 2;
  box(ww, 0.08, wd, M('#d8d8d0', 0.5), wcx, 0.04, wcz, Wg).castShadow = false;
  box(ww, 2.7, 0.18, M('#e8eef2'), wcx, 1.35, WARUNG.minZ, Wg); box(0.18, 2.7, wd, M('#e8eef2'), WARUNG.minX, 1.35, wcz, Wg); box(0.18, 2.7, wd, M('#e8eef2'), WARUNG.maxX, 1.35, wcz, Wg);
  box(ww + 0.2, 0.25, wd + 0.4, M('#1565c0', 0.6), wcx, 2.8, wcz + 0.2, Wg);
  for (const x of [WARUNG.minX + 0.1, 16.2, 19.8, WARUNG.maxX - 0.1]) box(0.16, 2.7, 0.16, M('#1565c0'), x, 1.35, WARUNG.maxZ - 0.2, Wg);
  // rolling door terbuka (terlipat di atas)
  box(ww, 0.35, 0.2, M('#9aa3ab', 0.4, 0.6), wcx, 2.5, WARUNG.maxZ - 0.15, Wg);
  T.signs.push(sign(Wg, 'WARUNG MADURA', '#0d47a1', '#ffeb3b', wcx, 3.3, WARUNG.maxZ + 0.02, 5.2, 0.8, 0, 'BUKA 24 JAM • SEMBAKO • PULSA • TOKEN'));
  // rak penuh barang
  const shelfCols = ['#e53935', '#fdd835', '#43a047', '#1e88e5', '#fb8c00', '#8e24aa', '#f06292', '#ffffff', '#6d4c41'];
  const geo = new THREE.BoxGeometry(1, 1, 1); const inst = new THREE.InstancedMesh(geo, M('#ffffff', 0.6), 700); let k = 0; const mtx = new THREE.Matrix4(), col = new THREE.Color();
  const addShelf = (x0, x1, z, rot) => { for (let r = 0; r < 5; r++) { box(Math.abs(x1 - x0), 0.03, 0.4, M('#bdbdbd', 0.4, 0.5), (x0 + x1) / 2, 0.3 + r * 0.45, z, Wg); for (let x = x0 + 0.08; x < x1 - 0.08 && k < 700; x += 0.14 + Math.random() * 0.06) { const h = 0.12 + Math.random() * 0.2; mtx.compose(new THREE.Vector3(x, 0.32 + r * 0.45 + h / 2, z), new THREE.Quaternion(), new THREE.Vector3(0.11, h, 0.25)); inst.setMatrixAt(k, mtx); inst.setColorAt(k, col.set(shelfCols[Math.floor(Math.random() * shelfCols.length)])); k++; } } };
  addShelf(WARUNG.minX + 0.3, WARUNG.maxX - 0.3, WARUNG.minZ + 0.35); addShelf(WARUNG.minX + 0.3, 16.9, 5.0);
  inst.count = k; inst.castShadow = true; Wg.add(inst);
  // etalase kaca & renteng sachet
  box(2.4, 0.9, 0.6, M('#eceff1', 0.3), 18.6, 0.45, 7.75, Wg); box(2.3, 0.5, 0.5, glass, 18.6, 1.15, 7.75, Wg);
  for (let i = 0; i < 18; i++) box(0.12, 0.7, 0.01, M(shelfCols[i % shelfCols.length], 0.5), 16.4 + i * 0.19, 2.0, 8.1, Wg);
  // tabung gas melon & galon
  for (let i = 0; i < 6; i++) { cyl(0.14, 0.14, 0.45, M('#43a047', 0.4, 0.3), 20.9 - (i % 3) * 0.32, 0.25, 3.2 + Math.floor(i / 3) * 0.32, Wg); }
  for (let i = 0; i < 4; i++) cyl(0.14, 0.14, 0.45, M('#81d4fa', 0.1, 0, { transparent: true, opacity: 0.7 }), 15.0 + (i % 2) * 0.32, 0.25 + Math.floor(i / 2) * 0.46, 3.1, Wg);
  const wl = new THREE.PointLight('#e8f4ff', 0, 10, 1.3); wl.position.set(18, 2.4, 5.5); root.add(wl); T.lights.push(wl);
  const tube = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.05, 0.08), M('#ffffff', 0.3, 0, { emissive: '#e8f4ff', emissiveIntensity: 1 })); tube.position.set(18, 2.6, 5.5); Wg.add(tube);
  // motor parkir depan warung & kafe
  const m1 = buildMotor('#1565c0'); m1.position.set(15.3, 0, 11.6); m1.rotation.y = 0.4; root.add(m1);
  const m2 = buildMotor('#212121'); m2.position.set(-13.9, 0, 11.7); m2.rotation.y = -0.3; root.add(m2);
  const m3 = buildMotor('#ad1457'); m3.position.set(-14.6, 0, 9.8); m3.rotation.y = 1.4; root.add(m3);
  // ---------- POS RONDA ----------
  const P = new THREE.Group(); P.position.set(20.6, 0, 10.2); P.rotation.y = PI; root.add(P);
  box(1.9, 0.45, 1.5, M('#c9b36a', 0.8), 0, 0.225, 0, P);
  for (const [x, z] of [[-0.9, -0.7], [0.9, -0.7], [-0.9, 0.7], [0.9, 0.7]]) cyl(0.05, 0.05, 2.3, M('#8d6e40'), x, 1.15, z, P);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.7, 4), M('#7a3e2a', 0.8)); roof.position.y = 2.6; roof.rotation.y = PI / 4; roof.castShadow = true; P.add(roof);
  const kent = cyl(0.07, 0.07, 0.6, M('#6d4c41'), 0.95, 1.4, 0.72, P, 10); kent.userData.kentongan = true;
  sign(P, 'POS RONDA RT 05', '#b71c1c', '#ffffff', 0, 2.1, -0.76, 1.6, 0.28, PI);
  // ---------- detail jalan ----------
  // tiang listrik & kabel
  const poles = [-20, -6, 8, 22];
  for (const x of poles) { cyl(0.09, 0.12, 7, M('#8e8e8e', 0.6, 0.3), x, 3.5, 11.9, root); box(1.0, 0.08, 0.08, M('#555'), x, 6.6, 11.9, root); }
  for (let i = 0; i < poles.length - 1; i++) for (const dz of [-0.4, 0.4]) {
    const a = new THREE.Vector3(poles[i], 6.6, 11.9 + dz), b = new THREE.Vector3(poles[i + 1], 6.6, 11.9 + dz);
    const curve = new THREE.QuadraticBezierCurve3(a, new THREE.Vector3((a.x + b.x) / 2, 6.0, a.z), b);
    const tb = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.012, 4), M('#111')); root.add(tb);
  }
  // tong sampah, pot, polisi tidur, spanduk RT, sepeda
  for (const [x, c] of [[-12.2, '#2e7d32'], [13.6, '#f9a825'], [-22 + 0.6, '#1565c0']]) { cyl(0.28, 0.25, 0.8, M(c, 0.6), x, 0.4, 11.6, root); }
  for (const x of [-10.5, 2.5, 13.8]) { box(3.2, 0.08, 0.5, M('#fbc02d', 0.7), x, 0.04, 15.3, root).rotation.y = PI / 2; }
  const ban = document.createElement('canvas'); ban.width = 1024; ban.height = 200; { const g = ban.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 1024, 200); g.fillStyle = '#c62828'; g.fillRect(0, 0, 1024, 30); g.fillRect(0, 170, 1024, 30); g.fillStyle = '#1b1b1b'; g.font = 'bold 60px sans-serif'; g.textAlign = 'center'; g.fillText('KERJA BAKTI MINGGU PAGI 07.00', 512, 95); g.font = '36px sans-serif'; g.fillText('Warga RT 05 Griya Asri — bawa sapu & semangat!', 512, 150); }
  const bt = new THREE.CanvasTexture(ban); bt.colorSpace = THREE.SRGBColorSpace;
  const bm = new THREE.Mesh(new THREE.PlaneGeometry(5, 1), new THREE.MeshStandardMaterial({ map: bt, side: THREE.DoubleSide })); bm.position.set(15, 4.3, 11.9); root.add(bm);
  const bike = new THREE.Group(); for (const z of [-0.45, 0.45]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 6, 20), M('#222')); w.position.set(0, 0.32, z); w.rotation.y = PI / 2; bike.add(w); }
  box(0.04, 0.04, 0.9, M('#e53935'), 0, 0.55, 0, bike); box(0.2, 0.05, 0.2, M('#111'), 0, 0.75, -0.2, bike); bike.position.set(-12.5, 0, 10.2); bike.rotation.y = 0.2; root.add(bike);
  // ---------- lampu keliling halaman rumah Handoyo & Naswa ----------
  T.yard = [];
  const postM = M('#2b2f33', 0.5, 0.6), capM = M('#1c1f22', 0.4, 0.7);
  const glowM = new THREE.MeshStandardMaterial({ color: '#fff4d6', emissive: '#ffcf7a', emissiveIntensity: 0.15, roughness: 0.3 });
  T.yardMat = glowM;
  const lamp = (x, z, h = 1.0) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
    cyl(0.045, 0.06, h, postM, 0, h / 2, 0, g, 10); cyl(0.12, 0.12, 0.04, postM, 0, 0.02, 0, g, 12);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.24, 0.2), glowM); head.position.y = h + 0.12; g.add(head);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.13, 4), capM); cap.position.y = h + 0.31; cap.rotation.y = PI / 4; g.add(cap);
    return g;
  };
  const inset = 0.5, L0 = { minX: -13, maxX: 13, minZ: -11, maxZ: 11 };
  const skipFront = (x) => Math.abs(x + 4) < 1.3 || (x > 8.8 && x < 13.2);
  for (let x = L0.minX + inset; x <= L0.maxX - inset + 0.01; x += 3.2) { if (!skipFront(x)) lamp(x, L0.maxZ - inset); lamp(x, L0.minZ + inset); }
  for (let z = L0.minZ + inset + 3.2; z <= L0.maxZ - inset - 1; z += 3.2) { lamp(L0.minX + inset, z); lamp(L0.maxX - inset, z); }
  for (const z of [7.4, 8.7, 10.0]) { lamp(-4.95, z, 0.6); lamp(-3.05, z, 0.6); }     // jalan setapak pagar → pintu
  for (const [x, z] of [[-4.0, 10.6], [-9, 10.3], [4, 10.3], [-12.2, 0], [12.2, 0], [-8, -10.3], [8, -10.3], [0, -10.3], [-4, 8.2]]) {
    const L = new THREE.PointLight('#ffcf7a', 0, 7.5, 1.6); L.position.set(x, 1.3, z); root.add(L); T.yard.push(L);
  }
  // lampu sorot fasad rumah
  for (const x of [-7.4, 7.4]) { const S = new THREE.SpotLight('#ffe2a8', 0, 12, 0.7, 0.6, 1.2); S.position.set(x, 0.3, 7.2); S.target.position.set(x * 0.6, 3.5, 6); root.add(S); root.add(S.target); T.yard.push(S); lamp(x, 7.2, 0.25); }

  for (const [kind, V] of Object.entries(VENDOR_SPOTS)) { const g = buildCart(kind, V); g.visible = false; root.add(g); T.carts[kind] = g; }
  // motor kurir
  T.motor = buildMotor('#ff6f00'); const bx = box(0.5, 0.4, 0.5, M('#ff8f00', 0.6), 0, 1.0, -0.55, T.motor); bx.castShadow = true;
  T.motor.visible = false; root.add(T.motor);
  return T;
}
function buildCart(kind, V) {
  const g = new THREE.Group(); g.position.set(V.pos[0], 0, V.pos[1]);
  box(1.6, 0.8, 0.7, M(V.color, 0.6), 0, 0.85, 0, g); box(1.7, 0.05, 0.8, M('#fafafa'), 0, 1.27, 0, g);
  box(1.6, 0.5, 0.02, M('#a8d8ea', 0.1, 0, { transparent: true, opacity: 0.4 }), 0, 1.55, 0.34, g);
  box(1.8, 0.05, 0.9, M('#fafafa'), 0, 2.05, 0, g);
  for (const [x, z] of [[-0.75, -0.3], [0.75, -0.3], [-0.75, 0.3], [0.75, 0.3]]) cyl(0.02, 0.02, 0.8, M('#777'), x, 1.65, z, g);
  for (const s of [-1, 1]) { const w = cyl(0.3, 0.3, 0.06, M('#222'), s * 0.55, 0.3, 0.38, g, 16); w.rotation.x = PI / 2; }
  sign(g, V.label.toUpperCase(), '#ffffff', V.color, 0, 1.0, 0.36, 1.5, 0.36);
  if (kind === 'bakso') { for (let i = 0; i < 2; i++) cyl(0.18, 0.16, 0.35, M('#bdbdbd', 0.3, 0.8), -0.4 + i * 0.5, 1.47, -0.1, g); }
  if (kind === 'sate') { box(0.9, 0.12, 0.25, M('#3e2723'), 0.2, 1.36, -0.15, g); const e = box(0.8, 0.02, 0.2, M('#ff5722', 0.5, 0, { emissive: '#ff3d00', emissiveIntensity: 0.8 }), 0.2, 1.43, -0.15, g); g.userData.ember = e; }
  if (kind === 'cendol') { for (let i = 0; i < 3; i++) cyl(0.12, 0.12, 0.35, M(['#43a047', '#6d4c41', '#fafafa'][i], 0.2, 0, { transparent: true, opacity: 0.85 }), -0.45 + i * 0.4, 1.47, -0.1, g); }
  if (kind === 'siomay') { cyl(0.26, 0.22, 0.4, M('#9e9e9e', 0.3, 0.8), 0, 1.48, -0.1, g); }
  // uap
  const steam = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.25, depthWrite: false }));
  steam.position.set(-0.2, 1.75, -0.1); g.add(steam); g.userData.steam = steam;
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
export function buildTownObject(obj) {
  const g = new THREE.Group(); const T = TYPES[obj.type];
  if (obj.type === 'cafeTable' || obj.type === 'cafeTableOut') {
    cyl(0.4, 0.4, 0.04, M(obj.type === 'cafeTable' ? '#6b4a3a' : '#e8e2d6', 0.5), 0, 0.74, 0, g, 20); cyl(0.04, 0.04, 0.72, M('#222', 0.4, 0.6), 0, 0.36, 0, g); cyl(0.25, 0.25, 0.03, M('#222'), 0, 0.015, 0, g);
    for (const s of [-1, 1]) { const c = new THREE.Group(); c.position.set(0, 0, s * 0.55); g.add(c); box(0.42, 0.05, 0.4, M('#2e3b35'), 0, 0.46, 0, c); box(0.42, 0.45, 0.04, M('#2e3b35'), 0, 0.7, s * 0.2, c); for (const [x, z] of [[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]]) box(0.03, 0.45, 0.03, M('#222'), x, 0.225, z, c); }
    cyl(0.05, 0.04, 0.1, M('#f2efe8'), 0.1, 0.81, 0.05, g, 10); box(0.12, 0.08, 0.12, M('#4f9a4a', 0.9), -0.15, 0.8, -0.05, g);
  } else if (obj.type === 'warungBench') {
    box(1.6, 0.06, 0.4, M('#8a5a32'), 0, 0.45, 0, g); for (const x of [-0.7, 0.7]) box(0.06, 0.45, 0.35, M('#5a3a22'), x, 0.225, 0, g);
  } else if (obj.type === 'streetCart' || obj.type === 'coffeeCounter' || obj.type === 'warungCounter' || obj.type === 'posRonda') {
    // tampilan sudah dibangun oleh buildTown; di sini hanya kotak klik transparan
    const hit = new THREE.Mesh(new THREE.BoxGeometry(T.w, 1.1, T.d), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.y = 0.55; g.add(hit);
  } else if (obj.type === 'parcel') {
    box(0.45, 0.32, 0.4, M('#c8a27a', 0.9), 0, 0.16, 0, g); box(0.46, 0.05, 0.08, M('#e6d3b3'), 0, 0.3, 0, g);
    sign(g, '📦 PAKET', '#fff8e1', '#e65100', 0, 0.17, 0.205, 0.3, 0.1);
  }
  g.traverse((o) => { if (o.isMesh) { o.userData.objId = obj.id; o.castShadow = o.castShadow !== false; } });
  g.userData = { objId: obj.id, type: obj.type, P: {} };
  return g;
}
export const isTownType = (t) => !!(TYPES[t] && (TYPES[t].town || t === 'parcel'));

// update visual tiap frame (malam, uap, gerobak, motor kurir)
export function updateTown(T, hh, night, t) {
  for (const L of T.lights) {
    if (L.isStringLights) L.mat.emissiveIntensity = night ? 1.2 : 0.1;
    else if (L.isLight) L.intensity = night ? 3.2 : 0.4;
    else if (L.material) L.material.emissiveIntensity = night ? 1.1 : 0.2;
  }
  for (const s of T.signs) s.material.emissiveIntensity = night ? 0.45 : 0;
  if (T.yardMat) { T.yardMat.emissiveIntensity = night ? 1.4 : 0.12; for (const L of T.yard) L.intensity = night ? (L.isSpotLight ? 9 : 3.4) : 0; }
  const carts = (hh.world.carts || {});
  for (const [kind, g] of Object.entries(T.carts)) {
    g.visible = !!carts[kind];
    if (g.visible && g.userData.steam) { const k = (t * 0.6) % 1; g.userData.steam.position.y = 1.7 + k * 0.6; g.userData.steam.material.opacity = 0.3 * (1 - k); g.userData.steam.scale.setScalar(0.8 + k); }
    if (g.userData.ember) g.userData.ember.material.emissiveIntensity = 0.6 + Math.sin(t * 9) * 0.3;
  }
  const kur = hh.others && Object.values(hh.others).find((o) => o.role === 'courier' && !o.hidden);
  T.motor.visible = !!kur; if (kur) { T.motor.position.set(-5.4, 0, 12.7); T.motor.rotation.y = PI / 2; }
}
