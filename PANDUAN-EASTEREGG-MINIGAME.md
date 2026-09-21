# PANDUAN UPDATE — 10 Easter Egg, Minigame, & Sentuhan Detail
### Rumah Handoyo & Naswa · Griya Asri

---

## 1. Cara memasang update (paling gampang)

Isi folder ini sudah lengkap, jadi tidak perlu menambal file satu per satu.

1. Ekstrak `rumah-handoyo-naswa.zip`.
2. **Timpa** seluruh isi folder proyekmu dengan isi folder hasil ekstrak (replace all).
3. Push seperti biasa:
   ```bash
   git add -A
   git commit -m "Update: 10 easter egg, minigame Nasi Padang Rush, mode foto & polish"
   git push
   ```
4. Vercel akan otomatis deploy. **Tidak ada environment variable baru** — pengaturan AI dan database yang lama tetap jalan.

### File yang baru ditambahkan
| File | Isi |
|---|---|
| `js/easter.js` | 10 easter egg, jurnal rahasia, buku rahasia, piala |
| `js/minigame.js` | Minigame "Nasi Padang Rush" (5 level) |
| `js/polish.js` | Mode Foto, kunang-kunang, kupu-kupu, azan, konfeti, getaran kamera |

### File lama yang ikut berubah
`js/state.js`, `js/game.js`, `js/ui.js`, `js/life.js`, `js/town.js`, `js/seasons.js`, `js/floor2.js`, `css/style.css`, dan `README.md`.

> Simpanan lama tetap terbaca. Data easter egg dan minigame dibuat otomatis saat pertama kali dimuat.

---

## 2. Minigame: 🍛 Nasi Padang Rush

**Cara membuka:** Menu (☰) → **Minigame: Nasi Padang Rush**, atau klik **etalase RM Padang**, atau **mesin arcade** di rumah.

**Aturan main**
- Pelanggan datang membawa pesanan berupa 1–4 lauk.
- Klik lauk di etalase (atau tekan **1–6**) untuk menyusun piring, lalu **klik pelanggannya** untuk menyajikan.
- Susunan harus **persis sama**. Salah → kombo hangus.
- Makin cepat disajikan, makin besar tip. Kombo beruntun menambah tip 5% tiap tingkat.
- Level gagal jika **3 pelanggan kabur** atau waktu habis sebelum target omzet tercapai.

**Tombol pintas**
| Tombol | Fungsi |
|---|---|
| `1`–`6` | Ambil lauk |
| `Backspace` | Batalkan satu lauk |
| `Spasi` | Sajikan otomatis ke pelanggan yang pesanannya cocok |
| `Esc` | Keluar |

**5 level**
| Level | Judul | Target | Waktu | Catatan |
|---|---|---|---|---|
| 1 | Jam Sepuluh Pagi | Rp 120.000 | 75 dtk | Pemanasan, maksimal 2 meja |
| 2 | Makan Siang Kantor | Rp 260.000 | 85 dtk | 3 meja, mulai cepat |
| 3 | Rombongan Arisan RT | Rp 420.000 | 95 dtk | Kesabaran pelanggan menurun |
| 4 | Hujan & Pesanan Ojol | Rp 620.000 | 100 dtk | 4 meja sekaligus |
| 5 | Hidang Besar Akhir Pekan | Rp 900.000 | 115 dtk | Muncul pesanan hidang 4 lauk |

**Hadiah saat tamat**
- Upah 35% dari total omzet masuk ke dompet.
- 🏆 Piala "Juara Hidang" otomatis dipajang di ruang keluarga.
- Level keluarga naik & moodlet "Juara Nasi Padang Rush".
- Tamat **tanpa satu pun pelanggan kabur** → gelar rahasia **"Tangan Emas Etalase"** tercatat di jurnal.

**Tips**
- Sajikan pesanan 1 lauk lebih dulu untuk menjaga kombo tetap hidup.
- Pesanan hidang (4 lauk) bayarannya paling besar, kerjakan saat meja lain masih sabar.
- Tekan `Spasi` kalau ragu: sistem akan mencari pelanggan yang cocok dengan piringmu.

---

## 3. Sepuluh easter egg

Jurnalnya ada di **Menu → 🥚 Jurnal Rahasia**. Yang belum ketemu hanya menampilkan petunjuk, bukan jawaban, lengkap dengan bilah kemajuan.

> ⚠️ **Bagian di bawah ini berisi bocoran.** Kalau mau mencari sendiri, lewati saja.

<details>
<summary>Klik untuk membuka daftar jawaban lengkap</summary>

| # | Nama | Cara memicu | Hadiah |
|---|---|---|---|
| 1 | 🕹️ Kode Sakti Lawas | Ketik kode Konami di keyboard saat main: `↑ ↑ ↓ ↓ ← → ← → B A` | Rp 17.845.000 (tanggal kemerdekaan) + moodlet retro |
| 2 | 🌹 Kata Ajaib Tetangga Sebelah | Ketik `rosebud` (atau `motherlode`) di kolom **Chat** | Rp 10.000.000, sekali seumur rumah |
| 3 | 💎 Plumbob Pelangi | Klik karakter aktifmu sendiri **10×** dalam waktu singkat | Plumbob berubah warna pelangi selamanya |
| 4 | 👻 Penunggu Perpustakaan | Berada di **lantai 2** pada pukul **03.30–03.40** | Lampu berkedip + 2 buku rahasia muncul di rak forensik |
| 5 | 🔎 Detektif Rumahan | Baca **semua 14 buku forensik** sampai halaman terakhir | Gelar detektif + berkas rahasia komplek |
| 6 | ☕ Capy-ccino | Kendalikan **capybara** (Kapi/Kiki), lalu pesan kopi di Kopi Griya | Mahkota Raja Capybara |
| 7 | 🖼️ Mona Naswa | Simpan lukisan dengan judul mengandung kata **"mona"** | Tawaran museum 10× lipat harga taksiran |
| 8 | 🍂 Hujan Daun Emas | Musim gugur: **lompat ke tumpukan daun 5×** | Hujan daun + Rp 2.500.000 |
| 9 | 🇮🇩 Upacara Bendera RT 05 | **17 Agustus pukul 07.00**, berdiri di jalan depan rumah (z > 11) | Warga berbaris + konfeti + moodlet khidmat |
| 10 | 💭 Mimpi yang Sama | Saat **hujan/badai**, tidur berdua di kasur yang sama | Moodlet "Bermimpi hal yang sama" |

**Bonus:** menemukan kesepuluhnya → plakat "Penjelajah Griya Asri" dipajang, plumbob jadi emas, dan **Rp 100.000.000** masuk kas keluarga.

*Catatan waktu:* 17 Agustus di kalender game = bulan ke-8, dasarian ke-2 (hari ke-23 dalam tahun game). Kalau tidak mau menunggu, buka **Kalender** dan kunci musim, atau percepat waktu dengan tombol kecepatan.

</details>

---

## 4. Sentuhan detail baru

### 📸 Mode Foto
Menu → **Mode Foto**. HUD disembunyikan, kamera tetap bisa digeser dan di-zoom.
- 6 filter sinematik: Asli, Senja Hangat, Pagi Sejuk, Film 90-an, Hitam Putih, Dramatis.
- Garis bantu rule-of-thirds dan vinyet bisa dimatikan.
- **Jepret** (atau `Enter`) menghasilkan foto 1280px beserta cap "Griya Asri · hari ke-… · jam".
- Hasilnya bisa **diunduh** atau **disimpan ke Galeri**, lalu dipajang di pigura dinding rumah.
- `Esc` untuk keluar.

### Suasana yang lebih hidup
- **Kunang-kunang** muncul di halaman pada malam cerah, berkedip dan melayang pelan.
- **Kupu-kupu** beterbangan di halaman pada siang cerah (tidak muncul saat musim salju).
- **Azan magrib dan subuh** berkumandang dari musala komplek, lengkap dengan nada lembut dan narasi suasana.
- **Konfeti dan hujan daun** muncul saat momen spesial.
- **Getaran kamera** halus saat kejadian besar (easter egg, kembang api).
- **Plumbob** berubah pelangi atau emas sebagai penanda pencapaian.

---

## 5. Cara menguji cepat setelah deploy

1. Buka game → Menu → **Jurnal Rahasia** → harus tampil 0/10 dengan sepuluh petunjuk.
2. Ketik `↑ ↑ ↓ ↓ ← → ← → B A` → muncul notifikasi easter egg pertama.
3. Menu → **Minigame** → klik layar → mainkan level 1 (targetnya ringan).
4. Menu → **Mode Foto** → Jepret → **Simpan ke Galeri** → cek di tombol 🖼️ **Galeri**.
5. Ubah waktu ke malam hari (tombol kecepatan) → lihat kunang-kunang di halaman.

---

## 6. Untuk pengembangan lanjutan

**Menambah easter egg baru:** buka `js/easter.js`.
1. Tambahkan satu entri di array `EGGS` (id, nama, ikon, petunjuk, hadiah).
2. Tambahkan pemicunya:
   - berbasis kejadian → tambahkan `case` baru di fungsi `easterEvent`, lalu panggil `hh.easter('namaKejadian', data)` dari tempat mana pun;
   - berbasis waktu/kondisi dunia → tambahkan pengecekan di `easterMinute`.
3. Panggil `found(hh, 'id', 'pesan')` untuk mencatat penemuan. Hadiah bonus otomatis menyesuaikan jumlah total.

**Menambah level minigame:** tambahkan objek baru di array `LEVELS` dalam `js/minigame.js` (judul, target, durasi, kesabaran, jumlah meja maksimal, jeda spawn, pesan). Batas level pada pengecekan `state.lv < 5` tinggal disesuaikan.

**Catatan performa:** selama minigame dan Studio Lukis terbuka, render 3D dijeda otomatis agar tetap lancar di HP; simulasi dunia tetap berjalan.
