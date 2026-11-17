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
import { ARENA_PLATFORMS, customObstacles, getPlatformSurfaceY, getPlatformBounds, getActiveArena } from '../obstacles.js';
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
/**
 * Oblicza wysokość podłoża lub platformy pod beczką
 */
export function getBarrelSurfaceY(x, y, baseGroundY) {
  const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
  const rawId = curArena?.id || (typeof window !== 'undefined' ? window.activeArenaId : 'arena-1');
  const arenaKey = String(rawId || 'arena-1').toLowerCase().replace(/_/g, '-');
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
      if (!plat || plat.destroyed || plat.isDestroyed || plat.isWall || plat.solid === false || plat.isPlatform === false) continue;
      if (isA3 && (plat.id === 'ground_left' || plat.id === 'ground_right' || plat.id === 'riverbank_left_oval' || plat.id === 'riverbank_right_oval' || plat.id === 'world_boundary_left' || plat.id === 'world_boundary_right')) continue;
      if (isA3 && plat.intact === false && plat.y >= 1310) continue;

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

        if (y <= topY + 6 && topY < floor) {
          floor = topY;
        }
      }
    }
  }

  if (Array.isArray(customObstacles)) {
    for (const obs of customObstacles) {
      if (!obs || obs.destroyed || obs.isDestroyed || obs.solid === false || obs.isPlatform === false) continue;
      const topY = obs.y !== undefined ? obs.y : (baseGroundY - obs.relY);
      if (x >= obs.x - 2 && x <= obs.x + obs.w + 2) {
        if (y <= topY + 6 && topY < floor) {
          floor = topY;
        }
      }
    }
  }

  return floor;
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
    if (!plat || plat.destroyed || plat.isDestroyed || plat.solid === false) continue;
    if (plat.isDropThrough || plat.dropThrough || plat.type === 'catwalk' || plat.isSlope) continue;

    const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
    const platThick = plat.thickness || plat.h || (plat.isMonolith ? 470 : 30);
    if (platThick < 16 && !plat.isWall && !plat.isMonolith) continue;

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
      if (!obs || obs.destroyed || obs.isDestroyed || obs.solid === false) continue;
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
 */
export function initHazardsForArena(arenaId) {
  if (!arenaId) return;
  const normalizedId = String(arenaId).toLowerCase().replace(/_/g, '-');
  if (hazardsState.currentArenaId === normalizedId && hazardsState.barrels.length > 0) return;

  hazardsState.currentArenaId = normalizedId;
  hazardsState.barrels.length = 0;
  hazardsState.acidPools.length = 0;
  hazardsState.respawnQueue.length = 0;

  const spawns = ARENA_BARREL_SPAWNS[normalizedId] || ARENA_BARREL_SPAWNS[arenaId];
  if (Array.isArray(spawns)) {
    for (const sp of spawns) {
      hazardsState.barrels.push(createBarrelInstance(sp));
    }
  }
}

/**
 * Kopię beczkę Spartan Kickiem [E] lub wślizgiem
 */
export function kickBarrel(barrel, kicker, isSlide = false) {
  if (!barrel || barrel.isDead) return false;

  const facing = kicker?.facing || 1;
  const kickVx = facing * (isSlide ? BARREL_CONFIG.SLIDE_IMPULSE_X : BARREL_CONFIG.KICK_IMPULSE_X);
  const kickVy = isSlide ? BARREL_CONFIG.SLIDE_IMPULSE_Y : BARREL_CONFIG.KICK_IMPULSE_Y;

  barrel.vx = kickVx;
  barrel.vy = kickVy;
  barrel.rotVel = facing * 0.24;
  barrel.onGround = false;
  barrel.lastAttacker = kicker;
  barrel.kickerGraceTimer = 0.20;

  triggerScreenShake(isSlide ? 6.0 : 10.0);
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
      const dmg = Math.round(typeDef.maxDamage * factor);

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
    const isA3 = (curArena?.id === 'arena-3');
    const surfaceY = getBarrelSurfaceY(bx, by, groundY);

    // Na Arenie 3 kwas wpadający do rzeki (surfaceY >= 1280) zostaje natychmiast rozmyty przez nurt
    if (!(isA3 && surfaceY >= 1280)) {
      hazardsState.acidPools.push({
        x: bx,
        y: surfaceY,
        radius: typeDef.poolRadius || 65,
        timer: typeDef.poolDuration || 8.0,
        maxTimer: typeDef.poolDuration || 8.0,
        dps: typeDef.poolDps || 14.0,
        bubbleAnim: 0
      });
    }
  }

  // 6. Kolejka odradzania (respawn po 35s dla stałych punktów na arenach 1-4)
  if (barrel.spawnId && barrel.originalSpawn) {
    hazardsState.respawnQueue.push({
      spawn: barrel.originalSpawn,
      timer: BARREL_CONFIG.RESPAWN_DELAY
    });
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
  const rawArenaId = curArena?.id || (typeof window !== 'undefined' ? window.activeArenaId : 'arena-1');
  const arenaId = String(rawArenaId || 'arena-1').toLowerCase().replace(/_/g, '-');

  // Automatyczna inicjalizacja przy zmianie areny
  if (hazardsState.currentArenaId !== arenaId) {
    initHazardsForArena(arenaId);
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

    // Detonacja po upływie fuseTimer
    if (b.fuseTimer > 0) {
      b.fuseTimer -= dt;
      if (b.fuseTimer <= 0) {
        detonateBarrel(b, combatants, groundY);
        continue;
      }
    }

    // Grawitacja
    b.vy += 0.55;
    if (b.vy > 14) b.vy = 14;

    // Prędkość i tłumienie
    b.x += b.vx;
    b.y += b.vy;
    b.angle += b.rotVel;

    b.vx *= BARREL_CONFIG.FRICTION;
    b.rotVel *= 0.94;
    if (Math.abs(b.vx) < 0.05) b.vx = 0;
    if (Math.abs(b.rotVel) < 0.005) b.rotVel = 0;

    // Kolizja ze scianami pionowymi, monolitami i klockami Areny 5
    if (resolveBarrelWallCollisions(b, groundY, combatants)) {
      continue;
    }

    // Kolizja z podlozem i platformami
    const midX = b.x + b.w * 0.5;
    const feetY = b.y + b.h;
    const surfaceY = getBarrelSurfaceY(midX, feetY, groundY);

    if (surfaceY !== Infinity && feetY + b.vy >= surfaceY) {
      if (b.vy > 3.0) {
        // Sprezyste odbicie z utrata energii
        b.vy = -b.vy * BARREL_CONFIG.BOUNCE_RESTITUTION;
        b.vx *= 0.85;
        b.rotVel *= 0.6;
      } else {
        b.y = surfaceY - b.h;
        b.vy = 0;
        b.onGround = true;
      }
    } else if (b.onGround && surfaceY !== Infinity && Math.abs(feetY - surfaceY) <= 12 && b.vy >= 0) {
      b.y = surfaceY - b.h;
      b.vy = 0;
    } else {
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

      const marginX = Math.max(3, Math.abs(b.vx) * 0.7);
      const marginY = Math.max(3, Math.abs(b.vy) * 0.7);
      const overlapX = (bRight + marginX >= cLeft && bLeft - marginX <= cRight);
      const overlapY = (bBottom + marginY >= cTop && bTop - marginY <= cBottom);

      if (overlapX && overlapY) {
        if (bSpeed >= 3.0) {
          // 1. Twardy impakt przy wysokiej/sredniej predkosci -> detonacja beczki!
          detonateBarrel(b, combatants, groundY);
          barrelDetonated = true;
          break;
        } else if (bSpeed >= 1.0) {
          // 2. Umiarkowana predkosc: uderzenie kinetyczne, odepchniecie postaci i rykoszet beczki
          const pushDir = (b.vx !== 0 ? Math.sign(b.vx) : (c.x > midX ? 1 : -1));
          const pushForce = pushDir * Math.max(Math.abs(b.vx) * 1.15, 2.4);

          if (c.isZombie) {
            c.knockbackVx = pushForce;
            c.hitStunTimer = 0.28;
            c.onGround = false;
            c.hp = Math.max(0, (c.hp || 100) - Math.round(bSpeed * 6));
            if (c.hp <= 0 && !c.isDead) {
              c.isDead = true;
              c.reviveTimer = 4.0;
              c.deathImpulse = { vx: pushForce * 1.4, vy: -3.0 };
            }
          } else {
            c.vx = (c.vx || 0) + pushForce * 0.8;
            c.hp = Math.max(0, (c.hp || 100) - Math.round(bSpeed * 4));
          }

          spawnRicochetSparks(midX, b.y + b.h * 0.5, pushDir * 2, -1.5, 6);
          playSound('hit_armor', { x: midX, y: b.y });

          b.vx = -b.vx * 0.35;
          b.rotVel = -b.rotVel * 0.5;
          b.x += b.vx * 1.5;
          break;
        } else {
          // 3. Stojaca lub powolna beczka: przepychanie i separacja AABB
          const cVx = c.vx || 0;
          const isWalkingIntoBarrel = (cVx > 0.05 && cLeft < bLeft) || (cVx < -0.05 && cRight > bRight);

          if (isWalkingIntoBarrel && !isLyingZombie) {
            const pushDir = Math.sign(cVx);
            b.vx = pushDir * Math.max(Math.abs(cVx) * 0.9, 1.4);
            b.rotVel = pushDir * 0.08;
            b.x += b.vx;
            if (c.isZombie) {
              c.vx *= 0.55;
            }
          } else if (!isLyingZombie) {
            const cMidX = cLeft + cW * 0.5;
            if (cMidX < midX) {
              c.x = bLeft - cW;
              if (c.vx > 0) c.vx = 0;
            } else {
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
      if (feetY >= acidY - 4) envDestroy = true;
    } else if (arenaId === 'arena-3') {
      if (feetY >= 1290) envDestroy = true;
    } else if (arenaId === 'arena-4') {
      if (feetY >= 1390) envDestroy = true;
    } else if (arenaId === 'arena-5' || arenaId === 'prefab-tower') {
      const recY = (typeof window !== 'undefined' && window.arena5State?.recyclerY) ? window.arena5State.recyclerY : (groundY + 80);
      if (feetY >= recY - 4) envDestroy = true;
    } else if (b.y > 2400) {
      envDestroy = true;
    }

    if (envDestroy) {
      detonateBarrel(b, combatants, groundY);
    }
  }

  // -------------------------------------------------------------------------
  // 2. PĘTLA KAŁUŻ KWASU (TOXIC ACID POOLS)
  // -------------------------------------------------------------------------
  for (let i = hazardsState.acidPools.length - 1; i >= 0; i--) {
    const pool = hazardsState.acidPools[i];
    pool.timer -= dt;
    pool.bubbleAnim = (pool.bubbleAnim || 0) + dt * 4;

    // Zadawanie ciągłych obrażeń postaciom i rozpuszczanie powalonych zombie
    for (const c of combatants) {
      if (!c) continue;
      const cx = c.x + (c.w || 24) * 0.5;
      const cy = c.y + (c.h || 70);

      if (Math.abs(cx - pool.x) <= pool.radius && Math.abs(cy - pool.y) <= 18) {
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

    if (pool.timer <= 0) {
      hazardsState.acidPools.splice(i, 1);
    }
  }

  // Czyszczenie kałuż w rzece na Arenie 3 oraz limit maksymalnej liczby kałuż (max 6)
  if (arenaId === 'arena-3') {
    for (let i = hazardsState.acidPools.length - 1; i >= 0; i--) {
      if (hazardsState.acidPools[i].y >= 1280) {
        hazardsState.acidPools.splice(i, 1);
      }
    }
  }
  while (hazardsState.acidPools.length > 6) {
    hazardsState.acidPools.shift();
  }

  // Twardy limit na maksymalną liczbę beczek (max 6)
  while (hazardsState.barrels.length > 6) {
    hazardsState.barrels.shift();
  }

  // -------------------------------------------------------------------------
  // 3. KOLEJKA ODRADZANIA BECZEK (RESPAWN PO 35S DLA STAŁYCH PUNKTÓW)
  // -------------------------------------------------------------------------
  for (let i = hazardsState.respawnQueue.length - 1; i >= 0; i--) {
    const item = hazardsState.respawnQueue[i];
    item.timer -= dt;

    if (item.timer <= 0) {
      // Bezpieczne odrodzenie: weryfikacja czy podłoże w punkcie startowym nadal istnieje
      const spawnX = item.spawn.x + BARREL_CONFIG.WIDTH * 0.5;
      const surfaceY = getBarrelSurfaceY(spawnX, item.spawn.y + BARREL_CONFIG.HEIGHT, groundY);
      if (surfaceY !== Infinity && surfaceY < 1350) {
        const respawned = createBarrelInstance(item.spawn);
        respawned.y = surfaceY - respawned.h;
        respawned.onGround = true;
        hazardsState.barrels.push(respawned);
        spawnConcreteDebris(item.spawn.x + 13, surfaceY - 10, 6);
      } else {
        // Punkt zniszczony kraterem - odradzamy w innym bezpiecznym miejscu areny
        spawnRandomValidBarrel(arenaId, groundY);
      }
      hazardsState.respawnQueue.splice(i, 1);
    }
  }

  // -------------------------------------------------------------------------
  // 4. OKRESOWE ODRADZANIE NOWYCH BECZEK W LOSOWYCH MIEJSCACH ARENY
  // -------------------------------------------------------------------------
  if (arenaId !== 'arena-5') {
    hazardsState.randomSpawnTimer = (hazardsState.randomSpawnTimer || 20.0) - dt;
    if (hazardsState.randomSpawnTimer <= 0) {
      hazardsState.randomSpawnTimer = 18.0 + Math.random() * 12.0;
      const maxBarrels = 5;
      if (hazardsState.barrels.length < maxBarrels) {
        spawnRandomValidBarrel(arenaId, groundY);
      }
    }
  }
}

/**
 * Spawnuje nową beczkę w losowym, w pełni bezpiecznym i poprawnym miejscu areny
 */
export function spawnRandomValidBarrel(arenaId, groundY = 800) {
  const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
  const minX = (curArena?.bounds?.minX ?? 0) + 120;
  const maxX = (curArena?.bounds?.maxX ?? 3800) - 120;
  const isA2 = (arenaId === 'arena-2');
  const isA3 = (arenaId === 'arena-3');
  const isA4 = (arenaId === 'arena-4');
  const isA5 = (arenaId === 'arena-5');

  // W Arenie 5 (Tetris) beczki pojawiają się na klockach wieży (zero stałych platform)
  if (isA5) {
    return false;
  }

  const validPlatforms = [];
  if (Array.isArray(ARENA_PLATFORMS)) {
    for (const plat of ARENA_PLATFORMS) {
      if (!plat || plat.destroyed || plat.isDestroyed || plat.isWall || plat.solid === false || plat.isPlatform === false) continue;
      if (isA3 && (plat.id === 'ground_left' || plat.id === 'ground_right' || plat.id === 'riverbank_left_oval' || plat.id === 'riverbank_right_oval' || plat.id === 'world_boundary_left' || plat.id === 'world_boundary_right')) continue;
      const bnds = (typeof getPlatformBounds === 'function') ? getPlatformBounds(plat) : { minX: plat.x, maxX: plat.x + plat.w };
      const w = bnds.maxX - bnds.minX;
      if (w >= 36) {
        validPlatforms.push({ plat, minX: bnds.minX + 16, maxX: bnds.maxX - 16 });
      }
    }
  }

  const randTypeRoll = Math.random();
  const barrelType = randTypeRoll < 0.60 ? 'EXPLOSIVE' : (randTypeRoll < 0.85 ? 'TOXIC' : 'ORDNANCE');

  for (let attempt = 0; attempt < 20; attempt++) {
    let candX = 0;
    const usePlatform = (isA2 || (validPlatforms.length > 0 && Math.random() < 0.55));

    if (usePlatform && validPlatforms.length > 0) {
      const pChoice = validPlatforms[Math.floor(Math.random() * validPlatforms.length)];
      candX = pChoice.minX + Math.random() * Math.max(10, pChoice.maxX - pChoice.minX);
    } else {
      if (isA3) {
        const leftBank = Math.random() < 0.5;
        candX = leftBank
          ? (minX + Math.random() * (1550 - minX))
          : (2850 + Math.random() * (maxX - 2850));
      } else {
        candX = minX + Math.random() * (maxX - minX);
        const hasGroundL = (typeof window !== 'undefined' && typeof window.isGroundAt === 'function')
          ? window.isGroundAt(candX - 14, 0)
          : true;
        const hasGroundR = (typeof window !== 'undefined' && typeof window.isGroundAt === 'function')
          ? window.isGroundAt(candX + 14, 0)
          : true;
        if (!hasGroundL || !hasGroundR) continue;
      }
    }

    const surfaceY = getBarrelSurfaceY(candX, 300, groundY);
    if (surfaceY === Infinity || surfaceY > 1320) continue;

    if (isA2 && surfaceY >= 1350) continue;
    if (isA3 && surfaceY >= 1270) continue;
    if (isA4 && surfaceY >= 1350) continue;

    let tooClose = false;
    for (const b of hazardsState.barrels) {
      if (!b || b.isDead) continue;
      const bMidX = b.x + b.w * 0.5;
      const bFeetY = b.y + b.h;
      if (Math.hypot(bMidX - candX, bFeetY - surfaceY) < 85) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    const newBarrel = createBarrelInstance({
      type: barrelType,
      x: candX - BARREL_CONFIG.WIDTH * 0.5,
      y: surfaceY - BARREL_CONFIG.HEIGHT,
      id: `barrel_rand_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    });
    newBarrel.onGround = true;
    newBarrel.vx = 0;
    newBarrel.vy = 0;
    hazardsState.barrels.push(newBarrel);

    spawnDustCloud(candX, surfaceY - 8, 4);
    return true;
  }

  return false;
}

/**
 * Sprawdza czy gracz lub bot znajduje się w zasięgu kopnięcia beczki
 */
export function checkBarrelKickInteraction(char, isSlide = false) {
  if (!char || char.isDead) return null;

  const charMidX = char.x + (char.w || 24) * 0.5;
  const charFeetY = char.y + (char.h || 70);
  const facing = char.facing || 1;
  const reachX = isSlide ? 48 : 55;

  for (const b of hazardsState.barrels) {
    if (!b || b.isDead) continue;
    const bMidX = b.x + b.w * 0.5;
    const bFeetY = b.y + b.h;

    const dx = bMidX - charMidX;
    const dy = bFeetY - charFeetY;

    // Beczka musi znajdować się przed postacią w kierunku facing
    const isAhead = (dx * facing) >= -8 && (dx * facing) <= reachX;
    if (isAhead && Math.abs(dy) <= 32) {
      kickBarrel(b, char, isSlide);
      return b;
    }
  }
  return null;
}

if (typeof window !== 'undefined') {
  window.damageBarrel = damageBarrel;
  window.detonateBarrel = detonateBarrel;
}
