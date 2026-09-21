# PANDUAN SETUP — Rumah Handoyo & Naswa
### Yang perlu kamu atur di Vercel setelah deploy (AI, database, dan lainnya)

Game-nya sudah bisa dimainkan **tanpa konfigurasi apa pun**. Yang di bawah ini untuk menghidupkan fitur tambahan: AI untuk warga, simpanan progres di cloud, dan koneksi multiplayer yang lebih stabil.

---

## 0. Ringkasan: apa yang masih kurang

| Fitur | Tanpa setup | Setelah setup | Wajib? |
|---|---|---|---|
| 🤖 Warga dijawab AI (SMS, ngobrol bebas, tawaran pembeli lukisan) | Dialog bawaan (tetap jalan) | Jawaban hidup sesuai karakter | Opsional |
| ☁️ Simpan progres solo & berdua di cloud + login akun | Simpanan hanya di browser perangkat itu | Bisa lanjut dari HP/laptop mana pun | Sangat disarankan |
| 🏠 Room permanen `HNDNS` untuk main berdua | Jalan, tapi progres lokal | Progres berdua aman di database | Ikut poin di atas |
| 🎙️ Suara & koneksi di jaringan sulit (4G/kantor) | Kadang gagal nyambung | Jauh lebih stabil (TURN) | Opsional |
| 📡 Server sinyal sendiri (pengganti server publik PeerJS) | Pakai server publik | Lebih stabil & milik sendiri | Opsional |

Semua diatur di **satu tempat**: Vercel → project kamu → **Settings → Environment Variables**. Setelah menambah variabel apa pun, **wajib Redeploy**.

---

## 1. AI: boleh pakai Groq?

**Boleh.** Server AI di game ini (`api/ai.js`) sudah mendukung empat jenis penyedia. Cukup isi **salah satu** kunci.

### ⚠️ Satu hal penting soal Groq
Groq **sudah tidak menyediakan model Gemma**. Model `gemma2-9b-it` dihentikan dan diarahkan ke `llama-3.1-8b-instant`; beberapa model lain (`qwen/qwen3-32b`, `meta-llama/llama-4-scout-17b-16e-instruct`) juga sudah diarahkan ke `openai/gpt-oss-120b`.

Untuk game ini **tidak masalah**, karena yang dibutuhkan hanya model chat biasa. Kalau kamu memang ingin model Gemma-nya, pakai Google AI Studio atau OpenRouter (lihat opsi B dan C).

### Opsi A — Groq (paling cepat, ada paket gratis) ✅ rekomendasi
1. Buka [console.groq.com](https://console.groq.com) → daftar/masuk → menu **API Keys** → **Create API Key** → salin kuncinya (diawali `gsk_...`).
2. Di Vercel → Settings → Environment Variables, tambahkan:

   | Key | Value |
   |---|---|
   | `GROQ_API_KEY` | `gsk_...` (kunci kamu) |
   | `AI_MODEL` | `llama-3.3-70b-versatile` *(opsional; ini sudah jadi default)* |

3. Pilihan model Groq yang cocok:
   - `llama-3.3-70b-versatile` → paling pintar, bahasa Indonesianya bagus. **Default.**
   - `llama-3.1-8b-instant` → paling ngebut & paling hemat kuota, cocok karena balasan di game pendek-pendek.
   - `openai/gpt-oss-120b` → alternatif kuat kalau model di atas dihentikan.
4. **Redeploy.**

> Kalau suatu saat muncul error "model decommissioned", cukup ganti nilai `AI_MODEL` ke model yang masih aktif di halaman Models milik Groq, lalu redeploy. Kode tidak perlu diubah.

### Opsi B — Google AI Studio (kalau ingin model Gemma asli)
1. Buat API key di [aistudio.google.com](https://aistudio.google.com) → **Get API key**.
2. Tambahkan di Vercel:

   | Key | Value |
   |---|---|
   | `GEMINI_API_KEY` | kunci kamu |
   | `AI_MODEL` | `gemma-4-26b-a4b-it` *(opsional; default)* |

### Opsi C — OpenRouter (banyak pilihan model, termasuk Gemma)
| Key | Value |
|---|---|
| `OPENROUTER_API_KEY` | `sk-or-...` |
| `AI_MODEL` | `google/gemma-3-27b-it` *(opsional; default)* |
| `SITE_URL` | `https://<domain-vercel-kamu>` *(opsional, untuk identifikasi)* |

### Opsi D — penyedia lain yang kompatibel OpenAI (Together, DeepInfra, dll.)
| Key | Value |
|---|---|
| `AI_API_KEY` | kunci penyedia |
| `AI_BASE_URL` | contoh: `https://api.together.xyz/v1` |
| `AI_MODEL` | nama model di penyedia tersebut |

### Kalau mengisi lebih dari satu kunci
Urutan otomatis: **Groq → Google → OpenRouter → custom**. Mau memaksa salah satu? Tambahkan `AI_PROVIDER` dengan nilai `groq`, `gemini`, `openrouter`, atau `custom`.

### Cara memastikan AI sudah nyala
1. Buka `https://<domain-kamu>/api/ai` di browser (metode GET).
   - Berhasil: `{"ok":true,"provider":"groq","model":"llama-3.3-70b-versatile"}`
   - Belum: `{"ok":false,...}` → berarti kunci belum terbaca (biasanya lupa Redeploy).
2. Di dalam game: klik warga mana pun → **Ngobrol bebas (AI)** → kirim pesan. Kalau AI aktif, jawabannya sesuai karakter warga tersebut.
3. Cek juga di HP dalam game → app **AI Gemma** → statusnya akan menampilkan penyedia & model yang dipakai.

> **Catatan keamanan:** kunci API hanya disimpan di server Vercel dan tidak pernah dikirim ke browser pemain. Kolom "kunci pribadi" di app AI dalam game hanya mendukung Google AI Studio (dipanggil langsung dari browser). Untuk Groq, gunakan cara server di atas — jangan menaruh kunci Groq di browser.

---

## 2. Database: simpan progres solo & berdua (Upstash Redis)

Ini yang membuat login akun, room permanen, dan lanjut main dari perangkat lain bisa berfungsi.

1. Vercel → project kamu → tab **Storage** (atau **Marketplace**) → cari **Upstash for Redis** → **Add Integration / Create**.
2. Pilih paket **Free**, beri nama (misal `griya-asri-db`), pilih region terdekat (Singapore paling dekat dari Indonesia).
3. Saat diminta, **hubungkan ke project ini (Connect Project)**. Vercel otomatis mengisi variabel:
   - `KV_REST_API_URL` dan `KV_REST_API_TOKEN`, **atau**
   - `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN`
   Dua-duanya sama-sama didukung, tidak perlu diubah.
4. **Redeploy.**

### Kalau ingin mengisi manual (tanpa integrasi Vercel)
Daftar di [upstash.com](https://upstash.com) → Create Database (Redis) → di halaman database, bagian **REST API**, salin `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` → masukkan ke Environment Variables Vercel → Redeploy.

### Cara memastikan database sudah nyala
1. Buka `https://<domain-kamu>/api/db` → harus muncul `{"db":true}`.
2. Di layar login game akan tertulis **"✅ Tersambung ke database cloud"**.
3. Daftar akun (misal `handoyo`), lalu di menu klik **Rumah Permanen HNDNS**. Pasanganmu daftar akunnya sendiri lalu masuk ke room yang sama. Kalian akan terdaftar sebagai Handoyo dan Naswa secara otomatis.

### Yang tersimpan & batasannya
- Progres solo: 1 slot per akun. Progres berdua: 1 slot per room.
- Simpan otomatis tiap 30 detik saat main berdua (60 detik saat solo), saat tab ditutup, dan saat aplikasi diminimalkan.
- Lukisan: 16 karya terbaru ikut tersimpan ke cloud (dibatasi agar muat di paket gratis). Sisanya tetap ada di perangkat.
- Paket gratis Upstash sangat cukup untuk dua pemain.

---

## 3. Multiplayer: yang perlu & tidak perlu diatur

**Tidak perlu diatur apa pun** — main berdua sudah jalan memakai server sinyal publik PeerJS.

Atur ini hanya kalau koneksi/suara sering putus (biasanya di jaringan seluler atau Wi-Fi kantor yang ketat):

### 3a. TURN relay (paling berdampak untuk suara)
Ambil kredensial dari penyedia TURN (contoh: Metered, Twilio, atau server coturn sendiri), lalu isi:

| Key | Value (contoh) |
|---|---|
| `TURN_URLS` | `turn:global.relay.metered.ca:80,turns:global.relay.metered.ca:443` |
| `TURN_USER` | username dari penyedia |
| `TURN_PASS` | password dari penyedia |

Cek hasilnya: buka `https://<domain-kamu>/api/config` → harus muncul `"turn":true`.

### 3b. Server sinyal PeerJS sendiri (opsional)
Folder `server/` di proyek ini sudah berisi servernya.
1. Deploy folder `server/` ke Railway / Render / Fly.io / VPS. Perintahnya: `npm install` lalu `npm start`.
2. Catat domainnya, lalu isi di Vercel:

| Key | Value |
|---|---|
| `PEER_HOST` | `nama-servermu.up.railway.app` |
| `PEER_PORT` | `443` |
| `PEER_PATH` | `/griya` |
| `PEER_SECURE` | `true` |

3. Redeploy. Game akan otomatis memakai server itu.

---

## 4. Daftar lengkap Environment Variables

Salin yang kamu butuhkan saja:

```
# --- AI (pilih salah satu blok) ---
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx
AI_MODEL=llama-3.3-70b-versatile

# GEMINI_API_KEY=xxxxxxxx
# OPENROUTER_API_KEY=sk-or-xxxxxxxx
# AI_API_KEY=xxxxxxxx
# AI_BASE_URL=https://api.together.xyz/v1
# AI_PROVIDER=groq

# --- Database (biasanya terisi otomatis oleh integrasi Upstash) ---
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxx

# --- Opsional: koneksi lebih stabil ---
# TURN_URLS=turn:host:80,turns:host:443
# TURN_USER=xxxx
# TURN_PASS=xxxx
# PEER_HOST=nama-servermu.up.railway.app
# PEER_PORT=443
# PEER_PATH=/griya
# PEER_SECURE=true
```

**Environment:** centang **Production, Preview, dan Development** agar berlaku di semua deployment.

---

## 5. Langkah singkat (kalau sudah deploy, tinggal ini)

1. Vercel → project → **Settings → Environment Variables**.
2. Tambahkan `GROQ_API_KEY` (+ `AI_MODEL` bila ingin ganti model).
3. Tab **Storage** → tambahkan **Upstash for Redis** (Free) → Connect Project.
4. Tab **Deployments** → deployment terbaru → menu titik tiga → **Redeploy**.
5. Buka `https://<domain>/api/ai` → `ok:true`, dan `https://<domain>/api/db` → `db:true`.
6. Buka game → daftar akun → masuk **Rumah Permanen HNDNS** → bagikan kodenya ke pasangan.

---

## 6. Kalau ada masalah

| Gejala | Penyebab tersering | Solusi |
|---|---|---|
| `/api/ai` → `{"ok":false}` | Variabel belum terbaca | Pastikan namanya persis, environment dicentang semua, lalu **Redeploy** |
| Jawaban AI tidak muncul, dialog tetap bawaan | Kunci salah, kuota habis, atau model dihentikan | Buka Runtime Logs di Vercel; ganti `AI_MODEL` ke model yang masih aktif |
| `502` dari `/api/ai` dengan pesan "model decommissioned" | Model Groq sudah pensiun | Ganti `AI_MODEL` (mis. `llama-3.1-8b-instant`) |
| Layar login masih "Database cloud belum diatur" | Integrasi Upstash belum terhubung ke project | Storage → Connect Project → Redeploy |
| Progres berdua tidak tersimpan | Belum login akun, atau database belum aktif | Login dulu; pastikan `/api/db` → `db:true` |
| "Room ini sedang dimainkan 2 orang lain" | Sesi lama belum lepas | Tunggu ±10 detik lalu coba lagi; koneksi mati terdeteksi maksimal 7 detik |
| Mikrofon tidak bisa dipakai | Butuh HTTPS & izin browser | Pakai domain Vercel (sudah HTTPS), izinkan mikrofon, ketuk layar sekali |
| Suara putus-putus di 4G | Tidak ada TURN relay | Isi `TURN_URLS`, `TURN_USER`, `TURN_PASS` |
| Karakter diam tapi waktu jalan | Aksi tersangkut | Menu → **🔧 Lepas macet** (biasanya otomatis pulih dalam 9 detik) |

**Melihat log error:** Vercel → project → **Logs** (atau Deployments → deployment → Runtime Logs). Semua error dari `/api/ai` dan `/api/db` muncul di sana.

---

## 7. Biaya

- **Vercel Hobby**: gratis, cukup untuk game ini (hanya file statis + 3 fungsi kecil).
- **Upstash Free**: gratis, jauh di atas kebutuhan dua pemain.
- **Groq**: ada paket gratis dengan batas permintaan per menit. Game ini membatasi diri maksimal 14 permintaan per menit dan jeda 1,2 detik antar permintaan, jadi aman.
- **TURN**: gratis kalau pasang coturn sendiri; penyedia komersial biasanya bayar per GB.

---

## 8. Yang sudah beres, tidak perlu diapa-apakan

- Semua aset (3D, tekstur, suara) dibuat langsung oleh browser — tidak ada file besar yang perlu diunggah.
- Tidak perlu build step. Vercel cukup memakai **Framework Preset: Other**, build command dikosongkan.
- Fungsi `/api/ai`, `/api/db`, dan `/api/config` otomatis terdeteksi Vercel dari folder `api/`.
- File `api/_kv.js` sengaja diawali garis bawah agar tidak dianggap endpoint.
