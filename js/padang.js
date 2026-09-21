// ============================================================
//  RUMAH MAKAN PADANG "UNI ROSNA — Salero Rang Minang"
//  Di sisi timur rumah (belakang Warung Madura), masuk lewat gang samping.
//  Etalase bertingkat berisi lauk, meja makan panjang, dapur, kasir,
//  wastafel, kipas angin langit-langit, ornamen gonjong rumah gadang.
//  Penjaga: Uda Rizal (etalase), Uni Rosna (kasir), Ajo Fikri (pelayan hidang)
// ============================================================
import * as THREE from 'three';
import { TYPES, MOODLETS, PI, fmtRp } from './data.js';
import { INTER } from './interactions.js';
import { M, box } from './world.js';
import { NPCS } from './people.js';
import { TOWN_WALLS, TOWN_OBJECTS, POSTS } from './town.js';

export const PADANG = { minX: 14.2, maxX: 21.8, minZ: -12.6, maxZ: 1.4, door: [-1.9, -0.7], kitchenZ: -10.2 };
const P = PADANG;
TOWN_WALLS.push(
  { a: [P.minX, P.maxZ], b: [P.maxX, P.maxZ] }, { a: [P.minX, P.minZ], b: [P.maxX, P.minZ] }, { a: [P.maxX, P.minZ], b: [P.maxX, P.maxZ] },
  { a: [P.minX, P.minZ], b: [P.minX, P.door[0]] }, { a: [P.minX, P.door[1]], b: [P.minX, P.maxZ] },
  { a: [16.6, P.kitchenZ], b: [P.maxX, P.kitchenZ] },            // dinding dapur (ada pintu di sisi barat x 14.2–16.6)
);
TOWN_OBJECTS.push(
  ['padangCounter', 18.6, 0.1, 2], ['padangKasir', 15.3, -0.2, 1], ['padangTable', 18.4, -3.3, 0], ['padangTable', 18.4, -5.9, 0], ['padangTable', 18.4, -8.5, 0],
  ['padangSink', 21.35, -1.6, 3],
);
Object.assign(POSTS, { padang1: [18.6, 0.95, PI], padang2: [14.75, -0.2, PI / 2], padang3: [16.0, -9.6, 0] });
Object.assign(NPCS, {
  'Uda Rizal': { species: 'npc', role: 'padang', trait: 'Pemilik RM Padang asal Bukittinggi, jago meracik rendang 8 jam', home: 'E', routine: 'work', post: 'padang1', hours: [7, 22], outfit: { skin: '#a8714a', hair: '#141414', hairStyle: 'short', shirt: '#f5f5f5', pants: '#212121', dress: false, height: 1.02, peci: true } },
  'Uni Rosna': { species: 'npc', role: 'padang', trait: 'Istri Uda Rizal, pegang kasir, hafal harga semua lauk', fam: 'Uda Rizal', home: 'E', routine: 'work', post: 'padang2', hours: [7, 22], outfit: { skin: '#c99670', hair: '#2a1a12', hairStyle: 'hijab', shirt: '#b71c1c', pants: '#3e2723', dress: true, height: 0.95, batik: true } },
  'Ajo Fikri': { species: 'npc', role: 'padang', trait: 'Pelayan, bisa bawa 12 piring sekaligus di satu lengan', home: 'E', routine: 'work', post: 'padang3', hours: [9, 21], outfit: { skin: '#b07a52', hair: '#141414', hairStyle: 'short', shirt: '#2e7d32', pants: '#212121', dress: false, height: 1.0 } },
});
Object.assign(MOODLETS, {
  kenyangPadang: { label: 'Kenyang nasi Padang', emoji: '🍛', val: 18, dur: 300 },
  makanHidang: { label: 'Makan hidang lesehan rasa Minang', emoji: '🥘', val: 24, dur: 360 },
});

// ---------------- tipe benda ----------------
const seats = [-0.8, 0, 0.8].flatMap((x) => [{ ax: x, az: 0.95, px: x, pz: 0.58, yaw: PI, seat: 0.45 }, { ax: x, az: -0.95, px: x, pz: -0.58, yaw: 0, seat: 0.45 }]);
Object.assign(TYPES, {
  padangCounter: { name: 'Etalase RM Padang Uni Rosna', cat: 'luar', price: 0, w: 3.6, d: 0.9, fixed: true, padang: true, spots: [{ ax: -1.1, az: 0.9, yaw: PI }, { ax: 0, az: 0.9, yaw: PI }, { ax: 1.1, az: 0.9, yaw: PI }],
    acts: ['pdRendang', 'pdAyamPop', 'pdGulaiIkan', 'pdDendeng', 'pdHemat', 'pdHidang', 'pdBungkus', 'pdTehTalua'] },
  padangTable: { name: 'Meja Makan RM Padang', cat: 'luar', price: 0, w: 2.4, d: 0.8, fixed: true, padang: true, spots: seats, acts: ['pdNgobrol'] },
  padangKasir: { name: 'Meja Kasir', cat: 'luar', price: 0, w: 1.0, d: 0.6, fixed: true, padang: true, spots: [{ ax: 0, az: 0.8, yaw: PI }], acts: ['pdBayarTagihan'] },
  padangSink: { name: 'Wastafel Cuci Tangan', cat: 'luar', price: 0, w: 0.7, d: 0.45, fixed: true, padang: true, spots: [{ ax: 0, az: 0.65, yaw: PI }], acts: ['pdCuciTangan'] },
});

// ---------------- menu (pesan di etalase → makan di meja) ----------------
const isH = (s) => s.species === 'human';
const canPay = (price) => (c) => (isH(c.sim) && (c.sim.wallet ?? 0) < price ? `Uang kurang (${fmtRp(price)})` : true);
const busy = (hh, who, t = 4) => { const s = hh.others && hh.others[who]; if (s && !s.hidden) s.busyT = t; };
function serveHidang(hh, sim) {
  const W = hh.world; const tabs = W.objects.filter((o) => o.type === 'padangTable');
  const t = tabs.sort((a, b) => Math.hypot(a.x - sim.x, a.z - sim.z) - Math.hypot(b.x - sim.x, b.z - sim.z))[0]; if (!t) return;
  t.s = t.s || {}; t.s.hidang = W.time + 45; W.objVer++;
  const aj = hh.others && hh.others['Ajo Fikri'];
  if (aj && !aj.hidden) { aj.queue = []; aj.prop = 'plate'; hh.queueAct(aj, 'go', null, { pos: [t.x - 1.5, t.z + 1.0] }); hh.queueAct(aj, 'go', null, { pos: POSTS.padang3.slice(0, 2) }); }
  hh.toast('🍛 Ajo Fikri menghidangkan belasan piring lauk ke meja — ambil yang disuka, bayar yang dimakan!', 'good');
}
const menu = (key, label, icon, price, eff, mood, extra = {}) => {
  INTER[key] = {
    label: `${label} · ${fmtRp(price)}`, icon, check: canPay(price),
    build: (c) => ({ steps: [
      { target: { obj: c.obj.id }, anim: 'talk', dur: 2, label: 'Pesan di etalase', snd: 'clink', onStart: (x) => { busy(x.g, 'Uda Rizal', 3); x.g.sfx && x.g.sfx('cash'); } },
      ...(extra.takeaway ? [] : [{ target: { type: ['padangTable'], kind: 'seat', near: c.obj }, anim: 'eat', prop: 'plate', dur: extra.dur || 18, eff, label: `Makan ${label.toLowerCase()}`, snd: 'munch',
        onStart: (x) => { if (extra.hidang) serveHidang(x.g, x.sim); },
        onDone: (x) => { if (isH(x.sim)) x.g.op({ o: 'money', d: -price, why: `RM Padang: ${label}`, sim: x.sim.name }); busy(x.g, 'Uni Rosna', 2); x.sim.mood(mood); } }]),
      ...(extra.takeaway ? [{ target: { obj: c.obj.id }, anim: 'grab', prop: 'bag', dur: 4, label: 'Tunggu dibungkus', onDone: (x) => { if (isH(x.sim)) x.g.op({ o: 'money', d: -price, why: `RM Padang: ${label}`, sim: x.sim.name }); x.g.op({ o: 'house', k: 'servings', d: extra.takeaway }); x.g.toast(`🛍️ ${x.sim.name} bawa pulang nasi Padang bungkus (+${extra.takeaway} porsi di meja makan rumah). Karetnya dua = lauk dobel! 😄`, 'good'); } }] : []),
    ] }),
  };
};
menu('pdRendang', 'Nasi rendang daging', '🥩', 28000, { hunger: 5, fun: 0.6 }, 'kenyangPadang');
menu('pdAyamPop', 'Nasi ayam pop + sambal ijo', '🍗', 25000, { hunger: 4.6, fun: 0.5 }, 'kenyangPadang');
menu('pdGulaiIkan', 'Nasi gulai kepala ikan kakap', '🐟', 35000, { hunger: 5, fun: 0.8 }, 'kenyangPadang');
menu('pdDendeng', 'Nasi dendeng batokok balado', '🌶️', 30000, { hunger: 4.8, fun: 0.7 }, 'kenyangPadang');
menu('pdHemat', 'Nasi telur dadar + perkedel + daun singkong', '🍳', 15000, { hunger: 4.2 }, 'kenyangPadang');
menu('pdHidang', 'Makan hidang (semua lauk dihidangkan)', '🥘', 85000, { hunger: 6, fun: 1.4, social: 1 }, 'makanHidang', { hidang: true, dur: 28 });
menu('pdBungkus', 'Bungkus 2 nasi rendang untuk di rumah', '🛍️', 56000, {}, 'kenyangPadang', { takeaway: 2 });
INTER.pdTehTalua = { label: `Teh talua (teh telur khas Minang) · ${fmtRp(18000)}`, icon: '🥚', check: canPay(18000),
  build: (c) => ({ steps: [{ target: { obj: c.obj.id }, anim: 'grab', prop: 'cup', dur: 6, eff: { energy: 2.2, fun: 0.8 }, label: 'Minum teh talua', onStart: (x) => busy(x.g, 'Uda Rizal', 3), onDone: (x) => { if (isH(x.sim)) x.g.op({ o: 'money', d: -18000, why: 'RM Padang: teh talua', sim: x.sim.name }); } }] }) };
INTER.pdNgobrol = { label: 'Duduk & ngobrol sambil nunggu', icon: '💬', build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'seat' }, anim: 'sit', dur: 15, eff: { social: 0.8, fun: 0.3 } }] }) };
INTER.pdCuciTangan = { label: 'Cuci tangan', icon: '🧼', build: (c) => ({ steps: [{ target: { obj: c.obj.id }, anim: 'wash', dur: 2, eff: { hygiene: 4 }, snd: 'tap' }] }) };
INTER.pdBayarTagihan = { label: 'Ngobrol dengan Uni Rosna di kasir', icon: '🧾', build: (c) => ({ steps: [{ target: { obj: c.obj.id }, anim: 'talk', dur: 6, eff: { social: 1.5 }, onStart: (x) => busy(x.g, 'Uni Rosna', 6) }] }) };
export const isPadangType = (t) => !!(TYPES[t] && TYPES[t].padang);

// ---------------- mesh ----------------
const cyl = (rt, rb, h, m, x, y, z, p, seg = 16) => { const k = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); k.position.set(x, y, z); k.castShadow = true; p.add(k); return k; };
const sph = (r, m, x, y, z, p, sx = 1, sy = 1, sz = 1) => { const k = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m); k.position.set(x, y, z); k.scale.set(sx, sy, sz); p.add(k); return k; };
const LAUK = {
  rendang: (p, x, y, z) => { for (let i = 0; i < 4; i++) box(0.05, 0.035, 0.045, M('#3e2012', 0.9), x + (i % 2) * 0.05 - 0.025, y + 0.02, z + (i > 1 ? 0.03 : -0.02), p); },
  ayampop: (p, x, y, z) => { sph(0.05, M('#f3e3c3', 0.7), x, y + 0.03, z, p, 1.2, 0.6, 0.9); sph(0.02, M('#2e7d32', 0.6), x + 0.05, y + 0.03, z + 0.03, p); },
  gulai: (p, x, y, z) => { cyl(0.07, 0.07, 0.02, M('#e0a526', 0.4), x, y + 0.015, z, p); sph(0.035, M('#f5f5f5', 0.5), x, y + 0.035, z, p, 1.3, 0.6, 1); },
  balado: (p, x, y, z) => { for (let i = 0; i < 3; i++) sph(0.028, M('#c62828', 0.5), x + (i - 1) * 0.045, y + 0.025, z, p); },
  perkedel: (p, x, y, z) => { for (let i = 0; i < 3; i++) cyl(0.025, 0.025, 0.02, M('#b8741a', 0.8), x + (i - 1) * 0.05, y + 0.015, z, p, 10); },
  daun: (p, x, y, z) => { sph(0.06, M('#2e5e20', 0.9), x, y + 0.02, z, p, 1.2, 0.35, 1); },
  sambal: (p, x, y, z) => { sph(0.05, M('#6fae3b', 0.7), x, y + 0.02, z, p, 1.2, 0.4, 1); },
  telur: (p, x, y, z) => { cyl(0.06, 0.06, 0.02, M('#f2c230', 0.7), x, y + 0.015, z, p); },
  dendeng: (p, x, y, z) => { box(0.12, 0.012, 0.07, M('#5d2a16', 0.8), x, y + 0.012, z, p); sph(0.03, M('#d32f2f', 0.6), x, y + 0.025, z, p, 1.5, 0.3, 1); },
  kikil: (p, x, y, z) => { cyl(0.07, 0.07, 0.02, M('#d98c2b', 0.4), x, y + 0.015, z, p); },
};
const LAUK_KEYS = Object.keys(LAUK);
function plate(p, x, y, z, kind, big) { cyl(big ? 0.11 : 0.09, big ? 0.09 : 0.075, 0.015, M('#ffffff', 0.25), x, y, z, p, 20); if (kind) LAUK[kind](p, x, y + 0.01, z); }
function signTex(lines, bg, fg, w = 1024, h = 256) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = '#f3d27a'; g.lineWidth = 10; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = fg; g.textAlign = 'center'; lines.forEach(([t, sz, y]) => { g.font = `bold ${sz}px "Baloo 2", sans-serif`; g.fillText(t, w / 2, y); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function rumahGadangPic() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 320; const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, 320); sky.addColorStop(0, '#6fb0e0'); sky.addColorStop(1, '#f6d7a7'); g.fillStyle = sky; g.fillRect(0, 0, 512, 320);
  g.fillStyle = '#3d6b3a'; g.beginPath(); g.moveTo(0, 230); g.quadraticCurveTo(140, 150, 260, 210); g.quadraticCurveTo(380, 160, 512, 220); g.lineTo(512, 320); g.lineTo(0, 320); g.fill();
  g.fillStyle = '#6d3a1f'; g.fillRect(150, 190, 220, 80);
  g.fillStyle = '#2b2b2b'; g.beginPath(); g.moveTo(120, 200); g.quadraticCurveTo(160, 120, 190, 110); g.quadraticCurveTo(210, 150, 260, 140); g.quadraticCurveTo(310, 150, 330, 110); g.quadraticCurveTo(360, 120, 400, 200); g.closePath(); g.fill();
  g.strokeStyle = '#c9a44a'; g.lineWidth = 4; for (let x = 160; x < 370; x += 20) { g.beginPath(); g.moveTo(x, 200); g.lineTo(x, 265); g.stroke(); }
  g.fillStyle = '#8a5a32'; g.font = 'bold 24px serif'; g.fillText('Ranah Minang', 190, 305);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function buildPadang(scene) {
  const R = new THREE.Group(); scene.add(R); const F = { fans: [], lights: [], signs: [], root: R };
  const w = P.maxX - P.minX, d = P.maxZ - P.minZ, cx = (P.minX + P.maxX) / 2, cz = (P.minZ + P.maxZ) / 2;
  // lantai keramik
  const tile = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#e9e6df' : '#dedad2'; g.fillRect(x * 64, y * 64, 64, 64); g.strokeStyle = '#b9b4aa'; g.strokeRect(x * 64, y * 64, 64, 64); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 1.2, d / 1.2); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  box(w, 0.07, d, new THREE.MeshStandardMaterial({ map: tile, roughness: 0.35 }), cx, 0.035, cz, R).castShadow = false;
  const wallM = M('#f1d9a8', 0.85), lower = M('#7a2e1f', 0.7), H = 2.8;
  const wall = (x0, z0, x1, z1) => { const len = Math.hypot(x1 - x0, z1 - z0), ax = z0 === z1; box(ax ? len : 0.18, H, ax ? 0.18 : len, wallM, (x0 + x1) / 2, H / 2, (z0 + z1) / 2, R); box(ax ? len + 0.01 : 0.2, 0.9, ax ? 0.2 : len + 0.01, lower, (x0 + x1) / 2, 0.45, (z0 + z1) / 2, R); };
  wall(P.minX, P.maxZ, P.maxX, P.maxZ); wall(P.minX, P.minZ, P.maxX, P.minZ); wall(P.maxX, P.minZ, P.maxX, P.maxZ);
  wall(P.minX, P.minZ, P.minX, P.door[0]); wall(P.minX, P.door[1], P.minX, P.maxZ);
  box(0.2, 0.5, P.door[1] - P.door[0], wallM, P.minX, 2.55, (P.door[0] + P.door[1]) / 2, R);
  // jendela kaca di dinding barat (lihat ke gang)
  const glass = new THREE.MeshStandardMaterial({ color: '#a8d8ea', transparent: true, opacity: 0.3, roughness: 0.05 });
  for (const z of [-4.5, -7.8]) { box(0.05, 1.1, 1.8, glass, P.minX - 0.11, 1.55, z, R); box(0.08, 0.08, 1.9, M('#5a3a22'), P.minX - 0.12, 2.12, z, R); box(0.08, 0.08, 1.9, M('#5a3a22'), P.minX - 0.12, 0.98, z, R); }
  // dinding dapur setengah + jendela saji
  box(21.8 - 16.6, 1.1, 0.16, lower, (16.6 + 21.8) / 2, 0.55, P.kitchenZ, R); box(21.8 - 16.6, 0.7, 0.16, wallM, (16.6 + 21.8) / 2, 2.45, P.kitchenZ, R);
  box(21.8 - 16.6, 0.06, 0.4, M('#8a5a32'), (16.6 + 21.8) / 2, 1.13, P.kitchenZ, R);
  // dapur: kompor, wajan rendang besar, panci gulai, tabung gas, rak bumbu, bak cuci
  box(3.2, 0.85, 0.7, M('#9e9e9e', 0.4, 0.5), 19.6, 0.425, -12.05, R);
  for (const [x, c] of [[18.6, '#3e2012'], [19.8, '#e0a526'], [20.9, '#b8741a']]) { cyl(0.36, 0.26, 0.2, M('#2b2b2b', 0.4, 0.6), x, 0.98, -12.05, R, 20); cyl(0.32, 0.32, 0.02, M(c, 0.6), x, 1.05, -12.05, R, 20); }
  for (const x of [17.2, 17.6]) cyl(0.15, 0.15, 0.5, M('#2e7d32', 0.4, 0.3), x, 0.25, -12.2, R);
  box(1.6, 1.2, 0.35, M('#8a5a32'), 15.4, 1.6, -12.35, R);
  for (let i = 0; i < 10; i++) cyl(0.05, 0.05, 0.14, M(['#d84315', '#f9a825', '#6d4c41', '#558b2f', '#c62828'][i % 5], 0.6), 14.8 + (i % 5) * 0.3, 1.33 + Math.floor(i / 5) * 0.45, -12.3, R, 8);
  box(1.0, 0.85, 0.6, M('#eceff1', 0.3), 15.3, 0.425, -11.0, R);
  const steam = []; for (let i = 0; i < 3; i++) { const s = sph(0.18, new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0.25, depthWrite: false }), 18.6 + i * 1.15, 1.3, -12.05, R); steam.push(s); } F.steam = steam;
  // lukisan rumah gadang, jam, papan menu, tulisan halal, kulkas minuman
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshStandardMaterial({ map: rumahGadangPic() })); pic.position.set(P.maxX - 0.1, 1.9, -5.5); pic.rotation.y = -PI / 2; R.add(pic);
  box(0.06, 1.1, 1.7, M('#6b3a1f'), P.maxX - 0.08, 1.9, -5.5, R);
  const menuT = signTex([['DAFTAR HARGA', 60, 70], ['Rendang 28K · Ayam Pop 25K · Gulai Kakap 35K', 36, 130], ['Dendeng Balado 30K · Paket Hemat 15K', 36, 180], ['Hidang 85K · Teh Talua 18K', 36, 228]], '#1f2a24', '#f3efe2');
  const mb = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.55), new THREE.MeshStandardMaterial({ map: menuT })); mb.position.set(18.6, 2.35, P.maxZ - 0.1); mb.rotation.y = PI; R.add(mb);
  const halal = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), new THREE.MeshStandardMaterial({ map: signTex([['HALAL', 90, 150]], '#2e7d32', '#ffffff', 256, 256) })); halal.position.set(P.minX + 0.11, 2.0, 0.6); halal.rotation.y = PI / 2; R.add(halal);
  cyl(0.22, 0.22, 0.04, M('#fafafa'), P.maxX - 0.1, 2.2, -2.8, R).rotation.z = PI / 2;
  box(0.7, 1.8, 0.6, M('#c62828', 0.4), 21.35, 0.9, -9.4, R); box(0.6, 1.4, 0.02, glass, 21.04, 1.0, -9.4, R).rotation.y = PI / 2;
  // kipas angin langit-langit & lampu
  for (const z of [-3.3, -5.9, -8.5]) {
    cyl(0.02, 0.02, 0.5, M('#333'), 18.4, 2.55, z, R); const fan = new THREE.Group(); fan.position.set(18.4, 2.3, z); R.add(fan);
    cyl(0.12, 0.12, 0.1, M('#eeeeee'), 0, 0, 0, fan); for (let i = 0; i < 3; i++) { const b = box(0.7, 0.02, 0.14, M('#8a5a32'), 0, 0, 0, fan); b.position.set(Math.cos(i * 2.094) * 0.42, 0, Math.sin(i * 2.094) * 0.42); b.rotation.y = -i * 2.094; }
    F.fans.push(fan);
    const bulb = sph(0.1, M('#fff6d8', 0.3, 0, { emissive: '#ffd27a', emissiveIntensity: 0.9 }), 18.4, 2.15, z, R); F.lights.push(bulb);
  }
  const PL = new THREE.PointLight('#ffd9a0', 0, 12, 1.3); PL.position.set(18, 2.4, -4.5); R.add(PL); F.lights.push(PL);
  const PL2 = new THREE.PointLight('#fff1d6', 0, 7, 1.4); PL2.position.set(18.6, 2.2, 0); R.add(PL2); F.lights.push(PL2);
  // papan nama & ornamen gonjong di atas (terlihat dari jalan, melewati atap warung)
  const nameT = signTex([['RUMAH MAKAN PADANG', 74, 100], ['UNI ROSNA · Salero Rang Minang', 46, 170], ['Buka 07.00 – 22.00 · Masuk lewat gang ⟵', 34, 225]], '#7a1f1a', '#f3d27a');
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.3), new THREE.MeshStandardMaterial({ map: nameT, emissive: '#ffffff', emissiveIntensity: 0 })); sg.position.set(cx, 3.6, P.maxZ + 0.12); R.add(sg); F.signs.push(sg);
  box(5.4, 1.45, 0.08, M('#3e2012'), cx, 3.6, P.maxZ + 0.06, R);
  const gonjong = (x, s) => { const g = new THREE.Group(); g.position.set(x, 4.35, P.maxZ + 0.5); R.add(g); const body = new THREE.Mesh(new THREE.ConeGeometry(0.5 * s, 1.1 * s, 4), M('#2b2b2b', 0.8)); body.rotation.y = PI / 4; body.position.y = 0.3 * s; g.add(body); for (const side of [-1, 1]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.1 * s, 0.9 * s, 8), M('#2b2b2b', 0.8)); h.position.set(side * 0.45 * s, 0.75 * s, 0); h.rotation.z = -side * 0.9; g.add(h); } const tip = sph(0.06 * s, M('#caa24a', 0.3, 0.8), 0, 0.9 * s, 0, g); return tip; };
  gonjong(cx - 2.0, 1); gonjong(cx, 1.3); gonjong(cx + 2.0, 1);
  // kanopi pintu, keset, papan penunjuk di mulut gang
  const aw = box(0.9, 0.06, 1.8, M('#b71c1c', 0.7), P.minX - 0.45, 2.7, (P.door[0] + P.door[1]) / 2, R); aw.rotation.z = -0.25;
  box(0.6, 0.02, 1.1, M('#6d4c41', 1), P.minX - 0.45, 0.01, (P.door[0] + P.door[1]) / 2, R);
  cyl(0.05, 0.05, 2.6, M('#444'), 13.95, 1.3, 11.0, R, 8);
  const arrow = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.55), new THREE.MeshStandardMaterial({ map: signTex([['🍛 NASI PADANG', 80, 120], ['masuk gang ↓ 30 m', 50, 200]], '#b71c1c', '#fff8e1', 512, 256), side: THREE.DoubleSide })); arrow.position.set(13.95, 2.3, 11.0); arrow.rotation.y = PI / 2; R.add(arrow);
  // motor pelanggan di gang
  return F;
}
export function buildPadangObject(obj) {
  const g = new THREE.Group(); const T = TYPES[obj.type]; const Pp = {};
  if (obj.type === 'padangCounter') {
    // etalase kaca 3 tingkat penuh piring lauk
    box(3.6, 0.8, 0.85, M('#6b3a1f', 0.6), 0, 0.4, 0, g);
    const glass = new THREE.MeshStandardMaterial({ color: '#cfeaf5', transparent: true, opacity: 0.25, roughness: 0.05 });
    box(3.5, 0.95, 0.75, glass, 0, 1.28, 0, g); box(3.6, 0.04, 0.85, M('#caa24a', 0.3, 0.8), 0, 1.77, 0, g);
    let k = 0;
    for (let t = 0; t < 3; t++) {
      const y = 0.82 + t * 0.3; box(3.4, 0.02, 0.7 - t * 0.12, new THREE.MeshStandardMaterial({ color: '#e3f2f8', transparent: true, opacity: 0.5 }), 0, y, -t * 0.06, g);
      const n = 9 - t; for (let i = 0; i < n; i++) plate(g, -1.5 + i * (3.0 / (n - 1)), y + 0.02, 0.14 - t * 0.08, LAUK_KEYS[(k++) % LAUK_KEYS.length]);
    }
    // piring susun (khas etalase Padang) & bakul nasi mengepul
    for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) plate(g, 1.9 + (i - r / 2) * 0.12, 0.83 + (3 - r) * 0.035, -0.3, null, false);
    cyl(0.26, 0.2, 0.35, M('#c8a27a', 0.9), -2.0, 0.98, -0.1, g); sph(0.22, M('#fbfbf5', 0.8), -2.0, 1.15, -0.1, g, 1, 0.45, 1);
    Pp.rice = sph(0.12, new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0.25, depthWrite: false }), -2.0, 1.45, -0.1, g);
    box(0.5, 0.2, 0.3, M('#ececec'), 1.4, 1.87, -0.25, g);
  } else if (obj.type === 'padangTable') {
    box(2.4, 0.06, 0.8, M('#8a5a32', 0.5), 0, 0.75, 0, g);
    for (const [x, z] of [[-1.1, -0.32], [1.1, -0.32], [-1.1, 0.32], [1.1, 0.32]]) box(0.07, 0.75, 0.07, M('#5a3a22'), x, 0.375, z, g);
    for (const s of [-1, 1]) { box(2.4, 0.05, 0.32, M('#6b4a3a'), 0, 0.45, s * 0.6, g); for (const x of [-1.05, 0, 1.05]) box(0.06, 0.45, 0.28, M('#4e342e'), x, 0.225, s * 0.6, g); }
    // perlengkapan meja: kaleng kerupuk, kobokan, tisu, sambal, kecap
    cyl(0.12, 0.12, 0.3, M('#b0bec5', 0.3, 0.7), -0.95, 0.93, 0, g); cyl(0.12, 0.12, 0.02, glass2(), -0.95, 1.09, 0, g);
    for (let i = 0; i < 6; i++) sph(0.035, M('#f5deb3', 0.8), -0.95 + (i % 3 - 1) * 0.05, 0.98 + Math.floor(i / 3) * 0.05, 0.02, g, 1, 0.4, 1);
    for (const x of [-0.4, 0.4]) cyl(0.05, 0.045, 0.08, new THREE.MeshStandardMaterial({ color: '#e0f2f1', transparent: true, opacity: 0.6 }), x, 0.82, 0.25, g);
    box(0.14, 0.08, 0.1, M('#fafafa'), 0.95, 0.82, 0, g); cyl(0.03, 0.03, 0.14, M('#c62828'), 0.7, 0.85, -0.05, g, 8); cyl(0.03, 0.03, 0.14, M('#3e2723'), 0.62, 0.85, -0.05, g, 8);
    // hidangan (muncul saat pesan "hidang")
    const hid = new THREE.Group(); hid.visible = false; g.add(hid); let k = 0;
    for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++) plate(hid, -0.75 + i * 0.25, 0.79, (r - 0.5) * 0.24, LAUK_KEYS[(k++) % LAUK_KEYS.length]);
    for (const s of [-1, 1]) for (const x of [-0.6, 0, 0.6]) { plate(hid, x, 0.79, s * 0.3, null, true); sph(0.06, M('#fbfbf5', 0.8), x, 0.82, s * 0.3, hid, 1, 0.5, 1); }
    Pp.hidang = hid;
  } else if (obj.type === 'padangKasir') {
    box(1.0, 0.95, 0.6, M('#6b3a1f', 0.6), 0, 0.475, 0, g); box(1.05, 0.04, 0.65, M('#e8e2d6'), 0, 0.97, 0, g);
    box(0.3, 0.2, 0.25, M('#263238'), -0.2, 1.1, -0.05, g); box(0.18, 0.02, 0.12, M('#90a4ae'), 0.25, 1.0, 0.1, g);
    cyl(0.09, 0.09, 0.2, M('#fbc02d'), 0.3, 1.08, -0.15, g, 12);
    for (let i = 0; i < 6; i++) box(0.12, 0.3, 0.02, M(['#e53935', '#fdd835', '#43a047'][i % 3]), -0.45 + i * 0.18, 1.3, -0.29, g);
  } else if (obj.type === 'padangSink') {
    box(0.7, 0.85, 0.45, M('#eceff1', 0.3), 0, 0.425, 0, g); cyl(0.2, 0.16, 0.1, M('#fafafa', 0.2), 0, 0.9, 0, g, 16);
    box(0.5, 0.6, 0.02, M('#dfe9ef', 0.1, 0.9), 0, 1.45, -0.21, g); cyl(0.02, 0.02, 0.2, M('#b0bec5', 0.3, 0.9), 0, 1.0, -0.15, g, 8);
    box(0.12, 0.18, 0.08, M('#4fc3f7'), 0.25, 0.95, -0.1, g);
  }
  g.traverse((o) => { if (o.isMesh) { o.userData.objId = obj.id; o.castShadow = true; } });
  g.userData = { objId: obj.id, type: obj.type, P: Pp };
  return g;
}
function glass2() { return new THREE.MeshStandardMaterial({ color: '#e0f7fa', transparent: true, opacity: 0.5 }); }
export function updatePadang(F, game, night, t, dt) {
  if (!F) return; const W = game.hh.world; const open = ((W.time % 1440) / 60) >= 7 && ((W.time % 1440) / 60) < 22;
  F.fans.forEach((f) => { f.rotation.y += dt * (open ? 7 : 0.3); });
  for (const L of F.lights) { if (L.isLight) L.intensity = open ? (night ? 3 : 1.2) : 0; else if (L.material) L.material.emissiveIntensity = open ? 1 : 0.05; }
  for (const s of F.signs) s.material.emissiveIntensity = night ? 0.5 : 0;
  F.steam.forEach((s, i) => { const k = (t * 0.5 + i / 3) % 1; s.position.y = 1.2 + k * 0.9; s.material.opacity = open ? 0.3 * (1 - k) : 0; s.scale.setScalar(0.7 + k); });
  for (const o of W.objects) {
    if (o.type !== 'padangTable' && o.type !== 'padangCounter') continue; const g = game.objMeshes.get(o.id); if (!g) continue; const Pp = g.userData.P || {};
    if (Pp.hidang) Pp.hidang.visible = !!(o.s && o.s.hidang > W.time);
    if (Pp.rice) { const k = (t * 0.6) % 1; Pp.rice.position.y = 1.35 + k * 0.5; Pp.rice.material.opacity = 0.3 * (1 - k); }
  }
}
