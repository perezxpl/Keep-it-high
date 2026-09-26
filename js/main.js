import { FRAME_DURATION, START_X } from './config.js';
import {
  canvas, ctx, W, H, GROUND_Y, camera,
  initCanvas, resize, updateCamera, updateDistance,
  spawnGrass, updateParticles, dist,
  drawSky, drawGround, drawParticles, drawDistanceMarkers, drawHUD,
  drawStadiumForeground, clearDesertSandstorm, clearWinterBlizzard,
  openChest, openChestShop, closeChestShop, chestShopModal,
  openChestTier, closeChestModal, chestModal, CHEST_TIERS
} from './world.js';
import {
  player, playerJump, playerSlide, startJumpCharge, executeReleaseJump,
  startKickCharge, executeReleaseKick,
  updatePlayer, drawPlayer
} from './player.js';
import {
  ball, resetBallToPlayer, updateBall, checkBallPlayerCollisions, drawBall
} from './ball.js';
import {
  checkObstacleCollisions, drawObstacles, resetObstacles,
  updateProceduralObstacles, updateProceduralBirds
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

// Inicjalizacja Canvas i wymiarów
const canvasEl = document.getElementById('game');
initCanvas(canvasEl);
resize(player);
updateButtonLayout();
resetBallToPlayer(player, GROUND_Y);

window.addEventListener('resize', () => {
  resize(player);
  updateButtonLayout();
});

// Obsługa kliknięć w modal sklepu skrzyń
function handleShopClick(clickX, clickY) {
  // 1. Sprawdź kliknięcie w przycisk zamknięcia [X]
  if (chestShopModal.closeBtnBounds) {
    const cb = chestShopModal.closeBtnBounds;
    if (clickX >= cb.x && clickX <= cb.x + cb.w && clickY >= cb.y && clickY <= cb.y + cb.h) {
      closeChestShop();
      return true;
    }
  }

  // 2. Sprawdź kliknięcie poza oknem modalu (zamknięcie po kliknięciu w tło)
  if (chestShopModal.modalBounds) {
    const mb = chestShopModal.modalBounds;
    if (clickX < mb.x || clickX > mb.x + mb.w || clickY < mb.y || clickY > mb.y + mb.h) {
      closeChestShop();
      return true;
    }
  }

  // 3. Sprawdź kliknięcie w karty skrzyń / przyciski OTWÓRZ
  if (chestShopModal.cardBounds) {
    for (let c of chestShopModal.cardBounds) {
      const hitBtn = (clickX >= c.x && clickX <= c.x + c.w && clickY >= c.y && clickY <= c.y + c.h);
      const hitCard = (clickX >= c.cardX && clickX <= c.cardX + c.cardW && clickY >= c.cardY && clickY <= c.cardY + c.cardH);
      if (hitBtn || hitCard) {
        if (c.canAfford) {
          openChestTier(c.id);
        }
        return true;
      }
    }
  }
  return true;
}

// Obsługa Touch
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();

  if (chestModal.active) {
    if (chestModal.state === 'reward') {
      closeChestModal();
    }
    return;
  }

  if (chestShopModal.active) {
    const t = e.changedTouches[0];
    if (t) {
      handleShopClick(t.clientX, t.clientY);
    }
    return;
  }

  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    if (t.clientX >= 24 && t.clientX <= 224 && t.clientY >= 96 && t.clientY <= 140) {
      openChestShop();
      return;
    }
  }

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

// ==========================================
// SYSTEM SZYBKIEJ TELEPORTACJI DEWELOPERSKIEJ (ADMIN / DEBUG)
// ==========================================
export const BIOME_TELEPORT_TARGETS = {
  STADIUM: 0,
  DESERT: 800,
  WINTER: 1600,
  JUNGLE: 2400,
  HELL: 3200
};

export function teleportToDistance(meters) {
  const targetX = START_X + (meters * 14);

  // Gracz:
  player.x = targetX;
  player.y = GROUND_Y - player.h;
  player.vx = 0;
  player.vy = 0;
  player.isJumping = false;
  player.isSliding = false;
  player.isIntro = false;
  player.isCharging = false;
  player.isJumpCharging = false;
  player.kickState = 'IDLE';
  player.gaitMode = 'IDLE';

  // Piłka:
  ball.x = targetX + (30 * (player.facing || 1));
  ball.y = GROUND_Y - ball.radius;
  ball.vx = 0;
  ball.vy = 0;
  ball.spin = 0;
  ball.trail = [];

  // Natychmiastowe ustawienie kamery (Snap Camera - wyzerowanie interpolacji w tej klatce)
  camera.x = player.x;
  camera.targetX = player.x;
  camera.y = GROUND_Y;
  camera.targetY = GROUND_Y;

  // Bezpieczne czyszczenie cząsteczek pogodowych poprzednich biomów
  clearDesertSandstorm();
  clearWinterBlizzard();

  // Reset i wygenerowanie przeszkód pod docelowy biom
  resetObstacles();
  updateProceduralObstacles(targetX);
  updateProceduralBirds(targetX, GROUND_Y);

  // Aktualizacja dystansu
  updateDistance(targetX);
}

// Udostępnienie w obiekcie globalnym window do testów z konsoli
window.teleportToDistance = teleportToDistance;

// Obsługa panelu deweloperskiego na ekranie (Mobile / Debug UI)
const devPanelContainer = document.getElementById('dev-panel-container');
const devToggleBtn = document.getElementById('dev-toggle-btn');
const devMenu = document.getElementById('dev-menu');

export function toggleDevPanel() {
  if (!devMenu) return;
  const isHidden = devMenu.classList.toggle('dev-menu-hidden');
  if (devToggleBtn) {
    if (isHidden) {
      devToggleBtn.classList.remove('active');
    } else {
      devToggleBtn.classList.add('active');
    }
  }
}
window.toggleDevPanel = toggleDevPanel;

if (devToggleBtn) {
  devToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDevPanel();
  });
  devToggleBtn.addEventListener('touchstart', (e) => {
    e.stopPropagation();
  }, { passive: false });
}

if (devPanelContainer) {
  // Izolacja zdarzeń myszy i dotyku – zapobieganie przenikaniu do canvasu gry
  ['mousedown', 'touchstart', 'touchend', 'touchmove'].forEach((evtType) => {
    devPanelContainer.addEventListener(evtType, (e) => {
      e.stopPropagation();
    }, { passive: false });
  });
}

document.querySelectorAll('.dev-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const meters = parseInt(btn.getAttribute('data-meters'), 10);
    if (!isNaN(meters)) {
      teleportToDistance(meters);
    }
  });
  btn.addEventListener('touchend', (e) => {
    e.stopPropagation();
    e.preventDefault();
    const meters = parseInt(btn.getAttribute('data-meters'), 10);
    if (!isNaN(meters)) {
      teleportToDistance(meters);
    }
  });
});

// Klawiatura PC
window.addEventListener('keydown', (e) => {
  // Klawisz B (Otwarcie/zamknięcie sklepu skrzyń lub odebranie nagrody)
  if (e.code === 'KeyB') {
    if (chestModal.active && chestModal.state === 'reward') {
      closeChestModal();
    } else if (chestShopModal.active) {
      closeChestShop();
    } else if (!chestModal.active) {
      openChestShop();
    }
    return;
  }

  // Klawisz Escape (Zamknięcie sklepu lub odebranie nagrody)
  if (e.code === 'Escape') {
    if (chestModal.active && chestModal.state === 'reward') {
      closeChestModal();
    } else if (chestShopModal.active) {
      closeChestShop();
    }
    return;
  }

  // Spacja do odbioru nagrody gdy modal jest w stanie 'reward'
  if (e.code === 'Space' && chestModal.active) {
    if (chestModal.state === 'reward') {
      closeChestModal();
    }
    return;
  }

  if (chestModal.active || chestShopModal.active) return; // Blokada sterowania podczas otwarcia skrzynki lub sklepu

  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
  if ((e.code === 'KeyW' || e.code === 'ArrowUp') && !keys.up) {
    keys.up = true;
    startJumpCharge();
  }
  if (e.code === 'Space' && !keys.space) {
    keys.space = true;
    startJumpCharge();
  }
  if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') && !keys.slide) {
    keys.slide = true;
    playerSlide(spawnGrass, GROUND_Y);
  }
  if (e.code === 'KeyR') resetBallToPlayer(player, GROUND_Y);

  // Szybka teleportacja do biomów (1: Stadion, 2: Pustynia, 3: Zima, 4: Dżungla, 5: Piekło)
  if (e.code === 'Digit1' || e.code === 'Numpad1' || e.key === '1') {
    teleportToDistance(BIOME_TELEPORT_TARGETS.STADIUM);
  } else if (e.code === 'Digit2' || e.code === 'Numpad2' || e.key === '2') {
    teleportToDistance(BIOME_TELEPORT_TARGETS.DESERT);
  } else if (e.code === 'Digit3' || e.code === 'Numpad3' || e.key === '3') {
    teleportToDistance(BIOME_TELEPORT_TARGETS.WINTER);
  } else if (e.code === 'Digit4' || e.code === 'Numpad4' || e.key === '4') {
    teleportToDistance(BIOME_TELEPORT_TARGETS.JUNGLE);
  } else if (e.code === 'Digit5' || e.code === 'Numpad5' || e.key === '5') {
    teleportToDistance(BIOME_TELEPORT_TARGETS.HELL);
  } else if (e.code === 'Backquote' || e.key === '`' || e.key === '~') {
    toggleDevPanel();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;
  if (e.code === 'KeyW' || e.code === 'ArrowUp') {
    keys.up = false;
    executeReleaseJump(spawnGrass);
  }
  if (e.code === 'Space') {
    keys.space = false;
    executeReleaseJump(spawnGrass);
  }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') keys.slide = false;
});

// Mysz PC (Strzał / Wykop przez LPM oraz obsługa przycisków ekranowych)
canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return; // Tylko Lewy Przycisk Myszy (LPM)

  if (chestModal.active) {
    if (chestModal.state === 'reward') {
      closeChestModal();
    }
    return;
  }

  if (chestShopModal.active) {
    handleShopClick(e.clientX, e.clientY);
    return;
  }

  // Kliknięcie w przycisk sklepu skrzyń w HUD (btnX: 24, btnY: 104, btnW: 190, btnH: 32)
  if (e.clientX >= 24 && e.clientX <= 224 && e.clientY >= 96 && e.clientY <= 140) {
    openChestShop();
    return;
  }

  if (dist(e.clientX, e.clientY, btnCluster.jump.x, btnCluster.jump.y) < btnCluster.jump.r) {
    startJumpCharge();
  } else if (dist(e.clientX, e.clientY, btnCluster.kick.x, btnCluster.kick.y) < btnCluster.kick.r) {
    startKickCharge();
  } else if (dist(e.clientX, e.clientY, btnCluster.slide.x, btnCluster.slide.y) < btnCluster.slide.r) {
    playerSlide(spawnGrass, GROUND_Y);
  } else {
    // Wciśnięcie LPM na obszarze gry (poza wirtualnymi przyciskami dotykowymi): ładowanie strzału
    startKickCharge();
  }
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 0 || e.button === undefined) {
    if (player.isCharging) executeReleaseKick();
    if (player.isJumpCharging) executeReleaseJump(spawnGrass);
  }
});

// Aktualizacja stanu gry
function update() {
  if (chestModal.active || chestShopModal.active) return; // Pauza gry podczas otwierania skrzynki lub sklepu
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

  // Świat gry w przestrzeni kamery
  ctx.save();
  ctx.translate(W * 0.40, H * 0.68);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  const worldLeft = camera.x - (W / camera.zoom);
  const worldRight = camera.x + (W / camera.zoom) * 2;
  const worldWidth = worldRight - worldLeft;

  // Murawa i cząsteczki darni
  drawGround(ctx, worldLeft, worldWidth);
  drawParticles(ctx);

  // Metry
  drawDistanceMarkers(ctx, worldLeft, worldRight);

  // Obiekty świata gry
  drawObstacles(ctx, GROUND_Y);
  drawPlayer(ctx, GROUND_Y);
  drawBall(ctx);

  // Przednia warstwa stadionu (filary bram przesłaniające gracza, konfetti, snopy jupiterów)
  drawStadiumForeground(ctx, worldLeft, worldRight);

  ctx.restore();

  // Interfejs użytkownika i kontrolki
  drawHUD(ctx, player, leftStick, btnCluster);
}

// Stała blokada do 60 Hz (identyczna prędkość na monitorach 60Hz, 120Hz, 144Hz, 165Hz, 240Hz+)
let lastTime = performance.now();

function loop() {
  requestAnimationFrame(loop);

  const now = performance.now();
  const delta = now - lastTime;

  // Odrzucenie nadmiarowych wywołań na ekranach 165Hz (i innych high-refresh rate)
  if (delta < FRAME_DURATION - 0.5) {
    return;
  }

  // Zabezpieczenie przed uśpieniem karty lub dużym opóźnieniem ("Spiral of Death")
  if (delta > 250) {
    lastTime = now;
  } else {
    lastTime += FRAME_DURATION;
    if (now - lastTime > FRAME_DURATION) {
      lastTime = now;
    }
  }

  update();
  draw();
}

// Uruchomienie pętli gry
requestAnimationFrame(loop);