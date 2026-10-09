# PANDUAN: Menjadikan Game Ini File APK (HP) & Aplikasi Laptop

Game ini sekarang sudah jadi **PWA** (Progressive Web App) lengkap: punya manifest,
ikon, dan service worker. Artinya ia bisa dipasang seperti aplikasi biasa — dan
bisa dibungkus jadi berkas `.apk` yang tinggal kirim lewat WhatsApp.

Ada **3 cara**, dari yang paling gampang. Pilih salah satu.

---

## ⭐ Cara 1 — Pasang langsung tanpa APK (paling cepat, 30 detik)

Ini sudah aktif begitu kamu push versi ini ke Vercel.

**Di HP (Android):**
1. Buka `https://rumahhandoyonaswa.vercel.app` lewat **Chrome**.
2. Di layar menu game akan muncul tombol **"📲 Pasang di perangkat ini"** → tekan.
   (Kalau tidak muncul: menu ⋮ di pojok kanan atas → **Install app**.)
3. Ikonnya masuk ke layar utama. Dibuka tanpa address bar, layar penuh, dan tetap
   bisa dibuka walau internet sedang mati (progres tersimpan lokal lalu dikirim
   saat tersambung lagi).

**Di HP (iPhone/iPad):** buka lewat **Safari** → tombol Bagikan → **Add to Home Screen**.

**Di laptop (Windows/Mac):** buka lewat **Chrome atau Edge** → klik ikon pasang
(gambar monitor dengan panah) di ujung kanan kolom alamat → **Install**.
Setelah itu Griya Asri muncul di Start Menu dan bisa dibuka seperti aplikasi biasa.

> Kekurangannya cuma satu: ini bukan berkas `.apk` yang bisa dikirim. Kalau kamu
> memang butuh berkasnya, lanjut ke Cara 2 atau 3.

---

## ⭐⭐ Cara 2 — APK otomatis lewat GitHub (tanpa install apa pun di laptop)

Sudah saya siapkan di `.github/workflows/apk.yml`. Setiap kali kamu push, GitHub
membangunkan APK-nya sendiri.

1. Commit & push versi ini ke GitHub.
2. Buka repo-mu di GitHub → tab **Actions** → pilih run **"Bangun APK"** yang terbaru.
3. Tunggu ±5 menit sampai centang hijau.
4. Di bagian bawah halaman run ada **Artifacts** → unduh **`griya-asri-apk`**.
5. Isinya `app-debug.apk`. Kirim ke HP, buka, izinkan "Install from unknown sources".

Mau bangun tanpa push? Tab **Actions** → **Bangun APK** → tombol **Run workflow**.

---

## ⭐⭐⭐ Cara 3 — Bangun APK sendiri di laptop (kamu sudah punya semua alatnya)

Saya lihat di laptopmu sudah ada **Android Studio**, **JDK**, dan **Gradle** —
jadi cara ini akan jalan mulus.

```bash
cd ~/Downloads/rumah-handoyo-naswa

# sekali saja: pasang Capacitor + buat proyek Android
npm install
npm run apk:siapkan

# setiap kali mau bangun APK:
npm run apk:debug
```

APK-nya ada di:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

Mau buka di Android Studio (untuk emulator atau atur ikon/nama)?
```bash
npx cap open android
```

### Kalau mau APK rilis yang bisa dipasang permanen & diunggah ke Play Store
```bash
# 1. buat kunci tanda tangan (sekali seumur hidup — SIMPAN baik-baik!)
keytool -genkey -v -keystore griya-asri.keystore -alias griyaasri \
        -keyalg RSA -keysize 2048 -validity 10000

# 2. taruh griya-asri.keystore di folder android/app/
# 3. tambahkan di android/app/build.gradle bagian android { ... }:
#
#    signingConfigs {
#        release {
#            storeFile file('griya-asri.keystore')
#            storePassword 'KATA-SANDI-MU'
#            keyAlias 'griyaasri'
#            keyPassword 'KATA-SANDI-MU'
#        }
#    }
#    buildTypes { release { signingConfig signingConfigs.release } }

npm run apk:rilis
```

---

## 🔌 Penting: APK harus tahu alamat servernya

Di dalam APK, berkas game dimuat dari dalam aplikasi — jadi alamat `/api/db`
tidak akan ketemu kalau tidak diarahkan. Itu sudah saya tangani di:

```
js/konfigurasi.js  →  export const DOMAIN = 'https://rumahhandoyonaswa.vercel.app';
```

**Kalau domain Vercel-mu berbeda, ganti satu baris itu saja**, lalu bangun ulang APK.
Di browser biasa baris ini tidak dipakai (otomatis memakai domain yang sedang dibuka).

---

## 💻 Mau versi laptop berupa file .exe?

Cara 1 sudah memberi aplikasi laptop sungguhan (lewat Chrome/Edge → Install).
Kalau tetap mau `.exe` berdiri sendiri, cara paling singkat:

```bash
npx --yes @electron-forge/cli@latest import   # di folder yang sama
```
atau pakai **PWABuilder**: buka https://www.pwabuilder.com → masukkan alamat
Vercel-mu → pilih **Windows** → unduh paket `.msix`. PWABuilder juga bisa
membuatkan APK (Android) langsung dari situ tanpa koding sama sekali — ini
alternatif paling santai dari Cara 2.

---

## ❓ Masalah yang sering muncul

| Gejala | Sebabnya | Caranya |
|---|---|---|
| Tombol "Pasang" tidak muncul | Situs belum HTTPS, atau sudah terpasang | Pakai domain Vercel (https), atau cek Start Menu/layar utama |
| APK terpasang tapi layar putih | `DOMAIN` di `js/konfigurasi.js` salah | Betulkan, lalu `npm run apk:debug` lagi |
| APK tidak bisa login / main berdua | Server tidak terjangkau dari HP | Pastikan domain Vercel bisa dibuka dari browser HP |
| "App not installed" di HP | APK lama dengan tanda tangan beda | Hapus dulu versi lamanya, baru pasang |
| Gradle gagal: Java versi | Butuh JDK 17/21 | Android Studio → Settings → Build Tools → Gradle → Gradle JDK |
| Perubahan tidak kelihatan setelah push | Service worker menyimpan versi lama | Naikkan `VERSI` di `sw.js` (mis. `griya-asri-v13`) |

---

## 🔄 Kalau nanti ada pembaruan game

1. Ubah kodenya seperti biasa.
2. **Naikkan `VERSI` di `sw.js`** (`griya-asri-v12` → `v13`). Ini yang membuat
   pemain yang sudah memasang otomatis dapat versi terbaru.
3. Push. Vercel memperbarui versi web; GitHub Actions membangun APK barunya.
