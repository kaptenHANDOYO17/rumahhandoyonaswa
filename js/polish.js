// ============================================================
//  LAPISAN DETAIL (polish) — sentuhan "kelas besar" untuk Griya Asri
//  • Mode Foto (sembunyikan HUD, filter sinematik, simpan/pajang hasilnya)
//  • Kunang-kunang malam hari & kupu-kupu siang hari di halaman
//  • Ambience azan magrib & subuh
//  • Konfeti, hujan daun emas, kedip lampu "penunggu", getaran kamera
//  • Plumbob pelangi / emas hadiah easter egg
// ============================================================
import * as THREE from 'three';
import { HOUSE, PI } from './data.js';

export function buildPolish(game) {
  const P = { shake: 0, t: 0 };
  const scene = game.scene;
  // ---- kunang-kunang ----
  const N = 160, pos = new Float32Array(N * 3); P.ff = [];
  for (let i = 0; i < N; i++) {
    const d = { x: -12 + Math.random() * 24, y: 0.3 + Math.random() * 1.8, z: -10 + Math.random() * 21, ph: Math.random() * 7, sp: 0.2 + Math.random() * 0.4 };
    P.ff.push(d); pos[i * 3] = d.x; pos[i * 3 + 1] = d.y; pos[i * 3 + 2] = d.z;
  }
  const gf = new THREE.BufferGeometry(); gf.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  P.fire = new THREE.Points(gf, new THREE.PointsMaterial({ color: '#ffe680', size: 0.11, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  P.fire.visible = false; scene.add(P.fire);
  // ---- kupu-kupu ----
  const B = 26; P.bf = [];
  const bmat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9, transparent: true });
  P.but = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.12), bmat, B);
  const col = new THREE.Color();
  for (let i = 0; i < B; i++) { P.bf.push({ x: -11 + Math.random() * 22, y: 0.6 + Math.random(), z: -9 + Math.random() * 19, a: Math.random() * 7, sp: 0.5 + Math.random() * 0.7 }); P.but.setColorAt(i, col.set(['#ffd166', '#f4978e', '#a0e7e5', '#f7b7f0', '#ffffff'][i % 5])); }
  P.but.visible = false; scene.add(P.but);
  // ---- konfeti & burst daun ----
  P.parts = [];
  P.burstGeo = new THREE.PlaneGeometry(0.14, 0.1);
  return P;
}
export function spawnBurst(P, game, kind = 'konfeti', at = null) {
  const tg = at || game.controls.target;
  const colors = kind === 'daun' ? ['#e07b39', '#c0392b', '#f1c40f', '#a0522d'] : ['#ff5252', '#ffd740', '#69f0ae', '#40c4ff', '#e040fb', '#ffffff'];
  const n = kind === 'daun' ? 120 : 160;
  const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true });
  const mesh = new THREE.InstancedMesh(P.burstGeo, mat, n); const col = new THREE.Color();
  const data = [];
  for (let i = 0; i < n; i++) {
    data.push({ x: tg.x + (Math.random() - 0.5) * 6, y: 6 + Math.random() * 4, z: tg.z + (Math.random() - 0.5) * 6, vy: -1 - Math.random(), r: Math.random() * 7, rs: (Math.random() - 0.5) * 6, sw: Math.random() * 2 });
    mesh.setColorAt(i, col.set(colors[i % colors.length]));
  }
  game.scene.add(mesh); P.parts.push({ mesh, data, life: kind === 'daun' ? 7 : 9 });
  game.ui.sound && game.ui.sound.play && game.ui.sound.play('fanfare');
}
export function shake(P, amount = 0.35) { P.shake = Math.max(P.shake, amount); }

export function updatePolish(P, game, dt, t, night) {
  if (!P) return; P.t = t; const W = game.hh.world; const tg = game.controls.target;
  const hr = (W.time % 1440) / 60; const musimPanas = W.lastSeason === 'panas';
  // kunang-kunang
  const ffOn = night && W.weather !== 'hujan' && W.weather !== 'badai' && W.weather !== 'salju';
  P.fire.visible = ffOn;
  if (ffOn) {
    P.fire.material.opacity = 0.9; const a = P.fire.geometry.attributes.position;
    P.ff.forEach((d, i) => { d.ph += dt * d.sp; a.setXYZ(i, d.x + Math.sin(d.ph) * 1.2, d.y + Math.sin(d.ph * 1.7) * 0.35, d.z + Math.cos(d.ph * 0.8) * 1.2); });
    a.needsUpdate = true; P.fire.material.size = 0.09 + Math.sin(t * 6) * 0.03;
  }
  // kupu-kupu
  const btOn = !night && W.weather === 'cerah' && W.lastSeason !== 'salju';
  P.but.visible = btOn;
  if (btOn) {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    P.bf.forEach((d, i) => {
      d.a += dt * d.sp; d.x += Math.cos(d.a) * dt * 0.8; d.z += Math.sin(d.a * 1.3) * dt * 0.8;
      if (d.x < -12 || d.x > 12) d.x = -d.x * 0.9; if (d.z < -10 || d.z > 11) d.z = -d.z * 0.9;
      const y = d.y + Math.sin(t * 3 + i) * 0.18;
      e.set(-PI / 2 + Math.sin(t * 14 + i) * 0.9, d.a, 0); q.setFromEuler(e);
      m.compose(new THREE.Vector3(d.x, y, d.z), q, new THREE.Vector3(1, 1, 1)); P.but.setMatrixAt(i, m);
    });
    P.but.instanceMatrix.needsUpdate = true;
  }
  // partikel konfeti/daun
  for (const b of P.parts) {
    b.life -= dt; const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    b.data.forEach((d, i) => {
      d.y += d.vy * dt; d.x += Math.sin(t * 2 + d.sw) * dt * 0.6; d.r += d.rs * dt; if (d.y < 0.05) d.y = 0.05;
      e.set(d.r, d.r * 0.6, d.r * 0.3); q.setFromEuler(e); m.compose(new THREE.Vector3(d.x, d.y, d.z), q, new THREE.Vector3(1, 1, 1)); b.mesh.setMatrixAt(i, m);
    });
    b.mesh.instanceMatrix.needsUpdate = true; b.mesh.material.opacity = Math.min(1, b.life / 2);
    if (b.life <= 0) { game.scene.remove(b.mesh); b.mesh.material.dispose(); }
  }
  P.parts = P.parts.filter((b) => b.life > 0);
  // getaran kamera
  if (P.shake > 0.001) { P.shake *= Math.pow(0.02, dt); game.camera.position.x += (Math.random() - 0.5) * P.shake; game.camera.position.y += (Math.random() - 0.5) * P.shake * 0.6; }
  // plumbob hadiah easter egg
  if (game.plumbob) {
    if (W.eggs && W.eggs.semua) { game.plumbob.material.color.set('#ffd700'); game.plumbob.material.emissive.set('#ffb300'); }
    else if (W.eggs && W.eggs.plumbob) { const c = new THREE.Color().setHSL((t * 0.25) % 1, 0.9, 0.6); game.plumbob.material.color.copy(c); game.plumbob.material.emissive.copy(c); }
  }
  // ambience azan magrib & subuh
  const H = Math.floor(hr), M = Math.floor(W.time % 60);
  if ((H === 18 || H === 5) && M === 0 && W._azan !== H) {
    W._azan = H;
    game.ui.toast(H === 18 ? '🕌 Azan magrib berkumandang dari musala komplek. Langit Griya Asri jingga keemasan.' : '🕌 Azan subuh. Pagi mulai menyapa, ayam tetangga ikut bersahutan.', 'info');
    const s = game.ui.sound; if (s && s.ctx) { [392, 440, 523, 440].forEach((f, i) => s.osc('sine', f, f * 1.02, 1.4, 0.02, i * 1.1, ['lowpass', 1200])); }
  }
  if (M !== 0) W._azan = null;
}

// ---------------- MODE FOTO ----------------
const FILTERS = {
  none: { n: 'Asli', f: 'none' }, hangat: { n: 'Senja Hangat', f: 'saturate(1.25) sepia(.25) contrast(1.05)' },
  dingin: { n: 'Pagi Sejuk', f: 'saturate(1.1) hue-rotate(-12deg) brightness(1.05)' }, film: { n: 'Film 90-an', f: 'contrast(1.15) saturate(.85) sepia(.35)' },
  bw: { n: 'Hitam Putih', f: 'grayscale(1) contrast(1.2)' }, dramatis: { n: 'Dramatis', f: 'contrast(1.35) saturate(1.15) brightness(.95)' },
};
export function openPhoto(ui) {
  const g = ui.g; const hud = document.getElementById('hud');
  let filter = 'hangat', frame = true, vign = true;
  const el = document.createElement('div'); el.className = 'photo';
  el.innerHTML = `<div class="phTop">📸 Mode Foto — geser & zoom kamera seperti biasa</div>
    <div class="phFrame ${frame ? 'on' : ''}"></div>
    <div class="phBar">
      <select id="phF">${Object.entries(FILTERS).map(([k, v]) => `<option value="${k}" ${k === filter ? 'selected' : ''}>${v.n}</option>`).join('')}</select>
      <label><input type="checkbox" id="phG" checked> Garis bantu</label>
      <label><input type="checkbox" id="phV" checked> Vinyet</label>
      <button class="btn" id="phShot">📷 Jepret</button>
      <button class="btn ghost" id="phX">Keluar</button>
    </div>`;
  document.body.appendChild(el);
  hud.style.opacity = '0'; hud.style.pointerEvents = 'none';
  const fl = () => g.renderer.domElement.style.filter = FILTERS[filter].f;
  fl();
  el.querySelector('#phF').onchange = (e) => { filter = e.target.value; fl(); };
  el.querySelector('#phG').onchange = (e) => el.querySelector('.phFrame').classList.toggle('on', e.target.checked);
  el.querySelector('#phV').onchange = (e) => { vign = e.target.checked; el.classList.toggle('vig', vign); };
  el.classList.add('vig');
  const close = () => { el.remove(); hud.style.opacity = ''; hud.style.pointerEvents = ''; g.renderer.domElement.style.filter = 'none'; window.removeEventListener('keydown', key); };
  const key = (e) => { if (e.key === 'Escape') close(); if (e.key === 'Enter') jepret(); };
  window.addEventListener('keydown', key);
  el.querySelector('#phX').onclick = close;
  function jepret() {
    requestAnimationFrame(() => {
      g.renderer.render(g.scene, g.camera);
      const src = g.renderer.domElement;
      const cv = document.createElement('canvas'); cv.width = 1280; cv.height = Math.round(1280 * src.height / src.width);
      const cx = cv.getContext('2d'); cx.filter = FILTERS[filter].f === 'none' ? 'none' : FILTERS[filter].f;
      cx.drawImage(src, 0, 0, cv.width, cv.height); cx.filter = 'none';
      if (vign) { const gr = cx.createRadialGradient(cv.width / 2, cv.height / 2, cv.height * 0.35, cv.width / 2, cv.height / 2, cv.height * 0.85); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.45)'); cx.fillStyle = gr; cx.fillRect(0, 0, cv.width, cv.height); }
      cx.fillStyle = 'rgba(255,255,255,.85)'; cx.font = `bold ${Math.round(cv.width / 46)}px "Baloo 2", sans-serif`;
      const W = g.hh.world; const day = Math.floor(W.time / 1440) + 1, jam = `${String(Math.floor((W.time % 1440) / 60)).padStart(2, '0')}.${String(Math.floor(W.time % 60)).padStart(2, '0')}`;
      cx.fillText(`Griya Asri · hari ke-${day} · ${jam}`, 24, cv.height - 24);
      const url = cv.toDataURL('image/jpeg', 0.9);
      close();                       // keluar dulu agar HUD (tempat jendela hasil) terlihat
      ui.sound && ui.sound.shot && ui.sound.shot('type', 0.8);
      const kecil = document.createElement('canvas'); kecil.width = 512; kecil.height = Math.round(512 * cv.height / cv.width);
      kecil.getContext('2d').drawImage(cv, 0, 0, kecil.width, kecil.height);
      ui.modal(`<h2>📷 Hasil jepretan</h2><img class="phShot" src="${url}">
        <p class="muted small">Foto bisa diunduh, atau dipajang di pigura rumah lewat Galeri.</p>
        <div class="mbtns row"><a class="btn" download="griya-asri-hari-${day}.jpg" href="${url}">⬇️ Unduh</a>
        <button class="btn" id="phHang">🖼️ Simpan ke Galeri</button><button class="btn ghost" data-close>Tutup</button></div>`, 'wide');
      document.getElementById('phHang').onclick = () => {
        g.cmd({ c: 'painting', title: `Foto Griya Asri hari ke-${day}`, img: kecil.toDataURL('image/jpeg', 0.85), stats: { strokes: 120, colors: 8, secs: 60, coverage: 1 }, auto: true });
        ui.toast('Foto masuk Galeri — pajang di pigura lewat tombol 🖼️ Galeri', 'good'); ui.closeModal();
      };
    });
  }
  el.querySelector('#phShot').onclick = jepret;
}
