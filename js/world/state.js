// =========================================================================
// WORLD.JS - MODUŁ ZAMKNIĘTEJ ARENY BOJOWEJ + SYSTEM GORE & KINEMATYKA ŚMIERCI
// =========================================================================

import { CONFIG, START_X, ARENA_LEFT, ARENA_RIGHT, ARENA_WIDTH, MAP_WIDTH, isTouchDevice, setTouchDevice, ARENA_2_PANDORA } from '../config.js';
import { spawnConcreteDebris, spawnRicochetSparks } from '../particles.js';
import { drawPandoraBackground } from '../background.js';
import { goalTriggerLeft, goalTriggerRight, ARENA_1_GOALS } from '../arenas/arena1.js';
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
  getCameraArenaId,
  setCameraMouseScreenPos,
  mouseScreenPos
} from '../camera.js';
export { isTouchDevice, setTouchDevice, ARENA_2_PANDORA, goalTriggerLeft, goalTriggerRight, ARENA_1_GOALS, MAP_WIDTH };

export const centerX = MAP_WIDTH / 2; // 1800

export var _worldPlatforms = [];
export var _worldCustomObstacles = [];
export var platforms = [];
export var slopes = [];
export var walls = [];
export var obstacles = [];

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

export function getOptimizedDPR() {
  if (typeof window === 'undefined') return 1;
  const isTouchMobile = (window.innerWidth <= 1024) && (('ontouchstart' in window) || (navigator && navigator.maxTouchPoints > 0));
  if (isTouchMobile) {
    return Math.min(window.devicePixelRatio || 1, 2.0);
  }
  // Na PC (w tym Opera GX / Chrome) zachowujemy stabilne 1.0 (natywne 1080p/1440p)
  // eliminując 4-krotne przeciążenie karty graficznej i gwarantując stałe 60 FPS
  return 1.0;
}

export let canvas = null;
export let ctx = null;
export let W = window.innerWidth;
export let H = window.innerHeight;
export let DPR = getOptimizedDPR();
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
  if (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X') {
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

if (typeof window !== 'undefined') {
  window.isGroundAt = isGroundAt;
}

export function isGroundSupporting(minX, maxX) {
  if (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X') {
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
  if (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X') {
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
  getCameraArenaId,
  setCameraMouseScreenPos,
  mouseScreenPos
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
  try {
    ctx = canvas.getContext('2d', { alpha: false });
  } catch (_) {
    ctx = canvas.getContext('2d');
  }
  if (!ctx) ctx = canvas.getContext('2d');
  resize();
}

export const setupCanvas = initCanvas;
export const resizeCanvas = resize;

export function resize(player) {
  W = window.innerWidth;
  H = window.innerHeight;
  DPR = getOptimizedDPR();
  if (canvas && ctx) {
    // Fill-Rate Limiter dla Chrome, monitorów Ultrawide (21:9 / 32:9) oraz ekranów 1440p / 4K / DPR > 1.0
    // Maksymalny bufor pikseli bezpieczny dla Canvas 2D bez dławienia pamięci GPU: standard Full HD (1920 x 1080)
    const MAX_PIXELS = 1920 * 1080;
    const currentPixels = (W * DPR) * (H * DPR);
    let scaleDown = 1.0;
    if (currentPixels > MAX_PIXELS) {
      scaleDown = Math.sqrt(MAX_PIXELS / currentPixels);
    }
    const bufferW = Math.max(960, Math.floor(W * DPR * scaleDown));
    const bufferH = Math.max(540, Math.floor(H * DPR * scaleDown));

    canvas.width = bufferW;
    canvas.height = bufferH;
    ctx.resetTransform();
    ctx.scale(bufferW / W, bufferH / H);
    ctx.imageSmoothingEnabled = true;
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
  const isA2 = (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X');
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


export let skyCacheVersion = 0;
export function invalidateSkyCache() {
  skyCacheVersion++;
}

// =========================================================================
// NEONOWY SYSTEM CZĄSTECZEK JETPACKA (CYJAN, BŁĘKIT, FIOLET)
// =========================================================================
export const jetpackParticles = [];

export function spawnJetpackSparks(x, y, facing, count = 3, customColors = null, inheritVx = 0, inheritVy = 0, nozzleAngle = Math.PI / 2, floorY = null) {
  const colors = customColors || ['#00e5ff', '#38bdf8', '#ffffff'];

  for (let i = 0; i < count; i++) {
    // Zwarty stożkowy rozrzut (+/- 12 stopni)
    const coneAngle = nozzleAngle + (Math.random() - 0.5) * 0.42;
    const thrustSpeed = Math.random() * 4.5 + 3.5;

    // Prędkość wylotowa z uwzględnieniem części pędu gracza
    const vx = Math.cos(coneAngle) * thrustSpeed + inheritVx * 0.30;
    const vy = Math.sin(coneAngle) * thrustSpeed + inheritVy * 0.30;

    const isSmoke = Math.random() < 0.28;
    const col = isSmoke 
      ? '#64748b' 
      : colors[Math.floor(Math.random() * colors.length)];

    // Zwarte, drobne iskry w stylu Soldat (1.2 - 2.2 px) zamiast wielkich kul
    const baseSize = isSmoke 
      ? (Math.random() * 1.5 + 2.5) 
      : (Math.random() * 0.8 + 1.2);

    jetpackParticles.push({
      x: x + (Math.random() * 1.6 - 0.8),
      y: y + (Math.random() * 1.6 - 0.8),
      vx,
      vy,
      size: baseSize,
      maxSize: isSmoke ? 6.5 : 2.5,
      life: 1.0,
      decay: isSmoke ? 0.035 : 0.048,
      isFlame: !isSmoke,
      color: col,
      floorY: (typeof floorY === 'number') ? floorY : null
    });
  }

  if (jetpackParticles.length > 180) {
    jetpackParticles.splice(0, jetpackParticles.length - 180);
  }
}

export function updateJetpackParticles() {
  for (let i = jetpackParticles.length - 1; i >= 0; i--) {
    const p = jetpackParticles[i];
    p.x += p.vx;
    p.y += p.vy;

    // Kontakt z podłożem: delikatny ślizg poziomy bez przerysowanych plam
    if (typeof p.floorY === 'number' && p.y >= p.floorY - 1) {
      p.y = p.floorY - 1;
      p.vy = 0;
      p.vx *= 0.85;
      p.life -= 0.03;
    }

    // Naturalny opór powietrza
    p.vx *= 0.94;
    p.vy *= 0.94;
    p.life -= p.decay;

    if (p.isFlame) {
      if (p.life < 0.45) {
        p.isFlame = false;
        p.color = '#64748b';
      }
    } else {
      p.size = Math.min(p.maxSize, p.size + 0.10);
      p.vy -= 0.02;
    }

    if (p.life <= 0) {
      jetpackParticles.splice(i, 1);
    }
  }
}

export function drawJetpackParticles(ctx) {
  if (jetpackParticles.length === 0) return;

  const camW = typeof getCanvasLogicalWidth === 'function' ? getCanvasLogicalWidth() : 1920;
  const camH = typeof getCanvasLogicalHeight === 'function' ? getCanvasLogicalHeight() : 1080;
  const zoom = camera && camera.zoom ? camera.zoom : 1;
  const viewW = camera.viewWidth || (camW / zoom);
  const viewH = camera.viewHeight || (camH / zoom);
  const margin = 60;
  const minX = camera.x - margin;
  const maxX = camera.x + viewW + margin;
  const minY = camera.y - margin;
  const maxY = camera.y + viewH + margin;

  // 1. Dym: delikatne, małe chmurki
  ctx.save();
  for (let i = 0; i < jetpackParticles.length; i++) {
    const p = jetpackParticles[i];
    if (p.isFlame) continue;
    if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) continue;

    ctx.fillStyle = p.color || '#64748b';
    ctx.globalAlpha = Math.max(0, p.life * 0.28);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 2. Iskry i mikro-smugi w stylu Soldat (ostre, czytelne, bez chaosu)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < jetpackParticles.length; i++) {
    const p = jetpackParticles[i];
    if (!p.isFlame) continue;
    if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) continue;

    const spd = Math.hypot(p.vx, p.vy);

    if (spd > 1.8) {
      // Drobna smuga pędu (3-6 px)
      const ang = Math.atan2(p.vy, p.vx);
      const sLen = p.size * (1.2 + spd * 0.4);
      const sW = p.size * 0.8;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1.0, p.life * 1.4);
      ctx.beginPath();
      ctx.ellipse(0, 0, sLen * 0.5, sW * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Biały mikro-rdzeń
      if (p.life > 0.5) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, sLen * 0.25, sW * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else {
      // Drobny punkt świetlny
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1.0, p.life * 1.3);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      if (p.life > 0.6) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
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


let lastTime = performance.now();
let frameCount = 0;
export let currentFps = 60;

export function updateFps() {
  frameCount++;
  const now = performance.now();
  const elapsed = now - lastTime;
  if (elapsed >= 500) {
    const rawFps = (frameCount * 1000) / elapsed;
    currentFps = (rawFps >= 58.5 && rawFps <= 61.5) ? 60 : Math.round(rawFps);
    frameCount = 0;
    lastTime = now;
  }
}

