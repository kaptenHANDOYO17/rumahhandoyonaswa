// ============================================================
//  OTAK OBROLAN CADANGAN (tanpa API)
//  Dipakai kalau kunci AI belum diatur atau server AI gagal.
//  Bukan sekadar kalimat acak: menjawab sesuai isi pertanyaan + keadaan game.
// ============================================================
import { fmtRp } from './data.js';
import { NPCS, STAFF } from './people.js';

const has = (t, ...w) => w.some((x) => t.includes(x));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const jam = (W) => `${String(Math.floor((W.time % 1440) / 60)).padStart(2, '0')}.${String(Math.floor(W.time % 60)).padStart(2, '0')}`;
const MUSIM = { salju: 'musim salju yang dingin', hujan: 'musim hujan', panas: 'musim panas yang terik', gugur: 'musim gugur' };

// jawaban khas per peran (dipakai kalau pertanyaannya umum)
const ROLE = {
  barista: { sapa: 'Halo Kak! Mau kopi susu gula aren seperti biasa?', kerja: 'Saya barista di Kopi Griya, buka dari jam 6 pagi sampai 10 malam.', suka: 'Paling suka nyeduh manual V60 pagi-pagi, wanginya juara.' },
  warung: { sapa: 'Monggo, Mas/Mbak. Warung saya buka 24 jam.', kerja: 'Jaga Warung Madura. Telur, mie, galon, token, pulsa — lengkap.', suka: 'Senang kalau warga nggak perlu jauh-jauh cari kebutuhan.' },
  padang: { sapa: 'Alaaa, silakan masuk. Rendangnya baru turun dari tungku!', kerja: 'Saya urus RM Padang Uni Rosna. Rendang saya masak delapan jam.', suka: 'Rendang dan gulai kepala ikan, itu andalan kami.' },
  police: { sapa: 'Selamat siang. Ada yang bisa saya bantu?', kerja: 'Tugas saya menjaga keamanan komplek dan menerima laporan warga.', suka: 'Paling senang kalau laporan kehilangan bisa selesai dan barang kembali.' },
  fire: { sapa: 'Siap! Kalau ada asap atau banjir, telepon 113 ya.', kerja: 'Saya petugas Damkar. Selain api, kami juga sedot banjir dan evakuasi.', suka: 'Yang paling membahagiakan itu kalau semua orang selamat.' },
  doctor: { sapa: 'Halo, apa kabar? Ada keluhan kesehatan?', kerja: 'Saya dokter keluarga, bisa datang ke rumah kalau ada yang sakit.', suka: 'Pesan saya: tidur cukup, banyak minum, jangan telat makan.' },
  satpam: { sapa: 'Siap, aman terkendali, Pak/Bu!', kerja: 'Saya satpam komplek, jaga malam sampai subuh.', suka: 'Kalau dikasih kopi hangat pas ronda, itu nikmat sekali.' },
  rt: { sapa: 'Assalamualaikum. Ada yang bisa RT bantu?', kerja: 'Saya ketua RT 05. Urusan iuran, kerja bakti, dan keamanan lewat saya.', suka: 'Warga rukun dan mau gotong royong, itu sudah cukup.' },
  vendor: { sapa: 'Bakso... bakso! Mau pesan berapa mangkuk?', kerja: 'Saya dagang keliling komplek tiap sore.', suka: 'Pelanggan setia yang nunggu di depan rumah tiap hari.' },
  tani: { sapa: 'Monggo, mampir ke sawah. Cabainya lagi bagus-bagusnya.', kerja: 'Saya petani di sawah belakang komplek. Padi, cabai, tomat, pisang, sampai sawit.', suka: 'Paling senang lihat padi menguning sebelum panen.' },
  guest: { sapa: 'Halo! Kangen banget sama kalian.', kerja: 'Saya lagi mampir aja, sekalian lihat rumah kalian yang makin cantik.', suka: 'Ngobrol santai sambil minum teh.' },
};
const DEF = { sapa: 'Eh, halo! Apa kabar?', kerja: 'Saya warga Griya Asri biasa, tinggal tidak jauh dari sini.', suka: 'Suka suasana komplek yang tenang dan tetangganya ramah.' };

export function localReply(hh, name, text) {
  const W = hh.world; const t = String(text || '').toLowerCase().trim();
  const d = NPCS[name] || STAFF[name] || {};
  const R = ROLE[d.role] || (name === 'Handoyo' || name === 'Naswa' ? null : DEF);
  const sifat = d.trait || d.role || '';
  const tanya = /\?|apa|siapa|kapan|kenapa|gimana|bagaimana|di ?mana|berapa|bisakah|boleh|mau ?kah/.test(t);

  // ---- sapaan & basa-basi ----
  if (has(t, 'halo', 'hai', 'assalamu', 'pagi', 'siang', 'sore', 'malam', 'permisi') && t.length < 40)
    return `${R ? R.sapa : 'Hai sayang!'} Sekarang jam ${jam(W)}, ${MUSIM[W.lastSeason] || 'harinya cerah'}.`;
  if (has(t, 'apa kabar', 'gimana kabar', 'sehat'))
    return pick([`Alhamdulillah sehat. ${name === 'Naswa' ? 'Aku baru selesai melukis tadi.' : 'Kamu sendiri gimana?'}`, 'Baik, cuma agak capek sedikit. Kamu apa kabar?']);
  if (has(t, 'terima kasih', 'makasih', 'thanks')) return pick(['Sama-sama! Senang bisa bantu.', 'Nggih, sami-sami. Kalau butuh apa-apa bilang saja.']);
  if (has(t, 'maaf', 'sori')) return 'Santai saja, tidak apa-apa kok.';
  if (has(t, 'siapa kamu', 'siapa namamu', 'kenalan', 'kamu siapa'))
    return `Saya ${name}${sifat ? `, ${sifat.toLowerCase()}` : ''}. Senang kenalan!`;

  // ---- pertanyaan tentang keadaan game ----
  if (has(t, 'jam berapa', 'sekarang jam')) return `Sekarang jam ${jam(W)}, hari ke-${Math.floor(W.time / 1440) + 1}.`;
  if (has(t, 'cuaca', 'hujan', 'panas', 'salju', 'musim'))
    return `Sekarang ${MUSIM[W.lastSeason] || 'cuacanya biasa'}, dan di luar ${{ hujan: 'sedang hujan', badai: 'ada badai, hati-hati banjir', salju: 'salju turun', cerah: 'cerah' }[W.weather] || 'adem'}.${(W.flood || 0) > 0.3 ? ' Airnya mulai naik lho.' : ''}`;
  if (has(t, 'banjir')) return (W.flood || 0) > 0.2 ? 'Iya, airnya naik. Mending panggil damkar buat sedot air, atau kuras dari pagar.' : 'Alhamdulillah sekarang tidak banjir. Selokan sudah dibersihkan waktu kerja bakti.';
  if (has(t, 'uang', 'duit', 'kaya', 'tabungan')) return `Setahu saya keluarga ini lumayan mapan — kas rumah sekitar ${fmtRp((hh.sims.Handoyo?.wallet || 0) + (hh.sims.Naswa?.wallet || 0))}. Tapi rezeki tetap harus disyukuri.`;
  if (has(t, 'utang', 'pinjam', 'hutang')) return W.loan ? `Setahu saya Bang Jefri masih ada tanggungan ${fmtRp(W.loan.amount)} ke ${W.loan.lender}, jatuh tempo hari ke-${W.loan.due + 1}.` : 'Sekarang lagi tidak ada utang-piutang di komplek. Aman.';
  if (has(t, 'lukis', 'lukisan', 'seni', 'kanvas')) {
    const g = hh.gallery || []; const terjual = g.filter((p) => p.status === 'sold').length;
    return `Naswa itu pelukis. Di galerinya sudah ada ${g.length} karya${terjual ? `, ${terjual} di antaranya laku terjual` : ''}. Lukisannya bagus-bagus, saya suka yang warna senja.`;
  }
  if (has(t, 'kerja', 'pekerjaan', 'profesi', 'kantor')) return R ? R.kerja : (name === 'Handoyo' ? 'Aku programmer, sekarang lagi ngerjain proyek freelance.' : 'Aku pelukis, karyaku dijual lewat toko online.');
  if (has(t, 'kucing', 'oyen', 'snowy', 'capybara', 'kapi', 'kiki', 'hewan'))
    return `Hewan di rumah itu ada ${hh.pets().length} ekor sekarang. Oyen sama Snowy kucingnya, Kapi sama Kiki capybaranya. Lucu-lucu, apalagi kalau lagi berendam bareng.`;
  if (has(t, 'anak', 'keluarga')) return d.fam ? `Saya sekeluarga dengan ${d.fam}. Kami tinggal tidak jauh dari sini.` : 'Keluarga saya baik-baik saja, terima kasih sudah bertanya.';
  // harga & menu (khas per peran)
  if (has(t, 'harga', 'berapa', 'bayar', 'tarif', 'menu')) {
    if (d.role === 'padang') return 'Nasi rendang 28 ribu, ayam pop 25 ribu, gulai kepala ikan 35 ribu, dendeng 30 ribu. Paket hemat 15 ribu, hidang 85 ribu.';
    if (d.role === 'barista') return 'Kopi susu gula aren 25 ribu, iced americano 22 ribu, matcha 30 ribu. Croissant 28 ribu, pisang goreng keju 18 ribu.';
    if (d.role === 'warung') return 'Camilan 12 ribu, es teh 5 ribu, paket telur-mie-beras 65 ribu, galon 22 ribu, token listrik 100 ribu.';
    if (d.role === 'tani') return 'Sayur sepaket 45 ribu, cabai & tomat sekilo 32 ribu, pisang raja sesisir 25 ribu, beras pandan wangi 5 kg 78 ribu.';
    if (d.role === 'vendor') return 'Semangkuk 20 ribu saja, Mas. Kalau bungkus sama sambalnya dipisah.';
    if (d.role === 'doctor') return `Kunjungan ke rumah ${fmtRp(300000)}, sudah termasuk pemeriksaan dan obat ringan.`;
    if (d.role === 'rt') return `Iuran RT ${fmtRp(50000)} per periode, untuk keamanan, kebersihan, dan lampu jalan.`;
    if (has(t, 'iuran')) return `Iuran RT ${fmtRp(50000)}. Bisa dibayar langsung ke Pak Harjo atau lewat SMS.`;
  }
  if (has(t, 'iuran')) return `Iuran RT ${fmtRp(50000)} per periode. Pak Harjo yang menagih keliling.`;
  // sedang apa / di mana
  if (has(t, 'lagi apa', 'sedang apa', 'ngapain')) {
    const s2 = hh.actorByName ? hh.actorByName(name) : null;
    const akt = s2 && s2.queue && s2.queue[0] && (s2.queue[0].stepLabel || s2.queue[0].label);
    if (akt) return `Lagi ${String(akt).toLowerCase()} nih. Kamu sendiri lagi apa?`;
    return R ? `Lagi ${R.kerja.toLowerCase().replace(/^saya /, '')}` + '. Kamu lagi apa?' : 'Lagi santai di rumah. Kamu?';
  }
  if (has(t, 'di mana', 'dimana', 'posisi', 'lokasi')) {
    const s2 = hh.actorByName ? hh.actorByName(name) : null;
    if (s2 && s2.hidden) return 'Aku lagi tidak di komplek, nanti balik lagi kok.';
    return d.role === 'padang' ? 'Saya di RM Padang, sebelah timur rumah kalian, masuk lewat gang samping.' : d.role === 'barista' ? 'Di Kopi Griya, persis di samping barat rumah kalian.' : d.role === 'tani' ? 'Di lapak dekat pagar belakang rumah kalian, depan sawah.' : 'Lagi di sekitar komplek kok.';
  }
  if (has(t, 'kopi', 'ngopi', 'espresso', 'latte')) return d.role === 'barista' ? 'Kopi susu gula aren paling laris, 25 ribu. Kalau mau yang kuat, iced americano.' : 'Kopi Griya buka sampai jam 10 malam. Kopi susu gula arennya enak, 25 ribu saja.';
  if (has(t, 'makan', 'lapar', 'masak', 'kuliner', 'enak'))
    return pick(['Coba RM Padang Uni Rosna di sebelah, rendangnya juara. Kalau mau ringan, ada bakso Pak Kumis keliling sore.', 'Warung Madura buka 24 jam kalau butuh telur atau mie. Kopi Griya juga punya pisang goreng keju.']);
  if (has(t, 'sawah', 'padi', 'petani', 'tani', 'panen', 'cabai', 'tomat', 'pisang', 'sawit'))
    return 'Di belakang komplek itu sawah luas. Ada padi, kebun pisang, sawit, cabai, dan tomat. Pak Tarno biasa jual hasil panen di lapak dekat pagar belakang, murah dan segar.';
  if (has(t, 'buku', 'baca', 'perpustakaan')) return 'Perpustakaan di lantai 2 rumah ini isinya 80-an buku, termasuk rak forensik kesukaan Naswa. Boleh pinjam kalau mau.';
  if (has(t, 'main', 'mampir', 'ke rumah', 'berkunjung')) return 'Boleh banget! Kabari saja lewat SMS, nanti saya ke sana.';
  if (has(t, 'tolong', 'bantu', 'minta')) return d.role === 'staff' || STAFF[name] ? 'Siap, langsung saya kerjakan.' : 'Tentu, saya bantu sebisanya. Butuh apa?';
  if (has(t, 'rumah', 'komplek', 'griya')) return 'Griya Asri ini nyaman: tetangganya ramah, ada kafe, warung 24 jam, RM Padang, dan sawah luas di belakang.';
  if (has(t, 'sakit', 'demam', 'pusing')) return 'Waduh, jangan disepelekan. Panggil dr. Rani lewat tombol Darurat, biar diperiksa di rumah.';
  if (has(t, 'aman', 'maling', 'pencuri')) return 'Kalau ada yang mencurigakan langsung lapor Pak Slamet atau polisi 110. Malam hari selalu ada ronda.';
  if (has(t, 'cinta', 'sayang', 'romantis')) return name === 'Handoyo' || name === 'Naswa' ? 'Aku juga sayang kamu. Nanti malam kita ngopi berdua di teras ya.' : 'Handoyo sama Naswa itu pasangan paling mesra di RT ini. Bikin iri, hehe.';

  // ---- pertanyaan yang tidak dikenali ----
  if (tanya) return pick([
    `Wah, soal itu saya kurang tahu detailnya. Tapi kalau menurut saya${sifat ? ` sebagai ${sifat.toLowerCase()}` : ''}, sebaiknya dicoba dulu saja.`,
    'Hmm, pertanyaan bagus. Jujur saya belum tahu pastinya — coba tanya Pak RT, beliau biasanya paham.',
    'Kalau itu saya belum pernah mengalami sendiri. Ceritain dong lebih lanjut, biar saya ikut mikir.',
  ]);
  if (t.split(' ').length <= 3) return pick(['Oh gitu ya. Cerita lebih banyak dong.', 'Hehe iya. Terus gimana?', 'Wah menarik. Lanjut?']);
  return pick([
    'Iya, saya paham maksudmu. Kalau di komplek ini memang begitu biasanya.',
    'Setuju. Kadang hal kecil begitu yang bikin hidup bertetangga jadi enak.',
    'Wah, kalau itu saya sependapat. Nanti kita obrolkan lagi sambil ngopi ya.',
  ]);
}

// jawaban untuk SMS: lebih singkat
export function localSms(hh, name, text) {
  const r = localReply(hh, name, text);
  return r.length > 130 ? r.slice(0, 127).replace(/[,.;]\s*\S*$/, '') + '…' : r;
}
