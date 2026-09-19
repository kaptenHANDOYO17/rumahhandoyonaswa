// Lapisan multiplayer P2P (PeerJS) — host & tamu
const PREFIX = 'griyaasri-hn-';
const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }] };

export function makeCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = '';
  for (let i = 0; i < 5; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

export class Net {
  constructor() { this.peer = null; this.conn = null; this.local = null; this.calls = []; this.onRemoteStream = () => {}; this.onVoiceEnd = () => {}; this.onMsg = () => {}; this.onOpen = () => {}; this.onClose = () => {}; }
  _peer(id) {
    // eslint-disable-next-line no-undef
    if (typeof Peer === 'undefined') throw new Error('PeerJS gagal dimuat');
    // eslint-disable-next-line no-undef
    const p = new Peer(id, { config: ICE, debug: 0 });
    p.on('call', (call) => { try { call.answer(this.local || undefined); } catch (e) { call.answer(); } this._bindCall(call); });
    return p;
  }
  host(code) {
    return new Promise((res, rej) => {
      const p = this._peer(PREFIX + code); this.peer = p;
      const to = setTimeout(() => rej(new Error('Server sinyal tidak merespons')), 15000);
      p.on('open', () => { clearTimeout(to); res(code); });
      p.on('error', (e) => { clearTimeout(to); rej(new Error(e.type === 'unavailable-id' ? 'Kode room sudah dipakai' : (e.message || e.type))); });
      p.on('connection', (c) => {
        if (this.conn && this.conn.open) { c.on('open', () => { c.send({ t: 'full' }); setTimeout(() => c.close(), 500); }); return; }
        this._bind(c);
      });
      p.on('disconnected', () => { try { p.reconnect(); } catch (e) { /* abaikan */ } });
    });
  }
  join(code) {
    return new Promise((res, rej) => {
      const p = this._peer(); this.peer = p;
      const to = setTimeout(() => rej(new Error('Room tidak ditemukan / koneksi diblokir jaringan')), 20000);
      p.on('error', (e) => { clearTimeout(to); rej(new Error(e.type === 'peer-unavailable' ? 'Room tidak ditemukan. Cek kodenya.' : (e.message || e.type))); });
      p.on('open', () => {
        const c = p.connect(PREFIX + code.toUpperCase().trim(), { reliable: true, serialization: 'json' });
        c.on('open', () => { clearTimeout(to); res(); });
        this._bind(c);
      });
    });
  }
  _bind(c) {
    this.conn = c;
    c.on('open', () => this.onOpen());
    c.on('data', (d) => { try { this.onMsg(typeof d === 'string' ? JSON.parse(d) : d); } catch (e) { console.warn(e); } });
    c.on('close', () => { if (this.conn === c) this.conn = null; this.onClose(); });
    c.on('error', () => {});
  }
  // ---------- obrolan suara ----------
  async startVoice() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Browser tidak mendukung mikrofon (butuh HTTPS)');
    this.local = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    this.callRemote();
    return this.local;
  }
  callRemote() {
    if (!this.local || !this.conn || !this.peer) return;
    const call = this.peer.call(this.conn.peer, this.local);
    if (call) this._bindCall(call);
  }
  _bindCall(call) {
    this.calls.push(call);
    call.on('stream', (st) => this.onRemoteStream(st));
    call.on('close', () => { this.calls = this.calls.filter((c) => c !== call); if (!this.calls.length) this.onVoiceEnd(); });
    call.on('error', () => {});
  }
  setMuted(m) { if (this.local) this.local.getAudioTracks().forEach((t) => { t.enabled = !m; }); }
  stopVoice() { if (this.local) this.local.getTracks().forEach((t) => t.stop()); this.local = null; this.calls.forEach((c) => { try { c.close(); } catch (e) { /* abaikan */ } }); this.calls = []; }
  send(m) { if (this.conn && this.conn.open) try { this.conn.send(m); } catch (e) { /* abaikan */ } }
  get open() { return !!(this.conn && this.conn.open); }
}
