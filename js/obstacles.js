// =========================================================================
// OBSTACLES.JS - WIELOPOZIOMOWE WYSPY ARENY I OBSŁUGA KOLIZJI PLATFORM
// =========================================================================

import { ARENA_LEFT, ARENA_RIGHT, START_X, ARENA_WIDTH } from './config.js';
import {
  triggerScreenShake, triggerGoalCelebration, spawnJetpackSparks,
  resolveSegmentCollision, distToSegment, triggerHitstop,
  spawnBodyGibs, spawnBloodSpurt, spawnDroppedWeapon, spawnGroundPuff,
  registerWorldObstacles, setActiveArenaId, GROUND_Y, world,
  isGroundAt, resetGroundSegments, resetColliders, JUNGLE_CANYON_PROFILE,
  LEFT_MASSIF_AND_RAMP_PROFILE, CENTRAL_HILL_PROFILE, RIGHT_MASSIF_PROFILE,
  getCaveCeilingY, getCaveCeilingInfo, drawCaveTerrain,
  LOWER_CAVERN_FLOOR, LOWER_CAVERN_SHELVES, getLowerCavernCeilingY
} from './world.js';
import { clearExplosionParticles } from './particles.js';

const _arenaResetCallbacks = [];
export function registerArenaResetCallback(cb) {
  if (typeof cb === 'function' && !_arenaResetCallbacks.includes(cb)) {
    _arenaResetCallbacks.push(cb);
  }
}
import { getActiveArena, setActiveArena, ARENAS, onArenaChange } from './arenas/index.js';
import arena1, { ARENA_1_PLATFORMS, ARENA_1_BARRICADES, ARENA_1_GOALS, arena1State, goalTriggerLeft, goalTriggerRight, centerX } from './arenas/arena1.js';
import arena2, {
  ARENA_2_PANDORA_PLATFORMS, ARENA_2_PANDORA_GOALS, applyPandoraUpdraft, checkPandoraUpdraft,
  ARENA_CYBER_STADIUM_PLATFORMS, ARENA_CYBER_STADIUM_BARRICADES, ARENA_CYBER_STADIUM_GOALS
} from './arenas/arena2.js';
import arena3, { ARENA_3_PLATFORMS, ARENA_3_CUSTOM_OBJECTS } from './arenas/arena3.js';

export {
  ARENA_1_PLATFORMS, ARENA_1_BARRICADES, ARENA_1_GOALS, arena1State, goalTriggerLeft, goalTriggerRight, centerX,
  ARENA_2_PANDORA_PLATFORMS, ARENA_2_PANDORA_GOALS, applyPandoraUpdraft, checkPandoraUpdraft,
  ARENA_CYBER_STADIUM_PLATFORMS, ARENA_CYBER_STADIUM_BARRICADES, ARENA_CYBER_STADIUM_GOALS,
  ARENA_3_PLATFORMS, ARENA_3_CUSTOM_OBJECTS,
  getActiveArena, setActiveArena, ARENAS, onArenaChange
};

export const obstacles = [];
export const customObstacles = [];
export let _activePlayer = null;
export let _activeBall = null;
export let _activeBot = null;
export function setActiveBot(b) { _activeBot = b; }

let _onSpawnHitSparks = null;
export function registerHitSparkCallback(fn) { _onSpawnHitSparks = fn; }
export function spawnObstacleSparks(x, y, nx = 0, ny = -1, count = 4) {
  if (typeof _onSpawnHitSparks === 'function') {
    _onSpawnHitSparks(x, y, nx, ny, count);
  }
}

export function normalizeObstacleType(type) {
  if (!type) return '';
  const str = String(type).trim().toLowerCase().replace(/[-_\s]+/g, '');
  if (str === 'sandbag' || str === 'sandbags' || str === 'worki' || str === 'workizpiaskiem') {
    return 'sandbags';
  }
  if (
    str === 'ammo' ||
    str === 'ammocrate' ||
    str === 'ammobox' ||
    str === 'ammodepot' ||
    str === 'crate' ||
    str === 'ammobag' ||
    str === 'skrzynia' ||
    str === 'skrzyniaammo'
  ) {
    return 'ammo_depot';
  }
  return type;
}

export const OBSTACLE_PALETTE = {
  ARENA_1: [
    { type: 'catwalk', name: 'Stalowa Kładka', label: '⛓️ Kładka', category: 'platforms', w: 200, h: 14, isPlatform: true, oneWay: true, anchor: 'top' },
    { type: 'sniper_tower', name: 'Wieża Snajperska', label: '🗼 Ambona', category: 'platforms', w: 90, h: 160, isPlatform: true, oneWay: true, anchor: 'bottom' },
    { type: 'metal_ramp_left', name: 'Rampa Lewa', label: '📐 Rampa L', category: 'platforms', w: 80, h: 40, isPlatform: true, anchor: 'bottom' },
    { type: 'metal_ramp_right', name: 'Rampa Prawa', label: '📐 Rampa P', category: 'platforms', w: 80, h: 40, isPlatform: true, anchor: 'bottom' },
    { type: 'tall_concrete_wall', name: 'Mur Zbrojony', label: '🏛️ Mur', category: 'defense', w: 26, h: 110, solid: true, anchor: 'bottom' },
    { type: 'bunker_block', name: 'Blok Betonowy', label: '🛡️ Blok', category: 'defense', w: 120, h: 40, isPlatform: true, solid: true, anchor: 'bottom' },
    { type: 'sandbags', name: 'Worki z Piaskiem', label: '🧱 Worki', category: 'defense', w: 48, h: 24, isPlatform: true, solid: true, anchor: 'bottom' },
    { type: 'ammo_depot', name: 'Skrzynia Ammo', label: '📦 Ammo', category: 'defense', w: 32, h: 24, isPlatform: true, solid: true, anchor: 'bottom', isPickup: true, isInteractable: true },
    { type: 'explosive_barrel', name: 'Beczka Wybuchowa', label: '💥 Beczka', category: 'traps', w: 22, h: 34, solid: true, anchor: 'bottom' },
    { type: 'barbed_wire', name: 'Drut Kolczasty', label: '🕸️ Drut', category: 'traps', w: 60, h: 18, anchor: 'bottom' },
    { type: 'hedgehog', name: 'Jeż Stalowy', label: '✖️ Jeż', category: 'traps', w: 32, h: 32, size: 32, isHedgehog: true, anchor: 'bottom' }
  ],
  ARENA_2: [
    { type: 'pandora_rock', name: 'Półka Skalna Pandory', label: '🪨 Półka Skalna', category: 'platforms', w: 180, h: 36, isPlatform: true, oneWay: true, anchor: 'top' },
    { type: 'vine_catwalk', name: 'Kładka z Pnączy', label: '🌿 Kładka Pnącza', category: 'platforms', w: 200, h: 20, isPlatform: true, oneWay: true, isVineBridge: true, anchor: 'top' },
    { type: 'floating_island_mini', name: 'Lewitujący Odłamek', label: '🪨 Odłamek Skały', category: 'platforms', w: 120, h: 30, isPlatform: true, oneWay: true, anchor: 'top' },
    { type: 'unobtanium_crystal', name: 'Kryształ Unobtanium', label: '💎 Unobtanium', category: 'defense', w: 40, h: 50, isPlatform: true, solid: true, anchor: 'bottom' },
    { type: 'ammo_depot', name: 'Skrzynia Zaopatrzenia', label: '📦 Ammo', category: 'defense', w: 32, h: 24, isPlatform: true, solid: true, anchor: 'bottom', isPickup: true, isInteractable: true },
    { type: 'spore_pod', name: 'Zarodnik Wybuchowy', label: '🍄 Zarodnik', category: 'traps', w: 30, h: 30, solid: true, anchor: 'bottom' },
    { type: 'updraft_vent', name: 'Prąd Termiczny', label: '💨 Termika', category: 'traps', w: 70, h: 180, isUpdraft: true, anchor: 'bottom' },
    { type: 'jump_pad', name: 'Sprężyste Pnącze', label: '🚀 Skocznia', category: 'traps', w: 70, h: 14, isPlatform: true, isJumpPad: true, anchor: 'bottom' }
  ],
  ARENA_3: [
    { type: 'jungle_rock', name: 'Półka Skalna (Dżungla)', label: '🪨 Skalna Półka', category: 'platforms', w: 180, h: 40, isPlatform: true, oneWay: true, anchor: 'top' },
    { type: 'sandbags', name: 'Bunkier z Worków', label: '🧱 Worki', category: 'defense', w: 56, h: 26, isPlatform: true, solid: true, anchor: 'bottom' },
    { type: 'wooden_ladder', name: 'Drabina Drewniana', label: '🪜 Drabina', category: 'platforms', w: 32, h: 180, isPlatform: true, oneWay: true, anchor: 'bottom' },
    { type: 'jungle_hut', name: 'Strażnica na Palach', label: '🛖 Strażnica', category: 'platforms', w: 110, h: 100, isPlatform: true, oneWay: true, anchor: 'bottom' },
    { type: 'ammo_depot', name: 'Skrzynia Zaopatrzenia', label: '📦 Ammo', category: 'defense', w: 32, h: 24, isPlatform: true, solid: true, anchor: 'bottom', isPickup: true, isInteractable: true },
    { type: 'explosive_barrel', name: 'Beczka Paliwa', label: '💥 Beczka', category: 'traps', w: 24, h: 36, solid: true, anchor: 'bottom' },
    { type: 'catwalk', name: 'Kładka / Most Linowy', label: '🪵 Kładka', category: 'platforms', w: 180, h: 16, isPlatform: true, oneWay: true, anchor: 'top' },
    { type: 'jump_pad', name: 'Wyrzutnia Gejzer', label: '💨 Gejzer', category: 'traps', w: 60, h: 14, isPlatform: true, isJumpPad: true, anchor: 'bottom' }
  ]
};

export function getObstacleDef(type) {
  if (!type) return null;
  const norm = normalizeObstacleType(type);
  for (const arenaKey of ['ARENA_1', 'ARENA_2', 'ARENA_3']) {
    if (!OBSTACLE_PALETTE[arenaKey]) continue;
    const found = OBSTACLE_PALETTE[arenaKey].find(
      d => d.type === type || d.type === norm || normalizeObstacleType(d.type) === norm
    );
    if (found) {
      const copy = { ...found };
      if (norm === 'ammo_depot') {
        copy.w = copy.w || 32;
        copy.h = copy.h || 24;
        if (copy.isPickup === undefined) copy.isPickup = true;
        if (copy.isInteractable === undefined) copy.isInteractable = true;
      } else if (norm === 'sandbags') {
        copy.w = copy.w || 48;
        copy.h = copy.h || 24;
      }
      return copy;
    }
  }
  if (norm === 'ammo_depot') {
    return {
      type: type || 'ammo_depot',
      name: 'Skrzynia Ammo',
      label: '📦 Ammo',
      category: 'defense',
      w: 32,
      h: 24,
      isPlatform: true,
      solid: true,
      anchor: 'bottom',
      isPickup: true,
      isInteractable: true
    };
  }
  if (norm === 'sandbags') {
    return {
      type: type || 'sandbags',
      name: 'Worki z Piaskiem',
      label: '🧱 Worki',
      category: 'defense',
      w: 48,
      h: 24,
      isPlatform: true,
      solid: true,
      anchor: 'bottom'
    };
  }
  return null;
}

export function isBottomAnchored(def) {
  if (!def) return false;
  if (def.anchor === 'bottom') return true;
  if (def.anchor === 'top' || def.anchor === 'center') return false;
  const norm = normalizeObstacleType(def.type);
  if (norm === 'sandbags' || norm === 'ammo_depot') return true;
  if (def.type === 'catwalk' || def.type === 'cyber_catwalk' || def.type === 'floating_hex') {
    return false;
  }
  return true;
}

/**
 * Znajduje najbliższą powierzchnię (platformę, grunt lub przeszkodę) pod dolną krawędzią obiektu w zasięgu snapThreshold.
 */
export function findSupportingSurface(px, bottomY, w, h, groundY = GROUND_Y, snapThreshold = 16, platforms = ARENA_PLATFORMS, obstacles = customObstacles, rawBottomY = null) {
  if (snapThreshold <= 0) return null;

  const minOverlap = Math.min(6, w * 0.25);
  const candidates = [];

  const checkCandidate = (surfaceY, type, name = '') => {
    const dist1 = Math.abs(bottomY - surfaceY);
    const dist2 = (rawBottomY !== null && rawBottomY !== undefined) ? Math.abs(rawBottomY - surfaceY) : dist1;
    const dist = Math.min(dist1, dist2);

    if (dist <= snapThreshold) {
      candidates.push({ y: surfaceY, dist, type, name });
    }
  };

  // 1. Grunt (GROUND_Y) – sprawdzamy tylko jeśli segment podłoża jest nienaruszony
  if (typeof isGroundAt !== 'function' || isGroundAt(px + w * 0.5)) {
    checkCandidate(groundY, 'ground', 'Grunt');
  }

  // 2. Platformy areny (ARENA_PLATFORMS)
  if (Array.isArray(platforms)) {
    for (const plat of platforms) {
      const platLeft = plat.x;
      const platRight = plat.x + plat.w;
      const overlap = Math.min(px + w, platRight) - Math.max(px, platLeft);

      if (overlap >= minOverlap) {
        const platTopY = (plat.isSlope || plat.type === 'ramp' || plat.surfacePoints)
          ? getPlatformSurfaceY(plat, px + w * 0.5, groundY)
          : (plat.y !== undefined ? plat.y : (groundY - plat.relY));
        checkCandidate(platTopY, 'platform', plat.name || plat.type || 'Platforma');

        if (plat.props && Array.isArray(plat.props)) {
          for (const prop of plat.props) {
            if (prop.type === 'altar_pedestal') {
              const propLeft = plat.x + (prop.rx || 0);
              const propRight = propLeft + prop.w;
              const propOverlap = Math.min(px + w, propRight) - Math.max(px, propLeft);
              if (propOverlap >= minOverlap) {
                const propTopY = platTopY - prop.h;
                checkCandidate(propTopY, 'prop', 'Piedestał Ołtarza');
              }
            }
          }
        }
      }
    }
  }

  // 3. Postawione przeszkody (customObstacles)
  if (Array.isArray(obstacles)) {
    for (const obs of obstacles) {
      if (!obs || obs.team || obs.holeCx !== undefined || obs.id?.startsWith('goal') || obs.type === 'goal') {
        continue;
      }
      const obsLeft = obs.x;
      const obsRight = obs.x + obs.w;
      const overlap = Math.min(px + w, obsRight) - Math.max(px, obsLeft);

      if (overlap >= minOverlap) {
        const obsTopY = obs.y !== undefined ? obs.y : (groundY - obs.relY);

        if (obs.type === 'metal_ramp_left') {
          const cx = px + w / 2;
          const t = Math.max(0, Math.min(1, (cx - obs.x) / obs.w));
          const rampY = obsTopY + t * obs.h;
          checkCandidate(rampY, 'ramp', 'Rampa Lewa');
        } else if (obs.type === 'metal_ramp_right') {
          const cx = px + w / 2;
          const t = Math.max(0, Math.min(1, (cx - obs.x) / obs.w));
          const rampY = obsTopY + (1 - t) * obs.h;
          checkCandidate(rampY, 'ramp', 'Rampa Prawa');
        } else {
          checkCandidate(obsTopY, 'obstacle', obs.name || obs.type || 'Przeszkoda');
        }
      }
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => a.dist - b.dist || a.y - b.y);
  return candidates[0];
}

/**
 * Oblicza dokładne współrzędne położenia obiektu w edytorze uwzględniając siatkę, Bottom Anchor i Surface Magnet.
 */
export function calculateObstaclePlacement(def, worldX, worldY, options = {}) {
  if (!def) {
    return {
      x: Math.round(worldX),
      y: Math.round(worldY),
      w: 40,
      h: 20,
      bottomY: Math.round(worldY) + 20,
      isSnappedToSurface: false,
      surfaceY: null,
      surfaceName: ''
    };
  }

  const snapToGrid = options.snapToGrid !== undefined ? options.snapToGrid : true;
  const gridSize = options.gridSize || 20;
  const groundY = options.groundY !== undefined ? options.groundY : (typeof GROUND_Y === 'number' ? GROUND_Y : 500);
  const snapThreshold = options.surfaceSnapActive === false ? 0 : (options.snapThreshold !== undefined ? options.snapThreshold : 16);
  const platforms = options.platforms || ARENA_PLATFORMS;
  const obstacles = options.obstacles || customObstacles;

  const norm = normalizeObstacleType(def.type);
  let defaultW = 40;
  let defaultH = 20;
  if (norm === 'ammo_depot') {
    defaultW = 32;
    defaultH = 24;
  } else if (norm === 'sandbags') {
    defaultW = 48;
    defaultH = 24;
  }
  const w = (def.w && def.w > 0) ? def.w : defaultW;
  const h = (def.h && def.h > 0) ? def.h : defaultH;

  // 1. Wyrównanie poziome X (wyśrodkowane wokół kursora)
  const rawX = worldX - w / 2;
  const px = snapToGrid ? Math.round(rawX / gridSize) * gridSize : Math.round(rawX);

  // 2. Wyrównanie pionowe Y (Bottom Anchor dla obiektów stojących, Top Anchor dla platform)
  const isBottom = isBottomAnchored(def);
  const rawBottom = worldY + h / 2;
  const rawTop = worldY - h / 2;
  let py;

  if (isBottom) {
    // Obiekty stojące na ziemi / platformach: przyciągaj DOLNĄ krawędź (y + h) do linii siatki Y
    if (snapToGrid) {
      const snappedBottom = Math.round((rawBottom - groundY) / gridSize) * gridSize + groundY;
      py = snappedBottom - h;
    } else {
      py = Math.round(worldY - h / 2);
    }
  } else if (def.anchor === 'center') {
    if (snapToGrid) {
      const snappedCenter = Math.round((worldY - groundY) / gridSize) * gridSize + groundY;
      py = snappedCenter - h / 2;
    } else {
      py = Math.round(worldY - h / 2);
    }
  } else {
    // Platformy / kładki (np. catwalk): przyciągaj GÓRNĄ krawędź chodu (y) do linii siatki Y
    if (snapToGrid) {
      const snappedTop = Math.round((rawTop - groundY) / gridSize) * gridSize + groundY;
      py = snappedTop;
    } else {
      py = Math.round(worldY - h / 2);
    }
  }

  // 3. Inteligentne przyciąganie do powierzchni (Surface Snapping / Magnet)
  // Sprawdź czy pod dolną krawędzią znajduje się platforma lub grunt w odległości < snapThreshold
  let isSnappedToSurface = false;
  let surfaceY = null;
  let surfaceName = '';

  if (snapThreshold > 0) {
    const bottomY = py + h;
    const surface = findSupportingSurface(px, bottomY, w, h, groundY, snapThreshold, platforms, obstacles, rawBottom);
    if (surface) {
      // Ustaw pionową pozycję obiektu dokładnie tak, aby jego dolna krawędź przylegała do krawędzi platformy:
      // object.y = platform.y - object.height;
      py = surface.y - h;
      isSnappedToSurface = true;
      surfaceY = surface.y;
      surfaceName = surface.name;
    }
  }

  return {
    x: px,
    y: py,
    w,
    h,
    bottomY: py + h,
    isSnappedToSurface,
    surfaceY,
    surfaceName
  };
}

export function clearCustomObstacles() {
  customObstacles.length = 0;
}

export function undoCustomObstacle() {
  return customObstacles.pop();
}

export function setCustomObstacles(newList) {
  customObstacles.length = 0;
  obstacles.length = 0;
  if (Array.isArray(newList)) {
    for (const obs of newList) {
      if (obs) {
        const norm = normalizeObstacleType(obs.type);
        if (!obs.w || obs.w <= 0) {
          obs.w = norm === 'ammo_depot' ? 32 : (norm === 'sandbags' ? 48 : 40);
        }
        if (!obs.h || obs.h <= 0) {
          obs.h = norm === 'ammo_depot' ? 24 : (norm === 'sandbags' ? 24 : 20);
        }
        if (norm === 'ammo_depot') {
          if (obs.isPickup === undefined) obs.isPickup = true;
          if (obs.isInteractable === undefined) obs.isInteractable = true;
        }
        customObstacles.push(obs);
        obstacles.push(obs);
      }
    }
  }
}

// ARENA 1 & ARENA 2 geometrie i obiekty zaimportowane autonomicznie z js/arenas/arena1.js i arena2.js
const altarShockwaves = [];
export function spawnAltarShockwave(x, y) {
  altarShockwaves.push({
    x,
    y,
    radius: 12,
    maxRadius: 95,
    alpha: 1.0,
    color: '#00e5ff'
  });
}



// =========================================================================
// =========================================================================
// ARENA 3: KANYON W DŻUNGLI / JUNGLE CANYON (3600x1300)
// =========================================================================
// ARENA 3: PODZIEMNA KOPALNIA I SZTOLNIE / MINING CAVERN & SHAFTS (3600x1300)
// =========================================================================

export const ARENA_FOUNDRY_WALLS = [
  // 1. Lewa pionowa ściana mostu skalnego przy wejściu do lewego szybu / rampy
  // Od szczytu mostu (y: 580) w dół do stropu pieczary (y: 780). Poniżej y: 780 przestrzeń otwarta!
  {
    id: 'left_shaft_bridge_wall',
    name: 'Ściana Pomostu Lewego Szybu',
    x: 944,
    y: 580,
    w: 12,
    h: 200,
    solid: true,
    isWall: true,
    pushSide: 'left'
  },
  // 2. Prawa pionowa ściana mostu skalnego przy zejściu do prawego szybu
  // Od krawędzi mostu (y: 580) w dół do stropu pieczary (y: 780). Poniżej y: 780 przestrzeń otwarta!
  {
    id: 'right_shaft_bridge_wall',
    name: 'Ściana Pomostu Prawego Szybu',
    x: 2294,
    y: 580,
    w: 12,
    h: 200,
    solid: true,
    isWall: true,
    pushSide: 'right'
  },
  // 3. Pionowa lita ściana urwiska skalnego po prawej stronie szybu
  // Od krawędzi prawego masywu (y: 580) w dół do samego spągu jaskini (y: 1180)
  {
    id: 'right_shaft_cliff_wall',
    name: 'Ściana Urwiska Prawego Szybu',
    x: 2476,
    y: 580,
    w: 16,
    h: 600,
    solid: true,
    isWall: true,
    pushSide: 'left'
  }
];

export const ARENA_FOUNDRY_PLATFORMS = ARENA_3_PLATFORMS;

export const ladders = [];

export const ARENA_FOUNDRY_BARRICADES = [];

export const ARENA_FOUNDRY_GOALS = ARENA_3_CUSTOM_OBJECTS.filter(o => o.team);

const _initArena = getActiveArena();
export let activeArenaId = (_initArena && _initArena.id === 'arena-3') ? 'ARENA_3' : ((_initArena && _initArena.id === 'arena-2') ? 'ARENA_2' : 'ARENA_1');
setActiveArenaId(activeArenaId);
export const ARENA_PLATFORMS = [...(_initArena?.platforms || ARENA_1_PLATFORMS)];
export const GROUND_BARRICADES = [...ARENA_1_BARRICADES];
export const GOALS = [...((_initArena && _initArena.id === 'arena-3') ? ARENA_FOUNDRY_GOALS : ((_initArena && _initArena.id === 'arena-2') ? ARENA_CYBER_STADIUM_GOALS : ARENA_1_GOALS))];
if (_initArena && Array.isArray(_initArena.customObjects)) {
  customObstacles.push(..._initArena.customObjects);
}
export const arenaScore = { cyan: 0, orange: 0 };
export let goalCelebrationTimer = 0;

// Subskrypcja zmian areny dla natychmiastowej synchronizacji platform i obiektów
onArenaChange((newArena) => {
  if (newArena && (newArena.id === 'arena-3' || newArena.id === 'ARENA_3')) {
    activeArenaId = 'ARENA_3';
  } else if (newArena && (newArena.id === 'arena-2' || newArena.id === 'ARENA_2')) {
    activeArenaId = 'ARENA_2';
  } else {
    activeArenaId = 'ARENA_1';
  }
  setActiveArenaId(activeArenaId);

  ARENA_PLATFORMS.length = 0;
  if (newArena && Array.isArray(newArena.platforms)) {
    ARENA_PLATFORMS.push(...newArena.platforms);
  }
  customObstacles.length = 0;
  if (newArena && Array.isArray(newArena.customObjects)) {
    customObstacles.push(...newArena.customObjects);
  }

  GOALS.length = 0;
  if (activeArenaId === 'ARENA_3') {
    const a3Goals = (newArena && newArena.customObjects) ? newArena.customObjects.filter(o => o.team) : ARENA_FOUNDRY_GOALS;
    GOALS.push(...(a3Goals.length > 0 ? a3Goals : ARENA_FOUNDRY_GOALS));
  } else if (activeArenaId === 'ARENA_2') {
    const a2Goals = (newArena && newArena.customObjects) ? newArena.customObjects.filter(o => o.team) : ARENA_CYBER_STADIUM_GOALS;
    GOALS.push(...(a2Goals.length > 0 ? a2Goals : ARENA_CYBER_STADIUM_GOALS));
  } else {
    GOALS.push(...ARENA_1_GOALS);
  }
});

registerWorldObstacles(ARENA_PLATFORMS, customObstacles, {
  get activeArenaId() { return activeArenaId; },
  arenaScore,
  arena1State
});

export function setGoalCelebrationTimer(val) {
  goalCelebrationTimer = val;
}

export let arenaSnapshot = {
  arena1Platforms: JSON.parse(JSON.stringify(ARENA_1_PLATFORMS)),
  arena2Platforms: JSON.parse(JSON.stringify(ARENA_CYBER_STADIUM_PLATFORMS)),
  arena3Platforms: JSON.parse(JSON.stringify(ARENA_FOUNDRY_PLATFORMS)),
  customObstacles: []
};

export function saveArenaSnapshot() {
  arenaSnapshot = {
    arena1Platforms: JSON.parse(JSON.stringify(ARENA_1_PLATFORMS)),
    arena2Platforms: JSON.parse(JSON.stringify(ARENA_CYBER_STADIUM_PLATFORMS)),
    arena3Platforms: JSON.parse(JSON.stringify(ARENA_FOUNDRY_PLATFORMS)),
    customObstacles: JSON.parse(JSON.stringify(customObstacles))
  };
  if (typeof world !== 'undefined' && world) {
    world.initialState = arenaSnapshot;
  }
}

export function resetArena() {
  if (!arenaSnapshot) {
    saveArenaSnapshot();
  }

  ARENA_PLATFORMS.length = 0;
  if (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY') {
    ARENA_PLATFORMS.push(...JSON.parse(JSON.stringify(arenaSnapshot.arena3Platforms)));
  } else if (activeArenaId === 'ARENA_2') {
    ARENA_PLATFORMS.push(...JSON.parse(JSON.stringify(arenaSnapshot.arena2Platforms)));
  } else {
    ARENA_PLATFORMS.push(...JSON.parse(JSON.stringify(arenaSnapshot.arena1Platforms)));
  }

  for (const cb of _arenaResetCallbacks) {
    try {
      cb();
    } catch (e) {
      console.warn('Error in arena reset callback:', e);
    }
  }
  clearExplosionParticles();
  if (typeof resetGroundSegments === 'function') {
    resetGroundSegments();
  }

  if (activeArenaId === 'ARENA_1') {
    if (_activePlayer) {
      _activePlayer.x = 240;
      _activePlayer.y = 580;
      _activePlayer.vx = 0;
      _activePlayer.vy = 0;
      _activePlayer.facing = 1;
      _activePlayer.isIntro = false;
      _activePlayer.gaitMode = 'IDLE';
    }
    if (_activeBot) {
      _activeBot.x = 3360;
      _activeBot.y = 580;
      _activeBot.vx = 0;
      _activeBot.vy = 0;
      _activeBot.facing = -1;
      _activeBot.gaitMode = 'IDLE';
    }
  }
}

if (typeof world !== 'undefined' && world) {
  world.initialState = arenaSnapshot;
  world.resetArena = resetArena;
  world.saveInitialState = saveArenaSnapshot;
  Object.defineProperty(world, 'platforms', {
    get() { return ARENA_PLATFORMS; },
    set(v) {
      if (Array.isArray(v)) {
        ARENA_PLATFORMS.length = 0;
        ARENA_PLATFORMS.push(...v);
      }
    },
    configurable: true
  });
}


export function switchArena(arenaId, playerObj, botObj, ballObj) {
  setActiveArena(arenaId);
  const currentArena = getActiveArena();
  if (currentArena.id === 'arena-3') {
    activeArenaId = 'ARENA_3';
  } else if (currentArena.id === 'arena-2') {
    activeArenaId = 'ARENA_2';
  } else {
    activeArenaId = 'ARENA_1';
  }
  setActiveArenaId(activeArenaId);

  // Całkowity reset i czyszczenie koliderów fizyki, aby nie zostały niewidzialne przeszkody
  if (typeof resetColliders === 'function') {
    resetColliders();
  }
  ARENA_PLATFORMS.length = 0;
  GROUND_BARRICADES.length = 0;
  GOALS.length = 0;
  customObstacles.length = 0;

  if (currentArena && Array.isArray(currentArena.platforms)) {
    ARENA_PLATFORMS.push(...currentArena.platforms);
    if (activeArenaId === 'ARENA_3') {
      arenaSnapshot.arena3Platforms = JSON.parse(JSON.stringify(currentArena.platforms));
    }
  }

  const groundY = (typeof window !== 'undefined' && window.innerHeight) ? (Math.round((window.innerHeight - 75) / 20) * 20) : (typeof GROUND_Y === 'number' ? GROUND_Y : 500);
  const targetBot = botObj || _activeBot;

  if (activeArenaId === 'ARENA_3') {
    GROUND_BARRICADES.push(...ARENA_FOUNDRY_BARRICADES);
    GOALS.length = 0; // W militarnej dżungli brak piłki i bramek - czysty tryb taktyczny / Deathmatch
    arena1State.waitingForKickoff = false;
    arenaScore.cyan = 0;
    arenaScore.orange = 0;

    if (typeof currentArena?.reset === 'function') {
      currentArena.reset();
    }

    if (playerObj) {
      playerObj.x = (currentArena.spawns && currentArena.spawns[0]) ? currentArena.spawns[0].x : 600;
      playerObj.y = (currentArena.spawns && currentArena.spawns[0]) ? currentArena.spawns[0].y : 1130;
      playerObj.vx = 0;
      playerObj.vy = 0;
      playerObj.facing = 1;
      playerObj.isIntro = false;
      playerObj.isJumping = false;
      playerObj.isSliding = false;
      playerObj.gaitMode = 'IDLE';
    }
    if (targetBot) {
      targetBot.active = true;
      targetBot.x = (currentArena.spawns && currentArena.spawns[1]) ? currentArena.spawns[1].x : 3350;
      targetBot.y = (currentArena.spawns && currentArena.spawns[1]) ? currentArena.spawns[1].y : 1130;
      targetBot.vx = 0;
      targetBot.vy = 0;
      targetBot.facing = -1;
      targetBot.isJumping = false;
      targetBot.isSliding = false;
      targetBot.gaitMode = 'IDLE';
    }
    if (ballObj) {
      ballObj.active = false;
    }
  } else if (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA') {
    GOALS.length = 0; // W Świętej Dżungli brak bramek i piłki - tryb czystej mapy i walki
    arena1State.waitingForKickoff = false;
    arenaScore.cyan = 0;
    arenaScore.orange = 0;

    if (playerObj) {
      playerObj.x = (currentArena.spawns && currentArena.spawns[0]) ? currentArena.spawns[0].x : 500;
      playerObj.y = (currentArena.spawns && currentArena.spawns[0]) ? currentArena.spawns[0].y : 710;
      playerObj.vx = 0;
      playerObj.vy = 0;
      playerObj.facing = 1;
      playerObj.isIntro = false;
      playerObj.isJumping = false;
      playerObj.isSliding = false;
      playerObj.gaitMode = 'IDLE';
    }
    if (targetBot) {
      // Bot nie pojawia się samoczynnie – aktywacja wyłącznie przez panel dev
      targetBot.x = (currentArena.spawns && currentArena.spawns[1]) ? currentArena.spawns[1].x : 3060;
      targetBot.y = (currentArena.spawns && currentArena.spawns[1]) ? currentArena.spawns[1].y : 710;
      targetBot.vx = 0;
      targetBot.vy = 0;
      targetBot.facing = -1;
      targetBot.isJumping = false;
      targetBot.isSliding = false;
      targetBot.gaitMode = 'IDLE';
    }
    if (ballObj) {
      ballObj.active = false;
      ballObj.isLevitating = false;
      ballObj.goalAnimation = null;
      ballObj.x = -9999;
      ballObj.y = -9999;
      ballObj.prevX = -9999;
      ballObj.prevY = -9999;
      ballObj.vx = 0;
      ballObj.vy = 0;
      ballObj.spin = 0;
      ballObj.trail = [];
    }
  } else {
    GROUND_BARRICADES.push(...ARENA_1_BARRICADES);
    GOALS.push(...ARENA_1_GOALS);

    arena1State.waitingForKickoff = true;
    arena1State.kickoffCooldown = 0;

    const _cX = ARENA_WIDTH / 2; // 1800
    const _altarX = arena1State.altarX || _cX;
    const _altarY = arena1State.altarY || 760;
    const _spawnBallY = _altarY - (ballObj?.radius || 8) - 2; // 750

    if (playerObj) {
      playerObj.x = (currentArena.spawns && currentArena.spawns[0]) ? currentArena.spawns[0].x : 240;
      playerObj.y = (currentArena.spawns && currentArena.spawns[0]) ? currentArena.spawns[0].y : 580;
      playerObj.vx = 0;
      playerObj.vy = 0;
      playerObj.facing = 1;
      playerObj.isIntro = false;
      playerObj.juggleTimer = 0;
      playerObj.isJumping = false;
      playerObj.isSliding = false;
      playerObj.gaitMode = 'IDLE';
    }
    if (targetBot) {
      targetBot.x = (currentArena.spawns && currentArena.spawns[1]) ? currentArena.spawns[1].x : 3360;
      targetBot.y = (currentArena.spawns && currentArena.spawns[1]) ? currentArena.spawns[1].y : 580;
      targetBot.vx = 0;
      targetBot.vy = 0;
      targetBot.facing = -1;
      targetBot.isJumping = false;
      targetBot.isSliding = false;
      targetBot.gaitMode = 'IDLE';
    }
    if (ballObj) {
      ballObj.isLevitating = false;
      ballObj.goalAnimation = null;
      ballObj.x = _altarX;
      ballObj.y = _spawnBallY;
      ballObj.prevX = ballObj.x;
      ballObj.prevY = ballObj.y;
      ballObj.vx = 0;
      ballObj.vy = 0;
      ballObj.spin = 0;
      ballObj.trail = [];
    }
  }

  return activeArenaId;
}

export function getPlatformBounds(plat) {
  if (!plat) return { minX: 0, maxX: 0, minY: 0, maxY: 0, cx: 0, cy: 0 };
  const thick = plat.h || plat.thickness || 20;
  if (plat.angle && Math.abs(plat.angle) > 0.01) {
    const cx = plat.x + plat.w / 2;
    const cy = plat.y + thick / 2;
    const cosA = Math.abs(Math.cos(plat.angle));
    const sinA = Math.abs(Math.sin(plat.angle));
    const hw = plat.w / 2;
    const hh = thick / 2;
    const halfBoxW = hw * cosA + hh * sinA;
    const halfBoxH = hw * sinA + hh * cosA;
    return {
      minX: cx - halfBoxW,
      maxX: cx + halfBoxW,
      minY: cy - halfBoxH,
      maxY: cy + halfBoxH,
      cx,
      cy
    };
  }
  const topY = (plat.y !== undefined) ? plat.y : 0;
  return {
    minX: plat.x,
    maxX: plat.x + plat.w,
    minY: topY,
    maxY: topY + thick,
    cx: plat.x + plat.w / 2,
    cy: topY + thick / 2
  };
}

export function getPlatformSurfaceInfo(plat, px, groundY) {
  if (!plat) {
    return { surfaceY: groundY, slope: 0, nx: 0, ny: -1, angle: 0 };
  }

  const getPtY = (pt) => (pt && pt.y !== undefined ? pt.y : (groundY - ((pt && pt.relY) || 0)));

  // Obsługa wielokątnych platform o zmiennym profilu (organic multi-segment slopes)
  if (Array.isArray(plat.surfacePoints) && plat.surfacePoints.length >= 2) {
    const pts = plat.surfacePoints;
    if (px <= pts[0].x) {
      const dx = pts[1].x - pts[0].x;
      const dy = getPtY(pts[1]) - getPtY(pts[0]);
      const slope = -dy / (dx || 1);
      const len = Math.hypot(dx, dy) || 1;
      return {
        surfaceY: getPtY(pts[0]),
        slope,
        nx: dy / len,
        ny: -dx / len,
        angle: Math.atan2(dy, dx)
      };
    }
    if (px >= pts[pts.length - 1].x) {
      const p0 = pts[pts.length - 2];
      const p1 = pts[pts.length - 1];
      const dx = p1.x - p0.x;
      const dy = getPtY(p1) - getPtY(p0);
      const slope = -dy / (dx || 1);
      const len = Math.hypot(dx, dy) || 1;
      return {
        surfaceY: getPtY(p1),
        slope,
        nx: dy / len,
        ny: -dx / len,
        angle: Math.atan2(dy, dx)
      };
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      if (px >= p0.x && px <= p1.x) {
        const dx = p1.x - p0.x;
        const y0 = getPtY(p0);
        const y1 = getPtY(p1);
        const dy = y1 - y0;
        const t = dx > 0 ? (px - p0.x) / dx : 0;
        const curY = y0 + t * dy;
        const slope = -dy / (dx || 1);
        const len = Math.hypot(dx, dy) || 1;
        return {
          surfaceY: curY,
          slope,
          nx: dy / len,
          ny: -dx / len,
          angle: Math.atan2(dy, dx)
        };
      }
    }
  }

  if (plat.isSlope || plat.type === 'ramp') {
    const dx = plat.w || 1;
    let y0 = plat.startY !== undefined ? plat.startY : (groundY - (plat.startRelY || 0));
    let y1 = plat.endY !== undefined ? plat.endY : (groundY - (plat.endRelY || 0));
    if (plat.startY === undefined && plat.startRelY === undefined) {
      if (plat.id === 'ramp_left') {
        y0 = (plat.y !== undefined ? plat.y : 800) + (plat.h || 100);
        y1 = (plat.y !== undefined ? plat.y : 800);
      } else if (plat.id === 'ramp_right') {
        y0 = (plat.y !== undefined ? plat.y : 800);
        y1 = (plat.y !== undefined ? plat.y : 800) + (plat.h || 100);
      }
    }
    const dy = y1 - y0;
    const t = Math.max(0, Math.min(1, (px - plat.x) / dx));
    const curY = y0 + t * dy;
    const slope = -dy / dx;
    const len = Math.hypot(dx, dy) || 1;
    return {
      surfaceY: curY,
      slope,
      nx: -dy / len,
      ny: -dx / len,
      angle: Math.atan2(dy, dx)
    };
  }

  // Obsługa obróconych klocków i odłamków (Fallen Debris OBB)
  if (plat.angle && Math.abs(plat.angle) > 0.01) {
    const thick = plat.h || plat.thickness || 20;
    const cx = plat.x + plat.w / 2;
    const cy = plat.y + thick / 2;
    const cosA = Math.cos(plat.angle);
    const sinA = Math.sin(plat.angle);
    const hw = plat.w / 2;
    const hh = thick / 2;

    const corners = [
      { x: -hw * cosA - -hh * sinA + cx, y: -hw * sinA + -hh * cosA + cy },
      { x:  hw * cosA - -hh * sinA + cx, y:  hw * sinA + -hh * cosA + cy },
      { x:  hw * cosA -  hh * sinA + cx, y:  hw * sinA +  hh * cosA + cy },
      { x: -hw * cosA -  hh * sinA + cx, y: -hw * sinA +  hh * cosA + cy }
    ];

    let bestY = null;
    let bestSlope = 0;
    for (let i = 0; i < 4; i++) {
      const p1 = corners[i];
      const p2 = corners[(i + 1) % 4];
      const minSegX = Math.min(p1.x, p2.x);
      const maxSegX = Math.max(p1.x, p2.x);
      if (px >= minSegX - 1.0 && px <= maxSegX + 1.0) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        let yAtPx;
        if (Math.abs(dx) < 0.001) {
          yAtPx = Math.min(p1.y, p2.y);
        } else {
          const t = Math.max(0, Math.min(1, (px - p1.x) / dx));
          yAtPx = p1.y + t * dy;
        }
        if (bestY === null || yAtPx < bestY) {
          bestY = yAtPx;
          bestSlope = dx !== 0 ? -dy / dx : 0;
        }
      }
    }
    if (bestY !== null) {
      return {
        surfaceY: bestY,
        slope: bestSlope,
        nx: 0,
        ny: -1,
        angle: plat.angle
      };
    }
  }

  return {
    surfaceY: (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0)),
    slope: 0,
    nx: 0,
    ny: -1,
    angle: 0
  };
}

export function getPlatformSurfaceY(plat, px, groundY) {
  return getPlatformSurfaceInfo(plat, px, groundY).surfaceY;
}

// =========================================================================
// SYSTEM EKSPLOZJI BECZEK I CZĄSTECZEK OGNIOWYCH
// =========================================================================
export const barrelExplosionParticles = [];

export function spawnBarrelExplosion(cx, cy) {
  for (let i = 0; i < 28; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 7.5 + 2.5;
    barrelExplosionParticles.push({
      type: 'fire',
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.8,
      size: Math.random() * 8 + 6,
      life: 1.0,
      decay: Math.random() * 0.035 + 0.025,
      color: Math.random() < 0.4 ? '#f97316' : (Math.random() < 0.7 ? '#ef4444' : '#facc15')
    });
  }
  for (let i = 0; i < 16; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3.5 + 1.0;
    barrelExplosionParticles.push({
      type: 'smoke',
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2.8,
      size: Math.random() * 14 + 8,
      life: 1.0,
      decay: Math.random() * 0.02 + 0.015,
      color: '#334155'
    });
  }
  spawnAltarShockwave(cx, cy);
}

export function updateBarrelExplosionParticles() {
  for (let i = barrelExplosionParticles.length - 1; i >= 0; i--) {
    const p = barrelExplosionParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.94;
    p.vy *= 0.94;
    if (p.type === 'smoke') {
      p.vy -= 0.04;
      p.size += 0.25;
    }
    p.life -= p.decay;
    if (p.life <= 0) {
      barrelExplosionParticles.splice(i, 1);
    }
  }
}

export function drawBarrelExplosionParticles(ctx) {
  for (const p of barrelExplosionParticles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    if (p.type === 'fire') {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 0;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, p.size * p.life), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// Procedura obsługi zgonu od eksplozji (całkowity gibbing vs wyrzut całego ciała)
function applyExplosionToEntity(ent, cx, cy, radius, maxDmg, groundY) {
  if (!ent || ent.isDead) return;

  const ex = ent.x + ent.w / 2;
  const ey = ent.y + ent.h / 2;
  const distE = Math.hypot(ex - cx, ey - cy);

  if (distE <= radius) {
    const dmg = Math.round(maxDmg * (1 - distE / radius * 0.45));
    ent.hp = Math.max(0, (ent.hp !== undefined ? ent.hp : 100) - dmg);

    const nx = distE > 0.001 ? (ex - cx) / distE : (Math.random() < 0.5 ? -1 : 1);
    const push = (1 - distE / radius) * 16 + 8;

    ent.vx += nx * push;
    ent.vy = -Math.abs(push * 0.85) - 5.5;
    ent.isJumping = true;

    if (ent.hp <= 0 && !ent.isDead) {
      ent.isDead = true;
      ent.respawnTimer = 180;
      ent.corpseAngle = 0;
      ent.corpseFloorY = groundY;

      // Upuszczenie broni
      if (ent.currentWeapon) {
        spawnDroppedWeapon(
          ent.x + ent.w / 2,
          ent.y + 24,
          nx * 5.0,
          -6.0,
          ent.currentWeapon,
          ent.facing
        );
      }

      // WARUNEK: Strefa bezpośrednia (<= 65 px) = CAŁKOWITE ROZCZŁONKOWANIE (Gibbing)
      if (distE <= 65) {
        ent.isGibbed = true;
        ent.hasHead = false;
        ent.decapitated = false;

        triggerHitstop(6);
        triggerScreenShake(20);

        spawnBodyGibs(
          ent.x + ent.w / 2,
          ent.y + ent.h / 2,
          ent.facing,
          ent.currentClass?.visuals
        );
      } else {
        // WARUNEK: Strefa fali (65 - 120 px) = BRAK ROZCZŁONKOWANIA (całe ciało leci wysoko w powietrze)
        ent.isGibbed = false;
        ent.hasHead = true;
        ent.decapitated = false;
        ent.neckFountainTimer = 0;

        // Katapultowanie w górę z mocnym koziołkowaniem
        ent.vy = -13.5 - Math.random() * 3.5;
        ent.corpseRotVel = nx * (0.16 + Math.random() * 0.12);

        triggerHitstop(3);
        triggerScreenShake(12);

        spawnBloodSpurt(ex, ey, nx, -1, 15, 1.2);
      }
    }
  }
}

export function explodeBarrel(barrel, groundY) {
  if (!barrel || barrel.exploded) return;
  barrel.exploded = true;

  const idx = customObstacles.indexOf(barrel);
  if (idx !== -1) {
    customObstacles.splice(idx, 1);
  }

  const topY = barrel.y !== undefined ? barrel.y : (groundY - barrel.relY);
  const cx = barrel.x + barrel.w / 2;
  const cy = topY + barrel.h / 2;

  triggerScreenShake(10);
  spawnBarrelExplosion(cx, cy);

  const radius = 120;
  const maxDmg = 55;

  // 1. Gracz
  applyExplosionToEntity(_activePlayer, cx, cy, radius, maxDmg, groundY);

  // 2. Bot
  if (_activeBot && _activeBot.active) {
    applyExplosionToEntity(_activeBot, cx, cy, radius, maxDmg, groundY);
  }

  // 3. Silne odrzucenie piłki
  if (_activeBall) {
    const distBall = Math.hypot(_activeBall.x - cx, _activeBall.y - cy);
    if (distBall <= radius) {
      const nx = distBall > 0.001 ? (_activeBall.x - cx) / distBall : (Math.random() - 0.5);
      const push = (1 - distBall / radius) * 20 + 10;
      _activeBall.vx += nx * push;
      _activeBall.vy = -Math.abs(push * 0.75) - 6.5;
      _activeBall.spin = (_activeBall.vx > 0 ? 1 : -1) * 1.1;
    }
  }

  // 4. Detonacja łańcuchowa kolejnych beczek
  for (let i = customObstacles.length - 1; i >= 0; i--) {
    const other = customObstacles[i];
    if (other && other.type === 'explosive_barrel' && !other.exploded) {
      const otherTopY = other.y !== undefined ? other.y : (groundY - other.relY);
      const ocx = other.x + other.w / 2;
      const ocy = otherTopY + other.h / 2;
      if (Math.hypot(ocx - cx, ocy - cy) <= radius) {
        explodeBarrel(other, groundY);
      }
    }
  }
}

/**
 * Aktualizacja fizyki i ruchu przeszkód (np. kopniętych beczek wybuchowych)
 */
export function updateMovableObstacles(groundY = 500) {
  for (let i = customObstacles.length - 1; i >= 0; i--) {
    const obs = customObstacles[i];
    if (!obs || obs.exploded) continue;

    // Przeszkody z nadaną prędkością lub oznaczone jako kopnięte
    if ((obs.vx !== undefined && Math.abs(obs.vx) > 0.01) ||
      (obs.vy !== undefined && Math.abs(obs.vy) > 0.01) ||
      obs.kicked) {
      obs.vy = (obs.vy || 0) + 0.55; // grawitacja
      obs.x += (obs.vx || 0);
      const curY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
      obs.y = curY + obs.vy;

      const floorY = groundY - obs.h;
      if (obs.y >= floorY) {
        obs.y = floorY;
        if (Math.abs(obs.vy) > 3.0) {
          obs.vy = -obs.vy * 0.35; // odbicie od ziemi
          spawnObstacleSparks(obs.x + obs.w / 2, obs.y + obs.h, 0, -1, 3);
        } else {
          obs.vy = 0;
        }
        obs.vx = (obs.vx || 0) * 0.88; // tarcie podłoża
        if (Math.abs(obs.vx) < 0.15 && Math.abs(obs.vy) < 0.15) {
          obs.vx = 0;
          obs.vy = 0;
          obs.kicked = false;
        }
      }

      obs.relY = groundY - obs.y;

      // Odbicie od krawędzi areny
      if (obs.x < 100) {
        obs.x = 100;
        obs.vx = Math.abs(obs.vx || 0) * 0.5;
      } else if (obs.x > 1850) {
        obs.x = 1850;
        obs.vx = -Math.abs(obs.vx || 0) * 0.5;
      }

      // Detonacja przy zderzeniu z encjami przy dużej prędkości
      if (obs.type === 'explosive_barrel') {
        const speed = Math.hypot(obs.vx || 0, obs.vy || 0);
        if (speed > 5.0) {
          const ocx = obs.x + obs.w / 2;
          const ocy = obs.y + obs.h / 2;
          const hitRadius = (obs.w / 2) + 16;

          // Trafienie w bota
          if (_activeBot && _activeBot.active && !_activeBot.isDead) {
            const bx = _activeBot.x + (_activeBot.w || 24) / 2;
            const by = _activeBot.y + (_activeBot.h || 70) / 2;
            if (Math.hypot(ocx - bx, ocy - by) <= hitRadius + 18) {
              explodeBarrel(obs, groundY);
              continue;
            }
          }

          // Trafienie w gracza (jeśli kopiącym był bot/inny podmiot)
          if (_activePlayer && !_activePlayer.isDead && obs.kickedBy !== _activePlayer) {
            const px = _activePlayer.x + (_activePlayer.w || 24) / 2;
            const py = _activePlayer.y + (_activePlayer.h || 70) / 2;
            if (Math.hypot(ocx - px, ocy - py) <= hitRadius + 18) {
              explodeBarrel(obs, groundY);
              continue;
            }
          }

          // Trafienie w piłkę
          if (_activeBall) {
            if (Math.hypot(ocx - _activeBall.x, ocy - _activeBall.y) <= hitRadius + (_activeBall.colRadius || 12)) {
              explodeBarrel(obs, groundY);
              continue;
            }
          }
        }
      }
    }
  }
}


// =========================================================================
// OBSŁUGA LĄDOWANIA I ZESKOKU (DROP-THROUGH)
// =========================================================================
export function checkPlayerPlatformLanding(p, groundY) {
  if (!p || p.isIntro) return;

  if (p.boostCooldown > 0) p.boostCooldown--;
  if (p.laserCooldown > 0) p.laserCooldown--;

  const colH = (p.staggerTimer > 0) ? 15 : (p.h || 70);
  const feetY = p.y + colH;
  const centerX = p.x + p.w / 2;

  const wantDrop = (p.dropThroughTimer > 0);

  if (wantDrop) {
    for (const plat of ARENA_PLATFORMS) {
      if (!plat || plat.solid || plat.isCanyonTerrain) continue;
      if (centerX >= plat.x - 6 && centerX <= plat.x + plat.w + 6) {
        const topY = getPlatformSurfaceY(plat, centerX, groundY);

        if (Math.abs(feetY - topY) <= 14 && p.y < groundY - p.h - 2) {
          p.y = topY - p.h + 12;
          p.vy = 2.8;
          p.isJumping = true;
          p.isCrouching = false;
          p.airVx = p.vx;
          p.currentGroundY = groundY;
          return;
        }

        if (plat.props) {
          const tier = plat.props.find(pr => pr.type === 'altar_pedestal');
          if (tier) {
            const tierLeft = plat.x + tier.rx;
            const tierRight = tierLeft + tier.w;
            if (centerX >= tierLeft - 4 && centerX <= tierRight + 4) {
              const tierTopY = topY - tier.h;
              if (Math.abs(feetY - tierTopY) <= 14 && p.y < groundY - p.h - 2) {
                p.y = tierTopY - p.h + 12;
                p.vy = 2.8;
                p.isJumping = true;
                p.isCrouching = false;
                p.airVx = p.vx;
                p.currentGroundY = groundY;
                return;
              }
            }
          }
        }
      }
    }

    for (const obs of customObstacles) {
      if (obs.type === 'catwalk' || obs.type === 'cyber_catwalk' || obs.type === 'floating_hex' || obs.type === 'sniper_tower' || obs.type === 'metal_ramp_left' || obs.type === 'metal_ramp_right') {
        const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
        if (centerX >= obs.x - 6 && centerX <= obs.x + obs.w + 6) {
          let surfaceY = topY;
          if (obs.type === 'metal_ramp_left') {
            const t = Math.max(0, Math.min(1, (centerX - obs.x) / obs.w));
            surfaceY = topY + t * obs.h;
          } else if (obs.type === 'metal_ramp_right') {
            const t = Math.max(0, Math.min(1, (centerX - obs.x) / obs.w));
            surfaceY = topY + (1 - t) * obs.h;
          }
          if (Math.abs(feetY - surfaceY) <= 16 && p.y < groundY - p.h - 2) {
            p.y = surfaceY - p.h + 12;
            p.vy = 2.8;
            p.isJumping = true;
            p.isCrouching = false;
            p.airVx = p.vx;
            p.currentGroundY = groundY;
            return;
          }
        }
      }
    }

    p.currentGroundY = groundY;
    return;
  }

  // Obsługa wyrzutni / gejzerów na platformach areny (np. industrial steam vents w tunelu Areny 3)
  for (const plat of ARENA_PLATFORMS) {
    if (plat && (plat.isJumpPad || plat.type === 'jump_pad')) {
      const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
      if (centerX >= plat.x - 6 && centerX <= plat.x + plat.w + 6) {
        if (feetY >= topY - 14 && feetY <= topY + Math.max(22, p.vy + 12)) {
          p.y = topY - p.h - 4;
          p.vy = plat.launchVy || -12.5;
          p.isJumping = true;
          p.onGround = false;
          p.currentPlatform = null;
          p.isCrouching = false;
          p.airVx = p.vx;
          triggerScreenShake(5.0);
          spawnJetpackSparks(centerX, topY, 0, 8);
          return;
        }
      }
    }
  }

  for (const obs of customObstacles) {
    const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
    const bottomY = topY + obs.h;

    if (obs.type === 'jump_pad') {
      if (centerX >= obs.x - 6 && centerX <= obs.x + obs.w + 6) {
        if (feetY >= topY - 14 && feetY <= topY + Math.max(22, p.vy + 12)) {
          p.y = topY - p.h - 4;
          p.vy = -12.5;
          p.isJumping = true;
          p.isCrouching = false;
          p.airVx = p.vx;
          triggerScreenShake(5.0);
          spawnJetpackSparks(centerX, topY, 0, 6);
          return;
        }
      }
    } else if (obs.type === 'speed_booster_pad') {
      if (centerX >= obs.x && centerX <= obs.x + obs.w && feetY >= topY - 8 && feetY <= topY + 12) {
        if (!p.boostCooldown || p.boostCooldown <= 0) {
          const facing = p.facing || (p.vx >= 0 ? 1 : -1);
          p.vx += facing * 8.5;
          p.boostCooldown = 18;
          spawnJetpackSparks(centerX, topY, facing, 5);
          triggerScreenShake(3.0);
        }
      }
    } else if (obs.type === 'gravity_lift') {
      if (p.x + p.w > obs.x && p.x < obs.x + obs.w && feetY > topY && p.y < bottomY) {
        p.vy = Math.max(-6.5, p.vy - 0.7);
        p.isJumping = true;
        p.airVx = p.vx;
        spawnJetpackSparks(centerX, p.y + p.h, 0, 1);
      }
    } else if (obs.type === 'cyber_bumper') {
      const cx = obs.x + obs.w / 2;
      const cy = topY + obs.h / 2;
      const px = p.x + p.w / 2;
      const py = p.y + p.h / 2;
      const bdist = Math.hypot(px - cx, py - cy);
      if (bdist < 20 + 16) {
        const nx = bdist > 0.001 ? (px - cx) / bdist : 0;
        const ny = bdist > 0.001 ? (py - cy) / bdist : -1;
        p.x = cx + nx * 38 - p.w / 2;
        p.y = cy + ny * 38 - p.h / 2;
        p.vx = nx * 15.0;
        p.vy = ny * 15.0;
        p.isJumping = true;
        obs.hitTimer = 14;
        triggerScreenShake(5.0);
        spawnJetpackSparks(cx + nx * 20, cy + ny * 20, 0, 8);
      }
    } else if (obs.type === 'barbed_wire') {
      if (p.x + p.w > obs.x && p.x < obs.x + obs.w && feetY >= topY && p.y <= bottomY) {
        p.vx *= 0.45;
        obs.wireDmgTick = (obs.wireDmgTick || 0) + 1;
        if (obs.wireDmgTick % 18 === 0) {
          p.hp = Math.max(0, (p.hp !== undefined ? p.hp : 100) - 1);
          if (p.hp <= 0 && !p.isDead) {
            p.isDead = true;
            p.respawnTimer = 180;
            p.hasHead = true;
            p.isGibbed = false;
            p.corpseAngle = 0;
            if (p.currentWeapon) spawnDroppedWeapon(p.x + p.w / 2, p.y + 20, p.vx, -3, p.currentWeapon, p.facing);
          }
        }
      }
    } else if (obs.type === 'laser_gate') {
      if (p.x + p.w > obs.x && p.x < obs.x + obs.w && feetY > topY && p.y < bottomY) {
        if (!p.laserCooldown || p.laserCooldown <= 0) {
          p.hp = Math.max(0, (p.hp !== undefined ? p.hp : 100) - 15);
          p.laserCooldown = 30;
          triggerScreenShake(4.0);
          spawnObstacleSparks(obs.x + obs.w / 2, p.y + p.h / 2, 0, -1, 6);
          if (p.hp <= 0 && !p.isDead) {
            p.isDead = true;
            p.respawnTimer = 180;
            p.hasHead = true;
            p.isGibbed = false;
            p.corpseAngle = 0;
            if (p.currentWeapon) spawnDroppedWeapon(p.x + p.w / 2, p.y + 20, p.vx, -3, p.currentWeapon, p.facing);
          }
        }
      }
    }
  }

  let landedSurface = null;
  let landedSlope = 0;
  let landedPlatform = null;

  for (const plat of ARENA_PLATFORMS) {
    if (plat.isWall || plat.isJumpPad || plat.type === 'jump_pad' || plat.solid === false || plat.isPlatform === false || plat.type === 'water') continue;
    const bnds = getPlatformBounds(plat);
    if (centerX >= bnds.minX - 6 && centerX <= bnds.maxX + 6) {
      const surf = getPlatformSurfaceInfo(plat, centerX, groundY);
      const topY = surf.surfaceY;
      const prevFeetY = feetY - p.vy;

      const isFallenDebris = (plat.intact === false) || plat.isDebris;

      let isLanding = p.vy >= 0 && (
        (prevFeetY <= topY + 14 && feetY >= topY - 12 && feetY <= topY + Math.max(22, p.vy + 12)) ||
        (p.onGround && p.currentPlatform === plat && Math.abs(feetY - topY) < 28)
      );

      // Wejście na zawalony / leżący klocek (Step-up mechanic na leżący gruz):
      // Jeśli gracz biegnie po ziemi lub innej platformie i napotyka leżący blok o wysokości stopnia <= 34px:
      if (!isLanding && isFallenDebris) {
        const stepDiff = feetY - topY;
        if (stepDiff >= 0 && stepDiff <= 34 && feetY >= bnds.minY - 12 && feetY <= bnds.maxY + 18) {
          isLanding = true;
        }
      }

      if (isLanding) {
        if (plat.oneWay && p.dropThroughTimer > 0 && !isFallenDebris) {
          continue;
        }
        if (p.onGround && p.currentPlatform === plat) {
          landedSurface = topY;
          landedSlope = surf.slope;
          landedPlatform = plat;
          break;
        }
        if (landedSurface === null || topY < landedSurface) {
          landedSurface = topY;
          landedSlope = surf.slope;
          landedPlatform = plat;
        }
      }
    }
  }

  for (const obs of customObstacles) {
    if (!obs || obs.team || obs.holeCx !== undefined || obs.id?.startsWith('goal') || obs.type === 'goal') {
      continue;
    }
    if (obs.type === 'hedgehog' || obs.type === 'gravity_lift' || obs.type === 'barbed_wire' || obs.type === 'laser_gate' || obs.type === 'cyber_bumper' || obs.type === 'speed_booster_pad') {
      continue;
    }

    const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);

    if (obs.type === 'metal_ramp_left') {
      if (centerX >= obs.x - 4 && centerX <= obs.x + obs.w + 4) {
        const t = Math.max(0, Math.min(1, (centerX - obs.x) / obs.w));
        const rampSurfaceY = topY + t * obs.h;
        const prevFeetY = feetY - p.vy;
        const isLanding = p.vy >= 0 && prevFeetY <= rampSurfaceY + 12 && feetY >= rampSurfaceY - 10 && feetY <= rampSurfaceY + Math.max(20, p.vy + 10);
        if (isLanding) {
          if (landedSurface === null || rampSurfaceY < landedSurface) {
            landedSurface = rampSurfaceY;
          }
        }
      }
    } else if (obs.type === 'metal_ramp_right') {
      if (centerX >= obs.x - 4 && centerX <= obs.x + obs.w + 4) {
        const t = Math.max(0, Math.min(1, (centerX - obs.x) / obs.w));
        const rampSurfaceY = topY + (1 - t) * obs.h;
        const prevFeetY = feetY - p.vy;
        const isLanding = p.vy >= 0 && prevFeetY <= rampSurfaceY + 12 && feetY >= rampSurfaceY - 10 && feetY <= rampSurfaceY + Math.max(20, p.vy + 10);
        if (isLanding) {
          if (landedSurface === null || rampSurfaceY < landedSurface) {
            landedSurface = rampSurfaceY;
          }
        }
      }
    } else {
      if (centerX >= obs.x - 4 && centerX <= obs.x + obs.w + 4) {
        const prevFeetY = feetY - p.vy;
        const isLanding = p.vy >= 0 && prevFeetY <= topY + 12 && feetY >= topY - 10 && feetY <= topY + Math.max(20, p.vy + 10);
        if (isLanding) {
          if (landedSurface === null || topY < landedSurface) {
            landedSurface = topY;
          }
        }
      }
    }
  }

  for (const obs of customObstacles) {
    if (!obs || obs.team || obs.holeCx !== undefined || obs.id?.startsWith('goal') || obs.type === 'goal') {
      continue;
    }
    if (obs.type === 'bunker_block' || obs.type === 'cyber_pillar' || obs.type === 'tall_concrete_wall' || obs.type === 'explosive_barrel') {
      const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
      const bottomY = topY + obs.h;
      if (feetY > topY + 8 && p.y < bottomY - 4) {
        if (p.x + p.w > obs.x && p.x < obs.x + obs.w) {
          const midX = obs.x + obs.w / 2;
          if (p.x + p.w / 2 < midX) {
            p.x = obs.x - p.w;
            if (p.vx > 0) p.vx = 0;
          } else {
            p.x = obs.x + obs.w;
            if (p.vx < 0) p.vx = 0;
          }
        }
      }
    }
  }

  // Twarda blokada przechodzenia przez pionowe monolity i formacje skalne
  for (const plat of ARENA_PLATFORMS) {
    if (plat && plat.solid && plat.isMonolith) {
      const topY = groundY - plat.relY;
      const bottomY = topY + (plat.thickness || 470);
      if (feetY > topY + 8 && p.y < bottomY - 4) {
        if (p.x + p.w > plat.x && p.x < plat.x + plat.w) {
          const midX = plat.x + plat.w / 2;
          if (p.x + p.w / 2 < midX) {
            p.x = plat.x - p.w;
            if (p.vx > 0) p.vx = 0;
          } else {
            p.x = plat.x + plat.w;
            if (p.vx < 0) p.vx = 0;
          }
        }
      }
    }
  }

  // Twarda blokada przechodzenia przez pionowe ściany szybów i krawędzie skał (isWall)
  for (const plat of ARENA_PLATFORMS) {
    if (plat && plat.isWall) {
      const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
      const bottomY = topY + (plat.h || plat.thickness || 200);
      if (feetY > topY + 6 && p.y < bottomY - 4) {
        if (p.x + p.w > plat.x && p.x < plat.x + plat.w) {
          if (plat.pushSide === 'left') {
            p.x = plat.x - p.w;
            if (p.vx > 0) p.vx = 0;
          } else if (plat.pushSide === 'right') {
            p.x = plat.x + plat.w;
            if (p.vx < 0) p.vx = 0;
          } else {
            const overlapLeft = (p.x + p.w) - plat.x;
            const overlapRight = (plat.x + plat.w) - p.x;
            if (overlapLeft < overlapRight) {
              p.x = plat.x - p.w;
              if (p.vx > 0) p.vx = 0;
            } else {
              p.x = plat.x + plat.w;
              if (p.vx < 0) p.vx = 0;
            }
          }
        }
      }
    }
  }

  // Twarda blokada przechodzenia przez zawalone klocki leżące (Solid Debris Obstacles)
  for (const plat of ARENA_PLATFORMS) {
    if (!plat || plat.intact !== false || plat.solid === false || plat.isWall) continue;
    if (p.currentPlatform === plat) continue;

    const bnds = getPlatformBounds(plat);
    const stepDiff = feetY - bnds.minY;
    // Jeśli blok jest wyższy niż próg wejścia (stepDiff > 34) lub gracz uderza w bok wysokiego gruzu
    if (stepDiff > 34 && feetY > bnds.minY + 14 && p.y < bnds.maxY - 4) {
      if (p.x + p.w > bnds.minX && p.x < bnds.maxX) {
        const midX = bnds.cx;
        if (p.x + p.w / 2 < midX) {
          p.x = bnds.minX - p.w;
          if (p.vx > 0) p.vx = 0;
        } else {
          p.x = bnds.maxX;
          if (p.vx < 0) p.vx = 0;
        }
      }
    }
  }
  p.isClimbing = false;

  if (landedSurface === null) {
    for (const plat of ARENA_PLATFORMS) {
      if (plat.props) {
        const tier = plat.props.find(pr => pr.type === 'altar_pedestal' || pr.type === 'sandbag_trench');
        if (tier) {
          const tierLeft = plat.x + tier.rx;
          const tierRight = tierLeft + tier.w;
          if (centerX >= tierLeft - 3 && centerX <= tierRight + 3) {
            const tierTopY = getPlatformSurfaceY(plat, centerX, groundY) - tier.h;
            const prevFeetY = feetY - p.vy;
            if (p.vy >= 0 && prevFeetY <= tierTopY + 12 && feetY >= tierTopY - 8 && feetY <= tierTopY + Math.max(18, p.vy + 10)) {
              landedSurface = tierTopY;
              break;
            }
          }
        }
      }
    }
  }

  if (landedSurface !== null) {
    p.y = landedSurface - colH;
    p.vy = 0;
    p.isJumping = false;
    p.onGround = true;
    p.airVx = 0;
    p.currentGroundY = landedSurface;
    p.currentPlatform = landedPlatform;

    // Obsługa nachylenia (slopes physics): ślizganie i dynamiczny bieg po pochyłym terenie
    if (Math.abs(landedSlope) > 0.01) {
      if (p.isSliding) {
        // Pęd grawitacyjny w dół zbocza (downhill slide boost)
        p.vx -= landedSlope * 0.28;
      }
      p.slopeAngle = Math.atan(-landedSlope) * 0.6;
    } else {
      p.slopeAngle = 0;
    }

    if (p.staggerTimer > 0 && !p.staggerLanded) {
      p.staggerLanded = true;
      p.vx *= 0.70;
      spawnGroundPuff(centerX, landedSurface);
    }
    if (p.jetFuel < p.jetMax) {
      p.jetFuel = Math.min(p.jetMax, p.jetFuel + 2.5);
    }
  } else {
    p.currentPlatform = null;
    p.slopeAngle = 0;
    const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
    const isA3 = (curArena?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3');
    const isA2 = (curArena?.id === 'arena-2' || activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2');
    const hasNoFloor = isA3 || isA2;

    if (p.inMinecart || p._inCart) {
      // Pasażer w wagoniku kopalnianym stoi stabilnie na podłodze wózka
      p.onGround = true;
      p.isJumping = false;
      p.vy = 0;
      if (p._inCart) {
        const cartFloor = p._inCart.y + 48;
        p.currentGroundY = cartFloor;
        p.y = cartFloor - colH;
      }
    } else if (hasNoFloor) {
      // W Arenie 3 oraz Arenie 2 (Pandora) brak płaskiej podłogi – mapa składa się wyłącznie z zawieszonych w powietrzu wysp i otchłani
      p.onGround = false;
      p.currentGroundY = null;
    } else {
      // Sprawdzenie czy pod postacią znajduje się niezniszczony segment podłoża
      const isSupported = (typeof isGroundAt === 'function')
        ? (isGroundAt(p.x + 6) || isGroundAt(p.x + (p.w || 24) - 6))
        : true;

      if (isSupported) {
        p.currentGroundY = groundY;
        p.onGround = (p.y >= groundY - colH - 1);
        if (p.onGround && p.staggerTimer > 0 && !p.staggerLanded) {
          p.staggerLanded = true;
          p.vy = 0;
          p.vx *= 0.70;
          spawnGroundPuff(centerX, groundY);
        }
      } else {
        // Postać nad wyrwą w geometrii – natychmiast traci podparcie
        p.onGround = false;
        p.currentGroundY = null;
      }
    }
  }

  // Obsługa termiki i otchłani Pandory (Arena 2)
  if (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA') {
    applyPandoraUpdraft(p);
  }

  // Górny limit otwartego nieba w Arenie 3 (Y = 0)
  const curArenaObj = typeof getActiveArena === 'function' ? getActiveArena() : null;
  const isA3Active = (curArenaObj?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3');
  if (isA3Active) {
    if (p.y < 0) {
      p.y = 0;
      if (p.vy < 0) p.vy = 0;
    }
  }

  // Wpadnięcie do śmiertelnej rzeki w Arenie 3 (utonięcie po wejściu głębiej do wody)
  if (isA3Active && !p.isDead) {
    const pw = p.w || 24;
    const ph = p.h || 70;
    const pCenterX = p.x + pw * 0.5;
    const pFeetY = p.y + ph;
    const pCenterY = p.y + ph * 0.5;
    const inWaterX = (pCenterX >= 1560 && pCenterX <= 2840);
    const inWaterY = (pFeetY >= 1300);

    if (inWaterX && inWaterY) {
      const inOpenChannel = (pCenterX > 1750 && pCenterX < 2650);
      const isDeepWater = (pFeetY >= 1350) || (pCenterY >= 1325) || (inOpenChannel && pFeetY >= 1335);

      if (isDeepWater) {
        p.hp = 0;
        p.isDead = true;
        p.respawnTimer = 85;
        p.vx = 0;
        p.vy = 2.0; // tonie w głąb rzeki
        p.onGround = false;
        p.currentPlatform = null;
        if (typeof triggerScreenShake === 'function') {
          triggerScreenShake(6);
        }
      } else {
        // Płytka woda na brzegu - opór ruchu
        p.vx *= 0.82;
        if (p.vy > 0) p.vy *= 0.92;
      }
    }
  }

  // Wpadnięcie do strefy śmierci poniżej spągu
  const deathLimitY = isA3Active ? 1420 : (groundY + 160);
  if (!p.inMinecart && !p._inCart && p.y > deathLimitY && !p.isDead) {
    p.hp = 0;
    p.isDead = true;
    p.respawnTimer = 75;
    if (typeof triggerScreenShake === 'function') {
      triggerScreenShake(12);
    }
  }
}

export function resolveBallObstacleCollisions(ball, groundY) {
  if (!ball || (ball.goalAnimation && ball.goalAnimation.active)) return;
  const speed = Math.hypot(ball.vx, ball.vy);
  const cR = ball.colRadius !== undefined ? ball.colRadius : ball.radius;
  const prevX = ball.prevX !== undefined ? ball.prevX : (ball.x - ball.vx);
  const prevY = ball.prevY !== undefined ? ball.prevY : (ball.y - ball.vy);

  for (const plat of ARENA_PLATFORMS) {
    if (plat.passBall || plat.isHatch || plat.id === 'hatch_l' || plat.id === 'hatch_r' || plat.type === 'water' || plat.solid === false || plat.isPlatform === false) {
      continue;
    }
    if (plat.isJumpPad || plat.type === 'jump_pad') {
      const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
      const bottomY = topY + (plat.h || 14);
      if (ball.x >= plat.x - cR && ball.x <= plat.x + plat.w + cR) {
        if (ball.y + cR >= topY - 2 && ball.y - cR <= bottomY) {
          ball.y = topY - cR - 3;
          ball.vy = plat.launchVy || -14.0;
          ball.vx *= 1.05;
          ball.spin = (ball.vx > 0 ? 1 : -1) * 0.8;
          triggerScreenShake(5.0);
          continue;
        }
      }
      continue;
    }

    if (plat.isWall) {
      const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
      const bottomY = topY + (plat.h || plat.thickness || 200);
      const platLeft = plat.x;
      const platRight = plat.x + plat.w;

      if (ball.x + cR >= platLeft && ball.x - cR <= platRight && ball.y + cR >= topY && ball.y - cR <= bottomY) {
        if (plat.pushSide === 'right' || (ball.vx < 0 && ball.x >= platRight - 15)) {
          ball.x = platRight + cR;
          ball.vx = Math.abs(ball.vx) * 0.75;
          ball.spin = -ball.spin * 0.5;
        } else if (plat.pushSide === 'left' || (ball.vx > 0 && ball.x <= platLeft + 15)) {
          ball.x = platLeft - cR;
          ball.vx = -Math.abs(ball.vx) * 0.75;
          ball.spin = -ball.spin * 0.5;
        } else {
          const ol = (ball.x + cR) - platLeft;
          const or = platRight - (ball.x - cR);
          const ot = (ball.y + cR) - topY;
          const ob = bottomY - (ball.y - cR);
          const minO = Math.min(ol, or, ot, ob);
          if (minO === ot && ball.vy >= 0) {
            ball.y = topY - cR;
            ball.vy = -Math.abs(ball.vy) * 0.65;
          } else if (minO === ob && ball.vy <= 0) {
            ball.y = bottomY + cR;
            ball.vy = Math.abs(ball.vy) * 0.65;
          } else if (minO === ol) {
            ball.x = platLeft - cR;
            ball.vx = -Math.abs(ball.vx) * 0.75;
          } else {
            ball.x = platRight + cR;
            ball.vx = Math.abs(ball.vx) * 0.75;
          }
        }
      }
      continue;
    }

    if (plat.isCrossbar) {
      const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
      const bottomY = topY + (plat.h || plat.thickness || 14);
      const platLeft = plat.x;
      const platRight = plat.x + plat.w;

      // Odbicie od górnej lub dolnej krawędzi poprzeczki
      if (ball.x >= platLeft - cR && ball.x <= platRight + cR) {
        if (ball.vy > 0 && ball.y + cR >= topY && (ball.y - ball.vy) + cR <= topY + 12) {
          ball.y = topY - cR;
          ball.vy = -Math.abs(ball.vy) * 0.72;
          ball.vx *= 0.96;
          ball.spin *= 0.90;
          if (speed > 6.0) triggerScreenShake(2.5);
        } else if (ball.vy < 0 && ball.y - cR <= bottomY && (ball.y - ball.vy) - cR >= bottomY - 12) {
          ball.y = bottomY + cR;
          ball.vy = Math.abs(ball.vy) * 0.72;
          ball.vx *= 0.96;
          ball.spin *= 0.90;
          if (speed > 6.0) triggerScreenShake(2.5);
        }
      }

      // Odbicie od przedniego narożnika wlotu poprzeczki (słupek narożny)
      const postCornerX = (plat.x === 0) ? platRight : platLeft;
      const postCornerY = topY;
      const cdx = ball.x - postCornerX;
      const cdy = ball.y - postCornerY;
      const cdist = Math.hypot(cdx, cdy);
      if (cdist < cR && cdist > 0.001) {
        const cnx = cdx / cdist;
        const cny = cdy / cdist;
        ball.x = postCornerX + cnx * (cR + 1);
        ball.y = postCornerY + cny * (cR + 1);
        const vDotN = ball.vx * cnx + ball.vy * cny;
        if (vDotN < 0) {
          const restitution = 0.78;
          ball.vx -= (1 + restitution) * vDotN * cnx;
          ball.vy -= (1 + restitution) * vDotN * cny;
          ball.spin = (ball.vx > 0 ? 1 : -1) * 0.75;
          triggerScreenShake(3.5);
        }
      }
      continue;
    }

    if (plat.type === 'catwalk') {
      const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
      const platLeft = plat.x;
      const platRight = plat.x + plat.w;

      if (ball.x >= platLeft - cR && ball.x <= platRight + cR) {
        if (ball.vy > 0) {
          const prevBottomY = (ball.y - ball.vy) + cR;
          if (ball.y + cR >= topY && prevBottomY <= topY + 8) {
            ball.y = topY - cR;
            ball.vy = Math.abs(ball.vy) > 0.8 ? -ball.vy * 0.65 : 0;
            ball.vx *= 0.98;
            ball.spin *= 0.94;
            ball.rotation += ball.vx * 0.08;
            if (speed > 8.0) triggerScreenShake(2.5);
          }
        }
      }
    } else {
      const surf = getPlatformSurfaceInfo(plat, ball.x, groundY);
      const topY = surf.surfaceY;
      const bnds = getPlatformBounds(plat);
      const platLeft = bnds.minX;
      const platRight = bnds.maxX;
      const thickness = plat.thickness || plat.h || 20;

      if (plat.oneWay && ball.vy <= 0) continue;
      if (ball.x >= platLeft - cR && ball.x <= platRight + cR) {
        const prevBottomY = prevY + cR;
        const curBottomY = ball.y + cR;

        if (curBottomY >= topY && prevBottomY <= topY + 18 && ball.y - cR <= topY + thickness + 15) {
          if (Math.abs(surf.slope) > 0.05) {
            // Kolizja wektorowa ze stokiem / naturalną rampą kicker
            const nx = surf.nx;
            const ny = surf.ny;
            const vDotN = ball.vx * nx + ball.vy * ny;
            if (vDotN < 0) {
              const restitution = 0.68;
              ball.vx -= (1 + restitution) * vDotN * nx;
              ball.vy -= (1 + restitution) * vDotN * ny;
              // Rampa wybijająca w centrum (kicker ramp): wznoszący profil wyrzuca piłkę w powietrze
              if (surf.slope > 0.35 && ball.vx > 2.5) {
                ball.vy -= Math.min(8.2, ball.vx * 0.80);
              }
            }
            ball.y = topY - cR;
            ball.vx *= 0.985;
            ball.spin = -ball.vx * 0.12;
            ball.rotation += ball.vx * 0.08;
          } else {
            ball.y = topY - cR;
            ball.vy = Math.abs(ball.vy) > 0.8 ? -ball.vy * 0.65 : 0;
            ball.vx *= 0.98;
            ball.spin *= 0.94;
            ball.rotation += ball.vx * 0.08;
          }
          if (speed > 8.0) triggerScreenShake(2.5);
        }
      }

      // Odbicie boczne od pionowego monolitu skalnego
      if (plat.isMonolith) {
        const mTop = groundY - plat.relY;
        const mBottom = mTop + (plat.thickness || 470);
        if (ball.y >= mTop && ball.y <= mBottom) {
          if (ball.x + cR >= platLeft && ball.x - cR <= platRight) {
            if (ball.x < platLeft + plat.w / 2) {
              ball.x = platLeft - cR;
              if (ball.vx > 0) ball.vx = -ball.vx * 0.75;
            } else {
              ball.x = platRight + cR;
              if (ball.vx < 0) ball.vx = -ball.vx * 0.75;
            }
          }
        }
      }

      if (plat.props) {
        for (const prop of plat.props) {
          if (prop.type === 'altar_pedestal' || prop.type === 'sandbag_trench' || prop.type === 'wooden_log_bunker') {
            const bx = plat.x + prop.rx;
            const by = topY - prop.h;
            const bw = prop.w;
            const bh = prop.h;

            const clampX = Math.max(bx, Math.min(bx + bw, ball.x));
            const clampY = Math.max(by, Math.min(by + bh, ball.y));
            const cdx = ball.x - clampX;
            const cdy = ball.y - clampY;
            const cdist = Math.hypot(cdx, cdy);

            if (cdist < cR) {
              let cnx = 0, cny = -1;
              if (cdist > 0.001) {
                cnx = cdx / cdist;
                cny = cdy / cdist;
              }
              const pen = cR - cdist;
              ball.x += cnx * pen;
              ball.y += cny * pen;

              const bvn = ball.vx * cnx + ball.vy * cny;
              if (bvn < 0) {
                const bjn = -(1 + 0.65) * bvn;
                ball.vx += bjn * cnx;
                ball.vy += bjn * cny;
              }
            }
          }
        }
      }
    }
  }

  for (const bar of GROUND_BARRICADES) {
    const bType = normalizeObstacleType(bar.type);
    if (bType === 'sandbags' || bType === 'ammo_depot') {
      const barLeft = bar.x;
      const barRight = bar.x + bar.w;
      const barTop = groundY - bar.h;
      const barBottom = groundY;

      const ballLeft = ball.x - cR;
      const ballRight = ball.x + cR;
      const ballTop = ball.y - cR;
      const ballBottom = ball.y + cR;

      if (ballRight > barLeft && ballLeft < barRight && ballBottom > barTop && ballTop < barBottom) {
        const overlapLeft = ballRight - barLeft;
        const overlapRight = barRight - ballLeft;
        const overlapTop = ballBottom - barTop;

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop);
        const isRollingFlat = Math.abs(ball.vy) < 1.0 || (ball.y + cR >= groundY - 4);

        if (minOverlap === overlapTop && ball.vy >= 0) {
          ball.y = barTop - cR;
          ball.vy = -Math.abs(ball.vy) * 0.55;
          ball.vx *= 0.88;
        } else if (minOverlap === overlapLeft) {
          ball.x = barLeft - cR;
          ball.vx = -Math.abs(ball.vx) * 0.70;
          if (isRollingFlat) ball.vy = 0;
        } else if (minOverlap === overlapRight) {
          ball.x = barRight + cR;
          ball.vx = Math.abs(ball.vx) * 0.70;
          if (isRollingFlat) ball.vy = 0;
        }
      }
    } else if (bar.type === 'hedgehog') {
      const hcx = bar.x;
      const hcy = groundY - bar.size / 2;
      const hr = bar.size / 2;
      const hdx = ball.x - hcx;
      const hdy = ball.y - hcy;
      const hd = Math.hypot(hdx, hdy);
      const minDistH = cR + hr;

      if (hd < minDistH) {
        const hnx = hd > 0.001 ? hdx / hd : 0;
        const hny = hd > 0.001 ? hdy / hd : -1;
        const hpen = minDistH - hd;
        ball.x += hnx * hpen;
        ball.y += hny * hpen;
        ball.vx = -ball.vx * 0.65;
        ball.vy *= 0.5;
        if (ball.y + cR >= groundY - 4 && ball.vy < 0) ball.vy = 0;
        if (speed > 6.0) triggerScreenShake(2.2);
      }
    }
  }

  for (const obs of customObstacles) {
    if (!obs || obs.team || obs.holeCx !== undefined || obs.id?.startsWith('goal') || obs.type === 'goal') {
      continue;
    }
    const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
    const bottomY = topY + obs.h;
    const obsLeft = obs.x;
    const obsRight = obs.x + obs.w;

    if (obs.type === 'cyber_bumper') {
      const cx = obs.x + obs.w / 2;
      const cy = topY + obs.h / 2;
      const br = 20;
      const bdx = ball.x - cx;
      const bdy = ball.y - cy;
      const bdist = Math.hypot(bdx, bdy);
      if (bdist < br + cR) {
        const bnx = bdist > 0.001 ? bdx / bdist : 0;
        const bny = bdist > 0.001 ? bdy / bdist : -1;
        ball.x = cx + bnx * (br + cR + 2);
        ball.y = cy + bny * (br + cR + 2);
        const impulse = Math.max(16.0, Math.hypot(ball.vx, ball.vy) * 2.2);
        ball.vx = bnx * impulse;
        ball.vy = bny * impulse;
        ball.spin = (ball.vx > 0 ? 1 : -1) * 0.9;
        obs.hitTimer = 14;
        triggerScreenShake(5.0);
        spawnAltarShockwave(cx, cy);
        continue;
      }
    } else if (obs.type === 'speed_booster_pad') {
      if (ball.x >= obsLeft - cR && ball.x <= obsRight + cR && ball.y + cR >= topY - 3 && ball.y - cR <= bottomY) {
        const dir = Math.abs(ball.vx) > 0.5 ? Math.sign(ball.vx) : 1;
        ball.y = topY - cR;
        ball.vx = dir * (Math.abs(ball.vx) + 8.5);
        ball.vy = -3.2;
        spawnJetpackSparks(ball.x, topY, dir, 4);
        triggerScreenShake(2.5);
        continue;
      }
    } else if (obs.type === 'gravity_lift') {
      if (ball.x >= obsLeft - cR && ball.x <= obsRight + cR && ball.y >= topY - cR && ball.y <= bottomY + cR) {
        ball.vy = Math.max(-6.5, ball.vy - 0.7);
        continue;
      }
    } else if (obs.type === 'metal_ramp_left') {
      resolveSegmentCollision(ball, obs.x, topY, obs.x + obs.w, topY + obs.h, 6, 0, 0, 0, 0, 0.75, 0.20);
      continue;
    } else if (obs.type === 'metal_ramp_right') {
      resolveSegmentCollision(ball, obs.x, topY + obs.h, obs.x + obs.w, topY, 6, 0, 0, 0, 0, 0.75, 0.20);
      continue;
    } else if (obs.type === 'jump_pad') {
      if (ball.x >= obsLeft - cR && ball.x <= obsRight + cR) {
        if (ball.y + cR >= topY - 2 && ball.y - cR <= bottomY) {
          ball.y = topY - cR - 3;
          ball.vy = -14.0;
          ball.vx *= 1.05;
          ball.spin = (ball.vx > 0 ? 1 : -1) * 0.8;
          triggerScreenShake(5.0);
          spawnAltarShockwave(ball.x, topY);
          continue;
        }
      }
    } else if (obs.type === 'catwalk' || obs.type === 'cyber_catwalk' || obs.type === 'floating_hex' || obs.type === 'sniper_tower') {
      if (ball.x >= obsLeft - cR && ball.x <= obsRight + cR) {
        if (ball.vy > 0) {
          const prevBottomY = (ball.y - ball.vy) + cR;
          if (ball.y + cR >= topY && prevBottomY <= topY + 12) {
            ball.y = topY - cR;
            ball.vy = Math.abs(ball.vy) > 0.8 ? -ball.vy * 0.65 : 0;
            ball.vx *= 0.98;
            ball.spin *= 0.94;
            ball.rotation += ball.vx * 0.08;
            if (speed > 8.0) triggerScreenShake(2.5);
          }
        }
      }
    } else if (obs.type === 'barbed_wire') {
      if (ball.x >= obsLeft - cR && ball.x <= obsRight + cR && ball.y + cR >= topY && ball.y - cR <= bottomY) {
        ball.vx *= 0.94;
      }
    } else if (obs.type === 'hedgehog') {
      const hcx = obs.x + obs.w / 2;
      const hcy = topY + obs.h / 2;
      const hr = (obs.size || 32) / 2;
      const hdx = ball.x - hcx;
      const hdy = ball.y - hcy;
      const hd = Math.hypot(hdx, hdy);
      const minDistH = cR + hr;

      if (hd < minDistH) {
        const hnx = hd > 0.001 ? hdx / hd : 0;
        const hny = hd > 0.001 ? hdy / hd : -1;
        const hpen = minDistH - hd;
        ball.x += hnx * hpen;
        ball.y += hny * hpen;
        ball.vx = -ball.vx * 0.70;
        ball.vy = -ball.vy * 0.70;
        if (speed > 6.0) triggerScreenShake(2.2);
      }
    } else {
      const ballLeft = ball.x - cR;
      const ballRight = ball.x + cR;
      const ballTop = ball.y - cR;
      const ballBottom = ball.y + cR;

      if (ballRight > obsLeft && ballLeft < obsRight && ballBottom > topY && ballTop < bottomY) {
        const overlapLeft = ballRight - obsLeft;
        const overlapRight = obsRight - ballLeft;
        const overlapTop = ballBottom - topY;
        const overlapBottom = bottomY - ballTop;

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
        const rest = obs.type === 'laser_gate' ? 0.95 : (obs.type === 'neon_barrier' ? 0.82 : 0.65);

        if (minOverlap === overlapTop && ball.vy >= 0) {
          ball.y = topY - cR;
          ball.vy = -Math.abs(ball.vy) * rest;
          ball.vx *= 0.92;
        } else if (minOverlap === overlapBottom && ball.vy <= 0) {
          ball.y = bottomY + cR;
          ball.vy = Math.abs(ball.vy) * rest;
        } else if (minOverlap === overlapLeft) {
          ball.x = obsLeft - cR;
          ball.vx = -Math.abs(ball.vx) * rest;
        } else if (minOverlap === overlapRight) {
          ball.x = obsRight + cR;
          ball.vx = Math.abs(ball.vx) * rest;
        }
        if (obs.type === 'laser_gate') {
          spawnObstacleSparks(ball.x, ball.y, ball.vx > 0 ? 1 : -1, 0, 4);
        }
        if (speed > 6.0) triggerScreenShake(2.2);
      }
    }
  }
}

export function checkObstacleCollisions(ball, groundY, p = null, botObj = null) {
  _activeBall = ball;
  _activePlayer = p;
  if (botObj) _activeBot = botObj;

  updateBarrelExplosionParticles();
  for (const obs of customObstacles) {
    if (obs.hitTimer > 0) obs.hitTimer--;
  }

  if (p) {
    checkPlayerPlatformLanding(p, groundY);
  }
  if (ball) {
    resolveBallObstacleCollisions(ball, groundY);
  }

  if (activeArenaId === 'ARENA_1') {
    const _mapW = ARENA_WIDTH || 3600;
    const centerX = _mapW / 2; // 1800
    const altarX = arena1State.altarX || centerX;
    const altarY = arena1State.altarY || 760;
    const spawnBallY = altarY - (ball?.radius || 8) - 2; // 750

    if (!arena1State.initialSetupDone) {
      arena1State.initialSetupDone = true;
      arena1State.waitingForKickoff = true;
      if (p) {
        p.x = 240;
        p.y = 580;
        p.vx = 0;
        p.vy = 0;
        p.facing = 1;
        p.isIntro = false;
        p.gaitMode = 'IDLE';
      }
      if (ball) {
        ball.x = altarX;
        ball.y = spawnBallY;
        ball.prevX = altarX;
        ball.prevY = spawnBallY;
        ball.vx = 0;
        ball.vy = 0;
        ball.spin = 0;
        ball.trail = [];
      }
    }

    if (p && p.isIntro) {
      p.isIntro = false;
      p.gaitMode = 'IDLE';
      p.x = 240;
      p.y = 580;
      p.facing = 1;
      arena1State.waitingForKickoff = true;
      arena1State.kickoffCooldown = 0;
      if (ball) {
        ball.x = altarX;
        ball.y = spawnBallY;
        ball.prevX = altarX;
        ball.prevY = spawnBallY;
        ball.vx = 0;
        ball.vy = 0;
        ball.spin = 0;
        ball.trail = [];
      }
    }

    if (arena1State.kickoffCooldown > 0) {
      arena1State.kickoffCooldown--;
    }

    if (arena1State.waitingForKickoff && ball) {
      const time = performance.now() * 0.003;
      const hoverY = spawnBallY + Math.sin(time) * 4;
      ball.x = altarX;
      ball.y = hoverY;
      ball.vx = 0;
      ball.vy = 0;
      ball.spin = 0;
      ball.trail = [];

      if (arena1State.kickoffCooldown <= 0) {
        const pCenterX = p ? p.x + p.w / 2 : Infinity;
        const pCenterY = p ? p.y + p.h / 2 : Infinity;
        const distP = Math.hypot(ball.x - pCenterX, ball.y - pCenterY);

        const bCenterX = (_activeBot && _activeBot.active) ? _activeBot.x + _activeBot.w / 2 : Infinity;
        const bCenterY = (_activeBot && _activeBot.active) ? _activeBot.y + _activeBot.h / 2 : Infinity;
        const distB = Math.hypot(ball.x - bCenterX, ball.y - bCenterY);

        const isNear = distP < 55 || distB < 55;
        const isKicking = p && p.kickState === 'SWING' && distP < 85;

        if (isNear || isKicking) {
          arena1State.waitingForKickoff = false;
          triggerScreenShake(7);
          ball.vy = -6.2;
          ball.vx = (distP <= distB) ? ((p?.facing || 1) * 6.5) : ((_activeBot?.facing || -1) * 6.5);
          ball.spin = (ball.vx > 0 ? 1 : -1) * 0.6;
          spawnAltarShockwave(ball.x, ball.y);
        }
      }
    }

    if (!arena1State.waitingForKickoff && ball && (!ball.goalAnimation || !ball.goalAnimation.active)) {
      for (const g of GOALS) {
        const topY = (g.y !== undefined) ? g.y : (groundY - (g.relY || 0) - (g.h || 140));
        const bottomY = (g.bottomY !== undefined) ? g.bottomY : ((g.y !== undefined) ? (g.y + (g.h || 140)) : (groundY - (g.relY || 0)));
        const leftX = g.x;
        const rightX = g.x + (g.w || 220);

        const insideAABB = (ball.x >= leftX && ball.x <= rightX && ball.y >= topY && ball.y <= bottomY);
        const passedLine = (g.facing === 1 && ball.x <= (g.lineX !== undefined ? g.lineX : rightX) && ball.x >= leftX - 40 && ball.y >= topY && ball.y <= bottomY) ||
                           (g.facing === -1 && ball.x >= (g.lineX !== undefined ? g.lineX : leftX) && ball.x <= rightX + 40 && ball.y >= topY && ball.y <= bottomY);

        if (insideAABB || passedLine) {
          const isCyanGoal = (g.team === 'CYAN');
          const scoringTeam = isCyanGoal ? 'ORANGE' : 'CYAN';
          if (scoringTeam === 'CYAN') {
            arenaScore.cyan++;
          } else {
            arenaScore.orange++;
          }

          triggerScreenShake(16);
          triggerGoalCelebration(scoringTeam, scoringTeam === 'CYAN' ? '#00F0FF' : '#FF8800');

          ball.goalAnimation = {
            active: true,
            timer: 48,
            maxTimer: 48,
            startX: ball.x,
            startY: ball.y,
            targetX: (g.facing === 1) ? (leftX + 40) : (rightX - 40),
            targetY: (topY + bottomY) / 2,
            scoringTeam: scoringTeam,
            color: scoringTeam === 'CYAN' ? '#00F0FF' : '#FF8800',
            scale: 1.0,
            alpha: 1.0,
            spinDir: (ball.vx > 0 ? 1 : -1) || (isCyanGoal ? -1 : 1)
          };
          ball.vx = 0;
          ball.vy = 0;
          break;
        }
      }
    }
  }

  if ((activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA') && ball) {
    for (const g of GOALS) {
      const topY = (g.y !== undefined) ? g.y : (groundY - (g.relY || 0) - g.h);
      const bottomY = (g.y !== undefined) ? (g.y + g.h) : (groundY - (g.relY || 0));
      const leftX = g.x;
      const rightX = g.x + g.w;

      if (ball.x >= leftX && ball.x <= rightX && ball.y >= topY && ball.y <= bottomY) {
        const scoringTeam = (g.team === 'CYAN') ? 'ORANGE' : 'CYAN';
        if (scoringTeam === 'CYAN') {
          arenaScore.cyan++;
        } else {
          arenaScore.orange++;
        }

        triggerScreenShake(15);
        triggerGoalCelebration(scoringTeam, scoringTeam === 'CYAN' ? '#06b6d4' : '#f97316');
        resetArena();

        ball.x = 1800;
        ball.y = 560;
        ball.prevX = 1800;
        ball.prevY = 560;
        ball.vx = 0;
        ball.vy = 0;
        ball.spin = 0;
        ball.trail = [];
        break;
      }
    }
  }

  if ((activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY') && ball) {
    // Bramki w Arenie 3 i efekt zasysania piłki w głąb rurociągów są w pełni obsługiwane przez updateBall (js/ball.js)
    return;
  }
}

export function drawHazardStripes(ctx, x, y, w, h) {
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

export function drawCrate(ctx, x, y, w, h) {
  ctx.save();

  // 1. Cień rzucany na podłoże
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.beginPath();
  if (ctx.ellipse) {
    ctx.ellipse(x + w / 2, y + h, w * 0.48, 2.5, 0, 0, Math.PI * 2);
  } else {
    ctx.rect(x + 2, y + h - 1, w - 4, 2);
  }
  ctx.fill();

  // 2. Główny korpus skrzyni w kolorystyce wojskowej zieleni (#2d4a22)
  const bodyGrad = ctx.createLinearGradient(x, y, x, y + h);
  bodyGrad.addColorStop(0, '#3a5f2c');   // jaśniejsza krawędź u góry
  bodyGrad.addColorStop(0.35, '#2d4a22'); // wojskowa zieleń wojsk lądowych (#2d4a22)
  bodyGrad.addColorStop(0.85, '#22381a'); // ciemniejszy oliwkowy
  bodyGrad.addColorStop(1, '#182813');   // głęboki cień u dołu
  ctx.fillStyle = bodyGrad;

  const rad = 2.5;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, rad);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.fill();

  // 3. Ciemna obwódka skrzyni
  ctx.strokeStyle = '#121f0e';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // 4. Górne rozjaśnienie pokrywy (bevel)
  ctx.strokeStyle = 'rgba(110, 175, 80, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 1);
  ctx.lineTo(x + w - 2, y + 1);
  ctx.stroke();

  // 5. Pozioma szczelina pokrywy
  const lidH = Math.max(5, Math.round(h * 0.28));
  const seamY = y + lidH;
  ctx.strokeStyle = '#0f1a0b';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x + 1, seamY);
  ctx.lineTo(x + w - 1, seamY);
  ctx.stroke();

  // Odblask pod rowkiem pokrywy
  ctx.strokeStyle = 'rgba(75, 120, 55, 0.45)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x + 1, seamY + 1.2);
  ctx.lineTo(x + w - 1, seamY + 1.2);
  ctx.stroke();

  // 6. Stalowe okucia rogów (metalowe narożniki)
  const bracketW = Math.max(3, Math.min(6, w * 0.16));
  const bracketH = Math.max(3, Math.min(5, h * 0.18));
  ctx.fillStyle = '#334155'; // stal grafitowa
  // Lewy górny
  ctx.fillRect(x, y, bracketW, 2);
  ctx.fillRect(x, y, 2, bracketH);
  // Prawy górny
  ctx.fillRect(x + w - bracketW, y, bracketW, 2);
  ctx.fillRect(x + w - 2, y, 2, bracketH);
  // Lewy dolny
  ctx.fillRect(x, y + h - 2, bracketW, 2);
  ctx.fillRect(x, y + h - bracketH, 2, bracketH);
  // Prawy dolny
  ctx.fillRect(x + w - bracketW, y + h - 2, bracketW, 2);
  ctx.fillRect(x + w - 2, y + h - bracketH, 2, bracketH);

  // Nity na narożnikach
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x + 2.5, y + 2.5, 1.2, 1.2);
  ctx.fillRect(x + w - 3.7, y + 2.5, 1.2, 1.2);
  ctx.fillRect(x + 2.5, y + h - 3.7, 1.2, 1.2);
  ctx.fillRect(x + w - 3.7, y + h - 3.7, 1.2, 1.2);

  // 7. Boczne zagłębienia na uchwyty transportowe
  const handleH = Math.max(4, Math.round(h * 0.22));
  const handleY = y + lidH + (h - lidH - handleH) / 2;
  ctx.fillStyle = '#14220f';
  ctx.fillRect(x + 1, handleY, 2, handleH);
  ctx.fillRect(x + w - 3, handleY, 2, handleH);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(x + 1.5, handleY + 1, 1, handleH - 2);
  ctx.fillRect(x + w - 2.5, handleY + 1, 1, handleH - 2);

  // 8. Centralna klamra / zamek (metalowy zatrzask)
  const latchW = Math.max(4, Math.min(7, Math.round(w * 0.18)));
  const latchH = Math.max(4, Math.min(6, Math.round(h * 0.22)));
  const latchX = x + (w - latchW) / 2;
  const latchY = seamY - Math.round(latchH * 0.40);

  // Cień pod klamrą
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(latchX - 0.5, latchY + 0.5, latchW + 1, latchH + 1);

  // Płytka zatrzasku ze stali
  const latchGrad = ctx.createLinearGradient(latchX, latchY, latchX + latchW, latchY);
  latchGrad.addColorStop(0, '#94a3b8');
  latchGrad.addColorStop(0.4, '#e2e8f0');
  latchGrad.addColorStop(0.7, '#cbd5e1');
  latchGrad.addColorStop(1, '#64748b');
  ctx.fillStyle = latchGrad;
  ctx.fillRect(latchX, latchY, latchW, latchH);

  // Ramka klamry
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.strokeRect(latchX, latchY, latchW, latchH);

  // Otwór zamka / rygiel
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(latchX + latchW / 2 - 0.6, latchY + latchH * 0.52, 1.2, 1.6);

  // 9. Żółty szablonowy napis "AMMO"
  const textSpaceY = seamY + 1;
  const textSpaceH = h - (seamY - y);
  const fontSize = Math.max(6, Math.min(8, Math.round(w * 0.22)));
  ctx.font = `900 ${fontSize}px "Courier New", Courier, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textY = textSpaceY + textSpaceH / 2 + 0.5;
  const textX = x + w / 2;

  // Cień tekstu dla kontrastu
  ctx.fillStyle = 'rgba(10, 18, 8, 0.85)';
  ctx.fillText('AMMO', textX + 0.6, textY + 0.6);

  // Wojskowy żółty kolor napisu
  ctx.fillStyle = '#facc15';
  ctx.fillText('AMMO', textX, textY);

  ctx.restore();
}

function drawSingleSandbag(ctx, bx, by, bw, bh, isOlive = false) {
  ctx.save();

  // Cień pod workiem
  ctx.fillStyle = 'rgba(20, 16, 10, 0.40)';
  ctx.beginPath();
  if (ctx.ellipse) {
    ctx.ellipse(bx + bw / 2, by + bh, bw * 0.46, 2, 0, 0, Math.PI * 2);
  } else {
    ctx.rect(bx + 1, by + bh - 1, bw - 2, 2);
  }
  ctx.fill();

  // Gradient tkaniny worka (beżowy lub oliwkowy)
  const bagGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
  if (isOlive) {
    bagGrad.addColorStop(0, '#8c8b60');   // oliwkowy rozbłysk
    bagGrad.addColorStop(0.35, '#76744d'); // oliwkowa juta
    bagGrad.addColorStop(0.85, '#5d5c3b'); // cień oliwkowy
    bagGrad.addColorStop(1, '#444329');   // głębokie załamanie
  } else {
    bagGrad.addColorStop(0, '#b8a681');   // piaskowo-beżowy rozbłysk
    bagGrad.addColorStop(0.35, '#9e8c67'); // ciepły beżowy płótno
    bagGrad.addColorStop(0.85, '#7d6d4d'); // ciemniejsza juta
    bagGrad.addColorStop(1, '#574b33');   // załamanie materiału
  }
  ctx.fillStyle = bagGrad;

  // Zaokrąglony kształt worka (poduszkowaty)
  const r = Math.min(5, bh * 0.45);
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(bx, by, bw, bh, r);
  } else {
    ctx.rect(bx, by, bw, bh);
  }
  ctx.fill();

  // Zarys tkaniny (kontur)
  ctx.strokeStyle = isOlive ? '#3c3b24' : '#4d412b';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Górna krawędź światła (rozjaśnienie wypukłości)
  ctx.strokeStyle = isOlive ? 'rgba(195, 195, 150, 0.45)' : 'rgba(235, 220, 185, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx + r, by + 1.2);
  ctx.lineTo(bx + bw - r, by + 1.2);
  ctx.stroke();

  // Związane końce ("uszy" worka na brzegach)
  ctx.fillStyle = isOlive ? '#504f32' : '#635438';
  ctx.beginPath();
  if (ctx.ellipse) {
    ctx.ellipse(bx + 1, by + bh / 2, 1.8, 3, -0.2, 0, Math.PI * 2);
    ctx.ellipse(bx + bw - 1, by + bh / 2, 1.8, 3, 0.2, 0, Math.PI * 2);
  } else {
    ctx.rect(bx, by + bh / 2 - 2, 2, 4);
    ctx.rect(bx + bw - 2, by + bh / 2 - 2, 2, 4);
  }
  ctx.fill();

  // Sznurek / przewiązanie worka
  ctx.fillStyle = '#f5eedb';
  ctx.fillRect(bx + 1.8, by + bh / 2 - 1.5, 0.9, 3);
  ctx.fillRect(bx + bw - 2.7, by + bh / 2 - 1.5, 0.9, 3);

  // Załamania i fałdy tkaniny (naprężenia materiału)
  ctx.strokeStyle = isOlive ? 'rgba(45, 44, 28, 0.35)' : 'rgba(60, 50, 32, 0.35)';
  ctx.lineWidth = 0.9;
  const numCreases = Math.max(2, Math.floor(bw / 12));
  for (let c = 1; c <= numCreases; c++) {
    const cxPos = bx + (bw / (numCreases + 1)) * c;
    ctx.beginPath();
    ctx.moveTo(cxPos - 2, by + 3);
    ctx.quadraticCurveTo(cxPos + 1, by + bh / 2, cxPos - 1, by + bh - 3);
    ctx.stroke();
  }

  // Szew poziomy przez środek worka
  ctx.strokeStyle = isOlive ? 'rgba(35, 34, 20, 0.25)' : 'rgba(50, 40, 24, 0.25)';
  ctx.lineWidth = 0.7;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(bx + 4, by + bh * 0.55);
  ctx.lineTo(bx + bw - 4, by + bh * 0.55);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

export function drawSandbags(ctx, x, y, w, h) {
  ctx.save();

  // Cień ogólny pod barykadą
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.beginPath();
  if (ctx.ellipse) {
    ctx.ellipse(x + w / 2, y + h, w * 0.48, 2.5, 0, 0, Math.PI * 2);
  } else {
    ctx.rect(x + 2, y + h - 2, w - 4, 2);
  }
  ctx.fill();

  // Warstwowy układ stosu worków (staggered stack)
  // Dolna warstwa: 2 worki obok siebie
  // Górna warstwa: 2 worki przesunięte, zachodzące na łączenie
  const rowH = Math.round(h * 0.56);
  const bottomY = y + h - rowH;
  const topY = y;

  const bBagW = Math.round(w * 0.52);

  // Dolne worki: lewy beżowy, prawy oliwkowy
  drawSingleSandbag(ctx, x, bottomY, bBagW, rowH, false);
  drawSingleSandbag(ctx, x + w - bBagW, bottomY, bBagW, rowH, true);

  // Cień rzucany przez górne worki na dolne
  ctx.fillStyle = 'rgba(15, 12, 8, 0.45)';
  ctx.fillRect(x + 4, bottomY - 0.5, w - 8, 2.5);

  // Górne worki: przesunięte, wypełniające stos
  const tBagW = Math.round(w * 0.46);
  const tBagH = Math.round(h * 0.52);
  const tOffset = Math.round((w - (tBagW * 2 - 4)) / 2);

  // Górne worki: lewy oliwkowy, prawy ciepły beż
  drawSingleSandbag(ctx, x + Math.max(2, tOffset), topY, tBagW, tBagH, true);
  drawSingleSandbag(ctx, x + w - Math.max(2, tOffset) - tBagW, topY, tBagW, tBagH, false);

  ctx.restore();
}

function drawHedgehog(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(-size / 2, size / 2); ctx.lineTo(size / 2, -size / 2);
  ctx.moveTo(-size / 2, -size / 2); ctx.lineTo(size / 2, size / 2);
  ctx.moveTo(0, -size / 2); ctx.lineTo(0, size / 2);
  ctx.stroke();
  ctx.restore();
}

export function drawBunkerBlock(ctx, x, y, w, h) {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#475569');
  grad.addColorStop(0.35, '#334155');
  grad.addColorStop(1, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x, y, w, 2.5);

  ctx.fillStyle = '#cbd5e1';
  const rRad = 2.2;
  ctx.beginPath();
  ctx.arc(x + 6, y + 6, rRad, 0, Math.PI * 2);
  ctx.arc(x + w - 6, y + 6, rRad, 0, Math.PI * 2);
  ctx.arc(x + 6, y + h - 6, rRad, 0, Math.PI * 2);
  ctx.arc(x + w - 6, y + h - 6, rRad, 0, Math.PI * 2);
  ctx.fill();

  const stripeH = Math.min(10, h * 0.3);
  const stripeY = y + (h - stripeH) / 2;
  drawHazardStripes(ctx, x + 4, stripeY, w - 8, stripeH);

  ctx.fillStyle = '#090d16';
  ctx.fillRect(x + w * 0.25, y + 7, w * 0.5, 4);
  ctx.restore();
}

export function drawCyberCatwalk(ctx, x, y, w, h) {
  ctx.save();
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 25, y); ctx.lineTo(x + 25, y - 180);
  ctx.moveTo(x + w - 25, y); ctx.lineTo(x + w - 25, y - 180);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 0;
  ctx.fillRect(x, y, w, 3);

  ctx.fillStyle = 'rgba(6, 182, 212, 0.18)';
  for (let sx = x + 10; sx < x + w - 10; sx += 18) {
    ctx.fillRect(sx, y + 5, 11, h - 8);
  }

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

export function drawNeonBarrier(ctx, x, y, w, h) {
  ctx.save();
  const time = performance.now() * 0.003;
  const pulse = 0.7 + 0.3 * Math.sin(time * 2);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x, y, 6, h);
  ctx.fillRect(x + w - 6, y, 6, h);

  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, `rgba(0, 229, 255, ${0.45 * pulse})`);
  grad.addColorStop(0.5, `rgba(168, 85, 247, ${0.30 * pulse})`);
  grad.addColorStop(1, `rgba(0, 229, 255, ${0.45 * pulse})`);
  ctx.fillStyle = grad;
  ctx.fillRect(x + 6, y, w - 12, h);

  ctx.strokeStyle = `rgba(0, 229, 255, ${0.85 * pulse})`;
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  const scanY = y + ((time * 35) % h);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 6, scanY);
  ctx.lineTo(x + w - 6, scanY);
  ctx.stroke();

  ctx.restore();
}

export function drawJumpPad(ctx, x, y, w, h) {
  ctx.save();
  const time = performance.now() * 0.005;

  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y + 4, w, h - 4, 3);
  else ctx.rect(x, y + 4, w, h - 4);
  ctx.fill();
  ctx.stroke();

  const padGrad = ctx.createLinearGradient(x, y, x + w, y);
  padGrad.addColorStop(0, '#10b981');
  padGrad.addColorStop(0.5, '#34d399');
  padGrad.addColorStop(1, '#10b981');
  ctx.fillStyle = padGrad;
  ctx.shadowColor = '#10b981';
  ctx.shadowBlur = 0;
  ctx.fillRect(x + 4, y, w - 8, 4);

  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const wave = Math.sin(time * 3);
  ctx.fillStyle = wave > 0 ? '#ffffff' : '#34d399';
  ctx.fillText('▲  ▲  ▲', x + w / 2, y + h / 2 + 1);

  ctx.restore();
}

export function drawCyberPillar(ctx, x, y, w, h) {
  // Wyłączono rysowanie pionowego słupka
}

export function drawExplosiveBarrel(ctx, x, y, w, h) {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, '#7f1d1d');
  grad.addColorStop(0.3, '#dc2626');
  grad.addColorStop(0.7, '#ef4444');
  grad.addColorStop(1, '#991b1b');
  ctx.fillStyle = grad;
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 3);
  else ctx.rect(x, y, w, h);
  ctx.fill();

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(x, y + 6); ctx.lineTo(x + w, y + 6);
  ctx.moveTo(x, y + h - 6); ctx.lineTo(x + w, y + h - 6);
  ctx.stroke();

  drawHazardStripes(ctx, x + 2, y + h * 0.38, w - 4, 8);

  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 0;
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🔥', x + w / 2, y + h * 0.72);

  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

export function drawBarbedWire(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#78716c';
  ctx.strokeStyle = '#292524';
  ctx.lineWidth = 1.2;
  ctx.fillRect(x + 4, y, 5, h);
  ctx.strokeRect(x + 4, y, 5, h);
  ctx.fillRect(x + w - 9, y, 5, h);
  ctx.strokeRect(x + w - 9, y, 5, h);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const cy = y + h / 2;
  for (let i = x + 8; i < x + w - 8; i += 7) {
    ctx.ellipse(i, cy, 3.5, 6, 0.4, 0, Math.PI * 2);
  }
  ctx.stroke();

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = x + 11; i < x + w - 10; i += 10) {
    ctx.moveTo(i - 2, cy - 5); ctx.lineTo(i + 2, cy + 5);
    ctx.moveTo(i - 2, cy + 5); ctx.lineTo(i + 2, cy - 5);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawSniperTower(ctx, x, y, w, h) {
  ctx.save();
  const platH = 14;
  const platY = y;
  const legsTopY = platY + platH;
  const legsBottomY = y + h;

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.0;

  ctx.beginPath();
  ctx.moveTo(x + 12, legsTopY); ctx.lineTo(x + 4, legsBottomY);
  ctx.moveTo(x + w - 12, legsTopY); ctx.lineTo(x + w - 4, legsBottomY);
  ctx.stroke();

  const numSections = 4;
  const secH = (legsBottomY - legsTopY) / numSections;
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = '#64748b';
  for (let s = 0; s < numSections; s++) {
    const sy1 = legsTopY + s * secH;
    const sy2 = sy1 + secH;
    const t1 = s / numSections;
    const t2 = (s + 1) / numSections;
    const lx1 = (x + 12) * (1 - t1) + (x + 4) * t1;
    const rx1 = (x + w - 12) * (1 - t1) + (x + w - 4) * t1;
    const lx2 = (x + 12) * (1 - t2) + (x + 4) * t2;
    const rx2 = (x + w - 12) * (1 - t2) + (x + w - 4) * t2;

    ctx.beginPath();
    ctx.moveTo(lx1, sy1); ctx.lineTo(rx2, sy2);
    ctx.moveTo(rx1, sy1); ctx.lineTo(lx2, sy2);
    ctx.moveTo(lx2, sy2); ctx.lineTo(rx2, sy2);
    ctx.stroke();
  }

  const ladderX = x + w / 2;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ladderX - 5, legsTopY); ctx.lineTo(ladderX - 5, legsBottomY);
  ctx.moveTo(ladderX + 5, legsTopY); ctx.lineTo(ladderX + 5, legsBottomY);
  ctx.stroke();

  ctx.lineWidth = 1.0;
  for (let ly = legsTopY + 10; ly < legsBottomY; ly += 12) {
    ctx.beginPath();
    ctx.moveTo(ladderX - 5, ly); ctx.lineTo(ladderX + 5, ly);
    ctx.stroke();
  }

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x, platY, w, platH);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, platY, w, platH);

  drawHazardStripes(ctx, x, platY + platH - 4, w, 4);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 2, platY - 14); ctx.lineTo(x + w - 2, platY - 14);
  ctx.moveTo(x + 2, platY); ctx.lineTo(x + 2, platY - 14);
  ctx.moveTo(x + w - 2, platY); ctx.lineTo(x + w - 2, platY - 14);
  ctx.moveTo(x + 24, platY); ctx.lineTo(x + 24, platY - 14);
  ctx.moveTo(x + w - 24, platY); ctx.lineTo(x + w - 24, platY - 14);
  ctx.stroke();

  ctx.restore();
}

export function drawMetalRamp(ctx, x, y, w, h, isLeft) {
  ctx.save();
  ctx.beginPath();
  if (isLeft) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
  } else {
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
  }
  ctx.closePath();

  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#334155');
  grad.addColorStop(0.5, '#1e293b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.2;
  for (let rx = x + 16; rx < x + w - 8; rx += 16) {
    const t = (rx - x) / w;
    const topRampY = isLeft ? (y + t * h) : (y + (1 - t) * h);
    ctx.beginPath();
    ctx.moveTo(rx, topRampY);
    ctx.lineTo(rx, y + h);
    ctx.stroke();
  }

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  if (isLeft) {
    ctx.moveTo(x, y); ctx.lineTo(x + w, y + h);
  } else {
    ctx.moveTo(x, y + h); ctx.lineTo(x + w, y);
  }
  ctx.stroke();

  drawHazardStripes(ctx, x, y + h - 4, w, 4);
  ctx.restore();
}

export function drawTallConcreteWall(ctx, x, y, w, h) {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, '#475569');
  grad.addColorStop(0.35, '#334155');
  grad.addColorStop(1, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x - 2, y, w + 4, 4);

  drawHazardStripes(ctx, x + 2, y + h * 0.45, w - 4, 12);

  ctx.fillStyle = '#0f172a';
  for (let ry = y + 16; ry < y + h - 14; ry += 28) {
    ctx.beginPath();
    ctx.arc(x + w / 2, ry, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawSpeedBoosterPad(ctx, x, y, w, h) {
  ctx.save();
  const time = performance.now() * 0.006;
  ctx.fillStyle = '#090d16';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(x, y, w, h);

  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const offset = Math.floor((time * 15) % 3);
  for (let i = 0; i < 4; i++) {
    const arrowX = x + 14 + i * 16;
    ctx.fillStyle = ((i + offset) % 3 === 0) ? '#ffffff' : '#00e5ff';
    ctx.fillText('▶▶', arrowX, y + h / 2 + 1);
  }
  ctx.restore();
}

export function drawGravityLift(ctx, x, y, w, h) {
  ctx.save();
  const time = performance.now() * 0.003;
  const pulse = 0.6 + 0.4 * Math.sin(time * 3);

  const padH = 10;
  const padY = y + h - padH;
  ctx.fillStyle = '#090d16';
  ctx.fillRect(x, padY, w, padH);
  ctx.strokeStyle = '#a855f7';
  ctx.shadowColor = '#a855f7';
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2.0;
  ctx.strokeRect(x, padY, w, padH);

  const beamGrad = ctx.createLinearGradient(x, padY, x, y);
  beamGrad.addColorStop(0, `rgba(168, 85, 247, ${0.45 * pulse})`);
  beamGrad.addColorStop(0.5, `rgba(0, 229, 255, ${0.30 * pulse})`);
  beamGrad.addColorStop(1, 'rgba(168, 85, 247, 0.0)');
  ctx.fillStyle = beamGrad;
  ctx.fillRect(x + 4, y, w - 8, h - padH);

  ctx.strokeStyle = `rgba(0, 229, 255, ${0.65 * pulse})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 4, padY); ctx.lineTo(x + 4, y);
  ctx.moveTo(x + w - 4, padY); ctx.lineTo(x + w - 4, y);
  ctx.stroke();

  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#00e5ff';
  for (let k = 0; k < 3; k++) {
    const arrowY = padY - (((time * 45 + k * 50) % (h - 20)));
    ctx.fillText('▲', x + w / 2, arrowY);
  }
  ctx.restore();
}

export function drawLaserGate(ctx, x, y, w, h) {
  ctx.save();
  const time = performance.now() * 0.005;
  const pulse = 0.7 + 0.3 * Math.sin(time * 6);

  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 1.5;
  ctx.fillRect(x - 3, y, w + 6, 8);
  ctx.strokeRect(x - 3, y, w + 6, 8);
  ctx.fillRect(x - 3, y + h - 8, w + 6, 8);
  ctx.strokeRect(x - 3, y + h - 8, w + 6, 8);

  const laserGrad = ctx.createLinearGradient(x, y, x + w, y);
  laserGrad.addColorStop(0, `rgba(244, 63, 94, ${0.75 * pulse})`);
  laserGrad.addColorStop(0.5, '#ffffff');
  laserGrad.addColorStop(1, `rgba(244, 63, 94, ${0.75 * pulse})`);
  ctx.fillStyle = laserGrad;
  ctx.shadowColor = '#f43f5e';
  ctx.shadowBlur = 0;
  ctx.fillRect(x + 2, y + 8, w - 4, h - 16);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  for (let ly = y + 14; ly < y + h - 14; ly += 14) {
    const jitter = Math.sin(time * 8 + ly) * 3;
    ctx.moveTo(x, ly);
    ctx.lineTo(x + w + jitter, ly);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawFloatingHex(ctx, x, y, w, h) {
  ctx.save();
  const time = performance.now() * 0.002;
  const pulse = 0.5 + 0.5 * Math.sin(time * 3);
  const cut = 12;

  ctx.beginPath();
  ctx.moveTo(x + cut, y);
  ctx.lineTo(x + w - cut, y);
  ctx.lineTo(x + w, y + h / 2);
  ctx.lineTo(x + w - cut, y + h);
  ctx.lineTo(x + cut, y + h);
  ctx.lineTo(x, y + h / 2);
  ctx.closePath();

  ctx.fillStyle = '#0f172a';
  ctx.fill();

  ctx.strokeStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(x + 20, y + h / 2 - 2, w - 40, 4);

  ctx.fillStyle = `rgba(0, 229, 255, ${0.35 + pulse * 0.35})`;
  ctx.shadowBlur = 0;
  ctx.fillRect(x + cut + 6, y + h, w - 2 * cut - 12, 4);

  ctx.restore();
}

export function drawCyberBumper(ctx, x, y, w, h, hitTimer = 0) {
  ctx.save();
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = (w || 40) / 2;
  const isHit = hitTimer > 0;

  ctx.fillStyle = isHit ? '#ffffff' : '#090d16';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isHit ? '#f43f5e' : '#00e5ff';
  ctx.shadowColor = isHit ? '#f43f5e' : '#00e5ff';
  ctx.shadowBlur = 0;
  ctx.lineWidth = isHit ? 3.5 : 2.5;
  ctx.stroke();

  ctx.strokeStyle = isHit ? '#ffffff' : '#38bdf8';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = isHit ? '#f43f5e' : '#00e5ff';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export const OBSTACLE_RENDERERS = {
  sandbag: drawSandbags,
  sandbags: drawSandbags,
  sand_bag: drawSandbags,
  sand_bags: drawSandbags,
  worki: drawSandbags,
  ammo: drawCrate,
  ammo_crate: drawCrate,
  ammoBox: drawCrate,
  ammobox: drawCrate,
  ammo_depot: drawCrate,
  crate: drawCrate,
  bunker_block: drawBunkerBlock,
  cyber_catwalk: drawCyberCatwalk,
  neon_barrier: drawNeonBarrier,
  jump_pad: drawJumpPad,
  cyber_pillar: drawCyberPillar,
  explosive_barrel: drawExplosiveBarrel,
  barbed_wire: drawBarbedWire,
  sniper_tower: drawSniperTower,
  tall_concrete_wall: drawTallConcreteWall,
  speed_booster_pad: drawSpeedBoosterPad,
  gravity_lift: drawGravityLift,
  laser_gate: drawLaserGate,
  floating_hex: drawFloatingHex
};

export function drawSingleObstacleByType(ctx, type, x, y, w, h, groundY = 500, hitTimer = 0) {
  const norm = normalizeObstacleType(type);

  // Słownik metod renderujących przeszkody
  const renderer = OBSTACLE_RENDERERS[type] || OBSTACLE_RENDERERS[norm];
  if (typeof renderer === 'function') {
    renderer(ctx, x, y, w, h);
    return;
  }

  // Switch / case jako gwarantowany mechanizm renderowania dla wszystkich typów i aliasów
  switch (norm) {
    case 'sandbags':
      drawSandbags(ctx, x, y, w, h);
      break;
    case 'ammo_depot':
      drawCrate(ctx, x, y, w, h);
      break;
    case 'catwalk':
      drawCatwalk(ctx, { x, w, relY: groundY - y, thickness: h }, groundY);
      break;
    case 'hedgehog':
      drawHedgehog(ctx, x + w / 2, y + h / 2, w);
      break;
    case 'bunker_block':
      drawBunkerBlock(ctx, x, y, w, h);
      break;
    case 'cyber_catwalk':
      drawCyberCatwalk(ctx, x, y, w, h);
      break;
    case 'neon_barrier':
      drawNeonBarrier(ctx, x, y, w, h);
      break;
    case 'jump_pad':
      drawJumpPad(ctx, x, y, w, h);
      break;
    case 'cyber_pillar':
      drawCyberPillar(ctx, x, y, w, h);
      break;
    case 'explosive_barrel':
      drawExplosiveBarrel(ctx, x, y, w, h);
      break;
    case 'barbed_wire':
      drawBarbedWire(ctx, x, y, w, h);
      break;
    case 'sniper_tower':
      drawSniperTower(ctx, x, y, w, h);
      break;
    case 'metal_ramp_left':
      drawMetalRamp(ctx, x, y, w, h, true);
      break;
    case 'metal_ramp_right':
      drawMetalRamp(ctx, x, y, w, h, false);
      break;
    case 'tall_concrete_wall':
      drawTallConcreteWall(ctx, x, y, w, h);
      break;
    case 'speed_booster_pad':
      drawSpeedBoosterPad(ctx, x, y, w, h);
      break;
    case 'gravity_lift':
      drawGravityLift(ctx, x, y, w, h);
      break;
    case 'laser_gate':
      drawLaserGate(ctx, x, y, w, h);
      break;
    case 'floating_hex':
      drawFloatingHex(ctx, x, y, w, h);
      break;
    case 'cyber_bumper':
      drawCyberBumper(ctx, x, y, w, h, hitTimer);
      break;
    case 'wooden_ladder':
      drawWoodenLadder(ctx, x, y, w, h);
      break;
    case 'jungle_hut':
      drawJungleHutObstacle(ctx, x, y, w, h);
      break;
    case 'jungle_rock':
      drawJungleRockObstacle(ctx, x, y, w, h);
      break;
    default:
      if (type === 'sandbag' || type === 'sandbags' || type === 'sand_bag' || type === 'sand_bags') {
        drawSandbags(ctx, x, y, w, h);
      } else if (
        type === 'ammo' ||
        type === 'ammo_crate' ||
        type === 'ammoBox' ||
        type === 'ammobox' ||
        type === 'ammo_depot' ||
        type === 'crate'
      ) {
        drawCrate(ctx, x, y, w, h);
      }
      break;
  }
}

/**
 * Procedura renderowania sztucznych konstrukcji drewnianych.
 * Zgodnie z wytycznymi wszystkie drabiny, wieże i wiszące mosty zostały usunięte z jaskini.
 */
export function drawJungleWoodStructure(ctx, plat, groundY) {
  // Wszystkie sztuczne struktury (drabiny, pomosty, kładki wiszące, wieże) zostały usunięte na rzecz surowej, naturalnej groty skalnej
}

/**
 * Renderuje realistyczny drewniany bunkier z bali z wąską strzelnicą i nasypem ziemno-trawiastym
 */
export function drawWoodenLogBunker(ctx, x, y, w, h) {
  ctx.save();
  const logCount = 4;
  const logH = Math.round(h / (logCount + 0.6));

  // Cień bunkra na gruncie
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.fillRect(x + 4, y + h - 2, w - 8, 4);

  // 1. Ściany z ułożonych wzdłużnie bali sosnowych
  for (let i = 0; i < logCount; i++) {
    const ly = y + h - (i + 1) * logH;
    const logGrad = ctx.createLinearGradient(0, ly, 0, ly + logH);
    logGrad.addColorStop(0.0, '#3a2315');
    logGrad.addColorStop(0.35, '#5c3a23');
    logGrad.addColorStop(0.70, '#754b2d');
    logGrad.addColorStop(1.0, '#311d11');
    ctx.fillStyle = logGrad;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, ly, w, logH - 1, 3) : ctx.rect(x, ly, w, logH - 1);
    ctx.fill();

    // Głęboka szczelina / mszyste uszczelnienie między balami
    ctx.strokeStyle = '#180e07';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, ly + logH - 1);
    ctx.lineTo(x + w, ly + logH - 1);
    ctx.stroke();

    // Słoje drewna i spękania
    ctx.strokeStyle = 'rgba(24, 14, 7, 0.55)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(x + 12, ly + logH * 0.45);
    ctx.lineTo(x + w * 0.45, ly + logH * 0.48);
    ctx.moveTo(x + w * 0.6, ly + logH * 0.52);
    ctx.lineTo(x + w - 16, ly + logH * 0.46);
    ctx.stroke();

    // Końcówki bali (czopowe zaciosy na rogach z widocznymi słojami)
    ctx.fillStyle = '#6d4529';
    ctx.beginPath();
    ctx.ellipse(x + 6, ly + logH * 0.5, 4.5, logH * 0.42, 0, 0, Math.PI * 2);
    ctx.ellipse(x + w - 6, ly + logH * 0.5, 4.5, logH * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#24140a';
    ctx.stroke();
  }

  // 2. Pozioma szczelina strzelecka (embrasure)
  const slitW = Math.round(w * 0.44);
  const slitH = Math.round(logH * 0.95);
  const slitX = x + Math.round((w - slitW) / 2);
  const slitY = y + Math.round(h * 0.36);

  // Wnętrze ciemnego bunkra
  ctx.fillStyle = '#0a0d12';
  ctx.fillRect(slitX, slitY, slitW, slitH);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.0;
  ctx.strokeRect(slitX, slitY, slitW, slitH);

  // Stalowa płyta opancerzenia otworu strzelniczego
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(slitX - 2, slitY - 1, slitW + 4, slitH + 2);

  // Stalowe nity opancerzenia
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(slitX - 1, slitY - 1, 2.5, 2.5);
  ctx.fillRect(slitX + slitW - 1.5, slitY - 1, 2.5, 2.5);
  ctx.fillRect(slitX - 1, slitY + slitH - 1.5, 2.5, 2.5);
  ctx.fillRect(slitX + slitW - 1.5, slitY + slitH - 1.5, 2.5, 2.5);

  // 3. Ciężki strop z bali i warstwa skalnego kruszywa / płyt stalowych
  const roofH = 14;
  const roofY = y - 4;
  const roofGrad = ctx.createLinearGradient(0, roofY - roofH, 0, roofY);
  roofGrad.addColorStop(0.0, '#334155');
  roofGrad.addColorStop(0.4, '#1e293b');
  roofGrad.addColorStop(0.85, '#0f172a');
  roofGrad.addColorStop(1.0, '#26160d');
  ctx.fillStyle = roofGrad;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x - 8, roofY - roofH, w + 16, roofH + 6, [4, 4, 2, 2]) : ctx.rect(x - 8, roofY - roofH, w + 16, roofH + 6);
  ctx.fill();

  // Poszarpane odłamki skalnego kruszywa i stalowe nakładki na stropie schronu
  ctx.fillStyle = '#64748b';
  for (let bx = x - 4; bx <= x + w + 4; bx += 10) {
    const th = 4 + ((bx * 17) % 6);
    ctx.beginPath();
    ctx.moveTo(bx, roofY - roofH);
    ctx.lineTo(bx + 2, roofY - roofH - th);
    ctx.lineTo(bx + 4.5, roofY - roofH);
    ctx.closePath();
    ctx.fill();
  }

  // Stalowe okucia i nity stropowe
  ctx.fillStyle = '#94a3b8';
  for (let rx = x; rx <= x + w; rx += 24) {
    ctx.fillRect(rx - 2, roofY - roofH + 2, 4, 3);
  }

  ctx.restore();
}

export function drawSniperTowerStructure(ctx, groundY) {
  // Całkowicie usunięto wieżę szybową / strażniczą na życzenie użytkownika
}

/**
 * Renderuje wagonik górniczy ze stalową kolebą i urobkiem skalnym
 */
export function drawMineOreCart(ctx, x, y) {
  // Koła wagonika
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(x + 10, y + 20, 7, 0, Math.PI * 2);
  ctx.arc(x + 44, y + 20, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Podwozie
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + 2, y + 14, 50, 4);

  // Korpus stalowej koleby na urobek
  const cartGrad = ctx.createLinearGradient(x, y, x, y + 15);
  cartGrad.addColorStop(0.0, '#334155');
  cartGrad.addColorStop(0.5, '#1e293b');
  cartGrad.addColorStop(1.0, '#0f172a');
  ctx.fillStyle = cartGrad;

  ctx.beginPath();
  ctx.moveTo(x, y + 1);
  ctx.lineTo(x + 54, y + 1);
  ctx.lineTo(x + 48, y + 14);
  ctx.lineTo(x + 6, y + 14);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Urobek skalny w wagoniku (ciemne bryły antracytu z błyskiem)
  ctx.fillStyle = '#090d14';
  ctx.beginPath();
  ctx.arc(x + 14, y + 1, 8, Math.PI, 0);
  ctx.arc(x + 27, y - 2, 10, Math.PI, 0);
  ctx.arc(x + 40, y + 1, 8, Math.PI, 0);
  ctx.fill();
}

/**
 * Renderuje skrzynkę z dynamitem (TNT)
 */
export function drawDynamiteCrate(ctx, x, y) {
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x, y, 28, 22);
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x, y, 28, 22);

  // Stalowe taśmy spinające
  ctx.fillStyle = '#334155';
  ctx.fillRect(x + 4, y, 3, 22);
  ctx.fillRect(x + 21, y, 3, 22);

  // Czerwone pole ostrzegawcze
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(x + 8, y + 8, 12, 6);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 5px sans-serif';
  ctx.fillText('TNT', x + 9, y + 13);
}

/**
 * Renderuje elementy infrastruktury górniczej, szańce, skrzynie i wagoniki w jaskini
 */
export function drawJungleCanyonProps(ctx, groundY) {
  // 1. Lewy bastion - okop i skrzynia z dynamitem (x: 200, y: 420)
  drawSandbags(ctx, 200, 420 - 26, 100, 26);
  drawDynamiteCrate(ctx, 160, 420 - 22);

  // 2. Szczyt wzgórza / grzbiet pomostu - okop z worków z piaskiem (x: 1720, y: 355)
  drawSandbags(ctx, 1720, 355 - 26, 90, 26);

  // 3. Półka dolna urwiska (Step 1) - szaniec z worków i wagonik z urobkiem (x: 2640, y: 480)
  drawSandbags(ctx, 2640, 480 - 28, 140, 28);
  drawMineOreCart(ctx, 2790, 480 - 26);

  // 4. Półka środkowa urwiska (Step 2) - drewniany schron kopalniany (x: 2890, y: 440)
  drawWoodenLogBunker(ctx, 2890, 440 - 74, 180, 74);
  drawDynamiteCrate(ctx, 3080, 440 - 22);

  // 5. Prawy bastion - okop z worków z piaskiem (x: 3320, y: 420)
  drawSandbags(ctx, 3320, 420 - 26, 110, 26);

  // 6. Wagonik i skrzynia z dynamitem na dnie dolnej sali bojowej (y: 1180)
  drawMineOreCart(ctx, 1450, 1180 - 26);
  drawDynamiteCrate(ctx, 1120, 1180 - 22);
}
export const drawMineCavernProps = drawJungleCanyonProps;

export function drawSubterraneanCorridors(ctx, groundY) {
  // Usunięto sztuczne czarne prostokątne boksy podziemne na życzenie użytkownika
}

export function drawWoodenStiltsAndOverhangBrackets(ctx, groundY) {
  // Usunięto pojedyncze wiszące słupy i wsporniki pod skałami na życzenie użytkownika
}

/**
 * Renderuje organiczne skały dżungli z gradientem (#2A323D do #1A1F26),
 * wtopionymi głazami, pęknięciami, skalnym kruszywem i fundamentami zintegrowanymi z rzeźbą terenu
 */
export function drawJungleRockPlatform(ctx, plat, groundY) {
  ctx.save();
  const time = performance.now() * 0.001;
  const x = plat.x;
  const w = plat.w;
  const bedrockBottomY = groundY + 180; // Lity masyw schodzący w dół w fundamenty

  // 1. ZBUDOWANIE ŚCIEŻKI GÓRNEJ KRAWĘDZI I KORPUSU WIELOKĄTA SKALNEGO
  let polyPoints = [];
  let minY = groundY;

  if (Array.isArray(plat.surfacePoints) && plat.surfacePoints.length >= 2) {
    polyPoints = plat.surfacePoints.map(p => ({
      x: p.x,
      y: p.y !== undefined ? p.y : (groundY - (p.relY || 0))
    }));
  } else if (plat.isSlope) {
    polyPoints = [
      { x: x, y: groundY - plat.startRelY },
      { x: x + w, y: groundY - plat.endRelY }
    ];
  } else {
    const topY = groundY - (plat.relY || 100);
    polyPoints = [
      { x: x, y: topY },
      { x: x + w, y: topY }
    ];
  }

  for (const pt of polyPoints) {
    if (pt.y < minY) minY = pt.y;
  }

  // 2. PROCEDURALNA TEKSTURA LITEJ SKAŁY, WARSTWY OSADOWE I KRAWĘDZIE GZYMSU
  // Zastąpiono powtarzalne owale/głazy i trójkątne zęby jednolitym systemem geologicznym
  drawCaveTerrain(ctx, polyPoints, bedrockBottomY, groundY);

  // 3. RENDEROWANIE PROPSÓW PRZYPISANYCH DO PLATFORMY (BUNKER, SANDBAGS)
  if (plat.props) {
    for (const prop of plat.props) {
      const propTopY = getPlatformSurfaceY(plat, x + prop.rx, groundY);
      const bx = x + prop.rx;
      const by = propTopY - prop.h;

      if (prop.type === 'sandbag_trench') {
        drawSandbags(ctx, bx, by, prop.w, prop.h);
      } else if (prop.type === 'wooden_log_bunker') {
        drawWoodenLogBunker(ctx, bx, by, prop.w, prop.h);
      }
    }
  }

  ctx.restore();
}

export function drawWoodenLadder(ctx, x, y, w, h) {
  // Całkowicie usunięto szczeble i konstrukcję drabin na życzenie użytkownika
}

export function drawJungleHutObstacle(ctx, x, y, w, h) {
  drawJungleWoodStructure(ctx, { x, w, relY: 500 - y, thickness: h, isJungleHut: true }, 500);
}

export function drawJungleRockObstacle(ctx, x, y, w, h) {
  drawJungleRockPlatform(ctx, { x, w, relY: 500 - y, thickness: h, theme: 'jungle' }, 500);
}

function drawRockIsland(ctx, plat, groundY) {
  if (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY') {
    return;
  }
  if (plat.theme === 'jungle') {
    drawJungleRockPlatform(ctx, plat, groundY);
    return;
  }
  const topY = groundY - plat.relY;
  const thick = plat.thickness || 20;

  ctx.save();

  if (plat.isCyberBastion || plat.isBastion) {
    const isCyan = plat.theme === 'cyan';
    const accentCol = isCyan ? '#06b6d4' : '#f97316';
    const accentCore = isCyan ? '#00e5ff' : '#ff7700';

    ctx.fillStyle = '#090d16';
    ctx.fillRect(plat.x, topY, plat.w, thick);
    ctx.strokeStyle = isCyan ? 'rgba(6, 182, 212, 0.4)' : 'rgba(249, 115, 22, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plat.x, topY, plat.w, thick);

    // Jaskrawa neonowa krawędź nawierzchni
    ctx.save();
    ctx.strokeStyle = accentCol;
    ctx.shadowColor = accentCore;
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(plat.x, topY);
    ctx.lineTo(plat.x + plat.w, topY);
    ctx.stroke();

    ctx.strokeStyle = isCyan ? '#a5f3fc' : '#fed7aa';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(plat.x, topY);
    ctx.lineTo(plat.x + plat.w, topY);
    ctx.stroke();
    ctx.restore();

    drawHazardStripes(ctx, plat.x, topY + thick - 5, plat.w, 4);
  } else if (plat.theme === 'foundry') {
    // Korpus platformy zardzewiały
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(plat.x, topY, plat.w, thick);
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plat.x, topY, plat.w, thick);

    // Górna linia i poświata imitujące gorącą stal / ostrzegawcze paski
    const accentCol = '#ea580c';
    const accentCore = '#f97316';

    ctx.save();
    ctx.strokeStyle = accentCol;
    ctx.shadowColor = accentCore;
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(plat.x, topY);
    ctx.lineTo(plat.x + plat.w, topY);
    ctx.stroke();

    ctx.strokeStyle = '#fef08a';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(plat.x, topY);
    ctx.lineTo(plat.x + plat.w, topY);
    ctx.stroke();
    ctx.restore();

    drawHazardStripes(ctx, plat.x, topY + thick - 5, plat.w, 4);
  } else if (plat.isAltar || plat.type === 'altar_island') {
    ctx.fillStyle = '#080c14';
    ctx.fillRect(plat.x, topY, plat.w, thick);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(plat.x, topY, plat.w, thick);

    // Jaskrawa neonowa krawędź ołtarza
    ctx.save();
    ctx.strokeStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(plat.x, topY);
    ctx.lineTo(plat.x + plat.w, topY);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(plat.x, topY);
    ctx.lineTo(plat.x + plat.w, topY);
    ctx.stroke();
    ctx.restore();

    drawHazardStripes(ctx, plat.x, topY + thick - 5, plat.w, 4);
  } else {
    const isCyan = (plat.x + plat.w / 2 < 1760);
    const accentCol = isCyan ? '#06b6d4' : '#f97316';
    const accentCore = isCyan ? '#00e5ff' : '#ff7700';

    ctx.fillStyle = '#090d16';
    ctx.fillRect(plat.x, topY, plat.w, thick);
    ctx.strokeStyle = isCyan ? 'rgba(6, 182, 212, 0.4)' : 'rgba(249, 115, 22, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plat.x, topY, plat.w, thick);

    // Jaskrawa neonowa krawędź platformy
    ctx.save();
    ctx.strokeStyle = accentCol;
    ctx.shadowColor = accentCore;
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(plat.x, topY);
    ctx.lineTo(plat.x + plat.w, topY);
    ctx.stroke();

    ctx.strokeStyle = isCyan ? '#a5f3fc' : '#fed7aa';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(plat.x, topY);
    ctx.lineTo(plat.x + plat.w, topY);
    ctx.stroke();
    ctx.restore();

    drawHazardStripes(ctx, plat.x, topY + thick - 4, plat.w, 4);
  }

  if (plat.props) {
    for (let prop of plat.props) {
      const px = plat.x + prop.rx;
      if (prop.type === 'altar_pedestal') {
        const by = topY - prop.h;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px, by, prop.w, prop.h);
        ctx.strokeStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 0;
        ctx.lineWidth = 2.0;
        ctx.strokeRect(px, by, prop.w, prop.h);
        ctx.shadowBlur = 0;
        drawHazardStripes(ctx, px + 8, by + prop.h - 6, prop.w - 16, 4);

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ ALTAR OF WAR ⚡', px + prop.w / 2, by + 16);
      }
    }
  }

  // Poszarpane, okopcone krawędzie krateru i wystające pręty zbrojeniowe
  if (plat.scorchMark || plat.scorchLeft || plat.scorchRight) {
    drawPlatformScorchEdges(ctx, plat.x, topY, plat.w, thick, plat.scorchLeft, plat.scorchRight);
  }

  ctx.restore();
}

/**
 * Rysowanie okopconych, postrzępionych brzegów ocalałej platformy po wybuchu HE
 * wraz z ciemnym gradientem oraz wystającymi metalowymi kikutami/prętami o grubości 1–2px
 */
export function drawPlatformScorchEdges(ctx, x, y, w, h, scorchLeft, scorchRight) {
  if (!scorchLeft && !scorchRight) return;

  ctx.save();

  // 1. Lewa krawędź – poszarpana, okopcona, z wystającymi prętami zbrojeniowymi
  if (scorchLeft) {
    const sootW = Math.min(24, Math.max(12, w * 0.45));
    const grad = ctx.createLinearGradient(x, y, x + sootW, y);
    grad.addColorStop(0.0, 'rgba(10, 15, 26, 0.98)');
    grad.addColorStop(0.45, 'rgba(23, 29, 44, 0.75)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y - 1, sootW, h + 2);

    // Poszarpany profil zniszczonego betonu
    ctx.fillStyle = '#0b0f19';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 3.5, y + h * 0.22);
    ctx.lineTo(x - 1.2, y + h * 0.52);
    ctx.lineTo(x + 4.0, y + h * 0.82);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x - 3, y + h);
    ctx.lineTo(x - 3, y);
    ctx.closePath();
    ctx.fill();

    // Wystające pręty zbrojeniowe / kikuty metalu (1–2px grubości)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x + 1, y + h * 0.28);
    ctx.lineTo(x - 6, y + h * 0.20);
    ctx.lineTo(x - 10, y + h * 0.36);
    ctx.moveTo(x + 2, y + h * 0.72);
    ctx.lineTo(x - 7, y + h * 0.80);
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 11, y + h * 0.34, 2.5, 2.5);
    ctx.fillRect(x - 8, y + h * 0.78, 2.5, 2.5);
  }

  // 2. Prawa krawędź – poszarpana, okopcona, z wystającymi prętami
  if (scorchRight) {
    const sootW = Math.min(24, Math.max(12, w * 0.45));
    const rightEdge = x + w;
    const grad = ctx.createLinearGradient(rightEdge, y, rightEdge - sootW, y);
    grad.addColorStop(0.0, 'rgba(10, 15, 26, 0.98)');
    grad.addColorStop(0.45, 'rgba(23, 29, 44, 0.75)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(rightEdge - sootW, y - 1, sootW, h + 2);

    // Poszarpany profil zniszczonego betonu
    ctx.fillStyle = '#0b0f19';
    ctx.beginPath();
    ctx.moveTo(rightEdge, y);
    ctx.lineTo(rightEdge - 3.5, y + h * 0.22);
    ctx.lineTo(rightEdge + 1.2, y + h * 0.52);
    ctx.lineTo(rightEdge - 4.0, y + h * 0.82);
    ctx.lineTo(rightEdge, y + h);
    ctx.lineTo(rightEdge + 3, y + h);
    ctx.lineTo(rightEdge + 3, y);
    ctx.closePath();
    ctx.fill();

    // Wystające pręty zbrojeniowe (1–2px)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(rightEdge - 1, y + h * 0.26);
    ctx.lineTo(rightEdge + 7, y + h * 0.18);
    ctx.lineTo(rightEdge + 11, y + h * 0.34);
    ctx.moveTo(rightEdge - 2, y + h * 0.68);
    ctx.lineTo(rightEdge + 8, y + h * 0.76);
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(rightEdge + 10, y + h * 0.32, 2.5, 2.5);
    ctx.fillRect(rightEdge + 7, y + h * 0.74, 2.5, 2.5);
  }

  ctx.restore();
}

function drawCatwalk(ctx, cat, groundY) {
  const topY = (cat.y !== undefined) ? cat.y : (groundY - (cat.relY || 0));
  const isFoundry = (cat.theme === 'foundry');
  const isCyan = !isFoundry && (cat.x + cat.w / 2 < 1760);
  const neonCol = isFoundry ? '#ea580c' : (isCyan ? '#06b6d4' : '#f97316');
  const neonCore = isFoundry ? '#f97316' : (isCyan ? '#00e5ff' : '#ff7700');

  ctx.save();

  // Ciemny korpus kładki w estetyce cyberpunk / zardzewiała stal huty
  ctx.fillStyle = isFoundry ? '#1c1917' : '#090d16';
  ctx.fillRect(cat.x, topY, cat.w, cat.thickness);

  // Wewnętrzne szczeliny techniczne z podświetleniem huty
  ctx.fillStyle = isFoundry
    ? 'rgba(234, 88, 12, 0.22)'
    : (isCyan ? 'rgba(6, 182, 212, 0.14)' : 'rgba(249, 115, 22, 0.14)');
  for (let hx = cat.x + 8; hx < cat.x + cat.w - 8; hx += 16) {
    ctx.fillRect(hx, topY + 4, 10, cat.thickness - 7);
  }

  // Zewnętrzny obrys techniczny
  ctx.strokeStyle = isFoundry
    ? 'rgba(234, 88, 12, 0.45)'
    : (isCyan ? 'rgba(6, 182, 212, 0.45)' : 'rgba(249, 115, 22, 0.45)');
  ctx.lineWidth = 1.4;
  ctx.strokeRect(cat.x, topY, cat.w, cat.thickness);

  // =========================================================================
  // JASKRAWA, NEONOWA KRAWĘDŹ NAWIERZCHNI PLATFORMY
  // =========================================================================
  ctx.save();
  ctx.strokeStyle = neonCol;
  ctx.shadowColor = neonCore;
  ctx.shadowBlur = 0;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(cat.x, topY);
  ctx.lineTo(cat.x + cat.w, topY);
  ctx.stroke();

  // Wewnętrzny biało-żółty rdzeń świetlny
  ctx.strokeStyle = isFoundry ? '#fef08a' : (isCyan ? '#a5f3fc' : '#fed7aa');
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cat.x, topY);
  ctx.lineTo(cat.x + cat.w, topY);
  ctx.stroke();
  ctx.restore();

  drawHazardStripes(ctx, cat.x, topY + cat.thickness - 4, cat.w, 4);

  // Poszarpane, okopcone krawędzie krateru i wystające pręty zbrojeniowe
  if (cat.scorchMark || cat.scorchLeft || cat.scorchRight) {
    drawPlatformScorchEdges(ctx, cat.x, topY, cat.w, cat.thickness, cat.scorchLeft, cat.scorchRight);
  }

  ctx.restore();
}

function drawBastionSubstructure(ctx, startX, width, topY, bottomY, accentColor) {
  // Wyłączono pionowe słupy i linie akcentowe areny
}

function drawCyberStadiumStructures(ctx, groundY) {
  // Wyłączono pionowe struktury koloseum
}

// =========================================================================
// RENDEROWANIE BRAMEK SPORTOWYCH (CYAN & ORANGE NEON GOALS)
// =========================================================================
export function drawNeonGoals(ctx, groundY, goals) {
  if (!goals || goals.length === 0) return;

  for (const g of goals) {
    if (!g || !g.team) continue;
    const topY = (g.y !== undefined) ? g.y : (groundY - (g.relY || 0));
    const h = g.h || 140;
    const bottomY = (g.bottomY !== undefined) ? g.bottomY : ((g.y !== undefined) ? (g.y + h) : (groundY - (g.relY || 0) + h));
    const leftX = g.x;
    const rightX = g.x + (g.w || 220);
    const w = rightX - leftX;
    const isCyan = g.team === 'CYAN';
    const mainCol = isCyan ? '#00F0FF' : '#FF8800';
    const glowCol = isCyan ? 'rgba(0, 240, 255, 0.85)' : 'rgba(255, 136, 0, 0.85)';

    ctx.save();
    ctx.shadowBlur = 0; // Strictly 0 for 60 FPS

    // 1. Poświata siatki bramki (Neon Net Glow)
    const netGlow = ctx.createLinearGradient(
      g.facing === 1 ? leftX : rightX, bottomY,
      g.facing === 1 ? rightX : leftX, bottomY
    );
    netGlow.addColorStop(0.0, isCyan ? 'rgba(0, 240, 255, 0.28)' : 'rgba(255, 136, 0, 0.28)');
    netGlow.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = netGlow;
    ctx.fillRect(leftX, topY, w, h);

    // 2. Fizyczna siatka bramki (Physical Net Mesh)
    ctx.save();
    ctx.strokeStyle = isCyan ? 'rgba(0, 240, 255, 0.42)' : 'rgba(255, 136, 0, 0.42)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const netStep = 14;
    for (let x = leftX; x <= rightX; x += netStep) {
      ctx.moveTo(x, topY);
      ctx.lineTo(x + (g.facing === 1 ? -10 : 10), bottomY);
    }
    for (let y = topY; y <= bottomY; y += netStep) {
      ctx.moveTo(leftX, y);
      ctx.lineTo(rightX, y);
    }
    ctx.stroke();
    ctx.restore();

    // 3. Neonowe słupki i poprzeczka (Neon Cage Frame)
    ctx.save();
    ctx.strokeStyle = mainCol;
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3.6;

    const mouthX = g.facing === 1 ? rightX : leftX;
    const backX = g.facing === 1 ? leftX : rightX;

    // Klatka bramkowa: wlot, poprzeczka do tyłu, tylny słupek
    ctx.beginPath();
    ctx.moveTo(mouthX, bottomY);
    ctx.lineTo(mouthX, topY);
    ctx.lineTo(backX, topY);
    ctx.lineTo(backX, bottomY);
    ctx.stroke();

    // Dolna poprzeczka
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(backX, bottomY);
    ctx.lineTo(mouthX, bottomY);
    ctx.stroke();

    // Wewnętrzny biały rdzeń
    ctx.strokeStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(mouthX, bottomY);
    ctx.lineTo(mouthX, topY);
    ctx.lineTo(backX, topY);
    ctx.lineTo(backX, bottomY);
    ctx.stroke();
    ctx.restore();

    // 4. Linia bramkowa na wlocie (Goal Line)
    ctx.save();
    ctx.strokeStyle = isCyan ? '#00F0FF' : '#FF8800';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(mouthX, topY);
    ctx.lineTo(mouthX, bottomY);
    ctx.stroke();
    ctx.restore();

    // 5. Etykieta drużyny nad bramką
    ctx.save();
    ctx.fillStyle = mainCol;
    ctx.shadowBlur = 0;
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'center';
    const tagText = isCyan ? '◄ CYAN GOAL' : 'ORANGE GOAL ►';
    ctx.fillText(tagText, (leftX + rightX) / 2, topY - 8);
    ctx.restore();

    ctx.restore();
  }
}

function drawAltarSpotlightAndLevitation(ctx, groundY) {
  const centerX = ARENA_WIDTH / 2; // 1800
  const altarX = arena1State.altarX || centerX;
  const topY = arena1State.altarY || 760;
  const pedestalY = topY;
  const hoverY = (topY - 10) + Math.sin(performance.now() * 0.003) * 4;
  const gantryY = 0;
  const time = performance.now() * 0.001;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.shadowBlur = 0; // Strictly 0 for 60 FPS

  const beamTopW = 60;
  const beamBottomW = 260;

  // Pionowy snop światła (spotlight) - oś musi pokrywać się dokładnie ze środkiem platformy (altarX)
  const beamGrad = ctx.createLinearGradient(altarX, gantryY, altarX, topY);
  beamGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.65)');
  beamGrad.addColorStop(0.12, 'rgba(186, 230, 253, 0.40)');
  beamGrad.addColorStop(0.50, 'rgba(56, 189, 248, 0.22)');
  beamGrad.addColorStop(0.85, 'rgba(0, 240, 255, 0.12)');
  beamGrad.addColorStop(1.0, 'rgba(0, 240, 255, 0.01)');

  ctx.fillStyle = beamGrad;
  ctx.beginPath();
  ctx.moveTo(altarX - beamTopW / 2, gantryY);
  ctx.lineTo(altarX + beamTopW / 2, gantryY);
  ctx.lineTo(altarX + beamBottomW / 2, topY + 4);
  ctx.lineTo(altarX - beamBottomW / 2, topY + 4);
  ctx.closePath();
  ctx.fill();

  const coreGrad = ctx.createLinearGradient(altarX, gantryY, altarX, topY);
  coreGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.85)');
  coreGrad.addColorStop(0.35, 'rgba(224, 242, 254, 0.38)');
  coreGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.moveTo(altarX - 16, gantryY);
  ctx.lineTo(altarX + 16, gantryY);
  ctx.lineTo(altarX + 70, topY);
  ctx.lineTo(altarX - 70, topY);
  ctx.closePath();
  ctx.fill();

  // Plama świetlna na cokole (pedestal light pool)
  const poolGrad = ctx.createRadialGradient(altarX, pedestalY, 10, altarX, pedestalY, 130);
  poolGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.60)');
  poolGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.35)');
  poolGrad.addColorStop(0.80, 'rgba(0, 240, 255, 0.10)');
  poolGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = poolGrad;
  ctx.beginPath();
  ctx.ellipse(altarX, pedestalY, 130, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#00F0FF';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(altarX, gantryY + 12, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  if (arena1State.waitingForKickoff) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 3.5);

    ctx.save();
    ctx.shadowBlur = 0;
    const bubbleGrad = ctx.createRadialGradient(altarX, hoverY, 4, altarX, hoverY, 32 + pulse * 6);
    bubbleGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.65)');
    bubbleGrad.addColorStop(0.4, 'rgba(0, 240, 255, 0.35)');
    bubbleGrad.addColorStop(0.8, 'rgba(0, 240, 255, 0.10)');
    bubbleGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bubbleGrad;
    ctx.beginPath();
    ctx.arc(altarX, hoverY, 32 + pulse * 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(0, 240, 255, ${0.75 + pulse * 0.25})`;
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.ellipse(altarX, hoverY, 28 + pulse * 3, 9, time * 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(altarX, hoverY, 28 + pulse * 3, 9, -time * 2.2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 0;
    ctx.fillText('⚡ KICKOFF READY ⚡', altarX, hoverY - 26);
    ctx.restore();
  }

  for (let i = altarShockwaves.length - 1; i >= 0; i--) {
    const sw = altarShockwaves[i];
    sw.radius += 3.5;
    sw.alpha -= 0.035;

    ctx.save();
    ctx.strokeStyle = sw.color;
    ctx.shadowColor = sw.color;
    ctx.shadowBlur = 0;
    ctx.globalAlpha = Math.max(0, sw.alpha);
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
      altarShockwaves.splice(i, 1);
    }
  }
}

export function drawObstacles(ctx, groundY) {
  for (const bar of GROUND_BARRICADES) {
    if (!bar) continue;
    const bType = normalizeObstacleType(bar.type);
    if (bType === 'sandbags') drawSandbags(ctx, bar.x, groundY - bar.h, bar.w, bar.h);
    else if (bType === 'ammo_depot') drawCrate(ctx, bar.x, groundY - bar.h, bar.w, bar.h);
    else if (bType === 'hedgehog') drawHedgehog(ctx, bar.x, groundY - bar.size / 2, bar.size);
  }

  for (const plat of ARENA_PLATFORMS) {
    if (!plat || plat.isCrossbar || plat.isWall || plat.isCanyonTerrain || plat.isHanging || plat.id === 'lower_cavern_floor' || plat.type === 'rock_shelf') continue;
    const curArenaObj = typeof getActiveArena === 'function' ? getActiveArena() : null;
    const isA3 = (curArenaObj?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3');
    if (isA3) {
      // W Arenie 3 cała autorska architektura i platformy rysowane są w drawArena3Foreground
      continue;
    }
    if (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA') {
      // W Arenie 2 (Święta Dżungla) cała autorska architektura, świątynia i mosty rysowane są w drawArena2Foreground
      continue;
    }
    if (plat.type === 'catwalk') {
      if (plat.theme === 'wood' || plat.isLadder || plat.isJungleHut || plat.isHutRoof || plat.isTowerDeck || plat.isRavineDeck || plat.isRavineRoof || plat.isSkywalk || plat.isTunnelFloor || plat.isUpperDrift || plat.isDrainageTunnel) {
        drawJungleWoodStructure(ctx, plat, groundY);
      } else {
        drawCatwalk(ctx, plat, groundY);
      }
    } else {
      drawRockIsland(ctx, plat, groundY);
    }
  }

  // Główna pętla renderowania postawionych obiektów (spójna w trybie gry i trybie edycji)
  // UWAGA: Nie filtrujemy obiektów z flagami isPickup ani isInteractable!
  const renderedSet = new Set();
  const allObstacles = [...customObstacles, ...obstacles];
  for (const obs of allObstacles) {
    if (!obs || renderedSet.has(obs)) continue;
    if (obs.team || obs.holeCx !== undefined || obs.id?.startsWith('goal') || obs.type === 'goal') continue;
    renderedSet.add(obs);

    const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
    const norm = normalizeObstacleType(obs.type);
    const w = (obs.w && obs.w > 0) ? obs.w : (norm === 'ammo_depot' ? 32 : (norm === 'sandbags' ? 48 : 40));
    const h = (obs.h && obs.h > 0) ? obs.h : (norm === 'ammo_depot' ? 24 : (norm === 'sandbags' ? 24 : 20));

    drawSingleObstacleByType(ctx, obs.type, obs.x, topY, w, h, groundY, obs.hitTimer || 0);
  }

  drawBarrelExplosionParticles(ctx);

  if (activeArenaId !== 'ARENA_3' && activeArenaId !== 'ARENA_FOUNDRY' && activeArenaId !== 'ARENA_2' && activeArenaId !== 'ARENA_2_PANDORA') {
    drawNeonGoals(ctx, groundY, GOALS);
  }

  if (activeArenaId === 'ARENA_1') {
    drawAltarSpotlightAndLevitation(ctx, groundY);
  }
}

export function resetObstacles() {
  obstacles.length = 0;
  customObstacles.length = 0;
}
export function resetBirds() { }
export function updateProceduralObstacles() { }
export function updateProceduralBirds() { }
export function drawBirds() { }

// =========================================================================
// INTERSEKCJE TRAJEKTORII POCISKÓW Z PRZESZKODAMI I TERENEM
// =========================================================================

export function getSegmentAABBIntersection(x1, y1, x2, y2, left, top, right, bottom) {
  let t0 = 0.0;
  let t1 = 1.0;
  const dx = x2 - x1;
  const dy = y2 - y1;

  const p = [-dx, dx, -dy, dy];
  const q = [x1 - left, right - x1, y1 - top, bottom - y1];
  const normals = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
  ];

  let hitNorm = [0, -1];

  for (let k = 0; k < 4; k++) {
    if (p[k] === 0) {
      if (q[k] < 0) return null;
    } else {
      const t = q[k] / p[k];
      if (p[k] < 0) {
        if (t > t1) return null;
        if (t > t0) {
          t0 = t;
          hitNorm = normals[k];
        }
      } else {
        if (t < t0) return null;
        if (t < t1) {
          t1 = t;
        }
      }
    }
  }

  if (t0 <= t1) {
    const startInside = (x1 >= left && x1 <= right && y1 >= top && y1 <= bottom);
    const hitT = startInside ? 0 : t0;
    return {
      hit: true,
      t: hitT,
      x: x1 + dx * hitT,
      y: y1 + dy * hitT,
      nx: hitNorm[0],
      ny: hitNorm[1]
    };
  }

  return null;
}

export function getSegmentCircleIntersection(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;

  if (c <= 0) {
    const d = Math.hypot(fx, fy) || 1;
    return {
      hit: true,
      t: 0,
      x: x1,
      y: y1,
      nx: fx / d,
      ny: fy / d
    };
  }

  if (a === 0) return null;

  const discriminant = b * b - 4 * a * c;
  if (discriminant >= 0) {
    const sqrtDisc = Math.sqrt(discriminant);
    const t0 = (-b - sqrtDisc) / (2 * a);
    if (t0 >= 0 && t0 <= 1) {
      const hx = x1 + dx * t0;
      const hy = y1 + dy * t0;
      const d = Math.hypot(hx - cx, hy - cy) || 1;
      return {
        hit: true,
        t: t0,
        x: hx,
        y: hy,
        nx: (hx - cx) / d,
        ny: (hy - cy) / d
      };
    }
  }
  return null;
}

export function getSegmentSegmentIntersection(x1, y1, x2, y2, sx1, sy1, sx2, sy2) {
  const d1x = x2 - x1;
  const d1y = y2 - y1;
  const d2x = sx2 - sx1;
  const d2y = sy2 - sy1;

  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 0.0001) return null;

  const u = ((sx1 - x1) * d2y - (sy1 - y1) * d2x) / denom;
  const v = ((sx1 - x1) * d1y - (sy1 - y1) * d1x) / denom;

  if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
    const len = Math.hypot(d2x, d2y) || 1;
    let nx = -d2y / len;
    let ny = d2x / len;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    return {
      hit: true,
      t: u,
      x: x1 + d1x * u,
      y: y1 + d1y * u,
      nx,
      ny
    };
  }
  return null;
}

export function checkRayObstacleCollision(x1, y1, x2, y2, groundY, extraObstacles = null, bulletObj = null) {
  let closestHit = null;

  function recordHit(candidate, sourceName = 'unknown') {
    if (!candidate || !candidate.hit) return;
    if (!closestHit || candidate.t < closestHit.t) {
      closestHit = candidate;
      closestHit.source = sourceName;
    }
  }

  const curArenaObj = getActiveArena?.();
  const isA3 = (curArenaObj?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY');

  if (!isA3 && y2 >= groundY) {
    if (y1 < groundY) {
      const dy = y2 - y1;
      const t = dy !== 0 ? Math.max(0, Math.min(1, (groundY - y1) / dy)) : 0;
      recordHit({
        hit: true,
        t,
        x: x1 + (x2 - x1) * t,
        y: groundY,
        nx: 0,
        ny: -1
      }, 'ground');
    } else {
      recordHit({
        hit: true,
        t: 0,
        x: x1,
        y: groundY,
        nx: 0,
        ny: -1
      }, 'ground');
    }
  }

  // W Arenie 3 sprawdzamy dolną granicę koryta rzeki / próżni wąwozu (y >= 1395)
  if (isA3) {
    if (y2 >= 1395) {
      if (y1 < 1395) {
        const dy = y2 - y1;
        const t = dy !== 0 ? Math.max(0, Math.min(1, (1395 - y1) / dy)) : 0;
        recordHit({ hit: true, t, x: x1 + (x2 - x1) * t, y: 1395, nx: 0, ny: -1 }, 'void_bottom');
      } else {
        recordHit({ hit: true, t: 0, x: x1, y: 1395, nx: 0, ny: -1 }, 'void_bottom');
      }
    }
  }

  if (Array.isArray(GROUND_BARRICADES)) {
    for (const bar of GROUND_BARRICADES) {
      const bType = normalizeObstacleType(bar.type);
      if (bType === 'sandbags' || bType === 'ammo_depot') {
        const left = bar.x;
        const right = bar.x + bar.w;
        const top = groundY - bar.h;
        const bottom = groundY;
        const hit = getSegmentAABBIntersection(x1, y1, x2, y2, left, top, right, bottom);
        recordHit(hit, bType);
      } else if (bar.type === 'hedgehog') {
        const cx = bar.x;
        const r = (bar.size || 30) / 2;
        const cy = groundY - r;
        const hit = getSegmentCircleIntersection(x1, y1, x2, y2, cx, cy, r);
        recordHit(hit, 'hedgehog');
      }
    }
  }

  if (Array.isArray(ARENA_PLATFORMS)) {
    for (const plat of ARENA_PLATFORMS) {
      if (!plat) continue;

      // W Arenie 3 zniszczalne segmenty (most, kładki w koronach, rampy, płyty snajperskie, podesty wież)
      // są w całości i precyzyjnie obsługiwane przez activeArena.onBulletHit() wraz z fizyką i cząstkami!
      if (isA3 && (plat.isBridgeBlock || plat.isRampBlock || plat.isCanopyBlock || plat.isSniperSlab || plat.isTowerBlock)) {
        continue;
      }

      // 1. Rampa lub profil skośny
      if (plat.isSlope || plat.type === 'ramp') {
        const topY1 = plat.startY !== undefined ? plat.startY : (plat.startRelY !== undefined ? groundY - plat.startRelY : plat.y);
        const topY2 = plat.endY !== undefined ? plat.endY : (plat.endRelY !== undefined ? groundY - plat.endRelY : plat.y);
        const slopeHit = getSegmentSegmentIntersection(x1, y1, x2, y2, plat.x, topY1, plat.x + plat.w, topY2);
        if (slopeHit) recordHit(slopeHit, plat.id || 'ramp');

        if (plat.solid) {
          const bottomY = Math.max(topY1, topY2) + (plat.h || 20);
          const bottomHit = getSegmentSegmentIntersection(x1, y1, x2, y2, plat.x, bottomY, plat.x + plat.w, bottomY);
          if (bottomHit) recordHit(bottomHit, plat.id || 'ramp_bottom');
          const leftHit = getSegmentSegmentIntersection(x1, y1, x2, y2, plat.x, topY1, plat.x, bottomY);
          if (leftHit) recordHit(leftHit, plat.id || 'ramp_left');
          const rightHit = getSegmentSegmentIntersection(x1, y1, x2, y2, plat.x + plat.w, topY2, plat.x + plat.w, bottomY);
          if (rightHit) recordHit(rightHit, plat.id || 'ramp_right');
        }
        continue;
      }

      // 2. Skaliste wyspy i profile wielokątne z surfacePoints
      if (plat.type === 'rock_platform' || plat.type === 'citadel_island' || plat.type === 'altar_island' || Array.isArray(plat.surfacePoints)) {
        if (Array.isArray(plat.surfacePoints) && plat.surfacePoints.length >= 2) {
          const pts = plat.surfacePoints;
          for (let i = 0; i < pts.length - 1; i++) {
            const p1y = pts[i].y !== undefined ? pts[i].y : (groundY - pts[i].relY);
            const p2y = pts[i + 1].y !== undefined ? pts[i + 1].y : (groundY - pts[i + 1].relY);
            const hit = getSegmentSegmentIntersection(x1, y1, x2, y2, pts[i].x, p1y, pts[i + 1].x, p2y);
            if (hit) recordHit(hit, plat.id || 'rock_surface');
          }
          // Ściany boczne i spód sprawdzamy tylko dla wysp latających (Pandora), NIE dla zboczy rzecznych ani ramp w Arenie 3!
          const isTerrainSlope = (plat.id === 'riverbank_left_oval' || plat.id === 'riverbank_right_oval' || plat.isRampBlock || plat.id === 'ground_left' || plat.id === 'ground_right');
          if (!isTerrainSlope && !isA3) {
            const p0y = pts[0].y !== undefined ? pts[0].y : (groundY - pts[0].relY);
            const plastY = pts[pts.length - 1].y !== undefined ? pts[pts.length - 1].y : (groundY - pts[pts.length - 1].relY);
            const leftHit = getSegmentSegmentIntersection(x1, y1, x2, y2, pts[0].x, p0y, pts[0].x, groundY);
            if (leftHit) recordHit(leftHit, plat.id || 'rock_left');
            const rightHit = getSegmentSegmentIntersection(x1, y1, x2, y2, pts[pts.length - 1].x, plastY, pts[pts.length - 1].x, groundY);
            if (rightHit) recordHit(rightHit, plat.id || 'rock_right');
            const bottomHit = getSegmentSegmentIntersection(x1, y1, x2, y2, pts[0].x, groundY, pts[pts.length - 1].x, groundY);
            if (bottomHit) recordHit(bottomHit, plat.id || 'rock_bottom');
          }
        } else {
          const topY = plat.y !== undefined ? plat.y : (groundY - plat.relY);
          const thick = plat.thickness || plat.h || 20;
          const rockHit = getSegmentAABBIntersection(x1, y1, x2, y2, plat.x, topY, plat.x + plat.w, topY + thick);
          recordHit(rockHit, plat.id || 'rock_slab');
        }

        if (Array.isArray(plat.props)) {
          for (const prop of plat.props) {
            if (prop.w && prop.h) {
              const topY = getPlatformSurfaceY(plat, plat.x + prop.rx, groundY);
              const bx = plat.x + prop.rx;
              const by = topY - prop.h;
              const propHit = getSegmentAABBIntersection(x1, y1, x2, y2, bx, by, bx + prop.w, topY);
              recordHit(propHit, prop.type || 'prop');
            }
          }
        }
        continue;
      }

      // 3. Kładki catwalk
      if (plat.type === 'catwalk') {
        if (!plat.isTowerDeck && !plat.isSkywalk && !plat.isLadder && !plat.isRavineDeck && !plat.isRavineRoof && !plat.isTunnelFloor) {
          const topY = plat.y !== undefined ? plat.y : (groundY - plat.relY);
          const thick = plat.thickness || plat.h || 14;
          const catHit = getSegmentAABBIntersection(x1, y1, x2, y2, plat.x, topY, plat.x + plat.w, topY + thick);
          recordHit(catHit, plat.id || 'catwalk');
        }
        continue;
      }

      // 4. Lite platformy przemysłowe areny (np. floor_l1, floor_l2, floor_r1, floor_r2, furnace_deck, tunnel_floor)
      if (plat.solid && !plat.oneWay) {
        const topY = plat.y !== undefined ? plat.y : (plat.relY !== undefined ? groundY - plat.relY : null);
        const thick = plat.h || plat.thickness || 20;
        if (topY !== null) {
          const solidHit = getSegmentAABBIntersection(x1, y1, x2, y2, plat.x, topY, plat.x + plat.w, topY + thick);
          if (solidHit) recordHit(solidHit, plat.id || 'solid_platform');
        }
      }
    }
  }

  const obsList = extraObstacles || obstacles;
  if (Array.isArray(obsList)) {
    for (const obs of obsList) {
      const oType = normalizeObstacleType(obs.type);
      if (oType === 'sandbags' || oType === 'ammo_depot') {
        const left = obs.x;
        const right = obs.x + obs.w;
        const top = groundY - obs.h;
        const bottom = groundY;
        const hit = getSegmentAABBIntersection(x1, y1, x2, y2, left, top, right, bottom);
        recordHit(hit);
      } else if (obs.type === 'hedgehog') {
        const cx = obs.x;
        const r = (obs.size || 30) / 2;
        const cy = groundY - r;
        const hit = getSegmentCircleIntersection(x1, y1, x2, y2, cx, cy, r);
        recordHit(hit);
      }
    }
  }

  if (Array.isArray(customObstacles)) {
    for (const obs of customObstacles) {
      if (!obs || obs.team || obs.holeCx !== undefined || obs.id?.startsWith('goal') || obs.type === 'goal') {
        continue;
      }
      const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
      const bottomY = topY + obs.h;

      if (obs.type === 'hedgehog') {
        const cx = obs.x + obs.w / 2;
        const cy = topY + obs.h / 2;
        const r = (obs.size || 32) / 2;
        const hit = getSegmentCircleIntersection(x1, y1, x2, y2, cx, cy, r);
        recordHit(hit, 'custom_hedgehog');
      } else if (obs.type === 'cyber_bumper') {
        const cx = obs.x + obs.w / 2;
        const cy = topY + obs.h / 2;
        const r = 20;
        const hit = getSegmentCircleIntersection(x1, y1, x2, y2, cx, cy, r);
        if (hit) {
          obs.hitTimer = 10;
          recordHit(hit, 'custom_cyber_bumper');
        }
      } else if (obs.type === 'metal_ramp_left') {
        const rampHit = getSegmentSegmentIntersection(x1, y1, x2, y2, obs.x, topY, obs.x + obs.w, topY + obs.h);
        if (rampHit) recordHit(rampHit, 'custom_metal_ramp_left');
        const backHit = getSegmentSegmentIntersection(x1, y1, x2, y2, obs.x, topY, obs.x, topY + obs.h);
        if (backHit) recordHit(backHit, 'custom_metal_ramp_left');
        const botHit = getSegmentSegmentIntersection(x1, y1, x2, y2, obs.x, topY + obs.h, obs.x + obs.w, topY + obs.h);
        if (botHit) recordHit(botHit, 'custom_metal_ramp_left');
      } else if (obs.type === 'metal_ramp_right') {
        const rampHit = getSegmentSegmentIntersection(x1, y1, x2, y2, obs.x, topY + obs.h, obs.x + obs.w, topY);
        if (rampHit) recordHit(rampHit, 'custom_metal_ramp_right');
        const backHit = getSegmentSegmentIntersection(x1, y1, x2, y2, obs.x + obs.w, topY, obs.x + obs.w, topY + obs.h);
        if (backHit) recordHit(backHit, 'custom_metal_ramp_right');
        const botHit = getSegmentSegmentIntersection(x1, y1, x2, y2, obs.x, topY + obs.h, obs.x + obs.w, topY + obs.h);
        if (botHit) recordHit(botHit, 'custom_metal_ramp_right');
      } else if (obs.type === 'explosive_barrel') {
        const hit = getSegmentAABBIntersection(x1, y1, x2, y2, obs.x, topY, obs.x + obs.w, bottomY);
        if (hit) {
          recordHit(hit, 'custom_explosive_barrel');
          explodeBarrel(obs, groundY);
        }
      } else if (obs.type === 'laser_gate') {
        const hit = getSegmentAABBIntersection(x1, y1, x2, y2, obs.x, topY, obs.x + obs.w, bottomY);
        if (hit) {
          let ricocheted = false;
          const b = bulletObj;
          if (b && (!b.laserBounces || b.laserBounces < 3)) {
            b.laserBounces = (b.laserBounces || 0) + 1;
            b.vx = -b.vx * 0.92;
            b.x = hit.x + (b.vx > 0 ? 3 : -3);
            b.prevX = b.x;
            spawnObstacleSparks(hit.x, hit.y, b.vx > 0 ? 1 : -1, 0, 5);
            triggerScreenShake(2.5);
            ricocheted = true;
          }
          if (!ricocheted) {
            recordHit(hit, 'custom_laser_gate');
          }
        }
      } else if (obs.type === 'barbed_wire' || obs.type === 'gravity_lift' || obs.type === 'speed_booster_pad') {
        continue;
      } else {
        const hit = getSegmentAABBIntersection(x1, y1, x2, y2, obs.x, topY, obs.x + obs.w, bottomY);
        recordHit(hit, 'custom_' + obs.type);
      }
    }
  }

  return closestHit;
}
