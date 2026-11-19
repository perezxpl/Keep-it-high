// =========================================================================
// ZOMBIE/LOGIC.JS - MECHANIKA, FIZYKA, AI I INFEKCJA W TRYBIE ZOMBIE
// Odpowiada za:
// - Reanimację poległych ciał (niepozbawionych głów)
// - Człapiące AI podążające za najbliższym żywym celem
// - Ugryzienia, zakażenia DoT i rozprzestrzenianie plagi
// - Wstawanie po zwykłym powaleniu i permanentną śmierć wyłącznie przez dekapitację
// =========================================================================

import { zombieState, ZOMBIE_CONFIG, isZombieModeActive, resetZombieState, createZombieInstance, registerCorpseForReanimation } from './state.js';
import { triggerScreenShake, spawnBloodSpurt, spawnBloodDrip, spawnBloodFountain, spawnHeadGib } from '../world.js';
import { ARENA_PLATFORMS, customObstacles, getPlatformSurfaceY, getPlatformBounds, getActiveArena } from '../obstacles.js';
import { triggerCombatFeedBanner } from '../ui/combatFeed.js';
import { getRiverbankGroundY } from '../arenas/arena3/state.js';
import { hazardsState } from '../hazards/state.js';
import { damageBarrel } from '../hazards/logic.js';
import { ARENA_RIGHT } from '../config.js';

let _activeZombiesCache = [];

/**
 * Zwraca zunifikowany kontekst aktywnej areny
 */
function getArenaContext() {
  const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
  const rawId = curArena?.id || (typeof window !== 'undefined' ? window.activeArenaId : 'arena-1');
  const arenaKey = String(rawId || 'arena-1').toLowerCase().replace(/_/g, '-');
  return {
    curArena,
    arenaId: rawId,
    arenaKey,
    isA5: (arenaKey === 'arena-5' || arenaKey === 'prefab-tower'),
    isA4: (arenaKey === 'arena-4' || arenaKey === 'armored-train'),
    isA3: (arenaKey === 'arena-3' || arenaKey === 'arena-foundry'),
    isA2: (arenaKey === 'arena-2' || arenaKey === 'arena-2-pandora' || arenaKey === 'arena-2-sector-x')
  };
}

/**
 * Sprawdza czy platforma powinna być zignorowana w kolizjach zombie
 */
function isPlatformIgnoredForZombie(plat, isA3) {
  if (!plat) return true;
  if (plat.destroyed || plat.isDestroyed || plat.solid === false) return true;
  if (plat.intact === false) return true;
  if (isA3 && (plat.id === 'ground_left' || plat.id === 'ground_right' || plat.id === 'riverbank_left_oval' || plat.id === 'riverbank_right_oval' || plat.id === 'world_boundary_left' || plat.id === 'world_boundary_right')) return true;
  return false;
}

/**
 * Sprawdza czy zombie znalazł się w zabójczym zagrożeniu środowiskowym
 */
function checkZombieEnvironmentalHazard(z) {
  const { arenaKey } = getArenaContext();
  const feetY = z.y + (z.h || 70);

  if (arenaKey === 'arena-2' || arenaKey === 'arena-2-pandora' || arenaKey === 'arena-2-sector-x') {
    const acidY = (typeof window !== 'undefined' && window.ACID_SURGE_SYSTEM) ? window.ACID_SURGE_SYSTEM.currentY : 1440;
    if (feetY >= acidY - 4) return true;
  } else if (arenaKey === 'arena-3' || arenaKey === 'arena-foundry') {
    if (feetY >= 1315) return true;
  } else if (arenaKey === 'arena-4' || arenaKey === 'armored-train') {
    if (feetY >= 1390) return true;
  } else if (arenaKey === 'arena-5' || arenaKey === 'prefab-tower') {
    const a5Floor = (typeof window !== 'undefined' && typeof window.arena5State?.currentFloorY === 'number') ? window.arena5State.currentFloorY : 1200;
    if (feetY >= a5Floor + 90) return true;
  }
  if (z.y > 2400) return true;
  return false;
}

/**
 * Pomocnicze sprawdzanie powierzchni na liście platform bez alokacji tablic
 */
function checkPlatformList(list, x, y, baseGroundY, isA3, currentFloor, isA5 = false) {
  if (!Array.isArray(list)) return currentFloor;
  let floor = currentFloor;
  for (let i = 0; i < list.length; i++) {
    const plat = list[i];
    if (isPlatformIgnoredForZombie(plat, isA3)) continue;
    if (plat.isWall || plat.isPlatform === false) continue;

    if (isA5 && plat.isA5Block) {
      if (plat.topExposed === false) continue;
      if (typeof plat.gridRow === 'number' && typeof plat.gridCol === 'number') {
        const a5St = (typeof window !== 'undefined' && window.arena5State) ? window.arena5State : null;
        const rowAbove = a5St?.gridRows?.get(plat.gridRow + 1);
        if (rowAbove && rowAbove[plat.gridCol] && rowAbove[plat.gridCol].hp > 0 && !rowAbove[plat.gridCol].isFalling) {
          continue;
        }
      }
    }

    const bnds = (typeof getPlatformBounds === 'function') ? getPlatformBounds(plat) : { minX: plat.x, maxX: plat.x + (plat.w !== undefined ? plat.w : 100) };

    // Ścisły margines poziomy: środek postaci 'x' musi leżeć w obrębie platformy (brak lewitacji w powietrzu)
    if (x >= bnds.minX - 2 && x <= bnds.maxX + 2) {
      let topY;
      if (plat.type === 'metal_ramp_left') {
        const t = Math.max(0, Math.min(1, (x - plat.x) / (plat.w || 1)));
        topY = (plat.y !== undefined ? plat.y : (baseGroundY - (plat.relY || 0))) + t * plat.h;
      } else if (plat.type === 'metal_ramp_right') {
        const t = Math.max(0, Math.min(1, (x - plat.x) / (plat.w || 1)));
        topY = (plat.y !== undefined ? plat.y : (baseGroundY - (plat.relY || 0))) + (1 - t) * plat.h;
      } else if (plat.surfacePoints && typeof getPlatformSurfaceY === 'function') {
        topY = getPlatformSurfaceY(plat, x, baseGroundY);
      } else if (plat.y !== undefined) {
        topY = (typeof getPlatformSurfaceY === 'function') ? getPlatformSurfaceY(plat, x, baseGroundY) : plat.y;
      } else {
        topY = baseGroundY - (plat.relY || 0);
      }

      if (plat.props && plat.props.length > 0) {
        const tier = plat.props.find(pr => (pr.type === 'altar_pedestal' || pr.type === 'sandbag_trench'));
        if (tier) {
          const tierLeft = plat.x + tier.rx;
          const tierRight = tierLeft + tier.w;
          if (x >= tierLeft - 2 && x <= tierRight + 2) {
            topY -= tier.h;
          }
        }
      }

      if (y <= topY + 18 && topY < floor) {
        floor = topY;
      }
    }
  }
  return floor;
}

/**
 * Oblicza wysokość podłoża lub platformy pod zombie (zoptymalizowane bez tworzenia tymczasowych tablic)
 */
export function getZombieSurfaceY(x, y, baseGroundY) {
  const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
  const rawId = curArena?.id || (typeof window !== 'undefined' ? window.activeArenaId : 'arena-1');
  const arenaKey = String(rawId || 'arena-1').toLowerCase().replace(/_/g, '-');
  const isA5 = (arenaKey === 'arena-5' || arenaKey === 'prefab-tower');
  const isA4 = (arenaKey === 'arena-4' || arenaKey === 'armored-train');
  const isA3 = (arenaKey === 'arena-3' || arenaKey === 'arena-foundry');
  const isA2 = (arenaKey === 'arena-2' || arenaKey === 'arena-2-pandora' || arenaKey === 'arena-2-sector-x');

  let floor = Infinity;

  // 1. Podłoże naturalne dla poszczególnych aren
  if (isA3 && typeof getRiverbankGroundY === 'function') {
    if (x <= 1750 || x >= 2650) {
      const riverbankY = getRiverbankGroundY(x);
      if (typeof riverbankY === 'number' && !isNaN(riverbankY)) {
        floor = riverbankY;
      }
    }
  } else if (!isA2 && !isA3 && !isA4 && !isA5) {
    const hasGround = (typeof window !== 'undefined' && typeof window.isGroundAt === 'function')
      ? (window.isGroundAt(x - 6, 2) || window.isGroundAt(x + 6, 2))
      : true;
    if (hasGround && baseGroundY < 1500) {
      floor = baseGroundY;
    }
  }

  // 2. Platformy areny (ARENA_PLATFORMS)
  floor = checkPlatformList(ARENA_PLATFORMS, x, y, baseGroundY, isA3, floor, isA5);

  // 3. Platformy i klocki wieży Tetrisa w Arenie 5
  const a5Plats = (typeof window !== 'undefined' && window.arena5State?.platforms) ? window.arena5State.platforms : null;
  if (a5Plats) {
    floor = checkPlatformList(a5Plats, x, y, baseGroundY, isA3, floor, true);
  }

  // 4. Obiekty customObstacles
  if (Array.isArray(customObstacles)) {
    floor = checkPlatformList(customObstacles, x, y, baseGroundY, isA3, floor, false);
  }

  // 5. Sprawdzanie powierzchni stojących fizycznych beczek
  const barrels = (hazardsState && Array.isArray(hazardsState.barrels)) ? hazardsState.barrels : (typeof window !== 'undefined' ? window.hazardsBarrels : null);
  if (Array.isArray(barrels)) {
    for (let i = 0; i < barrels.length; i++) {
      const b = barrels[i];
      if (!b || b.isDead) continue;
      if (x >= b.x - 2 && x <= b.x + b.w + 2) {
        const topY = b.y;
        if (y <= topY + 6 && topY < floor) {
          floor = topY;
        }
      }
    }
  }

  return floor;
}

/**
 * Sprawdza uderzenie głową w sufit / spód litej platformy podczas skoku w górę (vy < 0)
 */
export function checkZombieCeiling(z, groundY) {
  const headY = z.y;
  const centerX = z.x + (z.w || 24) * 0.5;
  const { isA3 } = getArenaContext();

  // 1. Sprawdzanie sufitów na platformach ARENA_PLATFORMS
  for (let i = 0; i < ARENA_PLATFORMS.length; i++) {
    const plat = ARENA_PLATFORMS[i];
    if (isPlatformIgnoredForZombie(plat, isA3)) continue;
    if (plat.isDropThrough || plat.dropThrough || plat.type === 'catwalk') continue;

    const bnds = (typeof getPlatformBounds === 'function') ? getPlatformBounds(plat) : { minX: plat.x, maxX: plat.x + (plat.w || 100) };
    if (centerX >= bnds.minX - 4 && centerX <= bnds.maxX + 4) {
      const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
      const bottomY = topY + (plat.thickness || plat.h || 24);
      if (headY <= bottomY && headY >= topY) {
        z.y = bottomY + 1;
        if (z.vy < 0) z.vy = 0.5;
        return true;
      }
    }
  }

  // 2. Sprawdzanie sufitów w customObstacles (bunkry, filary, ściany)
  if (Array.isArray(customObstacles)) {
    for (let i = 0; i < customObstacles.length; i++) {
      const obs = customObstacles[i];
      if (isPlatformIgnoredForZombie(obs, isA3)) continue;
      if (obs.type === 'bunker_block' || obs.type === 'cyber_pillar' || obs.type === 'tall_concrete_wall') {
        const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
        const bottomY = topY + obs.h;
        if (centerX >= obs.x && centerX <= obs.x + (obs.w || 40)) {
          if (headY <= bottomY && headY >= topY) {
            z.y = bottomY + 1;
            if (z.vy < 0) z.vy = 0.5;
            return true;
          }
        }
      }
    }
  }

  // 3. Sprawdzanie sufitów w klockach Areny 5
  const a5 = (typeof window !== 'undefined' && window.arena5State?.gridRows) ? window.arena5State : null;
  if (a5) {
    const gridOriginX = (a5.gridOriginX !== undefined) ? a5.gridOriginX : (a5.shaftLeft !== undefined ? a5.shaftLeft : 0);
    const cellSize = a5.cellSize || 100;
    const totalCols = a5.cols || 16;
    const col = Math.floor((centerX - gridOriginX) / cellSize);
    if (col >= 0 && col < totalCols) {
      const minR = a5.minFloorRow || 0;
      for (let r = minR; r < minR + 15; r++) {
        const row = a5.gridRows.get(r);
        const cell = row ? row[col] : null;
        if (cell && cell.hp > 0 && !cell.isFalling) {
          const bottomY = cell.y + (cell.h || cellSize);
          if (headY <= bottomY && headY >= cell.y) {
            z.y = bottomY + 1;
            if (z.vy < 0) z.vy = 0.5;
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Sprawdza czy bezpośrednio nad głową zombie znajduje się sufit (w odległości do 95px)
 */
export function checkZombieCeilingAbove(z, groundY) {
  const headY = z.y;
  const centerX = z.x + (z.w || 24) * 0.5;
  const { isA3 } = getArenaContext();

  for (let i = 0; i < ARENA_PLATFORMS.length; i++) {
    const plat = ARENA_PLATFORMS[i];
    if (isPlatformIgnoredForZombie(plat, isA3)) continue;
    if (plat.isDropThrough || plat.dropThrough || plat.type === 'catwalk') continue;
    const bnds = (typeof getPlatformBounds === 'function') ? getPlatformBounds(plat) : { minX: plat.x, maxX: plat.x + (plat.w || 100) };
    if (centerX >= bnds.minX - 4 && centerX <= bnds.maxX + 4) {
      const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
      const bottomY = topY + (plat.thickness || plat.h || 24);
      if (bottomY < headY && bottomY >= headY - 95) {
        return true;
      }
    }
  }

  const a5 = (typeof window !== 'undefined' && window.arena5State?.gridRows) ? window.arena5State : null;
  if (a5) {
    const gridOriginX = (a5.gridOriginX !== undefined) ? a5.gridOriginX : (a5.shaftLeft !== undefined ? a5.shaftLeft : 0);
    const cellSize = a5.cellSize || 100;
    const totalCols = a5.cols || 16;
    const col = Math.floor((centerX - gridOriginX) / cellSize);
    if (col >= 0 && col < totalCols) {
      const minR = a5.minFloorRow || 0;
      for (let r = minR; r < minR + 15; r++) {
        const row = a5.gridRows.get(r);
        const cell = row ? row[col] : null;
        if (cell && cell.hp > 0 && !cell.isFalling) {
          const bottomY = cell.y + (cell.h || cellSize);
          if (bottomY < headY && bottomY >= headY - 95) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Blokuje przenikanie zombie przez ściany pionowe, monolity i klocki wieży
 */
export function resolveZombieWallCollisions(z, groundY) {
  const feetY = z.y + (z.h || 70);
  const headY = z.y;
  const halfW = (z.w || 24) * 0.5;
  const { isA3 } = getArenaContext();

  // 1. Lite platformy, filary, monolity i ściany ARENA_PLATFORMS
  for (let i = 0; i < ARENA_PLATFORMS.length; i++) {
    const plat = ARENA_PLATFORMS[i];
    if (isPlatformIgnoredForZombie(plat, isA3)) continue;
    if (plat.isDropThrough || plat.dropThrough || plat.type === 'catwalk' || plat.isSlope) continue;

    const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
    const platThick = plat.thickness || plat.h || (plat.isMonolith ? 470 : 30);
    if (platThick < 16 && !plat.isWall && !plat.isMonolith) continue;

    const bottomY = topY + platThick;

    if (feetY > topY + 12 && headY < bottomY - 4) {
      const bnds = (typeof getPlatformBounds === 'function') ? getPlatformBounds(plat) : { minX: plat.x, maxX: plat.x + (plat.w || 100) };
      if (z.x + (z.w || 24) > bnds.minX && z.x < bnds.maxX) {
        const midX = (bnds.minX + bnds.maxX) * 0.5;
        if (z.x + halfW < midX) {
          z.x = bnds.minX - (z.w || 24);
          if (z.vx > 0) z.vx = 0;
          if (z.knockbackVx > 0) z.knockbackVx = 0;
        } else {
          z.x = bnds.maxX;
          if (z.vx < 0) z.vx = 0;
          if (z.knockbackVx < 0) z.knockbackVx = 0;
        }
      }
    }
  }

  // 2. Przeszkody lite customObstacles
  if (Array.isArray(customObstacles)) {
    for (let i = 0; i < customObstacles.length; i++) {
      const obs = customObstacles[i];
      if (isPlatformIgnoredForZombie(obs, isA3)) continue;
      if (obs.type === 'hedgehog' || obs.type === 'barbed_wire' || obs.type === 'laser_gate') continue;

      const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
      const bottomY = topY + (obs.h || 40);
      if (feetY > topY + 12 && headY < bottomY - 4) {
        if (z.x + (z.w || 24) > obs.x && z.x < obs.x + obs.w) {
          const midX = obs.x + obs.w * 0.5;
          if (z.x + halfW < midX) {
            z.x = obs.x - (z.w || 24);
            if (z.vx > 0) z.vx = 0;
            if (z.knockbackVx > 0) z.knockbackVx = 0;
          } else {
            z.x = obs.x + obs.w;
            if (z.vx < 0) z.vx = 0;
            if (z.knockbackVx < 0) z.knockbackVx = 0;
          }
        }
      }
    }
  }

  // 3. Klocki wieży Areny 5
  const a5 = (typeof window !== 'undefined' && window.arena5State?.gridRows) ? window.arena5State : null;
  if (a5) {
    const gridOriginX = (a5.gridOriginX !== undefined) ? a5.gridOriginX : (a5.shaftLeft !== undefined ? a5.shaftLeft : 0);
    const cellSize = a5.cellSize || 100;
    const totalCols = a5.cols || 16;
    const colLeft = Math.max(0, Math.floor((z.x - 20 - gridOriginX) / cellSize));
    const colRight = Math.min(totalCols - 1, Math.floor((z.x + (z.w || 24) + 20 - gridOriginX) / cellSize));
    const minR = a5.minFloorRow || 0;

    for (let c = colLeft; c <= colRight; c++) {
      for (let r = minR; r < minR + 15; r++) {
        const row = a5.gridRows.get(r);
        const cell = row ? row[c] : null;
        if (cell && cell.hp > 0 && !cell.isFalling) {
          const cellTop = cell.y;
          const cellBottom = cell.y + (cell.h || cellSize);
          const cellLeft = cell.x;
          const cellRight = cell.x + (cell.w || cellSize);

          if (z.x + (z.w || 24) > cellLeft && z.x < cellRight && feetY > cellTop + 14 && headY < cellBottom - 6) {
            const midX = cellLeft + (cell.w || cellSize) * 0.5;
            if (z.x + halfW < midX) {
              z.x = cellLeft - (z.w || 24);
              if (z.vx > 0) z.vx = 0;
              if (z.knockbackVx > 0) z.knockbackVx = 0;
            } else {
              z.x = cellRight;
              if (z.vx < 0) z.vx = 0;
              if (z.knockbackVx < 0) z.knockbackVx = 0;
            }
          }
        }
      }
    }
  }

  // 4. Fizyczne beczki: przepychanie i blokada przenikania
  const wallBarrels = (hazardsState && Array.isArray(hazardsState.barrels)) ? hazardsState.barrels : (typeof window !== 'undefined' ? window.hazardsBarrels : null);
  if (Array.isArray(wallBarrels)) {
    for (let i = 0; i < wallBarrels.length; i++) {
      const b = wallBarrels[i];
      if (!b || b.isDead) continue;
      if (feetY > b.y + 12 && headY < b.y + b.h - 4) {
        if (z.x + (z.w || 24) > b.x && z.x < b.x + b.w) {
          const midX = b.x + b.w * 0.5;
          if (z.vx !== 0) {
            const pushDir = Math.sign(z.vx);
            b.vx = pushDir * Math.max(Math.abs(z.vx), 1.6);
            b.rotVel = pushDir * 0.08;
            // Nadajemy b.vx bez bezposredniej modyfikacji b.x
            z.vx *= 0.6;
          }
          if (z.x + halfW < midX) {
            z.x = b.x - (z.w || 24);
            if (z.vx > 0) z.vx = 0;
            if (z.knockbackVx > 0) z.knockbackVx = 0;
          } else {
            z.x = b.x + b.w;
            if (z.vx < 0) z.vx = 0;
            if (z.knockbackVx < 0) z.knockbackVx = 0;
          }
        }
      }
    }
  }
}

/**
 * Pokonywanie stopni i przeszkod w ruchu poziomym (schodek do 16px = plynne wejscie, 16-110px = skok wspinaczkowy celowany)
 */
export function handleZombieStepAndClimb(z, groundY, nearestTarget = null) {
  if (!z.onGround) return false;

  const facing = z.facing || 1;
  const footX = facing > 0 ? (z.x + (z.w || 24)) : z.x;
  const feetY = z.y + (z.h || 70);
  const { isA3 } = getArenaContext();

  let bestStepTop = null;

  // Platformy z przodu
  for (let i = 0; i < ARENA_PLATFORMS.length; i++) {
    const plat = ARENA_PLATFORMS[i];
    if (isPlatformIgnoredForZombie(plat, isA3)) continue;
    if (plat.isWall || plat.isPlatform === false) continue;
    const bnds = (typeof getPlatformBounds === 'function') ? getPlatformBounds(plat) : { minX: plat.x, maxX: plat.x + (plat.w || 100) };
    if (footX >= bnds.minX - 2 && footX <= bnds.maxX + 2) {
      let topY;
      if (plat.type === 'metal_ramp_left') {
        const t = Math.max(0, Math.min(1, (footX - plat.x) / (plat.w || 1)));
        topY = (plat.y !== undefined ? plat.y : (groundY - (plat.relY || 0))) + t * plat.h;
      } else if (plat.type === 'metal_ramp_right') {
        const t = Math.max(0, Math.min(1, (footX - plat.x) / (plat.w || 1)));
        topY = (plat.y !== undefined ? plat.y : (groundY - (plat.relY || 0))) + (1 - t) * plat.h;
      } else if (typeof getPlatformSurfaceY === 'function') {
        topY = getPlatformSurfaceY(plat, footX, groundY);
      } else if (plat.y !== undefined) {
        topY = plat.y;
      } else {
        topY = groundY - (plat.relY || 0);
      }
      if (topY < feetY && topY >= feetY - 110) {
        if (bestStepTop === null || topY < bestStepTop) {
          bestStepTop = topY;
        }
      }
    }
  }

  // Przeszkody customObstacles z przodu
  if (Array.isArray(customObstacles)) {
    for (let i = 0; i < customObstacles.length; i++) {
      const obs = customObstacles[i];
      if (isPlatformIgnoredForZombie(obs, isA3)) continue;
      if (obs.isWall || obs.solid === false) continue;
      if (footX >= obs.x - 2 && footX <= obs.x + obs.w + 2) {
        const topY = (typeof getPlatformSurfaceY === 'function') ? getPlatformSurfaceY(obs, footX, groundY) : (obs.y !== undefined ? obs.y : (groundY - obs.relY));
        if (topY < feetY && topY >= feetY - 110) {
          if (bestStepTop === null || topY < bestStepTop) {
            bestStepTop = topY;
          }
        }
      }
    }
  }

  // Klocki Areny 5 z przodu
  const a5 = (typeof window !== 'undefined' && window.arena5State?.gridRows) ? window.arena5State : null;
  if (a5) {
    const gridOriginX = (a5.gridOriginX !== undefined) ? a5.gridOriginX : (a5.shaftLeft !== undefined ? a5.shaftLeft : 0);
    const cellSize = a5.cellSize || 100;
    const totalCols = a5.cols || 16;
    const col = Math.floor((footX - gridOriginX) / cellSize);
    if (col >= 0 && col < totalCols) {
      const minR = a5.minFloorRow || 0;
      for (let r = minR; r < minR + 15; r++) {
        const row = a5.gridRows.get(r);
        const cell = row ? row[col] : null;
        if (cell && cell.hp > 0 && !cell.isFalling) {
          const topY = cell.y;
          if (topY < feetY && topY >= feetY - 110) {
            if (bestStepTop === null || topY < bestStepTop) {
              bestStepTop = topY;
            }
          }
        }
      }
    }
  }

  // 4. Beczki z przodu jako stopien wspinaczkowy
  const stepBarrels = (hazardsState && Array.isArray(hazardsState.barrels)) ? hazardsState.barrels : (typeof window !== 'undefined' ? window.hazardsBarrels : null);
  if (Array.isArray(stepBarrels)) {
    for (let i = 0; i < stepBarrels.length; i++) {
      const b = stepBarrels[i];
      if (!b || b.isDead) continue;
      if (footX >= b.x - 2 && footX <= b.x + b.w + 2) {
        const topY = b.y;
        if (topY < feetY && topY >= feetY - 110) {
          if (bestStepTop === null || topY < bestStepTop) {
            bestStepTop = topY;
          }
        }
      }
    }
  }

  if (bestStepTop !== null) {
    const stepDiff = feetY - bestStepTop;
    if (stepDiff > 0 && stepDiff <= 16 && (facing * (z.vx || 0) > 0.02)) {
      // Niski stopien: plynne wejscie stopa bez podskakiwania
      z.y = bestStepTop - (z.h || 70);
      z.vy = 0;
      z.onGround = true;
      return true;
    } else if (!z.isCrawling && stepDiff > 16 && stepDiff <= 110 && z.jumpCooldown <= 0) {
      // Skok wspinaczkowy: TYLKO gdy cel jest wyzej niz zombie!
      const targetIsHigher = nearestTarget && ((nearestTarget.y + (nearestTarget.h || 70)) < feetY - 16);
      if (targetIsHigher) {
        const hasCeil = checkZombieCeilingAbove(z, groundY);
        if (!hasCeil) {
          z.vy = -8.2;
          z.vx = facing * (ZOMBIE_CONFIG.SPEED * 1.15);
          z.jumpCooldown = 2.0;
          z.onGround = false;
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Zwraca zbuforowaną tablicę wszystkich aktywnych celów zombie (zawsze aktualna w klatce)
 */
export function getActiveZombies() {
  if (!zombieState.enabled) return [];
  return _activeZombiesCache;
}

/**
 * Odświeża bufor aktywnych celów zombie
 */
export function refreshActiveZombiesCache() {
  if (!zombieState.enabled) {
    _activeZombiesCache.length = 0;
    return _activeZombiesCache;
  }
  _activeZombiesCache.length = 0;
  for (let i = 0; i < zombieState.zombies.length; i++) {
    const z = zombieState.zombies[i];
    if (z && (!z.isDead || (z.hasHead && !z.decapitated))) {
      z.team = 'ZOMBIE';
      z.isZombie = true;
      z.active = true;
      z.spawnProtectionTimer = 0;
      if (typeof z.isReaching !== 'boolean') z.isReaching = false;
      if (typeof z.reachBlend !== 'number') z.reachBlend = 0;
      if (typeof z.isCrawling !== 'boolean') z.isCrawling = false;
      if (typeof z.crawlPhase !== 'number') z.crawlPhase = 0;
      if (typeof z.legHp !== 'number') z.legHp = 40;
      if (!z.thighLen) z.thighLen = 25;
      if (!z.shinLen) z.shinLen = 24;
      if (!z.upperArmLen) z.upperArmLen = 14;
      if (!z.forearmLen) z.forearmLen = 13;
      if (!z.dismembered) {
        z.dismembered = { armFront: false, armBack: false, legFront: z.isCrawling, legBack: false };
      } else if (z.isCrawling) {
        z.dismembered.legFront = true;
      } else {
        z.dismembered.legFront = false;
        z.dismembered.legBack = false;
      }
      _activeZombiesCache.push(z);
    }
  }
  for (let i = 0; i < zombieState.corpses.length; i++) {
    const c = zombieState.corpses[i];
    if (c && c.hasHead && !c.decapitated) {
      c.team = 'ZOMBIE';
      c.isZombie = true;
      c.active = true;
      c.spawnProtectionTimer = 0;
      if (typeof c.isReaching !== 'boolean') c.isReaching = false;
      if (typeof c.reachBlend !== 'number') c.reachBlend = 0;
      if (typeof c.isCrawling !== 'boolean') c.isCrawling = false;
      if (typeof c.crawlPhase !== 'number') c.crawlPhase = 0;
      if (typeof c.legHp !== 'number') c.legHp = 40;
      if (!c.thighLen) c.thighLen = 25;
      if (!c.shinLen) c.shinLen = 24;
      if (!c.upperArmLen) c.upperArmLen = 14;
      if (!c.forearmLen) c.forearmLen = 13;
      if (!c.dismembered) {
        c.dismembered = { armFront: false, armBack: false, legFront: c.isCrawling, legBack: false };
      } else if (c.isCrawling) {
        c.dismembered.legFront = true;
      } else {
        c.dismembered.legFront = false;
        c.dismembered.legBack = false;
      }
      _activeZombiesCache.push(c);
    }
  }
  return _activeZombiesCache;
}

/**
 * Główna pętla aktualizacji systemu zombie
 */
export function updateZombieSystem(dt, player, bots = [], groundY = 800) {
  if (!isZombieModeActive()) {
    if (zombieState.zombies.length > 0 || zombieState.corpses.length > 0) {
      resetZombieState();
    }
    return;
  }

  // Twarde ograniczenie limitów kolekcji w pętli
  while (zombieState.corpses.length > ZOMBIE_CONFIG.MAX_CORPSES) {
    zombieState.corpses.shift();
  }
  while (zombieState.zombies.length > ZOMBIE_CONFIG.MAX_ZOMBIES) {
    zombieState.zombies.shift();
  }

  refreshActiveZombiesCache();

  // Klient w trybie multiplayer polega na autorytatywnych pakietach zombies_state od hosta
  if (typeof window !== 'undefined' && typeof window.isMatchClient === 'function' && window.isMatchClient()) {
    for (const z of zombieState.zombies) {
      if (z.attackAnim > 0) z.attackAnim -= dt;
      if (z.hitStunTimer > 0) z.hitStunTimer -= dt;
    }
    return;
  }

  const validBots = Array.isArray(bots) ? bots.filter(b => b && b.active) : [];
  const activeRemotes = (typeof window !== 'undefined' && typeof window.getActiveRemotePlayers === 'function')
    ? window.getActiveRemotePlayers()
    : ((typeof window !== 'undefined' && window.remotePlayer && window.remotePlayer.active) ? [window.remotePlayer] : []);
  const livingHumans = [player, ...validBots, ...activeRemotes].filter(c => c && !c.isDead && !c.isZombie);

  // -------------------------------------------------------------------------
  // 1. REANIMACJA LEŻĄCYCH CIAŁ (POWSTAWANIE ZOMBIE Z POLEGŁYCH)
  // -------------------------------------------------------------------------
  for (let i = zombieState.corpses.length - 1; i >= 0; i--) {
    const corpse = zombieState.corpses[i];

    // Ograniczenie czasu leżenia zwłok (maksymalnie 8 sekund)
    corpse.lifespan = (corpse.lifespan !== undefined ? corpse.lifespan : ZOMBIE_CONFIG.CORPSE_LIFESPAN || 8.0) - dt;
    if (corpse.lifespan <= 0) {
      zombieState.corpses.splice(i, 1);
      continue;
    }

    // Ciało z odciętą głową nie może powstać
    if (corpse.decapitated || !corpse.hasHead) {
      zombieState.corpses.splice(i, 1);
      continue;
    }

    // Weryfikacja czy podłoże pod leżącym ciałem nie zniknęło (np. zniszczenie klocka / platformy)
    const cX = corpse.centerX || (corpse.x + 12);
    const cFeetY = corpse.feetY || (corpse.y + 70);
    const curSurface = getZombieSurfaceY(cX, cFeetY, groundY);
    if (curSurface === Infinity || curSurface > 1400) {
      zombieState.corpses.splice(i, 1);
      continue;
    }

    // Płynne opadanie ciała z grawitacją jeśli podłoże się obniżyło
    if (cFeetY + 4 < curSurface) {
      corpse.vy = (corpse.vy || 0) + 0.45;
      if (corpse.vy > 12) corpse.vy = 12;
      if (cFeetY + corpse.vy >= curSurface) {
        corpse.feetY = curSurface;
        corpse.vy = 0;
      } else {
        corpse.feetY += corpse.vy;
      }
    } else {
      corpse.feetY = curSurface;
      corpse.vy = 0;
    }
    corpse.groundY = corpse.feetY;
    corpse.y = corpse.feetY - 70;
    corpse.h = 70;
    corpse.isCrouching = false;
    corpse.crouching = false;
    corpse.crouchTimer = 0;
    corpse.crouchBlend = 0;
    corpse.crouchFactor = 0;
    corpse.sliding = false;
    corpse.slideTimer = 0;
    corpse.rollTimer = 0;
    if (!corpse.keys) {
      corpse.keys = { left: false, right: false, up: false, down: false };
    } else {
      corpse.keys.down = false;
    }

    corpse.timer -= dt;

    // Drżenie ciała przed powstaniem (konwulsje reanimacji)
    if (corpse.timer <= 1.2) {
      corpse.twitch = Math.sin(Date.now() * 0.04) * 2.5;
      if (Math.random() < 0.2) {
        spawnBloodDrip(corpse.x + (Math.random() - 0.5) * 16, corpse.y + 40, (Math.random() - 0.5) * 1.5, -1.0, 2);
      }
    }

    if (corpse.timer <= 0) {
      // Narodziny nowego Zombie dokładnie na powierzchni spoczynku ciała (zero wstawania w powietrzu)
      const newZombie = createZombieInstance(cX, curSurface, corpse.facing, {
        originalName: corpse.originalName,
        charVisuals: corpse.charVisuals,
        customVisuals: corpse.customVisuals,
        charClass: corpse.charClass,
        charBody: corpse.charBody
      });
      newZombie.team = 'ZOMBIE';
      newZombie.isZombie = true;
      newZombie.active = true;
      newZombie.spawnProtectionTimer = 0;
      newZombie.w = 24;
      newZombie.h = 70;
      newZombie.y = curSurface - 70;
      newZombie.groundY = curSurface;
      newZombie.pelvisY = -11.8;
      newZombie.isCrouching = false;
      newZombie.crouching = false;
      newZombie.crouchTimer = 0;
      newZombie.crouchBlend = 0;
      newZombie.crouchFactor = 0;
      newZombie.crouchToggled = false;
      newZombie.crouchHoldTimer = 0;
      newZombie.sliding = false;
      newZombie.isSliding = false;
      newZombie.slideTimer = 0;
      newZombie.rollTimer = 0;
      newZombie.isProne = false;
      newZombie.staggerTimer = 0;
      newZombie.gaitMode = 'IDLE';
      newZombie.keys = { left: false, right: false, up: false, down: false };
      newZombie.thighLen = 25;
      newZombie.shinLen = 24;
      newZombie.upperArmLen = 14;
      newZombie.forearmLen = 13;
      newZombie.dismembered = {
        armFront: false,
        armBack: false,
        legFront: false,
        legBack: false
      };
      if (newZombie.pose) newZombie.pose.initialized = false;

      zombieState.zombies.push(newZombie);
      zombieState.stats.totalSpawned++;
      triggerCombatFeedBanner('DEATH', `[PLAGA] ${corpse.originalName} WSTAJE JAKO ZOMBIE!`);
      triggerScreenShake(2.0);

      zombieState.corpses.splice(i, 1);
    }
  }

  // -------------------------------------------------------------------------
  // 2. AKTUALIZACJA ZAKAŻENIA LUDZI (STATUS INFECTED & DoT)
  // -------------------------------------------------------------------------
  for (const c of livingHumans) {
    if (c.infected) {
      c.infectionTimer = (c.infectionTimer || 0) + dt;

      // Zadawanie ciągłych obrażeń od wirusa
      const dmg = dt * ZOMBIE_CONFIG.INFECTION_DPS;
      c.hp -= dmg;

      // Zakażone zielonkawo-brunatne krople krwi
      if (Math.random() < 0.3) {
        spawnBloodDrip(
          c.x + (c.w || 24) * 0.5 + (Math.random() - 0.5) * 12,
          c.y + 20 + Math.random() * 20,
          (Math.random() - 0.5) * 1.0,
          0.8 + Math.random() * 1.5,
          1
        );
      }

      // Śmierć w wyniku infekcji
      if (c.hp <= 0 && !c.isDead) {
        c.hp = 0;
        c.isDead = true;
        c.respawnTimer = 180;
        c.hasHead = true;      // Głowa zachowana!
        c.decapitated = false;
        c.severedHead = null;
        c.bleedTimer = 90;
        c.corpseAngle = 0;
        c.corpseRotVel = 0;
        c.torsoTiltVel = 0;
        const cX = c.x + (c.w || 24) * 0.5;
        const cY = c.y + (c.h || 70);
        const cSurfY = getZombieSurfaceY(cX, cY, groundY);
        c.corpseFloorY = (cSurfY !== Infinity && cSurfY < 1500) ? cSurfY : groundY;
        c.ragdoll = null;
        c.deathImpulse = {
          vx: (Math.random() - 0.5) * 1.8,
          vy: -1.2
        };

        triggerCombatFeedBanner('DEATH', `[ZAKAŻENIE] ${c.name || 'OPERATOR'} ULEGŁ WIRUSOWI!`);
        if (c === player) {
          triggerScreenShake(4.0);
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // 3. PĘTLA LOGIKI I AI ZOMBIE
  // -------------------------------------------------------------------------
  for (let i = zombieState.zombies.length - 1; i >= 0; i--) {
    const z = zombieState.zombies[i];

    // Zagrożenia środowiskowe areny (kwas, woda, lawa, utylizator) - niszczą zarówno żywe, jak i powalone zombie
    if (checkZombieEnvironmentalHazard(z)) {
      spawnBloodSpurt(z.x + z.w / 2, z.y + z.h - 10, 0, -2.5, 12, 1.0);
      zombieState.zombies.splice(i, 1);
      continue;
    }

    // --- STAN ZGONU / POWALENIA ZOMBIE ---
    if (z.isDead) {
      z.isReaching = false;
      z.reachBlend = 0;
      // Grawitacja i kolizja z podłożem dla powalonego/martwego ciała
      z.vy += 0.45;
      if (z.vy > 12) z.vy = 12;
      const feetX = z.x + z.w * 0.5;
      const feetY = z.y + z.h;
      const surfaceY = getZombieSurfaceY(feetX, feetY, groundY);
      if (surfaceY !== Infinity && feetY + z.vy >= surfaceY) {
        z.y = surfaceY - z.h;
        z.vy = 0;
        z.onGround = true;
      } else {
        z.y += z.vy;
        z.onGround = false;
      }
      z.vx *= 0.85;
      z.x += z.vx;
      resolveZombieWallCollisions(z, groundY);

      if (z.decapitated || !z.hasHead) {
        // Permanentna śmierć przez dekapitację: naturalny rozkład i zwolnienie slotu w tablicy
        z.decayTimer = (z.decayTimer || 0) + dt;
        if (z.decayTimer >= (ZOMBIE_CONFIG.DECAY_DURATION || 6.0)) {
          zombieState.zombies.splice(i, 1);
        }
        continue;
      }

      // Powalenie bez dekapitacji: zombie wstaje po upływie reviveTimer!
      z.reviveTimer -= dt;
      if (z.reviveTimer <= 0) {
        z.isDead = false;
        z.hp = z.maxHp;
        z.downedHp = z.maxDownedHp || 60;
        z.riseTimer = 1.3;
        z.attackCooldown = 0.8;
        z.jumpCooldown = 1.2;
        z.team = 'ZOMBIE';
        z.isZombie = true;
        z.active = true;
        z.spawnProtectionTimer = 0;
        if (z.isCrawling) {
          z.w = 34;
          z.h = 26;
          z.pelvisY = 0;
          z.gaitMode = 'CRAWL';
          if (!z.dismembered) {
            z.dismembered = { armFront: false, armBack: false, legFront: true, legBack: false };
          } else {
            z.dismembered.legFront = true;
          }
        } else {
          z.w = 24;
          z.h = 70;
          z.pelvisY = -11.8;
          z.gaitMode = 'IDLE';
          if (!z.dismembered) {
            z.dismembered = { armFront: false, armBack: false, legFront: false, legBack: false };
          } else {
            z.dismembered.legFront = false;
            z.dismembered.legBack = false;
          }
        }
        z.isCrouching = false;
        z.crouching = false;
        z.crouchTimer = 0;
        z.crouchBlend = 0;
        z.crouchFactor = 0;
        z.crouchToggled = false;
        z.crouchHoldTimer = 0;
        z.sliding = false;
        z.isSliding = false;
        z.slideTimer = 0;
        z.rollTimer = 0;
        z.isProne = false;
        z.staggerTimer = 0;
        if (!z.keys) {
          z.keys = { left: false, right: false, up: false, down: false };
        } else {
          z.keys.up = false;
          z.keys.down = false;
        }
        z.thighLen = 25;
        z.shinLen = 24;
        z.upperArmLen = 14;
        z.forearmLen = 13;
        if (z.pose) z.pose.initialized = false;
        const feetX = z.x + z.w * 0.5;
        const curSurf = getZombieSurfaceY(feetX, z.y + z.h, groundY);
        if (curSurf !== Infinity && curSurf < 1500) {
          z.y = curSurf - z.h;
          z.groundY = curSurf;
          z.vy = 0;
          z.onGround = true;
        }
        triggerScreenShake(1.5);
        spawnBloodSpurt(z.x + z.w / 2, z.y + z.h - 10, (Math.random() - 0.5) * 3, -2.0, 10, 1.0);
      }
      continue;
    }

    // --- WSTAWANIE Z ZIEMI ---
    if (z.riseTimer > 0) {
      z.isReaching = false;
      z.reachBlend = 0;
      z.riseTimer -= dt;
      z.vx = 0;
      z.knockbackVx = 0;
      // Stopy zakotwiczone ściśle na podłożu w trakcie sekwencji wstawania
      const feetX = z.x + z.w * 0.5;
      const curSurf = getZombieSurfaceY(feetX, z.y + z.h, groundY);
      if (curSurf !== Infinity && curSurf < 1500) {
        z.y = curSurf - z.h;
        z.groundY = curSurf;
        z.vy = 0;
        z.onGround = true;
      } else {
        z.vy += 0.45;
        z.y += z.vy;
      }
      resolveZombieWallCollisions(z, groundY);

      // Moment ukończenia sekwencji wstawania: korekta pozycji do podłoża i reset pozy
      if (z.riseTimer <= 0) {
        z.riseTimer = 0;
        if (z.isCrawling) {
          z.w = 34;
          z.h = 26;
          z.pelvisY = 0;
          z.gaitMode = 'CRAWL';
        } else {
          z.w = 24;
          z.h = 70;
          z.pelvisY = -11.8;
          z.gaitMode = 'IDLE';
        }
        z.isCrouching = false;
        z.crouching = false;
        z.crouchTimer = 0;
        z.crouchBlend = 0;
        z.crouchFactor = 0;
        z.crouchToggled = false;
        z.crouchHoldTimer = 0;
        z.sliding = false;
        z.isSliding = false;
        z.slideTimer = 0;
        z.rollTimer = 0;
        z.isProne = false;
        z.staggerTimer = 0;
        if (!z.keys) {
          z.keys = { left: false, right: false, up: false, down: false };
        } else {
          z.keys.up = false;
          z.keys.down = false;
        }
        const standSurf = getZombieSurfaceY(feetX, z.y + z.h, groundY);
        if (standSurf !== Infinity && standSurf < 1500) {
          z.y = standSurf - z.h;
          z.groundY = standSurf;
          z.vy = 0;
          z.onGround = true;
        }
        if (z.pose) z.pose.initialized = false;
      }
      continue;
    }

    // Twardy reset stanu kucania i ślizgu w każdej klatce dla żywego zombie
    if (z.isCrawling) {
      z.w = 34;
      z.h = 26;
      z.pelvisY = 0;
      z.isCrouching = false;
      z.crouching = false;
      z.crouchTimer = 0;
      z.crouchBlend = 0;
      z.crouchFactor = 0;
      z.crouchToggled = false;
      z.crouchHoldTimer = 0;
      z.sliding = false;
      z.isSliding = false;
      z.slideTimer = 0;
      z.rollTimer = 0;
      z.isProne = false;
      z.staggerTimer = 0;
      z.gaitMode = 'CRAWL';
      if (!z.keys) {
        z.keys = { left: false, right: false, up: false, down: false };
      } else {
        z.keys.up = false;
        z.keys.down = false;
      }
    } else {
      z.w = 24;
      z.h = 70;
      z.pelvisY = -11.8;
      z.isCrouching = false;
      z.crouching = false;
      z.crouchTimer = 0;
      z.crouchBlend = 0;
      z.crouchFactor = 0;
      z.crouchToggled = false;
      z.crouchHoldTimer = 0;
      z.sliding = false;
      z.isSliding = false;
      z.slideTimer = 0;
      z.rollTimer = 0;
      z.isProne = false;
      z.staggerTimer = 0;
      if (z.gaitMode === 'CROUCH' || z.gaitMode === 'CROUCH_WALK' || z.gaitMode === 'PRONE' || z.gaitMode === 'CRAWL') {
        z.gaitMode = Math.abs(z.vx || 0) > 0.1 ? 'WALK' : 'IDLE';
      }
      if (!z.keys) {
        z.keys = { left: false, right: false, up: false, down: false };
      } else {
        z.keys.down = false;
      }
    }

    // Timery animacji, odnowienia ataku i hitstuna
    if (z.attackCooldown > 0) z.attackCooldown -= dt;
    if (z.attackAnim > 0) z.attackAnim -= dt;
    if (z.hitStunTimer > 0) z.hitStunTimer -= dt;
    if (z.jumpCooldown > 0) z.jumpCooldown -= dt;

    // Tłumienie odrzutu kinetycznego (knockback)
    if (z.knockbackVx) {
      z.knockbackVx *= 0.86;
      if (Math.abs(z.knockbackVx) < 0.05) z.knockbackVx = 0;
    }

    // Unikanie zlewania się wielu zombie w jeden punkt (soft flocking separation)
    let sepX = 0;
    for (let j = 0; j < zombieState.zombies.length; j++) {
      if (i === j) continue;
      const oz = zombieState.zombies[j];
      if (!oz || oz.isDead || oz.riseTimer > 0) continue;
      const distZ = (z.x + z.w * 0.5) - (oz.x + oz.w * 0.5);
      if (Math.abs(distZ) < 22 && Math.abs(z.y - oz.y) < 32) {
        sepX += (distZ >= 0 ? 1 : -1) * (22 - Math.abs(distZ)) * 0.06;
      }
    }

    // --- WYBÓR NAJBLIŻSZEGO ŻYWEGO CELU ---
    let nearestTarget = null;
    let minDist = Infinity;

    for (const victim of livingHumans) {
      const vx = victim.x + (victim.w || 24) * 0.5;
      const vy = victim.y + (victim.h || 70) * 0.5;
      const zx = z.x + z.w * 0.5;
      const zy = z.y + z.h * 0.5;
      const d = Math.hypot(vx - zx, vy - zy);
      if (d < minDist) {
        minDist = d;
        nearestTarget = victim;
      }
    }

    const zx = z.x + z.w * 0.5;
    const zy = z.y + z.h * 0.5;
    let desiredVx = 0;

    if (nearestTarget) {
      const tx = nearestTarget.x + (nearestTarget.w || 24) * 0.5;
      const ty = nearestTarget.y + (nearestTarget.h || 70) * 0.5;
      const dx = tx - zx;
      const dy = ty - zy;

      z.facing = dx >= 0 ? 1 : -1;
      z.yaw = (z.facing < 0 ? Math.PI : 0);

      if (z.isCrawling) {
        z.isReaching = false;
        z.reachBlend = 0;
        // Rytmiczny cykl podciągania się na rękach (szarpany ruch w stronę ofiary)
        z.crawlPhase = (z.crawlPhase || 0) + dt * 4.5;
        const pullFactor = 0.55 + 0.45 * Math.max(0, Math.sin(z.crawlPhase));
        const crawlSpeed = (ZOMBIE_CONFIG.SPEED * 0.42) * pullFactor;

        if (z.hitStunTimer <= 0) {
          if (Math.abs(dx) > 16) {
            desiredVx = (dx > 0 ? 1 : -1) * crawlSpeed;
            z.walkAnim += dt * 2.2;
          } else {
            desiredVx = 0;
          }
        }
      } else {
        // Detekcja bliskości celu i wyciąganie rąk (agresywny zryw w stronę ofiary)
        const dist = Math.hypot(dx, dy);
        const isTargetAlive = !nearestTarget.isDead;
        const inAggroRange = isTargetAlive && Math.abs(dx) < 260 && Math.abs(dy) < 120;
        const isOutOfRange = !isTargetAlive || dist > 300 || Math.abs(dx) > 300 || Math.abs(dy) > 160;

        if (inAggroRange) {
          z.isReaching = true;
          z.reachBlend = Math.min(1.0, (z.reachBlend || 0) + 0.12);
        } else if (isOutOfRange) {
          z.isReaching = false;
          z.reachBlend = Math.max(0, (z.reachBlend || 0) - 0.08);
        } else {
          // Histereza podtrzymująca agresję pomiędzy 260 a 300 px
          if (z.isReaching) {
            z.reachBlend = Math.min(1.0, (z.reachBlend || 0) + 0.04);
          } else {
            z.reachBlend = Math.max(0, (z.reachBlend || 0) - 0.08);
          }
        }

        // Zwiększenie prędkości poruszania się zombie o 30–35% względem bazowego chodu przy zrywie
        const reachFactor = (z.reachBlend || 0);
        const speedMultiplier = 1.0 + reachFactor * 0.33; // 33% agresywnego zrywu
        const moveSpeed = ZOMBIE_CONFIG.SPEED * speedMultiplier;

        // Człapiący ruch w stronę celu (zablokowany w ułamku sekundy podczas mocnego uderzenia/hitstuna)
        if (z.hitStunTimer <= 0) {
          if (Math.abs(dx) > 16) {
            desiredVx = (dx > 0 ? 1 : -1) * moveSpeed;
            z.walkAnim += dt * (3.4 * speedMultiplier);
          } else {
            desiredVx = 0;
          }
        }
      }

      // --- ATAK WRĘCZ / UGRYZIENIE ---
      const biteToleranceY = z.isCrawling ? 52 : 38;
      if (Math.abs(dx) <= ZOMBIE_CONFIG.BITE_RANGE && Math.abs(dy) <= biteToleranceY) {
        if (z.attackCooldown <= 0) {
          z.attackCooldown = ZOMBIE_CONFIG.BITE_COOLDOWN;
          z.attackAnim = 0.35;

          // Zadanie obrażeń celowi
          nearestTarget.hp -= ZOMBIE_CONFIG.BITE_DAMAGE;
          spawnBloodSpurt(tx, ty, z.facing * 2.2, -1.8, 14, 1.2);

          if (nearestTarget === player) {
            triggerScreenShake(3.0);
          }

          // Zakażenie wirusem przy ugryzieniu
          if (!nearestTarget.infected) {
            nearestTarget.infected = true;
            nearestTarget.infectionTimer = 0;

            if (nearestTarget === player) {
              triggerCombatFeedBanner('DEATH', '[ZAKAŻENIE] ZOSTAŁEŚ UGRYZIONY! ZNAJDŹ ANTYDOTUM!');
              triggerScreenShake(4.5);
            } else {
              triggerCombatFeedBanner('DEATH', `[PLAGA] ${nearestTarget.name || 'BOT'} ZOSTAŁ ZAKAŻONY!`);
            }
          }

          // Śmierć od ugryzienia
          if (nearestTarget.hp <= 0 && !nearestTarget.isDead) {
            nearestTarget.hp = 0;
            nearestTarget.isDead = true;
            nearestTarget.respawnTimer = 180;
            nearestTarget.hasHead = true;
            nearestTarget.decapitated = false;
            nearestTarget.bleedTimer = 90;
            nearestTarget.corpseAngle = 0;
            nearestTarget.corpseRotVel = 0;
            nearestTarget.torsoTiltVel = 0;
            const tX = nearestTarget.x + (nearestTarget.w || 24) * 0.5;
            const tY = nearestTarget.y + (nearestTarget.h || 70);
            const tSurfY = getZombieSurfaceY(tX, tY, groundY);
            nearestTarget.corpseFloorY = (tSurfY !== Infinity && tSurfY < 1500) ? tSurfY : groundY;
            nearestTarget.ragdoll = null;
            nearestTarget.deathImpulse = {
              vx: z.facing * 3.2,
              vy: -1.4
            };
            triggerCombatFeedBanner('DEATH', `[PLAGA] ${nearestTarget.name || 'OPERATOR'} POLEGŁ W SZPONACH ZOMBIE!`);
          }
        }
      }

      // --- ATAK WRĘCZ NA BLOKUJĄCĄ BECZKĘ ---
      const atkBarrels = (hazardsState && Array.isArray(hazardsState.barrels)) ? hazardsState.barrels : (typeof window !== 'undefined' ? window.hazardsBarrels : null);
      if (Array.isArray(atkBarrels) && z.attackCooldown <= 0) {
        for (let bIdx = 0; bIdx < atkBarrels.length; bIdx++) {
          const bar = atkBarrels[bIdx];
          if (!bar || bar.isDead) continue;
          const barMidX = bar.x + bar.w * 0.5;
          const barMidY = bar.y + bar.h * 0.5;
          const bDx = barMidX - zx;
          const bDy = barMidY - zy;
          const isAhead = (bDx * z.facing) >= -4 && (bDx * z.facing) <= (ZOMBIE_CONFIG.BITE_RANGE + 8);
          if (isAhead && Math.abs(bDy) <= 42) {
            z.attackCooldown = ZOMBIE_CONFIG.BITE_COOLDOWN;
            z.attackAnim = 0.35;
            const dmgFn = (typeof damageBarrel === 'function') ? damageBarrel : (typeof window !== 'undefined' ? window.damageBarrel : null);
            if (typeof dmgFn === 'function') {
              dmgFn(bar, ZOMBIE_CONFIG.BITE_DAMAGE, z);
            }
            triggerScreenShake(2.0);
            break;
          }
        }
      }
    } else {
      // Brak żywych celów – zombie snuje się powoli
      z.isReaching = false;
      z.reachBlend = Math.max(0, (z.reachBlend || 0) - 0.08);
      if (z.isCrawling) {
        z.crawlPhase = (z.crawlPhase || 0) + dt * 3.0;
        const pullFactor = 0.55 + 0.45 * Math.max(0, Math.sin(z.crawlPhase));
        desiredVx = Math.sin(Date.now() * 0.001 + i) * (ZOMBIE_CONFIG.SPEED * 0.25) * pullFactor;
        z.walkAnim += dt * 1.2;
      } else {
        desiredVx = Math.sin(Date.now() * 0.001 + i) * (ZOMBIE_CONFIG.SPEED * 0.4);
        z.walkAnim += dt * 1.5;
      }
      if (Math.abs(desiredVx) > 0.05) z.facing = desiredVx > 0 ? 1 : -1;
    }

    // Wypadkowa prędkość pozioma: intencja ruchu + odrzut kinetyczny + separacja stada
    z.vx = desiredVx + (z.knockbackVx || 0) + sepX;

    // --- FIZYKA PIONOWA I KOLIZJE Z PODŁOŻEM ---
    z.vy += 0.45;
    if (z.vy > 12) z.vy = 12;

    const feetX = z.x + z.w * 0.5;
    const feetY = z.y + z.h;
    const surfaceY = getZombieSurfaceY(feetX, feetY, groundY);

    if (surfaceY !== Infinity && z.vy >= -1.0 && feetY + z.vy >= surfaceY && feetY <= surfaceY + 22) {
      z.y = surfaceY - z.h;
      z.groundY = surfaceY;
      z.vy = 0;
      z.onGround = true;
    } else if (z.onGround && surfaceY !== Infinity && Math.abs(feetY - surfaceY) <= 14 && z.vy >= 0) {
      z.y = surfaceY - z.h;
      z.groundY = surfaceY;
      z.vy = 0;
      z.onGround = true;
    } else {
      z.y += z.vy;
      z.onGround = false;
      // Kolizja głowy z sufitem w trakcie lotu w górę
      if (z.vy < 0) {
        checkZombieCeiling(z, groundY);
      }
    }

    // --- RUCH POZIOMY I REAKCJE NA OTOCZENIE ---
    z.x += z.vx;

    // Pokonywanie schodkow (do 16px bez skoku) oraz wspinaczka na polki
    const climbed = handleZombieStepAndClimb(z, groundY, nearestTarget);

    // Celowany skok na platformę gdy cel znajduje się bezpośrednio nad głową w zasięgu skoku
    if (!climbed && !z.isCrawling && nearestTarget && z.onGround && z.jumpCooldown <= 0) {
      const targetFeetY = nearestTarget.y + (nearestTarget.h || 70);
      const heightDiff = (z.y + z.h) - targetFeetY; // dodatnie gdy cel jest wyżej
      const targetDx = (nearestTarget.x + (nearestTarget.w || 24) * 0.5) - (z.x + z.w * 0.5);

      // Skaczemy TYLKO gdy cel jest na osiągalnej wysokości (36px do 110px), w bliskiej odległości i nie ma sufitu
      if (heightDiff > 36 && heightDiff <= 110 && Math.abs(targetDx) < 65) {
        if (!checkZombieCeilingAbove(z, groundY)) {
          z.vy = -8.5;
          z.vx = (targetDx >= 0 ? 1 : -1) * 2.2;
          z.jumpCooldown = 1.8;
          z.onGround = false;
        }
      }
    }

    // Blokada przenikania przez ściany pionowe, monolity i klocki Areny 5
    resolveZombieWallCollisions(z, groundY);

    // --- ZAGROŻENIA ŚRODOWISKOWE AREN (KWAS, WODA, LAWA, UTYLIZATOR) ---
    if (checkZombieEnvironmentalHazard(z)) {
      spawnBloodSpurt(z.x + z.w / 2, z.y + z.h - 10, 0, -2.5, 12, 1.0);
      zombieState.zombies.splice(i, 1);
      continue;
    }

    // Granice poziome areny: zapobieganie wypadaniu poza mapę
    const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
    const minBoundsX = curArena?.bounds?.minX ?? 0;
    const maxBoundsX = curArena?.bounds?.maxX ?? ARENA_RIGHT;
    z.x = Math.max(minBoundsX + 12, Math.min(maxBoundsX - z.w - 12, z.x));
  }
}

/**
 * Rejestruje zgon postaci i tworzy leżące ciało do późniejszej reanimacji
 */
export function onCharacterRespawnCorpse(char, groundY) {
  if (!isZombieModeActive() || !char) return;

  // Ciała pozbawione głów (decapitated) oraz zmiażdżone (squashed/crushed/gibbed) NIE wstają
  if (char.isSquashed || char.isCrushed || char.isGibbed || char.decapitated || !char.hasHead || (char.acidDeath && char.acidDeath.dissolved)) {
    return;
  }

  const corpseX = char.ragdoll?.pelvis?.x ?? (char.x + (char.w || 24) * 0.5);
  const approxY = char.ragdoll?.pelvis?.y ?? (char.y + (char.h || 70) - 10);
  const surfaceY = getZombieSurfaceY(corpseX, approxY, groundY);

  if (surfaceY === Infinity || surfaceY > 1400) return;

  const { arenaKey } = getArenaContext();
  if ((arenaKey === 'arena-2' || arenaKey === 'arena-2-pandora' || arenaKey === 'arena-2-sector-x') && surfaceY >= 1430) return;
  if ((arenaKey === 'arena-3' || arenaKey === 'arena-foundry') && surfaceY >= 1300) return;
  if ((arenaKey === 'arena-4' || arenaKey === 'armored-train') && surfaceY >= 1385) return;

  registerCorpseForReanimation(char, surfaceY);
  refreshActiveZombiesCache();
}

/**
 * Leczy postać z infekcji (np. po zebraniu ampułki z Care Package)
 */
export function cureInfection(char) {
  if (!char) return;
  char.infected = false;
  char.infectionTimer = 0;
  char.hp = Math.min(char.maxHp || 100, char.hp + 50);
  triggerCombatFeedBanner('KILL', `[WYLECZONO] ZASTOSOWANO ANTYDOTUM!`);
}
