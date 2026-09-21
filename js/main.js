// ============================================================
//  Menu utama: login/akun, main sendiri, rumah berdua dengan kode TETAP.
//  Rumah berdua: siapa pun yang online duluan otomatis jadi host.
//  Kalau host keluar, pasangannya mengambil alih tanpa kehilangan progres.
// ============================================================
import { Game, readSave, clearSave } from './game.js';
import { UI } from './ui.js';
import { Net, makeCode, setNetConfig } from './net.js';
import { SIM_NAMES } from './data.js';
import { Acct, probe, auth, logout, cloud, myRooms, createRoom, joinRoom, loadSlot, readLocal, beat, PERMANENT_CODE } from './account.js';

const $ = (s) => document.querySelector(s);
const lobby = $('#lobby'), status = $('#lStatus');
const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 760;
const quality = { low: mobile, shadows: !mobile, shadowSize: mobile ? 1024 : 2048 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let chosen = 'Handoyo';
const params = new URLSearchParams(location.search);
const inviteCode = (params.get('room') || '').toUpperCase();
const uid = () => (Acct.session && Acct.session.user) || (localStorage.getItem('griyaasri-uid') || (() => { const u = 'tamu-' + Math.random().toString(36).slice(2, 8); try { localStorage.setItem('griyaasri-uid', u); } catch (e) { /* abaikan */ } return u; })());

function showPane(p) { document.querySelectorAll('.lpane').forEach((x) => (x.hidden = x.dataset.p !== p)); status.textContent = ''; if (p === 'main') renderMain(); }
function setStatus(t, bad) { status.textContent = t; status.classList.toggle('bad', !!bad); }
document.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => { chosen = b.dataset.pick; document.querySelectorAll('[data-pick]').forEach((x) => x.classList.toggle('on', x === b)); }));
document.querySelectorAll('[data-pane]').forEach((b) => b.addEventListener('click', () => showPane(b.dataset.pane)));

// ---------- start ----------
(async () => {
  setStatus('Memeriksa server…');
  await probe(); setNetConfig(Acct.config);
  $('#lDbInfo').textContent = Acct.db ? '✅ Tersambung ke database cloud — progres tersimpan di akunmu & bisa dilanjutkan dari perangkat mana pun.' : 'ℹ️ Database cloud belum diatur di server. Akun & progres disimpan di perangkat ini (lihat README untuk mengaktifkan database).';
  setStatus('');
  if (Acct.session && (Acct.session.local || Acct.db)) showPane('main'); else showPane('login');
  if (inviteCode) { $('#lCode').value = inviteCode; if (Acct.session) showPane('join'); }
})();

async function doAuth(a) {
  const u = $('#lUser').value, p = $('#lPin').value;
  setStatus(a === 'register' ? 'Mendaftarkan akun…' : 'Masuk…');
  try { await auth(a, u, p); setStatus(''); if (inviteCode) showPane('join'); else showPane('main'); } catch (e) { setStatus(e.message, true); }
}
$('#lLogin').addEventListener('click', () => doAuth('login'));
$('#lReg').addEventListener('click', () => doAuth('register'));
$('#lPin').addEventListener('keydown', (e) => { if (e.key === 'Enter') doAuth('login'); });
$('#lGuestPlay').addEventListener('click', () => { Acct.session = { user: null, local: true, token: null }; showPane(inviteCode ? 'join' : 'main'); });
$('#lOut').addEventListener('click', () => { logout(); showPane('login'); });

async function renderMain() {
  const s = Acct.session || {};
  $('#lWho').textContent = s.user ? `👋 Halo, ${s.user}${cloud() ? ' · ☁️ tersimpan di cloud' : ' · 💾 simpanan lokal'}` : '👤 Main tanpa akun (simpanan di perangkat ini)';
  const solo = readLocal('solo') || readSave();
  if (solo) { $('#lContinue').hidden = false; $('#lContinue small').textContent = `Hari ke-${Math.floor(solo.world.time / 1440) + 1}`; } else $('#lContinue').hidden = true;
  const box = $('#lRooms'); box.innerHTML = '<p class="muted small">Memuat rumah berdua…</p>';
  if (!s.user) { box.innerHTML = `<button class="lroom perm" id="lPermAnon"><b>🏠 ${PERMANENT_CODE}</b><span><strong>Rumah Permanen Handoyo & Naswa</strong><br>Tanpa akun progres hanya disimpan di perangkat ini. Masuk akun agar tersimpan di cloud.</span><em>Masuk ▶</em></button>`; $('#lPermAnon').onclick = () => enterRoom(PERMANENT_CODE, chosen); return; }
  try {
    const rooms = await myRooms();
    const perm = rooms.find((r) => r.code === PERMANENT_CODE);
    const permBtn = `<button class="lroom perm" data-room="${PERMANENT_CODE}" data-role="${perm ? perm.role : chosen}"><b>🏠 ${PERMANENT_CODE}</b><span><strong>Rumah Permanen Handoyo & Naswa</strong><br>Room khusus yang selalu sama. Terus berjalan selama minimal satu dari kalian online, dan progres tersimpan otomatis.${perm && perm.online && perm.online.length ? `<br>🟢 Online sekarang: ${perm.online.join(', ')}` : ''}${perm && perm.meta && perm.meta.day ? ` · hari ke-${perm.meta.day}` : ''}</span><em>Masuk ▶</em></button>`;
    box.innerHTML = permBtn + rooms.filter((r) => r.code !== PERMANENT_CODE).map((r) => `<button class="lroom" data-room="${r.code}" data-role="${r.role}"><b>${r.code}</b><span>${r.name || 'Rumah Kita'} · kamu ${r.role}${r.members.length ? '<br>' + r.members.join(', ') : ''}${r.meta && r.meta.day ? ` · hari ke-${r.meta.day}` : ''}${r.online && r.online.length ? `<br>🟢 Online: ${r.online.join(', ')}` : ''}</span><em>Masuk ▶</em></button>`).join('');
    box.querySelectorAll('[data-room]').forEach((b) => b.addEventListener('click', async () => {
      const code = b.dataset.room; let role = b.dataset.role;
      if (code === PERMANENT_CODE) { setStatus('Membuka Rumah Permanen…'); try { role = (await joinRoom(code, chosen)).role; } catch (e) { return setStatus(e.message, true); } }
      enterRoom(code, role);
    }));
  } catch (e) { box.innerHTML = `<p class="muted small">Gagal memuat: ${e.message}</p>`; }
}

function roomLoop(g) {
  const tick = () => { if (!g.roomCode) return; beat(g.roomCode, { host: g.isHost, day: Math.floor(g.hh.world.time / 1440) + 1 }).then((live) => { if (live) g.roomLive = live; }); };
  tick(); g._beatIv = setInterval(tick, 20000);
}
function start(opts) {
  lobby.classList.add('gone');
  const ui = new UI($('#hud'));
  const game = new Game({ ...opts, ui, quality });
  window.__game = game; game.slot = opts.slot || 'solo';
  game.init($('#view')); ui.attach(game); game.bgSim();
  if (opts.gallery && opts.gallery.length && !(game.hh.gallery || []).length) game.hh.gallery = opts.gallery;
  window.addEventListener('beforeunload', () => { if (window.__game) { try { window.__game.net && window.__game.net.send({ t: 'bye' }); } catch (e) { /* abaikan */ } window.__game.saveOnExit(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden && window.__game) window.__game.save(true); });
  setTimeout(() => lobby.remove(), 700);
  return game;
}

// ---------- main sendiri ----------
async function playSolo(asCapy) {
  setStatus('Memuat progres…');
  const best = await loadSlot('solo');
  const g = start({ mode: 'solo', mySims: asCapy ? ['Kapi', 'Oyen', ...SIM_NAMES] : [...SIM_NAMES, 'Oyen', 'Kapi'], save: best && best.data, gallery: best && best.gallery, slot: 'solo' });
  if (asCapy) g.switchSim('Kapi');
  g.ui.toast(best ? `Progres dilanjutkan dari ${best.from} 💾` : 'Selamat datang di Perumahan Griya Asri! 🏡', 'good', true);
}
$('#lSolo').addEventListener('click', () => playSolo(false));
$('#lContinue').addEventListener('click', () => playSolo(false));
$('#lCapy').addEventListener('click', () => playSolo(true));
$('#lNew').addEventListener('click', () => { if (confirm('Hapus simpanan solo di perangkat ini? (simpanan cloud tidak ikut terhapus)')) { clearSave(); try { localStorage.removeItem('griyaasri-save-v1'); } catch (e) { /* abaikan */ } renderMain(); } });

// ---------- buat & gabung rumah berdua ----------
$('#lHost').addEventListener('click', async () => {
  if (!Acct.session || !Acct.session.user) { showPane('login'); return setStatus('Masuk akun dulu untuk membuat rumah berdua', true); }
  setStatus('Membuat rumah berdua…');
  try {
    const r = await createRoom(chosen, $('#lRoomName').value.trim() || 'Rumah Kita', makeCode);
    if ($('#lHostSave').checked) { const solo = await loadSlot('solo'); if (solo) { const { writeLocal, saveSlot } = await import('./account.js'); writeLocal('room:' + r.code, solo.data, solo.gallery); if (cloud()) await saveSlot('room:' + r.code, solo.data, solo.gallery).catch(() => {}); } }
    enterRoom(r.code, r.role, true);
  } catch (e) { setStatus(e.message, true); }
});
$('#lJoin').addEventListener('click', async () => {
  const code = $('#lCode').value.trim().toUpperCase(); if (code.length < 5) return setStatus('Masukkan 5 huruf kode rumah', true);
  if (!Acct.session) Acct.session = { user: null, local: true };
  setStatus('Memeriksa kode…');
  try { const r = Acct.session.user ? await joinRoom(code, chosen) : { code, role: null }; enterRoom(code, r.role); } catch (e) { setStatus(e.message, true); }
});

// ---------- masuk room: coba gabung, kalau host belum ada → jadi host ----------
async function enterRoom(code, role, fresh) {
  for (let attempt = 0; attempt < 8; attempt++) {
    setStatus(attempt ? `Menyambung ulang… (${attempt})` : `Masuk ke rumah ${code}…`);
    const n1 = new Net(uid());
    const full = await new Promise((resolve) => {
      let done = false; n1.onFull = () => { if (!done) { done = true; resolve('full'); } };
      n1.onMsg = (m) => { if (m.t === 'welcome' && !done) { done = true; resolve(m); } };
      n1.join(code, { role }).catch((e) => { if (!done) { done = true; resolve(e); } });
      setTimeout(() => { if (!done) { done = true; resolve(new Error('timeout')); } }, 14000);
    });
    if (full === 'full') { n1.destroy(); return setStatus('Rumah ini sedang dimainkan 2 orang lain. Coba lagi nanti.', true); }
    if (full && full.t === 'welcome') return startGuest(n1, code, full);
    n1.destroy();
    const n2 = new Net(uid());
    try { await n2.host(code); return startHost(n2, code, role || chosen, fresh); } catch (e) {
      n2.destroy();
      if (e.type === 'unavailable-id') { setStatus('Menunggu sesi lama dilepas server… ⏳'); await sleep(4000); continue; }
      return setStatus('Gagal: ' + e.message, true);
    }
  }
  setStatus('Tidak bisa masuk. Periksa koneksi internet lalu coba lagi.', true);
}
function hostHandlers(g, net, other) {
  net.onMsg = (m) => g.onNet(m);
  net.onOpen = () => { g.peerOnline = true; g.hh.sims[other].autonomy = false; g.ui.toast(`Pasangan masuk sebagai ${other}! 💞`, 'good', true); if (g.ui.voiceOn) setTimeout(() => net.callRemote(), 1000); };
  net.onClose = () => { if (!g.peerOnline) return; g.peerOnline = false; g.hh.sims[other].autonomy = true; g.save(true); g.ui.toast(`${other} keluar — progres tersimpan, ${other} jalan otomatis`, 'info', true); };
}
async function startHost(net, code, role, fresh) {
  setStatus('Memuat progres rumah…');
  const best = await loadSlot('room:' + code);
  const me = SIM_NAMES.includes(role) ? role : 'Handoyo'; const other = SIM_NAMES.find((n) => n !== me);
  const g = start({ mode: 'host', mySims: [me, 'Oyen', 'Kapi'], net, save: best && best.data, gallery: best && best.gallery, slot: 'room:' + code });
  g.roomCode = code; g.hh.sims[other].autonomy = true; hostHandlers(g, net, other); roomLoop(g);
  const link = `${location.origin}${location.pathname}?room=${code}`;
  g.ui.toast(best ? `Rumah ${code} dimuat dari ${best.from} (hari ke-${Math.floor(best.data.world.time / 1440) + 1}) 💾` : `Rumah ${code} siap!`, 'good', true);
  if (fresh || !best) {
    g.ui.modal(`<h2>Rumah berdua siap! 🏡</h2><p>Kamu main sebagai <b>${me}</b>. Kode rumah ini <b>tetap</b> — pasangan cukup masuk pakai kode yang sama kapan saja.</p>
      <div class="code">${code}</div><input class="linkbox" readonly value="${link}">
      <div class="mbtns row"><button class="btn" id="cpy">Salin link</button><button class="btn" id="vc1">🎙️ Nyalakan suara</button><button class="btn ghost" data-close>Main dulu</button></div>
      <p class="muted small">Siapa pun yang online duluan otomatis jadi "server". Kalau salah satu keluar, progres tersimpan dan yang lain tetap bisa lanjut.</p>`);
    document.getElementById('vc1').onclick = () => { g.ui.voiceToggle(); g.ui.closeModal(); };
    document.getElementById('cpy').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(link); if (navigator.share) navigator.share({ title: 'Main rumah kita yuk', url: link }).catch(() => {}); };
  }
}
function startGuest(net, code, m) {
  const g = start({ mode: 'guest', mySims: m.mySims, net, slot: 'room:' + code });
  g.roomCode = code; roomLoop(g);
  net.onMsg = (x) => g.onNet(x);
  g.ui.toast(`Masuk rumah ${code} sebagai ${m.mySims[0]} 💞`, 'good', true);
  net.onClose = () => takeOver(g, code);
}
// host keluar → tamu mengambil alih dengan progres terakhir yang ia terima
async function takeOver(g, code) {
  if (g._taking) return; g._taking = true;
  g.ui.toast('Host terputus… mencoba menyambung lagi / mengambil alih rumah ⏳', 'info', true);
  const me = g.mySims.find((n) => SIM_NAMES.includes(n)) || 'Naswa'; const other = SIM_NAMES.find((n) => n !== me);
  for (let i = 0; i < 10; i++) {
    await sleep(i ? 4000 : 2500);
    const n1 = new Net(uid());
    const back = await new Promise((res) => { let d = false; n1.onMsg = (m) => { if (m.t === 'welcome' && !d) { d = true; res(true); } }; n1.join(code, { role: me }).catch(() => { if (!d) { d = true; res(false); } }); setTimeout(() => { if (!d) { d = true; res(false); } }, 8000); });
    if (back) { g.net = n1; n1.onMsg = (x) => g.onNet(x); n1.onClose = () => { g._taking = false; takeOver(g, code); }; g._taking = false; g.ui.toast('Tersambung lagi ke host ✅', 'good'); return; }
    n1.destroy();
    const n2 = new Net(uid());
    try { await n2.host(code); g.becomeHost(n2); hostHandlers(g, n2, other); g._taking = false; g.ui.toast(`Kamu sekarang jadi host rumah ${code} 🏠 — progres tetap aman`, 'good', true); return; } catch (e) { n2.destroy(); }
  }
  g.ui.modal('<h2>Koneksi terputus</h2><p>Tidak bisa menyambung ke rumah berdua. Progres terakhir sudah disimpan di perangkat ini.</p><button class="btn" onclick="location.reload()">Kembali ke menu</button>');
}
