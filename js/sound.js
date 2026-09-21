// ============================================================
//  EFEK SUARA PROSEDURAL (WebAudio, tanpa file audio)
//  - suara UI (klik, uang, level, dll.)
//  - suara tiap aksi karakter/hewan, diredam sesuai jarak kamera
//  - ambience: burung siang, jangkrik malam, hujan
// ============================================================
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];

export class SoundFX {
  constructor() { this.on = true; this.vol = 0.8; this.ctx = null; this.loops = new Map(); this.timers = {}; this.prev = {}; this.noteI = 0; }
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return true; }
    try {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return false;
      this.ctx = new C(); this.master = this.ctx.createGain(); this.master.gain.value = this.vol; this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2; this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return true;
    } catch (e) { return false; }
  }
  setVolume(v) { this.vol = v; if (this.master) this.master.gain.value = v; }
  // ---------- blok dasar ----------
  env(g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  osc(type, f0, f1, dur, peak, t0 = 0, filt) {
    const c = this.ctx, t = c.currentTime + t0, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    this.env(g, t, Math.min(0.02, dur / 4), peak, dur);
    let node = o; if (filt) { const f = c.createBiquadFilter(); f.type = filt[0]; f.frequency.value = filt[1]; f.Q.value = filt[2] || 1; o.connect(f); node = f; }
    node.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  burst(type, freq, q, dur, peak, t0 = 0, sweepTo) {
    const c = this.ctx, t = c.currentTime + t0, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; s.loop = true; f.type = type; f.frequency.setValueAtTime(freq, t); if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur); f.Q.value = q;
    this.env(g, t, Math.min(0.01, dur / 5), peak, dur);
    s.connect(f).connect(g).connect(this.master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  // ---------- suara UI ----------
  play(k) {
    if (!this.on || !this.ensure()) return;
    const S = {
      click: () => this.osc('triangle', 700, 520, 0.05, 0.05),
      money: () => { this.osc('sine', 1318, 0, 0.09, 0.07); this.osc('sine', 1760, 0, 0.18, 0.07, 0.08); this.burst('highpass', 6000, 0.5, 0.12, 0.03, 0.02); },
      spend: () => { this.osc('triangle', 440, 330, 0.1, 0.05); },
      level: () => [523, 659, 784].forEach((f, i) => this.osc('triangle', f, 0, 0.14, 0.07, i * 0.09)),
      goal: () => [659, 784, 1047].forEach((f, i) => this.osc('sine', f, 0, 0.16, 0.07, i * 0.08)),
      fanfare: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.osc('square', f, 0, 0.16, 0.035, i * 0.11, ['lowpass', 2200])),
      bell: () => { this.osc('sine', 988, 0, 0.5, 0.07); this.osc('sine', 740, 0, 0.7, 0.07, 0.18); },
      bad: () => { this.osc('sawtooth', 300, 220, 0.18, 0.03, 0, ['lowpass', 900]); },
      good: () => { this.osc('sine', 740, 0, 0.1, 0.06); this.osc('sine', 988, 0, 0.14, 0.06, 0.08); },
      page: () => this.burst('bandpass', 2500, 0.8, 0.18, 0.06, 0, 5000),
      doorbell: () => { this.osc('sine', 880, 0, 0.6, 0.09); this.osc('sine', 698, 0, 0.9, 0.09, 0.45); },
      cash: () => { this.burst('highpass', 5000, 1, 0.08, 0.05); this.osc('sine', 2093, 0, 0.3, 0.06, 0.06); this.osc('sine', 2637, 0, 0.35, 0.05, 0.12); },
      sms: () => { this.osc('sine', 1568, 0, 0.09, 0.06); this.osc('sine', 2093, 0, 0.14, 0.06, 0.11); },
      motor: () => { this.osc('sawtooth', 55, 110, 1.4, 0.04, 0, ['lowpass', 500]); this.osc('sawtooth', 110, 70, 1.2, 0.03, 1.2, ['lowpass', 400]); },
      ring: () => { for (let i = 0; i < 4; i++) this.osc('square', i % 2 ? 1320 : 1760, 0, 0.1, 0.03, i * 0.12, ['lowpass', 3000]); },
    }[k];
    if (S) S();
  }
  // ---------- suara aksi (sekali bunyi) ----------
  shot(k, v, extra = {}) {
    const P = extra.pitch || 1;
    switch (k) {
      case 'step': this.burst('bandpass', 900 + Math.random() * 500, 1.2, 0.07, 0.09 * v); this.osc('sine', 90, 50, 0.06, 0.05 * v); break;
      case 'paw': this.burst('lowpass', 500, 1, 0.05, 0.05 * v); break;
      case 'heavy': this.burst('lowpass', 400, 1, 0.12, 0.11 * v); this.osc('sine', 60, 40, 0.12, 0.08 * v); break;
      case 'crunch': for (let i = 0; i < 3; i++) this.burst('bandpass', 2400 + Math.random() * 800, 2, 0.04, 0.07 * v, i * 0.07); break;
      case 'munch': for (let i = 0; i < 2; i++) this.burst('lowpass', 900, 1, 0.06, 0.08 * v, i * 0.12); break;
      case 'babble': {
        const n = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < n; i++) { const f = 140 * P * (0.85 + Math.random() * 0.45); this.osc('triangle', f, f * (0.8 + Math.random() * 0.5), 0.1, 0.05 * v, i * 0.12, ['bandpass', 700 + Math.random() * 900, 2.2]); }
        break; }
      case 'laugh': for (let i = 0; i < 4; i++) this.osc('triangle', 260 * P - i * 18, 200 * P - i * 18, 0.1, 0.06 * v, i * 0.13, ['bandpass', 1000, 1.5]); break;
      case 'aww': this.osc('triangle', 300 * P, 420 * P, 0.35, 0.06 * v, 0, ['bandpass', 900, 1.4]); this.osc('triangle', 420 * P, 330 * P, 0.4, 0.06 * v, 0.3, ['bandpass', 900, 1.4]); break;
      case 'mwah': this.burst('bandpass', 1500, 3, 0.06, 0.08 * v); this.osc('sine', 900, 1600, 0.08, 0.05 * v, 0.05); break;
      case 'hmph': this.osc('sawtooth', 200 * P, 130 * P, 0.25, 0.04 * v, 0, ['lowpass', 900]); break;
      case 'snore': this.burst('lowpass', 260, 2, 1.1, 0.07 * v); break;
      case 'meow': { const f = 520 * P; const o = this.osc('sawtooth', f, f * 0.75, 0.55, 0.05 * v, 0, ['bandpass', 1300, 2.5]); o.frequency.linearRampToValueAtTime(f * 1.5, this.ctx.currentTime + 0.18); break; }
      case 'squeak': for (let i = 0; i < 2; i++) this.osc('sine', 1300 * P, 1900 * P, 0.12, 0.05 * v, i * 0.16); break;
      case 'splash': this.burst('lowpass', 1600, 0.7, 0.35, 0.09 * v, 0, 500); break;
      case 'swish': this.burst('bandpass', 400, 1, 0.35, 0.08 * v, 0, 2200); break;
      case 'type': for (let i = 0; i < 4; i++) this.burst('highpass', 3500, 1, 0.02, 0.05 * v, i * (0.06 + Math.random() * 0.05)); break;
      case 'thump': this.osc('sine', 75, 45, 0.12, 0.1 * v); break;
      case 'brush': this.burst('highpass', 2400, 0.7, 0.2, 0.05 * v); break;
      case 'scratch': for (let i = 0; i < 3; i++) this.burst('bandpass', 3200, 3, 0.05, 0.06 * v, i * 0.08); break;
      case 'toy': this.osc('sine', 900, 1400, 0.12, 0.06 * v); break;
      case 'flush': this.burst('lowpass', 2500, 0.8, 1.4, 0.1 * v, 0, 300); break;
      case 'chirp': { const b = 2800 + Math.random() * 1600; for (let i = 0; i < 2 + Math.random() * 3; i++) this.osc('sine', b, b * (1.2 + Math.random() * 0.4), 0.07, 0.025 * v, i * 0.1); break; }
      case 'clink': this.osc('sine', 2600 + Math.random() * 800, 0, 0.12, 0.04 * v); break;
      case 'page': this.burst('bandpass', 2500, 0.8, 0.18, 0.05 * v, 0, 5000); break;
      case 'spray': this.burst('highpass', 4200, 0.6, 0.15, 0.05 * v); break;
      case 'brushStroke': this.burst('bandpass', 1800 + Math.random() * 1200, 0.9, 0.16, 0.035 * v, 0, 900); break;
      case 'piano': { const f = 261.6 * Math.pow(2, PENTA[Math.floor(Math.random() * PENTA.length)] / 12); this.osc('triangle', f, 0, 0.8, 0.06 * v); this.osc('sine', f * 2, 0, 0.5, 0.02 * v); break; }
      case 'guitar': { const root = [196, 220, 247, 262][Math.floor(Math.random() * 4)]; [1, 1.26, 1.5, 2].forEach((m, i) => this.osc('sawtooth', root * m, root * m * 0.995, 0.9, 0.02 * v, i * 0.03, ['lowpass', 1800])); break; }
      case 'gamelan': { const f = [392, 440, 523, 587, 659][Math.floor(Math.random() * 5)]; this.osc('sine', f, 0, 1.4, 0.05 * v); this.osc('sine', f * 2.76, 0, 0.6, 0.02 * v); this.osc('sine', f * 5.4, 0, 0.3, 0.01 * v); break; }
      case 'pool': this.osc('sine', 2400, 1800, 0.05, 0.08 * v); this.burst('bandpass', 3000, 3, 0.03, 0.05 * v, 0.05); break;
      case 'pong': this.osc('sine', 1000 + Math.random() * 300, 0, 0.05, 0.07 * v); break;
      case 'dart': this.burst('lowpass', 900, 2, 0.06, 0.1 * v); break;
      case 'creak': this.osc('sawtooth', 180, 120, 0.5, 0.02 * v, 0, ['bandpass', 900, 6]); break;
      case 'boing': this.osc('sine', 180, 520, 0.25, 0.06 * v); break;
      case 'whistle': { const o = this.osc('sine', 2900, 2700, 0.7, 0.05 * v); const l = this.ctx.createOscillator(), d = this.ctx.createGain(); l.frequency.value = 28; d.gain.value = 120; l.connect(d).connect(o.frequency); l.start(); l.stop(this.ctx.currentTime + 0.8); break; }
      case 'kentong': for (let i = 0; i < 3; i++) this.burst('bandpass', 650, 8, 0.07, 0.12 * v, i * 0.22); break;
      case 'bakso': for (let i = 0; i < 4; i++) this.osc('sine', 3100, 0, 0.12, 0.05 * v, i * 0.14); break;
      case 'bellCart': for (let i = 0; i < 3; i++) this.osc('triangle', 1760, 0, 0.15, 0.04 * v, i * 0.2); break;
      case 'glug': for (let i = 0; i < 3; i++) this.osc('sine', 300 + i * 80, 200, 0.1, 0.05 * v, i * 0.12); break;
      case 'game': this.osc('square', 440 + Math.floor(Math.random() * 6) * 110, 0, 0.07, 0.02 * v, 0, ['lowpass', 2500]); break;
      case 'tick': this.burst('bandpass', 3500, 6, 0.02, 0.05 * v); break;
      case 'kids': for (let i = 0; i < 5; i++) this.osc('triangle', 520 - i * 25, 440 - i * 25, 0.08, 0.04 * v, i * 0.11, ['bandpass', 1600, 1.5]); break;
      case 'note': {
        const i = this.noteI++; const base = 196; const semi = PENTA[(i * 3 + (i >> 2)) % PENTA.length];
        this.osc('triangle', base * Math.pow(2, semi / 12) * 2, 0, 0.22, 0.045 * v);
        if (i % 2 === 0) this.osc('sine', base * Math.pow(2, PENTA[(i >> 1) % 4] / 12) / 2, 0, 0.3, 0.07 * v);
        if (i % 4 === 2) this.burst('highpass', 7000, 0.7, 0.05, 0.03 * v); if (i % 4 === 0) this.osc('sine', 110, 50, 0.1, 0.08 * v);
        break; }
    }
  }
  // ---------- loop kontinu ----------
  loop(key, kind, gain) {
    let L = this.loops.get(key);
    if (!L) {
      const c = this.ctx, g = c.createGain(); g.gain.value = 0; g.connect(this.master);
      const nodes = [];
      const noise = (type, f, q) => { const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; s.connect(fl); s.start(0, Math.random()); nodes.push(s); return fl; };
      const lfo = (target, rate, depth) => { const o = c.createOscillator(), d = c.createGain(); o.frequency.value = rate; d.gain.value = depth; o.connect(d).connect(target); o.start(); nodes.push(o); };
      let out;
      if (kind === 'sizzle') { out = noise('highpass', 3500, 0.6); const a = c.createGain(); a.gain.value = 0.6; out.connect(a); lfo(a.gain, 7, 0.3); out = a; }
      else if (kind === 'shower') out = noise('bandpass', 1800, 0.45);
      else if (kind === 'tap') out = noise('bandpass', 1100, 1.2);
      else if (kind === 'rain') { out = noise('lowpass', 5200, 0.3); }
      else if (kind === 'purr') { out = noise('lowpass', 160, 1); const a = c.createGain(); a.gain.value = 0.5; out.connect(a); lfo(a.gain, 24, 0.5); out = a; }
      else if (kind === 'tv') { out = noise('bandpass', 950, 3); const a = c.createGain(); a.gain.value = 0.5; out.connect(a); lfo(a.gain, 3.3, 0.45); out = a; }
      else if (kind === 'mower') { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 82; lfo(o.frequency, 6, 5); o.start(); nodes.push(o); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700; o.connect(f); out = f; }
      else if (kind === 'crickets') { const o = c.createOscillator(); o.frequency.value = 4600; o.start(); nodes.push(o); const a = c.createGain(); a.gain.value = 0.3; o.connect(a); lfo(a.gain, 32, 0.3); const b = c.createGain(); b.gain.value = 0.5; a.connect(b); lfo(b.gain, 0.7, 0.5); out = b; }
      else if (kind === 'espresso') { out = noise('highpass', 2600, 0.8); const a = c.createGain(); a.gain.value = 0.7; out.connect(a); lfo(a.gain, 2, 0.3); out = a; }
      else if (kind === 'blender') { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 160; lfo(o.frequency, 9, 20); o.start(); nodes.push(o); const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; o.connect(f); out = f; }
      else if (kind === 'hum') { const o = c.createOscillator(); o.frequency.value = 100; o.start(); nodes.push(o); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300; o.connect(f); out = f; }
      else if (kind === 'fountain') out = noise('bandpass', 2200, 0.6);
      else if (kind === 'cafe') { out = noise('bandpass', 650, 2.2); const a = c.createGain(); a.gain.value = 0.5; out.connect(a); lfo(a.gain, 1.7, 0.3); out = a; }
      else if (kind === 'motorLoop') { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 62; lfo(o.frequency, 11, 6); o.start(); nodes.push(o); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 450; o.connect(f); out = f; }
      else if (kind === 'washer') { out = noise('lowpass', 220, 1.5); const a = c.createGain(); a.gain.value = 0.6; out.connect(a); lfo(a.gain, 1.2, 0.4); out = a; }
      out.connect(g);
      L = { g, nodes, kind }; this.loops.set(key, L);
    }
    L.want = gain; L.seen = true;
  }
  every(key, interval, fn) { const t = (this.timers[key] ?? Math.random() * interval) - this.dt; if (t <= 0) { fn(); this.timers[key] = interval * (0.8 + Math.random() * 0.4); } else this.timers[key] = t; }

  // ---------- update tiap frame ----------
  update(g, dt) {
    if (!this.on || !this.ctx || this.ctx.state !== 'running') { if (this.loops.size) this.stopAll(); return; }
    this.dt = dt; for (const L of this.loops.values()) L.seen = false;
    const tg = g.controls.target, camD = g.camera.position.distanceTo(tg);
    const zoom = clamp(1.35 - camD / 42, 0.2, 1);
    const hh = g.hh, W = hh.world, hr = (W.time % 1440) / 60, mul = W.speed === 0 ? 0 : 1;
    const actors = [...Object.values(hh.sims), ...Object.values(hh.others || {})];
    for (const s of actors) {
      if (s.hidden) { this.prev[s.name] = null; continue; }
      const dx = s.x - tg.x, dz = s.z - tg.z, dy = (s.y || 0) - tg.y; const d = Math.sqrt(dx * dx + dz * dz + dy * dy);
      const v = zoom / (1 + d * d * 0.03); const k = s.name;
      const sp = s.species, human = sp === 'human' || sp === 'npc' || sp === 'staff';
      const pitch = sp === 'cat' ? 1 : sp === 'capy' ? 0.8 : (s.outfit && s.outfit.dress ? 1.6 : 1) * (s.outfit && s.outfit.wide ? 0.85 : 1);
      const a = s.anim, prev = this.prev[k]; this.prev[k] = a;
      if (v < 0.015 || mul === 0) continue;
      if (prev !== a) {
        if (a === 'hug') this.shot('aww', v, { pitch }); if (a === 'kiss') this.shot('mwah', v);
        if (prev === 'toilet') this.shot('flush', v);
        if (a === 'angry') this.shot('hmph', v, { pitch });
      }
      if (s.moving || ((a === 'walk' || a === 'jog' || a === 'push') && sp !== 'human')) {
        const iv = a === 'jog' ? 0.28 : sp === 'cat' ? 0.3 : sp === 'capy' ? 0.42 : 0.46;
        this.every(k + 'step', iv, () => this.shot(human ? (s.outfit && s.outfit.wide ? 'heavy' : 'step') : 'paw', v));
      }
      switch (a) {
        case 'cook': this.loop(k + 'sz', 'sizzle', 0.25 * v); this.every(k + 'cl', 2.2, () => this.shot('clink', v)); break;
        case 'shower': this.loop(k + 'sh', 'shower', 0.3 * v); break;
        case 'wash': this.loop(k + 'tp', 'tap', 0.22 * v); this.every(k + 'cl', 1.4, () => this.shot('clink', v)); break;
        case 'water': this.loop(k + 'tp', 'tap', 0.12 * v); break;
        case 'push': if (sp === 'human' || human) this.loop(k + 'mw', 'mower', 0.12 * v); break;
        case 'sitWatch': case 'watch': this.loop(k + 'tv', 'tv', 0.18 * v); break;
        case 'listen': case 'dance': this.every('music', 0.24, () => this.shot('note', v)); break;
        case 'sitType': this.every(k + 'ty', 0.5, () => this.shot('type', v)); break;
        case 'sitGame': this.every(k + 'gm', 0.6, () => this.shot('toy', v * 0.5)); break;
        case 'eat': this.every(k + 'eat', sp === 'cat' ? 0.7 : 1.1, () => this.shot(human ? 'crunch' : 'munch', v)); break;
        case 'graze': this.every(k + 'gz', 0.8, () => this.shot('munch', v)); break;
        case 'talk': case 'phone': if (human) this.every(k + 'bb', 0.75, () => this.shot('babble', v, { pitch })); break;
        case 'laugh': this.every(k + 'lg', 1.8, () => this.shot('laugh', v, { pitch })); break;
        case 'mop': this.every(k + 'mp', 0.9, () => this.shot('swish', v)); break;
        case 'paint': case 'brush': this.every(k + 'br', 1.1, () => this.shot('brush', v)); break;
        case 'exercise': case 'jogTM': this.every(k + 'th', 0.45, () => this.shot('thump', v)); break;
        case 'sitRead': case 'read': this.every(k + 'pg', 6, () => this.shot('page', v)); break;
        case 'lie': case 'nap': case 'sleep': case 'passout':
          if (human) this.every(k + 'sn', 3.2, () => this.shot('snore', v)); else if (sp === 'cat') this.loop(k + 'pr', 'purr', 0.25 * v); break;
        case 'rub': if (sp === 'cat') this.loop(k + 'pr', 'purr', 0.3 * v); break;
        case 'beg': this.every(k + 'bg', 2.4, () => this.shot(sp === 'cat' ? 'meow' : 'squeak', v, { pitch: s.bornAt != null && hh.world.time - s.bornAt < 5760 ? 1.4 : 1 })); break;
        case 'soak': this.every(k + 'sp', 2.6, () => this.shot('splash', v)); break;
        case 'scratch': this.every(k + 'sc', 0.5, () => this.shot('scratch', v)); break;
        case 'play': this.every(k + 'pl', 1.4, () => this.shot(sp === 'cat' ? 'toy' : 'squeak', v, { pitch: 1.2 })); break;
        case 'hug': this.every(k + 'hg', 4, () => this.shot('aww', v * 0.6, { pitch })); break;
      }
    }
    // suara dari langkah aksi (piano, gitar, espresso, dll.)
    for (const s of actors) {
      if (s.hidden || !s.snd) continue;
      const dx = s.x - tg.x, dz = s.z - tg.z; const v = zoom / (1 + (dx * dx + dz * dz) * 0.03); if (v < 0.02) continue;
      const k = s.name + ':' + s.snd;
      const LOOP = { espresso: 0.2, blender: 0.08, hum: 0.12, fountain: 0.12, sizzle: 0.22, tap: 0.2, shower: 0.25, cafe: 0.1 };
      const EVERY = { piano: 0.32, guitar: 0.9, gamelan: 0.42, pool: 2.6, pong: 0.55, dart: 2.2, creak: 1.6, boing: 0.7, thump: 0.45, type: 0.5, printer: 0.35, game: 0.18, chirp: 1.4, glug: 3, music: 0.24, brush: 0.8, brushStroke: 0.5, tick: 1 };
      if (LOOP[s.snd]) this.loop(k, s.snd, LOOP[s.snd] * v);
      else if (EVERY[s.snd]) this.every(k, EVERY[s.snd], () => this.shot(s.snd === 'music' ? 'note' : s.snd === 'printer' ? 'type' : s.snd === 'brush' ? 'brushStroke' : s.snd, v));
      if (s.role === 'kid' || (s.outfit && s.outfit.height < 0.8 && s.anim === 'laugh')) this.every(s.name + 'kid', 3, () => this.shot('kids', v));
    }
    // benda bersuara (jam, air mancur, server, burung) & kota
    for (const o of W.objects) {
      const T = (g.typeOf && g.typeOf(o.type)) || null; const sd = T && T.snd; if (!sd) continue;
      const d2 = (o.x - tg.x) ** 2 + (o.z - tg.z) ** 2; if (d2 > 90) continue; const v = zoom / (1 + d2 * 0.05);
      if (sd === 'tick') this.every('obj' + o.id, 1, () => this.shot('tick', v)); else if (sd === 'chirp') this.every('obj' + o.id, 4, () => this.shot('chirp', v)); else if (sd === 'hum' || sd === 'fountain') this.loop('obj' + o.id, sd, 0.08 * v); else if (sd === 'sizzle' && (hr > 17 && hr < 21)) this.loop('obj' + o.id, 'sizzle', 0.05 * v);
    }
    const others = Object.values(hh.others || {});
    const cafeD = (tg.x + 18) ** 2 + (tg.z - 4) ** 2; if (cafeD < 150 && others.some((o) => o.role === 'barista' && !o.hidden)) this.loop('cafeAmb', 'cafe', 0.07 * zoom / (1 + cafeD * 0.02));
    for (const [kind, on] of Object.entries(W.carts || {})) if (on) { const V = { bakso: [-9.6, 'bakso', 5], siomay: [6.8, 'kentong', 7], sate: [-17.6, 'kentong', 9], cendol: [11.4, 'bellCart', 6] }[kind]; if (!V) continue; const d2 = (V[0] - tg.x) ** 2 + (13 - tg.z) ** 2; const v = zoom / (1 + d2 * 0.02); if (v > 0.03) this.every('cart' + kind, V[2], () => this.shot(V[1], v)); }
    const sat = others.find((o) => o.role === 'satpam' && !o.hidden); if (sat && (hr >= 20 || hr < 4) && sat.moving) { const d2 = (sat.x - tg.x) ** 2 + (sat.z - tg.z) ** 2; this.every('whistle', 14, () => this.shot('whistle', zoom / (1 + d2 * 0.02))); }
    if ((hr >= 21 || hr < 4) && Math.floor(W.time) % 60 === 0) this.every('kentHour', 30, () => this.shot('kentong', 0.25 * zoom));
    const kur = others.find((o) => o.role === 'courier' && !o.hidden); if (kur) { const d2 = (-5.4 - tg.x) ** 2 + (12.7 - tg.z) ** 2; this.loop('motorIdle', 'motorLoop', 0.05 * zoom / (1 + d2 * 0.03)); }
    // mesin cuci berputar
    for (const o of W.objects) if (o.type === 'washer' && o.s && (o.s.running || o.s.load === 'washing')) { const d = Math.hypot(o.x - tg.x, o.z - tg.z); this.loop('washer' + o.id, 'washer', 0.2 * zoom / (1 + d * d * 0.03)); }
    // ambience
    if (W.weather === 'hujan') this.loop('rain', 'rain', 0.12);
    if (hr >= 19 || hr < 5) this.loop('crickets', 'crickets', 0.02 * zoom);
    else if (hr >= 5.5 && hr < 17.5 && W.weather !== 'hujan') this.every('bird', 3.5, () => this.shot('chirp', 0.6 * zoom));
    // ramp & bersihkan loop
    const t = this.ctx.currentTime;
    for (const [key, L] of this.loops) {
      const target = L.seen ? L.want : 0;
      L.g.gain.setTargetAtTime(target, t, 0.12);
      if (!L.seen) { L.dead = (L.dead || 0) + dt; if (L.dead > 1.2) { L.nodes.forEach((n) => { try { n.stop(); } catch (e) { /* abaikan */ } }); L.g.disconnect(); this.loops.delete(key); } }
      else L.dead = 0;
    }
  }
  stopAll() { for (const L of this.loops.values()) { L.nodes.forEach((n) => { try { n.stop(); } catch (e) { /* abaikan */ } }); try { L.g.disconnect(); } catch (e) { /* abaikan */ } } this.loops.clear(); }
}
