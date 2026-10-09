// ============================================================
//  KISAH WARGA — tiap NPC punya cerita yang berkembang
//
//  Setiap kali kamu berinteraksi dengan seseorang (ngobrol, membantu,
//  berbelanja, mengajar, berdonasi), hubungan kalian menabung "poin kisah".
//  Saat ambang bab terlampaui, babak baru ceritanya terbuka: satu paragraf
//  yang menjelaskan sedikit lagi tentang hidupnya.
//
//  Kisahnya tidak acak — ia maju dari apa yang BENAR-BENAR kamu lakukan.
//  Semua tersimpan di W.kisah dan ikut terbawa di simpanan progres.
//  Buka lewat Menu ☰ → 📖 Kisah Warga.
// ============================================================
import { MOODLETS } from './data.js';

Object.assign(MOODLETS, {
  kisahBaru: { label: 'Tahu cerita hidup tetangga', emoji: '📖', val: 12, dur: 360 },
});

// Ambang poin tiap bab. Bab terakhir butuh kesabaran — seperti persahabatan sungguhan.
export const AMBANG = [0, 8, 20, 40, 70];

// kisah: [judul, [bab1, bab2, bab3, bab4, bab5]]
export const KISAH = {
  // ---------------- tetangga dekat ----------------
  'Pak Ismail': ['Tubuh Besar, Hati Lebih Besar', [
    'Tetangga sebelah yang badannya paling besar se-RT. Ketawanya terdengar sampai ujung gang.',
    'Dulu dia sopir truk antarkota. Berhenti setelah hampir menabrak anak sekolah — sejak itu dia tidak pernah menyetir lagi kalau mengantuk.',
    'Bu Aisyah istrinya sakit gula. Pak Ismail diam-diam berhenti beli gorengan supaya istrinya tidak tergoda ikut makan.',
    'Dia menyisihkan sebagian uang pensiun untuk Panti Harapan Bunda. Tidak pernah bilang-bilang; Bu Asih yang keceplosan.',
    'Suatu sore dia bilang, "Mas Handoyo, Mbak Naswa, kalau saya duluan, tolong jenguk Aisyah sekali-sekali ya." Lalu tertawa lagi, seperti biasa.',
  ]],
  'Bu Aisyah': ['Resep yang Tidak Pernah Ditulis', [
    'Istri Pak Ismail. Selalu mengirim makanan setiap masak terlalu banyak — yang artinya hampir setiap hari.',
    'Gulai ikannya terkenal se-RT. Tidak pernah mau menuliskan resepnya: "Nanti kalau ditulis, tidak ada alasan lagi kalian mampir."',
    'Kadar gulanya tinggi. Dia tetap memasak manis untuk orang lain, dan makan tawar sendirian.',
    'Dia menyimpan foto anak semata wayangnya yang merantau ke Kalimantan di balik kalender dapur.',
    'Akhirnya dia menuliskan resep gulainya di kertas, diserahkan ke Naswa. "Biar tidak hilang kalau saya lupa."',
  ]],
  'Pak Budi': ['Lelaki yang Berangkat Paling Pagi', [
    'Tetangga blok depan. Motornya berangkat sebelum subuh, pulang setelah isya.',
    'Dia kerja dua shift. Anaknya tiga, yang sulung baru masuk kuliah di kota.',
    'Dia hafal semua nama tetangga tapi jarang sempat ngobrol lama. Selalu minta maaf soal itu.',
    'Motornya tiga kali mogok bulan ini. Dia belum cerita ke siapa pun bahwa pabriknya mulai mengurangi karyawan.',
    'Anak sulungnya dapat beasiswa penuh. Malam itu Pak Budi duduk lama di pos ronda, menangis diam-diam sambil tersenyum.',
  ]],
  'Bu Rina': ['Kelas Sore di Ruang Tamu', [
    'Istri Pak Budi. Ruang tamunya jadi tempat les anak-anak komplek setiap sore.',
    'Dia tidak memungut bayaran. "Orang tuanya sudah capek cari uang, masa saya tambahi."',
    'Dia sebenarnya sarjana pendidikan, tapi berhenti mengajar setelah anak keduanya lahir.',
    'Dia diam-diam menyiapkan soal untuk anak-anak Panti Harapan Bunda juga.',
    'Sekolah negeri menawarinya kembali mengajar. Dia bilang mau pikir-pikir — sambil senyum lebar sekali.',
  ]],
  'Bang Jefri': ['Utang, Bunga, dan Harga Diri', [
    'Tetangga yang paling sering mengetuk pintu untuk pinjam uang. Selalu membayar — dengan bunga, tanpa diminta.',
    'Dia pedagang kelontong yang kena tipu suplier dua tahun lalu. Sejak itu modalnya tidak pernah pulih.',
    'Bunga yang dia bayar itu caranya menjaga harga diri. "Saya tidak mau dikasihani, Mas."',
    'Dia menolak bantuan cuma-cuma dari Pak RT, tapi menerima pesanan dagangan. Itu bedanya.',
    'Warungnya akhirnya jalan lagi. Pelanggan pertamanya hari itu: dirinya sendiri, membeli kopi, dan membayar penuh.',
  ]],
  // ---------------- asisten rumah tangga ----------------
  'Mbak Sri': ['Yang Membereskan, Yang Diam', [
    'ART yang mengurus kebersihan rumah. Datang pagi, pulang sore, nyaris tanpa suara.',
    'Dia merantau dari Wonogiri umur 17. Sekarang 29, dan belum pernah pulang lebaran dua tahun terakhir.',
    'Seluruh gajinya dikirim untuk biaya sekolah dua adiknya.',
    'Dia menyimpan buku tabungan di dompet, dilihat hampir tiap hari. Targetnya: warung kecil di kampung.',
    'Adik bungsunya lulus SMA dengan nilai tertinggi. Mbak Sri minta izin pulang seminggu — untuk pertama kalinya.',
  ]],
  'Bi Inah': ['Masakan dan Kenangan', [
    'ART yang memasak dan mencuci. Tangannya cepat, mulutnya ramai.',
    'Dia janda. Suaminya meninggal waktu anaknya masih balita, sekarang anaknya sudah kerja di Batam.',
    'Dia memasak terlalu banyak setiap hari karena terbiasa memasak untuk keluarga besar.',
    'Dia menolak dibelikan HP baru. "Yang ini masih ada rekaman suara bapaknya anak-anak."',
    'Anaknya pulang dan mengajaknya tinggal di Batam. Bi Inah bingung — di sini dia sudah merasa punya keluarga juga.',
  ]],
  'Pak Darto': ['Kebun, Mobil, dan Sabar', [
    'Tukang kebun merangkap sopir. Paling sabar menghadapi apa pun.',
    'Dia bekerja di rumah ini sejak sebelum Handoyo & Naswa menikah.',
    'Matanya mulai rabun. Dia belum bilang karena takut tidak boleh menyetir lagi.',
    'Dia menanam satu pohon tiap tahun di halaman belakang. Sudah ada sebelas.',
    'Dia akhirnya memeriksakan mata dan pakai kacamata. Pohon keduabelas ditanam hari itu juga.',
  ]],
  // ---------------- lingkungan ----------------
  'Pak Harjo': ['Ketua RT dan Buku Catatannya', [
    'Ketua RT 05. Selalu bawa buku catatan kecil ke mana-mana.',
    'Di buku itu ada daftar warga yang sedang kesulitan. Dia mencatat tanpa pernah mengumumkan.',
    'Iuran yang dia tarik lebih kecil dari yang seharusnya. Selisihnya dia tombok sendiri.',
    'Dia pernah ditawari jadi calon lurah. Menolak: "Nanti saya tidak kenal lagi nama orang satu-satu."',
    'Warga diam-diam mengumpulkan uang dan memperbaiki atap rumahnya yang bocor bertahun-tahun.',
  ]],
  'Pak Slamet': ['Mata yang Tidak Tidur', [
    'Satpam komplek. Berjaga dari malam sampai subuh.',
    'Dia tahu kebiasaan semua rumah: jam berapa lampu mati, siapa yang pulang paling malam.',
    'Dia pernah menggagalkan pencurian motor sendirian. Tidak mau diberitakan.',
    'Siangnya dia tidur hanya empat jam, sisanya jadi tukang servis kipas angin.',
    'Komplek patungan membelikannya motor bekas supaya patrolinya tidak lagi jalan kaki semalaman.',
  ]],
  'Mak Ijah': ['Warung Madura yang Tidak Pernah Tutup', [
    'Pemilik Warung Madura 24 jam di ujung jalan.',
    'Warungnya benar-benar tidak pernah tutup — dia dan suaminya bergantian jaga.',
    'Dia memberi utang ke siapa pun yang kelihatan betul-betul butuh, dicatat di buku tulis anak sekolah.',
    'Setengah dari catatan utang itu tidak pernah dia tagih.',
    'Anaknya lulus kuliah dan mau meneruskan warung dengan sistem kasir digital. Mak Ijah tetap minta buku tulisnya disimpan.',
  ]],
  'Mbak Laras': ['Barista yang Mendengarkan', [
    'Barista Kopi Griya. Ingat pesanan semua pelanggan tetap.',
    'Dia sarjana sastra. Kopi awalnya cuma pekerjaan sambilan yang keterusan.',
    'Dia menulis puisi di belakang struk yang tidak terpakai.',
    'Satu buku kumpulan puisinya diterima penerbit kecil. Dia belum berani cerita ke siapa pun.',
    'Bukunya terbit. Naswa membeli sepuluh eksemplar sekaligus untuk dibagikan ke tetangga.',
  ]],
  'Mbah Karso': ['Yang Paling Lama Tinggal di Sini', [
    'Kakek tertua di komplek. Duduk di depan rumah hampir sepanjang hari.',
    'Dia sudah di sini sejak perumahan ini masih sawah semua.',
    'Istrinya meninggal delapan tahun lalu. Kursi di sebelahnya tidak pernah dipindahkan.',
    'Dia hafal nama semua pohon di jalan ini — karena dia sendiri yang menanam sebagian besar.',
    'Dia meminta Handoyo & Naswa memotretnya di depan rumah. "Buat anak cucu, biar tahu bapaknya pernah di sini."',
  ]],
  'Bu Ratna': ['Ibu yang Datang Membawa Rantang', [
    'Ibu Naswa. Datang bertamu membawa rantang berisi masakan rumah.',
    'Dia khawatir anaknya tidak makan teratur karena sibuk melukis.',
    'Dia menyimpan semua gambar Naswa sejak TK di satu kardus.',
    'Dia tidak pernah bilang bangga secara langsung, tapi menceritakan lukisan Naswa ke semua temannya.',
    'Dia menggantung satu lukisan Naswa di ruang tamunya, di dinding yang paling pertama terlihat tamu.',
  ]],
  // ---------------- panti asuhan ----------------
  'Bu Asih': ['Dua Puluh Tahun Jadi Ibu', [
    'Pengasuh Panti Harapan Bunda. Mengurus panti sejak 20 tahun lalu.',
    'Dia tidak menikah. "Saya sudah punya anak banyak sekali," katanya sambil menunjuk halaman.',
    'Setiap anak yang pernah tinggal di sini ada fotonya di dinding kantor. Sudah 74 foto.',
    'Dia hafal makanan kesukaan, alergi, dan mimpi buruk setiap anak yang sedang diasuh.',
    'Anak asuh angkatan pertama — sekarang dokter — kembali dan membiayai renovasi panti. Bu Asih menangis untuk pertama kalinya di depan anak-anak.',
  ]],
  Riko: ['Kapten yang Menjaga Adik-adiknya', [
    'Anak paling tua di panti, 11 tahun. Selalu jadi kapten saat main bola.',
    'Dia yang membangunkan adik-adiknya subuh dan memastikan semua sudah sarapan.',
    'Orang tuanya meninggal karena kecelakaan. Dia yang menyelamatkan adiknya, Melati, dari mobil.',
    'Dia ingin jadi polisi supaya "tidak ada lagi anak yang kehilangan seperti saya".',
    'Dia lolos seleksi sekolah atlet sekaligus beasiswa akademik. Yang dia tanyakan pertama: "Melati gimana?"',
  ]],
  Sari: ['Gambar di Buku Tulis Bekas', [
    'Anak perempuan 10 tahun yang pendiam. Selalu menggambar di halaman kosong buku tulis bekas.',
    'Dia menggambar hal yang sama berulang-ulang: rumah dengan taman bunga dan dua orang dewasa di depan pagar.',
    'Dia tidak pernah tahu wajah orang tuanya. Dua sosok di gambarnya tidak pernah diberi wajah.',
    'Setelah belajar dengan Naswa, dia mulai berani menggambar wajah — wajah Bu Asih.',
    'Gambarnya menang lomba tingkat kota. Di gambar itu, dua sosok dewasanya akhirnya punya wajah: Handoyo dan Naswa.',
  ]],
  Dimas: ['Anak yang Membongkar Radio', [
    'Anak 8 tahun yang penasaran dengan semua barang elektronik.',
    'Dia pernah membongkar radio panti dan — setelah tiga hari — berhasil memasangnya kembali.',
    'Dia tidak punya komputer. Dia belajar koding dari buku perpustakaan keliling, di kertas.',
    'Setelah diajari Handoyo, dia menulis program pertamanya yang benar-benar jalan.',
    'Dia menang lomba koding anak tingkat provinsi, memakai laptop pinjaman. Hadiahnya dia minta dibelikan komputer untuk panti.',
  ]],
  Melati: ['Boneka Kain dan Rumah Impian', [
    'Anak paling kecil di panti, 6 tahun. Ke mana-mana membawa boneka kain buatan Bu Asih.',
    'Dia adik Riko. Dia terlalu kecil untuk mengingat kecelakaan itu.',
    'Setiap bermain pasir dia selalu membuat rumah dengan taman bunga di depannya.',
    'Dia mulai memanggil Naswa "Bunda" tanpa sengaja, lalu malu sendiri seharian.',
    'Dia menggambar keluarganya: Bu Asih, Riko, sembilan anak lain, dan dua orang dewasa dari seberang jalan.',
  ]],
  Yoga: ['Satu Kalimat Penuh', [
    'Anak 6 tahun yang baru belajar membaca.',
    'Dia malu membaca di depan orang karena sering ditertawakan saat masih mengeja.',
    'Dia berlatih diam-diam tiap malam di bawah lampu teras.',
    'Setelah diajari, dia berhasil membaca satu paragraf penuh tanpa dieja. Matanya berbinar.',
    'Dia jadi yang membacakan cerita untuk adik-adiknya sebelum tidur, setiap malam.',
  ]],
};
// anak panti lain memakai kerangka kisah yang sama tapi personal
const UMUM = (nama, sifat, cita) => [`Anak panti bernama ${nama}.`, sifat, `Dia masih malu-malu kalau ditanya cita-citanya.`,
  `Pelan-pelan dia bercerita: ${cita.toLowerCase()}.`, `Dia menulis namamu di daftar "orang yang baik" di buku catatannya.`];

export function installKisah(hh) {
  const W = hh.world;
  if (!W.kisah) W.kisah = {};
  hh.kisahMaju = (nama, poin, sim) => kisahMaju(hh, nama, poin, sim);
  hh.kisahData = () => W.kisah;
}

export function daftarKisah(hh) {
  // gabungkan kisah bawaan + anak panti yang belum punya kisah khusus
  const out = { ...KISAH };
  try {
    const { ANAK } = hh._ANAK || {};
    if (ANAK) for (const a of ANAK) if (!out[a.n]) out[a.n] = [`Cerita ${a.n}`, UMUM(a.n, a.sifat, a.cita)];
  } catch (e) { /* abaikan */ }
  return out;
}

export function kisahMaju(hh, nama, poin = 1, sim) {
  const W = hh.world; if (!W.kisah) W.kisah = {};
  const K = daftarKisah(hh)[nama]; if (!K) return;
  const r = W.kisah[nama] || (W.kisah[nama] = { poin: 0, bab: 0 });
  r.poin += poin;
  const maks = K[1].length;
  let babBaru = 0;
  for (let i = 0; i < maks; i++) if (r.poin >= AMBANG[i]) babBaru = i + 1;
  if (babBaru > r.bab) {
    r.bab = babBaru;
    const teks = K[1][babBaru - 1];
    hh.toast(`📖 Kisah ${nama} — bab ${babBaru}/${maks}: ${teks}`, 'good', true);
    hh.sfx('level');
    if (sim && sim.mood) sim.mood('kisahBaru');
    if (babBaru === maks) { hh.addFam(25); hh.toast(`🌟 Kamu sudah tahu seluruh kisah ${nama}. Itu bukan hal kecil.`, 'good', true); }
    else hh.addFam(5);
  }
}

// berapa banyak kisah yang sudah tamat
export function ringkasKisah(hh) {
  const semua = daftarKisah(hh); const W = hh.world; let tamat = 0, mulai = 0;
  for (const n in semua) { const r = (W.kisah || {})[n]; if (!r || !r.bab) continue; mulai++; if (r.bab >= semua[n][1].length) tamat++; }
  return { total: Object.keys(semua).length, mulai, tamat };
}
