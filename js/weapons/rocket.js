// =========================================================================
// WEAPONS/ROCKET.JS - SYSTEM BALISTYKI I EKSPLOZJI RAKIET WYRZUTNI RPG-7
// Moduł rakiet naddźwiękowych, fizyki lotu, dymu, odłamków i Rocket Jumpingu
// =========================================================================

import { activeProjectiles, detonateGrenadeExplosion, spawnGrenadeSmokePuff } from '../projectiles.js';
import {
  spawnJuiceExplosion,
  spawnShrapnelStreak,
  spawnConcreteDebris,
  spawnRicochetSparks
} from '../particles.js';
import { triggerScreenShake, carveGroundHole, spawnBloodSpurt } from '../world.js';
import { checkRayObstacleCollision, obstacles } from '../obstacles.js';
import { isDeathmatchFFA } from '../deathmatch/index.js';
import { getActiveArena } from '../arenas/index.js';
import { ARENA_LEFT, ARENA_RIGHT } from '../config.js';

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
 * Klasa naddźwiękowej rakiety kumulacyjnej PG-7V wystrzeliwanej z granatnika RPG-7
 */
export class RpgRocket {
  constructor(shooter, startX, startY, angle, weapon) {
    this.id = 'rpg_rocket_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    this.type = 'ROCKET';
    this.shooter = shooter;
    this.team = shooter?.team || (shooter?.isBot ? 'BOT' : (shooter?.isRemote ? 'P2' : 'P1'));

    this.x = startX;
    this.y = startY;
    this.prevX = startX;
    this.prevY = startY;
    this.angle = angle;

    // Prędkość naddźwiękowa: start ~19.5 px/f, przyspieszenie silnika marszowego do 25 px/f
    const baseSpeed = weapon?.bulletSpeed || 21;
    this.speed = baseSpeed * 0.94;
    this.vx = Math.cos(angle) * this.speed + (shooter?.vx || 0) * 0.20;
    this.vy = Math.sin(angle) * this.speed + (shooter?.vy || 0) * 0.20;

    this.radius = 7.5;
    this.detonated = false;
    this.life = 180; // 3.0s lotu maksymalnego
    this.motorBurnTime = 75; // 75 klatek aktywnego ciągu rakietowego
    this.damage = 150;
    this.blastRadius = 145;
    this.trailTimer = 0;
  }

  update(groundY, platforms, customObs, combatants, ball) {
    if (this.detonated) return false;

    this.life--;
    if (this.life <= 0) {
      this.detonate(groundY, platforms, customObs, combatants, ball);
      return false;
    }

    this.prevX = this.x;
    this.prevY = this.y;

    // Faza 1: Silnik marszowy (Motor Burn) – lot idealnie po linii z przyspieszeniem i smugą ognia/dymu
    if (this.motorBurnTime > 0) {
      this.motorBurnTime--;
      this.speed = Math.min(25.0, this.speed + 0.28);
      this.vx = Math.cos(this.angle) * this.speed;
      this.vy = Math.sin(this.angle) * this.speed;

      // Smugi dymu prochowego i iskry silnika rakietowego z dyszy
      const tailX = this.x - Math.cos(this.angle) * 12;
      const tailY = this.y - Math.sin(this.angle) * 12;
      spawnGrenadeSmokePuff(tailX, tailY);

      this.trailTimer++;
      if (this.trailTimer % 2 === 0) {
        spawnRicochetSparks(tailX, tailY, -Math.cos(this.angle), -Math.sin(this.angle), 1);
      }
    } else {
      // Faza 2: Po wypaleniu silnika – lekka balistyka grawitacyjna
      this.vy += 0.12;
      this.angle = Math.atan2(this.vy, this.vx);
      spawnGrenadeSmokePuff(this.x, this.y);
    }

    this.x += this.vx;
    this.y += this.vy;

    // 1. Kolizja kinetyczna z piłką (Spike / Rocket Blast Push)
    if (ball) {
      const distToBall = distPointToSegment(ball.x, ball.y, this.prevX, this.prevY, this.x, this.y);
      if (distToBall <= (ball.colRadius || 5.2) + this.radius + 6) {
        ball.vx += this.vx * 1.5;
        ball.vy += this.vy * 1.5 - 4.2;
        ball.spin += (this.vx > 0 ? 0.9 : -0.9);
        this.detonate(groundY, platforms, customObs, combatants, ball);
        return false;
      }
    }

    // 2. Kolizja z przeszkodami i strukturami mapy (Raycasting)
    const wallHit = checkRayObstacleCollision(this.prevX, this.prevY, this.x, this.y, groundY, customObs || obstacles, null);
    if (wallHit) {
      this.x = wallHit.x;
      this.y = wallHit.y;
      this.detonate(groundY, platforms, customObs, combatants, ball);
      return false;
    }

    // 3. Kolizja z granicami areny i podłożem
    const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
    const aLeft = (typeof curArena?.bounds?.minX === 'number') ? curArena.bounds.minX : ARENA_LEFT;
    const aRight = (typeof curArena?.width === 'number') ? curArena.width : ((typeof curArena?.bounds?.maxX === 'number') ? curArena.bounds.maxX : ARENA_RIGHT);

    if (this.x <= aLeft + this.radius || this.x >= aRight - this.radius || this.y >= groundY - 2) {
      this.detonate(groundY, platforms, customObs, combatants, ball);
      return false;
    }

    // 4. Kolizja z postaciami graczy i botów
    const targets = Array.isArray(combatants) ? combatants : [];
    for (const ch of targets) {
      if (!ch || ch.isDead) continue;
      // Zabezpieczenie przed samobójczym trafieniem w pierwszych 4 klatkach po wystrzale
      if (ch === this.shooter && this.life > 176) continue;

      const isFFA = (typeof isDeathmatchFFA === 'function' ? isDeathmatchFFA() : false);
      if (!isFFA && this.shooter && ch !== this.shooter && this.team && ch.team && this.team === ch.team) continue;
      if (ch.spawnProtectionTimer && ch.spawnProtectionTimer > 0) continue;

      const chLeft = ch.x - 4;
      const chRight = ch.x + (ch.w || 24) + 4;
      const chTop = ch.y - 14;
      const chBottom = ch.y + (ch.h || 70) + 4;

      const hitT = getSegmentAABBHitT(this.prevX, this.prevY, this.x, this.y, chLeft, chTop, chRight, chBottom);
      if (hitT !== null && hitT >= 0 && hitT <= 1.0) {
        this.x = this.prevX + (this.x - this.prevX) * hitT;
        this.y = this.prevY + (this.y - this.prevY) * hitT;

        // Bezpośrednie trafienie naddźwiękową rakietą (Direct Impact):
        ch.hp = Math.max(0, (ch.hp !== undefined ? ch.hp : 100) - this.damage);
        if (this.shooter && this.shooter !== ch) {
          ch.lastAttacker = this.shooter;
          ch.lastAttackerTimer = 240;
        }
        spawnBloodSpurt(this.x, this.y, this.vx * 0.35, this.vy * 0.35 - 2, 24, 1.6);
        this.detonate(groundY, platforms, customObs, combatants, ball);
        return false;
      }
    }

    return true;
  }

  detonate(groundY, platforms, customObs, combatants, ball) {
    if (this.detonated) return;
    this.detonated = true;

    // 1. Ekstremalny wstrząs ekranu
    triggerScreenShake(15);

    // 2. Efekty wizualne wybuchu (fala uderzeniowa, ogień, iskry, pył, szrapnele)
    spawnJuiceExplosion(this.x, this.y);
    spawnShrapnelStreak(this.x, this.y, 16);
    spawnConcreteDebris(this.x, this.y, 12);
    carveGroundHole(this.x, this.y, 22);

    // 3. Obrażenia obszarowe AoE dla otoczenia
    detonateGrenadeExplosion(this.x, this.y, this.blastRadius, this.shooter, groundY, platforms, customObs, combatants, ball, 'RPG7');

    // 4. Mechanika ROCKET JUMPING: potężny odrzut gracza w powietrze przy strzale pod nogi
    if (this.shooter && !this.shooter.isDead) {
      const shooterCenterX = this.shooter.x + (this.shooter.w || 24) * 0.5;
      const shooterCenterY = this.shooter.y + (this.shooter.h || 70) * 0.5;
      const dist = Math.hypot(shooterCenterX - this.x, shooterCenterY - this.y);

      if (dist <= 110) {
        const factor = Math.max(0, 1 - (dist / 110));
        const signX = (dist > 0.01) ? (shooterCenterX - this.x) / dist : (this.shooter.facing || 1);

        // Katapultowanie w górę i w bok proporcjonalnie do bliskości wybuchu
        this.shooter.vx += signX * (10.5 * factor);
        this.shooter.vy = Math.min(this.shooter.vy, -14.8 * factor);
      }
    }
  }

  draw(ctx) {
    if (!ctx || this.detonated) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // 1. Płomień wylotowy silnika rakietowego z tyłu
    if (this.motorBurnTime > 0) {
      const flicker = 0.85 + Math.sin(Date.now() * 0.06) * 0.25;
      const flameLen = 14 * flicker;

      ctx.save();
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#fb923c';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(-8, -2.5);
      ctx.lineTo(-8 - flameLen, 0);
      ctx.lineTo(-8, 2.5);
      ctx.closePath();
      ctx.fill();

      // Jasny biało-żółty rdzeń płomienia
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(-8, -1.2);
      ctx.lineTo(-8 - flameLen * 0.55, 0);
      ctx.lineTo(-8, 1.2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 2. Rozkładane stateczniki brzechwowe (Fins)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-8, -6.5);
    ctx.lineTo(-4, -2);
    ctx.lineTo(-4, 2);
    ctx.lineTo(-8, 6.5);
    ctx.lineTo(-6.5, 0);
    ctx.closePath();
    ctx.fill();

    // 3. Korpus silnika marszowego (Rocket Motor Tube)
    ctx.fillStyle = '#334155';
    ctx.fillRect(-8, -2.2, 10, 4.4);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-8, -1.2, 10, 1.0);

    // 4. Stożek podstawy głowicy kumulacyjnej
    ctx.fillStyle = '#2d4a0e';
    ctx.beginPath();
    ctx.moveTo(2, -2.2);
    ctx.lineTo(6, -5.5);
    ctx.lineTo(6, 5.5);
    ctx.lineTo(2, 2.2);
    ctx.closePath();
    ctx.fill();

    // 5. Cylindryczny korpus ładunku kumulacyjnego PG-7V
    const warheadGrad = ctx.createLinearGradient(0, -6, 0, 6);
    warheadGrad.addColorStop(0.0, '#365314');
    warheadGrad.addColorStop(0.35, '#65a30d');
    warheadGrad.addColorStop(0.75, '#4d7c0f');
    warheadGrad.addColorStop(1.0, '#1a2e05');

    ctx.fillStyle = warheadGrad;
    ctx.fillRect(6, -6, 8, 12);

    // Żółty pas bojowy amunicji HE
    ctx.fillStyle = '#facc15';
    ctx.fillRect(8.5, -6, 1.4, 12);

    // 6. Stożek aerodynamiczny głowicy
    ctx.fillStyle = warheadGrad;
    ctx.beginPath();
    ctx.moveTo(14, -6);
    ctx.lineTo(22, -1.8);
    ctx.lineTo(22, 1.8);
    ctx.lineTo(14, 6);
    ctx.closePath();
    ctx.fill();

    // 7. Piezoelektryczny zapalnik uderzeniowy na szczycie głowicy
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(22, -1.4, 2.8, 2.8);
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(24.8, -1.0);
    ctx.lineTo(27, 0);
    ctx.lineTo(24.8, 1.0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Fabryka tworzenia i rejestracji lecącej rakiety RPG-7
 */
export function spawnRpgRocket(shooter, muzzleX, muzzleY, theta, weapon) {
  const rocket = new RpgRocket(shooter, muzzleX, muzzleY, theta, weapon);
  activeProjectiles.push(rocket);
  if (typeof window !== 'undefined' && Array.isArray(window.activeProjectiles)) {
    if (!window.activeProjectiles.includes(rocket)) {
      window.activeProjectiles.push(rocket);
    }
  }
  return rocket;
}
