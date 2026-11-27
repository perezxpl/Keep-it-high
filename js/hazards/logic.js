// =========================================================================
// HAZARDS/LOGIC.JS - FIZYKA, KOLIZJE, DETONACJA I CYKL ŻYCIA BECZEK
// Odpowiada za:
// - Ruch kinetyczny beczek, odbicia od platform i grawitację
// - Kopanie Spartan Kickiem [E] i wślizgiem
// - Obrażenia od pocisków i eksplozje obszarowe
// - Tworzenie kałuż żrącego kwasu i odradzanie po 35s
// =========================================================================

import { hazardsState, BARREL_CONFIG, BARREL_TYPES, ARENA_BARREL_SPAWNS, createBarrelInstance } from './state.js';
import { triggerScreenShake, spawnBloodSpurt, spawnBloodFountain, spawnHeadGib, carveGroundHole } from '../world.js';
import { ARENA_PLATFORMS, customObstacles, getPlatformSurfaceY, getPlatformBounds, getActiveArena, registerArenaResetCallback } from '../obstacles.js';
import {
  spawnShockwaveRing,
  spawnConcreteDebris,
  spawnRicochetSparks,
  spawnJuiceExplosion,
  spawnShrapnelStreak,
  spawnPowderSmoke,
  spawnDustCloud,
  ConcreteDebris,
  concreteDebrisList
} from '../particles.js';
import { spawnExplosionEffect } from '../projectiles.js';
import { resolveTorsoVestImpact } from '../weapons/armorBallistics.js';
import { addDynamicLight } from '../lighting/index.js';
import { triggerCombatFeedBanner } from '../ui/combatFeed.js';
import { getRiverbankGroundY } from '../arenas/arena3/state.js';
import { playSound } from '../audio/index.js';

/**
 * Rozrzuca rozerwane metalowe odłamki blachy zniszczonej beczki
 */
export function spawnBarrelShrapnel(x, y, barrelType = 'EXPLOSIVE') {
  if (concreteDebrisList.length > 30) {
    concreteDebrisList.splice(0, concreteDebrisList.length - 30);
  }
  const isToxic = (barrelType === 'TOXIC');
  const colors = isToxic
    ? ['#22c55e', '#16a34a', '#14532d', '#18181b', '#4ade80', '#27272a']
    : ['#ef4444', '#dc2626', '#991b1b', '#18181b', '#facc15', '#27272a'];

  for (let i = 0; i < 16; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 160 + Math.random() * 340;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - (60 + Math.random() * 140);
    const size = 5 + Math.random() * 6; // 5–11px metal shards
    const color = colors[Math.floor(Math.random() * colors.length)];
    const vRot = (Math.random() - 0.5) * 22;

    concreteDebrisList.push(new ConcreteDebris({
      x: x + (Math.random() - 0.5) * 16,
      y: y + (Math.random() - 0.5) * 16,
      vx,
      vy,
      angle: Math.random() * Math.PI * 2,
      vRot,
      size,
      color,
      bounces: 0,
      maxBounces: 2,
      life: 3.5
    }));
  }
}

/**
 * Oblicza wysokość podłoża lub platformy pod beczką
 */
export function getBarrelSurfaceY(x, y, baseGroundY, arenaKeyOverride = null) {
  const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
  const rawId = arenaKeyOverride || curArena?.id || (typeof window !== 'undefined' ? window.activeArenaId : 'arena-2');
  const arenaKey = String(rawId || 'arena-2').toLowerCase().replace(/_/g, '-');
  const isA5 = (arenaKey === 'arena-5' || arenaKey === 'prefab-tower');
  const isA4 = (arenaKey === 'arena-4' || arenaKey === 'armored-train');
  const isA3 = (arenaKey === 'arena-3' || arenaKey === 'arena-foundry');
  const isA2 = (arenaKey === 'arena-2' || arenaKey === 'arena-2-pandora' || arenaKey === 'arena-2-sector-x');

  let floor = Infinity;

  // 1. Podłoże naturalne
  if (isA3 && typeof getRiverbankGroundY === 'function') {
    if (x <= 1750 || x >= 2650) {
      const riverbankY = getRiverbankGroundY(x);
      if (typeof riverbankY === 'number' && !isNaN(riverbankY)) {
        floor = riverbankY;
      }
    } else {
      // Przestrzeń nad rzeką: dno rzeki to 1380
      floor = 1380;
    }
  } else if (!isA2 && !isA3 && !isA4 && !isA5) {
    const hasGround = (typeof window !== 'undefined' && typeof window.isGroundAt === 'function')
      ? (window.isGroundAt(x - 6, 2) || window.isGroundAt(x + 6, 2))
      : true;
    if (hasGround && baseGroundY < 1500) {
      floor = baseGroundY;
    }
  }

  // 2. Platformy areny i klocki
  const a5Plats = (typeof window !== 'undefined' && window.arena5State?.platforms) ? window.arena5State.platforms : null;
  const platformList = a5Plats ? [...ARENA_PLATFORMS, ...a5Plats] : ARENA_PLATFORMS;

  if (Array.isArray(platformList)) {
    for (const plat of platformList) {
      if (!plat || plat.destroyed || plat.isDestroyed || plat.intact === false || plat.isWall || plat.solid === false || plat.isPlatform === false || (plat.hp !== undefined && plat.hp <= 0)) continue;
      if (plat.isFalling || plat.isStilt || plat.isDecorative || plat.isRope || plat.type === 'stilt' || plat.type === 'rope') continue;
      if (!isA5 && (plat.isA5Block || plat.id === 'a5_base_floor')) continue;
      if (isA3 && (plat.id === 'ground_left' || plat.id === 'ground_right' || plat.id === 'riverbank_left_oval' || plat.id === 'riverbank_right_oval' || plat.id === 'world_boundary_left' || plat.id === 'world_boundary_right')) continue;

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
  }

  if (Array.isArray(customObstacles)) {
    for (const obs of customObstacles) {
      if (!obs || obs.destroyed || obs.isDestroyed || obs.intact === false || obs.solid === false || obs.isPlatform === false || (obs.hp !== undefined && obs.hp <= 0)) continue;
      const topY = obs.y !== undefined ? obs.y : (baseGroundY - obs.relY);
      if (x >= obs.x - 2 && x <= obs.x + obs.w + 2) {
        if (y <= topY + 18 && topY < floor) {
          floor = topY;
        }
      }
    }
  }

  return floor;
}

/**
 * Weryfikuje i oblicza poprawną wysokość podłoża do utworzenia nowej beczki.
 * Zasady:
 * - Pełne podparcie pod lewą krawędzią (x - W/2), środkiem (x) oraz prawą krawędzią (x + W/2)
 * - Różnica wysokości Math.abs(yLeft - yRight) <= 6 (zakaz wiszenia na krawędziach i stromiznach)
 * - Zakaz spawnowania na palach (stilts), linach, dekoracjach i zniszczonych segmentach (!intact)
 * - Na Arenie 3: CAŁKOWITY ZAKAZ spawnowania w strefie centralnej X: 1100..3300 (rampy, pale, pylony, most, rzeka)
 *   Beczki mogą pojawiać się wyłącznie na stałym, płaskim gruncie (X: 220..1100 oraz X: 3300..4180)
 */
export function getValidBarrelSpawnSurfaceY(midX, testY, groundY, arenaId) {
  const normArena = String(arenaId || '').toLowerCase().replace(/_/g, '-');
  const isA2 = (normArena === 'arena-2' || normArena === 'refinery');
  const isA3 = (normArena === 'arena-3' || normArena === 'arena-foundry');
  const isA4 = (normArena === 'arena-4' || normArena === 'obsidian-caldera');
  const isA5 = (normArena === 'arena-5' || normArena === 'prefab-tower');

  // 1. Twarda blokada strefy centralnej Areny 3 (rampy podejściowe, pale, pylony, most i rzeka)
  if (isA3) {
    if (midX > 750 && midX < 3650) {
      return null;
    }
    if (midX < 220 || midX > 4180) {
      return null;
    }
  }

  // Zapas na krawędzie: 18 px (szerokość beczki 26px, zapas 18px gwarantuje stabilne oparcie)
  const edgeSpan = 18;
  const xLeft = midX - edgeSpan;
  const xCenter = midX;
  const xRight = midX + edgeSpan;

  const yLeft = getBarrelSurfaceY(xLeft, testY, groundY, arenaId);
  const yCenter = getBarrelSurfaceY(xCenter, testY, groundY, arenaId);
  const yRight = getBarrelSurfaceY(xRight, testY, groundY, arenaId);

  // 2. Weryfikacja obecności stałego podłoża pod całą szerokością beczki
  if (yLeft === Infinity || yCenter === Infinity || yRight === Infinity) {
    return null;
  }

  // Odrzucanie stref śmiertelnych i niestabilnych
  if (isA2 && (yCenter >= 1400 || yLeft >= 1400 || yRight >= 1400)) {
    return null;
  }
  if (isA3 && (yCenter >= 1260 || yLeft >= 1260 || yRight >= 1260)) {
    return null;
  }
  if (isA4 && (yCenter >= 1340 || yLeft >= 1340 || yRight >= 1340)) {
    return null;
  }
  if (isA5 && (yCenter >= 1250 || yLeft >= 1250 || yRight >= 1250)) {
    return null;
  }

  // 3. Weryfikacja płaskiego podłoża pod całą szerokością beczki (max 5px różnicy wysokości)
  if (Math.abs(yLeft - yRight) > 5 || Math.abs(yCenter - yLeft) > 5 || Math.abs(yCenter - yRight) > 5) {
    return null;
  }

  // 4. Weryfikacja braku zniszczenia i zakazanych typów na platformie
  const a5Plats = (typeof window !== 'undefined' && window.arena5State?.platforms)
    ? window.arena5State.platforms
    : null;
  const platformList = a5Plats ? [...ARENA_PLATFORMS, ...a5Plats] : ARENA_PLATFORMS;

  if (Array.isArray(platformList)) {
    for (const plat of platformList) {
      if (!plat) continue;
      const bnds = (typeof getPlatformBounds === 'function') ? getPlatformBounds(plat) : { minX: plat.x, maxX: plat.x + (plat.w || 100) };
      if (midX >= bnds.minX - 4 && midX <= bnds.maxX + 4) {
        if (plat.destroyed || plat.isDestroyed || plat.intact === false || plat.solid === false || plat.isPlatform === false || (plat.hp !== undefined && plat.hp <= 0)) {
          if (Math.abs(yCenter - (plat.y || 0)) < 24) {
            return null;
          }
        }
        if (plat.isFalling || plat.isStilt || plat.isDecorative || plat.isRope || plat.type === 'stilt' || plat.type === 'rope') {
          return null;
        }
        if (isA3 && (plat.isRampBlock || plat.isBridgeBlock || plat.isCanopyBlock || plat.id?.includes('bridge') || plat.id?.includes('ramp') || plat.id?.includes('pylon'))) {
          return null;
        }
      }
    }
  }

  return yCenter;
}

/**
 * Wyznacza lewą i prawą granicę ciągłego podłoża pod plamą kwasu.
 * Obsługuje platformy, segmenty modułowe oraz grunt naturalny i kratery.
 */
export function getAcidPoolSupportBounds(centerX, surfaceY, maxRadius, groundY, arenaKey) {
  let supportLeftX = centerX - maxRadius;
  let supportRightX = centerX + maxRadius;

  const normKey = String(arenaKey || '').toLowerCase().replace(/_/g, '-');
  const isA3 = (normKey === 'arena-3' || normKey === 'arena-foundry');
  const isA5 = (normKey === 'arena-5' || normKey === 'prefab-tower');

  const a5Plats = (typeof window !== 'undefined' && window.arena5State?.platforms) ? window.arena5State.platforms : null;
  const platformList = a5Plats ? [...ARENA_PLATFORMS, ...a5Plats] : ARENA_PLATFORMS;

  let matchedPlatform = null;
  if (Array.isArray(platformList)) {
    for (const plat of platformList) {
      if (!plat || plat.destroyed || plat.isDestroyed || plat.intact === false || plat.solid === false || plat.isPlatform === false || (plat.hp !== undefined && plat.hp <= 0)) continue;
      if (plat.isFalling || plat.isStilt || plat.isDecorative || plat.isRope || plat.type === 'stilt' || plat.type === 'rope') continue;
      if (!isA5 && (plat.isA5Block || plat.id === 'a5_base_floor')) continue;
      if (isA3 && (plat.id === 'ground_left' || plat.id === 'ground_right' || plat.id === 'riverbank_left_oval' || plat.id === 'riverbank_right_oval' || plat.id === 'world_boundary_left' || plat.id === 'world_boundary_right')) continue;
      const bnds = (typeof getPlatformBounds === 'function') ? getPlatformBounds(plat) : { minX: plat.x, maxX: plat.x + (plat.w || 100) };
      if (centerX >= bnds.minX - 4 && centerX <= bnds.maxX + 4) {
        let topY;
        if (plat.surfacePoints && typeof getPlatformSurfaceY === 'function') {
          topY = getPlatformSurfaceY(plat, centerX, groundY);
        } else if (plat.y !== undefined) {
          topY = plat.y;
        } else {
          topY = groundY - (plat.relY || 0);
        }
        if (Math.abs(surfaceY - topY) <= 12) {
          matchedPlatform = plat;
          break;
        }
      }
    }
  }

  if (matchedPlatform) {
    // Kałuża na platformie: wyznacz ciągłą lewą i prawą krawędź
    const bnds = (typeof getPlatformBounds === 'function') ? getPlatformBounds(matchedPlatform) : { minX: matchedPlatform.x, maxX: matchedPlatform.x + (matchedPlatform.w || 100) };
    let leftLimit = bnds.minX;
    let rightLimit = bnds.maxX;

    // Rozszerzenie na sąsiednie nienaruszone segmenty na tej samej wysokości
    let expanded = true;
    let iter = 0;
    while (expanded && iter < 10) {
      expanded = false;
      iter++;
      for (const other of platformList) {
        if (!other || other === matchedPlatform || other.destroyed || other.isDestroyed || other.intact === false || other.solid === false || other.isPlatform === false || (other.hp !== undefined && other.hp <= 0)) continue;
        if (other.isFalling || other.isStilt || other.isDecorative || other.isRope || other.type === 'stilt' || other.type === 'rope') continue;
        if (other.type === 'metal_ramp_left' || other.type === 'metal_ramp_right' || other.isSlope || other.isRamp || other.isRampBlock) continue;
        if (!isA5 && (other.isA5Block || other.id === 'a5_base_floor')) continue;
        if (isA3 && (other.id === 'ground_left' || other.id === 'ground_right' || other.id === 'riverbank_left_oval' || other.id === 'riverbank_right_oval' || other.id === 'world_boundary_left' || other.id === 'world_boundary_right')) continue;
        const oBnds = (typeof getPlatformBounds === 'function') ? getPlatformBounds(other) : { minX: other.x, maxX: other.x + (other.w || 100) };
        const oY = (other.y !== undefined) ? other.y : (groundY - (other.relY || 0));
        if (Math.abs(surfaceY - oY) <= 8) {
          if (oBnds.maxX >= leftLimit - 6 && oBnds.minX < leftLimit) {
            leftLimit = oBnds.minX;
            expanded = true;
          }
          if (oBnds.minX <= rightLimit + 6 && oBnds.maxX > rightLimit) {
            rightLimit = oBnds.maxX;
            expanded = true;
          }
        }
      }
    }
    supportLeftX = leftLimit;
    supportRightX = rightLimit;
  } else {
    // Kałuża na terenie naturalnym (grunt stały, skarpa rzeczna, krater)
    const step = 8;
    let prevY = surfaceY;
    let curLeft = centerX;
    for (let x = centerX - step; x >= centerX - maxRadius - 16; x -= step) {
      const sampleY = Math.min(surfaceY, prevY) - 12;
      const yVal = getBarrelSurfaceY(x, sampleY, groundY, arenaKey);
      const inRiver = (arenaKey === 'arena-3' && yVal >= 1280);
      const inLava = (arenaKey === 'arena-4' && yVal >= 1390);
      const inAcid = (arenaKey === 'arena-2' && yVal >= 1420);
      if (yVal === Infinity || inRiver || inLava || inAcid || Math.abs(yVal - prevY) > 22) {
        curLeft = x + step;
        break;
      }
      prevY = yVal;
      curLeft = x;
    }

    prevY = surfaceY;
    let curRight = centerX;
    for (let x = centerX + step; x <= centerX + maxRadius + 16; x += step) {
      const sampleY = Math.min(surfaceY, prevY) - 12;
      const yVal = getBarrelSurfaceY(x, sampleY, groundY, arenaKey);
      const inRiver = (arenaKey === 'arena-3' && yVal >= 1280);
      const inLava = (arenaKey === 'arena-4' && yVal >= 1390);
      const inAcid = (arenaKey === 'arena-2' && yVal >= 1420);
      if (yVal === Infinity || inRiver || inLava || inAcid || Math.abs(yVal - prevY) > 22) {
        curRight = x - step;
        break;
      }
      prevY = yVal;
      curRight = x;
    }

    supportLeftX = curLeft;
    supportRightX = curRight;
  }

  return { supportLeftX, supportRightX };
}

/**
 * Dopasowuje kałużę kwasu do geometrii terenu:
 * 1. Przycinanie do granic ciągłego podłoża (supportLeftX, supportRightX)
 * 2. Anulowanie kałuży jeśli dostępna szerokość < 28px (radius < 14)
 * 3. Próbkowanie lewej, środkowej i prawej wysokości (yLeft, yMid, yRight)
 * 4. Obliczanie kąta nachylenia: pool.angle = Math.atan2(yRight - yLeft, pool.radius * 2)
 * 5. Wyrównanie wysokości pool.y = (yLeft + yRight) * 0.5 (lub w dnie krateru)
 * Zwraca false jeśli kałuża powinna zostać usunięta / anulowana.
 */
export function fitAcidPoolToTerrain(pool, groundY, arenaKey) {
  if (!pool) return false;

  const maxR = pool.baseRadius || pool.maxRadius || pool.radius || 65;
  pool.baseRadius = maxR;

  // Sprawdzamy najpierw czy grunt pod kałużą się obniżył (np. wycięty krater lub zapadnięcie platformy)
  const centerFloor = getBarrelSurfaceY(pool.x, pool.y - 12, groundY, arenaKey);
  if (centerFloor !== Infinity && centerFloor > pool.y + 4) {
    pool.y = centerFloor;
  }

  // 1. Wyznaczenie granic ciągłego podłoża
  const { supportLeftX, supportRightX } = getAcidPoolSupportBounds(pool.x, pool.y, maxR, groundY, arenaKey);

  // Przycinamy zakres [pool.x - maxR, pool.x + maxR] do granic [supportLeftX + 4, supportRightX - 4]
  const clampedLeft = Math.max(pool.x - maxR, supportLeftX + 4);
  const clampedRight = Math.min(pool.x + maxR, supportRightX - 4);
  const clampedWidth = clampedRight - clampedLeft;

  if (clampedWidth < 28) {
    // Dostępna szerokość zbyt mała (promień < 14) -> usunięcie kałuży
    return false;
  }

  pool.radius = clampedWidth * 0.5;
  pool.x = clampedLeft + pool.radius;

  // 2. Próbkowanie wysokości podłoża na lewym skraju, w środku i na prawym skraju
  const xLeft = pool.x - pool.radius;
  const xMid = pool.x;
  const xRight = pool.x + pool.radius;

  const sampleY = pool.y - 12;
  const yLeft = getBarrelSurfaceY(xLeft, sampleY, groundY, arenaKey);
  const yMid = getBarrelSurfaceY(xMid, sampleY, groundY, arenaKey);
  const yRight = getBarrelSurfaceY(xRight, sampleY, groundY, arenaKey);

  const inRiver = (arenaKey === 'arena-3' && (yLeft >= 1280 || yRight >= 1280 || yMid >= 1280));
  const inLava = (arenaKey === 'arena-4' && (yLeft >= 1390 || yRight >= 1390 || yMid >= 1390));
  const inAcid = (arenaKey === 'arena-2' && (yLeft >= 1420 || yRight >= 1420 || yMid >= 1420));

  if (yLeft === Infinity || yRight === Infinity || yMid === Infinity || inRiver || inLava || inAcid) {
    return false;
  }

  // 3. Obliczenie kąta nachylenia podłoża i dopasowanie wysokości
  const deltaY = yRight - yLeft;
  const deltaX = pool.radius * 2;
  pool.angle = Math.atan2(deltaY, deltaX);

  // Wyrównanie wysokości do powierzchni terenu (z uwzględnieniem zagłębienia w misie krateru)
  const avgY = (yLeft + yRight) * 0.5;
  pool.y = Math.abs(yMid - avgY) > 2 ? (yMid * 0.6 + avgY * 0.4) : avgY;

  return true;
}

/**
 * Sprawdza i rozwiazuje kolizje beczki ze scianami pionowymi, monolitami, filarami i klockami Areny 5
 * Przy uderzeniu z duza predkoscia (>= 7.5) detonuje beczke.
 * Przy nizszej predkosci odbija beczke z utrata energii.
 */
export function resolveBarrelWallCollisions(b, groundY, combatants = []) {
  if (!b || b.isDead) return false;

  const bLeft = b.x;
  const bRight = b.x + b.w;
  const bTop = b.y;
  const bBottom = b.y + b.h;
  const bMidX = b.x + b.w * 0.5;

  // 1. Sprawdzanie platform ARENA_PLATFORMS i a5Plats
  const a5Plats = (typeof window !== 'undefined' && window.arena5State?.platforms) ? window.arena5State.platforms : null;
  const platformList = a5Plats ? [...ARENA_PLATFORMS, ...a5Plats] : ARENA_PLATFORMS;

  for (let i = 0; i < platformList.length; i++) {
    const plat = platformList[i];
    if (!plat || plat.destroyed || plat.isDestroyed || plat.intact === false || plat.solid === false || (plat.hp !== undefined && plat.hp <= 0)) continue;
    if (plat.isDropThrough || plat.dropThrough || plat.type === 'catwalk' || plat.isSlope || plat.oneWay === true) continue;
    if (plat.isFalling || plat.isStilt || plat.isDecorative || plat.isRope || plat.type === 'stilt' || plat.type === 'rope' || plat.isRampBlock || plat.isBridgeBlock) continue;
    if (plat.type === 'metal_ramp_left' || plat.type === 'metal_ramp_right' || plat.isRamp) continue;

    const curArenaKey = (typeof getActiveArena === 'function') ? getActiveArena()?.id : null;
    const isA3 = (curArenaKey === 'arena-3' || curArenaKey === 'arena-foundry');
    if (isA3 && (plat.id === 'ground_left' || plat.id === 'ground_right' || plat.id === 'riverbank_left_oval' || plat.id === 'riverbank_right_oval' || plat.id === 'world_boundary_left' || plat.id === 'world_boundary_right')) continue;

    const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
    const platThick = plat.thickness || plat.h || (plat.isMonolith ? 470 : 30);
    if (platThick <= 16 && !plat.isWall && !plat.isMonolith) continue;

    const bottomY = topY + platThick;

    // Czy beczka nachodzi pionowo na sciane boczna platformy?
    if (bBottom > topY + 6 && bTop < bottomY - 4) {
      const bnds = (typeof getPlatformBounds === 'function') ? getPlatformBounds(plat) : { minX: plat.x, maxX: plat.x + (plat.w || 100) };
      if (bRight > bnds.minX && bLeft < bnds.maxX) {
        const midX = (bnds.minX + bnds.maxX) * 0.5;
        const impactSpeed = Math.abs(b.vx);

        if (impactSpeed >= 7.5) {
          detonateBarrel(b, combatants, groundY);
          return true;
        }

        if (bMidX < midX) {
          b.x = bnds.minX - b.w;
          b.vx = -Math.abs(b.vx) * BARREL_CONFIG.BOUNCE_RESTITUTION;
          b.rotVel = -b.rotVel * 0.5;
          if (impactSpeed > 1.2) {
            spawnRicochetSparks(b.x + b.w, b.y + b.h * 0.5, -2, -1, 4);
          }
        } else {
          b.x = bnds.maxX;
          b.vx = Math.abs(b.vx) * BARREL_CONFIG.BOUNCE_RESTITUTION;
          b.rotVel = -b.rotVel * 0.5;
          if (impactSpeed > 1.2) {
            spawnRicochetSparks(b.x, b.y + b.h * 0.5, 2, -1, 4);
          }
        }
      }
    }
  }

  // 2. Przeszkody customObstacles (bunkry, filary, sciany)
  if (Array.isArray(customObstacles)) {
    for (let i = 0; i < customObstacles.length; i++) {
      const obs = customObstacles[i];
      if (!obs || obs.destroyed || obs.isDestroyed || obs.intact === false || obs.solid === false || (obs.hp !== undefined && obs.hp <= 0)) continue;
      if (obs.type === 'hedgehog' || obs.type === 'barbed_wire' || obs.type === 'laser_gate') continue;

      const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
      const bottomY = topY + (obs.h || 40);

      if (bBottom > topY + 6 && bTop < bottomY - 4) {
        if (bRight > obs.x && bLeft < obs.x + obs.w) {
          const midX = obs.x + obs.w * 0.5;
          const impactSpeed = Math.abs(b.vx);

          if (impactSpeed >= 7.5) {
            detonateBarrel(b, combatants, groundY);
            return true;
          }

          if (bMidX < midX) {
            b.x = obs.x - b.w;
            b.vx = -Math.abs(b.vx) * BARREL_CONFIG.BOUNCE_RESTITUTION;
            b.rotVel = -b.rotVel * 0.5;
            if (impactSpeed > 1.2) {
              spawnRicochetSparks(b.x + b.w, b.y + b.h * 0.5, -2, -1, 4);
            }
          } else {
            b.x = obs.x + obs.w;
            b.vx = Math.abs(b.vx) * BARREL_CONFIG.BOUNCE_RESTITUTION;
            b.rotVel = -b.rotVel * 0.5;
            if (impactSpeed > 1.2) {
              spawnRicochetSparks(b.x, b.y + b.h * 0.5, 2, -1, 4);
            }
          }
        }
      }
    }
  }

  // 3. Klocki wiezy Areny 5 (100x100)
  const a5 = (typeof window !== 'undefined' && window.arena5State?.gridRows) ? window.arena5State : null;
  if (a5) {
    const colLeft = Math.max(0, Math.floor((b.x - 20) / 100));
    const colRight = Math.min(9, Math.floor((b.x + b.w + 20) / 100));
    const minR = a5.minFloorRow || 0;

    for (let c = colLeft; c <= colRight; c++) {
      for (let r = minR; r < minR + 15; r++) {
        const row = a5.gridRows.get(r);
        const cell = row ? row[c] : null;
        if (cell && cell.hp > 0 && !cell.isFalling) {
          const cellTop = cell.y;
          const cellBottom = cell.y + 100;
          const cellLeft = cell.x;
          const cellRight = cell.x + 100;

          if (bRight > cellLeft && bLeft < cellRight && bBottom > cellTop + 8 && bTop < cellBottom - 8) {
            const midX = cellLeft + 50;
            const impactSpeed = Math.abs(b.vx);

            if (impactSpeed >= 7.5) {
              detonateBarrel(b, combatants, groundY);
              return true;
            }

            if (bMidX < midX) {
              b.x = cellLeft - b.w;
              b.vx = -Math.abs(b.vx) * BARREL_CONFIG.BOUNCE_RESTITUTION;
              b.rotVel = -b.rotVel * 0.5;
              if (impactSpeed > 1.2) {
                spawnRicochetSparks(b.x + b.w, b.y + b.h * 0.5, -2, -1, 4);
              }
            } else {
              b.x = cellRight;
              b.vx = Math.abs(b.vx) * BARREL_CONFIG.BOUNCE_RESTITUTION;
              b.rotVel = -b.rotVel * 0.5;
              if (impactSpeed > 1.2) {
                spawnRicochetSparks(b.x, b.y + b.h * 0.5, 2, -1, 4);
              }
            }
          }
        }
      }
    }
  }

  return false;
}

/**
 * Inicjalizuje beczki dla aktywnej areny
 * Na początku każdego meczu/rundy jednorazowo generuje losowe rozstawienie 4–5 beczek
 * (na Arenie 5: 3–4 sztuki). Całkowity brak okresowych zrzutów z powietrza w trakcie meczu.
 */
export function initHazardsForArena(arenaId, groundY = 800) {
  if (!arenaId) return;
  const normalizedId = String(arenaId).toLowerCase().replace(/_/g, '-');
  if (hazardsState.currentArenaId === normalizedId && hazardsState.barrels.length > 0) return;

  hazardsState.currentArenaId = normalizedId;
  hazardsState.barrels.length = 0;
  hazardsState.acidPools.length = 0;
  hazardsState.airdropTimer = 0;

  const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
  const isA2 = (normalizedId === 'arena-2' || normalizedId === 'refinery');
  const isA3 = (normalizedId === 'arena-3' || normalizedId === 'arena-foundry');
  const isA4 = (normalizedId === 'arena-4' || normalizedId === 'obsidian-caldera');
  const isA5 = (normalizedId === 'arena-5' || normalizedId === 'prefab-tower');

  const targetCount = isA5
    ? (3 + (Math.random() < 0.5 ? 1 : 0))
    : (4 + (Math.random() < 0.5 ? 1 : 0));

  let minX, maxX;
  if (isA5) {
    const a5St = (typeof window !== 'undefined' && window.arena5State) ? window.arena5State : null;
    const sLeft = a5St?.shaftLeft ?? 0;
    const sRight = a5St?.shaftRight ?? 1000;
    minX = sLeft + 80;
    maxX = sRight - 80;
  } else {
    minX = (curArena?.bounds?.minX ?? 0) + 180;
    maxX = (curArena?.bounds?.maxX ?? curArena?.width ?? 3800) - 180;
  }

  const spawns = curArena?.spawns || [];

  for (let attempt = 0; attempt < 250 && hazardsState.barrels.length < targetCount; attempt++) {
    const candX = minX + Math.random() * (maxX - minX);

    // Próbkowanie z różnych wysokości areny: górne platformy, średnie pomosty oraz podłoże
    let testY;
    if (isA5) {
      testY = (Math.random() < 0.5 ? 400 : 900);
    } else if (isA4) {
      testY = Math.random() < 0.35 ? 180 : (Math.random() < 0.70 ? 550 : 850);
    } else {
      testY = Math.random() < 0.5 ? 200 : (groundY - 220);
    }

    const surfaceY = getValidBarrelSpawnSurfaceY(candX, testY, groundY, normalizedId);
    if (surfaceY === null || surfaceY === Infinity || surfaceY > 1320) continue;

    // 1. Dystans min 220px do innych aktywnych beczek (na Arenie 5 z racji szerokości szybu: 180px)
    const minDist = isA5 ? 180 : 220;
    let tooClose = false;
    for (const b of hazardsState.barrels) {
      if (Math.hypot((b.x + b.w * 0.5) - candX, (b.y + b.h) - surfaceY) < minDist) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    // 2. Dystans min 85px od punktów spawnu graczy (brak spawnu w ciele postaci)
    if (Array.isArray(spawns)) {
      for (const sp of spawns) {
        if (!sp) continue;
        const sx = sp.x !== undefined ? sp.x : (Array.isArray(sp) ? sp[0] : null);
        const sy = sp.y !== undefined ? sp.y : (Array.isArray(sp) ? sp[1] : null);
        if (typeof sx === 'number' && typeof sy === 'number') {
          if (Math.hypot(sx - candX, sy - surfaceY) < 85) {
            tooClose = true;
            break;
          }
        }
      }
    }
    if (tooClose) continue;

    // 3. Typ beczki:
    let barrelType = 'EXPLOSIVE';
    if (isA2) {
      barrelType = Math.random() < 0.50 ? 'TOXIC' : 'EXPLOSIVE';
    } else {
      const roll = Math.random();
      barrelType = roll < 0.60 ? 'EXPLOSIVE' : (roll < 0.85 ? 'TOXIC' : 'ORDNANCE');
    }

    const inst = createBarrelInstance({
      type: barrelType,
      x: candX - BARREL_CONFIG.WIDTH * 0.5,
      y: surfaceY - BARREL_CONFIG.HEIGHT,
      id: `barrel_${normalizedId}_${hazardsState.barrels.length}_${Math.floor(Math.random() * 10000)}`
    });

    inst.x = candX - inst.w * 0.5;
    inst.y = surfaceY - inst.h;
    inst.onGround = true;
    inst.vx = 0;
    inst.vy = 0;
    hazardsState.barrels.push(inst);
  }
}

/**
 * Kopie beczkę Spartan Kickiem [E] / [PPM] / [Spacja]
 */
export function kickBarrel(barrel, kicker) {
  if (!barrel || barrel.isDead) return false;

  const facing = kicker?.facing || 1;
  const kickVx = facing * BARREL_CONFIG.KICK_IMPULSE_X;
  const kickVy = BARREL_CONFIG.KICK_IMPULSE_Y;

  barrel.vx = kickVx;
  barrel.vy = kickVy;
  barrel.rotVel = facing * 0.24;
  barrel.onGround = false;
  barrel.lastAttacker = kicker;
  barrel.kickerGraceTimer = 0.20;
  barrel.isKicked = true;

  triggerScreenShake(10.0);
  spawnRicochetSparks(barrel.x + barrel.w / 2, barrel.y + barrel.h / 2, kickVx * 0.4, kickVy * 0.4, 8);
  return true;
}

/**
 * Zadaje obrażenia beczce od pocisku lub eksplozji
 */
export function damageBarrel(barrel, dmg, attacker = null, bulletVx = 0, bulletVy = 0) {
  if (!barrel || barrel.isDead) return;

  barrel.hp -= dmg;
  if (attacker) barrel.lastAttacker = attacker;

  // Przekazanie pędu kinetycznego od kuli
  barrel.vx += (bulletVx || 0) * 0.04;
  barrel.vy += (bulletVy || 0) * 0.04;

  spawnRicochetSparks(barrel.x + barrel.w / 2, barrel.y + barrel.h / 2, (Math.random() - 0.5) * 4, -2, 4);

  // Gdy życie spadnie do 0 -> krótkie syczenie i wybuch
  if (barrel.hp <= 0 && barrel.fuseTimer <= 0) {
    barrel.fuseTimer = 0.07; // 70ms kinowego syczenia dymu przed wielkim wybuchem
  }
}

/**
 * Podpala beczkę (ogień z miotacza, Mołotowa lub pożogi powierzchniowej)
 */
export function igniteBarrel(barrel, attacker = null, durationSec = 2.0) {
  if (!barrel || barrel.isDead) return;
  barrel.burnTimer = Math.max(barrel.burnTimer || 0, durationSec);
  if (attacker) {
    barrel.burnAttacker = attacker;
    barrel.lastAttacker = attacker;
  }
}

/**
 * Wykonuje potężną detonację beczki i zadaje obrażenia obszarowe
 */
export function detonateBarrel(barrel, combatants = [], groundY = 800, options = {}) {
  if (!barrel || barrel.isDead) return;
  barrel.isDead = true;

  const bx = barrel.x + barrel.w * 0.5;
  const by = barrel.y + barrel.h * 0.5;
  const typeDef = barrel.typeDef || BARREL_TYPES.EXPLOSIVE;
  const isToxic = (barrel.type === 'TOXIC');

  playSound(isToxic ? 'explosion_toxic' : 'explosion_heavy', { x: bx, y: by });

  // 1. Spektakularne efekty audiowizualne wybuchu (Kinowa eksplozja, Game Juice, kula ognia, błysk, szrapnel)
  triggerScreenShake(typeDef.screenShake || 20);

  // A. Kula ognia i intensywny biały błysk (ExplosionEffect z radialnym gradientem, błyskiem 2 klatek i ekspansją)
  spawnExplosionEffect(bx, by, typeDef.radius, { isToxic });

  // B. Kinowy zestaw cząsteczek Game Juice:
  // - 1x ShockwaveRing (fala uderzeniowa)
  // - 12x ExplosionFirePuff (nakładające się kule ognia zlewające się w rozżarzone biało-żółte jądro)
  // - 24x StretchedSparks (rozciągane linie żaru)
  // - 10x HeavySmokePuff (ciemne kłęby dymu wybuchu w tle)
  spawnJuiceExplosion(bx, by);

  // C. Naddźwiękowe smugi szrapnela (1400–1800 px/s)
  spawnShrapnelStreak(bx, by, 18);

  // D. Kłęby dymu prochowego i obłok pyłu podmuchowego
  spawnPowderSmoke(bx, by, 10);
  spawnDustCloud(bx, by, 12);

  // G. Wyrwa w podłożu i reakcja unikalnych elementów aktywnej areny (najpierw wycinamy krater, aby odłamki lądowały na rzeczywistej powierzchni!)
  if (typeof carveGroundHole === 'function') {
    carveGroundHole(bx, by, 32);
  }
  const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
  if (curArena && typeof curArena.onExplosion === 'function') {
    curArena.onExplosion(bx, by, typeDef.radius);
  }

  // E. Rozerwane, wirujące metalowe odłamki blachy beczki oraz gruz zniszczonego terenu
  spawnBarrelShrapnel(bx, by, barrel.type);
  spawnConcreteDebris(bx, by, 10);

  // F. Dynamiczne rozświetlenie sceny oświetleniem 2D
  addDynamicLight({
    x: bx,
    y: by,
    radius: isToxic ? 440 : 540,
    color: isToxic ? '#22c55e' : '#ff7700',
    intensity: 1.0,
    duration: 0.40,
    expand: true
  });

  // 2. Zadanie obrażeń i odrzut wszystkim jednostkom w promieniu eksplozji
  const targets = Array.isArray(combatants) ? combatants : [];
  for (const c of targets) {
    if (!c) continue;

    const cx = c.x + (c.w || 24) * 0.5;
    const cy = c.y + (c.h || 70) * 0.5;
    const dx = cx - bx;
    const dy = cy - by;
    const dist = Math.hypot(dx, dy);

    if (dist <= typeDef.radius) {
      const factor = Math.max(0.2, 1.0 - (dist / typeDef.radius));
      let dmg = Math.round(typeDef.maxDamage * factor);

      if (c.isJuggernaut) {
        dmg = resolveTorsoVestImpact({
          target: c,
          totalDamage: dmg,
          forceArmorAbsorb: true,
          hitPtX: cx,
          hitPtY: cy,
          vx: ((dx / (dist || 1)) * 5),
          vy: -3
        }).totalDamage;
      }

      c.hp = Math.max(0, (c.hp !== undefined ? c.hp : 100) - dmg);
      c.lastAttacker = barrel.lastAttacker || c.lastAttacker;

      // Impuls odrzutu fali uderzeniowej
      const normX = dist > 0.01 ? (dx / dist) : (Math.random() - 0.5);
      const normY = dist > 0.01 ? (dy / dist) : -1;
      const push = typeDef.knockbackForce * factor;

      c.vx = (c.vx || 0) + normX * push;
      c.vy = Math.min((c.vy || 0), -4.5 * factor);
      c.onGround = false;

      // Trafienie zombie
      if (c.isZombie) {
        if (factor > 0.45 || c.hp <= 0) {
          // Bezpośrednie trafienie falą uderzeniową dekapituje zombie!
          c.isDead = true;
          c.hasHead = false;
          c.decapitated = true;
          c.severedHead = null;
          c.reviveTimer = 0;
          c.decayTimer = 0; // Naturalny rozkład przez 14s (ciało leci z falą wybuchu)
          c.deathImpulse = {
            vx: normX * 12.0 * factor,
            vy: -6.5 * factor
          };
          c.vx = normX * 12.0 * factor;
          c.vy = -6.5 * factor;
          c.onGround = false;
          spawnHeadGib(cx, cy - 10, normX * 8, -6, c.facing || 1, c.visuals);
          spawnBloodFountain(cx, cy, c.facing || 1, 6);
        } else {
          c.hp = 0;
          c.isDead = true;
          c.reviveTimer = 4.0; // Powalenie
          c.deathImpulse = {
            vx: normX * 9.0 * factor,
            vy: -4.5 * factor
          };
          c.vx = normX * 9.0 * factor;
          c.vy = -4.5 * factor;
          c.onGround = false;
        }
      } else if (c.hp <= 0 && !c.isDead) {
        // Zgon gracza lub bota od wybuchu
        c.isDead = true;
        c.killer = barrel.lastAttacker || { name: typeDef.name, cause: 'WYBUCH BECZKI', isHazard: true };
        c.killerBulletId = null;
        c.killedByHeadshot = false;
        c.respawnTimer = 180;
        c.bleedTimer = 90;
        c.ragdoll = null;
        c.deathImpulse = {
          vx: normX * 12.0 * factor,
          vy: -6.5 * factor
        };
        spawnBloodSpurt(cx, cy, normX * 3, -2, 22, 1.5);
      }

      // Impuls kinetyczny i hitstun dla żywego zombie który przetrwał wybuch
      if (c.isZombie && !c.isDead) {
        c.knockbackVx = normX * push;
        c.hitStunTimer = 0.40;
        c.onGround = false;
      }
    }
  }

  // 3. Reakcja łańcuchowa: detonacja sąsiednich beczek w pobliżu
  for (const other of hazardsState.barrels) {
    if (!other || other === barrel || other.isDead) continue;
    const obx = other.x + other.w * 0.5;
    const oby = other.y + other.h * 0.5;
    const d = Math.hypot(obx - bx, oby - by);
    if (d <= typeDef.radius + 15) {
      damageBarrel(other, 999, barrel.lastAttacker);
    }
  }

  // 4. Obsługa zniszczenia klocków w Arenie 5 (Tetris)
  if (typeof window !== 'undefined' && window.arena5State) {
    const handleA5Exp = (typeof window.handleArena5Explosion === 'function') ? window.handleArena5Explosion : null;
    if (typeof handleA5Exp === 'function') {
      handleA5Exp(bx, by, typeDef.radius * 1.1);
    }
  }

  // 5. Dla beczek kwasowych: utworzenie kałuży kwasu na podłożu
  if (isToxic) {
    const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
    const rawId = curArena?.id || (typeof window !== 'undefined' ? window.activeArenaId : 'arena-2');
    const arenaKey = String(rawId || 'arena-2').toLowerCase().replace(/_/g, '-');
    const surfaceY = getBarrelSurfaceY(bx, by, groundY);
    const inRiverA3 = (arenaKey === 'arena-3' && surfaceY >= 1280);
    const inLavaA4 = (arenaKey === 'arena-4' && surfaceY >= 1390);
    const inAcidLakeA2 = (arenaKey === 'arena-2' && surfaceY >= 1420);

    if (surfaceY !== Infinity && !inRiverA3 && !inLavaA4 && !inAcidLakeA2) {
      const baseR = typeDef.poolRadius || 65;
      const pool = {
        x: bx,
        y: surfaceY,
        radius: baseR,
        baseRadius: baseR,
        angle: 0,
        timer: typeDef.poolDuration || 8.0,
        maxTimer: typeDef.poolDuration || 8.0,
        dps: typeDef.poolDps || 14.0,
        bubbleAnim: 0
      };

      if (fitAcidPoolToTerrain(pool, groundY, arenaKey)) {
        hazardsState.acidPools.push(pool);
      }
    }
  }

  // Usunięcie beczki z listy aktywnych
  const idx = hazardsState.barrels.indexOf(barrel);
  if (idx !== -1) {
    hazardsState.barrels.splice(idx, 1);
  }

  triggerCombatFeedBanner('KILL', `[DETONACJA] ${typeDef.name.toUpperCase()} EKSPLODOWAŁA!`);
}

/**
 * Główna pętla aktualizacji fizyki beczek, kałuż kwasu i odradzania
 */
export function updateHazards(dt, combatants = [], groundY = 800) {
  const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
  const rawArenaId = curArena?.id || (typeof window !== 'undefined' ? window.activeArenaId : 'arena-2');
  const arenaId = String(rawArenaId || 'arena-2').toLowerCase().replace(/_/g, '-');

  // Automatyczna inicjalizacja przy zmianie areny
  if (hazardsState.currentArenaId !== arenaId) {
    initHazardsForArena(arenaId, groundY);
  }

  // -------------------------------------------------------------------------
  // 1. PĘTLA BECZEK
  // -------------------------------------------------------------------------
  for (let i = hazardsState.barrels.length - 1; i >= 0; i--) {
    const b = hazardsState.barrels[i];

    // Czas ochronny dla kopiącego gracza
    if (b.kickerGraceTimer > 0) {
      b.kickerGraceTimer -= dt;
    }

    // Podpalenie beczki ogniem: cykliczne obrażenia termiczne prowadzące do detonacji
    if (b.burnTimer > 0) {
      b.burnTimer -= dt;
      b.burnTickAccum = (b.burnTickAccum || 0) + dt;
      if (b.burnTickAccum >= 0.22) {
        b.burnTickAccum -= 0.22;
        damageBarrel(b, 5, b.burnAttacker || b.lastAttacker, 0, 0);
      }
      if (b.burnTimer <= 0) {
        b.burnTimer = 0;
        b.burnTickAccum = 0;
      }
    }

    // Detonacja po upływie fuseTimer
    if (b.fuseTimer > 0) {
      b.fuseTimer -= dt;
      if (b.fuseTimer <= 0) {
        detonateBarrel(b, combatants, groundY);
        continue;
      }
    }

    const leftX = b.x + 3;
    const rightX = b.x + b.w - 3;
    const midX = b.x + b.w * 0.5;
    const feetY = b.y + b.h;

    const surfaceLeftY = getBarrelSurfaceY(leftX, feetY, groundY);
    const surfaceMidY = getBarrelSurfaceY(midX, feetY, groundY);
    const surfaceRightY = getBarrelSurfaceY(rightX, feetY, groundY);

    // Dynamiczne podłoże: weryfikacja stabilnego podparcia pod stojącą beczką
    if (b.onGround) {
      const curMinSurfaceY = Math.min(surfaceLeftY, surfaceMidY, surfaceRightY);
      const curMaxSurfaceY = Math.max(surfaceLeftY, surfaceMidY, surfaceRightY);

      // Na pochyłej rampie różnica wysokości obu krawędzi wynosi 3-22 px, ale obie strony mają oparcie
      const isRampSlope = (surfaceLeftY !== Infinity && surfaceRightY !== Infinity && Math.abs(surfaceLeftY - surfaceRightY) > 3 && Math.abs(surfaceLeftY - surfaceRightY) <= 22 && Math.abs(surfaceMidY - feetY) <= 8);

      const lostGround = !isRampSlope && (
        surfaceLeftY === Infinity ||
        surfaceMidY === Infinity ||
        surfaceRightY === Infinity ||
        curMinSurfaceY > feetY + 6 ||
        (curMaxSurfaceY - curMinSurfaceY > 16)
      );

      if (lostGround) {
        // Podłoże zapadło się w krater, platforma runęła lub krawędź odpadła: natychmiastowe spadanie!
        b.onGround = false;
        b.vy = Math.max(b.vy, 1.0);
      } else if (isRampSlope) {
        // Płynne staczanie się po rampie w dół stoku (większe Y w Canvasie = niżej)
        const slopeDir = (surfaceLeftY > surfaceRightY) ? -1 : 1;
        b.vx += slopeDir * 0.35;
        b.rotVel += slopeDir * 0.02;
        b.y = surfaceMidY - b.h;
        b.vy = 0;
      } else if (surfaceMidY < feetY - 4) {
        // Teren się podniósł
        b.y = surfaceMidY - b.h;
        b.vy = 0;
      }
    }

    // Grawitacja
    if (!b.onGround) {
      b.vy += 0.55;
      if (b.vy > 14) b.vy = 14;
    }

    // Prędkość i tłumienie
    b.x += b.vx;
    b.y += b.vy;
    b.angle += b.rotVel;

    b.vx *= BARREL_CONFIG.FRICTION;
    b.rotVel *= 0.94;
    if (Math.abs(b.vx) < 0.05) b.vx = 0;
    if (Math.abs(b.rotVel) < 0.005) b.rotVel = 0;

    // Reset statusu wykopania po wyhamowaniu na podłożu
    if (b.onGround && Math.abs(b.vx) < 0.4) {
      b.isKicked = false;
    }

    // Kolizja ze ścianami pionowymi, monolitami i klockami Areny 5
    if (resolveBarrelWallCollisions(b, groundY, combatants)) {
      continue;
    }

    // Lądowanie na podłożu i platformach: aktualny środek po przemieszczeniu
    const curMidX = b.x + b.w * 0.5;
    const newFeetY = b.y + b.h;
    const newSurfaceY = getBarrelSurfaceY(curMidX, newFeetY, groundY);

    if (newSurfaceY !== Infinity && newFeetY >= newSurfaceY - 1 && b.vy >= 0) {
      if (b.vy > 3.0) {
        // Sprężyste odbicie z utratą energii
        b.vy = -b.vy * BARREL_CONFIG.BOUNCE_RESTITUTION;
        b.vx *= 0.85;
        b.rotVel *= 0.6;
        spawnRicochetSparks(curMidX, newSurfaceY, (Math.random() - 0.5) * 3, -1, 3);
      } else {
        const checkL = getBarrelSurfaceY(b.x + 3, newFeetY, groundY);
        const checkR = getBarrelSurfaceY(b.x + b.w - 3, newFeetY, groundY);
        if (checkL !== Infinity && checkR !== Infinity && Math.abs(checkL - checkR) <= 8) {
          // Płaska powierzchnia platformy / terenu
          b.y = newSurfaceY - b.h;
          b.vy = 0;
          b.onGround = true;
        } else if (checkL !== Infinity && checkR !== Infinity && Math.abs(checkL - checkR) <= 22) {
          // Pochyła rampa z podparciem obu stron: płynne staczanie się w dół stoku
          const slideDir = (checkL > checkR) ? -1 : 1;
          b.vx += slideDir * 0.55;
          b.rotVel += slideDir * 0.03;
          b.y = newSurfaceY - b.h;
          b.vy = 0;
          b.onGround = true;
        } else {
          // Krawędź przepaści / brak podparcia z jednej strony - zsuwanie grawitacyjne z krawędzi
          const slideDir = (checkL === Infinity || checkL > checkR) ? -1 : 1;
          b.vx += slideDir * 0.55;
          b.rotVel += slideDir * 0.03;
          b.y = newSurfaceY - b.h;
          b.vy = 0;
        }
      }
    } else if (newSurfaceY !== Infinity && b.onGround && Math.abs(newFeetY - newSurfaceY) <= 8 && b.vy >= 0) {
      b.y = newSurfaceY - b.h;
      b.vy = 0;
    } else if (b.vy > 0) {
      b.onGround = false;
    }

    // Odbicia od granic mapy
    const minX = curArena?.bounds?.minX ?? 0;
    const maxX = curArena?.bounds?.maxX ?? 3800;
    if (b.x < minX + 8) {
      b.x = minX + 8;
      b.vx = Math.abs(b.vx) * 0.5;
    } else if (b.x + b.w > maxX - 8) {
      b.x = maxX - b.w - 8;
      b.vx = -Math.abs(b.vx) * 0.5;
    }

    // Detekcja zmiażdżenia przez spadające ciężkie bloki lub suwnicę (Squash)
    let squashed = false;
    const a5 = (typeof window !== 'undefined' && window.arena5State) ? window.arena5State : null;
    if (a5) {
      if (a5.crane && a5.crane.y !== undefined) {
        const crane = a5.crane;
        if (b.x + b.w > crane.x && b.x < crane.x + (crane.w || 200)) {
          if (crane.y + (crane.h || 40) >= b.y && crane.y <= b.y + b.h) {
            squashed = true;
          }
        }
      }
      if (!squashed && a5.gridRows) {
        const cLeft = Math.max(0, Math.floor(b.x / 100));
        const cRight = Math.min(9, Math.floor((b.x + b.w) / 100));
        for (let col = cLeft; col <= cRight; col++) {
          for (const [, row] of a5.gridRows.entries()) {
            const cell = row ? row[col] : null;
            if (cell && cell.isFalling && cell.hp > 0) {
              if (b.x + b.w > cell.x && b.x < cell.x + 100) {
                if (cell.y + 100 >= b.y && cell.y <= b.y + b.h) {
                  squashed = true;
                  break;
                }
              }
            }
          }
          if (squashed) break;
        }
      }
    }
    if (!squashed && Array.isArray(ARENA_PLATFORMS)) {
      for (const plat of ARENA_PLATFORMS) {
        if (plat && plat.vy && plat.vy > 1.5 && plat.intact !== false) {
          if (b.x + b.w > plat.x && b.x < plat.x + (plat.w || 100)) {
            if (plat.y + (plat.h || 20) >= b.y && plat.y <= b.y + b.h) {
              squashed = true;
              break;
            }
          }
        }
      }
    }

    if (squashed) {
      detonateBarrel(b, combatants, groundY);
      continue;
    }

    // Kolizja fizyczna beczki z postaciami (zombie, gracz, boty)
    let barrelDetonated = false;
    const bSpeed = Math.hypot(b.vx, b.vy);
    const bLeft = b.x;
    const bRight = b.x + b.w;
    const bTop = b.y;
    const bBottom = b.y + b.h;

    for (const c of combatants) {
      if (!c) continue;
      // Kopiacy gracz jest chroniony przez krotka chwile po wykopie
      if (c === b.lastAttacker && b.kickerGraceTimer > 0) continue;

      const cW = c.w || 24;
      const isLyingZombie = !!(c.isZombie && c.isDead && c.hasHead && !c.decapitated);
      const isDeadHuman = !!(!c.isZombie && c.isDead);
      if (isDeadHuman) continue;

      const cH = isLyingZombie ? 24 : (c.h || 70);
      const cLeft = c.x;
      const cRight = c.x + cW;
      const cBottom = c.y + (c.h || 70);
      const cTop = cBottom - cH;

      const marginX = Math.max(2, Math.abs(b.vx) * 0.5);
      const marginY = Math.max(2, Math.abs(b.vy) * 0.5);
      const overlapX = (bRight + marginX >= cLeft && bLeft - marginX <= cRight);
      const overlapY = (bBottom + marginY >= cTop && bTop - marginY <= cBottom);

      if (overlapX && overlapY) {
        // Tylko jeśli beczka została wykopana Spartan Kickiem i pędzi na cel:
        if (b.isKicked && bSpeed >= 4.0) {
          detonateBarrel(b, combatants, groundY);
          barrelDetonated = true;
          break;
        }

        // Zwykły kontakt fizyczny postaci z beczką (bieg, chód, stanie):
        // NIGDY nie wybucha, NIGDY nie zadaje obrażeń beczce ani graczowi!
        const cMidX = cLeft + cW * 0.5;
        const cVx = c.vx || 0;
        const pushDir = (cMidX < midX) ? 1 : -1;

        if (!isLyingZombie) {
          // Łagodne przepchnięcie beczki
          const nudgeSpeed = Math.min(Math.abs(cVx) * 0.45, 1.8);
          if (nudgeSpeed > 0.08) {
            b.vx = pushDir * nudgeSpeed;
            b.rotVel = pushDir * 0.05;
          }

          // Separacja AABB - zatrzymanie wnikania postaci w beczkę
          if (pushDir === 1) {
            if (cRight > bLeft && cLeft < bLeft) {
              c.x = bLeft - cW;
              if (c.vx > 0) c.vx = 0;
            }
          } else {
            if (cLeft < bRight && cRight > bRight) {
              c.x = bRight;
              if (c.vx < 0) c.vx = 0;
            }
          }
        }
      }
    }
    if (barrelDetonated) continue;

    // Zagrożenia środowiskowe niszczące beczkę (kwas na A2, rzeka na A3, lawa na A4, utylizator na A5)
    let envDestroy = false;
    if (arenaId === 'arena-2') {
      const acidY = (typeof window !== 'undefined' && window.ACID_SURGE_SYSTEM) ? window.ACID_SURGE_SYSTEM.currentY : 1440;
      if (b.y + b.h >= acidY - 4) envDestroy = true;
    } else if (arenaId === 'arena-3') {
      if (b.y + b.h >= 1290) {
        envDestroy = true;
        if (typeof window !== 'undefined' && typeof window.spawnArena3WaterSplash === 'function') {
          window.spawnArena3WaterSplash(midX, 1300, 24, true);
        }
      }
    } else if (arenaId === 'arena-4') {
      if (b.y + b.h >= 1390) envDestroy = true;
    } else if (arenaId === 'arena-5' || arenaId === 'prefab-tower') {
      const recY = (typeof window !== 'undefined' && window.arena5State?.recyclerY) ? window.arena5State.recyclerY : (groundY + 80);
      if (b.y + b.h >= recY - 4) envDestroy = true;
    } else if (b.y > 2400) {
      envDestroy = true;
    }

    if (envDestroy) {
      detonateBarrel(b, combatants, groundY);
      continue;
    }
  }

  // -------------------------------------------------------------------------
  // 2. PĘTLA KAŁUŻ KWASU (TOXIC ACID POOLS)
  // -------------------------------------------------------------------------
  for (let i = hazardsState.acidPools.length - 1; i >= 0; i--) {
    const pool = hazardsState.acidPools[i];
    pool.timer -= dt;
    pool.bubbleAnim = (pool.bubbleAnim || 0) + dt * 4;

    // Dopasowanie do terenu, krawędzi platformy i skosów (oraz usunięcie jeśli podłoże runęło lub zostało < 14px)
    if (!fitAcidPoolToTerrain(pool, groundY, arenaId)) {
      hazardsState.acidPools.splice(i, 1);
      continue;
    }

    // Zadawanie ciągłych obrażeń postaciom i rozpuszczanie powalonych zombie
    for (const c of combatants) {
      if (!c) continue;
      const cx = c.x + (c.w || 24) * 0.5;
      const cy = c.y + (c.h || 70);

      const dx = cx - pool.x;
      if (Math.abs(dx) <= pool.radius) {
        const poolSurfaceAtCx = pool.y + dx * Math.tan(pool.angle || 0);
        if (Math.abs(cy - poolSurfaceAtCx) <= 22) {
          c.hp = Math.max(0, (c.hp !== undefined ? c.hp : 100) - pool.dps * dt);

          if (c.isZombie && c.isDead) {
            // Powalony zombie w kwasie natychmiast ulega rozpuszczeniu
            c.hasHead = false;
            c.decapitated = true;
            c.reviveTimer = 0;
            c.decayTimer = 15;
            spawnBloodSpurt(cx, cy - 10, (Math.random() - 0.5) * 2, -2, 8, 1.0);
          }
        }
      }
    }

    if (pool.timer <= 0) {
      hazardsState.acidPools.splice(i, 1);
    }
  }

  while (hazardsState.acidPools.length > 6) {
    hazardsState.acidPools.shift();
  }

  while (hazardsState.barrels.length > 6) {
    hazardsState.barrels.shift();
  }

}

/**
 * Zrzut z powietrza (Airdrop) w trakcie meczu wyłączony - beczki rozstawiane są wyłącznie
 * jednorazowo przy starcie meczu/rundy w initHazardsForArena.
 * Funkcja zachowana jako kompatybilna atrapa zwracająca false.
 */
export function spawnAirdropBarrel(arenaId, groundY = 800, combatants = []) {
  return false;
}

/**
 * Sprawdza czy gracz lub bot znajduje się w zasięgu kopnięcia beczki
 */
export function checkBarrelKickInteraction(char) {
  if (!char || char.isDead) return null;

  const charMidX = char.x + (char.w || 24) * 0.5;
  const charFeetY = char.y + (char.h || 70);
  const facing = char.facing || 1;
  const reachX = 55;

  for (const b of hazardsState.barrels) {
    if (!b || b.isDead) continue;
    const bMidX = b.x + b.w * 0.5;
    const bFeetY = b.y + b.h;

    const dx = bMidX - charMidX;
    const dy = bFeetY - charFeetY;

    // Beczka musi znajdować się przed postacią w kierunku facing
    const isAhead = (dx * facing) >= -8 && (dx * facing) <= reachX;
    if (isAhead && Math.abs(dy) <= 32) {
      kickBarrel(b, char);
      return b;
    }
  }
  return null;
}

if (typeof window !== 'undefined') {
  window.damageBarrel = damageBarrel;
  window.igniteBarrel = igniteBarrel;
  window.detonateBarrel = detonateBarrel;
  window.getValidBarrelSpawnSurfaceY = getValidBarrelSpawnSurfaceY;
  window.getAcidPoolSupportBounds = getAcidPoolSupportBounds;
  window.fitAcidPoolToTerrain = fitAcidPoolToTerrain;
}

if (typeof registerArenaResetCallback === 'function') {
  registerArenaResetCallback(() => {
    hazardsState.currentArenaId = null;
    hazardsState.barrels.length = 0;
    hazardsState.acidPools.length = 0;
    hazardsState.airdropTimer = 28.0;
  });
}
