// =========================================================================
// KLASA LEKKA: RAPTOR – Zwiadowca / Lotnik
// Specjalność: Plecak odrzutowy (Jetpack), powietrzna manewrowość (airVx),
//              wysoka prędkość i zwinność, najwyższy jetMax.
//              Dopalacz awaryjny (Afterburner Surge) z podwójnego W / podwójnego flicku drążka.
//              Zawis taktyczny (Tactical Air Hover) na klawiaturze przy jednoczesnym W+S.
// =========================================================================
import { triggerScreenShake, spawnJetpackSparks } from '../world.js';
import {
  spawnShockwaveRing,
  spawnHeavySmokePuff
} from '../particles.js';
import { getJetpackFlamePalette } from '../player/jetpack.js';
import { getJetpackNozzlePos } from '../player/limbs.js';
import { addDynamicLight } from '../lighting/index.js';

export const RaptorClass = {
  id: 'RAPTOR',
  name: 'Raptor',
  tier: 'LIGHT',
  role: 'Zwiadowca / Lotnik',

  // 1. ANATOMIA SZKIELETU IK – Lekka, zwinna sylwetka zwiadowcy (Lightweight Scout)
  body: {
    w: 24,
    h: 70,
    thighLen: 25,
    shinLen: 24,
    upperArmLen: 14,
    forearmLen: 13
  },

  // 2. Statystyki fizyczne i ruchowe (Klasa Lekka: wysoka zwinność, niższe HP)
  stats: {
    hp: 85,                 // Lekki pancerz zwiadowczy: 85 HP
    maxHp: 85,
    walkMax: 2.4,
    jogMax: 4.6,
    sprintMax: 7.4,
    accel: 0.28,
    decel: 0.84,
    slideDecel: 0.968,
    jumpForce: 11.4,
    slideDashSpeed: 11.5,
    chargeSpeed: 0.038,
    hitReach: 58,
    whiffReach: 92,
    baseKickSpeed: 20.6,
    kickPowerMult: 1.12,
    spinMult: 1.2,
    jetMax: 150,
    spartanKnockback: 9.5,
    spartanStagger: 14,
    spartanDamage: 8,
    kickForce: 0.85,
    kickForceMultiplier: 0.85,
    knockback: 0.70,
    knockbackMultiplier: 0.70,
    kickCooldown: 0.35
  },

  // 2. Kolorystyka i dane wizualne renderera – Oliwka / Ranger Green PMC
  visuals: {
    jerseyFront0: '#283618',
    jerseyFront1: '#3a5a40',
    jerseyFront2: '#588157',
    jerseyFront3: '#344e41',
    jerseyBack0: '#1b2a1a',
    jerseyBack1: '#283618',
    jerseyBack2: '#131e13',
    jerseyStripe: '#588157',
    armColorFront: '#3a5a40',
    armColorBack: '#283618',
    skinLight: '#fed7aa',
    skinMid: '#f5b078',
    skinDark: '#b45309',
    skinBack: '#de935e',
    shortsColor0: '#283618',
    shortsColor1: '#344e41',
    shortsColor2: '#1b2a1a',
    legThighFront: '#3a5a40',
    legShinFront: '#344e41',
    legThighBack: '#283618',
    legShinBack: '#1b2a1a',
    bootColor: '#18181b',
    bootBack: '#09090b',
    bootAccent: '#588157',
    crestColor: '#a3b18a',
    seamColor: '#1b2a1a',
    crosshairColor: '#ef4444',
    number: '07'
  },

  // 3. Cykl życia (Lifecycle Hooks)
  onInit(player) {
    player.jetFuel = this.stats.jetMax;
    player.jetMax = this.stats.jetMax;
    initRaptorFlightState(player);
  },
  onDestroy(player) {},

  // Akrobata: zwiększona manewrowość w powietrzu (airVx śledzi intendedVx) oraz cooldown dopalacza
  onUpdate(player, ball, keys) {
    if (player.raptorFlight?.afterburnerCooldown > 0) {
      player.raptorFlight.afterburnerCooldown--;
    }
    if (player.isJumping && typeof player.airVx === 'number') {
      if (player.intendedVx !== undefined && Math.abs(player.intendedVx) > 0.05) {
        if (Math.sign(player.airVx) === Math.sign(player.intendedVx) && Math.abs(player.airVx) >= Math.abs(player.intendedVx)) {
          // Nie wyhamowuj wyższego pędu z wyskoku ze sprintu / super-biegu
        } else {
          player.airVx += (player.intendedVx - player.airVx) * 0.08;
        }
      }
    }
  },

  onPrePhysics(player, keys) {},
  onPostPhysics(player) {},
  onJump(player, spawnGrass) {},
  onSlide(player, spawnGrass) {},

  // Kopnięcie Akrobaty: wzmocnienie wektora piłki w powietrzu / spin volley
  onKick(player, ball, context) {
    if (player.isJumping || context?.isSpinVolley) {
      ball.vx *= 1.22;
      ball.vy *= 1.22;
      ball.lowGravityFrames = Math.max(ball.lowGravityFrames || 0, 16);
    }
  },

  onBallPassiveContact(player, ball) {},
  onDrawUnder(ctx, player) {},
  onDrawOverlay(ctx, player) {}
};

export const AeroClass = RaptorClass;

// =========================================================================
// ZARZĄDZANIE STANEM LOTU I DOPALACZA DLA KLASY RAPTOR
// =========================================================================

export function initRaptorFlightState(player) {
  if (!player) return;
  if (!player.raptorFlight) {
    player.raptorFlight = {
      afterburnerCooldown: 0,
      lastTapUpTime: 0,
      prevKeyUp: false,
      lastFlickUpTime: 0,
      stickWasCentered: true
    };
  }
}

/**
 * Odpala Dopalacz Awaryjny (Afterburner Surge) dla Raptora:
 * Błyskawiczny, naddźwiękowy pionowy wyrzut ciągu odrzutowego z dysz jetpacka.
 * Zapewnia natychmiastowe wyrwanie z zasięgu ognia lub błyskawiczną zmianę pułapu.
 */
export function triggerRaptorAfterburner(player, steerX = 0) {
  if (!player || player.isDead || (player.jetFuel < 25)) return;
  if (!player.raptorFlight) initRaptorFlightState(player);
  if (player.raptorFlight.afterburnerCooldown > 0) return;

  player.jetFuel = Math.max(0, player.jetFuel - 25);
  player.raptorFlight.afterburnerCooldown = 22; // ~0.36s cooldown przy 60 FPS
  player.vy = -16.8;
  player.isJumping = true;
  player.onGround = false;

  if (Math.abs(steerX) > 0.12) {
    const boostVx = Math.sign(steerX) * 7.5;
    player.vx = boostVx;
    player.airVx = boostVx;
    player.facing = Math.sign(steerX);
  }

  triggerScreenShake(4.5);

  const nozzle = getJetpackNozzlePos(player);
  const flameCol = player.customVisuals?.jetpackColor || '#38bdf8';
  const palette = getJetpackFlamePalette(flameCol);

  if (typeof spawnShockwaveRing === 'function') {
    spawnShockwaveRing(nozzle.x, nozzle.y, flameCol);
  }
  if (typeof spawnHeavySmokePuff === 'function') {
    spawnHeavySmokePuff(nozzle.x, nozzle.y, 8);
  }
  if (typeof spawnJetpackSparks === 'function') {
    spawnJetpackSparks(nozzle.x, nozzle.y, player.facing, 12, palette.particles, player.vx, player.vy, nozzle.angle);
  }
  if (typeof addDynamicLight === 'function') {
    addDynamicLight({
      x: nozzle.x,
      y: nozzle.y,
      radius: 150,
      color: flameCol,
      intensity: 0.9,
      duration: 0.12,
      flicker: false
    });
  }
}

/**
 * Przetwarzanie wejścia gracza dla Dopalacza Awaryjnego Raptora w każdej klatce:
 * - Podwójne tapnięcie W / Strzałka w górę na klawiaturze (w oknie 300ms w powietrzu)
 * - Podwójny szybki flick analogowym lewym drążkiem / gałką w górę (w oknie 320ms w powietrzu)
 */
export function updateRaptorFlightInput(player, keys, leftStick, gamepadState) {
  if (!player || player.isDead || player.isIntro || (player.staggerTimer > 0) || ((player.staggerRecoveryTimer || 0) > 0)) return;
  if (!player.raptorFlight) initRaptorFlightState(player);
  const rf = player.raptorFlight;

  if (rf.afterburnerCooldown > 0) {
    rf.afterburnerCooldown--;
  }

  const isAirborne = (!player.onGround || player.isJumping || Math.abs(player.vy) > 0.5);
  if (!isAirborne) {
    rf.prevKeyUp = false;
    rf.stickWasCentered = true;
    return;
  }

  const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();

  // 1. KLAWIATURA: Podwójne szybkie naciśnięcie W lub Strzałki w górę
  const keyUp = !!(keys && (keys.up || keys.KeyW || keys.ArrowUp));
  const justPressedUp = keyUp && !rf.prevKeyUp;
  rf.prevKeyUp = keyUp;

  let steerX = 0;
  if (keys) {
    if (keys.left || keys.KeyA || keys.ArrowLeft) steerX -= 1;
    if (keys.right || keys.KeyD || keys.ArrowRight) steerX += 1;
  }

  if (justPressedUp && player.jetFuel >= 25 && rf.afterburnerCooldown <= 0) {
    if (now - rf.lastTapUpTime <= 300) {
      triggerRaptorAfterburner(player, steerX);
      rf.lastTapUpTime = 0;
      return;
    }
    rf.lastTapUpTime = now;
  }

  // 2. ANALOGOWY LEWY DRĄŻEK (Dotyk lub Gamepad): Podwójny szybki flick w górę
  let stickY = 0;
  let stickX = 0;
  let isStickActive = false;
  if (leftStick && leftStick.active) {
    stickY = leftStick.axisY;
    stickX = leftStick.axisX;
    isStickActive = true;
  } else if (gamepadState && gamepadState.connected && gamepadState.leftStick) {
    stickY = gamepadState.leftStick.y;
    stickX = gamepadState.leftStick.x;
    isStickActive = true;
  }

  if (isStickActive) {
    if (stickY > -0.25) {
      rf.stickWasCentered = true;
    } else if (stickY < -0.65 && rf.stickWasCentered) {
      rf.stickWasCentered = false;
      if (player.jetFuel >= 25 && rf.afterburnerCooldown <= 0) {
        if (now - rf.lastFlickUpTime <= 320) {
          triggerRaptorAfterburner(player, stickX);
          rf.lastFlickUpTime = 0;
          return;
        }
        rf.lastFlickUpTime = now;
      }
    }
  }
}
