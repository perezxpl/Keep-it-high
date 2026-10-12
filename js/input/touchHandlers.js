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
  releaseGrenadeThrow
} from '../player.js';
import { WEAPONS, reloadWeapon } from '../weapons.js';
import { ball } from '../ball.js';
import { bot } from '../bot.js';
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

let flickFirstDownTime = 0;
let flickReturnedToCenter = false;

export function updateDoubleFlickDetection(axisY) {
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


export function initTouchInputHandlers({ GAME_STATE, setJetpackActive, triggerPlayerShoot }) {
window.addEventListener('touchstart', () => {
  if (!isTouchDevice) {
    setTouchDevice(true);
    updateButtonLayout(W, H);
    updateDevTouchButtonUI();
  }
}, { once: true });

canvas.addEventListener('touchstart', (e) => {
  if (GAME_STATE.current !== 'PLAYING') return;
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
      if (isAirborne && leftStick.jetpackNeutralized && leftStick.axisY < -0.16 && (player.jetFuel || 0) > 0) {
        leftStick.isJetpacking = true;
        setJetpackActive(true);
        player.isJetpacking = true;
      } else {
        leftStick.isJetpacking = false;
      }
    }

    // Sprawdzenie dotknięcia karty broni w lewym górnym rogu (1s przytrzymanie = przeładowanie, <1s puszczenie = zmiana broni)
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
      }, 850);
      continue;
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
        handleDynamicActionButtonPress(player, spawnGrass, GROUND_Y, {
          ball: ball,
          targets: [bot.active ? bot : null, remotePlayer.active ? remotePlayer : null].filter(Boolean),
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
        }, 850);
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
            if (rightStick.isShooting && !player.isDead && !player.isHolstered) {
              const curWep = player.currentWeapon || WEAPONS.AK47;
              if (player.shootCooldown <= 0) {
                triggerPlayerShoot(player, curWep);
              }
            }
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

      // Uniesienie drążka w górę (skok na ziemi lub płynny analogowy jetpack w powietrzu)
      const isAirborne = (!player.onGround || player.isJumping || Math.abs(player.vy) > 0.5);

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
          // NA ZIEMI: natychmiastowy skok przy wychyleniu w górę (axisY < -0.55)
          if (leftStick.axisY < -0.55 && !leftStick.jumpTriggered && !player.isSliding && !player.isIntro) {
            initiatePlayerJump(player, spawnGrass);
            leftStick.jumpTriggered = true;
            leftStick.jetpackNeutralized = false; // Po skoku z ziemi wymagamy puszczenia/odchylenia drążka
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

    // A. Przeciąganie kieszeni na broń palną (tylko gdy faktycznie przeciągano w prawo na drążek celowania)
    if (pockets.firearm && pockets.firearm.active && t.identifier === pockets.firearm.id) {
      const dxRight = t.clientX - pockets.firearm.startX;
      const distFromPocket = Math.hypot(t.clientX - pockets.firearm.x, t.clientY - pockets.firearm.y);
      const canDragToEquip = (rightStick.armedMode !== 'FIREARM' || player.isHolstered);
      if (!pockets.firearm.reloadTriggered && canDragToEquip && (dxRight > 38 && distFromPocket > pockets.firearm.r + 12 || pockets.firearm.isDragging)) {
        if (pockets.firearm.holdTimerId) {
          clearTimeout(pockets.firearm.holdTimerId);
          pockets.firearm.holdTimerId = null;
        }
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

      setJetpackActive(false);
      leftStick.isJetpacking = false;
      player.isJetpacking = false;

      if (player.rocketBoots) {
        player.rocketBoots.isTouchCharging = false;
        player.rocketBoots.touchChargeStartTime = 0;
        player.rocketBoots.touchChargeRatio = 0;
        player.rocketBoots.touchChargePower = 0;
      }

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
      if (pockets.firearm.holdTimerId) {
        clearTimeout(pockets.firearm.holdTimerId);
        pockets.firearm.holdTimerId = null;
      }
      const wasDragging = pockets.firearm.isDragging || (rightStick.draggedSlot?.type === 'FIREARM');
      const wasReloadTriggered = !!pockets.firearm.reloadTriggered;
      const touchStartTime = pockets.firearm.touchStartTime || 0;
      const startX = pockets.firearm.startX || pockets.firearm.x;
      pockets.firearm.active = false;
      pockets.firearm.isDragging = false;
      pockets.firearm.id = null;
      pockets.firearm.reloadTriggered = false;

      if (wasDragging) {
        // Przeciągnięcie na prawy drążek (założenie broni palnej na ręce)
        const dropX = t.clientX;
        const dropY = t.clientY;
        const distToStick = Math.hypot(dropX - rightStick.baseX, dropY - rightStick.baseY);
        if (dropX >= startX + 35 || distToStick < 75) {
          rightStick.armedMode = 'FIREARM';
          player.isHolstered = false;
          if (typeof triggerScreenShake === 'function') triggerScreenShake(2.0);
        }
        rightStick.draggedSlot = null;
      } else if (!wasReloadTriggered) {
        // Puszczenie kieszeni broni palnej:
        const now = performance.now();
        const touchDur = now - touchStartTime;
        if (touchDur >= 850) {
          // Przytrzymanie (~1 sekunda) -> przeładowanie bez zmiany broni
          player.isHolstered = false;
          rightStick.armedMode = 'FIREARM';
          reloadWeapon(player, player.currentWeapon);
        } else {
          // Puszczenie ikony poniżej 1 sekundy (< 850 ms) -> zmiana broni po puszczeniu!
          if (player.isHolstered || rightStick.armedMode !== 'FIREARM') {
            player.isHolstered = false;
            rightStick.armedMode = 'FIREARM';
          } else {
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
