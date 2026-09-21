// ============================================================
//  WARGA TAMBAHAN & RUTINITAS HARIAN
//  keluarga tetangga, anak-anak, pekerja kafe & warung, satpam, Pak RT,
//  pedagang kaki lima, kurir paket, dan tamu yang bertamu.
// ============================================================
import { TYPES, fmtRp, clamp, PI } from './data.js';
import { NPCS } from './people.js';
import { PAIR } from './pets.js';
import { POSTS, VENDOR_SPOTS, CAFE } from './town.js';

const kid = (skin, hair, style, shirt, pants, dress) => ({ skin, hair, hairStyle: style, shirt, pants, dress, height: 0.62 });
Object.assign(NPCS, {
  // --- keluarga Pak Ismail & Bu Aisyah
  Dafa: { species: 'npc', trait: 'Anak Pak Ismail, kelas 4 SD, jago main layangan', fam: 'Pak Ismail', home: 'W', routine: 'kid', outfit: kid('#b07a52', '#1b1b1b', 'short', '#e53935', '#1e3a5f', false) },
  // --- keluarga Pak Budi & Bu Rina
  Salsa: { species: 'npc', trait: 'Anak sulung Pak Budi, SMP, suka menggambar', fam: 'Pak Budi', home: 'E', routine: 'kid', outfit: { ...kid('#d2a07c', '#2a1a12', 'hijab', '#ffffff', '#8e24aa', true), height: 0.78 } },
  Raka: { species: 'npc', trait: 'Anak bungsu Pak Budi, TK, suka kejar-kejaran', fam: 'Pak Budi', home: 'E', routine: 'kid', outfit: { ...kid('#c99670', '#141414', 'curly', '#fdd835', '#1565c0', false), height: 0.55 } },
  // --- keluarga Bang Jefri
  'Mak Ijah': { species: 'npc', trait: 'Ibu Bang Jefri, tiap pagi belanja di warung', fam: 'Bang Jefri', home: 'W', routine: 'elder', outfit: { skin: '#9a6a44', hair: '#bdbdbd', hairStyle: 'hijab', shirt: '#6d4c41', pants: '#4e342e', dress: true, height: 0.9 } },
  // --- Pak RT & Bu RT
  'Pak Harjo': { species: 'npc', trait: 'Ketua RT 05, rajin keliling tagih iuran', role: 'rt', home: 'E', routine: 'rt', outfit: { skin: '#a8714a', hair: '#9e9e9e', hairStyle: 'short', shirt: '#546e7a', pants: '#263238', dress: false, height: 1.0, peci: true, noMoustache: false } },
  'Bu Sumi': { species: 'npc', trait: 'Istri Pak RT, pengurus PKK & arisan', fam: 'Pak Harjo', home: 'E', routine: 'adult', outfit: { skin: '#c99670', hair: '#2a1a12', hairStyle: 'hijab', shirt: '#c2185b', pants: '#4a148c', dress: true, height: 0.94 } },
  // --- satpam
  'Pak Slamet': { species: 'npc', trait: 'Satpam komplek, jaga malam & keliling bawa senter', role: 'satpam', home: 'E', routine: 'satpam', outfit: { skin: '#8a5a38', hair: '#1b1b1b', hairStyle: 'short', shirt: '#37474f', pants: '#212121', dress: false, height: 1.02 } },
  // --- Kopi Griya
  'Mas Dimas': { species: 'npc', trait: 'Barista Kopi Griya, hafal pesanan semua warga', role: 'barista', home: 'W', routine: 'work', post: 'barista', hours: [6, 22], outfit: { skin: '#b98760', hair: '#141414', hairStyle: 'short', shirt: '#1f3a2e', pants: '#3e2723', dress: false, height: 1.0 } },
  'Mbak Laras': { species: 'npc', trait: 'Kasir Kopi Griya, ramah & suka merekomendasikan menu', role: 'barista', home: 'W', routine: 'work', post: 'kasir', hours: [7, 21], outfit: { skin: '#d2a07c', hair: '#2a1a12', hairStyle: 'hijab', shirt: '#1f3a2e', pants: '#3e2723', dress: true, height: 0.95 } },
  // --- Warung Madura
  'Cak Mamat': { species: 'npc', trait: 'Pemilik Warung Madura, jaga siang', role: 'warung', home: 'E', routine: 'work', post: 'warung', hours: [5, 18], outfit: { skin: '#8a5a38', hair: '#141414', hairStyle: 'short', shirt: '#ffffff', pants: '#1b5e20', dress: false, height: 0.98, peci: true } },
  'Yu Sulis': { species: 'npc', trait: 'Istri Cak Mamat, jaga warung shift malam', fam: 'Cak Mamat', role: 'warung', home: 'E', routine: 'work', post: 'warung', hours: [18, 5], outfit: { skin: '#9a6a44', hair: '#141414', hairStyle: 'hijab', shirt: '#00897b', pants: '#004d40', dress: true, height: 0.93 } },
  // --- pedagang kaki lima
  'Pak Kumis': { species: 'npc', trait: 'Pedagang bakso keliling, suaranya "ting-ting"', role: 'vendor', vendor: 'bakso', home: 'W', routine: 'vendor', outfit: { skin: '#9a6a44', hair: '#1b1b1b', hairStyle: 'short', shirt: '#f5f5f5', pants: '#37474f', dress: false, height: 1.0, wide: 1.2 } },
  'Mas Siomay': { species: 'npc', trait: 'Pedagang siomay Bandung', role: 'vendor', vendor: 'siomay', home: 'E', routine: 'vendor', outfit: { skin: '#b07a52', hair: '#141414', hairStyle: 'short', shirt: '#1565c0', pants: '#263238', dress: false, height: 0.98 } },
  'Bang Toyib': { species: 'npc', trait: 'Tukang sate Madura, kipasnya legendaris', role: 'vendor', vendor: 'sate', home: 'W', routine: 'vendor', outfit: { skin: '#8a5a38', hair: '#141414', hairStyle: 'short', shirt: '#6d4c41', pants: '#212121', dress: false, height: 1.0, peci: true } },
  'Mbok Darmi': { species: 'npc', trait: 'Penjual es dawet ayu Banjarnegara', role: 'vendor', vendor: 'cendol', home: 'E', routine: 'vendor', outfit: { skin: '#9a6a44', hair: '#9e9e9e', hairStyle: 'hijab', shirt: '#2e7d32', pants: '#5d4037', dress: true, height: 0.9 } },
  // --- kurir
  'Mas Kurir': { species: 'npc', trait: 'Kurir ekspedisi, sering antar paket belanja online', role: 'courier', home: 'E', routine: 'none', outfit: { skin: '#b07a52', hair: '#141414', hairStyle: 'short', shirt: '#ef6c00', pants: '#212121', dress: false, height: 1.0 } },
  // --- tamu keluarga & teman
  'Bu Ratna': { species: 'npc', trait: 'Ibunda Handoyo dari Solo, selalu bawa rendang', role: 'guest', relation: 'Ibu Handoyo', gift: 'rendang', home: 'W', routine: 'none', outfit: { skin: '#c99670', hair: '#9e9e9e', hairStyle: 'hijab', shirt: '#8d6e63', pants: '#5d4037', dress: true, height: 0.92, batik: true } },
  'Kak Dinda': { species: 'npc', trait: 'Kakak Naswa, dokter gigi di Semarang', role: 'guest', relation: 'Kakak Naswa', gift: 'kue', home: 'E', routine: 'none', outfit: { skin: '#d2a07c', hair: '#2a1a12', hairStyle: 'hijab', shirt: '#7e57c2', pants: '#311b92', dress: true, height: 0.97 } },
  Reza: { species: 'npc', trait: 'Teman kantor Handoyo, backend engineer, penggila kopi', role: 'guest', relation: 'Teman Handoyo', gift: 'kopi', home: 'E', routine: 'none', outfit: { skin: '#b98760', hair: '#141414', hairStyle: 'curly', shirt: '#263238', pants: '#37474f', dress: false, height: 1.03 } },
  'Mbak Ayu': { species: 'npc', trait: 'Kolektor lukisan dari Galeri Semarang', role: 'guest', relation: 'Kolektor seni', gift: 'art', home: 'W', routine: 'none', outfit: { skin: '#e0b089', hair: '#3e2723', hairStyle: 'long', shirt: '#ad1457', pants: '#212121', dress: true, height: 1.0 } },
});
for (const d of Object.values(NPCS)) if (!d.routine) d.routine = 'legacy';

Object.assign(NPCS, {
  'Pak Hasan': { species: 'npc', trait: 'Dosen sejarah Undip, suka cerita zaman kolonial', home: 'E', routine: 'adult', outfit: { skin: '#b07a52', hair: '#616161', hairStyle: 'short', shirt: '#795548', pants: '#3e2723', dress: false, height: 1.02, peci: true } },
  'Bu Lina': { species: 'npc', trait: 'Istri Pak Hasan, buka katering nasi kotak', fam: 'Pak Hasan', home: 'E', routine: 'adult', outfit: { skin: '#d2a07c', hair: '#2a1a12', hairStyle: 'hijab', shirt: '#ef6c00', pants: '#4e342e', dress: true, height: 0.95 } },
  Nadia: { species: 'npc', trait: 'Anak Pak Hasan, mahasiswi arsitektur, suka nongkrong di Kopi Griya', fam: 'Pak Hasan', home: 'E', routine: 'adult', outfit: { skin: '#e0b089', hair: '#3e2723', hairStyle: 'long', shirt: '#26a69a', pants: '#37474f', dress: false, height: 0.96 } },
  'Mbah Karso': { species: 'npc', trait: 'Kakek pensiunan KAI, tiap pagi jalan kaki & cerita kereta uap', home: 'E', routine: 'elder', outfit: { skin: '#9a6a44', hair: '#eeeeee', hairStyle: 'short', shirt: '#8d6e63', pants: '#5d4037', dress: false, height: 0.93, peci: true } },
  'Mbah Warsini': { species: 'npc', trait: 'Nenek jago bikin jamu kunyit asam', fam: 'Mbah Karso', home: 'E', routine: 'elder', outfit: { skin: '#9a6a44', hair: '#eeeeee', hairStyle: 'hijab', shirt: '#558b2f', pants: '#33691e', dress: true, height: 0.88 } },
  'Pak Gunawan': { species: 'npc', trait: 'Driver ojol, paling tahu info jalan macet', home: 'W', routine: 'adult', outfit: { skin: '#8a5a38', hair: '#141414', hairStyle: 'short', shirt: '#2e7d32', pants: '#212121', dress: false, height: 1.0 } },
  'Bu Endang': { species: 'npc', trait: 'Istri Pak Gunawan, jualan kue basah online', fam: 'Pak Gunawan', home: 'W', routine: 'adult', outfit: { skin: '#b98760', hair: '#2a1a12', hairStyle: 'hijab', shirt: '#ec407a', pants: '#6a1b9a', dress: true, height: 0.94, wide: 1.1 } },
  Bima: { species: 'npc', trait: 'Anak Pak Gunawan, kelas 6 SD, jago main bola', fam: 'Pak Gunawan', home: 'W', routine: 'kid', outfit: kid('#8a5a38', '#141414', 'short', '#1565c0', '#212121', false) },
  'Om Bram': { species: 'npc', trait: 'Fotografer pernikahan, penggemar lukisan Naswa', home: 'W', routine: 'adult', outfit: { skin: '#c99670', hair: '#212121', hairStyle: 'curly', shirt: '#424242', pants: '#1b1b1b', dress: false, height: 1.05 } },
  'Mbak Tika': { species: 'npc', trait: 'Anak kos mahasiswi kedokteran, sering begadang', home: 'W', routine: 'adult', outfit: { skin: '#d2a07c', hair: '#2a1a12', hairStyle: 'hijab', shirt: '#5c6bc0', pants: '#283593', dress: true, height: 0.95 } },
});
for (const d of Object.values(NPCS)) if (!d.routine) d.routine = 'legacy';
Object.assign(PAIR, {
  visitHome: { from: 'human', to: 'npc', label: 'Berkunjung ke rumahnya', icon: '🏡', dur: 2, anim: ['talk', 'wave'], gain: { social: 0.5 }, pgain: {}, bond: 2, close: 0.9, visit: true, need: (hh, a, b) => !['guest', 'vendor', 'courier', 'barista', 'warung'].includes(b.role) && !a.visit },
  kidsPlay: { from: 'npc', to: 'npc', label: 'Main kejar-kejaran', icon: '🏃', dur: 15, anim: ['jog', 'laugh'], gain: {}, pgain: {}, bond: 1, close: 0.9, hidden: true },
  kidTalk: { from: 'human', to: 'npc', label: 'Ajak ngobrol & kasih permen', icon: '🍬', dur: 5, anim: ['talk', 'laugh'], gain: { social: 1.2, fun: 0.8 }, pgain: {}, bond: 4, close: 0.8, need: (hh, a, b) => (b.outfit.height || 1) < 0.8 },
  coffeeForSatpam: { from: 'human', to: 'npc', label: 'Kasih kopi ke satpam', icon: '☕', dur: 4, anim: ['grab', 'laugh'], gain: { social: 1.4 }, pgain: {}, bond: 6, close: 0.8, onlyName: 'Pak Slamet', mood: 'ngobrolTetangga' },
  titipRumah: { from: 'human', to: 'npc', label: 'Titip rumah', icon: '🏠', dur: 3, anim: ['talk', 'listen'], gain: { social: 0.8 }, pgain: {}, bond: 2, close: 0.9, onlyName: 'Pak Slamet' },
  payIuran: { from: 'human', to: 'npc', label: 'Bayar iuran RT (Rp 50.000)', icon: '🧾', dur: 3, anim: ['grab', 'talk'], gain: { social: 0.8 }, pgain: {}, bond: 5, close: 0.8, onlyName: 'Pak Harjo', pay: 50000, iuran: true, need: (hh) => (hh.world.iuranDue || 0) > 0 },
});

const SPAWN = { W: [-21, 13.3], E: [21, 13.3] };
const DOOR = [-4, 7.1];
const CAFE_DOOR = [-17.9, 9.3];
const WARUNG_FRONT = [18, 9.0];
const hideAt = (s, p) => { s.hidden = true; s.away = true; s.x = p[0]; s.z = p[1]; s.lvl = 0; s.y = 0; s.queue = []; };
const appear = (s, p) => { s.hidden = false; s.away = false; s.x = p[0]; s.z = p[1]; s.y = 0; s.lvl = 0; };
const go = (hh, s, x, z) => hh.queueAct(s, 'go', null, { pos: [x, z] });
const idle = (s) => !s.queue.length && !s.engagedBy;
const near = (s, p, r = 0.7) => Math.hypot(s.x - p[0], s.z - p[1]) < r;
const inHours = (hr, [a, b]) => (a <= b ? hr >= a && hr < b : hr >= a || hr < b);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const freeObj = (hh, type, s) => { const l = hh.world.objects.filter((o) => o.type === type && !hh.objBusy(o, s)); return l.length ? pick(l) : null; };

// ---------- rutinitas per menit ----------
export function people2Minute(hh, m) {
  const W = hh.world, hr = Math.floor((m % 1440) / 60), day = Math.floor(m / 1440);
  if (!W.carts) W.carts = {};
  for (const [n, d] of Object.entries(NPCS)) {
    const s = hh.others[n]; if (!s) continue;
    s.role = d.role || null; if (d.fam) s.fam = d.fam;
    const P = s.plan || (s.plan = { mode: 'home' });
    if (s.busyT > 0) s.busyT -= 1;
    const home = SPAWN[d.home] || SPAWN.W;
    // ---------- pekerja dengan pos tetap ----------
    if (d.routine === 'work' || d.routine === 'satpam') {
      const hours = d.routine === 'satpam' ? [17, 6] : d.hours;
      const on = inHours(hr, hours);
      if (P.mode === 'home' && on) { appear(s, home); P.mode = 'toPost'; const po = POSTS[d.post || 'satpam']; go(hh, s, po[0], po[1]); continue; }
      if (P.mode === 'toPost' && idle(s)) { P.mode = 'post'; continue; }
      if (P.mode === 'post') {
        const po = POSTS[d.post || 'satpam'];
        if (!on) { P.mode = 'leave'; go(hh, s, home[0], home[1]); continue; }
        if (idle(s) && !near(s, po, 0.3)) { go(hh, s, po[0], po[1]); continue; }
        if (idle(s)) { s.yaw = po[2]; s.anim = s.busyT > 0 ? (d.role === 'barista' ? 'cook' : 'grab') : 'idle'; }
        if (d.routine === 'satpam' && idle(s) && (hr >= 20 || hr < 4) && m % 90 === 0) { P.mode = 'patrol'; go(hh, s, -19, 12.6); go(hh, s, 8, 12.6); go(hh, s, po[0], po[1]); }
        continue;
      }
      if (P.mode === 'patrol') { if (idle(s)) P.mode = 'post'; continue; }
      if (P.mode === 'leave' && idle(s)) { hideAt(s, home); P.mode = 'home'; }
      continue;
    }
    // ---------- pedagang kaki lima ----------
    if (d.routine === 'vendor') {
      const V = VENDOR_SPOTS[d.vendor]; const on = inHours(hr, V.hours) && !(hh.roadBlocked && hh.roadBlocked());
      if (P.mode === 'home' && on) {
        appear(s, [V.pos[0] + 1.3, V.pos[1] + 0.2]); s.yaw = -PI / 2; P.mode = 'sell';
        W.carts[d.vendor] = true; hh.addCart && hh.addCart(d.vendor, V);
        hh.hooks.vendorCall && hh.hooks.vendorCall(d.vendor);
        if (Math.random() < 0.5) hh.toast(`${V.icon} ${V.label} lewat depan rumah!`, 'info');
        continue;
      }
      if (P.mode === 'sell') {
        if (!on) { W.carts[d.vendor] = false; hh.removeCart && hh.removeCart(d.vendor); P.mode = 'leave'; go(hh, s, home[0], home[1]); continue; }
        if (idle(s)) { s.anim = s.busyT > 0 ? 'cook' : 'idle'; s.yaw = PI; }
        continue;
      }
      if (P.mode === 'leave' && idle(s)) { hideAt(s, home); P.mode = 'home'; }
      continue;
    }
    // ---------- anak-anak ----------
    if (d.routine === 'kid') {
      if (P.mode === 'home') {
        if (m < (P.next || 0)) continue;
        const r = Math.random();
        if (hr >= 15 && hr < 18 && r < 0.03) { appear(s, home); P.mode = 'play'; P.until = m + 60 + Math.random() * 90; go(hh, s, 6 + Math.random() * 8, 12.4 + Math.random()); continue; }
        if (hr >= 9 && hr < 17 && (hr >= 13 || day % 7 >= 5) && r < 0.012) { startErrand(hh, s, P, home, pick(['jajan', 'warung'])); continue; }
        continue;
      }
      if (P.mode === 'play') {
        if (m > P.until || hr >= 18) { if (idle(s)) { P.mode = 'back'; go(hh, s, home[0], home[1]); } continue; }
        if (idle(s)) {
          const buddy = Object.values(hh.others).find((o) => o !== s && !o.hidden && o.plan && o.plan.mode === 'play' && idle(o));
          if (buddy && Math.random() < 0.35) hh.queueSocial(s, 'kidsPlay', buddy.name, 'pair');
          else go(hh, s, 4 + Math.random() * 11, 12.3 + Math.random() * 1.5);
        }
        continue;
      }
      errandStep(hh, s, P, home, m); continue;
    }
    // ---------- dewasa (rutinitas umum), lansia, Pak RT ----------
    if (d.routine === 'adult' || d.routine === 'elder' || d.routine === 'rt' || d.routine === 'legacy') {
      if (P.mode === 'home' || P.mode === undefined) {
        if (m < (P.next || 0) || hr < 6 || hr >= 21) continue;
        const r = Math.random();
        // Pak RT: tagih iuran tiap 4 hari
        if (d.routine === 'rt' && day - (W.iuranDay ?? -9) >= 4 && hr >= 16 && hr < 19 && !W.iuranOffer && r < 0.05) { appear(s, home); P.mode = 'iuran'; P.stage = 0; P.t = m; go(hh, s, -4, 12.3); continue; }
        if (d.routine === 'rt' && hr >= 19 && hr < 21 && r < 0.02) { appear(s, home); P.mode = 'ronda'; P.t = m; P.until = m + 90; const po = hh.world.objects.find((o) => o.type === 'posRonda'); if (po) hh.queueAct(s, 'ronda', po.id); continue; }
        if (d.routine === 'legacy' && r > 0.006) continue;     // tetangga lama: sesekali saja
        const opts = d.routine === 'elder' ? (hr < 10 ? ['warung', 'warung', 'jajan'] : ['warung', 'coffee', 'padang']) : ['coffee', 'warung', 'jajan', 'coffee', 'padang', 'padang'];
        if (r < (d.routine === 'legacy' ? 0.006 : 0.01)) startErrand(hh, s, P, home, pick(opts));
        continue;
      }
      if (P.mode === 'iuran') {
        if (P.stage === 0 && idle(s)) { go(hh, s, DOOR[0] + 0.6, DOOR[1]); P.stage = 1; continue; }
        if (P.stage === 1 && idle(s)) { P.stage = 2; P.arrive = m; W.iuranOffer = { amount: 50000, at: W.time }; W.iuranDue = 50000; hh.sfx('bell'); hh.hooks.rtVisit && hh.hooks.rtVisit(W.iuranOffer); continue; }
        if (P.stage === 2) { s.anim = 'talk'; s.yaw = PI; if (!W.iuranOffer || m - P.arrive > 60) { if (W.iuranOffer) { W.iuranOffer = null; hh.hooks.rtClose && hh.hooks.rtClose(); hh.toast('Pak Harjo pamit, iurannya ditagih lain kali 🙂', 'info'); } P.stage = 3; go(hh, s, -4, 12.3); } continue; }
        if (P.stage === 3 && idle(s)) { P.mode = 'back'; go(hh, s, home[0], home[1]); }
        continue;
      }
      if (P.mode === 'ronda') { if (m > P.until && idle(s)) { P.mode = 'back'; go(hh, s, home[0], home[1]); } continue; }
      errandStep(hh, s, P, home, m); continue;
    }
  }
  guestMinute(hh, m, hr, day);
  courierMinute(hh, m);
}

// kegiatan keluar rumah: ngopi, belanja warung, jajan PKL
function startErrand(hh, s, P, home, kind) {
  const W = hh.world;
  if (kind === 'jajan') { const act = Object.keys(W.carts || {}).filter((k) => W.carts[k]); if (!act.length) kind = 'warung'; else P.cart = pick(act); }
  appear(s, home); P.mode = kind; P.stage = 0; P.t = hh.world.time;
  if (kind === 'coffee') go(hh, s, CAFE_DOOR[0], CAFE_DOOR[1]);
  if (kind === 'padang') go(hh, s, 13.65, -1.3);
  if (kind === 'warung') go(hh, s, WARUNG_FRONT[0] + (Math.random() - 0.5), WARUNG_FRONT[1]);
  if (kind === 'jajan') { const V = VENDOR_SPOTS[P.cart]; go(hh, s, V.pos[0] + (Math.random() - 0.5), V.pos[1] - 1.2); }
}
function errandStep(hh, s, P, home, m) {
  if (!['coffee', 'warung', 'jajan', 'padang', 'back'].includes(P.mode)) return;
  if (P.mode === 'back') { if (idle(s)) { hideAt(s, home); P.mode = 'home'; P.next = m + 90 + Math.random() * 240; } return; }
  if (!idle(s)) { if (hh.world.time - P.t > 300) { s.queue = []; P.mode = 'back'; go(hh, s, home[0], home[1]); } return; }
  if (P.stage === 0) {
    P.stage = 1;
    if (P.mode === 'coffee') { const c = hh.world.objects.find((o) => o.type === 'coffeeCounter'); if (c) hh.queueAct(s, pick(['kopiSusu', 'americano', 'matcha', 'pisgor']), c.id); const t = freeObj(hh, Math.random() < 0.5 ? 'cafeTable' : 'cafeTableOut', s); if (t && Math.random() < 0.8) hh.queueAct(s, 'nongkrong', t.id); }
    if (P.mode === 'warung') { const c = hh.world.objects.find((o) => o.type === 'warungCounter'); if (c) hh.queueAct(s, pick((s.outfit.height || 1) < 0.85 ? ['wSnack', 'wEs'] : ['wSnack', 'wEs', 'wStock']), c.id); const b = freeObj(hh, 'warungBench', s); if (b && Math.random() < 0.5) hh.queueAct(s, 'nongkrong', b.id); }
    if (P.mode === 'padang') { const c = hh.world.objects.find((o) => o.type === 'padangCounter'); const h = (hh.world.time % 1440) / 60; if (c && h >= 7 && h < 22) hh.queueAct(s, pick(['pdRendang', 'pdAyamPop', 'pdGulaiIkan', 'pdDendeng', 'pdHemat', 'pdHemat']), c.id); }
    if (P.mode === 'jajan') { const c = hh.world.objects.find((o) => o.type === 'streetCart' && o.s.kind === P.cart); if (c) hh.queueAct(s, 'buyStreet', c.id); }
    return;
  }
  P.mode = 'back'; go(hh, s, home[0], home[1]);
}

// ---------- tamu ----------
export const GUEST_NAMES = ['Bu Ratna', 'Kak Dinda', 'Reza', 'Mbak Ayu'];
export function inviteGuest(hh, name, delay = 60) { const W = hh.world; W.guestNext = W.time + delay; W.guestPick = name; }
function guestMinute(hh, m, hr, day) {
  const W = hh.world;
  if (W.guestNext == null) W.guestNext = W.time + 1440 * (1 + Math.random() * 1.5);
  const g = W.guest; // {name, stage, t}
  if (!g) {
    if (W.time < W.guestNext || hr < 9 || hr >= 19) return;
    const name = W.guestPick || pick(GUEST_NAMES); W.guestPick = null; W.guestNext = W.time + 1440 * (1.5 + Math.random() * 1.5);
    const s = hh.others[name]; if (!s) return;
    appear(s, SPAWN[NPCS[name].home]); go(hh, s, -4.4, 12.3); go(hh, s, DOOR[0], DOOR[1]);
    W.guest = { name, stage: 0, t: m }; return;
  }
  const s = hh.others[g.name]; if (!s) { W.guest = null; return; }
  const D = NPCS[g.name];
  if (g.stage === 0 && idle(s)) { g.stage = 1; g.t = m; s.yaw = PI; hh.sfx('doorbell'); hh.hooks.guestArrive && hh.hooks.guestArrive({ name: g.name, relation: D.relation }); hh.toast(`🔔 Ting-tong! ${g.name} (${D.relation}) datang bertamu`, 'info', true); return; }
  if (g.stage === 1) { s.anim = 'wave'; if (m - g.t > 60) { hh.hooks.guestClose && hh.hooks.guestClose(); hh.toast(`${g.name} nunggu kelamaan, akhirnya pulang dulu 😢`, 'bad'); leaveGuest(hh, s, g); } return; }
  if (g.stage === 2) {
    if (!idle(s)) return;
    if (m - g.t > 160) { hh.toast(`${g.name} pamit pulang. "Makasih ya, seneng banget main ke sini!" 👋`, 'good'); leaveGuest(hh, s, g); return; }
    const r = Math.random();
    const h = hh.humans().find((x) => !x.hidden && !x.engagedBy && !x.queue.length && (x.lvl || 0) === 0);
    if (h && r < 0.35) { hh.queueSocial(s, 'npcChat', h.name, 'pair'); return; }
    if (W.house.servings > 0 && r < 0.45 && !g.ate) { g.ate = true; const t = W.objects.find((o) => o.type === 'diningTable'); if (t) { hh.queueAct(s, 'eatServing', t.id); return; } }
    const sofa = freeObj(hh, 'sofa', s) || freeObj(hh, 'armchair', s); if (sofa) hh.queueAct(s, 'sitSofa', sofa.id);
    return;
  }
  if (g.stage === 3 && idle(s)) { hideAt(s, SPAWN[D.home]); W.guest = null; }
}
function leaveGuest(hh, s, g) { s.queue = []; g.stage = 3; go(hh, s, DOOR[0], DOOR[1] + 0.3); go(hh, s, -4, 12.3); go(hh, s, SPAWN[NPCS[g.name].home][0], SPAWN[NPCS[g.name].home][1]); }
export function guestDecision(hh, c) {
  const W = hh.world, g = W.guest; if (!g || g.stage !== 1) return;
  hh.hooks.guestClose && hh.hooks.guestClose();
  const s = hh.others[g.name], D = NPCS[g.name];
  if (!c.accept) { hh.toast(`${g.name}: "Oh gitu, ya udah lain kali aja ya" 🙂`, 'info'); W.nrel[g.name] = clamp((W.nrel[g.name] || 30) - 2, -100, 100); leaveGuest(hh, s, g); return; }
  g.stage = 2; g.t = hh.world.time;
  for (const h of hh.humans()) h.mood('tamu');
  W.nrel[g.name] = clamp((W.nrel[g.name] || 30) + 5, -100, 100);
  if (D.gift === 'rendang') { hh.op({ o: 'house', k: 'servings', d: 3 }); hh.toast('Bu Ratna bawa rendang dari Solo! +3 porsi di meja makan 🍛', 'good', true); }
  if (D.gift === 'kue') { hh.op({ o: 'house', k: 'servings', d: 2 }); hh.toast('Kak Dinda bawa kue lapis & bolu! +2 porsi 🍰', 'good', true); }
  if (D.gift === 'kopi') { const hd = hh.sims.Handoyo; if (hd) hd.mood('ngopi'); hh.toast('Reza bawa biji kopi Temanggung buat Handoyo ☕', 'good'); }
  if (D.gift === 'art') hh.hooks.collectorVisit && hh.hooks.collectorVisit(g.name);
  hh.addFam(10);
}

// ---------- kurir paket ----------
function courierMinute(hh, m) {
  const W = hh.world; const s = hh.others['Mas Kurir']; if (!s || !W.orders) return;
  const P = s.plan || (s.plan = { mode: 'home' });
  if (P.mode === 'home') {
    if (hh.roadBlocked && hh.roadBlocked()) return;
    const due = W.orders.find((o) => o.status === 'dikirim' && W.time >= o.eta);
    if (!due) return;
    P.mode = 'deliver'; P.order = due.id; P.stage = 0; appear(s, [-6.2, 12.7]); s.prop = 'parcel';
    go(hh, s, -4, 11.6); go(hh, s, -4.9, 7.2); hh.sfx('motor'); return;
  }
  if (P.mode === 'deliver' && idle(s)) {
    if (P.stage === 0) { P.stage = 1; s.prop = null; hh.deliverParcel && hh.deliverParcel(P.order); hh.sfx('doorbell'); go(hh, s, -4, 11.6); go(hh, s, -6.2, 12.7); return; }
    if (P.stage === 1) { hideAt(s, [-21, 13.3]); P.mode = 'home'; }
  }
}

// ---------- obrolan ambient (kalimat singkat di gelembung) ----------
export const CANNED = {
  barista: ['Kopi susu gula arennya lagi enak-enaknya nih!', 'Mau pakai es atau hangat, Kak?', 'Biji kopinya dari Temanggung, baru disangrai kemarin.'],
  warung: ['Buka 24 jam, Mas! Ada telur, mie, token, pulsa.', 'Gas melon masih ada, galon juga ready.', 'Monggo, mau cari apa?'],
  satpam: ['Aman terkendali, Pak!', 'Jangan lupa kunci pagar ya malam ini.', 'Priiit! Keliling dulu.'],
  vendor: ['Bakso... bakso!', 'Sate, sate ayam!', 'Siomay, siomay Bandung!', 'Dawet ayu, seger-seger!'],
  kid: ['Kejar aku kalau bisa!', 'Aku mau es dawet!', 'Main layangan yuk!', 'Hahaha kena kamu!'],
  rt: ['Minggu pagi kerja bakti ya, jangan lupa.', 'Iuran bulan ini buat lampu jalan & kebersihan.', 'Alhamdulillah kampung kita aman.'],
  guest: ['Rumahnya makin cantik aja!', 'Wah, lukisannya bagus-bagus ya.', 'Kangen banget sama kalian.'],
  default: ['Cuacanya panas banget hari ini.', 'Eh, udah dengar kabar arisan minggu depan?', 'Harga cabai naik lagi lho.', 'Kucing oranye itu lucu banget.'],
};
export function ambientChatter(hh, ask) {
  const all = Object.values(hh.others || {}).filter((o) => !o.hidden && (o.anim === 'talk' || o.anim === 'laugh' || o.anim === 'idle' || o.anim === 'cook'));
  if (!all.length) return;
  const s = pick(all); const role = s.role || ((s.outfit && s.outfit.height < 0.8) ? 'kid' : 'default');
  const line = pick(CANNED[role] || CANNED.default);
  s.say = { text: line, until: Date.now() + 5000 };
  if (ask) ask(s, role).then((t) => { if (t) s.say = { text: t, until: Date.now() + 7000 }; }).catch(() => {});
}
