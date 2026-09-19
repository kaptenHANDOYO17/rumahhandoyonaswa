// Menu utama: main sendiri / buat room / gabung room
import { Game, readSave, clearSave } from './game.js';
import { UI } from './ui.js';
import { Net, makeCode } from './net.js';
import { SIM_NAMES } from './data.js';

const $ = (s) => document.querySelector(s);
const lobby = $('#lobby'), status = $('#lStatus');
const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 760;
const quality = { low: mobile, shadows: !mobile, shadowSize: mobile ? 1024 : 2048 };
let chosen = 'Handoyo';

const save = readSave();
if (save) {
  const d = Math.floor(save.world.time / 1440) + 1;
  $('#lContinue').hidden = false; $('#lContinue small').textContent = `Hari ke-${d} · ${new Intl.NumberFormat('id-ID').format(Math.round(save.world.money))} rupiah`;
}
const params = new URLSearchParams(location.search);
if (params.get('room')) { $('#lCode').value = params.get('room').toUpperCase(); showPane('join'); }

document.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => {
  chosen = b.dataset.pick; document.querySelectorAll('[data-pick]').forEach((x) => x.classList.toggle('on', x === b));
}));
document.querySelectorAll('[data-pane]').forEach((b) => b.addEventListener('click', () => showPane(b.dataset.pane)));
function showPane(p) { document.querySelectorAll('.lpane').forEach((x) => (x.hidden = x.dataset.p !== p)); status.textContent = ''; }

function setStatus(t, bad) { status.textContent = t; status.classList.toggle('bad', !!bad); }

function start(opts) {
  lobby.classList.add('gone');
  const ui = new UI($('#hud'));
  const game = new Game({ ...opts, ui, quality });
  window.__game = game;
  game.init($('#view'));
  ui.attach(game);
  if (opts.after) opts.after(game);
  setTimeout(() => lobby.remove(), 700);
  return game;
}

$('#lSolo').addEventListener('click', () => {
  clearSaveIfNew();
  const g = start({ mode: 'solo', mySims: [...SIM_NAMES, 'Oyen', 'Kapi'] });
  g.ui.toast('Selamat datang di Perumahan Griya Asri! Klik benda atau pasangan untuk mulai 🏡', 'good', true);
});
function clearSaveIfNew() { /* permainan baru tidak menghapus simpanan sampai tersimpan ulang */ }
$('#lCapy').addEventListener('click', () => {
  const s = readSave();
  const g = start({ mode: 'solo', mySims: ['Kapi', 'Oyen', ...SIM_NAMES], save: s || undefined });
  g.switchSim('Kapi');
  g.ui.toast('Kamu sekarang Kapi si capybara 🦫 — klik kolam buat berendam, klik dirimu buat chill pakai jeruk!', 'good', true);
});
$('#lContinue').addEventListener('click', () => {
  const s = readSave(); if (!s) return;
  const mode = $('#lContinue').dataset.mode || 'solo';
  const g = start({ mode: 'solo', mySims: [...SIM_NAMES, 'Oyen', 'Kapi'], save: s });
  g.ui.toast('Permainan dilanjutkan 💾', 'info');
  void mode;
});
$('#lNew').addEventListener('click', () => { if (confirm('Hapus simpanan lama dan mulai baru?')) { clearSave(); location.reload(); } });

// ---------- host ----------
$('#lHost').addEventListener('click', async () => {
  const net = new Net(); const code = makeCode();
  const useSave = $('#lHostSave').checked ? readSave() : null;
  setStatus('Membuat room…');
  try { await net.host(code); } catch (e) { setStatus('Gagal membuat room: ' + e.message, true); return; }
  const me = chosen; const other = SIM_NAMES.find((n) => n !== me);
  const g = start({ mode: 'host', mySims: [me, 'Oyen', 'Kapi'], net, save: useSave });
  g.roomCode = code;
  g.hh.sims[other].autonomy = true;
  net.onMsg = (m) => g.onNet(m);
  net.onOpen = () => { g.peerOnline = true; g.ui.toast(`Pasangan bergabung sebagai ${other}! 💞`, 'good', true); };
  net.onClose = () => { g.peerOnline = false; g.hh.sims[other].autonomy = true; g.ui.toast(`Pemain ${other} terputus — ${other} jalan otomatis dulu`, 'bad', true); };
  const link = `${location.origin}${location.pathname}?room=${code}`;
  g.ui.modal(`<h2>Room siap!</h2><p>Kamu main sebagai <b>${me}</b>. Minta pasangan membuka link ini di HP/laptopnya:</p>
    <div class="code">${code}</div><input class="linkbox" readonly value="${link}">
    <div class="mbtns row"><button class="btn" id="cpy">Salin link</button><button class="btn" id="vc1">🎙️ Nyalakan suara</button><button class="btn ghost" data-close>Main dulu</button></div>
    <p class="muted small">Game tetap jalan saat menunggu. ${other} dikendalikan otomatis sampai pasangan masuk.</p>`);
  document.getElementById('vc1').onclick = () => { g.ui.voiceToggle(); g.ui.closeModal(); };
  document.getElementById('cpy').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(link); if (navigator.share) navigator.share({ title: 'Main rumah kita yuk', url: link }).catch(() => {}); };
});

// ---------- gabung ----------
$('#lJoin').addEventListener('click', async () => {
  const code = $('#lCode').value.trim().toUpperCase();
  if (code.length < 4) return setStatus('Masukkan kode room dari pasangan', true);
  const net = new Net(); setStatus('Menyambung ke room ' + code + '…');
  try { await net.join(code); } catch (e) { setStatus(e.message, true); return; }
  setStatus('Terhubung! Menunggu data rumah…');
  let game = null;
  net.onMsg = (m) => {
    if (m.t === 'full') { setStatus('Room sudah penuh (2 pemain).', true); return; }
    if (m.t === 'welcome' && !game) {
      game = start({ mode: 'guest', mySims: m.mySims, net });
      game.ui.toast(`Kamu main sebagai ${m.mySims[0]} 💞`, 'good', true);
      game.ui.modal(`<h2>Sudah masuk room! 💞</h2><p>Kamu jadi <b>${m.mySims[0]}</b>. Kamu juga bisa mengendalikan Oyen si kucing & Kapi si capybara (klik foto mereka di panel).</p><p>Mau ngobrol pakai suara sambil main?</p>
        <div class="mbtns row"><button class="btn ghost" data-close>Nanti saja</button><button class="btn" id="vc2">🎙️ Nyalakan suara</button></div>`);
      document.getElementById('vc2').onclick = () => { game.ui.voiceToggle(); game.ui.closeModal(); };
      return;
    }
    if (game) game.onNet(m);
  };
  net.onClose = () => { if (game) game.ui.modal('<h2>Koneksi terputus</h2><p>Host menutup permainan atau jaringan terputus.</p><button class="btn" onclick="location.reload()">Kembali ke menu</button>'); else setStatus('Koneksi ditutup', true); };
  net.send({ t: 'hello' });
});
