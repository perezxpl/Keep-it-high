// =========================================================================
// INPUT/TOUCHHANDLERS.JS - OBSŁUGA DOTYKOWA EKRANU MOBILNEGO (DUAL-STICK & POCKETS)
// Wydzielony moduł z js/main.js
// =========================================================================

import {
  canvas,
  W,
  H,
  GROUND_Y,
  isTouchDevice,
  setTouchDevice,
  weaponButtons,
  spawnGrass,
  dist,
  triggerScreenShake
} from '../world.js';
import {
  player,
  initiatePlayerJump,
  throwTacticalGrenade,
  prepareGrenadeThrow,
  releaseGrenadeThrow,
  prepareTomahawkThrow,
  releaseTomahawkThrow
} from '../player.js';
import { triggerEnforcerBlastJump } from '../classes/enforcer.js';
import { WEAPONS, reloadWeapon } from '../weapons.js';
import { cyclePocket1, equipPocket1Slot } from '../loadout/index.js';
import { ball } from '../ball.js';
import { bot, getActiveBots } from '../bot.js';
import { remotePlayer } from '../network.js';
import { obstacles } from '../obstacles.js';
import {
  leftStick,
  rightStick,
  btnCluster,
  pockets,
  updateButtonLayout,
  updateMobileControlStates,
  handleDynamicActionButtonPress
} from '../mobileControls.js';
import { updateDevTouchButtonUI } from '../dev/devPanel.js';
import { screenToWorld } from '../camera.js';
import {
  killstreakState,
  activateNextAvailableStreak,
  confirmMortarStrikeTarget,
  cancelMortarStrikeTargeting
} from '../killstreaks/index.js';
import { deathmatchState } from '../deathmatch/index.js';
import { matchWinState } from '../ui/rankHud.js';

let flickFirstDownTime = 0;
let flickReturnedToCenter = false;
let enforcerFlickDownTime = 0;
let enforcerFlickDownDetected = false;

export function updateDoubleFlickDetection(axisY) {
  const now = performance.now();
  const isCurrentPlatDropThrough = !!(
    player.onGround &&
    player.currentPlatform &&
    player.currentPlatform.isDropThrough === true
  );

  const doDropThrough = () => {
    player.dropThroughTimer = 22;
    if (player.currentPlatform) {
      const platThick = player.currentPlatform.thickness || player.currentPlatform.h || 20;
      player.y += platThick + 12;
      player.dropThroughPlatform = player.currentPlatform;
      player.currentPlatform = null;
      player.onGround = false;
      player.isJumping = true;
      player.isCrouching = false;
      player.vy = Math.max(player.vy || 0, 4.5);
    }
    flickFirstDownTime = 0;
    flickReturnedToCenter = false;
  };

  const isStrongDownIntent = (axisY > 0.65 && Math.abs((leftStick && leftStick.axisX) || 0) < 0.72);

  if (isStrongDownIntent) {
    if (flickFirstDownTime > 0 && flickReturnedToCenter) {
      const dt = now - flickFirstDownTime;
      if (dt >= 80 && dt <= 350) {
        if (isCurrentPlatDropThrough) {
          doDropThrough();
        }
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


export function initTouchInputHandlers({ GAME_STATE, setJetpackActive, triggerPlayerShoot }) {
window.addEventListener('touchstart', () => {
  if (!isTouchDevice) {
    setTouchDevice(true);
    updateButtonLayout(W, H);
    updateDevTouchButtonUI();
    const hudPauseBtn = document.getElementById('hud-pause-btn');
    if (hudPauseBtn && GAME_STATE.current === 'PLAYING') {
      hudPauseBtn.style.display = 'flex';
    }
  }
}, { once: true });

canvas.addEventListener('touchstart', (e) => {
  if (GAME_STATE.current !== 'PLAYING') return;
  e.preventDefault();
  if (!isTouchDevice) {
    setTouchDevice(true);
    updateButtonLayout(W, H);
    updateDevTouchButtonUI();
    const hudPauseBtn = document.getElementById('hud-pause-btn');
    if (hudPauseBtn) {
      hudPauseBtn.style.display = 'flex';
    }
  }

  // Obsługa dotknięcia ekranu podczas prezentacji wyników (podium / zwycięstwo)
  const isDmEnded = (deathmatchState.matchEnded && deathmatchState.endCelebrationTimer > 0);
  const isWinEnded = (matchWinState.won && matchWinState.timer > 0);
  if (isDmEnded || isWinEnded) {
    const t0 = e.changedTouches[0];
    const b = isDmEnded ? deathmatchState.returnButtonBounds : matchWinState.returnButtonBounds;
    const isOverBtn = b && t0 && (t0.clientX >= b.x && t0.clientX <= b.x + b.w && t0.clientY >= b.y && t0.clientY <= b.y + b.h);
    const canSkip = isDmEnded
      ? ((deathmatchState.maxEndCelebrationTimer - deathmatchState.endCelebrationTimer) > 60)
      : ((matchWinState.maxTimer - matchWinState.timer) > 60);
    if (isOverBtn || canSkip) {
      if (typeof window !== 'undefined' && typeof window.concludeMatchAndReturnToLobby === 'function') {
        window.concludeMatchAndReturnToLobby();
        return;
      }
    }
  }

  const midX = W / 2;

  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];

    // =======================================================================
    // 00. TRYB WYBORU CELU NALOTU MOŹDZIERZOWEGO (MORTAR TARGETING)
    // =======================================================================
    if (killstreakState.mortarTargeting) {
      const cb = killstreakState.mortarCancelButtonBounds;
      const pb = killstreakState.mortarPlayerButtonBounds;
      const cfb = killstreakState.mortarConfirmButtonBounds;
      const lb = killstreakState.mortarLeftNavBounds;
      const rb = killstreakState.mortarRightNavBounds;
      const kb = killstreakState.hudButtonBounds;

      // Sprawdzenie przycisku [ANULUJ]
      if (cb && t.clientX >= cb.x && t.clientX <= (cb.x + cb.w) &&
          t.clientY >= cb.y && t.clientY <= (cb.y + cb.h)) {
        cancelMortarStrikeTargeting();
        continue;
      }

      // Sprawdzenie przycisku [MOJA POZYCJA]
      if (pb && t.clientX >= pb.x && t.clientX <= (pb.x + pb.w) &&
          t.clientY >= pb.y && t.clientY <= (pb.y + pb.h)) {
        killstreakState.mortarCameraX = player?.x || 600;
        killstreakState.mortarTargetX = player?.x || 600;
        continue;
      }

      // Sprawdzenie przycisku [POTWIERDŹ NALOT]
      if (cfb && t.clientX >= cfb.x && t.clientX <= (cfb.x + cfb.w) &&
          t.clientY >= cfb.y && t.clientY <= (cfb.y + cfb.h)) {
        confirmMortarStrikeTarget(killstreakState.mortarTargetX, player);
        continue;
      }

      // Sprawdzenie bocznych przycisków nawigacyjnych
      if (lb && t.clientX >= lb.x && t.clientX <= (lb.x + lb.w) &&
          t.clientY >= lb.y && t.clientY <= (lb.y + lb.h)) {
        killstreakState.mortarCameraX = (killstreakState.mortarCameraX || (player?.x || 600)) - 420;
        killstreakState.mortarTargetX = (killstreakState.mortarTargetX || (player?.x || 600)) - 420;
        continue;
      }
      if (rb && t.clientX >= rb.x && t.clientX <= (rb.x + rb.w) &&
          t.clientY >= rb.y && t.clientY <= (rb.y + rb.h)) {
        killstreakState.mortarCameraX = (killstreakState.mortarCameraX || (player?.x || 600)) + 420;
        killstreakState.mortarTargetX = (killstreakState.mortarTargetX || (player?.x || 600)) + 420;
        continue;
      }

      // Sprawdzenie ponownego dotknięcia widgetu HUD
      if (kb && t.clientX >= (kb.x - 12) && t.clientX <= (kb.x + kb.w + 12) &&
          t.clientY >= (kb.y - 12) && t.clientY <= (kb.y + kb.h + 12)) {
        cancelMortarStrikeTargeting();
        continue;
      }

      // Wykrywanie szybkiego dwukliku (double-tap < 360ms w ten sam obszar)
      const now = performance.now();
      if (now - (killstreakState.lastTapTime || 0) < 360 && Math.abs(t.clientX - (killstreakState.lastTapX || 0)) < 40) {
        const worldPos = screenToWorld(t.clientX, t.clientY);
        confirmMortarStrikeTarget(worldPos.x, player);
        killstreakState.lastTapTime = 0;
        continue;
      }
      killstreakState.lastTapTime = now;
      killstreakState.lastTapX = t.clientX;

      // Rejestracja dotknięcia i aktualizacja pozycji celu na mapie
      killstreakState.mortarTargetTouchId = t.identifier;
      killstreakState.lastTouchScreenX = t.clientX;
      killstreakState.touchStartX = t.clientX;
      killstreakState.touchStartY = t.clientY;
      const worldPos = screenToWorld(t.clientX, t.clientY);
      killstreakState.mortarTargetX = worldPos.x;
      continue;
    }

    // =======================================================================
    // 0a. DOTKNIĘCIE WIDGETU SERII ZABÓJSTW (KILLSTREAKS)
    // =======================================================================
    const kb = killstreakState.hudButtonBounds;
    const pad = 12;
    if (kb && t.clientX >= (kb.x - pad) && t.clientX <= (kb.x + kb.w + pad) &&
      t.clientY >= (kb.y - pad) && t.clientY <= (kb.y + kb.h + pad)) {
      activateNextAvailableStreak();
      continue;
    }

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
          // Dotknięcie ikony przełącza slot w Kieszeni 1
          cyclePocket1(player, 1);
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

    // 1. Sprawdzenie dotknięcia karty broni w lewym górnym rogu (1s przytrzymanie = przeładowanie, <1s puszczenie = zmiana broni)
    const pFarmTop = pockets.firearm;
    if (pFarmTop && t.clientX >= 10 && t.clientX <= 235 && t.clientY >= 28 && t.clientY <= 78) {
      if (pFarmTop.holdTimerId) clearTimeout(pFarmTop.holdTimerId);
      rightStick.draggedSlot = null;
      pFarmTop.active = true;
      pFarmTop.id = t.identifier;
      pFarmTop.startX = t.clientX;
      pFarmTop.startY = t.clientY;
      pFarmTop.touchStartTime = performance.now();
      pFarmTop.isDragging = false;
      pFarmTop.reloadTriggered = false;
      pFarmTop.holdTimerId = setTimeout(() => {
        pFarmTop.holdTimerId = null;
        if (pFarmTop.active && !pFarmTop.isDragging && !pFarmTop.reloadTriggered) {
          pFarmTop.reloadTriggered = true;
          player.isHolstered = false;
          rightStick.armedMode = 'FIREARM';
          reloadWeapon(player, player.currentWeapon);
        }
      }, 500);
      continue;
    }

    // =======================================================================
    // LEWA STRONA EKRANU: PŁYWAJĄCY DRĄŻEK RUCHU (FLOATING / DYNAMIC JOYSTICK)
    // Drążek nie jest przyklejony do jednego miejsca – natychmiast centruje się dokładnie tam, gdzie gracz dotknie!
    // =======================================================================
    if (t.clientX < midX && !leftStick.active) {
      leftStick.active = true;
      leftStick.id = t.identifier;

      const maxR = leftStick.maxRadius || 55;
      const screenH = typeof window !== 'undefined' ? window.innerHeight : 600;

      // Centrowanie bazy drążka bezpośrednio w miejscu dotknięcia palca (z marginesem ekranu)
      leftStick.baseX = Math.round(Math.max(maxR + 8, Math.min(midX - maxR - 8, t.clientX)));
      leftStick.baseY = Math.round(Math.max(maxR + 8, Math.min(screenH - maxR - 8, t.clientY)));
      leftStick.curX = leftStick.baseX;
      leftStick.curY = leftStick.baseY;
      leftStick.axisX = 0;
      leftStick.axisY = 0;

      leftStick.downIntent = false;
      leftStick.downStartTime = 0;
      leftStick.downFlickDetected = false;

      const isAirborne = (!player.onGround || player.isJumping || Math.abs(player.vy) > 0.5);
      if (isAirborne) {
        // Nowe dotknięcie ekranu w powietrzu oznacza, że drążek był wcześniej zwolniony (zneutralizowany)
        leftStick.jetpackNeutralized = true;
      }
      const isStriker = (player.currentClass?.id === 'STRIKER');
      leftStick.isJetpacking = false;
      if (isStriker) player.isJetpacking = false;

      if (player.blastBelt) {
        player.blastBelt.isCharging = false;
        player.blastBelt.isArmed = false;
        player.isJumpCharging = false;
        player.jumpChargePower = 0;
      }
      if (performance.now() - enforcerFlickDownTime > 450) {
        enforcerFlickDownDetected = false;
        enforcerFlickDownTime = 0;
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
      if (minDist === distToAct && pAct && distToAct < pAct.r + 18) {
        pAct.active = true;
        pAct.id = t.identifier;
        const activeBots = (typeof getActiveBots === 'function') ? getActiveBots() : (bot.active ? [bot] : []);
        handleDynamicActionButtonPress(player, spawnGrass, GROUND_Y, {
          ball: ball,
          targets: [...activeBots, remotePlayer.active ? remotePlayer : null].filter(Boolean),
          obstacles: obstacles
        });
      } else if (minDist === distToFarm && pFarm && distToFarm < pFarm.r + 20) {
        if (pFarm.holdTimerId) clearTimeout(pFarm.holdTimerId);
        rightStick.draggedSlot = null;
        pFarm.active = true;
        pFarm.id = t.identifier;
        pFarm.startX = t.clientX;
        pFarm.startY = t.clientY;
        pFarm.touchStartTime = performance.now();
        pFarm.isDragging = false;
        pFarm.reloadTriggered = false;
        pFarm.holdTimerId = setTimeout(() => {
          pFarm.holdTimerId = null;
          if (pFarm.active && !pFarm.isDragging && !pFarm.reloadTriggered) {
            pFarm.reloadTriggered = true;
            player.isHolstered = false;
            rightStick.armedMode = 'FIREARM';
            reloadWeapon(player, player.currentWeapon);
          }
        }, 500);
      } else if (minDist === distToThrow && pThrow && distToThrow < pThrow.r + 18) {
        rightStick.draggedSlot = null;
        pThrow.active = true;
        pThrow.id = t.identifier;
        pThrow.startX = t.clientX;
        pThrow.startY = t.clientY;
        pThrow.touchStartTime = performance.now();
        pThrow.isDragging = false;
      } else if (!rightStick.active && distToRightStick <= maxRightTouchDist) {
        // Zabezpieczenie przed nakładaniem się stref kieszeni i prawego drążka
        if (distToAct < pAct.r + 14 || distToFarm < pFarm.r + 16 || distToThrow < pThrow.r + 14) continue;

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
          } else if (rightStick.armedMode === 'GRENADE') {
            rightStick.isShooting = false;
            if (factor > 0.03 && !player.isDead) {
              const throwPower = Math.min(1.8, Math.max(0.6, factor * 1.3));
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

    if (killstreakState.mortarTargeting && t.identifier === killstreakState.mortarTargetTouchId) {
      const lastX = (typeof killstreakState.lastTouchScreenX === 'number') ? killstreakState.lastTouchScreenX : t.clientX;
      const dx = t.clientX - lastX;
      killstreakState.lastTouchScreenX = t.clientX;

      if (Math.abs(dx) > 1) {
        const zoom = (typeof camera !== 'undefined' && camera.zoom) ? camera.zoom : 1;
        killstreakState.mortarCameraX = (killstreakState.mortarCameraX || (player?.x || 600)) - (dx / zoom);
      }
      const worldPos = screenToWorld(t.clientX, t.clientY);
      killstreakState.mortarTargetX = worldPos.x;
      continue;
    }

    // Przeciąganie palcem z przycisku akcji (celowanie rzutem toporkiem tomahawk)
    if (pockets.action && pockets.action.active && t.identifier === pockets.action.id) {
      if (pockets.action.currentMode === 'THROW_AXE') {
        const dx = t.clientX - pockets.action.x;
        const dy = t.clientY - pockets.action.y;
        const dragDist = Math.hypot(dx, dy);
        if (dragDist > 10) {
          const angle = Math.atan2(dy, dx);
          const throwDist = Math.min(480, 180 + dragDist * 3.2);
          player.aimX = player.x + (player.w || 24) * 0.5 + Math.cos(angle) * throwDist;
          player.aimY = player.y + (player.h || 70) * 0.42 + Math.sin(angle) * throwDist;
          if (Math.abs(dx) > 8) {
            player.facing = dx >= 0 ? 1 : -1;
          }
          const throwPower = Math.min(1.8, Math.max(0.6, (dragDist / 50) * 1.2));
          prepareTomahawkThrow(player, player.aimX, player.aimY, throwPower);
        }
      }
      continue;
    }

    if (leftStick.active && t.identifier === leftStick.id) {
      leftStick.curX = t.clientX;
      leftStick.curY = t.clientY;
      let dx = leftStick.curX - leftStick.baseX;
      let dy = leftStick.curY - leftStick.baseY;
      let sDist = Math.hypot(dx, dy);
      const maxR = leftStick.maxRadius || 55;

      // Dynamiczne podążanie bazy drążka za kciukiem gracza (floating joystick follow mode)
      if (sDist > maxR + 12) {
        const excess = sDist - (maxR + 12);
        leftStick.baseX += (dx / sDist) * excess;
        leftStick.baseY += (dy / sDist) * excess;
        dx = leftStick.curX - leftStick.baseX;
        dy = leftStick.curY - leftStick.baseY;
        sDist = Math.hypot(dx, dy);
      }

      const deadzone = 5;
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
          // Dla Enforcera w trakcie szybkiej kombinacji dół-góra nie włączamy trwałego kucania toggle!
          const skipToggleForEnforcer = (player.currentClass?.id === 'ENFORCER' && enforcerFlickDownDetected);
          if (!skipToggleForEnforcer && (duration < 380 || leftStick.downFlickDetected)) {
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

      const isEnforcer = (player.currentClass?.id === 'ENFORCER');
      const now = performance.now();
      const isFirmlyGrounded = !player.isJumping && !player.isSliding && !player.isIntro && (player.onGround || ((player.coyoteTimer || 0) > 0)) && Math.abs(player.vy || 0) < 2.5;

      // Enforcer: rejestracja szybkiego wychylenia w dół (krok 1 kombinacji dół-góra)
      if (isEnforcer) {
        if (leftStick.axisY > 0.42 && isFirmlyGrounded) {
          if (!enforcerFlickDownDetected) {
            enforcerFlickDownTime = now;
            enforcerFlickDownDetected = true;
          } else if (now - enforcerFlickDownTime > 450) {
            enforcerFlickDownDetected = false;
          }
        } else if (enforcerFlickDownDetected && (now - enforcerFlickDownTime > 450)) {
          enforcerFlickDownDetected = false;
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

      // Uniesienie drążka w górę (skok na ziemi/krawędzi platformy lub płynny analogowy jetpack w powietrzu)
      const canCoyoteJump = ((player.coyoteTimer || 0) > 0 && !player.isJumping && Math.abs(player.vy || 0) < 4.0);
      const isAirborne = (!player.onGround && !canCoyoteJump) || player.isJumping;

      // Jeśli drążek został odchylony z powrotem w stronę centrum (axisY > -0.12), uznaj go za zneutralizowany
      if (leftStick.axisY > -0.12) {
        leftStick.jetpackNeutralized = true;
      }

      if (leftStick.axisY < -0.16) {
        if (leftStick.axisY < -0.30) {
          player.crouchToggled = false;
          player.isCrouching = false;
          player.isProne = false;
        }

        if (isAirborne) {
          // W POWIETRZU: jetpack działa po uprzednim puszczeniu / odchyleniu drążka po skoku z ziemi
          if (leftStick.jetpackNeutralized && (player.jetFuel || 0) > 0) {
            leftStick.isJetpacking = true;
            setJetpackActive(true);
            player.isJetpacking = true;
          } else {
            leftStick.isJetpacking = false;
            setJetpackActive(false);
            player.isJetpacking = false;
          }
        } else {
          // NA ZIEMI:
          if (isEnforcer) {
            const isDownUpCombo = enforcerFlickDownDetected && ((now - enforcerFlickDownTime) <= 450);
            if (isDownUpCombo && leftStick.axisY < -0.45 && !leftStick.jumpTriggered && !player.isSliding && !player.isIntro && isFirmlyGrounded) {
              // ZDOLNOŚĆ SPECJALNA ENFORCERA: KINETIC PISTON LEAP (NATYCHMIAST BEZ ŻADNEGO ŁADOWANIA)
              enforcerFlickDownDetected = false;
              enforcerFlickDownTime = 0;
              flickFirstDownTime = 0;
              flickReturnedToCenter = false;

              player.crouchToggled = false;
              player.isCrouching = false;
              player.isProne = false;
              player.state = 'STAND';
              player.hitboxHeight = player.h || 74;
              leftStick.downIntent = false;

              triggerEnforcerBlastJump(player, leftStick.axisX, spawnGrass);
              leftStick.jumpTriggered = true;
              leftStick.jetpackNeutralized = false;
            } else if (leftStick.axisY < -0.55 && !leftStick.jumpTriggered && !player.isSliding && !player.isIntro) {
              // Zwykły skok Enforcera z nóg (gdy nie wykonano szybkiej sekwencji dół-góra)
              enforcerFlickDownDetected = false;
              enforcerFlickDownTime = 0;

              initiatePlayerJump(player, spawnGrass);
              leftStick.jumpTriggered = true;
              leftStick.jetpackNeutralized = false;
            }
          } else {
            // Skok dla pozostałych klas (Raptor, Striker)
            if (leftStick.axisY < -0.55 && !leftStick.jumpTriggered && !player.isSliding && !player.isIntro) {
              initiatePlayerJump(player, spawnGrass);
              leftStick.jumpTriggered = true;
              leftStick.jetpackNeutralized = false; // Po skoku z ziemi wymagamy puszczenia/odchylenia drążka
            }
          }
        }
      } else if (leftStick.axisY > -0.12) {
        // Powrót do centrum lub ruch w dół: odcięcie silników jetpacka i gotowość do odpalenia w locie
        leftStick.jumpTriggered = false;
        leftStick.jetpackNeutralized = true;
        leftStick.isJetpacking = false;
        setJetpackActive(false);
        player.isJetpacking = false;
      }

      // Podwójne szybkie szarpnięcie w dół (Double flick w oknie 80-350ms): zeskakiwanie z platformy
      updateDoubleFlickDetection(leftStick.axisY);
    }

    // Kieszenie broni na ekranie dotykowym: przeciąganie na drążek zostało usunięte na rzecz bezpośredniego wyboru przez kliknięcie i przytrzymania 500ms do przeładowania

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
        } else if (rightStick.armedMode === 'GRENADE') {
          rightStick.isShooting = false;
          if (power > 0.03 && !player.isDead) {
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
  } else if (e.cancelable && !e.target?.closest?.('button, a, input, select, textarea, #dev-panel-container, #dev-menu, #mp-modal, .mp-modal-box, #armory-overlay, .armory-modal-box, .ui-view-overlay, .armory-slot-card, .armory-weapon-card, .armory-picker-modal')) {
    e.preventDefault();
  }
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];

    if (killstreakState.mortarTargeting && t.identifier === killstreakState.mortarTargetTouchId) {
      killstreakState.mortarTargetTouchId = null;
      killstreakState.lastTouchScreenX = null;

      // Sprawdzenie czy puszczenie nastąpiło nad przyciskiem [ANULUJ]
      const cb = killstreakState.mortarCancelButtonBounds;
      if (cb && t.clientX >= cb.x && t.clientX <= (cb.x + cb.w) &&
          t.clientY >= cb.y && t.clientY <= (cb.y + cb.h)) {
        cancelMortarStrikeTargeting();
        continue;
      }

      // Sprawdzenie czy puszczenie nastąpiło nad przyciskiem [MOJA POZYCJA]
      const pb = killstreakState.mortarPlayerButtonBounds;
      if (pb && t.clientX >= pb.x && t.clientX <= (pb.x + pb.w) &&
          t.clientY >= pb.y && t.clientY <= (pb.y + pb.h)) {
        killstreakState.mortarCameraX = player?.x || 600;
        killstreakState.mortarTargetX = player?.x || 600;
        continue;
      }

      // Sprawdzenie czy puszczenie nastąpiło nad przyciskiem [POTWIERDŹ NALOT]
      const cfb = killstreakState.mortarConfirmButtonBounds;
      if (cfb && t.clientX >= cfb.x && t.clientX <= (cfb.x + cfb.w) &&
          t.clientY >= cfb.y && t.clientY <= (cfb.y + cfb.h)) {
        confirmMortarStrikeTarget(killstreakState.mortarTargetX, player);
        continue;
      }

      // Sprawdzenie czy nie puszczono nad widgetem HUD
      const kb = killstreakState.hudButtonBounds;
      if (kb && t.clientX >= (kb.x - 12) && t.clientX <= (kb.x + kb.w + 12) &&
          t.clientY >= (kb.y - 12) && t.clientY <= (kb.y + kb.h + 12)) {
        cancelMortarStrikeTargeting();
        continue;
      }

      // Po puszczeniu palca zachowujemy wybrany punkt celowania bez wymuszania strzału
      const worldPos = screenToWorld(t.clientX, t.clientY);
      killstreakState.mortarTargetX = worldPos.x;
      continue;
    }

    if (leftStick.active && t.identifier === leftStick.id) {
      leftStick.active = false;
      leftStick.id = null;
      leftStick.jumpTriggered = false;
      leftStick.jetpackNeutralized = true;

      setJetpackActive(false);
      leftStick.isJetpacking = false;
      player.isJetpacking = false;

      if (player.rocketBoots) {
        player.rocketBoots.isTouchCharging = false;
        player.rocketBoots.touchChargeStartTime = 0;
        player.rocketBoots.touchChargeRatio = 0;
        player.rocketBoots.touchChargePower = 0;
        player.rocketBoots.touchAirDashReady = false;
      }

      if (player.blastBelt) {
        player.blastBelt.isCharging = false;
        player.blastBelt.isArmed = false;
        player.isJumpCharging = false;
        player.jumpChargePower = 0;
      }
      if (performance.now() - enforcerFlickDownTime > 450) {
        enforcerFlickDownDetected = false;
        enforcerFlickDownTime = 0;
      }

      if (leftStick.downIntent) {
        const duration = performance.now() - leftStick.downStartTime;
        if (duration < 380 || leftStick.downFlickDetected) {
          // Szybkie pojedyncze wysunięcie w dół i puszczenie: przełącz stałe kucanie (toggle crouch)
          const skipToggleForEnforcer = (player.currentClass?.id === 'ENFORCER' && enforcerFlickDownDetected);
          if (!skipToggleForEnforcer) {
            player.crouchToggled = !player.crouchToggled;
          }
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

      // Przywrócenie domyślnej ergonomicznej pozycji po zwolnieniu dotyku
      if (leftStick.defaultBaseX) {
        leftStick.baseX = leftStick.defaultBaseX;
        leftStick.baseY = leftStick.defaultBaseY;
        leftStick.curX = leftStick.baseX;
        leftStick.curY = leftStick.baseY;
      }

      updateMobileControlStates(player, leftStick, btnCluster);
    }

    // A. Zwolnienie przycisku akcji dynamicznej
    if (pockets.action && pockets.action.active && t.identifier === pockets.action.id) {
      pockets.action.active = false;
      pockets.action.id = null;
      if (player.throwAnim && player.throwAnim.active && player.throwAnim.throwType === 'TOMAHAWK') {
        releaseTomahawkThrow(player, player.aimX, player.aimY);
      }
    }

    // B. Zwolnienie kieszeni na broń palną (kliknięcie = wybór/zmiana broni, przytrzymanie 500ms = przeładowanie)
    const isFarmTouch = pockets.firearm && (
      pockets.firearm.active && (pockets.firearm.id === null || t.identifier === pockets.firearm.id)
    );
    if (isFarmTouch) {
      if (pockets.firearm.holdTimerId) {
        clearTimeout(pockets.firearm.holdTimerId);
        pockets.firearm.holdTimerId = null;
      }
      const wasReloadTriggered = !!pockets.firearm.reloadTriggered;
      const touchStartTime = pockets.firearm.touchStartTime || 0;
      pockets.firearm.active = false;
      pockets.firearm.isDragging = false;
      pockets.firearm.id = null;
      pockets.firearm.reloadTriggered = false;
      rightStick.draggedSlot = null;

      if (!wasReloadTriggered) {
        const now = performance.now();
        const touchDur = now - touchStartTime;
        if (touchDur >= 500) {
          // Przytrzymanie 500ms -> przeładowanie bez zmiany broni
          player.isHolstered = false;
          rightStick.armedMode = 'FIREARM';
          reloadWeapon(player, player.currentWeapon);
        } else {
          // Zwykłe kliknięcie (< 500ms) -> wybór broni palnej / zmiana typu broni
          if (player.isHolstered || rightStick.armedMode !== 'FIREARM') {
            player.isHolstered = false;
            rightStick.armedMode = 'FIREARM';
          } else {
            if (player.loadout) {
              cyclePocket1(player, 1);
            } else {
              const curId = player.currentWeapon?.id || 'AK47';
              if (curId === 'AK47') {
                player.currentWeapon = WEAPONS.GLOCK || WEAPONS.SHOTGUN;
              } else if (curId === 'GLOCK') {
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

    // C. Zwolnienie kieszeni na broń miotaną (granat) - wybór przez kliknięcie
    const isThrowTouch = pockets.throwable && (
      pockets.throwable.active && (pockets.throwable.id === null || t.identifier === pockets.throwable.id)
    );
    if (isThrowTouch) {
      pockets.throwable.active = false;
      pockets.throwable.isDragging = false;
      pockets.throwable.id = null;
      rightStick.draggedSlot = null;

      // Kliknięcie / tap ikony granatu -> uzbrojenie granatu lub powrót do broni palnej
      if (rightStick.armedMode === 'GRENADE') {
        rightStick.armedMode = 'FIREARM';
        player.isHolstered = false;
      } else {
        rightStick.armedMode = 'GRENADE';
        player.isHolstered = false;
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
        // Zakończenie ognia z broni palnej lub białej
        rightStick.isShooting = false;
        player.isShooting = false;
        player.meleeNeedRelease = false;
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
      if (pockets.firearm.holdTimerId) {
        clearTimeout(pockets.firearm.holdTimerId);
        pockets.firearm.holdTimerId = null;
      }
      pockets.firearm.isDragging = false;
      pockets.firearm.active = false;
      pockets.firearm.id = null;
      pockets.firearm.reloadTriggered = false;
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

}
