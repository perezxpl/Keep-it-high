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
  const reportsDir = path.join(ROOT_DIR, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('console', msg => {
      console.log('[BROWSER LOG]', msg.type(), msg.text());
    });

    const url = `http://localhost:${PORT}/?arena=3&autostart=STRIKER&zombie=1&aiTest=1&bots=0&zdbg=1`;
    console.log('[TEST] Ladowanie gry:', url);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    await page.waitForFunction(() => {
      return window.GAME_STATE && window.GAME_STATE.current === 'PLAYING' && window.player;
    }, { timeout: 10000 });

    console.log('[TEST] Gra aktywna. Rozpoczynanie diagnostyki wizualnej zombie...');

    // =========================================================================
    // SCENARIUSZ A: Zombie w odleglosci dx = 450 px (Daleko)
    // =========================================================================
    console.log('[TEST] Uruchamianie Scenariusza A (daleko, dx=450)...');
    const diagA = await page.evaluate(async () => {
      const { createZombieInstance } = await import('./js/zombie/index.js');
      const isMatchClient = (typeof window.isMatchClient === 'function') ? window.isMatchClient() : false;

      if (typeof window.setBotCount === 'function') {
        window.setBotCount(0);
      }
      if (typeof window.getActiveBots === 'function') {
        window.getActiveBots().forEach(b => { b.isDead = true; b.hp = 0; b.active = false; });
      }
      window.zombieState.zombies.length = 0;
      window.zombieState.corpses.length = 0;

      const px = window.player.x;
      const py = window.player.y;

      const zA = createZombieInstance(px + 450, py, -1, { skipRise: true });
      zA.riseTimer = 0;
      zA.isDead = false;
      zA.isCrawling = false;
      window.zombieState.zombies.push(zA);
      window._cameraFocusTarget = zA;

      for (let f = 0; f < 35; f++) {
        window.player.x = zA.x - 450;
        window.player.y = zA.y;
        await new Promise(r => requestAnimationFrame(r));
      }

      function getClip(entity) {
        const cam = window.camera;
        const zoom = cam.zoom || 1;
        const ew = entity.w || 24;
        const eh = entity.h || 70;
        const cx = entity.x + ew * 0.5;
        const cy = entity.y + eh * 0.5;
        const sx = (cx - cam.x) * zoom;
        const sy = (cy - cam.y) * zoom;
        const boxW = 380;
        const boxH = 380;
        const rx = Math.max(0, Math.min(1280 - boxW, Math.round(sx - boxW * 0.5)));
        const ry = Math.max(0, Math.min(720 - boxH, Math.round(sy - boxH * 0.5)));
        return { x: rx, y: ry, width: boxW, height: boxH };
      }

      const resA = {
        playerX: window.player.x,
        playerY: window.player.y,
        zombieX: zA.x,
        zombieY: zA.y,
        dx: window.player.x - zA.x,
        dy: window.player.y - zA.y,
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

      return { resA, clip: getClip(zA) };
    });

    const farPath = path.join(reportsDir, 'zombie-far.png');
    await page.screenshot({ path: farPath, clip: diagA.clip });
    console.log('[ZAPISANO ZRZUT A]:', farPath);
    console.log('SCENARIUSZ A (dx = 450 px):', JSON.stringify(diagA.resA, null, 2));

    // =========================================================================
    // SCENARIUSZ B: Zombie w odleglosci dx = 120 px (Blisko)
    // =========================================================================
    console.log('[TEST] Uruchamianie Scenariusza B (blisko, dx=120)...');
    const diagB = await page.evaluate(async () => {
      const { createZombieInstance } = await import('./js/zombie/index.js');
      const isMatchClient = (typeof window.isMatchClient === 'function') ? window.isMatchClient() : false;

      window.zombieState.zombies.length = 0;
      window.zombieState.corpses.length = 0;

      const px = window.player.x;
      const py = window.player.y;

      const zB = createZombieInstance(px + 120, py, -1, { skipRise: true });
      zB.riseTimer = 0;
      zB.isDead = false;
      zB.isCrawling = false;
      window.zombieState.zombies.push(zB);
      window._cameraFocusTarget = zB;

      for (let f = 0; f < 35; f++) {
        window.player.x = zB.x - 120;
        window.player.y = zB.y;
        await new Promise(r => requestAnimationFrame(r));
      }

      function getClip(entity) {
        const cam = window.camera;
        const zoom = cam.zoom || 1;
        const ew = entity.w || 24;
        const eh = entity.h || 70;
        const cx = entity.x + ew * 0.5;
        const cy = entity.y + eh * 0.5;
        const sx = (cx - cam.x) * zoom;
        const sy = (cy - cam.y) * zoom;
        const boxW = 380;
        const boxH = 380;
        const rx = Math.max(0, Math.min(1280 - boxW, Math.round(sx - boxW * 0.5)));
        const ry = Math.max(0, Math.min(720 - boxH, Math.round(sy - boxH * 0.5)));
        return { x: rx, y: ry, width: boxW, height: boxH };
      }

      const resB = {
        playerX: window.player.x,
        playerY: window.player.y,
        zombieX: zB.x,
        zombieY: zB.y,
        dx: window.player.x - zB.x,
        dy: window.player.y - zB.y,
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

      return { resB, clip: getClip(zB) };
    });

    const closePath = path.join(reportsDir, 'zombie-close.png');
    await page.screenshot({ path: closePath, clip: diagB.clip });
    console.log('[ZAPISANO ZRZUT B]:', closePath);
    console.log('SCENARIUSZ B (dx = 120 px):', JSON.stringify(diagB.resB, null, 2));

    // =========================================================================
    // SCENARIUSZ C: Prawdziwa reanimacja bota i podejscie na dx = 120 px
    // =========================================================================
    console.log('[TEST] Uruchamianie Scenariusza C (prawdziwa reanimacja bota)...');
    const diagC = await page.evaluate(async () => {
      const { createBotInstance } = await import('./js/bot.js');
      const { onCharacterRespawnCorpse } = await import('./js/zombie/index.js');

      window.zombieState.zombies.length = 0;
      window.zombieState.corpses.length = 0;

      const px = window.player.x;
      const py = window.player.y;

      const bot = (window.bots && window.bots.length > 0)
        ? window.bots[0]
        : createBotInstance(0, true);
      if (!window.bots) window.bots = [];
      if (!window.bots.includes(bot)) window.bots.push(bot);

      bot.active = true;
      bot.x = px + 180;
      bot.y = py;
      bot.isDead = true;
      bot.hp = 0;
      bot.hasHead = true;
      bot.decapitated = false;
      bot.respawnTimer = 1;

      // Rejestracja ciala do reanimacji
      onCharacterRespawnCorpse(bot, 1200);

      if (window.zombieState.corpses.length > 0) {
        window.zombieState.corpses[0].timer = 0.02;
      }

      // Oczekiwanie na reanimacje i powstanie obiektu zombie w tablicy
      for (let f = 0; f < 30; f++) {
        await new Promise(r => requestAnimationFrame(r));
        if (window.zombieState.zombies.length > 0) break;
      }

      const zReal = window.zombieState.zombies[0];
      if (!zReal) throw new Error('Nie udalo sie zreanimowac bota w zombie!');

      // Oczekiwanie az zombie wstanie z ziemi (riseTimer -> 0)
      for (let f = 0; f < 90; f++) {
        await new Promise(r => requestAnimationFrame(r));
        if (zReal.riseTimer <= 0) break;
      }
      zReal.riseTimer = 0;

      // Podejscie graczem na odleglosc dx = 120 px
      window.player.x = zReal.x - 120;
      window.player.y = zReal.y;
      window._cameraFocusTarget = zReal;

      // 35 klatek na settled aggro i uniesienie rak
      for (let f = 0; f < 35; f++) {
        window.player.x = zReal.x - 120;
        window.player.y = zReal.y;
        await new Promise(r => requestAnimationFrame(r));
      }

      function getClip(entity) {
        const cam = window.camera;
        const zoom = cam.zoom || 1;
        const ew = entity.w || 24;
        const eh = entity.h || 70;
        const cx = entity.x + ew * 0.5;
        const cy = entity.y + eh * 0.5;
        const sx = (cx - cam.x) * zoom;
        const sy = (cy - cam.y) * zoom;
        const boxW = 380;
        const boxH = 380;
        const rx = Math.max(0, Math.min(1280 - boxW, Math.round(sx - boxW * 0.5)));
        const ry = Math.max(0, Math.min(720 - boxH, Math.round(sy - boxH * 0.5)));
        return { x: rx, y: ry, width: boxW, height: boxH };
      }

      const resReal = {
        isReaching: zReal.isReaching,
        reachBlend: zReal.reachBlend,
        vx: zReal.vx,
        armFrontSwing: zReal.pose?.armFrontSwing,
        armBackSwing: zReal.pose?.armBackSwing,
        isCrawling: zReal.isCrawling,
        riseTimer: zReal.riseTimer,
        gaitMode: zReal.gaitMode,
        torsoTilt: zReal.pose?.torsoTilt,
        armFrontElbow: zReal.pose?.armFrontElbow,
        armBackElbow: zReal.pose?.armBackElbow
      };

      return { resReal, clip: getClip(zReal) };
    });

    const realClosePath = path.join(reportsDir, 'zombie-real-close.png');
    await page.screenshot({ path: realClosePath, clip: diagC.clip });
    console.log('[ZAPISANO ZRZUT C]:', realClosePath);

    console.log('=== WYNIKI DIAGNOSTYKI PRAWDZIWEJ REANIMACJI BOTA ===');
    console.log('isReaching:', diagC.resReal.isReaching);
    console.log('reachBlend:', diagC.resReal.reachBlend);
    console.log('vx:', diagC.resReal.vx);
    console.log('armFrontSwing:', diagC.resReal.armFrontSwing);
    console.log('armBackSwing:', diagC.resReal.armBackSwing);
    console.log('isCrawling:', diagC.resReal.isCrawling);
    console.log('riseTimer:', diagC.resReal.riseTimer);
    console.log('PELNY OBIEKT REANIMACJI:', JSON.stringify(diagC.resReal, null, 2));

  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

run().catch(err => {
  console.error('[DIAGNOSTIC ERROR]', err);
  process.exit(1);
});
