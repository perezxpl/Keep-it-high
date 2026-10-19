// =============================================================================
// JS/KILLSTREAKS/SUPPORTSTRIKES.JS - NALOT MOŹDZIERZOWY I DRON BOJOWY
// Podmoduł obsługujący salwy artyleryjskie oraz drony bojowe serii zabójstw
// Styl: Modern Military (ZERO EMOJIS, taktyczne lasery, balistyka i dym)
// =============================================================================

import { camera as globalCamera, triggerScreenShake } from '../camera.js';
import { GROUND_Y, spawnGroundPuff, spawnJetpackSparks } from '../world/state.js';
import { ARENA_PLATFORMS, getActiveArena, activeArenaId, getPlatformSurfaceY } from '../obstacles.js';
import { detonateGrenadeExplosion } from '../projectiles.js';
import { bullets } from '../weapons/transform.js';
import { triggerCombatFeedBanner } from '../ui/combatFeed.js';
import { getRiverbankGroundY } from '../arenas/arena3/state.js';

export const activeMortarStrikes = [];
export const activeAttackDrones = [];

/**
 * Oblicza wysokość powierzchni lądowania w danym punkcie X
 */
function getSurfaceY(x) {
  const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
  const isA2 = (curArena?.id === 'arena-2' || activeArenaId === 'ARENA_2' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X' || activeArenaId === 'ARENA_2_PANDORA');
  const isA3 = (curArena?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY');

  let groundY = GROUND_Y || 960;
  if (isA2) {
    groundY = (typeof curArena?.acidSurge?.currentY === 'number')
      ? (curArena.acidSurge.currentY - 10)
      : (curArena?.hazardZoneY ?? 1440);
  } else if (isA3) {
    groundY = (typeof getRiverbankGroundY === 'function') ? getRiverbankGroundY(x) : 1200;
  }

  let highestY = groundY;
  const plats = ARENA_PLATFORMS || [];
  for (const plat of plats) {
    if (!plat || plat.solid === false || plat.isWall) continue;
    if (x >= plat.x - 10 && x <= plat.x + plat.w + 10) {
      const topY = (plat.surfacePoints && typeof getPlatformSurfaceY === 'function')
        ? getPlatformSurfaceY(plat, x, groundY)
        : ((plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0)));
      if (typeof topY === 'number' && !isNaN(topY) && topY < highestY && topY > 80) {
        highestY = topY;
      }
    }
  }
  return highestY;
}

// =============================================================================
// NALOT MOŹDZIERZOWY (MORTAR STRIKE)
// =============================================================================

/**
 * Uruchamia salwę 5 pocisków moździerzowych uderzających w wybrany sektor
 * @param {number} targetX - środek strefy uderzenia
 * @param {object} owner - podmiot wzywający nalot (gracz / bot)
 */
export function spawnMortarStrike(targetX, owner) {
  const safeTargetX = (typeof targetX === 'number' && !isNaN(targetX)) ? targetX : 600;
  const shells = [];

  // Salwa 5 pocisków moździerzowych o kaskadowych opóźnieniach
  for (let i = 0; i < 5; i++) {
    const offsetX = (i - 2) * 58 + (Math.random() - 0.5) * 45;
    const destX = safeTargetX + offsetX;
    const destY = getSurfaceY(destX);
    const startY = (globalCamera?.y || 0) - 340 - (i * 30);

    shells.push({
      x: destX + (Math.random() - 0.5) * 20,
      y: startY,
      destX,
      destY,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 17 + Math.random() * 3,
      delay: i * 0.38,
      detonated: false,
      smokeTrail: []
    });
  }

  activeMortarStrikes.push({
    owner,
    targetX: safeTargetX,
    shells,
    created: Date.now()
  });

  if (owner && !owner.isBot && !owner.isRemote) {
    triggerCombatFeedBanner('KILL', '[NALOT] SALWA MOŹDZIERZOWA W DRODZE...');
  }
}

/**
 * Aktualizacja trajektorii pocisków moździerzowych
 */
export function updateMortarStrikes(dt = (1 / 60), combatants = []) {
  const safeDt = (typeof dt === 'number' && dt > 0 && dt < 1) ? dt : (1 / 60);

  for (let i = activeMortarStrikes.length - 1; i >= 0; i--) {
    const strike = activeMortarStrikes[i];
    let allDone = true;

    for (let s = 0; s < strike.shells.length; s++) {
      const shell = strike.shells[s];
      if (shell.detonated) continue;
      allDone = false;

      if (shell.delay > 0) {
        shell.delay -= safeDt;
        continue;
      }

      shell.x += shell.vx;
      shell.y += shell.vy;

      // Zapis punktów smugi dymnej pocisku
      shell.smokeTrail.push({ x: shell.x, y: shell.y, alpha: 0.75, r: 3.5 });
      if (shell.smokeTrail.length > 14) shell.smokeTrail.shift();

      // Kolizja z powierzchnią ziemi / platformy
      if (shell.y >= shell.destY) {
        shell.detonated = true;
        detonateGrenadeExplosion(
          shell.destX,
          shell.destY,
          125,
          strike.owner,
          shell.destY,
          ARENA_PLATFORMS,
          null,
          combatants,
          null
        );

        triggerScreenShake(10);
        spawnGroundPuff(shell.destX, shell.destY);
        spawnJetpackSparks(shell.destX, shell.destY, 1, 14, ['#f97316', '#ef4444', '#facc15', '#ffffff'], 0, -3.2);
      }
    }

    // Wygasanie smug dymnych po detonacji
    for (const shell of strike.shells) {
      if (shell.detonated && shell.smokeTrail.length > 0) {
        for (const p of shell.smokeTrail) {
          p.alpha -= safeDt * 1.5;
          p.r += safeDt * 4.0;
        }
        shell.smokeTrail = shell.smokeTrail.filter(p => p.alpha > 0.05);
        if (shell.smokeTrail.length > 0) allDone = false;
      }
    }

    if (allDone) {
      activeMortarStrikes.splice(i, 1);
    }
  }
}

/**
 * Renderowanie pocisków moździerzowych i znaczników celów w świecie gry
 */
export function drawMortarStrikes(ctx, camera) {
  if (activeMortarStrikes.length === 0) return;

  ctx.save();

  for (const strike of activeMortarStrikes) {
    // 1. Czerwony celownik taktyczny na strefie uderzenia
    const cx = strike.targetX;
    const cy = getSurfaceY(cx);
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.012);

    ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + pulse * 0.4})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(cx, cy, 32 + pulse * 6, 0, Math.PI * 2);
    ctx.moveTo(cx - 44, cy); ctx.lineTo(cx + 44, cy);
    ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy + 14);
    ctx.stroke();

    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.fillText('[STREFA NALOTU]', cx, cy - 22);

    // 2. Rysowanie pocisków i ich smug dymnych
    for (const shell of strike.shells) {
      // Smuga dymna
      for (const smk of shell.smokeTrail) {
        ctx.fillStyle = `rgba(148, 163, 184, ${Math.max(0, smk.alpha * 0.45)})`;
        ctx.beginPath();
        ctx.arc(smk.x, smk.y, smk.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!shell.detonated && shell.delay <= 0) {
        // Pocisk artyleryjski (czarny czubek z ognistym ogonem)
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(shell.x, shell.y, 4.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(shell.x, shell.y - 3, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

// =============================================================================
// DRON BOJOWY (ATTACK DRONE)
// =============================================================================

/**
 * Płynna interpolacja kątowa z obsługą zawijania wokół PI
 */
function lerpAngle(current, target, factor) {
  let diff = (target - current) % (Math.PI * 2);
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > Math.PI) diff -= Math.PI * 2;
  return current + diff * factor;
}

/**
 * Wypuszcza drona asystującego, który podąża za właścicielem i prowadzi ogień
 * @param {object} owner
 */
export function spawnAttackDrone(owner) {
  if (!owner) return;

  // Usuwamy poprzedniego drona tego samego właściciela, jeśli istniał
  for (let i = activeAttackDrones.length - 1; i >= 0; i--) {
    if (activeAttackDrones[i].owner === owner) {
      activeAttackDrones.splice(i, 1);
    }
  }

  const facing = owner.facing || 1;
  activeAttackDrones.push({
    owner,
    x: owner.x - facing * 35,
    y: owner.y - 75,
    vx: 0,
    vy: 0,
    life: 25.0,
    totalLife: 25.0,
    rotorAngle: 0,
    tilt: 0,
    targetTilt: 0,
    aimAngle: facing > 0 ? 0.1 : (Math.PI - 0.1),
    gunRecoil: 0,
    fireCooldown: 0.45,
    lockedTarget: null,
    facing: facing,
    muzzleFlashTimer: 0,
    shells: [],
    leaving: false
  });

  if (!owner.isBot && !owner.isRemote) {
    triggerCombatFeedBanner('KILL', '[DRON] DRON BOJOWY W POZYCJI - WSPARCIE 25S');
  }
}

/**
 * Aktualizacja pozycji drona, fizyki lotu, wyszukiwania wrogów i prowadzenia ognia
 */
export function updateAttackDrones(dt = (1 / 60), combatants = []) {
  const safeDt = (typeof dt === 'number' && dt > 0 && dt < 1) ? dt : (1 / 60);

  for (let i = activeAttackDrones.length - 1; i >= 0; i--) {
    const drone = activeAttackDrones[i];
    const owner = drone.owner;

    if (!owner || owner.isDead) {
      activeAttackDrones.splice(i, 1);
      continue;
    }

    drone.life -= safeDt;
    if (drone.life <= 0) {
      activeAttackDrones.splice(i, 1);
      continue;
    }

    // Ostatnie 1.8 sekundy - sekwencja odlotu (departure sequence)
    if (drone.life < 1.8) {
      drone.leaving = true;
    }

    drone.rotorAngle += safeDt * 52;
    if (drone.muzzleFlashTimer > 0) drone.muzzleFlashTimer -= safeDt;
    if (drone.gunRecoil > 0) drone.gunRecoil = Math.max(0, drone.gunRecoil - safeDt * 22);

    // Aktualizacja wyrzuconych łusek mosiężnych
    if (drone.shells && drone.shells.length > 0) {
      for (let sIdx = drone.shells.length - 1; sIdx >= 0; sIdx--) {
        const s = drone.shells[sIdx];
        s.x += s.vx * safeDt;
        s.y += s.vy * safeDt;
        s.vy += 450 * safeDt; // grawitacja
        s.rot += s.vRot * safeDt;
        s.life -= safeDt;
        if (s.life <= 0) {
          drone.shells.splice(sIdx, 1);
        }
      }
    }

    // Fizyka lotu drona podczas odlotu
    if (drone.leaving) {
      drone.vy -= 420 * safeDt;
      drone.vx += (drone.facing * 180) * safeDt;
      drone.x += drone.vx * safeDt;
      drone.y += drone.vy * safeDt;
      drone.tilt += (drone.facing * 0.35 - drone.tilt) * 0.12;
      continue;
    }

    // Płynne podążanie nad plecami właściciela z organicznym lewitowaniem
    const hoverY = Math.sin(drone.life * 3.4) * 4.8 + Math.cos(drone.life * 1.9) * 2.2;
    const trailingX = - (owner.facing || 1) * 36;
    const desiredX = owner.x + trailingX;
    const desiredY = owner.y - 68 + hoverY;

    const diffX = desiredX - drone.x;
    const diffY = desiredY - drone.y;

    drone.vx = (drone.vx + diffX * 12.0 * safeDt) * 0.86;
    drone.vy = (drone.vy + diffY * 12.0 * safeDt) * 0.86;

    drone.x += drone.vx;
    drone.y += drone.vy;

    // Przechył aerodynamiczny (banking tilt) na podstawie prędkości poziomej
    drone.targetTilt = Math.max(-0.35, Math.min(0.35, drone.vx * 0.045));
    drone.tilt += (drone.targetTilt - drone.tilt) * 0.15;

    // Skanowanie w poszukiwaniu najbliższego wroga
    let nearestEnemy = null;
    let nearestDist = 540;
    const targets = Array.isArray(combatants) ? combatants : [];

    for (const c of targets) {
      if (!c || c === owner || c.isDead || c.active === false) continue;
      // Nie strzelaj do sojuszników z tej samej drużyny
      if (owner.team && c.team && owner.team === c.team) continue;

      const d = Math.hypot((c.x + c.w / 2) - drone.x, (c.y + c.h / 2) - drone.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearestEnemy = c;
      }
    }

    drone.lockedTarget = nearestEnemy;

    // Wyznaczenie pozycji wieżyczki w koordynatach świata
    const turretWorldX = drone.x + Math.cos(drone.tilt) * (drone.facing * 6) - Math.sin(drone.tilt) * 5;
    const turretWorldY = drone.y + Math.sin(drone.tilt) * (drone.facing * 6) + Math.cos(drone.tilt) * 5;

    // Obrót wieżyczki i celownika laserowego
    if (nearestEnemy) {
      drone.facing = (nearestEnemy.x + nearestEnemy.w / 2 >= drone.x) ? 1 : -1;
      const tx = nearestEnemy.x + nearestEnemy.w / 2;
      const ty = nearestEnemy.y + nearestEnemy.h * 0.45;
      const targetAngle = Math.atan2(ty - turretWorldY, tx - turretWorldX);
      drone.aimAngle = lerpAngle(drone.aimAngle, targetAngle, 0.22);
    } else {
      drone.facing = owner.facing || 1;
      const baseAngle = (drone.facing > 0) ? 0.08 : (Math.PI - 0.08);
      const sweep = Math.sin(drone.life * 2.6) * 0.35;
      drone.aimAngle = lerpAngle(drone.aimAngle, baseAngle + sweep, 0.12);
    }

    // Prowadzenie ognia w kierunku namierzonego celu
    if (drone.fireCooldown > 0) {
      drone.fireCooldown -= safeDt;
    } else if (nearestEnemy) {
      drone.fireCooldown = 0.50;
      drone.muzzleFlashTimer = 0.09;
      drone.gunRecoil = 4.5;

      const aimDirX = Math.cos(drone.aimAngle);
      const aimDirY = Math.sin(drone.aimAngle);
      const muzzleX = turretWorldX + aimDirX * 13;
      const muzzleY = turretWorldY + aimDirY * 13;
      const spd = 28;

      // Wyrzut łuski nabojowej w górę i w tył
      if (drone.shells.length < 16) {
        drone.shells.push({
          x: turretWorldX - aimDirX * 2,
          y: turretWorldY + 3,
          vx: -aimDirX * 45 + (Math.random() - 0.5) * 20,
          vy: -65 - Math.random() * 35,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 25,
          life: 0.75,
          maxLife: 0.75
        });
      }

      // Wystrzelenie pocisku smugowego z lufy drona
      if (Array.isArray(bullets)) {
        bullets.push({
          x: muzzleX,
          y: muzzleY,
          prevX: muzzleX,
          prevY: muzzleY,
          originX: muzzleX,
          originY: muzzleY,
          weaponId: 'DRONE_CANNON',
          vx: aimDirX * spd,
          vy: aimDirY * spd,
          damage: 11,
          ballPush: 0.15,
          bodyPush: 0.04,
          ragdollPushMult: 1.2,
          color: '#00e5ff',
          shooter: owner,
          life: 60,
          isSniper: false
        });
      }
    }
  }
}

/**
 * Renderowanie drona bojowego, wirników, wieżyczki, laserów i efektów taktycznych
 */
export function drawAttackDrones(ctx, camera) {
  if (activeAttackDrones.length === 0) return;

  ctx.save();

  for (const drone of activeAttackDrones) {
    const dx = drone.x;
    const dy = drone.y;
    const facing = drone.facing || 1;
    const tilt = drone.tilt || 0;

    // Obliczenie pozycji wieżyczki i wylotu lufy w koordynatach świata
    const cosTilt = Math.cos(tilt);
    const sinTilt = Math.sin(tilt);
    const turretWorldX = dx + cosTilt * (facing * 6) - sinTilt * 5;
    const turretWorldY = dy + sinTilt * (facing * 6) + cosTilt * 5;
    const aimDirX = Math.cos(drone.aimAngle);
    const aimDirY = Math.sin(drone.aimAngle);
    const muzzleDist = Math.max(7, 13 - (drone.gunRecoil || 0));
    const muzzleX = turretWorldX + aimDirX * muzzleDist;
    const muzzleY = turretWorldY + aimDirY * muzzleDist;

    // -------------------------------------------------------------------------
    // 1. ŁUSKI NABOJOWE (Wyrzucane mosiężne łuski w przestrzeni świata)
    // -------------------------------------------------------------------------
    if (drone.shells && drone.shells.length > 0) {
      for (const s of drone.shells) {
        const alpha = Math.max(0, s.life / s.maxLife);
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-2, -0.9, 4, 1.8);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-2, -0.9, 0.9, 1.8);
        ctx.restore();
      }
    }

    // -------------------------------------------------------------------------
    // 2. FALE POWIETRZA / PRZEPŁYW DÓŁ (DOWNWASH TURBULENCE)
    // -------------------------------------------------------------------------
    const rotorOffsetL = -23;
    const rotorOffsetR = 23;
    const rotLY = dy - sinTilt * rotorOffsetL;
    const rotLX = dx + cosTilt * rotorOffsetL;
    const rotRY = dy - sinTilt * rotorOffsetR;
    const rotRX = dx + cosTilt * rotorOffsetR;

    const wavePhase = (drone.rotorAngle * 0.4) % 1;
    const waveDist = 8 + wavePhase * 14;
    const waveAlpha = (1 - wavePhase) * 0.22;
    ctx.strokeStyle = `rgba(255, 255, 255, ${waveAlpha})`;
    ctx.lineWidth = 1.0;
    // Fale pod lewym wirnikiem
    ctx.beginPath();
    ctx.ellipse(rotLX, rotLY + waveDist, 10, 2.5, 0, 0, Math.PI);
    ctx.stroke();
    // Fale pod prawym wirnikiem
    ctx.beginPath();
    ctx.ellipse(rotRX, rotRY + waveDist, 10, 2.5, 0, 0, Math.PI);
    ctx.stroke();

    // -------------------------------------------------------------------------
    // 3. PROMIENIE LASEROWE, CELOWNIK I RAMKI NAMIERZANIA
    // -------------------------------------------------------------------------
    if (drone.lockedTarget) {
      const target = drone.lockedTarget;
      const tx = target.x + target.w / 2;
      const ty = target.y + target.h * 0.45;

      // Promień laserowy (dwuwarstwowy: szeroka poświata + ostry rdzeń)
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(muzzleX, muzzleY);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(215, 250, 255, 0.9)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(muzzleX, muzzleY);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      // Punkt uderzenia lasera na ciele wroga
      ctx.fillStyle = 'rgba(0, 229, 255, 0.55)';
      ctx.beginPath();
      ctx.arc(tx, ty, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(tx, ty, 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Taktyczna ramka namierzania [LOCK // AUTO] wokół celu
      const bx = target.x - 4;
      const by = target.y - 4;
      const bw = target.w + 8;
      const bh = target.h + 8;
      const bracketLen = 6;

      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      // Górny-lewy
      ctx.moveTo(bx, by + bracketLen); ctx.lineTo(bx, by); ctx.lineTo(bx + bracketLen, by);
      // Górny-prawy
      ctx.moveTo(bx + bw - bracketLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + bracketLen);
      // Dolny-lewy
      ctx.moveTo(bx, by + bh - bracketLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bracketLen, by + bh);
      // Dolny-prawy
      ctx.moveTo(bx + bw - bracketLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - bracketLen);
      ctx.stroke();

      // Etykieta namierzenia wroga
      ctx.font = '700 8px monospace';
      ctx.fillStyle = '#00e5ff';
      ctx.fillText('[LOCK // AUTO]', bx, by - 3);
      const distMeters = Math.round(Math.hypot(tx - dx, ty - dy) * 0.1);
      ctx.fillText(`${distMeters}M`, bx + bw - 16, by - 3);

    } else {
      // Tryb przeszukiwania terenu (subtelny promień skanera LIDAR)
      const scanDist = 70;
      const scanX = muzzleX + aimDirX * scanDist;
      const scanY = muzzleY + aimDirY * scanDist;

      const scanGrad = ctx.createLinearGradient(muzzleX, muzzleY, scanX, scanY);
      scanGrad.addColorStop(0, 'rgba(0, 229, 255, 0.65)');
      scanGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');

      ctx.strokeStyle = scanGrad;
      ctx.lineWidth = 1.0;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(muzzleX, muzzleY);
      ctx.lineTo(scanX, scanY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // -------------------------------------------------------------------------
    // 4. LOKALNY TRANSFORM KADŁUBA DRONA (Pochylenie i pozycja)
    // -------------------------------------------------------------------------
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(tilt);

    // Odlot: Płomień dopalaczy pionowych
    if (drone.leaving) {
      const plumeH = 14 + Math.random() * 8;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(-16, 4); ctx.lineTo(-12, 4 + plumeH); ctx.lineTo(-8, 4);
      ctx.moveTo(8, 4); ctx.lineTo(12, 4 + plumeH); ctx.lineTo(16, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-14, 4); ctx.lineTo(-12, 4 + plumeH * 0.5); ctx.lineTo(-10, 4);
      ctx.moveTo(10, 4); ctx.lineTo(12, 4 + plumeH * 0.5); ctx.lineTo(14, 4);
      ctx.fill();
    }

    // A. Ramiona wspornikowe wirników (karbonowe belki)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-23, -2); ctx.lineTo(23, -2);
    ctx.stroke();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-23, -2); ctx.lineTo(23, -2);
    ctx.stroke();

    // B. Lewa i Prawa Gondola Wirnika (Ducted Fan Housings)
    for (const rx of [-23, 23]) {
      // Pierścień obudowy turbiny (cowl ring)
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(rx - 11, -5, 22, 6, 2) : ctx.rect(rx - 11, -5, 22, 6);
      ctx.fill();
      ctx.stroke();

      // Dysk rozmycia wirnika (cyjanowa poświata)
      const blurAlpha = 0.38 + 0.18 * Math.sin(drone.rotorAngle + rx);
      ctx.fillStyle = `rgba(56, 189, 248, ${blurAlpha})`;
      ctx.beginPath();
      ctx.ellipse(rx, -4, 9.5, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Kręcące się łopatki wirnika
      const spinAngle = drone.rotorAngle * (rx < 0 ? 1 : -1);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.0;
      const bladeSpan = 8;
      const bCos = Math.cos(spinAngle) * bladeSpan;
      const bSin = Math.sin(spinAngle) * 2.2;
      ctx.beginPath();
      ctx.moveTo(rx - bCos, -4 - bSin);
      ctx.lineTo(rx + bCos, -4 + bSin);
      ctx.stroke();

      // Stożek piasty silnika (center spinner hub)
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(rx, -4, 2.0, 0, Math.PI * 2);
      ctx.fill();
    }

    // C. Oświetlenie pozycyjne (Strobe Navigation Lights na skrajach)
    const strobeBlink = (Math.floor(drone.life * 4) % 2 === 0);
    if (strobeBlink) {
      // Lewy koniec: czerwony błysk
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-33, -2, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Prawy koniec: zielony błysk
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(33, -2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // D. Kadłub główny (Stealth Carbon Fuselage)
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    if (facing > 0) {
      ctx.moveTo(-16, -2);
      ctx.lineTo(-12, -7);
      ctx.lineTo(8, -7);
      ctx.lineTo(17, -2);
      ctx.lineTo(14, 5);
      ctx.lineTo(-12, 5);
    } else {
      ctx.moveTo(16, -2);
      ctx.lineTo(12, -7);
      ctx.lineTo(-8, -7);
      ctx.lineTo(-17, -2);
      ctx.lineTo(-14, 5);
      ctx.lineTo(12, 5);
    }
    ctx.closePath();
    ctx.fill();

    // Pancerz wierzchni i krawędzie fazowane (chamfer edges)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Górna płyta pancerza (kompozyt węglowy)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-10, -6, 20, 4, 1.5) : ctx.rect(-10, -6, 20, 4);
    ctx.fill();

    // Pasek akcentowy w technologii neon cyber (cyan stripe)
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-8, -2); ctx.lineTo(8, -2);
    ctx.stroke();

    // E. Wskaźnik energii / czasu baterii (5-segmentowy pasek LED)
    const totalPips = 5;
    const litPips = Math.max(1, Math.ceil((drone.life / (drone.totalLife || 25)) * totalPips));
    let ledColor = '#00e5ff';
    if (drone.life < 5) {
      ledColor = (Math.floor(drone.life * 6) % 2 === 0) ? '#ef4444' : '#7f1d1d';
    } else if (drone.life < 10) {
      ledColor = '#f59e0b';
    }

    for (let p = 0; p < totalPips; p++) {
      ctx.fillStyle = (p < litPips) ? ledColor : '#0f172a';
      ctx.fillRect(-7 + p * 3, -5, 2, 1.5);
    }

    // F. Oznaczenie taktyczne stencil
    ctx.font = '600 5px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('UAV-9', -7, 3);

    // G. Anteny telemetryczne z tyłu kadłuba
    const rearX = facing > 0 ? -13 : 13;
    const antDir = facing > 0 ? -1 : 1;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(rearX, -5); ctx.lineTo(rearX + antDir * 5, -12);
    ctx.moveTo(rearX + (facing > 0 ? 3 : -3), -5); ctx.lineTo(rearX + antDir * 2, -13);
    ctx.stroke();

    // H. Oko sensora FLIR / Głowica optoelektroniczna na nosie
    const noseX = facing > 0 ? 15 : -15;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(noseX, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Źrenica kamery FLIR (czerwona IR przy namierzeniu wroga, cyjanowa przy skanowaniu)
    ctx.fillStyle = drone.lockedTarget ? '#f43f5e' : '#00e5ff';
    ctx.beginPath();
    ctx.arc(noseX + (facing * 0.8), 0, 1.6, 0, Math.PI * 2);
    ctx.fill();
    // Błysk szkiełka obiektywu
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(noseX + (facing * 0.4), -0.6, 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // Koniec transformu kadłuba

    // -------------------------------------------------------------------------
    // 5. WIEŻYCZKA AUTOCANNON I WYLOT LUF (Obrót w osi celu)
    // -------------------------------------------------------------------------
    ctx.save();
    ctx.translate(turretWorldX, turretWorldY);
    ctx.rotate(drone.aimAngle);

    // A. Kulista podstawa montażowa wieżyczki
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // B. Podwójna lufa działka z odrzutem mechanicznym
    const barrelLen = Math.max(5, 12 - (drone.gunRecoil || 0));
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.8;
    // Górna lufa
    ctx.beginPath();
    ctx.moveTo(2, -1.8);
    ctx.lineTo(2 + barrelLen, -1.8);
    ctx.stroke();
    // Dolna lufa
    ctx.beginPath();
    ctx.moveTo(2, 1.8);
    ctx.lineTo(2 + barrelLen, 1.8);
    ctx.stroke();

    // Hamulce wylotowe (muzzle brake caps)
    ctx.fillStyle = '#334155';
    ctx.fillRect(2 + barrelLen - 2, -2.8, 2.2, 2.0);
    ctx.fillRect(2 + barrelLen - 2, 0.8, 2.2, 2.0);

    // C. Błysk wylotowy z lufy przy strzale
    if (drone.muzzleFlashTimer > 0) {
      const flashX = 2 + barrelLen + 2;

      // 4-ramienna gwiazda płomienia wylotowego
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(flashX, 0);
      ctx.lineTo(flashX + 8, 0);
      ctx.lineTo(flashX + 1, -2.5);
      ctx.lineTo(flashX + 1, -6);
      ctx.lineTo(flashX + 1, -2.5);
      ctx.lineTo(flashX + 8, 0);
      ctx.lineTo(flashX + 1, 2.5);
      ctx.lineTo(flashX + 1, 6);
      ctx.lineTo(flashX + 1, 2.5);
      ctx.closePath();
      ctx.fill();

      // Błękitna aureola plazmowa
      ctx.fillStyle = 'rgba(0, 229, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(flashX + 2, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Boczne przedmuchy gazu z hamulca wylotowego
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(flashX - 2, -2); ctx.lineTo(flashX - 5, -5);
      ctx.moveTo(flashX - 2, 2); ctx.lineTo(flashX - 5, 5);
      ctx.stroke();
    }

    ctx.restore();
  }

  ctx.restore();
}
