// ============================================================
//  PASANG SEBAGAI APLIKASI
//  Menangkap peristiwa beforeinstallprompt lalu menawarkan tombol
//  "Pasang di perangkat ini" di menu awal — supaya game bisa dibuka
//  dari layar utama HP atau dari Start Menu laptop seperti aplikasi biasa.
// ============================================================
let tawaran = null;
let sudahTerpasang = window.matchMedia('(display-mode: standalone)').matches
  || window.matchMedia('(display-mode: fullscreen)').matches
  || window.navigator.standalone === true;

window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); tawaran = e; perbarui(); });
window.addEventListener('appinstalled', () => { tawaran = null; sudahTerpasang = true; perbarui(); });

export const bisaDipasang = () => !!tawaran;
export const terpasang = () => sudahTerpasang;

export async function pasang() {
  if (!tawaran) return 'tidak-tersedia';
  tawaran.prompt();
  const { outcome } = await tawaran.userChoice;
  if (outcome === 'accepted') { sudahTerpasang = true; tawaran = null; }
  perbarui();
  return outcome;
}

// Petunjuk manual untuk peramban yang tidak punya tombol pasang otomatis
export function caraPasangManual() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'Di iPhone/iPad: buka lewat Safari → tombol Bagikan (kotak dengan panah ke atas) → "Add to Home Screen".';
  if (/Android/i.test(ua)) return 'Di Android: buka lewat Chrome → menu ⋮ di pojok kanan atas → "Install app" atau "Add to Home screen".';
  return 'Di laptop: buka lewat Chrome/Edge → klik ikon pasang (monitor dengan panah) di ujung kanan kolom alamat → Install.';
}

function perbarui() {
  const b = document.getElementById('lPasang'); if (!b) return;
  b.hidden = sudahTerpasang || !tawaran;
}
export function siapkanTombol() {
  const b = document.getElementById('lPasang'); if (!b) return;
  b.onclick = async () => {
    const h = await pasang();
    if (h === 'tidak-tersedia') alert(caraPasangManual());
  };
  perbarui();
}
