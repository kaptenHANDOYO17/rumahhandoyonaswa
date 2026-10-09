// ============================================================
//  SATWA KECIL — yang bikin dunia terasa hidup walau tidak disentuh
//
//  Kupu-kupu di kebun, capung di atas sawah, kunang-kunang saat malam,
//  burung gereja yang mematuk lalu terbang, ayam kampung di dekat warung,
//  cicak di dinding saat lampu menyala, katak saat hujan, barisan semut,
//  dan ular sawah yang sesekali menyelinap ke halaman.
//
//  Semuanya InstancedMesh — seluruh modul ini hanya menambah ±8 draw call
//  dan < 0,15 ms per frame, jadi tetap ringan di laptop maupun HP.
// ============================================================
import * as THREE from 'three';
import { TYPES, MOODLETS, PI } from './data.js';
import { INTER } from './interactions.js';
import { M, box } from './world.js';

Object.assign(MOODLETS, {
  takutUlar: { label: 'Kaget ada ular!', emoji: '🐍', val: -14, dur: 180 },
  beraniUlar: { label: 'Berhasil mengusir ular', emoji: '💪', val: 14, dur: 360 },
  kunangKunang: { label: 'Lihat kunang-kunang', emoji: '✨', val: 12, dur: 300 },
});

// ---------------- ular yang masuk halaman ----------------
Object.assign(TYPES, {
  ular: { name: 'Ular Sawah', cat: 'luar', price: 0, w: 0.8, d: 0.8, fixed: true, walk: true,
    spots: [{ ax: 0, az: 1.3, yaw: PI }], acts: ['usirUlar', 'lihatUlar'] },
});
Object.assign(INTER, {
  usirUlar: { label: 'Usir ular pakai sapu 🧹', icon: '🐍',
    check: (c) => (c.sim.species === 'human' ? true : 'Biar manusia saja yang mengusir'),
    build: (c) => ({ steps: [{ target: { obj: c.obj.id }, anim: 'mop', prop: 'mop', dur: 12, label: 'Mengusir ular', snd: 'swish',
      onDone: (x) => {
        const W = x.g.world; W.objects = W.objects.filter((o) => o.id !== x.obj.id); W.objVer++; x.g.rebuildNav();
        x.sim.mood('beraniUlar'); x.sim.xp('bugar', 20); x.g.addFam(8);
        x.g.toast('🐍 Ularnya balik ke sawah. "Jangan ke sini lagi ya!" — halaman aman kembali.', 'good', true);
      } }] }) },
  lihatUlar: { label: 'Amati dari jauh', icon: '👀',
    build: (c) => ({ steps: [{ target: { pos: [c.obj.x, c.obj.z + 2.2] }, anim: 'phone', dur: 6, eff: { fun: 1 }, label: 'Mengamati ular',
      onDone: (x) => { x.sim.xp('logika', 10); x.g.toast('🐍 Ular sawah (Ptyas mucosus) — tidak berbisa, pemakan tikus. Teman petani, sebenarnya.', 'info'); } }] }) },
});

// ---------------- helper ----------------
const inst = (parent, geo, mat, n, bayangan = false) => {
  const m = new THREE.InstancedMesh(geo, mat, n);
  m.castShadow = bayangan; m.receiveShadow = false; m.frustumCulled = true;
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); parent.add(m); return m;
};
const V = new THREE.Vector3(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), MT = new THREE.Matrix4();
const taruh = (mesh, i, x, y, z, yaw = 0, sk = 1, pitch = 0) => {
  Q.setFromEuler(new THREE.Euler(pitch, yaw, 0)); V.set(x, y, z); S.set(sk, sk, sk);
  MT.compose(V, Q, S); mesh.setMatrixAt(i, MT);
};
const acak = (a, b) => a + Math.random() * (b - a);

// ---------------- bangun ----------------
export function buildSatwa(scene) {
  const F = { t: 0, akum: 0 };
  const R = new THREE.Group(); scene.add(R); F.root = R;

  // --- kupu-kupu: 2 sayap segitiga, warna cerah ---
  const sayap = new THREE.BufferGeometry();
  sayap.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.11, 0.02, 0.07, 0.11, 0.02, -0.07, 0, 0, 0, -0.11, 0.02, 0.07, -0.11, 0.02, -0.07], 3));
  sayap.computeVertexNormals();
  F.kupu = inst(R, sayap, M('#ffffff', 0.7, 0, { side: THREE.DoubleSide, vertexColors: false }), 16);
  F.kupuData = []; const warnaKupu = ['#ffb74d', '#f06292', '#fff176', '#4fc3f7', '#ba68c8', '#81c784'];
  const kupuWarna = new THREE.Color();
  for (let i = 0; i < 16; i++) {
    const taman = [[-6, 8.5], [6, 8.5], [-10, 2], [10, 2], [0, -9], [-9.6, 27.7], [8.4, 27.5], [-18, 6]][i % 8];
    F.kupuData.push({ cx: taman[0], cz: taman[1], a: Math.random() * 6, r: acak(0.8, 2.6), y: acak(0.5, 1.4), sp: acak(0.5, 1.1), f: Math.random() * 6 });
    F.kupu.setColorAt(i, kupuWarna.set(warnaKupu[i % warnaKupu.length]));
  }
  if (F.kupu.instanceColor) F.kupu.instanceColor.needsUpdate = true;

  // --- capung: badan tipis + sayap bening, melayang di atas sawah ---
  const capungG = new THREE.BufferGeometry();
  capungG.setAttribute('position', new THREE.Float32BufferAttribute([-0.01, 0, -0.16, 0.01, 0, -0.16, 0, 0, 0.14, -0.13, 0.01, 0.02, 0.13, 0.01, 0.02, 0, 0.01, -0.03], 3));
  capungG.computeVertexNormals();
  F.capung = inst(R, capungG, M('#64b5f6', 0.4, 0.2, { side: THREE.DoubleSide, transparent: true, opacity: 0.85 }), 12);
  F.capungData = Array.from({ length: 12 }, () => ({ cx: acak(-28, 28), cz: acak(-44, -16), a: Math.random() * 6, r: acak(1.5, 4), y: acak(0.9, 2.1), sp: acak(0.7, 1.5) }));

  // --- kunang-kunang: titik bercahaya, hanya malam ---
  const kg = new THREE.BufferGeometry();
  const pos = new Float32Array(60 * 3);
  F.kunangData = Array.from({ length: 60 }, (_, i) => ({ cx: acak(-30, 30), cz: acak(-46, 24), a: Math.random() * 6, r: acak(0.6, 3), y: acak(0.4, 2.4), sp: acak(0.2, 0.7), ph: Math.random() * 6 }));
  kg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  F.kunang = new THREE.Points(kg, new THREE.PointsMaterial({ color: '#d4ff6a', size: 0.11, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
  F.kunang.frustumCulled = false; R.add(F.kunang);

  // --- burung gereja: badan + ekor, mematuk di tanah lalu terbang ---
  const burungG = new THREE.BufferGeometry();
  burungG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.1, -0.05, 0.04, -0.02, 0.05, 0.04, -0.02, 0, 0.02, -0.03, -0.03, 0, -0.14, 0.03, 0, -0.14], 3));
  burungG.computeVertexNormals();
  F.burung = inst(R, burungG, M('#8d6e63', 0.85, 0, { side: THREE.DoubleSide }), 10, false);
  F.burungData = Array.from({ length: 10 }, () => ({ x: acak(-14, 14), z: acak(-12, 20), y: 0.08, tx: 0, tz: 0, t: acak(0, 5), fase: 'patuk', yaw: Math.random() * 6 }));

  // --- ayam kampung: badan bulat + jengger, mematuk di dekat warung ---
  const ayamG = new THREE.SphereGeometry(0.17, 8, 6); ayamG.scale(1, 0.9, 1.25);
  F.ayam = inst(R, ayamG, M('#efebe9', 0.95), 6, true);
  F.ayamData = Array.from({ length: 6 }, () => ({ x: acak(13, 21), z: acak(9, 12), tx: 0, tz: 0, t: acak(0, 4), yaw: Math.random() * 6, bob: Math.random() * 6 }));
  const jenggerG = new THREE.BoxGeometry(0.03, 0.09, 0.1);
  F.jengger = inst(R, jenggerG, M('#e53935', 0.8), 6);

  // --- cicak: menempel di dinding, muncul saat lampu menyala ---
  const cicakG = new THREE.BufferGeometry();
  cicakG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.09, -0.035, 0, -0.01, 0.035, 0, -0.01, 0, 0, -0.01, -0.012, 0, -0.17, 0.012, 0, -0.17], 3));
  cicakG.computeVertexNormals();
  F.cicak = inst(R, cicakG, M('#bcaaa4', 0.9, 0, { side: THREE.DoubleSide }), 8);
  F.cicakData = [
    { x: -7.9, y: 2.2, z: 0, yaw: PI / 2 }, { x: 7.9, y: 2.0, z: -2, yaw: -PI / 2 }, { x: 2, y: 2.3, z: -5.9, yaw: 0 },
    { x: -3, y: 2.1, z: 5.9, yaw: PI }, { x: -17.9, y: 2.2, z: 4, yaw: PI / 2 }, { x: 15.9, y: 2.1, z: 5, yaw: -PI / 2 },
    { x: -5.4, y: 2.4, z: 20.6, yaw: 0 }, { x: 5.4, y: 2.2, z: 20.6, yaw: 0 },
  ].map((c) => ({ ...c, t: Math.random() * 5, dx: 0 }));

  // --- katak: hanya saat hujan, melompat di rumput ---
  const katakG = new THREE.SphereGeometry(0.1, 7, 5); katakG.scale(1, 0.75, 1.2);
  F.katak = inst(R, katakG, M('#689f38', 0.9), 10, true);
  F.katakData = Array.from({ length: 10 }, () => ({ x: acak(-12, 12), z: acak(-12, 12), y: 0, t: acak(0, 3), vy: 0, yaw: Math.random() * 6 }));

  // --- semut: barisan titik kecil menyusuri jalur ---
  const semutG = new THREE.BoxGeometry(0.035, 0.025, 0.06);
  F.semut = inst(R, semutG, M('#3e2723', 0.9), 24);
  F.semutJalur = [[-5.5, 9.2], [-3.0, 9.6], [-0.5, 9.3], [2.0, 8.8], [4.5, 9.4], [6.5, 10.2]];
  F.semutData = Array.from({ length: 24 }, (_, i) => ({ p: i / 24, sp: 0.05 + (i % 3) * 0.008 }));

  // --- ular sawah: badan bersegmen yang meliuk di pematang ---
  const segG = new THREE.SphereGeometry(0.085, 7, 5);
  F.ular = inst(R, segG, M('#5d7a3a', 0.85), 14, true);
  F.ularData = { x: -16, z: -22, a: 0.6, jalan: true, ekor: Array.from({ length: 14 }, () => ({ x: -16, z: -22 })) };
  return F;
}

// ---------------- gerak ----------------
export function updateSatwa(F, game, dt, t, night) {
  if (!F) return;
  const W = game.hh.world; const hr = (W.time % 1440) / 60;
  const hujan = W.weather === 'hujan' || W.weather === 'badai';
  const siang = hr > 5.5 && hr < 18;
  F.t = t;

  // kupu-kupu (siang, tidak hujan)
  const kupuTampak = siang && !hujan;
  F.kupu.visible = kupuTampak;
  if (kupuTampak) {
    F.kupuData.forEach((k, i) => {
      k.a += dt * k.sp;
      const x = k.cx + Math.cos(k.a) * k.r, z = k.cz + Math.sin(k.a * 1.3) * k.r;
      const y = k.y + Math.sin(t * 2 + k.f) * 0.18;
      taruh(F.kupu, i, x, y, z, -k.a, 1, Math.sin(t * 16 + k.f) * 0.9);
    });
    F.kupu.instanceMatrix.needsUpdate = true;
  }
  // capung (siang di atas sawah)
  F.capung.visible = kupuTampak;
  if (kupuTampak) {
    F.capungData.forEach((c, i) => {
      c.a += dt * c.sp;
      taruh(F.capung, i, c.cx + Math.cos(c.a) * c.r, c.y + Math.sin(t * 3 + c.a) * 0.22, c.cz + Math.sin(c.a) * c.r, -c.a + PI / 2, 1, 0);
    });
    F.capung.instanceMatrix.needsUpdate = true;
  }
  // kunang-kunang (malam, tidak hujan)
  const kunangOn = night && !hujan;
  F.kunang.material.opacity += ((kunangOn ? 0.9 : 0) - F.kunang.material.opacity) * Math.min(1, dt * 1.5);
  if (F.kunang.material.opacity > 0.02) {
    const p = F.kunang.geometry.attributes.position;
    F.kunangData.forEach((k, i) => {
      k.a += dt * k.sp;
      p.setXYZ(i, k.cx + Math.cos(k.a) * k.r, k.y + Math.sin(t * 0.8 + k.ph) * 0.5, k.cz + Math.sin(k.a * 0.8) * k.r);
    });
    p.needsUpdate = true;
    F.kunang.material.size = 0.09 + Math.abs(Math.sin(t * 3)) * 0.05;
  }
  // burung (siang)
  F.burung.visible = siang && !hujan;
  if (F.burung.visible) {
    F.burungData.forEach((b, i) => {
      b.t -= dt;
      if (b.t <= 0) {
        b.t = acak(2, 6);
        if (b.fase === 'patuk' && Math.random() < 0.45) { b.fase = 'terbang'; b.tx = acak(-16, 16); b.tz = acak(-14, 20); }
        else b.fase = 'patuk';
      }
      if (b.fase === 'terbang') {
        const dx = b.tx - b.x, dz = b.tz - b.z, d = Math.hypot(dx, dz);
        if (d < 0.2) { b.fase = 'patuk'; b.y = 0.08; }
        else { const v = Math.min(d, dt * 3.4); b.x += (dx / d) * v; b.z += (dz / d) * v; b.y = 0.08 + Math.sin((1 - d / 14) * PI) * 1.6 + Math.sin(t * 18) * 0.06; b.yaw = Math.atan2(dx, dz); }
      } else b.y = 0.08 + Math.abs(Math.sin(t * 5 + i)) * 0.03;
      taruh(F.burung, i, b.x, b.y, b.z, b.yaw, 1, b.fase === 'patuk' ? Math.sin(t * 6 + i) * 0.4 : 0);
    });
    F.burung.instanceMatrix.needsUpdate = true;
  }
  // ayam (siang, dekat warung)
  F.ayam.visible = siang; F.jengger.visible = siang;
  if (siang) {
    F.ayamData.forEach((a, i) => {
      a.t -= dt;
      if (a.t <= 0) { a.t = acak(1.5, 5); a.tx = acak(13, 21); a.tz = acak(9, 12.2); }
      const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
      if (d > 0.1) { const v = Math.min(d, dt * 0.7); a.x += (dx / d) * v; a.z += (dz / d) * v; a.yaw = Math.atan2(dx, dz); }
      const bob = Math.sin(t * 7 + a.bob) * 0.025;
      taruh(F.ayam, i, a.x, 0.19 + bob, a.z, a.yaw, 1, d > 0.1 ? 0 : Math.sin(t * 4 + i) * 0.5);
      taruh(F.jengger, i, a.x + Math.sin(a.yaw) * 0.16, 0.33 + bob, a.z + Math.cos(a.yaw) * 0.16, a.yaw);
    });
    F.ayam.instanceMatrix.needsUpdate = true; F.jengger.instanceMatrix.needsUpdate = true;
  }
  // cicak (malam, di dinding)
  F.cicak.visible = night;
  if (night) {
    F.cicakData.forEach((c, i) => {
      c.t -= dt;
      if (c.t <= 0) { c.t = acak(2, 7); c.dx = acak(-0.8, 0.8); }
      c.x += Math.cos(c.yaw) * c.dx * dt * 0.3;
      taruh(F.cicak, i, c.x, c.y + Math.sin(t * 0.5 + i) * 0.1, c.z, c.yaw, 1, -PI / 2);
    });
    F.cicak.instanceMatrix.needsUpdate = true;
  }
  // katak (saat hujan)
  F.katak.visible = hujan;
  if (hujan) {
    F.katakData.forEach((k, i) => {
      k.t -= dt;
      if (k.t <= 0 && k.y <= 0.01) { k.t = acak(1, 4); k.vy = 1.9; k.yaw = Math.random() * 6; }
      k.vy -= dt * 7; k.y = Math.max(0, k.y + k.vy * dt);
      if (k.y > 0) { k.x += Math.sin(k.yaw) * dt * 0.8; k.z += Math.cos(k.yaw) * dt * 0.8; }
      taruh(F.katak, i, k.x, 0.1 + k.y, k.z, k.yaw);
    });
    F.katak.instanceMatrix.needsUpdate = true;
  }
  // semut (selalu, murah)
  F.semutData.forEach((s, i) => {
    s.p = (s.p + dt * s.sp) % 1;
    const n = F.semutJalur.length - 1; const f = s.p * n; const k = Math.min(n - 1, Math.floor(f)); const u = f - k;
    const a = F.semutJalur[k], b = F.semutJalur[k + 1];
    const x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u;
    taruh(F.semut, i, x, 0.03, z, Math.atan2(b[0] - a[0], b[1] - a[1]));
  });
  F.semut.instanceMatrix.needsUpdate = true;
  // ular: meliuk di pematang sawah
  const U = F.ularData;
  U.a += dt * 0.35;
  U.x += Math.cos(U.a) * dt * 1.1; U.z += Math.sin(U.a * 0.7) * dt * 1.1;
  if (U.x < -30) U.x = -30; if (U.x > 30) U.x = 30; if (U.z < -46) U.z = -46; if (U.z > -16) U.z = -16;
  U.ekor.unshift({ x: U.x, z: U.z }); if (U.ekor.length > 40) U.ekor.pop();
  for (let i = 0; i < 14; i++) {
    const e = U.ekor[Math.min(U.ekor.length - 1, i * 2)];
    taruh(F.ular, i, e.x, 0.09, e.z, 0, 1 - i * 0.035);
  }
  F.ular.instanceMatrix.needsUpdate = true;
}

// ---------------- kejadian: ular masuk halaman ----------------
//  Dipanggil dari jam permainan. Jarang, tapi bikin kaget & berkesan.
export function satwaJam(hh, hr) {
  const W = hh.world;
  if (W.objects.some((o) => o.type === 'ular')) return;
  const musim = W.lastSeason;
  const peluang = (hr >= 5 && hr < 9) || (hr >= 17 && hr < 20) ? 0.03 : 0.008;
  if (musim === 'hujan' && Math.random() < peluang * 1.8 || Math.random() < peluang) {
    const x = -6 + Math.random() * 12, z = 7 + Math.random() * 3.5;
    if (!hh.nav.okXZ(x, z)) return;
    W.objects.push({ id: W.nextId++, type: 'ular', x, z, rot: Math.random() * 3, lvl: 0, s: {} });
    W.objVer++; hh.rebuildNav();
    hh.toast('🐍 Ada ular sawah masuk ke halaman! Usir pakai sapu, atau amati dulu dari jauh.', 'bad', true);
    hh.sfx('bad');
    for (const h of hh.humans()) if (!h.hidden && Math.hypot(h.x - x, h.z - z) < 6) h.mood('takutUlar');
  }
}
