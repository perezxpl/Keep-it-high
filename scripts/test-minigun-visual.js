// scripts/test-minigun-visual.js
// Visual and mechanical verification of MINIGUN 360 aim, straight-line firing, heat buildup & barrel smoke under Playwright
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
          if (!reqPath.endsWith('favicon.ico')) {
            console.log('404 URL:', reqPath);
          }
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

function normAngleDiff(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
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

  const consoleErrors = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' && !text.includes('404')) {
      consoleErrors.push(text);
    }
    if (text.includes('[MINIGUN_TEST]') || text.includes('Error') || (msg.type() === 'error' && !text.includes('404'))) {
      console.log('BROWSER:', text);
    }
  });

  console.log('Navigating to game (human input mode with bots=0)...');
  await page.goto(`http://localhost:${PORT}/?arena=arena-3&autostart=STRIKER&bots=0`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.GAME_STATE && window.GAME_STATE.current === 'PLAYING', { timeout: 10000 });
  await page.waitForTimeout(700);

  // Equip MINIGUN and pin close-up camera centered on player
  const setupResult = await page.evaluate(() => {
    const p = window.player;
    if (!p) return { success: false, error: 'No player' };
    const minigunWep = window.WEAPONS && window.WEAPONS.MINIGUN;
    if (!minigunWep) return { success: false, error: 'WEAPONS.MINIGUN not found' };

    if (p.loadout && p.loadout.pocket1) {
      p.loadout.pocket1.slots[0] = 'MINIGUN';
      p.loadout.pocket1.activeSlotIndex = 0;
    }

    p.currentWeapon = minigunWep;
    p.isHolstered = false;
    p.holsterWeight = 0;
    p.minigunHeat = 0;
    p.minigunSpin = 0;
    p.hp = 100;
    p.isDead = false;
    p.vx = 0;
    p.vy = 0;
    p.onGround = true;

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

    // Wait-free camera pin so player stays centered on screen at 2.2x zoom
    if (typeof window.setDevZoom === 'function') window.setDevZoom(2.2);
    if (window._minigunCamPin) clearInterval(window._minigunCamPin);
    window._minigunCamPin = setInterval(() => {
      const pl = window.player;
      if (!pl) return;
      pl.isHolstered = false;
      pl.holsterWeight = 0;
      if (window.deathmatchState) {
        window.deathmatchState.matchPhase = 'ACTIVE';
        window.deathmatchState.countdownTimer = 0;
        window.deathmatchState.fightBannerTimer = 0;
      }
      if (window.camera) {
        const z = 2.2;
        window.camera.zoom = z;
        window.camera.targetZoom = z;
        window.camera.x = (pl.x + pl.w / 2) - (1280 / z) * 0.5;
        window.camera.y = (pl.y + pl.h / 2) - (720 / z) * 0.5;
        window.camera.targetX = window.camera.x;
        window.camera.targetY = window.camera.y;
      }
    }, 16);

    return { success: true };
  });

  if (!setupResult.success) {
    console.error('Setup failed:', setupResult);
    process.exit(1);
  }
  await page.waitForTimeout(200);

  // Compute actual gun origin screen coordinates dynamically from player hip & camera
  console.log('Testing 360 degree aiming angles...');
  const originScreen = await page.evaluate(() => {
    const p = window.player;
    const cam = window.camera;
    const ox = p.x + p.w / 2;
    const oy = (p.y + (p.h || 70) - 40 + (p.pelvisY || 0)) - 4.0;
    return {
      sx: (ox - cam.x) * cam.zoom,
      sy: (oy - cam.y) * cam.zoom
    };
  });

  const targets = [
    { name: 'RIGHT_0', sx: originScreen.sx + 240, sy: originScreen.sy, expectFacing: 1, minDeg: -6, maxDeg: 6 },
    { name: 'UP_90', sx: originScreen.sx + 2, sy: originScreen.sy - 220, expectFacing: 1, minDeg: -96.5, maxDeg: -82 },
    { name: 'LEFT_180', sx: originScreen.sx - 240, sy: originScreen.sy, expectFacing: -1, minDeg: -6, maxDeg: 6 },
    { name: 'DOWN_90', sx: originScreen.sx + 2, sy: originScreen.sy + 220, expectFacing: 1, minDeg: 80, maxDeg: 95 }
  ];

  // Hold RMB briefly (or evaluate aiming) so swayPitch doesn't skew idle angle check
  await page.mouse.down({ button: 'right' });
  for (const t of targets) {
    await page.mouse.move(t.sx, t.sy);
    await page.waitForTimeout(160);
    const info = await page.evaluate(() => {
      const p = window.player;
      const hold = window.getWeaponHoldTransform(p);
      return {
        facing: p.facing,
        localAngleDeg: +(hold.angle * 180 / Math.PI).toFixed(2),
        pivotX: +hold.pivotX.toFixed(2),
        pivotY: +hold.pivotY.toFixed(2)
      };
    });
    const passFacing = info.facing === t.expectFacing;
    const passAngle = info.localAngleDeg >= t.minDeg && info.localAngleDeg <= t.maxDeg;
    console.log(`  [${t.name}] facing=${info.facing}, localAngle=${info.localAngleDeg} deg -> ${passFacing && passAngle ? 'PASS' : 'FAIL'}`);
    if (!passFacing || !passAngle) {
      throw new Error(`360 aim check failed for ${t.name}: got ${JSON.stringify(info)}, expected facing=${t.expectFacing} angle in [${t.minDeg}, ${t.maxDeg}]`);
    }
    if (t.name === 'UP_90' || t.name === 'DOWN_90' || t.name === 'LEFT_180') {
      await page.screenshot({ path: path.join(reportsDir, `minigun-${t.name.toLowerCase()}.png`) });
    }
  }
  await page.mouse.up({ button: 'right' });

  // Now test continuous firing, straight-line bullet trajectory from barrels, and NATURAL HEAT buildup!
  console.log('Testing natural barrel heat buildup and bullet collinearity over 2.4s burst...');
  await page.mouse.move(originScreen.sx + 260, originScreen.sy - 40); // slight upward-right angle
  await page.waitForTimeout(100);
  await page.mouse.down();

  // Hold LMB for 2.3s to build real heat through spritesheet row 1 (warm) & row 2 (overheated)
  let midHeat = 0;
  await page.waitForTimeout(1150);
  midHeat = await page.evaluate(() => window.player.minigunHeat || 0);
  console.log(`  Heat after 1.15s continuous fire: ${midHeat.toFixed(3)}`);

  await page.waitForTimeout(1150);
  const fireStats = await page.evaluate(() => {
    const p = window.player;
    const hold = window.getWeaponHoldTransform(p);
    const barrelAngle = Math.atan2(Math.sin(hold.angle), Math.cos(hold.angle) * hold.charFacing);
    const recentBullets = (window.bullets || []).slice(-6).map((b) => {
      const bAngle = Math.atan2(b.vy, b.vx);
      let diff = (bAngle - barrelAngle) % (Math.PI * 2);
      if (diff > Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      return {
        bAngleDeg: +(bAngle * 180 / Math.PI).toFixed(2),
        barrelAngleDeg: +(barrelAngle * 180 / Math.PI).toFixed(2),
        diffDeg: +(Math.abs(diff) * 180 / Math.PI).toFixed(2)
      };
    });
    return {
      heat: +(p.minigunHeat || 0).toFixed(3),
      ammoLeft: p.ammo?.MINIGUN?.currentAmmo,
      bulletCount: (window.bullets || []).length,
      recentBullets
    };
  });
  console.log('  Fire stats after 2.3s:', JSON.stringify(fireStats));

  if (fireStats.heat < 0.70) {
    throw new Error(`Expected minigunHeat >= 0.70 after 2.3s burst, got ${fireStats.heat}`);
  }
  for (const rb of fireStats.recentBullets) {
    if (rb.diffDeg > 4.0) {
      throw new Error(`Bullet deviated too far from barrel line! diff=${rb.diffDeg} deg (${JSON.stringify(rb)})`);
    }
  }

  // Test close-range mouse (inside barrel 48px!) while still firing -> bullets MUST still go straight forward along barrel, NOT backwards!
  await page.mouse.move(originScreen.sx + 30, originScreen.sy); // right near player waist (< 48.5px barrel!)
  await page.waitForTimeout(180);
  const closeBulletsCheck = await page.evaluate(() => {
    const p = window.player;
    const hold = window.getWeaponHoldTransform(p);
    const barrelAngle = Math.atan2(Math.sin(hold.angle), Math.cos(hold.angle) * hold.charFacing);
    const bList = (window.bullets || []).slice(-3);
    return bList.map((b) => {
      const bAngle = Math.atan2(b.vy, b.vx);
      let diff = (bAngle - barrelAngle) % (Math.PI * 2);
      if (diff > Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      return {
        bAngleDeg: +(bAngle * 180 / Math.PI).toFixed(2),
        barrelAngleDeg: +(barrelAngle * 180 / Math.PI).toFixed(2),
        diffDeg: +(Math.abs(diff) * 180 / Math.PI).toFixed(2)
      };
    });
  });
  console.log('  Close-cursor bullet check (<48px):', JSON.stringify(closeBulletsCheck));
  for (const cb of closeBulletsCheck) {
    if (cb.diffDeg > 4.0) {
      throw new Error(`Close-cursor bullet failed straight-line check! ${JSON.stringify(cb)}`);
    }
  }

  // Move mouse back out and capture red-hot firing frame
  await page.mouse.move(originScreen.sx + 240, originScreen.sy - 20);
  await page.waitForTimeout(120);
  await page.screenshot({ path: path.join(reportsDir, 'minigun-firing-hot.png') });
  console.log('Saved reports/minigun-firing-hot.png');

  // Release LMB to stop shooting and verify hot barrel smoke rises during cool-down!
  await page.mouse.up();
  console.log('Released trigger -> capturing post-fire heat & smoke...');
  await page.waitForTimeout(450);

  const postFireInfo = await page.evaluate(() => {
    return {
      heatRemaining: +(window.player.minigunHeat || 0).toFixed(3),
      isShooting: window.player.isShooting
    };
  });
  console.log('  Post-fire status after 450ms:', postFireInfo);
  if (postFireInfo.heatRemaining <= 0.30) {
    throw new Error(`Hot barrels cooled down too quickly! heatRemaining=${postFireInfo.heatRemaining}`);
  }

  await page.screenshot({ path: path.join(reportsDir, 'minigun-heat-smoke.png') });
  console.log('Saved reports/minigun-heat-smoke.png');

  await page.evaluate(() => {
    if (window._minigunCamPin) clearInterval(window._minigunCamPin);
  });
  await browser.close();
  server.close();

  if (consoleErrors.length > 0) {
    throw new Error(`Console errors detected: ${consoleErrors.join('; ')}`);
  }
  console.log('ALL MINIGUN 360 / STRAIGHT / HEAT / SMOKE CHECKS PASSED!');
}

run().catch((err) => {
  console.error('Error running test:', err);
  process.exit(1);
});
