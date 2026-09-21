// ============================================================
//  HANDOYO ♥ NASWA — pasangan super mesra
//  - interaksi romantis baru, autonomi mesra, hubungan selalu maksimal
//  - "Bercinta" di kasur (momen intim, ditampilkan tertutup/privat ala The Sims)
// ============================================================
import { MOODLETS, TYPES } from './data.js';
import { INTER, SOCIAL } from './interactions.js';
import { BOOKS } from './books.js';

Object.assign(MOODLETS, {
  superMesra: { label: 'Pasangan super mesra', emoji: '💞', val: 20, dur: 100000 },
  kutuBuku: { label: 'Tenggelam dalam buku favorit', emoji: '📖', val: 14, dur: 300 },
  bercinta: { label: 'Momen intim penuh cinta', emoji: '💗', val: 40, dur: 600 },
  dimanja: { label: 'Dimanja pasangan', emoji: '🥰', val: 16, dur: 240 },
});
const R = (label, icon, anim, dur, gain, rel, extra = {}) => ({ label, icon, min: -100, dur, anim, gain, rel, mood: 'dimanja', pmood: 'dimanja', romantic: true, ...extra });
Object.assign(SOCIAL, {
  keningKiss: R('Cium kening', '😚', ['kiss', 'laugh'], 3, { social: 3 }, 5, { close: 0.4 }),
  pipiKiss: R('Cium pipi', '😘', ['kiss', 'laugh'], 3, { social: 3, fun: 1 }, 5, { close: 0.4 }),
  pillowTalk: R('Ngobrol manja berdua', '🥰', ['talk', 'laugh'], 12, { social: 3, fun: 1.2 }, 6),
  gombal: R('Rayuan maut', '😍', ['talk', 'laugh'], 5, { social: 2.5, fun: 2 }, 5),
  suapin: R('Suapin camilan', '🍓', ['grab', 'eat'], 6, { social: 2, hunger: 2 }, 5, { close: 0.5 }),
  pijatPundak: R('Pijat pundak pasangan', '💆', ['grab', 'idle'], 10, { social: 2 }, 6, { close: 0.35, behind: true, pgain: { energy: 1.2, fun: 1 } }),
  dansaRomantis: R('Dansa romantis', '💃', ['dance', 'dance'], 12, { social: 2.5, fun: 2.5 }, 7, { close: 0.45 }),
  suratCinta: R('Kasih surat cinta', '💌', ['grab', 'laugh'], 4, { social: 3 }, 6),
  gendong: R('Gendong pasangan', '🤗', ['hug', 'hug'], 5, { fun: 2.5, social: 2 }, 6, { close: 0.35 }),
  bisikSayang: R('Bisikin "aku sayang kamu"', '💗', ['talk', 'laugh'], 3, { social: 3.5 }, 7, { close: 0.4 }),
  pelukSofa: R('Sandaran manja', '🛋️', ['hug', 'hug'], 15, { social: 3, fun: 1, energy: 0.5 }, 6, { close: 0.4 }),
});
// ---- bercinta (di kasur ganda) ----
const partnerOf = (hh, sim) => hh.humans().find((h) => h !== sim);
const doubleBed = (t) => ['bed', 'kingBed'].includes(t);
for (const t of ['bed', 'kingBed']) if (TYPES[t] && !TYPES[t].acts.includes('bercinta')) TYPES[t].acts.unshift('bercinta');
const step = (c, label) => ({ target: { obj: c.obj.id, kind: 'lie' }, anim: 'lie', dur: 30, icon: '💞', label, snd: 'romance', eff: { social: 3.5, fun: 2.5, energy: -0.2, hygiene: -0.4 } });
INTER.bercinta = {
  label: (c) => `Bercinta dengan ${partnerOf(c.g, c.sim) ? partnerOf(c.g, c.sim).name : 'pasangan'} 💞`, icon: '💞',
  check: (c) => {
    if (c.sim.species !== 'human') return 'Khusus Handoyo & Naswa';
    const p = partnerOf(c.g, c.sim); if (!p || p.hidden || p.away) return 'Pasangan sedang tidak di rumah';
    if (!doubleBed(c.obj.type)) return 'Butuh kasur ganda';
    if (c.sim.needs.energy < 10 || p.needs.energy < 10) return 'Terlalu capek';
    if (c.g.world.guest && c.g.world.guest.stage === 2) return 'Sedang ada tamu di rumah';
    return true;
  },
  build: (c) => ({ steps: [{ ...step(c, 'Momen intim berdua'),
    onStart: (x) => { const p = partnerOf(x.g, x.sim); if (p) { for (const q of [...p.queue]) if (q.started) x.g.endAction(p, q, true); p.queue = []; p.engagedBy = null; x.g.queueAct(p, 'bercintaP', x.obj.id); } x.g.toast(`💞 ${x.sim.name} & ${p ? p.name : ''} menikmati waktu berdua… (momen pribadi)`, 'good'); },
    onDone: (x) => { const p = partnerOf(x.g, x.sim); for (const s of [x.sim, p]) if (s) { s.mood('bercinta'); s.addNeed('social', 40); s.addNeed('fun', 25); } x.g.op({ o: 'rel', d: 10 }); x.g.addFam(30); x.g.goal && x.g.goal('kiss'); } }] }),
};
INTER.bercintaP = { label: 'Menemani pasangan', icon: '💞', build: (c) => ({ steps: [step(c, 'Momen intim berdua')] }) };

// ---- selalu super mesra, level keluarga maksimal ----
export function installRomance(hh, FAMILY_XP) {
  const W = hh.world;
  const maxFam = FAMILY_XP[FAMILY_XP.length - 1];
  if ((W.fam || 0) < maxFam) W.fam = maxFam;
  W.rel = Math.max(W.rel || 0, 100);
  hh.romanceMinute = (m) => {
    const W2 = hh.world; if (W2.rel < 95) W2.rel = 100; if (W2.fam < maxFam) W2.fam = maxFam;
    const [a, b] = hh.humans(); if (!a || !b) return;
    for (const s of [a, b]) if (!s.moods.some((q) => q.k === "superMesra")) s.mood('superMesra');
    // Naswa si kutu buku: rajin ke perpustakaan lantai 2 (buku forensik favoritnya)
    const nw = hh.sims.Naswa; const hr0 = Math.floor((m % 1440) / 60);
    if (nw && m % 100 === 0 && nw.autonomy && !nw.hidden && !nw.visit && !nw.queue.length && !nw.engagedBy && nw.needs.energy > 30 && hr0 >= 8 && hr0 < 22 && Math.random() < 0.45) {
      const tables = W2.objects.filter((o) => o.type === 'readTable' || (o.lvl === 1 && o.type === 'armchair'));
      const t = tables[Math.floor(Math.random() * tables.length)];
      const pool = BOOKS.filter((bk) => (Math.random() < 0.6 ? bk.shelf === 'forensik' : true) && !bk.verify);
      const book = pool[Math.floor(Math.random() * pool.length)];
      if (t && book) { hh.queueAct(nw, t.type === 'readTable' ? 'readLib' : 'readLib', t.id, { book }); nw.mood('kutuBuku'); nw.say = { text: `📖 Mau lanjut baca "${book.title.slice(0, 40)}"…`, until: Date.now() + 6000 }; }
    }
    if (m % 45 !== 0 || a.hidden || b.hidden || a.visit || b.visit) return;
    const idle = (s) => s.autonomy && !s.queue.length && !s.engagedBy && s.needs.energy > 25;
    const hr = Math.floor((m % 1440) / 60);
    if (idle(a) && idle(b) && Math.hypot(a.x - b.x, a.z - b.z) < 12 && (a.lvl || 0) === (b.lvl || 0)) {
      const bed = W2.objects.find((o) => doubleBed(o.type) && (o.lvl || 0) === 0);
      if ((hr >= 21 || hr < 1) && bed && Math.random() < 0.3) { hh.queueAct(Math.random() < 0.5 ? a : b, 'bercinta', bed.id); return; }
      if (Math.random() < 0.55) { const keys = ['keningKiss', 'pipiKiss', 'pillowTalk', 'gombal', 'suapin', 'pijatPundak', 'dansaRomantis', 'bisikSayang', 'pelukSofa', 'hug', 'kiss', 'longhug', 'backhug']; const k = keys[Math.floor(Math.random() * keys.length)]; if (SOCIAL[k]) { const [x, y] = Math.random() < 0.5 ? [a, b] : [b, a]; hh.queueSocial(x, k, y.name, 'social'); } }
    }
  };
}
// overlay privat untuk pemain saat momen intim
export function updateRomanceFX(game) {
  const hh = game.hh; const hs = hh.humans(); const on = hs.length === 2 && hs.every((s) => s.cur && ['bercinta', 'bercintaP'].includes(s.cur.key) && s.anim === 'lie');
  let el = document.getElementById('privacyVeil');
  if (on && !el) { el = document.createElement('div'); el.id = 'privacyVeil'; el.innerHTML = '<div class="pv"><div class="hearts">💗 💞 💗</div><b>Momen pribadi Handoyo & Naswa</b><small>lampu kamar diredupkan… 🌙</small></div>'; document.body.appendChild(el); }
  if (!on && el) el.remove();
}
