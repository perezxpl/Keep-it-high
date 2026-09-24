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

// ==========================================
// SYSTEM BIOMÓW (ZMIANA CO 1000 METRÓW)
// ==========================================
function hexToRgb(hex) {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.substring(0, 2), 16),
    g: parseInt(c.substring(2, 4), 16),
    b: parseInt(c.substring(4, 6), 16)
  };
}

function lerpRgb(c1, c2, t) {
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function lerpRgba(c1, c2, t, alpha) {
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const BIOMES = [
  {
    id: 0,
    name: 'MURAWA',
    uiColor: '#4caf50',
    skyHex: ['#0c1626', '#1b2d45', '#2e496b', '#3f5e82'],
    groundBaseHex: '#1b5e20',
    groundTopHex: '#2e7d32',
    particleColors: ['#4caf50', '#66bb6a', '#388e3c'],
    sunAuraRgb: { r: 255, g: 214, b: 153 },
    sunGlowRgb: { r: 255, g: 183, b: 77 },
    sunCoreHex: '#fffde7',
    cloudShadowRgb: { r: 165, g: 195, b: 225 },
    cloudHighlightRgb: { r: 255, g: 255, b: 255 }
  },
  {
    id: 1,
    name: 'PUSTYNIA',
    uiColor: '#fbc02d',
    skyHex: ['#1e3a5f', '#d84315', '#f57c00', '#ffe082'],
    groundBaseHex: '#c29b38',
    groundTopHex: '#e0bb53',
    particleColors: ['#e0bb53', '#c29b38', '#ffe082', '#d7ccc8'],
    sunAuraRgb: { r: 255, g: 171, b: 64 },
    sunGlowRgb: { r: 255, g: 145, b: 0 },
    sunCoreHex: '#fff9c4',
    cloudShadowRgb: { r: 215, g: 185, b: 145 },
    cloudHighlightRgb: { r: 255, g: 248, b: 225 }
  },
  {
    id: 2,
    name: 'ZIMA',
    uiColor: '#81d4fa',
    skyHex: ['#1a2634', '#2c3e50', '#546e7a', '#b0bec5'],
    groundBaseHex: '#78909c',
    groundTopHex: '#eceff1',
    particleColors: ['#ffffff', '#eceff1', '#b3e5fc', '#e1f5fe'],
    sunAuraRgb: { r: 179, g: 229, b: 252 },
    sunGlowRgb: { r: 225, g: 245, b: 254 },
    sunCoreHex: '#ffffff',
    cloudShadowRgb: { r: 144, g: 164, b: 174 },
    cloudHighlightRgb: { r: 240, g: 244, b: 248 }
  },
  {
    id: 3,
    name: 'DŻUNGLA',
    uiColor: '#69f0ae',
    skyHex: ['#05180f', '#0d2b1b', '#19442a', '#285e3b'],
    groundBaseHex: '#2e1c0c',
    groundTopHex: '#2e7d32',
    particleColors: ['#43a047', '#2e7d32', '#66bb6a', '#33691e', '#5d4037'],
    sunAuraRgb: { r: 165, g: 214, b: 167 },
    sunGlowRgb: { r: 200, g: 230, b: 201 },
    sunCoreHex: '#f1f8e9',
    cloudShadowRgb: { r: 120, g: 160, b: 135 },
    cloudHighlightRgb: { r: 220, g: 245, b: 230 }
  },
  {
    id: 4,
    name: 'PIEKŁO',
    uiColor: '#ff5252',
    skyHex: ['#0a0203', '#2b0609', '#750d0d', '#ff3d00'],
    groundBaseHex: '#1a0f0f',
    groundTopHex: '#ff3d00',
    particleColors: ['#ff3d00', '#ff6d00', '#ffab00', '#ffd600'],
    sunAuraRgb: { r: 255, g: 61, b: 0 },
    sunGlowRgb: { r: 255, g: 109, b: 0 },
    sunCoreHex: '#fff3e0',
    cloudShadowRgb: { r: 80, g: 35, b: 35 },
    cloudHighlightRgb: { r: 210, g: 160, b: 160 }
  }
];

// Pre-parsowanie składowych RGB do szybkiego blendingu
for (const b of BIOMES) {
  b.skyRgb = b.skyHex.map(hexToRgb);
  b.groundBaseRgb = hexToRgb(b.groundBaseHex);
  b.groundTopRgb = hexToRgb(b.groundTopHex);
  b.sunCoreRgb = hexToRgb(b.sunCoreHex);
}

const BIOME_STEP = 800; // Zmiana biomów co 800 metrów

export function getCurrentBiome(dist) {
  const index = Math.min(BIOMES.length - 1, Math.max(0, Math.floor(dist / BIOME_STEP)));
  return BIOMES[index];
}

export function getInterpolatedBiome(dist) {
  const baseIndex = Math.min(BIOMES.length - 1, Math.max(0, Math.floor(dist / BIOME_STEP)));
  const nextIndex = Math.min(BIOMES.length - 1, baseIndex + 1);

  if (baseIndex === nextIndex) {
    const b = BIOMES[baseIndex];
    return {
      name: b.name,
      uiColor: b.uiColor,
      sky: b.skyHex,
      groundBase: b.groundBaseHex,
      groundTop: b.groundTopHex,
      sunAura: (a) => `rgba(${b.sunAuraRgb.r}, ${b.sunAuraRgb.g}, ${b.sunAuraRgb.b}, ${a})`,
      sunGlow: (a) => `rgba(${b.sunGlowRgb.r}, ${b.sunGlowRgb.g}, ${b.sunGlowRgb.b}, ${a})`,
      sunCore: b.sunCoreHex,
      cloudShadow: (a) => `rgba(${b.cloudShadowRgb.r}, ${b.cloudShadowRgb.g}, ${b.cloudShadowRgb.b}, ${a})`,
      cloudHighlight: (a) => `rgba(${b.cloudHighlightRgb.r}, ${b.cloudHighlightRgb.g}, ${b.cloudHighlightRgb.b}, ${a})`,
      particleColors: b.particleColors
    };
  }

  // Płynny lerp kolorów przez 50 metrów przed zmianą biomu (np. 750–800m, 1550–1600m...)
  const distInKm = dist % BIOME_STEP;
  const TRANSITION_ZONE = 50;
  let t = 0;
  if (distInKm >= BIOME_STEP - TRANSITION_ZONE) {
    t = (distInKm - (BIOME_STEP - TRANSITION_ZONE)) / TRANSITION_ZONE;
    t = Math.max(0, Math.min(1, t));
  }

  const b1 = BIOMES[baseIndex];
  const b2 = BIOMES[nextIndex];

  if (t === 0) {
    return {
      name: b1.name,
      uiColor: b1.uiColor,
      sky: b1.skyHex,
      groundBase: b1.groundBaseHex,
      groundTop: b1.groundTopHex,
      sunAura: (a) => `rgba(${b1.sunAuraRgb.r}, ${b1.sunAuraRgb.g}, ${b1.sunAuraRgb.b}, ${a})`,
      sunGlow: (a) => `rgba(${b1.sunGlowRgb.r}, ${b1.sunGlowRgb.g}, ${b1.sunGlowRgb.b}, ${a})`,
      sunCore: b1.sunCoreHex,
      cloudShadow: (a) => `rgba(${b1.cloudShadowRgb.r}, ${b1.cloudShadowRgb.g}, ${b1.cloudShadowRgb.b}, ${a})`,
      cloudHighlight: (a) => `rgba(${b1.cloudHighlightRgb.r}, ${b1.cloudHighlightRgb.g}, ${b1.cloudHighlightRgb.b}, ${a})`,
      particleColors: b1.particleColors
    };
  }

  return {
    name: t >= 0.5 ? b2.name : b1.name,
    uiColor: t >= 0.5 ? b2.uiColor : b1.uiColor,
    sky: [
      lerpRgb(b1.skyRgb[0], b2.skyRgb[0], t),
      lerpRgb(b1.skyRgb[1], b2.skyRgb[1], t),
      lerpRgb(b1.skyRgb[2], b2.skyRgb[2], t),
      lerpRgb(b1.skyRgb[3], b2.skyRgb[3], t)
    ],
    groundBase: lerpRgb(b1.groundBaseRgb, b2.groundBaseRgb, t),
    groundTop: lerpRgb(b1.groundTopRgb, b2.groundTopRgb, t),
    sunAura: (a) => lerpRgba(b1.sunAuraRgb, b2.sunAuraRgb, t, a),
    sunGlow: (a) => lerpRgba(b1.sunGlowRgb, b2.sunGlowRgb, t, a),
    sunCore: lerpRgb(b1.sunCoreRgb, b2.sunCoreRgb, t),
    cloudShadow: (a) => lerpRgba(b1.cloudShadowRgb, b2.cloudShadowRgb, t, a),
    cloudHighlight: (a) => lerpRgba(b1.cloudHighlightRgb, b2.cloudHighlightRgb, t, a),
    particleColors: t >= 0.5 ? b2.particleColors : b1.particleColors
  };
}

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
  const biome = getInterpolatedBiome(currentDist);
  const cols = biome.particleColors;
  const col = cols[Math.floor(Math.random() * cols.length)];

  for (let i = 0; i < 2; i++) {
    grassParticles.push({
      x: x + (Math.random() * 8 - 4),
      y: y - 2,
      vx: -dir * (Math.random() * 3.5 + 1.2) + (Math.random() * 1.5 - 0.75),
      vy: -(Math.random() * 3.2 + 1.2),
      size: Math.random() * 2.8 + 1.6,
      life: 1.0,
      color: col
    });
  }
}

export const snowFlurryParticles = [];
export const confettiParticles = [];
let confettiTriggered = false;

function triggerConfettiCannon() {
  const enterX = START_X + 300 * 14; // 4360 px
  const colors = ['#00e5ff', '#ffc107', '#2979ff', '#ffffff', '#00e676', '#38bdf8', '#e040fb'];
  
  const cannons = [
    { x: enterX - 85, dir: 1 },
    { x: enterX + 85, dir: -1 }
  ];

  for (let c of cannons) {
    for (let i = 0; i < 75; i++) {
      const angle = (c.dir === 1 ? -Math.PI * 0.35 : -Math.PI * 0.65) + (Math.random() - 0.5) * 0.45;
      const speed = Math.random() * 9 + 6;
      confettiParticles.push({
        x: c.x + (Math.random() * 20 - 10),
        y: GROUND_Y - 140 + (Math.random() * 20 - 10),
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
        vy: Math.sin(angle) * speed,
        w: Math.random() * 4 + 4,
        h: Math.random() * 7 + 5,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.28,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        decay: Math.random() * 0.003 + 0.002,
        landed: false
      });
    }
  }
}

// ==========================================
// ==========================================
// PUSTYNIA: GWAŁTOWNA ZAMIEĆ PIASKOWA ORAZ WIELKA PIRAMIDA (800 – 1599 m)
// ==========================================
export const PYRAMID_ENTER_DIST = 1050; // Portal wejściowy do piramidy na 1050 m
export const PYRAMID_EXIT_DIST = 1350;  // Portal wyjściowy z piramidy na 1350 m (dokładnie 300 m wewnątrz)
export const PYRAMID_LENGTH_M = 300;
export const PYRAMID_ENTER_X = START_X + PYRAMID_ENTER_DIST * 14; // 14860 px
export const PYRAMID_EXIT_X = START_X + PYRAMID_EXIT_DIST * 14;   // 19060 px
export const PYRAMID_CENTER_X = (PYRAMID_ENTER_X + PYRAMID_EXIT_X) / 2; // 16960 px
export const PYRAMID_BASE_WIDTH = 5600; // Podstawa monumentalnej piramidy (400 metrów)
export const PYRAMID_HEIGHT = 780;      // Wysokość szczytu sięgająca nieba (780 px)

/**
 * Płynny współczynnik przebywania wewnątrz piramidy (0.0 na zewnątrz do 1.0 wewnątrz)
 */
export function getPyramidInsideFactor(dist) {
  const d = (dist !== undefined) ? dist : currentDist;
  if (d < 1045 || d > 1355) return 0;
  if (d < 1065) return (d - 1045) / 20;
  if (d > 1335) return 1.0 - (d - 1335) / 20;
  return 1.0;
}

// ----------------------------------------------------
// 1. ZAMIEĆ PIASKOWA (DESERT SANDSTORM)
// ----------------------------------------------------
export const sandstormClouds = [];
export const desertClouds = sandstormClouds; // alias dla kompatybilności wstecznej
export const desertWisps = sandstormClouds;  // alias dla kompatybilności wstecznej
export const sandstormGrains = [];
export const desertSpecks = sandstormGrains; // alias dla kompatybilności wstecznej
export const sandstormForegroundGrains = [];
export const tombDustMotes = [];

const SANDSTORM_CLOUDS_COUNT = 32;
const SANDSTORM_GRAINS_COUNT = 180;
const SANDSTORM_FG_COUNT = 20;
const TOMB_DUST_COUNT = 45;

const SAND_COLORS = ['#e0a96d', '#d4a373', '#c28b51', '#f4d06f'];

function getDesertViewBounds() {
  const zoom = (camera && camera.zoom) ? camera.zoom : 0.85;
  const camX = (camera && camera.x !== undefined) ? camera.x : 0;
  const camY = (camera && camera.y !== undefined) ? camera.y : GROUND_Y;

  const left = camX - (W * 0.40) / zoom - 250;
  const right = camX + (W * 0.60) / zoom + 250;
  const top = camY - (H * 0.68) / zoom - 150;
  const bottom = camY + (H * 0.32) / zoom + 150;

  return { left, right, top, bottom };
}

export function getSandstormWindForce(now) {
  // Porywisty wiatr pustynny: oscylacja bazowa + dynamiczne porywy i zawirowania
  const baseGust = Math.sin(now * 0.0012) * 0.25 + Math.cos(now * 0.00045 + 0.9) * 0.35;
  const squall = Math.pow(Math.max(0, Math.sin(now * 0.0007 + 1.2)), 3) * 0.8;
  return Math.max(0.75, Math.min(2.5, 1.15 + baseGust + squall));
}

function resetSandstormCloud(c, worldRight, bounds, initialX) {
  const b = bounds || getDesertViewBounds();
  const spanY = Math.max(200, b.bottom - b.top);

  if (initialX !== undefined) {
    c.x = initialX;
  } else {
    c.x = worldRight + 20 + Math.random() * 200;
  }

  c.y = b.top + Math.random() * spanY;
  c.r = Math.random() * 90 + 90; // promień 90 – 180 px
  c.scaleX = Math.random() * 0.8 + 2.4; // 2.4 – 3.2 (aerodynamiczne rozciągnięcie huraganowym wiatrem)
  c.scaleY = Math.random() * 0.15 + 0.55; // 0.55 – 0.70
  c.baseVx = -(Math.random() * 5.0 + 4.5);
  c.vy = (Math.random() - 0.5) * 0.35 + 0.10;
  c.alpha = Math.random() * 0.08 + 0.11; // krycie 0.11 – 0.19
  c.phase = Math.random() * Math.PI * 2;
  c.tilt = -(Math.random() * 0.04 + 0.02);
}

function resetSandstormGrain(p, bounds, initialX) {
  const b = bounds || getDesertViewBounds();
  const spanY = Math.max(200, b.bottom - b.top);
  const wWidth = Math.max(800, b.right - b.left);

  if (initialX !== undefined) {
    p.x = initialX;
    p.y = b.top + Math.random() * spanY;
  } else {
    if (Math.random() < 0.75) {
      p.x = b.right + Math.random() * 120;
      p.y = b.top + Math.random() * spanY;
    } else {
      p.x = b.left + Math.random() * wWidth;
      p.y = b.top - Math.random() * 60;
    }
  }

  const rnd = Math.random();
  if (rnd < 0.35) {
    // 0: Drobny pył zawieszony w powietrzu
    p.type = 0;
    p.size = Math.random() * 0.6 + 1.0; // 1.0 - 1.6 px
    p.baseVx = -(Math.random() * 5.0 + 8.0);
    p.baseVy = Math.random() * 1.2 + 0.5;
    p.alpha = Math.random() * 0.25 + 0.30;
  } else if (rnd < 0.65) {
    // 1: Wyraziste ziarna piasku pędzące z wiatrem
    p.type = 1;
    p.size = Math.random() * 1.2 + 1.8; // 1.8 - 3.0 px
    p.baseVx = -(Math.random() * 7.0 + 11.0);
    p.baseVy = Math.random() * 1.8 + 0.9;
    p.alpha = Math.random() * 0.35 + 0.45;
  } else if (rnd < 0.85) {
    // 2: Pędząca smuga piasku (speed streak)
    p.type = 2;
    p.size = 1.4;
    p.streakLen = Math.random() * 14 + 14;
    p.baseVx = -(Math.random() * 9.0 + 15.0);
    p.baseVy = Math.random() * 1.5 + 0.8;
    p.alpha = Math.random() * 0.30 + 0.50;
  } else {
    // 3: Przygruntowy wir piaskowy nad wydmami
    p.type = 3;
    p.y = GROUND_Y - Math.random() * 26;
    p.size = Math.random() * 1.2 + 1.6;
    p.baseVx = -(Math.random() * 8.0 + 12.0);
    p.baseVy = (Math.random() - 0.5) * 0.4;
    p.alpha = Math.random() * 0.30 + 0.50;
  }

  p.color = SAND_COLORS[Math.floor(Math.random() * SAND_COLORS.length)];
  p.phase = Math.random() * Math.PI * 2;
}

function resetSandstormForegroundGrain(p, bounds, initialX) {
  const b = bounds || getDesertViewBounds();
  const spanY = Math.max(200, b.bottom - b.top);

  if (initialX !== undefined) {
    p.x = initialX;
  } else {
    p.x = b.right + 20 + Math.random() * 150;
  }

  p.y = b.top + Math.random() * spanY;
  p.size = Math.random() * 2.5 + 3.0; // 3.0 - 5.5 px (rozmyte optycznie przed obiektywem)
  p.baseVx = -(Math.random() * 9.0 + 16.0);
  p.baseVy = Math.random() * 2.5 + 1.8;
  p.alpha = Math.random() * 0.30 + 0.30;
  p.color = SAND_COLORS[Math.floor(Math.random() * SAND_COLORS.length)];
  p.phase = Math.random() * Math.PI * 2;
}

function resetTombDustMote(p, bounds, initialX) {
  const b = bounds || getDesertViewBounds();
  const spanY = Math.max(160, b.bottom - b.top);
  const wWidth = Math.max(600, b.right - b.left);

  p.x = (initialX !== undefined) ? initialX : b.left + Math.random() * wWidth;
  p.y = b.top + Math.random() * spanY;
  p.size = Math.random() * 1.2 + 1.2;
  p.vx = (Math.random() - 0.5) * 0.35 + 0.15;
  p.vy = (Math.random() - 0.5) * 0.30 - 0.12;
  p.alpha = Math.random() * 0.20 + 0.18;
  p.color = Math.random() < 0.6 ? '#f4d06f' : '#ecd29b';
  p.phase = Math.random() * Math.PI * 2;
}

export function initDesertSandstormPool(worldLeft, worldRight) {
  const bounds = getDesertViewBounds();
  const left = (worldLeft !== undefined) ? worldLeft : bounds.left;
  const right = (worldRight !== undefined) ? worldRight : bounds.right;
  const wWidth = Math.max(800, right - left);
  const spanY = Math.max(200, bounds.bottom - bounds.top);

  sandstormClouds.length = 0;
  for (let i = 0; i < SANDSTORM_CLOUDS_COUNT; i++) {
    const c = {};
    const initX = left + Math.random() * wWidth;
    resetSandstormCloud(c, right, bounds, initX);
    const slot = (i + Math.random() * 0.8) / SANDSTORM_CLOUDS_COUNT;
    c.y = bounds.top + slot * spanY;
    sandstormClouds.push(c);
  }

  sandstormGrains.length = 0;
  for (let i = 0; i < SANDSTORM_GRAINS_COUNT; i++) {
    const p = {};
    const initX = left + Math.random() * wWidth;
    resetSandstormGrain(p, bounds, initX);
    sandstormGrains.push(p);
  }

  sandstormForegroundGrains.length = 0;
  for (let i = 0; i < SANDSTORM_FG_COUNT; i++) {
    const p = {};
    const initX = left + Math.random() * wWidth;
    resetSandstormForegroundGrain(p, bounds, initX);
    sandstormForegroundGrains.push(p);
  }

  tombDustMotes.length = 0;
  for (let i = 0; i < TOMB_DUST_COUNT; i++) {
    const p = {};
    const initX = left + Math.random() * wWidth;
    resetTombDustMote(p, bounds, initX);
    tombDustMotes.push(p);
  }
}
export const initDesertWindPool = initDesertSandstormPool;

export function clearDesertSandstorm() {
  if (sandstormClouds.length > 0) sandstormClouds.length = 0;
  if (sandstormGrains.length > 0) sandstormGrains.length = 0;
  if (sandstormForegroundGrains.length > 0) sandstormForegroundGrains.length = 0;
  if (tombDustMotes.length > 0) tombDustMotes.length = 0;
}
export const clearDesertWind = clearDesertSandstorm;

export function updateDesertSandstorm() {
  if (currentDist < 800 || currentDist > 1599) {
    clearDesertSandstorm();
    return;
  }

  const bounds = getDesertViewBounds();

  if (sandstormClouds.length === 0) {
    initDesertSandstormPool(bounds.left, bounds.right);
  }

  const now = performance.now();
  const windForce = getSandstormWindForce(now);
  const spanY = Math.max(200, bounds.bottom - bounds.top);
  const insideFactor = getPyramidInsideFactor(currentDist);

  // 1. Aktualizacja monumentalnych tumanów i kłębów pyłu w tle
  for (let i = 0; i < sandstormClouds.length; i++) {
    const c = sandstormClouds[i];
    c.x += c.baseVx * windForce;
    c.y += c.vy + Math.sin(now * 0.002 + c.phase) * 0.35;

    if (c.y < bounds.top - 70) {
      c.vy = Math.abs(c.vy);
    } else if (c.y > bounds.bottom + 70) {
      c.vy = -Math.abs(c.vy);
    }

    const halfW = c.r * c.scaleX;
    if (c.x + halfW < bounds.left - 60) {
      resetSandstormCloud(c, bounds.right, bounds);
    } else if (c.x > bounds.right + 450 || c.x < bounds.left - 750) {
      c.x = bounds.left + Math.random() * (bounds.right - bounds.left);
      c.y = bounds.top + Math.random() * spanY;
    }
  }

  // 2. Aktualizacja cząsteczek ziaren piasku
  for (let i = 0; i < sandstormGrains.length; i++) {
    const p = sandstormGrains[i];
    p.x += p.baseVx * windForce;
    p.y += p.baseVy;

    if (p.type === 3) {
      // Przygruntowy wir piaskowy tuż nad wydmą
      if (p.y > GROUND_Y + 1 || p.y < GROUND_Y - 32) {
        p.y = GROUND_Y - Math.random() * 24;
      }
    } else {
      p.y += Math.sin(now * 0.0035 + p.phase) * 0.45;
    }

    if (p.x < bounds.left - 50 || p.y > bounds.bottom + 50) {
      resetSandstormGrain(p, bounds);
    }
  }

  // 3. Aktualizacja cząsteczek piasku na pierwszym planie
  for (let i = 0; i < sandstormForegroundGrains.length; i++) {
    const p = sandstormForegroundGrains[i];
    p.x += p.baseVx * windForce;
    p.y += p.baseVy;
    p.y += Math.sin(now * 0.0028 + p.phase) * 0.55;

    if (p.x < bounds.left - 60 || p.y > bounds.bottom + 60) {
      resetSandstormForegroundGrain(p, bounds);
    }
  }

  // 4. Aktualizacja delikatnego kurzu unoszącego się we wnętrzu piramidy
  if (insideFactor > 0.02) {
    for (let i = 0; i < tombDustMotes.length; i++) {
      const p = tombDustMotes[i];
      p.x += p.vx;
      p.y += p.vy + Math.sin(now * 0.002 + p.phase) * 0.2;

      // Zawracanie w granicach kadru wnętrza
      if (p.x < bounds.left - 20) p.x = bounds.right + 20;
      if (p.x > bounds.right + 20) p.x = bounds.left - 20;
      if (p.y < bounds.top - 20 || p.y > bounds.bottom + 20) {
        p.y = bounds.top + Math.random() * spanY;
      }
    }
  }
}
export const updateDesertWind = updateDesertSandstorm;

export function drawDesertSandstorm(ctx, worldLeft, worldRight) {
  if (currentDist < 800 || currentDist > 1599) return;

  const bounds = getDesertViewBounds();
  const wl = (worldLeft !== undefined) ? worldLeft : bounds.left;
  const wr = (worldRight !== undefined) ? worldRight : bounds.right;

  if (sandstormClouds.length === 0) {
    initDesertSandstormPool(wl, wr);
  }

  const now = performance.now();
  const insideFactor = getPyramidInsideFactor(currentDist);
  const sandstormIntensity = 1.0 - insideFactor;

  ctx.save();

  // A. Pełnoekranowa ciepła mgła pyłowa (Ambient Dust Haze Overlay)
  if (sandstormIntensity > 0.02) {
    ctx.save();
    ctx.resetTransform();
    ctx.scale(DPR, DPR);

    const hazeAlpha = 0.18 * sandstormIntensity;
    ctx.fillStyle = `rgba(224, 169, 109, ${hazeAlpha})`;
    ctx.fillRect(0, 0, W, H);

    // Ograniczenie widoczności horyzontu przez unoszący się pył
    const horizGrad = ctx.createLinearGradient(0, H * 0.35, 0, H);
    horizGrad.addColorStop(0, 'rgba(224, 169, 109, 0)');
    horizGrad.addColorStop(0.7, `rgba(212, 163, 115, ${0.14 * sandstormIntensity})`);
    horizGrad.addColorStop(1.0, `rgba(194, 139, 81, ${0.18 * sandstormIntensity})`);
    ctx.fillStyle = horizGrad;
    ctx.fillRect(0, H * 0.35, W, H * 0.65);

    ctx.restore();
  }

  // B. Kłęby i aerodynamiczne tumany pyłu pustynnego w tle
  if (sandstormIntensity > 0.02) {
    for (let i = 0; i < sandstormClouds.length; i++) {
      const c = sandstormClouds[i];
      const halfW = c.r * c.scaleX;
      if (c.x + halfW < wl - 60 || c.x - halfW > wr + 60) continue;

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.tilt);

      const pulse = Math.sin(now * 0.0018 + c.phase) * 0.06;
      ctx.scale(c.scaleX + pulse, c.scaleY - pulse * 0.4);

      const radGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, c.r);
      const effAlpha = c.alpha * sandstormIntensity;
      radGrad.addColorStop(0, `rgba(224, 169, 109, ${effAlpha})`);
      radGrad.addColorStop(0.5, `rgba(212, 163, 115, ${effAlpha * 0.55})`);
      radGrad.addColorStop(1, 'rgba(224, 169, 109, 0)');

      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(0, 0, c.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // C. Zróżnicowane ziarna piasku i pędzące smugi
  if (sandstormIntensity > 0.02) {
    for (let i = 0; i < sandstormGrains.length; i++) {
      const p = sandstormGrains[i];
      if (p.x < wl - 40 || p.x > wr + 40) continue;

      const alpha = p.alpha * sandstormIntensity;

      if (p.type === 2) {
        // Pędząca smuga piasku (speed streak)
        ctx.strokeStyle = `rgba(244, 208, 111, ${alpha})`;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.streakLen, p.y - p.streakLen * 0.12);
        ctx.stroke();
      } else if (p.type === 3) {
        // Przygruntowy wir piaskowy
        ctx.fillStyle = `rgba(212, 163, 115, ${alpha})`;
        ctx.fillRect(p.x, p.y, p.size * 1.5, p.size * 0.8);
      } else {
        // Drobne i wyraziste ziarenka piasku
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1.0;
      }
    }
  }

  // D. Delikatny, unoszący się w powietrzu kurz we wnętrzu piramidy (Tomb Dust Motes)
  if (insideFactor > 0.02) {
    for (let i = 0; i < tombDustMotes.length; i++) {
      const p = tombDustMotes[i];
      if (p.x < wl - 20 || p.x > wr + 20) continue;

      const glimmer = Math.sin(now * 0.003 + p.phase) * 0.25 + 0.75;
      const alpha = p.alpha * insideFactor * glimmer;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  }

  ctx.restore();
}
export const drawDesertWind = drawDesertSandstorm;

export function drawDesertSandstormForeground(ctx, worldLeft, worldRight) {
  if (currentDist < 800 || currentDist > 1599) return;
  const insideFactor = getPyramidInsideFactor(currentDist);
  const sandstormIntensity = 1.0 - insideFactor;
  if (sandstormIntensity <= 0.02) return;

  const wl = worldLeft;
  const wr = worldRight;

  ctx.save();
  for (let i = 0; i < sandstormForegroundGrains.length; i++) {
    const p = sandstormForegroundGrains[i];
    if (p.x < wl - 30 || p.x > wr + 30) continue;

    ctx.save();
    ctx.translate(p.x, p.y);

    const radGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
    const alpha = p.alpha * sandstormIntensity;
    radGrad.addColorStop(0, `rgba(244, 208, 111, ${alpha})`);
    radGrad.addColorStop(0.5, `rgba(224, 169, 109, ${alpha * 0.5})`);
    radGrad.addColorStop(1, 'rgba(194, 139, 81, 0)');

    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// ----------------------------------------------------
// 2. WIELKA PIRAMIDA: DETALE ARCHITEKTONICZNE I PROCEDURALNE
// ----------------------------------------------------

/**
 * Proceduralny rysownik starożytnych egipskich symboli hieroglificznych
 */
function drawHieroglyphSymbol(ctx, type, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;

  if (type === 0) {
    // Ankh (Klucz Życia)
    ctx.beginPath();
    ctx.ellipse(cx, cy - size * 0.45, size * 0.28, size * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.45, cy - size * 0.1);
    ctx.lineTo(cx + size * 0.45, cy - size * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.1);
    ctx.lineTo(cx, cy + size * 0.65);
    ctx.stroke();
  } else if (type === 1) {
    // Oko Horusa (Wedjat)
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.5, cy);
    ctx.quadraticCurveTo(cx, cy - size * 0.45, cx + size * 0.5, cy);
    ctx.quadraticCurveTo(cx, cy + size * 0.35, cx - size * 0.5, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.05, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.5, cy - size * 0.35);
    ctx.quadraticCurveTo(cx, cy - size * 0.65, cx + size * 0.55, cy - size * 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.15, cy + size * 0.18);
    ctx.lineTo(cx - size * 0.15, cy + size * 0.55);
    ctx.moveTo(cx + size * 0.15, cy + size * 0.18);
    ctx.quadraticCurveTo(cx + size * 0.4, cy + size * 0.35, cx + size * 0.25, cy + size * 0.6);
    ctx.stroke();
  } else if (type === 2) {
    // Skarabeusz (Khepri) z dyskiem słonecznym
    ctx.beginPath();
    ctx.ellipse(cx, cy + size * 0.1, size * 0.3, size * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffc107';
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.45, size * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.25, cy - size * 0.1);
    ctx.lineTo(cx - size * 0.55, cy - size * 0.4);
    ctx.moveTo(cx + size * 0.25, cy - size * 0.1);
    ctx.lineTo(cx + size * 0.55, cy - size * 0.4);
    ctx.moveTo(cx - size * 0.3, cy + size * 0.2);
    ctx.lineTo(cx - size * 0.6, cy + size * 0.35);
    ctx.moveTo(cx + size * 0.3, cy + size * 0.2);
    ctx.lineTo(cx + size * 0.6, cy + size * 0.35);
    ctx.stroke();
  } else if (type === 3) {
    // Filar Dżed (Djed Pillar)
    ctx.fillRect(cx - size * 0.12, cy - size * 0.3, size * 0.24, size * 0.9);
    for (let r = 0; r < 4; r++) {
      const ry = cy - size * 0.45 + r * size * 0.18;
      ctx.fillRect(cx - size * 0.45, ry, size * 0.9, size * 0.1);
    }
  } else if (type === 4) {
    // Święty Sokół Horusa
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.2, cy + size * 0.5);
    ctx.lineTo(cx - size * 0.35, cy + size * 0.1);
    ctx.quadraticCurveTo(cx - size * 0.4, cy - size * 0.35, cx - size * 0.1, cy - size * 0.45);
    ctx.lineTo(cx + size * 0.35, cy - size * 0.35);
    ctx.lineTo(cx + size * 0.1, cy - size * 0.2);
    ctx.quadraticCurveTo(cx + size * 0.35, cy + size * 0.2, cx + size * 0.4, cy + size * 0.55);
    ctx.lineTo(cx - size * 0.2, cy + size * 0.5);
    ctx.fill();
  } else {
    // Królewski Kartusz
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(cx - size * 0.4, cy - size * 0.55, size * 0.8, size * 1.0, size * 0.35);
    } else {
      ctx.rect(cx - size * 0.4, cy - size * 0.55, size * 0.8, size * 1.0);
    }
    ctx.stroke();
    ctx.fillRect(cx - size * 0.45, cy + size * 0.5, size * 0.9, size * 0.12);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(cx - size * 0.2, cy - size * 0.3, size * 0.4, size * 0.1);
    ctx.fillRect(cx - size * 0.15, cy - size * 0.1, size * 0.3, size * 0.1);
  }

  ctx.restore();
}

/**
 * Scena ścienna: płaskorzeźba faraona i bóstwa
 */
function drawWallMuralScene(ctx, mx, gy) {
  ctx.save();
  ctx.fillStyle = 'rgba(43, 23, 14, 0.45)';
  ctx.fillRect(mx - 75, gy - 240, 150, 110);
  ctx.strokeStyle = '#c28b51';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(mx - 75, gy - 240, 150, 110);

  // Faraon z darami (kwiatami lotosu)
  ctx.fillStyle = '#deb887';
  ctx.fillRect(mx - 48, gy - 195, 20, 38);
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(mx - 50, gy - 165, 24, 22);
  ctx.fillStyle = '#deb887';
  ctx.fillRect(mx - 47, gy - 143, 8, 25);
  ctx.fillRect(mx - 38, gy - 143, 8, 25);

  ctx.strokeStyle = '#deb887';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(mx - 38, gy - 190);
  ctx.lineTo(mx - 15, gy - 198);
  ctx.lineTo(mx - 5, gy - 212);
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(mx - 5, gy - 215, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#deb887';
  ctx.beginPath();
  ctx.arc(mx - 38, gy - 208, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(mx - 45, gy - 216, 14, 9);
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(mx - 44, gy - 218, 12, 3);

  // Ołtarz ofiarny pośrodku
  ctx.fillStyle = '#8d6338';
  ctx.fillRect(mx - 4, gy - 175, 16, 45);
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(mx - 7, gy - 178, 22, 5);

  // Siedzące bóstwo (Ozyrys)
  ctx.fillStyle = '#388e3c';
  ctx.fillRect(mx + 22, gy - 195, 18, 38);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(mx + 18, gy - 165, 26, 35);
  ctx.fillStyle = '#6d4c2b';
  ctx.fillRect(mx + 16, gy - 130, 32, 12);
  ctx.fillRect(mx + 42, gy - 180, 8, 50);

  ctx.fillStyle = '#388e3c';
  ctx.beginPath();
  ctx.arc(mx + 30, gy - 206, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(mx + 25, gy - 212);
  ctx.lineTo(mx + 30, gy - 235);
  ctx.lineTo(mx + 35, gy - 212);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Wnęka ceremonialna ze złotym sarkofagiem królewskim
 */
function drawSarcophagusNiche(ctx, sx, gy) {
  ctx.save();
  const nw = 68;
  const nh = 175;
  const ny = gy - nh - 10;

  ctx.fillStyle = '#140a05';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(sx - nw / 2, ny, nw, nh, [24, 24, 0, 0]);
  } else {
    ctx.rect(sx - nw / 2, ny, nw, nh);
  }
  ctx.fill();
  ctx.strokeStyle = '#8d6338';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Złocony sarkofag antropoidowy
  const sarcW = 42;
  const sarcH = 145;
  const sarcY = gy - sarcH - 12;

  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.moveTo(sx - 14, sarcY + 22);
  ctx.quadraticCurveTo(sx - 21, sarcY + 45, sx - 16, sarcY + 95);
  ctx.lineTo(sx - 12, sarcY + sarcH);
  ctx.lineTo(sx + 12, sarcY + sarcH);
  ctx.lineTo(sx + 16, sarcY + 95);
  ctx.quadraticCurveTo(sx + 21, sarcY + 45, sx + 14, sarcY + 22);
  ctx.quadraticCurveTo(sx, sarcY + 12, sx - 14, sarcY + 22);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2.5;
  for (let b = 1; b <= 7; b++) {
    const by = sarcY + 48 + b * 11;
    ctx.beginPath();
    ctx.moveTo(sx - 16 + b * 0.5, by);
    ctx.lineTo(sx + 16 - b * 0.5, by);
    ctx.stroke();
  }

  // Złota maska grobowa i broda
  ctx.fillStyle = '#ffe082';
  ctx.beginPath();
  ctx.arc(sx, sarcY + 28, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(sx - 7, sarcY + 26, 4, 2);
  ctx.fillRect(sx + 3, sarcY + 26, 4, 2);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(sx - 2, sarcY + 36, 4, 10);

  // Skrzyżowane berła królewskie (heka i nekhakha)
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx - 12, sarcY + 62); ctx.lineTo(sx + 10, sarcY + 44);
  ctx.moveTo(sx + 12, sarcY + 62); ctx.lineTo(sx - 10, sarcY + 44);
  ctx.stroke();

  ctx.fillStyle = '#6d4c2b';
  ctx.fillRect(sx - 20, gy - 12, 40, 10);

  ctx.restore();
}

/**
 * Kolumny papirusowe z rzeźbionym kapitelem podtrzymujące strop
 */
function drawPapyrusColumn(ctx, cx, gy, isForeground) {
  ctx.save();
  const colW = isForeground ? 48 : 34;
  const colH = 340;
  const topY = gy - colH;

  // Cokół kolumny
  ctx.fillStyle = isForeground ? '#4a2c1d' : '#6d4c2b';
  ctx.fillRect(cx - colW * 0.65, gy - 20, colW * 1.3, 20);
  ctx.fillStyle = isForeground ? '#684126' : '#8d6338';
  ctx.fillRect(cx - colW * 0.55, gy - 26, colW * 1.1, 6);

  // Trzon kolumny
  const gradCol = ctx.createLinearGradient(cx - colW / 2, 0, cx + colW / 2, 0);
  if (isForeground) {
    gradCol.addColorStop(0, '#2b170e');
    gradCol.addColorStop(0.35, '#5c3d2e');
    gradCol.addColorStop(0.65, '#7a5230');
    gradCol.addColorStop(1, '#2b170e');
  } else {
    gradCol.addColorStop(0, '#3b2416');
    gradCol.addColorStop(0.35, '#6d4c2b');
    gradCol.addColorStop(0.65, '#8d6338');
    gradCol.addColorStop(1, '#3b2416');
  }
  ctx.fillStyle = gradCol;
  ctx.fillRect(cx - colW / 2, topY + 50, colW, colH - 76);

  // Złote obręcze
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(cx - colW / 2 - 1, topY + 80, colW + 2, 4);
  ctx.fillRect(cx - colW / 2 - 1, gy - 60, colW + 2, 4);

  // Kapitel kolumny w kształcie pąka lotosu
  ctx.fillStyle = isForeground ? '#684126' : '#8d6338';
  ctx.beginPath();
  ctx.moveTo(cx - colW / 2, topY + 50);
  ctx.quadraticCurveTo(cx - colW * 0.85, topY + 22, cx - colW * 0.75, topY);
  ctx.lineTo(cx + colW * 0.75, topY);
  ctx.quadraticCurveTo(cx + colW * 0.85, topY + 22, cx + colW / 2, topY + 50);
  ctx.closePath();
  ctx.fill();

  // Płatki lotosu
  ctx.fillStyle = isForeground ? '#ffd700' : '#d4a373';
  ctx.beginPath();
  ctx.moveTo(cx, topY + 45);
  ctx.lineTo(cx - colW * 0.35, topY + 8);
  ctx.lineTo(cx, topY);
  ctx.lineTo(cx + colW * 0.35, topY + 8);
  ctx.closePath();
  ctx.fill();

  // Architraw nad głowicą
  ctx.fillStyle = isForeground ? '#3b2416' : '#5c3d2e';
  ctx.fillRect(cx - colW * 0.85, topY - 14, colW * 1.7, 14);

  ctx.restore();
}

/**
 * Pochodnie ścienne z animowanym wielowarstwowym płomieniem i ciepłą radialną poświatą
 */
function drawWallTorch(ctx, tx, gy, now) {
  ctx.save();
  const torchY = gy - 130;

  // Kuty brązowy uchwyt ścienny
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(tx - 3, torchY + 12, 6, 22);
  ctx.beginPath();
  ctx.moveTo(tx - 3, torchY + 34);
  ctx.lineTo(tx + 12, torchY + 18);
  ctx.lineTo(tx + 8, torchY + 18);
  ctx.lineTo(tx - 3, torchY + 28);
  ctx.fill();

  // Drewniany trzonek pochodni
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(tx - 3, torchY, 6, 16);

  // Głowica pochodni
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(tx - 5, torchY - 8, 10, 10);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(tx - 4, torchY - 6, 8, 6);

  // Animacja płomienia
  const seed = tx * 0.08;
  const flickX = Math.sin(now * 0.007 + seed) * 2.2 + Math.cos(now * 0.013 + seed * 2) * 1.2;
  const flickY = Math.cos(now * 0.008 + seed) * 3.5;
  const flameH = 26 + flickY;

  // Zewnętrzny język ognia
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.moveTo(tx - 5, torchY - 6);
  ctx.quadraticCurveTo(tx - 8 + flickX * 0.5, torchY - flameH * 0.5, tx + flickX, torchY - flameH);
  ctx.quadraticCurveTo(tx + 8 + flickX * 0.5, torchY - flameH * 0.5, tx + 5, torchY - 6);
  ctx.closePath();
  ctx.fill();

  // Środkowy płomień
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(tx - 3.5, torchY - 6);
  ctx.quadraticCurveTo(tx - 5 + flickX * 0.5, torchY - flameH * 0.45, tx + flickX * 0.8, torchY - flameH * 0.82);
  ctx.quadraticCurveTo(tx + 5 + flickX * 0.5, torchY - flameH * 0.45, tx + 3.5, torchY - 6);
  ctx.closePath();
  ctx.fill();

  // Rdzeń płomienia
  ctx.fillStyle = '#fffbeb';
  ctx.beginPath();
  ctx.moveTo(tx - 2, torchY - 6);
  ctx.quadraticCurveTo(tx - 3, torchY - flameH * 0.3, tx + flickX * 0.5, torchY - flameH * 0.5);
  ctx.quadraticCurveTo(tx + 3, torchY - flameH * 0.3, tx + 2, torchY - 6);
  ctx.closePath();
  ctx.fill();

  // Unoszące się iskry
  for (let s = 0; s < 3; s++) {
    const spPhase = now * 0.004 + seed + s * 2.1;
    const spY = torchY - 14 - ((now * 0.05 + s * 18 + seed * 20) % 45);
    const spX = tx + Math.sin(spPhase) * 6 + flickX * 0.5;
    const spAlpha = Math.max(0, 1.0 - (torchY - spY) / 45);
    ctx.fillStyle = `rgba(254, 240, 138, ${spAlpha})`;
    ctx.fillRect(spX - 1, spY - 1, 2, 2);
  }

  // RadialGradient ciepłego światła pochodni
  const pulseR = 210 + Math.sin(now * 0.006 + seed) * 18;
  const torchGlow = ctx.createRadialGradient(tx, torchY - 8, 8, tx, torchY - 8, pulseR);
  torchGlow.addColorStop(0, 'rgba(255, 175, 45, 0.38)');
  torchGlow.addColorStop(0.35, 'rgba(255, 115, 20, 0.16)');
  torchGlow.addColorStop(0.7, 'rgba(180, 50, 10, 0.05)');
  torchGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = torchGlow;
  ctx.beginPath();
  ctx.arc(tx, torchY - 8, pulseR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Posąg strażnika faraona / sfinksa wykuty z piaskowca i granitu
 */
function drawColossalGuardianStatue(ctx, sx, gy, facingLeft) {
  ctx.save();
  ctx.translate(sx, gy);
  if (facingLeft) ctx.scale(-1, 1);

  // Piedestał
  ctx.fillStyle = '#4a2c1d';
  ctx.fillRect(-20, -18, 45, 18);
  ctx.fillStyle = '#6d4c2b';
  ctx.fillRect(-18, -22, 41, 4);

  // Siedząca postać
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(5, -60, 16, 40);
  ctx.fillRect(-12, -75, 30, 20);
  ctx.fillRect(-16, -125, 24, 55);

  ctx.fillStyle = '#8d6338';
  ctx.fillRect(-8, -95, 28, 10);

  ctx.fillStyle = '#7a5230';
  ctx.beginPath();
  ctx.arc(-4, -138, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.moveTo(-16, -145);
  ctx.lineTo(8, -145);
  ctx.lineTo(12, -120);
  ctx.lineTo(-4, -125);
  ctx.lineTo(-20, -120);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#3b2416';
  ctx.fillRect(2, -130, 4, 14);

  ctx.restore();
}

/**
 * Monumentalne pylony portalu z nadprożem i skrzydlatym dyskiem słońca
 */
function drawPortalPylons(ctx, px, gy, isExit) {
  ctx.save();
  const pylonW = 75;
  const pylonH = 310;
  const gateW = 220;
  const leftX = px - gateW / 2;
  const rightX = px + gateW / 2 - pylonW;

  const drawPylon = (x, isRight) => {
    const batter = 14;
    ctx.fillStyle = isExit ? '#8d6338' : '#a67c52';
    ctx.beginPath();
    ctx.moveTo(x + (isRight ? batter : 0), gy - pylonH);
    ctx.lineTo(x + pylonW - (isRight ? 0 : batter), gy - pylonH);
    ctx.lineTo(x + pylonW, gy);
    ctx.lineTo(x, gy);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#5c3d2e';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(60, 36, 22, 0.35)';
    ctx.lineWidth = 1;
    for (let y = gy - pylonH + 25; y < gy; y += 22) {
      ctx.beginPath();
      ctx.moveTo(x + 2, y);
      ctx.lineTo(x + pylonW - 2, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x - 3, gy - pylonH - 8, pylonW + 6, 8);
    ctx.fillStyle = '#6d4c2b';
    ctx.fillRect(x - 6, gy - pylonH - 18, pylonW + 12, 10);
  };

  drawPylon(leftX, false);
  drawPylon(rightX, true);

  // Kamienne nadproże portalu
  const lintelY = gy - pylonH - 22;
  const lintelH = 58;
  const lintelX = leftX - 10;
  const lintelW = (rightX + pylonW) - leftX + 20;

  ctx.fillStyle = '#7a5230';
  ctx.fillRect(lintelX, lintelY, lintelW, lintelH);
  ctx.strokeStyle = '#4a2c1d';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(lintelX, lintelY, lintelW, lintelH);

  // Skrzydlaty Dysk Słońca
  const midX = px;
  const diskY = lintelY + 28;

  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.moveTo(midX, diskY);
  ctx.quadraticCurveTo(midX - 45, diskY - 14, midX - 95, diskY);
  ctx.quadraticCurveTo(midX - 45, diskY + 8, midX, diskY + 4);
  ctx.moveTo(midX, diskY);
  ctx.quadraticCurveTo(midX + 45, diskY - 14, midX + 95, diskY);
  ctx.quadraticCurveTo(midX + 45, diskY + 8, midX, diskY + 4);
  ctx.fill();

  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(midX, diskY, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#ffd700';
  ctx.fillRect(midX - 16, diskY - 5, 4, 10);
  ctx.fillRect(midX + 12, diskY - 5, 4, 10);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(isExit ? '★ WYJŚCIE • KRES GROBOWCA ★' : '★ WIELKA PIRAMIDA • 1050M ★', px, lintelY + 50);
  ctx.textAlign = 'left';

  // Wnętrze otworu bramy
  const archW = 120;
  const archH = 225;
  const archX = px - archW / 2;
  const archY = gy - archH;

  if (!isExit) {
    const darkGrad = ctx.createLinearGradient(archX, 0, archX + archW, 0);
    darkGrad.addColorStop(0, '#100704');
    darkGrad.addColorStop(0.5, '#050201');
    darkGrad.addColorStop(1, '#100704');
    ctx.fillStyle = darkGrad;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(archX, archY, archW, archH, [30, 30, 0, 0]);
    } else {
      ctx.rect(archX, archY, archW, archH);
    }
    ctx.fill();
  } else {
    const sunExitGrad = ctx.createRadialGradient(px, gy - archH * 0.5, 10, px, gy - archH * 0.5, archW * 1.5);
    sunExitGrad.addColorStop(0, 'rgba(255, 255, 245, 0.95)');
    sunExitGrad.addColorStop(0.35, 'rgba(255, 235, 150, 0.75)');
    sunExitGrad.addColorStop(0.7, 'rgba(245, 175, 60, 0.40)');
    sunExitGrad.addColorStop(1, 'rgba(212, 163, 115, 0.0)');
    ctx.fillStyle = sunExitGrad;
    ctx.fillRect(archX - 50, archY - 30, archW + 100, archH + 40);
  }

  // Posągi strażników po bokach
  drawColossalGuardianStatue(ctx, leftX - 45, gy, false);
  drawColossalGuardianStatue(ctx, rightX + pylonW + 15, gy, true);

  ctx.restore();
}

/**
 * Przednia warstwa portalu wejściowego
 */
function drawEntrancePortalForeground(ctx, enterX, gy) {
  const pylonW = 75;
  const gateW = 220;
  const leftX = enterX - gateW / 2;
  const rightX = enterX + gateW / 2 - pylonW;

  ctx.fillStyle = '#5c3d2e';
  ctx.fillRect(leftX, gy - 310, pylonW * 0.45, 310);
  ctx.fillRect(rightX + pylonW * 0.55, gy - 310, pylonW * 0.45, 310);
}

/**
 * Przednia warstwa portalu wyjściowego z oślepiającym światłem pustynnego słońca
 */
function drawExitPortalForeground(ctx, exitX, gy) {
  const pylonW = 75;
  const gateW = 220;
  const leftX = exitX - gateW / 2;
  const rightX = exitX + gateW / 2 - pylonW;

  ctx.fillStyle = '#6d4c2b';
  ctx.fillRect(leftX, gy - 310, pylonW * 0.45, 310);
  ctx.fillRect(rightX + pylonW * 0.55, gy - 310, pylonW * 0.45, 310);

  // Snop jasnego światła słonecznego wdzierający się do grobowca
  const now = performance.now();
  const rayShimmer = Math.sin(now * 0.003) * 0.08 + 0.92;

  const rayGrad = ctx.createLinearGradient(exitX, gy - 120, exitX - 320, gy - 120);
  rayGrad.addColorStop(0, `rgba(255, 255, 245, ${0.85 * rayShimmer})`);
  rayGrad.addColorStop(0.3, `rgba(255, 235, 160, ${0.55 * rayShimmer})`);
  rayGrad.addColorStop(0.7, `rgba(244, 208, 111, ${0.22 * rayShimmer})`);
  rayGrad.addColorStop(1, 'rgba(212, 163, 115, 0)');

  ctx.fillStyle = rayGrad;
  ctx.beginPath();
  ctx.moveTo(exitX, gy - 230);
  ctx.lineTo(exitX - 320, gy - 270);
  ctx.lineTo(exitX - 320, gy);
  ctx.lineTo(exitX, gy);
  ctx.closePath();
  ctx.fill();

  const sunFlare = ctx.createRadialGradient(exitX, gy - 110, 15, exitX, gy - 110, 220);
  sunFlare.addColorStop(0, `rgba(255, 255, 255, ${0.90 * rayShimmer})`);
  sunFlare.addColorStop(0.35, `rgba(255, 245, 180, ${0.60 * rayShimmer})`);
  sunFlare.addColorStop(0.7, `rgba(255, 215, 0, ${0.25 * rayShimmer})`);
  sunFlare.addColorStop(1, 'rgba(255, 215, 0, 0)');

  ctx.fillStyle = sunFlare;
  ctx.beginPath();
  ctx.arc(exitX, gy - 110, 220, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Sylwetka Wielkiej Piramidy na horyzoncie nieba (warstwa paralaksy)
 */
export function drawDistantPyramidParallax(ctx, currentDist) {
  const insideFactor = getPyramidInsideFactor(currentDist);
  if (insideFactor >= 0.99) return;

  const camX = camera ? camera.x : 0;
  const horizonX = W * 0.55 - (camX - START_X - 1000 * 14) * 0.05;
  const horizonY = H * 0.65;
  const pyrW = 520;
  const pyrH = 260;
  const peakX = horizonX;
  const peakY = horizonY - pyrH;
  const leftX = horizonX - pyrW * 0.6;
  const rightX = horizonX + pyrW * 0.4;
  const ridgeX = horizonX - pyrW * 0.08;

  ctx.save();
  ctx.globalAlpha = (1.0 - insideFactor) * 0.85;

  // Oświetlona lewa ściana
  const litGrad = ctx.createLinearGradient(leftX, horizonY, ridgeX, peakY);
  litGrad.addColorStop(0, '#c28b51');
  litGrad.addColorStop(0.5, '#deb887');
  litGrad.addColorStop(1, '#f5c270');
  ctx.fillStyle = litGrad;
  ctx.beginPath();
  ctx.moveTo(leftX, horizonY);
  ctx.lineTo(peakX, peakY);
  ctx.lineTo(ridgeX, horizonY);
  ctx.closePath();
  ctx.fill();

  // Zacieniona prawa ściana
  const shadowGrad = ctx.createLinearGradient(ridgeX, peakY, rightX, horizonY);
  shadowGrad.addColorStop(0, '#8d6338');
  shadowGrad.addColorStop(1, '#5c3d2e');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.moveTo(ridgeX, horizonY);
  ctx.lineTo(peakX, peakY);
  ctx.lineTo(rightX, horizonY);
  ctx.closePath();
  ctx.fill();

  // Warstwy stopni kamiennych
  ctx.strokeStyle = 'rgba(60, 36, 22, 0.25)';
  ctx.lineWidth = 1;
  for (let s = 1; s <= 18; s++) {
    const t = s / 19;
    const sy = peakY + (horizonY - peakY) * t;
    const lx = peakX + (leftX - peakX) * t;
    const rx = peakX + (rightX - peakX) * t;
    ctx.beginPath();
    ctx.moveTo(lx, sy);
    ctx.lineTo(rx, sy);
    ctx.stroke();
  }

  // Złoty Pyramidion na szczycie z poświatą
  const capH = 24;
  const capT = capH / pyrH;
  const capLeft = peakX + (leftX - peakX) * capT;
  const capRight = peakX + (rightX - peakX) * capT;
  const capRidge = peakX + (ridgeX - peakX) * capT;
  const capY = peakY + capH;

  const goldGrad = ctx.createLinearGradient(capLeft, capY, capRight, peakY);
  goldGrad.addColorStop(0, '#ffd700');
  goldGrad.addColorStop(0.5, '#fff9c4');
  goldGrad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = goldGrad;
  ctx.beginPath();
  ctx.moveTo(capLeft, capY);
  ctx.lineTo(peakX, peakY);
  ctx.lineTo(capRight, capY);
  ctx.lineTo(capRidge, capY);
  ctx.closePath();
  ctx.fill();

  const now = performance.now();
  const gleam = Math.sin(now * 0.003) * 0.5 + 0.5;
  const glint = ctx.createRadialGradient(peakX, peakY, 0, peakX, peakY, 35);
  glint.addColorStop(0, `rgba(255, 255, 230, ${0.7 * gleam})`);
  glint.addColorStop(0.4, `rgba(255, 215, 0, ${0.4 * gleam})`);
  glint.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = glint;
  ctx.beginPath();
  ctx.arc(peakX, peakY, 35, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Monumentalna fasada zewnętrzna Wielkiej Piramidy w skali 1:1
 */
export function drawPyramidExterior(ctx, worldLeft, worldRight) {
  const enterX = PYRAMID_ENTER_X;
  const exitX = PYRAMID_EXIT_X;
  const centerX = PYRAMID_CENTER_X;
  const baseLeft = enterX - 850;
  const baseRight = exitX + 850;
  const gy = GROUND_Y;
  const apexY = gy - PYRAMID_HEIGHT;
  const ridgeX = centerX - 120;

  if (baseRight < worldLeft - 200 || baseLeft > worldRight + 200) return;

  ctx.save();

  // 1. Oświetlona ściana piramidy (lewa fasetka)
  const litGrad = ctx.createLinearGradient(baseLeft, gy, ridgeX, apexY);
  litGrad.addColorStop(0, '#ecd29b');
  litGrad.addColorStop(0.4, '#deb887');
  litGrad.addColorStop(1, '#fae19c');
  ctx.fillStyle = litGrad;
  ctx.beginPath();
  ctx.moveTo(baseLeft, gy);
  ctx.lineTo(centerX, apexY);
  ctx.lineTo(ridgeX, gy);
  ctx.closePath();
  ctx.fill();

  // 2. Zacieniona ściana piramidy (prawa fasetka)
  const shadowGrad = ctx.createLinearGradient(ridgeX, apexY, baseRight, gy);
  shadowGrad.addColorStop(0, '#8d6338');
  shadowGrad.addColorStop(0.6, '#6d4c2b');
  shadowGrad.addColorStop(1, '#4a2c1d');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.moveTo(ridgeX, gy);
  ctx.lineTo(centerX, apexY);
  ctx.lineTo(baseRight, gy);
  ctx.closePath();
  ctx.fill();

  // 3. Poziome rzędy bloków piaskowca i spoiny kamienne
  ctx.lineWidth = 1;
  const totalCourses = 42;
  for (let c = 1; c < totalCourses; c++) {
    const t = c / totalCourses;
    const cy = apexY + PYRAMID_HEIGHT * t;
    const lx = centerX + (baseLeft - centerX) * t;
    const rx = centerX + (baseRight - centerX) * t;
    const mx = centerX + (ridgeX - centerX) * t;

    // Krawędź oświetlona
    ctx.strokeStyle = 'rgba(74, 44, 29, 0.35)';
    ctx.beginPath();
    ctx.moveTo(lx, cy);
    ctx.lineTo(mx, cy);
    ctx.stroke();

    // Krawędź zacieniona
    ctx.strokeStyle = 'rgba(30, 16, 10, 0.45)';
    ctx.beginPath();
    ctx.moveTo(mx, cy);
    ctx.lineTo(rx, cy);
    ctx.stroke();
  }

  // 4. Złote zwieńczenie na szczycie (Pyramidion)
  const capH = 65;
  const capT = capH / PYRAMID_HEIGHT;
  const capLeft = centerX + (baseLeft - centerX) * capT;
  const capRight = centerX + (baseRight - centerX) * capT;
  const capRidge = centerX + (ridgeX - centerX) * capT;
  const capY = apexY + capH;

  const goldCap = ctx.createLinearGradient(capLeft, capY, capRight, apexY);
  goldCap.addColorStop(0, '#ffd700');
  goldCap.addColorStop(0.4, '#fff9c4');
  goldCap.addColorStop(0.8, '#f59e0b');
  goldCap.addColorStop(1, '#b45309');
  ctx.fillStyle = goldCap;
  ctx.beginPath();
  ctx.moveTo(capLeft, capY);
  ctx.lineTo(centerX, apexY);
  ctx.lineTo(capRight, capY);
  ctx.lineTo(capRidge, capY);
  ctx.closePath();
  ctx.fill();

  // Błysk i snopy światła pyramidionu
  const now = performance.now();
  const gleam = Math.sin(now * 0.003) * 0.5 + 0.5;
  const glint = ctx.createRadialGradient(centerX, apexY, 0, centerX, apexY, 70);
  glint.addColorStop(0, `rgba(255, 255, 235, ${0.85 * gleam})`);
  glint.addColorStop(0.4, `rgba(255, 215, 0, ${0.45 * gleam})`);
  glint.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = glint;
  ctx.beginPath();
  ctx.arc(centerX, apexY, 70, 0, Math.PI * 2);
  ctx.fill();

  // 5. Monumentalny portal wejściowy na 1050 m
  if (enterX >= worldLeft - 300 && enterX <= worldRight + 300) {
    drawPortalPylons(ctx, enterX, gy, false);
  }

  // 6. Monumentalny portal wyjściowy na 1350 m
  if (exitX >= worldLeft - 300 && exitX <= worldRight + 300) {
    drawPortalPylons(ctx, exitX, gy, true);
  }

  ctx.restore();
}

/**
 * Wnętrze komory grobowej Wielkiej Piramidy (sekcja trwająca dokładnie 300 m)
 */
export function drawPyramidInterior(ctx, worldLeft, worldRight) {
  const enterX = PYRAMID_ENTER_X;
  const exitX = PYRAMID_EXIT_X;
  const gy = GROUND_Y;

  if (exitX < worldLeft - 100 || enterX > worldRight + 100) return;

  const startX = Math.max(enterX, worldLeft - 50);
  const endX = Math.min(exitX, worldRight + 50);
  if (startX >= endX) return;

  ctx.save();
  const now = performance.now();

  // 1. Potężne kamienne ściany grobowca z bloków piaskowca
  const wallTop = gy - 320;
  const wallH = 320;

  const wallGrad = ctx.createLinearGradient(0, wallTop, 0, gy);
  wallGrad.addColorStop(0, '#2b170e');
  wallGrad.addColorStop(0.4, '#3b2416');
  wallGrad.addColorStop(0.8, '#5c3d2e');
  wallGrad.addColorStop(1, '#4a2c1d');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(startX, wallTop, endX - startX, wallH);

  // Ułożone warstwy bloków megalitycznych
  const blockH = 28;
  const firstRow = Math.floor(wallTop / blockH) * blockH;
  for (let by = firstRow; by < gy; by += blockH) {
    if (by < wallTop - 10) continue;
    const isRowAlt = (Math.floor(by / blockH) % 2 === 0);
    const blockW = isRowAlt ? 75 : 95;
    const firstCol = Math.floor(startX / blockW) * blockW;

    ctx.strokeStyle = '#24140b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(startX, by);
    ctx.lineTo(endX, by);
    ctx.stroke();

    for (let bx = firstCol; bx <= endX; bx += blockW) {
      if (bx < enterX || bx > exitX) continue;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx, by + blockH);
      ctx.stroke();

      // Subtelny relief krawędzi bloku
      ctx.strokeStyle = 'rgba(212, 163, 115, 0.12)';
      ctx.beginPath();
      ctx.moveTo(bx + 1, by + 1);
      ctx.lineTo(bx + blockW - 1, by + 1);
      ctx.stroke();
    }
  }

  // 2. Pasy hieroglifów na ścianach
  const friezeY1 = gy - 215;
  const friezeY2 = gy - 145;

  ctx.fillStyle = 'rgba(255, 215, 0, 0.18)';
  ctx.fillRect(startX, friezeY1 - 12, endX - startX, 24);
  ctx.fillRect(startX, friezeY2 - 12, endX - startX, 24);

  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(startX, friezeY1 - 12); ctx.lineTo(endX, friezeY1 - 12);
  ctx.moveTo(startX, friezeY1 + 12); ctx.lineTo(endX, friezeY1 + 12);
  ctx.moveTo(startX, friezeY2 - 12); ctx.lineTo(endX, friezeY2 - 12);
  ctx.moveTo(startX, friezeY2 + 12); ctx.lineTo(endX, friezeY2 + 12);
  ctx.stroke();

  // Symbole hieroglificzne wyryte na ścianach
  const glyphStep = 38;
  const firstGlyph = Math.floor(startX / glyphStep) * glyphStep;
  for (let gx = firstGlyph; gx <= endX; gx += glyphStep) {
    if (gx < enterX + 20 || gx > exitX - 20) continue;
    const type1 = Math.abs(Math.floor(gx / 38)) % 6;
    const type2 = Math.abs(Math.floor(gx / 38 + 2)) % 6;
    drawHieroglyphSymbol(ctx, type1, gx, friezeY1, 14, '#ffd54f');
    drawHieroglyphSymbol(ctx, type2, gx, friezeY2, 14, '#e0a96d');
  }

  // 3. Płaskorzeźby ścienne i sceny bóstw
  const muralStep = 240;
  const firstMural = Math.floor(startX / muralStep) * muralStep;
  for (let mx = firstMural; mx <= endX; mx += muralStep) {
    if (mx < enterX + 90 || mx > exitX - 90) continue;
    if (mx >= worldLeft - 100 && mx <= worldRight + 100) {
      drawWallMuralScene(ctx, mx, gy);
    }
  }

  // 4. Wnęki ze złoconymi sarkofagami
  const nicheStep = 560;
  const firstNiche = Math.floor(startX / nicheStep) * nicheStep + 280;
  for (let nx = firstNiche; nx <= endX; nx += nicheStep) {
    if (nx < enterX + 140 || nx > exitX - 140) continue;
    if (nx >= worldLeft - 60 && nx <= worldRight + 60) {
      drawSarcophagusNiche(ctx, nx, gy);
    }
  }

  // 5. Kamienne kolumny papirusowe podtrzymujące strop (tło)
  const colStep = 230;
  const firstCol = Math.floor(startX / colStep) * colStep;
  for (let cx = firstCol; cx <= endX; cx += colStep) {
    if (cx < enterX + 60 || cx > exitX - 60) continue;
    if (cx >= worldLeft - 60 && cx <= worldRight + 60) {
      drawPapyrusColumn(ctx, cx, gy, false);
    }
  }

  // 6. Oświetlenie pochodniami z animowanym płomieniem i poświatą
  const torchStep = 115;
  const firstTorch = Math.floor(startX / torchStep) * torchStep;
  for (let tx = firstTorch; tx <= endX; tx += torchStep) {
    if (tx < enterX + 40 || tx > exitX - 40) continue;
    if (tx >= worldLeft - 220 && tx <= worldRight + 220) {
      drawWallTorch(ctx, tx, gy, now);
    }
  }

  ctx.restore();
}

/**
 * Posadzka wnętrza piramidy ze starożytnych kamiennych płyt
 */
export function drawPyramidFloor(ctx, worldLeft, worldRight) {
  const enterX = PYRAMID_ENTER_X;
  const exitX = PYRAMID_EXIT_X;
  if (exitX < worldLeft - 60 || enterX > worldRight + 60) return;

  const startX = Math.max(enterX, worldLeft - 40);
  const endX = Math.min(exitX, worldRight + 40);
  if (startX >= endX) return;

  const gy = GROUND_Y;
  ctx.save();

  const slabW = 60;
  const slabH = 16;
  const firstSlab = Math.floor(startX / slabW) * slabW;

  for (let x = firstSlab; x <= endX; x += slabW) {
    if (x < enterX || x > exitX) continue;
    const isAlt = (Math.floor(x / slabW) % 2 === 0);
    ctx.fillStyle = isAlt ? '#7a5230' : '#6d4c2b';
    ctx.fillRect(x, gy, slabW - 2, slabH);

    ctx.fillStyle = isAlt ? '#9c6d3d' : '#8d6338';
    ctx.fillRect(x, gy, slabW - 2, 2.5);

    ctx.fillStyle = '#2b170e';
    ctx.fillRect(x + slabW - 2, gy, 2, slabH);
  }

  ctx.fillStyle = '#ffd700';
  ctx.fillRect(startX, gy, endX - startX, 2);

  const firstTile = Math.floor(startX / 120) * 120;
  for (let tx = firstTile; tx <= endX; tx += 120) {
    if (tx < enterX + 20 || tx > exitX - 20) continue;
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(tx + 20, gy + 3, 20, 8);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(tx + 22, gy + 5, 16, 4);
  }

  ctx.restore();
}

/**
 * Przednia warstwa piramidy: masywny sufit z kamiennych bloków, przednie kolumny i portale
 */
export function drawPyramidForeground(ctx, worldLeft, worldRight) {
  const enterX = PYRAMID_ENTER_X;
  const exitX = PYRAMID_EXIT_X;
  const gy = GROUND_Y;

  if (exitX < worldLeft - 100 || enterX > worldRight + 100) return;

  const startX = Math.max(enterX, worldLeft - 60);
  const endX = Math.min(exitX, worldRight + 60);
  if (startX >= endX) return;

  ctx.save();

  // 1. Masywny sufit z kamiennych bloków nad murawą
  const ceilingY = gy - 275;
  const ceilingH = 80;

  const ceilGrad = ctx.createLinearGradient(0, ceilingY - ceilingH, 0, ceilingY);
  ceilGrad.addColorStop(0, '#1c100a');
  ceilGrad.addColorStop(0.5, '#3b2416');
  ceilGrad.addColorStop(1, '#24140c');
  ctx.fillStyle = ceilGrad;
  ctx.fillRect(startX, ceilingY - ceilingH, endX - startX, ceilingH);

  // Poprzeczne belki stropowe
  const firstBeam = Math.floor(startX / 90) * 90;
  for (let bx = firstBeam; bx <= endX; bx += 90) {
    if (bx < enterX || bx > exitX) continue;
    ctx.fillStyle = '#1c100a';
    ctx.fillRect(bx, ceilingY - ceilingH, 14, ceilingH);
    ctx.fillStyle = '#5c3d2e';
    ctx.fillRect(bx + 14, ceilingY - ceilingH, 3, ceilingH);
  }

  // Rzeźbiony gzyms architrawu
  ctx.fillStyle = '#4a2c1d';
  ctx.fillRect(startX, ceilingY - 6, endX - startX, 8);
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(startX, ceilingY + 2, endX - startX, 2);

  // Cień rzucany ze stropu w dół na korytarz
  const dropShadow = ctx.createLinearGradient(0, ceilingY + 4, 0, ceilingY + 50);
  dropShadow.addColorStop(0, 'rgba(15, 8, 4, 0.70)');
  dropShadow.addColorStop(1, 'rgba(15, 8, 4, 0.0)');
  ctx.fillStyle = dropShadow;
  ctx.fillRect(startX, ceilingY + 4, endX - startX, 46);

  // 2. Przednie kolumny komory grobowej (pierwszy plan przed graczem)
  const firstCol = Math.floor(startX / 460) * 460;
  for (let cx = firstCol; cx <= endX; cx += 460) {
    if (cx < enterX + 180 || cx > exitX - 180) continue;
    if (cx >= worldLeft - 60 && cx <= worldRight + 60) {
      drawPapyrusColumn(ctx, cx, gy, true);
    }
  }

  // 3. Przednia warstwa portalu wejściowego na 1050 m
  if (enterX >= worldLeft - 200 && enterX <= worldRight + 200) {
    drawEntrancePortalForeground(ctx, enterX, gy);
  }

  // 4. Przednia warstwa portalu wyjściowego na 1350 m i wylewające się jasne słońce
  if (exitX >= worldLeft - 250 && exitX <= worldRight + 250) {
    drawExitPortalForeground(ctx, exitX, gy);
  }

  ctx.restore();
}


// ==========================================
// ==========================================
// POTĘŻNE POWIEWY ŚNIEGU I ZAMIECIA ŚNIEŻNA W TLE (1600 – 2399 m)
// ==========================================
export const blizzardClouds = [];
export const blizzardSnowflakes = [];
export const blizzardForegroundFlakes = [];

const BLIZZARD_CLOUDS_COUNT = 36;
const BLIZZARD_SNOWFLAKES_COUNT = 150;
const BLIZZARD_FG_COUNT = 18;

function getWinterViewBounds() {
  const zoom = (camera && camera.zoom) ? camera.zoom : 0.85;
  const camX = (camera && camera.x !== undefined) ? camera.x : 0;
  const camY = (camera && camera.y !== undefined) ? camera.y : GROUND_Y;

  // Pełny zakres widoku kamery w przestrzeni świata (od samego nieba po spód kadru)
  const left = camX - (W * 0.40) / zoom - 250;
  const right = camX + (W * 0.60) / zoom + 250;
  const top = camY - (H * 0.68) / zoom - 180;
  const bottom = camY + (H * 0.32) / zoom + 160;

  return { left, right, top, bottom };
}

export function getBlizzardWindForce(now) {
  // Porywisty wiatr arktyczny: bazowa oscylacja + cykliczne fale uderzeniowe zamieci
  const baseGust = Math.sin(now * 0.0011) * 0.25 + Math.cos(now * 0.00041 + 1.2) * 0.35;
  const squall = Math.pow(Math.max(0, Math.sin(now * 0.00072 + 0.6)), 3) * 0.75;
  return Math.max(0.75, Math.min(2.4, 1.1 + baseGust + squall));
}

export function clearWinterBlizzard() {
  if (blizzardClouds.length > 0) blizzardClouds.length = 0;
  if (blizzardSnowflakes.length > 0) blizzardSnowflakes.length = 0;
  if (blizzardForegroundFlakes.length > 0) blizzardForegroundFlakes.length = 0;
  if (snowFlurryParticles.length > 0) snowFlurryParticles.length = 0;
}

function resetBlizzardCloud(c, worldRight, bounds, initialX) {
  const b = bounds || getWinterViewBounds();
  const spanY = Math.max(200, b.bottom - b.top);

  if (initialX !== undefined) {
    c.x = initialX;
  } else {
    c.x = worldRight + 30 + Math.random() * 240;
  }

  // Rozmieszczenie na całej wysokości kadru od nieba po zmarzlinę
  c.y = b.top + Math.random() * spanY;
  c.r = Math.random() * 85 + 95; // promień 95 – 180 px
  c.scaleX = Math.random() * 1.5 + 3.2; // 3.2 – 4.7 (aerodynamiczne rozciągnięcie huraganowym wiatrem)
  c.scaleY = Math.random() * 0.16 + 0.38; // 0.38 – 0.54
  c.baseVx = -(Math.random() * 5.5 + 5.5); // bazowy pęd od -5.5 do -11.0 px/klatkę
  c.vy = (Math.random() - 0.5) * 0.3 + 0.12; // delikatny opad zacinającego śniegu
  c.alpha = Math.random() * 0.09 + 0.11; // krycie 0.11 – 0.20
  c.phase = Math.random() * Math.PI * 2;
  c.tilt = -(Math.random() * 0.04 + 0.02); // lekki kąt natarcia zamieci w kierunku pędu
}

function resetBlizzardSnowflake(p, bounds, initialX) {
  const b = bounds || getWinterViewBounds();
  const spanY = Math.max(200, b.bottom - b.top);
  const wWidth = Math.max(800, b.right - b.left);

  if (initialX !== undefined) {
    p.x = initialX;
    p.y = b.top + Math.random() * spanY;
  } else {
    // Respawn z prawej strony lub z góry ekranu
    if (Math.random() < 0.75) {
      p.x = b.right + Math.random() * 120;
      p.y = b.top + Math.random() * spanY;
    } else {
      p.x = b.left + Math.random() * wWidth;
      p.y = b.top - Math.random() * 60;
    }
  }

  // Typy cząsteczek zamieci:
  // 0: Drobny pył w tle, 1: Wyraziste płatki zamieci, 2: Pędzące igły lodu (linie wiatru), 3: Śnieg zamiatany przy zmarzlinie
  const rnd = Math.random();
  if (rnd < 0.35) {
    p.type = 0; // pył śnieżny
    p.size = Math.random() * 1.0 + 1.2;
    p.baseVx = -(Math.random() * 4.5 + 7.0);
    p.baseVy = Math.random() * 1.6 + 1.2;
    p.alpha = Math.random() * 0.3 + 0.35;
  } else if (rnd < 0.65) {
    p.type = 1; // wyrazisty płatek
    p.size = Math.random() * 1.8 + 2.2;
    p.baseVx = -(Math.random() * 7.0 + 9.5);
    p.baseVy = Math.random() * 2.5 + 2.0;
    p.alpha = Math.random() * 0.3 + 0.65;
  } else if (rnd < 0.85) {
    p.type = 2; // pędząca igła lodowa (streak)
    p.size = 1.4;
    p.streakLen = Math.random() * 16 + 16;
    p.baseVx = -(Math.random() * 9.0 + 15.0);
    p.baseVy = Math.random() * 1.8 + 1.2;
    p.alpha = Math.random() * 0.35 + 0.45;
  } else {
    p.type = 3; // przygruntowy wir śnieżny
    p.y = GROUND_Y - Math.random() * 25;
    p.size = Math.random() * 1.5 + 1.8;
    p.baseVx = -(Math.random() * 8.0 + 11.0);
    p.baseVy = (Math.random() - 0.5) * 0.4;
    p.alpha = Math.random() * 0.3 + 0.60;
  }

  p.phase = Math.random() * Math.PI * 2;
}

function resetBlizzardForegroundFlake(p, bounds, initialX) {
  const b = bounds || getWinterViewBounds();
  const spanY = Math.max(200, b.bottom - b.top);

  if (initialX !== undefined) {
    p.x = initialX;
  } else {
    p.x = b.right + 20 + Math.random() * 150;
  }

  p.y = b.top + Math.random() * spanY;
  p.size = Math.random() * 4.0 + 5.0; // 5.0 – 9.0 px (duże, rozmyte optycznie przed kamerą)
  p.baseVx = -(Math.random() * 8.0 + 15.0);
  p.baseVy = Math.random() * 3.0 + 2.5;
  p.alpha = Math.random() * 0.35 + 0.30;
  p.phase = Math.random() * Math.PI * 2;
}

export function initWinterBlizzardPool(worldLeft, worldRight) {
  const bounds = getWinterViewBounds();
  const left = (worldLeft !== undefined) ? worldLeft : bounds.left;
  const right = (worldRight !== undefined) ? worldRight : bounds.right;
  const wWidth = Math.max(800, right - left);
  const spanY = Math.max(200, bounds.bottom - bounds.top);

  blizzardClouds.length = 0;
  for (let i = 0; i < BLIZZARD_CLOUDS_COUNT; i++) {
    const c = {};
    const initX = left + Math.random() * wWidth;
    resetBlizzardCloud(c, right, bounds, initX);
    const slot = (i + Math.random() * 0.8) / BLIZZARD_CLOUDS_COUNT;
    c.y = bounds.top + slot * spanY;
    blizzardClouds.push(c);
  }

  blizzardSnowflakes.length = 0;
  for (let i = 0; i < BLIZZARD_SNOWFLAKES_COUNT; i++) {
    const p = {};
    const initX = left + Math.random() * wWidth;
    resetBlizzardSnowflake(p, bounds, initX);
    blizzardSnowflakes.push(p);
  }

  blizzardForegroundFlakes.length = 0;
  for (let i = 0; i < BLIZZARD_FG_COUNT; i++) {
    const p = {};
    const initX = left + Math.random() * wWidth;
    resetBlizzardForegroundFlake(p, bounds, initX);
    blizzardForegroundFlakes.push(p);
  }
}

export function updateWinterBlizzard() {
  if (currentDist < 1600) {
    clearWinterBlizzard();
    return; // Przed 1600 m (stadion i pustynia) zero śniegu
  }
  if (currentDist > 2399) {
    clearWinterBlizzard();
    return;
  }

  const bounds = getWinterViewBounds();

  if (blizzardClouds.length === 0) {
    initWinterBlizzardPool(bounds.left, bounds.right);
  }

  const now = performance.now();
  const windForce = getBlizzardWindForce(now);
  const spanY = Math.max(200, bounds.bottom - bounds.top);

  // 1. Aktualizacja monumentalnych tumanów i kłębów zamieci w tle
  for (let i = 0; i < blizzardClouds.length; i++) {
    const c = blizzardClouds[i];
    c.x += c.baseVx * windForce;
    c.y += c.vy + Math.sin(now * 0.0022 + c.phase) * 0.35;

    if (c.y < bounds.top - 80) {
      c.vy = Math.abs(c.vy);
    } else if (c.y > bounds.bottom + 80) {
      c.vy = -Math.abs(c.vy);
    }

    const halfW = c.r * c.scaleX;
    if (c.x + halfW < bounds.left - 60) {
      resetBlizzardCloud(c, bounds.right, bounds);
    } else if (c.x > bounds.right + 500 || c.x < bounds.left - 800) {
      c.x = bounds.left + Math.random() * (bounds.right - bounds.left);
      c.y = bounds.top + Math.random() * spanY;
    }
  }

  // 2. Aktualizacja pędzących płatków, igieł lodu i śniegu przygruntowego
  for (let i = 0; i < blizzardSnowflakes.length; i++) {
    const p = blizzardSnowflakes[i];
    p.x += p.baseVx * windForce;
    p.y += p.baseVy;

    if (p.type === 3) {
      // Przygruntowy śnieg - utrzymanie tuż nad zmrożonym podłożem
      if (p.y > GROUND_Y + 1 || p.y < GROUND_Y - 35) {
        p.y = GROUND_Y - Math.random() * 25;
      }
    } else {
      // Delikatne zawirowania wiatru
      p.y += Math.sin(now * 0.004 + p.phase) * 0.4;
    }

    if (p.x < bounds.left - 50 || p.y > bounds.bottom + 50) {
      resetBlizzardSnowflake(p, bounds);
    }
  }

  // 3. Aktualizacja dużych płatków na pierwszym planie
  for (let i = 0; i < blizzardForegroundFlakes.length; i++) {
    const p = blizzardForegroundFlakes[i];
    p.x += p.baseVx * windForce;
    p.y += p.baseVy;
    p.y += Math.sin(now * 0.003 + p.phase) * 0.5;

    if (p.x < bounds.left - 60 || p.y > bounds.bottom + 60) {
      resetBlizzardForegroundFlake(p, bounds);
    }
  }
}

export function drawWinterBlizzard(ctx, worldLeft, worldRight) {
  if (currentDist < 1600) {
    return; // Przed 1600 m (stadion i pustynia) zero śniegu
  }
  if (currentDist > 2399) {
    return;
  }

  const bounds = getWinterViewBounds();
  const wl = (worldLeft !== undefined) ? worldLeft : bounds.left;
  const wr = (worldRight !== undefined) ? worldRight : bounds.right;

  if (blizzardClouds.length === 0) {
    initWinterBlizzardPool(wl, wr);
  }

  const now = performance.now();
  const windForce = getBlizzardWindForce(now);

  ctx.save();

  // 1. Pełnoekranowa atmosfera zamieci (Ambient Blizzard Fog & Frost Tint)
  ctx.save();
  ctx.resetTransform();
  ctx.scale(DPR, DPR);

  // Mroźny, chłodny filtr śnieżycy pulsujący w rytm porywów wichury
  const hazeAlpha = 0.07 + (windForce - 1.0) * 0.035;
  ctx.fillStyle = `rgba(215, 238, 255, ${Math.min(0.18, Math.max(0.05, hazeAlpha))})`;
  ctx.fillRect(0, 0, W, H);

  // Mroźna winieta na obrzeżach ekranu (wrażenie zmrożonej soczewki/gogli)
  const frostGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.42, W * 0.5, H * 0.5, Math.max(W, H) * 0.74);
  frostGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  frostGrad.addColorStop(1, `rgba(186, 230, 253, ${0.07 + (windForce - 1.0) * 0.04})`);
  ctx.fillStyle = frostGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.restore();

  // 2. Potężne, aerodynamiczne kłęby i tumany zamieci śnieżnej w tle
  for (let i = 0; i < blizzardClouds.length; i++) {
    const c = blizzardClouds[i];
    const halfW = c.r * c.scaleX;
    if (c.x + halfW < wl - 60 || c.x - halfW > wr + 60) continue;

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.tilt);

    // Dynamiczna pulsacja tumanu pod naporem wiatru
    const pulse = Math.sin(now * 0.0022 + c.phase) * 0.08;
    ctx.scale(c.scaleX + pulse, c.scaleY - pulse * 0.3);

    const radGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, c.r);
    radGrad.addColorStop(0, `rgba(255, 255, 255, ${c.alpha})`);
    radGrad.addColorStop(0.45, `rgba(224, 242, 254, ${c.alpha * 0.65})`);
    radGrad.addColorStop(1, 'rgba(186, 230, 253, 0)');

    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(0, 0, c.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 3. Wielowarstwowa zawieja śnieżna: płatki, igły lodowe i przygruntowy śnieg w tle
  for (let i = 0; i < blizzardSnowflakes.length; i++) {
    const p = blizzardSnowflakes[i];
    if (p.x < wl - 40 || p.x > wr + 40) continue;

    if (p.type === 2) {
      // Dynamiczna linia pędu wiatru (lodowa igła)
      ctx.strokeStyle = `rgba(235, 248, 255, ${p.alpha})`;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.streakLen, p.y - p.streakLen * 0.14);
      ctx.stroke();
    } else if (p.type === 3) {
      // Przygruntowy puch śnieżny tuż nad zmarzliną
      ctx.fillStyle = `rgba(240, 249, 255, ${p.alpha})`;
      ctx.fillRect(p.x, p.y, p.size * 1.4, p.size * 0.7);
    } else {
      // Płatki śniegu
      ctx.fillStyle = `rgba(245, 250, 255, ${p.alpha})`;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }

  ctx.restore();
}

export function drawWinterBlizzardForeground(ctx, worldLeft, worldRight) {
  if (currentDist < 1600) {
    return; // Przed 1600 m (stadion i pustynia) zero śniegu
  }
  if (currentDist > 2399) {
    return;
  }

  const wl = worldLeft;
  const wr = worldRight;

  ctx.save();
  for (let i = 0; i < blizzardForegroundFlakes.length; i++) {
    const p = blizzardForegroundFlakes[i];
    if (p.x < wl - 30 || p.x > wr + 30) continue;

    ctx.save();
    ctx.translate(p.x, p.y);

    const radGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
    radGrad.addColorStop(0, `rgba(255, 255, 255, ${p.alpha})`);
    radGrad.addColorStop(0.5, `rgba(224, 242, 254, ${p.alpha * 0.5})`);
    radGrad.addColorStop(1, 'rgba(200, 235, 255, 0)');

    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
  ctx.restore();
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

  // Aktualizacja powiewów i drobin zamieci piaskowej w biomie pustynnym (800 – 1599 m)
  updateDesertSandstorm();

  // Aktualizacja potężnych powiewów śniegu i zamieci śnieżnej w biomie zimowym (1600 – 2399 m)
  updateWinterBlizzard();

  // Aktualizacja przelatujących samolotów w biomie murawy (0 – 799 m)
  updateAirplanes();

  // Wystrzał konfetti na powitanie przy wbiegnięciu na stadion (300 m)
  if (currentDist >= 300 && currentDist <= 330 && !confettiTriggered) {
    confettiTriggered = true;
    triggerConfettiCannon();
  }
  if (currentDist < 50) {
    confettiTriggered = false;
  }

  // Aktualizacja cząsteczek konfetti
  for (let i = confettiParticles.length - 1; i >= 0; i--) {
    const cp = confettiParticles[i];
    if (!cp.landed) {
      cp.x += cp.vx;
      cp.y += cp.vy;
      cp.vy += 0.14;
      cp.vx *= 0.985;
      cp.rot += cp.vrot;

      if (cp.y >= GROUND_Y - 1) {
        cp.y = GROUND_Y - 1;
        cp.landed = true;
        cp.vx = 0;
        cp.vy = 0;
      }
    }
    cp.life -= cp.decay;
    if (cp.life <= 0) {
      confettiParticles.splice(i, 1);
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

// ==========================================
// SAMOLOTY PRZELATUJĄCE NA NIEBIE (BIOM MURAWA: 0 – 799 m)
// ==========================================
export const airplane = {
  active: false,
  x: -200,
  yRel: 0.18,
  speed: 1.35,
  dir: 1, // 1: wschód (w prawo), -1: zachód (w lewo)
  scale: 1.0,
  angle: 0.015,
  cooldown: 180, // pierwsze pojawienie się po ~3 sekundach od startu
  strobeTimer: 0,
  contrailCounter: 0
};

export const airplaneContrails = [];

const AIRPLANE_PARALLAX = 0.06;

export function updateAirplanes() {
  // Izolacja do biomu murawy (0 – 799 m)
  if (currentDist >= 800) {
    if (airplane.active) airplane.active = false;
    if (airplaneContrails.length > 0) airplaneContrails.length = 0;
    airplane.cooldown = 400;
    return;
  }

  const camX = camera ? camera.x : 0;

  // 1. Obsługa stanu uśpienia i ponownego pojawiania się
  if (!airplane.active) {
    airplane.cooldown--;
    if (airplane.cooldown <= 0) {
      airplane.active = true;
      // 75% szansy na lot z zachodu na wschód (w stronę biegu gracza), 25% wschód -> zachód
      airplane.dir = Math.random() < 0.75 ? 1 : -1;
      airplane.yRel = Math.random() * 0.16 + 0.11; // 11% do 27% wysokości ekranu
      airplane.speed = Math.random() * 0.35 + 1.25; // spokojna prędkość przelotowa
      airplane.scale = Math.random() * 0.22 + 0.90;
      airplane.angle = (Math.random() - 0.5) * 0.03; // delikatne wznoszenie lub zniżanie
      airplane.strobeTimer = 0;
      airplane.contrailCounter = 0;

      if (airplane.dir === 1) {
        airplane.x = (camX * AIRPLANE_PARALLAX) - 220;
      } else {
        airplane.x = (camX * AIRPLANE_PARALLAX) + W + 220;
      }
    }
  }

  // 2. Aktualizacja aktywnego samolotu
  if (airplane.active) {
    airplane.x += airplane.speed * airplane.dir;
    airplane.strobeTimer = (airplane.strobeTimer + 1) % 70;

    const screenX = airplane.x - (camX * AIRPLANE_PARALLAX);
    const screenY = airplane.yRel * H;

    // Emisja smug kondensacyjnych z dwóch silników pod skrzydłami co 2 klatki
    airplane.contrailCounter++;
    if (airplane.contrailCounter % 2 === 0) {
      const cosA = Math.cos(airplane.angle);
      const sinA = Math.sin(airplane.angle);
      const s = airplane.scale;
      const d = airplane.dir;

      // Odsunięcie silnika 1 (górnego / dalszego w rzucie)
      const e1LocalX = -5 * d * s;
      const e1LocalY = -6.5 * s;
      const e1X = airplane.x + (e1LocalX * cosA - e1LocalY * sinA);
      const e1Y = screenY + (e1LocalX * sinA + e1LocalY * cosA);

      // Odsunięcie silnika 2 (dolnego / bliższego w rzucie)
      const e2LocalX = -4 * d * s;
      const e2LocalY = 7.5 * s;
      const e2X = airplane.x + (e2LocalX * cosA - e2LocalY * sinA);
      const e2Y = screenY + (e2LocalX * sinA + e2LocalY * cosA);

      airplaneContrails.push({
        skyX: e1X,
        skyY: e1Y,
        age: 0,
        maxAge: 300,
        baseAlpha: 0.35,
        initWidth: 1.6 * s,
        maxWidth: 7.5 * s
      });

      airplaneContrails.push({
        skyX: e2X,
        skyY: e2Y,
        age: 0,
        maxAge: 300,
        baseAlpha: 0.35,
        initWidth: 1.6 * s,
        maxWidth: 7.5 * s
      });
    }

    // Sprawdzenie wylotu poza kadr
    if (airplane.dir === 1 && screenX > W + 320) {
      airplane.active = false;
      airplane.cooldown = Math.random() * 900 + 700; // 12 do 27 sekund
    } else if (airplane.dir === -1 && screenX < -320) {
      airplane.active = false;
      airplane.cooldown = Math.random() * 900 + 700;
    }
  }

  // 3. Aktualizacja i powolne rozpraszanie smug kondensacyjnych
  for (let i = airplaneContrails.length - 1; i >= 0; i--) {
    const pt = airplaneContrails[i];
    pt.age++;
    if (pt.age >= pt.maxAge) {
      airplaneContrails.splice(i, 1);
    }
  }
}

function drawAirplaneShape(ctx, scale, dir, strobeOn) {
  ctx.save();
  ctx.scale(scale * dir, scale);

  // 1. Cień dolny kadłuba dający trójwymiarowość
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.ellipse(0, 1.6, 20, 2.4, 0, 0, Math.PI);
  ctx.fill();

  // 2. Elegancki kadłub odrzutowca pasażerskiego (czysta biel)
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(22, 0); // dziób
  ctx.quadraticCurveTo(15, -3.2, 0, -3.2); // grzbiet
  ctx.lineTo(-18, -1.8);
  ctx.lineTo(-20, -0.5);
  ctx.lineTo(-18, 1.2);
  ctx.lineTo(0, 2.5); // brzuch
  ctx.quadraticCurveTo(16, 2.5, 22, 0);
  ctx.closePath();
  ctx.fill();

  // 3. Przyciemniana szyba kokpitu
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(17, -1.8);
  ctx.lineTo(19, -0.6);
  ctx.lineTo(16, -0.6);
  ctx.lineTo(14, -1.8);
  ctx.closePath();
  ctx.fill();

  // 4. Dalekie skrzydło skośne (górne)
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(4, -2.5);
  ctx.lineTo(-4, -12);
  ctx.lineTo(-8, -11.5);
  ctx.lineTo(-3, -2.2);
  ctx.closePath();
  ctx.fill();

  // Daleki silnik
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.ellipse(0, -6.5, 4.5, 1.6, -0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#334155';
  ctx.fillRect(-4.5, -7.5, 1.5, 2);

  // 5. Statecznik pionowy (ogon) z cyjanowym paskiem Champions
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(-14, -1.8);
  ctx.lineTo(-20, -11);
  ctx.lineTo(-23, -11);
  ctx.lineTo(-19, -0.8);
  ctx.closePath();
  ctx.fill();

  // Statecznik poziomy
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(-16, -0.8);
  ctx.lineTo(-21, -3.5);
  ctx.lineTo(-23, -3.2);
  ctx.lineTo(-18, 0);
  ctx.closePath();
  ctx.fill();

  // 6. Bliższe skrzydło skośne (dolne)
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(6, 0.5);
  ctx.lineTo(-5, 14);
  ctx.lineTo(-9, 13.5);
  ctx.lineTo(-3, 1.2);
  ctx.closePath();
  ctx.fill();

  // Bliższy silnik odrzutowy
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.ellipse(1, 7.5, 5, 1.8, 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-4, 6.5, 1.5, 2);

  // 7. Światła nawigacyjne
  // Czerwone światło na lewym skrzydle
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(-6, -11.8, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Zielone światło na prawym skrzydle
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(-7, 13.8, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Biały stroboskop (błysk)
  if (strobeOn) {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(-21.5, -11, 2, 0, Math.PI * 2);
    ctx.arc(0, 3, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

export function drawAirplanes(ctx) {
  if (currentDist >= 800) return;

  const camX = camera ? camera.x : 0;

  // 1. Rysowanie smug kondensacyjnych (półprzezroczysta para rozpraszająca się w atmosferze)
  for (let i = 0; i < airplaneContrails.length; i++) {
    const pt = airplaneContrails[i];
    const sx = pt.skyX - (camX * AIRPLANE_PARALLAX);
    const sy = pt.skyY;
    if (sx < -120 || sx > W + 120) continue;

    const progress = pt.age / pt.maxAge;
    const alpha = (1.0 - progress) * pt.baseAlpha;
    const w = pt.initWidth + progress * (pt.maxWidth - pt.initWidth);

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, w * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Rysowanie aktywnego samolotu
  if (airplane.active) {
    const screenX = airplane.x - (camX * AIRPLANE_PARALLAX);
    const screenY = airplane.yRel * H;

    if (screenX >= -100 && screenX <= W + 100) {
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(airplane.angle * airplane.dir);

      const strobeOn = (airplane.strobeTimer < 6);
      drawAirplaneShape(ctx, airplane.scale, airplane.dir, strobeOn);

      ctx.restore();
    }
  }
}

// ==========================================
// CHMURY Z PARALAKSĄ
// ==========================================
const CLOUDS_CYCLE = 2600;

const CLOUD_DEFINITIONS = [
  // Warstwa dalsza (layer 0) - mniejsze, subtelniejsze, wolniejsza paralaksa
  { baseX: 120,  yRel: 0.08, scale: 0.85, layer: 0, opacity: 0.32 },
  { baseX: 760,  yRel: 0.15, scale: 0.95, layer: 0, opacity: 0.35 },
  { baseX: 1440, yRel: 0.09, scale: 0.80, layer: 0, opacity: 0.28 },
  { baseX: 2080, yRel: 0.14, scale: 0.90, layer: 0, opacity: 0.34 },

  // Warstwa bliższa (layer 1) - większe, puszyste, wyrazistsza paralaksa
  { baseX: 380,  yRel: 0.20, scale: 1.35, layer: 1, opacity: 0.48 },
  { baseX: 1040, yRel: 0.27, scale: 1.50, layer: 1, opacity: 0.54 },
  { baseX: 1720, yRel: 0.18, scale: 1.25, layer: 1, opacity: 0.46 },
  { baseX: 2360, yRel: 0.25, scale: 1.40, layer: 1, opacity: 0.52 }
];

function drawFluffyCloud(ctx, cx, cy, scale, opacity, biome) {
  ctx.save();
  ctx.translate(cx, cy);

  // 1. Podstawa i cień chmury (chłodny/biomowy spód dający wrażenie trójwymiarowości)
  ctx.fillStyle = biome ? biome.cloudShadow(opacity * 0.40) : `rgba(165, 195, 225, ${opacity * 0.40})`;
  ctx.beginPath();
  ctx.ellipse(0, 10 * scale, 58 * scale, 15 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Główna puszysta bryła (nakładające się miękkie łuki)
  ctx.fillStyle = biome ? biome.cloudHighlight(opacity) : `rgba(255, 255, 255, ${opacity})`;
  ctx.beginPath();
  ctx.arc(0, 0, 32 * scale, 0, Math.PI * 2);
  ctx.arc(-8 * scale, -15 * scale, 24 * scale, 0, Math.PI * 2);
  ctx.arc(28 * scale, -4 * scale, 22 * scale, 0, Math.PI * 2);
  ctx.arc(48 * scale, 5 * scale, 15 * scale, 0, Math.PI * 2);
  ctx.arc(-28 * scale, -2 * scale, 22 * scale, 0, Math.PI * 2);
  ctx.arc(-48 * scale, 5 * scale, 15 * scale, 0, Math.PI * 2);
  ctx.fill();

  // 3. Górne doświetlenie słoneczne (jaśniejsze akcenty na szczytach kopuł)
  ctx.fillStyle = biome ? biome.cloudHighlight(opacity * 0.42) : `rgba(255, 255, 255, ${opacity * 0.42})`;
  ctx.beginPath();
  ctx.arc(-6 * scale, -18 * scale, 17 * scale, 0, Math.PI * 2);
  ctx.arc(22 * scale, -8 * scale, 14 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCloudsLayer(ctx, targetLayer, biome) {
  const cycle = Math.max(CLOUDS_CYCLE, W + 800);
  const camX = camera ? camera.x : 0;
  const drift = performance.now() * 0.005;

  for (let i = 0; i < CLOUD_DEFINITIONS.length; i++) {
    const c = CLOUD_DEFINITIONS[i];
    if (c.layer !== targetLayer) continue;
    const parallaxSpeed = c.layer === 0 ? 0.12 : 0.24;
    const totalOffset = camX * parallaxSpeed + drift;

    const relX = ((c.baseX - totalOffset) % cycle + cycle) % cycle;
    let screenX = relX;
    if (screenX > W + 200 && screenX > cycle - 300) {
      screenX -= cycle;
    }

    if (screenX >= -220 && screenX <= W + 220) {
      const screenY = c.yRel * H;
      drawFluffyCloud(ctx, screenX, screenY, c.scale, c.opacity, biome);
    }
  }
}

// ==========================================
// SŁOŃCE I POŚWIATA
// ==========================================
function drawSun(ctx, biome) {
  const camX = camera ? camera.x : 0;
  // Głęboka paralaksa (odległe ciało niebieskie na horyzoncie)
  // Przesunięcie z płynną perspektywą, słońce pozostaje stabilne w górnym kadrze
  const sunBaseX = W * 0.72;
  const sunX = sunBaseX - Math.atan((camX - START_X) * 0.00008) * (W * 0.22);
  const sunY = Math.max(65, H * 0.17);

  // 1. Rozproszona, szeroka aura zewnętrzna (światło dnia zależne od biomu)
  const auraGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 260);
  auraGrad.addColorStop(0, biome ? biome.sunAura(0.20) : 'rgba(255, 214, 153, 0.18)');
  auraGrad.addColorStop(0.35, biome ? biome.sunAura(0.10) : 'rgba(255, 183, 77, 0.10)');
  auraGrad.addColorStop(0.70, biome ? biome.sunAura(0.04) : 'rgba(255, 167, 38, 0.04)');
  auraGrad.addColorStop(1.0, biome ? biome.sunAura(0) : 'rgba(255, 167, 38, 0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 260, 0, Math.PI * 2);
  ctx.fill();

  // 2. Miękki rozbłysk horyzontalny
  const flareGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 160);
  flareGrad.addColorStop(0, biome ? biome.sunGlow(0.24) : 'rgba(255, 248, 225, 0.22)');
  flareGrad.addColorStop(0.40, biome ? biome.sunAura(0.08) : 'rgba(255, 204, 128, 0.08)');
  flareGrad.addColorStop(1.0, biome ? biome.sunAura(0) : 'rgba(255, 183, 77, 0)');
  ctx.fillStyle = flareGrad;
  ctx.beginPath();
  ctx.ellipse(sunX, sunY, 150, 24, -0.08, 0, Math.PI * 2);
  ctx.fill();

  // 3. Rozproszona, nasycona korona słoneczna
  const glowGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 115);
  glowGrad.addColorStop(0, biome ? biome.sunCore : 'rgba(255, 253, 231, 0.95)');
  glowGrad.addColorStop(0.25, biome ? biome.sunGlow(0.75) : 'rgba(255, 238, 140, 0.75)');
  glowGrad.addColorStop(0.52, biome ? biome.sunGlow(0.45) : 'rgba(255, 183, 77, 0.45)');
  glowGrad.addColorStop(0.80, biome ? biome.sunGlow(0.16) : 'rgba(255, 152, 0, 0.16)');
  glowGrad.addColorStop(1.0, biome ? biome.sunGlow(0) : 'rgba(255, 152, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 115, 0, Math.PI * 2);
  ctx.fill();

  // 4. Jasne jądro słońca
  const coreGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 28);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.65, biome ? biome.sunCore : '#fffde7');
  coreGrad.addColorStop(1.0, biome ? biome.sunGlow(0.9) : '#fff59d');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
  ctx.fill();
}

export function drawSky(ctx) {
  const biome = getInterpolatedBiome(currentDist);

  // Współczynnik przebywania wewnątrz stadionu (300m - 750m)
  const camDist = (camera ? (camera.x - START_X) / 14 : 0);
  let stadiumFactor = 0;
  if (camDist >= 280 && camDist <= 770) {
    if (camDist < 330) {
      stadiumFactor = (camDist - 280) / 50;
    } else if (camDist > 720) {
      stadiumFactor = 1.0 - (camDist - 720) / 50;
    } else {
      stadiumFactor = 1.0;
    }
  }

  // Współczynnik przebywania wewnątrz Wielkiej Piramidy (1050m - 1350m)
  const pyramidFactor = getPyramidInsideFactor(currentDist);

  // Gradient nieba dostosowany do aktualnego biomu, nocnej areny zamkniętego stadionu lub grobowca piramidy
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  if (stadiumFactor > 0) {
    skyGrad.addColorStop(0, '#040711');
    skyGrad.addColorStop(0.35, '#0a1322');
    skyGrad.addColorStop(0.70, '#102038');
    skyGrad.addColorStop(1.0, '#172b48');
  } else if (pyramidFactor > 0) {
    skyGrad.addColorStop(0, '#0d0705');
    skyGrad.addColorStop(0.35, '#1a0e08');
    skyGrad.addColorStop(0.70, '#26140b');
    skyGrad.addColorStop(1.0, '#381e10');
  } else {
    skyGrad.addColorStop(0, biome.sky[0]);
    skyGrad.addColorStop(0.35, biome.sky[1]);
    skyGrad.addColorStop(0.70, biome.sky[2]);
    skyGrad.addColorStop(1.0, biome.sky[3]);
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // Łuna świetlna reflektorów w koronie stadionu rozświetlająca zamkniętą arenę
  if (stadiumFactor > 0) {
    const arenaGlow = ctx.createLinearGradient(0, 0, 0, H * 0.6);
    arenaGlow.addColorStop(0, `rgba(56, 189, 248, ${0.16 * stadiumFactor})`);
    arenaGlow.addColorStop(0.5, `rgba(255, 255, 255, ${0.08 * stadiumFactor})`);
    arenaGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = arenaGlow;
    ctx.fillRect(0, 0, W, H * 0.6);
  }

  // Ciepła poświata pochodni rozświetlająca mroczne sklepienie wnętrza piramidy
  if (pyramidFactor > 0) {
    const tombGlow = ctx.createLinearGradient(0, H * 0.35, 0, H);
    tombGlow.addColorStop(0, 'rgba(0, 0, 0, 0)');
    tombGlow.addColorStop(0.6, `rgba(255, 140, 25, ${0.12 * pyramidFactor})`);
    tombGlow.addColorStop(1.0, `rgba(255, 90, 10, ${0.18 * pyramidFactor})`);
    ctx.fillStyle = tombGlow;
    ctx.fillRect(0, H * 0.35, W, H * 0.65);
  }

  // Słońce i chmury znikają wewnątrz zamkniętego stadionu oraz piramidy
  const skyVisibility = (1.0 - stadiumFactor) * (1.0 - pyramidFactor);
  if (skyVisibility > 0.01) {
    ctx.save();
    ctx.globalAlpha *= skyVisibility;

    // Słońce renderowane przed chmurami
    drawSun(ctx, biome);

    // Dalsze chmury (warstwa 0)
    drawCloudsLayer(ctx, 0, biome);

    ctx.restore();
  }

  // Monumentalna sylwetka Wielkiej Piramidy na horyzoncie pustyni (widok z oddali)
  if (currentDist >= 750 && currentDist <= 1550) {
    drawDistantPyramidParallax(ctx, currentDist);
  }

  // Samoloty na niebie w biomie murawy (0m – 799m)
  // Widoczne na tle nieba, za konstrukcją stadionu i masztami jupiterów
  drawAirplanes(ctx);

  // Bliższe chmury (warstwa 1)
  if (skyVisibility > 0.01) {
    ctx.save();
    ctx.globalAlpha *= skyVisibility;

    drawCloudsLayer(ctx, 1, biome);

    ctx.restore();
  }
}

// ==========================================
// TŁO I STRUKTURA: MONUMENTALNA ARENA STADIONOWA (300M - 750M)
// ==========================================
function drawFanCrowd(ctx, seatX, seatY, seatW, seatH, bayIdx, rowIdx, now) {
  const fanSpacing = 7;
  // Chłodna paleta barw (granat, indygo, grafit, cyjan, złoto, biel - ZERO czerwieni dla kontrastu z graczem)
  const fanCols = ['#0a1128', '#1c2541', '#1e293b', '#00e5ff', '#ffc107', '#334155', '#475569', '#64748b', '#f8fafc'];
  const count = Math.floor(seatW / fanSpacing);

  for (let i = 0; i < count; i++) {
    const fx = seatX + i * fanSpacing + 2;
    const seed = (bayIdx * 73 + rowIdx * 31 + i * 17);
    const col = fanCols[seed % fanCols.length];

    // Subtelna animacja dopingu / skakania kibiców
    const isCheering = Math.sin((now * 0.0035) + bayIdx * 1.2 + i * 0.25) > 0.82;
    const yOffset = isCheering ? -2.5 : 0;

    // Głowa
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(fx + 1, seatY + 2 + yOffset, 2.5, 2.5);

    // Koszulka w barwach areny (granat, indygo, cyjan, grafit)
    ctx.fillStyle = col;
    ctx.fillRect(fx, seatY + 5 + yOffset, 4.5, 4.5);

    // Szalik kibica w dłoniach (neonowy cyjan lub złoto)
    if (isCheering && (seed % 4 === 0)) {
      ctx.fillStyle = (seed % 2 === 0) ? '#00e5ff' : '#ffc107';
      ctx.fillRect(fx - 1, seatY + yOffset, 7, 2);
    }

    // Błyski fleszy aparatów w tłumie
    if ((seed + Math.floor(now * 0.02)) % 130 === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(fx + 2, seatY + 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawFloodlightTower(ctx, mx, gy, now) {
  // Powiększony maszt kratownicowy sięgający 570 px nad murawę
  const mastBaseY = gy - 440;
  const mastTopY = gy - 570;

  // 1. Stalowe słupy masztu kratownicowego
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(mx - 20, mastBaseY);
  ctx.lineTo(mx - 10, mastTopY);
  ctx.moveTo(mx + 20, mastBaseY);
  ctx.lineTo(mx + 10, mastTopY);
  ctx.stroke();

  // Krzyżulce kratownicy (X)
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let y = mastBaseY; y > mastTopY + 16; y -= 24) {
    const t1 = (y - mastBaseY) / (mastTopY - mastBaseY);
    const t2 = (y - 24 - mastBaseY) / (mastTopY - mastBaseY);
    const w1 = 20 - t1 * 10;
    const w2 = 20 - t2 * 10;
    ctx.moveTo(mx - w1, y);
    ctx.lineTo(mx + w1, y);
    ctx.moveTo(mx - w1, y);
    ctx.lineTo(mx + w2, y - 24);
    ctx.moveTo(mx + w1, y);
    ctx.lineTo(mx - w2, y - 24);
  }
  ctx.stroke();

  // 2. Potężna głowica z 16 reflektorami LED
  const headW = 86;
  const headH = 34;
  const headX = mx - headW / 2;
  const headY = mastTopY - headH;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(headX, headY, headW, headH);
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(headX, headY, headW, headH);

  // Cyjanowa dioda ostrzegawcza
  ctx.fillStyle = (Math.sin(now * 0.006 + mx) > 0) ? '#00e5ff' : '#0369a1';
  ctx.beginPath();
  ctx.arc(mx, headY - 4, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 3. Szerokie snopy światła oświetlające płytę boiska
  const beamLeft = ctx.createLinearGradient(mx, headY + headH, mx - 160, gy);
  beamLeft.addColorStop(0, 'rgba(255, 255, 255, 0.20)');
  beamLeft.addColorStop(0.40, 'rgba(240, 248, 255, 0.09)');
  beamLeft.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

  ctx.fillStyle = beamLeft;
  ctx.beginPath();
  ctx.moveTo(mx - 15, headY + headH);
  ctx.lineTo(mx + 15, headY + headH);
  ctx.lineTo(mx + 120, gy);
  ctx.lineTo(mx - 320, gy);
  ctx.closePath();
  ctx.fill();

  const beamRight = ctx.createLinearGradient(mx, headY + headH, mx + 160, gy);
  beamRight.addColorStop(0, 'rgba(255, 255, 255, 0.20)');
  beamRight.addColorStop(0.40, 'rgba(240, 248, 255, 0.09)');
  beamRight.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

  ctx.fillStyle = beamRight;
  ctx.beginPath();
  ctx.moveTo(mx - 15, headY + headH);
  ctx.lineTo(mx + 15, headY + headH);
  ctx.lineTo(mx + 320, gy);
  ctx.lineTo(mx - 120, gy);
  ctx.closePath();
  ctx.fill();

  // 4. Panel 16 projektorów LED (2 rzędy po 8)
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 8; col++) {
      const lx = headX + 7 + col * 10.5;
      const ly = headY + 8 + row * 16;

      ctx.fillStyle = 'rgba(255, 250, 220, 0.75)';
      ctx.beginPath();
      ctx.arc(lx, ly, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Tło tunelu wejściowego na 300 m (widok za graczem)
function drawEntranceTunnelBg(ctx, enterX, gy) {
  const tw = 200;
  const th = 220;
  const tx = enterX - tw / 2;
  const ty = gy - th;

  // Głęboki mrok korytarza wyjściowego
  const tunnelGrad = ctx.createLinearGradient(enterX, ty, enterX, gy);
  tunnelGrad.addColorStop(0, '#02050c');
  tunnelGrad.addColorStop(0.7, '#070e1b');
  tunnelGrad.addColorStop(1, '#0e1726');
  ctx.fillStyle = tunnelGrad;
  ctx.fillRect(tx, ty, tw, th);

  // Linie perspektywy ścian
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(enterX - 55, ty + 60);
  ctx.moveTo(tx + tw, ty);
  ctx.lineTo(enterX + 55, ty + 60);
  ctx.moveTo(tx, gy);
  ctx.lineTo(enterX - 60, gy - 25);
  ctx.moveTo(tx + tw, gy);
  ctx.lineTo(enterX + 60, gy - 25);
  ctx.stroke();

  // Lampa sufitowa LED w korytarzu
  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(enterX - 55, ty + 58, 110, 5);
  const glow = ctx.createRadialGradient(enterX, ty + 60, 2, enterX, ty + 60, 60);
  glow.addColorStop(0, 'rgba(0, 229, 255, 0.50)');
  glow.addColorStop(1, 'rgba(0, 229, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(enterX - 80, ty + 30, 160, 80);

  // Napis w głębi korytarza
  ctx.fillStyle = '#00e5ff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CHAMPIONS ARENA', enterX, ty + 48);
  ctx.textAlign = 'left';

  // Chodnik wyjściowy w chłodnym granacie ze złotą krawędzią (brak czerwieni)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(tx + 25, gy - 7, tw - 50, 7);
  ctx.fillStyle = '#ffc107';
  ctx.fillRect(tx + 25, gy - 7, tw - 50, 2);
}

// Tło tunelu wyjściowego na 750 m (widok za graczem)
function drawExitTunnelBg(ctx, exitX, gy) {
  const tw = 200;
  const th = 220;
  const tx = exitX - tw / 2;
  const ty = gy - th;

  ctx.fillStyle = '#050913';
  ctx.fillRect(tx, ty, tw, th);

  // Złocisty blask pustyni w głębi tunelu
  const desertGlow = ctx.createRadialGradient(exitX + 20, gy - 85, 8, exitX + 20, gy - 85, 100);
  desertGlow.addColorStop(0, 'rgba(251, 191, 36, 0.70)');
  desertGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.28)');
  desertGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = desertGlow;
  ctx.fillRect(tx, ty, tw, th);

  // Zielona lampa ewakuacyjna
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(exitX - 40, ty + 40, 80, 5);
}

// Linie boiska i profesjonalna murawa piłkarska wewnątrz stadionu (300m - 750m)
function drawPitchMarkings(ctx, enterX, exitX, gy, viewLeft, viewRight) {
  if (viewRight < enterX - 100 || viewLeft > exitX + 100) return;

  const startX = Math.max(enterX, viewLeft - 80);
  const endX = Math.min(exitX, viewRight + 80);
  if (startX > endX) return;

  // 1. Pasy koszenia trawy (Mowing Stripes) o równej szerokości 80 px
  // Naprzemienne szlachetne odcienie głębokiej zieleni piłkarskiej:
  // Ciemniejszy szmaragd #1b5e20 i jaśniejszy odcień #2e7d32 (efekt profesjonalnej płyty Ligi Mistrzów)
  const STRIPE_W = 80;
  const firstStripeIdx = Math.floor(startX / STRIPE_W);
  const lastStripeIdx = Math.ceil(endX / STRIPE_W);

  for (let s = firstStripeIdx; s <= lastStripeIdx; s++) {
    const sx = s * STRIPE_W;
    const isLight = (s % 2 === 0);
    const sw = Math.min(STRIPE_W, exitX - sx);
    if (sw <= 0) continue;

    const drawX = Math.max(enterX, sx);
    const drawW = Math.min(sx + sw, exitX) - drawX;
    if (drawW <= 0) continue;

    // Głęboka zieleń piłkarska płyty boiska
    ctx.fillStyle = isLight ? '#2e7d32' : '#1b5e20';
    ctx.fillRect(drawX, gy, drawW, 600);

    // Krawędź górna darni z lekkim rozjaśnieniem koszenia
    ctx.fillStyle = isLight ? '#388e3c' : '#25702b';
    ctx.fillRect(drawX, gy, drawW, 8);
  }

  // 2. Ostra, wyraźna biała linia boczna (Touchline) tuż pod krawędzią biegu (grubość 3.5 px)
  const touchLeft = Math.max(enterX, viewLeft);
  const touchRight = Math.min(exitX, viewRight);
  if (touchRight > touchLeft) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(touchLeft, gy + 2, touchRight - touchLeft, 3.5);
  }

  // 3. Linia środkowa i koło środkowe na 525 m (7510 px)
  const midX = START_X + 525 * 14;
  if (midX >= viewLeft - 140 && midX <= viewRight + 140) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 3.5;

    // Poprzeczna linia środkowa w głąb boiska
    ctx.fillRect(midX - 1.75, gy + 2, 3.5, 130);

    // Punkt środkowy (center spot)
    ctx.beginPath();
    ctx.arc(midX, gy + 4, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Łuk koła środkowego boiska
    ctx.beginPath();
    ctx.arc(midX, gy + 2, 95, 0, Math.PI, false);
    ctx.stroke();
  }

  // 4. Pole karne i punkt boczny/karny przy wejściu (350 m = 5060 px)
  const penX1 = START_X + 350 * 14;
  if (penX1 >= viewLeft - 260 && penX1 <= viewRight + 260) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 3.5;

    // Duże pole karne (linia poprzeczna i dolna pozioma)
    const boxX1 = penX1 + 180;
    ctx.fillRect(boxX1 - 1.75, gy + 2, 3.5, 110);
    ctx.fillRect(enterX, gy + 110, boxX1 - enterX, 3.5);

    // Małe pole bramkowe (5 metrów)
    const goalBoxX1 = penX1 - 40;
    ctx.fillRect(goalBoxX1 - 1.75, gy + 2, 3.5, 55);
    ctx.fillRect(enterX, gy + 55, goalBoxX1 - enterX, 3.5);

    // Punkt karny / punkt boczny
    ctx.beginPath();
    ctx.arc(penX1, gy + 45, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Łuk przed polem karnym (D-box arc)
    ctx.beginPath();
    ctx.arc(penX1, gy + 45, 68, 0, Math.PI * 0.65, false);
    ctx.stroke();
  }

  // 5. Pole karne i punkt boczny/karny przy wyjściu (700 m = 9960 px)
  const penX2 = START_X + 700 * 14;
  if (penX2 >= viewLeft - 260 && penX2 <= viewRight + 260) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 3.5;

    // Duże pole karne (linia poprzeczna i dolna pozioma)
    const boxX2 = penX2 - 180;
    ctx.fillRect(boxX2 - 1.75, gy + 2, 3.5, 110);
    ctx.fillRect(boxX2, gy + 110, exitX - boxX2, 3.5);

    // Małe pole bramkowe (5 metrów)
    const goalBoxX2 = penX2 + 40;
    ctx.fillRect(goalBoxX2 - 1.75, gy + 2, 3.5, 55);
    ctx.fillRect(goalBoxX2, gy + 55, exitX - goalBoxX2, 3.5);

    // Punkt karny / punkt boczny
    ctx.beginPath();
    ctx.arc(penX2, gy + 45, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Łuk przed polem karnym
    ctx.beginPath();
    ctx.arc(penX2, gy + 45, 68, Math.PI * 0.35, Math.PI, false);
    ctx.stroke();
  }

  // 6. Chorągiewki narożne i łuki rożne
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 3.5;

  if (enterX >= viewLeft - 40 && enterX <= viewRight + 40) {
    // Łuk narożny (ćwiartka koła)
    ctx.beginPath();
    ctx.arc(enterX, gy + 2, 26, 0, Math.PI * 0.5, false);
    ctx.stroke();

    // Maszt chorągiewki narożnej
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(enterX, gy + 2);
    ctx.lineTo(enterX, gy - 28);
    ctx.stroke();

    // Flaga chorągiewki
    ctx.fillStyle = '#ffc107';
    ctx.beginPath();
    ctx.moveTo(enterX, gy - 28);
    ctx.lineTo(enterX + 16, gy - 21);
    ctx.lineTo(enterX, gy - 14);
    ctx.closePath();
    ctx.fill();
  }

  if (exitX >= viewLeft - 40 && exitX <= viewRight + 40) {
    // Łuk narożny (ćwiartka koła)
    ctx.beginPath();
    ctx.arc(exitX, gy + 2, 26, Math.PI * 0.5, Math.PI, false);
    ctx.stroke();

    // Maszt chorągiewki narożnej
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(exitX, gy + 2);
    ctx.lineTo(exitX, gy - 28);
    ctx.stroke();

    // Flaga chorągiewki
    ctx.fillStyle = '#ffc107';
    ctx.beginPath();
    ctx.moveTo(exitX, gy - 28);
    ctx.lineTo(exitX - 16, gy - 21);
    ctx.lineTo(exitX, gy - 14);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawStadium(ctx, worldLeft, worldRight) {
  const camDist = (camera.x - START_X) / 14;
  if (camDist < 250 || camDist > 790) return;

  let alpha = 1.0;
  if (camDist < 300) {
    alpha = (camDist - 250) / 50;
  } else if (camDist > 750) {
    alpha = 1.0 - (camDist - 750) / 40;
  }
  alpha = Math.max(0, Math.min(1, alpha));
  if (alpha <= 0.01) return;

  const enterX = START_X + 300 * 14; // 4360 px
  const exitX = START_X + 750 * 14;  // 10660 px

  const STADIUM_START = enterX - 360;
  const STADIUM_END = exitX + 360;
  const BAY_W = 180;
  const TOTAL_BAYS = Math.ceil((STADIUM_END - STADIUM_START) / BAY_W);

  // Widoczne sektory w przestrzeni kamery
  const firstBay = Math.max(0, Math.floor((worldLeft - STADIUM_START) / BAY_W));
  const lastBay = Math.min(TOTAL_BAYS - 1, Math.ceil((worldRight - STADIUM_START) / BAY_W));
  if (firstBay > lastBay) return;

  const gy = GROUND_Y;
  const now = performance.now();

  ctx.save();
  ctx.globalAlpha *= alpha;

  // 1. Zewnętrzna ściana nośna (sięgająca 470 px w górę!)
  for (let b = firstBay; b <= lastBay; b++) {
    const bx = STADIUM_START + b * BAY_W;

    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(bx, gy - 470, BAY_W, 470);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx, gy - 470, 10, 470);
    ctx.fillRect(bx + BAY_W - 10, gy - 470, 10, 470);

    // Przeszklone pasy lóż VIP pod koroną stadionu
    ctx.fillStyle = 'rgba(0, 229, 255, 0.22)';
    ctx.fillRect(bx + 14, gy - 460, BAY_W - 28, 16);
  }

  // 2. Wysokie sektory i rzędy krzesełek w chłodnej palecie (granat, indygo, grafit - ZERO czerwieni)
  // Górna trybuna (14 rzędów = 248 px wysokości)
  const upperRows = [
    { h: 17, col: '#0a1128' },
    { h: 17, col: '#1c2541' },
    { h: 17, col: '#131f42' },
    { h: 17, col: '#1e293b' },
    { h: 17, col: '#0a1128' },
    { h: 17, col: '#1c2541' },
    { h: 17, col: '#131f42' },
    { h: 17, col: '#1e293b' },
    { h: 17, col: '#0a1128' },
    { h: 17, col: '#1c2541' },
    { h: 17, col: '#131f42' },
    { h: 17, col: '#1e293b' },
    { h: 17, col: '#0a1128' },
    { h: 17, col: '#1c2541' }
  ];

  // Dolna trybuna (8 rzędów = 140 px wysokości)
  const lowerRows = [
    { h: 17, col: '#131f42' },
    { h: 17, col: '#1e293b' },
    { h: 17, col: '#0a1128' },
    { h: 17, col: '#1c2541' },
    { h: 17, col: '#131f42' },
    { h: 17, col: '#1e293b' },
    { h: 17, col: '#0a1128' },
    { h: 17, col: '#1c2541' }
  ];

  for (let b = firstBay; b <= lastBay; b++) {
    const bx = STADIUM_START + b * BAY_W;
    const seatLeft = bx + 18;
    const seatW = BAY_W - 24;

    // A. Monumentalna Górna Trybuna (od gy - 440 do gy - 194)
    let curY = gy - 440;
    for (let r = 0; r < upperRows.length; r++) {
      const row = upperRows[r];
      ctx.fillStyle = row.col;
      ctx.fillRect(seatLeft, curY, seatW, row.h);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(seatLeft, curY + row.h - 2, seatW, 2);

      drawFanCrowd(ctx, seatLeft, curY, seatW, row.h, b, r, now);
      curY += row.h;
    }

    // Środkowy pomost z podświetlaną cyjanową barierką
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx, gy - 194, BAY_W, 24);
    ctx.fillStyle = '#334155';
    ctx.fillRect(bx, gy - 194, BAY_W, 4);

    // Neonowa poręcz LED
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(bx, gy - 186);
    ctx.lineTo(bx + BAY_W, gy - 186);
    ctx.stroke();

    // B. Monumentalna Dolna Trybuna (od gy - 170 do gy - 30)
    curY = gy - 170;
    for (let r = 0; r < lowerRows.length; r++) {
      const row = lowerRows[r];
      ctx.fillStyle = row.col;
      ctx.fillRect(seatLeft, curY, seatW, row.h);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(seatLeft, curY + row.h - 2, seatW, 2);

      drawFanCrowd(ctx, seatLeft, curY, seatW, row.h, b, r + 20, now);
      curY += row.h;
    }

    // Schody ewakuacyjne z neonowymi stopnicami
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(bx + 2, gy - 440, 14, 410);

    ctx.fillStyle = 'rgba(0, 229, 255, 0.75)';
    for (let sy = gy - 438; sy < gy - 30; sy += 14) {
      ctx.fillRect(bx + 3, sy, 12, 2.5);
    }
  }

  // 3. Konstrukcja dachu z potężnymi stalowymi dźwigarami i cięgnami przy górnej krawędzi
  for (let b = firstBay; b <= lastBay; b++) {
    const bx = STADIUM_START + b * BAY_W;

    // Główny łuk zadaszenia (cantilever) sięgający 550 px w górę
    const gradRoof = ctx.createLinearGradient(bx, gy - 550, bx, gy - 450);
    gradRoof.addColorStop(0, '#090e1a');
    gradRoof.addColorStop(0.5, '#162032');
    gradRoof.addColorStop(1, '#25334a');

    ctx.fillStyle = gradRoof;
    ctx.beginPath();
    ctx.moveTo(bx - 2, gy - 540);
    ctx.bezierCurveTo(bx + BAY_W * 0.4, gy - 560, bx + BAY_W * 0.7, gy - 510, bx + BAY_W + 2, gy - 460);
    ctx.lineTo(bx + BAY_W + 2, gy - 445);
    ctx.bezierCurveTo(bx + BAY_W * 0.7, gy - 485, bx + BAY_W * 0.4, gy - 525, bx - 2, gy - 515);
    ctx.closePath();
    ctx.fill();

    // Neonowa listwa cyjanowa na krawędzi dachu
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx - 2, gy - 515);
    ctx.bezierCurveTo(bx + BAY_W * 0.4, gy - 525, bx + BAY_W * 0.7, gy - 485, bx + BAY_W + 2, gy - 445);
    ctx.stroke();

    // Potężne stalowe cięgna podwieszenia dachu biegnące z wysokiego pylonu
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx + 12, gy - 580);
    ctx.lineTo(bx + BAY_W * 0.65, gy - 485);
    ctx.moveTo(bx + 12, gy - 580);
    ctx.lineTo(bx + BAY_W * 0.95, gy - 455);
    ctx.stroke();

    // Dźwigary kratownicowe przy samej górnej krawędzi
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx, gy - 560);
    ctx.lineTo(bx + BAY_W, gy - 560);
    ctx.moveTo(bx, gy - 535);
    ctx.lineTo(bx + BAY_W, gy - 535);
    // Ukośne wzmocnienia kratownicy
    ctx.moveTo(bx, gy - 560);
    ctx.lineTo(bx + BAY_W / 2, gy - 535);
    ctx.lineTo(bx + BAY_W, gy - 560);
    ctx.stroke();

    // Szczyt pylonu odciągowego z cyjanową diodą
    ctx.fillStyle = '#475569';
    ctx.fillRect(bx + 9, gy - 585, 8, 60);
    ctx.fillStyle = (Math.sin(now * 0.005 + b) > 0) ? '#00e5ff' : '#0369a1';
    ctx.beginPath();
    ctx.arc(bx + 13, gy - 587, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Monumentalny centralny telebim (Jumbotron) na 525 m (środek boiska)
  const midX = START_X + 525 * 14; // 7510 px
  if (midX >= worldLeft - 140 && midX <= worldRight + 140) {
    const jx = midX - 110;
    const jy = gy - 430;
    const jw = 220;
    const jh = 75;

    ctx.fillStyle = '#0b1120';
    ctx.fillRect(jx - 5, jy - 5, jw + 10, jh + 10);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(jx - 5, jy - 5, jw + 10, jh + 10);

    ctx.fillStyle = '#020617';
    ctx.fillRect(jx, jy, jw, jh);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('★ CHAMPIONS ARENA ★', midX, jy + 18);

    ctx.fillStyle = '#ffc107';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('KEEP IT HIGH', midX, jy + 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('FAIR PLAY • 525M', midX, jy + 62);
    ctx.textAlign = 'left';
  }

  // 5. Powiększone jupitery rozmieszczone co 720 px wzdłuż dachu
  for (let mx = enterX - 100; mx <= exitX + 200; mx += 720) {
    if (mx >= worldLeft - 360 && mx <= worldRight + 360) {
      drawFloodlightTower(ctx, mx, gy, now);
    }
  }

  // 6. Świecące bandy reklamowe LED z wyłącznie hasłami KEEP IT HIGH, FAIR PLAY, CHAMPIONS ARENA
  const ledMessages = [
    'KEEP IT HIGH',
    'FAIR PLAY',
    'CHAMPIONS ARENA'
  ];

  for (let b = firstBay; b <= lastBay; b++) {
    const bx = STADIUM_START + b * BAY_W;

    // Techniczne pobocze / pas sztucznej nawierzchni (tartan żwirowy #37474f o wysokości 7 px)
    // na styku murawy i trybun, na którym osadzone są świecące bandy reklamowe
    const tartanY = gy - 7;
    const tartanH = 7;
    ctx.fillStyle = '#37474f';
    ctx.fillRect(bx, tartanY, BAY_W, tartanH);

    // Krawędź krawężnika technicznego
    ctx.fillStyle = '#263238';
    ctx.fillRect(bx, tartanY, BAY_W, 2);

    // Drobna ziarnistość technicznego żwiru
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let tx = bx + 6; tx < bx + BAY_W; tx += 18) {
      ctx.fillRect(tx, tartanY + 3, 3, 2);
    }

    // Świecące bandy reklamowe LED osadzone bezpośrednio na pasie technicznym
    const boardH = 26;
    const boardY = tartanY - boardH; // od gy - 33 do gy - 7

    // Tło bandy LED
    ctx.fillStyle = '#050811';
    ctx.fillRect(bx, boardY, BAY_W, boardH);

    // Neonowa górna listwa cyjanowa i dolna złota tuż nad tartanem
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(bx, boardY, BAY_W, 2.5);
    ctx.fillStyle = '#ffc107';
    ctx.fillRect(bx, boardY + boardH - 2, BAY_W, 2);

    // Treść reklamowa LED
    const msg = ledMessages[b % ledMessages.length];
    ctx.font = 'bold 12.5px monospace';
    ctx.textAlign = 'center';

    // Płynny przemieszczający się po bandzie świetlny gradient neonowy
    const sheen = ((now * 0.09 + b * 45) % BAY_W);
    const gradLED = ctx.createLinearGradient(bx, boardY, bx + BAY_W, boardY);
    gradLED.addColorStop(0, '#00e5ff');
    gradLED.addColorStop(Math.max(0, Math.min(1, sheen / BAY_W)), '#ffffff');
    gradLED.addColorStop(1, '#ffc107');

    ctx.fillStyle = gradLED;
    ctx.fillText(msg, bx + BAY_W / 2, boardY + 17.5);
    ctx.textAlign = 'left';
  }

  // 7. Tła korytarzy tunelu wejściowego i wyjściowego (za graczem)
  if (enterX >= worldLeft - 200 && enterX <= worldRight + 200) {
    drawEntranceTunnelBg(ctx, enterX, gy);
  }
  if (exitX >= worldLeft - 200 && exitX <= worldRight + 200) {
    drawExitTunnelBg(ctx, exitX, gy);
  }

  ctx.restore();
}

export function drawGround(ctx, worldLeft, worldWidth) {
  const worldRight = worldLeft + worldWidth;

  // 1. Tło stadionu w warstwie mid-ground (za murawą, graczem i obiektami)
  drawStadium(ctx, worldLeft, worldRight);

  // 2. Sylwetka i monumentalna fasada zewnętrzna Wielkiej Piramidy (biom pustynny)
  drawPyramidExterior(ctx, worldLeft, worldRight);

  // 3. Wnętrze komory grobowej Wielkiej Piramidy (1050m - 1350m: dokładnie 300 metrów)
  drawPyramidInterior(ctx, worldLeft, worldRight);

  // 4. Grunt biomu
  const biome = getInterpolatedBiome(currentDist);
  ctx.fillStyle = biome.groundBase;
  ctx.fillRect(worldLeft, GROUND_Y, worldWidth, 600);
  ctx.fillStyle = biome.groundTop;
  ctx.fillRect(worldLeft, GROUND_Y, worldWidth, 9);

  // 5. Starożytna kamienna posadzka wnętrza piramidy (1050m - 1350m)
  drawPyramidFloor(ctx, worldLeft, worldRight);

  // 6. Profesjonalna murawa piłkarska z pasami koszenia i liniami (300m - 750m)
  drawPitchMarkings(ctx, START_X + 300 * 14, START_X + 750 * 14, GROUND_Y, worldLeft, worldRight);

  // 7. Gwałtowna zamieć piaskowa (biom pustynny 800 – 1599 m)
  drawDesertSandstorm(ctx, worldLeft, worldRight);

  // 8. Potężne powiewy śniegu i zamieć śnieżna w tle (biom zimowy 1600 – 2399 m)
  drawWinterBlizzard(ctx, worldLeft, worldRight);
}

// ==========================================
// WARSTWA PRZEDNIA (FOREGROUND): BRAMY, KONFETTI I OŚWIETLENIE
// ==========================================
function drawEntranceGateForeground(ctx, enterX, gy) {
  // Monumentalna brama wznosząca się wysoko ponad głowę zawodnika (wysokość 310 px)
  const pillarW = 42;
  const pillarH = 300;
  const gateW = 230;
  const leftPillarX = enterX - gateW / 2;
  const rightPillarX = enterX + gateW / 2 - pillarW;

  // Harmonijkowy przezroczysty tunel stadionowy (pleksi i stalowe żebra nad głową)
  const archLeft = leftPillarX + pillarW;
  const archRight = rightPillarX;
  const ribCount = 7;
  const ribStep = (archRight - archLeft) / (ribCount + 1);

  for (let i = 1; i <= ribCount; i++) {
    const rx = archLeft + i * ribStep;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(rx, gy - 110, 75, Math.PI, 0, false);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 229, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(rx, gy - 110, 75, Math.PI, 0, false);
    ctx.lineTo(rx + 10, gy - 110);
    ctx.arc(rx + 10, gy - 110, 75, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();
  }

  // Stalowe filary wejściowe (przesłaniające gracza na pierwszym planie)
  const drawPillar = (px) => {
    const gradPillar = ctx.createLinearGradient(px, 0, px + pillarW, 0);
    gradPillar.addColorStop(0, '#0a0f1d');
    gradPillar.addColorStop(0.3, '#1e293b');
    gradPillar.addColorStop(0.7, '#334155');
    gradPillar.addColorStop(1, '#0a0f1d');
    ctx.fillStyle = gradPillar;
    ctx.fillRect(px, gy - pillarH, pillarW, pillarH + 10);

    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, gy - pillarH, pillarW, pillarH + 10);

    // Żółto-czarne pasy ostrzegawcze skrajni
    const hazardH = 44;
    const stripeSize = 11;
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, gy - hazardH, pillarW, hazardH);
    ctx.clip();
    for (let sy = gy - hazardH - stripeSize; sy < gy + stripeSize; sy += stripeSize * 2) {
      ctx.fillStyle = '#ffc107';
      ctx.beginPath();
      ctx.moveTo(px, sy);
      ctx.lineTo(px + pillarW, sy + stripeSize);
      ctx.lineTo(px + pillarW, sy + stripeSize * 2);
      ctx.lineTo(px, sy + stripeSize);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0a0f1d';
      ctx.beginPath();
      ctx.moveTo(px, sy + stripeSize);
      ctx.lineTo(px + pillarW, sy + stripeSize * 2);
      ctx.lineTo(px + pillarW, sy + stripeSize * 3);
      ctx.lineTo(px, sy + stripeSize * 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  drawPillar(leftPillarX);
  drawPillar(rightPillarX);

  // Kaseton wejściowy z neonową ramą
  const lintelY = gy - pillarH - 35;
  const lintelH = 75;
  const lintelX = leftPillarX - 8;
  const lintelW = (rightPillarX + pillarW) - leftPillarX + 16;

  ctx.fillStyle = '#0b1120';
  ctx.fillRect(lintelX, lintelY, lintelW, lintelH);
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 3;
  ctx.strokeRect(lintelX, lintelY, lintelW, lintelH);

  ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(lintelX + 4, lintelY + 4, lintelW - 8, lintelH - 8);

  // Nowe hasła bez „Kapki”
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffc107';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('★ CHAMPIONS ARENA ★', enterX, lintelY + 22);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('KEEP IT HIGH', enterX, lintelY + 46);

  ctx.fillStyle = '#00e5ff';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('FAIR PLAY • 300M', enterX, lintelY + 64);
  ctx.textAlign = 'left';

  // Dioda ostrzegawcza
  const blink = Math.sin(performance.now() * 0.007) > 0;
  ctx.fillStyle = blink ? '#00e5ff' : '#0369a1';
  ctx.beginPath();
  ctx.arc(leftPillarX + pillarW / 2, lintelY - 5, 4.5, 0, Math.PI * 2);
  ctx.arc(rightPillarX + pillarW / 2, lintelY - 5, 4.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawExitGateForeground(ctx, exitX, gy) {
  const pillarW = 42;
  const pillarH = 300;
  const gateW = 230;
  const leftPillarX = exitX - gateW / 2;
  const rightPillarX = exitX + gateW / 2 - pillarW;

  const drawPillar = (px) => {
    const gradPillar = ctx.createLinearGradient(px, 0, px + pillarW, 0);
    gradPillar.addColorStop(0, '#0a0f1d');
    gradPillar.addColorStop(0.3, '#1e293b');
    gradPillar.addColorStop(0.7, '#334155');
    gradPillar.addColorStop(1, '#0a0f1d');
    ctx.fillStyle = gradPillar;
    ctx.fillRect(px, gy - pillarH, pillarW, pillarH + 10);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, gy - pillarH, pillarW, pillarH + 10);
  };

  drawPillar(leftPillarX);
  drawPillar(rightPillarX);

  const lintelY = gy - pillarH - 35;
  const lintelH = 75;
  const lintelX = leftPillarX - 8;
  const lintelW = (rightPillarX + pillarW) - leftPillarX + 16;

  ctx.fillStyle = '#052e16';
  ctx.fillRect(lintelX, lintelY, lintelW, lintelH);
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 3;
  ctx.strokeRect(lintelX, lintelY, lintelW, lintelH);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('CHAMPIONS ARENA', exitX, lintelY + 22);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('KEEP IT HIGH', exitX, lintelY + 46);

  ctx.fillStyle = '#ffc107';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('FAIR PLAY • 750M ➔', exitX, lintelY + 64);
  ctx.textAlign = 'left';
}

function drawForegroundSpotlight(ctx, mx, gy) {
  // Powiększony przedni snop światła padający na gracza
  const cone = ctx.createLinearGradient(mx, gy - 540, mx, gy);
  cone.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
  cone.addColorStop(0.6, 'rgba(240, 248, 255, 0.08)');
  cone.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

  ctx.fillStyle = cone;
  ctx.beginPath();
  ctx.moveTo(mx - 20, gy - 540);
  ctx.lineTo(mx + 20, gy - 540);
  ctx.lineTo(mx + 200, gy);
  ctx.lineTo(mx - 200, gy);
  ctx.closePath();
  ctx.fill();

  // Rozświetlona plama światła na murawie
  const pool = ctx.createRadialGradient(mx, gy, 15, mx, gy, 180);
  pool.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
  pool.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.ellipse(mx, gy + 4, 180, 20, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawStadiumForeground(ctx, worldLeft, worldRight) {
  const gy = GROUND_Y;
  const enterX = START_X + 300 * 14; // 4360 px
  const exitX = START_X + 750 * 14;  // 10660 px

  // 1. Przód monumentalnej bramy wejściowej na 300 m (filary przesłaniające gracza)
  if (enterX >= worldLeft - 260 && enterX <= worldRight + 260) {
    drawEntranceGateForeground(ctx, enterX, gy);
  }

  // 2. Przód monumentalnej bramy wyjściowej na 750 m (filary przesłaniające gracza)
  if (exitX >= worldLeft - 260 && exitX <= worldRight + 260) {
    drawExitGateForeground(ctx, exitX, gy);
  }

  // 3. Przednie snopy światła jupiterów oświetlające gracza
  for (let mx = enterX + 240; mx < exitX; mx += 720) {
    if (mx >= worldLeft - 220 && mx <= worldRight + 220) {
      drawForegroundSpotlight(ctx, mx, gy);
    }
  }

  // 4. Opadające, wirujące konfetti na powitanie (chłodny cyjan, złoto, biel)
  for (let cp of confettiParticles) {
    if (cp.x < worldLeft - 40 || cp.x > worldRight + 40) continue;
    ctx.save();
    ctx.translate(cp.x, cp.y);
    ctx.rotate(cp.rot);
    const flutter = Math.sin(cp.rot * 2.5);
    ctx.scale(Math.max(0.2, Math.abs(flutter)), 1);
    ctx.fillStyle = cp.color;
    ctx.globalAlpha = Math.max(0, Math.min(1, cp.life * 1.5));
    ctx.fillRect(-cp.w / 2, -cp.h / 2, cp.w, cp.h);
    ctx.restore();
  }

  // 5. Przednia warstwa Wielkiej Piramidy (strop z bloków kamiennych, przednie kolumny, portale i snop słońca)
  drawPyramidForeground(ctx, worldLeft, worldRight);

  // 6. Płatki/drobiny zamieci piaskowej na pierwszym planie (biom pustynny 800 – 1599 m)
  drawDesertSandstormForeground(ctx, worldLeft, worldRight);

  // 7. Płatki zamieci śnieżnej na pierwszym planie (biom zimowy 1600 – 2399 m)
  drawWinterBlizzardForeground(ctx, worldLeft, worldRight);
}

export function drawParticles(ctx) {
  const biome = getInterpolatedBiome(currentDist);
  const defaultCol = biome.particleColors[0];

  // 1. Cząsteczki odbicia od gruntu
  for (let gp of grassParticles) {
    ctx.fillStyle = gp.color || defaultCol;
    ctx.fillRect(gp.x, gp.y, gp.size, gp.size * 1.5);
  }

  // 2. Cząsteczki śniegu / zamieci tuż nad zmarzliną w biomie zimowym (od 1600 m)
  if (currentDist >= 1600 && currentDist <= 2399) {
    for (let sp of snowFlurryParticles) {
      ctx.fillStyle = `rgba(240, 248, 255, ${sp.opacity * sp.life})`;
      ctx.fillRect(sp.x, sp.y, sp.size, sp.size * 0.85);
    }
  }
}

export function drawDistanceMarkers(ctx, worldLeft, worldRight) {
  // Skala: 1 metr = 14 pikseli (START_X = 160 to 0 metrów)
  // Główne znaczniki co 50 metrów (700 px), pomocnicze co 10 metrów (140 px)
  const minM = Math.max(0, Math.floor((worldLeft - START_X) / 140) * 10);
  const maxM = Math.ceil((worldRight - START_X) / 140) * 10;

  for (let m = minM; m <= maxM; m += 10) {
    const x = START_X + m * 14;
    if (x < worldLeft - 60 || x > worldRight + 60) continue;

    const isMajor = (m % 50 === 0);

    if (isMajor) {
      // 1. Główny słupek / kreska na murawie
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 1.5, GROUND_Y, 3, 20);

      // Zawleczka / akcent przy linii trawy
      const isHundred = (m % 100 === 0);
      ctx.fillStyle = isHundred ? '#ffeb3b' : '#00e5ff';
      ctx.fillRect(x - 3.5, GROUND_Y - 1, 7, 3);

      // 2. Estetyczna etykieta metrażu (badge z tłem)
      let label = `${m}m`;
      const isPyramidEnter = (m === 1050);
      const isPyramidExit = (m === 1350);
      const isInsidePyramid = (m > 1050 && m < 1350);

      if (isPyramidEnter) {
        label = `★ WEJŚCIE DO PIRAMIDY • ${m}m ★`;
      } else if (isPyramidExit) {
        label = `★ WYJŚCIE Z PIRAMIDY • ${m}m ★`;
      }

      ctx.font = 'bold 12px monospace';
      const textWidth = ctx.measureText(label).width;
      const badgeW = textWidth + 14;
      const badgeH = 18;
      const badgeX = x - badgeW / 2;
      const badgeY = GROUND_Y + 28;

      if (isPyramidEnter || isPyramidExit) {
        ctx.fillStyle = 'rgba(43, 23, 14, 0.92)';
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
      } else if (isInsidePyramid) {
        ctx.fillStyle = 'rgba(28, 16, 10, 0.82)';
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.65)';
        ctx.lineWidth = 1;
      } else {
        ctx.fillStyle = 'rgba(8, 16, 28, 0.78)';
        ctx.strokeStyle = isHundred ? 'rgba(255, 235, 59, 0.70)' : 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1;
      }

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
      } else {
        ctx.rect(badgeX, badgeY, badgeW, badgeH);
      }
      ctx.fill();
      ctx.stroke();

      // Tekst metrażu
      if (isPyramidEnter || isPyramidExit || isInsidePyramid) {
        ctx.fillStyle = '#ffd700';
      } else {
        ctx.fillStyle = isHundred ? '#ffeb3b' : '#ffffff';
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, badgeY + badgeH / 2);

    } else {
      // Pomocnicza mała kreska co 10 metrów (pomijana wewnątrz stadionu oraz wewnątrz piramidy dla czystości posadzki)
      if ((m < 300 || m > 750) && (m < 1050 || m > 1350)) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
        ctx.fillRect(x - 0.75, GROUND_Y, 1.5, 8);
      }
    }
  }

  // Przywrócenie domyślnych ustawień tekstu
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

export function drawHUD(ctx, player, leftStick, btnCluster) {
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 20px monospace';
  ctx.fillText(`DYSTANS: ${currentDist} m`, 24, 38);
  ctx.fillStyle = '#ffeb3b';
  ctx.fillText(`REKORD:  ${bestDistance} m`, 24, 62);

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