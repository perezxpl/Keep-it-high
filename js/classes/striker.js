// =========================================================================
// KLASA ŚREDNIA: STRIKER – Szturmowiec / Strzelec (Rocket Boots)
// Specjalność: Buty odrzutowe (Rocket Boots), super doskoki w powietrzu
//              (50% paliwa), dopalacz naziemny z podwójnego wychylenia,
//              precyzyjne i atomowe strzały z dopalacza w bucie.
// =========================================================================
import { triggerScreenShake, spawnJetpackSparks } from '../world.js';
import { getJetpackFlamePalette } from '../player/jetpack.js';

function getStrikerFlameColor(player) {
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
    dashMaxTimer: 12,
    dashDir: 0,
    dashType: 'NONE', // 'GROUND' | 'AIR'
    dashSpeed: 0,

    // Klawiatura / Pad D-pad – podwójne naciśnięcie
    lastTapLeftTime: 0,
    lastTapRightTime: 0,
    prevKeyLeft: false,
    prevKeyRight: false,

    // Drążek analogowy / dotykowy – podwójne wychylenie na ziemi (maksymalne -> cofnięcie -> maksymalne)
    stickPhaseX: 'IDLE', // 'IDLE' | 'PEAK_1' | 'CENTERED'
    stickFlickDir: 0,
    stickFlickTime: 0,

    // Drążek analogowy w powietrzu – ponowne wychylenie
    airStickEngaged: false,
    prevAirborne: false
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

  // =========================================================================
  // TRYB POWIETRZNY: WIELOKIERUNKOWY SUPER DASH W POWIETRZU (KOSZT: 50% PALIWA)
  // "na drążku musi reagować w kazdym kierunku oprócz dołu. Na klawiaturze w dół też nie powinno reagować"
  // =========================================================================
  if (isAirborne) {
    // Resetuj stan sekwencji naziemnego flicku
    rb.stickPhaseX = 'IDLE';

    let reqDirX = 0;
    let reqDirY = 0;

    // A. KLAWIATURA: reakcja w każdym kierunku oprócz dołu
    if (!keyDown) {
      if (justPressedUp) {
        if (keyLeft) { reqDirX = -0.707; reqDirY = -0.707; }
        else if (keyRight) { reqDirX = 0.707; reqDirY = -0.707; }
        else { reqDirX = 0; reqDirY = -1.0; } // Wystrzał pionowo w górę!
      } else if (justPressedLeft) {
        if (keyUp) { reqDirX = -0.707; reqDirY = -0.707; }
        else { reqDirX = -1.0; reqDirY = 0; }
      } else if (justPressedRight) {
        if (keyUp) { reqDirX = 0.707; reqDirY = -0.707; }
        else { reqDirX = 1.0; reqDirY = 0; }
      }
    }

    // B. DRĄŻEK: reakcja w każdym kierunku OPRÓCZ DOŁU
    // Sprawdzamy czy drążek nie jest skierowany w dół (kąt w dół: stickY > 0.40)
    const isStickAimingDown = stickY > 0.38 && (stickY > Math.abs(stickX) * 0.7);

    if (stickMag < 0.28) {
      // Drążek wrócił do strefy martwej
      rb.airStickEngaged = false;
    } else if (stickMag >= 0.58 && !isStickAimingDown) {
      // Ponowne zdecydowane wychylenie gałki w dowolną stronę OPRÓCZ DOŁU
      if (!rb.airStickEngaged) {
        rb.airStickEngaged = true;
        reqDirX = stickX / stickMag;
        reqDirY = stickY / stickMag;
      }
    }

    // Wyzwolenie Super Dashu w wybranym kierunku (jeśli gracz ma >= 50% paliwa)
    if (reqDirX !== 0 || reqDirY !== 0) {
      const fuelCost = (player.jetMax || 100) * 0.50; // Dokładnie 50% paliwa
      if ((player.jetFuel || 0) >= fuelCost) {
        player.jetFuel = Math.max(0, player.jetFuel - fuelCost);
        triggerStrikerAirDash(player, reqDirX, reqDirY);
      }
    }

    rb.prevAirborne = true;
    return;
  }

  // =========================================================================
  // TRYB NAZIEMNY: GROUND ROCKET DASH (DOPALACZ W BUTACH NA ZIEMI)
  // Podwójne naciśnięcie strzałki lewo/prawo lub podwójne wychylenie drążka
  // =========================================================================
  rb.airStickEngaged = false;
  rb.prevAirborne = false;

  let triggeredGroundDashDir = 0;

  // A. KLAWIATURA – PODWÓJNE NACIŚNIĘCIE STRZAŁKI / KLAWISZA KIERUNKU (okno 40-460 ms)
  if (justPressedLeft) {
    const dt = now - rb.lastTapLeftTime;
    if (dt >= 40 && dt <= 460) {
      triggeredGroundDashDir = -1;
      rb.lastTapLeftTime = 0;
    } else {
      rb.lastTapLeftTime = now;
    }
  }

  if (justPressedRight) {
    const dt = now - rb.lastTapRightTime;
    if (dt >= 40 && dt <= 460) {
      triggeredGroundDashDir = 1;
      rb.lastTapRightTime = 0;
    } else {
      rb.lastTapRightTime = now;
    }
  }

  // B. DRĄŻEK ANALOGOWY – PODWÓJNE WYCHYLENIE
  const isMaxFlick = Math.abs(stickX) >= 0.68;
  const isMinimalCofniecie = Math.abs(stickX) <= 0.46;

  switch (rb.stickPhaseX) {
    case 'IDLE':
      if (isMaxFlick) {
        rb.stickPhaseX = 'PEAK_1';
        rb.stickFlickDir = Math.sign(stickX);
        rb.stickFlickTime = now;
      }
      break;

    case 'PEAK_1':
      if (now - rb.stickFlickTime > 550) {
        rb.stickPhaseX = isMaxFlick ? 'PEAK_1' : 'IDLE';
        if (isMaxFlick) {
          rb.stickFlickDir = Math.sign(stickX);
          rb.stickFlickTime = now;
        }
      } else if (isMinimalCofniecie || Math.sign(stickX) !== rb.stickFlickDir) {
        rb.stickPhaseX = 'CENTERED';
      }
      break;

    case 'CENTERED':
      if (now - rb.stickFlickTime > 650) {
        rb.stickPhaseX = 'IDLE';
      } else if (isMaxFlick && Math.sign(stickX) === rb.stickFlickDir) {
        triggeredGroundDashDir = rb.stickFlickDir;
        rb.stickPhaseX = 'IDLE';
      }
      break;
  }

  if (triggeredGroundDashDir !== 0) {
    triggerStrikerGroundDash(player, triggeredGroundDashDir);
  }
}

/**
 * Odpala Super Dash w powietrzu w dowolnym zadanym kierunku prócz dołu
 */
function triggerStrikerAirDash(player, dirX, dirY) {
  const rb = player.rocketBoots;
  rb.dashing = true;
  rb.dashType = 'AIR';
  rb.dashDirX = dirX;
  rb.dashDirY = dirY;
  rb.dashDir = Math.sign(dirX) || (player.facing || 1);
  rb.dashTimer = 16;
  rb.dashSpeed = 22.0;

  if (Math.abs(dirX) > 0.1) {
    player.facing = Math.sign(dirX);
  }

  player.vx = dirX * 22.0;
  player.vy = dirY * 22.0;
  player.airVx = player.vx;
  triggerScreenShake(3.5);

  // Wybuch płomieni w kierunku przeciwnym do wektora lotu
  emitBootsBurstParticles(player, -dirX, -dirY, 14);
}

/**
 * Odpala dopalacz w butach na ziemi (Ground Rocket Dash)
 */
function triggerStrikerGroundDash(player, dir) {
  const rb = player.rocketBoots;
  rb.dashing = true;
  rb.dashType = 'GROUND';
  rb.dashDirX = dir;
  rb.dashDirY = 0;
  rb.dashDir = dir;
  rb.dashTimer = 18;
  rb.dashSpeed = 16.5;
  player.facing = dir;
  player.vx = dir * 16.5;
  triggerScreenShake(2.5);

  // Wybuch płomieni z pięt na poziomie murawy
  emitBootsBurstParticles(player, -dir, 0, 10);
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

  if (!rb.dashing || rb.dashTimer <= 0) {
    rb.dashing = false;
    return;
  }

  rb.dashTimer--;

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
    // W powietrzu: utrzymujemy pełny wektor kierunkowy (góra, skosy, boki)
    player.vx = rb.dashDirX * rb.dashSpeed;
    player.vy = rb.dashDirY * rb.dashSpeed;
    player.airVx = player.vx;
    rb.dashSpeed *= 0.985;
  } else {
    // Na ziemi: gwałtowny zryw ze stopniowym wyhamowywaniem do sprintu
    player.vx = rb.dashDirX * rb.dashSpeed;
    rb.dashSpeed *= 0.94;
  }

  if (rb.dashTimer <= 0) {
    rb.dashing = false;
  }
}


