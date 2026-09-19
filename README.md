# Rumah Handoyo & Naswa — Perumahan Griya Asri

Game simulasi rumah tangga 3D ala The Sims. Bisa dimainkan sendiri, atau berdua dari 2 perangkat berbeda.

## Deploy ke Vercel (tanpa build)
**Cara A — lewat website (paling gampang)**
1. Ekstrak zip ini.
2. Buat repo baru di GitHub, unggah **isi** folder ini (index.html harus ada di root repo).
3. Di vercel.com → Add New → Project → pilih repo → Framework Preset: **Other**, Build Command: kosong, Output Directory: kosong → Deploy.

**Cara B — Vercel CLI**
```
npm i -g vercel
cd rumah-handoyo-naswa
vercel --prod
```

## Main berdua
1. Pemain 1: buka link game → **Buat room berdua** → pilih karakter → dapat kode 5 huruf + link.
2. Pemain 2: buka link yang dibagikan (kode terisi otomatis) → **Gabung**.
3. Masing-masing mengendalikan satu karakter. Perangkat pemain 1 adalah "host" — biarkan tab-nya tetap terbuka.
4. Kalau gagal tersambung di jaringan kantor/seluler tertentu, coba pakai WiFi yang sama atau hotspot. (Koneksi P2P memakai server sinyal gratis PeerJS + STUN Google.)

## Fitur baru
- **Dompet masing-masing Rp 10 miliar.** Gaji masuk ke dompet yang bekerja, belanja memotong dompet karakter yang sedang kamu pegang. Bisa kirim uang ke pasangan di tab Keuangan. Simpanan lama otomatis diisi 10 miliar per orang.
- **Obrolan suara saat main berdua.** Tekan tombol 🎙️ Suara (atau tombol di jendela room), izinkan mikrofon. Tekan lagi untuk bisu/aktif. Nama karakter menyala hijau saat orangnya bicara. Butuh HTTPS — otomatis di Vercel.
- **Hewan peliharaan: Oyen (kucing oranye) & Kapi (capybara).** Punya kebutuhan, AI sendiri, dan ikatan dengan Handoyo/Naswa. Benda baru di kategori Beli → Hewan: mangkok makan, kasur kucing, kotak pasir, tiang garukan, rumah capybara, kolam capybara.
- **Kamu bisa jadi hewannya.** Klik kartu Oyen/Kapi di panel (atau tombol "Main jadi capybara" di menu awal). Kapi bisa berendam di kolam, chill pakai jeruk di kepala, nyemil kebun; Oyen bisa naik ke punggung Kapi, garuk tiang, zoomies, dan menjatuhkan gelas. Saat main berdua, dua pemain sama-sama boleh mengendalikan hewan.

## Kontrol
- Klik benda = pilih aksi · klik pasangan = interaksi sosial · klik karakter sendiri = aksi HP · klik lantai = jalan
- Seret = putar kamera · scroll/cubit = zoom · WASD geser · Q/E putar · F ikuti · C mode dinding
- Spasi jeda · 1/2/3 kecepatan · Tab ganti karakter (main sendiri) · B mode beli · R putar barang

Simpanan otomatis tersimpan di browser host (localStorage).

## Struktur
- `js/data.js` data & balancing · `js/state.js` logika simulasi · `js/interactions.js` aksi
- `js/world.js` dunia 3D · `js/sim.js` karakter · `js/game.js` engine · `js/ui.js` HUD · `js/net.js` multiplayer
