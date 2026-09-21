// ============================================================
//  LANTAI 2 — tangga, lantai, dinding, perpustakaan
// ============================================================
import * as THREE from 'three';
import { TYPES, BUY_CATS, HOUSE, PI } from './data.js';
import { INTER } from './interactions.js';

export const LVL_H = 3.0;
// tangga menempel dinding dalam (z=0) di ruang keluarga, naik ke arah -x
export const STAIR = { x0: 0.45, x1: -2.4, z: 0.6, zMin: 0.08, zMax: 1.12, bottom: { x: 0.95, z: 0.6 }, top: { x: -2.95, z: 0.6 } };
export const HOLE = { minX: -2.45, maxX: 0.5, minZ: 0.0, maxZ: 1.2 };

// ---------- tipe benda perpustakaan ----------
const FR = (az) => ({ ax: 0, az, yaw: PI });
const seat4 = [
  { ax: -0.45, az: 1.05, px: -0.45, pz: 0.62, yaw: PI, seat: 0.46 }, { ax: 0.45, az: 1.05, px: 0.45, pz: 0.62, yaw: PI, seat: 0.46 },
  { ax: -0.45, az: -1.05, px: -0.45, pz: -0.62, yaw: 0, seat: 0.46 }, { ax: 0.45, az: -1.05, px: 0.45, pz: -0.62, yaw: 0, seat: 0.46 },
];
Object.assign(TYPES, {
  libShelf: { name: 'Rak Buku Perpustakaan', cat: 'pustaka', price: 2500000, w: 2.0, d: 0.45, spots: [FR(0.75)], acts: ['browseLib'] },
  readTable: { name: 'Meja Baca Lampu Hijau', cat: 'pustaka', price: 3200000, w: 1.8, d: 0.9, spots: seat4, acts: ['readLib'] },
  globe: { name: 'Bola Dunia Antik', cat: 'pustaka', price: 1200000, w: 0.6, d: 0.6, spots: [FR(0.7)], acts: ['spinGlobe'] },
});
if (!BUY_CATS.find((c) => c.id === 'pustaka')) BUY_CATS.push({ id: 'pustaka', label: 'Perpustakaan' });

const read = (dur) => ({ anim: 'sitRead', prop: 'book', dur, eff: { fun: 0.5 } });
Object.assign(INTER, {
  browseLib: { label: 'Pilih & baca buku…', icon: '📚', ui: 'library',
    build: (c) => ({ steps: [
      { target: { obj: c.obj.id }, anim: 'grab', dur: 2, prop: 'book' },
      { target: { type: ['readTable', 'armchair', 'sofa'], kind: 'seat', near: c.obj }, walkProp: 'book', ...read(50), fallbackHere: 'read', label: `Membaca ${c.book ? '“' + c.book.title + '”' : 'buku'}`,
        onTick: (x, gm) => x.sim.xp((c.book && c.book.skill) || 'logika', gm * 0.45), onDone: (x) => { x.g.goal('read'); if (c.book && c.book.help) x.sim.mood('peduli'); if (c.book) x.g.easter && x.g.easter('baca', { book: c.book, sim: x.sim }); } },
    ] }) },
  readLib: { label: 'Duduk & baca buku', icon: '📖', ui: 'library',
    build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'seat' }, ...read(50), label: `Membaca ${c.book ? '“' + c.book.title + '”' : 'buku'}`,
      onTick: (x, gm) => x.sim.xp((c.book && c.book.skill) || 'logika', gm * 0.45), onDone: (x) => { x.g.goal('read'); if (c.book && c.book.help) x.sim.mood('peduli'); if (c.book) x.g.easter && x.g.easter('baca', { book: c.book, sim: x.sim }); } }] }) },
  spinGlobe: { label: 'Putar bola dunia', icon: '🌍', build: (c) => ({ steps: [{ target: { obj: c.obj.id }, anim: 'grab', dur: 5, eff: { fun: 1 }, onTick: (x, gm) => x.sim.xp('logika', gm * 0.3) }] }) },
});

// isi perpustakaan lantai 2 [type, x, z, rot]
export const LIB_OBJECTS = [
  ['libShelf', -6.9, -5.7, 0], ['libShelf', -4.7, -5.7, 0], ['libShelf', -2.5, -5.7, 0], ['libShelf', -0.3, -5.7, 0],
  ['libShelf', 1.9, -5.7, 0], ['libShelf', 4.1, -5.7, 0], ['libShelf', 6.3, -5.7, 0],
  ['libShelf', -7.72, -3.1, 1], ['libShelf', -7.72, 3.2, 1], ['libShelf', 7.72, -3.1, 3], ['libShelf', 7.72, 1.0, 3], ['libShelf', 7.72, 3.4, 3],
  ['libShelf', -5.6, 5.7, 2], ['libShelf', 2.6, 5.7, 2], ['libShelf', 4.8, 5.7, 2],
  ['readTable', -4.2, -2.3, 0], ['readTable', 2.8, -2.4, 0], ['readTable', 4.4, 2.6, 1],
  ['armchair', -6.4, 1.6, 1], ['armchair', -6.4, 3.6, 1], ['floorLamp', -7.2, 0.3, 0], ['globe', -4.3, 3.2, 0],
  ['plantPot', -0.6, 5.4, 0], ['plantPot', 7.4, -5.2, 0], ['sofa', -1.6, 3.6, 2],
];

// ---------- tekstur kecil ----------
function tex(draw, w = 256, h = 256, rep = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 4; return t;
}
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.8, ...o });
function box(w, h, d, m, x, y, z, parent) { const k = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); k.position.set(x, y, z); k.castShadow = true; k.receiveShadow = true; parent.add(k); return k; }

// ---------- bangun lantai 2 + tangga ----------
export function buildFloor2(scene, W) {
  const F = new THREE.Group(); F.name = 'lantai2'; scene.add(F);
  const parquet = tex((g, w, h) => {
    for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 64) { const o = (y / 32) % 2 ? 32 : 0; g.fillStyle = `hsl(${24 + Math.random() * 6},${38 + Math.random() * 10}%,${30 + Math.random() * 8}%)`; g.fillRect(x + o - 64, y, 64, 32); g.fillRect(x + o, y, 64, 32); g.strokeStyle = 'rgba(0,0,0,.25)'; g.strokeRect(x + o, y, 64, 32); }
  }, 256, 256, 5);
  const floorM = std({ map: parquet, roughness: 0.55 }), ceilM = std({ color: '#f1ece2' }), wallM = std({ color: '#efe6d4' }), trimM = std({ color: '#6b4a2e' });
  // pelat lantai dengan lubang tangga
  const T = 0.16, y = LVL_H;
  const slab = (minX, maxX, minZ, maxZ) => {
    const k = box(maxX - minX, T, maxZ - minZ, floorM, (minX + maxX) / 2, y - T / 2, (minZ + maxZ) / 2, F);
    const c = box(maxX - minX, 0.02, maxZ - minZ, ceilM, (minX + maxX) / 2, y - T - 0.01, (minZ + maxZ) / 2, F); c.castShadow = false;
    return k;
  };
  const X0 = HOUSE.minX, X1 = HOUSE.maxX, Z0 = HOUSE.minZ, Z1 = HOUSE.maxZ;
  slab(X0, X1, Z0, HOLE.minZ); slab(X0, X1, HOLE.maxZ, Z1); slab(X0, HOLE.minX, HOLE.minZ, HOLE.maxZ); slab(HOLE.maxX, X1, HOLE.minZ, HOLE.maxZ);
  // karpet besar
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.8), std({ map: tex((g, w, h) => { g.fillStyle = '#6e1f2a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d9b36a'; g.lineWidth = 8; g.strokeRect(14, 14, w - 28, h - 28); g.lineWidth = 3; g.strokeRect(30, 30, w - 60, h - 60); for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(w / 2, h / 2, 16 + i * 14, 0, PI * 2); g.stroke(); } }), roughness: 0.95 }));
  rug.rotation.x = -PI / 2; rug.position.set(-3.2, y + 0.006, 3.0); rug.receiveShadow = true; F.add(rug);
  // dinding luar lantai 2 (bisa dipotong seperti lantai 1)
  const glass = W.glassMat;
  const H2 = 2.8, t = 0.15;
  const walls = [
    { a: [X0, Z1], b: [X1, Z1], n: [0, 1], win: [-5.5, -1.5, 2.5, 5.8] },
    { a: [X0, Z0], b: [X1, Z0], n: [0, -1], win: [-5.8, -1.4, 3, 6] },
    { a: [X0, Z0], b: [X0, Z1], n: [-1, 0], win: [-4.2, 0, 4.2] },
    { a: [X1, Z0], b: [X1, Z1], n: [1, 0], win: [-4.2, -1, 2.2, 4.6] },
  ];
  for (const w of walls) {
    const g = new THREE.Group(); g.position.y = y; F.add(g);
    const len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]); const cx = (w.a[0] + w.b[0]) / 2, cz = (w.a[1] + w.b[1]) / 2;
    const alongX = w.a[1] === w.b[1];
    box(alongX ? len + t : t, H2, alongX ? t : len + t, wallM, cx, H2 / 2, cz, g);
    const extras = [];
    for (const p of w.win) {
      const px = alongX ? p : cx, pz = alongX ? cz : p;
      for (const side of [-1, 1]) {
        const off = side * (t / 2 + 0.012);
        const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.25), glass); gl.position.set(px + (alongX ? 0 : off), 1.55, pz + (alongX ? off : 0));
        gl.rotation.y = alongX ? (side > 0 ? 0 : PI) : (side > 0 ? PI / 2 : -PI / 2); g.add(gl); extras.push(gl);
        const fr = box(alongX ? 1.25 : 0.04, 0.08, alongX ? 0.04 : 1.25, trimM, px + (alongX ? 0 : off), 0.9, pz + (alongX ? off : 0), g); extras.push(fr);
        const fr2 = box(alongX ? 1.25 : 0.04, 0.08, alongX ? 0.04 : 1.25, trimM, px + (alongX ? 0 : off), 2.2, pz + (alongX ? off : 0), g); extras.push(fr2);
      }
    }
    // list kayu atas & bawah
    box(alongX ? len + t : t + 0.04, 0.12, alongX ? t + 0.04 : len + t, trimM, cx, 0.06, cz, g);
    W.walls.push({ g, n: w.n, cx, cz, ext: true, lintel: false, extras, lvl: 1 });
  }
  // pagar lubang tangga
  const railM = std({ color: '#3d2a1a', roughness: 0.5 }), balM = std({ color: '#e9e2d4' });
  const rail = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0), ax = x1 !== x0;
    box(ax ? len : 0.07, 0.07, ax ? 0.07 : len, railM, (x0 + x1) / 2, y + 0.95, (z0 + z1) / 2, F);
    const n = Math.round(len / 0.14);
    for (let i = 0; i <= n; i++) box(0.035, 0.9, 0.035, balM, x0 + (x1 - x0) * i / n, y + 0.45, z0 + (z1 - z0) * i / n, F);
  };
  rail(HOLE.minX + 0.35, HOLE.maxZ + 0.03, HOLE.maxX + 0.03, HOLE.maxZ + 0.03); rail(HOLE.maxX + 0.03, HOLE.minZ + 0.05, HOLE.maxX + 0.03, HOLE.maxZ + 0.03);
  // lampu gantung
  const lights = [];
  for (const [lx, lz] of [[-4, -2.5], [3, -2.5], [-4, 3], [3.5, 3]]) {
    const L = new THREE.PointLight('#ffd9a0', 0, 7, 1.6); L.position.set(lx, y + 2.3, lz); F.add(L);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 10, 0, PI * 2, 0, PI / 2), std({ color: '#fff4dc', emissive: '#ffcf80', emissiveIntensity: 0 }));
    lamp.rotation.x = PI; lamp.position.set(lx, y + 2.62, lz); F.add(lamp);
    box(0.01, 0.2, 0.01, railM, lx, y + 2.72, lz, F);
    W.interiorLights.push({ light: L, lamp, lvl: 1 }); lights.push(L);
  }
  // tangga (bagian lantai 1, selalu terlihat)
  const S = new THREE.Group(); scene.add(S);
  const stepM = std({ color: '#7a5230', roughness: 0.6 }), riserM = std({ color: '#efe6d4' });
  const nSteps = 15, run = STAIR.x0 - STAIR.x1, rise = LVL_H / nSteps, dx = run / nSteps, wdt = STAIR.zMax - STAIR.zMin;
  for (let i = 0; i < nSteps; i++) {
    const cx = STAIR.x0 - dx * (i + 0.5), top = rise * (i + 1);
    box(dx + 0.03, 0.05, wdt, stepM, cx, top - 0.025, STAIR.z, S);
    box(0.02, rise, wdt - 0.02, riserM, STAIR.x0 - dx * i, top - rise / 2, STAIR.z, S).castShadow = false;
  }
  // tangga badan (stringer) & pegangan
  const len = Math.hypot(run, LVL_H), ang = Math.atan2(LVL_H, run);
  for (const zz of [STAIR.zMin - 0.02, STAIR.zMax + 0.02]) { const k = box(len, 0.28, 0.05, stepM, (STAIR.x0 + STAIR.x1) / 2, LVL_H / 2 - 0.12, zz, S); k.rotation.z = -ang; }
  const hr = box(len, 0.05, 0.05, railM, (STAIR.x0 + STAIR.x1) / 2, LVL_H / 2 + 0.85, STAIR.zMax + 0.03, S); hr.rotation.z = -ang;
  for (let i = 0; i <= 7; i++) { const f = i / 7; box(0.03, 0.85, 0.03, balM, STAIR.x0 - run * f, LVL_H * f + 0.42, STAIR.zMax + 0.03, S); }
  S.traverse((o) => { o.userData.stair = true; });
  // atap naik satu lantai
  if (W.roof) W.roof.position.y += LVL_H;
  W.floor2 = F; W.stairs = S;
  return F;
}

// ---------- mesh benda perpustakaan ----------
const BOOK_COLS = ['#7a2e2e', '#2e4a7a', '#2e7a5e', '#8a6a2e', '#4a2e6a', '#1f1f1f', '#b5462e', '#d9c9a0', '#3a6f8a', '#6a3a2e', '#2a5a3a', '#9a8a6a'];
export function buildLibObject(obj) {
  const g = new THREE.Group(); const wood = std({ color: '#5a3a22', roughness: 0.55 }), dark = std({ color: '#3a2415', roughness: 0.5 });
  if (obj.type === 'libShelf') {
    const W2 = 2.0, D = 0.42, H = 2.45;
    box(W2, H, 0.03, dark, 0, H / 2, -D / 2 + 0.015, g);
    for (const x of [-W2 / 2, 0, W2 / 2]) box(0.05, H, D, wood, x, H / 2, 0, g);
    const rows = 6;
    for (let r = 0; r <= rows; r++) box(W2, 0.035, D, wood, 0, 0.06 + r * (H - 0.1) / rows, 0, g);
    box(W2 + 0.1, 0.08, D + 0.06, wood, 0, H + 0.04, 0, g);
    // buku (instanced, warna per buku)
    const geo = new THREE.BoxGeometry(1, 1, 1); const mat = std({ roughness: 0.7 });
    const count = rows * 2 * 26; const inst = new THREE.InstancedMesh(geo, mat, count); let k = 0;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color();
    let seed = obj.id * 97 + 13; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let r = 0; r < rows; r++) for (const half of [-1, 1]) {
      let x = half < 0 ? -W2 / 2 + 0.05 : 0.05; const end = half < 0 ? -0.04 : W2 / 2 - 0.05;
      const baseY = 0.08 + r * (H - 0.1) / rows;
      while (x < end - 0.03 && k < count) {
        const bw = 0.025 + rnd() * 0.035, bh = 0.2 + rnd() * 0.13, lean = rnd() < 0.06 ? 0.25 : 0;
        q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), lean); s.set(bw, bh, 0.24 + rnd() * 0.08); p.set(x + bw / 2, baseY + bh / 2, 0.02); m.compose(p, q, s); inst.setMatrixAt(k, m);
        inst.setColorAt(k, col.set(BOOK_COLS[Math.floor(rnd() * BOOK_COLS.length)]).offsetHSL(0, 0, (rnd() - 0.5) * 0.12)); k++; x += bw + 0.002 + lean * 0.1;
      }
    }
    inst.count = k; inst.castShadow = true; inst.receiveShadow = true; g.add(inst);
  } else if (obj.type === 'readTable') {
    box(1.8, 0.06, 0.9, wood, 0, 0.75, 0, g);
    for (const [x, z] of [[-0.8, -0.38], [0.8, -0.38], [-0.8, 0.38], [0.8, 0.38]]) box(0.07, 0.75, 0.07, dark, x, 0.375, z, g);
    const green = std({ color: '#1f6b45', emissive: '#0a3d20', emissiveIntensity: 0.3, roughness: 0.3, metalness: 0.3 });
    for (const x of [-0.45, 0.45]) {
      box(0.02, 0.28, 0.02, std({ color: '#c9a44a', metalness: 0.8, roughness: 0.3 }), x, 0.92, 0, g);
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.13, 0.1, 16, 1, true, 0, PI), green); sh.rotation.z = PI / 2; sh.rotation.y = PI / 2; sh.position.set(x, 1.06, 0); g.add(sh);
    }
    for (const [x, z, r] of [[-0.45, 0.62, 0], [0.45, 0.62, 0], [-0.45, -0.62, PI], [0.45, -0.62, PI]]) {
      const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = r; g.add(c);
      box(0.44, 0.05, 0.42, wood, 0, 0.45, 0, c); box(0.44, 0.5, 0.04, wood, 0, 0.72, 0.2, c);
      for (const [a, b] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) box(0.04, 0.45, 0.04, dark, a, 0.225, b, c);
    }
    box(0.22, 0.04, 0.3, std({ color: '#b5462e' }), -0.1, 0.8, -0.1, g); box(0.2, 0.03, 0.28, std({ color: '#2e4a7a' }), 0.3, 0.795, 0.12, g);
  } else if (obj.type === 'globe') {
    box(0.4, 0.04, 0.4, dark, 0, 0.02, 0, g);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.7, 10), std({ color: '#c9a44a', metalness: 0.8, roughness: 0.3 })); leg.position.y = 0.37; g.add(leg);
    const mapT = tex((c, w, h) => { c.fillStyle = '#d9c7a0'; c.fillRect(0, 0, w, h); c.fillStyle = '#8a6a3e'; for (let i = 0; i < 16; i++) { c.beginPath(); c.ellipse(Math.random() * w, h * 0.2 + Math.random() * h * 0.6, 10 + Math.random() * 30, 8 + Math.random() * 22, Math.random() * 3, 0, PI * 2); c.fill(); } c.strokeStyle = 'rgba(80,50,20,.4)'; for (let x = 0; x < w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } }, 256, 128);
    const sp = new THREE.Mesh(new THREE.SphereGeometry(0.25, 28, 20), std({ map: mapT, roughness: 0.5 })); sp.position.y = 0.95; sp.rotation.z = 0.4; g.add(sp);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.012, 8, 40, PI * 1.4), std({ color: '#c9a44a', metalness: 0.8, roughness: 0.3 })); ring.position.y = 0.95; ring.rotation.set(0, PI / 2, 0.4); g.add(ring);
    g.userData.P = { spin: sp };
  }
  g.traverse((o) => { if (o.isMesh) o.userData.objId = obj.id; });
  g.userData = { objId: obj.id, type: obj.type, P: g.userData.P || {} };
  return g;
}
export const isLibType = (t) => ['libShelf', 'readTable', 'globe'].includes(t);
