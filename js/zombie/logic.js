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
      const topY = (plat.surfacePoints && typeof getPlatformSurfaceY === 'function')
        ? getPlatformSurfaceY(plat, x, baseGroundY)
        : ((plat.y !== undefined) ? (typeof getPlatformSurfaceY === 'function' ? getPlatformSurfaceY(plat, x, baseGroundY) : plat.y) : (baseGroundY - (plat.relY || 0)));
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

  const validBots = Array.isArray(bots) ? bots.filter(b => b && b.active) : [];
  const remotePlayer = (typeof window !== 'undefined' && window.remotePlayer && window.remotePlayer.active) ? window.remotePlayer : null;
  const livingHumans = [player, ...validBots, ...(remotePlayer ? [remotePlayer] : [])].filter(c => c && !c.isDead && !c.isZombie);

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

    // Ponowna weryfikacja czy podłoże pod leżącym ciałem nie zapadło się w krater
    const cX = corpse.centerX || (corpse.x + 12);
    const cFeetY = corpse.feetY || (corpse.y + 70);
    const curSurface = getZombieSurfaceY(cX, cFeetY, groundY);
    if (curSurface === Infinity || curSurface > 1400) {
      zombieState.corpses.splice(i, 1);
      continue;
    }
    corpse.feetY = curSurface;
    corpse.groundY = curSurface;
    corpse.y = curSurface - 70;

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
        shirtColor: corpse.visuals.shirtColor,
        pantsColor: corpse.visuals.pantsColor,
        hairStyle: corpse.visuals.hairStyle,
        hairColor: corpse.visuals.hairColor
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
      } else {
        z.y += z.vy;
      }
      z.vx *= 0.85;
      z.x += z.vx;

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
      // Stopy zakotwiczone ściśle na podłożu w trakcie sekwencji wstawania
      const feetX = z.x + z.w * 0.5;
      const curSurf = getZombieSurfaceY(feetX, z.y + z.h, groundY);
      if (curSurf !== Infinity && curSurf < 1500) {
        z.y = curSurf - z.h;
        z.vy = 0;
      } else {
        z.vy += 0.45;
        z.y += z.vy;
      }
      continue;
    }

    // Timery animacji i odnowienia ataku
    if (z.attackCooldown > 0) z.attackCooldown -= dt;
    if (z.attackAnim > 0) z.attackAnim -= dt;

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

    if (nearestTarget) {
      const tx = nearestTarget.x + (nearestTarget.w || 24) * 0.5;
      const ty = nearestTarget.y + (nearestTarget.h || 70) * 0.5;
      const dx = tx - zx;
      const dy = ty - zy;

      z.facing = dx >= 0 ? 1 : -1;

      // Człapiący ruch w stronę celu
      if (Math.abs(dx) > 16) {
        z.vx = (dx > 0 ? 1 : -1) * ZOMBIE_CONFIG.SPEED;
        z.walkAnim += dt * 3.4;
      } else {
        z.vx = 0;
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
      z.vx = Math.sin(Date.now() * 0.001 + i) * (ZOMBIE_CONFIG.SPEED * 0.4);
      z.walkAnim += dt * 1.5;
      if (Math.abs(z.vx) > 0.1) z.facing = z.vx > 0 ? 1 : -1;
    }

    // --- FIZYKA PIONOWA I KOLIZJE Z PODŁOŻEM ---
    if (z.jumpCooldown > 0) {
      z.jumpCooldown -= dt;
    }

    z.vy += 0.45;
    if (z.vy > 12) z.vy = 12;

    const feetX = z.x + z.w * 0.5;
    const feetY = z.y + z.h;
    const surfaceY = getZombieSurfaceY(feetX, feetY, groundY);

    if (feetY + z.vy >= surfaceY) {
      z.y = surfaceY - z.h;
      z.vy = 0;

      // Inteligentne pokonywanie przeszkód pionowych - wyłącznie przy realnej przeszkodzie lub wyższej platformie
      if (nearestTarget && z.jumpCooldown <= 0) {
        const targetFeetY = nearestTarget.y + (nearestTarget.h || 70);
        const isTargetHigher = (targetFeetY < z.y + z.h - 38);
        const targetDx = (nearestTarget.x + (nearestTarget.w || 24) * 0.5) - (z.x + z.w * 0.5);

        // A. Sprawdzenie uskoku / stopnia bezpośrednio przed zombie
        const checkFrontX = z.x + (z.w * 0.5) + (z.facing * 22);
        const frontSurface = getZombieSurfaceY(checkFrontX, z.y + z.h - 10, groundY);
        const isStepAhead = (frontSurface < z.y + z.h - 18 && frontSurface > z.y - 120);

        if (isStepAhead) {
          // Przeskok realnego stopnia / krawędzi platformy przed zombie
          z.vy = -7.8;
          z.vx = z.facing * (ZOMBIE_CONFIG.SPEED * 1.2);
          z.jumpCooldown = 1.4;
        } else if (isTargetHigher && Math.abs(targetDx) < 80) {
          // Skok wspinaczkowy na wyższą platformę gdy zombie stoi tuż pod celem
          z.vy = -10.2;
          z.vx = (targetDx >= 0 ? 1 : -1) * 2.4;
          z.jumpCooldown = 1.6;
        }
      }
    } else {
      z.y += z.vy;
    }

    z.x += z.vx;

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
