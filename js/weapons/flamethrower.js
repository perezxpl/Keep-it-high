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

export const FLAME_SPRITESHEET_URL = './assets/weapons/flame_spritesheet.svg?v=v444_flamethrower';
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
  constructor(shooter, startX, startY, angle, speed, weapon = null) {
    this.shooter = shooter;
    this.team = shooter?.team || (shooter?.isBot ? 'BOT' : (shooter?.isRemote ? 'P2' : 'P1'));
    this.x = startX;
    this.y = startY;
    this.prevX = startX;
    this.prevY = startY;
    this.angle = angle;
    this.baseSpeed = speed || 17;
    this.vx = Math.cos(angle) * this.baseSpeed + (shooter?.vx || 0) * 0.18;
    this.vy = Math.sin(angle) * this.baseSpeed + (shooter?.vy || 0) * 0.18;

    this.life = 32 + Math.floor(Math.random() * 6);
    this.maxLife = this.life;
    this.damage = weapon?.damage || 4;
    this.radius = 8;
    this.dead = false;
    this.hitCombatants = new Set();
  }

  update(groundY, platforms, customObs, combatants, ball) {
    if (this.dead) return false;

    this.prevX = this.x;
    this.prevY = this.y;

    // 1. Fizyka lotu: grawitacja łukowa opadania napalmu i opór powietrza
    this.vy += 0.145; // Grawitacja opadania strumienia cieczy
    this.vx *= 0.982;
    this.vy *= 0.982;

    this.x += this.vx;
    this.y += this.vy;
    this.angle = Math.atan2(this.vy, this.vx);

    this.life--;
    if (this.life <= 0) {
      this.dead = true;
      return false;
    }

    const progress = 1.0 - (this.life / this.maxLife);
    this.radius = 8 + progress * 22; // Rozrost stożka ognia od 8px do 30px

    const obs = customObs || obstacles;
    const mapHit = checkRayObstacleCollision(this.prevX, this.prevY, this.x, this.y, groundY, obs, null);
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

    // 3. Kolizje z postaciami (Gracze i boty)
    const targets = Array.isArray(combatants) ? combatants : [];
    const isFFA = (typeof isDeathmatchFFA === 'function' ? isDeathmatchFFA() : false) ||
      (deathmatchState && deathmatchState.mode === 'FFA') ||
      (deathmatchConfig && deathmatchConfig.mode === 'FFA');

    for (const ch of targets) {
      if (!ch || ch === this.shooter || ch.isDead) continue;
      if (ch.isBot && !ch.active) continue;
      if (!isFFA && this.shooter && this.shooter.team && ch.team && this.shooter.team === ch.team) continue;
      if (ch.spawnProtectionTimer && ch.spawnProtectionTimer > 0) continue;
      if (this.hitCombatants.has(ch)) continue;

      const hitW = ch.w || 24;
      const hitH = ch.h || 70;
      let chLeft = ch.x;
      let chRight = ch.x + hitW;
      let chTop = ch.y - 20;
      let chBottom = ch.y + hitH;

      if (ch.isProne || ch.staggerTimer > 0) {
        chTop = ch.y + hitH - 24;
        chBottom = ch.y + hitH + 2;
        chLeft = ch.x - (ch.facing === 1 ? 14 : 38);
        chRight = ch.x + hitW + (ch.facing === 1 ? 38 : 14);
      } else if (ch.isCrouching) {
        chTop = ch.y + 12;
      }

      const hitT = getSegmentAABBHitT(this.prevX, this.prevY, this.x, this.y, chLeft, chTop, chRight, chBottom);
      if (hitT !== null && hitT <= maxT) {
        this.hitCombatants.add(ch);

        // Obrażenia bezpośrednie od strumienia płomieni
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
        if (ch.hp <= 0 && !ch.isDead && !ch.isAcidDying) {
          handleFireDeath(ch, this.shooter, groundY);
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

      // Tworzenie rozlanego ognia na powierzchni
      spawnSurfaceFire(mapHit.x, mapHit.y, mapHit.nx || 0, mapHit.ny || -1, this.shooter, this.team);
      return false;
    }

    // Uderzenie w podłoże areny
    if (this.y >= groundY - 4) {
      this.y = groundY - 1;
      this.dead = true;
      spawnSurfaceFire(this.x, groundY, 0, -1, this.shooter, this.team);
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

  update(combatants, ball) {
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

    for (const ch of targets) {
      if (!ch || ch.isDead) continue;
      if (ch.isBot && !ch.active) continue;
      if (!isFFA && this.shooter && this.shooter.team && ch.team && this.shooter.team === ch.team) continue;
      if (ch.spawnProtectionTimer && ch.spawnProtectionTimer > 0) continue;

      const hitW = ch.w || 24;
      const hitH = ch.h || 70;
      const chLeft = ch.x;
      const chRight = ch.x + hitW;
      const chTop = ch.y;
      const chBottom = ch.y + hitH;

      // Sprawdzenie nachodzenia AABB postaci na strefę ognia
      const overlaps = !(chRight < fireLeft || chLeft > fireRight || chBottom < fireTop || chTop > fireBottom);
      if (overlaps) {
        // Podpalenie postaci
        igniteCombatant(ch, this.shooter, 90);

        if (!this.damageCooldown.has(ch)) {
          this.damageCooldown.set(ch, 11); // Tick obrażeń co 11 klatek (~5.5 ticków/s)
          const fireTickDmg = 4;
          ch.hp = Math.max(0, (ch.hp !== undefined ? ch.hp : 100) - fireTickDmg);
          ch.lastAttacker = this.shooter;
          ch.lastAttackerTimer = 240;

          if (ch.hp <= 0 && !ch.isDead && !ch.isAcidDying) {
            handleFireDeath(ch, this.shooter, this.y);
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
 * Obsługa zgonu postaci od ognia (rozczłonkowanie / okopcenie / impuls)
 */
function handleFireDeath(ch, killer, groundY) {
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

  const count = 2; // 2 cząstki na wystrzał dla gęstego, ciągłego strumienia
  const spread = weapon?.spread || 0.055;

  for (let k = 0; k < count; k++) {
    const jitterAngle = theta + (Math.random() - 0.5) * spread;
    const speed = (weapon?.bulletSpeed || 17) * (0.92 + Math.random() * 0.16);
    const p = new FlameParticle(shooter, muzzleX, muzzleY, jitterAngle, speed, weapon);
    activeFlameStreams.push(p);
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

  // 2. Aktualizacja rozlanego ognia na powierzchniach
  for (let i = activeSurfaceFires.length - 1; i >= 0; i--) {
    const fire = activeSurfaceFires[i];
    const alive = fire.update(combatants, ball);
    if (!alive || fire.dead) {
      activeSurfaceFires.splice(i, 1);
    }
  }

  // 3. Obsługa statusu podpalenia postaci (DoT palenia się)
  const targets = Array.isArray(combatants) ? combatants : [];
  for (const ch of targets) {
    if (!ch || ch.isDead) continue;
    if (ch.burnTimer && ch.burnTimer > 0) {
      ch.burnTimer--;
      if (ch.burnTimer % 15 === 0) {
        ch.hp = Math.max(0, (ch.hp !== undefined ? ch.hp : 100) - 2);
        if (ch.hp <= 0 && !ch.isDead && !ch.isAcidDying) {
          handleFireDeath(ch, ch.burnAttacker, groundY);
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
 * Renderowanie strumienia ognia w locie
 */
export function drawFlamethrowerStreams(ctx, camera) {
  if (!ctx || activeFlameStreams.length === 0) return;
  for (const p of activeFlameStreams) {
    p.draw(ctx);
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

  // Płomienie na ciele postaci
  const targets = Array.isArray(combatants) ? combatants : [];
  for (const ch of targets) {
    if (!ch || ch.isDead || !ch.burnTimer || ch.burnTimer <= 0) continue;
    const cx = ch.x + (ch.w || 24) * 0.5;
    const cy = ch.y + (ch.h || 70) * 0.45;
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
}
