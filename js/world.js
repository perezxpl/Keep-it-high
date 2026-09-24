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
// ORGANICZNE KŁĘBY PYŁU I MGŁA PUSTYNNA (800 – 1599 m)
// ==========================================
export const desertClouds = [];
export const desertWisps = desertClouds; // alias dla zachowania kompatybilności wstecznej
export const desertSpecks = [];

const DESERT_CLOUDS_COUNT = 32;

function getDesertViewBounds() {
  const zoom = (camera && camera.zoom) ? camera.zoom : 0.85;
  const camX = (camera && camera.x !== undefined) ? camera.x : 0;
  const camY = (camera && camera.y !== undefined) ? camera.y : GROUND_Y;

  // Pełny zakres widoku kamery w przestrzeni świata (od samego nieba po sam dół ekranu i murawę)
  const left = camX - (W * 0.40) / zoom - 250;
  const right = camX + (W * 0.60) / zoom + 250;
  const top = camY - (H * 0.68) / zoom - 150;
  const bottom = camY + (H * 0.32) / zoom + 150;

  return { left, right, top, bottom };
}

function resetCloud(c, worldRight, bounds, initialX) {
  const b = bounds || getDesertViewBounds();
  const spanY = Math.max(200, b.bottom - b.top);

  if (initialX !== undefined) {
    c.x = initialX;
  } else {
    c.x = worldRight + 20 + Math.random() * 200;
  }

  // Cząstki/kłęby kurzu losowane na całej rozpiętości pionowej kadru (od samej góry po sam dół)
  c.y = b.top + Math.random() * spanY;
  c.r = Math.random() * 90 + 90; // promień 90 – 180 px
  c.scaleX = Math.random() * 0.6 + 2.2; // 2.2 – 2.8 (aerodynamiczne spłaszczenie)
  c.scaleY = Math.random() * 0.15 + 0.60; // 0.60 – 0.75
  c.vx = -(Math.random() * 4.5 + 3.5); // zróżnicowana prędkość: -3.5 do -8.0 px/klatkę
  c.vy = (Math.random() - 0.5) * 0.4;
  c.alpha = Math.random() * 0.08 + 0.12; // krycie 0.12 – 0.20
  c.phase = Math.random() * Math.PI * 2;
}

export function initDesertWindPool(worldLeft, worldRight) {
  const bounds = getDesertViewBounds();
  const left = (worldLeft !== undefined) ? worldLeft : bounds.left;
  const right = (worldRight !== undefined) ? worldRight : bounds.right;
  const wWidth = Math.max(800, right - left);
  const spanY = Math.max(200, bounds.bottom - bounds.top);

  desertClouds.length = 0;
  for (let i = 0; i < DESERT_CLOUDS_COUNT; i++) {
    const c = {};
    const initX = left + Math.random() * wWidth;
    resetCloud(c, right, bounds, initX);
    // Równomierne rozmieszczenie w pionie od góry do dołu ekranu (zero pustych stref)
    const slot = (i + Math.random() * 0.8) / DESERT_CLOUDS_COUNT;
    c.y = bounds.top + slot * spanY;
    desertClouds.push(c);
  }
}

export function updateDesertWind() {
  if (currentDist < 800 || currentDist > 1599) {
    if (desertClouds.length > 0) desertClouds.length = 0;
    return;
  }

  const bounds = getDesertViewBounds();

  if (desertClouds.length === 0) {
    initDesertWindPool(bounds.left, bounds.right);
  }

  const spanY = Math.max(200, bounds.bottom - bounds.top);

  for (let i = 0; i < desertClouds.length; i++) {
    const c = desertClouds[i];
    c.x += c.vx;
    c.y += c.vy;

    // Utrzymanie tumanów w pełnym kadrze
    if (c.y < bounds.top) {
      c.vy = Math.abs(c.vy);
    } else if (c.y > bounds.bottom) {
      c.vy = -Math.abs(c.vy);
    }

    const halfW = c.r * c.scaleX;
    // Cząstka wylatująca z lewej krawędzi natychmiast wraca z prawej strony z nowo wylosowaną pozycją Y na pełnej wysokości
    if (c.x + halfW < bounds.left - 60) {
      resetCloud(c, bounds.right, bounds);
    } else if (c.x > bounds.right + 450 || c.x < bounds.left - 700) {
      c.x = bounds.left + Math.random() * (bounds.right - bounds.left);
      c.y = bounds.top + Math.random() * spanY;
    }
  }
}

export function drawDesertWind(ctx, worldLeft, worldRight) {
  if (currentDist < 800 || currentDist > 1599) {
    return;
  }

  const bounds = getDesertViewBounds();
  const wl = (worldLeft !== undefined) ? worldLeft : bounds.left;
  const wr = (worldRight !== undefined) ? worldRight : bounds.right;

  if (desertClouds.length === 0) {
    initDesertWindPool(wl, wr);
  }

  ctx.save();
  const now = performance.now();

  // 1. Pełnoekranowa atmosfera burzy (Ambient Haze): ciepły filtr piaskowy spajający całe tło na pełnej wysokości i szerokości
  ctx.save();
  ctx.resetTransform();
  ctx.scale(DPR, DPR);
  ctx.fillStyle = 'rgba(210, 150, 70, 0.12)';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // 2. Organiczne, spłaszczone kłęby kurzu na pełnej wysokości kadru (Zero kresek!)
  for (let i = 0; i < desertClouds.length; i++) {
    const c = desertClouds[i];
    const halfW = c.r * c.scaleX;
    if (c.x + halfW < wl - 60 || c.x - halfW > wr + 60) continue;

    ctx.save();
    ctx.translate(c.x, c.y);

    // Dynamiczne falowanie i pulsacja tumanu
    const pulse = Math.sin(now * 0.0018 + c.phase) * 0.06;
    ctx.scale(c.scaleX + pulse, c.scaleY - pulse * 0.4);

    // Gradient radialny: gęstszy środek, płynne rozmycie do pełnej przezroczystości (alpha = 0) na obrzeżach
    const radGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, c.r);
    radGrad.addColorStop(0, `rgba(225, 170, 90, ${c.alpha})`);
    radGrad.addColorStop(0.5, `rgba(235, 185, 110, ${c.alpha * 0.55})`);
    radGrad.addColorStop(1, 'rgba(225, 170, 90, 0)');

    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(0, 0, c.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
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

  // Aktualizacja powiewów i drobin piasku w biomie pustynnym (800 – 1599 m)
  updateDesertWind();

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

  // Gradient nieba dostosowany do aktualnego biomu lub nocnej areny zamkniętego stadionu
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  if (stadiumFactor > 0) {
    skyGrad.addColorStop(0, '#040711');
    skyGrad.addColorStop(0.35, '#0a1322');
    skyGrad.addColorStop(0.70, '#102038');
    skyGrad.addColorStop(1.0, '#172b48');
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

  // Słońce i chmury znikają wewnątrz zamkniętego stadionu
  const skyVisibility = 1.0 - stadiumFactor;
  if (skyVisibility > 0.01) {
    ctx.save();
    ctx.globalAlpha *= skyVisibility;

    // Słońce renderowane przed chmurami
    drawSun(ctx, biome);

    // Dalsze chmury (warstwa 0)
    drawCloudsLayer(ctx, 0, biome);

    ctx.restore();
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

  // 2. Grunt biomu
  const biome = getInterpolatedBiome(currentDist);
  ctx.fillStyle = biome.groundBase;
  ctx.fillRect(worldLeft, GROUND_Y, worldWidth, 600);
  ctx.fillStyle = biome.groundTop;
  ctx.fillRect(worldLeft, GROUND_Y, worldWidth, 9);

  // 3. Profesjonalna murawa piłkarska z pasami koszenia i liniami (300m - 750m)
  drawPitchMarkings(ctx, START_X + 300 * 14, START_X + 750 * 14, GROUND_Y, worldLeft, worldRight);

  // 4. Klimatyczny efekt atmosferyczny pustyni (kłęby kurzu i pełnoekranowa atmosfera burzy)
  drawDesertWind(ctx, worldLeft, worldRight);

  // 5. Potężne powiewy śniegu i zamieć śnieżna w tle (biom zimowy 1600 – 2399 m)
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

  // 5. Płatki zamieci śnieżnej na pierwszym planie (biom zimowy 1600 – 2399 m)
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
      const label = `${m}m`;
      ctx.font = 'bold 12px monospace';
      const textWidth = ctx.measureText(label).width;
      const badgeW = textWidth + 14;
      const badgeH = 18;
      const badgeX = x - badgeW / 2;
      const badgeY = GROUND_Y + 28;

      ctx.fillStyle = 'rgba(8, 16, 28, 0.78)';
      ctx.strokeStyle = isHundred ? 'rgba(255, 235, 59, 0.70)' : 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
      } else {
        ctx.rect(badgeX, badgeY, badgeW, badgeH);
      }
      ctx.fill();
      ctx.stroke();

      // Tekst metrażu
      ctx.fillStyle = isHundred ? '#ffeb3b' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, badgeY + badgeH / 2);

    } else {
      // Pomocnicza mała kreska co 10 metrów (pomijana wewnątrz stadionu dla zachowania czystości linii boiska)
      if (m < 300 || m > 750) {
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