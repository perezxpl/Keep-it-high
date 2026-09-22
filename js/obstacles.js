// Przeszkody
export const obstacles = [
  { type: 'hydrant', x: 450, w: 18, h: 36, color: '#e53935' },
  { type: 'bench', x: 820, w: 54, h: 24, color: '#8d6e63' },
  { type: 'bin', x: 1250, w: 22, h: 40, color: '#546e7a' },
  { type: 'bollard', x: 1680, w: 14, h: 30, color: '#ffb300' },
  { type: 'bench', x: 2150, w: 54, h: 24, color: '#8d6e63' }
];

export function resolveBoxCollision(b, boxX, boxY, boxW, boxH, restitution, friction) {
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

export function checkObstacleCollisions(ball, GROUND_Y) {
  for (let obs of obstacles) {
    const obsY = GROUND_Y - obs.h;
    if (Math.abs(ball.x - (obs.x + obs.w / 2)) < obs.w + 60) {
      resolveBoxCollision(ball, obs.x, obsY, obs.w, obs.h, 0.72, 0.38);
    }
  }
}

export function drawObstacles(ctx, GROUND_Y) {
  for (let obs of obstacles) {
    const oy = GROUND_Y - obs.h;
    if (obs.type === 'bench') {
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(obs.x + 4, GROUND_Y - 10, 6, 10);
      ctx.fillRect(obs.x + obs.w - 10, GROUND_Y - 10, 6, 10);
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