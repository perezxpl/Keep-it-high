import { CONFIG, FRAME_DURATION, START_X } from './config.js';
import {
  canvas, ctx, W, H, GROUND_Y, camera,
  initCanvas, resize, updateCamera, updateDistance,
  spawnGrass, updateParticles, dist,
  drawSky, drawGround, drawParticles, drawDistanceMarkers, drawHUD,
  drawEntityHealthBar,
  clearDesertSandstorm, clearWinterBlizzard,
  isTouchDevice, setTouchDevice,
  jetpackParticles, spawnJetpackSparks, updateJetpackParticles, drawJetpackParticles
} from './world.js';
import {
  player, playerJump, playerSlide, startJumpCharge, executeReleaseJump,
  startKickCharge, executeReleaseKick,
  updatePlayer, drawPlayer, setPlayerClass
} from './player.js';
import {
  ball, resetBallToPlayer, updateBall, checkBallPlayerCollisions, drawBall
} from './ball.js';
import {
  obstacles, checkObstacleCollisions, checkPlayerPlatformLanding, drawObstacles, resetObstacles,
  updateProceduralObstacles, updateProceduralBirds, switchArena, activeArenaId,
  customObstacles, OBSTACLE_PALETTE, getObstacleDef, clearCustomObstacles, undoCustomObstacle,
  drawSingleObstacleByType
} from './obstacles.js';
import { CLASSES } from './classes/index.js';
import { bot, botKeys, updateBotBrain } from './bot.js';
import { WEAPONS, updateBullets, drawBullets, shootWeapon } from './weapons.js';

// =========================================================================
// STAN MYSZY I BLOKADA MENU KONTEKSTOWEGO
// =========================================================================
export const mouseState = {
  lmbDown: false,
  rmbDown: false,
  semiFired: false
};

window.addEventListener('contextmenu', (e) => e.preventDefault());

export const leftStick = {
  active: false,
  id: null,
  baseX: 0,
  baseY: 0,
  curX: 0,
  curY: 0,
  axisX: 0,
  axisY: 0,
  maxRadius: 55,

  // Skok i obsługa jetpacka na lewym drążku
  jumpTriggered: false,
  waitingForJetpackTap: false,
  jetpackWindowTimer: 0,
  isJetpacking: false
};

export const rightStick = {
  active: false,
  id: null,
  baseX: 0,
  baseY: 0,
  curX: 0,
  curY: 0,
  axisX: 0,
  axisY: 0,
  maxRadius: 65,

  // Tryb strzelania i okno 300 ms po wycelowaniu
  isShooting: false,
  waitingForSecondTap: false,
  windowTimer: 0,
  lingerAlpha: 0,

  // Maszyna stanów gestu wykopu (Wypchnięcie -> Cofnięcie -> Wypchnięcie)
  gestureState: 'IDLE',
  gestureLastOutTime: 0,
  gestureRetractTime: 0,
  gestureCooldownUntil: 0
};

// Przyciski dotykowe (usunięto przycisk SKOK - po prawej stronie pozostał tylko WŚLIZG)
const btnCluster = {
  slide: { x: 0, y: 0, r: 30, active: false, id: null }
};

const keys = { left: false, right: false, down: false, up: false, space: false, slide: false };

function updateButtonLayout() {
  btnCluster.slide.x = W - 60;
  btnCluster.slide.y = H - 85;
}

const canvasEl = document.getElementById('game');
initCanvas(canvasEl);
if (canvas) {
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
} else if (canvasEl) {
  canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());
}
resize(player);
updateButtonLayout();
resetBallToPlayer(player, GROUND_Y);

window.addEventListener('resize', () => {
  resize(player);
  updateButtonLayout();
});

window.addEventListener('touchstart', () => {
  setTouchDevice(true);
}, { once: true });

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  setTouchDevice(true);
  const midX = W / 2;

  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];

    // =======================================================================
    // LEWA STRONA EKRANU: RUCH, SKOK I JETPACK
    // =======================================================================
    if (t.clientX < midX && !leftStick.active) {
      leftStick.active = true;
      leftStick.id = t.identifier;
      leftStick.baseX = t.clientX;
      leftStick.baseY = t.clientY;
      leftStick.curX = t.clientX;
      leftStick.curY = t.clientY;
      leftStick.axisX = 0;
      leftStick.axisY = 0;

      // Sprawdzenie: Czy kliknięcie nastąpiło w oknie 300 ms dla Jetpacka?
      if (leftStick.waitingForJetpackTap && leftStick.jetpackWindowTimer > 0) {
        leftStick.isJetpacking = true;
        leftStick.waitingForJetpackTap = false;
        leftStick.jetpackWindowTimer = 0;
      } else {
        leftStick.isJetpacking = false;
        leftStick.waitingForJetpackTap = false;
        leftStick.jetpackWindowTimer = 0;
      }
    }

    // =======================================================================
    // PRAWA STRONA EKRANU: WŚLIZG, CELOWANIE, STRZAŁ I GEST KOPNIĘCIA
    // =======================================================================
    if (t.clientX >= midX) {
      if (dist(t.clientX, t.clientY, btnCluster.slide.x, btnCluster.slide.y) < btnCluster.slide.r + 14) {
        btnCluster.slide.active = true;
        btnCluster.slide.id = t.identifier;
        playerSlide(spawnGrass, GROUND_Y);
      } else if (!rightStick.active) {
        // Czy kliknięto w oknie 300 ms od wycelowania -> Rozpoczęcie ognia ciągłego
        if (rightStick.waitingForSecondTap && rightStick.windowTimer > 0) {
          rightStick.active = true;
          rightStick.id = t.identifier;
          rightStick.isShooting = true;
          rightStick.waitingForSecondTap = false;
          rightStick.windowTimer = 0;
          rightStick.lingerAlpha = 1.0;
          rightStick.curX = t.clientX;
          rightStick.curY = t.clientY;
          player.isAiming = true;
          player.isShooting = true;

          // Korekta celownika w kierunku nowego dotknięcia względem bazy drążka
          const dx = t.clientX - rightStick.baseX;
          const dy = t.clientY - rightStick.baseY;
          const sDist = Math.hypot(dx, dy);
          if (sDist > 6) {
            rightStick.axisX = dx / sDist;
            rightStick.axisY = dy / sDist;
            const maxR = rightStick.maxRadius || 65;
            const aimDist = 180 + Math.min(1.0, (sDist - 6) / (maxR - 6)) * 120;
            player.aimOffsetX = rightStick.axisX * aimDist;
            player.aimOffsetY = rightStick.axisY * aimDist;
          }

          const curWep = player.currentWeapon || WEAPONS.AK47;
          if (player.shootCooldown <= 0) {
            shootWeapon(player, curWep);
          }
        } else {
          // Nowy cykl celowania
          rightStick.active = true;
          rightStick.id = t.identifier;
          rightStick.baseX = t.clientX;
          rightStick.baseY = t.clientY;
          rightStick.curX = t.clientX;
          rightStick.curY = t.clientY;
          rightStick.axisX = 0;
          rightStick.axisY = 0;
          rightStick.isShooting = false;
          rightStick.waitingForSecondTap = false;
          rightStick.windowTimer = 0;
          rightStick.lingerAlpha = 1.0;
          rightStick.gestureState = 'IDLE';

          player.isAiming = true;
          const defaultAimDist = 180;
          player.aimOffsetX = (player.facing || 1) * defaultAimDist;
          player.aimOffsetY = -20;
        }
      }
    }
  }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];

    // Obsługa lewego drążka
    if (leftStick.active && t.identifier === leftStick.id) {
      leftStick.curX = t.clientX;
      leftStick.curY = t.clientY;
      const dx = leftStick.curX - leftStick.baseX;
      const dy = leftStick.curY - leftStick.baseY;
      const sDist = Math.hypot(dx, dy);
      const deadzone = 5;
      const maxR = leftStick.maxRadius || 55;

      if (sDist > deadzone) {
        const factor = Math.min(1.0, (sDist - deadzone) / (maxR - deadzone));
        leftStick.axisX = (dx / sDist) * factor;
        leftStick.axisY = (dy / sDist) * factor;
      } else {
        leftStick.axisX = 0;
        leftStick.axisY = 0;
      }

      // 1. Skok przy mocnym wychyleniu lewego drążka w górę
      if (leftStick.axisY < -0.55 && !leftStick.jumpTriggered && !player.isJumping && !player.isSliding && !player.isIntro) {
        const jumpForce = player.currentClass?.stats?.jumpForce || CONFIG.JUMP_FORCE;
        player.vy = -jumpForce;
        player.isJumping = true;
        player.isCrouching = false;
        player.airVx = player.vx;
        leftStick.jumpTriggered = true;
        if (spawnGrass && player.groundY) {
          spawnGrass(player.x + player.w / 2, player.groundY, player.facing);
        }
      } else if (leftStick.axisY > -0.25) {
        leftStick.jumpTriggered = false;
      }

      // 2. Jetpack: aktywny podczas trybu isJetpacking przy wychyleniu w górę (axisY < -0.15)
      if (leftStick.isJetpacking) {
        if (leftStick.axisY < -0.15 && (player.jetFuel || 0) > 0) {
          isJetpackActive = true;
        } else {
          isJetpackActive = false;
        }
      }
    }

    // Obsługa prawego drążka (celowanie + dynamiczne korygowanie ognia)
    if (rightStick.active && t.identifier === rightStick.id) {
      rightStick.curX = t.clientX;
      rightStick.curY = t.clientY;
      const dx = rightStick.curX - rightStick.baseX;
      const dy = rightStick.curY - rightStick.baseY;
      const sDist = Math.hypot(dx, dy);
      const deadzone = 6;
      const maxR = rightStick.maxRadius || 65;

      if (sDist > deadzone) {
        rightStick.axisX = dx / sDist;
        rightStick.axisY = dy / sDist;
        const aimDist = 180 + Math.min(1.0, (sDist - deadzone) / (maxR - deadzone)) * 120;
        player.aimOffsetX = rightStick.axisX * aimDist;
        player.aimOffsetY = rightStick.axisY * aimDist;
        player.isAiming = true;
      }

      // Detekcja gestu kopnięcia (Wychylenie -> Cofnięcie do osi -> Wypchnięcie)
      if (!rightStick.isShooting) {
        const now = performance.now();
        const outerThreshold = 36;
        const innerThreshold = 15;

        if (sDist > outerThreshold) {
          if (rightStick.gestureState === 'RETRACTED' && (now - rightStick.gestureRetractTime < 280)) {
            executeReleaseKick(ball, player, 0.95);
            rightStick.gestureState = 'COOLDOWN';
            rightStick.gestureCooldownUntil = now + 350;
            rightStick.isShooting = false;
            rightStick.waitingForSecondTap = false;
          } else if (rightStick.gestureState !== 'COOLDOWN' || now > rightStick.gestureCooldownUntil) {
            rightStick.gestureState = 'OUTER';
            rightStick.gestureLastOutTime = now;
          }
        } else if (sDist < innerThreshold) {
          if (rightStick.gestureState === 'OUTER' && (now - rightStick.gestureLastOutTime < 240)) {
            rightStick.gestureState = 'RETRACTED';
            rightStick.gestureRetractTime = now;
          }
        }
      }
    }
  }
}, { passive: false });

function endTouch(e) {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];

    // Puszczenie lewego drążka
    if (leftStick.active && t.identifier === leftStick.id) {
      leftStick.active = false;
      leftStick.id = null;

      const hadUpwardMotion = (leftStick.axisY < -0.40) || leftStick.jumpTriggered;

      if (leftStick.isJetpacking) {
        leftStick.isJetpacking = false;
        isJetpackActive = false;
        leftStick.waitingForJetpackTap = false;
        leftStick.jetpackWindowTimer = 0;
      } else if (hadUpwardMotion) {
        leftStick.waitingForJetpackTap = true;
        leftStick.jetpackWindowTimer = 300;
      }

      leftStick.axisX = 0;
      leftStick.axisY = 0;
      leftStick.jumpTriggered = false;
    }

    if (btnCluster.slide.active && t.identifier === btnCluster.slide.id) {
      btnCluster.slide.active = false;
      btnCluster.slide.id = null;
    }

    // Puszczenie prawego drążka
    if (rightStick.active && t.identifier === rightStick.id) {
      rightStick.active = false;
      rightStick.id = null;
      rightStick.axisX = 0;
      rightStick.axisY = 0;

      rightStick.isShooting = false;
      player.isShooting = false;
      player.isAiming = false;

      // Okno 300 ms na powtórny tap dla strzelania serią
      rightStick.waitingForSecondTap = true;
      rightStick.windowTimer = 300;
      rightStick.lingerAlpha = 1.0;
      rightStick.gestureState = 'IDLE';
    }
  }
}
canvas.addEventListener('touchend', endTouch, { passive: false });
canvas.addEventListener('touchcancel', endTouch, { passive: false });

export const BIOME_TELEPORT_TARGETS = {
  STADIUM: 0,
  DESERT: 800,
  WINTER: 1600,
  JUNGLE: 2400,
  HELL: 3200
};

export function teleportToDistance(meters) {
  const targetX = START_X + (meters * 14);

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
  isJetpackActive = false;

  ball.x = targetX + (30 * (player.facing || 1));
  ball.y = GROUND_Y - ball.radius;
  ball.vx = 0;
  ball.vy = 0;
  ball.spin = 0;
  ball.trail = [];

  camera.x = player.x;
  camera.targetX = player.x;
  camera.y = GROUND_Y;
  camera.targetY = GROUND_Y;

  clearDesertSandstorm();
  clearWinterBlizzard();

  resetObstacles();
  updateProceduralObstacles(targetX);
  updateProceduralBirds(targetX, GROUND_Y);
  updateDistance(targetX);
}

export function devSetClass(target) {
  let targetClass = null;
  if (typeof target === 'object') targetClass = target;
  else if (typeof target === 'string') targetClass = CLASSES[target.toUpperCase()];
  else if (typeof target === 'number') {
    const keys = Object.keys(CLASSES);
    targetClass = CLASSES[keys[target % keys.length]];
  }

  if (targetClass) {
    setPlayerClass(targetClass);
  }
}

window.teleportToDistance = teleportToDistance;
window.devSetClass = devSetClass;
window.setPlayerClass = setPlayerClass;

const devPanelContainer = document.getElementById('dev-panel-container');
const devToggleBtn = document.getElementById('dev-toggle-btn');
const devMenu = document.getElementById('dev-menu');

export function toggleDevPanel() {
  if (!devMenu) return;
  const isHidden = devMenu.classList.toggle('dev-menu-hidden');
  if (devToggleBtn) {
    if (isHidden) devToggleBtn.classList.remove('active');
    else devToggleBtn.classList.add('active');
  }
}
window.toggleDevPanel = toggleDevPanel;

let isDraggingDev = false;
let devDragStartX = 0;
let devDragStartY = 0;
let devPanelStartLeft = 0;
let devPanelStartTop = 0;
let devHasMoved = false;

if (devToggleBtn && devPanelContainer) {
  devToggleBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    isDraggingDev = true;
    devHasMoved = false;
    devDragStartX = e.clientX;
    devDragStartY = e.clientY;
    devPanelStartLeft = devPanelContainer.offsetLeft;
    devPanelStartTop = devPanelContainer.offsetTop;
    try { devToggleBtn.setPointerCapture(e.pointerId); } catch (err) { }
  });

  devToggleBtn.addEventListener('pointermove', (e) => {
    if (!isDraggingDev) return;
    e.stopPropagation();
    const dx = e.clientX - devDragStartX;
    const dy = e.clientY - devDragStartY;
    if (!devHasMoved && Math.hypot(dx, dy) >= 6) {
      devHasMoved = true;
    }
    if (devHasMoved) {
      const newLeft = devPanelStartLeft + dx;
      const newTop = devPanelStartTop + dy;
      const maxLeft = Math.max(10, window.innerWidth - devToggleBtn.offsetWidth - 10);
      const maxTop = Math.max(10, window.innerHeight - devToggleBtn.offsetHeight - 10);
      devPanelContainer.style.left = Math.max(8, Math.min(maxLeft, newLeft)) + 'px';
      devPanelContainer.style.top = Math.max(8, Math.min(maxTop, newTop)) + 'px';
    }
  });

  const handleDevPointerUp = (e) => {
    if (!isDraggingDev) return;
    e.stopPropagation();
    isDraggingDev = false;
    try { devToggleBtn.releasePointerCapture(e.pointerId); } catch (err) { }
    if (!devHasMoved) {
      toggleDevPanel();
    }
  };

  devToggleBtn.addEventListener('pointerup', handleDevPointerUp);
  devToggleBtn.addEventListener('pointercancel', handleDevPointerUp);

  devPanelContainer.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
}

document.querySelectorAll('.dev-btn[data-meters]').forEach((btn) => {
  const handler = (e) => {
    e.stopPropagation(); e.preventDefault();
    const meters = parseInt(btn.getAttribute('data-meters'), 10);
    if (!isNaN(meters)) teleportToDistance(meters);
  };
  btn.addEventListener('click', handler);
  btn.addEventListener('touchend', handler);
});

document.querySelectorAll('.dev-class-btn').forEach((btn) => {
  const handler = (e) => {
    e.stopPropagation(); e.preventDefault();
    const classId = btn.getAttribute('data-class');
    devSetClass(classId);
  };
  btn.addEventListener('click', handler);
  btn.addEventListener('touchend', handler);
});

const devBotToggleBtn = document.getElementById('dev-bot-toggle-btn');
if (devBotToggleBtn) {
  const toggleBot = (e) => {
    e.stopPropagation();
    e.preventDefault();
    bot.active = !bot.active;
    if (bot.active) {
      devBotToggleBtn.textContent = '🤖 BOT: ON';
      devBotToggleBtn.style.background = 'rgba(168, 85, 247, 0.35)';
      devBotToggleBtn.style.borderColor = '#c084fc';
      devBotToggleBtn.style.color = '#ffffff';
      devBotToggleBtn.style.boxShadow = '0 0 12px rgba(168, 85, 247, 0.6)';

      bot.x = player.x + (player.facing || 1) * 350;
      bot.y = GROUND_Y - bot.h;
      bot.vx = 0;
      bot.vy = 0;
      bot.facing = -(player.facing || 1);
      bot.isJumping = false;
      bot.isSliding = false;
      bot.isCharging = false;
      bot.kickState = 'IDLE';
      bot.gaitMode = 'IDLE';
      bot.dropThroughTimer = 0;
      bot.airVx = 0;
    } else {
      devBotToggleBtn.textContent = '🤖 BOT: OFF';
      devBotToggleBtn.style.background = '';
      devBotToggleBtn.style.borderColor = '#a855f7';
      devBotToggleBtn.style.color = '#c084fc';
      devBotToggleBtn.style.boxShadow = '';
    }
  };
  devBotToggleBtn.addEventListener('click', toggleBot);
  devBotToggleBtn.addEventListener('touchend', toggleBot);
}

const devArenaBtn = document.getElementById('dev-arena-btn');
if (devArenaBtn) {
  const toggleArena = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const nextArena = (activeArenaId === 'ARENA_1') ? 'ARENA_2' : 'ARENA_1';
    switchArena(nextArena, player, bot, ball);
    devArenaBtn.textContent = (activeArenaId === 'ARENA_2') ? '🏟️ Arena: 2' : '🏟️ Arena: 1';
    if (activeArenaId === 'ARENA_2') {
      devArenaBtn.style.background = 'rgba(6, 182, 212, 0.25)';
      devArenaBtn.style.borderColor = '#06b6d4';
      devArenaBtn.style.color = '#22d3ee';
      devArenaBtn.style.boxShadow = '0 0 12px rgba(6, 182, 212, 0.55)';
    } else {
      devArenaBtn.style.background = '';
      devArenaBtn.style.borderColor = '#06b6d4';
      devArenaBtn.style.color = '#22d3ee';
      devArenaBtn.style.boxShadow = '';
    }
    camera.x = player.x;
    camera.targetX = player.x;
    camera.y = player.y;
    camera.targetY = player.y;
    if (editorState.active) {
      renderEditorPalette();
    }
  };
  devArenaBtn.addEventListener('click', toggleArena);
  devArenaBtn.addEventListener('touchend', toggleArena);
}

// =========================================================================
// EDYTOR PRZESZKÓD (OBSTACLE EDITOR)
// =========================================================================
export const editorState = {
  active: false,
  selectedType: null,
  snapToGrid: true,
  gridSize: 20,
  hoverX: 0,
  hoverY: 0
};

let devEditorBtn = null;
let devEditorSubpanel = null;
let devGridBtn = null;
let devPaletteContainer = null;

export function initObstacleEditorUI() {
  const devMenu = document.getElementById('dev-menu');
  if (!devMenu) return;

  const sep = document.createElement('span');
  sep.style.cssText = 'color: rgba(255,255,255,0.25); margin: 0 3px;';
  sep.textContent = '|';
  devMenu.appendChild(sep);

  devEditorBtn = document.createElement('button');
  devEditorBtn.className = 'dev-btn';
  devEditorBtn.id = 'dev-editor-toggle-btn';
  devEditorBtn.title = 'Włącz / Wyłącz interaktywny Edytor Przeszkód na żywo';
  devEditorBtn.style.cssText = 'border-color: #10b981; color: #34d399; font-weight: 700;';
  devEditorBtn.textContent = '🏗️ EDYTOR: OFF';
  devMenu.appendChild(devEditorBtn);

  devEditorSubpanel = document.createElement('div');
  devEditorSubpanel.id = 'dev-editor-subpanel';
  devEditorSubpanel.style.cssText = 'display: none; align-items: center; gap: 4px; flex-wrap: wrap; margin-left: 2px;';

  devGridBtn = document.createElement('button');
  devGridBtn.className = 'dev-btn';
  devGridBtn.id = 'dev-grid-btn';
  devGridBtn.title = 'Włącz/Wyłącz przyciąganie do siatki (20px)';
  devGridBtn.style.cssText = 'border-color: #06b6d4; color: #22d3ee;';
  devGridBtn.textContent = '🧲 SIATKA: 20px';
  devGridBtn.addEventListener('click', (e) => {
    e.stopPropagation(); e.preventDefault();
    editorState.snapToGrid = !editorState.snapToGrid;
    devGridBtn.textContent = editorState.snapToGrid ? '🧲 SIATKA: 20px' : '🧲 SIATKA: WYŁ';
    devGridBtn.style.color = editorState.snapToGrid ? '#22d3ee' : '#94a3b8';
  });
  devEditorSubpanel.appendChild(devGridBtn);

  devPaletteContainer = document.createElement('div');
  devPaletteContainer.style.cssText = 'display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap;';
  devEditorSubpanel.appendChild(devPaletteContainer);

  const undoBtn = document.createElement('button');
  undoBtn.className = 'dev-btn';
  undoBtn.title = 'Cofnij ostatnio postawiony obiekt (Ctrl+Z)';
  undoBtn.textContent = '↩️ COFNIJ OSTATNIĄ';
  undoBtn.addEventListener('click', (e) => {
    e.stopPropagation(); e.preventDefault();
    undoCustomObstacle();
  });
  devEditorSubpanel.appendChild(undoBtn);

  const clearBtn = document.createElement('button');
  clearBtn.className = 'dev-btn';
  clearBtn.title = 'Wyczyść wszystkie postawione przeszkody';
  clearBtn.style.cssText = 'border-color: rgba(239, 68, 68, 0.4); color: #ef4444;';
  clearBtn.textContent = '🗑️ WYCZYŚĆ WSZYSTKO';
  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation(); e.preventDefault();
    clearCustomObstacles();
  });
  devEditorSubpanel.appendChild(clearBtn);

  const copyBtn = document.createElement('button');
  copyBtn.className = 'dev-btn';
  copyBtn.title = 'Skopiuj aktualny układ postawionych przeszkód do schowka jako JSON';
  copyBtn.style.cssText = 'border-color: #a855f7; color: #c084fc; font-weight: 600;';
  copyBtn.textContent = '📋 KOPIUJ UKŁAD (JSON)';
  copyBtn.addEventListener('click', (e) => {
    e.stopPropagation(); e.preventDefault();
    const jsonStr = JSON.stringify(customObstacles, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(jsonStr).then(() => {
        copyBtn.textContent = '✅ SKOPIOWANO!';
        copyBtn.style.color = '#34d399';
        setTimeout(() => {
          copyBtn.textContent = '📋 KOPIUJ UKŁAD (JSON)';
          copyBtn.style.color = '#c084fc';
        }, 1800);
      }).catch(() => {
        prompt('Skopiuj JSON układu przeszkód:', jsonStr);
      });
    } else {
      prompt('Skopiuj JSON układu przeszkód:', jsonStr);
    }
  });
  devEditorSubpanel.appendChild(copyBtn);

  devMenu.appendChild(devEditorSubpanel);

  const toggleEditor = (e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    editorState.active = !editorState.active;
    if (editorState.active) {
      devEditorBtn.textContent = '🏗️ EDYTOR: ON';
      devEditorBtn.style.background = 'rgba(168, 85, 247, 0.3)';
      devEditorBtn.style.borderColor = '#c084fc';
      devEditorBtn.style.color = '#ffffff';
      devEditorBtn.style.boxShadow = '0 0 12px rgba(168, 85, 247, 0.55)';
      devEditorSubpanel.style.display = 'inline-flex';
      renderEditorPalette();
    } else {
      devEditorBtn.textContent = '🏗️ EDYTOR: OFF';
      devEditorBtn.style.background = '';
      devEditorBtn.style.borderColor = '#10b981';
      devEditorBtn.style.color = '#34d399';
      devEditorBtn.style.boxShadow = '';
      devEditorSubpanel.style.display = 'none';
      editorState.selectedType = null;
    }
  };

  devEditorBtn.addEventListener('click', toggleEditor);
  devEditorBtn.addEventListener('touchend', toggleEditor);

  renderEditorPalette();
}

export function renderEditorPalette() {
  if (!devPaletteContainer) return;
  devPaletteContainer.innerHTML = '';

  const arenaKey = (activeArenaId === 'ARENA_2') ? 'ARENA_2' : 'ARENA_1';
  const palette = OBSTACLE_PALETTE[arenaKey] || OBSTACLE_PALETTE.ARENA_1;

  const catTitles = arenaKey === 'ARENA_2' ? {
    platforms: '⚡ Kładki / Podesty',
    defense: '🗼 Piony / Osłony',
    traps: '🚀 Interaktywne / Energia'
  } : {
    platforms: '🪜 Kładki / Wieże',
    defense: '🛡️ Mury / Osłony',
    traps: '💥 Interaktywne / Pułapki'
  };

  const categories = ['platforms', 'defense', 'traps'];

  for (const cat of categories) {
    const items = palette.filter(p => p.category === cat);
    if (items.length === 0) continue;

    const catGroup = document.createElement('div');
    catGroup.style.cssText = 'display: inline-flex; align-items: center; gap: 3px; background: rgba(15, 23, 42, 0.65); padding: 2px 5px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.08); margin: 1px 2px;';

    const catBadge = document.createElement('span');
    catBadge.style.cssText = 'font-size: 8.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-right: 2px; white-space: nowrap;';
    catBadge.textContent = catTitles[cat] || cat;
    catGroup.appendChild(catBadge);

    for (const item of items) {
      const btn = document.createElement('button');
      btn.className = 'dev-btn dev-tool-btn';
      btn.dataset.tool = item.type;
      btn.title = item.name + ` (${item.w}x${item.h})`;
      btn.textContent = item.label || item.name;

      btn.addEventListener('click', (e) => {
        e.stopPropagation(); e.preventDefault();
        if (editorState.selectedType === item.type) {
          editorState.selectedType = null;
        } else {
          editorState.selectedType = item.type;
        }
        updateEditorPaletteHighlight();
      });

      catGroup.appendChild(btn);
    }

    devPaletteContainer.appendChild(catGroup);
  }

  updateEditorPaletteHighlight();
}

export function updateEditorPaletteHighlight() {
  if (!devPaletteContainer) return;
  const buttons = devPaletteContainer.querySelectorAll('.dev-tool-btn');
  buttons.forEach(btn => {
    if (btn.dataset.tool === editorState.selectedType) {
      btn.style.background = 'rgba(0, 229, 255, 0.35)';
      btn.style.borderColor = '#00e5ff';
      btn.style.color = '#ffffff';
      btn.style.boxShadow = '0 0 10px rgba(0, 229, 255, 0.6)';
    } else {
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
      btn.style.boxShadow = '';
    }
  });
}

function placeSelectedObstacle() {
  if (!editorState.selectedType) return;
  const def = getObstacleDef(editorState.selectedType);
  if (!def) return;

  const w = def.w || 40;
  const h = def.h || 20;
  let px = editorState.hoverX - w / 2;
  let py = editorState.hoverY - h / 2;
  if (editorState.snapToGrid) {
    px = Math.round(px / editorState.gridSize) * editorState.gridSize;
    py = Math.round(py / editorState.gridSize) * editorState.gridSize;
  }

  const newObs = {
    id: 'custom_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    type: def.type,
    x: px,
    y: py,
    w: w,
    h: h,
    size: def.size || w,
    relY: GROUND_Y - py,
    thickness: h
  };

  customObstacles.push(newObs);
  spawnJetpackSparks(px + w / 2, py + h / 2, 0, 4);
}

function handleEditorRightClick() {
  const worldX = camera.x + (mouseScreenX - W * 0.40) / camera.zoom;
  const worldY = camera.y + (mouseScreenY - H * 0.68) / camera.zoom;

  for (let i = customObstacles.length - 1; i >= 0; i--) {
    const obs = customObstacles[i];
    const topY = obs.y !== undefined ? obs.y : (GROUND_Y - obs.relY);
    if (worldX >= obs.x - 10 && worldX <= obs.x + obs.w + 10 &&
      worldY >= topY - 10 && worldY <= topY + obs.h + 10) {
      spawnJetpackSparks(obs.x + obs.w / 2, topY + obs.h / 2, 0, 6);
      customObstacles.splice(i, 1);
      return;
    }
  }

  editorState.selectedType = null;
  updateEditorPaletteHighlight();
}

initObstacleEditorUI();

let jumpKeyPressed = false;
let lastWPressTime = 0;
let isJetpackActive = false;
const DOUBLE_TAP_WINDOW_MS = 280;

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;

  if ((e.code === 'KeyW' || e.code === 'ArrowUp') && !jumpKeyPressed) {
    jumpKeyPressed = true;

    const now = performance.now();
    if (now - lastWPressTime < DOUBLE_TAP_WINDOW_MS && (player.jetFuel || 0) > 5) {
      isJetpackActive = true;
    }
    lastWPressTime = now;

    if (!player.isJumping && !player.isSliding && !player.isIntro) {
      const jumpForce = player.currentClass?.stats?.jumpForce || CONFIG.JUMP_FORCE;
      player.vy = -jumpForce;
      player.isJumping = true;
      player.isCrouching = false;
      player.airVx = player.vx;
      keys.up = false;
      if (spawnGrass && player.groundY) {
        spawnGrass(player.x + player.w / 2, player.groundY, player.facing);
      }
    }
  }
  if (e.code === 'Space' && !keys.space) {
    keys.space = true;
    startKickCharge();
  }
  if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') && !keys.slide) {
    keys.slide = true;
    playerSlide(spawnGrass, GROUND_Y);
  }
  if (e.code === 'KeyR') resetBallToPlayer(player, GROUND_Y);

  if (e.code === 'Digit1' || e.code === 'Numpad1' || e.key === '1') {
    player.currentWeapon = WEAPONS.AK47;
  } else if (e.code === 'Digit2' || e.code === 'Numpad2' || e.key === '2') {
    player.currentWeapon = WEAPONS.SHOTGUN;
  } else if (e.code === 'Digit3' || e.code === 'Numpad3' || e.key === '3') {
    teleportToDistance(BIOME_TELEPORT_TARGETS.WINTER);
  } else if (e.code === 'Digit4' || e.code === 'Numpad4' || e.key === '4') {
    teleportToDistance(BIOME_TELEPORT_TARGETS.JUNGLE);
  } else if (e.code === 'Digit5' || e.code === 'Numpad5' || e.key === '5') {
    teleportToDistance(BIOME_TELEPORT_TARGETS.HELL);
  }

  if (e.code === 'Digit6' || e.code === 'Numpad6' || e.key === '6') devSetClass('PLAYMAKER');
  else if (e.code === 'Digit7' || e.code === 'Numpad7' || e.key === '7') devSetClass('ENFORCER');
  else if (e.code === 'Digit8' || e.code === 'Numpad8' || e.key === '8') devSetClass('AERO');
  else if (e.code === 'Digit9' || e.code === 'Numpad9' || e.key === '9') devSetClass('SWEEPER');

  if (e.code === 'Backquote' || e.key === '`' || e.key === '~') toggleDevPanel();

  if (e.code === 'Escape') {
    if (editorState.active) {
      if (editorState.selectedType) {
        editorState.selectedType = null;
        updateEditorPaletteHighlight();
      }
    }
  }
  if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) {
    if (editorState.active) {
      undoCustomObstacle();
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;

  if (e.code === 'KeyW' || e.code === 'ArrowUp') {
    jumpKeyPressed = false;
    keys.up = false;
    isJetpackActive = false;
  }
  if (e.code === 'Space') {
    keys.space = false;
    executeReleaseKick(ball, player);
  }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') keys.slide = false;
});

let mouseScreenX = W * 0.65;
let mouseScreenY = H * 0.45;

window.addEventListener('mousemove', (e) => {
  mouseScreenX = e.clientX;
  mouseScreenY = e.clientY;

  if (editorState.active) {
    const worldX = camera.x + (mouseScreenX - W * 0.40) / camera.zoom;
    const worldY = camera.y + (mouseScreenY - H * 0.68) / camera.zoom;
    if (editorState.snapToGrid) {
      editorState.hoverX = Math.round(worldX / editorState.gridSize) * editorState.gridSize;
      editorState.hoverY = Math.round(worldY / editorState.gridSize) * editorState.gridSize;
    } else {
      editorState.hoverX = Math.round(worldX);
      editorState.hoverY = Math.round(worldY);
    }
  }
});

canvas.addEventListener('mousedown', (e) => {
  mouseScreenX = e.clientX;
  mouseScreenY = e.clientY;

  if (editorState.active) {
    if (e.button === 0 && editorState.selectedType) {
      placeSelectedObstacle();
      return;
    }
    if (e.button === 2) {
      handleEditorRightClick();
      return;
    }
  }

  if (e.button === 0) {
    mouseState.lmbDown = true;
    mouseState.semiFired = false;
  } else if (e.button === 2) {
    mouseState.rmbDown = true;
    startKickCharge(player);
  }
});

window.addEventListener('mouseup', (e) => {
  if (editorState.active) {
    mouseState.lmbDown = false;
    mouseState.rmbDown = false;
    return;
  }
  if (e.button === 0) {
    mouseState.lmbDown = false;
    mouseState.semiFired = false;
  } else if (e.button === 2) {
    mouseState.rmbDown = false;
    executeReleaseKick(ball, player);
  }
});

let flickFirstDownTime = 0;
let flickReturnedToCenter = false;

function updateDoubleFlickDetection(axisY) {
  const now = performance.now();
  if (axisY > 0.65) {
    if (flickFirstDownTime > 0 && flickReturnedToCenter) {
      const dt = now - flickFirstDownTime;
      if (dt >= 80 && dt <= 350) {
        player.dropThroughTimer = 18;
        flickFirstDownTime = 0;
        flickReturnedToCenter = false;
      } else if (dt > 350) {
        flickFirstDownTime = now;
        flickReturnedToCenter = false;
      }
    } else if (flickFirstDownTime === 0) {
      flickFirstDownTime = now;
      flickReturnedToCenter = false;
    }
  } else if (axisY < 0.25) {
    if (flickFirstDownTime > 0) {
      flickReturnedToCenter = true;
    }
  }

  if (flickFirstDownTime > 0 && (now - flickFirstDownTime > 400)) {
    flickFirstDownTime = 0;
    flickReturnedToCenter = false;
  }
}

function drawCrosshair(ctx, x, y, customCol) {
  if (typeof x !== 'number' || isNaN(x)) return;
  const col = customCol || player.currentClass?.visuals?.crosshairColor || '#38bdf8';

  const kick = player.weaponKickback || 0;
  const rise = player.muzzleRise || 0;
  const spreadGap = Math.min(18, 4 + kick * 1.5 + rise * 16);

  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.arc(x, y, 7 + spreadGap * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - spreadGap - 7, y); ctx.lineTo(x - spreadGap, y);
  ctx.moveTo(x + spreadGap, y); ctx.lineTo(x + spreadGap + 7, y);
  ctx.moveTo(x, y - spreadGap - 7); ctx.lineTo(x, y - spreadGap);
  ctx.moveTo(x, y + spreadGap); ctx.lineTo(x, y + spreadGap + 7);
  ctx.stroke();

  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function update() {
  if (!isTouchDevice) {
    const worldMouseX = camera.x + (mouseScreenX - W * 0.40) / camera.zoom;
    const worldMouseY = camera.y + (mouseScreenY - H * 0.68) / camera.zoom;
    player.aimX = worldMouseX;
    player.aimY = worldMouseY;
  }

  // =========================================================================
  // CELOWNIK ZAWSZE PODĄŻAJĄCY ZA POSTACIĄ (BRAK PRZYKLEJENIA W ŚWIECIE)
  // =========================================================================
  if (isTouchDevice && !player.isDead) {
    const hipX = player.x + player.w / 2;
    const hipY = player.y + player.h / 2;

    if (typeof player.aimOffsetX !== 'number' || isNaN(player.aimOffsetX)) {
      player.aimOffsetX = (player.facing || 1) * 180;
      player.aimOffsetY = -20;
    }

    // Gdy drążek jest nieaktywny i nie trwa strzelanie, celownik obraca się ze zwrotem postaci
    if (!rightStick.active && !player.isShooting && !player.isAiming) {
      if (player.facing === 1 && player.aimOffsetX < 0) {
        player.aimOffsetX = Math.abs(player.aimOffsetX);
      } else if (player.facing === -1 && player.aimOffsetX > 0) {
        player.aimOffsetX = -Math.abs(player.aimOffsetX);
      }
    }

    // Kluczowe: celownik ZAWSZE w każdej klatce porusza się w świecie razem z pozycją gracza
    player.aimX = hipX + player.aimOffsetX;
    player.aimY = hipY + player.aimOffsetY;
  }

  // =========================================================================
  // OBSŁUGA OKIEN CZASOWYCH DRĄŻKÓW (300 MS)
  // =========================================================================
  if (leftStick.jetpackWindowTimer > 0) {
    leftStick.jetpackWindowTimer -= FRAME_DURATION;
    if (leftStick.jetpackWindowTimer <= 0) {
      leftStick.jetpackWindowTimer = 0;
      leftStick.waitingForJetpackTap = false;
    }
  }

  if (rightStick.windowTimer > 0) {
    rightStick.windowTimer -= FRAME_DURATION;
    rightStick.lingerAlpha = 1.0;
    if (rightStick.windowTimer <= 0) {
      rightStick.windowTimer = 0;
      rightStick.waitingForSecondTap = false;
      rightStick.lingerAlpha = 0;
    }
  }

  // =========================================================================
  // OBSŁUGA STRZELANIA GRACZA
  // =========================================================================
  const curWep = player.currentWeapon || WEAPONS.AK47;
  const isTouchFiring = rightStick.active && rightStick.isShooting && !player.isDead;
  const isHoldingFire = (mouseState.lmbDown || isTouchFiring) && !player.isDead;

  if (curWep.auto) {
    player.isShooting = isHoldingFire;
  } else {
    player.isShooting = isTouchFiring || (player.shootPoseTimer > 0);
  }

  if (isTouchFiring) {
    if (player.shootCooldown <= 0) {
      shootWeapon(player, curWep);
    }
  } else if (mouseState.lmbDown && !player.isDead && player.shootCooldown <= 0) {
    if (curWep.auto) {
      shootWeapon(player, curWep);
    } else {
      if (!mouseState.semiFired) {
        shootWeapon(player, curWep);
        mouseState.semiFired = true;
      }
    }
  }

  // =========================================================================
  // SILNIK JETPACKA (ZASILANY Z PC 'W' LUB LEWEGO DRĄŻKA DOTYKOWEGO)
  // =========================================================================
  if (isJetpackActive && !player.isDead) {
    if (player.jetFuel > 0) {
      player.jetFuel = Math.max(0, player.jetFuel - 0.95);
      player.vy = Math.max(-8.5, player.vy - 0.95);

      let inputAxisX = 0;
      if (keys.left) inputAxisX -= 1;
      if (keys.right) inputAxisX += 1;
      if (leftStick && leftStick.active && Math.abs(leftStick.axisX) > 0.05) {
        inputAxisX = leftStick.axisX;
      }

      if (Math.abs(inputAxisX) > 0.05) {
        player.vx += inputAxisX * 0.42;
        const maxAirVx = CONFIG.SPRINT_MAX * 1.1;
        player.vx = Math.max(-maxAirVx, Math.min(maxAirVx, player.vx));
        if (inputAxisX > 0.1) player.facing = 1;
        else if (inputAxisX < -0.1) player.facing = -1;
      }

      player.isJumping = true;
      player.isCrouching = false;

      const hipX = player.x + player.w / 2;
      const hipY = player.y + player.h - 40 + (player.pelvisY || 0);
      const nozzleX = hipX - (player.facing * 10);
      const nozzleY = hipY + 2;
      spawnJetpackSparks(nozzleX, nozzleY, player.facing, 2);
    } else {
      isJetpackActive = false;
      leftStick.isJetpacking = false;
    }
  }

  if (leftStick && leftStick.active) {
    updateDoubleFlickDetection(leftStick.axisY);
  }

  updatePlayer(keys, leftStick, GROUND_Y, ball, spawnGrass, player);
  updateParticles();
  updateJetpackParticles();
  updateBall(GROUND_Y);
  checkBallPlayerCollisions(player, GROUND_Y, spawnGrass);
  checkObstacleCollisions(ball, GROUND_Y, player);

  if (bot.active) {
    updateBotBrain(ball, player, GROUND_Y, spawnGrass);
    checkBallPlayerCollisions(bot, GROUND_Y, spawnGrass);
    checkPlayerPlatformLanding(bot, GROUND_Y);
  }

  const combatants = bot.active ? [player, bot] : [player];
  updateBullets(GROUND_Y, obstacles, ball, combatants);

  updateCamera(player, ball);
  updateDistance(ball.x);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawSky(ctx);

  ctx.save();
  ctx.translate(W * 0.40, H * 0.68);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  const worldLeft = camera.x - (W / camera.zoom);
  const worldRight = camera.x + (W / camera.zoom) * 2;
  const worldWidth = worldRight - worldLeft;

  drawGround(ctx, worldLeft, worldWidth);
  drawParticles(ctx);
  drawDistanceMarkers(ctx, worldLeft, worldRight);
  drawObstacles(ctx, GROUND_Y);

  if (editorState.active) {
    if (editorState.snapToGrid) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 229, 255, 0.12)';
      const step = editorState.gridSize;
      const startX = Math.floor(worldLeft / step) * step;
      const endX = Math.ceil(worldRight / step) * step;
      const startY = Math.floor((camera.y - H / camera.zoom) / step) * step;
      const endY = Math.ceil((camera.y + H / camera.zoom) / step) * step;

      for (let gx = startX; gx <= endX; gx += step * 2) {
        for (let gy = startY; gy <= endY; gy += step * 2) {
          ctx.fillRect(gx - 1, gy - 1, 2, 2);
        }
      }
      ctx.restore();
    }

    if (editorState.selectedType) {
      const def = getObstacleDef(editorState.selectedType);
      if (def) {
        const w = def.w || 40;
        const h = def.h || 20;
        let px = editorState.hoverX - w / 2;
        let py = editorState.hoverY - h / 2;
        if (editorState.snapToGrid) {
          px = Math.round(px / editorState.gridSize) * editorState.gridSize;
          py = Math.round(py / editorState.gridSize) * editorState.gridSize;
        }

        ctx.save();
        ctx.globalAlpha = 0.55;
        drawSingleObstacleByType(ctx, def.type, px, py, w, h, GROUND_Y);

        ctx.strokeStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(px - 2, py - 2, w + 4, h + 4);
        ctx.setLineDash([]);

        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#00e5ff';
        ctx.textAlign = 'center';
        ctx.fillText(`${def.name} (${w}x${h})`, px + w / 2, py - 6);
        ctx.restore();
      }
    }
  }

  drawBullets(ctx);
  drawJetpackParticles(ctx);
  drawPlayer(ctx, GROUND_Y, player);

  if (bot.active) {
    drawPlayer(ctx, GROUND_Y, bot);
    drawEntityHealthBar(ctx, bot, -12);

    ctx.save();
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c084fc';
    ctx.shadowColor = 'rgba(168, 85, 247, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText('[BOT]', bot.x + bot.w / 2, bot.y - 19);
    ctx.restore();
  }

  drawBall(ctx);

  drawCrosshair(ctx, player.aimX, player.aimY);

  ctx.restore();

  drawHUD(ctx, player, leftStick, btnCluster, rightStick, ball);

  if (editorState.active) {
    ctx.save();
    const bannerW = 500;
    const bannerH = 26;
    const bannerX = (W - bannerW) / 2;
    const bannerY = H - 38;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
    ctx.lineWidth = 1.2;
    if (ctx.roundRect) ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 6);
    else ctx.rect(bannerX, bannerY, bannerW, bannerH);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 6;
    const currentToolLabel = editorState.selectedType ? `[NARZĘDZIE: ${getObstacleDef(editorState.selectedType)?.name || editorState.selectedType}]` : '[WYBIERZ PRZESZKODĘ Z MENU DEV]';
    ctx.fillText(`🏗️ EDYTOR: ${currentToolLabel} | LPM: Postaw | PPM: Usuń/Anuluj | Ctrl+Z: Cofnij`, W / 2, bannerY + 17);
    ctx.restore();
  }
}

let lastTime = performance.now();
function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  const delta = now - lastTime;

  if (delta < FRAME_DURATION - 0.5) return;
  if (delta > 250) {
    lastTime = now;
  } else {
    lastTime += FRAME_DURATION;
    if (now - lastTime > FRAME_DURATION) lastTime = now;
  }

  update();
  draw();
}

requestAnimationFrame(loop);
