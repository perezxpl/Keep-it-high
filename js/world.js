import { START_X } from './config.js';

export let canvas = null;
export let ctx = null;
export let W = window.innerWidth;
export let H = window.innerHeight;
export let DPR = Math.min(window.devicePixelRatio || 1, 2);
export let GROUND_Y = H - 75;

export const camera = {
  x: 160,
  y: GROUND_Y,
  targetX: 160,
  targetY: GROUND_Y,
  zoom: 0.85,
  targetZoom: 0.85,
  smoothPos: 0.08,
  smoothZoom: 0.05
};

export let currentDist = 0;
export let bestDistance = 0;

export const grassParticles = [];

export function initCanvas(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  resize();
}

export function resize(player) {
  W = window.innerWidth;
  H = window.innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas && ctx) {
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.resetTransform();
    ctx.scale(DPR, DPR);
  }
  GROUND_Y = H - 75;
  if (player) {
    player.y = GROUND_Y - player.h;
  }
}

export function updateCamera(player, ball) {
  const deltaX = Math.abs(ball.x - player.x) + 200;
  const ballHeight = Math.max(0, GROUND_Y - ball.y);
  camera.targetZoom = Math.max(0.50, Math.min(0.85, Math.min(W / (deltaX * 1.55), H / (ballHeight * 1.7 + 280))));
  camera.zoom += (camera.targetZoom - camera.zoom) * camera.smoothZoom;

  camera.targetX = (player.x * 0.45) + (ball.x * 0.55) + (player.vx * 20);
  camera.targetY = Math.min(GROUND_Y, (GROUND_Y * 0.65) + (ball.y * 0.35));
  camera.x += (camera.targetX - camera.x) * camera.smoothPos;
  camera.y += (camera.targetY - camera.y) * camera.smoothPos;
}

export function updateDistance(ballX) {
  currentDist = Math.max(0, Math.floor((ballX - START_X) / 14));
  if (currentDist > bestDistance) {
    bestDistance = currentDist;
  }
}

export function spawnGrass(x, y, dir) {
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

export function updateParticles() {
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

export function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return { dist: Math.hypot(px - x1, py - y1), t: 0 };
  let t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2));
  return { dist: Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1))), t };
}

export function resolveSegmentCollision(b, x1, y1, x2, y2, thickness, v1x, v1y, v2x, v2y, restitution, friction) {
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

export function drawSky(ctx) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, '#101a26');
  skyGrad.addColorStop(0.5, '#22384f');
  skyGrad.addColorStop(1, '#3b5875');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);
}

export function drawGround(ctx, worldLeft, worldWidth) {
  ctx.fillStyle = '#1b5e20';
  ctx.fillRect(worldLeft, GROUND_Y, worldWidth, 600);
  ctx.fillStyle = '#2e7d32';
  ctx.fillRect(worldLeft, GROUND_Y, worldWidth, 9);
}

export function drawParticles(ctx) {
  ctx.fillStyle = '#4caf50';
  for (let gp of grassParticles) {
    ctx.fillRect(gp.x, gp.y, gp.size, gp.size * 1.5);
  }
}

export function drawDistanceMarkers(ctx, worldLeft, worldRight) {
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

export function drawHUD(ctx, player, fpsDisplay, leftStick, btnCluster) {
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 20px monospace';
  ctx.fillText(`DYSTANS: ${currentDist} m`, 24, 38);
  ctx.fillStyle = '#ffeb3b';
  ctx.fillText(`REKORD:  ${bestDistance} m`, 24, 62);

  let modeCol = '#aaa';
  if (player.gaitMode === 'SLIDE') modeCol = '#00e5ff';
  else if (player.isCrouching) modeCol = '#29b6f6';
  else if (player.gaitMode === 'SPRINT') modeCol = '#ff5722';
  else if (player.gaitMode === 'JOG') modeCol = '#ffeb3b';
  else if (player.gaitMode === 'WALK') modeCol = '#4caf50';

  ctx.fillStyle = modeCol;
  ctx.font = 'bold 12px monospace';
  ctx.fillText(`STAN: ${player.gaitMode}`, 24, 84);
  ctx.fillStyle = '#888';
  ctx.fillText(`R = Przywołaj piłkę`, 24, 102);
  ctx.fillStyle = '#00e5ff';
  ctx.fillText('FPS: ' + fpsDisplay + ' (60 Hz)', 24, 120);

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
    ctx.fillStyle = player.isCrouching ? '#29b6f6' : (Math.abs(leftStick.axisX) > 0.75 ? '#ff5722' : 'rgba(255, 255, 255, 0.7)');
    ctx.fill();
  }

  // 2. TRĂ“JKÄ„T PRZYCISKĂ“W
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

    // KOPNIÄCIE / CHARGE
    ctx.beginPath();
    ctx.arc(btnCluster.kick.x, btnCluster.kick.y, btnCluster.kick.r, 0, Math.PI * 2);
    ctx.fillStyle = player.isCharging ? 'rgba(255, 235, 59, 0.35)' : 'rgba(255, 255, 255, 0.12)';
    ctx.fill();
    ctx.strokeStyle = player.isCharging ? '#ffeb3b' : 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    if (player.isCharging && player.chargePower > 0) {
      ctx.beginPath();
      ctx.arc(btnCluster.kick.x, btnCluster.kick.y, btnCluster.kick.r * player.chargePower, 0, Math.PI * 2);
      ctx.fillStyle = player.chargePower > 0.8 ? 'rgba(244, 67, 54, 0.65)' : 'rgba(255, 235, 59, 0.55)';
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(player.isCharging ? `${Math.round(player.chargePower * 100)}%` : 'KOPNIJ', btnCluster.kick.x, btnCluster.kick.y + 4);

    // WĹšLIZG
    ctx.beginPath();
    ctx.arc(btnCluster.slide.x, btnCluster.slide.y, btnCluster.slide.r, 0, Math.PI * 2);
    ctx.fillStyle = player.isSliding ? 'rgba(0, 229, 255, 0.8)' : 'rgba(255, 255, 255, 0.12)';
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