(() => {
  'use strict';

  // ==========================================
  // 1. CONFIG & STAŁE
  // ==========================================
  const CONFIG = {
    GRAVITY: 0.38,
    JUMP_FORCE: 9.8,
    ACCEL: 0.24,
    DECEL: 0.84,
    SLIDE_DECEL: 0.958,
    CROUCH_SPEED: 1.6,
    WALK_MAX: 2.2,
    JOG_MAX: 4.2,
    SPRINT_MAX: 6.8,
    SLIDE_DASH_SPEED: 9.0
  };

  const FRAME_DURATION = 1000 / 60; // 16.666 ms (dokładnie 60 FPS)
  const START_X = 160;

  // ==========================================
  // 2. ŚWIAT GRY, KAMERA, CZĄSTECZKI
  // ==========================================
  let canvas = null;
  let ctx = null;
  let W = window.innerWidth;
  let H = window.innerHeight;
  let DPR = Math.min(window.devicePixelRatio || 1, 2);
  let GROUND_Y = Math.round((H - 75) / 20) * 20;

  const camera = {
    x: 160,
    y: GROUND_Y,
    targetX: 160,
    targetY: GROUND_Y,
    zoom: 0.85,
    targetZoom: 0.85,
    smoothPos: 0.08,
    smoothZoom: 0.05
  };

  let currentDist = 0;
  let bestDistance = 0;

  const grassParticles = [];

  function initCanvas(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resize();
  }

  function resize(playerObj) {
    W = window.innerWidth;
    H = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas && ctx) {
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.resetTransform();
      ctx.scale(DPR, DPR);
    }
    GROUND_Y = Math.round((H - 75) / 20) * 20;
    if (playerObj) {
      playerObj.y = GROUND_Y - playerObj.h;
    }
  }

  function updateCamera(playerObj, ballObj) {
    const deltaX = Math.abs(ballObj.x - playerObj.x) + 200;
    const ballHeight = Math.max(0, GROUND_Y - ballObj.y);
    camera.targetZoom = Math.max(0.50, Math.min(0.85, Math.min(W / (deltaX * 1.55), H / (ballHeight * 1.7 + 280))));
    camera.zoom += (camera.targetZoom - camera.zoom) * camera.smoothZoom;

    camera.targetX = (playerObj.x * 0.45) + (ballObj.x * 0.55) + (playerObj.vx * 20);
    camera.targetY = Math.min(GROUND_Y, (GROUND_Y * 0.65) + (ballObj.y * 0.35));
    camera.x += (camera.targetX - camera.x) * camera.smoothPos;
    camera.y += (camera.targetY - camera.y) * camera.smoothPos;
  }

  function updateDistance(ballX) {
    currentDist = Math.max(0, Math.floor((ballX - START_X) / 14));
    if (currentDist > bestDistance) {
      bestDistance = currentDist;
    }
  }

  function spawnGrass(x, y, dir) {
    for (let i = 0; i < 2; i++) {
      grassParticles.push({
        x: x + (Math.random() * 8 - 4),
        y: y - 2,
        vx: -dir * (Math.random() * 3.5 + 1.2) + (Math.random() * 1.5 - 0.75),
        vy: -(Math.random() * 3.2 + 1.2),
        size: Math.random() * 2.8 + 1.6,
        life: 1.0
      });
    }
  }

  function updateParticles() {
    for (let i = grassParticles.length - 1; i >= 0; i--) {
      const gp = grassParticles[i];
      gp.x += gp.vx;
      gp.y += gp.vy;
      gp.vy += 0.25;
      gp.life -= 0.04;
      if (gp.life <= 0 || gp.y >= GROUND_Y) {
        grassParticles.splice(i, 1);
      }
    }
  }

  function dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return { dist: Math.hypot(px - x1, py - y1), t: 0 };
    let t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2));
    return { dist: Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1))), t };
  }

  function resolveSegmentCollision(b, x1, y1, x2, y2, thickness, v1x, v1y, v2x, v2y, restitution, friction) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return false;

    let t = Math.max(0, Math.min(1, ((b.x - x1) * dx + (b.y - y1) * dy) / l2));
    const px = x1 + t * dx;
    const py = y1 + t * dy;
    const d = Math.hypot(b.x - px, b.y - py);
    const minDist = b.radius + thickness;

    if (d < minDist) {
      const nx = d > 0 ? (b.x - px) / d : 0;
      const ny = d > 0 ? (b.y - py) / d : -1;
      const svx = v1x + t * (v2x - v1x);
      const svy = v1y + t * (v2y - v1y);

      const rvx = b.vx - svx;
      const rvy = b.vy - svy;
      const vn = rvx * nx + rvy * ny;

      if (vn < 0) {
        const jn = -(1 + restitution) * vn;
        const tx = -ny;
        const ty = nx;
        const vt = rvx * tx + rvy * ty;
        const jt = -vt * friction;

        b.vx += (jn * nx) + (jt * tx);
        b.vy += (jn * ny) + (jt * ty);
        b.spin += jt * 0.08;

        const pen = minDist - d;
        b.x += nx * pen;
        b.y += ny * pen;
        return true;
      }
    }
    return false;
  }

  function drawSky(ctx) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#101a26');
    skyGrad.addColorStop(0.5, '#22384f');
    skyGrad.addColorStop(1, '#3b5875');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawGround(ctx, worldLeft, worldWidth) {
    ctx.fillStyle = '#1b5e20';
    ctx.fillRect(worldLeft, GROUND_Y, worldWidth, 600);
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(worldLeft, GROUND_Y, worldWidth, 9);
  }

  function drawParticles(ctx) {
    ctx.fillStyle = '#4caf50';
    for (let gp of grassParticles) {
      ctx.fillRect(gp.x, gp.y, gp.size, gp.size * 1.5);
    }
  }

  function drawDistanceMarkers(ctx, worldLeft, worldRight) {
    const startMark = Math.floor(worldLeft / 70) * 70;
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let m = startMark; m < worldRight; m += 70) {
      const isFive = (m % 350 === 0);
      ctx.fillRect(m, GROUND_Y, isFive ? 3 : 1.5, isFive ? 18 : 8);
      if (isFive) {
        ctx.font = '11px monospace';
        ctx.fillText(`${Math.floor((m - START_X) / 14)}m`, m - 12, GROUND_Y + 30);
      }
    }
  }

  function drawHUD(ctx, playerObj, fps, leftStick, btnCluster) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 20px monospace';
    ctx.fillText(`DYSTANS: ${currentDist} m`, 24, 38);
    ctx.fillStyle = '#ffeb3b';
    ctx.fillText(`REKORD:  ${bestDistance} m`, 24, 62);

    ctx.fillStyle = '#888';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`R = Przywołaj piłkę`, 24, 84);
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('FPS: ' + fps + ' (60 Hz)', 24, 106);

    // 1. LEWY DRĄŻEK
    if (leftStick && leftStick.active) {
      ctx.beginPath();
      ctx.arc(leftStick.baseX, leftStick.baseY, leftStick.maxRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('◀ RUCH ▶', leftStick.baseX, leftStick.baseY - leftStick.maxRadius - 8);
      ctx.fillText('▼ KUCAJ / CHÓD', leftStick.baseX, leftStick.baseY + leftStick.maxRadius + 16);
      ctx.textAlign = 'left';

      const knobX = leftStick.baseX + (leftStick.axisX * leftStick.maxRadius);
      const knobY = leftStick.baseY + (leftStick.axisY * leftStick.maxRadius);
      ctx.beginPath();
      ctx.arc(knobX, knobY, 22, 0, Math.PI * 2);
      ctx.fillStyle = playerObj.isCrouching ? '#29b6f6' : (Math.abs(leftStick.axisX) > 0.75 ? '#ff5722' : 'rgba(255, 255, 255, 0.7)');
      ctx.fill();
    }

    // 2. TRÓJKĄT PRZYCISKÓW
    if (btnCluster) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(btnCluster.jump.x, btnCluster.jump.y);
      ctx.lineTo(btnCluster.kick.x, btnCluster.kick.y);
      ctx.lineTo(btnCluster.slide.x, btnCluster.slide.y);
      ctx.closePath();
      ctx.stroke();

      // SKOK
      ctx.beginPath();
      ctx.arc(btnCluster.jump.x, btnCluster.jump.y, btnCluster.jump.r, 0, Math.PI * 2);
      ctx.fillStyle = btnCluster.jump.active ? 'rgba(76, 175, 80, 0.8)' : 'rgba(255, 255, 255, 0.12)';
      ctx.fill();
      ctx.strokeStyle = '#4caf50';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SKOK', btnCluster.jump.x, btnCluster.jump.y + 4);

      // KOPNIĘCIE / CHARGE
      ctx.beginPath();
      ctx.arc(btnCluster.kick.x, btnCluster.kick.y, btnCluster.kick.r, 0, Math.PI * 2);
      ctx.fillStyle = playerObj.isCharging ? 'rgba(255, 235, 59, 0.35)' : 'rgba(255, 255, 255, 0.12)';
      ctx.fill();
      ctx.strokeStyle = playerObj.isCharging ? '#ffeb3b' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      if (playerObj.isCharging && playerObj.chargePower > 0) {
        ctx.beginPath();
        ctx.arc(btnCluster.kick.x, btnCluster.kick.y, btnCluster.kick.r * playerObj.chargePower, 0, Math.PI * 2);
        ctx.fillStyle = playerObj.chargePower > 0.8 ? 'rgba(244, 67, 54, 0.65)' : 'rgba(255, 235, 59, 0.55)';
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(playerObj.isCharging ? `${Math.round(playerObj.chargePower * 100)}%` : 'KOPNIJ', btnCluster.kick.x, btnCluster.kick.y + 4);

      // WŚLIZG
      ctx.beginPath();
      ctx.arc(btnCluster.slide.x, btnCluster.slide.y, btnCluster.slide.r, 0, Math.PI * 2);
      ctx.fillStyle = playerObj.isSliding ? 'rgba(0, 229, 255, 0.8)' : 'rgba(255, 255, 255, 0.12)';
      ctx.fill();
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('WŚLIZG', btnCluster.slide.x, btnCluster.slide.y + 4);
      ctx.textAlign = 'left';
    }
  }

  // ==========================================
  // 3. PRZESZKODY
  // ==========================================
  const obstacles = [
    { type: 'hydrant', x: 450, w: 18, h: 36, color: '#e53935' },
    { type: 'bench', x: 820, w: 54, h: 24, color: '#8d6e63' },
    { type: 'bin', x: 1250, w: 22, h: 40, color: '#546e7a' },
    { type: 'bollard', x: 1680, w: 14, h: 30, color: '#ffb300' },
    { type: 'bench', x: 2150, w: 54, h: 24, color: '#8d6e63' }
  ];

  function resolveBoxCollision(b, boxX, boxY, boxW, boxH, restitution, friction) {
    const cx = Math.max(boxX, Math.min(b.x, boxX + boxW));
    const cy = Math.max(boxY, Math.min(b.y, boxY + boxH));
    const dx = b.x - cx;
    const dy = b.y - cy;
    const d = Math.hypot(dx, dy);

    if (d < b.radius) {
      let nx, ny;
      if (d > 0) {
        nx = dx / d; ny = dy / d;
      } else {
        const leftDist = Math.abs(b.x - boxX);
        const rightDist = Math.abs(b.x - (boxX + boxW));
        const topDist = Math.abs(b.y - boxY);
        const minD = Math.min(leftDist, rightDist, topDist);
        if (minD === topDist) { nx = 0; ny = -1; }
        else if (minD === leftDist) { nx = -1; ny = 0; }
        else { nx = 1; ny = 0; }
      }

      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) {
        const jn = -(1 + restitution) * vn;
        const tx = -ny;
        const ty = nx;
        const vt = b.vx * tx + b.vy * ty;
        const jt = -vt * friction;

        b.vx += (jn * nx) + (jt * tx);
        b.vy += (jn * ny) + (jt * ty);
        b.spin += jt * 0.09;

        const pen = b.radius - d;
        b.x += nx * pen;
        b.y += ny * pen;
        return true;
      }
    }
    return false;
  }

  function checkObstacleCollisions(ballObj, groundY) {
    for (let obs of obstacles) {
      const obsY = groundY - obs.h;
      if (Math.abs(ballObj.x - (obs.x + obs.w / 2)) < obs.w + 60) {
        resolveBoxCollision(ballObj, obs.x, obsY, obs.w, obs.h, 0.72, 0.38);
      }
    }
  }

  function drawObstacles(ctx, groundY) {
    for (let obs of obstacles) {
      const oy = groundY - obs.h;
      if (obs.type === 'bench') {
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(obs.x + 4, groundY - 10, 6, 10);
        ctx.fillRect(obs.x + obs.w - 10, groundY - 10, 6, 10);
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, oy, obs.w, 10);
        ctx.fillRect(obs.x, oy - 14, obs.w, 7);
        ctx.fillStyle = '#37474f';
        ctx.fillRect(obs.x + 6, oy - 14, 4, 14);
        ctx.fillRect(obs.x + obs.w - 10, oy - 14, 4, 14);
      } else if (obs.type === 'hydrant') {
        ctx.fillStyle = obs.color;
        ctx.beginPath();
        ctx.arc(obs.x + obs.w / 2, oy + 8, obs.w / 2, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(obs.x, oy + 8, obs.w, obs.h - 8);
        ctx.fillStyle = '#c62828';
        ctx.fillRect(obs.x - 3, oy + 14, obs.w + 6, 6);
      } else if (obs.type === 'bin') {
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, oy, obs.w, obs.h);
        ctx.fillStyle = '#37474f';
        ctx.fillRect(obs.x - 2, oy, obs.w + 4, 4);
      } else if (obs.type === 'bollard') {
        ctx.fillStyle = '#37474f';
        ctx.fillRect(obs.x, oy, obs.w, obs.h);
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, oy + 6, obs.w, 8);
      }
    }
  }

  // ==========================================
  // 4. GRACZ & KINEMATYKA ODWROTNA (IK)
  // ==========================================
  const player = {
    x: 160,
    y: 0,
    vx: 0,
    vy: 0,
    w: 24,
    h: 70,
    facing: 1,

    // Segmenty kończyn
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

  function playerJump() {
    if (!player.isJumping && !player.isSliding) {
      player.vy = -CONFIG.JUMP_FORCE;
      player.isJumping = true;
      player.isCrouching = false;
    }
  }

  function playerSlide(spawnGrassFn, groundY) {
    if (!player.isJumping && !player.isSliding) {
      player.isSliding = true;
      player.slideTimer = 44;
      player.isCrouching = false;

      const curSpeed = Math.abs(player.vx);
      const isSprinting = curSpeed > 4.2;

      if (isSprinting) player.vx = player.facing * CONFIG.SLIDE_DASH_SPEED;
      else if (curSpeed > 1.2) player.vx = player.facing * 6.2;
      else player.vx = player.facing * 4.6;

      if (spawnGrassFn) {
        for (let i = 0; i < 8; i++) spawnGrassFn(player.x + player.w / 2 + (player.facing * 15), groundY, player.facing);
      }
    }
  }

  function startKickCharge() {
    if (player.isSliding) return;
    player.isCharging = true;
    player.chargePower = 0;
  }

  function executeReleaseKick() {
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

  function solve2BoneIK(hx, hy, tx, ty, l1, l2, facing) {
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

  function getSprintFootTrajectory(p) {
    const t = p / (Math.PI * 2);
    let lx, ly, ankle;

    if (t < 0.30) {
      const u = t / 0.30;
      lx = 14 - u * 42;
      ly = 0;
      ankle = 0.32 + (u * 0.42);
    } else if (t < 0.56) {
      const u = (t - 0.30) / 0.26;
      lx = -28 + u * 18;
      ly = -Math.sin(u * Math.PI * 0.5) * 28;
      ankle = 0.4 - (u * 0.3);
    } else if (t < 0.82) {
      const u = (t - 0.56) / 0.26;
      lx = -10 + u * 36;
      ly = -28 + (u * 14);
      ankle = 0.15;
    } else {
      const u = (t - 0.82) / 0.18;
      lx = 26 - u * 12;
      ly = -14 + u * 14;
      ankle = 0.32;
    }

    return { lx, ly, ankle };
  }

  function getBiomechanicFootTrajectory(phase, mode, speed) {
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

  function updatePlayer(keys, leftStick, groundY, ballObj, spawnGrassFn) {
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
      if (Math.abs(player.vx) > 1.8 && Math.random() < 0.85 && spawnGrassFn) {
        spawnGrassFn(player.x + (player.w / 2) + (player.facing * 20), groundY, player.facing);
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

    // Naturalna częstotliwość kroków (~3.2 kroku/s)
    if (!player.isSliding && player.gaitMode !== 'IDLE' && player.gaitMode !== 'CROUCH' && !player.isJumping) {
      let freq = 0.038;
      if (player.gaitMode === 'CROUCH_WALK') freq = 0.055;
      if (player.gaitMode === 'JOG') freq = 0.038;
      if (player.gaitMode === 'SPRINT') freq = 0.026;
      player.stridePhase += speed * freq;

      if (player.gaitMode === 'SPRINT' && Math.sin(player.stridePhase) > 0.85 && spawnGrassFn) {
        spawnGrassFn(player.x + player.w / 2, groundY, player.facing);
      }
    }

    // Aerodynamiczne pochylenie tułowia
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
    if (player.y >= groundY - player.h) {
      player.y = groundY - player.h;
      player.vy = 0;
      player.isJumping = false;
    }

    // Płynna oscylacja miednicy
    let targetPelvisY = 0;
    if (player.isSliding) targetPelvisY = 26;
    else if (player.isCrouching) targetPelvisY = 16;
    else if (player.gaitMode === 'IDLE') {
      targetPelvisY = -6.5;
    } else if (player.gaitMode === 'WALK') {
      targetPelvisY = -Math.abs(Math.sin(player.stridePhase)) * 1.5;
    } else if (player.gaitMode === 'JOG') {
      targetPelvisY = Math.cos(player.stridePhase * 2) * 2.5;
    } else if (player.gaitMode === 'SPRINT') {
      targetPelvisY = Math.sin(player.stridePhase * 2 - Math.PI / 2) * 3.8;
    }
    if (player.isJumping) targetPelvisY = 0;
    player.pelvisY += (targetPelvisY - player.pelvisY) * 0.15;

    // Głowa
    const hipX = player.x + player.w / 2;
    const hipY = player.y + player.h - 40 + player.pelvisY;
    const headX = hipX + (28 * Math.sin(player.torsoTilt)) * player.facing;
    const headY = hipY - (28 * Math.cos(player.torsoTilt)) - 10;
    if (ballObj) {
      const dxBall = (ballObj.x - headX) * player.facing;
      const dyBall = ballObj.y - headY;
      const rawPitch = Math.atan2(dyBall, dxBall);
      if (player.gaitMode === 'IDLE') {
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

  function renderArm(ctx, shX, shY, swingAngle, elbowAngle, facing, upperCol, foreCol, isFront) {
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

  function renderIKLeg(ctx, hipX, hipY, targetFootX, targetFootY, l1, l2, ankleRot, facing, colorThigh, colorShin, colorBoot) {
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

  function drawPlayer(ctx, groundY) {
    ctx.save();

    const centerX = player.x + player.w / 2;
    const floorY = groundY;
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
      frontElbow = 1.48;
      backElbow = 1.48;
      const armPhase = Math.sin(player.stridePhase);
      frontSwing = -armPhase * armAmp;
      backSwing = armPhase * armAmp;
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

    // 5. PRZEDNIA RĘKA
    renderArm(ctx, shoulderX + (2 * player.facing), shoulderY, frontSwing, frontElbow, player.facing, '#e53935', '#ef5350', true);

    ctx.restore();
  }

  // ==========================================
  // 5. PIŁKA & FIZYKA KOLIZJI
  // ==========================================
  const ball = {
    x: 220,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 12,
    rotation: 0,
    spin: 0
  };

  function resetBallToPlayer(playerObj, groundY) {
    ball.x = playerObj.x + (25 * playerObj.facing);
    ball.y = groundY - ball.radius;
    ball.vx = playerObj.vx;
    ball.vy = 0;
    ball.spin = 0;
  }

  function updateBall(groundY) {
    ball.vy += CONFIG.GRAVITY;
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Odbicie i toczenie się po trawie
    if (ball.y + ball.radius >= groundY) {
      ball.y = groundY - ball.radius;
      if (Math.abs(ball.vy) > 0.8) {
        ball.vy = -ball.vy * 0.58;
      } else {
        ball.vy = 0;
      }
      ball.vx *= 0.985;
      ball.spin *= 0.94;
      ball.rotation += (ball.vx * 0.08);
    } else {
      // W powietrzu
      ball.vx *= 0.998;
      ball.rotation += ball.spin + (ball.vx * 0.04);
      ball.spin *= 0.96;
    }
  }

  function checkBallPlayerCollisions(playerObj, groundY, spawnGrassFn) {
    const hipX = playerObj.x + playerObj.w / 2;
    const hipY = playerObj.y + playerObj.h - 40 + playerObj.pelvisY;
    const speed = Math.abs(playerObj.vx);

    let fFrontTargetX, fFrontTargetY, fBackTargetX, fBackTargetY;

    if (playerObj.isSliding) {
      fFrontTargetX = hipX + (46 * playerObj.facing);
      fFrontTargetY = groundY - 4;
      fBackTargetX = hipX - (18 * playerObj.facing);
      fBackTargetY = groundY - 3;
    } else if (playerObj.gaitMode === 'IDLE' && !playerObj.isJumping) {
      fFrontTargetX = hipX + (3 * playerObj.facing);
      fFrontTargetY = groundY;
      fBackTargetX = hipX - (3 * playerObj.facing);
      fBackTargetY = groundY;
    } else {
      const legBackTraj = getBiomechanicFootTrajectory(playerObj.stridePhase + Math.PI, playerObj.gaitMode, speed);
      const legFrontTraj = getBiomechanicFootTrajectory(playerObj.stridePhase, playerObj.gaitMode, speed);
      fBackTargetX = hipX + (legBackTraj.lx * playerObj.facing);
      fBackTargetY = groundY + legBackTraj.ly;
      fFrontTargetX = hipX + (legFrontTraj.lx * playerObj.facing);
      fFrontTargetY = groundY + legFrontTraj.ly;
    }

    const ikBack = solve2BoneIK(hipX - (2 * playerObj.facing), hipY, fBackTargetX, fBackTargetY, playerObj.thighLen, playerObj.shinLen, playerObj.facing);
    const ikFront = solve2BoneIK(hipX + (2 * playerObj.facing), hipY, fFrontTargetX, fFrontTargetY, playerObj.thighLen, playerObj.shinLen, playerObj.facing);

    // 1. Podbicie klinem we wślizgu
    if (playerObj.isSliding) {
      const slideHit = distToSegment(ball.x, ball.y, hipX, hipY, fFrontTargetX, fFrontTargetY);
      if (slideHit.dist < ball.radius + 12) {
        const scoopPower = 7.8 + Math.abs(playerObj.vx) * 0.45;
        ball.vy = -scoopPower;
        ball.vx = (playerObj.facing * 3.2) + (playerObj.vx * 0.45);
        ball.spin = playerObj.facing * 0.6;
        ball.y = Math.min(ball.y, groundY - ball.radius - 8);
        if (spawnGrassFn) {
          spawnGrassFn(ball.x, groundY, playerObj.facing);
        }
      }
    } else {
      // Normalne zderzenia z nogami (drybling i odbicia z ziemi i powietrza)
      resolveSegmentCollision(ball, hipX, hipY, ikBack.kneeX, ikBack.kneeY, 7.5, playerObj.vx, playerObj.vy, playerObj.vx, playerObj.vy, 0.55, 0.4);
      resolveSegmentCollision(ball, ikBack.kneeX, ikBack.kneeY, ikBack.footX, ikBack.footY, 8.5, playerObj.vx, playerObj.vy, playerObj.vx, playerObj.vy, 0.65, 0.45);
      resolveSegmentCollision(ball, hipX, hipY, ikFront.kneeX, ikFront.kneeY, 7.5, playerObj.vx, playerObj.vy, playerObj.vx, playerObj.vy, 0.55, 0.4);
      resolveSegmentCollision(ball, ikFront.kneeX, ikFront.kneeY, ikFront.footX, ikFront.footY, 8.5, playerObj.vx, playerObj.vy, playerObj.vx, playerObj.vy, 0.65, 0.45);
    }

    // 2. Aktywny wykop
    if ((playerObj.kickState === 'SWING' || playerObj.kickBufferTimer > 0) && !playerObj.hitThisSwing) {
      const footReach = playerObj.thighLen + playerObj.shinLen;
      const kAngle = playerObj.kickState === 'SWING' ? playerObj.kickAngle : 0.6;
      const kFootX = hipX + Math.sin(kAngle) * footReach * playerObj.facing;
      const kFootY = hipY + Math.cos(kAngle) * footReach;

      const dFoot = Math.hypot(ball.x - kFootX, ball.y - kFootY);
      if (dFoot < ball.radius + 20) {
        playerObj.hitThisSwing = true;
        playerObj.kickBufferTimer = 0;
        const kickPower = 7.2 + (playerObj.chargePower * 7.5);
        ball.vx = (playerObj.facing * 2.8) + (playerObj.vx * 0.6);
        ball.vy = -kickPower;
        ball.spin = playerObj.facing * 0.5;
        playerObj.chargePower = 0;
      }
    }
  }

  function drawBall(ctx) {
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.rotation);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#222';
    for (let a = 0; a < 3; a++) {
      ctx.beginPath();
      ctx.arc(Math.cos(a * 2.1) * 5, Math.sin(a * 2.1) * 5, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ==========================================
  // 6. KONTROLERY DOTYKOWE I STEROWANIE
  // ==========================================
  const leftStick = {
    active: false, id: null, baseX: 0, baseY: 0, curX: 0, curY: 0,
    axisX: 0, axisY: 0, maxRadius: 55
  };

  const btnCluster = {
    centerX: 0, centerY: 0,
    jump: { x: 0, y: 0, r: 28, active: false, id: null },
    kick: { x: 0, y: 0, r: 32, active: false, id: null },
    slide: { x: 0, y: 0, r: 28, active: false, id: null }
  };

  const keys = { left: false, right: false, down: false, up: false, space: false, slide: false };

  function updateButtonLayout() {
    btnCluster.centerX = W - 110;
    btnCluster.centerY = H - 95;
    btnCluster.jump.x = btnCluster.centerX;
    btnCluster.jump.y = btnCluster.centerY - 46;
    btnCluster.kick.x = btnCluster.centerX - 46;
    btnCluster.kick.y = btnCluster.centerY + 18;
    btnCluster.slide.x = btnCluster.centerX + 46;
    btnCluster.slide.y = btnCluster.centerY + 18;
  }

  // ==========================================
  // 7. INICJALIZACJA I EVENT LISTENERS
  // ==========================================
  const canvasEl = document.getElementById('game');
  initCanvas(canvasEl);
  resize(player);
  updateButtonLayout();
  resetBallToPlayer(player, GROUND_Y);

  window.addEventListener('resize', () => {
    resize(player);
    updateButtonLayout();
  });

  // Obsługa Touch
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const midX = W / 2;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];

      if (t.clientX < midX && !leftStick.active) {
        leftStick.active = true;
        leftStick.id = t.identifier;
        leftStick.baseX = t.clientX; leftStick.baseY = t.clientY;
        leftStick.curX = t.clientX; leftStick.curY = t.clientY;
        leftStick.axisX = 0; leftStick.axisY = 0;
      }

      if (t.clientX >= midX) {
        if (dist(t.clientX, t.clientY, btnCluster.jump.x, btnCluster.jump.y) < btnCluster.jump.r + 14) {
          btnCluster.jump.active = true; btnCluster.jump.id = t.identifier;
          playerJump();
        } else if (dist(t.clientX, t.clientY, btnCluster.kick.x, btnCluster.kick.y) < btnCluster.kick.r + 14) {
          btnCluster.kick.active = true; btnCluster.kick.id = t.identifier;
          startKickCharge();
        } else if (dist(t.clientX, t.clientY, btnCluster.slide.x, btnCluster.slide.y) < btnCluster.slide.r + 14) {
          btnCluster.slide.active = true; btnCluster.slide.id = t.identifier;
          playerSlide(spawnGrass, GROUND_Y);
        }
      }
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (leftStick.active && t.identifier === leftStick.id) {
        leftStick.curX = t.clientX; leftStick.curY = t.clientY;
        const dx = leftStick.curX - leftStick.baseX;
        const dy = leftStick.curY - leftStick.baseY;
        leftStick.axisX = Math.abs(dx) > 6 ? Math.sign(dx) * Math.min(Math.abs(dx) / leftStick.maxRadius, 1.0) : 0;
        leftStick.axisY = Math.abs(dy) > 6 ? Math.sign(dy) * Math.min(Math.abs(dy) / leftStick.maxRadius, 1.0) : 0;
      }
    }
  }, { passive: false });

  function endTouch(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (leftStick.active && t.identifier === leftStick.id) {
        leftStick.active = false; leftStick.id = null;
        leftStick.axisX = 0; leftStick.axisY = 0;
      }
      if (btnCluster.jump.active && t.identifier === btnCluster.jump.id) {
        btnCluster.jump.active = false; btnCluster.jump.id = null;
      }
      if (btnCluster.kick.active && t.identifier === btnCluster.kick.id) {
        btnCluster.kick.active = false; btnCluster.kick.id = null;
        executeReleaseKick();
      }
      if (btnCluster.slide.active && t.identifier === btnCluster.slide.id) {
        btnCluster.slide.active = false; btnCluster.slide.id = null;
      }
    }
  }
  canvas.addEventListener('touchend', endTouch, { passive: false });
  canvas.addEventListener('touchcancel', endTouch, { passive: false });

  // Klawiatura PC
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
    if ((e.code === 'KeyW' || e.code === 'ArrowUp') && !keys.up) {
      keys.up = true; playerJump();
    }
    if (e.code === 'Space' && !keys.space) {
      keys.space = true; startKickCharge();
    }
    if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') && !keys.slide) {
      keys.slide = true; playerSlide(spawnGrass, GROUND_Y);
    }
    if (e.code === 'KeyR') resetBallToPlayer(player, GROUND_Y);
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = false;
    if (e.code === 'Space') {
      keys.space = false; executeReleaseKick();
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') keys.slide = false;
  });

  // Mysz PC
  canvas.addEventListener('mousedown', (e) => {
    if (dist(e.clientX, e.clientY, btnCluster.jump.x, btnCluster.jump.y) < btnCluster.jump.r) playerJump();
    else if (dist(e.clientX, e.clientY, btnCluster.kick.x, btnCluster.kick.y) < btnCluster.kick.r) startKickCharge();
    else if (dist(e.clientX, e.clientY, btnCluster.slide.x, btnCluster.slide.y) < btnCluster.slide.r) playerSlide(spawnGrass, GROUND_Y);
  });
  window.addEventListener('mouseup', () => {
    if (player.isCharging) executeReleaseKick();
  });

  // ==========================================
  // 8. AKTUALIZACJA I RENDEROWANIE
  // ==========================================
  function update() {
    updatePlayer(keys, leftStick, GROUND_Y, ball, spawnGrass);
    updateParticles();
    updateBall(GROUND_Y);
    checkBallPlayerCollisions(player, GROUND_Y, spawnGrass);
    checkObstacleCollisions(ball, GROUND_Y);
    updateCamera(player, ball);
    updateDistance(ball.x);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Niebo
    drawSky(ctx);

    // Świat gry w przestrzeni kamery
    ctx.save();
    ctx.translate(W * 0.40, H * 0.68);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    const worldLeft = camera.x - (W / camera.zoom);
    const worldRight = camera.x + (W / camera.zoom) * 2;
    const worldWidth = worldRight - worldLeft;

    // Murawa i cząsteczki darni
    drawGround(ctx, worldLeft, worldWidth);
    drawParticles(ctx);

    // Metry
    drawDistanceMarkers(ctx, worldLeft, worldRight);

    // Obiekty świata gry
    drawObstacles(ctx, GROUND_Y);
    drawPlayer(ctx, GROUND_Y);
    drawBall(ctx);

    ctx.restore();

    // Interfejs użytkownika i kontrolki
    drawHUD(ctx, player, fpsDisplay, leftStick, btnCluster);
  }

  // ==========================================
  // 9. PĘTLA GRY 60 HZ (FRAMERATRE INDEPENDENT)
  // ==========================================
  let lastTime = performance.now();
  let fpsDisplay = 60;
  let fpsCount = 0;
  let lastFpsTime = performance.now();

  function loop() {
    requestAnimationFrame(loop);

    const now = performance.now();
    const delta = now - lastTime;

    // Odrzucenie nadmiarowych wywołań na ekranach 120Hz/144Hz/165Hz/240Hz+
    if (delta < FRAME_DURATION - 0.5) {
      return;
    }

    // Zabezpieczenie przed uśpieniem karty ("Spiral of Death")
    if (delta > 250) {
      lastTime = now;
    } else {
      lastTime += FRAME_DURATION;
      if (now - lastTime > FRAME_DURATION) {
        lastTime = now;
      }
    }

    // Licznik FPS
    fpsCount++;
    if (now - lastFpsTime >= 1000) {
      fpsDisplay = Math.round((fpsCount * 1000) / (now - lastFpsTime));
      fpsCount = 0;
      lastFpsTime = now;
    }

    update();
    draw();
  }

  // Start pętli
  requestAnimationFrame(loop);
})();
