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
    if (x < 1150) groundY = 1200;
    else if (x <= 1750) groundY = 1200 + ((x - 1150) / 600) * 135;
    else if (x < 2650) groundY = 1390;
    else if (x <= 3250) groundY = 1335 - ((x - 2650) / 600) * 135;
    else groundY = 1200;
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

  activeAttackDrones.push({
    owner,
    x: owner.x,
    y: owner.y - 75,
    vx: 0,
    vy: 0,
    life: 25.0,
    rotorAngle: 0,
    fireCooldown: 0.5,
    lockedTarget: null,
    facing: owner.facing || 1,
    muzzleFlashTimer: 0
  });

  if (!owner.isBot && !owner.isRemote) {
    triggerCombatFeedBanner('KILL', '[DRON] DRON BOJOWY W POZYCJI - WSPARCIE 25S');
  }
}

/**
 * Aktualizacja pozycji drona, wyszukiwanie wrogów i prowadzenie ognia
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

    drone.rotorAngle += safeDt * 45;
    if (drone.muzzleFlashTimer > 0) drone.muzzleFlashTimer -= safeDt;

    // Płynne podążanie nad ramieniem właściciela
    const desiredX = owner.x + (owner.facing || 1) * 32;
    const desiredY = owner.y - 58 + Math.sin(drone.life * 3.2) * 5;
    drone.x += (desiredX - drone.x) * 0.12;
    drone.y += (desiredY - drone.y) * 0.12;
    drone.facing = owner.facing || 1;

    // Skanowanie w poszukiwaniu najbliższego wroga
    let nearestEnemy = null;
    let nearestDist = 520;
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

    // Prowadzenie ognia w kierunku namierzonego wroga
    if (drone.fireCooldown > 0) {
      drone.fireCooldown -= safeDt;
    } else if (nearestEnemy) {
      drone.fireCooldown = 0.52;
      drone.muzzleFlashTimer = 0.08;

      const tx = nearestEnemy.x + nearestEnemy.w / 2;
      const ty = nearestEnemy.y + nearestEnemy.h * 0.45;
      const angle = Math.atan2(ty - drone.y, tx - drone.x);
      const spd = 28;

      // Wystrzelenie pocisku smugowego z lufy drona
      if (Array.isArray(bullets)) {
        bullets.push({
          x: drone.x,
          y: drone.y,
          prevX: drone.x,
          prevY: drone.y,
          originX: drone.x,
          originY: drone.y,
          weaponId: 'DRONE_CANNON',
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
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
 * Renderowanie drona bojowego, wirników i promienia laserowego
 */
export function drawAttackDrones(ctx, camera) {
  if (activeAttackDrones.length === 0) return;

  ctx.save();

  for (const drone of activeAttackDrones) {
    const dx = drone.x;
    const dy = drone.y;

    // 1. Promień celownika laserowego namierzającego cel
    if (drone.lockedTarget) {
      const tx = drone.lockedTarget.x + drone.lockedTarget.w / 2;
      const ty = drone.lockedTarget.y + drone.lockedTarget.h * 0.45;

      ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
      ctx.lineWidth = 1.0;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(dx, dy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Kadłub quadcoptera (styl Military Stealth Carbon)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(dx - 12, dy - 5, 24, 10, 3) : ctx.rect(dx - 12, dy - 5, 24, 10);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Dioda sensorowa (zielone/błękitne oko)
    ctx.fillStyle = drone.lockedTarget ? '#f43f5e' : '#00e5ff';
    ctx.beginPath();
    ctx.arc(dx + (drone.facing * 5), dy, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // 4 Ramiona wirników i dyski śmigieł
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(dx - 18, dy - 4); ctx.lineTo(dx + 18, dy - 4);
    ctx.stroke();

    // Wirujące tarcze śmigieł (efekt rozmycia)
    const blurAlpha = 0.35 + 0.2 * Math.sin(drone.rotorAngle);
    ctx.fillStyle = `rgba(56, 189, 248, ${blurAlpha})`;
    ctx.beginPath();
    ctx.ellipse(dx - 18, dy - 5, 9, 2.5, 0, 0, Math.PI * 2);
    ctx.ellipse(dx + 18, dy - 5, 9, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Błysk lufy podczas wystrzału
    if (drone.muzzleFlashTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(dx + (drone.facing * 10), dy + 2, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
