// ============================================================
//  TETANGGA & ASISTEN RUMAH TANGGA
// ============================================================
import { TYPES, MOODLETS, fmtRp, clamp } from './data.js';
import { INTER } from './interactions.js';
import { PAIR } from './pets.js';

Object.assign(MOODLETS, {
  ngobrolTetangga: { label: 'Ngobrol seru sama tetangga', emoji: '🏘️', val: 10, dur: 180 },
  dibantuART: { label: 'Rumah dibantu ART', emoji: '🧹', val: 8, dur: 240 },
  peduli: { label: 'Makin peduli sesama', emoji: '💚', val: 8, dur: 240 },
  hamil: { label: 'Sedang hamil', emoji: '🤰', val: 5, dur: 5000 },
  peluk: { label: 'Pelukan hangat', emoji: '🫂', val: 18, dur: 240 },
});

// ---------- tetangga ----------
export const NPCS = {
  'Pak Ismail': { species: 'npc', trait: 'Gemuk, ramah, doyan makan & nonton bola', home: 'W', outfit: { skin: '#b07a52', hair: '#1b1b1b', hairStyle: 'short', shirt: '#8a5a2e', pants: '#3a3a44', dress: false, height: 1.0, wide: 1.45, batik: true, peci: true } },
  'Bu Aisyah': { species: 'npc', trait: 'Istri Pak Ismail, jago masak, suka antar makanan', home: 'W', outfit: { skin: '#c99670', hair: '#2a1a12', hairStyle: 'hijab', shirt: '#3f8a6e', pants: '#2c4a3e', dress: true, height: 0.95, wide: 1.1 } },
  'Pak Budi': { species: 'npc', trait: 'Rajin jogging tiap pagi', home: 'E', outfit: { skin: '#a8714a', hair: '#3a3a3a', hairStyle: 'short', shirt: '#e5484d', pants: '#1f1f28', dress: false, height: 1.04 } },
  'Bu Rina': { species: 'npc', trait: 'Ketua arisan, suka ngerumpi', home: 'E', outfit: { skin: '#d2a07c', hair: '#2a1a12', hairStyle: 'hijab', shirt: '#4d8cf0', pants: '#2a3350', dress: true, height: 0.96 } },
  'Bang Jefri': { species: 'npc', trait: 'Sering main ke rumah buat ngutang — tapi selalu bayar plus bunga', home: 'W', outfit: { skin: '#9a6a44', hair: '#141414', hairStyle: 'curly', shirt: '#2b2b2b', pants: '#3a4a6a', dress: false, height: 1.0 } },
};
export const STAFF = {
  'Mbak Sri': { species: 'staff', role: 'ART — bersih-bersih', wage: 150000, outfit: { skin: '#b98760', hair: '#1b1b1b', hairStyle: 'hijab', shirt: '#7fb8c9', pants: '#3a5a6a', dress: true, height: 0.94 },
    chores: ['mop', 'washDishes', 'clearDishes', 'takeTrash', 'makeBed', 'cleanToilet', 'cleanStove', 'cleanLitter'] },
  'Bi Inah': { species: 'staff', role: 'ART — masak & cuci baju', wage: 150000, outfit: { skin: '#a8714a', hair: '#2a1a12', hairStyle: 'hijab', shirt: '#e0a0b8', pants: '#5a3a4a', dress: true, height: 0.93, wide: 1.15 },
    chores: ['cook2', 'laundry', 'liftLaundry', 'fillBowl', 'buyVeg', 'washDishes'] },
  'Pak Darto': { species: 'staff', role: 'Tukang kebun & sopir', wage: 170000, outfit: { skin: '#8a5a38', hair: '#8a8a8a', hairStyle: 'short', shirt: '#5a7a3a', pants: '#3a3a2a', dress: false, height: 1.0 },
    chores: ['water', 'harvest', 'mow', 'washCar', 'takeTrash'] },
};
const SPAWN = { W: [-21, 13.3], E: [21, 13.3] };
const DOOR = [-4, 7.1];

// ---------- interaksi dengan tetangga / ART ----------
Object.assign(PAIR, {
  chatN: { from: 'human', to: 'npc', label: 'Ngobrol', icon: '💬', dur: 10, anim: ['talk', 'listen'], gain: { social: 2.3, fun: 0.4 }, pgain: {}, bond: 3, mood: 'ngobrolTetangga', close: 0.9 },
  coffee: { from: 'human', to: 'npc', label: 'Ngopi & ngerumpi bareng', icon: '☕', dur: 20, anim: ['laugh', 'talk'], gain: { social: 2, fun: 1.2 }, pgain: {}, bond: 5, mood: 'ngobrolTetangga', close: 0.95 },
  giveFood: { from: 'human', to: 'npc', label: 'Kasih makanan (−1 stok)', icon: '🍱', dur: 3, anim: ['grab', 'laugh'], gain: { social: 1.5 }, pgain: {}, bond: 7, close: 0.8, need: (hh) => hh.world.house.stock > 0, give: true },
  hugN: { from: 'human', to: 'npc', label: 'Pelukan hangat', icon: '🫂', dur: 5, anim: ['hug', 'hug'], gain: { social: 3 }, pgain: {}, bond: 4, close: 0.42 },
  lendAsk: { from: 'human', to: 'npc', label: 'Tagih utang', icon: '🧾', dur: 4, anim: ['talk', 'listen'], gain: { social: 0.5 }, pgain: {}, bond: -1, close: 0.9, onlyName: 'Bang Jefri', need: (hh) => !!hh.world.loan, collect: true },
  npcChat: { from: 'npc', to: 'human', label: 'Ngobrol', icon: '💬', dur: 12, anim: ['talk', 'listen'], gain: {}, pgain: { social: 2.4, fun: 0.5 }, bond: 3, pmood: 'ngobrolTetangga', close: 0.9, hidden: true },
  gossip: { from: 'npc', to: 'npc', label: 'Ngerumpi', icon: '🗣️', dur: 25, anim: ['talk', 'laugh'], gain: {}, pgain: {}, bond: 1, close: 0.85, hidden: true },
  thankStaff: { from: 'human', to: 'staff', label: 'Ucapkan terima kasih', icon: '🙏', dur: 3, anim: ['talk', 'laugh'], gain: { social: 1 }, pgain: {}, bond: 3, close: 0.9 },
  bonusStaff: { from: 'human', to: 'staff', label: 'Kasih bonus Rp 100.000', icon: '💵', dur: 3, anim: ['grab', 'laugh'], gain: { social: 1, fun: 0.5 }, pgain: {}, bond: 8, close: 0.8, pay: 100000 },
  chatStaff: { from: 'human', to: 'staff', label: 'Ngobrol santai', icon: '💬', dur: 8, anim: ['talk', 'listen'], gain: { social: 2 }, pgain: {}, bond: 2, close: 0.9 },
});

// ---------- inisialisasi ----------
export function initPeople(hh) {
  hh.others = {};
  for (const [n, d] of Object.entries(NPCS)) { const s = hh.makeSim(n, d.species); s.outfit = { ...d.outfit }; hideAt(s, SPAWN[d.home]); s.plan = { mode: 'home', next: 0 }; s.role = d.role || null; s.fam = d.fam || null; hh.others[n] = s; }
  for (const [n, d] of Object.entries(STAFF)) { const s = hh.makeSim(n, d.species); s.outfit = { ...d.outfit }; s.skills = { memasak: 800, logika: 200, kreatif: 200, bugar: 300, karisma: 300 }; hideAt(s, SPAWN.W); s.plan = { mode: 'home' }; hh.others[n] = s; }
  const W = hh.world;
  if (!W.nrel) W.nrel = Object.fromEntries(Object.keys({ ...NPCS, ...STAFF }).map((n) => [n, 30]));
  if (!W.staffOn) W.staffOn = Object.fromEntries(Object.keys(STAFF).map((n) => [n, true]));
  if (W.loan === undefined) W.loan = null;
  if (W.loanOffer === undefined) W.loanOffer = null;
  if (W.jefriLast === undefined) W.jefriLast = -1;
}
function hideAt(s, p) { s.hidden = true; s.x = p[0]; s.z = p[1]; s.lvl = 0; s.y = 0; s.queue = []; s.away = true; }
function appear(s, p) { s.hidden = false; s.away = false; s.x = p[0]; s.z = p[1]; s.y = 0; s.lvl = 0; }
function go(hh, s, x, z) { hh.queueAct(s, 'go', null, { pos: [x, z] }); }
const idle = (s) => !s.queue.length && !s.engagedBy;
const nearly = (s, p, r = 0.6) => Math.hypot(s.x - p[0], s.z - p[1]) < r;

// ---------- jadwal tetangga (dipanggil tiap menit game) ----------
export function peopleMinute(hh, m) {
  const W = hh.world, min = m % 1440, hr = Math.floor(min / 60), day = Math.floor(m / 1440);
  for (const [n, d] of Object.entries(NPCS)) {
    if (d.routine && d.routine !== 'legacy') continue;
    const s = hh.others[n]; if (!s) continue; const P = s.plan || (s.plan = { mode: 'home' });
    const home = SPAWN[d.home];
    if (P.mode === 'home') {
      if (m < (P.next || 0) || hr < 6 || hr >= 21) continue;
      // pilih kegiatan
      let pick = null; const r = Math.random();
      if ((n === 'Pak Budi' || n === 'Bu Rina') && hr === 6 && r < 0.5) pick = 'jog';
      else if (n === 'Bang Jefri') {
        if (W.loan && day >= W.loan.due && hr >= 9 && hr < 20 && r < 0.2) pick = 'repay';
        else if (!W.loan && !W.loanOffer && day - W.jefriLast >= 2 && hr >= 10 && hr < 19 && r < 0.03) pick = 'borrow';
        else if (r < 0.006) pick = 'stroll';
      } else if ((n === 'Pak Ismail' || n === 'Bu Aisyah') && hr >= 15 && hr < 20 && r < 0.004) pick = 'visit';
      else if (r < 0.008) pick = 'stroll';
      else if (r < 0.011) pick = 'gossip';
      if (!pick) continue;
      appear(s, home); P.mode = pick; P.t = m; P.stage = 0;
      if (pick === 'jog') { s.queue.push; go(hh, s, -home[0], 12.4); go(hh, s, home[0], 12.4); }
      if (pick === 'stroll') { go(hh, s, -16 + Math.random() * 32, 12.0 + Math.random() * 0.8); }
      if (pick === 'gossip') go(hh, s, 14 + Math.random(), 12.3 + Math.random() * 0.4);
      if (pick === 'visit' || pick === 'borrow' || pick === 'repay') go(hh, s, -4, 12.3);
      if (pick === 'visit' && n === 'Pak Ismail' && Math.random() < 0.5 && !hh.others['Bu Aisyah'].plan.mode.includes('visit')) { const a = hh.others['Bu Aisyah']; appear(a, SPAWN.W); a.plan = { mode: 'visit', t: m, stage: 0 }; go(hh, a, -4.4, 12.3); }
      continue;
    }
    if (!idle(s)) { if (m - P.t > 360) { s.queue = []; } else continue; }
    // lanjutan per mode
    if (P.mode === 'jog' || P.mode === 'stroll') {
      if (P.stage === 0 && P.mode === 'stroll' && Math.random() < 0.5) { P.stage = 1; s.anim = 'idle'; P.wait = m + 20 + Math.random() * 40; continue; }
      if (P.wait && m < P.wait) continue;
      if (!nearly(s, home)) { go(hh, s, home[0], home[1]); P.wait = 0; P.stage = 9; continue; }
      goHome(s, home, P, m);
    } else if (P.mode === 'gossip') {
      if (P.stage === 0) { const other = Object.values(hh.others).find((o) => o !== s && o.species === 'npc' && !o.hidden && idle(o)); if (other && Math.random() < 0.7) hh.queueSocial(s, 'gossip', other.name, 'pair'); P.stage = 1; P.wait = m + 30; continue; }
      if (m < P.wait) continue;
      if (!nearly(s, home)) { go(hh, s, home[0], home[1]); continue; }
      goHome(s, home, P, m);
    } else if (['visit', 'borrow', 'repay'].includes(P.mode)) {
      if (P.stage === 0) { go(hh, s, DOOR[0] + (n === 'Bu Aisyah' ? 0.7 : 0), DOOR[1]); P.stage = 1; continue; }
      if (P.stage === 1) { s.yaw = Math.PI; P.stage = 2; P.arrive = m; arrive(hh, s, P); continue; }
      if (P.stage === 2) {
        if (P.mode === 'borrow' && W.loanOffer && m - P.arrive < 90) { s.anim = 'talk'; continue; }
        if (P.mode === 'borrow' && W.loanOffer) { W.loanOffer = null; hh.toast('Bang Jefri kelamaan nunggu, akhirnya pamit pulang 🙂', 'info'); hh.hooks.loanClose && hh.hooks.loanClose(); }
        if (P.mode === 'visit' && m - P.arrive < 120) {
          const h = hh.humans().find((x) => !x.hidden && !x.engagedBy && !x.queue.length && x.lvl === 0);
          if (h && Math.random() < 0.1) hh.queueSocial(s, 'npcChat', h.name, 'pair');
          if (n === 'Pak Ismail' && !P.tv && Math.random() < 0.03) { P.tv = true; const tv = W.objects.find((o) => o.type === 'tv'); if (tv) { hh.queueAct(s, 'watchTV', tv.id); hh.toast('Pak Ismail numpang nonton bola di sofa kalian 😄⚽', 'info'); } }
          if (n === 'Pak Ismail' && W.house.servings > 0 && !P.ate && Math.random() < 0.05) { P.ate = true; const t = W.objects.find((o) => o.type === 'diningTable'); if (t) { hh.queueAct(s, 'eatServing', t.id); hh.toast('Pak Ismail ikut nyicip masakan kalian... nambah dua kali 😅', 'info'); } }
          continue;
        }
        go(hh, s, -4, 12.3); P.stage = 3; continue;
      }
      if (P.stage === 3) { if (!nearly(s, home)) { go(hh, s, home[0], home[1]); P.stage = 4; continue; } }
      goHome(s, home, P, m);
    }
  }
  staffMinute(hh, m, hr);
}
function goHome(s, home, P, m) { hideAt(s, home); P.mode = 'home'; P.next = m + 60 + Math.random() * 240; P.tv = P.ate = false; }

function arrive(hh, s, P) {
  const W = hh.world;
  if (P.mode === 'visit') {
    if (s.name === 'Bu Aisyah' && Math.random() < 0.7) { hh.op({ o: 'house', k: 'servings', d: 2 }); W.house.servingsBy = 'Bu Aisyah'; hh.toast('Bu Aisyah mampir antar opor ayam! +2 porsi di meja makan 🍲', 'good', true); }
    else hh.toast(`${s.name} main ke rumah 👋`, 'info');
    hh.sfx('bell');
  }
  if (P.mode === 'borrow') {
    const amount = [2e6, 5e6, 10e6, 25e6, 50e6][Math.floor(Math.random() * 5)];
    const rate = [0.05, 0.08, 0.1, 0.12, 0.15][Math.floor(Math.random() * 5)];
    const days = 2 + Math.floor(Math.random() * 4);
    W.loanOffer = { amount, rate, days, at: W.time }; W.jefriLast = Math.floor(W.time / 1440);
    hh.sfx('bell'); hh.hooks.loanOffer && hh.hooks.loanOffer(W.loanOffer);
  }
  if (P.mode === 'repay') {
    const L = W.loan; if (!L) return;
    if (Math.random() < 0.15 && !L.delayed) { L.delayed = true; L.due += 1; L.rate += 0.02; hh.toast(`Bang Jefri: "Maaf bang, mundur sehari ya... bunganya aku tambah 2% deh 🙏"`, 'info', true); return; }
    payLoan(hh, 'Bang Jefri datang bayar utang');
  }
}
function payLoan(hh, why) {
  const W = hh.world, L = W.loan; if (!L) return;
  const interest = Math.round(L.amount * L.rate / 1000) * 1000;
  hh.op({ o: 'money', d: L.amount + interest, why: 'Pelunasan utang Bang Jefri', sim: L.lender });
  hh.toast(`${why}: pokok ${fmtRp(L.amount)} + bunga ${fmtRp(interest)} (${Math.round(L.rate * 100)}%) ke ${L.lender} 💰`, 'money', true);
  W.nrel['Bang Jefri'] = clamp((W.nrel['Bang Jefri'] || 0) + 6, -100, 100);
  W.loan = null;
}
export function loanDecision(hh, c) {
  const W = hh.world, O = W.loanOffer; if (!O) return;
  W.loanOffer = null; hh.hooks.loanClose && hh.hooks.loanClose();
  if (!c.accept) { W.nrel['Bang Jefri'] = clamp((W.nrel['Bang Jefri'] || 0) - 3, -100, 100); hh.toast('Bang Jefri: "Yaudah deh, nggak apa-apa. Makasih ya..." 😔', 'info'); return; }
  const lender = hh.sims[c.sim] && !hh.sims[c.sim].isPet && hh.sims[c.sim].species === 'human' ? hh.sims[c.sim] : hh.payer({});
  if (lender.wallet < O.amount) { hh.toast(`Uang ${lender.name} tidak cukup`, 'bad'); return; }
  hh.op({ o: 'money', d: -O.amount, why: 'Dipinjam Bang Jefri', sim: lender.name });
  W.loan = { amount: O.amount, rate: O.rate, due: Math.floor(W.time / 1440) + O.days, lender: lender.name };
  W.nrel['Bang Jefri'] = clamp((W.nrel['Bang Jefri'] || 0) + 4, -100, 100);
  hh.toast(`${lender.name} meminjamkan ${fmtRp(O.amount)} ke Bang Jefri — janji lunas ${O.days} hari lagi + bunga ${Math.round(O.rate * 100)}% 🤝`, 'money', true);
}
export function collectLoan(hh) {
  const L = hh.world.loan; if (!L) return;
  const day = Math.floor(hh.world.time / 1440);
  if (Math.random() < 0.25) payLoan(hh, 'Ditagih, Bang Jefri langsung bayar');
  else hh.toast(`Bang Jefri: "Tenang bang, hari ke-${L.due + 1} aku lunasin plus bunganya. Janji!" (${L.due - day > 0 ? L.due - day + ' hari lagi' : 'hari ini'})`, 'info', true);
}

// ---------- ART ----------
function staffMinute(hh, m, hr) {
  const W = hh.world;
  for (const [n, d] of Object.entries(STAFF)) {
    const s = hh.others[n]; if (!s) continue; const P = s.plan || (s.plan = { mode: 'home' });
    const working = W.staffOn[n] && hr >= 6 && hr < 18;
    if (P.mode === 'home') {
      if (working) { appear(s, SPAWN.W); P.mode = 'work'; go(hh, s, -4, 8.5); hh.toast(`${n} datang kerja (${d.role}) 👋`, 'info'); }
      continue;
    }
    if (P.mode === 'work' && !working) {
      if (s.engagedBy) continue;
      const cur = s.cur; if (cur && hh.stepNoCancel(cur)) continue;
      s.queue.forEach((q) => q.started && hh.endAction(s, q, true)); s.queue = [];
      if (W.staffOn[n]) hh.op({ o: 'money', d: -d.wage, why: `Gaji harian ${n}` });
      P.mode = 'leaving'; go(hh, s, -4, 12.3); go(hh, s, SPAWN.W[0], SPAWN.W[1]); continue;
    }
    if (P.mode === 'leaving') { if (idle(s)) hideAt(s, SPAWN.W), P.mode = 'home'; continue; }
    if (!idle(s)) continue;
    if ((W.privasi || 0) > W.time) { s.anim = 'idle'; continue; }      // menghormati privasi pasangan
    if ((P.cool || 0) > m) continue;
    if (!staffChore(hh, s, d)) { P.cool = m + 10; if (Math.random() < 0.3) { const spot = n === 'Pak Darto' ? [10 + Math.random() * 2, 8.5] : [5.5 + Math.random(), 5.2]; go(hh, s, spot[0], spot[1]); } }
  }
}
function staffChore(hh, s, d) {
  const W = hh.world, H = W.house;
  for (const key of d.chores) {
    if (key === 'mop') { const dirt = W.dirt.find((x) => (x.lvl || 0) === 0); if (dirt && !Object.values(hh.others).some((o) => o.queue.some((q) => q.extra && q.extra.dirt === dirt))) { hh.queueAct(s, 'mop', null, { dirt }); return true; } continue; }
    if (key === 'cook2') { const h = W.time % 1440 / 60; if (!(H.servings === 0 && H.stock >= 2 && ((h >= 6 && h < 8) || (h >= 11 && h < 13) || (h >= 17 && h < 18)))) continue; }
    if (key === 'buyVeg' && !(H.stock < 4 && W.vendor)) continue;
    if (key === 'takeTrash' && H.trash < 2) continue;
    if (key === 'washDishes' && H.dishes < 1) continue;
    if (key === 'laundry' && H.laundry < 3) continue;
    for (const o of W.objects) {
      const T = TYPES[o.type]; if (!T.acts || !T.acts.includes(key) || (o.lvl || 0) !== 0) continue;
      if (key === 'water' && (o.s.water ?? 100) > 45) continue;
      if (key === 'mow' && H.grass < 35) continue;
      if (key === 'washCar' && ((o.s.dirt || 0) < 35 || o.s.away)) continue;
      if (key === 'harvest' && (o.s.growth || 0) < 95) continue;
      if (key === 'fillBowl' && (o.s.food || 0) > 40) continue;
      if (key === 'cleanLitter' && (o.s.dirt || 0) < 2) continue;
      if (hh.objBusy(o, s)) continue;
      const I = INTER[key]; if (!I) continue;
      let ok = false; try { ok = (I.check ? I.check(hh.ctx(s, o)) : true) === true; } catch (e) { ok = false; }
      if (ok) { hh.queueAct(s, key, o.id); return true; }
    }
  }
  return false;
}
