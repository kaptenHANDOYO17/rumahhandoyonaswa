// Menyalin HANYA berkas web ke folder www/ untuk dibungkus Capacitor jadi APK.
// (Tanpa ini, Capacitor ikut menyalin node_modules, android/, dan .git — APK jadi raksasa.)
import { cp, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const ISI = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'vendor', 'ikon'];
await rm('www', { recursive: true, force: true });
await mkdir('www', { recursive: true });
for (const n of ISI) {
  if (!existsSync(n)) { console.warn('dilewati (tidak ada):', n); continue; }
  await cp(n, `www/${n}`, { recursive: true });
}
console.log('www/ siap —', ISI.join(', '));
