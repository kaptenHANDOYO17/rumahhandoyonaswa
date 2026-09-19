// ============================================================
//  LOGIKA RUMAH TANGGA — state, aksi, kebutuhan, sistem rumah
//  Host menjalankan semua ini; tamu hanya menerima snapshot.
// ============================================================
import {
  TYPES, INITIAL_OBJECTS, NEEDS, SKILLS, SKILL_XP, CAREERS, WORK_START, OUTFIT_DEFAULTS, MOODLETS,
  MOOD_LEVELS, REL_LEVELS, FAMILY_LEVELS, GOAL_POOL, DAY_NAMES, START_MONEY, START_TIME, WALLS, FENCES,
  TREES, LOT, HOUSE, DOORS, SIM_NAMES, PI, fmtRp, clamp,
} from './data.js';
import { INTER, SOCIAL } from './interactions.js';
import { NavGrid } from './path.js';
import { PETS, PET_SELF, PAIR, pairMatch, PET_OBJECTS, petDefaultState, PET_DECAY, petAutonomy, PET_EMOJI } from './pets.js';
export const HUMANS = ['Handoyo', 'Naswa'];
export const WALLET_START = 10000000000;

export const FAMILY_XP = [0, 150, 400, 750, 1200, 1800];
export const SPEEDS = [0, 1, 3, 8];
export const ULTRA = 40;

// ---------- geometri objek ----------
export function spotWorld(obj, sp) {
  const th = obj.rot * PI / 2, c = Math.cos(th), s = Math.sin(th);
  const tr = (lx, lz) => [obj.x + lx * c + lz * s, obj.z - lx * s + lz * c];
  const [ax, az] = tr(sp.ax, sp.az);
  const hasP = sp.px !== undefined;
  const [px, pz] = hasP ? tr(sp.px, sp.pz) : [ax, az];
  return { ax, az, px, pz, hasP, py: sp.py || 0, yaw: th + sp.yaw, seat: sp.seat, lie: sp.lie };
}
export function footprint(type, x, z, rot) {
  const T = TYPES[type]; const odd = rot % 2 === 1;
  const hw = (odd ? T.d : T.w) / 2, hd = (odd ? T.w : T.d) / 2;
  return { minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd };
}
const inHouse = (x, z) => x > HOUSE.minX && x < HOUSE.maxX && z > HOUSE.minZ && z < HOUSE.maxZ;
export const roomAt = (x, z, ROOMS) => ROOMS.find((r) => x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ);

// ---------- interaksi tambahan (diri sendiri, pel, jalan) ----------
export const SELF = {
  orderFood: { label: 'Pesan makanan online (Rp 85.000)', icon: '🛵', check: (c) => ((c.sim.wallet ?? c.world.money) >= 85000 ? (c.world.house.orderAt ? 'Pesanan masih di jalan' : true) : 'Uang tidak cukup'),
    build: () => ({ steps: [{ anim: 'phone', prop: 'phone', dur: 4, onDone: (x) => { x.g.op({ o: 'money', d: -85000, why: 'Pesan makanan' }); x.g.op({ o: 'houseSet', k: 'orderAt', v: x.world.time + 45 }); x.g.toast('Pesanan dibuat — kurir tiba ±45 menit 🛵', 'info'); } }] }) },
  scroll: { label: 'Main HP (scroll medsos)', icon: '📱', build: () => ({ steps: [{ anim: 'phone', prop: 'phone', dur: 20, eff: { fun: 0.7, social: 0.3 } }] }) },
  callMom: { label: 'Telepon Mama', icon: '☎️', build: () => ({ steps: [{ anim: 'phone', prop: 'phone', dur: 15, eff: { social: 2.2, fun: 0.3 }, onDone: (x) => x.g.toast(`${x.sim.name} ditelepon Mama: "Kapan kasih cucu?" 😅`, 'info') }] }) },
  stretch: { label: 'Peregangan', icon: '🧘', build: () => ({ steps: [{ anim: 'exercise', dur: 10, eff: { energy: 0.1, fun: 0.3 }, onTick: (x, gm) => x.sim.xp('bugar', gm * 0.2) }] }) },
  practice: { label: 'Latihan pidato di cermin', icon: '🎤', build: () => ({ steps: [{ anim: 'talk', dur: 20, eff: { fun: 0.2 }, onTick: (x, gm) => x.sim.xp('karisma', gm * 0.4) }] }) },
};
const EXTRA = {
  mop: { label: 'Pel lantai', icon: '🧹', build: (c) => ({ steps: [{ target: { pos: [c.dirt.x, c.dirt.z + 0.4], yaw: PI }, anim: 'mop', prop: 'mop', walkProp: 'mop', dur: c.dirt.puddle ? 4 : 6, eff: { hygiene: -0.2 },
    onDone: (x) => { x.g.removeDirt(c.dirt.id); x.g.goal('mop'); } }] }) },
  go: { label: 'Pergi ke sini', icon: '👣', build: (c) => ({ steps: [{ target: { pos: [c.pos[0], c.pos[1]] }, dur: 0 }] }) },
  passout: { label: 'Pingsan kecapekan', icon: '😵', build: () => ({ steps: [{ anim: 'passout', dur: 150, eff: { energy: 0.4 }, noCancel: true }] }) },
};

INTER.shopMart = { label: 'Belanja ke minimarket (Rp 90.000)', icon: '🛒', check: (c) => ((c.sim.wallet ?? c.world.money) >= 90000 ? (c.world.time % 1440 >= 420 && c.world.time % 1440 < 1260 ? true : 'Minimarket buka 07.00–21.00') : 'Uang tidak cukup'),
  build: () => ({ steps: [{ target: { pos: [-4, 12.2] }, anim: 'idle', dur: 50, hide: true, label: 'Belanja di minimarket', eff: { fun: 0.1 },
    onDone: (x) => { x.g.op({ o: 'money', d: -90000, why: 'Belanja minimarket' }); x.g.op({ o: 'house', k: 'stock', d: 7 }); x.g.toast(`${x.sim.name} pulang belanja — stok dapur +7 🛒`, 'good'); } }] }) };
if (!TYPES.gate.acts.includes('shopMart')) TYPES.gate.acts.push('shopMart');

// ============================================================
//  Sim (data + helper). Ada di host & tamu.
// ============================================================
export class Sim {
  constructor(name, hh) {
    this.name = name; this.hh = hh;
    this.species = PETS[name] || 'human';
    const home = { Handoyo: [-3.2, 1.6], Naswa: [-2.6, 2.6], Oyen: [-6.5, 4.6], Kapi: [-1.5, -7.6] }[name];
    this.x = home[0]; this.z = home[1]; this.y = 0; this.yaw = PI / 2;
    this.needs = { hunger: 72, energy: 80, hygiene: 70, bladder: 64, social: 58, fun: 62 };
    this.skills = {}; SKILLS.forEach((s) => (this.skills[s.id] = 0));
    if (name === 'Handoyo') { this.skills.logika = 120; this.skills.karisma = 60; } else { this.skills.kreatif = 150; this.skills.memasak = 90; }
    this.moods = [];
    this.prof = { career: { level: 0, perf: 20, workedDay: -1 } };
    this.outfit = { ...OUTFIT_DEFAULTS[name] };
    this.goals = [];
    this.autonomy = true;
    this.queue = [];
    this.anim = 'idle'; this.prop = null; this.hidden = false; this.seatH = 0.46;
    this.moving = false; this.engagedBy = null; this.icon = null; this.idleT = 0;
    this.say = null; this.wallet = this.species === 'human' ? WALLET_START : 0; this.bond = { Handoyo: 35, Naswa: 35 }; this.hat = 0;
    if (this.species !== 'human') { this.prof = null; this.skills = {}; this.outfit = { height: 1 }; this.needs = { hunger: 70, energy: 75, hygiene: 80, bladder: 70, social: 60, fun: 55 }; }
  }
  get isPet() { return this.species !== 'human'; }
  skillLvl(id) { return Math.min(10, Math.floor((this.skills[id] || 0) / SKILL_XP)); }
  xp(id, n) {
    if (this.isPet) return;
    const b = this.skillLvl(id);
    this.skills[id] = Math.min(SKILL_XP * 10, (this.skills[id] || 0) + n);
    const a = this.skillLvl(id);
    if (a > b) { const S = SKILLS.find((s) => s.id === id); this.hh.toast(`${this.name} naik ke level ${a} ${S.label} ${S.icon}`, 'good'); this.hh.sfx('level'); }
  }
  mood(k) {
    const M = MOODLETS[k]; if (!M) return;
    this.moods = this.moods.filter((m) => m.k !== k);
    this.moods.push({ k, until: this.hh.world.time + M.dur });
  }
  clearMood(k) { this.moods = this.moods.filter((m) => m.k !== k); }
  addNeed(id, v) { this.needs[id] = clamp(this.needs[id] + v, 0, 100); }
  activeMoodlets() {
    const W = this.hh.world, H = W.house, n = this.needs;
    const out = [];
    for (const m of this.moods) { const M = MOODLETS[m.k]; if (M && m.until > W.time) out.push({ k: m.k, ...M, left: m.until - W.time }); }
    const dyn = {
      rumahBersih: !this.isPet && H.dishes === 0 && H.trash < 3 && W.dirt.length === 0 && H.laundry < 3,
      berantakan: !this.isPet && H.dishes >= 4 || H.trash >= 5 || W.dirt.length >= 3,
      kelaparan: n.hunger < 15, lelah: n.energy < 15, bau: n.hygiene < 20, kebelet: n.bladder < 20,
      bosan: n.fun < 20, kesepian: n.social < 20, matiLampu: !this.isPet && !H.power, nunggak: !this.isPet && H.bills > 0, hujan: W.weather === 'hujan',
    };
    for (const k in dyn) if (dyn[k]) out.push({ k, ...MOODLETS[k] });
    return out;
  }
  moodValue() {
    const avg = NEEDS.reduce((a, d) => a + this.needs[d.id], 0) / NEEDS.length;
    return clamp(Math.round(this.activeMoodlets().reduce((a, m) => a + m.val, 0) + (avg - 50) * 0.6), -100, 100);
  }
  moodLevel() { const v = this.moodValue(); return MOOD_LEVELS.find((l) => v >= l.min); }
  get cur() { return this.queue[0] && this.queue[0].started ? this.queue[0] : null; }
  pub() {
    return {
      x: this.x, z: this.z, y: this.y, yaw: this.yaw, anim: this.anim, prop: this.prop, hidden: this.hidden, seatH: this.seatH,
      needs: this.needs, skills: this.skills, moods: this.moods, prof: this.prof, outfit: this.outfit, goals: this.goals,
      autonomy: this.autonomy, moving: this.moving, engagedBy: this.engagedBy, icon: this.icon, say: this.say,
      species: this.species, wallet: this.wallet, bond: this.bond, hat: this.hat,
      queue: this.queue.map((q) => ({ id: q.id, label: q.label, icon: q.icon, started: !!q.started, step: q.stepLabel || null })),
    };
  }
  load(p) {
    for (const k of ['x', 'z', 'y', 'yaw', 'anim', 'prop', 'hidden', 'seatH', 'needs', 'skills', 'moods', 'prof', 'outfit', 'goals', 'autonomy', 'moving', 'engagedBy', 'icon', 'say', 'wallet', 'bond', 'hat']) if (p[k] !== undefined) this[k] = p[k];
  }
}

// ============================================================
//  Household — dunia game + mesin aksi
// ============================================================
export class Household {
  constructor(hooks = {}) {
    this.hooks = hooks;
    this.nav = new NavGrid();
    this.aid = 0; this.actor = null;
    this.reserved = new Map();
    this.newGame();
  }
  newGame() {
    let id = 1;
    const objects = [...INITIAL_OBJECTS, ...PET_OBJECTS].map(([type, x, z, rot]) => ({ id: id++, type, x, z, rot, s: this.defaultState(type) }));
    this.world = {
      time: START_TIME, speed: 1, money: WALLET_START * 2, petBond: 30, rel: 32, weather: 'cerah', rainLeft: 0, vendor: false, fam: 0,
      house: { stock: 6, dishes: 1, trash: 2, servings: 0, servingsBy: null, laundry: 2, grass: 30, bills: 0, billDue: null, mail: true, power: true, orderAt: null },
      objects, dirt: [{ id: 1, x: 5.6, z: 1.6 }], nextId: id, dirtId: 2, objVer: 1, dirtVer: 1, log: [], day: 0, ultra: false,
    };
    this.sims = {}; for (const n of [...HUMANS, ...Object.keys(PETS)]) this.sims[n] = new Sim(n, this);
    for (const n of HUMANS) this.rollGoals(this.sims[n], 0);
    this.lastMin = Math.floor(this.world.time);
    this.rebuildNav();
  }
  defaultState(type) {
    const ps = petDefaultState(type); if (ps) return ps;
    switch (type) {
      case 'plant': case 'plantPot': return { water: 62 };
      case 'veggie': return { water: 70, growth: 55 };
      case 'bed': return { made: true };
      case 'car': return { dirt: 18, away: false };
      case 'toilet': return { dirt: 1 };
      case 'stove': return { dirt: 0 };
      default: return {};
    }
  }
  toast(msg, type = 'info', big = false) { this.hooks.toast && this.hooks.toast(msg, type, big); }
  sfx(k) { this.hooks.sfx && this.hooks.sfx(k); }
  obj(id) { return this.world.objects.find((o) => o.id === id); }
  day() { return Math.floor(this.world.time / 1440); }
  hour() { return Math.floor(this.world.time / 60) % 24; }
  partner(sim) { return this.sims[sim.name === 'Handoyo' ? 'Naswa' : 'Handoyo']; }
  humans() { return HUMANS.map((n) => this.sims[n]); }
  pets() { return Object.keys(PETS).map((n) => this.sims[n]).filter(Boolean); }
  syncMoney() { this.world.money = this.humans().reduce((a, h) => a + h.wallet, 0); }
  payer(o) { if (o.sim && this.sims[o.sim] && !this.sims[o.sim].isPet) return this.sims[o.sim]; if (this.actor && !this.actor.isPet) return this.actor; const h = this.humans(); return h[0].wallet >= h[1].wallet ? h[0] : h[1]; }
  callPet(name, obj) { const p = this.sims[name]; if (p && !p.queue.length && !p.engagedBy) this.queueAct(p, 'zoomies', null, { self: true }); }
  famLevel() { let l = 0; FAMILY_XP.forEach((x, i) => { if (this.world.fam >= x) l = i; }); return l; }
  relLevel() { return REL_LEVELS.find((l) => this.world.rel >= l.min); }
  nearestObj(type, x, z) {
    let best = null, bd = 1e9;
    for (const o of this.world.objects) if (o.type === type) { const d = (o.x - x) ** 2 + (o.z - z) ** 2; if (d < bd) { bd = d; best = o; } }
    return best;
  }
  ctx(sim, obj, extra = {}) { return { g: this, sim, obj, world: this.world, a: {}, t: 0, abort: false, ...extra }; }

  // ---------- nav ----------
  rebuildNav(excludeId) {
    const n = this.nav; n.stat.fill(0);
    for (const w of WALLS) n.segment(n.stat, w.a, w.b, 0.1);
    for (const f of FENCES) n.segment(n.stat, f.a, f.b, 0.1);
    for (const [x, z] of TREES) n.rect(n.stat, x - 0.3, z - 0.3, x + 0.3, z + 0.3);
    for (const [x, z] of [[9.4, -1.3], [12.6, -1.3], [9.4, 6.3], [12.6, 6.3]]) n.rect(n.stat, x - 0.1, z - 0.1, x + 0.1, z + 0.1);
    for (const o of this.world.objects) {
      if (o.id === excludeId || TYPES[o.type].walk) continue;
      const f = footprint(o.type, o.x, o.z, o.rot);
      n.rect(n.stat, f.minX + 0.04, f.minZ + 0.04, f.maxX - 0.04, f.maxZ - 0.04);
    }
  }
  canPlace(type, x, z, rot, excludeId) {
    const T = TYPES[type]; const f = footprint(type, x, z, rot);
    if (f.minX < LOT.minX + 0.2 || f.maxX > LOT.maxX - 0.2 || f.minZ < LOT.minZ + 0.2 || f.maxZ > LOT.maxZ - 0.2) return 'Harus di dalam kavling';
    if (T.walk) return true;
    this.rebuildNav(excludeId);
    const n = this.nav; const e = 0.05;
    for (let xx = f.minX + e; xx <= f.maxX - e + 1e-6; xx += 0.2) for (let zz = f.minZ + e; zz <= f.maxZ - e + 1e-6; zz += 0.2) if (!n.okXZ(Math.min(xx, f.maxX - e), Math.min(zz, f.maxZ - e))) { this.rebuildNav(); return 'Bertabrakan dengan dinding/benda lain'; }
    for (const d of DOORS) {
      const r = d.axis === 'x' ? { minX: d.x - 0.6, maxX: d.x + 0.6, minZ: d.z - 0.9, maxZ: d.z + 0.9 } : { minX: d.x - 0.9, maxX: d.x + 0.9, minZ: d.z - 0.6, maxZ: d.z + 0.6 };
      if (f.minX < r.maxX && f.maxX > r.minX && f.minZ < r.maxZ && f.maxZ > r.minZ) { this.rebuildNav(); return 'Menghalangi pintu'; }
    }
    // cek titik akses
    const tmp = { id: -1, type, x, z, rot, s: {} };
    n.rect(n.stat, f.minX + 0.04, f.minZ + 0.04, f.maxX - 0.04, f.maxZ - 0.04);
    for (const sp of T.spots) { const w = spotWorld(tmp, sp); if (!n.okXZ(w.ax, w.az)) { this.rebuildNav(); return 'Bagian depan tertutup'; } }
    this.rebuildNav();
    return true;
  }

  // ---------- operasi state ----------
  op(o) {
    const W = this.world, H = W.house;
    switch (o.o) {
      case 'obj': { const ob = this.obj(o.id); if (ob) Object.assign(ob.s, o.patch); break; }
      case 'house': {
        H[o.k] = Math.max(0, (H[o.k] || 0) + o.d); if (o.max !== undefined) H[o.k] = Math.min(o.max, H[o.k]);
        if (o.k === 'servings') { if (o.by) H.servingsBy = o.by; if (H.servings === 0) H.servingsBy = null; }
        break; }
      case 'houseSet': H[o.k] = o.v; break;
      case 'objAdd': { const ob = this.obj(o.id); if (ob) ob.s[o.k] = Math.min(o.max ?? 100, (ob.s[o.k] || 0) + o.d); break; }
      case 'money': { const who = this.payer(o); who.wallet += o.d; this.syncMoney(); o.why = o.why ? `${o.why} (${who.name})` : who.name; } W.log.unshift({ t: W.time, d: o.d, why: o.why || '' }); W.log.length = Math.min(W.log.length, 14);
        this.hooks.money && this.hooks.money(o.d); this.sfx(o.d > 0 ? 'money' : 'spend'); break;
      case 'rel': { const before = this.relLevel().label; W.rel = clamp(W.rel + o.d, -100, 100); const after = this.relLevel().label;
        if (before !== after) this.toast(`Hubungan Handoyo & Naswa sekarang: ${after}`, o.d > 0 ? 'good' : 'bad', o.d > 0); break; }
      case 'payBills': {
        const amt = H.bills; if (amt <= 0 || W.money < amt) break;
        this.op({ o: 'money', d: -amt, why: 'Tagihan listrik, air & IPL' });
        const wasOff = !H.power; H.bills = 0; H.billDue = null; H.power = true; H.mail = false;
        this.addFam(15); this.toast(wasOff ? 'Tagihan lunas — listrik menyala lagi 💡' : 'Tagihan lunas tepat waktu ✔', 'good');
        break; }
    }
  }
  addFam(n) {
    const b = this.famLevel(); this.world.fam += n; const a = this.famLevel();
    if (a > b) { const bonus = 250000 * a; this.op({ o: 'money', d: bonus, why: 'Bonus level keluarga' });
      this.toast(`Level keluarga naik: ${FAMILY_LEVELS[a]}! Bonus ${fmtRp(bonus)} 🏡`, 'good', true); this.sfx('fanfare'); }
  }
  goal(key, sim = this.actor) {
    if (!sim) return;
    const G = sim.goals.find((x) => x.key === key && !x.done);
    if (!G) return;
    G.prog++;
    if (G.prog >= G.need) {
      G.done = true; this.addFam(25); sim.addNeed('fun', 6);
      this.toast(`🎯 ${sim.name}: tujuan "${G.label}" selesai!`, 'good'); this.sfx('goal');
      if (sim.goals.every((x) => x.done)) { this.op({ o: 'money', d: 100000, why: 'Semua tujuan harian' }); this.toast(`${sim.name} menyelesaikan semua tujuan hari ini! +Rp 100.000 ⭐`, 'good', true); }
    }
  }
  rollGoals(sim, day) {
    if (!GOAL_POOL.find((g) => g.key === 'pets')) GOAL_POOL.push({ key: 'pets', label: 'Sayang-sayangan sama Oyen / Kapi', need: 2 });
    const weekend = day % 7 >= 5;
    const pool = GOAL_POOL.filter((g) => !(weekend && g.key === 'work'));
    const pick = [];
    while (pick.length < 3) { const g = pool[Math.floor(Math.random() * pool.length)]; if (!pick.includes(g)) pick.push(g); }
    sim.goals = pick.map((g) => ({ key: g.key, label: g.label, need: g.need, prog: 0, done: false }));
  }
  removeDirt(id) { this.world.dirt = this.world.dirt.filter((d) => d.id !== id); this.world.dirtVer++; }
  addDirt(x, z, puddle = false) {
    if (this.world.dirt.length > 8) return;
    this.world.dirt.push({ id: this.world.dirtId++, x, z, puddle }); this.world.dirtVer++;
  }
  partnerSleepingOn(sim, objId) {
    const p = this.partner(sim); const a = p.cur;
    return !!(a && a.kind === 'inter' && a.key === 'sleep' && a.phase === 'do' && a.dest && a.dest.obj && a.dest.obj.id === objId);
  }
  finishWork(sim) {
    const car = sim.prof.career; const C = CAREERS[sim.name]; const [title, pay] = C.levels[car.level];
    car.workedDay = this.day();
    const rel = sim.name === 'Handoyo' ? sim.skillLvl('karisma') + sim.skillLvl('logika') : sim.skillLvl('kreatif') + sim.skillLvl('logika');
    const gain = Math.round(14 + Math.max(-8, sim.moodValue() / 6) + rel * 1.5);
    car.perf = clamp(car.perf + gain, 0, 100);
    this.op({ o: 'money', d: pay, why: `Gaji ${sim.name}` });
    sim.mood('gajian'); sim.addNeed('energy', -18); sim.addNeed('fun', -12); sim.addNeed('social', 8);
    this.goal('work', sim);
    this.toast(`${sim.name} pulang kerja (${title}) · +${fmtRp(pay)} · kinerja ${gain >= 0 ? '+' : ''}${gain}`, 'money');
    if (car.perf >= 100 && car.level < C.levels.length - 1) {
      car.level++; car.perf = 15; sim.mood('promosi'); this.addFam(60);
      this.toast(`🏆 ${sim.name} naik jabatan jadi ${C.levels[car.level][0]}! Gaji harian ${fmtRp(C.levels[car.level][1])}`, 'good', true); this.sfx('fanfare');
    }
  }
  openOutfit(sim) { this.hooks.openOutfit && this.hooks.openOutfit(sim.name); }

  // ============================================================
  //  Perintah pemain (dipanggil lokal atau dari jaringan)
  // ============================================================
  command(c) {
    const sim = c.sim ? this.sims[c.sim] : null;
    switch (c.c) {
      case 'act': return this.queueAct(sim, c.key, c.objId);
      case 'self': return this.queueAct(sim, c.key, null, { self: true });
      case 'mop': { const d = this.world.dirt.find((x) => x.id === c.dirtId); if (d) this.queueAct(sim, 'mop', null, { dirt: d }); return; }
      case 'go': return this.queueAct(sim, 'go', null, { pos: [c.x, c.z] }, true);
      case 'social': return this.queueSocial(sim, c.key, c.tgt, c.table);
      case 'give': { if (!sim || sim.isPet) return; const p = this.partner(sim); const amt = Math.min(sim.wallet, Math.max(0, +c.amount || 0)); if (amt <= 0) return;
        sim.wallet -= amt; p.wallet += amt; this.syncMoney(); this.world.log.unshift({ t: this.world.time, d: 0, why: `${sim.name} → ${p.name}: ${fmtRp(amt)}` });
        this.toast(`${sim.name} mengirim ${fmtRp(amt)} ke ${p.name} 💸`, 'money'); if (amt >= 1000000) { this.op({ o: 'rel', d: 2 }); p.mood('gajian'); } return; }
      case 'cancel': return this.cancel(sim, c.id);
      case 'speed': this.world.speed = c.v; return;
      case 'auto': sim.autonomy = c.v; return;
      case 'outfit': sim.outfit = { ...sim.outfit, ...c.outfit }; return;
      case 'buy': return this.buy(c.type, c.x, c.z, c.rot, c.sim);
      case 'move': return this.moveObj(c.id, c.x, c.z, c.rot);
      case 'sell': this._seller = c.sim; return this.sell(c.id);
      case 'say': if (sim) { sim.say = { text: String(c.text).slice(0, 120), until: Date.now() + 6000 }; this.hooks.chat && this.hooks.chat(sim.name, sim.say.text); } return;
    }
  }
  buy(type, x, z, rot, simName) {
    const T = TYPES[type]; if (!T || T.fixed) return;
    const buyer = this.payer({ sim: simName });
    if (buyer.wallet < T.price) return this.toast(`Uang ${buyer.name} tidak cukup`, 'bad');
    const ok = this.canPlace(type, x, z, rot); if (ok !== true) return this.toast(ok, 'bad');
    const o = { id: this.world.nextId++, type, x, z, rot, s: this.defaultState(type) };
    this.world.objects.push(o); this.world.objVer++;
    this.op({ o: 'money', d: -T.price, why: `Beli ${T.name}`, sim: buyer.name });
    this.rebuildNav(); this.toast(`${T.name} terpasang ✔`, 'good'); this.addFam(4);
  }
  moveObj(id, x, z, rot) {
    const o = this.obj(id); if (!o || TYPES[o.type].fixed) return;
    if (this.objInUse(id)) return this.toast('Benda sedang dipakai', 'bad');
    const ok = this.canPlace(o.type, x, z, rot, id); if (ok !== true) return this.toast(ok, 'bad');
    o.x = x; o.z = z; o.rot = rot; this.world.objVer++; this.rebuildNav();
  }
  sell(id) {
    const o = this.obj(id); if (!o || TYPES[o.type].fixed) return;
    if (this.objInUse(id)) return this.toast('Benda sedang dipakai', 'bad');
    const back = Math.round(TYPES[o.type].price * 0.7 / 1000) * 1000;
    this.world.objects = this.world.objects.filter((x) => x.id !== id); this.world.objVer++;
    this.op({ o: 'money', d: back, why: `Jual ${TYPES[o.type].name}`, sim: this._seller }); this.rebuildNav();
    this.toast(`${TYPES[o.type].name} dijual ${fmtRp(back)}`, 'money');
  }
  objBusy(o, sim) {
    const T = TYPES[o.type]; if (T.spots.length === 0) return false;
    return T.spots.every((sp, i) => { const r = this.reserved.get(o.id + ':' + i); return r && r !== sim.name; });
  }
  objInUse(id) {
    for (const s of Object.values(this.sims)) for (const q of s.queue) if (q.objId === id || (q.dest && q.dest.obj && q.dest.obj.id === id)) return true;
    return false;
  }

  // ---------- menu (dipakai UI di host maupun tamu) ----------
  menuFor(sim, target) {
    const items = [];
    if (target.objId !== undefined) {
      const o = this.obj(target.objId); if (!o) return items;
      for (const key of (sim.isPet ? (TYPES[o.type].petActs || []) : TYPES[o.type].acts)) {
        const I = INTER[key]; if (!I) continue;
        const c = this.ctx(sim, o);
        let ok = true; try { ok = I.check ? I.check(c) : true; } catch (e) { ok = false; }
        if (ok === false) continue;
        items.push({ key, label: typeof I.label === 'function' ? I.label(c) : I.label, icon: I.icon, disabled: ok !== true ? ok : null, cmd: { c: 'act', key, objId: o.id } });
      }
    } else if (target.sim) {
      const p = this.sims[target.sim];
      if (p === sim && sim.isPet) {
        for (const key in PET_SELF) { const I = PET_SELF[key]; if (I.only !== 'any' && I.only !== sim.species) continue; items.push({ key, label: I.label, icon: I.icon, disabled: null, cmd: { c: 'self', key } }); }
      } else if (sim.isPet || p.isPet) {
        for (const key in PAIR) {
          const S = PAIR[key]; if (!pairMatch(S, sim.species, p.species)) continue;
          let dis = null; if (p.hidden) dis = `${p.name} sedang pergi`;
          items.push({ key, label: S.label, icon: S.icon, disabled: dis, cmd: { c: 'social', key, tgt: p.name, table: 'pair' } });
        }
      } else if (p === sim) {
        for (const key in SELF) { const I = SELF[key]; const c = this.ctx(sim, null); const ok = I.check ? I.check(c) : true; if (ok === false) continue;
          items.push({ key, label: I.label, icon: I.icon, disabled: ok !== true ? ok : null, cmd: { c: 'self', key } }); }
      } else {
        const H = this.world.house; const messy = H.dishes >= 3 || H.trash >= 4 || this.world.dirt.length >= 2;
        for (const key in SOCIAL) {
          const S = SOCIAL[key];
          if (S.messy && !messy) continue;
          let dis = null;
          if (this.world.rel < S.min) dis = 'Hubungan belum cukup dekat';
          if (S.needType && !this.world.objects.some((o) => o.type === S.needType)) dis = 'Butuh speaker musik';
          if (S.clears && !S.clears.some((k) => p.moods.some((m) => m.k === k && m.until > this.world.time))) continue;
          if (p.hidden) dis = `${p.name} sedang di kantor`;
          items.push({ key, label: S.label, icon: S.icon, disabled: dis, cmd: { c: 'social', key, tgt: p.name }, romantic: S.romantic });
        }
      }
    } else if (target.dirtId !== undefined) {
      items.push({ key: 'mop', label: 'Pel lantai', icon: '🧹', cmd: { c: 'mop', dirtId: target.dirtId } });
    }
    return items;
  }

  // ============================================================
  //  Antrian aksi
  // ============================================================
  queueAct(sim, key, objId, extra = {}, replace = false) {
    if (!sim) return;
    const I = extra.self ? (SELF[key] || PET_SELF[key]) : (INTER[key] || EXTRA[key]); if (!I) return;
    const obj = objId != null ? this.obj(objId) : null;
    if (objId != null && !obj) return;
    const c = this.ctx(sim, obj, extra);
    const ok = I.check ? I.check(c) : true;
    if (ok !== true) { if (typeof ok === 'string') this.toast(ok, 'bad'); return; }
    if (replace && sim.queue.length && sim.queue[sim.queue.length - 1].key === 'go' && !sim.queue[sim.queue.length - 1].started) sim.queue.pop();
    if (sim.queue.length >= 6) return this.toast('Antrian aksi penuh', 'bad');
    sim.queue.push({ id: ++this.aid, kind: 'inter', key, self: !!extra.self, objId, extra, label: typeof I.label === 'function' ? I.label(c) : I.label, icon: I.icon });
    sim.idleT = 0;
    if (replace && sim.queue.length > 1 && sim.cur && !this.stepNoCancel(sim.cur)) this.cancel(sim, sim.cur.id);
  }
  queueSocial(sim, key, tgt, table) {
    if (!sim) return;
    if (!tgt) tgt = sim.isPet ? null : this.partner(sim).name;
    const p = this.sims[tgt]; if (!p || p === sim) return;
    if (!table) table = (!sim.isPet && !p.isPet) ? 'social' : 'pair';
    const S = table === 'pair' ? PAIR[key] : SOCIAL[key]; if (!S) return;
    if (table === 'pair' && !pairMatch(S, sim.species, p.species)) return;
    if (sim.queue.length >= 6) return;
    sim.queue.push({ id: ++this.aid, kind: 'social', key, tgt, table, label: `${S.label}${S.label.includes(tgt) ? '' : ' ' + tgt}`, icon: S.icon });
    sim.idleT = 0;
  }
  stepNoCancel(a) { return a.steps && a.steps[a.si] && a.steps[a.si].noCancel && a.phase === 'do'; }
  cancel(sim, id) {
    const i = sim.queue.findIndex((q) => q.id === id); if (i < 0) return;
    const a = sim.queue[i];
    if (a.started) {
      if (this.stepNoCancel(a)) return this.toast('Aksi ini tidak bisa dibatalkan', 'bad');
      this.endAction(sim, a, true);
    } else sim.queue.splice(i, 1);
  }
  endAction(sim, a, cancelled) {
    const step = a.steps && a.steps[a.si];
    this.actor = sim;
    if (a.kind === 'social') this.releasePartner(sim, a);
    else if (step) {
      const x = a.x; x.t = a.t;
      if (a.phase === 'do' && a.begun && step.onEnd) try { step.onEnd(x); } catch (e) { console.warn(e); }
      if (cancelled && step.onCancel) try { step.onCancel(x); } catch (e) { console.warn(e); }
    }
    this.release(sim);
    sim.queue = sim.queue.filter((q) => q !== a);
    sim.hidden = false; sim.icon = null; sim.prop = null; sim.moving = false;
    if (sim.leaveTo) this.standUp(sim);
    if (!sim.queue.length) sim.anim = 'idle';
    this.actor = null;
  }
  release(sim) { for (const [k, v] of this.reserved) if (v === sim.name) this.reserved.delete(k); }
  standUp(sim) { const l = sim.leaveTo; sim.leaveTo = null; sim.x = l.x; sim.z = l.z; sim.y = 0; }

  pickSpot(sim, o, kind) {
    const T = TYPES[o.type]; let best = null, bd = 1e9;
    const pk = kind === 'pet';
    (pk ? (T.pspots || []) : T.spots).forEach((sp, i) => {
      if (pk) i = 'p' + i;
      else if (kind === 'seat' && !sp.seat) return; if (kind === 'lie' && !sp.lie) return; if (kind === 'stand' && (sp.seat || sp.lie)) return;
      const key = o.id + ':' + i; const r = this.reserved.get(key); if (r && r !== sim.name) return;
      const w = spotWorld(o, sp); const d = (w.ax - sim.x) ** 2 + (w.az - sim.z) ** 2;
      if (d < bd) { bd = d; best = { ...w, key }; }
    });
    return best;
  }
  resolve(sim, step, act) {
    const tg = step.target;
    if (!tg) return { here: true, obj: act.obj || null };
    if (tg.pos) return { ax: tg.pos[0], az: tg.pos[1], px: tg.pos[0], pz: tg.pos[1], py: 0, yaw: tg.yaw ?? null, obj: null };
    let cands;
    if (tg.obj !== undefined) cands = [this.obj(tg.obj)].filter(Boolean);
    else { const types = [].concat(tg.type); cands = this.world.objects.filter((o) => types.includes(o.type)); }
    const ref = tg.near || sim;
    cands.sort((a, b) => ((a.x - ref.x) ** 2 + (a.z - ref.z) ** 2) - ((b.x - ref.x) ** 2 + (b.z - ref.z) ** 2));
    for (const o of cands) { const sp = this.pickSpot(sim, o, tg.kind); if (sp) return { ...sp, obj: o }; }
    const busy = cands.length > 0 && !step.fallbackHere;
    if (busy) return { busy: true };
    if (step.fallbackTarget) { const o = this.obj(step.fallbackTarget.obj); const sp = o && this.pickSpot(sim, o, null); if (sp) return { ...sp, obj: o, anim: step.fallbackHere, hasP: false }; }
    if (step.fallbackHere) return { here: true, obj: null, anim: step.fallbackHere };
    return null;
  }

  startAction(sim, a) {
    a.started = true;
    if (a.kind === 'social') return this.startSocial(sim, a);
    const I = a.self ? (SELF[a.key] || PET_SELF[a.key]) : (INTER[a.key] || EXTRA[a.key]);
    a.obj = a.objId != null ? this.obj(a.objId) : null;
    const c = this.ctx(sim, a.obj, a.extra);
    const ok = I.check ? I.check(c) : true;
    if (ok !== true || (a.objId != null && !a.obj)) { if (typeof ok === 'string') this.toast(`${sim.name}: ${ok}`, 'bad'); sim.queue.shift(); return; }
    const b = I.build(c);
    a.steps = b.steps; a.si = -1; a.x = c; a.x.a = {};
    this.nextStep(sim, a);
  }
  nextStep(sim, a) {
    a.si++; a.t = 0; a.begun = false; a.path = null; a.dest = null;
    this.release(sim);
    if (a.si >= a.steps.length || a.x.abort) { this.endAction(sim, a, false); return; }
    const step = a.steps[a.si];
    a.stepLabel = step.label || null;
    const dest = this.resolve(sim, step, a);
    if (dest && dest.busy) { a.si--; a.phase = 'wait'; a.waitT = 0; a.stepLabel = 'Menunggu giliran…'; sim.anim = 'idle'; return; }
    if (!dest) { this.toast(`${sim.name}: tidak menemukan tempat untuk "${a.label}"`, 'bad'); this.endAction(sim, a, true); return; }
    if (dest.key) this.reserved.set(dest.key, sim.name);
    a.dest = dest; a.x.obj = dest.obj || (dest.here ? a.obj : null);
    if (dest.here) { a.phase = 'do'; return; }
    const d = Math.hypot(dest.ax - sim.x, dest.az - sim.z);
    if (d < 0.08) { a.phase = 'pose'; a.poseT = 0; return; }
    const start = sim.leaveTo ? { ...sim.leaveTo } : { x: sim.x, z: sim.z };
    const path = this.nav.find(start.x, start.z, dest.ax, dest.az);
    if (!path) {
      if (d < 1.2) { a.path = [{ x: dest.ax, z: dest.az }]; }
      else { this.toast(`${sim.name} tidak bisa ke sana`, 'bad'); this.endAction(sim, a, true); return; }
    } else a.path = path;
    if (sim.leaveTo) { a.path.unshift({ x: sim.leaveTo.x, z: sim.leaveTo.z }); sim.leaveTo = null; sim.y = 0; }
    a.phase = 'walk';
  }

  // ---------- sosial ----------
  startSocial(sim, a) {
    const p = this.sims[a.tgt] || this.partner(sim); const S = a.table === 'pair' ? PAIR[a.key] : SOCIAL[a.key];
    const fail = (m) => { this.toast(m, 'bad'); sim.queue.shift(); };
    if (p.hidden) return fail(`${p.name} sedang di luar rumah`);
    const pc = p.cur;
    if (pc && pc.kind === 'inter' && ['sleep', 'nap', 'napSofa', 'passout', 'sleepPet', 'napSofaCat', 'napBedCat'].includes(pc.key) && a.key !== 'cuddle') return fail(`${p.name} sedang tidur — jangan diganggu 😴`);
    if (sim.isPet && !p.isPet && (pc || p.queue.length > 1)) { sim.queue.shift(); return; }
    if (p.engagedBy) return fail(`${p.name} sedang sibuk`);
    if (pc && pc.kind === 'social') return fail(`${p.name} sedang mengajak ngobrol`);
    if (pc) { if (this.stepNoCancel(pc)) return fail(`${p.name} sedang sibuk`); this.endAction(p, pc, true); }
    if (p.leaveTo) this.standUp(p);
    p.moving = false; p.engagedBy = sim.name; p.anim = 'idle';
    a.partner = p.name; a.si = 0; a.t = 0;
    // posisi
    const d = S.close || 0.9;
    let dest;
    if (S.ride || S.carry) { dest = { x: p.x + Math.sin(p.yaw + PI / 2) * d, z: p.z + Math.cos(p.yaw + PI / 2) * d }; if (!this.nav.okXZ(dest.x, dest.z)) dest = { x: p.x, z: p.z }; }
    else if (S.behind) { dest = { x: p.x - Math.sin(p.yaw) * d, z: p.z - Math.cos(p.yaw) * d }; }
    else {
      let ux = sim.x - p.x, uz = sim.z - p.z; const L = Math.hypot(ux, uz) || 1; ux /= L; uz /= L;
      dest = null;
      for (let k = 0; k < 8 && !dest; k++) {
        const ang = Math.atan2(ux, uz) + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * PI / 4;
        const x = p.x + Math.sin(ang) * d, z = p.z + Math.cos(ang) * d;
        if (this.nav.okXZ(x, z) || k === 7) dest = { x, z };
      }
    }
    a.dest = { ax: dest.x, az: dest.z, px: dest.x, pz: dest.z, py: 0, yaw: null, obj: null };
    const path = Math.hypot(dest.x - sim.x, dest.z - sim.z) < 0.1 ? [] : (this.nav.find(sim.x, sim.z, dest.x, dest.z) || [{ x: dest.x, z: dest.z }]);
    if (sim.leaveTo) { path.unshift({ ...sim.leaveTo }); sim.leaveTo = null; sim.y = 0; }
    a.path = path; a.phase = path.length ? 'walk' : 'do'; a.steps = null;
  }
  releasePartner(sim, a) {
    const p = a.partner && this.sims[a.partner];
    if (p && p.engagedBy === sim.name) { p.engagedBy = null; p.anim = 'idle'; p.icon = null; p.y = 0; if (a.carryFrom) { p.x = a.carryFrom.x; p.z = a.carryFrom.z; } }
    sim.icon = null; if (a.riding) { sim.y = 0; sim.x += 0.5; } sim.prop = null;
  }
  tickSocial(sim, a, gm) {
    const pairT = a.table === 'pair';
    const S = pairT ? PAIR[a.key] : SOCIAL[a.key]; const p = this.sims[a.partner];
    if (!p || p.engagedBy !== sim.name) { this.endAction(sim, a, true); return; }
    // saling berhadapan
    const face = Math.atan2(p.x - sim.x, p.z - sim.z);
    if (S.ride) { a.riding = true; sim.x = p.x; sim.z = p.z; sim.yaw = p.yaw; sim.y = p.y + 0.6; }
    else if (S.carry) { if (!a.carryFrom) a.carryFrom = { x: p.x, z: p.z }; p.x = sim.x + Math.sin(sim.yaw) * 0.22; p.z = sim.z + Math.cos(sim.yaw) * 0.22; p.y = 0.92; p.yaw = sim.yaw + PI / 2; }
    else { sim.yaw = face; if (!S.behind) p.yaw = face + PI; }
    if (!a.begun) {
      a.begun = true;
      const pm = p.moodValue();
      if (pairT) { const bond = p.isPet ? (p.bond[sim.name] ?? 30) : 50; a.reject = !!S.picky && (bond < 40 || pm < -10) && Math.random() < 0.35; }
      else a.reject = S.romantic && (pm < -20 || this.world.rel < S.min + 5) && Math.random() < 0.45;
      if (a.key === 'complain' || a.key === 'apology') a.reject = false;
      if (a.reject) a.dur = 3;
    }
    const anims = a.reject ? (pairT ? [sim.isPet ? 'idle' : 'sad', 'jog'] : ['talk', 'angry']) : S.anim;
    sim.anim = anims[0]; p.anim = anims[1]; sim.icon = S.icon; p.icon = a.reject ? '💢' : null; sim.prop = S.prop || null;
    if (a.reject && S.carry) { p.y = 0; if (a.carryFrom) { p.x = a.carryFrom.x; p.z = a.carryFrom.z; } }
    a.t += gm;
    if (!a.reject) {
      for (const k in S.gain) sim.addNeed(k, S.gain[k] * gm);
      const pg = S.pgain || S.gain; for (const k in pg) p.addNeed(k, pg[k] * gm);
    }
    const dur = a.dur || S.dur;
    if (a.t >= dur) {
      this.actor = sim;
      if (a.reject && pairT) { this.toast(`${p.name} meronta dan kabur 🙀`, 'bad'); this.bondAdd(sim, p, -1); }
      else if (a.reject) {
        sim.mood('ditolak'); this.op({ o: 'rel', d: -3 });
        this.toast(`${p.name} lagi nggak mood... ${sim.name} ditolak 💔`, 'bad');
      } else if (pairT) {
        this.bondAdd(sim, p, S.bond || 0);
        if (S.mood) sim.mood(S.mood); if (S.pmood) p.mood(S.pmood);
        if (S.hat) p.hat = this.world.time + 120;
        if (!sim.isPet && p.isPet) this.goal('pets', sim);
        if (S.beg) { const bowl = this.nearestObj('petBowl', p.x, p.z); if (bowl && (bowl.s.food || 0) < 40) { if (p.autonomy) this.queueAct(p, 'fillBowl', bowl.id); this.toast(`${sim.name} minta makan ke ${p.name} ${PET_EMOJI[sim.species] || ''}`, 'info'); } }
        if (Math.random() < 0.2) this.addFam(1);
      } else {
        this.op({ o: 'rel', d: S.rel });
        if (S.mood) { sim.mood(S.mood); p.mood(S.mood); }
        if (S.pmood) p.mood(S.pmood);
        if (S.clears) for (const k of S.clears) { p.clearMood(k); sim.clearMood(k); }
        if (S.goal) { this.goal(S.goal, sim); this.goal(S.goal, p); }
        sim.xp('karisma', 3);
        if (S.rel > 0 && Math.random() < 0.3) this.addFam(2);
      }
      this.endAction(sim, a, false);
    }
  }

  // ============================================================
  //  TICK (host)
  // ============================================================
  tick(dtReal) {
    const W = this.world;
    const sims = Object.values(this.sims);
    // ultra: semua tidur / di kantor
    const busyLong = (s) => { const a = s.cur; return a && a.kind === 'inter' && a.phase === 'do' && (a.key === 'sleep' || (a.steps && a.steps[a.si] && a.steps[a.si].hide)); };
    W.ultra = W.speed > 0 && this.humans().every(busyLong);
    const mul = W.speed === 0 ? 0 : (W.ultra ? ULTRA : SPEEDS[W.speed]);
    const gm = dtReal * mul;
    if (gm > 0) {
      W.time += gm;
      const m = Math.floor(W.time);
      while (this.lastMin < m) { this.lastMin++; this.minuteEvents(this.lastMin); }
      this.continuous(gm);
    }
    for (const s of sims) this.tickSim(s, dtReal, gm, mul);
  }
  continuous(gm) {
    const W = this.world, H = W.house, h = gm / 60;
    H.grass = Math.min(100, H.grass + 1.5 * h);
    const rain = W.weather === 'hujan';
    for (const o of W.objects) {
      const s = o.s;
      if (o.type === 'plant' || o.type === 'plantPot' || o.type === 'veggie') {
        const outdoor = !inHouse(o.x, o.z);
        s.water = clamp((s.water ?? 100) + (rain && outdoor ? 40 : -2.6) * h, 0, 100);
        if (o.type === 'veggie' && s.water > 25) s.growth = Math.min(100, (s.growth || 0) + (100 / 40) * h);
      }
      if (o.type === 'clothesline' && s.clothes === 'wet') { if (rain) s.dryAt += gm; else if (W.time >= s.dryAt) { s.clothes = 'dry'; this.toast('Jemuran sudah kering — bisa diangkat 👚', 'info'); } }
      if (o.type === 'car' && rain && !s.away) s.dirt = Math.min(100, (s.dirt || 0) + 4 * h);
    }
    if (H.orderAt && W.time >= H.orderAt) { H.orderAt = null; this.op({ o: 'house', k: 'servings', d: 2 }); H.servingsBy = 'kurir'; this.toast('Paket makanan tiba! 2 porsi siap di meja makan 🍱', 'good', true); this.sfx('bell'); }
    for (const s of Object.values(this.sims)) this.decay(s, gm);
    // hubungan pelan-pelan mendingin
    W.rel = clamp(W.rel - 0.08 * h * Math.sign(W.rel), -100, 100);
  }
  decay(sim, gm) {
    const a = sim.cur; const sleeping = a && a.kind === 'inter' && ['sleep', 'nap', 'napSofa', 'sleepPet', 'napSofaCat', 'napBedCat'].includes(a.key) && a.phase === 'do';
    const away = sim.hidden;
    for (const d of NEEDS) {
      let r = d.decay / 60 * (sim.isPet ? PET_DECAY[sim.species][d.id] : 1);
      if (sleeping && (d.id === 'hunger' || d.id === 'bladder')) r *= 0.45;
      if (sleeping && (d.id === 'energy' || d.id === 'social' || d.id === 'fun')) r = d.id === 'energy' ? 0 : r * 0.2;
      if (away) r *= { social: 0, bladder: 0.25, hunger: 0.55, hygiene: 0.5, energy: 0.7, fun: 0.6 }[d.id];
      if (d.id === 'social' && !sim.isPet && !this.partner(sim).hidden) r *= 0.8;
      sim.needs[d.id] = clamp(sim.needs[d.id] - r * gm, 0, 100);
    }
    // kejadian kritis
    if (sim.isPet && sim.needs.bladder <= 0) {
      sim.needs.bladder = 100;
      if (sim.x > HOUSE.minX && sim.x < HOUSE.maxX && sim.z > HOUSE.minZ && sim.z < HOUSE.maxZ) { this.addDirt(sim.x + 0.2, sim.z, true); this.toast(`${sim.name} pipis sembarangan di lantai 😾 — pel ya`, 'bad'); }
    }
    if (sim.isPet && sim.needs.energy <= 0) { sim.needs.energy = 8; if (sim.cur && !this.stepNoCancel(sim.cur)) this.endAction(sim, sim.cur, true); this.queueAct(sim, 'napHere', null, { self: true }); }
    if (!sim.isPet && sim.needs.bladder <= 0 && !sim.hidden) {
      sim.needs.bladder = 100; sim.addNeed('hygiene', -35); sim.mood('malu');
      if (sim.cur && !this.stepNoCancel(sim.cur)) this.endAction(sim, sim.cur, true);
      this.addDirt(sim.x + 0.3, sim.z, true);
      this.toast(`Aduh! ${sim.name} ngompol... 😳`, 'bad', true);
    }
    if (!sim.isPet && sim.needs.energy <= 0 && !sim.hidden && !(sim.queue[0] && sim.queue[0].key === 'passout')) {
      if (sim.cur && !this.stepNoCancel(sim.cur)) this.endAction(sim, sim.cur, true);
      if (sim.engagedBy) { const o = this.sims[sim.engagedBy]; o.cur && this.endAction(o, o.cur, true); }
      sim.queue.unshift({ id: ++this.aid, kind: 'inter', key: 'passout', objId: null, extra: {}, label: 'Pingsan kecapekan', icon: '😵' });
      this.toast(`${sim.name} pingsan karena kecapekan 😵`, 'bad', true);
    }
    sim.moods = sim.moods.filter((m) => m.until > this.world.time);
  }
  minuteEvents(m) {
    const W = this.world, H = W.house;
    const day = Math.floor(m / 1440), min = m % 1440, hr = Math.floor(min / 60);
    if (min === 0) {
      W.day = day;
      for (const s of this.humans()) this.rollGoals(s, day);
      this.toast(`☀️ ${DAY_NAMES[day % 7]}, hari ke-${day + 1} di Griya Asri`, 'info', true);
      this.hooks.newDay && this.hooks.newDay(day);
      W.weather = 'cerah'; W.rainLeft = 0;
    }
    if (min === 7 * 60) { W.vendor = true; this.toast('"Sayuuur... sayur!" — Mang Ujang lewat depan rumah 🥬 (klik pagar)', 'info'); this.sfx('bell'); }
    if (min === 9 * 60 + 30) W.vendor = false;
    if (min === 9 * 60 && day > 0 && day % 3 === 0 && H.bills === 0) {
      const val = W.objects.reduce((a, o) => a + TYPES[o.type].price, 0);
      H.bills = Math.round((180000 + val * 0.006) / 1000) * 1000; H.billDue = m + 3 * 1440;
      this.toast(`🧾 Tagihan listrik, air & IPL datang: ${fmtRp(H.bills)} — bayar di kotak surat`, 'bad', true); this.sfx('bell');
    }
    if (H.billDue && m >= H.billDue && H.power && H.bills > 0) { H.power = false; this.toast('⚡ Listrik diputus karena tagihan menunggak!', 'bad', true); }
    if (min === 10 * 60 && Math.random() < 0.45) { H.mail = true; }
    if (min === 12 * 60 && day % 7 < 5) {
      for (const s of this.humans()) {
        const car = s.prof.career;
        if (car.workedDay !== day && !s.hidden) { car.perf = clamp(car.perf - 15, 0, 100); this.toast(`${s.name} bolos kerja hari ini — kinerja turun 📉`, 'bad'); }
      }
    }
    if (min % 60 === 0) {
      // cuaca
      if (W.weather === 'hujan') { W.rainLeft--; if (W.rainLeft <= 0) { W.weather = 'cerah'; this.toast('Hujan reda 🌤️', 'info'); } }
      else if (Math.random() < (hr >= 13 && hr <= 18 ? 0.09 : 0.03)) { W.weather = 'hujan'; W.rainLeft = 1 + Math.floor(Math.random() * 3); this.toast('Hujan turun... jemuran aman? 🌧️', 'info'); }
      // kotoran
      if (Math.random() < 0.1 + (W.weather === 'hujan' ? 0.12 : 0)) {
        for (let k = 0; k < 20; k++) {
          const x = -7.5 + Math.random() * 15, z = -5.5 + Math.random() * 11;
          if (this.nav.okXZ(x, z)) { this.addDirt(x, z, false); break; }
        }
      }
      // kejadian acak
      if (hr >= 9 && hr <= 20 && Math.random() < 0.04) this.randomEvent();
    }
  }
  randomEvent() {
    const ev = [
      () => { this.op({ o: 'house', k: 'stock', d: 2 }); this.toast('Bu RT mengantar rendang hasil arisan 🍛 (+2 stok)', 'good', true); },
      () => { this.op({ o: 'money', d: 50000, why: 'Menang doorprize RT' }); this.toast('Kalian menang doorprize kerja bakti! +Rp 50.000 🎁', 'money', true); },
      () => { const s = this.sims[Math.random() < 0.5 ? 'Handoyo' : 'Naswa']; s.addNeed('social', 20); this.toast(`Pak Satpam ngajak ${s.name} ngobrol sebentar 👮`, 'info'); },
      () => { this.addDirt(-3 + Math.random() * 2, 4 + Math.random(), false); this.toast('Kucing tetangga masuk dan bikin kotor lantai 🐈', 'bad'); },
      () => { this.world.house.mail = true; this.toast('Ada surat baru di kotak surat 💌', 'info'); },
    ];
    ev[Math.floor(Math.random() * ev.length)]();
  }

  // ---------- per-sim ----------
  tickSim(sim, dt, gm, mul) {
    if (sim.say && sim.say.until < Date.now()) sim.say = null;
    if (sim.engagedBy) return;
    let a = sim.cur;
    if (!a) {
      sim.moving = false; if (!sim.queue.length) { sim.anim = 'idle'; sim.prop = null; }
      if (sim.queue.length) { this.startAction(sim, sim.queue[0]); a = sim.cur; }
      else { sim.idleT += gm; if (sim.autonomy && sim.idleT > (sim.isPet ? 12 : 25)) { sim.idleT = 0; if (sim.isPet) petAutonomy(this, sim); else this.autonomy(sim); } return; }
      if (!a) return;
    }
    if (a.kind === 'social' && a.phase === 'do') { sim.moving = false; return this.tickSocial(sim, a, gm); }
    if (a.phase === 'wait') {
      a.waitT += gm; sim.anim = 'idle'; sim.moving = false;
      if (a.waitT > 90) { this.toast(`${sim.name} bosan menunggu — "${a.label}" batal`, 'bad'); this.endAction(sim, a, true); return; }
      a.retry = (a.retry || 0) + dt; if (a.retry > 0.5) { a.retry = 0; this.nextStep(sim, a); }
      return;
    }
    const step = a.steps ? a.steps[a.si] : null;
    if (a.phase === 'walk') {
      this.walk(sim, a, dt, mul, step, gm);
      return;
    }
    if (a.phase === 'pose') {
      const d = a.dest;
      if (d.hasP && !(step && step.noPose)) { sim.leaveTo = { x: d.ax, z: d.az }; sim.x = d.px; sim.z = d.pz; sim.y = d.py; }
      if (d.yaw !== null && d.yaw !== undefined) sim.yaw = d.yaw;
      if (d.seat) sim.seatH = d.seat;
      a.phase = 'do'; return;
    }
    if (a.phase === 'do' && step) {
      const x = a.x; this.actor = sim;
      sim.moving = false;
      if (!a.begun) {
        a.begun = true; x.t = 0;
        if (step.onStart) try { step.onStart(x); } catch (e) { console.warn(e); }
        if (step.hide) sim.hidden = true;
      }
      sim.anim = (a.dest && a.dest.anim) || step.anim || 'idle';
      sim.prop = step.prop || null;
      if (step.wander) this.wander(sim, a, step, dt, mul);
      a.t += gm; x.t = a.t;
      if (step.eff) for (const k in step.eff) sim.addNeed(k, step.eff[k] * gm);
      if (step.onTick && gm > 0) try { step.onTick(x, gm); } catch (e) { console.warn(e); }
      const done = step.until ? (step.until(x) || a.t > 960) : a.t >= (step.dur || 0);
      if (done) {
        if (step.onEnd) try { step.onEnd(x); } catch (e) { console.warn(e); }
        a.begun = false;
        if (step.onDone) try { step.onDone(x); } catch (e) { console.warn(e); }
        sim.hidden = false;
        if (sim.cur === a) this.nextStep(sim, a);
      }
      this.actor = null;
    }
  }
  walk(sim, a, dt, mul, step, gm) {
    const run = step && step.walkAnim === 'jog';
    const base = sim.species === 'cat' ? (run ? 3.2 : 1.5) : sim.species === 'capy' ? (run ? 2.4 : 1.05) : (run ? 2.6 : 1.45);
    const v = base * Math.min(Math.max(mul, 1), 6) * (mul === 0 ? 0 : 1);
    let left = v * dt;
    sim.anim = (step && step.walkAnim) || 'walk'; sim.prop = (step && step.walkProp) || null; sim.moving = mul > 0;
    if (step && step.walkEff) for (const k in step.walkEff) sim.addNeed(k, step.walkEff[k] * gm);
    if (a.kind === 'social') { sim.anim = 'walk'; sim.prop = null; }
    while (left > 0 && a.path.length) {
      const p = a.path[0]; const dx = p.x - sim.x, dz = p.z - sim.z; const d = Math.hypot(dx, dz);
      if (d > 1e-4) {
        const ty = Math.atan2(dx, dz); let dy = ty - sim.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        sim.yaw += dy * Math.min(1, dt * 12);
      }
      if (d <= left) { sim.x = p.x; sim.z = p.z; left -= d; a.path.shift(); }
      else { sim.x += dx / d * left; sim.z += dz / d * left; left = 0; }
    }
    if (!a.path.length) {
      sim.moving = false;
      if (a.kind === 'social') { a.phase = 'do'; return; }
      a.phase = 'pose';
    }
  }
  wander(sim, a, step, dt, mul) {
    const c = a.dest; const R = step.wander;
    if (!a.wt || Math.hypot(a.wt.x - sim.x, a.wt.z - sim.z) < 0.1) {
      for (let k = 0; k < 10; k++) { const x = c.ax + (Math.random() * 2 - 1) * R * 1.4, z = c.az + (Math.random() * 2 - 1) * R * 0.5; if (this.nav.okXZ(x, z)) { a.wt = { x, z }; break; } }
      if (!a.wt) a.wt = { x: c.ax, z: c.az };
    }
    const dx = a.wt.x - sim.x, dz = a.wt.z - sim.z, d = Math.hypot(dx, dz), v = 1.0 * Math.min(Math.max(mul, 1), 6) * dt;
    if (d > 0.01) { sim.x += dx / d * Math.min(d, v); sim.z += dz / d * Math.min(d, v); let dy = Math.atan2(dx, dz) - sim.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); sim.yaw += dy * Math.min(1, dt * 6); }
  }

  // ---------- kehendak bebas ----------
  autonomy(sim) {
    const n = sim.needs, H = this.world.house, hr = this.hour();
    const has = (t) => this.world.objects.find((o) => o.type === t);
    const opts = [];
    const add = (score, key, type, social) => { if (score > 22) opts.push({ score: score + Math.random() * 8, key, type, social }); };
    if (H.servings > 0) add((100 - n.hunger) * 1.4, 'eatServing', 'diningTable');
    else if (H.stock > 0) { add((100 - n.hunger) * 1.2, n.hunger < 35 ? 'snack' : 'cook', 'fridge'); }
    if (H.stock <= 2 && this.world.vendor && this.world.money >= 60000) add(70, 'buyVeg', 'gate');
    else if (H.stock <= 0 && H.servings <= 0 && n.hunger < 50 && hr >= 7 && hr < 21 && this.world.money >= 90000) add((100 - n.hunger) * 1.3, 'shopMart', 'gate');
    if (H.bills > 0 && this.world.money >= H.bills) add(H.power ? 40 : 85, 'payBills', 'mailbox');
    const day = this.day(); const car = sim.prof.career;
    if (day % 7 < 5 && car.workedDay !== day && hr >= 7 && hr < 11 && n.energy > 20) add(95, 'workOjol', 'gate');
    const night = hr >= 21 || hr < 6;
    if (night || n.energy < 22) add((100 - n.energy) * 1.5 + 20, 'sleep', 'bed'); else if (n.energy < 30) add((100 - n.energy) * 1.0, 'napSofa', 'sofa');
    if (n.bladder < 55) add((100 - n.bladder) * 1.7, 'useToilet', 'toilet');
    if (n.hygiene < 55) add((100 - n.hygiene) * 1.2, 'shower', 'shower');
    if (n.fun < 60) {
      const all = { watchTV: 'tv', listen: 'radio', playGame: 'desk', feedFish: 'aquarium', read: 'bookshelf', paint: 'easel', dance: 'radio', exercise: 'treadmill' };
      const av = Object.keys(all).filter((k) => has(all[k]));
      if (av.length) { const f = av[Math.floor(Math.random() * av.length)]; add((100 - n.fun) * 0.95, f, all[f]); }
    }
    if (n.social < 55 && !this.partner(sim).hidden) add((100 - n.social) * 1.05, Math.random() < 0.5 ? 'talk' : 'joke', null, true);
    if (H.dishes >= 3) add(35, 'washDishes', 'counterSink');
    const bowl = this.world.objects.find((o) => o.type === 'petBowl'); if (bowl && (bowl.s.food || 0) < 25) add(48, 'fillBowl', 'petBowl');
    const lit = this.world.objects.find((o) => o.type === 'litterBox'); if (lit && (lit.s.dirt || 0) >= 3) add(58, 'cleanLitter', 'litterBox');
    if (n.fun < 70) { const pets = this.pets().filter((p) => !p.hidden && !p.engagedBy); if (pets.length) { const p = pets[Math.floor(Math.random() * pets.length)]; opts.push({ score: (100 - n.fun) * 0.8 + Math.random() * 10, pair: true, key: ['pat', 'playPet', p.species === 'capy' ? 'orange' : 'hold'][Math.floor(Math.random() * 3)], tgt: p.name }); } }
    if (H.trash >= 4) add(32, 'takeTrash', 'kitchenTrash');
    if (hr >= 7 && hr < 20) for (const t of ['plant', 'plantPot']) { const p = this.world.objects.find((o) => o.type === t && (o.s.water ?? 100) < 30); if (p) { add(28, 'water', t); break; } }
    opts.sort((a, b) => b.score - a.score);
    for (const o of opts) {
      if (o.pair) { this.queueSocial(sim, o.key, o.tgt, 'pair'); return; }
      if (o.social) { this.queueSocial(sim, o.key); return; }
      const cands = this.world.objects.filter((x) => x.type === o.type || (o.key === 'water' && x.type === o.type && (x.s.water ?? 100) < 30));
      for (const ob of cands) {
        const I = INTER[o.key]; const c = this.ctx(sim, ob);
        if (this.objBusy(ob, sim)) continue;
        if (!TYPES[ob.type].acts.includes(o.key)) continue;
        if ((I.check ? I.check(c) : true) === true) { this.queueAct(sim, o.key, ob.id); sim.queue[sim.queue.length - 1] && (sim.queue[sim.queue.length - 1].auto = true); return; }
      }
    }
  }

  bondAdd(a, b, d) {
    if (!a.isPet && !b.isPet) return this.op({ o: 'rel', d });
    if (a.isPet && b.isPet) { this.world.petBond = clamp((this.world.petBond || 0) + d, -100, 100); return; }
    const pet = a.isPet ? a : b, hum = a.isPet ? b : a;
    pet.bond[hum.name] = clamp((pet.bond[hum.name] || 0) + d, -100, 100);
  }
  // ---------- serialisasi ----------
  snapshot() {
    const W = this.world; const sims = {};
    for (const n in this.sims) sims[n] = this.sims[n].pub();
    return { world: W, sims };
  }
  applySnapshot(s) {
    const prevObjVer = this.world.objVer;
    this.world = s.world;
    for (const n in s.sims) this.sims[n].load(s.sims[n]);
    for (const n in s.sims) this.sims[n].queue = s.sims[n].queue;
    if (s.world.objVer !== prevObjVer) this.rebuildNav();
  }
  saveData() { const snap = JSON.parse(JSON.stringify(this.snapshot())); for (const n in snap.sims) snap.sims[n].queue = []; snap.v = 2; return snap; }
  loadSave(s) {
    this.world = s.world; this.world.speed = 1;
    if (!s.v || s.v < 2) {
      let id = this.world.nextId; for (const [type, x, z, rot] of PET_OBJECTS) if (!this.world.objects.some((o) => o.type === type)) this.world.objects.push({ id: id++, type, x, z, rot, s: this.defaultState(type) });
      this.world.nextId = id; this.world.objVer++; this.world.petBond = 30;
      for (const n of HUMANS) if (s.sims[n]) s.sims[n].wallet = WALLET_START;
    }
    for (const n in s.sims) { if (!this.sims[n]) continue; this.sims[n].load(s.sims[n]); this.sims[n].queue = []; this.sims[n].engagedBy = null; this.sims[n].hidden = false; this.sims[n].anim = 'idle'; this.sims[n].prop = null; this.sims[n].y = 0; this.sims[n].icon = null; }
    this.syncMoney(); this.lastMin = Math.floor(this.world.time); this.reserved.clear();
    this.rebuildNav();
  }
}
