import { CONFIG, FRAME_DURATION, START_X } from './config.js';
import {
  canvas, ctx, W, H, GROUND_Y, camera,
  initCanvas, resize, updateCamera, updateDistance,
  spawnGrass, updateParticles, dist,
  drawSky, drawGround, drawParticles, drawDistanceMarkers, drawHUD,
  drawEntityHealthBar,
  clearDesertSandstorm, clearWinterBlizzard,
  isTouchDevice, setTouchDevice,
  jetpackParticles, spawnJetpackSparks, updateJetpackParticles, drawJetpackParticles,
  consumeHitstop, updateGore, drawBloodDecals, drawGore, clearGore,
  updateSeveredHeads, drawSeveredHeads,
  weaponButtons,
  devZoomLevel, setDevZoom
} from './world.js';
import {
  player, playerJump, playerSlide, startJumpCharge, executeReleaseJump,
  startKickCharge, executeReleaseKick, isBallInKickReach,
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
import { WEAPONS, updateBullets, drawBullets, shootWeapon, getMuzzlePosition, reloadWeapon, getWeaponAmmo } from './weapons.js';
import {
  remotePlayer, networkState, initNetwork,
  sendPlayerState, sendBallState, sendShootEvent,
  sendObstacleAdd, sendObstacleRemove, sendObstacleClear, sendObstacleUndo,
  sendArenaSwitch, updateRemotePlayer,
  isChatActive, openChat, closeChat, updateCursorVisibility
} from './network.js';

export function triggerPlayerShoot(p, wep) {
  const muzzle = getMuzzlePosition(p, wep);
  const targetAimX = (typeof p.aimX === 'number' && !isNaN(p.aimX)) ? p.aimX : muzzle.aimX;
  const targetAimY = (typeof p.aimY === 'number' && !isNaN(p.aimY)) ? p.aimY : muzzle.aimY;
  const shootAngle = Math.atan2(targetAimY - muzzle.muzzleY, targetAimX - muzzle.muzzleX);
  p.aimAngle = shootAngle;
  const fired = shootWeapon(p, wep, muzzle.muzzleX, muzzle.muzzleY, shootAngle);
  if (fired) {
    sendShootEvent(wep.id, muzzle.muzzleX, muzzle.muzzleY, shootAngle);
  }
}

// =========================================================================
// STAN MYSZY I BLOKADA MENU KONTEKSTOWEGO
// =========================================================================
export const mouseState = {
  lmbDown: false,
  rmbDown: false,
  semiFired: false
};

window.addEventListener('contextmenu', (e) => e.preventDefault());

let jetpackAirborneSession = false;
let lastSPressTime = 0;

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
  isJetpacking: false,
  jetpackAirborneSession: false
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
  power: 0,
  movedDist: 0,
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

// Przyciski dotykowe (po prawej stronie pozostał tylko WŚLIZG)
const btnCluster = {
  slide: { x: 0, y: 0, r: 30, active: false, id: null }
};

const keys = {
  left: false,
  right: false,
  down: false,
  up: false,
  space: false,
  slide: false,
  ctrl: false
};

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
    // 0. KLIKNIĘCIE W DEDYKOWANE PRZYCISKI WYBORU BRONI (DOLNY LEWY RÓG)
    // =======================================================================
    let touchedWeaponBtn = false;
    for (const btn of weaponButtons) {
      if (t.clientX >= btn.x && t.clientX <= btn.x + btn.w &&
        t.clientY >= btn.y && t.clientY <= btn.y + btn.h) {
        if (player.currentWeapon?.id === btn.id) {
          reloadWeapon(player, player.currentWeapon);
        } else {
          player.currentWeapon = WEAPONS[btn.id];
        }
        touchedWeaponBtn = true;
        break;
      }
    }
    if (touchedWeaponBtn) continue;

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

      if (leftStick.jetpackAirborneSession) {
        leftStick.isJetpacking = true;
      } else if (leftStick.waitingForJetpackTap && leftStick.jetpackWindowTimer > 0) {
        leftStick.isJetpacking = true;
        leftStick.jetpackAirborneSession = true;
        jetpackAirborneSession = true;
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
            triggerPlayerShoot(player, curWep);
          }
        } else {
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
      if (leftStick.axisY < -0.55 && !leftStick.jumpTriggered && !player.isJumping && !player.isSliding && !player.isIntro && !leftStick.jetpackAirborneSession) {
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

      // 2. Ciąg jetpacka przy wychyleniu w górę
      if (leftStick.jetpackAirborneSession || leftStick.isJetpacking) {
        if (leftStick.axisY < -0.15 && (player.jetFuel || 0) > 0) {
          isJetpackActive = true;
          leftStick.isJetpacking = true;
          leftStick.jetpackAirborneSession = true;
          jetpackAirborneSession = true;
        } else {
          isJetpackActive = false;
        }
      }
    }

    if (rightStick.active && t.identifier === rightStick.id) {
      rightStick.curX = t.clientX;
      rightStick.curY = t.clientY;
      const dx = rightStick.curX - rightStick.baseX;
      const dy = rightStick.curY - rightStick.baseY;
      const sDist = Math.hypot(dx, dy);
      const deadzone = 6;
      const maxR = rightStick.maxRadius || 65;

      rightStick.movedDist = sDist;

      if (sDist > deadzone) {
        const power = Math.min(1.0, (sDist - deadzone) / (maxR - deadzone));
        const nx = dx / sDist;
        const ny = dy / sDist;

        rightStick.axisX = nx * power;
        rightStick.axisY = ny * power;
        rightStick.power = power;

        const aimDist = 160 + power * 100;
        player.aimOffsetX = nx * aimDist;
        player.aimOffsetY = ny * aimDist;
        player.aimX = player.x + player.w / 2 + nx * aimDist;
        player.aimY = player.y + player.h / 2 + ny * aimDist;
        player.isAiming = true;

        if (Math.abs(nx) > 0.1) {
          player.facing = nx >= 0 ? 1 : -1;
        }

        // Sprawdzenie zasięgu do piłki:
        const canKickBall = isBallInKickReach(player, ball);
        if (canKickBall && power > 0.15) {
          player.isCharging = true;
          player.isStickCharging = true;
          player.chargePower = Math.min(1.0, power);
        } else if (!canKickBall) {
          // Piłka poza zasięgiem nogi – wyłącz tryb ładowania wykopu
          player.isCharging = false;
          player.isStickCharging = false;
          player.chargePower = 0;
        }
      } else {
        rightStick.axisX = 0;
        rightStick.axisY = 0;
        rightStick.power = 0;
        player.isCharging = false;
        player.isStickCharging = false;
        player.chargePower = 0;
      }
    }
  }
}, { passive: false });

function endTouch(e) {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];

    if (leftStick.active && t.identifier === leftStick.id) {
      leftStick.active = false;
      leftStick.id = null;

      const hadUpwardMotion = (leftStick.axisY < -0.40) || leftStick.jumpTriggered;

      isJetpackActive = false;
      leftStick.isJetpacking = false;

      if (!leftStick.jetpackAirborneSession && hadUpwardMotion) {
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

    if (rightStick.active && t.identifier === rightStick.id) {
      rightStick.active = false;
      rightStick.id = null;

      const canKickBall = isBallInKickReach(player, ball);
      const wasDeflected = (rightStick.power > 0.2 || rightStick.movedDist > 18);

      if (canKickBall && wasDeflected && player.kickState === 'IDLE') {
        // Wykonanie precyzyjnego wykopu w kierunku ostatniego wychylenia:
        player.isCharging = true;
        if (!player.chargePower || player.chargePower < 0.15) {
          player.chargePower = Math.min(1.0, Math.max(0.2, rightStick.power || (rightStick.movedDist / (rightStick.maxRadius || 65))));
        }
        executeReleaseKick(ball, player);
        player.isCharging = false;
        player.isStickCharging = false;
        player.chargePower = 0;
        rightStick.waitingForSecondTap = false;
        rightStick.windowTimer = 0;
      } else {
        // Piłka była poza zasięgiem nogi – anuluj ładowanie i zachowaj standardową obsługę celowania/strzelania
        player.isCharging = false;
        player.isStickCharging = false;
        player.chargePower = 0;
        rightStick.waitingForSecondTap = true;
        rightStick.windowTimer = 300;
      }

      rightStick.axisX = 0;
      rightStick.axisY = 0;
      rightStick.power = 0;
      rightStick.movedDist = 0;

      rightStick.isShooting = false;
      player.isShooting = false;
      player.isAiming = false;

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
  player.isStickCharging = false;
  player.isJumpCharging = false;
  player.kickState = 'IDLE';
  player.gaitMode = 'IDLE';
  isJetpackActive = false;
  jetpackAirborneSession = false;
  leftStick.jetpackAirborneSession = false;

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
  clearGore();

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
const mpModal = document.getElementById('mp-modal') || document.getElementById('multi-panel') || document.querySelector('.mp-modal');

export function toggleDevPanel() {
  if (!devMenu) return;
  const isHidden = devMenu.classList.toggle('dev-menu-hidden');
  if (devToggleBtn) {
    if (isHidden) devToggleBtn.classList.remove('active');
    else devToggleBtn.classList.add('active');
  }
  updateCursorVisibility();
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

// =========================================================================
// WŁĄCZANIE BOTA ORAZ PRZYCISK ZAMRAŻANIA BOTA (STANDSTILL)
// =========================================================================
const devBotToggleBtn = document.getElementById('dev-bot-toggle-btn');
let devBotFreezeBtn = document.getElementById('dev-bot-freeze-btn');

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

// Dynamiczne utworzenie przycisku zamrażania bota w panelu deweloperskim
if (!devBotFreezeBtn && devMenu) {
  devBotFreezeBtn = document.createElement('button');
  devBotFreezeBtn.className = 'dev-btn';
  devBotFreezeBtn.id = 'dev-bot-freeze-btn';
  devBotFreezeBtn.style.cssText = 'border-color: #eab308; color: #facc15; font-weight: 600; margin-left: 2px;';
  devBotFreezeBtn.textContent = '⏸️ BOT: RUCH';

  if (devBotToggleBtn && devBotToggleBtn.parentNode) {
    devBotToggleBtn.parentNode.insertBefore(devBotFreezeBtn, devBotToggleBtn.nextSibling);
  } else {
    devMenu.appendChild(devBotFreezeBtn);
  }
}

if (devBotFreezeBtn) {
  const toggleFreeze = (e) => {
    e.stopPropagation();
    e.preventDefault();
    bot.frozen = !bot.frozen;
    if (bot.frozen) {
      devBotFreezeBtn.textContent = '🛑 BOT: STOI';
      devBotFreezeBtn.style.background = 'rgba(234, 179, 8, 0.35)';
      devBotFreezeBtn.style.borderColor = '#facc15';
      devBotFreezeBtn.style.color = '#ffffff';
      devBotFreezeBtn.style.boxShadow = '0 0 10px rgba(234, 179, 8, 0.6)';
    } else {
      devBotFreezeBtn.textContent = '⏸️ BOT: RUCH';
      devBotFreezeBtn.style.background = '';
      devBotFreezeBtn.style.borderColor = '#eab308';
      devBotFreezeBtn.style.color = '#facc15';
      devBotFreezeBtn.style.boxShadow = '';
    }
  };
  devBotFreezeBtn.addEventListener('click', toggleFreeze);
  devBotFreezeBtn.addEventListener('touchend', toggleFreeze);
}

const devArenaBtn = document.getElementById('dev-arena-btn');
if (devArenaBtn) {
  const toggleArena = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const nextArena = (activeArenaId === 'ARENA_1') ? 'ARENA_2' : 'ARENA_1';
    switchArena(nextArena, player, bot, ball);
    sendArenaSwitch(nextArena);
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
    sendObstacleUndo();
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
    sendObstacleClear();
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
  sendObstacleAdd(newObs);
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
      sendObstacleRemove(obs);
      customObstacles.splice(i, 1);
      return;
    }
  }

  editorState.selectedType = null;
  updateEditorPaletteHighlight();
}

initObstacleEditorUI();

// =========================================================================
// DEV ZOOM CONTROLS (PRZYBLIŻANIE / ODDALANIE KAMERY W MENU DEV)
// =========================================================================
let devZoomLabel = null;

export function updateDevZoomLabel() {
  if (!devZoomLabel) return;
  if (devZoomLevel !== null) {
    devZoomLabel.textContent = `ZOOM: ${devZoomLevel.toFixed(2)}x`;
    devZoomLabel.style.color = '#38bdf8';
    devZoomLabel.style.borderColor = 'rgba(56, 189, 248, 0.4)';
  } else {
    devZoomLabel.textContent = `ZOOM: Auto`;
    devZoomLabel.style.color = '#94a3b8';
    devZoomLabel.style.borderColor = 'rgba(148, 163, 184, 0.2)';
  }
}

export function initDevZoomUI() {
  const devMenu = document.getElementById('dev-menu');
  if (!devMenu) return;

  const sep = document.createElement('span');
  sep.style.cssText = 'color: rgba(255,255,255,0.25); margin: 0 3px;';
  sep.textContent = '|';
  devMenu.appendChild(sep);

  devZoomLabel = document.createElement('span');
  devZoomLabel.className = 'dev-btn';
  devZoomLabel.id = 'dev-zoom-label';
  devZoomLabel.style.cssText = 'color: #94a3b8; font-weight: 700; cursor: default; user-select: none;';
  devZoomLabel.textContent = 'ZOOM: Auto';
  devMenu.appendChild(devZoomLabel);

  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.className = 'dev-btn';
  zoomOutBtn.id = 'dev-zoom-out-btn';
  zoomOutBtn.title = 'Oddal widok kamery (-0.25x)';
  zoomOutBtn.textContent = '🔍 - Oddal';
  zoomOutBtn.addEventListener('click', (e) => {
    e.stopPropagation(); e.preventDefault();
    const cur = devZoomLevel !== null ? devZoomLevel : camera.zoom;
    setDevZoom(cur - 0.25);
    updateDevZoomLabel();
  });
  devMenu.appendChild(zoomOutBtn);

  const zoomResetBtn = document.createElement('button');
  zoomResetBtn.className = 'dev-btn';
  zoomResetBtn.id = 'dev-zoom-reset-btn';
  zoomResetBtn.title = 'Ustaw zoom dokładnie na 1.0x (widok 1:1)';
  zoomResetBtn.textContent = '🔍 Reset (1.0x)';
  zoomResetBtn.addEventListener('click', (e) => {
    e.stopPropagation(); e.preventDefault();
    setDevZoom(1.0);
    updateDevZoomLabel();
  });
  devMenu.appendChild(zoomResetBtn);

  const zoomInBtn = document.createElement('button');
  zoomInBtn.className = 'dev-btn';
  zoomInBtn.id = 'dev-zoom-in-btn';
  zoomInBtn.title = 'Przybliż widok kamery (+0.25x, max 2.5x)';
  zoomInBtn.textContent = '🔍 + Przybliż';
  zoomInBtn.addEventListener('click', (e) => {
    e.stopPropagation(); e.preventDefault();
    const cur = devZoomLevel !== null ? devZoomLevel : camera.zoom;
    setDevZoom(cur + 0.25);
    updateDevZoomLabel();
  });
  devMenu.appendChild(zoomInBtn);

  const zoomAutoBtn = document.createElement('button');
  zoomAutoBtn.className = 'dev-btn';
  zoomAutoBtn.id = 'dev-zoom-auto-btn';
  zoomAutoBtn.title = 'Przywróć domyślny automatyczny zoom kamery';
  zoomAutoBtn.textContent = '🔍 Auto';
  zoomAutoBtn.addEventListener('click', (e) => {
    e.stopPropagation(); e.preventDefault();
    setDevZoom(null);
    updateDevZoomLabel();
  });
  devMenu.appendChild(zoomAutoBtn);

  updateDevZoomLabel();
}

window.addEventListener('wheel', (e) => {
  const isDevOpen = devMenu && !devMenu.classList.contains('dev-menu-hidden');
  if (isDevOpen || e.altKey) {
    e.preventDefault();
    const current = devZoomLevel !== null ? devZoomLevel : camera.zoom;
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setDevZoom(current + delta);
    updateDevZoomLabel();
  }
}, { passive: false });

initDevZoomUI();
initNetwork();

let jumpKeyPressed = false;
let lastWPressTime = 0;
let isJetpackActive = false;
const DOUBLE_TAP_WINDOW_MS = 280;

window.addEventListener('keydown', (e) => {
  // Obsługa otwierania czatu sieciowego klawiszem "T"
  if (e.code === 'KeyT' && !isChatActive) {
    const activeEl = document.activeElement;
    const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
    if (!isInput) {
      e.preventDefault();
      keys.left = false;
      keys.right = false;
      keys.up = false;
      keys.down = false;
      keys.space = false;
      keys.slide = false;
      mouseState.lmbDown = false;
      mouseState.rmbDown = false;
      openChat();
      return;
    }
  }

  // Blokada klawiszy gry gdy czat jest aktywny lub fokus jest w polu tekstowym
  const activeEl = document.activeElement;
  const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
  if (isChatActive || isInputFocused) {
    if (e.code === 'Escape' && isChatActive) {
      e.preventDefault();
      closeChat();
    }
    return;
  }

  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;

  if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
    keys.ctrl = true;
  }

  if (e.code === 'KeyS' || e.code === 'ArrowDown') {
    const now = performance.now();
    if (now - lastSPressTime < 280) {
      player.dropThroughTimer = 18;
    }
    lastSPressTime = now;
    keys.down = true;
  }

  if ((e.code === 'KeyW' || e.code === 'ArrowUp') && !jumpKeyPressed) {
    jumpKeyPressed = true;

    const now = performance.now();
    if (jetpackAirborneSession && (player.jetFuel || 0) > 5) {
      isJetpackActive = true;
    } else if (now - lastWPressTime < DOUBLE_TAP_WINDOW_MS && (player.jetFuel || 0) > 5) {
      isJetpackActive = true;
      jetpackAirborneSession = true;
      leftStick.jetpackAirborneSession = true;
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
  if (e.code === 'KeyR') {
    reloadWeapon(player, player.currentWeapon);
  }
  if (e.code === 'KeyB') {
    resetBallToPlayer(player, GROUND_Y);
  }

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

  if (e.code === 'Digit6' || e.code === 'Numpad6' || e.key === '6') devSetClass('AERO');
  else if (e.code === 'Digit7' || e.code === 'Numpad7' || e.key === '7') devSetClass('ENFORCER');
  else if (e.code === 'Digit8' || e.code === 'Numpad8' || e.key === '8') devSetClass('PLAYMAKER');
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
  if (isChatActive) {
    keys.left = false;
    keys.right = false;
    keys.up = false;
    keys.down = false;
    keys.space = false;
    keys.slide = false;
    return;
  }
  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;

  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;

  if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
    keys.ctrl = false;
  }
  if (e.code === 'KeyS' || e.code === 'ArrowDown') {
    keys.down = false;
  }

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

  if (isChatActive) return;
  const mpModal = document.getElementById('mp-modal');
  if (mpModal && !mpModal.classList.contains('mp-modal-hidden')) return;

  // 0. Obsługa kliknięcia myszą w kafelki broni (dolny lewy róg)
  for (const btn of weaponButtons) {
    if (e.clientX >= btn.x && e.clientX <= btn.x + btn.w &&
      e.clientY >= btn.y && e.clientY <= btn.y + btn.h) {
      if (player.currentWeapon?.id === btn.id) {
        reloadWeapon(player, player.currentWeapon);
      } else {
        player.currentWeapon = WEAPONS[btn.id];
      }
      return;
    }
  }

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
  if (consumeHitstop()) {
    updateCamera(player, ball);
    return;
  }

  // Wymuszenie stanu kursora systemowego w menu DEV / MULTI / CZAT
  const mpModal = document.getElementById('mp-modal');
  const devMenu = document.getElementById('dev-menu');
  const isMpOpen = mpModal && !mpModal.classList.contains('mp-modal-hidden');
  const isDevOpen = devMenu && !devMenu.classList.contains('dev-menu-hidden');

  if (isMpOpen || isDevOpen || isChatActive) {
    if (canvas.style.cursor !== 'default') canvas.style.cursor = 'default';
    if (canvas.parentElement && !canvas.parentElement.classList.contains('cursor-visible')) {
      canvas.parentElement.classList.add('cursor-visible');
    }
    mouseState.lmbDown = false;
    mouseState.rmbDown = false;
  } else {
    if (canvas.style.cursor !== 'none') canvas.style.cursor = 'none';
    if (canvas.parentElement && canvas.parentElement.classList.contains('cursor-visible')) {
      canvas.parentElement.classList.remove('cursor-visible');
    }
  }

  if (!isTouchDevice) {
    const worldMouseX = camera.x + (mouseScreenX - W * 0.40) / camera.zoom;
    const worldMouseY = camera.y + (mouseScreenY - H * 0.68) / camera.zoom;
    player.aimX = worldMouseX;
    player.aimY = worldMouseY;
  }

  // CELOWNIK ZAWSZE PODĄŻAJĄCY ZA POSTACIĄ
  if (isTouchDevice && !player.isDead) {
    const hipX = player.x + player.w / 2;
    const hipY = player.y + player.h / 2;

    if (typeof player.aimOffsetX !== 'number' || isNaN(player.aimOffsetX)) {
      player.aimOffsetX = (player.facing || 1) * 180;
      player.aimOffsetY = -20;
    }

    if (!rightStick.active && !player.isShooting && !player.isAiming) {
      if (player.facing === 1 && player.aimOffsetX < 0) {
        player.aimOffsetX = Math.abs(player.aimOffsetX);
      } else if (player.facing === -1 && player.aimOffsetX > 0) {
        player.aimOffsetX = -Math.abs(player.aimOffsetX);
      }
    }

    player.aimX = hipX + player.aimOffsetX;
    player.aimY = hipY + player.aimOffsetY;
  }

  // OBSŁUGA OKIEN CZASOWYCH DRĄŻKÓW (300 MS)
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

  // OBSŁUGA STRZELANIA GRACZA
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
      triggerPlayerShoot(player, curWep);
    }
  } else if (mouseState.lmbDown && !player.isDead && player.shootCooldown <= 0) {
    if (curWep.auto) {
      triggerPlayerShoot(player, curWep);
    } else {
      if (!mouseState.semiFired) {
        triggerPlayerShoot(player, curWep);
        mouseState.semiFired = true;
      }
    }
  }

  // SILNIK JETPACKA
  if (isJetpackActive && !player.isDead && player.jetFuel > 0) {
    player.isJetpacking = true;
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
    const myJetColors = networkState.isHost
      ? ['#00e5ff', '#38bdf8', '#0284c7', '#ffffff']
      : ['#f97316', '#fb923c', '#fdba74', '#ffffff'];
    spawnJetpackSparks(nozzleX, nozzleY, player.facing, 2, myJetColors);
  } else {
    isJetpackActive = false;
    if (leftStick) leftStick.isJetpacking = false;
    player.isJetpacking = false;
  }

  if (leftStick && leftStick.active) {
    updateDoubleFlickDetection(leftStick.axisY);
  }

  if (remotePlayer && remotePlayer.active) {
    remotePlayer.groundY = GROUND_Y;
    remotePlayer.currentGroundY = GROUND_Y; // Kluczowy fix nóg!

    // Aktualizacja fazy chodu i biegu dla nóg IK:
    const rSpeed = Math.abs(remotePlayer.vx || 0);
    if (rSpeed > 0.1 && !remotePlayer.isJumping) {
      remotePlayer.stridePhase = (remotePlayer.stridePhase || 0) + rSpeed * 0.04;
    }
    updateRemotePlayer(GROUND_Y);
  }

  updatePlayer(keys, leftStick, GROUND_Y, ball, spawnGrass, player);
  sendPlayerState(player);

  updateParticles();
  updateJetpackParticles();
  updateGore(GROUND_Y);

  const headEntities = [player];
  if (bot.active) headEntities.push(bot);
  if (remotePlayer.active) headEntities.push(remotePlayer);
  updateSeveredHeads(headEntities, GROUND_Y);

  if (networkState.isHost || !networkState.isConnected) {
    updateBall(GROUND_Y);
    checkBallPlayerCollisions(player, GROUND_Y, spawnGrass);
    if (remotePlayer.active) {
      checkBallPlayerCollisions(remotePlayer, GROUND_Y, spawnGrass);
      checkPlayerPlatformLanding(remotePlayer, GROUND_Y);
    }
    checkObstacleCollisions(ball, GROUND_Y, player);
    if (remotePlayer.active) checkObstacleCollisions(ball, GROUND_Y, remotePlayer);
    sendBallState(ball);
  } else {
    // Klient – autorytatywna pozycja piłki z sieci P2P
    checkBallPlayerCollisions(player, GROUND_Y, spawnGrass);
    if (remotePlayer.active) {
      checkBallPlayerCollisions(remotePlayer, GROUND_Y, spawnGrass);
      checkPlayerPlatformLanding(remotePlayer, GROUND_Y);
    }
    checkObstacleCollisions(ball, GROUND_Y, player);
  }

  // RESET SESJI POWIETRZNEJ JETPACKA DOPIERO PO WYLĄDOWANIU
  const currentFloor = player.currentGroundY || GROUND_Y;
  const isPlayerGrounded = !player.isJumping && (player.y >= currentFloor - player.h - 3);

  if (isPlayerGrounded || player.isDead) {
    jetpackAirborneSession = false;
    if (leftStick) {
      leftStick.jetpackAirborneSession = false;
      leftStick.isJetpacking = false;
      leftStick.waitingForJetpackTap = false;
      leftStick.jetpackWindowTimer = 0;
    }
    isJetpackActive = false;
    player.isJetpacking = false;
  }

  if (bot.active) {
    updateBotBrain(ball, player, GROUND_Y, spawnGrass);
    checkBallPlayerCollisions(bot, GROUND_Y, spawnGrass);
    checkPlayerPlatformLanding(bot, GROUND_Y);
  }

  const combatants = [player];
  if (bot.active) combatants.push(bot);
  if (remotePlayer.active) combatants.push(remotePlayer);
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

  drawBloodDecals(ctx);

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
  drawGore(ctx);
  drawSeveredHeads(ctx, remotePlayer.active ? [player, bot, remotePlayer] : [player, bot]);
  drawJetpackParticles(ctx);
  drawPlayer(ctx, GROUND_Y, player);

  if (remotePlayer.active) {
    drawPlayer(ctx, GROUND_Y, remotePlayer);
    drawEntityHealthBar(ctx, remotePlayer, -14);

    ctx.save();
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    const tagColor = networkState.isHost ? '#f97316' : '#06b6d4';
    const tagName = networkState.isHost ? '[P2: CLIENT]' : '[P1: HOST]';
    ctx.fillStyle = tagColor;
    ctx.shadowColor = tagColor;
    ctx.shadowBlur = 6;
    ctx.fillText(tagName, remotePlayer.x + remotePlayer.w / 2, remotePlayer.y - 21);
    ctx.restore();
  }

  if (bot.active) {
    drawPlayer(ctx, GROUND_Y, bot);
    drawEntityHealthBar(ctx, bot, -12);

    ctx.save();
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c084fc';
    ctx.shadowColor = 'rgba(168, 85, 247, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(bot.frozen ? '[BOT: STOP]' : '[BOT]', bot.x + bot.w / 2, bot.y - 19);
    ctx.restore();
  }

  drawBall(ctx);

  const modalEl = document.getElementById('mp-modal') || mpModal;
  const isDevOpenForCrosshair = devMenu && !devMenu.classList.contains('dev-menu-hidden');
  const isMpOpenForCrosshair = modalEl && !modalEl.classList.contains('mp-modal-hidden');

  if (!player.isDead && !isDevOpenForCrosshair && !isMpOpenForCrosshair && !isChatActive) {
    drawCrosshair(ctx, player.aimX, player.aimY);
  }

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
