// ============================================================
//  TAMPILAN ELEGANSI — upgrade yang benar-benar KELIHATAN
//
//  Uang yang dipakai untuk meningkatkan rumah harus terlihat hasilnya,
//  bukan cuma angka naik. Modul ini mengubah wujud rumah sesuai tingkat
//  yang sudah dibeli di js/kekayaan.js:
//
//   · Lantai      → granit poles, lalu marmer Carrara, lalu marmer + inlay kuningan
//   · Pencahayaan → cahaya dalam makin hangat & merata, lalu lampu gantung kristal
//   · Taman       → petak taman rapi, kolam koi + topiari, lalu air mancur marmer
//   · Fasad       → pilar batu, teras bertiang (portico), lalu lis kuningan
//   · Perabot     → kayu & logam perabot berubah jadi jati, lalu kulit & marmer
//
//  Arahnya ELEGAN, bukan mencolok: warna tenang, simetri, kuningan tipis,
//  cahaya hangat. Semua dibangun sekali lalu disembunyikan/ditampilkan,
//  jadi tidak membebani saat dimainkan.
// ============================================================
import * as THREE from 'three';
import { PI } from './data.js';
import { M, box } from './world.js';
import { ELEGANSI } from './kekayaan.js';

const cyl = (rt, rb, h, mat, x = 0, y = 0, z = 0, p, seg = 14) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; if (p) p.add(m); return m;
};

// --- tekstur lantai: granit, marmer, marmer + inlay kuningan ---
function lantaiTex(jenis) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  if (jenis === 1) {                                   // granit poles
    g.fillStyle = '#b9b5ad'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) { const v = 150 + Math.random() * 70; g.fillStyle = `rgba(${v},${v - 4},${v - 10},.5)`; g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2); }
    g.strokeStyle = 'rgba(120,118,112,.5)'; g.lineWidth = 2;
    for (let i = 0; i <= 512; i += 128) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); }
  } else {                                             // marmer Carrara
    g.fillStyle = '#f0efea'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 26; i++) {                     // urat abu lembut
      g.strokeStyle = `rgba(150,152,156,${0.08 + Math.random() * 0.16})`;
      g.lineWidth = 1 + Math.random() * 5; g.beginPath();
      let x = Math.random() * 512, y = -20;
      g.moveTo(x, y);
      while (y < 532) { x += (Math.random() - 0.5) * 70; y += 24 + Math.random() * 34; g.quadraticCurveTo(x + 18, y - 16, x, y); }
      g.stroke();
    }
    g.strokeStyle = 'rgba(190,188,182,.55)'; g.lineWidth = 1.5;
    for (let i = 0; i <= 512; i += 256) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); }
    if (jenis === 3) {                                 // inlay kuningan
      g.strokeStyle = '#c9a227'; g.lineWidth = 4;
      g.strokeRect(36, 36, 440, 440);
      g.lineWidth = 2; g.strokeRect(56, 56, 400, 400);
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(jenis === 1 ? 7 : 4, jenis === 1 ? 6 : 3.4);
  return t;
}

export function buildElegan(scene, W) {
  const F = { grup: {}, lantaiTex: {}, t: 0 };
  const R = new THREE.Group(); scene.add(R); F.root = R;

  const marmer = M('#efede7', 0.35), kuningan = M('#c9a227', 0.22, 0.92);
  const batu = M('#ddd8cc', 0.85), air = new THREE.MeshStandardMaterial({ color: '#86b6c4', roughness: 0.06, metalness: 0.3, transparent: true, opacity: 0.8 });
  const daunM = M('#3f7a3a', 0.9);

  // ---------- TAMAN tingkat 1: petak tertata + jalur batu ----------
  const t1 = new THREE.Group(); R.add(t1); F.grup.taman1 = t1;
  //  Tata letak halaman depan (semua dihitung supaya tidak pernah bertabrakan):
  //    gerbang x = -4, z = 11   ·   pintu utama x = -4, z = 6
  //    teras bertiang  x -6,8…-1,2   z 6,05…8,65
  //    kolam / air mancur  pusat (3,5 · 8,6)  jari-jari 2,1
  for (const [x, z] of [[-10.4, 7.4], [-10.4, 9.8], [8.4, 7.4], [8.4, 9.8]]) {
    box(2.0, 0.22, 1.2, batu, x, 0.11, z, t1);
    for (let j = 0; j < 4; j++) { const d = box(0.3, 0.34, 0.3, daunM, x - 0.6 + j * 0.42, 0.34, z, t1); d.castShadow = false; }
  }
  // jalur batu lurus dari gerbang (x = -4, z = 11) ke teras depan (z ≈ 8.8)
  for (let i = 0; i < 5; i++) box(1.1, 0.06, 0.62, batu, -4, 0.04, 8.95 + i * 0.5, t1).castShadow = false;

  // ---------- TAMAN tingkat 2: kolam koi + topiari simetris ----------
  const t2 = new THREE.Group(); R.add(t2); F.grup.taman2 = t2;
  const kolam = new THREE.Group(); kolam.position.set(3.5, 0, 8.6); t2.add(kolam);
  const bibir = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.17, 8, 28), batu);
  bibir.rotation.x = PI / 2; bibir.position.y = 0.17; kolam.add(bibir);
  const muka = new THREE.Mesh(new THREE.CircleGeometry(1.46, 28), air);
  muka.rotation.x = -PI / 2; muka.position.y = 0.2; kolam.add(muka); F.airKolam = muka;
  for (let i = 0; i < 5; i++) {
    const koi = box(0.17, 0.05, 0.3, M(i % 2 ? '#e8743b' : '#f5f1e8', 0.5), 0, 0.21, 0, kolam);
    koi.castShadow = false; (F.koi = F.koi || []).push({ m: koi, a: i * 1.26, r: 0.5 + (i % 3) * 0.3, sp: 0.4 + i * 0.09 });
  }
  //  dua topiari mengapit jalur ke pintu, dua lagi di sisi kanan taman
  for (const [x, z] of [[-5.8, 9.9], [-2.2, 9.9], [7.0, 7.1], [7.0, 10.1]]) {
    const tp = new THREE.Group(); tp.position.set(x, 0, z); t2.add(tp);
    cyl(0.3, 0.34, 0.36, batu, 0, 0.18, 0, tp, 12);
    cyl(0.07, 0.07, 0.5, M('#6d4c41', 0.9), 0, 0.6, 0, tp, 8);
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.34 - i * 0.07, 12, 9), daunM); b.position.y = 0.95 + i * 0.5; b.castShadow = true; tp.add(b); }
  }

  // ---------- TAMAN tingkat 3: air mancur marmer ----------
  const t3 = new THREE.Group(); t3.position.set(3.5, 0, 8.6); R.add(t3); F.grup.taman3 = t3;
  const kolam3 = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.26, 10, 32), marmer);
  kolam3.rotation.x = PI / 2; kolam3.position.y = 0.26; t3.add(kolam3);
  const muka3 = new THREE.Mesh(new THREE.CircleGeometry(2.05, 32), air); muka3.rotation.x = -PI / 2; muka3.position.y = 0.3; t3.add(muka3); F.airMancur = muka3;
  cyl(0.46, 0.6, 0.5, marmer, 0, 0.25, 0, t3, 16);
  cyl(0.17, 0.22, 1.0, marmer, 0, 0.9, 0, t3, 14);
  const mangkuk = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.3, 0.26, 20), marmer); mangkuk.position.y = 1.5; mangkuk.castShadow = true; t3.add(mangkuk);
  cyl(0.09, 0.11, 0.6, marmer, 0, 1.9, 0, t3, 12);
  const puncak = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), kuningan); puncak.position.y = 2.28; t3.add(puncak);
  F.pancuran = [];
  for (let i = 0; i < 16; i++) {
    const p = box(0.035, 0.5, 0.035, new THREE.MeshStandardMaterial({ color: '#cfeaf2', transparent: true, opacity: 0.6, roughness: 0.1 }), 0, 1.9, 0, t3);
    p.castShadow = false; F.pancuran.push({ m: p, a: (i / 16) * PI * 2, f: Math.random() * 6 });
  }
  const lampuAir = new THREE.PointLight('#bfe4f0', 0, 7, 2); lampuAir.position.set(0, 1.3, 0); t3.add(lampuAir); F.lampuAir = lampuAir;

  // ---------- FASAD tingkat 1: pilar batu di pagar ----------
  const f1 = new THREE.Group(); R.add(f1); F.grup.fasad1 = f1;
  for (const x of [-11.2, -6.7, -1.3, 4.8, 9.4]) { box(0.52, 1.7, 0.52, batu, x, 0.85, 10.9, f1); box(0.64, 0.14, 0.64, kuningan, x, 1.77, 10.9, f1); }

  // ---------- FASAD tingkat 2: teras bertiang (portico) ----------
  //  Dipasang DI DEPAN pintu utama (x = -4, z = 6) dan sepenuhnya di LUAR
  //  dinding rumah, supaya tiangnya tidak pernah berdiri di dalam ruang tamu.
  //  Lantai teras: z 6.05 → 8.65. Tiang berdiri di tepi luar (z ≈ 8.3),
  //  jadi ada 2,2 m teras beratap antara pintu dan tiang.
  const f2 = new THREE.Group(); f2.position.set(-4.0, 0, 7.35); R.add(f2); F.grup.fasad2 = f2;
  box(5.6, 0.2, 2.6, batu, 0, 0.1, 0, f2);
  box(5.9, 0.12, 0.42, batu, 0, 0.06, 1.46, f2);          // anak tangga turun ke halaman
  for (const x of [-2.2, -0.75, 0.75, 2.2]) {
    cyl(0.19, 0.23, 3.1, marmer, x, 1.6, 0.95, f2, 16);
    cyl(0.3, 0.3, 0.16, marmer, x, 0.26, 0.95, f2, 16);
    cyl(0.28, 0.24, 0.18, marmer, x, 3.22, 0.95, f2, 16);
  }
  box(5.8, 0.3, 0.5, marmer, 0, 3.46, 0.95, f2);          // balok di atas tiang
  box(5.8, 0.16, 2.5, marmer, 0, 3.3, -0.3, f2);          // atap datar teras, menempel ke dinding
  const pediment = new THREE.BufferGeometry();
  pediment.setAttribute('position', new THREE.Float32BufferAttribute([-2.9, 0, 0, 2.9, 0, 0, 0, 0.95, 0], 3));
  pediment.computeVertexNormals();
  const pm = new THREE.Mesh(pediment, new THREE.MeshStandardMaterial({ color: '#efede7', roughness: 0.4, side: THREE.DoubleSide, flatShading: true }));
  pm.position.set(0, 3.6, 0.95); f2.add(pm);

  // ---------- FASAD tingkat 3: lis kuningan ----------
  const f3 = new THREE.Group(); R.add(f3); F.grup.fasad3 = f3;
  for (const z of [6.05, -6.05]) box(16.4, 0.09, 0.09, kuningan, 0, 2.86, z, f3);
  for (const x of [-8.05, 8.05]) box(0.09, 0.09, 12.2, kuningan, x, 2.86, 0, f3);
  for (const [x, z] of [[-8.05, 6.05], [8.05, 6.05], [-8.05, -6.05], [8.05, -6.05]]) box(0.16, 0.3, 0.16, kuningan, x, 2.95, z, f3);

  // ---------- CAHAYA tingkat 3: lampu gantung kristal ----------
  const c3 = new THREE.Group(); c3.position.set(-2.6, 0, 1.4); R.add(c3); F.grup.cahaya3 = c3;
  box(0.06, 0.5, 0.06, kuningan, 0, 2.5, 0, c3);
  const mahkota = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 8, 24), kuningan);
  mahkota.rotation.x = PI / 2; mahkota.position.y = 2.2; c3.add(mahkota);
  const mahkota2 = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.03, 8, 20), kuningan);
  mahkota2.rotation.x = PI / 2; mahkota2.position.y = 1.95; c3.add(mahkota2);
  const kristalM = new THREE.MeshStandardMaterial({ color: '#fff6e0', emissive: '#ffcf8a', emissiveIntensity: 0.6, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.9 });
  F.kristal = kristalM;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * PI * 2;
    const k = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), kristalM);
    k.position.set(Math.cos(a) * 0.42, 2.12, Math.sin(a) * 0.42); k.castShadow = false; c3.add(k);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * PI * 2 + 0.4;
    const k = new THREE.Mesh(new THREE.OctahedronGeometry(0.048, 0), kristalM);
    k.position.set(Math.cos(a) * 0.26, 1.88, Math.sin(a) * 0.26); k.castShadow = false; c3.add(k);
  }
  const lampuKristal = new THREE.PointLight('#ffd9a0', 0, 9, 1.7); lampuKristal.position.set(0, 2.1, 0); c3.add(lampuKristal); F.lampuKristal = lampuKristal;

  for (const g of Object.values(F.grup)) g.visible = false;
  F.lantaiTex[1] = null; F.lantaiTex[2] = null; F.lantaiTex[3] = null;
  return F;
}

// ---------------- terapkan sesuai tingkat yang sudah dibeli ----------------
export function terapkanElegan(F, game) {
  if (!F) return;
  const W = game.hh.world; const K = W.kaya || {}; const E = K.elegansi || {};
  const tingkat = (k) => E[k] || 0;

  for (const [n, g] of Object.entries(F.grup)) {
    const kat = n.replace(/\d+$/, ''); const lv = +n.slice(-1);
    g.visible = tingkat(kat) >= lv;
  }
  // taman: hanya tingkat tertinggi yang tampil supaya tidak bertumpuk
  if (F.grup.taman3.visible) { F.grup.taman2.visible = false; }
  if (F.grup.fasad2.visible && F.grup.fasad1) F.grup.fasad1.visible = true;

  // --- lantai rumah ---
  const lv = tingkat('lantai');
  if (lv !== F._lantai) {
    F._lantai = lv;
    const daftar = (game.W && game.W.lantaiRumah) || [];
    if (!F._lantaiAsli) F._lantaiAsli = daftar.map((f) => f.material.map);
    daftar.forEach((f, i) => {
      const m = f.material; if (!m) return;
      if (lv === 0) { m.map = F._lantaiAsli[i]; m.roughness = 0.55; m.metalness = 0; }
      else {
        if (!F.lantaiTex[lv]) F.lantaiTex[lv] = lantaiTex(lv);
        const t = F.lantaiTex[lv].clone();
        const u = f.userData.ukuran || [4, 4];
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(u[0] / (lv === 1 ? 2.2 : 3.4), u[1] / (lv === 1 ? 2.2 : 3.4));
        t.needsUpdate = true;
        m.map = t; m.color.set('#ffffff');
        m.roughness = lv >= 2 ? 0.2 : 0.42; m.metalness = lv >= 2 ? 0.12 : 0.04;
      }
      m.needsUpdate = true;
    });
  }
  // --- perabot: kayu jadi jati, lalu kulit & marmer ---
  const pv = tingkat('perabot');
  if (pv !== F._perabot) {
    F._perabot = pv;
    const warna = [null, '#6b4a2c', '#4e342e', '#3b2a1d'][pv];
    if (!F._perabotAsli) F._perabotAsli = new Map();
    for (const g of game.objMeshes.values()) {
      g.traverse((o) => {
        if (!o.isMesh || !o.material || !o.material.color) return;
        const c = o.material.color; const h = {}; c.getHSL(h);
        const kayu = h.h > 0.02 && h.h < 0.12 && h.s > 0.18 && h.l < 0.6;    // kenali warna kayu
        if (!kayu) return;
        if (!F._perabotAsli.has(o.material)) F._perabotAsli.set(o.material, c.clone());
        if (!warna) c.copy(F._perabotAsli.get(o.material));
        else { c.set(warna); o.material.roughness = pv >= 2 ? 0.3 : 0.55; }
      });
    }
  }
}

export function updateElegan(F, game, dt, t, night) {
  if (!F) return;
  const E = (game.hh.world.kaya || {}).elegansi || {};
  // koi berenang pelan di kolam
  if (F.grup.taman2.visible && F.koi) for (const k of F.koi) {
    k.a += dt * k.sp;
    k.m.position.set(Math.cos(k.a) * k.r, 0.21, Math.sin(k.a * 1.2) * k.r);
    k.m.rotation.y = -k.a;
  }
  if (F.airKolam) F.airKolam.material.opacity = 0.74 + Math.sin(t * 1.1) * 0.05;
  // air mancur memancar
  if (F.grup.taman3.visible && F.pancuran) {
    for (const p of F.pancuran) {
      const f = (t * 1.6 + p.f) % 1;
      p.m.position.set(Math.cos(p.a) * (0.1 + f * 1.5), 2.25 - f * f * 2.1, Math.sin(p.a) * (0.1 + f * 1.5));
      p.m.scale.y = 0.4 + f * 0.9;
      p.m.material.opacity = 0.62 * (1 - f * 0.75);
    }
    if (F.airMancur) F.airMancur.material.opacity = 0.76 + Math.sin(t * 2.2) * 0.06;
    if (F.lampuAir) F.lampuAir.intensity = night ? 2.4 + Math.sin(t * 1.5) * 0.4 : 0;
  }
  // lampu gantung kristal menyala saat malam / saat lampu rumah hidup
  if (F.grup.cahaya3.visible) {
    const pw = game.hh.world.house.power;
    const target = (night && pw) ? 5.5 : (pw ? 1.1 : 0);
    F.lampuKristal.intensity += (target - F.lampuKristal.intensity) * Math.min(1, dt * 2);
    F.kristal.emissiveIntensity = 0.3 + (F.lampuKristal.intensity / 5.5) * 1.3;
  }
}
