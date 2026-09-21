// ============================================================
//  SISTEM KEHIDUPAN (dijalankan host): SMS, belanja online & paket,
//  proyek programmer Handoyo, pasar lukisan online Naswa.
// ============================================================
import { TYPES, fmtRp, clamp } from './data.js';
import { NPCS, STAFF } from './people.js';
import { inviteGuest, GUEST_NAMES } from './people2.js';
import { INTER } from './interactions.js';

// ---------- interaksi kerja Handoyo (programmer) & studio Naswa ----------
const dayOf = (c) => Math.floor(c.world.time / 1440), hourOf = (c) => (c.world.time % 1440) / 60;
Object.assign(INTER, {
  codeProject: { label: (c) => (c.world.dev && c.world.dev.active ? `Ngoding proyek: ${c.world.dev.active.title}` : 'Ngoding (latihan / open source)'), icon: '💻',
    check: (c) => (c.sim.name === 'Handoyo' ? true : 'Khusus Handoyo si programmer'),
    build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'seat' }, anim: 'sitType', dur: 60, snd: 'type', eff: { fun: 0.2 }, label: 'Ngoding', onTick: (x, gm) => x.g.codeTick(x.sim, gm) }] }) },
  wfh: { label: 'Kerja remote (WFH) hari ini', icon: '🏠',
    check: (c) => { if (c.sim.name !== 'Handoyo') return 'Naswa bekerja di studio lukis'; const car = c.sim.prof && c.sim.prof.career; if (!car) return 'Belum punya pekerjaan'; if (dayOf(c) % 7 >= 5) return 'Akhir pekan, libur dulu'; if (car.workedDay === dayOf(c)) return 'Sudah kerja hari ini'; const h = hourOf(c); return h >= 6 && h < 16 ? true : 'Jam kerja 06.00–16.00'; },
    build: (c) => ({ steps: [{ target: { obj: c.obj.id, kind: 'seat' }, anim: 'sitType', dur: 240, snd: 'type', label: 'WFH: standup, ngoding, code review', eff: { fun: -0.05 }, onTick: (x, gm) => x.sim.xp('logika', gm * 0.25), onDone: (x) => x.g.finishWork(x.sim) }] }) },
});


// ---------------- kontak HP ----------------
export const CONTACTS = () => {
  const L = [];
  for (const [n, d] of Object.entries(STAFF)) L.push({ name: n, group: 'ART', desc: d.role });
  for (const [n, d] of Object.entries(NPCS)) if (!['vendor'].includes(d.role) && n !== 'Mas Kurir') L.push({ name: n, group: d.role === 'guest' ? 'Keluarga & Teman' : d.role === 'rt' || d.role === 'satpam' ? 'Lingkungan' : d.role === 'barista' || d.role === 'warung' ? 'Usaha' : 'Tetangga', desc: d.relation || d.trait });
  return L;
};
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const has = (t, ...w) => w.some((x) => t.includes(x));

// ---------------- katalog belanja online ----------------
export const GOODS = [
  { key: 'sembako', name: 'Paket sembako (beras, telur, minyak)', price: 250000, icon: '🧺', eff: { stock: 8 } },
  { key: 'frozen', name: 'Frozen food & nugget', price: 120000, icon: '🍗', eff: { stock: 4 } },
  { key: 'snackbox', name: 'Kotak camilan & kopi sachet', price: 90000, icon: '🍪', eff: { servings: 2 } },
  { key: 'catfood', name: 'Makanan kucing premium 5 kg', price: 280000, icon: '🐟', eff: { petFood: true } },
  { key: 'capyfood', name: 'Rumput timothy & sayur capybara', price: 190000, icon: '🥬', eff: { petFood: true } },
  { key: 'oilpaint', name: 'Cat minyak Winsor & Newton 24 warna', price: 1450000, icon: '🎨', eff: { artBoost: 6 } },
  { key: 'canvas10', name: 'Kanvas linen 10 lembar', price: 650000, icon: '🖼️', eff: { artBoost: 3 } },
  { key: 'keyboard', name: 'Keyboard mekanikal', price: 1250000, icon: '⌨️', eff: { devBoost: 0.15 } },
  { key: 'monitor', name: 'Monitor 27" 4K', price: 5200000, icon: '🖥️', eff: { devBoost: 0.25 } },
  { key: 'flowers', name: 'Buket bunga untuk pasangan', price: 350000, icon: '💐', eff: { romance: true } },
  { key: 'skincare', name: 'Paket skincare & sabun', price: 420000, icon: '🧴', eff: { hygieneMood: true } },
  { key: 'bookset', name: 'Paket 5 novel baru', price: 480000, icon: '📚', eff: { fun: true } },
];

// ---------------- proyek programmer ----------------
const PROJECTS = [
  ['Website katalog UMKM Batik Semarang', 'Bu Lestari (Batik Semarangan)', 'Laravel + MySQL', 10, 9000000],
  ['Aplikasi kasir Warung Madura', 'Cak Mamat', 'Flutter + SQLite', 14, 7500000],
  ['Dashboard iuran & kas RT 05', 'Pak Harjo', 'React + Supabase', 8, 4000000],
  ['Bot WhatsApp pengingat arisan', 'Bu Rina', 'Node.js', 5, 3000000],
  ['Sistem antrean klinik gigi', 'Kak Dinda', 'Next.js + PostgreSQL', 18, 16000000],
  ['API pembayaran QRIS toko online', 'PT Nusantara Retail', 'Go + Redis', 22, 24000000],
  ['Landing page & menu digital Kopi Griya', 'Mas Dimas', 'Astro + Tailwind', 4, 2500000],
  ['Game edukasi matematika SD', 'Dinas Pendidikan', 'Unity C#', 28, 30000000],
  ['Perbaiki bug aplikasi ojek lokal', 'Startup Ojek Semarang', 'Kotlin', 3, 2200000],
  ['Portofolio online lukisan Naswa', 'Naswa ❤️', 'SvelteKit', 6, 0],
  ['Integrasi AI chatbot customer service', 'Bank daerah', 'Python + LLM', 16, 20000000],
  ['Sistem inventori gudang', 'CV Maju Jaya', 'Django', 12, 11000000],
];
function refreshOffers(W) {
  const pool = PROJECTS.filter((p) => !(W.dev.active && W.dev.active.title === p[0]));
  const offers = []; while (offers.length < 3) { const p = pick(pool); if (!offers.find((o) => o.title === p[0])) offers.push({ title: p[0], client: p[1], stack: p[2], hours: p[3], pay: p[4] }); }
  W.dev.offers = offers; W.dev.offerDay = Math.floor(W.time / 1440);
}

// ---------------- pasar lukisan ----------------
const BUYERS = [['Pak Hendra', 'Jakarta'], ['Mbak Citra', 'Bandung'], ['Galeri Semarang', 'Semarang'], ['Mr. Tanaka', 'Osaka'], ['Bu Wulan', 'Yogyakarta'], ['Koh Aming', 'Surabaya'], ['Kafe Senja', 'Solo'], ['Hotel Tentrem', 'Semarang'], ['Mas Bagas', 'Malang'], ['Ms. Claire', 'Singapura']];
const COMMISSIONS = [['Lukisan Gunung Merapi saat fajar', 'Pak Hendra'], ['Potret kucing oranye', 'Mbak Citra'], ['Suasana Kota Lama Semarang', 'Hotel Tentrem'], ['Abstrak warna hangat untuk kafe', 'Kafe Senja'], ['Pemandangan sawah & petani', 'Bu Wulan'], ['Bunga teratai di kolam', 'Mr. Tanaka']];
export const ART_TITLES = ['Pemula', 'Pelukis Muda', 'Pelukis Profesional', 'Seniman Pameran', 'Pelukis Ternama', 'Maestro'];
export const artLevel = (W) => { const s = (W.art && W.art.sold) || 0; return [0, 2, 5, 10, 18, 30].filter((x) => s >= x).length - 1; };
export function fairPrice(hh, p) {
  const A = hh.world.art || {}; const fame = (A.fame || 0);
  const base = 900000 * (1 + fame / 8) * Math.pow(0.35 + p.q / 55, 2);
  return Math.round(base / 50000) * 50000 + 250000;
}
export function paintingQuality(hh, st) {
  const sim = hh.sims.Naswa; const sk = sim ? sim.skillLvl('kreatif') : 0; const boost = (hh.world.art && hh.world.art.boost) || 0;
  const q = 12 + Math.min(22, st.strokes / 5) + Math.min(14, st.colors * 1.6) + Math.min(14, st.secs / 18) + st.coverage * 16 + sk * 1.8 + (boost > 0 ? 6 : 0);
  return Math.round(clamp(q, 5, 100));
}

// ---------------- pemasangan ke Household ----------------
export function installLife(hh) {
  const W0 = () => hh.world;
  const init = () => {
    const W = W0();
    if (!W.sms) W.sms = {}; if (!W.smsUnread) W.smsUnread = {};
    if (!W.orders) W.orders = []; if (!W.inventory) W.inventory = {}; if (!W.orderId) W.orderId = 1;
    if (!W.dev) { W.dev = { offers: [], active: null, done: 0, boost: 0 }; refreshOffers(W); }
    if (!W.art) W.art = { fame: 0, sold: 0, earned: 0, boost: 0, commissions: [] };
    if (!hh.gallery) hh.gallery = [];
  };
  hh.lifeInit = init;
  hh.galleryVer = 0;
  const bump = () => { hh.galleryVer++; hh.hooks.gallery && hh.hooks.gallery(); };

  // ---- SMS ----
  const push = (contact, m) => { const W = W0(); const t = W.sms[contact] || (W.sms[contact] = []); t.push({ ...m, t: W.time }); if (t.length > 40) t.shift(); };
  hh.smsIn = (contact, text, notify = true) => { push(contact, { f: 'them', text }); const W = W0(); W.smsUnread[contact] = (W.smsUnread[contact] || 0) + 1; if (notify) { hh.sfx('sms'); hh.hooks.smsNotify && hh.hooks.smsNotify(contact, text); } };
  const reply = (contact, canned, ctx) => {
    hh.smsIn(contact, canned);
    const W = W0(); const t = W.sms[contact]; const idx = t.length - 1;
    if (hh.hooks.ai) {
      const d = NPCS[contact] || STAFF[contact] || {};
      const hist = t.slice(-6).map((m) => `${m.f === 'me' ? (m.from || 'Pemilik rumah') : contact}: ${m.text}`).join('\n');
      hh.hooks.ai(`Kamu adalah ${contact} (${d.relation || d.trait || d.role || 'warga'}). Kamu membalas SMS dari ${ctx.from} (${ctx.from === 'Handoyo' ? 'programmer' : 'pelukis'}, pasangan suami-istri Handoyo & Naswa).\nRiwayat singkat:\n${hist}\nHasil yang sudah terjadi di game (wajib konsisten): ${ctx.outcome}\nTulis SATU balasan SMS singkat (maks 30 kata).`, 90)
        .then((txt) => { if (txt && W.sms[contact] && W.sms[contact][idx]) { W.sms[contact][idx].text = txt; W.sms[contact][idx].ai = true; hh.hooks.smsUpdate && hh.hooks.smsUpdate(contact); } });
    }
  };
  hh.smsSend = (sim, contact, text) => {
    init(); const t = String(text || '').slice(0, 300).toLowerCase(); if (!t.trim()) return;
    push(contact, { f: 'me', from: sim.name, text: String(text).slice(0, 300) });
    const W = W0(); let canned = 'Oke, siap!'; let outcome = 'Hanya ngobrol biasa.';
    const staff = STAFF[contact]; const npc = NPCS[contact];
    if (staff) {
      const s = hh.others[contact];
      if (has(t, 'libur', 'istirahat', 'cuti')) { W.staffOn[contact] = false; canned = 'Baik, Bu/Pak. Saya libur dulu ya, makasih 🙏'; outcome = `${contact} diliburkan.`; }
      else if (has(t, 'masuk', 'kerja', 'datang')) { W.staffOn[contact] = true; canned = 'Siap, saya masuk kerja sesuai jadwal 06.00.'; outcome = `${contact} dipekerjakan lagi.`; }
      else if (!s || s.hidden) { canned = 'Maaf, saya sedang di rumah. Besok pagi saya kerjakan ya.'; outcome = `${contact} sedang tidak di rumah majikan (di luar jam kerja).`; }
      else {
        const map = [['masak', 'cook2', 'fridge'], ['cuci piring', 'washDishes', 'counterSink'], ['piring', 'washDishes', 'counterSink'], ['pel', 'mop', null], ['sampah', 'takeTrash', 'kitchenTrash'], ['kasur', 'makeBed', 'bed'], ['toilet', 'cleanToilet', 'toilet'], ['cuci baju', 'laundry', 'washer'], ['jemur', 'liftLaundry', 'clothesline'], ['siram', 'water', 'plant'], ['rumput', 'mow', 'mower'], ['mobil', 'washCar', 'car'], ['kucing', 'fillBowl', 'petBowl'], ['makan hewan', 'fillBowl', 'petBowl'], ['pasir', 'cleanLitter', 'litterBox']];
        const hit = map.find(([k]) => t.includes(k));
        if (hit) {
          const [, key, type] = hit;
          if (key === 'mop') { const d = W.dirt[0]; if (d) { hh.queueAct(s, 'mop', null, { dirt: d }); canned = 'Siap, lantainya saya pel sekarang.'; outcome = `${contact} langsung mengepel lantai.`; } else { canned = 'Lantainya sudah bersih kok 😊'; outcome = 'Lantai sudah bersih.'; } }
          else { const o = W.objects.find((x) => x.type === type); if (o) { hh.queueAct(s, key, o.id); canned = `Nggih, langsung saya kerjakan (${key === 'cook2' ? 'masak' : hit[0]}).`; outcome = `${contact} mulai mengerjakan: ${hit[0]}.`; } else { canned = 'Maaf, alatnya nggak ada di rumah.'; outcome = 'Perlengkapan tidak ada.'; } }
        } else { canned = pick(['Nggih, siap!', 'Baik, ada lagi yang bisa dibantu?', 'Oke, dicatat 🙏']); }
      }
    } else if (npc) {
      if (npc.role === 'guest' && has(t, 'main', 'mampir', 'datang', 'ke rumah', 'kangen', 'dolan')) { inviteGuest(hh, contact, 45 + Math.random() * 60); canned = 'Wah boleh! Aku otw sebentar lagi ya 🚗'; outcome = `${contact} setuju berkunjung dalam 1–2 jam ke depan.`; }
      else if (contact === 'Bang Jefri' && has(t, 'utang', 'bayar', 'pinjam', 'lunas')) { if (W.loan) { canned = `Iya iya, aku inget kok. Hari ke-${W.loan.due + 1} lunas plus bunga!`; outcome = `Jefri berjanji melunasi utang ${fmtRp(W.loan.amount)} di hari ke-${W.loan.due + 1}.`; } else { canned = 'Lho, utangku kan udah lunas bang 😄'; outcome = 'Jefri sedang tidak punya utang.'; } }
      else if (contact === 'Pak Harjo' && has(t, 'iuran', 'bayar')) { if (W.iuranDue > 0) { hh.op({ o: 'money', d: -W.iuranDue, why: 'Iuran RT (transfer)', sim: sim.name }); W.iuranDue = 0; W.iuranDay = Math.floor(W.time / 1440); canned = 'Alhamdulillah, iuran sudah saya terima. Matur nuwun!'; outcome = 'Iuran RT Rp 50.000 dibayar via transfer.'; } else { canned = 'Iuran bulan ini sudah lunas kok, terima kasih.'; outcome = 'Tidak ada iuran tertunggak.'; } }
      else if (contact === 'Pak Slamet' && has(t, 'titip', 'jaga', 'aman')) { canned = 'Siap Pak, rumahnya saya pantau pas keliling. Aman!'; outcome = 'Satpam akan memantau rumah.'; }
      else if (npc.role === 'warung' && has(t, 'telur', 'mie', 'beras', 'galon', 'gas', 'minyak', 'pesan', 'anter')) { hh.op({ o: 'money', d: -75000, why: 'Pesan antar Warung Madura', sim: sim.name }); hh.op({ o: 'house', k: 'stock', d: 4 }); canned = 'Siap! Sudah saya antar ke depan pagar ya. Rp 75 ribu.'; outcome = 'Warung mengantar bahan makanan (+4 stok, Rp 75.000).'; }
      else if (npc.role === 'barista' && has(t, 'kopi', 'pesan', 'anter', 'latte')) { hh.op({ o: 'money', d: -50000, why: 'Pesan antar Kopi Griya', sim: sim.name }); for (const h of hh.humans()) h.mood('ngopi'); canned = 'Dua kopi susu gula aren meluncur! ☕'; outcome = 'Kopi Griya mengantar 2 kopi (Rp 50.000).'; }
      else if (has(t, 'arisan')) { canned = 'Arisan Minggu sore di rumah Bu Rina ya, jangan lupa bawa kue!'; outcome = 'Info arisan.'; }
      else canned = pick(['Hehe iya, sehat-sehat ya kalian!', 'Wah, kapan-kapan ngopi bareng yuk.', 'Siap, nanti kukabari lagi.', 'Makasih udah ngabarin 😊']);
      W.nrel[contact] = clamp((W.nrel[contact] || 30) + 1, -100, 100);
    }
    setTimeout(() => reply(contact, canned, { from: sim.name, outcome }), 600 + Math.random() * 900);
  };

  // ---- belanja online ----
  hh.placeOrder = (sim, items) => {
    init(); const W = W0(); let total = 0; const list = [];
    for (const it of items || []) {
      if (it.kind === 'good') { const G = GOODS.find((g) => g.key === it.key); if (G) { total += G.price * (it.qty || 1); list.push({ kind: 'good', key: G.key, name: G.name, qty: it.qty || 1 }); } }
      if (it.kind === 'type' && TYPES[it.key] && TYPES[it.key].price > 0 && !TYPES[it.key].fixed) { const p = Math.round(TYPES[it.key].price * 0.9 / 1000) * 1000; total += p * (it.qty || 1); list.push({ kind: 'type', key: it.key, name: TYPES[it.key].name, qty: it.qty || 1 }); }
    }
    if (!list.length) return;
    total += 15000; // ongkir
    if ((sim.wallet ?? 0) < total) return hh.toast('Saldo tidak cukup untuk checkout', 'bad');
    hh.op({ o: 'money', d: -total, why: 'Belanja online', sim: sim.name });
    const o = { id: W.orderId++, items: list, total, status: 'dikemas', at: W.time, eta: W.time + 60 + Math.random() * 120, by: sim.name };
    W.orders.push(o); if (W.orders.length > 25) W.orders.shift();
    hh.toast(`🛒 Pesanan #${o.id} dibayar ${fmtRp(total)} (termasuk ongkir). Sedang dikemas penjual.`, 'money');
  };
  hh.deliverParcel = (id) => {
    const W = W0(); const o = W.orders.find((x) => x.id === id); if (!o) return;
    o.status = 'tiba';
    const p = { id: W.nextId++, type: 'parcel', x: -5.3 + (Math.random() - 0.5) * 0.4, z: 6.75, rot: 0, s: { order: id } };
    W.objects.push(p); W.objVer++; hh.rebuildNav();
    hh.toast(`📦 Paket #${id} sudah diantar Mas Kurir ke depan pintu!`, 'good', true);
    for (const h of hh.humans()) h.mood('paketDatang');
  };
  hh.openParcel = (sim, obj) => {
    const W = W0(); const o = W.orders.find((x) => x.id === obj.s.order);
    W.objects = W.objects.filter((x) => x.id !== obj.id); W.objVer++; hh.rebuildNav();
    if (!o) return; o.status = 'selesai'; const got = [];
    for (const it of o.items) {
      if (it.kind === 'type') { W.inventory[it.key] = (W.inventory[it.key] || 0) + it.qty; got.push(`${it.name} (masuk Gudang — taruh lewat mode Beli)`); continue; }
      const G = GOODS.find((g) => g.key === it.key); if (!G) continue; const e = G.eff;
      if (e.stock) hh.op({ o: 'house', k: 'stock', d: e.stock * it.qty });
      if (e.servings) hh.op({ o: 'house', k: 'servings', d: e.servings * it.qty });
      if (e.artBoost) W.art.boost = (W.art.boost || 0) + e.artBoost * it.qty;
      if (e.devBoost) W.dev.boost = Math.min(0.6, (W.dev.boost || 0) + e.devBoost);
      if (e.petFood) for (const b of W.objects.filter((x) => x.type === 'petBowl')) b.s.food = 100;
      if (e.romance) { const p = hh.partner(sim); if (p) { p.mood('peluk'); hh.bondAdd(sim, p, 10); } }
      if (e.hygieneMood) sim.addNeed('hygiene', 20);
      if (e.fun) sim.addNeed('fun', 25);
      got.push(it.name);
    }
    hh.toast(`📦 ${sim.name} membuka paket: ${got.join(', ')}`, 'good', true); hh.sfx('good');
  };

  // ---- proyek programmer ----
  hh.codeTick = (sim, gm) => {
    const W = W0(); const A = W.dev.active; if (sim.name !== 'Handoyo') return;
    sim.xp('logika', gm * 0.5);
    if (!A) return;
    A.prog += gm / 60 * (0.8 + sim.skillLvl('logika') * 0.09 + (W.dev.boost || 0));
    if (Math.random() < gm * 0.004) { A.bugs = (A.bugs || 0) + 1; A.prog = Math.max(0, A.prog - 0.4); hh.toast(`🐛 Handoyo nemu bug di "${A.title}"… debugging dulu`, 'info'); }
    if (A.prog >= A.hours) {
      W.dev.active = null; W.dev.done++;
      if (A.pay > 0) hh.op({ o: 'money', d: A.pay, why: `Proyek: ${A.title}`, sim: 'Handoyo' });
      sim.mood('proyekBeres'); hh.addFam(30); hh.sfx('fanfare');
      if (A.client.startsWith('Naswa')) { const n = hh.sims.Naswa; if (n) { hh.bondAdd(sim, n, 15); n.mood('tamu'); W.art.fame += 2; } hh.toast('💻 Website portofolio lukisan Naswa online! Ketenaran Naswa naik ✨', 'good', true); }
      else hh.toast(`✅ Proyek "${A.title}" selesai & di-deploy! +${fmtRp(A.pay)} dari ${A.client}`, 'money', true);
      const car = sim.prof && sim.prof.career; if (car) { car.perf = clamp(car.perf + 25, 0, 100); }
      if (NPCS[A.client]) hh.smsIn(A.client, 'Mantap Mas Handoyo, aplikasinya sudah jalan! Makasih banyak 🙏');
    }
  };
  hh.devCmd = (sim, c) => {
    const W = W0();
    if (c.op === 'take') { if (W.dev.active) return hh.toast('Selesaikan dulu proyek yang sedang jalan', 'bad'); const o = W.dev.offers[c.i]; if (!o) return; W.dev.active = { ...o, prog: 0, bugs: 0, at: W.time }; W.dev.offers.splice(c.i, 1); hh.toast(`💼 Handoyo ambil proyek "${o.title}" (${o.stack}, ±${o.hours} jam ngoding)`, 'good'); }
    if (c.op === 'drop') { if (W.dev.active) hh.toast(`Proyek "${W.dev.active.title}" dibatalkan`, 'bad'); W.dev.active = null; }
  };

  // ---- pasar lukisan ----
  hh.addPainting = (sim, d) => {
    init(); const W = W0();
    const q = d.q != null ? d.q : paintingQuality(hh, d.stats || { strokes: 20, colors: 4, secs: 60, coverage: 0.5 });
    const p = { id: (hh.gallery.reduce((a, x) => Math.max(a, x.id), 0) + 1), title: String(d.title || 'Tanpa Judul').slice(0, 60), by: sim.name, img: d.img, q, day: Math.floor(W.time / 1440), status: 'studio', price: 0, offers: [] };
    p.fair = fairPrice(hh, p); p.price = p.fair;
    hh.easter && hh.easter('lukisan', { p });
    hh.gallery.unshift(p); if (hh.gallery.length > 40) hh.gallery.pop();
    if (W.art.boost > 0) W.art.boost--;
    sim.xp('kreatif', 25 + q / 2); sim.mood('bermusik');
    hh.toast(`🎨 ${sim.name} menyelesaikan lukisan "${p.title}" · kualitas ${q}/100 · taksiran ${fmtRp(p.fair)}`, 'good', true); hh.sfx('goal');
    bump(); return p;
  };
  hh.artCmd = (sim, c) => {
    init(); const W = W0(); const p = hh.gallery.find((x) => x.id === c.id);
    if (c.op === 'list' && p && p.status !== 'sold') { p.status = 'listed'; p.price = Math.max(100000, Math.round((+c.price || p.fair) / 1000) * 1000); p.listedAt = W.time; hh.toast(`🛍️ "${p.title}" dipajang di toko online seharga ${fmtRp(p.price)}`, 'info'); }
    if (c.op === 'unlist' && p && p.status === 'listed') { p.status = 'studio'; p.offers = []; }
    if (c.op === 'delete' && p && p.status !== 'sold') hh.gallery = hh.gallery.filter((x) => x !== p);
    const O = p && p.offers.find((o) => o.id === c.oid);
    if (c.op === 'accept' && O && O.status === 'open') sell(p, O.buyer, O.city, O.amount);
    if (c.op === 'decline' && O) { O.status = 'ditolak'; hh.smsIn(O.buyer, 'Baik, tidak apa-apa. Semoga lain kali ada yang cocok.', false); }
    if (c.op === 'counter' && O && O.status === 'open') {
      const amt = Math.round(+c.amount / 1000) * 1000; if (!amt) return;
      if (amt <= O.max) { O.status = 'deal'; sell(p, O.buyer, O.city, amt); hh.toast(`🤝 ${O.buyer} setuju dengan harga tawaranmu ${fmtRp(amt)}!`, 'good', true); }
      else if (amt <= O.max * 1.18 && !O.countered) { O.countered = true; O.amount = Math.round((amt + O.max) / 2 / 1000) * 1000; O.msg = `Hmm, gimana kalau ketemu di tengah: ${fmtRp(O.amount)}?`; hh.toast(`${O.buyer} menawar balik ${fmtRp(O.amount)} untuk "${p.title}"`, 'info'); }
      else { O.status = 'batal'; O.msg = 'Maaf, di luar budget saya. Terima kasih.'; hh.toast(`${O.buyer} mundur, harganya terlalu tinggi`, 'bad'); }
    }
    if (c.op === 'hang' && p) { for (const o of W.objects) if (o.s && o.s.pid === p.id) o.s.pid = null; const f = W.objects.find((o) => o.id === c.obj); if (f) { f.s = f.s || {}; f.s.pid = p.id; W.objVer++; hh.toast(`🖼️ "${p.title}" dipajang di ${TYPES[f.type].name}`, 'good'); } }
    if (c.op === 'auction' && p && p.status === 'studio') { const start = Math.max(100000, Math.round((+c.start || p.fair * 0.6) / 10000) * 10000); p.status = 'auction'; p.auction = { start, bid: 0, bidder: null, ends: W.time + clamp(+c.hours || 12, 3, 48) * 60, log: [] }; hh.toast(`🔨 Lelang "${p.title}" dibuka mulai ${fmtRp(start)} — kolektor mulai berdatangan!`, 'money', true); }
    if (c.op === 'auctionEnd' && p && p.status === 'auction') p.auction.ends = W.time;
    if (c.op === 'auctionTick') { for (const q of hh.gallery) { const A = q.auction; if (q.status !== 'auction' || !A) continue;
        const fair = fairPrice(hh, q); const cur = A.bid || A.start; const heat = clamp(fair / cur, 0.3, 2.2);
        if (W.time < A.ends && Math.random() < 0.28 * heat) { const [who, city] = pick(BUYERS); const nb = Math.round((A.bid ? A.bid * (1.05 + Math.random() * 0.2) : A.start) / 10000) * 10000; if (nb <= fair * (1.1 + Math.random() * 0.9)) { A.bid = nb; A.bidder = `${who} (${city})`; A.log.push([W.time, A.bidder, nb]); hh.sfx('cash'); hh.toast(`🔨 Bid baru "${q.title}": ${fmtRp(nb)} oleh ${A.bidder}`, 'money'); } }
        if (W.time >= A.ends) { if (A.bid) { sell(q, A.bidder, 'lelang', A.bid); q.auction.done = true; hh.toast(`🔨 DOK! "${q.title}" terjual di lelang ${fmtRp(A.bid)} ke ${A.bidder} 🎉`, 'good', true); } else { q.status = 'studio'; hh.toast(`Lelang "${q.title}" selesai tanpa penawar. Coba harga buka lebih rendah.`, 'info'); } }
      } }
    if (c.op === 'commission') {
      const C = W.art.commissions.find((x) => x.id === c.cid); if (!C || !p || p.status === 'sold') return;
      const pay = Math.round(C.budget * (0.55 + p.q / 100 * 0.6) / 1000) * 1000;
      W.art.commissions = W.art.commissions.filter((x) => x !== C); sell(p, C.client, 'pesanan', pay, true);
      hh.smsIn(C.client, `Lukisannya sudah sampai, bagus sekali! Sudah saya transfer ${fmtRp(pay)}. Terima kasih Mbak Naswa 🙏`);
    }
    bump();
  };
  const sell = (p, buyer, city, amount, commission) => {
    const W = W0(); p.status = 'sold'; p.soldTo = `${buyer}${city ? ' · ' + city : ''}`; p.soldFor = amount; p.offers.forEach((o) => { if (o.status === 'open') o.status = 'tutup'; });
    hh.op({ o: 'money', d: amount, why: `Lukisan "${p.title}" terjual`, sim: 'Naswa' });
    W.art.sold++; W.art.earned += amount; W.art.fame += 1 + p.q / 50;
    const n = hh.sims.Naswa; if (n) { n.mood('lukisanTerjual'); const car = n.prof && n.prof.career; if (car) car.level = Math.min(5, artLevel(W)); }
    hh.toast(`🖼️ "${p.title}" ${commission ? 'diserahkan ke pemesan' : 'terjual ke ' + buyer}! +${fmtRp(amount)} · Kurir menjemput paket lukisan`, 'money', true); hh.sfx('cash');
    const lv = artLevel(W); if (lv !== W.art.lastLv) { if (W.art.lastLv != null) { hh.toast(`🏆 Naswa kini "${ART_TITLES[lv]}"!`, 'good', true); hh.sfx('fanfare'); hh.addFam(60); } W.art.lastLv = lv; }
    bump();
  };
  hh.collectorBuy = (name) => {
    const cand = hh.gallery.filter((p) => p.status !== 'sold').sort((a, b) => b.q - a.q)[0];
    if (!cand) { hh.toast(`${name}: "Belum ada lukisan baru ya? Aku tunggu karyamu berikutnya!"`, 'info'); return; }
    const amt = Math.round(fairPrice(hh, cand) * 1.2 / 1000) * 1000;
    cand.offers.push({ id: Date.now() % 1e9, buyer: name, city: 'datang langsung', amount: amt, max: Math.round(amt * 1.15), msg: `Aku jatuh cinta sama "${cand.title}". Boleh kubeli ${fmtRp(amt)}?`, status: 'open', at: hh.world.time });
    if (cand.status === 'studio') cand.status = 'listed';
    hh.toast(`🖼️ ${name} menawar "${cand.title}" seharga ${fmtRp(amt)} — cek HP > Toko Lukisan`, 'good', true); bump();
  };

  // ---- tiap jam ----
  hh.lifeHour = (hr) => {
    init(); const W = W0();
    for (const o of W.orders) if (o.status === 'dikemas' && W.time - o.at > 40) { o.status = 'dikirim'; o.eta = Math.max(o.eta, W.time + 30); hh.smsIn('Ekspedisi', `Paket #${o.id} sedang dalam perjalanan bersama kurir 🛵`, false); }
    if (Math.floor(W.time / 1440) !== W.dev.offerDay) refreshOffers(W);
    hh.artCmd(null, { op: 'auctionTick' });
    // tawaran pembeli lukisan
    let changed = false;
    for (const p of hh.gallery) {
      if (p.status !== 'listed') continue;
      for (const o of p.offers) if (o.status === 'open' && W.time - o.at > 1440) { o.status = 'kedaluwarsa'; changed = true; }
      const fair = fairPrice(hh, p); const ratio = fair / p.price;
      if (Math.random() < 0.12 * clamp(ratio, 0.2, 1.6) && p.offers.filter((o) => o.status === 'open').length < 3) {
        const [buyer, city] = pick(BUYERS); const amt = Math.round(Math.min(p.price * 1.02, fair * (0.6 + Math.random() * 0.5)) / 1000) * 1000;
        const O = { id: Date.now() % 1e9 + Math.floor(Math.random() * 1000), buyer, city, amount: amt, max: Math.round(Math.min(p.price, amt * (1.08 + Math.random() * 0.3)) / 1000) * 1000, msg: pick(['Halo kak, lukisannya masih ada? Saya tawar ya.', 'Suka banget sama warnanya. Boleh kurang?', 'Untuk ruang tamu kami, cocok sekali!', 'Apakah bisa dikirim minggu ini?']), status: 'open', at: W.time };
        p.offers.push(O); changed = true; hh.sfx('sms');
        hh.toast(`🛍️ ${buyer} (${city}) menawar "${p.title}" ${fmtRp(amt)} — buka HP > Toko Lukisan`, 'money');
        if (hh.hooks.ai) hh.hooks.ai(`Kamu adalah ${buyer} dari ${city}, calon pembeli lukisan online karya Naswa berjudul "${p.title}" (harga pajang ${fmtRp(p.price)}). Kamu menawar ${fmtRp(amt)}. Tulis satu pesan chat penawaran yang sopan & meyakinkan (maks 28 kata).`, 90).then((t) => { if (t) { O.msg = t; bump(); } });
      }
    }
    if (Math.random() < 0.04 && W.art.commissions.length < 2) { const [what, who] = pick(COMMISSIONS); const C = { id: Date.now() % 1e9, what, client: who, budget: Math.round((2500000 + Math.random() * 6e6 + W.art.fame * 250000) / 50000) * 50000, until: W.time + 4320 }; W.art.commissions.push(C); hh.smsIn(who, `Mbak Naswa, saya mau pesan lukisan: ${what}. Budget sekitar ${fmtRp(C.budget)}. Bisa dalam 3 hari?`); changed = true; }
    W.art.commissions = W.art.commissions.filter((C) => C.until > W.time);
    if (changed) bump();
    // SMS acak dari warga
    if (Math.random() < 0.05) { const [who, txt] = pick([['Bu Rina', 'Jangan lupa arisan Minggu sore ya, giliran kocok di rumahku 🎉'], ['Pak Harjo', 'Info RT: Minggu pagi 07.00 kerja bakti bersihkan selokan. Mohon hadir 🙏'], ['Kak Dinda', 'Dek, kapan-kapan aku main ya. Kangen Snowy!'], ['Bu Ratna', 'Le, sudah makan belum? Ibu kangen. Jaga kesehatan ya.'], ['Mas Dimas', 'Promo hari ini: kopi susu beli 2 gratis pisang goreng!'], ['Reza', 'Bro, ada lowongan proyek freelance nih, cek aplikasi Proyek ya.']]); hh.smsIn(who, txt); }
  };
}
