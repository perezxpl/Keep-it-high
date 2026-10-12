// =========================================================================
// KLASA ŚREDNIA: STRIKER – Szturmowiec / Strzelec (Rocket Boots)
// Specjalność: Buty odrzutowe (Rocket Boots), super doskoki w powietrzu
//              (50% paliwa), dopalacz naziemny z podwójnego wychylenia,
//              precyzyjne i atomowe strzały z dopalacza w bucie.
// =========================================================================
import { triggerScreenShake, spawnJetpackSparks } from '../world.js';
import { getJetpackFlamePalette } from '../player/jetpack.js';

export function getStrikerFlameColor(player) {
  if (player?.customVisuals?.jetpackColor) return player.customVisuals.jetpackColor;
  return (player?.team === 'ORANGE') ? '#f97316' : '#00e5ff';
}

export const StrikerClass = {
  id: 'STRIKER',
  name: 'Striker',
  tier: 'MEDIUM',
  role: 'Szturmowiec / Strzelec',

  // 1. Statystyki fizyczne i ruchowe
  // Biega wolniej niż Raptor (sprintMax 6.6 vs 7.4 Raptora), ale dysponuje rakietowymi zrywami
  stats: {
    walkMax: 2.1,          // Wolniejszy chód niż Raptor (2.4)
    jogMax: 4.0,           // Wolniejszy trucht niż Raptor (4.6)
    sprintMax: 6.6,        // Wolniejszy bieg podstawowy niż Raptor (7.4)
    accel: 0.22,           // Umiarkowane przyspieszenie kroku
    decel: 0.85,
    slideDecel: 0.976,     // Bardzo stabilny wślizg
    jumpForce: 9.8,        // Średni skok z nóg (9.8 vs 11.4 Raptora)
    slideDashSpeed: 12.8,  // Wybicie do wślizgu
    chargeSpeed: 0.045,
    hitReach: 60,
    whiffReach: 90,
    baseKickSpeed: 23.5,   // Bardzo szybkie uderzenie piłki (napędzane dyszą buta)
    kickPowerMult: 1.28,   // Potężniejsze uderzenie niż Raptor (1.12)
    spinMult: 1.55,        // Precyzyjna rotacja piłki
    jetMax: 100,           // 100 pkt paliwa = dokładnie 2 Super Dashe w powietrzu (po 50 pkt każdy)
    spartanKnockback: 12.0,
    spartanStagger: 18,
    spartanDamage: 12,
    kickForce: 1.25,
    kickForceMultiplier: 1.25,
    knockback: 1.10,
    knockbackMultiplier: 1.10,
    kickCooldown: 0.45
  },

  // 2. Kolorystyka i dane wizualne renderera – Grafit / Urban Slate PMC
  visuals: {
    hasRocketBoots: true,  // Aktywuje dysze dopalaczy na butach
    jerseyFront0: '#18181b',
    jerseyFront1: '#334155',
    jerseyFront2: '#475569',
    jerseyFront3: '#1e293b',
    jerseyBack0: '#0f172a',
    jerseyBack1: '#1e293b',
    jerseyBack2: '#09090b',
    jerseyStripe: '#475569',
    armColorFront: '#334155',
    armColorBack: '#1e293b',
    skinLight: '#fed7aa',
    skinMid: '#f5b078',
    skinDark: '#b45309',
    skinBack: '#de935e',
    shortsColor0: '#1e293b',
    shortsColor1: '#334155',
    shortsColor2: '#0f172a',
    legThighFront: '#334155',
    legShinFront: '#475569',
    legThighBack: '#1e293b',
    legShinBack: '#0f172a',
    bootColor: '#18181b',
    bootBack: '#09090b',
    bootAccent: '#64748b',
    crestColor: '#94a3b8',
    seamColor: '#0f172a',
    crosshairColor: '#ef4444',
    number: '10'
  },

  // 3. Cykl życia (Lifecycle Hooks)
  onInit(player) {
    player.jetFuel = this.stats.jetMax;
    player.jetMax = this.stats.jetMax;
    initRocketBootsState(player);
  },

  onDestroy(player) {
    if (player.rocketBoots) {
      player.rocketBoots.dashing = false;
    }
  },

  // Wywoływane co klatkę – pasywki i cooldowny
  onUpdate(player, ball, keys) {
    updateRocketBootsPhysics(player);
  },

  onPrePhysics(player, keys) {},
  onPostPhysics(player) {},
  onJump(player, spawnGrass) {},
  onSlide(player, spawnGrass) {},

  // Wykop – uderzenie podbite rakietowym impulsem w bucie
  onKick(player, ball, context) {
    ball.spin *= 1.4;
    // Błysk ognia z buta kopiącego przy silnym strzale
    if (ball && typeof spawnJetpackSparks === 'function') {
      const footX = player.x + (player.w || 24) / 2 + (player.facing || 1) * 16;
      const footY = player.y + (player.h || 70) - 8;
      const customFlame = getStrikerFlameColor(player);
      const colors = getJetpackFlamePalette(customFlame).particles;
      spawnJetpackSparks(footX, footY, player.facing, 6, colors, player.facing * 5, -2, 0);
    }
  },

  onBallPassiveContact(player, ball) {},
  onDrawUnder(ctx, player) {},
  onDrawOverlay(ctx, player) {}
};

// =========================================================================
// SYSTEM BUTÓW ODRZUTOWYCH (ROCKET BOOTS) DLA KLASY STRIKER
// =========================================================================

export function initRocketBootsState(p) {
  if (!p) return;
  p.rocketBoots = {
    dashing: false,
    dashTimer: 0,
    dashMaxTimer: 18,
    dashDir: 0,
    dashDirX: 0,
    dashDirY: 0,
    dashType: 'NONE', // 'GROUND' | 'AIR'
    dashSpeed: 0,
    dashInputSource: 'NONE', // 'KEYBOARD' | 'STICK'

    // Ziemia – podwójne naciśnięcie klawisza (okno do 300 ms)
    lastTapLeftTime: 0,
    lastTapRightTime: 0,
    prevKeyLeft: false,
    prevKeyRight: false,
    prevKeyUp: false,

    // Ziemia – podwójny wyrzut drążka w lewo/prawo (okno do 300 ms)
    lastGroundStickFlickTime: 0,
    lastGroundStickFlickDir: 0,
    groundStickWasCentered: true,

    // Powietrze – gotowość drążka na pojedynczy wyrzut po uprzednim cofnięciu / wyskoku
    airStickReady: false,
    prevAirborne: false,

    // Ładowanie siły drążka dotykowego przed wychyleniem (Mobile Charge Dash)
    touchChargeStartTime: 0,
    touchChargeRatio: 0, // 0.0 do 1.0 (do wizualizacji i HUD)
    touchChargePower: 0, // 0.35 do 1.0 (skalowanie siły i prędkości)
    isTouchCharging: false,
    dashPower: 1.0
  };
}

/**
 * Przetwarza wejście gracza (klawisze, drążek, pad) dla Butów Odrzutowych Strikera.
 * Wywoływane co klatkę z playerController.js.
 */
export function updateStrikerBootsInput(player, keys, leftStick, gamepadState) {
  if (!player || player.isDead || player.isIntro || player.isSliding) return;
  if (!player.rocketBoots) initRocketBootsState(player);

  const rb = player.rocketBoots;
  const now = performance.now();
  const FLICK_WINDOW_MS = 300; // Okno czasowe na podwójny wyrzut drążka / tapnięcie (do 300 ms) na ziemi

  const isAirborne = (!player.onGround || player.isJumping || Math.abs(player.vy) > 0.5);

  // 1. ODCZYT KLAWISZY (Klawiatura / D-pad)
  const keyLeft = !!(keys && (keys.left || keys.KeyA));
  const keyRight = !!(keys && (keys.right || keys.KeyD));
  const keyUp = !!(keys && (keys.up || keys.space || keys.KeyW));
  const keyDown = !!(keys && (keys.down || keys.KeyS)); // Dół - wykluczony z dashowania!

  const justPressedLeft = keyLeft && !rb.prevKeyLeft;
  const justPressedRight = keyRight && !rb.prevKeyRight;
  const justPressedUp = keyUp && !rb.prevKeyUp;
  rb.prevKeyLeft = keyLeft;
  rb.prevKeyRight = keyRight;
  rb.prevKeyUp = keyUp;

  // 2. ODCZYT DRĄŻKA ANALOGOWEGO (Dotykowy leftStick lub Gałka Pad)
  let stickX = 0;
  let stickY = 0;
  if (leftStick && leftStick.active) {
    stickX = leftStick.axisX;
    stickY = leftStick.axisY;
  } else if (gamepadState && gamepadState.connected) {
    stickX = gamepadState.leftStick.x;
    stickY = gamepadState.leftStick.y;
  }

  const stickMag = Math.hypot(stickX, stickY);
  const isStickAimingDown = stickY > 0.38 && (stickY > Math.abs(stickX) * 0.7);

  // =========================================================================
  // 3. STEROWANIE MOBILNE: ŁADOWANIE SIŁY PRZED WYCHYLENIEM (CHARGE DASH)
  // Gdy gracz przytrzyma lewy drążek w centrum, drążek ładuje energię (touchChargeRatio 0..1).
  // Wychylenie drążka uwalnia dash z siłą zależną od naładowania, a zużycie paliwa
  // i prędkość skalują się proporcjonalnie do zgromadzonej mocy.
  // =========================================================================
  const isTouchStick = !!(leftStick && leftStick.active);
  const isStickCentered = (stickMag < 0.38);

  if (isTouchStick) {
    if (isStickCentered) {
      if ((player.jetFuel || 0) >= 5) {
        if (!rb.isTouchCharging) {
          rb.isTouchCharging = true;
          rb.touchChargeStartTime = now;
          rb.touchChargeRatio = 0;
          rb.touchChargePower = 0;
        } else {
          const holdMs = now - rb.touchChargeStartTime;
          const MIN_HOLD = 100;
          const FULL_CHARGE = 580;
          if (holdMs >= MIN_HOLD) {
            const rawRatio = Math.min(1.0, (holdMs - MIN_HOLD) / (FULL_CHARGE - MIN_HOLD));
            const maxFuelRatio = Math.min(1.0, Math.max(0.1, (player.jetFuel || 0) / 50));
            rb.touchChargeRatio = Math.min(rawRatio, maxFuelRatio);
            rb.touchChargePower = 0.35 + 0.65 * rb.touchChargeRatio;
          }
        }
        if (rb.touchChargeRatio > 0.15 && Math.random() < 0.25) {
          emitBootsChargeSparks(player);
        }
      } else {
        rb.isTouchCharging = false;
        rb.touchChargeRatio = 0;
        rb.touchChargePower = 0;
      }
    } else if (stickMag >= 0.55) {
      if (rb.isTouchCharging && rb.touchChargeRatio > 0.05) {
        if (!isStickAimingDown) {
          const power = rb.touchChargePower || 0.35;
          const nx = stickX / stickMag;
          const ny = stickY / stickMag;

          if (isAirborne) {
            const fuelCost = (player.jetMax || 100) * 0.50 * power;
            player.jetFuel = Math.max(0, player.jetFuel - fuelCost);
            triggerStrikerAirDash(player, nx, ny, power);
          } else {
            if (stickY <= -0.50) {
              const fuelCost = (player.jetMax || 100) * 0.50 * power;
              player.jetFuel = Math.max(0, player.jetFuel - fuelCost);
              player.onGround = false;
              player.isJumping = true;
              player.y -= 4;
              triggerStrikerAirDash(player, nx, ny, power);
            } else if (Math.abs(stickX) >= 0.45) {
              const startFuel = 12.0 * power;
              player.jetFuel = Math.max(0, player.jetFuel - startFuel);
              triggerStrikerGroundDash(player, Math.sign(stickX), 'STICK', power);
            }
          }

          rb.isTouchCharging = false;
          rb.touchChargeStartTime = 0;
          rb.touchChargeRatio = 0;
          rb.touchChargePower = 0;
          return;
        } else {
          rb.isTouchCharging = false;
          rb.touchChargeRatio = 0;
          rb.touchChargePower = 0;
        }
      }
    }
  } else {
    rb.isTouchCharging = false;
    rb.touchChargeStartTime = 0;
    rb.touchChargeRatio = 0;
    rb.touchChargePower = 0;
  }

  // =========================================================================
  // OBSŁUGA PRZEJŚĆ ZIEMIA <-> POWIETRZE
  // =========================================================================
  if (isAirborne && !rb.prevAirborne) {
    if (rb.dashType === 'GROUND') {
      rb.dashing = false;
      rb.dashType = 'NONE';
      rb.dashInputSource = 'NONE';
    }
    rb.airStickReady = (stickMag < 0.35);
  } else if (!isAirborne && rb.prevAirborne) {
    rb.airStickReady = false;
    if (rb.dashType === 'AIR') {
      rb.dashing = false;
      rb.dashType = 'NONE';
    }
  }
  rb.prevAirborne = isAirborne;

  // =========================================================================
  // TRYB 1: POWIETRZE (AIR SUPER DASH NA KLAWIATURZE / PADZIE)
  // =========================================================================
  if (isAirborne) {
    let reqAirX = 0;
    let reqAirY = 0;

    // Drążek fizyczny (gamepad):
    if (!isTouchStick) {
      if (stickMag < 0.35) {
        rb.airStickReady = true;
      } else if (rb.airStickReady && stickMag >= 0.60 && !isStickAimingDown) {
        rb.airStickReady = false;
        reqAirX = stickX / stickMag;
        reqAirY = stickY / stickMag;
      }
    }

    // Klawiatura w powietrzu:
    if (!keyDown && reqAirX === 0 && reqAirY === 0) {
      if (justPressedUp) {
        if (keyLeft) { reqAirX = -0.707; reqAirY = -0.707; }
        else if (keyRight) { reqAirX = 0.707; reqAirY = -0.707; }
        else { reqAirX = 0; reqAirY = -1.0; }
      } else if (justPressedLeft) {
        if (keyUp) { reqAirX = -0.707; reqAirY = -0.707; }
        else { reqAirX = -1.0; reqAirY = 0; }
      } else if (justPressedRight) {
        if (keyUp) { reqAirX = 0.707; reqAirY = -0.707; }
        else { reqAirX = 1.0; reqAirY = 0; }
      }
    }

    if (reqAirX !== 0 || reqAirY !== 0) {
      const fuelCost = (player.jetMax || 100) * 0.50;
      if ((player.jetFuel || 0) >= fuelCost) {
        player.jetFuel = Math.max(0, player.jetFuel - fuelCost);
        triggerStrikerAirDash(player, reqAirX, reqAirY, 1.0);
      }
    }

    return;
  }

  // =========================================================================
  // TRYB 2: ZIEMIA (GROUND ROCKET DASH)
  // =========================================================================

  // A. JEŚLI GROUND DASH JUŻ TRWA: SPRAWDZAMY CZY GRACZ NADAL TRZYMA KIERUNEK I CZY MA PALIWO
  if (rb.dashing && rb.dashType === 'GROUND') {
    let continueGroundDash = false;

    if ((player.jetFuel || 0) <= 0) {
      continueGroundDash = false;
    } else {
      const arenaRightLimit = (player.arenaWidth || 4350) - (player.w || 24) - 10;
      if ((rb.dashDir < 0 && player.x <= 15) || (rb.dashDir > 0 && player.x >= arenaRightLimit)) {
        continueGroundDash = false;
      } else if (rb.dashInputSource === 'KEYBOARD') {
        if (rb.dashDir === -1 && keyLeft && !keyDown) continueGroundDash = true;
        if (rb.dashDir === 1 && keyRight && !keyDown) continueGroundDash = true;
      } else if (rb.dashInputSource === 'STICK') {
        if (!isStickAimingDown && Math.abs(stickX) >= 0.45 && Math.sign(stickX) === rb.dashDir) {
          continueGroundDash = true;
        }
      }
    }

    if (!continueGroundDash) {
      rb.dashing = false;
      rb.dashType = 'NONE';
      rb.dashInputSource = 'NONE';
    } else {
      // Zużycie paliwa zależne od użytej siły dasha
      const power = rb.dashPower || 1.0;
      const fuelDrain = 0.55 + 0.75 * power;
      player.jetFuel = Math.max(0, (player.jetFuel || 0) - fuelDrain);
      if (player.jetFuel <= 0) {
        rb.dashing = false;
        rb.dashType = 'NONE';
        rb.dashInputSource = 'NONE';
        return;
      }

      rb.dashSpeed = 13.5 + 5.5 * power;
      player.facing = rb.dashDir;
      player.vx = rb.dashDir * rb.dashSpeed;
      return;
    }
  }

  // B. JEŚLI GROUND DASH NIE TRWA: DETEKCJA STARTU DLA KLAWIATURY / PADA
  let triggerGroundDir = 0;
  let triggerSource = 'NONE';

  // Klawiatura na ziemi: 2x tap w 300 ms
  if (!keyDown) {
    if (justPressedUp) {
      const dt = now - (rb.lastTapUpTime || 0);
      if (dt > 0 && dt <= FLICK_WINDOW_MS) {
        rb.lastTapUpTime = 0;
        const fuelCost = (player.jetMax || 100) * 0.50;
        if ((player.jetFuel || 0) >= fuelCost) {
          player.jetFuel = Math.max(0, player.jetFuel - fuelCost);
          player.onGround = false;
          player.isJumping = true;
          player.y -= 4;
          const xDir = keyLeft ? -0.707 : (keyRight ? 0.707 : 0);
          const yDir = keyLeft || keyRight ? -0.707 : -1.0;
          triggerStrikerAirDash(player, xDir, yDir, 1.0);
          return;
        }
      } else {
        rb.lastTapUpTime = now;
      }
    } else if (justPressedLeft) {
      const dt = now - (rb.lastTapLeftTime || 0);
      if (dt > 0 && dt <= FLICK_WINDOW_MS) {
        triggerGroundDir = -1;
        triggerSource = 'KEYBOARD';
        rb.lastTapLeftTime = 0;
      } else {
        rb.lastTapLeftTime = now;
      }
    } else if (justPressedRight) {
      const dt = now - (rb.lastTapRightTime || 0);
      if (dt > 0 && dt <= FLICK_WINDOW_MS) {
        triggerGroundDir = 1;
        triggerSource = 'KEYBOARD';
        rb.lastTapRightTime = 0;
      } else {
        rb.lastTapRightTime = now;
      }
    }
  }

  // Fizyczny gamepad na ziemi (jeśli nie dotyk):
  if (!isTouchStick && triggerGroundDir === 0) {
    if (stickMag < 0.35) {
      rb.groundStickWasCentered = true;
    } else if (stickMag >= 0.50) {
      if (stickY <= -0.50) {
        if (rb.groundStickWasCentered) {
          rb.groundStickWasCentered = false;
          const dt = now - (rb.lastGroundUpFlickTime || 0);
          if (dt > 0 && dt <= FLICK_WINDOW_MS) {
            rb.lastGroundUpFlickTime = 0;
            const fuelCost = (player.jetMax || 100) * 0.50;
            if ((player.jetFuel || 0) >= fuelCost) {
              player.jetFuel = Math.max(0, player.jetFuel - fuelCost);
              player.onGround = false;
              player.isJumping = true;
              player.y -= 4;
              triggerStrikerAirDash(player, stickX / stickMag, stickY / stickMag, 1.0);
              return;
            }
          } else {
            rb.lastGroundUpFlickTime = now;
          }
        }
      } else if (!isStickAimingDown && Math.abs(stickX) >= 0.45) {
        if (rb.groundStickWasCentered) {
          rb.groundStickWasCentered = false;
          const flickDir = Math.sign(stickX);
          const dt = now - (rb.lastGroundStickFlickTime || 0);
          if (dt > 0 && dt <= FLICK_WINDOW_MS && flickDir === rb.lastGroundStickFlickDir) {
            triggerGroundDir = flickDir;
            triggerSource = 'STICK';
            rb.lastGroundStickFlickTime = 0;
          } else {
            rb.lastGroundStickFlickTime = now;
            rb.lastGroundStickFlickDir = flickDir;
          }
        }
      }
    }
  }

  if (triggerGroundDir !== 0 && (player.jetFuel || 0) >= 5) {
    triggerStrikerGroundDash(player, triggerGroundDir, triggerSource, 1.0);
  }
}

/**
 * Emituje subtelne iskierki pod stopami podczas ładowania siły dasha
 */
function emitBootsChargeSparks(player) {
  if (typeof spawnJetpackSparks !== 'function') return;
  const customFlame = getStrikerFlameColor(player);
  const colors = getJetpackFlamePalette(customFlame).particles;
  const footX = player.x + (player.w || 24) / 2 + (Math.random() * 14 - 7);
  const footY = player.y + (player.h || 70) - 2;
  spawnJetpackSparks(footX, footY, player.facing || 1, 2, colors, (Math.random() - 0.5) * 2, -Math.random() * 2 - 0.5, 0);
}

/**
 * Odpala Super Dash w powietrzu ze skalowaną siłą (power: 0.35 .. 1.0)
 */
function triggerStrikerAirDash(player, dirX, dirY, power = 1.0) {
  const rb = player.rocketBoots;
  rb.dashing = true;
  rb.dashType = 'AIR';
  rb.dashPower = power;
  rb.dashDirX = dirX;
  rb.dashDirY = dirY;
  rb.dashDir = Math.sign(dirX) || (player.facing || 1);
  rb.dashTimer = Math.round(11 + 8 * power);
  rb.dashSpeed = 16.0 + 9.5 * power;

  if (Math.abs(dirX) > 0.05) {
    player.facing = Math.sign(dirX);
  }

  player.vx = dirX * rb.dashSpeed;
  player.vy = dirY * rb.dashSpeed;
  player.airVx = player.vx;
  player.x += player.vx * 0.5;
  player.y += player.vy * 0.5;
  triggerScreenShake(1.5 + 2.5 * power);

  // Wybuch płomieni w kierunku przeciwnym do wektora lotu
  emitBootsBurstParticles(player, -dirX, -dirY, Math.round(7 + 9 * power));
}

/**
 * Odpala dopalacz w butach na ziemi (Ground Rocket Dash) ze skalowaną siłą
 */
function triggerStrikerGroundDash(player, dir, source = 'STICK', power = 1.0) {
  const rb = player.rocketBoots;
  rb.dashing = true;
  rb.dashType = 'GROUND';
  rb.dashPower = power;
  rb.dashInputSource = source;
  rb.dashDir = dir;
  rb.dashDirX = dir;
  rb.dashDirY = 0;
  rb.dashSpeed = 13.5 + 5.5 * power;
  player.facing = dir;
  player.vx = dir * rb.dashSpeed;
  player.x += player.vx * 0.5;
  triggerScreenShake(1.2 + 1.8 * power);

  // Wybuch płomieni z pięt na poziomie murawy
  emitBootsBurstParticles(player, -dir, 0, Math.round(6 + 8 * power));
}

/**
 * Emituje cząsteczki płomieni i iskier z podeszew butów w zadanym wektorze
 */
function emitBootsBurstParticles(player, thrustDirX, thrustDirY, count = 10) {
  if (typeof spawnJetpackSparks !== 'function') return;

  const customFlame = getStrikerFlameColor(player);
  const colors = getJetpackFlamePalette(customFlame).particles;

  const footX1 = player.x + (player.w || 24) / 2 + thrustDirX * 8;
  const footX2 = player.x + (player.w || 24) / 2 + thrustDirX * 3;
  const footY = player.y + (player.h || 70) - 4;

  const thrustAngle = Math.atan2(thrustDirY, thrustDirX);
  spawnJetpackSparks(footX1, footY, Math.sign(thrustDirX) || -1, count, colors, thrustDirX * 6, thrustDirY * 6, thrustAngle);
  spawnJetpackSparks(footX2, footY, Math.sign(thrustDirX) || -1, count, colors, thrustDirX * 6, thrustDirY * 6, thrustAngle);
}

/**
 * Wykonywane w każdej klatce fizyki gracza (obsługa pędu i smug ognia z butów)
 */
export function updateRocketBootsPhysics(player) {
  if (!player || !player.rocketBoots) return;
  const rb = player.rocketBoots;

  if (!rb.dashing) return;

  // Emisja płomieni z butów przez cały czas trwania zrywu
  if (typeof spawnJetpackSparks === 'function') {
    const customFlame = getStrikerFlameColor(player);
    const colors = getJetpackFlamePalette(customFlame).particles;
    const tX = -(rb.dashDirX || 0);
    const tY = -(rb.dashDirY || 0);
    const thrustAngle = Math.atan2(tY, tX);
    const footX = player.x + (player.w || 24) / 2 + tX * 6;
    const footY = player.y + (player.h || 70) - 3;
    spawnJetpackSparks(footX, footY, Math.sign(tX) || -1, 3, colors, tX * 5, tY * 5, thrustAngle);
  }

  if (rb.dashType === 'AIR') {
    rb.dashTimer--;
    // W powietrzu: utrzymujemy pełny wektor kierunkowy (góra, skosy, boki)
    player.vx = rb.dashDirX * rb.dashSpeed;
    player.vy = rb.dashDirY * rb.dashSpeed;
    player.airVx = player.vx;
    rb.dashSpeed *= 0.985;
    if (rb.dashTimer <= 0) {
      rb.dashing = false;
      rb.dashType = 'NONE';
    }
  } else if (rb.dashType === 'GROUND') {
    // Na ziemi: ciągła prędkość rakietowa dopóki gracz trzyma przycisk lub drążek
    player.vx = rb.dashDirX * rb.dashSpeed;
  }
}


