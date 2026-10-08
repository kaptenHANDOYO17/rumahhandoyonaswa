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
import { RelayNet } from './relay.js';
import { SIM_NAMES } from './data.js';
import {
  Acct, DUNIA, PERAN, probe, auth, logout, cloud, masuk,
  klaimPeran, lepasPeran, masukDunia, siapaDiDunia, muatDunia, beat, resetDunia, bacaLokal,
} from './account.js';

const $ = (s) => document.querySelector(s);
const lobby = $('#lobby'), status = $('#lStatus');
const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 760;
const quality = { low: mobile, shadows: !mobile, shadowSize: mobile ? 1024 : 2048 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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


// ================================================================
//  MENJALANKAN GAME & MENYAMBUNGKAN DUA LAPTOP
//
//  Dulu kedua laptop berebut SATU identitas koneksi (griyaasri-hn-HNDNS),
//  jadi siapa pun yang masuk belakangan selalu ditolak dan tersangkut di
//  lobi — dan setelah keluar, identitasnya masih tertahan di server sinyal
//  sampai semenit, sehingga ia sendiri pun tidak bisa masuk lagi.
//
//  Sekarang:
//   · tiap pemain mendaftarkan identitas koneksi SENDIRI yang unik;
//   · database yang memutuskan siapa menjalankan dunia, bukan siapa cepat;
//   · kalau koneksi langsung diblokir jaringan, keduanya tetap masuk ke
//     dunia yang sama lewat relay di server.
// ================================================================
const PREFIX_ID = 'griyaasri-hn-' + DUNIA + '-';
const akuUser = () => (Acct.session && Acct.session.user) || '';

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

// Detak kehadiran: menandai dunia tetap hidup, mengumumkan identitas koneksi kita,
// dan memberi tahu siapa yang sedang menjalankan dunia.
function duniaLoop(g) {
  const tick = async () => {
    const j = await beat({
      peerId: g.peerId || null,
      mode: g.net && g.net.relay ? 'relay' : 'p2p',
      host: g.isHost, minta: g.isHost,
      hari: Math.floor(g.hh.world.time / 1440) + 1,
    });
    if (!j) return;
    if (g._aturBeat) g._aturBeat();
    g.duniaLive = j.live; g.pasanganInfo = j.pasangan;
    // Dunia tidak boleh terbelah dua. Kalau database bilang pasangan kita yang
    // menjalankan dunia padahal kita juga merasa server, kita yang mengalah
    // dan menyambung ke dia — supaya progres tetap satu.
    if (g.isHost && j.server && j.server !== akuUser() && !g._mengalah) {
      g._mengalah = true;
      g.save(true);                      // simpan dulu sebelum mengalah, jangan sampai ada yang hilang
      g.ui.toast(`${g.pasangan} sudah menjalankan dunia — menyambung ke dunianya supaya progres tetap satu…`, 'info', true);
      ambilAlih(g); return;
    }
    if (!g.isHost) g._mengalah = false;
    // Pasangan terdeteksi online tapi tak kunjung tersambung langsung?
    // Server menjemputnya lewat relay supaya mereka tetap satu dunia.
    if (g.isHost && !g.peerOnline && !(g.net && g.net.relay)) nyalakanRelayHost(g);
  };
  const atur = () => {
    const perlu = g.peerOnline ? 15000 : 5000;        // rapat saat menunggu, longgar saat sudah berdua
    if (g._beatMs === perlu) return;
    g._beatMs = perlu; clearInterval(g._beatIv); g._beatIv = setInterval(tick, perlu);
  };
  tick(); atur(); g._aturBeat = atur;
}

// ---------------- penangan sambungan ----------------
function siapkanHost(g, net, aku, pasangan, idKu) {
  g.peran = aku; g.pasangan = pasangan; g.duniaKode = DUNIA; g.roomCode = DUNIA; g.peerId = idKu || null;
  g.hh.sims[pasangan].autonomy = true; g.hh.sims[pasangan].dijalankanKomputer = true;
  hostHandlers(g, net, pasangan);
  duniaLoop(g);
  g.save(true);
}
function hostHandlers(g, net, pasangan) {
  net.onMsg = (m) => g.onNet(m);
  net.onOpen = () => {
    g.peerOnline = true; g._sent = null;
    g.hh.sims[pasangan].autonomy = false; g.hh.sims[pasangan].dijalankanKomputer = false;
    g.ui.toast(`${pasangan} masuk — sekarang kalian main bersama 💞`, 'good', true);
    g.ui.refresh();
    if (g.ui.voiceOn && net.callRemote) setTimeout(() => net.callRemote(), 1000);
  };
  net.onClose = () => {
    if (!g.peerOnline) return;
    g.peerOnline = false; g.hh.sims[pasangan].autonomy = true; g.hh.sims[pasangan].dijalankanKomputer = true;
    g.save(true); g.ui.refresh();
    g.ui.toast(`${pasangan} keluar — progres tersimpan, ${pasangan} dijalankan komputer 🤖`, 'info', true);
  };
}
function siapkanTamu(g, net, aku, idKu) {
  g.peran = aku; g.pasangan = SIM_NAMES.find((n) => n !== aku); g.duniaKode = DUNIA; g.roomCode = DUNIA; g.peerId = idKu || null;
  g.linkHilang = () => ambilAlih(g);
  net.onMsg = (x) => g.onNet(x);
  net.onClose = () => ambilAlih(g);
  duniaLoop(g);
}

// ---------------- masuk ke dunia ----------------
async function masukKeDunia() {
  setStatus('Menyiapkan dunia…');
  try { await masukDunia(); } catch (e) { return setStatus(e.message, true); }
  const aku = Acct.peran;
  if (!aku) return setStatus('Belum punya peran', true);
  const pasangan = SIM_NAMES.find((n) => n !== aku);

  // 1 — daftarkan identitas koneksi SENDIRI. Akhiran acak membuat sesi lama
  //     yang belum dilepas server sinyal tidak pernah menghalangi.
  const idKu = PREFIX_ID + aku + '-' + Math.random().toString(36).slice(2, 6);
  const net = new Net(akuUser() || idKu); net.myId = idKu;
  setStatus('Mendaftarkan sambungan…');
  let terdaftar = false;
  for (let c = 0; c < 2 && !terdaftar; c++) {
    try { await net.daftar(c ? idKu + c : idKu); terdaftar = true; } catch (e) { if (c) { net.destroy(); return masukLewatRelay(aku, pasangan, `Server sinyal tidak bisa dihubungi (${e.message}).`); } }
  }

  // 2 — tanya database siapa yang sedang menjalankan dunia
  setStatus('Memeriksa siapa yang sedang online…');
  const j = await beat({ peerId: net.peerId, mode: 'p2p', minta: false, hari: 0 });
  if (!j) { net.destroy(); return setStatus('Database tidak bisa dihubungi. Periksa koneksi internet lalu coba lagi.', true); }
  const serverLain = j.server && j.server !== akuUser();
  const idPasangan = serverLain && j.pasangan ? j.pasangan.peerId : null;

  // 3a — pasangan sudah di dalam: kita yang menyambung ke dia
  if (serverLain && idPasangan) {
    for (let coba = 0; coba < 3; coba++) {
      setStatus(`Menyambung ke ${pasangan}…${coba ? ` (percobaan ${coba + 1}/3)` : ''}`);
      const hasil = await sambungKe(net, idPasangan, aku);
      if (hasil === 'penuh') { net.destroy(); return setStatus('Dunia sedang dipegang dua sesi lain. Tutup tab lamamu lalu coba lagi.', true); }
      if (hasil && hasil.t === 'welcome') return mulaiTamu(net, hasil, aku, idKu);
      await sleep(1200);
    }
    net.destroy();
    return masukLewatRelay(aku, pasangan, `Koneksi langsung ke laptop ${pasangan} diblokir jaringan.`);
  }

  // 3b — belum ada yang menjalankan dunia: kita yang jadi server
  setStatus('Memuat progres dunia…');
  const k = await beat({ peerId: net.peerId, mode: 'p2p', minta: true, host: true, hari: 0 });
  if (k && k.server && k.server !== akuUser() && k.pasangan && k.pasangan.peerId) {
    // pasangan menang undian di detik yang sama → kita jadi tamu saja
    const hasil = await sambungKe(net, k.pasangan.peerId, aku);
    if (hasil && hasil.t === 'welcome') return mulaiTamu(net, hasil, aku, idKu);
  }
  return mulaiHost(net, aku, pasangan, idKu);
}
function sambungKe(net, idTujuan, aku) {
  return new Promise((resolve) => {
    let selesai = false; const beres = (v) => { if (!selesai) { selesai = true; resolve(v); } };
    net.onFull = () => beres('penuh');
    net.onMsg = (m) => { if (m.t === 'welcome') beres(m); };
    net.sambung(idTujuan, { peran: aku, user: akuUser() }).catch((e) => beres(e));
    setTimeout(() => beres(new Error('timeout')), 10000);
  });
}

async function mulaiHost(net, aku, pasangan, idKu) {
  const best = await muatDunia();
  let data = best && best.data; let pindahan = false;
  if (!data) { const lama = readSave(); if (lama && lama.world) { data = lama; pindahan = true; } }
  const g = start({ mode: 'host', mySims: [aku, 'Oyen', 'Kapi'], net, save: data, gallery: (best && best.gallery) || [] });
  siapkanHost(g, net, aku, pasangan, idKu);
  g.ui.toast(
    data
      ? `Dunia dimuat${pindahan ? ' dari simpanan lamamu' : ` dari ${best.dari}`} — hari ke-${Math.floor(data.world.time / 1440) + 1} 💾. Kamu ${aku}, ${pasangan} dijalankan komputer sampai dia masuk.`
      : `Selamat datang di Griya Asri! Kamu ${aku}. ${pasangan} dijalankan komputer sampai dia masuk 🤖`,
    'good', true,
  );
}
function mulaiTamu(net, m, aku, idKu) {
  const punyaku = (m.mySims && m.mySims.includes(aku)) ? m.mySims : [aku];
  const g = start({ mode: 'guest', mySims: [...punyaku, 'Oyen', 'Kapi'], net });
  siapkanTamu(g, net, aku, idKu);
  g.ui.toast(`Masuk dunia sebagai ${aku} 💞 — ${g.pasangan} sedang menjalankan dunia`, 'good', true);
}

// ---------------- jalan cadangan: lewat server (relay) ----------------
async function masukLewatRelay(aku, pasangan, alasan) {
  setStatus('Mencoba lewat server…');
  const j = await beat({ mode: 'relay', minta: false, hari: 0 });
  if (j && j.server && j.server !== akuUser()) {
    const net = new RelayNet({ sebagai: 'guest', peran: aku });
    const g = start({ mode: 'guest', mySims: [aku, 'Oyen', 'Kapi'], net });
    siapkanTamu(g, net, aku, null);
    net.send({ t: 'hello', uid: akuUser(), peran: aku, relay: true });
    g.ui.toast(`${alasan} Kalian tetap main di dunia yang sama lewat server 🛰️ — gerakan terasa sedikit lebih lambat dan obrolan suara tidak tersedia di mode ini.`, 'info', true);
    return;
  }
  const best = await muatDunia();
  const net = new RelayNet({ sebagai: 'host', peran: aku });
  const g = start({ mode: 'host', mySims: [aku, 'Oyen', 'Kapi'], net, save: best && best.data, gallery: (best && best.gallery) || [] });
  siapkanHost(g, net, aku, pasangan, null);
  g.ui.toast(`${alasan} Kamu menjalankan dunia; ${pasangan} akan menyusul lewat server 🛰️`, 'info', true);
}
// Server menjemput pasangan lewat relay kalau ia terdeteksi online
// tapi koneksi langsung tak kunjung terbentuk.
function nyalakanRelayHost(g) {
  if (g._relayHost) return; g._relayHost = true;
  const relay = new RelayNet({ sebagai: 'host', peran: g.peran });
  relay.onMsg = (m) => g.onNet(m);
  relay.onOpen = () => {
    const lama = g.net; g.net = relay; g._sent = null;
    try { lama && lama.relay !== true && lama.destroy && lama.destroy(); } catch (e) { /* abaikan */ }
    g.peerOnline = true;
    g.hh.sims[g.pasangan].autonomy = false; g.hh.sims[g.pasangan].dijalankanKomputer = false;
    g.ui.toast(`${g.pasangan} masuk lewat server 🛰️ — kalian tetap main di dunia yang sama.`, 'good', true);
    g.ui.refresh();
  };
  relay.onClose = () => {
    if (g.net !== relay) return;
    g._relayHost = false;
    g.peerOnline = false;
    g.hh.sims[g.pasangan].autonomy = true; g.hh.sims[g.pasangan].dijalankanKomputer = true;
    g.save(true); g.ui.refresh();
  };
}

// ---------------- pasangan terputus: sambung ulang / ambil alih ----------------
async function ambilAlih(g) {
  if (g._ambil) return; g._ambil = true;
  g.ui.toast('Pasanganmu terputus… mencoba menyambung lagi ⏳', 'info', true);
  const aku = g.peran || 'Naswa'; const pasangan = SIM_NAMES.find((n) => n !== aku);
  for (let i = 0; i < 8; i++) {
    await sleep(i ? 4000 : 2500);
    const j = await beat({ peerId: g.peerId, mode: g.net && g.net.relay ? 'relay' : 'p2p', minta: false, hari: Math.floor(g.hh.world.time / 1440) + 1 });
    // pasangan masih menjalankan dunia → sambung lagi ke identitas koneksinya
    if (j && j.server && j.server !== akuUser() && j.pasangan && j.pasangan.peerId) {
      const n1 = new Net(akuUser()); n1.myId = (g.peerId || PREFIX_ID + aku) + '-r' + i;
      const hasil = await sambungKe(n1, j.pasangan.peerId, aku);
      if (hasil && hasil.t === 'welcome') {
        try { g.net && g.net.destroy && g.net.destroy(); } catch (e) { /* abaikan */ }
        g.net = n1; siapkanTamu(g, n1, aku, n1.myId); clearInterval(g._beatIv); duniaLoop(g);
        g._ambil = false; g.ui.toast('Tersambung lagi ke pasanganmu ✅', 'good'); return;
      }
      n1.destroy();
    }
    // tidak ada server lain → kita yang ambil alih dunia
    if (!j || !j.server || j.server === akuUser()) {
      const idBaru = PREFIX_ID + aku + '-' + Math.random().toString(36).slice(2, 6);
      const n2 = new Net(akuUser()); n2.myId = idBaru;
      try {
        await n2.daftar(idBaru);
        await beat({ peerId: idBaru, mode: 'p2p', minta: true, host: true, hari: Math.floor(g.hh.world.time / 1440) + 1 });
        try { g.net && g.net.destroy && g.net.destroy(); } catch (e) { /* abaikan */ }
        g.becomeHost(n2); g.peerId = idBaru;
        hostHandlers(g, n2, pasangan); clearInterval(g._beatIv); duniaLoop(g);
        g.hh.sims[pasangan].dijalankanKomputer = true; g.ui.refresh();
        g._ambil = false;
        g.ui.toast(`Sekarang kamu yang menjalankan dunia 🏠 — progres aman, ${pasangan} dijalankan komputer`, 'good', true);
        return;
      } catch (e) { n2.destroy(); }
    }
  }
  // benar-benar tidak bisa P2P: lanjut lewat server supaya tetap bisa main
  g._ambil = false;
  if (!(g.net && g.net.relay)) {
    const jj = await beat({ peerId: g.peerId, mode: 'relay', minta: false, hari: Math.floor(g.hh.world.time / 1440) + 1 });
    const akuTamu = !!(jj && jj.server && jj.server !== akuUser());
    const relay = new RelayNet({ sebagai: akuTamu ? 'guest' : 'host', peran: aku });
    try { g.net && g.net.destroy && g.net.destroy(); } catch (e) { /* abaikan */ }
    g.net = relay;
    if (akuTamu) {
      g.mode = 'guest'; g.snapBase = null; g._mengalah = false;
      siapkanTamu(g, relay, aku, g.peerId);
      relay.send({ t: 'hello', uid: akuUser(), peran: aku, relay: true });
      g.ui.toast(`Dialihkan lewat server 🛰️ — kamu bergabung ke dunia yang dijalankan ${pasangan}. Progres tetap satu.`, 'info', true);
    } else {
      g.mode = 'host';
      hostHandlers(g, relay, pasangan);
      g.ui.toast('Koneksi langsung tidak bisa dipulihkan — dialihkan lewat server 🛰️. Progres tetap aman.', 'info', true);
    }
    clearInterval(g._beatIv); duniaLoop(g);
  }
}
