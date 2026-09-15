#!/usr/bin/env node
// pdf.mjs -- the decks as a PDF, one page per slide.
//
// Chrome is driven over the DevTools protocol with nothing installed: node
// speaks the protocol over its own WebSocket, so the export needs no more
// than the browser already on the machine, like the rest of this build.
//
// Three things make the pages match the room rather than a print reflow:
//
//   Screen media, not print.  slides.css has an @media print block for the
//   conference backup, which lays every slide out again at 13pt in static
//   flow.  Here the emulated media stays `screen` and the paper is the
//   slide's own 16:9 box, so what lands on the page is the layout slides.js
//   measured and fitted.
//
//   Reduced motion.  Every animated figure reads prefers-reduced-motion and
//   renders one finished still instead of playing (assets/l2.js), so a
//   figure whose meaning is its last frame arrives at its last frame rather
//   than the empty one it starts on.
//
//   Every step shown.  Steps hide by opacity alone and the slide reserves
//   their space either way, so revealing all of them is the slide's finished
//   state, not a crowded one.
//
// Usage: node gen/pdf.mjs [--root <dir>] <out.pdf> <page> [page ...]
//
// A page is a deck directory (served as <dir>/, so its index.html) or an
// .html file, named relative to the served root.  The root is this course
// directory unless --root says otherwise: the talk in ../qce26 is exported
// from the site root, so that its ../quantum-oracle-engineering/ references
// resolve the way they do on the site.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

let ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 13.333in x 7.5in is 16:9 at 96dpi, which is also 1280x720 CSS pixels, so
// the viewport the figures lay themselves out in and the paper they print on
// are the same box and nothing is scaled between the two.
const PAGE_IN = { width: 13.333, height: 7.5 };
const VIEW_PX = { width: 1280, height: 720 };

// The chrome is presenter furniture: a counter, a progress bar, the tabs that
// open the notes and the grid, and the replay control l2.js parks in the
// corner of every animated figure, since there is nothing to replay on paper.
// The crumb and the segment label stay, because in a document this long they
// are the only running answer to which lesson and which segment a page
// belongs to.
const HIDE = ['#counter', '#progress', '#chapters', '#timer', '#nav-prev',
  '#nav-next', '#grid-tab', '#notes-tab', '#notes-arrow', '#notes-drawer',
  '#notes-popout', '#outline', '#help', '.notes', '.l2-replay'];

const args = process.argv.slice(2);
if (args[0] === '--root' && args.length > 1) {
  ROOT = path.resolve(args[1]);
  args.splice(0, 2);
}
if (args.length < 2) {
  console.error('usage: node gen/pdf.mjs [--root <dir>] <out.pdf> <page> [page ...]');
  process.exit(2);
}
const [out, ...decks] = args;

// A picture served as application/octet-stream is not a picture, and Chrome
// waits on the decode it never gets rather than printing the page, so the
// whole export stops on the first slide carrying one.  Every type the decks
// actually reference belongs in here.
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
  '.avif': 'image/avif', '.gif': 'image/gif', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8',
};

// Serving the root (this course directory, unless --root said otherwise), so
// a deck's ../slides.css resolves the way it does on the site.  Nothing
// outside it is reachable, and nothing off the
// machine is: the decks are built to run with networking off, and the one
// request that does leave (the analytics script in every deck's head) is
// refused here rather than waited on.
function serve() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let file = path.join(ROOT, decodeURIComponent(url.pathname));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, 'index.html');
    }
    fs.readFile(file, (err, body) => {
      if (err) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(body);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

function freePort() {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

function chromeBinary() {
  for (const c of ['google-chrome', 'chromium', 'chromium-browser', 'google-chrome-stable']) {
    if (spawnSync('which', [c]).status === 0) return c;
  }
  throw new Error('no Chrome on PATH (tried google-chrome, chromium, chromium-browser)');
}

// A minimal DevTools client: one WebSocket, replies matched by id, events
// handed to whoever asked for them.
function connect(url) {
  const ws = new WebSocket(url);
  let seq = 0;
  const pending = new Map();
  const handlers = new Map();
  const open = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.method + ': ' + msg.error.message));
      else resolve(msg.result);
    } else if (msg.method && handlers.has(msg.method)) {
      handlers.get(msg.method).forEach((fn) => fn(msg.params));
    }
  });
  const send = (method, params = {}, sessionId) => open.then(() => new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
  }));
  return {
    send,
    once: (method) => new Promise((resolve) => {
      const list = handlers.get(method) || [];
      const fn = (p) => {
        handlers.set(method, (handlers.get(method) || []).filter((f) => f !== fn));
        resolve(p);
      };
      handlers.set(method, list.concat(fn));
    }),
    close: () => ws.close(),
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A page that never answers should say so rather than hang the build.
function guard(promise, what, ms = 60000) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`timed out: ${what}`)), ms);
    }),
  ]);
}

async function main() {
  const { server, port } = await serve();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'qoe-pdf-'));
  const pages = fs.mkdtempSync(path.join(os.tmpdir(), 'qoe-pages-'));
  const debugPort = await freePort();
  const chrome = spawn(chromeBinary(), [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--no-default-browser-check', '--disable-extensions',
    `--user-data-dir=${profile}`, `--remote-debugging-port=${debugPort}`,
    'about:blank',
  ], { stdio: 'ignore' });

  let client, files = [];
  try {
    // The port is listening a moment after the process is.
    let version;
    for (let i = 0; i < 50 && !version; i++) {
      try {
        version = await fetch(`http://127.0.0.1:${debugPort}/json/version`).then((r) => r.json());
      } catch { await sleep(100); }
    }
    if (!version) throw new Error('Chrome never opened its debugging port');

    client = connect(version.webSocketDebuggerUrl);
    const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await client.send('Target.attachToTarget', { targetId, flatten: true });
    const call = (method, params) => client.send(method, params, sessionId);

    await call('Page.enable');
    await call('Emulation.setDeviceMetricsOverride', { ...VIEW_PX, deviceScaleFactor: 1, mobile: false });
    // Set before the first navigation, so a figure reading the query as it
    // initialises already sees reduced motion and paints its still.
    await call('Emulation.setEmulatedMedia', {
      media: 'screen',
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });

    for (const deck of decks) {
      const loaded = client.once('Page.loadEventFired');
      // A directory is asked for with its trailing slash, so the page's
      // relative URLs resolve inside it; a file is asked for as itself.
      const page = deck.endsWith('.html') ? deck : `${deck}/`;
      await call('Page.navigate', { url: `http://127.0.0.1:${port}/${page}` });
      await loaded;

      const ids = await evaluate(call, `(async () => {
        await new Promise(r => document.querySelector('.slide.current') ? r()
          : new MutationObserver((_, o) => { if (document.querySelector('.slide.current')) { o.disconnect(); r(); } })
              .observe(document.body, { subtree: true, attributes: true, childList: true }));
        // Where the deck loads MathJax, typeset first, so every formula and
        // the fonts it pulls in are on the page before the wait on fonts.
        if (window.MathJax && window.MathJax.startup) await window.MathJax.startup.promise;
        await document.fonts.ready;
        const style = document.createElement('style');
        style.textContent = ${JSON.stringify(HIDE.join(','))} + '{display:none !important}';
        document.head.appendChild(style);
        return [...document.querySelectorAll('.slide')].map(s => s.id);
      })()`);

      for (const [i, id] of ids.entries()) {
        // Timers rather than frame callbacks: nothing here needs a frame to
        // have been produced, only a moment to pass, and a wait on a frame
        // that a headless browser decides not to draw is a wait with no end.
        await guard(evaluate(call, `(async () => {
          location.hash = '#' + ${JSON.stringify(id)};
          await new Promise(r => setTimeout(r, 60));
          document.querySelectorAll('.slide.current .step')
            .forEach(el => el.classList.add('shown'));
          await new Promise(r => setTimeout(r, 60));
        })()`), `slide ${id}`);
        // The step reveal can put a figure back to work for a moment.
        await sleep(200);

        // Read back as a stream, never as one base64 reply.  A slide carrying
        // a photograph prints to megabytes, and a reply that size does not
        // arrive: the call simply never returns and takes the browser with
        // it.  Chunks of a megabyte always do.
        const { stream } = await guard(call('Page.printToPDF', {
          paperWidth: PAGE_IN.width, paperHeight: PAGE_IN.height,
          marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
          printBackground: true, pageRanges: '1', preferCSSPageSize: false,
          transferMode: 'ReturnAsStream',
        }), `printing ${id}`);
        const chunks = [];
        for (;;) {
          const chunk = await guard(call('IO.read', { handle: stream, size: 1 << 20 }), `reading ${id}`);
          chunks.push(Buffer.from(chunk.data, chunk.base64Encoded ? 'base64' : 'utf8'));
          if (chunk.eof) break;
        }
        await call('IO.close', { handle: stream });
        const file = path.join(pages,
          `${String(files.length + 1).padStart(4, '0')}-${deck.replace(/\//g, '-')}-${id}.pdf`);
        fs.writeFileSync(file, Buffer.concat(chunks));
        files.push(file);
        process.stderr.write(`\r${deck}: ${i + 1}/${ids.length}   `);
      }
      process.stderr.write('\n');
    }
  } finally {
    if (client) client.close();
    chrome.kill();
    server.close();
    // The browser is still writing its profile out as it goes, so a removal
    // that raced it should not be the error this run reports.
    try {
      fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch { /* a temporary directory left behind is not a failed export */ }
  }

  const target = path.resolve(ROOT, out);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const merged = spawnSync('pdfunite', [...files, target], { stdio: 'inherit' });
  if (merged.status !== 0) throw new Error('pdfunite failed; is poppler-utils installed?');
  fs.rmSync(pages, { recursive: true, force: true });
  shrink(target);
  console.error(`${out}: ${files.length} pages, ${(fs.statSync(target).size / 1e6).toFixed(1)} MB`);
}

// Chrome embeds a photograph at the resolution the file holds, not the size
// the slide draws it, so a handful of illustration slides carry a 1600px
// image into a box a few hundred wide and take the document from 4 MB to 20.
// Resampling to 220dpi of the page (about 2900px across a 13in slide) leaves
// every image well past what the page can show, and the text untouched.
// Skipped with a word rather than a failure where Ghostscript is missing.
function shrink(file) {
  const tmp = file + '.tmp';
  const gs = spawnSync('gs', [
    '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.7', '-dNOPAUSE', '-dBATCH', '-dQUIET',
    '-dDetectDuplicateImages=true',
    '-dDownsampleColorImages=true', '-dColorImageResolution=220',
    '-dColorImageDownsampleThreshold=1.0',
    '-dDownsampleGrayImages=true', '-dGrayImageResolution=220',
    '-dGrayImageDownsampleThreshold=1.0',
    '-dAutoFilterColorImages=false', '-dColorImageFilter=/DCTEncode',
    `-sOutputFile=${tmp}`, file,
  ], { stdio: 'inherit' });
  if (gs.status === 0 && fs.existsSync(tmp) && fs.statSync(tmp).size > 0) {
    fs.renameSync(tmp, file);
  } else {
    fs.rmSync(tmp, { force: true });
    console.error('gs not available; leaving the images at full size');
  }
}

// Runtime.evaluate, awaiting the promise the expression returns and turning a
// thrown page-side error into a thrown node-side one.
async function evaluate(call, expression) {
  const { result, exceptionDetails } = await call('Runtime.evaluate', {
    expression, awaitPromise: true, returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
  }
  return result.value;
}

main().catch((err) => { console.error(err.message); process.exit(1); });
