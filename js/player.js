import { CONFIG, START_X } from './config.js';

function ease(t) {
  return 0.5 - 0.5 * Math.cos(t * Math.PI);
}

function parabola(t) {
  return 4 * t * (1 - t);
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

  kickCooldown: 0,
  kickMode: 'GROUND',
  kickPower: 0, // Zapamiętana siła w momencie uderzenia
  scissorTimer: 0,
  scissorDuration: 22,

  kickingFootX: 0,
  kickingFootY: 0,

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

  headPitch: 0
};

export function playerJump() {
  if (player.isIntro) return;
  if (!player.isJumping && !player.isSliding) {
    player.vy = -CONFIG.JUMP_FORCE;
    player.isJumping = true;
    player.isCrouching = false;
  }
}

export function playerSlide(spawnGrass, GROUND_Y) {
  if (player.isIntro) return;
  if (!player.isJumping && !player.isSliding) {
    player.isSliding = true;
    player.slideTimer = 44;
    player.isCrouching = false;

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
  player.kickPower = player.chargePower; // Zapamiętanie siły wykopu dla animacji

  const isAirborne = player.isJumping || (player.groundY > 0 && player.y < player.groundY - player.h - 4);

  if (isAirborne && !player.isIntro) {
    player.kickMode = 'SCISSOR';
    player.scissorTimer = 0;
    player.scissorDuration = 22;
    player.kickState = 'SWING';
    player.hitThisSwing = false;
    player.kickBufferTimer = 16;
  } else {
    player.kickMode = 'GROUND';
    player.kickLeg = player.nextLeg;
    player.kickState = 'SWING';
    player.hitThisSwing = false;
    player.kickAngle = 0;
    player.kickBufferTimer = 12;
    player.swingSpeed = 0.17 + (player.chargePower * 0.12);
    player.nextLeg = (player.kickLeg === 'front') ? 'back' : 'front';
  }
}

export function solve2BoneIK(hx, hy, tx, ty, l1, l2, facing) {
  let dx = tx - hx;
  let dy = ty - hy;
  let d = Math.hypot(dx, dy);

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
  const cosAlpha = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const alpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha)));

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
    lx = 18 - eu * 52;
    ly = eu > 0.8 ? -Math.sin((eu - 0.8) / 0.2 * Math.PI * 0.5) * 4 : 0;
    ankle = 0.25 + (eu * 0.55);
  } else if (t < 0.58) {
    const eu = ease((t - 0.32) / 0.26);
    lx = -34 + eu * 20;
    ly = -Math.sin(eu * Math.PI * 0.5) * 36;
    ankle = 0.45 - (eu * 0.50);
  } else if (t < 0.82) {
    const eu = ease((t - 0.58) / 0.24);
    lx = -14 + eu * 48;
    ly = -36 + (eu * 20);
    ankle = -0.15 + (eu * 0.35);
  } else {
    const eu = ease((t - 0.82) / 0.18);
    lx = 34 - eu * 16;
    ly = -16 + eu * 16;
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
    const strideLen = 18 + (speed / CONFIG.WALK_MAX) * 6;
    const stepHeight = 7;

    if (p < stanceLimit) {
      const eu = ease(p / stanceLimit);
      lx = (0.5 - eu) * strideLen * 2;
      ly = 0;
      if (eu < 0.25) ankle = -0.35 * (1 - eu / 0.25);
      else if (eu < 0.70) ankle = 0;
      else ankle = 0.65 * ((eu - 0.70) / 0.30);
    } else {
      const eu = ease((p - stanceLimit) / (Math.PI * 2 - stanceLimit));
      lx = (-0.5 + eu) * strideLen * 2;
      ly = -Math.sin(eu * Math.PI) * stepHeight;
      ankle = 0.2 * Math.sin(eu * Math.PI);
    }
  } else if (mode === 'JOG') {
    const stanceRatio = 0.44;
    const stanceLimit = Math.PI * 2 * stanceRatio;
    const strideLen = 25 + ((speed - CONFIG.WALK_MAX) / (CONFIG.JOG_MAX - CONFIG.WALK_MAX)) * 8;
    const stepHeight = 15;

    if (p < stanceLimit) {
      const eu = ease(p / stanceLimit);
      lx = (0.5 - eu) * strideLen * 2;
      ly = Math.sin(eu * Math.PI) * 2.0;
      if (eu < 0.3) ankle = -0.15 * (1 - eu / 0.3);
      else ankle = 0.75 * ((eu - 0.3) / 0.7);
    } else {
      const eu = ease((p - stanceLimit) / (Math.PI * 2 - stanceLimit));
      lx = (-0.5 + eu) * strideLen * 2;
      ly = -Math.sin(eu * Math.PI) * stepHeight;
      ankle = 0.35 * Math.sin(eu * Math.PI);
    }
  }

  return { lx, ly, ankle };
}

/**
 * STOPNIOWE DOSTOSOWANIE WYSOKOŚCI NOŻYC DO SIŁY WYKOPU (power 0.0 -> 1.0):
 * - power = 0.0 (tap): kąt uniesienia ~43° (wysokość biodra/pasa)
 * - power = 1.0 (pełny charge): kąt uniesienia ~95° (wysoko nad biodrem, wysokość głowy!)
 */
function getScissorLegTargets(timer, duration, hipX, hipY, facing, power = 0) {
  const u = Math.min(1.0, timer / duration);
  const R = 41.5; // Stała długość nogi (tylko lekko ugięte kolana)

  // Dynamiczne kąty szczytu uzależnione proporcjonalnie od naładowania
  const strikePeakAngle = 0.75 + (power * 0.90);
  const backCounterAngle = -0.55 - (power * 0.25);

  let angBack, angFront, ankleBack, ankleFront;

  if (u < 0.32) {
    // 1. Dynamiczny rozkrok wstępny
    const w = u / 0.32;
    angBack = -0.30 + w * 0.95;
    angFront = 0.20 - w * 0.75;
    ankleBack = -0.15 * facing;
    ankleFront = 0.20 * facing;
  } else if (u < 0.75) {
    // 2. Eksplozywne cięcie nożycowe:
    // Przednia noga unosi się dokładnie na wysokość proporcjonalną do strikePeakAngle
    const w = (u - 0.32) / 0.43;
    angBack = 0.65 - w * (0.65 - backCounterAngle);
    angFront = -0.55 + w * (strikePeakAngle - (-0.55));
    ankleBack = 0.30 * facing;
    ankleFront = -0.35 * facing;
  } else {
    // 3. Płynny powrót stóp do pionu
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

export function updatePlayer(keys, leftStick, GROUND_Y, ball, spawnGrass) {
  player.groundY = GROUND_Y;

  if (player.kickBufferTimer > 0) player.kickBufferTimer--;
  if (player.kickCooldown > 0) player.kickCooldown--;

  if (player.isCharging) {
    player.chargePower = Math.min(1.0, player.chargePower + 0.035);
  }

  let inputAxisX = 0;
  let inputAxisY = 0;

  if (keys.right) inputAxisX += 1;
  if (keys.left) inputAxisX -= 1;
  if (keys.down) inputAxisY += 1;
  if (leftStick && leftStick.active) {
    inputAxisX = leftStick.axisX;
    inputAxisY = leftStick.axisY;
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

    if (inputAxisX > 0.1 && !player.isSliding) player.facing = 1;
    else if (inputAxisX < -0.1 && !player.isSliding) player.facing = -1;

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
      if (player.gaitMode === 'WALK') freq = 0.034;
      if (player.gaitMode === 'JOG') freq = 0.038;
      if (player.gaitMode === 'SPRINT') freq = 0.045;
      player.stridePhase += speed * freq;

      if (player.gaitMode === 'SPRINT' && Math.sin(player.stridePhase) > 0.85 && spawnGrass) {
        spawnGrass(player.x + player.w / 2, GROUND_Y, player.facing);
      }
    }
  }

  let targetTilt = 0;
  if (player.kickMode === 'SCISSOR' && player.kickState === 'SWING') {
    targetTilt = 0.08 * player.facing;
  } else if (player.isSliding) targetTilt = -0.72 * player.facing;
  else if (player.isCrouching) targetTilt = 0.24 * player.facing;
  else if (player.isJumping) targetTilt = 0.10 * player.facing;
  else if (player.isIntro) {
    const hipX = player.x + player.w / 2;
    const choreo = getFreestyleChoreography(player.juggleTimer, hipX, player.y + player.h - 40, GROUND_Y, player.facing, ball ? ball.radius : 12);
    targetTilt = choreo.torsoLean * player.facing;
  } else if (player.gaitMode === 'IDLE') targetTilt = 0;
  else {
    const curSpeed = Math.abs(player.vx);
    if (player.gaitMode === 'WALK') targetTilt = (curSpeed / CONFIG.WALK_MAX) * 0.08;
    else if (player.gaitMode === 'JOG') targetTilt = 0.14 + ((curSpeed - CONFIG.WALK_MAX) / 2.0) * 0.12;
    else if (player.gaitMode === 'SPRINT') targetTilt = 0.38 + ((curSpeed - CONFIG.JOG_MAX) / 2.6) * 0.14;
    targetTilt *= player.facing * Math.sign(player.vx || player.facing);
  }

  const tiltForce = (targetTilt - player.torsoTilt) * 0.22;
  player.torsoTiltVel = (player.torsoTiltVel + tiltForce) * 0.74;
  player.torsoTilt += player.torsoTiltVel;

  player.vy += CONFIG.GRAVITY;
  player.y += player.vy;

  if (player.y >= GROUND_Y - player.h) {
    player.y = GROUND_Y - player.h;
    player.vy = 0;
    player.isJumping = false;
    if (player.kickMode === 'SCISSOR') {
      player.kickState = 'IDLE';
      player.kickMode = 'GROUND';
      player.scissorTimer = 0;
      player.kickCooldown = 10;
    }
  }

  let targetPelvisY = -6.5;
  if (player.isIntro) {
    const hipX = player.x + player.w / 2;
    const choreo = getFreestyleChoreography(player.juggleTimer, hipX, player.y + player.h - 40, GROUND_Y, player.facing, ball ? ball.radius : 12);
    targetPelvisY = -6.5 + choreo.pelvisDip;
  } else if (player.isSliding) targetPelvisY = 26;
  else if (player.isCrouching) targetPelvisY = 16;
  else if (player.gaitMode === 'IDLE') targetPelvisY = -6.5;
  else if (player.gaitMode === 'WALK') targetPelvisY = -Math.abs(Math.sin(player.stridePhase)) * 2.0;
  else if (player.gaitMode === 'JOG') targetPelvisY = Math.cos(player.stridePhase * 2) * 3.2;
  else if (player.gaitMode === 'SPRINT') {
    targetPelvisY = Math.sin(player.stridePhase * 2 - Math.PI / 2) * 5.4 - 1.5;
  }
  if (player.isJumping) targetPelvisY = 0;
  player.pelvisY += (targetPelvisY - player.pelvisY) * 0.18;

  const targetHeadBob = (player.pelvisY * 0.35) + (Math.abs(player.vx) > 0 ? Math.sin(player.stridePhase * 2) * 1.6 : 0);
  const headForce = (targetHeadBob - player.headBob) * 0.32;
  player.headBobVel = (player.headBobVel + headForce) * 0.65;
  player.headBob += player.headBobVel;

  const hipX = player.x + player.w / 2;
  const hipY = player.y + player.h - 40 + player.pelvisY;
  const headX = hipX + (28 * Math.sin(player.torsoTilt)) * player.facing;
  const headY = hipY - (28 * Math.cos(player.torsoTilt)) - 10 + player.headBob;
  
  if (ball) {
    const dxBall = (ball.x - headX) * player.facing;
    const dyBall = ball.y - headY;
    const rawPitch = Math.atan2(dyBall, dxBall);
    if (player.isIntro) {
      player.headPitch = Math.max(-0.35, Math.min(0.60, rawPitch * 0.80));
    } else if (player.gaitMode === 'IDLE') {
      player.headPitch = Math.max(-0.22, Math.min(0.22, rawPitch * 0.35));
    } else if (player.gaitMode === 'SPRINT') {
      const compensatedPitch = rawPitch - (player.torsoTilt * player.facing * 0.7);
      player.headPitch = Math.max(-0.65, Math.min(0.70, compensatedPitch));
    } else {
      player.headPitch = Math.max(-0.85, Math.min(0.85, rawPitch));
    }
  }

  // Obliczenie pozycji stopy z uwzględnieniem naładowania player.kickPower
  if (player.kickMode === 'SCISSOR') {
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
      const footReach = player.thighLen + player.shinLen + 2;
      player.kickingFootX = hipX + Math.sin(player.kickAngle) * footReach * player.facing;
      player.kickingFootY = hipY + Math.cos(player.kickAngle) * footReach;

      if (player.kickAngle >= 2.1) player.kickState = 'RECOVER';
    } else if (player.kickState === 'RECOVER') {
      player.kickAngle -= 0.14;
      if (player.kickAngle <= 0) {
        player.kickAngle = 0;
        player.kickState = 'IDLE';
        player.hitThisSwing = false;
        player.kickCooldown = 10;
      }
    }
  }
}

export function renderArm(ctx, shX, shY, swingAngle, elbowAngle, facing, upperCol, foreCol, isFront) {
  const upperLen = player.upperArmLen;
  const foreLen = player.forearmLen;

  const elbowX = shX + Math.sin(swingAngle) * upperLen * facing;
  const elbowY = shY + Math.cos(swingAngle) * upperLen;

  const forearmAngle = swingAngle + elbowAngle;
  const wristX = elbowX + Math.sin(forearmAngle) * foreLen * facing;
  const wristY = elbowY + Math.cos(forearmAngle) * foreLen;

  ctx.lineWidth = isFront ? 4.6 : 3.8;
  ctx.strokeStyle = upperCol;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(shX, shY); ctx.lineTo(elbowX, elbowY); ctx.stroke();

  ctx.lineWidth = isFront ? 4.0 : 3.2;
  ctx.strokeStyle = foreCol;
  ctx.beginPath(); ctx.moveTo(elbowX, elbowY); ctx.lineTo(wristX, wristY); ctx.stroke();

  ctx.fillStyle = '#ffb74d';
  ctx.beginPath(); ctx.arc(wristX, wristY, isFront ? 3.0 : 2.4, 0, Math.PI * 2); ctx.fill();
}

export function renderIKLeg(ctx, hipX, hipY, targetFootX, targetFootY, l1, l2, ankleRot, facing, colorThigh, colorShin, colorBoot) {
  const ik = solve2BoneIK(hipX, hipY, targetFootX, targetFootY, l1, l2, facing);

  ctx.strokeStyle = colorThigh;
  ctx.lineWidth = 5.5;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(hipX, hipY); ctx.lineTo(ik.kneeX, ik.kneeY); ctx.stroke();

  ctx.strokeStyle = colorShin;
  ctx.lineWidth = 4.8;
  ctx.beginPath(); ctx.moveTo(ik.kneeX, ik.kneeY); ctx.lineTo(ik.footX, ik.footY); ctx.stroke();

  ctx.save();
  ctx.translate(ik.footX, ik.footY);
  ctx.rotate(ankleRot);
  ctx.fillStyle = colorBoot;
  ctx.beginPath();
  ctx.roundRect(-4 * facing, -4, 15 * facing, 6, 2);
  ctx.fill();
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
    '#2e7d32',
    '#4caf50',
    '#d32f2f'
  );
}

export function drawPlayer(ctx, GROUND_Y) {
  ctx.save();

  const centerX = player.x + player.w / 2;
  const floorY = GROUND_Y;
  let hipX = centerX;
  const hipY = player.y + player.h - 40 + player.pelvisY;
  const speed = Math.abs(player.vx);

  let footBackTargetX, footBackTargetY, footBackAnkle;
  let footFrontTargetX, footFrontTargetY, footFrontAnkle;

  if (player.isIntro) {
    const choreo = getFreestyleChoreography(player.juggleTimer, hipX, hipY, floorY, player.facing, 12);
    hipX += choreo.hipShiftX;
    footFrontTargetX = choreo.footFrontX;
    footFrontTargetY = choreo.footFrontY;
    footFrontAnkle = choreo.footFrontAnkle;
    footBackTargetX = choreo.footBackX;
    footBackTargetY = choreo.footBackY;
    footBackAnkle = choreo.footBackAnkle;

    player.lastHipShiftX = choreo.hipShiftX;
    player.lastFootFrontX = footFrontTargetX;
    player.lastFootFrontY = footFrontTargetY;
    player.lastFootFrontAnkle = footFrontAnkle;
  } else if (player.kickMode === 'SCISSOR' && player.kickState === 'SWING') {
    // Renderowanie nożyc z uwzględnieniem player.kickPower
    const targets = getScissorLegTargets(player.scissorTimer, player.scissorDuration, hipX, hipY, player.facing, player.kickPower);
    footFrontTargetX = targets.front.x;
    footFrontTargetY = targets.front.y;
    footFrontAnkle = targets.front.ankle;

    footBackTargetX = targets.back.x;
    footBackTargetY = targets.back.y;
    footBackAnkle = targets.back.ankle;
  } else if (player.isSliding) {
    footFrontTargetX = hipX + (44 * player.facing);
    footFrontTargetY = floorY - 3;
    footFrontAnkle = 0.35 * player.facing;
    footBackTargetX = hipX - (18 * player.facing);
    footBackTargetY = floorY - 4;
    footBackAnkle = -0.55 * player.facing;
  } else if (player.isJumping) {
    footFrontTargetX = hipX + (12 * player.facing); footFrontTargetY = hipY + 32; footFrontAnkle = 0.3 * player.facing;
    footBackTargetX = hipX - (10 * player.facing); footBackTargetY = hipY + 30; footBackAnkle = -0.3 * player.facing;
  } else if (player.gaitMode === 'IDLE') {
    footFrontTargetX = hipX + (3 * player.facing);
    footFrontTargetY = floorY;
    footFrontAnkle = 0;
    footBackTargetX = hipX - (3 * player.facing);
    footBackTargetY = floorY;
    footBackAnkle = 0;
  } else {
    const legBackTraj = getBiomechanicFootTrajectory(player.stridePhase + Math.PI, player.gaitMode, speed);
    const legFrontTraj = getBiomechanicFootTrajectory(player.stridePhase, player.gaitMode, speed);
    footBackTargetX = hipX + (legBackTraj.lx * player.facing);
    footBackTargetY = floorY + legBackTraj.ly;
    footBackAnkle = legBackTraj.ankle * player.facing;
    footFrontTargetX = hipX + (legFrontTraj.lx * player.facing);
    footFrontTargetY = floorY + legFrontTraj.ly;
    footFrontAnkle = legFrontTraj.ankle * player.facing;
  }

  // Zwykłe kopnięcie z ziemi
  if (player.kickState === 'SWING' && player.kickMode === 'GROUND' && !player.isSliding) {
    const kickReach = (player.thighLen + player.shinLen) * 0.98;
    const kx = hipX + Math.sin(player.kickAngle) * kickReach * player.facing;
    const ky = hipY + Math.cos(player.kickAngle) * kickReach;

    if (player.kickLeg === 'front') {
      footFrontTargetX = kx; footFrontTargetY = ky; footFrontAnkle = (player.kickAngle - 0.5) * player.facing;
    } else {
      footBackTargetX = kx; footBackTargetY = ky; footBackAnkle = (player.kickAngle - 0.5) * player.facing;
    }
  }

  const shoulderX = hipX + (20 * Math.sin(player.torsoTilt)) * player.facing;
  const shoulderY = hipY - (20 * Math.cos(player.torsoTilt));

  let frontElbow = 0.30;
  let backElbow = 0.26;
  let frontSwing = 0.05;
  let backSwing = -0.03;

  if (player.kickMode === 'SCISSOR') {
    frontSwing = -0.35;
    frontElbow = 0.85;
    backSwing = 0.45;
    backElbow = 0.75;
  } else if (player.isIntro) {
    const armWave = Math.sin((player.juggleTimer / 22) * Math.PI);
    frontSwing = 0.16 + armWave * 0.08;
    frontElbow = 0.85;
    backSwing = -0.14 - armWave * 0.08;
    backElbow = 0.80;
  } else if (player.isSliding) {
    frontSwing = 0.85;
    frontElbow = 0.75;
    backSwing = -0.90;
    backElbow = 0.40;
  } else if (player.isCrouching) {
    const armPhase = Math.sin(player.stridePhase) + Math.cos(player.stridePhase * 2) * 0.15;
    frontSwing = -armPhase * 0.35;
    backSwing = armPhase * 0.35;
    frontElbow = 0.75;
    backElbow = 0.75;
  } else if (player.gaitMode === 'WALK') {
    const armPhase = Math.sin(player.stridePhase);
    frontSwing = -armPhase * 0.45;
    backSwing = armPhase * 0.45;
    frontElbow = 0.40;
    backElbow = 0.40;
  } else if (player.gaitMode === 'JOG') {
    const armPhase = Math.sin(player.stridePhase) + Math.cos(player.stridePhase * 2) * 0.1;
    frontSwing = -armPhase * 0.85;
    backSwing = armPhase * 0.85;
    frontElbow = 1.10;
    backElbow = 1.10;
  } else if (player.gaitMode === 'SPRINT') {
    const armPhase = Math.sin(player.stridePhase);
    frontSwing = -armPhase * 1.45;
    backSwing = armPhase * 1.45;
    frontElbow = 1.62;
    backElbow = 1.62;
  }

  // 1. TYLNA RĘKA
  renderArm(ctx, shoulderX - (2 * player.facing), shoulderY, backSwing, backElbow, player.facing, '#b71c1c', '#c62828', false);

  // 2. TYLNA NOGA
  renderIKLeg(ctx, hipX - (2 * player.facing), hipY, footBackTargetX, footBackTargetY, player.thighLen, player.shinLen, footBackAnkle, player.facing, '#1b5e20', '#2e7d32', '#212121');

  // 3. TORS I GŁOWA
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(player.torsoTilt * player.facing);
  ctx.scale(player.facing, 1);

  ctx.fillStyle = '#ffffff'; ctx.fillRect(-8, -8, 16, 11);
  ctx.fillStyle = '#e53935'; ctx.fillRect(-7, -26, 14, 20);

  ctx.save();
  ctx.translate(2, -34 + player.headBob);
  ctx.rotate(player.headPitch * 0.7);
  ctx.fillStyle = '#ffb74d';
  ctx.beginPath(); ctx.arc(0, 0, 9.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3e2723';
  ctx.beginPath(); ctx.arc(-2, -2, 10, Math.PI * 0.8, Math.PI * 1.8); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(4, 0, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.restore();

  // 4. PRZEDNIA NOGA
  renderIKLeg(ctx, hipX + (2 * player.facing), hipY, footFrontTargetX, footFrontTargetY, player.thighLen, player.shinLen, footFrontAnkle, player.facing, '#2e7d32', '#4caf50', '#d32f2f');

  // 5. PRZEDNIA RĘKA
  renderArm(ctx, shoulderX + (2 * player.facing), shoulderY, frontSwing, frontElbow, player.facing, '#e53935', '#ef5350', true);

  ctx.restore();
}
