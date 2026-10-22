// =========================================================================
// PROJECTILES.JS - POCISKI SPECJALNE I SUPER-GRANAT DLA KLASY AERO
// Warstwa 1 / 2: Mechanika wybuchowa, niszczenie terenu i odłamki gruzu
// =========================================================================

import { CONFIG, ARENA_LEFT, ARENA_RIGHT } from './config.js';
import { getActiveArena } from './arenas/index.js';
import { triggerScreenShake, triggerHitstop, spawnBloodSpurt, spawnBloodFountain, spawnHeadGib, spawnLimbGib, spawnBodyGibs, spawnDroppedWeapon, camera, shakeImpulse, carveGroundHole, isGroundAt } from './world.js';
import { DEFAULT_VISUALS } from './player/hair.js';
import { getActiveBots } from './bot.js';
import { ARENA_PLATFORMS, customObstacles, obstacles, activeArenaId, getPlatformSurfaceY, registerArenaResetCallback } from './obstacles.js';
import { deathmatchState, deathmatchConfig, isDeathmatchFFA } from './deathmatch/index.js';
import { getRiverbankGroundY } from './arenas/arena3/state.js';
import {
  spawnShrapnelStreak,
  spawnRicochetSparks,
  spawnConcreteDebris,
  spawnPowderSmoke,
  spawnDustCloud,
  spawnShockwaveRing,
  spawnExplosionFirePuff,
  spawnStretchedSparks,
  spawnHeavySmokePuff,
  spawnJuiceExplosion,
  updateExplosionParticles,
  drawDustClouds,
  drawConcreteDebris,
  drawShrapnelStreaks,
  drawRicochetSparks,
  drawPowderSmoke,
  drawExplosionSmokeBackground,
  drawExplosionFireAndSparks,
  drawGrenadeJuiceExplosion,
  clearExplosionParticles
} from './particles.js';

const GRENADE_SPRITE_PATH = './assets/weapons/grenade.png?v=v257_m67_grenade_gameplay_sprite';
let _grenadeSprite = null;

function getGrenadeSprite() {
  if (_grenadeSprite) return _grenadeSprite;
  if (typeof Image === 'undefined') return null;
  _grenadeSprite = new Image();
  _grenadeSprite.src = GRENADE_SPRITE_PATH;
  return _grenadeSprite;
}

if (typeof window !== 'undefined') {
  getGrenadeSprite();
}

const AXE_SPRITE_PATH = './assets/weapons/axe.png?v=v256_modular_melee_weapons';
let _axeSprite = null;

function getAxeSprite() {
  if (_axeSprite) return _axeSprite;
  if (typeof Image === 'undefined') return null;
  _axeSprite = new Image();
  _axeSprite.src = AXE_SPRITE_PATH;
  return _axeSprite;
}

if (typeof window !== 'undefined') {
  getAxeSprite();
}

export const activeProjectiles = [];
export const rubbleParticles = [];
export const explosionEffects = [];
export const explosionCraters = [];

/**
 * Klasa super-granatu dla klasy Aero
 */
export class AeroSuperGrenade {
  constructor(shooter, targetX, targetY, customPower = 1.0, spawnOriginX = null, spawnOriginY = null, initialFuse = null) {
    this.id = 'grenade_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    this.shooter = shooter;
    this.team = shooter?.team || (shooter?.isBot ? 'BOT' : (shooter?.isRemote ? 'P2' : 'P1'));

    // Punkt startowy z dłoni gracza / klatki piersiowej
    const defStartX = shooter ? (shooter.x + shooter.w / 2 + (shooter.facing || 1) * 14) : targetX;
    const defStartY = shooter ? (shooter.y + shooter.h * 0.42) : targetY;
    const startX = (typeof spawnOriginX === 'number' && !isNaN(spawnOriginX)) ? spawnOriginX : defStartX;
    const startY = (typeof spawnOriginY === 'number' && !isNaN(spawnOriginY)) ? spawnOriginY : defStartY;

    this.x = startX;
    this.y = startY;
    this.prevX = startX;
    this.prevY = startY;

    // Kąt wzdłuż celownika
    const dx = targetX - startX;
    const dy = targetY - startY;
    const angle = Math.atan2(dy, dx);

    // Prędkość początkowa skalowana siłą rzutu (dynamiczny zasięg taktyczny 700-900px):
    const speedMult = (typeof customPower === 'number' && customPower > 0) ? Math.max(0.35, Math.min(1.8, customPower)) : 1.0;
    const initialSpeed = (960 / 60) * speedMult;
    this.vx = Math.cos(angle) * initialSpeed + (shooter ? (shooter.vx || 0) * 0.35 : 0);
    this.vy = Math.sin(angle) * initialSpeed + (shooter ? (shooter.vy || 0) * 0.25 : 0) - (3.2 * Math.min(1.2, speedMult));

    this.radius = 9;
    this.rot = angle;
    this.vRot = (Math.random() * 0.15 + 0.18) * (this.vx >= 0 ? 1 : -1);

    this.bounces = 0;
    this.maxBounces = 5;
    this.restitution = 0.58;

    // Zapalnik czasowy: 5.0 sekund (300 klatek przy 60 FPS), liczony od startu celowania
    this.maxFuse = 300;
    this.fuse = (typeof initialFuse === 'number' && !isNaN(initialFuse) && initialFuse > 0)
      ? Math.max(1, Math.min(300, Math.round(initialFuse)))
      : 300;
    this.detonated = false;

    this.blastRadius = 145; // Promień wybuchu R = 130-150 px
    this.smokeTimer = 0;
  }

  update(groundY, platforms, customObs, combatants, ball) {
    if (this.detonated) return false;

    this.prevX = this.x;
    this.prevY = this.y;

    // Standardowa grawitacja gry
    const grav = (CONFIG.GRAVITY || 0.38) * 0.95;
    this.vy += grav;

    this.x += this.vx;
    this.y += this.vy;
    this.rot += this.vRot;

    // Dymna smuga pocisku
    this.smokeTimer++;
    if (this.smokeTimer % 2 === 0) {
      spawnGrenadeSmokePuff(this.x, this.y);
    }

    // Określenie granic aktualnej areny
    const curArena = getActiveArena?.();
    const isA3 = (curArena?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY');
    const isA2 = (curArena?.id === 'arena-2' || activeArenaId === 'ARENA_2' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'ARENA_2_SECTOR_X');
    const activePlats = platforms || ARENA_PLATFORMS;
    const arenaLeft = (typeof curArena?.bounds?.minX === 'number') ? curArena.bounds.minX : ARENA_LEFT;
    const arenaRight = isA3 ? 4400 : ((typeof curArena?.width === 'number') ? curArena.width : ((typeof curArena?.bounds?.maxX === 'number') ? curArena.bounds.maxX : ARENA_RIGHT));

    // 1. Odbicia od bocznych granic mapy
    if (this.x - this.radius <= arenaLeft) {
      this.x = arenaLeft + this.radius;
      this.vx = -this.vx * this.restitution;
      this.vRot = -this.vRot * 0.8;
      this.bounces++;
    } else if (this.x + this.radius >= arenaRight) {
      this.x = arenaRight - this.radius;
      this.vx = -this.vx * this.restitution;
      this.vRot = -this.vRot * 0.8;
      this.bounces++;
    }

    // 2. Odbicie od poziomu terenu / rzeki / kwasu
    if (isA2) {
      const acidLevelY = (typeof curArena?.acidSurge?.currentY === 'number')
        ? curArena.acidSurge.currentY
        : (curArena?.hazardZoneY ?? 1440);
      if (this.y + this.radius >= acidLevelY) {
        if (this.prevY + this.radius < acidLevelY) {
          if (typeof window.spawnAcidSplash === 'function') {
            window.spawnAcidSplash(this.x, acidLevelY, 14);
          }
        }
        // Wyporność, gęstość i opór kwasu (granat powoli tonie i detonuje wyłącznie po czasie 5s)
        this.vx *= 0.82;
        this.vy = Math.min(1.2, (this.vy + 0.06) * 0.74);
        this.vRot *= 0.72;
      }
    } else if (isA3) {
      const gx = this.x;
      const terrainY = (typeof getRiverbankGroundY === 'function') ? getRiverbankGroundY(gx) : 1200;

      // Woda rzeki (X: 1650 do 2750, lustro wody Y: 1305) lub woda gruntowa na dnie krateru (Y >= 1345)
      const inRiverZone = (gx >= 1650 && gx <= 2750);
      const waterSurfaceY = inRiverZone ? 1305 : 1345;
      const inWater = (inRiverZone && this.y + this.radius >= 1305) || (!inRiverZone && terrainY >= 1345 && this.y + this.radius >= 1345);

      if (inWater) {
        // Wejście do wody: rozbryzg wodny
        if (this.prevY + this.radius < waterSurfaceY) {
          if (typeof window.spawnArena3WaterSplash === 'function') {
            window.spawnArena3WaterSplash(this.x, waterSurfaceY, inRiverZone ? 14 : 8);
          }
        }
        // Wyporność, opór wody i tłumienie prędkości
        this.vx *= 0.84;
        this.vy = Math.min(1.4, (this.vy + 0.08) * 0.76);
        this.vRot *= 0.75;
      }

      // Odbicie i toczenie się po zboczu krateru lub podłożu
      if (this.y + this.radius >= terrainY) {
        this.y = terrainY - this.radius;

        let slope = 0;
        if (typeof getRiverbankGroundY === 'function') {
          slope = (getRiverbankGroundY(gx + 4) - getRiverbankGroundY(gx - 4)) / 8;
        }

        // Wektor normalny powierzchni (skierowany w stronę powietrza / ku górze): N = (slope, -1) / L
        const len = Math.hypot(slope, 1);
        const nx = slope / len;
        const ny = -1 / len;

        // Składowa prędkości wzdłuż normalnej (wnikanie w grunt: vDotN < 0)
        const vDotN = this.vx * nx + this.vy * ny;

        if (vDotN < -0.6 && this.bounces < this.maxBounces) {
          // Dynamiczne odbicie fizyczne od nachylonej powierzchni krateru
          const rest = inWater ? 0.22 : (this.restitution * 0.7);
          this.vx = (this.vx - (1 + rest) * vDotN * nx) * (inWater ? 0.65 : 0.85);
          this.vy = (this.vy - (1 + rest) * vDotN * ny) * (inWater ? 0.65 : 0.85);
          this.vRot *= 0.75;
          this.bounces++;
        } else {
          // Toczenie się / zsuwanie po pochyłości leja krateru
          // Grawitacja ściąga granat w dół zbocza ku najniższemu punktowi leja
          if (Math.abs(slope) > 0.02) {
            this.vx += slope * (inWater ? 0.22 : 0.42);
            this.vx *= (inWater ? 0.88 : 0.94);
            this.vy = this.vx * slope;
            this.vRot = (this.vx / this.radius) * 0.8;
          } else {
            // Płaskie dno leja krateru - wytłumienie i spoczynek
            this.vy = 0;
            this.vx *= (inWater ? 0.75 : 0.82);
            if (Math.abs(this.vx) < 0.1) {
              this.vx = 0;
              this.vRot = 0;
            }
          }
        }
      }
    } else {
      const hasGround = (typeof isGroundAt === 'function') ? isGroundAt(this.x, 2) : true;
      if (hasGround && this.y + this.radius >= groundY) {
        this.y = groundY - this.radius;
        this.vy = -this.vy * this.restitution;
        this.vx *= 0.82;
        this.vRot *= 0.75;
        this.bounces++;
        if (this.bounces > this.maxBounces) {
          this.vy = 0;
          this.vx *= 0.65;
        }
      }
    }

    // 3. Kolizje z platformami, ścianami i pylonami
    if (Array.isArray(activePlats)) {
      for (const plat of activePlats) {
        if (!plat || plat.solid === false) continue;
        // W Arenie 3 podłoże i granice canvasa (0 oraz 4400) są w pełni modelowane w sekcji 1 i 2
        if (isA3 && (plat.id === 'ground_left' || plat.id === 'ground_right' || plat.id === 'riverbank_left_oval' || plat.id === 'riverbank_right_oval' || plat.id === 'world_boundary_left' || plat.id === 'world_boundary_right')) {
          continue;
        }
        const platX = plat.x;
        const platW = plat.w;
        const thick = plat.h || plat.thickness || 20;
        const topY = (plat.surfacePoints && typeof getPlatformSurfaceY === 'function')
          ? getPlatformSurfaceY(plat, this.x, groundY)
          : ((plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0)));
        const bottomY = topY + thick;

        // A. Pionowe słupy nośne i ściany (np. tower_cyan_stem, tower_orange_stem, isWall)
        if ((plat.isWall || plat.pushSide) && plat.solid !== false) {
          if (this.y + this.radius >= topY && this.y - this.radius <= bottomY) {
            // Kolizja boczna z lewej strony słupa
            if (this.prevX + this.radius <= platX + 4 && this.x + this.radius >= platX) {
              this.x = platX - this.radius;
              this.vx = -Math.abs(this.vx) * this.restitution;
              this.bounces++;
              break;
            }
            // Kolizja boczna z prawej strony słupa
            else if (this.prevX - this.radius >= platX + platW - 4 && this.x - this.radius <= platX + platW) {
              this.x = platX + platW + this.radius;
              this.vx = Math.abs(this.vx) * this.restitution;
              this.bounces++;
              break;
            }
          }
          continue;
        }

        // B. Kolizje z platformami poziomymi i skośnymi
        if (this.x >= platX - this.radius && this.x <= platX + platW + this.radius) {
          // Lądowanie / odbicie od górnej powierzchni platformy
          if (this.vy > 0 && this.prevY + this.radius <= topY + 10 && this.y + this.radius >= topY - 6) {
            this.y = topY - this.radius;
            // Dla ramp nadajemy impuls wzdłuż nachylenia
            if (plat.isSlope || plat.isRampBlock) {
              this.vy = -this.vy * this.restitution * 0.85;
              this.vx = (this.vx + (plat.startY < plat.endY ? 1.2 : -1.2)) * 0.88;
            } else {
              this.vy = -this.vy * this.restitution;
              this.vx *= 0.85;
            }
            this.vRot *= 0.75;
            this.bounces++;
            break;
          }
          // Odbicie od spodu platformy (tylko dla platform litych, nie one-way)
          else if (!plat.oneWay && this.vy < 0 && this.prevY - this.radius >= bottomY - 8 && this.y - this.radius <= bottomY + 4) {
            this.y = bottomY + this.radius;
            this.vy = -this.vy * this.restitution;
            this.bounces++;
            break;
          }
        }
      }
    }

    // 3B. Kolizje z pylonami mostu Areny 3 (ARENA_3_PYLONS)
    if (isA3 && typeof window !== 'undefined' && window.ARENA_3_PYLONS) {
      for (const side of ['left', 'right']) {
        const pylon = window.ARENA_3_PYLONS[side];
        if (!pylon || !pylon.intact) continue;
        const pLeft = pylon.x - 28;
        const pRight = pylon.x + 28;
        const pTop = pylon.topY;
        const pBottom = pylon.caissonBottomY || 1395;
        if (this.y + this.radius >= pTop && this.y - this.radius <= pBottom) {
          if (this.prevX + this.radius <= pLeft + 4 && this.x + this.radius >= pLeft) {
            this.x = pLeft - this.radius;
            this.vx = -Math.abs(this.vx) * this.restitution;
            this.bounces++;
            break;
          } else if (this.prevX - this.radius >= pRight - 4 && this.x - this.radius <= pRight) {
            this.x = pRight + this.radius;
            this.vx = Math.abs(this.vx) * this.restitution;
            this.bounces++;
            break;
          }
        }
      }
    }

    // 4. Detekcja bezpośredniego kontaktu z wrogim graczem / botem (odbicie rykoszetem, detonacja WYŁĄCZNIE po 5s)
    if (Array.isArray(combatants)) {
      for (const ch of combatants) {
        if (!ch || ch === this.shooter || ch.isDead) continue;
        const chCenterX = ch.x + ch.w / 2;
        const chCenterY = ch.y + ch.h / 2;
        const distToChar = Math.hypot(chCenterX - this.x, chCenterY - this.y);

        if (distToChar <= this.radius + Math.min(ch.w, ch.h) * 0.55) {
          // Odbicie od ciała przeciwnika ze stratą energii
          const hitAngle = Math.atan2(this.y - chCenterY, this.x - chCenterX);
          this.vx = Math.cos(hitAngle) * Math.max(2.2, Math.abs(this.vx) * 0.55);
          this.vy = Math.sin(hitAngle) * Math.max(1.8, Math.abs(this.vy) * 0.55);
          this.vRot = (Math.random() - 0.5) * 0.35;
          this.bounces++;
          break;
        }
      }
    }

    // Iskry zapalnika ostrzegające przed eksplozją w ostatnich 1.5 sekundy
    if (this.fuse < 90 && this.fuse % 4 === 0) {
      spawnRicochetSparks(this.x, this.y - 6, (Math.random() - 0.5) * 2, -1, 1);
    }

    // 5. Odliczanie zapalnika czasowego (5.0 sekund = 300 klatek)
    this.fuse--;
    if (this.fuse <= 0) {
      this.detonate(groundY, activePlats, customObs, combatants, ball);
      return false;
    }

    return true;
  }

  detonate(groundY, platforms, customObs, combatants, ball) {
    if (this.detonated) return;
    this.detonated = true;

    detonateGrenadeExplosion(this.x, this.y, this.blastRadius, this.shooter, groundY, platforms, customObs, combatants, ball, 'GRENADE');
  }

  draw(ctx) {
    if (this.detonated) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);

    const img = getGrenadeSprite();
    if (img && img.complete && img.naturalWidth > 0) {
      // Skalowanie fotorealistycznego modelu M67 HE do promienia fizyki (radius = 8)
      const s = 0.0212;
      ctx.save();
      ctx.scale(s, s);
      ctx.drawImage(img, -333, -520);
      ctx.restore();

      // Pulsująca czerwona dioda zapalnika – spokojne tykanie, przyspieszające pod koniec
      const progress = Math.max(0, Math.min(1, (this.maxFuse - this.fuse) / this.maxFuse));
      const blinkSpeed = 0.08 + Math.pow(progress, 2.5) * 0.70;
      const isLit = (Math.sin(this.fuse * blinkSpeed) > 0);

      ctx.fillStyle = isLit ? '#ef4444' : '#450a0a';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = isLit ? (progress > 0.7 ? 14 : 7) : 0;
      ctx.beginPath();
      ctx.arc(0, -9.5, 2.0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Korpuc granatu – taktyczny wojskowy aero-kanister (fallback proceduralny)
      ctx.fillStyle = '#2d3748';
      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-6, -9, 12, 18, 4);
      else ctx.rect(-6, -9, 12, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#65a30d';
      ctx.fillRect(-6, -2, 12, 4);

      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-2, -12, 4, 3);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(2, -11);
      ctx.lineTo(6, -6);
      ctx.lineTo(6, 4);
      ctx.stroke();

      const progress = Math.max(0, Math.min(1, (this.maxFuse - this.fuse) / this.maxFuse));
      const blinkSpeed = 0.08 + Math.pow(progress, 2.5) * 0.70;
      const isLit = (Math.sin(this.fuse * blinkSpeed) > 0);

      ctx.fillStyle = isLit ? '#ef4444' : '#450a0a';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = isLit ? (progress > 0.7 ? 14 : 7) : 0;
      ctx.beginPath();
      ctx.arc(0, -5, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

/**
 * Wystrzelenie super-granatu z postaci
 */
export function spawnAeroSuperGrenade(shooter, targetX, targetY, customPower = 1.0, spawnOriginX = null, spawnOriginY = null, initialFuse = null) {
  const grenade = new AeroSuperGrenade(shooter, targetX, targetY, customPower, spawnOriginX, spawnOriginY, initialFuse);
  activeProjectiles.push(grenade);
  if (typeof window !== 'undefined' && Array.isArray(window.activeProjectiles) && window.activeProjectiles !== activeProjectiles) {
    window.activeProjectiles.push(grenade);
  }
  return grenade;
}

/**
 * Rzucony Toporek Tomahawk (Thrown Ballistic Tomahawk)
 * - Dynamiczny, rotujący pocisk balistyczny o wysokiej kinetyce i druzgocących obrażeniach
 * - Odbija piłkę, dekapituje / szatkuje wrogów, wbija się w podłoże i platformy
 * - Pozostaje na ziemi (GROUNDED) i może zostać podniesiony przez gracza (odzyskanie broni)
 * - Po śmierci gracza automatycznie powraca do ekwipunku postaci przy respawnie
 */
export class ThrownTomahawk {
  constructor(shooter, targetX, targetY, customPower = 1.0, spawnOriginX = null, spawnOriginY = null) {
    this.id = 'tomahawk_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    this.type = 'TOMAHAWK';
    this.shooter = shooter;
    this.team = shooter?.team || (shooter?.isBot ? 'BOT' : (shooter?.isRemote ? 'P2' : 'P1'));

    const defStartX = shooter ? (shooter.x + (shooter.w || 24) * 0.5 + (shooter.facing || 1) * 16) : targetX;
    const defStartY = shooter ? (shooter.y + (shooter.h || 70) * 0.40) : targetY;
    const startX = (typeof spawnOriginX === 'number' && !isNaN(spawnOriginX)) ? spawnOriginX : defStartX;
    const startY = (typeof spawnOriginY === 'number' && !isNaN(spawnOriginY)) ? spawnOriginY : defStartY;

    this.x = startX;
    this.y = startY;
    this.prevX = startX;
    this.prevY = startY;

    const dx = targetX - startX;
    const dy = targetY - startY;
    const angle = Math.atan2(dy, dx);

    const speedMult = (typeof customPower === 'number' && customPower > 0) ? Math.max(0.4, Math.min(1.8, customPower)) : 1.0;
    const initialSpeed = 19.5 * speedMult;

    this.vx = Math.cos(angle) * initialSpeed + (shooter ? (shooter.vx || 0) * 0.35 : 0);
    this.vy = Math.sin(angle) * initialSpeed + (shooter ? (shooter.vy || 0) * 0.25 : 0) - 2.4;

    this.radius = 12;
    this.rot = angle;
    const throwDir = shooter?.facing || (this.vx >= 0 ? 1 : -1);
    this.vRot = throwDir * 0.42;

    this.state = 'FLYING'; // 'FLYING' | 'GROUNDED'
    this.damage = 110;
    this.stuckPlatform = null;
    this.stuckOffsetX = 0;
    this.stickAngle = 0;
    this.pickupRadius = 42;
    this.hitCombatants = new Set();
    this.groundTimer = 0;

    if (shooter) {
      shooter.axeThrown = true;
    }
  }

  update(groundY, platforms, customObs, combatants, ball) {
    if (this.state === 'FLYING') {
      this.prevX = this.x;
      this.prevY = this.y;

      const grav = (CONFIG.GRAVITY || 0.38) * 0.82;
      this.vy += grav;

      this.x += this.vx;
      this.y += this.vy;
      this.rot += this.vRot;

      const curArena = getActiveArena?.();
      const isA3 = (curArena?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY');
      const arenaLeft = (typeof curArena?.bounds?.minX === 'number') ? curArena.bounds.minX : ARENA_LEFT;
      const arenaRight = isA3 ? 4400 : ((typeof curArena?.width === 'number') ? curArena.width : ((typeof curArena?.bounds?.maxX === 'number') ? curArena.bounds.maxX : ARENA_RIGHT));

      // 1. Odbicia / ograniczenia na ścianach bocznych areny
      if (this.x - this.radius <= arenaLeft) {
        this.x = arenaLeft + this.radius;
        this.vx = -this.vx * 0.35;
        this.vRot = -this.vRot * 0.6;
        spawnRicochetSparks(this.x, this.y, 1, 0, 4);
      } else if (this.x + this.radius >= arenaRight) {
        this.x = arenaRight - this.radius;
        this.vx = -this.vx * 0.35;
        this.vRot = -this.vRot * 0.6;
        spawnRicochetSparks(this.x, this.y, -1, 0, 4);
      }

      // 2. Interakcja kinetyczna z piłką (Kinetic Ball Push / Spike)
      if (ball && !ball.isPocketed) {
        const dBall = Math.hypot(ball.x - this.x, ball.y - this.y);
        if (dBall <= this.radius + (ball.radius || 12)) {
          ball.vx += this.vx * 0.95;
          ball.vy += this.vy * 0.95;
          ball.spin = (this.vx > 0 ? 1 : -1) * 0.8;
          spawnRicochetSparks(this.x, this.y, Math.sign(this.vx), -0.5, 6);
          triggerScreenShake(4.5);
          this.vx *= 0.45;
          this.vy *= 0.45;
          this.vRot *= -0.5;
        }
      }

      // 3. Trafienie w przeciwników (Combatants Hit / Decapitation / Cleave)
      if (Array.isArray(combatants)) {
        for (const ch of combatants) {
          if (!ch || ch === this.shooter || ch.isDead || this.hitCombatants.has(ch)) continue;
          if (!isDeathmatchFFA() && this.team && ch.team && this.team === ch.team) continue;

          const chLeft = ch.x;
          const chRight = ch.x + (ch.w || 24);
          const chTop = ch.y;
          const chBottom = ch.y + (ch.h || 70);

          if (this.x + this.radius >= chLeft && this.x - this.radius <= chRight &&
              this.y + this.radius >= chTop && this.y - this.radius <= chBottom) {
            this.hitCombatants.add(ch);
            const isHeadshot = (this.y <= ch.y + 24);
            const chVisuals = (typeof ch.visuals === 'object' && ch.visuals) ? ch.visuals : DEFAULT_VISUALS;

            ch.hp = Math.max(0, (ch.hp || 100) - this.damage);
            ch.killer = this.shooter;
            ch.lastAttacker = this.shooter;
            ch.lastAttackerTimer = 180;

            if (ch.hp <= 0) {
              ch.hasHead = true;
              ch.decapitated = false;
              ch.neckFountainTimer = 0;
              if (ch.dismembered) {
                ch.dismembered.armFront = false;
                ch.dismembered.armBack = false;
                ch.dismembered.legFront = false;
                ch.dismembered.legBack = false;
              }
              const throwDir = Math.sign(this.vx || 1);
              ch.deathHitPoint = { x: this.x, y: this.y };
              ch.deathImpulse = {
                vx: throwDir * 7.5,
                vy: isHeadshot ? 1.5 : -1.0
              };
              ch.bleedTimer = 90;
              spawnBloodSpurt(this.x, this.y, throwDir * 5.0, -2.5, isHeadshot ? 28 : 18, 1.4);
              spawnBloodDrip(this.x, this.y, throwDir * 2.2, -1.0, 8);
            }

            spawnBloodSpurt(this.x, this.y, Math.sign(this.vx || 1) * 4.5, -2, 7);
            spawnRicochetSparks(this.x, this.y, Math.sign(this.vx || 1), -0.5, 8);
            ch.vx += Math.sign(this.vx || 1) * 6.5;
            ch.vy -= 2.2;
            triggerScreenShake(20);
            triggerHitstop(6);

            // Po uderzeniu we wroga toporek traci większość energii i opada na ziemię
            this.vx = Math.sign(this.vx || 1) * 1.5;
            this.vy = -1.8;
            this.vRot = (this.vx >= 0 ? 1 : -1) * 0.15;
            break;
          }
        }
      }

      // 4. Kolizja z platformami (wbicie w platformę)
      const activePlats = platforms || ARENA_PLATFORMS;
      if (Array.isArray(activePlats)) {
        for (const plat of activePlats) {
          if (!plat || plat.solid === false) continue;
          if (isA3 && (plat.id === 'ground_left' || plat.id === 'ground_right' || plat.id === 'riverbank_left_oval' || plat.id === 'riverbank_right_oval')) {
            continue;
          }
          const platX = plat.x;
          const platW = plat.w;
          const topY = (plat.surfacePoints && typeof getPlatformSurfaceY === 'function')
            ? getPlatformSurfaceY(plat, this.x, groundY)
            : ((plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0)));

          if (this.x >= platX && this.x <= platX + platW && this.prevY <= topY + 4 && this.y >= topY - 4) {
            this.state = 'GROUNDED';
            this.y = topY - 3;
            this.stickAngle = (this.vx >= 0 ? 0.38 : -0.38);
            this.vx = 0;
            this.vy = 0;
            this.vRot = 0;
            this.stuckPlatform = plat;
            this.stuckOffsetX = this.x - platX;
            spawnRicochetSparks(this.x, topY, 0, -1, 7);
            triggerScreenShake(2.5);
            break;
          }
        }
      }

      // 5. Kolizja z podłożem (wbicie w ziemię / spód areny)
      if (this.state === 'FLYING') {
        const floorY = (isA3 && typeof getRiverbankGroundY === 'function') ? getRiverbankGroundY(this.x) : groundY;
        if (this.y >= floorY - 4) {
          this.state = 'GROUNDED';
          this.y = floorY - 3;
          this.stickAngle = (this.vx >= 0 ? 0.38 : -0.38);
          this.vx = 0;
          this.vy = 0;
          this.vRot = 0;
          spawnRicochetSparks(this.x, floorY, 0, -1, 7);
          triggerScreenShake(2.5);
        }
      }
    }

    // STAN SPOCZYNKU NA PODŁOŻU (GROUNDED)
    if (this.state === 'GROUNDED') {
      this.groundTimer++;

      // Podążanie za ruchem platformy (jeśli wbity w ruchomy element)
      if (this.stuckPlatform) {
        this.x = this.stuckPlatform.x + this.stuckOffsetX;
        const platY = (this.stuckPlatform.y !== undefined) ? this.stuckPlatform.y : (groundY - (this.stuckPlatform.relY || 0));
        this.y = platY - 3;
      }

      // Detekcja podniesienia przez gracza-właściciela
      if (this.shooter && !this.shooter.isDead) {
        const pX = this.shooter.x + (this.shooter.w || 24) * 0.5;
        const pY = this.shooter.y + (this.shooter.h || 70) * 0.5;
        const dist = Math.hypot(pX - this.x, pY - this.y);

        if (dist <= this.pickupRadius) {
          // PODNIESIENIE TOPOORKA DO RĄK GRACZA
          this.shooter.axeThrown = false;
          spawnRicochetSparks(this.x, this.y - 8, 0, -1, 6);
          triggerScreenShake(1.5);
          return false; // Usuwa toporek z activeProjectiles
        }
      }
    }

    return true;
  }

  draw(ctx) {
    if (!ctx) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.state === 'GROUNDED') {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.007);
      ctx.fillStyle = `rgba(249, 115, 22, ${0.12 + pulse * 0.16})`;
      ctx.beginPath();
      ctx.ellipse(0, 4, 16 + pulse * 4, 5 + pulse * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (this.shooter && !this.shooter.isDead) {
        const pX = this.shooter.x + (this.shooter.w || 24) * 0.5;
        const pY = this.shooter.y + (this.shooter.h || 70) * 0.5;
        const dToShooter = Math.hypot(pX - this.x, pY - this.y);
        if (dToShooter < 260) {
          const alpha = Math.min(1.0, Math.max(0.2, 1.0 - (dToShooter - 120) / 140));
          ctx.fillStyle = `rgba(251, 146, 60, ${alpha * (0.75 + pulse * 0.25)})`;
          ctx.font = '900 8.5px monospace';
          ctx.textAlign = 'center';
          const bob = Math.sin(performance.now() * 0.006) * 3;
          ctx.fillText('▼ [PODNIEŚ]', 0, -22 + bob);
        }
      }
    }

    ctx.rotate(this.state === 'GROUNDED' ? this.stickAngle : this.rot);

    const imgAxe = getAxeSprite();
    if (imgAxe && imgAxe.complete && imgAxe.naturalWidth > 0) {
      const s = 19.5 / 1115;
      const pivotSpriteX = 228.7;
      const pivotSpriteY = 206.0;

      ctx.save();
      ctx.scale(s, s);
      ctx.translate(-pivotSpriteX, -pivotSpriteY);
      ctx.drawImage(imgAxe, 0, 0);
      ctx.restore();
    } else {
      ctx.fillStyle = '#27272a';
      ctx.fillRect(-4.0, -1.8, 16.0, 2.6);
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(11.0, -7.0);
      ctx.lineTo(15.5, -5.5);
      ctx.lineTo(14.0, 6.5);
      ctx.lineTo(9.5, 5.0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(10.0, -1.5);
      ctx.lineTo(5.5, -1.0);
      ctx.lineTo(10.0, 0.5);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

/**
 * Wystrzelenie / rzucenie toporkiem tomahawk
 */
export function spawnThrownTomahawk(shooter, targetX, targetY, customPower = 1.0, spawnOriginX = null, spawnOriginY = null) {
  const tomahawk = new ThrownTomahawk(shooter, targetX, targetY, customPower, spawnOriginX, spawnOriginY);
  activeProjectiles.push(tomahawk);
  if (typeof window !== 'undefined' && Array.isArray(window.activeProjectiles) && window.activeProjectiles !== activeProjectiles) {
    window.activeProjectiles.push(tomahawk);
  }
  return tomahawk;
}

/**
 * Czyszczenie leżących w świecie toporków danego gracza (np. przy respawnie po śmierci)
 */
export function clearPlayerThrownTomahawks(shooter) {
  if (!shooter) return;
  for (let i = activeProjectiles.length - 1; i >= 0; i--) {
    const proj = activeProjectiles[i];
    if (proj && proj.type === 'TOMAHAWK' && proj.shooter === shooter) {
      activeProjectiles.splice(i, 1);
    }
  }
  if (typeof window !== 'undefined' && Array.isArray(window.activeProjectiles)) {
    for (let i = window.activeProjectiles.length - 1; i >= 0; i--) {
      const proj = window.activeProjectiles[i];
      if (proj && proj.type === 'TOMAHAWK' && proj.shooter === shooter) {
        window.activeProjectiles.splice(i, 1);
      }
    }
  }
}

/**
 * Główna procedura wybuchu, obrażeń i niszczenia terenu (AoE Destruction)
 */
export function detonateGrenadeExplosion(expX, expY, radius, shooter, groundY, platforms, customObs, combatants, ball, sourceWeapon = 'GRENADE') {
  // Przechwycenie wybuchu przez elementy aktywnej areny (np. odrzut wagoników kopalnianych)
  const activeArena = getActiveArena();
  if (activeArena && typeof activeArena.onExplosion === 'function') {
    activeArena.onExplosion(expX, expY, radius, { platforms: platforms || ARENA_PLATFORMS });
  }

  // 1. Obrażenia i odrzut graczy / botów
  const targets = Array.isArray(combatants) ? combatants : [];
  const netState = (typeof window !== 'undefined' && window.networkState) ? window.networkState : null;
  for (const ch of targets) {
    if (!ch || ch.isDead) continue;
    const chCenterX = ch.x + ch.w / 2;
    const chCenterY = ch.y + ch.h / 2;
    const dist = Math.hypot(chCenterX - expX, chCenterY - expY);

    if (dist <= radius) {
      if ((ch.spawnProtectionTimer && ch.spawnProtectionTimer > 0) || (shooter && shooter.spawnProtectionTimer && shooter.spawnProtectionTimer > 0)) {
        continue;
      }

      // Ochrona sojuszników przed obrażeniami z własnych granatów w trybie drużynowym (TDM)
      const isFFA = (typeof isDeathmatchFFA === 'function' ? isDeathmatchFFA() : false) ||
        (deathmatchState && deathmatchState.mode === 'FFA') ||
        (deathmatchConfig && deathmatchConfig.mode === 'FFA') ||
        (typeof window !== 'undefined' && window.deathmatchState?.mode === 'FFA');
      if (!isFFA && shooter && shooter !== ch && shooter.team && ch.team && shooter.team === ch.team) {
        continue;
      }

      // W trybie sieciowym wybuchy granatów zdalnego gracza oraz granatów botów na maszynie klienta
      // nie zadają bezpośrednich obrażeń lokalnemu graczowi (ponieważ autorytatywny rzucający / Host wysyła deal_dmg)
      if (netState && netState.isConnected) {
        if (shooter && shooter.isRemote && !ch.isRemote) continue;
        if (!netState.isHost && shooter && shooter.isBot && !ch.isRemote && !ch.isBot) continue;
      }

      const factor = Math.max(0, 1 - (dist / radius));
      // 120-150 dmg w centrum ze spadkiem liniowym
      const damage = Math.round(145 * factor);
      const impulse = factor * 22.0;

      const normX = dist > 0.001 ? (chCenterX - expX) / dist : (ch.facing || 1);
      const normY = dist > 0.001 ? (chCenterY - expY) / dist : -0.8;

      ch.vx += normX * impulse;
      ch.vy += normY * impulse - 3.8;

      ch.hp = Math.max(0, (ch.hp !== undefined ? ch.hp : 100) - damage);
      if (shooter && shooter !== ch) {
        ch.lastAttacker = shooter;
        ch.lastAttackerTimer = 240;
      }
      spawnBloodSpurt(chCenterX, chCenterY, normX * 4, normY * 4, 12, 1.3);

      // Synchronizacja obrażeń od wybuchu w grze sieciowej
      const sendDmg = (typeof window !== 'undefined' && window.sendDamageEvent) ? window.sendDamageEvent : null;
      if (typeof sendDmg === 'function' && netState && netState.isConnected && shooter && !shooter.isRemote) {
        if (ch.isRemote) {
          sendDmg({
            target: 'player',
            damage: damage,
            isHeadshot: false,
            isTorsoShot: true,
            hitX: chCenterX,
            hitY: chCenterY,
            relHitY: (typeof groundY === 'number') ? (groundY - chCenterY) : 0,
            weaponId: 'GRENADE'
          });
        } else if (ch.isBot && !netState.isHost) {
          const activeBots = (typeof getActiveBots === 'function') ? getActiveBots() : [];
          const bIdx = activeBots.indexOf(ch);
          if (bIdx !== -1) {
            sendDmg({
              target: 'bot',
              botIdx: bIdx,
              damage: damage,
              isHeadshot: false,
              isTorsoShot: true,
              hitX: chCenterX,
              hitY: chCenterY,
              relHitY: (typeof groundY === 'number') ? (groundY - chCenterY) : 0,
              weaponId: 'GRENADE'
            });
          }
        }
      }

      if (ch.hp <= 0 && !ch.isDead && !ch.isAcidDying && (!ch.acidDeath || !ch.acidDeath.active)) {
        ch.isDead = true;
        const curArena = getActiveArena?.();
        const isA3Target = (curArena?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY');
        const isSelf = shooter && (shooter === ch || (shooter.id && ch.id && shooter.id === ch.id) || (!shooter.isBot && !ch.isBot && !shooter.isRemote && !ch.isRemote));
        if (isSelf) {
          ch.killer = { name: (sourceWeapon === 'MORTAR' ? 'WŁASNY NALOT' : 'WŁASNY GRANAT'), isSelf: true, cause: 'OWN_EXPLOSION' };
        } else if (shooter && shooter !== ch) {
          ch.killer = shooter;
        } else {
          ch.killer = ch.lastAttacker || { name: (sourceWeapon === 'MORTAR' ? 'NALOT MOŹDZIERZOWY' : 'EKSPLOZJA GRANATU'), isSelf: false };
        }
        ch.respawnTimer = 180;
        ch.corpseFloorY = (isA3Target && typeof getRiverbankGroundY === 'function') ? getRiverbankGroundY(chCenterX) : groundY;
        const targetVisuals = ch._cachedVisuals || { ...DEFAULT_VISUALS, ...(ch.visuals || {}), ...(ch.customVisuals || {}) };

        if (ch.currentWeapon) {
          spawnDroppedWeapon(chCenterX, chCenterY, normX * 4.5, -5.0, ch.currentWeapon, ch.facing);
        }

        ch.dismembered = { armFront: false, armBack: false, legFront: false, legBack: false };

        if (dist <= radius * 0.45) {
          // Bezpośrednie trafienie w epicentrum: totalne rozczłonkowanie (Gibbing)
          ch.isGibbed = true;
          spawnBodyGibs(chCenterX, chCenterY, ch.facing, targetVisuals);
          spawnHeadGib(chCenterX, chCenterY - 10, normX * 5.0, -7.5, ch.facing, targetVisuals);
          spawnBloodSpurt(chCenterX, chCenterY, 0, -3.0, 32, 2.0);
        } else {
          // Eksplozja w zasięgu rażenia fali uderzeniowej i odłamków:
          ch.isGibbed = false;
          if (dist <= radius * 0.72) {
            if (Math.random() < 0.5) {
              ch.hasHead = false;
              ch.decapitated = true;
              ch.neckFountainTimer = 65;
              spawnHeadGib(chCenterX, chCenterY - 10, normX * 4.5, -6.5, ch.facing, targetVisuals);
              spawnBloodFountain(chCenterX, chCenterY + 14, ch.facing, 6);
            } else {
              ch.dismembered.legFront = true;
              spawnLimbGib('leg', chCenterX, chCenterY + 20, normX * 4.0, -5.5, ch.facing, targetVisuals);
              spawnBloodFountain(chCenterX, chCenterY + 45, ch.facing, 5);
            }
          } else {
            ch.dismembered.armFront = true;
            spawnLimbGib('arm', chCenterX, chCenterY - 10, normX * 4.0, -5.5, ch.facing, targetVisuals);
            spawnBloodFountain(chCenterX, chCenterY + 16, ch.facing, 5);
          }
        }

        const expImpX = Math.max(-18, Math.min(18, normX * impulse * 1.0));
        const expImpY = Math.max(-6.5, Math.min(10, normY * impulse * 0.75 - 1.5));
        ch.deathImpulse = { vx: expImpX, vy: expImpY };
        triggerHitstop(2);
      }
    }
  }

  // 2. Potężny impuls odrzucający piłkę
  if (ball) {
    const ballDx = ball.x - expX;
    const ballDy = ball.y - expY;
    const ballDist = Math.hypot(ballDx, ballDy);

    if (ballDist <= radius) {
      ball.isLevitating = false;
      const factor = Math.max(0, 1 - (ballDist / radius));
      const ballImpulse = factor * 28.0;
      const bNormX = ballDist > 0.001 ? ballDx / ballDist : 0;
      const bNormY = ballDist > 0.001 ? ballDy / ballDist : -1;

      ball.vx += bNormX * ballImpulse;
      ball.vy += bNormY * ballImpulse - 5.5;
      ball.spin = (Math.random() - 0.5) * 0.45;
    }
  }

  // 3. FIZYCZNE NISZCZENIE PLATFORM I WYCINKA PODŁOŻA (Real Geometry Carving)
  const isA3Explosion = (activeArena?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY');
  const isA2Explosion = (activeArena?.id === 'arena-2' || activeArenaId === 'ARENA_2' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'ARENA_2_SECTOR_X');
  if (isA3Explosion) {
    // Wybuch w wodzie rzeki: potężny gejzer wodny
    if (expY >= 1290 && expX >= 1620 && expX <= 2780) {
      if (typeof window.spawnArena3WaterSplash === 'function') {
        window.spawnArena3WaterSplash(expX, 1305, 36, true);
      }
    }
  } else if (isA2Explosion) {
    // W Arenie 2 (Sektor X) bastiony, kładki i rampy są stałymi konstrukcjami przemysłowymi nad jeziorem kwasu.
    // Geometria platform nie ulega zniszczeniu ani wycinaniu przez granaty.
    if (expY >= 1410) {
      if (typeof window !== 'undefined' && typeof window.createAcidSplash === 'function') {
        window.createAcidSplash(expX, 1440);
      }
      if (typeof window !== 'undefined' && typeof window.spawnAcidSmoke === 'function') {
        window.spawnAcidSmoke(expX, 1440);
      }
    }
  } else {
    const targetPlatforms = platforms || ARENA_PLATFORMS;
    const terrainRadius = 90;
    if (Array.isArray(targetPlatforms)) {
      destroyPlatformSegments(targetPlatforms, expX, expY, terrainRadius, groundY);
    }
    // Realna wycinka podłoża areny (GROUND_Y)
    if (typeof carveGroundHole === 'function') {
      carveGroundHole(expX, expY, terrainRadius);
    }
  }

  // 4. Niszczenie postawionych przeszkód w zasięgu wybuchu
  const targetObs = customObs || customObstacles;
  if (Array.isArray(targetObs)) {
    for (let i = targetObs.length - 1; i >= 0; i--) {
      const obs = targetObs[i];
      if (!obs) continue;
      const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
      const obsCenterX = obs.x + (obs.w || 30) / 2;
      const obsCenterY = topY + (obs.h || 30) / 2;
      const obsDist = Math.hypot(obsCenterX - expX, obsCenterY - expY);

      if (obsDist <= radius * 0.95) {
        spawnConcreteDebris(obsCenterX, obsCenterY, 8);
        targetObs.splice(i, 1);
        const idx = obstacles.indexOf(obs);
        if (idx !== -1) obstacles.splice(idx, 1);
      }
    }
  }

  // 5. Dynamiczny efekt wybuchu HE (Game Juice):
  // - 1x ShockwaveRing
  // - 14–18 cząsteczek ExplosionFirePuff (promień 20px, prędkość 50–120 px/s)
  // - 30–40 cząsteczek StretchedSparks (rozciągane linie żaru)
  // - 10–14 cząsteczek HeavySmokePuff (ciemne tło wybuchu)
  spawnJuiceExplosion(expX, expY);

  // Odpalenie dodatkowej fali cząsteczek otoczenia:
  spawnShrapnelStreak(expX, expY, 14);
  spawnPowderSmoke(expX, expY, 8);
  spawnDustCloud(expX, expY, 10);

  // 6. Krótkotrwały błysk (flash: 2 klatki, promień 60px, kolor: '#FFFFFF'), kula ognia
  spawnExplosionEffect(expX, expY, radius);
  // (Usunięto addExplosionCrater - zastąpiono realną wyrwą w geometrii kładki)

  // 7. Kamera: camera.shake = 16 (płynny shake bez zatrzymywania pętli)
  if (typeof camera !== 'undefined' && camera) {
    camera.shake = 16;
    if (typeof camera.shakeImpulse === 'function') {
      camera.shakeImpulse(16, 0.15);
    }
  } else if (typeof shakeImpulse === 'function') {
    shakeImpulse(16, 0.15);
  } else {
    triggerScreenShake(16);
  }
}

/**
 * Logika cięcia / podziału platform AABB przy wybuchu
 */
export function destroyPlatformSegments(platforms, expX, expY, radius = 90, groundY) {
  const newPlatsToAdd = [];

  for (let i = platforms.length - 1; i >= 0; i--) {
    const plat = platforms[i];
    if (!plat || plat.isCanyonTerrain || plat.solid || plat.indestructible || plat.isSlope || plat.isPlatform === true) continue;

    const platTopY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
    const platThick = plat.thickness || 22;
    const platBottomY = platTopY + platThick;
    const platLeft = plat.x;
    const platRight = plat.x + plat.w;

    // Sprawdzenie czy okrąg wybuchu przecina prostokąt platformy
    const nearestY = Math.max(platTopY, Math.min(expY, platBottomY));
    const nearestX = Math.max(platLeft, Math.min(expX, platRight));
    const distToPlat = Math.hypot(expX - nearestX, expY - nearestY);

    if (distToPlat > radius) {
      continue; // Wybuch nie sięga platformy
    }

    // Zakres poziomy wycięcia wybuchu
    const holeLeft = expX - radius * 0.85;
    const holeRight = expX + radius * 0.85;

    // Określ zniszczony wycinek platformy [cutStart, cutEnd]
    const cutStart = Math.max(platLeft, holeLeft);
    const cutEnd = Math.min(platRight, holeRight);
    const destroyedWidth = cutEnd - cutStart;

    if (destroyedWidth > 5) {
      // Wykryj do 5 kratek / segmentów w zasięgu wybuchu (kratki o szerokości ~25-35px)
      const numCells = Math.min(5, Math.max(1, Math.round(destroyedWidth / 28)));
      for (let k = 0; k < numCells; k++) {
        const cellCenterX = cutStart + (k + 0.5) * (destroyedWidth / numCells);
        const cellCenterY = platTopY + platThick / 2;

        const cDx = cellCenterX - expX;
        const cDy = cellCenterY - expY;
        const cDist = Math.hypot(cDx, cDy) || 1;
        const normX = cDx / cDist;
        const normY = cDy / cDist;
        const speed = 160 + Math.random() * 180;
        const outwardVx = normX * speed;
        const outwardVy = normY * speed - 50;

        // Z centrum każdej zniszczonej kratki wyrzuć po 2–3 cząsteczki ConcreteDebris z wektorem odśrodkowym
        spawnConcreteDebris(cellCenterX, cellCenterY, Math.floor(Math.random() * 2 + 2), outwardVx, outwardVy);
      }
    }

    // Przypadek 1: Wybuch obejmuje całą platformę -> całkowite zniszczenie
    if (holeLeft <= platLeft && holeRight >= platRight) {
      platforms.splice(i, 1);
      continue;
    }

    // Przypadek 2: Wycięcie lewej części platformy
    if (holeLeft <= platLeft && holeRight < platRight) {
      const remainingWidth = platRight - holeRight;
      if (remainingWidth >= 20) {
        plat.x = holeRight;
        plat.w = remainingWidth;
        plat.scorchLeft = true;
        plat.scorchMark = true;
      } else {
        platforms.splice(i, 1);
      }
      continue;
    }

    // Przypadek 3: Wycięcie prawej części platformy
    if (holeLeft > platLeft && holeRight >= platRight) {
      const remainingWidth = holeLeft - platLeft;
      if (remainingWidth >= 20) {
        plat.w = remainingWidth;
        plat.scorchRight = true;
        plat.scorchMark = true;
      } else {
        platforms.splice(i, 1);
      }
      continue;
    }

    // Przypadek 4: Wycięcie DZIURY w środku platformy (podział na 2 mniejsze segmenty)
    if (holeLeft > platLeft && holeRight < platRight) {
      const leftW = holeLeft - platLeft;
      const rightW = platRight - holeRight;

      if (leftW >= 20 && rightW >= 20) {
        // Lewy fragment
        plat.w = leftW;
        plat.scorchRight = true;
        plat.scorchMark = true;

        // Prawy fragment – skopiuj właściwości platformy
        const rightPlat = {
          ...JSON.parse(JSON.stringify(plat)),
          id: plat.id + '_split_' + Date.now() + '_' + Math.floor(Math.random() * 100),
          x: holeRight,
          w: rightW,
          scorchLeft: true,
          scorchRight: false,
          scorchMark: true
        };
        newPlatsToAdd.push(rightPlat);
      } else if (leftW >= 20) {
        plat.w = leftW;
        plat.scorchRight = true;
        plat.scorchMark = true;
      } else if (rightW >= 20) {
        plat.x = holeRight;
        plat.w = rightW;
        plat.scorchLeft = true;
        plat.scorchMark = true;
      } else {
        platforms.splice(i, 1);
      }
    }
  }

  if (newPlatsToAdd.length > 0) {
    platforms.push(...newPlatsToAdd);
  }
}

/**
 * Fizyczne cząsteczki gruzu i betonu odbijające się od podłoża
 */
export function spawnRubbleDebris(x, y, count = 15) {
  const colors = ['#475569', '#334155', '#64748b', '#94a3b8', '#1e293b', '#f97316'];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6.5 + 2.5;

    rubbleParticles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (Math.random() * 4.5 + 2.0),
      size: Math.random() * 5 + 3,
      angle: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.35,
      color: colors[Math.floor(Math.random() * colors.length)],
      bounces: 0,
      maxBounces: 2,
      isGrounded: false,
      life: 180,
      maxLife: 180,
      alpha: 1.0
    });
  }
}

export function updateRubbleParticles(groundY, platforms) {
  const curArena = getActiveArena?.();
  const isA2 = (curArena?.id === 'arena-2' || activeArenaId === 'ARENA_2' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'ARENA_2_SECTOR_X');
  const isA3 = (curArena?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY');

  for (let i = rubbleParticles.length - 1; i >= 0; i--) {
    const r = rubbleParticles[i];
    r.life--;
    if (r.life <= 0) {
      rubbleParticles.splice(i, 1);
      continue;
    }

    if (r.life < 40) {
      r.alpha = r.life / 40;
    }

    if (!r.isGrounded) {
      r.vy += 0.38;
      r.x += r.vx;
      r.y += r.vy;
      r.angle += r.vRot;

      // Sprawdzenie kolizji z platformami
      let platFloorY = Infinity;
      const activePlats = platforms || ARENA_PLATFORMS;
      if (Array.isArray(activePlats)) {
        for (let j = 0; j < activePlats.length; j++) {
          const p = activePlats[j];
          if (!p || p.solid === false) continue;
          if (r.x >= p.x - 4 && r.x <= p.x + p.w + 4) {
            const py = (p.surfacePoints && typeof getPlatformSurfaceY === 'function')
              ? getPlatformSurfaceY(p, r.x, groundY)
              : ((p.y !== undefined) ? p.y : (groundY - (p.relY || 0)));
            if (py < platFloorY && r.y >= py - 8 && r.y <= py + 20) {
              platFloorY = py;
            }
          }
        }
      }

      if (platFloorY !== Infinity) {
        r.y = platFloorY;
        r.vy = -r.vy * 0.45;
        r.vx *= 0.65;
        r.bounces++;
        if (r.bounces >= r.maxBounces || Math.abs(r.vy) < 0.6) {
          r.isGrounded = true;
          r.vy = 0;
          r.vx = 0;
        }
      } else if (!isA2 && !isA3 && (typeof isGroundAt === 'function' ? isGroundAt(r.x, 2) : true)) {
        // Odbicie od twardego podłoża (tylko na mapach ze stałym gruntem)
        if (r.y >= groundY) {
          r.y = groundY;
          r.vy = -r.vy * 0.45;
          r.vx *= 0.65;
          r.bounces++;
          if (r.bounces >= r.maxBounces || Math.abs(r.vy) < 0.6) {
            r.isGrounded = true;
            r.vy = 0;
            r.vx = 0;
          }
        }
      } else if (isA2 && r.y >= 1440) {
        rubbleParticles.splice(i, 1);
        continue;
      } else if (r.y > 1700) {
        rubbleParticles.splice(i, 1);
        continue;
      }
    }
  }
}

function getProjectileViewBounds(ctx, pad = 100) {
  const camZoom = (camera && camera.zoom) ? camera.zoom : 1;
  const camX = (camera && typeof camera.x === 'number') ? camera.x : 0;
  const canvasW = (ctx && ctx.canvas && ctx.canvas.width) ? ctx.canvas.width : 1920;
  return {
    viewLeft: camX - pad,
    viewRight: camX + (canvasW / camZoom) + pad
  };
}

export function drawRubbleParticles(ctx) {
  if (!ctx || rubbleParticles.length === 0) return;
  const { viewLeft, viewRight } = getProjectileViewBounds(ctx);
  for (const r of rubbleParticles) {
    if (r.x + (r.size || 10) < viewLeft || r.x - (r.size || 10) > viewRight) continue;
    ctx.save();
    ctx.globalAlpha = r.alpha;
    ctx.translate(r.x, r.y);
    ctx.rotate(r.angle);
    ctx.fillStyle = r.color;
    ctx.fillRect(-r.size / 2, -r.size / 2, r.size, r.size * 0.75);
    ctx.restore();
  }
}

export function clearRubbleParticles() {
  rubbleParticles.length = 0;
}

/**
 * Błysk i rozrastająca się fala uderzeniowa eksplozji
 */
export function spawnExplosionEffect(x, y, maxRadius = 145) {
  explosionEffects.push({
    x,
    y,
    currentRadius: 10,
    maxRadius,
    shockwaveRadius: 15,
    maxShockwaveRadius: maxRadius * 1.25,
    life: 28,
    maxLife: 28,
    flashAlpha: 1.0,
    flashFrames: 2, // 2 klatki, promień 60px, kolor: '#FFFFFF'
    flashRadius: 60
  });
}

export function updateExplosionEffects() {
  for (let i = explosionEffects.length - 1; i >= 0; i--) {
    const ef = explosionEffects[i];
    ef.life--;
    if (ef.life <= 0) {
      explosionEffects.splice(i, 1);
      continue;
    }

    if (ef.flashFrames > 0) {
      ef.flashFrames--;
    }

    const progress = 1 - (ef.life / ef.maxLife);
    ef.currentRadius = 10 + (ef.maxRadius - 10) * Math.sin(progress * Math.PI * 0.5);
    ef.shockwaveRadius = 15 + (ef.maxShockwaveRadius - 15) * progress;
    ef.flashAlpha = Math.max(0, 1 - progress * 1.5);
  }
}

export function drawExplosionEffects(ctx) {
  if (!ctx || explosionEffects.length === 0) return;
  const { viewLeft, viewRight } = getProjectileViewBounds(ctx);
  for (const ef of explosionEffects) {
    const maxR = Math.max(ef.currentRadius || 40, ef.shockwaveRadius || 60, ef.flashRadius || 60);
    if (ef.x + maxR < viewLeft || ef.x - maxR > viewRight) continue;

    const progress = 1 - (ef.life / ef.maxLife);
    const alpha = Math.max(0, 1 - progress);

    ctx.save();

    // 1. Kula ognia
    const grad = ctx.createRadialGradient(ef.x, ef.y, 0, ef.x, ef.y, ef.currentRadius);
    grad.addColorStop(0.0, `rgba(255, 255, 255, ${ef.flashAlpha})`);
    grad.addColorStop(0.25, `rgba(254, 215, 170, ${alpha * 0.9})`);
    grad.addColorStop(0.55, `rgba(249, 115, 22, ${alpha * 0.75})`);
    grad.addColorStop(0.85, `rgba(239, 68, 68, ${alpha * 0.45})`);
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ef.x, ef.y, ef.currentRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Pierścień uderzeniowy (Shockwave ring - zero shadowBlur)
    ctx.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.9})`;
    ctx.lineWidth = 3.2 * alpha;
    ctx.beginPath();
    ctx.arc(ef.x, ef.y, ef.shockwaveRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Zewnętrzna poświata fali
    ctx.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.28})`;
    ctx.lineWidth = 7.5 * alpha;
    ctx.stroke();

    // 3. Krótkotrwały intensywny biały błysk (flash: 2 klatki, promień 60px, kolor: '#FFFFFF')
    if (ef.flashFrames > 0) {
      const fRad = ef.flashRadius || 60;
      // Zewnętrzna poświata błysku
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, fRad * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Jaskrawy rdzeń
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, fRad, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export function clearExplosionEffects() {
  explosionEffects.length = 0;
}

/**
 * Ślady przypalenia po wybuchu (Craters / Scorch marks)
 * Usunięto sztuczną nakładkę (Fake Decal) - zastąpiono realną wyrwą w geometrii
 */
export function addExplosionCrater(x, y, r) {
  // Pusta funkcja dla kompatybilności API – brak sztucznego malowania elipsy
}

export function drawExplosionCraters(ctx) {
  // Pusta funkcja – usunięto sztuczną nakładkę ciemnej elipsy na podłodze
}

export function clearExplosionCraters() {
  explosionCraters.length = 0;
}

if (typeof registerArenaResetCallback === 'function') {
  registerArenaResetCallback(() => {
    clearRubbleParticles();
    clearExplosionEffects();
    clearExplosionCraters();
  });
}

/**
 * Smugi dymu z lecącego granatu (zoptymalizowane pod 60 FPS)
 */
const grenadeSmokeParticles = [];
export function spawnGrenadeSmokePuff(x, y) {
  if (grenadeSmokeParticles.length > 30) {
    grenadeSmokeParticles.shift();
  }
  grenadeSmokeParticles.push({
    x: x + (Math.random() - 0.5) * 4,
    y: y + (Math.random() - 0.5) * 4,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6 - 0.3,
    size: Math.random() * 3.5 + 2,
    alpha: 0.65,
    life: 30,
    maxLife: 30
  });
}

export function updateGrenadeSmoke() {
  for (let i = grenadeSmokeParticles.length - 1; i >= 0; i--) {
    const s = grenadeSmokeParticles[i];
    s.life--;
    if (s.life <= 0) {
      grenadeSmokeParticles.splice(i, 1);
      continue;
    }
    s.x += s.vx;
    s.y += s.vy;
    s.size += 0.18;
    s.alpha = (s.life / s.maxLife) * 0.65;
  }
}

export function drawGrenadeSmoke(ctx) {
  if (grenadeSmokeParticles.length === 0) return;
  const { viewLeft, viewRight } = getProjectileViewBounds(ctx);
  ctx.save();
  ctx.fillStyle = '#94a3b8';
  for (let i = 0; i < grenadeSmokeParticles.length; i++) {
    const s = grenadeSmokeParticles[i];
    if (s.x + s.size < viewLeft || s.x - s.size > viewRight) continue;
    ctx.globalAlpha = Math.max(0, s.alpha);
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Zbiorcza aktualizacja wszystkich pocisków i efektów
 */
export function updateProjectiles(groundY, platforms, customObs, combatants, ball) {
  if (typeof window !== 'undefined' && Array.isArray(window.activeProjectiles) && window.activeProjectiles !== activeProjectiles) {
    for (const p of window.activeProjectiles) {
      if (!activeProjectiles.includes(p)) activeProjectiles.push(p);
    }
  }
  for (let i = activeProjectiles.length - 1; i >= 0; i--) {
    const p = activeProjectiles[i];
    const isAlive = p.update(groundY, platforms, customObs, combatants, ball);
    if (!isAlive || p.detonated) {
      activeProjectiles.splice(i, 1);
      if (typeof window !== 'undefined' && Array.isArray(window.activeProjectiles)) {
        const idx = window.activeProjectiles.indexOf(p);
        if (idx !== -1) window.activeProjectiles.splice(idx, 1);
      }
    }
  }

  // Aktualizacja cząsteczek wybuchu HE (szrapnele, dym prochowy, pył, gruz, iskry)
  updateExplosionParticles(1 / 60, groundY, platforms);

  updateRubbleParticles(groundY, platforms);
  updateExplosionEffects();
  updateGrenadeSmoke();
}

/**
 * Zbiorcze renderowanie pocisków i warstw cząsteczek we właściwej kolejności:
 * KROK 1: Dym w tle (source-over)
 * KROK 2: Ogień, błysk i iskry (lighter / additive blending)
 */
export function drawProjectiles(ctx) {
  if (typeof window !== 'undefined' && Array.isArray(window.activeProjectiles) && window.activeProjectiles !== activeProjectiles) {
    for (const p of window.activeProjectiles) {
      if (!activeProjectiles.includes(p)) activeProjectiles.push(p);
    }
  }

  // 1. Ślady przypalenia po wybuchu na podłożu
  drawExplosionCraters(ctx);

  // 2. Pył betonowy w tle
  drawDustClouds(ctx);

  // 3. Ciężki gruz zniszczonego terenu
  drawConcreteDebris(ctx);
  drawRubbleParticles(ctx);

  // 4. KROK 1: Dym w tle – zwykły tryb ('source-over')
  drawExplosionSmokeBackground(ctx);
  drawPowderSmoke(ctx);
  drawGrenadeSmoke(ctx);

  // 5. KROK 2: Ogień, błysk i iskry – tryb rozświetlenia ('lighter' - Additive Blending)
  drawExplosionFireAndSparks(ctx);

  // 6. Smugi naddźwiękowego szrapnela i iskry rykoszetu
  drawShrapnelStreaks(ctx);
  drawRicochetSparks(ctx);

  // 7. Pociski lecące
  const { viewLeft, viewRight } = getProjectileViewBounds(ctx);
  for (const p of activeProjectiles) {
    if (p.x + 40 < viewLeft || p.x - 40 > viewRight) continue;
    p.draw(ctx);
  }

  // 8. Błysk, kula ognia i fala uderzeniowa
  drawExplosionEffects(ctx);
}

if (typeof window !== 'undefined') {
  window.AeroSuperGrenade = AeroSuperGrenade;
  window.spawnAeroSuperGrenade = spawnAeroSuperGrenade;
  window.activeProjectiles = activeProjectiles;
  window.updateProjectiles = updateProjectiles;
  window.drawProjectiles = drawProjectiles;
}
