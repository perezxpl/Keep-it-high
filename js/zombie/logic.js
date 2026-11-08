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

/**
 * Oblicza wysokość podłoża lub platformy pod zombie
 */
function getZombieSurfaceY(x, y, baseGroundY) {
  const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
  const isA3 = (curArena?.id === 'arena-3');
  let floor = (isA3 && typeof getRiverbankGroundY === 'function') ? getRiverbankGroundY(x) : baseGroundY;

  if (Array.isArray(ARENA_PLATFORMS)) {
    for (const plat of ARENA_PLATFORMS) {
      if (plat.isWall || plat.solid === false || plat.isPlatform === false) continue;
      if (isA3 && (plat.id === 'ground_left' || plat.id === 'ground_right' || plat.id === 'riverbank_left_oval' || plat.id === 'riverbank_right_oval' || plat.id === 'world_boundary_left' || plat.id === 'world_boundary_right')) continue;
      const bnds = (typeof getPlatformBounds === 'function') ? getPlatformBounds(plat) : { minX: plat.x, maxX: plat.x + plat.w };
      if (x >= bnds.minX - 8 && x <= bnds.maxX + 8) {
        const topY = (plat.surfacePoints && typeof getPlatformSurfaceY === 'function')
          ? getPlatformSurfaceY(plat, x, baseGroundY)
          : ((plat.y !== undefined) ? (typeof getPlatformSurfaceY === 'function' ? getPlatformSurfaceY(plat, x, baseGroundY) : plat.y) : (baseGroundY - (plat.relY || 0)));
        if (y <= topY + 16 && topY < floor) {
          floor = topY;
        }
      }
    }
  }

  if (Array.isArray(customObstacles)) {
    for (const obs of customObstacles) {
      const topY = obs.y !== undefined ? obs.y : (baseGroundY - obs.relY);
      if (x >= obs.x - 8 && x <= obs.x + obs.w + 8) {
        if (y <= topY + 16 && topY < floor) {
          floor = topY;
        }
      }
    }
  }

  return floor;
}

/**
 * Główna pętla aktualizacji systemu zombie
 */
export function updateZombieSystem(dt, player, bots = [], groundY = 800) {
  if (!zombieState.enabled) return;

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

    corpse.timer -= dt;

    // Drżenie ciała przed powstaniem (konwulsje reanimacji)
    if (corpse.timer <= 1.2) {
      corpse.twitch = Math.sin(Date.now() * 0.04) * 2.5;
      if (Math.random() < 0.2) {
        spawnBloodDrip(corpse.x + (Math.random() - 0.5) * 16, corpse.y, (Math.random() - 0.5) * 1.5, -1.0, 2);
      }
    }

    if (corpse.timer <= 0) {
      // Narodziny nowego Zombie
      const newZombie = createZombieInstance(corpse.x, corpse.y, corpse.facing, {
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
        c.bleedTimer = 80;

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
      if (z.decapitated || !z.hasHead) {
        // Permanentna śmierć przez dekapitację: zombie leży martwy na zawsze
        z.vx = 0;
        z.vy = 0;
        continue;
      }

      // Powalenie bez dekapitacji: zombie wstaje po upływie reviveTimer!
      z.reviveTimer -= dt;
      if (z.reviveTimer <= 0) {
        z.isDead = false;
        z.hp = z.maxHp;
        z.riseTimer = 1.3;
        z.attackCooldown = 0.8;
        triggerScreenShake(1.5);
        spawnBloodSpurt(z.x + z.w / 2, z.y + z.h - 10, (Math.random() - 0.5) * 3, -2.0, 10, 1.0);
      }
      continue;
    }

    // --- WSTAWANIE Z ZIEMI ---
    if (z.riseTimer > 0) {
      z.riseTimer -= dt;
      z.vx = 0;
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
    z.vy += 0.45;
    if (z.vy > 12) z.vy = 12;

    const feetX = z.x + z.w * 0.5;
    const feetY = z.y + z.h;
    const surfaceY = getZombieSurfaceY(feetX, feetY, groundY);

    if (feetY + z.vy >= surfaceY) {
      z.y = surfaceY - z.h;
      z.vy = 0;

      // Niewielki przeskok przy natknięciu się na krawędź schodka
      if (nearestTarget && (nearestTarget.y + nearestTarget.h < z.y + z.h - 20) && Math.random() < 0.04) {
        z.vy = -5.2;
      }
    } else {
      z.y += z.vy;
    }

    z.x += z.vx;
  }
}

/**
 * Zwraca tablicę wszystkich żywych i aktywnych zombie (do kolizji z kulami i bronią białą)
 */
export function getActiveZombies() {
  if (!zombieState.enabled) return [];
  return zombieState.zombies.filter(z => z && !z.isDead);
}

/**
 * Rejestruje zgon postaci i tworzy leżące ciało do późniejszej reanimacji
 */
export function onCharacterRespawnCorpse(char, groundY) {
  if (!zombieState.enabled || !char) return;

  // Ciała pozbawione głów (decapitated) NIE wstają
  if (char.decapitated || !char.hasHead || char.isGibbed || (char.acidDeath && char.acidDeath.dissolved)) {
    return;
  }

  registerCorpseForReanimation(char, groundY);
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
