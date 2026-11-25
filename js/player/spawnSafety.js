// =========================================================================
// PLAYER/SPAWNSAFETY.JS - WALIDACJA BEZPIECZEŃSTWA PUNKTÓW ODRODZENIA
// Gwarantuje brak respawnu w ogniu, kwasie, lawie, wodzie, przepaści,
// pod opadającą suwnicą lub na kolizyjnych pułapkach na wszystkich arenach.
// =========================================================================

import { START_X } from '../config.js';
import { GROUND_Y, isGroundAt } from '../world.js';
import { ARENA_PLATFORMS, customObstacles, getPlatformSurfaceY, getPlatformBounds } from '../obstacles.js';
import { ACID_SURGE_SYSTEM } from '../arenas/arena2/state.js';
import { getSafeSurfaceBelow, getSafeArena3Spawn } from '../arenas/arena3/state.js';
import { arena5State, CELL_SIZE, COLS, SHAFT_LEFT, SHAFT_RIGHT } from '../arenas/arena5/state.js';
import { hasFireHazardInBox } from '../weapons/flamethrower.js';
import { hazardsState } from '../hazards/state.js';
import { activeProjectiles } from '../projectiles.js';
import { activeMortarStrikes } from '../killstreaks/supportStrikes.js';

/**
 * Normalizuje identyfikator aktywnej areny do kanonicznego klucza.
 */
export function normalizeSpawnArenaKey(activeArena) {
  const raw = activeArena?.id || activeArena?.alias || (typeof window !== 'undefined' ? window.activeArenaId : '') || 'ARENA_1';
  const s = String(raw).toUpperCase();
  if (s.includes('ARENA_2') || s === 'ARENA-2' || s.includes('SECTOR_X') || s.includes('PANDORA')) return 'ARENA_2';
  if (s.includes('ARENA_3') || s === 'ARENA-3' || s.includes('JUNGLE') || s.includes('FOUNDRY')) return 'ARENA_3';
  if (s.includes('ARENA_4') || s === 'ARENA-4' || s.includes('CALDERA') || s.includes('OBSIDIAN')) return 'ARENA_4';
  if (s.includes('ARENA_5') || s === 'ARENA-5' || s.includes('PREFAB') || s.includes('TOWER')) return 'ARENA_5';
  return 'ARENA_1';
}

function getPlatformsForArena(activeArena) {
  if (Array.isArray(ARENA_PLATFORMS) && ARENA_PLATFORMS.length > 0) {
    return ARENA_PLATFORMS;
  }
  if (activeArena && Array.isArray(activeArena.platforms)) {
    return activeArena.platforms;
  }
  return [];
}

function getAcidLevelY(activeArena) {
  if (typeof ACID_SURGE_SYSTEM !== 'undefined' && typeof ACID_SURGE_SYSTEM.currentY === 'number') {
    return ACID_SURGE_SYSTEM.currentY;
  }
  if (activeArena?.acidSurge && typeof activeArena.acidSurge.currentY === 'number') {
    return activeArena.acidSurge.currentY;
  }
  if (typeof activeArena?.hazardZoneY === 'number') {
    return activeArena.hazardZoneY;
  }
  return 1440;
}

/**
 * Zwraca Y bezpiecznej stałej powierzchni pod punktem (x, feetRefY) lub null w razie przepaści / zniszczenia.
 */
export function getSafeFloorYAtX(x, feetRefY, activeArena, groundY = GROUND_Y, maxDrop = 190) {
  const arenaKey = normalizeSpawnArenaKey(activeArena);

  if (arenaKey === 'ARENA_3') {
    const supY = getSafeSurfaceBelow(x, feetRefY - 40, 'ARENA_3');
    if (supY === null || supY >= 1285) return null;
    if (supY < feetRefY - 26 || supY > feetRefY + maxDrop) return null;
    return supY;
  }

  if (arenaKey === 'ARENA_5') {
    if (x < SHAFT_LEFT + 10 || x > SHAFT_RIGHT - 10) return null;
    const col = Math.max(0, Math.min(COLS - 1, Math.floor((x - SHAFT_LEFT) / CELL_SIZE)));
    const minRow = arena5State.minFloorRow || 0;
    const recyclerLimitY = (typeof arena5State.recyclerY === 'number' ? arena5State.recyclerY : 1600) - 55;
    let bestY = null;

    for (let r = (arena5State.highestRowIndex || 0) + 2; r >= minRow; r--) {
      const rowData = arena5State.gridRows?.get(r);
      const cell = rowData ? rowData[col] : null;
      if (cell && cell.hp > 0 && !cell.isFalling) {
        if (cell.y >= feetRefY - 26 && cell.y < recyclerLimitY && cell.y <= feetRefY + maxDrop) {
          if (bestY === null || cell.y < bestY) bestY = cell.y;
        }
      }
    }

    if (bestY !== null) return bestY;

    const floorY = arena5State.currentFloorY || 1200;
    if (minRow === 0 && floorY < recyclerLimitY && floorY >= feetRefY - 26 && floorY <= feetRefY + maxDrop) {
      return floorY;
    }
    return null;
  }

  // Areny 1, 2, 4 oraz domyślna
  const plats = getPlatformsForArena(activeArena);
  let bestTopY = Infinity;

  for (let i = 0; i < plats.length; i++) {
    const plat = plats[i];
    if (!plat || plat.isWall || plat.solid === false || plat.isPlatform === false) continue;
    if (plat.type === 'water' || plat.intact === false || (plat.collapseDelay && plat.collapseDelay > 0)) continue;
    if (typeof plat.hp === 'number' && plat.hp <= 0) continue;

    const bnds = (typeof getPlatformBounds === 'function')
      ? getPlatformBounds(plat)
      : { minX: plat.x, maxX: plat.x + (plat.w ?? plat.width ?? 100) };
    if (x >= bnds.minX && x <= bnds.maxX) {
      const topY = (typeof getPlatformSurfaceY === 'function')
        ? getPlatformSurfaceY(plat, x, groundY)
        : (plat.y !== undefined ? plat.y : (groundY - (plat.relY || 0)));
      if (typeof topY === 'number' && !isNaN(topY) && topY >= feetRefY - 26 && topY <= feetRefY + maxDrop && topY < bestTopY) {
        bestTopY = topY;
      }
    }
  }

  if (Array.isArray(customObstacles)) {
    for (let i = 0; i < customObstacles.length; i++) {
      const obs = customObstacles[i];
      if (!obs || obs.solid === false || obs.type === 'barbed_wire' || obs.type === 'laser_gate') continue;
      if (x >= obs.x && x <= obs.x + (obs.w || 40)) {
        const topY = obs.y !== undefined ? obs.y : (groundY - (obs.relY || 0));
        if (topY >= feetRefY - 26 && topY <= feetRefY + maxDrop && topY < bestTopY) {
          bestTopY = topY;
        }
      }
    }
  }

  if (bestTopY < Infinity) {
    if (arenaKey === 'ARENA_2' && bestTopY >= getAcidLevelY(activeArena) - 40) return null;
    if (arenaKey === 'ARENA_4' && bestTopY >= ((activeArena?.deathY || 1400) - 80)) return null;
    return bestTopY;
  }

  // W Arenie 2 i 4 nie ma ciągłego gruntu pod platformami (kwas / jezioro magmy)
  if (arenaKey === 'ARENA_2' || arenaKey === 'ARENA_4') {
    return null;
  }

  // Arena 1 / domyślna: wymagany nienaruszony segment podłoża pod punktem
  const hasSolidGround = (typeof isGroundAt === 'function') ? isGroundAt(x, 0) : true;
  if (hasSolidGround && groundY >= feetRefY - 26 && groundY <= feetRefY + maxDrop) {
    return groundY;
  }

  return null;
}

function hasSolidWallOrBlockOverlap(minX, minY, maxX, maxY, activeArena, groundY, arenaKey) {
  const plats = getPlatformsForArena(activeArena);
  for (let i = 0; i < plats.length; i++) {
    const plat = plats[i];
    if (!plat || !plat.isWall || plat.solid === false) continue;
    const pw = plat.w ?? plat.width ?? 40;
    const ph = plat.h ?? plat.height ?? 100;
    const py = plat.y !== undefined ? plat.y : (groundY - (plat.relY || 0));
    if (maxX > plat.x && minX < plat.x + pw && maxY > py && minY < py + ph) {
      return true;
    }
  }

  if (Array.isArray(customObstacles)) {
    for (let i = 0; i < customObstacles.length; i++) {
      const obs = customObstacles[i];
      if (!obs || obs.solid === false) continue;
      const oy = obs.y !== undefined ? obs.y : (groundY - (obs.relY || 0));
      const pad = (obs.type === 'barbed_wire' || obs.type === 'laser_gate') ? 18 : 0;
      if (maxX > obs.x - pad && minX < obs.x + (obs.w || 40) + pad && maxY > oy - pad && minY < oy + (obs.h || 40) + pad) {
        return true;
      }
    }
  }

  if (arenaKey === 'ARENA_5') {
    const minRow = arena5State.minFloorRow || 0;
    const maxRow = arena5State.highestRowIndex || 0;
    const colL = Math.max(0, Math.floor(minX / CELL_SIZE));
    const colR = Math.min(COLS - 1, Math.floor(maxX / CELL_SIZE));
    for (let c = colL; c <= colR; c++) {
      for (let r = minRow; r <= maxRow + 1; r++) {
        const rowData = arena5State.gridRows?.get(r);
        const cell = rowData ? rowData[c] : null;
        if (!cell || cell.hp <= 0 || cell.isFalling) continue;
        if (maxX > cell.x && minX < cell.x + CELL_SIZE && maxY > cell.y && minY < cell.y + CELL_SIZE) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Pełna ocena bezpieczeństwa pozycji odrodzenia (uwzględnia przepaść, wodę, kwas, lawę,
 * suwnicę, gejzery, rozlany ogień, strumienie ognia, beczki, granaty i ostrzał moździerzowy).
 */
export function evaluateSpawnSafety(spawn, activeArena, respawningChar = null, groundY = GROUND_Y) {
  if (!spawn || typeof spawn.x !== 'number' || typeof spawn.y !== 'number' || Number.isNaN(spawn.x) || Number.isNaN(spawn.y)) {
    return { safe: false, lethalSafe: false, penalty: 1e6, adjustedSpawn: null, landY: null };
  }

  const arenaKey = normalizeSpawnArenaKey(activeArena);
  const charW = respawningChar?.w || 26;
  const charH = respawningChar?.h || 72;

  let candX = spawn.x;
  let candY = spawn.y;

  // Wstępne dopasowanie Y dla Areny 3
  if (arenaKey === 'ARENA_3') {
    const a3Check = getSafeArena3Spawn({ x: candX + charW * 0.5, y: candY, facing: spawn.facing }, charH);
    if (!a3Check) {
      return { safe: false, lethalSafe: false, penalty: 1e6, adjustedSpawn: null, landY: null };
    }
    candY = a3Check.y;
  }

  // 1. Granice mapy
  let minBoundX = activeArena?.bounds?.minX ?? 20;
  let maxBoundX = activeArena?.bounds?.maxX ?? activeArena?.width ?? 3600;
  if (arenaKey === 'ARENA_5') {
    minBoundX = SHAFT_LEFT + 12;
    maxBoundX = SHAFT_RIGHT - 12;
  }
  if (candX < minBoundX || candX + charW > maxBoundX || candY < 10) {
    return { safe: false, lethalSafe: false, penalty: 1e6, adjustedSpawn: null, landY: null };
  }

  // 2. Brak kolizji ze ścianami i pułapkami (drut kolczasty, bramki laserowe, bloki wieży)
  if (hasSolidWallOrBlockOverlap(candX, candY, candX + charW, candY + charH, activeArena, groundY, arenaKey)) {
    return { safe: false, lethalSafe: false, penalty: 1e6, adjustedSpawn: null, landY: null };
  }

  // 3. Sprawdzenie ciągłości stałego podłoża pod całą szerokością stóp (brak przepaści / zniszczonego mostu / dziury)
  const feetY = candY + charH;
  const supC = getSafeFloorYAtX(candX + charW * 0.5, feetY, activeArena, groundY);
  const supL = getSafeFloorYAtX(candX + 3, feetY, activeArena, groundY);
  const supR = getSafeFloorYAtX(candX + charW - 3, feetY, activeArena, groundY);
  if (supC === null || supL === null || supR === null) {
    return { safe: false, lethalSafe: false, penalty: 1e6, adjustedSpawn: null, landY: null };
  }
  if (Math.abs(supL - supC) > 36 || Math.abs(supR - supC) > 36) {
    return { safe: false, lethalSafe: false, penalty: 1e6, adjustedSpawn: null, landY: null };
  }

  const landY = supC;
  const landBottomY = Math.max(feetY, landY);

  // 4. Strefy śmiertelne specyficzne dla aren (kwas, rzeka, lawa/gejzery, utylizator/suwnica, spąg)
  if (arenaKey === 'ARENA_2') {
    const acidY = getAcidLevelY(activeArena);
    if (landBottomY >= acidY - 40) {
      return { safe: false, lethalSafe: false, penalty: 1e6, adjustedSpawn: null, landY };
    }
  } else if (arenaKey === 'ARENA_3') {
    const cx = candX + charW * 0.5;
    if (landBottomY >= 1285) {
      return { safe: false, lethalSafe: false, penalty: 1e6, adjustedSpawn: null, landY };
    }
    if (cx >= 1560 && cx <= 2840 && landY >= 1250) {
      return { safe: false, lethalSafe: false, penalty: 1e6, adjustedSpawn: null, landY };
    }
  } else if (arenaKey === 'ARENA_4') {
    const deathY = activeArena?.deathY || 1400;
    if (landBottomY >= deathY - 80) {
      return { safe: false, lethalSafe: false, penalty: 1e6, adjustedSpawn: null, landY };
    }
    const geysers = activeArena?.geysers;
    if (Array.isArray(geysers)) {
      for (let i = 0; i < geysers.length; i++) {
        const g = geysers[i];
        if (!g) continue;
        const imminent = (g.state === 'ERUPTING' || g.state === 'TELEGRAPH' || (g.state === 'DORMANT' && g.timer <= 1.2));
        if (!imminent) continue;
        const gxHalf = (g.width || 60) * 0.5 + 28;
        if (candX + charW >= g.x - gxHalf && candX <= g.x + gxHalf && landBottomY >= (g.y - (g.height || 450) - 30)) {
          return { safe: false, lethalSafe: false, penalty: 1e6, adjustedSpawn: null, landY };
        }
      }
    }
  } else if (arenaKey === 'ARENA_5') {
    const recyclerY = typeof arena5State.recyclerY === 'number' ? arena5State.recyclerY : 1600;
    if (landBottomY >= recyclerY - 55) {
      return { safe: false, lethalSafe: false, penalty: 1e6, adjustedSpawn: null, landY };
    }
    const crane = arena5State.crane;
    if (crane && crane.shape && (crane.phase === 'WARNING' || crane.phase === 'FALLING')) {
      const cLeft = crane.dropX - 20;
      const cRight = crane.dropX + (crane.shape.w || 1) * CELL_SIZE + 20;
      if (candX + charW >= cLeft && candX <= cRight) {
        return { safe: false, lethalSafe: false, penalty: 1e6, adjustedSpawn: null, landY };
      }
    }
    if (Array.isArray(arena5State.activeLineClears) && arena5State.activeLineClears.length > 0) {
      for (const lc of arena5State.activeLineClears) {
        if (lc && typeof lc.y === 'number' && Math.abs(lc.y - landY) <= CELL_SIZE + 25) {
          return { safe: false, lethalSafe: false, penalty: 1e6, adjustedSpawn: null, landY };
        }
      }
    }
  } else {
    if (landBottomY >= groundY + 40) {
      return { safe: false, lethalSafe: false, penalty: 1e6, adjustedSpawn: null, landY };
    }
  }

  // Od tego momentu pozycja ma pewne podłoże i nie wpada w żadną przepaść ani pułapkę konstrukcyjną
  let penalty = 0;

  // 5. Aktywny ogień (rozlany napalm, krople ognia, strumień miotacza ognia)
  if (hasFireHazardInBox(candX - 22, candY - 18, candX + charW + 22, landBottomY + 20)) {
    penalty += 500;
  }

  // 6. Kałuże toksycznego kwasu
  if (hazardsState && Array.isArray(hazardsState.acidPools)) {
    for (let i = 0; i < hazardsState.acidPools.length; i++) {
      const pool = hazardsState.acidPools[i];
      if (!pool || pool.timer <= 0) continue;
      const r = (pool.radius || 40) + 22;
      if (candX + charW >= pool.x - r && candX <= pool.x + r && Math.abs(landBottomY - pool.y) <= 44) {
        penalty += 450;
      }
    }
  }

  // 7. Palące się / bliskie beczki wybuchowe i toksyczne
  if (hazardsState && Array.isArray(hazardsState.barrels)) {
    const cx = candX + charW * 0.5;
    const cy = candY + charH * 0.5;
    for (let i = 0; i < hazardsState.barrels.length; i++) {
      const b = hazardsState.barrels[i];
      if (!b || b.isDead) continue;
      const dist = Math.hypot((b.x + b.w * 0.5) - cx, (b.y + b.h * 0.5) - cy);
      if (b.fuseTimer > 0 && dist < 175) {
        penalty += 600;
      } else if (dist < 42) {
        penalty += 150;
      }
    }
  }

  // 8. Aktywne granaty, Mołotowy, rakiety i nadlatujące pociski moździerzowe
  const cx = candX + charW * 0.5;
  const cy = landBottomY - charH * 0.5;
  if (Array.isArray(activeProjectiles)) {
    for (let i = 0; i < activeProjectiles.length; i++) {
      const p = activeProjectiles[i];
      if (!p || p.dead || p.exploded) continue;
      const dist = Math.hypot((p.x || 0) - cx, (p.y || 0) - cy);
      if (dist < 105) {
        penalty += 350;
      }
    }
  }
  if (Array.isArray(activeMortarStrikes)) {
    for (let i = 0; i < activeMortarStrikes.length; i++) {
      const m = activeMortarStrikes[i];
      if (!m || m.dead || m.detonated) continue;
      if (Math.abs((m.targetX ?? m.x ?? 0) - cx) < 125) {
        penalty += 400;
      }
    }
  }

  const facing = spawn.facing !== undefined ? spawn.facing : (candX < 2000 ? 1 : -1);
  return {
    safe: penalty === 0,
    lethalSafe: true,
    penalty,
    adjustedSpawn: { x: candX, y: candY, facing },
    landY
  };
}

/**
 * Szybkie sprawdzenie czy punkt spawnu jest całkowicie bezpieczny.
 */
export function isSpawnPointSafe(spawn, activeArena, respawningChar = null, groundY = GROUND_Y) {
  return evaluateSpawnSafety(spawn, activeArena, respawningChar, groundY).safe;
}

/**
 * Dynamicznie wyszukuje bezpieczne punkty odrodzenia na stabilnych platformach i gruncie,
 * gdy wszystkie predefiniowane punkty spawnu są zablokowane (ogień, kratery, kwas, suwnica).
 */
export function findDynamicSafeSpawns(activeArena, respawningChar = null, groundY = GROUND_Y, rawPresetSpawns = []) {
  const arenaKey = normalizeSpawnArenaKey(activeArena);
  const charW = respawningChar?.w || 26;
  const charH = respawningChar?.h || 72;
  const strictSafe = [];
  const lowPenaltyFallback = [];

  const testAndPush = (candX, surfaceY, facingHint) => {
    if (typeof surfaceY !== 'number' || Number.isNaN(surfaceY)) return;
    const res = evaluateSpawnSafety(
      { x: candX, y: surfaceY - charH - 2, facing: facingHint },
      activeArena,
      respawningChar,
      groundY
    );
    if (!res.lethalSafe || !res.adjustedSpawn) return;
    if (res.safe) {
      strictSafe.push(res.adjustedSpawn);
    } else {
      lowPenaltyFallback.push({ spawn: res.adjustedSpawn, penalty: res.penalty });
    }
  };

  // 1. Przesunięcia boczne wokół predefiniowanych spawnów (np. ominięcie plamy ognia lub małego krateru)
  const offsets = [-180, -110, -55, 55, 110, 180];
  if (Array.isArray(rawPresetSpawns)) {
    for (let i = 0; i < rawPresetSpawns.length; i++) {
      const sp = rawPresetSpawns[i];
      if (!sp) continue;
      for (let oi = 0; oi < offsets.length; oi++) {
        const cx = sp.x + offsets[oi];
        const supY = getSafeFloorYAtX(cx + charW * 0.5, sp.y + charH, activeArena, groundY, 220);
        if (supY !== null) {
          testAndPush(cx, supY, sp.facing);
        }
      }
    }
  }

  // 2. Skanowanie wszystkich nienaruszonych platform aktywnej areny
  const plats = getPlatformsForArena(activeArena);
  for (let i = 0; i < plats.length; i++) {
    const plat = plats[i];
    if (!plat || plat.isWall || plat.solid === false || plat.isPlatform === false) continue;
    if (plat.type === 'water' || plat.intact === false || (plat.collapseDelay && plat.collapseDelay > 0)) continue;
    if (typeof plat.hp === 'number' && plat.hp <= 0) continue;
    const bnds = (typeof getPlatformBounds === 'function')
      ? getPlatformBounds(plat)
      : { minX: plat.x, maxX: plat.x + (plat.w ?? plat.width ?? 100) };
    const span = bnds.maxX - bnds.minX;
    if (span < charW + 24) continue;
    for (let px = bnds.minX + 24; px <= bnds.maxX - charW - 24; px += 95) {
      const topY = (typeof getPlatformSurfaceY === 'function')
        ? getPlatformSurfaceY(plat, px + charW * 0.5, groundY)
        : (plat.y ?? (groundY - (plat.relY || 0)));
      testAndPush(px, topY, px < 1800 ? 1 : -1);
    }
  }

  // 3. Skanowanie kolumn wieży Areny 5 oraz podłoża lądowego Areny 1 i 3
  if (arenaKey === 'ARENA_5') {
    const minRow = arena5State.minFloorRow || 0;
    for (let c = 0; c < COLS; c++) {
      const px = SHAFT_LEFT + c * CELL_SIZE + (CELL_SIZE - charW) * 0.5;
      let colTop = (minRow === 0) ? (arena5State.currentFloorY || 1200) : null;
      for (let r = (arena5State.highestRowIndex || 0) + 1; r >= minRow; r--) {
        const rowData = arena5State.gridRows?.get(r);
        const cell = rowData ? rowData[c] : null;
        if (cell && cell.hp > 0 && !cell.isFalling) {
          colTop = cell.y;
          break;
        }
      }
      if (colTop !== null) {
        testAndPush(px, colTop, c < COLS * 0.5 ? 1 : -1);
      }
    }
  } else if (arenaKey === 'ARENA_1' || arenaKey === 'ARENA_3') {
    const startScanX = arenaKey === 'ARENA_3' ? 260 : 120;
    const endScanX = arenaKey === 'ARENA_3' ? 4140 : 3480;
    for (let px = startScanX; px <= endScanX; px += 120) {
      const supY = getSafeFloorYAtX(px + charW * 0.5, groundY, activeArena, groundY, 320);
      if (supY !== null) {
        testAndPush(px, supY, px < (endScanX * 0.5) ? 1 : -1);
      }
    }
  }

  if (strictSafe.length > 0) {
    return strictSafe;
  }

  if (lowPenaltyFallback.length > 0) {
    lowPenaltyFallback.sort((a, b) => a.penalty - b.penalty);
    const minPen = lowPenaltyFallback[0].penalty;
    return lowPenaltyFallback.filter(item => item.penalty <= minPen + 50).map(item => item.spawn);
  }

  // Ostateczne awaryjne punkty na gwarantowanie bezpiecznym brzegu
  if (arenaKey === 'ARENA_3') {
    return [
      { x: 450, y: 1126, facing: 1 },
      { x: 3950, y: 1126, facing: -1 }
    ];
  }
  return [{ x: START_X - 60, y: groundY - charH - 2, facing: 1 }];
}
