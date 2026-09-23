import { START_X } from './config.js';
import { player } from './player.js';
import { camera, W, GROUND_Y } from './world.js';

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
  const types = BIOME_OBSTACLE_TYPES[biomeId] || BIOME_OBSTACLE_TYPES[0];
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

const BIOME_BIRD_TYPES = {
  0: 'pigeon',    // Murawa: Gołąb miejski / Jastrząb
  1: 'vulture',   // Pustynia: Sęp pustynny
  2: 'snow_owl',  // Zima: Sowa śnieżna
  3: 'parrot',    // Dżungla: Papuga Ara
  4: 'hell_bat'   // Piekło: Piekielny nietoperz
};

export function getBirdTypeForX(x) {
  const biomeId = getBiomeForX(x);
  return BIOME_BIRD_TYPES[biomeId] || 'pigeon';
}

let lastBirdSpawnX = START_X + 2800; // Pierwszy ptak po ok. 200m (przed stadionem)

/**
 * Fabryka ptaków – tworzy latającą przeszkodę powietrzną z własną fizyką i animacją
 */
export function createBird(x, groundY = (typeof GROUND_Y !== 'undefined' ? GROUND_Y : 500)) {
  const type = getBirdTypeForX(x);
  // Wysokość lotu 45–70 px nad poziomem murawy (GROUND_Y - 45 do GROUND_Y - 70)
  const altitude = 48 + Math.random() * 18;
  const w = 28;
  const h = 18;
  const hoverPhase = Math.random() * Math.PI * 2;
  const y = groundY - altitude - h + Math.sin(hoverPhase) * 4;

  return {
    type,
    x,
    y,
    w,
    h,
    baseAltitude: altitude,
    hoverPhase,
    vx: -0.8,          // Powolne szybowanie w lewo naprzeciw biegaczowi
    restitution: 0.85, // Sprężyste odbicie piłki
    friction: 0.35,
    hitReaction: 0
  };
}

/**
 * Aktualizuje ruch, animacje i proceduralne generowanie ptaków
 */
export function updateProceduralBirds(focusX, groundY) {
  const gy = (typeof groundY !== 'undefined' && groundY !== null) ? groundY : (typeof GROUND_Y !== 'undefined' ? GROUND_Y : 500);

  if (focusX < lastBirdSpawnX - 6000) {
    resetBirds();
    return;
  }

  // 1. Ruch poziomy i falowanie w pionie
  for (let i = 0; i < birds.length; i++) {
    const b = birds[i];
    b.x += b.vx;
    b.hoverPhase += 0.05;
    b.y = gy - b.baseAltitude - b.h + Math.sin(b.hoverPhase) * 4;
    if (b.hitReaction > 0) {
      b.hitReaction--;
    }
  }

  // 2. Generowanie nowych ptaków w przód (średnio co ok. 350 m = 4900 px)
  const targetAheadX = focusX + SPAWN_AHEAD_BUFFER;
  while (lastBirdSpawnX < targetAheadX) {
    const birdGap = 4900 + (Math.random() * 560 - 280);
    lastBirdSpawnX += birdGap;

    // Całkowite wykluczenie ptaków wewnątrz stadionu (300 m – 750 m)
    if (isInsideStadiumZone(lastBirdSpawnX, 40)) {
      continue;
    }

    const bird = createBird(lastBirdSpawnX, gy);
    birds.push(bird);
  }

  // 3. Usuwanie ptaków, które mogły znaleźć się wewnątrz stadionu
  for (let i = birds.length - 1; i >= 0; i--) {
    if (isInsideStadiumZone(birds[i].x, birds[i].w)) {
      birds.splice(i, 1);
    }
  }

  // 4. Usuwanie ptaków, które odleciały daleko za gracza
  const despawnThreshold = focusX - DESPAWN_BEHIND_BUFFER;
  while (birds.length > 0 && (birds[0].x + birds[0].w) < despawnThreshold) {
    birds.shift();
  }
}

export function resetBirds() {
  birds.length = 0;
  lastBirdSpawnX = START_X + 2800;
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
    if (isInsideStadiumZone(bird.x, bird.w)) continue;
    if (Math.abs(ball.x - (bird.x + bird.w / 2)) < bird.w + 50) {
      const hit = resolveBoxCollision(
        ball,
        bird.x,
        bird.y,
        bird.w,
        bird.h,
        bird.restitution ?? 0.85,
        bird.friction ?? 0.35
      );
      if (hit) {
        bird.hitReaction = 16;
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
    if (isInsideStadiumZone(bird.x, bird.w)) continue;
    if (bird.x + bird.w < viewLeft || bird.x > viewRight) continue;

    drawBird(ctx, bird, GROUND_Y);
  }
}

function drawBird(ctx, bird, GROUND_Y) {
  const bx = bird.x;
  const by = bird.y;
  const bw = bird.w; // 28
  const bh = bird.h; // 18
  const cx = bx + bw / 2;
  const cy = by + bh / 2;

  // 1. Cień ptaka rzucany na podłoże
  const altitudeAboveGround = Math.max(10, GROUND_Y - (by + bh));
  const shadowScale = Math.max(0.4, 1 - (altitudeAboveGround / 120));
  const shadowAlpha = Math.max(0.08, 0.24 * shadowScale);
  ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha.toFixed(2)})`;
  ctx.beginPath();
  ctx.ellipse(cx, GROUND_Y + 1, 14 * shadowScale, 3.5 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Animacja machania skrzydłami (sinusoida w czasie)
  const flapSpeed = bird.hitReaction > 0 ? 0.028 : 0.012;
  const flap = Math.sin(Date.now() * flapSpeed + bird.hoverPhase);
  const wingFlapY = flap * 7;

  ctx.save();

  // Reakcja na kolizję (krótkie drżenie / odrzut)
  if (bird.hitReaction > 0) {
    const jitter = (Math.random() - 0.5) * 3;
    ctx.translate(jitter, jitter);
  }

  if (bird.type === 'pigeon') {
    // ==========================================
    // BIOM 0: GOŁĄB MIEJSKI (pigeon)
    // ==========================================
    // Sterówki ogona (skierowane w prawo)
    ctx.fillStyle = '#455a64';
    ctx.beginPath();
    ctx.moveTo(bx + 18, cy + 1);
    ctx.lineTo(bx + 29, cy - 2);
    ctx.lineTo(bx + 28, cy + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#263238';
    ctx.fillRect(bx + 25, cy - 1, 3, 4);

    // Tylne skrzydło (w głębi)
    ctx.fillStyle = '#607d8b';
    ctx.beginPath();
    ctx.moveTo(bx + 12, cy - 1);
    ctx.lineTo(bx + 18, cy - 9 - wingFlapY * 0.7);
    ctx.lineTo(bx + 21, cy - 2);
    ctx.closePath();
    ctx.fill();

    // Korpus gołębia (szaro-stalowy z jasnym brzuszkiem)
    ctx.fillStyle = '#78909c';
    ctx.beginPath();
    ctx.ellipse(bx + 13, cy + 2, 8.5, 5.5, -0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#b0bec5';
    ctx.beginPath();
    ctx.ellipse(bx + 12, cy + 4, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Szmaragdowo-opalizująca szyja
    ctx.fillStyle = '#26a69a';
    ctx.beginPath();
    ctx.arc(bx + 8, cy - 1, 3.8, 0, Math.PI * 2);
    ctx.fill();

    // Głowa gołębia
    ctx.fillStyle = '#546e7a';
    ctx.beginPath();
    ctx.arc(bx + 6, cy - 2, 4.2, 0, Math.PI * 2);
    ctx.fill();

    // Dziób
    ctx.fillStyle = '#ffb74d';
    ctx.beginPath();
    ctx.moveTo(bx + 2.5, cy - 3.5);
    ctx.lineTo(bx - 3, cy - 1.5);
    ctx.lineTo(bx + 2.5, cy);
    ctx.closePath();
    ctx.fill();

    // Oko (pomarańczowa obwódka i czarna źrenica)
    ctx.fillStyle = '#ff7043';
    ctx.beginPath();
    ctx.arc(bx + 5, cy - 3, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#101418';
    ctx.beginPath();
    ctx.arc(bx + 4.8, cy - 3, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Przednie skrzydło z dwoma czarnymi pasami
    ctx.fillStyle = '#78909c';
    ctx.beginPath();
    ctx.moveTo(bx + 9, cy);
    ctx.lineTo(bx + 17, cy - 9 + wingFlapY);
    ctx.lineTo(bx + 21, cy + 1);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(bx + 13, cy - 4 + wingFlapY * 0.5);
    ctx.lineTo(bx + 18, cy + wingFlapY * 0.5);
    ctx.moveTo(bx + 15, cy - 2 + wingFlapY * 0.6);
    ctx.lineTo(bx + 20, cy + 2 + wingFlapY * 0.6);
    ctx.stroke();

  } else if (bird.type === 'vulture') {
    // ==========================================
    // BIOM 1: SĘP PUSTYNNY (vulture)
    // ==========================================
    // Szeroki ogon klinowy
    ctx.fillStyle = '#271c19';
    ctx.beginPath();
    ctx.moveTo(bx + 18, cy + 2);
    ctx.lineTo(bx + 29, cy - 1);
    ctx.lineTo(bx + 28, cy + 6);
    ctx.closePath();
    ctx.fill();

    // Tylne skrzydło z lotkami
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.moveTo(bx + 13, cy - 1);
    ctx.lineTo(bx + 21, cy - 11 - wingFlapY * 0.8);
    ctx.lineTo(bx + 24, cy - 2);
    ctx.closePath();
    ctx.fill();

    // Ciemnobrązowy korpus
    ctx.fillStyle = '#4e342e';
    ctx.beginPath();
    ctx.ellipse(bx + 14, cy + 3, 9, 6, -0.08, 0, Math.PI * 2);
    ctx.fill();

    // Pierzasty białawy kołnierz wokół szyi
    ctx.fillStyle = '#d7ccc8';
    ctx.beginPath();
    ctx.ellipse(bx + 7.5, cy + 1, 3.5, 4.5, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Łysa, różowo-beżowa szyja i głowa
    ctx.fillStyle = '#ef9a9a';
    ctx.beginPath();
    ctx.moveTo(bx + 7, cy);
    ctx.lineTo(bx + 3, cy + 2);
    ctx.lineTo(bx + 3, cy - 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx + 3, cy - 1, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Zadziorny, zakrzywiony kościsty dziób
    ctx.fillStyle = '#fff9c4';
    ctx.beginPath();
    ctx.moveTo(bx + 1, cy - 3);
    ctx.lineTo(bx - 4, cy);
    ctx.lineTo(bx - 3, cy + 3);
    ctx.lineTo(bx, cy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(bx - 3.5, cy + 1, 2, 2);

    // Żółte oko drapieżnika
    ctx.fillStyle = '#fbc02d';
    ctx.beginPath();
    ctx.arc(bx + 2.5, cy - 1.5, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(bx + 2.3, cy - 1.5, 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Przednie potężne drapieżne skrzydło z rozczapierzonymi lotkami
    ctx.fillStyle = '#4e342e';
    ctx.beginPath();
    ctx.moveTo(bx + 9, cy + 1);
    ctx.lineTo(bx + 19, cy - 12 + wingFlapY * 1.1);
    ctx.lineTo(bx + 24, cy - 8 + wingFlapY * 0.9);
    ctx.lineTo(bx + 22, cy + 2);
    ctx.closePath();
    ctx.fill();

    // Końcówki lotek
    ctx.fillStyle = '#1b1b1b';
    ctx.fillRect(bx + 17, cy - 11 + wingFlapY * 1.1, 4, 3);
    ctx.fillRect(bx + 21, cy - 8 + wingFlapY * 0.9, 3, 3);

  } else if (bird.type === 'snow_owl') {
    // ==========================================
    // BIOM 2: SOWA ŚNIEŻNA (snow_owl)
    // ==========================================
    // Zaokrąglony ogon
    ctx.fillStyle = '#eceff1';
    ctx.beginPath();
    ctx.moveTo(bx + 19, cy + 2);
    ctx.lineTo(bx + 28, cy);
    ctx.lineTo(bx + 27, cy + 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#37474f';
    ctx.fillRect(bx + 23, cy + 2, 2.5, 1.5);

    // Tylne skrzydło
    ctx.fillStyle = '#cfd8dc';
    ctx.beginPath();
    ctx.moveTo(bx + 12, cy - 1);
    ctx.lineTo(bx + 18, cy - 9 - wingFlapY * 0.7);
    ctx.lineTo(bx + 22, cy - 1);
    ctx.closePath();
    ctx.fill();

    // Puszysty biały korpus
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(bx + 13, cy + 2, 9, 6.5, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Poprzeczne cętki na piersi
    ctx.fillStyle = '#455a64';
    ctx.fillRect(bx + 11, cy + 1, 2.5, 1.2);
    ctx.fillRect(bx + 15, cy + 2, 2.5, 1.2);
    ctx.fillRect(bx + 13, cy + 5, 2.5, 1.2);

    // Duża okrągła głowa sowy
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bx + 6, cy - 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b0bec5';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Złotożółte hipnotyzujące oczy sowy
    ctx.fillStyle = '#ffd600';
    ctx.beginPath();
    ctx.arc(bx + 4.5, cy - 2.5, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(bx + 4.3, cy - 2.5, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx + 4.8, cy - 3.2, 0.8, 0.8);

    // Zakrzywiony czarny dzióbek
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.moveTo(bx + 2, cy - 3);
    ctx.lineTo(bx - 2, cy - 0.5);
    ctx.lineTo(bx + 2, cy);
    ctx.closePath();
    ctx.fill();

    // Przednie skrzydło
    ctx.fillStyle = '#f5f5f5';
    ctx.beginPath();
    ctx.moveTo(bx + 9, cy);
    ctx.lineTo(bx + 18, cy - 10 + wingFlapY);
    ctx.lineTo(bx + 22, cy + 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#546e7a';
    ctx.fillRect(bx + 15, cy - 6 + wingFlapY * 0.7, 2.5, 1.5);
    ctx.fillRect(bx + 17, cy - 3 + wingFlapY * 0.7, 2.5, 1.5);

  } else if (bird.type === 'parrot') {
    // ==========================================
    // BIOM 3: PAPUGA ARA (parrot)
    // ==========================================
    // Długi, smukły ogon w barwach czerwieni i kobaltu
    ctx.fillStyle = '#1565c0';
    ctx.beginPath();
    ctx.moveTo(bx + 18, cy + 2);
    ctx.lineTo(bx + 32, cy + 7);
    ctx.lineTo(bx + 25, cy + 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#d32f2f';
    ctx.beginPath();
    ctx.moveTo(bx + 17, cy + 2);
    ctx.lineTo(bx + 30, cy + 4);
    ctx.lineTo(bx + 22, cy + 5);
    ctx.closePath();
    ctx.fill();

    // Tylne skrzydło (szafirowo-żółte)
    ctx.fillStyle = '#0d47a1';
    ctx.beginPath();
    ctx.moveTo(bx + 12, cy - 1);
    ctx.lineTo(bx + 19, cy - 10 - wingFlapY * 0.8);
    ctx.lineTo(bx + 22, cy);
    ctx.closePath();
    ctx.fill();

    // Szkarłatny korpus ary
    ctx.fillStyle = '#d32f2f';
    ctx.beginPath();
    ctx.ellipse(bx + 13, cy + 2, 8, 5.5, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Złocisty brzuszek
    ctx.fillStyle = '#fbc02d';
    ctx.beginPath();
    ctx.ellipse(bx + 12, cy + 4.5, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Czerwona głowa
    ctx.fillStyle = '#c62828';
    ctx.beginPath();
    ctx.arc(bx + 6.5, cy - 2, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Biała maska policzkowa
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(bx + 5, cy - 2.5, 2.5, 3.2, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Czarne oko z żółtą tęczówką
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.arc(bx + 5.5, cy - 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(bx + 5.3, cy - 3, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Potężny zakrzywiony dziób Ary (kość słoniowa u góry, czarny na dole)
    ctx.fillStyle = '#fff9c4';
    ctx.beginPath();
    ctx.moveTo(bx + 3, cy - 5);
    ctx.lineTo(bx - 3.5, cy - 1);
    ctx.lineTo(bx - 2, cy + 3.5);
    ctx.lineTo(bx + 2, cy - 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.moveTo(bx + 1.5, cy - 0.5);
    ctx.lineTo(bx - 1.5, cy + 2);
    ctx.lineTo(bx + 1.5, cy + 2.5);
    ctx.closePath();
    ctx.fill();

    // Wielobarwne przednie skrzydło (czerwony, żółty, szafir)
    ctx.fillStyle = '#d32f2f';
    ctx.beginPath();
    ctx.moveTo(bx + 9, cy);
    ctx.lineTo(bx + 14, cy - 5 + wingFlapY * 0.5);
    ctx.lineTo(bx + 18, cy + 1);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.moveTo(bx + 11, cy - 2 + wingFlapY * 0.3);
    ctx.lineTo(bx + 16, cy - 8 + wingFlapY * 0.7);
    ctx.lineTo(bx + 20, cy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1976d2';
    ctx.beginPath();
    ctx.moveTo(bx + 13, cy - 5 + wingFlapY * 0.6);
    ctx.lineTo(bx + 19, cy - 11 + wingFlapY);
    ctx.lineTo(bx + 22, cy);
    ctx.closePath();
    ctx.fill();

  } else if (bird.type === 'hell_bat') {
    // ==========================================
    // BIOM 4: PIEKIELNY NIETOPERZ (hell_bat)
    // ==========================================
    // Tylne skórzaste skrzydło
    ctx.fillStyle = '#3e0a14';
    ctx.beginPath();
    ctx.moveTo(bx + 13, cy);
    ctx.lineTo(bx + 20, cy - 12 - wingFlapY * 0.9);
    ctx.lineTo(bx + 24, cy - 5 - wingFlapY * 0.5);
    ctx.lineTo(bx + 22, cy + 2);
    ctx.closePath();
    ctx.fill();

    // Mroczny korpus nietoperza
    ctx.fillStyle = '#1a0f0f';
    ctx.beginPath();
    ctx.ellipse(bx + 13, cy + 2, 7.5, 5.5, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Pysk i spiczaste uszy
    ctx.fillStyle = '#261214';
    ctx.beginPath();
    ctx.arc(bx + 6.5, cy - 1.5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Rogate uszy
    ctx.fillStyle = '#880e4f';
    ctx.beginPath();
    ctx.moveTo(bx + 6, cy - 4);
    ctx.lineTo(bx + 5, cy - 9);
    ctx.lineTo(bx + 8, cy - 4);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(bx + 8, cy - 3.5);
    ctx.lineTo(bx + 10, cy - 8);
    ctx.lineTo(bx + 11, cy - 3);
    ctx.closePath();
    ctx.fill();

    // Ostre kły
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(bx + 3, cy + 1, 1.2, 2.5);
    ctx.fillRect(bx + 5, cy + 1, 1.2, 2.5);

    // Płonące karmazynowe ślepia
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(bx + 4.5, cy - 2, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffebee';
    ctx.fillRect(bx + 4.2, cy - 2.5, 1, 1);

    // Przednie skórzaste skrzydło nietoperza z kośćmi i błoną
    ctx.fillStyle = '#5c0d18';
    ctx.beginPath();
    ctx.moveTo(bx + 8, cy + 1);
    ctx.lineTo(bx + 17, cy - 13 + wingFlapY * 1.2);
    ctx.lineTo(bx + 22, cy - 7 + wingFlapY * 0.8);
    ctx.lineTo(bx + 20, cy + 3);
    ctx.closePath();
    ctx.fill();

    // Rogate kościste ramiona skrzydła
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(bx + 9, cy);
    ctx.lineTo(bx + 17, cy - 13 + wingFlapY * 1.2);
    ctx.lineTo(bx + 22, cy - 7 + wingFlapY * 0.8);
    ctx.stroke();

    // Iskry żaru unoszące się z piekielnego nietoperza
    ctx.fillStyle = '#ff6d00';
    const emberTime = (Date.now() * 0.008) % 1;
    ctx.fillRect(bx + 21 + emberTime * 6, cy - 2 + Math.sin(emberTime * 5) * 3, 2, 2);
  }

  // Efekt uderzenia (piórka / obłoczek gdy bird.hitReaction > 0)
  if (bird.hitReaction > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(cx - 8, cy - 4, 2.5, 0, Math.PI * 2);
    ctx.arc(cx + 6, cy + 6, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}