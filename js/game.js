// ============================================================
//  ENGINE — render, kamera, siang-malam, klik, mode beli
// ============================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildWorld, buildObject, placeObject, updateObjectVisual, buildDirt } from './world.js';
import { SimModel } from './sim.js';
import { Household, footprint, SPEEDS, ULTRA, HUMANS } from './state.js';
import { PetModel, buildPetObject, updatePetVisual, isPetType, PETS, petScale } from './pets.js';
import { buildFloor2, buildLibObject, isLibType, LVL_H } from './floor2.js';
import { buildTown, updateTown, buildTownObject, isTownType } from './town.js';
import { buildCatalogObject, isCatalogType } from './catalog2.js';
import { proceduralPainting } from './studio.js';
import { buildSeasonFX, updateSeasonFX, skyTint } from './seasons.js';
import { buildServiceFX, updateServiceFX } from './services.js';
import { updateRomanceFX } from './romance.js';
import { buildPadang, buildPadangObject, updatePadang, isPadangType } from './padang.js';
import { buildPolish, updatePolish, spawnBurst, shake } from './polish.js';
import { aiAsk, aiReady, AI } from './ai.js';
import { NPCS } from './people.js';
import { saveSlot, writeLocal, beaconSave, cloud } from './account.js';
const RND = (k, v) => (typeof v === 'number' && !Number.isInteger(v) ? (k === 'x' || k === 'z' || k === 'y' || k === 'yaw' || k === 'time' ? Math.round(v * 100) / 100 : Math.round(v * 10) / 10) : v);
const DYN = ['x', 'z', 'y', 'yaw', 'anim', 'prop', 'hidden', 'moving', 'engagedBy', 'icon', 'say', 'lvl', 'away', 'snd', 'busyT', 'visit'];
const mkObj = (o) => (isPadangType(o.type) ? buildPadangObject(o) : isPetType(o.type) ? buildPetObject(o) : isLibType(o.type) ? buildLibObject(o) : isTownType(o.type) ? buildTownObject(o) : isCatalogType(o.type) ? buildCatalogObject(o) : buildObject(o));
import { TYPES, SIM_NAMES, GRID, LOT, HOUSE, PI } from './data.js';

const SAVE_KEY = 'griyaasri-save-v1';
export function readSave() { try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* abaikan */ } }

const SKY = { day: new THREE.Color('#9fd3ee'), dusk: new THREE.Color('#f0a877'), night: new THREE.Color('#0d1a2e'), rain: new THREE.Color('#7f8f9c') };

export class Game {
  constructor({ mode, mySims, net, ui, quality, save }) {
    this.mode = mode; this.mySims = mySims; this.net = net; this.ui = ui; this.quality = quality;
    this.active = mySims[0];
    this.wallMode = 'cut'; this.buy = null; this.follow = false; this.peerOnline = false;
    this.hh = new Household({
      toast: (m, t, b) => this.toast(m, t, b),
      money: (d) => { this.ui.money(d); this.send({ t: 'money', d }); },
      sfx: (k) => { this.ui.sfx(k); this.send({ t: 'sfx', k }); },
      guestArrive: (o) => { this.ui.guestModal(o); this.send({ t: 'guestM', o }); },
      guestClose: () => { this.ui.closeKind('guest'); this.send({ t: 'closeKind', k: 'guest' }); },
      rtVisit: (o) => { this.ui.rtModal(o); this.send({ t: 'rtM', o }); },
      rtClose: () => { this.ui.closeKind('rt'); this.send({ t: 'closeKind', k: 'rt' }); },
      smsNotify: (who, text) => { this.ui.toast(`💬 SMS dari ${who}: ${text.slice(0, 70)}`, 'info'); },
      gallery: () => { this.galleryDirty = true; },
      collectorVisit: (name) => this.hh.collectorBuy(name),
      autoPainting: () => proceduralPainting(),
      ai: (prompt, max) => (this.isHost ? aiAsk(prompt, max) : Promise.resolve(null)),
      chatter: () => (this.isHost && AI.ambient && aiReady() ? (s, role) => { const d = NPCS[s.name] || {}; return aiAsk(`Kamu adalah ${s.name} (${d.trait || role}). Saat ini jam ${Math.floor((this.hh.world.time % 1440) / 60)}.00 di perumahan. Ucapkan satu kalimat obrolan spontan yang cocok dengan kegiatanmu sekarang (${s.anim}). Maks 14 kata.`, 50); } : null),
      openOutfit: (name) => { if (this.mySims.includes(name)) this.ui.openCAS(name); else this.send({ t: 'cas', sim: name }); },
      chat: (name, text) => { this.ui.chat(name, text); this.send({ t: 'chat', name, text }); },
      newDay: () => this.save(),
      eggFound: (id) => { shake(this.polishFX, 0.3); if (['upacara', 'daun'].includes(id)) spawnBurst(this.polishFX, this, id === 'daun' ? 'daun' : 'konfeti'); },
      leafBurst: () => spawnBurst(this.polishFX, this, 'daun'),
      confetti: () => spawnBurst(this.polishFX, this, 'konfeti'),
      ghost: () => { this.ghostT = 6; shake(this.polishFX, 0.25); },
      loanOffer: (o) => { this.ui.loanModal(o); this.send({ t: 'loan', o }); },
      loanClose: () => { this.ui.closeLoan(); this.send({ t: 'loanClose' }); },
    });
    if (save) this.hh.loadSave(save);
  }
  get isHost() { return this.mode !== 'guest'; }
  send(m) { if (this.mode === 'host' && this.net && this.peerOnline) this.net.send(m); }
  toast(m, t, b) { this.ui.toast(m, t, b); this.send({ t: 'toast', m, ty: t, b }); }
  cmd(c) {
    if (['act', 'self', 'mop', 'go', 'social', 'cancel', 'auto', 'outfit', 'say', 'give', 'buy', 'sell', 'loan', 'sms', 'order', 'painting', 'stopPaint', 'iuran', 'guest', 'art', 'proj'].includes(c.c) && !c.sim) c.sim = this.active;
    if (['buy', 'sell', 'give', 'loan', 'sms', 'order', 'iuran', 'guest'].includes(c.c) && this.hh.sims[c.sim] && this.hh.sims[c.sim].isPet) c.sim = this.mySims.find((n) => HUMANS.includes(n));
    if (this.isHost) this.hh.command(c); else this.net.send({ t: 'cmd', c });
    this.ui.sfx('click');
  }

  // ------------------------------------------------------------
  init(container) {
    const q = this.quality;
    const r = new THREE.WebGLRenderer({ antialias: !q.low, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio, q.low ? 1.25 : 2));
    r.setSize(container.clientWidth, container.clientHeight);
    r.shadowMap.enabled = q.shadows; r.shadowMap.type = THREE.PCFShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
    r.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(r.domElement);
    this.renderer = r; this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 400);
    this.camera.position.set(5, 11.5, 15);
    this.controls = new OrbitControls(this.camera, r.domElement);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.09, maxPolarAngle: 1.36, minPolarAngle: 0.25, minDistance: 5, maxDistance: 58, screenSpacePanning: false, zoomSpeed: 1.1 });
    this.controls.target.set(-2, 0, 1.5);
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    this.W = buildWorld(this.scene, q);
    buildFloor2(this.scene, this.W); this.viewLvl = 0; this.W.floor2.visible = false;
    this.town = buildTown(this.scene); this.seasonFX = buildSeasonFX(this); this.padangFX = buildPadang(this.scene); this.polishFX = buildPolish(this); this.svcFX = buildServiceFX(this); this.texCache = new Map(); this.typeOf = (t) => TYPES[t];
    this.objMeshes = new Map(); this.dirtMeshes = new Map();
    this.models = {};
    this.ensureModels();
    // plumbob
    const pb = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), new THREE.MeshStandardMaterial({ color: '#46d36b', emissive: '#2aa84a', emissiveIntensity: 0.6, roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.92 }));
    pb.scale.set(0.75, 1.35, 0.75); pb.castShadow = false; this.scene.add(pb); this.plumbob = pb;
    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.lastT = performance.now();
    this.keys = {};
    this.syncObjects(true); this.syncDirt(true);
    this.bindInput();
    window.addEventListener('resize', () => this.resize());
    this.lastGrass = -1; this.visT = 0; this.netT = 0; this.saveT = 0;
    this.renderer.setAnimationLoop(() => this.frame());
  }
  actors() { return [...Object.values(this.hh.sims), ...Object.values(this.hh.others || {})]; }
  ctrl(n) { const s = this.hh.sims[n]; return this.mySims.includes(n) || !!(s && s.isPet); }
  controllable() { return [...this.mySims.filter((n) => this.hh.sims[n] && !this.hh.sims[n].isPet), ...this.hh.pets().map((p) => p.name)]; }
  ensureModels() {
    for (const s of this.actors()) {
      if (this.models[s.name]) continue;
      const m = s.isPet ? new PetModel(s.name, s.species, s.coat) : new SimModel(s.name, s.outfit);
      this.scene.add(m.root); this.models[s.name] = m; m.root.position.set(s.x, s.y || 0, s.z); m.outfitKey = JSON.stringify(s.outfit);
      if (!s.isPet) m.root.scale.setScalar(s.outfit.height || 1);
    }
  }
  paintingTex(p) {
    if (!p || !p.img) return null; if (this.texCache.has(p.id)) return this.texCache.get(p.id);
    const img = new Image(); const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; img.onload = () => { t.needsUpdate = true; }; img.src = p.img;
    this.texCache.set(p.id, t); return t;
  }
  updateArt(night) {
    const gal = this.hh.gallery || []; let fi = 0; const latest = gal[0];
    for (const o of this.hh.world.objects) {
      const g = this.objMeshes.get(o.id); if (!g) continue; const P = g.userData.P || {}; const T = TYPES[o.type];
      if (P.glow) P.glow.intensity = night ? 1.6 : 0;
      let target = null;
      if (o.type === 'easel' && P.canvas) target = P.canvas; else if (P.pic) target = P.pic; if (!target) continue;
      const p = T.frame ? ((o.s && o.s.pid && gal.find((x) => x.id === o.s.pid)) || gal[fi++]) : latest; const tex = p ? this.paintingTex(p) : null;
      if (target.material.map !== tex) { target.material.map = tex; target.material.color.set(tex ? '#ffffff' : '#fbf8ef'); target.material.needsUpdate = true; }
    }
    if (this.galleryDirty && this.isHost) { this.galleryDirty = false; this.send({ t: 'gallery', list: this.hh.gallery }); }
  }
  setView(l) {
    if (this.viewLvl === l) return; const dy = (l - this.viewLvl) * LVL_H; this.viewLvl = l;
    this.W.floor2.visible = l >= 1; this.controls.target.y += dy; this.camera.position.y += dy;
    for (const o of this.hh.world.objects) { const g = this.objMeshes.get(o.id); if (g) g.visible = (o.lvl || 0) <= l; }
    this.groundPlane.constant = -l * LVL_H; this.ui.refresh && this.ui.refresh();
  }
  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h);
  }
  setQuality(low) {
    this.quality.low = low; this.quality.shadows = !low;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, low ? 1.25 : 2));
    this.renderer.shadowMap.enabled = !low; this.W.sun.castShadow = !low;
    this.scene.traverse((o) => { if (o.material) { const ms = [].concat(o.material); ms.forEach((m) => (m.needsUpdate = true)); } });
    this.resize();
  }

  // ------------------------------------------------------------
  //  Sinkron mesh objek & kotoran
  // ------------------------------------------------------------
  syncObjects(force) {
    const W = this.hh.world;
    if (!force && this.objVer === W.objVer) return;
    this.objVer = W.objVer;
    const seen = new Set();
    for (const o of W.objects) {
      seen.add(o.id);
      let g = this.objMeshes.get(o.id);
      if (!g || g.userData.type !== o.type) { if (g) this.scene.remove(g); g = mkObj(o); this.scene.add(g); this.objMeshes.set(o.id, g); }
      placeObject(g, o); g.position.y = (o.lvl || 0) * LVL_H; g.visible = (o.lvl || 0) <= (this.viewLvl || 0);
    }
    for (const [id, g] of this.objMeshes) if (!seen.has(id)) { this.scene.remove(g); this.objMeshes.delete(id); }
  }
  syncDirt(force) {
    const W = this.hh.world;
    if (!force && this.dirtVer === W.dirtVer) return;
    this.dirtVer = W.dirtVer;
    const seen = new Set();
    for (const d of W.dirt) { seen.add(d.id); if (!this.dirtMeshes.has(d.id)) { const g = buildDirt(d); g.position.y += (d.lvl || 0) * LVL_H; g.userData.lvl = d.lvl || 0; this.scene.add(g); this.dirtMeshes.set(d.id, g); } }
    for (const [id, g] of this.dirtMeshes) if (!seen.has(id)) { this.scene.remove(g); this.dirtMeshes.delete(id); }
  }
  updateGrass() {
    const gr = this.hh.world.house.grass;
    if (Math.abs(gr - this.lastGrass) < 2) return;
    this.lastGrass = gr;
    const { inst, pts } = this.W.tufts; const m = new THREE.Matrix4(), qq = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const h = 0.25 + (gr / 100) * 1.5;
    pts.forEach(([x, z, r], i) => { qq.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r); s.set(1, h * (0.7 + (i % 5) * 0.12), 1); p.set(x, 0, z); m.compose(p, qq, s); inst.setMatrixAt(i, m); });
    inst.instanceMatrix.needsUpdate = true;
  }

  // ------------------------------------------------------------
  //  Loop
  // ------------------------------------------------------------
  frame() {
    const now = performance.now(); const raw = Math.min(0.5, Math.max(0, (now - this.lastT) / 1000)); const dt = Math.min(0.05, raw); this.lastT = now;
    const hh = this.hh, W = hh.world;
    if (this.isHost && !this.pausedByUI()) { let r = raw; while (r > 0) { const st = Math.min(0.05, r); hh.tick(st); r -= st; } }
    else if (this.isHost) hh.tick(0);
    this.syncObjects(); this.syncDirt(); this.updateGrass();
    const mul = W.speed === 0 ? 0 : (W.ultra ? ULTRA : SPEEDS[W.speed]);
    this.updateCamera(dt);
    this.ensureModels();
    const act = this.hh.sims[this.active]; if (act && (act.lvl || 0) !== this._lastActLvl) { this._lastActLvl = act.lvl || 0; this.followLvl = true; }
    if (act && (act.lvl || 0) !== this.viewLvl && this.followLvl !== false && !act.hidden && !this.buy) this.setView(act.lvl || 0);
    for (const g of this.dirtMeshes.values()) g.visible = g.userData.lvl <= this.viewLvl;
    this.updateSims(dt, mul);
    this.updateLighting(dt);
    this.updateWalls(dt);
    this.visT += dt;
    if (this.visT > 0.08) {
      const night = this.isNight(); const t = performance.now() / 1000;
      updateTown(this.town, this.hh, night, t); updateSeasonFX(this.seasonFX, this, dt, t); updateServiceFX(this.svcFX, this, dt, t); updateRomanceFX(this); updatePadang(this.padangFX, this, night, t, dt); updatePolish(this.polishFX, this, dt, t, night); this.updateArt(night);
      for (const o of W.objects) { const g = this.objMeshes.get(o.id); if (g) try { if (isPetType(o.type)) updatePetVisual(g, o, t); else updateObjectVisual(g, o, W, night, t); } catch (e) { /* abaikan */ } }
      this.visT = 0;
    }
    // hujan
    if (this.W.rain.visible) {
      const a = this.W.rain.geometry.attributes.position; const tg = this.controls.target;
      for (let i = 0; i < a.count; i++) { let y = a.getY(i) - dt * 22; if (y < 0) y = 25; a.setY(i, y); }
      a.needsUpdate = true; this.W.rain.position.set(tg.x, 0, tg.z);
    }
    for (const c of this.W.clouds) { c.position.x += dt * 0.8; if (c.position.x > 190) c.position.x = -190; }
    this.W.vendor.visible = !!W.vendor;
    if (W.vendor) this.W.vendor.userData.npc.update(dt, Math.sin(performance.now() / 900) > 0.6 ? 'wave' : 'idle');
    if (this.buy) this.updateGhost();
    // jaringan
    if (this.mode === 'host' && this.peerOnline) { this.netT += dt; this.fullT = (this.fullT || 0) + dt; if (this.netT > 0.18) { this.netT = 0; const full = this.fullT > 6; if (full) this.fullT = 0; this.sendSnap(full); } }
    this.saveT += dt; if (this.saveT > (this.isHost ? (this.roomCode ? 30 : 60) : 30)) { this.saveT = 0; this.save(false); }
    this.ui.frame(dt);
    if (this.ui.sound && this.ui.sound.update) this.ui.sound.update(this, dt);
    if (!this.ui.studioOpen) this.renderer.render(this.scene, this.camera);
  }
  pausedByUI() { return false; }
  isNight() { const h = (this.hh.world.time % 1440) / 60; return h < 6.2 || h > 17.9; }

  updateCamera(dt) {
    const c = this.controls; const k = this.keys; const sp = dt * (8 + c.getDistance() * 0.4);
    const fwd = new THREE.Vector3(); this.camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const mv = new THREE.Vector3();
    if (k.w || k.arrowup) mv.add(fwd); if (k.s || k.arrowdown) mv.sub(fwd);
    if (k.d || k.arrowright) mv.add(right); if (k.a || k.arrowleft) mv.sub(right);
    if (mv.lengthSq()) { this.follow = false; mv.normalize().multiplyScalar(sp); c.target.add(mv); this.camera.position.add(mv); }
    if (k.q || k.e) { const ang = (k.q ? 1 : -1) * dt * 1.4; const off = this.camera.position.clone().sub(c.target); off.applyAxisAngle(new THREE.Vector3(0, 1, 0), ang); this.camera.position.copy(c.target).add(off); }
    if (this.follow) {
      const m = this.models[this.active].root.position; const d = new THREE.Vector3(m.x - c.target.x, 0, m.z - c.target.z).multiplyScalar(Math.min(1, dt * 3));
      c.target.add(d); this.camera.position.add(d);
    }
    // batasi area
    const tg = c.target; const cx = Math.max(-30, Math.min(30, tg.x)), cz = Math.max(-20, Math.min(26, tg.z));
    if (cx !== tg.x || cz !== tg.z) { this.camera.position.x += cx - tg.x; this.camera.position.z += cz - tg.z; tg.x = cx; tg.z = cz; }
    tg.y = (this.viewLvl || 0) * LVL_H;
    c.update();
    if (this.camera.position.y < 1.2) this.camera.position.y = 1.2;
  }
  focusSim(name) {
    const m = this.models[name].root.position; const c = this.controls;
    const off = this.camera.position.clone().sub(c.target);
    c.target.set(m.x, 0, m.z); this.camera.position.copy(c.target).add(off);
  }

  updateSims(dt, mul) {
    const hh = this.hh;
    for (const s of this.actors()) {
      const n = s.name, m = this.models[n]; if (!m) continue;
      if (s.isPet) { const sc = petScale(hh, s); if (Math.abs(m.root.scale.x - sc) > 0.001) m.root.scale.setScalar(sc); m.labelH = (s.species === 'cat' ? 0.72 : 1.08) * sc; }
      else {
        const key = JSON.stringify(s.outfit);
        if (key !== m.outfitKey) { m.outfitKey = key; m.setOutfit(s.outfit); m.root.scale.setScalar(s.outfit.height || 1); }
        if (m.root.scale.x !== (s.outfit.height || 1)) m.root.scale.setScalar(s.outfit.height || 1);
      }
      m.moving = s.moving;
      const R = m.root; const dx = s.x - R.position.x, dz = s.z - R.position.z; const d = Math.hypot(dx, dz);
      if (d > 4) { R.position.x = s.x; R.position.z = s.z; }
      else { const k = Math.min(1, dt * (this.isHost ? (s.moving ? 30 : 9) : 10)); R.position.x += dx * k; R.position.z += dz * k; }
      R.position.y += (s.y - R.position.y) * Math.min(1, dt * 10);
      let dy = s.yaw - R.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); R.rotation.y += dy * Math.min(1, dt * (s.moving ? 14 : 8));
      m.seatH = s.seatH;
      m.setProp(s.species === 'capy' && s.hat > hh.world.time ? 'orange' : s.prop);
      R.visible = !s.hidden && (s.lvl || 0) <= this.viewLvl;
      m.ring.visible = n === this.active && !s.hidden;
      const walking = s.anim === 'walk' || s.anim === 'jog' || s.anim === 'push' || s.anim === 'carry';
      const animDt = walking ? dt * (s.moving ? Math.min(Math.max(mul, 1), 6) : 0.0001) : dt * Math.min(Math.max(mul, 1), 2.5);
      m.update(animDt, walking && !s.moving ? 'idle' : s.anim);
    }
    // plumbob
    const a = hh.sims[this.active]; const R = this.models[this.active].root;
    this.plumbob.visible = !a.hidden;
    this.plumbob.position.set(R.position.x, R.position.y + (this.models[this.active].labelH ? this.models[this.active].labelH - 0.1 : 2.02 * (a.outfit.height || 1) + (a.y > 0.3 ? -0.35 : 0)) + Math.sin(performance.now() / 500) * 0.04, R.position.z);
    this.plumbob.rotation.y += dt * 1.6;
    const col = a.moodLevel().color; this.plumbob.material.color.set(col); this.plumbob.material.emissive.set(col);
  }

  updateLighting() {
    const W = this.W, w = this.hh.world; const h = (w.time % 1440) / 60;
    const rain = w.weather === 'hujan' || w.weather === 'badai' || w.weather === 'salju';
    const el = Math.sin(((h - 6) / 12) * PI); // >0 siang
    const dayF = Math.max(0, Math.min(1, (el + 0.12) / 0.4));
    const duskF = Math.max(0, 1 - Math.abs(el) / 0.3) * (h > 4 && h < 20 ? 1 : 0);
    const sky = SKY.night.clone().lerp(SKY.day, dayF).lerp(SKY.dusk, duskF * 0.55);
    const stn = skyTint(w); if (stn) sky.lerp(new THREE.Color(stn), 0.3 * dayF);
    if (rain) sky.lerp(SKY.rain, (w.weather === 'salju' ? 0.25 : 0.55) * dayF + 0.2);
    this.scene.background.copy(sky); this.scene.fog.color.copy(sky);
    this.scene.fog.near = rain ? 25 : 60; this.scene.fog.far = rain ? 110 : 190;
    const az = ((h - 6) / 12) * PI;
    W.sun.position.set(Math.cos(az) * 40, Math.max(6, el * 45), -18 + Math.sin(az) * 6);
    W.sun.target.position.set(0, 0, 0);
    W.sun.intensity = Math.max(0, el) * (rain ? 0.7 : 2.6) + 0.02;
    W.sun.color.set(duskF > 0.4 ? '#ffc38a' : '#fff3dc');
    W.hemi.intensity = 0.28 + dayF * (rain ? 0.55 : 0.7);
    W.hemi.color.set(dayF > 0.3 ? '#dff2ff' : '#6d7fb0');
    const night = this.isNight() || (rain && dayF < 0.6);
    const pw = w.house.power;
    if (this.ghostT > 0) { this.ghostT -= dt; for (const L of W.interiorLights) if (L.lvl) { const on = Math.sin(this.ghostT * 34) > 0; L.light.intensity = on ? 4 : 0; L.lamp.material.emissiveIntensity = on ? 1.4 : 0; } }
    for (const L of W.interiorLights) { if (L.lvl && this.viewLvl < 1) { L.light.intensity = 0; L.lamp.material.emissiveIntensity = 0; continue; } L.light.intensity = (night && pw) ? (L.lvl ? 2.2 : 3.2) : (rain && pw ? 1.2 : (L.lvl ? 0.6 : 0)); L.lamp.material.emissiveIntensity = (night || rain) && pw ? 1.4 : 0; }
    for (const L of W.streetLamps) { if (L.isLight) L.intensity = night ? 18 : 0; else if (L.material) { L.material.emissive && L.material.emissive.set('#ffd27a'); L.material.emissiveIntensity = night ? 2 : 0; } }
    W.glassMat.emissiveIntensity = night && pw ? 0.55 : 0;
    W.rain.visible = w.weather === 'hujan' || w.weather === 'badai';
    this.renderer.toneMappingExposure = 0.95 + (1 - dayF) * 0.25;
  }

  setWallMode(m) { this.wallMode = m; this.W.roof.visible = m === 'roof'; }
  updateWalls(dt) {
    const cam = this.camera.position, tg = this.controls.target, mode = this.wallMode;
    const vd = new THREE.Vector2(tg.x - cam.x, tg.z - cam.z).normalize();
    for (const w of this.W.walls) {
      let low = false;
      if (mode === 'down') low = true;
      else if (mode === 'cut') {
        const toCam = new THREE.Vector2(cam.x - w.cx, cam.z - w.cz);
        const dotN = w.n[0] * toCam.x + w.n[1] * toCam.y;
        if (w.ext) low = dotN > 0;
        else { const facing = Math.abs(w.n[0] * vd.x + w.n[1] * vd.y) > 0.35; const before = (w.cx - tg.x) * -vd.x + (w.cz - tg.z) * -vd.y > -1.5; low = facing && before; }
      }
      const target = low ? (w.lintel ? 0.001 : 0.11 / HOUSE.wallH) : 1;
      const sy = w.g.scale.y + (target - w.g.scale.y) * Math.min(1, dt * 10);
      w.g.scale.y = sy; w.g.visible = sy > 0.02;
      for (const e of w.extras) e.visible = sy > 0.85;
    }
  }

  // ------------------------------------------------------------
  //  Input
  // ------------------------------------------------------------
  bindInput() {
    const el = this.renderer.domElement;
    let down = null;
    el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; this.ui.closeMenu(); });
    el.addEventListener('pointerup', (e) => {
      if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); const dt = performance.now() - down.t; down = null;
      if (moved < 8 && dt < 600) this.click(e.clientX, e.clientY);
    });
    el.addEventListener('pointermove', (e) => { this.mouse = { x: e.clientX, y: e.clientY }; });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const k = e.key.toLowerCase(); this.keys[k] = true;
      if (k === ' ') { e.preventDefault(); this.cmd({ c: 'speed', v: this.hh.world.speed === 0 ? (this.lastSpeed || 1) : 0 }); if (this.hh.world.speed) this.lastSpeed = this.hh.world.speed; }
      if (k === '1' || k === '2' || k === '3') this.cmd({ c: 'speed', v: +k });
      if (k === '0') this.cmd({ c: 'speed', v: 0 });
      if (k === 'tab') { e.preventDefault(); this.switchSim(); }
      if (k === 'b') this.ui.toggleBuy();
      if (k === 'escape') { this.ui.closeMenu(); if (this.buy) this.cancelGhost(); }
      if (k === 'r' && this.buy && this.buy.ghost) this.rotateGhost();
      if (k === 'f') this.follow = !this.follow;
      if (k === 'c') this.ui.cycleWalls();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });
  }
  switchSim(name) {
    const list = this.controllable();
    if (!name) { const i = list.indexOf(this.active); name = list[(i + 1) % list.length]; }
    if (!this.ctrl(name)) return;
    this.active = name; this.focusSim(name); this.ui.refresh();
  }
  pick(cx, cy) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const list = [];
    for (const s of this.actors()) { const m = this.models[s.name]; if (m && m.root.visible && (s.lvl || 0) === this.viewLvl) list.push(m.root); }
    for (const g of this.objMeshes.values()) if (g.visible && (g.userData.lvl = (this.hh.obj(g.userData.objId) || {}).lvl || 0) === this.viewLvl) list.push(g);
    for (const g of this.dirtMeshes.values()) list.push(g);
    const hits = this.raycaster.intersectObjects(list, true);
    for (const h of hits) {
      let o = h.object;
      while (o) {
        if (o.userData.simName && this.hh.actorByName(o.userData.simName)) return { sim: o.userData.simName, point: h.point };
        if (o.userData.objId !== undefined && !o.userData.ghost) return { objId: o.userData.objId, point: h.point };
        if (o.userData.dirtId !== undefined) return { dirtId: o.userData.dirtId, point: h.point };
        o = o.parent;
      }
    }
    const p = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, p)) return { ground: true, point: p };
    return null;
  }
  click(cx, cy) {
    if (this.buy) return this.buyClick(cx, cy);
    const h = this.pick(cx, cy); if (!h) return;
    const me = this.hh.sims[this.active];
    if (h.sim) {
      if (h.sim === this.active) { const now = Date.now(); if (now - (this._pbT || 0) > 2500) this._pbN = 0; this._pbT = now; this._pbN = (this._pbN || 0) + 1; if (this._pbN >= 10) { this._pbN = 0; this.cmd({ c: 'egg', t: 'plumbob' }); } }
      if (h.sim !== this.active && this.mySims.includes(h.sim) && this.mode === 'solo' && this.ui.shiftSelect) return this.switchSim(h.sim);
      const items = this.hh.menuFor(me, { sim: h.sim });
      const title = h.sim === this.active ? `${h.sim} (diri sendiri)` : `${this.active} → ${h.sim}`;
      return this.ui.showMenu(items, cx, cy, title);
    }
    if (h.objId !== undefined) { const o = this.hh.obj(h.objId); if (!o) return; return this.ui.showMenu(this.hh.menuFor(me, { objId: h.objId }), cx, cy, TYPES[o.type].name); }
    if (h.dirtId !== undefined) return this.ui.showMenu(this.hh.menuFor(me, { dirtId: h.dirtId }), cx, cy, 'Lantai kotor');
    if (h.ground) {
      const x = Math.max(GRID.minX + 0.5, Math.min(GRID.maxX - 0.5, h.point.x)), z = Math.max(GRID.minZ + 0.5, Math.min(GRID.maxZ - 0.5, h.point.z));
      this.cmd({ c: 'go', x, z, lvl: this.viewLvl }); this.ui.ping(cx, cy);
    }
  }

  // ------------------------------------------------------------
  //  Mode beli
  // ------------------------------------------------------------
  enterBuy() { this.buy = { ghost: null }; this.prevWall = this.wallMode; if (this.wallMode !== 'down') this.setWallMode('cut'); }
  exitBuy() { this.cancelGhost(); this.buy = null; }
  startGhost(type, moveId) {
    this.cancelGhost();
    const src = moveId ? this.hh.obj(moveId) : null;
    const obj = { id: -1, type, x: src ? src.x : 0, z: src ? src.z : 0, rot: src ? src.rot : 0, s: this.hh.defaultState(type) };
    if (moveId) this.setView(src.lvl || 0);
    const g = mkObj(obj);
    g.traverse((o) => { o.userData.ghost = true; if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.62; o.castShadow = false; } });
    g.userData.ghost = true;
    const T = TYPES[type]; const odd = false;
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(T.w, T.d), new THREE.MeshBasicMaterial({ color: '#46d36b', transparent: true, opacity: 0.35, depthWrite: false }));
    pad.rotation.x = -PI / 2; pad.position.y = 0.04; g.add(pad); g.userData.pad = pad;
    this.scene.add(g);
    if (moveId) { const mg = this.objMeshes.get(moveId); if (mg) mg.visible = false; }
    this.buy.ghost = { g, type, rot: obj.rot, moveId, x: obj.x, z: obj.z, ok: false, odd };
    this.ui.buyGhostChanged();
  }
  cancelGhost() {
    if (!this.buy || !this.buy.ghost) return;
    const gh = this.buy.ghost; this.scene.remove(gh.g);
    if (gh.moveId) { const mg = this.objMeshes.get(gh.moveId); if (mg) mg.visible = true; }
    this.buy.ghost = null; this.ui.buyGhostChanged();
  }
  rotateGhost() { const gh = this.buy && this.buy.ghost; if (!gh) return; gh.rot = (gh.rot + 1) % 4; gh.dirty = true; }
  updateGhost() {
    const gh = this.buy.ghost; if (!gh || !this.mouse) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((this.mouse.x - rect.left) / rect.width) * 2 - 1, -((this.mouse.y - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const p = new THREE.Vector3(); if (!this.raycaster.ray.intersectPlane(this.groundPlane, p)) return;
    const T = TYPES[gh.type]; const odd = gh.rot % 2 === 1; const w = odd ? T.d : T.w, d = odd ? T.w : T.d;
    const snap = (v, size) => { const off = (Math.round(size / 0.25) % 2) ? 0.125 : 0; return Math.round((v - off) / 0.25) * 0.25 + off; };
    const x = snap(p.x, w), z = snap(p.z, d);
    if (x !== gh.x || z !== gh.z || gh.dirty) {
      gh.x = x; gh.z = z; gh.dirty = false;
      gh.g.position.set(x, this.viewLvl * LVL_H, z); gh.g.rotation.y = gh.rot * PI / 2;
      const r = this.hh.canPlace(gh.type, x, z, gh.rot, gh.moveId, this.viewLvl); gh.ok = r === true; gh.why = r === true ? '' : r;
      if (!gh.moveId && this.hh.world.money < T.price) { gh.ok = false; gh.why = 'Uang tidak cukup'; }
      gh.g.userData.pad.material.color.set(gh.ok ? '#46d36b' : '#e5484d');
      this.ui.ghostStatus(gh);
    }
  }
  buyClick(cx, cy) {
    const gh = this.buy.ghost;
    if (gh) {
      this.mouse = { x: cx, y: cy }; gh.dirty = true; this.updateGhost();
      if (!gh.ok) { this.ui.toast(gh.why || 'Tidak bisa ditaruh di sini', 'bad'); return; }
      if (gh.moveId) this.cmd({ c: 'move', id: gh.moveId, x: gh.x, z: gh.z, rot: gh.rot, lvl: this.viewLvl });
      else this.cmd({ c: 'buy', type: gh.type, x: gh.x, z: gh.z, rot: gh.rot, lvl: this.viewLvl, inv: !!gh.inv });
      const keep = !gh.moveId && this.ui.keepPlacing;
      const type = gh.type, rot = gh.rot;
      this.cancelGhost();
      if (keep) { this.startGhost(type); this.buy.ghost.rot = rot; }
      return;
    }
    const h = this.pick(cx, cy);
    if (h && h.objId !== undefined) { const o = this.hh.obj(h.objId); if (o) this.ui.showObjTools(o, cx, cy); }
  }

  // ------------------------------------------------------------
  //  Jaringan
  // ------------------------------------------------------------
  onNet(m) {
    if (this.isHost) {
      if (m.t === 'cmd') { if (m.c.sim && !this.peerSims().includes(m.c.sim) && !(this.hh.sims[m.c.sim] && this.hh.sims[m.c.sim].isPet) && ['act', 'self', 'mop', 'go', 'social', 'cancel', 'auto', 'outfit', 'give'].includes(m.c.c)) return; this.hh.command(m.c); }
      if (m.t === 'hello') { this._sent = null; this.net.send({ t: 'welcome', mySims: [...this.peerSims()], hostSims: this.mySims }); this.net.send({ t: 'snap', s: this.hh.snapshot() }); this.net.send({ t: 'gallery', list: this.hh.gallery }); }
    } else {
      if (m.t === 'dsnap') { if (!this.snapBase) return; const B = this.snapBase; const P = m.s.world.objPatch; delete m.s.world.objPatch; if (P) for (const o of P) { const i = B.world.objects.findIndex((x) => x.id === o.id); if (i >= 0) B.world.objects[i] = o; } Object.assign(B.world, m.s.world); Object.assign(B.sims, m.s.sims); B.others = B.others || {}; for (const n in m.s.others) B.others[n] = Object.assign(B.others[n] || {}, m.s.others[n]); this.hh.applySnapshot(B); return; }
      if (m.t === 'snap') { this.snapBase = m.s; this.hh.applySnapshot(m.s); if (!this.gotSnap) { this.gotSnap = true; this.syncObjects(true); this.syncDirt(true); this.lastGrass = -1; } }
      if (m.t === 'toast') this.ui.toast(m.m, m.ty, m.b);
      if (m.t === 'money') this.ui.money(m.d);
      if (m.t === 'sfx') this.ui.sfx(m.k);
      if (m.t === 'chat') this.ui.chat(m.name, m.text);
      if (m.t === 'cas' && this.mySims.includes(m.sim)) this.ui.openCAS(m.sim);
      if (m.t === 'loan') this.ui.loanModal(m.o);
      if (m.t === 'gallery') { this.hh.gallery = m.list || []; this.hh.galleryVer = (this.hh.galleryVer || 0) + 1; }
      if (m.t === 'guestM') this.ui.guestModal(m.o);
      if (m.t === 'rtM') this.ui.rtModal(m.o);
      if (m.t === 'closeKind') this.ui.closeKind(m.k);
      if (m.t === 'loanClose') this.ui.closeLoan();
    }
  }
  peerSims() { return HUMANS.filter((n) => !this.mySims.includes(n)); }
  // ---------- snapshot delta (hanya bagian dunia yang berubah) ----------
  sendSnap(full) {
    const s = this.hh.snapshot(); const L = this._sent || (this._sent = { world: {}, sims: {}, others: {} });
    const out = { world: {}, sims: {}, others: {} }; let n = 0;
    const OB = L.obj || (L.obj = {}); const objs = s.world.objects; const sig = objs.map((o) => o.id).join(','); const sameSet = !full && L.sig === sig;
    if (sameSet) { const patch = []; for (const o of objs) { const j = JSON.stringify(o, RND); if (OB[o.id] !== j) { OB[o.id] = j; patch.push(JSON.parse(j)); } } if (patch.length) { out.world.objPatch = patch; n++; } }
    else { L.sig = sig; for (const o of objs) OB[o.id] = JSON.stringify(o, RND); }
    for (const part of ['world', 'sims', 'others']) for (const k in s[part] || {}) { if (sameSet && part === 'world' && k === 'objects') continue; let v = s[part][k]; if (part === 'others' && !full) { const o = {}; for (const f of DYN) o[f] = v[f]; v = o; } const j = JSON.stringify(v, RND); if (full || L[part][k] !== j) { out[part][k] = JSON.parse(j); L[part][k] = j; n++; } }
    if (full) this.net.send({ t: 'snap', s }); else if (n) this.net.send({ t: 'dsnap', s: out });
  }
  // ---------- simpan: lokal langsung, cloud tiap ±60 dtk ----------
  save(force = true) {
    const slot = this.slot || 'solo';
    if (!this.isHost && !this.snapBase) return;
    let data; try { data = this.hh.saveData(); } catch (e) { return; }
    const gal = (this.hh.gallery || []).slice(0, 16);
    if (!this.isHost) { writeLocal(slot, data, gal); return; }       // tamu: cadangan lokal (untuk ambil alih host)
    try { writeLocal(slot, data, gal); if (slot === 'solo') localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* abaikan */ }
    const now = Date.now();
    if (cloud() && (force || now - (this._cloudT || 0) > (slot === 'solo' ? 55000 : 25000))) {
      this._cloudT = now; this.cloudState = 'menyimpan…';
      saveSlot(slot, data, gal).then(() => { this.cloudState = `tersimpan ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`; this.ui.saved && this.ui.saved(); }).catch((e) => { this.cloudState = 'gagal: ' + e.message; });
    } else this.ui.saved && this.ui.saved();
  }
  // tab disembunyikan/diminimalkan: browser menghentikan animasi → dunia tetap disimulasikan
  bgSim() {
    if (this._bgIv) return;
    document.addEventListener('visibilitychange', () => {
      clearInterval(this._bgIv); this._bgIv = null;
      if (!document.hidden || !this.isHost) return;
      let last = performance.now();
      this._bgIv = setInterval(() => {
        const now = performance.now(); let dt = Math.min(2, (now - last) / 1000); last = now;
        if (!this.isHost || this.pausedByUI()) return;
        while (dt > 0) { const st = Math.min(0.05, dt); this.hh.tick(st); dt -= st; }
        if (this.peerOnline) this.sendSnap(false);
        this.saveT += 1; if (this.saveT > 30) { this.saveT = 0; this.save(false); }
      }, 250);
    });
    this._bgIv = 0;
  }
  saveOnExit() { try { beaconSave(this.slot || 'solo', this.hh.saveData()); } catch (e) { /* abaikan */ } }
  // ---------- tamu mengambil alih jadi host (host keluar) ----------
  becomeHost(net) {
    const data = this.hh.saveData(); const gal = this.hh.gallery || []; const hooks = this.hh.hooks;
    this.hh = new Household(hooks); this.hh.loadSave(data); this.hh.gallery = gal;
    this.mode = 'host'; this.net = net; this.peerOnline = false; this.snapBase = null; this._sent = null;
    for (const n of HUMANS) if (!this.mySims.includes(n)) this.hh.sims[n].autonomy = true;
    this.syncObjects(true); this.syncDirt(true); this.lastGrass = -1;
    this.save(true);
  }
}
