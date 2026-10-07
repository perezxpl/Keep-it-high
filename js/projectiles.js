// =========================================================================
// PROJECTILES.JS - POCISKI SPECJALNE I SUPER-GRANAT DLA KLASY AERO
// Warstwa 1 / 2: Mechanika wybuchowa, niszczenie terenu i odłamki gruzu
// =========================================================================

import { CONFIG, ARENA_LEFT, ARENA_RIGHT } from './config.js';
import { getActiveArena } from './arenas/index.js';
import { triggerScreenShake, triggerHitstop, spawnBloodSpurt, camera, shakeImpulse, carveGroundHole } from './world.js';
import { ARENA_PLATFORMS, customObstacles, obstacles, activeArenaId, getPlatformSurfaceY, registerArenaResetCallback } from './obstacles.js';
import {
  spawnShrapnelStreak,
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

export const activeProjectiles = [];
export const rubbleParticles = [];
export const explosionEffects = [];
export const explosionCraters = [];

/**
 * Klasa super-granatu dla klasy Aero
 */
export class AeroSuperGrenade {
  constructor(shooter, targetX, targetY, customPower = 1.0) {
    this.id = 'grenade_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    this.shooter = shooter;
    this.team = shooter?.team || (shooter?.isBot ? 'BOT' : (shooter?.isRemote ? 'P2' : 'P1'));

    // Punkt startowy z klatki piersiowej / dłoni gracza
    const startX = shooter ? (shooter.x + shooter.w / 2 + (shooter.facing || 1) * 14) : targetX;
    const startY = shooter ? (shooter.y + shooter.h * 0.42) : targetY;

    this.x = startX;
    this.y = startY;
    this.prevX = startX;
    this.prevY = startY;

    // Kąt wzdłuż celownika
    const dx = targetX - startX;
    const dy = targetY - startY;
    const angle = Math.atan2(dy, dx);

    // Prędkość początkowa skalowana siłą rzutu:
    const speedMult = (typeof customPower === 'number' && customPower > 0) ? Math.max(0.35, Math.min(1.8, customPower)) : 1.0;
    const initialSpeed = (500 / 60) * speedMult;
    this.vx = Math.cos(angle) * initialSpeed + (shooter ? (shooter.vx || 0) * 0.35 : 0);
    this.vy = Math.sin(angle) * initialSpeed + (shooter ? (shooter.vy || 0) * 0.25 : 0) - (1.2 * Math.min(1.2, speedMult));

    this.radius = 9;
    this.rot = angle;
    this.vRot = (Math.random() * 0.15 + 0.18) * (this.vx >= 0 ? 1 : -1);

    this.bounces = 0;
    this.maxBounces = 2;
    this.restitution = 0.62;

    // Zapalnik czasowy: 1.5 sekundy (90 klatek)
    this.fuse = 90;
    this.maxFuse = 90;
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

    // 1. Odbicia od bocznych granic mapy
    if (this.x - this.radius <= ARENA_LEFT) {
      this.x = ARENA_LEFT + this.radius;
      this.vx = -this.vx * this.restitution;
      this.vRot = -this.vRot * 0.8;
      this.bounces++;
    } else if (this.x + this.radius >= ARENA_RIGHT) {
      this.x = ARENA_RIGHT - this.radius;
      this.vx = -this.vx * this.restitution;
      this.vRot = -this.vRot * 0.8;
      this.bounces++;
    }

    // 2. Odbicie od poziomu terenu / rzeki
    const curArena = getActiveArena?.();
    const isA3 = (curArena?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY');

    if (isA3) {
      let terrainY = 1200;
      const gx = this.x;
      if (gx < 1150) {
        terrainY = 1200;
      } else if (gx >= 1150 && gx <= 1750) {
        const t = (gx - 1150) / 600;
        terrainY = 1200 + t * 135; // Owalny lewy brzeg (Y: 1200 do 1335)
      } else if (gx > 1750 && gx < 2650) {
        terrainY = 1390; // Koryto / dno rzeki w głębi wąwozu
      } else if (gx >= 2650 && gx <= 3250) {
        const t = (gx - 2650) / 600;
        terrainY = 1335 - t * 135; // Owalny prawy brzeg (Y: 1335 do 1200)
      } else {
        terrainY = 1200;
      }

      // Woda rzeki (X: 1650 do 2750, lustro wody Y: 1305)
      const inRiverZone = (gx >= 1650 && gx <= 2750);
      if (inRiverZone && this.y + this.radius >= 1305) {
        // Wejście do wody: rozbryzg wodny
        if (this.prevY + this.radius < 1305) {
          if (typeof window.spawnArena3WaterSplash === 'function') {
            window.spawnArena3WaterSplash(this.x, 1305, 14);
          }
        }
        // Wyporność, opór wody i tłumienie prędkości
        this.vx *= 0.84;
        this.vy = Math.min(1.4, (this.vy + 0.08) * 0.76);
        this.vRot *= 0.75;
      }

      // Odbicie od twardego podłoża lub dna rzeki
      if (this.y + this.radius >= terrainY) {
        this.y = terrainY - this.radius;
        this.vy = -this.vy * (inRiverZone ? 0.35 : this.restitution);
        this.vx *= (inRiverZone ? 0.65 : 0.82);
        this.vRot *= 0.75;
        this.bounces++;
        if (this.bounces > this.maxBounces) {
          this.vy = 0;
          this.vx *= 0.65;
        }
      }
    } else {
      if (this.y + this.radius >= groundY) {
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
    const activePlats = platforms || ARENA_PLATFORMS;
    if (Array.isArray(activePlats)) {
      for (const plat of activePlats) {
        if (!plat) continue;
        const platX = plat.x;
        const platW = plat.w;
        const thick = plat.h || plat.thickness || 20;
        const topY = (plat.surfacePoints && typeof getPlatformSurfaceY === 'function')
          ? getPlatformSurfaceY(plat, this.x, groundY)
          : ((plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0)));
        const bottomY = topY + thick;

        // A. Pionowe słupy nośne i ściany (np. tower_cyan_stem, tower_orange_stem, isWall)
        if (plat.isWall || plat.pushSide) {
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

    // 4. Detekcja bezpośredniego kontaktu z wrogim graczem / botem
    if (Array.isArray(combatants)) {
      for (const ch of combatants) {
        if (!ch || ch === this.shooter || ch.isDead) continue;
        const chCenterX = ch.x + ch.w / 2;
        const chCenterY = ch.y + ch.h / 2;
        const distToChar = Math.hypot(chCenterX - this.x, chCenterY - this.y);

        if (distToChar <= this.radius + Math.min(ch.w, ch.h) * 0.55) {
          // Natychmiastowa detonacja przy uderzeniu we wroga!
          this.detonate(groundY, activePlats, customObs, combatants, ball);
          return false;
        }
      }
    }

    // 5. Odliczanie zapalnika czasowego (1.5 sekundy)
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

    detonateGrenadeExplosion(this.x, this.y, this.blastRadius, this.shooter, groundY, platforms, customObs, combatants, ball);
  }

  draw(ctx) {
    if (this.detonated) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);

    // Korpuc granatu – taktyczny wojskowy aero-kanister
    ctx.fillStyle = '#2d3748';
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-6, -9, 12, 18, 4);
    else ctx.rect(-6, -9, 12, 18);
    ctx.fill();
    ctx.stroke();

    // Pierścień ozdobny Aero (Oliwka / Neon Lime)
    ctx.fillStyle = '#65a30d';
    ctx.fillRect(-6, -2, 12, 4);

    // Zapalnik i łyżka
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-2, -12, 4, 3);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(2, -11);
    ctx.lineTo(6, -6);
    ctx.lineTo(6, 4);
    ctx.stroke();

    // Pulsująca czerwona dioda zapalnika
    const pulseRate = (this.maxFuse - this.fuse) / this.maxFuse;
    const isLit = (Math.sin(this.fuse * (0.25 + pulseRate * 0.55)) > 0);

    ctx.fillStyle = isLit ? '#ef4444' : '#450a0a';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = isLit ? 10 : 0;
    ctx.beginPath();
    ctx.arc(0, -5, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Wystrzelenie super-granatu z postaci
 */
export function spawnAeroSuperGrenade(shooter, targetX, targetY, customPower = 1.0) {
  const grenade = new AeroSuperGrenade(shooter, targetX, targetY, customPower);
  activeProjectiles.push(grenade);
  return grenade;
}

/**
 * Główna procedura wybuchu, obrażeń i niszczenia terenu (AoE Destruction)
 */
export function detonateGrenadeExplosion(expX, expY, radius, shooter, groundY, platforms, customObs, combatants, ball) {
  // Przechwycenie wybuchu przez elementy aktywnej areny (np. odrzut wagoników kopalnianych)
  const activeArena = getActiveArena();
  if (activeArena && typeof activeArena.onExplosion === 'function') {
    activeArena.onExplosion(expX, expY, radius, { platforms: platforms || ARENA_PLATFORMS });
  }

  // 1. Obrażenia i odrzut graczy / botów
  const targets = Array.isArray(combatants) ? combatants : [];
  for (const ch of targets) {
    if (!ch || ch.isDead) continue;
    const chCenterX = ch.x + ch.w / 2;
    const chCenterY = ch.y + ch.h / 2;
    const dist = Math.hypot(chCenterX - expX, chCenterY - expY);

    if (dist <= radius) {
      const factor = Math.max(0, 1 - (dist / radius));
      // 120-150 dmg w centrum ze spadkiem liniowym
      const damage = Math.round(145 * factor);
      const impulse = factor * 22.0;

      const normX = dist > 0.001 ? (chCenterX - expX) / dist : (ch.facing || 1);
      const normY = dist > 0.001 ? (chCenterY - expY) / dist : -0.8;

      ch.vx += normX * impulse;
      ch.vy += normY * impulse - 3.8;

      ch.hp = Math.max(0, (ch.hp !== undefined ? ch.hp : 100) - damage);
      spawnBloodSpurt(chCenterX, chCenterY, normX * 4, normY * 4, 12, 1.3);

      if (ch.hp <= 0 && !ch.isDead) {
        ch.isDead = true;
        ch.respawnTimer = 180;
        ch.corpseFloorY = groundY;
        ch.isGibbed = true;
        ch.deathImpulse = { vx: normX * impulse * 1.2, vy: normY * impulse * 1.2 - 2.5 };
        triggerHitstop(8);
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
  if (isA3Explosion) {
    // Wybuch w wodzie rzeki: potężny gejzer wodny
    if (expY >= 1290 && expX >= 1620 && expX <= 2780) {
      if (typeof window.spawnArena3WaterSplash === 'function') {
        window.spawnArena3WaterSplash(expX, 1305, 36, true);
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
  spawnShrapnelStreak(expX, expY, 20);
  spawnPowderSmoke(expX, expY, 12);
  spawnDustCloud(expX, expY, 18);

  // 6. Krótkotrwały błysk (flash: 2 klatki, promień 60px, kolor: '#FFFFFF'), kula ognia
  spawnExplosionEffect(expX, expY, radius);
  // (Usunięto addExplosionCrater - zastąpiono realną wyrwą w geometrii kładki)

  // 7. Kamera: camera.shake = 16 oraz krótkie spowolnienie czasu / hitstop (freeze na 2 klatki)
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
  triggerHitstop(2);
}

/**
 * Logika cięcia / podziału platform AABB przy wybuchu
 */
export function destroyPlatformSegments(platforms, expX, expY, radius = 90, groundY) {
  const newPlatsToAdd = [];

  for (let i = platforms.length - 1; i >= 0; i--) {
    const plat = platforms[i];
    if (!plat || plat.isCanyonTerrain || plat.solid) continue;

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

      // Odbicie od podłoża
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
    }
  }
}

export function drawRubbleParticles(ctx) {
  for (const r of rubbleParticles) {
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
  for (const ef of explosionEffects) {
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

    // 2. Pierścień uderzeniowy (Shockwave ring)
    ctx.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.85})`;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 3.5 * alpha;
    ctx.beginPath();
    ctx.arc(ef.x, ef.y, ef.shockwaveRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Krótkotrwały intensywny biały błysk (flash: 2 klatki, promień 60px, kolor: '#FFFFFF')
    if (ef.flashFrames > 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, ef.flashRadius || 60, 0, Math.PI * 2);
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
 * Smugi dymu z lecącego granatu
 */
const grenadeSmokeParticles = [];
export function spawnGrenadeSmokePuff(x, y) {
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
  for (const s of grenadeSmokeParticles) {
    ctx.save();
    ctx.fillStyle = `rgba(148, 163, 184, ${s.alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Zbiorcza aktualizacja wszystkich pocisków i efektów
 */
export function updateProjectiles(groundY, platforms, customObs, combatants, ball) {
  for (let i = activeProjectiles.length - 1; i >= 0; i--) {
    const p = activeProjectiles[i];
    const isAlive = p.update(groundY, platforms, customObs, combatants, ball);
    if (!isAlive || p.detonated) {
      activeProjectiles.splice(i, 1);
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
  for (const p of activeProjectiles) {
    p.draw(ctx);
  }

  // 8. Błysk, kula ognia i fala uderzeniowa
  drawExplosionEffects(ctx);
}

if (typeof window !== 'undefined') {
  window.AeroSuperGrenade = AeroSuperGrenade;
  window.spawnAeroSuperGrenade = spawnAeroSuperGrenade;
}
