// ============================================================
//  Lapisan multiplayer P2P (PeerJS) — host & tamu
//  - detak (heartbeat) 2 dtk: koneksi mati terdeteksi ≤ 7 dtk
//  - pemain yang sama bisa masuk lagi tanpa "room penuh"
//  - suara: Opus + FEC, bitrate stabil, buffer jitter, restart ICE otomatis
// ============================================================
export const PREFIX = 'griyaasri-hn-';
let CONFIG = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }, { urls: 'stun:global.stun.twilio.com:3478' }], peer: null };
export function setNetConfig(c) { if (c && c.iceServers) CONFIG = c; }
export function makeCode() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 5; i++) s += A[Math.floor(Math.random() * A.length)]; return s; }
const opus = (sdp) => sdp.replace(/a=fmtp:(\d+) (.*)useinbandfec=1(.*)/g, (m, pt, a, b) => `a=fmtp:${pt} ${a}useinbandfec=1${b}`)
  .replace(/(a=rtpmap:(\d+) opus\/48000\/2[\s\S]*?a=fmtp:\2 )([^\r\n]*)/, (m, pre, pt, params) => { const p = params.split(';').filter((x) => !/^(maxaveragebitrate|stereo|sprop-stereo|usedtx|useinbandfec|cbr)=/.test(x.trim())); return pre + [...p, 'useinbandfec=1', 'stereo=0', 'sprop-stereo=0', 'maxaveragebitrate=40000', 'usedtx=0'].join(';'); });

export class Net {
  constructor(uid) {
    this.uid = uid || ('anon-' + Math.random().toString(36).slice(2, 8));
    this.peer = null; this.conn = null; this.local = null; this.calls = []; this.lastRx = 0; this.isHost = false; this.remoteUid = null;
    this.onRemoteStream = () => {}; this.onVoiceEnd = () => {}; this.onMsg = () => {}; this.onOpen = () => {}; this.onClose = () => {}; this.onFull = () => {};
    this.hb = setInterval(() => this._beat(), 2000);
  }
  _peer(id) {
    // eslint-disable-next-line no-undef
    if (typeof Peer === 'undefined') throw new Error('PeerJS gagal dimuat');
    const opt = { config: { iceServers: CONFIG.iceServers, iceCandidatePoolSize: 2 }, debug: 0 };
    if (CONFIG.peer) Object.assign(opt, CONFIG.peer);
    // eslint-disable-next-line no-undef
    const p = id ? new Peer(id, opt) : new Peer(opt);
    p.on('call', (call) => { call.answer(this.local || undefined, { sdpTransform: opus }); this._bindCall(call); });
    p.on('disconnected', () => { setTimeout(() => { try { if (!p.destroyed) p.reconnect(); } catch (e) { /* abaikan */ } }, 1500); });
    return p;
  }
  host(code) {
    this.isHost = true;
    return new Promise((res, rej) => {
      const p = this._peer(PREFIX + code); this.peer = p;
      const to = setTimeout(() => rej(Object.assign(new Error('Server sinyal tidak merespons'), { type: 'timeout' })), 15000);
      p.on('open', () => { clearTimeout(to); res(code); });
      p.on('error', (e) => { clearTimeout(to); rej(Object.assign(new Error(e.type === 'unavailable-id' ? 'Kode room sedang dipakai host lain' : (e.message || e.type)), { type: e.type })); });
      p.on('connection', (c) => this._incoming(c));
    });
  }
  // koneksi baru ke host: diterima dulu, diputuskan setelah 'hello'
  _incoming(c) {
    c.on('data', (d) => {
      const m = typeof d === 'string' ? JSON.parse(d) : d;
      if (m.t === 'hello') {
        const cur = this.conn; const stale = !cur || !cur.open || Date.now() - this.lastRx > 6000;
        if (cur && cur !== c && !stale && this.remoteUid && m.uid !== this.remoteUid) { c.send({ t: 'full' }); setTimeout(() => c.close(), 400); return; }
        if (cur && cur !== c) { try { cur.close(); } catch (e) { /* abaikan */ } }
        this.remoteUid = m.uid; this._bind(c); this.lastRx = Date.now(); this.onOpen(m); this.onMsg(m);
        if (this.local) setTimeout(() => this.callRemote(), 800);
        return;
      }
      if (this.conn === c) { this.lastRx = Date.now(); if (m.t === 'bye') { if (this.conn) { const cc = this.conn; this.conn = null; try { cc.close(); } catch (e) { /* abaikan */ } this.onClose(); } return; } if (m.t !== 'ping') this.onMsg(m); }
    });
    c.on('error', () => {});
  }
  join(code, info = {}) {
    this.isHost = false;
    return new Promise((res, rej) => {
      const p = this._peer(); this.peer = p;
      const to = setTimeout(() => rej(Object.assign(new Error('Room tidak merespons / diblokir jaringan'), { type: 'timeout' })), 12000);
      p.on('error', (e) => { clearTimeout(to); rej(Object.assign(new Error(e.type === 'peer-unavailable' ? 'Host belum online' : (e.message || e.type)), { type: e.type })); });
      p.on('open', () => {
        const c = p.connect(PREFIX + code.toUpperCase().trim(), { reliable: true, serialization: 'json' });
        c.on('open', () => { clearTimeout(to); this._bind(c); this.lastRx = Date.now(); c.send({ t: 'hello', uid: this.uid, ...info }); res(); });
        c.on('data', (d) => { const m = typeof d === 'string' ? JSON.parse(d) : d; this.lastRx = Date.now(); if (m.t === 'full') { this.onFull(); return; } if (m.t === 'bye') { if (this.conn) { const cc = this.conn; this.conn = null; try { cc.close(); } catch (e) { /* abaikan */ } this.onClose(); } return; } if (m.t !== 'ping') this.onMsg(m); });
        c.on('error', () => {});
      });
    });
  }
  _bind(c) {
    this.conn = c;
    c.on('close', () => { if (this.conn === c) { this.conn = null; this.onClose(); } });
  }
  _beat() {
    if (!this.conn) return;
    if (this.conn.open) try { this.conn.send({ t: 'ping' }); } catch (e) { /* abaikan */ }
    if (this.lastRx && Date.now() - this.lastRx > 7000) { const c = this.conn; this.conn = null; try { c.close(); } catch (e) { /* abaikan */ } this.onClose(); }
  }
  // ---------- obrolan suara ----------
  async startVoice() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Browser tidak mendukung mikrofon (butuh HTTPS)');
    this.local = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1, sampleRate: 48000 } });
    this.callRemote(); return this.local;
  }
  callRemote() {
    if (!this.local || !this.conn || !this.peer) return;
    this.calls.forEach((c) => { try { c.close(); } catch (e) { /* abaikan */ } }); this.calls = [];
    const call = this.peer.call(this.conn.peer, this.local, { sdpTransform: opus });
    if (call) this._bindCall(call);
  }
  _bindCall(call) {
    this.calls.push(call);
    call.on('stream', (st) => {
      const pc = call.peerConnection;
      if (pc) {
        for (const r of pc.getReceivers()) { try { if ('jitterBufferTarget' in r) r.jitterBufferTarget = 150; if ('playoutDelayHint' in r) r.playoutDelayHint = 0.15; } catch (e) { /* abaikan */ } }
        for (const s of pc.getSenders()) { if (!s.track || s.track.kind !== 'audio') continue; const p = s.getParameters(); p.encodings = p.encodings && p.encodings.length ? p.encodings : [{}]; p.encodings[0].maxBitrate = 40000; p.encodings[0].priority = 'high'; p.encodings[0].networkPriority = 'high'; s.setParameters(p).catch(() => {}); }
        pc.addEventListener('iceconnectionstatechange', () => {
          if (pc.iceConnectionState === 'disconnected') setTimeout(() => { if (pc.iceConnectionState === 'disconnected' && pc.restartIce) pc.restartIce(); }, 2500);
          if (pc.iceConnectionState === 'failed' && this.isHost) setTimeout(() => this.callRemote(), 1500);
        });
      }
      this.onRemoteStream(st);
    });
    call.on('close', () => { this.calls = this.calls.filter((c) => c !== call); if (!this.calls.length) this.onVoiceEnd(); });
    call.on('error', () => {});
  }
  setMuted(m) { if (this.local) this.local.getAudioTracks().forEach((t) => { t.enabled = !m; }); }
  stopVoice() { if (this.local) this.local.getTracks().forEach((t) => t.stop()); this.local = null; this.calls.forEach((c) => { try { c.close(); } catch (e) { /* abaikan */ } }); this.calls = []; }
  send(m) { if (this.conn && this.conn.open) try { this.conn.send(m); } catch (e) { /* abaikan */ } }
  get open() { return !!(this.conn && this.conn.open); }
  destroy() { clearInterval(this.hb); try { this.peer && this.peer.destroy(); } catch (e) { /* abaikan */ } }
}
