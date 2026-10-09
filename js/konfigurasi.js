// ============================================================
//  ALAMAT SERVER
//
//  Saat dibuka lewat browser (Vercel), API berada di domain yang sama,
//  jadi cukup pakai alamat relatif.
//
//  Saat dibungkus jadi APK, berkas game dimuat dari dalam aplikasi
//  (https://localhost), sehingga "/api/db" tidak akan ketemu. Karena itu
//  APK harus menunjuk ke domain Vercel-mu.
//
//  >>> GANTI baris DOMAIN di bawah kalau domain Vercel-mu berbeda. <<<
// ============================================================
export const DOMAIN = 'https://rumahhandoyonaswa.vercel.app';

const didalamAplikasi =
  location.protocol === 'capacitor:' ||
  location.protocol === 'file:' ||
  (location.hostname === 'localhost' && !location.port) ||
  /\bMedia\/|wv\)/.test(navigator.userAgent) && location.hostname === 'localhost';

export const API = didalamAplikasi ? DOMAIN : '';
export const modeAplikasi = didalamAplikasi;
export const api = (jalur) => API + jalur;
