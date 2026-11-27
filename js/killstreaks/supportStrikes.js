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
import {
  triggerArena3ShipMortarSalvo,
  updateArena3ShipMortars
} from '../arenas/arena3/background.js';
import {
  ARENA3_SHIP_MORTAR_STAGGER,
  ARENA3_SHIP_MORTAR_ASCENT,
  ARENA3_MORTAR_SCALE_APEX,
  ARENA3_MORTAR_SCALE_IMPACT,
  clampVal,
  computeUnifiedShipMortarArc,
  solveMortarFallTicks,
  drawMortarBombSprite
} from './mortarBallistics.js';
import { drawDroneBody } from './droneModel.js';
import { isArena3ActiveForDrones, spawnShipDroneTransport } from './droneTransports.js';

export const activeMortarStrikes = [];
export const activeAttackDrones = [];

function isArena3Active() {
  const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
  return (curArena?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY');
}

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
export function spawnMortarStrike(targetX, owner, options = {}) {
  const safeTargetX = (typeof targetX === 'number' && !isNaN(targetX)) ? targetX : 600;
  const shells = [];
  const offsets = Array.isArray(options.offsets) && options.offsets.length === 5
    ? options.offsets
    : Array.from({ length: 5 }, (_, i) => Math.round((i - 2) * 58 + (Math.random() - 0.5) * 45));

  const fromWarship = isArena3Active();
  const destYs = [];
  const arcs = [];

  for (let i = 0; i < 5; i++) {
    const destX = safeTargetX + offsets[i];
    const destY = getSurfaceY(destX);
    destYs.push(destY);
    if (fromWarship) {
      arcs.push(computeUnifiedShipMortarArc(destX, destY, globalCamera, i % 2));
    }
  }

  if (fromWarship) {
    triggerArena3ShipMortarSalvo(safeTargetX, offsets, arcs);
  }

  // Salwa 5 pocisków moździerzowych z płynnym przejęciem ze szczytu paraboli okrętu
  for (let i = 0; i < 5; i++) {
    const offsetX = offsets[i];
    const destX = safeTargetX + offsetX;
    const destY = destYs[i];
    const arc = fromWarship ? arcs[i] : null;
    const startY = arc ? arc.apexWorldY : ((globalCamera?.y || 0) - (340 + i * 30));
    const vx = arc ? arc.fallVx : (Math.random() - 0.5) * 1.5;
    const vy = arc ? arc.fallVyStart : (17 + Math.random() * 3);
    const gravity = arc ? arc.fallGravity : 0.12;
    const fallTicks = solveMortarFallTicks(startY, destY, vy, gravity);
    const startX = arc ? arc.apexWorldX : (destX - vx * fallTicks);

    shells.push({
      x: startX,
      y: startY,
      startY,
      destX,
      destY,
      vx,
      vy,
      gravity,
      angle: Math.atan2(vy, vx),
      handoffTime: fromWarship ? (i * ARENA3_SHIP_MORTAR_STAGGER + ARENA3_SHIP_MORTAR_ASCENT) : (i * 0.38),
      hasVisibleApex: fromWarship,
      approachProg: 0,
      enteredSky: false,
      detonated: false,
      smokeTrail: []
    });
  }

  activeMortarStrikes.push({
    owner,
    targetX: safeTargetX,
    age: 0,
    shells,
    created: Date.now()
  });

  if (owner && !owner.isBot && !owner.isRemote) {
    triggerCombatFeedBanner('KILL', '[NALOT] SALWA MOŹDZIERZOWA W DRODZE...');
  }

  const isHost = (typeof window !== 'undefined' && typeof window.isMatchHost === 'function') ? window.isMatchHost() : true;
  if (!options.fromNetwork && owner && !owner.isRemote && (!owner.isBot || isHost)) {
    if (typeof window !== 'undefined' && typeof window.sendKillstreakEvent === 'function') {
      window.sendKillstreakEvent({
        subType: 'MORTAR_STRIKE',
        targetX: Math.round(safeTargetX),
        offsets
      }, owner);
    }
  }
}

/**
 * Aktualizacja trajektorii pocisków moździerzowych
 */
export function updateMortarStrikes(dt = (1 / 60), combatants = []) {
  const safeDt = (typeof dt === 'number' && dt > 0 && dt < 1) ? dt : (1 / 60);
  updateArena3ShipMortars(safeDt, globalCamera);

  for (let i = activeMortarStrikes.length - 1; i >= 0; i--) {
    const strike = activeMortarStrikes[i];
    strike.age = (strike.age || 0) + safeDt;
    let allDone = true;

    for (let s = 0; s < strike.shells.length; s++) {
      const shell = strike.shells[s];
      if (shell.detonated) continue;
      allDone = false;

      if (!shell.enteredSky) {
        if (strike.age < shell.handoffTime) {
          continue;
        }
        shell.enteredSky = true;
        if (!shell.hasVisibleApex) {
          const camTop = (globalCamera && typeof globalCamera.y === 'number') ? globalCamera.y : 0;
          shell.y = Math.min(shell.destY - 220, camTop - 25);
          const fallTicks = solveMortarFallTicks(shell.y, shell.destY, shell.vy, shell.gravity || 0);
          shell.x = shell.destX - shell.vx * fallTicks;
          shell.angle = Math.atan2(shell.vy, shell.vx);
        }
      }

      if (typeof shell.gravity === 'number' && shell.gravity > 0) {
        shell.vy += shell.gravity;
      }
      shell.x += shell.vx;
      shell.y += shell.vy;
      shell.angle = Math.atan2(shell.vy, shell.vx);

      if (shell.hasVisibleApex) {
        const fallSpan = Math.max(40, shell.destY - (shell.startY || 0));
        const fallFrac = clampVal((shell.y - (shell.startY || 0)) / fallSpan, 0, 1);
        shell.approachProg = Math.sqrt(fallFrac);
      }

      // Zapis punktów smugi dymnej tuż za ogonem bomby
      const tailX = shell.x - Math.cos(shell.angle) * 10;
      const tailY = shell.y - Math.sin(shell.angle) * 10;
      const trailR = shell.hasVisibleApex ? (2.1 + (shell.approachProg || 0) * 2.1) : 3.6;
      shell.smokeTrail.push({ x: tailX, y: tailY, alpha: 0.78, r: trailR });
      if (shell.smokeTrail.length > 26) shell.smokeTrail.shift();

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

      if (!shell.detonated && shell.enteredSky) {
        const bombScale = shell.hasVisibleApex
          ? (ARENA3_MORTAR_SCALE_APEX + (ARENA3_MORTAR_SCALE_IMPACT - ARENA3_MORTAR_SCALE_APEX) * (shell.approachProg || 0))
          : 1.05;
        drawMortarBombSprite(ctx, shell.x, shell.y, shell.angle ?? (Math.PI * 0.5), bombScale);
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
export function spawnAttackDrone(owner, options = {}) {
  if (!owner) return;

  // Usuwamy poprzedniego drona tego samego właściciela, jeśli istniał
  for (let i = activeAttackDrones.length - 1; i >= 0; i--) {
    if (activeAttackDrones[i].owner === owner) {
      activeAttackDrones.splice(i, 1);
    }
  }

  const facing = owner.facing || 1;
  const shipDelivery = isArena3ActiveForDrones();
  const drone = {
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
    awaitingShipArrival: shipDelivery,
    leaving: false
  };
  activeAttackDrones.push(drone);

  if (shipDelivery) {
    spawnShipDroneTransport({
      cargoType: 'NONE',
      showTurret: true,
      approachDuration: 0.92,
      arcLift: 120,
      returnOnArrive: false,
      owner,
      getTargetPos: () => (!owner || owner.isDead)
        ? null
        : { x: owner.x - (owner.facing || 1) * 36, y: owner.y - 68 },
      onArrive: (tr) => {
        drone.awaitingShipArrival = false;
        drone.x = tr.x;
        drone.y = tr.y;
        drone.facing = owner.facing || tr.facing || 1;
        drone.aimAngle = drone.facing > 0 ? 0.1 : (Math.PI - 0.1);
      }
    });
  }

  if (!owner.isBot && !owner.isRemote) {
    triggerCombatFeedBanner(
      'KILL',
      shipDelivery ? '[DRON] DRON BOJOWY WYLATUJE Z OKRĘTU - WSPARCIE 25S' : '[DRON] DRON BOJOWY W POZYCJI - WSPARCIE 25S'
    );
  }

  const isHost = (typeof window !== 'undefined' && typeof window.isMatchHost === 'function') ? window.isMatchHost() : true;
  if (!options.fromNetwork && !owner.isRemote && (!owner.isBot || isHost)) {
    if (typeof window !== 'undefined' && typeof window.sendKillstreakEvent === 'function') {
      window.sendKillstreakEvent({ subType: 'ATTACK_DRONE' }, owner);
    }
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

    if (drone.awaitingShipArrival) {
      continue;
    }

    drone.life -= safeDt;
    if (drone.life <= 0) {
      activeAttackDrones.splice(i, 1);
      continue;
    }

    // Ostatnie 1.8 sekundy - odlot z powrotem na okręt (Arena 3) lub w górę ekranu
    if (drone.life < 1.8 && !drone.leaving) {
      drone.leaving = true;
      if (isArena3ActiveForDrones()) {
        spawnShipDroneTransport({
          cargoType: 'NONE',
          showTurret: true,
          startPhase: 'RETURN',
          initialX: drone.x,
          initialY: drone.y,
          initialFacing: drone.facing,
          returnDuration: 1.05,
          arcLift: 130,
          owner
        });
        activeAttackDrones.splice(i, 1);
        continue;
      }
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
    const isFFA = (typeof window !== 'undefined' && window.deathmatchState?.mode === 'FFA');

    for (const c of targets) {
      if (!c || c === owner || c.isDead || c.active === false) continue;
      // Nie strzelaj do sojuszników z tej samej drużyny
      if (!isFFA && !c.isZombie && owner.team && c.team && owner.team === c.team) continue;

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
    if (drone.awaitingShipArrival) continue;
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
    // 4. WSPÓLNY MODEL KADŁUBA DRONA I WIEŻYCZKI (DRONEMODEL.JS)
    // -------------------------------------------------------------------------
    drawDroneBody(ctx, {
      x: dx,
      y: dy,
      scale: 1.0,
      facing,
      tilt,
      rotorAngle: drone.rotorAngle,
      aimAngle: drone.aimAngle,
      gunRecoil: drone.gunRecoil || 0,
      muzzleFlashTimer: drone.muzzleFlashTimer || 0,
      lockedTarget: drone.lockedTarget,
      life: drone.life,
      totalLife: drone.totalLife || 25,
      leaving: drone.leaving,
      cargoType: 'NONE',
      showTurret: true
    });
  }

  ctx.restore();
}
