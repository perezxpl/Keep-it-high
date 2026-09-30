// =========================================================================
// PLAYER/INDEX.JS - GŁÓWNY MODUŁ POSTACI (STAN, FIZYKA, CYKL ŻYCIA)
// Łączy w całość logikę ruchową, akcje, renderowanie i stan encji gracza.
// =========================================================================

import { CONFIG, START_X, ARENA_LEFT, ARENA_RIGHT } from '../config.js';
import { DEFAULT_CLASS, CLASSES } from '../classes/index.js';
import { isTouchDevice } from '../world.js';
import { WEAPONS, updateWeaponState } from '../weapons.js';

import { ease, parabola, lerp, lerpAngle, solve2BoneIK, getArmAnglesForTarget, getAimArmAngles } from './ik.js';
import { getFreestyleChoreography, getSprintFootTrajectory, getBiomechanicFootTrajectory } from './locomotion.js';
import {
  startJumpCharge, playerJump, executeReleaseJump, playerSlide,
  startKickCharge, evaluateKickTiming, isBallInKickReach, executeReleaseKick,
  getGroundKickTrajectory, getScissorLegTargets, getBackflipTargets
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
  baseKickSpeed: 15.0,
  kickPowerMult: 1.0,
  spinMult: 1.0,
  jetMax: 100
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
    shootCooldown: 0,
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
    isJumping: false,
    isSliding: false,
    slideTimer: 0,
    dropThroughTimer: 0,
    isMovingBackwards: false,
    spinVolleyTimer: 0,
    spinVolleyDuration: 24,
    _ball: null,

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
    ...overrides
  };
}

export const player = createPlayerInstance({ isIntro: true });

export function setPlayerClass(newClass, p = player) {
  if (!newClass || !p) return;

  p.currentClass?.onDestroy?.(p);

  const merged = mergeClassWithSchema(newClass);
  p.currentClass = merged;

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

export function updatePlayer(keys, leftStick, GROUND_Y, ball, spawnGrass, p = player) {
  _updateCharacter(keys, leftStick, GROUND_Y, ball, spawnGrass, p);
}

function _updateCharacter(keys, leftStick, GROUND_Y, ball, spawnGrass, player) {
  if (player.isDead) {
    handlePlayerDeath(player, GROUND_Y);
    return;
  }

  player.groundY = GROUND_Y;
  if (!player.currentGroundY) player.currentGroundY = GROUND_Y;
  if (ball) player._ball = ball;
  if (spawnGrass) player._spawnGrass = spawnGrass;

  player.currentClass?.onUpdate?.(player, ball);

  let isMovingBackwards = !player.isIntro && (player.vx * player.facing < -0.1);
  player.isMovingBackwards = isMovingBackwards;

  if (player.kickBufferTimer > 0) player.kickBufferTimer--;
  if (player.kickCooldown > 0) player.kickCooldown--;
  if (player.shootCooldown > 0) player.shootCooldown--;
  if (player.dropThroughTimer > 0) player.dropThroughTimer--;
  if (player.muzzleFlashTimer > 0) player.muzzleFlashTimer--;
  if (player.shootPoseTimer > 0) player.shootPoseTimer--;

  updateWeaponState(player);

  const isShootingStance = (player.isShooting) || (player.shootPoseTimer > 0) || (player.shootCooldown > 0) || (player.muzzleFlashTimer > 0);
  const targetWeight = isShootingStance ? 1.0 : 0.0;
  player.shootPoseWeight = (typeof player.shootPoseWeight === 'number')
    ? player.shootPoseWeight + (targetWeight - player.shootPoseWeight) * 0.25
    : targetWeight;
  if (player.shootPoseWeight < 0.001) player.shootPoseWeight = 0;
  else if (player.shootPoseWeight > 0.999) player.shootPoseWeight = 1;

  if (player.isCharging && !player.isStickCharging) {
    const chargeRate = player.currentClass?.stats?.chargeSpeed || 0.035;
    player.chargePower = Math.min(1.0, player.chargePower + chargeRate);
  }

  if (player.isJumpCharging) {
    player.jumpChargePower = Math.min(1.0, player.jumpChargePower + 0.038);
  }

  let inputAxisX = 0;
  let inputAxisY = 0;

  if (keys) {
    if (keys.right) inputAxisX += 1;
    if (keys.left) inputAxisX -= 1;
    if (keys.down || keys.ctrl) inputAxisY += 1;

    if (keys.up && !player.isJumping && !player.isSliding && !player.isIntro) {
      const jumpForce = player.currentClass?.stats?.jumpForce || CONFIG.JUMP_FORCE;
      player.vy = -jumpForce;
      player.isJumping = true;
      player.isCrouching = false;
      player.airVx = player.vx;
      keys.up = false;
      const grassFn = spawnGrass || player._spawnGrass;
      const currentFloor = player.currentGroundY || player.groundY;
      if (grassFn && currentFloor) {
        grassFn(player.x + player.w / 2, currentFloor, player.facing);
      }
    }

    if (keys.slide) {
      playerSlide(spawnGrass, GROUND_Y, player);
      keys.slide = false;
    }
  }

  if (leftStick && leftStick.active) {
    inputAxisX = leftStick.axisX;
    inputAxisY = leftStick.axisY;

    if (leftStick.axisY > 0.35) {
      const angleFromDownRad = Math.atan2(Math.abs(leftStick.axisX), Math.max(0.0001, leftStick.axisY));
      const angleDeg = angleFromDownRad * (180 / Math.PI);
      if (angleDeg < 20) {
        inputAxisX = 0;
      }
    }
  }

  const isPcCtrl = !!(keys && (keys.ctrl || keys.down));
  const isTouchCrouch = !!(leftStick && leftStick.active && leftStick.axisY > 0.35);
  player.isCrouching = (isPcCtrl || isTouchCrouch) && !player.isSliding && !player.isJumping;

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
  if (player.isCrouching) {
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
      if (Math.abs(player.vx) > 1.8 && Math.random() < 0.85 && grassFn) {
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

    if (player.isSliding) player.gaitMode = 'SLIDE';
    else if (player.isCrouching) player.gaitMode = speed > 0.1 ? 'CROUCH_WALK' : 'CROUCH';
    else if (speed < 0.1) player.gaitMode = 'IDLE';
    else if (speed <= walkMax + 0.1) player.gaitMode = 'WALK';
    else if (speed <= jogMax + 0.1 || (player.vx * player.facing < -0.1)) player.gaitMode = 'JOG';
    else player.gaitMode = 'SPRINT';

    if (!player.isSliding && player.gaitMode !== 'IDLE' && player.gaitMode !== 'CROUCH' && !player.isJumping) {
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
      if (player.gaitMode === 'SPRINT' && Math.sin(player.stridePhase) > 0.85 && grassFn) {
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
    }
  } else if (player.kickMode === 'SCISSOR') {
    player.scissorTimer++;
    const scissorTargets = getScissorLegTargets(player.scissorTimer, player.scissorDuration, hipX, hipY, player.facing, player.kickPower);
    player.kickingFootX = scissorTargets.front.x;
    player.kickingFootY = scissorTargets.front.y;

    if (player.scissorTimer >= player.scissorDuration) {
      player.kickState = 'IDLE';
      player.kickMode = 'GROUND';
      player.hitThisSwing = false;
      player.kickCooldown = 10;
    }
  } else if (player.kickMode === 'SPIN_VOLLEY') {
    player.spinVolleyTimer++;
    player.yaw += (Math.PI * 2) / player.spinVolleyDuration;
    const u = player.spinVolleyTimer / player.spinVolleyDuration;
    player.kickingFootX = hipX + Math.cos(u * Math.PI) * 36 * player.facing;
    player.kickingFootY = hipY + 4;

    if (player.spinVolleyTimer >= player.spinVolleyDuration) {
      player.kickState = 'IDLE';
      player.kickMode = 'GROUND';
      player.hitThisSwing = false;
      player.kickCooldown = 12;
      player.yaw = (player.facing === 1) ? 0 : (player.turnMode === 'FRONT' ? Math.PI : -Math.PI);
    }
  } else {
    const currentFloor = player.currentGroundY || GROUND_Y;
    if (player.kickState === 'SWING') {
      player.kickAngle += player.swingSpeed;

      const kickTraj = getGroundKickTrajectory(kickPhase => 'SWING', player.kickAngle, player.kickPower, hipX, hipY, currentFloor, player.facing, speed, player.kickPlantWorldX);
      player.kickingFootX = kickTraj.kicking.x;
      player.kickingFootY = kickTraj.kicking.y;

      if (player.kickAngle >= 2.1) {
        player.kickState = 'RECOVER';
      }
    } else if (player.kickState === 'RECOVER') {
      player.kickAngle -= player.kickRecoverSpeed;

      const kickTraj = getGroundKickTrajectory(kickPhase => 'RECOVER', player.kickAngle, player.kickPower, hipX, hipY, currentFloor, player.facing, speed, player.kickPlantWorldX);
      player.kickingFootX = kickTraj.kicking.x;
      player.kickingFootY = kickTraj.kicking.y;

      if (player.kickAngle <= 0) {
        player.kickAngle = 0;
        player.kickState = 'IDLE';
        player.hitThisSwing = false;
        player.kickCooldown = 8;
        player.stridePhase = (player.kickLeg === 'front') ? 0 : Math.PI;
      }
    } else if (player.isCharging && speed < 0.8 && isBallInKickReach(player, ball)) {
      const kickTraj = getGroundKickTrajectory('CHARGE', 0, player.chargePower, hipX, hipY, currentFloor, player.facing, speed, 0);
      player.kickingFootX = kickTraj.kicking.x;
      player.kickingFootY = kickTraj.kicking.y;
    }
  }

  const isVisualChargingInUpdate = (player.isCharging && speed < 0.8 && isBallInKickReach(player, ball));

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
  } else if (player.isSliding) {
    targetTilt = -0.75 * player.facing;
  } else if (isMovingBackwards) {
    targetTilt = -0.08 * player.facing;
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
    if (player.gaitMode === 'WALK') targetTilt = ((speed / walkMax) * 0.015) * player.facing;
    else if (player.gaitMode === 'JOG') targetTilt = (0.08 + ((speed - walkMax) / 2.0) * 0.04) * player.facing;
    else if (player.gaitMode === 'SPRINT') targetTilt = (0.28 + ((speed - jogMax) / 2.6) * 0.10) * player.facing;
  }

  if (player.shootPoseWeight > 0) {
    const shootingLean = player.isCrouching ? 0.09 : 0.075;
    targetTilt += shootingLean * player.facing * player.shootPoseWeight;
  }

  if (player.kickMode === 'BACKFLIP') {
    player.torsoTilt = targetTilt;
    player.torsoTiltVel = 0;
  } else {
    const tiltForce = (targetTilt - player.torsoTilt) * 0.22;
    player.torsoTiltVel = (player.torsoTiltVel + tiltForce) * 0.76;
    player.torsoTilt += player.torsoTiltVel;
  }

  player.vy += CONFIG.GRAVITY;
  player.y += player.vy;

  const groundFloorLimit = GROUND_Y - player.h;
  if (player.y >= groundFloorLimit) {
    player.y = groundFloorLimit;
    player.vy = 0;
    player.isJumping = false;
    player.airVx = 0;
    player.currentGroundY = GROUND_Y;

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
  } else if (player.kickMode === 'GROUND' && (player.kickState === 'SWING' || isVisualChargingInUpdate)) {
    targetPelvisY = -10.5;
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

  if (player.x < ARENA_LEFT) {
    player.x = ARENA_LEFT;
    if (player.vx < 0) player.vx = 0;
    if (player.airVx < 0) player.airVx = 0;
  } else if (player.x + player.w > ARENA_RIGHT) {
    player.x = ARENA_RIGHT - player.w;
    if (player.vx > 0) player.vx = 0;
    if (player.airVx > 0) player.airVx = 0;
  }
}
