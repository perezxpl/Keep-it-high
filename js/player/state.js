// =========================================================================
// PLAYER/STATE.JS - DEFINICJE STANU, SCHEMATÓW I FABRYKA INSTANCJI GRACZA
// Wydzielony moduł z js/player/index.js
// =========================================================================

import { CONFIG, START_X } from '../config.js';
import { activeArenaId, customObstacles } from '../obstacles.js';
import { spawnGroundPuff, triggerScreenShake } from '../world.js';
import { DEFAULT_CLASS, CLASSES } from '../classes/index.js';
import { WEAPONS } from '../weapons.js';
import { DEFAULT_VISUALS } from './renderer.js';

/**
 * Sprawdza, czy nad głową gracza znajduje się przeszkoda lub sufit uniemożliwiający wyprostowanie się (powrót do STAND)
 * @param {Object} player - Obiekt gracza
 * @param {number} [groundY] - Poziom podłoża
 * @returns {boolean}
 */
export function isCeilingBlockingStand(player, groundY = 500) {
  if (!player) return false;
  const currentFloor = player.currentGroundY || groundY || 500;
  const standTopY = currentFloor - (player.h || 70);
  const crouchTopY = currentFloor - 45;
  const px = player.x + (player.w || 24) / 2;
  const halfW = (player.w || 24) / 2;

  // Sprawdzenie stropu dolnego tunelu w Arenie 3 (The Foundry)
  if (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY') {
    const isUnderHatch = (px >= 750 && px <= 950) || (px >= 3450 && px <= 3650);
    if (!isUnderHatch && currentFloor > 970) {
      if (standTopY < 970 && crouchTopY >= 970 - 14) {
        return true;
      }
    }
  }

  if (Array.isArray(customObstacles)) {
    for (const obs of customObstacles) {
      if (!obs || obs.exploded) continue;
      if (obs.solid || obs.isPlatform) {
        const obsTop = obs.y !== undefined ? obs.y : (groundY - obs.relY);
        const obsBottom = obsTop + (obs.h || 20);
        const obsLeft = obs.x;
        const obsRight = obs.x + (obs.w || 40);

        if (px + halfW > obsLeft && px - halfW < obsRight) {
          if (obsBottom > standTopY && obsBottom <= crouchTopY + 5) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

export const DEFAULT_BODY = {
  w: 24,
  h: 70,
  thighLen: 25,
  shinLen: 24,
  upperArmLen: 14,
  forearmLen: 13
};

export const DEFAULT_STATS = {
  hp: 100,
  maxHp: 100,
  walkMax: 2.2,
  jogMax: 4.2,
  sprintMax: 6.8,
  accel: 0.24,
  decel: 0.84,
  slideDecel: 0.978,
  jumpForce: 9.8,
  slideDashSpeed: 13.5,
  chargeSpeed: 0.035,
  hitReach: 56,
  whiffReach: 88,
  baseKickSpeed: 30.0,
  kickPowerMult: 1.0,
  spinMult: 1.0,
  jetMax: 100,
  spartanKnockback: 11.0,
  spartanStagger: 25,
  spartanDamage: 10,
  kickForce: 1.0,
  kickForceMultiplier: 1.0,
  knockback: 1.0,
  knockbackMultiplier: 1.0,
  kickCooldown: 0.50
};

export const DEFAULT_CLASS_SCHEMA = {
  body: DEFAULT_BODY,
  stats: DEFAULT_STATS,
  visuals: DEFAULT_VISUALS
};

export function mergeClassWithSchema(classDef) {
  const c = classDef || {};
  return {
    ...c,
    body: { ...DEFAULT_CLASS_SCHEMA.body, ...(c.body || {}) },
    stats: { ...DEFAULT_CLASS_SCHEMA.stats, ...(c.stats || {}) },
    visuals: { ...DEFAULT_CLASS_SCHEMA.visuals, ...(c.visuals || {}) }
  };
}

export function createPlayerInstance(overrides = {}) {
  const baseClass = overrides.currentClass || DEFAULT_CLASS || {};
  const mergedClass = mergeClassWithSchema(baseClass);

  return {
    x: START_X - 60,
    y: 0,
    vx: 0,
    vy: 0,
    w: mergedClass.body.w,
    h: mergedClass.body.h,
    facing: 1,

    aimX: START_X + 160,
    aimY: 0,
    aimOffsetX: 160,
    aimOffsetY: -20,
    isAiming: false,
    jetFuel: mergedClass.stats.jetMax,
    jetMax: mergedClass.stats.jetMax,

    hp: mergedClass.stats.hp || 100,
    maxHp: mergedClass.stats.maxHp || mergedClass.stats.hp || 100,
    hasVest: false,
    vestHp: 0,
    vestMaxHp: 60,
    hasHelmet: false,
    helmetHits: 1,
    headshotImmunityTimer: 0,
    currentWeapon: WEAPONS.AK47,
    isHolstered: (activeArenaId === 'ARENA_1'),
    holsterWeight: (activeArenaId === 'ARENA_1' ? 1.0 : 0.0),
    shootCooldown: 0,
    grenadeCooldown: 0,
    grenadeMaxCooldown: 3.5, // 3.5 sekundy czasu odnowienia
    isDead: false,
    respawnTimer: 0,
    isAcidDying: false,
    acidDeath: {
      active: false,
      timer: 0,
      maxDuration: 1.2, // 1.2 sekundy trwania efektu rozpuszczania
      splashTriggered: false
    },
    muzzleFlashTimer: 0,
    shootPoseTimer: 0,
    shootPoseWeight: 0,
    isShooting: false,
    weaponKickback: 0,
    muzzleRise: 0,
    pumpTimer: 0,
    pumpOffset: 0,

    // System amunicji i przeładowania broni gracza
    isReloading: false,
    reloadTimer: 0,
    reloadDuration: 0,
    emptyAmmoAlert: 0,
    ammo: {
      AK47: {
        magSize: 30,
        currentAmmo: 30,
        reserveAmmo: 90,
        reloadDuration: 120,
        reloadTime: 2.0,
        isReloading: false,
        reloadTimer: 0
      },
      SHOTGUN: {
        magSize: 8,
        currentAmmo: 8,
        reserveAmmo: 64,
        reloadDuration: 150,
        reloadTime: 2.5,
        isReloading: false,
        reloadTimer: 0
      },
      SNIPER: {
        magSize: 5,
        currentAmmo: 5,
        reserveAmmo: 25,
        reloadDuration: 168,
        reloadTime: 2.8,
        isReloading: false,
        reloadTimer: 0
      }
    },
    get currentAmmo() {
      const wepId = this.currentWeapon?.id || 'AK47';
      return this.ammo?.[wepId]?.currentAmmo ?? 0;
    },
    get reserveAmmo() {
      const wepId = this.currentWeapon?.id || 'AK47';
      return this.ammo?.[wepId]?.reserveAmmo ?? 0;
    },
    get magSize() {
      const wepId = this.currentWeapon?.id || 'AK47';
      return this.ammo?.[wepId]?.magSize ?? 30;
    },

    // Pola zgonu i rozczłonkowania
    hasHead: true,
    decapitated: false,
    neckFountainTimer: 0,
    isGibbed: false,
    corpseAngle: 0,
    corpseRotVel: 0,
    corpseFloorY: 0,
    deathSpiralTimer: 0,
    deathInitDone: false,
    deathTilt: 0,
    deathRotVel: 0,
    isSettled: false,
    pelvisY: -11.8,
    severedHead: null,

    dismembered: {
      armFront: false,
      armBack: false,
      legFront: false,
      legBack: false
    },

    ragdoll: null,
    deathHitPoint: null,
    deathImpulse: null,

    currentClass: mergedClass,

    yaw: 0,
    turnMode: 'FRONT',

    isIntro: false,
    juggleTimer: 0,
    intendedVx: 0,
    groundY: 0,
    currentGroundY: 0,

    airVx: 0,

    isJumpCharging: false,
    jumpChargePower: 0,
    jumpPower: 0,

    kickCooldown: 0,
    kickMode: 'GROUND',
    kickPower: 0,
    scissorTimer: 0,
    scissorDuration: 22,

    bicycleTimer: 0,
    bicycleDuration: 30,
    landingTurnTimer: 0,

    kickingFootX: 0,
    kickingFootY: 0,
    kickPlantWorldX: 0,
    kickRecoverSpeed: 0.14,

    frontLegOverBall: false,
    lastFootFrontX: 0,
    lastFootFrontY: 0,
    lastFootFrontAnkle: 0,
    lastHipShiftX: 0,

    thighLen: mergedClass.body.thighLen,
    shinLen: mergedClass.body.shinLen,
    upperArmLen: mergedClass.body.upperArmLen,
    forearmLen: mergedClass.body.forearmLen,

    stridePhase: 0,
    torsoTilt: 0,
    torsoTiltVel: 0,
    gaitMode: 'PODBICIE Z ZIEMI',

    kneeJuggleWeight: 0,

    headBob: 0,
    headBobVel: 0,

    isCrouching: false,
    crouchToggled: false,
    isProne: false,
    state: 'STAND',
    hitboxHeight: 70,
    crouchHoldTimer: 0,
    _crouchStartTime: 0,
    ctrlTimer: 0,
    wasCtrlPressed: false,
    crawlPhase: 0,
    staggerTimer: 0,
    staggerLanded: false,
    staggerRecoveryTimer: 0,
    isJumping: false,
    jumpSquatTimer: 0,
    jumpSquatMax: 3,
    jumpTakeoffTimer: 0,
    jumpTakeoffMax: 5,
    jumpLaunchFloorY: 0,
    jumpLaunchSpeed: 0,
    landingSquatTimer: 0,
    landingSquatMax: 5,
    landingSquatIntensity: 0,
    jetpackKeyNeutralized: true,
    isSliding: false,
    slideTimer: 0,
    slideCooldown: 0,
    sprintDuration: 0,
    coyoteTimer: 0,
    coyoteMax: 8,
    isSprintJump: false,
    sprintJumpTimer: 0,
    wasSprintingBeforeAir: false,
    lastGroundVx: 0,
    lastGroundedFloorY: 0,
    dropThroughTimer: 0,
    dropThroughPlatform: null,
    isMovingBackwards: false,
    spinVolleyTimer: 0,
    spinVolleyDuration: 24,
    spartanTimer: 0,
    spartanDuration: 22,
    spartanTarget: null,
    _ball: null,
    _targets: null,

    kickLeg: 'front',
    nextLeg: 'front',
    kickState: 'IDLE',
    kickAngle: 0,
    swingSpeed: 0,
    hitThisSwing: false,
    chargePower: 0,
    isCharging: false,
    isStickCharging: false,
    kickBufferTimer: 0,

    headPitch: 0,
    lastBallX: undefined,
    lastBallY: undefined,

    _spawnGrass: null,

    pose: {
      initialized: false,
      footFrontX: 0,
      footFrontY: 0,
      footFrontAnkle: 0,
      footBackX: 0,
      footBackY: 0,
      footBackAnkle: 0,
      effAnkleFront: 0,
      effAnkleBack: 0,
      flexFront: 0,
      flexBack: 0,
      armFrontSwing: 0,
      armFrontElbow: 0.35,
      armBackSwing: 0,
      armBackElbow: 0.28,
      torsoTilt: 0,
      shoulderTilt: 0,
      headPitch: 0
    },
    throwAnim: {
      active: false,
      phase: 'IDLE',
      timer: 0,
      windupDuration: 6,
      throwDuration: 5,
      recoveryDuration: 8,
      targetX: 0,
      targetY: 0,
      power: 1.0,
      aimAngle: 0,
      aiming: false,
      spawned: false
    },
    classConfig: mergedClass,
    class: mergedClass,
    kickForceMultiplier: mergedClass.stats.kickForce || 1.0,
    knockbackMultiplier: mergedClass.stats.knockback || 1.0,
    kickCooldownTime: mergedClass.stats.kickCooldown || 0.50,
    ...overrides
  };
}

export const player = createPlayerInstance({ isIntro: true });

export function setPlayerClass(newClass, p = player) {
  if (!newClass || !p) return;

  const resolvedClass = typeof newClass === 'string'
    ? (CLASSES[newClass.toUpperCase()] || CLASSES[newClass] || DEFAULT_CLASS)
    : newClass;

  p.currentClass?.onDestroy?.(p);

  const merged = mergeClassWithSchema(resolvedClass);
  p.currentClass = merged;
  p.classConfig = merged;
  p.class = merged;
  p.selectedClass = merged.id;
  p.kickForceMultiplier = merged.stats.kickForce || 1.0;
  p.knockbackMultiplier = merged.stats.knockback || 1.0;
  p.kickCooldownTime = merged.stats.kickCooldown || 0.50;

  p.w = p.currentClass.body.w;
  p.h = p.currentClass.body.h;
  p.thighLen = p.currentClass.body.thighLen;
  p.shinLen = p.currentClass.body.shinLen;
  p.upperArmLen = p.currentClass.body.upperArmLen;
  p.forearmLen = p.currentClass.body.forearmLen;

  p.jetFuel = p.currentClass.stats.jetMax;
  p.jetMax = p.currentClass.stats.jetMax;

  const oldMax = p.maxHp || 100;
  const newMax = merged.stats.maxHp || merged.stats.hp || 100;
  const hpRatio = (typeof p.hp === 'number' && oldMax > 0) ? Math.min(1.0, p.hp / oldMax) : 1.0;
  p.maxHp = newMax;
  p.hp = Math.round(newMax * hpRatio);

  if (typeof window !== 'undefined' && window.uiManager && typeof window.uiManager.applyAppearanceForClass === 'function') {
    window.uiManager.applyAppearanceForClass(resolvedClass.id, p);
  }

  resolvedClass.onInit?.(p);
}

/**
 * Inicjalizuje natychmiastowe wybicie z nóg gracza z pełną responsywnością i procedurą Piston Takeoff
 * @param {Object} p - Obiekt gracza
 * @param {Function} [spawnGrass] - Callback efektów cząsteczkowych podłoża
 * @returns {boolean} Czy skok został pomyślnie zainicjowany
 */
export function initiatePlayerJump(p = player, spawnGrass = null) {
  if (!p || p.isDead || p.isIntro || p.isSliding || (p.staggerTimer > 0) || p.isAcidDying) return false;
  if (p.isJumping) return false;

  const currentFloor = p.currentGroundY || p.groundY || p.lastGroundedFloorY || (p.y + (p.h || 70));
  const hasCoyote = ((p.coyoteTimer || 0) > 0 && !p.isJumping && Math.abs(p.vy || 0) < 4.5);
  const isGrounded = (p.onGround !== undefined)
    ? (p.onGround || hasCoyote)
    : (p.y >= currentFloor - (p.h || 70) - 4 || hasCoyote);

  if (!isGrounded && Math.abs(p.vy) > 0.8) return false;

  // Przerwanie pozycji kucania i leżenia
  p.isProne = false;
  p.isCrouching = false;
  p.crouchToggled = false;
  p.state = 'STAND';
  p.hitboxHeight = p.h || 70;

  // Sprawdzenie, czy postać wyskakuje w super-biegu (sprint lub dopalacz Rocket Boots)
  const sprintMax = p.currentClass?.stats?.sprintMax || CONFIG.SPRINT_MAX || 6.8;
  const isGroundDashing = !!(p.rocketBoots && p.rocketBoots.dashing && p.rocketBoots.dashType === 'GROUND');
  const isSuperRunning = isGroundDashing ||
    (p.gaitMode === 'SPRINT' && (p.sprintDuration || 0) >= 3) ||
    (p.wasSprintingBeforeAir && (p.coyoteTimer || 0) > 0) ||
    (Math.abs(p.vx) >= sprintMax * 0.72) ||
    (Math.abs(p.lastGroundVx || 0) >= sprintMax * 0.72 && (p.coyoteTimer || 0) > 0);

  let jumpForce = p.currentClass?.stats?.jumpForce || CONFIG.JUMP_FORCE;

  if (isSuperRunning) {
    p.isSprintJump = true;
    p.sprintJumpTimer = 65;
    const baseVx = Math.abs(p.vx) > 0.2
      ? p.vx
      : ((p.lastGroundVx && Math.abs(p.lastGroundVx) > 0.2) ? p.lastGroundVx : (p.facing * sprintMax));
    // Dynamiczne zachowanie pędu biegu i podbicie poziomego zasięgu skoku w dal (Long Jump)
    const forwardBoost = isGroundDashing ? 1.05 : 1.12;
    p.airVx = baseVx * forwardBoost;
    p.vx = p.airVx;
    p.jumpLaunchSpeed = Math.abs(p.airVx);
    // Płaski, aerodynamiczny łuk dalekiego skoku
    jumpForce *= 1.05;
  } else {
    p.isSprintJump = false;
    p.sprintJumpTimer = 0;
    p.airVx = p.vx;
    p.jumpLaunchSpeed = Math.abs(p.vx);
  }

  p.coyoteTimer = 0;
  p.vy = -jumpForce;
  p.isJumping = true;
  p.onGround = false;
  p.jetpackKeyNeutralized = false; // Po wyskoku z ziemi wymagamy puszczenia klawisza W
  p.jumpSquatTimer = 0;

  // Rejestracja parametrów dla procedury pchnięcia tłokowego stóp (Piston Takeoff)
  p.jumpLaunchFloorY = currentFloor;
  p.jumpTakeoffTimer = p.jumpTakeoffMax || 8;

  const grassFn = spawnGrass || p._spawnGrass;
  if (typeof grassFn === 'function' && currentFloor) {
    grassFn(p.x + (p.w || 24) / 2, currentFloor, p.facing);
    if (isSuperRunning) {
      grassFn(p.x + (p.w || 24) / 2 - p.facing * 14, currentFloor, p.facing);
    }
  }
  spawnGroundPuff(p.x + (p.w || 24) / 2, currentFloor);
  if (isSuperRunning) {
    triggerScreenShake(1.3);
  }
  p.currentClass?.onJump?.(p, grassFn);

  return true;
}

if (typeof window !== 'undefined') {
  window.setPlayerClass = setPlayerClass;
  window.CLASSES = CLASSES;
  window.initiatePlayerJump = initiatePlayerJump;
}
