// Grid A* pathfinding + string pulling
import { CELL, GRID } from './data.js';

export class NavGrid {
  constructor() {
    this.cell = CELL;
    this.w = Math.round((GRID.maxX - GRID.minX) / CELL);
    this.h = Math.round((GRID.maxZ - GRID.minZ) / CELL);
    this.stat = new Uint8Array(this.w * this.h);
    this.dyn = new Uint8Array(this.w * this.h);
  }
  idx(i, j) { return j * this.w + i; }
  toCell(x, z) {
    return [Math.floor((x - GRID.minX) / CELL), Math.floor((z - GRID.minZ) / CELL)];
  }
  center(i, j) { return { x: GRID.minX + (i + 0.5) * CELL, z: GRID.minZ + (j + 0.5) * CELL }; }
  inside(i, j) { return i >= 0 && j >= 0 && i < this.w && j < this.h; }
  ok(i, j) { if (!this.inside(i, j)) return false; const k = this.idx(i, j); return !this.stat[k] && !this.dyn[k]; }
  okXZ(x, z) { const [i, j] = this.toCell(x, z); return this.ok(i, j); }

  // tandai kotak dunia sebagai terhalang
  rect(arr, minX, minZ, maxX, maxZ) {
    const e = 0.001;
    const i0 = Math.max(0, Math.floor((minX - GRID.minX) / CELL + e));
    const i1 = Math.min(this.w - 1, Math.ceil((maxX - GRID.minX) / CELL - e) - 1);
    const j0 = Math.max(0, Math.floor((minZ - GRID.minZ) / CELL + e));
    const j1 = Math.min(this.h - 1, Math.ceil((maxZ - GRID.minZ) / CELL - e) - 1);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) arr[this.idx(i, j)] = 1;
  }
  segment(arr, a, b, thick) {
    const minX = Math.min(a[0], b[0]) - thick, maxX = Math.max(a[0], b[0]) + thick;
    const minZ = Math.min(a[1], b[1]) - thick, maxZ = Math.max(a[1], b[1]) + thick;
    this.rect(arr, minX, minZ, maxX, maxZ);
  }
  clearDyn() { this.dyn.fill(0); }

  nearest(i, j, maxR = 40) {
    if (this.ok(i, j)) return [i, j];
    for (let r = 1; r < maxR; r++) {
      let best = null, bd = 1e9;
      for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        if (this.ok(i + di, j + dj)) { const d = di * di + dj * dj; if (d < bd) { bd = d; best = [i + di, j + dj]; } }
      }
      if (best) return best;
    }
    return null;
  }

  lineClear(ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az;
    const len = Math.hypot(dx, dz);
    const steps = Math.ceil(len / (CELL * 0.35));
    for (let s = 0; s <= steps; s++) {
      const t = steps ? s / steps : 0;
      const x = ax + dx * t, z = az + dz * t;
      // cek sedikit lebar agar tidak menyerempet sudut
      if (!this.okXZ(x, z)) return false;
      if (!this.okXZ(x + 0.09, z) || !this.okXZ(x - 0.09, z) || !this.okXZ(x, z + 0.09) || !this.okXZ(x, z - 0.09)) return false;
    }
    return true;
  }

  find(sx, sz, tx, tz) {
    let s = this.nearest(...this.toCell(sx, sz), 12);
    let t = this.nearest(...this.toCell(tx, tz), 30);
    if (!s || !t) return null;
    const W = this.w, N = this.w * this.h;
    const g = new Float32Array(N).fill(Infinity);
    const came = new Int32Array(N).fill(-1);
    const closed = new Uint8Array(N);
    const heap = []; // [f, k]
    const push = (f, k) => {
      heap.push([f, k]); let c = heap.length - 1;
      while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; }
    };
    const pop = () => {
      const top = heap[0], last = heap.pop();
      if (heap.length) {
        heap[0] = last; let c = 0;
        for (;;) {
          const l = 2 * c + 1, r = l + 1; let m = c;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m;
        }
      }
      return top;
    };
    const hfn = (i, j) => { const dx = Math.abs(i - t[0]), dz = Math.abs(j - t[1]); return (dx + dz) + (Math.SQRT2 - 2) * Math.min(dx, dz); };
    const sk = this.idx(s[0], s[1]), tk = this.idx(t[0], t[1]);
    g[sk] = 0; push(hfn(s[0], s[1]), sk);
    const dirs = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
    let found = false, iter = 0;
    while (heap.length && iter++ < 60000) {
      const [, k] = pop();
      if (closed[k]) continue;
      if (k === tk) { found = true; break; }
      closed[k] = 1;
      const ci = k % W, cj = (k / W) | 0;
      for (const [di, dj, c] of dirs) {
        const ni = ci + di, nj = cj + dj;
        if (!this.ok(ni, nj)) continue;
        if (di && dj && (!this.ok(ci + di, cj) || !this.ok(ci, cj + dj))) continue;
        const nk = this.idx(ni, nj);
        if (closed[nk]) continue;
        const ng = g[k] + c;
        if (ng < g[nk]) { g[nk] = ng; came[nk] = k; push(ng + hfn(ni, nj), nk); }
      }
    }
    if (!found) return null;
    const cells = [];
    for (let k = tk; k !== -1; k = came[k]) cells.push(k);
    cells.reverse();
    const pts = cells.map((k) => this.center(k % W, (k / W) | 0));
    // titik akhir persis di target kalau target bisa dilewati
    if (this.okXZ(tx, tz)) pts[pts.length - 1] = { x: tx, z: tz };
    pts[0] = { x: sx, z: sz };
    return this.smooth(pts);
  }

  smooth(pts) {
    if (pts.length <= 2) return pts.slice(1);
    const out = [];
    let a = 0;
    while (a < pts.length - 1) {
      let b = pts.length - 1;
      while (b > a + 1 && !this.lineClear(pts[a].x, pts[a].z, pts[b].x, pts[b].z)) b--;
      out.push(pts[b]);
      a = b;
    }
    return out;
  }
}
