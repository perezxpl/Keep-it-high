// =========================================================================
// ZOMBIE/LOGIC.JS - MECHANIKA, FIZYKA, AI I INFEKCJA W TRYBIE ZOMBIE
// Odpowiada za:
// - Reanimację poległych ciał (niepozbawionych głów)
// - Człapiące AI podążające za najbliższym żywym celem
// - Ugryzienia, zakażenia DoT i rozprzestrzenianie plagi
// - Wstawanie po zwykłym powaleniu i permanentną śmierć wyłącznie przez dekapitację
// =========================================================================

import { zombieState, ZOMBIE_CONFIG, createZombieInstance, registerCorpseForReanimation } from './state.js';
import { triggerScreenShake, spawnBloodSpurt, spawnBloodDrip, spawnBloodFountain, spawnHeadGib } from '../world.js';
import { ARENA_PLATFORMS, customObstacles, getPlatformSurfaceY, getPlatformBounds, getActiveArena } from '../obstacles.js';
import { triggerCombatFeedBanner } from '../ui/combatFeed.js';
import { getRiverbankGroundY } from '../arenas/arena3/state.js';

let _activeZombiesCache = [];

/**
 * Pomocnicze sprawdzanie powierzchni na liście platform bez alokacji tablic
 */
function checkPlatformList(list, x, y, baseGroundY, isA3, currentFloor) {
  if (!Array.isArray(list)) return currentFloor;
  let floor = currentFloor;
  for (let i = 0; i < list.length; i++) {
    const plat = list[i];
    if (!plat || plat.destroyed || plat.isDestroyed || plat.isWall || plat.solid === false || plat.isPlatform === false) continue;
    if (isA3 && (plat.id === 'ground_left' || plat.id === 'ground_right' || plat.id === 'riverbank_left_oval' || plat.id === 'riverbank_right_oval' || plat.id === 'world_boundary_left' || plat.id === 'world_boundary_right')) continue;

    let minX, maxX;
    if (plat.angle) {
      const bnds = (typeof getPlatformBounds === 'function') ? getPlatformBounds(plat) : { minX: plat.x, maxX: plat.x + plat.w };
      minX = bnds.minX;
      maxX = bnds.maxX;
    } else {
      minX = plat.x;
      maxX = plat.x + (plat.w !== undefined ? plat.w : 100);
    }

    if (x >= minX - 8 && x <= maxX + 8) {
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

      if (y <= topY + 16 && topY < floor) {
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
  const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
  const isA3 = (curArena?.id === 'arena-3');
  let floor = Infinity;

  if (isA3 && typeof getRiverbankGroundY === 'function') {
    floor = getRiverbankGroundY(x);
  } else if (baseGroundY < 1500) {
    const hasGround = (typeof window !== 'undefined' && typeof window.isGroundAt === 'function')
      ? window.isGroundAt(x, 2)
      : true;
    if (hasGround) {
      floor = baseGroundY;
    }
  }

  floor = checkPlatformList(ARENA_PLATFORMS, x, y, baseGroundY, isA3, floor);

  const a5Plats = (typeof window !== 'undefined' && window.arena5State?.platforms) ? window.arena5State.platforms : null;
  if (a5Plats) {
    floor = checkPlatformList(a5Plats, x, y, baseGroundY, isA3, floor);
  }

  if (Array.isArray(customObstacles)) {
    floor = checkPlatformList(customObstacles, x, y, baseGroundY, isA3, floor);
  }

  return floor;
}

/**
 * Sprawdza uderzenie głową w sufit / spód litej platformy podczas skoku w górę (vy < 0)
 */
export function checkZombieCeiling(z, groundY) {
  const headY = z.y;
  const centerX = z.x + (z.w || 24) * 0.5;

  // 1. Sprawdzanie sufitów na platformach ARENA_PLATFORMS
  for (let i = 0; i < ARENA_PLATFORMS.length; i++) {
    const plat = ARENA_PLATFORMS[i];
    if (!plat || plat.destroyed || plat.isDestroyed || plat.solid === false) continue;
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
      if (!obs || obs.destroyed) continue;
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
    const col = Math.floor(centerX / 100);
    if (col >= 0 && col < 10) {
      const minR = a5.minFloorRow || 0;
      for (let r = minR; r < minR + 15; r++) {
        const row = a5.gridRows.get(r);
        const cell = row ? row[col] : null;
        if (cell && cell.hp > 0 && !cell.isFalling) {
          const bottomY = cell.y + 100;
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

  for (let i = 0; i < ARENA_PLATFORMS.length; i++) {
    const plat = ARENA_PLATFORMS[i];
    if (!plat || plat.destroyed || plat.solid === false || plat.isDropThrough || plat.type === 'catwalk') continue;
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
    const col = Math.floor(centerX / 100);
    if (col >= 0 && col < 10) {
      const minR = a5.minFloorRow || 0;
      for (let r = minR; r < minR + 15; r++) {
        const row = a5.gridRows.get(r);
        const cell = row ? row[col] : null;
        if (cell && cell.hp > 0 && !cell.isFalling) {
          const bottomY = cell.y + 100;
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

  // 1. Monolity i ściany ARENA_PLATFORMS
  for (let i = 0; i < ARENA_PLATFORMS.length; i++) {
    const plat = ARENA_PLATFORMS[i];
    if (!plat || plat.destroyed || plat.solid === false) continue;
    if (!plat.isWall && !plat.isMonolith) continue;

    const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
    const bottomY = topY + (plat.thickness || plat.h || 470);

    if (feetY > topY + 8 && headY < bottomY - 4) {
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
      if (!obs || obs.destroyed) continue;
      if (obs.type === 'bunker_block' || obs.type === 'cyber_pillar' || obs.type === 'tall_concrete_wall') {
        const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
        const bottomY = topY + obs.h;
        if (feetY > topY + 8 && headY < bottomY - 4) {
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
  }

  // 3. Klocki wieży Areny 5 (100x100)
  const a5 = (typeof window !== 'undefined' && window.arena5State?.gridRows) ? window.arena5State : null;
  if (a5) {
    const colLeft = Math.max(0, Math.floor((z.x - 20) / 100));
    const colRight = Math.min(9, Math.floor((z.x + (z.w || 24) + 20) / 100));
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

          if (z.x + (z.w || 24) > cellLeft && z.x < cellRight && feetY > cellTop + 14 && headY < cellBottom - 6) {
            const midX = cellLeft + 50;
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
}

/**
 * Pokonywanie stopni i przeszkód w ruchu poziomym (schodek do 18px = płynne wejście, 18-110px = skok wspinaczkowy)
 */
export function handleZombieStepAndClimb(z, groundY) {
  if (!z.onGround) return false;

  const facing = z.facing || 1;
  const checkX = z.x + (facing > 0 ? (z.w || 24) + 6 : -6);
  const feetY = z.y + (z.h || 70);

  let bestStepTop = null;

  // Platformy z przodu
  for (let i = 0; i < ARENA_PLATFORMS.length; i++) {
    const plat = ARENA_PLATFORMS[i];
    if (!plat || plat.destroyed || plat.isWall) continue;
    const bnds = (typeof getPlatformBounds === 'function') ? getPlatformBounds(plat) : { minX: plat.x, maxX: plat.x + (plat.w || 100) };
    if (checkX >= bnds.minX - 4 && checkX <= bnds.maxX + 4) {
      const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
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
      if (!obs || obs.destroyed) continue;
      if (checkX >= obs.x - 4 && checkX <= obs.x + obs.w + 4) {
        const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
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
    const col = Math.floor(checkX / 100);
    if (col >= 0 && col < 10) {
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

  if (bestStepTop !== null) {
    const stepDiff = feetY - bestStepTop;
    if (stepDiff > 0 && stepDiff <= 18) {
      // Niski stopień: płynne wejście bez podskakiwania
      z.y = bestStepTop - (z.h || 70);
      z.vy = 0;
      z.onGround = true;
      return true;
    } else if (stepDiff > 18 && stepDiff <= 110 && z.jumpCooldown <= 0) {
      // Półka do przeskoczenia: pojedynczy, celowy skok wspinaczkowy
      const hasCeil = checkZombieCeilingAbove(z, groundY);
      if (!hasCeil) {
        z.vy = -8.2;
        z.vx = facing * (ZOMBIE_CONFIG.SPEED * 1.15);
        z.jumpCooldown = 1.4;
        z.onGround = false;
        return true;
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
  return refreshActiveZombiesCache();
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
      _activeZombiesCache.push(z);
    }
  }
  for (let i = 0; i < zombieState.corpses.length; i++) {
    const c = zombieState.corpses[i];
    if (c && c.hasHead && !c.decapitated) {
      _activeZombiesCache.push(c);
    }
  }
  return _activeZombiesCache;
}

/**
 * Główna pętla aktualizacji systemu zombie
 */
export function updateZombieSystem(dt, player, bots = [], groundY = 800) {
  if (!zombieState.enabled) return;

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
        c.corpseFloorY = groundY;
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

    // --- STAN ZGONU / POWALENIA ZOMBIE ---
    if (z.isDead) {
      // Grawitacja i kolizja z podłożem dla powalonego/martwego ciała
      z.vy += 0.45;
      if (z.vy > 12) z.vy = 12;
      const feetX = z.x + z.w * 0.5;
      const feetY = z.y + z.h;
      const surfaceY = getZombieSurfaceY(feetX, feetY, groundY);
      if (feetY + z.vy >= surfaceY) {
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
        if (z.decayTimer >= 14.0) {
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
        const feetX = z.x + z.w * 0.5;
        const curSurf = getZombieSurfaceY(feetX, z.y + z.h, groundY);
        if (curSurf !== Infinity && curSurf < 1500) {
          z.y = curSurf - z.h;
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
      z.riseTimer -= dt;
      z.vx = 0;
      z.knockbackVx = 0;
      // Stopy zakotwiczone ściśle na podłożu w trakcie sekwencji wstawania
      const feetX = z.x + z.w * 0.5;
      const curSurf = getZombieSurfaceY(feetX, z.y + z.h, groundY);
      if (curSurf !== Infinity && curSurf < 1500) {
        z.y = curSurf - z.h;
        z.vy = 0;
        z.onGround = true;
      } else {
        z.vy += 0.45;
        z.y += z.vy;
      }
      resolveZombieWallCollisions(z, groundY);
      continue;
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

      // Człapiący ruch w stronę celu (zablokowany w ułamku sekundy podczas mocnego uderzenia/hitstuna)
      if (z.hitStunTimer <= 0) {
        if (Math.abs(dx) > 16) {
          desiredVx = (dx > 0 ? 1 : -1) * ZOMBIE_CONFIG.SPEED;
          z.walkAnim += dt * 3.4;
        } else {
          desiredVx = 0;
        }
      }

      // --- ATAK WRĘCZ / UGRYZIENIE ---
      if (Math.abs(dx) <= ZOMBIE_CONFIG.BITE_RANGE && Math.abs(dy) <= 38) {
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
            nearestTarget.corpseFloorY = groundY;
            nearestTarget.ragdoll = null;
            nearestTarget.deathImpulse = {
              vx: z.facing * 3.2,
              vy: -1.4
            };
            triggerCombatFeedBanner('DEATH', `[PLAGA] ${nearestTarget.name || 'OPERATOR'} POLEGŁ W SZPONACH ZOMBIE!`);
          }
        }
      }
    } else {
      // Brak żywych celów – zombie snuje się powoli
      desiredVx = Math.sin(Date.now() * 0.001 + i) * (ZOMBIE_CONFIG.SPEED * 0.4);
      z.walkAnim += dt * 1.5;
      if (Math.abs(desiredVx) > 0.1) z.facing = desiredVx > 0 ? 1 : -1;
    }

    // Wypadkowa prędkość pozioma: intencja ruchu + odrzut kinetyczny + separacja stada
    z.vx = desiredVx + (z.knockbackVx || 0) + sepX;

    // --- FIZYKA PIONOWA I KOLIZJE Z PODŁOŻEM ---
    z.vy += 0.45;
    if (z.vy > 12) z.vy = 12;

    const feetX = z.x + z.w * 0.5;
    const feetY = z.y + z.h;
    const surfaceY = getZombieSurfaceY(feetX, feetY, groundY);

    if (feetY + z.vy >= surfaceY) {
      z.y = surfaceY - z.h;
      z.vy = 0;
      z.onGround = true;
    } else {
      // Przyklejenie do pochyłości terenu (rampy, brzegi rzeki, skosy wulkaniczne)
      if (z.onGround && surfaceY < 1500 && Math.abs(feetY - surfaceY) <= 16 && z.vy >= 0) {
        z.y = surfaceY - z.h;
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
    }

    // --- RUCH POZIOMY I REAKCJE NA OTOCZENIE ---
    z.x += z.vx;

    // Pokonywanie schodków (do 18px bez skoku) oraz wspinaczka na półki
    const climbed = handleZombieStepAndClimb(z, groundY);

    // Celowany skok na platformę gdy cel znajduje się bezpośrednio nad głową w zasięgu skoku
    if (!climbed && nearestTarget && z.onGround && z.jumpCooldown <= 0) {
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

    // --- ZAGROŻENIA ŚRODOWISKOWE AREN (KWAS, LAWA, UTYLIZATOR) ---
    const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
    const arenaId = curArena?.id || '';
    let shouldDissolve = false;

    if (arenaId === 'arena-2') {
      const acidY = (typeof window !== 'undefined' && window.ACID_SURGE_SYSTEM) ? window.ACID_SURGE_SYSTEM.currentY : 1440;
      if (z.y + z.h >= acidY - 4) shouldDissolve = true;
    } else if (arenaId === 'arena-4') {
      if (z.y + z.h >= 1390) shouldDissolve = true;
    } else if (arenaId === 'arena-5') {
      const a5Floor = (typeof window !== 'undefined' && typeof window.arena5State?.currentFloorY === 'number') ? window.arena5State.currentFloorY : 1200;
      if (z.y + z.h >= a5Floor + 90) shouldDissolve = true;
    } else if (z.y > 2400) {
      shouldDissolve = true;
    }

    if (shouldDissolve) {
      spawnBloodSpurt(z.x + z.w / 2, z.y + z.h - 10, 0, -2.5, 12, 1.0);
      zombieState.zombies.splice(i, 1);
      continue;
    }

    // Granice poziome areny: zapobieganie wypadaniu poza mapę
    const minBoundsX = curArena?.bounds?.minX ?? 0;
    const maxBoundsX = curArena?.bounds?.maxX ?? 3800;
    z.x = Math.max(minBoundsX + 12, Math.min(maxBoundsX - z.w - 12, z.x));
  }
}

/**
 * Rejestruje zgon postaci i tworzy leżące ciało do późniejszej reanimacji
 */
export function onCharacterRespawnCorpse(char, groundY) {
  if (!zombieState.enabled || !char) return;

  // Ciała pozbawione głów (decapitated) oraz zmiażdżone (squashed/crushed/gibbed) NIE wstają
  if (char.isSquashed || char.isCrushed || char.isGibbed || char.decapitated || !char.hasHead || (char.acidDeath && char.acidDeath.dissolved)) {
    return;
  }

  const corpseX = char.ragdoll?.pelvis?.x ?? (char.x + (char.w || 24) * 0.5);
  const approxY = char.ragdoll?.pelvis?.y ?? (char.y + (char.h || 70) - 10);
  const surfaceY = getZombieSurfaceY(corpseX, approxY, groundY);

  if (surfaceY === Infinity || surfaceY > 1400) return;

  const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
  const arenaId = curArena?.id || '';
  if (arenaId === 'arena-2' && surfaceY >= 1430) return;
  if (arenaId === 'arena-4' && surfaceY >= 1385) return;

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
