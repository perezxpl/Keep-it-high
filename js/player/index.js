// =========================================================================
// PLAYER/INDEX.JS - GŁÓWNY MODUŁ POSTACI (STAN, FIZYKA, CYKL ŻYCIA)
// Łączy w całość logikę ruchową, akcje, renderowanie i stan encji gracza.
// =========================================================================

import { CONFIG, START_X, ARENA_LEFT, ARENA_RIGHT, isTouchDevice } from '../config.js';
import { activeArenaId, customObstacles } from '../obstacles.js';
import { triggerScreenShake, spawnGroundPuff, spawnBloodDrip, isGroundAt, getCaveCeilingY } from '../world.js';
import { DEFAULT_CLASS, CLASSES } from '../classes/index.js';
import { WEAPONS, updateWeaponState } from '../weapons.js';
import { getActiveArena } from '../arenas/index.js';

import { ease, parabola, lerp, lerpAngle, solve2BoneIK, getArmAnglesForTarget, getAimArmAngles } from './ik.js';
import { getFreestyleChoreography, getSprintFootTrajectory, getBiomechanicFootTrajectory, evaluateCrouchState } from './locomotion.js';

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
import {
  startJumpCharge, playerJump, executeReleaseJump, playerSlide,
  startKickCharge, evaluateKickTiming, isBallInKickReach, executeReleaseKick,
  getGroundKickTrajectory, getScissorLegTargets, getBackflipTargets,
  findMeleeTarget, triggerSpartanKick, getSpartanKickTargets, getProneIKTargets,
  applyKickInteractions, applySpartanKickHit,
  updatePlayerThrow, prepareGrenadeThrow, releaseGrenadeThrow, throwTacticalGrenade
} from './actions.js';
import { handlePlayerDeath, getRagdollRenderPose } from './death.js';
import { renderArm, renderIKLeg, drawFrontLegOnly, drawPlayer, drawLimbStump, DEFAULT_VISUALS } from './renderer.js';

// Re-eksporty modułów dla zachowania pełnej kompatybilności wstecznej
export * from './ik.js';
export * from './locomotion.js';
export * from './actions.js';
export * from './death.js';
export * from './renderer.js';

export const DEFAULT_BODY = {
  w: 24,
  h: 70,
  thighLen: 25,
  shinLen: 24,
  upperArmLen: 14,
  forearmLen: 13
};

export const DEFAULT_STATS = {
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

let comboLeftTurnTime = 0;
let comboFlipWindowUntil = 0;
let lastAirFacing = 0;

export function createPlayerInstance(overrides = {}) {
  const baseClass = overrides.currentClass || DEFAULT_CLASS;
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

    hp: 100,
    maxHp: 100,
    currentWeapon: WEAPONS.AK47,
    isHolstered: (activeArenaId === 'ARENA_1'),
    holsterWeight: (activeArenaId === 'ARENA_1' ? 1.0 : 0.0),
    shootCooldown: 0,
    grenadeCooldown: 0,
    grenadeMaxCooldown: 3.5, // 3.5 sekundy czasu odnowienia
    isDead: false,
    respawnTimer: 0,
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
    jetpackKeyNeutralized: true,
    isSliding: false,
    slideTimer: 0,
    slideCooldown: 0,
    sprintDuration: 0,
    dropThroughTimer: 0,
    isMovingBackwards: false,
    spinVolleyTimer: 0,
    spinVolleyDuration: 24,
    spartanTimer: 0,
    spartanDuration: 22,
    spartanTarget: null,
    ultMeter: 100,
    ultMax: 100,
    ultCooldown: 0,
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

  p.currentClass?.onDestroy?.(p);

  const merged = mergeClassWithSchema(newClass);
  p.currentClass = merged;
  p.classConfig = merged;
  p.class = merged;
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

  newClass.onInit?.(p);
}

if (typeof window !== 'undefined') {
  window.setPlayerClass = setPlayerClass;
  window.CLASSES = CLASSES;
}

export function updatePlayer(keys, leftStick, GROUND_Y, ball, spawnGrass, p = player, targets = null) {
  _updateCharacter(keys, leftStick, GROUND_Y, ball, spawnGrass, p, targets);
}

function _updateCharacter(keys, leftStick, GROUND_Y, ball, spawnGrass, player, targets = null) {
  if (keys) player.keys = keys;
  if (leftStick) player.leftStick = leftStick;

  if (player.isDead) {
    handlePlayerDeath(player, GROUND_Y);
    return;
  }

  if (targets) player._targets = targets;

  const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
  const isA3 = (curArena?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3');
  const isA2 = (curArena?.id === 'arena-2' || activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X');
  const noFlatGround = isA3 || isA2;
  player.groundY = isA3 ? 900 : (isA2 ? 1350 : GROUND_Y);
  if (!noFlatGround && !player.currentGroundY) player.currentGroundY = GROUND_Y;

  // Jeśli gracz stał na poziomie gruntu, a podłoże zniknęło (wyrwa) -> natychmiast traci kontakt z ziemią
  if (!noFlatGround && player.onGround && player.currentGroundY === GROUND_Y) {
    const isSupported = (typeof isGroundAt === 'function')
      ? (isGroundAt(player.x + 6) || isGroundAt(player.x + (player.w || 24) - 6))
      : true;
    if (!isSupported) {
      player.onGround = false;
      player.currentGroundY = null;
    }
  }

  if (ball) player._ball = ball;
  if (spawnGrass) player._spawnGrass = spawnGrass;

  player.currentClass?.onUpdate?.(player, ball);

  // Krew kapiąca z ran przy krytycznie niskim HP (< 35%)
  const curHpDrip = Math.max(0, player.hp ?? 100);
  const maxHpDrip = player.maxHp || 100;
  if (curHpDrip < maxHpDrip * 0.35 && !player.isDead) {
    const dripChance = 0.025 + (1.0 - (curHpDrip / (maxHpDrip * 0.35))) * 0.045;
    if (Math.random() < dripChance) {
      const px = player.x + (player.w || 24) * (0.3 + Math.random() * 0.4);
      const py = player.y + (player.h || 70) * (0.35 + Math.random() * 0.35);
      spawnBloodDrip(px, py, (player.vx || 0) * 0.3 + (Math.random() - 0.5) * 0.6, 0.8 + Math.random() * 0.8, 1);
    }
  }

  let isMovingBackwards = !player.isIntro && (player.vx * player.facing < -0.1);
  player.isMovingBackwards = isMovingBackwards;

  if (player.kickBufferTimer > 0) player.kickBufferTimer--;
  if (player.kickCooldown > 0) player.kickCooldown--;
  if (player.slideCooldown > 0) player.slideCooldown--;
  if (player.shootCooldown > 0) player.shootCooldown--;
  if (player.dropThroughTimer > 0) player.dropThroughTimer--;
  if (player.muzzleFlashTimer > 0) player.muzzleFlashTimer--;
  if (player.shootPoseTimer > 0) player.shootPoseTimer--;
  if (player.grenadeCooldown > 0) {
    player.grenadeCooldown = Math.max(0, player.grenadeCooldown - (1 / 60));
  }

  // Obsługa oszołomienia (staggerTimer po Spartan Kick)
  const isStaggered = (player.staggerTimer > 0);
  if (isStaggered) {
    player.staggerTimer--;
    player.isCharging = false;
    player.isShooting = false;
    player.isJumpCharging = false;
    if (player.staggerTimer === 0) {
      // 4. PŁYNNE WSTANIE PO UPŁYWIE OGŁUSZENIA:
      // Przywróć pełny collider stojący bez zacinania się w geometrii platformy (p.y wyrównane do gruntu)
      const currentFloor = player.currentGroundY || GROUND_Y;
      player.y = currentFloor - (player.h || 70);
      player.vy = 0;
      player.isJumping = false;
      player.onGround = true;
      player.staggerRecoveryTimer = 8; // 6-8 klatek płynnego powrotu broni i ramion do Low-Ready
      player.staggerLanded = false;
    }
  }
  if (player.staggerRecoveryTimer > 0) {
    player.staggerRecoveryTimer--;
  }

  updateWeaponState(player);
  updatePlayerThrow(player);

  const targetHolster = (player.isHolstered || !player.currentWeapon) ? 1.0 : 0.0;
  if (typeof player.holsterWeight !== 'number') {
    player.holsterWeight = targetHolster;
  } else {
    player.holsterWeight += (targetHolster - player.holsterWeight) * 0.22;
    if (Math.abs(targetHolster - player.holsterWeight) < 0.005) {
      player.holsterWeight = targetHolster;
    }
  }

  const isShootingStance = (!player.isHolstered) && ((player.isShooting) || (player.shootPoseTimer > 0) || (player.shootCooldown > 0) || (player.muzzleFlashTimer > 0) || (player.isAiming));
  const targetWeight = isShootingStance ? 1.0 : 0.0;
  player.shootPoseWeight = (typeof player.shootPoseWeight === 'number')
    ? player.shootPoseWeight + (targetWeight - player.shootPoseWeight) * 0.25
    : targetWeight;
  if (player.shootPoseWeight < 0.001) player.shootPoseWeight = 0;
  else if (player.shootPoseWeight > 0.999) player.shootPoseWeight = 1;

  if (player.isCharging && !player.isStickCharging && !isStaggered) {
    const chargeRate = player.currentClass?.stats?.chargeSpeed || 0.035;
    player.chargePower = Math.min(1.0, player.chargePower + chargeRate);
  }

  if (player.isJumpCharging && !isStaggered) {
    player.jumpChargePower = Math.min(1.0, player.jumpChargePower + 0.038);
  }

  let inputAxisX = 0;
  let inputAxisY = 0;

  // Odnawianie super-umiejętności (Ult)
  if (player.ultCooldown > 0) {
    player.ultCooldown--;
    player.ultMeter = Math.min(100, Math.floor((1 - player.ultCooldown / (8 * 60)) * 100));
  } else {
    player.ultCooldown = 0;
    player.ultMeter = 100;
  }

  // Wciśnięcie skoku / wykopu natychmiast podrywa postać na nogi z leżenia i kucania
  const standUpRequested = !!((keys && (keys.up || keys.space)) || (leftStick && leftStick.jumpTriggered) || (leftStick && leftStick.axisY < -0.40));
  if (standUpRequested && (player.isProne || player.isCrouching || player.crouchToggled)) {
    player.isProne = false;
    player.isCrouching = false;
    player.crouchToggled = false;
    player.enteredProneViaStickDown = false;
    player.state = 'STAND';
    player.hitboxHeight = player.h || 70;
  }

  // Wstawanie przy puszczeniu kierunku w dół na drążku
  if (player.isProne && player.enteredProneViaStickDown) {
    if (!leftStick || !leftStick.active || leftStick.axisY < 0.25) {
      player.isProne = false;
      player.enteredProneViaStickDown = false;
    }
  }

  // =========================================================================
  // OBSŁUGA KUCANIA I LEŻENIA (CROUCH & PRONE) POD KLAWISZEM CTRL / MOBILE
  // 1. Krótkie wciśnięcie / początek trzymania Ctrl (holdDuration < 450 ms):
  //    - postać wchodzi w stan kucania (CROUCH)
  // 2. Przytrzymanie Ctrl dłużej (> 400-500 ms, ok. 450 ms):
  //    - postać płynnie przechodzi ze stanu kucania w stan leżenia (PRONE)
  // 3. Puszczenie klawisza Ctrl / zwolnienie przycisku lub drążka:
  //    - postać natychmiast wstaje do pozycji stojącej (STAND), o ile sufit nie blokuje
  // 4. WŚLIZG (SLIDE) NIE JEST wyzwalany klawiszem Ctrl (wślizg wyłącznie pod Shiftem!)
  // =========================================================================
  const isCrouchInputActive = !!(
    (keys && (keys.crouch || keys.ctrl)) ||
    (leftStick && leftStick.active && leftStick.axisY > 0.40)
  );

  const crouchHeld = isCrouchInputActive && !isStaggered;

  if (crouchHeld) {
    if (!player.isDead && !player.isIntro && !player.isSliding) {
      const isGrounded = (player.onGround !== undefined) ? (player.onGround && !player.isJumping) : (!player.isJumping);
      if (isGrounded) {
        if (!player._crouchStartTime) {
          player._crouchStartTime = performance.now();
        }
        player.crouchHoldTimer = (player.crouchHoldTimer || 0) + 1;
        const holdDurationMs = performance.now() - player._crouchStartTime;
        const isStickCrouch = (leftStick && leftStick.active && leftStick.axisY > 0.40);
        let targetPosture;
        if (isStickCrouch) {
          // Na ekranie dotykowym drążek w dół to wyłącznie kucanie (pojedyncze lub trzymane),
          // a leżenie wyzwalane jest dedykowanym przyciskiem
          targetPosture = 'CROUCH';
        } else {
          targetPosture = evaluateCrouchState(player, true, Math.max(holdDurationMs, player.crouchHoldTimer * 16.666));
        }

        if (targetPosture === 'PRONE') {
          player.isProne = true;
          player.isCrouching = false;
          player.state = 'PRONE';
          player.hitboxHeight = 26;
        } else {
          player.isCrouching = true;
          player.isProne = false;
          player.state = 'CROUCH';
          player.hitboxHeight = 45;
        }
      }
    }
  } else {
    // Puszczenie klawisza Ctrl / zwolnienie przycisku lub powrót drążka do neutralnej pozycji
    player._crouchStartTime = 0;
    player.crouchHoldTimer = 0;

    if (player.isCrouching && !player.isSliding && !player.isProne) {
      const isHoldingDownArrow = !!(keys && keys.down);
      if (!isHoldingDownArrow && !player.crouchToggled) {
        if (!isCeilingBlockingStand(player, GROUND_Y)) {
          player.isCrouching = false;
          player.state = 'STAND';
          player.hitboxHeight = player.h || 70;
        }
      }
    }
  }

  // Utrzymanie stanu kucania przy aktywnym przełączniku (toggle crouch)
  if (player.crouchToggled && !player.isProne && !player.isSliding && !player.isJumping) {
    player.isCrouching = true;
    player.state = 'CROUCH';
    player.hitboxHeight = 45;
  }

  if (keys && !isStaggered) {
    if (keys.right) inputAxisX += 1;
    if (keys.left) inputAxisX -= 1;

    const isHoldingDown = !!keys.down;
    if (isHoldingDown) {
      inputAxisY += 1;
      if (!player.isProne && !player.isSliding && !player.isJumping) {
        player.isCrouching = true;
        player.state = 'CROUCH';
      }
    } else if (!player.crouchToggled && !crouchHeld && !player.isProne) {
      if (!isCeilingBlockingStand(player, GROUND_Y)) {
        player.isCrouching = false;
        if (player.state === 'CROUCH') {
          player.state = 'STAND';
          player.hitboxHeight = player.h || 70;
        }
      }
    }

    if (keys.up && !player.isJumping && !player.isSliding && !player.isIntro) {
      const jumpForce = player.currentClass?.stats?.jumpForce || CONFIG.JUMP_FORCE;
      player.vy = -jumpForce;
      player.isJumping = true;
      player.onGround = false;
      player.jetpackKeyNeutralized = false;
      player.isCrouching = false;
      player.isProne = false;
      player.crouchToggled = false;
      player.airVx = player.vx;
      keys.up = false;
      const grassFn = spawnGrass || player._spawnGrass;
      const currentFloor = player.currentGroundY || player.groundY;
      if (typeof grassFn === 'function' && currentFloor) {
        grassFn(player.x + player.w / 2, currentFloor, player.facing);
      }
    }

    if (keys.slide) {
      const minSpeed = CONFIG.MIN_RUN_SPEED || 2.5;
      if (player.onGround && Math.abs(player.vx) > minSpeed) {
        playerSlide(spawnGrass, GROUND_Y, player);
      }
      keys.slide = false;
    }
  }

  if (leftStick && leftStick.active && !isStaggered) {
    const sMag = Math.hypot(leftStick.axisX, leftStick.axisY);
    if (sMag < 0.18 || leftStick.axisY < -0.20) {
      if (!keys?.down && !crouchHeld) {
        if (!isCeilingBlockingStand(player, GROUND_Y)) {
          // Resetuj pozycję tylko przy celowym pchnięciu w górę (axisY < -0.30)
          // lub jeśli gracz nie miał aktywnego przełącznika (crouchToggled) i nie leżał
          if (leftStick.axisY < -0.30) {
            player.isCrouching = false;
            player.isProne = false;
            player.crouchToggled = false;
            if (player.state === 'CROUCH' || player.state === 'PRONE') {
              player.state = 'STAND';
              player.hitboxHeight = player.h || 70;
            }
          } else if (!player.crouchToggled && !player.isProne) {
            player.isCrouching = false;
            if (player.state === 'CROUCH') {
              player.state = 'STAND';
              player.hitboxHeight = player.h || 70;
            }
          }
        }
      }
    }

    inputAxisX = leftStick.axisX;
    inputAxisY = leftStick.axisY;

    if (leftStick.axisY > 0.40) {
      const angleFromDownRad = Math.atan2(Math.abs(leftStick.axisX), Math.max(0.0001, leftStick.axisY));
      const angleDeg = angleFromDownRad * (180 / Math.PI);
      if (angleDeg < 20) {
        inputAxisX = 0; // Kucanie w miejscu
      }
    }
  } else if (!keys?.down && !crouchHeld && !isStaggered && leftStick && !leftStick.active) {
    // Puszczenie gałki podrywa postać na równe nogi tylko jeśli nie ma toggle i nie leży
    if (player.isCrouching && !player.crouchToggled && !player.isProne) {
      if (!isCeilingBlockingStand(player, GROUND_Y)) {
        player.isCrouching = false;
        if (player.state === 'CROUCH') {
          player.state = 'STAND';
          player.hitboxHeight = player.h || 70;
        }
      }
    }
  }

  if (player.isProne) {
    player.isCrouching = false;
  }

  if (isStaggered) {
    inputAxisX = 0;
    inputAxisY = 0;
    if (player.onGround || player.staggerLanded) {
      player.vx *= 0.70; // Gwałtowne wygaszanie prędkości poziomej (tarcie ciała o podłoże)
      if (Math.abs(player.vx) < 0.15) player.vx = 0;
      if (typeof player.airVx === 'number') player.airVx = 0;
    } else {
      player.vx *= 0.985;
      if (typeof player.airVx === 'number') player.airVx *= 0.985;
    }
  }

  const now = performance.now();
  if (player.isJumping) {
    const curFacing = (inputAxisX < -0.3) ? -1 : ((inputAxisX > 0.3) ? 1 : 0);

    if (curFacing !== 0 && curFacing !== lastAirFacing) {
      if (curFacing === -1) {
        comboLeftTurnTime = now;
      } else if (curFacing === 1 && comboLeftTurnTime > 0) {
        const turnInterval = now - comboLeftTurnTime;
        if (turnInterval >= 50 && turnInterval <= 450) {
          comboFlipWindowUntil = now + 400;
        }
        comboLeftTurnTime = 0;
      }
      lastAirFacing = curFacing;
    }
  }

  const isTryingToMoveBackwards = (inputAxisX * player.facing < -0.05);

  const walkMax = player.currentClass?.stats?.walkMax || CONFIG.WALK_MAX;
  const jogMax = player.currentClass?.stats?.jogMax || CONFIG.JOG_MAX;
  const sprintMax = player.currentClass?.stats?.sprintMax || CONFIG.SPRINT_MAX;
  const accel = player.currentClass?.stats?.accel || CONFIG.ACCEL;
  const decel = player.currentClass?.stats?.decel || CONFIG.DECEL;
  const slideDecel = player.currentClass?.stats?.slideDecel || CONFIG.SLIDE_DECEL;

  let targetTopSpeed;
  if (player.isProne) {
    targetTopSpeed = Math.round(walkMax * 0.28 * 100) / 100;
  } else if (player.isCrouching) {
    targetTopSpeed = CONFIG.CROUCH_SPEED;
  } else {
    const isSprint = Math.abs(inputAxisX) > 0.75;
    if (isSprint && !isTryingToMoveBackwards) targetTopSpeed = sprintMax;
    else if (Math.abs(inputAxisX) > 0.45 || isTryingToMoveBackwards) targetTopSpeed = jogMax;
    else targetTopSpeed = walkMax;
  }
  if (isTryingToMoveBackwards && targetTopSpeed > jogMax) {
    targetTopSpeed = jogMax;
  }

  const curSpeedPre = Math.abs(player.vx);
  if (player.isJumpCharging && curSpeedPre < 0.8) {
    targetTopSpeed *= (1.0 - player.jumpChargePower * 0.55);
  }
  player.intendedVx = Math.abs(inputAxisX) > 0.05 ? inputAxisX * targetTopSpeed : 0;

  if (player.isIntro) {
    if (Math.abs(inputAxisX) > 0.35) {
      executeReleaseKick(ball, player);
    }

    inputAxisX = 0;
    inputAxisY = 0;
    player.vx = 0;
    player.isCrouching = false;
    player.isSliding = false;
    player.isJumping = false;
    player.juggleTimer += 1;

    if (typeof player.aimX === 'number' && !isNaN(player.aimX)) {
      player.facing = (player.aimX < player.x + player.w / 2) ? -1 : 1;
    }

    const hipX = player.x + player.w / 2;
    const hipY = player.y + player.h - 40;
    const choreo = getFreestyleChoreography(player.juggleTimer, hipX, hipY, GROUND_Y, player.facing, ball ? ball.radius : 8);
    player.gaitMode = choreo.trickName;
    player.frontLegOverBall = choreo.frontLegOverBall;
    player.lastHipShiftX = choreo.hipShiftX;
    player.lastFootFrontX = choreo.footFrontX;
    player.lastFootFrontY = choreo.footFrontY;
    player.lastFootFrontAnkle = choreo.footFrontAnkle;
    player.yaw = 0;
  } else {
    player.frontLegOverBall = false;

    const isLockedFacing = (player.kickMode === 'BACKFLIP' || player.kickMode === 'BACKFLIP_LAND' || player.kickMode === 'SPIN_VOLLEY');
    const isHighSpeedTurn = Math.abs(player.vx) > 2.0 || player.isSliding;

    if (!isLockedFacing) {
      let targetFacing = player.facing;
      const isAimingActive = player.isAiming || player.isShooting || (player.shootPoseTimer > 0);

      if (isTouchDevice && !player.isBot) {
        if (isAimingActive && typeof player.aimX === 'number' && !isNaN(player.aimX)) {
          targetFacing = (player.aimX < player.x + player.w / 2) ? -1 : 1;
        } else if (inputAxisX > 0.1 && !player.isSliding) {
          targetFacing = 1;
        } else if (inputAxisX < -0.1 && !player.isSliding) {
          targetFacing = -1;
        }
      } else {
        if (typeof player.aimX === 'number' && !isNaN(player.aimX)) {
          targetFacing = (player.aimX < player.x + player.w / 2) ? -1 : 1;
        } else if (inputAxisX > 0.1 && !player.isSliding) {
          targetFacing = 1;
        } else if (inputAxisX < -0.1 && !player.isSliding) {
          targetFacing = -1;
        }
      }

      if (player.facing !== targetFacing && !player.isSliding) {
        player.facing = targetFacing;
        player.turnMode = isHighSpeedTurn ? 'BACK' : 'FRONT';
        if (player.turnMode === 'FRONT') {
          if (player.yaw <= -Math.PI + 0.05) player.yaw = Math.PI;
        } else {
          if (player.yaw >= Math.PI - 0.05) player.yaw = -Math.PI;
        }
      }
    }

    if (player.kickMode !== 'SPIN_VOLLEY') {
      let targetYaw = 0;
      if (player.facing === 1) {
        targetYaw = 0;
      } else {
        targetYaw = (player.turnMode === 'FRONT') ? Math.PI : -Math.PI;
      }

      const turnRate = isHighSpeedTurn ? 0.30 : 0.22;
      player.yaw += (targetYaw - player.yaw) * turnRate;

      if (Math.abs(targetYaw - player.yaw) < 0.03) {
        player.yaw = targetYaw;
      }
    }

    if (player.isSliding) {
      player.vx *= slideDecel;
      player.slideTimer--;
      const currentFloor = player.currentGroundY || GROUND_Y;
      const grassFn = spawnGrass || player._spawnGrass;
      if (Math.abs(player.vx) > 1.8 && Math.random() < 0.85 && typeof grassFn === 'function') {
        grassFn(player.x + (player.w / 2) + (player.facing * 20), currentFloor, player.facing);
      }
      if (player.slideTimer <= 0 || Math.abs(player.vx) < 0.4) {
        player.isSliding = false;
      }
    } else if (player.isJumping) {
      if (Math.abs(inputAxisX) > 0.05) {
        player.airVx += inputAxisX * accel * 0.7;
        const maxAirSpeed = jogMax;
        player.airVx = Math.max(-maxAirSpeed, Math.min(maxAirSpeed, player.airVx));
      }
      player.vx = player.airVx;
      player.airVx *= 0.995;
    } else {
      const targetVx = inputAxisX * targetTopSpeed;
      if (Math.abs(inputAxisX) > 0.05) {
        player.vx += (targetVx - player.vx) * accel;
      } else {
        player.vx *= decel;
      }

      if (player.shootPoseWeight > 0.2 && Math.abs(inputAxisX) < 0.15) {
        player.vx *= 0.65;
      }
    }

    if (Math.abs(player.vx) < 0.02) player.vx = 0;
    player.x += player.vx;

    const speed = Math.abs(player.vx);

    isMovingBackwards = (player.vx * player.facing < -0.1);
    player.isMovingBackwards = isMovingBackwards;

    if (player.isSliding) {
      player.gaitMode = 'SLIDE';
      player.state = 'SLIDE';
      player.hitboxHeight = 35;
    } else if (player.isProne) {
      player.gaitMode = speed > 0.08 ? 'CRAWL' : 'PRONE';
      player.state = 'PRONE';
      player.hitboxHeight = 26;
      player.crawlPhase = (player.crawlPhase || 0) + speed * 0.14;
    } else if (player.isCrouching) {
      player.gaitMode = speed > 0.1 ? 'CROUCH_WALK' : 'CROUCH';
      player.state = 'CROUCH';
      player.hitboxHeight = 45; // 60-70% normalnej wysokości (~64.3% z 70)
    } else {
      player.hitboxHeight = player.h || 70;
      if (player.isJumping) player.state = 'JUMP';
      else player.state = 'STAND';

      if (speed < 0.1) player.gaitMode = 'IDLE';
      else if (speed <= walkMax + 0.15) player.gaitMode = 'WALK';
      else if (speed <= jogMax + 0.15) player.gaitMode = 'JOG';
      else player.gaitMode = 'SPRINT';
    }

    if (player.gaitMode === 'SPRINT' && !player.isJumping && !player.isCrouching && !player.isProne && !player.isSliding) {
      player.sprintDuration = (player.sprintDuration || 0) + 1;
    } else {
      player.sprintDuration = 0;
    }

    if (!player.isSliding && player.gaitMode !== 'IDLE' && player.gaitMode !== 'CROUCH' && player.gaitMode !== 'PRONE' && player.gaitMode !== 'CRAWL' && !player.isJumping) {
      let freq = 0.038;
      if (player.gaitMode === 'CROUCH_WALK') freq = 0.055;
      if (player.gaitMode === 'WALK') freq = 0.1047;
      if (player.gaitMode === 'JOG') freq = 0.052;
      if (player.gaitMode === 'SPRINT') freq = 0.040;

      if (isMovingBackwards) {
        player.stridePhase -= speed * freq;
      } else {
        player.stridePhase += speed * freq;
      }

      const currentFloor = player.currentGroundY || GROUND_Y;
      const grassFn = spawnGrass || player._spawnGrass;
      if (player.gaitMode === 'SPRINT' && Math.sin(player.stridePhase) > 0.85 && typeof grassFn === 'function') {
        grassFn(player.x + player.w / 2, currentFloor, player.facing);
      }
    }
  }

  const hipX = player.x + player.w / 2;
  const hipY = player.y + player.h - 40 + player.pelvisY;
  const speed = Math.abs(player.vx);

  let wantKneeJuggle = false;
  if ((player.gaitMode === 'WALK' || player.gaitMode === 'IDLE') && ball && !player.isIntro && !player.isSliding && !player.isJumping && player.kickState === 'IDLE' && player.shootPoseWeight < 0.1) {
    const ballRelX = (ball.x - hipX) * player.facing;
    const ballRelY = ball.y - hipY;
    if (ballRelX >= 4 && ballRelX <= 38 && ballRelY >= -52 && ballRelY <= 8) {
      wantKneeJuggle = true;
    }
  }
  const targetKneeWeight = wantKneeJuggle ? 1.0 : 0.0;
  player.kneeJuggleWeight += (targetKneeWeight - player.kneeJuggleWeight) * 0.18;
  if (player.kneeJuggleWeight < 0.005) player.kneeJuggleWeight = 0;

  if (player.kickMode === 'BACKFLIP') {
    player.bicycleTimer++;
    const flip = getBackflipTargets(player.bicycleTimer, player.bicycleDuration, hipX, hipY, player.facing);
    player.kickingFootX = flip.kicking.x;
    player.kickingFootY = flip.kicking.y;
    player.facing = -1;

    if (player.bicycleTimer >= player.bicycleDuration && !player.isJumping) {
      player.kickMode = 'BACKFLIP_LAND';
      player.landingTurnTimer = 10;
    }
  } else if (player.kickMode === 'BACKFLIP_LAND') {
    player.facing = -1;
    player.landingTurnTimer--;
    if (player.landingTurnTimer <= 0) {
      player.facing = 1;
      player.kickMode = 'GROUND';
      player.kickState = 'IDLE';
      player.hitThisSwing = false;
      player.kickCooldown = 12;
      player.kickingFootX = 0;
      player.kickingFootY = 0;
    }
  } else if (player.kickMode === 'SCISSOR') {
    player.scissorTimer++;
    const scissorTargets = getScissorLegTargets(player.scissorTimer, player.scissorDuration, hipX, hipY, player.facing, player.kickPower);
    player.kickingFootX = scissorTargets.front.x;
    player.kickingFootY = scissorTargets.front.y;

    if (!player.hitThisSwing) {
      applyKickInteractions(player, ball, targets, customObstacles, player.currentGroundY || GROUND_Y, spawnGrass);
    }

    if (player.scissorTimer >= player.scissorDuration) {
      player.kickState = 'IDLE';
      player.kickMode = 'GROUND';
      player.hitThisSwing = false;
      player.kickCooldown = 10;
      player.kickingFootX = 0;
      player.kickingFootY = 0;
    }
  } else if (player.kickMode === 'SPIN_VOLLEY') {
    player.spinVolleyTimer++;
    player.yaw += (Math.PI * 2) / player.spinVolleyDuration;
    const u = player.spinVolleyTimer / player.spinVolleyDuration;
    player.kickingFootX = hipX + Math.cos(u * Math.PI) * 36 * player.facing;
    player.kickingFootY = hipY + 4;

    if (!player.hitThisSwing) {
      applyKickInteractions(player, ball, targets, customObstacles, player.currentGroundY || GROUND_Y, spawnGrass);
    }

    if (player.spinVolleyTimer >= player.spinVolleyDuration) {
      player.kickState = 'IDLE';
      player.kickMode = 'GROUND';
      player.hitThisSwing = false;
      player.kickCooldown = 12;
      player.yaw = (player.facing === 1) ? 0 : (player.turnMode === 'FRONT' ? Math.PI : -Math.PI);
      player.kickingFootX = 0;
      player.kickingFootY = 0;
    }
  } else if (player.kickMode === 'SPARTAN') {
    player.spartanTimer++;
    const duration = player.spartanDuration || 22;
    const kickTargets = getSpartanKickTargets(player.spartanTimer, duration, hipX, hipY, player.facing, player.currentGroundY || GROUND_Y);
    player.kickingFootX = kickTargets.kicking.x;
    player.kickingFootY = kickTargets.kicking.y;

    if (player.spartanTimer >= 6 && player.spartanTimer <= 9 && !player.hitThisSwing) {
      const activeArena = getActiveArena();
      const kickHitbox = {
        x: player.facing === 1 ? hipX : hipX - 50,
        y: hipY - 20,
        w: 50,
        h: 40,
        footX: player.kickingFootX,
        footY: player.kickingFootY
      };
      activeArena?.onKickHit?.(player, kickHitbox);
      applySpartanKickHit(player, targets || player._targets, customObstacles, player.currentGroundY || GROUND_Y, spawnGrass);
    }

    if (player.spartanTimer >= duration) {
      player.kickState = 'IDLE';
      player.kickMode = 'GROUND';
      player.hitThisSwing = false;
      player.kickCooldown = 18;
      player.spartanTarget = null;
      player.chargePower = 0;
      player.kickPower = 0;
      player.kickingFootX = 0;
      player.kickingFootY = 0;
    }
  } else {
    const currentFloor = player.currentGroundY || GROUND_Y;
    if (player.kickState === 'SWING') {
      player.kickAngle += player.swingSpeed;

      const kickTraj = getGroundKickTrajectory('SWING', player.kickAngle, player.kickPower, hipX, hipY, currentFloor, player.facing, speed, player.kickPlantWorldX);
      player.kickingFootX = kickTraj.kicking.x;
      player.kickingFootY = kickTraj.kicking.y;

      if (!player.hitThisSwing) {
        const activeArena = getActiveArena();
        const kickHitbox = {
          x: player.facing === 1 ? hipX : hipX - 60,
          y: hipY - 25,
          w: 60,
          h: 50,
          footX: player.kickingFootX,
          footY: player.kickingFootY
        };
        activeArena?.onKickHit?.(player, kickHitbox);
        applyKickInteractions(player, ball, targets, customObstacles, currentFloor, spawnGrass);
      }

      if (player.kickAngle >= 2.1) {
        player.kickState = 'RECOVER';
      }
    } else if (player.kickState === 'RECOVER') {
      player.kickAngle -= player.kickRecoverSpeed;

      const kickTraj = getGroundKickTrajectory('RECOVER', player.kickAngle, player.kickPower, hipX, hipY, currentFloor, player.facing, speed, player.kickPlantWorldX);
      player.kickingFootX = kickTraj.kicking.x;
      player.kickingFootY = kickTraj.kicking.y;

      if (player.kickAngle <= 0) {
        player.kickAngle = 0;
        player.kickState = 'IDLE';
        player.hitThisSwing = false;
        player.kickCooldown = 8;
        player.stridePhase = (player.kickLeg === 'front') ? 0 : Math.PI;
        player.kickingFootX = 0;
        player.kickingFootY = 0;
      }
    } else if (player.isCharging) {
      // Synchronizacja stopy ze sprintem i pędem postaci w czasie ładowania strzału
      const kickTraj = getGroundKickTrajectory('CHARGE', 0, player.chargePower, hipX, hipY, currentFloor, player.facing, speed, player.kickPlantWorldX || 0);
      player.kickingFootX = kickTraj.kicking.x;
      player.kickingFootY = kickTraj.kicking.y;
    }
  }

  let targetTilt = 0;
  if (player.kickMode === 'BACKFLIP') {
    const flip = getBackflipTargets(player.bicycleTimer, player.bicycleDuration, hipX, hipY, player.facing);
    targetTilt = -flip.rotation;
  } else if (player.kickMode === 'BACKFLIP_LAND') {
    targetTilt = 0.16 * player.facing;
  } else if (player.kickMode === 'SCISSOR' && player.kickState === 'SWING') {
    targetTilt = 0.06 * player.facing;
  } else if (player.kickMode === 'SPIN_VOLLEY') {
    targetTilt = -0.10 * player.facing;
  } else if (player.isJumpCharging) {
    if (speed < 0.8) {
      targetTilt = 0.12 * player.jumpChargePower * player.facing;
    } else {
      const baseTilt = (player.gaitMode === 'SPRINT')
        ? 0.28 + ((speed - jogMax) / 2.6) * 0.10
        : (player.gaitMode === 'JOG')
          ? 0.08 + ((speed - walkMax) / 2.0) * 0.04
          : (speed / walkMax) * 0.015;
      targetTilt = (baseTilt + player.jumpChargePower * 0.08) * player.facing;
    }
  } else if (!player.isIntro && player.kickMode === 'GROUND' && (player.kickState === 'SWING' || player.kickState === 'RECOVER')) {
    if (speed > 1.2) {
      targetTilt = (0.20 + (speed / sprintMax) * 0.14) * player.facing;
    } else {
      targetTilt = (-0.12 * Math.min(1.0, player.kickAngle / 1.4)) * player.facing;
    }
  } else if (player.kneeJuggleWeight > 0) {
    targetTilt = -0.06 * player.kneeJuggleWeight * player.facing;
  } else if (player.staggerTimer > 0) {
    targetTilt = -Math.PI / 2 * player.facing;
  } else if (player.kickMode === 'SPARTAN') {
    const t = player.spartanTimer || 0;
    if (t <= 4) {
      targetTilt = 0.15 * player.facing;
    } else if (t <= 15) {
      targetTilt = -0.45 * player.facing;
    } else {
      const w = Math.min(1.0, (t - 15) / 7);
      targetTilt = lerp(-0.45, 0.0, w) * player.facing;
    }
  } else if (player.isSliding) {
    targetTilt = -0.75 * player.facing;
  } else if (isMovingBackwards) {
    targetTilt = -0.08 * player.facing;
  } else if (player.isProne) {
    targetTilt = 1.48 * player.facing;
  } else if (player.isCrouching) {
    targetTilt = 0.20 * player.facing;
  } else if (player.isJumping) {
    targetTilt = 0.04 * player.facing;
  } else if (player.isIntro) {
    const choreo = getFreestyleChoreography(player.juggleTimer, hipX, player.y + player.h - 40, GROUND_Y, player.facing, ball ? ball.radius : 8);
    targetTilt = choreo.torsoLean;
  } else if (player.gaitMode === 'IDLE') {
    targetTilt = 0;
  } else {
    if (player.gaitMode === 'WALK') targetTilt = ((speed / walkMax) * 0.045) * player.facing;
    else if (player.gaitMode === 'JOG') targetTilt = (0.08 + ((speed - walkMax) / 2.0) * 0.04) * player.facing;
    else if (player.gaitMode === 'SPRINT') targetTilt = (0.28 + ((speed - jogMax) / 2.6) * 0.10) * player.facing;
  }

  if (player.shootPoseWeight > 0) {
    const shootingLean = player.isCrouching ? 0.09 : 0.075;
    targetTilt += shootingLean * player.facing * player.shootPoseWeight;
  }

  if (player.kickMode === 'BACKFLIP' || player.kickMode === 'SPARTAN' || player.staggerTimer > 0) {
    player.torsoTilt = targetTilt;
    player.torsoTiltVel = 0;
  } else {
    const tiltForce = (targetTilt - player.torsoTilt) * 0.22;
    player.torsoTiltVel = (player.torsoTiltVel + tiltForce) * 0.76;
    player.torsoTilt += player.torsoTiltVel;
  }

  const colH = (player.staggerTimer > 0) ? 15 : (player.h || 70);

  if (player.inMinecart || player._inCart) {
    // Postać w wagoniku stoi stabilnie na podłodze wózka i porusza się razem z nim
    player.onGround = true;
    player.isJumping = false;
    player.vy = 0;
    if (player._inCart) {
      const cartFloor = player._inCart.y + 48;
      player.currentGroundY = cartFloor;
      player.y = cartFloor - colH;
    }
  } else if (player.staggerTimer > 0 && player.staggerLanded && player.onGround) {
    // Przez resztę czasu ogłuszenia (do końca 2 sekund) postać leży nieruchomo płasko na powierzchni gruntu
    player.vy = 0;
    player.isJumping = false;
    const currentFloor = player.currentGroundY || GROUND_Y;
    player.y = currentFloor - colH;
  } else {
    player.vy += CONFIG.GRAVITY;
    player.y += player.vy;

    const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
    const isA3 = (curArena?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3');
    const isA2 = (curArena?.id === 'arena-2' || activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X');
    if (!isA3 && !isA2) {
      const groundFloorLimit = GROUND_Y - colH;
      const isSupported = (typeof isGroundAt === 'function')
        ? (isGroundAt(player.x + 6) || isGroundAt(player.x + (player.w || 24) - 6))
        : true;

      if (isSupported && player.y >= groundFloorLimit && player.y <= groundFloorLimit + 30) {
        player.y = groundFloorLimit;
        player.vy = 0;
        player.isJumping = false;
        player.onGround = true;
        player.jetpackKeyNeutralized = true;
        player.airVx = 0;
        player.currentGroundY = GROUND_Y;

        if (player.staggerTimer > 0 && !player.staggerLanded) {
          player.staggerLanded = true;
          player.vx *= 0.70;
          spawnGroundPuff(player.x + (player.w || 24) / 2, GROUND_Y);
        }

        if (player.jetFuel < player.jetMax) {
          player.jetFuel = Math.min(player.jetMax, player.jetFuel + 2.5);
        }

        if (player.kickMode === 'BACKFLIP') {
          player.kickMode = 'BACKFLIP_LAND';
          player.landingTurnTimer = 10;
        } else if (player.kickMode === 'SCISSOR') {
          player.kickState = 'IDLE';
          player.kickMode = 'GROUND';
          player.scissorTimer = 0;
          player.kickCooldown = 10;
          player.kickingFootX = 0;
          player.kickingFootY = 0;
        }
      } else if (!isSupported && player.y >= groundFloorLimit - 4) {
        // Postać wpada w wyrwę w geometrii – grawitacja ściąga ją w dół przez otwór w kładce
        player.onGround = false;
        player.currentGroundY = null;
      }
    }

    // Strefa toksycznego kwasu i otchłani śmierci w Sektorze X (Arena 2)
    if (isA2) {
      const pFeetY = player.y + (player.h || 70);
      if (pFeetY >= 1350 && !player.isDead) {
        player.hp = 0;
        player.isDead = true;
        player.respawnTimer = 75;
        if (typeof triggerScreenShake === 'function') {
          triggerScreenShake(14);
        }
      } else if (pFeetY >= 1260 && !player.isDead) {
        player.hp -= 0.65;
        player.vx *= 0.94;
        if (player.hp <= 0) {
          player.hp = 0;
          player.isDead = true;
          player.respawnTimer = 75;
          if (typeof triggerScreenShake === 'function') {
            triggerScreenShake(12);
          }
        }
      }
    } else {
      // Wpadnięcie do strefy śmierci w dolnym kanale technicznym (zabezpieczenie pasażera wagonika)
      const isA3Death = isA3;
      const deathLimitY = isA3Death ? 1390 : (GROUND_Y + 160);
      if (!player.inMinecart && !player._inCart && player.y > deathLimitY && !player.isDead) {
        player.hp = 0;
        player.isDead = true;
        player.respawnTimer = 75;
        if (typeof triggerScreenShake === 'function') {
          triggerScreenShake(12);
        }
      }
    }
  }

  let targetPelvisY = -11.8;

  if (player.isIntro) {
    const choreo = getFreestyleChoreography(player.juggleTimer, hipX, player.y + player.h - 40, GROUND_Y, player.facing, ball ? ball.radius : 8);
    targetPelvisY = -11.8 + choreo.pelvisDip;
  } else if (player.isJumpCharging) {
    if (speed < 0.8) {
      targetPelvisY = -11.8 + (player.jumpChargePower * 14);
    } else {
      const basePelvis = (player.gaitMode === 'SPRINT')
        ? Math.sin(player.stridePhase * 2 - Math.PI / 2) * 5.4 - 1.5
        : (player.gaitMode === 'JOG')
          ? Math.sin(player.stridePhase * 2 - Math.PI / 2) * 4.8 - 1.2
          : Math.cos(player.stridePhase * 2) * 2.2;
      targetPelvisY = -11.8 + basePelvis + (player.jumpChargePower * 5.0);
    }
  } else if (player.kickMode === 'BACKFLIP') {
    targetPelvisY = -1.5;
  } else if (player.kickMode === 'BACKFLIP_LAND') {
    targetPelvisY = 6.0;
  } else if (player.isCharging && speed < 0.8) {
    const chargeDip = (player.chargePower || 0) * 4.2;
    targetPelvisY = -11.8 + chargeDip;
  } else if (player.kickMode === 'GROUND' && player.kickState === 'SWING') {
    targetPelvisY = -10.5;
  } else if (player.kickMode === 'SPARTAN') {
    targetPelvisY = -4.0;
  } else if (player.isProne) {
    targetPelvisY = 34;
  } else if (player.isSliding) {
    targetPelvisY = 26;
  } else if (player.isCrouching) {
    targetPelvisY = 16.5;
  } else if (player.gaitMode === 'IDLE') {
    const braceDip = (player.shootPoseWeight || 0) * 3.2;
    targetPelvisY = -11.8 + braceDip;
  } else if (player.gaitMode === 'WALK') {
    targetPelvisY = -10.4 - Math.cos(player.stridePhase * 2 - 0.3) * 1.8;
  } else if (player.gaitMode === 'JOG') {
    targetPelvisY = -7.5 + Math.sin(player.stridePhase * 2 - Math.PI / 2) * 4.2;
  } else if (player.gaitMode === 'SPRINT') {
    targetPelvisY = -5.5 + Math.sin(player.stridePhase * 2 - Math.PI / 2) * 5.0;
  }

  if (player.isJumping) targetPelvisY = -4.0;
  player.pelvisY += (targetPelvisY - player.pelvisY) * 0.18;

  const targetHeadBob = (player.pelvisY * 0.35) + (Math.abs(player.vx) > 0 ? Math.sin(player.stridePhase * 2) * 1.4 : 0);
  const headForce = (targetHeadBob - player.headBob) * 0.32;
  player.headBobVel = (player.headBobVel + headForce) * 0.65;
  player.headBob += player.headBobVel;

  const headX = hipX + (28 * Math.sin(player.torsoTilt));
  const headY = hipY - (28 * Math.cos(player.torsoTilt)) - 10 + player.headBob;
  player.head = { x: headX, y: headY };
  if (!player.height) player.height = player.h || 70;
  if (!player.width) player.width = player.w || 24;

  let targetLookX, targetLookY;
  if (typeof player.aimX === 'number' && !isNaN(player.aimX) && typeof player.aimY === 'number' && !isNaN(player.aimY)) {
    targetLookX = player.aimX;
    targetLookY = player.aimY;
  } else {
    targetLookX = headX + 60 * player.facing;
    targetLookY = headY;
  }

  player.lastBallX = targetLookX;
  player.lastBallY = targetLookY;

  const dxLook = (targetLookX - headX) * player.facing;
  const dyLook = targetLookY - headY;

  let desiredPitch = 0;
  if (player.kickMode === 'BACKFLIP') {
    desiredPitch = 0.35;
  } else {
    const worldPitch = Math.atan2(dyLook, Math.max(8, dxLook));
    const compensatedPitch = worldPitch - (player.torsoTilt * player.facing);
    desiredPitch = Math.max(-0.80, Math.min(0.55, compensatedPitch));
  }

  const pitchLerp = 0.30;
  player.headPitch += (desiredPitch - player.headPitch) * pitchLerp;

  const isArena3 = (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3');
  const isArena2 = (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X');
  const wallLeft = (isArena3 || isArena2) ? 0 : ARENA_LEFT;
  const wallRight = isArena3 ? 4400 : (isArena2 ? 3600 : ARENA_RIGHT);
  const groundFloorY = 1000;
  const wallTop = isArena2 ? 0 : (groundFloorY - (isArena3 ? 1300 : 3000));

  if (player.y >= wallTop) {
    if (player.x < wallLeft) {
      player.x = wallLeft;
      if (player.vx < 0) player.vx = 0;
      if (player.airVx < 0) player.airVx = 0;
    } else if (player.x + player.w > wallRight) {
      player.x = wallRight - player.w;
      if (player.vx > 0) player.vx = 0;
      if (player.airVx > 0) player.airVx = 0;
    }
  }
}

export { throwTacticalGrenade } from './actions.js';
