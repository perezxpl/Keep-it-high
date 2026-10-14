// =========================================================================
// INPUT/PLAYERCONTROLLER.JS - PRZETWARZANIE WEJŚCIA GRACZA W PĘTLI GRY
// Łączy celowanie, strzelanie, jetpack oraz timery drążków (PC / Mobile / Gamepad)
// =========================================================================

import { CONFIG, FRAME_DURATION } from '../config.js';
import { camera, isTouchDevice, spawnJetpackSparks, spawnGrass } from '../world.js';
import { player, getJetpackNozzlePos, initiatePlayerJump } from '../player.js';
import { getJetpackFlamePalette } from '../player/jetpack.js';
import { WEAPONS, shootWeapon, getMuzzlePosition, reloadWeapon } from '../weapons.js';
import { updateStrikerBootsInput } from '../classes/striker.js';
import { updateEnforcerBeltInput } from '../classes/enforcer.js';
import { networkState, sendShootEvent } from '../network.js';
import { leftStick, rightStick, pockets } from '../mobileControls.js';
import { keys, mouseState, inputSession } from './keyboardMouse.js';
import { updateDoubleFlickDetection } from './touchHandlers.js';
import { pollGamepadInput, gamepadState } from './gamepad.js';

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

export function updatePlayerInputAndCombat(activeArenaId) {
  // Odczyt stanu kontrolera (Gamepad API), jeśli podłączony
  pollGamepadInput();

  if (!isTouchDevice) {
    const worldMouseX = camera.x + mouseState.screenX / camera.zoom;
    const worldMouseY = camera.y + mouseState.screenY / camera.zoom;
    player.aimX = worldMouseX;
    player.aimY = worldMouseY;
  }

  // CELOWNIK ZAWSZE PODĄŻAJĄCY ZA POSTACIĄ NA EKRANIE DOTYKOWYM
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

  // 1-SEKUNDOWE PRZYTRZYMANIE KIESZENI BRONI PALNEJ NA EKRANIE DOTYKOWYM -> PRZEŁADOWANIE
  if (pockets.firearm && pockets.firearm.active && !pockets.firearm.isDragging && !pockets.firearm.reloadTriggered) {
    const holdElapsed = performance.now() - (pockets.firearm.touchStartTime || 0);
    if (holdElapsed >= 850) {
      if (pockets.firearm.holdTimerId) {
        clearTimeout(pockets.firearm.holdTimerId);
        pockets.firearm.holdTimerId = null;
      }
      pockets.firearm.reloadTriggered = true;
      player.isHolstered = false;
      rightStick.armedMode = 'FIREARM';
      reloadWeapon(player, player.currentWeapon);
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
    if (!leftStick.active || leftStick.axisY > -0.12) {
      leftStick.jetpackNeutralized = true;
    }
  }

  // OBSŁUGA KLASY STRIKER: Buty odrzutowe (Rocket Boots) zamiast ciągłego lotu
  const isStriker = (player.currentClass?.id === 'STRIKER');
  if (isStriker) {
    updateStrikerBootsInput(player, keys, leftStick, gamepadState);
  }

  // OBSŁUGA KLASY ENFORCER: Pas Ładunków Wybuchowych (Blast Belt) – skok po puszczeniu i bomby >= 1000ms
  const isEnforcer = (player.currentClass?.id === 'ENFORCER');
  if (isEnforcer) {
    updateEnforcerBeltInput(player, keys, leftStick, gamepadState, spawnGrass, initiatePlayerJump);
  }

  const isStickRaised = !!(leftStick && leftStick.active && leftStick.axisY < -0.16 && leftStick.jetpackNeutralized);
  const isTouchFlight = !!(isStickRaised && isAirborne);
  const isKeyFlight = !!(keys && (keys.up || keys.KeyW) && isAirborne && player.jetpackKeyNeutralized);
  const isRaptor = (!player.currentClass || player.currentClass.id === 'RAPTOR');
  const isFlightActive = isRaptor && (isKeyFlight || isTouchFlight) && !player.isDead && (player.jetFuel > 0) && !player.isSliding;
  if (isFlightActive) {
    player.isJetpacking = true;

    let sparkCount = 4;
    if (isTouchFlight && !isKeyFlight) {
      // Wersja mobilna: siła ciągu płynnie dostosowana do wychylenia drążka (umożliwia zawis w powietrzu)
      const stickUp = Math.min(1.0, Math.max(0.0, (-leftStick.axisY - 0.15) / (0.90 - 0.15)));
      player.jetpackPower = stickUp;

      const grav = CONFIG.GRAVITY || 0.38;
      if (stickUp < 0.28) {
        // Lekkie wychylenie: wyhamowywanie opadania (miękkie szybowanie w dół)
        const cushion = stickUp / 0.28;
        player.vy -= grav * (0.35 + cushion * 0.65);
        if (player.vy > 1.2) {
          player.vy *= (1.0 - cushion * 0.18);
        }
      } else if (stickUp <= 0.52) {
        // Środkowa strefa drążka (~połowa wychylenia w górę): stabilny ZAWIS W POWIETRZU (Hover)
        player.vy -= grav;
        player.vy *= 0.76;
        if (Math.abs(player.vy) < 0.06) {
          player.vy = 0;
        }
      } else {
        // Wyższe wychylenie drążka (> 52%): płynne wznoszenie proporcjonalne do wychylenia aż do pełnej mocy
        const climbT = (stickUp - 0.52) / (1.0 - 0.52);
        const netUpThrust = 0.12 + climbT * ((0.95 - grav) - 0.12);
        const maxClimbVy = -(1.2 + climbT * 7.3);
        player.vy -= (grav + netUpThrust);
        if (player.vy < maxClimbVy) {
          player.vy += (maxClimbVy - player.vy) * 0.28;
        }
        if (player.y <= 30 && player.vy < 0) {
          player.vy = 0;
        }
      }

      const fuelDrain = 0.38 + stickUp * 0.57;
      player.jetFuel = Math.max(0, player.jetFuel - fuelDrain);
      sparkCount = Math.max(1, Math.round(1 + stickUp * 3));
    } else {
      // Klawiatura: klasyczna pelna sila ciagu
      player.jetpackPower = 1.0;
      player.jetFuel = Math.max(0, player.jetFuel - 0.95);
      player.vy = Math.max(-8.5, player.vy - 0.95);
      if (player.y <= 30 && player.vy < 0) {
        player.vy = 0;
      }
    }

    let inputAxisX = 0;
    if (keys.left) inputAxisX -= 1;
    if (keys.right) inputAxisX += 1;
    if (leftStick && leftStick.active && isStickRaised) {
      inputAxisX = Math.abs(leftStick.axisX) > 0.04 ? leftStick.axisX : 0;
    }

    const maxAirVx = (player.currentClass?.stats?.sprintMax || CONFIG.SPRINT_MAX) * 1.1;
    if (Math.abs(inputAxisX) > 0.04) {
      if (isTouchFlight && !isKeyFlight) {
        // Na drążku prędkość pozioma lotu płynnie dąży do proporcji wychylenia gałki
        const targetJetVx = inputAxisX * maxAirVx;
        if (Math.abs(player.vx) > maxAirVx && Math.sign(inputAxisX) === Math.sign(player.vx)) {
          // Szybuje szybciej w tę samą stronę – nie wyhamowuj pędu
        } else {
          player.vx += (targetJetVx - player.vx) * 0.16;
        }
      } else {
        player.vx += inputAxisX * 0.42;
      }
      const effectiveMaxJet = Math.max(maxAirVx, Math.abs(player.vx));
      player.vx = Math.max(-effectiveMaxJet, Math.min(effectiveMaxJet, player.vx));
      player.airVx = player.vx;
      const isAimingNow = player.isAiming || player.isShooting || (player.shootPoseTimer > 0);
      if (!isAimingNow) {
        if (inputAxisX > 0.1) player.facing = 1;
        else if (inputAxisX < -0.1) player.facing = -1;
      }
    } else if (isTouchFlight) {
      // Tapnięcie w centrum lub lot pionowy nie wygasza pędu szybowania
      if (Math.abs(player.vx) < 1.0) {
        player.vx *= 0.95;
        if (Math.abs(player.vx) < 0.04) player.vx = 0;
      } else {
        player.vx *= 0.995;
      }
      player.airVx = player.vx;
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
    const customFlame = player.customVisuals?.jetpackColor || (networkState.isHost ? '#00e5ff' : '#f97316');
    const myJetColors = getJetpackFlamePalette(customFlame).particles;
    spawnJetpackSparks(nozzle.x, nozzle.y, player.facing, sparkCount, myJetColors, player.vx, player.vy, nozzle.angle);
  } else {
    inputSession.isJetpackActive = false;
    if (leftStick) leftStick.isJetpacking = false;
    player.isJetpacking = false;
    player.jetpackPower = 0;
  }

  if (leftStick && leftStick.active) {
    updateDoubleFlickDetection(leftStick.axisY);
  }
}
