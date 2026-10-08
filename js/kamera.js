// ============================================================
//  KAMERA — tombol gerak kamera di layar + POV orang pertama.
//
//  · Tombol: geser (▲▼◀▶), zoom (＋ －), putar (⟲ ⟳), reset, dan POV.
//  · POV orang pertama: kamera menempel di kepala karakter milik
//    perangkat ini (Handoyo di laptop Handoyo, Naswa di laptop Naswa).
//    Jalan pakai WASD / tombol ▲▼◀▶, lihat sekeliling dengan geser
//    layar (drag) atau tombol ⟲ ⟳. Tekan V untuk ganti cepat.
// ============================================================
import * as THREE from 'three';
import { GRID } from './data.js';
import { LVL_H } from './floor2.js';

const TOMBOL = [
  ['pov', '👁️ POV orang pertama', 'wide'],
  ['up', '▲', ''], ['left', '◀', ''], ['down', '▼', ''], ['right', '▶', ''],
  ['zin', '＋', ''], ['reset', '⌾', ''], ['zout', '－', ''],
];
const TOMBOL_POV = [
  ['pov', '🎥 Kembali ke kamera atas', 'wide'],
  ['up', '▲', ''], ['left', '◀', ''], ['down', '▼', ''], ['right', '▶', ''],
  ['kiri', '⟲', ''], ['reset', '⌾', ''], ['kanan', '⟳', ''],
];

// ---------------- panel tombol ----------------
export function buatPanelKamera(ui, root) {
  const el = document.createElement('div');
  el.className = 'kam';
  root.append(el);
  ui.kamEl = el;
  gambarPanel(ui);
  // tahan tombol = gerak terus
  let tahan = null, iv = null;
  const mulai = (aksi) => {
    tahan = aksi;
    aksiKamera(ui.g, aksi, true);
    clearInterval(iv);
    if (['up', 'down', 'left', 'right', 'kiri', 'kanan', 'zin', 'zout'].includes(aksi)) iv = setInterval(() => aksiKamera(ui.g, tahan, true), 60);
  };
  const henti = () => { tahan = null; clearInterval(iv); iv = null; if (ui.g) ui.g.tekanKam = {}; };
  el.addEventListener('pointerdown', (e) => { const b = e.target.closest('[data-kam]'); if (!b) return; e.preventDefault(); mulai(b.dataset.kam); });
  el.addEventListener('pointerup', henti);
  el.addEventListener('pointercancel', henti);
  el.addEventListener('pointerleave', henti);
  window.addEventListener('blur', henti);
  return el;
}
export function gambarPanel(ui) {
  const el = ui.kamEl; if (!el) return;
  const pov = !!(ui.g && ui.g.pov);
  const daftar = pov ? TOMBOL_POV : TOMBOL;
  el.classList.toggle('pov', pov);
  const html = daftar.map(([k, t, c]) => `<button data-kam="${k}" class="${c}${k === 'pov' && pov ? ' on' : ''}" title="${t}">${t}</button>`).join('');
  if (el._html !== html) { el._html = html; el.innerHTML = html; }
}

// ---------------- aksi satu tombol ----------------
export function aksiKamera(g, aksi, dariTombol) {
  if (!g) return;
  if (aksi === 'pov') return g.pov ? keluarPOV(g) : masukPOV(g);
  if (g.pov) {
    const T = (g.tekanKam = g.tekanKam || {});
    if (aksi === 'up') T.maju = 1; if (aksi === 'down') T.maju = -1;
    if (aksi === 'left') T.samping = -1; if (aksi === 'right') T.samping = 1;
    if (aksi === 'kiri') g.povYaw += 0.09; if (aksi === 'kanan') g.povYaw -= 0.09;
    if (aksi === 'reset') { const s = g.hh.sims[g.active]; if (s) g.povYaw = s.yaw; g.povPitch = 0; }
    if (dariTombol) setTimeout(() => { T.maju = 0; T.samping = 0; }, 140);
    return;
  }
  const c = g.controls, cam = g.camera;
  const maju = new THREE.Vector3(); cam.getWorldDirection(maju); maju.y = 0; maju.normalize();
  const kanan = new THREE.Vector3(-maju.z, 0, maju.x);
  const langkah = 0.55 + c.getDistance() * 0.035;
  const geser = (v) => { g.follow = false; c.target.add(v); cam.position.add(v); };
  if (aksi === 'up') geser(maju.clone().multiplyScalar(langkah));
  if (aksi === 'down') geser(maju.clone().multiplyScalar(-langkah));
  if (aksi === 'left') geser(kanan.clone().multiplyScalar(-langkah));
  if (aksi === 'right') geser(kanan.clone().multiplyScalar(langkah));
  if (aksi === 'kiri' || aksi === 'kanan') {
    const off = cam.position.clone().sub(c.target);
    off.applyAxisAngle(new THREE.Vector3(0, 1, 0), (aksi === 'kiri' ? 1 : -1) * 0.08);
    cam.position.copy(c.target).add(off);
  }
  if (aksi === 'zin' || aksi === 'zout') {
    const off = cam.position.clone().sub(c.target);
    const d = THREE.MathUtils.clamp(off.length() * (aksi === 'zin' ? 0.94 : 1.064), c.minDistance, c.maxDistance);
    cam.position.copy(c.target).add(off.setLength(d));
  }
  if (aksi === 'reset') { g.follow = true; g.focusSim(g.active); const off = new THREE.Vector3(7, 11.5, 13.5); cam.position.copy(c.target).add(off); }
  c.update();
}

// ---------------- POV orang pertama ----------------
export function masukPOV(g) {
  const s = g.hh.sims[g.active];
  if (!s || s.isPet) { g.ui.toast('POV orang pertama hanya untuk Handoyo & Naswa — pilih karakternya dulu.', 'info'); return; }
  g.pov = true;
  g.povYaw = s.yaw || 0; g.povPitch = -0.02;
  g._simpanKam = { pos: g.camera.position.clone(), target: g.controls.target.clone(), fov: g.camera.fov, dinding: g.wallMode, ikut: g.follow };
  g.controls.enabled = false;
  g.camera.fov = 72; g.camera.near = 0.05; g.camera.updateProjectionMatrix();
  g.setWallMode('roof');                     // di POV dinding utuh + atap terpasang: benar-benar terasa di dalam ruangan
  if (g.W.plafon) g.W.plafon.visible = (g.viewLvl || 0) === 0;
  g.follow = false; g.followLvl = true;
  g._panelLama = g.ui.panelOpen; g.ui.panelOpen = false;
  document.body.classList.add('pov');
  g.ui.toast(`👁️ POV ${s.name}: WASD jalan · geser layar / ⟲ ⟳ lihat sekeliling · klik untuk interaksi · V keluar`, 'good', true);
  gambarPanel(g.ui); g.ui.refresh();
}
export function keluarPOV(g) {
  g.pov = false;
  const K = g._simpanKam;
  g.controls.enabled = true;
  g.camera.fov = K ? K.fov : 42; g.camera.near = 0.1; g.camera.updateProjectionMatrix();
  if (g.W.plafon) g.W.plafon.visible = false;
  if (K) { g.camera.position.copy(K.pos); g.controls.target.copy(K.target); g.setWallMode(K.dinding || 'cut'); g.follow = K.ikut; }
  g.controls.update();
  if (g._panelLama !== undefined) g.ui.panelOpen = g._panelLama;
  document.body.classList.remove('pov');
  gambarPanel(g.ui); g.ui.refresh();
}

const V = new THREE.Vector3(), V2 = new THREE.Vector3();
// dipanggil tiap frame saat POV aktif
export function updatePOV(g, dt) {
  const s = g.hh.sims[g.active]; const m = g.models[g.active];
  if (!s || !m) return keluarPOV(g);
  const k = g.keys || {}, T = g.tekanKam || {};
  // ---- lihat sekeliling ----
  const putar = (k.q ? 1 : 0) - (k.e ? 1 : 0);
  if (putar) g.povYaw += putar * dt * 1.9;
  if (g.povDrag) { g.povYaw -= g.povDrag.x * 0.0038; g.povPitch = THREE.MathUtils.clamp(g.povPitch - g.povDrag.y * 0.0034, -0.95, 0.85); g.povDrag = null; }
  // ---- jalan: kirim perintah "go" ke titik di depan, dibatasi agar tidak membanjiri jaringan ----
  let maju = (k.w || k.arrowup ? 1 : 0) - (k.s || k.arrowdown ? 1 : 0);
  let samping = (k.d || k.arrowright ? 1 : 0) - (k.a || k.arrowleft ? 1 : 0);
  if (T.maju) maju = T.maju; if (T.samping) samping = T.samping;
  g._povT = (g._povT || 0) + dt;
  if ((maju || samping) && g._povT > 0.26) {
    g._povT = 0;
    const arah = new THREE.Vector2(-Math.sin(g.povYaw), -Math.cos(g.povYaw));      // depan karakter
    const sisi = new THREE.Vector2(-arah.y, arah.x);
    const d = new THREE.Vector2(arah.x * maju + sisi.x * samping, arah.y * maju + sisi.y * samping);
    if (d.lengthSq()) {
      d.normalize().multiplyScalar(3.2);
      const x = THREE.MathUtils.clamp(s.x + d.x, GRID.minX + 0.5, GRID.maxX - 0.5);
      const z = THREE.MathUtils.clamp(s.z + d.y, GRID.minZ + 0.5, GRID.maxZ - 0.5);
      g.cmd({ c: 'go', x, z, lvl: s.lvl || 0 });
      g._povJalan = 1.2;
    }
  }
  if (g._povJalan > 0) { g._povJalan -= dt; if (g._povJalan <= 0 && !maju && !samping) g.cmd({ c: 'cancel' }); }
  // ---- taruh kamera di kepala ----
  if (m.head) m.head.getWorldPosition(V); else V.set(m.root.position.x, m.root.position.y + 1.6, m.root.position.z);
  V.y += 0.08;
  // goyangan langkah: bikin jalan terasa nyata tanpa biaya hitungan berarti
  if (s.moving) {
    g.povBob = (g.povBob || 0) + dt * 9.2;
    V.y += Math.sin(g.povBob) * 0.028;
    V.x += Math.cos(g.povYaw) * Math.sin(g.povBob * 0.5) * 0.018;
    V.z -= Math.sin(g.povYaw) * Math.sin(g.povBob * 0.5) * 0.018;
    // bunyi langkah mengikuti goyangan
    const fase = Math.floor(g.povBob / Math.PI);
    if (fase !== g._povFase) { g._povFase = fase; g.ui.sound && g.ui.sound.shot && g.ui.sound.shot('step', 0.5); }
  } else { g.povBob = 0; g._povFase = -1; }
  // sedikit di depan kepala supaya hidung/rambut sendiri tidak menutupi layar
  V2.set(-Math.sin(g.povYaw), 0, -Math.cos(g.povYaw)).multiplyScalar(0.14);
  g.camera.position.copy(V).add(V2);
  g.camera.rotation.set(0, 0, 0);
  g.camera.rotation.order = 'YXZ';
  g.camera.rotation.y = g.povYaw; g.camera.rotation.x = g.povPitch;
  // target kontrol tetap di depan supaya keluar POV mulus & dinding/hujan ikut posisi
  g.controls.target.set(g.camera.position.x - Math.sin(g.povYaw) * 3, (s.lvl || 0) * LVL_H, g.camera.position.z - Math.cos(g.povYaw) * 3);
  if ((s.lvl || 0) !== g.viewLvl) g.setView(s.lvl || 0);
  if (g.W.plafon) g.W.plafon.visible = (g.viewLvl || 0) === 0;
}
