// ============================================================
//  HEWAN PELIHARAAN — Oyen (kucing oranye) & Kapi (capybara)
//  Model 3D prosedural, benda hewan, interaksi, dan AI.
// ============================================================
import * as THREE from 'three';
import { TYPES, BUY_CATS, MOODLETS, PI, fmtRp } from './data.js';
import { INTER } from './interactions.js';

export const PETS = { Oyen: 'cat', Kapi: 'capy' };
export const PET_START = [
  { name: 'Oyen', species: 'cat', sex: 'm', coat: 'tabby' }, { name: 'Snowy', species: 'cat', sex: 'f', coat: 'white' },
  { name: 'Kapi', species: 'capy', sex: 'm', coat: 'capy' }, { name: 'Kiki', species: 'capy', sex: 'f', coat: 'capyLight' },
];
export const BABY_NAMES = { cat: ['Mochi', 'Kopi', 'Tofu', 'Belang', 'Cimol', 'Onyo', 'Pipi', 'Susu', 'Kuning', 'Bolu'], capy: ['Kapuk', 'Bubu', 'Kacang', 'Momo', 'Cipi', 'Tahu', 'Ubi', 'Gembul'] };
export const ADULT_AGE = 4 * 1440;
export const petAge = (hh, p) => (p.bornAt == null ? 1e9 : hh.world.time - p.bornAt);
export const isBaby = (hh, p) => petAge(hh, p) < ADULT_AGE;
export const petScale = (hh, p) => (p.bornAt == null ? 1 : 0.45 + 0.55 * Math.min(1, petAge(hh, p) / ADULT_AGE));
export const PET_LABEL = { cat: 'Kucing', capy: 'Capybara' };
export const PET_EMOJI = { cat: '🐈', capy: '🦫' };
export const PET_DECAY = {
  cat: { hunger: 0.8, energy: 0.9, hygiene: 0.5, bladder: 0.6, social: 0.9, fun: 1.2 },
  capy: { hunger: 1.1, energy: 0.8, hygiene: 0.9, bladder: 0.6, social: 0.7, fun: 0.7 },
};

// ---------- moodlet tambahan ----------
Object.assign(MOODLETS, {
  dielus: { label: 'Habis dielus', emoji: '🥰', val: 12, dur: 180 },
  elusHewan: { label: 'Ngelus bulu lembut', emoji: '🐾', val: 10, dur: 150 },
  mainHewan: { label: 'Main sama peliharaan', emoji: '🧶', val: 12, dur: 180 },
  diNdusel: { label: 'Didusel manja', emoji: '💗', val: 10, dur: 150 },
  kenyangPet: { label: 'Perut kenyang', emoji: '🍖', val: 10, dur: 180 },
  berendam: { label: 'Berendam adem', emoji: '♨️', val: 18, dur: 240 },
  zen: { label: 'Zen ala capybara', emoji: '🍊', val: 15, dur: 200 },
  sahabat: { label: 'Sahabat beda spesies', emoji: '🤝', val: 15, dur: 240 },
  kapiLucu: { label: 'Gemas lihat Kapi', emoji: '😆', val: 10, dur: 150 },
});

// ---------- katalog benda hewan ----------
const FR = (az) => ({ ax: 0, az, yaw: PI });
Object.assign(TYPES, {
  petBowl: { name: 'Mangkok Makan & Minum', cat: 'hewan', price: 150000, w: 0.6, d: 0.35, spots: [FR(0.6)], acts: ['fillBowl'],
    pspots: [{ ax: 0, az: 0.62, px: 0, pz: 0.36, yaw: PI }], petActs: ['eatBowl'] },
  petBed: { name: 'Kasur Kucing Bulat', cat: 'hewan', price: 250000, w: 0.7, d: 0.6, spots: [], acts: [],
    pspots: [{ ax: 0, az: 0.7, px: 0, pz: 0, py: 0.07, yaw: 0 }], petActs: ['sleepPet'] },
  capyBed: { name: 'Rumah Capybara', cat: 'hewan', price: 900000, w: 1.3, d: 1.0, spots: [], acts: [],
    pspots: [{ ax: 0, az: 1.05, px: 0, pz: 0.05, py: 0.05, yaw: 0 }], petActs: ['sleepPet'] },
  litterBox: { name: 'Kotak Pasir Kucing', cat: 'hewan', price: 200000, w: 0.6, d: 0.5, spots: [FR(0.6)], acts: ['cleanLitter'],
    pspots: [{ ax: 0, az: 0.6, px: 0, pz: 0, py: 0.1, yaw: 0 }], petActs: ['useLitter'] },
  scratcher: { name: 'Tiang Garukan Kucing', cat: 'hewan', price: 350000, w: 0.5, d: 0.5, spots: [FR(0.6)], acts: ['playWand'],
    pspots: [{ ax: 0, az: 0.55, px: 0, pz: 0.32, yaw: PI }], petActs: ['scratch'] },
  pond: { name: 'Kolam Capybara', cat: 'hewan', price: 3500000, w: 2.4, d: 1.6, spots: [FR(1.2)], acts: ['watchPond'],
    pspots: [{ ax: 0, az: 1.25, px: 0.15, pz: 0, py: -0.26, yaw: PI / 2 }], petActs: ['soak'] },
});
TYPES.sofa.pspots = [{ ax: 0.75, az: 0.9, px: 0.72, pz: 0.08, py: 0.45, yaw: PI / 2 }]; TYPES.sofa.petActs = ['napSofaCat'];
TYPES.bed.pspots = [{ ax: 0, az: 1.45, px: 0.35, pz: 0.72, py: 0.6, yaw: PI / 2 }]; TYPES.bed.petActs = ['napBedCat'];
TYPES.aquarium.pspots = [{ ax: 0, az: 0.75, px: 0, pz: 0.5, yaw: PI }]; TYPES.aquarium.petActs = ['watchFish'];
TYPES.veggie.pspots = [{ ax: 0, az: 1.0, px: 0, pz: 0.7, yaw: PI }]; TYPES.veggie.petActs = ['graze'];
TYPES.armchair.pspots = [{ ax: 0, az: 0.85, px: 0, pz: 0.05, py: 0.44, yaw: 0 }]; TYPES.armchair.petActs = ['napSofaCat'];
if (!BUY_CATS.find((c) => c.id === 'hewan')) BUY_CATS.push({ id: 'hewan', label: 'Hewan' });

export const PET_OBJECTS = [['petBowl', 2.3, 5.62, 2], ['petBed', -6.5, 5.5, 2], ['litterBox', 2.5, -0.95, 3], ['scratcher', -0.3, 5.55, 2],
  ['pond', 0, -8.6, 0], ['capyBed', -7.3, -9.3, 0]];
export function petDefaultState(type) {
  if (type === 'petBowl') return { food: 60 };
  if (type === 'litterBox') return { dirt: 1 };
  return null;
}

// ---------- interaksi benda ----------
const P = (c) => ({ obj: c.obj.id, kind: 'pet' });
const isCat = (c) => c.sim.species === 'cat';
const isCapy = (c) => c.sim.species === 'capy';
const pay = (x, d, why) => x.g.op({ o: 'money', d: -d, why });
Object.assign(INTER, {
  fillBowl: { label: (c) => `Isi mangkok makan (${Math.round(c.obj.s.food || 0)}%) · Rp 25.000`, icon: '🥣', check: (c) => ((c.obj.s.food || 0) < 90 ? true : 'Mangkok masih penuh'),
    build: (c) => ({ steps: [{ target: { obj: c.obj.id }, anim: 'bend', dur: 3, onDone: (x) => { x.g.op({ o: 'obj', id: x.obj.id, patch: { food: 100 } }); pay(x, 25000, 'Makanan hewan'); x.g.goal('pets'); } }] }) },
  cleanLitter: { label: 'Bersihkan kotak pasir', icon: '🧹', check: (c) => ((c.obj.s.dirt || 0) >= 2 ? true : 'Masih bersih'),
    build: (c) => ({ steps: [{ target: { obj: c.obj.id }, anim: 'bend', dur: 5, eff: { hygiene: -0.4 }, onDone: (x) => { x.g.op({ o: 'obj', id: x.obj.id, patch: { dirt: 0 } }); x.g.op({ o: 'house', k: 'trash', d: 1 }); } }] }) },
  playWand: { label: 'Main tongkat bulu dengan Oyen', icon: '🪶', check: (c) => (c.g.sims.Oyen ? true : false),
    build: (c) => ({ steps: [{ target: { obj: c.obj.id }, anim: 'wave', dur: 8, eff: { fun: 1.2 }, onStart: (x) => x.g.callPet('Oyen', x.obj, 'play', 8) }] }) },
  watchPond: { label: 'Lihat Kapi berendam', icon: '🦫', build: (c) => ({ steps: [{ target: { obj: c.obj.id }, anim: 'laugh', dur: 6, eff: { fun: 1.2 }, onDone: (x) => x.sim.mood('kapiLucu') }] }) },
  // hewan
  eatBowl: { label: 'Makan dari mangkok', icon: '🍖', check: (c) => ((c.obj.s.food || 0) > 5 ? true : 'Mangkok kosong — minta makan dulu'),
    build: (c) => ({ steps: [{ target: P(c), anim: 'eat', dur: 10, eff: { hunger: 6 }, onDone: (x) => { x.g.op({ o: 'obj', id: x.obj.id, patch: { food: Math.max(0, (x.obj.s.food || 0) - 34) } }); x.sim.mood('kenyangPet'); } }] }) },
  sleepPet: { label: 'Tidur', icon: '💤', check: (c) => (c.obj.type === 'capyBed' ? isCapy(c) || 'Ini rumah Kapi' : isCat(c) || 'Terlalu kecil untuk Kapi'),
    build: (c) => ({ steps: [{ target: P(c), anim: 'lie', until: (x) => x.sim.needs.energy >= 98, eff: { energy: 0.4 }, long: true, label: 'Tidur nyenyak' }] }) },
  napSofaCat: { label: 'Tidur di sini', icon: '😺', check: (c) => isCat(c) || false, build: (c) => ({ steps: [{ target: P(c), anim: 'lie', dur: 80, eff: { energy: 0.35, fun: 0.1 } }] }) },
  napBedCat: { label: 'Tidur di kaki kasur', icon: '😽', check: (c) => isCat(c) || false, build: (c) => ({ steps: [{ target: P(c), anim: 'lie', dur: 100, eff: { energy: 0.35, social: 0.1 } }] }) },
  useLitter: { label: 'Pakai kotak pasir', icon: '🟫', check: (c) => (isCat(c) ? ((c.obj.s.dirt || 0) < 6 ? true : 'Kotak pasir penuh 🤢') : false),
    build: (c) => ({ steps: [{ target: P(c), anim: 'sit', dur: 3, eff: { bladder: 32 }, onDone: (x) => x.g.op({ o: 'objAdd', id: x.obj.id, k: 'dirt', d: 1, max: 10 }) }] }) },
  scratch: { label: 'Garuk-garuk tiang', icon: '🐾', check: (c) => isCat(c) || false, build: (c) => ({ steps: [{ target: P(c), anim: 'scratch', dur: 8, eff: { fun: 2.2 } }] }) },
  watchFish: { label: 'Mengincar ikan', icon: '🐟', check: (c) => isCat(c) || false, build: (c) => ({ steps: [{ target: P(c), anim: 'sit', dur: 20, eff: { fun: 1.3 } }] }) },
  soak: { label: 'Berendam di kolam', icon: '♨️', check: (c) => (isCapy(c) ? true : isCat(c) ? 'Kucing benci air 🙀' : false),
    build: (c) => ({ steps: [{ target: P(c), anim: 'soak', dur: 45, eff: { hygiene: 2.2, fun: 1.1, energy: 0.12 }, onDone: (x) => x.sim.mood('berendam') }] }) },
  graze: { label: 'Nyemil kebun sayur', icon: '🌶️', check: (c) => (isCapy(c) ? ((c.obj.s.growth || 0) > 15 ? true : 'Belum ada yang bisa dimakan') : false),
    build: (c) => ({ steps: [{ target: P(c), anim: 'graze', dur: 12, eff: { hunger: 5, fun: 0.5 }, onDone: (x) => { x.g.op({ o: 'obj', id: x.obj.id, patch: { growth: Math.max(0, (x.obj.s.growth || 0) - 35) } }); x.g.toast('Kapi nyemil kebun cabai & tomat 🌶️😅', 'info'); } }] }) },
});

// ---------- aksi diri hewan ----------
function randPos(g, area) {
  for (let k = 0; k < 30; k++) { const x = area[0] + Math.random() * (area[2] - area[0]), z = area[1] + Math.random() * (area[3] - area[1]); if (g.nav.okXZ(x, z)) return [x, z]; }
  return null;
}
const YARD = [-12, -10.5, 12, -7]; const HOUSE_IN = [-7.5, -5.5, 7.5, 5.5]; const FRONT = [-12, 7.2, 8.5, 10.5];
export const PET_SELF = {
  zoomies: { label: 'Zoomies! (lari-lari heboh)', icon: '💨', only: 'any',
    build: (c) => { const area = c.sim.species === 'capy' ? YARD : HOUSE_IN; const st = [];
      for (let i = 0; i < 3; i++) { const p = randPos(c.g, area); if (p) st.push({ target: { pos: p }, walkAnim: 'jog', dur: 0, walkEff: { fun: 1.8, energy: -0.4 } }); }
      st.push({ anim: 'play', dur: 2 }); return { steps: st }; } },
  groom: { label: 'Jilat-jilat bulu', icon: '👅', only: 'cat', build: () => ({ steps: [{ anim: 'groom', dur: 8, eff: { hygiene: 4, fun: 0.2 } }] }) },
  knock: { label: 'Jatuhkan gelas dari meja 😼', icon: '🥛', only: 'cat',
    build: (c) => { const t = c.g.nearestObj('diningTable', c.sim.x, c.sim.z); return { steps: [{ target: t ? { pos: [t.x + 0.9, t.z] , yaw: -PI / 2 } : null, anim: 'knock', dur: 3, eff: { fun: 6 },
      onDone: (x) => { x.g.addDirt(x.sim.x - 0.4, x.sim.z, true); x.g.toast('PRANG! Oyen sengaja menjatuhkan gelas 😼', 'bad'); x.g.sfx('bad'); } }] }; } },
  meow: { label: 'Mengeong manja', icon: '😺', only: 'cat', build: () => ({ steps: [{ anim: 'beg', dur: 2, eff: { social: 3 }, onStart: (x) => { x.sim.say = { text: 'Meooong~ 🐾', until: Date.now() + 3000 }; } }] }) },
  chill: { label: 'Chill pakai jeruk di kepala', icon: '🍊', only: 'capy',
    build: () => ({ steps: [{ anim: 'chill', dur: 30, eff: { fun: 1.3, energy: 0.1 }, onStart: (x) => { x.sim.hat = x.world.time + 60; }, onDone: (x) => x.sim.mood('zen') }] }) },
  grazeLawn: { label: 'Makan rumput halaman', icon: '🌿', only: 'capy',
    build: (c) => { const p = randPos(c.g, Math.random() < 0.5 ? YARD : FRONT); return { steps: [{ target: p ? { pos: p } : null, anim: 'graze', dur: 15, eff: { hunger: 3.5 } }] }; } },
  squeak: { label: 'Bersuara "wheek wheek"', icon: '🎵', only: 'capy', build: () => ({ steps: [{ anim: 'beg', dur: 2, eff: { social: 2 }, onStart: (x) => { x.sim.say = { text: 'wheek wheek 🦫', until: Date.now() + 3000 }; } }] }) },
  napHere: { label: 'Rebahan di sini', icon: '💤', only: 'any', build: () => ({ steps: [{ anim: 'lie', dur: 50, eff: { energy: 0.3 } }] }) },
  poop: { label: 'Buang air di halaman', icon: '🌱', only: 'capy', build: (c) => { const p = randPos(c.g, YARD); return { steps: [{ target: p ? { pos: p } : null, anim: 'sit', dur: 2, eff: { bladder: 40 } }] }; } },
};

// ---------- interaksi pasangan (manusia/hewan) ----------
// from/to: 'human' | 'cat' | 'capy' | 'pet'
export const PAIR = {
  pat: { from: 'human', to: 'pet', label: 'Elus-elus', icon: '🤚', dur: 6, anim: ['bend', 'rub'], gain: { fun: 0.8, social: 0.6 }, pgain: { social: 3, fun: 1 }, bond: 4, mood: 'elusHewan', pmood: 'dielus', close: 0.55 },
  playPet: { from: 'human', to: 'pet', label: 'Main bareng', icon: '🧶', dur: 12, anim: ['bend', 'play'], gain: { fun: 1.5, social: 0.5 }, pgain: { fun: 3, energy: -0.3, social: 1 }, bond: 5, mood: 'mainHewan', pmood: 'mainHewan', close: 0.75 },
  hold: { from: 'human', to: 'cat', label: 'Gendong Oyen', icon: '🫶', dur: 8, anim: ['hug', 'lie'], gain: { social: 1.5, fun: 1 }, pgain: { social: 2.5 }, bond: 5, mood: 'elusHewan', pmood: 'dielus', close: 0.5, carry: true, picky: true },
  brush: { from: 'human', to: 'cat', label: 'Sisir bulunya', icon: '🪮', dur: 8, anim: ['bend', 'sit'], gain: { fun: 0.5 }, pgain: { hygiene: 4, social: 1 }, bond: 3, close: 0.55 },
  bathe: { from: 'human', to: 'capy', label: 'Mandikan Kapi', icon: '🧽', dur: 10, anim: ['bend', 'chill'], gain: { fun: 0.8, hygiene: -0.3 }, pgain: { hygiene: 5, fun: 1 }, bond: 4, close: 0.8 },
  orange: { from: 'human', to: 'capy', label: 'Taruh jeruk di kepala Kapi', icon: '🍊', dur: 4, anim: ['grab', 'chill'], gain: { fun: 3 }, pgain: { fun: 2 }, bond: 3, mood: 'kapiLucu', pmood: 'zen', close: 0.8, hat: true },
  photo: { from: 'human', to: 'pet', label: 'Foto buat story', icon: '📸', dur: 5, anim: ['phone', 'sit'], gain: { fun: 2, social: 1.2 }, pgain: { social: 0.5 }, bond: 1, close: 1.3, prop: 'phone' },
  nuzzle: { from: 'pet', to: 'human', label: 'Ndusel manja', icon: '💗', dur: 6, anim: ['rub', 'bend'], gain: { social: 4, fun: 0.6 }, pgain: { social: 2, fun: 1 }, bond: 4, pmood: 'diNdusel', close: 0.5 },
  beg: { from: 'pet', to: 'human', label: 'Minta makan', icon: '🍖', dur: 3, anim: ['beg', 'listen'], gain: { social: 1.5 }, pgain: {}, bond: 1, close: 0.6, beg: true },
  follow: { from: 'pet', to: 'human', label: 'Duduk di dekatnya', icon: '🐾', dur: 15, anim: ['sit', 'idle'], gain: { social: 2.2 }, pgain: { social: 0.6 }, bond: 2, close: 0.7 },
  ride: { from: 'cat', to: 'capy', label: 'Naik ke punggung Kapi', icon: '🐈‍⬛', dur: 30, anim: ['lie', 'chill'], gain: { social: 2, fun: 1, energy: 0.2 }, pgain: { social: 2, fun: 0.6 }, bond: 5, mood: 'sahabat', pmood: 'sahabat', close: 0.3, ride: true },
  chase: { from: 'pet', to: 'pet', label: 'Kejar-kejaran', icon: '💨', dur: 8, anim: ['play', 'play'], gain: { fun: 3, energy: -0.3 }, pgain: { fun: 3, energy: -0.3 }, bond: 3, close: 0.7 },
  cuddle: { from: 'pet', to: 'pet', label: 'Tidur berdempetan', icon: '💤', dur: 40, anim: ['lie', 'lie'], gain: { energy: 0.35, social: 1.2 }, pgain: { energy: 0.35, social: 1.2 }, bond: 4, mood: 'sahabat', pmood: 'sahabat', close: 0.55 },
  sniff: { from: 'any', to: 'any', label: 'Endus-endus', icon: '👃', dur: 2, anim: ['idle', 'idle'], gain: { social: 2 }, pgain: { social: 1 }, bond: 1, close: 0.55, petOnly: true },
};
Object.assign(PAIR, {
  mate: { from: 'pet', to: 'pet', label: 'Bermesraan 💕', icon: '💞', dur: 20, anim: ['rub', 'rub'], gain: { social: 3, fun: 1.5 }, pgain: { social: 3, fun: 1.5 }, bond: 6, mood: 'sahabat', pmood: 'sahabat', close: 0.5, mate: true,
    need: (hh, a, b) => a.species === b.species && a.sex && b.sex && a.sex !== b.sex && !isBaby(hh, a) && !isBaby(hh, b) && !(a.sex === 'f' ? a : b).pregUntil && !hh.pets().some((k) => k.mom === (a.sex === 'f' ? a : b).name && isBaby(hh, k)) && hh.pets().length < 12 },
  nurse: { from: 'pet', to: 'pet', label: 'Menyusu ke ibu', icon: '🍼', dur: 15, anim: ['eat', 'lie'], gain: { hunger: 4.5, social: 1.5 }, pgain: { social: 1 }, bond: 3, close: 0.45,
    need: (hh, a, b) => isBaby(hh, a) && a.mom === b.name },
  hugPet: { from: 'human', to: 'pet', label: 'Peluk erat-erat', icon: '🫂', dur: 6, anim: ['hug', 'rub'], gain: { social: 2, fun: 1.5 }, pgain: { social: 2.5 }, bond: 5, mood: 'peluk', pmood: 'dielus', close: 0.5 },
});
export function pairMatch(S, a, b) {
  const PET = (sp) => sp === 'cat' || sp === 'capy';
  const m = (want, sp) => want === 'any' ? (PET(sp) || sp === 'human') : want === sp || (want === 'pet' && PET(sp));
  if (S.petOnly && a === 'human' && b === 'human') return false;
  if (S.petOnly && a === 'human') return false;
  return m(S.from, a) && m(S.to, b);
}

// ============================================================
//  MODEL 3D HEWAN
// ============================================================
function tex(draw, w = 256, h = 256) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
let TEXC = null;
function petTextures(coat) {
  if (coat === 'white' || coat === 'capyLight' || coat === 'mix') return coatTex(coat);
  if (TEXC) return TEXC;
  const noise = (g, w, h, n, cols, len) => { for (let i = 0; i < n; i++) { g.strokeStyle = cols[i % cols.length]; g.globalAlpha = 0.25 + Math.random() * 0.35; g.lineWidth = 1; const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 3, y + len * (0.6 + Math.random())); g.stroke(); } g.globalAlpha = 1; };
  TEXC = {
    tabby: tex((g, w, h) => {
      g.fillStyle = '#e39a4c'; g.fillRect(0, 0, w, h);
      noise(g, w, h, 2600, ['#f2b86e', '#c9782e', '#f6caa0'], 5);
      g.fillStyle = '#a4561d';
      for (let i = 0; i < 9; i++) { const y = 12 + i * 28 + Math.random() * 6; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 5 + (Math.abs(x - w / 2) / w) * 10); g.lineTo(w, y + 9); for (let x = w; x >= 0; x -= 16) g.lineTo(x, y + 9 + Math.sin(x * 0.07 + i) * 3); g.fill(); }
      noise(g, w, h, 900, ['#8a4414'], 4);
    }),
    catHead: tex((g, w, h) => {
      g.fillStyle = '#e39a4c'; g.fillRect(0, 0, w, h); noise(g, w, h, 1500, ['#f2b86e', '#c9782e'], 4);
      g.fillStyle = '#a4561d'; for (let i = 0; i < 3; i++) g.fillRect(w * 0.44 + i * 0 - 4 + i * 8 - 8, 0, 5, h * 0.28);
      g.fillStyle = '#fbe7cf'; g.beginPath(); g.ellipse(w * 0.5, h * 0.72, w * 0.22, h * 0.2, 0, 0, PI * 2); g.fill();
    }),
    capy: tex((g, w, h) => {
      g.fillStyle = '#8c5f3c'; g.fillRect(0, 0, w, h);
      noise(g, w, h, 6000, ['#6e4527', '#a57650', '#5a381f', '#b8875c'], 7);
    }),
    capyFace: tex((g, w, h) => { g.fillStyle = '#7a5134'; g.fillRect(0, 0, w, h); noise(g, w, h, 3000, ['#5e3c24', '#9a6c46'], 4); }),
  };
  return TEXC;
}
const COATC = {};
function coatTex(coat) {
  if (COATC[coat]) return COATC[coat];
  const noise = (g, w, h, n, cols, len) => { for (let i = 0; i < n; i++) { g.strokeStyle = cols[i % cols.length]; g.globalAlpha = 0.3; g.beginPath(); const x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 3, y + len); g.stroke(); } g.globalAlpha = 1; };
  let T;
  if (coat === 'white') {
    const body = tex((g, w, h) => { g.fillStyle = '#f4f2ee'; g.fillRect(0, 0, w, h); noise(g, w, h, 3000, ['#ffffff', '#dcd8d0', '#e9e5de'], 5); });
    T = { tabby: body, catHead: tex((g, w, h) => { g.fillStyle = '#f6f4f0'; g.fillRect(0, 0, w, h); noise(g, w, h, 1500, ['#fff', '#dedad2'], 4); }) };
  } else if (coat === 'mix') {
    const body = tex((g, w, h) => { g.fillStyle = '#f2ede4'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#e39a4c' : '#3a3232'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 20 + Math.random() * 40, 16 + Math.random() * 30, Math.random() * 3, 0, Math.PI * 2); g.fill(); } noise(g, w, h, 2000, ['#fff', '#c9782e'], 5); });
    T = { tabby: body, catHead: body };
  } else {
    const c = tex((g, w, h) => { g.fillStyle = '#a8744a'; g.fillRect(0, 0, w, h); noise(g, w, h, 6000, ['#8a5a36', '#c49468', '#76492a', '#d0a070'], 7); });
    T = { capy: c, capyFace: tex((g, w, h) => { g.fillStyle = '#946442'; g.fillRect(0, 0, w, h); noise(g, w, h, 3000, ['#76492a', '#b08058'], 4); }) };
  }
  return (COATC[coat] = T);
}
const mat = (o) => new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...o });
function mk(geo, m, x = 0, y = 0, z = 0, parent) { const k = new THREE.Mesh(geo, m); k.position.set(x, y, z); k.castShadow = true; k.receiveShadow = true; if (parent) parent.add(k); return k; }

export class PetModel {
  constructor(name, species, coat) {
    this.name = name; this.species = species; this.t = 0; this.cur = null; this.coat = coat || (species === 'cat' ? 'tabby' : 'capy');
    this.root = new THREE.Group(); this.root.userData.simName = name;
    this.body = new THREE.Group(); this.root.add(this.body);
    this.labelH = species === 'cat' ? 0.72 : 1.08;
    if (species === 'cat') this.buildCat(); else this.buildCapy();
    this.root.traverse((o) => { o.userData.simName = name; });
    const ring = new THREE.Mesh(new THREE.RingGeometry(species === 'cat' ? 0.3 : 0.55, species === 'cat' ? 0.36 : 0.63, 40), new THREE.MeshBasicMaterial({ color: 0xffb547, transparent: true, opacity: 0.9, depthWrite: false }));
    ring.rotation.x = -PI / 2; ring.position.y = 0.03; ring.visible = false; this.ring = ring; this.root.add(ring);
    const blob = new THREE.Mesh(new THREE.CircleGeometry(species === 'cat' ? 0.22 : 0.45, 24), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.2, depthWrite: false }));
    blob.rotation.x = -PI / 2; blob.position.y = 0.022; blob.scale.z = 1.7; this.blob = blob; this.root.add(blob);
  }
  leg(parent, x, y, z, up, lo, r1, r2, m, pawM) {
    const hip = new THREE.Group(); hip.position.set(x, y, z); parent.add(hip);
    mk(new THREE.CapsuleGeometry(r1, up, 4, 8), m, 0, -up / 2, 0, hip);
    const knee = new THREE.Group(); knee.position.y = -up; hip.add(knee);
    mk(new THREE.CapsuleGeometry(r2, lo, 4, 8), m, 0, -lo / 2, 0, knee);
    const paw = mk(new THREE.SphereGeometry(r2 * 1.35, 10, 8), pawM, 0, -lo - r2 * 0.3, r2 * 0.5, knee); paw.scale.set(1, 0.7, 1.35);
    return { hip, knee };
  }
  buildCat() {
    const T = petTextures(this.coat);
    const fur = mat({ map: T.tabby }), white = mat({ color: '#fbeee0' }), pink = mat({ color: '#e89aa0', roughness: 0.6 });
    const B = this.body; this.hipY = 0.22;
    const torso = new THREE.Group(); torso.position.y = 0.23; B.add(torso); this.torso = torso;
    const trunk = mk(new THREE.SphereGeometry(1, 28, 20), fur, 0, 0, -0.01, torso); trunk.scale.set(0.1, 0.2, 0.108); trunk.rotation.x = PI / 2;
    const chest = mk(new THREE.SphereGeometry(0.09, 16, 12), white, 0, -0.03, 0.14, torso); chest.scale.set(0.95, 1, 0.8);
    this.legs = [
      this.leg(torso, -0.062, -0.02, 0.13, 0.1, 0.1, 0.03, 0.022, fur, white), this.leg(torso, 0.062, -0.02, 0.13, 0.1, 0.1, 0.03, 0.022, fur, white),
      this.leg(torso, -0.066, -0.02, -0.14, 0.1, 0.1, 0.036, 0.024, fur, white), this.leg(torso, 0.066, -0.02, -0.14, 0.1, 0.1, 0.036, 0.024, fur, white),
    ];
    // kepala
    const head = new THREE.Group(); head.position.set(0, 0.1, 0.22); torso.add(head); this.head = head;
    const skull = mk(new THREE.SphereGeometry(0.083, 24, 18), mat({ map: T.catHead }), 0, 0, 0, head); skull.scale.set(1.05, 0.92, 0.95); skull.rotation.y = -PI / 2;
    const cheekL = mk(new THREE.SphereGeometry(0.045, 12, 10), fur, -0.04, -0.03, 0.03, head); const cheekR = cheekL.clone(); cheekR.position.x = 0.04; head.add(cheekR);
    const muz = mk(new THREE.SphereGeometry(0.036, 14, 10), white, 0, -0.03, 0.068, head); muz.scale.set(1.25, 0.8, 0.9);
    mk(new THREE.SphereGeometry(0.011, 8, 6), pink, 0, -0.012, 0.1, head).scale.set(1.3, 0.8, 1);
    this.jaw = mk(new THREE.SphereGeometry(0.022, 10, 8), mat({ color: '#b5605a' }), 0, -0.056, 0.07, head); this.jaw.scale.set(1.1, 0.4, 0.8);
    for (const s of [-1, 1]) {
      const ear = mk(new THREE.ConeGeometry(0.036, 0.075, 4), fur, s * 0.048, 0.072, -0.005, head); ear.rotation.set(-0.15, PI / 4, s * -0.28); ear.scale.z = 0.5;
      const inner = mk(new THREE.ConeGeometry(0.024, 0.05, 4), pink, s * 0.047, 0.068, 0.006, head); inner.rotation.copy(ear.rotation); inner.scale.z = 0.3;
      const eye = mk(new THREE.SphereGeometry(0.018, 14, 10), mat({ color: this.coat === 'white' ? '#6fb3e8' : '#b8d24a', roughness: 0.15, emissive: '#3a4a10', emissiveIntensity: 0.25 }), s * 0.034, 0.012, 0.064, head);
      const pup = mk(new THREE.SphereGeometry(0.0105, 10, 8), mat({ color: '#0a0a0a', roughness: 0.1 }), s * 0.034, 0.012, 0.079, head); pup.scale.set(0.35, 1.1, 0.5);
      mk(new THREE.SphereGeometry(0.004, 6, 4), mat({ color: '#fff', emissive: '#fff', emissiveIntensity: 0.6 }), s * 0.03, 0.02, 0.082, head);
      (this.eyes = this.eyes || []).push(eye, pup);
      for (let k = 0; k < 3; k++) { const w = mk(new THREE.CylinderGeometry(0.0012, 0.0008, 0.11, 3), mat({ color: '#fffaf0' }), s * 0.075, -0.028 + k * 0.009, 0.075, head); w.rotation.z = s * (PI / 2 - 0.12 + k * 0.12); w.rotation.y = s * 0.3; w.castShadow = false; }
    }
    // ekor: rantai segmen
    this.tail = []; let par = torso; let z = -0.2;
    for (let i = 0; i < 8; i++) {
      const g = new THREE.Group(); g.position.set(0, i === 0 ? 0.04 : 0, i === 0 ? z : -0.042); par.add(g);
      mk(new THREE.CapsuleGeometry(0.019 - i * 0.0012, 0.03, 4, 8), i === 7 ? mat({ color: '#a4561d' }) : fur, 0, 0, -0.021, g).rotation.x = PI / 2;
      this.tail.push(g); par = g;
    }
    this.propAnchor = head;
  }
  buildCapy() {
    const T = petTextures(this.coat);
    const fur = mat({ map: T.capy, roughness: 1 }), face = mat({ map: T.capyFace, roughness: 1 }), dark = mat({ color: '#2a1d14', roughness: 0.5 }), nail = mat({ color: '#2e2620' });
    const B = this.body; this.hipY = 0.3;
    const torso = new THREE.Group(); torso.position.y = 0.42; B.add(torso); this.torso = torso;
    const trunk = mk(new THREE.SphereGeometry(1, 32, 24), fur, 0, 0, 0, torso); trunk.scale.set(0.24, 0.42, 0.225); trunk.rotation.x = PI / 2;
    const rump = mk(new THREE.SphereGeometry(0.21, 20, 16), fur, 0, 0.02, -0.25, torso); rump.scale.set(1.08, 1.02, 0.95);
    const shoulder = mk(new THREE.SphereGeometry(0.18, 20, 16), fur, 0, 0.03, 0.24, torso); shoulder.scale.set(1.0, 1.0, 0.95);
    this.legs = [
      this.leg(torso, -0.13, -0.14, 0.24, 0.1, 0.1, 0.055, 0.042, fur, nail), this.leg(torso, 0.13, -0.14, 0.24, 0.1, 0.1, 0.055, 0.042, fur, nail),
      this.leg(torso, -0.15, -0.14, -0.26, 0.1, 0.1, 0.07, 0.045, fur, nail), this.leg(torso, 0.15, -0.14, -0.26, 0.1, 0.1, 0.07, 0.045, fur, nail),
    ];
    const head = new THREE.Group(); head.position.set(0, 0.13, 0.36); torso.add(head); this.head = head;
    const neck = mk(new THREE.SphereGeometry(0.15, 18, 14), fur, 0, -0.05, -0.04, head); neck.scale.set(1, 1, 1.1);
    const skull = mk(new THREE.SphereGeometry(1, 24, 18), face, 0, 0.02, 0.1, head); skull.scale.set(0.125, 0.13, 0.17);
    const snout = mk(new THREE.BoxGeometry(0.19, 0.16, 0.16, 6, 6, 6), face, 0, -0.005, 0.24, head);
    { const pos = snout.geometry.attributes.position; const v = new THREE.Vector3(), q = new THREE.Vector3(); for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); q.set(v.x / 0.095, v.y / 0.08, v.z / 0.08); const L = Math.max(Math.abs(q.x), Math.abs(q.y), Math.abs(q.z)); const n = q.clone().normalize().multiplyScalar(L); const sq = q.lerp(n, 0.45); pos.setXYZ(i, sq.x * 0.095, sq.y * 0.08, sq.z * 0.08); } snout.geometry.computeVertexNormals(); }
    const nose = mk(new THREE.BoxGeometry(0.13, 0.05, 0.02), mat({ color: '#3a2618', roughness: 0.4 }), 0, 0.03, 0.325, head);
    for (const s of [-1, 1]) {
      mk(new THREE.SphereGeometry(0.012, 8, 6), dark, s * 0.03, 0.04, 0.33, head).scale.set(1.4, 0.6, 0.6);
      const ear = mk(new THREE.SphereGeometry(0.036, 12, 10), face, s * 0.085, 0.125, 0.02, head); ear.scale.set(0.9, 1.0, 0.45); ear.rotation.y = s * 0.4;
      mk(new THREE.SphereGeometry(0.02, 10, 8), dark, s * 0.087, 0.12, 0.028, head).scale.set(0.7, 0.8, 0.3);
      const eye = mk(new THREE.SphereGeometry(0.02, 12, 10), mat({ color: '#140c08', roughness: 0.15 }), s * 0.098, 0.072, 0.15, head);
      mk(new THREE.SphereGeometry(0.005, 6, 4), mat({ color: '#fff', emissive: '#fff', emissiveIntensity: 0.5 }), s * 0.105, 0.08, 0.162, head);
      (this.eyes = this.eyes || []).push(eye);
      this.lids = this.lids || []; const lid = mk(new THREE.SphereGeometry(0.022, 12, 8, 0, PI * 2, 0, PI / 2), face, s * 0.098, 0.074, 0.15, head); lid.rotation.x = -0.3; lid.scale.y = 0.2; this.lids.push(lid);
    }
    this.jaw = mk(new THREE.BoxGeometry(0.11, 0.03, 0.08), face, 0, -0.085, 0.23, head);
    const incisor = mk(new THREE.BoxGeometry(0.03, 0.02, 0.01), mat({ color: '#f1e1b8', roughness: 0.4 }), 0, -0.078, 0.322, head);
    this.tail = [];
    this.propAnchor = head;
  }
  setOutfit() {}
  setProp(name) {
    if (name === this.propName) return;
    if (this.prop) { this.prop.parent.remove(this.prop); this.prop = null; }
    this.propName = name;
    if (name === 'orange') {
      const g = new THREE.Group();
      const o = mk(new THREE.SphereGeometry(0.075, 18, 14), mat({ color: '#f39a1e', roughness: 0.55 }), 0, 0, 0, g); o.scale.y = 0.9;
      mk(new THREE.CylinderGeometry(0.006, 0.006, 0.02, 5), mat({ color: '#4a3a1a' }), 0, 0.07, 0, g);
      const leaf = mk(new THREE.SphereGeometry(0.03, 8, 6), mat({ color: '#3f8a3c' }), 0.02, 0.075, 0, g); leaf.scale.set(1, 0.2, 0.5);
      g.position.set(0, 0.2, 0.1); this.head.add(g); this.prop = g;
    }
  }
  update(dt, anim) {
    this.t += dt; const t = this.t, s = Math.sin, c = Math.cos, cat = this.species === 'cat';
    const T = { y: 0, pitch: 0, roll: 0, hx: 0, hy: 0, hz: 0, legs: [[0, 0], [0, 0], [0, 0], [0, 0]], tailA: 0.5, tailW: 0.25, jaw: 0, lid: 0.2 };
    const lieLegs = () => { T.legs = [[-1.35, 0.3], [-1.35, 0.3], [1.35, -1.2], [1.35, -1.2]]; };
    const H = this.hipY;
    switch (anim) {
      case 'walk': case 'jog': case 'play': case 'push': case 'carry': {
        const f = anim === 'walk' ? (cat ? 9 : 7) : (cat ? 15 : 12); const p = t * f;
        const a = anim === 'walk' ? 0.45 : 0.75;
        T.legs = [[s(p) * a, Math.max(0, -s(p + 0.9)) * 0.7], [s(p + PI) * a, Math.max(0, -s(p + PI + 0.9)) * 0.7], [s(p + PI) * a, Math.max(0, s(p + PI + 0.9)) * -0.6], [s(p) * a, Math.max(0, s(p + 0.9)) * -0.6]];
        T.y = Math.abs(c(p)) * (anim === 'walk' ? 0.01 : 0.03); T.pitch = anim === 'walk' ? 0 : s(p) * 0.06; T.hx = -0.05; T.tailA = anim === 'walk' ? 0.9 : 0.3;
        if (anim === 'play' && !this.moving) { const hop = Math.max(0, s(t * 5)); T.y = hop * (cat ? 0.12 : 0.1); T.pitch = -hop * 0.4; T.tailA = 1.2; T.tailW = 0.6; }
        break; }
      case 'lie': case 'passout': case 'nap': case 'ride':
        lieLegs(); T.y = -(H - 0.05) + (cat ? 0.02 : 0.06); T.hx = cat ? 0.35 : 0.1; T.hy = cat ? 0.5 : 0; T.roll = cat ? 0.25 : 0.05; T.tailA = -0.1; T.tailW = 0.05; T.lid = 1;
        T.y += s(t * 1.6) * 0.004; break;
      case 'chill': lieLegs(); T.y = -(H - 0.11); T.hx = -0.05; T.hy = s(t * 0.3) * 0.1; T.lid = 0.75; break;
      case 'soak': lieLegs(); T.y = -0.02 + s(t * 1.2) * 0.012; T.hx = -0.15; T.hy = s(t * 0.25) * 0.2; T.lid = 0.7; break;
      case 'sit': case 'beg': case 'knock': case 'groom': {
        T.pitch = cat ? -0.55 : -0.35; T.y = cat ? -0.03 : -0.08;
        T.legs = [[0.55, 0], [0.55, 0], [1.3, -1.7], [1.3, -1.7]];
        T.hx = cat ? 0.5 : 0.3; T.tailA = -0.3; T.tailW = 0.08;
        if (anim === 'beg') { T.hx = 0.1; T.jaw = Math.max(0, s(t * 5)) * 1; }
        if (anim === 'knock') { const k = Math.max(0, s(t * 4)); T.legs[1] = [0.55 - k * 1.6, -k * 0.5]; T.hy = -0.3; }
        if (anim === 'groom') { T.hy = 1.1; T.hx = 0.9 + s(t * 7) * 0.12; T.legs[0] = [-0.4, -1.2]; }
        break; }
      case 'eat': case 'graze': T.hx = cat ? 0.9 : 0.75; T.hz = 0; T.legs = [[-0.2, 0.3], [-0.2, 0.3], [0, 0], [0, 0]]; T.pitch = 0.12; T.jaw = Math.max(0, s(t * (cat ? 9 : 7))) * 0.8; T.tailA = 0.4; T.tailW = 0.3; break;
      case 'rub': T.roll = s(t * 3) * 0.18; T.hy = s(t * 3) * 0.5; T.hx = -0.1; T.tailA = 1.4; T.tailW = 0.15; T.lid = 0.6; break;
      case 'scratch': { T.pitch = -1.05; T.y = 0.06; const k = s(t * 10); T.legs = [[-2.3 + k * 0.3, -0.6], [-2.3 - k * 0.3, -0.6], [1.2, -1.2], [1.2, -1.2]]; T.hx = 0.6; T.tailA = 1.0; break; }
      default: // idle
        T.hy = s(t * 0.35) * 0.4; T.hx = s(t * 0.21) * 0.1; T.y = s(t * 2.2) * 0.003; T.tailA = cat ? 0.6 : 0; T.tailW = 0.2;
    }
    if (!this.cur) this.cur = JSON.parse(JSON.stringify(T));
    const C = this.cur, k = 1 - Math.exp(-dt * (anim === 'walk' || anim === 'jog' ? 16 : 8));
    for (const key of Object.keys(T)) {
      if (key === 'legs') { for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) C.legs[i][j] += (T.legs[i][j] - C.legs[i][j]) * k; }
      else C[key] += (T[key] - C[key]) * k;
    }
    this.torso.position.y = (cat ? 0.23 : 0.42) + C.y;
    this.torso.rotation.set(C.pitch, 0, C.roll);
    this.head.rotation.set(C.hx - C.pitch * 0.8, C.hy, C.hz);
    this.legs.forEach((l, i) => { l.hip.rotation.x = C.legs[i][0] - C.pitch * (i < 2 ? 1 : 0.6); l.knee.rotation.x = C.legs[i][1]; });
    this.tail.forEach((g, i) => { g.rotation.x = i === 0 ? -C.tailA : -C.tailA * 0.18 + 0.08; g.rotation.y = s(t * 2.2 - i * 0.6) * C.tailW; });
    if (this.jaw) this.jaw.position.y = (cat ? -0.056 : -0.085) - C.jaw * 0.02;
    const blink = (t % 4.2) < 0.12 ? 1 : 0;
    if (this.lids) this.lids.forEach((l) => { l.scale.y = 0.2 + Math.max(C.lid, blink) * 0.9; });
    else if (this.eyes) this.eyes.forEach((e) => { e.scale.y = 1 - Math.max(C.lid > 0.9 ? 0.9 : 0, blink * 0.9); });
    this.blob.visible = true;
  }
}

// ============================================================
//  BENDA HEWAN (mesh)
// ============================================================
export function buildPetObject(obj) {
  const g = new THREE.Group(); const Pp = {};
  const steel = mat({ color: '#c9cfd4', roughness: 0.25, metalness: 0.85 });
  switch (obj.type) {
    case 'petBowl': {
      mk(new THREE.BoxGeometry(0.58, 0.012, 0.34), mat({ color: '#3e9a6e', roughness: 0.7 }), 0, 0.006, 0, g);
      for (const x of [-0.14, 0.14]) { const b = mk(new THREE.CylinderGeometry(0.1, 0.075, 0.06, 24, 1, true), steel, x, 0.042, 0, g); b.material.side = THREE.DoubleSide; mk(new THREE.CircleGeometry(0.075, 20), steel, x, 0.013, 0, g).rotation.x = -PI / 2; }
      Pp.food = new THREE.Group(); Pp.food.position.set(-0.14, 0, 0); g.add(Pp.food);
      for (let i = 0; i < 24; i++) mk(new THREE.SphereGeometry(0.013, 6, 4), mat({ color: i % 3 ? '#8a5a2e' : '#b07a3e' }), (Math.random() - 0.5) * 0.12, 0.03 + Math.random() * 0.02, (Math.random() - 0.5) * 0.12, Pp.food);
      const w = mk(new THREE.CircleGeometry(0.085, 20), mat({ color: '#7fc4e0', roughness: 0.05, transparent: true, opacity: 0.8 }), 0.14, 0.055, 0, g); w.rotation.x = -PI / 2; break; }
    case 'petBed': {
      const t = mk(new THREE.TorusGeometry(0.24, 0.085, 12, 28), mat({ color: '#c7a0d8' }), 0, 0.085, 0, g); t.rotation.x = PI / 2; t.scale.set(1.15, 1, 1);
      mk(new THREE.CylinderGeometry(0.26, 0.28, 0.06, 28), mat({ color: '#efe4f2' }), 0, 0.03, 0, g).scale.set(1.1, 1, 0.9); break; }
    case 'capyBed': {
      const wood = mat({ color: '#9a6a3e' });
      mk(new THREE.BoxGeometry(1.3, 0.06, 1.0), wood, 0, 0.03, 0, g);
      for (const x of [-0.62, 0.62]) mk(new THREE.BoxGeometry(0.06, 0.7, 1.0), wood, x, 0.38, 0, g);
      mk(new THREE.BoxGeometry(1.3, 0.7, 0.06), wood, 0, 0.38, -0.48, g);
      for (const s of [-1, 1]) { const r = mk(new THREE.BoxGeometry(0.78, 0.05, 1.12), mat({ color: '#7a3f2c' }), s * 0.33, 0.87, 0, g); r.rotation.z = s * -0.55; }
      for (let i = 0; i < 40; i++) { const h = mk(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 3), mat({ color: '#d9bf6a' }), (Math.random() - 0.5) * 1.1, 0.07, (Math.random() - 0.5) * 0.85, g); h.rotation.set(PI / 2 + (Math.random() - 0.5) * 0.4, 0, Math.random() * PI); h.castShadow = false; }
      break; }
    case 'litterBox': {
      const b = mat({ color: '#5aa6b8', roughness: 0.4 });
      mk(new THREE.BoxGeometry(0.6, 0.03, 0.5), b, 0, 0.015, 0, g);
      for (const [x, z, w, d] of [[0, 0.235, 0.6, 0.03], [0, -0.235, 0.6, 0.03], [0.285, 0, 0.03, 0.5], [-0.285, 0, 0.03, 0.5]]) mk(new THREE.BoxGeometry(w, 0.14, d), b, x, 0.07, z, g);
      mk(new THREE.BoxGeometry(0.54, 0.02, 0.44), mat({ color: '#d9ccaa' }), 0, 0.1, 0, g);
      Pp.clumps = new THREE.Group(); g.add(Pp.clumps);
      for (let i = 0; i < 6; i++) mk(new THREE.SphereGeometry(0.025, 6, 4), mat({ color: '#9a8a64' }), (Math.random() - 0.5) * 0.4, 0.11, (Math.random() - 0.5) * 0.3, Pp.clumps);
      break; }
    case 'scratcher': {
      mk(new THREE.BoxGeometry(0.5, 0.05, 0.5), mat({ color: '#d8cfc0' }), 0, 0.025, 0, g);
      const rope = tex((c, w, h) => { c.fillStyle = '#c9a66b'; c.fillRect(0, 0, w, h); c.strokeStyle = '#9a7a45'; for (let y = 0; y < h; y += 6) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y + 3); c.stroke(); } });
      mk(new THREE.CylinderGeometry(0.06, 0.06, 0.75, 16), mat({ map: rope }), 0, 0.42, 0, g);
      mk(new THREE.BoxGeometry(0.4, 0.04, 0.4), mat({ color: '#d8cfc0' }), 0, 0.8, 0, g);
      const str = mk(new THREE.CylinderGeometry(0.003, 0.003, 0.25, 3), mat({ color: '#eee' }), 0.18, 0.66, 0, g); str.castShadow = false;
      Pp.ball = mk(new THREE.SphereGeometry(0.035, 10, 8), mat({ color: '#e5484d' }), 0.18, 0.52, 0, g); break; }
    case 'pond': {
      const water = mk(new THREE.CircleGeometry(1, 40), mat({ color: '#3f8fb0', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.88 }), 0, 0.03, 0, g);
      water.rotation.x = -PI / 2; water.scale.set(1.1, 0.7, 1); water.receiveShadow = true; water.castShadow = false; Pp.water = water;
      const rim = mat({ color: '#8d8a82', roughness: 0.95 });
      for (let i = 0; i < 26; i++) { const a = (i / 26) * PI * 2; const st = mk(new THREE.DodecahedronGeometry(0.1 + (i % 3) * 0.025, 0), rim, Math.cos(a) * 1.18, 0.04, Math.sin(a) * 0.78, g); st.scale.y = 0.55; st.rotation.y = i; }
      for (const [x, z] of [[-0.5, 0.2], [0.55, -0.25], [0.2, 0.35]]) { const l = mk(new THREE.CircleGeometry(0.11, 12, 0, PI * 1.8), mat({ color: '#4f9a3e' }), x, 0.035, z, g); l.rotation.x = -PI / 2; l.castShadow = false; }
      mk(new THREE.SphereGeometry(0.04, 8, 6), mat({ color: '#f2a6c4' }), -0.5, 0.05, 0.2, g);
      for (let i = 0; i < 7; i++) { const r = mk(new THREE.CylinderGeometry(0.008, 0.01, 0.6, 4), mat({ color: '#5f8a3a' }), -1.05 + (i % 3) * 0.06, 0.3, -0.5 + i * 0.04, g); r.rotation.z = (Math.random() - 0.5) * 0.2; if (i % 2) mk(new THREE.CapsuleGeometry(0.018, 0.08, 3, 6), mat({ color: '#6b4428' }), r.position.x, 0.58, r.position.z, g); }
      break; }
  }
  g.traverse((o) => { if (o.isMesh) o.userData.objId = obj.id; });
  g.userData = { objId: obj.id, type: obj.type, P: Pp };
  g.position.set(obj.x, 0, obj.z); g.rotation.y = obj.rot * PI / 2;
  return g;
}
export function updatePetVisual(g, obj, time) {
  const Pp = g.userData.P, s = obj.s || {};
  if (obj.type === 'petBowl') { const f = (s.food || 0) / 100; Pp.food.visible = f > 0.03; Pp.food.scale.set(1, Math.max(0.1, f), 1); }
  if (obj.type === 'litterBox') Pp.clumps.children.forEach((c, i) => { c.visible = i < (s.dirt || 0); });
  if (obj.type === 'scratcher') Pp.ball.position.x = 0.18 + Math.sin(time * 2) * 0.02;
  if (obj.type === 'pond') Pp.water.material.color.setHSL(0.54, 0.47, 0.44 + Math.sin(time * 0.8) * 0.02);
}
export const isPetType = (t) => ['petBowl', 'petBed', 'capyBed', 'litterBox', 'scratcher', 'pond'].includes(t);

// ============================================================
//  AI hewan
// ============================================================
export function petAutonomy(hh, pet) {
  const n = pet.needs, sp = pet.species, W = hh.world, hr = hh.hour();
  const objs = (t) => W.objects.filter((o) => o.type === t);
  const humans = ['Handoyo', 'Naswa'].map((k) => hh.sims[k]).filter((h) => !h.hidden && !h.engagedBy && !(h.cur && ['sleep', 'nap'].includes(h.cur.key)));
  const opts = [];
  const add = (score, run) => opts.push({ score: score + Math.random() * 10, run });
  const act = (key, types) => () => { for (const t of [].concat(types)) for (const o of objs(t)) { if (hh.objBusy(o, pet)) continue; const I = INTER[key]; const c = hh.ctx(pet, o); if ((I.check ? I.check(c) : true) === true) { hh.queueAct(pet, key, o.id); return true; } } return false; };
  const self = (key) => () => { hh.queueAct(pet, key, null, { self: true }); return true; };
  const pair = (key, tgt) => () => { if (!tgt) return false; hh.queueSocial(pet, key, tgt.name, 'pair'); return true; };
  const human = humans[Math.floor(Math.random() * humans.length)];
  const others = hh.pets().filter((o) => o !== pet && !o.hidden && !o.engagedBy);
  const pickO = (f) => { const l = others.filter(f); return l[Math.floor(Math.random() * l.length)]; };
  const other = pickO(() => true);
  const capyAdult = pickO((o) => o.species === 'capy' && !isBaby(hh, o));
  if (isBaby(hh, pet)) {
    const mom = hh.sims[pet.mom];
    if (mom && !mom.hidden && !mom.engagedBy && (mom.lvl || 0) === (pet.lvl || 0)) {
      if (n.hunger < 60) { hh.queueSocial(pet, 'nurse', mom.name, 'pair'); return; }
      if (Math.hypot(mom.x - pet.x, mom.z - pet.z) > 2.5) { hh.queueAct(pet, 'go', null, { pos: [mom.x + (Math.random() - 0.5), mom.z + (Math.random() - 0.5)], lvl: mom.lvl || 0 }); return; }
      if (n.energy < 50) { hh.queueSocial(pet, 'cuddle', mom.name, 'pair'); return; }
    }
    const sib = pickO((o) => isBaby(hh, o));
    if (sib && Math.random() < 0.5) { hh.queueSocial(pet, 'chase', sib.name, 'pair'); return; }
  }
  const mate = !isBaby(hh, pet) && pickO((o) => o.species === sp && o.sex && o.sex !== pet.sex && !isBaby(hh, o));
  if (mate && PAIR.mate.need(hh, pet, mate) && Math.random() < 0.04) add(60, pair('mate', mate));
  if (!humans.length) { /* semua sibuk */ }
  if (n.hunger < 55) { add((100 - n.hunger) * 1.4, act('eatBowl', 'petBowl')); add((100 - n.hunger) * 1.1, pair('beg', human)); if (sp === 'capy') add((100 - n.hunger) * 1.2, self('grazeLawn')); }
  const night = hr >= 22 || hr < 6;
  if (n.energy < 40 || night) add((100 - n.energy) * 1.3 + (night ? 25 : 0), sp === 'cat' ? act(Math.random() < 0.4 ? 'napBedCat' : Math.random() < 0.5 ? 'napSofaCat' : 'sleepPet', ['bed', 'sofa', 'petBed', 'armchair']) : act('sleepPet', 'capyBed'));
  if (n.bladder < 50) add((100 - n.bladder) * 2.3, sp === 'cat' ? act('useLitter', 'litterBox') : self('poop'));
  if (n.hygiene < 55) add((100 - n.hygiene) * 1.0, sp === 'cat' ? self('groom') : act('soak', 'pond'));
  if (n.fun < 65) {
    if (sp === 'cat') { add((100 - n.fun) * 1.0, act('scratch', 'scratcher')); add((100 - n.fun) * 0.8, act('watchFish', 'aquarium')); add((100 - n.fun) * 0.7, self('zoomies')); add((100 - n.fun) * 0.25, self('knock')); if (capyAdult) add((100 - n.fun) * 0.8, pair('ride', capyAdult)); }
    else { add((100 - n.fun) * 1.0, act('soak', 'pond')); add((100 - n.fun) * 0.9, self('chill')); add((100 - n.fun) * 0.5, self('zoomies')); add((100 - n.fun) * 0.4, act('graze', 'veggie')); }
    add((100 - n.fun) * 0.5, pair('chase', other));
  }
  if (n.social < 60) { add((100 - n.social) * 1.1, pair('nuzzle', human)); add((100 - n.social) * 0.8, pair(sp === 'cat' ? 'follow' : 'sniff', sp === 'cat' ? human : other)); add((100 - n.social) * 0.6, pair('cuddle', other)); }
  if (Math.random() < 0.2) add(20, self(sp === 'cat' ? 'meow' : 'squeak'));
  opts.sort((a, b) => b.score - a.score);
  for (const o of opts) if (o.score > 18 && o.run()) return;
}
export { fmtRp };
