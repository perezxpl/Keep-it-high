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
import { GROUND_Y } from '../world/state.js';

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
    this.baseSpeed = speed || 17.5;
    this.vx = Math.cos(angle) * this.baseSpeed + (shooter?.vx || 0) * 0.16;
    this.vy = Math.sin(angle) * this.baseSpeed + (shooter?.vy || 0) * 0.16;

    this.isSpine = options.isSpine ?? false;
    this.isDroplet = options.isDroplet ?? false;

    if (this.isDroplet) {
      this.life = 22 + Math.floor(Math.random() * 8);
      this.radius = 3.2;
      this.gravity = 0.22;
      this.drag = 0.985;
    } else if (this.isSpine) {
      this.life = 34 + Math.floor(Math.random() * 4);
      this.radius = 10;
      this.gravity = 0.155;
      this.drag = 0.982;
    } else {
      this.life = 30 + Math.floor(Math.random() * 6);
      this.radius = 12;
      this.gravity = 0.145;
      this.drag = 0.980;
    }

    this.maxLife = this.life;
    this.damage = weapon?.damage || 4;
    this.dead = false;
    this.hitCombatants = new Set();
  }

  update(groundY, platforms, customObs, combatants, ball) {
    if (this.dead) return false;

    this.prevX = this.x;
    this.prevY = this.y;

    // 1. Fizyka lotu: grawitacja łukowa opadania napalmu i opór powietrza
    this.vy += this.gravity;
    this.vx *= this.drag;
    this.vy *= this.drag;

    this.x += this.vx;
    this.y += this.vy;
    this.angle = Math.atan2(this.vy, this.vx);

    this.life--;
    if (this.life <= 0) {
      this.dead = true;
      return false;
    }

    const progress = 1.0 - (this.life / this.maxLife);
    if (this.isDroplet) {
      this.radius = Math.max(1.8, 3.2 * (1.0 - progress * 0.4));
    } else if (this.isSpine) {
      this.radius = 10 + progress * 24;
    } else {
      this.radius = 12 + progress * 32;
    }

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

      if (ch.isProne || ch.staggerTimer > 0 || isLyingZombie) {
        chTop = ch.y + hitH - 24;
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
          igniteCombatant(ch, this.shooter, 100);
          if (ch.downedHp <= 0) {
            handleZombieFireDeath(ch, this.shooter, groundY, true);
          }
        } else {
          // Obrażenia bezpośrednie od strumienia płomieni dla żywych postaci i zombie
          ch.hp = Math.max(0, (ch.hp !== undefined ? ch.hp : 100) - this.damage);
          ch.lastAttacker = this.shooter;
          ch.lastAttackerTimer = 240;

          // Podpalenie postaci (DoT palenia napalmem)
          igniteCombatant(ch, this.shooter, 100);

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

      // Tworzenie rozlanego ognia na powierzchni oraz korony rozbryzgu hydraulicznego
      spawnSurfaceFire(mapHit.x, mapHit.y, mapHit.nx || 0, mapHit.ny || -1, this.shooter, this.team);
      spawnImpactSplash(mapHit.x, mapHit.y, mapHit.nx || 0, mapHit.ny || -1);
      return false;
    }

    // Uderzenie w podłoże areny
    if (this.y >= groundY - 4) {
      this.y = groundY - 1;
      this.dead = true;
      spawnSurfaceFire(this.x, groundY, 0, -1, this.shooter, this.team);
      spawnImpactSplash(this.x, groundY, 0, -1);
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
    ctx.rotate(this.angle);

    const drawSize = this.radius * 2.2;
    if (sheet && sheet.complete && sheet.naturalWidth > 0) {
      const sx = frameIdx * FLAME_CELL_SIZE;
      const sy = FLAME_ROW_STREAM * FLAME_CELL_SIZE;
      ctx.globalAlpha = Math.min(1.0, (this.life / this.maxLife) * 1.25);
      ctx.drawImage(sheet, sx, sy, FLAME_CELL_SIZE, FLAME_CELL_SIZE, -drawSize * 0.5, -drawSize * 0.5, drawSize, drawSize);
    } else {
      // Rezerwowy wektorowy gradient proceduralny
      const alpha = Math.min(1.0, (this.life / this.maxLife) * 1.2);
      ctx.globalAlpha = alpha;
      const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, this.radius);
      grad.addColorStop(0.0, '#ffffff');
      grad.addColorStop(0.35, '#fef08a');
      grad.addColorStop(0.70, '#f97316');
      grad.addColorStop(1.0, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/**
 * Klasa rozlanego ognia na powierzchni (Surface Fire / Napalm Puddle)
 */
export class SurfaceFire {
  constructor(x, y, nx, ny, shooter, team) {
    this.x = x;
    this.y = y;
    this.nx = nx;
    this.ny = ny;
    this.shooter = shooter;
    this.team = team;

    this.width = 38 + Math.random() * 8;
    this.life = 240 + Math.floor(Math.random() * 40); // ~4-4.5s płonięcia na powierzchni
    this.maxLife = this.life;
    this.animTimer = Math.random() * 8;
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
      const chLeft = isLyingZombie ? ch.x - (ch.facing === 1 ? 14 : 38) : ch.x;
      const chRight = isLyingZombie ? ch.x + hitW + (ch.facing === 1 ? 38 : 14) : ch.x + hitW;
      const chTop = isLyingZombie ? ch.y + hitH - 24 : ch.y;
      const chBottom = ch.y + hitH;

      // Sprawdzenie nachodzenia AABB postaci na strefę ognia
      const overlaps = !(chRight < fireLeft || chLeft > fireRight || chBottom < fireTop || chTop > fireBottom);
      if (overlaps) {
        // Blokada ognia przez przeszkodę: kałuża ognia nie rani postaci za ścianą
        const wallBetween = checkRayObstacleCollision(this.x, this.y - 6, ch.x + hitW * 0.5, ch.y + hitH * 0.45, groundY, obs, null);
        if (wallBetween && wallBetween.t < 0.92) {
          continue;
        }

        // Podpalenie postaci
        igniteCombatant(ch, this.shooter, 90);

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
    const sheet = getFlameSpritesheet();
    const frameIdx = Math.floor(this.animTimer) % 8;

    // Płynne wejście (FadeIn) i płynne wygasanie (FadeOut)
    const fadeIn = Math.min(1.0, (this.maxLife - this.life) / 12);
    const fadeOut = Math.min(1.0, this.life / 36);
    const alpha = fadeIn * fadeOut;

    ctx.save();
    ctx.translate(this.x, this.y);

    const drawW = this.width * 1.5;
    const drawH = 36;

    if (sheet && sheet.complete && sheet.naturalWidth > 0) {
      const sx = frameIdx * FLAME_CELL_SIZE;
      const sy = FLAME_ROW_SURFACE * FLAME_CELL_SIZE;
      ctx.globalAlpha = Math.min(1.0, alpha * 0.95);
      // Rysujemy tak, aby podstawa płomienia dotykała dokładnie powierzchni
      ctx.drawImage(sheet, sx, sy, FLAME_CELL_SIZE, FLAME_CELL_SIZE, -drawW * 0.5, -drawH + 4, drawW, drawH);
    } else {
      // Rezerwowy wektorowy kształt rozlanego ognia
      ctx.globalAlpha = Math.min(1.0, alpha * 0.9);
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.ellipse(0, 0, this.width * 0.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(0, -1, this.width * 0.35, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tańczące języki
      const flickerH = 14 + Math.sin(this.animTimer * 2.5) * 5;
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(-this.width * 0.35, 0);
      ctx.lineTo(0, -flickerH);
      ctx.lineTo(this.width * 0.35, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

/**
 * Podpalenie postaci (Status efektu DoT)
 */
export function igniteCombatant(combatant, attacker, durationFrames = 100) {
  if (!combatant || combatant.isDead) return;
  combatant.burnTimer = Math.max(combatant.burnTimer || 0, durationFrames);
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
  const baseSpd = weapon?.bulletSpeed || 17.5;

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

  // 3. Lepka kropla ciekłego napalmu (co 2. strzał) - ciężki odryw cieczy
  shooter._flameDropCount = (shooter._flameDropCount || 0) + 1;
  if (shooter._flameDropCount % 2 === 0) {
    const dropAngle = theta + (Math.random() - 0.5) * (spread * 0.65);
    const dropSpd = baseSpd * (0.92 + Math.random() * 0.12);
    const pDrop = new FlameParticle(shooter, muzzleX, muzzleY, dropAngle, dropSpd, weapon, { isDroplet: true });
    activeFlameStreams.push(pDrop);
  }
}

/**
 * Spawnowanie rozlanego ognia na powierzchni
 */
export function spawnSurfaceFire(x, y, nx, ny, shooter, team) {
  // Ograniczenie maksymalnej liczby plam ognia dla zachowania 60 FPS
  while (activeSurfaceFires.length >= 45) {
    activeSurfaceFires.shift();
  }

  // Scalanie z bliskimi sąsiednimi plamami ognia
  for (const existing of activeSurfaceFires) {
    if (existing.dead) continue;
    const distSq = (existing.x - x) * (existing.x - x) + (existing.y - y) * (existing.y - y);
    if (distSq < 26 * 26 && (!shooter || existing.shooter === shooter)) {
      existing.life = Math.min(existing.maxLife, existing.life + 55);
      existing.width = Math.min(56, existing.width + 4);
      return existing;
    }
  }

  const fire = new SurfaceFire(x, y, nx, ny, shooter, team);
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

  // 3. Aktualizacja rozlanego ognia na powierzchniach
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
      if (ch.isDead && !isLyingZombie) continue;
    } else {
      if (ch.isDead) continue;
    }

    if (ch.burnTimer && ch.burnTimer > 0) {
      ch.burnTimer--;
      if (ch.burnTimer % 15 === 0) {
        if (isLyingZombie) {
          ch.downedHp = (ch.downedHp !== undefined ? ch.downedHp : 60) - 3;
          if (ch.downedHp <= 0) {
            handleZombieFireDeath(ch, ch.burnAttacker, groundY, true);
          }
        } else {
          ch.hp = Math.max(0, (ch.hp !== undefined ? ch.hp : 100) - 2);
          if (ch.hp <= 0) {
            if (ch.isZombie) {
              handleZombieFireDeath(ch, ch.burnAttacker, groundY, false);
            } else if (!ch.isDead && !ch.isAcidDying) {
              handleFireDeath(ch, ch.burnAttacker, groundY);
            }
          }
        }
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

  const sheet = getFlameSpritesheet();
  const hasSheet = !!(sheet && sheet.complete && sheet.naturalWidth > 0);

  // 1. Rysowanie rozbryzgów uderzeniowych na przeszkodach
  for (const splash of activeImpactSplashes) {
    splash.draw(ctx);
  }

  if (activeFlameStreams.length === 0) return;

  // 2. Grupowanie cząstek według strzelca dla zachowania niezależnych, ciągłych strug
  const streamGroups = new Map();
  for (const p of activeFlameStreams) {
    if (p.dead) continue;
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
    const droplets = [];
    const billows = [];

    for (const p of particles) {
      if (p.isDroplet) droplets.push(p);
      else if (p.isSpine) spineNodes.push(p);
      else billows.push(p);
    }

    // Sortowanie węzłów strugi od najmłodszych (blisko lufy) do najstarszych (czoło strugi)
    spineNodes.sort((a, b) => b.life - a.life);

    // A) Warstwa 1: Kłęby dymu i ciemny żar tła (starsze cząstki na czole strugi)
    for (const p of billows) {
      const progress = 1.0 - (p.life / p.maxLife);
      if (progress > 0.42) {
        const frameIdx = Math.min(7, Math.floor(progress * 8));
        const drawSize = p.radius * 2.3;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        if (hasSheet) {
          const sx = frameIdx * FLAME_CELL_SIZE;
          const sy = FLAME_ROW_STREAM * FLAME_CELL_SIZE;
          ctx.globalAlpha = Math.min(0.60, (p.life / p.maxLife) * 1.1);
          ctx.drawImage(sheet, sx, sy, FLAME_CELL_SIZE, FLAME_CELL_SIZE, -drawSize * 0.5, -drawSize * 0.5, drawSize, drawSize);
        }
        ctx.restore();
      }
    }

    // B) Warstwa 2: Zwarty, ryczący płaszcz turbulentnego ognia (Combustion Mantle)
    for (let i = 0; i < spineNodes.length; i++) {
      const p = spineNodes[i];
      p.draw(ctx);

      // Interpolacja kłębu ognia pomiędzy sąsiednimi węzłami dla wyeliminowania pustych luk
      if (i < spineNodes.length - 1) {
        const nextP = spineNodes[i + 1];
        const dx = nextP.x - p.x;
        const dy = nextP.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist > p.radius * 0.75) {
          const midX = (p.x + nextP.x) * 0.5;
          const midY = (p.y + nextP.y) * 0.5;
          const midRad = (p.radius + nextP.radius) * 0.5;
          const midLife = (p.life + nextP.life) * 0.5;
          const midMaxLife = (p.maxLife + nextP.maxLife) * 0.5;
          const progress = Math.max(0, Math.min(1.0, 1.0 - (midLife / midMaxLife)));
          const frameIdx = Math.min(7, Math.floor(progress * 8));
          const drawSize = midRad * 2.1;

          ctx.save();
          ctx.translate(midX, midY);
          ctx.rotate(p.angle);
          if (hasSheet) {
            const sx = frameIdx * FLAME_CELL_SIZE;
            const sy = FLAME_ROW_STREAM * FLAME_CELL_SIZE;
            ctx.globalAlpha = Math.min(0.85, (midLife / midMaxLife) * 1.2);
            ctx.drawImage(sheet, sx, sy, FLAME_CELL_SIZE, FLAME_CELL_SIZE, -drawSize * 0.5, -drawSize * 0.5, drawSize, drawSize);
          } else {
            ctx.globalAlpha = Math.min(0.85, (midLife / midMaxLife));
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.arc(0, 0, midRad, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }
    }

    // Uzupełnienie płaszcza cząstkami turbulentnymi (billow)
    for (const p of billows) {
      const progress = 1.0 - (p.life / p.maxLife);
      if (progress <= 0.42) {
        p.draw(ctx);
      }
    }

    // C) Warstwa 3: Masywna, lita struga ciekłego napalmu (Heavy Liquid Napalm Jet Hose)
    const corePoints = [];
    if (shooter?._lastFlameMuzzle && shooter._lastFlameMuzzle.timer > 0) {
      corePoints.push({ x: shooter._lastFlameMuzzle.x, y: shooter._lastFlameMuzzle.y });
    }

    for (const p of spineNodes) {
      if ((p.life / p.maxLife) > 0.25) {
        corePoints.push({ x: p.x, y: p.y });
      }
    }

    if (corePoints.length >= 2) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const traceSpline = () => {
        ctx.beginPath();
        ctx.moveTo(corePoints[0].x, corePoints[0].y);
        for (let k = 1; k < corePoints.length - 1; k++) {
          const xc = (corePoints[k].x + corePoints[k + 1].x) * 0.5;
          const yc = (corePoints[k].y + corePoints[k + 1].y) * 0.5;
          ctx.quadraticCurveTo(corePoints[k].x, corePoints[k].y, xc, yc);
        }
        const lastPt = corePoints[corePoints.length - 1];
        ctx.lineTo(lastPt.x, lastPt.y);
      };

      // 1. Zewnętrzna gorąca poświata strugi (Deep fiery halo)
      traceSpline();
      ctx.strokeStyle = 'rgba(234, 88, 12, 0.45)';
      ctx.lineWidth = 36;
      ctx.stroke();

      // 2. Główny lejący się płaszcz napalmu (Thick boiling orange gel)
      traceSpline();
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 22;
      ctx.globalAlpha = 0.90;
      ctx.stroke();

      // 3. Płonąca złota ciecz (Boiling golden napalm core)
      traceSpline();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 12;
      ctx.globalAlpha = 0.96;
      ctx.stroke();

      // 4. Biało-żółty lity ciśnieniowy rdzeń napalmu (White-hot pressurized jet spine)
      traceSpline();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5.0;
      ctx.globalAlpha = 1.0;
      ctx.stroke();

      ctx.restore();
    }

    // D) Warstwa 4: Odrywające się lepkie krople i skrzepy napalmu
    for (const p of droplets) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      const dropLen = Math.max(7.0, Math.hypot(p.vx, p.vy) * 0.55);

      // Płonący skrzep żelu
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.ellipse(0, 0, dropLen, p.radius * 1.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Jaskrawy płonący rdzeń
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(dropLen * 0.2, 0, dropLen * 0.55, p.radius * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();

      // Biała główka kropli
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(dropLen * 0.35, 0, dropLen * 0.30, p.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
}

/**
 * Renderowanie rozlanego ognia na powierzchniach
 */
export function drawSurfaceFires(ctx, camera) {
  if (!ctx || activeSurfaceFires.length === 0) return;
  for (const fire of activeSurfaceFires) {
    fire.draw(ctx);
  }
}

/**
 * Renderowanie płomyków na podpalonych postaciach i piłce
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
      if (ch.isDead && !isLyingZombie) continue;
    } else {
      if (ch.isDead) continue;
    }
    if (!ch.burnTimer || ch.burnTimer <= 0) continue;

    const cx = ch.x + (ch.w || 24) * 0.5;
    const cy = isLyingZombie ? ch.y + (ch.h || 70) - 10 : ch.y + (ch.h || 70) * 0.45;
    const flicker = Math.sin(now + ch.x) * 2;

    ctx.save();
    ctx.translate(cx, cy + flicker);
    if (sheet && sheet.complete && sheet.naturalWidth > 0) {
      const frameIdx = Math.floor(now * 1.5) % 8;
      const sx = frameIdx * FLAME_CELL_SIZE;
      const sy = FLAME_ROW_SURFACE * FLAME_CELL_SIZE;
      ctx.globalAlpha = 0.85;
      ctx.drawImage(sheet, sx, sy, FLAME_CELL_SIZE, FLAME_CELL_SIZE, -18, -26, 36, 36);
    } else {
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
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
  activeSurfaceFires.length = 0;
  activeImpactSplashes.length = 0;
}
