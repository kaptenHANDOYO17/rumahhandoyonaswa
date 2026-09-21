// Model karakter 3D prosedural + animasi pose
import * as THREE from 'three';

const PI = Math.PI;
const G = {
  cyl: (rt, rb, h, s = 10) => new THREE.CylinderGeometry(rt, rb, h, s),
};
function std(color, rough = 0.8, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, ...extra });
}
function addTo(p, m) { p.add(m); return m; }
function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}

let BATIK = null;
function batikTex() {
  if (BATIK) return BATIK;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#7a4a22'; g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 32) for (let x = 0; x < 128; x += 32) {
    const ox = (y / 32) % 2 ? 16 : 0; g.strokeStyle = '#e8c98a'; g.lineWidth = 2;
    g.beginPath(); g.ellipse(x + ox + 16, y + 16, 11, 6, Math.PI / 4, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.ellipse(x + ox + 16, y + 16, 11, 6, -Math.PI / 4, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#2a1a10'; g.beginPath(); g.arc(x + ox + 16, y + 16, 3, 0, Math.PI * 2); g.fill();
  }
  BATIK = new THREE.CanvasTexture(c); BATIK.colorSpace = THREE.SRGBColorSpace; BATIK.wrapS = BATIK.wrapT = THREE.RepeatWrapping; BATIK.repeat.set(2, 2);
  return BATIK;
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
    addTo(pelvis, mesh(new THREE.SphereGeometry(0.16, 14, 10), pants, 0, 0, 0)).scale.set(1.05, 0.7, 0.8);

    const legs = [];
    for (const side of [-1, 1]) {
      const thigh = new THREE.Group(); thigh.position.set(side * 0.095, -0.02, 0); pelvis.add(thigh);
      addTo(thigh, mesh(G.cyl(0.078, 0.064, 0.45), o.dress ? std(o.pants, 0.9) : pants, 0, -0.225, 0));
      const knee = new THREE.Group(); knee.position.y = -0.45; thigh.add(knee);
      addTo(knee, mesh(G.cyl(0.062, 0.05, 0.42), o.dress ? skin : pants, 0, -0.21, 0));
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
    addTo(spine, mesh(G.cyl(0.05, 0.055, 0.1), skin, 0, 0.6, 0));

    const arms = [];
    for (const side of [-1, 1]) {
      const sh = new THREE.Group(); sh.position.set(side * 0.215, 0.5, 0); spine.add(sh);
      addTo(sh, mesh(new THREE.SphereGeometry(0.065, 10, 8), shirt, 0, 0, 0));
      addTo(sh, mesh(G.cyl(0.058, 0.05, 0.3), shirt, 0, -0.15, 0));
      const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
      addTo(el, mesh(G.cyl(0.045, 0.038, 0.27), skin, 0, -0.135, 0));
      const hand = new THREE.Group(); hand.position.y = -0.29; el.add(hand);
      addTo(hand, mesh(new THREE.SphereGeometry(0.048, 10, 8), skin));
      arms.push({ sh, el, hand });
    }
    this.arms = arms;

    const neck = new THREE.Group(); neck.position.y = 0.64; spine.add(neck); this.neck = neck;
    const head = new THREE.Group(); head.position.y = 0.13; neck.add(head); this.head = head;
    const skull = mesh(new THREE.SphereGeometry(0.118, 20, 16), skin); skull.scale.set(0.95, 1.08, 1); head.add(skull);
    // telinga
    for (const s of [-1, 1]) addTo(head, mesh(new THREE.SphereGeometry(0.028, 8, 6), skin, s * 0.112, 0, 0)).scale.set(0.5, 1, 0.8);
    // wajah
    for (const s of [-1, 1]) {
      addTo(head, mesh(new THREE.SphereGeometry(0.022, 10, 8), white, s * 0.043, 0.012, 0.1)).scale.set(1, 0.8, 0.5);
      addTo(head, mesh(new THREE.SphereGeometry(0.012, 8, 6), dark, s * 0.043, 0.012, 0.112));
      addTo(head, mesh(new THREE.BoxGeometry(0.045, 0.009, 0.01), hairM, s * 0.045, 0.048, 0.106)).rotation.z = s * -0.12;
    }
    addTo(head, mesh(new THREE.SphereGeometry(0.016, 8, 6), skin, 0, -0.018, 0.118));
    const mouth = mesh(new THREE.BoxGeometry(0.045, 0.01, 0.01), lip, 0, -0.058, 0.106); head.add(mouth); this.mouth = mouth;
    if (o.dress) for (const s of [-1, 1]) addTo(head, mesh(new THREE.CircleGeometry(0.02, 12), new THREE.MeshBasicMaterial({ color: 0xe88a8a, transparent: true, opacity: 0.35 }), s * 0.07, -0.03, 0.098));

    // rambut
    const hs = o.hairStyle;
    if (hs === 'hijab') {
      const hijab = std(o.shirt === '#e8e4d8' ? '#c9b99a' : '#e8e4d8', 0.9);
      const cap = mesh(new THREE.SphereGeometry(0.135, 20, 16, 0, PI * 2, 0, PI * 0.62), hijab, 0, 0.005, -0.005); cap.scale.set(1, 1.1, 1.05); head.add(cap);
      const drape = mesh(new THREE.CylinderGeometry(0.13, 0.25, 0.3, 20, 1, true, PI * 0.25, PI * 1.5), std(hijab.color, 0.9, { side: THREE.DoubleSide }), 0, -0.17, -0.01);
      drape.rotation.y = PI; head.add(drape);
      addTo(head, mesh(new THREE.TorusGeometry(0.105, 0.02, 8, 24, PI), hijab, 0, -0.01, 0.02)).rotation.set(0, 0, PI);
    } else {
      const cap = mesh(new THREE.SphereGeometry(0.126, 20, 16, 0, PI * 2, 0, PI * 0.5), hairM, 0, 0.012, -0.008); cap.scale.set(1, 1.05, 1.06); head.add(cap);
      if (hs === 'short' || hs === 'curly') {
        const fr = mesh(new THREE.BoxGeometry(0.2, 0.05, 0.06), hairM, 0, 0.08, 0.075); fr.rotation.x = -0.3; head.add(fr);
        for (const s of [-1, 1]) addTo(head, mesh(new THREE.BoxGeometry(0.03, 0.08, 0.1), hairM, s * 0.112, 0.03, -0.02));
        addTo(head, mesh(new THREE.SphereGeometry(0.12, 14, 10), hairM, 0, 0.02, -0.035)).scale.set(0.98, 0.85, 0.9);
        if (hs === 'curly') for (let i = 0; i < 14; i++) {
          const a = (i / 14) * PI * 2; addTo(head, mesh(new THREE.SphereGeometry(0.035, 8, 6), hairM, Math.cos(a) * 0.1, 0.09 + Math.sin(i) * 0.02, Math.sin(a) * 0.1 - 0.01));
        }
      } else {
        const back = mesh(new THREE.BoxGeometry(0.25, hs === 'bun' ? 0.14 : 0.36, 0.08), hairM, 0, hs === 'bun' ? -0.01 : -0.11, -0.085);
        head.add(back);
        const fringe = mesh(new THREE.SphereGeometry(0.12, 16, 10, PI * 0.1, PI * 0.8, 0, PI * 0.35), hairM, 0, 0.02, 0.012); fringe.rotation.x = 0.15; head.add(fringe);
        if (hs === 'long') for (const s of [-1, 1]) addTo(head, mesh(new THREE.BoxGeometry(0.05, 0.3, 0.1), hairM, s * 0.11, -0.09, -0.01));
        if (hs === 'bun') addTo(head, mesh(new THREE.SphereGeometry(0.07, 12, 10), hairM, 0, 0.1, -0.12));
      }
    }
    this.propAnchor = arms[1].hand;
    this.prop = null; this.propName = null;
    this.detail(o, { skin, shirt, pants, hairM, shoe, white, dark, lip });
  }

  // ---------- detail tambahan: wajah, pakaian, tangan, aksesori ----------
  detail(o, M) {
    const head = this.head, spine = this.spine, female = !!o.dress;
    const gold = std('#d4ae4a', 0.3, { metalness: 0.85 }), metal = std('#c9ced4', 0.25, { metalness: 0.9 });
    // mata: iris, kilau, bulu mata
    for (const sd of [-1, 1]) {
      addTo(head, mesh(new THREE.SphereGeometry(0.0138, 12, 10), std('#4a2e1a', 0.25), sd * 0.043, 0.012, 0.1098)).scale.set(1, 1, 0.45);
      addTo(head, mesh(new THREE.SphereGeometry(0.0042, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }), sd * 0.0395, 0.0175, 0.1245));
      const lid = mesh(new THREE.SphereGeometry(0.0232, 12, 8, 0, PI * 2, 0, PI * 0.42), M.skin, sd * 0.043, 0.0135, 0.099); lid.rotation.x = 0.35; lid.scale.set(1.02, 0.95, 0.55); head.add(lid);
      if (female) { const lash = mesh(new THREE.BoxGeometry(0.036, 0.004, 0.012), M.dark, sd * 0.045, 0.028, 0.109); lash.rotation.set(-0.5, 0, sd * -0.18); head.add(lash); }
    }
    // hidung & bibir & dagu
    const br = mesh(new THREE.BoxGeometry(0.018, 0.048, 0.022), M.skin, 0, 0.004, 0.113); br.rotation.x = -0.22; head.add(br);
    for (const sd of [-1, 1]) addTo(head, mesh(new THREE.SphereGeometry(0.0055, 6, 5), M.dark, sd * 0.009, -0.026, 0.127));
    addTo(head, mesh(new THREE.SphereGeometry(0.02, 10, 8), M.lip, 0, -0.066, 0.1)).scale.set(1.25, 0.42, 0.55);
    addTo(head, mesh(new THREE.SphereGeometry(0.052, 14, 10), M.skin, 0, -0.078, 0.062)).scale.set(1, 0.72, 0.82);
    for (const sd of [-1, 1]) { const ear = mesh(new THREE.TorusGeometry(0.018, 0.005, 6, 12), M.skin, sd * 0.119, 0.0, 0.004); ear.rotation.y = PI / 2; head.add(ear); }
    if (!female) {
      const stub = mesh(new THREE.SphereGeometry(0.1215, 22, 12, PI * 0.12, PI * 0.76, PI * 0.56, PI * 0.3), new THREE.MeshStandardMaterial({ color: M.hairM.color, transparent: true, opacity: 0.22, roughness: 1, depthWrite: false }));
      stub.scale.set(0.95, 1.08, 1); head.add(stub);
      if (o.hairStyle !== 'hijab' && !o.noMoustache) addTo(head, mesh(new THREE.BoxGeometry(0.05, 0.009, 0.012), M.hairM, 0, -0.045, 0.113)).rotation.x = -0.2;
    }
    if (o.peci) { const pc = mesh(new THREE.CylinderGeometry(0.117, 0.121, 0.085, 24), std('#15151a', 0.95), 0, 0.1, -0.008); pc.rotation.x = -0.12; head.add(pc); }
    if (o.hairStyle === 'hijab') addTo(head, mesh(new THREE.SphereGeometry(0.011, 8, 6), gold, 0.0, -0.118, 0.105));
    // kerah, kancing, saku
    if (!female) {
      for (const sd of [-1, 1]) { const col = mesh(new THREE.BoxGeometry(0.075, 0.012, 0.05), M.shirt, sd * 0.04, 0.585, 0.075); col.rotation.set(0.5, sd * -0.5, sd * 0.35); spine.add(col); }
      for (let i = 0; i < 4; i++) addTo(spine, mesh(new THREE.SphereGeometry(0.0075, 6, 5), std('#f2efe6', 0.4), 0, 0.5 - i * 0.1, 0.113));
      addTo(spine, mesh(new THREE.BoxGeometry(0.004, 0.42, 0.004), std('#000000', 1, { transparent: true, opacity: 0.25 }), 0.008, 0.3, 0.113));
      addTo(spine, mesh(new THREE.BoxGeometry(0.07, 0.075, 0.006), M.shirt, -0.075, 0.42, 0.108));
      // ikat pinggang
      const belt = mesh(new THREE.CylinderGeometry(0.168, 0.168, 0.045, 24, 1, true), std('#3a2616', 0.4, { side: THREE.DoubleSide }), 0, 0.055, 0); belt.scale.z = 0.8; this.pelvis.add(belt);
      addTo(this.pelvis, mesh(new THREE.BoxGeometry(0.045, 0.035, 0.012), metal, 0, 0.055, 0.137));
      // jam tangan
      const wr = this.arms[0].el; addTo(wr, mesh(G.cyl(0.043, 0.043, 0.022), std('#1f1f1f', 0.4), 0, -0.245, 0));
      addTo(wr, mesh(G.cyl(0.02, 0.02, 0.01), metal, 0, -0.245, 0.04)).rotation.x = PI / 2;
    } else {
      addTo(spine, mesh(new THREE.TorusGeometry(0.075, 0.007, 6, 18, PI), gold, 0, 0.56, 0.06)).rotation.set(PI * 0.55, 0, PI);
      addTo(this.arms[1].el, mesh(new THREE.TorusGeometry(0.041, 0.005, 6, 16), gold, 0, -0.245, 0)).rotation.x = PI / 2;
    }
    // jari tangan
    for (const a of this.arms) {
      for (let i = 0; i < 4; i++) { const f = mesh(new THREE.CapsuleGeometry(0.0095, 0.03, 3, 6), M.skin, -0.027 + i * 0.018, -0.052, 0.008); f.rotation.x = 0.15; a.hand.add(f); }
      const th = mesh(new THREE.CapsuleGeometry(0.011, 0.026, 3, 6), M.skin, 0.0, -0.02, 0.04); th.rotation.x = 1.0; a.hand.add(th);
    }
    // sol sepatu
    for (const l of this.legs) {
      addTo(l.knee, mesh(new THREE.BoxGeometry(0.108, 0.022, 0.255), std(female ? '#6a3a2e' : '#e8e2d6', 0.7), 0, -0.483, 0.05));
      addTo(l.knee, mesh(new THREE.SphereGeometry(0.052, 10, 8), M.shoe, 0, -0.455, 0.15)).scale.set(1, 0.6, 0.8);
    }
    // batik
    if (o.batik) { M.shirt.map = batikTex(); M.shirt.color.set('#ffffff'); M.shirt.needsUpdate = true; }
    // badan gemuk (tetangga)
    const w = o.wide || 1;
    if (w > 1) {
      const torso = spine.children[0]; torso.scale.x *= w; torso.scale.z *= w * 1.12;
      addTo(spine, mesh(new THREE.SphereGeometry(0.2, 18, 14), M.shirt, 0, 0.2, 0.05)).scale.set(w * 0.95, 0.95, w * 1.05);
      this.pelvis.children[0].scale.x *= w; this.pelvis.children[0].scale.z *= w;
      for (const l of this.legs) { l.thigh.scale.set(1 + (w - 1) * 0.8, 1, 1 + (w - 1) * 0.8); l.thigh.position.x *= 1 + (w - 1) * 0.5; }
      for (const a of this.arms) { a.sh.position.x *= 1 + (w - 1) * 0.55; a.sh.scale.set(1 + (w - 1) * 0.5, 1, 1 + (w - 1) * 0.5); }
      addTo(head, mesh(new THREE.SphereGeometry(0.06, 12, 10), M.skin, 0, -0.07, 0.03)).scale.set(1.6, 0.8, 1.2);
    }
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
      case 'cup': m(G.cyl(0.035, 0.03, 0.09, 12), '#f2efe8', 0, -0.02, 0.05); m(G.cyl(0.03, 0.03, 0.01, 12), '#6d4c41', 0, 0.025, 0.05); break;
      case 'parcel': m(new THREE.BoxGeometry(0.32, 0.22, 0.26), '#c8a27a', 0, -0.05, 0.14); break;
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
