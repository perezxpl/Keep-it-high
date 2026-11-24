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
      loopTested: false,
      ctxState: null,
      soundList: [],
      hasMinigunInCatalog: false,
      hasMinigunLoopInCatalog: false,
      minigunVoiceActive: false,
      minigunVoiceStopped: false
    };

    if (window.audioContext && window.audioContext.state === 'suspended') {
      try { await window.audioContext.resume(); } catch (_) {}
    }

    if (window.KeepItHighAudio) {
      result.soundList = window.KeepItHighAudio.list();
      result.hasMinigunInCatalog = result.soundList.includes('weapon_minigun');
      result.hasMinigunLoopInCatalog = result.soundList.includes('minigun_loop');
      result.soundTested = window.KeepItHighAudio.test('weapon_minigun');
      result.loopTested = window.KeepItHighAudio.test('minigun_loop');
      if (window.audioContext) result.ctxState = window.audioContext.state;

      // Test gameplay loop with player
      if (window.player && window.WEAPONS && window.WEAPONS.MINIGUN) {
        window.player.currentWeapon = window.WEAPONS.MINIGUN;
        window.player.minigunSpin = 1.0;
        if (window.mouseState) window.mouseState.isDown = true;
        window.player.isShooting = true;
        if (!window.player.ammo) window.player.ammo = {};
        if (!window.player.ammo.MINIGUN) window.player.ammo.MINIGUN = { currentAmmo: 150, reserveAmmo: 300, isReloading: false };

        // Keep shooting active across frames
        const shootInterval = setInterval(() => {
          if (window.player) {
            window.player.isShooting = true;
            window.player.minigunSpin = 1.0;
          }
        }, 16);

        // Let game update loop run for 200ms
        await new Promise(r => setTimeout(r, 200));

        const state = window.KeepItHighAudio.getState?.();
        if (state && state.minigunVoices && state.minigunVoices.has(window.player)) {
          result.minigunVoiceActive = true;
        }

        clearInterval(shootInterval);
        // Release trigger
        if (window.mouseState) window.mouseState.isDown = false;
        window.player.isShooting = false;
        await new Promise(r => setTimeout(r, 200));

        if (state && state.minigunVoices && !state.minigunVoices.has(window.player)) {
          result.minigunVoiceStopped = true;
        }
      }
    }

    return result;
  });

  console.log('Audio check result:', audioCheck);

  await browser.close();
  server.close();

  if (!audioCheck.soundTested || !audioCheck.loopTested) {
    console.error('Failed: minigun sound tests failed');
    process.exit(1);
  } else if (!audioCheck.minigunVoiceActive) {
    console.error('Failed: continuous minigun loop voice did not activate during firing');
    process.exit(1);
  } else if (!audioCheck.minigunVoiceStopped) {
    console.error('Failed: continuous minigun loop voice did not stop after release');
    process.exit(1);
  } else {
    console.log('SUCCESS: Minigun audio loaded, continuous loop voice active on fire and cleaned up on release.');
  }
}

run().catch((err) => {
  console.error('Audio test failed:', err);
  process.exit(1);
});
