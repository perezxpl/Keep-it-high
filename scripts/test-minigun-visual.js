// scripts/test-minigun-visual.js
// Visual verification of MINIGUN grip and firing under Playwright
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
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8'
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
  const PORT = 8092;
  const server = await createStaticServer(PORT);
  console.log(`Test server running at http://localhost:${PORT}`);

  const reportsDir = path.join(ROOT_DIR, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[MINIGUN_TEST]') || text.includes('Error') || text.includes('error')) {
      console.log('BROWSER:', text);
    }
  });

  console.log('Navigating to game...');
  await page.goto(`http://localhost:${PORT}/?arena=arena-3&autostart=STRIKER&aiTest=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.GAME_STATE && window.GAME_STATE.current === 'PLAYING', { timeout: 10000 });
  await page.waitForTimeout(600);

  // Setup player with MINIGUN and persistent close-up camera pin
  const setupResult = await page.evaluate(() => {
    const p = window.player;
    if (!p) return { success: false, error: 'No player' };

    const minigunWep = (window.WEAPONS && window.WEAPONS.MINIGUN);
    if (!minigunWep) {
      return { success: false, error: 'WEAPONS.MINIGUN not found' };
    }

    if (p.loadout && p.loadout.pocket1) {
      p.loadout.pocket1.slots[0] = 'MINIGUN';
      p.loadout.pocket1.activeSlotIndex = 0;
    }

    p.currentWeapon = minigunWep;
    p.isHolstered = false;
    p.holsterWeight = 0;
    p.shootPoseWeight = 1.0;
    p.shootPoseTimer = 120;
    p.hp = 100;
    p.isDead = false;
    p.vx = 0;
    p.vy = 0;
    p.onGround = true;
    p.facing = 1;

    if (!p.ammo) p.ammo = {};
    p.ammo.MINIGUN = {
      magSize: 150,
      currentAmmo: 150,
      reserveAmmo: 300,
      reloadTime: 3.5,
      reloadDuration: 210,
      isReloading: false,
      reloadTimer: 0
    };

    if (window.deathmatchState) {
      window.deathmatchState.matchPhase = 'ACTIVE';
      window.deathmatchState.countdownTimer = 0;
      window.deathmatchState.fightBannerTimer = 0;
    }

    if (typeof window.setDevZoom === 'function') {
      window.setDevZoom(2.5);
    }
    if (window.camera) {
      window.camera.zoom = 2.5;
      window.camera.targetZoom = 2.5;
      window.camera.smoothZoom = 1.0;
    }

    // Override camera update to pin close-up
    if (window._minigunCamPin) clearInterval(window._minigunCamPin);
    window._minigunCamPin = setInterval(() => {
      const pl = window.player;
      if (!pl) return;
      pl.isHolstered = false;
      pl.holsterWeight = 0;
      pl.shootPoseWeight = 1.0;
      if (window.deathmatchState) {
        window.deathmatchState.matchPhase = 'ACTIVE';
        window.deathmatchState.countdownTimer = 0;
        window.deathmatchState.fightBannerTimer = 0;
      }
      if (window.camera) {
        window.camera.zoom = 2.5;
        window.camera.targetZoom = 2.5;
        const z = 2.5;
        window.camera.x = pl.x + 12 - (1280 / z) * 0.5 + 45;
        window.camera.y = pl.y + 35 - (720 / z) * 0.55;
        window.camera.targetX = window.camera.x;
        window.camera.targetY = window.camera.y;
      }
    }, 16);

    return { success: true };
  });

  console.log('Setup result:', setupResult);
  if (!setupResult.success) {
    console.error('Failed to setup MINIGUN in game');
    await browser.close();
    server.close();
    process.exit(1);
  }

  // 1. Scene 1: Idle position from hip
  console.log('Capturing reports/minigun-idle.png...');
  await page.evaluate(() => {
    const p = window.player;
    p.isShooting = false;
    p.minigunSpin = 0;
    p.aimX = p.x + 200;
    p.aimY = p.y + 20;
  });
  await page.waitForTimeout(500);

  const idleMetrics = await page.evaluate(() => {
    const p = window.player;
    const hold = window.getWeaponHoldTransform ? window.getWeaponHoldTransform(p) : null;
    return {
      pivotX: hold ? hold.pivotX : 0,
      pivotY: hold ? hold.pivotY : 0,
      angleDeg: hold ? (hold.angle * 180 / Math.PI).toFixed(1) : 0,
      rightHand: hold ? hold.rightHandTarget : null,
      leftHand: hold ? hold.leftHandTarget : null,
      barrelLen: hold ? hold.barrelLen : null,
      barrelOffsetY: hold ? hold.barrelOffsetY : null,
      camZoom: window.camera ? window.camera.zoom : null,
      camTargetZoom: window.camera ? window.camera.targetZoom : null,
      hasSetDevZoom: typeof window.setDevZoom
    };
  });
  console.log('Idle metrics:', idleMetrics);

  const idlePngPath = path.join(reportsDir, 'minigun-idle.png');
  await page.screenshot({ path: idlePngPath });
  console.log('Saved:', idlePngPath);

  // 2. Scene 2: Continuous firing with rotating barrels and muzzle flash
  console.log('Capturing reports/minigun-firing.png...');
  await page.evaluate(() => {
    const p = window.player;
    p.isShooting = true;
    p.minigunSpin = 1.0;
    p.minigunBarrelPhase = 2.4;
    p.minigunHeat = 0.65;
    p.aimX = p.x + 180;
    p.aimY = p.y + 15;

    if (window.shootWeapon) {
      window.shootWeapon(p, p.currentWeapon);
    }
  });
  await page.waitForTimeout(100);

  // Re-assert muzzle flash and spin right for the screenshot frame
  await page.evaluate(() => {
    const p = window.player;
    p.isShooting = true;
    p.minigunSpin = 1.0;
    p.minigunBarrelPhase = 2.4;
    p.minigunHeat = 0.65;
    p.muzzleFlashTimer = 3;
    if (window.shootWeapon) {
      window.shootWeapon(p, p.currentWeapon);
    }
  });

  const firingMetrics = await page.evaluate(() => {
    const p = window.player;
    const hold = window.getWeaponHoldTransform ? window.getWeaponHoldTransform(p) : null;
    return {
      pivotX: hold ? hold.pivotX : 0,
      pivotY: hold ? hold.pivotY : 0,
      angleDeg: hold ? (hold.angle * 180 / Math.PI).toFixed(1) : 0,
      rightHand: hold ? hold.rightHandTarget : null,
      leftHand: hold ? hold.leftHandTarget : null,
      minigunSpin: p.minigunSpin,
      minigunBarrelPhase: p.minigunBarrelPhase,
      minigunHeat: p.minigunHeat,
      muzzleFlashTimer: p.muzzleFlashTimer
    };
  });
  console.log('Firing metrics:', firingMetrics);

  const firingPngPath = path.join(reportsDir, 'minigun-firing.png');
  await page.screenshot({ path: firingPngPath });
  console.log('Saved:', firingPngPath);

  // 3. Scene 3: Armory card preview
  console.log('Capturing reports/minigun-armory.png...');
  await page.evaluate(() => {
    if (window._minigunCamPin) clearInterval(window._minigunCamPin);
    if (typeof window.openArmory === 'function') {
      window.openArmory(window.player);
    }
    const overlay = document.getElementById('armory-overlay');
    if (overlay) overlay.style.display = 'flex';
    if (typeof window.openSlotPicker === 'function') {
      window.openSlotPicker(0);
    }
    const scrollParent = document.querySelector('.armory-picker-content');
    if (scrollParent) scrollParent.scrollTop = 9999;
  });
  await page.waitForTimeout(600);

  const armoryPngPath = path.join(reportsDir, 'minigun-armory.png');
  await page.screenshot({ path: armoryPngPath });
  console.log('Saved:', armoryPngPath);

  await browser.close();
  server.close();
  console.log('Visual test completed successfully.');
}

run().catch((err) => {
  console.error('Error running test:', err);
  process.exit(1);
});
