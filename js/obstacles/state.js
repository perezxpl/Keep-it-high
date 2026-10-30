// =========================================================================
// OBSTACLES.JS - WIELOPOZIOMOWE WYSPY ARENY I OBSŁUGA KOLIZJI PLATFORM
// =========================================================================

import { CONFIG, ARENA_LEFT, ARENA_RIGHT, START_X, ARENA_WIDTH } from '../config.js';
import {
  triggerScreenShake, triggerGoalCelebration, spawnJetpackSparks,
  resolveSegmentCollision, distToSegment, triggerHitstop,
  spawnBodyGibs, spawnBloodSpurt, spawnDroppedWeapon, spawnGroundPuff,
  registerWorldObstacles, setActiveArenaId, GROUND_Y, world,
  isGroundAt, resetGroundSegments, resetColliders, JUNGLE_CANYON_PROFILE,
  LEFT_MASSIF_AND_RAMP_PROFILE, CENTRAL_HILL_PROFILE, RIGHT_MASSIF_PROFILE,
  getCaveCeilingY, getCaveCeilingInfo, drawCaveTerrain,
  LOWER_CAVERN_FLOOR, LOWER_CAVERN_SHELVES, getLowerCavernCeilingY
} from '../world.js';
import { clearExplosionParticles } from '../particles.js';

var _arenaResetCallbacks = [];
export function registerArenaResetCallback(cb) {
  if (!_arenaResetCallbacks) _arenaResetCallbacks = [];
  if (typeof cb === 'function' && !_arenaResetCallbacks.includes(cb)) {
    _arenaResetCallbacks.push(cb);
  }
}
import { getActiveArena, setActiveArena, ARENAS, onArenaChange } from '../arenas/index.js';
import arena1, { ARENA_1_PLATFORMS, ARENA_1_BARRICADES, ARENA_1_GOALS, arena1State, goalTriggerLeft, goalTriggerRight, centerX } from '../arenas/arena1.js';
import arena2, {
  ARENA_2_PLATFORMS, ARENA_2_CONFIG,
  ARENA_2_PANDORA_PLATFORMS, ARENA_2_PANDORA_GOALS, applyPandoraUpdraft, checkPandoraUpdraft,
  ARENA_CYBER_STADIUM_PLATFORMS, ARENA_CYBER_STADIUM_BARRICADES, ARENA_CYBER_STADIUM_GOALS,
  ARENA_2_BRIDGES, resetArena2Bridges,
  ARENA_2_COVERS, ARENA_2_BARRELS, ARENA_2_SUPPLY,
  ACID_SURGE_SYSTEM
} from '../arenas/arena2.js';
import arena3, {
  ARENA_3_PLATFORMS, ARENA_3_CUSTOM_OBJECTS,
  GROUND_LEFT_POINTS, GROUND_RIGHT_POINTS, LEFT_OVAL_POINTS, RIGHT_OVAL_POINTS
} from '../arenas/arena3.js';
import { initDeathmatch, resetDeathmatchState, deathmatchState, deathmatchConfig, isDeathmatchFFA } from '../deathmatch/index.js';
import { balanceBotClasses } from '../bot.js';

export {
  ARENA_1_PLATFORMS, ARENA_1_BARRICADES, ARENA_1_GOALS, arena1State, goalTriggerLeft, goalTriggerRight, centerX,
  ARENA_2_PLATFORMS, ARENA_2_CONFIG,
  ARENA_2_PANDORA_PLATFORMS, ARENA_2_PANDORA_GOALS, applyPandoraUpdraft, checkPandoraUpdraft,
  ARENA_CYBER_STADIUM_PLATFORMS, ARENA_CYBER_STADIUM_BARRICADES, ARENA_CYBER_STADIUM_GOALS,
  ARENA_2_BRIDGES, resetArena2Bridges,
  ARENA_2_COVERS, ARENA_2_BARRELS, ARENA_2_SUPPLY,
  ACID_SURGE_SYSTEM,
  ARENA_3_PLATFORMS, ARENA_3_CUSTOM_OBJECTS,
  getActiveArena, setActiveArena, ARENAS, onArenaChange
};

export const obstacles = [];
export const customObstacles = [];
export let _activePlayer = null;
export let _activeBall = null;
export let _activeBot = null;
export function setActiveBot(b) { _activeBot = b; }
export function setActiveEntities(ball, p, botObj) {
  _activeBall = ball;
  _activePlayer = p;
  if (botObj) _activeBot = botObj;
}

var _onSpawnHitSparks = null;
export function registerHitSparkCallback(fn) { _onSpawnHitSparks = fn; }
export function spawnObstacleSparks(x, y, nx = 0, ny = -1, count = 4) {
  if (typeof _onSpawnHitSparks === 'function') {
    _onSpawnHitSparks(x, y, nx, ny, count);
  }
}

import { normalizeObstacleType, isBottomAnchored } from './palette.js';
import { spawnAltarShockwave } from './renderer.js';

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
      if (!plat || plat.solid === false || plat.isWall) continue;
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
export let activeArenaId = (_initArena && (_initArena.id === 'arena-5' || _initArena.id === 'ARENA_5'))
  ? 'ARENA_5'
  : ((_initArena && (_initArena.id === 'arena-4' || _initArena.id === 'ARENA_4'))
    ? 'ARENA_4'
    : ((_initArena && _initArena.id === 'arena-3')
      ? 'ARENA_3'
      : ((_initArena && _initArena.id === 'arena-2') ? 'ARENA_2' : 'ARENA_1')));
setActiveArenaId(activeArenaId);
export const ARENA_PLATFORMS = [...(_initArena?.platforms || ARENA_1_PLATFORMS)];
if (typeof window !== 'undefined') {
  window.ARENA_PLATFORMS = ARENA_PLATFORMS;
}
export const GROUND_BARRICADES = (activeArenaId === 'ARENA_5' || activeArenaId === 'ARENA_4' || activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_2') ? [] : [...ARENA_1_BARRICADES];
export const GOALS = [...((_initArena && (_initArena.id === 'arena-5' || _initArena.id === 'arena-4')) ? [] : ((_initArena && (_initArena.id === 'arena-3')) ? ARENA_FOUNDRY_GOALS : ((_initArena && _initArena.id === 'arena-2') ? ARENA_CYBER_STADIUM_GOALS : ARENA_1_GOALS)))];
if (_initArena && Array.isArray(_initArena.customObjects)) {
  customObstacles.push(..._initArena.customObjects);
}
export const arenaScore = { cyan: 0, orange: 0 };
export let goalCelebrationTimer = 0;

// Subskrypcja zmian areny dla natychmiastowej synchronizacji platform i obiektów
onArenaChange((newArena) => {
  if (newArena && (newArena.id === 'arena-5' || newArena.id === 'ARENA_5')) {
    activeArenaId = 'ARENA_5';
  } else if (newArena && (newArena.id === 'arena-4' || newArena.id === 'ARENA_4')) {
    activeArenaId = 'ARENA_4';
  } else if (newArena && (newArena.id === 'arena-3' || newArena.id === 'ARENA_3')) {
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
  GROUND_BARRICADES.length = 0;
  if (activeArenaId === 'ARENA_3') {
    const a3Goals = (newArena && newArena.customObjects) ? newArena.customObjects.filter(o => o.team) : ARENA_FOUNDRY_GOALS;
    GOALS.push(...(a3Goals.length > 0 ? a3Goals : ARENA_FOUNDRY_GOALS));
  } else if (activeArenaId === 'ARENA_2') {
    const a2Goals = (newArena && newArena.customObjects) ? newArena.customObjects.filter(o => o.team) : ARENA_CYBER_STADIUM_GOALS;
    GOALS.push(...(a2Goals.length > 0 ? a2Goals : ARENA_CYBER_STADIUM_GOALS));
  } else if (activeArenaId === 'ARENA_4' || activeArenaId === 'ARENA_5') {
    // W Arenie 4 i Arenie 5 brak bramek i barykad piłkarskich - czysty tryb taktyczny
  } else {
    GROUND_BARRICADES.push(...ARENA_1_BARRICADES);
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
  arena2Platforms: JSON.parse(JSON.stringify(ARENA_2_PLATFORMS)),
  arena3Platforms: JSON.parse(JSON.stringify(ARENA_FOUNDRY_PLATFORMS)),
  customObstacles: []
};

export function saveArenaSnapshot() {
  arenaSnapshot = {
    arena1Platforms: JSON.parse(JSON.stringify(ARENA_1_PLATFORMS)),
    arena2Platforms: JSON.parse(JSON.stringify(ARENA_2_PLATFORMS)),
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
  if (activeArenaId === 'ARENA_5' || activeArenaId === 'arena-5' || activeArenaId === 'PREFAB_TOWER') {
    const curArena = getActiveArena();
    ARENA_PLATFORMS.length = 0;
    if (typeof curArena?.reset === 'function') {
      curArena.reset();
    }
    if (curArena && Array.isArray(curArena.platforms)) {
      ARENA_PLATFORMS.push(...curArena.platforms);
    }
    customObstacles.length = 0;
    obstacles.length = 0;
    GROUND_BARRICADES.length = 0;
    GOALS.length = 0;
  } else if (activeArenaId === 'ARENA_4' || activeArenaId === 'arena-4' || activeArenaId === 'ARMORED_TRAIN') {
    const curArena = getActiveArena();
    if (typeof curArena?.reset === 'function') {
      curArena.reset();
    }
    if (curArena && Array.isArray(curArena.platforms)) {
      ARENA_PLATFORMS.push(...curArena.platforms);
    }
    customObstacles.length = 0;
    obstacles.length = 0;
    GROUND_BARRICADES.length = 0;
    GOALS.length = 0;
  } else if (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY') {
    if (typeof arena3 !== 'undefined' && typeof arena3.reset === 'function') {
      arena3.reset();
    }
    ARENA_PLATFORMS.push(...ARENA_3_PLATFORMS);
  } else if (activeArenaId === 'ARENA_2') {
    ARENA_PLATFORMS.push(...JSON.parse(JSON.stringify(arenaSnapshot.arena2Platforms)));
    if (typeof resetArena2Bridges === 'function') resetArena2Bridges();
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
    const botsList = (typeof window !== 'undefined' && typeof window.getActiveBots === 'function')
      ? window.getActiveBots()
      : (_activeBot ? [_activeBot] : []);

    botsList.forEach((b, idx) => {
      const isCyan = (b.team === 'CYAN');
      const baseX = isCyan
        ? 240 + ((Math.floor(idx / 2) + 1) * 60)
        : 3360 - ((Math.floor(idx / 2) + 1) * 60);
      b.x = baseX;
      b.y = 580;
      b.vx = 0;
      b.vy = 0;
      b.facing = isCyan ? 1 : -1;
      b.gaitMode = 'IDLE';
    });
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
  if (currentArena.id === 'arena-5' || currentArena.id === 'ARENA_5') {
    activeArenaId = 'ARENA_5';
  } else if (currentArena.id === 'arena-4' || currentArena.id === 'ARENA_4') {
    activeArenaId = 'ARENA_4';
  } else if (currentArena.id === 'arena-3') {
    activeArenaId = 'ARENA_3';
  } else if (currentArena.id === 'arena-2') {
    activeArenaId = 'ARENA_2';
  } else {
    activeArenaId = 'ARENA_1';
  }
  setActiveArenaId(activeArenaId);
  const gravMult = (typeof currentArena?.gravityMultiplier === 'number') ? currentArena.gravityMultiplier : 1.0;
  CONFIG.GRAVITY = 0.38 * gravMult;
  if (playerObj) {
    playerObj.isHolstered = (activeArenaId === 'ARENA_1');
    playerObj.holsterWeight = (activeArenaId === 'ARENA_1' ? 1.0 : 0.0);
  }

  // Całkowity reset i czyszczenie koliderów fizyki, aby nie zostały niewidzialne przeszkody
  if (typeof resetColliders === 'function') {
    resetColliders();
  }
  ARENA_PLATFORMS.length = 0;
  GROUND_BARRICADES.length = 0;
  GOALS.length = 0;
  customObstacles.length = 0;

  if (currentArena && Array.isArray(currentArena.platforms)) {
    if (activeArenaId === 'ARENA_5') {
      ARENA_PLATFORMS.push(...currentArena.platforms);
    } else {
      const rawPlats = (activeArenaId === 'ARENA_2' && arenaSnapshot?.arena2Platforms)
        ? arenaSnapshot.arena2Platforms
        : currentArena.platforms;
      const clonedPlats = JSON.parse(JSON.stringify(rawPlats));
      ARENA_PLATFORMS.push(...clonedPlats);
    }
    if (activeArenaId === 'ARENA_3') {
      arenaSnapshot.arena3Platforms = JSON.parse(JSON.stringify(currentArena.platforms));
      const gL = ARENA_PLATFORMS.find(p => p && p.id === 'ground_left');
      if (gL) gL.surfacePoints = GROUND_LEFT_POINTS;
      const gR = ARENA_PLATFORMS.find(p => p && p.id === 'ground_right');
      if (gR) gR.surfacePoints = GROUND_RIGHT_POINTS;
      const rL = ARENA_PLATFORMS.find(p => p && p.id === 'riverbank_left_oval');
      if (rL) rL.surfacePoints = LEFT_OVAL_POINTS;
      const rR = ARENA_PLATFORMS.find(p => p && p.id === 'riverbank_right_oval');
      if (rR) rR.surfacePoints = RIGHT_OVAL_POINTS;
    }
  }

  if (currentArena && Array.isArray(currentArena.customObjects)) {
    customObstacles.push(...currentArena.customObjects);
  }

  if (typeof currentArena?.reset === 'function') {
    currentArena.reset();
  }

  const groundY = (typeof GROUND_Y === 'number' && GROUND_Y > 0) ? GROUND_Y : 1000;
  const targetBot = botObj || _activeBot;
  const getBotsList = () => {
    if (Array.isArray(botObj)) return botObj;
    if (typeof window !== 'undefined' && typeof window.getActiveBots === 'function') {
      const wBots = window.getActiveBots();
      if (Array.isArray(wBots)) return wBots;
    }
    if (botObj) {
      if (botObj.active === false) return [];
      return [botObj];
    }
    return (targetBot && targetBot.active !== false) ? [targetBot] : [];
  };
  const activeBots = getBotsList();

  if (activeArenaId === 'ARENA_5') {
    resetDeathmatchState();
    GOALS.length = 0;
    GROUND_BARRICADES.length = 0;
    customObstacles.length = 0;
    obstacles.length = 0;
    arena1State.waitingForKickoff = false;
    arenaScore.cyan = 0;
    arenaScore.orange = 0;

    if (typeof currentArena?.reset === 'function') {
      currentArena.reset();
    }
    ARENA_PLATFORMS.length = 0;
    if (currentArena && Array.isArray(currentArena.platforms)) {
      ARENA_PLATFORMS.push(...currentArena.platforms);
    }

    if (typeof window !== 'undefined' && window.camera) {
      window.camera.x = 0;
      window.camera.targetX = 0;
      const cW = (typeof window.innerWidth === 'number') ? window.innerWidth : 1920;
      const cH = (typeof window.innerHeight === 'number') ? window.innerHeight : 1080;
      const a5Z = cW / 1600;
      window.camera.zoom = a5Z;
      window.camera.targetZoom = a5Z;
      window.camera.minZoom = a5Z;
      const vH = cH / a5Z;
      window.camera.viewWidth = 1600;
      window.camera.viewHeight = vH;
      window.camera.y = 1200 - vH;
      window.camera.targetY = 1200 - vH;
    }

    const spawns = currentArena?.spawns || [];
    const floorY = (currentArena && typeof currentArena.mainDeckY === 'number') ? currentArena.mainDeckY : 1200;

    if (playerObj) {
      const isClient = (playerObj.team === 'ORANGE' || (typeof window !== 'undefined' && window.networkState && window.networkState.isConnected && !window.networkState.isHost));
      const s0 = spawns[isClient ? 2 : 0] || { x: 400, y: floorY - 90 };
      playerObj.x = s0.x;
      playerObj.y = s0.y;
      playerObj.vx = 0;
      playerObj.vy = 0;
      playerObj.facing = isClient ? -1 : 1;
      playerObj.isIntro = false;
      playerObj.isJumping = false;
      playerObj.isSliding = false;
      playerObj.isDead = false;
      playerObj.hp = playerObj.maxHp || 100;
      playerObj.respawnTimer = 0;
      playerObj.ragdoll = null;
      playerObj.gaitMode = 'IDLE';
      playerObj.onGround = true;
      playerObj.currentGroundY = floorY;
    }
    const rPlayer = (typeof window !== 'undefined' && window.remotePlayer && window.remotePlayer.active) ? window.remotePlayer : null;

    initDeathmatch(playerObj, activeBots, rPlayer);

    activeBots.forEach((b, idx) => {
      b.active = true;
      b.isHolstered = false;
      b.holsterWeight = 0;
      const s = spawns[(idx + 1) % spawns.length] || { x: 800, y: floorY - 90 };
      b.x = s.x + (idx * 30);
      b.y = s.y;
      b.vx = 0;
      b.vy = 0;
      b.facing = (idx % 2 === 0) ? -1 : 1;
      b.isJumping = false;
      b.isSliding = false;
      b.isDead = false;
      b.hp = b.maxHp || 100;
      b.respawnTimer = 0;
      b.ragdoll = null;
      b.gaitMode = 'IDLE';
      b.onGround = true;
      b.currentGroundY = floorY;
    });
    balanceBotClasses(playerObj, activeBots, 'FFA');

    if (ballObj) {
      ballObj.active = false;
      ballObj.isLevitating = false;
      ballObj.x = -9999;
      ballObj.y = -9999;
    }
  } else if (activeArenaId === 'ARENA_4') {
    resetDeathmatchState();
    GOALS.length = 0;
    arena1State.waitingForKickoff = false;
    arenaScore.cyan = 0;
    arenaScore.orange = 0;

    if (typeof currentArena?.reset === 'function') {
      currentArena.reset();
    }
    ARENA_PLATFORMS.length = 0;
    if (currentArena && Array.isArray(currentArena.platforms)) {
      ARENA_PLATFORMS.push(...currentArena.platforms);
    }

    const isA4 = (currentArena?.id === 'arena-4' || currentArena?.alias === 'ARES_ORBITAL_STATION');
    const deckY = (currentArena && typeof currentArena.mainDeckY === 'number') ? currentArena.mainDeckY : 820;
    if (playerObj) {
      const isClient = (playerObj.team === 'ORANGE' || (typeof window !== 'undefined' && window.networkState && window.networkState.isConnected && !window.networkState.isHost));
      const spawnIdx = isA4 ? (isClient ? 2 : 1) : (isClient ? 2 : 0);
      playerObj.x = (currentArena.spawns && currentArena.spawns[spawnIdx]) ? currentArena.spawns[spawnIdx].x : (isClient ? 1250 : 750);
      playerObj.y = (currentArena.spawns && currentArena.spawns[spawnIdx]) ? currentArena.spawns[spawnIdx].y : (deckY - 50);
      playerObj.vx = 0;
      playerObj.vy = 0;
      playerObj.facing = isClient ? -1 : 1;
      playerObj.isIntro = false;
      playerObj.isJumping = false;
      playerObj.isSliding = false;
      playerObj.isDead = false;
      playerObj.hp = playerObj.maxHp || 100;
      playerObj.respawnTimer = 0;
      playerObj.ragdoll = null;
      playerObj.gaitMode = 'IDLE';
      playerObj.onGround = true;
      playerObj.currentGroundY = deckY;
    }
    const rPlayer = (typeof window !== 'undefined' && window.remotePlayer && window.remotePlayer.active) ? window.remotePlayer : null;

    initDeathmatch(playerObj, activeBots, rPlayer);

    activeBots.forEach((b, idx) => {
      b.active = true;
      b.isHolstered = false;
      b.holsterWeight = 0;
      const isCyan = (b.team === 'CYAN');
      let baseSpawnX, baseSpawnY;
      if (isA4 && Array.isArray(currentArena.spawns) && currentArena.spawns.length >= 4) {
        const spawnObj = isCyan
          ? (idx % 2 === 0 ? currentArena.spawns[0] : currentArena.spawns[1])
          : (idx % 2 === 0 ? currentArena.spawns[3] : currentArena.spawns[2]);
        baseSpawnX = spawnObj.x;
        baseSpawnY = spawnObj.y;
      } else {
        baseSpawnX = isCyan
          ? ((currentArena.spawns && currentArena.spawns[0]) ? currentArena.spawns[0].x : 500) + ((Math.floor(idx / 2) + 1) * 70)
          : ((currentArena.spawns && currentArena.spawns[3]) ? currentArena.spawns[3].x : 1650) - ((Math.floor(idx / 2) + 1) * 70);
        baseSpawnY = (currentArena.spawns && currentArena.spawns[isCyan ? 0 : 3]) ? currentArena.spawns[isCyan ? 0 : 3].y : (deckY - 50);
      }
      b.x = baseSpawnX;
      b.y = baseSpawnY;
      b.vx = 0;
      b.vy = 0;
      b.facing = isCyan ? 1 : -1;
      b.isJumping = false;
      b.isSliding = false;
      b.isDead = false;
      b.hp = b.maxHp || 100;
      b.respawnTimer = 0;
      b.ragdoll = null;
      b.gaitMode = 'IDLE';
      b.onGround = true;
      b.currentGroundY = deckY;
    });
    balanceBotClasses(playerObj, activeBots, 'TDM');
    if (ballObj) {
      ballObj.active = false;
      ballObj.isLevitating = false;
      ballObj.x = -9999;
      ballObj.y = -9999;
    }
  } else if (activeArenaId === 'ARENA_3') {
    resetDeathmatchState();
    GROUND_BARRICADES.push(...ARENA_FOUNDRY_BARRICADES);
    GOALS.length = 0; // W militarnej dżungli brak piłki i bramek - czysty tryb taktyczny / Deathmatch
    arena1State.waitingForKickoff = false;
    arenaScore.cyan = 0;
    arenaScore.orange = 0;

    if (typeof currentArena?.reset === 'function') {
      currentArena.reset();
    }
    ARENA_PLATFORMS.length = 0;
    if (currentArena && Array.isArray(currentArena.platforms)) {
      ARENA_PLATFORMS.push(...currentArena.platforms);
    }

    if (playerObj) {
      const isClient = (playerObj.team === 'ORANGE' || (typeof window !== 'undefined' && window.networkState && window.networkState.isConnected && !window.networkState.isHost));
      const spawnIdx = isClient ? 1 : 0;
      playerObj.x = (currentArena.spawns && currentArena.spawns[spawnIdx]) ? currentArena.spawns[spawnIdx].x : (isClient ? 3800 : 600);
      playerObj.y = (currentArena.spawns && currentArena.spawns[spawnIdx]) ? currentArena.spawns[spawnIdx].y : (isClient ? 880 : 1130);
      playerObj.vx = 0;
      playerObj.vy = 0;
      playerObj.facing = isClient ? -1 : 1;
      playerObj.isIntro = false;
      playerObj.isJumping = false;
      playerObj.isSliding = false;
      playerObj.isDead = false;
      playerObj.hp = playerObj.maxHp || 100;
      playerObj.respawnTimer = 0;
      playerObj.ragdoll = null;
      playerObj.gaitMode = 'IDLE';
    }
    const rPlayer = (typeof window !== 'undefined' && window.remotePlayer && window.remotePlayer.active) ? window.remotePlayer : null;

    // Inicjalizacja sesji Deathmatch (przypisanie drużyn i zbalansowanie klas) przed ustawieniem współrzędnych
    initDeathmatch(playerObj, activeBots, rPlayer);

    activeBots.forEach((b, idx) => {
      b.active = true;
      b.isHolstered = false;
      b.holsterWeight = 0;
      const isCyan = (b.team === 'CYAN');
      const baseSpawnX = isCyan
        ? ((currentArena.spawns && currentArena.spawns[0]) ? currentArena.spawns[0].x : 600) + ((Math.floor(idx / 2) + 1) * 60)
        : ((currentArena.spawns && currentArena.spawns[1]) ? currentArena.spawns[1].x : 3350) - ((Math.floor(idx / 2) + 1) * 60);
      const baseSpawnY = (currentArena.spawns && currentArena.spawns[isCyan ? 0 : 1]) ? currentArena.spawns[isCyan ? 0 : 1].y : 1130;
      b.x = baseSpawnX;
      b.y = baseSpawnY;
      b.vx = 0;
      b.vy = 0;
      b.facing = isCyan ? 1 : -1;
      b.isJumping = false;
      b.isSliding = false;
      b.isDead = false;
      b.hp = b.maxHp || 100;
      b.respawnTimer = 0;
      b.ragdoll = null;
      b.gaitMode = 'IDLE';
    });
    if (ballObj) {
      ballObj.active = false;
    }
  } else if (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X') {
    GOALS.length = 0; // W Sektorze X brak bramek i piłki - 5-minutowy Deathmatch
    arena1State.waitingForKickoff = false;
    arenaScore.cyan = 0;
    arenaScore.orange = 0;

    const rPlayer = (typeof window !== 'undefined' && window.remotePlayer && window.remotePlayer.active) ? window.remotePlayer : null;

    if (playerObj) {
      const isClient = (playerObj.team === 'ORANGE' || (typeof window !== 'undefined' && window.networkState && window.networkState.isConnected && !window.networkState.isHost));
      const spawnIdx = isClient ? 1 : 0;
      playerObj.x = (currentArena.spawns && currentArena.spawns[spawnIdx]) ? currentArena.spawns[spawnIdx].x : (isClient ? 3470 : 520);
      playerObj.y = (currentArena.spawns && currentArena.spawns[spawnIdx]) ? currentArena.spawns[spawnIdx].y : 390;
      playerObj.vx = 0;
      playerObj.vy = 0;
      playerObj.facing = isClient ? -1 : 1;
      playerObj.isIntro = false;
      playerObj.isJumping = false;
      playerObj.isSliding = false;
      playerObj.isDead = false;
      playerObj.hp = playerObj.maxHp || 100;
      playerObj.respawnTimer = 0;
      playerObj.ragdoll = null;
      playerObj.gaitMode = 'IDLE';
    }

    // Inicjalizacja 5-minutowego Deathmatch na Arenie 2 przed kalkulacją spawnów (żeby sojusznicy i wrogowie mieli prawidłowe pozycje)
    initDeathmatch(playerObj, activeBots, rPlayer);

    activeBots.forEach((b, idx) => {
      b.active = true;
      b.isHolstered = false;
      b.holsterWeight = 0;
      const isFFA = (typeof isDeathmatchFFA === 'function' ? isDeathmatchFFA() : false) ||
        (deathmatchState && deathmatchState.mode === 'FFA') ||
        (deathmatchConfig && deathmatchConfig.mode === 'FFA');
      const isCyan = (b.team === 'CYAN');
      let s;
      if (isFFA && currentArena.spawns && currentArena.spawns.length > 2) {
        const spawnIdx = ((idx + 1) % (currentArena.spawns.length - 1)) + 1;
        s = currentArena.spawns[spawnIdx] || currentArena.spawns[1];
        b.x = s.x;
        b.y = s.y;
        b.facing = s.facing || (b.x < 2000 ? 1 : -1);
      } else {
        s = isCyan
          ? ((currentArena.spawns && currentArena.spawns[0]) || { x: 520, y: 390, facing: 1 })
          : ((currentArena.spawns && currentArena.spawns[1]) || { x: 3080, y: 390, facing: -1 });
        b.x = s.x + (isCyan ? ((Math.floor(idx / 2) + 1) * 60) : -((Math.floor(idx / 2) + 1) * 60));
        b.y = s.y;
        b.facing = s.facing || (isCyan ? 1 : -1);
      }
      b.vx = 0;
      b.vy = 0;
      b.isJumping = false;
      b.isSliding = false;
      b.isDead = false;
      b.hp = b.maxHp || 100;
      b.respawnTimer = 0;
      b.ragdoll = null;
      b.gaitMode = 'IDLE';
    });
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

    // Inicjalizacja 5-minutowego Deathmatch na Arenie 2
    initDeathmatch(playerObj, activeBots, rPlayer);
  } else {
    resetDeathmatchState();
    GROUND_BARRICADES.push(...ARENA_1_BARRICADES);
    GOALS.push(...ARENA_1_GOALS);

    arena1State.waitingForKickoff = true;
    arena1State.kickoffCooldown = 0;

    const _cX = ARENA_WIDTH / 2; // 1800
    const _altarX = arena1State.altarX || _cX;
    const _altarY = arena1State.altarY || 570;
    const _spawnBallY = _altarY;

    const rPlayer = (typeof window !== 'undefined' && window.remotePlayer && window.remotePlayer.active) ? window.remotePlayer : null;

    if (playerObj) {
      playerObj.x = (currentArena.spawns && currentArena.spawns[0]) ? currentArena.spawns[0].x : 220;
      playerObj.y = (currentArena.spawns && currentArena.spawns[0]) ? currentArena.spawns[0].y : 420;
      playerObj.vx = 0;
      playerObj.vy = 0;
      playerObj.facing = 1;
      playerObj.isIntro = false;
      playerObj.juggleTimer = 0;
      playerObj.isJumping = false;
      playerObj.isSliding = false;
      playerObj.isDead = false;
      playerObj.hp = playerObj.maxHp || 100;
      playerObj.respawnTimer = 0;
      playerObj.ragdoll = null;
      playerObj.gaitMode = 'IDLE';
    }
    activeBots.forEach((b, idx) => {
      b.active = true;
      b.isHolstered = true;
      b.holsterWeight = 1.0;
      if (rPlayer) {
        b.team = (idx % 2 === 0) ? 'CYAN' : 'ORANGE';
      } else {
        b.team = 'ORANGE';
      }
      const isCyan = (b.team === 'CYAN');
      const baseX = isCyan
        ? ((currentArena.spawns && currentArena.spawns[0]) ? currentArena.spawns[0].x : 220) + ((Math.floor(idx / 2) + 1) * 60)
        : ((currentArena.spawns && currentArena.spawns[1]) ? currentArena.spawns[1].x : 3380) - ((Math.floor(idx / 2) + 1) * 60);
      const baseY = (currentArena.spawns && currentArena.spawns[isCyan ? 0 : 1]) ? currentArena.spawns[isCyan ? 0 : 1].y : 420;
      b.x = baseX;
      b.y = baseY;
      b.vx = 0;
      b.vy = 0;
      b.facing = isCyan ? 1 : -1;
      b.isJumping = false;
      b.isSliding = false;
      b.isDead = false;
      b.hp = b.maxHp || 100;
      b.respawnTimer = 0;
      b.ragdoll = null;
      b.gaitMode = 'IDLE';
    });
    balanceBotClasses(playerObj, activeBots, 'TDM');
    if (ballObj) {
      ballObj.active = true;
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
  const pw = (plat.w !== undefined ? plat.w : (plat.width || 100));
  const thick = (plat.h !== undefined ? plat.h : (plat.height !== undefined ? plat.height : (plat.thickness || 20)));
  const angle = plat.angle || 0;

  // Sprawdź pamięć podręczną granic platformy (unika 20k+ alokacji obiektów i trygonometrii na sekundę)
  const b = plat._cachedBounds;
  if (b && plat._cbX === plat.x && plat._cbY === plat.y && plat._cbW === pw && plat._cbH === thick && plat._cbA === angle) {
    return b;
  }

  let minX, maxX, minY, maxY, cx, cy;
  if (Math.abs(angle) > 0.01) {
    cx = plat.x + pw / 2;
    cy = plat.y + thick / 2;
    const cosA = Math.abs(Math.cos(angle));
    const sinA = Math.abs(Math.sin(angle));
    const hw = pw / 2;
    const hh = thick / 2;
    const halfBoxW = hw * cosA + hh * sinA;
    const halfBoxH = hw * sinA + hh * cosA;
    minX = cx - halfBoxW;
    maxX = cx + halfBoxW;
    minY = cy - halfBoxH;
    maxY = cy + halfBoxH;
  } else {
    const topY = (plat.y !== undefined) ? plat.y : 0;
    minX = plat.x;
    maxX = plat.x + pw;
    minY = topY;
    maxY = topY + thick;
    cx = plat.x + pw / 2;
    cy = topY + thick / 2;
  }

  plat._cbX = plat.x;
  plat._cbY = plat.y;
  plat._cbW = pw;
  plat._cbH = thick;
  plat._cbA = angle;
  plat._cachedBounds = { minX, maxX, minY, maxY, cx, cy };
  return plat._cachedBounds;
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

export function drawBarrelExplosionParticles(ctx, viewLeft, viewRight) {
  if (!barrelExplosionParticles || barrelExplosionParticles.length === 0) return;
  const vL = (typeof viewLeft === 'number') ? viewLeft : -100;
  const vR = (typeof viewRight === 'number') ? viewRight : 5000;
  for (const p of barrelExplosionParticles) {
    if (p.x + p.size < vL || p.x - p.size > vR) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    if (p.type === 'fire') {
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

        triggerHitstop(2);
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



export function resetObstacles() {
  obstacles.length = 0;
  customObstacles.length = 0;
}
export function resetBirds() { }
export function updateProceduralObstacles() { }
export function updateProceduralBirds() { }
export function drawBirds() { }
