// =========================================================================
// PLAYER/DEATH.JS - DYNAMICZNY SILNIK FIZYKI ŚMIERCI I RAGDOLLA (VERLET)
// Odpowiada za punktowy impuls zgonu, bezwładność kończyn i układanie ciała.
// =========================================================================

import { CONFIG, ARENA_LEFT, ARENA_RIGHT, START_X } from '../config.js';
import { triggerScreenShake, spawnBloodDecal, spawnBloodFountain, spawnBloodDrip, spawnBloodSpurt, isGroundAt } from '../world.js';
import { ARENA_PLATFORMS, customObstacles, getPlatformSurfaceY, getPlatformBounds, getActiveArena } from '../obstacles.js';
import { getArmAnglesForTarget } from './ik.js';
import { WEAPONS } from '../weapons.js';
import { ACID_SURGE_SYSTEM } from '../arenas/arena2/state.js';
import { getRiverbankGroundY } from '../arenas/arena3/state.js';
import { deathmatchState } from '../deathmatch/state.js';

/**
 * Zwraca wysokość najbliższej platformy lub ziemi pod danym punktem (x, y)
 */
function getSurfaceUnderPoint(x, y, groundY) {
  const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
  const isA3 = (curArena?.id === 'arena-3');
  let baseGroundY = groundY;
  if (isA3 && typeof getRiverbankGroundY === 'function') {
    baseGroundY = getRiverbankGroundY(x);
  }
  const hasGround = (typeof isGroundAt === 'function') ? isGroundAt(x) : true;
  let floor = (!hasGround && !isA3) ? (groundY + 600) : baseGroundY;

  if (Array.isArray(ARENA_PLATFORMS)) {
    for (const plat of ARENA_PLATFORMS) {
      if (plat.isWall || plat.solid === false || plat.isPlatform === false) continue;
      if (isA3 && (plat.id === 'ground_left' || plat.id === 'ground_right' || plat.id === 'riverbank_left_oval' || plat.id === 'riverbank_right_oval' || plat.id === 'world_boundary_left' || plat.id === 'world_boundary_right')) continue;
      const bnds = (typeof getPlatformBounds === 'function') ? getPlatformBounds(plat) : { minX: plat.x, maxX: plat.x + plat.w };
      if (x >= bnds.minX - 6 && x <= bnds.maxX + 6) {
        const topY = (plat.surfacePoints && typeof getPlatformSurfaceY === 'function')
          ? getPlatformSurfaceY(plat, x, groundY)
          : ((plat.y !== undefined) ? (typeof getPlatformSurfaceY === 'function' ? getPlatformSurfaceY(plat, x, groundY) : plat.y) : (groundY - (plat.relY || 0)));
        if (y <= topY + 16 && topY < floor) {
          floor = topY;
        }
      }
    }
  }
  if (Array.isArray(customObstacles)) {
    for (const obs of customObstacles) {
      const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
      if (x >= obs.x - 6 && x <= obs.x + obs.w + 6) {
        if (y <= topY + 16 && topY < floor) {
          floor = topY;
        }
      }
    }
  }
  return floor;
}

/**
 * Sztywny więz odległości (odcinek kręgosłupa miednica-klatka)
 */
function solveDistanceConstraint(p1, p2, targetDist) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy) || 0.001;
  const diff = (dist - targetDist) / dist;
  const offsetX = dx * diff * 0.5;
  const offsetY = dy * diff * 0.5;
  p1.x += offsetX;
  p1.y += offsetY;
  p2.x -= offsetX;
  p2.y -= offsetY;
}

/**
 * Więz maksymalnej odległości (zapobiega rozciąganiu rąk i nóg)
 */
function solveMaxDistanceConstraint(p1, p2, maxDist) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy) || 0.001;
  if (dist > maxDist) {
    const diff = (dist - maxDist) / dist;
    p1.x += dx * diff * 0.5;
    p1.y += dy * diff * 0.5;
    p2.x -= dx * diff * 0.5;
    p2.y -= dy * diff * 0.5;
  }
}

/**
 * Inicjalizacja bezwładnego szkieletu w DOKŁADNYM układzie z ostatniej klatki życia
 */
export function initPlayerRagdoll(p, groundY) {
  const hipX = p.x + p.w / 2;
  const hipY = p.y + p.h - 40 + (p.pelvisY || 0);
  const facing = p.facing || 1;

  const torsoAngle = p.pose?.torsoTilt || p.torsoTilt || 0;
  const chestX = hipX + 22 * Math.sin(torsoAngle);
  const chestY = hipY - 22 * Math.cos(torsoAngle);

  // Rzeczywiste współrzędne kończyn z ostatniej klatki animacji
  const fFX = p.pose?.footFrontX ?? (hipX + 10 * facing);
  const fFY = p.pose?.footFrontY ?? (hipY + 44);
  const fBX = p.pose?.footBackX ?? (hipX - 10 * facing);
  const fBY = p.pose?.footBackY ?? (hipY + 44);

  // Pozycje dłoni obliczone z geometrii barków
  const shArmLen = p.upperArmLen + p.forearmLen;
  const hFX = chestX + Math.sin(p.pose?.armFrontSwing || 0) * shArmLen * facing;
  const hFY = chestY + Math.cos(p.pose?.armFrontSwing || 0) * shArmLen;
  const hBX = chestX + Math.sin(p.pose?.armBackSwing || 0) * shArmLen * facing;
  const hBY = chestY + Math.cos(p.pose?.armBackSwing || 0) * shArmLen;

  // Zachowanie pędu postaci + punktowy impuls od kuli/wybuchu
  const baseVx = p.vx || 0;
  const baseVy = p.vy || 0;
  const imp = p.deathImpulse || { vx: -facing * 3.5, vy: -1.2 };
  const hitY = p.deathHitPoint?.y ?? (hipY - 10);

  // Podział energii kinetycznej w zależności od miejsca trafienia
  const isUpper = hitY < hipY - 6;
  const chestImpX = imp.vx * (isUpper ? 1.15 : 0.45);
  const chestImpY = imp.vy * (isUpper ? 1.15 : 0.45);
  const pelvisImpX = imp.vx * (isUpper ? 0.45 : 1.15);
  const pelvisImpY = imp.vy * (isUpper ? 0.45 : 1.15);

  // Ograniczenie początkowej prędkości pionowej – zwłoki nigdy nie powinny być katapultowane w niebo
  const initChestVy = Math.max(-3.5, Math.min(8.0, baseVy * 0.4 + chestImpY));
  const initPelvisVy = Math.max(-3.0, Math.min(8.0, baseVy * 0.4 + pelvisImpY));
  const initLimbVy = Math.max(-2.5, Math.min(6.0, baseVy * 0.3 + imp.vy * 0.3));

  p.ragdoll = {
    pelvis:    { x: hipX,   y: hipY,   oldX: hipX - (baseVx + pelvisImpX), oldY: hipY - initPelvisVy, r: 8 },
    chest:     { x: chestX, y: chestY, oldX: chestX - (baseVx + chestImpX), oldY: chestY - initChestVy, r: 8 },
    footFront: { x: fFX,    y: fFY,    oldX: fFX - (baseVx * 0.8 + imp.vx * 0.3), oldY: fFY - initLimbVy, r: 5 },
    footBack:  { x: fBX,    y: fBY,    oldX: fBX - (baseVx * 0.8 + imp.vx * 0.3), oldY: fBY - initLimbVy, r: 5 },
    handFront: { x: hFX,    y: hFY,    oldX: hFX - (baseVx * 0.9 + imp.vx * 0.6), oldY: hFY - initLimbVy, r: 4 },
    handBack:  { x: hBX,    y: hBY,    oldX: hBX - (baseVx * 0.9 + imp.vx * 0.6), oldY: hBY - initLimbVy, r: 4 },

    torsoLen: 22,
    legMax: (p.thighLen + p.shinLen) * 0.96,
    armMax: (p.upperArmLen + p.forearmLen) * 0.95
  };
}

/**
 * Krok fizyki cząsteczkowej Verlet: grawitacja, tarcie, kolizje z ziemią i więzy
 */
export function updatePlayerRagdoll(p, groundY) {
  if (!p.ragdoll) {
    initPlayerRagdoll(p, groundY);
  }

  const rag = p.ragdoll;
  const nodes = [rag.pelvis, rag.chest, rag.footFront, rag.footBack, rag.handFront, rag.handBack];

  // 1. Integracja pozycji z tłumieniem i grawitacją
  for (const n of nodes) {
    let vx = (n.x - n.oldX) * 0.985;
    let vy = (n.y - n.oldY) * 0.985 + 0.38;

    // Zabezpieczenie przed wystrzałami w górę (Verlet velocity blowout cap)
    if (vy < -5.5) vy = -5.5;

    n.oldX = n.x;
    n.oldY = n.y;
    n.x += vx;
    n.y += vy;

    // Kolizja z podłożem
    const floorY = getSurfaceUnderPoint(n.x, n.y, groundY);
    if (n.y >= floorY - n.r) {
      n.y = floorY - n.r;

      const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
      let slope = 0;
      if (curArena?.id === 'arena-3' && typeof getRiverbankGroundY === 'function') {
        slope = (getRiverbankGroundY(n.x + 4) - getRiverbankGroundY(n.x - 4)) / 8;
      }
      if (Math.abs(slope) > 0.03) {
        n.oldX -= slope * 0.25;
      }

      const curVx = n.x - n.oldX;
      n.oldX = n.x - curVx * 0.68; // Tarcie o podłoże

      const curVy = n.y - n.oldY;
      if (curVy > 1.2) {
        n.oldY = n.y + Math.min(curVy * 0.15, 1.2); // Tłumiony, realistyczny odskok
        if (n === rag.chest || n === rag.pelvis) {
          triggerScreenShake(1.5);
          if (floorY < groundY + 500) {
            spawnBloodDecal(n.x, floorY, 1.4, curVx);
            spawnBloodSpurt(n.x, floorY, (Math.random() - 0.5) * 4, -2.0, 7, 0.9);
          }
        }
      } else {
        if (n.oldY > n.y) {
          n.oldY = n.y; // Spoczynek – zapobiegaj fałszywemu pędowi ku górze
        }
      }
    }

    // Ściany areny
    const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
    const wallRight = (curArena?.id === 'arena-3') ? 4400 : ((typeof curArena?.width === 'number') ? curArena.width : ARENA_RIGHT);
    if (n.x < ARENA_LEFT + n.r) { n.x = ARENA_LEFT + n.r; n.oldX = n.x; }
    if (n.x > wallRight - n.r) { n.x = wallRight - n.r; n.oldX = n.x; }
  }

  // 2. Relaksacja więzów szkieletu
  for (let i = 0; i < 6; i++) {
    solveDistanceConstraint(rag.pelvis, rag.chest, rag.torsoLen);

    solveMaxDistanceConstraint(rag.pelvis, rag.footFront, rag.legMax);
    solveMaxDistanceConstraint(rag.pelvis, rag.footBack, rag.legMax);
    solveMaxDistanceConstraint(rag.chest, rag.handFront, rag.armMax);
    solveMaxDistanceConstraint(rag.chest, rag.handBack, rag.armMax);

    // Zabezpieczenie przed zapadaniem się stawów
    for (const n of nodes) {
      const fl = getSurfaceUnderPoint(n.x, n.y, groundY);
      const minY = fl - n.r;
      if (n.y > minY) {
        const delta = n.y - minY;
        n.y = minY;
        n.oldY -= delta; // Przesuń oldY o tę samą deltę – zapobiega wstrzykiwaniu energii kinetycznej w górę
      }
    }
  }

  // Synchronizacja współrzędnych gracza z miednicą
  p.x = rag.pelvis.x - p.w / 2;
  p.y = rag.pelvis.y - p.h + 20;
  p.vx = rag.pelvis.x - rag.pelvis.oldX;
  p.vy = rag.pelvis.y - rag.pelvis.oldY;
}

/**
 * Zwraca dynamiczną pozę ragdolla do przekazania do renderera
 */
export function getRagdollRenderPose(p, groundY) {
  if (!p.ragdoll) {
    initPlayerRagdoll(p, groundY);
  }

  const rag = p.ragdoll;
  const dx = rag.chest.x - rag.pelvis.x;
  const dy = rag.chest.y - rag.pelvis.y;

  const torsoTilt = Math.atan2(dx, -dy);
  const facingDir = (rag.chest.x >= rag.pelvis.x) ? 1 : -1;

  const armRight = getArmAnglesForTarget(
    (rag.handFront.x - rag.chest.x) * facingDir,
    rag.handFront.y - rag.chest.y,
    p.upperArmLen,
    p.forearmLen,
    1
  );

  const armLeft = getArmAnglesForTarget(
    (rag.handBack.x - rag.chest.x) * facingDir,
    rag.handBack.y - rag.chest.y,
    p.upperArmLen,
    p.forearmLen,
    1
  );

  return {
    hipX: rag.pelvis.x,
    hipY: rag.pelvis.y,
    torsoTilt,
    headPitch: Math.sin(torsoTilt) * 0.45,
    footFrontX: rag.footFront.x,
    footFrontY: rag.footFront.y,
    footFrontAnkle: torsoTilt * 0.35,
    footBackX: rag.footBack.x,
    footBackY: rag.footBack.y,
    footBackAnkle: torsoTilt * 0.35,
    armFrontSwing: armRight.swing,
    armFrontElbow: armRight.elbow,
    armBackSwing: armLeft.swing,
    armBackElbow: armLeft.elbow
  };
}

/**
 * Wybiera punkt odrodzenia maksymalnie oddalony od wszystkich żywych przeciwników
 */
export function getFarthestSpawnPoint(activeArena, respawningChar, combatantsList = null) {
  let candidates = [];
  if (activeArena && Array.isArray(activeArena.spawns) && activeArena.spawns.length > 0) {
    candidates = [...activeArena.spawns];
  } else {
    candidates = [
      { x: START_X - 60, y: 580, facing: 1 },
      { x: START_X + 600, y: 580, facing: -1 }
    ];
  }

  // W Arenie 2 (Sektor X) odfiltruj punkty zalane przez kwas (podczas zalań)
  if (activeArena?.id === 'arena-2' || activeArena?.alias === 'ARENA_2_SECTOR_X') {
    const curAcidY = (typeof ACID_SURGE_SYSTEM !== 'undefined' && typeof ACID_SURGE_SYSTEM.currentY === 'number')
      ? ACID_SURGE_SYSTEM.currentY
      : 1440;
    const safeCandidates = candidates.filter(s => (s.y + 70) < (curAcidY - 40));
    if (safeCandidates.length > 0) {
      candidates = safeCandidates;
    } else {
      candidates = [
        { x: 530, y: 350, facing: 1 },
        { x: 3470, y: 350, facing: -1 }
      ];
    }
  }

  const isCyan = (respawningChar.team === 'CYAN' || (!respawningChar.team && !respawningChar.isBot));
  const isFFA = (typeof deathmatchState !== 'undefined' && deathmatchState.active && deathmatchState.mode === 'FFA');

  // Wyszukaj wszystkich żywych przeciwników
  const livingEnemies = [];
  let sourceCombatants = Array.isArray(combatantsList) && combatantsList.length > 0 ? combatantsList : null;
  if (!sourceCombatants && Array.isArray(respawningChar._targets) && respawningChar._targets.length > 0) {
    sourceCombatants = respawningChar._targets;
  }
  if (!sourceCombatants && typeof deathmatchState !== 'undefined' && Array.isArray(deathmatchState.participants)) {
    sourceCombatants = deathmatchState.participants.map(p => p.ref).filter(Boolean);
  }

  if (Array.isArray(sourceCombatants)) {
    for (const c of sourceCombatants) {
      if (!c || c === respawningChar || c.isDead || (c.isBot && !c.active)) continue;
      // W trybie drużynowym pomijaj sojuszników
      if (!isFFA && respawningChar.team && c.team && respawningChar.team === c.team) continue;
      livingEnemies.push(c);
    }
  }

  // Jeśli brak żywych wrogów, wybierz spawn według drużyny
  if (livingEnemies.length === 0) {
    const teamSpawns = candidates.filter(s => (isCyan ? (s.facing >= 0 || s.x < 2000) : (s.facing < 0 || s.x >= 2000)));
    const pool = (teamSpawns.length > 0) ? teamSpawns : candidates;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Oblicz min-odległość do wroga dla każdego kandydata i wybierz ten o największej odległości
  let maxMinDist = -1;
  const scored = [];

  for (const s of candidates) {
    let minDist = Infinity;
    for (const enemy of livingEnemies) {
      const ex = enemy.x + (enemy.w || 24) * 0.5;
      const ey = enemy.y + (enemy.h || 70) * 0.5;
      const d = Math.hypot(s.x - ex, s.y - ey);
      if (d < minDist) {
        minDist = d;
      }
    }
    scored.push({ spawn: s, dist: minDist });
    if (minDist > maxMinDist) {
      maxMinDist = minDist;
    }
  }

  // Wybierz losowo spośród najlepszych (w obrębie 140px od maksimum)
  const topTier = scored.filter(item => item.dist >= maxMinDist - 140);
  if (topTier.length > 0) {
    return topTier[Math.floor(Math.random() * topTier.length)].spawn;
  }
  return candidates[0];
}

/**
 * Pętla aktualizacji stanu śmierci i respawnu (wywoływana w pętli gracza)
 */
export function handlePlayerDeath(player, groundY, combatants = null) {
  player.respawnTimer--;

  player.kickMode = 'GROUND';
  player.kickState = 'IDLE';
  player.bicycleTimer = 0;
  player.spinVolleyTimer = 0;
  player.scissorTimer = 0;

  if (player.isReloading) {
    player.isReloading = false;
    player.reloadTimer = 0;
    if (player.ammo) {
      for (const k in player.ammo) {
        player.ammo[k].isReloading = false;
        player.ammo[k].reloadTimer = 0;
      }
    }
  }

  if (player.bleedTimer === undefined) {
    player.bleedTimer = 90;
  }
  // Swobodne lanie się i kapanie krwi z bezwładnego ciała w powietrzu
  if (player.bleedTimer > 0) {
    player.bleedTimer--;
    if (player.bleedTimer % 2 === 0) {
      const woundX = (player.ragdoll ? player.ragdoll.chest.x : (player.x + player.w / 2)) + (Math.random() * 8 - 4);
      const woundY = (player.ragdoll ? player.ragdoll.chest.y : (player.y + player.h / 2)) + (Math.random() * 6 - 3);
      const pVx = player.ragdoll ? (player.ragdoll.chest.x - player.ragdoll.chest.oldX) : (player.vx || 0);
      const pVy = player.ragdoll ? (player.ragdoll.chest.y - player.ragdoll.chest.oldY) : (player.vy || 0);
      spawnBloodDrip(woundX, woundY, pVx * 0.35 + (Math.random() - 0.5) * 1.4, pVy * 0.35 + Math.random() * 1.2, 2);
    }
  }

  if (player.neckFountainTimer > 0) {
    player.neckFountainTimer--;
    if (player.neckFountainTimer % 2 === 0) {
      spawnBloodFountain(player.x + player.w / 2, player.y + 14, player.facing, 4);
    }
  }

  if (player.isGibbed || (player.acidDeath && (player.acidDeath.active || player.acidDeath.dissolved))) {
    player.vx = 0;
    player.vy = 0;
  } else {
    updatePlayerRagdoll(player, groundY);
  }

  // Respawn: odnowienie stanu i przywrócenie kompletnych kończyn
  if (player.respawnTimer <= 0) {
    player.isDead = false;
    player.isAcidDying = false;
    player.hp = player.maxHp;
    player.killer = null;
    player.lastAttacker = null;
    player.lastAttackerTimer = 0;
    player._fragRecorded = false;
    player._dmDeathRecorded = false;
    player.acidDeath = {
      active: false,
      timer: 0,
      maxDuration: 1.2,
      splashTriggered: false,
      dissolved: false
    };

    // Odnowienie zapasu amunicji po odrodzeniu
    if (player.ammo) {
      if (player.ammo.AK47) {
        player.ammo.AK47.currentAmmo = 30;
        player.ammo.AK47.reserveAmmo = 90;
        player.ammo.AK47.isReloading = false;
        player.ammo.AK47.reloadTimer = 0;
      }
      if (player.ammo.SHOTGUN) {
        player.ammo.SHOTGUN.currentAmmo = 8;
        player.ammo.SHOTGUN.reserveAmmo = 64;
        player.ammo.SHOTGUN.isReloading = false;
        player.ammo.SHOTGUN.reloadTimer = 0;
      }
      if (player.ammo.SNIPER) {
        player.ammo.SNIPER.currentAmmo = 5;
        player.ammo.SNIPER.reserveAmmo = 25;
        player.ammo.SNIPER.isReloading = false;
        player.ammo.SNIPER.reloadTimer = 0;
      }
      if (player.ammo.GLOCK) {
        player.ammo.GLOCK.currentAmmo = 17;
        player.ammo.GLOCK.reserveAmmo = 68;
        player.ammo.GLOCK.isReloading = false;
        player.ammo.GLOCK.reloadTimer = 0;
      }
    }
    player.isReloading = false;
    player.reloadTimer = 0;
    player.emptyAmmoAlert = 0;
    if (!player.currentWeapon) {
      player.currentWeapon = WEAPONS.AK47;
    }

    player.hasHead = true;
    player.decapitated = false;
    player.isGibbed = false;
    player.neckFountainTimer = 0;
    player.bleedTimer = 0;
    player.deathSpiralTimer = 0;
    player.deathInitDone = false;
    player.corpseAngle = 0;
    player.corpseRotVel = 0;
    player.deathTilt = 0;
    player.deathRotVel = 0;
    player.isSettled = false;
    player.pelvisY = -11.8;
    player.torsoTilt = 0;
    player.torsoTiltVel = 0;
    player.headBobVel = 0;
    player.severedHead = null;
    player.ragdoll = null;
    player.deathHitPoint = null;
    player.deathImpulse = null;

    player.dismembered = {
      armFront: false,
      armBack: false,
      legFront: false,
      legBack: false
    };

    if (player.pose) player.pose.initialized = false;

    player.spawnProtectionTimer = 150; // 2.5 sekundy nietykalności i zakazu zadawania obrażeń

    const activeArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
    const isCyan = (player.team === 'CYAN' || (!player.team && !player.isBot));
    const scatterX = (Math.random() - 0.5) * 24;

    const chosenSpawn = getFarthestSpawnPoint(activeArena, player, combatants);
    if (chosenSpawn) {
      player.x = (chosenSpawn.x || (isCyan ? 530 : 3470)) + scatterX;
      player.y = chosenSpawn.y || 350;
      player.facing = chosenSpawn.facing || (chosenSpawn.x < 2000 ? 1 : -1);
    } else {
      player.x = player.isBot ? (START_X + 600 + scatterX) : (START_X - 60);
      player.y = groundY - player.h;
      player.facing = player.isBot ? -1 : 1;
    }
    player.onGround = true;
    player.currentGroundY = player.y + player.h;
    player.vx = 0;
    player.vy = 0;
    player.airVx = 0;
    player.isJumping = false;
    player.isSliding = false;
    player.isCharging = false;
    player.kickState = 'IDLE';
  }
}
