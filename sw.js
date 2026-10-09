// ============================================================
//  SERVICE WORKER — membuat game bisa dipasang & dibuka tanpa internet
//
//  · Berkas game (HTML, JS, CSS, vendor three.js, ikon) disimpan di perangkat.
//  · /api/* SELALU lewat jaringan — progres & multiplayer tidak boleh basi.
//  · Versi dinaikkan tiap rilis supaya pemain otomatis dapat versi terbaru.
// ============================================================
const VERSI = 'griya-asri-v12';
const INTI = [
  './', './index.html', './manifest.webmanifest',
  './css/style.css',
  './vendor/three.module.js', './vendor/peerjs.min.js',
  './ikon/ikon-192.png', './ikon/ikon-512.png', './ikon/ikon-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSI);
    // satu berkas gagal tidak boleh menggagalkan pemasangan
    await Promise.all(INTI.map((u) => c.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSI) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => { if (e.data === 'lewati-tunggu') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                 // CDN font dll: biarkan apa adanya
  if (url.pathname.startsWith('/api/')) return;               // progres & multiplayer: selalu jaringan

  e.respondWith((async () => {
    const c = await caches.open(VERSI);
    const simpanan = await c.match(req, { ignoreSearch: true });
    // Jaringan dulu untuk dokumen & modul (supaya pembaruan cepat terpakai),
    // tapi jatuh ke simpanan kalau sedang offline.
    const dariJaringan = fetch(req).then((r) => {
      if (r && r.ok && r.type === 'basic') c.put(req, r.clone()).catch(() => {});
      return r;
    }).catch(() => null);
    if (simpanan) { dariJaringan.catch(() => {}); return simpanan; }
    const r = await dariJaringan;
    if (r) return r;
    if (req.mode === 'navigate') return (await c.match('./index.html')) || Response.error();
    return Response.error();
  })());
});
