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

  const justPressedLeft = keyLeft && !rb.prevKeyLeft;
  const justPressedRight = keyRight && !rb.prevKeyRight;
  rb.prevKeyLeft = keyLeft;
  rb.prevKeyRight = keyRight;

  // 2. ODCZYT DRĄŻKA ANALOGOWEGO (Dotykowy leftStick lub Gałka Pad)
  let stickX = 0;
  if (leftStick && leftStick.active) {
    stickX = leftStick.axisX;
  } else if (gamepadState && gamepadState.connected) {
    stickX = gamepadState.leftStick.x;
  }

  // =========================================================================
  // TRYB POWIETRZNY: SUPER DASH W POWIETRZU (KOSZT: 50% PALIWA)
  // "każde ponowne wychylenie drążka lub strzałka w powietrzu to dodatkowy super dash który zabiera 50% paliwa"
  // =========================================================================
  if (isAirborne) {
    // Resetuj stan sekwencji naziemnego flicku
    rb.stickPhaseX = 'IDLE';

    let requestedAirDashDir = 0;

    // A. Klawiatura: naciśnięcie strzałki w powietrzu
    if (justPressedLeft) {
      requestedAirDashDir = -1;
    } else if (justPressedRight) {
      requestedAirDashDir = 1;
    }

    // B. Drążek w powietrzu: ponowne wychylenie gałki
    if (Math.abs(stickX) < 0.32) {
      // Drążek wrócił w okolice środka / spoczynku
      rb.airStickEngaged = false;
    } else if (Math.abs(stickX) >= 0.68) {
      // Wychylenie gałki na zewnątrz
      if (!rb.airStickEngaged) {
        rb.airStickEngaged = true;
        requestedAirDashDir = Math.sign(stickX);
      }
    }

    // Wyzwolenie Super Dashu w powietrzu (jeśli gracz ma >= 50% paliwa)
    if (requestedAirDashDir !== 0) {
      const fuelCost = (player.jetMax || 100) * 0.50; // Dokładnie 50% paliwa
      if ((player.jetFuel || 0) >= fuelCost) {
        player.jetFuel = Math.max(0, player.jetFuel - fuelCost);
        triggerStrikerAirDash(player, requestedAirDashDir);
      }
    }

    rb.prevAirborne = true;
    return;
  }

  // =========================================================================
  // TRYB NAZIEMNY: GROUND ROCKET DASH (DOPALACZ W BUTACH NA ZIEMI)
  // "podwojne naciśnięcie strzalki kierunku lub podwójne wychylenie drążka odpala buty
  // (maksymalne wychylenie drążka, minimum minimalne cofnięcie i ponowne maksymalne wychylenie drążka)"
  // =========================================================================
  rb.airStickEngaged = false;
  rb.prevAirborne = false;

  let triggeredGroundDashDir = 0;

  // A. KLAWIATURA – PODWÓJNE NACIŚNIĘCIE STRZAŁKI / KLAWISZA KIERUNKU
  if (justPressedLeft) {
    const dt = now - rb.lastTapLeftTime;
    if (dt >= 60 && dt <= 320) {
      triggeredGroundDashDir = -1;
      rb.lastTapLeftTime = 0;
    } else {
      rb.lastTapLeftTime = now;
    }
  }

  if (justPressedRight) {
    const dt = now - rb.lastTapRightTime;
    if (dt >= 60 && dt <= 320) {
      triggeredGroundDashDir = 1;
      rb.lastTapRightTime = 0;
    } else {
      rb.lastTapRightTime = now;
    }
  }

  // B. DRĄŻEK ANALOGOWY – PODWÓJNE WYCHYLENIE (FLICK -> COFNIĘCIE -> PONOWNY FLICK)
  const isMaxFlick = Math.abs(stickX) >= 0.72;
  const isMinimalCofniecie = Math.abs(stickX) <= 0.42;

  switch (rb.stickPhaseX) {
    case 'IDLE':
      if (isMaxFlick) {
        rb.stickPhaseX = 'PEAK_1';
        rb.stickFlickDir = Math.sign(stickX);
        rb.stickFlickTime = now;
      }
      break;

    case 'PEAK_1':
      if (now - rb.stickFlickTime > 360) {
        // Zbyt długi czas bez cofnięcia – wygaśnięcie
        rb.stickPhaseX = isMaxFlick ? 'PEAK_1' : 'IDLE';
        if (isMaxFlick) {
          rb.stickFlickDir = Math.sign(stickX);
          rb.stickFlickTime = now;
        }
      } else if (isMinimalCofniecie || Math.sign(stickX) !== rb.stickFlickDir) {
        // Nastąpiło minimalne cofnięcie drążka w stronę środka!
        rb.stickPhaseX = 'CENTERED';
      }
      break;

    case 'CENTERED':
      if (now - rb.stickFlickTime > 420) {
        rb.stickPhaseX = 'IDLE';
      } else if (isMaxFlick && Math.sign(stickX) === rb.stickFlickDir) {
        // Ponowne maksymalne wychylenie drążka w tym samym kierunku – ODPAL BUTY!
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
 * Odpala Super Dash w powietrzu (Air Dash)
 */
function triggerStrikerAirDash(player, dir) {
  const rb = player.rocketBoots;
  rb.dashing = true;
  rb.dashType = 'AIR';
  rb.dashDir = dir;
  rb.dashTimer = 14;      // 14 klatek potężnego rakietowego pędu
  rb.dashSpeed = 17.5;    // Bardzo wysoka prędkość pozioma
  player.facing = dir;
  player.vx = dir * 17.5;
  player.vy = -1.8;       // Lekkie uniesienie, anuluje spadanie grawitacyjne
  player.airVx = player.vx;
  triggerScreenShake(3.0);

  // Wybuch płomieni z dysz obu butów
  emitBootsBurstParticles(player, dir, 12);
}

/**
 * Odpala dopalacz w butach na ziemi (Ground Rocket Dash)
 */
function triggerStrikerGroundDash(player, dir) {
  const rb = player.rocketBoots;
  rb.dashing = true;
  rb.dashType = 'GROUND';
  rb.dashDir = dir;
  rb.dashTimer = 16;
  rb.dashSpeed = 13.5;
  player.facing = dir;
  player.vx = dir * 13.5;
  triggerScreenShake(2.0);

  // Wybuch płomieni z pięt na poziomie murawy
  emitBootsBurstParticles(player, dir, 8);
}

/**
 * Emituje cząsteczki płomieni i iskier z podeszew butów
 */
function emitBootsBurstParticles(player, dir, count = 8) {
  if (typeof spawnJetpackSparks !== 'function') return;

  const customFlame = getStrikerFlameColor(player);
  const colors = getJetpackFlamePalette(customFlame).particles;

  const footX1 = player.x + (player.w || 24) / 2 - dir * 10;
  const footX2 = player.x + (player.w || 24) / 2 - dir * 4;
  const footY = player.y + (player.h || 70) - 4;

  // Wystrzał iskier w kierunku przeciwnym do wektora pędu
  spawnJetpackSparks(footX1, footY, -dir, count, colors, -dir * 6, (Math.random() - 0.5) * 2, dir > 0 ? Math.PI : 0);
  spawnJetpackSparks(footX2, footY, -dir, count, colors, -dir * 6, (Math.random() - 0.5) * 2, dir > 0 ? Math.PI : 0);
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
    const footX = player.x + (player.w || 24) / 2 - rb.dashDir * 6;
    const footY = player.y + (player.h || 70) - 3;
    spawnJetpackSparks(footX, footY, -rb.dashDir, 3, colors, -rb.dashDir * 4, (Math.random() - 0.5) * 1.5, rb.dashDir > 0 ? Math.PI : 0);
  }

  if (rb.dashType === 'AIR') {
    // W powietrzu: utrzymujemy prędkość i mikro-grawitację
    player.vx = rb.dashDir * rb.dashSpeed;
    player.airVx = player.vx;
    player.vy = Math.min(player.vy, -0.4);
    rb.dashSpeed *= 0.985;
  } else {
    // Na ziemi: gwałtowny zryw ze stopniowym wyhamowywaniem do sprintu
    player.vx = rb.dashDir * rb.dashSpeed;
    rb.dashSpeed *= 0.94;
  }

  if (rb.dashTimer <= 0) {
    rb.dashing = false;
  }
}


