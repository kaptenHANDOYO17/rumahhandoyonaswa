// ============================================================
//  DATA GAME — Rumah Handoyo & Naswa
//  Semua angka keseimbangan (balancing) dikumpulkan di sini.
// ============================================================

export const CELL = 0.25;
export const GRID = { minX: -22, maxX: 22, minZ: -14, maxZ: 20 };
export const LOT = { minX: -13, maxX: 13, minZ: -11, maxZ: 11 };
export const HOUSE = { minX: -8, maxX: 8, minZ: -6, maxZ: 6, wallH: 2.8, wallT: 0.15 };
export const PI = Math.PI;

export const SIM_NAMES = ['Handoyo', 'Naswa'];

// Dinding rumah. n = arah normal luar (untuk mode cutaway)
export const WALLS = [
  // luar
  { a: [-8, 6], b: [-4.5, 6], ext: true, n: [0, 1] },
  { a: [-3.5, 6], b: [8, 6], ext: true, n: [0, 1] },
  { a: [-8, -6], b: [8, -6], ext: true, n: [0, -1] },
  { a: [-8, -6], b: [-8, 6], ext: true, n: [-1, 0] },
  { a: [8, -6], b: [8, 3.2], ext: true, n: [1, 0] },
  { a: [8, 4.2], b: [8, 6], ext: true, n: [1, 0] },
  // dalam
  { a: [-8, 0], b: [-3.5, 0], ext: false, n: [0, 1] },
  { a: [-2.5, 0], b: [0.5, 0], ext: false, n: [0, 1] },
  { a: [1.5, 0], b: [3.6, 0], ext: false, n: [0, 1] },
  { a: [4.6, 0], b: [8, 0], ext: false, n: [0, 1] },
  { a: [-1, -6], b: [-1, 0], ext: false, n: [1, 0] },
  { a: [3, -6], b: [3, 0], ext: false, n: [1, 0] },
];

// Jendela: dinding (index), posisi di sepanjang dinding (0..1), lebar
export const WINDOWS = [
  { wall: 0, t: 0.4, w: 1.6 }, { wall: 1, t: 0.2, w: 1.4 }, { wall: 1, t: 0.72, w: 1.8 },
  { wall: 2, t: 0.22, w: 1.6 }, { wall: 2, t: 0.52, w: 0.8 }, { wall: 2, t: 0.8, w: 1.4 },
  { wall: 3, t: 0.25, w: 1.4 }, { wall: 3, t: 0.72, w: 1.6 },
  { wall: 4, t: 0.35, w: 1.4 },
];

export const DOORS = [
  { x: -4, z: 6, axis: 'x', ext: true, main: true },
  { x: 8, z: 3.7, axis: 'z', ext: true },
  { x: -3, z: 0, axis: 'x' },
  { x: 1, z: 0, axis: 'x' },
  { x: 4.1, z: 0, axis: 'x' },
];

export const ROOMS = [
  { name: 'Ruang Keluarga', minX: -8, maxX: 1, minZ: 0, maxZ: 6, floor: 'wood', light: [-3.5, 3] },
  { name: 'Dapur & Ruang Makan', minX: 1, maxX: 8, minZ: 0, maxZ: 6, floor: 'tile', light: [4.5, 3] },
  { name: 'Kamar Tidur', minX: -8, maxX: -1, minZ: -6, maxZ: 0, floor: 'wood2', light: [-4.5, -3] },
  { name: 'Kamar Mandi', minX: -1, maxX: 3, minZ: -6, maxZ: 0, floor: 'bath', light: [1, -3] },
  { name: 'Ruang Kerja', minX: 3, maxX: 8, minZ: -6, maxZ: 0, floor: 'wood', light: [5.5, -3] },
];

export const FENCES = [
  { a: [-13, 11], b: [-5, 11] }, { a: [-3, 11], b: [9.6, 11] }, { a: [12.4, 11], b: [13, 11] },
  { a: [-13, -11], b: [-13, 11] }, { a: [13, -11], b: [13, 11] }, { a: [-13, -11], b: [13, -11] },
];

export const TREES = [[-10.6, 8.2], [-10.2, -8.4], [10.4, -8.6], [7.5, -9.6]];
export const FRONT_YARD = [3.5, 9.7]; // titik potong rumput

// ------------------------------------------------------------
//  Katalog objek. Koordinat lokal: depan objek = +z lokal.
//  spot: ax/az = titik datang, px/pz/py = titik pose, yaw = arah hadap (lokal)
// ------------------------------------------------------------
const FRONT = (az) => ({ ax: 0, az, yaw: PI });

export const TYPES = {
  fridge:      { name: 'Kulkas 2 Pintu', cat: 'dapur', price: 3500000, w: 0.8, d: 0.7, spots: [FRONT(0.85)], acts: ['snack', 'cook', 'cook2'] },
  stove:       { name: 'Kompor & Oven', cat: 'dapur', price: 2200000, w: 0.8, d: 0.65, spots: [FRONT(0.8)], acts: ['cook', 'cook2', 'cleanStove'] },
  counterSink: { name: 'Bak Cuci Piring', cat: 'dapur', price: 1500000, w: 1.0, d: 0.65, spots: [FRONT(0.8)], acts: ['washDishes', 'washHands'] },
  kitchenTrash:{ name: 'Tempat Sampah Dapur', cat: 'dapur', price: 150000, w: 0.4, d: 0.4, spots: [FRONT(0.6)], acts: ['takeTrash'] },
  diningTable: { name: 'Meja Makan 4 Kursi', cat: 'dapur', price: 2400000, w: 1.6, d: 0.9,
    spots: [
      { ax: -0.4, az: 1.25, px: -0.4, pz: 0.68, yaw: PI, seat: 0.47 }, { ax: 0.4, az: 1.25, px: 0.4, pz: 0.68, yaw: PI, seat: 0.47 },
      { ax: -0.4, az: -1.25, px: -0.4, pz: -0.68, yaw: 0, seat: 0.47 }, { ax: 0.4, az: -1.25, px: 0.4, pz: -0.68, yaw: 0, seat: 0.47 },
    ], acts: ['eatServing', 'clearDishes', 'sitTable'] },
  sofa:        { name: 'Sofa Keluarga', cat: 'ruang', price: 3200000, w: 2.1, d: 0.9,
    spots: [
      { ax: -0.5, az: 0.9, px: -0.5, pz: 0.08, yaw: 0, seat: 0.44 }, { ax: 0.5, az: 0.9, px: 0.5, pz: 0.08, yaw: 0, seat: 0.44 },
      { ax: 0, az: 0.9, px: 0.35, pz: 0.05, py: 0.5, yaw: -PI / 2, lie: true },
    ], acts: ['sitSofa', 'watchTV', 'napSofa'] },
  tv:          { name: 'Smart TV 55"', cat: 'ruang', price: 4800000, w: 1.35, d: 0.45, spots: [FRONT(2.0)], acts: ['watchTV', 'watchCooking'] },
  armchair:    { name: 'Kursi Santai Rotan', cat: 'ruang', price: 900000, w: 0.9, d: 0.85, buy: true,
    spots: [{ ax: 0, az: 0.85, px: 0, pz: 0.05, yaw: 0, seat: 0.44 }], acts: ['sitSofa', 'readSit'] },
  rug:         { name: 'Karpet Batik', cat: 'dekor', price: 450000, w: 2.4, d: 1.6, walk: true, buy: true, spots: [], acts: [] },
  bookshelf:   { name: 'Rak Buku Jati', cat: 'ruang', price: 1100000, w: 1.0, d: 0.35, buy: true, spots: [FRONT(0.8)], acts: ['read', 'readCook'] },
  plantPot:    { name: 'Tanaman Monstera', cat: 'dekor', price: 250000, w: 0.5, d: 0.5, buy: true, spots: [FRONT(0.7)], acts: ['water'] },
  floorLamp:   { name: 'Lampu Berdiri', cat: 'dekor', price: 350000, w: 0.35, d: 0.35, buy: true, spots: [], acts: [] },
  aquarium:    { name: 'Akuarium Ikan Cupang', cat: 'dekor', price: 800000, w: 1.1, d: 0.45, buy: true, spots: [FRONT(0.75)], acts: ['feedFish'] },
  radio:       { name: 'Speaker Musik', cat: 'hiburan', price: 700000, w: 0.55, d: 0.4, buy: true, spots: [FRONT(1.1)], acts: ['listen', 'dance'] },
  treadmill:   { name: 'Treadmill', cat: 'hiburan', price: 3000000, w: 0.8, d: 1.8, buy: true,
    spots: [{ ax: 1.0, az: 0.3, px: 0, pz: 0.15, py: 0.18, yaw: PI }], acts: ['exercise'] },
  easel:       { name: 'Kanvas Lukis', cat: 'hiburan', price: 600000, w: 0.7, d: 0.6, buy: true, spots: [FRONT(0.75)], acts: ['paint'] },
  bed:         { name: 'Kasur Queen', cat: 'kamar', price: 4200000, w: 1.8, d: 2.1,
    spots: [
      { ax: -1.3, az: 0.1, px: -0.42, pz: -0.05, py: 0.56, yaw: 0, lie: true },
      { ax: 1.3, az: 0.1, px: 0.42, pz: -0.05, py: 0.56, yaw: 0, lie: true },
      { ax: 0, az: 1.45, yaw: PI },
    ], acts: ['sleep', 'nap', 'makeBed'] },
  nightstand:  { name: 'Nakas & Lampu', cat: 'kamar', price: 400000, w: 0.45, d: 0.4, buy: true, spots: [], acts: [] },
  wardrobe:    { name: 'Lemari Pakaian', cat: 'kamar', price: 2000000, w: 1.2, d: 0.6, spots: [FRONT(0.8)], acts: ['changeClothes'] },
  toilet:      { name: 'Kloset Duduk', cat: 'mandi', price: 1300000, w: 0.45, d: 0.7,
    spots: [{ ax: 0, az: 0.75, px: 0, pz: 0.12, yaw: 0, seat: 0.42 }], acts: ['useToilet', 'cleanToilet'] },
  shower:      { name: 'Shower Kaca', cat: 'mandi', price: 2600000, w: 1.0, d: 1.0,
    spots: [{ ax: 0, az: 0.9, px: 0, pz: 0.0, yaw: PI }], acts: ['shower'] },
  bathSink:    { name: 'Wastafel', cat: 'mandi', price: 700000, w: 0.6, d: 0.45, spots: [FRONT(0.7)], acts: ['brushTeeth'] },
  washer:      { name: 'Mesin Cuci', cat: 'mandi', price: 2800000, w: 0.65, d: 0.65, spots: [FRONT(0.8)], acts: ['laundry'] },
  basket:      { name: 'Keranjang Baju Kotor', cat: 'mandi', price: 120000, w: 0.5, d: 0.4, spots: [FRONT(0.65)], acts: ['laundry'] },
  desk:        { name: 'Meja Kerja & Komputer', cat: 'kerja', price: 6500000, w: 1.3, d: 0.65,
    spots: [{ ax: 0.0, az: 1.15, px: 0, pz: 0.58, yaw: PI, seat: 0.47 }], acts: ['freelance', 'playGame', 'studyOnline'] },
  plant:       { name: 'Taman Bunga', cat: 'taman', price: 300000, w: 1.3, d: 0.6, buy: true, spots: [FRONT(0.75)], acts: ['water'] },
  veggie:      { name: 'Kebun Cabai & Tomat', cat: 'taman', price: 500000, w: 2.0, d: 1.0, buy: true, spots: [FRONT(0.95)], acts: ['water', 'harvest'] },
  clothesline: { name: 'Jemuran', cat: 'taman', price: 200000, w: 2.4, d: 0.3, spots: [FRONT(0.65)], acts: ['liftLaundry'] },
  car:         { name: 'Mobil Keluarga', cat: 'luar', price: 0, w: 1.8, d: 4.2, fixed: true,
    spots: [{ ax: -1.35, az: 0.4, yaw: PI / 2 }], acts: ['workCar', 'washCar'] },
  mower:       { name: 'Mesin Potong Rumput', cat: 'luar', price: 1200000, w: 0.6, d: 0.9, spots: [FRONT(0.85)], acts: ['mow'] },
  mailbox:     { name: 'Kotak Surat', cat: 'luar', price: 0, w: 0.35, d: 0.35, fixed: true, spots: [FRONT(0.6)], acts: ['payBills', 'readMail'] },
  outdoorBin:  { name: 'Tong Sampah Depan', cat: 'luar', price: 0, w: 0.6, d: 0.6, fixed: true, spots: [FRONT(0.7)], acts: [] },
  gate:        { name: 'Pagar Depan', cat: 'luar', price: 0, w: 1.8, d: 0.2, fixed: true, walk: true,
    spots: [{ ax: 0, az: -0.7, yaw: 0 }], acts: ['workOjol', 'buyVeg', 'jog'] },
};

export const BUY_CATS = [
  { id: 'ruang', label: 'Ruang keluarga' }, { id: 'dapur', label: 'Dapur' }, { id: 'kamar', label: 'Kamar' },
  { id: 'mandi', label: 'Kamar mandi' }, { id: 'kerja', label: 'Kerja' }, { id: 'hiburan', label: 'Hiburan' },
  { id: 'dekor', label: 'Dekorasi' }, { id: 'taman', label: 'Taman' },
];

// rot: 0 = hadap +z, 1 = hadap +x, 2 = hadap -z, 3 = hadap -x
export const INITIAL_OBJECTS = [
  ['fridge', 7.55, 0.55, 3], ['counterSink', 7.6, 1.5, 3], ['stove', 7.6, 2.45, 3], ['kitchenTrash', 7.7, 5.55, 3],
  ['diningTable', 4.2, 3.6, 0],
  ['tv', -7.65, 3.0, 1], ['sofa', -4.3, 3.0, 3], ['rug', -5.9, 3.0, 1], ['bookshelf', -6.8, 0.32, 0],
  ['plantPot', -7.45, 5.45, 0], ['plantPot', 0.4, 5.5, 0],
  ['bed', -4.5, -4.85, 0], ['nightstand', -5.75, -5.65, 0], ['nightstand', -3.25, -5.65, 0], ['wardrobe', -7.6, -2.2, 1],
  ['toilet', -0.4, -5.55, 0], ['bathSink', 0.8, -5.7, 0], ['shower', 2.35, -5.35, 0],
  ['washer', -0.55, -2.8, 1], ['basket', -0.65, -1.7, 1],
  ['desk', 5.8, -5.55, 0], ['bookshelf', 7.7, -2.6, 3],
  ['car', 10.8, 2.8, 0], ['mower', 12.4, -0.6, 3], ['mailbox', -5.7, 10.65, 2], ['outdoorBin', -2.3, 10.6, 2],
  ['gate', -4, 11, 0], ['plant', -7, 8.4, 0], ['plant', 0.8, 8.4, 0], ['veggie', 3, -8.8, 0], ['clothesline', -4, -8.9, 0],
  ['plantPot', 6.3, 7.4, 0],
];

// ------------------------------------------------------------
//  Kebutuhan
// ------------------------------------------------------------
export const NEEDS = [
  { id: 'hunger', label: 'Lapar', icon: '🍛', decay: 6.5 },
  { id: 'energy', label: 'Energi', icon: '⚡', decay: 5 },
  { id: 'hygiene', label: 'Kebersihan', icon: '🧼', decay: 4.2 },
  { id: 'bladder', label: 'Kamar kecil', icon: '🚽', decay: 9 },
  { id: 'social', label: 'Sosial', icon: '💬', decay: 4.5 },
  { id: 'fun', label: 'Hiburan', icon: '🎈', decay: 5.2 },
];

export const SKILLS = [
  { id: 'memasak', label: 'Memasak', icon: '🍳' },
  { id: 'logika', label: 'Logika', icon: '🧠' },
  { id: 'kreatif', label: 'Kreativitas', icon: '🎨' },
  { id: 'bugar', label: 'Kebugaran', icon: '💪' },
  { id: 'karisma', label: 'Karisma', icon: '✨' },
];
export const SKILL_XP = 100; // xp per level, max level 10

export const CAREERS = {
  Handoyo: { name: 'Perbankan', levels: [
    ['Staf Magang', 160000], ['Teller', 220000], ['Customer Service Senior', 300000],
    ['Supervisor', 420000], ['Manajer Cabang', 600000], ['Kepala Wilayah', 850000] ] },
  Naswa: { name: 'Desain Grafis', levels: [
    ['Desainer Magang', 160000], ['Desainer Junior', 230000], ['Desainer', 310000],
    ['Desainer Senior', 430000], ['Art Director', 620000], ['Creative Director', 880000] ] },
};
export const WORK_START = [6, 11]; // boleh berangkat jam 06.00–11.59
export const WORK_LEN = 360;       // menit game

export const OUTFIT_DEFAULTS = {
  Handoyo: { skin: '#b97f56', hair: '#1d1714', hairStyle: 'short', shirt: '#2f6fb3', pants: '#2b2f3a', height: 1.0, dress: false },
  Naswa:   { skin: '#d49a72', hair: '#2a1a14', hairStyle: 'long', shirt: '#d9577a', pants: '#3a2f45', height: 0.94, dress: true },
};
export const SKIN_TONES = ['#f1c7a3', '#d9a47c', '#c68a5e', '#a86d45', '#7d4f33'];
export const CLOTH_COLORS = ['#2f6fb3', '#d9577a', '#3e9a6e', '#e2a33b', '#7a4bb0', '#e8e4d8', '#2b2f3a', '#b3362f', '#1f8a9c', '#8a6b4a'];
export const HAIR_COLORS = ['#1d1714', '#3b2519', '#6b4428', '#9b8a7a', '#b9892f'];
export const HAIR_STYLES = [
  { id: 'short', label: 'Pendek' }, { id: 'long', label: 'Panjang' }, { id: 'bun', label: 'Cepol' },
  { id: 'hijab', label: 'Hijab' }, { id: 'curly', label: 'Ikal' },
];

// ------------------------------------------------------------
//  Moodlet (emosi)
// ------------------------------------------------------------
export const MOODLETS = {
  segar:      { label: 'Segar habis mandi', emoji: '🚿', val: 10, dur: 180 },
  kenyang:    { label: 'Kenyang', emoji: '😋', val: 8, dur: 150 },
  enak:       { label: 'Masakannya enak banget', emoji: '👩‍🍳', val: 15, dur: 200 },
  gosong:     { label: 'Masakan gosong', emoji: '🔥', val: -12, dur: 150 },
  dimasakin:  { label: 'Dimasakin pasangan', emoji: '🥰', val: 20, dur: 240 },
  romantis:   { label: 'Lagi romantis', emoji: '💞', val: 20, dur: 240 },
  dipeluk:    { label: 'Habis dipeluk', emoji: '🤗', val: 12, dur: 180 },
  ketawa:     { label: 'Habis ketawa', emoji: '😂', val: 10, dur: 120 },
  dipijat:    { label: 'Badan enteng', emoji: '💆', val: 12, dur: 180 },
  ditolak:    { label: 'Ditolak pasangan', emoji: '💔', val: -15, dur: 180 },
  kesal:      { label: 'Kesal diprotes', emoji: '😤', val: -12, dur: 150 },
  nyenyak:    { label: 'Tidur nyenyak', emoji: '😴', val: 10, dur: 240 },
  tidurBerdua:{ label: 'Tidur berdua', emoji: '🛌', val: 12, dur: 300 },
  malu:       { label: 'Malu banget', emoji: '😳', val: -20, dur: 180 },
  gajian:     { label: 'Gajian!', emoji: '💸', val: 15, dur: 300 },
  promosi:    { label: 'Naik jabatan', emoji: '🏆', val: 30, dur: 720 },
  lukisanLaku:{ label: 'Lukisan laku', emoji: '🖼️', val: 12, dur: 240 },
  panen:      { label: 'Panen sendiri', emoji: '🌶️', val: 10, dur: 180 },
  olahraga:   { label: 'Habis olahraga', emoji: '🏃', val: 10, dur: 180 },
  suratLucu:  { label: 'Dapat kabar baik', emoji: '💌', val: 8, dur: 180 },
  // dinamis (dihitung terus)
  rumahBersih:{ label: 'Rumah bersih & rapi', emoji: '✨', val: 10, dyn: true },
  berantakan: { label: 'Rumah berantakan', emoji: '🗑️', val: -15, dyn: true },
  kelaparan:  { label: 'Kelaparan', emoji: '😫', val: -30, dyn: true },
  lelah:      { label: 'Capek banget', emoji: '🥱', val: -20, dyn: true },
  bau:        { label: 'Badan bau', emoji: '🤢', val: -15, dyn: true },
  kebelet:    { label: 'Kebelet', emoji: '😖', val: -20, dyn: true },
  bosan:      { label: 'Bosan', emoji: '😑', val: -10, dyn: true },
  kesepian:   { label: 'Kesepian', emoji: '🥺', val: -10, dyn: true },
  matiLampu:  { label: 'Listrik padam', emoji: '🕯️', val: -10, dyn: true },
  nunggak:    { label: 'Mikirin tagihan', emoji: '🧾', val: -8, dyn: true },
  hujan:      { label: 'Suasana hujan adem', emoji: '🌧️', val: 4, dyn: true },
};

export const MOOD_LEVELS = [
  { min: 45, label: 'Sangat bahagia', color: '#4fc27a' },
  { min: 15, label: 'Bahagia', color: '#8bcf52' },
  { min: -15, label: 'Biasa aja', color: '#e2c33b' },
  { min: -45, label: 'Kurang enak hati', color: '#e8893a' },
  { min: -999, label: 'Tertekan', color: '#d9463b' },
];

export const REL_LEVELS = [
  { min: 75, label: 'Sehati sejiwa' }, { min: 45, label: 'Mesra' }, { min: 15, label: 'Harmonis' },
  { min: -15, label: 'Datar' }, { min: -999, label: 'Lagi renggang' },
];

export const FAMILY_LEVELS = ['Pengantin Baru', 'Keluarga Muda', 'Keluarga Harmonis', 'Keluarga Teladan RT', 'Keluarga Sakinah', 'Keluarga Idaman Perumahan'];

// ------------------------------------------------------------
//  Tujuan harian
// ------------------------------------------------------------
export const GOAL_POOL = [
  { key: 'eatTable', label: 'Makan di meja makan', need: 2 },
  { key: 'dishes', label: 'Cuci piring kotor', need: 1 },
  { key: 'trash', label: 'Buang sampah ke depan', need: 1 },
  { key: 'water', label: 'Siram tanaman', need: 3 },
  { key: 'hug', label: 'Peluk pasangan', need: 1 },
  { key: 'talk', label: 'Ngobrol bareng pasangan', need: 2 },
  { key: 'laundry', label: 'Cuci & jemur baju', need: 1 },
  { key: 'work', label: 'Selesaikan kerja', need: 1 },
  { key: 'mop', label: 'Pel lantai yang kotor', need: 2 },
  { key: 'car', label: 'Cuci mobil', need: 1 },
  { key: 'mow', label: 'Potong rumput halaman', need: 1 },
  { key: 'read', label: 'Baca buku', need: 1 },
  { key: 'cookPartner', label: 'Masak untuk berdua', need: 1 },
  { key: 'makeBed', label: 'Rapikan kasur', need: 1 },
  { key: 'exercise', label: 'Olahraga atau jalan pagi', need: 1 },
  { key: 'kiss', label: 'Cium pasangan', need: 1 },
  { key: 'toilet', label: 'Bersihkan toilet', need: 1 },
];

export const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export const START_MONEY = 2500000;
export const START_TIME = 7 * 60; // hari 1 jam 07.00

export const fmtRp = (n) => 'Rp ' + Math.round(n).toLocaleString('id-ID');
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
