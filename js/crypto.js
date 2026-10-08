// ============================================================
//  KRIPTO — portofolio Handoyo & Naswa
//  Harga acuan akhir September 2026 (BTC ±$84–85 rb, ETH ±$3,6 rb, SOL ±$115),
//  lalu diskalakan agar 1 BTC = Rp 5.000.000.000 sesuai permintaan pemilik rumah.
//  Harga bergerak naik-turun tiap jam game (random walk + tren + berita acak),
//  dan aset bisa dicairkan kapan saja jadi uang tunai.
// ============================================================
import { MOODLETS, fmtRp, clamp } from './data.js';

export const COINS = [
  { k: 'BTC', n: 'Bitcoin', usd: 85000, vol: 0.016, warna: '#f7931a' },
  { k: 'ETH', n: 'Ethereum', usd: 3600, vol: 0.022, warna: '#8a92b2' },
  { k: 'SOL', n: 'Solana', usd: 115, vol: 0.034, warna: '#14f195' },
  { k: 'BNB', n: 'BNB', usd: 600, vol: 0.024, warna: '#f3ba2f' },
  { k: 'XRP', n: 'XRP', usd: 2.0, vol: 0.030, warna: '#23292f' },
  { k: 'ADA', n: 'Cardano', usd: 0.55, vol: 0.033, warna: '#0033ad' },
  { k: 'DOGE', n: 'Dogecoin', usd: 0.18, vol: 0.045, warna: '#c2a633' },
  { k: 'IDRT', n: 'Rupiah Token (stabil)', usd: 0.0000606, vol: 0.0006, warna: '#2e7d32' },
];
const BTC_IDR = 5000000000;                       // 1 BTC = Rp 5 miliar (patokan pemilik rumah)
export const hargaAwal = (c) => Math.max(1, Math.round(BTC_IDR * (c.usd / 85000)));
const BERITA = [
  ['🟢 ETF kripto baru disetujui regulator', 0.06, 0.12], ['🟢 Adopsi pembayaran ritel meluas di Asia', 0.04, 0.08],
  ['🟢 Institusi besar menambah posisi', 0.05, 0.10], ['🟢 Upgrade jaringan sukses, biaya turun', 0.04, 0.09],
  ['🔴 Bank sentral menaikkan suku bunga', -0.05, -0.10], ['🔴 Bursa besar kena peretasan', -0.07, -0.13],
  ['🔴 Aturan pajak kripto diperketat', -0.04, -0.08], ['🔴 Aksi ambil untung besar-besaran', -0.05, -0.09],
  ['⚪ Pasar sideways, volume tipis', -0.01, 0.01],
];
Object.assign(MOODLETS, {
  cuan: { label: 'Portofolio kripto hijau', emoji: '📈', val: 16, dur: 240 },
  buntung: { label: 'Portofolio kripto merah', emoji: '📉', val: -10, dur: 180 },
});

export function installCrypto(hh) {
  const W = hh.world;
  if (!W.crypto) {
    W.crypto = { harga: {}, riwayat: {}, tren: {}, dompet: {}, log: [], jamTerakhir: -1, modal: {} };
    for (const c of COINS) { const p = hargaAwal(c); W.crypto.harga[c.k] = p; W.crypto.riwayat[c.k] = [p]; W.crypto.tren[c.k] = (Math.random() - 0.45) * 0.004; }
    for (const n of ['Handoyo', 'Naswa']) { W.crypto.dompet[n] = { BTC: 1000 }; W.crypto.modal[n] = 0; }   // saldo awal: 1000 BTC per orang
    W.crypto.log.push({ t: 0, teks: '🪙 Dompet kripto dibuka. Handoyo & Naswa masing-masing menerima 1.000 BTC sebagai dana cadangan keluarga.' });
  }
  hh.cryptoHour = (hr) => cryptoHour(hh, hr);
  hh.cryptoCmd = (c) => cryptoCmd(hh, c);
}
export const nilaiDompet = (W, nama) => Object.entries((W.crypto.dompet[nama] || {})).reduce((a, [k, v]) => a + v * (W.crypto.harga[k] || 0), 0);
export const totalKripto = (W) => ['Handoyo', 'Naswa'].reduce((a, n) => a + nilaiDompet(W, n), 0);

function cryptoHour(hh, hr) {
  const W = hh.world, C = W.crypto; if (!C) return;
  const jam = Math.floor(W.time / 60); if (C.jamTerakhir === jam) return; C.jamTerakhir = jam;
  // berita pasar sesekali (memengaruhi semua koin)
  let shock = 0, berita = null;
  if (Math.random() < 0.08) { const b = BERITA[Math.floor(Math.random() * BERITA.length)]; shock = b[1] + Math.random() * (b[2] - b[1]); berita = b[0]; }
  for (const c of COINS) {
    const stabil = c.k === 'IDRT';
    // tren pelan berubah arah (siklus pasar), ditambah guncangan acak harian
    C.tren[c.k] = clamp((C.tren[c.k] || 0) * 0.99 + (Math.random() - 0.5) * 0.0012, -0.006, 0.008);
    const acak = (Math.random() - 0.5) * 2 * c.vol * 0.33;              // guncangan per jam (±0,5% untuk BTC)
    const jangkar = hargaAwal(c) * 1.25;                                  // pasar cenderung tumbuh pelan ke arah ini
    const tarik = Math.log(jangkar / C.harga[c.k]) * 0.006;               // koreksi lembut, mencegah harga ambles permanen
    const delta = stabil ? (Math.random() - 0.5) * 0.0008 : C.tren[c.k] * 0.5 + acak + tarik + shock * (0.6 + c.vol * 12);
    const lantai = hargaAwal(c) * 0.08;
    C.harga[c.k] = Math.max(lantai, Math.round(C.harga[c.k] * (1 + delta)));
    const r = C.riwayat[c.k]; r.push(C.harga[c.k]); if (r.length > 240) r.shift();
  }
  if (berita) {
    C.log.unshift({ t: W.time, teks: `${berita} — pasar ${shock > 0 ? 'menguat' : shock < 0 ? 'melemah' : 'datar'} ${Math.abs(shock * 100).toFixed(1)}%` });
    if (C.log.length > 30) C.log.pop();
    hh.toast(`📰 Kabar pasar kripto: ${berita}`, shock >= 0 ? 'good' : 'bad');
  }
  // laporan harian pagi hari + suasana hati
  if (hr === 8) {
    const total = totalKripto(W); const r24 = C.riwayat.BTC; const n = r24.length;
    const kemarin = r24[Math.max(0, n - 24)]; const chg = ((C.harga.BTC - kemarin) / kemarin) * 100;
    hh.toast(`🪙 Pasar pagi: BTC ${fmtRp(C.harga.BTC)} (${chg >= 0 ? '+' : ''}${chg.toFixed(2)}% / 24 jam). Total portofolio keluarga ${fmtRp(total)}.`, chg >= 0 ? 'money' : 'info', true);
    for (const h of hh.humans()) h.mood(chg >= 0 ? 'cuan' : 'buntung');
  }
}

function cryptoCmd(hh, c) {
  const W = hh.world, C = W.crypto; const nama = ['Handoyo', 'Naswa'].includes(c.nama) ? c.nama : 'Handoyo';
  const sim = hh.sims[nama]; const coin = COINS.find((x) => x.k === c.coin); if (!sim || !coin) return;
  const harga = C.harga[coin.k]; const dompet = C.dompet[nama] || (C.dompet[nama] = {});
  if (c.op === 'beli') {
    const rupiah = Math.max(0, Math.round(+c.rupiah || 0)); if (rupiah < 10000) return;
    if (sim.wallet < rupiah) return hh.toast(`Saldo ${nama} tidak cukup untuk beli ${fmtRp(rupiah)}`, 'bad');
    const fee = Math.round(rupiah * 0.001); const jumlah = (rupiah - fee) / harga;
    hh.op({ o: 'money', d: -rupiah, why: `Beli ${coin.k}`, sim: nama });
    dompet[coin.k] = (dompet[coin.k] || 0) + jumlah; C.modal[nama] = (C.modal[nama] || 0) + rupiah;
    C.log.unshift({ t: W.time, teks: `🟩 ${nama} beli ${fmt(jumlah)} ${coin.k} @ ${fmtRp(harga)} (fee ${fmtRp(fee)})` });
    hh.sfx('money'); hh.toast(`🟩 ${nama} membeli ${fmt(jumlah)} ${coin.k} seharga ${fmtRp(rupiah)}`, 'money');
  }
  if (c.op === 'jual') {
    const punya = dompet[coin.k] || 0; const jumlah = Math.min(punya, +c.jumlah || 0); if (jumlah <= 0) return;
    const kotor = Math.round(jumlah * harga); const fee = Math.round(kotor * 0.001); const bersih = kotor - fee;
    dompet[coin.k] = punya - jumlah; if (dompet[coin.k] < 1e-9) delete dompet[coin.k];
    hh.op({ o: 'money', d: bersih, why: `Cairkan ${coin.k}`, sim: nama });
    C.modal[nama] = Math.max(0, (C.modal[nama] || 0) - kotor);
    C.log.unshift({ t: W.time, teks: `🟥 ${nama} cairkan ${fmt(jumlah)} ${coin.k} @ ${fmtRp(harga)} → ${fmtRp(bersih)}` });
    hh.sfx('cash'); hh.toast(`💰 ${nama} mencairkan ${fmt(jumlah)} ${coin.k} menjadi ${fmtRp(bersih)} tunai`, 'money', true);
  }
  if (c.op === 'kirim') {                        // transfer koin ke pasangan
    const lain = nama === 'Handoyo' ? 'Naswa' : 'Handoyo'; const punya = dompet[coin.k] || 0;
    const jumlah = Math.min(punya, +c.jumlah || 0); if (jumlah <= 0) return;
    dompet[coin.k] = punya - jumlah; const d2 = C.dompet[lain] || (C.dompet[lain] = {}); d2[coin.k] = (d2[coin.k] || 0) + jumlah;
    C.log.unshift({ t: W.time, teks: `↔️ ${nama} kirim ${fmt(jumlah)} ${coin.k} ke ${lain}` });
    hh.toast(`↔️ ${fmt(jumlah)} ${coin.k} dikirim dari ${nama} ke ${lain}`, 'info');
  }
  if (C.log.length > 30) C.log.pop();
}
const fmt = (v) => (v >= 1000 ? v.toFixed(2) : v >= 1 ? v.toFixed(4) : v.toFixed(6)).replace(/\.?0+$/, '');

// ---------------- UI: aplikasi bursa di HP ----------------
export function openCrypto(ui, nama) {
  const g = ui.g, W = g.hh.world, C = W.crypto;
  nama = nama || (['Handoyo', 'Naswa'].includes(g.active) ? g.active : 'Handoyo');
  const dompet = C.dompet[nama] || {};
  const chg = (k) => { const r = C.riwayat[k]; const n = r.length; const lalu = r[Math.max(0, n - 24)]; return ((r[n - 1] - lalu) / lalu) * 100; };
  const spark = (k, w = 150, h = 34) => {
    const r = C.riwayat[k].slice(-60); const mn = Math.min(...r), mx = Math.max(...r), d = mx - mn || 1;
    const pts = r.map((v, i) => `${(i / (r.length - 1 || 1)) * w},${h - ((v - mn) / d) * (h - 4) - 2}`).join(' ');
    const naik = r[r.length - 1] >= r[0];
    return `<svg viewBox="0 0 ${w} ${h}" class="spark"><polyline points="${pts}" fill="none" stroke="${naik ? '#46d36b' : '#f0506a'}" stroke-width="2"/></svg>`;
  };
  const total = nilaiDompet(W, nama); const modal = C.modal[nama] || 0;
  const m = ui.modal(`<h2>🪙 Bursa Kripto · ${nama}</h2>
    <div class="cryTop"><div><small>Nilai portofolio</small><b>${fmtRp(total)}</b></div>
      <div><small>Uang tunai</small><b>${fmtRp(g.hh.sims[nama].wallet)}</b></div>
      <div><small>Total kekayaan keluarga</small><b>${fmtRp(totalKripto(W) + g.hh.sims.Handoyo.wallet + g.hh.sims.Naswa.wallet)}</b></div></div>
    <div class="cryWho">${['Handoyo', 'Naswa'].map((n) => `<button class="btn sm ${n === nama ? '' : 'ghost'}" data-who="${n}">${n}</button>`).join('')}</div>
    <div class="cryList">${COINS.map((c) => { const p = C.harga[c.k], ch = chg(c.k), pny = dompet[c.k] || 0; return `
      <div class="cry" style="--cc:${c.warna}"><i></i>
        <div class="cn"><b>${c.k}</b><small>${c.n}</small></div>
        <div class="cp"><b>${fmtRp(p)}</b><small class="${ch >= 0 ? 'up' : 'down'}">${ch >= 0 ? '▲' : '▼'} ${Math.abs(ch).toFixed(2)}% / 24 jam</small></div>
        ${spark(c.k)}
        <div class="cw">${pny ? `<b>${fmt(pny)} ${c.k}</b><small>${fmtRp(pny * p)}</small>` : '<small class="muted">belum punya</small>'}</div>
        <div class="cb"><button class="btn sm" data-beli="${c.k}">Beli</button><button class="btn sm ghost" data-jual="${c.k}" ${pny ? '' : 'disabled'}>Cairkan</button>${pny ? `<button class="btn sm ghost" data-kirim="${c.k}">Kirim ke pasangan</button>` : ''}</div>
      </div>`; }).join('')}</div>
    <div class="cryLog"><b>Catatan transaksi & kabar pasar</b>${(C.log || []).slice(0, 8).map((l) => `<small>${l.teks}</small>`).join('') || '<small class="muted">belum ada</small>'}</div>
    <p class="muted small">Modal terpakai: ${fmtRp(modal)} · fee transaksi 0,1% · harga diperbarui tiap jam game. Aset bisa dicairkan kapan saja menjadi uang tunai.</p>
    <div class="mbtns row"><button class="btn ghost" data-close>Tutup</button></div>`, 'wide');
  m.onclick = (e) => {
    const w = e.target.closest('[data-who]'); if (w) return openCrypto(ui, w.dataset.who);
    const b = e.target.closest('[data-beli]'), j = e.target.closest('[data-jual]'), k = e.target.closest('[data-kirim]');
    if (b) { const v = prompt(`Beli ${b.dataset.beli} senilai berapa rupiah?\nUang tunai ${nama}: ${fmtRp(g.hh.sims[nama].wallet)}`, '100000000'); if (v) { g.cmd({ c: 'crypto', op: 'beli', coin: b.dataset.beli, rupiah: +String(v).replace(/\D/g, ''), nama }); setTimeout(() => openCrypto(ui, nama), 250); } }
    if (j) { const p = (C.dompet[nama] || {})[j.dataset.jual] || 0; const v = prompt(`Cairkan berapa ${j.dataset.jual}? (punya ${fmt(p)})\nKetik "semua" untuk mencairkan seluruhnya.`, String(Math.min(p, 1))); if (v) { const n2 = /semua/i.test(v) ? p : parseFloat(String(v).replace(',', '.')); g.cmd({ c: 'crypto', op: 'jual', coin: j.dataset.jual, jumlah: n2, nama }); setTimeout(() => openCrypto(ui, nama), 250); } }
    if (k) { const p = (C.dompet[nama] || {})[k.dataset.kirim] || 0; const v = prompt(`Kirim berapa ${k.dataset.kirim} ke pasangan? (punya ${fmt(p)})`, '1'); if (v) { g.cmd({ c: 'crypto', op: 'kirim', coin: k.dataset.kirim, jumlah: parseFloat(String(v).replace(',', '.')), nama }); setTimeout(() => openCrypto(ui, nama), 250); } }
  };
}
