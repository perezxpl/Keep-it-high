import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = 8011;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8'
};

function startServer(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const urlPath = req.url.split('?')[0];
        let safePath = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
        if (safePath === '/' || safePath === '\\') safePath = '/index.html';
        const filePath = path.join(ROOT_DIR, safePath);
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
        });
        fs.createReadStream(filePath).pipe(res);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(err.message);
      }
    });
    server.listen(port, '0.0.0.0', () => resolve(server));
    server.on('error', reject);
  });
}

async function launchBrowser() {
  const channels = ['chrome', 'msedge', undefined];
  for (const ch of channels) {
    try {
      const opts = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--mute-audio']
      };
      if (ch) opts.channel = ch;
      return await chromium.launch(opts);
    } catch (_) {}
  }
  throw new Error('Nie udalo sie uruchomic Chrome/Edge');
}

async function run() {
  const server = await startServer(PORT);
  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('console', msg => {
      console.log('[BROWSER LOG]', msg.type(), msg.text());
    });

    const url = `http://localhost:${PORT}/?arena=3&autostart=STRIKER&zombie=1&aiTest=1&bots=0`;
    console.log('[TEST] Ladowanie gry:', url);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    await page.waitForFunction(() => {
      return window.GAME_STATE && window.GAME_STATE.current === 'PLAYING' && window.player;
    }, { timeout: 10000 });

    console.log('[TEST] Gra aktywna. Rozpoczynanie diagnostyki zombie...');

    const diag = await page.evaluate(async () => {
      const { createZombieInstance } = await import('./js/zombie/index.js');
      const isMatchClient = (typeof window.isMatchClient === 'function') ? window.isMatchClient() : false;

      // Usuniecie botow i innych zombie zeby test byl czysty i deterministyczny
      if (typeof window.setBotCount === 'function') {
        window.setBotCount(0);
      }
      if (typeof window.getActiveBots === 'function') {
        window.getActiveBots().forEach(b => { b.isDead = true; b.hp = 0; b.active = false; });
      }
      window.zombieState.zombies.length = 0;
      window.zombieState.corpses.length = 0;

      // Scenariusz A: Zombie w odleglosci dx = 500 px
      const px = window.player.x;
      const py = window.player.y;

      const humans = [window.player, ...(window.bots || [])].map(h => ({ name: h.name, x: Math.round(h.x), y: Math.round(h.y), isDead: h.isDead }));
      console.log('HUMANS IN GAME:', JSON.stringify(humans));
      const zA = createZombieInstance(px + 500, py, -1, { skipRise: true });
      zA.riseTimer = 0;
      zA.isDead = false;
      zA.isCrawling = false;
      window.zombieState.zombies.push(zA);

      // Czekamy 30 klatek
      const historyA = [];
      for (let f = 0; f < 30; f++) {
        await new Promise(r => requestAnimationFrame(r));
        historyA.push({
          f,
          zx: Math.round(zA.x),
          px: Math.round(window.player.x),
          dx: Math.round(window.player.x - zA.x),
          isReaching: zA.isReaching,
          reachBlend: zA.reachBlend,
          vx: zA.vx
        });
      }

      const resA = {
        playerX: window.player.x,
        playerY: window.player.y,
        zombieX: zA.x,
        zombieY: zA.y,
        dx: window.player.x - zA.x,
        dy: window.player.y - zA.y,
        targetInfo: zA._target ? { name: zA._target.name, x: Math.round(zA._target.x), y: Math.round(zA._target.y), isDead: zA._target.isDead } : null,
        isReaching: zA.isReaching,
        reachBlend: zA.reachBlend,
        reachAngle: zA.reachAngle,
        vx: zA.vx,
        riseTimer: zA.riseTimer,
        isCrawling: zA.isCrawling,
        gaitMode: zA.gaitMode,
        torsoTilt: zA.pose?.torsoTilt,
        armFrontSwing: zA.pose?.armFrontSwing,
        armFrontElbow: zA.pose?.armFrontElbow,
        armBackSwing: zA.pose?.armBackSwing,
        armBackElbow: zA.pose?.armBackElbow,
        isMatchClient
      };

      // Scenariusz B: Zombie w odleglosci dx = 140 px
      window.zombieState.zombies.length = 0;
      const zB = createZombieInstance(px + 140, py, -1, { skipRise: true });
      zB.riseTimer = 0;
      zB.isDead = false;
      zB.isCrawling = false;
      window.zombieState.zombies.push(zB);

      // Czekamy 30 klatek
      const historyB = [];
      for (let f = 0; f < 30; f++) {
        await new Promise(r => requestAnimationFrame(r));
        historyB.push({
          f,
          zx: Math.round(zB.x),
          px: Math.round(window.player.x),
          dx: Math.round(window.player.x - zB.x),
          isReaching: zB.isReaching,
          reachBlend: zB.reachBlend,
          vx: zB.vx
        });
      }

      const resB = {
        isReaching: zB.isReaching,
        reachBlend: zB.reachBlend,
        reachAngle: zB.reachAngle,
        vx: zB.vx,
        riseTimer: zB.riseTimer,
        isCrawling: zB.isCrawling,
        gaitMode: zB.gaitMode,
        torsoTilt: zB.pose?.torsoTilt,
        armFrontSwing: zB.pose?.armFrontSwing,
        armFrontElbow: zB.pose?.armFrontElbow,
        armBackSwing: zB.pose?.armBackSwing,
        armBackElbow: zB.pose?.armBackElbow,
        isMatchClient
      };

      return { resA, resB, historyA };
    });

    console.log('HISTORY A (pierwsze i ostatnie klatki):', diag.historyA.slice(0, 5), diag.historyA.slice(-3));
    console.log('=== WYNIKI DIAGNOSTYKI RUNTIME ===');
    console.log('SCENARIUSZ A (dx = 500 px):', JSON.stringify(diag.resA, null, 2));
    console.log('SCENARIUSZ B (dx = 140 px):', JSON.stringify(diag.resB, null, 2));

  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

run().catch(err => {
  console.error('[DIAGNOSTIC ERROR]', err);
  process.exit(1);
});
