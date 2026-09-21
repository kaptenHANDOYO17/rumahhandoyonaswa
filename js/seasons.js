// ============================================================
//  KALENDER TAHUNAN & 4 MUSIM
//  1 tahun = 12 bulan × 3 dasarian (1 hari game = 1 dasarian ≈ 10 hari kalender)
//  ❄️ Salju (Des–Feb): salju menumpuk, jalan tertutup, boneka salju, kedinginan
//  🌧️ Hujan (Mar–Mei): hujan deras, badai, banjir, damkar menyedot air
//  ☀️ Panas (Jun–Agu): suhu 32–39°C, gelombang panas, tanaman cepat kering
//  🍂 Gugur (Sep–Nov): daun berguguran, tumpukan daun, angin sejuk
// ============================================================
import * as THREE from 'three';
import { MOODLETS, TYPES, HOUSE, PI, clamp } from './data.js';
import { INTER } from './interactions.js';
import { M } from './world.js';
import { CAFE, WARUNG } from './town.js';

export const YEAR_DAYS = 36;
export const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTH_SEASON = ['salju', 'salju', 'hujan', 'hujan', 'hujan', 'panas', 'panas', 'panas', 'gugur', 'gugur', 'gugur', 'salju'];
export const SEASONS = {
  salju: { label: 'Musim Salju', icon: '❄️', color: '#9ecbff', temp: [-6, 2], desc: 'Salju menumpuk, jalan bisa tertutup. Bikin boneka salju, perang bola salju, sekop jalan. Pakai pemanas agar tidak kedinginan.' },
  hujan: { label: 'Musim Hujan', icon: '🌧️', color: '#4d8cf0', temp: [21, 27], desc: 'Hujan deras & badai. Hati-hati banjir! Kuras air atau panggil damkar. Rawan masuk angin.' },
  panas: { label: 'Musim Panas', icon: '☀️', color: '#ffb547', temp: [32, 39], desc: 'Terik & gelombang panas. Nyalakan AC/kipas, minum es, siram tanaman lebih sering, main air.' },
  gugur: { label: 'Musim Gugur', icon: '🍂', color: '#e07b39', temp: [12, 21], desc: 'Daun berguguran & angin sejuk. Sapu tumpukan daun, lompat ke tumpukan daun, jalan-jalan sore.' },
};
export const EVENTS = [
  [0, 0, '🎆', 'Tahun Baru', 'Kembang api malam hari!'], [1, 1, '💝', 'Valentine', 'Hari penuh cinta untuk Handoyo & Naswa'], [3, 2, '👩', 'Hari Kartini', ''],
  [4, 0, '🎂', 'Ulang tahun Handoyo', ''], [5, 1, '💍', 'Anniversary pernikahan', 'Rayakan berdua!'], [7, 1, '🇮🇩', 'HUT RI — lomba 17-an', 'Kembang api & meriah se-RT'],
  [8, 1, '🎂', 'Ulang tahun Naswa', ''], [9, 2, '✊', 'Sumpah Pemuda', ''], [11, 1, '👩‍👧', 'Hari Ibu', 'Bu Ratna mampir?'], [11, 2, '🎄', 'Libur akhir tahun', ''],
];
export function dateOf(time) { const day = Math.floor(time / 1440); const d = ((day % YEAR_DAYS) + YEAR_DAYS) % YEAR_DAYS; return { year: 2026 + Math.floor(day / YEAR_DAYS), month: Math.floor(d / 3), das: d % 3, date: [5, 15, 25][d % 3], day }; }
export const seasonOf = (W) => W.seasonLock || MONTH_SEASON[dateOf(W.time).month];
export const eventToday = (W) => { const D = dateOf(W.time); return EVENTS.find((e) => e[0] === D.month && e[1] === D.das) || null; };
export function tempOf(W) {
  const S = SEASONS[seasonOf(W)]; const h = (W.time % 1440) / 60; const k = (Math.sin(((h - 9) / 24) * PI * 2) + 1) / 2;
  let t = S.temp[0] + (S.temp[1] - S.temp[0]) * k; if (W.heatwave) t += 3; if (W.weather === 'hujan' || W.weather === 'badai') t -= 2; if (W.weather === 'salju') t -= 2;
  return Math.round(t);
}
export const roadBlocked = (W) => (W.roadSnow || 0) > 0.5 || (W.flood || 0) > 0.45;

Object.assign(MOODLETS, {
  kedinginan: { label: 'Kedinginan', emoji: '🥶', val: -12, dur: 90 }, kepanasan: { label: 'Kepanasan', emoji: '🥵', val: -10, dur: 90 },
  kebanjiran: { label: 'Rumah kebanjiran', emoji: '🌊', val: -14, dur: 180 }, jalanTutup: { label: 'Jalan tertutup', emoji: '🚧', val: -5, dur: 120 },
  bonekaSalju: { label: 'Bikin boneka salju', emoji: '⛄', val: 16, dur: 300 }, dedaunan: { label: 'Main di tumpukan daun', emoji: '🍂', val: 12, dur: 240 },
  musimBaru: { label: 'Semangat musim baru', emoji: '🌱', val: 8, dur: 480 }, perayaan: { label: 'Hari spesial!', emoji: '🎉', val: 18, dur: 720 },
  sakit: { label: 'Sedang sakit', emoji: '🤒', val: -25, dur: 1800 }, sembuh: { label: 'Sudah sembuh', emoji: '💊', val: 10, dur: 240 },
  segarAir: { label: 'Seger main air', emoji: '💦', val: 12, dur: 180 },
});

// ---------------- benda & interaksi musiman ----------------
Object.assign(TYPES, {
  snowman: { name: 'Boneka Salju', cat: 'luar', price: 0, w: 0.8, d: 0.8, fixed: true, spots: [{ ax: 0, az: 0.9, yaw: PI }], acts: ['admire'] },
  leafPile: { name: 'Tumpukan Daun', cat: 'luar', price: 0, w: 1.0, d: 1.0, fixed: true, walk: true, spots: [{ ax: 0, az: 0.9, yaw: PI }], acts: ['sapuDaun', 'lompatDaun'] },
});
for (const k of ['gate', 'mailbox']) if (TYPES[k]) for (const a of ['sekopSalju', 'bikinSnowman', 'kurasBanjir', 'mainAir']) if (!TYPES[k].acts.includes(a)) TYPES[k].acts.push(a);
const out = (c) => ({ target: { pos: [-4 + (Math.random() - 0.5) * 3, 12.4] } });
Object.assign(INTER, {
  sekopSalju: { label: 'Sekop salju di jalan', icon: '🧹', check: (c) => ((c.world.roadSnow || 0) > 0.05 ? true : 'Jalan tidak bersalju'),
    build: (c) => ({ steps: [{ ...out(c), anim: 'mop', prop: 'mop', dur: 40, eff: { fun: -0.2, hygiene: -0.5, energy: -0.6 }, label: 'Sekop salju', snd: 'swish', onTick: (x, gm) => { x.g.world.roadSnow = Math.max(0, x.g.world.roadSnow - gm * 0.012); x.sim.xp('bugar', gm * 0.3); }, onDone: (x) => { x.g.addFam(5); x.g.toast(`${x.sim.name} menyekop salju. Jalan ${roadBlocked(x.g.world) ? 'masih tertutup, bantu lagi!' : 'sudah bisa dilewati! 🚗'}`, 'good'); } }] }) },
  bikinSnowman: { label: 'Bikin boneka salju ⛄', icon: '⛄', check: (c) => ((c.world.snow || 0) > 0.3 ? true : 'Saljunya belum cukup tebal'),
    build: (c) => ({ steps: [{ target: { pos: [-8 + Math.random() * 6, 8.5 + Math.random() * 1.5] }, anim: 'bend', dur: 25, eff: { fun: 2 }, label: 'Bikin boneka salju', onTick: (x, gm) => x.sim.xp('kreatif', gm * 0.3),
      onDone: (x) => { const W = x.g.world; if (W.objects.filter((o) => o.type === 'snowman').length < 4) { W.objects.push({ id: W.nextId++, type: 'snowman', x: x.sim.x, z: x.sim.z - 0.8, rot: 0, lvl: 0, s: {} }); W.objVer++; x.g.rebuildNav(); } x.sim.mood('bonekaSalju'); x.g.addFam(10); } }] }) },
  admire: { label: 'Foto bareng boneka salju', icon: '📸', build: (c) => ({ steps: [{ target: { obj: c.obj.id }, anim: 'phone', dur: 4, eff: { fun: 1.5 }, onDone: (x) => x.sim.mood('bonekaSalju') }] }) },
  kurasBanjir: { label: 'Kuras & sedot air banjir', icon: '🪣', check: (c) => ((c.world.flood || 0) > 0.05 ? true : 'Tidak banjir'),
    build: (c) => ({ steps: [{ target: { pos: [-4, 9] }, anim: 'mop', prop: 'mop', dur: 40, eff: { hygiene: -1, energy: -0.6 }, label: 'Kuras banjir', snd: 'splash', onTick: (x, gm) => { x.g.world.flood = Math.max(0, x.g.world.flood - gm * 0.006); }, onDone: (x) => { x.g.addFam(5); x.g.toast(`${x.sim.name} membantu menguras banjir 🌊`, 'good'); } }] }) },
  mainAir: { label: 'Main air pakai selang', icon: '💦', check: (c) => (seasonOf(c.world) === 'panas' ? true : 'Paling seru saat musim panas'),
    build: (c) => ({ steps: [{ target: { pos: [-6, 8.5] }, anim: 'water', prop: 'wateringCan', dur: 15, eff: { fun: 2.2, hygiene: 1 }, snd: 'tap', label: 'Main air', onDone: (x) => x.sim.mood('segarAir') }] }) },
  sapuDaun: { label: 'Sapu tumpukan daun', icon: '🍂', build: (c) => ({ steps: [{ target: { obj: c.obj.id }, anim: 'mop', prop: 'mop', dur: 12, eff: { energy: -0.4 }, snd: 'swish', label: 'Sapu daun', onDone: (x) => { const W = x.g.world; W.objects = W.objects.filter((o) => o.id !== x.obj.id); W.objVer++; x.g.rebuildNav(); x.g.addFam(3); } }] }) },
  lompatDaun: { label: 'Lompat ke tumpukan daun', icon: '🤸', build: (c) => ({ steps: [{ target: { obj: c.obj.id }, anim: 'dance', dur: 6, eff: { fun: 3 }, snd: 'swish', label: 'Lompat ke daun', onDone: (x) => { x.sim.mood('dedaunan'); x.g.easter && x.g.easter('lompatDaun', { sim: x.sim }); } }] }) },
});

// ---------------- simulasi musim (host) ----------------
const inHouse = (s) => s.x > HOUSE.minX && s.x < HOUSE.maxX && s.z > HOUSE.minZ && s.z < HOUSE.maxZ;
export function installSeasons(hh) {
  const W = hh.world;
  for (const k of ['snow', 'roadSnow', 'flood', 'leafLevel']) if (W[k] == null) W[k] = 0;
  hh.roadBlocked = () => roadBlocked(hh.world);
  for (const k of ['workCar', 'workOjol']) { const I = INTER[k]; if (I && !I._season) { const ck = I.check; I._season = true; I.check = (c) => (roadBlocked(c.world) ? `Jalan tertutup ${(c.world.roadSnow || 0) > 0.5 ? 'salju — sekop dulu' : 'banjir'}! Kerja remote saja (WFH)` : ck(c)); } }
  hh.seasonHour = (hr) => seasonHour(hh, hr);
  hh.seasonMinute = (m) => seasonMinute(hh, m);
}
function seasonHour(hh, hr) {
  const W = hh.world, S = seasonOf(W); const was = W.weather;
  if (W.lastSeason !== S) { if (W.lastSeason) { hh.toast(`${SEASONS[S].icon} ${SEASONS[S].label} tiba! ${SEASONS[S].desc}`, 'info', true); for (const h of hh.humans()) h.mood('musimBaru'); } W.lastSeason = S; }
  if (W.weatherLeft > 0) W.weatherLeft--;
  if (W.weatherLeft <= 0 && W.weather !== 'cerah') { W.weather = 'cerah'; }
  if (W.weather === 'cerah') {
    const r = Math.random();
    if (S === 'salju' && r < 0.3) { W.weather = 'salju'; W.weatherLeft = 1 + Math.floor(Math.random() * 4); }
    if (S === 'hujan' && r < 0.35) { W.weather = Math.random() < 0.3 ? 'badai' : 'hujan'; W.weatherLeft = 1 + Math.floor(Math.random() * 4); }
    if (S === 'gugur' && r < 0.08) { W.weather = 'hujan'; W.weatherLeft = 1 + Math.floor(Math.random() * 2); }
    if (S === 'panas' && r < 0.03) { W.weather = 'hujan'; W.weatherLeft = 1; }
  }
  if (was !== W.weather) {
    const msg = { salju: '❄️ Salju mulai turun… jalanan bisa tertutup!', hujan: '🌧️ Hujan turun', badai: '⛈️ Hujan badai! Waspada banjir', cerah: was === 'salju' ? 'Salju berhenti turun ☁️' : 'Cuaca kembali cerah 🌤️' }[W.weather];
    if (msg) hh.toast(msg, W.weather === 'badai' ? 'bad' : 'info');
  }
  if (hr === 6) { W.heatwave = S === 'panas' && Math.random() < 0.35; if (W.heatwave) hh.toast('🥵 Gelombang panas hari ini! Suhu bisa tembus 40°C — nyalakan AC & banyak minum', 'bad', true);
    const E = eventToday(W); if (E) { hh.toast(`${E[2]} Hari ini: ${E[3]}! ${E[4]}`, 'good', true); for (const h of hh.humans()) h.mood('perayaan'); hh.addFam(15); }
    const D = dateOf(W.time); if (D.month === 0 && D.das === 0 && D.day > 0) hh.toast(`🎆 Selamat Tahun Baru ${D.year}!`, 'good', true);
  }
  // sakit musiman
  for (const h of hh.humans()) if (!h.moods.some((q) => q.k === "sakit") && Math.random() < ({ salju: 0.012, hujan: 0.01, panas: 0.006, gugur: 0.004 }[S])) { h.mood('sakit'); hh.toast(`🤒 ${h.name} ${S === 'panas' ? 'kena heatstroke' : 'masuk angin & demam'}. Panggil dokter lewat tombol 🚨 Darurat, atau istirahat tidur.`, 'bad', true); }
  // daun gugur
  if (S === 'gugur' && W.objects.filter((o) => o.type === 'leafPile').length < 7 && Math.random() < 0.5) {
    const x = -11 + Math.random() * 22, z = Math.random() < 0.5 ? -10 + Math.random() * 3.5 : 7 + Math.random() * 3.5;
    if (hh.nav.okXZ(x, z)) { W.objects.push({ id: W.nextId++, type: 'leafPile', x, z, rot: Math.random() * 3, lvl: 0, s: {} }); W.objVer++; hh.rebuildNav(); }
  }
  if (S !== 'gugur' && W.objects.some((o) => o.type === 'leafPile') && Math.random() < 0.3) { W.objects = W.objects.filter((o) => o.type !== 'leafPile'); W.objVer++; hh.rebuildNav(); }
  if (S !== 'salju' && W.objects.some((o) => o.type === 'snowman') && W.snow < 0.1) { W.objects = W.objects.filter((o) => o.type !== 'snowman'); W.objVer++; hh.rebuildNav(); hh.toast('Boneka saljunya meleleh… 💧⛄', 'info'); }
  return true;
}
function seasonMinute(hh, m) {
  const W = hh.world, S = seasonOf(W); const T = tempOf(W); const wasBlocked = roadBlocked(W);
  if (W.weather === 'salju') { W.snow = Math.min(1, W.snow + 0.004); W.roadSnow = Math.min(1, W.roadSnow + 0.0016); }
  else if (S !== 'salju' || T > 1) { const melt = S === 'panas' ? 0.01 : 0.002; W.snow = Math.max(0, W.snow - melt); W.roadSnow = Math.max(0, W.roadSnow - melt); }
  if (W.weather === 'badai') W.flood = Math.min(1, W.flood + 0.005); else if (W.weather === 'hujan' && S === 'hujan') W.flood = Math.min(1, W.flood + 0.0012); else W.flood = Math.max(0, W.flood - 0.0025);
  W.leafLevel = S === 'gugur' ? Math.min(1, W.leafLevel + 0.001) : Math.max(0, W.leafLevel - 0.004);
  // petugas DPU & warga kerja bakti membersihkan jalan kalau terlalu lama tertutup
  W.blockT = roadBlocked(W) ? (W.blockT || 0) + 1 : 0;
  if (W.blockT > 150 && W.weather !== 'salju') { W.roadSnow = Math.max(0, W.roadSnow - 0.006); if (W.blockT === 151) hh.toast('🚜 Truk DPU & warga mulai membersihkan salju di jalan komplek', 'info'); }
  const blocked = roadBlocked(W);
  if (blocked !== wasBlocked) { hh.toast(blocked ? `🚧 Jalan komplek tertutup ${W.roadSnow > 0.5 ? 'salju tebal' : 'banjir'}! Pedagang & kurir tidak bisa lewat.` : '✅ Jalan komplek sudah bisa dilewati lagi', blocked ? 'bad' : 'good', true); if (blocked) { for (const h of hh.humans()) h.mood('jalanTutup'); hh.callService && hh.callService('police', W.roadSnow > 0.5 ? 'tutupSalju' : 'tutupBanjir', true); } }
  if (W.flood > 0.6 && !W._floodWarned) { W._floodWarned = true; hh.toast('🌊 BANJIR! Air masuk halaman. Kuras air di pagar atau panggil damkar lewat 🚨 Darurat', 'bad', true); for (const h of hh.humans()) h.mood('kebanjiran'); hh.callService && hh.callService('fire', 'banjir', true); }
  if (W.flood < 0.2) W._floodWarned = false;
  if (m % 15 !== 0) return;
  const hasItem = (types) => W.objects.some((o) => types.includes(o.type));
  const ac = hasItem(['acUnit', 'fanStand']), heat = hasItem(['heater', 'fireplace']);
  for (const h of hh.humans()) {
    if (h.hidden) continue; const inside = inHouse(h);
    if (T <= 5 && !(inside && heat)) { h.mood('kedinginan'); h.addNeed('energy', -0.6); }
    if (T >= 34 && !(inside && ac)) { h.mood('kepanasan'); h.addNeed('hygiene', -0.8); h.addNeed('energy', -0.4); }
    if (!inside && (W.weather === 'hujan' || W.weather === 'badai')) h.addNeed('hygiene', -0.6);
    if (h.moods.some((q) => q.k === "sakit")) { h.addNeed('energy', -0.5); h.addNeed('fun', -0.3); if (h.cur && h.cur.key === 'sleep' && Math.random() < 0.03) { h.clearMood('sakit'); h.mood('sembuh'); hh.toast(`${h.name} sudah sembuh setelah istirahat 💊`, 'good'); } }
  }
  if (S === 'panas') for (const o of W.objects) if (o.s && o.s.water != null) o.s.water = Math.max(0, o.s.water - 0.4);
}

// ---------------- visual musim (klien) ----------------
function holedPlane(y, color, opacity) {
  const shp = new THREE.Shape(); shp.moveTo(-22, -20); shp.lineTo(22, -20); shp.lineTo(22, 20); shp.lineTo(-22, 20); shp.lineTo(-22, -20);
  const hole = (x0, z0, x1, z1) => { const h = new THREE.Path(); h.moveTo(x0, -z0); h.lineTo(x0, -z1); h.lineTo(x1, -z1); h.lineTo(x1, -z0); h.lineTo(x0, -z0); shp.holes.push(h); };
  hole(HOUSE.minX - 0.1, HOUSE.minZ - 0.1, HOUSE.maxX + 0.1, HOUSE.maxZ + 0.1); hole(CAFE.minX, CAFE.minZ, CAFE.maxX, CAFE.maxZ); hole(WARUNG.minX, WARUNG.minZ, WARUNG.maxX, WARUNG.maxZ);
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shp), new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: color === '#ffffff' ? 1 : 0.15, metalness: 0, depthWrite: false }));
  m.rotation.x = -PI / 2; m.position.y = y; m.receiveShadow = true; m.renderOrder = 2; return m;
}
export function buildSeasonFX(game) {
  const scene = game.scene; const F = {};
  F.snowCover = holedPlane(0.035, '#ffffff', 0); scene.add(F.snowCover);
  F.floodWater = holedPlane(0.03, '#5f8ea8', 0); F.floodWater.visible = false; scene.add(F.floodWater);
  // salju turun
  const N = 2200, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 60; pos[i * 3 + 1] = Math.random() * 25; pos[i * 3 + 2] = (Math.random() - 0.5) * 60; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  F.snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 0.14, transparent: true, opacity: 0.9, depthWrite: false })); F.snow.visible = false; scene.add(F.snow);
  // daun berjatuhan
  const L = 220; const leafM = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.8 });
  F.leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.1), leafM, L); F.leaves.visible = false; F.leafData = [];
  const col = new THREE.Color(); for (let i = 0; i < L; i++) { F.leafData.push({ x: (Math.random() - 0.5) * 50, y: Math.random() * 12, z: (Math.random() - 0.5) * 50, r: Math.random() * 7, s: 0.4 + Math.random() * 0.6 }); F.leaves.setColorAt(i, col.set(['#e07b39', '#c0392b', '#f1c40f', '#a0522d', '#d35400'][i % 5])); }
  scene.add(F.leaves);
  // daun di tanah
  const G = 700; F.ground = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.2, 0.13), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 1 }), G);
  const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < G; i++) { let x, z; do { x = -21 + Math.random() * 42; z = -18 + Math.random() * 36; } while (x > HOUSE.minX && x < HOUSE.maxX && z > HOUSE.minZ && z < HOUSE.maxZ); e.set(-PI / 2, 0, Math.random() * 7); q.setFromEuler(e); mt.compose(new THREE.Vector3(x, 0.04, z), q, new THREE.Vector3(1, 1, 1)); F.ground.setMatrixAt(i, mt); F.ground.setColorAt(i, col.set(['#c0692d', '#a0522d', '#d4a017', '#8b3a1f'][i % 4])); }
  F.ground.count = 0; scene.add(F.ground);
  // kembang api
  F.fw = []; F.fwT = 0;
  // material daun pohon (sama persis dengan pembuat pohon → ikut berubah warna)
  F.treeMats = ['#3f7a35', '#4b8a3c', '#356b2d'].map((c) => { const m = M(c, 0.85, 0, { flatShading: true }); m.userData.base = m.userData.base || m.color.clone(); return m; });
  F.roofMats = []; if (game.W.roof) game.W.roof.traverse((o) => { if (o.isMesh && o.material && !F.roofMats.includes(o.material)) { o.material.userData.base = o.material.color.clone(); F.roofMats.push(o.material); } });
  F.grassMat = game.W.ground && game.W.ground.material; if (F.grassMat) F.grassMat.userData.base = F.grassMat.color.clone();
  // barikade jalan ditutup
  const B = new THREE.Group(); B.visible = false; scene.add(B); F.barrier = B;
  for (const x of [-7, -5, -3, -1]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 12), M('#ff6d00', 0.6)); c.position.set(x, 0.28, 14.2); B.add(c); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.08, 12), M('#ffffff', 0.5)); s.position.set(x, 0.33, 14.2); B.add(s); }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.25, 0.08), M('#ffffff', 0.5)); bar.position.set(-4, 0.85, 14.6); B.add(bar);
  for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, 0.09), M('#e53935', 0.5)); s.position.set(-5.4 + i * 0.7, 0.85, 14.6); s.rotation.z = 0.5; B.add(s); }
  for (const x of [-5.6, -2.4]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, 0.06), M('#333')); l.position.set(x, 0.42, 14.6); B.add(l); }
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const cx = cv.getContext('2d'); cx.fillStyle = '#ffd600'; cx.fillRect(0, 0, 512, 128); cx.fillStyle = '#111'; cx.font = 'bold 54px sans-serif'; cx.textAlign = 'center'; cx.fillText('⚠ JALAN DITUTUP', 256, 82);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.45), new THREE.MeshStandardMaterial({ map: tx })); sign.position.set(-4, 1.35, 14.62); B.add(sign);
  return F;
}
const TINT = { salju: '#eef3f7', gugur: '#d9822b', panas: '#8a9a3a', hujan: null };
export function updateSeasonFX(F, game, dt, t) {
  if (!F) return; const W = game.hh.world, S = seasonOf(W); const tg = game.controls.target;
  F.snowCover.material.opacity = Math.min(0.96, (W.snow || 0) * 1.1); F.snowCover.visible = W.snow > 0.02;
  F.floodWater.visible = W.flood > 0.02; F.floodWater.material.opacity = 0.35 + W.flood * 0.45; F.floodWater.position.y = 0.03 + W.flood * 0.32;
  F.barrier.visible = roadBlocked(W);
  // salju turun
  F.snow.visible = W.weather === 'salju';
  if (F.snow.visible) { const a = F.snow.geometry.attributes.position; for (let i = 0; i < a.count; i++) { let y = a.getY(i) - dt * 1.4; if (y < 0) y = 25; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t + i) * dt * 0.3); } a.needsUpdate = true; F.snow.position.set(tg.x, 0, tg.z); }
  // daun jatuh
  F.leaves.visible = S === 'gugur';
  if (F.leaves.visible) { const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); F.leafData.forEach((d, i) => { d.y -= dt * d.s; d.x += Math.sin(t * 0.7 + i) * dt * 0.6 + dt * 0.4; d.r += dt * 2; if (d.y < 0.05) { d.y = 8 + Math.random() * 5; d.x = tg.x + (Math.random() - 0.5) * 50; d.z = tg.z + (Math.random() - 0.5) * 50; } e.set(d.r, d.r * 0.7, d.r * 0.3); q.setFromEuler(e); m.compose(new THREE.Vector3(d.x, d.y, d.z), q, new THREE.Vector3(1, 1, 1)); F.leaves.setMatrixAt(i, m); }); F.leaves.instanceMatrix.needsUpdate = true; }
  F.ground.count = Math.round(700 * (W.leafLevel || 0));
  // warna pohon, rumput, atap
  const tint = TINT[S]; const k = Math.min(1, dt * 0.8);
  const snowK = W.snow || 0;
  for (const m of F.treeMats) { const target = S === 'salju' ? m.userData.base.clone().lerp(new THREE.Color('#f2f6fa'), 0.35 + snowK * 0.55) : tint ? m.userData.base.clone().lerp(new THREE.Color(tint), S === 'gugur' ? 0.75 : 0.35) : m.userData.base; m.color.lerp(target, k); }
  if (F.grassMat) { const target = S === 'panas' ? F.grassMat.userData.base.clone().lerp(new THREE.Color('#c9b458'), 0.45) : S === 'gugur' ? F.grassMat.userData.base.clone().lerp(new THREE.Color('#b58a3a'), 0.35) : F.grassMat.userData.base; F.grassMat.color.lerp(target, k); }
  for (const m of F.roofMats) m.color.lerp(m.userData.base.clone().lerp(new THREE.Color('#ffffff'), snowK * 0.8), k);
  // kembang api (Tahun Baru & HUT RI malam hari)
  const E = eventToday(W); const h = (W.time % 1440) / 60;
  if (E && (E[3].startsWith('Tahun Baru') || E[3].startsWith('HUT RI')) && (h >= 19 || h < 1)) {
    F.fwT -= dt; if (F.fwT <= 0) { F.fwT = 0.6 + Math.random() * 0.8; const n = 90, p = new Float32Array(n * 3), v = []; const ox = -15 + Math.random() * 30, oy = 14 + Math.random() * 6, oz = 20 + Math.random() * 6; for (let i = 0; i < n; i++) { p[i * 3] = ox; p[i * 3 + 1] = oy; p[i * 3 + 2] = oz; const a = Math.random() * 7, b = Math.acos(Math.random() * 2 - 1), s = 4 + Math.random() * 2; v.push([Math.sin(b) * Math.cos(a) * s, Math.cos(b) * s, Math.sin(b) * Math.sin(a) * s]); }
      const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.BufferAttribute(p, 3)); const pts = new THREE.Points(g2, new THREE.PointsMaterial({ color: ['#ff5252', '#ffd740', '#69f0ae', '#40c4ff', '#e040fb', '#ffffff'][Math.floor(Math.random() * 6)], size: 0.35, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); game.scene.add(pts); F.fw.push({ pts, v, life: 1.8 }); game.ui.sound && game.ui.sound.shot && game.ui.sound.shot('thump', 0.5); }
  }
  for (const f of F.fw) { f.life -= dt; const a = f.pts.geometry.attributes.position; for (let i = 0; i < a.count; i++) { f.v[i][1] -= dt * 3; a.setXYZ(i, a.getX(i) + f.v[i][0] * dt, a.getY(i) + f.v[i][1] * dt, a.getZ(i) + f.v[i][2] * dt); } a.needsUpdate = true; f.pts.material.opacity = Math.max(0, f.life / 1.8); if (f.life <= 0) { game.scene.remove(f.pts); f.pts.geometry.dispose(); } }
  F.fw = F.fw.filter((f) => f.life > 0);
}
export function skyTint(W) { const S = seasonOf(W); return W.weather === 'salju' ? '#cfd9e3' : S === 'panas' ? '#8fd0ff' : S === 'gugur' ? '#e8b98a' : null; }

// ---------------- UI: chip musim & kalender ----------------
export function seasonChipText(W) { const D = dateOf(W.time); const S = SEASONS[seasonOf(W)]; return `${S.icon} ${D.date} ${MONTHS[D.month]} ${D.year} · ${tempOf(W)}°C${W.seasonLock ? ' 🔒' : ''}`; }
export function openCalendar(ui) {
  const g = ui.g, W = g.hh.world; const D = dateOf(W.time); const S = seasonOf(W);
  const m = ui.modal(`<h2>📅 Kalender ${D.year}</h2>
    <p class="muted small">1 tahun game = 36 hari (tiap bulan 3 dasarian: tgl 1–10, 11–20, 21–31). Sekarang: <b>${D.date} ${MONTHS[D.month]} ${D.year}</b> · ${SEASONS[S].icon} ${SEASONS[S].label} · ${tempOf(W)}°C${W.heatwave ? ' · 🥵 gelombang panas' : ''}${roadBlocked(W) ? ' · 🚧 jalan ditutup' : ''}</p>
    <div class="cal">${MONTHS.map((mn, mi) => { const sk = MONTH_SEASON[mi]; return `<div class="calm ${mi === D.month ? 'now' : ''}" style="--sc:${SEASONS[sk].color}"><b>${SEASONS[sk].icon} ${mn}</b>${[0, 1, 2].map((d) => { const ev = EVENTS.find((e) => e[0] === mi && e[1] === d); return `<div class="cald ${mi === D.month && d === D.das ? 'today' : ''}"><span>${[1, 11, 21][d]}–${[10, 20, mi === 1 ? 28 : 30][d]}</span>${ev ? `<em title="${ev[4]}">${ev[2]} ${ev[3]}</em>` : ''}</div>`; }).join('')}</div>`; }).join('')}</div>
    <div class="calS">${Object.entries(SEASONS).map(([k, v]) => `<button class="btn ${W.seasonLock === k ? '' : 'ghost'} sm" data-lock="${k}">${v.icon} ${v.label}</button>`).join('')}<button class="btn ${W.seasonLock ? 'ghost' : ''} sm" data-lock="">🔄 Otomatis ikut kalender</button></div>
    <p class="muted small">${SEASONS[S].desc}</p>
    <div class="mbtns row"><button class="btn ghost" data-close>Tutup</button></div>`, 'wide');
  m.querySelector('.calS').onclick = (e) => { const b = e.target.closest('[data-lock]'); if (!b) return; g.cmd({ c: 'season', lock: b.dataset.lock || null }); setTimeout(() => openCalendar(ui), 250); };
}
