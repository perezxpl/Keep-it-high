// =========================================================================
// ARENAS/ARENA3/RENDERER.JS - RENDEROWANIE TŁA I PIERWSZEGO PLANU ARENY 3
// Wydzielony moduł z js/arenas/arena3.js
// =========================================================================

import {
  animTime,
  WATER_RIPPLES,
  getRiverbankGroundY,
  ARENA_3_BRIDGE_BLOCKS,
  getApproachInclineY,
  ARENA_3_RAMP_BLOCKS,
  BRIDGE_SPLINTERS,
  ARENA_3_WATER_SPLASHES,
  ARENA_3_PYLONS,
  ARENA_3_CANOPY_PLATFORMS,
  STONE_DEBRIS,
  ARENA_3_SNIPER_SLABS,
  ARENA_3_TOWER_PILLARS,
  ARENA_3_TOWER_BLOCKS,
  ARENA_3_TOWER_ROOFS,
  setTowerCanvasInvalidator,
  setRampCanvasInvalidator,
  ARENA_3_PLATFORMS,
  GROUND_LEFT_POINTS,
  GROUND_RIGHT_POINTS,
  LEFT_OVAL_POINTS,
  RIGHT_OVAL_POINTS,
  GROUND_WATER_TABLE_Y,
  GROUND_BEDROCK_Y,
  isArena3CliffDirty,
  setArena3CliffDirty
} from './state.js';

import { drawArena3Background } from './background.js';
export { drawArena3Background };

import {
  drawWeatheredTimberDeck,
  drawWeatheredTimberPost,
  drawWeatheredStoneMasonry,
  drawWeatheredBalustrade
} from './weatheredAssets.js';

// Cache statycznych gradientów i tablic bloków rampy do eliminacji alokacji per klatka
let _cachedCliffGrad = null;
let _cachedShoreGrad = null;
let _cachedDeepAbyssGrad = null;
let _cachedSurfGrad = null;
let _cachedPoolGrad = null;

let _leftCliffCache = null;
let _rightCliffCache = null;

let _cachedLeftTowerCanvas = null;
let _cachedRightTowerCanvas = null;

export function invalidateTowerCanvas(side) {
  if (!side || side === 'left') {
    _cachedLeftTowerCanvas = null;
  }
  if (!side || side === 'right') {
    _cachedRightTowerCanvas = null;
  }
}
if (typeof setTowerCanvasInvalidator === 'function') {
  setTowerCanvasInvalidator(invalidateTowerCanvas);
}

let _cachedPylonLeftCanvas = null;
let _cachedPylonRightCanvas = null;

let _cachedLeftStiltsCanvas = null;
let _cachedRightStiltsCanvas = null;
let _cachedLeftApproachDeckCanvas = null;
let _cachedRightApproachDeckCanvas = null;

export function invalidateRampCanvas(side) {
  if (!side || side === 'left' || side === 'all') {
    _cachedLeftStiltsCanvas = null;
    _cachedLeftApproachDeckCanvas = null;
  }
  if (!side || side === 'right' || side === 'all') {
    _cachedRightStiltsCanvas = null;
    _cachedRightApproachDeckCanvas = null;
  }
}
if (typeof setRampCanvasInvalidator === 'function') {
  setRampCanvasInvalidator(invalidateRampCanvas);
}

let _rampLeftBlocks = null;
let _rampRightBlocks = null;
function getRampBlocks(isLeft) {
  if (!_rampLeftBlocks) {
    _rampLeftBlocks = ARENA_3_RAMP_BLOCKS.filter(b => b.side === 'left');
    _rampRightBlocks = ARENA_3_RAMP_BLOCKS.filter(b => b.side === 'right');
  }
  return isLeft ? _rampLeftBlocks : _rampRightBlocks;
}

function drawGroundwaterPool(ctx, seg) {
  if (!seg || seg.length < 2) return;
  const xStart = seg[0].x - 2;
  const xEnd = seg[seg.length - 1].x + 2;

  ctx.save();
  // Woda podziemna / gruntowa
  if (!_cachedPoolGrad) {
    _cachedPoolGrad = ctx.createLinearGradient(0, GROUND_WATER_TABLE_Y, 0, GROUND_BEDROCK_Y);
    _cachedPoolGrad.addColorStop(0, 'rgba(10, 42, 48, 0.88)');
    _cachedPoolGrad.addColorStop(1, 'rgba(4, 18, 22, 0.98)');
  }
  ctx.fillStyle = _cachedPoolGrad;

  ctx.beginPath();
  ctx.moveTo(xStart, GROUND_WATER_TABLE_Y);
  for (let i = 0; i < seg.length; i++) {
    ctx.lineTo(seg[i].x, seg[i].y);
  }
  ctx.lineTo(xEnd, GROUND_WATER_TABLE_Y);
  ctx.closePath();
  ctx.fill();

  // Tafla wody z seledynowo-wodnym rimem
  ctx.strokeStyle = 'rgba(125, 215, 235, 0.75)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(xStart, GROUND_WATER_TABLE_Y);
  ctx.lineTo(xEnd, GROUND_WATER_TABLE_Y);
  ctx.stroke();

  // Ciemny mulisty brzeg przy krawędzi wody
  ctx.fillStyle = '#0a1012';
  ctx.fillRect(xStart - 1, GROUND_WATER_TABLE_Y - 1, 3, 3);
  ctx.fillRect(xEnd - 2, GROUND_WATER_TABLE_Y - 1, 3, 3);

  ctx.restore();
}

function drawCraterWalls(ctx, ovalPoints) {
  if (!ovalPoints || ovalPoints.length < 2) return;

  let inCrater = false;
  let seg = [];

  for (let i = 0; i < ovalPoints.length; i++) {
    const pt = ovalPoints[i];
    const origY = (pt.origY !== undefined) ? pt.origY : 1200;
    if (pt.y > origY + 1.8) {
      if (!inCrater) {
        inCrater = true;
        if (i > 0) seg.push(ovalPoints[i - 1]);
      }
      seg.push(pt);
    } else {
      if (inCrater) {
        seg.push(pt);
        renderCraterSegment(ctx, seg);
        seg = [];
        inCrater = false;
      }
    }
  }
  if (seg.length >= 2) {
    renderCraterSegment(ctx, seg);
  }
}

function renderCraterSegment(ctx, seg) {
  if (seg.length < 2) return;
  ctx.save();

  // 1. Głęboki gradient przypalenia i zwęglenia skały w leju wybuchu
  ctx.strokeStyle = 'rgba(5, 7, 10, 0.95)';
  ctx.lineWidth = 7.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(seg[0].x, seg[0].y);
  for (let i = 1; i < seg.length; i++) {
    ctx.lineTo(seg[i].x, seg[i].y);
  }
  ctx.stroke();

  // 2. Chropowata warstwa zwęglonego bazaltu i spalonej gleby
  ctx.strokeStyle = '#151c24';
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.moveTo(seg[0].x, seg[0].y);
  for (let i = 1; i < seg.length; i++) {
    ctx.lineTo(seg[i].x, seg[i].y);
  }
  ctx.stroke();

  // 3. Spękania geologiczne i postrzępione krawędzie odłamu
  ctx.strokeStyle = '#273444';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(seg[0].x, seg[0].y + 1);
  for (let i = 1; i < seg.length; i++) {
    const pt = seg[i];
    const jag = ((i % 2 === 0) ? 1.8 : -1.2);
    ctx.lineTo(pt.x, pt.y + 1 + jag);
  }
  ctx.stroke();

  // 4. Bryły wyrwanego bazaltu spoczywające na dnie leja (zgrupowane w 1 fill)
  ctx.fillStyle = '#0a0f15';
  ctx.beginPath();
  for (let i = 1; i < seg.length - 1; i += 2) {
    const pt = seg[i];
    const bx = pt.x + ((i * 13) % 7 - 3);
    const by = pt.y - 1;
    const br = 2.5 + ((i * 7) % 3);
    ctx.moveTo(bx + br, by);
    ctx.arc(bx, by, br, 0, Math.PI * 2);
  }
  ctx.fill();

  // 5. Osmolone wargi wlotowe krateru na rzeczywistym poziomie wlotu leja (zgrupowane w 1 fill)
  const lipL = seg[0];
  const lipR = seg[seg.length - 1];
  ctx.fillStyle = 'rgba(15, 10, 5, 0.85)';
  ctx.beginPath();
  ctx.ellipse(lipL.x, lipL.y, 8, 3, 0, 0, Math.PI * 2);
  ctx.moveTo(lipR.x + 8, lipR.y);
  ctx.ellipse(lipR.x, lipR.y, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function getSurfaceYFromPoints(pts, x) {
  if (x <= 1150) {
    const idx = Math.floor(x / 10);
    if (idx >= 0 && idx < GROUND_LEFT_POINTS.length - 1) {
      const p0 = GROUND_LEFT_POINTS[idx];
      const p1 = GROUND_LEFT_POINTS[idx + 1];
      const dx = p1.x - p0.x;
      const t = dx > 0 ? (x - p0.x) / dx : 0;
      return p0.y + t * (p1.y - p0.y);
    }
    return 1200;
  }
  if (x >= 3250) {
    const idx = Math.floor((x - 3250) / 10);
    if (idx >= 0 && idx < GROUND_RIGHT_POINTS.length - 1) {
      const p0 = GROUND_RIGHT_POINTS[idx];
      const p1 = GROUND_RIGHT_POINTS[idx + 1];
      const dx = p1.x - p0.x;
      const t = dx > 0 ? (x - p0.x) / dx : 0;
      return p0.y + t * (p1.y - p0.y);
    }
    return 1200;
  }
  if (x <= pts[0].x) return pts[0].y;
  if (x >= pts[pts.length - 1].x) return pts[pts.length - 1].y;
  for (let i = 0; i < pts.length - 1; i++) {
    if (x >= pts[i].x && x <= pts[i + 1].x) {
      const dx = pts[i + 1].x - pts[i].x;
      const t = dx > 0 ? (x - pts[i].x) / dx : 0;
      return pts[i].y + t * (pts[i + 1].y - pts[i].y);
    }
  }
  return 1200;
}

function getOrigSurfaceY(x, isL) {
  if (isL) {
    if (x <= 1150) return 1200;
    if (x >= 1750) return 1335;
    for (let i = 0; i < LEFT_OVAL_POINTS.length - 1; i++) {
      const p1 = LEFT_OVAL_POINTS[i];
      const p2 = LEFT_OVAL_POINTS[i + 1];
      if (x >= p1.x && x <= p2.x) {
        const t = (x - p1.x) / (p2.x - p1.x);
        return p1.origY + t * (p2.origY - p1.origY);
      }
    }
    return 1200;
  } else {
    if (x <= 2650) return 1335;
    if (x >= 3250) return 1200;
    for (let i = 0; i < RIGHT_OVAL_POINTS.length - 1; i++) {
      const p1 = RIGHT_OVAL_POINTS[i];
      const p2 = RIGHT_OVAL_POINTS[i + 1];
      if (x >= p1.x && x <= p2.x) {
        const t = (x - p1.x) / (p2.x - p1.x);
        return p1.origY + t * (p2.origY - p1.origY);
      }
    }
    return 1200;
  }
}

// =========================================================================
// GRAFIKA ZNISZCZONYCH ELEMENTÓW (DAMAGED / DESTRUCTIBLE ASSETS)
// Poszarpane, wyszczerbione profile połamanych belek, odłupy skalne,
// zwęglenia po wybuchach i rozplecione liny
// =========================================================================

const _woodRubbleCanvases = new Map();
function getSplinteredWoodCanvas(variant, isWet) {
  const key = `${variant}_${isWet ? 1 : 0}`;
  let c = _woodRubbleCanvases.get(key);
  if (!c && typeof document !== 'undefined') {
    c = document.createElement('canvas');
    c.width = 64;
    c.height = 44;
    const tctx = c.getContext('2d');
    if (tctx) {
      renderWoodRubbleVector(tctx, 32, 22, 40, 22, variant, isWet);
    }
    _woodRubbleCanvases.set(key, c);
  }
  return c;
}

function renderWoodRubbleVector(ctx, ox, oy, w, h, seed, isWet, options = {}) {
  ctx.save();
  ctx.translate(ox, oy);
  const halfW = w / 2;
  const halfH = h / 2;
  const scorchSide = options.scorchSide || (seed % 2 === 0 ? 'left' : 'right');

  // 1. Poszarpany profil połamanej belki
  ctx.beginPath();
  ctx.moveTo(-halfW + 4, -halfH + ((seed % 3) - 1));
  ctx.lineTo(-halfW * 0.3, -halfH + ((seed % 2) - 0.5));
  ctx.lineTo(0, -halfH);
  ctx.lineTo(halfW * 0.4, -halfH + (((seed + 1) % 3) - 1));
  ctx.lineTo(halfW - 3, -halfH + 1);

  ctx.lineTo(halfW + 5, -halfH * 0.4);
  ctx.lineTo(halfW - 3, -halfH * 0.1);
  ctx.lineTo(halfW + 6, halfH * 0.2);
  ctx.lineTo(halfW - 2, halfH * 0.6);
  ctx.lineTo(halfW + 2, halfH);

  ctx.lineTo(halfW * 0.5, halfH + (((seed + 2) % 3) - 1));
  ctx.lineTo(0, halfH);
  ctx.lineTo(-halfW * 0.4, halfH - (seed % 2));
  ctx.lineTo(-halfW + 3, halfH);

  ctx.lineTo(-halfW - 3, halfH * 0.5);
  ctx.lineTo(-halfW + 4, halfH * 0.2);
  ctx.lineTo(-halfW - 5, -halfH * 0.2);
  ctx.lineTo(-halfW + 1, -halfH * 0.6);
  ctx.closePath();

  ctx.fillStyle = isWet ? '#2b1708' : '#492c10';
  ctx.fill();

  const sx = scorchSide === 'left' ? -halfW + 4 : halfW - 4;
  ctx.fillStyle = 'rgba(15, 8, 3, 0.70)';
  ctx.beginPath();
  ctx.arc(sx, -halfH * 0.2, w * 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#120702';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  if (!isWet) {
    ctx.strokeStyle = '#0a0401';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-halfW + 8, -halfH * 0.3);
    ctx.lineTo(halfW * 0.2, -halfH * 0.1);
    ctx.lineTo(halfW - 10, -halfH * 0.4);
    ctx.moveTo(-halfW + 12, halfH * 0.3);
    ctx.lineTo(-halfW * 0.1, halfH * 0.15);
    ctx.lineTo(halfW - 6, halfH * 0.4);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(215, 170, 85, 0.60)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-halfW + 6, -halfH + 1);
    ctx.lineTo(halfW - 6, -halfH + 1);
    ctx.stroke();
  }

  if (!isWet && options.hasMetal !== false) {
    const metalX = (seed % 2 === 0) ? -halfW + 7 : halfW - 11;
    ctx.fillStyle = '#334155';
    ctx.fillRect(metalX, -halfH - 2, 5, 7);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(metalX, -halfH - 2, 5, 7);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(metalX + 2, -halfH - 2);
    ctx.lineTo(metalX + 3, -halfH - 6);
    ctx.lineTo(metalX + 6, -halfH - 7);
    ctx.stroke();

    ctx.fillStyle = 'rgba(146, 64, 14, 0.65)';
    ctx.fillRect(metalX + 1, -halfH + 4, 3, 2.5);
  }
  ctx.restore();
}

function drawSplinteredWoodRubble(ctx, cx, cy, w, h, angle, options = {}) {
  const seed = options.seed !== undefined ? options.seed : Math.floor(Math.abs(cx * 7 + cy * 13) % 100);
  const variant = Math.abs(seed) % 4;
  const isWet = (cy + h / 2 >= 1290);
  const canv = getSplinteredWoodCanvas(variant, isWet);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle || 0);
  if (canv) {
    const scaleX = (w || 40) / 40;
    const scaleY = (h || 22) / 22;
    ctx.scale(scaleX, scaleY);
    ctx.drawImage(canv, -32, -22);
  } else {
    renderWoodRubbleVector(ctx, 0, 0, w, h, seed, isWet, options);
  }
  ctx.restore();
}

const _rockSlabCanvases = new Map();
function getSplinteredRockCanvas(variant) {
  let c = _rockSlabCanvases.get(variant);
  if (!c && typeof document !== 'undefined') {
    c = document.createElement('canvas');
    c.width = 124;
    c.height = 56;
    const tctx = c.getContext('2d');
    if (tctx) {
      renderRockSlabVector(tctx, 62, 28, 100, 34, variant);
    }
    _rockSlabCanvases.set(variant, c);
  }
  return c;
}

function renderRockSlabVector(ctx, ox, oy, w, h, seed) {
  ctx.save();
  ctx.translate(ox, oy);
  const halfW = w / 2;
  const halfH = h / 2;

  ctx.beginPath();
  ctx.moveTo(-halfW + 10, -halfH + 2);
  ctx.lineTo(-halfW * 0.2, -halfH - 3);
  ctx.lineTo(halfW * 0.4, -halfH + 1);
  ctx.lineTo(halfW - 6, -halfH + 5);
  ctx.lineTo(halfW + 4, 0);
  ctx.lineTo(halfW - 4, halfH - 2);
  ctx.lineTo(halfW * 0.2, halfH + 4);
  ctx.lineTo(-halfW * 0.3, halfH + 2);
  ctx.lineTo(-halfW - 5, halfH - 4);
  ctx.lineTo(-halfW - 2, -halfH * 0.2);
  ctx.closePath();

  ctx.fillStyle = '#343f34';
  ctx.fill();

  ctx.fillStyle = 'rgba(125, 155, 125, 0.25)';
  ctx.beginPath();
  ctx.moveTo(-halfW + 10, -halfH + 2);
  ctx.lineTo(halfW - 6, -halfH + 5);
  ctx.lineTo(halfW * 0.3, -halfH * 0.2);
  ctx.lineTo(-halfW * 0.2, -halfH * 0.1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(5, 10, 5, 0.55)';
  ctx.beginPath();
  ctx.moveTo(-halfW - 5, halfH - 4);
  ctx.lineTo(halfW - 4, halfH - 2);
  ctx.lineTo(halfW * 0.2, halfH + 4);
  ctx.lineTo(-halfW * 0.3, halfH + 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(10, 15, 10, 0.65)';
  ctx.beginPath();
  ctx.arc(-halfW * 0.3, -halfH * 0.3, halfW * 0.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#0b110b';
  ctx.lineWidth = 2.4;
  ctx.stroke();

  ctx.strokeStyle = '#070b07';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-halfW + 12, -halfH + 6);
  ctx.lineTo(0, -halfH * 0.1);
  ctx.lineTo(halfW * 0.5, -halfH * 0.3);
  ctx.moveTo(0, -halfH * 0.1);
  ctx.lineTo(-halfW * 0.1, halfH * 0.4);
  ctx.stroke();

  ctx.fillStyle = '#3f7023';
  ctx.fillRect(-halfW + 14, -halfH + 3, 16, 3);
  ctx.fillStyle = '#5ca033';
  ctx.fillRect(-halfW + 16, -halfH + 3, 10, 1.8);
  ctx.restore();
}

function drawSplinteredRockSlab(ctx, slab) {
  const cx = slab.x + slab.w / 2;
  const cy = slab.y + slab.h / 2;
  const variant = Math.abs(slab.slabIndex !== undefined ? slab.slabIndex : (slab.seed || 0)) % 2;
  const canv = getSplinteredRockCanvas(variant);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(slab.angle || 0);
  if (canv) {
    const scaleX = (slab.w || 100) / 100;
    const scaleY = (slab.h || 34) / 34;
    ctx.scale(scaleX, scaleY);
    ctx.drawImage(canv, -62, -28);
  } else {
    renderRockSlabVector(ctx, 0, 0, slab.w, slab.h, variant);
  }
  ctx.restore();
}

function drawJungleGrass(ctx, ovalPoints, isL, camL, camR) {
  if (!ovalPoints || ovalPoints.length < 2) return;

  const minX = isL ? 0 : 2650;
  const maxX = isL ? 1680 : 4400; // Przed samą wodą rzeki
  const startX = Math.max(minX, camL - 20);
  const endX = Math.min(maxX, camR + 20);
  if (startX >= endX) return;

  ctx.save();

  // A. Podkładowa warstwa mchu i darni glebowej (tylko na nienaruszonym gruncie, omija kratery)
  ctx.strokeStyle = '#0a160d';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  let inTurf = false;
  for (let i = 0; i < ovalPoints.length; i++) {
    const pt = ovalPoints[i];
    const pOrigY = (pt.origY !== undefined) ? pt.origY : 1200;
    if (pt.y <= pOrigY + 2.0 && pt.y < 1315 && pt.x >= startX - 20 && pt.x <= endX + 20) {
      if (!inTurf) {
        ctx.moveTo(pt.x, pt.y);
        inTurf = true;
      } else {
        ctx.lineTo(pt.x, pt.y);
      }
    } else {
      inTurf = false;
    }
  }
  ctx.stroke();

  ctx.strokeStyle = '#142d1b';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  inTurf = false;
  for (let i = 0; i < ovalPoints.length; i++) {
    const pt = ovalPoints[i];
    const pOrigY = (pt.origY !== undefined) ? pt.origY : 1200;
    if (pt.y <= pOrigY + 2.0 && pt.y < 1315 && pt.x >= startX - 20 && pt.x <= endX + 20) {
      if (!inTurf) {
        ctx.moveTo(pt.x, pt.y - 1);
        inTurf = true;
      } else {
        ctx.lineTo(pt.x, pt.y - 1);
      }
    } else {
      inTurf = false;
    }
  }
  ctx.stroke();

  // B. Generowanie proceduralnych źdźbeł trawy (Grass Blades) i tropikalnych paproci
  // Wykorzystujemy lekkie płaskie tablice współrzędnych zamiast alokacji 4x new Path2D() co klatkę
  const stubbles = [];
  const blades = [];
  const ferns = [];

  for (let x = startX; x <= endX; x += 8.0) {
    const y = getSurfaceYFromPoints(ovalPoints, x);

    // Jeśli punkt jest wewnątrz krateru lub głęboko w rzece: BRAK TRAWY!
    const origY = getOrigSurfaceY(x, isL);
    if (y > origY + 2.0 || y > 1315) {
      continue;
    }

    // Sprawdzenie bliskości wargi krateru (opalone, spalone kikuty trawy na krawędzi)
    const yL = getSurfaceYFromPoints(ovalPoints, x - 10);
    const yR = getSurfaceYFromPoints(ovalPoints, x + 10);
    const origYL = getOrigSurfaceY(x - 10, isL);
    const origYR = getOrigSurfaceY(x + 10, isL);
    const isNearCraterLip = (yL > origYL + 2.0 || yR > origYR + 2.0);

    if (isNearCraterLip) {
      // Przypalone, krótkie kikuty trawy (stubble)
      const stubH = 2.5 + Math.abs(Math.sin(x * 7.7)) * 3.5;
      stubbles.push(x, y, x + (Math.sin(x * 3.1) * 2), y - stubH);
      continue;
    }

    // Pseudolosowe deterministyczne cechy źdźbła na podstawie X
    const n1 = Math.sin(x * 12.9898 + (isL ? 0.0 : 42.1)) * 43758.5453;
    const f1 = n1 - Math.floor(n1);
    const n2 = Math.sin(x * 78.233 + (isL ? 1.0 : 53.7)) * 43758.5453;
    const f2 = n2 - Math.floor(n2);
    const n3 = Math.sin(x * 45.164 + (isL ? 2.0 : 64.3)) * 43758.5453;
    const f3 = n3 - Math.floor(n3);

    // Wysokość kępki trawy: 9px do 22px
    const bladeH = 9.0 + f1 * 13.0;

    // Falowanie na wietrze zależne od czasu animacji
    const wind = Math.sin(animTime * 2.3 + x * 0.034) * (bladeH * 0.32);
    const lean = (f2 - 0.5) * 5.0;
    const swayX = lean + wind;

    const tipX = x + swayX;
    const tipY = y - bladeH;

    blades.push(x, y, tipX, tipY);

    // Kępki dzikich paproci dżungli co 38-55 px
    if (f3 > 0.74 && x > minX + 30 && x < maxX - 30) {
      ferns.push({ x, y, f1, f2 });
    }
  }

  // Wyrenderowanie spalonych kikutów przy wargach kraterów
  if (stubbles.length > 0) {
    ctx.strokeStyle = '#1e140d';
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let si = 0; si < stubbles.length; si += 4) {
      ctx.moveTo(stubbles[si], stubbles[si + 1]);
      ctx.lineTo(stubbles[si + 2], stubbles[si + 3]);
    }
    ctx.stroke();
  }

  if (blades.length > 0) {
    // Warstwa 1: Ciemne podszycie leśne i żywa dżunglowa zieleń (szybki przebieg lineTo)
    ctx.strokeStyle = '#112f18';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let bi = 0; bi < blades.length; bi += 4) {
      ctx.moveTo(blades[bi], blades[bi + 1]);
      ctx.lineTo(blades[bi + 2], blades[bi + 3]);
    }
    ctx.stroke();

    // Warstwa 2: Księżycowe rozświetlenia końcówek traw (delikatny srebrzysty seledyn)
    ctx.strokeStyle = 'rgba(126, 212, 146, 0.70)';
    ctx.lineWidth = 1.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let bi = 0; bi < blades.length; bi += 4) {
      ctx.moveTo(blades[bi] + 0.8, blades[bi + 1] - 2);
      ctx.lineTo(blades[bi + 2] + 0.8, blades[bi + 3] - 1);
    }
    ctx.stroke();
  }

  // C. Dzikie paprocie dżungli (Jungle Fern Fronds - zgrupowane w 2 wywołania stroke)
  if (ferns.length > 0) {
    ctx.strokeStyle = '#173c1f';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    for (let fi = 0; fi < ferns.length; fi++) {
      const fn = ferns[fi];
      const fernH = 15 + fn.f1 * 10;
      const dir = fn.f2 > 0.5 ? 1 : -1;
      const fSway = Math.sin(animTime * 2.0 + fn.x * 0.03) * 5;
      const endFx = fn.x + (dir * (fernH * 0.65)) + fSway;
      const endFy = fn.y - fernH;
      fn.endFx = endFx;
      fn.endFy = endFy;
      fn.dir = dir;
      fn.fSway = fSway;
      ctx.moveTo(fn.x, fn.y);
      ctx.quadraticCurveTo(fn.x + (dir * (fernH * 0.3)), fn.y - (fernH * 0.6), endFx, endFy);
    }
    ctx.stroke();

    // Listki boczne pióropusza paproci
    ctx.strokeStyle = 'rgba(82, 168, 102, 0.85)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let fi = 0; fi < ferns.length; fi++) {
      const fn = ferns[fi];
      for (let step = 0.35; step <= 0.9; step += 0.22) {
        const lx = fn.x + (fn.endFx - fn.x) * step;
        const ly = fn.y + (fn.endFy - fn.y) * step;
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + fn.dir * 6 + fn.fSway * 0.3, ly - 3);
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx - fn.dir * 4 + fn.fSway * 0.3, ly - 2);
      }
    }
    ctx.stroke();
  }

  ctx.restore();
}

// =========================================================================
// 7. RENDEROWANIE PIERWSZEGO PLANU (PLATFORMY, TEREN, WIEŻE, BRAMKI Y, RZEKA)
// Pixel-perfect dopasowanie do geometrii kolizyjnej ARENA_3_PLATFORMS
// =========================================================================
let _cachedLeftOvalPoints = null;
let _cachedRightOvalPoints = null;
let _cachedUpperTowerBlocksLeft = null;
let _cachedUpperTowerBlocksRight = null;
const _waterFoamEllipses = [];

export function drawArena3Foreground(ctx, camera) {
  if (!ctx) return;

  ctx.save();

  const camL = camera ? camera.x - 200 : 0;
  const camR = camera ? camera.x + (camera.viewWidth || 2000) + 200 : 4400;
  const camT = camera ? (camera.y - 140) : -200;
  const camB = camera ? (camera.y + (camera.viewHeight || 1200) + 140) : 1600;

  // -----------------------------------------------------------------------
  // 1. PODŁOŻE: OWALNE PŁASZCZYZNY SCHODZĄCE DO WODY (LEWY I PRAWY BRZEG)
  // Przekształcone w naturalne, owalne wzgórza łagodnie zanurzające się w rzece
  // -----------------------------------------------------------------------
  if (!_cachedLeftOvalPoints) {
    _cachedLeftOvalPoints = [
      ...GROUND_LEFT_POINTS,
      ...LEFT_OVAL_POINTS.slice(1)
    ];
  }
  const leftOvalPoints = _cachedLeftOvalPoints;

  if (!_cachedRightOvalPoints) {
    _cachedRightOvalPoints = [
      ...RIGHT_OVAL_POINTS.slice(0, -1),
      ...GROUND_RIGHT_POINTS
    ];
  }
  const rightOvalPoints = _cachedRightOvalPoints;

  const anchorLeftX = 1140;
  const anchorRightX = 3260;
  const pylonLeftX = 1755;
  const pylonRightX = 2645;
  const pylonTopY = 850;

  // -----------------------------------------------------------------------
  // 1. PODŁOŻE: BAZALTOWY KLIF NADRZECZNY I ZAROŚNIĘTE SKARPY (LEWY I PRAWY BRZEG)
  // Przekształcone w litą formację skalną z prastarymi korzeniami figowców,
  // blokami megalitycznymi, wylotami rurociągów i nocnym mchem z rim-lightingiem
  // -----------------------------------------------------------------------
  function renderBasaltCliffVectors(targetCtx, isL, ovalPoints) {
    const startX = isL ? 0 : 4400;
    const edgeX = isL ? 1750 : 2650;
    const startY = isL ? ovalPoints[0].y : ovalPoints[ovalPoints.length - 1].y;

    targetCtx.save();
    targetCtx.beginPath();
    targetCtx.moveTo(startX, 1400);
    targetCtx.lineTo(startX, startY);
    if (isL) {
      for (let i = 1; i < ovalPoints.length; i++) {
        targetCtx.lineTo(ovalPoints[i].x, ovalPoints[i].y);
      }
    } else {
      for (let i = ovalPoints.length - 1; i >= 0; i--) {
        targetCtx.lineTo(ovalPoints[i].x, ovalPoints[i].y);
      }
    }
    targetCtx.lineTo(edgeX, 1400);
    targetCtx.closePath();

    // A. BAZOWY GRADIENT BAZALTOWO-ŁUPKOWY
    const cGrad = targetCtx.createLinearGradient(0, 1200, 0, 1400);
    cGrad.addColorStop(0.00, '#131c26');
    cGrad.addColorStop(0.20, '#0e161f');
    cGrad.addColorStop(0.55, '#090e13');
    cGrad.addColorStop(1.00, '#04070a');
    targetCtx.fillStyle = cGrad;
    targetCtx.fill();

    // B. POZIOME WARSTWY GEOLOGICZNE (STRATA) I SPĘKANIA SKALNE
    targetCtx.strokeStyle = 'rgba(4, 7, 10, 0.70)';
    targetCtx.lineWidth = 2.4;
    const strataY = [1235, 1275, 1315, 1355];
    for (let sy of strataY) {
      targetCtx.beginPath();
      const x0 = isL ? 0 : 2700;
      const x1 = isL ? 1700 : 4400;
      targetCtx.moveTo(x0, sy);
      for (let sx = x0; sx <= x1; sx += 80) {
        const wave = Math.sin(sx * 0.015 + sy) * 5;
        targetCtx.lineTo(sx, sy + wave);
      }
      targetCtx.stroke();
    }

    // C. ŚCIANY WYBITYCH KRATERÓW (Zniszczona, zwęglona skała bazaltowa w lejach)
    drawCraterWalls(targetCtx, ovalPoints);

    // E. TAKTYCZNA KRATA DRENAŻOWA / WYLOT RUROCIĄGU
    const drainX = isL ? 1520 : 2880;
    const drainY = 1310;
    targetCtx.save();
    targetCtx.fillStyle = '#1e293b';
    targetCtx.strokeStyle = '#0f172a';
    targetCtx.lineWidth = 2.5;
    targetCtx.beginPath();
    targetCtx.arc(drainX, drainY, 15, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.stroke();

    targetCtx.fillStyle = '#020408';
    targetCtx.beginPath();
    targetCtx.arc(drainX, drainY, 11, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.strokeStyle = '#475569';
    targetCtx.lineWidth = 1.8;
    targetCtx.beginPath();
    targetCtx.moveTo(drainX - 11, drainY);
    targetCtx.lineTo(drainX + 11, drainY);
    targetCtx.moveTo(drainX, drainY - 11);
    targetCtx.lineTo(drainX, drainY + 11);
    targetCtx.stroke();

    targetCtx.fillStyle = '#94a3b8';
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      targetCtx.fillRect(drainX + Math.cos(a) * 13 - 1, drainY + Math.sin(a) * 13 - 1, 2, 2);
    }

    targetCtx.strokeStyle = 'rgba(30, 80, 115, 0.40)';
    targetCtx.lineWidth = 2.2;
    targetCtx.beginPath();
    targetCtx.moveTo(drainX, drainY + 11);
    targetCtx.quadraticCurveTo(drainX + (isL ? 8 : -8), drainY + 25, drainX + (isL ? 15 : -15), 1345);
    targetCtx.stroke();
    targetCtx.restore();

    // F. OTOCZAKI BAZALTOWE PRZY WODZIE
    const riverStones = isL ? [
      { x: 1620, y: 1290, rx: 14, ry: 8 },
      { x: 1655, y: 1298, rx: 16, ry: 9 },
      { x: 1690, y: 1308, rx: 18, ry: 10 },
      { x: 1725, y: 1320, rx: 20, ry: 11 },
      { x: 1745, y: 1332, rx: 15, ry: 9 }
    ] : [
      { x: 2660, y: 1332, rx: 15, ry: 9 },
      { x: 2685, y: 1320, rx: 19, ry: 11 },
      { x: 2720, y: 1308, rx: 17, ry: 10 },
      { x: 2755, y: 1298, rx: 16, ry: 9 },
      { x: 2790, y: 1290, rx: 14, ry: 8 }
    ];

    targetCtx.save();
    for (let st of riverStones) {
      targetCtx.fillStyle = '#16202b';
      targetCtx.strokeStyle = '#090e14';
      targetCtx.lineWidth = 1.4;
      targetCtx.beginPath();
      targetCtx.ellipse(st.x, st.y, st.rx, st.ry, isL ? 0.1 : -0.1, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.stroke();

      targetCtx.strokeStyle = 'rgba(186, 230, 253, 0.25)';
      targetCtx.lineWidth = 1.0;
      targetCtx.beginPath();
      targetCtx.arc(st.x, st.y - 1, st.rx * 0.65, Math.PI * 1.1, Math.PI * 1.9);
      targetCtx.stroke();
    }
    targetCtx.restore();

    // G. KONTUR PODSTAWY
    targetCtx.strokeStyle = '#05080c';
    targetCtx.lineWidth = 2.5;
    targetCtx.beginPath();
    targetCtx.moveTo(startX, startY);
    if (isL) {
      for (let i = 1; i < ovalPoints.length; i++) targetCtx.lineTo(ovalPoints[i].x, ovalPoints[i].y);
    } else {
      for (let i = ovalPoints.length - 1; i >= 0; i--) targetCtx.lineTo(ovalPoints[i].x, ovalPoints[i].y);
    }
    targetCtx.lineTo(edgeX, 1400);
    targetCtx.stroke();

    // I. ZALEWY WÓD GRUNTOWYCH W GŁĘBOKICH KRATERACH
    const groundPts = isL ? GROUND_LEFT_POINTS : GROUND_RIGHT_POINTS;
    let poolSeg = [];
    for (let i = 0; i < groundPts.length; i++) {
      const pt = groundPts[i];
      if (pt.y > GROUND_WATER_TABLE_Y) {
        if (poolSeg.length === 0 && i > 0) {
          const prev = groundPts[i - 1];
          const frac = (GROUND_WATER_TABLE_Y - prev.y) / (pt.y - prev.y);
          poolSeg.push({ x: prev.x + (pt.x - prev.x) * frac, y: GROUND_WATER_TABLE_Y });
        }
        poolSeg.push(pt);
      } else if (poolSeg.length > 0) {
        const prev = poolSeg[poolSeg.length - 1];
        const frac = (GROUND_WATER_TABLE_Y - prev.y) / (pt.y - prev.y);
        poolSeg.push({ x: prev.x + (pt.x - prev.x) * frac, y: GROUND_WATER_TABLE_Y });
        drawGroundwaterPool(targetCtx, poolSeg);
        poolSeg = [];
      }
    }
    if (poolSeg.length > 0) {
      drawGroundwaterPool(targetCtx, poolSeg);
    }

    targetCtx.restore();
  }

  function ensureCliffCaches(leftOval, rightOval) {
    if (typeof document === 'undefined') return;
    if (!_leftCliffCache) {
      _leftCliffCache = document.createElement('canvas');
      _leftCliffCache.width = 1760;
      _leftCliffCache.height = 220;
    }
    if (!_rightCliffCache) {
      _rightCliffCache = document.createElement('canvas');
      _rightCliffCache.width = 1760;
      _rightCliffCache.height = 220;
    }

    if (isArena3CliffDirty()) {
      const lCtx = _leftCliffCache.getContext('2d');
      if (lCtx) {
        lCtx.clearRect(0, 0, 1760, 220);
        lCtx.save();
        lCtx.translate(0, -1190);
        renderBasaltCliffVectors(lCtx, true, leftOval);
        lCtx.restore();
      }

      const rCtx = _rightCliffCache.getContext('2d');
      if (rCtx) {
        rCtx.clearRect(0, 0, 1760, 220);
        rCtx.save();
        rCtx.translate(-2640, -1190);
        renderBasaltCliffVectors(rCtx, false, rightOval);
        rCtx.restore();
      }

      setArena3CliffDirty(false);
    }
  }

  function drawBasaltRiverCliff(isLeft, ovalPoints) {
    ensureCliffCaches(leftOvalPoints, rightOvalPoints);

    if (isLeft && _leftCliffCache) {
      ctx.drawImage(_leftCliffCache, 0, 1190);
    } else if (!isLeft && _rightCliffCache) {
      ctx.drawImage(_rightCliffCache, 2640, 1190);
    } else {
      renderBasaltCliffVectors(ctx, isLeft, ovalPoints);
    }

    // H. GĘSTA, ŻYWA TRAWA DŻUNGLI Z KOŁYSANIEM NA WIETRZE (Tylko nienaruszony grunt, omija kratery)
    drawJungleGrass(ctx, ovalPoints, isLeft, camL, camR);
  }



  function drawRiverWaterZone() {
    if (camL >= 2850 || camR <= 1550) return;

    if (!_cachedShoreGrad) {
      _cachedShoreGrad = ctx.createLinearGradient(1600, 1300, 1600, 1400);
      _cachedShoreGrad.addColorStop(0.0, 'rgba(28, 120, 180, 0.70)');
      _cachedShoreGrad.addColorStop(0.5, 'rgba(16, 85, 145, 0.82)');
      _cachedShoreGrad.addColorStop(1.0, 'rgba(8, 48, 92, 0.90)');

      _cachedDeepAbyssGrad = ctx.createLinearGradient(2200, 1315, 2200, 1400);
      _cachedDeepAbyssGrad.addColorStop(0.0, 'rgba(12, 55, 95, 0.75)');
      _cachedDeepAbyssGrad.addColorStop(0.3, 'rgba(6, 32, 65, 0.92)');
      _cachedDeepAbyssGrad.addColorStop(1.0, 'rgba(3, 14, 34, 0.98)');

      _cachedSurfGrad = ctx.createLinearGradient(1600, 1292, 1600, 1340);
      _cachedSurfGrad.addColorStop(0.0, 'rgba(96, 210, 255, 0.92)');
      _cachedSurfGrad.addColorStop(0.4, 'rgba(32, 150, 220, 0.75)');
      _cachedSurfGrad.addColorStop(1.0, 'rgba(16, 90, 160, 0.50)');
    }

    // A. Wypełnienie toni wodnej (płycizny przy brzegach i mroczna, śmiertelna głębia w środku)
    ctx.fillStyle = _cachedShoreGrad;
    ctx.fillRect(1600, 1300, 1200, 100);

    // Głęboki nurt centralny (X: 1750 do 2650) - głęboka toń śmiertelna
    ctx.fillStyle = _cachedDeepAbyssGrad;
    ctx.fillRect(1750, 1315, 900, 85);

    // B. Falująca powierzchnia rzeki
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(1600, 1300);
    const waveStep = 30;
    for (let wx = 1600; wx <= 2800; wx += waveStep) {
      const wave1 = Math.sin((wx * 0.022) + animTime * 2.8) * 5.5;
      const wave2 = Math.cos((wx * 0.011) - animTime * 1.9) * 3.5;
      ctx.lineTo(wx, 1300 + wave1 + wave2);
    }
    ctx.lineTo(2800, 1400);
    ctx.lineTo(1600, 1400);
    ctx.closePath();

    ctx.fillStyle = _cachedSurfGrad;
    ctx.fill();

    // C. Błyszczące refleksy piany na powierzchni rzeki (zgrupowane w 1 stroke)
    ctx.strokeStyle = 'rgba(200, 245, 255, 0.85)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let wx = 1630; wx < 2770; wx += 95) {
      const wy = 1300 + Math.sin((wx * 0.022) + animTime * 2.8) * 5.5;
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + 45, wy - 1);
    }
    ctx.stroke();

    // D. Bąbelki / piana w strefie wody (zgrupowane w 1 fill)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    for (let i = 0; i < WATER_RIPPLES.length; i++) {
      const rip = WATER_RIPPLES[i];
      const ry = rip.y + Math.sin(animTime * 2 + rip.phase) * 6;
      ctx.moveTo(rip.x + rip.r, ry);
      ctx.arc(rip.x, ry, rip.r, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();

    // E. Ostrzeżenie przed głębią rzeki (umieszczone centralnie w kanale)
    ctx.save();
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = 'rgba(239, 68, 68, 0.50)';
    ctx.textAlign = 'center';
    ctx.fillText('GŁĘBIA RZEKI (ŚMIERTELNA)', 2200, 1370);
    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // 3. DREWNIANE WIEŻE NOŚNE BRAMEK (X: 200 oraz X: 4200)
  // Fortyfikacje w stylu militarnej dżungli ze starożytnymi okuciami
  // -----------------------------------------------------------------------
  // -----------------------------------------------------------------------
  // 3. DREWNIANE WIEŻE NOŚNE (X: 185 oraz X: 4185)
  // Fortyfikacje w stylu militarnej dżungli z zniszczalnymi pilarami i podestami
  // -----------------------------------------------------------------------
  function drawAnchorBlock(ax) {
    if (ax + 50 < camL || ax - 50 > camR) return;
    ctx.save();
    // 1. Monolityczny blok kamienno-żelbetonowy wkopany w lity grunt (od Y: 1180 aż do spągu Y: 1400)
    const blockTopY = 1180;
    const blockBottomY = 1400;
    const blockW = 56;
    const blockLeft = ax - blockW / 2;
    const blockH = blockBottomY - blockTopY;

    // Prastary ciosany blok megalityczny z fazowaną koroną i klamrami
    drawWeatheredStoneMasonry(ctx, blockLeft, blockTopY, blockW, blockH, {
      courseHeight: 28,
      hasChamfer: true,
      hasCramps: true,
      seed: Math.floor(Math.abs(ax * 7)),
      mossTop: true
    });

    // Kute żelazne obejmy opasujące blok z nitami
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(blockLeft - 2, blockTopY + 16, blockW + 4, 10);
    ctx.fillRect(blockLeft - 2, blockTopY + 60, blockW + 4, 10);
    ctx.fillRect(blockLeft - 2, blockTopY + 110, blockW + 4, 10);
    ctx.fillRect(blockLeft - 2, blockTopY + 160, blockW + 4, 10);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(blockLeft - 2, blockTopY + 16, blockW + 4, 10);
    ctx.strokeRect(blockLeft - 2, blockTopY + 60, blockW + 4, 10);

    // Nity na obejmach
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(blockLeft, blockTopY + 19, 3, 4);
    ctx.fillRect(blockLeft + blockW - 3, blockTopY + 19, 3, 4);

    // Kuty ściągacz śrubowy (Turnbuckle) z naciętym gwintem i szeklą
    ctx.fillStyle = '#273444';
    ctx.fillRect(ax - 8, blockTopY - 26, 16, 26);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(ax - 8, blockTopY - 26, 16, 26);

    // Zwoje gwintu ściągacza
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.2;
    for (let ty = blockTopY - 23; ty <= blockTopY - 11; ty += 3.5) {
      ctx.beginPath();
      ctx.moveTo(ax - 6, ty);
      ctx.lineTo(ax + 6, ty);
      ctx.stroke();
    }

    // Ucho szekli z otworem na kauszę liny nośnej
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(ax, blockTopY - 14, 4.2, 0, Math.PI * 2);
    ctx.fill();

    // Zaciek rdzy spływający ze stalowego mocowania na lico kamienia
    ctx.fillStyle = 'rgba(146, 64, 14, 0.45)';
    ctx.fillRect(ax - 2.5, blockTopY, 5, 16);

    ctx.restore();
  }

  function drawTowerStructure(isLeft) {
    const sideKey = isLeft ? 'left' : 'right';
    const pillar = ARENA_3_TOWER_PILLARS[sideKey];
    const tx = isLeft ? 185 : 4185;
    const tw = 30;
    const ty = 600;
    const th = 600;
    if (tx + tw + 160 < camL || tx - 160 > camR) return;

    ctx.save();
    // A. Kamienno-betonowa podstawa i fundament w głąb gruntu (od Y: 1140 aż do Y: 1400)
    const stoneTopY = ty + th - 60; // 1140
    const stoneBottomY = 1400;
    const stoneH = stoneBottomY - stoneTopY;

    // Prastary ciosany cokół kamienny fundamentu wieży
    drawWeatheredStoneMasonry(ctx, tx - 12, stoneTopY, tw + 24, stoneH, {
      courseHeight: 26,
      hasChamfer: true,
      hasCramps: true,
      seed: isLeft ? 17 : 83,
      mossTop: true
    });

    if (pillar && pillar.intact) {
      // B. Główny pionowy drewniany słup (filar z bali tekowych w estetyce postarzałej)
      const dmgRatio = 1 - (pillar.hp / pillar.maxHp);
      drawWeatheredTimberPost(ctx, tx, ty, tw, th, {
        bandInterval: 80,
        damageRatio: dmgRatio,
        seed: isLeft ? 29 : 71
      });
    } else if (pillar) {
      // ZAWALONY FILAR WIEŻY (PO ZNISZCZENIU)
      // A. Wyszczerbiony, postrzępiony kikut przy fundamencie
      ctx.save();
      ctx.fillStyle = '#2d1807';
      ctx.beginPath();
      ctx.moveTo(tx - 10, ty + th - 60);
      ctx.lineTo(tx - 10, ty + th - 95);
      ctx.lineTo(tx - 3, ty + th - 120);
      ctx.lineTo(tx + 5, ty + th - 90);
      ctx.lineTo(tx + 14, ty + th - 130);
      ctx.lineTo(tx + 22, ty + th - 85);
      ctx.lineTo(tx + tw + 10, ty + th - 105);
      ctx.lineTo(tx + tw + 10, ty + th - 60);
      ctx.closePath();
      ctx.fill();

      // Ciemne zwęglenie przełomu
      ctx.fillStyle = 'rgba(8, 4, 1, 0.85)';
      ctx.beginPath();
      ctx.moveTo(tx - 8, ty + th - 80);
      ctx.lineTo(tx + 14, ty + th - 120);
      ctx.lineTo(tx + tw + 8, ty + th - 75);
      ctx.lineTo(tx + tw + 5, ty + th - 60);
      ctx.lineTo(tx - 5, ty + th - 60);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#0c0501';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();

      // B. Przechylony i powalony na ziemię potężny pień słupa ze zgiętymi okuciami
      const dropY = pillar.fallDropY || 0;
      const isL = (sideKey === 'left');
      const shiftX = isL ? dropY * 0.4 : -dropY * 0.4;
      ctx.save();
      ctx.translate(tx + tw / 2 + shiftX, ty + th - 70 + dropY);
      ctx.rotate(pillar.tiltAngle);

      const logLen = th - 90;
      ctx.beginPath();
      ctx.moveTo(-tw / 2, -logLen);
      ctx.lineTo(-tw / 2 + 6, -logLen - 12);
      ctx.lineTo(0, -logLen - 4);
      ctx.lineTo(tw / 2 - 4, -logLen - 15);
      ctx.lineTo(tw / 2, -logLen);
      ctx.lineTo(tw / 2, 0);
      ctx.lineTo(tw / 2 - 6, 14);
      ctx.lineTo(0, 5);
      ctx.lineTo(-tw / 2 + 5, 18);
      ctx.lineTo(-tw / 2, 0);
      ctx.closePath();

      ctx.fillStyle = '#3b220e';
      ctx.fill();

      ctx.strokeStyle = '#120702';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Pęknięcia wzdłużne i rozwarstwienia
      ctx.strokeStyle = '#0a0401';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-tw * 0.2, -logLen + 30);
      ctx.lineTo(-tw * 0.1, -logLen * 0.5);
      ctx.lineTo(tw * 0.2, -30);
      ctx.moveTo(tw * 0.25, -logLen + 60);
      ctx.lineTo(tw * 0.15, -logLen * 0.3);
      ctx.stroke();

      // Wygięte pasy kute z nitami
      for (let my = -logLen + 70; my < -30; my += 110) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(-tw / 2 - 4, my, tw + 8, 10);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(-tw / 2 - 4, my, tw + 8, 10);

        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-tw / 2 - 2, my + 2.5, 3, 5);
        ctx.fillRect(tw / 2 - 1, my + 2.5, 3, 5);
      }

      ctx.restore();
    }

    // F. Pomost inspekcyjny dolny przy wieży (Y: 600) - RYSOWANY Z MODUŁOWYCH BLOKÓW
    const lowerBlocks = ARENA_3_TOWER_BLOCKS.filter(b => b.side === sideKey && b.tier === 'lower');
    for (let i = 0; i < lowerBlocks.length; i++) {
      const b = lowerBlocks[i];
      if (b.vanished || b.isDead || b._removedFromPlatforms) continue;
      if (b.x + b.w + 30 < camL || b.x - 30 > camR) continue;
      if (!b.intact && (b.y > 1400 || b.y + b.h + 20 < camT || b.y - 20 > camB)) continue;

      ctx.save();
      if (!b.intact && b.landDecay > 0) {
        ctx.globalAlpha = Math.max(0, 1 - (b.landDecay / 45));
      }
      if (b.intact) {
        const dmgRatio = 1 - (b.hp / b.maxHp);
        drawWeatheredTimberDeck(ctx, b.x, b.y, b.w, b.h, {
          seed: i * 37 + (isLeft ? 5 : 75),
          damageRatio: dmgRatio,
          plankCount: 2,
          hasGouges: true,
          hasMetal: true,
          hasMoss: true,
          animTime
        });

        // Drewniany zastrzał wsporczy podestu (corbel bracket) do głównego słupa
        ctx.strokeStyle = '#38200b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        const corbelStartX = b.x + b.w * 0.5;
        ctx.moveTo(corbelStartX, b.y + b.h);
        ctx.lineTo(tx + tw * 0.5, b.y + b.h + 36);
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(corbelStartX - 2, b.y + b.h - 1, 4, 4);
      } else {
        // Zniszczona belka pomostu w powietrzu lub w wodzie
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        drawSplinteredWoodRubble(ctx, cx, cy, b.w, b.h, b.angle, { seed: i * 37 });
      }
      ctx.restore();
    }

    // Podpory pomostu od dołu (drewniane zastrzały)


    ctx.restore();
  }



  // =========================================================================
  // WARSTWA 1: FUNDAMENTY, GŁĘBOKIE SŁUPY I KESONY ZANURZONE W ZIEMI I WODZIE
  // Rysowane PRZED podłożem i wodą - przykrywane przez nienaruszony grunt i wodę,
  // a odsłaniane w wybuchach po zniszczeniu ziemi (kratery) lub w toni rzeki!
  // =========================================================================

  // 1A. Monolityczne żelbetowe bloki kotwiące (X: 1140 oraz X: 3260)
  drawAnchorBlock(anchorLeftX);
  drawAnchorBlock(anchorRightX);

  // 1B. Główne pionowe słupy i kamienne cokoły wież (X: 185 oraz X: 4185)
  drawTowerStructure(true);
  drawTowerStructure(false);

  // 1C. Pylony mostu (wieże A-frame oraz masywne podwodne kesony fundamentowe)
  drawBridgePylon('left');
  drawBridgePylon('right');

  // 1D. Drewniane pale nośne ramp podejściowych zakotwiczone w głąb gruntu
  drawGentleApproachStilts(true);
  drawGentleApproachStilts(false);

  // =========================================================================
  // WARSTWA 2: LITOBRAZALTOWE PODŁOŻE DŻUNGLI I ZAROŚNIĘTE SKARPY
  // Przykrywa podziemne części fundamentów, słupów i kesonów.
  // Gdy wybuch tworzy krater, odsłania ukryte w ziemi struktury!
  // =========================================================================
  if (camL < 1850 && camR > -50) {
    drawBasaltRiverCliff(true, leftOvalPoints);
  }
  if (camL < 4450 && camR > 2600) {
    drawBasaltRiverCliff(false, rightOvalPoints);
  }

  // =========================================================================
  // WARSTWA 3: STREFA WODY - RZEKA I GŁĘBIA ŚMIERTELNA (X: 1600 do 2800)
  // Przykrywa podwodne części kesonów, kamieni i głębi rzeki
  // =========================================================================
  drawRiverWaterZone();

  // =========================================================================
  // WARSTWA 4: POMOSTY, KŁADKI RAMP, GNIAZDA OBSERWACYJNE I LINY NOŚNE
  // =========================================================================
  drawGentleBridgeApproach(true);
  drawGentleBridgeApproach(false);

  // -----------------------------------------------------------------------
  // 4. WOJSKOWE WIEŻE OBSERWACYJNE I GNIAZDA SNAJPERSKIE (X: 200 oraz X: 4200)
  // Zniszczalne gniazda snajperskie na Y: 400 z modularnymi podestami
  // -----------------------------------------------------------------------
  function renderIntactTowerToBuffer(targetCtx, isLeft) {
    const sideKey = isLeft ? 'left' : 'right';
    const cx = isLeft ? 200 : 4200;
    const stemX = isLeft ? 185 : 4185;
    const deckX = isLeft ? 100 : 4100;
    const deckY = 400;
    const deckW = 200;

    targetCtx.save();
    targetCtx.translate(-(deckX - 30), -260);

    const teamCol = isLeft ? '#06b6d4' : '#f97316';
    const teamName = isLeft ? 'FORTRESS ALPHA' : 'OUTPOST BRAVO';

    // A. Przedłużenie słupów wieży w górę
    drawWeatheredTimberPost(targetCtx, stemX, 400, 30, 200, {
      bandInterval: 50,
      seed: isLeft ? 43 : 89
    });

    // Drabina drewniana
    const ladderX = isLeft ? 150 : 4230;
    targetCtx.strokeStyle = '#2c1808';
    targetCtx.lineWidth = 4;
    targetCtx.beginPath();
    targetCtx.moveTo(ladderX, 420);
    targetCtx.lineTo(ladderX, 600);
    targetCtx.moveTo(ladderX + 16, 420);
    targetCtx.lineTo(ladderX + 16, 600);
    targetCtx.stroke();

    targetCtx.strokeStyle = 'rgba(215, 175, 95, 0.45)';
    targetCtx.lineWidth = 1.0;
    targetCtx.beginPath();
    targetCtx.moveTo(ladderX + 1, 420);
    targetCtx.lineTo(ladderX + 1, 600);
    targetCtx.stroke();

    // Szczeble drabiny
    for (let ly = 435; ly < 595; ly += 18) {
      targetCtx.strokeStyle = '#4e2f12';
      targetCtx.lineWidth = 3;
      targetCtx.beginPath();
      targetCtx.moveTo(ladderX, ly);
      targetCtx.lineTo(ladderX + 16, ly);
      targetCtx.stroke();

      targetCtx.strokeStyle = 'rgba(215, 175, 95, 0.65)';
      targetCtx.lineWidth = 1.2;
      targetCtx.beginPath();
      targetCtx.moveTo(ladderX + 4, ly - 0.5);
      targetCtx.lineTo(ladderX + 12, ly - 0.5);
      targetCtx.stroke();

      targetCtx.fillStyle = '#0f172a';
      targetCtx.fillRect(ladderX + 1, ly - 1, 1.5, 1.5);
      targetCtx.fillRect(ladderX + 13.5, ly - 1, 1.5, 1.5);
    }

    // Podłoga i balustrada gniazda snajperskiego
    const upperBlocks = isLeft
      ? ARENA_3_TOWER_BLOCKS.filter(b => b.side === 'left' && b.tier === 'upper')
      : ARENA_3_TOWER_BLOCKS.filter(b => b.side === 'right' && b.tier === 'upper');

    for (let i = 0; i < upperBlocks.length; i++) {
      const b = upperBlocks[i];
      drawWeatheredTimberDeck(targetCtx, b.x, b.y, b.w, b.h, {
        seed: i * 43 + (isLeft ? 7 : 63),
        damageRatio: 0,
        plankCount: 2,
        hasGouges: true,
        hasMetal: true,
        hasMoss: true,
        animTime: 0
      });
      drawWeatheredBalustrade(targetCtx, b.x + 2, b.y - 30, b.w - 4, 30, {
        seed: i * 19,
        slitW: 18,
        slitH: 12
      });
    }

    // E. Słupy zadaszenia i maskująca płachta taktyczna
    targetCtx.strokeStyle = '#2d1808';
    targetCtx.lineWidth = 5;
    targetCtx.beginPath();
    targetCtx.moveTo(deckX + 14, deckY - 32);
    targetCtx.lineTo(deckX + 14, deckY - 75);
    targetCtx.moveTo(deckX + deckW - 14, deckY - 32);
    targetCtx.lineTo(deckX + deckW - 14, deckY - 75);
    targetCtx.stroke();

    targetCtx.fillStyle = '#1e293b';
    targetCtx.fillRect(deckX + 11, deckY - 50, 6, 7);
    targetCtx.fillRect(deckX + deckW - 17, deckY - 50, 6, 7);

    targetCtx.fillStyle = '#223815';
    targetCtx.beginPath();
    targetCtx.moveTo(deckX - 8, deckY - 70);
    targetCtx.lineTo(deckX + deckW * 0.5, deckY - 85);
    targetCtx.lineTo(deckX + deckW + 8, deckY - 70);
    targetCtx.lineTo(deckX + deckW + 2, deckY - 75);
    targetCtx.lineTo(deckX + deckW * 0.5, deckY - 78);
    targetCtx.lineTo(deckX - 2, deckY - 75);
    targetCtx.closePath();
    targetCtx.fill();

    targetCtx.fillStyle = '#304d1e';
    for (let cxX = deckX; cxX < deckX + deckW; cxX += 16) {
      targetCtx.fillRect(cxX, deckY - 70, 8, 5);
    }
    targetCtx.strokeStyle = '#12200a';
    targetCtx.lineWidth = 1.6;
    targetCtx.stroke();

    // F. Maszt radiowy łączności wojskowej
    const antX = isLeft ? (deckX + 18) : (deckX + deckW - 18);
    targetCtx.strokeStyle = '#64748b';
    targetCtx.lineWidth = 2.5;
    targetCtx.beginPath();
    targetCtx.moveTo(antX, deckY - 75);
    targetCtx.lineTo(antX, deckY - 120);
    targetCtx.stroke();

    targetCtx.strokeStyle = '#94a3b8';
    targetCtx.lineWidth = 1.5;
    targetCtx.beginPath();
    targetCtx.moveTo(antX - 8, deckY - 110);
    targetCtx.lineTo(antX + 8, deckY - 110);
    targetCtx.moveTo(antX - 5, deckY - 100);
    targetCtx.lineTo(antX + 5, deckY - 100);
    targetCtx.stroke();

    // G. Tablica informacyjna bazy
    const signW = 120;
    const signH = 18;
    const signX = cx - signW / 2;
    const signY = deckY - 26;

    targetCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    targetCtx.fillRect(signX, signY, signW, signH);
    targetCtx.strokeStyle = teamCol;
    targetCtx.lineWidth = 1.4;
    targetCtx.strokeRect(signX, signY, signW, signH);

    targetCtx.font = '900 9.5px monospace';
    targetCtx.fillStyle = teamCol;
    targetCtx.textAlign = 'center';
    targetCtx.fillText(teamName, cx, signY + 12);

    targetCtx.restore();
  }

  function drawTowerRoofDecorations(targetCtx, deckX, deckY, deckW, teamCol, teamName, cx, isLeft, animTime = 0) {
    // E. Słupy zadaszenia i maskująca płachta taktyczna (Camo Netting)
    targetCtx.strokeStyle = '#2d1808';
    targetCtx.lineWidth = 5;
    targetCtx.beginPath();
    targetCtx.moveTo(deckX + 14, deckY - 32);
    targetCtx.lineTo(deckX + 14, deckY - 75);
    targetCtx.moveTo(deckX + deckW - 14, deckY - 32);
    targetCtx.lineTo(deckX + deckW - 14, deckY - 75);
    targetCtx.stroke();

    // Kute żelazne obejmy krokwi
    targetCtx.fillStyle = '#1e293b';
    targetCtx.fillRect(deckX + 11, deckY - 50, 6, 7);
    targetCtx.fillRect(deckX + deckW - 17, deckY - 50, 6, 7);

    // Daszek cieniujący z poszarpaną krawędzią siatki maskującej
    targetCtx.fillStyle = '#223815';
    targetCtx.beginPath();
    targetCtx.moveTo(deckX - 8, deckY - 70);
    targetCtx.lineTo(deckX + deckW * 0.5, deckY - 85);
    targetCtx.lineTo(deckX + deckW + 8, deckY - 70);
    targetCtx.lineTo(deckX + deckW + 2, deckY - 75);
    targetCtx.lineTo(deckX + deckW * 0.5, deckY - 78);
    targetCtx.lineTo(deckX - 2, deckY - 75);
    targetCtx.closePath();
    targetCtx.fill();

    // Poszarpane zwisające strzępy tkaniny kamuflażowej
    targetCtx.fillStyle = '#304d1e';
    for (let cxX = deckX; cxX < deckX + deckW; cxX += 16) {
      const tLen = 4 + (Math.sin(cxX * 0.3 + animTime * 2.0) * 3);
      targetCtx.fillRect(cxX, deckY - 70, 8, tLen);
    }
    targetCtx.strokeStyle = '#12200a';
    targetCtx.lineWidth = 1.6;
    targetCtx.stroke();

    // F. Maszt radiowy łączności wojskowej z pulsującą czerwoną diodą
    const antX = isLeft ? (deckX + 18) : (deckX + deckW - 18);
    targetCtx.strokeStyle = '#64748b';
    targetCtx.lineWidth = 2.5;
    targetCtx.beginPath();
    targetCtx.moveTo(antX, deckY - 75);
    targetCtx.lineTo(antX, deckY - 120);
    targetCtx.stroke();

    targetCtx.strokeStyle = '#94a3b8';
    targetCtx.lineWidth = 1.5;
    targetCtx.beginPath();
    targetCtx.moveTo(antX - 8, deckY - 110);
    targetCtx.lineTo(antX + 8, deckY - 110);
    targetCtx.moveTo(antX - 5, deckY - 100);
    targetCtx.lineTo(antX + 5, deckY - 100);
    targetCtx.stroke();

    const bBlink = (Math.sin(animTime * 6.0) > 0);
    targetCtx.fillStyle = bBlink ? '#ef4444' : '#500707';
    targetCtx.beginPath();
    targetCtx.arc(antX, deckY - 121, 3.2, 0, Math.PI * 2);
    targetCtx.fill();
    if (bBlink) {
      targetCtx.fillStyle = '#ffffff';
      targetCtx.beginPath();
      targetCtx.arc(antX, deckY - 121, 1.2, 0, Math.PI * 2);
      targetCtx.fill();
    }

    // G. Tablica informacyjna bazy
    const signW = 120;
    const signH = 18;
    const signX = cx - signW / 2;
    const signY = deckY - 26;

    targetCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    targetCtx.fillRect(signX, signY, signW, signH);
    targetCtx.strokeStyle = teamCol;
    targetCtx.lineWidth = 1.4;
    targetCtx.strokeRect(signX, signY, signW, signH);

    targetCtx.font = '900 9.5px monospace';
    targetCtx.fillStyle = teamCol;
    targetCtx.textAlign = 'center';
    targetCtx.fillText(teamName, cx, signY + 12);
  }

  function drawWatchtowerSniperNest(isLeft) {
    const sideKey = isLeft ? 'left' : 'right';
    const pillar = ARENA_3_TOWER_PILLARS[sideKey];
    const cx = isLeft ? 200 : 4200;
    const stemX = isLeft ? 185 : 4185;
    const deckX = isLeft ? 100 : 4100;
    const deckY = 400;
    const deckW = 200;
    const deckH = 22;

    if (cx + 250 < camL || cx - 250 > camR) return;

    const upperBlocks = isLeft
      ? (_cachedUpperTowerBlocksLeft || (_cachedUpperTowerBlocksLeft = ARENA_3_TOWER_BLOCKS.filter(b => b.side === 'left' && b.tier === 'upper')))
      : (_cachedUpperTowerBlocksRight || (_cachedUpperTowerBlocksRight = ARENA_3_TOWER_BLOCKS.filter(b => b.side === 'right' && b.tier === 'upper')));

    const allBlocks = isLeft
      ? ARENA_3_TOWER_BLOCKS.filter(b => b.side === 'left')
      : ARENA_3_TOWER_BLOCKS.filter(b => b.side === 'right');
    const isIntact = pillar && pillar.intact && (pillar.hp >= pillar.maxHp) && allBlocks.every(b => b.intact && b.hp >= b.maxHp);
    if (!isIntact) {
      if (isLeft) _cachedLeftTowerCanvas = null;
      else _cachedRightTowerCanvas = null;
    }
    if (isIntact && typeof document !== 'undefined') {
      let towerCanvas = isLeft ? _cachedLeftTowerCanvas : _cachedRightTowerCanvas;
      if (!towerCanvas) {
        towerCanvas = document.createElement('canvas');
        towerCanvas.width = 260;
        towerCanvas.height = 360;
        const tCtx = towerCanvas.getContext('2d');
        if (tCtx) renderIntactTowerToBuffer(tCtx, isLeft);
        if (isLeft) _cachedLeftTowerCanvas = towerCanvas;
        else _cachedRightTowerCanvas = towerCanvas;
      }
      if (towerCanvas) {
        ctx.drawImage(towerCanvas, deckX - 30, 260);

        // Pulsująca czerwona dioda na antenie łączności
        const antX = isLeft ? (deckX + 18) : (deckX + deckW - 18);
        const bBlink = (Math.sin(animTime * 6.0) > 0);
        ctx.fillStyle = bBlink ? '#ef4444' : '#500707';
        ctx.beginPath();
        ctx.arc(antX, deckY - 121, 3.2, 0, Math.PI * 2);
        ctx.fill();
        if (bBlink) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(antX, deckY - 121, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        return;
      }
    }

    ctx.save();
    const teamCol = isLeft ? '#06b6d4' : '#f97316';
    const teamName = isLeft ? 'FORTRESS ALPHA' : 'OUTPOST BRAVO';

    if (pillar && pillar.intact) {
      // A. Przedłużenie słupów wieży w górę (od Y: 600 do 400) w estetyce postarzałego drewna
      drawWeatheredTimberPost(ctx, stemX, 400, 30, 200, {
        bandInterval: 50,
        seed: isLeft ? 43 : 89
      });

      // Drabina drewniana łącząca dolny pomost Y: 600 z górnym pomostem Y: 400
      const ladderX = isLeft ? 150 : 4230;
      ctx.strokeStyle = '#2c1808';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(ladderX, 420);
      ctx.lineTo(ladderX, 600);
      ctx.moveTo(ladderX + 16, 420);
      ctx.lineTo(ladderX + 16, 600);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(215, 175, 95, 0.45)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(ladderX + 1, 420);
      ctx.lineTo(ladderX + 1, 600);
      ctx.stroke();

      // Szczeble drabiny z wytartym środkiem i kowalskimi gwoździami
      for (let ly = 435; ly < 595; ly += 18) {
        ctx.strokeStyle = '#4e2f12';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ladderX, ly);
        ctx.lineTo(ladderX + 16, ly);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(215, 175, 95, 0.65)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(ladderX + 4, ly - 0.5);
        ctx.lineTo(ladderX + 12, ly - 0.5);
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(ladderX + 1, ly - 1, 1.5, 1.5);
        ctx.fillRect(ladderX + 13.5, ly - 1, 1.5, 1.5);
      }
    }

    // C. MODUŁOWE PŁYTY PODŁOGOWE GNIAZDA SNAJPERSKIEGO (Y: 400)
    for (let i = 0; i < upperBlocks.length; i++) {
      const b = upperBlocks[i];
      if (b.vanished || b.isDead || b._removedFromPlatforms) continue;
      if (b.x + b.w + 30 < camL || b.x - 30 > camR) continue;
      if (!b.intact && (b.y > 1400 || b.y + b.h + 20 < camT || b.y - 20 > camB)) continue;

      ctx.save();
      if (!b.intact && b.landDecay > 0) {
        ctx.globalAlpha = Math.max(0, 1 - (b.landDecay / 45));
      }
      if (b.intact) {
        const dmgRatio = 1 - (b.hp / b.maxHp);
        // Podłoga gniazda snajperskiego
        drawWeatheredTimberDeck(ctx, b.x, b.y, b.w, b.h, {
          seed: i * 43 + (isLeft ? 7 : 63),
          damageRatio: dmgRatio,
          plankCount: 2,
          hasGouges: true,
          hasMetal: true,
          hasMoss: true,
          animTime
        });

        // D. Balustrada obronna z otworem strzelniczym i pancerzem
        drawWeatheredBalustrade(ctx, b.x + 2, b.y - 30, b.w - 4, 30, {
          seed: i * 19,
          slitW: 18,
          slitH: 12
        });
      } else {
        // Odłamany segment podestu gniazda snajperskiego ze szczątkami balustrady
        const cxBlock = b.x + b.w / 2;
        const cyBlock = b.y + b.h / 2;
        drawSplinteredWoodRubble(ctx, cxBlock, cyBlock, b.w, b.h, b.angle, { seed: i * 43 });
      }
      ctx.restore();
    }

    const hasIntactUpper = upperBlocks.some(b => b.intact);
    const roof = ARENA_3_TOWER_ROOFS ? ARENA_3_TOWER_ROOFS[sideKey] : null;

    if (pillar && pillar.intact && hasIntactUpper && (!roof || roof.intact)) {
      drawTowerRoofDecorations(ctx, deckX, deckY, deckW, teamCol, teamName, cx, isLeft, animTime);
    } else if (roof && !roof.intact && !roof.vanished) {
      ctx.save();
      if (roof.landDecay > 0) {
        ctx.globalAlpha = Math.max(0, 1 - (roof.landDecay / 45));
      }
      const rcx = roof.x + roof.w * 0.5;
      const rcy = roof.y + roof.h * 0.5;
      ctx.translate(rcx, rcy);
      ctx.rotate(roof.angle);
      drawTowerRoofDecorations(ctx, -roof.w * 0.5, 30, roof.w, teamCol, teamName, 0, isLeft, animTime);
      ctx.restore();
    }

    ctx.restore();
  }

  drawWatchtowerSniperNest(true);
  drawWatchtowerSniperNest(false);

  // -----------------------------------------------------------------------
  // 5. GŁÓWNE PLATFORMY SNAJPERSKIE (X: 600-1000 ORAZ X: 3400-3800, Y: 800)
  // Zniszczalne modułowe płyty skalne dolomitowe porośnięte dżunglą
  // -----------------------------------------------------------------------
  function drawSniperSlabs() {
    for (let i = 0; i < ARENA_3_SNIPER_SLABS.length; i++) {
      const slab = ARENA_3_SNIPER_SLABS[i];
      if (slab.vanished || slab.isDead || slab._removedFromPlatforms) continue;
      if (slab.x + slab.w + 50 < camL || slab.x - 50 > camR) continue;
      if (!slab.intact && (slab.y > 1400 || slab.y + slab.h + 20 < camT || slab.y - 20 > camB)) continue;

      ctx.save();
      if (!slab.intact && slab.landDecay > 0) {
        ctx.globalAlpha = Math.max(0, 1 - (slab.landDecay / 45));
      }
      if (slab.intact) {
        const px = slab.x;
        const py = slab.y;
        const pw = slab.w;
        const ph = slab.h;
        const dmgRatio = 1 - (slab.hp / slab.maxHp);

        // Naturalna ciosana półka skalna bazaltowo-dolomitowa w estetyce ruin
        drawWeatheredStoneMasonry(ctx, px, py, pw, ph, {
          courseHeight: Math.min(22, ph),
          hasChamfer: true,
          hasCramps: true,
          damageRatio: dmgRatio,
          seed: i * 53,
          mossTop: true
        });

        // Reliefy prastarych ruin wojskowych na czole skały
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fillRect(px + 8, py + 14, pw - 16, Math.max(4, ph - 22));

        // Kute żelazne kotwy skalne spinające blok z macierzystym klifem
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px + 4, py + 6, 6, 8);
        ctx.fillRect(px + pw - 10, py + 6, 6, 8);
        ctx.fillStyle = 'rgba(146, 64, 14, 0.50)';
        ctx.fillRect(px + 6, py + 14, 2, 7);
        ctx.fillRect(px + pw - 8, py + 14, 2, 7);
      } else {
        // Zniszczona płyta skalna - ostry łupany głaz dolomitowy
        drawSplinteredRockSlab(ctx, slab);
      }
      ctx.restore();
    }
  }

  drawSniperSlabs();

  // -----------------------------------------------------------------------
  // 6. WISZĄCY MOST (X: 1750 do 2650, Y: 1000)
  // Potężne pylony kotwiczące i wiszące przęsło rozpięte bezpośrednio nad rzeką
  // -----------------------------------------------------------------------
  const bridgeX1 = 1750;
  const bridgeX2 = 2650;
  const bridgeY = 1000;

  // A. PYLONY NOŚNE MOSTU (Drewniano-kamienne wieże bramowe na brzegach rzeki)
  function renderIntactPylonToBuffer(targetCtx, pylonKey) {
    const p = ARENA_3_PYLONS[pylonKey];
    if (!p) return;
    const px = p.x;
    const caissonTopY = 1100;
    const caissonBottomY = 1395;
    const caissonW = 62;
    const caissonLeft = px - caissonW / 2;

    targetCtx.save();
    targetCtx.translate(-(px - 40), -830);

    // 1. Potężny kamienny keson
    drawWeatheredStoneMasonry(targetCtx, caissonLeft, caissonTopY, caissonW, caissonBottomY - caissonTopY, {
      courseHeight: 32,
      waterLineY: 1300,
      hasChamfer: true,
      hasCramps: true,
      seed: (pylonKey === 'left' ? 31 : 67),
      mossTop: true
    });

    // Pancerne kute stalowe obejmy
    targetCtx.fillStyle = '#1e293b';
    targetCtx.fillRect(caissonLeft - 2, 1130, caissonW + 4, 10);
    targetCtx.fillRect(caissonLeft - 2, 1210, caissonW + 4, 10);
    targetCtx.fillRect(caissonLeft - 2, 1290, caissonW + 4, 12);
    targetCtx.fillRect(caissonLeft - 2, 1345, caissonW + 4, 12);

    targetCtx.strokeStyle = '#0f172a';
    targetCtx.lineWidth = 1.4;
    targetCtx.strokeRect(caissonLeft - 2, 1130, caissonW + 4, 10);
    targetCtx.strokeRect(caissonLeft - 2, 1210, caissonW + 4, 10);

    // Nity
    targetCtx.fillStyle = '#94a3b8';
    targetCtx.fillRect(caissonLeft, 1133, 3, 4);
    targetCtx.fillRect(caissonLeft + caissonW - 3, 1133, 3, 4);
    targetCtx.fillRect(caissonLeft, 1213, 3, 4);
    targetCtx.fillRect(caissonLeft + caissonW - 3, 1213, 3, 4);

    // 2. Masywne pionowe słupy pylonu
    drawWeatheredTimberPost(targetCtx, px - 24, pylonTopY, 18, caissonTopY - pylonTopY, {
      bandInterval: 75,
      damageRatio: 0,
      seed: (pylonKey === 'left' ? 13 : 47)
    });
    drawWeatheredTimberPost(targetCtx, px + 6, pylonTopY, 18, caissonTopY - pylonTopY, {
      bandInterval: 75,
      damageRatio: 0,
      seed: (pylonKey === 'left' ? 27 : 59)
    });

    // Krzyżowe rygle wzmacniające
    targetCtx.strokeStyle = '#38200c';
    targetCtx.lineWidth = 6;
    for (let crossY = pylonTopY + 40; crossY < caissonTopY - 20; crossY += 75) {
      targetCtx.beginPath();
      targetCtx.moveTo(px - 20, crossY);
      targetCtx.lineTo(px + 20, crossY + 60);
      targetCtx.moveTo(px + 20, crossY);
      targetCtx.lineTo(px - 20, crossY + 60);
      targetCtx.stroke();

      targetCtx.strokeStyle = 'rgba(215, 175, 95, 0.40)';
      targetCtx.lineWidth = 1.0;
      targetCtx.beginPath();
      targetCtx.moveTo(px - 19, crossY - 1);
      targetCtx.lineTo(px + 19, crossY + 59);
      targetCtx.stroke();

      targetCtx.fillStyle = '#222d3d';
      targetCtx.fillRect(px - 26, crossY - 4, 52, 9);
      targetCtx.strokeStyle = '#0f172a';
      targetCtx.lineWidth = 1.2;
      targetCtx.strokeRect(px - 26, crossY - 4, 52, 9);

      targetCtx.fillStyle = '#94a3b8';
      targetCtx.fillRect(px - 24, crossY - 2, 3, 4);
      targetCtx.fillRect(px + 21, crossY - 2, 3, 4);
      targetCtx.fillRect(px - 2, crossY - 2, 4, 4);
    }

    // 3. Szczyt pylonu: siodło linowe
    targetCtx.fillStyle = '#1c2430';
    targetCtx.fillRect(px - 30, pylonTopY - 14, 60, 16);
    targetCtx.strokeStyle = '#0b1017';
    targetCtx.lineWidth = 2;
    targetCtx.strokeRect(px - 30, pylonTopY - 14, 60, 16);

    targetCtx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    targetCtx.lineWidth = 1.2;
    targetCtx.beginPath();
    targetCtx.moveTo(px - 29, pylonTopY - 13);
    targetCtx.lineTo(px + 29, pylonTopY - 13);
    targetCtx.stroke();

    targetCtx.fillStyle = '#475569';
    targetCtx.beginPath();
    targetCtx.arc(px - 10, pylonTopY - 6, 7, 0, Math.PI * 2);
    targetCtx.arc(px + 10, pylonTopY - 6, 7, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.strokeStyle = '#0f172a';
    targetCtx.lineWidth = 1.5;
    targetCtx.stroke();

    targetCtx.fillStyle = '#0f172a';
    targetCtx.beginPath();
    targetCtx.arc(px - 10, pylonTopY - 6, 3, 0, Math.PI * 2);
    targetCtx.arc(px + 10, pylonTopY - 6, 3, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.restore();
  }

  function drawBridgePylon(pylonKey) {
    const p = ARENA_3_PYLONS[pylonKey];
    if (!p) return;
    const px = p.x;
    if (px + 90 < camL || px - 90 > camR) return;

    if (p.intact && p.hp === p.maxHp && typeof document !== 'undefined') {
      let pylonCanvas = (pylonKey === 'left') ? _cachedPylonLeftCanvas : _cachedPylonRightCanvas;
      if (!pylonCanvas) {
        pylonCanvas = document.createElement('canvas');
        pylonCanvas.width = 80;
        pylonCanvas.height = 575;
        const pCtx = pylonCanvas.getContext('2d');
        if (pCtx) {
          renderIntactPylonToBuffer(pCtx, pylonKey);
        }
        if (pylonKey === 'left') _cachedPylonLeftCanvas = pylonCanvas;
        else _cachedPylonRightCanvas = pylonCanvas;
      }
      if (pylonCanvas) {
        ctx.drawImage(pylonCanvas, px - 40, 830);
        return;
      }
    }

    ctx.save();
    // 1. Potężny kamienny keson / filar fundamentowy (Y: 1100 aż do litego dna rzeki Y: 1395)
    // Osadzony głęboko w litym dnie rzeki - NIGDY NIE LEWITUJE W POWIETRZU!
    const caissonTopY = 1100;
    const caissonBottomY = 1395;
    const caissonW = 62;
    const caissonLeft = px - caissonW / 2;

    // Prastary ciosany keson z ciemnego kamienia ze strefą zanurzenia i glonami
    drawWeatheredStoneMasonry(ctx, caissonLeft, caissonTopY, caissonW, caissonBottomY - caissonTopY, {
      courseHeight: 32,
      waterLineY: 1300,
      hasChamfer: true,
      hasCramps: true,
      seed: (pylonKey === 'left' ? 31 : 67),
      mossTop: true
    });

    // Pancerne kute stalowe obejmy ostrogi kesonu
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(caissonLeft - 2, 1130, caissonW + 4, 10);
    ctx.fillRect(caissonLeft - 2, 1210, caissonW + 4, 10);
    ctx.fillRect(caissonLeft - 2, 1290, caissonW + 4, 12);
    ctx.fillRect(caissonLeft - 2, 1345, caissonW + 4, 12);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(caissonLeft - 2, 1130, caissonW + 4, 10);
    ctx.strokeRect(caissonLeft - 2, 1210, caissonW + 4, 10);

    // Kute nity na obejmach
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(caissonLeft, 1133, 3, 4);
    ctx.fillRect(caissonLeft + caissonW - 3, 1133, 3, 4);
    ctx.fillRect(caissonLeft, 1213, 3, 4);
    ctx.fillRect(caissonLeft + caissonW - 3, 1213, 3, 4);

    if (p.intact) {
      const dmgRatio = 1 - (p.hp / p.maxHp);
      // 2. Masywne pionowe słupy pylonu (A-frame z belek tekowych od 850 do 1100)
      drawWeatheredTimberPost(ctx, px - 24, pylonTopY, 18, caissonTopY - pylonTopY, {
        bandInterval: 75,
        damageRatio: dmgRatio,
        seed: (pylonKey === 'left' ? 13 : 47)
      });
      drawWeatheredTimberPost(ctx, px + 6, pylonTopY, 18, caissonTopY - pylonTopY, {
        bandInterval: 75,
        damageRatio: dmgRatio,
        seed: (pylonKey === 'left' ? 27 : 59)
      });

      // Krzyżowe rygle wzmacniające (X-bracing) z ciosanego drewna
      ctx.strokeStyle = '#38200c';
      ctx.lineWidth = 6;
      for (let crossY = pylonTopY + 40; crossY < caissonTopY - 20; crossY += 75) {
        ctx.beginPath();
        ctx.moveTo(px - 20, crossY);
        ctx.lineTo(px + 20, crossY + 60);
        ctx.moveTo(px + 20, crossY);
        ctx.lineTo(px - 20, crossY + 60);
        ctx.stroke();

        // Fazowana krawędź rygla
        ctx.strokeStyle = 'rgba(215, 175, 95, 0.40)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(px - 19, crossY - 1);
        ctx.lineTo(px + 19, crossY + 59);
        ctx.stroke();

        // Kute stalowe nakładki węzłowe (gusset plates) z nitami
        ctx.fillStyle = '#222d3d';
        ctx.fillRect(px - 26, crossY - 4, 52, 9);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(px - 26, crossY - 4, 52, 9);

        // Nity nakładek
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px - 24, crossY - 2, 3, 4);
        ctx.fillRect(px + 21, crossY - 2, 3, 4);
        ctx.fillRect(px - 2, crossY - 2, 4, 4);
      }

      // Dynamiczne pęknięcia drewna przy uszkodzeniu
      if (p.hp < p.maxHp) {
        ctx.strokeStyle = '#0a0502';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(px - 15, 950);
        ctx.lineTo(px - 8, 990);
        ctx.lineTo(px - 14, 1040);
        if (dmgRatio > 0.4) {
          ctx.moveTo(px + 12, 920);
          ctx.lineTo(px + 18, 970);
          ctx.lineTo(px + 10, 1020);
        }
        if (dmgRatio > 0.7) {
          ctx.moveTo(px - 20, 1060);
          ctx.lineTo(px + 15, 1080);
        }
        ctx.stroke();
      }

      // 3. Szczyt pylonu: siodło linowe (Cable Saddle z żelaza i brązu)
      ctx.fillStyle = '#1c2430';
      ctx.fillRect(px - 30, pylonTopY - 14, 60, 16);
      ctx.strokeStyle = '#0b1017';
      ctx.lineWidth = 2;
      ctx.strokeRect(px - 30, pylonTopY - 14, 60, 16);

      // Fazowana krawędź siodła
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px - 29, pylonTopY - 13);
      ctx.lineTo(px + 29, pylonTopY - 13);
      ctx.stroke();

      // Kołowroty / rolki linowe z rowkiem i smarem
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(px - 10, pylonTopY - 6, 7, 0, Math.PI * 2);
      ctx.arc(px + 10, pylonTopY - 6, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Wytarty rowek pod linę
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(px - 10, pylonTopY - 6, 3, 0, Math.PI * 2);
      ctx.arc(px + 10, pylonTopY - 6, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // PYLON ZNISZCZONY (ANGRY BIRDS RUBBLE / FALLEN TOWER)
      // A. Wyszczerbione, postrzępione kikuty włókien tekowych przy szczycie kesonu
      ctx.save();
      ctx.fillStyle = '#3a210b';
      ctx.beginPath();
      ctx.moveTo(px - 26, caissonTopY);
      ctx.lineTo(px - 26, caissonTopY - 32);
      ctx.lineTo(px - 20, caissonTopY - 55);
      ctx.lineTo(px - 14, caissonTopY - 22);
      ctx.lineTo(px - 8, caissonTopY - 45);
      ctx.lineTo(px - 4, caissonTopY - 18);
      ctx.lineTo(px - 4, caissonTopY);
      ctx.closePath();
      ctx.fill();

      // Prawy kikut
      ctx.beginPath();
      ctx.moveTo(px + 4, caissonTopY);
      ctx.lineTo(px + 4, caissonTopY - 20);
      ctx.lineTo(px + 10, caissonTopY - 50);
      ctx.lineTo(px + 16, caissonTopY - 26);
      ctx.lineTo(px + 22, caissonTopY - 60);
      ctx.lineTo(px + 26, caissonTopY - 35);
      ctx.lineTo(px + 26, caissonTopY);
      ctx.closePath();
      ctx.fill();

      // Ciemne osmolenie kikutów po wybuchu
      ctx.fillStyle = 'rgba(10, 5, 2, 0.85)';
      ctx.fillRect(px - 26, caissonTopY - 14, 22, 14);
      ctx.fillRect(px + 4, caissonTopY - 14, 22, 14);

      ctx.strokeStyle = '#120702';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();

      // B. Przechylony i zapadający się w rzece korpus wieży pylonu ze złamanymi belkami
      const dropY = p.fallDropY || 0;
      const isL = (pylonKey === 'left');
      const pivotX = px + (isL ? dropY * 0.35 : -dropY * 0.35);
      const pivotY = caissonTopY - 25 + dropY;

      ctx.save();
      ctx.translate(pivotX, pivotY);
      ctx.rotate(p.tiltAngle);

      const towerLen = caissonTopY - pylonTopY;
      ctx.fillStyle = '#3b220e';

      // Poszarpana lewa noga
      ctx.beginPath();
      ctx.moveTo(-24, -towerLen);
      ctx.lineTo(-6, -towerLen);
      ctx.lineTo(-6, -25);
      ctx.lineTo(-12, -10);
      ctx.lineTo(-18, -35);
      ctx.lineTo(-24, -18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#150902';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Poszarpana prawa noga
      ctx.beginPath();
      ctx.moveTo(6, -towerLen);
      ctx.lineTo(24, -towerLen);
      ctx.lineTo(24, -20);
      ctx.lineTo(18, -38);
      ctx.lineTo(12, -12);
      ctx.lineTo(6, -28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pęknięty, zwisający rygiel krzyżowy
      ctx.strokeStyle = '#3e240e';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-20, -towerLen + 50);
      ctx.lineTo(10, -towerLen + 100);
      ctx.lineTo(18, -towerLen + 130);
      ctx.stroke();

      // Siodło linowe
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-30, -towerLen - 14, 60, 16);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(-30, -towerLen - 14, 60, 16);

      // Zerwane, rozplecione stalowe liny powiewające od siodła
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-20, -towerLen - 14);
      ctx.quadraticCurveTo(-35, -towerLen + 20, -45, -towerLen + 55);
      ctx.moveTo(20, -towerLen - 14);
      ctx.quadraticCurveTo(35, -towerLen + 20, 48, -towerLen + 60);
      ctx.stroke();
      ctx.restore();

      // C. Piana wodna i fale wokół zatopionego w rzece pylonu
      if (p.collapsed || pivotY >= 1260) {
        const waterImpactX = px + (isL ? 170 : -170);
        ctx.save();
        ctx.strokeStyle = 'rgba(195, 240, 255, 0.75)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(waterImpactX, 1306, 70, 7, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(waterImpactX + (isL ? -40 : 40), 1308, 45, 4.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  }



  // B. ZNISZCZALNE MODUŁOWE RAMPY PODEJŚCIOWE NA MOST (Łączące grunt z kładką)
  function renderGentleApproachStiltsVectors(targetCtx, isLeft, rampBlocks) {
    for (let rIdx = 0; rIdx < rampBlocks.length; rIdx++) {
      const b = rampBlocks[rIdx];
      if (b.x + b.w + 40 < camL || b.x - 40 > camR) continue;
      if (!b.intact && (b.y > 1400 || b.y + b.h + 20 < camT || b.y - 20 > camB)) continue;

      const y1 = getApproachInclineY(b.origX, isLeft);
      const y2 = getApproachInclineY(b.origX + b.w, isLeft);
      const deckBottomY = Math.max(y1, y2) + 12;

      if (b.intact) {
        // Pal nośny (hewn timber stilt) schodzący od kładki w głąb podłoża aż do spągu Y: 1400
        drawWeatheredTimberPost(targetCtx, b.stiltX - 5, deckBottomY, 10, 1400 - deckBottomY, {
          bandInterval: 95,
          isWet: true,
          seed: b.seed
        });

        // Kute stalowe strzemię / jarzmo mocujące do podłużnicy rampy
        targetCtx.fillStyle = '#1e293b';
        targetCtx.fillRect(b.stiltX - 8, deckBottomY + 2, 16, 8);
        targetCtx.strokeStyle = '#0f172a';
        targetCtx.lineWidth = 1.2;
        targetCtx.strokeRect(b.stiltX - 8, deckBottomY + 2, 16, 8);

        // Śruby ryglowe
        targetCtx.fillStyle = '#94a3b8';
        targetCtx.fillRect(b.stiltX - 6, deckBottomY + 4, 3, 3);
        targetCtx.fillRect(b.stiltX + 3, deckBottomY + 4, 3, 3);
      } else {
        // Złamany kikut pala tuż przy gruncie / linii wody (brak lewitującego 300px słupa)
        const groundY = (typeof getRiverbankGroundY === 'function')
          ? getRiverbankGroundY(b.stiltX)
          : 1200;
        const stumpH = 12 + (b.seed % 10);
        const breakTopY = Math.min(1315, groundY - stumpH);

        targetCtx.strokeStyle = '#2d1808';
        targetCtx.lineWidth = 9;
        targetCtx.beginPath();
        targetCtx.moveTo(b.stiltX, breakTopY);
        targetCtx.lineTo(b.stiltX, 1400);
        targetCtx.stroke();

        targetCtx.strokeStyle = '#44260f';
        targetCtx.lineWidth = 2.2;
        targetCtx.beginPath();
        targetCtx.moveTo(b.stiltX - 3, breakTopY);
        targetCtx.lineTo(b.stiltX - 3, 1400);
        targetCtx.stroke();

        // Poszarpana korona złamania ze sterczącymi drzazgami i zwęgleniem
        targetCtx.fillStyle = '#221104';
        targetCtx.beginPath();
        targetCtx.moveTo(b.stiltX - 5, breakTopY + 2);
        targetCtx.lineTo(b.stiltX - 2, breakTopY - 10);
        targetCtx.lineTo(b.stiltX + 1, breakTopY - 3);
        targetCtx.lineTo(b.stiltX + 4, breakTopY - 12);
        targetCtx.lineTo(b.stiltX + 5, breakTopY + 2);
        targetCtx.closePath();
        targetCtx.fill();

        targetCtx.fillStyle = 'rgba(8, 4, 1, 0.90)';
        targetCtx.fillRect(b.stiltX - 5, breakTopY - 3, 10, 8);
      }
    }
  }

  function drawGentleApproachStilts(isLeft) {
    const rx1 = isLeft ? 1150 : 2650;
    const rx2 = isLeft ? 1750 : 3250;
    if (rx2 < camL || rx1 > camR) return;

    const rampBlocks = getRampBlocks(isLeft);
    const isIntact = rampBlocks.every(b => b.intact && b.hp === b.maxHp);
    if (!isIntact) {
      if (isLeft) _cachedLeftStiltsCanvas = null;
      else _cachedRightStiltsCanvas = null;
    }
    if (isIntact && typeof document !== 'undefined') {
      let stiltsCanvas = isLeft ? _cachedLeftStiltsCanvas : _cachedRightStiltsCanvas;
      if (!stiltsCanvas) {
        stiltsCanvas = document.createElement('canvas');
        stiltsCanvas.width = 640;
        stiltsCanvas.height = 570;
        const sCtx = stiltsCanvas.getContext('2d');
        if (sCtx) {
          sCtx.save();
          sCtx.translate(-(rx1 - 20), -830);
          renderGentleApproachStiltsVectors(sCtx, isLeft, rampBlocks);
          sCtx.restore();
        }
        if (isLeft) _cachedLeftStiltsCanvas = stiltsCanvas;
        else _cachedRightStiltsCanvas = stiltsCanvas;
      }
      if (stiltsCanvas) {
        ctx.drawImage(stiltsCanvas, rx1 - 20, 830);
        return;
      }
    }

    ctx.save();
    renderGentleApproachStiltsVectors(ctx, isLeft, rampBlocks);
    ctx.restore();
  }

  function renderGentleBridgeApproachVectors(targetCtx, isLeft, rampBlocks) {
    for (let rIdx = 0; rIdx < rampBlocks.length; rIdx++) {
      const b = rampBlocks[rIdx];
      if (b.x + b.w + 40 < camL || b.x - 40 > camR) continue;
      if (!b.intact && (b.y > 1400 || b.y + b.h + 20 < camT || b.y - 20 > camB)) continue;

      const y1 = getApproachInclineY(b.origX, isLeft);
      const y2 = getApproachInclineY(b.origX + b.w, isLeft);
      const groundY = getRiverbankGroundY(b.stiltX);

      if (b.intact) {
        const dmgRatio = 1 - (b.hp / b.maxHp);
        // 2. Belka podestu rampy w estetyce postarzanego drewna
        targetCtx.beginPath();
        targetCtx.moveTo(b.origX, y1);
        targetCtx.lineTo(b.origX + b.w, y2);
        targetCtx.lineTo(b.origX + b.w, y2 + 20);
        targetCtx.lineTo(b.origX, y1 + 20);
        targetCtx.closePath();

        targetCtx.fillStyle = '#4a2c10';
        targetCtx.fill();

        targetCtx.strokeStyle = '#180a02';
        targetCtx.lineWidth = 2.0;
        targetCtx.stroke();

        // Wzdłużny słój belki
        targetCtx.strokeStyle = 'rgba(14, 6, 2, 0.70)';
        targetCtx.lineWidth = 1.4;
        targetCtx.beginPath();
        targetCtx.moveTo(b.origX + 2, y1 + 10);
        targetCtx.lineTo(b.origX + b.w - 2, y2 + 10);
        targetCtx.stroke();

        // 3. Listwy antypoślizgowe z ciosanych bali (stepped transverse battens) - zgrupowane
        targetCtx.fillStyle = '#3a200a';
        targetCtx.strokeStyle = 'rgba(235, 195, 105, 0.85)';
        targetCtx.lineWidth = 1.8;
        targetCtx.beginPath();
        for (let ax = b.origX + 14; ax <= b.origX + b.w - 10; ax += 20) {
          const ay = getApproachInclineY(ax, isLeft);
          targetCtx.fillRect(ax - 2, ay - 1, 4, 6);
          targetCtx.moveTo(ax - 4, ay);
          targetCtx.lineTo(ax + 4, ay + (isLeft ? -1.5 : 1.5));
        }
        targetCtx.stroke();

        targetCtx.fillStyle = '#0f172a';
        for (let ax = b.origX + 14; ax <= b.origX + b.w - 10; ax += 20) {
          const ay = getApproachInclineY(ax, isLeft);
          targetCtx.fillRect(ax - 1, ay + 2, 2.5, 2.5);
        }

        // Mech na górnej krawędzi
        targetCtx.strokeStyle = '#3d6820';
        targetCtx.lineWidth = 3.2;
        targetCtx.beginPath();
        targetCtx.moveTo(b.origX, y1 + 1);
        targetCtx.lineTo(b.origX + b.w, y2 + 1);
        targetCtx.stroke();
        targetCtx.strokeStyle = '#629e30';
        targetCtx.lineWidth = 1.8;
        targetCtx.beginPath();
        targetCtx.moveTo(b.origX + 3, y1 + 0.6);
        targetCtx.lineTo(b.origX + b.w - 3, y2 + 0.6);
        targetCtx.stroke();

        // Pęknięcia jeśli rampa jest uszkodzona
        if (b.hp < b.maxHp) {
          targetCtx.strokeStyle = '#0c0401';
          targetCtx.lineWidth = 2.0;
          targetCtx.beginPath();
          targetCtx.moveTo(b.origX + b.w * 0.4, y1 + 4);
          targetCtx.lineTo(b.origX + b.w * 0.48, y1 + 12);
          if (dmgRatio > 0.5) {
            targetCtx.moveTo(b.origX + b.w * 0.72, y2 + 3);
            targetCtx.lineTo(b.origX + b.w * 0.64, y2 + 15);
          }
          targetCtx.stroke();
        }

        // 4. Słupek poręczy na środku segmentu z ciosanego drewna
        const postX = b.stiltX;
        const postY = getApproachInclineY(postX, isLeft);
        const handrailH = 34;

        targetCtx.strokeStyle = '#321908';
        targetCtx.lineWidth = 4.5;
        targetCtx.beginPath();
        targetCtx.moveTo(postX, postY);
        targetCtx.lineTo(postX, postY - handrailH);
        targetCtx.stroke();

        targetCtx.strokeStyle = 'rgba(215, 175, 95, 0.45)';
        targetCtx.lineWidth = 1.0;
        targetCtx.beginPath();
        targetCtx.moveTo(postX - 1, postY);
        targetCtx.lineTo(postX - 1, postY - handrailH);
        targetCtx.stroke();

        // Okucie słupka
        targetCtx.fillStyle = '#1e293b';
        targetCtx.fillRect(postX - 3.5, postY - handrailH, 7, 7);

        // Linka poręczy do kolejnego segmentu
        if (rIdx < rampBlocks.length - 1 && rampBlocks[rIdx + 1].intact) {
          const nextPostX = rampBlocks[rIdx + 1].stiltX;
          const nextPostY = getApproachInclineY(nextPostX, isLeft);

          targetCtx.strokeStyle = '#533718';
          targetCtx.lineWidth = 3.5;
          targetCtx.beginPath();
          targetCtx.moveTo(postX, postY - handrailH + 3);
          targetCtx.lineTo(nextPostX, nextPostY - handrailH + 3);
          targetCtx.stroke();

          targetCtx.strokeStyle = '#2d1808';
          targetCtx.lineWidth = 1.8;
          targetCtx.beginPath();
          targetCtx.moveTo(postX, postY - handrailH * 0.5);
          targetCtx.lineTo(nextPostX, nextPostY - handrailH * 0.5);
          targetCtx.stroke();
        } else if (rIdx < rampBlocks.length - 1 && !rampBlocks[rIdx + 1].intact) {
          // Poszarpany koniec zerwanej poręczy zwisający w dół
          targetCtx.strokeStyle = '#533718';
          targetCtx.lineWidth = 3.0;
          targetCtx.beginPath();
          targetCtx.moveTo(postX, postY - handrailH + 3);
          targetCtx.quadraticCurveTo(postX + (isLeft ? 8 : -8), postY - handrailH + 10, postX + (isLeft ? 12 : -12), postY - handrailH + 18);
          targetCtx.stroke();
        }
      } else {
        // ZNISZCZONY SEGMENT RAMPY (Poszarpana belka podestu ze zniszczoną listwą antypoślizgową)
        if (!b.vanished && !b.isDead) {
          const bcx = b.x + b.w / 2;
          const bcy = b.y + b.h / 2;
          if (b.landDecay && b.landDecay > 0) {
            targetCtx.save();
            targetCtx.globalAlpha = Math.max(0, 1 - b.landDecay / 45);
            drawSplinteredWoodRubble(targetCtx, bcx, bcy, b.w, b.h, b.angle, { seed: b.seed });
            targetCtx.restore();
          } else {
            drawSplinteredWoodRubble(targetCtx, bcx, bcy, b.w, b.h, b.angle, { seed: b.seed });
          }
        }

        // Piana jeśli klocek wpadł do rzeki (buforowana do wspólnego batcha)
        if (!b.vanished && b.y + b.h >= 1300 && b.y <= 1360) {
          const bcx = b.x + b.w / 2;
          _waterFoamEllipses.push(bcx, b.w * 0.7);
        }
      }
    }

    // 5. Oznaczenie wejściowe na gruntowej krawędzi rampy
    const entryX = isLeft ? 1150 : 3250;
    const entryY = (typeof getRiverbankGroundY === 'function') ? getRiverbankGroundY(entryX) : 1200;
    targetCtx.fillStyle = '#3a200a';
    targetCtx.fillRect(entryX - 6, entryY - 45, 12, 45);
    targetCtx.strokeStyle = '#1a0e05';
    targetCtx.lineWidth = 2;
    targetCtx.strokeRect(entryX - 6, entryY - 45, 12, 45);

    // Kute zwieńczenie słupa (bez pomarańczowych poświat)
    targetCtx.fillStyle = '#1e293b';
    targetCtx.fillRect(entryX - 8, entryY - 50, 16, 6);
  }

  function drawGentleBridgeApproach(isLeft) {
    const rx1 = isLeft ? 1150 : 2650;
    const rx2 = isLeft ? 1750 : 3250;

    if (rx2 < camL || rx1 > camR) return;

    const rampBlocks = getRampBlocks(isLeft);
    const isIntact = rampBlocks.every(b => b.intact && b.hp === b.maxHp);
    if (!isIntact) {
      if (isLeft) _cachedLeftApproachDeckCanvas = null;
      else _cachedRightApproachDeckCanvas = null;
    }
    if (isIntact && typeof document !== 'undefined') {
      let deckCanvas = isLeft ? _cachedLeftApproachDeckCanvas : _cachedRightApproachDeckCanvas;
      if (!deckCanvas) {
        deckCanvas = document.createElement('canvas');
        deckCanvas.width = 640;
        deckCanvas.height = 420;
        const dCtx = deckCanvas.getContext('2d');
        if (dCtx) {
          dCtx.save();
          dCtx.translate(-(rx1 - 20), -820);
          renderGentleBridgeApproachVectors(dCtx, isLeft, rampBlocks);
          dCtx.restore();
        }
        if (isLeft) _cachedLeftApproachDeckCanvas = deckCanvas;
        else _cachedRightApproachDeckCanvas = deckCanvas;
      }
      if (deckCanvas) {
        ctx.drawImage(deckCanvas, rx1 - 20, 820);
        return;
      }
    }

    ctx.save();
    renderGentleBridgeApproachVectors(ctx, isLeft, rampBlocks);
    ctx.restore();
  }



  // -----------------------------------------------------------------------
  // PLATFORMY DUŻO WYŻEJ NAD POMOSTEM (Y: 620, most Y: 1000)
  // Wiszące w koronach drzew dżungli pomosty taktyczne
  // -----------------------------------------------------------------------
  // -----------------------------------------------------------------------
  // PLATFORMY DUŻO WYŻEJ NAD POMOSTEM (Y: 620, most Y: 1000)
  // Zniszczalne wiszące pomosty taktyczne w koronach drzew (Angry Birds Physics)
  // -----------------------------------------------------------------------
  function drawHighCanopyPlatform(plat) {
    if (!plat) return;
    const px = plat.origX;
    const py = plat.origY;
    const pw = plat.w;
    const ph = plat.h;

    if (px + pw * 2 + 80 < camL || px - pw - 80 > camR) return;

    ctx.save();
    // 1. Długie liny nośne z baldachimu dżungli biegnące prosto do punktów zaczepienia
    const anchorLX = plat.ropeLeft.anchorX || plat.ropeLeft.x;
    const anchorRX = plat.ropeRight.anchorX || plat.ropeRight.x;
    let attachLX = plat.attachLX;
    let attachLY = plat.attachLY;
    let attachRX = plat.attachRX;
    let attachRY = plat.attachRY;

    if (attachLX === undefined || attachLY === undefined || attachRX === undefined || attachRY === undefined) {
      const ropeLen = plat.origY;
      if (plat.isSplit) {
        const swayLX = plat.leftSwayX || 0;
        const swayRX = plat.rightSwayX || 0;
        attachLX = anchorLX + swayLX;
        attachLY = Math.sqrt(Math.max(3600, ropeLen * ropeLen - swayLX * swayLX)) + (plat.leftBounceY || 0);
        attachRX = anchorRX + swayRX;
        attachRY = Math.sqrt(Math.max(3600, ropeLen * ropeLen - swayRX * swayRX)) + (plat.rightBounceY || 0);
      } else if (plat.ropeLeft.intact && !plat.ropeRight.intact) {
        const swayX = plat.swayX || 0;
        attachLX = anchorLX + swayX;
        attachLY = Math.sqrt(Math.max(3600, ropeLen * ropeLen - swayX * swayX)) + (plat.bounceY || 0);
        const relRX = plat.ropeRight.x - plat.ropeLeft.x;
        attachRX = attachLX + relRX * Math.cos(plat.tiltAngle);
        attachRY = attachLY + relRX * Math.sin(plat.tiltAngle);
      } else if (!plat.ropeLeft.intact && plat.ropeRight.intact) {
        const swayX = plat.swayX || 0;
        attachRX = anchorRX + swayX;
        attachRY = Math.sqrt(Math.max(3600, ropeLen * ropeLen - swayX * swayX)) + (plat.bounceY || 0);
        const relLX = plat.ropeLeft.x - plat.ropeRight.x;
        attachLX = attachRX + relLX * Math.cos(plat.tiltAngle);
        attachLY = attachRY + relLX * Math.sin(plat.tiltAngle);
      } else {
        const platCenterX = plat.origX + plat.w * 0.5 + (plat.swayX || 0);
        const platCenterY = plat.origY + (plat.bounceY || 0);
        const cosA = Math.cos(plat.tiltAngle);
        const sinA = Math.sin(plat.tiltAngle);
        const relLX = plat.ropeLeft.x - (plat.origX + plat.w * 0.5);
        attachLX = platCenterX + relLX * cosA;
        attachLY = platCenterY + relLX * sinA;
        const relRX = plat.ropeRight.x - (plat.origX + plat.w * 0.5);
        attachRX = platCenterX + relRX * cosA;
        attachRY = platCenterY + relRX * sinA;
      }
    }

    // Lewa lina nośna
    if (plat.ropeLeft.intact) {
      ctx.strokeStyle = '#4e3316';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(anchorLX, 0);
      ctx.lineTo(attachLX, attachLY);
      ctx.stroke();

      // Nacięcia / postrzępienia jeśli lina jest uszkodzona
      if (plat.ropeLeft.hp < plat.ropeLeft.maxHp) {
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.strokeRect(attachLX - 3, attachLY - 25, 6, 12);
      }
    } else {
      // Zerwana lina powiewająca na wietrze z baldachimu z rozplecionymi włóknami konopnymi
      const vSway = Math.sin(animTime * 3.0 + px * 0.05) * 8;
      ctx.strokeStyle = '#3a200a';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(anchorLX, 0);
      ctx.quadraticCurveTo(anchorLX + vSway * 0.5, 45, anchorLX + vSway, 85);
      ctx.stroke();

      // Rozplecione włókna konopne (frayed rope end)
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(anchorLX + vSway, 85);
      ctx.lineTo(anchorLX + vSway - 5, 96);
      ctx.moveTo(anchorLX + vSway, 85);
      ctx.lineTo(anchorLX + vSway, 98);
      ctx.moveTo(anchorLX + vSway, 85);
      ctx.lineTo(anchorLX + vSway + 6, 95);
      ctx.stroke();
    }

    // Prawa lina nośna
    if (plat.ropeRight.intact) {
      ctx.strokeStyle = '#4e3316';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(anchorRX, 0);
      ctx.lineTo(attachRX, attachRY);
      ctx.stroke();

      if (plat.ropeRight.hp < plat.ropeRight.maxHp) {
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.strokeRect(attachRX - 3, attachRY - 25, 6, 12);
      }
    } else {
      const vSway = Math.sin(animTime * 3.0 + px * 0.05 + 1.2) * 8;
      ctx.strokeStyle = '#3a200a';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(anchorRX, 0);
      ctx.quadraticCurveTo(anchorRX + vSway * 0.5, 45, anchorRX + vSway, 85);
      ctx.stroke();

      // Rozplecione włókna konopne
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(anchorRX + vSway, 85);
      ctx.lineTo(anchorRX + vSway - 5, 96);
      ctx.moveTo(anchorRX + vSway, 85);
      ctx.lineTo(anchorRX + vSway, 98);
      ctx.moveTo(anchorRX + vSway, 85);
      ctx.lineTo(anchorRX + vSway + 6, 95);
      ctx.stroke();
    }

    // 2. Kładka i modularne deski pomostu wiszącego
    for (let bIdx = 0; bIdx < plat.blocks.length; bIdx++) {
      const b = plat.blocks[bIdx];
      if (b.x + b.w + 20 < camL || b.x - 20 > camR) continue;
      if (!b.intact && (b.y > 1400 || b.y + b.h + 20 < camT || b.y - 20 > camB)) continue;

      ctx.save();
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      ctx.translate(cx, cy);
      if (b.angle) {
        ctx.rotate(b.angle);
      }
      const halfW = b.w / 2;
      const halfH = b.h / 2;

      if (b.intact) {
        const dmgRatio = 1 - (b.hp / b.maxHp);
        drawWeatheredTimberDeck(ctx, -halfW, -halfH, b.w, b.h, {
          seed: Math.floor(Math.abs(cx * 3)),
          damageRatio: dmgRatio,
          plankCount: 2,
          hasGouges: true,
          hasMetal: true,
          hasMoss: true,
          hangingVines: true,
          animTime
        });

        // Oplecione liny konopne mocujące deskę do zawiesia
        ctx.strokeStyle = '#6a431a';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-halfW + 3, -halfH);
        ctx.lineTo(-halfW + 3, halfH);
        ctx.moveTo(halfW - 3, -halfH);
        ctx.lineTo(halfW - 3, halfH);
        ctx.stroke();

        ctx.restore();
      } else {
        // Zniszczona deska kładki ze sterczącymi drzazgami
        ctx.restore();
        drawSplinteredWoodRubble(ctx, cx, cy, b.w, b.h, b.angle, { seed: Math.floor(Math.abs(cx * 3)) });
      }

      // Piana wodna wokół klocka w wodzie (buforowana do wspólnego batcha)
      if (!b.intact && b.y + b.h >= 1300 && b.y <= 1360) {
        _waterFoamEllipses.push(cx, b.w * 0.7);
      }
    }

    ctx.restore();
  }

  // Renderowanie wszystkich 4 wiszących pomostów taktycznych
  for (let pIdx = 0; pIdx < ARENA_3_CANOPY_PLATFORMS.length; pIdx++) {
    drawHighCanopyPlatform(ARENA_3_CANOPY_PLATFORMS[pIdx]);
  }

  // Kable odciągowe od pylonów do bloków kotwiących (w powietrzu)
  function drawAnchorCables() {
    ctx.save();
    ctx.strokeStyle = '#4e3316';
    ctx.lineWidth = 5;
    ctx.beginPath();
    const anchorCableY = 1154; // Otwór w uchu ściągacza na szczycie bloku kotwiącego
    if (ARENA_3_PYLONS.left.intact) {
      ctx.moveTo(pylonLeftX, pylonTopY - 6);
      ctx.lineTo(anchorLeftX, anchorCableY);
    } else {
      const vSway = Math.sin(animTime * 2.5) * 12;
      ctx.moveTo(anchorLeftX, anchorCableY);
      ctx.quadraticCurveTo(anchorLeftX + 150, anchorCableY + 20 + vSway, anchorLeftX + 280, anchorCableY + 15);
    }
    if (ARENA_3_PYLONS.right.intact) {
      ctx.moveTo(pylonRightX, pylonTopY - 6);
      ctx.lineTo(anchorRightX, anchorCableY);
    } else {
      const vSway = Math.sin(animTime * 2.5 + 1.2) * 12;
      ctx.moveTo(anchorRightX, anchorCableY);
      ctx.quadraticCurveTo(anchorRightX - 150, anchorCableY + 20 + vSway, anchorRightX - 280, anchorCableY + 15);
    }
    ctx.stroke();

    // Druga lina odciągowa (podwójna lina stalowa z połyskiem splotu)
    ctx.strokeStyle = '#2d1c0a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (ARENA_3_PYLONS.left.intact) {
      ctx.moveTo(pylonLeftX + 4, pylonTopY - 6);
      ctx.lineTo(anchorLeftX + 3, anchorCableY);
    }
    if (ARENA_3_PYLONS.right.intact) {
      ctx.moveTo(pylonRightX - 4, pylonTopY - 6);
      ctx.lineTo(anchorRightX - 3, anchorCableY);
    }
    ctx.stroke();

    // Jasny refleks splotu drutów liny stalowej
    ctx.strokeStyle = 'rgba(215, 175, 95, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (ARENA_3_PYLONS.left.intact) {
      ctx.moveTo(pylonLeftX - 1, pylonTopY - 7);
      ctx.lineTo(anchorLeftX - 1, anchorCableY);
    }
    if (ARENA_3_PYLONS.right.intact) {
      ctx.moveTo(pylonRightX + 1, pylonTopY - 7);
      ctx.lineTo(anchorRightX + 1, anchorCableY);
    }
    ctx.stroke();
    ctx.restore();
  }

  drawAnchorCables();

  // D. GŁÓWNE LINY NOŚNE PRZĘSŁA (Łuk paraboliczny lub zerwane liny)
  if (bridgeX2 + 80 >= camL && bridgeX1 - 80 <= camR) {
    ctx.save();

    const totalBlocks = ARENA_3_BRIDGE_BLOCKS.length;
    let intactBlockCount = 0;
    for (let i = 0; i < totalBlocks; i++) {
      if (ARENA_3_BRIDGE_BLOCKS[i].intact) intactBlockCount++;
    }
    const destroyedRatio = 1 - (intactBlockCount / (totalBlocks || 1));
    const leftPylonIntact = !!ARENA_3_PYLONS.left.intact;
    const rightPylonIntact = !!ARENA_3_PYLONS.right.intact;

    // SCENARIUSZ 1: OBA PYLONY ZNISZCZONE -> Całkowity brak olinowania głównego
    if (!leftPylonIntact && !rightPylonIntact) {
      ctx.restore();
    } else if (leftPylonIntact && !rightPylonIntact) {
      // SCENARIUSZ 2: TYLKO LEWY PYLON STOI -> Lina zerwana z prawej, zwisa z lewego pylonu w toń rzeki
      ctx.strokeStyle = '#5a3b19';
      ctx.lineWidth = 5.0;
      ctx.beginPath();
      ctx.moveTo(pylonLeftX, pylonTopY - 6);
      ctx.quadraticCurveTo(pylonLeftX + 25, 1150, pylonLeftX + 50, 1310);
      ctx.stroke();

      ctx.strokeStyle = '#2c1a0a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pylonLeftX, pylonTopY - 3);
      ctx.quadraticCurveTo(pylonLeftX + 25, 1153, pylonLeftX + 50, 1310);
      ctx.stroke();
      ctx.restore();
    } else if (!leftPylonIntact && rightPylonIntact) {
      // SCENARIUSZ 3: TYLKO PRAWY PYLON STOI -> Lina zerwana z lewej, zwisa z prawego pylonu w toń rzeki
      ctx.strokeStyle = '#5a3b19';
      ctx.lineWidth = 5.0;
      ctx.beginPath();
      ctx.moveTo(pylonRightX, pylonTopY - 6);
      ctx.quadraticCurveTo(pylonRightX - 25, 1150, pylonRightX - 50, 1310);
      ctx.stroke();

      ctx.strokeStyle = '#2c1a0a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pylonRightX, pylonTopY - 3);
      ctx.quadraticCurveTo(pylonRightX - 25, 1153, pylonRightX - 50, 1310);
      ctx.stroke();
      ctx.restore();
    } else if (destroyedRatio >= 0.60) {
      // SCENARIUSZ 4: OBA PYLONY STOJĄ, ALE >60% MOSTU ZNISZCZONE -> Lina pękła w środku, końce zwisają do wody
      ctx.strokeStyle = '#5a3b19';
      ctx.lineWidth = 5.0;
      ctx.beginPath();
      // Zwieszenie z lewego pylonu
      ctx.moveTo(pylonLeftX, pylonTopY - 6);
      ctx.quadraticCurveTo(pylonLeftX + 45, 1120, pylonLeftX + 85, 1310);
      // Zwieszenie z prawego pylonu
      ctx.moveTo(pylonRightX, pylonTopY - 6);
      ctx.quadraticCurveTo(pylonRightX - 45, 1120, pylonRightX - 85, 1310);
      ctx.stroke();

      ctx.strokeStyle = '#2c1a0a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pylonLeftX, pylonTopY - 3);
      ctx.quadraticCurveTo(pylonLeftX + 45, 1123, pylonLeftX + 85, 1310);
      ctx.moveTo(pylonRightX, pylonTopY - 3);
      ctx.quadraticCurveTo(pylonRightX - 45, 1123, pylonRightX - 85, 1310);
      ctx.stroke();
      ctx.restore();
    } else {
      // SCENARIUSZ 5: OBA PYLONY STOJĄ, MOST UTRZYMUJE LINĘ NOŚNĄ (destroyedRatio < 0.60)
      const leftAnchorX = pylonLeftX;
      const leftAnchorY = pylonTopY - 6;
      const rightAnchorX = pylonRightX;
      const rightAnchorY = pylonTopY - 6;
      const midSagY = 970;

      // 1. Górna główna lina nośna (Main Cable)
      ctx.strokeStyle = '#5a3b19';
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.moveTo(leftAnchorX, leftAnchorY);
      ctx.quadraticCurveTo(2200, midSagY, rightAnchorX, rightAnchorY);
      ctx.stroke();

      // Ciemna krawędź liny (cień)
      ctx.strokeStyle = '#2c1a0a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(leftAnchorX, leftAnchorY + 3);
      ctx.quadraticCurveTo(2200, midSagY + 3, rightAnchorX, rightAnchorY + 3);
      ctx.stroke();

      // Jasny refleks splotu drutów nośnych
      ctx.strokeStyle = 'rgba(215, 175, 95, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(leftAnchorX, leftAnchorY - 1);
      ctx.quadraticCurveTo(2200, midSagY - 1, rightAnchorX, rightAnchorY - 1);
      ctx.stroke();

      // 2. Dolna lina poręczy (Handrail cable) - TYLKO między nienaruszonymi, sąsiadującymi przęsłami!
      // Nigdy nie rysuj ciągłej linii przez pustkę i zniszczone segmenty!
      ctx.strokeStyle = '#432910';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
        const b = ARENA_3_BRIDGE_BLOCKS[i];
        if (b.intact) {
          const nextB = ARENA_3_BRIDGE_BLOCKS[i + 1];
          const bY = b.y + (b.sag || 0) - 35;
          if (nextB && nextB.intact) {
            const nextBY = nextB.y + (nextB.sag || 0) - 35;
            ctx.moveTo(b.x, bY);
            ctx.lineTo(nextB.x + nextB.w, nextBY);
          } else {
            // Poszarpany koniec na krawędzi wyrwy opadający w dół
            ctx.moveTo(b.x, bY);
            ctx.lineTo(b.x + b.w + 4, bY + 5);
          }
        }
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(215, 175, 95, 0.35)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
        const b = ARENA_3_BRIDGE_BLOCKS[i];
        if (b.intact) {
          const nextB = ARENA_3_BRIDGE_BLOCKS[i + 1];
          const bY = b.y + (b.sag || 0) - 36;
          if (nextB && nextB.intact) {
            const nextBY = nextB.y + (nextB.sag || 0) - 36;
            ctx.moveTo(b.x, bY);
            ctx.lineTo(nextB.x + nextB.w, nextBY);
          }
        }
      }
      ctx.stroke();

      // 3. Pionowe wieszaki linowe łączące główną linę z kładką (Vertical Suspenders - zgrupowane w 1 stroke)
      ctx.strokeStyle = 'rgba(115, 78, 38, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
        const b = ARENA_3_BRIDGE_BLOCKS[i];
        if (b.intact && b.cableAttached) {
          const hx = b.origX + b.w / 2;
          const u = (hx - pylonLeftX) / (pylonRightX - pylonLeftX);
          const cableY = (1 - u) * (1 - u) * leftAnchorY + 2 * (1 - u) * u * midSagY + u * u * rightAnchorY;
          const currentY = b.y + (b.sag || 0);
          ctx.moveTo(hx, cableY);
          ctx.lineTo(hx, currentY);
        }
      }
      ctx.stroke();

      // Stalowe obejmy na stojących deskach
      ctx.fillStyle = '#334155';
      for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
        const b = ARENA_3_BRIDGE_BLOCKS[i];
        if (b.intact && b.cableAttached) {
          const hx = b.origX + b.w / 2;
          const currentY = b.y + (b.sag || 0);
          ctx.fillRect(hx - 2, currentY - 2, 4, 6);
        }
      }

      // 4. Krótkie poszarpane kikuty zerwanych wieszaków (12-16px, brak sztywnych linii do pustki)
      ctx.strokeStyle = 'rgba(115, 78, 38, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let hasBrokenCables = false;
      for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
        const b = ARENA_3_BRIDGE_BLOCKS[i];
        if (!b.intact || !b.cableAttached) {
          hasBrokenCables = true;
          const hx = b.origX + b.w / 2;
          const u = (hx - pylonLeftX) / (pylonRightX - pylonLeftX);
          const cableY = (1 - u) * (1 - u) * leftAnchorY + 2 * (1 - u) * u * midSagY + u * u * rightAnchorY;
          const stubLen = 14 + (b.seed ? (b.seed % 5) : (i % 5));
          const vSway = Math.sin(animTime * 3.5 + i * 0.8) * 3;
          ctx.moveTo(hx, cableY);
          ctx.lineTo(hx + vSway, cableY + stubLen);
        }
      }
      if (hasBrokenCables) {
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // E. DREWNIANE MODUŁOWE BELKI MOSTU (24 klocki, Angry Birds Dynamic Destruction)
  for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
    const b = ARENA_3_BRIDGE_BLOCKS[i];
    if (b.x + b.w + 40 < camL || b.x - 40 > camR) continue;
    if (!b.intact && (b.y > 1400 || b.y + b.h + 20 < camT || b.y - 20 > camB)) continue;

    ctx.save();
    if (b.intact) {
      // 1. NIENARUSZONA BELKA MOSTU W ESTETYCE POSTARZAŁEJ I ZNISZCZONEJ DŻUNGLI
      const currentY = b.y + (b.sag || 0);
      const dmgRatio = 1 - (b.hp / b.maxHp);
      drawWeatheredTimberDeck(ctx, b.x, currentY, b.w, b.h, {
        seed: i * 23,
        damageRatio: dmgRatio,
        plankCount: 2,
        hasGouges: true,
        hasMetal: true,
        hasMoss: true,
        isWet: (currentY + b.h >= 1290),
        animTime
      });

      // Stalowe jarzmo i obejma wieszaka linowego
      if (b.cableAttached && ARENA_3_PYLONS.left.intact && ARENA_3_PYLONS.right.intact) {
        const hx = b.origX + b.w / 2;
        ctx.fillStyle = '#222d3d';
        ctx.fillRect(hx - 3, currentY - 2, 6, 6);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.0;
        ctx.strokeRect(hx - 3, currentY - 2, 6, 6);
        // Śruba zacisku
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(hx - 1, currentY, 2, 2);
      }

      ctx.restore();
    } else {
      // 2. ODERWANY / ZAWALONY KLOCEK FIZYCZNY (Wyszczerbiona poszarpana belka ze zwęgleniem)
      if (b.vanished || b.isDead) {
        ctx.restore();
        continue;
      }
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      ctx.restore();
      if (b.landDecay && b.landDecay > 0) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - b.landDecay / 45);
        drawSplinteredWoodRubble(ctx, cx, cy, b.w, b.h, b.angle, { seed: i * 23 });
        ctx.restore();
      } else {
        drawSplinteredWoodRubble(ctx, cx, cy, b.w, b.h, b.angle, { seed: i * 23 });
      }

      // Piana wodna i fale wokół unoszącego się klocka w rzece (buforowana do wspólnego batcha)
      if (b.y + b.h >= 1300 && b.y <= 1360) {
        _waterFoamEllipses.push(cx, b.w * 0.75);
      }
    }
  }

  // Wspólny batch piany wodnej dla wszystkich klocków w rzece
  if (_waterFoamEllipses.length > 0) {
    ctx.strokeStyle = 'rgba(195, 240, 255, 0.75)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let fi = 0; fi < _waterFoamEllipses.length; fi += 2) {
      ctx.ellipse(_waterFoamEllipses[fi], 1306, _waterFoamEllipses[fi + 1], 4.2, 0, 0, Math.PI * 2);
    }
    ctx.stroke();
    _waterFoamEllipses.length = 0;
  }

  // F. CZĄSTECZKI OSTRYCH DRZAZG DREWNIANYCH (Bridge Splinters - zgrupowane w 1 stroke)
  if (BRIDGE_SPLINTERS.length > 0) {
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < BRIDGE_SPLINTERS.length; i++) {
      const sp = BRIDGE_SPLINTERS[i];
      if (sp.x < camL - 20 || sp.x > camR + 20) continue;
      const cos = Math.cos(sp.rot);
      const sin = Math.sin(sp.rot);
      const halfL = (sp.size || 6) * 0.7;
      ctx.moveTo(sp.x - cos * halfL, sp.y - sin * halfL);
      ctx.lineTo(sp.x + cos * halfL, sp.y + sin * halfL);
    }
    ctx.stroke();
  }

  // F2. CZĄSTECZKI OSTROKRAWĘDZIOWYCH ODŁAMKÓW SKALNYCH (Stone Debris - szybki fillRect)
  if (STONE_DEBRIS.length > 0) {
    ctx.fillStyle = '#475569';
    for (let i = 0; i < STONE_DEBRIS.length; i++) {
      const sd = STONE_DEBRIS[i];
      if (sd.x < camL - 20 || sd.x > camR + 20) continue;
      const s = (sd.size || 5) * 0.5;
      ctx.fillRect(sd.x - s, sd.y - s * 0.8, s * 2, s * 1.6);
    }
  }

  // F3. ROZBRYZGI WODY W RZECE (Arena 3 Water Splashes - szybki fillRect)
  if (ARENA_3_WATER_SPLASHES.length > 0) {
    ctx.fillStyle = 'rgba(125, 215, 235, 0.75)';
    for (let i = 0; i < ARENA_3_WATER_SPLASHES.length; i++) {
      const ws = ARENA_3_WATER_SPLASHES[i];
      if (ws.x < camL - 20 || ws.x > camR + 20) continue;
      const sz = ws.size || 3;
      ctx.fillRect(ws.x - sz * 0.5, ws.y - sz * 0.5, sz, sz);
    }
  }

  ctx.restore();
}

export function resetArena3RenderCache() {
  _leftCliffCache = null;
  _rightCliffCache = null;
  _cachedLeftTowerCanvas = null;
  _cachedRightTowerCanvas = null;
  _cachedPylonLeftCanvas = null;
  _cachedPylonRightCanvas = null;
  _cachedLeftStiltsCanvas = null;
  _cachedRightStiltsCanvas = null;
  _cachedLeftApproachDeckCanvas = null;
  _cachedRightApproachDeckCanvas = null;
}

// Pomocnicze funkcje przecięcia promienia pocisku (swept segment)
