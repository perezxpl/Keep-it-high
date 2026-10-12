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
  // OBSŁUGA PRZEJŚĆ ZIEMIA <-> POWIETRZE
  // =========================================================================
  if (isAirborne && !rb.prevAirborne) {
    // Właśnie nastąpił wyskok / oderwanie od ziemi!
    if (rb.dashType === 'GROUND') {
      rb.dashing = false;
      rb.dashType = 'NONE';
      rb.dashInputSource = 'NONE';
    }
    // "w przypadku wyskoku trzeba puscic drążek lub go cofnąć"
    // Jeśli drążek był już wychylony podczas wybicia, gracz musi go najpierw puścić/cofnąć do środka
    rb.airStickReady = (stickMag < 0.35);
  } else if (!isAirborne && rb.prevAirborne) {
    // Właśnie nastąpiło lądowanie na ziemi
    rb.airStickReady = false;
    if (rb.dashType === 'AIR') {
      rb.dashing = false;
      rb.dashType = 'NONE';
    }
  }
  rb.prevAirborne = isAirborne;

  // =========================================================================
  // TRYB 1: POWIETRZE (AIR SUPER DASH)
  // "A w górę wystarczy ze bedzie w powietrzu juz bez tych 300ms ale w przypadku wyskoku
  // trzeba puscic drążek lub go cofnąć lub powtórzyc przycisk na klawiaturze"
  // =========================================================================
  if (isAirborne) {
    let reqAirX = 0;
    let reqAirY = 0;

    // A. DRĄŻEK W POWIETRZU:
    // Wystarczy 1 zdecydowane wychylenie po uprzednim puszczeniu/cofnięciu do środka (< 0.35)
    if (stickMag < 0.35) {
      rb.airStickReady = true;
    } else if (rb.airStickReady && stickMag >= 0.60 && !isStickAimingDown) {
      rb.airStickReady = false;
      reqAirX = stickX / stickMag;
      reqAirY = stickY / stickMag;
    }

    // B. KLAWIATURA W POWIETRZU:
    // Wystarczy powtórzyć/nacisnąć przycisk w powietrzu (justPressed)!
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

    // Jeśli gracz wyzwolił Super Dash w powietrzu:
    if (reqAirX !== 0 || reqAirY !== 0) {
      const fuelCost = (player.jetMax || 100) * 0.50; // Dokładnie 50% paliwa
      if ((player.jetFuel || 0) >= fuelCost) {
        player.jetFuel = Math.max(0, player.jetFuel - fuelCost);
        triggerStrikerAirDash(player, reqAirX, reqAirY);
      }
    }

    return;
  }

  // =========================================================================
  // TRYB 2: ZIEMIA (GROUND ROCKET DASH)
  // "Gdy striker stoi, trzeba nacisnac przycisk kierunku lub drążek wychylic szybko 2x do 300ms
  // aby daszował po ziemi i bedzie to robil tak dlugo dopoki nie puszcze przycisku lub drążka nie puszcze lub cofnę"
  // =========================================================================

  // A. JEŚLI GROUND DASH JUŻ TRWA: SPRAWDZAMY CZY GRACZ NADAL TRZYMA KIERUNEK
  if (rb.dashing && rb.dashType === 'GROUND') {
    let continueGroundDash = false;

    // Sprawdzenie czy nie uderzyliśmy w lewą lub prawą krawędź areny
    const arenaRightLimit = (player.arenaWidth || 4350) - (player.w || 24) - 10;
    if ((rb.dashDir < 0 && player.x <= 15) || (rb.dashDir > 0 && player.x >= arenaRightLimit)) {
      continueGroundDash = false;
    } else if (rb.dashInputSource === 'KEYBOARD') {
      if (rb.dashDir === -1 && keyLeft && !keyDown) continueGroundDash = true;
      if (rb.dashDir === 1 && keyRight && !keyDown) continueGroundDash = true;
    } else if (rb.dashInputSource === 'STICK') {
      // Drążek nadal wychylony w tym samym kierunku poziomym i nie cofnięty poniżej 0.45
      if (!isStickAimingDown && Math.abs(stickX) >= 0.45 && Math.sign(stickX) === rb.dashDir) {
        continueGroundDash = true;
      }
    }

    if (!continueGroundDash) {
      // Gracz puścił przycisk lub puścił / cofnął drążek!
      rb.dashing = false;
      rb.dashType = 'NONE';
      rb.dashInputSource = 'NONE';
    } else {
      // Utrzymujemy rakietowy pęd po murawie dopóki trzyma
      rb.dashSpeed = 17.5;
      player.facing = rb.dashDir;
      player.vx = rb.dashDir * 17.5;
      return;
    }
  }

  // B. JEŚLI GROUND DASH NIE TRWA: DETEKCJA STARTU (PODWÓJNE WYCHYLENIE / TAP W 300 MS)
  let triggerGroundDir = 0;
  let triggerSource = 'NONE';

  // 1. KLAWIATURA NA ZIEMI: 2x szybki tap klawisza lewo/prawo w oknie do 300 ms
  if (!keyDown) {
    if (justPressedLeft) {
      const dt = now - (rb.lastTapLeftTime || 0);
      if (dt >= 40 && dt <= FLICK_WINDOW_MS) {
        triggerGroundDir = -1;
        triggerSource = 'KEYBOARD';
        rb.lastTapLeftTime = 0;
      } else {
        rb.lastTapLeftTime = now;
      }
    } else if (justPressedRight) {
      const dt = now - (rb.lastTapRightTime || 0);
      if (dt >= 40 && dt <= FLICK_WINDOW_MS) {
        triggerGroundDir = 1;
        triggerSource = 'KEYBOARD';
        rb.lastTapRightTime = 0;
      } else {
        rb.lastTapRightTime = now;
      }
    }
  }

  // 2. DRĄŻEK NA ZIEMI: 2x szybki wyrzut drążka lewo/prawo w oknie do 300 ms
  if (triggerGroundDir === 0) {
    const isHorizFlick = Math.abs(stickX) >= 0.65 && !isStickAimingDown;

    if (stickMag < 0.35) {
      rb.groundStickWasCentered = true;
    } else if (isHorizFlick) {
      if (rb.groundStickWasCentered) {
        rb.groundStickWasCentered = false;
        const flickDir = Math.sign(stickX);
        const dt = now - (rb.lastGroundStickFlickTime || 0);

        if (dt >= 40 && dt <= FLICK_WINDOW_MS && flickDir === rb.lastGroundStickFlickDir) {
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

  if (triggerGroundDir !== 0) {
    triggerStrikerGroundDash(player, triggerGroundDir, triggerSource);
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
  rb.dashTimer = 18;
  rb.dashSpeed = 23.5;

  if (Math.abs(dirX) > 0.1) {
    player.facing = Math.sign(dirX);
  }

  player.vx = dirX * 23.5;
  player.vy = dirY * 23.5;
  player.airVx = player.vx;
  triggerScreenShake(3.5);

  // Wybuch płomieni w kierunku przeciwnym do wektora lotu
  emitBootsBurstParticles(player, -dirX, -dirY, 14);
}

/**
 * Odpala dopalacz w butach na ziemi (Ground Rocket Dash)
 */
function triggerStrikerGroundDash(player, dir, source = 'STICK') {
  const rb = player.rocketBoots;
  rb.dashing = true;
  rb.dashType = 'GROUND';
  rb.dashInputSource = source;
  rb.dashDir = dir;
  rb.dashDirX = dir;
  rb.dashDirY = 0;
  rb.dashSpeed = 17.5;
  player.facing = dir;
  player.vx = dir * 17.5;
  triggerScreenShake(2.5);

  // Wybuch płomieni z pięt na poziomie murawy
  emitBootsBurstParticles(player, -dir, 0, 12);
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


