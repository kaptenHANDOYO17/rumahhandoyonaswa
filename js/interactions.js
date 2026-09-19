// Definisi interaksi objek & sosial
import { TYPES, CAREERS, WORK_START, WORK_LEN, FRONT_YARD, fmtRp, MOODLETS } from './data.js';

// ctx: { g (Game), sim (SimCtl), obj, world }
const H = (c) => c.world.house;
const on = (id, v) => (c) => c.g.op({ o: 'obj', id: id ?? c.obj.id, patch: { on: v } });
const tgtObj = (c, kind) => ({ obj: c.obj.id, kind });

function cookSteps(c, forTwo) {
  const steps = [];
  const take = (x) => x.g.op({ o: 'house', k: 'stock', d: forTwo ? -2 : -1 });
  steps.push({ target: c.obj.type === 'fridge' ? tgtObj(c) : { type: 'fridge' }, anim: 'grab', dur: 3, onStart: take, label: 'Ambil bahan' });
  steps.push({
    target: c.obj.type === 'stove' ? tgtObj(c) : { type: 'stove' }, anim: 'cook', prop: 'pan', dur: forTwo ? 28 : 20, eff: { fun: 0.15 }, label: 'Memasak',
    onStart: (x) => x.g.op({ o: 'obj', id: x.obj.id, patch: { on: true } }),
    onEnd: (x) => x.g.op({ o: 'obj', id: x.obj.id, patch: { on: false } }),
    onDone: (x) => {
      const lvl = x.sim.skillLvl('memasak');
      x.sim.xp('memasak', forTwo ? 16 : 12);
      if (Math.random() < Math.max(0.03, 0.32 - lvl * 0.05)) {
        x.sim.mood('gosong'); x.g.toast(`${x.sim.name} menggosongkan masakan 🔥`, 'bad');
        x.g.op({ o: 'house', k: 'trash', d: 1 }); x.g.op({ o: 'objAdd', id: x.obj.id, k: 'dirt', d: 2 });
        x.abort = true; return;
      }
      x.g.op({ o: 'objAdd', id: x.obj.id, k: 'dirt', d: 1 });
      if (forTwo) { x.g.op({ o: 'house', k: 'servings', d: 1, by: x.sim.name }); x.g.goal('cookPartner'); x.g.toast(`${x.sim.name} menyiapkan hidangan di meja makan untuk pasangan 🍲`, 'good', true); }
      x.a.good = lvl >= 4;
    },
  });
  steps.push({
    target: { type: 'diningTable', kind: 'seat' }, fallbackHere: 'grab', anim: 'eat', prop: 'plate', walkProp: 'plate', dur: 20, eff: { hunger: 3.6 }, label: 'Makan',
    onDone: (x) => { x.g.op({ o: 'house', k: 'dishes', d: 1 }); x.g.op({ o: 'house', k: 'trash', d: 1 }); x.sim.mood(x.a.good ? 'enak' : 'kenyang'); if (x.obj && x.obj.type === 'diningTable') x.g.goal('eatTable'); },
  });
  return steps;
}

function hasType(c, t) { return c.world.objects.some((o) => o.type === t); }
function needPower(c) { return H(c).power ? true : 'Listrik padam — bayar tagihan dulu'; }

export const INTER = {
  snack: { label: 'Ambil camilan', icon: '🍎', check: (c) => H(c).stock > 0 || 'Stok makanan habis',
    build: (c) => ({ steps: [{ target: tgtObj(c), anim: 'grab', prop: 'plate', dur: 6, eff: { hunger: 3.2 }, onStart: (x) => x.g.op({ o: 'house', k: 'stock', d: -1 }) }] }) },
  cook: { label: 'Masak makanan', icon: '🍳', check: (c) => (H(c).stock >= 1 ? (hasType(c, 'stove') && hasType(c, 'fridge')) || 'Butuh kulkas & kompor' : 'Stok makanan habis'),
    build: (c) => ({ steps: cookSteps(c, false) }) },
  cook2: { label: 'Masak untuk berdua', icon: '🍲', check: (c) => (H(c).stock >= 2 ? (hasType(c, 'stove') && hasType(c, 'fridge')) || 'Butuh kulkas & kompor' : 'Stok kurang (butuh 2 porsi)'),
    build: (c) => ({ steps: cookSteps(c, true) }) },
  cleanStove: { label: 'Bersihkan kompor', icon: '🧽', check: (c) => (c.obj.s.dirt || 0) >= 2 || false,
    build: (c) => ({ steps: [{ target: tgtObj(c), anim: 'wash', prop: 'sponge', dur: 6, onDone: (x) => x.g.op({ o: 'obj', id: x.obj.id, patch: { dirt: 0 } }) }] }) },
  washDishes: { label: (c) => `Cuci piring (${H(c).dishes})`, icon: '🍽️', check: (c) => H(c).dishes > 0 || false,
    build: (c) => ({ steps: [{ target: tgtObj(c), anim: 'wash', prop: 'sponge', dur: 3 + H(c).dishes * 2, onDone: (x) => { x.g.op({ o: 'houseSet', k: 'dishes', v: 0 }); x.g.goal('dishes'); } }] }) },
  washHands: { label: 'Cuci tangan', icon: '🫧', build: (c) => ({ steps: [{ target: tgtObj(c), anim: 'wash', dur: 2, eff: { hygiene: 3 } }] }) },
  takeTrash: { label: 'Buang sampah', icon: '🗑️', check: (c) => H(c).trash > 0 || 'Tempat sampah masih kosong',
    build: (c) => ({ steps: [
      { target: tgtObj(c), anim: 'bend', dur: 2, label: 'Ikat kantong sampah' },
      { target: { type: 'outdoorBin' }, walkProp: 'bag', walkAnim: 'carry', anim: 'grab', dur: 2, label: 'Buang ke tong depan',
        onStart: (x) => x.g.op({ o: 'houseSet', k: 'trash', v: 0 }), onDone: (x) => x.g.goal('trash') },
    ] }) },
  eatServing: { label: (c) => `Makan hidangan (${H(c).servings})`, icon: '🍛', check: (c) => H(c).servings > 0 || false,
    build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'seat' }, anim: 'eat', prop: 'plate', dur: 20, eff: { hunger: 3.6 },
      onStart: (x) => { if (H(x).servingsBy && H(x).servingsBy !== x.sim.name) x.sim.mood('dimasakin'); x.g.op({ o: 'house', k: 'servings', d: -1 }); },
      onDone: (x) => { x.g.op({ o: 'house', k: 'dishes', d: 1 }); x.sim.mood('kenyang'); x.g.goal('eatTable'); } }] }) },
  clearDishes: { label: 'Bereskan & cuci piring', icon: '🧺', check: (c) => (H(c).dishes > 0 ? hasType(c, 'counterSink') || 'Butuh bak cuci' : false),
    build: (c) => ({ steps: [
      { target: { obj: c.obj.id, kind: 'seat' }, noPose: true, anim: 'grab', dur: 2, label: 'Angkat piring' },
      { target: { type: 'counterSink' }, walkProp: 'plate', anim: 'wash', prop: 'sponge', dur: 3 + H(c).dishes * 2, onDone: (x) => { x.g.op({ o: 'houseSet', k: 'dishes', v: 0 }); x.g.goal('dishes'); } },
    ] }) },
  sitTable: { label: 'Duduk', icon: '🪑', build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'seat' }, anim: 'sit', dur: 15, eff: { energy: 0.05 } }] }) },
  sitSofa: { label: 'Duduk santai', icon: '🛋️', build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'seat' }, anim: 'sitWatch', dur: 20, eff: { fun: 0.35, energy: 0.06 } }] }) },
  napSofa: { label: 'Rebahan sebentar', icon: '💤', build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'lie' }, anim: 'nap', dur: 60, eff: { energy: 0.22, fun: 0.1 } }] }) },
  watchTV: { label: 'Nonton TV', icon: '📺', check: (c) => (hasType(c, 'tv') ? needPower(c) : false),
    build: (c) => {
      const tv = c.obj.type === 'tv' ? c.obj : c.g.nearestObj('tv', c.obj.x, c.obj.z);
      return { steps: [{ target: c.obj.type === 'sofa' ? { obj: c.obj.id, kind: 'seat' } : { type: ['sofa', 'armchair'], kind: 'seat', near: tv }, fallbackHere: 'listen', fallbackTarget: { obj: tv.id },
        anim: 'sitWatch', dur: 40, eff: { fun: 1.0 }, onStart: on(tv.id, true), onEnd: on(tv.id, false) }] };
    } },
  watchCooking: { label: 'Nonton acara masak', icon: '👨‍🍳', check: (c) => needPower(c),
    build: (c) => ({ steps: [{ target: { type: ['sofa', 'armchair'], kind: 'seat', near: c.obj }, fallbackHere: 'listen', fallbackTarget: { obj: c.obj.id }, anim: 'sitWatch', dur: 40, eff: { fun: 0.6 },
      onStart: on(c.obj.id, true), onEnd: on(c.obj.id, false), onTick: (x, gm) => x.sim.xp('memasak', gm * 0.25) }] }) },
  read: { label: 'Baca buku', icon: '📖', build: (c) => readSteps(c, 'logika') },
  readCook: { label: 'Baca buku resep', icon: '📕', build: (c) => readSteps(c, 'memasak') },
  readSit: { label: 'Baca buku di sini', icon: '📖', build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'seat' }, anim: 'sitRead', prop: 'book', dur: 30, eff: { fun: 0.5 }, onTick: (x, gm) => x.sim.xp('logika', gm * 0.3), onDone: (x) => x.g.goal('read') }] }) },
  sleep: { label: 'Tidur', icon: '😴', build: (c) => ({ long: true, steps: [{ target: { obj: c.obj.id, kind: 'lie' }, anim: 'lie', until: (x) => x.sim.needs.energy >= 99.5, eff: { energy: 0.27 }, long: true, label: 'Tidur',
    onStart: (x) => x.g.op({ o: 'obj', id: x.obj.id, patch: { made: false } }),
    onDone: (x) => { x.sim.mood('nyenyak'); if (x.a.together) { x.sim.mood('tidurBerdua'); } },
    onTick: (x) => { if (!x.a.together && x.g.partnerSleepingOn(x.sim, x.obj.id)) { x.a.together = true; x.g.op({ o: 'rel', d: 2 }); } } }] }) },
  nap: { label: 'Tidur siang', icon: '💤', build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'lie' }, anim: 'lie', dur: 90, eff: { energy: 0.3 },
    onStart: (x) => x.g.op({ o: 'obj', id: x.obj.id, patch: { made: false } }) }] }) },
  makeBed: { label: 'Rapikan kasur', icon: '🛏️', check: (c) => c.obj.s.made === false || false,
    build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'stand' }, anim: 'bend', dur: 3, onDone: (x) => { x.g.op({ o: 'obj', id: x.obj.id, patch: { made: true } }); x.g.goal('makeBed'); } }] }) },
  changeClothes: { label: 'Ganti baju', icon: '👕', build: (c) => ({ steps: [{ target: tgtObj(c), anim: 'spin', dur: 2, onDone: (x) => x.g.openOutfit(x.sim) }] }) },
  useToilet: { label: 'Pakai toilet', icon: '🚽', build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'seat' }, anim: 'toilet', dur: 6, eff: { bladder: 17 },
    onDone: (x) => { x.g.op({ o: 'objAdd', id: x.obj.id, k: 'dirt', d: 1, max: 10 }); if ((x.obj.s.dirt || 0) >= 6) x.sim.addNeed('hygiene', -8); } }] }) },
  cleanToilet: { label: 'Sikat toilet', icon: '🧽', check: (c) => (c.obj.s.dirt || 0) >= 2 || false,
    build: (c) => ({ steps: [{ target: tgtObj(c), noPose: true, anim: 'bend', prop: 'sponge', dur: 10, eff: { hygiene: -0.3 }, onDone: (x) => { x.g.op({ o: 'obj', id: x.obj.id, patch: { dirt: 0 } }); x.g.goal('toilet'); } }] }) },
  shower: { label: 'Mandi', icon: '🚿', build: (c) => ({ steps: [{ target: tgtObj(c), anim: 'shower', dur: 15, eff: { hygiene: 7, energy: 0.05 }, private: true,
    onStart: on(null, true), onEnd: on(null, false), onDone: (x) => { x.sim.mood('segar'); x.g.op({ o: 'house', k: 'laundry', d: 1, max: 6 }); } }] }) },
  brushTeeth: { label: 'Sikat gigi & cuci muka', icon: '🪥', build: (c) => ({ steps: [{ target: tgtObj(c), anim: 'brush', prop: 'brush', dur: 4, eff: { hygiene: 3 } }] }) },
  laundry: { label: (c) => `Cuci baju (${H(c).laundry})`, icon: '🧺',
    check: (c) => { if (H(c).laundry <= 0) return 'Belum ada baju kotor'; if (!hasType(c, 'washer')) return 'Butuh mesin cuci'; const cl = c.g.nearestObj('clothesline', 0, 0); if (cl && cl.s.clothes) return 'Jemuran masih penuh'; return true; },
    build: (c) => ({ steps: [
      { target: { type: 'basket' }, fallbackHere: 'grab', anim: 'grab', dur: 2, label: 'Ambil baju kotor', onStart: (x) => x.g.op({ o: 'houseSet', k: 'laundry', v: 0 }) },
      { target: { type: 'washer' }, walkProp: 'basket', walkAnim: 'carry', anim: 'grab', dur: 12, label: 'Nyuci', onStart: on(null, true), onEnd: on(null, false) },
      { target: { type: 'clothesline' }, walkProp: 'basket', walkAnim: 'carry', fallbackHere: 'hang', anim: 'hang', dur: 8, label: 'Jemur',
        onDone: (x) => { if (x.obj) x.g.op({ o: 'obj', id: x.obj.id, patch: { clothes: 'wet', dryAt: x.world.time + 240 } }); x.g.goal('laundry'); } },
    ] }) },
  liftLaundry: { label: 'Angkat jemuran', icon: '👚', check: (c) => (c.obj.s.clothes === 'dry' ? true : c.obj.s.clothes === 'wet' ? 'Baju belum kering' : false),
    build: (c) => ({ steps: [{ target: tgtObj(c), anim: 'hang', dur: 5, onDone: (x) => x.g.op({ o: 'obj', id: x.obj.id, patch: { clothes: null } }) }] }) },
  freelance: { label: 'Kerja lepas (1 jam)', icon: '💻', check: (c) => needPower(c),
    build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'seat' }, anim: 'sitType', dur: 60, eff: { fun: -0.25, energy: -0.05 },
      onStart: on(null, true), onEnd: on(null, false), onTick: (x, gm) => x.sim.xp('logika', gm * 0.12),
      onDone: (x) => { const pay = 45000 + x.sim.skillLvl('logika') * 9000; x.g.op({ o: 'money', d: pay, why: 'Kerja lepas' }); x.g.toast(`${x.sim.name} dapat ${fmtRp(pay)} dari kerja lepas`, 'money'); x.g.goal('work'); },
      onCancel: (x) => { const pay = Math.floor((45000 + x.sim.skillLvl('logika') * 9000) * Math.min(1, x.t / 60) / 1000) * 1000; if (pay > 0) x.g.op({ o: 'money', d: pay, why: 'Kerja lepas' }); } }] }) },
  playGame: { label: 'Main game', icon: '🎮', check: (c) => needPower(c), build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'seat' }, anim: 'sitGame', dur: 30, eff: { fun: 1.3, social: 0.15 }, onStart: on(null, true), onEnd: on(null, false) }] }) },
  studyOnline: { label: 'Ikut kelas online', icon: '🎓', check: (c) => needPower(c), build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'seat' }, anim: 'sitType', dur: 45, eff: { fun: 0.1 }, onStart: on(null, true), onEnd: on(null, false), onTick: (x, gm) => { x.sim.xp('logika', gm * 0.35); x.sim.xp('kreatif', gm * 0.15); } }] }) },
  water: { label: 'Siram tanaman', icon: '💧', check: (c) => ((c.obj.s.water ?? 100) < 85 ? true : 'Tanaman masih segar'),
    build: (c) => ({ steps: [{ target: tgtObj(c), anim: 'water', prop: 'can', dur: 3, onDone: (x) => { x.g.op({ o: 'obj', id: x.obj.id, patch: { water: 100 } }); x.g.goal('water'); } }] }) },
  harvest: { label: 'Panen sayur', icon: '🌶️', check: (c) => (c.obj.s.growth || 0) >= 100 || false,
    build: (c) => ({ steps: [{ target: tgtObj(c), anim: 'bend', dur: 5, onDone: (x) => { x.g.op({ o: 'obj', id: x.obj.id, patch: { growth: 0 } }); x.g.op({ o: 'house', k: 'stock', d: 3 }); x.sim.mood('panen'); x.g.toast('Panen! +3 porsi bahan makanan 🌶️🍅', 'good', true); } }] }) },
  workCar: { label: 'Berangkat kerja naik mobil', icon: '🚗', check: (c) => (c.obj.s.away ? 'Mobil sedang dipakai' : workCheck(c)), build: (c) => workBuild(c, true) },
  workOjol: { label: 'Berangkat kerja naik ojol', icon: '🛵', check: (c) => workCheck(c), build: (c) => workBuild(c, false) },
  washCar: { label: 'Cuci mobil', icon: '🧽', check: (c) => (c.obj.s.away ? false : (c.obj.s.dirt || 0) >= 25 || 'Mobil masih bersih'),
    build: (c) => ({ steps: [{ target: tgtObj(c), anim: 'bend', prop: 'sponge', dur: 20, eff: { fun: 0.2, hygiene: -0.3 }, onTick: (x, gm) => x.sim.xp('bugar', gm * 0.1), onDone: (x) => { x.g.op({ o: 'obj', id: x.obj.id, patch: { dirt: 0 } }); x.g.goal('car'); } }] }) },
  mow: { label: 'Potong rumput', icon: '🌿', check: (c) => (H(c).grass >= 25 ? true : 'Rumput masih pendek'),
    build: (c) => ({ steps: [
      { target: tgtObj(c), anim: 'grab', dur: 1 },
      { target: { pos: FRONT_YARD, yaw: Math.PI / 2 }, walkProp: 'mower', walkAnim: 'push', anim: 'push', prop: 'mower', dur: 22, wander: 2.4, eff: { energy: -0.1, hygiene: -0.2 },
        onTick: (x, gm) => x.sim.xp('bugar', gm * 0.12), onDone: (x) => { x.g.op({ o: 'houseSet', k: 'grass', v: 0 }); x.g.goal('mow'); } },
      { target: tgtObj(c), walkProp: 'mower', walkAnim: 'push', anim: 'grab', dur: 1 },
    ] }) },
  payBills: { label: (c) => `Bayar tagihan (${fmtRp(H(c).bills)})`, icon: '🧾', check: (c) => (H(c).bills > 0 ? ((c.sim.wallet ?? c.world.money) >= H(c).bills || 'Uang tidak cukup') : false),
    build: (c) => ({ steps: [{ target: tgtObj(c), anim: 'grab', dur: 2, onDone: (x) => x.g.op({ o: 'payBills' }) }] }) },
  readMail: { label: 'Baca surat', icon: '💌', check: (c) => (H(c).mail && H(c).bills <= 0) || false,
    build: (c) => ({ steps: [{ target: tgtObj(c), anim: 'read', dur: 3, onDone: (x) => { x.g.op({ o: 'houseSet', k: 'mail', v: false }); x.sim.mood('suratLucu'); x.g.toast(pick(MAIL_TEXT), 'info'); } }] }) },
  buyVeg: { label: 'Beli sayur ke Mang Ujang (Rp 60.000)', icon: '🥬', check: (c) => (c.world.vendor ? ((c.sim.wallet ?? c.world.money) >= 60000 || 'Uang tidak cukup') : false),
    build: (c) => ({ steps: [
      { target: { pos: [-6.0, 12.3] }, anim: 'talk', dur: 4, eff: { social: 1.5 }, label: 'Tawar-menawar',
        onDone: (x) => { x.g.op({ o: 'money', d: -60000, why: 'Belanja sayur' }); x.g.op({ o: 'house', k: 'stock', d: 6 }); x.g.toast('Stok dapur +6 porsi 🥬', 'good'); } },
    ] }) },
  jog: { label: 'Jalan pagi keliling komplek', icon: '🏃', check: (c) => (c.sim.needs.energy > 25 ? true : 'Terlalu capek'),
    build: (c) => ({ steps: [
      { target: { pos: [-4, 12.2] }, walkAnim: 'walk', dur: 0 },
      { target: { pos: [-20, 12.2] }, walkAnim: 'jog', dur: 0, walkEff: { energy: -0.25, hygiene: -0.35, fun: 0.4 } },
      { target: { pos: [20, 12.2] }, walkAnim: 'jog', dur: 0, walkEff: { energy: -0.25, hygiene: -0.35, fun: 0.4 } },
      { target: { pos: [-4, 10] }, walkAnim: 'walk', anim: 'idle', dur: 1, onDone: (x) => { x.sim.xp('bugar', 12); x.sim.mood('olahraga'); x.g.goal('exercise'); } },
    ] }) },
  listen: { label: 'Dengerin musik', icon: '🎵', check: (c) => needPower(c), build: (c) => ({ steps: [{ target: tgtObj(c), anim: 'listen', dur: 30, eff: { fun: 0.8 }, onStart: on(null, true), onEnd: on(null, false) }] }) },
  dance: { label: 'Joget', icon: '💃', check: (c) => needPower(c), build: (c) => ({ steps: [{ target: tgtObj(c), anim: 'dance', dur: 20, eff: { fun: 1.4, energy: -0.12 }, onStart: on(null, true), onEnd: on(null, false), onTick: (x, gm) => x.sim.xp('bugar', gm * 0.2) }] }) },
  exercise: { label: 'Olahraga', icon: '🏃', check: (c) => (c.sim.needs.energy > 20 ? needPower(c) : 'Terlalu capek'),
    build: (c) => ({ steps: [{ target: tgtObj(c), anim: 'exercise', dur: 30, eff: { energy: -0.25, hygiene: -0.35, fun: 0.25 }, onTick: (x, gm) => x.sim.xp('bugar', gm * 0.4), onDone: (x) => { x.sim.mood('olahraga'); x.g.goal('exercise'); } }] }) },
  paint: { label: 'Melukis', icon: '🎨', build: (c) => ({ steps: [{ target: tgtObj(c), anim: 'paint', prop: 'brushPaint', dur: 45, eff: { fun: 0.9 }, onTick: (x, gm) => x.sim.xp('kreatif', gm * 0.35),
    onDone: (x) => { const l = x.sim.skillLvl('kreatif'); x.g.op({ o: 'obj', id: x.obj.id, patch: { painted: true } });
      if (l >= 2) { const pay = 60000 * l; x.g.op({ o: 'money', d: pay, why: 'Lukisan terjual' }); x.sim.mood('lukisanLaku'); x.g.toast(`Lukisan ${x.sim.name} laku ${fmtRp(pay)} 🖼️`, 'money', true); } } }] }) },
  feedFish: { label: 'Kasih makan ikan', icon: '🐟', build: (c) => ({ steps: [{ target: tgtObj(c), anim: 'feed', dur: 2, eff: { fun: 3 } }] }) },
};

function readSteps(c, skill) {
  return { steps: [
    { target: tgtObj(c), anim: 'grab', dur: 1, label: 'Ambil buku' },
    { target: { type: ['armchair', 'sofa'], kind: 'seat' }, fallbackHere: 'read', walkProp: 'book', anim: 'sitRead', prop: 'book', dur: 30, eff: { fun: 0.5 },
      onTick: (x, gm) => x.sim.xp(skill, gm * 0.3), onDone: (x) => x.g.goal('read') },
  ] };
}

function workCheck(c) {
  const w = c.world; const day = Math.floor(w.time / 1440); const hr = Math.floor(w.time / 60) % 24;
  if (day % 7 >= 5) return 'Hari libur — kantor tutup';
  const car = c.sim.prof.career;
  if (car.workedDay === day) return 'Sudah kerja hari ini';
  if (hr < WORK_START[0] || hr > WORK_START[1]) return 'Jam berangkat 06.00–11.59';
  return true;
}
function workBuild(c, byCar) {
  const car = byCar ? c.obj : null;
  return { long: true, steps: [
    { target: byCar ? { obj: car.id } : { pos: [-4, 12.2] }, anim: 'idle', dur: WORK_LEN, hide: true, noCancel: true, long: true, label: 'Sedang di kantor',
      onStart: (x) => { if (car) x.g.op({ o: 'obj', id: car.id, patch: { away: true } }); x.g.toast(`${x.sim.name} berangkat kerja ${byCar ? '🚗' : '🛵'}`, 'info', true); },
      onDone: (x) => {
        if (car) x.g.op({ o: 'obj', id: car.id, patch: { away: false, dirt: Math.min(100, (car.s.dirt || 0) + 12) } });
        x.g.finishWork(x.sim);
      } },
  ] };
}

const MAIL_TEXT = [
  'Undangan arisan RT hari Minggu. Katanya ada doorprize kipas angin 😄',
  'Kartu pos dari Mama: "Jaga kesehatan ya, Nak. Jangan lupa makan."',
  'Brosur promo sembako dari minimarket depan komplek.',
  'Surat edaran: kerja bakti bersih-bersih got hari Sabtu pagi.',
  'Undangan nikahan teman kuliah — tempatnya di gedung serbaguna.',
];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// ------------------------------------------------------------
//  Sosial
// ------------------------------------------------------------
export const SOCIAL = {
  talk:      { label: 'Ngobrol', icon: '💬', min: -100, dur: 10, anim: ['talk', 'listen'], gain: { social: 2.3, fun: 0.4 }, rel: 3, goal: 'talk' },
  joke:      { label: 'Bercanda', icon: '😂', min: -30, dur: 6, anim: ['talk', 'laugh'], gain: { social: 2, fun: 1.6 }, rel: 3, mood: 'ketawa' },
  compliment:{ label: 'Puji penampilannya', icon: '🌸', min: -40, dur: 4, anim: ['talk', 'laugh'], gain: { social: 2.2 }, rel: 4 },
  deep:      { label: 'Curhat', icon: '🫂', min: 20, dur: 15, anim: ['talk', 'listen'], gain: { social: 2.6 }, rel: 5 },
  flirt:     { label: 'Gombalin', icon: '😘', min: 10, dur: 5, anim: ['talk', 'laugh'], gain: { social: 2, fun: 1 }, rel: 4, romantic: true },
  hug:       { label: 'Peluk', icon: '🤗', min: 15, dur: 4, anim: ['hug', 'hug'], gain: { social: 4 }, rel: 5, mood: 'dipeluk', goal: 'hug', close: 0.5 },
  kiss:      { label: 'Cium', icon: '💋', min: 40, dur: 3, anim: ['kiss', 'kiss'], gain: { social: 5 }, rel: 6, mood: 'romantis', goal: 'kiss', close: 0.42, romantic: true },
  massage:   { label: 'Pijat pundak', icon: '💆', min: 25, dur: 10, anim: ['massage', 'receiveMassage'], gain: { social: 1.5 }, pgain: { energy: 1, fun: 0.6, social: 1.5 }, rel: 5, pmood: 'dipijat', behind: true, close: 0.45 },
  dance:     { label: 'Dansa bareng', icon: '💃', min: 30, dur: 15, anim: ['dance', 'dance'], gain: { social: 1.5, fun: 2 }, rel: 5, needType: 'radio', close: 0.8 },
  highfive:  { label: 'Tos', icon: '✋', min: -100, dur: 2, anim: ['wave', 'wave'], gain: { social: 2, fun: 1 }, rel: 2, close: 0.6 },
  apology:   { label: 'Minta maaf', icon: '🙏', min: -100, dur: 4, anim: ['sad', 'listen'], gain: { social: 1 }, rel: 4, clears: ['kesal', 'ditolak'] },
  complain:  { label: 'Protes rumah berantakan', icon: '😤', min: -100, dur: 5, anim: ['angry', 'sad'], gain: { social: 0.5 }, rel: -6, pmood: 'kesal', messy: true },
};
export { MOODLETS };
