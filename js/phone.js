// ============================================================
//  HP — Pesan (SMS), Belanja Online, Pesanan, Toko Lukisan Naswa,
//  Proyek Handoyo, Dompet, Pengaturan AI Gemma.
// ============================================================
import { TYPES, fmtRp, BUY_CATS } from './data.js';
import { CONTACTS, GOODS, ART_TITLES, artLevel, fairPrice } from './life.js';
import { AI, saveAI, aiStatus, probeServer } from './ai.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clock = (t) => { const m = Math.floor(t % 1440); return `${String(Math.floor(m / 60)).padStart(2, '0')}.${String(m % 60).padStart(2, '0')}`; };
const APPS = [['sms', '💬', 'Pesan'], ['shop', '🛒', 'Belanja'], ['orders', '📦', 'Pesanan'], ['art', '🎨', 'Toko Lukisan'], ['dev', '💻', 'Proyek Dev'], ['wallet', '💳', 'Dompet'], ['ai', '🤖', 'AI Gemma'], ['lib', '📚', 'Perpus']];

export class Phone {
  constructor(ui) {
    this.ui = ui; this.g = ui.g; this.app = 'home'; this.thread = null; this.cart = []; this.shopCat = 'goods';
    const btn = document.createElement('button'); btn.className = 'phoneBtn'; btn.innerHTML = '📱<i class="badge hidden">0</i>'; btn.title = 'HP (P)';
    btn.onclick = () => this.toggle(); document.body.append(btn); this.btn = btn;
    const el = document.createElement('div'); el.className = 'phone hidden'; document.body.append(el); this.el = el;
    el.addEventListener('click', (e) => this.onClick(e));
    el.addEventListener('submit', (e) => { e.preventDefault(); this.onSubmit(e.target); });
    window.addEventListener('keydown', (e) => { if (e.key === 'p' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) this.toggle(); });
    probeServer();
  }
  toggle(app) { const open = this.el.classList.contains('hidden') || app; this.el.classList.toggle('hidden', !open); if (app) { this.app = app; } if (open) this.render(true); this.ui.sound.play('click'); }
  get W() { return this.g.hh.world; }
  me() { const g = this.g; const s = g.hh.sims[g.active]; return s && s.species === 'human' ? s : g.hh.sims[g.mySims.find((n) => g.hh.sims[n] && g.hh.sims[n].species === 'human')]; }
  unread() { return Object.values(this.W.smsUnread || {}).reduce((a, b) => a + b, 0) + (this.g.hh.gallery || []).reduce((a, p) => a + (p.status === 'listed' ? p.offers.filter((o) => o.status === 'open').length : 0), 0); }
  tick() {
    const n = this.unread(); const b = this.btn.querySelector('.badge'); b.textContent = n; b.classList.toggle('hidden', !n);
    if (!this.el.classList.contains('hidden')) { const key = this.sig(); if (key !== this._sig) this.render(); }
  }
  sig() { const W = this.W; return [this.app, this.thread, this.shopCat, this.cart.length, JSON.stringify(W.sms && this.thread ? (W.sms[this.thread] || []).map((m) => m.text) : ''), (W.orders || []).map((o) => o.status).join(), this.g.hh.galleryVer, JSON.stringify(W.dev), this.g.active, Math.floor(W.time / 10)].join('|'); }
  render(force) {
    this._sig = this.sig(); const W = this.W; const me = this.me();
    const top = `<div class="pStatus"><span>${clock(W.time)}</span><span>📶 4G ${me ? '· ' + esc(me.name) : ''}</span><span>🔋 87%</span></div>`;
    let body = '';
    const head = (t) => `<div class="pHead"><button data-go="home">‹</button><b>${t}</b></div>`;
    if (this.app === 'home') {
      body = `<div class="pHome"><div class="pWall"><b>${clock(W.time)}</b><small>Griya Asri · ${me ? esc(me.name) : ''}</small></div><div class="pGrid">${APPS.map(([k, i, l]) => `<button data-go="${k}"><span>${i}</span>${l}${k === 'sms' && Object.values(W.smsUnread || {}).some((x) => x) ? '<i class="dot"></i>' : ''}</button>`).join('')}</div></div>`;
    } else if (this.app === 'sms') {
      if (!this.thread) {
        const C = CONTACTS(); const groups = [...new Set(C.map((c) => c.group))];
        body = head('Pesan') + `<div class="pList">${groups.map((g) => `<div class="pGroup">${g}</div>` + C.filter((c) => c.group === g).map((c) => { const t = (W.sms && W.sms[c.name]) || []; const last = t[t.length - 1]; const un = (W.smsUnread || {})[c.name]; return `<button class="pRow" data-thread="${esc(c.name)}"><span class="av">${esc(c.name[0])}</span><span class="tx"><b>${esc(c.name)}</b><small>${esc(last ? last.text : c.desc)}</small></span>${un ? `<i class="cnt">${un}</i>` : ''}</button>`; }).join('')).join('')}
          ${W.sms && W.sms.Ekspedisi ? `<button class="pRow" data-thread="Ekspedisi"><span class="av">🛵</span><span class="tx"><b>Ekspedisi</b><small>${esc(W.sms.Ekspedisi.slice(-1)[0].text)}</small></span></button>` : ''}</div>`;
      } else {
        const t = (W.sms && W.sms[this.thread]) || [];
        if (W.smsUnread && W.smsUnread[this.thread]) this.g.cmd({ c: 'smsRead', to: this.thread });
        body = head(esc(this.thread)) + `<div class="pChat" id="pChat">${t.map((m) => `<div class="msg ${m.f}"><p>${esc(m.text)}</p><small>${m.f === 'me' ? esc(m.from) + ' · ' : ''}${clock(m.t)}${m.ai ? ' · ✨' : ''}</small></div>`).join('') || '<p class="muted small center">Belum ada pesan. Coba: "tolong masak ya", "main ke rumah dong", "pesan telur", "titip rumah"…</p>'}</div>
          <form class="pSend"><input name="t" autocomplete="off" placeholder="Tulis pesan…" maxlength="300"><button>➤</button></form>`;
      }
    } else if (this.app === 'shop') {
      const cats = [['goods', 'Kebutuhan'], ...BUY_CATS.filter((c) => c.id !== 'luar').map((c) => [c.id, c.label])];
      const items = this.shopCat === 'goods' ? GOODS.map((g) => ({ kind: 'good', key: g.key, name: g.name, price: g.price, icon: g.icon }))
        : Object.entries(TYPES).filter(([, T]) => T.cat === this.shopCat && !T.fixed && T.price > 0).map(([k, T]) => ({ kind: 'type', key: k, name: T.name, price: Math.round(T.price * 0.9 / 1000) * 1000, icon: T.icon || '📦' }));
      const total = this.cart.reduce((a, c) => a + c.price, 0);
      body = head('Belanja Online') + `<nav class="pTabs">${cats.map(([k, l]) => `<button data-cat="${k}" class="${k === this.shopCat ? 'on' : ''}">${l}</button>`).join('')}</nav>
        <div class="pShop">${items.map((it) => `<div class="pItem"><span>${it.icon}</span><b>${esc(it.name)}</b><em>${fmtRp(it.price)}${it.kind === 'type' ? ' <s>' + fmtRp(TYPES[it.key].price) + '</s>' : ''}</em><button data-add='${JSON.stringify({ kind: it.kind, key: it.key, price: it.price, name: it.name })}'>+ Keranjang</button></div>`).join('')}</div>
        <div class="pCart">🛒 ${this.cart.length} barang · ${fmtRp(total + (this.cart.length ? 15000 : 0))} <small>(ongkir Rp 15.000)</small>${this.cart.length ? '<button data-a="clearCart" class="ghost">Kosongkan</button><button data-a="checkout">Bayar</button>' : ''}</div>`;
    } else if (this.app === 'orders') {
      const O = (W.orders || []).slice().reverse();
      const inv = Object.entries(W.inventory || {}).filter(([, n]) => n > 0);
      body = head('Pesanan & Gudang') + `<div class="pList">${O.map((o) => `<div class="pCardS"><b>#${o.id} · ${o.status.toUpperCase()}</b><small>${o.items.map((i) => esc(i.name)).join(', ')}</small><div class="track">${['dikemas', 'dikirim', 'tiba', 'selesai'].map((s) => `<i class="${['dikemas', 'dikirim', 'tiba', 'selesai'].indexOf(s) <= ['dikemas', 'dikirim', 'tiba', 'selesai'].indexOf(o.status) ? 'on' : ''}">${s}</i>`).join('')}</div><small>${fmtRp(o.total)} · ${o.status === 'dikirim' ? 'estimasi tiba ' + clock(o.eta) : o.status === 'tiba' ? 'paket ada di depan pintu — klik untuk dibuka' : ''}</small></div>`).join('') || '<p class="muted small center">Belum ada pesanan.</p>'}
        <div class="pGroup">📦 Gudang (barang dari paket)</div>${inv.map(([k, n]) => `<div class="pRow"><span class="av">${TYPES[k].icon || '📦'}</span><span class="tx"><b>${esc(TYPES[k].name)}</b><small>${n} unit — taruh lewat mode Beli › Gudang</small></span></div>`).join('') || '<p class="muted small">Kosong.</p>'}</div>`;
    } else if (this.app === 'art') {
      const A = W.art || { sold: 0, earned: 0, fame: 0, commissions: [] }; const gal = this.g.hh.gallery || []; const lv = artLevel(W);
      body = head('Toko Lukisan Naswa') + `<div class="pArtHead"><b>${ART_TITLES[lv]}</b><small>${A.sold} terjual · ${fmtRp(A.earned)} · ketenaran ${Math.round(A.fame)}${A.boost ? ` · 🎨 cat premium ${A.boost}x` : ''}</small><button data-a="studio">🖌️ Melukis sekarang</button></div>
        ${A.commissions.length ? `<div class="pGroup">📝 Pesanan lukisan (komisi)</div>${A.commissions.map((C) => `<div class="pCardS"><b>${esc(C.what)}</b><small>${esc(C.client)} · budget ${fmtRp(C.budget)} · sisa ${Math.max(0, Math.ceil((C.until - W.time) / 1440))} hari</small><select data-com="${C.id}"><option value="">Kirim lukisan…</option>${gal.filter((p) => p.status !== 'sold').map((p) => `<option value="${p.id}">${esc(p.title)} (q${p.q})</option>`).join('')}</select></div>`).join('')}` : ''}
        <div class="pGal">${gal.map((p) => `<div class="pArt ${p.status}"><img src="${p.img}" alt=""><b>${esc(p.title)}</b><small>Kualitas ${p.q}/100 · taksiran ${fmtRp(fairPrice(this.g.hh, p))}</small>
          ${p.status === 'sold' ? `<em class="sold">TERJUAL ${fmtRp(p.soldFor)} → ${esc(p.soldTo)}</em>` : p.status === 'listed' ? `<em>Dipajang ${fmtRp(p.price)}</em><button class="ghost" data-art='${JSON.stringify({ op: 'unlist', id: p.id })}'>Tarik</button>` : `<form class="pList2" data-id="${p.id}"><input name="price" type="number" step="50000" min="100000" value="${p.price}"><button>Jual online</button></form>`}
          ${p.offers.filter((o) => o.status === 'open').map((o) => `<div class="offer"><b>${esc(o.buyer)} <small>${esc(o.city)}</small> menawar ${fmtRp(o.amount)}</b><p>“${esc(o.msg)}”</p><div class="row"><button data-art='${JSON.stringify({ op: 'accept', id: p.id, oid: o.id })}'>Terima</button><button class="ghost" data-art='${JSON.stringify({ op: 'decline', id: p.id, oid: o.id })}'>Tolak</button><form class="pCounter" data-id="${p.id}" data-oid="${o.id}"><input name="amount" type="number" step="50000" value="${Math.round((o.amount + p.price) / 2 / 50000) * 50000}"><button class="ghost">Tawar</button></form></div></div>`).join('')}</div>`).join('') || '<p class="muted small center">Belum ada lukisan. Klik easel/kanvas di rumah → "Melukis sendiri", atau tombol di atas.</p>'}</div>`;
    } else if (this.app === 'dev') {
      const D = W.dev || { offers: [], active: null, done: 0 }; const hd = this.g.hh.sims.Handoyo; const car = hd && hd.prof && hd.prof.career;
      body = head('Proyek Dev · Handoyo') + `<div class="pArtHead"><b>${car ? esc(['Junior Developer', 'Software Engineer', 'Senior Engineer', 'Tech Lead', 'Engineering Manager', 'CTO'][car.level] || '') : ''}</b><small>${D.done} proyek selesai · skill logika ${hd ? hd.skillLvl('logika') : 0}${D.boost ? ` · alat kerja +${Math.round(D.boost * 100)}%` : ''}</small></div>
        ${D.active ? `<div class="pCardS"><b>🔧 ${esc(D.active.title)}</b><small>${esc(D.active.client)} · ${esc(D.active.stack)} · ${D.active.pay ? fmtRp(D.active.pay) : 'gratis untuk istri tercinta'}</small><div class="bar"><i style="width:${Math.min(100, D.active.prog / D.active.hours * 100)}%"></i></div><small>${D.active.prog.toFixed(1)} / ${D.active.hours} jam · ${D.active.bugs || 0} bug diperbaiki</small><div class="row"><button data-a="code">💻 Suruh Handoyo ngoding</button><button class="ghost" data-dev='${JSON.stringify({ op: 'drop' })}'>Batalkan</button></div></div>` : '<p class="muted small">Belum ada proyek aktif.</p>'}
        <div class="pGroup">Lowongan freelance hari ini</div>${D.offers.map((o, i) => `<div class="pCardS"><b>${esc(o.title)}</b><small>${esc(o.client)} · ${esc(o.stack)} · ±${o.hours} jam · ${o.pay ? fmtRp(o.pay) : 'gratis ❤️'}</small><button data-dev='${JSON.stringify({ op: 'take', i })}'>Ambil proyek</button></div>`).join('')}
        <p class="muted small">Ngoding di Meja Kerja (atau di Kopi Griya) memajukan proyek. Kerja kantor: naik mobil, atau "Kerja remote (WFH)" di meja.</p>`;
    } else if (this.app === 'wallet') {
      body = head('Dompet') + `<div class="pList">${this.g.hh.humans().map((h) => `<div class="pCardS big"><b>${esc(h.name)}</b><em>${fmtRp(h.wallet)}</em></div>`).join('')}
        ${W.loan ? `<div class="pCardS"><b>Piutang Bang Jefri</b><small>${fmtRp(W.loan.amount)} + bunga ${Math.round(W.loan.rate * 100)}% · jatuh tempo hari ke-${W.loan.due + 1}</small></div>` : ''}
        ${W.iuranDue ? `<div class="pCardS"><b>Iuran RT tertunggak</b><small>${fmtRp(W.iuranDue)} — SMS Pak Harjo "bayar iuran" untuk transfer</small></div>` : ''}
        <p class="muted small">Riwayat lengkap ada di tab Keuangan.</p></div>`;
    } else if (this.app === 'ai') {
      body = head('AI Gemma') + `<div class="pList"><div class="pCardS"><b>Status</b><small>${esc(aiStatus())}</small>${AI.lastError ? `<small class="bad">Error terakhir: ${esc(AI.lastError)}</small>` : ''}</div>
        <p class="small">Gemma (model terbuka dari Google) membuat balasan SMS, pesan pembeli lukisan, dan obrolan warga jadi lebih hidup. Tanpa AI, game tetap jalan dengan dialog bawaan.</p>
        <p class="small"><b>Cara 1 (disarankan, kunci aman):</b> di Vercel › Settings › Environment Variables, tambahkan <code>GEMINI_API_KEY</code> dari Google AI Studio, lalu redeploy.</p>
        <form class="pAI"><label class="small">Cara 2: kunci API pribadi (disimpan hanya di browser ini)</label><input name="key" type="password" placeholder="AIza…" value="${esc(AI.key)}"><label class="small">Model</label><select name="model">${['gemma-4-26b-a4b-it', 'gemma-4-31b-it', 'gemma-3-27b-it'].map((m) => `<option ${m === AI.model ? 'selected' : ''}>${m}</option>`).join('')}</select>
          <label class="chk"><input type="checkbox" name="enabled" ${AI.enabled ? 'checked' : ''}> Aktifkan AI</label><label class="chk"><input type="checkbox" name="ambient" ${AI.ambient ? 'checked' : ''}> Obrolan warga otomatis</label><button>Simpan</button></form>
        <p class="muted small">Hanya host (pembuat room) yang memanggil AI; tamu ikut melihat hasilnya.</p></div>`;
    } else if (this.app === 'lib') { this.app = 'home'; this.hide(); this.ui.openLibrary(null); return; }
    this.el.innerHTML = `<div class="pFrame">${top}<div class="pScreen">${body}</div><div class="pBar"><button data-go="home"></button></div></div>`;
    const ch = this.el.querySelector('#pChat'); if (ch) ch.scrollTop = ch.scrollHeight;
    this.el.querySelectorAll('select[data-com]').forEach((s) => { s.onchange = () => { if (s.value) this.g.cmd({ c: 'art', op: 'commission', cid: +s.dataset.com, id: +s.value }); }; });
  }
  hide() { this.el.classList.add('hidden'); }
  onClick(e) {
    const b = e.target.closest('button'); if (!b || b.closest('form')) return;
    this.ui.sound.play('click');
    if (b.dataset.go) { if (b.dataset.go === 'home' && this.app === 'sms' && this.thread) this.thread = null; else { this.app = b.dataset.go; this.thread = null; } return this.render(true); }
    if (b.dataset.thread) { this.thread = b.dataset.thread; return this.render(true); }
    if (b.dataset.cat) { this.shopCat = b.dataset.cat; return this.render(true); }
    if (b.dataset.add) { this.cart.push(JSON.parse(b.dataset.add)); this.ui.toast('Masuk keranjang 🛒', 'info'); return this.render(true); }
    if (b.dataset.a === 'clearCart') { this.cart = []; return this.render(true); }
    if (b.dataset.a === 'checkout') { const me = this.me(); this.g.cmd({ c: 'order', sim: me && me.name, items: this.cart.map((c) => ({ kind: c.kind, key: c.key, qty: 1 })) }); this.cart = []; this.app = 'orders'; return this.render(true); }
    if (b.dataset.art) return this.g.cmd({ c: 'art', ...JSON.parse(b.dataset.art) });
    if (b.dataset.dev) return this.g.cmd({ c: 'proj', sim: 'Handoyo', ...JSON.parse(b.dataset.dev) });
    if (b.dataset.a === 'studio') { const e2 = this.W.objects.find((o) => TYPES[o.type].acts.includes('paintManual')); if (!e2) return this.ui.toast('Beli easel/kanvas dulu', 'bad'); this.hide(); this.ui.openStudioFor(e2.id); }
    if (b.dataset.a === 'code') { const d = this.W.objects.find((o) => TYPES[o.type].acts.includes('codeProject')); if (d) this.g.cmd({ c: 'act', sim: 'Handoyo', key: 'codeProject', objId: d.id }); this.ui.toast('Handoyo menuju meja kerja 💻', 'info'); }
  }
  onSubmit(f) {
    if (f.classList.contains('pSend')) { const t = f.t.value.trim(); if (!t) return; const me = this.me(); this.g.cmd({ c: 'sms', sim: me && me.name, to: this.thread, text: t }); this.ui.sound.play('click'); f.t.value = ''; setTimeout(() => this.render(true), 50); }
    if (f.classList.contains('pList2')) this.g.cmd({ c: 'art', op: 'list', id: +f.dataset.id, price: +f.price.value });
    if (f.classList.contains('pCounter')) this.g.cmd({ c: 'art', op: 'counter', id: +f.dataset.id, oid: +f.dataset.oid, amount: +f.amount.value });
    if (f.classList.contains('pAI')) { AI.key = f.key.value.trim(); AI.model = f.model.value; AI.enabled = f.enabled.checked; AI.ambient = f.ambient.checked; saveAI(); probeServer().then(() => this.render(true)); this.ui.toast('Pengaturan AI disimpan 🤖', 'good'); }
  }
}
