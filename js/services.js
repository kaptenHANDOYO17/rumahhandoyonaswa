// ============================================================
//  LAYANAN DARURAT: 🚓 Polisi (110) · 🚒 Damkar (113) · 🩺 Dokter (kunjungan rumah)
//  Kejadian: kebakaran, kemalingan, banjir, jalan tertutup salju, warga sakit
// ============================================================
import * as THREE from 'three';
import { TYPES, MOODLETS, HOUSE, PI, fmtRp, clamp } from './data.js';
import { NPCS } from './people.js';
import { INTER } from './interactions.js';
import { M } from './world.js';

export const SERVICES = {
  police: { name: 'Polisi', icon: '🚓', phone: '110', team: ['Bripka Joko', 'Briptu Sari'] },
  fire: { name: 'Pemadam Kebakaran', icon: '🚒', phone: '113', team: ['Pak Bambang', 'Mas Andi'] },
  doctor: { name: 'Dokter keluarga', icon: '🩺', phone: 'dr. Rani', team: ['dr. Rani'], fee: 300000 },
};
Object.assign(NPCS, {
  'Bripka Joko': { species: 'npc', role: 'police', trait: 'Polisi Polsek setempat, tegas tapi ramah, hobi ngopi', home: 'E', routine: 'none', outfit: { skin: '#9a6a44', hair: '#141414', hairStyle: 'short', shirt: '#6d5a3a', pants: '#4a3b26', dress: false, height: 1.03 } },
  'Briptu Sari': { species: 'npc', role: 'police', trait: 'Polwan, teliti mencatat laporan warga', home: 'E', routine: 'none', outfit: { skin: '#c99670', hair: '#2a1a12', hairStyle: 'hijab', shirt: '#6d5a3a', pants: '#4a3b26', dress: false, height: 0.96 } },
  'Pak Bambang': { species: 'npc', role: 'fire', trait: 'Komandan regu Damkar, sudah 20 tahun memadamkan api', home: 'E', routine: 'none', outfit: { skin: '#8a5a38', hair: '#616161', hairStyle: 'short', shirt: '#d84315', pants: '#263238', dress: false, height: 1.04, wide: 1.1 } },
  'Mas Andi': { species: 'npc', role: 'fire', trait: 'Petugas Damkar muda, jago evakuasi kucing dari pohon', home: 'E', routine: 'none', outfit: { skin: '#b07a52', hair: '#141414', hairStyle: 'short', shirt: '#d84315', pants: '#263238', dress: false, height: 1.02 } },
  'dr. Rani': { species: 'npc', role: 'doctor', trait: 'Dokter umum keluarga, lembut & teliti', home: 'W', routine: 'none', outfit: { skin: '#d2a07c', hair: '#2a1a12', hairStyle: 'hijab', shirt: '#f5f5f5', pants: '#1565c0', dress: true, height: 0.97 } },
});
Object.assign(MOODLETS, {
  kebakaran: { label: 'Panik, ada kebakaran!', emoji: '🔥', val: -25, dur: 120 }, kemalingan: { label: 'Rumah kemalingan', emoji: '🦹', val: -18, dur: 600 },
  aman: { label: 'Merasa aman', emoji: '🛡️', val: 10, dur: 360 },
});
// APAR (alat pemadam api ringan) — bisa dibeli
TYPES.apar = { name: 'Tabung APAR (pemadam api)', cat: 'dapur', price: 450000, w: 0.35, d: 0.35, buy: true, icon: '🧯', spots: [{ ax: 0, az: 0.6, yaw: PI }], acts: ['pakaiApar'],
  parts: [['c', 0.1, 0.1, 0.55, 0, 0.3, 0, '#d32f2f'], ['c', 0.04, 0.05, 0.08, 0, 0.62, 0, '#212121'], ['b', 0.14, 0.03, 0.03, 0.05, 0.66, 0, '#212121'], ['b', 0.25, 0.02, 0.02, 0, 0.9, 0.02, '#9e9e9e']] };
INTER.pakaiApar = { label: 'Padamkan api pakai APAR', icon: '🧯', check: (c) => (c.world.fire ? true : 'Tidak ada kebakaran'),
  build: (c) => ({ steps: [{ target: { obj: c.obj.id }, anim: 'grab', dur: 1, label: 'Ambil APAR' }, { target: { pos: [c.world.fire.x + 1.1, c.world.fire.z + 0.3] }, anim: 'water', prop: 'wateringCan', dur: 8, label: 'Menyemprot api', snd: 'shower', onTick: (x, gm) => { const F = x.g.world.fire; if (F) { F.level -= gm * 0.08; if (F.level <= 0) extinguish(x.g, `${x.sim.name} berhasil memadamkan api pakai APAR! 🧯`); } } }] }) };

// ---------------- panggilan ----------------
export function installServices(hh) {
  const W = hh.world; W.calls = W.calls || []; W.vehicles = W.vehicles || {};
  hh.callService = (svc, reason, auto) => callService(hh, svc, reason, auto);
  hh.servicesMinute = (m) => servicesMinute(hh, m);
}
function callService(hh, svc, reason, auto) {
  const W = hh.world, S = SERVICES[svc]; if (!S) return;
  if (W.calls.some((c) => c.svc === svc && c.stage < 3)) { if (!auto) hh.toast(`${S.icon} ${S.name} sudah dalam perjalanan`, 'info'); return; }
  if (!reason) reason = svc === 'fire' ? (W.fire ? 'kebakaran' : W.flood > 0.2 ? 'banjir' : 'cek') : svc === 'doctor' ? 'sakit' : W.theft && !W.theft.done ? 'maling' : (hh.roadBlocked && hh.roadBlocked()) ? 'tutupJalan' : 'patroli';
  const delay = (svc === 'fire' ? 10 : 18) + Math.random() * 15 + ((hh.roadBlocked && hh.roadBlocked() && svc !== 'fire') ? 20 : 0);
  W.calls.push({ id: Date.now() % 1e9, svc, reason, stage: 0, eta: W.time + delay, t: W.time });
  hh.toast(`📞 ${auto ? 'Warga menelepon' : 'Menelepon'} ${S.name} ${S.phone}… ${S.icon} tiba ±${Math.round(delay)} menit`, 'info', true); hh.sfx('sms');
}
const SPAWN = [21, 13.3], VEH = { police: [-8.6, 13.4], fire: [-2.2, 13.4], doctor: [1.9, 13.4] };
function servicesMinute(hh, m) {
  const W = hh.world, hr = Math.floor((m % 1440) / 60);
  // kebakaran membesar
  const F = W.fire;
  if (F) {
    F.level = Math.min(1.2, F.level + 0.0035 * (W.calls.some((c) => c.svc === 'fire' && c.stage === 2) ? 0 : 1));
    if (m % 10 === 0) for (const h of hh.humans()) if (!h.hidden) h.mood('kebakaran');
    if (!F.called && W.time - F.t > 15) { F.called = true; hh.callService('fire', 'kebakaran', true); }
    if (F.level >= 1.2) { const o = W.objects.find((x) => x.id === F.objId); if (o) { W.objects = W.objects.filter((x) => x !== o); W.objVer++; hh.rebuildNav(); } hh.op({ o: 'money', d: -5000000, why: 'Kerugian kebakaran' }); extinguish(hh, `🔥 Api padam sendiri setelah menghanguskan ${o ? TYPES[o.type].name : 'barang'}. Kerugian Rp 5 juta 😢`, true); }
  }
  // kejadian baru (tiap jam)
  if (m % 60 === 0) {
    if (!W.fire && Math.random() < (W.lastSeason === 'panas' ? 0.006 : 0.003)) {
      const cand = W.objects.filter((o) => (o.lvl || 0) === 0 && ['stove', 'tv', 'desk', 'washer', 'bigTv', 'gamingDesk', 'bbq', 'microwave'].includes(o.type));
      const o = cand[Math.floor(Math.random() * cand.length)];
      if (o) { W.fire = { objId: o.id, x: o.x, z: o.z, level: 0.25, t: W.time }; hh.toast(`🔥 KEBAKARAN di ${TYPES[o.type].name}! ${W.lastSeason === 'panas' ? 'Korsleting karena panas.' : 'Korsleting listrik.'} Pakai APAR atau panggil Damkar lewat 🚨 Darurat!`, 'bad', true); hh.sfx('bad'); }
    }
    if (hr === 2 && !W.theft && Math.random() < 0.05) {
      const v = hh.humans().sort((a, b) => b.wallet - a.wallet)[0]; const amt = Math.round((3 + Math.random() * 12)) * 1000000;
      hh.op({ o: 'money', d: -amt, why: 'Kemalingan', sim: v.name }); W.theft = { amount: amt, from: v.name, t: W.time, done: false };
    }
    if (hr === 6 && W.theft && !W.theft.told) { W.theft.told = true; hh.toast(`🦹 KEMALINGAN! Uang ${W.theft.from} ${fmtRp(W.theft.amount)} raib tadi malam. Lapor polisi (🚨 Darurat) — makin cepat, makin besar peluang tertangkap!`, 'bad', true); for (const h of hh.humans()) h.mood('kemalingan'); }
    if (W.theft && W.time - W.theft.t > 1440 * 2) W.theft = null;
    if ((hr === 21 || hr === 22) && Math.random() < 0.25) callService(hh, 'police', 'patroli', true);
  }
  // perjalanan petugas
  for (const C of W.calls) {
    const S = SERVICES[C.svc]; const team = S.team.map((n) => hh.others[n]).filter(Boolean).slice(0, C.svc === 'doctor' ? 1 : 2);
    if (C.stage === 0 && W.time >= C.eta) {
      C.stage = 1; W.vehicles[C.svc] = true; hh.sfx('siren');
      const tgt = target(hh, C);
      team.forEach((s, i) => { s.hidden = false; s.away = false; s.queue = []; s.x = VEH[C.svc][0] + i * 0.8; s.z = VEH[C.svc][1] - 0.8; s.lvl = 0; s.y = 0; s.plan = { mode: 'service' }; hh.queueAct(s, 'go', null, { pos: [tgt[0] + i * 0.9, tgt[1] + (i ? 0.6 : 0)] }); });
      hh.toast(`${S.icon} ${S.name} tiba! ${team.map((s) => s.name).join(' & ')} ${C.reason === 'patroli' ? 'patroli keliling komplek' : 'segera menangani'}`, 'info', true);
      C.work = 0;
    } else if (C.stage === 1 && team.every((s) => !s.queue.length)) {
      C.work++; const anim = C.svc === 'fire' ? 'water' : C.svc === 'doctor' ? 'grab' : 'talk';
      team.forEach((s) => { s.anim = anim; s.prop = C.svc === 'fire' ? 'wateringCan' : null; });
      if (C.svc === 'fire' && W.fire) { W.fire.level -= 0.06; if (W.fire.level <= 0) { extinguish(hh, `🚒 ${S.team[0]}: "Api sudah padam, aman Pak/Bu!" Terima kasih Damkar! 🙏`); C.stage = 2; } }
      else if (C.svc === 'fire' && W.flood > 0.05) { W.flood = Math.max(0, W.flood - 0.03); if (W.flood <= 0.06) { hh.toast('🚒 Damkar selesai menyedot banjir. Halaman kering lagi 🌤️', 'good', true); C.stage = 2; } }
      else if (C.svc === 'fire') C.stage = C.work > 8 ? 2 : 1;
      if (C.svc === 'doctor') { const p = hh.humans().find((h) => h.moods.some((q) => q.k === "sakit")); if (C.work > 10 || !p) { if (p) { p.clearMood('sakit'); p.mood('sembuh'); hh.op({ o: 'money', d: -S.fee, why: 'Kunjungan dokter', sim: p.name }); hh.toast(`🩺 dr. Rani memeriksa ${p.name}: "Istirahat cukup, minum obatnya ya." ${p.name} sembuh 💊 (${fmtRp(S.fee)})`, 'good', true); } else hh.toast('🩺 dr. Rani: "Alhamdulillah semua sehat. Jaga pola makan ya!"', 'good'); C.stage = 2; } }
      if (C.svc === 'police') {
        if (C.reason === 'maling' && W.theft && !W.theft.done && C.work > 15) { W.theft.done = true; const late = W.time - W.theft.t; if (Math.random() < clamp(0.85 - late / 1440, 0.25, 0.85)) { hh.op({ o: 'money', d: W.theft.amount, why: 'Uang kembali (maling tertangkap)', sim: W.theft.from }); hh.toast(`🚓 Maling tertangkap! Uang ${fmtRp(W.theft.amount)} dikembalikan ke ${W.theft.from}. Terima kasih Pak Polisi! 👮`, 'good', true); } else hh.toast('🚓 Laporan dicatat. Polisi akan terus menyelidiki & menambah patroli malam.', 'info', true); for (const h of hh.humans()) h.mood('aman'); C.stage = 2; }
        else if (C.reason.startsWith('tutup')) { if (!(hh.roadBlocked && hh.roadBlocked())) { hh.toast('🚓 Jalan dibuka kembali. Barikade diangkat.', 'good'); C.stage = 2; } }
        else if (C.reason !== 'maling' && C.work > 12) C.stage = 2;
        else if (C.reason === 'maling' && (!W.theft || W.theft.done)) C.stage = 2;
      }
    } else if (C.stage === 2) {
      C.stage = 3; team.forEach((s) => { s.anim = 'idle'; s.prop = null; hh.queueAct(s, 'go', null, { pos: [VEH[C.svc][0], VEH[C.svc][1] - 0.6] }); });
    } else if (C.stage === 3 && team.every((s) => !s.queue.length)) {
      team.forEach((s) => { s.hidden = true; s.away = true; s.x = SPAWN[0]; s.z = SPAWN[1]; s.plan = { mode: 'home' }; }); W.vehicles[C.svc] = false; C.stage = 4;
    }
  }
  W.calls = W.calls.filter((c) => c.stage < 4);
}
function target(hh, C) {
  const W = hh.world;
  if (C.svc === 'fire' && W.fire) return [W.fire.x + 1.2, W.fire.z + 0.8];
  if (C.svc === 'fire') return [-4, 11.8];
  if (C.svc === 'doctor') { const p = hh.humans().find((h) => h.moods.some((q) => q.k === "sakit") && !h.hidden); return p ? [p.x + 0.8, p.z + 0.4] : [-4, 7.2]; }
  if (C.reason && C.reason.startsWith('tutup')) return [-4, 13.9];
  if (C.reason === 'maling') return [-4.6, 7.2];
  return [-12 + Math.random() * 24, 12.6];
}
function extinguish(hh, msg, bad) { hh.world.fire = null; hh.toast(msg, bad ? 'bad' : 'good', true); if (!bad) for (const h of hh.humans()) h.mood('aman'); }

// ---------------- visual: api, kendaraan, sirene ----------------
function vehicle(kind) {
  const g = new THREE.Group(); const body = { police: '#fafafa', fire: '#c62828', doctor: '#fafafa' }[kind];
  const len = kind === 'fire' ? 5.2 : 3.8;
  const b = new THREE.Mesh(new THREE.BoxGeometry(1.8, kind === 'fire' ? 1.7 : 1.1, len), M(body, 0.4, 0.2)); b.position.y = kind === 'fire' ? 1.25 : 0.85; b.castShadow = true; g.add(b);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, kind === 'fire' ? 1.5 : 2), M('#90caf9', 0.1, 0.3)); cab.position.set(0, kind === 'fire' ? 1.7 : 1.6, kind === 'fire' ? len / 2 - 0.9 : -0.1); g.add(cab);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.18, len), M(kind === 'police' ? '#1565c0' : kind === 'doctor' ? '#e53935' : '#ffeb3b', 0.5)); stripe.position.y = kind === 'fire' ? 1.1 : 0.8; g.add(stripe);
  for (const [x, z] of [[-0.85, len / 2 - 0.7], [0.85, len / 2 - 0.7], [-0.85, -len / 2 + 0.7], [0.85, -len / 2 + 0.7]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.25, 16), M('#1a1a1a')); w.rotation.z = PI / 2; w.position.set(x, 0.36, z); g.add(w); }
  if (kind === 'fire') { const lad = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, len * 0.8), M('#bdbdbd', 0.3, 0.8)); lad.position.set(0, 2.2, -0.3); g.add(lad); const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16), M('#ffeb3b')); reel.rotation.z = PI / 2; reel.position.set(0.95, 1.2, -1); g.add(reel); }
  const lights = [M('#ff1744', 0.3, 0, { emissive: '#ff1744', emissiveIntensity: 1, unique: true }), M('#2979ff', 0.3, 0, { emissive: '#2979ff', emissiveIntensity: 1, unique: true })];
  lights.forEach((m, i) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.25), m); l.position.set(i ? 0.3 : -0.3, (kind === 'fire' ? 2.1 : 2.0), kind === 'fire' ? len / 2 - 0.9 : -0.1); g.add(l); });
  if (kind === 'fire' || kind === 'doctor') lights[1].color.set('#ff1744'), lights[1].emissive.set('#ff9100');
  g.userData.lights = lights; g.visible = false; g.rotation.y = PI / 2;
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96; const cx = cv.getContext('2d'); cx.fillStyle = body; cx.fillRect(0, 0, 512, 96); cx.fillStyle = kind === 'fire' ? '#ffffff' : kind === 'police' ? '#0d47a1' : '#c62828'; cx.font = 'bold 60px sans-serif'; cx.textAlign = 'center'; cx.fillText({ police: 'POLISI', fire: 'DAMKAR', doctor: 'AMBULANS' }[kind], 256, 70);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(len * 0.7, 0.35), new THREE.MeshStandardMaterial({ map: tx })); p.position.set(s * 0.91, kind === 'fire' ? 1.45 : 0.95, 0); p.rotation.y = s * PI / 2; g.add(p); }
  return g;
}
export function buildServiceFX(game) {
  const F = { veh: {}, fire: new THREE.Group() };
  for (const k of ['police', 'fire', 'doctor']) { const v = vehicle(k); v.position.set(VEH[k][0], 0, VEH[k][1]); game.scene.add(v); F.veh[k] = v; }
  const flameM = [M('#ff6d00', 0.5, 0, { emissive: '#ff3d00', emissiveIntensity: 1.4, transparent: true, opacity: 0.9, unique: true }), M('#ffd600', 0.5, 0, { emissive: '#ffab00', emissiveIntensity: 1.6, transparent: true, opacity: 0.85, unique: true })];
  F.flames = []; for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 8), flameM[i % 2]); F.fire.add(f); F.flames.push(f); }
  F.smoke = []; for (let i = 0; i < 8; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: '#555', transparent: true, opacity: 0.35, depthWrite: false })); F.fire.add(s); F.smoke.push(s); }
  F.light = new THREE.PointLight('#ff6d00', 0, 8, 1.5); F.light.position.y = 1; F.fire.add(F.light); F.fire.visible = false; game.scene.add(F.fire);
  return F;
}
export function updateServiceFX(F, game, dt, t) {
  if (!F) return; const W = game.hh.world;
  for (const [k, v] of Object.entries(F.veh)) { const on = !!(W.vehicles && W.vehicles[k]); if (on && !v.visible && game.ui.sound && game.ui.sound.ctx) { const S = game.ui.sound; for (let i = 0; i < 3; i++) { S.osc('square', 650, 950, 0.45, 0.02, i * 0.9, ['lowpass', 1800]); S.osc('square', 950, 650, 0.45, 0.02, i * 0.9 + 0.45, ['lowpass', 1800]); } } v.visible = on; if (on) { const f = Math.sin(t * 12) > 0; v.userData.lights[0].emissiveIntensity = f ? 2 : 0.1; v.userData.lights[1].emissiveIntensity = f ? 0.1 : 2; } }
  const fire = W.fire; F.fire.visible = !!fire;
  if (fire) {
    const lv = clamp(fire.level, 0.1, 1.2); const o = W.objects.find((x) => x.id === fire.objId); F.fire.position.set(fire.x, (o && o.lvl ? 3 : 0) + 0.6, fire.z);
    F.flames.forEach((f, i) => { const a = i / 9 * PI * 2; f.position.set(Math.cos(a) * 0.35 * lv, 0.3 + Math.sin(t * 9 + i) * 0.1, Math.sin(a) * 0.35 * lv); f.scale.set(lv, lv * (1 + Math.sin(t * 13 + i * 2) * 0.35), lv); });
    F.smoke.forEach((s, i) => { const k = (t * 0.35 + i / 8) % 1; s.position.set(Math.sin(i) * 0.3, 1 + k * 3.5 * lv, Math.cos(i) * 0.3); s.scale.setScalar(0.5 + k * 1.6 * lv); s.material.opacity = 0.4 * (1 - k); });
    F.light.intensity = 3 + Math.sin(t * 17) * 1.2;
  }
}
export function openEmergency(ui) {
  const g = ui.g, W = g.hh.world;
  const status = [W.fire ? `🔥 Kebakaran (${Math.round(W.fire.level * 83)}%)` : '', W.flood > 0.2 ? `🌊 Banjir ${Math.round(W.flood * 100)}%` : '', W.theft && !W.theft.done && W.theft.told ? `🦹 Kemalingan ${fmtRp(W.theft.amount)}` : '', g.hh.humans().filter((h) => h.moods.some((q) => q.k === "sakit")).map((h) => `🤒 ${h.name} sakit`).join(', '), (g.hh.roadBlocked && g.hh.roadBlocked()) ? '🚧 Jalan tertutup' : ''].filter(Boolean);
  const pend = (W.calls || []).map((c) => `${SERVICES[c.svc].icon} ${SERVICES[c.svc].name}: ${['dalam perjalanan', 'sedang menangani', 'selesai', 'kembali'][c.stage] || ''}`);
  const apar = W.objects.find((o) => o.type === 'apar');
  const m = ui.modal(`<h2>🚨 Panggilan Darurat</h2>
    <p class="small">${status.length ? '<b>Situasi:</b> ' + status.join(' · ') : '✅ Tidak ada keadaan darurat saat ini.'}</p>${pend.length ? `<p class="small muted">${pend.join('<br>')}</p>` : ''}
    <div class="emg"><button class="btn" data-s="police">🚓 Polisi 110<small>lapor maling · patroli · jalan ditutup</small></button>
      <button class="btn" data-s="fire">🚒 Damkar 113<small>kebakaran · sedot banjir · evakuasi</small></button>
      <button class="btn" data-s="doctor">🩺 Dokter ke rumah<small>periksa & obati keluarga sakit · ${fmtRp(SERVICES.doctor.fee)}</small></button>
      ${W.fire ? `<button class="btn ghost" data-apar>🧯 Padamkan sendiri pakai APAR ${apar ? '' : '(beli APAR dulu di Mode Beli → Dapur)'}</button>` : ''}</div>
    <div class="mbtns row"><button class="btn ghost" data-close>Tutup</button></div>`);
  m.querySelector('.emg').onclick = (e) => { const b = e.target.closest('[data-s]'); if (b) { g.cmd({ c: 'call', svc: b.dataset.s }); ui.closeModal(); } if (e.target.closest('[data-apar]') && apar) { g.cmd({ c: 'act', key: 'pakaiApar', objId: apar.id }); ui.closeModal(); } };
}
