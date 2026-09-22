import { CONFIG } from './config.js';

// Gracz (wydĹ‚uĹĽone proporcje atletyczne zapobiegajÄ…ce blokadzie kroku)
export const player = {
  x: 160,
  y: 0,
  vx: 0,
  vy: 0,
  w: 24,
  h: 70,
  facing: 1,

  // Segmenty koĹ„czyn
  thighLen: 25,
  shinLen: 24,
  upperArmLen: 14,
  forearmLen: 13,

  // Lokomocja
  stridePhase: 0,
  pelvisY: -6.5,
  torsoTilt: 0,
  torsoTiltVel: 0,
  gaitMode: 'IDLE',

  // Stany
  isCrouching: false,
  isJumping: false,
  isSliding: false,
  slideTimer: 0,

  // Wykop
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
  if (!player.isJumping && !player.isSliding) {
    player.vy = -CONFIG.JUMP_FORCE;
    player.isJumping = true;
    player.isCrouching = false;
  }
}

export function playerSlide(spawnGrass, GROUND_Y) {
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
  player.isCharging = true;
  player.chargePower = 0;
}

export function executeReleaseKick() {
  if (!player.isCharging) return;
  player.isCharging = false;

  player.kickLeg = player.nextLeg;
  player.kickState = 'SWING';
  player.hitThisSwing = false;
  player.kickAngle = 0;
  player.kickBufferTimer = 14;

  player.swingSpeed = 0.14 + (player.chargePower * 0.12);
  player.nextLeg = (player.kickLeg === 'front') ? 'back' : 'front';
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
  const t = p / (Math.PI * 2); // 0.0 do 1.0
  let lx, ly, ankle;

  // Stance trwa tylko 30% cyklu (krĂłtki, sprÄ™ĹĽysty kontakt pod biodrem)
  if (t < 0.30) {
    // 1. FAZA PODPARCIA (STANCE): Rozpoczyna siÄ™ pod biodrem i napÄ™dza w tyĹ‚
    const u = t / 0.30;
    lx = 14 - u * 42; // PotÄ™ĹĽny zakres od +14 aĹĽ do -28 px!
    ly = 0;           // Na podĹ‚oĹĽu
    ankle = 0.32 + (u * 0.42);
  } else if (t < 0.56) {
    // 2. PODCIÄ„GNIÄCIE PIÄTY POD POĹšLADEK: Stopa bĹ‚yskawicznie skĹ‚ada siÄ™ wysoko!
    const u = (t - 0.30) / 0.26;
    lx = -28 + u * 18;                     // od -28 do -10
    ly = -Math.sin(u * Math.PI * 0.5) * 28; // SkĹ‚adana aĹĽ 28 px pod poĹ›ladek!
    ankle = 0.4 - (u * 0.3);
  } else if (t < 0.82) {
    // 3. ATAKUJÄ„CY WYSUW KROKU (KNEE DRIVE): Udo szybuje w przĂłd
    const u = (t - 0.56) / 0.26;
    lx = -10 + u * 36;                     // od -10 aĹĽ do +26 px!
    ly = -28 + (u * 14);                   // schodzi z -28 do -14
    ankle = 0.15;
  } else {
    // 4. ZEJĹšCIE NA GRUNT (CLAW STRIKE): LÄ…dowanie sprÄ™ĹĽyste na przedstopiu
    const u = (t - 0.82) / 0.18;
    lx = 26 - u * 12;                      // z +26 do +14 px
    ly = -14 + u * 14;                     // z -14 do 0
    ankle = 0.32;
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
      const t = p / stanceLimit;
      lx = (0.5 - t) * strideLen * 2;
      ly = 0;
      if (t < 0.25) ankle = -0.35 * (1 - t / 0.25);
      else if (t < 0.70) ankle = 0;
      else ankle = 0.65 * ((t - 0.70) / 0.30);
    } else {
      const t = (p - stanceLimit) / (Math.PI * 2 - stanceLimit);
      lx = (-0.5 + t) * strideLen * 2;
      ly = -Math.sin(t * Math.PI) * stepHeight;
      ankle = 0.2 * Math.sin(t * Math.PI);
    }
  } else if (mode === 'JOG') {
    const stanceRatio = 0.44;
    const stanceLimit = Math.PI * 2 * stanceRatio;
    const strideLen = 25 + ((speed - CONFIG.WALK_MAX) / (CONFIG.JOG_MAX - CONFIG.WALK_MAX)) * 8;
    const stepHeight = 15;

    if (p < stanceLimit) {
      const t = p / stanceLimit;
      lx = (0.5 - t) * strideLen * 2;
      ly = Math.sin(t * Math.PI) * 2.0;
      if (t < 0.3) ankle = -0.15 * (1 - t / 0.3);
      else ankle = 0.75 * ((t - 0.3) / 0.7);
    } else {
      const t = (p - stanceLimit) / (Math.PI * 2 - stanceLimit);
      lx = (-0.5 + t) * strideLen * 2;
      ly = -Math.sin(t * Math.PI) * stepHeight;
      ankle = 0.35 * Math.sin(t * Math.PI);
    }
  }

  return { lx, ly, ankle };
}

export function updatePlayer(keys, leftStick, GROUND_Y, ball, spawnGrass) {
  if (player.kickBufferTimer > 0) player.kickBufferTimer--;

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

  if (inputAxisX > 0.1 && !player.isSliding) player.facing = 1;
  else if (inputAxisX < -0.1 && !player.isSliding) player.facing = -1;

  player.isCrouching = (inputAxisY > 0.45 || keys.down) && !player.isSliding && !player.isJumping;

  // Ruch poziomy
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
    let targetTopSpeed;
    if (player.isCrouching) {
      targetTopSpeed = CONFIG.CROUCH_SPEED;
    } else {
      const isSprint = Math.abs(inputAxisX) > 0.75;
      if (isSprint) targetTopSpeed = CONFIG.SPRINT_MAX;
      else if (Math.abs(inputAxisX) > 0.45) targetTopSpeed = CONFIG.JOG_MAX;
      else targetTopSpeed = CONFIG.WALK_MAX;
    }

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

  // Naturalna czÄ™stotliwoĹ›Ä‡ krokĂłw (atletyczne tempo ~3.2 kroku/s)
  if (!player.isSliding && player.gaitMode !== 'IDLE' && player.gaitMode !== 'CROUCH' && !player.isJumping) {
    let freq = 0.038;
    if (player.gaitMode === 'CROUCH_WALK') freq = 0.055;
    if (player.gaitMode === 'JOG') freq = 0.038;
    if (player.gaitMode === 'SPRINT') freq = 0.026;
    player.stridePhase += speed * freq;

    if (player.gaitMode === 'SPRINT' && Math.sin(player.stridePhase) > 0.85 && spawnGrass) {
      spawnGrass(player.x + player.w / 2, GROUND_Y, player.facing);
    }
  }

  // Aerodynamiczne pochylenie tuĹ‚owia (w IDLE w 100% pionowe)
  let targetTilt = 0;
  if (player.isSliding) targetTilt = -0.72 * player.facing;
  else if (player.isCrouching) targetTilt = 0.24 * player.facing;
  else if (player.isJumping) targetTilt = 0.08 * player.facing;
  else if (player.gaitMode === 'IDLE') targetTilt = 0;
  else {
    if (player.gaitMode === 'WALK') targetTilt = (speed / CONFIG.WALK_MAX) * 0.06;
    else if (player.gaitMode === 'JOG') targetTilt = 0.12 + ((speed - CONFIG.WALK_MAX) / 2.0) * 0.08;
    else if (player.gaitMode === 'SPRINT') targetTilt = 0.24 + ((speed - CONFIG.JOG_MAX) / 2.6) * 0.10;
    targetTilt *= player.facing * Math.sign(player.vx || player.facing);
  }

  const tiltForce = (targetTilt - player.torsoTilt) * 0.20;
  player.torsoTiltVel = (player.torsoTiltVel + tiltForce) * 0.75;
  player.torsoTilt += player.torsoTiltVel;
  if (player.gaitMode === 'IDLE' && Math.abs(player.torsoTilt) < 0.003) {
    player.torsoTilt = 0;
    player.torsoTiltVel = 0;
  }

  // Grawitacja gracza
  player.vy += CONFIG.GRAVITY;
  player.y += player.vy;
  if (player.y >= GROUND_Y - player.h) {
    player.y = GROUND_Y - player.h;
    player.vy = 0;
    player.isJumping = false;
  }

  // PĹ‚ynna oscylacja miednicy (w IDLE wyprostowana sylwetka: 46.5 px nad ziemiÄ…)
  let targetPelvisY = 0;
  if (player.isSliding) targetPelvisY = 26;
  else if (player.isCrouching) targetPelvisY = 16;
  else if (player.gaitMode === 'IDLE') {
    targetPelvisY = -6.5; // miednica na wysokoĹ›ci 46.5 px nad ziemiÄ… (40 - (-6.5))
  } else if (player.gaitMode === 'WALK') {
    targetPelvisY = -Math.abs(Math.sin(player.stridePhase)) * 1.5;
  } else if (player.gaitMode === 'JOG') {
    targetPelvisY = Math.cos(player.stridePhase * 2) * 2.5;
  } else if (player.gaitMode === 'SPRINT') {
    // PĹ‚ynny wznios w locie (-4px) i amortyzacja (+2px)
    targetPelvisY = Math.sin(player.stridePhase * 2 - Math.PI / 2) * 3.8;
  }
  if (player.isJumping) targetPelvisY = 0;
  player.pelvisY += (targetPelvisY - player.pelvisY) * 0.15;

  // GĹ‚owa
  const hipX = player.x + player.w / 2;
  const hipY = player.y + player.h - 40 + player.pelvisY;
  const headX = hipX + (28 * Math.sin(player.torsoTilt)) * player.facing;
  const headY = hipY - (28 * Math.cos(player.torsoTilt)) - 10;
  if (ball) {
    const dxBall = (ball.x - headX) * player.facing;
    const dyBall = ball.y - headY;
    const rawPitch = Math.atan2(dyBall, dxBall);
    if (player.gaitMode === 'IDLE') {
      // W IDLE: gĹ‚owa patrzy przed siebie z subtelnym zerkniÄ™ciem ku piĹ‚ce (max Â±0.22 rad)
      player.headPitch = Math.max(-0.22, Math.min(0.22, rawPitch * 0.35));
    } else {
      player.headPitch = Math.max(-0.85, Math.min(0.85, rawPitch));
    }
  }

  // Wykop
  if (player.kickState === 'SWING') {
    player.kickAngle += player.swingSpeed;
    if (player.kickAngle >= 2.1) player.kickState = 'RECOVER';
  } else if (player.kickState === 'RECOVER') {
    player.kickAngle -= 0.13;
    if (player.kickAngle <= 0) {
      player.kickAngle = 0;
      player.kickState = 'IDLE';
      player.hitThisSwing = false;
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

export function drawPlayer(ctx, GROUND_Y) {
  ctx.save();

  const centerX = player.x + player.w / 2;
  const floorY = GROUND_Y;
  const hipX = centerX;
  const hipY = player.y + player.h - 40 + player.pelvisY;
  const speed = Math.abs(player.vx);

  let footBackTargetX, footBackTargetY, footBackAnkle;
  let footFrontTargetX, footFrontTargetY, footFrontAnkle;

  if (player.isSliding) {
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

  if (player.kickState === 'SWING' && !player.isSliding) {
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

  let armAmp = 0;
  let frontElbow = 0.30;
  let backElbow = 0.26;
  let frontSwing = 0.05;
  let backSwing = -0.03;

  if (player.isSliding) {
    frontSwing = 0.85;
    frontElbow = 0.75;
    backSwing = -0.90;
    backElbow = 0.40;
  } else if (player.isCrouching) {
    armAmp = 0.35;
    frontElbow = 0.75;
    backElbow = 0.75;
    const armPhase = Math.sin(player.stridePhase);
    frontSwing = -armPhase * armAmp;
    backSwing = armPhase * armAmp;
  } else if (player.gaitMode === 'WALK') {
    armAmp = 0.45;
    frontElbow = 0.40;
    backElbow = 0.40;
    const armPhase = Math.sin(player.stridePhase);
    frontSwing = -armPhase * armAmp;
    backSwing = armPhase * armAmp;
  } else if (player.gaitMode === 'JOG') {
    armAmp = 0.85;
    frontElbow = 1.10;
    backElbow = 1.10;
    const armPhase = Math.sin(player.stridePhase);
    frontSwing = -armPhase * armAmp;
    backSwing = armPhase * armAmp;
  } else if (player.gaitMode === 'SPRINT') {
    armAmp = 1.25;
    frontElbow = 1.48; // ~85Â° (80-90Â°)
    backElbow = 1.48;  // ~85Â° (80-90Â°)
    const armPhase = Math.sin(player.stridePhase);
    frontSwing = -armPhase * armAmp;
    backSwing = armPhase * armAmp;
  }

  // 1. TYLNA RÄKA (kontralateralny wymach)
  renderArm(ctx, shoulderX - (2 * player.facing), shoulderY, backSwing, backElbow, player.facing, '#b71c1c', '#c62828', false);

  // 2. TYLNA NOGA
  renderIKLeg(ctx, hipX - (2 * player.facing), hipY, footBackTargetX, footBackTargetY, player.thighLen, player.shinLen, footBackAnkle, player.facing, '#1b5e20', '#2e7d32', '#212121');

  // 3. TORS I GĹOWA
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(player.torsoTilt * player.facing);
  ctx.scale(player.facing, 1);

  ctx.fillStyle = '#ffffff'; ctx.fillRect(-8, -8, 16, 11);
  ctx.fillStyle = '#e53935'; ctx.fillRect(-7, -26, 14, 20);

  ctx.save();
  ctx.translate(2, -34);
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

  // 5. PRZEDNIA RÄKA (kontralateralny wymach)
  renderArm(ctx, shoulderX + (2 * player.facing), shoulderY, frontSwing, frontElbow, player.facing, '#e53935', '#ef5350', true);

  ctx.restore();
}