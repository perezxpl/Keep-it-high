// =========================================================================
// PLAYER/ACTIONS.JS - AKCJE I MANEWRY SPECJALNE POSTACI
// Obsługa skoków, kopnięcia Spartan Kick oraz rzutów.
// =========================================================================

import { CONFIG } from '../config.js';
import { ease, lerp } from './ik.js';
import { triggerScreenShake, spawnJetpackSparks, spawnBloodSpurt, spawnBloodDrip, triggerHitstop, camera, carveGroundHole } from '../world.js';
import { spawnAeroSuperGrenade, detonateGrenadeExplosion, spawnThrownTomahawk, spawnMolotovCocktail } from '../projectiles.js';
import { getActiveBots } from '../bot.js';
import { getActiveZombies } from '../zombie/index.js';
import { triggerCombatFeedBanner } from '../ui/combatFeed.js';
import { deathmatchState, deathmatchConfig, isDeathmatchFFA } from '../deathmatch/index.js';
import { getActiveArena } from '../arenas/index.js';
import { spawnDroppedWeapon } from '../pickup/index.js';
import { isEnforcerPoiseActive } from '../classes/enforcer.js';
import {
  spawnShockwaveRing,
  spawnExplosionFirePuff,
  spawnStretchedSparks,
  spawnHeavySmokePuff,
  spawnJuiceExplosion,
  spawnRicochetSparks
} from '../particles.js';
import { playSound } from '../audio/index.js';

export function startJumpCharge(p) {
  if (p.isJumping || p.staggerTimer > 0) return;
  p.isJumpCharging = true;
  p.jumpChargePower = 0;
}

export function playerJump(p) {
  startJumpCharge(p);
}

export function executeReleaseJump(spawnGrass, p) {
  if (!p.isJumpCharging) return;
  p.isJumpCharging = false;
  if (p.isJumping) return;

  const baseJumpForce = p.currentClass?.stats?.jumpForce || CONFIG.JUMP_FORCE;
  const jumpImpulse = (baseJumpForce * 0.67) + (p.jumpChargePower * 4.2);
  p.vy = -jumpImpulse;
  p.isJumping = true;
  p.onGround = false;
  p.currentPlatform = null;
  p.jumpPower = p.jumpChargePower;
  p.jumpChargePower = 0;

  p.airVx = p.vx;

  const grassFn = spawnGrass || p._spawnGrass;
  const currentFloor = p.currentGroundY || p.groundY;
  if (grassFn && currentFloor) {
    for (let i = 0; i < 4; i++) {
      grassFn(p.x + p.w / 2, currentFloor, p.facing);
    }
  }

  playSound('player_jump', {
    x: p.x + (p.w || 24) * 0.5,
    y: currentFloor || (p.y + (p.h || 70)),
    gainScale: 0.9 + (p.jumpPower || 0) * 0.25
  });
  p.currentClass?.onJump?.(p, grassFn);
}

/**
 * Wykrywanie żywego przeciwnika w zwarciu (w odległości <= 75 px przed graczem w kierunku facing)
 */
export function findMeleeTarget(p, potentialTargets) {
  if (!p) return null;
  const list = potentialTargets || p._targets;
  if (!list) return null;
  const targets = Array.isArray(list) ? list : [list];

  const hipX = p.x + p.w / 2;
  const hipY = p.y + p.h - 40 + (p.pelvisY || 0);

  for (const t of targets) {
    if (!t || t === p || t.isDead) continue;
    // Ochrona sojuszników przed atakami wręcz w trybie drużynowym (TDM)
    const isFFA = (typeof isDeathmatchFFA === 'function' ? isDeathmatchFFA() : false) ||
      (deathmatchState && deathmatchState.mode === 'FFA') ||
      (deathmatchConfig && deathmatchConfig.mode === 'FFA') ||
      (typeof window !== 'undefined' && window.deathmatchState?.mode === 'FFA');
    if (!isFFA && p.team && t.team && p.team === t.team) continue;
    const targetX = t.x + (t.w || 24) / 2;
    const targetY = t.y + (t.h || 70) - 40;

    const dx = targetX - hipX;
    const dy = targetY - hipY;

    const isAhead = (dx * p.facing) >= -6;
    const dist = Math.hypot(dx, dy);

    if (isAhead && dist <= 75) {
      return t;
    }
  }
  return null;
}

/**
 * Inicjalizacja manewru Spartan Kick (czas trwania: 22 klatki)
 */
export function triggerSpartanKick(p, meleeTarget) {
  if (!p || p.isDead || p.staggerTimer > 0) return null;

  if (p.kickState !== 'IDLE' || (p.kickCooldown && p.kickCooldown > 0)) return null;

  const pwr = (p.chargePower !== undefined && p.chargePower > 0) ? p.chargePower : 1.0;
  const classCooldownSec = p.kickCooldownTime ?? p.currentClass?.stats?.kickCooldown ?? p.classConfig?.stats?.kickCooldown ?? 0.50;
  const baseCdFrames = Math.max(36, Math.round(classCooldownSec * 60) + 12);

  p.isCharging = false;
  p.kickPower = pwr;
  p.chargePower = pwr;
  p.kickMode = 'SPARTAN';
  p.kickLeg = p.nextLeg || 'front';
  p.kickState = 'SWING';
  p.spartanTimer = 0;
  p.spartanDuration = 22;
  p.kickCooldown = baseCdFrames;
  p.hitThisSwing = false;
  p.kickBufferTimer = 22;
  p.spartanTarget = meleeTarget || null;
  p.nextLeg = (p.kickLeg === 'front') ? 'back' : 'front';

  // Dynamiczny pęd kopa w biegu (Running Spartan Kick):
  const isRunning = Math.abs(p.vx || 0) > 1.8;
  p.sprintDuration = 0;
  if (isRunning) {
    // W biegu postać dynamicznie wyskakuje do przodu lunge'em z zachowaniem pędu uderzenia
    p.vx = Math.sign(p.vx || p.facing) * Math.max(Math.abs(p.vx) * 0.88, 3.2);
  } else if (!p.isJumping) {
    p.vx *= 0.40;
  }
  return 'SPARTAN';
}

export function startKickCharge(p) {
  if (!p || p.staggerTimer > 0) return;
  if (p.kickState !== 'IDLE' || p.kickCooldown > 0) return;

  p.isCharging = true;
  p.chargePower = 0;
  p.kickPower = 0;
}

/**
 * Pobiera dokładną, aktualną pozycję stopy wykonującej kopnięcie.
 */
export function getKickingFootPos(p) {
  if (!p) return { x: 0, y: 0 };

  const hipX = p.x + (p.w || 24) / 2;
  const isActivelySwinging = p.kickState === 'SWING' || p.kickMode === 'SPARTAN';

  // 1. Podczas aktywnego wymachu używamy wyliczonej trajektorii stopy kopiącej
  if (isActivelySwinging && typeof p.kickingFootX === 'number' && !isNaN(p.kickingFootX) && p.kickingFootX !== 0) {
    if (Math.abs(p.kickingFootX - hipX) < 110) {
      return { x: p.kickingFootX, y: p.kickingFootY };
    }
  }

  // 2. Pozycja stopy z aktualnej klatki animacji szkieletowej (IK)
  const isBackLeg = (p.kickLeg === 'back');
  const poseFootX = isBackLeg ? p.pose?.footBackX : p.pose?.footFrontX;
  const poseFootY = isBackLeg ? p.pose?.footBackY : p.pose?.footFrontY;

  if (typeof poseFootX === 'number' && !isNaN(poseFootX) && poseFootX !== 0) {
    if (Math.abs(poseFootX - hipX) < 85) {
      return { x: poseFootX, y: poseFootY };
    }
  }

  // 3. Fallback: wysunięty punkt stopy liczony dynamicznie z aktualnej pozycji gracza
  const facing = (typeof p.facing === 'number') ? p.facing : 1;
  const pw = p.w || 24;
  const ph = p.h || 70;
  const curSpeed = Math.abs(p.vx || 0);
  const sprintOffset = Math.min(20, curSpeed * 2.4);
  const footOffsetX = (pw / 2) + 14 + sprintOffset;
  const footOffsetY = ph - 4;

  return {
    x: p.x + (facing >= 0 ? footOffsetX : -footOffsetX),
    y: p.y + footOffsetY
  };
}

export function executeReleaseKick(p, targets) {
  if (!p || p.staggerTimer > 0) return null;
  if (!p.isCharging) return null;
  if (p.kickState !== 'IDLE' || p.kickCooldown > 0) {
    p.isCharging = false;
    return null;
  }

  const meleeTarget = findMeleeTarget(p, targets);
  return triggerSpartanKick(p, meleeTarget);
}

/**
 * Natychmiastowe wykonanie akcji kopnięcia Spartan Kick
 */
export function performKick(p, options = {}) {
  if (!p || p.isDead || p.staggerTimer > 0) return false;
  if (p.kickState !== 'IDLE' || (p.kickCooldown && p.kickCooldown > 0)) return false;

  p.isProne = false;
  p.isCrouching = false;
  p.crouchToggled = false;
  p.isCharging = false;

  const hipX = p.x + p.w / 2;
  const hipY = p.y + p.h - 40 + (p.pelvisY || 0);

  let targetX, targetY;
  if (typeof options.aimX === 'number' && !isNaN(options.aimX)) {
    targetX = options.aimX;
    targetY = (typeof options.aimY === 'number' && !isNaN(options.aimY)) ? options.aimY : (hipY - 10);
    p.facing = (targetX >= hipX) ? 1 : -1;
  } else {
    targetX = hipX + p.facing * 80;
    targetY = hipY - 10;
  }

  p.aimX = targetX;
  p.aimY = targetY;

  const dx = targetX - hipX;
  const dy = targetY - hipY;
  const dist = Math.hypot(dx, dy) || 1;
  p.kickDirX = dx / dist;
  p.kickDirY = dy / dist;

  const pwr = (typeof options.power === 'number') ? options.power : 0.70;
  p.chargePower = pwr;
  p.kickPower = pwr;

  const targets = options.targets || p._targets;
  const meleeTarget = findMeleeTarget(p, targets);
  const mode = triggerSpartanKick(p, meleeTarget);
  if (typeof options.cooldown === 'number') {
    p.kickCooldown = options.cooldown;
  }

  const footInit = getKickingFootPos(p);
  p.kickingFootX = footInit.x;
  p.kickingFootY = footInit.y;

  return mode;
}

export const kick = performKick;

export function getSpartanKickTargets(timer, duration, hipX, hipY, facing, floorY) {
  const plantFloorY = floorY - 3.5;
  const t = Math.max(0, Math.min(timer, 22));

  const supportFootX = hipX - 12 * facing;
  const supportFootY = plantFloorY;
  const supportAnkle = 0.08 * facing;

  let kickFootX, kickFootY, kickAnkle;

  if (t <= 4) {
    const w = ease(t / 4);
    kickFootX = hipX + lerp(4, 14, w) * facing;
    kickFootY = lerp(plantFloorY, hipY + 2, w);
    kickAnkle = lerp(0.0, 0.45, w) * facing;
  } else if (t <= 10) {
    const w = ease((t - 4) / 6);
    kickFootX = hipX + lerp(14, 52, w) * facing;
    kickFootY = lerp(hipY + 2, hipY - 14, w);
    kickAnkle = lerp(0.45, -0.15, w) * facing;
  } else if (t <= 15) {
    kickFootX = hipX + 52 * facing;
    kickFootY = hipY - 14;
    kickAnkle = -0.15 * facing;
  } else {
    const w = ease(Math.min(1.0, (t - 15) / 7));
    kickFootX = hipX + lerp(52, 6, w) * facing;
    kickFootY = lerp(hipY - 14, plantFloorY, w);
    kickAnkle = lerp(-0.15, 0.0, w) * facing;
  }

  return {
    kicking: { x: kickFootX, y: kickFootY, ankle: kickAnkle },
    support: { x: supportFootX, y: supportFootY, ankle: supportAnkle }
  };
}

export function applySpartanKickHit(player, targets, obstacles, groundY, spawnGrass) {
  if (player.hitThisSwing) return false;

  // Interakcja ze środowiskiem: wykopanie beczki Spartan Kickiem [E]
  if (typeof window !== 'undefined' && typeof window.checkBarrelKickInteraction === 'function') {
    const kickedBarrel = window.checkBarrelKickInteraction(player, false);
    if (kickedBarrel) {
      player.hitThisSwing = true;
      return true;
    }
  }

  const activeTargets = targets || player._targets;
  const enemy = player.spartanTarget || findMeleeTarget(player, activeTargets);

  if (enemy && !enemy.isDead) {
    const isFFA = (typeof isDeathmatchFFA === 'function' ? isDeathmatchFFA() : false) ||
      (deathmatchState && deathmatchState.mode === 'FFA') ||
      (deathmatchConfig && deathmatchConfig.mode === 'FFA') ||
      (typeof window !== 'undefined' && window.deathmatchState?.mode === 'FFA');
    if (!isFFA && player.team && enemy.team && player.team === enemy.team) return false;

    if ((enemy.spawnProtectionTimer && enemy.spawnProtectionTimer > 0) || (player.spawnProtectionTimer && player.spawnProtectionTimer > 0)) {
      return false;
    }
    const ex = enemy.x + (enemy.w || 24) / 2;
    const ey = enemy.y + (enemy.h || 70) * 0.45;

    triggerHitstop(4);
    triggerScreenShake(14);
    spawnJetpackSparks(ex, ey, player.facing, 9);
    spawnBloodSpurt(ex + (player.facing * 8), ey, player.facing, -0.2, 10, 1.2);
    playSound((enemy.hasVest || enemy.visuals?.hasVest) ? 'hit_armor' : 'hit_flesh', { x: ex, y: ey, gainScale: 1.25 });

    const baseSpartanDmg = player.currentClass?.stats?.spartanDamage || 14;
    let dmg = Math.round(baseSpartanDmg * (player.knockbackMultiplier >= 1.5 ? 1.25 : 1.0));
    if (enemy.currentClass?.id === 'ENFORCER' && isEnforcerPoiseActive(enemy)) {
      dmg = Math.round(dmg * 0.82);
    }
    enemy.hp = Math.max(0, (enemy.hp !== undefined ? enemy.hp : 100) - dmg);
    enemy.lastAttacker = player;
    enemy.lastAttackerTimer = 240;

    // 5. Fizyka celu: potężny knockback i zbalansowane ogłuszenie (50 klatek / ~0.83s przy 60 FPS)
    enemy.lastGroundedFloorY = enemy.currentGroundY || enemy.lastGroundedFloorY;
    enemy.facing = -player.facing;
    enemy.vx = player.facing * 16.5;
    enemy.airVx = enemy.vx;
    enemy.vy = -4.5;
    enemy.isJumping = true;
    enemy.onGround = false;
    const isEnemyImmune = !!(enemy.staggerImmunityTimer && enemy.staggerImmunityTimer > 0);
    const spartanStagger = isEnemyImmune ? 0 : 50;
    if (!isEnemyImmune) {
      enemy.staggerTimer = spartanStagger;
      enemy.staggerLanded = false;
      enemy.staggerRecoveryTimer = 0;
    }
    enemy.isCharging = false;
    enemy.isShooting = false;
    enemy.isCrouching = false;
    enemy.crouchToggled = false;
    enemy.isProne = false;

    // Synchronizacja Spartan Kick w grze sieciowej
    const sendDmg = (typeof window !== 'undefined' && window.sendDamageEvent) ? window.sendDamageEvent : null;
    const netState = (typeof window !== 'undefined' && window.networkState) ? window.networkState : null;
    const isNetConnected = (typeof window !== 'undefined') && Boolean(window.isNetworkActive?.() || window.wsState?.connected || (netState && netState.isConnected));
    const isNetHost = (typeof window !== 'undefined' && typeof window.isMatchHost === 'function')
      ? window.isMatchHost()
      : Boolean(netState && netState.isHost);
    if (isNetConnected && typeof sendDmg === 'function') {
      if (enemy.isRemote) {
        sendDmg({
          target: 'player',
          targetId: enemy.peerId || null,
          damage: dmg,
          isTorsoShot: true,
          hitX: ex,
          hitY: ey,
          relHitY: (typeof groundY === 'number') ? (groundY - ey) : 0,
          weaponId: 'SPARTAN_KICK',
          vx: player.facing * 16.5,
          vy: -4.5,
          stagger: spartanStagger,
          facing: -player.facing
        });
      } else if (enemy.isBot && !isNetHost) {
        const activeBots = (typeof getActiveBots === 'function') ? getActiveBots() : [];
        const bIdx = activeBots.indexOf(enemy);
        if (bIdx !== -1) {
          sendDmg({
            target: 'bot',
            botIdx: bIdx,
            damage: dmg,
            isTorsoShot: true,
            hitX: ex,
            hitY: ey,
            relHitY: (typeof groundY === 'number') ? (groundY - ey) : 0,
            weaponId: 'SPARTAN_KICK',
            vx: player.facing * 16.5,
            vy: -4.5,
            stagger: spartanStagger,
            facing: -player.facing
          });
        }
      }
    }

    if (!enemy.isDead && enemy.isZombie) {
      enemy.knockbackVx = (player.facing || 1) * 9.5;
      enemy.vy = -3.2;
      enemy.hitStunTimer = 0.4;
      enemy.onGround = false;
    }

    if (enemy.hp <= 0 && !enemy.isDead) {
      enemy.isDead = true;
      enemy.killer = player;
      enemy.killerBulletId = null;
      enemy.killedByHeadshot = false;
      enemy.respawnTimer = 180;
      enemy.bleedTimer = 90;
      enemy.corpseAngle = 0;
      enemy.corpseFloorY = groundY;
      spawnBloodSpurt(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, player.facing * 2.5, -2.0, 12, 1.1);
      spawnBloodDrip(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, player.facing * 1.5, -0.8, 5);

      if (enemy.currentWeapon) {
        spawnDroppedWeapon(
          enemy.x + (enemy.w || 24) * 0.5,
          enemy.y + 24,
          (player.facing || 1) * 3.5,
          -4.0,
          enemy.currentWeapon,
          enemy.facing,
          null,
          enemy
        );
      }

      if (enemy.isZombie) {
        enemy.reviveTimer = 4.0;
        enemy.downedHp = 60;
        enemy.riseTimer = 0;
        enemy.vx = (player.facing || 1) * 8.5;
        enemy.vy = -3.8;
        enemy.onGround = false;
        if (typeof triggerCombatFeedBanner === 'function') {
          triggerCombatFeedBanner('KILL', '[POWALENIE] ZOMBIE POWALONY KOPNIĘCIEM! WSTANIE ZA 4s!');
        }
      }
    }

    player.hitThisSwing = true;
    return true;
  }

  if (obstacles && Array.isArray(obstacles)) {
    const hipX = player.x + player.w / 2;
    const reach = 52 + 20;
    for (const obs of obstacles) {
      if (!obs || obs.exploded || obs.type !== 'explosive_barrel') continue;
      const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
      const ocx = obs.x + obs.w / 2;
      const ocy = topY + obs.h / 2;
      const dx = ocx - hipX;
      if ((dx * player.facing) > 0 && Math.abs(dx) <= reach) {
        obs.vx = player.facing * 14.0;
        obs.vy = -3.5;
        obs.isAirborne = true;
        triggerHitstop(4);
        triggerScreenShake(14);
        spawnJetpackSparks(ocx, ocy, player.facing, 8);
        player.hitThisSwing = true;
        return true;
      }
    }
  }

  // 3. Interakcja Spartan Kick z niszczalnymi klockami areny (Arena 5)
  if (typeof getActiveArena === 'function') {
    const curArena = getActiveArena();
    if (curArena && typeof curArena.onKickHit === 'function') {
      const hipX = player.x + (player.w || 26) * 0.5;
      const footX = hipX + (player.facing || 1) * 36;
      const footY = player.y + (player.h || 72) * 0.5;
      const hitBlock = curArena.onKickHit(player, {
        isSpartan: true,
        footX,
        footY,
        kickReach: 60
      });
      if (hitBlock) {
        player.hitThisSwing = true;
        return true;
      }
    }
  }

  return false;
}

export function getProneIKTargets(crawlPhase, isCrawling, hipX, plantFloorY, facing) {
  if (isCrawling) {
    const pFront = crawlPhase;
    const pBack = crawlPhase + Math.PI;

    // Nogi: naprzemienne podciąganie kolana po ziemi (31 px) i odpychanie ciała do wyprostu (46 px)
    const frontDist = 38.5 + Math.sin(pFront) * 7.5;
    const backDist = 38.5 + Math.sin(pBack) * 7.5;

    // W fazie podciągania (cos < 0) stopa lekko unosi się nad grunt, w fazie odepchnięcia (cos > 0) mocno zapiera palcami
    const frontLift = Math.max(0, -Math.cos(pFront)) * 1.8;
    const backLift = Math.max(0, -Math.cos(pBack)) * 1.8;

    const frontPush = Math.max(0, Math.cos(pFront));
    const backPush = Math.max(0, Math.cos(pBack));

    // Ręce (bez broni): naprzemienne sięganie dłonią w przód i podciąganie tułowia na łokciu po ziemi.
    // Suma (swing + elbow) = foreAngle (~1.56-1.68 rad), dzięki czemu przedramię leży płasko na podłożu, a nie sterczy w górę!
    const frontArmSwing = 0.36 + Math.cos(pFront) * 0.36;
    const frontForeAngle = 1.56 + Math.max(0, -Math.sin(pFront)) * 0.12;
    const frontArmElbow = frontForeAngle - frontArmSwing;

    const backArmSwing = 0.36 + Math.cos(pBack) * 0.36;
    const backForeAngle = 1.56 + Math.max(0, -Math.sin(pBack)) * 0.12;
    const backArmElbow = backForeAngle - backArmSwing;

    return {
      front: {
        x: hipX - frontDist * facing,
        y: plantFloorY - 4.8 - frontLift,
        ankle: (1.20 + frontPush * 0.24) * facing
      },
      back: {
        x: hipX - backDist * facing,
        y: plantFloorY - 5.0 - backLift,
        ankle: (1.20 + backPush * 0.24) * facing
      },
      frontArm: {
        swing: frontArmSwing,
        elbow: frontArmElbow
      },
      backArm: {
        swing: backArmSwing,
        elbow: backArmElbow
      }
    };
  }

  // W miejscu (PRONE IDLE): jedna noga swobodnie wyprostowana, druga lekko ugięta stabilizująco,
  // postać oparta stabilnie na łokciach i przedramionach ułożonych płasko na ziemi (swing + elbow ≈ 1.58 rad)
  return {
    front: {
      x: hipX - 44.5 * facing,
      y: plantFloorY - 4.8,
      ankle: 1.24 * facing
    },
    back: {
      x: hipX - 37.5 * facing,
      y: plantFloorY - 5.2,
      ankle: 1.32 * facing
    },
    frontArm: {
      swing: 0.34,
      elbow: 1.24
    },
    backArm: {
      swing: 0.48,
      elbow: 1.10
    }
  };
}


/**
 * Rzut granatem taktycznym niszczącym teren (standardowe wyposażenie / 10s cooldown)
 * @param {Object} p - Gracz rzucający granat
 * @param {number|null} [targetX] - Pozycja docelowa X (domyślnie aimX)
 * @param {number|null} [targetY] - Pozycja docelowa Y (domyślnie aimY)
 * @returns {Object|boolean} Wystrzelony pocisk lub false jeśli na cooldownie
 */
/**
 * Obliczenie aktualnej pozycji dłoni rzucającej w przestrzeni świata
 */
export function getThrowHandPosition(p) {
  const facing = p.facing || 1;
  const torsoTilt = p.pose?.torsoTilt || p.torsoTilt || 0;
  const hipX = p.x + (p.w || 24) / 2;
  const hipY = p.y + (p.h || 70) * 0.58;
  const shBaseX = hipX + (21 * Math.sin(torsoTilt));
  const shBaseY = hipY - (21 * Math.cos(torsoTilt));
  const shX = shBaseX + (facing * 4);
  const shY = shBaseY;
  const angle = (p.throwAnim && typeof p.throwAnim.aimAngle === 'number')
    ? p.throwAnim.aimAngle
    : (facing > 0 ? -0.45 : Math.PI + 0.45);

  return {
    x: shX + Math.cos(angle) * 26,
    y: shY + Math.sin(angle) * 26
  };
}

/**
 * Rozpoczęcie zamachu i celowania granatem (przytrzymanie klawisza / wychylenie drążka)
 */
export function prepareGrenadeThrow(p, targetX = null, targetY = null, customPower = 1.0) {
  if (!p || p.isDead || (p.staggerTimer > 0) || ((p.staggerRecoveryTimer || 0) > 0)) return false;

  let aimX, aimY;
  if (targetX !== null && targetX !== undefined && targetY !== null && targetY !== undefined) {
    aimX = targetX;
    aimY = targetY;
  } else if (typeof p.aimX === 'number' && typeof p.aimY === 'number' && !isNaN(p.aimX) && !isNaN(p.aimY)) {
    aimX = p.aimX;
    aimY = p.aimY;
  } else {
    const throwAngle = -0.62;
    const throwDist = 320;
    aimX = p.x + p.w / 2 + (p.facing || 1) * Math.cos(throwAngle) * throwDist;
    aimY = p.y + p.h * 0.42 + Math.sin(throwAngle) * throwDist;
  }

  const dx = aimX - (p.x + p.w / 2);
  const dy = aimY - (p.y + p.h * 0.38);
  const aimAngle = Math.atan2(dy, dx);
  if (Math.abs(dx) > 10) {
    p.facing = dx > 0 ? 1 : -1;
  }

  const selectedThrowable = p?.loadout?.pocket2?.throwables?.[p.loadout?.pocket2?.activeThrowableIndex || 0] || 'GRENADE';

  // Jeśli rzut jest już aktywny i gracz celuje (trzyma klawisz/drążek):
  // NIE resetujemy timera gotowania zapalnika (cookTimer), a jedynie aktualizujemy cel i moc!
  if (p.throwAnim && p.throwAnim.active && p.throwAnim.aiming) {
    p.throwAnim.targetX = aimX;
    p.throwAnim.targetY = aimY;
    p.throwAnim.aimAngle = aimAngle;
    p.throwAnim.throwType = selectedThrowable;
    if (typeof customPower === 'number' && customPower > 0) {
      p.throwAnim.power = customPower;
    }
    return true;
  }

  p.throwAnim = {
    active: true,
    aiming: true,
    phase: 'WINDUP',
    timer: 0,
    cookTimer: 0,
    maxFuse: 300,
    windupDuration: 6,
    throwDuration: 5,
    recoveryDuration: 8,
    targetX: aimX,
    targetY: aimY,
    power: customPower,
    spawned: false,
    aimAngle,
    throwType: selectedThrowable
  };

  return true;
}

/**
 * Rozpoczęcie zamachu i celowania toporkiem tomahawk (PPM lub przytrzymanie ataku)
 */
export function prepareTomahawkThrow(p, targetX = null, targetY = null, customPower = 1.0) {
  if (!p || p.isDead || (p.staggerTimer > 0) || ((p.staggerRecoveryTimer || 0) > 0)) return false;
  if (p.axeThrown) return false;

  let aimX, aimY;
  if (targetX !== null && targetX !== undefined && targetY !== null && targetY !== undefined) {
    aimX = targetX;
    aimY = targetY;
  } else if (typeof p.aimX === 'number' && typeof p.aimY === 'number' && !isNaN(p.aimX) && !isNaN(p.aimY)) {
    aimX = p.aimX;
    aimY = p.aimY;
  } else {
    const throwAngle = -0.45;
    const throwDist = 340;
    aimX = p.x + p.w / 2 + (p.facing || 1) * Math.cos(throwAngle) * throwDist;
    aimY = p.y + p.h * 0.42 + Math.sin(throwAngle) * throwDist;
  }

  const dx = aimX - (p.x + p.w / 2);
  const dy = aimY - (p.y + p.h * 0.38);
  const aimAngle = Math.atan2(dy, dx);
  if (Math.abs(dx) > 10) {
    p.facing = dx > 0 ? 1 : -1;
  }

  if (p.throwAnim && p.throwAnim.active && p.throwAnim.aiming) {
    p.throwAnim.targetX = aimX;
    p.throwAnim.targetY = aimY;
    p.throwAnim.aimAngle = aimAngle;
    if (typeof customPower === 'number' && customPower > 0) {
      p.throwAnim.power = customPower;
    }
    return true;
  }

  p.throwAnim = {
    active: true,
    aiming: true,
    phase: 'WINDUP',
    timer: 0,
    cookTimer: 0,
    maxFuse: 999999, // Toporek nie eksploduje w dłoni
    windupDuration: 5,
    throwDuration: 5,
    recoveryDuration: 7,
    targetX: aimX,
    targetY: aimY,
    power: customPower,
    spawned: false,
    aimAngle,
    throwType: 'TOMAHAWK'
  };

  return true;
}

/**
 * Wyrzut toporka tomahawk po zwolnieniu przycisku (Release Tomahawk Throw)
 */
export function releaseTomahawkThrow(p, targetX = null, targetY = null, customPower = null) {
  if (!p || p.isDead || !p.throwAnim || !p.throwAnim.active) return false;
  if (p.throwAnim.throwType !== 'TOMAHAWK') return false;

  if (targetX !== null && targetX !== undefined && targetY !== null && targetY !== undefined) {
    p.throwAnim.targetX = targetX;
    p.throwAnim.targetY = targetY;
    const dx = targetX - (p.x + p.w / 2);
    const dy = targetY - (p.y + p.h * 0.38);
    p.throwAnim.aimAngle = Math.atan2(dy, dx);
    if (Math.abs(dx) > 10) {
      p.facing = dx > 0 ? 1 : -1;
    }
  }
  if (typeof customPower === 'number' && customPower > 0) {
    p.throwAnim.power = customPower;
  }

  p.throwAnim.aiming = false;
  p.throwAnim.phase = 'THROW';
  p.throwAnim.timer = 0;
  return true;
}

/**
 * Dynamiczny wyrzut granatu po zwolnieniu przycisku celowania
 */
export function releaseGrenadeThrow(p, targetX = null, targetY = null, customPower = null) {
  if (!p || p.isDead || !p.throwAnim || !p.throwAnim.active) return false;
  if (p.grenadeCooldown !== undefined && p.grenadeCooldown > 0) {
    p.throwAnim.active = false;
    p.throwAnim.aiming = false;
    return false;
  }

  if (targetX !== null && targetX !== undefined && targetY !== null && targetY !== undefined) {
    p.throwAnim.targetX = targetX;
    p.throwAnim.targetY = targetY;
    const dx = targetX - (p.x + p.w / 2);
    const dy = targetY - (p.y + p.h * 0.38);
    p.throwAnim.aimAngle = Math.atan2(dy, dx);
    if (Math.abs(dx) > 10) {
      p.facing = dx > 0 ? 1 : -1;
    }
  }
  if (typeof customPower === 'number' && customPower > 0) {
    p.throwAnim.power = customPower;
  }

  p.throwAnim.aiming = false;
  p.throwAnim.phase = 'THROW';
  p.throwAnim.timer = 0;
  return true;
}

/**
 * Rzut granatem taktycznym niszczącym teren (inicjuje sekwencję animacji rzutu)
 * @param {Object} p - Gracz rzucający granat
 * @param {number|null} [targetX] - Pozycja docelowa X (domyślnie aimX)
 * @param {number|null} [targetY] - Pozycja docelowa Y (domyślnie aimY)
 * @param {number} [customPower] - Siła rzutu (domyślnie 1.0)
 * @returns {boolean} Czy rzut został zainicjowany
 */
export function throwTacticalGrenade(p, targetX = null, targetY = null, customPower = 1.0) {
  if (!p || p.isDead || (p.staggerTimer > 0) || ((p.staggerRecoveryTimer || 0) > 0)) return false;
  if (p.grenadeCooldown !== undefined && p.grenadeCooldown > 0) return false;

  // Jeśli gracz już celuje, wyzwól wyrzut
  if (p.throwAnim && p.throwAnim.active && p.throwAnim.aiming) {
    return releaseGrenadeThrow(p, targetX, targetY, customPower);
  }

  let aimX, aimY;
  if (targetX !== null && targetX !== undefined && targetY !== null && targetY !== undefined) {
    aimX = targetX;
    aimY = targetY;
  } else if (typeof p.aimX === 'number' && typeof p.aimY === 'number' && !isNaN(p.aimX) && !isNaN(p.aimY)) {
    aimX = p.aimX;
    aimY = p.aimY;
  } else {
    const throwAngle = -0.62;
    const throwDist = 320;
    aimX = p.x + p.w / 2 + (p.facing || 1) * Math.cos(throwAngle) * throwDist;
    aimY = p.y + p.h * 0.42 + Math.sin(throwAngle) * throwDist;
  }

  const dx = aimX - (p.x + p.w / 2);
  const dy = aimY - (p.y + p.h * 0.38);
  const aimAngle = Math.atan2(dy, dx);
  if (Math.abs(dx) > 10) {
    p.facing = dx > 0 ? 1 : -1;
  }

  const selectedThrowable = p?.loadout?.pocket2?.throwables?.[p.loadout?.pocket2?.activeThrowableIndex || 0] || 'GRENADE';

  p.throwAnim = {
    active: true,
    aiming: false,
    phase: 'WINDUP',
    timer: 0,
    cookTimer: 0,
    maxFuse: 300,
    windupDuration: 5,
    throwDuration: 5,
    recoveryDuration: 8,
    targetX: aimX,
    targetY: aimY,
    power: customPower,
    spawned: false,
    aimAngle,
    throwType: selectedThrowable
  };

  return true;
}

/**
 * Aktualizacja klatek animacji rzutu oraz fizyczny spawn pocisku w szczytowym momencie wyprostu ręki
 */
export function updatePlayerThrow(p) {
  if (!p || !p.throwAnim || !p.throwAnim.active) return;
  const tAnim = p.throwAnim;

  // Odliczanie czasu do detonacji od momentu rozpoczęcia celowania (Cooking the grenade) - wyłącznie dla granatów odłamkowych
  if (!tAnim.spawned && tAnim.throwType !== 'TOMAHAWK' && tAnim.throwType !== 'MOLOTOV') {
    tAnim.cookTimer = (tAnim.cookTimer || 0) + 1;

    // Iskry zapalnika w dłoni ostrzegające przed wybuchem w ostatnich 1.5s (cookTimer >= 210)
    if (tAnim.cookTimer >= 210 && tAnim.cookTimer % 4 === 0) {
      const handPos = getThrowHandPosition(p);
      spawnRicochetSparks(handPos.x, handPos.y - 4, (Math.random() - 0.5) * 2, -1, 1);
    }

    // Detonacja bezpośrednio w dłoni gracza po upływie 5.0 sekund (300 klatek przy 60 fps)!
    if (tAnim.cookTimer >= (tAnim.maxFuse || 300)) {
      tAnim.active = false;
      tAnim.aiming = false;
      tAnim.spawned = true;
      p.grenadeMaxCooldown = 3.5;
      p.grenadeCooldown = 3.5;

      const handPos = getThrowHandPosition(p);
      const activeArena = getActiveArena ? getActiveArena() : null;
      const arenaPlatforms = activeArena?.platforms || null;
      const allCombatants = [p, ...getActiveBots()];
      if (typeof window !== 'undefined' && window.remotePlayer && window.remotePlayer.active) {
        allCombatants.push(window.remotePlayer);
      }
      if (typeof getActiveZombies === 'function') {
        allCombatants.push(...getActiveZombies());
      }

      detonateGrenadeExplosion(
        handPos.x,
        handPos.y,
        145,
        p,
        p.currentGroundY || p.groundY || 500,
        arenaPlatforms,
        null,
        allCombatants,
        null,
        'GRENADE'
      );
      triggerScreenShake(14);
      return;
    }
  }

  // Jeśli gracz aktywnie celuje (trzyma klawisz/drążek):
  if (tAnim.aiming) {
    tAnim.phase = 'WINDUP';
    if (tAnim.timer < (tAnim.windupDuration || 6)) {
      tAnim.timer++;
    }
    // Aktualizuj wektor celowania na bieżąco
    if (typeof p.aimX === 'number' && !isNaN(p.aimX)) {
      tAnim.targetX = p.aimX;
      tAnim.targetY = p.aimY;
      const dx = tAnim.targetX - (p.x + p.w / 2);
      const dy = tAnim.targetY - (p.y + p.h * 0.38);
      tAnim.aimAngle = Math.atan2(dy, dx);
      if (Math.abs(dx) > 10) {
        p.facing = dx > 0 ? 1 : -1;
      }
    }
    return;
  }

  // Aktywne przejście przez fazy rzutu:
  if (tAnim.phase === 'WINDUP') {
    tAnim.timer++;
    if (tAnim.timer >= (tAnim.windupDuration || 5)) {
      tAnim.phase = 'THROW';
      tAnim.timer = 0;
    }
  } else if (tAnim.phase === 'THROW') {
    tAnim.timer++;
    // Kulminacyjny moment wyprostu ręki (klatka 2): odrywa się granat / tomahawk!
    if (tAnim.timer >= 2 && !tAnim.spawned) {
      tAnim.spawned = true;
      const handPos = getThrowHandPosition(p);

      if (tAnim.throwType === 'TOMAHAWK') {
        spawnThrownTomahawk(p, tAnim.targetX, tAnim.targetY, tAnim.power, handPos.x, handPos.y);
        playSound('grenade_throw', { x: handPos.x, y: handPos.y });
        if (!p.isRemote && !p.isBot) {
          const isNet = (typeof window !== 'undefined') && Boolean(window.isNetworkActive?.() || window.wsState?.connected || window.networkState?.isConnected);
          const sendTomahawk = (typeof window !== 'undefined' && window.sendTomahawkThrow) ? window.sendTomahawkThrow : null;
          if (isNet && typeof sendTomahawk === 'function') {
            sendTomahawk(tAnim.targetX, tAnim.targetY, tAnim.power, handPos.x, handPos.y);
          }
        }
        triggerScreenShake(2.5);
      } else if (tAnim.throwType === 'MOLOTOV') {
        spawnMolotovCocktail(p, tAnim.targetX, tAnim.targetY, tAnim.power, handPos.x, handPos.y);
        playSound('grenade_throw', { x: handPos.x, y: handPos.y });
        if (!p.isRemote && !p.isBot) {
          const isNet = (typeof window !== 'undefined') && Boolean(window.isNetworkActive?.() || window.wsState?.connected || window.networkState?.isConnected);
          const sendGrenade = (typeof window !== 'undefined' && window.sendGrenadeThrow) ? window.sendGrenadeThrow : null;
          if (isNet && typeof sendGrenade === 'function') {
            sendGrenade(tAnim.targetX, tAnim.targetY, tAnim.power, handPos.x, handPos.y, 0, 'MOLOTOV');
          }
        }
        p.grenadeMaxCooldown = 3.5;
        p.grenadeCooldown = 3.5;
        triggerScreenShake(2.0);
      } else {
        const remainingFuse = Math.max(1, (tAnim.maxFuse || 300) - (tAnim.cookTimer || 0));
        spawnAeroSuperGrenade(p, tAnim.targetX, tAnim.targetY, tAnim.power, handPos.x, handPos.y, remainingFuse);
        playSound('grenade_throw', { x: handPos.x, y: handPos.y });
        if (!p.isRemote && !p.isBot) {
          const isNet = (typeof window !== 'undefined') && Boolean(window.isNetworkActive?.() || window.wsState?.connected || window.networkState?.isConnected);
          const sendGrenade = (typeof window !== 'undefined' && window.sendGrenadeThrow) ? window.sendGrenadeThrow : null;
          if (isNet && typeof sendGrenade === 'function') {
            sendGrenade(tAnim.targetX, tAnim.targetY, tAnim.power, handPos.x, handPos.y, remainingFuse, 'GRENADE');
          }
        }
        p.grenadeMaxCooldown = 3.5;
        p.grenadeCooldown = 3.5;
        triggerScreenShake(2.0);
      }
    }
    if (tAnim.timer >= (tAnim.throwDuration || 5)) {
      tAnim.phase = 'RECOVERY';
      tAnim.timer = 0;
    }
  } else if (tAnim.phase === 'RECOVERY') {
    tAnim.timer++;
    if (tAnim.timer >= (tAnim.recoveryDuration || 8)) {
      tAnim.active = false;
      tAnim.phase = 'IDLE';
      tAnim.timer = 0;
    }
  }
}

/**
 * Super-umiejętność (Q) dla klasy Aero – slot ulta zwolniony z rzutu granatem
 */
export function executeAeroUlt(p, targetX = null, targetY = null) {
  // Granat został przeniesiony z ulta do standardowego wyposażenia (throwTacticalGrenade)
  return false;
}

/**
 * Spawnowanie efektu detonacji granatu w punkcie (expX, expY) (Game Juice):
 * 1. Fala uderzeniowa: 1x ShockwaveRing
 * 2. Rdzeń ognia: 14–18 cząsteczek ExplosionFirePuff wyrzuconych w promieniu 20px z losowymi prędkościami (50–120 px/s)
 * 3. Snop iskier: 30–40 cząsteczek StretchedSparks rozrzuconych promieniście
 * 4. Chmura dymu: 10–14 cząsteczek HeavySmokePuff tworzących tło wybuchu
 * 5. Kamera: camera.shake = 16 oraz krótkie spowolnienie czasu / hitstop (freeze na 2 klatki)
 */
export function spawnGrenadeDetonationJuice(expX, expY) {
  // 1. Fala uderzeniowa: 1x ShockwaveRing
  spawnShockwaveRing(expX, expY);

  // 2. Rdzeń ognia: 14–18 cząsteczek ExplosionFirePuff
  spawnExplosionFirePuff(expX, expY, Math.floor(Math.random() * 5 + 14));

  // 3. Snop iskier: 30–40 cząsteczek StretchedSparks
  spawnStretchedSparks(expX, expY, Math.floor(Math.random() * 11 + 30));

  // 4. Chmura dymu: 10–14 cząsteczek HeavySmokePuff
  spawnHeavySmokePuff(expX, expY, Math.floor(Math.random() * 5 + 10));

  // 5. Kamera: camera.shake = 16 oraz hitstop na 2 klatki
  if (typeof camera !== 'undefined' && camera) {
    camera.shake = 16;
    if (typeof camera.shakeImpulse === 'function') {
      camera.shakeImpulse(16, 0.15);
    }
  } else {
    triggerScreenShake(16);
  }
  triggerHitstop(2);

  // 6. Geometry Carving podłoża w promieniu wybuchu
  if (typeof carveGroundHole === 'function') {
    carveGroundHole(expX, expY, 85);
  }
}

