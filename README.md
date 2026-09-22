# Rumah Handoyo & Naswa — Perumahan Griya Asri

> ⚙️ **Belum mengatur Vercel?** Baca `PANDUAN-SETUP.md` — panduan lengkap untuk kunci AI (Groq / Google / OpenRouter), database Upstash, TURN, dan cara mengeceknya.

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






## Update 8 — Obrolan Nyambung, Sawah di Belakang Rumah, Romansa Lebih Dalam

### 💬 Obrolan diperbaiki
Penyebab jawaban ngawur: kunci AI belum diatur, sehingga game memakai kalimat cadangan acak.
- Ditambahkan **otak obrolan bawaan** (`js/chatbrain.js`): tanpa API pun warga menjawab sesuai isi pertanyaan — jam, cuaca, musim, harga menu, iuran RT, utang Bang Jefri, hasil panen, lukisan Naswa, hewan peliharaan, sampai "lagi apa" dan "di mana".
- Prompt untuk AI diperbaiki: sekarang menyertakan konteks waktu/cuaca dan perintah tegas untuk **menjawab pertanyaan terakhir secara langsung**.
- Jendela obrolan menampilkan status: apakah sedang dijawab AI atau otak bawaan.
- Balasan SMS juga memakai otak yang sama.

### 🌾 Sawah & kebun luas di belakang rumah
- Hamparan 120 × 62 meter: 3 petak **padi berair** (lengkap dengan pematang & saluran irigasi), bedeng **cabai** dan **tomat** berajir, kebun **pisang**, kebun **sawit**, dan ladang **jagung**.
- Detail: gubuk/saung berlampu, 3 orang-orangan sawah, traktor tangan, jemuran gabah, karung panen, drum air, 16 ekor bebek berkeliaran, dan burung kuntul berputar di langit.
- **10 petani** bekerja sungguhan sepanjang hari: membajak, menanam, mengatur air, memanen padi, merawat cabai, mengikat tomat, menebang tandan pisang, memilah sawit, dan menjemur gabah. Mereka berhenti saat hari gelap.
- **Pak Tarno** membuka lapak hasil panen di pagar belakang: sayur sepaket, cabai & tomat, pisang sesisir, beras 5 kg, dan opsi **ikut turun ke sawah menanam padi** (dapat upah + sekantong sayur).
- Semua tanaman digambar dengan instanced mesh agar tetap ringan di HP.

### 💞 Romansa lebih dalam (tetap tertutup)
- Interaksi baru **"Gendong pasangan ke kamar"** yang berlanjut ke momen berdua.
- Saat momen berlangsung: **lampu kamar meredup jadi hangat kemerahan**, kelopak mawar beterbangan, dan layar privasi muncul.
- **ART, tamu, dan tetangga otomatis menghormati privasi** — tidak ada yang masuk atau mengajak bicara.
- Setelahnya keduanya berpelukan, mendapat moodlet, dan hubungan bertambah.

> Catatan: adegan intim ditampilkan tertutup seperti di The Sims (fade & layar privasi), tanpa konten eksplisit.

## Update 7 — Easter Egg, Minigame & Polish

- **10 easter egg tersembunyi** + jurnal rahasia (Menu → 🥚 Jurnal Rahasia) dengan petunjuk, bilah kemajuan, dan hadiah besar bila semuanya ditemukan.
- **Minigame "Nasi Padang Rush"** — 5 level dengan target omzet, kesabaran pelanggan, kombo & tip, serta layar TAMAT. Hadiah: upah, piala yang dipajang di rumah, dan gelar rahasia bila tanpa pelanggan kabur.
- **Mode Foto** — HUD disembunyikan, 6 filter sinematik, garis bantu, vinyet, cap tanggal, unduh atau pajang hasilnya di pigura rumah.
- **Detail suasana**: kunang-kunang malam hari, kupu-kupu siang hari, azan magrib & subuh, konfeti, hujan daun, getaran kamera, plumbob pelangi/emas.

Panduan lengkap (termasuk bocoran cara memicu tiap easter egg): `PANDUAN-EASTEREGG-MINIGAME.md`.

## Update 6 — Perpustakaan Raksasa & Rumah Makan Padang

### 📚 Perpustakaan lantai 2 kini 82 buku · 566 halaman
- **Rak forensik baru (14 buku, 6–8 bab tiap buku)** — bacaan favorit Naswa:
  daktiloskopi (sidik jari), DNA forensik, kedokteran forensik, entomologi forensik,
  antropologi & odontologi forensik, toksikologi, balistik & jejak alat, forensik digital,
  pemeriksaan dokumen, psikologi forensik, olah TKP lanjutan, laboratorium forensik Indonesia,
  kesalahan forensik & vonis yang salah, serta satu novel forensik ringan berlatar Griya Asri.
  Semuanya edukatif, faktual, dan non-grafis — tanpa hal yang bisa disalahgunakan.
- **Buku yang sudah ada jadi jauh lebih tebal**:
  - Karya domain publik (Crime and Punishment, Botchan, Kokoro, Catatan dari Bawah Tanah,
    Max Havelaar, The Prince, De Caelo, A Study in Scarlet, Pembunuhan di Rue Morgue)
    mendapat panduan bab demi bab, daftar tokoh, kutipan terjemahan sendiri, dan pertanyaan diskusi.
  - Buku modern yang masih berhak cipta mendapat halaman kajian: tokoh, tema besar,
    pertanyaan klub buku, rekomendasi bacaan lanjutan, dan "Catatan Naswa".
    Isinya ditulis sendiri, bukan salinan teks aslinya.
- **Pembaca buku**: penggeser halaman untuk lompat cepat dan penanda halaman otomatis,
  jadi bacaan panjang bisa dilanjutkan kapan saja. Jumlah halaman tampil di daftar rak.
- **Naswa si kutu buku**: kalau sedang tidak dikendalikan, ia rutin naik ke lantai 2,
  memilih buku (60% rak forensik), lalu membaca di meja lampu hijau.

### 🍛 Rumah Makan Padang "Uni Rosna" di samping rumah
- Berlokasi di sisi timur rumah, di belakang Warung Madura, masuk lewat gang samping.
  Ada papan penunjuk di mulut gang.
- **Ruangan lengkap & detail**: etalase kaca tiga tingkat penuh piring lauk (rendang, ayam pop,
  gulai kepala ikan, dendeng balado, telur balado, perkedel, daun singkong, sambal ijo),
  piring susun khas Padang, bakul nasi mengepul, tiga meja makan panjang dengan bangku,
  kaleng kerupuk, kobokan, botol sambal & kecap, meja kasir, wastafel cuci tangan,
  dapur dengan wajan rendang besar dan rak bumbu, kipas angin langit-langit yang berputar,
  lukisan rumah gadang, papan harga, dan ornamen gonjong di fasad.
- **Penjaganya tiga orang**: Uda Rizal (etalase), Uni Rosna (kasir), dan Ajo Fikri (pelayan).
  Buka 07.00–22.00.
- **Menu yang bisa dibeli**: nasi rendang (28K), ayam pop (25K), gulai kepala ikan (35K),
  dendeng balado (30K), paket hemat (15K), teh talua (18K),
  **makan hidang** (85K — Ajo Fikri menghidangkan belasan piring ke meja),
  dan **bungkus** (56K — menambah 2 porsi makanan di rumah).
- Warga komplek juga ikut makan di sana, jadi rumah makannya benar-benar hidup.

## Update 5 — Studio Lukis Pro, 4 Musim, Layanan Darurat, Pasangan Super Mesra

### 🎨 Studio Lukis Pro
Klik easel → **Melukis sendiri**.
- **20 alat**: kuas bulat, cat minyak (bulu kuas), cat air, pena tinta, pensil, arang, spidol, kaligrafi, airbrush, cahaya/neon, stempel dedaunan & bintang, baurkan (smudge), penghapus, ember cat, gradasi, garis, persegi, elips, dan pipet warna.
- **Pengaturan kuas & kanvas**:
  - 3 lapisan (Latar/Utama/Detail) dengan opasitas & sembunyikan;
  - pemilih warna HSV + kode hex;
  - 7 palet estetik (Nusantara, Senja, Laut, Hutan, Pastel, Monokrom, Van Gogh) + warna terakhir;
  - ukuran, opasitas, kelembutan, stabilizer (garis halus), simetri cermin, dan garis bantu ⅓;
  - 5 jenis kanvas (linen, kertas cat air, putih, kraft, gelap).
- **Kendali**: undo/redo (Ctrl+Z / Ctrl+Y), [ ] untuk ukuran kuas, dan dukungan tekanan pen stylus.
- **Sentuhan akhir**: vinyet, nada hangat, tekstur, dan pernis.
- **Nilai kualitas** naik dengan banyaknya goresan, variasi warna & alat, cakupan, lama melukis, dan keahlian Kreatif.
- **Galeri** (tombol 🖼️ atau klik easel/pigura):
  - pajang di **pigura berdiri** atau **pigura dinding** (Mode Beli → Dekor);
  - jual dengan harga pas (pembeli menawar);
  - **lelang** dengan harga buka & durasi, di mana kolektor saling bid lalu palu diketuk;
  - unduh hasil lukisan (JPG).

### 📅 Kalender tahunan & 4 musim
- **Sistem kalender**:
  - 1 tahun game = 36 hari (12 bulan × 3 dasarian).
  - Tanggal & suhu tampil di bawah jam; klik untuk membuka kalender.
  - Musim bisa dikunci manual dari kalender.
- **Acara tahunan**: Tahun Baru & HUT RI (dengan kembang api), Valentine, ulang tahun Handoyo & Naswa, anniversary, Hari Ibu, dan lainnya.
- ❄️ **Salju** (Des–Feb, −6…2°C):
  - salju menumpuk di tanah, atap, dan pohon;
  - **jalan tertutup salju** → pedagang & kurir tidak lewat, kerja naik kendaraan batal, polisi memasang barikade;
  - sekop salju, bikin boneka salju, kedinginan tanpa pemanas/perapian.
- 🌧️ **Hujan** (Mar–Mei):
  - hujan deras & badai → **banjir**;
  - kuras air sendiri atau panggil damkar;
  - rawan masuk angin.
- ☀️ **Panas** (Jun–Agu, 32–39°C):
  - gelombang panas, kepanasan tanpa AC/kipas;
  - tanaman cepat kering, main air pakai selang.
- 🍂 **Gugur** (Sep–Nov):
  - daun berguguran & menumpuk di tanah, pohon & rumput menguning;
  - sapu atau lompat ke tumpukan daun.
- **Barang baru**: AC berdiri, kipas angin, pemanas ruangan, perapian batu, APAR.

### 🚨 Layanan darurat
Buka lewat tombol **Darurat**.
- 🚓 **Polisi** (Bripka Joko & Briptu Sari): tangani kemalingan (uang bisa kembali kalau cepat lapor), patroli malam, dan barikade jalan.
- 🚒 **Damkar** (Pak Bambang & Mas Andi): padamkan kebakaran akibat korsleting dan sedot banjir. Kebakaran juga bisa dipadamkan sendiri pakai APAR.
- 🩺 **Dokter** (dr. Rani): datang ke rumah mengobati yang sakit.
- Kendaraan datang lengkap dengan sirene & lampu berkedip.

### 💞 Handoyo & Naswa super mesra
- **Hubungan & keluarga**: hubungan selalu 100/100, level keluarga langsung **maksimal**, dan moodlet permanen "Pasangan super mesra".
- **12 interaksi romantis baru**: cium kening, cium pipi, ngobrol manja, rayuan maut, suapin, pijat pundak, dansa romantis, surat cinta, gendong, bisikan sayang, sandaran manja, dan lainnya. Mereka juga sering bermesraan sendiri.
- **"Bercinta"** di kasur ganda: momen intim yang ditampilkan tertutup (layar diredupkan dengan hati), tanpa adegan eksplisit, seperti di The Sims.

## Update 4 — Akun, Simpanan Cloud & Rumah Berdua Permanen

### Yang baru
- **Login akun** (nama akun + kata sandi). Progres solo dan berdua tersimpan di database cloud, jadi bisa dilanjutkan dari HP/laptop mana pun.
- **Rumah Permanen `HNDNS`**: room khusus Handoyo & Naswa dengan kode yang selalu sama. Rumah terus berjalan selama minimal satu dari kalian online. Siapa pun yang masuk duluan otomatis jadi "server".
  - Kalau host keluar, pasangannya **mengambil alih** tanpa kehilangan progres.
  - Simpan otomatis tiap 30 detik, saat tab ditutup, dan saat aplikasi diminimalkan.
  - Di menu terlihat siapa yang sedang online.
- **Tidak ada lagi "room penuh" setelah logout.** Koneksi mati terdeteksi dalam ≤7 detik, dan pemain yang sama selalu bisa masuk lagi.
- **Suara lebih stabil.**
  - Data dunia dikirim hanya bagian yang berubah, jadi lalu lintas ±9× lebih kecil.
  - Audio Opus dengan FEC, bitrate stabil, dan buffer jitter.
  - Jalur ICE otomatis dipulihkan, dan dukungan server TURN tersedia.
- **Anti-macet.**
  - Karakter tidak lagi terkunci "diajak ngobrol" oleh warga yang sudah pulang.
  - Karakter yang tersangkut dirapikan otomatis.
  - Ada tombol **🔧 Lepas macet** di Menu.
- **Dunia tetap berjalan saat tab host diminimalkan.** Waktu game juga tetap akurat di HP yang lambat.
- **Lampu keliling halaman rumah**: tiang lampu di sepanjang pagar, jalan setapak ke pintu, dan lampu sorot fasad. Semuanya menyala otomatis saat malam.
- **Warga makin banyak (38 orang).**
  - Keluarga baru: Pak Hasan (dosen) + Bu Lina + Nadia, Mbah Karso & Mbah Warsini, Pak Gunawan (ojol) + Bu Endang + Bima, Om Bram, Mbak Tika.
  - Klik warga → **Berkunjung ke rumahnya**: karaktermu pergi bertamu 1,5–3 jam lalu pulang membawa cerita.
- **AI Gemma di setiap karakter**: klik siapa pun (warga, ART, tamu, pasangan, bahkan kucing & capybara) → **Ngobrol bebas (AI)**. Jawabannya sesuai sifat masing-masing dan muncul di gelembung bicara untuk kedua pemain.

### Mengaktifkan database (wajib agar progres tersimpan di cloud)
1. Di dashboard Vercel → project ini → **Storage / Marketplace** → tambahkan **Upstash for Redis** (paket gratis cukup) dan hubungkan ke project.
   Env `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` (atau `KV_REST_API_URL` & `KV_REST_API_TOKEN`) akan terisi otomatis.
2. **Redeploy**. Di layar login akan muncul "✅ Tersambung ke database cloud".

Tanpa database, game tetap bisa dimainkan, tetapi akun & progres hanya tersimpan di perangkat masing-masing.

### Mengaktifkan AI Gemma
- Buat API key di Google AI Studio, lalu isi env Vercel `GEMINI_API_KEY`.
- Opsional: isi `GEMMA_MODEL` (default `gemma-4-26b-a4b-it`).
- Kunci tetap aman di server (`/api/ai`). Alternatifnya, masukkan kunci pribadi di HP → app **AI Gemma** (disimpan di browser).

### Server tetap (opsional, untuk koneksi paling stabil)
- **Server sinyal sendiri**: folder `server/` berisi PeerServer.
  1. Deploy ke Railway/Render/Fly.io dengan perintah `npm install && npm start`.
  2. Isi env Vercel: `PEER_HOST=<domain-server>`, `PEER_PORT=443`, `PEER_PATH=/griya`, `PEER_SECURE=true`.
- **TURN relay** (disarankan kalau suara/koneksi sering putus di jaringan seluler/kantor):
  1. Ambil kredensial dari penyedia TURN (mis. Metered, Twilio).
  2. Isi `TURN_URLS` (dipisah koma), `TURN_USER`, dan `TURN_PASS`.

## Update 3
- **Efek suara per komponen** (dibuat langsung oleh browser, tanpa file audio): langkah kaki, desis masakan, air shower & keran, TV, musik speaker, ketikan, kunyahan, dengkur, siram toilet, mesin potong rumput, "ocehan" ala Simlish saat ngobrol, tawa, "awww" saat berpelukan, meong & dengkuran kucing, cicit capybara, cipratan kolam, halaman buku, burung di siang hari, jangkrik malam, hujan. Suara makin pelan kalau jauh dari kamera. Volume di Menu.
- **Pelukan**: Peluk, Pelukan hangat yang lama, Peluk dari belakang (suami-istri), Peluk erat hewan, dan Pelukan hangat dengan tetangga.
- **Tetangga aktif**: Pak Ismail (gemuk, pakai peci & batik, suka numpang nonton bola & nyicip makanan), Bu Aisyah (sering antar opor), Pak Budi & Bu Rina (jogging pagi, ngerumpi), dan **Bang Jefri** yang sering datang pinjam uang — muncul jendela Pinjamkan/Tolak; dia melunasi pokok + bunga (kadang minta mundur sehari dengan bunga tambahan). Bisa ditagih lebih awal.
- **Karakter lebih detail**: iris & kilau mata, kelopak, bulu mata, hidung, bibir, dagu, telinga, kumis tipis & brewok Handoyo, kerah, kancing, saku, ikat pinggang, jam tangan, gelang & bros hijab Naswa, jari tangan, sol sepatu.
- **Hewan berpasangan & beranak**: Oyen ♂ + Snowy ♀ (kucing putih), Kapi ♂ + Kiki ♀ (capybara). Interaksi "Bermesraan" bisa bikin hamil → lahir 2–3 anak (tumbuh dewasa dalam 4 hari, menyusu & mengikuti induknya). Maksimal 14 hewan.
- **ART**: Mbak Sri (bersih-bersih), Bi Inah (masak & cuci baju), Pak Darto (kebun & mobil). Datang 06.00–18.00, bisa diliburkan di tombol ART.
- **Rumah 2 lantai**: tangga di ruang keluarga, lantai 2 = perpustakaan lengkap (15 rak, meja baca lampu hijau, bola dunia). Tombol 🪜 untuk pindah tampilan lantai. 24 buku bisa dibaca (tombol 📚 atau klik rak): kriminologi & forensik, fiksi detektif/kriminal, dan memahami & mencegah bunuh diri (ditulis mengikuti pedoman pemberitaan aman, dengan info layanan SEJIWA 119 ext 8).

## Kontrol
- Klik benda = pilih aksi · klik pasangan = interaksi sosial · klik karakter sendiri = aksi HP · klik lantai = jalan
- Seret = putar kamera · scroll/cubit = zoom · WASD geser · Q/E putar · F ikuti · C mode dinding
- Spasi jeda · 1/2/3 kecepatan · Tab ganti karakter (main sendiri) · B mode beli · R putar barang

Simpanan otomatis tersimpan di browser host (localStorage).

## Struktur
- `js/data.js` data & balancing · `js/state.js` logika simulasi · `js/interactions.js` aksi
- `js/world.js` dunia 3D · `js/sim.js` karakter · `js/game.js` engine · `js/ui.js` HUD · `js/net.js` multiplayer
