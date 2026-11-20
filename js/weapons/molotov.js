// =========================================================================
// WEAPONS/MOLOTOV.JS - KOKTAJL MOŁOTOWA (INCENDIARY THROWABLE WEAPON)
// Wykorzystuje sprite sheet ognia (assets/weapons/flame_spritesheet.svg):
// - Płonący knot butelki w locie (Row 2, Pilot flame 0..3)
// - Rozbryzg uderzeniowy po rozbiciu szkła (Row 2, Impact Splash 0..3)
// - Rozlane morze ognia na powierzchniach areny (Row 1, Surface Fire 0..7)
// Fizyka: natychmiastowe rozbicie przy uderzeniu, odłamki szkła, DoT i pożoga.
// =========================================================================

import { checkRayObstacleCollision, obstacles, ARENA_PLATFORMS, activeArenaId } from '../obstacles.js';
import { triggerScreenShake } from '../world.js';
import { isDeathmatchFFA, deathmatchState, deathmatchConfig } from '../deathmatch/index.js';
import { getActiveArena } from '../arenas/index.js';
import { ARENA_LEFT, ARENA_RIGHT, CONFIG } from '../config.js';
import { addDynamicLight } from '../lighting/index.js';
import { playSound } from '../audio/index.js';
import { getRiverbankGroundY } from '../arenas/arena3/state.js';
import { GROUND_Y } from '../world/state.js';
import { spawnExplosionFirePuff, spawnRicochetSparks, spawnPowderSmoke, spawnShockwaveRing } from '../particles.js';
import {
  getFlameSpritesheet,
  FLAME_CELL_SIZE,
  spawnSurfaceFire,
  spawnImpactSplash,
  igniteCombatant
} from './flamethrower.js';

export const MOLOTOV_SPRITE_PATH = './assets/weapons/molotov.png?v=v492_molotov_cocktail_spritesheet';
let _molotovSprite = null;

export function getMolotovSprite() {
  if (_molotovSprite) return _molotovSprite;
  if (typeof Image === 'undefined') return null;
  _molotovSprite = new Image();
  _molotovSprite.src = MOLOTOV_SPRITE_PATH;
  return _molotovSprite;
}

if (typeof window !== 'undefined') {
  getMolotovSprite();
}

/**
 * Pula dynamicznych odłamków tłuczonego szkła
 */
export const activeGlassShards = [];

export class GlassShard {
  constructor(x, y, baseVx = 0, baseVy = 0) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const spd = Math.random() * 5.5 + 2.2;
    this.vx = Math.cos(angle) * spd + baseVx * 0.22;
    this.vy = Math.sin(angle) * spd - Math.random() * 3.8;
    this.rot = Math.random() * Math.PI * 2;
    this.vRot = (Math.random() - 0.5) * 0.42;
    this.size = Math.random() * 2.8 + 1.6;
    this.life = 40 + Math.floor(Math.random() * 25);
    this.maxLife = this.life;

    const r = Math.random();
    this.color = r > 0.65 ? '#86efac' : (r > 0.35 ? '#fde047' : '#f8fafc');
  }

  update(groundY = 500, platforms = null) {
    this.vy += 0.32;
    this.vx *= 0.98;
    this.x += this.vx;
    this.y += this.vy;
    this.rot += this.vRot;

    if (this.y >= groundY - 2) {
      this.y = groundY - 2;
      this.vy = -this.vy * 0.35;
      this.vx *= 0.65;
      this.vRot *= 0.45;
    }

    this.life--;
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = Math.min(1.0, this.life / 18);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.globalAlpha = alpha * 0.88;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(0, -this.size * 1.2);
    ctx.lineTo(this.size * 0.7, this.size * 0.7);
    ctx.lineTo(-this.size * 0.6, this.size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export function spawnGlassShards(x, y, baseVx = 0, baseVy = 0, count = 16) {
  for (let i = 0; i < count; i++) {
    activeGlassShards.push(new GlassShard(x, y, baseVx, baseVy));
  }
  while (activeGlassShards.length > 60) {
    activeGlassShards.shift();
  }
}

export function updateGlassShards(groundY = 500, platforms = null) {
  for (let i = activeGlassShards.length - 1; i >= 0; i--) {
    const alive = activeGlassShards[i].update(groundY, platforms);
    if (!alive) {
      activeGlassShards.splice(i, 1);
    }
  }
}

export function drawGlassShards(ctx) {
  if (activeGlassShards.length === 0 || !ctx) return;
  for (let i = 0; i < activeGlassShards.length; i++) {
    activeGlassShards[i].draw(ctx);
  }
}

/**
 * Klasa pocisku koktajlu Mołotowa w locie (Molotov Cocktail)
 */
export class MolotovCocktail {
  constructor(shooter, targetX, targetY, customPower = 1.0, spawnOriginX = null, spawnOriginY = null) {
    this.id = 'molotov_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    this.shooter = shooter;
    this.shooterId = shooter ? (shooter.id || (shooter.isBot ? `bot_${shooter.botIndex}` : 'player')) : 'p_default';
    this.team = shooter?.team || (shooter?.isBot ? 'BOT' : (shooter?.isRemote ? 'P2' : 'P1'));

    const defStartX = shooter ? (shooter.x + shooter.w / 2 + (shooter.facing || 1) * 14) : targetX;
    const defStartY = shooter ? (shooter.y + shooter.h * 0.42) : targetY;
    const startX = (typeof spawnOriginX === 'number' && !isNaN(spawnOriginX)) ? spawnOriginX : defStartX;
    const startY = (typeof spawnOriginY === 'number' && !isNaN(spawnOriginY)) ? spawnOriginY : defStartY;

    this.x = startX;
    this.y = startY;
    this.prevX = startX;
    this.prevY = startY;

    const dx = targetX - startX;
    const dy = targetY - startY;
    const angle = Math.atan2(dy, dx);

    const speedMult = (typeof customPower === 'number' && customPower > 0) ? Math.max(0.35, Math.min(1.8, customPower)) : 1.0;
    const initialSpeed = (920 / 60) * speedMult;
    this.vx = Math.cos(angle) * initialSpeed + (shooter ? (shooter.vx || 0) * 0.32 : 0);
    this.vy = Math.sin(angle) * initialSpeed + (shooter ? (shooter.vy || 0) * 0.22 : 0) - (3.0 * Math.min(1.2, speedMult));

    this.radius = 8.5;
    this.rot = angle;
    this.vRot = (Math.random() * 0.12 + 0.16) * (this.vx >= 0 ? 1 : -1);

    this.life = 260; // Maks. czas lotu w powietrzu (~4.3s)
    this.flameTimer = Math.random() * 4;
    this.smokeTimer = 0;
    this.blastRadius = 140; // Promień rozbryzgu płomieni R = 140 px
    this.detonated = false;
  }

  update(groundY, platforms, customObs, combatants, ball) {
    if (this.detonated) return false;

    this.prevX = this.x;
    this.prevY = this.y;

    const grav = (CONFIG.GRAVITY || 0.38) * 0.94;
    this.vy += grav;
    this.vx *= 0.995;
    this.vy *= 0.995;

    this.x += this.vx;
    this.y += this.vy;
    this.rot += this.vRot;

    this.flameTimer += 0.24;
    this.smokeTimer++;

    // Dym i iskry z płonącego knota w locie
    if (this.smokeTimer % 3 === 0) {
      const wickOffX = -Math.sin(this.rot) * 12;
      const wickOffY = -Math.cos(this.rot) * 12;
      spawnRicochetSparks(this.x + wickOffX, this.y + wickOffY, (Math.random() - 0.5) * 1.5, -0.8, 1);
      if (this.smokeTimer % 6 === 0) {
        spawnPowderSmoke(this.x + wickOffX, this.y + wickOffY, 2);
      }
    }

    // Granice aktualnej areny
    const curArena = getActiveArena?.();
    const isA4 = (curArena?.id === 'arena-4' || activeArenaId === 'ARENA_4' || activeArenaId === 'arena-4' || activeArenaId === 'OBSIDIAN_CALDERA' || activeArenaId === 'CALDERA' || activeArenaId === 'OBSIDIAN');
    const isA3 = (curArena?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY');
    const isA2 = (curArena?.id === 'arena-2' || activeArenaId === 'ARENA_2' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'ARENA_2_SECTOR_X');
    const activePlats = platforms || ARENA_PLATFORMS;
    const arenaLeft = (typeof curArena?.bounds?.minX === 'number') ? curArena.bounds.minX : ARENA_LEFT;
    const arenaRight = isA3 ? 4400 : ((typeof curArena?.width === 'number') ? curArena.width : ((typeof curArena?.bounds?.maxX === 'number') ? curArena.bounds.maxX : ARENA_RIGHT));

    // 1. Uderzenie w boczne granice mapy
    if (this.x - this.radius <= arenaLeft) {
      this.x = arenaLeft + this.radius;
      this.shatter(groundY, activePlats, customObs, combatants, ball, { nx: 1, ny: 0 });
      return false;
    } else if (this.x + this.radius >= arenaRight) {
      this.x = arenaRight - this.radius;
      this.shatter(groundY, activePlats, customObs, combatants, ball, { nx: -1, ny: 0 });
      return false;
    }

    // 2. Kwas toksyczny (Arena 2)
    if (isA2) {
      const acidLevelY = (typeof curArena?.acidSurge?.currentY === 'number')
        ? curArena.acidSurge.currentY
        : (curArena?.hazardZoneY ?? 1440);
      if (this.y + this.radius >= acidLevelY) {
        if (typeof window.spawnAcidSplash === 'function') {
          window.spawnAcidSplash(this.x, acidLevelY, 16);
        }
        playSound('explosion_toxic', { x: this.x, y: acidLevelY });
        this.detonated = true;
        return false;
      }
    }

    // 3. Magma (Arena 4)
    if (isA4) {
      const oceanSurfaceY = 1380;
      if (this.y + this.radius >= oceanSurfaceY) {
        if (typeof window.spawnMagmaSplash === 'function') {
          window.spawnMagmaSplash(this.x, oceanSurfaceY, 18);
        }
        this.shatter(oceanSurfaceY, activePlats, customObs, combatants, ball, { nx: 0, ny: -1 });
        return false;
      }
    }

    // 4. Rzeka / Woda (Arena 3)
    if (isA3) {
      const gx = this.x;
      const terrainY = (typeof getRiverbankGroundY === 'function') ? getRiverbankGroundY(gx) : 1200;
      const inRiverZone = (gx >= 1650 && gx <= 2750);
      const waterSurfaceY = inRiverZone ? 1305 : 1345;
      const inWater = (inRiverZone && this.y + this.radius >= 1305) || (!inRiverZone && terrainY >= 1345 && this.y + this.radius >= 1345);

      if (inWater) {
        if (typeof window.spawnArena3WaterSplash === 'function') {
          window.spawnArena3WaterSplash(this.x, waterSurfaceY, 16);
        }
        // Woda gasi ogień – syczenie pary bez rozlewania ognia
        playSound('glass_shatter', { x: this.x, y: waterSurfaceY });
        spawnGlassShards(this.x, waterSurfaceY, this.vx * 0.2, -1.5, 12);
        this.detonated = true;
        return false;
      }

      // Zbocze leja krateru lub podłoże
      if (this.y + this.radius >= terrainY) {
        this.y = terrainY - this.radius;
        let slope = 0;
        if (typeof getRiverbankGroundY === 'function') {
          slope = (getRiverbankGroundY(gx + 4) - getRiverbankGroundY(gx - 4)) / 8;
        }
        const len = Math.hypot(slope, 1);
        const nx = slope / len;
        const ny = -1 / len;
        this.shatter(terrainY, activePlats, customObs, combatants, ball, { nx, ny });
        return false;
      }
    }

    // 5. Uderzenie w standardowe podłoże areny
    if (!isA3 && this.y + this.radius >= groundY) {
      this.y = groundY - this.radius;
      this.shatter(groundY, activePlats, customObs, combatants, ball, { nx: 0, ny: -1 });
      return false;
    }

    // 6. Kolizje z platformami (np. most, konstrukcje stalowe)
    if (Array.isArray(activePlats)) {
      for (const plat of activePlats) {
        if (!plat) continue;
        const pLeft = plat.x;
        const pRight = plat.x + plat.w;
        const topY = plat.y;
        const bottomY = plat.y + (plat.h || 10);

        if (this.x + this.radius >= pLeft && this.x - this.radius <= pRight) {
          // Lądowanie na wierzchu platformy
          if (this.vy > 0 && this.prevY + this.radius <= topY + 8 && this.y + this.radius >= topY - 2) {
            this.y = topY - this.radius;
            this.shatter(topY, activePlats, customObs, combatants, ball, { nx: 0, ny: -1 });
            return false;
          }
          // Spód platformy litej
          else if (!plat.oneWay && this.vy < 0 && this.prevY - this.radius >= bottomY - 8 && this.y - this.radius <= bottomY + 2) {
            this.y = bottomY + this.radius;
            this.shatter(bottomY, activePlats, customObs, combatants, ball, { nx: 0, ny: 1 });
            return false;
          }
        }
      }
    }

    // 7. Kolizje z przeszkodami i klockami Tetrisa w Arenie 5
    const obs = customObs || obstacles;
    const mapHit = checkRayObstacleCollision(this.prevX, this.prevY, this.x, this.y, groundY, obs, null);
    if (mapHit && mapHit.hit) {
      this.x = mapHit.x;
      this.y = mapHit.y;
      this.shatter(groundY, activePlats, customObs, combatants, ball, { nx: mapHit.nx || 0, ny: mapHit.ny || -1 });
      return false;
    }

    // 8. Bezpośrednie trafienie we wrogą postać / bota / zombie
    const targets = Array.isArray(combatants) ? combatants : [];
    for (const ch of targets) {
      if (!ch || ch === this.shooter || ch.isDead) continue;
      const chCenterX = ch.x + (ch.w || 24) * 0.5;
      const chCenterY = ch.y + (ch.h || 70) * 0.45;
      const dist = Math.hypot(chCenterX - this.x, chCenterY - this.y);

      if (dist <= this.radius + Math.min(ch.w || 24, ch.h || 70) * 0.5) {
        const nx = (this.x - chCenterX) / (dist || 1);
        const ny = (this.y - chCenterY) / (dist || 1);
        this.shatter(groundY, activePlats, customObs, combatants, ball, { nx, ny });
        return false;
      }
    }

    this.life--;
    if (this.life <= 0) {
      this.shatter(groundY, activePlats, customObs, combatants, ball, { nx: 0, ny: -1 });
      return false;
    }

    return true;
  }

  shatter(groundY, platforms, customObs, combatants, ball, hitNormal = { nx: 0, ny: -1 }) {
    if (this.detonated) return;
    this.detonated = true;

    detonateMolotovExplosion(
      this.x,
      this.y,
      this.blastRadius,
      this.shooter,
      groundY,
      platforms,
      customObs,
      combatants,
      ball,
      hitNormal
    );
  }

  draw(ctx) {
    if (this.detonated || !ctx) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);

    const img = getMolotovSprite();
    const sheet = getFlameSpritesheet();

    if (img && img.complete && img.naturalWidth > 0) {
      // Skalowanie sprajtu PNG butelki z naftą (wysokość ~32 px)
      const scale = 0.034;
      const pvtX = 165;
      const pvtY = 560;
      ctx.save();
      ctx.scale(scale, scale);
      ctx.drawImage(img, -pvtX, -pvtY);
      ctx.restore();
    } else {
      // Rezerwowy wektorowy model butelki z płynem i knotem
      ctx.fillStyle = '#1e3a1e'; // Ciemnozielone szkło
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 0.8;

      // Korpus
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-4.5, -5, 9, 16, 2);
      else ctx.rect(-4.5, -5, 9, 16);
      ctx.fill();
      ctx.stroke();

      // Poziom płonącego paliwa w butelce
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-3.5, 0, 7, 10);

      // Szyjka butelki
      ctx.fillStyle = '#1e3a1e';
      ctx.fillRect(-2, -12, 4, 7);

      // Płócienny knot wetknięty w szyjkę
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(-1.5, -16, 3, 4);
    }

    // =========================================================================
    // PŁONĄCY KNOT ZE SPRITE SHEETU (assets/weapons/flame_spritesheet.svg)
    // Row 2, Pilot flame (klatki 0..3) - dynamicznie migoczący ogień przy szyjce
    // =========================================================================
    const wickLocalY = -15.5;
    if (sheet && sheet.complete && sheet.naturalWidth > 0) {
      const flameIdx = Math.floor(this.flameTimer) % 4;
      const sx = flameIdx * FLAME_CELL_SIZE;
      const sy = 2 * FLAME_CELL_SIZE; // Row 2
      const flameSize = 28;

      ctx.save();
      ctx.translate(0, wickLocalY);
      ctx.rotate(-Math.PI * 0.5); // Obrót w górę wzdłuż osi butelki
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.95;
      ctx.drawImage(sheet, sx, sy, FLAME_CELL_SIZE, FLAME_CELL_SIZE, -flameSize * 0.5, -flameSize * 0.7, flameSize, flameSize);
      ctx.restore();
    } else {
      // Rezerwowy płomień wektorowy
      ctx.save();
      ctx.translate(0, wickLocalY);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-2.5, 0);
      ctx.lineTo(0, -6 - Math.sin(this.flameTimer * 3) * 2);
      ctx.lineTo(2.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}

/**
 * Detonacja koktajlu Mołotowa:
 * 1. Dźwięk tłuczonego szkła + basowa eksplozja zapalająca
 * 2. Odłamki szkła GlassShard
 * 3. Rozbryzg ognia ImpactSplash ze sprite sheetu
 * 4. Obrażenia obszarowe i natychmiastowe podpalenie DoT
 * 5. Rozlanie 5 połączonych kałuż ognia SurfaceFire na podłożu
 */
export function detonateMolotovExplosion(expX, expY, radius, shooter, groundY, platforms, customObs, combatants, ball, hitNormal = { nx: 0, ny: -1 }) {
  playSound('glass_shatter', { x: expX, y: expY });
  playSound('explosion_grenade', { x: expX, y: expY });

  triggerScreenShake(8);
  addDynamicLight({
    x: expX,
    y: expY,
    radius: 220,
    color: '#f97316',
    intensity: 0.95,
    duration: 0.35
  });

  // 1. Snop ostrych odłamków szkła
  spawnGlassShards(expX, expY, 0, 0, 18);

  // 2. Efekty kinowe: fala uderzeniowa i rozbryzg zapalający ze sprite sheetu
  spawnShockwaveRing(expX, expY);
  spawnExplosionFirePuff(expX, expY, 14);
  spawnImpactSplash(expX, expY, hitNormal.nx || 0, hitNormal.ny || -1);

  // 3. Obrażenia bezpośrednie i podpalenie postaci
  const targets = Array.isArray(combatants) ? [...combatants] : [];
  if (typeof window !== 'undefined' && typeof window.getActiveZombies === 'function') {
    const az = window.getActiveZombies();
    for (const z of az) {
      if (z && !targets.includes(z)) targets.push(z);
    }
  }

  const isFFA = (typeof isDeathmatchFFA === 'function' ? isDeathmatchFFA() : false) ||
    (deathmatchState && deathmatchState.mode === 'FFA') ||
    (deathmatchConfig && deathmatchConfig.mode === 'FFA');

  for (const ch of targets) {
    if (!ch) continue;
    const isLyingZombie = !!(ch.isZombie && ch.isDead && ch.hasHead && !ch.decapitated);
    if (ch.isZombie) {
      if (ch.isDead && !isLyingZombie) continue;
      ch.spawnProtectionTimer = 0;
    } else {
      if (ch.isDead) continue;
      if (ch.spawnProtectionTimer && ch.spawnProtectionTimer > 0) continue;
    }

    if (!isFFA && !ch.isZombie && shooter && shooter !== ch && shooter.team && ch.team && shooter.team === ch.team) {
      continue;
    }

    const chCenterX = ch.x + (ch.w || 24) * 0.5;
    const chCenterY = ch.y + (ch.h || 70) * 0.45;
    const dist = Math.hypot(chCenterX - expX, chCenterY - expY);

    if (dist <= radius) {
      const factor = Math.max(0, 1.0 - (dist / radius));
      const damage = Math.round(95 * factor);
      const impulse = factor * 14.0;
      const normX = dist > 0.001 ? (chCenterX - expX) / dist : (ch.facing || 1);
      const normY = dist > 0.001 ? (chCenterY - expY) / dist : -0.7;

      ch.vx += normX * impulse;
      ch.vy += normY * impulse - 2.5;
      ch.hp = (ch.hp !== undefined ? ch.hp : 100) - damage;

      // Status podpalenia postaci na 3 sekundy (180 klatek)
      igniteCombatant(ch, shooter, 180);
    }
  }

  // 4. Podpalenie i odrzut piłki
  if (ball) {
    const bDist = Math.hypot(ball.x - expX, ball.y - expY);
    if (bDist <= radius + (ball.colRadius || 5.2)) {
      ball.burnTimer = 180;
      const bFactor = Math.max(0, 1.0 - (bDist / radius));
      ball.vx += ((ball.x - expX) / (bDist || 1)) * bFactor * 12.0;
      ball.vy += ((ball.y - expY) / (bDist || 1)) * bFactor * 12.0 - 2.5;
    }
  }

  // 5. Rozlanie morza ognia na powierzchni (Surface Fire ze sprite sheetu)
  // Generujemy wachlarz 5 kałuż ognia na podłożu wokół punktu uderzenia
  const spreadOffsets = [-68, -34, 0, 34, 68];
  const curArena = getActiveArena?.();
  const isA3 = (curArena?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3');

  for (const dx of spreadOffsets) {
    const puddleX = expX + dx;
    let puddleY = expY;
    let puddleNx = hitNormal.nx || 0;
    let puddleNy = hitNormal.ny || -1;

    // Próbkowanie podłoża
    if (isA3 && typeof getRiverbankGroundY === 'function') {
      const terrY = getRiverbankGroundY(puddleX);
      if (Math.abs(terrY - expY) < 65) {
        puddleY = terrY;
        const slope = (getRiverbankGroundY(puddleX + 4) - getRiverbankGroundY(puddleX - 4)) / 8;
        const sLen = Math.hypot(slope, 1);
        puddleNx = slope / sLen;
        puddleNy = -1 / sLen;
      }
    } else if (platforms && Array.isArray(platforms)) {
      // Sprawdzenie czy kałuża ląduje na pobliskiej platformie
      for (const plat of platforms) {
        if (!plat) continue;
        if (puddleX >= plat.x && puddleX <= plat.x + plat.w && Math.abs(plat.y - expY) < 30) {
          puddleY = plat.y;
          puddleNx = 0;
          puddleNy = -1;
          break;
        }
      }
    }

    spawnSurfaceFire(puddleX, puddleY, puddleNx, puddleNy, shooter, shooter?.team);
  }
}

/**
 * Wystrzelenie pocisku koktajlu Mołotowa
 */
export function spawnMolotovCocktail(shooter, targetX, targetY, customPower = 1.0, spawnOriginX = null, spawnOriginY = null) {
  const molotov = new MolotovCocktail(shooter, targetX, targetY, customPower, spawnOriginX, spawnOriginY);
  if (typeof window !== 'undefined' && Array.isArray(window.activeProjectiles)) {
    window.activeProjectiles.push(molotov);
  }
  return molotov;
}

/**
 * Rysowanie koktajlu Mołotowa w dłoni rzucającego gracza
 */
export function drawHandheldMolotov(ctx, x, y, scale = 1.0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(-0.85);

  const img = getMolotovSprite();
  const sheet = getFlameSpritesheet();

  if (img && img.complete && img.naturalWidth > 0) {
    const s = 0.026;
    ctx.save();
    ctx.scale(s, s);
    ctx.drawImage(img, -165, -560);
    ctx.restore();
  } else {
    ctx.fillStyle = '#1e3a1e';
    ctx.fillRect(-3, -5, 6, 12);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-2, -1, 4, 7);
  }

  // Płonący knot w dłoni
  if (sheet && sheet.complete && sheet.naturalWidth > 0) {
    const flameIdx = Math.floor(performance.now() * 0.008) % 4;
    const sx = flameIdx * FLAME_CELL_SIZE;
    const sy = 2 * FLAME_CELL_SIZE;
    const flameSize = 22;

    ctx.save();
    ctx.translate(0, -14);
    ctx.rotate(-Math.PI * 0.5);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.95;
    ctx.drawImage(sheet, sx, sy, FLAME_CELL_SIZE, FLAME_CELL_SIZE, -flameSize * 0.5, -flameSize * 0.7, flameSize, flameSize);
    ctx.restore();
  }
  ctx.restore();
}
