// bridge.js -- the agent side of the "spotsocket" kanban demo.
//
// Two faces (see skill.md):
//   * a WebSocket server on 127.0.0.1:7333 -- the browser page dials in here.
//   * a plain HTTP server on 127.0.0.1:7334 -- POST /call {tool,args} forwards
//     the command over the live page socket and returns the matching reply.
//
// No deps: the WS handshake + framing are done by hand against Node built-ins.
const http = require('http');
const crypto = require('crypto');

const WS_PORT = 7333;
const HTTP_PORT = 7334;
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

let pageSocket = null;        // the one live browser connection
let pageTools = [];           // tool list from its hello
const pending = new Map();    // id -> {resolve, timer}
let seq = 0;

// ---- minimal WebSocket framing -------------------------------------------

function encodeFrame(str) {
  const payload = Buffer.from(str, 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x81, len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81; header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81; header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

// Stateful decoder: accumulates bytes, yields complete text-frame payloads.
function makeDecoder(onMessage) {
  let buf = Buffer.alloc(0);
  return (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    while (buf.length >= 2) {
      const opcode = buf[0] & 0x0f;
      const masked = (buf[1] & 0x80) !== 0;
      let len = buf[1] & 0x7f;
      let offset = 2;
      if (len === 126) {
        if (buf.length < 4) return;
        len = buf.readUInt16BE(2); offset = 4;
      } else if (len === 127) {
        if (buf.length < 10) return;
        len = Number(buf.readBigUInt64BE(2)); offset = 10;
      }
      let mask;
      if (masked) {
        if (buf.length < offset + 4) return;
        mask = buf.slice(offset, offset + 4); offset += 4;
      }
      if (buf.length < offset + len) return;   // frame not fully arrived yet
      const payload = buf.slice(offset, offset + len);
      if (masked) for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
      buf = buf.slice(offset + len);

      if (opcode === 0x8) { return; }          // close
      if (opcode === 0x1 || opcode === 0x0) onMessage(payload.toString('utf8'));
      // ignore ping/pong (0x9/0xa) for this local demo
    }
  };
}

// ---- WebSocket server (page dials in) -------------------------------------

const wsServer = http.createServer();
wsServer.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  const accept = crypto.createHash('sha1').update(key + WS_GUID).digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\nConnection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );

  pageSocket = socket;
  const decode = makeDecoder((text) => {
    let msg;
    try { msg = JSON.parse(text); } catch { return; }
    if (msg.type === 'hello') {
      pageTools = msg.tools || [];
      console.log(`[bridge] page connected -- tools: ${pageTools.join(', ')}`);
      return;
    }
    const p = pending.get(msg.id);
    if (p) { clearTimeout(p.timer); pending.delete(msg.id); p.resolve(msg); }
  });

  socket.on('data', decode);
  socket.on('close', () => { if (pageSocket === socket) { pageSocket = null; pageTools = []; } });
  socket.on('error', () => {});
});
wsServer.listen(WS_PORT, '127.0.0.1', () =>
  console.log(`[bridge] WS server on ws://127.0.0.1:${WS_PORT}`));

// ---- HTTP control server (I dial in) --------------------------------------

function callTool(tool, args) {
  return new Promise((resolve) => {
    if (!pageSocket) { resolve({ ok: false, error: 'no page connected' }); return; }
    const id = `r${++seq}`;
    const timer = setTimeout(() => {
      pending.delete(id);
      resolve({ ok: false, error: 'timeout waiting for page reply' });
    }, 10000);
    pending.set(id, { resolve, timer });
    pageSocket.write(encodeFrame(JSON.stringify({ id, tool, args: args || {} })));
  });
}

http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ connected: !!pageSocket, tools: pageTools }));
    return;
  }
  if (req.method !== 'POST' || req.url !== '/call') { res.writeHead(404); res.end(); return; }
  let body = '';
  req.on('data', (d) => { body += d; });
  req.on('end', async () => {
    let parsed;
    try { parsed = JSON.parse(body || '{}'); } catch { res.writeHead(400); res.end('bad json'); return; }
    const result = await callTool(parsed.tool, parsed.args);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(result));
  });
}).listen(HTTP_PORT, '127.0.0.1', () =>
  console.log(`[bridge] HTTP control on http://127.0.0.1:${HTTP_PORT}/call`));
