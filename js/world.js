// =========================================================================
// WORLD.JS - MODUŁ ZAMKNIĘTEJ ARENY BOJOWEJ + SYSTEM GORE & KINEMATYKA ŚMIERCI
// =========================================================================

import { CONFIG, START_X, ARENA_LEFT, ARENA_RIGHT, ARENA_WIDTH, MAP_WIDTH, isTouchDevice, setTouchDevice, ARENA_2_PANDORA } from './config.js';
import { spawnConcreteDebris, spawnRicochetSparks } from './particles.js';
import { drawPandoraBackground } from './background.js';
import { goalTriggerLeft, goalTriggerRight, ARENA_1_GOALS } from './arenas/arena1.js';
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
  shakeImpulse,
  setCameraCanvas,
  setCameraGroundY,
  setCameraArenaId,
  getCameraArenaId
} from './camera.js';
export { isTouchDevice, setTouchDevice, ARENA_2_PANDORA, goalTriggerLeft, goalTriggerRight, ARENA_1_GOALS, MAP_WIDTH };

export const centerX = MAP_WIDTH / 2; // 1800

export let _worldPlatforms = [];
export let _worldCustomObstacles = [];
export let platforms = [];
export let slopes = [];
export let walls = [];
export let obstacles = [];

export function resetColliders() {
  platforms = [];
  slopes = [];
  walls = [];
  obstacles = [];
  _worldPlatforms = [];
  _worldCustomObstacles = [];
}

export var activeArenaId = 'ARENA_1';
export const ladders = [];
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
    if (arenaState.activeArenaId) {
      activeArenaId = arenaState.activeArenaId;
      if (typeof setCameraArenaId === 'function') setCameraArenaId(activeArenaId);
    }
    if (arenaState.arenaScore) _worldArenaState.arenaScore = arenaState.arenaScore;
    if (arenaState.arena1State) _worldArenaState.arena1State = arenaState.arena1State;
  }
}

export function setActiveArenaId(id) {
  activeArenaId = id;
  if (typeof setCameraArenaId === 'function') {
    setCameraArenaId(id);
  }
}

export const goalCelebration = {
  active: false,
  timer: 0,
  team: '',
  color: '#00F0FF'
};

export function triggerGoalCelebration(team, color) {
  goalCelebration.active = true;
  goalCelebration.timer = 110;
  goalCelebration.team = team;
  goalCelebration.color = color || (team === 'CYAN' ? '#00F0FF' : '#FF8800');
}

export let canvas = null;
export let ctx = null;
export let W = window.innerWidth;
export let H = window.innerHeight;
export let DPR = Math.min(window.devicePixelRatio || 1, 2);
export let GROUND_Y = 1000;

/**
 * Renderuje pasy ostrzegawcze (żółto-czarne skośne pasy przemysłowe)
 */
export function drawHazardStripes(ctx, x, y, w, h) {
  if (!ctx || w <= 0 || h <= 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = '#eab308';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#18181b';
  for (let sx = x - h; sx < x + w + h; sx += 12) {
    ctx.beginPath();
    ctx.moveTo(sx, y);
    ctx.lineTo(sx + 6, y);
    ctx.lineTo(sx - 2, y + h);
    ctx.lineTo(sx - 8, y + h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

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
  if (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2') {
    return false;
  }
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
  if (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2') {
    return false;
  }
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
  if (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2') {
    return { holeStart: -600, holeEnd: 4600 };
  }
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



setCameraArenaId(activeArenaId);
setCameraGroundY(GROUND_Y);

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
  getCanvasLogicalHeight,
  setCameraCanvas,
  setCameraGroundY,
  setCameraArenaId,
  getCameraArenaId
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
  { id: 'AK47', name: 'AK', fullName: 'AK-47', type: 'AUTO', key: '1', x: 20, y: 0, w: 36, h: 36 },
  { id: 'SHOTGUN', name: 'SG', fullName: 'SHOTGUN', type: 'SEMI', key: '2', x: 20, y: 0, w: 36, h: 36 },
  { id: 'SNIPER', name: 'SR', fullName: 'BARRETT .50', type: 'SNIPER', key: '3', x: 20, y: 0, w: 36, h: 36 },
  { id: 'GRENADE', name: 'HE', fullName: 'GRENADE', type: 'TACTICAL', key: 'G', x: 20, y: 0, w: 36, h: 36 }
];

export function initCanvas(canvasEl) {
  canvas = canvasEl;
  setCameraCanvas(canvasEl);
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
  GROUND_Y = 1000;
  setCameraGroundY(GROUND_Y);
  if (Array.isArray(groundSegments)) {
    for (const seg of groundSegments) {
      seg.y = GROUND_Y;
    }
  }
  invalidateSkyCache();
  const isA3 = (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3');
  const isA2 = (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2');
  if (player && !isA3 && !isA2) {
    if (player.y >= GROUND_Y - player.h - 5 && player.currentGroundY === GROUND_Y) {
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
      ctx.shadowBlur = 0;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1.0, p.life * 1.4);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Białe jądro w środku świeżego płomienia
      if (p.life > 0.8) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
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

export function invalidateSkyCache() {
  cachedArena1Towers = null;
  cachedArena1H = 0;
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
  ctx.shadowBlur = 0;
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
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fb923c';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

export const drawSoldatParallax = drawNeonNightOpsSky;

export function drawCyberStadiumSky(ctx, camX) {
  drawPandoraBackground(ctx, camera);
}

/**
 * Renderuje malownicze tło Kanionu w Dżungli (Jungle Canyon / Arena 3):
 * - Wilgotne, poranne niebo z mgłą nad koronami drzew i delikatnymi promieniami słońca (god rays)
 * - Paralaksa daleka (camX * 0.015): pasma zamglonych grzbietów górskich pokrytych gęstą dżunglą
 * - Paralaksa średnia (camX * 0.038): gigantyczne drzewa deszczowe z wiszącymi lianami i krasowe filary skalne
 * - Paralaksa bliska (camX * 0.075): tropikalne liście i gałęzie palmowe okalające kadr od góry
 * - Cząsteczki atmosferyczne: wirujące tropikalne liście i świetliste zarodniki unoszące się na wietrze
 */
export function drawJungleSky(ctx, camX) {
  const time = performance.now() * 0.001;
  const horizonY = H * 0.78;

  // 1. PIONOWY GRADIENT TŁA BAZOWEGO (WILGOTNE NIEBO DŻUNGLI -> MGŁA NAD KORONAMI DRZEW)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0.0, '#c7d6be');
  skyGrad.addColorStop(0.32, '#a7bf9d');
  skyGrad.addColorStop(0.58, '#829f77');
  skyGrad.addColorStop(0.82, '#5e7c53');
  skyGrad.addColorStop(1.0, '#3a5431');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. (Usunięto pionowe snopy światła / god rays)
  ctx.shadowBlur = 0;

  // 3. PARALAKSA DALEKA (camX * 0.015) – Zamglone pasma górskie i sylwetki gęstych koron lasu
  const farPeriod = 1400;
  const farOffset = Math.floor(((camX * 0.015) % farPeriod + farPeriod) % farPeriod);
  const minFarLoop = Math.floor((-farOffset) / farPeriod) - 1;
  const maxFarLoop = Math.ceil((W - farOffset) / farPeriod) + 1;

  ctx.save();
  ctx.fillStyle = '#49633f';

  for (let loop = minFarLoop; loop <= maxFarLoop; loop++) {
    const baseX = Math.floor(loop * farPeriod - farOffset);
    if (baseX + farPeriod < 0 || baseX > W) continue;

    // Pasmo górskie 1 (lewy masyw krasowy)
    ctx.beginPath();
    ctx.moveTo(baseX, horizonY);
    ctx.lineTo(baseX, horizonY - 140);
    ctx.quadraticCurveTo(baseX + 160, horizonY - 310, baseX + 340, horizonY - 180);
    ctx.quadraticCurveTo(baseX + 520, horizonY - 340, baseX + 720, horizonY - 160);
    ctx.quadraticCurveTo(baseX + 940, horizonY - 290, baseX + 1140, horizonY - 170);
    ctx.quadraticCurveTo(baseX + 1300, horizonY - 260, baseX + farPeriod, horizonY - 140);
    ctx.lineTo(baseX + farPeriod, horizonY);
    ctx.closePath();
    ctx.fill();

    // Zaokrąglone kępy gęstych koron drzew na grzbiecie górskim
    ctx.fillStyle = '#3c5333';
    for (let bx = 40; bx < farPeriod; bx += 85) {
      const hillY = horizonY - 180 - Math.sin((bx / farPeriod) * Math.PI * 3) * 60;
      ctx.beginPath();
      ctx.arc(baseX + bx, hillY, 48, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillStyle = '#49633f';
  }

  // Pozioma warstwa mgły w dolinie górskiej
  const mistGrad = ctx.createLinearGradient(0, horizonY - 180, 0, horizonY - 40);
  mistGrad.addColorStop(0.0, 'rgba(180, 203, 172, 0)');
  mistGrad.addColorStop(0.5, 'rgba(180, 203, 172, 0.28)');
  mistGrad.addColorStop(1.0, 'rgba(180, 203, 172, 0.06)');
  ctx.fillStyle = mistGrad;
  ctx.fillRect(0, horizonY - 180, W, 140);
  ctx.restore();

  // 4. PARALAKSA ŚREDNIA (camX * 0.038) – Kolumny krasowe i pradawne drzewa tropikalne
  const midPeriod = 1100;
  const midOffset = Math.floor(((camX * 0.038) % midPeriod + midPeriod) % midPeriod);
  const minMidLoop = Math.floor((-midOffset) / midPeriod) - 1;
  const maxMidLoop = Math.ceil((W - midOffset) / midPeriod) + 1;

  ctx.save();
  for (let loop = minMidLoop; loop <= maxMidLoop; loop++) {
    const baseX = Math.floor(loop * midPeriod - midOffset);
    if (baseX + midPeriod < 0 || baseX > W) continue;

    // Filar skalny w tle (jak formacje krasowe w Wietnamie / Soldat 2)
    const p1X = baseX + 220;
    const p1Y = horizonY - 330;
    ctx.fillStyle = '#344b2f';
    ctx.beginPath();
    ctx.moveTo(p1X - 25, horizonY);
    ctx.lineTo(p1X - 18, p1Y + 30);
    ctx.quadraticCurveTo(p1X, p1Y - 10, p1X + 45, p1Y + 25);
    ctx.lineTo(p1X + 55, horizonY);
    ctx.closePath();
    ctx.fill();

    // Czapa zieleni na szczycie filaru w tle
    ctx.fillStyle = '#4c6c44';
    ctx.beginPath();
    ctx.arc(p1X + 15, p1Y + 12, 34, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();

    // Drzewo 1: Gigantyczne drzewo tropikalne z rozłożystą koroną
    const t1X = baseX + 560;
    const t1Y = horizonY - 260;
    ctx.fillStyle = '#263a22';
    // Pień drzewa
    ctx.beginPath();
    ctx.moveTo(t1X - 16, horizonY);
    ctx.quadraticCurveTo(t1X - 8, horizonY - 130, t1X - 10, t1Y + 40);
    ctx.lineTo(t1X + 18, t1Y + 40);
    ctx.quadraticCurveTo(t1X + 16, horizonY - 130, t1X + 28, horizonY);
    ctx.closePath();
    ctx.fill();

    // Konary i korona liściasta
    ctx.fillStyle = '#2e4929';
    ctx.beginPath();
    ctx.arc(t1X - 45, t1Y + 15, 62, 0, Math.PI * 2);
    ctx.arc(t1X + 40, t1Y + 10, 68, 0, Math.PI * 2);
    ctx.arc(t1X, t1Y - 20, 78, 0, Math.PI * 2);
    ctx.fill();

    // Jaśniejszy refleks na koronie
    ctx.fillStyle = '#41633a';
    ctx.beginPath();
    ctx.arc(t1X - 10, t1Y - 30, 46, 0, Math.PI * 2);
    ctx.arc(t1X + 30, t1Y - 10, 42, 0, Math.PI * 2);
    ctx.fill();

    // Wiszące pnącza / liany ze skrajnych gałęzi
    ctx.strokeStyle = '#273f23';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(t1X - 70, t1Y + 40);
    ctx.quadraticCurveTo(t1X - 65, t1Y + 110, t1X - 74, t1Y + 160);
    ctx.moveTo(t1X + 65, t1Y + 35);
    ctx.quadraticCurveTo(t1X + 70, t1Y + 100, t1X + 62, t1Y + 150);
    ctx.stroke();

    // Drzewo 2 (mniejsze skupisko w tle po prawej)
    const t2X = baseX + 920;
    const t2Y = horizonY - 220;
    ctx.fillStyle = '#263a22';
    ctx.beginPath();
    ctx.arc(t2X - 25, t2Y + 20, 52, 0, Math.PI * 2);
    ctx.arc(t2X + 30, t2Y + 15, 55, 0, Math.PI * 2);
    ctx.arc(t2X, t2Y - 10, 60, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 5. PARALAKSA BLISKA (camX * 0.075) – Tropikalne liście zwisające z góry ekranu
  const nearPeriod = 900;
  const nearOffset = Math.floor(((camX * 0.075) % nearPeriod + nearPeriod) % nearPeriod);
  const minNearLoop = Math.floor((-nearOffset) / nearPeriod) - 1;
  const maxNearLoop = Math.ceil((W - nearOffset) / nearPeriod) + 1;

  ctx.save();
  for (let loop = minNearLoop; loop <= maxNearLoop; loop++) {
    const baseX = Math.floor(loop * nearPeriod - nearOffset);
    if (baseX + nearPeriod < 0 || baseX > W) continue;

    // Duże liście palmowe i paprocie w górnych partiach kadru
    const lx1 = baseX + 90;
    const leafSway1 = Math.sin(time * 1.5 + loop) * 8;
    ctx.fillStyle = '#1c2e1a';
    ctx.beginPath();
    ctx.moveTo(lx1 - 50, 0);
    ctx.quadraticCurveTo(lx1 + leafSway1, 85, lx1 + 55 + leafSway1, 130);
    ctx.quadraticCurveTo(lx1 + 25 + leafSway1, 75, lx1 + 35, 0);
    ctx.closePath();
    ctx.fill();

    const lx2 = baseX + 140;
    const leafSway2 = Math.cos(time * 1.7 + loop) * 10;
    ctx.fillStyle = '#284124';
    ctx.beginPath();
    ctx.moveTo(lx2 - 40, 0);
    ctx.quadraticCurveTo(lx2 + leafSway2, 110, lx2 + 75 + leafSway2, 175);
    ctx.quadraticCurveTo(lx2 + 35 + leafSway2, 95, lx2 + 45, 0);
    ctx.closePath();
    ctx.fill();

    // Długa zwisająca liana z listkami
    const vineX = baseX + 680;
    const vineSway = Math.sin(time * 1.2 + loop * 2.1) * 14;
    ctx.strokeStyle = '#1e331b';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(vineX, 0);
    ctx.quadraticCurveTo(vineX + vineSway * 0.5, 140, vineX + vineSway, 280);
    ctx.stroke();

    // Drobne listki na lianie
    ctx.fillStyle = '#3f6236';
    for (let vy = 40; vy < 260; vy += 32) {
      const vProgress = vy / 280;
      const vx = vineX + vineSway * vProgress;
      const leafDir = (vy % 64 === 0) ? 1 : -1;
      ctx.beginPath();
      ctx.ellipse(vx + leafDir * 9, vy, 11, 5, leafDir * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // 6. CZĄSTECZKI TROPIKALNE (ZOPTYMALIZOWANE DO 22 SZTUK, BEZ CIENI I TRANSFORMACJI)
  ctx.save();
  ctx.shadowBlur = 0;
  const leafCount = 22;
  for (let i = 0; i < leafCount; i++) {
    const seed = i * 53.17;
    const spdY = 24 + (i % 5) * 11;
    const driftY = ((time * spdY + seed * 41) % (H + 60)) - 30;
    const sway = Math.sin(time * 1.9 + seed) * 32;
    const leafX = (((seed * 179.3 + sway - camX * 0.05) % W + W) % W);

    if (i % 3 === 0) {
      // Tropikalny listek (szybkie małe koło)
      ctx.fillStyle = (i % 6 === 0) ? '#65a30d' : '#4d7c0f';
      ctx.beginPath();
      ctx.arc(leafX, driftY, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Świetlisty zarodnik / pyłek (szybki prostokąt bez gradientu)
      const sporePulse = 0.4 + 0.5 * (0.5 + 0.5 * Math.sin(time * 3.0 + seed));
      const sporeY = (H - ((time * (spdY * 0.75) + seed * 27) % H));
      ctx.fillStyle = (i % 2 === 0)
        ? `rgba(250, 204, 21, ${sporePulse * 0.75})`
        : `rgba(163, 230, 53, ${sporePulse * 0.65})`;
      const sz = (i % 5 === 0) ? 2.5 : 1.6;
      ctx.fillRect(leafX, sporeY, sz, sz);
    }
  }
  ctx.restore();
}

/**
 * Kompatybilność wsteczna: tło Areny 3 renderowane jest autonomicznie przez wtyczkę js/arenas/arena3.js
 */
export function drawFoundrySky(ctx, camX) {
  // Delegowane do aktywnego modułu areny
}

export function drawSky(ctx) {
  const camCenterX = camera ? (camera.x + (camera.viewWidth || (W / (camera.zoom || 1))) / 2) : 1760;
  if (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY') {
    // Tło Areny 3 (The Foundry) renderowane jest bezpośrednio przez wtyczkę arena3.js
    return;
  }
  if (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X') {
    drawPandoraBackground(ctx, camera);
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
    ctx.shadowBlur = 0;
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
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 29);
    ctx.lineTo(edgeX + 9, groundY + 29);
    ctx.lineTo(edgeX + 16, groundY + 26);
    ctx.stroke();

    ctx.strokeStyle = '#fdba74';
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = 0;
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
    ctx.shadowBlur = 0;
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
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(edgeX, groundY + 29);
    ctx.lineTo(edgeX - 9, groundY + 29);
    ctx.lineTo(edgeX - 16, groundY + 26);
    ctx.stroke();

    ctx.strokeStyle = '#fdba74';
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(edgeX - 13, groundY + 27);
    ctx.lineTo(edgeX - 16, groundY + 26);
    ctx.stroke();
  }

  ctx.restore();
}

// =========================================================================
// ARENA 3: CIĄGŁY PROFIL GEOMETRII KANIONU (SOLID CANYON PROFILE)
// =========================================================================
export const LOWER_CAVERN_FLOOR_Y = 1180;
export const LOWER_CAVERN_CEILING_Y = 780;
export const LOWER_CAVERN_BOUNDS = {
  left: 950,
  right: 2300,
  ceilY: 780,
  floorY: 1180
};

// =========================================================================
// ARENA 3: NATURALNE PROFILE GEOMETRII JASKINI (DWUPOZIOMOWY UKŁAD)
// =========================================================================
// 1. Lewy masyw z pochyłą rampą zejściową (kąt ~35°) schodzącą do podziemia (x: 700 do 950)
export const LEFT_MASSIF_AND_RAMP_PROFILE = [
  { x: ARENA_LEFT - 320, y: 420 },
  { x: 0, y: 420 },
  { x: 360, y: 420 },
  { x: 480, y: 460 },
  { x: 620, y: 520 },
  { x: 700, y: 580 }, // Górny brzeg rampy zejściowej
  // Naturalna pochyła rampa skalna schodząca ze zbocza pod kątem ~35° w głąb pieczary
  { x: 750, y: 700 },
  { x: 800, y: 820 },
  { x: 860, y: 950 },
  { x: 910, y: 1060 },
  { x: 950, y: 1180 }  // Płynne połączenie z podłogą dolnej pieczary (y = 1180)
];

// 2. Pomost Środkowy (Płyta główna / Grzbiety): gruba lita platforma skalna (x: 950 do 2300)
export const CENTRAL_HILL_PROFILE = [
  { x: 950, y: 580 },
  { x: 1160, y: 520 },
  { x: 1360, y: 460 },
  { x: 1540, y: 400 },
  { x: 1700, y: 360 },
  { x: 1800, y: 340 }, // Szczyt wzgórza
  { x: 1940, y: 400 },
  { x: 2040, y: 440 },
  { x: 2120, y: 480 },
  { x: 2300, y: 580 }  // Krawędź prawej pionowej rozpadliny
];

// 3. Prawy masyw skalny za pionową rozpadliną (x: 2480 do ARENA_RIGHT + 320)
export const RIGHT_MASSIF_PROFILE = [
  { x: 2480, y: 580 }, // Prawa krawędź rozpadliny
  { x: 2560, y: 520 },
  { x: 2640, y: 480 },
  { x: 2820, y: 480 },
  { x: 2900, y: 440 },
  { x: 3220, y: 440 },
  { x: 3300, y: 420 },
  { x: 3600, y: 420 },
  { x: ARENA_RIGHT + 320, y: 420 }
];

export const JUNGLE_CANYON_PROFILE = [
  { x: ARENA_LEFT - 320, relY: 580, y: 420 },
  { x: 0, relY: 580, y: 420 },
  { x: 360, relY: 580, y: 420 },
  { x: 480, relY: 540, y: 460 },
  { x: 620, relY: 480, y: 520 },
  { x: 700, relY: 420, y: 580 },
  { x: 950, relY: 420, y: 580 },
  { x: 1160, relY: 480, y: 520 },
  { x: 1360, relY: 540, y: 460 },
  { x: 1540, relY: 600, y: 400 },
  { x: 1700, relY: 640, y: 360 },
  { x: 1800, relY: 660, y: 340 },
  { x: 1940, relY: 600, y: 400 },
  { x: 2040, relY: 560, y: 440 },
  { x: 2120, relY: 520, y: 480 },
  { x: 2300, relY: 420, y: 580 },
  { x: 2480, relY: 420, y: 580 },
  { x: 2560, relY: 480, y: 520 },
  { x: 2640, relY: 520, y: 480 },
  { x: 2820, relY: 520, y: 480 },
  { x: 2900, relY: 560, y: 440 },
  { x: 3220, relY: 560, y: 440 },
  { x: 3300, relY: 580, y: 420 },
  { x: 3600, relY: 580, y: 420 },
  { x: ARENA_RIGHT + 320, relY: 580, y: 420 }
];

export function getCanyonSurfaceInfo(px, groundY) {
  // 1. Lewy masyw i rampa wejściowa 35° (x <= 950)
  if (px <= 950) {
    const pts = LEFT_MASSIF_AND_RAMP_PROFILE;
    if (px <= pts[0].x) return { surfaceY: pts[0].y, slope: 0 };
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      if (px >= p0.x && px <= p1.x) {
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const t = dx > 0 ? (px - p0.x) / dx : 0;
        return { surfaceY: p0.y + t * dy, slope: -dy / (dx || 1) };
      }
    }
    return { surfaceY: 1180, slope: 0 };
  }
  // 2. Pomost środkowy / szczyt wzgórza (x: 950 do 2300)
  if (px <= 2300) {
    const pts = CENTRAL_HILL_PROFILE;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      if (px >= p0.x && px <= p1.x) {
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const t = dx > 0 ? (px - p0.x) / dx : 0;
        return { surfaceY: p0.y + t * dy, slope: -dy / (dx || 1) };
      }
    }
    return { surfaceY: 580, slope: 0 };
  }
  // 3. Prawa pionowa rozpadlina (x: 2300 do 2480) - otwarta przestrzeń szybu, dno na dole 1180
  if (px < 2480) {
    return { surfaceY: 1180, slope: 0 };
  }
  // 4. Prawy masyw skalny (x >= 2480)
  const pts = RIGHT_MASSIF_PROFILE;
  if (px >= pts[pts.length - 1].x) return { surfaceY: pts[pts.length - 1].y, slope: 0 };
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    if (px >= p0.x && px <= p1.x) {
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const t = dx > 0 ? (px - p0.x) / dx : 0;
      return { surfaceY: p0.y + t * dy, slope: -dy / (dx || 1) };
    }
  }
  return { surfaceY: 420, slope: 0 };
}

export function getCanyonSurfaceY(px, groundY) {
  return getCanyonSurfaceInfo(px, groundY).surfaceY;
}

export const MINE_CAVERN_PROFILE = CENTRAL_HILL_PROFILE;

// =========================================================================
// STROP DOLNEJ PIECZARY BOJOWEJ (NATURALNY, NIEREGULARNY PROFIL SKALNY)
// Wysokość stropu podziemia y ≈ 780, grubość platformy pomostu 200–440 px
// =========================================================================
export const LOWER_CAVERN_CEILING_PROFILE = [
  { x: 950, y: 780 },
  { x: 1080, y: 775 },
  { x: 1220, y: 785 },
  { x: 1380, y: 770 },
  { x: 1560, y: 785 },
  { x: 1740, y: 775 },
  { x: 1920, y: 785 },
  { x: 2100, y: 775 },
  { x: 2220, y: 780 },
  { x: 2300, y: 780 }
];

export function getLowerCavernCeilingY(px) {
  const pts = LOWER_CAVERN_CEILING_PROFILE;
  if (px <= pts[0].x) return pts[0].y;
  if (px >= pts[pts.length - 1].x) return pts[pts.length - 1].y;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    if (px >= p0.x && px <= p1.x) {
      const dx = p1.x - p0.x;
      const t = dx > 0 ? (px - p0.x) / dx : 0;
      return p0.y + t * (p1.y - p0.y);
    }
  }
  return 780;
}

// =========================================================================
// NATURALNE PÓŁKI SKALNE W DOLNEJ PIECZARZE (ONE-WAY PLATFORMS)
// =========================================================================
export const LOWER_CAVERN_SHELVES = [
  {
    id: 'lower_shelf_left',
    type: 'rock_shelf',
    theme: 'jungle',
    name: 'Lewa Półka Skalna',
    x: 1050,
    y: 950,
    w: 220,
    h: 28,
    oneWay: true,
    solid: false
  },
  {
    id: 'lower_dais_center',
    type: 'rock_shelf',
    theme: 'jungle',
    name: 'Centralny Cokół Skalny',
    x: 1600,
    y: 1040,
    w: 350,
    h: 45,
    oneWay: true,
    solid: false
  },
  {
    id: 'lower_shelf_right',
    type: 'rock_shelf',
    theme: 'jungle',
    name: 'Prawa Półka Skalna',
    x: 2150,
    y: 920,
    w: 240,
    h: 28,
    oneWay: true,
    solid: false
  },
  {
    id: 'right_shaft_cushion_shelf',
    type: 'rock_shelf',
    theme: 'jungle',
    name: 'Półka Amortyzująca Szybu',
    x: 2320,
    y: 880,
    w: 90,
    h: 22,
    oneWay: true,
    solid: false
  }
];

export const LOWER_CAVERN_FLOOR = {
  id: 'lower_cavern_floor',
  type: 'rock_platform',
  theme: 'jungle',
  name: 'Spąg Dolnej Pieczary Bojowej',
  x: 950,
  y: 1180,
  w: 1530,
  h: 120,
  solid: true
};

// =========================================================================
// ARENA 3: SKALNY SUFIT JASKINI (LITA GRAŃ SKALNA STROPU)
// Zamknięta górna krawędź jaskini o naturalnym, nieregularnym profilu grani
// =========================================================================
export const MINE_CAVE_CEILING_PROFILE = [
  { x: ARENA_LEFT - 320, relY: 980 },
  { x: 0, relY: 980 },
  { x: 260, relY: 960 },
  { x: 520, relY: 990 },
  { x: 780, relY: 950 },
  { x: 1040, relY: 980 },
  { x: 1320, relY: 1020 },
  { x: 1680, relY: 1060 }, // Sklepienie Centralnej Groty (kopuła nad wzgórzem)
  { x: 1960, relY: 1010 },
  { x: 2240, relY: 980 },
  { x: 2540, relY: 960 },
  { x: 2860, relY: 1000 },
  { x: 3180, relY: 970 },
  { x: 3480, relY: 990 },
  { x: 3600, relY: 980 },
  { x: ARENA_RIGHT + 320, relY: 980 }
];

export function getCaveCeilingInfo(px, groundY) {
  const pts = MINE_CAVE_CEILING_PROFILE;
  if (px <= pts[0].x) {
    return { ceilingY: groundY - pts[0].relY, slope: 0 };
  }
  if (px >= pts[pts.length - 1].x) {
    return { ceilingY: groundY - pts[pts.length - 1].relY, slope: 0 };
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    if (px >= p0.x && px <= p1.x) {
      const dx = p1.x - p0.x;
      const dyRel = p1.relY - p0.relY;
      const t = dx > 0 ? (px - p0.x) / dx : 0;
      const curRelY = p0.relY + t * dyRel;
      const slope = dyRel / (dx || 1);
      return { ceilingY: groundY - curRelY, slope };
    }
  }
  return { ceilingY: groundY - 960, slope: 0 };
}

export function getCaveCeilingY(px, groundY) {
  return getCaveCeilingInfo(px, groundY).ceilingY;
}

/**
 * =========================================================================
 * PROCEDURALNA TEKSTURA LITEJ SKAŁY, WARSTWY OSADOWE I KRAWĘDZIE GZYMSU
 * =========================================================================
 * 1. Masa skalna: głęboka paleta łupku #181B20 do #111317 na dole
 * 2. Warstwowość geologiczna: pofalowane żyły skalne 2-6px (#232830, #0E1013, Math.sin)
 * 3. Pęknięcia tektoniczne: 1px #0A0C0E z obrysem 1px #2C323D
 * 4. Ambient Occlusion: miękkie cienie w zagłębieniach i wąwozach
 * 5. Krawędzie chodzone: fazowany rim 3px #3A4454 + linia światła 1px #5E6E87
 * 6. Opadający gruz: nieregularne trapezy 2x3px zwisające z krawędzi (brak ząbków)
 */
export function drawCaveTerrain(ctx, polyPoints, mapBottomY, groundY) {
  if (!polyPoints || polyPoints.length < 2) return;

  const minX = polyPoints[0].x;
  const maxX = polyPoints[polyPoints.length - 1].x;
  let minY = polyPoints[0].y;
  for (let i = 1; i < polyPoints.length; i++) {
    if (polyPoints[i].y < minY) minY = polyPoints[i].y;
  }
  if (!Number.isFinite(minY)) minY = groundY || 500;
  const maxY = Number.isFinite(mapBottomY) ? mapBottomY : ((groundY || 500) + 2400);

  ctx.save();

  // 1. LITA MASA SKALNA (SOLID BEDROCK MASS)
  ctx.beginPath();
  ctx.moveTo(polyPoints[0].x, maxY);
  for (let i = 0; i < polyPoints.length; i++) {
    ctx.lineTo(polyPoints[i].x, polyPoints[i].y);
  }
  ctx.lineTo(polyPoints[polyPoints.length - 1].x, maxY);
  ctx.closePath();

  // Wypełnienie głęboką paletą łupku: baza #181B20 przechodząca w #111317 na dole
  const slateGrad = ctx.createLinearGradient(0, minY, 0, maxY);
  slateGrad.addColorStop(0.0, '#181B20');
  slateGrad.addColorStop(1.0, '#111317');
  ctx.fillStyle = slateGrad;
  ctx.fill();

  // 2. PROCEDURALNE WARSTWY SEDYMENTACYJNE I SZCZELINY (CLIPPED)
  ctx.save();
  ctx.clip();

  // A. Warstwowość geologiczna (Strata lines)
  // Horyzontalne, lekko pofalowane żyły skalne i warstwy osadowe (grubość 2–6px, tony #232830 i #0E1013)
  const strataStep = 22;
  const strataLimit = Math.min(maxY, minY + 1600);
  for (let sy = minY + 12; sy <= strataLimit; sy += strataStep) {
    const isDark = (Math.floor(sy / strataStep) % 2 === 0);
    const strokeCol = isDark ? '#0E1013' : '#232830';
    const thick = 2 + (Math.floor(sy * 7.19) % 5); // 2, 3, 4, 5, 6px

    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = thick;

    const phaseA = sy * 0.037;
    const phaseB = sy * 0.081;

    ctx.beginPath();
    let first = true;
    for (let sx = minX - 40; sx <= maxX + 40; sx += 40) {
      const wave = Math.sin(sx * 0.007 + phaseA) * 5.2 + Math.sin(sx * 0.023 + phaseB) * 2.4;
      const py = sy + wave;
      if (first) {
        ctx.moveTo(sx, py);
        first = false;
      } else {
        ctx.lineTo(sx, py);
      }
    }
    ctx.stroke();
  }

  // B. Proceduralne wąskie pęknięcia tektoniczne (cienkie linie 1px #0A0C0E z obrysem 1px #2C323D)
  const crackSpans = [
    { startX: minX + (maxX - minX) * 0.12, startY: minY + 60, len: 320, angle: 1.18, seed: 1.7 },
    { startX: minX + (maxX - minX) * 0.28, startY: minY + 90, len: 280, angle: 1.25, seed: 3.2 },
    { startX: minX + (maxX - minX) * 0.45, startY: minY + 40, len: 360, angle: 1.15, seed: 5.1 },
    { startX: minX + (maxX - minX) * 0.62, startY: minY + 110, len: 300, angle: 1.22, seed: 7.4 },
    { startX: minX + (maxX - minX) * 0.78, startY: minY + 70, len: 340, angle: 1.17, seed: 9.3 },
    { startX: minX + (maxX - minX) * 0.91, startY: minY + 130, len: 260, angle: 1.28, seed: 11.8 }
  ];

  for (let cIdx = 0; cIdx < crackSpans.length; cIdx++) {
    const cr = crackSpans[cIdx];
    if (cr.startX < minX - 50 || cr.startX > maxX + 50) continue;

    const pts = [{ x: cr.startX, y: cr.startY }];
    let cx = cr.startX;
    let cy = cr.startY;
    const segs = 6;
    const segLen = cr.len / segs;

    for (let s = 1; s <= segs; s++) {
      const stepAngle = cr.angle + Math.sin(cr.seed + s * 2.7) * 0.35;
      cx += Math.cos(stepAngle) * segLen;
      cy += Math.sin(stepAngle) * segLen;
      pts.push({ x: cx, y: cy });
    }

    // Jasny obrys 1px #2C323D (imitacja krawędzi szczeliny skalnej)
    ctx.strokeStyle = '#2C323D';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pts[0].x + 1, pts[0].y + 1);
    for (let p = 1; p < pts.length; p++) {
      ctx.lineTo(pts[p].x + 1, pts[p].y + 1);
    }
    ctx.stroke();

    // Wąska linia pęknięcia 1px #0A0C0E
    ctx.strokeStyle = '#0A0C0E';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let p = 1; p < pts.length; p++) {
      ctx.lineTo(pts[p].x, pts[p].y);
    }
    ctx.stroke();
  }

  // C. Wewnętrzny cień (Ambient Occlusion) w wąwozach i załamaniach terenu
  for (let i = 1; i < polyPoints.length - 1; i++) {
    const prev = polyPoints[i - 1];
    const curr = polyPoints[i];
    const next = polyPoints[i + 1];

    const dy1 = curr.y - prev.y;
    const dy2 = next.y - curr.y;
    if (dy1 > 15 || dy2 < -15 || curr.y > prev.y + 35 || curr.y > next.y + 35) {
      const aoRadius = 150;
      const aoGrad = ctx.createRadialGradient(curr.x, curr.y + 30, 10, curr.x, curr.y + 30, aoRadius);
      aoGrad.addColorStop(0.0, 'rgba(5, 7, 10, 0.65)');
      aoGrad.addColorStop(0.5, 'rgba(5, 7, 10, 0.30)');
      aoGrad.addColorStop(1.0, 'rgba(5, 7, 10, 0.0)');
      ctx.fillStyle = aoGrad;
      ctx.beginPath();
      ctx.arc(curr.x, curr.y + 30, aoRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore(); // Koniec clipa

  // 3. KRAWĘDZIE PLATFORM I POWIERZCHNIE CHODZONE (LEDGES)
  // A. Główny pasek krawędzi: kamienny błękit/grafit #3A4454 (3px)
  ctx.strokeStyle = '#3A4454';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(polyPoints[0].x, polyPoints[0].y);
  for (let i = 1; i < polyPoints.length; i++) {
    ctx.lineTo(polyPoints[i].x, polyPoints[i].y);
  }
  ctx.stroke();

  // B. Górna linia odbłysku: #5E6E87 (1px) imitująca ostre światło padające na krawędź
  ctx.strokeStyle = '#5E6E87';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(polyPoints[0].x, polyPoints[0].y - 0.7);
  for (let i = 1; i < polyPoints.length; i++) {
    ctx.lineTo(polyPoints[i].x, polyPoints[i].y - 0.7);
  }
  ctx.stroke();

  // C. Opadający gruz: drobne kanciaste odpryski skalne (trapezy 2x3px) zwisające z krawędzi
  for (let i = 0; i < polyPoints.length - 1; i++) {
    const pA = polyPoints[i];
    const pB = polyPoints[i + 1];
    const segLen = Math.hypot(pB.x - pA.x, pB.y - pA.y);
    if (segLen < 12) continue;

    const numChips = Math.floor(segLen / 44);
    for (let k = 0; k < numChips; k++) {
      const seed = ((pA.x * 19.3 + k * 41.7) % 100) / 100;
      const t = 0.15 + seed * 0.70;
      const cx = pA.x + (pB.x - pA.x) * t;
      const cy = pA.y + (pB.y - pA.y) * t;

      const chipW = 2.8;
      const chipH = 3.0;

      ctx.fillStyle = '#2A323D';
      ctx.beginPath();
      ctx.moveTo(cx - chipW * 0.5, cy + 1.0);
      ctx.lineTo(cx + chipW * 0.5, cy + 1.0);
      ctx.lineTo(cx + chipW * 0.25, cy + 1.0 + chipH);
      ctx.lineTo(cx - chipW * 0.25, cy + 1.0 + chipH);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#5E6E87';
      ctx.fillRect(cx - chipW * 0.5, cy + 1.0, 1, 1);
    }
  }

  ctx.restore();
}

// =========================================================================
// PROCEDURALNY KOD JASKINI USUNIĘTY (drawCaveCeilingAndStalactites)
// Renderowanie tła, platform i obiektów Areny 3 delegowane do js/arenas/arena3.js
// =========================================================================
export function drawCaveCeilingAndStalactites() {}

// =========================================================================
// PROCEDURALNY KOD DOLNEJ SALI USUNIĘTY
// Renderowanie tła, platform i obiektów Areny 3 delegowane do js/arenas/arena3.js
// =========================================================================
export function drawLowerCavernBackground() {}
export function drawBedrockAndSideSlopes() {}
export function drawCentralRockBridge() {}
export function drawLowerCavernPropsAndLighting() {}
export function drawLowerCavern() {}
export function drawLedgeDebris() {}

export function drawGround(ctx, worldLeft, worldWidth) {
  const startX = ARENA_LEFT - 320;
  const endX = ARENA_RIGHT + 320;
  const w = endX - startX;
  const isArena3 = (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3');
  const isArena2 = (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2');

  if (isArena3 || isArena2) {
    // Tło, obiekty i platformy Areny 2 & 3 renderowane są autonomicznie w ich modułach areny (brak płaskiego podłoża)
    return;
  }

  // =========================================================================
  // ARENY 1 & 2: INDUSTRIALNA KŁADKA / DWUTEOWNIKI / CYBER NEON
  // =========================================================================
  // 1. DOLNY KANAŁ TECHNICZNY I CZELUŚĆ POD KŁADKĄ (THE VOID & SUB-LEVEL)
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

  // 2. INDUSTRIALNE BELKI NOŚNE / FILARY PODŁOŻA CO 120 PX
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

  // 3. AKTYWNE SEGMENTY PODŁOŻA (36 PX PŁYTA PRZEMYSŁOWEJ KŁADKI)
  for (let i = 0; i < groundSegments.length; i++) {
    const seg = groundSegments[i];
    if (seg.destroyed) continue;

    const slabGrad = ctx.createLinearGradient(seg.x, GROUND_Y, seg.x, GROUND_Y + GROUND_SLAB_HEIGHT);
    slabGrad.addColorStop(0.0, '#151e2e');
    slabGrad.addColorStop(0.25, '#101726');
    slabGrad.addColorStop(0.75, '#0b101c');
    slabGrad.addColorStop(1.0, '#060910');

    ctx.fillStyle = slabGrad;
    ctx.fillRect(seg.x, GROUND_Y, seg.width, GROUND_SLAB_HEIGHT);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(seg.x, GROUND_Y + 12, seg.width, 1);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(seg.x, GROUND_Y + GROUND_SLAB_HEIGHT - 1.5, seg.width, 1.5);

    ctx.fillStyle = '#060911';
    ctx.fillRect(seg.x, GROUND_Y + 1, 1, GROUND_SLAB_HEIGHT - 2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.fillRect(seg.x + seg.width / 2 - 1, GROUND_Y + 3, 2, 5);
  }

  // 4. NEONOWA POWIERZCHNIA PODŁOŻA – PRZERYWANA W MIEJSCACH WYRWY
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

  const legacyActiveRuns = [];
  let legacyCurrentRun = null;

  for (let i = 0; i < groundSegments.length; i++) {
    const seg = groundSegments[i];
    if (!seg.destroyed) {
      if (!legacyCurrentRun) {
        legacyCurrentRun = { start: seg.x, end: seg.x + seg.width };
      } else {
        legacyCurrentRun.end = seg.x + seg.width;
      }
    } else {
      if (legacyCurrentRun) {
        legacyActiveRuns.push(legacyCurrentRun);
        legacyCurrentRun = null;
      }
    }
  }
  if (legacyCurrentRun) {
    legacyActiveRuns.push(legacyCurrentRun);
  }

  for (const run of legacyActiveRuns) {
    const arenaStart = Math.max(ARENA_LEFT, Math.min(ARENA_RIGHT, run.start));
    const arenaEnd = Math.max(ARENA_LEFT, Math.min(ARENA_RIGHT, run.end));

    if (arenaEnd > arenaStart) {
      ctx.strokeStyle = surfaceGrad;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 0;
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      ctx.moveTo(arenaStart, GROUND_Y);
      ctx.lineTo(arenaEnd, GROUND_Y);
      ctx.stroke();

      ctx.strokeStyle = coreGrad;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(arenaStart, GROUND_Y);
      ctx.lineTo(arenaEnd, GROUND_Y);
      ctx.stroke();
    }

    if (run.start < ARENA_LEFT) {
      const bLeft = run.start;
      const bRight = Math.min(ARENA_LEFT, run.end);
      if (bRight > bLeft) {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.0;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 0;
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
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(bLeft, GROUND_Y);
        ctx.lineTo(bRight, GROUND_Y);
        ctx.stroke();
      }
    }
  }

  // 5. WIZUALIZACJA POSZARPANYCH KRAWĘDZI I WYSTAJĄCEGO ZBROJENIA WYRWY
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

  drawArenaEnergyBoundaries(ctx, GROUND_Y);
  ctx.restore();
}

export function drawArenaEnergyBoundaries(ctx, groundY) {
  const isArena3 = (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3');
  const isArena2 = (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2');
  if (isArena3 || isArena2) {
    return; // W zamkniętym podziemnym systemie jaskiń i otwartym niebie Pandory brak laserowych linii granicznych
  }
  const leftX = ARENA_LEFT;
  const rightX = ARENA_RIGHT;
  const barrierH = 3000;
  const topY = groundY - barrierH;
  const time = performance.now() * 0.0012;
  const pulse = 0.82 + 0.18 * Math.sin(time * 3.5);

  const walls = [
    {
      x: leftX,
      color: '#00F0FF',
      coreColor: '#a5f3fc',
      glowColor: '#00F0FF',
      fadeDir: 1
    },
    {
      x: rightX,
      color: '#FF8800',
      coreColor: '#fed7aa',
      glowColor: '#FF8800',
      fadeDir: -1
    }
  ];

  for (const w of walls) {
    ctx.save();

    // 1. Półprzezroczysta pionowa kurtyna pola siłowego (fading 38px do wnętrza boiska)
    const fieldW = 38;
    const fieldGrad = ctx.createLinearGradient(w.x, 0, w.x + w.fadeDir * fieldW, 0);
    if (isArena3) {
      fieldGrad.addColorStop(0.0, `rgba(234, 179, 8, ${0.32 * pulse})`);
      fieldGrad.addColorStop(0.35, `rgba(250, 204, 21, ${0.14 * pulse})`);
      fieldGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    } else {
      fieldGrad.addColorStop(0.0, w.fadeDir === 1 ? `rgba(0, 240, 255, ${0.28 * pulse})` : `rgba(255, 136, 0, ${0.28 * pulse})`);
      fieldGrad.addColorStop(0.35, w.fadeDir === 1 ? `rgba(0, 240, 255, ${0.12 * pulse})` : `rgba(255, 136, 0, ${0.12 * pulse})`);
      fieldGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    }
    ctx.fillStyle = fieldGrad;
    const fx = w.fadeDir === 1 ? w.x : (w.x - fieldW);
    ctx.fillRect(fx, topY, fieldW, barrierH);

    // 2. Dynamiczne impulsy energii wznoszące się wzdłuż ściany
    const step = 50;
    const offset = (time * 75) % step;
    ctx.fillStyle = isArena3 ? 'rgba(254, 240, 138, 0.45)' : (w.fadeDir === 1 ? 'rgba(165, 243, 252, 0.38)' : 'rgba(254, 215, 170, 0.38)');
    for (let py = groundY - offset; py > topY; py -= step) {
      const rw = 16 + Math.sin(py * 0.03 + time * 3) * 6;
      const rx = w.fadeDir === 1 ? w.x : (w.x - rw);
      ctx.fillRect(rx, py, rw, 1.8);
    }

    // 3. Główna pionowa neonowa linia energetyczna z potężnym rozbłyskiem (glow)
    ctx.strokeStyle = w.color;
    ctx.shadowColor = w.glowColor;
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(w.x, groundY);
    ctx.lineTo(w.x, topY);
    ctx.stroke();

    // 4. Intensywny biały rdzeń lasera energetycznego
    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = w.coreColor;
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(w.x, groundY);
    ctx.lineTo(w.x, topY);
    ctx.stroke();

    // 5. Emiter podłożowy u nasady ściany
    ctx.fillStyle = w.color;
    ctx.shadowColor = w.glowColor;
    ctx.shadowBlur = 0;
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

export function drawDynamicActionSymbol(ctx, mode, cx, cy, isPressed, player) {
  ctx.save();
  ctx.translate(cx, cy);

  const mainColor = isPressed ? '#ffffff' : 'rgba(255, 255, 255, 0.90)';
  const faintColor = isPressed ? 'rgba(255, 255, 255, 0.70)' : 'rgba(255, 255, 255, 0.50)';

  ctx.strokeStyle = mainColor;
  ctx.fillStyle = mainColor;
  ctx.lineWidth = 2.0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (mode === 'SLIDE') {
    // 1. Wektorowa sylwetka wślizgu bojowego (Slide)
    ctx.beginPath();
    ctx.arc(-6, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-5, -1);
    ctx.lineTo(-2, 3);
    ctx.lineTo(8, 3);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-2, 3);
    ctx.lineTo(2, 0);
    ctx.stroke();

    ctx.strokeStyle = faintColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-9, 5);
    ctx.lineTo(10, 5);
    ctx.stroke();
  } else if (mode === 'PRONE') {
    // 2. Wektorowa sylwetka leżenia (Prone)
    const pFacing = player ? (player.facing || 1) : 1;
    ctx.beginPath();
    ctx.arc(pFacing * 6, -1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pFacing * 3, 1);
    ctx.lineTo(-pFacing * 8, 1);
    ctx.stroke();

    ctx.strokeStyle = faintColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-10, 4);
    ctx.lineTo(10, 4);
    ctx.stroke();
  } else if (mode === 'STAND') {
    // 3. Wektorowa sylwetka wstawania (Stand up)
    ctx.beginPath();
    ctx.arc(0, -6, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(0, 5);
    ctx.stroke();

    ctx.strokeStyle = faintColor;
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(0, -5);
    ctx.lineTo(5, 0);
    ctx.stroke();
  } else {
    // 4. Wektorowa sylwetka dynamicznego wykopu (Kick)
    ctx.beginPath();
    ctx.arc(-4, -6, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-3, -3);
    ctx.lineTo(-1, 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-1, 2);
    ctx.lineTo(-4, 7);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-1, 2);
    ctx.lineTo(5, -1);
    ctx.lineTo(9, -2);
    ctx.stroke();

    ctx.strokeStyle = faintColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 11, -0.6, 0.1);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawTouchControls(ctx, player, leftStick, btnCluster, rightStick, ball, inKickRange = null) {
  if (!isTouchDevice || !ctx || !player) return;

  ctx.save();
  const time = performance.now();

  // -------------------------------------------------------------------------
  // 1. LEWY DRĄŻEK: RUCH, SKOK, JETPACK (Czysty, transparentny, bez napisów)
  // -------------------------------------------------------------------------
  if (leftStick && leftStick.baseX > 0) {
    const isStickActive = leftStick.active;
    const isJetActive = player.isJetpacking || leftStick.isJetpacking;
    const maxR = leftStick.maxRadius || 55;
    const bx = leftStick.baseX;
    const by = leftStick.baseY;

    // Baza drążka: w pełni przezroczysta, delikatny kontur bez koloru
    ctx.beginPath();
    ctx.arc(bx, by, maxR, 0, Math.PI * 2);
    ctx.fillStyle = isStickActive ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.02)';
    ctx.fill();

    ctx.strokeStyle = isStickActive ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = isStickActive ? 1.6 : 1.2;
    ctx.stroke();

    // Pozycja gałki
    const knobX = bx + (leftStick.axisX * maxR);
    const knobY = by + (leftStick.axisY * maxR);

    // Dyskretna linia wychylenia
    if (isStickActive && (Math.abs(leftStick.axisX) > 0.05 || Math.abs(leftStick.axisY) > 0.05)) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(knobX, knobY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Gałka lewego drążka (subtelne intuicyjne podświetlenie)
    const knobR = 22;
    const knobGrad = ctx.createRadialGradient(knobX - 3, knobY - 3, 2, knobX, knobY, knobR);
    if (isStickActive || isJetActive) {
      knobGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.38)');
      knobGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.16)');
      knobGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.08)');
    } else {
      knobGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.12)');
      knobGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
      knobGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.02)');
    }

    ctx.beginPath();
    ctx.arc(knobX, knobY, knobR, 0, Math.PI * 2);
    ctx.fillStyle = knobGrad;
    ctx.fill();

    ctx.strokeStyle = isStickActive ? 'rgba(255, 255, 255, 0.50)' : 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = isStickActive ? 1.6 : 1.2;
    if (isStickActive) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.30)';
      ctx.shadowBlur = 8;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Subtelny centralny punkt gałki
    ctx.beginPath();
    ctx.arc(knobX, knobY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = isStickActive ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.35)';
    ctx.fill();
  }

  // -------------------------------------------------------------------------
  // 2. PRAWY DRĄŻEK: CELOWANIE, OGIEŃ, RZUT (Czysty, transparentny, bez napisów)
  // -------------------------------------------------------------------------
  if (rightStick && rightStick.baseX > 0) {
    const isStickActive = rightStick.active;
    const maxR = rightStick.maxRadius || 58;
    const bx = rightStick.baseX;
    const by = rightStick.baseY;
    const isGrenadeMode = (rightStick.armedMode === 'GRENADE');

    // Baza drążka: w pełni przezroczysta, delikatny obrys bez koloru
    ctx.beginPath();
    ctx.arc(bx, by, maxR, 0, Math.PI * 2);
    ctx.fillStyle = isStickActive ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.02)';
    ctx.fill();

    // Jeśli przeciągany jest slot w stronę drążka, drążek pulsuje lekko
    const isDragHover = rightStick.draggedSlot && (Math.hypot((rightStick.draggedSlot.curX || 0) - bx, (rightStick.draggedSlot.curY || 0) - by) < maxR + 45 || (rightStick.draggedSlot.curX || 0) >= bx - 35);
    ctx.strokeStyle = isDragHover
      ? `rgba(255, 255, 255, ${0.45 + 0.35 * Math.sin(time * 0.01)})`
      : (isStickActive ? 'rgba(255, 255, 255, 0.32)' : 'rgba(255, 255, 255, 0.12)');
    ctx.lineWidth = (isDragHover || isStickActive) ? 1.8 : 1.2;
    ctx.stroke();

    // Pozycja gałki
    let knobX = bx;
    let knobY = by;
    if (isStickActive) {
      const dx = rightStick.curX - bx;
      const dy = rightStick.curY - by;
      const rawDist = Math.hypot(dx, dy);
      const normX = rawDist > 0.001 ? dx / rawDist : 1;
      const normY = rawDist > 0.001 ? dy / rawDist : 0;
      const clampedDist = Math.min(rawDist, maxR);
      knobX = bx + normX * clampedDist;
      knobY = by + normY * clampedDist;

      // Przerywana linia wychylenia
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(knobX, knobY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Gałka prawego drążka (subtelne intuicyjne podświetlenie)
    const knobR = 22;
    const knobGrad = ctx.createRadialGradient(knobX - 3, knobY - 3, 2, knobX, knobY, knobR);
    if (isStickActive) {
      knobGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.40)');
      knobGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.18)');
      knobGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.08)');
    } else {
      knobGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.12)');
      knobGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
      knobGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.02)');
    }

    ctx.beginPath();
    ctx.arc(knobX, knobY, knobR, 0, Math.PI * 2);
    ctx.fillStyle = knobGrad;
    ctx.fill();

    ctx.strokeStyle = isStickActive ? 'rgba(255, 255, 255, 0.55)' : 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = isStickActive ? 1.6 : 1.2;
    if (isStickActive) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.35)';
      ctx.shadowBlur = 8;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Dyskretna miniaturowa sylwetka broni na gałce wskazująca co założono na ręce
    ctx.save();
    ctx.translate(knobX, knobY);
    if (isGrenadeMode) {
      ctx.scale(0.65, 0.65);
      drawWeaponSilhouette(ctx, 'GRENADE', 0, 0, isStickActive);
    } else {
      const curId = player.currentWeapon?.id || 'AK47';
      ctx.scale(0.65, 0.65);
      drawWeaponSilhouette(ctx, curId, 0, 0, isStickActive);
    }
    ctx.restore();

    // Trajektoria rzutu granatem (gdy drążek w trybie granatu jest wychylony)
    if (isGrenadeMode && isStickActive && (rightStick.power > 0.08)) {
      const pwr = Math.min(1.5, Math.max(0.4, rightStick.power * 1.3));
      const pFacing = player.facing || 1;
      const startX = player.x + player.w / 2 + pFacing * 14;
      const startY = player.y + player.h * 0.42;

      const aimX = (typeof player.aimX === 'number' && !isNaN(player.aimX)) ? player.aimX : (startX + (rightStick.axisX || pFacing) * 200);
      const aimY = (typeof player.aimY === 'number' && !isNaN(player.aimY)) ? player.aimY : (startY + (rightStick.axisY || -0.2) * 200);
      const angle = Math.atan2(aimY - startY, aimX - startX);

      const speedMult = pwr;
      const initialSpeed = (960 / 60) * speedMult;
      const gVx = Math.cos(angle) * initialSpeed + (player.vx || 0) * 0.35;
      const gVy = Math.sin(angle) * initialSpeed + (player.vy || 0) * 0.25 - (3.2 * Math.min(1.2, speedMult));
      const grav = (CONFIG.GRAVITY || 0.38) * 0.95;

      ctx.save();
      const numDots = 14;
      for (let step = 1; step <= numDots; step++) {
        const tFrames = step * 3.5;
        const wx = startX + gVx * tFrames;
        const wy = startY + gVy * tFrames + 0.5 * grav * tFrames * tFrames;

        const sx = (wx - camera.x) * camera.zoom;
        const sy = (wy - camera.y) * camera.zoom;
        const alpha = Math.max(0.12, 0.75 - (step / numDots) * 0.60);

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(1.8, 4.0 - step * 0.18), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // -------------------------------------------------------------------------
  // 3. KIESZENIE WOKÓŁ PRAWEGO DRĄŻKA (LEDWO WIDOCZNE, PRZEZROCZYSTE, BEZ KOLORU)
  const effPockets = (btnCluster && (btnCluster.firearm || btnCluster.action)) ? btnCluster : (window.pockets || btnCluster || {});
  const pFirearm = effPockets.firearm || window.pockets?.firearm;
  const pThrowable = effPockets.throwable || effPockets.grenade || window.pockets?.throwable;
  const pAction = effPockets.action || effPockets.kick || effPockets.slide || window.pockets?.action;

  // 3A. KIESZEŃ NA BROŃ PALNĄ – WYŻEJ
  if (pFirearm && pFirearm.x > 0) {
    const isEquipped = (rightStick.armedMode === 'FIREARM') && !player.isHolstered;
    const isPressed = pFirearm.active;
    const curWep = player.currentWeapon || { id: 'AK47', name: 'AK-47' };
    const curId = curWep.id || 'AK47';

    // Baza kieszeni: szkło z gradientem
    const grad = ctx.createRadialGradient(pFirearm.x - 2, pFirearm.y - 2, 2, pFirearm.x, pFirearm.y, pFirearm.r);
    if (isEquipped || isPressed) {
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.42)');
      grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.20)');
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.08)');
    } else {
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.22)');
      grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.10)');
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.04)');
    }
    ctx.beginPath();
    ctx.arc(pFirearm.x, pFirearm.y, pFirearm.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Główny pierścień zewnętrzny
    ctx.strokeStyle = (isEquipped || isPressed)
      ? 'rgba(255, 255, 255, 0.85)'
      : 'rgba(255, 255, 255, 0.52)';
    ctx.lineWidth = (isEquipped || isPressed) ? 2.2 : 1.6;
    if (isEquipped || isPressed) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.45)';
      ctx.shadowBlur = 8;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Wewnętrzny pierścień w stylu drążka
    ctx.beginPath();
    ctx.arc(pFirearm.x, pFirearm.y, pFirearm.r - 4, 0, Math.PI * 2);
    ctx.strokeStyle = (isEquipped || isPressed)
      ? 'rgba(255, 255, 255, 0.38)'
      : 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    ctx.save();
    ctx.translate(pFirearm.x, pFirearm.y - 3);
    ctx.scale(0.85, 0.85);
    drawWeaponSilhouette(ctx, curId, 0, 0, isEquipped || isPressed);
    ctx.restore();

    const ammoObj = player.ammo?.[curId];
    const cAmmo = ammoObj ? ammoObj.currentAmmo : (curId === 'SHOTGUN' ? 8 : 30);
    const rAmmo = ammoObj ? ammoObj.reserveAmmo : (curId === 'SHOTGUN' ? 64 : 90);
    ctx.font = 'bold 8.5px monospace';
    ctx.fillStyle = isEquipped ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${cAmmo}/${rAmmo}`, pFirearm.x, pFirearm.y + pFirearm.r - 2);
  }

  // 3B. KIESZEŃ NA BROŃ MIOTANĄ (GRANAT) – PO ŚRODKU
  if (pThrowable && pThrowable.x > 0) {
    const isEquipped = (rightStick.armedMode === 'GRENADE');
    const isPressed = pThrowable.active;
    const cd = player.grenadeCooldown || 0;
    const maxCd = player.grenadeMaxCooldown || 3.5;
    const isReady = (cd <= 0);

    const grad = ctx.createRadialGradient(pThrowable.x - 2, pThrowable.y - 2, 2, pThrowable.x, pThrowable.y, pThrowable.r);
    if (isEquipped || isPressed) {
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.42)');
      grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.20)');
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.08)');
    } else {
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.22)');
      grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.10)');
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.04)');
    }
    ctx.beginPath();
    ctx.arc(pThrowable.x, pThrowable.y, pThrowable.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = (isEquipped || isPressed)
      ? 'rgba(255, 255, 255, 0.85)'
      : 'rgba(255, 255, 255, 0.52)';
    ctx.lineWidth = (isEquipped || isPressed) ? 2.2 : 1.6;
    if (isEquipped || isPressed) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.45)';
      ctx.shadowBlur = 8;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Wewnętrzny pierścień w stylu drążka
    ctx.beginPath();
    ctx.arc(pThrowable.x, pThrowable.y, pThrowable.r - 4, 0, Math.PI * 2);
    ctx.strokeStyle = (isEquipped || isPressed)
      ? 'rgba(255, 255, 255, 0.38)'
      : 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    if (!isReady && maxCd > 0) {
      const prog = Math.max(0, Math.min(1, cd / maxCd));
      ctx.save();
      ctx.beginPath();
      ctx.arc(pThrowable.x, pThrowable.y, pThrowable.r - 1.5, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2, false);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(pThrowable.x, pThrowable.y - (isReady ? 2 : 3));
    ctx.scale(0.85, 0.85);
    drawWeaponSilhouette(ctx, 'GRENADE', 0, 0, isReady && (isEquipped || isPressed));
    ctx.restore();

    if (!isReady) {
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${cd.toFixed(1)}s`, pThrowable.x, pThrowable.y + pThrowable.r - 2);
    }
  }

  // 3C. ZUNIFIKOWANY 1 PRZYCISK RUCHU / AKCJI (WŚLIZG / LEŻENIE / KOPNIAK) – NAJNIŻEJ
  if (pAction && pAction.x > 0) {
    const isPressed = pAction.active;
    const mode = pAction.currentMode || 'KICK';

    const grad = ctx.createRadialGradient(pAction.x - 2, pAction.y - 2, 2, pAction.x, pAction.y, pAction.r);
    if (isPressed) {
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.45)');
      grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.22)');
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.08)');
    } else {
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.24)');
      grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.10)');
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.04)');
    }
    ctx.beginPath();
    ctx.arc(pAction.x, pAction.y, pAction.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = isPressed ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.52)';
    ctx.lineWidth = isPressed ? 2.2 : 1.6;
    if (isPressed) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.45)';
      ctx.shadowBlur = 8;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Wewnętrzny pierścień
    ctx.beginPath();
    ctx.arc(pAction.x, pAction.y, pAction.r - 4, 0, Math.PI * 2);
    ctx.strokeStyle = isPressed ? 'rgba(255, 255, 255, 0.38)' : 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    drawDynamicActionSymbol(ctx, mode, pAction.x, pAction.y, isPressed, player);
  }

  // -------------------------------------------------------------------------
  // 4. EFEKT PRZECIĄGANIA IKONY NA DRĄŻEK (DRAG & DROP "ZAŁÓŻ BROŃ NA RĘCE")
  // -------------------------------------------------------------------------
  if (rightStick.draggedSlot) {
    if (!pFirearm?.isDragging && !pThrowable?.isDragging) {
      rightStick.draggedSlot = null;
    } else {
      const ds = rightStick.draggedSlot;
      const cx = ds.curX || 0;
      const cy = ds.curY || 0;
      const sx = ds.startX || cx;
      const sy = ds.startY || cy;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo((sx + cx) / 2, (sy + cy) / 2 - 10, cx, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.45)';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(0.9, 0.9);
    if (ds.type === 'GRENADE') {
      drawWeaponSilhouette(ctx, 'GRENADE', 0, 0, true);
    } else {
      const curId = player.currentWeapon?.id || 'AK47';
      drawWeaponSilhouette(ctx, curId, 0, 0, true);
    }
    ctx.restore();
    ctx.restore();
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
  ctx.shadowBlur = 0;
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
  ctx.shadowBlur = 0;
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
    ctx.shadowColor = 'rgba(255, 255, 255, 0.50)';
    ctx.shadowBlur = 4;
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.68)';
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
  } else if (type === 'SNIPER') {
    // Kolba snajperska i baka
    ctx.fillRect(-13, -1, 6, 2.5);
    ctx.fillRect(-12, -2.5, 4, 1.5);
    // Komora zamkowa i magazynek pudełkowy
    ctx.fillRect(-7, -2.5, 10, 4);
    ctx.fillRect(-2, 1.5, 3.5, 4.2);
    // Luneta celownicza optyczna
    ctx.fillRect(-4, -5.2, 9, 1.8);
    ctx.fillRect(-5, -6.0, 2.2, 3.0);
    ctx.fillRect(4, -6.0, 2.5, 3.2);
    // Długa stalowa lufa ryflowana
    ctx.fillRect(3, -1.2, 11, 1.8);
    // Masywny hamulec wylotowy
    ctx.fillRect(14, -2.2, 3, 3.8);
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
    const maxCd = player.grenadeMaxCooldown || 3.5;
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
      ctx.shadowBlur = 0;
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
  const accentCol = btn.id === 'SHOTGUN' ? '#fb923c' : (btn.id === 'SNIPER' ? '#38bdf8' : '#f59e0b');

  // Pobranie stanu amunicji z obiektu gracza
  const ammoObj = player.ammo?.[btn.id];
  const defMag = (btn.id === 'SHOTGUN' ? 8 : (btn.id === 'SNIPER' ? 5 : 30));
  const defRes = (btn.id === 'SHOTGUN' ? 64 : (btn.id === 'SNIPER' ? 25 : 90));
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
    ctx.shadowBlur = 0;
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
    ctx.shadowBlur = 0;
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

/**
 * Renderuje pojedynczą, zunifikowaną ikonę broni na ekranie dotykowym (dolny środek ekranu).
 * Dotknięcie kafelka natychmiast przełącza broń pomiędzy AK-47 a Shotgunem.
 */
export function drawSingleMobileWeaponIcon(ctx, x, y, size, player) {
  const curWep = player.currentWeapon || { id: 'AK47', name: 'AK-47' };
  const curWepId = curWep.id || 'AK47';
  const isShotgun = (curWepId === 'SHOTGUN');
  const isSniper = (curWepId === 'SNIPER');
  const accentCol = isShotgun ? '#fb923c' : (isSniper ? '#38bdf8' : '#f59e0b');

  const ammoObj = player.ammo?.[curWepId];
  const defMag = isShotgun ? 8 : (isSniper ? 5 : 30);
  const defRes = isShotgun ? 64 : (isSniper ? 25 : 90);
  const currentAmmo = ammoObj ? ammoObj.currentAmmo : defMag;
  const reserveAmmo = ammoObj ? ammoObj.reserveAmmo : defRes;
  const isReloading = !!ammoObj?.isReloading;
  const isNoAmmo = (currentAmmo === 0 && reserveAmmo === 0);
  const isLowAmmo = (!isNoAmmo && currentAmmo <= Math.ceil(defMag * 0.25));

  ctx.save();
  ctx.globalAlpha = 0.92;

  // 1. Tło Dark Glass ze stylowym zaokrągleniem
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, size, size, 10);
  } else {
    ctx.rect(x, y, size, size);
  }
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fill();

  // 2. Poświata i ramka kafelka
  let borderCol = isNoAmmo ? '#ef4444' : (isLowAmmo ? '#f97316' : accentCol);
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 2.0;
  ctx.shadowColor = borderCol;
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 3. Pasek przeładowania
  if (isReloading && ammoObj) {
    const dur = ammoObj.reloadDuration || 120;
    const prog = Math.max(0, Math.min(1, 1 - (ammoObj.reloadTimer / dur)));
    ctx.fillStyle = accentCol;
    ctx.shadowColor = accentCol;
    ctx.shadowBlur = 0;
    ctx.fillRect(x + 4, y + size - 4, (size - 8) * prog, 2.5);
    ctx.shadowBlur = 0;
  }

  // 4. Sylwetka broni w centrum
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2 - 4);
  ctx.scale(1.05, 1.05);
  drawWeaponSilhouette(ctx, curWepId, 0, 0, true);
  ctx.restore();

  // 5. Wskaźnik przełączania broni w prawym górnym rogu
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.70)';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('⇄', x + size - 5, y + 11);
  ctx.restore();

  // 6. Licznik amunicji na dole kafelka
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const ammoY = y + size - 3;
  ctx.font = 'bold 9px monospace';
  if (isReloading) {
    ctx.fillStyle = accentCol;
    ctx.fillText('RELOAD', x + size / 2, ammoY);
  } else if (isNoAmmo) {
    ctx.fillStyle = '#ef4444';
    ctx.fillText('EMPTY', x + size / 2, ammoY);
  } else {
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`${currentAmmo}/${reserveAmmo}`, x + size / 2, ammoY);
  }
  ctx.restore();

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
  const wepShort = curWep.id === 'SHOTGUN' ? 'SG' : (curWep.id === 'SNIPER' ? 'SR' : 'AK');
  const curAmmoObj = player.ammo?.[curWep.id];
  const defM = curWep.id === 'SHOTGUN' ? 8 : (curWep.id === 'SNIPER' ? 5 : 30);
  const defR = curWep.id === 'SHOTGUN' ? 64 : (curWep.id === 'SNIPER' ? 25 : 90);
  const cAmmo = curAmmoObj ? curAmmoObj.currentAmmo : defM;
  const rAmmo = curAmmoObj ? curAmmoObj.reserveAmmo : defR;
  const mSize = curAmmoObj ? (curAmmoObj.magSize || defM) : defM;
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
  // Powiększony, czytelny licznik klatek (FPS)
  ctx.fillStyle = '#38bdf8';
  ctx.font = isMobile ? 'bold 11px monospace' : 'bold 14px monospace';
  ctx.fillText(`FPS: ${currentFps}`, statsX, curY);
  ctx.restore();

  // =========================================================================
  // 2. KAFELKI BRONI:
  // - PC: 4 kompaktowe sloty 38x38 px w lewym dolnym rogu ekranu
  // - EKRAN DOTYKOWY (MOBILE): Przeniesione na dolny środek ekranu w 1 ikonę
  // =========================================================================
  const curWepId = player.currentWeapon?.id || 'AK47';

  if (isTouchDevice) {
    // Na ekranie dotykowym sloty broni znajdują się w przezroczystych kieszeniach wokół prawego drążka (pockets)
    weaponButtons[0].x = -999;
    weaponButtons[0].y = -999;
    weaponButtons[1].x = -999;
    weaponButtons[1].y = -999;
    if (weaponButtons[2]) {
      weaponButtons[2].x = -999;
      weaponButtons[2].y = -999;
    }
    if (weaponButtons[3]) {
      weaponButtons[3].x = -999;
      weaponButtons[3].y = -999;
    }
  } else {
    const slotSize = 38;
    const slotGap = 8;
    const panelX = 14;
    const panelY = H - slotSize - 14;

    weaponButtons[0].x = panelX;
    weaponButtons[0].y = panelY;
    weaponButtons[0].w = slotSize;
    weaponButtons[0].h = slotSize;
    weaponButtons[0].id = 'AK47';

    weaponButtons[1].x = panelX + slotSize + slotGap;
    weaponButtons[1].y = panelY;
    weaponButtons[1].w = slotSize;
    weaponButtons[1].h = slotSize;
    weaponButtons[1].id = 'SHOTGUN';

    if (weaponButtons[2]) {
      weaponButtons[2].x = panelX + (slotSize + slotGap) * 2;
      weaponButtons[2].y = panelY;
      weaponButtons[2].w = slotSize;
      weaponButtons[2].h = slotSize;
      weaponButtons[2].id = 'SNIPER';
    }

    if (weaponButtons[3]) {
      weaponButtons[3].x = panelX + (slotSize + slotGap) * 3;
      weaponButtons[3].y = panelY;
      weaponButtons[3].w = slotSize;
      weaponButtons[3].h = slotSize;
      weaponButtons[3].id = 'GRENADE';
    }

    for (const btn of weaponButtons) {
      const isSelected = (curWepId === btn.id) && !player.isHolstered;
      drawWeaponSlot(ctx, btn, isSelected, player, false);
    }
  }

  // =========================================================================
  // 3. TABLICA WYNIKÓW (GÓRA EKRANU)
  // =========================================================================
  const aState = arenaInfo || _worldArenaState;
  const curArenaId = aState.activeArenaId;
  const curScore = aState.arenaScore || { cyan: 0, orange: 0 };
  const curA1State = aState.arena1State;
  const isDeathmatch = (curArenaId === 'ARENA_3' || curArenaId === 'arena-3' || curArenaId === 'ARENA_FOUNDRY');
  const isSectorXArena = (curArenaId === 'ARENA_2' || curArenaId === 'ARENA_2_PANDORA' || curArenaId === 'arena-2' || curArenaId === 'ARENA_2_SECTOR_X');
  const isJungleArena = isSectorXArena; // Wsteczna kompatybilność
  const isMatchArena = (curArenaId === 'ARENA_1');

  if (isSectorXArena) {
    const bannerW = isMobile ? 220 : 290;
    const bannerH = isMobile ? 26 : 32;
    const bannerX = (W - bannerW) / 2;
    const bannerY = isMobile ? 10 : 16;

    ctx.save();
    ctx.globalAlpha = isMobile ? 0.85 : 0.92;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
    ctx.lineWidth = 1.4;
    if (ctx.roundRect) ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 6);
    else ctx.rect(bannerX, bannerY, bannerW, bannerH);
    ctx.fill();
    ctx.stroke();

    ctx.font = isMobile ? '900 8.5px monospace' : '900 10.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 0;
    ctx.fillText('☣️ SEKTOR X // INDUSTRIAL FOUNDRY ☣️', bannerX + bannerW / 2, bannerY + (isMobile ? 16 : 20));
    ctx.restore();
  } else if (isDeathmatch) {
    const scoreBoxW = isMobile ? 220 : 280;
    const scoreBoxH = isMobile ? 32 : 40;
    const scoreBoxX = (W - scoreBoxW) / 2;
    const scoreBoxY = isMobile ? 10 : 16;

    ctx.save();
    ctx.globalAlpha = isMobile ? 0.85 : 0.92;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.lineWidth = 1.4;
    if (ctx.roundRect) ctx.roundRect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, 6);
    else ctx.rect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH);
    ctx.fill();
    ctx.stroke();

    // Nagłówek trybu TDM
    ctx.font = isMobile ? '900 8.5px monospace' : '900 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 0;
    ctx.fillText('💀 TEAM DEATHMATCH 💀', scoreBoxX + scoreBoxW / 2, scoreBoxY + (isMobile ? 11 : 13));

    // Fragi obu drużyn
    ctx.font = isMobile ? 'bold 11px monospace' : 'bold 14px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 0;
    ctx.fillText(`CYAN ${curScore.cyan}`, scoreBoxX + scoreBoxW / 2 - (isMobile ? 12 : 16), scoreBoxY + (isMobile ? 24 : 30));

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText(':', scoreBoxX + scoreBoxW / 2, scoreBoxY + (isMobile ? 24 : 29));

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 0;
    ctx.fillText(`${curScore.orange} ORANGE`, scoreBoxX + scoreBoxW / 2 + (isMobile ? 12 : 16), scoreBoxY + (isMobile ? 24 : 30));

    // Subtekst pod tablicą z celem eliminacji
    const pulse = 0.6 + 0.4 * Math.sin(performance.now() * 0.004);
    ctx.textAlign = 'center';
    ctx.font = isMobile ? 'bold 8px monospace' : 'bold 9.5px monospace';
    ctx.fillStyle = `rgba(248, 113, 113, ${0.75 + pulse * 0.25})`;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 0;
    ctx.fillText('⚔️ CEL: ELIMINACJA WROGA ⚔️', W / 2, scoreBoxY + scoreBoxH + (isMobile ? 12 : 14));

    ctx.restore();
  } else if (isMatchArena) {
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
    ctx.shadowBlur = 0;
    ctx.fillText(`CYAN ${curScore.cyan}`, scoreBoxX + scoreBoxW / 2 - (isMobile ? 10 : 14), scoreBoxY + (isMobile ? 17 : 22));

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText(':', scoreBoxX + scoreBoxW / 2, scoreBoxY + (isMobile ? 16 : 21));

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 0;
    ctx.fillText(`${curScore.orange} ORANGE`, scoreBoxX + scoreBoxW / 2 + (isMobile ? 10 : 14), scoreBoxY + (isMobile ? 17 : 22));

    if (curArenaId === 'ARENA_1' && curA1State?.waitingForKickoff) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.005);
      ctx.textAlign = 'center';
      ctx.font = isMobile ? 'bold 8.5px monospace' : 'bold 10px monospace';
      ctx.fillStyle = `rgba(56, 189, 248, ${0.80 + pulse * 0.20})`;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 0;
      ctx.fillText('⚡ ROZPOCZNIJ MECZ: PIŁKA NA OŁTARZU CENTRALNYM (X: 1800) ⚡', W / 2, scoreBoxY + scoreBoxH + (isMobile ? 12 : 16));
    }

    ctx.restore();
  }

  // 4. BANER CELEBRACJI GOLA (tylko w trybie meczowym z piłką)
  if (!isDeathmatch && !isSectorXArena && goalCelebration.active && goalCelebration.timer > 0) {
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
    ctx.shadowBlur = 0;
    ctx.fillText(`⚽ ${goalCelebration.team} GOAL! ⚽`, W / 2, H * 0.32);
    ctx.restore();
  }
  ctx.restore();

  if (ball && ball.active && !isDeathmatch && !isSectorXArena) {
    drawOffscreenBallIndicator(ctx, ball, camera, player);
  }

  if (isTouchDevice) {
    drawTouchControls(ctx, player, leftStick, btnCluster, rightStick, (isDeathmatch || isSectorXArena) ? null : ball, inKickRange);
  }
}
