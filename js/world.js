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

export function lerpRgbObj(c1, c2, t) {
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * t),
    g: Math.round(c1.g + (c2.g - c1.g) * t),
    b: Math.round(c1.b + (c2.b - c1.b) * t)
  };
}

export function rgbToCss(c) {
  return `rgb(${c.r}, ${c.g}, ${c.b})`;
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
    skyHex: ['#142850', '#8b3210', '#d96b27', '#ffd07a'],
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

export const TRANSITION_ZONE_METERS = 100;
export const TRANSITION_ZONE_HALF = 50; // 50 metrów przed i 50 metrów za granicą biomu
export const TRANSITION_WIDTH_PX = TRANSITION_ZONE_METERS * 14; // 1400 px

/**
 * Funkcja płynnej interpolacji Hermite'a (Smoothstep)
 */
export function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function getPureBiomeObject(b) {
  return {
    id: b.id,
    name: b.name,
    uiColor: b.uiColor,
    sky: b.skyHex,
    skyRgb: b.skyRgb,
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

export function getInterpolatedBiome(dist) {
  // Obliczamy najbliższą granicę biomu (800, 1600, 2400, 3200 m)
  const boundaryIdx = Math.floor((dist + TRANSITION_ZONE_HALF) / BIOME_STEP);
  const clampedIdx = Math.max(0, Math.min(BIOMES.length - 1, boundaryIdx));

  if (clampedIdx === 0) {
    // Przed pierwszą strefą przejścia (< 750 m)
    return getPureBiomeObject(BIOMES[0]);
  }

  const boundaryDist = clampedIdx * BIOME_STEP;
  const zoneStart = boundaryDist - TRANSITION_ZONE_HALF; // np. 750m, 1550m, 2350m...
  const zoneEnd = boundaryDist + TRANSITION_ZONE_HALF;   // np. 850m, 1650m, 2450m...

  if (dist >= zoneStart && dist <= zoneEnd && clampedIdx < BIOMES.length) {
    // Płynna interpolacja w strefie przejściowej (Crossfade)
    const b1 = BIOMES[clampedIdx - 1];
    const b2 = BIOMES[clampedIdx];
    const t = smoothstep(zoneStart, zoneEnd, dist);

    const lerpedSkyRgb = [
      lerpRgbObj(b1.skyRgb[0], b2.skyRgb[0], t),
      lerpRgbObj(b1.skyRgb[1], b2.skyRgb[1], t),
      lerpRgbObj(b1.skyRgb[2], b2.skyRgb[2], t),
      lerpRgbObj(b1.skyRgb[3], b2.skyRgb[3], t)
    ];

    return {
      id: t >= 0.5 ? b2.id : b1.id,
      name: t >= 0.5 ? b2.name : b1.name,
      uiColor: t >= 0.5 ? b2.uiColor : b1.uiColor,
      skyRgb: lerpedSkyRgb,
      sky: [
        rgbToCss(lerpedSkyRgb[0]),
        rgbToCss(lerpedSkyRgb[1]),
        rgbToCss(lerpedSkyRgb[2]),
        rgbToCss(lerpedSkyRgb[3])
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

  // W głębi danego biomu (poza strefami przejściowymi)
  const currentIdx = Math.min(BIOMES.length - 1, Math.floor(dist / BIOME_STEP));
  return getPureBiomeObject(BIOMES[currentIdx]);
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

export let eyeAdaptationFrames = 0;
export const EYE_ADAPTATION_MAX_FRAMES = 18;
export let eyeAdaptationTriggered = false;

export function updateDistance(ballX) {
  currentDist = Math.max(0, Math.floor((ballX - START_X) / 14));
  if (currentDist > bestDistance) {
    bestDistance = currentDist;
  }
  if (currentDist >= 298 && currentDist <= 330 && !eyeAdaptationTriggered) {
    eyeAdaptationTriggered = true;
    eyeAdaptationFrames = EYE_ADAPTATION_MAX_FRAMES;
  }
  if (currentDist < 250) {
    eyeAdaptationTriggered = false;
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
export const DESERT_START_DIST = 800; // Dokładny początek biomu pustynnego na 800 m
export const DESERT_START_X = START_X + DESERT_START_DIST * 14; // 11360 px (sztywna granica świata dla elementów pustynnych)
export const DESERT_END_DIST = 1600; // Koniec biomu pustynnego na 1600 m
export const DESERT_END_X = START_X + DESERT_END_DIST * 14; // 22560 px

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
  if (currentDist < 745 || currentDist > 1655) {
    clearDesertSandstorm();
    return;
  }

  const bounds = getDesertViewBounds();

  if (sandstormClouds.length === 0) {
    initDesertSandstormPool(bounds.left, bounds.right);
  }

  const now = performance.now();
  const baseWind = getSandstormWindForce(now);
  const inFactor = smoothstep(745, 845, currentDist);
  const outFactor = 1.0 - smoothstep(1550, 1655, currentDist);
  const weatherTransition = inFactor * outFactor;
  const windForce = baseWind * Math.max(0.35, weatherTransition);
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
  if (currentDist < 745 || currentDist > 1655) return;

  const inFactor = smoothstep(745, 845, currentDist);
  const outFactor = 1.0 - smoothstep(1550, 1655, currentDist);
  const weatherTransition = inFactor * outFactor;
  const insideFactor = getPyramidInsideFactor(currentDist);
  const sandstormIntensity = (1.0 - insideFactor) * weatherTransition;
  if (sandstormIntensity <= 0.005) return;

  const bounds = getDesertViewBounds();
  const wl = (worldLeft !== undefined) ? worldLeft : bounds.left;
  const wr = (worldRight !== undefined) ? worldRight : bounds.right;
  if (wl >= wr) return;

  if (sandstormClouds.length === 0) {
    initDesertSandstormPool(wl, wr);
  }

  const now = performance.now();

  ctx.save();

  // A. Ciepła mgła pyłowa (Ambient Dust Haze Overlay)
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

  // B. Kłęby i aerodynamiczne tumany pyłu pustynnego w tle (skalowane weatherTransition)
  const activeCloudsCount = Math.round(sandstormClouds.length * Math.max(0.12, weatherTransition));
  for (let i = 0; i < activeCloudsCount; i++) {
    const c = sandstormClouds[i];
    const halfW = c.r * c.scaleX;
    if (c.x + halfW < wl - 40 || c.x - halfW > wr + 60) continue;

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

  // C. Zróżnicowane ziarna piasku i pędzące smugi (skalowane weatherTransition)
  // W strefie przejściowej 745-845m gracz widzi najpierw pojedyncze ziarenka nawiewane na murawę
  const activeGrainsCount = Math.max(4, Math.round(sandstormGrains.length * weatherTransition));
  for (let i = 0; i < activeGrainsCount; i++) {
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

  // D. Delikatny kurz we wnętrzu piramidy (Tomb Dust Motes)
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
  if (currentDist < 745 || currentDist > 1655) return;
  const inFactor = smoothstep(745, 845, currentDist);
  const outFactor = 1.0 - smoothstep(1550, 1655, currentDist);
  const weatherTransition = inFactor * outFactor;
  const insideFactor = getPyramidInsideFactor(currentDist);
  const sandstormIntensity = (1.0 - insideFactor) * weatherTransition;
  if (sandstormIntensity <= 0.005) return;

  const wl = worldLeft;
  const wr = worldRight;
  if (wl >= wr) return;

  ctx.save();
  const activeFgCount = Math.round(sandstormForegroundGrains.length * weatherTransition);
  for (let i = 0; i < activeFgCount; i++) {
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
 * Kolumny papirusowe z rzeźbionym kapitelem podtrzymujące monumentalny strop (Grand Hypostyle Hall)
 */
function drawPapyrusColumn(ctx, cx, gy, isForeground, colH = 580) {
  ctx.save();
  const colW = isForeground ? 56 : 38;
  const topY = gy - colH;

  // Cokół kolumny (masywna baza torusowa osadzona w posadzce)
  ctx.fillStyle = isForeground ? '#3a1f11' : '#573623';
  ctx.fillRect(cx - colW * 0.75, gy - 24, colW * 1.5, 24);
  ctx.fillStyle = isForeground ? '#542f1a' : '#734930';
  ctx.fillRect(cx - colW * 0.62, gy - 32, colW * 1.24, 8);
  ctx.strokeStyle = '#24140b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cx - colW * 0.75, gy - 24, colW * 1.5, 24);

  // Trzon kolumny z pionowymi żebrami i gradientem światłocienia
  const gradCol = ctx.createLinearGradient(cx - colW / 2, 0, cx + colW / 2, 0);
  if (isForeground) {
    gradCol.addColorStop(0, '#221109');
    gradCol.addColorStop(0.3, '#4a2916');
    gradCol.addColorStop(0.7, '#6b3c20');
    gradCol.addColorStop(1, '#221109');
  } else {
    gradCol.addColorStop(0, '#2c160c');
    gradCol.addColorStop(0.35, '#5c351f');
    gradCol.addColorStop(0.7, '#7d4a2d');
    gradCol.addColorStop(1, '#2c160c');
  }
  ctx.fillStyle = gradCol;
  ctx.fillRect(cx - colW / 2, topY + 70, colW, colH - 102);

  // Pionowe linie kanelur (fluting)
  ctx.strokeStyle = 'rgba(20, 10, 5, 0.4)';
  ctx.lineWidth = 1;
  const flutes = 5;
  for (let f = 1; f < flutes; f++) {
    const fx = cx - colW / 2 + (colW / flutes) * f;
    ctx.beginPath();
    ctx.moveTo(fx, topY + 75);
    ctx.lineTo(fx, gy - 35);
    ctx.stroke();
  }

  // Złote obręcze i pierścienie astragalu na kolumnie
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(cx - colW / 2 - 2, topY + 110, colW + 4, 6);
  ctx.fillRect(cx - colW / 2 - 2, gy - 80, colW + 4, 6);
  ctx.fillStyle = '#b45309';
  ctx.fillRect(cx - colW / 2 - 2, topY + 116, colW + 4, 2);
  ctx.fillRect(cx - colW / 2 - 2, gy - 74, colW + 4, 2);

  // Kartusze hieroglificzne na trzonie kolumny
  if (!isForeground) {
    const hieroY = gy - colH * 0.45;
    drawHieroglyphSymbol(ctx, Math.abs(Math.floor(cx / 70)) % 6, cx, hieroY, 18, '#ffd54f');
    drawHieroglyphSymbol(ctx, (Math.abs(Math.floor(cx / 70)) + 3) % 6, cx, hieroY + 45, 16, '#e0a96d');
  }

  // Kapitel kolumny w kształcie rozwiniętego kielicha lotosu / papirusu
  const capH = 70;
  const capTopY = topY;
  const capBaseY = topY + capH;

  const capGrad = ctx.createLinearGradient(cx - colW * 0.9, 0, cx + colW * 0.9, 0);
  capGrad.addColorStop(0, isForeground ? '#3a1f11' : '#4e2d19');
  capGrad.addColorStop(0.5, isForeground ? '#683b20' : '#854f2e');
  capGrad.addColorStop(1, isForeground ? '#2b160c' : '#3d2011');
  ctx.fillStyle = capGrad;

  ctx.beginPath();
  ctx.moveTo(cx - colW / 2, capBaseY);
  ctx.quadraticCurveTo(cx - colW * 1.1, capTopY + 28, cx - colW * 0.95, capTopY + 8);
  ctx.lineTo(cx + colW * 0.95, capTopY + 8);
  ctx.quadraticCurveTo(cx + colW * 1.1, capTopY + 28, cx + colW / 2, capBaseY);
  ctx.closePath();
  ctx.fill();

  // Rzeźbione płatki lotosu na kapitelu
  ctx.fillStyle = isForeground ? '#d97706' : '#ffd54f';
  ctx.beginPath();
  ctx.moveTo(cx, capBaseY - 5);
  ctx.lineTo(cx - colW * 0.4, capTopY + 15);
  ctx.lineTo(cx, capTopY + 10);
  ctx.lineTo(cx + colW * 0.4, capTopY + 15);
  ctx.closePath();
  ctx.fill();

  // Masywny kamienny abakus i architraw nad głowicą
  ctx.fillStyle = isForeground ? '#261309' : '#3d2214';
  ctx.fillRect(cx - colW * 1.05, capTopY - 14, colW * 2.1, 22);
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(cx - colW * 1.05, capTopY + 6, colW * 2.1, 2);

  ctx.restore();
}

/**
 * Żelazny kosz z ogniem (brazier) lub pochodnia na kolumnie z animowanym płomieniem
 */
function drawWallTorch(ctx, tx, gy, now) {
  ctx.save();
  const torchY = gy - 190;
  const seed = tx * 0.07;

  // Kuta żelazna krata i wspornik ścienny
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(tx - 18, torchY + 14, 36, 6);
  ctx.beginPath();
  ctx.moveTo(tx - 14, torchY + 20);
  ctx.lineTo(tx, torchY + 38);
  ctx.lineTo(tx + 14, torchY + 20);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1c1917';
  ctx.stroke();

  // Miska paleniska (żelazny kocioł)
  ctx.fillStyle = '#292524';
  ctx.beginPath();
  ctx.moveTo(tx - 20, torchY);
  ctx.lineTo(tx + 20, torchY);
  ctx.lineTo(tx + 14, torchY + 16);
  ctx.lineTo(tx - 14, torchY + 16);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#44403c';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Żarzące się węgle
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(tx - 17, torchY - 2, 34, 5);
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(tx - 14, torchY - 4, 28, 4);

  // Animacja płomienia
  const flickX = Math.sin(now * 0.007 + seed) * 3.5 + Math.cos(now * 0.014 + seed * 2) * 1.8;
  const flickY = Math.cos(now * 0.009 + seed) * 4.5;
  const flameH = 34 + flickY;

  // Zewnętrzny szkarłatny płomień
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.moveTo(tx - 16, torchY - 3);
  ctx.quadraticCurveTo(tx - 18 + flickX * 0.6, torchY - flameH * 0.5, tx + flickX, torchY - flameH);
  ctx.quadraticCurveTo(tx + 18 + flickX * 0.6, torchY - flameH * 0.5, tx + 16, torchY - 3);
  ctx.closePath();
  ctx.fill();

  // Środkowy złoty płomień
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(tx - 11, torchY - 3);
  ctx.quadraticCurveTo(tx - 12 + flickX * 0.5, torchY - flameH * 0.45, tx + flickX * 0.8, torchY - flameH * 0.82);
  ctx.quadraticCurveTo(tx + 12 + flickX * 0.5, torchY - flameH * 0.45, tx + 11, torchY - 3);
  ctx.closePath();
  ctx.fill();

  // Rdzeń biało-żółtego ognia
  ctx.fillStyle = '#fffbeb';
  ctx.beginPath();
  ctx.moveTo(tx - 6, torchY - 3);
  ctx.quadraticCurveTo(tx - 6, torchY - flameH * 0.35, tx + flickX * 0.5, torchY - flameH * 0.55);
  ctx.quadraticCurveTo(tx + 6, torchY - flameH * 0.35, tx + 6, torchY - 3);
  ctx.closePath();
  ctx.fill();

  // Unoszące się iskry
  for (let s = 0; s < 4; s++) {
    const spPhase = now * 0.004 + seed + s * 1.7;
    const spY = torchY - 12 - ((now * 0.06 + s * 16 + seed * 25) % 65);
    const spX = tx + Math.sin(spPhase) * 10 + flickX * 0.6;
    const spAlpha = Math.max(0, 1.0 - (torchY - spY) / 65);
    ctx.fillStyle = `rgba(254, 240, 138, ${spAlpha})`;
    ctx.fillRect(spX - 1, spY - 1, 2.5, 2.5);
  }

  // RadialGradient ciepłego światła ognia (rozświetla ściany i kolumny)
  const pulseR = 250 + Math.sin(now * 0.006 + seed) * 22;
  const torchGlow = ctx.createRadialGradient(tx, torchY - 10, 10, tx, torchY - 10, pulseR);
  torchGlow.addColorStop(0, 'rgba(255, 140, 0, 0.24)');
  torchGlow.addColorStop(0.35, 'rgba(255, 100, 10, 0.11)');
  torchGlow.addColorStop(0.7, 'rgba(180, 50, 10, 0.035)');
  torchGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = torchGlow;
  ctx.beginPath();
  ctx.arc(tx, torchY - 10, pulseR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Monumentalny posąg strażnika faraona / sfinksa wykuty z piaskowca, osadzony w nawiewkach piasku
 */
function drawColossalGuardianStatue(ctx, sx, gy, facingLeft) {
  ctx.save();
  ctx.translate(sx, gy);
  if (facingLeft) ctx.scale(-1, 1);

  // Masywny piedestał z piaskowca
  ctx.fillStyle = '#4a2c1d';
  ctx.fillRect(-24, -26, 56, 26);
  ctx.fillStyle = '#6d4c2b';
  ctx.fillRect(-22, -32, 52, 6);
  ctx.strokeStyle = '#2b170e';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-24, -26, 56, 26);

  // Tron i siedząca sylwetka
  ctx.fillStyle = '#73482a';
  ctx.fillRect(6, -80, 20, 50);
  ctx.fillRect(-16, -100, 38, 26);
  ctx.fillRect(-20, -160, 30, 68);

  // Ręce spoczywające na kolanach
  ctx.fillStyle = '#8d5c36';
  ctx.fillRect(-10, -118, 36, 12);

  // Głowa faraona
  ctx.fillStyle = '#7a4e2d';
  ctx.beginPath();
  ctx.arc(-5, -172, 15, 0, Math.PI * 2);
  ctx.fill();

  // Chusta Nemes ze złotymi pasami
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.moveTo(-22, -182);
  ctx.lineTo(12, -182);
  ctx.lineTo(16, -150);
  ctx.lineTo(-4, -156);
  ctx.lineTo(-26, -150);
  ctx.closePath();
  ctx.fill();

  // Boska broda faraona
  ctx.fillStyle = '#3b2416';
  ctx.fillRect(4, -162, 5, 18);

  // Nawiewka piasku wokół piedestału (organiczne zakopanie w wydmach)
  ctx.fillStyle = '#dca264';
  ctx.beginPath();
  ctx.moveTo(-32, 0);
  ctx.quadraticCurveTo(-15, -18, 8, -6);
  ctx.quadraticCurveTo(24, -22, 38, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Monumentalne portale wejściowy (1050 m) i wyjściowy (1350 m) z nadprożem,
 * cavetto cornice, skrzydlatym dyskiem słońca Ra i ozdobną tablicą z napisem.
 * Rysowane jako spójny obiekt na wierzchu tła.
 */
function drawPortalPylons(ctx, px, gy, isExit) {
  ctx.save();
  const pylonW = 90;
  const pylonH = 320;
  const gateW = 320;
  const leftX = px - gateW / 2;               // px - 160
  const rightX = px + gateW / 2 - pylonW;     // px + 70

  const archW = 136;
  const archH = 240;
  const archX = px - archW / 2;               // px - 68
  const archY = gy - archH;                   // gy - 240

  // 1. Otwór bramy (Archway Opening) – rysowany w pierwszej kolejności,
  // dzięki czemu boczne filary i nadproże okalają go estetycznie od wierzchu
  if (!isExit) {
    // Portal wejściowy (1050 m): przejście w głąb tajemniczego, monumentalnego grobowca
    const darkGrad = ctx.createLinearGradient(archX, 0, archX + archW, 0);
    darkGrad.addColorStop(0, '#100704');
    darkGrad.addColorStop(0.5, '#050201');
    darkGrad.addColorStop(1, '#100704');
    ctx.fillStyle = darkGrad;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(archX, archY, archW, archH, [36, 36, 0, 0]);
    } else {
      ctx.rect(archX, archY, archW, archH);
    }
    ctx.fill();

    // Wewnętrzny cień pod łukiem
    const archShadow = ctx.createLinearGradient(0, archY, 0, archY + 45);
    archShadow.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    archShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = archShadow;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(archX, archY, archW, 45, [36, 36, 0, 0]);
    } else {
      ctx.rect(archX, archY, archW, 45);
    }
    ctx.fill();
  } else {
    // Portal wyjściowy (1350 m): pustynne słońce wlewające się przez otwór bramy
    const sunExitGrad = ctx.createRadialGradient(px, gy - archH * 0.45, 12, px, gy - archH * 0.45, archW * 1.1);
    sunExitGrad.addColorStop(0, 'rgba(255, 255, 250, 0.95)');
    sunExitGrad.addColorStop(0.35, 'rgba(255, 235, 150, 0.75)');
    sunExitGrad.addColorStop(0.7, 'rgba(245, 175, 60, 0.40)');
    sunExitGrad.addColorStop(1, 'rgba(212, 163, 115, 0.0)');
    ctx.fillStyle = sunExitGrad;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(archX, archY, archW, archH, [36, 36, 0, 0]);
    } else {
      ctx.rect(archX, archY, archW, archH);
    }
    ctx.fill();
  }

  // 2. Monumentalne pylony (filary boczne) z egipskim nachyleniem ścian (batter)
  const drawPylon = (x, isRight) => {
    const batter = 16;
    const pylonGrad = ctx.createLinearGradient(x, gy - pylonH, x + pylonW, gy);
    if (isExit) {
      pylonGrad.addColorStop(0, '#9c6d3d');
      pylonGrad.addColorStop(0.5, '#87582b');
      pylonGrad.addColorStop(1, '#693e1c');
    } else {
      pylonGrad.addColorStop(0, '#b88858');
      pylonGrad.addColorStop(0.5, '#a17244');
      pylonGrad.addColorStop(1, '#7e5029');
    }
    ctx.fillStyle = pylonGrad;

    ctx.beginPath();
    ctx.moveTo(x + (isRight ? batter : 0), gy - pylonH);
    ctx.lineTo(x + pylonW - (isRight ? 0 : batter), gy - pylonH);
    ctx.lineTo(x + pylonW, gy);
    ctx.lineTo(x, gy);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#4e2d1a';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Poziome spoiny megalitycznych bloków
    ctx.strokeStyle = 'rgba(60, 36, 22, 0.35)';
    ctx.lineWidth = 1;
    for (let y = gy - pylonH + 25; y < gy; y += 24) {
      ctx.beginPath();
      ctx.moveTo(x + 2, y);
      ctx.lineTo(x + pylonW - 2, y);
      ctx.stroke();
    }

    // Klasyczny egipski gzyms cavetto na szczycie pylonu
    ctx.fillStyle = '#ffd54f';
    ctx.fillRect(x - 4, gy - pylonH - 8, pylonW + 8, 8);
    ctx.fillStyle = '#6d4c2b';
    ctx.fillRect(x - 8, gy - pylonH - 22, pylonW + 16, 14);
    ctx.strokeStyle = '#4a2c1d';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 8, gy - pylonH - 22, pylonW + 16, 14);
  };

  drawPylon(leftX, false);
  drawPylon(rightX, true);

  // 3. Kamienne monumentalne nadproże portalu (architraw)
  const lintelOverhang = 22;
  const lintelW = gateW + lintelOverhang * 2; // 364 px – szerokie i spójne
  const lintelX = px - lintelW / 2;           // px - 182 do px + 182
  const lintelH = 82;
  const lintelY = gy - pylonH - 34;           // gy - 354 do gy - 272

  const lintelGrad = ctx.createLinearGradient(lintelX, lintelY, lintelX, lintelY + lintelH);
  lintelGrad.addColorStop(0, isExit ? '#8f6036' : '#9c6a3c');
  lintelGrad.addColorStop(0.5, isExit ? '#7a4d27' : '#88572e');
  lintelGrad.addColorStop(1, isExit ? '#63391b' : '#6f4121');
  ctx.fillStyle = lintelGrad;
  ctx.fillRect(lintelX, lintelY, lintelW, lintelH);

  ctx.strokeStyle = '#422415';
  ctx.lineWidth = 3;
  ctx.strokeRect(lintelX, lintelY, lintelW, lintelH);

  // Zwieńczenie gzymsu nadproża (złoty wałek torus i fryz)
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(lintelX - 3, lintelY - 4, lintelW + 6, 4);
  ctx.fillStyle = '#5c381f';
  ctx.fillRect(lintelX - 6, lintelY - 12, lintelW + 12, 8);
  ctx.strokeStyle = '#381c0c';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(lintelX - 6, lintelY - 12, lintelW + 12, 8);

  // 4. Skrzydlaty Dysk Słońca Ra (Winged Sun Disk of Ra) – złote godło
  const midX = px;
  const diskY = lintelY + 23;

  // Złote skrzydła (rozpiętość 270 px)
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  // Lewe skrzydło
  ctx.moveTo(midX, diskY);
  ctx.quadraticCurveTo(midX - 70, diskY - 15, midX - 135, diskY);
  ctx.quadraticCurveTo(midX - 70, diskY + 11, midX, diskY + 5);
  // Prawe skrzydło
  ctx.moveTo(midX, diskY);
  ctx.quadraticCurveTo(midX + 70, diskY - 15, midX + 135, diskY);
  ctx.quadraticCurveTo(midX + 70, diskY + 11, midX, diskY + 5);
  ctx.fill();

  // Relief i pióra na skrzydłach
  ctx.strokeStyle = 'rgba(180, 83, 9, 0.6)';
  ctx.lineWidth = 1.2;
  for (let s = -1; s <= 1; s += 2) {
    for (let f = 1; f <= 5; f++) {
      const fx = midX + s * (22 + f * 20);
      const fy = diskY - 2 + (f % 2) * 2;
      ctx.beginPath();
      ctx.moveTo(fx, fy - 6);
      ctx.lineTo(fx + s * 12, fy + 5);
      ctx.stroke();
    }
  }

  // Dysk słoneczny w centrum
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(midX, diskY, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd54f';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Złote kobry (uraei)
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(midX - 19, diskY - 6, 5, 13);
  ctx.fillRect(midX + 14, diskY - 6, 5, 13);

  // 5. Elegancka tablica / szyld z napisem (Signboard Plaque)
  const plateW = 324;
  const plateH = 26;
  const plateX = px - plateW / 2;
  const plateY = lintelY + 45;

  const plateGrad = ctx.createLinearGradient(plateX, 0, plateX + plateW, 0);
  plateGrad.addColorStop(0, '#190d07');
  plateGrad.addColorStop(0.5, '#2e180d');
  plateGrad.addColorStop(1, '#190d07');
  ctx.fillStyle = plateGrad;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(plateX, plateY, plateW, plateH, 4);
  } else {
    ctx.rect(plateX, plateY, plateW, plateH);
  }
  ctx.fill();

  // Złote obramowanie tablicy
  ctx.strokeStyle = '#ffd54f';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Ozdobne narożne złote nity
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(plateX + 3, plateY + 3, 3, 3);
  ctx.fillRect(plateX + plateW - 6, plateY + 3, 3, 3);
  ctx.fillRect(plateX + 3, plateY + plateH - 6, 3, 3);
  ctx.fillRect(plateX + plateW - 6, plateY + plateH - 6, 3, 3);

  // Precyzyjnie wyśrodkowany tekst z bezpiecznym marginesem (paddingiem > 70 px)
  const signText = isExit ? '★ WYJŚCIE • KRES GROBOWCA ★' : '★ WIELKA PIRAMIDA • 1050M ★';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 11px monospace';
  ctx.shadowColor = 'rgba(255, 213, 79, 0.45)';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#ffd54f';
  ctx.fillText(signText, px, plateY + plateH / 2);
  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // 6. Posągi strażników po bokach, osadzone w wydmach
  drawColossalGuardianStatue(ctx, leftX - 48, gy, false);
  drawColossalGuardianStatue(ctx, rightX + pylonW + 18, gy, true);

  // 7. Organiczne nawiewki piasku u podstawy bramy
  ctx.fillStyle = '#dca264';
  ctx.beginPath();
  ctx.moveTo(leftX - 80, gy);
  ctx.quadraticCurveTo(leftX - 20, gy - 28, leftX + pylonW * 0.5, gy);
  ctx.quadraticCurveTo(archX + 20, gy - 16, archX + archW * 0.5, gy);
  ctx.quadraticCurveTo(rightX + 20, gy - 24, rightX + pylonW + 80, gy);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Monumentalne portale wejściowy (1050 m) i wyjściowy (1350 m) Wielkiej Piramidy
 * Rysowane na wierzchu tła zewnętrznego i wewnętrznego muru grobowca,
 * jako spójne obiekty bez przycinania tablicy, złotego godła ani filarów.
 */
export function drawPyramidPortals(ctx, worldLeft, worldRight) {
  if (worldRight !== undefined && worldRight <= DESERT_START_X) return;
  const enterX = PYRAMID_ENTER_X;
  const exitX = PYRAMID_EXIT_X;
  const gy = GROUND_Y;

  // Bezpieczny margines 400 px – brak twardego obcinania dekoracji bramy
  if (enterX >= worldLeft - 400 && enterX <= worldRight + 400) {
    drawPortalPylons(ctx, enterX, gy, false);
  }

  if (exitX >= worldLeft - 400 && exitX <= worldRight + 400) {
    drawPortalPylons(ctx, exitX, gy, true);
  }
}

/**
 * Zgodność wsteczna: dawne przednie warstwy portali zastąpione spójnym renderowaniem w drawPortalPylons
 */
function drawEntrancePortalForeground(ctx, enterX, gy) {}
function drawExitPortalForeground(ctx, exitX, gy) {}

/**
 * 1. WIELOWARSTWOWE WYDMY: DALEKI PLAN (PARALLAX 0.05)
 * Łagodne zarysy wzgórz piaskowych w odcieniach spalonego słońcem pomarańczu i zamglonego pyłu
 * Aktywowane ściśle od granicy biomu pustynnego (currentDist >= 800 m)
 */
export function drawFarDunes(ctx, currentDist) {
  if (currentDist < 740 || currentDist > 1660) return;
  const insideFactor = getPyramidInsideFactor(currentDist);
  if (insideFactor >= 0.99) return;

  let alpha = smoothstep(740, 850, currentDist) * (1.0 - smoothstep(1550, 1660, currentDist));
  alpha *= (1.0 - insideFactor);
  if (alpha <= 0.01) return;

  const camX = camera ? camera.x : 0;
  const scrollFar = (camX - START_X) * 0.05;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.92));

  const baseY = H * 0.77;
  // Warstwa dalekich wydm: spalony słońcem pomarańcz i zamglony pył
  const farGrad = ctx.createLinearGradient(0, baseY - 120, 0, baseY);
  farGrad.addColorStop(0, '#c98a58');
  farGrad.addColorStop(0.5, '#b07040');
  farGrad.addColorStop(1.0, '#8c4e25');
  ctx.fillStyle = farGrad;

  ctx.beginPath();
  ctx.moveTo(-60, H);
  ctx.lineTo(-60, baseY - 50);

  // Płynne krzywe Béziera
  const segW = 280;
  const numSegs = Math.ceil((W + 180) / segW) + 2;
  const startIdx = Math.floor(scrollFar / segW) - 1;

  for (let i = 0; i <= numSegs; i++) {
    const idx = startIdx + i;
    const segX = idx * segW - scrollFar;
    const nextSegX = segX + segW;
    const midX = segX + segW * 0.5;

    const h1 = Math.sin(idx * 1.35) * 35 + Math.cos(idx * 0.7) * 20;
    const h2 = Math.sin((idx + 1) * 1.35) * 35 + Math.cos((idx + 1) * 0.7) * 20;
    const peakY = baseY - 65 - h1;
    const nextPeakY = baseY - 65 - h2;
    const controlY = Math.min(peakY, nextPeakY) - 18;

    ctx.quadraticCurveTo(midX, controlY, nextSegX, nextPeakY);
  }

  ctx.lineTo(W + 80, H);
  ctx.closePath();
  ctx.fill();

  // Subtelna mgiełka pyłowa spalonego słońcem horyzontu
  const dustHaze = ctx.createLinearGradient(0, baseY - 140, 0, baseY);
  dustHaze.addColorStop(0, 'rgba(235, 175, 115, 0.0)');
  dustHaze.addColorStop(0.5, 'rgba(217, 107, 39, 0.16)');
  dustHaze.addColorStop(1.0, 'rgba(180, 85, 30, 0.32)');
  ctx.fillStyle = dustHaze;
  ctx.fillRect(0, baseY - 140, W, 140);

  ctx.restore();
}

/**
 * SYLWETKA WIELKIEJ PIRAMIDY NA HORYZONCIE NIEBA (WARSTWA PARALAKSY)
 * Umieszczona pomiędzy dalekimi a średnimi wydmami, z podstawą zakopaną w piasku
 * Płynnie wyłania się na horyzoncie z narastającą przezroczystością (740m – 850m)
 */
export function drawDistantPyramidParallax(ctx, currentDist) {
  if (currentDist < 740 || currentDist > 1660) return;
  const insideFactor = getPyramidInsideFactor(currentDist);
  if (insideFactor >= 0.99) return;

  let alpha = smoothstep(740, 850, currentDist) * (1.0 - smoothstep(1550, 1660, currentDist));
  alpha *= (1.0 - insideFactor);
  if (alpha <= 0.01) return;

  const camX = camera ? camera.x : 0;
  const pyrScroll = (camX - START_X - 1000 * 14) * 0.055;
  const horizonX = W * 0.52 - pyrScroll;
  const horizonY = H * 0.77; // Podstawa zanurzona poniżej grani średnich wydm
  const pyrW = 560;
  const pyrH = 280;
  const peakX = horizonX;
  const peakY = horizonY - pyrH;
  const leftX = horizonX - pyrW * 0.58;
  const rightX = horizonX + pyrW * 0.42;
  const ridgeX = horizonX - pyrW * 0.08;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.92));

  // 1. Oświetlona ściana wschodnia (jasny piaskowiec)
  const litGrad = ctx.createLinearGradient(leftX, horizonY, ridgeX, peakY);
  litGrad.addColorStop(0, '#d99f5e');
  litGrad.addColorStop(0.5, '#e8bc7c');
  litGrad.addColorStop(1, '#fbe3b5');
  ctx.fillStyle = litGrad;
  ctx.beginPath();
  ctx.moveTo(leftX, horizonY);
  ctx.lineTo(peakX, peakY);
  ctx.lineTo(ridgeX, horizonY);
  ctx.closePath();
  ctx.fill();

  // 2. Zacieniona ściana zachodnia (głęboki cień)
  const shadowGrad = ctx.createLinearGradient(ridgeX, peakY, rightX, horizonY);
  shadowGrad.addColorStop(0, '#9c663b');
  shadowGrad.addColorStop(0.6, '#734624');
  shadowGrad.addColorStop(1, '#4a2814');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.moveTo(ridgeX, horizonY);
  ctx.lineTo(peakX, peakY);
  ctx.lineTo(rightX, horizonY);
  ctx.closePath();
  ctx.fill();

  // 3. Poziome rzędy bloków kamiennych (24 stopnie)
  const numSteps = 24;
  for (let s = 1; s <= numSteps; s++) {
    const t = s / numSteps;
    const sy = peakY + (horizonY - peakY) * t;
    const lx = peakX + (leftX - peakX) * t;
    const rx = peakX + (rightX - peakX) * t;
    const mx = peakX + (ridgeX - peakX) * t;

    ctx.strokeStyle = 'rgba(74, 40, 20, 0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx, sy);
    ctx.lineTo(mx, sy);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(25, 12, 6, 0.45)';
    ctx.beginPath();
    ctx.moveTo(mx, sy);
    ctx.lineTo(rx, sy);
    ctx.stroke();
  }

  // 4. Złoty Pyramidion na szczycie
  const capH = 30;
  const capT = capH / pyrH;
  const capLeft = peakX + (leftX - peakX) * capT;
  const capRight = peakX + (rightX - peakX) * capT;
  const capRidge = peakX + (ridgeX - peakX) * capT;
  const capY = peakY + capH;

  const goldGrad = ctx.createLinearGradient(capLeft, capY, capRight, peakY);
  goldGrad.addColorStop(0, '#ffd54f');
  goldGrad.addColorStop(0.4, '#fff9c4');
  goldGrad.addColorStop(0.85, '#f59e0b');
  goldGrad.addColorStop(1.0, '#b45309');
  ctx.fillStyle = goldGrad;
  ctx.beginPath();
  ctx.moveTo(capLeft, capY);
  ctx.lineTo(peakX, peakY);
  ctx.lineTo(capRight, capY);
  ctx.lineTo(capRidge, capY);
  ctx.closePath();
  ctx.fill();

  // Blik świetlny pyramidionu
  const now = performance.now();
  const gleam = Math.sin(now * 0.0035) * 0.4 + 0.6;
  const glint = ctx.createRadialGradient(peakX, peakY, 0, peakX, peakY, 40);
  glint.addColorStop(0, `rgba(255, 255, 240, ${0.9 * gleam})`);
  glint.addColorStop(0.3, `rgba(255, 215, 0, ${0.5 * gleam})`);
  glint.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = glint;
  ctx.beginPath();
  ctx.arc(peakX, peakY, 40, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 2. WIELOWARSTWOWE WYDMY: ŚREDNI PLAN (PARALLAX 0.14)
 * Wyraziste grzbiety piaskowe z oświetloną stroną złotą (#e2a868) i stroną zacienioną (#b57642)
 * Rysowane PRZED piramidą na horyzoncie, zakopując jej podstawę w piasku!
 */
export function drawMidDunes(ctx, currentDist) {
  if (currentDist < 740 || currentDist > 1660) return;
  const insideFactor = getPyramidInsideFactor(currentDist);
  if (insideFactor >= 0.99) return;

  let alpha = smoothstep(740, 850, currentDist) * (1.0 - smoothstep(1550, 1660, currentDist));
  alpha *= (1.0 - insideFactor);
  if (alpha <= 0.01) return;

  const camX = camera ? camera.x : 0;
  const scrollMid = (camX - START_X) * 0.14;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.96));

  const baseY = H * 0.81;
  const segW = 320;
  const numSegs = Math.ceil((W + 200) / segW) + 2;
  const startIdx = Math.floor(scrollMid / segW) - 1;

  for (let i = 0; i <= numSegs; i++) {
    const idx = startIdx + i;
    const segX = idx * segW - scrollMid;
    const nextSegX = segX + segW;
    const midX = segX + segW * 0.45;

    const crestH = Math.sin(idx * 1.6) * 45 + Math.cos(idx * 0.85) * 28;
    const crestY = baseY - 75 - crestH;
    const nextCrestH = Math.sin((idx + 1) * 1.6) * 45 + Math.cos((idx + 1) * 0.85) * 28;
    const nextCrestY = baseY - 75 - nextCrestH;

    // 1. Zacienione zbocze lewe (odwietrzna strona wydmy)
    const shadowDune = ctx.createLinearGradient(segX, crestY, midX, baseY);
    shadowDune.addColorStop(0, '#b57642');
    shadowDune.addColorStop(0.5, '#965a2d');
    shadowDune.addColorStop(1, '#6b3a1a');
    ctx.fillStyle = shadowDune;
    ctx.beginPath();
    ctx.moveTo(segX, baseY + 40);
    ctx.lineTo(segX, crestY + 20);
    ctx.quadraticCurveTo(segX + (midX - segX) * 0.5, crestY - 12, midX, crestY);
    ctx.lineTo(midX, baseY + 40);
    ctx.closePath();
    ctx.fill();

    // 2. Oświetlone zbocze prawe (nawietrzna strona wydmy oświetlona złotym słońcem)
    const litDune = ctx.createLinearGradient(midX, crestY, nextSegX, baseY);
    litDune.addColorStop(0, '#fce0a6');
    litDune.addColorStop(0.2, '#e2a868');
    litDune.addColorStop(0.7, '#c98a58');
    litDune.addColorStop(1, '#a6693a');
    ctx.fillStyle = litDune;
    ctx.beginPath();
    ctx.moveTo(midX, crestY);
    ctx.quadraticCurveTo(midX + (nextSegX - midX) * 0.55, crestY + 10, nextSegX, nextCrestY);
    ctx.lineTo(nextSegX, baseY + 40);
    ctx.lineTo(midX, baseY + 40);
    ctx.closePath();
    ctx.fill();

    // 3. Rozświetlona, ostra krawędź grani wydmy (crestridge)
    ctx.strokeStyle = '#fce0a6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(segX + 10, crestY + 15);
    ctx.quadraticCurveTo(segX + (midX - segX) * 0.5, crestY - 12, midX, crestY);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 3. WIELOWARSTWOWE WYDMY: BLISKI PLAN (PRZESTRZEŃ ŚWIATA ZA MURAWA)
 * Baza pod piramidę w skali 1:1 – organicznie zakopana w piasku, a nie na prostej linii
 * Sztywno ograniczona do obszaru pustynnego: X >= DESERT_START_X
 */
export function drawNearDunes(ctx, worldLeft, worldRight) {
  const duneStart = START_X + 760 * 14;
  const duneEnd = START_X + 1640 * 14;

  if (duneEnd < worldLeft - 100 || duneStart > worldRight + 100) return;

  const startX = Math.max(duneStart, worldLeft - 180);
  const endX = Math.min(duneEnd, worldRight + 180);
  if (startX >= endX) return;

  const gy = GROUND_Y;
  ctx.save();

  // Funkcja płynnej wysokości wydmy w przestrzeni świata (bez ostrych szwów)
  const getDuneH = (x, phaseOffset, hScale) => {
    const k = (x - START_X) * 0.0032;
    const wave = Math.sin(k * 1.4 + phaseOffset) * 36 +
                 Math.cos(k * 0.75 + phaseOffset * 1.3) * 22 +
                 Math.sin(k * 2.8 + phaseOffset * 0.5) * 12 + 58;
    const mDist = (x - START_X) / 14;
    const fade = smoothstep(760, 850, mDist) * (1.0 - smoothstep(1550, 1640, mDist));
    return wave * hScale * fade;
  };

  const step = 45; // gęste, idealnie gładkie próbkowanie łuku krzywej
  const numSteps = Math.ceil((endX - startX) / step);

  // ----------------------------------------------------
  // WARSTWA 1: DALSZA PRZYZIEMNA WYDMA (CIEPLEJSZY PÓŁCIEŃ W TLE)
  // ----------------------------------------------------
  const bgGrad = ctx.createLinearGradient(0, gy - 110, 0, gy);
  bgGrad.addColorStop(0, '#c4874e');
  bgGrad.addColorStop(0.45, '#a66838');
  bgGrad.addColorStop(1.0, '#75401d');

  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.moveTo(startX, gy + 15);
  ctx.lineTo(startX, gy - getDuneH(startX, 1.8, 0.85));

  for (let i = 1; i <= numSteps; i++) {
    const x = startX + i * step;
    const prevX = startX + (i - 1) * step;
    const y = gy - getDuneH(x, 1.8, 0.85);
    const prevY = gy - getDuneH(prevX, 1.8, 0.85);
    const midX = (prevX + x) * 0.5;
    const midY = (prevY + y) * 0.5;
    ctx.quadraticCurveTo(prevX, prevY, midX, midY);
  }
  ctx.lineTo(endX, gy + 15);
  ctx.closePath();
  ctx.fill();

  // ----------------------------------------------------
  // WARSTWA 2: GŁÓWNA, JEDWABISTA WYDMA PUSTYNNA (ZŁOCISTE ŚWIATŁO SŁOŃCA)
  // ----------------------------------------------------
  const fgGrad = ctx.createLinearGradient(0, gy - 130, 0, gy);
  fgGrad.addColorStop(0, '#fde6b3'); // lśniący, nagrzany słońcem piasek
  fgGrad.addColorStop(0.22, '#e8b26e'); // naturalne złoto pustynne
  fgGrad.addColorStop(0.65, '#c57f44'); // ciepły odcień zbocza
  fgGrad.addColorStop(1.0, '#8c4e23');  // miękki cień u podstawy gruntu

  ctx.fillStyle = fgGrad;
  ctx.beginPath();
  ctx.moveTo(startX, gy + 15);
  ctx.lineTo(startX, gy - getDuneH(startX, 0.0, 1.0));

  for (let i = 1; i <= numSteps; i++) {
    const x = startX + i * step;
    const prevX = startX + (i - 1) * step;
    const y = gy - getDuneH(x, 0.0, 1.0);
    const prevY = gy - getDuneH(prevX, 0.0, 1.0);
    const midX = (prevX + x) * 0.5;
    const midY = (prevY + y) * 0.5;
    ctx.quadraticCurveTo(prevX, prevY, midX, midY);
  }
  ctx.lineTo(endX, gy + 15);
  ctx.closePath();
  ctx.fill();

  // ----------------------------------------------------
  // ROZŚWIETLONA GRAŃ WYDMY (RIM LIGHT NA GRZBIECIE)
  // ----------------------------------------------------
  ctx.strokeStyle = 'rgba(255, 245, 210, 0.65)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(startX, gy - getDuneH(startX, 0.0, 1.0));

  for (let i = 1; i <= numSteps; i++) {
    const x = startX + i * step;
    const prevX = startX + (i - 1) * step;
    const y = gy - getDuneH(x, 0.0, 1.0);
    const prevY = gy - getDuneH(prevX, 0.0, 1.0);
    const midX = (prevX + x) * 0.5;
    const midY = (prevY + y) * 0.5;
    ctx.quadraticCurveTo(prevX, prevY, midX, midY);
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * Monumentalna fasada zewnętrzna Wielkiej Piramidy w skali 1:1
 * Redesign: 3D światłocień, schodkowe bloki megalityczne, arête, złoty pyramidion i organiczne nawiewki piasku
 */
export function drawPyramidExterior(ctx, worldLeft, worldRight) {
  if (worldRight !== undefined && worldRight <= DESERT_START_X) return;
  const enterX = PYRAMID_ENTER_X;
  const exitX = PYRAMID_EXIT_X;
  const centerX = PYRAMID_CENTER_X;
  const baseLeft = enterX - 950;
  const baseRight = exitX + 950;
  const gy = GROUND_Y;
  const apexY = gy - PYRAMID_HEIGHT;
  const ridgeX = centerX - 140;

  const desertDrawLeft = Math.max(worldLeft, DESERT_START_X);
  if (baseRight < desertDrawLeft - 250 || baseLeft > worldRight + 250) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(DESERT_START_X, -2000, Math.max(0, baseRight - DESERT_START_X + 500), 5000);
  ctx.clip();

  // 1. Oświetlona ściana wschodnia (jasny, nasłoneczniony piaskowiec)
  const litGrad = ctx.createLinearGradient(baseLeft, gy + 60, ridgeX, apexY);
  litGrad.addColorStop(0, '#c99355');
  litGrad.addColorStop(0.35, '#e8bc7c');
  litGrad.addColorStop(0.75, '#fae19c');
  litGrad.addColorStop(1.0, '#fff0cf');
  ctx.fillStyle = litGrad;
  ctx.beginPath();
  ctx.moveTo(baseLeft, gy + 60);
  ctx.lineTo(centerX, apexY);
  ctx.lineTo(ridgeX, gy + 60);
  ctx.closePath();
  ctx.fill();

  // 2. Zacieniona ściana zachodnia (głęboki cień i chłodniejszy odcień skały)
  const shadowGrad = ctx.createLinearGradient(ridgeX, apexY, baseRight, gy + 60);
  shadowGrad.addColorStop(0, '#9c663b');
  shadowGrad.addColorStop(0.5, '#704222');
  shadowGrad.addColorStop(1.0, '#452412');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.moveTo(ridgeX, gy + 60);
  ctx.lineTo(centerX, apexY);
  ctx.lineTo(baseRight, gy + 60);
  ctx.closePath();
  ctx.fill();

  // 3. Kaskadowe warstwy bloków megalitycznych (48 poziomów z trójwymiarowym światłocieniem)
  const totalCourses = 48;
  for (let c = 1; c < totalCourses; c++) {
    const t = c / totalCourses;
    const cy = apexY + (PYRAMID_HEIGHT + 60) * t;
    const lx = centerX + (baseLeft - centerX) * t;
    const rx = centerX + (baseRight - centerX) * t;
    const mx = centerX + (ridgeX - centerX) * t;

    // Górna oświetlona krawędź stopnia
    ctx.strokeStyle = 'rgba(255, 245, 215, 0.42)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(lx, cy);
    ctx.lineTo(mx, cy);
    ctx.stroke();

    // Dolny rzucany cień stopnia
    ctx.strokeStyle = 'rgba(74, 40, 20, 0.40)';
    ctx.beginPath();
    ctx.moveTo(lx, cy + 1.5);
    ctx.lineTo(mx, cy + 1.5);
    ctx.stroke();

    // Krawędź na ścianie w cieniu
    ctx.strokeStyle = 'rgba(28, 14, 7, 0.55)';
    ctx.beginPath();
    ctx.moveTo(mx, cy);
    ctx.lineTo(rx, cy);
    ctx.stroke();

    // Pionowe spoiny bloków kamiennych (mortar joints)
    const blockStep = 70 + (c % 3) * 20;
    const firstJoint = Math.floor(lx / blockStep) * blockStep;
    ctx.lineWidth = 1;
    for (let jx = firstJoint; jx <= rx; jx += blockStep) {
      if (jx > lx && jx < mx) {
        ctx.strokeStyle = 'rgba(74, 40, 20, 0.25)';
        ctx.beginPath();
        ctx.moveTo(jx, cy);
        ctx.lineTo(jx, cy + (PYRAMID_HEIGHT / totalCourses));
        ctx.stroke();
      } else if (jx > mx && jx < rx) {
        ctx.strokeStyle = 'rgba(28, 14, 7, 0.35)';
        ctx.beginPath();
        ctx.moveTo(jx, cy);
        ctx.lineTo(jx, cy + (PYRAMID_HEIGHT / totalCourses));
        ctx.stroke();
      }
    }
  }

  // Ostra, schodkowa grań arête
  ctx.strokeStyle = '#fff0cf';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, apexY);
  ctx.lineTo(ridgeX, gy + 60);
  ctx.stroke();

  // 4. Złote zwieńczenie na szczycie (Pyramidion)
  const capH = 70;
  const capT = capH / PYRAMID_HEIGHT;
  const capLeft = centerX + (baseLeft - centerX) * capT;
  const capRight = centerX + (baseRight - centerX) * capT;
  const capRidge = centerX + (ridgeX - centerX) * capT;
  const capY = apexY + capH;

  const goldCap = ctx.createLinearGradient(capLeft, capY, capRight, apexY);
  goldCap.addColorStop(0, '#ffd54f');
  goldCap.addColorStop(0.35, '#fff9c4');
  goldCap.addColorStop(0.75, '#f59e0b');
  goldCap.addColorStop(1.0, '#b45309');
  ctx.fillStyle = goldCap;
  ctx.beginPath();
  ctx.moveTo(capLeft, capY);
  ctx.lineTo(centerX, apexY);
  ctx.lineTo(capRight, capY);
  ctx.lineTo(capRidge, capY);
  ctx.closePath();
  ctx.fill();

  // Błysk i snopy światła pyramidionu (4-ramienny rozbłysk)
  const now = performance.now();
  const gleam = Math.sin(now * 0.003) * 0.45 + 0.55;
  const glint = ctx.createRadialGradient(centerX, apexY, 0, centerX, apexY, 80);
  glint.addColorStop(0, `rgba(255, 255, 240, ${0.92 * gleam})`);
  glint.addColorStop(0.35, `rgba(255, 215, 0, ${0.50 * gleam})`);
  glint.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = glint;
  ctx.beginPath();
  ctx.arc(centerX, apexY, 80, 0, Math.PI * 2);
  ctx.fill();

  // 5. Nawiewki piasku wokół bazy piramidy (organiczne zakopanie w wydmach)
  ctx.fillStyle = '#dca264';
  ctx.beginPath();
  ctx.moveTo(baseLeft - 80, gy);
  ctx.quadraticCurveTo(baseLeft + 250, gy - 45, baseLeft + 600, gy);
  ctx.quadraticCurveTo(ridgeX - 100, gy - 35, ridgeX + 150, gy);
  ctx.quadraticCurveTo(baseRight - 350, gy - 48, baseRight + 80, gy);
  ctx.lineTo(baseRight + 80, gy + 30);
  ctx.lineTo(baseLeft - 80, gy + 30);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * WNĘTRZE WIELKIEJ PIRAMIDY: MAJESTATYCZNA WIELKA GALERIA (GRAND HYPOSTYLE HALL - 300 METRÓW)
 * Zwiększona kubatura: sklepienie sięga niemal samej góry ekranu (wysokość 600 px)
 * Rytmiczne kolumny, pochodnie z radialnym światłem, snopy słońca (God Rays) i hieroglify
 */
export function drawPyramidInterior(ctx, worldLeft, worldRight) {
  if (worldRight !== undefined && worldRight <= DESERT_START_X) return;
  const enterX = PYRAMID_ENTER_X;
  const exitX = PYRAMID_EXIT_X;
  const gy = GROUND_Y;

  if (exitX < worldLeft - 100 || enterX > worldRight + 100) return;

  const startX = Math.max(enterX, worldLeft - 50);
  const endX = Math.min(exitX, worldRight + 50);
  if (startX >= endX) return;

  ctx.save();
  const now = performance.now();

  // 1. Potężne kamienne ściany grobowca sięgające wysoko w górę (Grand Hypostyle Hall)
  const wallTop = gy - 600; // Wysokość 600 px – majestatyczna kubatura
  const wallH = 600;

  const wallGrad = ctx.createLinearGradient(0, wallTop, 0, gy);
  wallGrad.addColorStop(0, '#1c0e07');
  wallGrad.addColorStop(0.3, '#2a160d');
  wallGrad.addColorStop(0.65, '#42281a');
  wallGrad.addColorStop(1.0, '#573623');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(startX, wallTop, endX - startX, wallH);

  // 2. Megalityczne bloki piaskowca (22 poziome warstwy)
  const blockH = 28;
  const firstRow = Math.floor(wallTop / blockH) * blockH;
  for (let by = firstRow; by < gy; by += blockH) {
    if (by < wallTop - 10) continue;
    const isRowAlt = (Math.floor(by / blockH) % 2 === 0);
    const blockW = isRowAlt ? 85 : 110;
    const firstCol = Math.floor(startX / blockW) * blockW;

    ctx.strokeStyle = '#180b05';
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

      // Relief krawędzi bloku
      ctx.strokeStyle = 'rgba(212, 163, 115, 0.10)';
      ctx.beginPath();
      ctx.moveTo(bx + 1, by + 1);
      ctx.lineTo(bx + blockW - 1, by + 1);
      ctx.stroke();
    }
  }

  // 3. Pasy hieroglifów na ścianach (dwie wysokości)
  const friezeY1 = gy - 380;
  const friezeY2 = gy - 230;

  ctx.fillStyle = 'rgba(255, 215, 0, 0.14)';
  ctx.fillRect(startX, friezeY1 - 14, endX - startX, 28);
  ctx.fillRect(startX, friezeY2 - 14, endX - startX, 28);

  ctx.strokeStyle = '#ffd54f';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(startX, friezeY1 - 14); ctx.lineTo(endX, friezeY1 - 14);
  ctx.moveTo(startX, friezeY1 + 14); ctx.lineTo(endX, friezeY1 + 14);
  ctx.moveTo(startX, friezeY2 - 14); ctx.lineTo(endX, friezeY2 - 14);
  ctx.moveTo(startX, friezeY2 + 14); ctx.lineTo(endX, friezeY2 + 14);
  ctx.stroke();

  // Symbole hieroglificzne
  const glyphStep = 42;
  const firstGlyph = Math.floor(startX / glyphStep) * glyphStep;
  for (let gx = firstGlyph; gx <= endX; gx += glyphStep) {
    if (gx < enterX + 25 || gx > exitX - 25) continue;
    const type1 = Math.abs(Math.floor(gx / 42)) % 6;
    const type2 = Math.abs(Math.floor(gx / 42 + 2)) % 6;
    drawHieroglyphSymbol(ctx, type1, gx, friezeY1, 15, '#ffd54f');
    drawHieroglyphSymbol(ctx, type2, gx, friezeY2, 15, '#e0a96d');
  }

  // 4. Płaskorzeźby ścienne i sceny bóstw
  const muralStep = 280;
  const firstMural = Math.floor(startX / muralStep) * muralStep;
  for (let mx = firstMural; mx <= endX; mx += muralStep) {
    if (mx < enterX + 100 || mx > exitX - 100) continue;
    if (mx >= worldLeft - 120 && mx <= worldRight + 120) {
      drawWallMuralScene(ctx, mx, gy);
    }
  }

  // 5. Wnęki ze złoconymi sarkofagami
  const nicheStep = 560;
  const firstNiche = Math.floor(startX / nicheStep) * nicheStep + 280;
  for (let nx = firstNiche; nx <= endX; nx += nicheStep) {
    if (nx < enterX + 140 || nx > exitX - 140) continue;
    if (nx >= worldLeft - 70 && nx <= worldRight + 70) {
      drawSarcophagusNiche(ctx, nx, gy);
    }
  }

  // 6. Potężne kolumny egipskie w warstwie za graczem (Grand Hypostyle Hall)
  // Rytmiczny las kolumn tworzący nieskończony korytarz perspektywiczny
  const colStep = 160;
  const firstCol = Math.floor(startX / colStep) * colStep;
  for (let cx = firstCol; cx <= endX; cx += colStep) {
    if (cx < enterX + 50 || cx > exitX - 50) continue;
    if (cx >= worldLeft - 70 && cx <= worldRight + 70) {
      drawPapyrusColumn(ctx, cx, gy, false, 580);
    }
  }

  // 7. Oświetlenie: żelazne kosze z ogniem i pochodnie na kolumnach
  const torchStep = 120;
  const firstTorch = Math.floor(startX / torchStep) * torchStep;
  for (let tx = firstTorch; tx <= endX; tx += torchStep) {
    if (tx < enterX + 40 || tx > exitX - 40) continue;
    if (tx >= worldLeft - 240 && tx <= worldRight + 240) {
      drawWallTorch(ctx, tx, gy, now);
    }
  }

  // 8. PROMIENIE SŁOŃCA (GOD RAYS) PRZECINAJĄCE MROK SKLEPIENIA
  // Z pęknięć w wysokim stropie opadają pojedyncze, półprzezroczyste snopy światła
  const rayStep = 380;
  const firstRay = Math.floor(startX / rayStep) * rayStep + 190;
  for (let rx = firstRay; rx <= endX; rx += rayStep) {
    if (rx < enterX + 120 || rx > exitX - 120) continue;
    if (rx >= worldLeft - 200 && rx <= worldRight + 200) {
      const rayFlicker = Math.sin(now * 0.002 + rx * 0.01) * 0.15 + 0.85;
      const beamGrad = ctx.createLinearGradient(rx, wallTop, rx - 90, gy);
      beamGrad.addColorStop(0, `rgba(255, 248, 220, ${0.22 * rayFlicker})`);
      beamGrad.addColorStop(0.35, `rgba(255, 235, 170, ${0.14 * rayFlicker})`);
      beamGrad.addColorStop(0.7, `rgba(255, 210, 110, ${0.06 * rayFlicker})`);
      beamGrad.addColorStop(1.0, 'rgba(255, 200, 90, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(rx - 14, wallTop);
      ctx.lineTo(rx + 14, wallTop);
      ctx.lineTo(rx + 65, gy);
      ctx.lineTo(rx - 85, gy);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Posadzka wnętrza piramidy ze starożytnych kamiennych płyt ze szczelinami i piaskiem w zakamarkach
 */
export function drawPyramidFloor(ctx, worldLeft, worldRight) {
  if (worldRight !== undefined && worldRight <= DESERT_START_X) return;
  const enterX = PYRAMID_ENTER_X;
  const exitX = PYRAMID_EXIT_X;
  if (exitX < worldLeft - 60 || enterX > worldRight + 60) return;

  const startX = Math.max(enterX, worldLeft - 40);
  const endX = Math.min(exitX, worldRight + 40);
  if (startX >= endX) return;

  const gy = GROUND_Y;
  ctx.save();

  const slabW = 65;
  const slabH = 18;
  const firstSlab = Math.floor(startX / slabW) * slabW;

  for (let x = firstSlab; x <= endX; x += slabW) {
    if (x < enterX || x > exitX) continue;
    const isAlt = (Math.floor(x / slabW) % 2 === 0);

    // Kamienne płyty piaskowca posadzki
    ctx.fillStyle = isAlt ? '#734c2b' : '#613e22';
    ctx.fillRect(x, gy, slabW - 2, slabH);

    // Oświetlona faza krawędzi płyty
    ctx.fillStyle = isAlt ? '#9c6c3e' : '#855930';
    ctx.fillRect(x, gy, slabW - 2, 2.5);

    // Szczeliny między płytami ze spoinami
    ctx.fillStyle = '#1c0f08';
    ctx.fillRect(x + slabW - 2, gy, 2, slabH);

    // Złoty piasek gromadzący się w szczelinach posadzki
    ctx.fillStyle = '#c99a60';
    ctx.fillRect(x + slabW - 3, gy + slabH - 4, 3, 4);

    // Delikatne pęknięcia starożytnych płyt
    if (isAlt) {
      ctx.strokeStyle = '#2b170e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 12, gy + 3);
      ctx.lineTo(x + 22, gy + 8);
      ctx.lineTo(x + 28, gy + slabH - 2);
      ctx.stroke();
    }
  }

  // Złoty i lazurytowy pas królewski biegnący wzdłuż drogi procesyjnej
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(startX, gy, endX - startX, 2);

  const firstTile = Math.floor(startX / 110) * 110;
  for (let tx = firstTile; tx <= endX; tx += 110) {
    if (tx < enterX + 20 || tx > exitX - 20) continue;
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(tx + 18, gy + 3, 22, 9);
    ctx.fillStyle = '#ffd54f';
    ctx.fillRect(tx + 21, gy + 5, 16, 5);
  }

  ctx.restore();
}

/**
 * Przednia warstwa piramidy: wysoki monumentalny strop z bloków kamiennych, przednie kolumny i portale
 */
export function drawPyramidForeground(ctx, worldLeft, worldRight) {
  if (worldRight !== undefined && worldRight <= DESERT_START_X) return;
  const enterX = PYRAMID_ENTER_X;
  const exitX = PYRAMID_EXIT_X;
  const gy = GROUND_Y;

  if (exitX < worldLeft - 100 || enterX > worldRight + 100) return;

  const startX = Math.max(enterX, worldLeft - 60);
  const endX = Math.min(exitX, worldRight + 60);
  if (startX >= endX) return;

  ctx.save();

  // 1. Wysoki strop z megalitycznych belek stropowych (architraw na wysokości gy - 600 do gy - 530)
  const ceilingY = gy - 530;
  const ceilingH = 70;

  const ceilGrad = ctx.createLinearGradient(0, ceilingY - ceilingH, 0, ceilingY);
  ceilGrad.addColorStop(0, '#140a05');
  ceilGrad.addColorStop(0.5, '#2e180d');
  ceilGrad.addColorStop(1, '#1f1008');
  ctx.fillStyle = ceilGrad;
  ctx.fillRect(startX, ceilingY - ceilingH, endX - startX, ceilingH);

  // Poprzeczne potężne belki stropowe
  const firstBeam = Math.floor(startX / 90) * 90;
  for (let bx = firstBeam; bx <= endX; bx += 90) {
    if (bx < enterX || bx > exitX) continue;
    ctx.fillStyle = '#140a05';
    ctx.fillRect(bx, ceilingY - ceilingH, 16, ceilingH);
    ctx.fillStyle = '#4a2815';
    ctx.fillRect(bx + 16, ceilingY - ceilingH, 3, ceilingH);
  }

  // Rzeźbiony gzyms architrawu z fryzem
  ctx.fillStyle = '#3d2011';
  ctx.fillRect(startX, ceilingY - 6, endX - startX, 8);
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(startX, ceilingY + 2, endX - startX, 2);

  // Półcień rzucany ze stropu w dół (zostawia pełną przestrzeń na bieg gracza i piłkę)
  const dropShadow = ctx.createLinearGradient(0, ceilingY + 4, 0, ceilingY + 55);
  dropShadow.addColorStop(0, 'rgba(12, 6, 3, 0.75)');
  dropShadow.addColorStop(1, 'rgba(12, 6, 3, 0.0)');
  ctx.fillStyle = dropShadow;
  ctx.fillRect(startX, ceilingY + 4, endX - startX, 51);

  // 2. Przednie kolumny monumentalnej sali (pierwszy plan przed graczem, szeroki rozstaw)
  const firstCol = Math.floor(startX / 480) * 480;
  for (let cx = firstCol; cx <= endX; cx += 480) {
    if (cx < enterX + 200 || cx > exitX - 200) continue;
    if (cx >= worldLeft - 70 && cx <= worldRight + 70) {
      drawPapyrusColumn(ctx, cx, gy, true, 580);
    }
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
  if (currentDist < 1550 || currentDist > 2450) {
    clearWinterBlizzard();
    return;
  }

  const bounds = getWinterViewBounds();

  if (blizzardClouds.length === 0) {
    initWinterBlizzardPool(bounds.left, bounds.right);
  }

  const now = performance.now();
  const baseWind = getBlizzardWindForce(now);
  const winterTransition = smoothstep(1550, 1650, currentDist) * (1.0 - smoothstep(2350, 2450, currentDist));
  const windForce = baseWind * Math.max(0.35, winterTransition);
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
  if (currentDist < 1550 || currentDist > 2450) {
    return;
  }

  const winterTransition = smoothstep(1550, 1650, currentDist) * (1.0 - smoothstep(2350, 2450, currentDist));
  if (winterTransition <= 0.005) return;

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
  const hazeAlpha = (0.07 + (windForce - 1.0) * 0.035) * winterTransition;
  ctx.fillStyle = `rgba(215, 238, 255, ${Math.min(0.18, Math.max(0.02, hazeAlpha))})`;
  ctx.fillRect(0, 0, W, H);

  // Mroźna winieta na obrzeżach ekranu (wrażenie zmrożonej soczewki/gogli)
  const frostGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.42, W * 0.5, H * 0.5, Math.max(W, H) * 0.74);
  frostGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  frostGrad.addColorStop(1, `rgba(186, 230, 253, ${(0.07 + (windForce - 1.0) * 0.04) * winterTransition})`);
  ctx.fillStyle = frostGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.restore();

  // 2. Potężne, aerodynamiczne kłęby i tumany zamieci śnieżnej w tle
  const activeCloudsCount = Math.round(blizzardClouds.length * Math.max(0.12, winterTransition));
  for (let i = 0; i < activeCloudsCount; i++) {
    const c = blizzardClouds[i];
    const halfW = c.r * c.scaleX;
    if (c.x + halfW < wl - 60 || c.x - halfW > wr + 60) continue;

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.tilt);

    // Dynamiczna pulsacja tumanu pod naporem wiatru
    const pulse = Math.sin(now * 0.0022 + c.phase) * 0.08;
    ctx.scale(c.scaleX + pulse, c.scaleY - pulse * 0.3);

    const effAlpha = c.alpha * winterTransition;
    const radGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, c.r);
    radGrad.addColorStop(0, `rgba(255, 255, 255, ${effAlpha})`);
    radGrad.addColorStop(0.45, `rgba(224, 242, 254, ${effAlpha * 0.65})`);
    radGrad.addColorStop(1, 'rgba(186, 230, 253, 0)');

    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(0, 0, c.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 3. Wielowarstwowa zawieja śnieżna: płatki, igły lodowe i przygruntowy śnieg w tle
  const activeFlakesCount = Math.max(4, Math.round(blizzardSnowflakes.length * winterTransition));
  for (let i = 0; i < activeFlakesCount; i++) {
    const p = blizzardSnowflakes[i];
    if (p.x < wl - 40 || p.x > wr + 40) continue;

    const effAlpha = p.alpha * winterTransition;

    if (p.type === 2) {
      // Dynamiczna linia pędu wiatru (lodowa igła)
      ctx.strokeStyle = `rgba(235, 248, 255, ${effAlpha})`;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.streakLen, p.y - p.streakLen * 0.14);
      ctx.stroke();
    } else if (p.type === 3) {
      // Przygruntowy puch śnieżny tuż nad zmarzliną
      ctx.fillStyle = `rgba(240, 249, 255, ${effAlpha})`;
      ctx.fillRect(p.x, p.y, p.size * 1.4, p.size * 0.7);
    } else {
      // Płatki śniegu
      ctx.fillStyle = `rgba(245, 250, 255, ${effAlpha})`;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }

  ctx.restore();
}

export function drawWinterBlizzardForeground(ctx, worldLeft, worldRight) {
  if (currentDist < 1550 || currentDist > 2450) {
    return;
  }

  const winterTransition = smoothstep(1550, 1650, currentDist) * (1.0 - smoothstep(2350, 2450, currentDist));
  if (winterTransition <= 0.005) return;

  const wl = worldLeft;
  const wr = worldRight;

  ctx.save();
  const activeFgCount = Math.round(blizzardForegroundFlakes.length * winterTransition);
  for (let i = 0; i < activeFgCount; i++) {
    const p = blizzardForegroundFlakes[i];
    if (p.x < wl - 30 || p.x > wr + 30) continue;

    ctx.save();
    ctx.translate(p.x, p.y);

    const effAlpha = p.alpha * winterTransition;
    const radGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
    radGrad.addColorStop(0, `rgba(255, 255, 255, ${effAlpha})`);
    radGrad.addColorStop(0.5, `rgba(224, 242, 254, ${effAlpha * 0.5})`);
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

  // 5. Oślepiająca poświata pustynnego słońca z gorącą koroną (biom pustynny, strictly >= 800m)
  // 5. Oślepiająca poświata pustynnego słońca z gorącą koroną (płynny fade 750–850m i 1550–1650m)
  if (currentDist >= 750 && currentDist <= 1650) {
    const sunAuraFade = smoothstep(750, 850, currentDist) * (1.0 - smoothstep(1550, 1650, currentDist));
    if (sunAuraFade > 0.01) {
      const desertSunAura = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 320);
      desertSunAura.addColorStop(0, `rgba(255, 255, 240, ${0.45 * sunAuraFade})`);
      desertSunAura.addColorStop(0.25, `rgba(255, 215, 110, ${0.25 * sunAuraFade})`);
      desertSunAura.addColorStop(0.55, `rgba(245, 140, 30, ${0.10 * sunAuraFade})`);
      desertSunAura.addColorStop(0.85, `rgba(217, 107, 39, ${0.03 * sunAuraFade})`);
      desertSunAura.addColorStop(1.0, 'rgba(217, 107, 39, 0)');
      ctx.fillStyle = desertSunAura;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 320, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawSky(ctx) {
  const biome = getInterpolatedBiome(currentDist);

  // Współczynnik przebywania wewnątrz stadionu (300m - 750m, płynne wygaszanie 740–810m)
  const camDist = (camera ? (camera.x - START_X) / 14 : 0);
  let stadiumFactor = 0;
  if (camDist >= 250 && camDist <= 810) {
    if (camDist < 300) {
      stadiumFactor = smoothstep(250, 300, camDist);
    } else if (camDist > 740) {
      stadiumFactor = 1.0 - smoothstep(740, 810, camDist);
    } else {
      stadiumFactor = 1.0;
    }
  }

  // Współczynnik przebywania wewnątrz Wielkiej Piramidy (1050m - 1350m)
  const pyramidFactor = getPyramidInsideFactor(currentDist);

  // Interpolacja barw nieba (LERP):
  // Stadion: nocny granat #040711 - #172b48
  // Pustynia / Biomy: łagodne przejście przez zmierzchowy fiolet/śliwkę ku płonącemu niebu
  const STADIUM_SKY_RGB = [
    { r: 4, g: 7, b: 17 },
    { r: 10, g: 19, b: 34 },
    { r: 16, g: 32, b: 56 },
    { r: 23, g: 43, b: 72 }
  ];
  const PYRAMID_SKY_RGB = [
    { r: 13, g: 7, b: 5 },
    { r: 26, g: 14, b: 8 },
    { r: 38, g: 20, b: 11 },
    { r: 56, g: 30, b: 16 }
  ];

  let s0 = biome.skyRgb[0];
  let s1 = biome.skyRgb[1];
  let s2 = biome.skyRgb[2];
  let s3 = biome.skyRgb[3];

  const sFactor = Math.max(0, Math.min(1, stadiumFactor));
  const pFactor = Math.max(0, Math.min(1, pyramidFactor));

  if (sFactor > 0.001) {
    s0 = lerpRgbObj(s0, STADIUM_SKY_RGB[0], sFactor);
    s1 = lerpRgbObj(s1, STADIUM_SKY_RGB[1], sFactor);
    s2 = lerpRgbObj(s2, STADIUM_SKY_RGB[2], sFactor);
    s3 = lerpRgbObj(s3, STADIUM_SKY_RGB[3], sFactor);
  } else if (pFactor > 0.001) {
    s0 = lerpRgbObj(s0, PYRAMID_SKY_RGB[0], pFactor);
    s1 = lerpRgbObj(s1, PYRAMID_SKY_RGB[1], pFactor);
    s2 = lerpRgbObj(s2, PYRAMID_SKY_RGB[2], pFactor);
    s3 = lerpRgbObj(s3, PYRAMID_SKY_RGB[3], pFactor);
  }

  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, rgbToCss(s0));
  skyGrad.addColorStop(0.35, rgbToCss(s1));
  skyGrad.addColorStop(0.70, rgbToCss(s2));
  skyGrad.addColorStop(1.0, rgbToCss(s3));
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // Łuna świetlna reflektorów i monumentalne zadaszenie zamkniętej areny stadionu
  if (stadiumFactor > 0.001) {
    // 1. Zamknięta czasza dachu stadionu - zlikwidowane puste niebo
    const roofVault = ctx.createLinearGradient(0, 0, 0, H * 0.7);
    roofVault.addColorStop(0, '#040711');
    roofVault.addColorStop(0.35, '#081020');
    roofVault.addColorStop(0.70, '#0f1b32');
    roofVault.addColorStop(1.0, 'rgba(15, 27, 50, 0)');
    ctx.fillStyle = roofVault;
    ctx.fillRect(0, 0, W, H * 0.7);

    // Stalowe żebra konstrukcyjne sklepienia dachu w tle
    ctx.save();
    ctx.strokeStyle = `rgba(51, 65, 85, ${0.45 * stadiumFactor})`;
    ctx.lineWidth = 2.5;
    for (let rx = -W * 0.15; rx < W * 1.25; rx += 140) {
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.bezierCurveTo(rx + 60, H * 0.22, rx + 100, H * 0.45, rx + 140, H * 0.7);
      ctx.stroke();
    }
    ctx.restore();

    // Łuna świetlna potężnych reflektorów w koronie stadionu rozświetlająca zamkniętą arenę
    const arenaGlow = ctx.createLinearGradient(0, 0, 0, H * 0.65);
    arenaGlow.addColorStop(0, `rgba(56, 189, 248, ${0.20 * stadiumFactor})`);
    arenaGlow.addColorStop(0.35, `rgba(255, 255, 255, ${0.12 * stadiumFactor})`);
    arenaGlow.addColorStop(0.70, `rgba(56, 189, 248, ${0.05 * stadiumFactor})`);
    arenaGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = arenaGlow;
    ctx.fillRect(0, 0, W, H * 0.65);
  }

  // Ciepła poświata pochodni rozświetlająca mroczne sklepienie wnętrza piramidy
  if (pyramidFactor > 0.001) {
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

  // Wielowarstwowy horyzont biomu pustynnego (płynne przejście 740m – 1660m):
  // 1. Dalekie wydmy (wolny parallax)
  // 2. Sylwetka Wielkiej Piramidy na horyzoncie (baza poniżej średnich wydm)
  // 3. Średnie wydmy (kontrastowe grzbiety ze złotym światłocieniem, zakopujące piramidę)
  if (currentDist >= 740 && currentDist <= 1660) {
    drawFarDunes(ctx, currentDist);
    drawDistantPyramidParallax(ctx, currentDist);
    drawMidDunes(ctx, currentDist);
  }

  // Samoloty na niebie w biomie murawy (0m – 799m) - ukryte wewnątrz zamkniętej areny stadionu
  if (skyVisibility > 0.05) {
    drawAirplanes(ctx);
  }

  // Bliższe chmury (warstwa 1)
  if (skyVisibility > 0.01) {
    ctx.save();
    ctx.globalAlpha *= skyVisibility;

    drawCloudsLayer(ctx, 1, biome);

    ctx.restore();
  }
}

// ==========================================
// TŁO I STRUKTURA: MONUMENTALNA ARENA STADIONOWA 2.5D (300M - 750M)
// KINEMATYCZNY TUNEL, ZAKRZYWIONA MISA, 3 WARSTWY PARALAKSY,
// WOLUMETRYCZNE JUPITERY ORAZ PRE-RENDEROWANE TŁO (OFFSCREEN CANVAS)
// ==========================================

// Maszty jupiterów rozlokowane w strategicznych punktach zadaszenia areny
const STADIUM_FLOODLIGHT_MASTS = [
  START_X + 340 * 14, // 4920 px - narożnik wejściowy stadionu
  START_X + 475 * 14, // 6810 px - lewa strona środka boiska
  START_X + 575 * 14, // 8210 px - prawa strona środka boiska
  START_X + 710 * 14  // 10100 px - narożnik wyjściowy stadionu
];

// 4. WOLUMETRYCZNE OŚWIETLENIE JUPITERÓW (MIESZANIE ADDYTYWNE)
function drawFloodlightTower(ctx, mx, gy, now) {
  const mastTopY = gy - 620;
  const mastBaseY = gy - 490;

  // 1. Stalowe belki i kratownica nośna masztu podwieszonego pod konstrukcją dachu
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(mx - 32, mastTopY);
  ctx.lineTo(mx - 18, mastBaseY);
  ctx.moveTo(mx + 32, mastTopY);
  ctx.lineTo(mx + 18, mastBaseY);
  ctx.stroke();

  // Krzyżulce kratownicy wsporczej (stężenia stalowe)
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mx - 30, mastTopY + 22);
  ctx.lineTo(mx + 20, mastBaseY - 12);
  ctx.moveTo(mx + 30, mastTopY + 22);
  ctx.lineTo(mx - 20, mastBaseY - 12);
  ctx.moveTo(mx - 24, (mastTopY + mastBaseY) / 2);
  ctx.lineTo(mx + 24, (mastTopY + mastBaseY) / 2);
  ctx.stroke();

  // 2. Masywna głowica baterii reflektorów (bateria jupiterów)
  const headW = 104;
  const headH = 40;
  const headX = mx - headW / 2;
  const headY = mastBaseY;

  // Korpus baterii z radiatorem chłodzącym
  ctx.fillStyle = '#0b1120';
  ctx.fillRect(headX, headY, headW, headH);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.strokeRect(headX, headY, headW, headH);

  // Żebra chłodzące radiatora na górze korpusu
  ctx.fillStyle = '#1e293b';
  for (let fx = headX + 4; fx < headX + headW - 4; fx += 6) {
    ctx.fillRect(fx, headY - 4, 3, 4);
  }

  // Dioda ostrzegawcza masztu (stroboskop lotniczy)
  const beaconBlink = Math.sin(now * 0.006 + mx * 0.01) > 0;
  ctx.fillStyle = beaconBlink ? '#ef4444' : '#7f1d1d';
  ctx.beginPath();
  ctx.arc(mx, headY - 7, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 3. WOLUMETRYCZNE STOŻKI ŚWIATŁA (MIESZANIE ADDYTYWNE LIGHTER)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Cztery szerokie stożki światła o barwie rgba(220, 240, 255, 0.12) przecinające kadr z góry na murawę
  const drawBeam = (fromX1, fromX2, toX1, toX2, intensityMult = 1.0) => {
    const beamGrad = ctx.createLinearGradient(mx, headY + headH, (toX1 + toX2) / 2, gy);
    beamGrad.addColorStop(0, `rgba(220, 240, 255, ${0.18 * intensityMult})`);
    beamGrad.addColorStop(0.35, `rgba(220, 240, 255, ${0.12 * intensityMult})`);
    beamGrad.addColorStop(0.70, `rgba(220, 240, 255, ${0.05 * intensityMult})`);
    beamGrad.addColorStop(1, 'rgba(220, 240, 255, 0.0)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(fromX1, headY + headH);
    ctx.lineTo(fromX2, headY + headH);
    ctx.lineTo(toX2, gy);
    ctx.lineTo(toX1, gy);
    ctx.closePath();
    ctx.fill();
  };

  // Stożek 1: Skierowany szeroko w lewo
  drawBeam(mx - 35, mx + 5, mx - 440, mx - 80, 1.05);

  // Stożek 2: Środkowo-lewy szeroki snop
  drawBeam(mx - 25, mx + 15, mx - 220, mx + 140, 1.0);

  // Stożek 3: Środkowo-prawy szeroki snop
  drawBeam(mx - 15, mx + 25, mx - 140, mx + 220, 1.0);

  // Stożek 4: Skierowany szeroko w prawo
  drawBeam(mx - 5, mx + 35, mx + 80, mx + 440, 1.05);

  // Podświetlona plama światła na murawie (rozświetlona darniowa elipsa)
  const turfPool = ctx.createRadialGradient(mx, gy, 15, mx, gy, 230);
  turfPool.addColorStop(0, 'rgba(220, 240, 255, 0.16)');
  turfPool.addColorStop(0.45, 'rgba(220, 240, 255, 0.08)');
  turfPool.addColorStop(1, 'rgba(220, 240, 255, 0)');
  ctx.fillStyle = turfPool;
  ctx.beginPath();
  ctx.ellipse(mx, gy + 3, 230, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // 4. Bateria projektorów LED (soczewki dużej mocy)
  const cols = 8;
  const rows = 3;
  const stepX = (headW - 14) / (cols - 1);
  const stepY = (headH - 12) / (rows - 1);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lx = headX + 7 + c * stepX;
      const ly = headY + 6 + r * stepY;

      // Zewnętrzny odblask klosza
      ctx.fillStyle = 'rgba(220, 240, 255, 0.65)';
      ctx.beginPath();
      ctx.arc(lx, ly, 4.8, 0, Math.PI * 2);
      ctx.fill();

      // Czyste, oślepiające białe światło jupitera (#ffffff)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(lx, ly, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Koronowa poświata wokół baterii
  const batteryGlow = ctx.createRadialGradient(mx, headY + headH / 2, 8, mx, headY + headH / 2, 65);
  batteryGlow.addColorStop(0, 'rgba(255, 255, 255, 0.50)');
  batteryGlow.addColorStop(0.45, 'rgba(186, 230, 253, 0.20)');
  batteryGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = batteryGlow;
  ctx.beginPath();
  ctx.arc(mx, headY + headH / 2, 65, 0, Math.PI * 2);
  ctx.fill();
}

// 1. KINEMATYCZNE WEJŚCIE NA PŁYTĘ (TUNEL GRACZY) - TŁO
function drawPlayerTunnelBg(ctx, tunnelStartX, enterX, gy) {
  // Czerwona wykładzina techniczna na ziemi
  const carpetStartX = tunnelStartX - 30;
  const carpetEndX = enterX + 45;
  const carpetW = carpetEndX - carpetStartX;

  const carpetGrad = ctx.createLinearGradient(0, gy - 2, 0, gy + 8);
  carpetGrad.addColorStop(0, '#991b1b');
  carpetGrad.addColorStop(0.4, '#b91c1c');
  carpetGrad.addColorStop(1, '#7f1d1d');
  ctx.fillStyle = carpetGrad;
  ctx.fillRect(carpetStartX, gy - 2, carpetW, 8);

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(carpetStartX, gy - 2, carpetW, 1.5);
  ctx.fillRect(carpetStartX, gy + 5, carpetW, 1.5);

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let cx = carpetStartX; cx <= carpetEndX; cx += 5) {
    ctx.moveTo(cx, gy - 2);
    ctx.lineTo(cx, gy + 6);
  }
  ctx.stroke();
}

// Tło tunelu wyjściowego na 750 m (widok za graczem)
function drawExitTunnelBg(ctx, exitX, gy) {
  const tw = 220;
  const th = 260;
  const tx = exitX - tw / 2;
  const ty = gy - th;

  // Mroczny portal z widokiem na otwarty horyzont pustyni
  ctx.fillStyle = '#060a14';
  ctx.fillRect(tx, ty, tw, th);

  // Złocisty blask słońca w głębi tunelu wyjściowego
  const desertGlow = ctx.createRadialGradient(exitX + 25, gy - 75, 10, exitX + 25, gy - 75, 120);
  desertGlow.addColorStop(0, 'rgba(251, 191, 36, 0.75)');
  desertGlow.addColorStop(0.4, 'rgba(245, 158, 11, 0.35)');
  desertGlow.addColorStop(0.8, 'rgba(217, 119, 6, 0.12)');
  desertGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = desertGlow;
  ctx.fillRect(tx, ty, tw, th);

  // Sylwetka wydmy widoczna przez otwór tunelu
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.moveTo(exitX - 45, gy);
  ctx.bezierCurveTo(exitX, gy - 40, exitX + 30, gy - 60, exitX + 60, gy);
  ctx.closePath();
  ctx.fill();

  // Zielony neon ewakuacyjny
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(exitX - 45, ty + 50, 90, 5);
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('➔ EXIT TO DESERT ➔', exitX, ty + 42);
  ctx.textAlign = 'left';
}

// 3. PŁYTA BOISKA Z ILUZJĄ GŁĘBI (PERSPEKTYWA DARNI) - ZOPTYMALIZOWANE RYSOWANIE
function drawPitchMarkings(ctx, enterX, exitX, gy, viewLeft, viewRight) {
  if (viewRight < enterX - 100 || viewLeft > exitX + 100) return;

  const startX = Math.max(enterX, viewLeft - 120);
  const endX = Math.min(exitX, viewRight + 120);
  if (startX > endX) return;

  const now = performance.now();
  const midPitchX = START_X + 525 * 14; // 7510 px (środek boiska)

  // A. Pasy koszenia trawy o zróżnicowanej szerokości i odcieniach zieleni (#1b5e20 oraz #2e7d32)
  // Zoptymalizowana pętla: przewijamy do pierwszego widocznego pasa i rysujemy wyłącznie pasy w kadrze
  const stripeWidths = [74, 86, 68, 92, 78, 82];
  let curX = enterX;
  let sIdx = 0;

  // Szybkie przewinięcie do pierwszego widocznego pasa
  while (curX + 100 < startX && curX < exitX) {
    const sw = stripeWidths[sIdx % stripeWidths.length];
    curX += sw;
    sIdx++;
  }

  // Rysowanie wyłącznie pasów widocznych w kadrze
  while (curX < endX && curX < exitX) {
    const sw = stripeWidths[sIdx % stripeWidths.length];
    const nextX = Math.min(exitX, curX + sw);
    const stripeW = nextX - curX;

    if (stripeW > 0) {
      const isLight = (sIdx % 2 === 0);
      const colBase = isLight ? '#2e7d32' : '#1b5e20';
      const colHighlight = isLight ? '#388e3c' : '#236928';

      // Kąt zbiegu perspektywicznego ku horyzontowi / band LED
      const slant1 = (curX - midPitchX) * 0.045;
      const slant2 = (nextX - midPitchX) * 0.045;

      const topX1 = curX;
      const topX2 = nextX;
      const botX1 = curX + slant1;
      const botX2 = nextX + slant2;

      ctx.fillStyle = colBase;
      ctx.beginPath();
      ctx.moveTo(topX1, gy - 2);
      ctx.lineTo(topX2, gy - 2);
      ctx.lineTo(botX2, gy + 450);
      ctx.lineTo(botX1, gy + 450);
      ctx.closePath();
      ctx.fill();

      // Subtelny pasek rozjaśnienia krawędzi walca kosiarki dający iluzję 3D darni
      ctx.fillStyle = colHighlight;
      ctx.beginPath();
      ctx.moveTo(topX1, gy - 2);
      ctx.lineTo(topX2, gy - 2);
      ctx.lineTo(topX2 + slant2 * 0.04, gy + 8);
      ctx.lineTo(topX1 + slant1 * 0.04, gy + 8);
      ctx.closePath();
      ctx.fill();
    }

    curX = nextX;
    sIdx++;
  }

  // B. Wyraźna, gruba biała linia boczna z delikatnym cieniem
  const touchLeft = Math.max(enterX, viewLeft);
  const touchRight = Math.min(exitX, viewRight);
  if (touchRight > touchLeft) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
    ctx.fillRect(touchLeft, gy + 6, touchRight - touchLeft, 4);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(touchLeft, gy + 2, touchRight - touchLeft, 5);
  }

  // C. Łuk narożnika boiska (Corner arc) przy wejściu (315 m = 4570 px)
  const cornerX1 = START_X + 315 * 14;
  if (cornerX1 >= viewLeft - 60 && cornerX1 <= viewRight + 60) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(cornerX1, gy + 2, 34, 0, Math.PI * 0.5, false);
    ctx.stroke();

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cornerX1, gy + 2);
    ctx.lineTo(cornerX1, gy - 8);
    ctx.stroke();

    const sway = Math.sin(now * 0.005) * 1.5;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cornerX1, gy - 8);
    ctx.quadraticCurveTo(cornerX1 + sway * 0.5, gy - 24, cornerX1 + sway, gy - 38);
    ctx.stroke();

    const topFlagX = cornerX1 + sway;
    const topFlagY = gy - 38;
    const flagWave = Math.sin(now * 0.008) * 2;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(topFlagX, topFlagY);
    ctx.lineTo(topFlagX + 18 + flagWave, topFlagY + 4);
    ctx.lineTo(topFlagX, topFlagY + 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(topFlagX, topFlagY + 8);
    ctx.lineTo(topFlagX + 18 + flagWave, topFlagY + 4);
    ctx.lineTo(topFlagX, topFlagY + 16);
    ctx.closePath();
    ctx.fill();
  }

  // D. Łuk narożnika boiska (Corner arc) przy wyjściu (735 m = 10450 px)
  const cornerX2 = START_X + 735 * 14;
  if (cornerX2 >= viewLeft - 60 && cornerX2 <= viewRight + 60) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(cornerX2, gy + 2, 34, Math.PI * 0.5, Math.PI, false);
    ctx.stroke();

    const sway = Math.sin(now * 0.005 + 1.5) * 1.5;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cornerX2, gy - 8);
    ctx.quadraticCurveTo(cornerX2 - sway * 0.5, gy - 24, cornerX2 - sway, gy - 38);
    ctx.stroke();

    const topFlagX = cornerX2 - sway;
    const topFlagY = gy - 38;
    const flagWave = Math.sin(now * 0.008 + 1.5) * 2;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(topFlagX, topFlagY);
    ctx.lineTo(topFlagX - 18 - flagWave, topFlagY + 4);
    ctx.lineTo(topFlagX, topFlagY + 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(topFlagX, topFlagY + 8);
    ctx.lineTo(topFlagX - 18 - flagWave, topFlagY + 4);
    ctx.lineTo(topFlagX, topFlagY + 16);
    ctx.closePath();
    ctx.fill();
  }

  // E. Linia środkowa i koło środkowe w perspektywie (525 m = 7510 px)
  if (midPitchX >= viewLeft - 160 && midPitchX <= viewRight + 160) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 4.5;

    ctx.fillRect(midPitchX - 2, gy + 2, 4.5, 200);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.arc(midPitchX, gy + 6, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(midPitchX, gy + 4, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(midPitchX, gy + 2, 115, 44, 0, 0, Math.PI);
    ctx.stroke();
  }

  // F. Pole karne i łuk pola karnego (355 m oraz 695 m)
  const penX1 = START_X + 355 * 14;
  if (penX1 >= viewLeft - 220 && penX1 <= viewRight + 220) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.90)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
    ctx.lineWidth = 4.5;

    ctx.fillRect(penX1 + 160, gy + 2, 4.5, 110);
    ctx.beginPath();
    ctx.arc(penX1, gy + 45, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(penX1, gy + 45, 65, 24, 0, 0, Math.PI * 0.65);
    ctx.stroke();
  }

  const penX2 = START_X + 695 * 14;
  if (penX2 >= viewLeft - 220 && penX2 <= viewRight + 220) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.90)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
    ctx.lineWidth = 4.5;

    ctx.fillRect(penX2 - 160, gy + 2, 4.5, 110);
    ctx.beginPath();
    ctx.arc(penX2, gy + 45, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(penX2, gy + 45, 65, 24, 0, Math.PI * 0.35, Math.PI);
    ctx.stroke();
  }
}

// ==========================================
// OFFSCREEN CANVAS PRE-RENDERING TŁA STADIONU (WYMÓG OPTYMALIZACYJNY)
// ==========================================
const stadiumPatternCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
let stadiumPatternReady = false;

const ROOF_CANVAS_W = 240;
const ROOF_CANVAS_H = 200;
const STAND_CANVAS_W = 220;
const UPPER_CANVAS_H = 280;
const LOWER_CANVAS_H = 180;

function initStadiumPatternCanvas() {
  if (stadiumPatternReady || !stadiumPatternCanvas) return;

  // Szerokość 240 px, wysokość 660 px = 200 (dach) + 280 (górna trybuna) + 180 (dolna trybuna)
  stadiumPatternCanvas.width = 240;
  stadiumPatternCanvas.height = 660;

  const pCtx = stadiumPatternCanvas.getContext('2d');
  if (!pCtx) return;

  // -----------------------------------------------------------------
  // 1. MODUŁ ZADASZENIA I KRATOWNIC STALOWYCH (Y: 0 do 200, W: 240)
  // W przestrzeni świata odpowiada to Y od (gy - 660) do (gy - 460)
  // -----------------------------------------------------------------
  const rY0 = 0;
  const rw = ROOF_CANVAS_W;

  // A. Główny łuk zadaszenia stadionu (aerodynamiczna czasza)
  const roofGrad = pCtx.createLinearGradient(0, rY0, 0, rY0 + 200);
  roofGrad.addColorStop(0, '#040711');
  roofGrad.addColorStop(0.40, '#0e1626');
  roofGrad.addColorStop(0.85, '#1e293b');
  roofGrad.addColorStop(1, '#334155');

  pCtx.fillStyle = roofGrad;
  pCtx.beginPath();
  pCtx.moveTo(-6, rY0 + 20);
  pCtx.quadraticCurveTo(rw * 0.5, rY0 - 10, rw + 6, rY0 + 20);
  pCtx.lineTo(rw + 6, rY0 + 180);
  pCtx.quadraticCurveTo(rw * 0.5, rY0 + 150, -6, rY0 + 180);
  pCtx.closePath();
  pCtx.fill();

  // B. Błękitna listwa LED wzdłuż krawędzi zadaszenia
  pCtx.strokeStyle = '#38bdf8';
  pCtx.lineWidth = 2.5;
  pCtx.beginPath();
  pCtx.moveTo(-6, rY0 + 180);
  pCtx.quadraticCurveTo(rw * 0.5, rY0 + 150, rw + 6, rY0 + 180);
  pCtx.stroke();

  // C. Stalowe kratownice przestrzenne (Warren space-truss)
  pCtx.strokeStyle = '#475569';
  pCtx.lineWidth = 2;
  pCtx.beginPath();
  pCtx.moveTo(0, rY0 + 50);
  pCtx.lineTo(rw, rY0 + 50);
  pCtx.moveTo(0, rY0 + 90);
  pCtx.lineTo(rw, rY0 + 90);

  for (let kx = 0; kx < rw; kx += 40) {
    pCtx.moveTo(kx, rY0 + 50);
    pCtx.lineTo(kx + 20, rY0 + 90);
    pCtx.lineTo(kx + 40, rY0 + 50);
  }
  pCtx.stroke();

  // D. Pomost techniczny (catwalk) dla obsługi oświetlenia
  pCtx.fillStyle = '#1e293b';
  pCtx.fillRect(0, rY0 + 90, rw, 4);
  pCtx.strokeStyle = '#64748b';
  pCtx.lineWidth = 1.2;
  pCtx.beginPath();
  pCtx.moveTo(0, rY0 + 82);
  pCtx.lineTo(rw, rY0 + 82);
  for (let cx = 15; cx < rw; cx += 25) {
    pCtx.moveTo(cx, rY0 + 90);
    pCtx.lineTo(cx, rY0 + 82);
  }
  pCtx.stroke();

  // E. Cięgna nośne i stalowe odciągi
  pCtx.strokeStyle = '#94a3b8';
  pCtx.lineWidth = 2;
  pCtx.beginPath();
  pCtx.moveTo(15, rY0 + 20);
  pCtx.lineTo(rw * 0.65, rY0 + 150);
  pCtx.moveTo(15, rY0 + 20);
  pCtx.lineTo(rw * 0.95, rY0 + 180);
  pCtx.stroke();

  // Pylon dachowy
  pCtx.fillStyle = '#334155';
  pCtx.fillRect(10, rY0 - 5, 8, 30);

  // -----------------------------------------------------------------
  // 2. MODUŁ GÓRNEJ TRYBUNY WIDOWNI (Y: 200 do 480, W: 220)
  // W przestrzeni świata odpowiada to Y od (gy - 470) do (gy - 190)
  // -----------------------------------------------------------------
  const uY0 = 200;
  const bw = STAND_CANVAS_W;

  // Tylna ściana sektora
  pCtx.fillStyle = '#070b14';
  pCtx.fillRect(0, uY0, bw, 280);

  // Filary dzielące sektory areny
  pCtx.fillStyle = '#1e293b';
  pCtx.fillRect(0, uY0, 10, 280);
  pCtx.fillRect(bw - 10, uY0, 10, 280);

  // Loże VIP pod zadaszeniem
  pCtx.fillStyle = 'rgba(56, 189, 248, 0.20)';
  pCtx.fillRect(12, uY0 + 5, bw - 24, 14);
  pCtx.strokeStyle = 'rgba(56, 189, 248, 0.40)';
  pCtx.lineWidth = 1;
  pCtx.strokeRect(12, uY0 + 5, bw - 24, 14);

  // 14 zakrzywionych rzędów widowni górnej
  const upperTierRows = [
    { h: 17, col: '#080d1a' },
    { h: 17, col: '#0f172a' },
    { h: 17, col: '#172554' },
    { h: 17, col: '#1e293b' },
    { h: 17, col: '#0b1329' },
    { h: 17, col: '#172554' },
    { h: 17, col: '#1e293b' },
    { h: 17, col: '#0f172a' },
    { h: 17, col: '#172554' },
    { h: 17, col: '#1e293b' },
    { h: 17, col: '#0b1329' },
    { h: 17, col: '#172554' },
    { h: 17, col: '#1e293b' },
    { h: 17, col: '#0f172a' }
  ];

  let curRowY = uY0 + 25;
  const curveSag = 6.5;

  for (let r = 0; r < upperTierRows.length; r++) {
    const row = upperTierRows[r];

    // Rząd trybuny jako zakrzywiony pasek
    pCtx.fillStyle = row.col;
    pCtx.beginPath();
    pCtx.moveTo(10, curRowY);
    pCtx.quadraticCurveTo(bw * 0.5, curRowY + curveSag, bw - 10, curRowY);
    pCtx.lineTo(bw - 10, curRowY + row.h);
    pCtx.quadraticCurveTo(bw * 0.5, curRowY + row.h + curveSag, 10, curRowY + row.h);
    pCtx.closePath();
    pCtx.fill();

    // Cień stopnia wzdłuż zakrzywionej krawędzi
    pCtx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    pCtx.lineWidth = 1.8;
    pCtx.beginPath();
    pCtx.moveTo(10, curRowY + row.h);
    pCtx.quadraticCurveTo(bw * 0.5, curRowY + row.h + curveSag, bw - 10, curRowY + row.h);
    pCtx.stroke();

    // Krzesełka i kibice
    const seatSpacing = 6.0;
    const seatCount = Math.floor((bw - 28) / seatSpacing);

    for (let s = 0; s < seatCount; s++) {
      const t = s / (seatCount - 1);
      const sx = 14 + s * seatSpacing;
      const sy = curRowY + 4 * curveSag * t * (1 - t);

      const seatSeed = (r * 29 + s * 13 + 7);
      const seatCols = ['#0f172a', '#172554', '#1e293b', '#312e81', '#1e1b4b'];
      pCtx.fillStyle = seatCols[seatSeed % seatCols.length];
      pCtx.fillRect(sx, sy + 3, 4, 5);

      if (seatSeed % 3 !== 0) {
        const skinCols = ['#fde68a', '#fcd34d', '#fed7aa'];
        pCtx.fillStyle = skinCols[seatSeed % skinCols.length];
        pCtx.fillRect(sx + 0.8, sy + 1, 2.4, 2.4);

        const fanCols = ['#ef4444', '#3b82f6', '#ffffff', '#facc15', '#1e293b'];
        pCtx.fillStyle = fanCols[(seatSeed + 1) % fanCols.length];
        pCtx.fillRect(sx, sy + 3.5, 4, 4);
      }
    }

    curRowY += row.h;
  }

  // Środkowa promenada betonowa ze stalową balustradą
  pCtx.fillStyle = '#64748b';
  pCtx.fillRect(0, uY0 + 270, bw, 10);
  pCtx.fillStyle = '#94a3b8';
  pCtx.fillRect(0, uY0 + 270, bw, 2.5);

  pCtx.strokeStyle = '#334155';
  pCtx.lineWidth = 1.8;
  pCtx.beginPath();
  pCtx.moveTo(0, uY0 + 264);
  pCtx.lineTo(bw, uY0 + 264);
  for (let px = 20; px < bw; px += 35) {
    pCtx.moveTo(px, uY0 + 270);
    pCtx.lineTo(px, uY0 + 264);
  }
  pCtx.stroke();

  // -----------------------------------------------------------------
  // 3. MODUŁ DOLNEJ TRYBUNY WIDOWNI (Y: 480 do 660, W: 220)
  // W przestrzeni świata odpowiada to Y od (gy - 180) do (gy - 2)
  // -----------------------------------------------------------------
  const lY0 = 480;

  const lowerTierRows = [
    { h: 17, col: '#0f172a' },
    { h: 17, col: '#172554' },
    { h: 17, col: '#1e293b' },
    { h: 17, col: '#0b1329' },
    { h: 17, col: '#172554' },
    { h: 17, col: '#1e293b' },
    { h: 17, col: '#0f172a' },
    { h: 17, col: '#172554' }
  ];

  let curLowerY = lY0;
  const lowerCurveSag = 5.0;

  for (let r = 0; r < lowerTierRows.length; r++) {
    const row = lowerTierRows[r];

    pCtx.fillStyle = row.col;
    pCtx.beginPath();
    pCtx.moveTo(8, curLowerY);
    pCtx.quadraticCurveTo(bw * 0.5, curLowerY + lowerCurveSag, bw - 8, curLowerY);
    pCtx.lineTo(bw - 8, curLowerY + row.h);
    pCtx.quadraticCurveTo(bw * 0.5, curLowerY + row.h + lowerCurveSag, 8, curLowerY + row.h);
    pCtx.closePath();
    pCtx.fill();

    pCtx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    pCtx.lineWidth = 1.5;
    pCtx.beginPath();
    pCtx.moveTo(8, curLowerY + row.h);
    pCtx.quadraticCurveTo(bw * 0.5, curLowerY + row.h + lowerCurveSag, bw - 8, curLowerY + row.h);
    pCtx.stroke();

    const seatSpacing = 6.2;
    const seatCount = Math.floor((bw - 24) / seatSpacing);

    for (let s = 0; s < seatCount; s++) {
      const t = s / (seatCount - 1);
      const sx = 12 + s * seatSpacing;
      const sy = curLowerLowerSag(curLowerY, lowerCurveSag, t);
      const seed = (r * 19 + s * 11 + 13);

      const skinCols = ['#fde68a', '#fcd34d', '#fed7aa'];
      pCtx.fillStyle = skinCols[seed % skinCols.length];
      pCtx.fillRect(sx + 1, sy + 1, 2.5, 2.5);

      const fanCols = ['#ef4444', '#3b82f6', '#ffffff', '#facc15', '#1e293b'];
      pCtx.fillStyle = fanCols[seed % fanCols.length];
      pCtx.fillRect(sx, sy + 4, 4.5, 4.5);
    }

    curLowerY += row.h;
  }

  // Schody ewakuacyjne dolnej trybuny
  pCtx.fillStyle = '#64748b';
  pCtx.fillRect(2, lY0, 12, 158);
  for (let sy = lY0 + 2; sy < lY0 + 158; sy += 12) {
    pCtx.fillStyle = '#cbd5e1';
    pCtx.fillRect(3, sy, 10, 2.5);
    pCtx.fillStyle = '#facc15';
    pCtx.fillRect(3, sy + 2.5, 10, 1);
  }

  stadiumPatternReady = true;
}

function curLowerLowerSag(baseY, sag, t) {
  return baseY + 4 * sag * t * (1 - t);
}

// 2. ZAKRZYWIONA „MISA STADIONU” (OWALNA ARENA) I 3 WARSTWY PARALAKSY
export function drawStadium(ctx, worldLeft, worldRight) {
  const camDist = (camera.x - START_X) / 14;
  if (camDist < 250 || camDist > 820) return;

  let alpha = 1.0;
  if (camDist < 290) {
    alpha = smoothstep(250, 290, camDist);
  } else if (camDist > 745) {
    alpha = 1.0 - smoothstep(745, 820, camDist);
  }
  alpha = Math.max(0, Math.min(1, alpha));
  if (alpha <= 0.01) return;

  // Inicjalizacja offscreen canvas (wykonywana tylko raz w pamięci)
  initStadiumPatternCanvas();
  if (!stadiumPatternReady || !stadiumPatternCanvas) return;

  const enterX = START_X + 300 * 14; // 4360 px
  const exitX = START_X + 750 * 14;  // 10660 px
  const stadiumCenter = (enterX + exitX) / 2; // 7510 px
  const tunnelStartX = START_X + 265 * 14; // 3870 px

  const gy = GROUND_Y;
  const now = performance.now();

  ctx.save();
  ctx.globalAlpha *= alpha;

  // ----------------------------------------------------
  // WARSTWA 1: DACH I GIGANTYCZNE KRATOWNICE (PARALLAX 0.15) - PRE-RENDERED
  // ----------------------------------------------------
  const p1 = 0.15;
  const shift1 = (camera.x - stadiumCenter) * (1.0 - p1);

  ctx.save();
  ctx.translate(shift1, 0);

  const roofStart = tunnelStartX - 200;
  const roofEnd = exitX + 260;
  const ROOF_BAY_W = 240;
  const totalRoofBays = Math.ceil((roofEnd - roofStart) / ROOF_BAY_W);

  const firstRoofBay = Math.max(0, Math.floor((worldLeft - shift1 - roofStart - 100) / ROOF_BAY_W));
  const lastRoofBay = Math.min(totalRoofBays - 1, Math.ceil((worldRight - shift1 - roofStart + 100) / ROOF_BAY_W));

  for (let b = firstRoofBay; b <= lastRoofBay; b++) {
    const rx = roofStart + b * ROOF_BAY_W;
    // Błyskawiczny drawImage z bufora offscreen (zadaszenie, kratownice, catwalk, cięgna)
    ctx.drawImage(stadiumPatternCanvas, 0, 0, 240, 200, rx, gy - 660, 240, 200);

    // Dynamiczna dioda stroboskopowa pylonu
    const beaconBlink = (Math.sin(now * 0.005 + b) > 0);
    ctx.fillStyle = beaconBlink ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(rx + 14, gy - 668, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // ----------------------------------------------------
  // WARSTWA 2: GÓRNE TRYBUNY + TELEBIMY (PARALLAX 0.35) - PRE-RENDERED
  // ----------------------------------------------------
  const p2 = 0.35;
  const shift2 = (camera.x - stadiumCenter) * (1.0 - p2);

  ctx.save();
  ctx.translate(shift2, 0);

  const standStart = tunnelStartX - 150;
  const standEnd = exitX + 220;
  const BAY_W = 220;
  const totalBays = Math.ceil((standEnd - standStart) / BAY_W);

  const firstUpperBay = Math.max(0, Math.floor((worldLeft - shift2 - standStart - 100) / BAY_W));
  const lastUpperBay = Math.min(totalBays - 1, Math.ceil((worldRight - shift2 - standStart + 100) / BAY_W));

  for (let b = firstUpperBay; b <= lastUpperBay; b++) {
    const bx = standStart + b * BAY_W;
    // Błyskawiczny drawImage z bufora offscreen (14 rzędów, tysiące krzesełek, loże VIP)
    ctx.drawImage(stadiumPatternCanvas, 0, 200, 220, 280, bx, gy - 470, 220, 280);

    // Dynamiczne losowe błyski fleszy aparatów w widocznych sektorach (Math.random() < 0.04)
    if (Math.random() < 0.35) {
      const flashCount = Math.floor(Math.random() * 2) + 1;
      for (let f = 0; f < flashCount; f++) {
        const flashX = bx + 16 + Math.random() * 188;
        const flashY = gy - 435 + Math.random() * 220;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(flashX - 5, flashY);
        ctx.lineTo(flashX + 5, flashY);
        ctx.moveTo(flashX, flashY - 5);
        ctx.lineTo(flashX, flashY + 5);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(flashX, flashY, 2.2, 0, Math.PI * 2);
        ctx.fill();

        const flashGlow = ctx.createRadialGradient(flashX, flashY, 1, flashX, flashY, 7);
        flashGlow.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        flashGlow.addColorStop(0.45, 'rgba(224, 242, 254, 0.35)');
        flashGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = flashGlow;
        ctx.beginPath();
        ctx.arc(flashX, flashY, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // PODWIESZONE TELEBIMY (JUMBOTRONS) W WARSTWIE 2 - Rysowane tylko gdy w kadrze
  const drawScoreboard = (screenX, timeText) => {
    const sw = 240;
    const sh = 84;
    const sx = screenX - sw / 2;
    const sy = gy - 440;

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(sx + 30, sy - 50);
    ctx.lineTo(sx + 30, sy);
    ctx.moveTo(sx + sw - 30, sy - 50);
    ctx.lineTo(sx + sw - 30, sy);
    ctx.stroke();

    ctx.fillStyle = '#080d1a';
    ctx.fillRect(sx - 4, sy - 4, sw + 8, sh + 8);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(sx - 4, sy - 4, sw + 8, sh + 8);

    ctx.fillStyle = '#020617';
    ctx.fillRect(sx, sy, sw, sh);

    ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
    for (let my = sy + 3; my < sy + sh; my += 4) {
      ctx.fillRect(sx, my, sw, 1);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('★ MATCHDAY 2026 ★', screenX, sy + 18);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('2  :  1', screenX, sy + 47);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('HOME', screenX - 60, sy + 44);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('AWAY', screenX + 60, sy + 44);

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(timeText, screenX, sy + 70);
    ctx.textAlign = 'left';
  };

  const elapsedSec = Math.floor((now * 0.001) % 60);
  const timeStr = `LIVE 84:${elapsedSec < 10 ? '0' : ''}${elapsedSec} • CHAMPIONS ARENA`;

  const jumbotrons = [
    { x: START_X + 525 * 14, text: timeStr },
    { x: START_X + 390 * 14, text: "LIVE 84' • MATCHDAY 2026" },
    { x: START_X + 660 * 14, text: "LIVE 84' • KEEP IT HIGH" }
  ];
  for (let j = 0; j < jumbotrons.length; j++) {
    const jx = jumbotrons[j].x;
    if (jx >= worldLeft - shift2 - 160 && jx <= worldRight - shift2 + 160) {
      drawScoreboard(jx, jumbotrons[j].text);
    }
  }

  ctx.restore();

  // ----------------------------------------------------
  // WARSTWA 3: DOLNE TRYBUNY I BANDY LED (PARALLAX 0.70) - PRE-RENDERED
  // ----------------------------------------------------
  const p3 = 0.70;
  const shift3 = (camera.x - stadiumCenter) * (1.0 - p3);

  ctx.save();
  ctx.translate(shift3, 0);

  const ledSponsors = [
    { title: '★ KEEP IT HIGH ★', col1: '#00e5ff', col2: '#ffffff', glowRgb: '0, 229, 255' },
    { title: 'MATCHDAY 2026', col1: '#facc15', col2: '#ffffff', glowRgb: '250, 204, 21' },
    { title: 'CHAMPIONS LEAGUE', col1: '#38bdf8', col2: '#818cf8', glowRgb: '56, 189, 248' },
    { title: 'POWER ENERGY', col1: '#22c55e', col2: '#a3e635', glowRgb: '34, 197, 94' },
    { title: 'CYBER ARENA', col1: '#f43f5e', col2: '#ffffff', glowRgb: '244, 63, 94' }
  ];

  const boardH = 20;
  const boardY = gy - boardH - 2;

  const firstLowerBay = Math.max(0, Math.floor((worldLeft - shift3 - standStart - 100) / BAY_W));
  const lastLowerBay = Math.min(totalBays - 1, Math.ceil((worldRight - shift3 - standStart + 100) / BAY_W));

  for (let b = firstLowerBay; b <= lastLowerBay; b++) {
    const bx = standStart + b * BAY_W;
    // Błyskawiczny drawImage z bufora offscreen (8 rzędów, kibice, schody)
    ctx.drawImage(stadiumPatternCanvas, 0, 480, 220, 180, bx, gy - 180, 220, 180);

    // Bandy reklamowe LED tuż za linią boiska
    if (bx < exitX) {
      const currentBayW = Math.min(BAY_W, exitX - bx);
      if (currentBayW > 0) {
        const sponsor = ledSponsors[b % ledSponsors.length];

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bx, boardY + boardH, currentBayW, 2);

        ctx.fillStyle = '#030712';
        ctx.fillRect(bx, boardY, currentBayW, boardH);

        ctx.fillStyle = sponsor.col1;
        ctx.fillRect(bx, boardY, currentBayW, 1.8);
        ctx.fillStyle = sponsor.col2;
        ctx.fillRect(bx, boardY + boardH - 1.5, currentBayW, 1.5);

        if (currentBayW >= 80) {
          const sheen = ((now * 0.08 + b * 45) % currentBayW);
          const gradLED = ctx.createLinearGradient(bx, boardY, bx + currentBayW, boardY);
          gradLED.addColorStop(0, sponsor.col1);
          gradLED.addColorStop(Math.max(0, Math.min(1, sheen / currentBayW)), sponsor.col2);
          gradLED.addColorStop(1, sponsor.col1);

          ctx.fillStyle = gradLED;
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(sponsor.title, bx + currentBayW / 2, boardY + 14);
          ctx.textAlign = 'left';
        }

        const grassGlow = ctx.createLinearGradient(0, gy - 2, 0, gy + 16);
        grassGlow.addColorStop(0, `rgba(${sponsor.glowRgb}, 0.45)`);
        grassGlow.addColorStop(0.5, `rgba(${sponsor.glowRgb}, 0.18)`);
        grassGlow.addColorStop(1, `rgba(${sponsor.glowRgb}, 0.0)`);
        ctx.fillStyle = grassGlow;
        ctx.fillRect(bx, gy - 2, currentBayW, 18);
      }
    }
  }

  ctx.restore();

  // ----------------------------------------------------
  // 4 POTĘŻNE MASZTY JUPITERÓW (OŚWIETLENIE WOLUMETRYCZNE W KADRZE)
  // ----------------------------------------------------
  for (let i = 0; i < STADIUM_FLOODLIGHT_MASTS.length; i++) {
    const mx = STADIUM_FLOODLIGHT_MASTS[i];
    if (mx >= worldLeft - 480 && mx <= worldRight + 480) {
      drawFloodlightTower(ctx, mx, gy, now);
    }
  }

  // ----------------------------------------------------
  // TŁO TUNELU WEJŚCIOWEGO (GRACZY) ORAZ WYJŚCIOWEGO
  // ----------------------------------------------------
  if (enterX >= worldLeft - 300 && tunnelStartX <= worldRight + 300) {
    drawPlayerTunnelBg(ctx, tunnelStartX, enterX, gy);
  }
  if (exitX >= worldLeft - 220 && exitX <= worldRight + 220) {
    drawExitTunnelBg(ctx, exitX, gy);
  }

  ctx.restore();
}

// ==========================================
// PŁYNNE PRZEJŚCIA PODŁOŻA (GROUND BLENDING)
// ==========================================
const GROUND_SEGMENTS = [
  { startX: -1e9, endX: START_X + 750 * 14, type: 'solid', baseHex: BIOMES[0].groundBaseHex, topHex: BIOMES[0].groundTopHex },
  {
    startX: START_X + 750 * 14,
    endX: START_X + 850 * 14,
    type: 'transition',
    topStops: [
      [0.00, '#2e7d32'],
      [0.30, '#556b2f'],
      [0.65, '#cda446'],
      [1.00, '#e0bb53']
    ],
    baseStops: [
      [0.00, '#1b5e20'],
      [0.30, '#3b4d1c'],
      [0.65, '#8a6e26'],
      [1.00, '#c29b38']
    ]
  },
  { startX: START_X + 850 * 14, endX: START_X + 1550 * 14, type: 'solid', baseHex: BIOMES[1].groundBaseHex, topHex: BIOMES[1].groundTopHex },
  {
    startX: START_X + 1550 * 14,
    endX: START_X + 1650 * 14,
    type: 'transition',
    topStops: [
      [0.00, '#e0bb53'],
      [0.30, '#c4bfa2'],
      [0.65, '#dbe4e8'],
      [1.00, '#eceff1']
    ],
    baseStops: [
      [0.00, '#c29b38'],
      [0.35, '#9c9b7e'],
      [0.70, '#81969f'],
      [1.00, '#78909c']
    ]
  },
  { startX: START_X + 1650 * 14, endX: START_X + 2350 * 14, type: 'solid', baseHex: BIOMES[2].groundBaseHex, topHex: BIOMES[2].groundTopHex },
  {
    startX: START_X + 2350 * 14,
    endX: START_X + 2450 * 14,
    type: 'transition',
    topStops: [
      [0.00, '#eceff1'],
      [0.35, '#9bb293'],
      [0.70, '#4e8f49'],
      [1.00, '#2e7d32']
    ],
    baseStops: [
      [0.00, '#78909c'],
      [0.40, '#555648'],
      [0.75, '#3f3322'],
      [1.00, '#2e1c0c']
    ]
  },
  { startX: START_X + 2450 * 14, endX: START_X + 3150 * 14, type: 'solid', baseHex: BIOMES[3].groundBaseHex, topHex: BIOMES[3].groundTopHex },
  {
    startX: START_X + 3150 * 14,
    endX: START_X + 3250 * 14,
    type: 'transition',
    topStops: [
      [0.00, '#2e7d32'],
      [0.35, '#8a501e'],
      [0.70, '#cc3a09'],
      [1.00, '#ff3d00']
    ],
    baseStops: [
      [0.00, '#2e1c0c'],
      [0.45, '#251711'],
      [0.80, '#1d1111'],
      [1.00, '#1a0f0f']
    ]
  },
  { startX: START_X + 3250 * 14, endX: 1e9, type: 'solid', baseHex: BIOMES[4].groundBaseHex, topHex: BIOMES[4].groundTopHex }
];

export function drawContinuousGround(ctx, worldLeft, worldRight) {
  for (let i = 0; i < GROUND_SEGMENTS.length; i++) {
    const seg = GROUND_SEGMENTS[i];
    if (worldRight < seg.startX || worldLeft > seg.endX) continue;

    const drawStart = Math.max(worldLeft, seg.startX);
    const drawEnd = Math.min(worldRight, seg.endX);
    const drawW = drawEnd - drawStart;
    if (drawW <= 0) continue;

    if (seg.type === 'solid') {
      ctx.fillStyle = seg.baseHex;
      ctx.fillRect(drawStart, GROUND_Y, drawW, 600);
      ctx.fillStyle = seg.topHex;
      ctx.fillRect(drawStart, GROUND_Y, drawW, 9);
    } else {
      // Płynny gradient strefy przejściowej w koordynatach świata
      const baseGrad = ctx.createLinearGradient(seg.startX, 0, seg.endX, 0);
      for (let s = 0; s < seg.baseStops.length; s++) {
        baseGrad.addColorStop(seg.baseStops[s][0], seg.baseStops[s][1]);
      }
      ctx.fillStyle = baseGrad;
      ctx.fillRect(drawStart, GROUND_Y, drawW, 600);

      const topGrad = ctx.createLinearGradient(seg.startX, 0, seg.endX, 0);
      for (let s = 0; s < seg.topStops.length; s++) {
        topGrad.addColorStop(seg.topStops[s][0], seg.topStops[s][1]);
      }
      ctx.fillStyle = topGrad;
      ctx.fillRect(drawStart, GROUND_Y, drawW, 9);
    }
  }
}

const TRANSITION_SAND_DRIFTS = [
  { m: 756, w: 75,  h: 7,  slope: 0.65 },
  { m: 763, w: 90,  h: 10, slope: 0.70 },
  { m: 770, w: 108, h: 14, slope: 0.62 },
  { m: 777, w: 125, h: 18, slope: 0.72 },
  { m: 785, w: 145, h: 22, slope: 0.60 },
  { m: 793, w: 165, h: 26, slope: 0.68 },
  { m: 802, w: 185, h: 30, slope: 0.63 },
  { m: 812, w: 205, h: 33, slope: 0.70 },
  { m: 822, w: 225, h: 36, slope: 0.65 },
  { m: 833, w: 245, h: 39, slope: 0.68 }
];

const TRANSITION_SNOW_DRIFTS = [
  { m: 1558, w: 80,  h: 8,  slope: 0.65 },
  { m: 1568, w: 105, h: 12, slope: 0.68 },
  { m: 1578, w: 130, h: 16, slope: 0.62 },
  { m: 1589, w: 155, h: 21, slope: 0.70 },
  { m: 1600, w: 180, h: 26, slope: 0.64 },
  { m: 1612, w: 205, h: 30, slope: 0.67 },
  { m: 1624, w: 230, h: 34, slope: 0.63 },
  { m: 1636, w: 250, h: 37, slope: 0.66 }
];

export function drawTransitionDrifts(ctx, worldLeft, worldRight) {
  // 1. Zaspy piaskowe nawiewane na skraj murawy (755m – 840m)
  for (let i = 0; i < TRANSITION_SAND_DRIFTS.length; i++) {
    const d = TRANSITION_SAND_DRIFTS[i];
    const cx = START_X + d.m * 14;
    if (cx + d.w < worldLeft || cx - d.w > worldRight) continue;

    ctx.save();
    const leftX = cx - d.w * 0.65;
    const rightX = cx + d.w * 0.35;
    const crestX = cx + d.w * (d.slope - 0.5);
    const crestY = GROUND_Y - d.h;

    const driftGrad = ctx.createLinearGradient(leftX, GROUND_Y, rightX, crestY);
    driftGrad.addColorStop(0, '#556b2f');    // sucha spalona trawa na styku
    driftGrad.addColorStop(0.35, '#c29b38'); // złocisty piasek pustynny
    driftGrad.addColorStop(0.85, '#e0bb53'); // oświetlony grzbiet
    driftGrad.addColorStop(1.0, '#fae090');
    ctx.fillStyle = driftGrad;

    ctx.beginPath();
    ctx.moveTo(leftX, GROUND_Y + 1);
    ctx.quadraticCurveTo(cx - d.w * 0.15, crestY + 1, crestX, crestY);
    ctx.quadraticCurveTo(cx + d.w * 0.22, crestY + d.h * 0.4, rightX, GROUND_Y + 1);
    ctx.closePath();
    ctx.fill();

    // Krawędź nawiewki piasku
    ctx.strokeStyle = 'rgba(255, 235, 175, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(leftX + 10, GROUND_Y);
    ctx.quadraticCurveTo(cx - d.w * 0.15, crestY + 1, crestX, crestY);
    ctx.stroke();

    // Pojedyncze kępki traw wystające spod nawianego piasku
    if (d.h < 25) {
      ctx.strokeStyle = '#6b7f35';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(leftX + 14, GROUND_Y);
      ctx.lineTo(leftX + 11, GROUND_Y - 9);
      ctx.moveTo(leftX + 18, GROUND_Y);
      ctx.lineTo(leftX + 19, GROUND_Y - 11);
      ctx.moveTo(leftX + 23, GROUND_Y);
      ctx.lineTo(leftX + 26, GROUND_Y - 8);
      ctx.stroke();
    }

    ctx.restore();
  }

  // 2. Zaspy śnieżne nawiewane na skraj pustyni (1555m – 1640m)
  for (let i = 0; i < TRANSITION_SNOW_DRIFTS.length; i++) {
    const d = TRANSITION_SNOW_DRIFTS[i];
    const cx = START_X + d.m * 14;
    if (cx + d.w < worldLeft || cx - d.w > worldRight) continue;

    ctx.save();
    const leftX = cx - d.w * 0.65;
    const rightX = cx + d.w * 0.35;
    const crestX = cx + d.w * (d.slope - 0.5);
    const crestY = GROUND_Y - d.h;

    const snowGrad = ctx.createLinearGradient(leftX, GROUND_Y, rightX, crestY);
    snowGrad.addColorStop(0, '#c4bfa2');    // piasek ze szronem na styku
    snowGrad.addColorStop(0.35, '#dbe4e8'); // zmrożony śnieg
    snowGrad.addColorStop(1.0, '#eceff1');  // czysty biały puch
    ctx.fillStyle = snowGrad;

    ctx.beginPath();
    ctx.moveTo(leftX, GROUND_Y + 1);
    ctx.quadraticCurveTo(cx - d.w * 0.15, crestY + 1, crestX, crestY);
    ctx.quadraticCurveTo(cx + d.w * 0.22, crestY + d.h * 0.4, rightX, GROUND_Y + 1);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(leftX + 10, GROUND_Y);
    ctx.quadraticCurveTo(cx - d.w * 0.15, crestY + 1, crestX, crestY);
    ctx.stroke();

    ctx.restore();
  }
}

export function drawGround(ctx, worldLeft, worldWidth) {
  const worldRight = worldLeft + worldWidth;

  // 1. Tło stadionu w warstwie mid-ground (za murawą, graczem i obiektami)
  drawStadium(ctx, worldLeft, worldRight);

  // 2. Wielowarstwowe wydmy piaskowe w przestrzeni świata (baza pod piramidę i piaszczysty horyzont)
  drawNearDunes(ctx, worldLeft, worldRight);

  // 3. Sylwetka i monumentalna fasada zewnętrzna Wielkiej Piramidy (biom pustynny)
  drawPyramidExterior(ctx, worldLeft, worldRight);

  // 4. Wnętrze monumentalnej Wielkiej Galerii piramidy (1050m - 1350m: dokładnie 300 metrów)
  drawPyramidInterior(ctx, worldLeft, worldRight);

  // 5. Ciągły, wielowarstwowy grunt biomów z płynną interpolacją w strefach przejściowych
  drawContinuousGround(ctx, worldLeft, worldRight);

  // 6. Organiczne nawiewki piaskowe i zaspy zmarzlinowe na skraju murawy
  drawTransitionDrifts(ctx, worldLeft, worldRight);

  // 7. Starożytna kamienna posadzka wnętrza piramidy (1050m - 1350m)
  drawPyramidFloor(ctx, worldLeft, worldRight);

  // 8. Monumentalne portale wejściowy i wyjściowy Wielkiej Piramidy (spójny obiekt na wierzchu tła)
  drawPyramidPortals(ctx, worldLeft, worldRight);

  // 9. Profesjonalna murawa piłkarska z pasami koszenia i liniami (300m - 750m)
  drawPitchMarkings(ctx, START_X + 300 * 14, START_X + 750 * 14, GROUND_Y, worldLeft, worldRight);

  // 10. Gwałtowna zamieć piaskowa (płynna dynamika cząsteczek i pyłu)
  drawDesertSandstorm(ctx, worldLeft, worldRight);

  // 11. Potężne powiewy śniegu i zamieć śnieżna w tle (płynna dynamika cząsteczek)
  drawWinterBlizzard(ctx, worldLeft, worldRight);
}

// ==========================================
// WARSTWA PRZEDNIA (FOREGROUND): BRAMY, KONFETTI I OŚWIETLENIE
// ==========================================
function drawEntranceGateForeground(ctx, enterX, gy) {
  // 1. KINEMATYCZNE WEJŚCIE NA PŁYTĘ (TUNEL GRACZY) - PIERWSZY PLAN
  const tunnelStartX = START_X + 265 * 14; // 3870 px

  // Czerwona wykładzina techniczna na pierwszym planie (w korytarzu wyjściowym)
  const carpetStartX = tunnelStartX - 30;
  const carpetEndX = enterX + 45;
  const carpetW = carpetEndX - carpetStartX;

  const carpetGrad = ctx.createLinearGradient(0, gy - 2, 0, gy + 8);
  carpetGrad.addColorStop(0, '#991b1b');
  carpetGrad.addColorStop(0.4, '#b91c1c');
  carpetGrad.addColorStop(1, '#7f1d1d');
  ctx.fillStyle = carpetGrad;
  ctx.fillRect(carpetStartX, gy - 2, carpetW, 8);

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(carpetStartX, gy - 2, carpetW, 1.5);
  ctx.fillRect(carpetStartX, gy + 5, carpetW, 1.5);

  // 2. MONUMENTALNA BRAMA PORTALOWA NA WEJŚCIU (Wylot tunelu na murawę)
  const pillarW = 44;
  const pillarH = 310;
  const gateW = 230;
  const leftPillarX = enterX - gateW / 2;
  const rightPillarX = enterX + gateW / 2 - pillarW;

  const drawPillar = (px) => {
    const gradPillar = ctx.createLinearGradient(px, 0, px + pillarW, 0);
    gradPillar.addColorStop(0, '#090e1a');
    gradPillar.addColorStop(0.3, '#1e293b');
    gradPillar.addColorStop(0.7, '#334155');
    gradPillar.addColorStop(1, '#090e1a');
    ctx.fillStyle = gradPillar;
    ctx.fillRect(px, gy - pillarH, pillarW, pillarH + 10);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(px, gy - pillarH, pillarW, pillarH + 10);

    // Żółto-czarne pasy ostrzegawcze skrajni
    const hazardH = 48;
    const stripeSize = 12;
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, gy - hazardH, pillarW, hazardH);
    ctx.clip();
    for (let sy = gy - hazardH - stripeSize; sy < gy + stripeSize; sy += stripeSize * 2) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(px, sy);
      ctx.lineTo(px + pillarW, sy + stripeSize);
      ctx.lineTo(px + pillarW, sy + stripeSize * 2);
      ctx.lineTo(px, sy + stripeSize);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#090e1a';
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

  ctx.fillStyle = '#080d1a';
  ctx.fillRect(lintelX, lintelY, lintelW, lintelH);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.strokeRect(lintelX, lintelY, lintelW, lintelH);

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(lintelX + 4, lintelY + 4, lintelW - 8, lintelH - 8);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('★ CHAMPIONS ARENA ★', enterX, lintelY + 22);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('KEEP IT HIGH', enterX, lintelY + 46);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('FAIR PLAY • 300M', enterX, lintelY + 64);
  ctx.textAlign = 'left';

  // Diody ostrzegawcze
  const blink = Math.sin(performance.now() * 0.007) > 0;
  ctx.fillStyle = blink ? '#38bdf8' : '#0369a1';
  ctx.beginPath();
  ctx.arc(leftPillarX + pillarW / 2, lintelY - 5, 4.5, 0, Math.PI * 2);
  ctx.arc(rightPillarX + pillarW / 2, lintelY - 5, 4.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawExitGateForeground(ctx, exitX, gy) {
  const pillarW = 44;
  const pillarH = 310;
  const gateW = 230;
  const leftPillarX = exitX - gateW / 2;
  const rightPillarX = exitX + gateW / 2 - pillarW;

  const drawPillar = (px) => {
    const gradPillar = ctx.createLinearGradient(px, 0, px + pillarW, 0);
    gradPillar.addColorStop(0, '#090e1a');
    gradPillar.addColorStop(0.3, '#1e293b');
    gradPillar.addColorStop(0.7, '#334155');
    gradPillar.addColorStop(1, '#090e1a');
    ctx.fillStyle = gradPillar;
    ctx.fillRect(px, gy - pillarH, pillarW, pillarH + 10);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2.5;
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

  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('FAIR PLAY • 750M ➔', exitX, lintelY + 64);
  ctx.textAlign = 'left';
}

function drawForegroundSpotlight(ctx, mx, gy) {
  // Przedni wolumetryczny snop światła padający na zawodnika
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const cone = ctx.createLinearGradient(mx, gy - 550, mx, gy);
  cone.addColorStop(0, 'rgba(220, 240, 255, 0.16)');
  cone.addColorStop(0.5, 'rgba(220, 240, 255, 0.08)');
  cone.addColorStop(1, 'rgba(220, 240, 255, 0.0)');

  ctx.fillStyle = cone;
  ctx.beginPath();
  ctx.moveTo(mx - 25, gy - 550);
  ctx.lineTo(mx + 25, gy - 550);
  ctx.lineTo(mx + 230, gy);
  ctx.lineTo(mx - 230, gy);
  ctx.closePath();
  ctx.fill();

  const pool = ctx.createRadialGradient(mx, gy, 15, mx, gy, 210);
  pool.addColorStop(0, 'rgba(220, 240, 255, 0.14)');
  pool.addColorStop(1, 'rgba(220, 240, 255, 0)');
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.ellipse(mx, gy + 4, 210, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawStadiumForeground(ctx, worldLeft, worldRight) {
  const gy = GROUND_Y;
  const enterX = START_X + 300 * 14; // 4360 px
  const exitX = START_X + 750 * 14;  // 10660 px
  const tunnelStartX = START_X + 265 * 14; // 3870 px
  const camDist = (camera ? (camera.x - START_X) / 14 : 0);

  // Współczynnik przebywania wewnątrz areny stadionu do efektów globalnych
  let stadiumFactor = 0;
  if (camDist >= 250 && camDist <= 810) {
    if (camDist < 300) {
      stadiumFactor = smoothstep(250, 300, camDist);
    } else if (camDist > 740) {
      stadiumFactor = 1.0 - smoothstep(740, 810, camDist);
    } else {
      stadiumFactor = 1.0;
    }
  }

  // 1. Przód tunelu graczy i monumentalnej bramy wejściowej na 300 m
  if (enterX >= worldLeft - 260 && tunnelStartX <= worldRight + 260) {
    drawEntranceGateForeground(ctx, enterX, gy);
  }

  // 2. Przód monumentalnej bramy wyjściowej na 750 m (filary przesłaniające gracza)
  if (exitX >= worldLeft - 260 && exitX <= worldRight + 260) {
    drawExitGateForeground(ctx, exitX, gy);
  }

  // 3. Przednie snopy światła jupiterów oświetlające gracza i płytę boiska
  for (let mx = enterX + 220; mx < exitX; mx += 560) {
    if (mx >= worldLeft - 260 && mx <= worldRight + 260) {
      drawForegroundSpotlight(ctx, mx, gy);
    }
  }

  // 4. JEDNORAZOWY EFEKT ADAPTACJI OKA (BIAŁY FLASH TRWAJĄCY 15-20 KLATEK, ALPHA 0.55 -> 0.0)
  // Wyzwalany w momencie minięcia bramy tunelu (300 m)
  if (camDist >= 298 && camDist <= 330 && !eyeAdaptationTriggered) {
    eyeAdaptationTriggered = true;
    eyeAdaptationFrames = EYE_ADAPTATION_MAX_FRAMES;
  }
  if (camDist < 250) {
    eyeAdaptationTriggered = false;
  }

  if (eyeAdaptationFrames > 0) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Rysowanie w pełnych współrzędnych ekranowych

    const t = eyeAdaptationFrames / EYE_ADAPTATION_MAX_FRAMES; // 1.0 -> 0.0
    // Krótkie rozjaśnienie ekranu: biały flash trwający 15-20 klatek, płynnie znikający od alpha = 0.55 do 0.0
    const flashAlpha = 0.55 * t;

    // A. Pełnoekranowy biały flash adaptacji oka
    ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
    ctx.fillRect(0, 0, W, H);

    // B. Kinematyczna poświata radialna odkrywająca rozświetloną arenę
    const bloomGrad = ctx.createRadialGradient(W * 0.48, H * 0.42, 20, W * 0.48, H * 0.42, W * 0.75);
    bloomGrad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha * 0.90})`);
    bloomGrad.addColorStop(0.40, `rgba(224, 242, 254, ${flashAlpha * 0.50})`);
    bloomGrad.addColorStop(0.80, `rgba(186, 230, 253, ${flashAlpha * 0.20})`);
    bloomGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = bloomGrad;
    ctx.fillRect(0, 0, W, H);

    // C. Horyzontalny błysk anamorficzny reflektorów stadionowych
    const flareGrad = ctx.createLinearGradient(0, H * 0.36, 0, H * 0.46);
    flareGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    flareGrad.addColorStop(0.5, `rgba(255, 255, 255, ${flashAlpha * 0.60})`);
    flareGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = flareGrad;
    ctx.fillRect(0, H * 0.36, W, H * 0.10);

    ctx.restore();
    eyeAdaptationFrames--;
  }

  // 5. WINIETA GŁĘBI I KONTRASTU
  // Przyciemnienie górnej krawędzi dachu i narożników ekranu dla kinowego nocnego kontrastu
  if (stadiumFactor > 0.02) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Przyciemnienie górnej krawędzi zadaszenia stadionu
    const topVignette = ctx.createLinearGradient(0, 0, 0, H * 0.32);
    topVignette.addColorStop(0, `rgba(2, 6, 18, ${0.68 * stadiumFactor})`);
    topVignette.addColorStop(0.65, `rgba(2, 6, 18, ${0.25 * stadiumFactor})`);
    topVignette.addColorStop(1, 'rgba(2, 6, 18, 0)');
    ctx.fillStyle = topVignette;
    ctx.fillRect(0, 0, W, H * 0.32);

    // Przyciemnienie dolnej krawędzi ekranu
    const bottomVignette = ctx.createLinearGradient(0, H - 75, 0, H);
    bottomVignette.addColorStop(0, 'rgba(2, 6, 18, 0)');
    bottomVignette.addColorStop(1, `rgba(2, 6, 18, ${0.40 * stadiumFactor})`);
    ctx.fillStyle = bottomVignette;
    ctx.fillRect(0, H - 75, W, 75);

    // Winieta narożnikowa (studyjna głębia areny piłkarskiej)
    const cornerGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.35, W / 2, H / 2, W * 0.75);
    cornerGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    cornerGrad.addColorStop(1, `rgba(3, 7, 22, ${0.48 * stadiumFactor})`);
    ctx.fillStyle = cornerGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.restore();
  }

  // 5. WINIETA GŁĘBI I KONTRASTU (Wymóg 4)
  // Przyciemnienie górnej krawędzi dachu i narożników ekranu dla studyjnego kontrastu
  if (stadiumFactor > 0.02) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Przyciemnienie górnej krawędzi zadaszenia stadionu
    const topVignette = ctx.createLinearGradient(0, 0, 0, H * 0.32);
    topVignette.addColorStop(0, `rgba(2, 6, 18, ${0.68 * stadiumFactor})`);
    topVignette.addColorStop(0.65, `rgba(2, 6, 18, ${0.25 * stadiumFactor})`);
    topVignette.addColorStop(1, 'rgba(2, 6, 18, 0)');
    ctx.fillStyle = topVignette;
    ctx.fillRect(0, 0, W, H * 0.32);

    // Przyciemnienie dolnej krawędzi ekranu
    const bottomVignette = ctx.createLinearGradient(0, H - 75, 0, H);
    bottomVignette.addColorStop(0, 'rgba(2, 6, 18, 0)');
    bottomVignette.addColorStop(1, `rgba(2, 6, 18, ${0.40 * stadiumFactor})`);
    ctx.fillStyle = bottomVignette;
    ctx.fillRect(0, H - 75, W, 75);

    // Winieta narożnikowa (studyjna głębia areny piłkarskiej)
    const cornerGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.35, W / 2, H / 2, W * 0.75);
    cornerGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    cornerGrad.addColorStop(1, `rgba(3, 7, 22, ${0.48 * stadiumFactor})`);
    ctx.fillStyle = cornerGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.restore();
  }

  // 6. Opadające, wirujące konfetti na powitanie (chłodny cyjan, złoto, biel)
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

  // 7. Przednia warstwa Wielkiej Piramidy (strop z bloków kamiennych, przednie kolumny, portale i snop słońca)
  drawPyramidForeground(ctx, worldLeft, worldRight);

  // 8. Płatki/drobiny zamieci piaskowej na pierwszym planie (biom pustynny 800 – 1599 m)
  drawDesertSandstormForeground(ctx, worldLeft, worldRight);

  // 9. Płatki zamieci śnieżnej na pierwszym planie (biom zimowy 1600 – 2399 m)
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

// ==========================================
// DYNAMICZNY LICZNIK FPS I ZAKŁADKA BIOMÓW
// ==========================================
let lastTime = performance.now();
let frameCount = 0;
export let currentFps = 60;

export function updateFps() {
  frameCount++;
  const now = performance.now();
  const elapsed = now - lastTime;
  if (elapsed >= 350) { // Uśrednianie co 350 ms (okno 250–500 ms) dla czytelności i braku migotania
    currentFps = Math.round((frameCount * 1000) / elapsed);
    frameCount = 0;
    lastTime = now;
    if (typeof window !== 'undefined') {
      window.currentFps = currentFps;
    }
  }
}

export function drawBiomeInfoPanel(ctx, currentDist, currentFps, now, W) {
  const biome = getCurrentBiome(currentDist);
  if (!biome) return;

  let biomeIcon = '🏟️';
  let biomeSub = `${Math.min(BIOMES.length - 1, Math.floor(currentDist / BIOME_STEP)) * BIOME_STEP}–${(Math.min(BIOMES.length - 1, Math.floor(currentDist / BIOME_STEP)) + 1) * BIOME_STEP}m`;

  if (biome.id === 0) {
    biomeIcon = '🏟️';
    if (currentDist >= 300 && currentDist <= 750) {
      biomeSub = 'STADION (300–750m)';
    } else {
      biomeSub = 'MURAWA (0–800m)';
    }
  } else if (biome.id === 1) {
    biomeIcon = '🏜️';
    if (currentDist >= 1050 && currentDist <= 1350) {
      biomeSub = 'PIRAMIDA (1050–1350m)';
    } else {
      biomeSub = 'PUSTYNIA (800–1600m)';
    }
  } else if (biome.id === 2) {
    biomeIcon = '❄️';
    biomeSub = 'ZIMA (1600–2400m)';
  } else if (biome.id === 3) {
    biomeIcon = '🌴';
    biomeSub = 'DŻUNGLA (2400–3200m)';
  } else if (biome.id === 4) {
    biomeIcon = '🔥';
    biomeSub = 'PIEKŁO (3200m+)';
  }

  // Kolor statusu FPS (zielony dla 55+, żółty dla 30-54, czerwony dla <30)
  const fpsColor = currentFps >= 55 ? '#00e676' : (currentFps >= 30 ? '#ffd600' : '#ff5252');

  // Położenie panelu w prawym górnym rogu ekranu
  const panelW = 216;
  const panelH = 48;
  const panelX = Math.max(12, W - panelW - 24);
  const panelY = 20;

  ctx.save();

  // 1. Tło glassmorphism panelu
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(panelX, panelY, panelW, panelH, 8);
  } else {
    ctx.rect(panelX, panelY, panelW, panelH);
  }
  ctx.fill();

  // Obramowanie karty
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 2. Akcent kolorystyczny aktywnego biomu na lewej krawędzi
  ctx.fillStyle = biome.uiColor;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(panelX, panelY + 6, 4, panelH - 12, [2, 0, 0, 2]);
  } else {
    ctx.rect(panelX, panelY + 6, 4, panelH - 12);
  }
  ctx.fill();

  // 3. Informacja o biomie (lewa strona karty)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // Nazwa biomu z ikoną
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = biome.uiColor;
  ctx.fillText(`${biomeIcon} ${biome.name}`, panelX + 14, panelY + 17);

  // Zakres metrażu / strefa
  ctx.font = '600 10px monospace';
  ctx.fillStyle = 'rgba(226, 232, 240, 0.72)';
  ctx.fillText(biomeSub, panelX + 14, panelY + 34);

  // 4. Pionowy separator
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.beginPath();
  ctx.moveTo(panelX + panelW - 68, panelY + 8);
  ctx.lineTo(panelX + panelW - 68, panelY + panelH - 8);
  ctx.stroke();

  // 5. Dynamiczny licznik FPS (prawa strona karty)
  // Pulsująca dioda LED
  ctx.fillStyle = fpsColor;
  ctx.shadowColor = fpsColor;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(panelX + panelW - 55, panelY + 24, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Wartość liczbowa FPS
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`${currentFps}`, panelX + panelW - 46, panelY + 19);

  // Etykieta FPS
  ctx.font = '600 9px monospace';
  ctx.fillStyle = 'rgba(203, 213, 225, 0.65)';
  ctx.fillText('FPS', panelX + panelW - 46, panelY + 33);

  ctx.restore();
}

export function drawHUD(ctx, player, leftStick, btnCluster) {
  // Aktualizacja dynamicznego licznika FPS (uśrednianie co 250-500 ms)
  updateFps();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 20px monospace';
  ctx.fillText(`DYSTANS: ${currentDist} m`, 24, 38);
  ctx.fillStyle = '#ffeb3b';
  ctx.fillText(`REKORD:  ${bestDistance} m`, 24, 62);

  // Renderowanie panelu / zakładki z informacjami o biomie i dynamicznym licznikiem FPS
  drawBiomeInfoPanel(ctx, currentDist, currentFps, performance.now(), W);

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