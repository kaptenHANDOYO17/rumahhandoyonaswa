// Server sinyal PeerJS milik sendiri (deploy di Railway / Render / Fly.io / VPS).
// Setelah jalan, isi di Vercel: PEER_HOST=<domain-server>, PEER_PORT=443, PEER_PATH=/griya, PEER_SECURE=true
const { PeerServer } = require('peer');
const port = +(process.env.PORT || 9000);
const server = PeerServer({ port, path: '/griya', allow_discovery: false, alive_timeout: 20000, expire_timeout: 8000, concurrent_limit: 500, corsOptions: { origin: '*' } });
server.on('connection', (c) => console.log('masuk', c.getId()));
server.on('disconnect', (c) => console.log('keluar', c.getId()));
console.log(`Server sinyal Griya Asri jalan di port ${port}, path /griya`);
