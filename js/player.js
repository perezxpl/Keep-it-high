import { CONFIG, START_X } from './config.js';

function ease(t) {
  return 0.5 - 0.5 * Math.cos(t * Math.PI);
}

function parabola(t) {
  return 4 * t * (1 - t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
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

  let ballX = sweetSpotX;
  let ballY = groundY - ballRadius;
  let footFrontX = sweetSpotX;
  let footFrontY = groundY;
  let footFrontAnkle = 0;
  let footBackX = hipBaseX - 5 * facing;
  let footBackY = groundY;
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
      footFrontY = groundY - 3;
      footFrontAnkle = 0.25 * u;
      torsoLean = 0.05 * u;
    } else if (loopTimer < 38) {
      const u = ease((loopTimer - 18) / 20);
      ballX = hipBaseX + (26 - u * 10) * facing;
      ballY = groundY - ballRadius;

      footFrontX = ballX + 2 * facing;
      footFrontY = groundY - 2;
      footFrontAnkle = 0.22;
      frontLegOverBall = true;
    } else {
      const u = (loopTimer - 38) / 22;
      const lift = parabola(u);
      ballX = sweetSpotX;
      ballY = (groundY - ballRadius) - (lift * 32);

      const footSnap = Math.sin(u * Math.PI);
      footFrontX = sweetSpotX;
      footFrontY = groundY - (footSnap * 15);
      footFrontAnkle = -0.35 * footSnap;
      pelvisDip = -footSnap * 1.5;
    }

    footBackX = hipBaseX - 5 * facing;
    footBackY = groundY;
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
      footFrontY = groundY - 2 - (kickSnap * 14);
      footFrontAnkle = 0.18 - (kickSnap * 0.38);

      footBackX = hipBaseX - 5 * facing;
      footBackY = groundY;
      footBackAnkle = 0;
    } else {
      hipShiftX = 2 * facing;
      pelvisDip = Math.sin(u * Math.PI) * 1.5;

      footFrontX = hipBaseX + 6 * facing;
      footFrontY = groundY;
      footFrontAnkle = 0;

      const kickSnap = Math.max(0, Math.sin(u * Math.PI * 1.8));
      footBackX = sweetSpotX - (2 * facing) + (kickSnap * 2 * facing);
      footBackY = groundY - 2 - (kickSnap * 14);
      footBackAnkle = 0.18 - (kickSnap * 0.38);
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
      footFrontY = groundY - (snap * 16);
      footFrontAnkle = -0.25;
      frontLegOverBall = false;
    } else if (u < 0.45) {
      const upU = (u - 0.20) / 0.25;
      footFrontX = sweetSpotX - (2 * facing);
      footFrontY = (groundY - 16) - upU * (groundY - ballY);
      footFrontAnkle = -0.15;
      frontLegOverBall = false;
    } else if (u < 0.72) {
      const downU = (u - 0.45) / 0.27;
      footFrontX = sweetSpotX + (1 * facing);
      footFrontY = (ballY - 16) + downU * 36;
      footFrontAnkle = 0.35 * downU;
      frontLegOverBall = true;
      pelvisDip = -Math.sin(downU * Math.PI) * 2;
    } else {
      const landU = (u - 0.72) / 0.28;
      footFrontX = sweetSpotX;
      footFrontY = groundY - 3 - ((1 - landU) * 6);
      footFrontAnkle = 0.15;
      frontLegOverBall = false;
    }

    footBackX = hipBaseX - 5 * facing;
    footBackY = groundY;
  }

  return {
    ballX, ballY,
    footFrontX, footFrontY, footFrontAnkle,
    footBackX, footBackY, footBackAnkle,
    hipShiftX, pelvisDip, torsoLean,
    frontLegOverBall, trickName
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') {
      executeReleaseJump();
    }
  });
  window.addEventListener('touchend', (e) => {
    let rightSideActive = false;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].clientX >= window.innerWidth / 2) rightSideActive = true;
    }
    if (!rightSideActive && player.isJumpCharging) {
      executeReleaseJump();
    }
  }, { passive: true });
  window.addEventListener('touchcancel', () => {
    if (player.isJumpCharging) executeReleaseJump();
  }, { passive: true });
  window.addEventListener('mouseup', () => {
    if (player.isJumpCharging) executeReleaseJump();
  });
}

let comboLeftTurnTime = 0;
let comboFlipWindowUntil = 0;
let lastAirFacing = 0;
let wasKeyUp = false;

export const player = {
  x: START_X - 60,
  y: 0,
  vx: 0,
  vy: 0,
  w: 24,
  h: 70,
  facing: 1,

  isIntro: true,
  juggleTimer: 0,
  intendedVx: 0,
  groundY: 0,

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
  pelvisY: -6.5,
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

  kickLeg: 'front',
  nextLeg: 'front',
  kickState: 'IDLE',
  kickAngle: 0,
  swingSpeed: 0,
  hitThisSwing: false,
  chargePower: 0,
  isCharging: false,
  kickBufferTimer: 0,

  headPitch: 0,

  pose: {
    initialized: false,
    footFrontX: 0,
    footFrontY: 0,
    footFrontAnkle: 0,
    footBackX: 0,
    footBackY: 0,
    footBackAnkle: 0,
    armFrontSwing: 0,
    armFrontElbow: 0.35,
    armBackSwing: 0,
    armBackElbow: 0.28,
    torsoTilt: 0,
    torsoYaw: 0,
    shoulderTilt: 0,
    headPitch: 0
  }
};

export function startJumpCharge() {
  if (player.isIntro || player.isJumping || player.isSliding) return;
  player.isJumpCharging = true;
  player.jumpChargePower = 0;
}

export function playerJump() {
  startJumpCharge();
}

export function executeReleaseJump(spawnGrass) {
  if (!player.isJumpCharging) return;
  player.isJumpCharging = false;
  if (player.isJumping || player.isSliding || player.isIntro) return;

  const jumpImpulse = 6.6 + (player.jumpChargePower * 3.8);
  player.vy = -jumpImpulse;
  player.isJumping = true;
  player.jumpPower = player.jumpChargePower;
  player.jumpChargePower = 0;

  player.airVx = player.vx;

  comboLeftTurnTime = 0;
  comboFlipWindowUntil = 0;
  lastAirFacing = player.facing;

  if (spawnGrass && player.groundY) {
    for (let i = 0; i < 4; i++) {
      spawnGrass(player.x + player.w / 2, player.groundY, player.facing);
    }
  }
}

export function playerSlide(spawnGrass, GROUND_Y) {
  if (player.isIntro) return;
  if (!player.isJumping && !player.isSliding) {
    player.isSliding = true;
    player.slideTimer = 44;
    player.isCrouching = false;
    player.isJumpCharging = false;

    const curSpeed = Math.abs(player.vx);
    const isSprinting = curSpeed > 4.2;

    if (isSprinting) player.vx = player.facing * CONFIG.SLIDE_DASH_SPEED;
    else if (curSpeed > 1.2) player.vx = player.facing * 6.2;
    else player.vx = player.facing * 4.6;

    if (spawnGrass) {
      for (let i = 0; i < 8; i++) spawnGrass(player.x + player.w / 2 + (player.facing * 15), GROUND_Y, player.facing);
    }
  }
}

export function startKickCharge() {
  if (player.isSliding) return;
  if (player.kickState !== 'IDLE' || player.kickCooldown > 0) return;
  player.isCharging = true;
  player.chargePower = 0;
  player.kickPower = 0;
}

export function executeReleaseKick() {
  if (!player.isCharging && !player.isIntro) return;
  if (player.kickState !== 'IDLE' || player.kickCooldown > 0) {
    player.isCharging = false;
    return;
  }
  player.isCharging = false;
  player.kickPower = player.chargePower;

  const isAirborne = player.isJumping || (player.groundY > 0 && player.y < player.groundY - player.h - 4);

  if (isAirborne && !player.isIntro) {
    const now = performance.now();
    const isComboActive = (now <= comboFlipWindowUntil);

    if (isComboActive) {
      player.kickMode = 'BACKFLIP';
      player.bicycleTimer = 0;
      player.bicycleDuration = 30;
      player.landingTurnTimer = 0;
      player.kickState = 'SWING';
      player.hitThisSwing = false;
      player.kickBufferTimer = 24;
      player.facing = -1;
      player.vy = Math.min(player.vy, -3.2);
      comboFlipWindowUntil = 0;
    } else {
      player.kickMode = 'SCISSOR';
      player.scissorTimer = 0;
      player.scissorDuration = 22;
      player.kickState = 'SWING';
      player.hitThisSwing = false;
      player.kickBufferTimer = 16;
    }
  } else {
    player.kickMode = 'GROUND';
    player.kickLeg = player.nextLeg;
    player.kickState = 'SWING';
    player.hitThisSwing = false;
    player.kickAngle = 0;
    player.kickBufferTimer = 12;

    const curSpeed = Math.abs(player.vx);
    const speedRatio = Math.min(1.0, curSpeed / CONFIG.SPRINT_MAX);
    player.swingSpeed = (0.17 + player.chargePower * 0.10) * (1.0 + speedRatio * 0.95);
    player.kickRecoverSpeed = (0.14 + player.chargePower * 0.05) * (1.0 + speedRatio * 0.85);

    const hipX = player.x + player.w / 2;
    const plantLead = curSpeed > 1.0 ? (10 + speedRatio * 8) : 4;
    player.kickPlantWorldX = hipX + (plantLead * player.facing);

    player.nextLeg = (player.kickLeg === 'front') ? 'back' : 'front';
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

  const maxReach = (l1 + l2) * 0.96;
  if (d > maxReach) {
    const ang = Math.atan2(dy, dx);
    tx = hx + Math.cos(ang) * maxReach;
    ty = hy + Math.sin(ang) * maxReach;
    d = maxReach;
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

export function getSprintFootTrajectory(p) {
  const t = p / (Math.PI * 2);
  let lx, ly, ankle;

  if (t < 0.32) {
    const eu = ease(t / 0.32);
    lx = 22 - eu * 64;
    ly = eu > 0.75 ? -Math.sin((eu - 0.75) / 0.25 * Math.PI * 0.5) * 5 : 0;
    ankle = 0.25 + (eu * 0.58);
  } else if (t < 0.58) {
    const eu = ease((t - 0.32) / 0.26);
    lx = -42 + eu * 24;
    ly = -Math.sin(eu * Math.PI * 0.5) * 42;
    ankle = 0.45 - (eu * 0.50);
  } else if (t < 0.82) {
    const eu = ease((t - 0.58) / 0.24);
    lx = -18 + eu * 60;
    ly = -42 + (eu * 24);
    ankle = -0.18 + (eu * 0.38);
  } else {
    const eu = ease((t - 0.82) / 0.18);
    lx = 42 - eu * 20;
    ly = -18 + eu * 18;
    ankle = 0.20 + (eu * 0.05);
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
    const strideLen = 14;
    const pr = p / (Math.PI * 2);
    lx = Math.cos(p) * strideLen;
    ly = pr < 0.5 ? 0 : -Math.sin((pr - 0.5) * Math.PI * 2) * 5;
    ankle = 0.1;
  } else if (mode === 'WALK') {
    const stanceRatio = 0.60;
    const stanceLimit = Math.PI * 2 * stanceRatio;
    const strideLen = 18;
    const stepHeight = 7.5;

    if (p < stanceLimit) {
      const u = p / stanceLimit;
      lx = (0.5 - u) * (strideLen * 2);

      if (u < 0.18) {
        const hu = u / 0.18;
        ly = 0;
        ankle = -0.32 * (1.0 - hu);
      } else if (u < 0.65) {
        ly = 0;
        ankle = 0;
      } else {
        const tu = (u - 0.65) / 0.35;
        ly = -Math.sin(tu * Math.PI * 0.5) * 3.2;
        ankle = 0.52 * tu;
      }
    } else {
      const u = (p - stanceLimit) / (Math.PI * 2 - stanceLimit);
      const eu = ease(u);
      lx = (-0.5 + eu) * (strideLen * 2);
      ly = -Math.sin(u * Math.PI) * stepHeight;

      if (u < 0.30) {
        ankle = 0.52 * (1.0 - u / 0.30);
      } else if (u < 0.70) {
        ankle = 0.05;
      } else {
        const prep = (u - 0.70) / 0.30;
        ankle = -0.32 * prep;
      }
    }
  } else if (mode === 'JOG') {
    const stanceRatio = 0.36;
    const stanceLimit = Math.PI * 2 * stanceRatio;
    const strideLen = 21 + ((speed - CONFIG.WALK_MAX) / (CONFIG.JOG_MAX - CONFIG.WALK_MAX)) * 4.5;
    const stepHeight = 16.5;

    if (p < stanceLimit) {
      const u = p / stanceLimit;
      const eu = ease(u);
      lx = (0.5 - eu) * strideLen * 2;
      ly = Math.sin(u * Math.PI) * 2.2;
      if (u < 0.25) ankle = -0.22 * (1 - u / 0.25);
      else ankle = 0.70 * ((u - 0.25) / 0.75);
    } else {
      const u = (p - stanceLimit) / (Math.PI * 2 - stanceLimit);
      const eu = ease(u);
      lx = (-0.5 + eu) * strideLen * 2;
      ly = -Math.sin(u * Math.PI) * stepHeight;
      ankle = 0.40 * Math.sin(u * Math.PI);
    }
  }

  return { lx, ly, ankle };
}

function getGroundKickTrajectory(phase, angle, power, hipX, hipY, floorY, facing, speed, plantWorldX) {
  let kickFootX, kickFootY, kickAnkle;
  let supportFootX, supportFootY, supportAnkle;

  const speedRatio = Math.min(1.0, speed / CONFIG.SPRINT_MAX);

  if (speed > 0.8 && plantWorldX) {
    supportFootX = plantWorldX;
    const hipPastPlant = (hipX - plantWorldX) * facing;

    if (hipPastPlant < 24) {
      supportFootY = floorY;
      supportAnkle = 0.04 * facing;
    } else {
      const toeProgress = Math.min(1.0, (hipPastPlant - 24) / 18);
      supportFootY = floorY - toeProgress * 4.5;
      supportAnkle = (0.04 + toeProgress * 0.55) * facing;
    }
  } else {
    supportFootX = hipX - 3.5 * facing;
    supportFootY = floorY;
    supportAnkle = 0.04 * facing;
  }

  if (phase === 'CHARGE') {
    const p = ease(power);
    const reachBackX = -10 - p * 14;
    const pullUpY = 32 - p * 12;

    kickFootX = hipX + reachBackX * facing;
    kickFootY = hipY + pullUpY;
    kickAnkle = (0.28 + p * 0.28) * facing;
  } else if (phase === 'SWING') {
    const u = Math.min(1.0, angle / 2.1);

    if (u < 0.30) {
      const w = ease(u / 0.30);
      const startX = -10 - power * 14;
      const startY = 32 - power * 12;
      const curX = lerp(startX, 8 + speedRatio * 8, w);
      const curY = lerp(startY, 34, w);

      kickFootX = hipX + curX * facing;
      kickFootY = hipY + curY;
      kickAnkle = 0.48 * facing;
    } else if (u < 0.68) {
      const w = ease((u - 0.30) / 0.38);
      const strikeX = 34 + speedRatio * 14 + power * 8;
      const strikeY = 38 - power * 8;
      const curX = lerp(8 + speedRatio * 8, strikeX, w);
      const curY = lerp(34, strikeY, w);

      kickFootX = hipX + curX * facing;
      kickFootY = hipY + curY;
      kickAnkle = (0.48 - w * 0.25) * facing;
    } else {
      const w = ease((u - 0.68) / 0.32);
      const strikeX = 34 + speedRatio * 14 + power * 8;
      const peakX = strikeX + 6 + speedRatio * 8;
      const peakY = lerp(38 - power * 8, 20 - power * 16, w);

      kickFootX = hipX + lerp(strikeX, peakX, w) * facing;
      kickFootY = hipY + peakY;
      kickAnkle = 0.18 * facing;
    }
  } else {
    const u = Math.max(0, Math.min(1.0, angle / 2.1));
    const w = ease(u);
    const strikeX = 34 + speedRatio * 14 + power * 8;
    const peakX = strikeX + 6 + speedRatio * 8;
    const peakY = 20 - power * 16;

    const targetLandingX = 14 + speedRatio * 8;
    const targetLandingY = floorY - hipY;

    kickFootX = hipX + lerp(targetLandingX, peakX, w) * facing;
    kickFootY = hipY + lerp(targetLandingY, peakY, w);
    kickAnkle = (0.05 + w * 0.15) * facing;
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
    const w = u / 0.32;
    angBack = -0.30 + w * 0.95;
    angFront = 0.20 - w * 0.75;
    ankleBack = -0.15 * facing;
    ankleFront = 0.20 * facing;
  } else if (u < 0.75) {
    const w = (u - 0.32) / 0.43;
    angBack = 0.65 - w * (0.65 - backCounterAngle);
    angFront = -0.55 + w * (strikePeakAngle - (-0.55));
    ankleBack = 0.30 * facing;
    ankleFront = -0.35 * facing;
  } else {
    const w = (u - 0.75) / 0.25;
    angBack = backCounterAngle + w * (-0.20 - backCounterAngle);
    angFront = strikePeakAngle - w * (strikePeakAngle - 0.25);
    ankleBack = -0.05 * facing;
    ankleFront = 0.05 * facing;
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
    guide: { x: gx, y: gy, ankle: -0.15 * facing }
  };
}

export function updatePlayer(keys, leftStick, GROUND_Y, ball, spawnGrass) {
  player.groundY = GROUND_Y;

  if (player.kickBufferTimer > 0) player.kickBufferTimer--;
  if (player.kickCooldown > 0) player.kickCooldown--;

  if (player.isCharging) {
    player.chargePower = Math.min(1.0, player.chargePower + 0.035);
  }

  if (player.isJumpCharging) {
    player.jumpChargePower = Math.min(1.0, player.jumpChargePower + 0.038);
  }

  if (wasKeyUp && !keys.up && player.isJumpCharging) {
    executeReleaseJump(spawnGrass);
  }
  wasKeyUp = keys.up;

  let inputAxisX = 0;
  let inputAxisY = 0;

  if (keys.right) inputAxisX += 1;
  if (keys.left) inputAxisX -= 1;
  if (keys.down) inputAxisY += 1;
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

  let targetTopSpeed;
  if (keys.down || inputAxisY > 0.45) {
    targetTopSpeed = CONFIG.CROUCH_SPEED;
  } else {
    const isSprint = Math.abs(inputAxisX) > 0.75;
    if (isSprint) targetTopSpeed = CONFIG.SPRINT_MAX;
    else if (Math.abs(inputAxisX) > 0.45) targetTopSpeed = CONFIG.JOG_MAX;
    else targetTopSpeed = CONFIG.WALK_MAX;
  }

  const curSpeedPre = Math.abs(player.vx);
  if (player.isJumpCharging && curSpeedPre < 0.8) {
    targetTopSpeed *= (1.0 - player.jumpChargePower * 0.55);
  }
  player.intendedVx = Math.abs(inputAxisX) > 0.05 ? inputAxisX * targetTopSpeed : 0;

  if (player.isIntro) {
    if (inputAxisX > 0.35) {
      executeReleaseKick();
    }

    inputAxisX = 0;
    inputAxisY = 0;
    player.vx = 0;
    player.isCrouching = false;
    player.isSliding = false;
    player.isJumping = false;
    player.juggleTimer += 1;

    const hipX = player.x + player.w / 2;
    const hipY = player.y + player.h - 40;
    const choreo = getFreestyleChoreography(player.juggleTimer, hipX, hipY, GROUND_Y, player.facing, ball ? ball.radius : 12);
    player.gaitMode = choreo.trickName;
    player.frontLegOverBall = choreo.frontLegOverBall;
  } else {
    player.frontLegOverBall = false;

    const isLockedFacing = (player.kickMode === 'BACKFLIP' || player.kickMode === 'BACKFLIP_LAND');
    if (!isLockedFacing) {
      if (inputAxisX > 0.1 && !player.isSliding) player.facing = 1;
      else if (inputAxisX < -0.1 && !player.isSliding) player.facing = -1;
    }

    player.isCrouching = (inputAxisY > 0.45 || keys.down) && !player.isSliding && !player.isJumping;

    if (player.isSliding) {
      player.vx *= CONFIG.SLIDE_DECEL;
      player.slideTimer--;
      if (Math.abs(player.vx) > 1.8 && Math.random() < 0.85 && spawnGrass) {
        spawnGrass(player.x + (player.w / 2) + (player.facing * 20), GROUND_Y, player.facing);
      }
      if (player.slideTimer <= 0 || Math.abs(player.vx) < 0.4) {
        player.isSliding = false;
      }
    } else if (player.isJumping) {
      player.vx = player.airVx;
      player.airVx *= 0.995;
    } else {
      const targetVx = inputAxisX * targetTopSpeed;
      if (Math.abs(inputAxisX) > 0.05) {
        player.vx += (targetVx - player.vx) * CONFIG.ACCEL;
      } else {
        player.vx *= CONFIG.DECEL;
      }
    }

    if (Math.abs(player.vx) < 0.02) player.vx = 0;
    player.x += player.vx;

    const speed = Math.abs(player.vx);

    if (player.isSliding) player.gaitMode = 'SLIDE';
    else if (player.isCrouching) player.gaitMode = speed > 0.1 ? 'CROUCH_WALK' : 'CROUCH';
    else if (speed < 0.1) player.gaitMode = 'IDLE';
    else if (speed <= CONFIG.WALK_MAX + 0.1) player.gaitMode = 'WALK';
    else if (speed <= CONFIG.JOG_MAX + 0.1) player.gaitMode = 'JOG';
    else player.gaitMode = 'SPRINT';

    if (!player.isSliding && player.gaitMode !== 'IDLE' && player.gaitMode !== 'CROUCH' && !player.isJumping) {
      let freq = 0.038;
      if (player.gaitMode === 'CROUCH_WALK') freq = 0.055;
      if (player.gaitMode === 'WALK') freq = 0.1047;
      if (player.gaitMode === 'JOG') freq = 0.052;
      if (player.gaitMode === 'SPRINT') freq = 0.040;
      player.stridePhase += speed * freq;

      if (player.gaitMode === 'SPRINT' && Math.sin(player.stridePhase) > 0.85 && spawnGrass) {
        spawnGrass(player.x + player.w / 2, GROUND_Y, player.facing);
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
  } else {
    if (player.kickState === 'SWING') {
      player.kickAngle += player.swingSpeed;

      const kickTraj = getGroundKickTrajectory('SWING', player.kickAngle, player.kickPower, hipX, hipY, GROUND_Y, player.facing, speed, player.kickPlantWorldX);
      player.kickingFootX = kickTraj.kicking.x;
      player.kickingFootY = kickTraj.kicking.y;

      if (player.kickAngle >= 2.1) {
        player.kickState = 'RECOVER';
      }
    } else if (player.kickState === 'RECOVER') {
      player.kickAngle -= player.kickRecoverSpeed;

      const kickTraj = getGroundKickTrajectory('RECOVER', player.kickAngle, player.kickPower, hipX, hipY, GROUND_Y, player.facing, speed, player.kickPlantWorldX);
      player.kickingFootX = kickTraj.kicking.x;
      player.kickingFootY = kickTraj.kicking.y;

      if (player.kickAngle <= 0) {
        player.kickAngle = 0;
        player.kickState = 'IDLE';
        player.hitThisSwing = false;
        player.kickCooldown = 8;
        player.stridePhase = (player.kickLeg === 'front') ? 0 : Math.PI;
      }
    } else if (player.isCharging && speed < 0.8) {
      const kickTraj = getGroundKickTrajectory('CHARGE', 0, player.chargePower, hipX, hipY, GROUND_Y, player.facing, speed, 0);
      player.kickingFootX = kickTraj.kicking.x;
      player.kickingFootY = kickTraj.kicking.y;
    }
  }

  let targetTilt = 0;
  if (player.kickMode === 'BACKFLIP') {
    const flip = getBackflipTargets(player.bicycleTimer, player.bicycleDuration, hipX, hipY, player.facing);
    targetTilt = -flip.rotation;
  } else if (player.kickMode === 'BACKFLIP_LAND') {
    targetTilt = 0.18 * player.facing;
  } else if (player.kickMode === 'SCISSOR' && player.kickState === 'SWING') {
    targetTilt = 0.08 * player.facing;
  } else if (player.isJumpCharging) {
    if (speed < 0.8) {
      targetTilt = 0.18 * player.facing * player.jumpChargePower;
    } else {
      const baseTilt = (player.gaitMode === 'SPRINT')
        ? 0.38 + ((speed - CONFIG.JOG_MAX) / 2.6) * 0.14
        : (player.gaitMode === 'JOG')
          ? 0.09 + ((speed - CONFIG.WALK_MAX) / 2.0) * 0.06
          : (speed / CONFIG.WALK_MAX) * 0.045;
      targetTilt = (baseTilt + player.jumpChargePower * 0.10) * player.facing * Math.sign(player.vx || player.facing);
    }
  } else if (!player.isIntro && player.kickMode === 'GROUND' && (player.kickState === 'SWING' || player.kickState === 'RECOVER')) {
    if (speed > 1.2) {
      targetTilt = (0.24 + (speed / CONFIG.SPRINT_MAX) * 0.16) * player.facing;
    } else {
      targetTilt = -0.14 * player.facing * Math.min(1.0, player.kickAngle / 1.4);
    }
  } else if (player.kneeJuggleWeight > 0) {
    targetTilt = -0.09 * player.facing * player.kneeJuggleWeight;
  } else if (player.isSliding) {
    targetTilt = -0.72 * player.facing;
  } else if (player.isCrouching) {
    targetTilt = 0.24 * player.facing;
  } else if (player.isJumping) {
    targetTilt = 0.06 * player.facing;
  } else if (player.isIntro) {
    const choreo = getFreestyleChoreography(player.juggleTimer, hipX, player.y + player.h - 40, GROUND_Y, player.facing, ball ? ball.radius : 12);
    targetTilt = choreo.torsoLean * player.facing;
  } else if (player.gaitMode === 'IDLE') {
    targetTilt = 0;
  } else {
    if (player.gaitMode === 'WALK') targetTilt = (speed / CONFIG.WALK_MAX) * 0.045;
    else if (player.gaitMode === 'JOG') targetTilt = 0.09 + ((speed - CONFIG.WALK_MAX) / 2.0) * 0.06;
    else if (player.gaitMode === 'SPRINT') targetTilt = 0.38 + ((speed - CONFIG.JOG_MAX) / 2.6) * 0.14;
    targetTilt *= player.facing * Math.sign(player.vx || player.facing);
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

  if (player.y >= GROUND_Y - player.h) {
    player.y = GROUND_Y - player.h;
    player.vy = 0;
    player.isJumping = false;

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

  let targetPelvisY = -6.5;
  if (player.isIntro) {
    const choreo = getFreestyleChoreography(player.juggleTimer, hipX, player.y + player.h - 40, GROUND_Y, player.facing, ball ? ball.radius : 12);
    targetPelvisY = -6.5 + choreo.pelvisDip;
  } else if (player.isJumpCharging) {
    if (speed < 0.8) {
      targetPelvisY = -6.5 + (player.jumpChargePower * 14);
    } else {
      const basePelvis = (player.gaitMode === 'SPRINT')
        ? Math.sin(player.stridePhase * 2 - Math.PI / 2) * 5.4 - 1.5
        : (player.gaitMode === 'JOG')
          ? Math.sin(player.stridePhase * 2 - Math.PI / 2) * 4.8 - 1.2
          : Math.cos(player.stridePhase * 2) * 2.2;
      targetPelvisY = -6.5 + basePelvis + (player.jumpChargePower * 5.0);
    }
  } else if (player.kickMode === 'BACKFLIP') {
    targetPelvisY = -1.5;
  } else if (player.kickMode === 'BACKFLIP_LAND') {
    targetPelvisY = 6.0;
  } else if (player.kickMode === 'GROUND' && (player.kickState === 'SWING' || (player.isCharging && speed < 0.8))) {
    targetPelvisY = -4.5;
  } else if (player.isSliding) {
    targetPelvisY = 26;
  } else if (player.isCrouching) {
    targetPelvisY = 16;
  } else if (player.gaitMode === 'IDLE') {
    targetPelvisY = -6.5;
  } else if (player.gaitMode === 'WALK') {
    targetPelvisY = -6.5 + Math.cos(player.stridePhase * 2) * 2.2;
  } else if (player.gaitMode === 'JOG') {
    targetPelvisY = -6.5 + Math.sin(player.stridePhase * 2 - Math.PI / 2) * 4.8 - 1.2;
  } else if (player.gaitMode === 'SPRINT') {
    targetPelvisY = Math.sin(player.stridePhase * 2 - Math.PI / 2) * 5.4 - 1.5;
  }
  if (player.isJumping) targetPelvisY = 0;
  player.pelvisY += (targetPelvisY - player.pelvisY) * 0.18;

  const targetHeadBob = (player.pelvisY * 0.35) + (Math.abs(player.vx) > 0 ? Math.sin(player.stridePhase * 2) * 1.4 : 0);
  const headForce = (targetHeadBob - player.headBob) * 0.32;
  player.headBobVel = (player.headBobVel + headForce) * 0.65;
  player.headBob += player.headBobVel;

  // =========================================================================
  // ŚLEDZENIE PIŁKI WZROKIEM: ZAWSZE PATRZY NA PIŁKĘ, CHYBA ŻE STOI PLECAMI
  // =========================================================================
  const headX = hipX + (28 * Math.sin(player.torsoTilt)) * player.facing;
  const headY = hipY - (28 * Math.cos(player.torsoTilt)) - 10 + player.headBob;
  
  if (ball) {
    const dxBall = (ball.x - headX) * player.facing;
    const dyBall = ball.y - headY;

    let desiredPitch = 0;

    if (player.kickMode === 'BACKFLIP') {
      desiredPitch = 0.35;
    } else if (dxBall > 6) {
      // Piłka jest przed graczem (w polu widzenia) -> patrzy bezpośrednio na piłkę
      const worldPitch = Math.atan2(dyBall, dxBall);
      const compensatedPitch = worldPitch - (player.torsoTilt * player.facing);
      
      // Naturalny zakres ruchomości szyi: od -48° (w górę) do +60° (w dół)
      desiredPitch = Math.max(-0.85, Math.min(1.05, compensatedPitch));
    } else {
      // Piłka jest za plecami -> gracz nie wykręca karku, tylko patrzy przed siebie
      if (player.gaitMode === 'SPRINT') {
        desiredPitch = 0.12; // skupiony wzrok przed siebie w sprincie
      } else {
        desiredPitch = 0.0;  // neutralny profil
      }
    }

    // Płynna, dynamiczna reakcja szyi i wzroku
    player.headPitch += (desiredPitch - player.headPitch) * 0.22;
  }
}

// =========================================================================
// SYSTEM GRAFICZNY: MODELOWANY SPORTOWIEC 2D
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

  // A. RAMIĘ (Zaokrąglony bark, rękawek i biceps)
  ctx.save();
  ctx.translate(shX, shY);
  ctx.rotate(armDir);

  ctx.fillStyle = upperCol;
  ctx.beginPath();
  ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-1.2, -3.8, upperLen * 0.62 + 1.2, 7.6, 2);
  } else {
    ctx.rect(-1.2, -3.8, upperLen * 0.62 + 1.2, 7.6);
  }
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillRect(upperLen * 0.52, -3.8, 1.8, 7.6);

  ctx.fillStyle = foreCol;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(upperLen * 0.52, -2.8, upperLen * 0.48, 5.6, 2.8);
  } else {
    ctx.rect(upperLen * 0.52, -2.8, upperLen * 0.48, 5.6);
  }
  ctx.fill();
  ctx.restore();

  // B. PRZEDRAMIĘ I DŁOŃ
  ctx.save();
  ctx.translate(elbowX, elbowY);
  ctx.rotate(foreDir);

  ctx.fillStyle = foreCol;
  ctx.beginPath();
  ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, -2.8);
  ctx.lineTo(foreLen * 0.75, -2.0);
  ctx.lineTo(foreLen * 0.75, 2.0);
  ctx.lineTo(0, 2.8);
  ctx.closePath();
  ctx.fill();

  if (isFront) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(foreLen * 0.58, -2.6, 3.2, 5.2);
  }

  ctx.fillStyle = '#de935e';
  ctx.beginPath();
  ctx.arc(foreLen + 1.2, 0, isFront ? 2.8 : 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function renderIKLeg(ctx, hipX, hipY, targetFootX, targetFootY, l1, l2, ankleRot, facing, colorThigh, colorShin, colorBoot) {
  const ik = solve2BoneIK(hipX, hipY, targetFootX, targetFootY, l1, l2, facing);

  const thighAng = Math.atan2(ik.kneeY - hipY, ik.kneeX - hipX);
  const shinAng = Math.atan2(ik.footY - ik.kneeY, ik.footX - ik.kneeX);

  ctx.save();

  // A. UDO I WYPROFILOWANE SPODENKI
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(thighAng);

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, -5.5);
  ctx.lineTo(l1 * 0.65, -4.5);
  ctx.lineTo(l1 * 0.65, 4.5);
  ctx.lineTo(0, 5.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = colorThigh;
  ctx.fillRect(0, -5.5, l1 * 0.65, 1.6);

  ctx.fillStyle = '#f5b078';
  ctx.beginPath();
  ctx.moveTo(l1 * 0.65, -3.6);
  ctx.lineTo(l1, -2.6);
  ctx.lineTo(l1, 2.6);
  ctx.lineTo(l1 * 0.65, 3.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // B. ŁYDKA, GETRA Z WYBRZUSZENIEM OCHRANIACZA I TAPING
  ctx.save();
  ctx.translate(ik.kneeX, ik.kneeY);
  ctx.rotate(shinAng);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, -3.4, 3.2, 6.8);

  ctx.fillStyle = colorShin;
  ctx.beginPath();
  ctx.moveTo(3.2, -3.8);
  ctx.lineTo(l2 * 0.50, -4.6);
  ctx.lineTo(l2, -2.8);
  ctx.lineTo(l2, 2.8);
  ctx.lineTo(l2 * 0.40, 4.2);
  ctx.lineTo(3.2, 3.4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(l2 - 4.8, -3.0, 3.8, 6.0);
  ctx.restore();

  // C. OPŁYWOWY BUT PIŁKARSKI Z DYSKRETNYMI WKRĘTAMI
  ctx.save();
  ctx.translate(ik.footX, ik.footY);
  ctx.rotate(ankleRot);
  ctx.scale(facing, 1);

  ctx.fillStyle = colorBoot;
  ctx.beginPath();
  ctx.moveTo(-5.0, -2.8);
  ctx.lineTo(11.0, -1.4);
  ctx.lineTo(14.0, 2.2);
  ctx.lineTo(-4.0, 2.8);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-1.0, -0.4);
  ctx.lineTo(7.0, 0.6);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-4.0, 2.8, 18.0, 1.4);

  ctx.fillStyle = '#64748b';
  ctx.fillRect(-1.5, 4.2, 1.8, 1.6);
  ctx.fillRect(9.2, 4.2, 1.8, 1.6);

  ctx.restore();

  ctx.restore();
  return ik;
}

export function drawFrontLegOnly(ctx, GROUND_Y) {
  const hipX = (player.x + player.w / 2) + player.lastHipShiftX;
  const hipY = player.y + player.h - 40 + player.pelvisY;

  renderIKLeg(
    ctx,
    hipX + (2 * player.facing),
    hipY,
    player.lastFootFrontX,
    player.lastFootFrontY,
    player.thighLen,
    player.shinLen,
    player.lastFootFrontAnkle,
    player.facing,
    '#dc2626',
    '#e53935',
    '#18181b'
  );
}

export function drawPlayer(ctx, GROUND_Y) {
  ctx.save();

  const centerX = player.x + player.w / 2;
  const floorY = GROUND_Y;
  let hipX = centerX;
  const hipY = player.y + player.h - 40 + player.pelvisY;
  const speed = Math.abs(player.vx);

  let rawFootBackTargetX, rawFootBackTargetY, rawFootBackAnkle;
  let rawFootFrontTargetX, rawFootFrontTargetY, rawFootFrontAnkle;
  let rawFrontSwing = 0.05, rawFrontElbow = 0.32;
  let rawBackSwing = -0.03, rawBackElbow = 0.26;

  const isGroundKicking = !player.isIntro && !player.isSliding && !player.isJumping &&
    player.kickMode === 'GROUND' &&
    ((player.isCharging && speed < 0.8) || player.kickState === 'SWING' || player.kickState === 'RECOVER');

  if (player.isIntro) {
    const choreo = getFreestyleChoreography(player.juggleTimer, hipX, hipY, floorY, player.facing, 12);
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
    rawFootFrontTargetY = floorY;
    rawFootFrontAnkle = 0.15 * player.facing;

    rawFootBackTargetX = hipX - (6 * player.facing);
    rawFootBackTargetY = floorY;
    rawFootBackAnkle = -0.15 * player.facing;

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
    rawFootFrontTargetY = floorY;
    rawFootFrontAnkle = 0.12 * player.facing;

    rawFootBackTargetX = hipX - (4 * player.facing);
    rawFootBackTargetY = floorY;
    rawFootBackAnkle = -0.12 * player.facing;

    rawFrontSwing = -0.55 * player.jumpChargePower;
    rawFrontElbow = 0.85 + 0.35 * player.jumpChargePower;
    rawBackSwing = -0.65 * player.jumpChargePower;
    rawBackElbow = 0.85 + 0.35 * player.jumpChargePower;
  } else if (isGroundKicking) {
    const kickPhase = (player.isCharging && speed < 0.8) ? 'CHARGE' : player.kickState;
    const kickPow = (player.isCharging && speed < 0.8) ? player.chargePower : player.kickPower;
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
    rawFootFrontTargetX = hipX + (44 * player.facing);
    rawFootFrontTargetY = floorY - 3;
    rawFootFrontAnkle = 0.35 * player.facing;
    rawFootBackTargetX = hipX - (18 * player.facing);
    rawFootBackTargetY = floorY - 4;
    rawFootBackAnkle = -0.55 * player.facing;

    rawFrontSwing = 0.85;
    rawFrontElbow = 0.75;
    rawBackSwing = -0.90;
    rawBackElbow = 0.40;
  } else if (player.isJumping) {
    const isRising = player.vy < 0;
    if (isRising) {
      rawFootFrontTargetX = hipX + (14 * player.facing);
      rawFootFrontTargetY = hipY + 22;
      rawFootFrontAnkle = 0.32 * player.facing;

      rawFootBackTargetX = hipX - (8 * player.facing);
      rawFootBackTargetY = hipY + 34;
      rawFootBackAnkle = -0.22 * player.facing;
    } else {
      rawFootFrontTargetX = hipX + (8 * player.facing);
      rawFootFrontTargetY = hipY + 38;
      rawFootFrontAnkle = 0.15 * player.facing;

      rawFootBackTargetX = hipX - (6 * player.facing);
      rawFootBackTargetY = hipY + 40;
      rawFootBackAnkle = 0.05 * player.facing;
    }

    rawFrontSwing = -0.35;
    rawFrontElbow = 0.75;
    rawBackSwing = 0.35;
    rawBackElbow = 0.65;
  } else if (player.gaitMode === 'IDLE') {
    rawFootFrontTargetX = hipX + (3 * player.facing);
    rawFootFrontTargetY = floorY;
    rawFootFrontAnkle = 0;
    rawFootBackTargetX = hipX - (3 * player.facing);
    rawFootBackTargetY = floorY;
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
      const kneeAnkle = 0.55 * player.facing;

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
    rawFootBackTargetY = floorY + legBackTraj.ly;
    rawFootBackAnkle = legBackTraj.ankle * player.facing;
    rawFootFrontTargetX = hipX + (legFrontTraj.lx * player.facing);
    rawFootFrontTargetY = floorY + legFrontTraj.ly;
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
      const kneeAnkle = 0.55 * player.facing;

      rawFootFrontTargetX = rawFootFrontTargetX * (1 - kw) + kneeFootX * kw;
      rawFootFrontTargetY = rawFootFrontTargetY * (1 - kw) + kneeFootY * kw;
      rawFootFrontAnkle = rawFootFrontAnkle * (1 - kw) + kneeAnkle * kw;

      rawFrontSwing = rawFrontSwing * (1 - kw) - 0.25 * kw;
      rawFrontElbow = rawFrontElbow * (1 - kw) + 0.75 * kw;
      rawBackSwing = rawBackSwing * (1 - kw) + 0.25 * kw;
      rawBackElbow = rawBackElbow * (1 - kw) + 0.75 * kw;
    }
  }

  // Subtelna rotacja tułowia
  let rawTorsoYaw = 0;
  if (!player.isIntro && !player.isJumping) {
    if (player.gaitMode === 'SPRINT') {
      rawTorsoYaw = -Math.sin(player.stridePhase) * 0.28;
    } else if (player.gaitMode === 'JOG') {
      rawTorsoYaw = -Math.sin(player.stridePhase) * 0.18;
    } else if (player.gaitMode === 'WALK') {
      rawTorsoYaw = -Math.sin(player.stridePhase) * 0.10;
    }
  }

  const p = player.pose;
  if (!p.initialized) {
    p.footFrontX = rawFootFrontTargetX;
    p.footFrontY = rawFootFrontTargetY;
    p.footFrontAnkle = rawFootFrontAnkle;
    p.footBackX = rawFootBackTargetX;
    p.footBackY = rawFootBackTargetY;
    p.footBackAnkle = rawFootBackAnkle;
    p.armFrontSwing = rawFrontSwing;
    p.armFrontElbow = rawFrontElbow;
    p.armBackSwing = rawBackSwing;
    p.armBackElbow = rawBackElbow;
    p.torsoTilt = player.torsoTilt;
    p.torsoYaw = rawTorsoYaw;
    p.headPitch = player.headPitch;
    p.initialized = true;
  }

  let footBlend = 0.28;
  let armBlend = 0.24;
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
    footBlend = 0.58;
    armBlend = 0.45;
  } else if (player.isSliding || player.kickMode === 'SCISSOR') {
    footBlend = 0.45;
    armBlend = 0.35;
  }

  p.footFrontX += (rawFootFrontTargetX - p.footFrontX) * footBlend;
  p.footFrontY += (rawFootFrontTargetY - p.footFrontY) * footBlend;
  p.footFrontAnkle += (rawFootFrontAnkle - p.footFrontAnkle) * footBlend;

  p.footBackX += (rawFootBackTargetX - p.footBackX) * footBlend;
  p.footBackY += (rawFootBackTargetY - p.footBackY) * footBlend;
  p.footBackAnkle += (rawFootBackAnkle - p.footBackAnkle) * footBlend;

  p.armFrontSwing += (rawFrontSwing - p.armFrontSwing) * armBlend;
  p.armFrontElbow += (rawFrontElbow - p.armFrontElbow) * armBlend;
  p.armBackSwing += (rawBackSwing - p.armBackSwing) * armBlend;
  p.armBackElbow += (rawBackElbow - p.armBackElbow) * armBlend;

  if (player.kickMode === 'BACKFLIP') {
    p.torsoTilt = player.torsoTilt;
  } else {
    p.torsoTilt += (player.torsoTilt - p.torsoTilt) * 0.24;
  }
  p.torsoYaw += (rawTorsoYaw - p.torsoYaw) * 0.20;
  p.headPitch += (player.headPitch - p.headPitch) * 0.22;

  const shoulderCounterTilt = -Math.sin(player.stridePhase) * (speed > 0.8 ? 0.045 : 0.015) * player.facing;
  p.shoulderTilt += (shoulderCounterTilt - p.shoulderTilt) * 0.20;

  // =========================================================================
  // PRAWDZIWA GEOMETRIA BARKÓW
  // =========================================================================
  const shoulderBaseX = hipX + (21 * Math.sin(p.torsoTilt)) * player.facing;
  const shoulderBaseY = hipY - (21 * Math.cos(p.torsoTilt));

  const shBackX = shoulderBaseX - (1.2 * player.facing);
  const shBackY = shoulderBaseY + (p.shoulderTilt * 6);

  const shFrontX = shoulderBaseX + (1.2 * player.facing);
  const shFrontY = shoulderBaseY - (p.shoulderTilt * 6);

  // 1. TYLNA RĘKA (w cieniu)
  renderArm(
    ctx,
    shBackX,
    shBackY,
    p.armBackSwing,
    p.armBackElbow,
    player.facing,
    '#991b1b',
    '#de935e',
    false
  );

  // 2. TYLNA NOGA (w cieniu)
  renderIKLeg(
    ctx,
    hipX - (2 * player.facing),
    hipY,
    p.footBackX,
    p.footBackY,
    player.thighLen,
    player.shinLen,
    p.footBackAnkle,
    player.facing,
    '#991b1b',
    '#b91c1c',
    '#111827'
  );

  // 3. TORS SPORTOWCA, SPODENKI, ANATOMICZNY KARK I GŁOWA
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(p.torsoTilt * player.facing);
  ctx.scale(player.facing, 1);

  // Spodenki piłkarskie
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-7.5, -8, 15, 11, 2);
  } else {
    ctx.rect(-7.5, -8, 15, 11);
  }
  ctx.fill();

  // Elastyczny pasek spodenek
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(-7.5, -8, 15, 2.2);

  // Smukła sylwetka koszulki (atletyczny profil)
  ctx.fillStyle = '#e53935';
  ctx.beginPath();
  ctx.moveTo(-5.5, -6);
  ctx.quadraticCurveTo(-6.0, -15, -6.5, -24.5);
  ctx.lineTo(6.5, -24.5);
  ctx.quadraticCurveTo(7.0, -15, 5.5, -6);
  ctx.closePath();
  ctx.fill();

  // Dynamiczny szew boczny koszulki
  const seamX = (p.torsoYaw * 3.2);
  ctx.fillStyle = '#b71c1c';
  ctx.beginPath();
  ctx.moveTo(-5.5, -6);
  ctx.lineTo(-6.5, -24.5);
  ctx.lineTo(seamX - 1.0, -24.5);
  ctx.lineTo(seamX - 0.5, -6);
  ctx.closePath();
  ctx.fill();

  // Detale dekoltu i numeru
  if (p.torsoYaw > 0.04) {
    const vCenter = 2.0 + (p.torsoYaw * 2.0);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(vCenter - 2.8, -24.5);
    ctx.lineTo(vCenter, -20.5);
    ctx.lineTo(vCenter + 2.8, -24.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#de935e';
    ctx.beginPath();
    ctx.moveTo(vCenter - 1.6, -24.5);
    ctx.lineTo(vCenter, -21.8);
    ctx.lineTo(vCenter + 1.6, -24.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fbc02d';
    ctx.beginPath();
    ctx.arc(vCenter + 2.8, -18.0, 1.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.torsoYaw < -0.04) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2.5, -25.5, 5.0, 1.6);

    const numX = -1.8 + (p.torsoYaw * 2.0);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('10', numX, -12);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1.0, -25.2, 3.5, 1.4);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 8.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('10', 0, -12);
  }

  // =========================================================================
  // ANATOMICZNY KARK I SZYJA SPORTOWCA (ZERO PISTONÓW I CYLINDRÓW)
  // =========================================================================
  ctx.fillStyle = '#de935e';
  ctx.beginPath();
  ctx.moveTo(-5.5, -24.0); // tył barku / koszulki
  ctx.lineTo(-2.8, -28.0); // podstawa potylicy czaszki
  ctx.lineTo(2.8, -27.5);  // krawędź żuchwy pod uchem
  ctx.lineTo(3.2, -24.0);  // obojczyk / przód kołnierzyka
  ctx.closePath();
  ctx.fill();

  // Elastyczny kołnierzyk wokół szyi
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-5.5, -24.5);
  ctx.lineTo(3.5, -24.5);
  ctx.stroke();

  // =========================================================================
  // GŁOWA SPORTOWCA (NATURALNIE OSADZONA NA KARKU, PEŁNY KĄT ŚLEDZENIA)
  // =========================================================================
  ctx.save();
  ctx.translate(1.0, -29.8 + (player.headBob * 0.35));
  ctx.rotate(p.headPitch);

  // Profil twarzy z linią nosa i podbródka
  ctx.fillStyle = '#f5b078';
  ctx.beginPath();
  ctx.moveTo(-4.8, -6.0);
  ctx.lineTo(4.8, -6.0);
  ctx.lineTo(6.0, -1.0);
  ctx.lineTo(7.2, 0.8);
  ctx.lineTo(5.2, 2.0);
  ctx.lineTo(3.8, 6.0);
  ctx.lineTo(-3.2, 5.0);
  ctx.lineTo(-4.8, -1.0);
  ctx.closePath();
  ctx.fill();

  // Ucho
  ctx.fillStyle = '#de935e';
  ctx.beginPath();
  ctx.arc(-3.8, 0.5, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Cieniowanie boków głowy (fryzura fade)
  ctx.fillStyle = '#3a2012';
  ctx.beginPath();
  ctx.moveTo(-4.5, -2.5);
  ctx.lineTo(-5.0, -6.5);
  ctx.lineTo(1.5, -6.5);
  ctx.lineTo(1.5, -3.0);
  ctx.closePath();
  ctx.fill();

  // Teksturowana góra włosów
  ctx.fillStyle = '#23120b';
  ctx.beginPath();
  ctx.moveTo(-5.5, -4.5);
  ctx.lineTo(-6.2, -10.5);
  ctx.lineTo(2.5, -11.8);
  ctx.lineTo(6.5, -7.0);
  ctx.lineTo(3.2, -5.0);
  ctx.closePath();
  ctx.fill();

  // Biała opaska sportowa na włosach
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-5.0, -6.0);
  ctx.lineTo(5.0, -6.0);
  ctx.stroke();

  // Oko
  ctx.fillStyle = '#1e1b18';
  ctx.fillRect(2.0, -1.5, 2.6, 1.3);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(3.2, -1.0, 1.4, 1.4);

  ctx.restore();
  ctx.restore();

  // 4. PRZEDNIA NOGA (jasna, wyrazista)
  renderIKLeg(
    ctx,
    hipX + (2 * player.facing),
    hipY,
    p.footFrontX,
    p.footFrontY,
    player.thighLen,
    player.shinLen,
    p.footFrontAnkle,
    player.facing,
    '#dc2626',
    '#e53935',
    '#18181b'
  );

  // 5. PRZEDNIA RĘKA (zakotwiczona w shFront)
  renderArm(
    ctx,
    shFrontX,
    shFrontY,
    p.armFrontSwing,
    p.armFrontElbow,
    player.facing,
    '#e53935',
    '#f5b078',
    true
  );

  ctx.restore();
}
