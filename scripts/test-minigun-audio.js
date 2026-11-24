// scripts/test-minigun-audio.js
// Test minigun audio loading and playback in headless Chrome
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg'
};

function createStaticServer(port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURIComponent(req.url.split('?')[0]);
      if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
      const filePath = path.join(ROOT_DIR, reqPath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        res.end(data);
      });
    });

    server.listen(port, () => resolve(server));
  });
}

async function run() {
  const PORT = 8094;
  const server = await createStaticServer(PORT);
  console.log(`Audio test server running at http://localhost:${PORT}`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('audio') || text.includes('Audio') || text.includes('Error') || text.includes('error')) {
      console.log('BROWSER:', text);
    }
  });

  await page.goto(`http://localhost:${PORT}/?arena=arena-3&autostart=STRIKER&aiTest=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.GAME_STATE && window.GAME_STATE.current === 'PLAYING', { timeout: 10000 });
  await page.waitForTimeout(1000); // Allow audio manifest and samples to load

  await page.click('canvas');
  await page.waitForTimeout(300);

  const audioCheck = await page.evaluate(async () => {
    const result = {
      hasAudioApi: !!window.KeepItHighAudio,
      soundTested: false,
      ctxState: null,
      soundList: []
    };

    if (window.audioContext && window.audioContext.state === 'suspended') {
      try { await window.audioContext.resume(); } catch (_) {}
    }

    if (window.KeepItHighAudio) {
      result.soundList = window.KeepItHighAudio.list();
      result.soundTested = window.KeepItHighAudio.test('weapon_minigun');
      if (window.audioContext) result.ctxState = window.audioContext.state;
    }

    return result;
  });

  console.log('Audio check result:', audioCheck);

  await browser.close();
  server.close();

  if (!audioCheck.soundTested) {
    console.error('Failed: weapon_minigun testSound returned false');
    process.exit(1);
  } else {
    console.log('SUCCESS: Minigun audio loaded and playable.');
  }
}

run().catch((err) => {
  console.error('Audio test failed:', err);
  process.exit(1);
});
