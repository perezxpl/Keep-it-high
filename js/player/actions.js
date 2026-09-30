// =========================================================================
// PLAYER/ACTIONS.JS - AKCJE I MANEWRY SPECJALNE ZAWODNIKA
// Obsługa skoków, wślizgów, ładowania wykopu oraz trajektorii kopnięć.
// =========================================================================

import { CONFIG } from '../config.js';
import { ease, lerp } from './ik.js';

export function startJumpCharge(p) {
  if (p.isIntro || p.isJumping || p.isSliding) return;
  p.isJumpCharging = true;
  p.jumpChargePower = 0;
}

export function playerJump(p) {
  startJumpCharge(p);
}

export function executeReleaseJump(spawnGrass, p) {
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

  const grassFn = spawnGrass || p._spawnGrass;
  const currentFloor = p.currentGroundY || p.groundY;
  if (grassFn && currentFloor) {
    for (let i = 0; i < 4; i++) {
      grassFn(p.x + p.w / 2, currentFloor, p.facing);
    }
  }

  p.currentClass?.onJump?.(p, grassFn);
}

export function playerSlide(spawnGrass, GROUND_Y, p) {
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

export function startKickCharge(p) {
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

export function executeReleaseKick(ballParam, p, comboFlipWindowUntil = 0) {
  if (!p.isCharging && !p.isIntro) return null;
  if (p.kickState !== 'IDLE' || p.kickCooldown > 0) {
    p.isCharging = false;
    return null;
  }

  const ball = ballParam || p._ball;
  const timing = evaluateKickTiming(p, ball);

  if (!p.isIntro && timing === 'CANCEL') {
    p.isCharging = false;
    p.chargePower = 0;
    p.kickPower = 0;
    return null;
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
    return 'SPIN_VOLLEY';
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
      return 'BACKFLIP';
    } else {
      p.kickMode = 'SCISSOR';
      p.scissorTimer = 0;
      p.scissorDuration = 22;
      p.kickState = 'SWING';
      p.hitThisSwing = false;
      p.kickBufferTimer = 16;
      return 'SCISSOR';
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
    return 'GROUND';
  }
}

export function getGroundKickTrajectory(phase, angle, power, hipX, hipY, floorY, facing, speed, plantWorldX) {
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

export function getScissorLegTargets(timer, duration, hipX, hipY, facing, power = 0) {
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

export function getBackflipTargets(timer, duration, hipX, hipY, facing) {
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
