// ============================================================
//  Menu utama — SATU DUNIA SAJA, hanya untuk dimainkan berdua.
//  · Akunmu  -> selalu masuk sebagai HANDOYO
//  · Akun Naswa -> selalu masuk sebagai NASWA
//    (peran diklaim sekali, lalu terikat permanen ke akun — tidak bisa tertukar)
//  · Siapa pun yang online lebih dulu otomatis menjadi "server" dunia.
//  · Yang sedang offline karakternya dijalankan komputer (kehendak bebas).
//  · Progres satu dunia itu disimpan terus-menerus ke cloud + perangkat.
// ============================================================
import { Game, readSave, clearSave } from './game.js';
import { UI } from './ui.js';
import { Net, setNetConfig } from './net.js';
import { SIM_NAMES } from './data.js';
import {
  Acct, DUNIA, PERAN, probe, auth, logout, cloud, masuk,
  klaimPeran, lepasPeran, masukDunia, siapaDiDunia, muatDunia, simpanDunia, beat, resetDunia, bacaLokal,
} from './account.js';

const $ = (s) => document.querySelector(s);
const lobby = $('#lobby'), status = $('#lStatus');
const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 760;
const quality = { low: mobile, shadows: !mobile, shadowSize: mobile ? 1024 : 2048 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (Acct.session && Acct.session.user) || (localStorage.getItem('griyaasri-uid') || (() => { const u = 'tamu-' + Math.random().toString(36).slice(2, 8); try { localStorage.setItem('griyaasri-uid', u); } catch (e) { /* abaikan */ } return u; })());

function showPane(p) { document.querySelectorAll('.lpane').forEach((x) => (x.hidden = x.dataset.p !== p)); status.textContent = ''; if (p === 'peran') renderPeran(); if (p === 'dunia') renderDunia(); }
function setStatus(t, bad) { status.textContent = t; status.classList.toggle('bad', !!bad); }
document.querySelectorAll('[data-pane]').forEach((b) => b.addEventListener('click', () => showPane(b.dataset.pane)));

// ---------------------------------------------------------------- awal
(async () => {
  setStatus('Memeriksa server…');
  await probe(); setNetConfig(Acct.config);
  $('#lDbInfo').textContent = Acct.db
    ? '✅ Tersambung ke database cloud — satu dunia bersama, progres tersimpan otomatis dan bisa dilanjutkan dari laptop mana pun.'
    : 'ℹ️ Database cloud belum diatur di server. Akun & progres disimpan di laptop ini saja (lihat PANDUAN-SETUP.md untuk mengaktifkan database).';
  setStatus('');
  if (masuk() && (Acct.session.local || Acct.db)) await lanjutSetelahMasuk(); else showPane('login');
})();

async function lanjutSetelahMasuk() {
  if (!Acct.peran) { try { await siapaDiDunia(); } catch (e) { /* abaikan */ } showPane(Acct.peran ? 'dunia' : 'peran'); }
  else showPane('dunia');
}
async function doAuth(a) {
  const u = $('#lUser').value, p = $('#lPin').value;
  setStatus(a === 'register' ? 'Mendaftarkan akun…' : 'Masuk…');
  try { await auth(a, u, p); setStatus(''); await lanjutSetelahMasuk(); } catch (e) { setStatus(e.message, true); }
}
$('#lLogin').addEventListener('click', () => doAuth('login'));
$('#lReg').addEventListener('click', () => doAuth('register'));
$('#lPin').addEventListener('keydown', (e) => { if (e.key === 'Enter') doAuth('login'); });
document.querySelectorAll('.lOut').forEach((b) => b.addEventListener('click', () => { logout(); showPane('login'); }));

// ---------------------------------------------------------------- pilih peran (sekali saja)
async function renderPeran() {
  const t = Acct.terisi || {};
  for (const b of document.querySelectorAll('[data-peran]')) {
    const p = b.dataset.peran; const pemilik = t[p];
    const milikku = pemilik && pemilik === Acct.session.user;
    b.classList.toggle('taken', !!pemilik && !milikku);
    b.querySelector('.st').textContent = milikku ? '✅ ini akunmu' : pemilik ? `sudah dipakai: ${pemilik}` : 'masih kosong';
  }
  $('#lPeranInfo').textContent = 'Pilihan ini permanen: akun ini akan selalu masuk sebagai karakter itu, supaya tidak pernah tertukar.';
}
document.querySelectorAll('[data-peran]').forEach((b) => b.addEventListener('click', async () => {
  setStatus(`Mendaftarkan kamu sebagai ${b.dataset.peran}…`);
  try { await klaimPeran(b.dataset.peran); setStatus(''); showPane('dunia'); } catch (e) { setStatus(e.message, true); await siapaDiDunia(); renderPeran(); }
}));

// ---------------------------------------------------------------- satu dunia
async function renderDunia() {
  $('#lAkun').textContent = `👋 ${Acct.session.user}${cloud() ? ' · ☁️ cloud' : ' · 💾 laptop ini'}`;
  $('#lPeranKu').innerHTML = `Kamu bermain sebagai <b>${esc(Acct.peran || '—')}</b> ${Acct.peran === 'Handoyo' ? '👨‍💻 (suami · programmer)' : Acct.peran === 'Naswa' ? '👩‍🎨 (istri · pelukis)' : ''}`;
  const box = $('#lInfoDunia'); box.innerHTML = '<p class="muted small">Memeriksa dunia…</p>';
  const j = await siapaDiDunia();
  const t = j.terisi || {}; const on = j.online || {}; const m = j.meta || null;
  const lok = bacaLokal();
  const hari = m && m.hari ? m.hari : lok ? Math.floor(lok.world.time / 1440) + 1 : null;
  const onNama = Object.keys(on).map((u) => `${u} (${on[u].peran})`);
  const pasangan = PERAN.find((p) => p !== Acct.peran);
  box.innerHTML = `
    <div class="lworld">
      <b>🏡 ${esc(DUNIA)} · Rumah Handoyo &amp; Naswa</b>
      <span>Satu-satunya dunia. Terus berjalan selama minimal salah satu dari kalian online — progres disimpan otomatis setiap belasan detik.</span>
      <span>${hari ? `📅 Terakhir di <b>hari ke-${hari}</b>` : '✨ Dunia masih baru — kalian akan memulai dari hari pertama'}${m && m.savedAt ? ` · tersimpan ${new Date(m.savedAt).toLocaleString('id-ID')}` : ''}</span>
      <span>👤 Handoyo: <b>${esc(t.Handoyo || 'belum ada')}</b> · 👤 Naswa: <b>${esc(t.Naswa || 'belum ada')}</b></span>
      <span>${onNama.length ? `🟢 Online sekarang: ${esc(onNama.join(', '))}` : `⚪ Belum ada yang online — ${esc(pasangan)} akan dijalankan komputer sampai pasanganmu masuk`}</span>
    </div>`;
}
$('#lMasuk').addEventListener('click', () => masukKeDunia());
$('#lGantiPeran').addEventListener('click', async () => {
  if (!confirm(`Lepas peran ${Acct.peran}? Setelah dilepas kamu bisa memilih lagi, dan pasanganmu bisa mengambil peran ini.`)) return;
  setStatus('Melepas peran…');
  try { await lepasPeran(); setStatus(''); await siapaDiDunia(); showPane('peran'); } catch (e) { setStatus(e.message, true); }
});
$('#lReset').addEventListener('click', async () => {
  if (prompt('Ini akan MENGHAPUS progres dunia kalian berdua dan memulai dari hari ke-1. Ketik HAPUS untuk melanjutkan:') !== 'HAPUS') return;
  setStatus('Menghapus dunia…');
  try { await resetDunia(); clearSave(); setStatus('Dunia dikosongkan. Tekan "Masuk ke dunia" untuk mulai dari hari ke-1.'); renderDunia(); } catch (e) { setStatus(e.message, true); }
});

// ---------------------------------------------------------------- jalankan game
function start(opts) {
  lobby.classList.add('gone');
  const ui = new UI($('#hud'));
  const game = new Game({ ...opts, ui, quality });
  window.__game = game;
  game.init($('#view')); ui.attach(game); game.bgSim();
  if (opts.gallery && opts.gallery.length) game.hh.gallery = (game.hh.gallery || []).length ? game.hh.gallery : opts.gallery;
  window.addEventListener('beforeunload', () => { if (window.__game) { try { window.__game.net && window.__game.net.send({ t: 'bye' }); } catch (e) { /* abaikan */ } window.__game.saveOnExit(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden && window.__game) window.__game.save(true); });
  setTimeout(() => lobby.remove(), 700);
  return game;
}
// detak kehadiran: menandai dunia tetap hidup & memberi tahu pasangan
function duniaLoop(g) {
  const tick = () => beat({ host: g.isHost, hari: Math.floor(g.hh.world.time / 1440) + 1 }).then((live) => { if (live) g.duniaLive = live; });
  tick(); g._beatIv = setInterval(tick, 20000);
}

async function masukKeDunia() {
  setStatus('Menyiapkan dunia…');
  try { await masukDunia(); } catch (e) { return setStatus(e.message, true); }
  if (!Acct.peran) return setStatus('Belum punya peran', true);
  for (let coba = 0; coba < 8; coba++) {
    setStatus(coba ? `Menyambung ulang… (${coba})` : 'Masuk ke dunia…');
    // 1) coba gabung ke pasangan yang sudah jadi server
    const n1 = new Net(uid());
    const hasil = await new Promise((resolve) => {
      let selesai = false; const beres = (v) => { if (!selesai) { selesai = true; resolve(v); } };
      n1.onFull = () => beres('penuh');
      n1.onMsg = (m) => { if (m.t === 'welcome') beres(m); };
      n1.join(DUNIA, { peran: Acct.peran, user: Acct.session.user }).catch((e) => beres(e));
      setTimeout(() => beres(new Error('timeout')), 14000);
    });
    if (hasil === 'penuh') { n1.destroy(); return setStatus('Dunia sedang dipegang dua sesi lain. Tutup tab lamamu lalu coba lagi.', true); }
    if (hasil && hasil.t === 'welcome') return mulaiTamu(n1, hasil);
    n1.destroy();
    // 2) belum ada server -> kita yang jadi server
    const n2 = new Net(uid());
    try { await n2.host(DUNIA); return mulaiHost(n2); } catch (e) {
      n2.destroy();
      if (e.type === 'unavailable-id') { setStatus('Menunggu sesi lama dilepas server… ⏳'); await sleep(4000); continue; }
      return setStatus('Gagal: ' + e.message, true);
    }
  }
  setStatus('Tidak bisa masuk. Periksa koneksi internet lalu coba lagi.', true);
}

function hostHandlers(g, net, pasangan) {
  net.onMsg = (m) => g.onNet(m);
  net.onOpen = () => {
    g.peerOnline = true; g.hh.sims[pasangan].autonomy = false; g.hh.sims[pasangan].dijalankanKomputer = false;
    g.ui.toast(`${pasangan} masuk — sekarang kalian main bersama 💞`, 'good', true);
    g.ui.refresh();
    if (g.ui.voiceOn) setTimeout(() => net.callRemote(), 1000);
  };
  net.onClose = () => {
    if (!g.peerOnline) return;
    g.peerOnline = false; g.hh.sims[pasangan].autonomy = true; g.hh.sims[pasangan].dijalankanKomputer = true;
    g.save(true); g.ui.refresh();
    g.ui.toast(`${pasangan} keluar — progres tersimpan, ${pasangan} dijalankan komputer 🤖`, 'info', true);
  };
}
async function mulaiHost(net) {
  setStatus('Memuat progres dunia…');
  const best = await muatDunia();
  const aku = Acct.peran; const pasangan = SIM_NAMES.find((n) => n !== aku);
  // pindahkan simpanan versi lama (solo) kalau dunia masih kosong
  let data = best && best.data;
  let pindahan = false;
  if (!data) { const lama = readSave(); if (lama && lama.world) { data = lama; pindahan = true; } }
  const g = start({ mode: 'host', mySims: [aku, 'Oyen', 'Kapi'], net, save: data, gallery: (best && best.gallery) || [] });
  g.peran = aku; g.pasangan = pasangan; g.duniaKode = DUNIA; g.roomCode = DUNIA;
  g.hh.sims[pasangan].autonomy = true; g.hh.sims[pasangan].dijalankanKomputer = true;
  hostHandlers(g, net, pasangan); duniaLoop(g);
  g.save(true);
  g.ui.toast(
    data
      ? `Dunia dimuat${pindahan ? ' dari simpanan lamamu' : ` dari ${best.dari}`} — hari ke-${Math.floor(data.world.time / 1440) + 1} 💾. Kamu ${aku}, ${pasangan} dijalankan komputer sampai dia masuk.`
      : `Selamat datang di Griya Asri! Kamu ${aku}. ${pasangan} dijalankan komputer sampai dia masuk 🤖`,
    'good', true,
  );
}
function mulaiTamu(net, m) {
  const aku = Acct.peran;
  const punyaku = (m.mySims && m.mySims.includes(aku)) ? m.mySims : [aku];
  // pasang penangan putus SEBELUM game dibangun: kalau sambungan mati tepat
  // setelah salaman, pemain tidak boleh tertinggal diam tanpa server.
  let G = null; let putus = false;
  net.onClose = () => { putus = true; if (G) ambilAlih(G); };
  const g = start({ mode: 'guest', mySims: [...punyaku, 'Oyen', 'Kapi'], net });
  G = g;
  g.peran = aku; g.pasangan = SIM_NAMES.find((n) => n !== aku); g.duniaKode = DUNIA; g.roomCode = DUNIA;
  g.linkHilang = () => ambilAlih(g);                 // penjaga: dipanggil engine kalau jalur mati
  duniaLoop(g);
  net.onMsg = (x) => g.onNet(x);
  g.ui.toast(`Masuk dunia sebagai ${aku} 💞 — pasanganmu sedang jadi server`, 'good', true);
  if (putus) ambilAlih(g);
}
// server (pasangan) keluar → kita ambil alih dengan progres terakhir yang diterima
async function ambilAlih(g) {
  if (g._ambil) return; g._ambil = true;
  g.ui.toast('Pasanganmu terputus… mencoba menyambung lagi / mengambil alih dunia ⏳', 'info', true);
  const aku = g.peran || 'Naswa'; const pasangan = SIM_NAMES.find((n) => n !== aku);
  for (let i = 0; i < 10; i++) {
    await sleep(i ? 4000 : 2500);
    const n1 = new Net(uid());
    const kembali = await new Promise((res) => {
      let d = false; const b = (v) => { if (!d) { d = true; res(v); } };
      n1.onMsg = (m) => { if (m.t === 'welcome') b(true); };
      n1.join(DUNIA, { peran: aku, user: Acct.session && Acct.session.user }).catch(() => b(false));
      setTimeout(() => b(false), 8000);
    });
    if (kembali) { g.net = n1; g.linkHilang = () => ambilAlih(g); n1.onMsg = (x) => g.onNet(x); n1.onClose = () => { g._ambil = false; ambilAlih(g); }; g._ambil = false; g.ui.toast('Tersambung lagi ke pasanganmu ✅', 'good'); return; }
    n1.destroy();
    const n2 = new Net(uid());
    try {
      await n2.host(DUNIA); g.becomeHost(n2); hostHandlers(g, n2, pasangan); g._ambil = false;
      g.hh.sims[pasangan].dijalankanKomputer = true; g.ui.refresh();
      g.ui.toast(`Sekarang kamu yang menjalankan dunia 🏠 — progres aman, ${pasangan} dijalankan komputer`, 'good', true);
      return;
    } catch (e) { n2.destroy(); }
  }
  g.ui.modal('<h2>Koneksi terputus</h2><p>Tidak bisa menyambung ke dunia. Progres terakhir sudah disimpan di laptop ini dan akan dikirim ke server saat tersambung lagi.</p><button class="btn" onclick="location.reload()">Kembali ke menu</button>');
}
