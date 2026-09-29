// =========================================================================
// WORLD.JS - MODUŁ ZAMKNIĘTEJ ARENY BOJOWEJ + SYSTEM GORE & KINEMATYKA ŚMIERCI
// =========================================================================

import { CONFIG, START_X, ARENA_LEFT, ARENA_RIGHT, ARENA_WIDTH } from './config.js';
import { activeArenaId, arenaScore, arena1State, ARENA_PLATFORMS, customObstacles } from './obstacles.js';

export const goalCelebration = {
  active: false,
  timer: 0,
  team: '',
  color: '#06b6d4'
};

export function triggerGoalCelebration(team, color) {
  goalCelebration.active = true;
  goalCelebration.timer = 110;
  goalCelebration.team = team;
  goalCelebration.color = color || (team === 'CYAN' ? '#06b6d4' : '#f97316');
}

export let canvas = null;
export let ctx = null;
export let W = window.innerWidth;
export let H = window.innerHeight;
export let DPR = Math.min(window.devicePixelRatio || 1, 2);
export let GROUND_Y = H - 75;

export const camera = {
  x: START_X + 400,
  y: GROUND_Y,
  targetX: START_X + 400,
  targetY: GROUND_Y,
  zoom: 0.70,
  targetZoom: 0.70,
  smoothPos: 0.08,
  smoothZoom: 0.04,
  shakeIntensity: 0,
  shakeDecay: 0.88,
  shakeX: 0,
  shakeY: 0
};

export function triggerScreenShake(intensity) {
  camera.shakeIntensity = Math.min(26, Math.max(camera.shakeIntensity, intensity));
}

// =========================================================================
// SYSTEM HITSTOP (ZAMROŻENIE KLATKI PRZY EFEKTOWNEJ ŚMIERCI)
// =========================================================================
export let hitstopFrames = 0;
export function triggerHitstop(frames = 5) {
  hitstopFrames = Math.max(hitstopFrames, frames);
}
export function consumeHitstop() {
  if (hitstopFrames > 0) {
    hitstopFrames--;
    return true;
  }
  return false;
}

export let currentDist = 0;
export let bestDistance = 0;
export const grassParticles = [];

// =========================================================================
// INTERFEJS WYBORU BRONI W DOLNYM LEWYM ROGU (PIONOWE MAŁE IKONY)
// =========================================================================
export const weaponButtons = [
  { id: 'AK47', name: 'AK', type: 'AUTO', x: 20, y: 0, w: 46, h: 26 },
  { id: 'SHOTGUN', name: 'SG', type: 'SEMI', x: 20, y: 0, w: 46, h: 26 }
];

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
    if (player.y >= GROUND_Y - player.h - 5) {
      player.y = GROUND_Y - player.h;
    }
  }
}

export function updateCamera(player, ball) {
  camera.targetZoom = 0.75;
  camera.zoom += (camera.targetZoom - camera.zoom) * camera.smoothZoom;

  camera.targetX = (player.x + player.w / 2) + (player.vx * 12);
  camera.targetY = player.y + 20;

  if (camera.shakeIntensity > 0.1) {
    camera.shakeX = (Math.random() * 2 - 1) * camera.shakeIntensity;
    camera.shakeY = (Math.random() * 2 - 1) * camera.shakeIntensity;
    camera.shakeIntensity *= camera.shakeDecay;
  } else {
    camera.shakeIntensity = 0;
    camera.shakeX = 0;
    camera.shakeY = 0;
  }

  camera.x += (camera.targetX - camera.x) * camera.smoothPos + camera.shakeX;
  camera.y += (camera.targetY - camera.y) * camera.smoothPos + camera.shakeY;
}

export function updateDistance(ballX) {
  currentDist = Math.max(0, Math.floor((ballX - START_X) / 14));
  if (currentDist > bestDistance) {
    bestDistance = currentDist;
  }
}

export function spawnGrass(x, y, dir) {
  const colors = ['#166534', '#78350f', '#f59e0b', '#334155'];
  for (let i = 0; i < 2; i++) {
    grassParticles.push({
      x: x + (Math.random() * 8 - 4),
      y: y - 2,
      vx: -dir * (Math.random() * 3.5 + 1.2) + (Math.random() * 1.5 - 0.75),
      vy: -(Math.random() * 3.2 + 1.2),
      size: Math.random() * 2.8 + 1.6,
      life: 1.0,
      color: colors[Math.floor(Math.random() * colors.length)]
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

export function drawParticles(ctx) {
  for (const gp of grassParticles) {
    ctx.fillStyle = gp.color || '#166534';
    ctx.fillRect(gp.x, gp.y, gp.size, gp.size * 1.5);
  }
}

// =========================================================================
// SYSTEM GORE: KREW, PLAMY, ODCIĘTA GŁOWA, GIBS I UPUSZCZONA BROŃ
// =========================================================================
export const bloodParticles = [];
export const bloodDecals = [];
export const headGibs = [];
export const bodyGibs = [];
export const droppedWeapons = [];

export function clearGore() {
  bloodParticles.length = 0;
  headGibs.length = 0;
  bodyGibs.length = 0;
  droppedWeapons.length = 0;
}

export function spawnBloodSpurt(x, y, dirX, dirY, count = 10, speedMult = 1.0) {
  if (!CONFIG.GORE_ENABLED) return;
  for (let i = 0; i < count; i++) {
    const spread = (Math.random() - 0.5) * 0.8;
    const spd = (Math.random() * 4.5 + 2.0) * speedMult;
    const baseAngle = Math.atan2(dirY, dirX) + spread;
    bloodParticles.push({
      x: x + (Math.random() * 4 - 2),
      y: y + (Math.random() * 4 - 2),
      vx: Math.cos(baseAngle) * spd,
      vy: Math.sin(baseAngle) * spd,
      size: Math.random() * 2.8 + 1.6,
      life: 1.0,
      decay: Math.random() * 0.015 + 0.015
    });
  }
}

export function spawnBloodFountain(x, y, facing, count = 4) {
  if (!CONFIG.GORE_ENABLED) return;
  for (let i = 0; i < count; i++) {
    bloodParticles.push({
      x: x + (Math.random() * 4 - 2),
      y: y,
      vx: (facing * (Math.random() * 2.2 + 0.5)) + (Math.random() - 0.5) * 1.2,
      vy: -(Math.random() * 4.2 + 2.8),
      size: Math.random() * 2.5 + 2.0,
      life: 1.0,
      decay: Math.random() * 0.02 + 0.02
    });
  }
}

export function addBloodDecal(x, y) {
  if (!CONFIG.GORE_ENABLED) return;
  if (bloodDecals.length >= (CONFIG.MAX_BLOOD_DECALS || 120)) {
    bloodDecals.shift();
  }
  bloodDecals.push({
    x: x + (Math.random() * 4 - 2),
    y,
    w: Math.random() * 9 + 5,
    h: Math.random() * 3 + 1.8,
    alpha: Math.random() * 0.35 + 0.55
  });
}

export function spawnHeadGib(x, y, vx, vy, facing, visuals) {
  if (!CONFIG.GORE_ENABLED) return;
  headGibs.push({
    x,
    y,
    vx: vx * 1.05 + (facing * 2.0),
    vy: vy - 4.5,
    rot: 0,
    vRot: (Math.random() * 0.25 + 0.15) * facing,
    facing: facing || 1,
    visuals: visuals || {},
    radius: 7.5,
    groundBounces: 0,
    life: 300,
    sprayTimer: 45
  });
  spawnBloodSpurt(x, y, vx, vy - 3, 24, 1.4);
}

export function spawnBodyGibs(cx, cy, facing, visuals) {
  if (!CONFIG.GORE_ENABLED) return;
  const types = ['arm', 'leg', 'torso_chunk', 'boot', 'pelvis'];
  for (const t of types) {
    const angle = Math.random() * Math.PI * 2;
    const spd = Math.random() * 7.0 + 3.5;
    bodyGibs.push({
      type: t,
      x: cx + (Math.random() * 12 - 6),
      y: cy + (Math.random() * 16 - 8),
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 3.5,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.35,
      facing: Math.random() < 0.5 ? 1 : -1,
      visuals: visuals || {},
      groundBounces: 0,
      life: 280
    });
  }
  spawnBloodSpurt(cx, cy, 0, -1, 35, 1.8);
}

export function spawnDroppedWeapon(x, y, vx, vy, weapon, facing) {
  if (!weapon) return;
  droppedWeapons.push({
    weapon,
    x,
    y,
    vx: (vx || 0) * 0.4 + (facing * (Math.random() * 2.5 + 1.5)),
    vy: (vy || 0) * 0.3 - (Math.random() * 3.5 + 3.0),
    rot: 0,
    vRot: (Math.random() * 0.22 + 0.12) * (Math.random() < 0.5 ? 1 : -1),
    facing: facing || 1,
    bounces: 0,
    life: 360
  });
}

export function updateGore(groundY) {
  for (let i = bloodParticles.length - 1; i >= 0; i--) {
    const p = bloodParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += CONFIG.GRAVITY * 0.85;
    p.vx *= 0.98;
    p.life -= p.decay;

    let hitFloor = false;
    let floorY = groundY;

    for (const plat of ARENA_PLATFORMS) {
      const topY = groundY - plat.relY;
      if (p.x >= plat.x && p.x <= plat.x + plat.w && p.y >= topY && p.y <= topY + 12 && p.vy > 0) {
        hitFloor = true;
        floorY = topY;
        break;
      }
    }
    if (!hitFloor) {
      for (const obs of customObstacles) {
        const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
        if (p.x >= obs.x && p.x <= obs.x + obs.w && p.y >= topY && p.y <= topY + 12 && p.vy > 0) {
          hitFloor = true;
          floorY = topY;
          break;
        }
      }
    }

    if (p.y >= groundY || hitFloor) {
      addBloodDecal(p.x, hitFloor ? floorY : groundY);
      bloodParticles.splice(i, 1);
      continue;
    }

    if (p.life <= 0) {
      bloodParticles.splice(i, 1);
    }
  }

  for (let i = headGibs.length - 1; i >= 0; i--) {
    const hg = headGibs[i];
    hg.x += hg.vx;
    hg.y += hg.vy;
    hg.vy += CONFIG.GRAVITY;
    hg.rot += hg.vRot;
    hg.vx *= 0.985;
    hg.life--;

    if (hg.sprayTimer > 0) {
      hg.sprayTimer--;
      if (hg.sprayTimer % 3 === 0) {
        spawnBloodSpurt(hg.x, hg.y, -hg.vx * 0.4, -hg.vy * 0.4, 2, 0.6);
      }
    }

    let floorY = groundY - hg.radius;
    let landed = false;

    if (hg.y >= floorY) {
      landed = true;
    } else {
      for (const plat of ARENA_PLATFORMS) {
        const topY = groundY - plat.relY;
        if (hg.x >= plat.x && hg.x <= plat.x + plat.w && hg.y >= topY - hg.radius && hg.y <= topY + 8 && hg.vy > 0) {
          floorY = topY - hg.radius;
          landed = true;
          break;
        }
      }
    }

    if (landed) {
      hg.y = floorY;
      if (Math.abs(hg.vy) > 1.2 && hg.groundBounces < 4) {
        hg.vy = -hg.vy * 0.48;
        hg.vx *= 0.75;
        hg.vRot *= 0.7;
        hg.groundBounces++;
        addBloodDecal(hg.x, floorY + hg.radius);
      } else {
        hg.vy = 0;
        hg.vx *= 0.85;
        hg.vRot = 0;
      }
    }

    if (hg.life <= 0) {
      headGibs.splice(i, 1);
    }
  }

  for (let i = bodyGibs.length - 1; i >= 0; i--) {
    const bg = bodyGibs[i];
    bg.x += bg.vx;
    bg.y += bg.vy;
    bg.vy += CONFIG.GRAVITY;
    bg.rot += bg.vRot;
    bg.vx *= 0.98;
    bg.life--;

    if (bg.y >= groundY - 4) {
      bg.y = groundY - 4;
      if (Math.abs(bg.vy) > 1.5 && bg.groundBounces < 3) {
        bg.vy = -bg.vy * 0.42;
        bg.vx *= 0.75;
        bg.groundBounces++;
        addBloodDecal(bg.x, groundY);
      } else {
        bg.vy = 0;
        bg.vx = 0;
        bg.vRot = 0;
      }
    }

    if (bg.life <= 0) {
      bodyGibs.splice(i, 1);
    }
  }

  for (let i = droppedWeapons.length - 1; i >= 0; i--) {
    const dw = droppedWeapons[i];
    dw.x += dw.vx;
    dw.y += dw.vy;
    dw.vy += CONFIG.GRAVITY;
    dw.rot += dw.vRot;
    dw.vx *= 0.98;
    dw.life--;

    let floorY = groundY - 4;
    let landed = false;

    if (dw.y >= floorY) {
      landed = true;
    } else {
      for (const plat of ARENA_PLATFORMS) {
        const topY = groundY - plat.relY;
        if (dw.x >= plat.x && dw.x <= plat.x + plat.w && dw.y >= topY - 4 && dw.y <= topY + 8 && dw.vy > 0) {
          floorY = topY - 4;
          landed = true;
          break;
        }
      }
    }

    if (landed) {
      dw.y = floorY;
      if (Math.abs(dw.vy) > 1.2 && dw.bounces < 3) {
        dw.vy = -dw.vy * 0.45;
        dw.vx *= 0.72;
        dw.vRot *= 0.6;
        dw.bounces++;
      } else {
        dw.vy = 0;
        dw.vx *= 0.82;
        dw.vRot = 0;
      }
    }

    if (dw.life <= 0) {
      droppedWeapons.splice(i, 1);
    }
  }
}

export function drawBloodDecals(ctx) {
  if (!CONFIG.GORE_ENABLED || bloodDecals.length === 0) return;
  ctx.save();
  for (const d of bloodDecals) {
    ctx.fillStyle = `rgba(136, 19, 19, ${d.alpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(d.x, d.y, d.w, d.h, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawGore(ctx) {
  if (!CONFIG.GORE_ENABLED) return;

  if (bloodParticles.length > 0) {
    ctx.save();
    for (const p of bloodParticles) {
      ctx.fillStyle = Math.random() < 0.3 ? '#7f1d1d' : '#991b1b';
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.restore();
  }

  for (const hg of headGibs) {
    ctx.save();
    ctx.translate(hg.x, hg.y);
    ctx.rotate(hg.rot);
    ctx.scale(hg.facing, 1);

    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(0, 5, 4.2, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    const faceGrad = ctx.createLinearGradient(-4.8, -6.0, 4.8, 6.0);
    faceGrad.addColorStop(0.0, '#de935e');
    faceGrad.addColorStop(0.5, '#f5b078');
    faceGrad.addColorStop(1.0, '#fed7aa');

    ctx.beginPath();
    ctx.ellipse(0, -1.0, 5.0, 5.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = faceGrad;
    ctx.fill();

    ctx.fillStyle = '#2e160a';
    ctx.beginPath();
    ctx.arc(0, -2.5, 5.1, Math.PI * 0.85, Math.PI * 0.15, true);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-4.8, -2.8);
    ctx.lineTo(4.8, -2.8);
    ctx.stroke();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(1.2, -2.2); ctx.lineTo(3.2, -0.2);
    ctx.moveTo(3.2, -2.2); ctx.lineTo(1.2, -0.2);
    ctx.stroke();

    ctx.restore();
  }

  for (const bg of bodyGibs) {
    ctx.save();
    ctx.translate(bg.x, bg.y);
    ctx.rotate(bg.rot);

    if (bg.type === 'boot') {
      ctx.fillStyle = bg.visuals?.bootColor || '#18181b';
      ctx.fillRect(-4, -2, 9, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-4, -4, 3, 2);
    } else if (bg.type === 'leg') {
      ctx.fillStyle = bg.visuals?.legShinFront || '#ef4444';
      ctx.fillRect(-3, -7, 6, 14);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-3, -9, 6, 2);
    } else if (bg.type === 'arm') {
      ctx.fillStyle = bg.visuals?.armColorFront || '#dc2626';
      ctx.fillRect(-2.5, -5, 5, 10);
      ctx.fillStyle = '#f5b078';
      ctx.fillRect(-2, 5, 4, 3);
    } else {
      ctx.fillStyle = bg.visuals?.jerseyFront1 || '#991b1b';
      ctx.fillRect(-5, -5, 10, 10);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-5, -6, 10, 2);
    }

    ctx.restore();
  }

  for (const dw of droppedWeapons) {
    ctx.save();
    ctx.translate(dw.x, dw.y);
    ctx.rotate(dw.rot);
    ctx.scale(dw.facing, 1);

    if (dw.weapon.id === 'AK47') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-8, -1.5, 6, 3);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-2, -2, 14, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(4, 2, 4, 5);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(12, -1, 10, 2);
    } else {
      ctx.fillStyle = '#3f2712';
      ctx.fillRect(-7, -1.5, 6, 3.5);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-1, -2.5, 11, 5);
      ctx.fillStyle = '#334155';
      ctx.fillRect(10, -2, 14, 3);
    }

    ctx.restore();
  }
}

// =========================================================================
// NEONOWY SYSTEM CZĄSTECZEK JETPACKA (CYJAN, BŁĘKIT, FIOLET)
// =========================================================================
export const jetpackParticles = [];

export function spawnJetpackSparks(x, y, facing, count = 2) {
  const colors = ['#00e5ff', '#38bdf8', '#c084fc'];
  const dir = facing || 1;

  for (let i = 0; i < count; i++) {
    const col = colors[Math.floor(Math.random() * colors.length)];
    const vx = -dir * (Math.random() * 2.5 + 1.0) + (Math.random() - 0.5) * 1.5;
    const vy = Math.random() * 4.5 + 2.5;

    jetpackParticles.push({
      x: x + (Math.random() * 4 - 2),
      y: y + (Math.random() * 4 - 2),
      vx,
      vy,
      size: Math.random() * 2.5 + 2.0,
      life: 1.0,
      color: col
    });
  }

  if (jetpackParticles.length > 150) {
    jetpackParticles.splice(0, jetpackParticles.length - 150);
  }
}

export function updateJetpackParticles() {
  for (let i = jetpackParticles.length - 1; i >= 0; i--) {
    const p = jetpackParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.045;
    if (p.life <= 0) {
      jetpackParticles.splice(i, 1);
    }
  }
}

export function drawJetpackParticles(ctx) {
  if (jetpackParticles.length === 0) return;

  for (let i = 0; i < jetpackParticles.length; i++) {
    const p = jetpackParticles[i];
    ctx.save();
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return { dist: Math.hypot(px - x1, py - y1), t: 0 };
  const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2));
  return { dist: Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1))), t };
}

export function resolveSegmentCollision(b, x1, y1, x2, y2, thickness, v1x, v1y, v2x, v2y, restitution, friction) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return false;

  const t = Math.max(0, Math.min(1, ((b.x - x1) * dx + (b.y - y1) * dy) / l2));
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  const d = Math.hypot(b.x - px, b.y - py);
  const cR = b.colRadius !== undefined ? b.colRadius : b.radius;
  const minDist = cR + thickness;

  if (d < minDist) {
    let nx = 0;
    let ny = -1;
    if (d > 0.0001) {
      nx = (b.x - px) / d;
      ny = (b.y - py) / d;
    } else {
      const len = Math.hypot(dx, dy);
      if (len > 0) {
        nx = -dy / len;
        ny = dx / len;
      }
    }

    const pen = minDist - d;
    b.x += nx * pen;
    b.y += ny * pen;

    const svx = v1x + t * (v2x - v1x);
    const svy = v1y + t * (v2y - v1y);

    const rvx = b.vx - svx;
    const rvy = b.vy - svy;
    const vn = rvx * nx + rvy * ny;

    if (vn < 0) {
      const rest = restitution !== undefined ? restitution : 0.72;
      const fric = friction !== undefined ? friction : 0.35;
      const jn = -(1 + rest) * vn;
      const tx = -ny;
      const ty = nx;
      const vt = rvx * tx + rvy * ty;
      const jt = -vt * fric;

      b.vx += (jn * nx) + (jt * tx);
      b.vy += (jn * ny) + (jt * ty);
      b.spin += jt * 0.08;
    }
    return true;
  }
  return false;
}

function drawSoldatParallax(ctx, camX) {
  const time = performance.now() * 0.0007;

  const farOffset = (camX * 0.04) % 1200;
  ctx.fillStyle = '#070c16';
  ctx.beginPath();
  ctx.moveTo(-100, H * 0.78);
  for (let x = -100; x <= W + 100; x += 80) {
    const y = Math.sin((x + farOffset) * 0.004) * 45 + Math.cos((x + farOffset) * 0.009) * 20;
    ctx.lineTo(x, H * 0.65 + y);
  }
  ctx.lineTo(W + 100, H);
  ctx.lineTo(-100, H);
  ctx.closePath();
  ctx.fill();

  const midOffset = (camX * 0.08) % 900;
  ctx.fillStyle = '#0c1322';
  ctx.beginPath();
  ctx.moveTo(-100, H * 0.82);
  for (let x = -100; x <= W + 100; x += 60) {
    const y = Math.sin((x + midOffset) * 0.006) * 32;
    ctx.lineTo(x, H * 0.70 + y);
  }
  ctx.lineTo(W + 100, H);
  ctx.lineTo(-100, H);
  ctx.closePath();
  ctx.fill();

  const towerOffset = (camX * 0.14) % 800;
  ctx.fillStyle = '#161f30';
  for (let i = -1; i < 5; i++) {
    const tx = i * 400 - towerOffset;
    if (tx < -150 || tx > W + 150) continue;

    ctx.fillRect(tx + 60, H * 0.46, 22, H * 0.45);
    ctx.fillRect(tx + 54, H * 0.44, 34, 8);

    ctx.fillRect(tx + 260, H * 0.32, 6, H * 0.58);
    ctx.fillRect(tx + 252, H * 0.38, 22, 3);
    ctx.fillRect(tx + 255, H * 0.44, 16, 3);

    const blink = (Math.sin(time * 6 + i * 2) > 0.1);
    if (blink) {
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(tx + 71, H * 0.43, 3.5, 0, Math.PI * 2);
      ctx.arc(tx + 263, H * 0.31, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#161f30';
    }
  }

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let s = 0; s < 3; s++) {
    const sPhase = s * (Math.PI * 0.68);
    const lightAngle = Math.sin(time * 1.2 + sPhase) * 0.36 + (s === 0 ? -0.32 : (s === 1 ? 0.05 : 0.35));
    const lx = (W * (0.18 + s * 0.32)) - (camX * 0.05);

    ctx.save();
    ctx.translate(lx, H * 0.88);
    ctx.rotate(lightAngle);

    const beam = ctx.createLinearGradient(0, 0, 0, -H * 1.9);
    beam.addColorStop(0.0, 'rgba(255, 255, 255, 0.28)');
    beam.addColorStop(0.2, 'rgba(186, 230, 253, 0.14)');
    beam.addColorStop(0.65, 'rgba(56, 189, 248, 0.06)');
    beam.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = beam;

    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(-140, -H * 1.9);
    ctx.lineTo(140, -H * 1.9);
    ctx.lineTo(16, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
  ctx.restore();
}

function drawCyberStadiumSky(ctx, camX) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0.0, '#030712');
  sky.addColorStop(0.42, '#090d16');
  sky.addColorStop(0.75, '#0f172a');
  sky.addColorStop(1.0, '#1e1b4b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const time = performance.now() * 0.0012;

  const farOffset = (camX * 0.04) % 1200;
  ctx.fillStyle = '#080c14';
  const farTowers = [
    { x: 80, w: 90, h: 320 },
    { x: 220, w: 140, h: 420 },
    { x: 410, w: 85, h: 290 },
    { x: 540, w: 160, h: 470 },
    { x: 740, w: 110, h: 360 },
    { x: 890, w: 150, h: 430 },
    { x: 1080, w: 95, h: 310 }
  ];
  for (let loop = -1; loop <= 2; loop++) {
    for (const b of farTowers) {
      const bx = b.x + loop * 1200 - farOffset;
      if (bx + b.w < -100 || bx > W + 100) continue;
      const by = H * 0.88 - b.h;
      ctx.fillRect(bx, by, b.w, b.h + 120);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(bx + b.w / 2, by);
      ctx.lineTo(bx + b.w / 2, by - 32);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(bx + b.w / 2, by - 32, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#080c14';
    }
  }

  const nearOffset = (camX * 0.10) % 960;
  const nearTowers = [
    { x: 60, w: 85, h: 260 },
    { x: 180, w: 120, h: 350 },
    { x: 340, w: 80, h: 230 },
    { x: 460, w: 140, h: 390 },
    { x: 640, w: 95, h: 280 },
    { x: 780, w: 130, h: 360 }
  ];
  for (let loop = -1; loop <= 2; loop++) {
    for (const b of nearTowers) {
      const bx = b.x + loop * 960 - nearOffset;
      if (bx + b.w < -100 || bx > W + 100) continue;
      const by = H * 0.90 - b.h;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(bx, by, b.w, b.h + 120);

      for (let wy = by + 26; wy < by + b.h - 25; wy += 26) {
        const isWinCyan = ((bx + wy) % 52 === 0);
        ctx.fillStyle = isWinCyan ? 'rgba(6, 182, 212, 0.45)' : 'rgba(249, 115, 22, 0.45)';
        for (let wx = bx + 10; wx < bx + b.w - 10; wx += 16) {
          ctx.fillRect(wx, wy, 8, 4);
        }
      }
    }
  }

  if (camera) {
    const spots = [
      { worldX: 240, baseAngle: 0.38, color: 'rgba(6, 182, 212, ' },
      { worldX: 460, baseAngle: 0.20, color: 'rgba(56, 189, 248, ' },
      { worldX: 1460, baseAngle: -0.20, color: 'rgba(251, 146, 60, ' },
      { worldX: 1680, baseAngle: -0.38, color: 'rgba(249, 115, 22, ' }
    ];

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const beamLen = 950 * camera.zoom;
    for (let i = 0; i < spots.length; i++) {
      const s = spots[i];
      const sourceScreenX = W * 0.40 + (s.worldX - camera.x) * camera.zoom;
      const sourceScreenY = H * 0.68 + ((GROUND_Y - 520) - camera.y) * camera.zoom;

      const sway = Math.sin(time * 1.5 + i * 1.6) * 0.10;
      const currentAngle = s.baseAngle + sway;

      ctx.save();
      ctx.translate(sourceScreenX, sourceScreenY);
      ctx.rotate(currentAngle);

      const beamGrad = ctx.createLinearGradient(0, 0, 0, beamLen);
      beamGrad.addColorStop(0.0, `${s.color}0.55)`);
      beamGrad.addColorStop(0.35, `${s.color}0.22)`);
      beamGrad.addColorStop(0.75, `${s.color}0.07)`);
      beamGrad.addColorStop(1.0, `${s.color}0.0)`);

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(-16 * camera.zoom, 0);
      ctx.lineTo(-150 * camera.zoom, beamLen);
      ctx.lineTo(150 * camera.zoom, beamLen);
      ctx.lineTo(16 * camera.zoom, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 7 * camera.zoom, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }
}

export function drawSky(ctx) {
  if (activeArenaId === 'ARENA_2') {
    drawCyberStadiumSky(ctx, camera ? camera.x : 960);
  } else {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0.0, '#020409');
    sky.addColorStop(0.40, '#070c16');
    sky.addColorStop(0.72, '#0e1624');
    sky.addColorStop(1.0, '#1a2432');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    drawSoldatParallax(ctx, camera ? camera.x : 1760);
  }
}

export function drawGround(ctx, worldLeft, worldWidth) {
  const startX = ARENA_LEFT - 300;
  const endX = ARENA_RIGHT + 300;
  const w = endX - startX;

  ctx.fillStyle = '#18181b';
  ctx.fillRect(startX, GROUND_Y, w, 600);

  ctx.fillStyle = '#27272a';
  ctx.fillRect(startX, GROUND_Y, w, 14);
  ctx.fillStyle = '#14532d';
  ctx.fillRect(startX, GROUND_Y, w, 4);

  const wallH = 1350;

  [ARENA_LEFT, ARENA_RIGHT].forEach((wallX, idx) => {
    const isLeft = idx === 0;
    const bw = 42;
    const bx = isLeft ? wallX - bw : wallX;

    const wallGrad = ctx.createLinearGradient(bx, GROUND_Y - wallH, bx + bw, GROUND_Y - wallH);
    wallGrad.addColorStop(0.0, '#0f172a');
    wallGrad.addColorStop(0.5, '#1e293b');
    wallGrad.addColorStop(1.0, '#0f172a');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(bx, GROUND_Y - wallH, bw, wallH);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(bx, GROUND_Y - wallH, bw, wallH);

    ctx.fillStyle = '#020617';
    for (let wy = GROUND_Y - wallH + 50; wy < GROUND_Y; wy += 60) {
      ctx.fillRect(bx, wy, bw, 3);
    }

    const accentCol = isLeft ? '#06b6d4' : '#f97316';
    ctx.strokeStyle = accentCol;
    ctx.shadowColor = accentCol;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(wallX, GROUND_Y - wallH);
    ctx.lineTo(wallX, GROUND_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const blink = (Math.sin(performance.now() * 0.006 + idx) > 0);
    ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
    ctx.shadowColor = blink ? '#ef4444' : 'transparent';
    ctx.shadowBlur = blink ? 10 : 0;
    ctx.beginPath();
    ctx.arc(isLeft ? bx + 12 : bx + bw - 12, GROUND_Y - wallH + 12, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

export function drawDistanceMarkers(ctx, worldLeft, worldRight) { }
export function drawStadiumForeground() { }
export function clearDesertSandstorm() { }
export function clearWinterBlizzard() { }

let lastTime = performance.now();
let frameCount = 0;
export let currentFps = 60;

export function updateFps() {
  frameCount++;
  const now = performance.now();
  const elapsed = now - lastTime;
  if (elapsed >= 500) {
    currentFps = Math.round((frameCount * 1000) / elapsed);
    frameCount = 0;
    lastTime = now;
  }
}

export let isTouchDevice = (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
export function setTouchDevice(val) { isTouchDevice = !!val; }

export function drawTouchControls(ctx, player, leftStick, btnCluster, rightStick) {
  if (!isTouchDevice || !ctx || !player) return;

  ctx.save();

  // 1. LEWY DRĄŻEK: RUCH, SKOK W GÓRĘ I JETPACK
  if (leftStick && (leftStick.active || leftStick.waitingForJetpackTap)) {
    const isJetReady = leftStick.waitingForJetpackTap && leftStick.jetpackWindowTimer > 0;
    const isJetActive = leftStick.isJetpacking;

    let stickBorder = 'rgba(255, 255, 255, 0.2)';
    let stickGlow = 'transparent';

    if (isJetActive) {
      stickBorder = '#00e5ff';
      stickGlow = '#00e5ff';
    } else if (isJetReady) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.02);
      stickBorder = `rgba(0, 229, 255, ${0.4 + pulse * 0.5})`;
      stickGlow = '#00e5ff';
    }

    const bgGrad = ctx.createRadialGradient(leftStick.baseX, leftStick.baseY, 10, leftStick.baseX, leftStick.baseY, 55);
    bgGrad.addColorStop(0.0, 'rgba(30, 41, 59, 0.55)');
    bgGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.45)');

    ctx.beginPath();
    ctx.arc(leftStick.baseX, leftStick.baseY, 55, 0, Math.PI * 2);
    ctx.fillStyle = bgGrad;
    ctx.fill();
    ctx.shadowColor = stickGlow;
    ctx.shadowBlur = isJetActive ? 10 : (isJetReady ? 6 : 0);
    ctx.strokeStyle = stickBorder;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.font = 'bold 8.5px monospace';
    ctx.fillStyle = isJetActive ? '#00e5ff' : (isJetReady ? '#38bdf8' : 'rgba(255, 255, 255, 0.4)');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('▲ SKOK / JET', leftStick.baseX, leftStick.baseY - 60);

    if (isJetReady) {
      ctx.fillStyle = '#00e5ff';
      ctx.fillText('⚡ JETPACK READY', leftStick.baseX, leftStick.baseY + 68);
    }

    const knobX = leftStick.baseX + (leftStick.axisX * (leftStick.maxRadius || 55));
    const knobY = leftStick.baseY + (leftStick.axisY * (leftStick.maxRadius || 55));

    const knobGrad = ctx.createRadialGradient(knobX - 4, knobY - 4, 3, knobX, knobY, 24);
    if (isJetActive) {
      knobGrad.addColorStop(0.0, 'rgba(0, 229, 255, 0.95)');
      knobGrad.addColorStop(0.6, 'rgba(14, 116, 144, 0.85)');
      knobGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.90)');
    } else {
      knobGrad.addColorStop(0.0, 'rgba(56, 189, 248, 0.85)');
      knobGrad.addColorStop(0.6, 'rgba(14, 116, 144, 0.75)');
      knobGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.85)');
    }

    ctx.beginPath();
    ctx.arc(knobX, knobY, 24, 0, Math.PI * 2);
    ctx.fillStyle = knobGrad;
    ctx.fill();
    ctx.strokeStyle = isJetActive ? '#00e5ff' : '#38bdf8';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(knobX, knobY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  // 2. PRAWY DRĄŻEK: CELOWANIE, OKNO 300 MS I OGIEŃ CIĄGŁY
  const rsVisible = (rightStick && (rightStick.active || rightStick.waitingForSecondTap || rightStick.lingerAlpha > 0.01));

  if (rsVisible) {
    const isFiring = rightStick.active && rightStick.isShooting;
    const isWaitingTap = rightStick.waitingForSecondTap && rightStick.windowTimer > 0;

    let mainColor = '#00e5ff';
    let glowColor = '#00e5ff';
    let baseBorder = 'rgba(0, 229, 255, 0.35)';

    if (isFiring) {
      mainColor = '#f97316';
      glowColor = '#ef4444';
      baseBorder = 'rgba(249, 115, 22, 0.6)';
    } else if (isWaitingTap) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.02);
      mainColor = pulse > 0.5 ? '#facc15' : '#00e5ff';
      glowColor = mainColor;
      baseBorder = `rgba(250, 204, 21, ${0.4 + pulse * 0.4})`;
    }

    ctx.save();
    ctx.globalAlpha = rightStick.lingerAlpha !== undefined ? rightStick.lingerAlpha : 1.0;

    const bx = rightStick.baseX;
    const by = rightStick.baseY;
    const maxR = rightStick.maxRadius || 65;

    const bgGrad = ctx.createRadialGradient(bx, by, 10, bx, by, maxR);
    bgGrad.addColorStop(0.0, 'rgba(30, 41, 59, 0.65)');
    bgGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.45)');

    ctx.beginPath();
    ctx.arc(bx, by, maxR, 0, Math.PI * 2);
    ctx.fillStyle = bgGrad;
    ctx.fill();
    ctx.strokeStyle = baseBorder;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.strokeStyle = isFiring ? 'rgba(249, 115, 22, 0.5)' : 'rgba(0, 229, 255, 0.4)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(bx - 10, by); ctx.lineTo(bx + 10, by);
    ctx.moveTo(bx, by - 10); ctx.lineTo(bx + 10, by);
    ctx.stroke();

    let knobX = bx;
    let knobY = by;

    if (rightStick.active) {
      const dx = rightStick.curX - bx;
      const dy = rightStick.curY - by;
      const rawDist = Math.hypot(dx, dy);
      const normX = rawDist > 0.001 ? dx / rawDist : 1;
      const normY = rawDist > 0.001 ? dy / rawDist : 0;

      const clampedDist = Math.min(rawDist, maxR);
      knobX = bx + normX * clampedDist;
      knobY = by + normY * clampedDist;

      ctx.strokeStyle = isFiring ? 'rgba(249, 115, 22, 0.8)' : 'rgba(0, 229, 255, 0.6)';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(knobX, knobY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const knobGrad = ctx.createRadialGradient(knobX - 4, knobY - 4, 3, knobX, knobY, 22);
    if (isFiring) {
      knobGrad.addColorStop(0.0, 'rgba(251, 146, 60, 0.95)');
      knobGrad.addColorStop(0.6, 'rgba(220, 38, 38, 0.75)');
      knobGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.85)');
    } else {
      knobGrad.addColorStop(0.0, 'rgba(0, 229, 255, 0.90)');
      knobGrad.addColorStop(0.55, 'rgba(6, 182, 212, 0.65)');
      knobGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.80)');
    }

    ctx.beginPath();
    ctx.arc(knobX, knobY, 22, 0, Math.PI * 2);
    ctx.fillStyle = knobGrad;
    ctx.fill();

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(knobX, knobY, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(knobX - 10, knobY); ctx.lineTo(knobX - 7, knobY);
    ctx.moveTo(knobX + 7, knobY); ctx.lineTo(knobX + 10, knobY);
    ctx.moveTo(knobX, knobY - 10); ctx.lineTo(knobX - 7, knobY);
    ctx.moveTo(knobX, knobY + 7); ctx.lineTo(knobX, knobY + 10);
    ctx.stroke();

    let statusText = 'CEL / KOP: GEST';
    if (isFiring) {
      statusText = '🔥 OGIEŃ CIĄGŁY';
    } else if (isWaitingTap) {
      statusText = '⚡ TAP = STRZAŁ';
    }

    ctx.font = 'bold 8.5px monospace';
    ctx.fillStyle = mainColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(statusText, bx, by + maxR + 15);

    ctx.restore();
  }

  // 3. PRZYCISK WŚLIZG
  if (btnCluster && btnCluster.slide) {
    const glassBg = 'rgba(15, 23, 42, 0.55)';
    const slide = btnCluster.slide;
    const slideR = slide.r || 30;
    const isSlideReady = Math.abs(player.vx) >= (player.currentClass?.stats?.sprintMax || CONFIG.SPRINT_MAX) * 0.82;
    const isSlideActive = player.isSliding || slide.active;

    let slideBorder = 'rgba(255, 255, 255, 0.15)';
    let slideBg = glassBg;
    let slideAccent = 'rgba(255, 255, 255, 0.4)';

    if (isSlideReady || isSlideActive) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.009);
      slideBorder = '#10b981';
      slideBg = `rgba(16, 185, 129, ${0.18 + pulse * 0.22})`;
      slideAccent = '#10b981';

      ctx.beginPath();
      ctx.arc(slide.x, slide.y, slideR + 3 + pulse * 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(16, 185, 129, ${(1 - pulse) * 0.65})`;
      ctx.lineWidth = 2.0;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(slide.x, slide.y, slideR, 0, Math.PI * 2);
    ctx.fillStyle = slideBg;
    ctx.fill();
    ctx.strokeStyle = slideBorder;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.save();
    ctx.translate(slide.x, slide.y);
    ctx.beginPath();
    ctx.moveTo(-10, 4); ctx.lineTo(8, 4); ctx.lineTo(10, 0); ctx.lineTo(4, -4); ctx.lineTo(-4, -4); ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.fillStyle = slideAccent;
    ctx.fill();

    ctx.fillStyle = isSlideReady ? '#10b981' : 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 8.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WŚLIZG', 0, 16);
    ctx.restore();
  }

  ctx.restore();
}

export function drawEntityHealthBar(ctx, entity, yOffset = -12) {
  if (!entity || entity.isDead) return;
  const barW = 34;
  const barH = 4.5;
  const x = (entity.x + entity.w / 2) - barW / 2;
  const y = entity.y + yOffset;

  const maxHp = entity.maxHp || 100;
  const curHp = Math.max(0, entity.hp ?? 100);
  const ratio = Math.max(0, Math.min(1, curHp / maxHp));
  const col = ratio > 0.5 ? '#22c55e' : (ratio > 0.25 ? '#f97316' : '#ef4444');

  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(x - 1, y - 1, barW + 2, barH + 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x - 1, y - 1, barW + 2, barH + 2);

  if (ratio > 0) {
    ctx.fillStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = 4;
    ctx.fillRect(x, y, barW * ratio, barH);
  }
  ctx.restore();
}

export function drawOffscreenBallIndicator(ctx, ball, camera, player) {
  if (!ball || !camera) return;

  const screenX = W * 0.40 + (ball.x - camera.x) * camera.zoom;
  const screenY = H * 0.68 + (ball.y - camera.y) * camera.zoom;

  const margin = 35;
  const minX = margin;
  const maxX = W - margin;
  const minY = margin;
  const maxY = H - margin;

  const isOffscreen = (screenX < minX || screenX > maxX || screenY < minY || screenY > maxY);
  if (!isOffscreen) return;

  const cx = W / 2;
  const cy = H / 2;
  const dx = screenX - cx;
  const dy = screenY - cy;
  if (dx === 0 && dy === 0) return;

  const angle = Math.atan2(dy, dx);
  let t = Infinity;

  if (dx > 0) {
    const tCandidate = (maxX - cx) / dx;
    if (tCandidate > 0 && tCandidate < t) t = tCandidate;
  } else if (dx < 0) {
    const tCandidate = (minX - cx) / dx;
    if (tCandidate > 0 && tCandidate < t) t = tCandidate;
  }

  if (dy > 0) {
    const tCandidate = (maxY - cy) / dy;
    if (tCandidate > 0 && tCandidate < t) t = tCandidate;
  } else if (dy < 0) {
    const tCandidate = (minY - cy) / dy;
    if (tCandidate > 0 && tCandidate < t) t = tCandidate;
  }

  const ix = Math.max(minX, Math.min(maxX, cx + dx * t));
  const iy = Math.max(minY, Math.min(maxY, cy + dy * t));

  ctx.save();
  ctx.translate(ix, iy);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-10, -9);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-10, 9);
  ctx.closePath();
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.restore();

  const pX = player ? (player.x + player.w / 2) : camera.x;
  const pY = player ? (player.y + player.h / 2) : camera.y;
  const distMeters = Math.round(Math.hypot(ball.x - pX, ball.y - pY) / 14);

  ctx.save();
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = '#facc15';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 6;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textDist = 24;
  const textX = ix - Math.cos(angle) * textDist;
  const textY = iy - Math.sin(angle) * textDist;
  ctx.fillText(`${distMeters}m`, textX, textY);
  ctx.restore();
}

/**
 * Rysowanie miniaturowej sylwetki broni w tle kafelka wyboru
 */
function drawWeaponSilhouette(ctx, type, cx, cy, isSelected) {
  ctx.save();
  ctx.translate(cx, cy);
  const alpha = isSelected ? 0.38 : 0.16;

  if (type === 'AK47') {
    ctx.fillStyle = `rgba(250, 204, 21, ${alpha})`;
    // Kolba
    ctx.fillRect(-17, -1, 7, 3);
    // Komora i łoże
    ctx.fillRect(-10, -2, 16, 4);
    // Magazynek łukowy
    ctx.beginPath();
    ctx.moveTo(-5, 2);
    ctx.lineTo(-2, 7);
    ctx.lineTo(1, 7);
    ctx.lineTo(-1, 2);
    ctx.closePath();
    ctx.fill();
    // Lufa
    ctx.fillRect(6, -1, 10, 2);
  } else if (type === 'SHOTGUN') {
    ctx.fillStyle = `rgba(251, 146, 60, ${alpha})`;
    // Kolba
    ctx.fillRect(-16, -1, 8, 4);
    // Komora zamkowa
    ctx.fillRect(-8, -2, 12, 5);
    // Długa lufa i podlufowy magazynek
    ctx.fillRect(4, -2, 12, 3);
    ctx.fillRect(4, 1, 10, 2);
  }

  ctx.restore();
}

export function drawHUD(ctx, player, leftStick, btnCluster, rightStick, ball) {
  updateFps();

  ctx.save();

  // =========================================================================
  // 1. STATYSTYKI GRY W LEWYM GÓRNYM ROGU (DYSTANS, KLASA, STAN, FPS)
  // =========================================================================
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 13px monospace';
  ctx.fillText(`DYSTANS: ${currentDist} m`, 20, 26);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 11px monospace';
  ctx.fillText(`KLASA: ${player.currentClass?.name || 'DOMYŚLNA'}`, 20, 44);

  let modeCol = '#94a3b8';
  if (player.gaitMode === 'SLIDE') modeCol = '#00e5ff';
  else if (player.isCrouching) modeCol = '#38bdf8';
  else if (player.gaitMode === 'SPRINT') modeCol = '#ef4444';
  else if (player.gaitMode === 'JOG') modeCol = '#facc15';
  else if (player.gaitMode === 'WALK') modeCol = '#10b981';

  ctx.fillStyle = modeCol;
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`STAN: ${player.gaitMode}`, 20, 62);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '10px monospace';
  ctx.fillText(`FPS: ${currentFps}`, 20, 78);

  // =========================================================================
  // 2. PANEL DOLNY LEWY: HP, JETPACK ORAZ PIONOWY WYBÓR BRONI
  // =========================================================================
  const panelX = 20;

  // A. Przyciski wyboru broni – małe, ułożone pionowo jeden na drugim
  const btnH = 26;
  const btnGap = 5;
  const akY = H - 64;
  const sgY = H - 33;
  const curWepId = player.currentWeapon?.id || 'AK47';

  weaponButtons[0].y = akY;
  weaponButtons[1].y = sgY;

  for (const btn of weaponButtons) {
    const isSelected = (curWepId === btn.id);
    const accentCol = btn.id === 'SHOTGUN' ? '#fb923c' : '#facc15';

    ctx.save();
    ctx.fillStyle = isSelected
      ? (btn.id === 'SHOTGUN' ? 'rgba(251, 146, 60, 0.28)' : 'rgba(250, 204, 21, 0.28)')
      : 'rgba(15, 23, 42, 0.82)';
    ctx.strokeStyle = isSelected ? accentCol : 'rgba(255, 255, 255, 0.20)';
    ctx.lineWidth = isSelected ? 1.6 : 1.0;

    if (isSelected) {
      ctx.shadowColor = accentCol;
      ctx.shadowBlur = 8;
    }

    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 4);
    else ctx.rect(btn.x, btn.y, btn.w, btn.h);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Rysunek sylwetki broni w tle kafelka
    drawWeaponSilhouette(ctx, btn.id, btn.x + btn.w / 2, btn.y + btn.h / 2, isSelected);

    // Etykieta broni
    ctx.font = 'bold 8.5px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
    ctx.fillText(btn.name, btn.x + btn.w / 2, btn.y + btn.h / 2 + 0.5);

    ctx.restore();
  }

  // B. Pasek HP i Jetpacka (bezpośrednio nad kolumną wyboru broni)
  const barW = 140;
  const hpY = akY - 32;
  const hpH = 10;

  const maxHp = player.maxHp || 100;
  const curHp = Math.max(0, player.hp ?? 100);
  const hpRatio = Math.max(0, Math.min(1, curHp / maxHp));
  const hpColor = hpRatio > 0.5 ? '#22c55e' : (hpRatio > 0.25 ? '#f97316' : '#ef4444');

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(panelX, hpY, barW, hpH, 3);
  else ctx.rect(panelX, hpY, barW, hpH);
  ctx.fill();
  ctx.stroke();

  if (hpRatio > 0) {
    ctx.save();
    ctx.beginPath();
    const fillW = Math.max(3, (barW - 2) * hpRatio);
    if (ctx.roundRect) ctx.roundRect(panelX + 1, hpY + 1, fillW, hpH - 2, 2);
    else ctx.rect(panelX + 1, hpY + 1, fillW, hpH - 2);
    ctx.fillStyle = hpColor;
    ctx.shadowColor = hpColor;
    ctx.shadowBlur = 5;
    ctx.fill();
    ctx.restore();
  }

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 8px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 3;
  ctx.fillText(`HP ${Math.ceil(curHp)}`, panelX + barW - 4, hpY + hpH / 2 + 0.5);

  // C. Pasek Jetpacka
  const jetY = hpY + 14;
  const jetH = 4.5;

  const maxJet = player.jetMax || 100;
  const curJet = Math.max(0, Math.min(maxJet, player.jetFuel ?? 100));
  const jetRatio = maxJet > 0 ? (curJet / maxJet) : 0;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(panelX, jetY, barW, jetH, 2);
  else ctx.rect(panelX, jetY, barW, jetH);
  ctx.fill();
  ctx.stroke();

  if (jetRatio > 0) {
    ctx.save();
    ctx.beginPath();
    const fillJetW = Math.max(2, barW * jetRatio);
    if (ctx.roundRect) ctx.roundRect(panelX, jetY, fillJetW, jetH, 2);
    else ctx.rect(panelX, jetY, fillJetW, jetH);
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 5;
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.font = 'bold 7.5px monospace';
  ctx.fillStyle = '#00e5ff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 3;
  ctx.fillText(`JET ${Math.round(curJet)}%`, panelX + barW, jetY + 11.5);
  ctx.restore();

  // =========================================================================
  // 3. TABLICA WYNIKÓW (GÓRA EKRANU)
  // =========================================================================
  const isMatchArena = (activeArenaId === 'ARENA_1' || activeArenaId === 'ARENA_2');
  if (isMatchArena) {
    const scoreBoxW = 230;
    const scoreBoxH = 34;
    const scoreBoxX = (W - scoreBoxW) / 2;
    const scoreBoxY = 16;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.2;
    if (ctx.roundRect) ctx.roundRect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, 6);
    else ctx.rect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 6;
    ctx.fillText(`CYAN ${arenaScore.cyan}`, scoreBoxX + scoreBoxW / 2 - 14, scoreBoxY + 22);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText(':', scoreBoxX + scoreBoxW / 2, scoreBoxY + 21);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 6;
    ctx.fillText(`${arenaScore.orange} ORANGE`, scoreBoxX + scoreBoxW / 2 + 14, scoreBoxY + 22);

    if (activeArenaId === 'ARENA_1' && arena1State?.waitingForKickoff) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.005);
      ctx.textAlign = 'center';
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = `rgba(56, 189, 248, ${0.80 + pulse * 0.20})`;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 8;
      ctx.fillText('⚡ ROZPOCZNIJ MECZ: PIŁKA NA OŁTARZU CENTRALNYM (X: 1760) ⚡', W / 2, scoreBoxY + scoreBoxH + 16);
    }

    ctx.restore();
  }

  // 4. BANER CELEBRACJI GOLA
  if (goalCelebration.active && goalCelebration.timer > 0) {
    goalCelebration.timer--;
    if (goalCelebration.timer <= 0) goalCelebration.active = false;

    ctx.save();
    ctx.fillStyle = goalCelebration.color;
    ctx.globalAlpha = Math.min(0.40, (goalCelebration.timer / 110) * 0.40);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 36px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = goalCelebration.color;
    ctx.shadowBlur = 24;
    ctx.fillText(`⚽ ${goalCelebration.team} GOAL! ⚽`, W / 2, H * 0.32);
    ctx.restore();
  }
  ctx.restore();

  if (ball) {
    drawOffscreenBallIndicator(ctx, ball, camera, player);
  }

  if (isTouchDevice) {
    drawTouchControls(ctx, player, leftStick, btnCluster, rightStick);
  }
}
