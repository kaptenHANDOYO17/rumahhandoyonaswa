// ============================================================
//  UI / HUD — panel ala Sims, menu interaksi, mode beli, CAS
// ============================================================
import * as THREE from 'three';
import {
  NEEDS, SKILLS, SKILL_XP, CAREERS, MOODLETS, REL_LEVELS, FAMILY_LEVELS, DAY_NAMES, TYPES, BUY_CATS,
  SKIN_TONES, CLOTH_COLORS, HAIR_COLORS, HAIR_STYLES, SIM_NAMES, fmtRp,
} from './data.js';
import { FAMILY_XP, HUMANS } from './state.js';
import { PET_EMOJI, PET_LABEL, isBaby } from './pets.js';
import { SoundFX } from './sound.js';
import { Phone } from './phone.js';
import { aiAsk, aiReady } from './ai.js';
import { localReply } from './chatbrain.js';
import { Acct, cloud, logout } from './account.js';
import { NPCS as NPCS2, STAFF as STAFF2 } from './people.js';
import { openStudio, openGallery } from './studio.js';
import { openCalendar, seasonChipText } from './seasons.js';
import { openRush } from './minigame.js';
import { openEggs, konamiWatcher } from './easter.js';
import { openPhoto } from './polish.js';
import { openEmergency } from './services.js';
import { ACCESS_INFO } from './books2.js';
import { BOOKS, SHELVES, HELP_FOOTER, bookById } from './books.js';
import { STAFF, NPCS } from './people.js';
const fmtShort = (n) => { const a = Math.abs(n), sg = n < 0 ? '−' : ''; if (a >= 1e9) return `${sg}Rp ${(a / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`; if (a >= 1e6) return `${sg}Rp ${(a / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`; return fmtRp(n); };

const ICONS = {
  fridge: '🧊', stove: '🍳', counterSink: '🚰', kitchenTrash: '🗑️', diningTable: '🍽️', sofa: '🛋️', tv: '📺', armchair: '🪑', rug: '🟫',
  bookshelf: '📚', plantPot: '🪴', floorLamp: '💡', aquarium: '🐠', radio: '🔊', treadmill: '🏃', easel: '🎨', bed: '🛏️', nightstand: '🕯️',
  wardrobe: '🚪', toilet: '🚽', shower: '🚿', bathSink: '🪥', washer: '🧺', basket: '🧺', desk: '💻', plant: '🌷', veggie: '🌶️',
  clothesline: '👕', car: '🚗', mower: '🌿', mailbox: '📮', outdoorBin: '🗑️', gate: '🚧',
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (sel, root = document) => root.querySelector(sel);
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const pad = (n) => String(n).padStart(2, '0');

// ---------- suara sederhana (WebAudio) ----------
class Sfx {
  constructor() { this.on = true; this.ctx = null; }
  beep(freqs, dur = 0.09, type = 'sine', vol = 0.06) {
    if (!this.on) return;
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = this.ctx.currentTime;
      freqs.forEach((f, i) => {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t0 + i * dur); g.gain.linearRampToValueAtTime(vol, t0 + i * dur + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + (i + 1) * dur + 0.08); o.connect(g).connect(this.ctx.destination); o.start(t0 + i * dur); o.stop(t0 + (i + 1) * dur + 0.1);
      });
    } catch (e) { /* abaikan */ }
  }
  play(k) {
    const S = { click: [[660], 0.04, 'triangle', 0.03], money: [[880, 1175], 0.07], spend: [[440, 330], 0.06, 'triangle'], level: [[523, 659, 784], 0.09],
      goal: [[659, 784, 1047], 0.08], fanfare: [[523, 659, 784, 1047], 0.12, 'triangle', 0.07], bell: [[988, 740], 0.14], bad: [[330, 247], 0.1, 'sawtooth', 0.03], good: [[740, 988], 0.06] }[k];
    if (S) this.beep(...S);
  }
}

export class UI {
  constructor(root) {
    this.root = root; this.sound = new SoundFX(); window.addEventListener('pointerdown', () => this.sound.ensure(), { passive: true }); this.keepPlacing = false; this.t = 0; this.tab = 'needs';
    this.panelOpen = window.innerWidth > 760; this.buyCat = 'ruang';
    this.chatLog = [];
  }
  attach(game) {
    window.addEventListener('keydown', konamiWatcher(() => { this.g.cmd({ c: 'egg', t: 'konami' }); }));
    this.g = game; this.build(); this.refresh(); this.bindVoiceOut();
  }

  // ------------------------------------------------------------
  build() {
    const R = this.root; R.innerHTML = '';
    R.append(
      h('div', 'labels', ''),
      h('header', 'topbar', `
        <div class="clock card"><div class="clock-day" id="uDay">Senin</div><div class="clock-time" id="uTime">07:00</div><div class="clock-wx" id="uWx">☀️</div><div class="clock-season" id="uSeason" title="Buka kalender"></div></div>
        <div class="speeds card" id="uSpeeds">
          <button data-sp="0" title="Jeda (Spasi)">❚❚</button><button data-sp="1" title="Normal (1)">▶</button><button data-sp="2" title="Cepat (2)">▶▶</button><button data-sp="3" title="Super cepat (3)">▶▶▶</button>
        </div>
        <div class="fam card" id="uFam" title="Level keluarga — objektif utama"><span class="fam-l" id="uFamL">Pengantin Baru</span><div class="fam-bar"><i id="uFamBar"></i></div></div>
        <div class="spacer"></div>
        <div class="net card" id="uNet"></div>
        <div class="money card" id="uMoney">Rp 0</div>
        <button class="iconbtn card" id="uMenuBtn" title="Menu">☰</button>`),
      h('div', 'toasts', ''),
      h('aside', 'modes', `
        <button data-mode="live" class="on" title="Mode hidup">🏠<span>Hidup</span></button>
        <button data-mode="buy" title="Mode beli (B)">🛋️<span>Beli</span></button>
        <button data-mode="walls" title="Dinding (C)">🧱<span id="uWallL">Potong</span></button>
        <button data-mode="follow" title="Ikuti karakter (F)">🎯<span>Ikuti</span></button>
        <button data-mode="chat" id="uChatBtn" title="Chat">💬<span>Chat</span></button>
        <button data-mode="sos" title="Panggilan darurat" class="sos">🚨<span>Darurat</span></button>
        <button data-mode="cal" title="Kalender & musim">📅<span>Kalender</span></button>
        <button data-mode="gal" title="Galeri lukisan">🖼️<span>Galeri</span></button>
        <button data-mode="floor" title="Pindah lantai">🪜<span id="uFloorL">Lt 1</span></button>
        <button data-mode="books" title="Perpustakaan">📚<span>Buku</span></button>
        <button data-mode="staff" title="Asisten rumah tangga">🧑‍🍳<span>ART</span></button>
        <button data-mode="voice" id="uVoiceBtn" title="Obrolan suara">🎙️<span id="uVoiceL">Suara</span></button>`),
      h('section', 'panel', `
        <div class="queue" id="uQueue"></div>
        <div class="portraits" id="uPort"></div>
        <div class="pbody" id="uBody">
          <nav class="tabs" id="uTabs"></nav>
          <div class="tabc" id="uTab"></div>
        </div>`),
      h('section', 'buy hidden', `
        <nav class="bcats" id="uBCats"></nav>
        <div class="bitems" id="uBItems"></div>
        <div class="bfoot"><span id="uGhost">Pilih barang, lalu klik di rumah untuk menaruh. <b>R</b> = putar.</span>
          <label class="chk"><input type="checkbox" id="uKeep"> taruh berulang</label>
          <button class="btn sm" id="uRot">⟳ Putar</button><button class="btn sm ghost" id="uGCancel">Batal</button><button class="btn sm" id="uBDone">Selesai</button></div>`),
      h('div', 'chat hidden', `<div class="chatlog" id="uChatLog"></div><form id="uChatF"><input id="uChatIn" maxlength="120" placeholder="Ketik pesan… (tampil di atas kepala)" autocomplete="off"><button class="btn sm">Kirim</button></form>`),
      h('div', 'ctx hidden', ''),
      h('div', 'modal hidden', ''),
    );
    // event
    $('#uSpeeds', R).addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) this.g.cmd({ c: 'speed', v: +b.dataset.sp }); });
    $('.modes', R).addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return; const m = b.dataset.mode;
      if (m === 'live') this.setBuy(false); if (m === 'buy') this.setBuy(true); if (m === 'walls') this.cycleWalls();
      if (m === 'follow') { this.g.follow = !this.g.follow; if (this.g.follow) this.g.focusSim(this.g.active); this.refresh(); }
      if (m === 'voice') this.voiceToggle();
      if (m === 'floor') { this.g.followLvl = false; this.g.setView(this.g.viewLvl ? 0 : 1); this.refresh(); }
      if (m === 'books') this.openLibrary(null);
      if (m === 'sos') openEmergency(this);
      if (m === 'cal') openCalendar(this);
      if (m === 'gal') openGallery(this);
      if (m === 'staff') this.openStaff();
      if (m === 'chat') { $('.chat', R).classList.toggle('hidden'); $('#uChatBtn').classList.remove('ping'); if (!$('.chat', R).classList.contains('hidden')) $('#uChatIn').focus(); }
    });
    $('#uTabs', R).addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { this.tab = b.dataset.tab; this.panelOpen = true; this.refresh(); } });
    $('#uMenuBtn', R).addEventListener('click', () => this.openMenu());
    $('#uChatF', R).addEventListener('submit', (e) => { e.preventDefault(); const v = $('#uChatIn').value.trim(); if (v) this.g.cmd({ c: 'say', text: v }); $('#uChatIn').value = ''; });
    $('#uKeep', R).addEventListener('change', (e) => { this.keepPlacing = e.target.checked; });
    $('#uRot', R).addEventListener('click', () => this.g.rotateGhost());
    $('#uGCancel', R).addEventListener('click', () => this.g.cancelGhost());
    $('#uBDone', R).addEventListener('click', () => this.setBuy(false));
    $('#uQueue', R).addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (b) this.g.cmd({ c: 'cancel', id: +b.dataset.q }); });
    $('#uPort', R).addEventListener('click', (e) => {
      const b = e.target.closest('[data-sim]'); if (!b) return;
      if (e.target.closest('.auto')) { const s = this.g.hh.sims[b.dataset.sim]; this.g.cmd({ c: 'auto', sim: b.dataset.sim, v: !s.autonomy }); return; }
      if (e.target.closest('.fold')) { this.panelOpen = !this.panelOpen; this.refresh(); return; }
      if (this.g.ctrl(b.dataset.sim)) { if (this.g.active === b.dataset.sim) this.g.focusSim(b.dataset.sim); else this.g.switchSim(b.dataset.sim); }
      else this.g.focusSim(b.dataset.sim);
    });
    // label di atas kepala
    this.labels = {};
    for (const n of []) { const el = h('div', 'lbl', `<div class="say"></div><div class="bub"></div><div class="nm">${n}</div>`); $('.labels', R).append(el); this.labels[n] = el; }
    this.buildBuyCats();
  }

  // ------------------------------------------------------------
  frame(dt) {
    this.t += dt;
    this.updateLabels();
    if (this.t > 0.25) { this.t = 0; this.refresh(); if (!this.phone) this.phone = new Phone(this); this.phone.tick(); }
  }
  updateLabels() {
    const g = this.g, cam = g.camera, rect = g.renderer.domElement.getBoundingClientRect(); const v = new THREE.Vector3();
    for (const s of g.actors()) {
      const n = s.name, M = g.models[n]; if (!M) continue; const R = M.root;
      let el = this.labels[n];
      if (!el) { el = h('div', 'lbl' + (s.species === 'npc' || s.species === 'staff' ? ' npc' : ''), `<div class="say"></div><div class="bub"></div><div class="nm">${esc(n)}</div>`); $('.labels', this.root).append(el); this.labels[n] = el; }
      const inside = s.x > -8 && s.x < 8 && s.z > -6 && s.z < 6;
      if (s.hidden || !R.visible || ((s.lvl || 0) !== g.viewLvl && inside)) { el.style.display = 'none'; continue; }
      v.set(R.position.x, R.position.y + (M.labelH ? M.labelH + 0.15 : 2.25 * (s.outfit.height || 1) + (s.y > 0.3 ? -0.4 : 0)), R.position.z).project(cam);
      el.classList.toggle('talk', !!(this.voice && ((n === this.voice.meName && this.voice.meLvl > 0.04) || (n === this.voice.peerName && this.voice.peerLvl > 0.04))));
      if (v.z > 1) { el.style.display = 'none'; continue; }
      el.style.display = ''; el.style.transform = `translate(${(v.x * 0.5 + 0.5) * rect.width}px, ${(-v.y * 0.5 + 0.5) * rect.height}px)`;
      // gelembung ikon / pikiran
      let bub = s.icon;
      if (!bub) { const low = NEEDS.filter((d) => s.needs[d.id] < 22).sort((a, b) => s.needs[a.id] - s.needs[b.id])[0]; if (low) bub = low.icon; }
      const bEl = el.children[1]; if (bEl.dataset.v !== (bub || '')) { bEl.dataset.v = bub || ''; bEl.textContent = bub || ''; bEl.style.display = bub ? '' : 'none'; }
      const sEl = el.children[0]; const say = s.say && s.say.until > Date.now() ? s.say.text : '';
      if (sEl.dataset.v !== say) { sEl.dataset.v = say; sEl.textContent = say; sEl.style.display = say ? '' : 'none'; }
      el.classList.toggle('me', n === g.active);
    }
  }

  // ------------------------------------------------------------
  refresh() {
    const g = this.g, hh = g.hh, W = hh.world, R = this.root;
    const day = Math.floor(W.time / 1440), mins = Math.floor(W.time % 1440);
    $('#uDay').textContent = `${DAY_NAMES[day % 7]} · Hari ${day + 1}`;
    { const el = $('#uSeason'); if (el) { el.textContent = seasonChipText(W); if (!el._b) { el._b = true; el.onclick = () => openCalendar(this); } } }
    $('#uTime').textContent = `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
    $('#uWx').textContent = (W.weather === 'hujan' ? '🌧️' : (mins < 360 || mins > 1080) ? '🌙' : '☀️') + (W.house.power ? '' : ' 🕯️');
    for (const b of R.querySelectorAll('#uSpeeds button')) b.classList.toggle('on', +b.dataset.sp === W.speed);
    $('#uSpeeds').classList.toggle('ultra', !!W.ultra);
    const fl = hh.famLevel(); const lo = FAMILY_XP[fl], hi = FAMILY_XP[fl + 1];
    $('#uFamL').textContent = `Lv ${fl + 1} · ${FAMILY_LEVELS[fl]}`;
    $('#uFamBar').style.width = (hi ? Math.min(100, ((W.fam - lo) / (hi - lo)) * 100) : 100) + '%';
    const act = hh.sims[g.active];
    const payer = act.isPet ? null : act;
    $('#uMoney').innerHTML = payer ? `<small>${payer.name}</small>${fmtShort(payer.wallet)}` : `<small>Keluarga</small>${fmtShort(W.money)}`;
    $('#uMoney').title = HUMANS.map((n) => `${n}: ${fmtRp(hh.sims[n].wallet)}`).join('\n');
    const vb = $('#uVoiceBtn'); vb.style.display = g.mode === 'solo' ? 'none' : '';
    vb.classList.toggle('on', !!(this.voice && this.voice.on && !this.voice.muted)); vb.classList.toggle('muted', !!(this.voice && this.voice.muted));
    $('#uVoiceL').textContent = !this.voice || !this.voice.on ? 'Suara' : this.voice.muted ? 'Bisu' : 'Aktif';
    const tabs = act.isPet ? [['needs', 'Kebutuhan'], ['mood', 'Suasana'], ['bond', 'Ikatan']] : [['needs', 'Kebutuhan'], ['mood', 'Suasana'], ['skills', 'Keahlian'], ['career', 'Karier'], ['rel', 'Hubungan'], ['goals', 'Tujuan'], ['money', 'Keuangan']];
    if (!tabs.find((t) => t[0] === this.tab)) this.tab = 'needs';
    const th = tabs.map(([k, l]) => `<button data-tab="${k}">${l}</button>`).join(''); if (this._tabsH !== th) { this._tabsH = th; $('#uTabs').innerHTML = th; }
    const net = $('#uNet');
    if (g.mode === 'solo') net.style.display = 'none';
    else { net.style.display = ''; const on = g.mode === 'guest' ? true : g.peerOnline; net.innerHTML = `<i class="dot ${on ? 'on' : ''}"></i>${g.mode === 'host' ? `Room <b>${esc(g.roomCode || '')}</b>` : 'Terhubung'} · ${on ? 'Berdua' : 'Menunggu pasangan…'}`; }
    const wl = { cut: 'Potong', down: 'Rendah', up: 'Penuh', roof: 'Atap' }[g.wallMode]; $('#uWallL').textContent = wl; $('#uFloorL').textContent = g.viewLvl ? 'Lt 2' : 'Lt 1';
    for (const b of R.querySelectorAll('.modes button')) {
      const m = b.dataset.mode; b.classList.toggle('on', (m === 'live' && !g.buy) || (m === 'buy' && !!g.buy) || (m === 'follow' && g.follow));
    }
    this.renderPortraits(); this.renderQueue();
    $('.panel', R).classList.toggle('folded', !this.panelOpen);
    for (const b of R.querySelectorAll('#uTabs button')) b.classList.toggle('on', b.dataset.tab === this.tab);
    if (this.panelOpen) this.renderTab();
    if (g.buy) this.renderBuyItems();
  }
  renderPortraits() {
    const g = this.g; let html = '';
    for (const n of HUMANS) {
      const s = g.hh.sims[n]; const ml = s.moodLevel(); const mine = g.mySims.includes(n);
      const who = g.mode === 'solo' ? '' : (mine ? 'Kamu' : 'Pasangan');
      const act = s.hidden ? 'Di kantor 🏢' : (s.queue[0] ? (s.queue[0].step || s.queue[0].label) : (s.engagedBy ? `Diajak ${s.engagedBy}` : 'Santai'));
      html += `<div class="port ${n === g.active ? 'act' : ''} ${mine ? '' : 'other'}" data-sim="${n}" style="--mc:${ml.color}">
        <div class="gem"></div>
        <div class="pinfo"><div class="pname">${n}${who ? `<em>${who}</em>` : ''}</div><div class="pmood">${ml.label}</div><div class="pact">${esc(act)}</div></div>
        ${mine ? `<button class="auto ${s.autonomy ? 'on' : ''}" title="Kehendak bebas">${s.autonomy ? '🤖 Auto' : '✋ Manual'}</button>` : ''}
        ${n === g.active ? `<button class="fold" title="Buka/tutup panel">${this.panelOpen ? '▾' : '▴'}</button>` : ''}
      </div>`;
    }
    html += '<div class="pets">' + Object.keys(g.hh.sims).filter((n) => g.hh.sims[n].isPet).map((n) => { const s = g.hh.sims[n]; const ml = s.moodLevel(); const tag = (isBaby(g.hh, s) ? '🍼' : '') + (s.pregUntil ? '🤰' : '') + (s.sex === 'f' ? '♀' : s.sex === 'm' ? '♂' : '');
      const act = s.queue[0] ? (s.queue[0].step || s.queue[0].label) : (s.engagedBy ? `sama ${s.engagedBy}` : 'Santai');
      return `<div class="pchip ${n === g.active ? 'act' : ''}" data-sim="${n}" style="--mc:${ml.color}"><span class="pe">${PET_EMOJI[s.species]}</span><div><b>${n} <i class="tag">${tag}</i></b><small>${esc(act)}</small></div>${n === g.active ? `<button class="auto ${s.autonomy ? 'on' : ''}" title="Kehendak bebas">${s.autonomy ? '🤖' : '✋'}</button><button class="fold">${this.panelOpen ? '▾' : '▴'}</button>` : ''}</div>`; }).join('') + '</div>';
    if (this._pH !== html) { this._pH = html; $('#uPort').innerHTML = html; }
  }
  renderQueue() {
    const s = this.g.hh.sims[this.g.active];
    const html = s.queue.map((q, i) => `<button class="qi ${i === 0 && q.started ? 'cur' : ''}" data-q="${q.id}" title="${esc(q.label)} — klik untuk batal"><span>${q.icon || '•'}</span>${i === 0 ? `<em>${esc(q.step || q.label)}</em>` : ''}<b>✕</b></button>`).join('');
    if (this._qH !== html) { this._qH = html; $('#uQueue').innerHTML = html; }
  }
  renderTab() {
    const g = this.g, hh = g.hh, W = hh.world, s = hh.sims[g.active]; let html = '';
    const bar = (v, col) => `<div class="bar"><i style="width:${v}%;background:${col || (v > 60 ? 'var(--green)' : v > 30 ? 'var(--sun)' : 'var(--red)')}"></i></div>`;
    switch (this.tab) {
      case 'needs':
        html = `<div class="needs">${NEEDS.filter((d) => d.id !== 'energy' || s.isPet || (W.opt && W.opt.energy)).map((d) => `<div class="need"><span>${d.icon} ${d.label}</span>${bar(Math.round(s.needs[d.id]))}</div>`).join('')}</div>`; break;
      case 'mood': {
        const ms = s.activeMoodlets().sort((a, b) => Math.abs(b.val) - Math.abs(a.val)); const ml = s.moodLevel();
        html = `<div class="moodhead" style="--mc:${ml.color}"><div class="gem big"></div><b>${ml.label}</b><span>skor ${s.moodValue()}</span></div>
          <div class="moodlets">${ms.length ? ms.map((m) => `<div class="ml ${m.val >= 0 ? 'pos' : 'neg'}"><span class="e">${m.emoji}</span><span class="l">${m.label}${m.left ? `<small>${Math.ceil(m.left / 60)} jam lagi</small>` : ''}</span><b>${m.val > 0 ? '+' : ''}${m.val}</b></div>`).join('') : '<p class="muted">Belum ada emosi khusus.</p>'}</div>`; break; }
      case 'skills':
        html = `<div class="skills">${SKILLS.map((k) => { const xp = s.skills[k.id] || 0, l = s.skillLvl(k.id); const p = l >= 10 ? 100 : ((xp % SKILL_XP) / SKILL_XP) * 100;
          return `<div class="sk"><span>${k.icon} ${k.label}</span><div class="pips">${Array.from({ length: 10 }, (_, i) => `<i class="${i < l ? 'f' : ''}"></i>`).join('')}</div><div class="bar thin"><i style="width:${p}%;background:var(--blue)"></i></div></div>`; }).join('')}</div>`; break;
      case 'career': {
        const C = CAREERS[g.active], c = s.prof.career, [title, pay] = C.levels[c.level]; const day = Math.floor(W.time / 1440);
        const next = C.levels[c.level + 1];
        const status = day % 7 >= 5 ? 'Akhir pekan — libur' : c.workedDay === day ? 'Sudah kerja hari ini ✔' : 'Berangkat jam 06.00–11.59 lewat mobil atau pagar (ojol)';
        html = `<div class="career"><div class="ctitle">${C.name}</div><h3>${title}</h3><p>Gaji ${fmtRp(pay)}/hari kerja (Senin–Jumat, 6 jam)</p>
          <div class="need"><span>Kinerja</span>${bar(c.perf, 'var(--blue)')}</div>
          <p class="muted">${next ? `Berikutnya: <b>${next[0]}</b> (${fmtRp(next[1])})` : 'Puncak karier tercapai! 🏆'}</p><p class="muted">${status}</p>
          <p class="muted small">Kinerja naik kalau berangkat dengan mood bagus & skill ${g.active === 'Handoyo' ? 'Karisma/Logika' : 'Kreativitas/Logika'} tinggi.</p></div>`; break; }
      case 'rel': {
        const rl = hh.relLevel(); const v = W.rel;
        html = `<div class="rel"><div class="relrow"><b>Handoyo</b><span>💞</span><b>Naswa</b></div>
          <div class="relbar"><i style="left:${(v + 100) / 2}%"></i></div><div class="rellab"><span>Renggang</span><b>${rl.label} (${Math.round(v)})</b><span>Sehati</span></div>
          <p class="muted">Klik pasangan untuk berinteraksi. Interaksi romantis terbuka seiring hubungan membaik; kalau mood pasangan jelek bisa ditolak.</p>
          <div class="nb"><div class="ctitle">Tetangga & ART</div>${Object.keys({ ...NPCS, ...STAFF }).map((k) => `<div class="finrow"><span>${k} <small class="muted">${esc((NPCS[k] || STAFF[k]).trait || STAFF[k].role)}</small></span><b>${Math.round((W.nrel || {})[k] || 0)}</b></div>`).join('')}
          ${W.loan ? `<p class="small">🧾 Bang Jefri berutang ${fmtRp(W.loan.amount)} ke ${W.loan.lender}, bunga ${Math.round(W.loan.rate * 100)}%, jatuh tempo hari ke-${W.loan.due + 1}.</p>` : ''}</div>
          <div class="unlocks">${REL_LEVELS.slice().reverse().map((l) => `<span class="${v >= l.min ? 'on' : ''}">${l.label}</span>`).join('')}</div></div>`; break; }
      case 'goals': {
        const fl = hh.famLevel();
        html = `<div class="goals">${s.goals.map((x) => `<div class="goal ${x.done ? 'done' : ''}"><i>${x.done ? '✔' : '◇'}</i><span>${x.label}</span><b>${Math.min(x.prog, x.need)}/${x.need}</b></div>`).join('')}
          <p class="muted small">Tujuan baru tiap tengah malam. Tiap tujuan +25 poin keluarga, semua selesai +Rp 100.000.</p>
          <div class="fambox"><b>Objektif utama:</b> rawat rumah & jadi <em>${FAMILY_LEVELS[5]}</em>.<br>Sekarang: Lv ${fl + 1} ${FAMILY_LEVELS[fl]} · ${W.fam}${FAMILY_XP[fl + 1] ? ' / ' + FAMILY_XP[fl + 1] : ''} poin</div></div>`; break; }
      case 'bond': {
        const info = `${s.sex === 'f' ? '♀ Betina' : '♂ Jantan'} · ${isBaby(hh, s) ? 'Bayi 🍼 (ibu: ' + (s.mom || '-') + ')' : 'Dewasa'}${s.pregUntil ? ' · 🤰 hamil, lahiran ±' + Math.max(1, Math.ceil((s.pregUntil - W.time) / 60)) + ' jam lagi' : ''}`;
        const bar2 = (v) => `<div class="relbar"><i style="left:${(v + 100) / 2}%"></i></div>`;
        html = `<div class="rel"><div class="ctitle">${PET_LABEL[s.species]} · ${g.active}</div><p class="small">${info}</p>
          ${HUMANS.map((n) => `<div class="need"><span>💗 Ikatan dengan ${n} (${Math.round(s.bond[n] || 0)})</span>${bar2(s.bond[n] || 0)}</div>`).join('')}
          <div class="need"><span>🤝 Persahabatan Oyen & Kapi (${Math.round(W.petBond || 0)})</span>${bar2(W.petBond || 0)}</div>
          <p class="muted small">${s.species === 'cat' ? 'Klik benda: tiang garukan, akuarium, sofa, kasur, kotak pasir. Klik Kapi untuk naik ke punggungnya! Klik dirimu untuk zoomies, jilat bulu, atau jatuhkan gelas 😼' : 'Klik kolam untuk berendam, kebun untuk nyemil, rumah capybara untuk tidur. Klik dirimu untuk chill pakai jeruk di kepala 🍊'}</p></div>`; break; }
      case 'money': {
        const H = W.house;
        html = `<div class="fin">${HUMANS.map((n) => `<div class="finrow"><span>Dompet ${n}</span><b>${fmtRp(hh.sims[n].wallet)}</b></div>`).join('')}
          <div class="finrow"><span>Total keluarga</span><b>${fmtRp(W.money)}</b></div>
          <div class="give"><span>Kirim ke ${g.active === 'Handoyo' ? 'Naswa' : 'Handoyo'}:</span>${[1e6, 1e8, 1e9].map((v) => `<button class="chipb" data-give="${v}">${fmtShort(v)}</button>`).join('')}</div>
          <div class="finrow"><span>Tagihan</span><b class="${H.bills ? 'red' : ''}">${H.bills ? fmtRp(H.bills) + (H.billDue ? ` · jatuh tempo hari ${Math.floor(H.billDue / 1440) + 1}` : '') : 'Lunas'}</b></div>
          <div class="finrow"><span>Stok dapur</span><b>${H.stock} porsi</b></div>
          <div class="log">${W.log.map((l) => `<div><span>${esc(l.why)}</span><b class="${l.d >= 0 ? 'grn' : 'red'}">${l.d === 0 ? '💸' : (l.d > 0 ? '+' : '−') + fmtShort(Math.abs(l.d))}</b></div>`).join('') || '<p class="muted">Belum ada transaksi.</p>'}</div></div>`; break; }
    }
    const key = this.tab + html;
    if (this._tH !== key) { this._tH = key; $('#uTab').innerHTML = html; const gv = $('#uTab').querySelector('.give'); if (gv) gv.onclick = (e) => { const b = e.target.closest('[data-give]'); if (b) this.g.cmd({ c: 'give', amount: +b.dataset.give }); }; }
  }

  // ------------------------------------------------------------
  toast(m, type = 'info', big = false) {
    const box = $('.toasts', this.root);
    const el = h('div', `toast ${type} ${big ? 'big' : ''}`, esc(m)); box.prepend(el);
    while (box.children.length > 5) box.lastChild.remove();
    setTimeout(() => el.classList.add('out'), big ? 6500 : 4200); setTimeout(() => el.remove(), big ? 7000 : 4700);
    if (type === 'bad') this.sfx('bad'); else if (big) this.sfx('good');
  }
  money(d) {
    const el = h('div', `fly ${d >= 0 ? 'up' : 'down'}`, `${d >= 0 ? '+' : '−'}${fmtRp(Math.abs(d))}`);
    const r = $('#uMoney').getBoundingClientRect(); el.style.left = r.left + 'px'; el.style.top = r.bottom + 4 + 'px';
    document.body.append(el); setTimeout(() => el.remove(), 1600);
  }
  sfx(k) { this.sound.play(k); }
  saved() { const t = Date.now(); if (t - (this._svT || 0) > 50000) { this._svT = t; this.toast(`Permainan tersimpan 💾${this.g.cloudState ? ' · ☁️ ' + this.g.cloudState : ''}`, 'info'); } }
  chat(name, text) {
    this.chatLog.push({ name, text }); if (this.chatLog.length > 40) this.chatLog.shift();
    $('#uChatLog').innerHTML = this.chatLog.map((c) => `<div><b class="${c.name}">${esc(c.name)}</b> ${esc(c.text)}</div>`).join('');
    $('#uChatLog').scrollTop = 1e6;
    if ($('.chat', this.root).classList.contains('hidden')) $('#uChatBtn').classList.add('ping');
  }
  ping(x, y) { const el = h('div', 'pingfx'); el.style.left = x + 'px'; el.style.top = y + 'px'; document.body.append(el); setTimeout(() => el.remove(), 600); }

  // ---------- menu kontekstual ----------
  showMenu(items, x, y, title) {
    const m = $('.ctx', this.root);
    if (!items.length) { m.innerHTML = `<div class="ctitle">${esc(title)}</div><div class="cnone">Tidak ada yang bisa dilakukan sekarang</div>`; }
    else m.innerHTML = `<div class="ctitle">${esc(title)}</div>` + items.map((it, i) => `<button data-i="${i}" ${it.disabled ? 'disabled' : ''} class="${it.romantic ? 'rom' : ''}"><span>${it.icon}</span><b>${esc(it.label)}</b>${it.disabled ? `<small>${esc(it.disabled)}</small>` : ''}</button>`).join('');
    m.classList.remove('hidden');
    const w = m.offsetWidth, hh = m.offsetHeight;
    m.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x + 12)) + 'px';
    m.style.top = Math.max(60, Math.min(window.innerHeight - hh - 8, y - 20)) + 'px';
    m.onclick = (e) => { const b = e.target.closest('button[data-i]'); if (!b) return; const it = items[+b.dataset.i]; if (it.ui === 'rush') { this.closeMenu(); openRush(this); return; } if (it.ui === 'gallery') { this.closeMenu(); openGallery(this); return; } if (it.ui === 'aichat') { this.closeMenu(); this.openAIChat(it.cmd.name); return; } if (it.ui === 'library') { this.closeMenu(); this.openLibrary(it.cmd); return; } if (it.ui === 'studio') { this.closeMenu(); openStudio(this, it.cmd); return; } this.g.cmd({ ...it.cmd }); this.closeMenu(); };
  }
  closeMenu() { const m = $('.ctx', this.root); if (m) m.classList.add('hidden'); }
  showObjTools(o, x, y) {
    const T = TYPES[o.type]; const m = $('.ctx', this.root);
    if (T.fixed) { this.showMenu([], x, y, `${T.name} (tidak bisa dipindah)`); return; }
    const back = Math.round(T.price * 0.7 / 1000) * 1000;
    m.innerHTML = `<div class="ctitle">${ICONS[o.type] || ''} ${esc(T.name)}</div>
      <button data-a="move"><span>✥</span><b>Pindahkan / putar</b></button>
      <button data-a="sell"><span>💰</span><b>Jual (${fmtRp(back)})</b></button>`;
    m.classList.remove('hidden'); m.style.left = Math.min(window.innerWidth - 240, x + 12) + 'px'; m.style.top = Math.max(60, y - 20) + 'px';
    m.onclick = (e) => { const b = e.target.closest('button[data-a]'); if (!b) return; this.closeMenu();
      if (b.dataset.a === 'move') this.g.startGhost(o.type, o.id); else this.g.cmd({ c: 'sell', id: o.id }); };
  }

  // ---------- mode beli ----------
  toggleBuy() { this.setBuy(!this.g.buy); }
  setBuy(on) {
    if (on && !this.g.buy) { this.g.enterBuy(); this.closeMenu(); }
    if (!on && this.g.buy) this.g.exitBuy();
    $('.buy', this.root).classList.toggle('hidden', !on); $('.panel', this.root).classList.toggle('hidden', on);
    this.refresh();
  }
  buildBuyCats() {
    $('#uBCats').innerHTML = BUY_CATS.map((c) => `<button data-c="${c.id}">${c.label}</button>`).join('') + '<button data-c="gudang">📦 Gudang</button>';
    $('#uBCats').onclick = (e) => { const b = e.target.closest('button'); if (b) { this.buyCat = b.dataset.c; this._bH = null; this.renderBuyItems(); } };
    $('#uBItems').onclick = (e) => { const b = e.target.closest('[data-t]'); if (b && !b.disabled) { this.g.startGhost(b.dataset.t); if (b.dataset.inv && this.g.buy && this.g.buy.ghost) this.g.buy.ghost.inv = true; } };
  }
  renderBuyItems() {
    const money = this.g.hh.world.money;
    for (const b of document.querySelectorAll('#uBCats button')) b.classList.toggle('on', b.dataset.c === this.buyCat);
    const inv = this.g.hh.world.inventory || {};
    if (this.buyCat === 'gudang') { const h2 = Object.entries(inv).filter(([, n]) => n > 0).map(([k, n]) => `<button class="item" data-t="${k}" data-inv="1"><span class="ico">${ICONS[k] || TYPES[k].icon || '📦'}</span><b>${TYPES[k].name}</b><em>${n} unit · gratis (sudah dibeli online)</em></button>`).join('') || '<p class="muted small">Gudang kosong. Belanja furnitur lewat HP › Belanja, lalu buka paketnya.</p>'; if (this._bH !== h2) { this._bH = h2; $('#uBItems').innerHTML = h2; } return; }
    const html = Object.entries(TYPES).filter(([, T]) => T.cat === this.buyCat && !T.fixed).map(([k, T]) => `<button class="item ${money < T.price ? 'poor' : ''}" data-t="${k}"><span class="ico">${ICONS[k] || T.icon || '📦'}</span><b>${T.name}</b><em>${fmtRp(T.price)}</em></button>`).join('');
    if (this._bH !== html) { this._bH = html; $('#uBItems').innerHTML = html; }
  }
  buyGhostChanged() { const gh = this.g.buy && this.g.buy.ghost; $('#uGhost').innerHTML = gh ? `${ICONS[gh.type] || ''} <b>${TYPES[gh.type].name}</b> — klik lantai untuk menaruh, <b>R</b>/⟳ untuk memutar` : 'Pilih barang, atau klik benda di rumah untuk dipindah / dijual.'; }
  ghostStatus(gh) { const el = $('#uGhost'); el.classList.toggle('bad', !gh.ok); if (!gh.ok) el.innerHTML = `⚠️ ${esc(gh.why)}`; else this.buyGhostChanged(); }

  // ---------- dinding ----------
  cycleWalls() { const order = ['cut', 'down', 'up', 'roof']; const i = order.indexOf(this.g.wallMode); this.g.setWallMode(order[(i + 1) % 4]); this.refresh(); }

  // ---------- pengaturan kenyamanan bermain ----------
  openOptions() {
    const g = this.g; const O = { energy: false, decayMul: 0.5, dayMul: 2, ...(g.hh.world.opt || {}) };
    const jam = (d) => `${Math.round(24 * 60 / (60 / d))}`;
    const m = this.modal(`<h2>⚙️ Kenyamanan Main</h2>
      <p class="muted small">Atur seberapa santai permainannya. Berlaku untuk Handoyo & Naswa (hewan tetap seperti biasa).</p>
      <div class="optRow"><b>⚡ Kebutuhan energi</b><small>Kalau dimatikan, karakter tidak pernah capek atau pingsan, dan bar energi disembunyikan. Tidur tetap bisa dilakukan untuk suasana.</small>
        <div class="row"><button class="btn sm ${O.energy ? 'ghost' : ''}" data-e="0">Dimatikan (santai)</button><button class="btn sm ${O.energy ? '' : 'ghost'}" data-e="1">Aktif (klasik)</button></div></div>
      <div class="optRow"><b>🍛 Kecepatan kebutuhan lain</b><small>Lapar, kebersihan, kamar kecil, sosial, hiburan. Makin kecil makin tahan lama.</small>
        <div class="row">${[[1, '100% · normal'], [0.7, '70%'], [0.5, '50% · tahan lama'], [0.3, '30% · sangat tahan'], [0.15, '15% · nyaris tidak turun']].map(([v, t]) => `<button class="btn sm ${O.decayMul === v ? '' : 'ghost'}" data-d="${v}">${t}</button>`).join('')}</div></div>
      <div class="optRow"><b>⏳ Panjang hari</b><small>Memperlambat jalannya jam supaya tugas harian tidak terburu-buru. 2× berarti satu hari game terasa dua kali lebih lama.</small>
        <div class="row">${[[1, '1× normal'], [1.5, '1,5×'], [2, '2× santai'], [3, '3×'], [4, '4× sangat lambat']].map(([v, t]) => `<button class="btn sm ${O.dayMul === v ? '' : 'ghost'}" data-t="${v}">${t}</button>`).join('')}</div></div>
      <p class="muted small" id="optNow"></p>
      <div class="mbtns row"><button class="btn ghost" data-close>Tutup</button></div>`, 'wide');
    const info = () => { const o = g.hh.world.opt || O; const menitPerDetik = 1 / (o.dayMul || 1); m.querySelector('#optNow').textContent = `Sekarang: energi ${o.energy ? 'aktif' : 'dimatikan'} · kebutuhan ${Math.round((o.decayMul ?? 1) * 100)}% · 1 detik nyata = ${menitPerDetik.toFixed(2)} menit game pada kecepatan normal (1 hari ≈ ${Math.round(1440 / menitPerDetik / 60)} menit nyata).`; };
    info();
    m.onclick = (e) => {
      const b = e.target.closest('[data-e],[data-d],[data-t]'); if (!b) return;
      const opt = b.dataset.e != null ? { energy: b.dataset.e === '1' } : b.dataset.d != null ? { decayMul: +b.dataset.d } : { dayMul: +b.dataset.t };
      g.cmd({ c: 'opt', opt }); setTimeout(() => this.openOptions(), 200);
    };
  }

  // ---------- ngobrol bebas dengan AI Gemma (semua karakter) ----------
  persona(name) {
    const g = this.g, hh = g.hh, s = hh.actorByName(name); const d = NPCS2[name] || STAFF2[name] || {};
    const hour = Math.floor((hh.world.time % 1440) / 60), day = Math.floor(hh.world.time / 1440) + 1;
    if (s && s.isPet) return `Kamu adalah ${name}, ${s.species === 'cat' ? 'kucing' : 'capybara'} ${s.sex === 'f' ? 'betina' : 'jantan'} peliharaan Handoyo & Naswa. Jawab seperti hewan: suara khas (${s.species === 'cat' ? 'meong' : 'cicit'}) lalu terjemahan pikiranmu dalam kurung, lucu & polos.`;
    if (s && s.species === 'human') { const low = Object.entries(s.needs).filter(([, v]) => v < 35).map(([k]) => k).join(', '); const job = name === 'Handoyo' ? 'programmer (software engineer)' : 'pelukis yang menjual karyanya online'; return `Kamu adalah ${name}, ${name === 'Handoyo' ? 'suami' : 'istri'} di rumah Griya Asri, pekerjaanmu ${job}. Suasana hatimu: ${s.moodLevel ? s.moodLevel().label : 'biasa'}. ${low ? 'Kamu sedang merasa kurang: ' + low + '.' : ''} Hubungan dengan pasangan hangat dan romantis.`; }
    const rel = hh.world.nrel ? Math.round(hh.world.nrel[name] || 30) : 30;
    return `Kamu adalah ${name}, warga Perumahan Griya Asri. Sifat/peran: ${d.trait || d.role || 'warga'}${d.fam ? ', keluarga ' + d.fam : ''}${d.relation ? ', ' + d.relation : ''}. Keakraban dengan keluarga Handoyo-Naswa: ${rel}/100. Sekarang hari ke-${day}, jam ${hour}.`;
  }
  openAIChat(name) {
    const me = this.g.active; const mem = (this.aiMem = this.aiMem || {}); const log = (mem[name] = mem[name] || []);
    const render = () => { const L = $('.aichat .log', this.root); if (!L) return; L.innerHTML = log.map((x) => `<div class="${x.me ? 'me' : 'them'}">${esc(x.text)}</div>`).join('') || `<p class="muted small">Mulai ngobrol dengan ${esc(name)}. ${aiReady() ? '🤖 Dijawab AI Gemma sesuai karakternya.' : 'ℹ️ AI Gemma belum aktif (atur di HP → AI Gemma), jadi jawabannya dialog bawaan.'}</p>`; L.scrollTop = 1e6; };
    const m = this.modal(`<div class="aichat"><h2>💬 ${esc(me)} ↔ ${esc(name)}</h2><div class="aiStat">${aiReady() ? '🤖 Dijawab AI (mengikuti karakter & keadaan game)' : '💬 Mode tanpa AI — jawaban dari otak bawaan game. Aktifkan AI lewat PANDUAN-SETUP.md agar obrolan lebih bebas.'}</div><div class="log"></div><form><input maxlength="200" placeholder="Tulis pesan…" autocomplete="off"><button class="btn">Kirim</button></form><div class="mbtns row"><button class="btn ghost sm" data-close>Tutup</button></div></div>`);
    render();
    m.querySelector('form').onsubmit = async (e) => {
      e.preventDefault(); const inp = m.querySelector('input'); const text = inp.value.trim(); if (!text) return; inp.value = '';
      log.push({ me: true, text }); render(); this.g.cmd({ c: 'say', text });
      const hist = log.slice(-10).map((x) => `${x.me ? me : name}: ${x.text}`).join('\n');
      const W = this.g.hh.world; const konteks = `Konteks: hari ke-${Math.floor(W.time / 1440) + 1}, jam ${String(Math.floor((W.time % 1440) / 60)).padStart(2, '0')}.${String(Math.floor(W.time % 60)).padStart(2, '0')}, cuaca ${W.weather}, ${W.lastSeason ? 'musim ' + W.lastSeason : ''}.`;
      const prompt = `${this.persona(name)}\n${konteks}\nKamu sedang mengobrol tatap muka dengan ${me}.\nRiwayat percakapan (paling bawah paling baru):\n${hist}\n\nTUGAS: jawab pesan terakhir dari ${me} yaitu "${text}" secara LANGSUNG dan NYAMBUNG. Kalau itu pertanyaan, jawab pertanyaannya dulu baru tambahkan satu kalimat obrolan. Maksimal 3 kalimat, bahasa Indonesia santai, tetap dalam karakter ${name}. Jangan menulis namamu di depan jawaban, jangan mengulang pertanyaannya.`;
      const typing = { me: false, text: '…' }; log.push(typing); render();
      let reply = await aiAsk(prompt, 200).catch(() => null);
      if (!reply) reply = localReply(this.g.hh, name, text);
      typing.text = reply; render(); this.g.cmd({ c: 'npcSay', name, text: reply });
      if (log.length > 30) log.splice(0, log.length - 30);
    };
    setTimeout(() => m.querySelector('input').focus(), 50);
  }

  // ---------- perpustakaan ----------
  openLibrary(cmd, shelf = 'krim') {
    const list = BOOKS.filter((b) => b.shelf === shelf);
    const m = this.modal(`<h2>📚 Perpustakaan Lantai 2</h2>
      <p class="muted small">${BOOKS.length} buku bisa dibaca. ${cmd ? `Pilih buku — ${esc(this.g.active)} akan duduk membacanya.` : 'Baca langsung di sini, atau suruh karakter baca lewat rak buku di lantai 2.'}</p>
      <details class="access"><summary>📱 Cara membaca versi lengkap secara legal</summary>${ACCESS_INFO.map((t) => `<p class="small">${esc(t)}</p>`).join('')}</details>
      <nav class="shelves">${SHELVES.map((sh) => `<button data-sh="${sh.id}" class="${sh.id === shelf ? 'on' : ''}" style="--bc:${sh.color}">${sh.label}</button>`).join('')}</nav>
      <div class="booklist">${list.map((b) => `<button class="book" data-b="${b.id}" style="--bc:${SHELVES.find((x) => x.id === b.shelf).color}"><i></i><span><b>${esc(b.title)}</b><small>${esc(b.author)} · ${b.pages.length} hlm</small></span></button>`).join('')}</div>
      <div class="mbtns row"><button class="btn ghost" data-close>Tutup</button></div>`, 'wide');
    m.querySelector('.shelves').onclick = (e) => { const b = e.target.closest('[data-sh]'); if (b) this.openLibrary(cmd, b.dataset.sh); };
    m.querySelector('.booklist').onclick = (e) => { const b = e.target.closest('[data-b]'); if (!b) return; if (cmd) this.g.cmd({ ...cmd, book: b.dataset.b }); this.openBook(b.dataset.b, 0, cmd); };
  }
  openBook(id, page = null, cmd) {
    const BM = (() => { try { return JSON.parse(localStorage.getItem('griyaasri-bookmarks') || '{}'); } catch (e) { return {}; } })();
    if (page == null) page = BM[id] || 0; BM[id] = page; try { localStorage.setItem('griyaasri-bookmarks', JSON.stringify(BM)); } catch (e) { /* abaikan */ }
    const b = bookById(id); const col = SHELVES.find((x) => x.id === b.shelf).color; const n = b.pages.length;
    const m = this.modal(`<div class="reader" style="--bc:${col}"><div class="rhead"><div class="cover"><b>${esc(b.title)}</b><small>${esc(b.author)}</small></div></div>
      <div class="rpage"><p>${esc(b.pages[page])}</p>${b.help && page === n - 1 ? `<div class="helpbox">💚 ${esc(HELP_FOOTER)}</div>` : ''}</div>
      <div class="rnav"><button class="btn ghost sm" data-p="-1" ${page === 0 ? 'disabled' : ''}>← Sebelumnya</button><span class="rjump">Halaman ${page + 1} / ${n}<input type="range" min="1" max="${n}" value="${page + 1}" data-jump></span><button class="btn sm" data-p="1" ${page === n - 1 ? 'disabled' : ''}>Berikutnya →</button></div>
      <div class="mbtns row"><button class="btn ghost sm" data-back>Kembali ke rak</button><button class="btn ghost sm" data-close>Tutup</button></div></div>`, 'wide');
    this.sound.play('page');
    m.querySelector('[data-jump]').onchange = (e) => this.openBook(id, +e.target.value - 1, cmd);
    m.querySelector('.rnav').onclick = (e) => { const x = e.target.closest('[data-p]'); if (x && !x.disabled) this.openBook(id, page + +x.dataset.p, cmd); };
    m.querySelector('[data-back]').onclick = () => this.openLibrary(null, b.shelf);
  }
  // ---------- pinjaman Bang Jefri ----------
  loanModal(o) {
    if (!o) return; const g = this.g; const me = g.hh.sims[g.active] && g.hh.sims[g.active].species === 'human' ? g.active : g.mySims.find((n) => HUMANS.includes(n));
    const interest = Math.round(o.amount * o.rate / 1000) * 1000;
    const m = this.modal(`<h2>🧾 Bang Jefri datang lagi…</h2>
      <p>"Bang, Mbak… maaf ganggu. Boleh pinjam <b>${fmtRp(o.amount)}</b> dulu? ${o.days} hari lagi aku balikin, plus bunga <b>${Math.round(o.rate * 100)}%</b> (${fmtRp(interest)}). Janji!"</p>
      <p class="muted small">Uang diambil dari dompet ${esc(me)}. Bang Jefri selalu bayar — kadang cuma telat sehari.</p>
      <div class="mbtns row"><button class="btn ghost" id="lnNo">Tolak halus</button><button class="btn" id="lnYes">Pinjamkan</button></div>`);
    m.dataset.loan = '1';
    m.querySelector('#lnYes').onclick = () => { g.cmd({ c: 'loan', accept: true, sim: me }); this.closeModal(); };
    m.querySelector('#lnNo').onclick = () => { g.cmd({ c: 'loan', accept: false, sim: me }); this.closeModal(); };
  }
  openStudioFor(objId) { openStudio(this, { c: 'act', key: 'paintManual', objId, sim: this.g.active }); }
  guestModal(o) {
    if (!o) return; const g = this.g;
    const m = this.modal(`<h2>🔔 Ting-tong! Ada tamu</h2><p><b>${esc(o.name)}</b> (${esc(o.relation || '')}) datang ke rumah.</p><p class="muted small">Kalau dipersilakan masuk, tamu akan duduk di ruang keluarga, ngobrol, ikut makan, dan kadang bawa oleh-oleh.</p>
      <div class="mbtns row"><button class="btn ghost" id="gNo">Maaf, sedang sibuk</button><button class="btn" id="gYes">Persilakan masuk</button></div>`);
    m.dataset.kind = 'guest';
    m.querySelector('#gYes').onclick = () => { g.cmd({ c: 'guest', accept: true }); this.closeModal(); };
    m.querySelector('#gNo').onclick = () => { g.cmd({ c: 'guest', accept: false }); this.closeModal(); };
  }
  rtModal(o) {
    if (!o) return; const g = this.g;
    const m = this.modal(`<h2>🧾 Pak Harjo (Ketua RT) mampir</h2><p>"Assalamualaikum, Mas/Mbak. Mau ambil iuran bulanan kebersihan & keamanan <b>${fmtRp(o.amount)}</b> nggih. Buat gaji Pak Slamet, lampu jalan, sama sampah."</p>
      <div class="mbtns row"><button class="btn ghost" id="rNo">Nanti dulu, Pak</button><button class="btn" id="rYes">Bayar iuran</button></div>`);
    m.dataset.kind = 'rt';
    m.querySelector('#rYes').onclick = () => { g.cmd({ c: 'iuran', accept: true }); this.closeModal(); };
    m.querySelector('#rNo').onclick = () => { g.cmd({ c: 'iuran', accept: false }); this.closeModal(); };
  }
  closeKind(k) { const m = $('.modal', this.root); if (m && m.dataset.kind === k) { delete m.dataset.kind; this.closeModal(); } }
  closeLoan() { const m = $('.modal', this.root); if (m && m.dataset.loan) { delete m.dataset.loan; this.closeModal(); } }
  // ---------- ART ----------
  openStaff() {
    const g = this.g, W = g.hh.world;
    const st = (n) => { const s = g.hh.others[n]; if (!W.staffOn[n]) return 'Libur'; if (!s || s.hidden) return 'Belum datang / sudah pulang'; return s.queue[0] ? (s.queue[0].stepLabel || s.queue[0].label) : 'Siaga'; };
    const m = this.modal(`<h2>🧑‍🍳 Asisten Rumah Tangga</h2><p class="muted small">Bekerja 06.00–18.00. Gaji harian dibayar saat pulang dari dompet terbanyak.</p>
      <div class="staff">${Object.entries(STAFF).map(([n, d]) => `<div class="stf"><div><b>${n}</b><small>${d.role} · ${fmtRp(d.wage)}/hari</small><em>${esc(st(n))}</em></div>
        <button class="btn sm ${W.staffOn[n] ? 'ghost' : ''}" data-s="${n}">${W.staffOn[n] ? 'Liburkan' : 'Pekerjakan'}</button></div>`).join('')}</div>
      <div class="mbtns row"><button class="btn ghost" data-close>Tutup</button></div>`);
    m.querySelector('.staff').onclick = (e) => { const b = e.target.closest('[data-s]'); if (!b) return; g.cmd({ c: 'staff', name: b.dataset.s, on: !W.staffOn[b.dataset.s] }); setTimeout(() => this.openStaff(), 150); };
  }

  // ---------- obrolan suara ----------
  async voiceToggle() {
    const g = this.g, net = g.net; if (!net || g.mode === 'solo') return;
    if (!this.voice) this.voice = { on: false, muted: false, meName: g.mySims.find((n) => HUMANS.includes(n)), peerName: HUMANS.find((n) => !g.mySims.includes(n)), meLvl: 0, peerLvl: 0 };
    const V = this.voice;
    if (V.on) { V.muted = !V.muted; net.setMuted(V.muted); this.toast(V.muted ? 'Mikrofon dibisukan 🔇' : 'Mikrofon aktif 🎙️', 'info'); this.refresh(); return; }
    try {
      const st = await net.startVoice(); V.on = true; V.muted = false;
      V.meA = this.analyser(st);
      this.toast(net.open ? 'Obrolan suara aktif — kalian bisa ngobrol 🎙️' : 'Mikrofon siap — tersambung otomatis saat pasangan masuk 🎙️', 'good');
      if (!this._voiceBound) { this._voiceBound = true; const prev = net.onOpen; net.onOpen = () => { prev && prev(); setTimeout(() => net.callRemote(), 800); }; }
    } catch (e) { this.toast('Tidak bisa pakai mikrofon: ' + (e.message || e.name) + '. Izinkan akses mikrofon di browser.', 'bad', true); }
    this.refresh();
  }
  bindVoiceOut() {
    const g = this.g, net = g.net; if (!net) return;
    const audio = document.getElementById('voiceOut');
    net.onRemoteStream = (st) => {
      audio.srcObject = st; audio.play().catch(() => { this.toast('Ketuk layar sekali untuk mendengar suara pasangan 🔈', 'info', true); const f = () => { audio.play().catch(() => {}); window.removeEventListener('pointerdown', f); }; window.addEventListener('pointerdown', f); });
      if (!this.voice) this.voice = { on: false, muted: false, meName: g.mySims.find((n) => HUMANS.includes(n)), peerName: HUMANS.find((n) => !g.mySims.includes(n)), meLvl: 0, peerLvl: 0 };
      this.voice.peerA = this.analyser(st);
      if (!this.voice.heard) { this.voice.heard = true; this.toast(`Suara ${this.voice.peerName} tersambung 🔊${this.voice.on ? '' : ' — nyalakan mikmu biar bisa balas'}`, 'good', true); }
    };
    setInterval(() => { const V = this.voice; if (!V) return; V.meLvl = V.meA && !V.muted ? V.meA() : 0; V.peerLvl = V.peerA ? V.peerA() : 0; }, 120);
  }
  analyser(stream) {
    try {
      this.actx = this.actx || new (window.AudioContext || window.webkitAudioContext)();
      const src = this.actx.createMediaStreamSource(stream); const an = this.actx.createAnalyser(); an.fftSize = 512; src.connect(an);
      const buf = new Uint8Array(an.fftSize);
      return () => { an.getByteTimeDomainData(buf); let m = 0; for (const v of buf) m = Math.max(m, Math.abs(v - 128)); return m / 128; };
    } catch (e) { return () => 0; }
  }

  // ---------- modal ----------
  modal(html, cls = '') {
    const m = $('.modal', this.root); delete m.dataset.loan; delete m.dataset.kind; m.className = 'modal ' + cls; m.innerHTML = `<div class="mcard">${html}</div>`;
    m.onclick = (e) => { if (e.target === m || e.target.closest('[data-close]')) this.closeModal(); };
    return m;
  }
  closeModal() { $('.modal', this.root).classList.add('hidden'); }
  openMenu() {
    const g = this.g;
    const m = this.modal(`<h2>Menu</h2>
      <div class="mbtns">
        <button class="btn" data-a="save">💾 Simpan sekarang ${cloud() ? '(cloud + perangkat)' : '(perangkat ini)'}</button>
        <button class="btn" data-a="help">❓ Cara main</button>
        <button class="btn" data-a="snd">${this.sound.on ? '🔊 Suara: nyala' : '🔇 Suara: mati'}</button>
        <button class="btn" data-a="rush">🍛 Minigame: Nasi Padang Rush</button>
        <button class="btn" data-a="eggs">🥚 Jurnal Rahasia (easter egg)</button>
        <button class="btn" data-a="photo">📸 Mode Foto</button>
        <button class="btn" data-a="opt">⚙️ Kenyamanan Main (energi, kebutuhan, panjang hari)</button>
        <button class="btn ghost" data-a="vol">🎚️ Volume: ${Math.round(this.sound.vol * 100)}%</button>
        <button class="btn ghost" data-a="unstuck">🔧 Lepas macet: ${esc(this.g.active)}</button>
        <p class="muted small">Akun: ${Acct.session && Acct.session.user ? esc(Acct.session.user) : 'tanpa akun'} · ${this.g.slot && this.g.slot !== 'solo' ? 'Rumah berdua ' + esc(this.g.slot.slice(5)) + (this.g.isHost ? ' (kamu host)' : ' (tamu)') : 'Main sendiri'}${this.g.cloudState ? ' · ☁️ ' + esc(this.g.cloudState) : ''}</p>
        <button class="btn" data-a="gfx">${g.quality.low ? '🖥️ Grafis: ringan' : '🖥️ Grafis: tinggi'}</button>
        <button class="btn ghost" data-a="exit">🚪 Keluar ke menu utama</button>
        <button class="btn ghost" data-close>Tutup</button></div>`);
    m.querySelector('.mbtns').onclick = (e) => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      if (a.dataset.a === 'save') { g.save(); this.closeModal(); }
      if (a.dataset.a === 'help') this.openHelp();
      if (a.dataset.a === 'snd') { this.sound.on = !this.sound.on; if (!this.sound.on) this.sound.stopAll(); this.openMenu(); }
      if (a.dataset.a === 'rush') { this.closeModal(); openRush(this); }
      if (a.dataset.a === 'eggs') { this.closeModal(); openEggs(this); }
      if (a.dataset.a === 'photo') { this.closeModal(); openPhoto(this); }
      if (a.dataset.a === 'opt') { this.closeModal(); this.openOptions(); }
      if (a.dataset.a === 'savenow') { this.g.save(true); this.toast('Menyimpan… 💾', 'info'); }
      if (a.dataset.a === 'unstuck') { this.g.cmd({ c: 'unstuck' }); this.closeModal(); }
      if (a.dataset.a === 'tomenu') { this.g.save(true); try { this.g.net && this.g.net.send({ t: 'bye' }); } catch (e) { /* abaikan */ } setTimeout(() => { location.href = location.pathname; }, 600); }
      if (a.dataset.a === 'vol') { const v = [0.3, 0.55, 0.8, 1][([0.3, 0.55, 0.8, 1].indexOf(this.sound.vol) + 1) % 4]; this.sound.setVolume(v); this.openMenu(); }
      if (a.dataset.a === 'gfx') { g.setQuality(!g.quality.low); this.openMenu(); }
      if (a.dataset.a === 'exit') { this.g.save(true); try { this.g.net && this.g.net.send({ t: 'bye' }); } catch (e) { /* abaikan */ } setTimeout(() => { location.href = location.pathname; }, 700); }
    };
  }
  openHelp() {
    this.modal(`<h2>Cara main</h2><div class="help">
      <p><b>Tujuan:</b> urus rumah Handoyo & Naswa di Perumahan Griya Asri — jaga kebutuhan, kerja, bayar tagihan, rawat rumah, dan dekatkan hubungan sampai jadi <em>Keluarga Idaman Perumahan</em>.</p>
      <p><b>Klik benda</b> untuk memilih aksi. <b>Klik pasangan</b> untuk interaksi sosial, <b>klik karakter sendiri</b> untuk aksi HP. <b>Klik lantai</b> untuk berjalan. Klik ikon di antrian aksi untuk membatalkan.</p>
      <p><b>Kamera:</b> seret = putar, scroll/cubit = zoom, klik-kanan/dua jari = geser, WASD geser, Q/E putar, F ikuti karakter, C mode dinding.</p>
      <p><b>Waktu:</b> Spasi jeda, 1/2/3 kecepatan. Kalau keduanya tidur atau di kantor, waktu otomatis dipercepat.</p>
      <p><b>Uang:</b> kerja Senin–Jumat (06.00–11.59 berangkat), kerja lepas di komputer, jual lukisan, panen sayur. Tagihan datang tiap 3 hari — telat 3 hari, listrik diputus.</p>
      <p><b>Tips:</b> Mang Ujang lewat jam 07.00–09.30 (klik pagar untuk belanja). Masak untuk berdua bikin pasangan senang. Rumah bersih = mood bagus.</p>
      <p><b>Berdua:</b> buat room di satu HP/laptop, pasangan buka link yang sama lalu masukkan kodenya. Masing-masing mengendalikan satu karakter.</p></div>
      <button class="btn" data-close>Mengerti</button>`);
  }
  openCAS(name) {
    const g = this.g; if (g.hh.sims[name].isPet) return; const cur = { ...g.hh.sims[name].outfit };
    const sw = (arr, key) => `<div class="sw">${arr.map((c) => `<button data-k="${key}" data-v="${c}" style="background:${c}" class="${cur[key] === c ? 'on' : ''}"></button>`).join('')}</div>`;
    const render = () => {
      const m = this.modal(`<h2>Lemari ${name}</h2>
        <div class="cas">
          <label>Warna kulit</label>${sw(SKIN_TONES, 'skin')}
          <label>Gaya rambut</label><div class="chips">${HAIR_STYLES.map((s) => `<button data-k="hairStyle" data-v="${s.id}" class="${cur.hairStyle === s.id ? 'on' : ''}">${s.label}</button>`).join('')}</div>
          <label>Warna rambut / hijab</label>${sw([...HAIR_COLORS, ...CLOTH_COLORS.slice(0, 5)], 'hair')}
          <label>Atasan</label>${sw(CLOTH_COLORS, 'shirt')}
          <label>Bawahan</label>${sw(CLOTH_COLORS, 'pants')}
          <label>Model</label><div class="chips"><button data-k="dress" data-v="0" class="${!cur.dress ? 'on' : ''}">Celana</button><button data-k="dress" data-v="1" class="${cur.dress ? 'on' : ''}">Rok / gamis</button></div>
        </div><div class="mbtns row"><button class="btn ghost" data-close>Batal</button><button class="btn" id="casOk">Pakai</button></div>`, 'side');
      m.querySelector('.cas').onclick = (e) => { const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k; cur[k] = k === 'dress' ? b.dataset.v === '1' : b.dataset.v; render(); g.models[name].setOutfit(cur); };
      m.querySelector('#casOk').onclick = () => { g.cmd({ c: 'outfit', sim: name, outfit: cur }); g.models[name].outfitKey = null; this.closeModal(); };
      m.querySelector('[data-close]').addEventListener('click', () => { g.models[name].setOutfit(g.hh.sims[name].outfit); });
    };
    render();
  }
}
