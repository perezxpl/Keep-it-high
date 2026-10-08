import { CONFIG, FRAME_DURATION, START_X, GAME_STATES, ARENA_LEFT, ARENA_RIGHT, ARENA_WIDTH } from './config.js';
import {
  canvas, ctx, W, H, GROUND_Y, camera, world,
  initCanvas, resize, updateCamera, updateDistance, clampCamera,
  spawnGrass, updateParticles, dist,
  drawSky, drawGround, drawParticles, drawDistanceMarkers, drawHUD,
  clearDesertSandstorm, clearWinterBlizzard,
  isTouchDevice, setTouchDevice,
  jetpackParticles, spawnJetpackSparks, updateJetpackParticles, drawJetpackParticles,
  consumeHitstop, updateGore, drawBloodDecals, drawGore, clearGore,
  updateSeveredHeads, drawSeveredHeads,
  weaponButtons,
  devZoomLevel, setDevZoom,
  getCaveCeilingY,
  setCameraMouseScreenPos
} from './world.js';
import {
  player, playerJump, playerSlide, startJumpCharge, executeReleaseJump,
  startKickCharge, executeReleaseKick, isBallInKickReach, findMeleeTarget,
  performKick, kick,
  updatePlayer, drawPlayer, setPlayerClass, getJetpackNozzlePos,
  executeAeroUlt, throwTacticalGrenade, prepareGrenadeThrow, releaseGrenadeThrow,
  drawGrenadeTrajectory, isCeilingBlockingStand
} from './player.js';
import { updateProjectiles, drawProjectiles } from './projectiles.js';
import { renderArenaBackground, renderArenaForeground, getActiveArena } from './renderer.js';
import {
  ball, resetBallToPlayer, updateBall, checkBallPlayerCollisions, drawBall
} from './ball.js';
import {
  obstacles, checkObstacleCollisions, checkPlayerPlatformLanding, drawObstacles, resetObstacles,
  updateProceduralObstacles, updateProceduralBirds, switchArena, activeArenaId,
  customObstacles, OBSTACLE_PALETTE, getObstacleDef, clearCustomObstacles, undoCustomObstacle,
  drawSingleObstacleByType, arenaScore, arena1State, ARENA_PLATFORMS, setActiveBot,
  calculateObstaclePlacement, findSupportingSurface, isBottomAnchored, normalizeObstacleType,
  updateMovableObstacles, resetArena
} from './obstacles.js';
import { CLASSES } from './classes/index.js';
import { bot, botKeys, updateBotBrain } from './bot.js';
import { WEAPONS, updateBullets, drawBullets, shootWeapon, getMuzzlePosition, reloadWeapon, getWeaponAmmo, clearBulletCasings, drawSniperLaserSight } from './weapons.js';
import {
  remotePlayer, networkState, initNetwork,
  sendPlayerState, sendBallState, sendShootEvent,
  sendObstacleAdd, sendObstacleRemove, sendObstacleClear, sendObstacleUndo,
  sendArenaSwitch, updateRemotePlayer,
  isChatActive, openChat, closeChat, updateCursorVisibility
} from './network.js';
import {
  leftStick, rightStick, btnCluster, pockets,
  updateButtonLayout, updateMobileControlStates,
  handleDynamicActionButtonPress, handleSlideProneButtonPress, triggerRightStickKick,
  checkRightStickFlickOrTap
} from './mobileControls.js';
import { DEBUG_COLLIDERS, drawDebugColliders } from './renderer.js';

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

export { leftStick, rightStick, btnCluster, updateButtonLayout };
if (typeof window !== 'undefined') {
  window.updateButtonLayout = updateButtonLayout;
  window.leftStick = leftStick;
  window.rightStick = rightStick;
  window.btnCluster = btnCluster;
}

export const keys = {
  left: false,
  right: false,
  down: false,
  up: false,
  space: false,
  shift: false,
  slide: false,
  ctrl: false,
  crouch: false
};

const canvasEl = document.getElementById('game');
initCanvas(canvasEl);
if (canvas) {
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
} else if (canvasEl) {
  canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());
}
resize(player);
updateButtonLayout(W, H);
setActiveBot(bot);
// Pełna inicjalizacja aktywnej areny ze startowego adresu URL (?arena=3 / ?arena=2 / arena-1)
const initialArena = getActiveArena();
const initialArenaId = initialArena?.id || 'arena-1';
switchArena(initialArenaId, player, bot, ball);
window.activeArenaId = activeArenaId;
if (typeof syncDevArenaButtonUI === 'function') {
  syncDevArenaButtonUI();
}
syncDevBotButtonUI();
camera.targetX = player.x - (camera.viewWidth || (W / camera.zoom)) / 2;
camera.x = camera.targetX;
camera.targetY = player.y - (camera.viewHeight || (H / camera.zoom)) * 0.72;
camera.y = camera.targetY;
clampCamera();

window.addEventListener('resize', () => {
  resize(player);
  updateButtonLayout(W, H);
});

window.addEventListener('touchstart', () => {
  if (!isTouchDevice) {
    setTouchDevice(true);
    updateButtonLayout(W, H);
    updateDevTouchButtonUI();
  }
}, { once: true });

canvas.addEventListener('touchstart', (e) => {
  if (gameState === GAME_STATES.CLASS_SELECT) return;
  e.preventDefault();
  if (!isTouchDevice) {
    setTouchDevice(true);
    updateButtonLayout(W, H);
    updateDevTouchButtonUI();
  }
  const midX = W / 2;

  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];

    // =======================================================================
    // 0. KLIKNIĘCIE W DEDYKOWANE PRZYCISKI WYBORU BRONI
    // =======================================================================
    let touchedWeaponBtn = false;
    for (const btn of weaponButtons) {
      if (btn.x > -100 && t.clientX >= btn.x && t.clientX <= btn.x + btn.w &&
        t.clientY >= btn.y && t.clientY <= btn.y + btn.h) {
        // Sprawdź czy to pojedyncza zunifikowana ikona na ekranie dotykowym
        const isSingleMobileIcon = (weaponButtons[1] && weaponButtons[1].x < 0);
        if (isSingleMobileIcon) {
          // Dotknięcie pojedynczej ikony w dolnym centrum przełącza broń (cykl: AK-47 -> Shotgun -> Sniper)
          const curId = player.currentWeapon?.id || 'AK47';
          if (curId === 'AK47') {
            player.currentWeapon = WEAPONS.SHOTGUN;
          } else if (curId === 'SHOTGUN') {
            player.currentWeapon = WEAPONS.SNIPER;
          } else {
            player.currentWeapon = WEAPONS.AK47;
          }
        } else {
          if (btn.id === 'GRENADE') {
            const throwAngle = -0.62;
            const throwDist = 320;
            const throwAimX = player.x + player.w / 2 + (player.facing || 1) * Math.cos(throwAngle) * throwDist;
            const throwAimY = player.y + player.h * 0.42 + Math.sin(throwAngle) * throwDist;
            throwTacticalGrenade(player, throwAimX, throwAimY);
          } else if (player.currentWeapon?.id === btn.id) {
            reloadWeapon(player, player.currentWeapon);
          } else {
            player.currentWeapon = WEAPONS[btn.id];
          }
        }
        touchedWeaponBtn = true;
        break;
      }
    }
    if (touchedWeaponBtn) continue;

    updateButtonLayout(W, H);

    // =======================================================================
    // LEWA STRONA EKRANU: RUCH, SKOK I JETPACK (SZTYWNO UMIEJSCOWIONY DRĄŻEK)
    // Dotyk wyłącznie w promieniu lewego drążka (ochrona przed przypadkowym ruchem)
    // =======================================================================
    const distToLeftStick = Math.hypot(t.clientX - leftStick.baseX, t.clientY - leftStick.baseY);
    const maxLeftTouchDist = (leftStick.maxRadius || 55) + 26;
    if (t.clientX < midX && !leftStick.active && distToLeftStick <= maxLeftTouchDist) {
      leftStick.active = true;
      leftStick.id = t.identifier;
      leftStick.curX = t.clientX;
      leftStick.curY = t.clientY;
      leftStick.downIntent = false;
      leftStick.downStartTime = 0;
      leftStick.downFlickDetected = false;

      const dx = t.clientX - leftStick.baseX;
      const dy = t.clientY - leftStick.baseY;
      const sDist = Math.hypot(dx, dy);
      const maxR = leftStick.maxRadius || 55;
      if (sDist > 5) {
        const factor = Math.min(1.0, (sDist - 5) / (maxR - 5));
        leftStick.axisX = (dx / sDist) * factor;
        leftStick.axisY = (dy / sDist) * factor;
      } else {
        leftStick.axisX = 0;
        leftStick.axisY = 0;
      }

      if (leftStick.axisY > 0.45) {
        leftStick.downIntent = true;
        leftStick.downStartTime = performance.now();
        player.isCrouching = true;
        player.state = 'CROUCH';
        player.hitboxHeight = 45;
        if (leftStick.axisY > 0.70) {
          leftStick.downFlickDetected = true;
        }
      }

      const isAirborne = (!player.onGround || player.isJumping || Math.abs(player.vy) > 0.5);
      if (isAirborne) {
        // Nowe dotknięcie ekranu w powietrzu oznacza, że drążek był wcześniej zwolniony (zneutralizowany)
        leftStick.jetpackNeutralized = true;
      }
      if (isAirborne && leftStick.jetpackNeutralized && leftStick.axisY < -0.25 && (player.jetFuel || 0) > 0) {
        leftStick.isJetpacking = true;
        isJetpackActive = true;
        player.isJetpacking = true;
      } else {
        leftStick.isJetpacking = false;
      }
    }

    // =======================================================================
    // PRAWA STRONA EKRANU: PRZYCISKI (KOP, WŚLIZG, KUCANIE, GRANAT) I DRĄŻEK CELOWANIA
    // =======================================================================
    if (t.clientX >= midX) {
      // 1. ZUNIFIKOWANY PRZYCISK AKCJI DYNAMICZNEJ (WŚLIZG / LEŻENIE / WSTANIE / KOPNIAK)
      const pAct = pockets.action;
      const distToAct = pAct ? dist(t.clientX, t.clientY, pAct.x, pAct.y) : 999;

      // 2. KIESZEŃ NA BROŃ PALNĄ
      const pFarm = pockets.firearm;
      const distToFarm = pFarm ? dist(t.clientX, t.clientY, pFarm.x, pFarm.y) : 999;

      // 3. KIESZEŃ NA BROŃ MIOTANĄ (GRANAT)
      const pThrow = pockets.throwable;
      const distToThrow = pThrow ? dist(t.clientX, t.clientY, pThrow.x, pThrow.y) : 999;

      const distToRightStick = Math.hypot(t.clientX - rightStick.baseX, t.clientY - rightStick.baseY);
      const maxRightTouchDist = (rightStick.maxRadius || 58) + 24;

      const minDist = Math.min(distToAct, distToFarm, distToThrow);
      if (minDist === distToAct && pAct && distToAct < pAct.r + 15) {
        pAct.active = true;
        pAct.id = t.identifier;
        handleDynamicActionButtonPress(player, spawnGrass, GROUND_Y, {
          ball: ball,
          targets: [bot.active ? bot : null, remotePlayer.active ? remotePlayer : null].filter(Boolean),
          obstacles: obstacles
        });
      } else if (minDist === distToFarm && pFarm && distToFarm < pFarm.r + 15) {
        rightStick.draggedSlot = null;
        pFarm.active = true;
        pFarm.id = t.identifier;
        pFarm.startX = t.clientX;
        pFarm.startY = t.clientY;
        pFarm.touchStartTime = performance.now();
        pFarm.isDragging = false;
      } else if (minDist === distToThrow && pThrow && distToThrow < pThrow.r + 15) {
        rightStick.draggedSlot = null;
        pThrow.active = true;
        pThrow.id = t.identifier;
        pThrow.startX = t.clientX;
        pThrow.startY = t.clientY;
        pThrow.touchStartTime = performance.now();
        pThrow.isDragging = false;
      } else if (!rightStick.active && distToRightStick <= maxRightTouchDist) {
        // Zabezpieczenie przed nakładaniem się stref kieszeni i prawego drążka
        if (distToAct < pAct.r + 12 || distToFarm < pFarm.r + 12 || distToThrow < pThrow.r + 12) continue;

        rightStick.active = true;
        rightStick.id = t.identifier;
        rightStick.touchStartTime = performance.now();
        rightStick.startX = t.clientX;
        rightStick.startY = t.clientY;
        rightStick.movedDist = 0;
        rightStick.curX = t.clientX;
        rightStick.curY = t.clientY;

        const dx = t.clientX - rightStick.baseX;
        const dy = t.clientY - rightStick.baseY;
        const sDist = Math.hypot(dx, dy);
        const maxR = rightStick.maxRadius || 58;

        if (sDist > 6) {
          const factor = Math.min(1.0, (sDist - 6) / (maxR - 6));
          rightStick.axisX = (dx / sDist) * factor;
          rightStick.axisY = (dy / sDist) * factor;
          rightStick.power = factor;
          const isSniper = !player.isHolstered && (player.currentWeapon?.id === 'SNIPER');
          const aimDist = isSniper ? (250 + factor * 750) : (180 + factor * 130);
          player.aimOffsetX = rightStick.axisX * aimDist;
          player.aimOffsetY = rightStick.axisY * aimDist;
          player.aimX = player.x + player.w / 2 + player.aimOffsetX;
          player.aimY = player.y + player.h / 2 + player.aimOffsetY;
          player.isAiming = true;
          if (Math.abs(rightStick.axisX) > 0.08) {
            player.facing = rightStick.axisX >= 0 ? 1 : -1;
          }

          if (rightStick.armedMode === 'FIREARM') {
            if (factor > 0.15 && player.isHolstered) {
              player.isHolstered = false;
            }
            // Strzał następuje wyłącznie przy maksymalnym wychyleniu drążka (>= 0.90)
            rightStick.isShooting = (factor >= 0.90);
            if (rightStick.isShooting && !player.isDead && !player.isHolstered) {
              const curWep = player.currentWeapon || WEAPONS.AK47;
              if (player.shootCooldown <= 0) {
                triggerPlayerShoot(player, curWep);
              }
            }
          } else {
            rightStick.isShooting = false;
          }
        } else {
          rightStick.axisX = 0;
          rightStick.axisY = 0;
          rightStick.power = 0;
          rightStick.isShooting = false;
          player.aimOffsetX = (player.facing || 1) * 180;
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

      // Kucanie na lewym drążku (przytrzymanie lub pojedyncze wysunięcie w dół)
      if (leftStick.axisY > 0.45) {
        if (!leftStick.downIntent) {
          leftStick.downIntent = true;
          leftStick.downStartTime = performance.now();
          leftStick.downFlickDetected = false;
        }
        player.isCrouching = true;
        player.state = 'CROUCH';
        player.hitboxHeight = 45;
        if (leftStick.axisY > 0.70) {
          leftStick.downFlickDetected = true;
        }
      } else if (leftStick.axisY <= 0.25) {
        if (leftStick.downIntent) {
          const duration = performance.now() - leftStick.downStartTime;
          // Pojedyncze szybkie wysunięcie gałki w dół i powrót (< 380 ms lub flick): przełącz stan kucania (toggle)
          if (duration < 380 || leftStick.downFlickDetected) {
            player.crouchToggled = !player.crouchToggled;
            if (player.crouchToggled) {
              player.isCrouching = true;
              player.state = 'CROUCH';
              player.hitboxHeight = 45;
            } else {
              player.isCrouching = false;
              player.isProne = false;
              player.state = 'STAND';
              player.hitboxHeight = player.h || 70;
            }
          } else {
            // Trzymane kucanie: powrót gałki stawia postać na nogi (o ile toggle nie jest aktywny)
            if (!player.crouchToggled && !player.isProne) {
              player.isCrouching = false;
              player.state = 'STAND';
              player.hitboxHeight = player.h || 70;
            }
          }
          leftStick.downIntent = false;
          leftStick.downStartTime = 0;
          leftStick.downFlickDetected = false;
        }
      }

      // Ruch w górę anuluje kucanie i leżenie
      if (leftStick.axisY < -0.30) {
        player.crouchToggled = false;
        player.isCrouching = false;
        player.isProne = false;
      }

      // Aktualizacja kontekstu przycisków mobilnych (w tym pojawiania się przycisku leżenia)
      updateMobileControlStates(player, leftStick, btnCluster);

      // Uniesienie drążka w górę (skok na ziemi lub jetpack w powietrzu)
      const isAirborne = (!player.onGround || player.isJumping || Math.abs(player.vy) > 0.5);

      // Jeśli drążek został odchylony z powrotem w stronę centrum (axisY > -0.20), uznaj go za zneutralizowany
      if (leftStick.axisY > -0.20) {
        leftStick.jetpackNeutralized = true;
      }

      if (leftStick.axisY < -0.30) {
        player.crouchToggled = false;
        player.isCrouching = false;
        player.isProne = false;

        if (isAirborne) {
          // W POWIETRZU: jetpack działa tylko po uprzednim puszczeniu / odchyleniu drążka po skoku z ziemi
          if (leftStick.jetpackNeutralized && (player.jetFuel || 0) > 0) {
            leftStick.isJetpacking = true;
            isJetpackActive = true;
            player.isJetpacking = true;
          } else {
            leftStick.isJetpacking = false;
            isJetpackActive = false;
            player.isJetpacking = false;
          }
        } else {
          // NA ZIEMI: natychmiastowy skok przy wychyleniu w górę (axisY < -0.55)
          if (leftStick.axisY < -0.55 && !leftStick.jumpTriggered && !player.isSliding && !player.isIntro) {
            const jumpForce = player.currentClass?.stats?.jumpForce || CONFIG.JUMP_FORCE;
            player.vy = -jumpForce;
            player.isJumping = true;
            player.onGround = false;
            player.airVx = player.vx;
            leftStick.jumpTriggered = true;
            leftStick.jetpackNeutralized = false; // Po skoku z ziemi wymagamy puszczenia/odchylenia drążka
            if (spawnGrass && player.groundY) {
              spawnGrass(player.x + player.w / 2, player.groundY, player.facing);
            }
          }
        }
      } else if (leftStick.axisY > -0.20) {
        // Powrót do centrum lub ruch w dół: odcięcie silników jetpacka i gotowość do odpalenia w locie
        leftStick.jumpTriggered = false;
        leftStick.jetpackNeutralized = true;
        leftStick.isJetpacking = false;
        isJetpackActive = false;
        player.isJetpacking = false;
      }

      // Podwójne szybkie szarpnięcie w dół (Double flick w oknie 80-350ms): zeskakiwanie z platformy
      updateDoubleFlickDetection(leftStick.axisY);
    }

    // A. Przeciąganie kieszeni na broń palną
    if (pockets.firearm && pockets.firearm.active && t.identifier === pockets.firearm.id) {
      const d = Math.hypot(t.clientX - pockets.firearm.startX, t.clientY - pockets.firearm.startY);
      if (d > 8 || pockets.firearm.isDragging) {
        pockets.firearm.isDragging = true;
        rightStick.draggedSlot = {
          type: 'FIREARM',
          startX: pockets.firearm.x,
          startY: pockets.firearm.y,
          curX: t.clientX,
          curY: t.clientY
        };
      }
    }

    // B. Przeciąganie kieszeni na broń miotaną (granat)
    if (pockets.throwable && pockets.throwable.active && t.identifier === pockets.throwable.id) {
      const d = Math.hypot(t.clientX - pockets.throwable.startX, t.clientY - pockets.throwable.startY);
      if (d > 8 || pockets.throwable.isDragging) {
        pockets.throwable.isDragging = true;
        rightStick.draggedSlot = {
          type: 'GRENADE',
          startX: pockets.throwable.x,
          startY: pockets.throwable.y,
          curX: t.clientX,
          curY: t.clientY
        };
      }
    }

    // C. Wychylenie prawego drążka (celowanie, natychmiastowy ogień lub miotanie)
    if (rightStick.active && t.identifier === rightStick.id) {
      rightStick.curX = t.clientX;
      rightStick.curY = t.clientY;
      const dx = rightStick.curX - rightStick.baseX;
      const dy = rightStick.curY - rightStick.baseY;
      const sDist = Math.hypot(dx, dy);
      const deadzone = 6;
      const maxR = rightStick.maxRadius || 58;

      rightStick.movedDist = sDist;

      if (sDist > deadzone) {
        const power = Math.min(1.0, (sDist - deadzone) / (maxR - deadzone));
        const nx = dx / sDist;
        const ny = dy / sDist;

        rightStick.axisX = nx * power;
        rightStick.axisY = ny * power;
        rightStick.power = power;

        const isSniper = !player.isHolstered && (player.currentWeapon?.id === 'SNIPER');
        const aimDist = isSniper ? (250 + power * 750) : (160 + power * 130);
        player.aimOffsetX = nx * aimDist;
        player.aimOffsetY = ny * aimDist;
        player.aimX = player.x + player.w / 2 + nx * aimDist;
        player.aimY = player.y + player.h / 2 + ny * aimDist;
        player.isAiming = true;

        if (Math.abs(nx) > 0.08) {
          player.facing = nx >= 0 ? 1 : -1;
        }

        if (rightStick.armedMode === 'FIREARM') {
          if (power > 0.15 && player.isHolstered) {
            player.isHolstered = false;
          }
          // Strzał następuje wyłącznie przy maksymalnym wychyleniu drążka (>= 0.90)
          rightStick.isShooting = (power >= 0.90);
          if (rightStick.isShooting && !player.isDead && !player.isHolstered) {
            const curWep = player.currentWeapon || WEAPONS.AK47;
            if (player.shootCooldown <= 0) {
              triggerPlayerShoot(player, curWep);
            }
          }
        } else if (rightStick.armedMode === 'GRENADE') {
          rightStick.isShooting = false;
          if (power > 0.08 && !player.isDead) {
            const throwPower = Math.min(1.8, Math.max(0.6, power * 1.3));
            prepareGrenadeThrow(player, player.aimX, player.aimY, throwPower);
          }
        } else {
          rightStick.isShooting = false;
        }
      } else {
        rightStick.axisX = 0;
        rightStick.axisY = 0;
        rightStick.power = 0;
        rightStick.isShooting = false;
        if (rightStick.armedMode === 'GRENADE' && player.throwAnim && player.throwAnim.aiming) {
          player.throwAnim.aiming = false;
          player.throwAnim.active = false;
        }
      }
    }
  }
}, { passive: false });

function endTouch(e) {
  if (e.target === canvas || (e.target && e.target.id === 'canvas-container')) {
    if (e.cancelable) e.preventDefault();
  } else if (e.cancelable && !e.target?.closest?.('button, a, input, select, textarea, #dev-panel-container, #dev-menu, #mp-modal, .mp-modal-box')) {
    e.preventDefault();
  }
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];

    if (leftStick.active && t.identifier === leftStick.id) {
      leftStick.active = false;
      leftStick.id = null;
      leftStick.jumpTriggered = false;
      leftStick.jetpackNeutralized = true;

      isJetpackActive = false;
      leftStick.isJetpacking = false;
      player.isJetpacking = false;

      if (leftStick.downIntent) {
        const duration = performance.now() - leftStick.downStartTime;
        if (duration < 380 || leftStick.downFlickDetected) {
          // Szybkie pojedyncze wysunięcie w dół i puszczenie: przełącz stałe kucanie (toggle crouch)
          player.crouchToggled = !player.crouchToggled;
          if (player.crouchToggled) {
            player.isCrouching = true;
            player.state = 'CROUCH';
            player.hitboxHeight = 45;
          } else {
            player.isCrouching = false;
            player.isProne = false;
            player.state = 'STAND';
            player.hitboxHeight = player.h || 70;
          }
        } else {
          // Trzymane kucanie: puszczenie drążka stawia postać na nogi
          if (!player.crouchToggled && !player.isProne) {
            player.isCrouching = false;
            player.state = 'STAND';
            player.hitboxHeight = player.h || 70;
          }
        }
        leftStick.downIntent = false;
        leftStick.downStartTime = 0;
        leftStick.downFlickDetected = false;
      } else {
        if (!player.crouchToggled && !player.isProne) {
          player.isCrouching = false;
          player.state = 'STAND';
          player.hitboxHeight = player.h || 70;
        }
      }

      player.enteredProneViaStickDown = false;
      leftStick.axisX = 0;
      leftStick.axisY = 0;
      leftStick.jumpTriggered = false;
      updateMobileControlStates(player, leftStick, btnCluster);
    }

    // A. Zwolnienie przycisku akcji dynamicznej
    if (pockets.action && pockets.action.active && t.identifier === pockets.action.id) {
      pockets.action.active = false;
      pockets.action.id = null;
    }

    // B. Zwolnienie kieszeni na broń palną
    const isFarmTouch = pockets.firearm && (
      (pockets.firearm.active && (pockets.firearm.id === null || t.identifier === pockets.firearm.id)) ||
      pockets.firearm.isDragging ||
      rightStick.draggedSlot?.type === 'FIREARM'
    );
    if (isFarmTouch) {
      const wasDragging = pockets.firearm.isDragging || (rightStick.draggedSlot?.type === 'FIREARM');
      const startX = pockets.firearm.startX || pockets.firearm.x;
      pockets.firearm.active = false;
      pockets.firearm.isDragging = false;
      pockets.firearm.id = null;

      if (wasDragging) {
        // Przeciągnięcie na prawy drążek (założenie broni palnej na ręce)
        const dropX = t.clientX;
        const dropY = t.clientY;
        const distToStick = Math.hypot(dropX - rightStick.baseX, dropY - rightStick.baseY);
        // Jeśli przeciągnięto w stronę prawego drążka (w prawo o min. 20px LUB w promieniu 140px LUB w strefie drążka):
        if (dropX >= startX + 20 || distToStick < 140 || dropX >= rightStick.baseX - 60) {
          rightStick.armedMode = 'FIREARM';
          player.isHolstered = false;
          if (typeof triggerScreenShake === 'function') triggerScreenShake(2.0);
        }
        rightStick.draggedSlot = null;
      } else {
        // Tapnięcie w kieszeń broni palnej:
        const now = performance.now();
        const touchDur = now - (pockets.firearm.touchStartTime || 0);
        if (touchDur < 450) {
          const timeSinceLastTap = now - (pockets.firearm.lastTapReleaseTime || 0);
          if (timeSinceLastTap > 0 && timeSinceLastTap < 380) {
            // 2-krotne szybkie stuknięcie (double-tap): chowanie / wyciąganie broni!
            player.isHolstered = !player.isHolstered;
            pockets.firearm.lastTapReleaseTime = 0;
            if (pockets.firearm.prevWeaponId) {
              player.currentWeapon = WEAPONS[pockets.firearm.prevWeaponId] || player.currentWeapon;
            }
            if (!player.isHolstered) {
              rightStick.armedMode = 'FIREARM';
            }
          } else {
            // Pierwsze pojedyncze tapnięcie:
            pockets.firearm.lastTapReleaseTime = now;
            pockets.firearm.prevWeaponId = player.currentWeapon?.id || 'AK47';
            if (player.isHolstered) {
              // Jeśli broń była schowana, 1 tapnięcie ją natychmiast wyciąga
              player.isHolstered = false;
              rightStick.armedMode = 'FIREARM';
            } else {
              // Jeśli broń już była w rękach, 1 tapnięcie przełącza model broni (cykl: AK-47 -> Shotgun -> Sniper)
              const curId = player.currentWeapon?.id || 'AK47';
              if (curId === 'AK47') {
                player.currentWeapon = WEAPONS.SHOTGUN;
              } else if (curId === 'SHOTGUN') {
                player.currentWeapon = WEAPONS.SNIPER;
              } else {
                player.currentWeapon = WEAPONS.AK47;
              }
            }
          }
        }
      }
    }

    // C. Zwolnienie kieszeni na broń miotaną (granat)
    const isThrowTouch = pockets.throwable && (
      (pockets.throwable.active && (pockets.throwable.id === null || t.identifier === pockets.throwable.id)) ||
      pockets.throwable.isDragging ||
      rightStick.draggedSlot?.type === 'GRENADE'
    );
    if (isThrowTouch) {
      const wasDragging = pockets.throwable.isDragging || (rightStick.draggedSlot?.type === 'GRENADE');
      const startX = pockets.throwable.startX || pockets.throwable.x;
      pockets.throwable.active = false;
      pockets.throwable.isDragging = false;
      pockets.throwable.id = null;

      if (wasDragging) {
        // Przeciągnięcie na prawy drążek (uzbrojenie broni miotanej / granatu na drążku)
        const dropX = t.clientX;
        const dropY = t.clientY;
        const distToStick = Math.hypot(dropX - rightStick.baseX, dropY - rightStick.baseY);
        // Jeśli przeciągnięto w stronę prawego drążka (w prawo o min. 20px LUB w promieniu 140px LUB w strefie drążka):
        if (dropX >= startX + 20 || distToStick < 140 || dropX >= rightStick.baseX - 60) {
          rightStick.armedMode = 'GRENADE';
          if (typeof triggerScreenShake === 'function') triggerScreenShake(2.0);
        }
        rightStick.draggedSlot = null;
      } else {
        // Zwykłe kliknięcie / dotknięcie ikony granatu:
        // Wybór między bronią miotaną a palną ma być WYŁĄCZNIE poprzez przeciągnięcie kieszeni na prawy drążek!
        // Dlatego tap NIE rzuca granatu i NIE zmienia trybu drążka.
      }
    }

    // D. Zwolnienie prawego drążka
    if (rightStick.active && t.identifier === rightStick.id) {
      rightStick.active = false;
      rightStick.id = null;

      if (rightStick.armedMode === 'GRENADE') {
        // Rzut wykonuje się wychyleniem drążka i puszczeniu; odległość wychylenia wyzwala siłę rzutu
        if (rightStick.power > 0.08 && !player.isDead) {
          const throwPower = Math.min(1.8, Math.max(0.6, rightStick.power * 1.3));
          if (player.throwAnim && player.throwAnim.active) {
            releaseGrenadeThrow(player, player.aimX, player.aimY, throwPower);
          } else {
            throwTacticalGrenade(player, player.aimX, player.aimY, throwPower);
          }
        } else if (player.throwAnim && player.throwAnim.active) {
          player.throwAnim.active = false;
          player.throwAnim.aiming = false;
        }
        // Drążek POZOSTAJE w trybie GRENADE! Wybór między bronią miotaną a palną
        // odbywa się WYŁĄCZNIE poprzez przeciągnięcie kieszeni na prawy drążek!
      } else {
        // Zakończenie ognia z broni palnej
        rightStick.isShooting = false;
        player.isShooting = false;
        rightStick.shotgunFiredThisTap = false;
      }

      player.isCharging = false;
      player.isStickCharging = false;
      player.chargePower = 0;
      rightStick.axisX = 0;
      rightStick.axisY = 0;
      rightStick.power = 0;
      rightStick.movedDist = 0;
      player.isAiming = false;
    }
  }

  // Zabezpieczenie globalne: gdy wszystkie palce zeszły z ekranu, ZAWSZE czyść sloty przeciągania
  if (!e.touches || e.touches.length === 0) {
    rightStick.draggedSlot = null;
    if (pockets.firearm) {
      pockets.firearm.isDragging = false;
      pockets.firearm.active = false;
      pockets.firearm.id = null;
    }
    if (pockets.throwable) {
      pockets.throwable.isDragging = false;
      pockets.throwable.active = false;
      pockets.throwable.id = null;
    }
  }
}
canvas.addEventListener('touchend', endTouch, { passive: false });
canvas.addEventListener('touchcancel', endTouch, { passive: false });
window.addEventListener('touchend', endTouch, { passive: false });
window.addEventListener('touchcancel', endTouch, { passive: false });

export const BIOME_TELEPORT_TARGETS = {
  STADIUM: 0,
  DESERT: 800,
  WINTER: 1600,
  JUNGLE: 2400,
  HELL: 3200
};

export function teleportToDistance(meters) {
  const targetX = START_X + (meters * 14);
  const isA3 = (activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY');
  const floorY = isA3 ? 1200 : GROUND_Y;

  player.x = targetX;
  player.y = floorY - player.h;
  player.onGround = true;
  player.currentGroundY = floorY;
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
  ball.y = floorY - ball.radius;
  ball.vx = 0;
  ball.vy = 0;
  ball.spin = 0;
  ball.trail = [];

  camera.targetX = player.x - (camera.viewWidth || (W / camera.zoom)) / 2;
  camera.x = camera.targetX;
  camera.targetY = GROUND_Y - (camera.viewHeight || (H / camera.zoom)) * 0.72;
  camera.y = camera.targetY;
  clampCamera();

  clearDesertSandstorm();
  clearWinterBlizzard();
  clearGore();
  clearBulletCasings();

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

// Bezpieczne pobieranie granic areny z fallbackiem (Safe Arena Bounds Clamping Fallback)
export const arenaLeft = (typeof world !== 'undefined' && world?.bounds?.minX !== undefined)
  ? world.bounds.minX
  : (typeof ARENA_LEFT !== 'undefined' ? ARENA_LEFT : 0);

export const arenaRight = (typeof world !== 'undefined' && world?.bounds?.maxX !== undefined)
  ? world.bounds.maxX
  : (typeof ARENA_RIGHT !== 'undefined' ? ARENA_RIGHT : (typeof ARENA_WIDTH !== 'undefined' ? ARENA_WIDTH : 2400));

window.teleportToDistance = teleportToDistance;
window.devSetClass = devSetClass;
window.setPlayerClass = setPlayerClass;
window.arenaLeft = arenaLeft;
window.arenaRight = arenaRight;
window.world = (typeof world !== 'undefined' && world) ? world : {
  bounds: { minX: arenaLeft, maxX: arenaRight, arenaWidth: arenaRight - arenaLeft }
};
window.camera = (typeof camera !== 'undefined') ? camera : null;
window.resetArena = resetArena;
window.executeAeroUlt = () => executeAeroUlt(player);
window.throwTacticalGrenade = () => throwTacticalGrenade(player);

export function startRound() {
  resetArena();
  if (player) {
    player.hp = 100;
    player.isDead = false;
    player.ultCooldown = 0;
    player.ultMeter = 100;
  }
  if (bot && bot.active) {
    bot.hp = 100;
    bot.isDead = false;
  }
  resetBallToPlayer(player, GROUND_Y);
}
window.startRound = startRound;


// ==========================================
// STAN GRY I SYSTEM WYBORU KLAS POSTACI
// ==========================================
let mouseScreenX = 640;
let mouseScreenY = 360;

export let gameState = GAME_STATES.CLASS_SELECT;

export const CLASS_CARDS = [
  {
    id: 'AERO',
    name: 'Aero',
    key: '1',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    role: 'LOTNIK / FREESTYLER',
    attribute: '🪽 MOBILNOŚĆ',
    desc: 'Ekstremalna mobilność powietrzna, długi lot i akrobatyczne woleje.',
    stats: ['Jetpack: 150 Pojemności', 'Wysoka zwrotność w locie', 'Spin Volley w powietrzu'],
    classObj: CLASSES.AERO
  },
  {
    id: 'ENFORCER',
    name: 'Enforcer',
    key: '2',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.45)',
    role: 'KOLOS / PANCERZ',
    attribute: '🛡️ PANCERZ / SIŁA',
    desc: 'Masywna sylwetka, potężna odporność i niszczycielskie strzały.',
    stats: ['Maksymalne Zdrowie: 160 HP', 'Odporność na odrzut', 'Brutalne uderzenia z ziemi'],
    classObj: CLASSES.ENFORCER
  },
  {
    id: 'PLAYMAKER',
    name: 'Playmaker',
    key: '3',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    role: 'TECHNIK / SNAJPER',
    attribute: '🎯 KONTROLA PIŁKI',
    desc: 'Chirurgiczna precyzja, niesamowity spin i błyskawiczny charge.',
    stats: ['Ekstremalna rotacja piłki', 'Błyskawiczny Kick Charge', 'Podkręcane trajektorie'],
    classObj: CLASSES.PLAYMAKER
  },
  {
    id: 'SWEEPER',
    name: 'Sweeper',
    key: '4',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    role: 'LIBERO / DEFENSYWA',
    attribute: '🧤 DEFENSYWA',
    desc: 'Bramkarski mur, natychmiastowe gaszenie piłki i zasięg obrony.',
    stats: ['Zwiększony zasięg wybicia', 'Pasywne wyhamowanie piłki', 'Żelazna obrona bramki'],
    classObj: CLASSES.SWEEPER
  }
];

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      context.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line.trim(), x, curY);
  return curY + lineHeight;
}

export function getClassCardRects(modalW = Math.min(940, W - 32), modalH = Math.min(500, H - 32)) {
  const modalX = (W - modalW) / 2;
  const modalY = (H - modalH) / 2;
  const cardPadding = 18;
  const gap = 14;
  const totalGaps = gap * (CLASS_CARDS.length - 1);
  const availableW = modalW - (cardPadding * 2) - totalGaps;
  const cardW = Math.floor(availableW / CLASS_CARDS.length);
  const cardH = modalH - 114;
  const startY = modalY + 98;

  return CLASS_CARDS.map((card, i) => ({
    card,
    x: modalX + cardPadding + i * (cardW + gap),
    y: startY,
    w: cardW,
    h: cardH
  }));
}

export function getHoveredClassCard(screenX, screenY) {
  if (gameState !== GAME_STATES.CLASS_SELECT) return null;
  const rects = getClassCardRects();
  for (const item of rects) {
    if (screenX >= item.x && screenX <= item.x + item.w &&
      screenY >= item.y && screenY <= item.y + item.h) {
      return item.card;
    }
  }
  return null;
}

export function drawClassSelectModal(ctx) {
  ctx.save();

  // 1. Półprzezroczyste ciemne tło (vignette / backdrop)
  ctx.fillStyle = 'rgba(5, 8, 18, 0.78)';
  ctx.fillRect(0, 0, W, H);

  // Radialny glow w tle modalu
  const bgGlow = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, Math.max(W, H) * 0.55);
  bgGlow.addColorStop(0, 'rgba(0, 229, 255, 0.10)');
  bgGlow.addColorStop(0.5, 'rgba(15, 23, 42, 0.25)');
  bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, W, H);

  // 2. Wymiary i pozycjonowanie modalu
  const modalW = Math.min(940, W - 32);
  const modalH = Math.min(500, H - 32);
  const modalX = (W - modalW) / 2;
  const modalY = (H - modalH) / 2;

  // Główny korpus okna modalu z neonową ramką
  ctx.save();
  ctx.shadowColor = 'rgba(0, 229, 255, 0.45)';
  ctx.shadowBlur = 24;

  const panelGrad = ctx.createLinearGradient(modalX, modalY, modalX, modalY + modalH);
  panelGrad.addColorStop(0, 'rgba(15, 23, 42, 0.96)');
  panelGrad.addColorStop(1, 'rgba(9, 14, 26, 0.98)');
  ctx.fillStyle = panelGrad;
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.65)';
  ctx.lineWidth = 1.8;

  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(modalX, modalY, modalW, modalH, 16);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.rect(modalX, modalY, modalW, modalH);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // Wewnętrzny pasek nagłówkowy
  ctx.save();
  ctx.textAlign = 'center';

  // Badge kategorii
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 6;
  ctx.fillText('⚡ PROTOKÓŁ ROZGRYWKI • WYBIERZ SPECJALIZACJĘ ⚡', W / 2, modalY + 34);
  ctx.shadowBlur = 0;

  // Główny nagłówek
  ctx.font = '900 24px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 229, 255, 0.8)';
  ctx.shadowBlur = 10;
  ctx.fillText('WYBIERZ SWOJĄ KLASĘ / SELECT YOUR CLASS', W / 2, modalY + 62);
  ctx.shadowBlur = 0;

  // Podtytuł z instrukcją
  ctx.font = '600 12px "Segoe UI", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('WYBIERZ KAFELEK [1-4] LUB KLIKNIJ DOWOLNE MIEJSCE / SPACJĘ ABY ROZPOCZĄĆ', W / 2, modalY + 82);

  // Linia podziału
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(modalX + 24, modalY + 92);
  ctx.lineTo(modalX + modalW - 24, modalY + 92);
  ctx.stroke();
  ctx.restore();

  // 3. Rysowanie 4 kafelków klas
  const cardRects = getClassCardRects(modalW, modalH);

  cardRects.forEach(({ card, x, y, w, h }) => {
    const isHovered = mouseScreenX >= x && mouseScreenX <= x + w &&
      mouseScreenY >= y && mouseScreenY <= y + h;

    ctx.save();

    // Tło kafelka
    const cardBg = ctx.createLinearGradient(x, y, x, y + h);
    if (isHovered) {
      cardBg.addColorStop(0, 'rgba(30, 41, 59, 0.95)');
      cardBg.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
      ctx.shadowColor = card.color;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = card.color;
      ctx.lineWidth = 2.4;
    } else {
      cardBg.addColorStop(0, 'rgba(15, 23, 42, 0.75)');
      cardBg.addColorStop(1, 'rgba(10, 15, 26, 0.88)');
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.2;
    }

    ctx.fillStyle = cardBg;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 12);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // Akcent górny kafelka w kolorze klasy
    ctx.save();
    ctx.fillStyle = card.color;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x + 12, y + 2, w - 24, 3, 2);
      ctx.fill();
    } else {
      ctx.fillRect(x + 12, y + 2, w - 24, 3);
    }
    ctx.restore();

    // Badge klawisza skrótu [ 1 ], [ 2 ], itd.
    ctx.save();
    const badgeW = 34;
    const badgeH = 22;
    const badgeX = x + w - badgeW - 12;
    const badgeY = y + 14;

    ctx.fillStyle = isHovered ? card.color : 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;

    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
      ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);
    }

    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isHovered ? '#0f172a' : '#f1f5f9';
    ctx.fillText(`[${card.key}]`, badgeX + badgeW / 2, badgeY + badgeH / 2);
    ctx.restore();

    // Nazwa klasy
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = '900 20px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = isHovered ? '#ffffff' : '#f8fafc';
    if (isHovered) {
      ctx.shadowColor = card.color;
      ctx.shadowBlur = 8;
    }
    ctx.fillText(card.name, x + 16, y + 32);
    ctx.shadowBlur = 0;

    // Atrybut główny
    ctx.font = 'bold 11px "Segoe UI", monospace';
    ctx.fillStyle = card.color;
    ctx.fillText(card.attribute, x + 16, y + 50);

    // Rola / kategoria
    ctx.font = '600 10px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(card.role, x + 16, y + 66);

    // Linia wewnątrz kafelka
    ctx.strokeStyle = isHovered ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 16, y + 76);
    ctx.lineTo(x + w - 16, y + 76);
    ctx.stroke();

    // Krótki opis roli
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#94a3b8';
    wrapText(ctx, card.desc, x + 16, y + 94, w - 32, 16);

    // Wypunktowane atrybuty / statystyki
    let statY = y + 155;
    for (const stat of card.stats) {
      ctx.font = 'bold 10px "Segoe UI", monospace';
      ctx.fillStyle = isHovered ? '#f1f5f9' : '#cbd5e1';
      ctx.fillText(`• ${stat}`, x + 16, statY);
      statY += 20;
    }

    // Dolny przycisk "WYBIERZ [klawisz]"
    const btnH = 34;
    const btnY = y + h - btnH - 14;
    const btnW = w - 32;
    const btnX = x + 16;

    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    if (isHovered) {
      btnGrad.addColorStop(0, card.color);
      btnGrad.addColorStop(1, card.color);
      ctx.shadowColor = card.color;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#ffffff';
    } else {
      btnGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      btnGrad.addColorStop(1, 'rgba(255, 255, 255, 0.03)');
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    }

    ctx.fillStyle = btnGrad;
    ctx.lineWidth = 1.2;

    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnW, btnH, 8);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.rect(btnX, btnY, btnW, btnH);
      ctx.fill();
      ctx.stroke();
    }

    ctx.font = 'bold 11px "Segoe UI", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isHovered ? '#0f172a' : '#f1f5f9';
    ctx.fillText(isHovered ? `▶ WYBIERZ KLASĘ [${card.key}]` : `WYBIERZ [${card.key}]`, btnX + btnW / 2, btnY + btnH / 2);

    ctx.restore();
  });

  ctx.restore();
}

export function selectPlayerClass(targetClass) {
  let cls = targetClass;
  if (typeof targetClass === 'string') {
    cls = CLASSES[targetClass.toUpperCase()] || CLASSES[targetClass];
  }
  if (!cls) cls = CLASSES.AERO;

  setPlayerClass(cls, player);
  gameState = GAME_STATES.PLAYING;

  // Reset i respawn gracza po zatwierdzeniu wyboru klasy
  player.isDead = false;
  player.deathTimer = 0;
  player.hp = player.currentClass?.stats?.hp || 100;
  player.maxHp = player.hp;

  const currentArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
  if (currentArena && Array.isArray(currentArena.spawns) && currentArena.spawns[0]) {
    player.x = currentArena.spawns[0].x;
    player.y = currentArena.spawns[0].y;
  } else {
    player.x = START_X;
    player.y = GROUND_Y - player.h;
  }
  if (typeof window !== 'undefined' && window.location) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('spawnX')) player.x = Number(urlParams.get('spawnX'));
    if (urlParams.has('spawnY')) player.y = Number(urlParams.get('spawnY'));
  }

  player.vx = 0;
  player.vy = 0;
  player.airVx = 0;
  player.isJumping = false;
  player.isSliding = false;
  player.isIntro = false;
  player.onGround = true;
  player.currentGroundY = player.y + player.h;
  player.jetFuel = player.jetMax || 100;

  resetBallToPlayer(player, GROUND_Y);

  if (canvas && canvas.parentElement) {
    canvas.parentElement.classList.remove('cursor-visible');
  }
  if (canvas) canvas.style.cursor = 'none';

  if (camera) {
    camera.targetX = player.x - (camera.viewWidth || (W / (camera.zoom || 1))) / 2;
    camera.x = camera.targetX;
    camera.targetY = player.y - (camera.viewHeight || (H / (camera.zoom || 1))) * 0.72;
    camera.y = camera.targetY;
  }
}
window.selectPlayerClass = selectPlayerClass;

export function openClassSelect() {
  gameState = GAME_STATES.CLASS_SELECT;
  if (canvas && canvas.parentElement) {
    canvas.parentElement.classList.add('cursor-visible');
  }
  if (canvas) canvas.style.cursor = 'default';
}
window.openClassSelect = openClassSelect;

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

export function syncDevBotButtonUI() {
  const btn = document.getElementById('dev-bot-toggle-btn');
  if (!btn) return;
  if (bot.active) {
    btn.textContent = '🤖 BOT: ON';
    btn.style.background = 'rgba(168, 85, 247, 0.35)';
    btn.style.borderColor = '#c084fc';
    btn.style.color = '#ffffff';
    btn.style.boxShadow = '0 0 12px rgba(168, 85, 247, 0.6)';
  } else {
    btn.textContent = '🤖 BOT: OFF';
    btn.style.background = '';
    btn.style.borderColor = '#a855f7';
    btn.style.color = '#c084fc';
    btn.style.boxShadow = '';
  }
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

export function syncDevArenaButtonUI() {
  const devArenaBtn = document.getElementById('dev-arena-btn');
  if (!devArenaBtn) return;
  const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
  const curId = (curArena && curArena.id) ? curArena.id : (activeArenaId || window.activeArenaId);
  if (curId === 'arena-3' || curId === 'ARENA_3' || curId === 'ARENA_FOUNDRY') {
    devArenaBtn.textContent = '🌴 Arena: 3 (Dżungla)';
    devArenaBtn.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(16, 185, 129, 0.25))';
    devArenaBtn.style.borderColor = '#22c55e';
    devArenaBtn.style.color = '#86efac';
    devArenaBtn.style.boxShadow = '0 0 12px rgba(34, 197, 94, 0.45)';
  } else if (curId === 'arena-2' || curId === 'ARENA_2' || curId === 'ARENA_2_PANDORA' || curId === 'ARENA_2_SECTOR_X') {
    devArenaBtn.textContent = '🏭 Arena: 2 (Sektor X)';
    devArenaBtn.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(16, 185, 129, 0.25))';
    devArenaBtn.style.borderColor = '#f59e0b';
    devArenaBtn.style.color = '#fde68a';
    devArenaBtn.style.boxShadow = '0 0 12px rgba(245, 158, 11, 0.55)';
  } else {
    devArenaBtn.textContent = '🏟️ Arena: 1';
    devArenaBtn.style.background = '';
    devArenaBtn.style.borderColor = '#06b6d4';
    devArenaBtn.style.color = '#22d3ee';
    devArenaBtn.style.boxShadow = '';
  }
}

let lastArenaToggleTime = 0;
export const toggleArena = (e) => {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }
  const now = performance.now();
  if (now - lastArenaToggleTime < 300) return;
  lastArenaToggleTime = now;

  let nextArena = 'ARENA_1';
  const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
  const curId = (curArena && curArena.id) ? curArena.id : (activeArenaId || window.activeArenaId);
  if (curId === 'arena-1' || curId === 'ARENA_1') {
    nextArena = 'ARENA_2';
  } else if (curId === 'arena-2' || curId === 'ARENA_2' || curId === 'ARENA_2_PANDORA' || curId === 'ARENA_2_SECTOR_X') {
    nextArena = 'ARENA_3';
  } else {
    nextArena = 'ARENA_1';
  }
  switchArena(nextArena, player, bot, ball);
  window.activeArenaId = activeArenaId;
  sendArenaSwitch(nextArena);
  syncDevArenaButtonUI();
  camera.targetX = player.x - (camera.viewWidth || (W / camera.zoom)) / 2;
  camera.x = camera.targetX;
  camera.targetY = player.y - (camera.viewHeight || (H / camera.zoom)) * 0.72;
  camera.y = camera.targetY;
  clampCamera();
  if (editorState.active) {
    renderEditorPalette();
  }
};
window.toggleArena = toggleArena;
window.switchArena = (id) => {
  switchArena(id, player, bot, ball);
  window.activeArenaId = activeArenaId;
  sendArenaSwitch(id);
  syncDevArenaButtonUI();
  camera.targetX = player.x - (camera.viewWidth || (W / camera.zoom)) / 2;
  camera.x = camera.targetX;
  camera.targetY = player.y - (camera.viewHeight || (H / camera.zoom)) * 0.72;
  camera.y = camera.targetY;
  clampCamera();
};

const devArenaBtn = document.getElementById('dev-arena-btn');
if (devArenaBtn) {
  devArenaBtn.addEventListener('click', toggleArena);
  devArenaBtn.addEventListener('touchend', toggleArena);
  syncDevArenaButtonUI();
}

// =========================================================================
// EDYTOR PRZESZKÓD (OBSTACLE EDITOR)
// =========================================================================
export const editorState = {
  active: false,
  selectedType: null,
  snapToGrid: true,
  gridSize: 20,
  surfaceSnap: true,
  snapThreshold: 16,
  hoverX: 0,
  hoverY: 0,
  cursorWorldX: 0,
  cursorWorldY: 0
};

let devEditorBtn = null;
let devEditorSubpanel = null;
let devGridBtn = null;
let devMagnetBtn = null;
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
  devGridBtn.textContent = '📐 SIATKA: 20px';
  devGridBtn.addEventListener('click', (e) => {
    e.stopPropagation(); e.preventDefault();
    editorState.snapToGrid = !editorState.snapToGrid;
    devGridBtn.textContent = editorState.snapToGrid ? '📐 SIATKA: 20px' : '📐 SIATKA: WYŁ';
    devGridBtn.style.color = editorState.snapToGrid ? '#22d3ee' : '#94a3b8';
  });
  devEditorSubpanel.appendChild(devGridBtn);

  devMagnetBtn = document.createElement('button');
  devMagnetBtn.className = 'dev-btn';
  devMagnetBtn.id = 'dev-magnet-btn';
  devMagnetBtn.title = 'Włącz/Wyłącz inteligentne przyciąganie do powierzchni platform i gruntu (Surface Magnet 16px)';
  devMagnetBtn.style.cssText = 'border-color: #10b981; color: #34d399; font-weight: 600;';
  devMagnetBtn.textContent = '🧲 MAGNET: 16px';
  devMagnetBtn.addEventListener('click', (e) => {
    e.stopPropagation(); e.preventDefault();
    editorState.surfaceSnap = !editorState.surfaceSnap;
    devMagnetBtn.textContent = editorState.surfaceSnap ? '🧲 MAGNET: 16px' : '🧲 MAGNET: WYŁ';
    devMagnetBtn.style.color = editorState.surfaceSnap ? '#34d399' : '#94a3b8';
    devMagnetBtn.style.borderColor = editorState.surfaceSnap ? '#10b981' : 'rgba(148, 163, 184, 0.3)';
  });
  devEditorSubpanel.appendChild(devMagnetBtn);

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

  const arenaKey = (activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY') ? 'ARENA_3' : ((activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2') ? 'ARENA_2' : 'ARENA_1');
  const palette = OBSTACLE_PALETTE[arenaKey] || OBSTACLE_PALETTE.ARENA_1;

  const catTitles = (arenaKey === 'ARENA_2' || arenaKey === 'ARENA_2_PANDORA' || arenaKey === 'ARENA_2_SECTOR_X') ? {
    platforms: '🏗️ Belki / Pomosty',
    defense: '🛡️ Osłony / Barykady',
    traps: '☣️ Zbiorniki Kwasu / Para'
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
  const selNorm = normalizeObstacleType(editorState.selectedType);
  buttons.forEach(btn => {
    const btnTool = btn.dataset.tool;
    const btnNorm = normalizeObstacleType(btnTool);
    if (btnTool === editorState.selectedType || (selNorm && btnNorm === selNorm)) {
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

  const worldX = camera.x + mouseScreenX / camera.zoom;
  const worldY = camera.y + mouseScreenY / camera.zoom;

  const placement = calculateObstaclePlacement(def, worldX, worldY, {
    snapToGrid: editorState.snapToGrid,
    gridSize: editorState.gridSize,
    groundY: GROUND_Y,
    surfaceSnapActive: editorState.surfaceSnap,
    snapThreshold: editorState.snapThreshold
  });

  const px = placement.x;
  const py = placement.y;
  const normType = normalizeObstacleType(def.type);
  let w = placement.w;
  let h = placement.h;
  if (!w || w <= 0) {
    w = normType === 'ammo_depot' ? 32 : (normType === 'sandbags' ? 48 : (def.w || 40));
  }
  if (!h || h <= 0) {
    h = normType === 'ammo_depot' ? 24 : (normType === 'sandbags' ? 24 : (def.h || 20));
  }

  const newObs = {
    id: 'custom_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    type: def.type,
    name: def.name,
    x: px,
    y: py,
    w: w,
    h: h,
    size: def.size || w,
    relY: GROUND_Y - py,
    thickness: h,
    isPlatform: def.isPlatform || false,
    solid: def.solid || false,
    isPickup: def.isPickup !== undefined ? def.isPickup : (normType === 'ammo_depot'),
    isInteractable: def.isInteractable !== undefined ? def.isInteractable : (normType === 'ammo_depot')
  };

  customObstacles.push(newObs);
  obstacles.push(newObs);
  spawnJetpackSparks(px + w / 2, py + h / 2, 0, 4);
  sendObstacleAdd(newObs);
}

function handleEditorRightClick() {
  const worldX = camera.x + mouseScreenX / camera.zoom;
  const worldY = camera.y + mouseScreenY / camera.zoom;

  for (let i = customObstacles.length - 1; i >= 0; i--) {
    const obs = customObstacles[i];
    const topY = obs.y !== undefined ? obs.y : (GROUND_Y - obs.relY);
    if (worldX >= obs.x - 10 && worldX <= obs.x + obs.w + 10 &&
      worldY >= topY - 10 && worldY <= topY + obs.h + 10) {
      spawnJetpackSparks(obs.x + obs.w / 2, topY + obs.h / 2, 0, 6);
      sendObstacleRemove(obs);
      customObstacles.splice(i, 1);
      const obsIdx = obstacles.indexOf(obs);
      if (obsIdx >= 0) obstacles.splice(obsIdx, 1);
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
  const handleZoomOut = (e) => {
    e.stopPropagation(); e.preventDefault();
    const cur = devZoomLevel !== null ? devZoomLevel : camera.zoom;
    setDevZoom(cur - 0.25);
    updateDevZoomLabel();
  };
  zoomOutBtn.addEventListener('click', handleZoomOut);
  zoomOutBtn.addEventListener('touchend', handleZoomOut);
  devMenu.appendChild(zoomOutBtn);

  const zoomResetBtn = document.createElement('button');
  zoomResetBtn.className = 'dev-btn';
  zoomResetBtn.id = 'dev-zoom-reset-btn';
  zoomResetBtn.title = 'Ustaw zoom dokładnie na 1.0x (widok 1:1)';
  zoomResetBtn.textContent = '🔍 Reset (1.0x)';
  const handleZoomReset = (e) => {
    e.stopPropagation(); e.preventDefault();
    setDevZoom(1.0);
    updateDevZoomLabel();
  };
  zoomResetBtn.addEventListener('click', handleZoomReset);
  zoomResetBtn.addEventListener('touchend', handleZoomReset);
  devMenu.appendChild(zoomResetBtn);

  const zoomInBtn = document.createElement('button');
  zoomInBtn.className = 'dev-btn';
  zoomInBtn.id = 'dev-zoom-in-btn';
  zoomInBtn.title = 'Przybliż widok kamery (+0.25x, max 2.5x)';
  zoomInBtn.textContent = '🔍 + Przybliż';
  const handleZoomIn = (e) => {
    e.stopPropagation(); e.preventDefault();
    const cur = devZoomLevel !== null ? devZoomLevel : camera.zoom;
    setDevZoom(cur + 0.25);
    updateDevZoomLabel();
  };
  zoomInBtn.addEventListener('click', handleZoomIn);
  zoomInBtn.addEventListener('touchend', handleZoomIn);
  devMenu.appendChild(zoomInBtn);

  const zoomAutoBtn = document.createElement('button');
  zoomAutoBtn.className = 'dev-btn';
  zoomAutoBtn.id = 'dev-zoom-auto-btn';
  zoomAutoBtn.title = 'Przywróć domyślny automatyczny zoom kamery';
  zoomAutoBtn.textContent = '🔍 Auto';
  const handleZoomAuto = (e) => {
    e.stopPropagation(); e.preventDefault();
    setDevZoom(null);
    updateDevZoomLabel();
  };
  zoomAutoBtn.addEventListener('click', handleZoomAuto);
  zoomAutoBtn.addEventListener('touchend', handleZoomAuto);
  devMenu.appendChild(zoomAutoBtn);

  updateDevZoomLabel();
}

let devTouchBtn = null;
export function updateDevTouchButtonUI() {
  if (!devTouchBtn) return;
  if (isTouchDevice) {
    devTouchBtn.textContent = '🕹️ PAD: WŁ';
    devTouchBtn.style.borderColor = '#0284c7';
    devTouchBtn.style.color = '#38bdf8';
    devTouchBtn.style.background = 'rgba(2, 132, 199, 0.22)';
    devTouchBtn.style.boxShadow = '0 0 10px rgba(56, 189, 248, 0.35)';
  } else {
    devTouchBtn.textContent = '🕹️ PAD: WYŁ';
    devTouchBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    devTouchBtn.style.color = '#94a3b8';
    devTouchBtn.style.background = 'transparent';
    devTouchBtn.style.boxShadow = 'none';
  }
}

export function toggleTouchControls(forceVal) {
  const nextVal = (typeof forceVal === 'boolean') ? forceVal : !isTouchDevice;
  setTouchDevice(nextVal);
  if (nextVal) {
    updateButtonLayout(W, H);
  }
  updateDevTouchButtonUI();
}
window.toggleTouchControls = toggleTouchControls;

export function initTouchControlsDevUI() {
  const devMenu = document.getElementById('dev-menu');
  if (!devMenu) return;

  const sep = document.createElement('span');
  sep.style.cssText = 'color: rgba(255,255,255,0.25); margin: 0 3px;';
  sep.textContent = '|';
  devMenu.appendChild(sep);

  devTouchBtn = document.createElement('button');
  devTouchBtn.className = 'dev-btn';
  devTouchBtn.id = 'dev-touch-toggle-btn';
  devTouchBtn.title = 'Włącz / Wyłącz ekranowy pad dotykowy (Wirtualny joystick i przyciski akcji) [Skrót: P]';
  const handleToggle = (e) => {
    e.stopPropagation(); e.preventDefault();
    toggleTouchControls();
  };
  devTouchBtn.addEventListener('click', handleToggle);
  devTouchBtn.addEventListener('touchend', handleToggle);
  devMenu.appendChild(devTouchBtn);
  updateDevTouchButtonUI();
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
initTouchControlsDevUI();
initNetwork();

let jumpKeyPressed = false;
let lastWPressTime = 0;
let isJetpackActive = false;
const DOUBLE_TAP_WINDOW_MS = 300;
let ctrlPressStartTime = 0;
let ctrlWasToggledOnKeyDown = false;

export function resetInputState() {
  for (const k in keys) {
    keys[k] = false;
  }
  jumpKeyPressed = false;
  isJetpackActive = false;
  ctrlPressStartTime = 0;
  ctrlWasToggledOnKeyDown = false;
  if (player) {
    player.isJetpacking = false;
    player.crouchToggled = false;
    if (player.isCharging) {
      player.isCharging = false;
      player.chargePower = 0;
      player.kickPower = 0;
    }
  }
  mouseState.lmbDown = false;
  mouseState.rmbDown = false;
  mouseState.semiFired = false;
}

window.addEventListener('blur', () => {
  resetInputState();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    resetInputState();
  }
});

// Ochrona przed przypadkowym zamknięciem karty (skrót Ctrl+W, odświeżenie itp.) w trakcie gry
window.addEventListener('beforeunload', (e) => {
  e.preventDefault();
  e.returnValue = '';
  return '';
});

// Obsługa Keyboard Lock API w trybie pełnoekranowym (pełna blokada skrótów systemowych, w tym Ctrl+W)
async function requestKeyboardLock() {
  if (typeof navigator !== 'undefined' && navigator.keyboard && typeof navigator.keyboard.lock === 'function') {
    try {
      await navigator.keyboard.lock(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight', 'Space']);
    } catch (_) { }
  }
}

document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    requestKeyboardLock();
  }
});

window.addEventListener('keydown', (e) => {
  // Bezwzględna blokada skrótu Ctrl+W / Cmd+W (zamykanie karty w przeglądarce)
  if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyW' || e.key === 'w' || e.key === 'W')) {
    e.preventDefault();
  }

  // Tryb wyboru klasy przed rozpoczęciem gry
  if (gameState === GAME_STATES.CLASS_SELECT) {
    if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyW' || e.key === 'w' || e.key === 'W')) {
      e.preventDefault();
      return;
    }
    if (e.code === 'Digit1' || e.code === 'Numpad1' || e.key === '1') {
      e.preventDefault();
      selectPlayerClass(CLASSES.AERO);
      return;
    } else if (e.code === 'Digit2' || e.code === 'Numpad2' || e.key === '2') {
      e.preventDefault();
      selectPlayerClass(CLASSES.ENFORCER);
      return;
    } else if (e.code === 'Digit3' || e.code === 'Numpad3' || e.key === '3') {
      e.preventDefault();
      selectPlayerClass(CLASSES.PLAYMAKER);
      return;
    } else if (e.code === 'Digit4' || e.code === 'Numpad4' || e.key === '4') {
      e.preventDefault();
      selectPlayerClass(CLASSES.SWEEPER);
      return;
    } else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyW' || e.code === 'KeyA' || e.code === 'KeyS' || e.code === 'KeyD') {
      e.preventDefault();
      selectPlayerClass(CLASSES.PLAYMAKER);
      return;
    }
    // Podczas wyboru klasy blokujemy wszystkie pozostałe akcje gry
    return;
  }

  // Obsługa otwierania czatu sieciowego klawiszem "T"
  if (e.code === 'KeyT' && !isChatActive) {
    const activeEl = document.activeElement;
    const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
    if (!isInput) {
      e.preventDefault();
      resetInputState();
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

  // Blokada domyślnych skrótów przeglądarki (prevent default) w trakcie rozgrywki
  // Nie blokujemy klawiszy narzędziowych / odświeżania: F12 (DevTools), F5 (Refresh) itp.
  const isFunctionKey = e.code === 'F5' || e.key === 'F5' || e.code === 'F12' || e.key === 'F12' ||
    (typeof e.key === 'string' && /^F\d+$/.test(e.key));

  if (!isFunctionKey) {
    const isControlKey = (
      e.code === 'Space' || e.key === ' ' ||
      e.code === 'Tab' || e.key === 'Tab' ||
      e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight' ||
      e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'Shift' ||
      e.code === 'ControlLeft' || e.code === 'ControlRight' || e.key === 'Control' ||
      e.code === 'AltLeft' || e.code === 'AltRight' || e.key === 'Alt'
    );

    const hasModifier = e.ctrlKey || e.shiftKey || e.altKey || e.metaKey;
    const isGameKey = (
      e.code === 'KeyW' || e.code === 'KeyA' || e.code === 'KeyS' || e.code === 'KeyD' ||
      e.code === 'KeyC' || e.code === 'KeyR' || e.code === 'KeyG' || e.code === 'KeyF' ||
      e.code === 'KeyB' || e.code === 'KeyQ' || e.code === 'KeyZ' ||
      e.code === 'Space' ||
      (typeof e.code === 'string' && (e.code.startsWith('Arrow') || e.code.startsWith('Digit') || e.code.startsWith('Numpad')))
    );

    // Blokada kombinacji np. Ctrl+W/A/S/D oraz klawiszy modyfikatorów/sterujących (Spacja, Tab, Strzałki, Shift, Ctrl, Alt)
    if (isControlKey || (hasModifier && isGameKey)) {
      e.preventDefault();
    }
  }

  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;

  if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.key === 'Control') {
    e.preventDefault();
    if (!e.repeat) {
      ctrlPressStartTime = performance.now();
      ctrlWasToggledOnKeyDown = !!player.crouchToggled;
    }
    keys.ctrl = true;
    keys.crouch = true;
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
    keys.up = true;

    // Klawisz W natychmiast podrywa postać do pionu
    player.isProne = false;
    player.isCrouching = false;
    player.crouchToggled = false;

    const isAirborne = (!player.onGround || player.isJumping || Math.abs(player.vy) > 0.5);

    if (isAirborne && player.jetpackKeyNeutralized && (player.jetFuel || 0) > 0) {
      // W POWIETRZU: uruchomienie jetpacka (tylko jeśli klawisz W został puszczony po wyskoku z ziemi)
      isJetpackActive = true;
      player.isJetpacking = true;
      jetpackAirborneSession = true;
    } else if (!player.isJumping && !player.isSliding && !player.isIntro) {
      // NA ZIEMI: normalny skok z podłoża
      const jumpForce = player.currentClass?.stats?.jumpForce || CONFIG.JUMP_FORCE;
      player.vy = -jumpForce;
      player.isJumping = true;
      player.onGround = false;
      player.airVx = player.vx;
      player.jetpackKeyNeutralized = false; // Po wyskoku z ziemi wymagamy puszczenia klawisza W
      if (spawnGrass && player.groundY) {
        spawnGrass(player.x + player.w / 2, player.groundY, player.facing);
      }
    }
  }
  if (e.code === 'Space' && !keys.space) {
    keys.space = true;
    // Spacja podrywa postać z leżenia/kucania do pionu i rozpoczyna wykop
    player.isProne = false;
    player.isCrouching = false;
    player.crouchToggled = false;
    const meleeTargets = [bot.active ? bot : null, remotePlayer.active ? remotePlayer : null].filter(Boolean);
    startKickCharge(player, meleeTargets);
  }
  if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') && !keys.slide) {
    keys.slide = true;
    keys.shift = true;
    player.crouchToggled = false;
    const minSpeed = CONFIG.MIN_RUN_SPEED || 2.5;
    if (player.onGround && Math.abs(player.vx) > minSpeed) {
      playerSlide(spawnGrass, GROUND_Y, player);
    }
  }
  if (e.code === 'KeyR') {
    if (!player.isHolstered) {
      reloadWeapon(player, player.currentWeapon);
    }
  }
  if (e.code === 'KeyQ') {
    // Klawisz 'Q' zwolniony z rzutu granatem (ult nie jest zużywany przy rzucie)
  }
  if (e.code === 'KeyG' || e.code === 'KeyF') {
    if (gameState === GAME_STATES.PLAYING && !player.isDead) {
      if (!e.repeat) {
        prepareGrenadeThrow(player);
      }
    }
  }
  if (e.code === 'KeyB') {
    resetBallToPlayer(player, GROUND_Y);
  }

  if (e.code === 'Digit1' || e.code === 'Numpad1' || e.key === '1') {
    if (player.currentWeapon?.id === 'AK47' && !player.isHolstered) {
      player.isHolstered = true;
    } else {
      player.currentWeapon = WEAPONS.AK47;
      player.isHolstered = false;
    }
  } else if (e.code === 'Digit2' || e.code === 'Numpad2' || e.key === '2') {
    if (player.currentWeapon?.id === 'SHOTGUN' && !player.isHolstered) {
      player.isHolstered = true;
    } else {
      player.currentWeapon = WEAPONS.SHOTGUN;
      player.isHolstered = false;
    }
  } else if (e.code === 'Digit3' || e.code === 'Numpad3' || e.key === '3') {
    if (player.currentWeapon?.id === 'SNIPER' && !player.isHolstered) {
      player.isHolstered = true;
    } else {
      player.currentWeapon = WEAPONS.SNIPER;
      player.isHolstered = false;
    }
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

  if (e.code === 'KeyM' || e.code === 'F2' || e.code === 'Digit0' || e.code === 'Numpad0') {
    if (!isChatActive()) {
      toggleArena();
    }
  }

  if (e.code === 'KeyP') {
    if (!isChatActive()) {
      toggleTouchControls();
    }
  }

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
    resetInputState();
    return;
  }
  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;

  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;

  if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.key === 'Control') {
    const pressDuration = performance.now() - ctrlPressStartTime;
    keys.ctrl = false;
    keys.crouch = false;

    // Krótkie kliknięcie klawisza Ctrl (< 320 ms) przełącza stan kucania (Toggle Crouch)
    if (pressDuration < 320 && !player.isProne && !player.isSliding && !player.isJumping) {
      if (ctrlWasToggledOnKeyDown) {
        // Jeśli postać była już w trybie kucania, ponowne krótkie kliknięcie podrywa ją na nogi
        if (!isCeilingBlockingStand(player, GROUND_Y)) {
          player.crouchToggled = false;
          player.isCrouching = false;
          player.isProne = false;
          player.state = 'STAND';
          player.hitboxHeight = player.h || 70;
        }
      } else {
        // Krótkie kliknięcie aktywuje kucanie
        player.crouchToggled = true;
        player.isCrouching = true;
        player.isProne = false;
        player.state = 'CROUCH';
        player.hitboxHeight = 45;
      }
    } else {
      // Długie przytrzymanie (hold-to-crouch / hold-to-prone) - zwolnienie klawisza stawia postać
      if (!isCeilingBlockingStand(player, GROUND_Y)) {
        player.crouchToggled = false;
        player.isCrouching = false;
        player.isProne = false;
        player.state = 'STAND';
        player.hitboxHeight = player.h || 70;
      }
    }
  }
  if (e.code === 'KeyS' || e.code === 'ArrowDown') {
    keys.down = false;
  }

  if (e.code === 'KeyW' || e.code === 'ArrowUp') {
    jumpKeyPressed = false;
    keys.up = false;
    player.jetpackKeyNeutralized = true;
    isJetpackActive = false;
    player.isJetpacking = false;
  }
  if (e.code === 'Space' || e.key === ' ') {
    keys.space = false;
    const meleeTargets = [bot.active ? bot : null, remotePlayer.active ? remotePlayer : null].filter(Boolean);
    executeReleaseKick(ball, player, 0, meleeTargets);
  }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC' || e.key === 'Shift') {
    keys.slide = false;
    keys.shift = false;
  }
  if (e.code === 'KeyG' || e.code === 'KeyF') {
    if (gameState === GAME_STATES.PLAYING && !player.isDead) {
      if (player.throwAnim && player.throwAnim.active) {
        releaseGrenadeThrow(player);
      } else {
        throwTacticalGrenade(player);
      }
    }
  }
});

mouseScreenX = W * 0.65;
mouseScreenY = H * 0.45;

window.addEventListener('mousemove', (e) => {
  mouseScreenX = e.clientX;
  mouseScreenY = e.clientY;
  setCameraMouseScreenPos(e.clientX, e.clientY);

  if (gameState === GAME_STATES.CLASS_SELECT) {
    const card = getHoveredClassCard(mouseScreenX, mouseScreenY);
    canvas.style.cursor = card ? 'pointer' : 'default';
  }

  if (editorState.active) {
    const worldX = camera.x + mouseScreenX / camera.zoom;
    const worldY = camera.y + mouseScreenY / camera.zoom;
    editorState.cursorWorldX = worldX;
    editorState.cursorWorldY = worldY;

    if (editorState.selectedType) {
      const def = getObstacleDef(editorState.selectedType);
      const placement = calculateObstaclePlacement(def, worldX, worldY, {
        snapToGrid: editorState.snapToGrid,
        gridSize: editorState.gridSize,
        groundY: GROUND_Y,
        surfaceSnapActive: editorState.surfaceSnap,
        snapThreshold: editorState.snapThreshold
      });
      editorState.hoverX = placement.x + placement.w / 2;
      editorState.hoverY = placement.y + placement.h / 2;
    } else {
      if (editorState.snapToGrid) {
        editorState.hoverX = Math.round(worldX / editorState.gridSize) * editorState.gridSize;
        editorState.hoverY = Math.round((worldY - GROUND_Y) / editorState.gridSize) * editorState.gridSize + GROUND_Y;
      } else {
        editorState.hoverX = Math.round(worldX);
        editorState.hoverY = Math.round(worldY);
      }
    }
  }
});

canvas.addEventListener('touchstart', (e) => {
  if (gameState === GAME_STATES.CLASS_SELECT && e.touches && e.touches[0]) {
    const touch = e.touches[0];
    const card = getHoveredClassCard(touch.clientX, touch.clientY);
    e.preventDefault();
    selectPlayerClass(card ? card.classObj : CLASSES.PLAYMAKER);
    return;
  }
}, { passive: false });

canvas.addEventListener('mousedown', (e) => {
  mouseScreenX = e.clientX;
  mouseScreenY = e.clientY;
  setCameraMouseScreenPos(e.clientX, e.clientY);

  if (gameState === GAME_STATES.CLASS_SELECT) {
    if (e.button === 0) {
      const card = getHoveredClassCard(e.clientX, e.clientY);
      selectPlayerClass(card ? card.classObj : CLASSES.PLAYMAKER);
    }
    return;
  }

  if (isChatActive) return;
  const mpModal = document.getElementById('mp-modal');
  if (mpModal && !mpModal.classList.contains('mp-modal-hidden')) return;

  // 0. Obsługa kliknięcia myszą w kafelki broni (dolny lewy róg)
  for (const btn of weaponButtons) {
    if (e.clientX >= btn.x && e.clientX <= btn.x + btn.w &&
      e.clientY >= btn.y && e.clientY <= btn.y + btn.h) {
      if (btn.id === 'GRENADE') {
        const throwAngle = -0.62;
        const throwDist = 320;
        const throwAimX = player.x + player.w / 2 + (player.facing || 1) * Math.cos(throwAngle) * throwDist;
        const throwAimY = player.y + player.h * 0.42 + Math.sin(throwAngle) * throwDist;
        throwTacticalGrenade(player, throwAimX, throwAimY);
      } else if (player.currentWeapon?.id === btn.id) {
        if (!player.isHolstered) {
          player.isHolstered = true;
        } else {
          player.isHolstered = false;
        }
      } else {
        player.currentWeapon = WEAPONS[btn.id];
        player.isHolstered = false;
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
    player.isProne = false;
    player.isCrouching = false;
    player.crouchToggled = false;
    const meleeTargets = [bot.active ? bot : null, remotePlayer.active ? remotePlayer : null].filter(Boolean);
    startKickCharge(player, meleeTargets);
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
    const meleeTargets = [bot.active ? bot : null, remotePlayer.active ? remotePlayer : null].filter(Boolean);
    executeReleaseKick(ball, player, 0, meleeTargets);
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
  const col = customCol || '#ef4444';

  const kick = player.weaponKickback || 0;
  const rise = player.muzzleRise || 0;
  const spreadGap = Math.min(18, 4 + kick * 1.5 + rise * 16);

  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
  ctx.shadowBlur = 4;

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
  const isDeathmatch = (
    activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X' ||
    activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY' ||
    (ball && !ball.active)
  );

  if (consumeHitstop()) {
    updateCamera(player, isDeathmatch ? null : ball);
    return;
  }

  // Stan wyboru klasy: pauzujemy fizykę gracza, botów i piłki
  if (gameState === GAME_STATES.CLASS_SELECT) {
    if (canvas.parentElement && !canvas.parentElement.classList.contains('cursor-visible')) {
      canvas.parentElement.classList.add('cursor-visible');
    }
    const hoveredCard = getHoveredClassCard(mouseScreenX, mouseScreenY);
    canvas.style.cursor = hoveredCard ? 'pointer' : 'default';

    mouseState.lmbDown = false;
    mouseState.rmbDown = false;

    // Ambientowe tło i ruch kamery bez symulacji fizyki
    updateCamera(player, isDeathmatch ? null : ball, { disableAimLead: true });
    updateParticles();
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
    const worldMouseX = camera.x + mouseScreenX / camera.zoom;
    const worldMouseY = camera.y + mouseScreenY / camera.zoom;
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

  // OBSŁUGA STRZELANIA GRACZA I AUTOMATYCZNEGO PRZEŁADOWANIA W BOJU
  window.activeArenaId = activeArenaId;
  const curWep = player.currentWeapon || WEAPONS.AK47;
  const isTouchFiring = rightStick.active && rightStick.isShooting && (rightStick.power >= 0.90) && (rightStick.armedMode === 'FIREARM') && !player.isDead && !player.isHolstered;
  const isHoldingFire = (mouseState.lmbDown || isTouchFiring) && !player.isDead && !player.isHolstered;

  if (curWep.auto) {
    player.isShooting = isHoldingFire;
  } else {
    player.isShooting = (!player.isHolstered) && (isTouchFiring || (player.shootPoseTimer > 0));
  }

  const curAmmoObj = player.ammo?.[curWep.id];
  const isOutOfAmmo = curAmmoObj && curAmmoObj.currentAmmo <= 0;
  const isReloading = curAmmoObj ? curAmmoObj.isReloading : !!player.isReloading;

  if (isTouchFiring) {
    // Automatyczne przeładowanie w boju, gdy amunicja spadnie do 0
    if (isOutOfAmmo && !isReloading && curAmmoObj.reserveAmmo > 0) {
      reloadWeapon(player, curWep);
    } else if (!isReloading && player.shootCooldown <= 0 && (!curAmmoObj || curAmmoObj.currentAmmo > 0)) {
      triggerPlayerShoot(player, curWep);
    }
  } else if (mouseState.lmbDown && !player.isDead) {
    if (isOutOfAmmo && !isReloading && curAmmoObj.reserveAmmo > 0) {
      reloadWeapon(player, curWep);
    } else if (!isReloading && player.shootCooldown <= 0 && (!curAmmoObj || curAmmoObj.currentAmmo > 0)) {
      if (curWep.auto) {
        triggerPlayerShoot(player, curWep);
      } else if (!mouseState.semiFired) {
        triggerPlayerShoot(player, curWep);
        mouseState.semiFired = true;
      }
    }
  }

  // SILNIK JETPACKA (Działa w powietrzu po uprzednim puszczeniu / odchyleniu drążka po skoku z ziemi)
  const isAirborne = (!player.onGround || player.isJumping || Math.abs(player.vy) > 0.5);

  if (player.onGround && !player.isJumping) {
    leftStick.jumpTriggered = false;
    leftStick.jetpackNeutralized = true;
    player.jetpackKeyNeutralized = true;
  } else if (isAirborne) {
    if (!leftStick.active || leftStick.axisY > -0.20) {
      leftStick.jetpackNeutralized = true;
    }
  }

  const isStickRaised = !!(leftStick && leftStick.active && leftStick.axisY < -0.25 && leftStick.jetpackNeutralized);
  const isTouchFlight = !!(isStickRaised && isAirborne);
  const isKeyFlight = !!(keys && (keys.up || keys.KeyW) && isAirborne && player.jetpackKeyNeutralized);
  const isFlightActive = (isKeyFlight || isTouchFlight) && !player.isDead && (player.jetFuel > 0) && !player.isSliding;
  if (isFlightActive) {
    player.isJetpacking = true;
    player.jetFuel = Math.max(0, player.jetFuel - 0.95);
    player.vy = Math.max(-8.5, player.vy - 0.95);

    let inputAxisX = 0;
    if (keys.left) inputAxisX -= 1;
    if (keys.right) inputAxisX += 1;
    if (leftStick && leftStick.active && isStickRaised && Math.abs(leftStick.axisX) > 0.05) {
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
    player.isProne = false;

    // Zabezpieczenie przed wylotem ponad najwyższą granicę nieba
    if (player.y < 20) {
      player.y = 20;
      if (player.vy < 0) player.vy = 0;
    }

    const nozzle = getJetpackNozzlePos(player);
    const myJetColors = networkState.isHost
      ? ['#00e5ff', '#38bdf8', '#0284c7', '#ffffff']
      : ['#f97316', '#fb923c', '#fdba74', '#ffffff'];
    spawnJetpackSparks(nozzle.x, nozzle.y, player.facing, 4, myJetColors, player.vx, player.vy, nozzle.angle);
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
    remotePlayer.currentGroundY = GROUND_Y;

    const rSpeed = Math.abs(remotePlayer.vx || 0);
    if (rSpeed > 0.1 && !remotePlayer.isJumping) {
      remotePlayer.stridePhase = (remotePlayer.stridePhase || 0) + rSpeed * 0.04;
    }
    updateRemotePlayer(GROUND_Y);
  }

  const mainMeleeTargets = [bot.active ? bot : null, remotePlayer.active ? remotePlayer : null].filter(Boolean);
  updateMobileControlStates(player, leftStick, btnCluster);
  updatePlayer(keys, leftStick, GROUND_Y, isDeathmatch ? null : ball, spawnGrass, player, mainMeleeTargets);
  sendPlayerState(player);

  updateParticles();
  updateJetpackParticles();
  updateMovableObstacles(GROUND_Y);
  updateGore(GROUND_Y, ARENA_PLATFORMS, customObstacles);

  const headEntities = [player];
  if (bot.active) headEntities.push(bot);
  if (remotePlayer.active) headEntities.push(remotePlayer);
  updateSeveredHeads(headEntities, GROUND_Y, ARENA_PLATFORMS);

  // Aktualizacja cyklu życia specyficznego dla aktywnej areny (np. spadające skały, łańcuchy, wózki)
  const activeArena = getActiveArena();
  activeArena?.update?.((FRAME_DURATION / 1000) || (1 / 60), headEntities, isDeathmatch ? null : ball);

  if (!isDeathmatch) {
    if (networkState.isHost || !networkState.isConnected) {
      updateBall(GROUND_Y);
      checkBallPlayerCollisions(player, GROUND_Y, spawnGrass);
      if (remotePlayer.active) {
        checkBallPlayerCollisions(remotePlayer, GROUND_Y, spawnGrass);
        checkPlayerPlatformLanding(remotePlayer, GROUND_Y);
      }
      checkObstacleCollisions(ball, GROUND_Y, player, bot);
      if (remotePlayer.active) checkObstacleCollisions(ball, GROUND_Y, remotePlayer, bot);
      sendBallState(ball);
    } else {
      // Klient – autorytatywna pozycja piłki z sieci P2P
      checkBallPlayerCollisions(player, GROUND_Y, spawnGrass);
      if (remotePlayer.active) {
        checkBallPlayerCollisions(remotePlayer, GROUND_Y, spawnGrass);
        checkPlayerPlatformLanding(remotePlayer, GROUND_Y);
      }
      checkObstacleCollisions(ball, GROUND_Y, player, bot);
    }
  } else {
    // W trybie Team Deathmatch (Arena 3) piłka jest całkowicie wycofana z gry
    if (ball.active) {
      ball.active = false;
      ball.x = -9999;
      ball.y = -9999;
      ball.vx = 0;
      ball.vy = 0;
    }
    checkObstacleCollisions(null, GROUND_Y, player, bot);
    if (remotePlayer.active) {
      checkPlayerPlatformLanding(remotePlayer, GROUND_Y);
    }

    // Zliczanie fragów w trybie Team Deathmatch
    if (player.isDead) {
      if (!player._fragRecorded) {
        arenaScore.orange++;
        player._fragRecorded = true;
      }
    } else {
      player._fragRecorded = false;
    }

    if (bot.active) {
      if (bot.isDead) {
        if (!bot._fragRecorded) {
          arenaScore.cyan++;
          bot._fragRecorded = true;
        }
      } else {
        bot._fragRecorded = false;
      }
    }

    if (remotePlayer.active) {
      if (remotePlayer.isDead) {
        if (!remotePlayer._fragRecorded) {
          arenaScore.cyan++;
          remotePlayer._fragRecorded = true;
        }
      } else {
        remotePlayer._fragRecorded = false;
      }
    }
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
    updateBotBrain(isDeathmatch ? null : ball, player, GROUND_Y, spawnGrass);
    if (!isDeathmatch) {
      checkBallPlayerCollisions(bot, GROUND_Y, spawnGrass);
    }
    checkPlayerPlatformLanding(bot, GROUND_Y);
  }

  const combatants = [player];
  if (bot.active) combatants.push(bot);
  if (remotePlayer.active) combatants.push(remotePlayer);
  const isA3Combat = (activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY');
  const effectiveGroundY = isA3Combat ? 1200 : GROUND_Y;
  updateBullets(effectiveGroundY, obstacles, isDeathmatch ? null : ball, combatants);
  updateProjectiles(effectiveGroundY, ARENA_PLATFORMS, customObstacles, combatants, isDeathmatch ? null : ball);

  updateCamera(player, isDeathmatch ? null : ball, {
    disableAimLead: !!(editorState?.active || isChatActive)
  });
  if (!isDeathmatch) {
    updateDistance(ball.x);
  }
}

let hasDismissedLoading = false;
function dismissLoadingOverlay() {
  if (hasDismissedLoading) return;
  hasDismissedLoading = true;
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.display = 'none';
    try { overlay.remove(); } catch (_) {}
  }
}

function draw() {
  dismissLoadingOverlay();
  ctx.clearRect(0, 0, W, H);
  renderArenaBackground(ctx, camera);

  ctx.save();
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  const worldLeft = camera.x;
  const worldRight = camera.x + (camera.viewWidth || (W / camera.zoom));
  const worldWidth = worldRight - worldLeft;

  const isArena2Active = (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X');
  const isArena3Active = (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3');
  if (!isArena2Active && !isArena3Active) {
    drawGround(ctx, worldLeft, worldWidth);
  }
  drawParticles(ctx);
  drawDistanceMarkers(ctx, worldLeft, worldRight);
  drawObstacles(ctx, GROUND_Y);

  drawBloodDecals(ctx);

  if (editorState.active) {
    if (editorState.snapToGrid) {
      ctx.save();
      const step = editorState.gridSize;
      const startX = Math.floor(worldLeft / step) * step;
      const endX = Math.ceil(worldRight / step) * step;
      const startY = Math.floor((camera.y - H / camera.zoom - GROUND_Y) / step) * step + GROUND_Y;
      const endY = Math.ceil((camera.y + H / camera.zoom - GROUND_Y) / step) * step + GROUND_Y;

      // Punkty siatki wyrównane do linii bazowej gruntu (GROUND_Y)
      ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
      for (let gx = startX; gx <= endX; gx += step) {
        for (let gy = startY; gy <= endY; gy += step) {
          if (gy === GROUND_Y) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.50)';
            ctx.fillRect(gx - 1.5, gy - 1.5, 3, 3);
            ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
          } else {
            ctx.fillRect(gx - 1, gy - 1, 2, 2);
          }
        }
      }
      ctx.restore();
    }

    if (editorState.selectedType) {
      const def = getObstacleDef(editorState.selectedType);
      if (def) {
        const worldX = camera.x + mouseScreenX / camera.zoom;
        const worldY = camera.y + mouseScreenY / camera.zoom;
        const placement = calculateObstaclePlacement(def, worldX, worldY, {
          snapToGrid: editorState.snapToGrid,
          gridSize: editorState.gridSize,
          groundY: GROUND_Y,
          surfaceSnapActive: editorState.surfaceSnap,
          snapThreshold: editorState.snapThreshold
        });

        const px = placement.x;
        const py = placement.y;
        const w = placement.w;
        const h = placement.h;
        const isSnapped = placement.isSnappedToSurface;

        ctx.save();
        ctx.globalAlpha = 0.65;
        drawSingleObstacleByType(ctx, def.type, px, py, w, h, GROUND_Y);

        ctx.strokeStyle = isSnapped ? '#10b981' : '#00e5ff';
        ctx.shadowColor = isSnapped ? '#10b981' : '#00e5ff';
        ctx.shadowBlur = isSnapped ? 12 : 8;
        ctx.lineWidth = isSnapped ? 2.2 : 1.8;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(px - 2, py - 2, w + 4, h + 4);
        ctx.setLineDash([]);

        // Efekt podglądu przylegania do podłoża / platformy (Bottom Anchor Contact)
        if (isSnapped) {
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(px - 3, py + h);
          ctx.lineTo(px + w + 3, py + h);
          ctx.stroke();
        }

        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = isSnapped ? '#34d399' : '#00e5ff';
        ctx.textAlign = 'center';
        const magnetBadge = isSnapped ? ` [🧲 ${placement.surfaceName || 'POWIERZCHNIA'}]` : '';
        ctx.fillText(`${def.name} (${w}x${h})${magnetBadge}`, px + w / 2, py - 6);
        ctx.restore();
      }
    }
  }

  drawBullets(ctx);
  drawProjectiles(ctx);
  drawGore(ctx);
  drawSeveredHeads(ctx, remotePlayer.active ? [player, bot, remotePlayer] : [player, bot]);
  drawJetpackParticles(ctx);

  // Celownik laserowy snajperki Barrett .50 w stylu Soldat
  drawSniperLaserSight(ctx, player);
  if (bot.active) {
    drawSniperLaserSight(ctx, bot);
  }
  if (remotePlayer.active) {
    drawSniperLaserSight(ctx, remotePlayer);
  }

  // Trajektoria balistyczna rzutu bronią miotaną (granatem)
  if (player.throwAnim && player.throwAnim.active && player.throwAnim.aiming) {
    drawGrenadeTrajectory(ctx, player, player.throwAnim.targetX, player.throwAnim.targetY, player.throwAnim.power, GROUND_Y);
  }

  drawPlayer(ctx, GROUND_Y, player);

  if (remotePlayer.active) {
    drawPlayer(ctx, GROUND_Y, remotePlayer);

    ctx.save();
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    const tagColor = networkState.isHost ? '#f97316' : '#06b6d4';
    const tagName = networkState.isHost ? '[P2: CLIENT]' : '[P1: HOST]';
    ctx.fillStyle = tagColor;
    ctx.shadowColor = tagColor;
    ctx.shadowBlur = 6;
    const tagX = remotePlayer.head ? remotePlayer.head.x : (remotePlayer.x + remotePlayer.w / 2);
    const tagY = remotePlayer.head ? (remotePlayer.head.y - 26) : (remotePlayer.y - 28);
    ctx.fillText(tagName, tagX, tagY);
    ctx.restore();
  }

  if (bot.active) {
    drawPlayer(ctx, GROUND_Y, bot);

    ctx.save();
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c084fc';
    ctx.shadowColor = 'rgba(168, 85, 247, 0.8)';
    ctx.shadowBlur = 4;
    const botTagX = bot.head ? bot.head.x : (bot.x + bot.w / 2);
    const botTagY = bot.head ? (bot.head.y - 26) : (bot.y - 26);
    ctx.fillText(bot.frozen ? '[BOT: STOP]' : '[BOT]', botTagX, botTagY);
    ctx.restore();
  }

  const isDeathmatch = (
    activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X' ||
    activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY' ||
    (ball && !ball.active)
  );

  if (!isDeathmatch) {
    drawBall(ctx);
  }

  const modalEl = document.getElementById('mp-modal') || mpModal;
  const isDevOpenForCrosshair = devMenu && !devMenu.classList.contains('dev-menu-hidden');
  const isMpOpenForCrosshair = modalEl && !modalEl.classList.contains('mp-modal-hidden');

  if (!player.isDead && !isDevOpenForCrosshair && !isMpOpenForCrosshair && !isChatActive && gameState === GAME_STATES.PLAYING) {
    drawCrosshair(ctx, player.aimX, player.aimY);
  }

  // Renderowanie elementów areny na pierwszym planie (np. łańcuchy, ołtarz, stemple)
  renderArenaForeground(ctx, camera);

  if (DEBUG_COLLIDERS && typeof drawDebugColliders === 'function') {
    drawDebugColliders(ctx, GROUND_Y, player);
  }

  ctx.restore();

  if (DEBUG_COLLIDERS) {
    ctx.save();
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText('⚡ DEBUG COLLIDERS ON [F1 / ~ to toggle]', 16, 24);
    ctx.restore();
  }

  if (gameState === GAME_STATES.CLASS_SELECT) {
    drawClassSelectModal(ctx);
  } else {
    const inKickRange = (!isDeathmatch && ball && typeof isBallInKickReach === 'function') ? isBallInKickReach(player, ball) : false;
    drawHUD(ctx, player, leftStick, btnCluster, rightStick, isDeathmatch ? null : ball, inKickRange, { activeArenaId, arenaScore, arena1State });
  }

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

if (typeof window !== 'undefined') {
  window.player = player;
  window.camera = camera;
  window.pockets = pockets;
  window.rightStick = rightStick;
  window.leftStick = leftStick;
  if (window.location) {
    const urlParams = new URLSearchParams(window.location.search);
    const autostartClass = urlParams.get('class') || urlParams.get('autostart');
    if (autostartClass) {
      selectPlayerClass(CLASSES[String(autostartClass).toUpperCase()] || CLASSES.PLAYMAKER);
    }
    if (urlParams.has('breach')) {
      const bx = Number(urlParams.get('breach')) || 1400;
      setTimeout(() => {
        if (typeof window.carveBreach === 'function') {
          window.carveBreach(bx);
        }
      }, 300);
    }
  }
}

requestAnimationFrame(loop);

