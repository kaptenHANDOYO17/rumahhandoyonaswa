// ============================================================
//  PERPUSTAKAAN LANTAI 2 — buku yang bisa dibaca
//  Tema utama: kriminal/kriminologi & memahami-mencegah bunuh diri.
//  Buku bertema bunuh diri ditulis mengikuti pedoman pemberitaan aman:
//  tanpa detail cara, fokus pada pemahaman, pertolongan, dan harapan.
// ============================================================
export const HELP_FOOTER = 'Kalau kamu atau orang terdekat sedang di titik sulit, kamu tidak sendirian. Hubungi layanan SEJIWA 119 ext 8, datangi puskesmas atau rumah sakit terdekat, atau ke IGD bila darurat. Bercerita ke orang yang kamu percaya juga langkah yang berarti.';

export const SHELVES = [
  { id: 'krim', label: 'Kriminologi & Forensik', color: '#7a2e2e' },
  { id: 'detektif', label: 'Fiksi Detektif & Kriminal', color: '#2e4a7a' },
  { id: 'jiwa', label: 'Memahami & Mencegah Bunuh Diri', color: '#2e7a5e' },
  { id: 'lain', label: 'Rumah & Peliharaan', color: '#8a6a2e' },
];

export const BOOKS = [
  // ---------------- KRIMINOLOGI & FORENSIK ----------------
  { id: 'b1', shelf: 'krim', title: 'Pengantar Kriminologi', author: 'Tim Griya Pustaka', skill: 'logika', pages: [
    'Kriminologi adalah ilmu yang mempelajari kejahatan: mengapa terjadi, siapa yang terlibat, bagaimana masyarakat meresponsnya, dan cara mencegahnya. Ia berdiri di persimpangan sosiologi, psikologi, hukum, dan statistik.',
    'Aliran klasik lahir dari Cesare Beccaria (1764) yang menuntut hukuman yang proporsional dan pasti, bukan kejam. Cesare Lombroso kemudian mengklaim penjahat bisa dikenali dari bentuk tubuh — teori yang kini sudah dibantah total dan jadi contoh sains yang keliru.',
    'Teori modern lebih melihat lingkungan: Robert Merton bicara tentang "ketegangan" antara tujuan sosial dan kesempatan yang tersedia; Travis Hirschi menekankan ikatan sosial — keluarga, sekolah, komunitas — sebagai pelindung. Pesannya: kejahatan paling efektif dicegah lewat masyarakat yang saling terhubung.',
  ] },
  { id: 'b2', shelf: 'krim', title: 'Jejak yang Tertinggal: Sejarah Ilmu Forensik', author: 'Dr. Laras Wibisono', skill: 'logika', pages: [
    'Tahun 1910, Edmond Locard mendirikan salah satu laboratorium forensik pertama di Lyon, Prancis. Prinsipnya terkenal hingga kini: "setiap kontak meninggalkan jejak" — siapa pun yang masuk ke suatu tempat akan membawa sesuatu masuk dan membawa sesuatu keluar.',
    'Sidik jari mulai dipakai serius akhir abad ke-19. Henry Faulds menulis tentangnya pada 1880, Francis Galton mengklasifikasikannya, dan di Argentina tahun 1892 Juan Vucetich membantu memecahkan sebuah kasus lewat sidik jari berdarah — salah satu vonis pertama berbasis sidik jari.',
    'Revolusi berikutnya datang dari Alec Jeffreys yang menemukan profil DNA pada 1984. Beberapa tahun kemudian teknik ini dipakai di Inggris untuk membebaskan tersangka yang salah dan menemukan pelaku sebenarnya. Sejak itu DNA juga membebaskan banyak orang yang dipenjara karena salah vonis.',
  ] },
  { id: 'b3', shelf: 'krim', title: 'Membaca TKP', author: 'AKBP (Purn.) Hendra Saputro', skill: 'logika', pages: [
    'Pekerjaan pertama di tempat kejadian perkara bukan mencari pelaku, tapi melindungi lokasi. Area diamankan, orang yang tidak berkepentingan dijauhkan, dan setiap orang yang masuk dicatat.',
    'Setelah itu semua didokumentasikan sebelum disentuh: foto menyeluruh, foto dekat, sketsa, dan catatan waktu. Barang bukti dikemas terpisah dan diberi label.',
    'Konsep kuncinya adalah "rantai penguasaan barang bukti" (chain of custody): siapa memegang barang bukti, kapan, dan untuk apa — semuanya tercatat. Tanpa itu, bukti sebaik apa pun bisa gugur di pengadilan. Warga biasa cukup ingat satu hal: kalau menemukan kejadian, jangan ubah apa pun dan segera lapor polisi di 110.',
  ] },
  { id: 'b4', shelf: 'krim', title: 'Hukum Pidana untuk Orang Awam', author: 'Maya Kusumaningrum, S.H.', skill: 'logika', pages: [
    'Indonesia memakai KUHP baru, UU Nomor 1 Tahun 2023, yang mulai berlaku 2 Januari 2026 menggantikan KUHP warisan kolonial. Buku ini ringkasan umum, bukan nasihat hukum — untuk kasus nyata, konsultasikan ke advokat atau LBH.',
    'Dua asas penting: asas legalitas (seseorang hanya bisa dipidana atas perbuatan yang sudah diatur undang-undang sebelum perbuatan terjadi) dan praduga tak bersalah (setiap orang dianggap tidak bersalah sampai ada putusan berkekuatan hukum tetap).',
    'Tersangka punya hak, antara lain didampingi penasihat hukum, diberi tahu apa yang disangkakan, dan tidak dipaksa memberi keterangan. Bagi yang tidak mampu, ada bantuan hukum gratis lewat organisasi bantuan hukum terakreditasi.',
  ] },
  { id: 'b5', shelf: 'krim', title: 'Waspada Penipuan Digital', author: 'Rizky Pratama', skill: 'logika', pages: [
    'Modus paling umum: pesan mengaku dari bank/kurir yang meminta kode OTP, tautan "cek resi" berisi aplikasi jahat, undian palsu, dan pesan "Ma, ganti nomor, tolong transfer dulu".',
    'Aturan emas: bank tidak pernah meminta OTP, PIN, atau kata sandi. Jangan pasang aplikasi dari tautan chat. Kalau ada keluarga minta transfer mendadak, telepon balik ke nomor lamanya.',
    'Pinjaman online ilegal sering menagih dengan ancaman dan menyebar data. Cek legalitas penyedia di OJK (kontak 157). Ngomong-ngomong soal utang: pinjam-meminjam antar tetangga sebaiknya tetap dicatat, sekecil apa pun — biar hubungan tetap baik, seperti Bang Jefri yang selalu bayar plus bunga.',
  ] },
  { id: 'b6', shelf: 'krim', title: 'Rumah Aman: Mencegah Kejahatan di Perumahan', author: 'Paguyuban Warga Griya Asri', skill: 'karisma', pages: [
    'Pendekatan CPTED (Crime Prevention Through Environmental Design) berangkat dari ide sederhana: lingkungan yang terang, terlihat, dan terawat membuat orang enggan berbuat jahat.',
    'Praktiknya: lampu teras menyala di malam hari, pagar yang tidak menutup pandangan total, semak dipangkas, dan rumah kosong tetap terlihat "berpenghuni".',
    'Faktor terkuat justru sosial: tetangga yang saling kenal. Siskamling, grup WhatsApp RT, dan kebiasaan saling menyapa — seperti Pak Ismail yang hafal semua mobil di komplek — adalah sistem keamanan paling murah dan paling ampuh.',
  ] },
  { id: 'b7', shelf: 'krim', title: 'Pencurian Legendaris Abad ke-20', author: 'Andreas Hutagalung', skill: 'logika', pages: [
    'Great Train Robbery (Inggris, 1963): sekelompok orang menghentikan kereta pos dan membawa sekitar 2,6 juta poundsterling. Sebagian besar pelaku akhirnya tertangkap, dan kasus ini mengubah cara polisi Inggris bekerja sama antar-wilayah.',
    'Museum Isabella Stewart Gardner (Boston, 1990): dua orang menyamar jadi polisi dan membawa 13 karya seni. Hingga kini karya-karya itu belum ditemukan; bingkai kosongnya masih dipajang sebagai pengingat.',
    'Pelajaran dari kisah-kisah ini bukan soal kehebatan pelaku, tapi bagaimana investigasi yang sabar, kerja sama publik, dan kemajuan forensik perlahan menutup celah — dan betapa besar kerugian yang ditanggung korban dan masyarakat.',
  ] },
  { id: 'b8', shelf: 'krim', title: 'Para Detektif dalam Sejarah', author: 'Sari Lestari', skill: 'logika', pages: [
    'Eugène-François Vidocq adalah mantan narapidana yang pada 1811 memimpin Sûreté, unit detektif Paris. Pengetahuannya tentang dunia kriminal membuatnya jadi penyidik legendaris — dan inspirasi banyak tokoh fiksi.',
    'Pada 1829 Robert Peel membentuk Kepolisian Metropolitan London dengan prinsip bahwa polisi adalah bagian dari masyarakat, dan keberhasilannya diukur dari sedikitnya kejahatan, bukan banyaknya penangkapan.',
    'Di Amerika, Allan Pinkerton mendirikan agensi detektif swasta sekitar 1850. Dari sejarah ini kita belajar: detektif terbaik adalah pengamat yang teliti dan pendengar yang sabar.',
  ] },
  // ---------------- FIKSI ----------------
  { id: 'b9', shelf: 'detektif', title: 'Misteri Kue Lapis Griya Asri', author: 'Naswa (draf pertama)', skill: 'kreatif', pages: [
    'Minggu pagi, Bu Aisyah menjerit dari teras: kue lapis legit untuk arisan RT hilang dari meja. Hanya tersisa remah-remah dan jejak kecil berbentuk bunga di taplak.',
    'Pak Satpam bersumpah tidak ada orang asing lewat. Bang Jefri dicurigai karena pagi itu kelihatan "kaya mendadak" — ternyata ia baru saja melunasi utang ke Handoyo, lengkap dengan bunganya. Pak Ismail mengaku hanya "mencicipi sedikit" dari kue yang lain.',
    'Handoyo memperhatikan jejak bunga itu, lalu remah di kumis seekor kucing oranye yang sedang tidur pulas di sofa. Kasus ditutup. Oyen dihukum tidak dapat camilan sore, dan arisan dilanjutkan dengan gorengan.',
  ] },
  { id: 'b10', shelf: 'detektif', title: 'Penelusuran dalam Merah (A Study in Scarlet)', author: 'Arthur Conan Doyle, 1887 — ringkasan', skill: 'logika', pages: [
    'Novel pertama Sherlock Holmes. Dr. John Watson, veteran perang yang pulang ke London, mencari teman berbagi sewa kamar dan dikenalkan pada Holmes. Kalimat pertama Holmes kepadanya: "Anda pernah di Afganistan, saya lihat."',
    'Holmes menjelaskan metodenya: mengamati detail kecil — kulit yang terbakar matahari, cara berdiri, luka di lengan — lalu menarik kesimpulan logis. Watson terkesan sekaligus kesal.',
    'Keduanya menyelidiki sebuah kematian misterius di rumah kosong. Kisahnya membawa pembaca hingga ke Amerika dan masa lalu sang pelaku. Buku ini (domain publik) menanamkan gaya deduksi yang masih dipakai cerita detektif hari ini.',
  ] },
  { id: 'b11', shelf: 'detektif', title: 'Pembunuhan di Rue Morgue', author: 'Edgar Allan Poe, 1841 — ringkasan', skill: 'logika', pages: [
    'Sering disebut cerita detektif modern pertama. Narator tinggal bersama C. Auguste Dupin, pria Paris yang gemar membaca dan menalar.',
    'Sebuah kejahatan terjadi di apartemen yang tampak terkunci dari dalam. Polisi bingung; para saksi mendengar suara yang tak bisa mereka kenali bahasanya.',
    'Dupin menyusun kepingan yang diabaikan orang lain dan sampai pada jawaban yang sangat tak terduga: pelakunya bukan manusia. Poe memperkenalkan pola "ruang terkunci" dan detektif jenius — cetak biru bagi Sherlock Holmes.',
  ] },
  { id: 'b12', shelf: 'detektif', title: 'Kejahatan dan Hukuman', author: 'Fyodor Dostoevsky, 1866 — ringkasan', skill: 'logika', pages: [
    'Raskolnikov, mahasiswa miskin di St. Petersburg, meyakinkan dirinya bahwa orang "luar biasa" boleh melanggar hukum demi tujuan besar. Ia lalu melakukan kejahatan berat.',
    'Sisa novel bukan tentang bagaimana ia tertangkap, melainkan tentang rasa bersalah yang menggerogotinya. Penyidik Porfiry mengejarnya lewat percakapan psikologis, bukan kekerasan.',
    'Lewat Sonya, perempuan yang penuh kasih meski hidupnya berat, Raskolnikov akhirnya mengaku dan menjalani hukuman. Novel ini tentang nurani, tanggung jawab, dan kemungkinan manusia untuk berubah.',
  ] },
  { id: 'b13', shelf: 'detektif', title: 'Inspektur Rahayu: Sidik Jari yang Hilang', author: 'Bima Adinegoro', skill: 'kreatif', pages: [
    'Sebuah toko emas di Semarang kebobolan tanpa jejak paksa. Inspektur Rahayu datang saat hujan deras, sepatu basah, dan kopi tubruk dingin di tangan.',
    'Semua pegawai punya alibi. Tapi Rahayu memperhatikan satu hal: kamera CCTV mati tepat lima menit, dan hanya satu orang yang tahu jadwal pemeliharaannya.',
    'Bukan sidik jari yang membongkar kasus, melainkan kebiasaan kecil — pelaku selalu merapikan kursi setelah duduk. "Orang bisa menghapus jejak," kata Rahayu, "tapi jarang bisa menghapus kebiasaan."',
  ] },
  // ---------------- MEMAHAMI & MENCEGAH BUNUH DIRI ----------------
  { id: 'b14', shelf: 'jiwa', title: 'Bunuh Diri: Sebuah Kajian Sosiologi (Le Suicide)', author: 'Émile Durkheim, 1897 — ringkasan', skill: 'logika', help: true, pages: [
    'Durkheim menunjukkan bahwa bunuh diri bukan semata persoalan pribadi. Dengan membandingkan data berbagai wilayah, ia menemukan pola yang berkaitan dengan kondisi sosial.',
    'Ia menyoroti dua hal: integrasi (seberapa terhubung seseorang dengan kelompoknya) dan regulasi (seberapa jelas norma dan arah hidup). Terlalu sedikit keduanya — misalnya kesepian atau krisis mendadak — meningkatkan risiko.',
    'Warisan terpentingnya: masyarakat punya peran melindungi. Keluarga yang hangat, komunitas yang peduli, dan rasa memiliki adalah faktor pelindung yang nyata. Kajian modern menambahkan faktor kesehatan jiwa dan akses layanan.',
  ] },
  { id: 'b15', shelf: 'jiwa', title: 'Tanda yang Sering Terlewat', author: 'Tim Psikolog Klinis Griya Pustaka', skill: 'karisma', help: true, pages: [
    'Banyak orang yang sedang berpikir mengakhiri hidup memberi tanda, meski tidak selalu jelas. Misalnya berkata merasa jadi beban, tidak punya harapan, atau "lebih baik tidak ada".',
    'Tanda perilaku: menarik diri dari orang terdekat, perubahan tidur dan makan yang drastis, kehilangan minat pada hal yang dulu disukai, membagikan barang berharga, atau berpamitan seolah akan pergi jauh.',
    'Tanda-tanda ini bukan untuk membuat panik, tapi untuk membuat kita hadir. Kalau melihatnya pada seseorang, dekati dengan lembut dan ajak bicara. Buku berikutnya di rak ini membahas caranya.',
  ] },
  { id: 'b16', shelf: 'jiwa', title: 'Tanya, Dengar, Temani', author: 'Tim Psikolog Klinis Griya Pustaka', skill: 'karisma', help: true, pages: [
    'Tanya: kalau khawatir, bertanyalah langsung dengan tenang, "Apakah kamu kepikiran untuk bunuh diri?" Penelitian menunjukkan pertanyaan langsung tidak menanamkan ide, justru sering membuat orang merasa dipahami.',
    'Dengar: biarkan dia bercerita tanpa dihakimi, tanpa buru-buru menasihati, tanpa membandingkan masalah. Kalimat seperti "Terima kasih sudah cerita, aku di sini" sangat berarti.',
    'Temani dan hubungkan: kalau risikonya terasa mendesak, jangan tinggalkan dia sendirian dan bantu menghubungi layanan darurat. Bantu dia terhubung dengan psikolog, psikiater, puskesmas, atau layanan SEJIWA 119 ext 8 — lalu tanyakan kabarnya lagi beberapa hari kemudian.',
  ] },
  { id: 'b17', shelf: 'jiwa', title: 'Mitos dan Fakta', author: 'Dr. Andini Rahma, Sp.KJ', skill: 'logika', help: true, pages: [
    'Mitos: "Orang yang membicarakannya tidak akan melakukannya." Fakta: membicarakannya sering adalah permintaan tolong dan harus ditanggapi serius.',
    'Mitos: "Bertanya soal bunuh diri akan memicu." Fakta: bertanya dengan peduli membuka ruang aman. Mitos: "Itu tanda orang lemah." Fakta: siapa pun bisa mengalami krisis — ini soal rasa sakit, bukan kelemahan.',
    'Mitos: "Kalau sudah bertekad, tidak bisa dicegah." Fakta: krisis sering bersifat sementara, dan banyak orang yang pernah berada di titik itu kemudian pulih dan menjalani hidup yang bermakna setelah mendapat dukungan.',
  ] },
  { id: 'b18', shelf: 'jiwa', title: 'Efek Werther dan Efek Papageno', author: 'Kurniawan Adi, jurnalis', skill: 'karisma', help: true, pages: [
    'Setelah novel Goethe "Penderitaan Werther Muda" (1774) terbit, muncul kekhawatiran tentang peniruan. Pada 1970-an sosiolog David Phillips menemukan bahwa pemberitaan yang sensasional bisa diikuti kenaikan kasus. Fenomena ini disebut efek Werther.',
    'Sebaliknya, efek Papageno (dinamai dari tokoh opera Mozart yang diselamatkan dari keputusasaan) menunjukkan bahwa kisah orang yang bertahan dan menemukan jalan keluar punya efek melindungi.',
    'Karena itu pedoman media yang baik: tidak menampilkan cara atau detail, tidak menyederhanakan penyebab, tidak meromantisasi, dan selalu menyertakan informasi bantuan. Cerita tentang harapan dan pemulihan menyelamatkan.',
  ] },
  { id: 'b19', shelf: 'jiwa', title: 'Setelah Kehilangan', author: 'Rina Kartika', skill: 'karisma', help: true, pages: [
    'Kehilangan orang tercinta karena bunuh diri membawa duka yang rumit: sedih, marah, bingung, dan pertanyaan "kenapa aku tidak menyadarinya?" yang terus berulang.',
    'Perasaan itu wajar. Penting diingat: keputusan itu dipengaruhi banyak hal yang kompleks, dan bukan kesalahanmu. Duka tidak punya jadwal; beri dirimu waktu.',
    'Kamu tidak harus melaluinya sendiri. Ada kelompok dukungan penyintas kehilangan, komunitas seperti Into The Light Indonesia, psikolog di puskesmas, dan orang-orang terdekat yang ingin menemanimu.',
  ] },
  { id: 'b20', shelf: 'jiwa', title: 'Kisah-Kisah Bertahan', author: 'Kumpulan kisah (nama disamarkan)', skill: 'karisma', help: true, pages: [
    '"D", mahasiswa tingkat akhir: "Aku merasa gagal dan jadi beban. Malam itu aku akhirnya mengirim pesan ke kakakku: aku nggak baik-baik saja. Dia datang. Besoknya kami ke psikolog kampus. Sekarang aku sudah lulus dan jadi relawan pendamping teman sebaya."',
    '"Pak R", ayah dua anak yang kehilangan pekerjaan: "Saya pikir laki-laki harus kuat sendiri. Ternyata yang membuat saya bertahan justru saat saya mau bercerita ke istri dan ke dokter di puskesmas. Pelan-pelan saya bangkit."',
    'Benang merahnya sama: rasa sakit itu nyata, tapi berubah. Meminta bantuan bukan akhir cerita — sering kali itu awal bab yang baru.',
  ] },
  { id: 'b21', shelf: 'jiwa', title: 'Sejarah Gerakan Pencegahan Bunuh Diri', author: 'Tim Griya Pustaka', skill: 'logika', help: true, pages: [
    'Tahun 1953, pendeta Chad Varah di London membuka saluran telepon bagi siapa pun yang sedang putus asa. Layanan itu tumbuh menjadi The Samaritans, jaringan relawan pendengar yang kini ada di banyak negara.',
    'Sejak 2003, setiap 10 September diperingati sebagai Hari Pencegahan Bunuh Diri Sedunia oleh IASP bersama WHO. WHO memperkirakan lebih dari 700.000 orang meninggal karena bunuh diri setiap tahun — dan menegaskan bahwa ini bisa dicegah.',
    'Di Indonesia, layanan kesehatan jiwa kini bisa diakses lewat puskesmas, rumah sakit, dan layanan SEJIWA 119 ext 8. Komunitas dan relawan juga aktif mengajak orang untuk saling peduli.',
  ] },
  { id: 'b22', shelf: 'jiwa', title: 'Merawat Kesehatan Jiwa Sehari-hari', author: 'Dr. Andini Rahma, Sp.KJ', skill: 'bugar', help: true, pages: [
    'Kesehatan jiwa dirawat seperti kesehatan tubuh: tidur cukup dan teratur, bergerak aktif, makan teratur, dan membatasi alkohol.',
    'Koneksi itu obat: ngobrol dengan pasangan, main dengan hewan peliharaan, menyapa tetangga, atau sekadar duduk bersama. Kesepian yang lama perlu diperhatikan.',
    'Kalau sedih, cemas, atau hampa berlangsung lebih dari dua minggu dan mengganggu aktivitas, itu saatnya menemui profesional. Psikolog dan psikiater bukan hanya untuk "orang gila" — mereka untuk siapa saja yang ingin hidupnya lebih baik.',
  ] },
  // ---------------- LAIN-LAIN ----------------
  { id: 'b23', shelf: 'lain', title: 'Panduan Merawat Capybara', author: 'Drh. Tegar Saputra', skill: 'logika', pages: [
    'Capybara adalah hewan pengerat terbesar di dunia, berasal dari Amerika Selatan. Mereka semi-akuatik: kaki berselaput sedikit dan bisa bertahan di bawah air beberapa menit.',
    'Capybara sangat sosial dan biasanya hidup berkelompok. Dipelihara sendirian bisa membuatnya stres, jadi sebaiknya berpasangan — seperti Kapi dan Kiki.',
    'Makanannya rumput dan sayuran; giginya terus tumbuh sehingga perlu banyak mengunyah. Kolam untuk berendam wajib ada. Sifatnya yang tenang membuat hewan lain sering santai duduk di punggungnya.',
  ] },
  { id: 'b24', shelf: 'lain', title: 'Kucing: Teman Serumah', author: 'Drh. Tegar Saputra', skill: 'logika', pages: [
    'Kucing dewasa tidur sekitar 12–16 jam sehari. Jangan heran kalau Oyen dan Snowy lebih sering rebahan daripada bergerak.',
    'Dengkuran (purring) biasanya tanda nyaman, meski kucing juga mendengkur saat menenangkan diri. Mengusap-usapkan kepala ke kaki manusia adalah cara menandai "ini orangku".',
    'Kotak pasir yang bersih itu penting — kucing bisa menolak memakai kotak yang kotor. Garukan kuku diperlukan untuk merawat cakar, dan steril membantu mencegah kelahiran yang tidak direncanakan.',
  ] },
];
export const bookById = (id) => BOOKS.find((b) => b.id === id);
