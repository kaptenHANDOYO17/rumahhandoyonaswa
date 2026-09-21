// ============================================================
//  STUDIO LUKIS NASWA — melukis manual dengan kuas, spidol, cat semprot,
//  ember cat, penghapus, pipet warna, undo/redo; hasil disimpan ke galeri
//  lalu bisa dijual di toko online.
// ============================================================
import { INTER } from './interactions.js';

Object.assign(INTER, {
  paintManual: { label: 'Melukis sendiri (studio manual)…', icon: '🖌️', ui: 'studio',
    check: (c) => (c.sim.species === 'human' ? true : 'Hanya manusia'),
    build: (c) => ({ steps: [{ target: { obj: c.obj.id }, anim: 'paint', prop: 'brushPaint', dur: 720, snd: 'brush', label: 'Melukis di studio', eff: { fun: 0.9 }, onTick: (x, gm) => x.sim.xp('kreatif', gm * 0.35) }] }) },
});
// lukisan otomatis (kalau Naswa melukis sendiri tanpa dikendalikan)
if (INTER.paint) {
  const orig = INTER.paint.build;
  INTER.paint.build = (c) => { const r = orig(c); const st = r.steps[r.steps.length - 1]; const od = st.onDone;
    st.onDone = (x) => { if (od) od(x); if (x.g.hooks.autoPainting && x.sim.species === 'human') { const d = x.g.hooks.autoPainting(); if (d) x.g.addPainting(x.sim, { title: d.title, img: d.img, q: Math.round(20 + x.sim.skillLvl('kreatif') * 6 + Math.random() * 15) }); } };
    return r; };
}

// ============================================================
//  STUDIO LUKIS PRO — 17 alat, 3 lapisan, HSV, palet, simetri, stabilizer,
//  tekstur kanvas, filter akhir, undo/redo, dan galeri (pajang / jual / lelang)
// ============================================================
const PALETTES = {
  'Nusantara': ['#7a2e1f', '#b5462e', '#d9a05b', '#f3d27a', '#2e5a3a', '#1f3a5f', '#6b3a1f', '#f2ead0', '#1b1b1b', '#8a5a32'],
  'Senja': ['#2b1d3f', '#5b2a6e', '#b83b5e', '#f08a4b', '#f6c85f', '#fde2b8', '#3a2a4f', '#ff6f59', '#ffd6a5', '#1b1330'],
  'Laut': ['#03256c', '#1768ac', '#06bee1', '#a0e7e5', '#fdfffc', '#2541b2', '#0b3d91', '#5ad2f4', '#e0fbfc', '#1b262c'],
  'Hutan': ['#1b4332', '#2d6a4f', '#40916c', '#74c69d', '#b7e4c7', '#6b4f2a', '#a3b18a', '#dad7cd', '#344e41', '#081c15'],
  'Pastel': ['#ffd6e0', '#ffef9f', '#c1fba4', '#7bf1a8', '#90f1ef', '#b8c0ff', '#e7c6ff', '#ffc8dd', '#fff1e6', '#cdb4db'],
  'Monokrom': ['#000000', '#1f1f1f', '#3d3d3d', '#5c5c5c', '#7a7a7a', '#999999', '#b8b8b8', '#d6d6d6', '#f0f0f0', '#ffffff'],
  'Van Gogh': ['#0b1d51', '#2c4fa3', '#5b8def', '#f2c14e', '#f78154', '#fff3b0', '#3f7cac', '#1f2d3d', '#e9c46a', '#264653'],
};
const TOOLS = [
  ['round', '🖌️', 'Kuas bulat'], ['oil', '🎨', 'Cat minyak (bulu kuas)'], ['water', '💧', 'Cat air'], ['ink', '🖋️', 'Pena tinta'], ['pencil', '✏️', 'Pensil'],
  ['charcoal', '⬛', 'Arang'], ['marker', '🖍️', 'Spidol'], ['callig', '✒️', 'Kaligrafi'], ['air', '💨', 'Airbrush'], ['glow', '✨', 'Cahaya / neon'],
  ['foliage', '🌿', 'Stempel dedaunan'], ['stars', '⭐', 'Stempel bintang'], ['smudge', '👆', 'Baurkan (smudge)'], ['eraser', '🧽', 'Penghapus'],
  ['fill', '🪣', 'Ember cat'], ['gradient', '🌈', 'Gradasi'], ['line', '📏', 'Garis'], ['rect', '▭', 'Persegi'], ['ellipse', '◯', 'Elips'], ['picker', '💉', 'Pipet warna'],
];
const BGS = { linen: 'Kanvas linen', paper: 'Kertas cat air', plain: 'Putih polos', kraft: 'Kertas kraft', dark: 'Kanvas gelap' };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function hsv2hex(h, s, v) { const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); }; return '#' + [f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join(''); }
function hex2hsv(hex) { const n = parseInt(hex.slice(1), 16); const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(h * 60 + 360) % 360, mx ? d / mx : 0, mx]; }
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
function paintBg(ctx, w, h, kind) {
  const base = { linen: '#f4efe4', paper: '#fbf8f1', plain: '#ffffff', kraft: '#c9a878', dark: '#22252b' }[kind] || '#f4efe4';
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  if (kind === 'plain') return;
  const img = ctx.getImageData(0, 0, w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4; let n = (Math.random() - 0.5) * (kind === 'paper' ? 10 : 14);
    if (kind === 'linen' || kind === 'dark') n += ((x % 4 === 0) ? -6 : 0) + ((y % 4 === 0) ? -6 : 0);
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

export function openStudio(ui, cmd) {
  const g = ui.g; const snd = ui.sound;
  if (cmd) g.cmd({ ...cmd });
  const W = 800, H = 600;
  const st = { tool: 'round', color: '#2c4fa3', size: 18, opacity: 0.9, soft: 0.2, flow: 1, smooth: 0.35, sym: false, grid: false, layer: 1, bg: 'linen', palette: 'Van Gogh', hsv: hex2hsv('#2c4fa3') };
  const wrap = document.createElement('div'); wrap.className = 'studio pro';
  wrap.innerHTML = `<div class="stCard">
    <header><b>🎨 Studio Lukis Pro · ${g.active}</b><input id="stTitle" maxlength="60" placeholder="Judul lukisan…" value="Karya ${new Date().toLocaleDateString('id-ID')}">
      <select id="stBg">${Object.entries(BGS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
      <span id="stInfo" class="muted small"></span>
      <button class="btn ghost sm" data-a="undo" title="Ctrl+Z">↶</button><button class="btn ghost sm" data-a="redo" title="Ctrl+Y">↷</button>
      <button class="btn sm" data-a="save">✅ Selesai & simpan</button><button class="btn ghost sm" data-a="close">✕</button></header>
    <div class="stBody">
      <nav class="stTools">${TOOLS.map(([k, i, t]) => `<button data-t="${k}" title="${t}" class="${k === 'round' ? 'on' : ''}">${i}<small>${t.split(' ')[0]}</small></button>`).join('')}</nav>
      <div class="stStage"><canvas id="stView" width="${W}" height="${H}"></canvas><canvas id="stOver" width="${W}" height="${H}"></canvas></div>
      <aside class="stSide">
        <div class="stColor"><canvas id="stSV" width="180" height="120"></canvas><canvas id="stHue" width="180" height="14"></canvas>
          <div class="row"><i id="stSw"></i><input id="stHex" maxlength="7"></div></div>
        <div class="stPal"><select id="stPalSel">${Object.keys(PALETTES).map((p) => `<option ${p === st.palette ? 'selected' : ''}>${p}</option>`).join('')}</select><div id="stPal"></div><div id="stRecent"></div></div>
        <label>Ukuran <input type="range" id="stSize" min="1" max="140" value="18"><em id="stSizeV">18</em></label>
        <label>Opasitas <input type="range" id="stOp" min="5" max="100" value="90"></label>
        <label>Kelembutan <input type="range" id="stSoft" min="0" max="100" value="20"></label>
        <label>Stabilizer <input type="range" id="stSmooth" min="0" max="90" value="35"></label>
        <div class="row chk"><label><input type="checkbox" id="stSym"> Simetri ↔</label><label><input type="checkbox" id="stGrid"> Garis bantu ⅓</label></div>
        <div class="stLayers"><b>Lapisan</b>${['Latar', 'Utama', 'Detail'].map((n, i) => `<div class="ly ${i === 1 ? 'on' : ''}" data-l="${i}"><button data-vis="${i}">👁️</button><span>${n}</span><input type="range" data-lop="${i}" min="0" max="100" value="100"><button data-clr="${i}" title="Kosongkan">🗑️</button></div>`).join('')}</div>
        <div class="stFx"><b>Sentuhan akhir</b><label><input type="checkbox" id="fxVig" checked> Vinyet</label><label><input type="checkbox" id="fxWarm"> Hangat</label><label><input type="checkbox" id="fxGrain" checked> Tekstur</label><label><input type="checkbox" id="fxVarnish" checked> Pernis (kontras)</label></div>
      </aside>
    </div></div>`;
  document.body.appendChild(wrap); ui.studioOpen = true;
  const view = wrap.querySelector('#stView'), over = wrap.querySelector('#stOver'), vctx = view.getContext('2d'), octx = over.getContext('2d');
  const bgC = document.createElement('canvas'); bgC.width = W; bgC.height = H; paintBg(bgC.getContext('2d'), W, H, st.bg);
  const layers = [0, 1, 2].map(() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return { c, x: c.getContext('2d', { willReadFrequently: true }), vis: true, op: 1 }; });
  const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const tctx = tmp.getContext('2d');
  const undo = [], redo = []; let strokes = 0; const used = new Set(); const brushes = new Set(); const t0 = performance.now();
  const compose = () => {
    vctx.globalAlpha = 1; vctx.globalCompositeOperation = 'source-over'; vctx.drawImage(bgC, 0, 0);
    layers.forEach((L, i) => { if (!L.vis) return; vctx.globalAlpha = L.op; vctx.drawImage(L.c, 0, 0); if (i === st.layer && drawing && st.tool === 'marker') vctx.drawImage(tmp, 0, 0); });
    vctx.globalAlpha = 1;
  };
  const snap = () => { undo.push({ l: st.layer, d: layers[st.layer].x.getImageData(0, 0, W, H) }); if (undo.length > 30) undo.shift(); redo.length = 0; };
  const doUndo = (from, to) => { const s = from.pop(); if (!s) return; to.push({ l: s.l, d: layers[s.l].x.getImageData(0, 0, W, H) }); layers[s.l].x.putImageData(s.d, 0, 0); compose(); snd && snd.play('click'); };
  // ---------- warna ----------
  const sv = wrap.querySelector('#stSV'), hue = wrap.querySelector('#stHue'), svx = sv.getContext('2d'), hx = hue.getContext('2d');
  const drawPicker = () => {
    const [h, s, v] = st.hsv;
    svx.fillStyle = hsv2hex(h, 1, 1); svx.fillRect(0, 0, 180, 120);
    let gr = svx.createLinearGradient(0, 0, 180, 0); gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); svx.fillStyle = gr; svx.fillRect(0, 0, 180, 120);
    gr = svx.createLinearGradient(0, 0, 0, 120); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, '#000'); svx.fillStyle = gr; svx.fillRect(0, 0, 180, 120);
    svx.strokeStyle = v > 0.5 ? '#000' : '#fff'; svx.beginPath(); svx.arc(s * 180, (1 - v) * 120, 6, 0, 7); svx.stroke();
    for (let x = 0; x < 180; x++) { hx.fillStyle = hsv2hex(x * 2, 1, 1); hx.fillRect(x, 0, 1, 14); }
    hx.fillStyle = '#fff'; hx.fillRect(h / 2 - 1, 0, 3, 14);
    wrap.querySelector('#stSw').style.background = st.color; wrap.querySelector('#stHex').value = st.color;
  };
  const setColor = (hex, fromHsv) => { st.color = hex; if (!fromHsv) st.hsv = hex2hsv(hex); drawPicker(); };
  const dragPick = (el, fn) => { let on = false; el.addEventListener('pointerdown', (e) => { on = true; el.setPointerCapture(e.pointerId); fn(e); }); el.addEventListener('pointermove', (e) => on && fn(e)); el.addEventListener('pointerup', () => { on = false; }); };
  dragPick(sv, (e) => { const r = sv.getBoundingClientRect(); st.hsv[1] = clamp((e.clientX - r.left) / r.width, 0, 1); st.hsv[2] = clamp(1 - (e.clientY - r.top) / r.height, 0, 1); setColor(hsv2hex(...st.hsv), true); });
  dragPick(hue, (e) => { const r = hue.getBoundingClientRect(); st.hsv[0] = clamp((e.clientX - r.left) / r.width, 0, 0.999) * 360; setColor(hsv2hex(...st.hsv), true); });
  wrap.querySelector('#stHex').onchange = (e) => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) setColor(e.target.value); };
  const renderPal = () => {
    wrap.querySelector('#stPal').innerHTML = PALETTES[st.palette].map((c) => `<i data-c="${c}" style="background:${c}"></i>`).join('');
    wrap.querySelector('#stRecent').innerHTML = [...used].slice(-10).reverse().map((c) => `<i data-c="${c}" style="background:${c}"></i>`).join('');
  };
  wrap.querySelector('#stPalSel').onchange = (e) => { st.palette = e.target.value; renderPal(); };
  wrap.querySelector('.stPal').onclick = (e) => { const i = e.target.closest('[data-c]'); if (i) setColor(i.dataset.c); };
  // ---------- pengaturan ----------
  const bind = (id, fn) => { wrap.querySelector(id).oninput = (e) => fn(+e.target.value, e.target); };
  bind('#stSize', (v) => { st.size = v; wrap.querySelector('#stSizeV').textContent = v; });
  bind('#stOp', (v) => { st.opacity = v / 100; }); bind('#stSoft', (v) => { st.soft = v / 100; }); bind('#stSmooth', (v) => { st.smooth = v / 100; });
  wrap.querySelector('#stSym').onchange = (e) => { st.sym = e.target.checked; guides(); };
  wrap.querySelector('#stGrid').onchange = (e) => { st.grid = e.target.checked; guides(); };
  wrap.querySelector('#stBg').onchange = (e) => { st.bg = e.target.value; paintBg(bgC.getContext('2d'), W, H, st.bg); compose(); };
  wrap.querySelector('.stTools').onclick = (e) => { const b = e.target.closest('[data-t]'); if (!b) return; st.tool = b.dataset.t; wrap.querySelectorAll('.stTools button').forEach((x) => x.classList.toggle('on', x === b)); snd && snd.play('click'); };
  wrap.querySelector('.stLayers').onclick = (e) => {
    const v = e.target.closest('[data-vis]'); if (v) { const L = layers[+v.dataset.vis]; L.vis = !L.vis; v.textContent = L.vis ? '👁️' : '🚫'; compose(); return; }
    const c = e.target.closest('[data-clr]'); if (c) { st.layer = +c.dataset.clr; snap(); layers[st.layer].x.clearRect(0, 0, W, H); compose(); return; }
    const l = e.target.closest('[data-l]'); if (l && e.target.tagName !== 'INPUT') { st.layer = +l.dataset.l; wrap.querySelectorAll('.ly').forEach((x) => x.classList.toggle('on', x === l)); }
  };
  wrap.querySelector('.stLayers').oninput = (e) => { const o = e.target.dataset.lop; if (o != null) { layers[+o].op = e.target.value / 100; compose(); } };
  const guides = () => { octx.clearRect(0, 0, W, H); octx.strokeStyle = 'rgba(0,150,255,.35)'; octx.setLineDash([6, 6]); if (st.grid) { for (const f of [1 / 3, 2 / 3]) { octx.beginPath(); octx.moveTo(W * f, 0); octx.lineTo(W * f, H); octx.moveTo(0, H * f); octx.lineTo(W, H * f); octx.stroke(); } } if (st.sym) { octx.strokeStyle = 'rgba(255,80,120,.5)'; octx.beginPath(); octx.moveTo(W / 2, 0); octx.lineTo(W / 2, H); octx.stroke(); } octx.setLineDash([]); };
  // ---------- mesin kuas ----------
  const ctx = () => layers[st.layer].x;
  const stamp = (c, x, y, p, dir) => {
    const s = st.size * (0.35 + 0.65 * p), col = st.color, a = st.opacity;
    c.save();
    switch (st.tool) {
      case 'round': { c.globalAlpha = a; c.fillStyle = col; if (st.soft > 0.02) { c.shadowColor = col; c.shadowBlur = s * st.soft; } c.beginPath(); c.arc(x, y, s / 2, 0, 7); c.fill(); break; }
      case 'oil': { const n = Math.max(4, Math.round(s / 3)); const nx = -Math.sin(dir), ny = Math.cos(dir); for (let i = 0; i < n; i++) { const o = (i / (n - 1) - 0.5) * s; const [h, sv2, v] = hex2hsv(col); c.fillStyle = hsv2hex(h, clamp(sv2 + (Math.random() - 0.5) * 0.12, 0, 1), clamp(v + (Math.random() - 0.5) * 0.14, 0, 1)); c.globalAlpha = a * (0.55 + Math.random() * 0.45); c.beginPath(); c.arc(x + nx * o, y + ny * o, 0.9 + s / n * 0.45, 0, 7); c.fill(); } break; }
      case 'water': { c.globalCompositeOperation = 'multiply'; for (let i = 0; i < 3; i++) { const r = s * (0.4 + Math.random() * 0.35); const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(col, a * 0.08)); gr.addColorStop(0.8, rgba(col, a * 0.06)); gr.addColorStop(1, rgba(col, 0)); c.fillStyle = gr; c.beginPath(); c.arc(x + (Math.random() - 0.5) * s * 0.3, y + (Math.random() - 0.5) * s * 0.3, r, 0, 7); c.fill(); } break; }
      case 'ink': { c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.arc(x, y, Math.max(0.6, s * 0.18 * p), 0, 7); c.fill(); break; }
      case 'pencil': { c.globalAlpha = a * 0.55; c.fillStyle = col; for (let i = 0; i < 3; i++) c.fillRect(x + (Math.random() - 0.5) * 2, y + (Math.random() - 0.5) * 2, 1.2, 1.2); break; }
      case 'charcoal': { c.fillStyle = col; for (let i = 0; i < s * 1.4; i++) { c.globalAlpha = a * Math.random() * 0.35; const r = Math.random() * s / 2, t = Math.random() * 7; c.fillRect(x + Math.cos(t) * r, y + Math.sin(t) * r, 1.6, 1.6); } break; }
      case 'marker': { tctx.globalAlpha = 1; tctx.fillStyle = col; tctx.beginPath(); tctx.arc(x, y, s / 2, 0, 7); tctx.fill(); break; }
      case 'callig': { c.globalAlpha = a; c.fillStyle = col; c.translate(x, y); c.rotate(-0.6); c.fillRect(-s / 2, -Math.max(1, s * 0.09), s, Math.max(2, s * 0.18)); break; }
      case 'air': { const gr = c.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, rgba(col, a * 0.12)); gr.addColorStop(1, rgba(col, 0)); c.fillStyle = gr; c.fillRect(x - s, y - s, s * 2, s * 2); break; }
      case 'glow': { c.globalCompositeOperation = 'lighter'; const gr = c.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, rgba('#ffffff', a * 0.35)); gr.addColorStop(0.25, rgba(col, a * 0.25)); gr.addColorStop(1, rgba(col, 0)); c.fillStyle = gr; c.fillRect(x - s, y - s, s * 2, s * 2); break; }
      case 'foliage': { for (let i = 0; i < 3; i++) { const [h, s2, v] = hex2hsv(col); c.fillStyle = hsv2hex((h + (Math.random() - 0.5) * 18 + 360) % 360, s2, clamp(v + (Math.random() - 0.5) * 0.3, 0, 1)); c.globalAlpha = a * 0.8; c.save(); c.translate(x + (Math.random() - 0.5) * s, y + (Math.random() - 0.5) * s); c.rotate(Math.random() * 7); c.beginPath(); c.ellipse(0, 0, s * 0.18, s * 0.07, 0, 0, 7); c.fill(); c.restore(); } break; }
      case 'stars': { if (Math.random() < 0.35) { const r = 0.6 + Math.random() * s * 0.08; c.globalAlpha = a; c.fillStyle = Math.random() < 0.8 ? '#ffffff' : col; c.shadowColor = '#fff'; c.shadowBlur = r * 4; c.beginPath(); c.arc(x + (Math.random() - 0.5) * s * 2, y + (Math.random() - 0.5) * s * 2, r, 0, 7); c.fill(); } break; }
      case 'eraser': { c.globalCompositeOperation = 'destination-out'; const gr = c.createRadialGradient(x, y, 0, x, y, s / 2); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(clamp(1 - st.soft, 0.05, 1), `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.beginPath(); c.arc(x, y, s / 2, 0, 7); c.fill(); break; }
      case 'smudge': { if (smudgeBuf) { c.globalAlpha = 0.5 * a; c.drawImage(smudgeBuf, x - s / 2, y - s / 2); } smudgeBuf = document.createElement('canvas'); smudgeBuf.width = smudgeBuf.height = Math.max(2, Math.round(s)); smudgeBuf.getContext('2d').drawImage(layers[st.layer].c, x - s / 2, y - s / 2, s, s, 0, 0, s, s); break; }
    }
    c.restore();
  };
  let smudgeBuf = null;
  const stampSym = (x, y, p, dir) => { stamp(ctx(), x, y, p, dir); if (st.sym) stamp(ctx(), W - x, y, p, Math.PI - dir); };
  // ---------- ember cat ----------
  const flood = (x0, y0) => {
    const c = ctx(); const img = c.getImageData(0, 0, W, H), d = img.data; const comp = document.createElement('canvas'); comp.width = W; comp.height = H; const cx = comp.getContext('2d'); cx.drawImage(bgC, 0, 0); layers.forEach((L) => L.vis && cx.drawImage(L.c, 0, 0));
    const ref = cx.getImageData(0, 0, W, H).data; const i0 = (y0 * W + x0) * 4; const tr = ref[i0], tg = ref[i0 + 1], tb = ref[i0 + 2];
    const n = parseInt(st.color.slice(1), 16), R = n >> 16 & 255, G2 = n >> 8 & 255, B2 = n & 255, A = Math.round(st.opacity * 255); const seen = new Uint8Array(W * H); const q = [x0 + y0 * W]; const tol = 48;
    while (q.length) { const p = q.pop(); if (seen[p]) continue; seen[p] = 1; const i = p * 4; if (Math.abs(ref[i] - tr) + Math.abs(ref[i + 1] - tg) + Math.abs(ref[i + 2] - tb) > tol) continue; d[i] = R; d[i + 1] = G2; d[i + 2] = B2; d[i + 3] = Math.max(d[i + 3], A); const x = p % W; if (x > 0) q.push(p - 1); if (x < W - 1) q.push(p + 1); if (p >= W) q.push(p - W); if (p < W * (H - 1)) q.push(p + W); }
    c.putImageData(img, 0, 0);
  };
  // ---------- input pena ----------
  let drawing = false, last = null, lazy = null, start = null;
  const pos = (e) => { const r = view.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height, p: e.pressure && e.pointerType === 'pen' ? clamp(e.pressure * 1.4, 0.15, 1) : 1 }; };
  const shape = (a, b, final) => {
    const c = final ? ctx() : octx; if (!final) guides();
    c.save(); c.globalAlpha = st.opacity; c.strokeStyle = st.color; c.fillStyle = st.color; c.lineWidth = Math.max(1, st.size / 4); c.lineCap = 'round';
    if (st.tool === 'line') { c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
    if (st.tool === 'rect') { c.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y); }
    if (st.tool === 'ellipse') { c.beginPath(); c.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, 7); c.stroke(); }
    if (st.tool === 'gradient') { const gr = c.createLinearGradient(a.x, a.y, b.x, b.y); gr.addColorStop(0, rgba(st.color, st.opacity)); gr.addColorStop(1, rgba(st.color, 0)); c.fillStyle = gr; c.globalAlpha = 1; c.fillRect(0, 0, W, H); }
    c.restore();
  };
  view.addEventListener('pointerdown', (e) => {
    e.preventDefault(); view.setPointerCapture(e.pointerId); const p = pos(e);
    if (st.tool === 'picker') { compose(); const d = vctx.getImageData(p.x | 0, p.y | 0, 1, 1).data; setColor('#' + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join('')); return; }
    snap(); used.add(st.color); brushes.add(st.tool); strokes++;
    if (st.tool === 'fill') { flood(p.x | 0, p.y | 0); compose(); renderPal(); snd && snd.shot && snd.shot('splash', 0.4); return; }
    drawing = true; last = p; lazy = { ...p }; start = p; smudgeBuf = null; tctx.clearRect(0, 0, W, H);
    if (!['line', 'rect', 'ellipse', 'gradient'].includes(st.tool)) stampSym(p.x, p.y, p.p, 0);
    compose();
  });
  view.addEventListener('pointermove', (e) => {
    if (!drawing) return; const p = pos(e);
    if (['line', 'rect', 'ellipse', 'gradient'].includes(st.tool)) { shape(start, p, false); return; }
    const k = 1 - st.smooth * 0.9; lazy.x += (p.x - lazy.x) * k; lazy.y += (p.y - lazy.y) * k; lazy.p = p.p;
    const dx = lazy.x - last.x, dy = lazy.y - last.y, dist = Math.hypot(dx, dy); const dir = Math.atan2(dy, dx);
    const step = Math.max(0.8, st.size * (st.tool === 'pencil' || st.tool === 'ink' ? 0.08 : 0.18));
    for (let t = step; t <= dist; t += step) { const x = last.x + dx * t / dist, y = last.y + dy * t / dist; const vp = st.tool === 'ink' ? clamp(1.4 - dist / 40, 0.3, 1.2) * lazy.p : lazy.p; stampSym(x, y, vp, dir); }
    if (dist >= step) last = { ...lazy };
    compose(); if (snd && snd.shot && Math.random() < 0.08) snd.shot(st.tool === 'air' || st.tool === 'glow' ? 'swish' : 'brush', 0.35);
  });
  const up = (e) => {
    if (!drawing) return; drawing = false; const p = pos(e);
    if (['line', 'rect', 'ellipse', 'gradient'].includes(st.tool)) { shape(start, p, true); guides(); }
    if (st.tool === 'marker') { const c = ctx(); c.save(); c.globalAlpha = st.opacity * 0.7; c.drawImage(tmp, 0, 0); if (st.sym) { c.translate(W, 0); c.scale(-1, 1); c.drawImage(tmp, 0, 0); } c.restore(); tctx.clearRect(0, 0, W, H); }
    compose(); renderPal(); info();
  };
  view.addEventListener('pointerup', up); view.addEventListener('pointercancel', up);
  const info = () => { wrap.querySelector('#stInfo').textContent = `${strokes} goresan · ${used.size} warna · ${brushes.size} alat · ${Math.round((performance.now() - t0) / 1000)} dtk`; };
  const key = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); doUndo(undo, redo); } if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); doUndo(redo, undo); } if (e.key === '[') { st.size = Math.max(1, st.size - 3); wrap.querySelector('#stSize').value = st.size; } if (e.key === ']') { st.size = Math.min(140, st.size + 3); wrap.querySelector('#stSize').value = st.size; } };
  window.addEventListener('keydown', key);
  const close = () => { window.removeEventListener('keydown', key); wrap.remove(); ui.studioOpen = false; };
  wrap.querySelector('[data-a="undo"]').onclick = () => doUndo(undo, redo);
  wrap.querySelector('[data-a="redo"]').onclick = () => doUndo(redo, undo);
  wrap.querySelector('[data-a="close"]').onclick = () => { if (strokes > 3 && !confirm('Buang lukisan ini?')) return; g.cmd({ c: 'stopPaint' }); close(); };
  wrap.querySelector('[data-a="save"]').onclick = () => {
    if (strokes < 3) { ui.toast('Lukis dulu minimal beberapa goresan 🙂', 'bad'); return; }
    compose();
    const out = document.createElement('canvas'); out.width = 512; out.height = 384; const o = out.getContext('2d');
    o.filter = wrap.querySelector('#fxVarnish').checked ? 'contrast(1.08) saturate(1.1)' : 'none'; o.drawImage(view, 0, 0, 512, 384); o.filter = 'none';
    if (wrap.querySelector('#fxWarm').checked) { o.globalCompositeOperation = 'soft-light'; o.fillStyle = 'rgba(255,170,90,.35)'; o.fillRect(0, 0, 512, 384); o.globalCompositeOperation = 'source-over'; }
    if (wrap.querySelector('#fxGrain').checked) { const im = o.getImageData(0, 0, 512, 384), d = im.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 12; d[i] += n; d[i + 1] += n; d[i + 2] += n; } o.putImageData(im, 0, 0); }
    if (wrap.querySelector('#fxVig').checked) { const gr = o.createRadialGradient(256, 192, 120, 256, 192, 330); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.35)'); o.fillStyle = gr; o.fillRect(0, 0, 512, 384); }
    const img = out.toDataURL('image/jpeg', 0.82);
    // cakupan cat
    let cov = 0, n = 0; for (const L of layers) { const d = L.x.getImageData(0, 0, W, H).data; for (let i = 3; i < d.length; i += 4 * 97) { n++; if (d[i] > 20) cov++; } }
    const stats = { strokes, colors: used.size, secs: (performance.now() - t0) / 1000, coverage: Math.min(1, cov / (n / 3 || 1)), brushes: brushes.size, layers: layers.filter((L) => L.x.getImageData(W / 2 | 0, H / 2 | 0, 1, 1).data[3] > 0 || true).length };
    const bonus = Math.min(12, brushes.size * 1.5) + (stats.coverage > 0.6 ? 4 : 0);
    stats.strokes += bonus * 7;                     // variasi alat & cakupan menaikkan nilai kualitas
    g.cmd({ c: 'painting', title: wrap.querySelector('#stTitle').value || 'Tanpa Judul', img, stats });
    snd && snd.play('fanfare'); close();
    setTimeout(() => openGallery(ui), 400);
  };
  compose(); drawPicker(); renderPal(); guides(); info();
}

// ---------- GALERI: pajang di easel/pigura/dinding, jual, lelang, unduh ----------
export function openGallery(ui) {
  const g = ui.g, hh = g.hh; const gal = hh.gallery || []; const fmt = (n) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
  const frames = hh.world.objects.filter((o) => ['artFrame', 'wallFrame', 'wallFrameS'].includes(o.type));
  const now = hh.world.time;
  const card = (p) => {
    const A = p.auction; const st = p.status === 'sold' ? `✅ Terjual ke ${p.soldTo || '-'} · ${fmt(p.soldFor)}` : p.status === 'auction' ? `🔨 Lelang: ${A.bid ? fmt(A.bid) + ' oleh ' + A.bidder : 'belum ada bid (buka ' + fmt(A.start) + ')'} · sisa ${Math.max(0, Math.ceil((A.ends - now) / 60))} jam` : p.status === 'listed' ? `🛍️ Dijual ${fmt(p.price)}` : '🖼️ Di studio';
    return `<div class="gcard" data-id="${p.id}"><img src="${p.img}" alt=""><div><b>${p.title.replace(/</g, '')}</b><small>${p.by} · kualitas ${p.q}/100 · taksiran ${fmt(p.fair || p.price)}</small><em>${st}</em>
      ${p.status !== 'sold' ? `<div class="gact">
        <select data-hang><option value="">🖼️ Pajang di…</option>${frames.map((f) => `<option value="${f.id}">${f.type === 'artFrame' ? 'Pigura berdiri' : 'Pigura dinding'} #${f.id}${f.s && f.s.pid === p.id ? ' ✓' : ''}</option>`).join('')}</select>
        ${p.status === 'studio' ? `<button class="btn sm" data-sell>🛍️ Jual</button><button class="btn sm" data-auc>🔨 Lelang</button>` : ''}
        ${p.status === 'listed' ? '<button class="btn ghost sm" data-unlist>Tarik</button>' : ''}
        ${p.status === 'auction' && A.bid ? '<button class="btn sm" data-aend>Ketuk palu sekarang</button>' : ''}
      </div>` : ''}<a class="lnk" download="${p.title}.jpg" href="${p.img}">⬇️ Unduh</a></div></div>`;
  };
  const m = ui.modal(`<h2>🖼️ Galeri Lukisan</h2><p class="muted small">Pajang karya di pigura berdiri atau pigura dinding (beli di Mode Beli → Studio Seni/Dekor). Jual dengan harga pas atau lelang untuk kolektor — harga bisa naik jauh di atas taksiran!</p>
    <div class="glist">${gal.length ? gal.map(card).join('') : '<p class="muted">Belum ada lukisan. Klik easel → "Melukis sendiri".</p>'}</div>
    ${frames.length ? '' : '<p class="muted small">💡 Belum ada pigura. Beli "Pigura Lukisan Berdiri" atau "Pigura Dinding" di Mode Beli.</p>'}
    <div class="mbtns row"><button class="btn ghost" data-close>Tutup</button></div>`, 'wide');
  m.querySelector('.glist').onchange = (e) => { const s = e.target.closest('[data-hang]'); if (!s || !s.value) return; const id = +s.closest('[data-id]').dataset.id; g.cmd({ c: 'art', op: 'hang', id, obj: +s.value }); ui.toast('Lukisan dipajang 🖼️', 'good'); setTimeout(() => openGallery(ui), 300); };
  m.querySelector('.glist').onclick = (e) => {
    const c = e.target.closest('[data-id]'); if (!c) return; const id = +c.dataset.id; const p = gal.find((x) => x.id === id); if (!p) return;
    if (e.target.closest('[data-sell]')) { const v = prompt('Harga jual (Rp):', Math.round(p.fair || p.price)); if (v) g.cmd({ c: 'art', op: 'list', id, price: +String(v).replace(/\D/g, '') }); }
    if (e.target.closest('[data-auc]')) { const v = prompt('Harga buka lelang (Rp):', Math.round((p.fair || p.price) * 0.6)); if (!v) return; const h = prompt('Durasi lelang (jam game): 6 / 12 / 24', '12'); g.cmd({ c: 'art', op: 'auction', id, start: +String(v).replace(/\D/g, ''), hours: clamp(+h || 12, 3, 48) }); }
    if (e.target.closest('[data-unlist]')) g.cmd({ c: 'art', op: 'unlist', id });
    if (e.target.closest('[data-aend]')) g.cmd({ c: 'art', op: 'auctionEnd', id });
    if (e.target.closest('button')) setTimeout(() => openGallery(ui), 300);
  };
}

// lukisan otomatis saat karakter melukis sendiri (tanpa dikendalikan)
export function proceduralPainting() {
  try {
    const c = document.createElement('canvas'); c.width = 512; c.height = 384; const x = c.getContext('2d');
    const pals = Object.values(PALETTES); const P = pals[Math.floor(Math.random() * pals.length)];
    const sky = x.createLinearGradient(0, 0, 0, 260); sky.addColorStop(0, P[0]); sky.addColorStop(1, P[3]); x.fillStyle = sky; x.fillRect(0, 0, 512, 384);
    x.fillStyle = P[4]; x.globalAlpha = 0.9; x.beginPath(); x.arc(120 + Math.random() * 280, 90 + Math.random() * 60, 26 + Math.random() * 20, 0, 7); x.fill();
    for (let l = 0; l < 3; l++) { x.fillStyle = P[(5 + l) % P.length]; x.globalAlpha = 0.85; x.beginPath(); x.moveTo(0, 384); let y = 200 + l * 50; for (let i = 0; i <= 512; i += 16) { y += (Math.random() - 0.5) * 24; x.lineTo(i, y); } x.lineTo(512, 384); x.fill(); }
    for (let i = 0; i < 900; i++) { x.globalAlpha = 0.15; x.fillStyle = P[Math.floor(Math.random() * P.length)]; x.fillRect(Math.random() * 512, Math.random() * 384, 3, 1.5); }
    const t = ['Senja di Semarang', 'Bukit Menoreh', 'Pantai Marina', 'Kebun Teh Medini', 'Sawah Ambarawa', 'Langit Lawang Sewu', 'Abstrak Rindu', 'Hujan Bulan Juni'];
    return { title: `${t[Math.floor(Math.random() * t.length)]} (sketsa cepat)`, img: c.toDataURL('image/jpeg', 0.8) };
  } catch (e) { return null; }
}
