import { START_X } from './config.js';
import { player } from './player.js';
import { camera, W, GROUND_Y, distToSegment } from './world.js';

// ==========================================
// PROCEDURALNY SYSTEM PRZESZKÓD WEDŁUG BIOMÓW
// ==========================================

export const obstacles = [];

// Parametry generatora proceduralnego
const SAFE_ZONE_END = START_X + 750; // Pierwsza przeszkoda po ok. 54m (750px)
const SPAWN_AHEAD_BUFFER = 2800;     // Horyzont generowania w przód
const DESPAWN_BEHIND_BUFFER = 1400;  // Dystans usuwania przeszkód za graczem

let lastSpawnX = SAFE_ZONE_END;
let lastType = null;
let consecutiveCount = 0;

/**
 * Zwraca identyfikator biomu na podstawie współrzędnej X (skala 1m = 14px, zmiana co 800m)
 */
export function getBiomeForX(x) {
  const dist = Math.max(0, Math.floor((x - START_X) / 14));
  if (dist < 800) return 0;  // Murawa (0 – 799 m)
  if (dist < 1600) return 1; // Pustynia (800 – 1599 m)
  if (dist < 2400) return 2; // Zima (1600 – 2399 m)
  if (dist < 3200) return 3; // Dżungla (2400 – 3199 m)
  return 4;                  // Piekło (3200 m+)
}

// Zestaw unikalnych przeszkód dedykowanych dla każdego z 5 biomów
const BIOME_OBSTACLE_TYPES = {
  0: ['hydrant', 'bench', 'bin', 'bollard'],
  1: ['cactus', 'desert_rock', 'tumbleweed'],
  2: ['snowman', 'ice_spike', 'snow_drift'],
  3: ['carnivorous_plant', 'fallen_log', 'ancient_totem'],
  4: ['lava_vent', 'bone_spike', 'brimstone_crystal']
};

/**
 * Fabryka przeszkód – tworzy obiekt o konkretnych wymiarach (w, h) i fizyce odbicia
 */
function createObstacle(type, x) {
  // BIOM 0: MURAWA (0 – 799 m)
  if (type === 'hydrant') {
    return {
      type: 'hydrant', x, w: 20, h: 36,
      color: '#e53935', accentColor: '#b71c1c',
      restitution: 0.78, friction: 0.34
    };
  } else if (type === 'bench') {
    return {
      type: 'bench', x, w: 56, h: 24,
      color: '#8d6e63', darkWood: '#5d4037', lightWood: '#a1887f', metalColor: '#263238',
      restitution: 0.62, friction: 0.48
    };
  } else if (type === 'bin') {
    const isGreen = Math.random() > 0.55;
    return {
      type: 'bin', x, w: 22, h: 42,
      color: isGreen ? '#2e7d32' : '#455a64',
      darkColor: isGreen ? '#1b5e20' : '#263238',
      accentColor: isGreen ? '#388e3c' : '#546e7a',
      restitution: 0.70, friction: 0.40
    };
  } else if (type === 'bollard') {
    return {
      type: 'bollard', x, w: 14, h: 32,
      color: '#37474f', stripeColor: '#ffb300',
      restitution: 0.75, friction: 0.35
    };
  }

  // BIOM 1: PUSTYNIA (800 – 1599 m)
  else if (type === 'cactus') {
    return {
      type: 'cactus', x, w: 24, h: 48,
      color: '#2e7d32', lightGreen: '#43a047', darkGreen: '#1b5e20', thornColor: '#fffde7',
      restitution: 0.70, friction: 0.42
    };
  } else if (type === 'desert_rock') {
    return {
      type: 'desert_rock', x, w: 44, h: 26,
      color: '#a1887f', darkColor: '#6d4c41', lightColor: '#d7ccc8', boneColor: '#f5f5f5',
      restitution: 0.60, friction: 0.52
    };
  } else if (type === 'tumbleweed') {
    return {
      type: 'tumbleweed', x, w: 30, h: 30,
      color: '#8d6e63', lightColor: '#bcaaa4', darkColor: '#5d4037',
      restitution: 0.76, friction: 0.38
    };
  } else if (type === 'tomb_urn') {
    return {
      type: 'tomb_urn', x, w: 24, h: 40,
      potteryColor: '#e0cda9', goldColor: '#ffd700', lapisColor: '#0284c7', darkColor: '#a8895e',
      restitution: 0.72, friction: 0.40
    };
  } else if (type === 'pharaoh_block') {
    return {
      type: 'pharaoh_block', x, w: 42, h: 28,
      stoneColor: '#a67c52', darkStone: '#6d4c2b', hieroColor: '#ffd54f', lightEdge: '#d4a373',
      restitution: 0.60, friction: 0.52
    };
  }

  // BIOM 2: ZIMA (1600 – 2399 m)
  else if (type === 'snowman') {
    return {
      type: 'snowman', x, w: 32, h: 46,
      color: '#ffffff', shadowColor: '#b0bec5', carrotColor: '#ff6f00', hatColor: '#263238', scarfColor: '#d32f2f',
      restitution: 0.68, friction: 0.44
    };
  } else if (type === 'ice_spike') {
    return {
      type: 'ice_spike', x, w: 24, h: 40,
      color: 'rgba(129, 212, 250, 0.88)', coreColor: '#e1f5fe', edgeColor: '#ffffff',
      restitution: 0.84, friction: 0.22
    };
  } else if (type === 'snow_drift') {
    return {
      type: 'snow_drift', x, w: 54, h: 22,
      snowColor: '#eceff1', woodColor: '#5d4037', shadowColor: '#90a4ae',
      restitution: 0.58, friction: 0.55
    };
  }

  // BIOM 3: DŻUNGLA (2400 – 3199 m)
  else if (type === 'carnivorous_plant') {
    return {
      type: 'carnivorous_plant', x, w: 30, h: 44,
      stemColor: '#2e7d32', petalColor: '#c2185b', innerColor: '#880e4f', teethColor: '#fff9c4',
      restitution: 0.72, friction: 0.40
    };
  } else if (type === 'fallen_log') {
    return {
      type: 'fallen_log', x, w: 58, h: 22,
      barkColor: '#3e2723', woodColor: '#5d4037', mossColor: '#2e7d32', mushroomColor: '#ff5722',
      restitution: 0.62, friction: 0.50
    };
  } else if (type === 'ancient_totem') {
    return {
      type: 'ancient_totem', x, w: 26, h: 48,
      stoneColor: '#455a64', darkStone: '#263238', runeColor: '#00e676', vineColor: '#2e7d32',
      restitution: 0.65, friction: 0.45
    };
  }

  // BIOM 4: PIEKŁO (3200 m+)
  else if (type === 'lava_vent') {
    return {
      type: 'lava_vent', x, w: 34, h: 36,
      rockColor: '#1a0f0f', lavaColor: '#ff3d00', glowColor: '#ffab00',
      restitution: 0.70, friction: 0.38
    };
  } else if (type === 'bone_spike') {
    return {
      type: 'bone_spike', x, w: 26, h: 44,
      spikeColor: '#212121', bloodColor: '#b71c1c', boneColor: '#cfd8dc',
      restitution: 0.72, friction: 0.36
    };
  } else if (type === 'brimstone_crystal') {
    return {
      type: 'brimstone_crystal', x, w: 28, h: 40,
      basaltColor: '#1b1b1b', sulfurColor: '#ff9100', glowColor: '#ffd600',
      restitution: 0.78, friction: 0.32
    };
  }

  // Domyślny fallback
  return {
    type: 'hydrant', x, w: 20, h: 36,
    color: '#e53935', accentColor: '#b71c1c',
    restitution: 0.75, friction: 0.35
  };
}

/**
 * Wybiera losowy typ przeszkody dopasowany do biomu danej pozycji X
 */
function pickRandomType(x) {
  const biomeId = getBiomeForX(x);
  let types = BIOME_OBSTACLE_TYPES[biomeId] || BIOME_OBSTACLE_TYPES[0];
  if (isInsidePyramidZone(x, 40)) {
    types = ['tomb_urn', 'pharaoh_block', 'desert_rock'];
  }
  let candidate = types[Math.floor(Math.random() * types.length)];

  // Zapobieganie pojawieniu się identycznej przeszkody dwa razy z rzędu
  if (candidate === lastType) {
    consecutiveCount++;
    if (consecutiveCount >= 2) {
      const remaining = types.filter(t => t !== lastType);
      if (remaining.length > 0) {
        candidate = remaining[Math.floor(Math.random() * remaining.length)];
      }
      consecutiveCount = 1;
    }
  } else {
    lastType = candidate;
    consecutiveCount = 1;
  }

  return candidate;
}

/**
 * Oblicza dynamiczny odstęp między przeszkodami w zależności od pokonanego dystansu.
 * Zwiększone odstępy dają graczowi znacznie więcej przestrzeni na bieg, kozłowanie i manewry piłką:
 * - Minimalny odstęp: 650–750 px (ok. 50–55 metrów)
 * - Maksymalny odstęp: 1250–1450 px (ok. 90–105 metrów)
 */
function getDynamicGap(spawnX) {
  const distMeters = Math.max(0, Math.floor((spawnX - START_X) / 14));

  let minGap = 750;
  let maxGap = 1450;

  if (distMeters > 800) {
    minGap = 650;
    maxGap = 1250;
  } else if (distMeters > 200) {
    minGap = 700;
    maxGap = 1350;
  }

  return minGap + Math.random() * (maxGap - minGap);
}

// Strefa stadionu wolna od jakichkolwiek przeszkód: 300 m – 750 m (4200 px – 10500 px)
export const STADIUM_ZONE_MIN_X = 4200;
export const STADIUM_ZONE_MAX_X = 10500;

export function isInsideStadiumZone(x, w = 0) {
  // Przeszkoda nachodzi na strefę stadionu, jeśli jej początek lub koniec mieści się w przedziale
  const distStart = (x - START_X) / 14;
  const distEnd = (x + w - START_X) / 14;
  if ((x + w >= 4150 && x <= 10680) || (distEnd >= 295 && distStart <= 755)) {
    return true;
  }
  return false;
}

// Strefa wewnętrzna Wielkiej Piramidy: 1050 m – 1350 m (14860 px – 19060 px)
export const PYRAMID_ZONE_MIN_X = 14860;
export const PYRAMID_ZONE_MAX_X = 19060;

export function isInsidePyramidZone(x, w = 0) {
  const distStart = (x - START_X) / 14;
  const distEnd = (x + w - START_X) / 14;
  if ((x + w >= 14820 && x <= 19100) || (distEnd >= 1048 && distStart <= 1352)) {
    return true;
  }
  return false;
}

/**
 * Aktualizuje stan proceduralnego generowania przeszkód przed graczem i piłką
 */
export function updateProceduralObstacles(focusX) {
  if (focusX < lastSpawnX - 4500) {
    resetObstacles();
    return;
  }

  const targetAheadX = focusX + SPAWN_AHEAD_BUFFER;

  while (lastSpawnX < targetAheadX) {
    const gap = getDynamicGap(lastSpawnX);
    lastSpawnX += gap;

    // Całkowite wykluczenie przeszkód wewnątrz stadionu (300 m – 750 m, od 4200 px do 10500 px)
    if (isInsideStadiumZone(lastSpawnX, 60)) {
      continue;
    }

    const type = pickRandomType(lastSpawnX);
    const obs = createObstacle(type, lastSpawnX);
    obstacles.push(obs);
  }

  // Zabezpieczenie: gwarancja braku jakichkolwiek obiektów kolizyjnych wewnątrz stadionu
  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (isInsideStadiumZone(obstacles[i].x, obstacles[i].w)) {
      obstacles.splice(i, 1);
    }
  }

  const despawnThreshold = focusX - DESPAWN_BEHIND_BUFFER;
  while (obstacles.length > 0 && (obstacles[0].x + obstacles[0].w) < despawnThreshold) {
    obstacles.shift();
  }
}

// ==========================================
// SYSTEM PRZESZKÓD POWIETRZNYCH (PTAKI BIOMÓW)
// ==========================================

export const birds = [];

// 3 PRECYZYJNE PUŁAPY WYSOKOŚCI WZGLĘDEM GROUND_Y:
// - Poziom 1 (Niski): GROUND_Y - 55 px (wślizg / niskie podcięcie pod ptakiem)
// - Poziom 2 (Średni): GROUND_Y - 120 px (wysokość skoku gracza / średnia parabola)
// - Poziom 3 (Wysoki): GROUND_Y - 200 px (strefa mocnych wykopów / lobów)
export const BIRD_ALTITUDES_OFFSETS = [55, 120, 200];

export const BIRD_ALTITUDES = [
  GROUND_Y - 55,   // Niski
  GROUND_Y - 120,  // Średni
  GROUND_Y - 200   // Wysoki
];

export function getBirdAltitudes(gy = GROUND_Y) {
  const g = (typeof gy !== 'undefined' && gy !== null) ? gy : GROUND_Y;
  return [
    g - 55,   // Niski
    g - 120,  // Średni
    g - 200   // Wysoki
  ];
}

const BIOME_BIRD_TYPES = {
  0: 'crow',      // Murawa i Stadion: Wrona drapieżna / Jastrząb miejski
  1: 'vulture',   // Pustynia: Sęp pustynny / Jastrząb pustynny
  2: 'snow_owl',  // Zima: Sowa śnieżna drapieżna
  3: 'parrot',    // Dżungla: Papuga Ara
  4: 'hell_bat'   // Piekło: Piekielny nietoperz
};

export function getBirdTypeForX(x) {
  const biomeId = getBiomeForX(x);
  return BIOME_BIRD_TYPES[biomeId] || 'crow';
}

// ==========================================
// SYSTEM CZĄSTECZEK EKSPLOZJI PIÓR I PUCHU
// ==========================================

export const birdFeatherParticles = [];
export const birdPuffParticles = [];
export const birdSparkParticles = [];
export const birdShockwaves = [];
export const birdPopups = [];

const BIRD_FEATHER_PALETTES = {
  crow: {
    feathers: ['#0f172a', '#1e293b', '#334155', '#475569', '#1e1b4b', '#0369a1'],
    highlights: ['#38bdf8', '#64748b', '#94a3b8', null],
    puffs: ['rgba(30, 41, 59, 0.75)', 'rgba(71, 85, 105, 0.65)', 'rgba(148, 163, 184, 0.55)'],
    sparks: ['#38bdf8', '#f8fafc', '#94a3b8'],
    quill: '#000000'
  },
  pigeon: {
    feathers: ['#0f172a', '#1e293b', '#334155', '#475569', '#1e1b4b', '#0369a1'],
    highlights: ['#38bdf8', '#64748b', '#94a3b8', null],
    puffs: ['rgba(30, 41, 59, 0.75)', 'rgba(71, 85, 105, 0.65)', 'rgba(148, 163, 184, 0.55)'],
    sparks: ['#38bdf8', '#f8fafc', '#94a3b8'],
    quill: '#000000'
  },
  vulture: {
    feathers: ['#292524', '#44403c', '#57534e', '#78716c', '#d6d3d1', '#fef08a'],
    highlights: ['#a8a29e', '#fde047', null],
    puffs: ['rgba(68, 64, 60, 0.75)', 'rgba(168, 162, 158, 0.65)', 'rgba(214, 211, 209, 0.55)'],
    sparks: ['#facc15', '#fef08a', '#e7e5e4'],
    quill: '#1c1917'
  },
  snow_owl: {
    feathers: ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#64748b'],
    highlights: ['#ffffff', '#e0f2fe', null],
    puffs: ['rgba(255, 255, 255, 0.9)', 'rgba(241, 245, 249, 0.8)', 'rgba(226, 232, 240, 0.65)'],
    sparks: ['#ffffff', '#fbbf24', '#38bdf8'],
    quill: '#94a3b8'
  },
  parrot: {
    feathers: ['#ef4444', '#dc2626', '#facc15', '#eab308', '#2563eb', '#1d4ed8', '#10b981'],
    highlights: ['#fef08a', '#93c5fd', '#fca5a5', null],
    puffs: ['rgba(239, 68, 68, 0.75)', 'rgba(250, 204, 21, 0.75)', 'rgba(37, 99, 235, 0.75)'],
    sparks: ['#fde047', '#f87171', '#60a5fa'],
    quill: '#7f1d1d'
  },
  hell_bat: {
    feathers: ['#881337', '#4c0519', '#e11d48', '#ff0055', '#ea580c', '#18181b'],
    highlights: ['#fb923c', '#fda4af', null],
    puffs: ['rgba(136, 19, 55, 0.8)', 'rgba(234, 88, 12, 0.75)', 'rgba(24, 24, 27, 0.75)'],
    sparks: ['#ff0055', '#fb923c', '#fef08a'],
    quill: '#27040d'
  }
};

/**
 * Generuje widowiskową eksplozję piór, puchu, iskier i fali uderzeniowej przy trafieniu piłką
 */
export function createBirdExplosion(x, y, birdType = 'crow', impactVx = 0, impactVy = 0) {
  const palette = BIRD_FEATHER_PALETTES[birdType] || BIRD_FEATHER_PALETTES.crow;

  // 1. Chmura wirujących piór (Feathers) — 22 do 28 cząsteczek
  const featherCount = 22 + Math.floor(Math.random() * 7);
  for (let i = 0; i < featherCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.4 + Math.random() * 6.8;
    const col = palette.feathers[Math.floor(Math.random() * palette.feathers.length)];
    const hl = palette.highlights[Math.floor(Math.random() * palette.highlights.length)];

    birdFeatherParticles.push({
      x: x + (Math.random() - 0.5) * 14,
      y: y + (Math.random() - 0.5) * 14,
      vx: Math.cos(angle) * speed + impactVx * 0.28,
      vy: Math.sin(angle) * speed + impactVy * 0.28 - 1.4,
      len: 9 + Math.random() * 10,
      w: 3.5 + Math.random() * 2.5,
      color: col,
      highlightColor: hl,
      quillColor: palette.quill,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.24,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.08 + Math.random() * 0.08,
      swayAmp: 1.0 + Math.random() * 1.5,
      gravity: 0.07 + Math.random() * 0.05,
      drag: 0.94,
      life: 1.0,
      decay: 1 / (45 + Math.random() * 35)
    });
  }

  // 2. Chmura puchu / obłoczek uderzenia (Puffs) — 12 do 16 cząsteczek
  const puffCount = 12 + Math.floor(Math.random() * 5);
  for (let i = 0; i < puffCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.0 + Math.random() * 3.8;
    const col = palette.puffs[Math.floor(Math.random() * palette.puffs.length)];

    birdPuffParticles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed + impactVx * 0.16,
      vy: Math.sin(angle) * speed + impactVy * 0.16 - 0.8,
      radius: 5 + Math.random() * 5,
      maxRadius: 18 + Math.random() * 12,
      growth: 0.42 + Math.random() * 0.25,
      color: col,
      life: 1.0,
      decay: 1 / (26 + Math.random() * 16)
    });
  }

  // 3. Iskry kinetyczne / drobne odłamki (Sparks) — 12 do 18 cząsteczek
  const sparkCount = 12 + Math.floor(Math.random() * 7);
  for (let i = 0; i < sparkCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4.5 + Math.random() * 8.5;
    const col = palette.sparks[Math.floor(Math.random() * palette.sparks.length)];

    birdSparkParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed + impactVx * 0.35,
      vy: Math.sin(angle) * speed + impactVy * 0.35 - 1.0,
      len: 7 + Math.random() * 9,
      color: col,
      life: 1.0,
      decay: 1 / (14 + Math.random() * 10)
    });
  }

  // 4. Pierścień uderzeniowy / fala uderzeniowa (Shockwave)
  birdShockwaves.push({
    x,
    y,
    radius: 7,
    maxRadius: 44,
    growth: 3.2,
    alpha: 0.88,
    decay: 0.055,
    color: '#ffffff'
  });

  // 5. Stylizowany arcade popup tekstowy
  const popups = ['BIRD STRIKE! 🪶', 'DIRECT HIT! 💥', 'AERIAL SMASH! 🎯'];
  const text = popups[Math.floor(Math.random() * popups.length)];
  birdPopups.push({
    x,
    y: y - 10,
    text,
    color: '#fef08a',
    scale: 0.6,
    targetScale: 1.25,
    alpha: 1.0,
    life: 42
  });
}

/**
 * Tworzy mniejszy obłoczek piórek (np. przy potrąceniu ptaka przez biegnącego gracza)
 */
export function createBirdFeatherPuff(x, y, birdType = 'crow', count = 8) {
  const palette = BIRD_FEATHER_PALETTES[birdType] || BIRD_FEATHER_PALETTES.crow;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.8 + Math.random() * 3.5;
    const col = palette.feathers[Math.floor(Math.random() * palette.feathers.length)];
    const hl = palette.highlights[Math.floor(Math.random() * palette.highlights.length)];

    birdFeatherParticles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.2,
      len: 8 + Math.random() * 7,
      w: 3.0 + Math.random() * 2.0,
      color: col,
      highlightColor: hl,
      quillColor: palette.quill,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.08 + Math.random() * 0.08,
      swayAmp: 1.0 + Math.random() * 1.2,
      gravity: 0.08,
      drag: 0.94,
      life: 1.0,
      decay: 1 / (35 + Math.random() * 25)
    });
  }
}

/**
 * Aktualizacja fizyki cząsteczek eksplozji ptaków
 */
export function updateBirdParticles() {
  const gy = (typeof GROUND_Y !== 'undefined' ? GROUND_Y : 500);

  // 1. Pióra
  for (let i = birdFeatherParticles.length - 1; i >= 0; i--) {
    const f = birdFeatherParticles[i];
    f.x += f.vx;
    f.y += f.vy;
    f.vx *= f.drag;
    f.vy = (f.vy + f.gravity) * f.drag;

    f.swayPhase += f.swaySpeed;
    f.x += Math.sin(f.swayPhase) * f.swayAmp;
    f.rot += f.rotSpeed;
    f.life -= f.decay;

    if (f.y >= gy) {
      f.y = gy;
      f.vx *= 0.65;
      f.vy = 0;
      f.decay *= 1.8;
    }

    if (f.life <= 0) {
      birdFeatherParticles.splice(i, 1);
    }
  }

  // 2. Chmury puchu
  for (let i = birdPuffParticles.length - 1; i >= 0; i--) {
    const p = birdPuffParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.91;
    p.vy *= 0.91;
    p.radius = Math.min(p.maxRadius, p.radius + p.growth);
    p.life -= p.decay;

    if (p.life <= 0) {
      birdPuffParticles.splice(i, 1);
    }
  }

  // 3. Iskry kinetyczne
  for (let i = birdSparkParticles.length - 1; i >= 0; i--) {
    const s = birdSparkParticles[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vx *= 0.88;
    s.vy *= 0.88;
    s.life -= s.decay;

    if (s.life <= 0) {
      birdSparkParticles.splice(i, 1);
    }
  }

  // 4. Pierścienie fal uderzeniowych
  for (let i = birdShockwaves.length - 1; i >= 0; i--) {
    const sw = birdShockwaves[i];
    sw.radius += sw.growth;
    sw.alpha -= sw.decay;

    if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
      birdShockwaves.splice(i, 1);
    }
  }

  // 5. Popupy tekstowe
  for (let i = birdPopups.length - 1; i >= 0; i--) {
    const pop = birdPopups[i];
    pop.y -= 0.65;
    pop.scale += (pop.targetScale - pop.scale) * 0.15;
    pop.life--;
    if (pop.life < 15) {
      pop.alpha = pop.life / 15;
    }
    if (pop.life <= 0) {
      birdPopups.splice(i, 1);
    }
  }
}

/**
 * Renderuje pojedyncze realistyczne piórko z chorągiewką, stosiną i światłocieniem
 */
function drawSingleFeather(ctx, f) {
  const len = f.len;
  const w = f.w;
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.rotate(f.rot);
  ctx.globalAlpha = Math.max(0, Math.min(1, f.life));

  // Chorągiewka pióra
  ctx.fillStyle = f.color;
  ctx.beginPath();
  ctx.moveTo(0, -len * 0.5);
  ctx.bezierCurveTo(w * 0.7, -len * 0.25, w, len * 0.2, 0, len * 0.5);
  ctx.bezierCurveTo(-w, len * 0.2, -w * 0.7, -len * 0.25, 0, -len * 0.5);
  ctx.closePath();
  ctx.fill();

  // Rozświetlenie jednej strony piórka dla głębi 3D
  if (f.highlightColor) {
    ctx.fillStyle = f.highlightColor;
    ctx.beginPath();
    ctx.moveTo(0, -len * 0.5);
    ctx.bezierCurveTo(w * 0.35, -len * 0.25, w * 0.5, len * 0.2, 0, len * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  // Oś pióra (stosina / quill)
  ctx.strokeStyle = f.quillColor || 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(0, -len * 0.5);
  ctx.lineTo(0, len * 0.55);
  ctx.stroke();

  ctx.restore();
}

/**
 * Rysuje wszystkie aktywne cząsteczki eksplozji ptaków
 */
export function drawBirdParticles(ctx) {
  // 1. Shockwaves
  for (let i = 0; i < birdShockwaves.length; i++) {
    const sw = birdShockwaves[i];
    ctx.save();
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = Math.max(1, 3.5 * sw.alpha);
    ctx.globalAlpha = Math.max(0, Math.min(1, sw.alpha));
    ctx.stroke();
    ctx.restore();
  }

  // 2. Chmury puchu
  for (let i = 0; i < birdPuffParticles.length; i++) {
    const p = birdPuffParticles[i];
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 0.6));
    ctx.fill();
    ctx.restore();
  }

  // 3. Kinetic sparks
  for (let i = 0; i < birdSparkParticles.length; i++) {
    const s = birdSparkParticles[i];
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.vx * 1.8, s.y - s.vy * 1.8);
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.globalAlpha = Math.max(0, Math.min(1, s.life));
    ctx.stroke();
    ctx.restore();
  }

  // 4. Pióra
  for (let i = 0; i < birdFeatherParticles.length; i++) {
    const f = birdFeatherParticles[i];
    drawSingleFeather(ctx, f);
  }

  // 5. Popupy tekstowe (BIRD STRIKE!)
  for (let i = 0; i < birdPopups.length; i++) {
    const pop = birdPopups[i];
    ctx.save();
    ctx.translate(pop.x, pop.y);
    ctx.scale(pop.scale, pop.scale);
    ctx.globalAlpha = Math.max(0, Math.min(1, pop.alpha));
    ctx.font = '900 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillText(pop.text, 1.5, 1.5);
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, 0, 0);
    ctx.restore();
  }
}

let lastBirdSpawnX = START_X + 1400; // Pierwszy ptak po ok. 100m

/**
 * Fabryka ptaków – tworzy dynamiczną przeszkodę powietrzną na 1 z 3 zdefiniowanych pułapów
 */
export function createBird(x, groundY = (typeof GROUND_Y !== 'undefined' ? GROUND_Y : 500)) {
  const gy = (typeof groundY !== 'undefined' && groundY !== null) ? groundY : (typeof GROUND_Y !== 'undefined' ? GROUND_Y : 500);
  const type = getBirdTypeForX(x);

  // 3 zdefiniowane poziomy wysokości (Niski: gy - 55, Średni: gy - 120, Wysoki: gy - 200)
  const altitudes = getBirdAltitudes(gy);
  const altitudeIndex = Math.floor(Math.random() * altitudes.length);
  const baseAltitudeY = altitudes[altitudeIndex];
  const altitudeOffset = BIRD_ALTITUDES_OFFSETS[altitudeIndex];

  // Zwiększony rozmiar sylwetki o ok. 50%–70% (rozpiętość skrzydeł ~44 px, radius = 18 px)
  const w = 44;
  const h = 28;
  const radius = 18;

  // Prędkość przelotu naprzeciw graczowi: vx = -(3.2 + Math.random() * 1.8) px/klatkę
  const vx = -(3.2 + Math.random() * 1.8);
  const phase = Math.random() * Math.PI * 2;
  const y = baseAltitudeY - h / 2;

  return {
    type,
    x,
    y,
    w,
    h,
    radius,
    baseAltitude: altitudeOffset,
    altitudeLevel: altitudeIndex, // 0: Niski, 1: Średni, 2: Wysoki
    phase,
    vx,
    vy: 0,
    restitution: 0.88,
    friction: 0.35,
    hitReaction: 0
  };
}

/**
 * Aktualizuje ruch, animacje falowe i proceduralne generowanie ptaków
 */
export function updateProceduralBirds(focusX, groundY) {
  const gy = (typeof groundY !== 'undefined' && groundY !== null) ? groundY : (typeof GROUND_Y !== 'undefined' ? GROUND_Y : 500);

  if (focusX < lastBirdSpawnX - 6000) {
    resetBirds();
    return;
  }

  // 1. Ruch poziomy i naturalna oscylacja wysokości w locie za pomocą funkcji falowej
  for (let i = 0; i < birds.length; i++) {
    const b = birds[i];
    b.x += b.vx;

    // Naturalna, delikatna oscylacja wysokości w locie za pomocą funkcji falowej:
    // y += Math.sin(bird.phase) * 0.6; bird.phase += 0.08;
    b.y += Math.sin(b.phase) * 0.6;
    b.phase += 0.08;

    // Subtelna stabilizacja wokół zadanego pułapu
    if (b.vy) {
      b.y += b.vy;
      b.vy *= 0.92;
    } else {
      const targetY = gy - b.baseAltitude - b.h / 2;
      b.y += (targetY - b.y) * 0.015;
    }

    if (b.hitReaction > 0) {
      b.hitReaction--;
    }
  }

  // 2. Generowanie nowych ptaków w przód (regularne, zbalansowane odstępy co ok. 85 - 150m)
  const targetAheadX = focusX + SPAWN_AHEAD_BUFFER;
  while (lastBirdSpawnX < targetAheadX) {
    const birdGap = 1200 + Math.random() * 900;
    lastBirdSpawnX += birdGap;

    // Całkowite wykluczenie ptaków wyłącznie wewnątrz zamkniętej Piramidy (1050 m – 1350 m)
    if (isInsidePyramidZone(lastBirdSpawnX, 40)) {
      continue;
    }

    const bird = createBird(lastBirdSpawnX, gy);
    birds.push(bird);
  }

  // 3. Usuwanie ptaków, które mogły znaleźć się wewnątrz zamkniętej piramidy
  for (let i = birds.length - 1; i >= 0; i--) {
    if (isInsidePyramidZone(birds[i].x, birds[i].w)) {
      birds.splice(i, 1);
    }
  }

  // 4. Usuwanie ptaków, które odleciały daleko za gracza
  const despawnThreshold = focusX - DESPAWN_BEHIND_BUFFER;
  while (birds.length > 0 && (birds[0].x + birds[0].w) < despawnThreshold) {
    birds.shift();
  }

  // 5. Aktualizacja cząsteczek eksplozji i piór
  updateBirdParticles();
}

export function resetBirds() {
  birds.length = 0;
  birdFeatherParticles.length = 0;
  birdPuffParticles.length = 0;
  birdSparkParticles.length = 0;
  birdShockwaves.length = 0;
  birdPopups.length = 0;
  lastBirdSpawnX = START_X + 1400;
}

/**
 * Resetuje stan generatora i tworzy początkowy zestaw przeszkód naziemnych oraz powietrznych
 */
export function resetObstacles() {
  obstacles.length = 0;
  lastSpawnX = SAFE_ZONE_END;
  lastType = null;
  consecutiveCount = 0;

  const firstType = pickRandomType(lastSpawnX);
  if (!isInsideStadiumZone(lastSpawnX, 60)) {
    obstacles.push(createObstacle(firstType, lastSpawnX));
  }
  updateProceduralObstacles(START_X);
  resetBirds();
  const gy = typeof GROUND_Y !== 'undefined' ? GROUND_Y : 500;
  updateProceduralBirds(START_X, gy);
}

resetObstacles();

// ==========================================
// KOLIZJE FIZYCZNE Z PRZESZKODAMI
// ==========================================

export function resolveBoxCollision(b, boxX, boxY, boxW, boxH, restitution = 0.72, friction = 0.38) {
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
      const bottomDist = Math.abs(b.y - (boxY + boxH));
      const minD = Math.min(leftDist, rightDist, topDist, bottomDist);
      if (minD === topDist) { nx = 0; ny = -1; }
      else if (minD === bottomDist) { nx = 0; ny = 1; }
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
  if (!ball) return;

  const px = (typeof player !== 'undefined' && player) ? player.x : START_X;
  const focusX = Math.max(px, ball.x);

  updateProceduralObstacles(focusX);
  updateProceduralBirds(focusX, GROUND_Y);

  // 1. Kolizje z przeszkodami naziemnymi
  for (let i = 0; i < obstacles.length; i++) {
    const obs = obstacles[i];
    if (isInsideStadiumZone(obs.x, obs.w)) continue;
    const obsY = GROUND_Y - obs.h;
    if (Math.abs(ball.x - (obs.x + obs.w / 2)) < obs.w + 60) {
      resolveBoxCollision(
        ball,
        obs.x,
        obsY,
        obs.w,
        obs.h,
        obs.restitution ?? 0.72,
        obs.friction ?? 0.38
      );
    }
  }

  // 2. Kolizje z przeszkodami powietrznymi (ptaki biomów)
  for (let i = 0; i < birds.length; i++) {
    const bird = birds[i];
    if (isInsidePyramidZone(bird.x, bird.w)) continue;

    const cx = bird.x + bird.w / 2;
    const cy = bird.y + bird.h / 2;
    const birdRadius = bird.radius || 18;
    const combinedRadius = (ball.radius || 12) + birdRadius;

    // A. Kolizja bezpośrednia piłki z ptakiem (z CCD anti-tunneling dla mocnych wykopów)
    const dx = ball.x - cx;
    const dy = ball.y - cy;
    const curDist = Math.hypot(dx, dy);

    let isHit = (curDist < combinedRadius);

    if (!isHit && (Math.abs(ball.vx) > 7 || Math.abs(ball.vy) > 7)) {
      const prevX = ball.x - ball.vx;
      const prevY = ball.y - ball.vy;
      const seg = distToSegment(cx, cy, prevX, prevY, ball.x, ball.y);
      if (seg.dist < combinedRadius) {
        isHit = true;
      }
    }

    if (isHit) {
      // 1. Obliczenie znormalizowanego wektora odbicia
      const dist = Math.hypot(dx, dy) || 1;
      const nx = dist > 0 ? dx / dist : (ball.vx > 0 ? 1 : -1);
      const ny = dist > 0 ? dy / dist : -0.7;
      const nLen = Math.hypot(nx, ny) || 1;
      const normX = nx / nLen;
      const normY = ny / nLen;

      // 2. Korekta pozycji piłki (wypchnięcie poza promień kolizji)
      ball.x = cx + normX * (combinedRadius + 2);
      ball.y = cy + normY * (combinedRadius + 2);

      // 3. Sprężyste odbicie fizyczne piłki
      const dot = ball.vx * normX + ball.vy * normY;
      if (dot < 0) {
        const restitution = bird.restitution ?? 0.88;
        ball.vx = ball.vx - (1 + restitution) * dot * normX;
        ball.vy = ball.vy - (1 + restitution) * dot * normY;
      }

      // Impuls kinetyczny od prędkości ptaka i zderzenia
      ball.vx += bird.vx * 0.35 + normX * 2.2;
      ball.vy += normY * 2.5;
      ball.spin += (Math.random() - 0.5) * 0.85;

      // 4. WIDOWISKOWA EKSPLOZJA CHMURY PIÓR I CZĄSTECZEK
      createBirdExplosion(cx, cy, bird.type, ball.vx, ball.vy);

      // 5. Usunięcie zestrzelonego ptaka z przestrzeni powietrznej
      birds.splice(i, 1);
      i--;
      continue;
    }

    // B. Interakcja ptaka z graczem
    if (player && !player.isIntro) {
      const playerBoxX = player.x;
      const playerBoxW = player.w;
      // Podczas wślizgu wysokość gracza to zaledwie 20px (ślizga się pod ptakiem na poziomie 1)
      const playerBoxH = player.isSliding ? 20 : player.h;
      const playerBoxY = player.isSliding ? (GROUND_Y - 20) : (player.y || GROUND_Y - player.h);

      const closestX = Math.max(playerBoxX, Math.min(cx, playerBoxX + playerBoxW));
      const closestY = Math.max(playerBoxY, Math.min(cy, playerBoxY + playerBoxH));
      const pDist = Math.hypot(cx - closestX, cy - closestY);

      if (pDist < birdRadius + 2) {
        if (player.kickState === 'SWING') {
          // Wykop bezpośrednio z nogi trafia w ptaka!
          createBirdExplosion(cx, cy, bird.type, player.facing * 9, -5);
          birds.splice(i, 1);
          i--;
          continue;
        } else if (!player.isSliding) {
          // Gracz wyprostowany wpada na ptaka
          createBirdFeatherPuff(cx, cy, bird.type, 8);
          bird.hitReaction = 24;
          bird.vx = -7;
          bird.vy = -6; // Ptak gwałtownie ucieka w górę
          player.vx *= 0.65; // Chwilowe wytracenie pędu biegu
        }
      }
    }
  }
}

// ==========================================
// RENDEROWANIE PRZESZKÓD WEDŁUG BIOMU
// ==========================================

export function drawObstacles(ctx, GROUND_Y) {
  const viewLeft = camera ? camera.x - (W / camera.zoom) - 80 : -Infinity;
  const viewRight = camera ? camera.x + (W / camera.zoom) * 2 + 80 : Infinity;

  for (let i = 0; i < obstacles.length; i++) {
    const obs = obstacles[i];
    if (isInsideStadiumZone(obs.x, obs.w)) continue;

    if (obs.x + obs.w < viewLeft || obs.x > viewRight) {
      continue;
    }

    const oy = GROUND_Y - obs.h;

    // Cień na podłożu
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(obs.x + obs.w / 2, GROUND_Y + 1, obs.w / 2 + 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // ----------------------------------------------------
    // BIOM 0: MURAWA (hydrant, bench, bin, bollard)
    // ----------------------------------------------------
    if (obs.type === 'bench') {
      ctx.fillStyle = obs.metalColor;
      ctx.fillRect(obs.x + 5, GROUND_Y - 11, 6, 11);
      ctx.fillRect(obs.x + obs.w - 11, GROUND_Y - 11, 6, 11);
      ctx.fillRect(obs.x + 3, GROUND_Y - 2, 10, 2);
      ctx.fillRect(obs.x + obs.w - 13, GROUND_Y - 2, 10, 2);
      ctx.fillRect(obs.x + 7, oy - 15, 4, 16);
      ctx.fillRect(obs.x + obs.w - 11, oy - 15, 4, 16);

      ctx.fillStyle = obs.color;
      ctx.fillRect(obs.x, oy, obs.w, 10);
      ctx.fillStyle = obs.lightWood;
      ctx.fillRect(obs.x, oy, obs.w, 2);
      ctx.fillStyle = obs.darkWood;
      ctx.fillRect(obs.x, oy + 8, obs.w, 2);

      ctx.fillStyle = obs.color;
      ctx.fillRect(obs.x, oy - 15, obs.w, 7);
      ctx.fillStyle = obs.lightWood;
      ctx.fillRect(obs.x, oy - 15, obs.w, 2);
      ctx.fillStyle = obs.darkWood;
      ctx.fillRect(obs.x, oy - 10, obs.w, 2);

      ctx.fillStyle = '#cfd8dc';
      ctx.fillRect(obs.x + 7, oy + 4, 2, 2);
      ctx.fillRect(obs.x + obs.w - 9, oy + 4, 2, 2);
      ctx.fillRect(obs.x + 7, oy - 13, 2, 2);
      ctx.fillRect(obs.x + obs.w - 9, oy - 13, 2, 2);

    } else if (obs.type === 'hydrant') {
      ctx.fillStyle = obs.accentColor;
      ctx.fillRect(obs.x - 2, GROUND_Y - 4, obs.w + 4, 4);

      ctx.fillStyle = obs.color;
      ctx.fillRect(obs.x, oy + 8, obs.w, obs.h - 12);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.fillRect(obs.x + 3, oy + 9, 3, obs.h - 14);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fillRect(obs.x + obs.w - 4, oy + 9, 4, obs.h - 14);

      ctx.fillStyle = obs.color;
      ctx.beginPath();
      ctx.arc(obs.x + obs.w / 2, oy + 9, obs.w / 2, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = '#ffb300';
      ctx.fillRect(obs.x + obs.w / 2 - 2.5, oy - 2, 5, 4);

      ctx.fillStyle = obs.accentColor;
      ctx.fillRect(obs.x - 4, oy + 15, 4, 7);
      ctx.fillRect(obs.x + obs.w, oy + 15, 4, 7);
      ctx.fillStyle = '#b0bec5';
      ctx.fillRect(obs.x - 5, oy + 17, 2, 3);
      ctx.fillRect(obs.x + obs.w + 3, oy + 17, 2, 3);

      ctx.fillStyle = obs.accentColor;
      ctx.beginPath();
      ctx.arc(obs.x + obs.w / 2, oy + 20, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b0bec5';
      ctx.fillRect(obs.x + obs.w / 2 - 1.5, oy + 18.5, 3, 3);

    } else if (obs.type === 'bin') {
      ctx.fillStyle = '#263238';
      ctx.fillRect(obs.x + obs.w / 2 - 2, GROUND_Y - 6, 4, 6);
      ctx.fillRect(obs.x + obs.w / 2 - 6, GROUND_Y - 2, 12, 2);

      ctx.fillStyle = obs.color;
      ctx.fillRect(obs.x, oy + 12, obs.w, obs.h - 18);

      ctx.fillStyle = obs.darkColor;
      ctx.fillRect(obs.x + 2, oy + 17, obs.w - 4, 2);
      ctx.fillRect(obs.x + 2, oy + 24, obs.w - 4, 2);
      ctx.fillRect(obs.x + 2, oy + 31, obs.w - 4, 2);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(obs.x + 2, oy + 13, 3, obs.h - 20);

      ctx.fillStyle = '#101418';
      ctx.fillRect(obs.x + 2, oy + 4, obs.w - 4, 8);

      ctx.fillStyle = obs.darkColor;
      ctx.fillRect(obs.x - 2, oy, obs.w + 4, 5);
      ctx.fillStyle = obs.accentColor;
      ctx.fillRect(obs.x - 2, oy, obs.w + 4, 2);

      ctx.fillStyle = '#37474f';
      ctx.fillRect(obs.x - 1, oy + 4, 3, 8);
      ctx.fillRect(obs.x + obs.w - 2, oy + 4, 3, 8);

    } else if (obs.type === 'bollard') {
      ctx.fillStyle = '#212121';
      ctx.fillRect(obs.x - 2, GROUND_Y - 3, obs.w + 4, 3);

      ctx.fillStyle = obs.color;
      ctx.fillRect(obs.x, oy + 4, obs.w, obs.h - 4);

      ctx.beginPath();
      ctx.arc(obs.x + obs.w / 2, oy + 5, obs.w / 2, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = obs.stripeColor;
      ctx.fillRect(obs.x, oy + 8, obs.w, 7);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.fillRect(obs.x + 2, oy + 4, 2, obs.h - 6);

    // ----------------------------------------------------
    // BIOM 1: PUSTYNIA (cactus, desert_rock, tumbleweed)
    // ----------------------------------------------------
    } else if (obs.type === 'cactus') {
      const stemX = obs.x + 7;
      const stemW = 10;

      // Prawy konar kaktusa
      ctx.fillStyle = obs.color;
      ctx.fillRect(stemX + stemW, oy + 16, 7, 6);
      ctx.fillRect(stemX + stemW + 2, oy + 4, 6, 14);
      ctx.beginPath();
      ctx.arc(stemX + stemW + 5, oy + 4, 3, Math.PI, 0);
      ctx.fill();

      // Lewy konar kaktusa
      ctx.fillRect(stemX - 7, oy + 24, 7, 6);
      ctx.fillRect(stemX - 8, oy + 12, 6, 14);
      ctx.beginPath();
      ctx.arc(stemX - 5, oy + 12, 3, Math.PI, 0);
      ctx.fill();

      // Główny pień kaktusa
      ctx.fillRect(stemX, oy + 5, stemW, obs.h - 5);
      ctx.beginPath();
      ctx.arc(stemX + stemW / 2, oy + 5, stemW / 2, Math.PI, 0);
      ctx.fill();

      // Żebrowanie i kolce
      ctx.fillStyle = obs.lightGreen;
      ctx.fillRect(stemX + 2, oy + 5, 2, obs.h - 6);
      ctx.fillStyle = obs.darkGreen;
      ctx.fillRect(stemX + 6, oy + 5, 2, obs.h - 6);

      ctx.fillStyle = obs.thornColor;
      for (let ty = oy + 10; ty < GROUND_Y - 4; ty += 9) {
        ctx.fillRect(stemX - 2, ty, 2, 2);
        ctx.fillRect(stemX + stemW, ty + 4, 2, 2);
      }

    } else if (obs.type === 'desert_rock') {
      // Skalny głaz pustynny
      ctx.fillStyle = obs.color;
      ctx.beginPath();
      ctx.moveTo(obs.x + 2, GROUND_Y);
      ctx.lineTo(obs.x + 6, oy + 10);
      ctx.lineTo(obs.x + 16, oy + 3);
      ctx.lineTo(obs.x + 30, oy + 7);
      ctx.lineTo(obs.x + obs.w - 2, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Fasetowanie skały
      ctx.fillStyle = obs.lightColor;
      ctx.beginPath();
      ctx.moveTo(obs.x + 6, oy + 10);
      ctx.lineTo(obs.x + 16, oy + 3);
      ctx.lineTo(obs.x + 22, oy + 14);
      ctx.lineTo(obs.x + 10, oy + 18);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = obs.darkColor;
      ctx.beginPath();
      ctx.moveTo(obs.x + 16, oy + 3);
      ctx.lineTo(obs.x + 30, oy + 7);
      ctx.lineTo(obs.x + obs.w - 2, GROUND_Y);
      ctx.lineTo(obs.x + 24, oy + 16);
      ctx.closePath();
      ctx.fill();

      // Czaszka zwierzęca obok skały
      ctx.fillStyle = obs.boneColor;
      ctx.beginPath();
      ctx.arc(obs.x + 10, GROUND_Y - 7, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#424242';
      ctx.fillRect(obs.x + 8, GROUND_Y - 8, 2, 2);
      ctx.fillRect(obs.x + 11, GROUND_Y - 8, 2, 2);

    } else if (obs.type === 'tumbleweed') {
      const cx = obs.x + obs.w / 2;
      const cy = oy + obs.h / 2;
      const r = obs.w / 2 - 2;

      ctx.strokeStyle = obs.color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx - 3, cy + 2, r * 0.7, 0, Math.PI * 2);
      ctx.arc(cx + 3, cy - 2, r * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = obs.darkColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy + 3);
      ctx.moveTo(cx - 4, cy - r); ctx.lineTo(cx + 4, cy + r);
      ctx.moveTo(cx - r * 0.7, cy - r * 0.7); ctx.lineTo(cx + r * 0.7, cy + r * 0.7);
      ctx.stroke();

    } else if (obs.type === 'tomb_urn') {
      // Starożytna alabastrowa urna kanopska ze złotym wiekiem i zdobieniem
      const ux = obs.x + 2;
      const uw = obs.w - 4;
      // Cokół urny
      ctx.fillStyle = obs.darkColor;
      ctx.fillRect(ux + 2, GROUND_Y - 4, uw - 4, 4);
      // Brzuch urny (alabastrowy korpus)
      ctx.fillStyle = obs.potteryColor;
      ctx.beginPath();
      ctx.moveTo(ux + 3, GROUND_Y - 4);
      ctx.bezierCurveTo(ux - 3, oy + 16, ux + uw + 3, oy + 16, ux + uw - 3, GROUND_Y - 4);
      ctx.closePath();
      ctx.fill();
      // Ozdobne pasy lazurytu i złota
      ctx.fillStyle = obs.lapisColor;
      ctx.fillRect(ux + 2, oy + 20, uw - 4, 3);
      ctx.fillStyle = obs.goldColor;
      ctx.fillRect(ux + 3, oy + 23, uw - 6, 2);
      ctx.fillRect(ux + 4, oy + 15, uw - 8, 2);
      // Szyjka urny
      ctx.fillStyle = obs.potteryColor;
      ctx.fillRect(ux + 5, oy + 9, uw - 10, 7);
      // Złote wieko ze stylizowaną głową bóstwa
      ctx.fillStyle = obs.goldColor;
      ctx.beginPath();
      ctx.arc(ux + uw / 2, oy + 8, (uw - 6) / 2, Math.PI, 0);
      ctx.fill();
      // Szczyt wieka (złoty pąk / nemes)
      ctx.fillRect(ux + uw / 2 - 2, oy + 2, 4, 4);

    } else if (obs.type === 'pharaoh_block') {
      // Rzeźbiony starożytny blok piaskowca z wyrytymi hieroglifami
      ctx.fillStyle = obs.darkStone;
      ctx.fillRect(obs.x + 2, oy + 2, obs.w - 2, obs.h - 2);
      ctx.fillStyle = obs.stoneColor;
      ctx.fillRect(obs.x, oy, obs.w - 3, obs.h - 2);
      // Fazowane krawędzie bloku
      ctx.fillStyle = obs.lightEdge;
      ctx.fillRect(obs.x, oy, obs.w - 3, 3);
      ctx.fillRect(obs.x, oy, 3, obs.h - 2);
      // Złote wyryte inskrypcje hieroglificzne na ściance
      ctx.fillStyle = obs.hieroColor;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('𓀀 𓃠', obs.x + (obs.w - 3) / 2, oy + 14);
      ctx.fillText('𓋹 𓊹', obs.x + (obs.w - 3) / 2, oy + 23);
      ctx.textAlign = 'left';

    // ----------------------------------------------------
    // BIOM 2: ZIMA (snowman, ice_spike, snow_drift)
    // ----------------------------------------------------
    } else if (obs.type === 'snowman') {
      const cx = obs.x + obs.w / 2;

      // Dolna kula śniegu
      ctx.fillStyle = obs.color;
      ctx.beginPath();
      ctx.arc(cx, GROUND_Y - 14, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = obs.shadowColor;
      ctx.beginPath();
      ctx.arc(cx + 4, GROUND_Y - 12, 12, 0.4, Math.PI * 0.9);
      ctx.fill();

      // Górna kula (głowa)
      ctx.fillStyle = obs.color;
      ctx.beginPath();
      ctx.arc(cx, GROUND_Y - 32, 10, 0, Math.PI * 2);
      ctx.fill();

      // Szalik
      ctx.fillStyle = obs.scarfColor;
      ctx.fillRect(cx - 9, GROUND_Y - 24, 18, 5);
      ctx.fillRect(cx + 2, GROUND_Y - 24, 5, 10);

      // Marchewkowy nos
      ctx.fillStyle = obs.carrotColor;
      ctx.beginPath();
      ctx.moveTo(cx + 2, GROUND_Y - 32);
      ctx.lineTo(cx + 12, GROUND_Y - 30);
      ctx.lineTo(cx + 2, GROUND_Y - 28);
      ctx.closePath();
      ctx.fill();

      // Węgielkowe oczy i guziki
      ctx.fillStyle = '#212121';
      ctx.fillRect(cx - 2, GROUND_Y - 35, 2, 2);
      ctx.fillRect(cx + 4, GROUND_Y - 35, 2, 2);
      ctx.fillRect(cx + 1, GROUND_Y - 16, 2.5, 2.5);
      ctx.fillRect(cx + 1, GROUND_Y - 10, 2.5, 2.5);

      // Kapelusz / garnek
      ctx.fillStyle = obs.hatColor;
      ctx.fillRect(cx - 8, GROUND_Y - 45, 16, 8);
      ctx.fillRect(cx - 12, GROUND_Y - 39, 24, 3);
      ctx.fillStyle = obs.scarfColor;
      ctx.fillRect(cx - 8, GROUND_Y - 40, 16, 2);

    } else if (obs.type === 'ice_spike') {
      const cx = obs.x + obs.w / 2;

      ctx.fillStyle = obs.color;
      ctx.beginPath();
      ctx.moveTo(obs.x + 3, GROUND_Y);
      ctx.lineTo(cx - 3, oy + 6);
      ctx.lineTo(cx, oy);
      ctx.lineTo(obs.x + obs.w - 3, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Fasetowane załamania lodu
      ctx.fillStyle = obs.coreColor;
      ctx.beginPath();
      ctx.moveTo(cx, oy);
      ctx.lineTo(cx - 3, oy + 6);
      ctx.lineTo(cx - 1, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = obs.edgeColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, oy);
      ctx.lineTo(obs.x + 3, GROUND_Y);
      ctx.moveTo(cx, oy);
      ctx.lineTo(cx - 1, GROUND_Y);
      ctx.stroke();

    } else if (obs.type === 'snow_drift') {
      // Drewniane płotki wystające z zaspy
      ctx.fillStyle = obs.woodColor;
      ctx.fillRect(obs.x + 8, oy + 2, 5, obs.h - 2);
      ctx.fillRect(obs.x + 22, oy + 4, 5, obs.h - 4);
      ctx.fillRect(obs.x + 38, oy + 1, 5, obs.h - 1);
      ctx.fillRect(obs.x + 4, oy + 8, obs.w - 8, 3);

      // Śniegowa czapa na płotku
      ctx.fillStyle = obs.snowColor;
      ctx.fillRect(obs.x + 7, oy, 7, 3);
      ctx.fillRect(obs.x + 21, oy + 2, 7, 3);
      ctx.fillRect(obs.x + 37, oy - 1, 7, 3);

      // Wał ubitego śniegu zaspy
      ctx.fillStyle = obs.shadowColor;
      ctx.beginPath();
      ctx.ellipse(obs.x + obs.w / 2 + 4, GROUND_Y - 6, obs.w / 2 - 2, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = obs.snowColor;
      ctx.beginPath();
      ctx.ellipse(obs.x + obs.w / 2, GROUND_Y - 7, obs.w / 2 - 2, 9, 0, 0, Math.PI * 2);
      ctx.fill();

    // ----------------------------------------------------
    // BIOM 3: DŻUNGLA (carnivorous_plant, fallen_log, ancient_totem)
    // ----------------------------------------------------
    } else if (obs.type === 'carnivorous_plant') {
      const cx = obs.x + obs.w / 2;

      // Łodyga i liście
      ctx.fillStyle = obs.stemColor;
      ctx.fillRect(cx - 3, oy + 16, 6, obs.h - 16);
      ctx.beginPath();
      ctx.ellipse(cx - 10, GROUND_Y - 4, 10, 4, -0.2, 0, Math.PI * 2);
      ctx.ellipse(cx + 10, GROUND_Y - 4, 10, 4, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Paszcza mięsożerna
      ctx.fillStyle = obs.petalColor;
      ctx.beginPath();
      ctx.arc(cx, oy + 12, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = obs.innerColor;
      ctx.beginPath();
      ctx.arc(cx, oy + 12, 9, 0.2, Math.PI * 0.9);
      ctx.fill();

      // Kły / zęby rośliny
      ctx.fillStyle = obs.teethColor;
      for (let a = 0; a < 4; a++) {
        ctx.fillRect(cx - 7 + a * 4, oy + 7, 2, 3);
        ctx.fillRect(cx - 7 + a * 4, oy + 14, 2, 3);
      }

    } else if (obs.type === 'fallen_log') {
      // Powalona kłoda drzewa
      ctx.fillStyle = obs.barkColor;
      ctx.fillRect(obs.x + 8, oy + 4, obs.w - 12, obs.h - 4);

      // Przekrój pnia ze słojami
      ctx.fillStyle = obs.woodColor;
      ctx.beginPath();
      ctx.ellipse(obs.x + 8, oy + 13, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3e2723';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(obs.x + 8, oy + 13, 2.5, 4.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Mech na kłodzie
      ctx.fillStyle = obs.mossColor;
      ctx.fillRect(obs.x + 16, oy + 3, 16, 3);
      ctx.fillRect(obs.x + 36, oy + 3, 12, 3);

      // Grzybki leśne na kłodzie
      ctx.fillStyle = obs.mushroomColor;
      ctx.beginPath();
      ctx.arc(obs.x + 24, oy + 1, 4, Math.PI, 0);
      ctx.arc(obs.x + 32, oy + 2, 3, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(obs.x + 23, oy + 1, 2, 3);
      ctx.fillRect(obs.x + 31, oy + 2, 2, 2);

    } else if (obs.type === 'ancient_totem') {
      // Kamienny monolit
      ctx.fillStyle = obs.stoneColor;
      ctx.fillRect(obs.x, oy + 4, obs.w, obs.h - 4);
      ctx.fillRect(obs.x - 2, GROUND_Y - 5, obs.w + 4, 5);

      ctx.fillStyle = obs.darkStone;
      // Rzeźbione krawędzie totemu
      ctx.fillRect(obs.x + 3, oy + 10, obs.w - 6, 4);
      ctx.fillRect(obs.x + 3, oy + 24, obs.w - 6, 3);
      ctx.fillRect(obs.x + 3, oy + 38, obs.w - 6, 4);

      // Świecące runiczne oczy
      ctx.fillStyle = obs.runeColor;
      ctx.fillRect(obs.x + 5, oy + 16, 4, 4);
      ctx.fillRect(obs.x + obs.w - 9, oy + 16, 4, 4);
      ctx.fillRect(obs.x + 8, oy + 29, obs.w - 16, 3);

      // Pnącza
      ctx.fillStyle = obs.vineColor;
      ctx.fillRect(obs.x - 1, oy + 18, 3, 8);
      ctx.fillRect(obs.x + obs.w - 2, oy + 28, 3, 12);

    // ----------------------------------------------------
    // BIOM 4: PIEKŁO (lava_vent, bone_spike, brimstone_crystal)
    // ----------------------------------------------------
    } else if (obs.type === 'lava_vent') {
      const cx = obs.x + obs.w / 2;

      // Stożek wulkaniczny
      ctx.fillStyle = obs.rockColor;
      ctx.beginPath();
      ctx.moveTo(obs.x, GROUND_Y);
      ctx.lineTo(cx - 7, oy + 8);
      ctx.lineTo(cx + 7, oy + 8);
      ctx.lineTo(obs.x + obs.w, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Płynące żyły lawy
      ctx.strokeStyle = obs.lavaColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 4, oy + 9); ctx.lineTo(cx - 8, GROUND_Y - 4);
      ctx.moveTo(cx + 3, oy + 9); ctx.lineTo(cx + 9, GROUND_Y - 6);
      ctx.stroke();

      // Magma w kraterze
      ctx.fillStyle = obs.lavaColor;
      ctx.beginPath();
      ctx.ellipse(cx, oy + 8, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = obs.glowColor;
      ctx.beginPath();
      ctx.ellipse(cx, oy + 7, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Iskry żaru
      ctx.fillRect(cx - 3, oy - 2, 2.5, 2.5);
      ctx.fillRect(cx + 4, oy - 4, 2, 2);

    } else if (obs.type === 'bone_spike') {
      const cx = obs.x + obs.w / 2;

      // Iglica bazaltowa
      ctx.fillStyle = obs.spikeColor;
      ctx.beginPath();
      ctx.moveTo(obs.x + 3, GROUND_Y);
      ctx.lineTo(cx, oy);
      ctx.lineTo(obs.x + obs.w - 3, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Krwawe żłobienia
      ctx.strokeStyle = obs.bloodColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, oy + 4); ctx.lineTo(cx, GROUND_Y - 4);
      ctx.stroke();

      // Rogate kości w podstawie
      ctx.fillStyle = obs.boneColor;
      ctx.beginPath();
      ctx.moveTo(obs.x + 2, GROUND_Y - 8);
      ctx.lineTo(obs.x - 3, GROUND_Y - 18);
      ctx.lineTo(obs.x + 4, GROUND_Y - 12);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(obs.x + obs.w - 2, GROUND_Y - 8);
      ctx.lineTo(obs.x + obs.w + 3, GROUND_Y - 18);
      ctx.lineTo(obs.x + obs.w - 4, GROUND_Y - 12);
      ctx.closePath();
      ctx.fill();

    } else if (obs.type === 'brimstone_crystal') {
      const cx = obs.x + obs.w / 2;

      // Główny kryształ siarki
      ctx.fillStyle = obs.sulfurColor;
      ctx.beginPath();
      ctx.moveTo(cx, oy);
      ctx.lineTo(cx + 9, oy + 14);
      ctx.lineTo(cx + 6, GROUND_Y);
      ctx.lineTo(cx - 7, GROUND_Y);
      ctx.lineTo(cx - 9, oy + 12);
      ctx.closePath();
      ctx.fill();

      // Odłamek boczny lewy
      ctx.fillStyle = obs.basaltColor;
      ctx.beginPath();
      ctx.moveTo(obs.x + 1, GROUND_Y);
      ctx.lineTo(obs.x + 5, oy + 16);
      ctx.lineTo(cx - 3, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Płonące fasetowanie siarki
      ctx.fillStyle = obs.glowColor;
      ctx.beginPath();
      ctx.moveTo(cx, oy);
      ctx.lineTo(cx + 3, oy + 14);
      ctx.lineTo(cx + 2, GROUND_Y - 4);
      ctx.lineTo(cx - 4, oy + 12);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 2. Rysowanie przeszkód powietrznych (ptaków dopasowanych do biomów)
  drawBirds(ctx, GROUND_Y, viewLeft, viewRight);
}

// ==========================================
// RENDEROWANIE PTAKÓW POWIETRZNYCH
// ==========================================

export function drawBirds(ctx, GROUND_Y, viewLeft, viewRight) {
  for (let i = 0; i < birds.length; i++) {
    const bird = birds[i];
    if (isInsidePyramidZone(bird.x, bird.w)) continue;
    if (bird.x + bird.w < viewLeft || bird.x > viewRight) continue;

    drawBird(ctx, bird, GROUND_Y);
  }

  // Renderowanie spektakularnych cząsteczek eksplozji (chmura piór, obłoczek puchu, iskry, popupy)
  drawBirdParticles(ctx);
}

function drawBird(ctx, bird, GROUND_Y) {
  const bx = bird.x;
  const by = bird.y;
  const bw = bird.w || 44; // powiększony rozmiar sylwetki (~44 px rozpiętości)
  const bh = bird.h || 28;
  const cx = bx + bw / 2;
  const cy = by + bh / 2;

  // 1. Cień ptaka rzucany na podłoże (dynamicznie skalowany z pułapem wysokości)
  const altitudeAboveGround = Math.max(10, GROUND_Y - (by + bh));
  const shadowScale = Math.max(0.35, Math.min(1.2, 1.15 - (altitudeAboveGround / 240)));
  const shadowAlpha = Math.max(0.06, 0.32 * shadowScale);
  ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha.toFixed(2)})`;
  ctx.beginPath();
  ctx.ellipse(cx, GROUND_Y + 1, 20 * shadowScale, 4.8 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Animacja machania skrzydłami (sinusoida sprzężona z fazą lotu ptaka)
  const flapSpeed = bird.hitReaction > 0 ? 0.038 : 0.016;
  const flap = Math.sin(Date.now() * flapSpeed + bird.phase * 4);
  const wingFlapY = flap * 12;

  ctx.save();

  // Reakcja na kolizję (krótkie drżenie / odrzut)
  if (bird.hitReaction > 0) {
    const jitter = (Math.random() - 0.5) * 4;
    ctx.translate(jitter, jitter);
  }

  if (bird.type === 'crow' || bird.type === 'pigeon') {
    // ==========================================
    // BIOM 0: WRONA DRAPIEŻNA / JASTRZĄB NA STADIONIE (crow / pigeon)
    // ==========================================
    // 1. Sterówki ogona (rozpostarty, schodkowy ogon drapieżnika)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(bx + 24, cy + 2);
    ctx.lineTo(bx + 42, cy - 3);
    ctx.lineTo(bx + 45, cy + 2);
    ctx.lineTo(bx + 40, cy + 8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx + 26, cy + 2);
    ctx.lineTo(bx + 43, cy);
    ctx.moveTo(bx + 26, cy + 3);
    ctx.lineTo(bx + 42, cy + 5);
    ctx.stroke();

    // 2. Tylne skrzydło (w głębi, z rozczapierzonymi lotkami)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(bx + 16, cy - 1);
    ctx.lineTo(bx + 24, cy - 16 - wingFlapY * 0.8);
    ctx.lineTo(bx + 29, cy - 13 - wingFlapY * 0.7);
    ctx.lineTo(bx + 31, cy - 2);
    ctx.closePath();
    ctx.fill();

    // 3. Korpus (aerodynamiczny, grafitowo-czarny z opalizującym połyskiem)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(bx + 20, cy + 3, 13, 8.5, -0.12, 0, Math.PI * 2);
    ctx.fill();

    // Opalizujący petrol-blue / grafitowy brzuszek i pierś
    const corvidGrad = ctx.createLinearGradient(bx + 8, cy - 4, bx + 24, cy + 8);
    corvidGrad.addColorStop(0, '#1e293b');
    corvidGrad.addColorStop(0.5, '#0f172a');
    corvidGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = corvidGrad;
    ctx.beginPath();
    ctx.ellipse(bx + 18, cy + 5, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Szyja i głowa drapieżnika
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(bx + 9, cy - 3, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Nastroszone pióra na karku (hackles)
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.moveTo(bx + 13, cy - 6);
    ctx.lineTo(bx + 16, cy - 9);
    ctx.lineTo(bx + 15, cy - 4);
    ctx.closePath();
    ctx.fill();

    // 5. Potężny, ostry, zakrzywiony dziób drapieżnej wrony / jastrzębia
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.moveTo(bx + 4, cy - 6);
    ctx.quadraticCurveTo(bx - 3, cy - 4, bx - 8, cy - 0.5);
    ctx.lineTo(bx - 4, cy + 2.5);
    ctx.lineTo(bx + 4, cy);
    ctx.closePath();
    ctx.fill();

    // Rogowa krawędź dzioba (jasny refleks)
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(bx + 4, cy - 5.5);
    ctx.quadraticCurveTo(bx - 3, cy - 3.8, bx - 7.5, cy - 0.5);
    ctx.stroke();

    // 6. Oko drapieżnika (bursztynowo-złota tęczówka z czarną źrenicą)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(bx + 7.5, cy - 4.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(bx + 7.2, cy - 4.5, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx + 7.6, cy - 5.3, 0.9, 0.9);

    // 7. Przednie potężne skrzydło z rozczapierzonymi lotkami (fingered primaries)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(bx + 13, cy + 1);
    ctx.lineTo(bx + 24, cy - 18 + wingFlapY * 1.1);
    ctx.lineTo(bx + 29, cy - 20 + wingFlapY * 1.15);
    ctx.lineTo(bx + 33, cy - 14 + wingFlapY * 0.95);
    ctx.lineTo(bx + 36, cy - 8 + wingFlapY * 0.75);
    ctx.lineTo(bx + 32, cy + 3);
    ctx.closePath();
    ctx.fill();

    // Pas pokryw skrzydłowych z metalicznym połyskiem
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(bx + 18, cy - 6 + wingFlapY * 0.5);
    ctx.lineTo(bx + 27, cy - 2 + wingFlapY * 0.5);
    ctx.stroke();

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(bx + 20, cy - 2 + wingFlapY * 0.6);
    ctx.lineTo(bx + 29, cy + 2 + wingFlapY * 0.6);
    ctx.stroke();

    // 8. Podkurczone szpony
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(bx + 17, cy + 9);
    ctx.lineTo(bx + 15, cy + 12);
    ctx.moveTo(bx + 20, cy + 9);
    ctx.lineTo(bx + 18, cy + 12);
    ctx.stroke();

  } else if (bird.type === 'vulture') {
    // ==========================================
    // BIOM 1: SĘP PUSTYNNY / JASTRZĄB PUSTYNNY (vulture)
    // ==========================================
    // Szeroki ogon klinowy
    ctx.fillStyle = '#271c19';
    ctx.beginPath();
    ctx.moveTo(bx + 24, cy + 3);
    ctx.lineTo(bx + 43, cy - 2);
    ctx.lineTo(bx + 41, cy + 9);
    ctx.closePath();
    ctx.fill();

    // Tylne skrzydło z postrzępionymi lotkami
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.moveTo(bx + 17, cy - 1);
    ctx.lineTo(bx + 28, cy - 18 - wingFlapY * 0.85);
    ctx.lineTo(bx + 33, cy - 14 - wingFlapY * 0.7);
    ctx.lineTo(bx + 33, cy - 2);
    ctx.closePath();
    ctx.fill();

    // Ciemnobrązowy potężny korpus
    ctx.fillStyle = '#4e342e';
    ctx.beginPath();
    ctx.ellipse(bx + 20, cy + 4, 13.5, 9, -0.08, 0, Math.PI * 2);
    ctx.fill();

    // Pierzasty białawy kołnierz wokół szyi
    ctx.fillStyle = '#e7e5e4';
    ctx.beginPath();
    ctx.ellipse(bx + 10, cy + 1.5, 5.5, 7, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Łysa, różowo-beżowa szyja i głowa drapieżnika
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.moveTo(bx + 9, cy);
    ctx.lineTo(bx + 4, cy + 3);
    ctx.lineTo(bx + 4, cy - 3);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx + 4, cy - 1.5, 5.2, 0, Math.PI * 2);
    ctx.fill();

    // Zadziorny, zakrzywiony kościsty dziób sępa
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(bx + 2, cy - 5);
    ctx.lineTo(bx - 7, cy - 0.5);
    ctx.lineTo(bx - 5, cy + 4.5);
    ctx.lineTo(bx + 1, cy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(bx - 6, cy + 1.5, 3.2, 3);

    // Żółte oko drapieżnika
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(bx + 3.2, cy - 2.5, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(bx + 3.0, cy - 2.5, 1.1, 0, Math.PI * 2);
    ctx.fill();

    // Przednie potężne drapieżne skrzydło z rozczapierzonymi lotkami
    ctx.fillStyle = '#4e342e';
    ctx.beginPath();
    ctx.moveTo(bx + 12, cy + 1);
    ctx.lineTo(bx + 25, cy - 20 + wingFlapY * 1.15);
    ctx.lineTo(bx + 31, cy - 21 + wingFlapY * 1.2);
    ctx.lineTo(bx + 36, cy - 14 + wingFlapY * 0.95);
    ctx.lineTo(bx + 34, cy + 4);
    ctx.closePath();
    ctx.fill();

    // Końcówki lotek w kolorze węgla
    ctx.fillStyle = '#18181b';
    ctx.fillRect(bx + 23, cy - 19 + wingFlapY * 1.15, 6, 4.5);
    ctx.fillRect(bx + 29, cy - 17 + wingFlapY * 1.05, 5, 4.5);
    ctx.fillRect(bx + 33, cy - 13 + wingFlapY * 0.85, 4, 4);

  } else if (bird.type === 'snow_owl') {
    // ==========================================
    // BIOM 2: SOWA ŚNIEŻNA DRAPIEŻNA (snow_owl)
    // ==========================================
    // Zaokrąglony ogon
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(bx + 26, cy + 3);
    ctx.lineTo(bx + 42, cy - 1);
    ctx.lineTo(bx + 40, cy + 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.fillRect(bx + 32, cy + 2, 4, 2);

    // Tylne skrzydło
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(bx + 16, cy - 1);
    ctx.lineTo(bx + 25, cy - 15 - wingFlapY * 0.75);
    ctx.lineTo(bx + 31, cy - 2);
    ctx.closePath();
    ctx.fill();

    // Puszysty biały korpus
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(bx + 19, cy + 3, 13, 9.5, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Poprzeczne ciemne cętki na piersi
    ctx.fillStyle = '#475569';
    ctx.fillRect(bx + 15, cy + 1, 3.8, 1.8);
    ctx.fillRect(bx + 21, cy + 3, 3.8, 1.8);
    ctx.fillRect(bx + 18, cy + 7, 3.8, 1.8);

    // Duża okrągła głowa sowy
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bx + 8, cy - 3, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // Złotożółte hipnotyzujące oczy sowy
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(bx + 6, cy - 4, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(bx + 5.7, cy - 4, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx + 6.3, cy - 5, 1.2, 1.2);

    // Zakrzywiony czarny dzióbek sowy
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(bx + 2.5, cy - 5);
    ctx.lineTo(bx - 3.5, cy - 1);
    ctx.lineTo(bx + 2.5, cy);
    ctx.closePath();
    ctx.fill();

    // Przednie skrzydło z cętkami
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(bx + 13, cy + 1);
    ctx.lineTo(bx + 25, cy - 17 + wingFlapY * 1.05);
    ctx.lineTo(bx + 32, cy + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.fillRect(bx + 20, cy - 10 + wingFlapY * 0.7, 3.5, 2.2);
    ctx.fillRect(bx + 24, cy - 5 + wingFlapY * 0.7, 3.5, 2.2);

  } else if (bird.type === 'parrot') {
    // ==========================================
    // BIOM 3: PAPUGA ARA (parrot)
    // ==========================================
    // Długi, smukły ogon w barwach kobaltu i szkarłatu
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.moveTo(bx + 25, cy + 3);
    ctx.lineTo(bx + 47, cy + 10);
    ctx.lineTo(bx + 35, cy + 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(bx + 24, cy + 3);
    ctx.lineTo(bx + 44, cy + 6);
    ctx.lineTo(bx + 31, cy + 7);
    ctx.closePath();
    ctx.fill();

    // Tylne skrzydło (szafirowo-żółte)
    ctx.fillStyle = '#1e40af';
    ctx.beginPath();
    ctx.moveTo(bx + 17, cy - 1);
    ctx.lineTo(bx + 27, cy - 16 - wingFlapY * 0.85);
    ctx.lineTo(bx + 31, cy);
    ctx.closePath();
    ctx.fill();

    // Szkarłatny korpus ary
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(bx + 18, cy + 3, 12, 8.5, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Złocisty brzuszek
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.ellipse(bx + 17, cy + 6.5, 7.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Czerwona głowa
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.arc(bx + 9, cy - 3, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Biała maska policzkowa
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(bx + 7, cy - 3.8, 3.8, 4.8, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Oko z żółtą tęczówką
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(bx + 7.5, cy - 4.5, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(bx + 7.2, cy - 4.5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Potężny zakrzywiony dziób Ary
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.moveTo(bx + 4, cy - 7);
    ctx.lineTo(bx - 5.5, cy - 1.5);
    ctx.lineTo(bx - 3, cy + 5);
    ctx.lineTo(bx + 3, cy - 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(bx + 2, cy - 1);
    ctx.lineTo(bx - 2.5, cy + 3);
    ctx.lineTo(bx + 2, cy + 3.8);
    ctx.closePath();
    ctx.fill();

    // Wielobarwne przednie skrzydło (czerwony, żółty, szafir)
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(bx + 13, cy + 1);
    ctx.lineTo(bx + 20, cy - 8 + wingFlapY * 0.5);
    ctx.lineTo(bx + 26, cy + 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(bx + 15, cy - 2 + wingFlapY * 0.3);
    ctx.lineTo(bx + 23, cy - 12 + wingFlapY * 0.7);
    ctx.lineTo(bx + 28, cy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.moveTo(bx + 18, cy - 6 + wingFlapY * 0.6);
    ctx.lineTo(bx + 27, cy - 18 + wingFlapY * 1.05);
    ctx.lineTo(bx + 32, cy);
    ctx.closePath();
    ctx.fill();

  } else if (bird.type === 'hell_bat') {
    // ==========================================
    // BIOM 4: PIEKIELNY NIETOPERZ (hell_bat)
    // ==========================================
    // Tylne skórzaste skrzydło
    ctx.fillStyle = '#4c0519';
    ctx.beginPath();
    ctx.moveTo(bx + 18, cy + 1);
    ctx.lineTo(bx + 28, cy - 18 - wingFlapY * 0.95);
    ctx.lineTo(bx + 34, cy - 8 - wingFlapY * 0.5);
    ctx.lineTo(bx + 31, cy + 3);
    ctx.closePath();
    ctx.fill();

    // Mroczny korpus nietoperza
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(bx + 18, cy + 3, 11, 8, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Pysk i spiczaste uszy
    ctx.fillStyle = '#27040d';
    ctx.beginPath();
    ctx.arc(bx + 9, cy - 2, 5.8, 0, Math.PI * 2);
    ctx.fill();

    // Rogate uszy
    ctx.fillStyle = '#9f1239';
    ctx.beginPath();
    ctx.moveTo(bx + 8, cy - 5);
    ctx.lineTo(bx + 6.5, cy - 13);
    ctx.lineTo(bx + 11, cy - 5);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(bx + 11, cy - 4.5);
    ctx.lineTo(bx + 14, cy - 12);
    ctx.lineTo(bx + 15, cy - 4);
    ctx.closePath();
    ctx.fill();

    // Ostre kły
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(bx + 4, cy + 1.5, 1.8, 3.5);
    ctx.fillRect(bx + 7, cy + 1.5, 1.8, 3.5);

    // Płonące karmazynowe ślepia
    ctx.fillStyle = '#ff0055';
    ctx.beginPath();
    ctx.arc(bx + 6.5, cy - 3, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffedd5';
    ctx.fillRect(bx + 6.0, cy - 3.8, 1.4, 1.4);

    // Przednie skórzaste skrzydło nietoperza z kośćmi i błoną
    ctx.fillStyle = '#881337';
    ctx.beginPath();
    ctx.moveTo(bx + 11, cy + 2);
    ctx.lineTo(bx + 24, cy - 20 + wingFlapY * 1.25);
    ctx.lineTo(bx + 31, cy - 11 + wingFlapY * 0.85);
    ctx.lineTo(bx + 28, cy + 4);
    ctx.closePath();
    ctx.fill();

    // Rogate kościste ramiona skrzydła
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(bx + 12, cy + 1);
    ctx.lineTo(bx + 24, cy - 20 + wingFlapY * 1.25);
    ctx.lineTo(bx + 31, cy - 11 + wingFlapY * 0.85);
    ctx.stroke();

    // Iskry żaru unoszące się z piekielnego nietoperza
    ctx.fillStyle = '#ea580c';
    const emberTime = (Date.now() * 0.008) % 1;
    ctx.fillRect(bx + 29 + emberTime * 8, cy - 3 + Math.sin(emberTime * 5) * 4, 2.5, 2.5);
  }

  // Efekt potrącenia / reakcji na uderzenie (drobne piórka)
  if (bird.hitReaction > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(cx - 10, cy - 6, 3.2, 0, Math.PI * 2);
    ctx.arc(cx + 8, cy + 8, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}