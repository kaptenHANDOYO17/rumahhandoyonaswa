// ============================================================
//  DUNIA HIDUP SE-DESA (ringan untuk HP & laptop)
//  • Musim menyelimuti SELURUH peta: rumput, pohon, atap, bukit, gunung, jalan
//  • Warga, kendaraan, asap dapur, lampu jendela & lampu jalan di kejauhan
//  Semua memakai InstancedMesh + pewarnaan material bersama, diperbarui 5×/detik.
// ============================================================
import * as THREE from 'three';

const PI = Math.PI;
const lerp = (a, b, t) => a + (b - a) * t;
// pengelompokan material berdasarkan warna dasarnya (sekali jalan saat start)
function klasifikasi(c) {
  const h = {}; c.getHSL(h);
  if (h.l > 0.92 && h.s < 0.08) return 'putih';
  if (h.s < 0.12) return h.l < 0.35 ? 'aspal' : 'batu';
  if (h.h > 0.18 && h.h < 0.45) return 'daun';                 // hijau: rumput, pohon, bukit
  if (h.h > 0.055 && h.h <= 0.18) return 'tanah';              // kuning-cokelat: tanah, bambu, pasir
  if (h.h >= 0.95 || h.h < 0.055) return 'atap';               // merah-oranye: genteng, bata
  return 'lain';
}
const TARGET = {
  salju: { daun: ['#dfe9ef', 0.72], tanah: ['#e8eef2', 0.78], atap: ['#f2f6f8', 0.74], aspal: ['#c8d2d8', 0.55], batu: ['#eef3f6', 0.6], putih: ['#ffffff', 0.2], lain: ['#e3ebf0', 0.45] },
  gugur: { daun: ['#c9772b', 0.62], tanah: ['#9a7340', 0.35], atap: ['#8c4a2a', 0.2], aspal: ['#6b6258', 0.18], batu: ['#b9ad99', 0.2], putih: ['#f3ead6', 0.18], lain: ['#b08a52', 0.22] },
  panas: { daun: ['#a8b44a', 0.45], tanah: ['#d9c08a', 0.3], atap: ['#c9603a', 0.15], aspal: ['#8a8378', 0.12], batu: ['#efe6d2', 0.18], putih: ['#fffaf0', 0.12], lain: ['#d8c9a4', 0.15] },
  hujan: { daun: ['#2f6b3a', 0.3], tanah: ['#5c4a33', 0.3], atap: ['#6d3a2a', 0.18], aspal: ['#3f4348', 0.3], batu: ['#8f9398', 0.2], putih: ['#e8eef0', 0.15], lain: ['#5a6a55', 0.18] },
};
TARGET.panas.daun = ['#a8b44a', 0.45];

export function buildDunia(scene) {
  const D = { mats: [], t: 0, akum: 0, grup: {}, warga: [], mobil: [], asap: null, lampu: [] };
  // --- kumpulkan material unik seluruh dunia (sekali saja) ---
  const seen = new Set();
  scene.traverse((o) => {
    if (!o.isMesh && !o.isInstancedMesh) return;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of ms) {
      if (!m || !m.color || seen.has(m.uuid) || m.userData.noSeason) continue;
      seen.add(m.uuid);
      m.userData.dasar = m.color.clone();
      // material bertekstur sering berwarna dasar putih; kenali perannya dari pemakainya
      let g = klasifikasi(m.color);
      if (o.userData.ground || o.userData.lawn) g = 'daun';
      else if (o.userData.jalan || o.userData.road) g = 'aspal';
      else if (g === 'putih' && m.map) g = 'tanah';
      D.mats.push({ m, g, dasar: m.color.clone() });
    }
  });
  // --- selimut salju raksasa untuk seluruh peta (satu mesh, berlubang di area bangunan) ---
  const shp = new THREE.Shape();
  shp.moveTo(-190, -190); shp.lineTo(190, -190); shp.lineTo(190, 190); shp.lineTo(-190, 190); shp.lineTo(-190, -190);
  const lubang = (x0, z0, x1, z1) => { const h = new THREE.Path(); h.moveTo(x0, -z0); h.lineTo(x0, -z1); h.lineTo(x1, -z1); h.lineTo(x1, -z0); h.lineTo(x0, -z0); shp.holes.push(h); };
  lubang(-22.5, -14.5, 22.5, 20.5);                                   // area komplek utama (sudah punya lapisan sendiri)
  D.snow = new THREE.Mesh(new THREE.ShapeGeometry(shp), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0, roughness: 1, depthWrite: false }));
  D.snow.rotation.x = -PI / 2; D.snow.position.y = 0.05; D.snow.renderOrder = 1; D.snow.material.userData.noSeason = true;
  D.snow.visible = false; scene.add(D.snow);
  // --- warga jauh (instanced, 1 draw call) ---
  const badan = new THREE.CapsuleGeometry(0.17, 0.5, 3, 6); badan.translate(0, 0.62, 0);
  const matWarga = new THREE.MeshStandardMaterial({ roughness: 0.9, vertexColors: false });
  matWarga.userData.noSeason = true;
  D.wargaMesh = new THREE.InstancedMesh(badan, matWarga, 26);
  const col = new THREE.Color();
  const JALUR = [
    [[-78, 21.5], [78, 21.5]], [[78, 23.5], [-78, 23.5]], [[-60, -6], [-30, -8]], [[30, -10], [66, -14]],
    [[-26, 29], [26, 29]], [[52, 29], [-52, 33]],
  ];
  for (let i = 0; i < 26; i++) {
    const j = JALUR[i % JALUR.length];
    D.warga.push({ a: j[0], b: j[1], p: Math.random(), sp: 0.012 + Math.random() * 0.02, off: (Math.random() - 0.5) * 1.6, ph: Math.random() * 6 });
    D.wargaMesh.setColorAt(i, col.setHSL(Math.random(), 0.45, 0.45 + Math.random() * 0.25));
  }
  D.wargaMesh.castShadow = false; D.wargaMesh.frustumCulled = true; scene.add(D.wargaMesh);
  // --- kepala + wajah untuk warga jauh ---
  //  Dulu mereka cuma kapsul tanpa kepala sama sekali. Sekarang tiap warga punya
  //  kepala, rambut, dan dua mata yang dipanggang jadi SATU geometri, jadi
  //  tambahannya hanya 2 draw call untuk 26 orang.
  const gabung = (daftar) => {
    const pos = [], nor = [], warna = [];
    for (const [geo, c, dx, dy, dz] of daftar) {
      geo.translate(dx, dy, dz);
      const p = geo.attributes.position, nn = geo.attributes.normal;
      const idx = geo.index ? geo.index.array : null;
      const n = idx ? idx.length : p.count;
      const w = new THREE.Color(c);
      for (let k = 0; k < n; k++) {
        const v = idx ? idx[k] : k;
        pos.push(p.getX(v), p.getY(v), p.getZ(v));
        nor.push(nn.getX(v), nn.getY(v), nn.getZ(v));
        warna.push(w.r, w.g, w.b);
      }
      geo.dispose();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(warna, 3));
    return g;
  };
  const kulit = ['#c99670', '#a8714a', '#8a5a38', '#d2a07c'];
  D.kepalaMesh = [];
  for (let v = 0; v < 2; v++) {                       // dua varian: berambut & berkerudung
    const kl = kulit[v * 2];
    const bagian = [
      [new THREE.SphereGeometry(0.115, 8, 6), kl, 0, 1.33, 0],
      [v ? new THREE.SphereGeometry(0.14, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.66) : new THREE.SphereGeometry(0.122, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), v ? '#4a4a6a' : '#1e1a18', 0, v ? 1.325 : 1.345, v ? 0 : -0.008],
      [new THREE.SphereGeometry(0.019, 5, 4), '#15151a', -0.042, 1.345, 0.098],
      [new THREE.SphereGeometry(0.019, 5, 4), '#15151a', 0.042, 1.345, 0.098],
      [new THREE.BoxGeometry(0.04, 0.009, 0.01), '#7a4a46', 0, 1.285, 0.106],
    ];
    const g = gabung(bagian);
    const m = new THREE.MeshStandardMaterial({ roughness: 0.85, vertexColors: true });
    m.userData.noSeason = true;
    const im = new THREE.InstancedMesh(g, m, 13);
    im.castShadow = false; im.frustumCulled = true; scene.add(im); D.kepalaMesh.push(im);
  }
  // --- kendaraan lewat (instanced) ---
  // Mobil yang lewat dulu cuma balok polos — dari kejauhan terlihat seperti
  // kotak warna-warni. Sekarang berbentuk mobil beneran (badan, kabin, kaca,
  // empat roda, lampu depan) yang dipanggang jadi SATU geometri: tetap 1 draw call.
  const roda = () => { const g = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 10); g.rotateZ(Math.PI / 2); return g; };
  const mobilGeo = gabung([
    [new THREE.BoxGeometry(1.86, 0.6, 4.1), '#ffffff', 0, 0.62, 0],            // badan (ikut warna tiap mobil)
    [new THREE.BoxGeometry(1.64, 0.56, 2.0), '#ffffff', 0, 1.16, -0.22],       // kabin
    [new THREE.BoxGeometry(1.67, 0.34, 1.82), '#2a2f36', 0, 1.2, -0.22],       // kaca keliling
    [new THREE.BoxGeometry(1.5, 0.1, 0.9), '#e8e8e8', 0, 1.46, -0.22],         // atap
    [roda(), '#17191c', -0.93, 0.34, 1.28], [roda(), '#17191c', 0.93, 0.34, 1.28],
    [roda(), '#17191c', -0.93, 0.34, -1.3], [roda(), '#17191c', 0.93, 0.34, -1.3],
    [new THREE.BoxGeometry(0.34, 0.16, 0.08), '#fff3c4', -0.62, 0.72, 2.06],   // lampu depan
    [new THREE.BoxGeometry(0.34, 0.16, 0.08), '#fff3c4', 0.62, 0.72, 2.06],
    [new THREE.BoxGeometry(0.3, 0.14, 0.08), '#b3261e', -0.64, 0.74, -2.06],   // lampu belakang
    [new THREE.BoxGeometry(0.3, 0.14, 0.08), '#b3261e', 0.64, 0.74, -2.06],
  ]);
  const matMobil = new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.3, vertexColors: true }); matMobil.userData.noSeason = true;
  D.mobilMesh = new THREE.InstancedMesh(mobilGeo, matMobil, 8);
  for (let i = 0; i < 8; i++) {
    const arah = i % 2 ? 1 : -1;
    D.mobil.push({ x: -90 + Math.random() * 180, z: arah > 0 ? 21.2 : 24.2, dir: arah, sp: 4 + Math.random() * 5 });
    D.mobilMesh.setColorAt(i, col.setHSL(Math.random(), 0.55, 0.52));
  }
  scene.add(D.mobilMesh);
  // --- asap dapur rumah tetangga ---
  const asapGeo = new THREE.SphereGeometry(0.5, 6, 5);
  const matAsap = new THREE.MeshBasicMaterial({ color: '#cfd4d8', transparent: true, opacity: 0.3, depthWrite: false }); matAsap.userData.noSeason = true;
  D.asapMesh = new THREE.InstancedMesh(asapGeo, matAsap, 18);
  D.asap = [];
  const cerobong = [[-31, 1], [31, 1], [-58, 1], [58, 1], [-26, 31], [0, 31], [26, 31], [52, 31], [-52, 31]];
  for (let i = 0; i < 18; i++) { const c = cerobong[i % cerobong.length]; D.asap.push({ x: c[0] + 1.4, z: c[1] - 1.2, k: Math.random() }); }
  scene.add(D.asapMesh);
  // --- lampu jalan & jendela menyala (instanced, tanpa light sungguhan) ---
  const bolaGeo = new THREE.SphereGeometry(0.22, 7, 5);
  D.matLampu = new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: '#ffcf80', emissiveIntensity: 0, roughness: 0.4 }); D.matLampu.userData.noSeason = true;
  const titik = [];
  for (let x = -84; x <= 84; x += 14) titik.push([x, 2.9, 25.4]);
  for (const c of cerobong) { titik.push([c[0] - 2.2, 1.6, c[1] + (c[1] > 10 ? -4.2 : 4.2)]); titik.push([c[0] + 2.2, 1.6, c[1] + (c[1] > 10 ? -4.2 : 4.2)]); }
  D.lampuMesh = new THREE.InstancedMesh(bolaGeo, D.matLampu, titik.length);
  const mtx = new THREE.Matrix4();
  titik.forEach((p, i) => { mtx.makeTranslation(p[0], p[1], p[2]); D.lampuMesh.setMatrixAt(i, mtx); });
  D.lampuMesh.instanceMatrix.needsUpdate = true; scene.add(D.lampuMesh);
  // tiang lampu jalan (statis, instanced)
  const tiangGeo = new THREE.CylinderGeometry(0.08, 0.1, 3, 6);
  const tiangMesh = new THREE.InstancedMesh(tiangGeo, new THREE.MeshStandardMaterial({ color: '#4a4f55', roughness: 0.6 }), 13);
  let ti = 0; for (let x = -84; x <= 84; x += 14) { mtx.makeTranslation(x, 1.5, 25.4); if (ti < 13) tiangMesh.setMatrixAt(ti++, mtx); }
  tiangMesh.count = ti; scene.add(tiangMesh);
  return D;
}

// dipanggil tiap frame, tetapi pekerjaan berat hanya 5× per detik
export function updateDunia(D, game, dt, t, night) {
  if (!D) return;
  const W = game.hh.world;
  const musim = W.seasonLock || W.lastSeason || 'hujan';
  const snow = W.snow || 0;
  // ---- warga & kendaraan (murah: sekitar 34 matriks) ----
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3();
  const aktif = !night || Math.random() < 0.5;
  D.warga.forEach((w, i) => {
    w.p += w.sp * dt * (night ? 0.4 : 1); if (w.p > 1) { w.p = 0; const tmp = w.a; w.a = w.b; w.b = tmp; }
    const x = lerp(w.a[0], w.b[0], w.p) + w.off, z = lerp(w.a[1], w.b[1], w.p) + w.off * 0.3;
    const yaw = Math.atan2(w.b[0] - w.a[0], w.b[1] - w.a[1]);
    e.set(0, yaw, Math.sin(t * 7 + w.ph) * 0.07); q.setFromEuler(e);
    v.set(1, 1 + Math.abs(Math.sin(t * 7 + w.ph)) * 0.04, 1);
    m.compose(new THREE.Vector3(x, 0, z), q, v); D.wargaMesh.setMatrixAt(i, m);
    if (D.kepalaMesh) { const km = D.kepalaMesh[i % 2], ki = (i / 2) | 0; if (km && ki < 13) km.setMatrixAt(ki, m); }
  });
  D.wargaMesh.instanceMatrix.needsUpdate = true;
  if (D.kepalaMesh) for (const km of D.kepalaMesh) km.instanceMatrix.needsUpdate = true;
  D.mobil.forEach((c, i) => {
    c.x += c.dir * c.sp * dt * (night ? 0.6 : 1);
    if (c.x > 95) c.x = -95; if (c.x < -95) c.x = 95;
    e.set(0, c.dir > 0 ? PI / 2 : -PI / 2, 0); q.setFromEuler(e);
    m.compose(new THREE.Vector3(c.x, 0, c.z), q, new THREE.Vector3(1, 1, 1)); D.mobilMesh.setMatrixAt(i, m);
  });
  D.mobilMesh.instanceMatrix.needsUpdate = true;
  // asap dapur (pagi & sore saja)
  const jam = (W.time % 1440) / 60; const masak = (jam > 5 && jam < 8) || (jam > 16.5 && jam < 19.5);
  D.asapMesh.visible = masak && W.weather !== 'badai';
  if (D.asapMesh.visible) {
    D.asap.forEach((a, i) => { a.k = (a.k + dt * 0.12) % 1; const s = 0.4 + a.k * 1.8;
      m.compose(new THREE.Vector3(a.x + Math.sin(t + i) * 0.4, 3.4 + a.k * 4.5, a.z), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
      D.asapMesh.setMatrixAt(i, m); });
    D.asapMesh.instanceMatrix.needsUpdate = true;
    D.asapMesh.material.opacity = 0.26;
  }
  // ---- pekerjaan berat: hanya 5× per detik ----
  D.akum += dt; if (D.akum < 0.2) return; const step = D.akum; D.akum = 0;
  D.lampuMesh.visible = night; D.matLampu.emissiveIntensity = night ? 1.2 : 0;
  // musim menyelimuti seluruh dunia
  const T = TARGET[musim] || TARGET.hujan;
  const kuat = musim === 'salju' ? Math.max(0.25, snow) : 1;
  const k = Math.min(1, step * 0.6);
  for (const r of D.mats) {
    const def = T[r.g] || T.lain;
    const tujuan = _warna(def[0]).clone().lerp(r.dasar, 1 - def[1] * kuat);
    r.m.color.lerp(tujuan, k);
  }
  if (D.snow) { D.snow.visible = snow > 0.02; D.snow.material.opacity = Math.min(0.95, snow * 1.05); }
}
const _cache = {};
function _warna(hex) { return _cache[hex] || (_cache[hex] = new THREE.Color(hex)); }

// ============================================================
//  OPTIMASI: gabungkan geometri statis di kejauhan menjadi
//  beberapa mesh besar (per material) → draw call turun drastis.
//  Hanya menyentuh benda hiasan jauh yang tidak pernah bergerak.
// ============================================================
const bercahaya = (m) => !!(m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) > 0.02 && (m.emissiveIntensity ?? 1) > 0);
function ambilAtribut(g, nama) { return g.getAttribute ? g.getAttribute(nama) : null; }
function keNonIndeks(g) {
  const idx = g.index; if (!idx) return g;
  const out = new THREE.BufferGeometry(); const n = idx.count;
  for (const nama of ['position', 'normal', 'uv']) {
    const a = ambilAtribut(g, nama); if (!a) continue;
    const it = a.itemSize, arr = new Float32Array(n * it);
    for (let i = 0; i < n; i++) { const s = idx.getX(i) * it; for (let k = 0; k < it; k++) arr[i * it + k] = a.array[s + k]; }
    out.setAttribute(nama, new THREE.BufferAttribute(arr, it));
  }
  return out;
}
export function gabungStatis(scene, zona = null) {
  const kandidat = new Map();                       // material.uuid → { m, geos[] }
  const buang = [];
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.isPoints || o.isSprite) return;
    if (o.userData.objId != null || o.userData.simName || o.userData.keep || o.userData.stair) return;
    if (!o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
    if (Array.isArray(o.material) || !o.material || o.material.transparent) return;
    if (o.userData.ground || o.userData.lawn || bercahaya(o.material)) return;
    if (zona) { const p = new THREE.Vector3(); o.getWorldPosition(p);
      if (Math.abs(p.x) <= zona.x && p.z >= zona.zMin && p.z <= zona.zMax) return; }
    let par = o.parent, aman = true;
    while (par && par !== scene) { if (par.userData.objId != null || par.userData.simName || par.userData.dinamis) { aman = false; break; } par = par.parent; }
    if (!aman) return;
    const key = o.material.uuid;
    const slot = kandidat.get(key) || { m: o.material, geos: [] };
    const g = keNonIndeks(o.geometry).clone(); g.applyMatrix4(o.matrixWorld);
    for (const nama of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(nama)) g.deleteAttribute(nama);
    slot.geos.push(g); kandidat.set(key, slot); buang.push(o);
  });
  let digabung = 0;
  for (const [, slot] of kandidat) {
    if (slot.geos.length < 4) continue;                                   // tidak perlu digabung
    const total = {}; const punyaUV = slot.geos.every((g) => g.attributes.uv), punyaN = slot.geos.every((g) => g.attributes.normal);
    for (const nama of ['position', ...(punyaN ? ['normal'] : []), ...(punyaUV ? ['uv'] : [])]) total[nama] = slot.geos.reduce((a, g) => a + g.attributes[nama].array.length, 0);
    const buf = {}; for (const nama in total) buf[nama] = { arr: new Float32Array(total[nama]), off: 0, it: slot.geos[0].attributes[nama].itemSize };
    for (const g of slot.geos) for (const nama in buf) { const a = g.attributes[nama].array; buf[nama].arr.set(a, buf[nama].off); buf[nama].off += a.length; g.dispose(); }
    const geo = new THREE.BufferGeometry();
    for (const nama in buf) geo.setAttribute(nama, new THREE.BufferAttribute(buf[nama].arr, buf[nama].it));
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, slot.m);
    const c = geo.boundingSphere ? geo.boundingSphere.center : { x: 0, z: 0 };
    const dekatRumah = Math.abs(c.x) < 26 && c.z > -16 && c.z < 24;
    mesh.castShadow = dekatRumah;                      // hiasan jauh tidak ikut menghitung bayangan
    mesh.receiveShadow = true; mesh.userData.gabungan = true; mesh.matrixAutoUpdate = false;
    scene.add(mesh); digabung += slot.geos.length;
    for (const o of buag_filter(buang, slot.m)) { if (o.parent) o.parent.remove(o); }
  }
  return digabung;
}
function buag_filter(buang, mat) { return buang.filter((o) => o.material === mat); }

// ---------------- tingkat detail (hemat beban di HP) ----------------
// 0 = penuh, 1 = sedang (kejauhan dipangkas), 2 = hemat (hanya sekitar rumah)
export function matikanBayanganJauh(scene) {
  let n = 0;
  scene.traverse((o) => {
    if (!o.isMesh && !o.isInstancedMesh) return; if (!o.castShadow) return;
    const p = o.getWorldPosition ? o.getWorldPosition(new THREE.Vector3()) : o.position;
    if (Math.abs(p.x) > 26 || p.z < -16 || p.z > 26) { o.castShadow = false; n++; }
  });
  return n;
}
export function setDetailDunia(D, scene, level) {
  if (!D) return 0;
  D.level = level;
  let sembunyi = 0;
  const v = new THREE.Vector3();
  if (!D.jauhCache) {                                  // hitung sekali: mana saja benda yang jauh dari rumah
    D.jauhCache = []; scene.updateMatrixWorld(true);
    scene.traverse((o) => {
      if (!o.isMesh && !o.isInstancedMesh && !o.isPoints) return;
      if (o.userData.objId != null || o.userData.simName || o.userData.dinamis) return;
      o.getWorldPosition(v);
      const d = Math.max(Math.abs(v.x), v.z < 0 ? -v.z - 10 : v.z - 20);
      if (d > 34) D.jauhCache.push({ o, d });
    });
  }
  const batas = [1e9, 70, 40][level] || 1e9;
  for (const it of D.jauhCache) { const tampil = it.d <= batas; if (it.o.visible !== tampil) it.o.visible = tampil; if (!tampil) sembunyi++; }
  // warga & kendaraan di kejauhan ikut dikurangi
  if (D.wargaMesh) D.wargaMesh.count = level === 0 ? D.warga.length : level === 1 ? 12 : 0;
  if (D.kepalaMesh) for (const km of D.kepalaMesh) km.count = level === 0 ? 13 : level === 1 ? 6 : 0;
  if (D.mobilMesh) D.mobilMesh.count = level === 0 ? D.mobil.length : level === 1 ? 4 : 0;
  if (D.asapMesh) D.asapMesh.count = level === 0 ? D.asap.length : level === 1 ? 8 : 0;
  if (D.lampuMesh) D.lampuMesh.visible = level < 2;
  return sembunyi;
}

// ---------------- gabungkan sub-mesh satu perabot (hemat draw call) ----------------
// Hanya untuk perabot yang tidak punya bagian animasi (userData.P kosong).
export function gabungGrup(grup) {
  if (!grup || !grup.children || !grup.children.length) return 0;
  const P = (grup.userData && grup.userData.P) || {};
  // bagian yang dipakai animasi (layar TV, api kompor, piring, dll.) tidak boleh digabung
  const kecuali = new Set();
  const tandaiKecuali = (v, d = 0) => {
    if (!v || d > 3) return;
    if (v.isObject3D) { v.traverse((o) => kecuali.add(o)); return; }
    if (Array.isArray(v)) { for (const x of v) tandaiKecuali(x, d + 1); return; }
    if (typeof v === 'object') for (const k of Object.keys(v)) tandaiKecuali(v[k], d + 1);
  };
  tandaiKecuali(P);
  const peta = new Map(); const buang = [];
  grup.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(grup.matrixWorld).invert();
  grup.traverse((o) => {
    if (o === grup || !o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || !o.material) return;
    if (kecuali.has(o) || o.userData.dinamis) return;
    if (!o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return;
    if (o.material.transparent || bercahaya(o.material)) return;
    const key = o.material.uuid; const slot = peta.get(key) || { m: o.material, geos: [] };
    const g = keNonIndeks(o.geometry).clone();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    for (const nama of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(nama)) g.deleteAttribute(nama);
    slot.geos.push(g); peta.set(key, slot); buang.push(o);
  });
  let hemat = 0;
  for (const [, slot] of peta) {
    if (slot.geos.length < 2) continue;
    const punyaUV = slot.geos.every((g) => g.attributes.uv), punyaN = slot.geos.every((g) => g.attributes.normal);
    const nama = ['position', ...(punyaN ? ['normal'] : []), ...(punyaUV ? ['uv'] : [])];
    const buf = {}; for (const n of nama) buf[n] = { arr: new Float32Array(slot.geos.reduce((a, g) => a + g.attributes[n].array.length, 0)), off: 0, it: slot.geos[0].attributes[n].itemSize };
    for (const g of slot.geos) for (const n of nama) { buf[n].arr.set(g.attributes[n].array, buf[n].off); buf[n].off += g.attributes[n].array.length; }
    const geo = new THREE.BufferGeometry();
    for (const n of nama) geo.setAttribute(n, new THREE.BufferAttribute(buf[n].arr, buf[n].it));
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, slot.m); mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.userData.objId = grup.userData.objId; grup.add(mesh);
    hemat += slot.geos.length - 1;
    for (const o of buang) if (o.material === slot.m && o.parent) o.parent.remove(o);
  }
  return hemat;
}
