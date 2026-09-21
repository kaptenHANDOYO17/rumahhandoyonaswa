// Konfigurasi jaringan untuk klien: server sinyal PeerJS sendiri (opsional) & TURN relay (opsional).
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const ice = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }, { urls: 'stun:global.stun.twilio.com:3478' }];
  if (process.env.TURN_URLS) ice.push({ urls: process.env.TURN_URLS.split(',').map((s) => s.trim()), username: process.env.TURN_USER || '', credential: process.env.TURN_PASS || '' });
  const peer = process.env.PEER_HOST ? { host: process.env.PEER_HOST, port: +(process.env.PEER_PORT || 443), path: process.env.PEER_PATH || '/', secure: process.env.PEER_SECURE !== 'false', key: process.env.PEER_KEY || 'peerjs' } : null;
  res.status(200).json({ iceServers: ice, peer, turn: !!process.env.TURN_URLS });
};
