// Pembangun dunia 3D: perumahan, rumah, furnitur, pencahayaan
import * as THREE from 'three';
import { WALLS, WINDOWS, DOORS, ROOMS, FENCES, TREES, HOUSE, TYPES, PI } from './data.js';
import { SimModel } from './sim.js';

// ---------- util ----------
const matCache = new Map();
export function M(color, rough = 0.8, metal = 0, extra = {}) {
  const { unique, ...rest } = extra;
  const key = color + '|' + rough + '|' + metal + '|' + JSON.stringify(rest);
  if (!unique && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...rest });
  if (!unique) matCache.set(key, m);
  return m;
}
export function box(w, h, d, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  if (parent) parent.add(m); return m;
}
function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, parent, seg = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  if (parent) parent.add(m); return m;
}
function sph(r, mat, x = 0, y = 0, z = 0, parent, ws = 14, hs = 10) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  if (parent) parent.add(m); return m;
}
function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

// ---------- tekstur prosedural ----------
function canvasTex(size, draw, rep = [1, 1]) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
const TEX = {};
function makeTextures() {
  const r = rng(7);
  TEX.grass = canvasTex(256, (g, s) => {
    g.fillStyle = '#5d8f3e'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 5000; i++) {
      const v = r(); g.fillStyle = v < 0.33 ? '#4f7f33' : v < 0.66 ? '#6ea049' : '#7cae55';
      g.fillRect(r() * s, r() * s, 1.5, 3 + r() * 3);
    }
  }, [60, 60]);
  TEX.lawn = canvasTex(256, (g, s) => {
    g.fillStyle = '#679c44'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 6000; i++) { const v = r(); g.fillStyle = v < 0.4 ? '#5a8f3a' : v < 0.8 ? '#74aa4f' : '#86b95f'; g.fillRect(r() * s, r() * s, 1.3, 3 + r() * 3); }
  }, [8, 8]);
  TEX.asphalt = canvasTex(256, (g, s) => {
    g.fillStyle = '#3d3f43'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 9000; i++) { const v = 45 + r() * 40; g.fillStyle = `rgb(${v},${v},${v + 3})`; g.fillRect(r() * s, r() * s, 1.2, 1.2); }
  }, [40, 2]);
  TEX.paving = canvasTex(256, (g, s) => {
    g.fillStyle = '#8f8a82'; g.fillRect(0, 0, s, s);
    const bw = 64, bh = 32;
    for (let y = 0; y < s; y += bh) for (let x = -bw; x < s; x += bw) {
      const off = (y / bh) % 2 ? bw / 2 : 0; const v = 150 + r() * 30;
      g.fillStyle = `rgb(${v},${v - 8},${v - 18})`; g.fillRect(x + off + 2, y + 2, bw - 4, bh - 4);
    }
  }, [4, 4]);
  const wood = (base, dark) => canvasTex(512, (g, s) => {
    g.fillStyle = base; g.fillRect(0, 0, s, s);
    const pw = s / 6;
    for (let i = 0; i < 6; i++) {
      const off = r() * s;
      for (let y = -s; y < s * 2; y += s * 0.75) { g.fillStyle = dark; g.fillRect(i * pw, y + off, pw, 2); }
      g.fillStyle = dark; g.fillRect(i * pw, 0, 2, s);
      g.globalAlpha = 0.18;
      for (let k = 0; k < 30; k++) { g.fillStyle = r() > 0.5 ? dark : '#ffffff'; g.fillRect(i * pw + r() * pw, 0, 1, s); }
      g.globalAlpha = 1;
    }
  }, [2, 2]);
  TEX.wood = wood('#b07a4a', '#7a5030');
  TEX.wood2 = wood('#8c5a3a', '#5c3a22');
  const tile = (base, grout, n) => canvasTex(256, (g, s) => {
    g.fillStyle = grout; g.fillRect(0, 0, s, s); const t = s / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = r() * 12 - 6; g.fillStyle = shade(base, v); g.fillRect(x * t + 2, y * t + 2, t - 4, t - 4);
    }
  }, [3, 3]);
  TEX.tile = tile('#e6ddd0', '#b8ad9e', 4);
  TEX.bath = tile('#cfe3e6', '#9fb8bb', 8);
  TEX.roof = canvasTex(256, (g, s) => {
    g.fillStyle = '#8a3b24'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 16) for (let x = 0; x < s; x += 24) {
      const off = (y / 16) % 2 ? 12 : 0; const v = r() * 20 - 10;
      g.fillStyle = shade('#a5492c', v); g.beginPath(); g.ellipse(x + off + 12, y + 10, 11, 8, 0, 0, PI); g.fill();
    }
  }, [6, 6]);
  TEX.brick = canvasTex(128, (g, s) => {
    g.fillStyle = '#9e9486'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 16) for (let x = -32; x < s; x += 32) { const off = (y / 16) % 2 ? 16 : 0; g.fillStyle = shade('#b25a3c', r() * 20 - 10); g.fillRect(x + off + 1, y + 1, 30, 14); }
  }, [6, 1]);
}
function shade(hex, v) {
  const n = parseInt(hex.slice(1), 16);
  const c = (x) => Math.max(0, Math.min(255, x + v));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

// ---------- lingkungan ----------
export function buildWorld(scene, quality) {
  makeTextures();
  const W = { walls: [], windows: [], interiorLights: [], streetLamps: [], glass: [], anim: [] };

  // langit & cahaya
  scene.background = new THREE.Color('#9fd3ee');
  scene.fog = new THREE.Fog('#b9dff0', 60, 190);
  const hemi = new THREE.HemisphereLight('#dff2ff', '#5b6b3a', 0.9); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff3dc', 2.4);
  sun.castShadow = quality.shadows;
  sun.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
  const sc = sun.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 120;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  scene.add(sun); scene.add(sun.target);
  W.hemi = hemi; W.sun = sun;

  // tanah
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ map: TEX.grass, roughness: 1 }));
  ground.rotation.x = -PI / 2; ground.receiveShadow = true; ground.userData.ground = true; scene.add(ground);
  W.ground = ground;
  const lotLawn = new THREE.Mesh(new THREE.PlaneGeometry(26, 22), new THREE.MeshStandardMaterial({ map: TEX.lawn, roughness: 1 }));
  lotLawn.rotation.x = -PI / 2; lotLawn.position.y = 0.004; lotLawn.receiveShadow = true; lotLawn.userData.ground = true; scene.add(lotLawn);

  const flat = (w, d, mat, x, z, y = 0.008) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -PI / 2; m.position.set(x, y, z); m.receiveShadow = true; m.userData.ground = true; scene.add(m); return m;
  };
  // jalan & trotoar
  flat(200, 6, new THREE.MeshStandardMaterial({ map: TEX.asphalt, roughness: 0.95 }), 0, 16, 0.01);
  const pav = TEX.paving.clone(); pav.repeat.set(80, 1); pav.needsUpdate = true;
  flat(200, 1.8, new THREE.MeshStandardMaterial({ map: pav, roughness: 0.9 }), 0, 12.1, 0.012);
  flat(200, 1.8, new THREE.MeshStandardMaterial({ map: pav, roughness: 0.9 }), 0, 19.9, 0.012);
  for (let x = -98; x < 100; x += 6) box(3, 0.01, 0.15, M('#f2efe4', 0.6), x, 0.02, 16).castShadow = false;
  box(200, 0.15, 0.2, M('#b8b3a8'), 0, 0.075, 13);
  box(200, 0.15, 0.2, M('#b8b3a8'), 0, 0.075, 19);
  // selokan
  box(200, 0.02, 0.35, M('#4b5a52', 0.3), 0, 0.005, 11.25);
  // jalan masuk & setapak
  const drive = TEX.paving.clone(); drive.repeat.set(1.5, 5); drive.needsUpdate = true;
  flat(3, 12.7, new THREE.MeshStandardMaterial({ map: drive, roughness: 0.9 }), 11, 4.85, 0.014);
  const pathT = TEX.paving.clone(); pathT.repeat.set(1, 2.5); pathT.needsUpdate = true;
  flat(1.8, 5, new THREE.MeshStandardMaterial({ map: pathT, roughness: 0.9 }), -4, 8.6, 0.014);
  // teras
  box(4.4, 0.08, 1.3, M('#c9b9a4', 0.7), -4, 0.04, 6.7);
  // lantai rumah
  for (const r of ROOMS) {
    const t = TEX[r.floor].clone(); t.repeat.set((r.maxX - r.minX) / 2, (r.maxZ - r.minZ) / 2); t.needsUpdate = true;
    const f = flat(r.maxX - r.minX, r.maxZ - r.minZ, new THREE.MeshStandardMaterial({ map: t, roughness: 0.55 }), (r.minX + r.maxX) / 2, (r.minZ + r.maxZ) / 2, 0.02);
    f.userData.room = r.name;
    const pl = new THREE.PointLight('#ffd9a0', 0, 9, 1.6); pl.position.set(r.light[0], 2.5, r.light[1]); scene.add(pl);
    const lamp = cyl(0.22, 0.26, 0.06, M('#fff6de', 0.4, 0, { emissive: '#ffdca0', emissiveIntensity: 0 }), r.light[0], 2.77, r.light[1], scene);
    lamp.castShadow = false;
    W.interiorLights.push({ light: pl, lamp });
  }

  // dinding
  const wallExt = M('#efe8da', 0.9), wallIn = M('#f6f1e6', 0.9), trim = M('#7d6a55', 0.7);
  const allWalls = WALLS.map((w) => ({ ...w, h: HOUSE.wallH, y0: 0 }));
  for (const d of DOORS) {
    // ambang atas pintu
    const half = 0.5;
    const a = d.axis === 'x' ? [d.x - half, d.z] : [d.x, d.z - half];
    const b = d.axis === 'x' ? [d.x + half, d.z] : [d.x, d.z + half];
    const n = d.axis === 'x' ? [0, 1] : [1, 0];
    allWalls.push({ a, b, ext: !!d.ext, n, h: HOUSE.wallH - 2.15, y0: 2.15, lintel: true });
  }
  for (const w of allWalls) {
    const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1];
    const len = Math.hypot(dx, dz) + (w.lintel ? 0 : HOUSE.wallT);
    const g = new THREE.Group();
    const mat = w.ext ? wallExt : wallIn;
    const m = box(len, w.h, HOUSE.wallT, mat, 0, w.h / 2, 0, g);
    g.position.set((w.a[0] + w.b[0]) / 2, w.y0, (w.a[1] + w.b[1]) / 2);
    g.rotation.y = -Math.atan2(dz, dx);
    // plint bawah
    if (!w.lintel) box(len + 0.01, 0.1, HOUSE.wallT + 0.02, trim, 0, 0.05, 0, g);
    scene.add(g);
    W.walls.push({ g, m, w, ext: w.ext, cx: g.position.x, cz: g.position.z, n: w.n, lowered: false, lintel: !!w.lintel, extras: [] });
  }
  // jendela
  const glassMat = new THREE.MeshStandardMaterial({ color: '#9cc9e0', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.45, emissive: '#ffcf80', emissiveIntensity: 0 });
  W.glassMat = glassMat;
  const frameMat = M('#ffffff', 0.5);
  for (const win of WINDOWS) {
    const wall = W.walls[win.wall];
    const dx = wall.w.b[0] - wall.w.a[0], dz = wall.w.b[1] - wall.w.a[1];
    const len = Math.hypot(dx, dz);
    const g = new THREE.Group();
    const lx = (win.t - 0.5) * len;
    box(win.w, 1.2, HOUSE.wallT + 0.03, glassMat, lx, 1.55, 0, g).castShadow = false;
    box(win.w + 0.1, 0.08, HOUSE.wallT + 0.08, frameMat, lx, 0.92, 0, g);
    box(win.w + 0.1, 0.08, HOUSE.wallT + 0.08, frameMat, lx, 2.18, 0, g);
    box(0.07, 1.3, HOUSE.wallT + 0.08, frameMat, lx - win.w / 2, 1.55, 0, g);
    box(0.07, 1.3, HOUSE.wallT + 0.08, frameMat, lx + win.w / 2, 1.55, 0, g);
    box(0.05, 1.2, HOUSE.wallT + 0.07, frameMat, lx, 1.55, 0, g);
    g.position.copy(wall.g.position); g.rotation.copy(wall.g.rotation);
    scene.add(g); wall.extras.push(g);
  }
  // kusen pintu & daun pintu utama
  for (const d of DOORS) {
    const g = new THREE.Group(); g.position.set(d.x, 0, d.z); if (d.axis === 'z') g.rotation.y = PI / 2;
    const fm = M('#6b4a30', 0.6);
    box(0.08, 2.15, HOUSE.wallT + 0.06, fm, -0.52, 1.075, 0, g); box(0.08, 2.15, HOUSE.wallT + 0.06, fm, 0.52, 1.075, 0, g);
    box(1.12, 0.08, HOUSE.wallT + 0.06, fm, 0, 2.15, 0, g);
    const leaf = box(0.95, 2.05, 0.05, M(d.main ? '#5a3a22' : '#a07850', 0.6), 0, 1.03, 0);
    const hinge = new THREE.Group(); hinge.position.set(-0.48, 0, d.main ? 0.04 : -0.04); leaf.position.x = 0.475; hinge.add(leaf);
    hinge.rotation.y = d.main ? -1.45 : 1.45; g.add(hinge);
    scene.add(g);
    const wall = W.walls.find((x) => x.lintel && Math.abs(x.cx - d.x) < 0.01 && Math.abs(x.cz - d.z) < 0.01);
    if (wall) wall.extras.push(g);
  }
  // atap
  const roof = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(12.4, 3.2, 4, 1), new THREE.MeshStandardMaterial({ map: TEX.roof, roughness: 0.8, flatShading: true }));
  cone.rotation.y = PI / 4; cone.scale.set(17.8 / 17.54, 1, 13.8 / 17.54); cone.position.y = HOUSE.wallH + 1.6; cone.castShadow = true;
  roof.add(cone);
  box(17.8, 0.12, 13.8, M('#f3eee4'), 0, HOUSE.wallH + 0.02, 0, roof);
  scene.add(roof); roof.visible = false; W.roof = roof;

  // carport
  const cp = new THREE.Group();
  for (const [x, z] of [[9.4, -1.3], [12.6, -1.3], [9.4, 6.3], [12.6, 6.3]]) box(0.14, 2.6, 0.14, M('#3a3d42', 0.4, 0.6), x, 1.3, z, cp);
  const cpRoof = box(3.6, 0.06, 8, new THREE.MeshStandardMaterial({ color: '#cfe6ec', roughness: 0.3, transparent: true, opacity: 0.55 }), 11, 2.62, 2.5, cp);
  cpRoof.castShadow = false; scene.add(cp); W.carportRoof = cpRoof;

  // pagar
  buildFences(scene, W);
  // pohon
  for (const [x, z] of TREES) buildTree(scene, x, z, 1 + ((x * 13 + z * 7) % 3) * 0.08);
  // rumput tinggi (instanced)
  buildGrassTufts(scene, W);
  // perumahan
  buildNeighborhood(scene, W);
  // hujan
  const rainGeo = new THREE.BufferGeometry(); const N = quality.low ? 900 : 2200; const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 50; pos[i * 3 + 1] = Math.random() * 25; pos[i * 3 + 2] = (Math.random() - 0.5) * 50; }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: '#cfe3f5', size: 0.07, transparent: true, opacity: 0.7 }));
  rain.visible = false; scene.add(rain); W.rain = rain;
  // awan
  W.clouds = [];
  for (let i = 0; i < 9; i++) {
    const c = new THREE.Group();
    for (let k = 0; k < 4; k++) sph(3 + Math.random() * 2, M('#ffffff', 1, 0, { transparent: true, opacity: 0.92 }), k * 3.2 - 5, Math.random(), Math.random() * 2, c).castShadow = false;
    c.position.set(-150 + i * 38, 45 + Math.random() * 12, -90 + Math.random() * 60); c.scale.y = 0.45; scene.add(c); W.clouds.push(c);
  }
  // gerobak tukang sayur
  W.vendor = buildVendor(scene);
  return W;
}

function buildFences(scene, W) {
  const brick = new THREE.MeshStandardMaterial({ map: TEX.brick, roughness: 0.9 });
  const wallM = M('#dcd3c3', 0.95), barM = M('#22252a', 0.4, 0.6);
  const bars = [];
  for (const f of FENCES) {
    const dx = f.b[0] - f.a[0], dz = f.b[1] - f.a[1], len = Math.hypot(dx, dz);
    const front = Math.abs(f.a[1] - 11) < 0.01 && Math.abs(f.b[1] - 11) < 0.01;
    const g = new THREE.Group(); g.position.set((f.a[0] + f.b[0]) / 2, 0, (f.a[1] + f.b[1]) / 2); g.rotation.y = -Math.atan2(dz, dx);
    if (front) {
      box(len, 0.55, 0.22, brick, 0, 0.275, 0, g);
      box(len, 0.05, 0.26, M('#8f8a82'), 0, 0.58, 0, g);
      box(len, 0.05, 0.05, barM, 0, 1.35, 0, g);
      for (let t = -len / 2 + 0.12; t < len / 2; t += 0.14) bars.push([g, t]);
      for (let t = -len / 2; t <= len / 2 + 0.01; t += Math.max(1, len / Math.ceil(len / 2.5))) box(0.24, 1.45, 0.26, wallM, t, 0.725, 0, g);
    } else {
      box(len, 1.7, 0.18, wallM, 0, 0.85, 0, g);
      box(len, 0.06, 0.24, M('#b5aa98'), 0, 1.73, 0, g);
    }
    scene.add(g);
  }
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.025, 0.75, 0.025), barM, bars.length);
  const mm = new THREE.Matrix4(), v = new THREE.Vector3();
  bars.forEach(([g, t], i) => { g.updateMatrixWorld(); v.set(t, 0.97, 0).applyMatrix4(g.matrixWorld); mm.makeRotationY(g.rotation.y); mm.setPosition(v); inst.setMatrixAt(i, mm); });
  inst.castShadow = true; scene.add(inst);
}

export function buildTree(scene, x, z, s = 1, kind = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s);
  cyl(0.14, 0.22, 2.4, M('#6b4a32', 0.9), 0, 1.2, 0, g, 8);
  const leaf = [M('#3f7a35', 0.85, 0, { flatShading: true }), M('#4b8a3c', 0.85, 0, { flatShading: true }), M('#356b2d', 0.85, 0, { flatShading: true })];
  const r = rng(Math.abs(Math.round(x * 100 + z * 7)) + 3);
  if (kind === 1) { // pohon palem
    g.children[0].scale.set(0.7, 2, 0.7); g.children[0].position.y = 2.4;
    for (let i = 0; i < 7; i++) { const l = box(0.4, 0.05, 2.4, leaf[i % 3], 0, 4.8, 0, g); l.rotation.set(0.5, (i / 7) * PI * 2, 0); l.position.set(Math.sin(i / 7 * PI * 2) * 1, 4.6, Math.cos(i / 7 * PI * 2) * 1); }
  } else {
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 + r() * 0.6, 1), leaf[i % 3]);
      m.position.set((r() - 0.5) * 1.8, 2.7 + r() * 1.3, (r() - 0.5) * 1.8); m.castShadow = true; g.add(m);
    }
  }
  scene.add(g); return g;
}

function buildGrassTufts(scene, W) {
  const pts = [];
  const r = rng(99);
  const areas = [[-12.5, 7, -5.4, 10.6], [-2.6, 7, 9.4, 10.6], [-12.5, -10.6, 12.5, -6.6], [-12.5, -6, -8.4, 6.8], [8.4, -6, 9.2, 0], [12.8, -10, 12.9, 10]];
  for (const [x0, z0, x1, z1] of areas) {
    const n = Math.floor((x1 - x0) * (z1 - z0) * 2.2);
    for (let i = 0; i < n; i++) pts.push([x0 + r() * (x1 - x0), z0 + r() * (z1 - z0), r() * PI]);
  }
  const geo = new THREE.ConeGeometry(0.06, 0.3, 4); geo.translate(0, 0.15, 0);
  const inst = new THREE.InstancedMesh(geo, M('#5f963b', 0.9), pts.length);
  inst.receiveShadow = true;
  W.tufts = { inst, pts };
  scene.add(inst);
}

function neighborHouse(scene, x, z, face, scheme) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = face;
  const wallM = M(scheme.wall, 0.9), roofM = new THREE.MeshStandardMaterial({ map: TEX.roof, color: scheme.roof, roughness: 0.8, flatShading: true });
  box(14, 3, 10, wallM, 0, 1.5, 0, g);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(10.4, 3.2, 4), roofM);
  cone.rotation.y = PI / 4; cone.scale.set(15 / 14.7, 1, 11 / 14.7); cone.position.y = 4.6; cone.castShadow = true; g.add(cone);
  const glass = M('#8fb9cf', 0.15, 0.3);
  for (const wx of [-4.5, 3, 5.3]) { box(1.4, 1.2, 0.06, glass, wx, 1.6, 5.02, g); box(1.55, 0.08, 0.1, M('#fff'), wx, 0.96, 5.05, g); }
  box(1.1, 2.1, 0.06, M(scheme.door, 0.6), -1.5, 1.05, 5.03, g);
  box(4, 0.08, 1.4, M('#c9b9a4'), -1.5, 0.04, 5.7, g);
  // pagar depan
  box(16, 0.5, 0.2, M('#b25a3c', 0.9), 0, 0.25, 9.8, g);
  for (let t = -7.8; t < 8; t += 0.3) box(0.025, 0.8, 0.025, M('#22252a', 0.4, 0.6), t, 0.9, 9.8, g).castShadow = false;
  box(16, 0.05, 0.05, M('#22252a', 0.4, 0.6), 0, 1.3, 9.8, g);
  // mobil tetangga
  if (scheme.car) { const car = buildCarMesh(scheme.car); car.position.set(5.2, 0, 7.6); car.rotation.y = PI / 2; g.add(car); }
  scene.add(g);
  buildTree(scene, x + Math.cos(face) * -6 + Math.sin(face) * 7, z + Math.cos(face) * 7, 0.95);
}

function buildNeighborhood(scene, W) {
  const schemes = [
    { wall: '#e9e3c9', roof: '#b8715a', door: '#5a3a22', car: '#c0392b' },
    { wall: '#d8e6e1', roof: '#8a6a5a', door: '#3a4a5a' },
    { wall: '#f1dcc8', roof: '#9a5a3a', door: '#6b4a30', car: '#e8e8e8' },
    { wall: '#e4e0ef', roof: '#7a5a4a', door: '#4a3a5a', car: '#2c3e50' },
    { wall: '#efe6c9', roof: '#a35a3a', door: '#5a3a22' },
    { wall: '#d9e4cf', roof: '#8a4a3a', door: '#3a2a1a', car: '#7f8c8d' },
  ];
  neighborHouse(scene, -31, 1, 0, schemes[0]);
  neighborHouse(scene, 31, 1, 0, schemes[1]);
  neighborHouse(scene, -58, 1, 0, schemes[5]);
  neighborHouse(scene, 58, 1, 0, schemes[4]);
  neighborHouse(scene, -26, 31, PI, schemes[2]);
  neighborHouse(scene, 0, 31, PI, schemes[3]);
  neighborHouse(scene, 26, 31, PI, schemes[4]);
  neighborHouse(scene, 52, 31, PI, schemes[0]);
  neighborHouse(scene, -52, 31, PI, schemes[1]);
  // lampu jalan
  for (let x = -64; x <= 64; x += 16) {
    const g = new THREE.Group(); g.position.set(x + 8, 0, 12.6);
    cyl(0.06, 0.09, 5.2, M('#5b6068', 0.4, 0.6), 0, 2.6, 0, g, 8);
    box(0.08, 0.08, 1.2, M('#5b6068', 0.4, 0.6), 0, 5.15, 0.55, g);
    const bulb = box(0.35, 0.12, 0.22, M('#fff6d8', 0.3, 0, { emissive: '#ffd27a', emissiveIntensity: 0, unique: true }), 0, 5.05, 1.1, g);
    bulb.castShadow = false;
    scene.add(g); W.streetLamps.push(bulb);
  }
  for (const x of [-8, 24]) { const pl = new THREE.PointLight('#ffd27a', 0, 22, 1.4); pl.position.set(x, 4.8, 13.8); scene.add(pl); W.streetLamps.push(pl); }
  // gapura perumahan
  const gp = new THREE.Group(); gp.position.set(-84, 0, 16);
  for (const s of [-1, 1]) box(1, 5, 1, M('#e8e1d0'), 0, 2.5, s * 4.3, gp);
  box(1.2, 1.2, 9.8, M('#2e5e4e'), 0, 5.4, 0, gp);
  const sign = makeSignTexture('Perumahan Griya Asri');
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 1), new THREE.MeshBasicMaterial({ map: sign }));
  sm.position.set(0.61, 5.4, 0); sm.rotation.y = PI / 2; gp.add(sm);
  scene.add(gp);
  // pos satpam
  const pos = new THREE.Group(); pos.position.set(-78, 0, 22);
  box(3, 2.6, 3, M('#e8e1d0'), 0, 1.3, 0, pos); box(3.6, 0.2, 3.6, M('#2e5e4e'), 0, 2.7, 0, pos);
  box(1.6, 0.8, 0.05, M('#8fb9cf', 0.15), 0, 1.6, -1.52, pos); scene.add(pos);
  // pohon & palem sepanjang jalan
  for (let x = -76; x < 80; x += 13) { if (Math.abs(x) < 16) continue; buildTree(scene, x, 21.5, 0.9, 1); }
  for (const [x, z] of [[-18, -18], [18, -20], [-40, -16], [40, -18], [-5, -24], [60, -30], [-65, -26]]) buildTree(scene, x, z, 1.2);
  // bukit di kejauhan
  const hillM = M('#6f9a6a', 1, 0, { flatShading: true });
  for (let i = 0; i < 9; i++) {
    const h = new THREE.Mesh(new THREE.ConeGeometry(30 + i * 3, 18 + (i % 3) * 8, 7), hillM);
    h.position.set(-160 + i * 40, 4, -130 - (i % 2) * 20); scene.add(h);
  }
  // taman bermain kecil di seberang
  const park = new THREE.Group(); park.position.set(-60, 0, -6);
  box(10, 0.05, 8, M('#d8c49a'), 0, 0.025, 0, park);
  for (const s of [-1, 1]) cyl(0.06, 0.06, 2.4, M('#c0392b', 0.5, 0.3), s * 1.2, 1.2, 0, park, 8);
  box(2.6, 0.08, 0.08, M('#c0392b', 0.5, 0.3), 0, 2.4, 0, park);
  scene.add(park);
}

function makeSignTexture(text) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 120;
  const g = c.getContext('2d'); g.fillStyle = '#2e5e4e'; g.fillRect(0, 0, 1024, 120);
  g.fillStyle = '#f3d27a'; g.font = 'bold 70px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 512, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function buildVendor(scene) {
  const g = new THREE.Group(); g.position.set(-7.4, 0, 12.2); g.rotation.y = PI / 2;
  box(1.6, 0.7, 0.9, M('#2f7fa0', 0.6), 0, 0.75, 0, g);
  box(1.8, 0.05, 1.1, M('#f2efe4'), 0, 2.0, 0, g);
  for (const s of [-1, 1]) for (const t of [-1, 1]) cyl(0.025, 0.025, 1.0, M('#555'), s * 0.75, 1.5, t * 0.4, g, 6);
  for (const s of [-1, 1]) cyl(0.25, 0.25, 0.06, M('#222'), s * 0.55, 0.25, 0.48, g, 14).rotation.x = PI / 2;
  const veg = ['#3e9a4e', '#d8452f', '#f0c040', '#7a4bb0', '#e87a2f'];
  for (let i = 0; i < 14; i++) sph(0.08 + (i % 3) * 0.02, M(veg[i % 5], 0.7), -0.6 + (i % 7) * 0.2, 1.15, -0.25 + Math.floor(i / 7) * 0.4, g, 8, 6);
  const npc = new SimModel('Mang Ujang', { skin: '#a86d45', hair: '#222', hairStyle: 'short', shirt: '#e2a33b', pants: '#3a3a3a', height: 0.95, dress: false });
  npc.root.position.set(1.2, 0, 0); npc.root.rotation.y = PI / 2; g.add(npc.root);
  g.userData.npc = npc;
  g.visible = false; scene.add(g); return g;
}

// ---------- mobil ----------
export function buildCarMesh(color = '#e8e8e8') {
  const g = new THREE.Group();
  const body = M(color, 0.3, 0.5, { unique: true });
  const glass = M('#243240', 0.1, 0.6), dark = M('#1b1c1f', 0.8), chrome = M('#c8ccd0', 0.2, 0.9);
  box(1.75, 0.55, 4.1, body, 0, 0.6, 0, g);
  const cab = box(1.6, 0.55, 2.2, body, 0, 1.13, -0.25, g);
  box(1.62, 0.45, 2.0, glass, 0, 1.15, -0.25, g).scale.set(1.001, 1, 1);
  const ws = box(1.5, 0.05, 0.75, glass, 0, 1.12, 0.95, g); ws.rotation.x = 0.9;
  for (const [x, z] of [[-0.82, 1.3], [0.82, 1.3], [-0.82, -1.3], [0.82, -1.3]]) {
    const w = cyl(0.34, 0.34, 0.24, dark, x, 0.34, z, g, 18); w.rotation.z = PI / 2;
    const hub = cyl(0.18, 0.18, 0.25, chrome, x, 0.34, z, g, 12); hub.rotation.z = PI / 2;
  }
  for (const s of [-1, 1]) {
    box(0.3, 0.12, 0.05, M('#fff8d8', 0.2, 0, { emissive: '#fff2c0', emissiveIntensity: 0.3 }), s * 0.6, 0.72, 2.06, g);
    box(0.3, 0.1, 0.05, M('#b01818', 0.3, 0, { emissive: '#801010', emissiveIntensity: 0.4 }), s * 0.6, 0.75, -2.06, g);
  }
  box(1.0, 0.18, 0.04, dark, 0, 0.5, 2.07, g);
  box(0.4, 0.1, 0.02, M('#f2f2f2'), 0, 0.48, -2.07, g);
  g.userData.bodyMat = body; g.userData.cab = cab;
  return g;
}

// ---------- furnitur ----------
export function buildObject(obj) {
  const T = TYPES[obj.type];
  const g = new THREE.Group();
  const P = {}; // bagian yang berubah sesuai status
  const wood = M('#8a5a3a', 0.6), woodL = M('#c49a6c', 0.6), white = M('#f4f2ee', 0.4), steel = M('#b9bec4', 0.25, 0.8), black = M('#1c1d21', 0.5);
  switch (obj.type) {
    case 'fridge': box(0.78, 1.85, 0.68, M('#dfe3e6', 0.25, 0.4), 0, 0.925, 0, g); box(0.02, 1.8, 0.01, M('#9aa2a8'), 0, 0.925, 0.345, g);
      for (const s of [-1, 1]) box(0.03, 0.5, 0.04, steel, s * 0.06, 1.1, 0.36, g); break;
    case 'stove': box(0.8, 0.9, 0.64, white, 0, 0.45, 0, g); box(0.8, 0.04, 0.66, black, 0, 0.92, 0, g);
      box(0.6, 0.35, 0.02, M('#2a2a2e', 0.2), 0, 0.45, 0.33, g);
      P.flames = [];
      for (const [x, z] of [[-0.2, -0.13], [0.2, -0.13], [-0.2, 0.15], [0.2, 0.15]]) {
        cyl(0.09, 0.09, 0.02, M('#333'), x, 0.95, z, g, 14);
        const f = cyl(0.07, 0.04, 0.05, M('#4aa0ff', 0.3, 0, { emissive: '#3a7aff', emissiveIntensity: 2, unique: true }), x, 0.97, z, g, 10); f.visible = false; P.flames.push(f);
      }
      P.pan = cyl(0.13, 0.11, 0.06, M('#2e2e30', 0.4, 0.5), -0.2, 1.0, 0.15, g, 16); P.pan.visible = false;
      P.stain = box(0.3, 0.005, 0.2, M('#3a2a1a', 1, 0, { transparent: true, opacity: 0.8 }), 0.15, 0.943, 0.05, g); P.stain.visible = false;
      box(0.8, 0.06, 0.1, M('#e4e0da'), 0, 1.0, -0.3, g); break;
    case 'counterSink': box(1.0, 0.86, 0.62, M('#e8e1d4', 0.6), 0, 0.43, 0, g); box(1.02, 0.05, 0.66, M('#4a4d52', 0.3), 0, 0.885, 0, g);
      box(0.5, 0.05, 0.4, steel, 0, 0.9, 0.02, g); cyl(0.015, 0.015, 0.3, steel, 0, 1.05, -0.22, g, 6);
      P.dishes = new THREE.Group(); g.add(P.dishes); break;
    case 'kitchenTrash': cyl(0.17, 0.15, 0.55, M('#6a8f78', 0.5), 0, 0.275, 0, g, 16); P.lid = cyl(0.175, 0.175, 0.03, M('#557563'), 0, 0.565, 0, g, 16);
      P.bag = sph(0.18, M('#222428', 0.8), 0, 0.6, 0, g, 10, 8); P.bag.visible = false; break;
    case 'diningTable': {
      box(1.6, 0.05, 0.9, woodL, 0, 0.76, 0, g);
      for (const [x, z] of [[-0.72, -0.37], [0.72, -0.37], [-0.72, 0.37], [0.72, 0.37]]) box(0.06, 0.74, 0.06, wood, x, 0.37, z, g);
      for (const [x, z, r] of [[-0.4, 0.68, PI], [0.4, 0.68, PI], [-0.4, -0.68, 0], [0.4, -0.68, 0]]) {
        const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = r; g.add(c);
        box(0.42, 0.05, 0.42, wood, 0, 0.46, 0, c); box(0.42, 0.5, 0.04, wood, 0, 0.72, 0.2, c);
        for (const [a, b] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) box(0.04, 0.45, 0.04, wood, a, 0.225, b, c);
      }
      P.plates = new THREE.Group(); g.add(P.plates); break;
    }
    case 'sofa': { const f = M('#5c7f8f', 0.95);
      box(2.1, 0.42, 0.85, f, 0, 0.21, 0, g); box(2.1, 0.55, 0.2, f, 0, 0.62, -0.33, g);
      for (const s of [-1, 1]) box(0.18, 0.55, 0.85, f, s * 0.96, 0.4, 0, g);
      for (const s of [-1, 1]) box(0.9, 0.12, 0.62, M('#6a91a3', 0.95), s * 0.45, 0.47, 0.06, g);
      box(0.35, 0.3, 0.1, M('#e2a33b', 0.95), -0.7, 0.66, -0.18, g).rotation.z = 0.2; break; }
    case 'tv': box(1.3, 0.45, 0.42, wood, 0, 0.225, 0, g);
      box(1.3, 0.76, 0.05, black, 0, 1.0, -0.05, g);
      P.screen = box(1.22, 0.68, 0.01, M('#0b0c10', 0.2, 0, { emissive: '#000000', unique: true }), 0, 1.0, -0.02, g); break;
    case 'armchair': { const f = M('#b98a52', 0.8);
      box(0.85, 0.12, 0.8, f, 0, 0.38, 0, g); box(0.85, 0.6, 0.1, f, 0, 0.7, -0.35, g);
      for (const s of [-1, 1]) box(0.08, 0.3, 0.8, f, s * 0.42, 0.55, 0, g);
      for (const [x, z] of [[-0.38, -0.35], [0.38, -0.35], [-0.38, 0.35], [0.38, 0.35]]) box(0.05, 0.36, 0.05, f, x, 0.18, z, g);
      box(0.7, 0.1, 0.65, M('#f2e8d4', 0.95), 0, 0.46, 0.04, g); break; }
    case 'rug': { const c = document.createElement('canvas'); c.width = 256; c.height = 170; const x = c.getContext('2d');
      x.fillStyle = '#7a3b2a'; x.fillRect(0, 0, 256, 170); x.strokeStyle = '#e2b25b'; x.lineWidth = 6; x.strokeRect(10, 10, 236, 150);
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#e2b25b' : '#3a2a4a'; x.beginPath(); x.arc(35 + i * 37, 35 + j * 33, 10, 0, PI * 2); x.fill(); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const r = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshStandardMaterial({ map: t, roughness: 1 })); r.rotation.x = -PI / 2; r.position.y = 0.03; r.receiveShadow = true; g.add(r); break; }
    case 'bookshelf': box(1.0, 1.9, 0.34, wood, 0, 0.95, 0, g);
      for (let s = 0; s < 4; s++) { box(0.92, 0.02, 0.3, woodL, 0, 0.3 + s * 0.45, 0.02, g);
        for (let b = 0; b < 8; b++) box(0.07 + (b % 3) * 0.02, 0.3 - (b % 4) * 0.03, 0.22, M(['#b3362f', '#2f6fb3', '#e2a33b', '#3e9a6e', '#7a4bb0', '#e8e4d8'][(b + s) % 6], 0.8), -0.38 + b * 0.105, 0.47 + s * 0.45 - (b % 4) * 0.015, 0.04, g); }
      break;
    case 'plantPot': cyl(0.2, 0.15, 0.4, M('#b2643c', 0.8), 0, 0.2, 0, g, 14); P.leaves = [];
      for (let i = 0; i < 7; i++) { const l = sph(0.2, M('#3f8a3c', 0.7, 0, { unique: true }), Math.sin(i * 2.4) * 0.18, 0.7 + (i % 3) * 0.2, Math.cos(i * 2.4) * 0.18, g, 8, 6); l.scale.set(1, 0.35, 0.7); l.rotation.set(i, i * 2, 0.4); P.leaves.push(l); }
      cyl(0.02, 0.02, 0.6, M('#4a6a2a'), 0, 0.6, 0, g, 5); break;
    case 'floorLamp': cyl(0.15, 0.17, 0.04, black, 0, 0.02, 0, g); cyl(0.02, 0.02, 1.55, black, 0, 0.8, 0, g, 6);
      P.glow = cyl(0.14, 0.2, 0.3, M('#f6ead0', 0.6, 0, { emissive: '#ffcf80', emissiveIntensity: 0, unique: true }), 0, 1.6, 0, g, 16); break;
    case 'aquarium': box(1.1, 0.7, 0.42, wood, 0, 0.35, 0, g);
      box(1.08, 0.5, 0.4, new THREE.MeshStandardMaterial({ color: '#6fc1dc', transparent: true, opacity: 0.45, roughness: 0.05, emissive: '#1a5a7a', emissiveIntensity: 0.3 }), 0, 0.96, 0, g).castShadow = false;
      box(1.0, 0.05, 0.36, M('#e3d2a4'), 0, 0.74, 0, g);
      P.fish = []; for (let i = 0; i < 4; i++) { const f = sph(0.035, M(['#e0402f', '#2f6fe0', '#f0b030', '#e060b0'][i], 0.4), 0, 0.9 + i * 0.07, 0, g, 8, 6); f.scale.set(1.8, 1, 0.6); P.fish.push(f); }
      break;
    case 'radio': box(0.5, 0.7, 0.35, black, 0, 0.35, 0, g); P.woofer = cyl(0.14, 0.14, 0.02, M('#444'), 0, 0.28, 0.18, g, 16); P.woofer.rotation.x = PI / 2;
      const tw = cyl(0.07, 0.07, 0.02, M('#444'), 0, 0.55, 0.18, g, 12); tw.rotation.x = PI / 2;
      P.led = box(0.3, 0.02, 0.01, M('#40ffa0', 0.3, 0, { emissive: '#20ff90', emissiveIntensity: 0, unique: true }), 0, 0.66, 0.18, g); break;
    case 'treadmill': box(0.8, 0.18, 1.8, M('#2a2c30'), 0, 0.09, 0, g); box(0.62, 0.02, 1.5, M('#111'), 0, 0.19, 0.1, g);
      for (const s of [-1, 1]) box(0.05, 1.1, 0.05, M('#2a2c30'), s * 0.36, 0.7, -0.75, g);
      box(0.8, 0.25, 0.1, M('#2a2c30'), 0, 1.25, -0.75, g); break;
    case 'easel': for (const s of [-1, 1]) { const l = box(0.04, 1.6, 0.04, woodL, s * 0.25, 0.8, 0, g); l.rotation.z = s * -0.12; }
      box(0.04, 1.5, 0.04, woodL, 0, 0.75, -0.3, g).rotation.x = 0.25;
      P.canvas = box(0.6, 0.5, 0.03, M('#fbf8ef', 0.9, 0, { unique: true }), 0, 1.1, 0.04, g); box(0.7, 0.04, 0.12, woodL, 0, 0.82, 0.05, g); break;
    case 'bed': box(1.8, 0.35, 2.1, wood, 0, 0.175, 0, g); box(1.8, 1.0, 0.08, wood, 0, 0.6, -1.03, g);
      box(1.72, 0.2, 2.0, white, 0, 0.44, 0.02, g);
      for (const s of [-1, 1]) box(0.62, 0.12, 0.35, M('#ffffff', 0.9), s * 0.42, 0.6, -0.78, g);
      P.blanket = box(1.76, 0.08, 1.35, M('#c96a52', 0.95), 0, 0.56, 0.34, g); break;
    case 'nightstand': box(0.45, 0.5, 0.4, wood, 0, 0.25, 0, g); cyl(0.06, 0.08, 0.2, M('#d8c7a4'), 0, 0.6, 0, g, 10);
      P.glow = cyl(0.1, 0.14, 0.16, M('#f6ead0', 0.6, 0, { emissive: '#ffcf80', emissiveIntensity: 0, unique: true }), 0, 0.77, 0, g, 12); break;
    case 'wardrobe': box(1.2, 2.0, 0.58, wood, 0, 1.0, 0, g); box(0.01, 1.9, 0.01, M('#3a2412'), 0, 1.0, 0.295, g);
      for (const s of [-1, 1]) box(0.03, 0.2, 0.03, steel, s * 0.07, 1.05, 0.31, g); break;
    case 'toilet': box(0.4, 0.4, 0.45, white, 0, 0.2, 0.08, g); box(0.42, 0.06, 0.5, white, 0, 0.42, 0.1, g);
      box(0.42, 0.45, 0.2, white, 0, 0.65, -0.24, g);
      P.stain = cyl(0.14, 0.14, 0.005, M('#8a6a2a', 1, 0, { transparent: true, opacity: 0.7 }), 0, 0.455, 0.1, g, 14); P.stain.visible = false; break;
    case 'shower': box(1, 0.08, 1, white, 0, 0.04, 0, g);
      box(0.03, 2.0, 1, new THREE.MeshStandardMaterial({ color: '#cfe8f0', transparent: true, opacity: 0.3, roughness: 0.05 }), 0.5, 1.04, 0, g).castShadow = false;
      box(1, 2.0, 0.03, new THREE.MeshStandardMaterial({ color: '#cfe8f0', transparent: true, opacity: 0.3, roughness: 0.05 }), 0, 1.04, 0.5, g).castShadow = false;
      g.children[g.children.length - 1].visible = false;
      cyl(0.015, 0.015, 0.5, steel, 0, 2.0, -0.3, g, 6).rotation.x = PI / 2; P.head = cyl(0.1, 0.1, 0.03, steel, 0, 1.98, -0.08, g, 12);
      { const wg = new THREE.BufferGeometry(); const p = new Float32Array(150 * 3); for (let i = 0; i < 150; i++) { p[i * 3] = (Math.random() - 0.5) * 0.3; p[i * 3 + 1] = Math.random() * 1.9; p[i * 3 + 2] = (Math.random() - 0.5) * 0.3 - 0.08; }
        wg.setAttribute('position', new THREE.BufferAttribute(p, 3)); P.water = new THREE.Points(wg, new THREE.PointsMaterial({ color: '#bfe6ff', size: 0.03, transparent: true, opacity: 0.8 })); P.water.visible = false; g.add(P.water); }
      break;
    case 'bathSink': box(0.6, 0.8, 0.42, M('#dfd6c8'), 0, 0.4, 0, g); box(0.5, 0.08, 0.35, white, 0, 0.84, 0.02, g);
      box(0.5, 0.6, 0.02, M('#cfe3ec', 0.05, 0.9), 0, 1.45, -0.2, g); break;
    case 'washer': box(0.62, 0.85, 0.62, white, 0, 0.425, 0, g); P.drum = cyl(0.2, 0.2, 0.02, M('#6a8aa0', 0.1, 0.5), 0, 0.45, 0.31, g, 20); P.drum.rotation.x = PI / 2;
      box(0.62, 0.08, 0.1, M('#d8dde2'), 0, 0.8, -0.26, g); break;
    case 'basket': cyl(0.23, 0.2, 0.45, M('#c9a46a', 0.9), 0, 0.225, 0, g, 12);
      P.clothes = sph(0.2, M('#8fa6c8', 0.95), 0, 0.3, 0, g, 10, 6); P.clothes.scale.y = 0.5; break;
    case 'desk': box(1.3, 0.04, 0.62, woodL, 0, 0.75, 0, g);
      for (const s of [-1, 1]) box(0.04, 0.74, 0.58, black, s * 0.62, 0.37, 0, g);
      box(0.6, 0.38, 0.03, black, 0, 1.1, -0.15, g); cyl(0.03, 0.05, 0.18, black, 0, 0.85, -0.17, g, 8);
      P.screen = box(0.56, 0.33, 0.01, M('#0b0c10', 0.2, 0, { emissive: '#000000', unique: true }), 0, 1.1, -0.13, g);
      box(0.4, 0.02, 0.14, M('#2a2c30'), 0, 0.78, 0.08, g);
      { const c = new THREE.Group(); c.position.set(0, 0, 0.58); g.add(c);
        box(0.48, 0.07, 0.46, black, 0, 0.47, 0, c); box(0.46, 0.55, 0.06, black, 0, 0.8, 0.22, c); cyl(0.03, 0.03, 0.42, steel, 0, 0.22, 0, c, 6); cyl(0.25, 0.25, 0.03, black, 0, 0.03, 0, c, 5); }
      break;
    case 'plant': box(1.3, 0.25, 0.6, M('#9e9486'), 0, 0.125, 0, g); box(1.2, 0.03, 0.5, M('#4a3322', 1), 0, 0.25, 0, g);
      P.leaves = []; const fc = ['#e0402f', '#f0b030', '#e060b0', '#ffffff', '#b050e0'];
      for (let i = 0; i < 10; i++) { const x = -0.5 + (i % 5) * 0.25, z = i < 5 ? -0.1 : 0.12;
        const st = sph(0.09, M('#3f8a3c', 0.7, 0, { unique: true }), x, 0.38, z, g, 8, 6); st.scale.y = 1.4; P.leaves.push(st);
        const fl = sph(0.055, M(fc[i % 5], 0.6, 0, { unique: true }), x, 0.52, z, g, 8, 6); P.leaves.push(fl); }
      break;
    case 'veggie': box(2.0, 0.2, 1.0, wood, 0, 0.1, 0, g); box(1.9, 0.03, 0.9, M('#4a3322', 1), 0, 0.2, 0, g);
      P.leaves = []; P.fruits = [];
      for (let i = 0; i < 8; i++) { const x = -0.75 + (i % 4) * 0.5, z = i < 4 ? -0.2 : 0.2;
        const b = sph(0.16, M('#3f8a3c', 0.7, 0, { unique: true }), x, 0.42, z, g, 8, 6); b.scale.y = 1.3; P.leaves.push(b);
        for (let k = 0; k < 3; k++) { const f = sph(0.035, M(i % 2 ? '#d8302f' : '#e84a2a', 0.5), x + Math.sin(k * 2) * 0.1, 0.4 + k * 0.08, z + Math.cos(k * 2) * 0.12, g, 6, 5); P.fruits.push(f); } }
      cyl(0.015, 0.015, 0.9, woodL, -0.95, 0.5, 0, g, 5); break;
    case 'clothesline': for (const s of [-1, 1]) cyl(0.04, 0.04, 1.8, steel, s * 1.15, 0.9, 0, g, 8);
      for (const z of [-0.08, 0.08]) cyl(0.006, 0.006, 2.3, M('#ddd'), 0, 1.75, z, g, 4).rotation.z = PI / 2;
      P.clothes = new THREE.Group(); g.add(P.clothes);
      ['#2f6fb3', '#d9577a', '#e8e4d8', '#3e9a6e', '#e2a33b', '#7a4bb0'].forEach((c, i) => {
        box(0.32, 0.5 - (i % 2) * 0.12, 0.02, M(c, 0.95, 0, { unique: true }), -0.9 + i * 0.36, 1.48 + (i % 2) * 0.06, (i % 2 ? 0.08 : -0.08), P.clothes); });
      break;
    case 'car': { const car = buildCarMesh('#e8e8e8'); g.add(car); P.car = car; break; }
    case 'mower': box(0.5, 0.25, 0.6, M('#c23b2f', 0.5), 0, 0.2, 0, g);
      for (const s of [-1, 1]) cyl(0.02, 0.02, 0.9, M('#333'), s * 0.2, 0.55, -0.35, g, 6).rotation.x = -0.8;
      for (const [x, z] of [[-0.25, -0.22], [0.25, -0.22], [-0.25, 0.22], [0.25, 0.22]]) { const w = cyl(0.08, 0.08, 0.05, black, x, 0.08, z, g, 10); w.rotation.z = PI / 2; } break;
    case 'mailbox': cyl(0.04, 0.04, 1.0, M('#333'), 0, 0.5, 0, g, 6); box(0.3, 0.26, 0.4, M('#c23b2f', 0.5, 0.2), 0, 1.1, 0, g);
      P.flag = box(0.02, 0.2, 0.08, M('#f2c230'), 0.17, 1.2, -0.1, g); break;
    case 'outdoorBin': box(0.55, 0.8, 0.55, M('#2e7d4f', 0.6), 0, 0.4, 0, g); P.lid = box(0.6, 0.05, 0.6, M('#246640', 0.6), 0, 0.82, 0, g); break;
    case 'gate': { const bar = M('#22252a', 0.4, 0.6); const gg = new THREE.Group(); gg.position.x = -0.9; gg.rotation.y = -1.3; g.add(gg);
      box(1.8, 0.05, 0.04, bar, 0.9, 1.2, 0, gg); box(1.8, 0.05, 0.04, bar, 0.9, 0.2, 0, gg);
      for (let t = 0.05; t < 1.8; t += 0.15) box(0.025, 1.0, 0.025, bar, t, 0.7, 0, gg); break; }
  }
  g.traverse((o) => { if (o.isMesh) o.userData.objId = obj.id; });
  g.userData = { objId: obj.id, type: obj.type, P };
  placeObject(g, obj);
  return g;
}

export function placeObject(g, obj) {
  g.position.set(obj.x, 0, obj.z);
  g.rotation.y = obj.rot * PI / 2;
}

const tmpC = new THREE.Color();
export function updateObjectVisual(g, obj, world, night, time) {
  const P = g.userData.P; const s = obj.s || {}; const H = world.house;
  switch (obj.type) {
    case 'tv': case 'desk': {
      const on = s.on && H.power; const m = P.screen.material;
      if (on) { const k = 0.6 + Math.sin(time * 3 + obj.id) * 0.2; m.emissive.setHSL((time * 0.05) % 1, 0.5, 0.35 * k); m.emissiveIntensity = 1.2; }
      else { m.emissive.set('#000000'); }
      break; }
    case 'stove': for (const f of P.flames) f.visible = !!s.on; P.pan.visible = !!s.on; P.stain.visible = (s.dirt || 0) >= 3; break;
    case 'diningTable': {
      const want = Math.min(4, H.dishes) + Math.min(2, H.servings) * 10;
      if (P.plates.userData.v !== want) {
        P.plates.userData.v = want; P.plates.clear();
        const spots = [[-0.4, 0.2], [0.4, 0.2], [-0.4, -0.2], [0.4, -0.2]];
        for (let i = 0; i < Math.min(4, H.dishes); i++) { const p = cyl(0.12, 0.1, 0.02, M('#e8e4d8', 0.4), spots[i][0], 0.795, spots[i][1], P.plates, 14); sph(0.03, M('#7a5a2a', 1), spots[i][0] + 0.03, 0.81, spots[i][1], P.plates, 6, 4); }
        for (let i = 0; i < Math.min(2, H.servings); i++) { const x = i ? 0.15 : -0.15; cyl(0.14, 0.11, 0.03, M('#f4f1ea', 0.3), x, 0.8, 0, P.plates, 16);
          const food = sph(0.1, M('#e8a84a', 0.7), x, 0.82, 0, P.plates, 10, 6); food.scale.y = 0.5; sph(0.04, M('#3e9a4e'), x + 0.04, 0.85, 0.02, P.plates, 6, 4); }
      }
      break; }
    case 'counterSink': {
      const n = Math.min(5, H.dishes);
      if (P.dishes.userData.v !== n) { P.dishes.userData.v = n; P.dishes.clear(); for (let i = 0; i < n; i++) cyl(0.11, 0.09, 0.02, M('#e8e4d8', 0.4), -0.05 + (i % 2) * 0.08, 0.93 + i * 0.022, 0, P.dishes, 12); }
      break; }
    case 'kitchenTrash': P.bag.visible = H.trash >= 3; P.bag.scale.setScalar(H.trash >= 5 ? 1.35 : 1); P.lid.rotation.x = H.trash >= 3 ? -0.6 : 0; break;
    case 'basket': P.clothes.visible = H.laundry > 0; P.clothes.scale.set(1, 0.3 + Math.min(4, H.laundry) * 0.25, 1); P.clothes.position.y = 0.2 + Math.min(4, H.laundry) * 0.05; break;
    case 'plantPot': case 'plant': case 'veggie': {
      const w = s.water ?? 100; const dry = Math.max(0, Math.min(1, (40 - w) / 40));
      tmpC.set('#3f8a3c').lerp(new THREE.Color('#9a7a3a'), dry);
      P.leaves.forEach((l, i) => { if (obj.type === 'plant' && i % 2) l.visible = dry < 0.6; else l.material.color.copy(tmpC); l.scale.y = (obj.type === 'plant' ? (i % 2 ? 1 : 1.4) : obj.type === 'veggie' ? 1.3 : 0.35) * (1 - dry * 0.35); });
      if (P.fruits) { const gr = s.growth || 0; P.fruits.forEach((f, i) => { f.visible = gr >= 100 ? true : (i / P.fruits.length) < gr / 140; f.material.color.set(gr >= 100 ? '#d8302f' : '#6fae3c'); }); }
      break; }
    case 'bed': if (s.made === false) { P.blanket.rotation.set(0.05, 0.25, 0.08); P.blanket.position.set(0.25, 0.6, 0.55); P.blanket.scale.set(0.85, 2.2, 0.8); }
      else { P.blanket.rotation.set(0, 0, 0); P.blanket.position.set(0, 0.56, 0.34); P.blanket.scale.set(1, 1, 1); } break;
    case 'toilet': P.stain.visible = (s.dirt || 0) >= 3; break;
    case 'shower': P.water.visible = !!s.on; if (s.on) { const a = P.water.geometry.attributes.position; for (let i = 0; i < a.count; i++) { let y = a.getY(i) - 0.05; if (y < 0.05) y = 1.9; a.setY(i, y); } a.needsUpdate = true; } break;
    case 'clothesline': P.clothes.visible = !!s.clothes; P.clothes.position.y = s.clothes === 'wet' ? -0.03 : 0; break;
    case 'car': P.car.visible = !s.away; { const d = (s.dirt || 0) / 100; P.car.userData.bodyMat.color.set('#e8e8e8').lerp(tmpC.set('#8a7a60'), d * 0.55); } break;
    case 'mailbox': P.flag.rotation.z = H.bills > 0 || H.mail ? 0 : -PI / 2; P.flag.position.y = H.bills > 0 || H.mail ? 1.3 : 1.15; break;
    case 'floorLamp': case 'nightstand': P.glow.material.emissiveIntensity = night && H.power ? 1.4 : 0; break;
    case 'radio': P.led.material.emissiveIntensity = s.on && H.power ? 2 : 0; P.woofer.scale.setScalar(s.on && H.power ? 1 + Math.abs(Math.sin(time * 9)) * 0.12 : 1); break;
    case 'aquarium': P.fish.forEach((f, i) => { const a = time * (0.5 + i * 0.15) + i * 2; f.position.x = Math.sin(a) * 0.4; f.position.z = Math.cos(a * 1.3) * 0.1; f.rotation.y = Math.cos(a) > 0 ? 0 : PI; }); break;
    case 'easel': if (s.painted) P.canvas.material.color.set('#f2cfa0'); else P.canvas.material.color.set('#fbf8ef'); break;
    case 'washer': if (s.on) P.drum.rotation.y += 0.3; break;
  }
}

// kotoran lantai
export function buildDirt(d) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CircleGeometry(0.35 + (d.id % 3) * 0.08, 18), new THREE.MeshStandardMaterial({ color: d.puddle ? '#d9c86a' : '#6a5238', transparent: true, opacity: 0.6, roughness: d.puddle ? 0.1 : 1, depthWrite: false }));
  m.rotation.x = -PI / 2; m.position.y = 0.03; m.scale.set(1, 0.7 + (d.id % 4) * 0.1, 1); g.add(m);
  for (let i = 0; i < 4; i++) { const k = new THREE.Mesh(new THREE.CircleGeometry(0.08, 8), m.material); k.rotation.x = -PI / 2; k.position.set(Math.sin(i * 2.1 + d.id) * 0.45, 0.031, Math.cos(i * 1.7 + d.id) * 0.4); g.add(k); }
  g.position.set(d.x, 0, d.z);
  g.traverse((o) => { o.userData.dirtId = d.id; });
  return g;
}
