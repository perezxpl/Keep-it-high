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
import {
  triggerScreenShake,
  carveGroundHole,
  spawnBloodSpurt,
  spawnBloodFountain,
  spawnKnockedHelmet,
  spawnVestShreds,
  spawnHeadGib,
  spawnLimbGib,
  spawnDroppedWeapon,
  triggerHitstop
} from '../world.js';
import { checkRayObstacleCollision, obstacles } from '../obstacles.js';
import { spawnBulletSparks, spawnHitSparks } from './transform.js';
import { deathmatchState, deathmatchConfig, isDeathmatchFFA } from '../deathmatch/index.js';
import { getActiveArena } from '../arenas/index.js';
import { arena1State } from '../arenas/arena1.js';
import { spawnAltarShockwave } from '../obstacles/renderer.js';
import { activeSentryGuns } from '../killstreaks/sentryGun.js';
import { ARENA_LEFT, ARENA_RIGHT } from '../config.js';
import { DEFAULT_VISUALS } from '../player/hair.js';

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

    // 1. Raycasting z przeszkodami i podłożem (identycznie jak w updateBullets)
    const obs = customObs || obstacles;
    let mapHit = checkRayObstacleCollision(this.prevX, this.prevY, this.x, this.y, groundY, obs, this);

    // Uwzględnienie granic bocznych areny (ściany lewa / prawa)
    const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
    const aLeft = (typeof curArena?.bounds?.minX === 'number') ? curArena.bounds.minX : ARENA_LEFT;
    const aRight = (typeof curArena?.width === 'number') ? curArena.width : ((typeof curArena?.bounds?.maxX === 'number') ? curArena.bounds.maxX : ARENA_RIGHT);

    let maxT = mapHit ? mapHit.t : 1.0;
    const dx = this.x - this.prevX;
    const dy = this.y - this.prevY;
    if (Math.abs(dx) > 1e-5) {
      if (dx < 0 && this.prevX > aLeft && this.x <= aLeft) {
        const tLeft = Math.max(0, Math.min(1, (aLeft - this.prevX) / dx));
        if (tLeft < maxT) {
          maxT = tLeft;
          mapHit = { hit: true, t: tLeft, x: aLeft, y: this.prevY + dy * tLeft, nx: 1, ny: 0 };
        }
      } else if (dx > 0 && this.prevX < aRight && this.x >= aRight) {
        const tRight = Math.max(0, Math.min(1, (aRight - this.prevX) / dx));
        if (tRight < maxT) {
          maxT = tRight;
          mapHit = { hit: true, t: tRight, x: aRight, y: this.prevY + dy * tRight, nx: -1, ny: 0 };
        }
      }
    }

    const endX = mapHit ? mapHit.x : this.x;
    const endY = mapHit ? mapHit.y : this.y;

    // 2. Kolizja kinetyczna z piłką (Spike / Rocket Blast Push)
    if (ball) {
      const cR = ball.colRadius || 5.2;
      const distToBall = distPointToSegment(ball.x, ball.y, this.prevX, this.prevY, endX, endY);
      if (distToBall <= cR + this.radius + 4) {
        ball.isLevitating = false;
        if (arena1State && arena1State.waitingForKickoff) {
          arena1State.waitingForKickoff = false;
          triggerScreenShake(8);
          if (typeof spawnAltarShockwave === 'function') {
            spawnAltarShockwave(ball.x, ball.y);
          }
        }
        ball.vx += this.vx * 1.6;
        ball.vy += this.vy * 1.6 - 4.5;
        ball.spin += (this.vx > 0 ? 0.9 : -0.9);
        this.x = ball.x;
        this.y = ball.y;
        this.detonate(groundY, platforms, customObs, combatants, ball);
        return false;
      }
    }

    // 3. Przechwycenie trafienia pocisku w unikalne elementy mapy (Arena Lifecycle Hook: np. zniszczalne rampy, mosty, ołtarz)
    if (curArena && typeof curArena.onBulletHit === 'function') {
      const bulletProxy = {
        x: this.x,
        y: this.y,
        prevX: this.prevX,
        prevY: this.prevY,
        vx: this.vx,
        vy: this.vy,
        speed: this.speed,
        damage: this.damage,
        weaponId: 'RPG7',
        shooter: this.shooter,
        team: this.team,
        isRpg: true
      };
      if (curArena.onBulletHit(bulletProxy)) {
        this.x = bulletProxy.x;
        this.y = bulletProxy.y;
        this.detonate(groundY, platforms, customObs, combatants, ball);
        return false;
      }
    }

    // 4. Kolizja z wieżyczkami strażniczymi (Sentry Guns)
    let closestSentry = null;
    let closestSentryT = Infinity;
    if (Array.isArray(activeSentryGuns)) {
      for (const sentry of activeSentryGuns) {
        if (!sentry || sentry.hp <= 0) continue;
        if (sentry.owner === this.shooter) continue;
        if (sentry.team && this.team && sentry.team === this.team) continue;

        const sLeft = sentry.x - 14;
        const sRight = sentry.x + 14;
        const sTop = sentry.y - 30;
        const sBottom = sentry.y;

        const sHitT = getSegmentAABBHitT(this.prevX, this.prevY, this.x, this.y, sLeft, sTop, sRight, sBottom);
        if (sHitT !== null && sHitT <= maxT && sHitT < closestSentryT) {
          closestSentryT = sHitT;
          closestSentry = sentry;
        }
      }
    }

    // 5. Kolizja z postaciami graczy i botów (precyzyjne hitboxy, postawy stojąca/kucająca/leżąca)
    const charList = Array.isArray(combatants) ? combatants : [];
    let closestChar = null;
    let closestCharT = Infinity;

    const minBx = this.prevX < endX ? this.prevX : endX;
    const maxBx = this.prevX > endX ? this.prevX : endX;
    const minBy = this.prevY < endY ? this.prevY : endY;
    const maxBy = this.prevY > endY ? this.prevY : endY;

    const netState = (typeof window !== 'undefined' && window.networkState) ? window.networkState : null;

    for (const ch of charList) {
      if (!ch || ch === this.shooter || ch.isDead) continue;
      if (ch.isBot && !ch.active) continue;

      const isFFA = (typeof isDeathmatchFFA === 'function' ? isDeathmatchFFA() : false) ||
        (deathmatchState && deathmatchState.mode === 'FFA') ||
        (deathmatchConfig && deathmatchConfig.mode === 'FFA') ||
        (typeof window !== 'undefined' && window.deathmatchState?.mode === 'FFA');
      if (!isFFA && this.shooter && this.shooter.team && ch.team && this.shooter.team === ch.team) continue;

      if (netState && netState.isConnected) {
        if (this.shooter && this.shooter.isRemote && !ch.isRemote) continue;
        if (!netState.isHost && this.shooter && this.shooter.isBot && !ch.isRemote && !ch.isBot) continue;
      }

      const hitW = ch.w || 24;
      const hitH = ch.h || 70;
      let charLeft = ch.x;
      let charRight = ch.x + hitW;
      let charTop = ch.y - 25;
      let charBottom = ch.y + hitH;

      if (ch.isProne || ch.staggerTimer > 0) {
        charTop = ch.y + hitH - 24;
        charBottom = ch.y + hitH + 2;
        charLeft = ch.x - (ch.facing === 1 ? 14 : 38);
        charRight = ch.x + hitW + (ch.facing === 1 ? 38 : 14);
      } else if (ch.isCrouching) {
        charTop = ch.y + 12;
      }

      // Szybkie odrzucenie AABB przed precyzyjnym testem promienia
      if (maxBx < charLeft || minBx > charRight || maxBy < charTop || minBy > charBottom) continue;

      const charT = getSegmentAABBHitT(this.prevX, this.prevY, this.x, this.y, charLeft, charTop, charRight, charBottom);
      if (charT !== null && charT <= maxT && charT < closestCharT) {
        closestCharT = charT;
        closestChar = ch;
      }
    }

    // A. Bezpośrednie trafienie w Sentry Gun (jeśli bliżej niż postać)
    if (closestSentry && closestSentryT < closestCharT) {
      this.x = this.prevX + (this.x - this.prevX) * closestSentryT;
      this.y = this.prevY + (this.y - this.prevY) * closestSentryT;
      closestSentry.hp -= this.damage;
      spawnBulletSparks(this.x, this.y, '#f59e0b', 12);
      this.detonate(groundY, platforms, customObs, combatants, ball);
      return false;
    }

    // B. Bezpośrednie trafienie w postać gracza lub bota (Direct Impact)
    if (closestChar) {
      const hitPtX = this.prevX + (this.x - this.prevX) * closestCharT;
      const hitPtY = this.prevY + (this.y - this.prevY) * closestCharT;
      this.x = hitPtX;
      this.y = hitPtY;

      let isHeadshot = false;
      let isLegshot = false;
      let isTorsoShot = false;

      if (closestChar.isProne || (closestChar.staggerTimer > 0)) {
        if (closestChar.facing === 1) {
          isHeadshot = (hitPtX >= closestChar.x + closestChar.w * 0.60);
          isLegshot = (hitPtX <= closestChar.x - 4);
          isTorsoShot = !isHeadshot && !isLegshot;
        } else {
          isHeadshot = (hitPtX <= closestChar.x + closestChar.w * 0.40);
          isLegshot = (hitPtX >= closestChar.x + closestChar.w + 4);
          isTorsoShot = !isHeadshot && !isLegshot;
        }
      } else if (closestChar.isCrouching) {
        isHeadshot = (hitPtY <= closestChar.y + 26);
        isLegshot = (hitPtY >= closestChar.y + 46);
        isTorsoShot = !isHeadshot && !isLegshot;
      } else {
        isHeadshot = (hitPtY <= closestChar.y + 16);
        isLegshot = (hitPtY >= closestChar.y + 40);
        isTorsoShot = !isHeadshot && !isLegshot;
      }

      // Osłona odrodzenia
      if ((closestChar.spawnProtectionTimer && closestChar.spawnProtectionTimer > 0) || (this.shooter && this.shooter.spawnProtectionTimer && this.shooter.spawnProtectionTimer > 0)) {
        spawnBulletSparks(hitPtX, hitPtY, '#00e5ff', 8);
        this.detonate(groundY, platforms, customObs, combatants, ball);
        return false;
      }

      let damageMultiplier = 1.0;
      let helmetAbsorbed = false;
      let vestAbsorbed = false;

      if (isHeadshot) {
        const hasHelm = !!(closestChar.hasHelmet || closestChar.visuals?.hasHelmet);
        const hasImmunity = ((closestChar.headshotImmunityTimer || 0) > 0);

        if (hasImmunity) {
          damageMultiplier = 0.50;
          helmetAbsorbed = true;
          spawnBulletSparks(hitPtX, hitPtY, '#facc15', 8);
        } else if (hasHelm) {
          helmetAbsorbed = true;
          damageMultiplier = 0.60;
          closestChar.hasHelmet = false;
          if (closestChar.visuals) closestChar.visuals.hasHelmet = false;
          closestChar.headshotImmunityTimer = 22;
          spawnKnockedHelmet(hitPtX, hitPtY - 4, this.vx, this.vy, closestChar.facing, closestChar.visuals || closestChar.currentClass?.visuals);
          triggerScreenShake(5.0);
          spawnBulletSparks(hitPtX, hitPtY, '#facc15', 14);
        } else {
          damageMultiplier = 2.0;
        }
      } else if (isTorsoShot) {
        damageMultiplier = 1.25;
      } else {
        damageMultiplier = 0.85;
      }

      let totalDamage = Math.round(this.damage * damageMultiplier);

      if (isTorsoShot && (closestChar.hasVest || closestChar.visuals?.hasVest)) {
        if (closestChar.vestHp === undefined) {
          closestChar.vestHp = 60;
          closestChar.vestMaxHp = 60;
        }

        if (closestChar.vestHp > 0) {
          vestAbsorbed = true;
          spawnBulletSparks(hitPtX, hitPtY, '#94a3b8', 10);
          if (closestChar.vestHp >= totalDamage) {
            closestChar.vestHp -= totalDamage;
            totalDamage = 0;
          } else {
            totalDamage -= closestChar.vestHp;
            closestChar.vestHp = 0;
          }

          if (closestChar.vestHp <= 0) {
            closestChar.vestHp = 0;
            closestChar.hasVest = false;
            if (closestChar.visuals) closestChar.visuals.hasVest = false;
            spawnVestShreds(hitPtX, hitPtY, this.vx, this.vy, closestChar.visuals?.vestColor || '#18181b');
            triggerScreenShake(4.0);
          }
        }
      }

      closestChar.hp = Math.max(0, (closestChar.hp !== undefined ? closestChar.hp : 100) - totalDamage);
      if (this.shooter && this.shooter !== closestChar) {
        closestChar.lastAttacker = this.shooter;
        closestChar.lastAttackerTimer = 240;
      }

      // Synchronizacja zadanych obrażeń w grze sieciowej
      const sendDmg = (typeof window !== 'undefined' && window.sendDamageEvent) ? window.sendDamageEvent : null;
      if (netState && netState.isConnected && typeof sendDmg === 'function') {
        if (closestChar.isRemote) {
          sendDmg({
            target: 'player',
            damage: this.damage,
            isHeadshot,
            isTorsoShot,
            hitX: hitPtX,
            hitY: hitPtY,
            relHitY: (typeof groundY === 'number') ? (groundY - hitPtY) : 0,
            weaponId: 'RPG7'
          });
        } else if (closestChar.isBot && !netState.isHost) {
          const activeBots = (typeof window !== 'undefined' && typeof window.getActiveBots === 'function')
            ? window.getActiveBots()
            : (typeof window !== 'undefined' && Array.isArray(window.bots) ? window.bots : []);
          const bIdx = activeBots.indexOf(closestChar);
          if (bIdx !== -1) {
            sendDmg({
              target: 'bot',
              botIdx: bIdx,
              damage: this.damage,
              isHeadshot,
              isTorsoShot,
              hitX: hitPtX,
              hitY: hitPtY,
              relHitY: (typeof groundY === 'number') ? (groundY - hitPtY) : 0,
              weaponId: 'RPG7'
            });
          }
        }
      }

      // Odrzut kinetyczny celu
      if (!closestChar.isDead && closestChar.hp > 0) {
        closestChar.vx += this.vx * 0.40;
        closestChar.vy = Math.min(closestChar.vy, -3.5);
        triggerScreenShake(6.0);
      }

      if (isHeadshot) {
        if (!helmetAbsorbed) {
          spawnBulletSparks(hitPtX, hitPtY, '#ef4444', 12);
          spawnBloodSpurt(hitPtX, hitPtY, this.vx * 0.55, this.vy * 0.55, 18, 1.6);
        }
      } else {
        if (!vestAbsorbed) {
          spawnBulletSparks(hitPtX, hitPtY, '#ef4444', 8);
          spawnBloodSpurt(hitPtX, hitPtY, this.vx * 0.45, this.vy * 0.45, 12, 1.2);
        }
      }

      // Obsługa natychmiastowego zgonu z dekapitacją / rozczłonkowaniem
      if (closestChar.hp <= 0 && !closestChar.isDead && !closestChar.isAcidDying && (!closestChar.acidDeath || !closestChar.acidDeath.active)) {
        closestChar.isDead = true;
        closestChar.killer = (this.shooter && this.shooter !== closestChar) ? this.shooter : closestChar.lastAttacker;
        closestChar.respawnTimer = 180;
        closestChar.corpseFloorY = groundY;
        closestChar.dismembered = { armFront: false, armBack: false, legFront: false, legBack: false };
        closestChar.deathHitPoint = { x: hitPtX, y: hitPtY };
        closestChar.bleedTimer = 90;
        spawnBloodSpurt(hitPtX, hitPtY, this.vx * 0.55, -3.0, 28, 1.8);

        const charVisuals = closestChar.visuals || closestChar.currentClass?.visuals || DEFAULT_VISUALS;

        if (closestChar.currentWeapon) {
          spawnDroppedWeapon(
            closestChar.x + closestChar.w / 2,
            closestChar.y + 28,
            this.vx * 0.45,
            -5.0,
            closestChar.currentWeapon,
            closestChar.facing
          );
        }

        if (isHeadshot) {
          closestChar.hasHead = false;
          closestChar.decapitated = true;
          closestChar.neckFountainTimer = 65;
          triggerHitstop(2);
          triggerScreenShake(24);
          spawnHeadGib(closestChar.x + closestChar.w / 2, closestChar.y + 2, this.vx * 0.70, -7.5, closestChar.facing, charVisuals);
          spawnBloodFountain(closestChar.x + closestChar.w / 2, closestChar.y + 14, closestChar.facing, 6);
        } else if (isLegshot) {
          closestChar.dismembered.legFront = true;
          triggerHitstop(2);
          triggerScreenShake(20);
          spawnLimbGib('leg', hitPtX, hitPtY, this.vx, this.vy, closestChar.facing, charVisuals);
          spawnBloodFountain(closestChar.x + closestChar.w / 2, closestChar.y + 45, closestChar.facing, 5);
        } else {
          closestChar.dismembered.armFront = true;
          triggerHitstop(2);
          triggerScreenShake(20);
          spawnLimbGib('arm', hitPtX, hitPtY, this.vx, this.vy, closestChar.facing, charVisuals);
          spawnBloodFountain(closestChar.x + closestChar.w / 2, closestChar.y + 16, closestChar.facing, 5);
        }

        closestChar.deathImpulse = { vx: this.vx * 0.50, vy: -3.2 };
        closestChar.ragdoll = null;
      }

      this.detonate(groundY, platforms, customObs, combatants, ball);
      return false;
    }

    // C. Trafienie w przeszkodę / strukturę / ziemię (Map Hit)
    if (mapHit) {
      this.x = mapHit.x;
      this.y = mapHit.y;
      if (typeof spawnHitSparks === 'function') {
        spawnHitSparks(mapHit.x, mapHit.y, mapHit.nx || 0, mapHit.ny || -1, 6);
      }
      this.detonate(groundY, platforms, customObs, combatants, ball);
      return false;
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
