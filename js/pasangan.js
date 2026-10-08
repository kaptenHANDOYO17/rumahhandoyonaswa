// ============================================================
//  PASANGAN YANG DIJALANKAN KOMPUTER
//  Kalau salah satu pemain offline, karakternya tidak berdiri diam:
//  komputer menjalankan rutinitas hariannya sesuai profesi —
//  Handoyo (programmer) kerja & ngoding, Naswa (pelukis) melukis,
//  jual lukisan, baca buku di perpustakaan, ngopi, dan beberes.
//  Hasilnya tetap masuk ke progres dunia, jadi saat pemainnya
//  kembali ia menemukan uang, karya, dan rumah yang terurus.
// ============================================================
import { TYPES } from './data.js';
import { INTER } from './interactions.js';
import { COINS } from './crypto.js';

const acak = (a) => a[Math.floor(Math.random() * a.length)];
const adaObj = (hh, t) => hh.world.objects.find((o) => o.type === t);

// coba jalankan satu interaksi pada objek bertipe `tipe`
function coba(hh, sim, key, tipe, extra) {
  const I = INTER[key]; if (!I) return false;
  const kand = hh.world.objects.filter((o) => o.type === tipe);
  for (const ob of kand) {
    if (hh.objBusy(ob, sim)) continue;
    if (!TYPES[ob.type] || !TYPES[ob.type].acts || !TYPES[ob.type].acts.includes(key)) continue;
    const c = hh.ctx(sim, ob, extra);
    if ((I.check ? I.check(c) : true) !== true) continue;
    hh.queueAct(sim, key, ob.id, extra);
    const q = sim.queue[sim.queue.length - 1]; if (q) { q.auto = true; q.komputer = true; }
    return true;
  }
  return false;
}

// ---------------- rutinitas profesi ----------------
function kerjaHandoyo(hh, sim, hr, day) {
  const car = sim.prof && sim.prof.career;
  const belumKerja = car && car.workedDay !== day;
  const hariKerja = day % 7 < 5;
  if (hariKerja && belumKerja && hr >= 7 && hr < 15) {
    if (hh.roadBlocked && hh.roadBlocked()) { if (coba(hh, sim, 'wfh', 'desk')) return true; }
    if (coba(hh, sim, 'workOjol', 'gate')) return true;
    if (coba(hh, sim, 'wfh', 'desk')) return true;
  }
  // malam / akhir pekan: ngoding proyek freelance
  if ((hr >= 16 && hr < 22) || !hariKerja) { if (Math.random() < 0.65 && coba(hh, sim, 'codeProject', 'desk')) return true; }
  return false;
}
function kerjaNaswa(hh, sim, hr) {
  if (hr >= 7 && hr < 18) {
    // melukis di easel — lukisan ikut terjual otomatis sesuai keahlian
    if (Math.random() < 0.72 && coba(hh, sim, 'paint', 'easel')) return true;
  }
  // Naswa gemar membaca: sore/malam naik ke perpustakaan lantai 2
  if (hr >= 15 && hr < 23 && Math.random() < 0.55) {
    for (const t of ['readTable', 'bookshelfLib', 'bookshelf']) if (coba(hh, sim, t === 'readTable' ? 'readLib' : 'readShelf', t)) return true;
  }
  return false;
}
// jajan / nongkrong supaya terasa hidup, bukan cuma di dalam rumah
function keluarRumah(hh, sim, hr) {
  if (hr >= 7 && hr < 11 && Math.random() < 0.3) { if (coba(hh, sim, acak(['kopiSusu', 'americano', 'matcha']), 'coffeeCounter')) return true; }
  if (hr >= 11 && hr < 14 && Math.random() < 0.3) { if (coba(hh, sim, acak(['pdHemat', 'pdRendang', 'pdAyamPop']), 'padangCounter')) return true; }
  if (hr >= 16 && hr < 21 && Math.random() < 0.22) { if (coba(hh, sim, acak(['nongkrong', 'sketchCafe']), 'cafeTableOut')) return true; }
  if (hr >= 17 && hr < 22 && Math.random() < 0.18) { if (coba(hh, sim, 'wSnack', 'warungCounter')) return true; }
  return false;
}
// beberes rumah: bagian paling berguna saat pemainnya pergi lama
function beberes(hh, sim) {
  const H = hh.world.house;
  if (H.dishes >= 2 && coba(hh, sim, 'washDishes', 'counterSink')) return true;
  if (H.trash >= 3 && coba(hh, sim, 'takeTrash', 'kitchenTrash')) return true;
  if (H.laundry >= 2 && coba(hh, sim, 'doLaundry', 'washer')) return true;
  if (hh.world.dirt && hh.world.dirt.length >= 2) { const d = hh.world.dirt.find((x) => (x.lvl || 0) === (sim.lvl || 0)) || hh.world.dirt[0]; if (d) { hh.queueAct(sim, 'mop', null, { dirt: d }); return true; } }
  if (H.grass > 75 && coba(hh, sim, 'mowLawn', 'mower')) return true;
  const bowl = adaObj(hh, 'petBowl'); if (bowl && (bowl.s.food || 0) < 30 && coba(hh, sim, 'fillBowl', 'petBowl')) return true;
  const lit = adaObj(hh, 'litterBox'); if (lit && (lit.s.dirt || 0) >= 3 && coba(hh, sim, 'cleanLitter', 'litterBox')) return true;
  for (const t of ['plant', 'plantPot', 'veggie']) { const p = hh.world.objects.find((o) => o.type === t && (o.s.water ?? 100) < 35); if (p && coba(hh, sim, 'water', t)) return true; }
  return false;
}
// kelola kripto sedikit-sedikit: beli saat murah, cairkan saat untung besar
function urusKripto(hh, sim) {
  const W = hh.world, C = W.crypto; if (!C || !hh.cryptoCmd) return false;
  if (W.kriptoJam != null && W.time - W.kriptoJam < 60 * 8) return false;    // paling cepat 8 jam sekali
  W.kriptoJam = W.time;
  if (Math.random() > 0.45) return false;
  const c = acak(COINS.filter((x) => x.k !== 'IDRT'));
  const r = (C.riwayat && C.riwayat[c.k]) || []; if (r.length < 6) return false;
  const lalu = r[Math.max(0, r.length - 24)]; const kini = r[r.length - 1];
  const ubah = (kini - lalu) / lalu;
  const punya = (C.dompet[sim.name] || {})[c.k] || 0;
  if (ubah < -0.04 && sim.wallet > 200000000) { hh.cryptoCmd({ nama: sim.name, op: 'beli', coin: c.k, rupiah: Math.round(sim.wallet * 0.05) }); return true; }
  if (ubah > 0.06 && punya > 0) { hh.cryptoCmd({ nama: sim.name, op: 'jual', coin: c.k, jumlah: punya * 0.15 }); return true; }
  return false;
}

// Naswa yang dijalankan komputer juga mengurus toko online lukisannya:
// karya baru dipajang, tawaran bagus diterima, yang kurang ditawar balik.
function urusLukisan(hh, sim) {
  if (sim.name !== 'Naswa' || !hh.artCmd || !hh.gallery) return false;
  const W = hh.world;
  if (W.lukisJam != null && W.time - W.lukisJam < 60 * 3) return false;
  W.lukisJam = W.time;
  let ada = false;
  for (const p of hh.gallery) {
    if (p.status === 'studio' && p.fair) { hh.artCmd(sim, { op: 'list', id: p.id, price: Math.round(p.fair * 1.05) }); ada = true; break; }
  }
  for (const p of hh.gallery) {
    const O = (p.offers || []).find((o) => o.status === 'open'); if (!O) continue;
    if (O.amount >= p.fair * 0.85) hh.artCmd(sim, { op: 'accept', id: p.id, oid: O.id });
    else hh.artCmd(sim, { op: 'counter', id: p.id, oid: O.id, amount: Math.round(p.fair * 0.95) });
    ada = true; break;
  }
  return ada;
}

// ---------------- otak utama ----------------
//  Dipanggil sebelum kehendak bebas biasa. Kebutuhan mendesak
//  (lapar/kamar mandi/tidur) tetap ditangani autonomy() bawaan.
export function otakPasangan(hh, sim) {
  const n = sim.needs, hr = hh.hour(), day = hh.day();
  // kebutuhan mendesak: serahkan ke kehendak bebas biasa
  if (n.bladder < 35 || n.hunger < 32 || n.hygiene < 32) return false;
  if ((hr >= 22 || hr < 6) && (!hh.world.opt || !hh.world.opt.energy || n.energy < 45)) return false;
  urusKripto(hh, sim);
  urusLukisan(hh, sim);
  if (sim.name === 'Handoyo' && kerjaHandoyo(hh, sim, hr, day)) return true;
  if (sim.name === 'Naswa' && kerjaNaswa(hh, sim, hr)) return true;
  if (beberes(hh, sim)) return true;
  if (keluarRumah(hh, sim, hr)) return true;
  return false;
}
