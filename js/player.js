import { CONFIG, START_X, ARENA_LEFT, ARENA_RIGHT } from './config.js';
import { DEFAULT_CLASS, CLASSES } from './classes/index.js';
import { isTouchDevice } from './world.js';
import { WEAPONS, drawHeldWeapon, getWeaponHoldTransform } from './weapons.js';

function ease(t) {
  return 0.5 - 0.5 * Math.cos(t * Math.PI);
}

function parabola(t) {
  return 4 * t * (1 - t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpAngle(a, b, t) {
  let diff = (b - a) % (Math.PI * 2);
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > Math.PI) diff -= Math.PI * 2;
  return a + diff * t;
}

// =========================================================================
// FREESTYLE ENGINE: INTRO PRZED LINIĄ STARTU
// =========================================================================
export function getFreestyleChoreography(timer, hipBaseX, hipBaseY, groundY, facing, ballRadius) {
  let loopTimer = timer;
  if (timer > 60) {
    loopTimer = 60 + ((timer - 60) % 150);
  }

  const sweetSpotX = hipBaseX + 16 * facing;
  const plantY = groundY - 3.5;

  let ballX = sweetSpotX;
  let ballY = groundY - ballRadius;
  let footFrontX = sweetSpotX;
  let footFrontY = plantY;
  let footFrontAnkle = 0;
  let footBackX = hipBaseX - 5 * facing;
  let footBackY = plantY;
  let footBackAnkle = 0;
  let hipShiftX = 0;
  let pelvisDip = 0;
  let torsoLean = 0.03;
  let frontLegOverBall = false;
  let trickName = 'PODBICIE Z ZIEMI';

  if (loopTimer < 60) {
    trickName = 'PODBICIE Z ZIEMI';
    hipShiftX = -3 * facing;

    if (loopTimer < 18) {
      const u = ease(loopTimer / 18);
      ballX = hipBaseX + 26 * facing;
      ballY = groundY - ballRadius;

      footFrontX = hipBaseX + (12 + u * 14) * facing;
      footFrontY = plantY - 2;
      footFrontAnkle = 0.18 * u * facing;
      torsoLean = 0.05 * u;
    } else if (loopTimer < 38) {
      const u = ease((loopTimer - 18) / 20);
      ballX = hipBaseX + (26 - u * 10) * facing;
      ballY = groundY - ballRadius;

      footFrontX = ballX + 2 * facing;
      footFrontY = plantY - 1;
      footFrontAnkle = 0.15 * facing;
      frontLegOverBall = true;
    } else {
      const u = (loopTimer - 38) / 22;
      const lift = parabola(u);
      ballX = sweetSpotX;
      ballY = (groundY - ballRadius) - (lift * 32);

      const footSnap = Math.sin(u * Math.PI);
      footFrontX = sweetSpotX;
      footFrontY = plantY - (footSnap * 15);
      footFrontAnkle = -0.28 * footSnap * facing;
      pelvisDip = -footSnap * 1.5;
    }

    footBackX = hipBaseX - 5 * facing;
    footBackY = plantY;
  } else if (loopTimer < 150) {
    const subTimer = loopTimer - 60;
    const rep = Math.floor(subTimer / 22);
    const u = (subTimer % 22) / 22;
    const isRightFoot = (rep % 2 === 0);

    trickName = isRightFoot ? 'KAPKOWANIE: PRAWA' : 'KAPKOWANIE: LEWA';

    const ballArc = parabola(u);
    ballX = sweetSpotX;
    ballY = (groundY - ballRadius - 8) - (ballArc * 26);

    if (isRightFoot) {
      hipShiftX = -4 * facing;
      pelvisDip = Math.sin(u * Math.PI) * 1.5;

      const kickSnap = Math.max(0, Math.sin(u * Math.PI * 1.8));
      footFrontX = sweetSpotX;
      footFrontY = plantY - 2 - (kickSnap * 14);
      footFrontAnkle = (0.12 - (kickSnap * 0.35)) * facing;

      footBackX = hipBaseX - 5 * facing;
      footBackY = plantY;
      footBackAnkle = 0;
    } else {
      hipShiftX = 2 * facing;
      pelvisDip = Math.sin(u * Math.PI) * 1.5;

      footFrontX = hipBaseX + 6 * facing;
      footFrontY = plantY;
      footFrontAnkle = 0;

      const kickSnap = Math.max(0, Math.sin(u * Math.PI * 1.8));
      footBackX = sweetSpotX - (2 * facing) + (kickSnap * 2 * facing);
      footBackY = plantY - 2 - (kickSnap * 14);
      footBackAnkle = (0.12 - (kickSnap * 0.35)) * facing;
    }
  } else {
    trickName = 'AROUND THE WORLD';
    const u = (loopTimer - 150) / 60;
    hipShiftX = -4 * facing;

    const ballArc = parabola(u);
    ballX = sweetSpotX;
    ballY = (groundY - ballRadius - 10) - (ballArc * 36);

    if (u < 0.20) {
      const snap = Math.sin((u / 0.20) * Math.PI);
      footFrontX = sweetSpotX;
      footFrontY = plantY - (snap * 16);
      footFrontAnkle = -0.25 * facing;
      frontLegOverBall = false;
    } else if (u < 0.45) {
      const upU = (u - 0.20) / 0.25;
      footFrontX = sweetSpotX - (2 * facing);
      footFrontY = (plantY - 16) - upU * (plantY - ballY);
      footFrontAnkle = -0.15 * facing;
      frontLegOverBall = false;
    } else if (u < 0.72) {
      const downU = (u - 0.45) / 0.27;
      footFrontX = sweetSpotX + (1 * facing);
      footFrontY = (ballY - 16) + downU * 36;
      footFrontAnkle = 0.28 * downU * facing;
      frontLegOverBall = true;
      pelvisDip = -Math.sin(downU * Math.PI) * 2;
    } else {
      const landU = (u - 0.72) / 0.28;
      footFrontX = sweetSpotX;
      footFrontY = plantY - ((1 - landU) * 6);
      footFrontAnkle = 0.10 * facing;
      frontLegOverBall = false;
    }

    footBackX = hipBaseX - 5 * facing;
    footBackY = plantY;
  }

  return {
    ballX, ballY,
    footFrontX, footFrontY, footFrontAnkle,
    footBackX, footBackY, footBackAnkle,
    hipShiftX, pelvisDip, torsoLean,
    frontLegOverBall, trickName
  };
}

let comboLeftTurnTime = 0;
let comboFlipWindowUntil = 0;
let lastAirFacing = 0;

export function createPlayerInstance(overrides = {}) {
  return {
    x: START_X - 60,
    y: 0,
    vx: 0,
    vy: 0,
    w: 24,
    h: 70,
    facing: 1,

    aimX: START_X + 160,
    aimY: 0,
    jetFuel: 100,
    jetMax: 100,

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

    currentClass: DEFAULT_CLASS,

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

    thighLen: 25,
    shinLen: 24,
    upperArmLen: 14,
    forearmLen: 13,

    stridePhase: 0,
    pelvisY: -11.8,
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
  p.currentClass = newClass;
  p.jetMax = newClass.stats.jetMax || 100;
  p.jetFuel = p.jetMax;
}

if (typeof window !== 'undefined') {
  window.setPlayerClass = setPlayerClass;
  window.CLASSES = CLASSES;
}

export function startJumpCharge(p = player) {
  if (p.isIntro || p.isJumping || p.isSliding) return;
  p.isJumpCharging = true;
  p.jumpChargePower = 0;
}

export function playerJump(p = player) {
  startJumpCharge(p);
}

export function executeReleaseJump(spawnGrass, p = player) {
  if (!p.isJumpCharging) return;
  p.isJumpCharging = false;
  if (p.isJumping || p.isSliding || p.isIntro) return;

  const baseJumpForce = p.currentClass?.stats?.jumpForce || CONFIG.JUMP_FORCE;
  const jumpImpulse = (baseJumpForce * 0.67) + (p.jumpChargePower * 4.2);
  p.vy = -jumpImpulse;
  p.isJumping = true;
  p.jumpPower = p.jumpChargePower;
  p.jumpChargePower = 0;

  p.airVx = p.vx;

  comboLeftTurnTime = 0;
  comboFlipWindowUntil = 0;
  lastAirFacing = p.facing;

  const grassFn = spawnGrass || p._spawnGrass;
  const currentFloor = p.currentGroundY || p.groundY;
  if (grassFn && currentFloor) {
    for (let i = 0; i < 4; i++) {
      grassFn(p.x + p.w / 2, currentFloor, p.facing);
    }
  }
}

export function playerSlide(spawnGrass, GROUND_Y, p = player) {
  const isMovingBackwards = (p.vx * p.facing < -0.1);
  if (isMovingBackwards) return;
  if (p.isIntro) return;

  const sprintMax = p.currentClass?.stats?.sprintMax || CONFIG.SPRINT_MAX;
  if (Math.abs(p.vx) < sprintMax * 0.78) return;

  if (!p.isJumping && !p.isSliding) {
    p.isSliding = true;
    p.slideTimer = 56;
    p.isCrouching = false;
    p.isJumpCharging = false;

    const curSpeed = Math.abs(p.vx);
    const isSprinting = curSpeed > 4.2;
    const slideDash = p.currentClass?.stats?.slideDashSpeed || CONFIG.SLIDE_DASH_SPEED;

    if (isSprinting) p.vx = p.facing * slideDash;
    else if (curSpeed > 2.0) p.vx = p.facing * (slideDash * 0.78);
    else p.vx = p.facing * (slideDash * 0.62);

    const currentFloor = p.currentGroundY || GROUND_Y;
    const grassFn = spawnGrass || p._spawnGrass;
    if (grassFn) {
      for (let i = 0; i < 8; i++) grassFn(p.x + p.w / 2 + (p.facing * 15), currentFloor, p.facing);
    }

    p.currentClass?.onSlide?.(p, grassFn);
  }
}

export function startKickCharge(p = player) {
  if (p.isSliding) return;
  if (p.kickState !== 'IDLE' || p.kickCooldown > 0) return;
  p.isCharging = true;
  p.chargePower = 0;
  p.kickPower = 0;
}

export function evaluateKickTiming(playerObj, ballObj) {
  const b = ballObj || playerObj._ball;
  if (!b) return 'CANCEL';

  const hipX = playerObj.x + playerObj.w / 2;
  const hipY = playerObj.y + playerObj.h - 40 + playerObj.pelvisY;

  const dx = b.x - hipX;
  const dy = b.y - hipY;
  const distNow = Math.hypot(dx, dy);

  const hitReach = playerObj.currentClass?.stats?.hitReach || 56;
  const whiffReach = playerObj.currentClass?.stats?.whiffReach || 88;

  if (distNow <= hitReach) return 'HIT';
  if (distNow <= whiffReach) return 'WHIFF';

  const relVx = (b.vx || 0) - playerObj.vx;
  const relVy = (b.vy || 0) - playerObj.vy;
  const vSq = relVx * relVx + relVy * relVy;

  if (vSq < 4.0) return 'CANCEL';

  const dot = dx * relVx + dy * relVy;
  if (dot >= 0) return 'CANCEL';

  const tImpact = -dot / vSq;
  const closestX = dx + relVx * tImpact;
  const closestY = dy + relVy * tImpact;
  const closestDist = Math.hypot(closestX, closestY);

  const willIntersect = closestDist <= (hitReach + 20);

  if (willIntersect) {
    if (tImpact <= 4.5) return 'HIT';
    if (tImpact <= 11.0) return 'WHIFF';
  }

  return 'CANCEL';
}

export function isBallInKickReach(playerObj, ballObj) {
  return evaluateKickTiming(playerObj, ballObj) !== 'CANCEL';
}

export function executeReleaseKick(ballParam, p = player) {
  if (!p.isCharging && !p.isIntro) return;
  if (p.kickState !== 'IDLE' || p.kickCooldown > 0) {
    p.isCharging = false;
    return;
  }

  const ball = ballParam || p._ball;
  const timing = evaluateKickTiming(p, ball);

  if (!p.isIntro && timing === 'CANCEL') {
    p.isCharging = false;
    p.chargePower = 0;
    p.kickPower = 0;
    return;
  }

  const hipY = p.y + p.h - 40;
  const isWaistHeight = ball && (ball.y >= hipY - 20 && ball.y <= hipY + 22);
  const isFullyCharged = p.chargePower >= 0.92;

  if (isWaistHeight && isFullyCharged && timing === 'HIT') {
    p.isCharging = false;
    p.kickPower = p.chargePower;
    p.kickMode = 'SPIN_VOLLEY';
    p.swingSpeed = 0.22;
    p.spinVolleyTimer = 0;
    p.spinVolleyDuration = 24;
    p.kickState = 'SWING';
    p.hitThisSwing = false;
    p.kickBufferTimer = 24;
    return;
  }

  p.isCharging = false;
  p.kickPower = p.chargePower;

  const currentFloor = p.currentGroundY || p.groundY;
  const isAirborne = p.isJumping || (currentFloor > 0 && p.y < currentFloor - p.h - 4);

  if (isAirborne && !p.isIntro) {
    const now = performance.now();
    const isComboActive = (now <= comboFlipWindowUntil);

    if (isComboActive) {
      p.kickMode = 'BACKFLIP';
      p.bicycleTimer = 0;
      p.bicycleDuration = 30;
      p.landingTurnTimer = 0;
      p.kickState = 'SWING';
      p.hitThisSwing = false;
      p.kickBufferTimer = 24;
      p.facing = -1;
      p.vy = Math.min(p.vy, -3.2);
      comboFlipWindowUntil = 0;
    } else {
      p.kickMode = 'SCISSOR';
      p.scissorTimer = 0;
      p.scissorDuration = 22;
      p.kickState = 'SWING';
      p.hitThisSwing = false;
      p.kickBufferTimer = 16;
    }
  } else {
    p.kickMode = 'GROUND';
    p.kickLeg = p.nextLeg;
    p.kickState = 'SWING';
    p.hitThisSwing = false;
    p.kickAngle = 0;
    p.kickBufferTimer = 12;

    const curSpeed = Math.abs(p.vx);
    const sprintMax = p.currentClass?.stats?.sprintMax || CONFIG.SPRINT_MAX;
    const speedRatio = Math.min(1.0, curSpeed / sprintMax);
    p.swingSpeed = (0.17 + p.chargePower * 0.12) * (1.0 + speedRatio * 0.95);
    p.kickRecoverSpeed = (0.14 + p.chargePower * 0.06) * (1.0 + speedRatio * 0.85);

    const hipX = p.x + p.w / 2;
    const plantLead = curSpeed > 1.0 ? (10 + speedRatio * 8) : 4;
    p.kickPlantWorldX = hipX + (plantLead * p.facing);

    p.nextLeg = (p.kickLeg === 'front') ? 'back' : 'front';
  }
}

export function solve2BoneIK(hx, hy, tx, ty, l1, l2, facing) {
  if (isNaN(tx) || isNaN(ty)) {
    tx = hx;
    ty = hy + l1 + l2 - 4;
  }
  let dx = tx - hx;
  let dy = ty - hy;
  let d = Math.hypot(dx, dy);

  if (isNaN(d) || d < 0.001) {
    dx = 0;
    dy = 1;
    d = 0.001;
  }

  const maxReach = l1 + l2;
  if (d >= maxReach * 0.998) {
    const ang = Math.atan2(dy, dx);
    const reach = Math.min(d, maxReach);
    return {
      kneeX: hx + l1 * Math.cos(ang),
      kneeY: hy + l1 * Math.sin(ang),
      footX: hx + reach * Math.cos(ang),
      footY: hy + reach * Math.sin(ang)
    };
  }
  const minReach = Math.abs(l1 - l2) + 2;
  if (d < minReach) {
    const ang = Math.atan2(dy, dx);
    tx = hx + Math.cos(ang) * minReach;
    ty = hy + Math.sin(ang) * minReach;
    d = minReach;
  }

  const baseAngle = Math.atan2(ty - hy, tx - hx);
  const cosAlpha = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
  const alpha = Math.acos(cosAlpha);

  const thighAngle = baseAngle - (facing * alpha);
  const kneeX = hx + l1 * Math.cos(thighAngle);
  const kneeY = hy + l1 * Math.sin(thighAngle);

  return { kneeX, kneeY, footX: tx, footY: ty };
}

export function getArmAnglesForTarget(tx, ty, upperLen, foreLen) {
  const ik = solve2BoneIK(0, 0, tx, ty, upperLen, foreLen, 1);
  const swing = Math.atan2(ik.kneeX, ik.kneeY);
  const fore = Math.atan2(tx - ik.kneeX, ty - ik.kneeY);
  const elbow = fore - swing;
  return { swing, elbow };
}

export function getAimArmAngles(targetXLocal, targetYLocal, aimAngle, upperLen, foreLen) {
  const cosA = Math.cos(aimAngle);
  const sinA = Math.sin(aimAngle);
  const tx = cosA * targetXLocal - sinA * targetYLocal;
  const ty = sinA * targetXLocal + cosA * targetYLocal;
  return getArmAnglesForTarget(tx, ty, upperLen, foreLen);
}

export function getSprintFootTrajectory(p) {
  const t = p / (Math.PI * 2);
  let lx, ly, ankle;
  const maxPushLift = 7.5;

  if (t < 0.32) {
    const u = t / 0.32;
    const eu = ease(u);
    lx = 20 - eu * 58;
    ankle = lerp(0.08, 0.54, eu);
    ly = -Math.sin(ankle) * maxPushLift;
  } else if (t < 0.58) {
    const u = (t - 0.32) / 0.26;
    const eu = ease(u);
    lx = -38 + eu * 22;
    const startY = -Math.sin(0.54) * maxPushLift;
    const peakY = -42;
    ly = lerp(startY, peakY, Math.sin(eu * Math.PI * 0.5));
    ankle = lerp(0.54, -0.12, eu);
  } else if (t < 0.82) {
    const u = (t - 0.58) / 0.24;
    const eu = ease(u);
    lx = -16 + eu * 54;
    ly = -42 + (eu * 24);
    ankle = lerp(-0.12, 0.10, eu);
  } else {
    const u = (t - 0.82) / 0.18;
    const eu = ease(u);
    lx = 38 - eu * 18;
    ly = -18 + eu * 18;
    ankle = lerp(0.10, 0.08, eu);
  }

  return { lx, ly, ankle };
}

export function getBiomechanicFootTrajectory(phase, mode, speed) {
  const p = ((phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

  if (mode === 'SPRINT') {
    return getSprintFootTrajectory(p);
  }

  let lx = 0, ly = 0, ankle = 0;

  if (mode === 'CROUCH_WALK') {
    let strideLen = 14;
    let ankleOffset = 0;
    if (player.isMovingBackwards) {
      strideLen = 14 * 0.7;
      ankleOffset = 0.2;
    }
    const stanceLimit = 0.55;
    const pr = p / (Math.PI * 2);

    if (pr < stanceLimit) {
      const u = pr / stanceLimit;
      lx = (0.5 - u) * (strideLen * 2);
      ly = -6.5;
      ankle = lerp(0.32, 0.60, ease(u)) + ankleOffset;
    } else {
      const u = (pr - stanceLimit) / (1.0 - stanceLimit);
      lx = (-0.5 + ease(u)) * (strideLen * 2);
      ly = -6.5 - Math.sin(u * Math.PI) * 7.5;
      ankle = lerp(0.60, 0.32, ease(u)) + ankleOffset;
    }
  } else if (mode === 'WALK') {
    const stanceRatio = 0.58;
    const stanceLimit = Math.PI * 2 * stanceRatio;
    const strideLen = 18.5;
    const stepHeight = 11.5;
    const toePinLiftMax = 5.8;

    if (p < stanceLimit) {
      const u = p / stanceLimit;
      lx = (0.5 - u) * (strideLen * 2);

      if (u < 0.18) {
        const hu = ease(u / 0.18);
        ankle = lerp(-0.12, 0.0, hu);
        ly = 0;
      } else if (u < 0.62) {
        ankle = 0.0;
        ly = 0;
      } else {
        const tu = ease((u - 0.62) / 0.38);
        ankle = lerp(0.0, 0.42, tu);
        ly = -Math.sin(ankle) * toePinLiftMax;
      }
    } else {
      const u = (p - stanceLimit) / (Math.PI * 2 - stanceLimit);
      const eu = ease(u);
      lx = (-0.5 + eu) * (strideLen * 2);

      const endLift = Math.sin(0.42) * toePinLiftMax;
      ly = -Math.sin(u * Math.PI) * stepHeight - endLift * (1.0 - u) * (1.0 - u);

      if (u < 0.25) {
        const su = ease(u / 0.25);
        ankle = lerp(0.42, -0.04, su);
      } else if (u < 0.75) {
        ankle = -0.04;
      } else {
        const prep = ease((u - 0.75) / 0.25);
        ankle = lerp(-0.04, -0.12, prep);
      }
    }
  } else if (mode === 'JOG') {
    const stanceRatio = 0.42;
    const stanceLimit = Math.PI * 2 * stanceRatio;
    const strideLen = 22 + ((speed - CONFIG.WALK_MAX) / (CONFIG.JOG_MAX - CONFIG.WALK_MAX)) * 4.5;
    const stepHeight = 15.5;
    const toePinLiftMax = 7.5;

    if (p < stanceLimit) {
      const u = p / stanceLimit;
      const eu = ease(u);
      lx = (0.5 - eu) * strideLen * 2;

      if (u < 0.18) {
        const hu = ease(u / 0.18);
        ankle = lerp(-0.14, 0.0, hu);
        ly = 0;
      } else if (u < 0.55) {
        ankle = 0.0;
        ly = 0;
      } else {
        const tu = ease((u - 0.55) / 0.45);
        ankle = lerp(0.0, 0.52, tu);
        ly = -Math.sin(ankle) * toePinLiftMax;
      }
    } else {
      const u = (p - stanceLimit) / (Math.PI * 2 - stanceLimit);
      const eu = ease(u);
      lx = (-0.5 + eu) * strideLen * 2;

      const endLift = Math.sin(0.52) * toePinLiftMax;
      ly = -Math.sin(u * Math.PI) * stepHeight - endLift * (1.0 - u) * (1.0 - u);

      if (u < 0.3) {
        const su = ease(u / 0.3);
        ankle = lerp(0.52, 0.10, su);
      } else if (u < 0.7) {
        const su = ease((u - 0.3) / 0.4);
        ankle = lerp(0.10, -0.05, su);
      } else {
        const su = ease((u - 0.7) / 0.3);
        ankle = lerp(-0.05, -0.14, su);
      }
    }
  }

  return { lx, ly, ankle };
}

function getGroundKickTrajectory(phase, angle, power, hipX, hipY, floorY, facing, speed, plantWorldX) {
  let kickFootX, kickFootY, kickAnkle;
  let supportFootX, supportFootY, supportAnkle;

  const speedRatio = Math.min(1.0, speed / CONFIG.SPRINT_MAX);
  const plantFloorY = floorY - 3.5;

  if (speed > 0.8 && plantWorldX) {
    supportFootX = plantWorldX;
    const hipPastPlant = (hipX - plantWorldX) * facing;

    if (hipPastPlant < 24) {
      supportFootY = plantFloorY;
      supportAnkle = 0.0;
    } else {
      const toeProgress = Math.min(1.0, (hipPastPlant - 24) / 18);
      const toePinLift = Math.sin(toeProgress * 0.45) * 6.0;
      supportFootY = plantFloorY - toePinLift;
      supportAnkle = (toeProgress * 0.45) * facing;
    }
  } else {
    supportFootX = hipX - 3.5 * facing;
    supportFootY = plantFloorY;
    supportAnkle = 0.0;
  }

  if (phase === 'CHARGE') {
    const p = ease(power);
    const reachBackX = -12 - p * 16;
    const pullUpY = 30 - p * 10;

    kickFootX = hipX + reachBackX * facing;
    kickFootY = hipY + pullUpY;
    kickAnkle = (Math.PI * 0.5) * facing;
  } else if (phase === 'SWING') {
    const u = Math.min(1.0, angle / 2.1);

    if (u < 0.28) {
      const w = ease(u / 0.28);
      const startX = -12 - power * 16;
      const startY = 30 - power * 10;
      const curX = lerp(startX, 8 + speedRatio * 8, w);
      const curY = lerp(startY, 34, w);

      kickFootX = hipX + curX * facing;
      kickFootY = hipY + curY;

      const initAnkle = Math.PI * 0.5;
      kickAnkle = lerp(initAnkle, 0.75, w) * facing;
    } else if (u < 0.68) {
      const w = ease((u - 0.28) / 0.40);
      const strikeX = 34 + speedRatio * 14 + power * 8;
      const strikeY = 38 - power * 8;
      const curX = lerp(8 + speedRatio * 8, strikeX, w);
      const curY = lerp(34, strikeY, w);

      kickFootX = hipX + curX * facing;
      kickFootY = hipY + curY;
      kickAnkle = lerp(0.75, 0.35, w) * facing;
    } else {
      const w = ease((u - 0.68) / 0.32);
      const strikeX = 34 + speedRatio * 14 + power * 8;
      const peakX = strikeX + 6 + speedRatio * 8;
      const peakY = lerp(38 - power * 8, 20 - power * 16, w);

      kickFootX = hipX + lerp(strikeX, peakX, w) * facing;
      kickFootY = hipY + peakY;
      kickAnkle = lerp(0.35, -0.20, w) * facing;
    }
  } else {
    const u = Math.max(0, Math.min(1.0, angle / 2.1));
    const w = ease(u);
    const strikeX = 34 + speedRatio * 14 + power * 8;
    const peakX = strikeX + 6 + speedRatio * 8;
    const peakY = 20 - power * 16;

    const targetLandingX = 14 + speedRatio * 8;
    const targetLandingY = plantFloorY - hipY;

    kickFootX = hipX + lerp(targetLandingX, peakX, w) * facing;
    kickFootY = hipY + lerp(targetLandingY, peakY, w);
    kickAnkle = lerp(0.05, 0.20, w) * facing;
  }

  return {
    kicking: { x: kickFootX, y: kickFootY, ankle: kickAnkle },
    support: { x: supportFootX, y: supportFootY, ankle: supportAnkle }
  };
}

function getScissorLegTargets(timer, duration, hipX, hipY, facing, power = 0) {
  const u = Math.min(1.0, timer / duration);
  const R = 41.5;

  const strikePeakAngle = 0.75 + (power * 0.90);
  const backCounterAngle = -0.55 - (power * 0.25);

  let angBack, angFront, ankleBack, ankleFront;

  if (u < 0.32) {
    const w = ease(u / 0.32);
    angBack = lerp(-0.30, 0.65, w);
    angFront = lerp(0.20, -0.55, w);
    ankleBack = lerp(-0.18, 0.35, w) * facing;
    ankleFront = lerp(0.22, -0.40, w) * facing;
  } else if (u < 0.75) {
    const w = ease((u - 0.32) / 0.43);
    angBack = lerp(0.65, backCounterAngle, w);
    angFront = lerp(-0.55, strikePeakAngle, w);
    ankleBack = lerp(0.35, -0.08, w) * facing;
    ankleFront = lerp(-0.40, 0.10, w) * facing;
  } else {
    const w = ease((u - 0.75) / 0.25);
    angBack = lerp(backCounterAngle, -0.20, w);
    angFront = lerp(strikePeakAngle, 0.25, w);
    ankleBack = lerp(-0.08, 0.0, w) * facing;
    ankleFront = lerp(0.10, 0.05, w) * facing;
  }

  const frontX = hipX + (R * Math.sin(angFront)) * facing;
  const frontY = hipY + (R * Math.cos(angFront));
  const backX = hipX + (R * Math.sin(angBack)) * facing;
  const backY = hipY + (R * Math.cos(angBack));

  return {
    front: { x: frontX, y: frontY, ankle: ankleFront },
    back: { x: backX, y: backY, ankle: ankleBack }
  };
}

function getBackflipTargets(timer, duration, hipX, hipY, facing) {
  const u = Math.min(1.0, timer / duration);
  const flipAngle = u * Math.PI * 2;

  let rKick, rGuide, kickAngOffset, guideAngOffset;

  if (u < 0.28) {
    const w = ease(u / 0.28);
    rKick = lerp(40, 20, w);
    rGuide = lerp(40, 18, w);
    kickAngOffset = 0.22;
    guideAngOffset = 0.42;
  } else if (u < 0.68) {
    const w = Math.sin(((u - 0.28) / 0.40) * Math.PI);
    rKick = lerp(20, 48, w);
    rGuide = 18;
    kickAngOffset = lerp(0.22, -0.65, w);
    guideAngOffset = 0.42;
  } else {
    const w = ease((u - 0.68) / 0.32);
    rKick = lerp(20, 42, w);
    rGuide = lerp(18, 42, w);
    kickAngOffset = lerp(0.22, 0.05, w);
    guideAngOffset = 0.42;
  }

  const totKick = flipAngle + kickAngOffset;
  const totGuide = flipAngle + guideAngOffset;

  const kx = hipX + (rKick * Math.sin(totKick)) * facing;
  const ky = hipY + (rKick * Math.cos(totKick));
  const gx = hipX + (rGuide * Math.sin(totGuide)) * facing;
  const gy = hipY + (rGuide * Math.cos(totGuide));

  return {
    rotation: flipAngle,
    kicking: { x: kx, y: ky, ankle: 0.35 * facing },
    guide: { x: gx, y: gy, ankle: -0.18 * facing }
  };
}

export function updatePlayer(keys, leftStick, GROUND_Y, ball, spawnGrass, p = player) {
  _updateCharacter(keys, leftStick, GROUND_Y, ball, spawnGrass, p);
}

function _updateCharacter(keys, leftStick, GROUND_Y, ball, spawnGrass, player) {
  // Obsługa stanu śmierci i respawnu (180 klatek = 3 sekundy)
  if (player.isDead) {
    player.respawnTimer--;
    player.vx = 0;
    player.vy += CONFIG.GRAVITY;
    player.y += player.vy;
    const currentFloor = player.currentGroundY || GROUND_Y;
    if (player.y >= currentFloor - player.h) {
      player.y = currentFloor - player.h;
      player.vy = 0;
    }
    if (player.respawnTimer <= 0) {
      player.isDead = false;
      player.hp = player.maxHp;
      if (player.isBot) {
        player.x = START_X + 600;
        player.y = GROUND_Y - player.h;
        player.facing = -1;
      } else {
        player.x = START_X - 60;
        player.y = GROUND_Y - player.h;
        player.facing = 1;
      }
      player.vx = 0;
      player.vy = 0;
      player.airVx = 0;
      player.isJumping = false;
      player.isSliding = false;
      player.isCharging = false;
      player.kickState = 'IDLE';
    }
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

  // Wygaszanie odrzutu (Kickback) w ciągu 3-4 klatek
  if (player.weaponKickback > 0.05) {
    player.weaponKickback *= 0.65;
  } else {
    player.weaponKickback = 0;
  }

  // Płynne przejście między STAN 1 a STAN 2 (Pose Blending ze współczynnikiem 0.25)
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
    if (keys.down) inputAxisY += 1;

    // Obsługa skoku przez wirtualny/sprzętowy klawisz keys.up
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

    // Obsługa wślizgu przez keys.slide
    if (keys.slide) {
      playerSlide(spawnGrass, GROUND_Y, player);
      keys.slide = false;
    }
  }

  if (leftStick && leftStick.active) {
    inputAxisX = leftStick.axisX;
    inputAxisY = leftStick.axisY;
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
  if ((keys && keys.down) || inputAxisY > 0.45) {
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

    // =========================================================================
    // WERSJA MOBILNA: Utrzymywanie celownika przed postacią w zapamiętanym zwrocie,
    // gdy prawy drążek nie jest aktywnie wychylany (zapobiega biegowi w tył)
    // =========================================================================
    if (isTouchDevice && !player.isBot && !player.isStickCharging) {
      player.aimX = (player.x + player.w / 2) + (player.facing * 160);
      player.aimY = player.y + player.h - 35;
    }

    if (!isLockedFacing) {
      let targetFacing = player.facing;

      if (isTouchDevice && !player.isBot) {
        // Na telefonie: zwrot zmienia się WYŁĄCZNIE gdy gracz ruszy prawym drążkiem (isStickCharging).
        // W przeciwnym razie pamięta ostatni zwrot (np. w prawo), nawet jeśli biegnie w lewo.
        if (player.isStickCharging && typeof player.aimX === 'number' && !isNaN(player.aimX)) {
          targetFacing = (player.aimX < player.x + player.w / 2) ? -1 : 1;
        } else {
          targetFacing = player.facing;
        }
      } else {
        // Na PC (mysz) lub dla bota AI: postać śledzi pozycję celownika
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

    player.isCrouching = (inputAxisY > 0.45 || keys.down) && !player.isSliding && !player.isJumping;

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
  if ((player.gaitMode === 'WALK' || player.gaitMode === 'IDLE') && ball && !player.isIntro && !player.isSliding && !player.isJumping && player.kickState === 'IDLE') {
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

      const kickTraj = getGroundKickTrajectory('SWING', player.kickAngle, player.kickPower, hipX, hipY, currentFloor, player.facing, speed, player.kickPlantWorldX);
      player.kickingFootX = kickTraj.kicking.x;
      player.kickingFootY = kickTraj.kicking.y;

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
    targetTilt = 0.18 * player.facing;
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

  if (player.kickMode === 'BACKFLIP') {
    player.torsoTilt = targetTilt;
    player.torsoTiltVel = 0;
  } else {
    const tiltForce = (targetTilt - player.torsoTilt) * 0.22;
    player.torsoTiltVel = (player.torsoTiltVel + tiltForce) * 0.76;
    player.torsoTilt += player.torsoTiltVel;
  }

  // STAN 2: Mikro-pochylenie torsu strzelca w stronę celu
  if (player.shootPoseWeight > 0) {
    player.torsoTilt += 0.04 * player.facing * player.shootPoseWeight;
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
    targetPelvisY = 16;
  } else if (player.gaitMode === 'IDLE') {
    targetPelvisY = -11.8;
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

  // Głowa i wzrok (śledzenie celu)
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

// =========================================================================
// SYSTEM GRAFICZNY: MODELOWANY SPORTOWIEC 2.5D
// =========================================================================
export function renderArm(ctx, shX, shY, swingAngle, elbowAngle, facing, upperCol, foreCol, isFront) {
  const upperLen = player.upperArmLen;
  const foreLen = player.forearmLen;

  const elbowX = shX + Math.sin(swingAngle) * upperLen * facing;
  const elbowY = shY + Math.cos(swingAngle) * upperLen;

  const forearmAngle = swingAngle + elbowAngle;
  const wristX = elbowX + Math.sin(forearmAngle) * foreLen * facing;
  const wristY = elbowY + Math.cos(forearmAngle) * foreLen;

  const armDir = Math.atan2(elbowY - shY, elbowX - shX);
  const foreDir = Math.atan2(wristY - elbowY, wristX - elbowX);

  ctx.save();
  ctx.translate(shX, shY);
  ctx.rotate(armDir);

  const sleeveLen = upperLen * 0.58;
  const sleeveHalfH = 3.9;

  const sleeveGrad = ctx.createLinearGradient(0, -sleeveHalfH, 0, sleeveHalfH);
  if (isFront) {
    sleeveGrad.addColorStop(0.0, '#ff6b6b');
    sleeveGrad.addColorStop(0.35, upperCol);
    sleeveGrad.addColorStop(1.0, '#991b1b');
  } else {
    sleeveGrad.addColorStop(0.0, '#dc2626');
    sleeveGrad.addColorStop(0.4, upperCol);
    sleeveGrad.addColorStop(1.0, '#5f1212');
  }

  ctx.beginPath();
  ctx.arc(0, 0, sleeveHalfH, 0, Math.PI * 2);
  ctx.fillStyle = sleeveGrad;
  ctx.fill();

  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-1.0, -sleeveHalfH, sleeveLen + 1.0, sleeveHalfH * 2, [0, 2, 2, 0]);
  } else {
    ctx.rect(-1.0, -sleeveHalfH, sleeveLen + 1.0, sleeveHalfH * 2);
  }
  ctx.fillStyle = sleeveGrad;
  ctx.fill();

  ctx.fillStyle = isFront ? 'rgba(255, 255, 255, 0.70)' : 'rgba(255, 255, 255, 0.35)';
  ctx.fillRect(sleeveLen - 1.6, -sleeveHalfH, 1.6, sleeveHalfH * 2);

  const armHalfH = 2.8;
  const bareLen = upperLen - sleeveLen + 1.2;

  const bicepGrad = ctx.createLinearGradient(0, -armHalfH, 0, armHalfH);
  if (isFront) {
    bicepGrad.addColorStop(0.0, '#fde68a');
    bicepGrad.addColorStop(0.35, foreCol);
    bicepGrad.addColorStop(1.0, '#b45309');
  } else {
    bicepGrad.addColorStop(0.0, '#f5b078');
    bicepGrad.addColorStop(0.4, foreCol);
    bicepGrad.addColorStop(1.0, '#78350f');
  }

  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(sleeveLen, -armHalfH, bareLen, armHalfH * 2, 2);
  } else {
    ctx.rect(sleeveLen, -armHalfH, bareLen, armHalfH * 2);
  }
  ctx.fillStyle = bicepGrad;
  ctx.fill();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(sleeveLen, -armHalfH, 2.2, armHalfH * 2);

  ctx.restore();

  ctx.save();
  ctx.translate(elbowX, elbowY);
  ctx.rotate(foreDir);

  const elbowR = 2.9;
  const wristR = 1.9;

  const jointGrad = ctx.createLinearGradient(0, -elbowR, 0, elbowR);
  jointGrad.addColorStop(0.0, isFront ? '#fde68a' : '#f5b078');
  jointGrad.addColorStop(0.5, foreCol);
  jointGrad.addColorStop(1.0, isFront ? '#b45309' : '#78350f');

  ctx.beginPath();
  ctx.arc(0, 0, elbowR, 0, Math.PI * 2);
  ctx.fillStyle = jointGrad;
  ctx.fill();

  const forearmGrad = ctx.createLinearGradient(0, -elbowR, 0, elbowR);
  if (isFront) {
    forearmGrad.addColorStop(0.0, '#fed7aa');
    forearmGrad.addColorStop(0.35, foreCol);
    forearmGrad.addColorStop(1.0, '#b45309');
  } else {
    forearmGrad.addColorStop(0.0, '#f5b078');
    forearmGrad.addColorStop(0.4, foreCol);
    forearmGrad.addColorStop(1.0, '#78350f');
  }

  ctx.beginPath();
  ctx.moveTo(0, -elbowR);
  ctx.lineTo(foreLen * 0.78, -wristR);
  ctx.lineTo(foreLen * 0.78, wristR);
  ctx.lineTo(0, elbowR);
  ctx.closePath();
  ctx.fillStyle = forearmGrad;
  ctx.fill();

  if (isFront) {
    const bandX = foreLen * 0.52;
    const bandW = 3.6;
    const bandGrad = ctx.createLinearGradient(0, -wristR - 0.4, 0, wristR + 0.4);
    bandGrad.addColorStop(0.0, '#ffffff');
    bandGrad.addColorStop(0.5, '#f1f5f9');
    bandGrad.addColorStop(1.0, '#94a3b8');

    ctx.fillStyle = bandGrad;
    ctx.fillRect(bandX, -wristR - 0.4, bandW, (wristR + 0.4) * 2);
  }

  const handX = foreLen + 0.5;
  const handR = isFront ? 2.8 : 2.4;

  const handGrad = ctx.createRadialGradient(handX, -0.6, 0.5, handX, 0, handR + 1.0);
  handGrad.addColorStop(0.0, isFront ? '#fed7aa' : '#f5b078');
  handGrad.addColorStop(0.7, foreCol);
  handGrad.addColorStop(1.0, isFront ? '#c05621' : '#78350f');

  ctx.beginPath();
  ctx.ellipse(handX, 0, handR * 1.15, handR * 0.85, 0, 0, Math.PI * 2);
  ctx.fillStyle = handGrad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(handX - 0.5, -handR * 0.55, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = isFront ? '#fcd34d' : foreCol;
  ctx.fill();

  ctx.restore();
}

export function renderIKLeg(ctx, hipX, hipY, targetFootX, targetFootY, l1, l2, ankleRot, facing, colorThigh, colorShin, colorBoot) {
  const ik = solve2BoneIK(hipX, hipY, targetFootX, targetFootY, l1, l2, facing);

  const thighAng = Math.atan2(ik.kneeY - hipY, ik.kneeX - hipX);
  const shinAng = Math.atan2(ik.footY - ik.kneeY, ik.footX - ik.kneeX);

  const isFrontLeg = (colorBoot === '#18181b' || colorBoot === (player.currentClass?.visuals?.bootColor || '#18181b'));

  ctx.save();

  // A. UDO I SPODENKI
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(thighAng);

  const shortsLen = l1 * 0.65;
  const shortsHalfH = 4.8;

  const shortsGrad = ctx.createLinearGradient(0, -shortsHalfH, 0, shortsHalfH);
  if (isFrontLeg) {
    shortsGrad.addColorStop(0.0, '#ffffff');
    shortsGrad.addColorStop(0.4, '#f8fafc');
    shortsGrad.addColorStop(1.0, '#cbd5e1');
  } else {
    shortsGrad.addColorStop(0.0, '#e2e8f0');
    shortsGrad.addColorStop(0.5, '#cbd5e1');
    shortsGrad.addColorStop(1.0, '#64748b');
  }

  ctx.beginPath();
  ctx.moveTo(0, -shortsHalfH);
  ctx.lineTo(shortsLen, -shortsHalfH + 0.8);
  ctx.lineTo(shortsLen, shortsHalfH - 0.8);
  ctx.lineTo(0, shortsHalfH);
  ctx.closePath();
  ctx.fillStyle = shortsGrad;
  ctx.fill();

  const stripeGrad = ctx.createLinearGradient(0, -shortsHalfH, 0, -shortsHalfH + 1.6);
  stripeGrad.addColorStop(0.0, isFrontLeg ? (player.currentClass?.visuals?.jerseyStripe || '#ef4444') : '#b91c1c');
  stripeGrad.addColorStop(1.0, isFrontLeg ? (player.currentClass?.visuals?.jerseyColor || '#dc2626') : '#991b1b');
  ctx.fillStyle = stripeGrad;
  ctx.fillRect(0, -shortsHalfH, shortsLen, 1.6);

  ctx.fillStyle = isFrontLeg ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(shortsLen - 1.8, -shortsHalfH + 0.8, 1.8, (shortsHalfH - 0.8) * 2);

  const quadHalfH = 3.6;
  const quadLen = l1 - shortsLen;

  const quadGrad = ctx.createLinearGradient(0, -quadHalfH, 0, quadHalfH);
  if (isFrontLeg) {
    quadGrad.addColorStop(0.0, '#fed7aa');
    quadGrad.addColorStop(0.35, '#f5b078');
    quadGrad.addColorStop(1.0, '#b45309');
  } else {
    quadGrad.addColorStop(0.0, '#f5b078');
    quadGrad.addColorStop(0.4, '#de935e');
    quadGrad.addColorStop(1.0, '#78350f');
  }

  ctx.beginPath();
  ctx.moveTo(shortsLen, -quadHalfH);
  ctx.quadraticCurveTo(shortsLen + quadLen * 0.45, -quadHalfH - 0.6, l1, -2.6);
  ctx.lineTo(l1, 2.6);
  ctx.quadraticCurveTo(shortsLen + quadLen * 0.45, quadHalfH, shortsLen, quadHalfH);
  ctx.closePath();
  ctx.fillStyle = quadGrad;
  ctx.fill();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.moveTo(shortsLen, -quadHalfH);
  ctx.lineTo(shortsLen + 2.4, -quadHalfH + 0.2);
  ctx.lineTo(shortsLen + 2.4, quadHalfH - 0.2);
  ctx.lineTo(shortsLen, quadHalfH);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // B. ŁYDKA I GETRA
  ctx.save();
  ctx.translate(ik.kneeX, ik.kneeY);
  ctx.rotate(shinAng);

  const kneeGrad = ctx.createLinearGradient(0, -3.2, 0, 3.2);
  kneeGrad.addColorStop(0.0, isFrontLeg ? '#ffffff' : '#e2e8f0');
  kneeGrad.addColorStop(0.5, isFrontLeg ? '#f1f5f9' : '#cbd5e1');
  kneeGrad.addColorStop(1.0, isFrontLeg ? '#94a3b8' : '#64748b');

  ctx.beginPath();
  ctx.arc(1.4, 0, 3.2, 0, Math.PI * 2);
  ctx.fillStyle = kneeGrad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(2.0, -0.6, 2.0, 0, Math.PI * 2);
  ctx.fillStyle = isFrontLeg ? '#fed7aa' : '#de935e';
  ctx.fill();

  const sockGrad = ctx.createLinearGradient(0, -4.8, 0, 4.4);
  if (isFrontLeg) {
    sockGrad.addColorStop(0.0, '#ff8a80');
    sockGrad.addColorStop(0.3, colorShin);
    sockGrad.addColorStop(1.0, '#7f1d1d');
  } else {
    sockGrad.addColorStop(0.0, '#e53935');
    sockGrad.addColorStop(0.4, colorShin);
    sockGrad.addColorStop(1.0, '#450a0a');
  }

  ctx.beginPath();
  ctx.moveTo(3.0, -3.6);
  ctx.quadraticCurveTo(l2 * 0.44, -5.2, l2 - 3.5, -2.6);
  ctx.lineTo(l2 - 3.5, 2.4);
  ctx.quadraticCurveTo(l2 * 0.40, 4.6, 3.0, 3.4);
  ctx.closePath();
  ctx.fillStyle = sockGrad;
  ctx.fill();

  if (isFrontLeg) {
    ctx.save();
    ctx.translate(l2 * 0.42, -4.1);
    ctx.rotate(-0.06);
    ctx.beginPath();
    ctx.ellipse(0, 0, l2 * 0.22, 1.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.60)';
    ctx.fill();
    ctx.restore();
  }

  const tapeGrad = ctx.createLinearGradient(0, -2.8, 0, 2.8);
  tapeGrad.addColorStop(0.0, '#ffffff');
  tapeGrad.addColorStop(0.5, '#f1f5f9');
  tapeGrad.addColorStop(1.0, isFrontLeg ? '#94a3b8' : '#64748b');

  ctx.fillStyle = tapeGrad;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(l2 - 4.5, -2.6, 4.0, 5.2, 1);
  } else {
    ctx.rect(l2 - 4.5, -2.6, 4.0, 5.2);
  }
  ctx.fill();

  ctx.restore();

  // C. BUT PIŁKARSKI
  const shinDx = (ik.footX - ik.kneeX) * facing;
  const shinDy = ik.footY - ik.kneeY;
  const localShinAng = Math.atan2(shinDy, shinDx);

  const isSpecialKick = (player.kickState === 'SWING' || player.isCharging || player.kickMode === 'BACKFLIP');

  let targetEffAnkle = ankleRot;
  let targetFlex = 0;

  if (isSpecialKick && Math.abs(ankleRot) > 1.1) {
    targetEffAnkle = ankleRot;
    targetFlex = 0;
  } else {
    const shinPerp = localShinAng - Math.PI / 2;
    const heelToBall = shinPerp + (ankleRot * facing * 0.28);
    targetEffAnkle = heelToBall * facing;

    if (heelToBall > 0.02) {
      const t = Math.min(1.0, (heelToBall - 0.02) / 0.85);
      targetFlex = (0.5 - 0.5 * Math.cos(t * Math.PI)) * 1.25;
    }
  }

  const pose = player.pose;
  const flexProp = isFrontLeg ? 'flexFront' : 'flexBack';
  const effProp = isFrontLeg ? 'effAnkleFront' : 'effAnkleBack';

  if (pose[flexProp] === undefined) pose[flexProp] = targetFlex;
  if (pose[effProp] === undefined) pose[effProp] = targetEffAnkle;

  let flexSmooth = 0.24;
  let ankleSmooth = 0.28;
  if (isSpecialKick || player.kickMode === 'BACKFLIP') {
    flexSmooth = 0.45;
    ankleSmooth = 0.55;
  }

  pose[flexProp] += (targetFlex - pose[flexProp]) * flexSmooth;
  pose[effProp] = lerpAngle(pose[effProp], targetEffAnkle, ankleSmooth);

  const effAnkle = pose[effProp];
  const flexAngle = Math.max(0, pose[flexProp]);

  ctx.save();
  ctx.translate(ik.footX, ik.footY);
  ctx.rotate(effAnkle);
  ctx.scale(facing, 1);

  const hingeX = 3.6;
  const hingeY = 2.6;
  const toeLen = 8.0;

  const cosF = Math.cos(-flexAngle);
  const sinF = Math.sin(-flexAngle);

  const toeTipX = hingeX + cosF * toeLen;
  const toeTipY = hingeY + sinF * toeLen;

  const toeNoseX = hingeX + cosF * (toeLen + 0.6) - sinF * 1.8;
  const toeNoseY = hingeY + sinF * (toeLen + 0.6) + cosF * 1.8 - 1.8;

  const creaseX = hingeX - 0.5;
  const creaseY = -1.6;

  ctx.fillStyle = isFrontLeg ? '#1e293b' : '#0f172a';
  ctx.beginPath();
  ctx.moveTo(-3.6, -1.8);
  ctx.lineTo(2.4, -2.0);
  ctx.lineTo(1.8, 0.8);
  ctx.lineTo(-3.8, 0.8);
  ctx.closePath();
  ctx.fill();

  const bootGrad = ctx.createLinearGradient(0, -2.8, 0, 3.0);
  if (isFrontLeg) {
    bootGrad.addColorStop(0.0, '#334155');
    bootGrad.addColorStop(0.45, colorBoot);
    bootGrad.addColorStop(1.0, '#09090b');
  } else {
    bootGrad.addColorStop(0.0, '#1f2937');
    bootGrad.addColorStop(1.0, '#030712');
  }

  ctx.beginPath();
  ctx.moveTo(-4.2, -1.4);
  ctx.quadraticCurveTo(-4.6, 0.6, -4.2, 2.8);
  ctx.lineTo(hingeX, 2.8);
  ctx.lineTo(toeTipX, toeTipY + 0.2);
  ctx.quadraticCurveTo(toeNoseX + 0.8, toeNoseY + 0.5, toeNoseX, toeNoseY - 0.4);
  ctx.lineTo(creaseX + cosF * 1.0, creaseY + sinF * 1.0);
  ctx.quadraticCurveTo(1.8, -1.8, -1.8, -1.8);
  ctx.quadraticCurveTo(-3.6, -1.8, -4.2, -1.4);
  ctx.closePath();
  ctx.fillStyle = bootGrad;
  ctx.fill();

  if (flexAngle > 0.08) {
    const foldAlpha = Math.min(1.0, (flexAngle - 0.08) / 0.25);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.20 * foldAlpha})`;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(creaseX - 0.5, creaseY + 0.4);
    ctx.lineTo(creaseX + 0.5, creaseY + 2.2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(0, 0, 0, ${0.45 * foldAlpha})`;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(creaseX + 0.5, creaseY + 0.5);
    ctx.lineTo(creaseX + 1.5, creaseY + 2.3);
    ctx.stroke();
  }

  ctx.strokeStyle = isFrontLeg ? (player.currentClass?.visuals?.bootAccent || '#38bdf8') : '#0284c7';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-1.2, -0.6);
  ctx.lineTo(hingeX - 0.5, -0.2);
  ctx.lineTo(hingeX + cosF * 4.5, -0.2 + sinF * 4.5);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-4.2, 2.6, hingeX + 4.2, 1.2);

  ctx.save();
  ctx.translate(hingeX, 2.6);
  ctx.rotate(-flexAngle);
  ctx.fillRect(0, 0, toeLen, 1.2);

  const studGrad = ctx.createLinearGradient(0, 1.2, 0, 2.6);
  studGrad.addColorStop(0.0, '#94a3b8');
  studGrad.addColorStop(1.0, '#cbd5e1');
  ctx.fillStyle = studGrad;
  ctx.fillRect(1.8, 1.2, 1.5, 1.3);
  ctx.fillRect(toeLen - 2.0, 1.2, 1.4, 1.3);
  ctx.restore();

  ctx.fillStyle = studGrad;
  ctx.fillRect(-2.4, 3.6, 1.6, 1.3);

  ctx.restore();
  ctx.restore();

  return ik;
}

export function drawFrontLegOnly(ctx, GROUND_Y, p = player) {
  const hipX = (p.x + p.w / 2) + p.lastHipShiftX;
  const hipY = p.y + p.h - 40 + p.pelvisY;

  const bootCol = p.currentClass?.visuals?.bootColor || '#18181b';
  const jerseyStripe = p.currentClass?.visuals?.jerseyStripe || '#e53935';

  renderIKLeg(
    ctx,
    hipX + (2 * p.facing),
    hipY,
    p.lastFootFrontX,
    p.lastFootFrontY,
    p.thighLen,
    p.shinLen,
    p.lastFootFrontAnkle,
    p.facing,
    jerseyStripe,
    jerseyStripe,
    bootCol
  );
}

export function drawPlayer(ctx, GROUND_Y, p = player) {
  _drawCharacter(ctx, GROUND_Y, p);
}

function _drawCharacter(ctx, GROUND_Y, player) {
  ctx.save();

  const centerX = player.x + player.w / 2;
  const standingY = (player.currentGroundY !== undefined && !player.isJumping) ? player.currentGroundY : (player.y + player.h);
  const floorY = standingY;
  const plantFloorY = floorY - 3.5;
  let hipX = centerX;
  const hipY = player.y + player.h - 40 + player.pelvisY;
  const speed = Math.abs(player.vx);

  const yaw = player.yaw || 0;
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);

  const currentFacingDir = cosYaw >= 0 ? 1 : -1;
  const isRightLimbForeground = cosYaw >= 0;
  const isLookingAway = sinYaw < -0.45;
  const isNearProfile = Math.abs(cosYaw) >= 0.28;

  let rawFootBackTargetX, rawFootBackTargetY, rawFootBackAnkle;
  let rawFootFrontTargetX, rawFootFrontTargetY, rawFootFrontAnkle;
  let rawFrontSwing = 0.05, rawFrontElbow = 0.32;
  let rawBackSwing = -0.03, rawBackElbow = 0.26;

  const isVisualCharging = (player.isCharging && speed < 0.8 && isBallInKickReach(player, player._ball));

  const isGroundKicking = !player.isIntro && !player.isSliding && !player.isJumping &&
    player.kickMode === 'GROUND' &&
    (isVisualCharging || player.kickState === 'SWING' || player.kickState === 'RECOVER');

  if (player.isIntro) {
    const choreo = getFreestyleChoreography(player.juggleTimer, hipX, hipY, floorY, player.facing, 8);
    hipX += choreo.hipShiftX;
    rawFootFrontTargetX = choreo.footFrontX;
    rawFootFrontTargetY = choreo.footFrontY;
    rawFootFrontAnkle = choreo.footFrontAnkle;
    rawFootBackTargetX = choreo.footBackX;
    rawFootBackTargetY = choreo.footBackY;
    rawFootBackAnkle = choreo.footBackAnkle;

    const armWave = Math.sin((player.juggleTimer / 22) * Math.PI);
    rawFrontSwing = 0.16 + armWave * 0.08;
    rawFrontElbow = 0.85;
    rawBackSwing = -0.14 - armWave * 0.08;
    rawBackElbow = 0.80;

    player.lastHipShiftX = choreo.hipShiftX;
    player.lastFootFrontX = rawFootFrontTargetX;
    player.lastFootFrontY = rawFootFrontTargetY;
    player.lastFootFrontAnkle = rawFootFrontAnkle;
  } else if (player.kickMode === 'BACKFLIP') {
    const flip = getBackflipTargets(player.bicycleTimer, player.bicycleDuration, hipX, hipY, player.facing);
    rawFootFrontTargetX = flip.kicking.x;
    rawFootFrontTargetY = flip.kicking.y;
    rawFootFrontAnkle = flip.kicking.ankle;

    rawFootBackTargetX = flip.guide.x;
    rawFootBackTargetY = flip.guide.y;
    rawFootBackAnkle = flip.guide.ankle;

    const uFlip = player.bicycleTimer / player.bicycleDuration;
    if (uFlip < 0.28) {
      rawFrontSwing = 0.90; rawFrontElbow = 0.50;
      rawBackSwing = 0.90; rawBackElbow = 0.50;
    } else if (uFlip < 0.68) {
      rawFrontSwing = -0.30; rawFrontElbow = 1.25;
      rawBackSwing = -0.30; rawBackElbow = 1.25;
    } else {
      rawFrontSwing = 0.40; rawFrontElbow = 0.65;
      rawBackSwing = -0.40; rawBackElbow = 0.65;
    }
  } else if (player.kickMode === 'BACKFLIP_LAND') {
    rawFootFrontTargetX = hipX + (6 * player.facing);
    rawFootFrontTargetY = plantFloorY;
    rawFootFrontAnkle = 0.10 * player.facing;

    rawFootBackTargetX = hipX - (6 * player.facing);
    rawFootBackTargetY = plantFloorY;
    rawFootBackAnkle = -0.10 * player.facing;

    rawFrontSwing = 0.35;
    rawFrontElbow = 0.85;
    rawBackSwing = -0.35;
    rawBackElbow = 0.85;
  } else if (player.kickMode === 'SCISSOR' && player.kickState === 'SWING') {
    const targets = getScissorLegTargets(player.scissorTimer, player.scissorDuration, hipX, hipY, player.facing, player.kickPower);
    rawFootFrontTargetX = targets.front.x;
    rawFootFrontTargetY = targets.front.y;
    rawFootFrontAnkle = targets.front.ankle;

    rawFootBackTargetX = targets.back.x;
    rawFootBackTargetY = targets.back.y;
    rawFootBackAnkle = targets.back.ankle;

    rawFrontSwing = -0.35;
    rawFrontElbow = 0.85;
    rawBackSwing = 0.45;
    rawBackElbow = 0.75;
  } else if (player.isJumpCharging && speed < 0.8) {
    rawFootFrontTargetX = hipX + (4 * player.facing);
    rawFootFrontTargetY = plantFloorY;
    rawFootFrontAnkle = 0.08 * player.facing;

    rawFootBackTargetX = hipX - (4 * player.facing);
    rawFootBackTargetY = plantFloorY;
    rawFootBackAnkle = -0.08 * player.facing;

    rawFrontSwing = -0.55 * player.jumpChargePower;
    rawFrontElbow = 0.85 + 0.35 * player.jumpChargePower;
    rawBackSwing = -0.65 * player.jumpChargePower;
    rawBackElbow = 0.85 + 0.35 * player.jumpChargePower;
  } else if (isGroundKicking) {
    const kickPhase = isVisualCharging ? 'CHARGE' : player.kickState;
    const kickPow = isVisualCharging ? player.chargePower : player.kickPower;
    const kickTraj = getGroundKickTrajectory(kickPhase, player.kickAngle, kickPow, hipX, hipY, floorY, player.facing, speed, player.kickPlantWorldX);

    const isFrontKicking = (player.kickLeg === 'front');

    if (isFrontKicking) {
      rawFootFrontTargetX = kickTraj.kicking.x;
      rawFootFrontTargetY = kickTraj.kicking.y;
      rawFootFrontAnkle = kickTraj.kicking.ankle;

      rawFootBackTargetX = kickTraj.support.x;
      rawFootBackTargetY = kickTraj.support.y;
      rawFootBackAnkle = kickTraj.support.ankle;
    } else {
      rawFootBackTargetX = kickTraj.kicking.x;
      rawFootBackTargetY = kickTraj.kicking.y;
      rawFootBackAnkle = kickTraj.kicking.ankle;

      rawFootFrontTargetX = kickTraj.support.x;
      rawFootFrontTargetY = kickTraj.support.y;
      rawFootFrontAnkle = kickTraj.support.ankle;
    }

    const kickArmSwing = speed > 1.2 ? -0.88 : -0.68;
    const suppArmSwing = speed > 1.2 ? 0.72 : 0.52;
    const kickArmElbow = speed > 1.2 ? 0.75 : 0.60;
    const suppArmElbow = speed > 1.2 ? 1.20 : 0.90;

    if (isFrontKicking) {
      rawFrontSwing = kickArmSwing;
      rawFrontElbow = kickArmElbow;
      rawBackSwing = suppArmSwing;
      rawBackElbow = suppArmElbow;
    } else {
      rawFrontSwing = suppArmSwing;
      rawFrontElbow = suppArmElbow;
      rawBackSwing = kickArmSwing;
      rawBackElbow = kickArmElbow;
    }
  } else if (player.isSliding) {
    const fullLegReach = (player.thighLen + player.shinLen);
    const verticalDrop = Math.max(0, plantFloorY - hipY);
    const straightReachX = Math.sqrt(Math.max(1, fullLegReach * fullLegReach - verticalDrop * verticalDrop));

    rawFootFrontTargetX = hipX + (straightReachX + 6.0) * player.facing;
    rawFootFrontTargetY = plantFloorY;
    rawFootFrontAnkle = 0.08 * player.facing;

    rawFootBackTargetX = hipX - (5.0 * player.facing);
    rawFootBackTargetY = hipY + 13.0;
    rawFootBackAnkle = -0.70 * player.facing;

    rawFrontSwing = 0.85;
    rawFrontElbow = 0.75;
    rawBackSwing = -0.90;
    rawBackElbow = 0.40;
  } else if (player.kickMode === 'SPIN_VOLLEY') {
    const u = player.spinVolleyTimer / player.spinVolleyDuration;
    rawFootFrontTargetX = hipX + Math.cos(u * Math.PI) * 36 * player.facing;
    rawFootFrontTargetY = hipY + 4;
    rawFootFrontAnkle = 0.55 * player.facing;

    rawFootBackTargetX = hipX - (6 * player.facing);
    rawFootBackTargetY = plantFloorY;
    rawFootBackAnkle = 0.05 * player.facing;

    rawFrontSwing = -0.60;
    rawFrontElbow = 0.85;
    rawBackSwing = 0.60;
    rawBackElbow = 0.85;
  } else if (player.isJumping) {
    const isRising = player.vy < 0;
    if (isRising) {
      rawFootFrontTargetX = hipX + (14 * player.facing);
      rawFootFrontTargetY = hipY + 22;
      rawFootFrontAnkle = 0.22 * player.facing;

      rawFootBackTargetX = hipX - (8 * player.facing);
      rawFootBackTargetY = hipY + 34;
      rawFootBackAnkle = -0.15 * player.facing;
    } else {
      rawFootFrontTargetX = hipX + (8 * player.facing);
      rawFootFrontTargetY = hipY + 38;
      rawFootFrontAnkle = 0.10 * player.facing;

      rawFootBackTargetX = hipX - (6 * player.facing);
      rawFootBackTargetY = hipY + 40;
      rawFootBackAnkle = 0.05 * player.facing;
    }

    rawFrontSwing = -0.35;
    rawFrontElbow = 0.75;
    rawBackSwing = 0.35;
    rawBackElbow = 0.65;
  } else if (player.gaitMode === 'CROUCH') {
    rawFootFrontTargetX = hipX + (6 * player.facing);
    rawFootFrontTargetY = plantFloorY - 6.5;
    rawFootFrontAnkle = 0.50 * player.facing;
    rawFootBackTargetX = hipX - (8 * player.facing);
    rawFootBackTargetY = plantFloorY - 7.0;
    rawFootBackAnkle = 0.60 * player.facing;

    rawFrontSwing = 0.12;
    rawFrontElbow = 0.55;
    rawBackSwing = -0.12;
    rawBackElbow = 0.55;
  } else if (player.gaitMode === 'IDLE') {
    rawFootFrontTargetX = hipX + (3 * player.facing);
    rawFootFrontTargetY = plantFloorY;
    rawFootFrontAnkle = 0;
    rawFootBackTargetX = hipX - (3 * player.facing);
    rawFootBackTargetY = plantFloorY;
    rawFootBackAnkle = 0;

    const breathe = Math.sin(performance.now() * 0.003) * 0.03;
    rawFrontSwing = 0.05 + breathe;
    rawFrontElbow = 0.35;
    rawBackSwing = -0.05 - breathe;
    rawBackElbow = 0.30;

    if (player.kneeJuggleWeight > 0) {
      const kw = player.kneeJuggleWeight;
      const snap = Math.max(0, Math.sin(performance.now() * 0.014)) * 3.5;
      const kneeFootX = hipX + (13 * player.facing);
      const kneeFootY = hipY + 8 - snap;
      const kneeAnkle = 0.35 * player.facing;

      rawFootFrontTargetX = rawFootFrontTargetX * (1 - kw) + kneeFootX * kw;
      rawFootFrontTargetY = rawFootFrontTargetY * (1 - kw) + kneeFootY * kw;
      rawFootFrontAnkle = rawFootFrontAnkle * (1 - kw) + kneeAnkle * kw;

      rawFrontSwing = -0.25;
      rawFrontElbow = 0.75;
      rawBackSwing = 0.25;
      rawBackElbow = 0.75;
    }
  } else {
    const legBackTraj = getBiomechanicFootTrajectory(player.stridePhase + Math.PI, player.gaitMode, speed);
    const legFrontTraj = getBiomechanicFootTrajectory(player.stridePhase, player.gaitMode, speed);

    rawFootBackTargetX = hipX + (legBackTraj.lx * player.facing);
    rawFootBackTargetY = plantFloorY + legBackTraj.ly;
    rawFootBackAnkle = legBackTraj.ankle * player.facing;

    rawFootFrontTargetX = hipX + (legFrontTraj.lx * player.facing);
    rawFootFrontTargetY = plantFloorY + legFrontTraj.ly;
    rawFootFrontAnkle = legFrontTraj.ankle * player.facing;

    const armPhase = Math.sin(player.stridePhase);

    if (player.gaitMode === 'CROUCH_WALK') {
      rawFrontSwing = -armPhase * 0.35;
      rawBackSwing = armPhase * 0.35;
      rawFrontElbow = 0.75;
      rawBackElbow = 0.75;
    } else if (player.gaitMode === 'WALK') {
      rawFrontSwing = -armPhase * 0.38;
      rawBackSwing = armPhase * 0.38;
      rawFrontElbow = 0.32 + Math.max(0, -armPhase) * 0.16;
      rawBackElbow = 0.32 + Math.max(0, armPhase) * 0.16;
    } else if (player.gaitMode === 'JOG') {
      rawFrontSwing = -armPhase * 0.75;
      rawBackSwing = armPhase * 0.75;
      rawFrontElbow = 1.05 + Math.max(0, -armPhase) * 0.22;
      rawBackElbow = 1.05 + Math.max(0, armPhase) * 0.22;
    } else if (player.gaitMode === 'SPRINT') {
      rawFrontSwing = -armPhase * 1.68 - 0.10;
      rawBackSwing = armPhase * 1.68 - 0.10;
      rawFrontElbow = 1.48 + Math.max(0, -armPhase) * 0.36 + Math.max(0, armPhase) * 0.15;
      rawBackElbow = 1.48 + Math.max(0, armPhase) * 0.36 + Math.max(0, -armPhase) * 0.15;
    }

    if (player.isJumpCharging) {
      rawFrontSwing -= player.jumpChargePower * 0.40;
      rawBackSwing -= player.jumpChargePower * 0.40;
      rawFrontElbow += player.jumpChargePower * 0.25;
      rawBackElbow += player.jumpChargePower * 0.25;
    }

    if (player.kneeJuggleWeight > 0) {
      const kw = player.kneeJuggleWeight;
      const snap = Math.max(0, Math.sin(performance.now() * 0.014)) * 3.5;
      const kneeFootX = hipX + (13 * player.facing);
      const kneeFootY = hipY + 8 - snap;
      const kneeAnkle = 0.35 * player.facing;

      rawFootFrontTargetX = rawFootFrontTargetX * (1 - kw) + kneeFootX * kw;
      rawFootFrontTargetY = rawFootFrontTargetY * (1 - kw) + kneeFootY * kw;
      rawFootFrontAnkle = rawFootFrontAnkle * (1 - kw) + kneeAnkle * kw;

      rawFrontSwing = -0.25;
      rawFrontElbow = 0.75;
      rawBackSwing = 0.25;
      rawBackElbow = 0.75;
    }

    // Ułożenie rąk przy trzymaniu broni (w dłoniach luźno gdy nie strzela, oparte o ramię gdy strzela)
    if (player.currentWeapon && !player.isDead) {
      const isShotgun = (player.currentWeapon.id === 'SHOTGUN');
      const barrelHandX = isShotgun ? 15 : 17;

      const hold = getWeaponHoldTransform(player);

      // Pozycja barku w układzie świata
      const shoulderWorldX = hipX + (20 * Math.sin(player.pose?.torsoTilt || player.torsoTilt || 0));
      const shoulderWorldY = hipY - (20 * Math.cos(player.pose?.torsoTilt || player.torsoTilt || 0));

      const cosA = Math.cos(hold.angle);
      const sinA = Math.sin(hold.angle);

      // Chwyty broni w układzie świata:
      // 1. Chwyt pistoletowy i spust (tylna ręka)
      const gripWorldX = hold.pivotX + (cosA * 4.0 - sinA * 2.0) * currentFacingDir;
      const gripWorldY = hold.pivotY + (sinA * 4.0 + cosA * 2.0);

      // 2. Łoże / czółenko broni (przednia ręka)
      const handWorldX = hold.pivotX + (cosA * barrelHandX - sinA * 0.5) * currentFacingDir;
      const handWorldY = hold.pivotY + (sinA * barrelHandX + cosA * 0.5);

      // Względne wektory dłoni względem barku postaci
      const backArmX = (gripWorldX - shoulderWorldX) * currentFacingDir;
      const backArmY = gripWorldY - shoulderWorldY;

      const frontArmX = (handWorldX - shoulderWorldX) * currentFacingDir;
      const frontArmY = handWorldY - shoulderWorldY;

      const armBack = getArmAnglesForTarget(backArmX, backArmY, player.upperArmLen, player.forearmLen);
      const armFront = getArmAnglesForTarget(frontArmX, frontArmY, player.upperArmLen, player.forearmLen);

      rawBackSwing = armBack.swing;
      rawBackElbow = armBack.elbow;
      rawFrontSwing = armFront.swing;
      rawFrontElbow = armFront.elbow;
    }
  }

  const p = player.pose;
  if (!p.initialized || Math.abs(rawFootFrontTargetX - p.footFrontX) > 150) {
    p.footFrontX = rawFootFrontTargetX;
    p.footFrontY = rawFootFrontTargetY;
    p.footFrontAnkle = rawFootFrontAnkle;
    p.footBackX = rawFootBackTargetX;
    p.footBackY = rawFootBackTargetY;
    p.footBackAnkle = rawFootBackAnkle;
    p.effAnkleFront = rawFootFrontAnkle;
    p.effAnkleBack = rawFootBackAnkle;
    p.flexFront = 0;
    p.flexBack = 0;
    p.armFrontSwing = rawFrontSwing;
    p.armFrontElbow = rawFrontElbow;
    p.armBackSwing = rawBackSwing;
    p.armBackElbow = rawBackElbow;
    p.torsoTilt = player.torsoTilt;
    p.shoulderTilt = 0;
    p.headPitch = player.headPitch;
    p.initialized = true;
  }

  let footBlend = 0.32;
  const wepWeight = (player.currentWeapon && typeof player.shootPoseWeight === 'number') ? player.shootPoseWeight : 0;
  let armBlend = (player.currentWeapon && !player.isDead) ? (wepWeight > 0.4 ? 0.75 : 0.42) : 0.24;
  if (player.kickMode === 'BACKFLIP') {
    footBlend = 0.85;
    armBlend = 0.65;
  } else if (player.kickMode === 'BACKFLIP_LAND') {
    footBlend = 0.60;
    armBlend = 0.45;
  } else if (player.isJumpCharging && speed < 0.8) {
    footBlend = 0.40;
    armBlend = 0.35;
  } else if (player.kickState === 'SWING') {
    footBlend = 0.65;
    armBlend = 0.45;
  } else if (player.isSliding || player.kickMode === 'SCISSOR') {
    footBlend = 0.50;
    armBlend = 0.35;
  } else if (player.kickMode === 'SPIN_VOLLEY') {
    footBlend = 0.75;
    armBlend = 0.45;
  }

  if (player.isSliding) {
    p.footFrontX = rawFootFrontTargetX;
    p.footFrontY = rawFootFrontTargetY;
    p.footFrontAnkle = rawFootFrontAnkle;
  } else {
    p.footFrontX += (rawFootFrontTargetX - p.footFrontX) * footBlend;
    p.footFrontY += (rawFootFrontTargetY - p.footFrontY) * footBlend;
    p.footFrontAnkle = lerpAngle(p.footFrontAnkle, rawFootFrontAnkle, footBlend);
  }

  p.footBackX += (rawFootBackTargetX - p.footBackX) * footBlend;
  p.footBackY += (rawFootBackTargetY - p.footBackY) * footBlend;
  p.footBackAnkle = lerpAngle(p.footBackAnkle, rawFootBackAnkle, footBlend);

  p.armFrontSwing += (rawFrontSwing - p.armFrontSwing) * armBlend;
  p.armFrontElbow += (rawFrontElbow - p.armFrontElbow) * armBlend;
  p.armBackSwing += (rawBackSwing - p.armBackSwing) * armBlend;
  p.armBackElbow += (rawBackElbow - p.armBackElbow) * armBlend;

  if (player.kickMode === 'BACKFLIP') {
    p.torsoTilt = player.torsoTilt;
  } else {
    p.torsoTilt += (player.torsoTilt - p.torsoTilt) * 0.24;
  }
  p.headPitch += (player.headPitch - p.headPitch) * 0.22;

  const shoulderCounterTilt = -Math.sin(player.stridePhase) * (speed > 0.8 ? 0.045 : 0.015) * currentFacingDir;
  p.shoulderTilt += (shoulderCounterTilt - p.shoulderTilt) * 0.20;

  const shoulderBaseX = hipX + (21 * Math.sin(p.torsoTilt));
  const shoulderBaseY = hipY - (21 * Math.cos(p.torsoTilt));

  const shOffsetHoriz = (cosYaw * 1.2) - (sinYaw * 4.8);
  const shRightX = shoulderBaseX + shOffsetHoriz;
  const shLeftX = shoulderBaseX - shOffsetHoriz;
  const shRightY = shoulderBaseY - (p.shoulderTilt * 5 * cosYaw);
  const shLeftY = shoulderBaseY + (p.shoulderTilt * 5 * cosYaw);

  const hipOffsetHoriz = (cosYaw * 2.0) - (sinYaw * 3.5);
  const hipRightX = hipX + hipOffsetHoriz;
  const hipLeftX = hipX - hipOffsetHoriz;

  const armColBack = player.currentClass?.visuals?.armColorBack || '#991b1b';
  const legThighBack = player.currentClass?.visuals?.legThighBack || '#991b1b';
  const legShinBack = player.currentClass?.visuals?.legShinBack || '#b91c1c';
  const bootBack = player.currentClass?.visuals?.bootBack || '#111827';

  if (isRightLimbForeground) {
    renderArm(ctx, shLeftX, shLeftY, p.armBackSwing, p.armBackElbow, currentFacingDir, armColBack, '#de935e', false);
    renderIKLeg(ctx, hipLeftX, hipY, p.footBackX, p.footBackY, player.thighLen, player.shinLen, p.footBackAnkle, currentFacingDir, legThighBack, legShinBack, bootBack);
  } else {
    renderArm(ctx, shRightX, shRightY, p.armFrontSwing, p.armFrontElbow, currentFacingDir, armColBack, '#de935e', false);
    renderIKLeg(ctx, hipRightX, hipY, p.footFrontX, p.footFrontY, player.thighLen, player.shinLen, p.footFrontAnkle, currentFacingDir, legThighBack, legShinBack, bootBack);
  }

  // Tors i biodra
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(p.torsoTilt);

  const absCos = Math.abs(cosYaw);
  const absSin = Math.abs(sinYaw);

  const waistHalfW = 4.6 + absSin * 1.2;
  const shoulderHalfW = 4.8 + absSin * 1.5;
  const waistY = 2.0;

  const pelvisShortsGrad = ctx.createLinearGradient(-waistHalfW, 0, waistHalfW, 0);
  pelvisShortsGrad.addColorStop(0.0, '#cbd5e1');
  pelvisShortsGrad.addColorStop(0.5, '#ffffff');
  pelvisShortsGrad.addColorStop(1.0, '#cbd5e1');

  ctx.beginPath();
  ctx.moveTo(-waistHalfW, 0);
  ctx.lineTo(waistHalfW, 0);
  ctx.lineTo(waistHalfW - 0.4, 4.2);
  ctx.lineTo(-waistHalfW + 0.4, 4.2);
  ctx.closePath();
  ctx.fillStyle = pelvisShortsGrad;
  ctx.fill();

  const jerseyGrad = ctx.createLinearGradient(-shoulderHalfW, 0, shoulderHalfW, 0);
  const v = player.currentClass?.visuals;
  if (isLookingAway) {
    jerseyGrad.addColorStop(0.0, v?.jerseyBack0 || '#7f1d1d');
    jerseyGrad.addColorStop(0.5, v?.jerseyBack1 || '#991b1b');
    jerseyGrad.addColorStop(1.0, v?.jerseyBack2 || '#5f1212');
  } else {
    jerseyGrad.addColorStop(0.0, v?.jerseyFront0 || '#991b1b');
    jerseyGrad.addColorStop(0.35, v?.jerseyFront1 || '#dc2626');
    jerseyGrad.addColorStop(0.75, v?.jerseyFront2 || '#ef4444');
    jerseyGrad.addColorStop(1.0, v?.jerseyFront3 || '#b91c1c');
  }

  ctx.beginPath();
  ctx.moveTo(-waistHalfW, waistY);
  ctx.lineTo(-shoulderHalfW, -24.8);
  ctx.lineTo(shoulderHalfW, -24.8);
  ctx.quadraticCurveTo(shoulderHalfW + 0.8, -14.0, waistHalfW, waistY);
  ctx.quadraticCurveTo(0, waistY + 0.8, -waistHalfW, waistY);
  ctx.closePath();
  ctx.fillStyle = jerseyGrad;
  ctx.fill();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.fillRect(-waistHalfW, waistY - 1.2, waistHalfW * 2, 1.6);

  const seamX = cosYaw * 2.2;
  ctx.fillStyle = v?.seamColor || '#7f1d1d';
  ctx.beginPath();
  ctx.moveTo(seamX - 0.8, waistY);
  ctx.lineTo(seamX - 1.4, -24.8);
  ctx.lineTo(seamX - 0.4, -24.8);
  ctx.lineTo(seamX + 0.2, waistY);
  ctx.closePath();
  ctx.fill();

  const classNum = v?.number || '10';
  if (isLookingAway) {
    const numScale = Math.max(0.4, absSin * 1.0);
    ctx.save();
    ctx.translate(-sinYaw * 1.5, -13.0);
    ctx.scale(numScale, 1.0);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.font = 'bold 8.0px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(classNum, 0, 0);
    ctx.restore();
  } else {
    const crestX = (cosYaw * 3.0) + (sinYaw * -3.2);
    ctx.fillStyle = v?.crestColor || '#fbc02d';
    ctx.beginPath();
    ctx.arc(crestX, -17.8, 1.4, 0, Math.PI * 2);
    ctx.fill();

    if (absCos > 0.45) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.font = 'bold 7.0px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(classNum, -0.5 * cosYaw, -13.0);
    }
  }

  const neckW = 2.8 * absCos + 3.8 * absSin;
  const neckGrad = ctx.createLinearGradient(-neckW, 0, neckW, 0);
  neckGrad.addColorStop(0.0, '#c26e38');
  neckGrad.addColorStop(0.45, '#f5b078');
  neckGrad.addColorStop(1.0, '#fed7aa');

  ctx.beginPath();
  ctx.moveTo(-neckW * 0.8, -24.8);
  ctx.lineTo(-neckW * 0.7, -29.2);
  ctx.lineTo(neckW * 0.7, -28.6);
  ctx.lineTo(neckW * 0.8, -24.8);
  ctx.closePath();
  ctx.fillStyle = neckGrad;
  ctx.fill();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.beginPath();
  ctx.moveTo(0.0, -28.8);
  ctx.lineTo(neckW * 0.7, -28.6);
  ctx.lineTo(neckW * 0.4, -26.5);
  ctx.closePath();
  ctx.fill();

  // Głowa
  ctx.save();
  ctx.translate(0.0, -30.5 + (player.headBob * 0.35));

  if (isNearProfile) {
    ctx.scale(currentFacingDir, 1);
    ctx.rotate(p.headPitch);

    const faceGrad = ctx.createLinearGradient(-5.0, 0, 7.0, 0);
    faceGrad.addColorStop(0.0, '#de935e');
    faceGrad.addColorStop(0.5, '#f5b078');
    faceGrad.addColorStop(1.0, '#fed7aa');

    ctx.beginPath();
    ctx.moveTo(-4.6, -6.6);
    ctx.lineTo(4.2, -6.6);
    ctx.lineTo(4.8, -4.2);
    ctx.lineTo(4.3, -3.3);
    ctx.lineTo(6.8, -1.0);
    ctx.lineTo(5.1, -0.4);
    ctx.lineTo(5.5, 0.6);
    ctx.lineTo(4.9, 1.4);
    ctx.lineTo(5.3, 2.3);
    ctx.lineTo(4.3, 4.8);
    ctx.lineTo(0.2, 4.4);
    ctx.lineTo(-4.6, 1.2);
    ctx.closePath();
    ctx.fillStyle = faceGrad;
    ctx.fill();

    ctx.fillStyle = '#de935e';
    ctx.beginPath();
    ctx.ellipse(-3.2, -0.8, 1.5, 2.0, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(-3.1, -0.8, 1.0, 0.4 * Math.PI, 1.7 * Math.PI, false);
    ctx.stroke();

    const hairGrad = ctx.createLinearGradient(-6.0, -12.0, 5.0, -5.0);
    hairGrad.addColorStop(0.0, '#1c0d06');
    hairGrad.addColorStop(0.6, '#2e160a');
    hairGrad.addColorStop(1.0, '#452210');

    ctx.beginPath();
    ctx.moveTo(-4.8, -4.8);
    ctx.lineTo(-6.0, -10.6);
    ctx.bezierCurveTo(-6.0, -11.6, -1.5, -12.8, 2.5, -12.2);
    ctx.quadraticCurveTo(6.0, -9.5, 5.2, -6.8);
    ctx.lineTo(3.6, -4.8);
    ctx.closePath();
    ctx.fillStyle = hairGrad;
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-5.2, -6.6);
    ctx.lineTo(4.4, -6.6);
    ctx.stroke();

    const eyeCenterX = 2.7;
    const eyeCenterY = -2.1;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(eyeCenterX, eyeCenterY, 1.5, 1.0, 0, 0, Math.PI * 2);
    ctx.fill();

    let lookX = 0.55;
    let lookY = 0.0;

    if (player.lastBallX !== undefined && player.lastBallY !== undefined) {
      const headWorldX = hipX + (28 * Math.sin(p.torsoTilt));
      const headWorldY = hipY - (28 * Math.cos(p.torsoTilt)) - 10;
      const dxLook = (player.lastBallX - headWorldX) * player.facing;
      const dyLook = player.lastBallY - headWorldY;

      const lookAngle = Math.atan2(dyLook, Math.max(6, dxLook));
      const relAngle = lookAngle - (p.torsoTilt * player.facing) - p.headPitch;
      lookX = Math.cos(relAngle) * 0.65;
      lookY = Math.sin(relAngle) * 0.45;
    }

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(eyeCenterX + lookX, eyeCenterY + lookY, 0.72, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeCenterX + lookX * 0.5 + 0.25, eyeCenterY + lookY * 0.5 - 0.25, 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#23120b';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(1.4, -3.3);
    ctx.lineTo(4.4, -3.5);
    ctx.stroke();

  } else if (isLookingAway) {
    ctx.rotate(p.headPitch * 0.5);
    const hairBackGrad = ctx.createLinearGradient(-4.8, -10.0, 4.8, 4.0);
    hairBackGrad.addColorStop(0.0, '#1c0d06');
    hairBackGrad.addColorStop(0.5, '#2e160a');
    hairBackGrad.addColorStop(1.0, '#3d1c0c');

    ctx.beginPath();
    ctx.ellipse(0, -1.0, 4.8, 5.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = hairBackGrad;
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -1.6, 4.8, Math.PI * 0.8, Math.PI * 0.2, true);
    ctx.stroke();

  } else {
    ctx.rotate(p.headPitch * 0.5);
    const faceFrontGrad = ctx.createLinearGradient(-4.8, -6.0, 4.8, 6.0);
    faceFrontGrad.addColorStop(0.0, '#de935e');
    faceFrontGrad.addColorStop(0.5, '#f5b078');
    faceFrontGrad.addColorStop(1.0, '#fed7aa');

    ctx.beginPath();
    ctx.ellipse(0, -0.6, 4.8, 5.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = faceFrontGrad;
    ctx.fill();

    ctx.fillStyle = '#2e160a';
    ctx.beginPath();
    ctx.arc(0, -2.5, 4.9, Math.PI * 0.85, Math.PI * 0.15, true);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4.7, -2.8);
    ctx.lineTo(4.7, -2.8);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-2.0, -1.5, 1.2, 0.8, 0, 0, Math.PI * 2);
    ctx.ellipse(2.0, -1.5, 1.2, 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-1.8, -1.5, 0.55, 0, Math.PI * 2);
    ctx.arc(2.2, -1.5, 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  ctx.restore();

  // Renderowanie trzymanej broni (AK-47 / Shotgun)
  drawHeldWeapon(ctx, player);

  // Bliższa kończyna (pierwszy plan)
  const armColFront = v?.armColorFront || '#e53935';
  const legThighFront = v?.legThighFront || '#dc2626';
  const legShinFront = v?.legShinFront || '#e53935';
  const bootFront = v?.bootColor || '#18181b';

  if (isRightLimbForeground) {
    renderIKLeg(ctx, hipRightX, hipY, p.footFrontX, p.footFrontY, player.thighLen, player.shinLen, p.footFrontAnkle, currentFacingDir, legThighFront, legShinFront, bootFront);
    renderArm(ctx, shRightX, shRightY, p.armFrontSwing, p.armFrontElbow, currentFacingDir, armColFront, '#f5b078', true);
  } else {
    renderIKLeg(ctx, hipLeftX, hipY, p.footBackX, p.footBackY, player.thighLen, player.shinLen, p.footBackAnkle, currentFacingDir, legThighFront, legShinFront, bootFront);
    renderArm(ctx, shLeftX, shLeftY, p.armBackSwing, p.armBackElbow, currentFacingDir, armColFront, '#f5b078', true);
  }

  player.currentClass?.onDrawOverlay?.(ctx, player);

  if (player.isDead) {
    ctx.save();
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText(`💀 RESPAWN ZA ${Math.ceil(player.respawnTimer / 60)}s`, player.x + player.w / 2, player.y - 14);
    ctx.restore();
  }

  ctx.restore();
}
