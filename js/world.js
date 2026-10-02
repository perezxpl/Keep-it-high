// =========================================================================
// WORLD.JS - MODUŁ ZAMKNIĘTEJ ARENY BOJOWEJ + SYSTEM GORE & KINEMATYKA ŚMIERCI
// =========================================================================

import { CONFIG, START_X, ARENA_LEFT, ARENA_RIGHT, ARENA_WIDTH, isTouchDevice, setTouchDevice } from './config.js';
import { spawnConcreteDebris, spawnRicochetSparks } from './particles.js';
export { isTouchDevice, setTouchDevice };

export let _worldPlatforms = [];
export let _worldCustomObstacles = [];
export let activeArenaId = 'ARENA_1';
export let _worldArenaState = {
  get activeArenaId() { return activeArenaId; },
  set activeArenaId(val) { activeArenaId = val; },
  arenaScore: { cyan: 0, orange: 0 },
  arena1State: null
};

export function registerWorldObstacles(platforms, obstacles, arenaState) {
  if (platforms) _worldPlatforms = platforms;
  if (obstacles) _worldCustomObstacles = obstacles;
  if (arenaState) {
    if (arenaState.activeArenaId) activeArenaId = arenaState.activeArenaId;
    if (arenaState.arenaScore) _worldArenaState.arenaScore = arenaState.arenaScore;
    if (arenaState.arena1State) _worldArenaState.arena1State = arenaState.arena1State;
  }
}

export function setActiveArenaId(id) {
  activeArenaId = id;
}

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
export let GROUND_Y = Math.round((H - 75) / 20) * 20;

// =========================================================================
// SEGMENTOWA ARCHITEKTURA PODŁOŻA I INDUSTRIALNE FUNDAMENTY
// =========================================================================
export const GROUND_SLAB_HEIGHT = 36; // realna grubość kładki przemysłowej
export const GROUND_SEG_WIDTH = 32;   // siatka segmentów o szerokości 30–40 px
export const PILLAR_SPACING = 120;    // industrialne belki nośne / filary schodzące w dół co 120 px
export const groundSegments = [];

let _nextGroundId = 1;
export function generateGroundId() {
  return 'ground_seg_' + (_nextGroundId++);
}

export function initGroundSegments() {
  groundSegments.length = 0;
  const startX = ARENA_LEFT - 320;
  const endX = ARENA_RIGHT + 320;
  for (let x = startX; x < endX; x += GROUND_SEG_WIDTH) {
    groundSegments.push({
      id: generateGroundId(),
      x: x,
      y: GROUND_Y,
      width: GROUND_SEG_WIDTH,
      height: GROUND_SLAB_HEIGHT,
      destroyed: false,
      scorchLeft: false,
      scorchRight: false
    });
  }
}

// Inicjalizacja segmentów poziomu zerowego
initGroundSegments();

export function isGroundAt(x, margin = 4) {
  for (let i = 0; i < groundSegments.length; i++) {
    const seg = groundSegments[i];
    if (seg.destroyed) continue;
    if (x >= seg.x - margin && x <= seg.x + seg.width + margin) {
      return true;
    }
  }
  return false;
}

export function isGroundSupporting(minX, maxX) {
  for (let i = 0; i < groundSegments.length; i++) {
    const seg = groundSegments[i];
    if (seg.destroyed) continue;
    if (seg.x + seg.width > minX && seg.x < maxX) {
      return true;
    }
  }
  return false;
}

export function findGroundHoleAt(x) {
  if (isGroundAt(x, 0)) return null;
  let holeStart = ARENA_LEFT - 320;
  let holeEnd = ARENA_RIGHT + 320;
  for (let i = 0; i < groundSegments.length; i++) {
    const seg = groundSegments[i];
    if (!seg.destroyed) {
      if (seg.x + seg.width <= x && seg.x + seg.width > holeStart) {
        holeStart = seg.x + seg.width;
      }
      if (seg.x >= x && seg.x < holeEnd) {
        holeEnd = seg.x;
      }
    }
  }
  return { holeStart, holeEnd };
}

export function updateGroundEdgeFlags() {
  for (let i = 0; i < groundSegments.length; i++) {
    const seg = groundSegments[i];
    seg.scorchLeft = false;
    seg.scorchRight = false;
    if (seg.destroyed) continue;

    const prev = groundSegments[i - 1];
    if (prev && prev.destroyed) {
      seg.scorchLeft = true;
    }
    const next = groundSegments[i + 1];
    if (next && next.destroyed) {
      seg.scorchRight = true;
    }
  }
}

export function resetGroundSegments() {
  for (let i = 0; i < groundSegments.length; i++) {
    const seg = groundSegments[i];
    seg.destroyed = false;
    seg.scorchLeft = false;
    seg.scorchRight = false;
    seg.y = GROUND_Y;
  }
}

export function carveGroundHole(expX, expY, blastRadius = 85) {
  const topY = GROUND_Y;
  const bottomY = GROUND_Y + GROUND_SLAB_HEIGHT;
  const nearestY = Math.max(topY, Math.min(expY, bottomY));
  const distY = Math.abs(expY - nearestY);

  if (distY > blastRadius) {
    return [];
  }

  const reachX = Math.sqrt(Math.max(0, blastRadius * blastRadius - distY * distY));
  const effectiveRadius = Math.max(blastRadius * 0.70, reachX);
  const holeStart = expX - effectiveRadius;
  const holeEnd = expX + effectiveRadius;

  const destroyed = [];
  for (let i = 0; i < groundSegments.length; i++) {
    const seg = groundSegments[i];
    if (seg.destroyed) continue;

    const segLeft = seg.x;
    const segRight = seg.x + seg.width;

    if (segRight > holeStart && segLeft < holeEnd) {
      seg.destroyed = true;
      destroyed.push(seg);

      const segCenterX = seg.x + seg.width / 2;
      const segCenterY = seg.y + seg.height / 2;
      const sDx = segCenterX - expX;
      const sDy = segCenterY - expY;
      const dist = Math.hypot(sDx, sDy) || 1;
      const normX = sDx / dist;
      const normY = sDy / dist;
      const speed = 150 + Math.random() * 160;
      if (typeof spawnConcreteDebris === 'function') {
        spawnConcreteDebris(segCenterX, segCenterY, 3, normX * speed, normY * speed - 50);
      }
      if (typeof spawnRicochetSparks === 'function') {
        spawnRicochetSparks(segCenterX, seg.y, 0, -1, 3);
      }
    }
  }

  updateGroundEdgeFlags();
  return destroyed;
}

import {
  camera,
  updateCamera,
  clampCamera,
  getArenaBounds,
  world,
  devZoomLevel,
  setDevZoom,
  triggerScreenShake,
  applyCameraTransform,
  restoreCameraTransform,
  worldToScreen,
  screenToWorld,
  getCanvasLogicalWidth,
  getCanvasLogicalHeight,
  shakeImpulse
} from './camera.js';

export {
  camera,
  updateCamera,
  clampCamera,
  getArenaBounds,
  world,
  devZoomLevel,
  setDevZoom,
  triggerScreenShake,
  shakeImpulse,
  applyCameraTransform,
  restoreCameraTransform,
  worldToScreen,
  screenToWorld,
  getCanvasLogicalWidth,
  getCanvasLogicalHeight
};

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
  { id: 'AK47', name: 'AK', fullName: 'AK-47', type: 'AUTO', x: 20, y: 0, w: 36, h: 36 },
  { id: 'SHOTGUN', name: 'SG', fullName: 'SHOTGUN', type: 'SEMI', x: 20, y: 0, w: 36, h: 36 },
  { id: 'GRENADE', name: 'HE', fullName: 'GRENADE', type: 'TACTICAL', key: 'G', x: 20, y: 0, w: 36, h: 36 }
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
  GROUND_Y = Math.round((H - 75) / 20) * 20;
  if (Array.isArray(groundSegments)) {
    for (const seg of groundSegments) {
      seg.y = GROUND_Y;
    }
  }
  invalidateSkyCache();
  if (player) {
    if (player.y >= GROUND_Y - player.h - 5) {
      player.y = GROUND_Y - player.h;
    }
  }
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

/**
 * Spawnuje mały obłok pyłu / kurzu uderzeniowego pod plecami powalonej postaci
 * @param {number} x - Środek postaci
 * @param {number} y - Poziom podłoża/platformy
 */
export function spawnGroundPuff(x, y) {
  const puffColors = ['#94a3b8', '#cbd5e1', '#64748b', '#78350f', '#475569'];
  for (let i = 0; i < 7; i++) {
    grassParticles.push({
      x: x + (Math.random() * 24 - 12),
      y: y - 1,
      vx: (Math.random() * 3.6 - 1.8),
      vy: -(Math.random() * 2.0 + 0.6),
      size: Math.random() * 3.2 + 1.8,
      life: 0.85 + Math.random() * 0.3,
      color: puffColors[Math.floor(Math.random() * puffColors.length)]
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
    baseAlpha: Math.random() * 0.35 + 0.55,
    alpha: Math.random() * 0.35 + 0.55,
    lifeTime: 300,      // 5 sekund przy 60 FPS – pełne krycie
    fadeDuration: 60,   // 1 sekunda płynnego wygaszania
    fadeTimer: 60
  });
}
export const spawnBloodDecal = addBloodDecal;

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

export function updateGore(groundY, platforms = null, obstacles = null) {
  const plats = platforms || _worldPlatforms;
  const obsList = obstacles || _worldCustomObstacles;

  // Uaktualnij czas życia i alpha plam krwi (zanikanie po 5 sekundach)
  updateBloodDecals();

  for (let i = bloodParticles.length - 1; i >= 0; i--) {
    const p = bloodParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += CONFIG.GRAVITY * 0.85;
    p.vx *= 0.98;
    p.life -= p.decay;

    let hitFloor = false;
    let floorY = groundY;

    for (const plat of plats) {
      const topY = groundY - plat.relY;
      if (p.x >= plat.x && p.x <= plat.x + plat.w && p.y >= topY && p.y <= topY + 12 && p.vy > 0) {
        hitFloor = true;
        floorY = topY;
        break;
      }
    }
    if (!hitFloor) {
      for (const obs of obsList) {
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
      for (const plat of plats) {
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
      for (const plat of plats) {
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

// =================================================================
// FIZYKA I RENDEROWANIE ODPADAJACEJ GLOWY (severedHead)
// =================================================================
export function updateSeveredHeads(chars, groundY, platforms = null) {
  const plats = platforms || _worldPlatforms;
  for (const ch of chars) {
    const head = ch.severedHead;
    if (!head) continue;
    if (!head.onGround) {
      head.vy += 0.38;
      head.x += head.vx;
      head.y += head.vy;
      head.rotation += head.rotSpeed;
      if (head.y >= groundY - 6) {
        head.y = groundY - 6;
        head.vy = -head.vy * 0.32;
        head.vx *= 0.78;
        head.rotSpeed *= 0.65;
        if (Math.abs(head.vy) < 0.8) { head.vy = 0; head.onGround = true; }
        addBloodDecal(head.x, groundY);
      }
      for (const plat of plats) {
        const topY = groundY - plat.relY;
        if (head.x >= plat.x && head.x <= plat.x + plat.w && head.y >= topY - 6 && head.y <= topY + 4 && head.vy > 0) {
          head.y = topY - 6;
          head.vy = -head.vy * 0.32;
          head.vx *= 0.78;
          head.rotSpeed *= 0.65;
          if (Math.abs(head.vy) < 0.8) { head.vy = 0; head.onGround = true; }
          break;
        }
      }
    } else {
      head.vx *= 0.92;
      head.rotSpeed *= 0.88;
    }
    head.life--;
    if (head.life <= head.fadeTimer) { head.alpha = Math.max(0, head.life / head.fadeTimer); }
    if (head.life <= 0) { ch.severedHead = null; }
  }
}

export function drawSeveredHeads(ctx, chars) {
  if (!CONFIG.GORE_ENABLED) return;
  for (const ch of chars) {
    const head = ch.severedHead;
    if (!head) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, head.alpha);
    ctx.translate(head.x, head.y);
    ctx.rotate(head.rotation);
    ctx.scale(head.facing, 1);
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(0, 5, 4.2, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    const vis = head.visuals;
    const faceGrad = ctx.createLinearGradient(-4.8, -6.0, 4.8, 6.0);
    faceGrad.addColorStop(0.0, (vis && vis.skinBack) ? vis.skinBack : '#de935e');
    faceGrad.addColorStop(0.5, (vis && vis.skinMid) ? vis.skinMid : '#f5b078');
    faceGrad.addColorStop(1.0, (vis && vis.skinLight) ? vis.skinLight : '#fed7aa');
    ctx.beginPath();
    ctx.ellipse(0, -1.0, 5.0, 5.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = faceGrad;
    ctx.fill();
    ctx.fillStyle = '#2e160a';
    ctx.beginPath();
    ctx.arc(0, -2.5, 5.1, Math.PI * 0.85, Math.PI * 0.15, true);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-1.8, -1.5, 1.2, 0.9, 0, 0, Math.PI * 2);
    ctx.ellipse(2.0, -1.5, 1.2, 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-1.8, -1.5, 0.5, 0, Math.PI * 2);
    ctx.arc(2.0, -1.5, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function updateBloodDecals() {
  for (let i = bloodDecals.length - 1; i >= 0; i--) {
    const d = bloodDecals[i];
    if (d.lifeTime === undefined) {
      // Stare dekale bez lifetime – dodaj pola
      d.lifeTime = 300;
      d.fadeDuration = 60;
      d.fadeTimer = 60;
      d.baseAlpha = d.alpha;
    }
    if (d.lifeTime > 0) {
      d.lifeTime--;
      d.alpha = d.baseAlpha; // pełne krycie przez 5 sekund
    } else {
      // Płynne wygaszanie przez 1 sekundę
      d.fadeTimer = Math.max(0, d.fadeTimer - 1);
      d.alpha = d.baseAlpha * (d.fadeTimer / d.fadeDuration);
      if (d.alpha <= 0.005) {
        bloodDecals.splice(i, 1);
        continue;
      }
    }
  }
}

export function drawBloodDecals(ctx) {
  if (!CONFIG.GORE_ENABLED || bloodDecals.length === 0) return;
  ctx.save();
  for (const d of bloodDecals) {
    ctx.fillStyle = `rgba(136, 19, 19, ${d.alpha.toFixed(3)})`;
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

export function spawnJetpackSparks(x, y, facing, count = 3, customColors = null, inheritVx = 0, inheritVy = 0, nozzleAngle = Math.PI / 2) {
  const colors = customColors || ['#00e5ff', '#38bdf8', '#ffffff'];

  for (let i = 0; i < count; i++) {
    // Stożkowy rozrzut wokół wektora dyszy (+/- 14 stopni)
    const coneAngle = nozzleAngle + (Math.random() - 0.5) * 0.48;
    const thrustSpeed = Math.random() * 5.0 + 4.0;

    // Prędkość wylotowa z uwzględnieniem części wektora prędkości gracza
    const vx = Math.cos(coneAngle) * thrustSpeed + inheritVx * 0.35;
    const vy = Math.sin(coneAngle) * thrustSpeed + inheritVy * 0.35;

    const isSmoke = Math.random() < 0.35;
    const col = isSmoke 
      ? '#64748b' 
      : colors[Math.floor(Math.random() * colors.length)];

    jetpackParticles.push({
      x: x + (Math.random() * 2.0 - 1.0),
      y: y + (Math.random() * 2.0 - 1.0),
      vx,
      vy,
      size: isSmoke ? (Math.random() * 2.0 + 3.0) : (Math.random() * 1.5 + 2.5),
      maxSize: isSmoke ? 8.5 : 5.5,
      life: 1.0,
      decay: isSmoke ? 0.032 : 0.046,
      isFlame: !isSmoke,
      color: col,
      glowColor: colors[0] || '#00e5ff'
    });
  }

  if (jetpackParticles.length > 200) {
    jetpackParticles.splice(0, jetpackParticles.length - 200);
  }
}

export function updateJetpackParticles() {
  for (let i = jetpackParticles.length - 1; i >= 0; i--) {
    const p = jetpackParticles[i];
    p.x += p.vx;
    p.y += p.vy;

    // Opór powietrza
    p.vx *= 0.94;
    p.vy *= 0.94;
    p.life -= p.decay;

    // Chłodzenie ognia w rozszerzający się dym
    if (p.isFlame) {
      if (p.life < 0.55) {
        p.isFlame = false;
        p.color = '#64748b';
      }
    } else {
      // Dym rozszerza się i lekko unosi
      p.size = Math.min(p.maxSize, p.size + 0.18);
      p.vy -= 0.04;
    }

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

    if (p.isFlame) {
      // Gorący płomień z neonowym blaskiem
      ctx.shadowColor = p.glowColor || p.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1.0, p.life * 1.4);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Białe jądro w środku świeżego płomienia
      if (p.life > 0.8) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Rozszerzający się, gasnący dym (fade-out przez alpha)
      ctx.shadowBlur = 0;
      ctx.fillStyle = p.color || '#64748b';
      ctx.globalAlpha = Math.max(0, p.life * 0.35);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

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

// =========================================================================
// OFFSCREEN SKYLINE CANVAS CACHE (Eliminacja migotania okien i sub-pixel aliasingu)
// =========================================================================

let cachedArena1Towers = null;
let cachedArena1H = 0;

const FAR_TOWERS_ARENA1 = [
  { x: 40,   w: 68,  h: 300, spire: 40, side: 'cyan' },
  { x: 160,  w: 105, h: 410, spire: 60, side: 'cyan' },
  { x: 310,  w: 58,  h: 250, spire: 30, side: 'cyan' },
  { x: 410,  w: 125, h: 450, spire: 75, side: 'cyan' },
  { x: 580,  w: 80,  h: 330, spire: 45, side: 'cyan' },
  { x: 720,  w: 95,  h: 370, spire: 50, side: 'center' },
  { x: 870,  w: 115, h: 430, spire: 70, side: 'center' },
  { x: 1030, w: 85,  h: 320, spire: 40, side: 'orange' },
  { x: 1160, w: 130, h: 460, spire: 80, side: 'orange' },
  { x: 1340, w: 60,  h: 270, spire: 35, side: 'orange' },
  { x: 1450, w: 110, h: 400, spire: 60, side: 'orange' },
  { x: 1620, w: 75,  h: 310, spire: 40, side: 'orange' }
];

function getArena1TowersCanvas(horizonY) {
  const curH = Math.ceil(H);
  if (cachedArena1Towers && cachedArena1H === curH) {
    return cachedArena1Towers;
  }

  const cvs = document.createElement('canvas');
  cvs.width = 1800;
  cvs.height = curH;
  const cctx = cvs.getContext('2d');
  cctx.clearRect(0, 0, 1800, curH);

  for (let bIdx = 0; bIdx < FAR_TOWERS_ARENA1.length; bIdx++) {
    const b = FAR_TOWERS_ARENA1[bIdx];
    const bx = Math.round(b.x);
    const by = Math.round(horizonY + 35 - b.h);
    const bw = Math.round(b.w);
    const bh = Math.round(b.h + 120);

    // Bryła wieży w ciemnym graficie
    cctx.fillStyle = '#070a13';
    cctx.fillRect(bx, by, bw, bh);

    // Neonowa krawędź dachu
    const edgeCol = b.side === 'cyan' 
      ? 'rgba(6, 182, 212, 0.45)' 
      : (b.side === 'orange' ? 'rgba(249, 115, 22, 0.45)' : 'rgba(168, 85, 247, 0.35)');
    cctx.fillStyle = edgeCol;
    cctx.fillRect(bx, by, bw, 2);

    // Pasy okien LED / poziome szczeliny świetlne o stałej grubości 3px
    const winCol = b.side === 'cyan' 
      ? 'rgba(34, 211, 238, 0.28)' 
      : (b.side === 'orange' ? 'rgba(251, 146, 60, 0.28)' : 'rgba(192, 132, 252, 0.22)');
    cctx.fillStyle = winCol;
    let row = 0;
    for (let wy = by + 28; wy < by + b.h - 30; wy += 28, row++) {
      let col = 0;
      for (let wx = bx + 8; wx < bx + b.w - 8; wx += 14, col++) {
        // Stabilny, statyczny układ okien (nie zależy od pozycji kamery)
        if (((col * 3 + row * 5 + bIdx) % 7) < 4) {
          cctx.fillRect(Math.round(wx), Math.round(wy), 6, 3);
        }
      }
    }
  }

  cachedArena1Towers = cvs;
  cachedArena1H = curH;
  return cachedArena1Towers;
}

let cachedArena2FarTowers = null;
let cachedArena2NearTowers = null;
let cachedArena2H = 0;

const FAR_TOWERS_ARENA2 = [
  { x: 80, w: 90, h: 320 },
  { x: 220, w: 140, h: 420 },
  { x: 410, w: 85, h: 290 },
  { x: 540, w: 160, h: 470 },
  { x: 740, w: 110, h: 360 },
  { x: 890, w: 150, h: 430 },
  { x: 1080, w: 95, h: 310 }
];

const NEAR_TOWERS_ARENA2 = [
  { x: 60, w: 85, h: 260 },
  { x: 180, w: 120, h: 350 },
  { x: 340, w: 80, h: 230 },
  { x: 460, w: 140, h: 390 },
  { x: 640, w: 95, h: 280 },
  { x: 780, w: 130, h: 360 }
];

function getCyberFarCanvas() {
  const curH = Math.ceil(H);
  if (cachedArena2FarTowers && cachedArena2H === curH) {
    return cachedArena2FarTowers;
  }
  const cvs = document.createElement('canvas');
  cvs.width = 1200;
  cvs.height = curH;
  const cctx = cvs.getContext('2d');
  cctx.clearRect(0, 0, 1200, curH);
  cctx.fillStyle = '#080c14';

  for (const b of FAR_TOWERS_ARENA2) {
    const bx = Math.round(b.x);
    const by = Math.round(curH * 0.88 - b.h);
    cctx.fillRect(bx, by, Math.round(b.w), Math.round(b.h + 120));
  }
  cachedArena2FarTowers = cvs;
  return cachedArena2FarTowers;
}

function getCyberNearCanvas() {
  const curH = Math.ceil(H);
  if (cachedArena2NearTowers && cachedArena2H === curH) {
    return cachedArena2NearTowers;
  }
  const cvs = document.createElement('canvas');
  cvs.width = 960;
  cvs.height = curH;
  const cctx = cvs.getContext('2d');
  cctx.clearRect(0, 0, 960, curH);

  for (let bIdx = 0; bIdx < NEAR_TOWERS_ARENA2.length; bIdx++) {
    const b = NEAR_TOWERS_ARENA2[bIdx];
    const bx = Math.round(b.x);
    const by = Math.round(curH * 0.90 - b.h);
    const bw = Math.round(b.w);
    const bh = Math.round(b.h + 120);

    cctx.fillStyle = '#0f172a';
    cctx.fillRect(bx, by, bw, bh);

    let row = 0;
    for (let wy = by + 26; wy < by + b.h - 25; wy += 26, row++) {
      const isWinCyan = ((bIdx + row) % 2 === 0);
      cctx.fillStyle = isWinCyan ? 'rgba(6, 182, 212, 0.45)' : 'rgba(249, 115, 22, 0.45)';
      for (let wx = bx + 10; wx < bx + b.w - 10; wx += 16) {
        cctx.fillRect(Math.round(wx), Math.round(wy), 8, 4);
      }
    }
  }
  cachedArena2NearTowers = cvs;
  cachedArena2H = curH;
  return cachedArena2NearTowers;
}

export function invalidateSkyCache() {
  cachedArena1Towers = null;
  cachedArena2FarTowers = null;
  cachedArena2NearTowers = null;
  cachedArena1H = 0;
  cachedArena2H = 0;
}

export function drawNeonNightOpsSky(ctx, camX) {
  const time = performance.now() * 0.001;
  const horizonY = H * 0.74;

  // =========================================================================
  // 1. DUAL-TONE GRADIENT NIEBA (GŁĘBOKA CZERŃ KOSMICZNA + NEONOWA ŁUNA)
  // =========================================================================
  // A. Głęboka czerń kosmiczna i ciemny fiolet / obsydian
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0.0, '#020208');
  skyGrad.addColorStop(0.35, '#060714');
  skyGrad.addColorStop(0.68, '#0d0f22');
  skyGrad.addColorStop(1.0, '#15132d');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // B. Ambientowa poświata skrzydeł areny (Cyan po lewej, Orange po prawej)
  const leftGlowX = W * 0.20 + (ARENA_LEFT - camX) * 0.12;
  const rightGlowX = W * 0.80 + (ARENA_RIGHT - camX) * 0.12;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // Horyzontalna łuna na horyzoncie z płynnym wymieszaniem w ciemny, chłodny fiolet w centrum
  const horizGlow = ctx.createLinearGradient(0, 0, W, 0);
  horizGlow.addColorStop(0.0, 'rgba(6, 182, 212, 0.18)');
  horizGlow.addColorStop(0.28, 'rgba(6, 182, 212, 0.08)');
  horizGlow.addColorStop(0.50, 'rgba(79, 70, 229, 0.06)'); // ciemny, chłodny fiolet
  horizGlow.addColorStop(0.72, 'rgba(249, 115, 22, 0.08)');
  horizGlow.addColorStop(1.0, 'rgba(249, 115, 22, 0.18)');
  ctx.fillStyle = horizGlow;
  ctx.fillRect(0, H * 0.46, W, H * 0.54);

  // Lewa mgławica / radialny ambient bazy Cyan (rgba(6, 182, 212, 0.18))
  const cyanRadius = Math.max(W * 0.60, 640);
  const cyanNebula = ctx.createRadialGradient(leftGlowX, horizonY, 20, leftGlowX, horizonY, cyanRadius);
  cyanNebula.addColorStop(0.0, 'rgba(6, 182, 212, 0.18)');
  cyanNebula.addColorStop(0.42, 'rgba(6, 182, 212, 0.05)');
  cyanNebula.addColorStop(1.0, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = cyanNebula;
  ctx.fillRect(0, 0, W, H);

  // Prawa mgławica / radialny ambient bazy Orange (rgba(249, 115, 22, 0.18))
  const orangeRadius = Math.max(W * 0.60, 640);
  const orangeNebula = ctx.createRadialGradient(rightGlowX, horizonY, 20, rightGlowX, horizonY, orangeRadius);
  orangeNebula.addColorStop(0.0, 'rgba(249, 115, 22, 0.18)');
  orangeNebula.addColorStop(0.42, 'rgba(249, 115, 22, 0.05)');
  orangeNebula.addColorStop(1.0, 'rgba(249, 115, 22, 0)');
  ctx.fillStyle = orangeNebula;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // =========================================================================
  // 2. CYFROWY PYŁ / NEONOWE ISKRY W TLE
  // =========================================================================
  const dustCount = 55;
  for (let i = 0; i < dustCount; i++) {
    const seed = i * 71.197;
    const periodX = 3600;
    const worldX = ((seed * 197.3 + time * 22 * ((i % 3 === 0) ? -1 : 1)) % periodX + periodX) % periodX;
    const scrX = Math.round(((worldX - camX * 0.04) % W + W) % W);
    const normY = (Math.sin(seed * 3.7) * 0.5 + 0.5);
    const scrY = Math.round(normY * (H * 0.70) + Math.sin(time * 1.5 + seed) * 10);

    const twinkle = Math.sin(time * 2.6 + seed * 4.1) * 0.5 + 0.5;
    const isCyanSide = (worldX < periodX * 0.5);
    const alpha = (0.28 + twinkle * 0.62).toFixed(2);
    ctx.fillStyle = isCyanSide ? `rgba(34, 211, 238, ${alpha})` : `rgba(251, 146, 60, ${alpha})`;
    const size = (i % 6 === 0) ? 2.4 : ((i % 2 === 0) ? 1.6 : 1.0);
    ctx.fillRect(scrX, scrY, size, size);
  }

  // =========================================================================
  // 3. SUBTELNA NEONOWA SIATKA WEKTOROWA (SYNTHWAVE GRID NA HORYZONCIE)
  // =========================================================================
  ctx.save();
  const gridTopY = H * 0.65;
  const gridBottomY = H * 0.88;
  const vanishX = W * 0.50 + (1760 - camX) * 0.12;

  // Poziome linie perspektywiczne (rozstaw zagęszczony ku horyzontowi)
  const horizLines = 6;
  for (let l = 1; l <= horizLines; l++) {
    const t = l / horizLines;
    const ly = Math.round(gridTopY + (gridBottomY - gridTopY) * (t * t));
    const lineGrad = ctx.createLinearGradient(0, ly, W, ly);
    lineGrad.addColorStop(0.0, `rgba(6, 182, 212, ${0.16 * t})`);
    lineGrad.addColorStop(0.5, `rgba(168, 85, 247, ${0.10 * t})`);
    lineGrad.addColorStop(1.0, `rgba(249, 115, 22, ${0.16 * t})`);
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, ly);
    ctx.lineTo(W, ly);
    ctx.stroke();
  }

  ctx.restore();

  // =========================================================================
  // 4. WARSTWA DALEKA: MEGA-WIEŻE I PYLONY (OFFSCREEN CACHING + ZERO ALIASING)
  // =========================================================================
  const towersCanvas = getArena1TowersCanvas(Math.round(horizonY));
  const farPeriod = 1800;
  const parallaxFactor = 0.03;
  // Całkowite zaokrąglenie przesunięcia kamery (eliminacja subpixel aliasingu):
  const farOffset = Math.floor(((camX * parallaxFactor) % farPeriod + farPeriod) % farPeriod);

  const minLoop = Math.floor((-farOffset) / farPeriod) - 1;
  const maxLoop = Math.ceil((W - farOffset) / farPeriod) + 1;
  for (let loop = minLoop; loop <= maxLoop; loop++) {
    const drawX = Math.floor(loop * farPeriod - farOffset);
    if (drawX + farPeriod < 0 || drawX > W) continue;
    ctx.drawImage(towersCanvas, drawX, 0);
  }

  // =========================================================================
  // 6. KRZYŻUJĄCE SIĘ NEONOWE LASERY / REFLEKTORY (SPOTLIGHTS)
  // =========================================================================
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  const leftSpotX = W * 0.18 + (ARENA_LEFT - camX) * 0.12;
  const rightSpotX = W * 0.82 + (ARENA_RIGHT - camX) * 0.12;
  const spotSourceY = horizonY + 30;
  const beamLen = Math.max(H * 2.2, 1300);

  // A. LEWY REFLEKTOR (CYAN)
  const leftAngle = 0.40 + Math.sin(time * 0.85) * 0.24;
  ctx.save();
  ctx.translate(leftSpotX, spotSourceY);
  ctx.rotate(leftAngle);

  // Szeroki snop światła Cyan: rgba(6, 182, 212, 0.28) -> rgba(6, 182, 212, 0)
  const cyanBeam = ctx.createLinearGradient(0, 0, 0, -beamLen);
  cyanBeam.addColorStop(0.0, 'rgba(6, 182, 212, 0.28)');
  cyanBeam.addColorStop(0.25, 'rgba(6, 182, 212, 0.16)');
  cyanBeam.addColorStop(0.65, 'rgba(6, 182, 212, 0.05)');
  cyanBeam.addColorStop(1.0, 'rgba(6, 182, 212, 0.0)');
  ctx.fillStyle = cyanBeam;

  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(-160, -beamLen);
  ctx.lineTo(160, -beamLen);
  ctx.lineTo(18, 0);
  ctx.closePath();
  ctx.fill();

  // Wewnętrzny rdzeń lasera o wyższej jasności
  const cyanCore = ctx.createLinearGradient(0, 0, 0, -beamLen);
  cyanCore.addColorStop(0.0, 'rgba(165, 243, 252, 0.32)');
  cyanCore.addColorStop(0.35, 'rgba(34, 211, 238, 0.14)');
  cyanCore.addColorStop(1.0, 'rgba(6, 182, 212, 0.0)');
  ctx.fillStyle = cyanCore;
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(-55, -beamLen);
  ctx.lineTo(55, -beamLen);
  ctx.lineTo(6, 0);
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // B. PRAWY REFLEKTOR (ORANGE)
  const rightAngle = -0.40 - Math.sin(time * 0.75 + 1.4) * 0.24;
  ctx.save();
  ctx.translate(rightSpotX, spotSourceY);
  ctx.rotate(rightAngle);

  // Szeroki snop światła Orange: rgba(249, 115, 22, 0.28) -> rgba(249, 115, 22, 0)
  const orangeBeam = ctx.createLinearGradient(0, 0, 0, -beamLen);
  orangeBeam.addColorStop(0.0, 'rgba(249, 115, 22, 0.28)');
  orangeBeam.addColorStop(0.25, 'rgba(249, 115, 22, 0.16)');
  orangeBeam.addColorStop(0.65, 'rgba(249, 115, 22, 0.05)');
  orangeBeam.addColorStop(1.0, 'rgba(249, 115, 22, 0.0)');
  ctx.fillStyle = orangeBeam;

  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(-160, -beamLen);
  ctx.lineTo(160, -beamLen);
  ctx.lineTo(18, 0);
  ctx.closePath();
  ctx.fill();

  // Wewnętrzny rdzeń lasera o wyższej jasności
  const orangeCore = ctx.createLinearGradient(0, 0, 0, -beamLen);
  orangeCore.addColorStop(0.0, 'rgba(254, 215, 170, 0.32)');
  orangeCore.addColorStop(0.35, 'rgba(251, 146, 60, 0.14)');
  orangeCore.addColorStop(1.0, 'rgba(249, 115, 22, 0.0)');
  ctx.fillStyle = orangeCore;
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(-55, -beamLen);
  ctx.lineTo(55, -beamLen);
  ctx.lineTo(6, 0);
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = '#f97316';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#fb923c';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

export const drawSoldatParallax = drawNeonNightOpsSky;

function drawCyberStadiumSky(ctx, camX) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0.0, '#030712');
  sky.addColorStop(0.42, '#090d16');
  sky.addColorStop(0.75, '#0f172a');
  sky.addColorStop(1.0, '#1e1b4b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const time = performance.now() * 0.0012;

  const farCanvas = getCyberFarCanvas();
  const farPeriod = 1200;
  const farOffset = Math.floor(((camX * 0.04) % farPeriod + farPeriod) % farPeriod);
  const minFarLoop = Math.floor((-farOffset) / farPeriod) - 1;
  const maxFarLoop = Math.ceil((W - farOffset) / farPeriod) + 1;
  for (let loop = minFarLoop; loop <= maxFarLoop; loop++) {
    const drawX = Math.floor(loop * farPeriod - farOffset);
    if (drawX + farPeriod < 0 || drawX > W) continue;
    ctx.drawImage(farCanvas, drawX, 0);
  }

  const nearCanvas = getCyberNearCanvas();
  const nearPeriod = 960;
  const nearOffset = Math.floor(((camX * 0.10) % nearPeriod + nearPeriod) % nearPeriod);
  const minNearLoop = Math.floor((-nearOffset) / nearPeriod) - 1;
  const maxNearLoop = Math.ceil((W - nearOffset) / nearPeriod) + 1;
  for (let loop = minNearLoop; loop <= maxNearLoop; loop++) {
    const drawX = Math.floor(loop * nearPeriod - nearOffset);
    if (drawX + nearPeriod < 0 || drawX > W) continue;
    ctx.drawImage(nearCanvas, drawX, 0);
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
      const sourceScreenX = (s.worldX - camera.x) * camera.zoom;
      const sourceScreenY = ((GROUND_Y - 520) - camera.y) * camera.zoom;

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
  const camCenterX = camera ? (camera.x + (camera.viewWidth || (W / (camera.zoom || 1))) / 2) : 1760;
  if (activeArenaId === 'ARENA_2') {
    drawCyberStadiumSky(ctx, camCenterX);
  } else {
    drawNeonNightOpsSky(ctx, camCenterX);
  }
}

/**
 * Renderuje poszarpane krawędzie i wystające zbrojenie na ocalałych brzegach wyrwy
 */
export function drawSeveredGroundEdge(ctx, edgeX, groundY, direction = 'RIGHT') {
  ctx.save();
  const slabH = GROUND_SLAB_HEIGHT;

  if (direction === 'RIGHT') {
    // 1. Profil boczny zniszczonej płyty (grubość 36 px) z ciemnym wnętrzem przekroju
    ctx.fillStyle = '#080c14';
    ctx.fillRect(edgeX - 5, groundY, 5, slabH);

    // Ciemny rdzeń metalowo-kompozytowy
    ctx.fillStyle = '#141c2c';
    ctx.fillRect(edgeX - 4, groundY + 4, 3, slabH - 8);

    // Przypalony brzeg krawędzi
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(edgeX - 1.5, groundY, 1.5, slabH);

    // 2. Poszarpany metal (3 nieregularne zęby wyrwanej blachy)
    ctx.fillStyle = '#2d3748';
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 3);
    ctx.lineTo(edgeX + 5, groundY + 8);
    ctx.lineTo(edgeX, groundY + 13);

    ctx.moveTo(edgeX, groundY + 15);
    ctx.lineTo(edgeX + 7, groundY + 21);
    ctx.lineTo(edgeX, groundY + 26);

    ctx.moveTo(edgeX, groundY + 28);
    ctx.lineTo(edgeX + 4, groundY + 33);
    ctx.lineTo(edgeX, groundY + 36);
    ctx.fill();

    // Wewnętrzny cień na poszarpanym metalu
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 5);
    ctx.lineTo(edgeX + 3, groundY + 8);
    ctx.lineTo(edgeX, groundY + 11);

    ctx.moveTo(edgeX, groundY + 17);
    ctx.lineTo(edgeX + 4, groundY + 21);
    ctx.lineTo(edgeX, groundY + 24);
    ctx.fill();

    // 3. Wystające zbrojenie (2–3 krótkie pomarańczowe/szare pręty)
    // Pręt 1 (górny): zgięty szary pręt ze stopionym, rozżarzonym czubkiem
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 8);
    ctx.lineTo(edgeX + 8, groundY + 9);
    ctx.lineTo(edgeX + 15, groundY + 13);
    ctx.stroke();

    ctx.strokeStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 5;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(edgeX + 11, groundY + 11);
    ctx.lineTo(edgeX + 15, groundY + 13);
    ctx.stroke();

    // Pręt 2 (środkowy): stalowy szary prosty pręt
    ctx.strokeStyle = '#94a3b8';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 20);
    ctx.lineTo(edgeX + 6, groundY + 19);
    ctx.lineTo(edgeX + 11, groundY + 21);
    ctx.stroke();

    // Pręt 3 (dolny): rozgrzany pręt pomarańczowy wygięty ku górze
    ctx.strokeStyle = '#ea580c';
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 4;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 29);
    ctx.lineTo(edgeX + 9, groundY + 29);
    ctx.lineTo(edgeX + 16, groundY + 26);
    ctx.stroke();

    ctx.strokeStyle = '#fdba74';
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(edgeX + 13, groundY + 27);
    ctx.lineTo(edgeX + 16, groundY + 26);
    ctx.stroke();
  } else {
    // Krawędź lewa (kierunek LEFT, brzeg po prawej stronie wyrwy)
    // 1. Profil boczny zniszczonej płyty (grubość 36 px)
    ctx.fillStyle = '#080c14';
    ctx.fillRect(edgeX, groundY, 5, slabH);

    ctx.fillStyle = '#141c2c';
    ctx.fillRect(edgeX + 1, groundY + 4, 3, slabH - 8);

    ctx.fillStyle = '#1c1917';
    ctx.fillRect(edgeX, groundY, 1.5, slabH);

    // 2. Poszarpany metal
    ctx.fillStyle = '#2d3748';
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 3);
    ctx.lineTo(edgeX - 5, groundY + 8);
    ctx.lineTo(edgeX, groundY + 13);

    ctx.moveTo(edgeX, groundY + 15);
    ctx.lineTo(edgeX - 7, groundY + 21);
    ctx.lineTo(edgeX, groundY + 26);

    ctx.moveTo(edgeX, groundY + 28);
    ctx.lineTo(edgeX - 4, groundY + 33);
    ctx.lineTo(edgeX, groundY + 36);
    ctx.fill();

    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 5);
    ctx.lineTo(edgeX - 3, groundY + 8);
    ctx.lineTo(edgeX, groundY + 11);

    ctx.moveTo(edgeX, groundY + 17);
    ctx.lineTo(edgeX - 4, groundY + 21);
    ctx.lineTo(edgeX, groundY + 24);
    ctx.fill();

    // 3. Wystające zbrojenie
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 8);
    ctx.lineTo(edgeX - 8, groundY + 9);
    ctx.lineTo(edgeX - 15, groundY + 13);
    ctx.stroke();

    ctx.strokeStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 5;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(edgeX - 11, groundY + 11);
    ctx.lineTo(edgeX - 15, groundY + 13);
    ctx.stroke();

    ctx.strokeStyle = '#94a3b8';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 20);
    ctx.lineTo(edgeX - 6, groundY + 19);
    ctx.lineTo(edgeX - 11, groundY + 21);
    ctx.stroke();

    ctx.strokeStyle = '#ea580c';
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 4;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 29);
    ctx.lineTo(edgeX - 9, groundY + 29);
    ctx.lineTo(edgeX - 16, groundY + 26);
    ctx.stroke();

    ctx.strokeStyle = '#fdba74';
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(edgeX - 13, groundY + 27);
    ctx.lineTo(edgeX - 16, groundY + 26);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawGround(ctx, worldLeft, worldWidth) {
  const startX = ARENA_LEFT - 320;
  const endX = ARENA_RIGHT + 320;
  const w = endX - startX;

  // =========================================================================
  // 1. DOLNY KANAŁ TECHNICZNY I CZELUŚĆ POD KŁADKĄ (THE VOID & SUB-LEVEL)
  // =========================================================================
  ctx.fillStyle = '#05070d';
  ctx.fillRect(startX, GROUND_Y + GROUND_SLAB_HEIGHT, w, 700);

  // Poziome magistrale i linie techniczne w tle kanału
  ctx.save();
  ctx.strokeStyle = '#0c1322';
  ctx.lineWidth = 2.5;
  for (let dy = 65; dy <= 450; dy += 90) {
    ctx.beginPath();
    ctx.moveTo(startX, GROUND_Y + dy);
    ctx.lineTo(endX, GROUND_Y + dy);
    ctx.stroke();
  }

  // =========================================================================
  // 2. INDUSTRIALNE BELKI NOŚNE / FILARY PODŁOŻA CO 120 PX
  // =========================================================================
  const pillarStep = PILLAR_SPACING;
  const pStart = Math.floor(startX / pillarStep) * pillarStep;
  const pEnd = Math.ceil(endX / pillarStep) * pillarStep;

  for (let px = pStart; px <= pEnd; px += pillarStep) {
    const colW = 18;
    const colLeft = px - colW / 2;
    const colTop = GROUND_Y + GROUND_SLAB_HEIGHT;
    const colH = 500;

    // Główny korpus stalowego dwuteownika
    ctx.fillStyle = '#101726';
    ctx.fillRect(colLeft, colTop, colW, colH);

    // Krawędzie pasów dwuteownika (półki)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(colLeft, colTop, 2.5, colH);
    ctx.fillRect(colLeft + colW - 2.5, colTop, 2.5, colH);

    // Środnik w cieniu
    ctx.fillStyle = '#080d16';
    ctx.fillRect(px - 1.5, colTop, 3, colH);

    // Głowica montażowa u góry filaru
    ctx.fillStyle = '#223049';
    ctx.fillRect(px - 13, colTop, 26, 6);

    // Nity montażowe wzdłuż filaru
    ctx.fillStyle = '#334155';
    for (let ry = colTop + 24; ry < colTop + 350; ry += 36) {
      ctx.fillRect(colLeft + 3.5, ry, 2, 2);
      ctx.fillRect(colLeft + colW - 5.5, ry, 2, 2);
    }

    // Skośne stężenia kratownicowe (X-bracing) pomiędzy filarami
    if (px + pillarStep <= pEnd) {
      ctx.strokeStyle = '#0d1525';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px, colTop + 16);
      ctx.lineTo(px + pillarStep, colTop + 115);
      ctx.moveTo(px, colTop + 115);
      ctx.lineTo(px + pillarStep, colTop + 16);
      ctx.stroke();
    }
  }
  ctx.restore();

  // =========================================================================
  // 3. AKTYWNE SEGMENTY PODŁOŻA (36 PX PŁYTA PRZEMYSŁOWEJ KŁADKI)
  // =========================================================================
  for (let i = 0; i < groundSegments.length; i++) {
    const seg = groundSegments[i];
    if (seg.destroyed) continue; // Wyrwa: segment fizycznie nie istnieje

    // Gradient grubości płyty (36px)
    const slabGrad = ctx.createLinearGradient(seg.x, GROUND_Y, seg.x, GROUND_Y + GROUND_SLAB_HEIGHT);
    slabGrad.addColorStop(0.0, '#151e2e');
    slabGrad.addColorStop(0.25, '#101726');
    slabGrad.addColorStop(0.75, '#0b101c');
    slabGrad.addColorStop(1.0, '#060910');

    ctx.fillStyle = slabGrad;
    ctx.fillRect(seg.x, GROUND_Y, seg.width, GROUND_SLAB_HEIGHT);

    // Poziomy rowek technologiczny płyty
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(seg.x, GROUND_Y + 12, seg.width, 1);

    // Dolna krawędź kładki (skaza / faza)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(seg.x, GROUND_Y + GROUND_SLAB_HEIGHT - 1.5, seg.width, 1.5);

    // Dylatacja / łączenie segmentów
    ctx.fillStyle = '#060911';
    ctx.fillRect(seg.x, GROUND_Y + 1, 1, GROUND_SLAB_HEIGHT - 2);

    // Wcięcie montażowe na środku segmentu
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.fillRect(seg.x + seg.width / 2 - 1, GROUND_Y + 3, 2, 5);
  }

  // =========================================================================
  // 4. NEONOWA POWIERZCHNIA PODŁOŻA – PRZERYWANA W MIEJSCACH WYRWY
  // =========================================================================
  ctx.save();
  const surfaceGrad = ctx.createLinearGradient(ARENA_LEFT, GROUND_Y, ARENA_RIGHT, GROUND_Y);
  surfaceGrad.addColorStop(0.0, '#06b6d4');
  surfaceGrad.addColorStop(0.45, '#00e5ff');
  surfaceGrad.addColorStop(0.55, '#f97316');
  surfaceGrad.addColorStop(1.0, '#ff7700');

  const coreGrad = ctx.createLinearGradient(ARENA_LEFT, GROUND_Y, ARENA_RIGHT, GROUND_Y);
  coreGrad.addColorStop(0.0, '#a5f3fc');
  coreGrad.addColorStop(0.48, '#ffffff');
  coreGrad.addColorStop(0.52, '#ffffff');
  coreGrad.addColorStop(1.0, '#fed7aa');

  // Znajdź ciągłe, nieprzerwane odcinki ocalałego podłoża
  const activeRuns = [];
  let currentRun = null;

  for (let i = 0; i < groundSegments.length; i++) {
    const seg = groundSegments[i];
    if (!seg.destroyed) {
      if (!currentRun) {
        currentRun = { start: seg.x, end: seg.x + seg.width };
      } else {
        currentRun.end = seg.x + seg.width;
      }
    } else {
      if (currentRun) {
        activeRuns.push(currentRun);
        currentRun = null;
      }
    }
  }
  if (currentRun) {
    activeRuns.push(currentRun);
  }

  // Rysuj neon WYŁĄCZNIE na niezniszczonych odcinkach!
  for (const run of activeRuns) {
    const arenaStart = Math.max(ARENA_LEFT, Math.min(ARENA_RIGHT, run.start));
    const arenaEnd = Math.max(ARENA_LEFT, Math.min(ARENA_RIGHT, run.end));

    if (arenaEnd > arenaStart) {
      // Szeroka poświata neonowa
      ctx.strokeStyle = surfaceGrad;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      ctx.moveTo(arenaStart, GROUND_Y);
      ctx.lineTo(arenaEnd, GROUND_Y);
      ctx.stroke();

      // Jaskrawy, biało-neonowy rdzeń świetlny
      ctx.strokeStyle = coreGrad;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(arenaStart, GROUND_Y);
      ctx.lineTo(arenaEnd, GROUND_Y);
      ctx.stroke();
    }

    // Odcinki buforowe poza bramkami
    if (run.start < ARENA_LEFT) {
      const bLeft = run.start;
      const bRight = Math.min(ARENA_LEFT, run.end);
      if (bRight > bLeft) {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.0;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(bLeft, GROUND_Y);
        ctx.lineTo(bRight, GROUND_Y);
        ctx.stroke();
      }
    }

    if (run.end > ARENA_RIGHT) {
      const bLeft = Math.max(ARENA_RIGHT, run.start);
      const bRight = run.end;
      if (bRight > bLeft) {
        ctx.strokeStyle = '#f97316';
        ctx.shadowColor = '#f97316';
        ctx.lineWidth = 2.0;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(bLeft, GROUND_Y);
        ctx.lineTo(bRight, GROUND_Y);
        ctx.stroke();
      }
    }
  }

  // =========================================================================
  // 5. WIZUALIZACJA POSZARPANYCH KRAWĘDZI I WYSTAJĄCEGO ZBROJENIA WYRWY
  // =========================================================================
  for (let i = 0; i < groundSegments.length; i++) {
    const seg = groundSegments[i];
    if (seg.destroyed) continue;

    if (seg.scorchRight) {
      drawSeveredGroundEdge(ctx, seg.x + seg.width, GROUND_Y, 'RIGHT');
    }
    if (seg.scorchLeft) {
      drawSeveredGroundEdge(ctx, seg.x, GROUND_Y, 'LEFT');
    }
  }

  // Pionowe neonowe ściany energetyczne za bramkami
  drawArenaEnergyBoundaries(ctx, GROUND_Y);

  ctx.restore();
}

export function drawArenaEnergyBoundaries(ctx, groundY) {
  const isArena2 = (activeArenaId === 'ARENA_2');
  const leftX = isArena2 ? 150 : ARENA_LEFT;
  const rightX = isArena2 ? 1770 : ARENA_RIGHT;
  const barrierH = 3000; // ok. 300 jednostek/metrów w skali gry (1m = 10px)
  const topY = groundY - barrierH;
  const time = performance.now() * 0.0012;
  const pulse = 0.82 + 0.18 * Math.sin(time * 3.5);

  const walls = [
    {
      x: leftX,
      color: '#06b6d4',
      coreColor: '#a5f3fc',
      glowColor: '#00e5ff',
      fadeDir: 1
    },
    {
      x: rightX,
      color: '#f97316',
      coreColor: '#fed7aa',
      glowColor: '#ff7700',
      fadeDir: -1
    }
  ];

  for (const w of walls) {
    ctx.save();

    // 1. Półprzezroczysta pionowa kurtyna pola siłowego (fading 38px do wnętrza boiska)
    const fieldW = 38;
    const fieldGrad = ctx.createLinearGradient(w.x, 0, w.x + w.fadeDir * fieldW, 0);
    fieldGrad.addColorStop(0.0, w.fadeDir === 1 ? `rgba(6, 182, 212, ${0.28 * pulse})` : `rgba(249, 115, 22, ${0.28 * pulse})`);
    fieldGrad.addColorStop(0.35, w.fadeDir === 1 ? `rgba(0, 229, 255, ${0.12 * pulse})` : `rgba(255, 119, 0, ${0.12 * pulse})`);
    fieldGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = fieldGrad;
    const fx = w.fadeDir === 1 ? w.x : (w.x - fieldW);
    ctx.fillRect(fx, topY, fieldW, barrierH);

    // 2. Dynamiczne impulsy energii wznoszące się wzdłuż ściany
    const step = 50;
    const offset = (time * 75) % step;
    ctx.fillStyle = w.fadeDir === 1 ? 'rgba(165, 243, 252, 0.38)' : 'rgba(254, 215, 170, 0.38)';
    for (let py = groundY - offset; py > topY; py -= step) {
      const rw = 16 + Math.sin(py * 0.03 + time * 3) * 6;
      const rx = w.fadeDir === 1 ? w.x : (w.x - rw);
      ctx.fillRect(rx, py, rw, 1.8);
    }

    // 3. Główna pionowa neonowa linia energetyczna z potężnym rozbłyskiem (glow)
    ctx.strokeStyle = w.color;
    ctx.shadowColor = w.glowColor;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(w.x, groundY);
    ctx.lineTo(w.x, topY);
    ctx.stroke();

    // 4. Intensywny biały rdzeń lasera energetycznego
    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = w.coreColor;
    ctx.shadowBlur = 6;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(w.x, groundY);
    ctx.lineTo(w.x, topY);
    ctx.stroke();

    // 5. Emiter podłożowy u nasady ściany
    ctx.fillStyle = w.color;
    ctx.shadowColor = w.glowColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(w.x, groundY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
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

export function drawTouchControls(ctx, player, leftStick, btnCluster, rightStick, ball, inKickRange = null) {
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

  // 2. PRAWY DRĄŻEK: CELOWANIE, OGIEŃ ORAZ DYNAMICZNY WYKOP PIŁKI
  const rsVisible = (rightStick && (rightStick.active || rightStick.waitingForSecondTap || rightStick.lingerAlpha > 0.01));

  if (rsVisible) {
    const isFiring = rightStick.active && rightStick.isShooting;
    const isWaitingTap = rightStick.waitingForSecondTap && rightStick.windowTimer > 0;

    // Sprawdzenie stanu zasięgu do piłki i wychylenia drążka
    const activeBall = ball || player._ball;
    const inKickRangeVal = (inKickRange !== null && inKickRange !== undefined)
      ? inKickRange
      : (player.inKickReach !== undefined ? player.inKickReach : (activeBall && typeof player.isBallInKickReach === 'function' ? player.isBallInKickReach(player, activeBall) : false));
    const isStickDeflected = rightStick.active && (rightStick.power > 0.12 || (rightStick.movedDist || 0) > 8);
    const isKickReady = inKickRangeVal && isStickDeflected;

    let mainColor = '#00e5ff';
    let glowColor = '#00e5ff';
    let baseBorder = 'rgba(0, 229, 255, 0.35)';

    if (isKickReady) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.015);
      const isStrong = (player.chargePower >= 0.7) || (rightStick.power >= 0.7);
      mainColor = isStrong ? '#facc15' : '#00e5ff';
      glowColor = mainColor;
      baseBorder = isStrong
        ? `rgba(250, 204, 21, ${0.7 + pulse * 0.3})`
        : `rgba(0, 229, 255, ${0.7 + pulse * 0.3})`;
    } else if (isFiring) {
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
    bgGrad.addColorStop(0.0, isKickReady ? 'rgba(15, 23, 42, 0.75)' : 'rgba(30, 41, 59, 0.65)');
    bgGrad.addColorStop(1.0, isKickReady ? 'rgba(2, 6, 23, 0.85)' : 'rgba(15, 23, 42, 0.45)');

    ctx.beginPath();
    ctx.arc(bx, by, maxR, 0, Math.PI * 2);
    ctx.fillStyle = bgGrad;
    ctx.fill();

    ctx.shadowColor = isKickReady ? glowColor : 'transparent';
    ctx.shadowBlur = isKickReady ? 10 : 0;
    ctx.strokeStyle = baseBorder;
    ctx.lineWidth = isKickReady ? 2.2 : 1.6;
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (!isKickReady) {
      ctx.strokeStyle = isFiring ? 'rgba(249, 115, 22, 0.5)' : 'rgba(0, 229, 255, 0.4)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(bx - 10, by); ctx.lineTo(bx + 10, by);
      ctx.moveTo(bx, by - 10); ctx.lineTo(bx + 10, by);
      ctx.stroke();
    }

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

      if (isKickReady) {
        // Wektorowa strzałka wskazująca dokładny tor lotu piłki po puszczeniu palca
        const arrowPower = Math.min(1.0, Math.max(0.15, rightStick.power || (clampedDist / maxR)));
        const arrowLen = 30 + arrowPower * 35;
        const arrowStartX = knobX + normX * 14;
        const arrowStartY = knobY + normY * 14;
        const arrowEndX = arrowStartX + normX * arrowLen;
        const arrowEndY = arrowStartY + normY * arrowLen;

        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(knobX, knobY);
        ctx.lineTo(arrowEndX, arrowEndY);
        ctx.stroke();

        // Grot wektora
        const headLen = 11;
        const headAngle = Math.atan2(normY, normX);
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.moveTo(arrowEndX, arrowEndY);
        ctx.lineTo(
          arrowEndX - headLen * Math.cos(headAngle - Math.PI / 6),
          arrowEndY - headLen * Math.sin(headAngle - Math.PI / 6)
        );
        ctx.lineTo(
          arrowEndX - headLen * Math.cos(headAngle + Math.PI / 6),
          arrowEndY - headLen * Math.sin(headAngle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.strokeStyle = isFiring ? 'rgba(249, 115, 22, 0.8)' : 'rgba(0, 229, 255, 0.6)';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(knobX, knobY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    const knobGrad = ctx.createRadialGradient(knobX - 4, knobY - 4, 3, knobX, knobY, 22);
    if (isKickReady) {
      if ((player.chargePower >= 0.7) || (rightStick.power >= 0.7)) {
        knobGrad.addColorStop(0.0, 'rgba(250, 204, 21, 0.95)');
        knobGrad.addColorStop(0.55, 'rgba(234, 179, 8, 0.80)');
        knobGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.90)');
      } else {
        knobGrad.addColorStop(0.0, 'rgba(0, 229, 255, 0.95)');
        knobGrad.addColorStop(0.55, 'rgba(14, 116, 144, 0.80)');
        knobGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.90)');
      }
    } else if (isFiring) {
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
    ctx.shadowBlur = isKickReady ? 10 : 8;
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = isKickReady ? 2.6 : 2.2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (isKickReady) {
      // Czytelny napis ⚽ KOP na gałce zamiast celownika
      ctx.save();
      ctx.font = '900 10.5px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 6;
      ctx.fillText('⚽ KOP', knobX, knobY);
      ctx.restore();
    } else {
      // Standardowy celownik broni
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(knobX, knobY, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(knobX - 10, knobY); ctx.lineTo(knobX - 7, knobY);
      ctx.moveTo(knobX + 7, knobY); ctx.lineTo(knobX + 10, knobY);
      ctx.moveTo(knobX, knobY - 10); ctx.lineTo(knobX - 7, knobY);
      ctx.moveTo(knobX, knobY + 7); ctx.lineTo(knobX + 10, knobY);
      ctx.stroke();
    }

    let statusText = 'CELOWNIK';
    if (isKickReady) {
      const pPct = Math.round((player.chargePower || rightStick.power || 0) * 100);
      statusText = `⚽ WYKOP: ${pPct}% (PUŚĆ)`;
    } else if (isFiring) {
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

  // 3. DEDYKOWANE PRZYCISKI MOBILNE: WŚLIZG (SHIFT) ORAZ KUCANIE/LEŻENIE (CTRL)
  if (btnCluster) {
    // 3A. PRZYCISK WŚLIZGU (WYŁĄCZNIE W PEŁNYM BIEGU)
    if (btnCluster.slide) {
      const slide = btnCluster.slide;
      const slideR = slide.r || 30;
      const minRun = CONFIG.MIN_RUN_SPEED || 2.5;
      const isSlideReady = (player.onGround && !player.isJumping && Math.abs(player.vx) > minRun && (player.slideCooldown || 0) <= 0);
      const isSlideActive = player.isSliding || slide.active;

      let btnBorder = 'rgba(255, 255, 255, 0.08)';
      let btnBg = 'rgba(15, 23, 42, 0.35)';
      let btnAccent = 'rgba(100, 116, 139, 0.30)';
      let labelColor = 'rgba(100, 116, 139, 0.35)';

      if (isSlideReady || isSlideActive) {
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.009);
        btnBorder = '#10b981';
        btnBg = `rgba(16, 185, 129, ${0.20 + pulse * 0.22})`;
        btnAccent = '#10b981';
        labelColor = '#10b981';

        ctx.beginPath();
        ctx.arc(slide.x, slide.y, slideR + 3 + pulse * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(16, 185, 129, ${(1 - pulse) * 0.65})`;
        ctx.lineWidth = 2.0;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(slide.x, slide.y, slideR, 0, Math.PI * 2);
      ctx.fillStyle = btnBg;
      ctx.fill();
      ctx.strokeStyle = btnBorder;
      ctx.lineWidth = (isSlideReady || isSlideActive) ? 1.8 : 1.0;
      ctx.stroke();

      ctx.save();
      ctx.translate(slide.x, slide.y);
      ctx.beginPath();
      ctx.moveTo(-10, 4); ctx.lineTo(8, 4); ctx.lineTo(10, 0); ctx.lineTo(4, -4); ctx.lineTo(-4, -4); ctx.lineTo(-7, 0);
      ctx.closePath();
      ctx.fillStyle = btnAccent;
      ctx.fill();

      ctx.fillStyle = labelColor;
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('WŚLIZG', 0, 16);
      ctx.restore();
    }

    // 3B. PRZYCISK KUCANIA I LEŻENIA (ODPOWIEDNIK KLAWISZA CTRL)
    if (btnCluster.crouch) {
      const cr = btnCluster.crouch;
      const crR = cr.r || 28;
      const isProne = !!player.isProne;
      const isCrouch = !!player.isCrouching;

      let btnBorder = 'rgba(255, 255, 255, 0.10)';
      let btnBg = 'rgba(15, 23, 42, 0.40)';
      let btnAccent = 'rgba(148, 163, 184, 0.35)';
      let labelColor = 'rgba(148, 163, 184, 0.45)';
      let labelText = 'KUCANIE';

      if (isProne) {
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.009);
        btnBorder = '#10b981';
        btnBg = `rgba(16, 185, 129, ${0.22 + pulse * 0.20})`;
        btnAccent = '#10b981';
        labelColor = '#10b981';
        labelText = 'LEŻENIE';

        ctx.beginPath();
        ctx.arc(cr.x, cr.y, crR + 3 + pulse * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(16, 185, 129, ${(1 - pulse) * 0.65})`;
        ctx.lineWidth = 2.0;
        ctx.stroke();
      } else if (isCrouch) {
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.009);
        btnBorder = '#f59e0b';
        btnBg = `rgba(245, 158, 11, ${0.20 + pulse * 0.20})`;
        btnAccent = '#f59e0b';
        labelColor = '#f59e0b';
        labelText = 'KUCANIE';

        ctx.beginPath();
        ctx.arc(cr.x, cr.y, crR + 3 + pulse * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(245, 158, 11, ${(1 - pulse) * 0.65})`;
        ctx.lineWidth = 2.0;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(cr.x, cr.y, crR, 0, Math.PI * 2);
      ctx.fillStyle = btnBg;
      ctx.fill();
      ctx.strokeStyle = btnBorder;
      ctx.lineWidth = (isProne || isCrouch) ? 1.8 : 1.0;
      ctx.stroke();

      ctx.save();
      ctx.translate(cr.x, cr.y);
      const pFacing = player.facing || 1;

      if (isProne) {
        ctx.beginPath();
        ctx.rect(-11, -1, 20, 4);
        ctx.fillStyle = btnAccent;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pFacing * 9, -2, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.rect(-6, -2, 12, 5);
        ctx.fillStyle = btnAccent;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pFacing * 4, -7, 3, 0, Math.PI * 2);
        ctx.fillStyle = isCrouch ? '#f59e0b' : btnAccent;
        ctx.fill();
      }

      ctx.fillStyle = labelColor;
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(labelText, 0, 15);
      ctx.restore();
    }

    // 3C. DEDYKOWANY PRZYCISK MOBILNY: GRANAT ODŁAMKOWY Z COOLDOWNEM 10s
    if (btnCluster.grenade) {
      const gr = btnCluster.grenade;
      const grR = gr.r || 28;
      const cd = player.grenadeCooldown || 0;
      const maxCd = player.grenadeMaxCooldown || 10.0;
      const isReady = (cd <= 0);

      let btnBorder = 'rgba(255, 255, 255, 0.10)';
      let btnBg = 'rgba(15, 23, 42, 0.40)';
      let btnAccent = 'rgba(148, 163, 184, 0.35)';
      let labelColor = 'rgba(148, 163, 184, 0.45)';
      let labelText = 'GRANAT';

      if (isReady) {
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.007);
        btnBorder = '#f97316';
        btnBg = `rgba(249, 115, 22, ${0.20 + pulse * 0.20})`;
        btnAccent = '#f97316';
        labelColor = '#fdba74';
        labelText = 'GRANAT';

        ctx.beginPath();
        ctx.arc(gr.x, gr.y, grR + 3 + pulse * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(249, 115, 22, ${(1 - pulse) * 0.65})`;
        ctx.lineWidth = 2.0;
        ctx.stroke();
      } else {
        labelText = `${cd.toFixed(1)}s`;
        labelColor = '#fb923c';
        btnAccent = 'rgba(100, 116, 139, 0.25)';
      }

      ctx.beginPath();
      ctx.arc(gr.x, gr.y, grR, 0, Math.PI * 2);
      ctx.fillStyle = btnBg;
      ctx.fill();
      ctx.strokeStyle = btnBorder;
      ctx.lineWidth = isReady ? 1.8 : 1.0;
      ctx.stroke();

      // Radialny overlay ładowania jeśli trwa cooldown
      if (!isReady && maxCd > 0) {
        const progress = Math.max(0, Math.min(1, cd / maxCd));
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(gr.x, gr.y);
        ctx.arc(gr.x, gr.y, grR - 1, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2, false);
        ctx.closePath();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.70)';
        ctx.fill();
        ctx.restore();
      }

      // Ikonka granatu
      ctx.save();
      ctx.translate(gr.x, gr.y - 3);
      ctx.scale(0.85, 0.85);
      drawWeaponSilhouette(ctx, 'GRENADE', 0, 0, isReady);
      ctx.restore();

      // Tekst podpisu lub czasu odnowienia
      ctx.fillStyle = labelColor;
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(labelText, gr.x, gr.y + 15);
    }
  }

  ctx.restore();
}

/**
 * Paski zdrowia i paliwa są renderowane bezpośrednio nad głową każdej postaci w js/player/renderer.js
 */
export function drawEntityHealthBar(ctx, entity, yOffset = 0) {
  // Zastąpione przez minimalistyczne paski HP i JET nad głową w drawPlayer
}

export function drawOffscreenBallIndicator(ctx, ball, camera, player) {
  if (!ball || !camera) return;

  const screenX = (ball.x - camera.x) * camera.zoom;
  const screenY = (ball.y - camera.y) * camera.zoom;

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
 * Rysuje sylwetkę broni w slocie HUD.
 */
export function drawWeaponSilhouette(ctx, type, cx, cy, isSelected) {
  ctx.save();
  ctx.translate(cx, cy);

  if (isSelected) {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.45)';
    ctx.shadowBlur = 4;
  } else {
    ctx.fillStyle = '#94a3b8';
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  if (type === 'AK47') {
    // Kolba
    ctx.fillRect(-13, -1, 5, 2.5);
    // Komora i łoże
    ctx.fillRect(-8, -2, 12, 3.5);
    // Magazynek łukowy
    ctx.beginPath();
    ctx.moveTo(-4, 1.5);
    ctx.lineTo(-2, 5.5);
    ctx.lineTo(0.5, 5.5);
    ctx.lineTo(-1, 1.5);
    ctx.closePath();
    ctx.fill();
    // Lufa
    ctx.fillRect(4, -1, 8, 1.8);
  } else if (type === 'SHOTGUN') {
    // Kolba
    ctx.fillRect(-12, -1, 6, 3);
    // Komora zamkowa
    ctx.fillRect(-6, -2, 10, 4);
    // Długa lufa i podlufowy magazynek
    ctx.fillRect(4, -2, 9, 2.5);
    ctx.fillRect(4, 0.8, 7, 1.8);
  } else if (type === 'GRENADE') {
    // Korpus granatu odłamkowego
    ctx.beginPath();
    ctx.ellipse(0, 1.2, 5.0, 6.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Żebrowanie odłamkowe (siatka segmentów)
    ctx.strokeStyle = isSelected ? 'rgba(0, 0, 0, 0.45)' : 'rgba(15, 23, 42, 0.6)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-4.8, 1.2); ctx.lineTo(4.8, 1.2);
    ctx.moveTo(-4.0, -1.8); ctx.lineTo(4.0, -1.8);
    ctx.moveTo(-4.0, 4.2); ctx.lineTo(4.0, 4.2);
    ctx.moveTo(0, -5.2); ctx.lineTo(0, 7.6);
    ctx.stroke();

    // Szyjka zapalnika i łyżka (safety lever)
    ctx.fillStyle = isSelected ? '#fed7aa' : '#94a3b8';
    ctx.fillRect(-2, -6.5, 4, 2.2);
    ctx.fillRect(1.5, -6.5, 2, 7.0);

    // Zawleczka z kółkiem (pull ring)
    ctx.strokeStyle = isSelected ? '#ffffff' : '#cbd5e1';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(-3.5, -5.8, 1.8, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Rysuje pojedynczy, minimalistyczny kwadratowy kafelek broni w interfejsie HUD.
 */
export function drawWeaponSlot(ctx, btn, isSelected, player, isMobile = false) {
  // Specjalna obsługa slotu granatu taktycznego
  if (btn.id === 'GRENADE') {
    const cd = player.grenadeCooldown || 0;
    const maxCd = player.grenadeMaxCooldown || 10.0;
    const isReady = (cd <= 0);

    const tileSize = btn.w;
    const tileX = btn.x;
    const tileY = btn.y;

    ctx.save();
    ctx.globalAlpha = isMobile ? 0.85 : 0.90;

    // 1. Tło kafelka (Dark Glass)
    const radius = isMobile ? 5 : 6;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(tileX, tileY, tileSize, tileSize, radius);
    else ctx.rect(tileX, tileY, tileSize, tileSize);

    ctx.fillStyle = isReady
      ? 'rgba(30, 41, 59, 0.85)'
      : 'rgba(15, 23, 42, 0.80)';
    ctx.fill();

    // 2. Obrys kafelka i delikatny błysk gotowości
    let borderCol = isReady ? '#f97316' : 'rgba(100, 116, 139, 0.35)';
    if (isReady) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.006);
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = borderCol;
      ctx.shadowBlur = 5 + pulse * 4;
    } else {
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 1.0;
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 3. Ikonka / sylwetka granatu (wyszarzona gdy cd > 0, pełna jasność gdy cd === 0)
    ctx.save();
    ctx.translate(tileX + tileSize / 2, tileY + tileSize / 2 - 3);
    ctx.scale(0.85, 0.85);
    if (!isReady) {
      ctx.globalAlpha = 0.30;
    }
    drawWeaponSilhouette(ctx, 'GRENADE', 0, 0, isReady);
    ctx.restore();

    // 4. Radialny overlay ładowania jeśli trwa cooldown
    if (!isReady && maxCd > 0) {
      const progress = Math.max(0, Math.min(1, cd / maxCd));
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(tileX + tileSize / 2, tileY + tileSize / 2 - 3);
      ctx.arc(tileX + tileSize / 2, tileY + tileSize / 2 - 3, tileSize * 0.40, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2, false);
      ctx.closePath();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fill();
      ctx.restore();
    }

    // 5. Wskaźnik cooldownu / statusu na dole kafelka
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const ammoY = tileY + tileSize - 2;

    if (!isReady) {
      ctx.font = 'bold 7.5px monospace';
      ctx.fillStyle = '#fb923c';
      ctx.fillText(`${cd.toFixed(1)}s`, tileX + tileSize / 2, ammoY);
    } else {
      ctx.font = 'bold 7.5px monospace';
      ctx.fillStyle = '#4ade80';
      ctx.fillText(isMobile ? 'READY' : '[G]', tileX + tileSize / 2, ammoY);
    }

    ctx.restore();
    return;
  }

  const isActive = isSelected;
  const accentCol = btn.id === 'SHOTGUN' ? '#fb923c' : '#f59e0b';

  // Pobranie stanu amunicji z obiektu gracza
  const ammoObj = player.ammo?.[btn.id];
  const defMag = (btn.id === 'SHOTGUN' ? 8 : 30);
  const defRes = (btn.id === 'SHOTGUN' ? 64 : 90);
  const bCurrentAmmo = ammoObj ? ammoObj.currentAmmo : defMag;
  const bReserveAmmo = ammoObj ? ammoObj.reserveAmmo : defRes;
  const bMagSize = ammoObj ? (ammoObj.magSize || defMag) : defMag;
  const bIsReloading = !!ammoObj?.isReloading;
  const bIsNoAmmo = (bCurrentAmmo === 0 && bReserveAmmo === 0);
  const bIsLowAmmo = (!bIsNoAmmo && bCurrentAmmo <= Math.ceil(bMagSize * 0.25));

  const tileSize = btn.w;
  const tileX = btn.x;
  const tileY = btn.y;

  ctx.save();
  ctx.globalAlpha = isMobile ? 0.80 : 0.85;

  // 1. Tło kwadratowego kafelka (Dark Glass)
  const radius = isMobile ? 5 : 6;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(tileX, tileY, tileSize, tileSize, radius);
  } else {
    ctx.rect(tileX, tileY, tileSize, tileSize);
  }
  ctx.fillStyle = isActive
    ? 'rgba(30, 41, 59, 0.85)'
    : 'rgba(15, 23, 42, 0.80)';
  ctx.fill();

  // 2. Obrys ramki (akcent dla aktywnej, przygaszony szary dla nieaktywnej)
  let borderCol = isActive ? accentCol : 'rgba(148, 163, 184, 0.40)';
  if (isActive && bIsNoAmmo) borderCol = '#ef4444';
  else if (isActive && bIsLowAmmo) borderCol = '#f97316';

  ctx.strokeStyle = borderCol;
  ctx.lineWidth = isActive ? 1.6 : 1.0;
  if (isActive) {
    ctx.shadowColor = borderCol;
    ctx.shadowBlur = 6;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 3. Pasek postępu przeładowania na dolnej krawędzi kafelka
  if (bIsReloading && ammoObj) {
    const dur = ammoObj.reloadDuration || 120;
    const prog = Math.max(0, Math.min(1, 1 - (ammoObj.reloadTimer / dur)));
    ctx.save();
    ctx.fillStyle = accentCol;
    ctx.shadowColor = accentCol;
    ctx.shadowBlur = 4;
    ctx.fillRect(tileX + 3, tileY + tileSize - 3, (tileSize - 6) * prog, 2);
    ctx.restore();
  }

  // 4. Ikonka / sylwetka broni w centrum kafelka
  const iconScale = 0.85;
  ctx.save();
  ctx.translate(tileX + tileSize / 2, tileY + tileSize / 2 - 2);
  ctx.scale(iconScale, iconScale);
  drawWeaponSilhouette(ctx, btn.id, 0, 0, isActive);
  ctx.restore();

  // 5. Mały, dyskretny licznik amunicji na dolnej krawędzi kafelka
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const ammoY = tileY + tileSize - 2;

  if (bIsReloading) {
    ctx.font = 'bold 7.5px monospace';
    ctx.fillStyle = accentCol;
    ctx.fillText('RELOAD', tileX + tileSize / 2, ammoY);
  } else if (bIsNoAmmo) {
    ctx.font = 'bold 7.5px monospace';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('EMPTY', tileX + tileSize / 2, ammoY);
  } else {
    ctx.font = 'bold 7.5px monospace';
    ctx.fillStyle = isActive ? '#f8fafc' : '#94a3b8';
    ctx.fillText(`${bCurrentAmmo}/${bReserveAmmo}`, tileX + tileSize / 2, ammoY);
  }

  ctx.restore();
}

export function drawHUD(ctx, player, leftStick, btnCluster, rightStick, ball, inKickRange = null, arenaInfo = null) {
  updateFps();

  ctx.save();

  // Wykrywanie urządzeń mobilnych / małych ekranów
  const isMobile = (typeof window !== 'undefined' && (window.innerWidth < 768 || isTouchDevice || ('ontouchstart' in window) || (navigator && navigator.maxTouchPoints > 0)));

  // =========================================================================
  // 1. STATYSTYKI GRY W LEWYM GÓRNYM ROGU (KLASA, BROŃ, FPS)
  // =========================================================================
  ctx.save();
  ctx.globalAlpha = isMobile ? 0.80 : 0.88;
  ctx.textAlign = 'left';

  const statsX = isMobile ? 12 : 20;
  const lineGap = isMobile ? 15 : 18;
  let curY = isMobile ? 16 : 22;

  ctx.fillStyle = '#f8fafc';
  ctx.font = isMobile ? 'bold 9.5px monospace' : '700 12px monospace';
  ctx.fillText(`KLASA: ${player.currentClass?.name || 'DOMYŚLNA'}`, statsX, curY);

  curY += lineGap;
  // Status aktywnej broni i amunicji w lewym górnym rogu
  const curWep = player.currentWeapon || { id: 'AK47', name: 'AK-47' };
  const wepShort = curWep.id === 'SHOTGUN' ? 'SG' : 'AK';
  const curAmmoObj = player.ammo?.[curWep.id];
  const cAmmo = curAmmoObj ? curAmmoObj.currentAmmo : (curWep.id === 'SHOTGUN' ? 8 : 30);
  const rAmmo = curAmmoObj ? curAmmoObj.reserveAmmo : (curWep.id === 'SHOTGUN' ? 64 : 90);
  const mSize = curAmmoObj ? (curAmmoObj.magSize || (curWep.id === 'SHOTGUN' ? 8 : 30)) : (curWep.id === 'SHOTGUN' ? 8 : 30);
  const isRel = curAmmoObj ? curAmmoObj.isReloading : !!player.isReloading;
  const isNoAmmo = (cAmmo === 0 && rAmmo === 0);
  const isLow = (!isNoAmmo && cAmmo <= Math.ceil(mSize * 0.25));

  let wepTextColor = '#facc15';
  let wepStatusText = `${wepShort} ${cAmmo}/${rAmmo}`;
  if (isRel) {
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.009);
    wepTextColor = `rgba(250, 204, 21, ${0.5 + pulse * 0.5})`;
    wepStatusText = `${wepShort} RELOADING...`;
  } else if (isNoAmmo) {
    wepTextColor = '#ef4444';
    wepStatusText = `${wepShort} NO AMMO`;
  } else if (isLow) {
    wepTextColor = cAmmo === 0 ? '#ef4444' : '#f97316';
  }

  ctx.fillStyle = wepTextColor;
  ctx.font = isMobile ? 'bold 9px monospace' : 'bold 11px monospace';
  ctx.fillText(`BROŃ: ${wepStatusText}`, statsX, curY);

  curY += lineGap;
  const ultMeter = player.ultMeter !== undefined ? player.ultMeter : (player.ultCooldown > 0 ? 0 : 100);
  const isUltReady = (!player.ultCooldown || player.ultCooldown <= 0) && ultMeter >= 100;
  if (isUltReady) {
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 6;
    ctx.font = isMobile ? 'bold 9px monospace' : 'bold 11px monospace';
    ctx.fillText(`ULT [Q]: GRANAT GOTOWY!`, statsX, curY);
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = '#64748b';
    ctx.font = isMobile ? 'bold 9px monospace' : 'bold 11px monospace';
    ctx.fillText(`ULT [Q]: ŁADOWANIE (${ultMeter}%)`, statsX, curY);
  }

  curY += lineGap;
  // Powiększony, czytelny licznik klatek (FPS)
  ctx.fillStyle = '#38bdf8';
  ctx.font = isMobile ? 'bold 11px monospace' : 'bold 14px monospace';
  ctx.fillText(`FPS: ${currentFps}`, statsX, curY);
  ctx.restore();

  // =========================================================================
  // 2. KAFELKI BRONI (KOMPAKTOWE SLOTY 38x38 PX W LEWYM DOLNYM ROGU EKRANU)
  // =========================================================================
  const slotSize = 38;
  const slotGap = 8;
  const panelX = 14;
  const panelY = H - slotSize - 14;

  const curWepId = player.currentWeapon?.id || 'AK47';

  weaponButtons[0].x = panelX;
  weaponButtons[0].y = panelY;
  weaponButtons[0].w = slotSize;
  weaponButtons[0].h = slotSize;

  weaponButtons[1].x = panelX + slotSize + slotGap;
  weaponButtons[1].y = panelY;
  weaponButtons[1].w = slotSize;
  weaponButtons[1].h = slotSize;

  if (weaponButtons[2]) {
    weaponButtons[2].x = panelX + (slotSize + slotGap) * 2;
    weaponButtons[2].y = panelY;
    weaponButtons[2].w = slotSize;
    weaponButtons[2].h = slotSize;
  }

  for (const btn of weaponButtons) {
    const isSelected = (curWepId === btn.id);
    drawWeaponSlot(ctx, btn, isSelected, player, isMobile);
  }

  // =========================================================================
  // 3. TABLICA WYNIKÓW (GÓRA EKRANU)
  // =========================================================================
  const aState = arenaInfo || _worldArenaState;
  const curArenaId = aState.activeArenaId;
  const curScore = aState.arenaScore || { cyan: 0, orange: 0 };
  const curA1State = aState.arena1State;
  const isMatchArena = (curArenaId === 'ARENA_1' || curArenaId === 'ARENA_2');
  if (isMatchArena) {
    const scoreBoxW = isMobile ? 180 : 230;
    const scoreBoxH = isMobile ? 26 : 34;
    const scoreBoxX = (W - scoreBoxW) / 2;
    const scoreBoxY = isMobile ? 10 : 16;

    ctx.save();
    ctx.globalAlpha = isMobile ? 0.80 : 0.88;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.2;
    if (ctx.roundRect) ctx.roundRect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, 6);
    else ctx.rect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH);
    ctx.fill();
    ctx.stroke();

    ctx.font = isMobile ? 'bold 10px monospace' : 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 6;
    ctx.fillText(`CYAN ${curScore.cyan}`, scoreBoxX + scoreBoxW / 2 - (isMobile ? 10 : 14), scoreBoxY + (isMobile ? 17 : 22));

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText(':', scoreBoxX + scoreBoxW / 2, scoreBoxY + (isMobile ? 16 : 21));

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 6;
    ctx.fillText(`${curScore.orange} ORANGE`, scoreBoxX + scoreBoxW / 2 + (isMobile ? 10 : 14), scoreBoxY + (isMobile ? 17 : 22));

    if (curArenaId === 'ARENA_1' && curA1State?.waitingForKickoff) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.005);
      ctx.textAlign = 'center';
      ctx.font = isMobile ? 'bold 8.5px monospace' : 'bold 10px monospace';
      ctx.fillStyle = `rgba(56, 189, 248, ${0.80 + pulse * 0.20})`;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 8;
      ctx.fillText('⚡ ROZPOCZNIJ MECZ: PIŁKA NA OŁTARZU CENTRALNYM (X: 1760) ⚡', W / 2, scoreBoxY + scoreBoxH + (isMobile ? 12 : 16));
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
    drawTouchControls(ctx, player, leftStick, btnCluster, rightStick, ball, inKickRange);
  }
}
