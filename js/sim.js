// Model karakter 3D prosedural + animasi pose
import * as THREE from 'three';

const PI = Math.PI;
const G = {
  cyl: (rt, rb, h, s = 10) => new THREE.CylinderGeometry(rt, rb, h, s),
};
function std(color, rough = 0.8, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, ...extra });
}
function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}

export class SimModel {
  constructor(name, outfit) {
    this.name = name;
    this.root = new THREE.Group();
    this.root.userData.simName = name;
    this.body = new THREE.Group();
    this.root.add(this.body);
    this.cur = null;
    this.t = 0;
    this.build(outfit);
    // lingkaran penanda pilihan
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.38, 0.47, 40), new THREE.MeshBasicMaterial({ color: name === 'Handoyo' ? 0x4d8cf0 : 0xf06a8e, transparent: true, opacity: 0.9, depthWrite: false }));
    ring.rotation.x = -PI / 2; ring.position.y = 0.03; ring.visible = false;
    this.ring = ring; this.root.add(ring);
    // bayangan kontak lembut
    const blob = new THREE.Mesh(new THREE.CircleGeometry(0.32, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false }));
    blob.rotation.x = -PI / 2; blob.position.y = 0.025; this.blob = blob; this.root.add(blob);
  }

  build(o) {
    this.outfit = { ...o };
    if (this.parts) this.body.remove(this.parts);
    const P = new THREE.Group(); this.parts = P; this.body.add(P);
    const skin = std(o.skin, 0.65), shirt = std(o.shirt, 0.85), pants = std(o.pants, 0.9);
    const hairM = std(o.hair, 0.55), shoe = std('#2a2522', 0.6), white = std('#ffffff', 0.3), dark = std('#1a1412', 0.3);
    const lip = std(o.dress ? '#b5555c' : '#8a5a4a', 0.6);
    const H = o.height || 1;
    P.scale.setScalar(H);

    const pelvis = new THREE.Group(); pelvis.position.y = 0.9; P.add(pelvis); this.pelvis = pelvis;
    pelvis.add(mesh(new THREE.SphereGeometry(0.16, 14, 10), pants, 0, 0, 0)).scale.set(1.05, 0.7, 0.8);

    const legs = [];
    for (const side of [-1, 1]) {
      const thigh = new THREE.Group(); thigh.position.set(side * 0.095, -0.02, 0); pelvis.add(thigh);
      thigh.add(mesh(G.cyl(0.078, 0.064, 0.45), o.dress ? std(o.pants, 0.9) : pants, 0, -0.225, 0));
      const knee = new THREE.Group(); knee.position.y = -0.45; thigh.add(knee);
      knee.add(mesh(G.cyl(0.062, 0.05, 0.42), o.dress ? skin : pants, 0, -0.21, 0));
      const foot = mesh(new THREE.BoxGeometry(0.1, 0.07, 0.24), shoe, 0, -0.44, 0.05); knee.add(foot);
      legs.push({ thigh, knee });
    }
    this.legs = legs;

    const spine = new THREE.Group(); pelvis.add(spine); this.spine = spine;
    const torso = mesh(new THREE.CapsuleGeometry(0.155, 0.28, 6, 14), shirt, 0, 0.27, 0);
    torso.scale.set(1.12, 1, 0.72); spine.add(torso);
    if (o.dress) {
      const skirt = mesh(new THREE.CylinderGeometry(0.17, 0.31, 0.55, 18, 1, true), std(o.shirt, 0.85, { side: THREE.DoubleSide }), 0, -0.2, 0);
      skirt.scale.z = 0.85; pelvis.add(skirt); this.skirt = skirt;
    } else this.skirt = null;
    // kerah / leher
    spine.add(mesh(G.cyl(0.05, 0.055, 0.1), skin, 0, 0.6, 0));

    const arms = [];
    for (const side of [-1, 1]) {
      const sh = new THREE.Group(); sh.position.set(side * 0.215, 0.5, 0); spine.add(sh);
      sh.add(mesh(new THREE.SphereGeometry(0.065, 10, 8), shirt, 0, 0, 0));
      sh.add(mesh(G.cyl(0.058, 0.05, 0.3), shirt, 0, -0.15, 0));
      const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
      el.add(mesh(G.cyl(0.045, 0.038, 0.27), skin, 0, -0.135, 0));
      const hand = new THREE.Group(); hand.position.y = -0.29; el.add(hand);
      hand.add(mesh(new THREE.SphereGeometry(0.048, 10, 8), skin));
      arms.push({ sh, el, hand });
    }
    this.arms = arms;

    const neck = new THREE.Group(); neck.position.y = 0.64; spine.add(neck); this.neck = neck;
    const head = new THREE.Group(); head.position.y = 0.13; neck.add(head); this.head = head;
    const skull = mesh(new THREE.SphereGeometry(0.118, 20, 16), skin); skull.scale.set(0.95, 1.08, 1); head.add(skull);
    // telinga
    for (const s of [-1, 1]) head.add(mesh(new THREE.SphereGeometry(0.028, 8, 6), skin, s * 0.112, 0, 0)).scale.set(0.5, 1, 0.8);
    // wajah
    for (const s of [-1, 1]) {
      head.add(mesh(new THREE.SphereGeometry(0.022, 10, 8), white, s * 0.043, 0.012, 0.1)).scale.set(1, 0.8, 0.5);
      head.add(mesh(new THREE.SphereGeometry(0.012, 8, 6), dark, s * 0.043, 0.012, 0.112));
      head.add(mesh(new THREE.BoxGeometry(0.045, 0.009, 0.01), hairM, s * 0.045, 0.048, 0.106)).rotation.z = s * -0.12;
    }
    head.add(mesh(new THREE.SphereGeometry(0.016, 8, 6), skin, 0, -0.018, 0.118));
    const mouth = mesh(new THREE.BoxGeometry(0.045, 0.01, 0.01), lip, 0, -0.058, 0.106); head.add(mouth); this.mouth = mouth;
    if (o.dress) for (const s of [-1, 1]) head.add(mesh(new THREE.CircleGeometry(0.02, 12), new THREE.MeshBasicMaterial({ color: 0xe88a8a, transparent: true, opacity: 0.35 }), s * 0.07, -0.03, 0.098));

    // rambut
    const hs = o.hairStyle;
    if (hs === 'hijab') {
      const hijab = std(o.shirt === '#e8e4d8' ? '#c9b99a' : '#e8e4d8', 0.9);
      const cap = mesh(new THREE.SphereGeometry(0.135, 20, 16, 0, PI * 2, 0, PI * 0.62), hijab, 0, 0.005, -0.005); cap.scale.set(1, 1.1, 1.05); head.add(cap);
      const drape = mesh(new THREE.CylinderGeometry(0.13, 0.25, 0.3, 20, 1, true, PI * 0.25, PI * 1.5), std(hijab.color, 0.9, { side: THREE.DoubleSide }), 0, -0.17, -0.01);
      drape.rotation.y = PI; head.add(drape);
      head.add(mesh(new THREE.TorusGeometry(0.105, 0.02, 8, 24, PI), hijab, 0, -0.01, 0.02)).rotation.set(0, 0, PI);
    } else {
      const cap = mesh(new THREE.SphereGeometry(0.126, 20, 16, 0, PI * 2, 0, PI * 0.5), hairM, 0, 0.012, -0.008); cap.scale.set(1, 1.05, 1.06); head.add(cap);
      if (hs === 'short' || hs === 'curly') {
        const fr = mesh(new THREE.BoxGeometry(0.2, 0.05, 0.06), hairM, 0, 0.08, 0.075); fr.rotation.x = -0.3; head.add(fr);
        for (const s of [-1, 1]) head.add(mesh(new THREE.BoxGeometry(0.03, 0.08, 0.1), hairM, s * 0.112, 0.03, -0.02));
        head.add(mesh(new THREE.SphereGeometry(0.12, 14, 10), hairM, 0, 0.02, -0.035)).scale.set(0.98, 0.85, 0.9);
        if (hs === 'curly') for (let i = 0; i < 14; i++) {
          const a = (i / 14) * PI * 2; head.add(mesh(new THREE.SphereGeometry(0.035, 8, 6), hairM, Math.cos(a) * 0.1, 0.09 + Math.sin(i) * 0.02, Math.sin(a) * 0.1 - 0.01));
        }
      } else {
        const back = mesh(new THREE.BoxGeometry(0.25, hs === 'bun' ? 0.14 : 0.36, 0.08), hairM, 0, hs === 'bun' ? -0.01 : -0.11, -0.085);
        head.add(back);
        const fringe = mesh(new THREE.SphereGeometry(0.12, 16, 10, PI * 0.1, PI * 0.8, 0, PI * 0.35), hairM, 0, 0.02, 0.012); fringe.rotation.x = 0.15; head.add(fringe);
        if (hs === 'long') for (const s of [-1, 1]) head.add(mesh(new THREE.BoxGeometry(0.05, 0.3, 0.1), hairM, s * 0.11, -0.09, -0.01));
        if (hs === 'bun') head.add(mesh(new THREE.SphereGeometry(0.07, 12, 10), hairM, 0, 0.1, -0.12));
      }
    }
    this.propAnchor = arms[1].hand;
    this.prop = null; this.propName = null;
  }

  setOutfit(o) { const prop = this.propName; this.build(o); this.propName = null; this.setProp(prop); }

  setProp(name) {
    if (name === this.propName) return;
    if (this.prop) { this.prop.parent.remove(this.prop); this.prop = null; }
    this.propName = name;
    if (!name) return;
    const g = new THREE.Group();
    const m = (geo, c, x = 0, y = 0, z = 0) => { const k = mesh(geo, std(c, 0.5), x, y, z); g.add(k); return k; };
    let parent = this.propAnchor;
    switch (name) {
      case 'plate': m(G.cyl(0.11, 0.09, 0.02, 16), '#f4f1ea', 0, -0.03, 0.05); m(new THREE.SphereGeometry(0.06, 10, 6, 0, PI * 2, 0, PI / 2), '#e8b04a', 0, -0.02, 0.05); break;
      case 'pan': m(G.cyl(0.12, 0.1, 0.05, 16), '#2e2e30', 0, -0.05, 0.14); m(new THREE.BoxGeometry(0.03, 0.03, 0.16), '#4a3325', 0, -0.03, 0.0); break;
      case 'book': m(new THREE.BoxGeometry(0.16, 0.22, 0.03), '#7a3f2c', 0, -0.05, 0.06).rotation.x = -0.6; break;
      case 'bag': m(new THREE.SphereGeometry(0.16, 10, 8), '#222428', 0, -0.2, 0.02).scale.set(1, 1.2, 1); break;
      case 'sponge': m(new THREE.BoxGeometry(0.08, 0.04, 0.12), '#f2d34b', 0, -0.05, 0.03); break;
      case 'can': m(G.cyl(0.07, 0.08, 0.16, 12), '#3e9a6e', 0, -0.08, 0.08); m(G.cyl(0.015, 0.015, 0.18, 6), '#3e9a6e', 0, -0.05, 0.2).rotation.x = 1.1; break;
      case 'phone': m(new THREE.BoxGeometry(0.07, 0.14, 0.012), '#15171c', 0, -0.03, 0.03); break;
      case 'mop': m(G.cyl(0.012, 0.012, 1.2, 6), '#9a7a55', 0, -0.3, 0.1); m(new THREE.BoxGeometry(0.3, 0.05, 0.1), '#ececec', 0, -0.9, 0.1); break;
      case 'basket': m(new THREE.BoxGeometry(0.4, 0.22, 0.3), '#c9a46a', 0.2, -0.1, 0.12); break;
      case 'brush': m(new THREE.BoxGeometry(0.02, 0.02, 0.16), '#58b0e0', 0, -0.03, 0.06); break;
      case 'controller': m(new THREE.BoxGeometry(0.14, 0.04, 0.08), '#1e2128', 0, -0.04, 0.05); break;
      case 'brushPaint': m(G.cyl(0.008, 0.008, 0.22, 6), '#c9a46a', 0, -0.06, 0.06).rotation.x = 1.2; break;
      case 'mower': {
        parent = this.root;
        m(new THREE.BoxGeometry(0.5, 0.25, 0.6), '#c23b2f', 0, 0.2, 1.0);
        for (const s of [-1, 1]) m(G.cyl(0.02, 0.02, 0.8, 6), '#333', s * 0.2, 0.55, 0.62).rotation.x = 0.8;
        break;
      }
    }
    parent.add(g); this.prop = g;
  }

  // ----- animasi -----
  target(anim, t, moving) {
    const T = {
      pelvisY: 0.9, bodyX: 0, bodyZ: 0, bodyY: 0, spineX: 0, spineZ: 0, headX: 0, headY: 0,
      th: [0, 0], kn: [0, 0], shX: [0.05, 0.05], shZ: [0.12, -0.12], el: [-0.12, -0.12],
    };
    const s = Math.sin, c = Math.cos;
    const sit = () => { T.pelvisY = this.seatH || 0.46; T.th = [-PI / 2, -PI / 2]; T.kn = [PI / 2, PI / 2]; T.shX = [-0.3, -0.3]; T.el = [-0.6, -0.6]; };
    const armsFwd = (a = -0.95, e = -0.8, w = 0.12, f = 10) => { T.shX = [a + s(t * f) * w, a - s(t * f) * w]; T.el = [e, e]; T.shZ = [0.15, -0.15]; };
    switch (anim) {
      case 'walk': case 'push': case 'carry': case 'jog': {
        const f = anim === 'jog' ? 11 : 8.2; const p = t * f;
        T.th = [-s(p) * 0.5, s(p) * 0.5];
        T.kn = [Math.max(0, s(p + 1.4)) * 0.85, Math.max(0, -s(p + 1.4)) * 0.85];
        T.shX = [s(p) * 0.45, -s(p) * 0.45]; T.el = [-0.35, -0.35];
        T.pelvisY = 0.9 + Math.abs(c(p)) * 0.025;
        if (anim === 'push') { T.shX = [-0.95, -0.95]; T.el = [-0.3, -0.3]; T.spineX = 0.15; }
        if (anim === 'carry') { T.shX[1] = -0.25; T.el[1] = -0.2; T.shZ[1] = -0.2; }
        if (anim === 'jog') { T.el = [-1.4, -1.4]; T.spineX = 0.12; }
        break;
      }
      case 'exercise': {
        const p = t * 11; T.th = [-s(p) * 0.55, s(p) * 0.55]; T.kn = [Math.max(0, s(p + 1.4)) * 1.0, Math.max(0, -s(p + 1.4)) * 1.0];
        T.shX = [s(p) * 0.6, -s(p) * 0.6]; T.el = [-1.5, -1.5]; T.spineX = 0.1; T.pelvisY = 0.9 + Math.abs(c(p)) * 0.04; break;
      }
      case 'sit': sit(); T.shX = [-0.35, -0.35]; T.el = [-0.9, -0.9]; T.shZ = [0.25, -0.25]; T.headX = s(t * 0.4) * 0.05; break;
      case 'sitWatch': sit(); T.shX = [-0.25, -0.25]; T.el = [-0.7, -0.7]; T.spineX = -0.12; T.headX = -0.08; break;
      case 'sitType': sit(); armsFwd(-0.85, -1.0, 0.05, 22); T.headX = 0.08; break;
      case 'sitGame': sit(); armsFwd(-0.7, -1.3, 0.04, 16); T.headX = -0.05; break;
      case 'sitRead': sit(); T.shX = [-0.7, -0.7]; T.el = [-1.5, -1.5]; T.shZ = [0.35, -0.35]; T.headX = 0.3; break;
      case 'eat': sit(); { const k = (s(t * 2.4) + 1) / 2; T.shX = [-0.5, -0.5 - k * 0.5]; T.el = [-0.9, -0.9 - k * 1.1]; T.headX = 0.12 - k * 0.1; } break;
      case 'toilet': sit(); T.shX = [-0.2, -0.6]; T.el = [-0.6, -1.4]; T.headX = 0.2; break;
      case 'lie': case 'passout': case 'nap':
        T.bodyX = -PI / 2; T.bodyZ = 0.9; T.shZ = [0.08, -0.08]; T.shX = [0, 0]; T.el = [-0.1, -0.1];
        T.headY = anim === 'passout' ? 0.5 : s(t * 0.3) * 0.08; break;
      case 'cook': armsFwd(-0.9, -0.9, 0.18, 7); T.headX = 0.25; break;
      case 'wash': armsFwd(-0.7, -0.9, 0.15, 12); T.spineX = 0.18; T.headX = 0.3; break;
      case 'grab': { const k = (s(t * 3) + 1) / 2; T.shX = [0, -0.4 - k * 0.9]; T.el = [-0.1, -0.3]; T.headX = 0.1; break; }
      case 'bend': armsFwd(-1.0, -0.4, 0.3, 6); T.spineX = 0.6; T.headX = 0.2; T.th = [-0.25, -0.25]; T.kn = [0.35, 0.35]; T.pelvisY = 0.86; break;
      case 'mop': { const k = s(t * 3); T.shX = [-0.7 + k * 0.25, -0.9 + k * 0.25]; T.el = [-0.9, -0.5]; T.spineX = 0.25; T.headX = 0.2; break; }
      case 'water': T.shX = [0.05, -1.05]; T.el = [-0.12, -0.15]; T.spineX = 0.12; T.headX = 0.35; break;
      case 'read': T.shX = [-0.6, -0.6]; T.el = [-1.4, -1.4]; T.shZ = [0.3, -0.3]; T.headX = 0.35; break;
      case 'talk': { T.shX = [-0.3 + s(t * 3) * 0.25, -0.5 + s(t * 2.3 + 1) * 0.35]; T.el = [-1.0, -1.1]; T.headX = s(t * 2.5) * 0.08; T.headY = s(t * 0.9) * 0.15; break; }
      case 'listen': T.shX = [-0.2, -0.2]; T.el = [-0.5, -0.5]; T.headX = s(t * 3) * 0.1; T.headY = 0.08; break;
      case 'laugh': T.spineX = -0.2 + s(t * 14) * 0.05; T.shX = [-0.5, -0.5]; T.el = [-1.4, -1.4]; T.shZ = [0.2, -0.2]; T.headX = -0.25; T.pelvisY = 0.9 + Math.abs(s(t * 14)) * 0.02; break;
      case 'hug': T.shX = [-1.3, -1.3]; T.shZ = [0.45, -0.45]; T.el = [-0.9, -0.9]; T.spineX = 0.1; T.headY = 0.35; break;
      case 'kiss': T.shX = [-1.1, -1.1]; T.shZ = [0.4, -0.4]; T.el = [-0.8, -0.8]; T.spineX = 0.18; T.headX = 0.1; break;
      case 'massage': armsFwd(-1.25, -0.6, 0.2, 12); T.spineX = 0.1; break;
      case 'receiveMassage': T.shX = [-0.1, -0.1]; T.headX = 0.35; T.spineX = 0.08; break;
      case 'dance': { const p = t * 6; T.pelvisY = 0.9 - Math.abs(s(p)) * 0.08; T.th = [-Math.abs(s(p)) * 0.3, -Math.abs(s(p)) * 0.3]; T.kn = [Math.abs(s(p)) * 0.6, Math.abs(s(p)) * 0.6];
        T.shX = [-2.4 + s(p) * 0.5, -2.4 - s(p) * 0.5]; T.el = [-0.6, -0.6]; T.spineZ = s(p * 0.5) * 0.15; T.headY = s(p * 0.5) * 0.3; break; }
      case 'shower': T.shX = [-2.6, -2.6]; T.el = [-1.6 + s(t * 9) * 0.2, -1.6 - s(t * 9) * 0.2]; T.shZ = [0.35, -0.35]; T.headX = -0.2; break;
      case 'hang': T.shX = [-2.4 + s(t * 3) * 0.2, -2.4 - s(t * 3) * 0.2]; T.el = [-0.3, -0.3]; T.headX = -0.35; break;
      case 'phone': T.shX = [0.05, -0.5]; T.shZ = [0.12, -0.35]; T.el = [-0.1, -2.3]; T.headY = 0.1; break;
      case 'wave': T.shX = [0.05, -2.8]; T.shZ = [0.12, -0.3 + s(t * 10) * 0.25]; T.el = [-0.1, -0.4]; break;
      case 'paint': T.shX = [0.05, -1.4 + s(t * 4) * 0.3]; T.el = [-0.2, -0.3]; T.headX = 0.05; break;
      case 'angry': T.shZ = [0.6, -0.6]; T.shX = [-0.2, -0.2]; T.el = [-1.6, -1.6]; T.headX = s(t * 8) * 0.08; T.pelvisY = 0.9 + Math.max(0, s(t * 8)) * 0.02; break;
      case 'sad': T.headX = 0.45; T.shX = [0.1, 0.1]; T.spineX = 0.15; break;
      case 'spin': T.bodyY = t * 6; break;
      case 'feed': T.shX = [0.05, -1.3]; T.el = [-0.1, -0.5 + s(t * 6) * 0.2]; T.headX = 0.25; break;
      case 'brush': T.shX = [0.05, -0.8]; T.el = [-0.1, -2.1 + s(t * 16) * 0.12]; T.headX = 0.1; break;
      default: // idle
        T.spineX = s(t * 1.6) * 0.012; T.headY = s(t * 0.37) * 0.25; T.headX = s(t * 0.21) * 0.05;
        T.shX = [0.04 + s(t * 1.6) * 0.02, 0.04 + s(t * 1.6) * 0.02];
    }
    return T;
  }

  update(dt, anim) {
    this.t += dt;
    const T = this.target(anim, this.t);
    if (!this.cur) this.cur = JSON.parse(JSON.stringify(T));
    const k = 1 - Math.exp(-dt * (anim === 'walk' || anim === 'jog' ? 18 : 10));
    const C = this.cur;
    const L = (a, b) => a + (b - a) * k;
    for (const key of Object.keys(T)) {
      if (Array.isArray(T[key])) { C[key][0] = L(C[key][0], T[key][0]); C[key][1] = L(C[key][1], T[key][1]); }
      else C[key] = key === 'bodyY' ? T[key] : L(C[key], T[key]);
    }
    this.pelvis.position.y = C.pelvisY;
    this.body.rotation.set(C.bodyX, C.bodyY, 0);
    this.body.position.set(0, 0, C.bodyZ);
    this.spine.rotation.set(C.spineX, 0, C.spineZ);
    this.head.rotation.set(C.headX, C.headY, 0);
    for (let i = 0; i < 2; i++) {
      this.legs[i].thigh.rotation.x = C.th[i];
      this.legs[i].knee.rotation.x = C.kn[i];
      this.arms[i].sh.rotation.set(C.shX[i], 0, C.shZ[i]);
      this.arms[i].el.rotation.x = C.el[i];
    }
    if (this.skirt) this.skirt.rotation.x = Math.max(-0.9, Math.min(0, (C.th[0] + C.th[1]) * 0.35));
    const talking = anim === 'talk' || anim === 'laugh' || anim === 'phone';
    this.mouth.scale.y = talking ? 1 + Math.abs(Math.sin(this.t * 14)) * 3 : 1;
    this.blob.visible = C.bodyX > -0.5;
  }
}
