// =========================================================================
// WEAPONS/FLAMETHROWER.JS - SYSTEM MIOTACZA OGNIA, STRUMIENIA I ROZLANEGO OGNIA
// Architektura płomieni ze sprite sheetu (flame_spritesheet.svg):
// - Wiersz 0: Strumień ognia w locie (8 klatek, rosnący stożek plazmy i napalmu)
// - Wiersz 1: Rozlany ogień na powierzchni (8 klatek tańczących płomieni na ziemi)
// - Wiersz 2: Płomyk pilotujący (4 klatki) oraz rozbryzgi uderzeniowe (4 klatki)
// Fizyka: prędkość początkowa, opór powietrza, grawitacja łukowa, DoT i podpalenia.
// Zero shadowBlur w pętli renderowania - stabilne 60 FPS.
// =========================================================================

import { checkRayObstacleCollision, obstacles, ARENA_PLATFORMS } from '../obstacles.js';
import { triggerScreenShake, spawnBloodSpurt, spawnDroppedWeapon } from '../world.js';
import { isDeathmatchFFA, deathmatchState, deathmatchConfig } from '../deathmatch/index.js';
import { getActiveArena } from '../arenas/index.js';
import { ARENA_LEFT, ARENA_RIGHT } from '../config.js';
import { addDynamicLight, LIGHT_PRESETS } from '../lighting/index.js';
import { playSound } from '../audio/index.js';
import { triggerCombatFeedBanner } from '../ui/combatFeed.js';
import { zombieState } from '../zombie/state.js';
import { GROUND_Y, isGroundAt } from '../world/state.js';
import { getRiverbankGroundY } from '../arenas/arena3/state.js';

export const FLAME_SPRITESHEET_URL = './assets/weapons/flame_spritesheet.svg?v=v489_liquid_napalm_continuous_stream';
export const FLAME_CELL_SIZE = 128;
export const FLAME_COLS = 8;
export const FLAME_ROW_STREAM = 0;
export const FLAME_ROW_SURFACE = 1;
export const FLAME_ROW_PILOT = 2;

let _flameSpritesheetImg = null;
let _isSpritesheetLoaded = false;

/**
 * Inicjalizacja i asynchroniczne ładowanie arkusza sprite'ów ognia
 */
export function initFlameSpritesheet() {
  if (_flameSpritesheetImg) return _flameSpritesheetImg;
  if (typeof Image === 'undefined') return null;

  _flameSpritesheetImg = new Image();
  _flameSpritesheetImg.src = FLAME_SPRITESHEET_URL;
  _flameSpritesheetImg.onload = () => {
    _isSpritesheetLoaded = true;
  };
  return _flameSpritesheetImg;
}

if (typeof window !== 'undefined') {
  initFlameSpritesheet();
}

export function getFlameSpritesheet() {
  if (!_flameSpritesheetImg) return initFlameSpritesheet();
  return _flameSpritesheetImg;
}

export const activeFlameStreams = [];
export const activeSurfaceFires = [];
export const activeImpactSplashes = [];
export const activeFuelGlobs = [];

/**
 * Klasa fizycznej kropli płonącego napalmu / ciekłego paliwa (Burning Fuel Glob)
 * Umożliwia dynamiczne rozlewanie się ognia: odbicia, spływanie po ścianach, opadanie ze schodów
 */
export class BurningFuelGlob {
  constructor(x, y, vx, vy, shooter, team, fuelAmount = 1.0, radius = null) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = vx;
    this.vy = vy;
    this.shooter = shooter;
    this.team = team;
    this.fuelAmount = Math.max(0.35, Math.min(2.0, fuelAmount));
    this.radius = (typeof radius === 'number' && radius > 0) ? radius : (2.4 + Math.random() * 2.6);
    this.life = 60 + Math.floor(Math.random() * 50);
    this.maxLife = this.life;
    this.bounced = false;
    this.dead = false;
  }

  update(groundY = 500, platforms = null, customObs = null) {
    if (this.dead) return false;

    this.prevX = this.x;
    this.prevY = this.y;

    // Grawitacja i opór powietrza
    this.vy += 0.34;
    this.vx *= 0.992;

    this.x += this.vx;
    this.y += this.vy;

    this.life--;
    if (this.life <= 0) {
      this.dead = true;
      return false;
    }

    const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
    const isA2 = curArena?.id === 'arena-2';
    const isA3 = curArena?.id === 'arena-3';
    const isA4 = curArena?.id === 'arena-4';

    // 1. Zgaszenie w kwasie lub głębokiej wodzie
    if (isA2) {
      const acidY = (typeof curArena?.acidSurge?.currentY === 'number') ? curArena.acidSurge.currentY : 1250;
      if (this.y >= acidY) {
        this.dead = true;
        return false;
      }
    }
    if (isA3) {
      const inRiverZone = (this.x >= 1650 && this.x <= 2750);
      const terrY = typeof getRiverbankGroundY === 'function' ? getRiverbankGroundY(this.x) : 1200;
      const inWater = (inRiverZone && this.y >= 1305) || (!inRiverZone && terrY >= 1345 && this.y >= 1345);
      if (inWater) {
        this.dead = true;
        return false;
      }
    }
    if (isA4 && this.y >= 1380) {
      this.dead = true;
      return false;
    }

    // 2. Kolizje z przeszkodami i zniszczalnymi klockami (np. wieża A5, customObs)
    const obs = customObs || obstacles;
    let hit = checkRayObstacleCollision(this.prevX, this.prevY, this.x, this.y, groundY, obs, null);
    if (!hit && curArena && typeof curArena.onBulletHit === 'function') {
      const dummyHit = {
        x: this.x,
        y: this.y,
        prevX: this.prevX,
        prevY: this.prevY,
        vx: this.vx,
        vy: this.vy,
        damage: 1,
        shooter: this.shooter
      };
      if (curArena.onBulletHit(dummyHit)) {
        hit = {
          hit: true,
          t: 0.5,
          x: this.x,
          y: this.y,
          nx: -Math.sign(this.vx || 1),
          ny: 0
        };
      }
    }

    // 3. Kolizje z platformami areny
    if (!hit && Array.isArray(platforms)) {
      for (const plat of platforms) {
        if (!plat || plat.intact === false) continue;
        const pLeft = plat.x;
        const pRight = plat.x + plat.w;
        const topY = plat.y;
        if (this.x >= pLeft && this.x <= pRight) {
          if (this.vy > 0 && this.prevY <= topY + 4 && this.y >= topY - 2) {
            hit = {
              hit: true,
              t: (topY - this.prevY) / (this.y - this.prevY || 1),
              x: this.x,
              y: topY,
              nx: 0,
              ny: -1,
              platform: plat
            };
            break;
          }
        }
      }
    }

    // 4. Kolizja z podłożem areny
    if (!hit) {
      let groundSurfaceY = groundY;
      let gNx = 0;
      let gNy = -1;
      if (isA3 && typeof getRiverbankGroundY === 'function') {
        const terrY = getRiverbankGroundY(this.x);
        if (this.y >= terrY) {
          groundSurfaceY = terrY;
          const slope = (getRiverbankGroundY(this.x + 4) - getRiverbankGroundY(this.x - 4)) / 8;
          const sLen = Math.hypot(slope, 1);
          gNx = slope / sLen;
          gNy = -1 / sLen;
          hit = { hit: true, x: this.x, y: groundSurfaceY, nx: gNx, ny: gNy };
        }
      } else if (this.y >= groundY) {
        hit = { hit: true, x: this.x, y: groundY, nx: 0, ny: -1 };
      }
    }

    if (hit) {
      const hx = hit.x;
      const hy = hit.y;
      const nx = hit.nx || 0;
      const ny = hit.ny !== undefined ? hit.ny : -1;

      // Uderzenie w pionową ścianę (Math.abs(nx) > 0.6)
      if (Math.abs(nx) > 0.6) {
        this.x = hx + nx * 2;
        this.y = hy;
        // Rozprysk małego płomienia na ścianie
        spawnSurfaceFire(
          hx,
          hy,
          nx,
          ny,
          this.shooter,
          this.team,
          14 + this.fuelAmount * 10,
          120 + Math.floor(this.fuelAmount * 60),
          0.50 + this.fuelAmount * 0.40
        );
        // Spływanie w dół ściany
        this.vx = nx * 0.4;
        this.vy = 1.2 + Math.random() * 0.8;
        this.fuelAmount *= 0.55;
        this.life = Math.min(this.life, 35);
        this.bounced = true;
        return true;
      }

      // Uderzenie w podłoże/platformę/skarpę (ny < -0.4)
      const fireW = 16 + this.fuelAmount * 22;
      const fireLife = 160 + Math.floor(this.fuelAmount * 90);
      const fireIntensity = 0.55 + this.fuelAmount * 0.65;
      spawnSurfaceFire(hx, hy, nx, ny, this.shooter, this.team, fireW, fireLife, fireIntensity);

      // Sprawdzenie odbicia/poślizgu przy dużym pędzie poziomym
      if (Math.abs(this.vx) > 4.5 && !this.bounced) {
        this.x = hx;
        this.y = hy - 2;
        this.vx *= 0.45;
        this.vy = -Math.abs(this.vy) * 0.25;
        this.fuelAmount *= 0.6;
        this.bounced = true;
        return true;
      }

      this.dead = true;
      return false;
    }

    return true;
  }

  draw(ctx) {
    if (this.dead || !ctx) return;
    const spd = Math.hypot(this.vx, this.vy);
    const angle = Math.atan2(this.vy, this.vx);
    const dropLen = Math.max(4.0, spd * 0.55);
    const dropH = this.radius * 0.85;
    const alpha = Math.min(1.0, (this.life / this.maxLife) * 1.2);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;

    // Warstwa zewnętrzna płonącego napalmu
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(0, 0, dropLen, dropH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jasny rdzeń żelowy
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(dropLen * 0.15, 0, dropLen * 0.55, dropH * 0.60, 0, 0, Math.PI * 2);
    ctx.fill();

    // Biała główka
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(dropLen * 0.35, 0, dropLen * 0.25, dropH * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export function spawnBurningFuelGlob(x, y, vx, vy, shooter, team, fuelAmount = 1.0, radius = null) {
  while (activeFuelGlobs.length >= 45) {
    activeFuelGlobs.shift();
  }
  const glob = new BurningFuelGlob(x, y, vx, vy, shooter, team, fuelAmount, radius);
  activeFuelGlobs.push(glob);
  return glob;
}

export function drawFuelGlobs(ctx, camera) {
  if (!ctx || activeFuelGlobs.length === 0) return;
  let minX = -10000, maxX = 10000, minY = -10000, maxY = 10000;
  if (camera && typeof camera.x === 'number' && typeof camera.y === 'number') {
    const zoom = camera.zoom || 1;
    const viewW = camera.viewWidth || (1920 / zoom);
    const viewH = camera.viewHeight || (1080 / zoom);
    const margin = 80;
    minX = camera.x - margin;
    maxX = camera.x + viewW + margin;
    minY = camera.y - margin;
    maxY = camera.y + viewH + margin;
  }
  for (let i = 0; i < activeFuelGlobs.length; i++) {
    const g = activeFuelGlobs[i];
    if (g.dead) continue;
    if (g.x < minX || g.x > maxX || g.y < minY || g.y > maxY) continue;
    g.draw(ctx);
  }
}

/**
 * Klasa rozbryzgu napalmu przy uderzeniu w ścianę / przeszkodę (Impact Splash)
 */
export class ImpactSplash {
  constructor(x, y, nx, ny) {
    this.x = x;
    this.y = y;
    this.nx = nx;
    this.ny = ny;
    this.angle = Math.atan2(ny, nx);
    this.life = 14;
    this.maxLife = 14;
    this.dead = false;
  }

  update() {
    this.life--;
    if (this.life <= 0) {
      this.dead = true;
      return false;
    }
    return true;
  }

  draw(ctx) {
    if (this.dead || !ctx) return;
    const sheet = getFlameSpritesheet();
    const progress = Math.max(0, Math.min(1.0, 1.0 - (this.life / this.maxLife)));
    const frameIdx = 4 + Math.min(3, Math.floor(progress * 4));

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const drawSize = 34 + progress * 18;
    if (sheet && sheet.complete && sheet.naturalWidth > 0) {
      const sx = frameIdx * FLAME_CELL_SIZE;
      const sy = FLAME_ROW_PILOT * FLAME_CELL_SIZE;
      ctx.globalAlpha = Math.min(1.0, (this.life / this.maxLife) * 1.15);
      ctx.drawImage(sheet, sx, sy, FLAME_CELL_SIZE, FLAME_CELL_SIZE, -drawSize * 0.5, -drawSize * 0.5, drawSize, drawSize);
    } else {
      ctx.globalAlpha = Math.min(1.0, (this.life / this.maxLife));
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(0, 0, drawSize * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, drawSize * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function spawnImpactSplash(x, y, nx, ny) {
  while (activeImpactSplashes.length >= 25) {
    activeImpactSplashes.shift();
  }
  activeImpactSplashes.push(new ImpactSplash(x, y, nx, ny));
}

/**
 * Wyznacza odległość punktu (px, py) od odcinka (x1, y1)-(x2, y2)
 */
function distPointToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

/**
 * Test przecięcia promienia z prostokątem AABB
 */
function getSegmentAABBHitT(x1, y1, x2, y2, left, top, right, bottom) {
  let tMin = 0;
  let tMax = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (Math.abs(dx) > 1e-6) {
    let tx1 = (left - x1) / dx;
    let tx2 = (right - x1) / dx;
    if (tx1 > tx2) { const tmp = tx1; tx1 = tx2; tx2 = tmp; }
    tMin = Math.max(tMin, tx1);
    tMax = Math.min(tMax, tx2);
    if (tMin > tMax) return null;
  } else if (x1 < left || x1 > right) {
    return null;
  }

  if (Math.abs(dy) > 1e-6) {
    let ty1 = (top - y1) / dy;
    let ty2 = (bottom - y1) / dy;
    if (ty1 > ty2) { const tmp = ty1; ty1 = ty2; ty2 = tmp; }
    tMin = Math.max(tMin, ty1);
    tMax = Math.min(tMax, ty2);
    if (tMin > tMax) return null;
  } else if (y1 < top || y1 > bottom) {
    return null;
  }

  return (tMin >= 0 && tMin <= 1) ? tMin : null;
}

/**
 * Klasa pojedynczej cząstki strumienia ognia (Flying Flame Particle)
 */
export class FlameParticle {
  constructor(shooter, startX, startY, angle, speed, weapon = null, options = {}) {
    this.shooter = shooter;
    this.shooterId = shooter ? (shooter.id || (shooter.isBot ? `bot_${shooter.botIndex}` : 'player')) : 'p_default';
    this.team = shooter?.team || (shooter?.isBot ? 'BOT' : (shooter?.isRemote ? 'P2' : 'P1'));
    this.x = startX;
    this.y = startY;
    this.prevX = startX;
    this.prevY = startY;
    this.angle = angle;
    this.baseSpeed = speed || 19.5;
    this.vx = Math.cos(angle) * this.baseSpeed + (shooter?.vx || 0) * 0.16;
    this.vy = Math.sin(angle) * this.baseSpeed + (shooter?.vy || 0) * 0.16;

    this.isSpine = options.isSpine ?? false;

    // Ciągła rotacja bez przeskoku - kierunek skrętu i mały offset początkowy
    this.curlSpeed = (Math.random() - 0.5) * 0.055;
    this.rotOffset = (Math.random() - 0.5) * 0.22;
    this.rot = this.angle + this.rotOffset;
    this.turbulenceSeed = Math.random() * 100;

    if (this.isSpine) {
      this.life = 34 + Math.floor(Math.random() * 4);
      this.startRadius = 4.5;
      this.drag = 0.965;
    } else {
      this.life = 30 + Math.floor(Math.random() * 6);
      this.startRadius = 5.5;
      this.drag = 0.958;
    }

    this.radius = this.startRadius;
    this.maxLife = this.life;
    this.damage = weapon?.damage || 4;
    this.dead = false;
    this.hitCombatants = new Set();
  }

  update(groundY, platforms, customObs, combatants, ball) {
    if (this.dead) return false;

    this.prevX = this.x;
    this.prevY = this.y;

    this.life--;
    if (this.life <= 0) {
      this.dead = true;
      return false;
    }

    const progress = 1.0 - (this.life / this.maxLife);

    // 1. Fizyka lotu: gwałtowny wyrzut z wyhamowaniem i unoszeniem termicznym
    this.vx *= this.drag;
    this.vy *= this.drag;

    // Strumień trzyma linię strzału (progress < 0.55), a na końcu łagodnie unosi się
    if (progress < 0.55) {
      this.vy += 0.05;
    } else {
      this.vy -= 0.065;
      this.vx += Math.sin(this.life * 0.35 + this.turbulenceSeed) * 0.10;
    }

    this.x += this.vx;
    this.y += this.vy;
    this.angle = Math.atan2(this.vy, this.vx);

    // Płynna ciągła rotacja od kierunku lotu bez skoków
    this.rotOffset += this.curlSpeed * progress;
    this.rot = this.angle + this.rotOffset;

    // Naturalna ekspansja stożkowa dopasowana do skali postaci (bez gigantycznych stempli)
    this.radius = this.startRadius + Math.pow(progress, 0.9) * (this.isSpine ? 18 : 23);

    const obs = customObs || obstacles;
    let mapHit = checkRayObstacleCollision(this.prevX, this.prevY, this.x, this.y, groundY, obs, null);

    // Integracja ze zniszczalnymi elementami specyficznymi dla areny (np. klocki wieży w A5, most w A3)
    const activeArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
    if (!mapHit && activeArena && typeof activeArena.onBulletHit === 'function') {
      const dummyHit = {
        x: this.x,
        y: this.y,
        prevX: this.prevX,
        prevY: this.prevY,
        vx: this.vx,
        vy: this.vy,
        damage: this.damage,
        shooter: this.shooter
      };
      if (activeArena.onBulletHit(dummyHit)) {
        mapHit = {
          hit: true,
          t: 0.5,
          x: this.x,
          y: this.y,
          nx: -Math.sign(this.vx || 1),
          ny: 0
        };
      }
    }

    const endX = mapHit ? mapHit.x : this.x;
    const endY = mapHit ? mapHit.y : this.y;
    const maxT = mapHit ? mapHit.t : 1.0;

    // 2. Interakcja z piłką
    if (ball) {
      const cR = ball.colRadius || 5.2;
      const dToBall = distPointToSegment(ball.x, ball.y, this.prevX, this.prevY, endX, endY);
      if (dToBall <= cR + this.radius) {
        ball.vx += this.vx * 0.28;
        ball.vy += this.vy * 0.28 - 0.4;
        ball.spin += (this.vx > 0 ? 0.35 : -0.35);
        ball.burnTimer = Math.max(ball.burnTimer || 0, 80);
      }
    }

    // 3. Kolizje z postaciami (Gracze, boty i zombie)
    const targets = Array.isArray(combatants) ? combatants : [];
    const isFFA = (typeof isDeathmatchFFA === 'function' ? isDeathmatchFFA() : false) ||
      (deathmatchState && deathmatchState.mode === 'FFA') ||
      (deathmatchConfig && deathmatchConfig.mode === 'FFA');

    for (const ch of targets) {
      if (!ch || ch === this.shooter) continue;
      const isLyingZombie = !!(ch.isZombie && ch.isDead && ch.hasHead && !ch.decapitated);
      if (ch.isZombie) {
        // Poprawny cel: żywy zombie, wstający zombie lub powalony z głową
        if (ch.isDead && !isLyingZombie) continue;
      } else {
        if (ch.isDead) continue;
        if (ch.isBot && !ch.active) continue;
      }
      if (!isFFA && !ch.isZombie && this.shooter && this.shooter.team && ch.team && this.shooter.team === ch.team) continue;
      if (!ch.isZombie && ch.spawnProtectionTimer && ch.spawnProtectionTimer > 0) continue;
      if (this.hitCombatants.has(ch)) continue;

      const hitW = ch.w || 24;
      const hitH = ch.h || 70;
      let chLeft = ch.x;
      let chRight = ch.x + hitW;
      let chTop = ch.y - 20;
      let chBottom = ch.y + hitH;

      if (ch.isProne || ch.staggerTimer > 0 || isLyingZombie || (ch.isZombie && ch.isCrawling)) {
        chTop = ch.y + hitH - (ch.isCrawling ? 20 : 24);
        chBottom = ch.y + hitH + 2;
        chLeft = ch.x - (ch.facing === 1 ? 14 : 38);
        chRight = ch.x + hitW + (ch.facing === 1 ? 38 : 14);
      } else if (ch.isZombie && ch.riseTimer > 0) {
        chTop = ch.y + hitH - 52;
        chBottom = ch.y + hitH;
      } else if (ch.isCrouching) {
        chTop = ch.y + 12;
      }

      const hitT = getSegmentAABBHitT(this.prevX, this.prevY, this.x, this.y, chLeft, chTop, chRight, chBottom);
      if (hitT !== null && hitT <= maxT) {
        // Blokada ognia przez przeszkodę: sprawdzamy czy przeszkoda nie stoi między cząstką a celem
        const losHit = checkRayObstacleCollision(this.prevX, this.prevY, ch.x + hitW * 0.5, ch.y + hitH * 0.45, groundY, obs, null);
        if (losHit && losHit.t < 0.92) {
          continue;
        }

        this.hitCombatants.add(ch);

        if (isLyingZombie) {
          // Zadawanie obrażeń powalonemu zombie (spalanie leżącego ciała)
          ch.downedHp = (ch.downedHp !== undefined ? ch.downedHp : 60) - this.damage * 1.5;
          igniteCombatant(ch, this.shooter, 120, {
            intensity: 0.38,
            additiveIntensity: 0.14,
            additiveDuration: 26,
            maxDuration: 265,
            maxIntensity: 1.0
          });
          if (ch.downedHp <= 0) {
            handleZombieFireDeath(ch, this.shooter, groundY, true);
          }
        } else {
          // Obrażenia bezpośrednie od strumienia płomieni dla żywych postaci i zombie
          ch.hp = Math.max(0, (ch.hp !== undefined ? ch.hp : 100) - this.damage);
          ch.lastAttacker = this.shooter;
          ch.lastAttackerTimer = 240;

          // Kumulatywne podpalenie ciekłym napalmem ze strumienia (od lekkiego muśnięcia do pełnego pożaru)
          igniteCombatant(ch, this.shooter, 120, {
            intensity: 0.36,
            additiveIntensity: 0.14,
            additiveDuration: 26,
            maxDuration: 265,
            maxIntensity: 1.0
          });

          // Odrzut kinetyczny celu
          ch.vx += this.vx * 0.035;

          // Krótki rozbryzg krwi/iskier
          if (Math.random() < 0.35) {
            spawnBloodSpurt(ch.x + hitW * 0.5, ch.y + hitH * 0.4, this.vx * 0.2, -1.2, 4, 0.7);
          }

          // Zgon od płomieni
          if (ch.hp <= 0) {
            if (ch.isZombie) {
              handleZombieFireDeath(ch, this.shooter, groundY, false);
            } else if (!ch.isDead && !ch.isAcidDying) {
              handleFireDeath(ch, this.shooter, groundY);
            }
          }
        }

        // Cząstka traci część energii przy uderzeniu w ciało
        this.life -= 8;
      }
    }

    // 4. Uderzenie w powierzchnię (Ziemia, platformy, przeszkody solidne)
    if (mapHit) {
      this.x = mapHit.x;
      this.y = mapHit.y;
      this.dead = true;

      const isWall = Math.abs(mapHit.nx || 0) > 0.6;
      const customW = 26 + Math.random() * 12;
      const customLife = 180 + Math.floor(Math.random() * 70);
      const customIntensity = 0.65 + Math.random() * 0.55;

      // Tworzenie rozlanego ognia na powierzchni oraz korony rozbryzgu hydraulicznego
      spawnSurfaceFire(mapHit.x, mapHit.y, mapHit.nx || 0, mapHit.ny || -1, this.shooter, this.team, customW, customLife, customIntensity);
      spawnImpactSplash(mapHit.x, mapHit.y, mapHit.nx || 0, mapHit.ny || -1);

      // 50% szansy na spływającą kroplę napalmu przy uderzeniu w ścianę
      if (isWall && Math.random() < 0.50) {
        spawnBurningFuelGlob(
          mapHit.x + (mapHit.nx || 0) * 2,
          mapHit.y,
          (mapHit.nx || 0) * 1.2 + (Math.random() - 0.5) * 0.4,
          0.8 + Math.random() * 0.6,
          this.shooter,
          this.team,
          0.65 + Math.random() * 0.45
        );
      }
      return false;
    }

    // Uderzenie w podłoże terenu (uwzględnienie profilu leja w Arena 3)
    let effectiveGroundY = groundY;
    let groundNx = 0;
    let groundNy = -1;

    const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
    const isA3 = (curArena?.id === 'arena-3');
    if (isA3 && typeof getRiverbankGroundY === 'function') {
      const terrY = getRiverbankGroundY(this.x);
      const inRiverZone = (this.x >= 1650 && this.x <= 2750);
      const inWater = (inRiverZone && this.y >= 1305) || (!inRiverZone && terrY >= 1345 && this.y >= 1345);
      if (inWater) {
        this.dead = true;
        return false;
      }
      effectiveGroundY = terrY;
      const slope = (getRiverbankGroundY(this.x + 4) - getRiverbankGroundY(this.x - 4)) / 8;
      const sLen = Math.hypot(slope, 1);
      groundNx = slope / sLen;
      groundNy = -1 / sLen;
    }

    if (this.y >= effectiveGroundY - 4) {
      this.y = effectiveGroundY - 1;
      this.dead = true;
      const customW = 28 + Math.random() * 12;
      const customLife = 180 + Math.floor(Math.random() * 70);
      const customIntensity = 0.70 + Math.random() * 0.50;
      spawnSurfaceFire(this.x, effectiveGroundY, groundNx, groundNy, this.shooter, this.team, customW, customLife, customIntensity);
      spawnImpactSplash(this.x, effectiveGroundY, groundNx, groundNy);
      return false;
    }

    return true;
  }

  draw(ctx) {
    if (this.dead || !ctx) return;
    const sheet = getFlameSpritesheet();
    const progress = Math.max(0, Math.min(1.0, 1.0 - (this.life / this.maxLife)));
    const frameIdx = Math.min(7, Math.floor(progress * 8));

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);

    const drawSize = this.radius * 2.0;
    const endAlpha = Math.pow(this.life / this.maxLife, 0.65);

    if (sheet && sheet.complete && sheet.naturalWidth > 0) {
      const sx = frameIdx * FLAME_CELL_SIZE;
      const sy = FLAME_ROW_STREAM * FLAME_CELL_SIZE;
      ctx.globalAlpha = Math.min(0.95, endAlpha * 1.05);
      ctx.drawImage(sheet, sx, sy, FLAME_CELL_SIZE, FLAME_CELL_SIZE, -drawSize * 0.5, -drawSize * 0.5, drawSize, drawSize);
    } else {
      // Rezerwowy płaski okrąg bez createRadialGradient dla stabilnego 60 FPS
      ctx.globalAlpha = Math.min(0.95, endAlpha);
      ctx.fillStyle = progress > 0.70 ? '#78350f' : (progress > 0.45 ? '#dc2626' : (progress > 0.25 ? '#ea580c' : '#f97316'));
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      if (progress < 0.35) {
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

/**
 * Klasa rozlanego ognia na powierzchni (Surface Fire / Napalm Puddle)
 */
export class SurfaceFire {
  constructor(x, y, nx, ny, shooter, team, customWidth = null, customLife = null, customIntensity = null) {
    this.x = x;
    this.y = y;
    this.nx = nx;
    this.ny = ny;
    this.shooter = shooter;
    this.team = team;

    // Oblicz kąt powierzchni z wektora normalnego (dla poziomego podłoża nx=0, ny=-1 kąt wynosi 0 rad)
    let ang = Math.atan2(this.ny, this.nx) + Math.PI * 0.5;
    while (ang > Math.PI) ang -= Math.PI * 2;
    while (ang < -Math.PI) ang += Math.PI * 2;
    this.surfaceAngle = ang;

    this.width = (typeof customWidth === 'number' && customWidth > 0) ? customWidth : (34 + Math.random() * 10);
    this.life = (typeof customLife === 'number' && customLife > 0) ? customLife : (240 + Math.floor(Math.random() * 45)); // ~4-4.5s płonięcia na powierzchni
    this.maxLife = this.life;
    this.intensity = (typeof customIntensity === 'number') ? customIntensity : (0.75 + Math.random() * 0.5);
    this.seed = Math.random() * 1000;
    this.animTimer = Math.random() * 8;
    this.flowTimer = 0;
    this.supportCheckTimer = Math.floor(Math.random() * 6);
    this.damageCooldown = new Map();
    this.dead = false;
  }

  update(combatants, ball, groundY = 500, customObs = null) {
    if (this.dead) return false;

    this.life--;
    if (this.life <= 0) {
      this.dead = true;
      return false;
    }

    this.animTimer += 0.22; // ~13.2 klatek animacji na sekundę

    // Wygaszanie w toksycznym kwasie lub głębokiej wodzie
    const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
    if (curArena?.id === 'arena-2' && this.y >= 1250) {
      this.dead = true;
      return false;
    }
    if (curArena?.id === 'arena-3' && this.y >= 1390) {
      this.dead = true;
      return false;
    }

    // Weryfikacja podparcia i destrukcji podłoża (co 6 klatek)
    this.supportCheckTimer++;
    if (this.supportCheckTimer % 6 === 0) {
      const isA3 = curArena?.id === 'arena-3';
      const obs = customObs || obstacles;
      let hasSupport = false;

      if (isA3 && typeof getRiverbankGroundY === 'function') {
        const terrY = getRiverbankGroundY(this.x);
        if (Math.abs(terrY - this.y) < 14) hasSupport = true;
      }
      if (!hasSupport && Math.abs(this.y - groundY) < 14) {
        hasSupport = true;
      }
      if (!hasSupport && Array.isArray(ARENA_PLATFORMS)) {
        for (const plat of ARENA_PLATFORMS) {
          if (!plat || plat.intact === false) continue;
          if (this.x >= plat.x - 4 && this.x <= plat.x + plat.w + 4 && Math.abs(plat.y - this.y) < 12) {
            hasSupport = true;
            // Sprawdzenie krawędzi platformy: napalm skapuje w dół
            if (this.x < plat.x + 4) {
              spawnBurningFuelGlob(plat.x - 2, plat.y + 2, -0.6 - Math.random() * 0.6, 0.8, this.shooter, this.team, this.intensity * 0.6);
            } else if (this.x > plat.x + plat.w - 4) {
              spawnBurningFuelGlob(plat.x + plat.w + 2, plat.y + 2, 0.6 + Math.random() * 0.6, 0.8, this.shooter, this.team, this.intensity * 0.6);
            }
            break;
          }
        }
      }
      if (!hasSupport) {
        const supportHit = checkRayObstacleCollision(this.x, this.y - 4, this.x, this.y + 12, groundY, obs, null);
        if (supportHit) hasSupport = true;
      }

      // Jeśli podłoże zniknęło (np. zniszczony segment lub blok Tetrisa), ogień odpada w dół jako kropla
      if (!hasSupport && this.y < groundY - 20) {
        spawnBurningFuelGlob(this.x, this.y, (Math.random() - 0.5) * 1.0, 0.8, this.shooter, this.team, this.intensity * 0.8);
        this.dead = true;
        return false;
      }
    }

    // Dynamiczne spływanie ciekłego napalmu po pionowych ścianach lub stromych skarpach
    const isWall = Math.abs(this.nx) > 0.55;
    const isSlope = Math.abs(this.surfaceAngle) > 0.22;
    if (isWall) {
      this.y += 0.32;
      this.flowTimer++;
      if (this.flowTimer % 34 === 0 && Math.random() < 0.40) {
        spawnBurningFuelGlob(this.x + this.nx * 2, this.y, this.nx * 0.5, 1.2, this.shooter, this.team, this.intensity * 0.5);
      }
    } else if (isSlope) {
      const slideDir = this.surfaceAngle > 0 ? 1 : -1;
      this.x += slideDir * 0.22;
      if (curArena?.id === 'arena-3' && typeof getRiverbankGroundY === 'function') {
        this.y = getRiverbankGroundY(this.x);
      }
    }

    // Odliczanie cooldownów obrażeń dla celów
    for (const [ch, timer] of this.damageCooldown.entries()) {
      if (timer <= 1) {
        this.damageCooldown.delete(ch);
      } else {
        this.damageCooldown.set(ch, timer - 1);
      }
    }

    // 1. Zadawanie obrażeń postaciom stojącym w rozlanym ogniu
    const targets = Array.isArray(combatants) ? combatants : [];
    const isFFA = (typeof isDeathmatchFFA === 'function' ? isDeathmatchFFA() : false) ||
      (deathmatchState && deathmatchState.mode === 'FFA') ||
      (deathmatchConfig && deathmatchConfig.mode === 'FFA');

    const halfW = this.width * 0.55;
    const fireLeft = this.x - halfW;
    const fireRight = this.x + halfW;
    const fireTop = this.y - 28;
    const fireBottom = this.y + 4;
    const obs = customObs || obstacles;

    for (const ch of targets) {
      if (!ch) continue;
      const isLyingZombie = !!(ch.isZombie && ch.isDead && ch.hasHead && !ch.decapitated);
      if (ch.isZombie) {
        if (ch.isDead && !isLyingZombie) continue;
      } else {
        if (ch.isDead) continue;
        if (ch.isBot && !ch.active) continue;
      }
      if (!isFFA && !ch.isZombie && this.shooter && this.shooter.team && ch.team && this.shooter.team === ch.team) continue;
      if (!ch.isZombie && ch.spawnProtectionTimer && ch.spawnProtectionTimer > 0) continue;

      const hitW = ch.w || 24;
      const hitH = ch.h || 70;
      const isLowProfile = isLyingZombie || (ch.isZombie && ch.isCrawling);
      const chLeft = isLowProfile ? ch.x - (ch.facing === 1 ? 14 : 38) : ch.x;
      const chRight = isLowProfile ? ch.x + hitW + (ch.facing === 1 ? 38 : 14) : ch.x + hitW;
      const chTop = isLowProfile ? ch.y + hitH - 24 : ch.y;
      const chBottom = ch.y + hitH;

      // Sprawdzenie nachodzenia AABB postaci na strefę ognia
      const overlaps = !(chRight < fireLeft || chLeft > fireRight || chBottom < fireTop || chTop > fireBottom);
      if (overlaps) {
        // Blokada ognia przez przeszkodę: kałuża ognia nie rani postaci za ścianą
        const wallBetween = checkRayObstacleCollision(this.x, this.y - 6, ch.x + hitW * 0.5, ch.y + hitH * 0.45, groundY, obs, null);
        if (wallBetween && wallBetween.t < 0.92) {
          continue;
        }

        // Podpalenie postaci: krótkie wejście daje lekki płomień, dłuższe stanie w ogniu potęguje pożar
        if (!ch.burnTimer || ch.burnTimer <= 0 || !this.damageCooldown.has(ch)) {
          igniteCombatant(ch, this.shooter, 65, {
            intensity: 0.24,
            additiveIntensity: 0.11,
            additiveDuration: 18,
            maxDuration: 165,
            maxIntensity: 0.85
          });
        }

        if (!this.damageCooldown.has(ch)) {
          this.damageCooldown.set(ch, 11); // Tick obrażeń co 11 klatek (~5.5 ticków/s)
          const fireTickDmg = 4;
          if (isLyingZombie) {
            ch.downedHp = (ch.downedHp !== undefined ? ch.downedHp : 60) - fireTickDmg * 1.5;
            if (ch.downedHp <= 0) {
              handleZombieFireDeath(ch, this.shooter, groundY, true);
            }
          } else {
            ch.hp = Math.max(0, (ch.hp !== undefined ? ch.hp : 100) - fireTickDmg);
            ch.lastAttacker = this.shooter;
            ch.lastAttackerTimer = 240;

            if (ch.hp <= 0) {
              if (ch.isZombie) {
                handleZombieFireDeath(ch, this.shooter, this.y, false);
              } else if (!ch.isDead && !ch.isAcidDying) {
                handleFireDeath(ch, this.shooter, this.y);
              }
            }
          }
        }
      }
    }

    // 2. Podpalenie piłki przetaczającej się przez kałużę ognia
    if (ball) {
      const bDistX = Math.abs(ball.x - this.x);
      const bDistY = Math.abs(ball.y - this.y);
      if (bDistX < halfW + (ball.colRadius || 5.2) && bDistY < 24) {
        ball.burnTimer = Math.max(ball.burnTimer || 0, 90);
        ball.vx += (this.x < ball.x ? 0.15 : -0.15);
      }
    }

    return true;
  }

  draw(ctx) {
    if (this.dead || !ctx) return;
    const fadeIn = Math.min(1.0, (this.maxLife - this.life) / 12);
    const fadeOut = Math.min(1.0, this.life / 36);
    const alpha = fadeIn * fadeOut;
    if (alpha <= 0.01) return;

    renderFireCluster(ctx, {
      fires: [this],
      surfaceAngle: this.surfaceAngle,
      cx: this.x,
      cy: this.y,
      minT: -this.width * 0.65,
      maxT: this.width * 0.65,
      totalW: this.width * 1.3,
      avgTimer: this.animTimer,
      maxLifeRatio: alpha,
      clusterSeed: Math.abs(this.x * 12.9898 + this.y * 78.233) % 1000
    });
  }
}

/**
 * Całkowicie gasi ogień na postaci (np. przy zgonie i odrodzeniu)
 */
export function extinguishCombatant(combatant) {
  if (!combatant) return;
  combatant.burnTimer = 0;
  combatant.burnIntensity = 0;
  combatant.burnAttacker = null;
}

/**
 * Podpalenie postaci ze stopniowaniem intensywności (od lekkiego muśnięcia do pełnego oblania napalmem)
 */
export function igniteCombatant(combatant, attacker, durationFrames = 100, options = {}) {
  if (!combatant || combatant.isDead) return;
  if (!combatant.isZombie && combatant.spawnProtectionTimer && combatant.spawnProtectionTimer > 0) return;

  const prevTimer = combatant.burnTimer || 0;
  const prevInt = combatant.burnIntensity || 0;
  const maxDur = (typeof options.maxDuration === 'number') ? options.maxDuration : 265;
  const maxInt = (typeof options.maxIntensity === 'number') ? options.maxIntensity : 1.0;

  if (prevTimer <= 0) {
    combatant.burnTimer = Math.min(maxDur, durationFrames);
  } else {
    const addDur = (typeof options.additiveDuration === 'number') ? options.additiveDuration : 0;
    combatant.burnTimer = Math.min(maxDur, Math.max(prevTimer, durationFrames) + addDur);
  }

  const baseInt = (typeof options.intensity === 'number')
    ? options.intensity
    : Math.min(0.85, Math.max(0.25, durationFrames / 220));
  const addInt = (prevTimer > 0 && typeof options.additiveIntensity === 'number') ? options.additiveIntensity : 0;
  const nextInt = prevTimer > 0
    ? Math.max(prevInt + addInt, baseInt)
    : baseInt;

  combatant.burnIntensity = Math.min(maxInt, Math.max(0.12, nextInt));
  combatant.burnAttacker = attacker || combatant.burnAttacker;
}

/**
 * Obsługa definitywnego spalenia zombie na popiół
 */
export function handleZombieFireDeath(z, killer, groundY, wasDowned = false) {
  if (!z) return;
  z.isDead = true;
  z.decapitated = true; // Dekapitacja w logice zombie blokuje ponowne powstanie (brak reviveTimer)
  z.hasHead = false;
  z.reviveTimer = 0;
  z.decayTimer = 0;
  z.hp = 0;
  z.downedHp = 0;
  z.killer = killer || { name: 'PŁOMIENIE', isSelf: false };
  z.corpseFloorY = groundY;
  z.isBurnedToAsh = true;
  z.deathHitPoint = { x: z.x + (z.w || 24) * 0.5, y: z.y + (z.h || 70) * 0.4 };
  z.bleedTimer = 40;
  z.deathImpulse = { vx: (z.facing || 1) * 2.0, vy: -1.8 };

  spawnBloodSpurt(z.x + (z.w || 24) * 0.5, z.y + (z.h || 70) * 0.4, 0, -2.0, 18, 1.2);
  triggerScreenShake(6);

  if (typeof triggerCombatFeedBanner === 'function') {
    const msg = wasDowned
      ? '[SPALENIE] POWALONY ZOMBIE SPALONY NA POPIÓŁ!'
      : '[SPALENIE] ZOMBIE SPALONY NA POPIÓŁ!';
    triggerCombatFeedBanner('KILL', msg);
  }

  if (typeof window !== 'undefined') {
    if (typeof window.recordKill === 'function' && killer === window.player) {
      window.recordKill();
    }
    if (typeof window.registerKillstreakKill === 'function' && killer === window.player) {
      window.registerKillstreakKill();
    }
    if (zombieState && zombieState.stats) {
      zombieState.stats.killed = (zombieState.stats.killed || 0) + 1;
      zombieState.stats.decapitations = (zombieState.stats.decapitations || 0) + 1;
    }
  }

  const netState = (typeof window !== 'undefined' && window.networkState) ? window.networkState : null;
  const isNetConnected = (typeof window !== 'undefined') && Boolean(window.isNetworkActive?.() || window.wsState?.connected || (netState && netState.isConnected));
  const isNetHost = (typeof window !== 'undefined' && typeof window.isMatchHost === 'function')
    ? window.isMatchHost()
    : Boolean(netState && netState.isHost);

  if (isNetConnected && !isNetHost) {
    if (typeof window.sendDamageEvent === 'function') {
      window.sendDamageEvent({
        target: 'zombie',
        zombieId: z.id,
        damage: 999,
        isHeadshot: true,
        attackerId: killer?.id
      });
    }
  }
}

/**
 * Obsługa zgonu postaci od ognia (rozczłonkowanie / okopcenie / impuls)
 */
function handleFireDeath(ch, killer, groundY) {
  if (ch.isZombie) {
    return handleZombieFireDeath(ch, killer, groundY, false);
  }
  ch.isDead = true;
  extinguishCombatant(ch);
  ch.killer = killer || { name: 'PŁOMIENIE', isSelf: false };
  ch.respawnTimer = 180;
  ch.corpseFloorY = groundY;
  ch.dismembered = { armFront: false, armBack: false, legFront: false, legBack: false };
  ch.deathHitPoint = { x: ch.x + (ch.w || 24) * 0.5, y: ch.y + (ch.h || 70) * 0.4 };
  ch.bleedTimer = 60;
  ch.deathImpulse = { vx: (ch.facing || 1) * 2.5, vy: -2.2 };
  ch.ragdoll = null;

  if (ch.currentWeapon) {
    spawnDroppedWeapon(
      ch.x + (ch.w || 24) * 0.5,
      ch.y + 28,
      (ch.facing || 1) * 2.0,
      -3.5,
      ch.currentWeapon,
      ch.facing
    );
  }
  triggerScreenShake(8);
}

/**
 * Wystrzelenie strumienia płomieni z miotacza ognia
 */
export function spawnFlamethrowerStream(shooter, muzzleX, muzzleY, theta, weapon) {
  if (!shooter) return;

  // Ograniczenie maksymalnej liczby aktywnych cząstek dla stabilnego 60 FPS
  while (activeFlameStreams.length > 90) {
    activeFlameStreams.shift();
  }

  const effectiveGroundY = (typeof shooter.groundY === 'number' && shooter.groundY > 0)
    ? shooter.groundY
    : (typeof GROUND_Y === 'number' && GROUND_Y > 0 ? GROUND_Y : 500);

  // Weryfikacja: nie pozwalamy ziać ogniem przez przeszkody, gdy wylot styka się ze ścianą
  const chestX = shooter.x + (shooter.w || 24) * 0.5;
  const chestY = shooter.y + (shooter.h || 70) * 0.35;
  const clearanceHit = checkRayObstacleCollision(chestX, chestY, muzzleX, muzzleY, effectiveGroundY, obstacles, null);
  if (clearanceHit) {
    spawnSurfaceFire(clearanceHit.x, clearanceHit.y, clearanceHit.nx || 0, clearanceHit.ny || -1, shooter, shooter.team);
    spawnImpactSplash(clearanceHit.x, clearanceHit.y, clearanceHit.nx || 0, clearanceHit.ny || -1);
    return;
  }

  // Zapisujemy najświeższy punkt wylotu lufy dla ciągłego rdzenia cieczy
  shooter._lastFlameMuzzle = { x: muzzleX, y: muzzleY, timer: 6 };

  const spread = weapon?.spread || 0.055;
  const baseSpd = weapon?.bulletSpeed || 19.5;

  // 1. Główny węzeł strugi ciekłego napalmu (Spine Node) - zwarty kierunek
  const spineAngle = theta + (Math.random() - 0.5) * (spread * 0.35);
  const spineSpd = baseSpd * (0.97 + Math.random() * 0.08);
  const pSpine = new FlameParticle(shooter, muzzleX, muzzleY, spineAngle, spineSpd, weapon, { isSpine: true });
  activeFlameStreams.push(pSpine);

  // 2. Turbulentny kłąb płomieni (Combustion Billow) - szerszy płaszcz ognia
  const billowAngle = theta + (Math.random() - 0.5) * (spread * 1.15);
  const billowSpd = baseSpd * (0.88 + Math.random() * 0.16);
  const pBillow = new FlameParticle(shooter, muzzleX, muzzleY, billowAngle, billowSpd, weapon, { isSpine: false });
  activeFlameStreams.push(pBillow);
}

/**
 * Spawnowanie rozlanego ognia na powierzchni
 */
export function spawnSurfaceFire(x, y, nx, ny, shooter, team, customWidth = null, customLife = null, customIntensity = null) {
  // Ograniczenie maksymalnej liczby węzłów ognia dla zachowania 60 FPS
  while (activeSurfaceFires.length >= 65) {
    activeSurfaceFires.shift();
  }

  // Scalanie z bardzo bliskimi sąsiednimi kroplami ognia
  for (const existing of activeSurfaceFires) {
    if (existing.dead) continue;
    const distSq = (existing.x - x) * (existing.x - x) + (existing.y - y) * (existing.y - y);
    if (distSq < 15 * 15 && (!shooter || existing.shooter === shooter)) {
      existing.life = Math.min(existing.maxLife, existing.life + 45);
      existing.width = Math.min(64, existing.width + 3);
      if (typeof customIntensity === 'number') {
        existing.intensity = Math.min(1.6, Math.max(existing.intensity, customIntensity + 0.15));
      }
      return existing;
    }
  }

  const fire = new SurfaceFire(x, y, nx, ny, shooter, team, customWidth, customLife, customIntensity);
  activeSurfaceFires.push(fire);
  return fire;
}

/**
 * Główna pętla aktualizacji strumienia ognia i rozlanego ognia
 */
export function updateFlamethrower(groundY, platforms, customObs, combatants, ball) {
  // 1. Aktualizacja cząstek w locie
  for (let i = activeFlameStreams.length - 1; i >= 0; i--) {
    const p = activeFlameStreams[i];
    const alive = p.update(groundY, platforms, customObs, combatants, ball);
    if (!alive || p.dead) {
      activeFlameStreams.splice(i, 1);
    }
  }

  // 2. Aktualizacja rozbryzgów uderzeniowych
  for (let i = activeImpactSplashes.length - 1; i >= 0; i--) {
    const splash = activeImpactSplashes[i];
    const alive = splash.update();
    if (!alive || splash.dead) {
      activeImpactSplashes.splice(i, 1);
    }
  }

  // 3. Aktualizacja fizycznych kropel płonącego paliwa (Burning Fuel Globs)
  for (let i = activeFuelGlobs.length - 1; i >= 0; i--) {
    const glob = activeFuelGlobs[i];
    const alive = glob.update(groundY, platforms, customObs);
    if (!alive || glob.dead) {
      activeFuelGlobs.splice(i, 1);
    }
  }

  // 4. Aktualizacja rozlanego ognia na powierzchniach
  for (let i = activeSurfaceFires.length - 1; i >= 0; i--) {
    const fire = activeSurfaceFires[i];
    const alive = fire.update(combatants, ball, groundY, customObs);
    if (!alive || fire.dead) {
      activeSurfaceFires.splice(i, 1);
    }
  }

  // 4. Odliczanie timerów wylotu lufy
  const targets = Array.isArray(combatants) ? combatants : [];
  for (const ch of targets) {
    if (ch && ch._lastFlameMuzzle && ch._lastFlameMuzzle.timer > 0) {
      ch._lastFlameMuzzle.timer--;
    }
  }
  if (typeof window !== 'undefined' && window.player && window.player._lastFlameMuzzle && window.player._lastFlameMuzzle.timer > 0) {
    window.player._lastFlameMuzzle.timer--;
  }

  // 5. Obsługa statusu podpalenia postaci (DoT palenia się)
  for (const ch of targets) {
    if (!ch) continue;
    const isLyingZombie = !!(ch.isZombie && ch.isDead && ch.hasHead && !ch.decapitated);
    if (ch.isZombie) {
      if (ch.isDead && !isLyingZombie) {
        if (ch.burnTimer > 0 || ch.burnAttacker) extinguishCombatant(ch);
        continue;
      }
    } else {
      if (ch.isDead) {
        if (ch.burnTimer > 0 || ch.burnAttacker) extinguishCombatant(ch);
        continue;
      }
    }

    if (ch.burnTimer && ch.burnTimer > 0) {
      // Wygaszanie ognia po wejściu do wody w rzece Areny 3
      const curArenaObj = (typeof getActiveArena === 'function') ? getActiveArena() : null;
      if (curArenaObj?.id === 'arena-3') {
        const chCx = ch.x + (ch.w || 24) * 0.5;
        const chFeetY = ch.y + (ch.h || 70);
        if (chCx >= 1560 && chCx <= 2840 && chFeetY >= 1300) {
          ch.burnTimer = Math.max(0, ch.burnTimer - 6);
          ch.burnIntensity = Math.max(0, (ch.burnIntensity || 0.3) * 0.85);
          if (ch.burnTimer <= 0) {
            extinguishCombatant(ch);
            continue;
          }
        }
      }

      ch.burnTimer--;
      if (typeof ch.burnIntensity !== 'number' || ch.burnIntensity <= 0) {
        ch.burnIntensity = Math.min(0.85, Math.max(0.22, ch.burnTimer / 180));
      } else if (ch.burnTimer < 70) {
        ch.burnIntensity = Math.max(0.08, ch.burnIntensity * 0.982);
      } else {
        ch.burnIntensity = Math.max(0.22, ch.burnIntensity - 0.0012);
      }

      // Ciepły blask dynamiczny na otoczeniu podczas silnego pożaru postaci
      if (ch.burnIntensity >= 0.42 && ch.burnTimer % 6 === 0) {
        addDynamicLight({
          x: ch.x + (ch.w || 24) * 0.5,
          y: ch.y + (ch.h || 70) * 0.45,
          radius: 95 + ch.burnIntensity * 75,
          color: ch.burnIntensity >= 0.72 ? '#ff6b1a' : '#f97316',
          intensity: 0.25 + ch.burnIntensity * 0.35,
          duration: 0.12,
          flicker: true,
          followEntity: ch
        });
      }

      if (ch.burnTimer % 15 === 0) {
        const bInt = ch.burnIntensity || 0.35;
        if (isLyingZombie) {
          const lyingDmg = bInt >= 0.72 ? 5 : (bInt >= 0.40 ? 3 : 2);
          ch.downedHp = (ch.downedHp !== undefined ? ch.downedHp : 60) - lyingDmg;
          if (ch.downedHp <= 0) {
            handleZombieFireDeath(ch, ch.burnAttacker, groundY, true);
          }
        } else {
          const tickDmg = bInt >= 0.72 ? 4 : (bInt >= 0.40 ? 2 : 1);
          ch.hp = Math.max(0, (ch.hp !== undefined ? ch.hp : 100) - tickDmg);
          if (ch.hp <= 0) {
            if (ch.isZombie) {
              handleZombieFireDeath(ch, ch.burnAttacker, groundY, false);
            } else if (!ch.isDead && !ch.isAcidDying) {
              handleFireDeath(ch, ch.burnAttacker, groundY);
            }
          }
        }
      }

      if (ch.burnTimer <= 0) {
        extinguishCombatant(ch);
      }
    }
  }

  // 4. Obsługa płonącej piłki
  if (ball && ball.burnTimer && ball.burnTimer > 0) {
    ball.burnTimer--;
  }
}

/**
 * Renderowanie strumienia ciekłego napalmu w locie (Liquid Napalm Stream Pipeline)
 * Warstwy:
 * 1. Rozbryzgi uderzeniowe napalmu na przeszkodach (Impact Splashes)
 * 2. Kłęby dymu i ciemny żar tła na czole strugi (Outer Soot & Smoke)
 * 3. Zwarty, ryczący płaszcz ognia z interpolacją węzłów bez pustych luk (Combustion Mantle)
 * 4. Ciśnieniowy, biało-żółty lity rdzeń ciekłego napalmu od wylotu lufy (Pressurized Liquid Fuel Jet Ribbon)
 * 5. Odrywające się lepkie krople ciekłego żelu z trajektorią grawitacyjną (Viscous Droplets)
 */
export function drawFlamethrowerStreams(ctx, camera) {
  if (!ctx || (activeFlameStreams.length === 0 && activeImpactSplashes.length === 0)) return;

  // 2D Camera Frustum Culling
  let minX = -10000, maxX = 10000, minY = -10000, maxY = 10000;
  if (camera && typeof camera.x === 'number' && typeof camera.y === 'number') {
    const zoom = camera.zoom || 1;
    const viewW = camera.viewWidth || (1920 / zoom);
    const viewH = camera.viewHeight || (1080 / zoom);
    const margin = 120;
    minX = camera.x - margin;
    maxX = camera.x + viewW + margin;
    minY = camera.y - margin;
    maxY = camera.y + viewH + margin;
  }

  // 1. Rysowanie rozbryzgów uderzeniowych na przeszkodach
  for (const splash of activeImpactSplashes) {
    if (splash.x < minX || splash.x > maxX || splash.y < minY || splash.y > maxY) continue;
    splash.draw(ctx);
  }

  if (activeFlameStreams.length === 0) return;

  const sheet = getFlameSpritesheet();
  const hasSheet = !!(sheet && sheet.complete && sheet.naturalWidth > 0);

  // 2. Grupowanie cząstek według strzelca dla zachowania niezależnych strug
  const streamGroups = new Map();
  for (const p of activeFlameStreams) {
    if (p.dead) continue;
    if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) continue;
    const sId = p.shooterId || 'default';
    let grp = streamGroups.get(sId);
    if (!grp) {
      grp = { shooter: p.shooter, particles: [] };
      streamGroups.set(sId, grp);
    }
    grp.particles.push(p);
  }

  for (const { shooter, particles } of streamGroups.values()) {
    const spineNodes = [];
    const billows = [];

    for (const p of particles) {
      if (p.isSpine) spineNodes.push(p);
      else billows.push(p);
    }

    // Sortowanie węzłów strugi od najstarszych (czoło strugi) do najmłodszych (blisko lufy)
    spineNodes.sort((a, b) => a.life - b.life);

    // =========================================================================
    // 1. RDZEŃ DYSZY CIŚNIENIOWEJ (Muzzle Pressure Jet) - POD SPODEM KŁĘBÓW OGNIA
    // Tylko pierwsze 15-20% zasięgu (progress < 0.20), w odległości < 85 px od lufy.
    // Ostro zwężający się stożek od dyszy (4 px przy lufie rozszerzające się w mgłę)
    // =========================================================================
    if (shooter?._lastFlameMuzzle && shooter._lastFlameMuzzle.timer > 0) {
      const muzX = shooter._lastFlameMuzzle.x;
      const muzY = shooter._lastFlameMuzzle.y;

      const nearSpine = [];
      for (const p of spineNodes) {
        const prog = 1.0 - (p.life / p.maxLife);
        if (prog < 0.20) {
          const dist = Math.hypot(p.x - muzX, p.y - muzY);
          if (dist < 85) {
            nearSpine.push({ p, dist, prog });
          }
        }
      }
      nearSpine.sort((a, b) => a.dist - b.dist);

      if (nearSpine.length > 0) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        let curX = muzX;
        let curY = muzY;

        for (let i = 0; i < nearSpine.length; i++) {
          const { p, dist } = nearSpine[i];
          const tDist = Math.min(1.0, dist / 85);
          const outerW = 4.0 + tDist * 6.0;
          const innerW = 2.0 + tDist * 3.0;
          const jetAlpha = Math.max(0, 1.0 - tDist * 0.7);

          // Płaszcz rozproszonego paliwa
          ctx.beginPath();
          ctx.moveTo(curX, curY);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `rgba(234, 88, 12, ${0.75 * jetAlpha})`;
          ctx.lineWidth = outerW;
          ctx.stroke();

          // Żarzący się rdzeń paliwa pod ciśnieniem
          ctx.beginPath();
          ctx.moveTo(curX, curY);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `rgba(254, 240, 138, ${0.95 * jetAlpha})`;
          ctx.lineWidth = innerW;
          ctx.stroke();

          curX = p.x;
          curY = p.y;
        }

        // Błysk wylotu dyszy (Muzzle Jet Root)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(muzX, muzY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // =========================================================================
    // WARSTWA A: Pełna bryła płomienia (source-over dla WSZYSTKICH cząstek 0..1)
    // Jednolity, ciągły płaszcz ognia od samej lufy aż po czubek bez szwu w połowie
    // =========================================================================
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    // 1. Węzły osiowe (spineNodes) od najstarszych do najmłodszych z interpolacją
    for (let i = 0; i < spineNodes.length; i++) {
      const p = spineNodes[i];
      p.draw(ctx);

      // Interpolacja kłębu ognia pomiędzy sąsiednimi węzłami
      if (i < spineNodes.length - 1) {
        const nextP = spineNodes[i + 1];
        const dx = nextP.x - p.x;
        const dy = nextP.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist > p.radius * 0.45 && dist < 120) {
          const steps = dist > p.radius * 1.05 ? [0.33, 0.67] : [0.5];
          for (const t of steps) {
            const midX = p.x + dx * t;
            const midY = p.y + dy * t;
            const midRad = p.radius + (nextP.radius - p.radius) * t;
            const midLife = p.life + (nextP.life - p.life) * t;
            const midMaxLife = p.maxLife + (nextP.maxLife - p.maxLife) * t;
            const midProgress = Math.max(0, Math.min(1.0, 1.0 - (midLife / midMaxLife)));
            const frameIdx = Math.min(7, Math.floor(midProgress * 8));
            const drawSize = midRad * 2.0;
            const endAlpha = Math.pow(midLife / midMaxLife, 0.65);

            ctx.save();
            ctx.translate(midX, midY);
            ctx.rotate(p.rot + (nextP.rot - p.rot) * t);
            if (hasSheet) {
              const sx = frameIdx * FLAME_CELL_SIZE;
              const sy = FLAME_ROW_STREAM * FLAME_CELL_SIZE;
              ctx.globalAlpha = Math.min(0.95, endAlpha * 1.05);
              ctx.drawImage(sheet, sx, sy, FLAME_CELL_SIZE, FLAME_CELL_SIZE, -drawSize * 0.5, -drawSize * 0.5, drawSize, drawSize);
            } else {
              ctx.globalAlpha = Math.min(0.95, endAlpha);
              ctx.fillStyle = midProgress > 0.70 ? '#78350f' : (midProgress > 0.45 ? '#dc2626' : (midProgress > 0.25 ? '#ea580c' : '#f97316'));
              ctx.beginPath();
              ctx.arc(0, 0, midRad, 0, Math.PI * 2);
              ctx.fill();

              if (midProgress < 0.35) {
                ctx.fillStyle = '#fef08a';
                ctx.beginPath();
                ctx.arc(0, 0, midRad * 0.5, 0, Math.PI * 2);
                ctx.fill();
              }
            }
            ctx.restore();
          }
        }
      }
    }

    // 2. Kłęby turbulentne (billows) dla pełnej objętości płomienia
    for (const p of billows) {
      p.draw(ctx);
    }

    ctx.restore();

    // =========================================================================
    // WARSTWA B: Żarzący się rdzeń plazmowy (lighter z niskim Alpha wzdłuż osi)
    // Pomniejszony sprajt (coreSize = drawSize * 0.58) z łagodnym kryciem dla progress < 0.70
    // =========================================================================
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < spineNodes.length; i++) {
      const p = spineNodes[i];
      const progress = 1.0 - (p.life / p.maxLife);
      if (progress < 0.70) {
        const frameIdx = Math.min(7, Math.floor(progress * 8));
        const drawSize = p.radius * 2.0;
        const coreSize = drawSize * 0.58;
        const coreAlpha = (1.0 - progress / 0.70) * 0.34;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = coreAlpha;

        if (hasSheet) {
          const sx = frameIdx * FLAME_CELL_SIZE;
          const sy = FLAME_ROW_STREAM * FLAME_CELL_SIZE;
          ctx.drawImage(sheet, sx, sy, FLAME_CELL_SIZE, FLAME_CELL_SIZE, -coreSize * 0.5, -coreSize * 0.5, coreSize, coreSize);
        } else {
          ctx.fillStyle = progress < 0.25 ? '#ffffff' : '#fef08a';
          ctx.beginPath();
          ctx.arc(0, 0, coreSize * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Rdzeń w punktach pośrednich midX, midY
      if (i < spineNodes.length - 1) {
        const nextP = spineNodes[i + 1];
        const dx = nextP.x - p.x;
        const dy = nextP.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist > p.radius * 0.45 && dist < 120) {
          const steps = dist > p.radius * 1.05 ? [0.33, 0.67] : [0.5];
          for (const t of steps) {
            const midLife = p.life + (nextP.life - p.life) * t;
            const midMaxLife = p.maxLife + (nextP.maxLife - p.maxLife) * t;
            const midProgress = Math.max(0, Math.min(1.0, 1.0 - (midLife / midMaxLife)));
            if (midProgress < 0.70) {
              const midX = p.x + dx * t;
              const midY = p.y + dy * t;
              const midRad = p.radius + (nextP.radius - p.radius) * t;
              const drawSize = midRad * 2.0;
              const coreSize = drawSize * 0.58;
              const coreAlpha = (1.0 - midProgress / 0.70) * 0.34;
              const frameIdx = Math.min(7, Math.floor(midProgress * 8));

              ctx.save();
              ctx.translate(midX, midY);
              ctx.rotate(p.rot + (nextP.rot - p.rot) * t);
              ctx.globalAlpha = coreAlpha;

              if (hasSheet) {
                const sx = frameIdx * FLAME_CELL_SIZE;
                const sy = FLAME_ROW_STREAM * FLAME_CELL_SIZE;
                ctx.drawImage(sheet, sx, sy, FLAME_CELL_SIZE, FLAME_CELL_SIZE, -coreSize * 0.5, -coreSize * 0.5, coreSize, coreSize);
              } else {
                ctx.fillStyle = midProgress < 0.25 ? '#ffffff' : '#fef08a';
                ctx.beginPath();
                ctx.arc(0, 0, coreSize * 0.5, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();
            }
          }
        }
      }
    }

    ctx.restore();
  }
}

/**
 * Próbkuje wysokość powierzchni w punkcie wx: uwzględnia rzekę w Arenie 3, platformy lub interpolację ognisk
 */
function sampleBaseY(wx, clusterFires, isA3) {
  if (isA3 && typeof getRiverbankGroundY === 'function') {
    const rY = getRiverbankGroundY(wx);
    if (Math.abs(rY - clusterFires[0].y) < 45) {
      return rY;
    }
  }
  if (Array.isArray(ARENA_PLATFORMS)) {
    for (const plat of ARENA_PLATFORMS) {
      if (!plat || plat.intact === false) continue;
      if (wx >= plat.x - 6 && wx <= plat.x + plat.w + 6 && Math.abs(plat.y - clusterFires[0].y) < 22) {
        return plat.y;
      }
    }
  }
  let sumWeight = 0;
  let sumY = 0;
  for (let k = 0; k < clusterFires.length; k++) {
    const f = clusterFires[k];
    const dist = Math.abs(wx - f.x);
    const w = 1 / (dist * dist + 16);
    sumWeight += w;
    sumY += f.y * w;
  }
  return sumWeight > 0 ? sumY / sumWeight : clusterFires[0].y;
}

/**
 * Oblicza lokalną gęstość energii termicznej (ciągłe pole ciepła) w punkcie wx bez sztucznych podziałów
 */
function sampleLocalHeat(wx, clusterFires) {
  let heat = 0;
  for (let k = 0; k < clusterFires.length; k++) {
    const f = clusterFires[k];
    const dist = Math.abs(wx - f.x);
    const radius = f.width * 0.85;
    if (dist < radius) {
      const norm = dist / radius;
      const bell = 0.5 * (1 + Math.cos(norm * Math.PI));
      const fadeIn = Math.min(1.0, (f.maxLife - f.life) / 12);
      const fadeOut = Math.min(1.0, f.life / 36);
      const nodeAlpha = fadeIn * fadeOut;
      const nodeIntensity = f.intensity || 0.85;
      heat += bell * bell * nodeIntensity * nodeAlpha;
    }
  }
  return heat;
}

/**
 * Renderuje organiczny pas ognia naziemnego i na skarpach (Ground/Slope Fire)
 * W pełni w przestrzeni świata: podstawa wiernie przylega do krzywizny terenu, a płomienie unoszą się w -Y
 */
function renderGroundCluster(ctx, cluster) {
  const { fires, totalW, avgTimer, maxLifeRatio, clusterSeed } = cluster;
  if (!fires || fires.length === 0 || maxLifeRatio <= 0.01) return;

  const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
  const isA3 = curArena?.id === 'arena-3';

  // 1. Wyznacz granice X w przestrzeni świata
  let minX = Infinity;
  let maxX = -Infinity;
  for (let i = 0; i < fires.length; i++) {
    const f = fires[i];
    const half = f.width * 0.75;
    if (f.x - half < minX) minX = f.x - half;
    if (f.x + half > maxX) maxX = f.x + half;
  }
  const clusterW = maxX - minX;
  if (clusterW <= 4) return;

  // 2. Krok próbkowania wzdłuż osi X (zoptymalizowana siatka wielokąta)
  const numSteps = Math.max(8, Math.min(26, Math.ceil(clusterW / 8.5)));
  const stepW = clusterW / numSteps;

  const groundPoints = new Array(numSteps + 1);
  const crestPoints = new Array(numSteps + 1);

  for (let i = 0; i <= numSteps; i++) {
    const wx = minX + i * stepW;
    const baseY = sampleBaseY(wx, fires, isA3);
    const heat = sampleLocalHeat(wx, fires);

    const edgeDist = Math.min(wx - minX, maxX - wx);
    let taper = Math.min(1.0, Math.max(0.0, edgeDist / 18));
    taper = taper * taper * (3 - 2 * taper); // Smoothstep

    const w1 = Math.sin(wx * 0.065 + avgTimer * 3.2 + clusterSeed);
    const w2 = Math.sin(wx * 0.14 - avgTimer * 4.1 + clusterSeed * 1.7);
    const w3 = Math.cos(wx * 0.032 + avgTimer * 1.8);
    const w4 = Math.sin(wx * 0.28 - avgTimer * 6.5);
    const noise = (w1 * 0.40 + w2 * 0.30 + w3 * 0.20 + w4 * 0.10);

    const effHeat = Math.min(1.8, heat * taper);
    const flameH = effHeat > 0.02 ? Math.max(3, (22 + effHeat * 22) * (0.82 + 0.36 * noise)) : 0;

    groundPoints[i] = { wx, y: baseY };
    crestPoints[i] = { wx, y: baseY - flameH, h: flameH, effHeat };
  }

  ctx.save();

  // =========================================================================
  // WARSTWA 1: Płonący stop napalmowy (Molten Napalm Crust na podłożu)
  // Wiernie przylega do terenu / platformy areny
  // =========================================================================
  ctx.globalAlpha = Math.min(0.95, maxLifeRatio * 0.95);
  ctx.strokeStyle = '#220303';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  for (let i = 0; i <= numSteps; i++) {
    if (i === 0) ctx.moveTo(groundPoints[i].wx, groundPoints[i].y + 1.2);
    else ctx.lineTo(groundPoints[i].wx, groundPoints[i].y + 1.2);
  }
  ctx.stroke();

  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i <= numSteps; i++) {
    if (i === 0) ctx.moveTo(groundPoints[i].wx, groundPoints[i].y + 0.4);
    else ctx.lineTo(groundPoints[i].wx, groundPoints[i].y + 0.4);
  }
  ctx.stroke();

  // =========================================================================
  // WARSTWA 2: Ciągły, dynamiczny płaszcz ognia (Continuous Flame Body)
  // =========================================================================
  // 2A. Głęboka czerwień i ciemny szkarłat
  ctx.globalAlpha = Math.min(0.92, maxLifeRatio * 0.90);
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(groundPoints[0].wx, groundPoints[0].y);
  for (let i = 0; i <= numSteps; i++) {
    ctx.lineTo(crestPoints[i].wx, crestPoints[i].y);
  }
  for (let i = numSteps; i >= 0; i--) {
    ctx.lineTo(groundPoints[i].wx, groundPoints[i].y);
  }
  ctx.closePath();
  ctx.fill();

  // 2B. Jaskrawy, gorący pomarańcz (70% wysokości)
  ctx.globalAlpha = Math.min(0.96, maxLifeRatio * 0.94);
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(groundPoints[0].wx, groundPoints[0].y);
  for (let i = 0; i <= numSteps; i++) {
    const midY = groundPoints[i].y - crestPoints[i].h * 0.70;
    ctx.lineTo(crestPoints[i].wx, midY);
  }
  for (let i = numSteps; i >= 0; i--) {
    ctx.lineTo(groundPoints[i].wx, groundPoints[i].y);
  }
  ctx.closePath();
  ctx.fill();

  // 2C. Addytywne rozświetlenie rdzenia ('lighter')
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Gorące złoto (42% wysokości)
  ctx.globalAlpha = Math.min(0.85, maxLifeRatio * 0.75);
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.moveTo(groundPoints[0].wx, groundPoints[0].y);
  for (let i = 0; i <= numSteps; i++) {
    const goldY = groundPoints[i].y - crestPoints[i].h * 0.42;
    ctx.lineTo(crestPoints[i].wx, goldY);
  }
  for (let i = numSteps; i >= 0; i--) {
    ctx.lineTo(groundPoints[i].wx, groundPoints[i].y);
  }
  ctx.closePath();
  ctx.fill();

  // Biały rdzeń u samej podstawy (18% wysokości)
  ctx.globalAlpha = Math.min(0.70, maxLifeRatio * 0.58);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(groundPoints[0].wx, groundPoints[0].y);
  for (let i = 0; i <= numSteps; i++) {
    const whiteY = groundPoints[i].y - crestPoints[i].h * 0.18;
    ctx.lineTo(crestPoints[i].wx, whiteY);
  }
  for (let i = numSteps; i >= 0; i--) {
    ctx.lineTo(groundPoints[i].wx, groundPoints[i].y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // =========================================================================
  // WARSTWA 3: Strzeliste, organiczne języki ognia (Zgrupowane w 2 wywołania GPU)
  // =========================================================================
  const numTongues = Math.max(2, Math.min(6, Math.floor(clusterW / 26)));
  const tongueInterval = clusterW / (numTongues + 1);
  const validTongues = [];

  for (let k = 1; k <= numTongues; k++) {
    const jitter = Math.sin(k * 5.41 + clusterSeed) * 5;
    const tX = minX + k * tongueInterval + jitter;
    const tBaseY = sampleBaseY(tX, fires, isA3);
    const tHeat = sampleLocalHeat(tX, fires);
    if (tHeat <= 0.12) continue;

    const edgeDist = Math.min(tX - minX, maxX - tX);
    let tTaper = Math.min(1.0, Math.max(0.0, edgeDist / 18));
    tTaper = tTaper * tTaper * (3 - 2 * tTaper);

    const tongueH = tTaper * tHeat * (34 + Math.sin(avgTimer * 4.8 + k * 2.3) * 12 + Math.cos(avgTimer * 7.5 + k * 1.5) * 6);
    if (tongueH < 6) continue;

    const sway = Math.sin(avgTimer * 3.9 + k * 1.9) * 6;
    const tongueW = 5 + Math.sin(k * 3.1) * 2;
    validTongues.push({ tX, tBaseY, tongueH, sway, tongueW });
  }

  if (validTongues.length > 0) {
    // 3A. Zewnętrzne języki (1 wywołanie fill)
    ctx.globalAlpha = Math.min(0.95, maxLifeRatio * 0.92);
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    for (let k = 0; k < validTongues.length; k++) {
      const { tX, tBaseY, tongueH, sway, tongueW } = validTongues[k];
      ctx.moveTo(tX - tongueW, tBaseY);
      ctx.quadraticCurveTo(tX + sway * 0.5, tBaseY - tongueH * 0.65, tX + sway, tBaseY - tongueH);
      ctx.quadraticCurveTo(tX + sway * 0.5 + tongueW * 0.2, tBaseY - tongueH * 0.45, tX + tongueW, tBaseY);
    }
    ctx.fill();

    // 3B. Wewnętrzne gorące groty języków (1 wywołanie fill)
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    for (let k = 0; k < validTongues.length; k++) {
      const { tX, tBaseY, tongueH, sway, tongueW } = validTongues[k];
      ctx.moveTo(tX - tongueW * 0.5, tBaseY);
      ctx.quadraticCurveTo(tX + sway * 0.4, tBaseY - tongueH * 0.50, tX + sway * 0.7, tBaseY - tongueH * 0.72);
      ctx.quadraticCurveTo(tX + sway * 0.4 + tongueW * 0.1, tBaseY - tongueH * 0.35, tX + tongueW * 0.5, tBaseY);
    }
    ctx.fill();
  }

  // =========================================================================
  // WARSTWA 4: Odrywające się płonące kłębki i unoszące się iskry (Embers)
  // =========================================================================
  const numWisps = Math.min(5, Math.max(2, Math.floor(clusterW / 22)));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.min(0.90, maxLifeRatio * 0.85);
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  for (let w = 0; w < numWisps; w++) {
    const wSeed = clusterSeed + w * 37.19;
    const wCycle = (avgTimer * 0.08 + w * 0.23) % 1.0;
    const wProgress = wCycle < 0 ? wCycle + 1.0 : wCycle;
    const rndNorm = (Math.sin(wSeed) * 0.5 + 0.5);
    const wX = minX + 10 + rndNorm * (clusterW - 20) + Math.sin(wProgress * 6.28 + w) * 6;
    const wBaseY = sampleBaseY(wX, fires, isA3);
    const wHeat = sampleLocalHeat(wX, fires);
    if (wHeat <= 0.08) continue;

    const wY = wBaseY - 18 - wProgress * (34 + Math.sin(wSeed * 2) * 12);
    ctx.moveTo(wX + 1.3, wY);
    ctx.arc(wX, wY, 1.3, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();

  // =========================================================================
  // WARSTWA 5: Delikatne dymne powiewy nad najwyższymi płomieniami
  // =========================================================================
  const numSmoke = Math.min(3, Math.max(1, Math.floor(clusterW / 45)));
  ctx.save();
  ctx.fillStyle = 'rgba(28, 22, 22, 0.20)';
  ctx.globalAlpha = Math.min(0.25, maxLifeRatio * 0.22);
  ctx.beginPath();
  for (let s = 0; s < numSmoke; s++) {
    const sSeed = clusterSeed + s * 49.33;
    const sCycle = (avgTimer * 0.042 + s * 0.31) % 1.0;
    const sProgress = sCycle < 0 ? sCycle + 1.0 : sCycle;
    const sX = minX + 14 + ((Math.cos(sSeed) * 0.5 + 0.5) * (clusterW - 28)) + Math.sin(sProgress * 4.0 + s) * 9;
    const sBaseY = sampleBaseY(sX, fires, isA3);
    const sY = sBaseY - 36 - sProgress * 26;
    const sRad = 4 + sProgress * 8;
    ctx.moveTo(sX + sRad, sY);
    ctx.arc(sX, sY, sRad, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Renderuje ogień płonący na pionowej ścianie (Wall Fire)
 */
function renderWallCluster(ctx, cluster) {
  const { fires, surfaceAngle, cx, totalW, avgTimer, maxLifeRatio, clusterSeed } = cluster;
  if (!fires || fires.length === 0 || maxLifeRatio <= 0.01) return;

  const refFire = fires[0];
  const nx = refFire.nx || (surfaceAngle > 0 ? 1 : -1);

  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < fires.length; i++) {
    const f = fires[i];
    const half = f.width * 0.65;
    if (f.y - half < minY) minY = f.y - half;
    if (f.y + half > maxY) maxY = f.y + half;
  }
  const clusterH = maxY - minY;
  if (clusterH <= 4) return;

  const wallX = cx;

  ctx.save();
  // 1. Spływająca smuga napalmu na ścianie
  ctx.globalAlpha = Math.min(0.95, maxLifeRatio * 0.95);
  ctx.fillStyle = '#220303';
  ctx.fillRect(wallX - (nx > 0 ? 1 : 3), minY, 4, clusterH);
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(wallX - (nx > 0 ? 0.5 : 2.5), minY + 2, 3, clusterH - 4);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(wallX - (nx > 0 ? 0 : 1.5), minY + 6, 1.5, clusterH - 12);

  // 2. Płomienie liżące w górę (-Y) i wystające ze ściany
  const numSteps = Math.max(8, Math.min(24, Math.ceil(clusterH / 7)));
  const stepH = clusterH / numSteps;

  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(wallX, minY);
  for (let i = 0; i <= numSteps; i++) {
    const wy = minY + i * stepH;
    const wave = Math.sin(wy * 0.12 - avgTimer * 4.5 + clusterSeed) * 4;
    const flameW = (12 + wave) * (nx > 0 ? 1 : -1);
    ctx.lineTo(wallX + flameW, wy);
  }
  ctx.lineTo(wallX, maxY);
  ctx.closePath();
  ctx.fill();

  // Wewnętrzny gorący pomarańcz
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(wallX, minY + 3);
  for (let i = 0; i <= numSteps; i++) {
    const wy = minY + i * stepH;
    const wave = Math.sin(wy * 0.12 - avgTimer * 4.5 + clusterSeed) * 2.5;
    const flameW = (7 + wave) * (nx > 0 ? 1 : -1);
    ctx.lineTo(wallX + flameW, wy);
  }
  ctx.lineTo(wallX, maxY - 3);
  ctx.closePath();
  ctx.fill();

  // Addytywny rdzeń
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.moveTo(wallX, minY + 6);
  for (let i = 0; i <= numSteps; i++) {
    const wy = minY + i * stepH;
    const flameW = 4 * (nx > 0 ? 1 : -1);
    ctx.lineTo(wallX + flameW, wy);
  }
  ctx.lineTo(wallX, maxY - 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Iskry unoszące się wzdłuż ściany ku górze
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.min(0.90, maxLifeRatio * 0.80);
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  const numEmbers = Math.min(4, Math.max(2, Math.floor(clusterH / 22)));
  for (let e = 0; e < numEmbers; e++) {
    const eProgress = (avgTimer * 0.08 + e * 0.25) % 1.0;
    const ey = maxY - eProgress * clusterH;
    const ex = wallX + (nx > 0 ? 1 : -1) * (2 + Math.sin(eProgress * 6.28 + e) * 5);
    ctx.moveTo(ex + 1.3, ey);
    ctx.arc(ex, ey, 1.3, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Renderuje pojedynczy, spójny, organiczny pas ognia (Fire Cluster)
 */
function renderFireCluster(ctx, cluster) {
  if (Math.abs(cluster.surfaceAngle) >= 1.0) {
    renderWallCluster(ctx, cluster);
  } else {
    renderGroundCluster(ctx, cluster);
  }
}

/**
 * Renderowanie rozlanego ognia na powierzchniach z 2D Cullingiem i łączeniem w spójne klastry
 */
export function drawSurfaceFires(ctx, camera) {
  if (!ctx) return;

  // 0. Renderowanie płonących kropel paliwa w locie (Burning Fuel Globs)
  drawFuelGlobs(ctx, camera);

  if (activeSurfaceFires.length === 0) return;

  // 2D Camera Frustum Culling
  let minX = -10000, maxX = 10000, minY = -10000, maxY = 10000;
  if (camera && typeof camera.x === 'number' && typeof camera.y === 'number') {
    const zoom = camera.zoom || 1;
    const viewW = camera.viewWidth || (1920 / zoom);
    const viewH = camera.viewHeight || (1080 / zoom);
    const margin = 100;
    minX = camera.x - margin;
    maxX = camera.x + viewW + margin;
    minY = camera.y - margin;
    maxY = camera.y + viewH + margin;
  }

  // 1. Wybierz aktywne ogniska w polu widzenia kamery
  const visibleFires = [];
  for (let i = 0; i < activeSurfaceFires.length; i++) {
    const f = activeSurfaceFires[i];
    if (f.dead) continue;
    if (f.x + f.width < minX || f.x - f.width > maxX || f.y < minY || f.y - 65 > maxY) {
      continue;
    }
    visibleFires.push(f);
  }

  if (visibleFires.length === 0) return;

  // 2. Grupowanie sąsiadujących ognisk w spójne, ciągłe pasy ognia (Connected Components Clustering)
  const visited = new Uint8Array(visibleFires.length);
  const clusters = [];

  for (let i = 0; i < visibleFires.length; i++) {
    if (visited[i]) continue;
    visited[i] = 1;

    const clusterFires = [visibleFires[i]];
    const queue = [visibleFires[i]];

    while (queue.length > 0) {
      const cur = queue.pop();
      for (let j = 0; j < visibleFires.length; j++) {
        if (visited[j]) continue;
        const other = visibleFires[j];

        // Sprawdź zgodność kąta powierzchni (ta sama płaszczyzna/skarpa)
        let angDiff = Math.abs(cur.surfaceAngle - other.surfaceAngle);
        while (angDiff > Math.PI) angDiff -= Math.PI * 2;
        angDiff = Math.abs(angDiff);
        if (angDiff > 0.40) continue;

        // Odległość w przestrzeni świata (dla połączenia w jedno ognisko)
        const dx = other.x - cur.x;
        const dy = other.y - cur.y;
        const dist = Math.hypot(dx, dy);
        const maxConnectDist = Math.max(38, (cur.width + other.width) * 0.75);

        if (dist <= maxConnectDist) {
          visited[j] = 1;
          clusterFires.push(other);
          queue.push(other);
        }
      }
    }

    // 3. Obliczenie parametrów geometrycznych klastra
    const refFire = clusterFires[0];
    const surfaceAngle = refFire.surfaceAngle;
    const tangX = Math.cos(surfaceAngle);
    const tangY = Math.sin(surfaceAngle);

    let minT = Infinity;
    let maxT = -Infinity;
    let sumTimer = 0;
    let maxLifeRatio = 0;

    for (let k = 0; k < clusterFires.length; k++) {
      const f = clusterFires[k];
      const relX = f.x - refFire.x;
      const relY = f.y - refFire.y;
      const t = relX * tangX + relY * tangY;
      const halfW = f.width * 0.65;
      if (t - halfW < minT) minT = t - halfW;
      if (t + halfW > maxT) maxT = t + halfW;
      sumTimer += f.animTimer;

      const fadeIn = Math.min(1.0, (f.maxLife - f.life) / 12);
      const fadeOut = Math.min(1.0, f.life / 36);
      const ratio = fadeIn * fadeOut;
      if (ratio > maxLifeRatio) maxLifeRatio = ratio;
    }

    const totalW = maxT - minT;
    const midT = (minT + maxT) * 0.5;
    const cx = refFire.x + tangX * midT;
    const cy = refFire.y + tangY * midT;
    const avgTimer = sumTimer / clusterFires.length;
    const clusterSeed = Math.abs(refFire.x * 12.9898 + refFire.y * 78.233) % 1000;

    clusters.push({
      fires: clusterFires,
      surfaceAngle,
      cx,
      cy,
      minT,
      maxT,
      totalW,
      avgTimer,
      maxLifeRatio,
      clusterSeed
    });
  }

  // 4. Renderowanie każdego ciągłego klastra ognia
  for (let c = 0; c < clusters.length; c++) {
    renderFireCluster(ctx, clusters[c]);
  }
}

/**
 * Anatomiczne kotwice płomieni dla sylwetki (stopy, uda, talia, klatka, barki, głowa)
 * Zwraca listę punktów dopasowaną do pozy i poziomu intensywności pożaru.
 */
function buildCharacterFlameAnchors(cx, topY, feetY, bodyHalfW, isHorizontal, level, now, seed) {
  const anchors = [];
  if (isHorizontal) {
    const baseCount = level >= 0.72 ? 6 : (level >= 0.38 ? 4 : 2);
    for (let i = 0; i < baseCount; i++) {
      const u = baseCount === 1 ? 0 : (i / (baseCount - 1)) * 2 - 1;
      const sway = Math.sin(now * 2.1 + i * 1.9 + seed) * 3;
      anchors.push({
        x: cx + u * bodyHalfW * 0.78 + sway * 0.4,
        y: feetY - 6 - (Math.cos(i * 2.1 + seed) * 0.5 + 0.5) * 10,
        size: (0.65 + (1 - Math.abs(u) * 0.35) * 0.45) * (0.55 + level * 0.75),
        isUpper: false
      });
    }
    return anchors;
  }

  const hSpan = Math.max(24, feetY - topY);
  // 0: dolne strefy (zawsze aktywne przy lekkim podpaleniu)
  anchors.push({ x: cx - bodyHalfW * 0.45, y: feetY - hSpan * 0.22, size: 0.65 + level * 0.45, isUpper: false });
  anchors.push({ x: cx + bodyHalfW * 0.42, y: feetY - hSpan * 0.34, size: 0.70 + level * 0.50, isUpper: false });

  // Od lekkiego-średniego wzwyż (level >= 0.26): pas i boki korpusu
  if (level >= 0.26) {
    anchors.push({ x: cx, y: feetY - hSpan * 0.48, size: 0.80 + level * 0.55, isUpper: false });
  }
  // Średnie podpalenie (level >= 0.40): klatka piersiowa i barki
  if (level >= 0.40) {
    anchors.push({ x: cx - bodyHalfW * 0.62, y: feetY - hSpan * 0.66, size: 0.75 + level * 0.60, isUpper: true });
    anchors.push({ x: cx + bodyHalfW * 0.60, y: feetY - hSpan * 0.70, size: 0.75 + level * 0.60, isUpper: true });
  }
  // Pełne oblanie napalmem (level >= 0.70): płonie cała sylwetka aż po kark i szczyt głowy
  if (level >= 0.70) {
    anchors.push({ x: cx + Math.sin(now * 2.4 + seed) * 3, y: feetY - hSpan * 0.88, size: 0.90 + level * 0.65, isUpper: true });
    anchors.push({ x: cx, y: feetY - hSpan * 0.10, size: 0.60 + level * 0.40, isUpper: false });
  }
  return anchors;
}

let _charFireGlowCanvas = null;
function getCharFireGlowSprite() {
  if (_charFireGlowCanvas) return _charFireGlowCanvas;
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const gctx = c.getContext('2d');
  if (!gctx) return null;
  const grad = gctx.createRadialGradient(32, 32, 2, 32, 32, 31);
  grad.addColorStop(0.0, 'rgba(255, 250, 220, 0.85)');
  grad.addColorStop(0.28, 'rgba(249, 115, 22, 0.60)');
  grad.addColorStop(0.62, 'rgba(220, 38, 38, 0.22)');
  grad.addColorStop(1.0, 'rgba(127, 29, 29, 0.0)');
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 64, 64);
  _charFireGlowCanvas = c;
  return _charFireGlowCanvas;
}

/**
 * Rysuje pojedynczy, plynny jęzor ognia z krzywą S (bezierCurveTo) zamiast ostrych trójkątów
 */
function traceOrganicFlameLick(ctx, bx, by, baseW, tipX, tipY, curlShift) {
  const h = by - tipY;
  const bulgeL = bx - baseW * 1.15;
  const bulgeR = bx + baseW * 1.15;
  ctx.moveTo(bx - baseW * 0.72, by + 2);
  ctx.bezierCurveTo(
    bulgeL, by - h * 0.30,
    tipX - baseW * 0.55 + curlShift, by - h * 0.72,
    tipX, tipY
  );
  ctx.bezierCurveTo(
    tipX + baseW * 0.45 + curlShift, by - h * 0.70,
    bulgeR, by - h * 0.28,
    bx + baseW * 0.72, by + 2
  );
  ctx.closePath();
}

/**
 * Wielowarstwowy, dynamiczny render płomieni na podpalonej postaci:
 * - Level 1 (< 0.38): lekkie muśnięcie ogniem (drobne płomyki na nogach/pasie, lekka poświata i iskry)
 * - Level 2 (0.38..0.72): wyraźne płonięcie korpusu, barków i przywartego żaru napalmu
 * - Level 3 (>= 0.72): gwałtowny pożar całego ciała aż po kark/głowę, z białym rdzeniem, żarem i smugą dymu
 * Zero ctx.shadowBlur i brak twardych owalnych bąbli, zgrupowane ścieżki GPU pod 60 FPS.
 */
function drawCharacterFire(ctx, ch, now, isLyingZombie, sheet) {
  const rawDur = ch.burnTimer || 0;
  if (rawDur <= 0) return;

  const baseInt = (typeof ch.burnIntensity === 'number' && ch.burnIntensity > 0)
    ? ch.burnIntensity
    : Math.min(0.85, Math.max(0.22, rawDur / 160));
  const fade = Math.min(1.0, rawDur / 28);
  const level = Math.max(0.08, Math.min(1.0, baseInt)) * fade;
  if (level <= 0.03) return;

  const w = ch.w || 24;
  const h = ch.h || 70;
  const isHorizontal = !!(isLyingZombie || (ch.isZombie && ch.isCrawling) || ch.isProne || (ch.staggerTimer > 0));
  const cx = ch.x + w * 0.5;
  const feetY = ch.y + h - (isHorizontal ? 2 : 0);
  const rawTopY = isHorizontal ? (feetY - 22) : (ch.isCrouching ? (ch.y + 16) : (ch.y + 3));
  const bodyHalfW = isHorizontal ? 24 : Math.max(12, w * 0.52);
  const midY = (rawTopY + feetY) * 0.5;

  const seed = ((typeof ch.botIndex === 'number' ? ch.botIndex : 0) * 17.3) + (ch.isBot ? 5.1 : 1.7);
  const windX = Math.max(-22, Math.min(22, -(ch.vx || 0) * 1.55));
  const windY = Math.max(-10, Math.min(12, -(ch.vy || 0) * 0.55));

  const anchors = buildCharacterFlameAnchors(cx, rawTopY, feetY, bodyHalfW, isHorizontal, level, now, seed);
  if (anchors.length === 0) return;

  const tongues = new Array(anchors.length);
  for (let i = 0; i < anchors.length; i++) {
    const a = anchors[i];
    const phase = now * (2.8 + (i % 3) * 0.5) + i * 2.17 + seed;
    const waveA = Math.sin(phase);
    const waveB = Math.cos(phase * 1.71);
    const flameH = (11 + level * 20) * a.size * (0.80 + waveA * 0.24);
    const tipX = a.x + windX * (0.55 + (a.isUpper ? 0.55 : 0.25)) + waveB * (3.5 + level * 3.8);
    const tipY = a.y - flameH + windY * 0.45;
    const halfBase = (2.8 + level * 3.0) * Math.min(1.2, a.size);
    const curlShift = Math.sin(phase * 1.35 + 1.0) * (2.6 + level * 2.4);
    tongues[i] = { x: a.x, y: a.y, tipX, tipY, halfBase, curlShift };
  }

  ctx.save();

  // 1. WARSTWA TŁA: Miękka, przejrzysta smuga dymu termicznego w górze/za ruchem
  const numSmoke = level >= 0.72 ? 4 : (level >= 0.38 ? 2 : 1);
  ctx.fillStyle = '#18181b';
  ctx.globalAlpha = (0.08 + level * 0.14) * fade;
  ctx.beginPath();
  for (let s = 0; s < numSmoke; s++) {
    const cycle = (now * 0.16 + s * (1 / numSmoke) + seed * 0.13) % 1.0;
    const prog = cycle < 0 ? cycle + 1.0 : cycle;
    const sStartY = level >= 0.68 ? (rawTopY - 4) : (midY - 8);
    const sx = cx + windX * (0.5 + prog * 1.5) + Math.sin(prog * 5.2 + s * 2.1 + seed) * (4 + level * 6);
    const sy = sStartY - 12 - prog * (24 + level * 28) + windY * prog;
    const sr = (2.8 + level * 3.2) + prog * (5.0 + level * 6.0);
    ctx.moveTo(sx + sr, sy);
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  }
  ctx.fill();

  // 2. WARSTWA ZACZERNIENIA I PRZYWARTYCH DROBIN NAPALMU NA PANCERZU
  if (level >= 0.30) {
    const numGlobs = Math.min(anchors.length, level >= 0.70 ? 5 : 3);
    ctx.fillStyle = '#220303';
    ctx.globalAlpha = Math.min(0.82, (0.35 + level * 0.45) * fade);
    ctx.beginPath();
    for (let g = 0; g < numGlobs; g++) {
      const a = anchors[g];
      const gx = a.x + Math.sin(g * 4.3 + seed) * 2.2;
      const gy = a.y;
      const gr = 1.5 + level * 1.4;
      ctx.moveTo(gx + gr, gy);
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.fillStyle = '#ea580c';
    ctx.globalAlpha = Math.min(0.92, (0.45 + level * 0.45) * fade);
    ctx.beginPath();
    for (let g = 0; g < numGlobs; g++) {
      const a = anchors[g];
      const gx = a.x + Math.sin(g * 4.3 + seed) * 2.2;
      const gy = a.y;
      const gr = 0.8 + level * 0.85;
      ctx.moveTo(gx + gr, gy);
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  // 3. WARSTWA ZEWNĘTRZNA: Falujące szkarłatne języki ognia (#dc2626) w kształcie litery S
  ctx.fillStyle = '#dc2626';
  ctx.globalAlpha = (0.44 + level * 0.34) * fade;
  ctx.beginPath();
  for (let i = 0; i < tongues.length; i++) {
    const t = tongues[i];
    traceOrganicFlameLick(ctx, t.x, t.y, t.halfBase, t.tipX, t.tipY, t.curlShift);
  }
  ctx.fill();

  // 4. WARSTWA ŚRODKOWA: Gorący pomarańczowy płomień (#f97316)
  ctx.fillStyle = '#f97316';
  ctx.globalAlpha = (0.58 + level * 0.34) * fade;
  ctx.beginPath();
  for (let i = 0; i < tongues.length; i++) {
    const t = tongues[i];
    const midTipX = t.x + (t.tipX - t.x) * 0.80;
    const midTipY = t.y + (t.tipY - t.y) * 0.80;
    traceOrganicFlameLick(ctx, t.x, t.y, t.halfBase * 0.66, midTipX, midTipY, t.curlShift * 0.85);
  }
  ctx.fill();

  // 5. WARSTWA ADDYTYWNA ('lighter'): Jedwabista poświata radialna (sprit), złote groty i iskry
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const glowSprite = getCharFireGlowSprite();
  if (glowSprite) {
    const glowCY = isHorizontal ? midY : (feetY - (feetY - rawTopY) * (0.28 + level * 0.25));
    const glowW = (bodyHalfW * 2 + 24 + level * 22);
    const glowH = isHorizontal ? 38 : ((feetY - rawTopY) * (0.55 + level * 0.62) + 18);
    ctx.globalAlpha = (0.22 + level * 0.42) * fade;
    ctx.drawImage(glowSprite, cx + windX * 0.20 - glowW * 0.5, glowCY - glowH * 0.5, glowW, glowH);
  }

  // Gorące złote groty wewnętrzne (#fde047)
  ctx.fillStyle = '#fde047';
  ctx.globalAlpha = (0.48 + level * 0.36) * fade;
  ctx.beginPath();
  for (let i = 0; i < tongues.length; i++) {
    const t = tongues[i];
    const coreTipX = t.x + (t.tipX - t.x) * 0.58;
    const coreTipY = t.y + (t.tipY - t.y) * 0.58;
    traceOrganicFlameLick(ctx, t.x, t.y, t.halfBase * 0.38, coreTipX, coreTipY, t.curlShift * 0.6);
  }
  ctx.fill();

  // Biały żar napalmowy w samym rdzeniu (wyłącznie przy wysokim oblaniu napalmem)
  if (level >= 0.56) {
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = Math.min(0.65, (level - 0.48) * 1.15) * fade;
    ctx.beginPath();
    for (let i = 0; i < tongues.length; i++) {
      const t = tongues[i];
      const wTipX = t.x + (t.tipX - t.x) * 0.34;
      const wTipY = t.y + (t.tipY - t.y) * 0.34;
      traceOrganicFlameLick(ctx, t.x, t.y, t.halfBase * 0.20, wTipX, wTipY, t.curlShift * 0.35);
    }
    ctx.fill();
  }

  // Iskry unoszące się wzdłuż podmuchu i skapujący napalm poniżej stóp
  const numSparks = level >= 0.72 ? 8 : (level >= 0.38 ? 5 : 2);
  ctx.fillStyle = '#fef08a';
  ctx.globalAlpha = (0.58 + level * 0.38) * fade;
  ctx.beginPath();
  for (let p = 0; p < numSparks; p++) {
    const spPhase = (now * 0.42 + p * (1 / numSparks) + seed * 0.27) % 1.0;
    const prog = spPhase < 0 ? spPhase + 1.0 : spPhase;
    const anchor = anchors[p % anchors.length];
    const px = anchor.x + windX * (0.3 + prog * 1.25) + Math.sin(prog * 8.5 + p * 2.5 + seed) * (3 + level * 4.5);
    const py = anchor.y - prog * (18 + level * 28) + windY * prog;
    const pr = (0.85 + level * 0.85) * (1.0 - prog * 0.45);
    ctx.moveTo(px + pr, py);
    ctx.arc(px, py, pr, 0, Math.PI * 2);
  }
  if (level >= 0.62) {
    for (let d = 0; d < 2; d++) {
      const dPhase = (now * 0.32 + d * 0.5 + seed * 0.41) % 1.0;
      const dProg = dPhase < 0 ? dPhase + 1.0 : dPhase;
      const dx = cx + (d === 0 ? -bodyHalfW * 0.35 : bodyHalfW * 0.35) + windX * 0.25 * dProg;
      const dy = feetY - 8 + dProg * 16;
      const dr = 1.15 * (1.0 - dProg * 0.5);
      ctx.moveTo(dx + dr, dy);
      ctx.arc(dx, dy, dr, 0, Math.PI * 2);
    }
  }
  ctx.fill();

  // Zgrane kłęby ze sprite sheetu przy większym pożarze
  if (level >= 0.45 && sheet && sheet.complete && sheet.naturalWidth > 0) {
    const count = level >= 0.78 ? 2 : 1;
    for (let k = 0; k < count; k++) {
      const frameIdx = Math.floor(now * 2.1 + seed + k * 3) % 8;
      const sx = frameIdx * FLAME_CELL_SIZE;
      const sy = FLAME_ROW_SURFACE * FLAME_CELL_SIZE;
      const spW = 24 + level * 14;
      const spH = 26 + level * 18;
      const oy = k === 0 ? (midY + 6) : (rawTopY + 14);
      ctx.globalAlpha = Math.min(0.28, (level - 0.35) * 0.42) * fade;
      ctx.drawImage(sheet, sx, sy, FLAME_CELL_SIZE, FLAME_CELL_SIZE, cx + windX * 0.25 - spW * 0.5, oy - spH * 0.6, spW, spH);
    }
  }

  ctx.restore();
  ctx.restore();
}

/**
 * Renderowanie płomieni na podpalonych postaciach (skalowanych intensywnością) i piłce
 */
export function drawBurningEffects(ctx, combatants, ball) {
  if (!ctx) return;
  const sheet = getFlameSpritesheet();
  const now = performance.now() * 0.012;

  // Płomienie na ciele postaci (w tym zombie)
  const targets = Array.isArray(combatants) ? combatants : [];
  for (const ch of targets) {
    if (!ch) continue;
    const isLyingZombie = !!(ch.isZombie && ch.isDead && ch.hasHead && !ch.decapitated);
    if (ch.isZombie) {
      if (ch.isDead && !isLyingZombie) {
        if (ch.burnTimer > 0 || ch.burnAttacker) extinguishCombatant(ch);
        continue;
      }
    } else {
      if (ch.isDead) {
        if (ch.burnTimer > 0 || ch.burnAttacker) extinguishCombatant(ch);
        continue;
      }
    }
    if (!ch.burnTimer || ch.burnTimer <= 0) continue;

    drawCharacterFire(ctx, ch, now, isLyingZombie, sheet);
  }

  // Płomienie na piłce
  if (ball && ball.burnTimer && ball.burnTimer > 0) {
    ctx.save();
    ctx.translate(ball.x, ball.y);
    if (sheet && sheet.complete && sheet.naturalWidth > 0) {
      const frameIdx = Math.floor(now * 2.0) % 8;
      const sx = frameIdx * FLAME_CELL_SIZE;
      const sy = FLAME_ROW_STREAM * FLAME_CELL_SIZE;
      ctx.globalAlpha = 0.88;
      ctx.drawImage(sheet, sx, sy, FLAME_CELL_SIZE, FLAME_CELL_SIZE, -20, -20, 40, 40);
    }
    ctx.restore();
  }
}

/**
 * Rysuje mały płomyk pilotujący (Pilot Flame) u wylotu dyszy miotacza ognia
 */
export function drawPilotFlame(ctx, muzzleX, muzzleY, angle, facing = 1) {
  if (!ctx) return;
  const sheet = getFlameSpritesheet();
  const now = performance.now() * 0.015;
  const frameIdx = Math.floor(now) % 4; // Klatki 0..3 z wiersza 2

  ctx.save();
  ctx.translate(muzzleX, muzzleY);
  ctx.rotate(angle);
  ctx.scale(facing, 1);

  if (sheet && sheet.complete && sheet.naturalWidth > 0) {
    const sx = frameIdx * FLAME_CELL_SIZE;
    const sy = FLAME_ROW_PILOT * FLAME_CELL_SIZE;
    ctx.globalAlpha = 0.90;
    ctx.drawImage(sheet, sx, sy, FLAME_CELL_SIZE, FLAME_CELL_SIZE, -6, -14, 22, 22);
  } else {
    // Prosty proceduralny płomyk
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(4, 0, 3, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(6, 0, 2, 1.0, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Reset stanu miotacza ognia (np. zmiana areny, reset rundy)
 */
export function clearFlamethrowerState() {
  activeFlameStreams.length = 0;
  activeFuelGlobs.length = 0;
  activeSurfaceFires.length = 0;
  activeImpactSplashes.length = 0;
}

/**
 * Sprawdza, czy wskazany prostokąt koliduje z aktywnym ogniem powierzchniowym, kroplami paliwa lub strumieniem płomieni.
 */
export function hasFireHazardInBox(minX, minY, maxX, maxY) {
  for (let i = 0; i < activeSurfaceFires.length; i++) {
    const f = activeSurfaceFires[i];
    if (!f || f.dead || f.life <= 0) continue;
    const halfW = (f.width || 34) * 0.55 + 22;
    const fLeft = f.x - halfW;
    const fRight = f.x + halfW;
    const fTop = f.y - 40;
    const fBottom = f.y + 18;
    if (maxX >= fLeft && minX <= fRight && maxY >= fTop && minY <= fBottom) {
      return true;
    }
  }

  for (let i = 0; i < activeFuelGlobs.length; i++) {
    const g = activeFuelGlobs[i];
    if (!g || g.dead || g.life <= 0) continue;
    const pad = 34;
    if (maxX >= g.x - pad && minX <= g.x + pad && maxY >= g.y - 36 && minY <= g.y + 120) {
      return true;
    }
  }

  for (let i = 0; i < activeFlameStreams.length; i++) {
    const p = activeFlameStreams[i];
    if (!p || p.dead || p.life <= 0) continue;
    const r = (p.radius || 18) + 26;
    if (maxX >= p.x - r && minX <= p.x + r && maxY >= p.y - r && minY <= p.y + r) {
      return true;
    }
  }

  return false;
}
