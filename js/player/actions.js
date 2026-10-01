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
  let char = p;
  let grassFn = spawnGrass;
  let groundYVal = GROUND_Y;
  if (spawnGrass && typeof spawnGrass.vx === 'number') {
    char = spawnGrass;
    grassFn = GROUND_Y;
    groundYVal = p;
  }
  if (!char) return;

  const isMovingBackwards = (char.vx * char.facing < -0.1);
  if (isMovingBackwards) return;
  if (char.isIntro || char.isDead) return;

  if (!char.isJumping && !char.isSliding) {
    char.isSliding = true;
    char.slideTimer = 56;
    char.isCrouching = false;
    char.isProne = false;
    char.isJumpCharging = false;

    // Natychmiastowe nadanie pełnego pędu wślizgu (slideDashSpeed)
    const slideDash = char.currentClass?.stats?.slideDashSpeed || CONFIG.SLIDE_DASH_SPEED || 13.5;
    char.vx = char.facing * slideDash;

    const currentFloor = char.currentGroundY || groundYVal;
    const finalGrassFn = grassFn || char._spawnGrass;
    if (finalGrassFn && currentFloor) {
      for (let i = 0; i < 8; i++) finalGrassFn(char.x + char.w / 2 + (char.facing * 15), currentFloor, char.facing);
    }

    char.currentClass?.onSlide?.(char, finalGrassFn);
  }
}

/**
 * Wykrywanie przeciwnika w zwarciu (w odległości <= 65px przed graczem)
 */
export function findMeleeTarget(p, potentialTargets) {
  if (!p) return null;
  const list = potentialTargets || p._targets;
  if (!list) return null;
  const targets = Array.isArray(list) ? list : [list];

  const hipX = p.x + p.w / 2;
  const hipY = p.y + p.h - 40 + (p.pelvisY || 0);

  for (const t of targets) {
    if (!t || t === p || t.isDead) continue;
    const targetX = t.x + (t.w || 24) / 2;
    const targetY = t.y + (t.h || 70) - 40;

    const dx = targetX - hipX;
    const dy = targetY - hipY;

    // Przeciwnik musi znajdować się przed graczem w kierunku facing
    const isAhead = (dx * p.facing) >= -12;
    const dist = Math.hypot(dx, dy);

    if (isAhead && dist <= 75) {
      return t;
    }
  }
  return null;
}

/**
 * Inicjalizacja manewru Spartan Kick (poziomy wykop w klatkę przeciwnika)
 */
export function triggerSpartanKick(p, meleeTarget) {
  const pwr = p.chargePower || 0;
  p.isCharging = false;
  p.kickPower = pwr;
  p.chargePower = pwr;
  p.kickMode = 'SPARTAN';
  p.kickLeg = p.nextLeg || 'front';
  p.kickState = 'SWING';
  p.spartanTimer = 0;
  p.spartanDuration = 18;
  p.hitThisSwing = false;
  p.kickBufferTimer = 18;
  p.spartanTarget = meleeTarget || null;
  p.nextLeg = (p.kickLeg === 'front') ? 'back' : 'front';
  return 'SPARTAN';
}

export function startKickCharge(p, targets) {
  if (!p || p.isSliding) return;
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

export function executeReleaseKick(ballParam, p, comboFlipWindowUntil = 0, targets) {
  if (!p) return null;

  // Sprawdź czy przed graczem jest wróg w zwarciu (Spartan Kick)
  const meleeTarget = findMeleeTarget(p, targets);
  if (meleeTarget && p.kickState === 'IDLE' && p.kickCooldown <= 0) {
    return triggerSpartanKick(p, meleeTarget);
  }

  if (!p.isCharging && !p.isIntro) return null;
  if (p.kickState !== 'IDLE' || p.kickCooldown > 0) {
    p.isCharging = false;
    return null;
  }

  if (meleeTarget) {
    return triggerSpartanKick(p, meleeTarget);
  }

  const ball = ballParam || p._ball;
  const timing = evaluateKickTiming(p, ball);

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
    p.kickBufferTimer = 14;

    const curSpeed = Math.abs(p.vx);
    const sprintMax = p.currentClass?.stats?.sprintMax || CONFIG.SPRINT_MAX;
    const speedRatio = Math.min(1.0, curSpeed / sprintMax);
    p.swingSpeed = (0.18 + p.chargePower * 0.14) * (1.0 + speedRatio * 0.95);
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
    supportFootX = hipX - 6.0 * facing;
    supportFootY = plantFloorY;
    supportAnkle = 0.0;
  }

  if (phase === 'CHARGE') {
    // Naturalna pozycja gotowości: obie stopy stabilnie na podłożu, zero odginania nogi w tył
    const p = ease(power);
    kickFootX = hipX + (6.0 + p * 2.0) * facing;
    kickFootY = plantFloorY;
    kickAnkle = 0.0;
  } else if (phase === 'SWING') {
    const u = Math.min(1.0, angle / 2.1);

    if (u < 0.35) {
      // Dynamiczny start stopy w przód z ziemi w stronę piłki (kickAngle rośnie w przód)
      const w = ease(u / 0.35);
      const startX = 6.0;
      const startY = plantFloorY - hipY;
      const strikeX = 36 + speedRatio * 14 + power * 10;
      const strikeY = 36 - power * 6;

      kickFootX = hipX + lerp(startX, strikeX, w) * facing;
      kickFootY = hipY + lerp(startY, strikeY, w);
      kickAnkle = lerp(0.0, 0.45, w) * facing;
    } else if (u < 0.75) {
      // Dynamiczny follow-through i wyciągnięcie stopy w przód
      const w = ease((u - 0.35) / 0.40);
      const strikeX = 36 + speedRatio * 14 + power * 10;
      const strikeY = 36 - power * 6;
      const peakX = strikeX + 10 + speedRatio * 8;
      const peakY = lerp(strikeY, 14 - power * 16, w);

      kickFootX = hipX + lerp(strikeX, peakX, w) * facing;
      kickFootY = hipY + peakY;
      kickAnkle = lerp(0.45, -0.25, w) * facing;
    } else {
      // Wyciszenie wymachu stopy
      const w = ease((u - 0.75) / 0.25);
      const strikeX = 36 + speedRatio * 14 + power * 10;
      const peakX = strikeX + 10 + speedRatio * 8;
      const peakY = 14 - power * 16;
      const targetLandingX = 14 + speedRatio * 8;
      const targetLandingY = plantFloorY - hipY;

      kickFootX = hipX + lerp(peakX, targetLandingX, w) * facing;
      kickFootY = hipY + lerp(peakY, targetLandingY, w);
      kickAnkle = lerp(-0.25, 0.10, w) * facing;
    }
  } else {
    // Faza RECOVER
    const u = Math.max(0, Math.min(1.0, angle / 2.1));
    const w = ease(u);
    const peakX = 46 + speedRatio * 22 + power * 10;
    const peakY = 14 - power * 16;

    const targetLandingX = 14 + speedRatio * 8;
    const targetLandingY = plantFloorY - hipY;

    kickFootX = hipX + lerp(targetLandingX, peakX, w) * facing;
    kickFootY = hipY + lerp(targetLandingY, peakY, w);
    kickAnkle = lerp(0.05, 0.15, w) * facing;
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

/**
 * Trajektoria kinetyczna manewru Spartan Kick (poziome wypchnięcie stopy w przód w klatkę)
 */
export function getSpartanKickTargets(timer, duration, hipX, hipY, facing, floorY) {
  const u = Math.min(1.0, timer / duration);
  const plantFloorY = floorY - 3.5;

  // Noga podporowa mocno zaparta w podłożu za biodrami
  const supportFootX = hipX - 10 * facing;
  const supportFootY = plantFloorY;
  const supportAnkle = 0.08 * facing;

  let kickFootX, kickFootY, kickAnkle;

  if (u < 0.22) {
    // 1. Uniesienie stopy z ziemi i podciągnięcie kolana do klatki (chamber)
    const w = ease(u / 0.22);
    kickFootX = hipX + lerp(4, 18, w) * facing;
    kickFootY = lerp(plantFloorY, hipY - 2, w);
    kickAnkle = lerp(0.0, 0.40, w) * facing;
  } else if (u < 0.55) {
    // 2. Eksplozywne poziome wypchnięcie stopy w przód prosto w klatkę wroga (wysoko: hipY - 14 px, wysięg +48 px)
    const w = ease((u - 0.22) / 0.33);
    kickFootX = hipX + lerp(18, 48, w) * facing;
    kickFootY = lerp(hipY - 2, hipY - 14, w);
    kickAnkle = lerp(0.40, -0.15, w) * facing;
  } else if (u < 0.75) {
    // 3. Utrzymanie pełnego wyprostu w klatce celu (impact hold)
    kickFootX = hipX + 48 * facing;
    kickFootY = hipY - 14;
    kickAnkle = -0.15 * facing;
  } else {
    // 4. Płynny powrót stopy na ziemię
    const w = ease((u - 0.75) / 0.25);
    kickFootX = hipX + lerp(48, 8, w) * facing;
    kickFootY = lerp(hipY - 14, plantFloorY, w);
    kickAnkle = lerp(-0.15, 0.0, w) * facing;
  }

  return {
    kicking: { x: kickFootX, y: kickFootY, ankle: kickAnkle },
    support: { x: supportFootX, y: supportFootY, ankle: supportAnkle }
  };
}

/**
 * Prawidłowe cele IK dla leżenia (Prone) i czołgania (Crawl):
 * Tors płasko przy ziemi (floorY - 6 px), kolana i łokcie pracujące wzdłuż podłoża,
 * stopy spoczywają płasko na podłożu (plantFloorY), bez unoszenia nóg w powietrze.
 */
export function getProneIKTargets(crawlPhase, isCrawling, hipX, plantFloorY, facing) {
  if (isCrawling) {
    // Wojskowy low crawl: ciało przesuwa się tuż przy ziemi, kolana i stopy ślizgają się po podłożu
    const legStride = Math.sin(crawlPhase) * 8;
    return {
      front: {
        x: hipX - (44 + legStride) * facing,
        y: plantFloorY,
        ankle: 0.05 * facing
      },
      back: {
        x: hipX - (44 - legStride) * facing,
        y: plantFloorY,
        ankle: -0.05 * facing
      },
      frontArm: {
        swing: 0.85 + Math.cos(crawlPhase) * 0.35,
        elbow: 1.40
      },
      backArm: {
        swing: 0.85 - Math.cos(crawlPhase) * 0.35,
        elbow: 1.40
      }
    };
  }

  // Leżenie płasko (Prone Idle): tors i miednica przylegają do podłoża, nogi wyprostowane spoczywają płasko na ziemi
  return {
    front: {
      x: hipX - 44 * facing,
      y: plantFloorY,
      ankle: 0.0
    },
    back: {
      x: hipX - 46 * facing,
      y: plantFloorY,
      ankle: 0.0
    },
    frontArm: {
      swing: 0.70,
      elbow: 1.30
    },
    backArm: {
      swing: 0.65,
      elbow: 1.25
    }
  };
}

