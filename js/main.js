import { FRAME_DURATION } from './config.js';
import {
  canvas, ctx, W, H, GROUND_Y, camera,
  initCanvas, resize, updateCamera, updateDistance,
  spawnGrass, updateParticles, dist,
  drawSky, drawGround, drawParticles, drawDistanceMarkers, drawHUD
} from './world.js';
import {
  player, playerJump, playerSlide, startKickCharge, executeReleaseKick,
  updatePlayer, drawPlayer
} from './player.js';
import {
  ball, resetBallToPlayer, updateBall, checkBallPlayerCollisions, drawBall
} from './ball.js';
import {
  checkObstacleCollisions, drawObstacles
} from './obstacles.js';

// Kontrolery dotykowe
const leftStick = {
  active: false, id: null, baseX: 0, baseY: 0, curX: 0, curY: 0,
  axisX: 0, axisY: 0, maxRadius: 55
};

const btnCluster = {
  centerX: 0, centerY: 0,
  jump: { x: 0, y: 0, r: 28, active: false, id: null },
  kick: { x: 0, y: 0, r: 32, active: false, id: null },
  slide: { x: 0, y: 0, r: 28, active: false, id: null }
};

const keys = { left: false, right: false, down: false, up: false, space: false, slide: false };

function updateButtonLayout() {
  btnCluster.centerX = W - 110;
  btnCluster.centerY = H - 95;
  btnCluster.jump.x = btnCluster.centerX;
  btnCluster.jump.y = btnCluster.centerY - 46;
  btnCluster.kick.x = btnCluster.centerX - 46;
  btnCluster.kick.y = btnCluster.centerY + 18;
  btnCluster.slide.x = btnCluster.centerX + 46;
  btnCluster.slide.y = btnCluster.centerY + 18;
}

// Inicjalizacja Canvas i wymiarĂłw
const canvasEl = document.getElementById('game');
initCanvas(canvasEl);
resize(player);
updateButtonLayout();
resetBallToPlayer(player, GROUND_Y);

window.addEventListener('resize', () => {
  resize(player);
  updateButtonLayout();
});

// ObsĹ‚uga Touch
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const midX = W / 2;

  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];

    if (t.clientX < midX && !leftStick.active) {
      leftStick.active = true;
      leftStick.id = t.identifier;
      leftStick.baseX = t.clientX; leftStick.baseY = t.clientY;
      leftStick.curX = t.clientX; leftStick.curY = t.clientY;
      leftStick.axisX = 0; leftStick.axisY = 0;
    }

    if (t.clientX >= midX) {
      if (dist(t.clientX, t.clientY, btnCluster.jump.x, btnCluster.jump.y) < btnCluster.jump.r + 14) {
        btnCluster.jump.active = true; btnCluster.jump.id = t.identifier;
        playerJump();
      } else if (dist(t.clientX, t.clientY, btnCluster.kick.x, btnCluster.kick.y) < btnCluster.kick.r + 14) {
        btnCluster.kick.active = true; btnCluster.kick.id = t.identifier;
        startKickCharge();
      } else if (dist(t.clientX, t.clientY, btnCluster.slide.x, btnCluster.slide.y) < btnCluster.slide.r + 14) {
        btnCluster.slide.active = true; btnCluster.slide.id = t.identifier;
        playerSlide(spawnGrass, GROUND_Y);
      }
    }
  }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    if (leftStick.active && t.identifier === leftStick.id) {
      leftStick.curX = t.clientX; leftStick.curY = t.clientY;
      const dx = leftStick.curX - leftStick.baseX;
      const dy = leftStick.curY - leftStick.baseY;
      leftStick.axisX = Math.abs(dx) > 6 ? Math.sign(dx) * Math.min(Math.abs(dx) / leftStick.maxRadius, 1.0) : 0;
      leftStick.axisY = Math.abs(dy) > 6 ? Math.sign(dy) * Math.min(Math.abs(dy) / leftStick.maxRadius, 1.0) : 0;
    }
  }
}, { passive: false });

function endTouch(e) {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    if (leftStick.active && t.identifier === leftStick.id) {
      leftStick.active = false; leftStick.id = null;
      leftStick.axisX = 0; leftStick.axisY = 0;
    }
    if (btnCluster.jump.active && t.identifier === btnCluster.jump.id) {
      btnCluster.jump.active = false; btnCluster.jump.id = null;
    }
    if (btnCluster.kick.active && t.identifier === btnCluster.kick.id) {
      btnCluster.kick.active = false; btnCluster.kick.id = null;
      executeReleaseKick();
    }
    if (btnCluster.slide.active && t.identifier === btnCluster.slide.id) {
      btnCluster.slide.active = false; btnCluster.slide.id = null;
    }
  }
}
canvas.addEventListener('touchend', endTouch, { passive: false });
canvas.addEventListener('touchcancel', endTouch, { passive: false });

// Klawiatura PC
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
  if ((e.code === 'KeyW' || e.code === 'ArrowUp') && !keys.up) {
    keys.up = true; playerJump();
  }
  if (e.code === 'Space' && !keys.space) {
    keys.space = true; startKickCharge();
  }
  if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') && !keys.slide) {
    keys.slide = true; playerSlide(spawnGrass, GROUND_Y);
  }
  if (e.code === 'KeyR') resetBallToPlayer(player, GROUND_Y);
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;
  if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = false;
  if (e.code === 'Space') {
    keys.space = false; executeReleaseKick();
  }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') keys.slide = false;
});

// Mysz PC (klikniÄ™cie w przyciski na ekranie)
canvas.addEventListener('mousedown', (e) => {
  if (dist(e.clientX, e.clientY, btnCluster.jump.x, btnCluster.jump.y) < btnCluster.jump.r) playerJump();
  else if (dist(e.clientX, e.clientY, btnCluster.kick.x, btnCluster.kick.y) < btnCluster.kick.r) startKickCharge();
  else if (dist(e.clientX, e.clientY, btnCluster.slide.x, btnCluster.slide.y) < btnCluster.slide.r) playerSlide(spawnGrass, GROUND_Y);
});
window.addEventListener('mouseup', () => {
  if (player.isCharging) executeReleaseKick();
});

// Aktualizacja stanu gry
function update() {
  updatePlayer(keys, leftStick, GROUND_Y, ball, spawnGrass);
  updateParticles();
  updateBall(GROUND_Y);
  checkBallPlayerCollisions(player, GROUND_Y, spawnGrass);
  checkObstacleCollisions(ball, GROUND_Y);
  updateCamera(player, ball);
  updateDistance(ball.x);
}

// Renderowanie klatki
function draw() {
  ctx.clearRect(0, 0, W, H);

  // Niebo
  drawSky(ctx);

  // Ĺšwiat gry w przestrzeni kamery
  ctx.save();
  ctx.translate(W * 0.40, H * 0.68);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  const worldLeft = camera.x - (W / camera.zoom);
  const worldRight = camera.x + (W / camera.zoom) * 2;
  const worldWidth = worldRight - worldLeft;

  // Murawa i czÄ…steczki darni
  drawGround(ctx, worldLeft, worldWidth);
  drawParticles(ctx);

  // Metry
  drawDistanceMarkers(ctx, worldLeft, worldRight);

  // Obiekty Ĺ›wiata gry
  drawObstacles(ctx, GROUND_Y);
  drawPlayer(ctx, GROUND_Y);
  drawBall(ctx);

  ctx.restore();

  // Interfejs uĹĽytkownika i kontrolki
  drawHUD(ctx, player, fpsDisplay, leftStick, btnCluster);
}

// StaĹ‚a blokada do 60 Hz (identyczna prÄ™dkoĹ›Ä‡ na monitorach 60Hz, 120Hz, 144Hz, 165Hz, 240Hz+)
let lastTime = performance.now();
let fpsDisplay = 60;
let fpsCount = 0;
let lastFpsTime = performance.now();

function loop() {
  requestAnimationFrame(loop);

  const now = performance.now();
  const delta = now - lastTime;

  // Odrzucenie nadmiarowych wywoĹ‚aĹ„ na ekranach 165Hz (i innych high-refresh rate)
  if (delta < FRAME_DURATION - 0.5) {
    return;
  }

  // Zabezpieczenie przed uĹ›pieniem karty lub duĹĽym opĂłĹşnieniem ("Spiral of Death")
  if (delta > 250) {
    lastTime = now;
  } else {
    lastTime += FRAME_DURATION;
    if (now - lastTime > FRAME_DURATION) {
      lastTime = now;
    }
  }

  // Licznik FPS aktualizowany co sekundÄ™
  fpsCount++;
  if (now - lastFpsTime >= 1000) {
    fpsDisplay = Math.round((fpsCount * 1000) / (now - lastFpsTime));
    fpsCount = 0;
    lastFpsTime = now;
  }

  update();
  draw();
}

// Uruchomienie pÄ™tli gry
requestAnimationFrame(loop);