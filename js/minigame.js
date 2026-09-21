// ============================================================
//  MINIGAME "NASI PADANG RUSH" — bantu Uda Rizal melayani pelanggan
//  5 level, target omzet, kesabaran pelanggan, kombo, dan akhir yang bisa ditamatkan.
//  Hadiah: uang, piala, dan gelar untuk yang tamat tanpa pelanggan kabur.
// ============================================================
import { TYPES, fmtRp } from './data.js';
import { INTER } from './interactions.js';

export const LAUK = [
  { k: 'rendang', n: 'Rendang', c: '#4a2313', e: '🥩', harga: 15000 },
  { k: 'ayampop', n: 'Ayam Pop', c: '#f0dfb6', e: '🍗', harga: 13000 },
  { k: 'gulai', n: 'Gulai Kakap', c: '#e0a526', e: '🐟', harga: 17000 },
  { k: 'dendeng', n: 'Dendeng Balado', c: '#8c2f1a', e: '🌶️', harga: 16000 },
  { k: 'telur', n: 'Telur Balado', c: '#e8541f', e: '🥚', harga: 8000 },
  { k: 'daun', n: 'Daun Singkong', c: '#2e5e20', e: '🥬', harga: 5000 },
];
const LEVELS = [
  { n: 1, judul: 'Jam Sepuluh Pagi', target: 120000, durasi: 75, sabar: 26, maks: 2, spawn: 5.5, pesan: 'Pelanggan baru dua-tiga. Kenali dulu lauknya.' },
  { n: 2, judul: 'Makan Siang Kantor', target: 260000, durasi: 85, sabar: 23, maks: 3, spawn: 4.4, pesan: 'Rombongan kantor datang. Jaga kombo biar dapat tip!' },
  { n: 3, judul: 'Rombongan Arisan RT', target: 420000, durasi: 95, sabar: 20, maks: 3, spawn: 3.6, pesan: 'Bu Rina bawa teman-teman arisan. Cepat tapi jangan salah!' },
  { n: 4, judul: 'Hujan & Pesanan Ojol', target: 620000, durasi: 100, sabar: 18, maks: 4, spawn: 3.0, pesan: 'Pesanan ojol menumpuk. Empat meja sekaligus!' },
  { n: 5, judul: 'Hidang Besar Akhir Pekan', target: 900000, durasi: 115, sabar: 17, maks: 4, spawn: 2.6, pesan: 'Level terakhir! Ada pesanan hidang 4 lauk. Semangat, Uda!' },
];
const NAMA = ['Pak Ismail', 'Bu Rina', 'Bang Jefri', 'Mbak Tika', 'Pak Budi', 'Nadia', 'Om Bram', 'Pak Gunawan', 'Mbah Karso', 'Bu Endang', 'Mas Dimas', 'Pak Slamet', 'Kak Dinda', 'Reza'];
const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

TYPES.padangCounter && TYPES.padangCounter.acts.push('rushGame');
if (TYPES.arcade) TYPES.arcade.acts.push('rushGame');
INTER.rushGame = {
  label: '🍛 Minigame: Nasi Padang Rush', icon: '🎮', ui: 'rush',
  build: (c) => ({ steps: [{ target: { obj: c.obj.id }, anim: 'talk', dur: 2, label: 'Ikut bantu di etalase' }] }),
};

export function openRush(ui) {
  const g = ui.g, hh = g.hh, snd = ui.sound;
  const W = hh.world; W.rush = W.rush || { level: 1, best: 0, tamat: false, sempurna: false, totalRp: 0 };
  let lv = clamp(W.rush.level, 1, 5);
  const wrap = document.createElement('div'); wrap.className = 'rush';
  wrap.innerHTML = `<div class="rushCard">
    <header><b>🍛 Nasi Padang Rush</b><span id="rsInfo"></span><button class="btn ghost sm" id="rsHelp">❔ Cara main</button><button class="btn ghost sm" id="rsX">✕ Keluar</button></header>
    <canvas id="rsC" width="900" height="540"></canvas>
    <div class="rushBar" id="rsBar"></div></div>`;
  document.body.appendChild(wrap); ui.studioOpen = true;
  const c = wrap.querySelector('#rsC'), x = c.getContext('2d');
  const state = { mode: 'intro', lv, t: 0, uang: 0, kombo: 0, komboMax: 0, kabur: 0, cust: [], piring: [], fx: [], last: performance.now(), sisa: 0, totalRp: 0, sempurna: true, pause: false };

  // ---------- pelanggan ----------
  const L = () => LEVELS[state.lv - 1];
  function spawn() {
    const lvl = L(); if (state.cust.length >= lvl.maks) return;
    const jml = state.lv >= 5 && Math.random() < 0.3 ? 4 : 1 + Math.floor(Math.random() * Math.min(3, 1 + state.lv / 2));
    const pesanan = []; for (let i = 0; i < jml; i++) pesanan.push(rnd(LAUK).k);
    const slot = [0, 1, 2, 3].find((s) => !state.cust.some((k) => k.slot === s)); if (slot == null) return;
    state.cust.push({ slot, nama: rnd(NAMA), pesanan, sabar: lvl.sabar, maxSabar: lvl.sabar, bob: Math.random() * 6, hidang: jml === 4 });
    snd && snd.shot && snd.shot('clink', 0.5);
  }
  const hargaPesanan = (p) => p.reduce((a, k) => a + LAUK.find((l) => l.k === k).harga, 0) + 12000;
  function sajikan(cu) {
    const want = [...cu.pesanan].sort().join(','), got = [...state.piring].sort().join(',');
    if (want !== got) { state.kombo = 0; pop(cu, '❌ Pesanan salah!', '#ff5252'); snd && snd.shot && snd.shot('hmph', 0.6); return; }
    const sisaRasio = cu.sabar / cu.maxSabar;
    const tip = Math.round(hargaPesanan(cu.pesanan) * (0.1 + sisaRasio * 0.35 + state.kombo * 0.05));
    const total = hargaPesanan(cu.pesanan) + tip;
    state.uang += total; state.kombo++; state.komboMax = Math.max(state.komboMax, state.kombo);
    pop(cu, `+${fmtRp(total)}${state.kombo > 1 ? ` · kombo ×${state.kombo}` : ''}`, '#7bf1a8');
    for (let i = 0; i < 14; i++) state.fx.push({ x: 150 + cu.slot * 190, y: 200, vx: (Math.random() - 0.5) * 180, vy: -60 - Math.random() * 160, life: 0.9, c: rnd(['#ffd740', '#7bf1a8', '#fff']) });
    state.cust = state.cust.filter((k) => k !== cu); state.piring = [];
    snd && snd.play && snd.play('money');
  }
  const pop = (cu, teks, warna) => state.fx.push({ txt: teks, x: 150 + cu.slot * 190, y: 180, vy: -40, life: 1.4, c: warna });

  // ---------- gambar ----------
  const R = (X, Y, W2, H2, r, fill) => { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W2, Y, X + W2, Y + H2, r); x.arcTo(X + W2, Y + H2, X, Y + H2, r); x.arcTo(X, Y + H2, X, Y, r); x.arcTo(X, Y, X + W2, Y, r); x.closePath(); if (fill) { x.fillStyle = fill; x.fill(); } };
  function draw() {
    const lvl = L();
    x.clearRect(0, 0, 900, 540);
    const bg = x.createLinearGradient(0, 0, 0, 540); bg.addColorStop(0, '#f6e6c8'); bg.addColorStop(1, '#e2c79b'); x.fillStyle = bg; x.fillRect(0, 0, 900, 540);
    x.fillStyle = '#7a2e1f'; x.fillRect(0, 0, 900, 54); x.fillStyle = '#f3d27a'; x.font = 'bold 22px "Baloo 2", sans-serif';
    x.fillText(`LEVEL ${state.lv} · ${lvl.judul}`, 18, 35);
    x.textAlign = 'right'; x.fillText(`${fmtRp(state.uang)} / ${fmtRp(lvl.target)}`, 882, 35); x.textAlign = 'left';
    // bar target & waktu
    R(18, 60, 864, 12, 6, 'rgba(0,0,0,.15)'); R(18, 60, 864 * clamp(state.uang / lvl.target, 0, 1), 12, 6, '#46d36b');
    R(18, 78, 864, 8, 4, 'rgba(0,0,0,.15)'); R(18, 78, 864 * clamp(state.sisa / lvl.durasi, 0, 1), 8, 4, state.sisa < 12 ? '#ff5252' : '#4d8cf0');
    x.fillStyle = '#5b3a24'; x.font = 'bold 14px system-ui'; x.fillText(`⏱️ ${Math.ceil(state.sisa)} dtk`, 18, 104);
    x.fillText(`🔥 Kombo ×${state.kombo}`, 130, 104); x.fillText(`😠 Kabur: ${state.kabur}/3`, 250, 104);
    // meja pelanggan
    for (let s = 0; s < lvl.maks; s++) {
      const X = 60 + s * 190; R(X, 120, 170, 210, 16, 'rgba(255,255,255,.55)');
      const cu = state.cust.find((k) => k.slot === s);
      if (!cu) { x.fillStyle = '#b99b74'; x.font = '13px system-ui'; x.textAlign = 'center'; x.fillText('meja kosong', X + 85, 230); x.textAlign = 'left'; continue; }
      const bob = Math.sin(state.t * 3 + cu.bob) * 3;
      x.font = '40px system-ui'; x.textAlign = 'center'; x.fillText(cu.sabar / cu.maxSabar < 0.3 ? '😠' : cu.hidang ? '🤩' : '🙂', X + 85, 172 + bob);
      x.font = 'bold 13px system-ui'; x.fillStyle = '#5b3a24'; x.fillText(cu.nama + (cu.hidang ? ' (hidang!)' : ''), X + 85, 194);
      cu.pesanan.forEach((k, i) => { const l = LAUK.find((q) => q.k === k); const px = X + 30 + (i % 2) * 55, py = 216 + Math.floor(i / 2) * 46;
        R(px - 22, py - 18, 44, 40, 8, l.c); x.font = '20px system-ui'; x.fillStyle = '#fff'; x.fillText(l.e, px, py + 8); });
      const p = cu.sabar / cu.maxSabar; R(X + 15, 306, 140, 10, 5, 'rgba(0,0,0,.18)'); R(X + 15, 306, 140 * p, 10, 5, p > 0.5 ? '#46d36b' : p > 0.25 ? '#ffb547' : '#ff5252');
      x.textAlign = 'left';
    }
    // piring
    x.fillStyle = '#5b3a24'; x.font = 'bold 16px "Baloo 2", sans-serif'; x.fillText('Piring kamu (klik pelanggan untuk menyajikan):', 60, 368);
    R(60, 378, 400, 62, 12, 'rgba(255,255,255,.7)');
    state.piring.forEach((k, i) => { const l = LAUK.find((q) => q.k === k); R(72 + i * 62, 388, 52, 42, 8, l.c); x.font = '22px system-ui'; x.textAlign = 'center'; x.fillStyle = '#fff'; x.fillText(l.e, 98 + i * 62, 416); x.textAlign = 'left'; });
    if (!state.piring.length) { x.fillStyle = '#b99b74'; x.font = '14px system-ui'; x.fillText('kosong — ambil lauk dari etalase di bawah', 80, 414); }
    R(478, 378, 120, 62, 12, '#ff8a65'); x.fillStyle = '#fff'; x.font = 'bold 16px system-ui'; x.textAlign = 'center'; x.fillText('🗑️ Buang', 538, 415); x.textAlign = 'left';
    // etalase
    x.fillStyle = '#5b3a24'; x.font = 'bold 16px "Baloo 2", sans-serif'; x.fillText('Etalase (klik / tekan 1–6):', 60, 470);
    LAUK.forEach((l, i) => { const X = 60 + i * 132; R(X, 480, 120, 46, 10, l.c); x.font = '20px system-ui'; x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText(`${i + 1} ${l.e}`, X + 60, 500); x.font = 'bold 11px system-ui'; x.fillText(l.n, X + 60, 517); x.textAlign = 'left'; });
    // efek
    for (const f of state.fx) { x.globalAlpha = clamp(f.life, 0, 1); if (f.txt) { x.fillStyle = f.c; x.font = 'bold 18px "Baloo 2", sans-serif'; x.textAlign = 'center'; x.fillText(f.txt, f.x, f.y); x.textAlign = 'left'; } else { x.fillStyle = f.c; x.fillRect(f.x, f.y, 5, 5); } x.globalAlpha = 1; }
    // layar status
    if (state.mode !== 'main') overlay();
  }
  function overlay() {
    x.fillStyle = 'rgba(25,12,8,.82)'; x.fillRect(0, 0, 900, 540);
    x.textAlign = 'center'; x.fillStyle = '#f3d27a'; x.font = 'bold 34px "Baloo 2", sans-serif';
    const lvl = L();
    if (state.mode === 'intro') {
      x.fillText(`LEVEL ${state.lv}: ${lvl.judul}`, 450, 190);
      x.fillStyle = '#fff'; x.font = '17px system-ui'; x.fillText(lvl.pesan, 450, 230);
      x.fillText(`Target omzet ${fmtRp(lvl.target)} dalam ${lvl.durasi} detik`, 450, 262);
      x.fillText('Maksimal 3 pelanggan kabur. Kombo memberi tip lebih besar.', 450, 290);
      x.fillStyle = '#7bf1a8'; x.font = 'bold 22px "Baloo 2", sans-serif'; x.fillText('▶ Klik di mana saja untuk mulai', 450, 350);
    } else if (state.mode === 'menang') {
      x.fillText('✅ LEVEL SELESAI!', 450, 180);
      x.fillStyle = '#fff'; x.font = '18px system-ui';
      x.fillText(`Omzet ${fmtRp(state.uang)} · kombo terbaik ×${state.komboMax} · pelanggan kabur ${state.kabur}`, 450, 222);
      x.fillStyle = '#7bf1a8'; x.font = 'bold 22px "Baloo 2", sans-serif'; x.fillText(state.lv < 5 ? '▶ Klik untuk lanjut ke level berikutnya' : '▶ Klik untuk melihat hasil akhir', 450, 300);
    } else if (state.mode === 'kalah') {
      x.fillText('😵 GAGAL', 450, 180); x.fillStyle = '#fff'; x.font = '18px system-ui';
      x.fillText(state.kabur >= 3 ? 'Tiga pelanggan kabur — Uda Rizal geleng-geleng.' : `Waktu habis. Omzet baru ${fmtRp(state.uang)} dari ${fmtRp(lvl.target)}.`, 450, 222);
      x.fillStyle = '#ffb547'; x.font = 'bold 22px "Baloo 2", sans-serif'; x.fillText('▶ Klik untuk coba lagi', 450, 300);
    } else if (state.mode === 'tamat') {
      x.fillText('🏆 TAMAT — KAMU LULUS JADI URANG PADANG!', 450, 160);
      x.fillStyle = '#fff'; x.font = '18px system-ui';
      x.fillText(`Total omzet 5 level: ${fmtRp(state.totalRp)}`, 450, 208);
      x.fillText(`Kombo terbaik ×${state.komboMax}${state.sempurna ? ' · TANPA satu pun pelanggan kabur!' : ''}`, 450, 238);
      x.fillStyle = '#7bf1a8'; x.fillText(`Upah + bonus masuk ke dompet: ${fmtRp(Math.round(state.totalRp * 0.35))}`, 450, 276);
      x.fillStyle = '#ffd740'; x.font = 'bold 20px "Baloo 2", sans-serif'; x.fillText('🏆 Piala "Juara Hidang" dikirim ke rumahmu', 450, 316);
      if (state.sempurna) x.fillText('🥇 Gelar rahasia terbuka: "Tangan Emas Etalase"', 450, 346);
      x.fillStyle = '#fff'; x.font = '16px system-ui'; x.fillText('▶ Klik untuk menutup', 450, 400);
    }
    x.textAlign = 'left';
  }
  // ---------- alur ----------
  function mulaiLevel() { const lvl = L(); state.mode = 'main'; state.t = 0; state.uang = 0; state.kombo = 0; state.kabur = 0; state.cust = []; state.piring = []; state.sisa = lvl.durasi; state.spawnT = 1; }
  function selesaiLevel(menang) {
    state.mode = menang ? 'menang' : 'kalah';
    if (menang) { state.totalRp += state.uang; if (state.kabur > 0) state.sempurna = false; snd && snd.play && snd.play('fanfare'); } else { state.sempurna = false; snd && snd.play && snd.play('bad'); }
  }
  function lanjut() {
    if (state.mode === 'intro') return mulaiLevel();
    if (state.mode === 'kalah') return mulaiLevel();
    if (state.mode === 'menang') {
      if (state.lv < 5) { state.lv++; W.rush.level = state.lv; state.mode = 'intro'; return; }
      state.mode = 'tamat';
      g.cmd({ c: 'rush', total: state.totalRp, sempurna: state.sempurna, kombo: state.komboMax });
      return;
    }
    if (state.mode === 'tamat') tutup();
  }
  function tutup() { wrap.remove(); ui.studioOpen = false; window.removeEventListener('keydown', key); }
  // ---------- input ----------
  c.addEventListener('pointerdown', (e) => {
    const r = c.getBoundingClientRect(), mx = (e.clientX - r.left) * 900 / r.width, my = (e.clientY - r.top) * 540 / r.height;
    if (state.mode !== 'main') return lanjut();
    if (my >= 480 && my <= 526) { const i = Math.floor((mx - 60) / 132); if (i >= 0 && i < 6 && (mx - 60) % 132 < 120) ambil(i); return; }
    if (mx >= 478 && mx <= 598 && my >= 378 && my <= 440) { state.piring = []; snd && snd.shot && snd.shot('swish', 0.5); return; }
    if (my >= 120 && my <= 330) { const s = Math.floor((mx - 60) / 190); const cu = state.cust.find((k) => k.slot === s); if (cu && state.piring.length) sajikan(cu); }
  });
  const ambil = (i) => { if (state.piring.length >= 4) return; state.piring.push(LAUK[i].k); snd && snd.shot && snd.shot('clink', 0.4); };
  const key = (e) => {
    if (e.key >= '1' && e.key <= '6') { if (state.mode === 'main') ambil(+e.key - 1); }
    else if (e.key === 'Backspace') { state.piring.pop(); }
    else if (e.key === ' ') { e.preventDefault(); if (state.mode !== 'main') lanjut(); else { const cu = state.cust.find((k) => [...k.pesanan].sort().join() === [...state.piring].sort().join()); if (cu) sajikan(cu); } }
    else if (e.key === 'Escape') tutup();
  };
  window.addEventListener('keydown', key);
  wrap.querySelector('#rsX').onclick = tutup;
  wrap.querySelector('#rsHelp').onclick = () => { state.pause = !state.pause; wrap.querySelector('#rsBar').innerHTML = state.pause ? '<b>Cara main:</b> klik lauk di etalase (atau tekan 1–6) untuk menyusun piring sesuai pesanan pelanggan, lalu klik pelanggannya. Backspace membatalkan satu lauk, Spasi menyajikan otomatis, Esc keluar. Sajikan cepat → tip lebih besar. Jangan sampai 3 pelanggan kabur!' : ''; };
  // ---------- loop ----------
  function frame(now) {
    if (!wrap.isConnected) return;
    const dt = Math.min(0.05, (now - state.last) / 1000); state.last = now;
    if (state.mode === 'main' && !state.pause) {
      state.t += dt; state.sisa -= dt; const lvl = L();
      state.spawnT -= dt; if (state.spawnT <= 0) { spawn(); state.spawnT = lvl.spawn * (0.7 + Math.random() * 0.6); }
      for (const cu of [...state.cust]) {
        cu.sabar -= dt;
        if (cu.sabar <= 0) { state.cust = state.cust.filter((k) => k !== cu); state.kabur++; state.kombo = 0; pop(cu, '😠 Kabur!', '#ff5252'); snd && snd.shot && snd.shot('hmph', 0.7); }
      }
      if (state.kabur >= 3) selesaiLevel(false);
      else if (state.uang >= lvl.target) selesaiLevel(true);
      else if (state.sisa <= 0) selesaiLevel(state.uang >= lvl.target);
    }
    for (const f of state.fx) { f.life -= dt; f.y += (f.vy || 0) * dt; if (f.vx != null) { f.x += f.vx * dt; f.vy += 320 * dt; } }
    state.fx = state.fx.filter((f) => f.life > 0);
    wrap.querySelector('#rsInfo').textContent = `Rekor: ${fmtRp(W.rush.best || 0)}${W.rush.tamat ? ' · ✅ sudah tamat' : ''}`;
    draw(); requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// dipanggil host lewat command 'rush'
export function rushReward(hh, c) {
  const W = hh.world; W.rush = W.rush || { level: 1, best: 0 };
  const upah = Math.round((+c.total || 0) * 0.35);
  W.rush.best = Math.max(W.rush.best || 0, +c.total || 0); W.rush.tamat = true; W.rush.level = 1; W.rush.totalRp = (W.rush.totalRp || 0) + upah;
  if (c.sempurna) W.rush.sempurna = true;
  const who = hh.sims[c.sim] && hh.sims[c.sim].species === 'human' ? c.sim : 'Handoyo';
  hh.op({ o: 'money', d: upah, why: 'Upah & bonus Nasi Padang Rush', sim: who });
  if (!W.objects.some((o) => o.type === 'trofiHidang')) {
    W.objects.push({ id: W.nextId++, type: 'trofiHidang', x: -6.6, z: 3.0, rot: 0, lvl: 0, s: {} }); W.objVer++; hh.rebuildNav();
  }
  hh.addFam(40); hh.sfx('fanfare');
  for (const h of hh.humans()) h.mood('juaraHidang');
  hh.toast(`🏆 Nasi Padang Rush TAMAT! Upah ${fmtRp(upah)} masuk dompet ${who}. Piala "Juara Hidang" dipajang di ruang keluarga.${c.sempurna ? ' 🥇 Gelar rahasia "Tangan Emas Etalase" terbuka!' : ''}`, 'good', true);
  hh.easter && hh.easter('rushTamat', { sempurna: !!c.sempurna });
}
