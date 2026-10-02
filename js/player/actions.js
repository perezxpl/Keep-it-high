// =========================================================================
// PLAYER/ACTIONS.JS - AKCJE I MANEWRY SPECJALNE ZAWODNIKA
// Obsługa skoków, wślizgów, ładowania wykopu oraz trajektorii kopnięć.
// =========================================================================

import { CONFIG, KICK_CONFIG, isTouchDevice } from '../config.js';
import { ease, lerp } from './ik.js';
import { triggerScreenShake, spawnJetpackSparks, spawnBloodSpurt, triggerHitstop, camera, carveGroundHole } from '../world.js';
import { spawnAeroSuperGrenade } from '../projectiles.js';
import {
  spawnShockwaveRing,
  spawnExplosionFirePuff,
  spawnStretchedSparks,
  spawnHeavySmokePuff,
  spawnJuiceExplosion
} from '../particles.js';

export function startJumpCharge(p) {
  if (p.isIntro || p.isJumping || p.isSliding || p.staggerTimer > 0) return;
  p.isJumpCharging = true;
  p.jumpChargePower = 0;
}

export function playerJump(p) {
  startJumpCharge(p);
}

export function executeReleaseJump(spawnGrass, p) {
  if (!p.isJumpCharging) return;
  p.isJumpCharging = false;
  if (p.isJumping || p.isSliding || p.isIntro) return;

  const baseJumpForce = p.currentClass?.stats?.jumpForce || CONFIG.JUMP_FORCE;
  const jumpImpulse = (baseJumpForce * 0.67) + (p.jumpChargePower * 4.2);
  p.vy = -jumpImpulse;
  p.isJumping = true;
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

  p.currentClass?.onJump?.(p, grassFn);
}

export function playerSlide(spawnGrass, GROUND_Y, p) {
  let char = p;
  let grassFn = spawnGrass;
  let groundYVal = GROUND_Y;
  if (spawnGrass && typeof spawnGrass.vx === 'number') {
    char = spawnGrass;
    grassFn = GROUND_Y;
    groundYVal = p;
  }
  if (!char) return false;

  const isMovingBackwards = (char.vx * char.facing < -0.1);
  if (isMovingBackwards) return false;
  if (char.isIntro || char.isDead) return false;

  const isGrounded = (char.onGround !== undefined) ? (char.onGround && !char.isJumping) : (!char.isJumping);

  const minSpeed = CONFIG.MIN_RUN_SPEED || 2.5;
  const speedOk = Math.abs(char.vx) > minSpeed;
  const cooldownOk = (!char.slideCooldown || char.slideCooldown <= 0);

  // Warunek konieczny: Wślizg może wykonać się TYLKO WTEDY, GDY POSTAĆ BIEGNIE (|vx| > MIN_RUN_SPEED).
  // Jeśli gracz stoi w miejscu i wciśnięty jest Shift, wślizg nie aktywuje się (brak przejścia w kucanie).
  if (!isGrounded || !speedOk || !cooldownOk) {
    return false;
  }

  if (!char.isJumping && !char.isSliding) {
    char.isSliding = true;
    char.state = 'SLIDE';
    char.slideTimer = 56;
    char.slideCooldown = 300;
    char.sprintDuration = 0;
    char.isCrouching = false;
    char.isProne = false;
    char.isJumpCharging = false;

    const slideDash = char.currentClass?.stats?.slideDashSpeed || CONFIG.SLIDE_DASH_SPEED || 13.5;
    char.vx = char.facing * slideDash;

    const currentFloor = char.currentGroundY || groundYVal;
    const finalGrassFn = grassFn || char._spawnGrass;
    if (finalGrassFn && currentFloor) {
      for (let i = 0; i < 8; i++) finalGrassFn(char.x + char.w / 2 + (char.facing * 15), currentFloor, char.facing);
    }

    char.currentClass?.onSlide?.(char, finalGrassFn);
    return true;
  }
  return false;
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
  const pwr = (p.chargePower !== undefined && p.chargePower > 0) ? p.chargePower : 1.0;
  p.isCharging = false;
  p.kickPower = pwr;
  p.chargePower = pwr;
  p.kickMode = 'SPARTAN';
  p.kickLeg = p.nextLeg || 'front';
  p.kickState = 'SWING';
  p.spartanTimer = 0;
  p.spartanDuration = 22;
  p.hitThisSwing = false;
  p.kickBufferTimer = 22;
  p.spartanTarget = meleeTarget || null;
  p.nextLeg = (p.kickLeg === 'front') ? 'back' : 'front';
  return 'SPARTAN';
}

export function startKickCharge(p, targets) {
  if (!p || p.isSliding || p.staggerTimer > 0) return;
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
  const isActivelySwinging = p.kickState === 'SWING' ||
    p.kickMode === 'SCISSOR' ||
    p.kickMode === 'SPIN_VOLLEY' ||
    p.kickMode === 'SPARTAN' ||
    p.kickMode === 'BACKFLIP';

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

/**
 * Ewaluacja zasięgu i timingu kontaktu z piłką z tolerancją dla dotyku i biegu.
 */
export function evaluateKickTiming(playerObj, ballObj) {
  const b = ballObj || playerObj._ball;
  if (!b) return 'CANCEL';

  const footPos = getKickingFootPos(playerObj);
  const footX = footPos.x;
  const footY = footPos.y;

  const dx = b.x - footX;
  const dy = b.y - footY;

  // Tolerancja wysokości: redukcja kary pionowej, gdy uniesiona stopa mija piłkę przy ziemi
  const dyEff = (dy > 0) ? dy * 0.65 : dy;
  const distNow = Math.hypot(dx, dyEff);

  // Dodatkowy margines prędkości oraz dedykowany bufor dotykowy
  const curSpeed = Math.abs(playerObj.vx || 0);
  const speedMargin = Math.min(28, curSpeed * 2.8);
  const touchBonus = isTouchDevice ? 18 : 6;

  const footRadius = 18 + touchBonus;
  const ballRadius = b.radius || b.colRadius || 12;
  const hitReach = footRadius + ballRadius + speedMargin;
  const whiffReach = hitReach + (isTouchDevice ? 34 : 26);

  if (distNow <= hitReach) return 'HIT';
  if (distNow <= whiffReach) return 'WHIFF';

  const relVx = (b.vx || 0) - playerObj.vx;
  const relVy = (b.vy || 0) - playerObj.vy;
  const vSq = relVx * relVx + relVy * relVy;

  if (vSq < 4.0) return 'CANCEL';

  const dot = dx * relVx + dy * relVy;
  if (dot >= 0) return 'CANCEL';

  const tImpact = -dot / vSq;
  const closestX = dx + relVx * tImpact;
  const closestY = dy + relVy * tImpact;
  const closestDist = Math.hypot(closestX, (closestY > 0 ? closestY * 0.65 : closestY));

  const willIntersect = closestDist <= (hitReach + (isTouchDevice ? 16 : 12));

  if (willIntersect) {
    if (tImpact <= (isTouchDevice ? 8.0 : 6.0)) return 'HIT';
    if (tImpact <= 14.0) return 'WHIFF';
  }

  return 'CANCEL';
}

export function isBallInKickReach(playerObj, ballObj) {
  return evaluateKickTiming(playerObj, ballObj) !== 'CANCEL';
}

export function executeReleaseKick(ballParam, p, comboFlipWindowUntil = 0, targets) {
  if (!p || p.staggerTimer > 0) return null;

  if (!p.isCharging && !p.isIntro) return null;
  if (p.kickState !== 'IDLE' || p.kickCooldown > 0) {
    p.isCharging = false;
    return null;
  }

  // Spartan Kick aktywuje się przy pełnym naładowaniu i przeciwniku w zwarciu
  const isFullyChargedForSpartan = (p.chargePower || 0) >= 0.95;
  const meleeTarget = isFullyChargedForSpartan ? findMeleeTarget(p, targets) : null;
  if (isFullyChargedForSpartan && meleeTarget && !meleeTarget.isDead) {
    return triggerSpartanKick(p, meleeTarget);
  }

  const ball = ballParam || p._ball;
  const timing = evaluateKickTiming(p, ball);

  const hipY = p.y + p.h - 40;
  const isWaistHeight = ball && (ball.y >= hipY - 20 && ball.y <= hipY + 22);
  const isFullyCharged = p.chargePower >= 0.92;

  if (isWaistHeight && isFullyCharged && timing === 'HIT') {
    p.isCharging = false;
    p.kickPower = p.chargePower;
    p.kickMode = 'SPIN_VOLLEY';
    p.swingSpeed = 0.22;
    p.spinVolleyTimer = 0;
    p.spinVolleyDuration = 24;
    p.kickState = 'SWING';
    p.hitThisSwing = false;
    p.kickBufferTimer = 24;
    return 'SPIN_VOLLEY';
  }

  p.isCharging = false;
  p.kickPower = p.chargePower;

  const currentFloor = p.currentGroundY || p.groundY;
  const isAirborne = p.isJumping || (currentFloor > 0 && p.y < currentFloor - p.h - 4);

  if (isAirborne && !p.isIntro) {
    const now = performance.now();
    const isComboActive = (now <= comboFlipWindowUntil);

    if (isComboActive) {
      p.kickMode = 'BACKFLIP';
      p.bicycleTimer = 0;
      p.bicycleDuration = 30;
      p.landingTurnTimer = 0;
      p.kickState = 'SWING';
      p.hitThisSwing = false;
      p.kickBufferTimer = 24;
      p.facing = -1;
      p.vy = Math.min(p.vy, -3.2);
      return 'BACKFLIP';
    } else {
      p.kickMode = 'SCISSOR';
      p.scissorTimer = 0;
      p.scissorDuration = 22;
      p.kickState = 'SWING';
      p.hitThisSwing = false;
      p.kickBufferTimer = 16;
      return 'SCISSOR';
    }
  } else {
    p.kickMode = 'GROUND';
    p.kickLeg = p.nextLeg;
    p.kickState = 'SWING';
    p.hitThisSwing = false;
    p.kickAngle = 0;
    p.kickBufferTimer = 16;

    const curSpeed = Math.abs(p.vx);
    const sprintMax = p.currentClass?.stats?.sprintMax || CONFIG.SPRINT_MAX;
    const speedRatio = Math.min(1.0, curSpeed / sprintMax);
    p.swingSpeed = (0.18 + p.chargePower * 0.14) * (1.0 + speedRatio * 0.95);
    p.kickRecoverSpeed = (0.14 + p.chargePower * 0.06) * (1.0 + speedRatio * 0.85);

    const hipX = p.x + p.w / 2;
    const plantLead = curSpeed > 1.0 ? (10 + speedRatio * 8) : 4;
    p.kickPlantWorldX = hipX + (plantLead * p.facing);

    p.nextLeg = (p.kickLeg === 'front') ? 'back' : 'front';
    return 'GROUND';
  }
}

/**
 * Odległość punktu (px, py) od odcinka (x1, y1) - (x2, y2)
 */
function distPointToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

/**
 * Oblicza spadek siły w zależności od odległości od stopy gracza
 */
function getDistanceFalloff(tx, ty, footX, footY, maxReach) {
  const distFromFoot = Math.hypot(tx - footX, ty - footY);
  const sweetSpotRadius = 24;
  if (distFromFoot <= sweetSpotRadius) return 1.0;
  const reachSpan = Math.max(1, maxReach - sweetSpotRadius);
  const t = Math.min(1.0, (distFromFoot - sweetSpotRadius) / reachSpan);
  return Math.max(0.70, 1.0 - t * 0.30);
}

/**
 * Interakcja kinetyczna kopnięcia z otoczeniem (piłka, przeciwnicy, beczki wybuchowe)
 */
export function applyKickInteractions(player, ball, targets, obstacles, groundY = 500, spawnGrass) {
  if (!player || player.isDead || player.hitThisSwing) return false;

  const hipX = player.x + player.w / 2;
  const hipY = player.y + player.h - 40 + (player.pelvisY || 0);

  const footPos = getKickingFootPos(player);
  const footX = footPos.x;
  const footY = footPos.y;

  const kickReach = (player.currentClass?.stats?.hitReach || 56) + 24;

  const kickDirX = (typeof player.kickDirX === 'number' && !isNaN(player.kickDirX)) ? player.kickDirX : player.facing;
  const kickDirY = (typeof player.kickDirY === 'number' && !isNaN(player.kickDirY)) ? player.kickDirY : -0.35;

  const classStats = player.classConfig?.stats || player.class?.stats || player.currentClass?.stats || {};
  const kickForceMultiplier = (typeof player.kickForceMultiplier === 'number')
    ? player.kickForceMultiplier
    : (classStats.kickForce ?? classStats.kickForceMultiplier ?? classStats.kickPowerMult ?? 1.0);

  const knockbackMultiplier = (typeof player.knockbackMultiplier === 'number')
    ? player.knockbackMultiplier
    : (classStats.knockback ?? classStats.knockbackMultiplier ?? 1.0);

  const BASE_KICK_FORCE = CONFIG.BASE_KICK_FORCE || 19.5;
  const BASE_KNOCKBACK = CONFIG.BASE_KNOCKBACK || 10.5;
  const BASE_BARREL_IMPULSE = CONFIG.BASE_BARREL_IMPULSE || 9.5;

  let didHitAnything = false;

  // 1. Interakcja z piłką
  const activeBall = ball || player._ball;
  if (activeBall) {
    const curSpeed = Math.abs(player.vx || 0);
    const speedMargin = Math.min(28, curSpeed * 2.8);
    const touchBonus = isTouchDevice ? 18 : 6;

    const footRadius = 18 + touchBonus + speedMargin;
    const ballRadius = activeBall.colRadius || activeBall.radius || 12;

    const dx = activeBall.x - footX;
    const dy = activeBall.y - footY;

    // Kompensacja uniesionej stopy w fazie wymachu nad murawą
    const dyEff = (dy > 0) ? dy * 0.65 : dy;
    const distBall = Math.hypot(dx, dyEff);

    if (distBall <= (footRadius + ballRadius)) {
      const bdx = (typeof player.aimX === 'number') ? (player.aimX - activeBall.x) : (kickDirX * 100);
      const bdy = (typeof player.aimY === 'number') ? (player.aimY - activeBall.y) : (kickDirY * 100);
      const angle = Math.atan2(bdy, bdx);
      const bnx = Math.cos(angle);
      const bny = Math.sin(angle);

      const pwr = (player.kickPower !== undefined && player.kickPower !== null) ? player.kickPower : 0.70;
      const powerFactor = 0.85 + pwr * 0.22;
      const falloff = getDistanceFalloff(activeBall.x, activeBall.y, footX, footY, footRadius + ballRadius + 10);

      const finalForce = BASE_KICK_FORCE * kickForceMultiplier * powerFactor * falloff;

      activeBall.vx = Math.cos(angle) * finalForce + (player.vx * 0.35);
      activeBall.vy = Math.sin(angle) * finalForce;
      activeBall.spin = (activeBall.vx > 0 ? 1 : -1) * (0.65 * (classStats.spinMult || 1.0));
      activeBall.trail = [];
      activeBall.lowGravityFrames = player.kickMode === 'SPIN_VOLLEY' ? 18 : 0;

      player.hitThisSwing = true;
      player.kickBufferTimer = 0;
      const grassFn = spawnGrass || player._spawnGrass;
      if (grassFn) grassFn(activeBall.x, activeBall.y, player.facing);
      triggerScreenShake(5);
      player.currentClass?.onKick?.(player, activeBall, { nx: bnx, ny: bny, baseSpeed: finalForce });
      didHitAnything = true;
    }
  }

  // 2. Interakcja z przeciwnikami
  const activeTargets = targets || player._targets;
  if (activeTargets) {
    const targetList = Array.isArray(activeTargets) ? activeTargets : [activeTargets];
    for (const enemy of targetList) {
      if (!enemy || enemy === player || enemy.isDead) continue;
      const ex = enemy.x + (enemy.w || 24) / 2;
      const ey = enemy.y + (enemy.h || 70) / 2;

      const distEnemy = distPointToSegment(ex, ey, hipX, hipY, footX, footY);
      const dxToEnemy = ex - hipX;
      const isAhead = (dxToEnemy * player.facing) >= -20;

      if (distEnemy <= kickReach + 18 && isAhead) {
        const pwr = player.kickPower || 0.70;
        const falloff = getDistanceFalloff(ex, ey, footX, footY, kickReach);
        const finalKnockback = BASE_KNOCKBACK * knockbackMultiplier * (0.80 + pwr * 0.30) * falloff;

        enemy.vx = kickDirX * finalKnockback;
        enemy.vy = Math.min(-2.8, kickDirY * finalKnockback * 0.85);
        enemy.isJumping = true;
        enemy.staggerTimer = classStats.spartanStagger || 22;

        const baseDmg = classStats.spartanDamage || 12;
        const dmg = Math.round(baseDmg * (knockbackMultiplier >= 1.5 ? 1.25 : 1.0) + pwr * 6);
        enemy.hp = Math.max(0, (enemy.hp !== undefined ? enemy.hp : 100) - dmg);

        player.hitThisSwing = true;
        triggerScreenShake(6);
        spawnJetpackSparks(ex, ey, player.facing, 5);
        spawnBloodSpurt(ex, ey, kickDirX, kickDirY, 7, 0.9);

        if (enemy.hp <= 0 && !enemy.isDead) {
          enemy.isDead = true;
          enemy.respawnTimer = 180;
          enemy.corpseAngle = 0;
          enemy.corpseFloorY = groundY;
          enemy.vx = kickDirX * (finalKnockback * 1.15);
          enemy.vy = -4.8;
        }
        didHitAnything = true;
      }
    }
  }

  // 3. Interakcja z przeszkodami (beczki)
  if (obstacles && Array.isArray(obstacles)) {
    for (const obs of obstacles) {
      if (!obs || obs.exploded) continue;
      if (obs.type === 'explosive_barrel') {
        const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
        const ocx = obs.x + obs.w / 2;
        const ocy = topY + obs.h / 2;

        const distObs = distPointToSegment(ocx, ocy, hipX, hipY, footX, footY);
        if (distObs <= kickReach + 16) {
          const falloff = getDistanceFalloff(ocx, ocy, footX, footY, kickReach);
          const finalBarrelForce = BASE_BARREL_IMPULSE * knockbackMultiplier * falloff;

          obs.y = topY;
          obs.vx = kickDirX * finalBarrelForce;
          obs.vy = Math.min(-3.2, kickDirY * finalBarrelForce * 0.85);
          obs.kickedBy = player;
          obs.kicked = true;
          player.hitThisSwing = true;
          triggerScreenShake(6);
          spawnJetpackSparks(ocx, ocy, player.facing, 4);
          didHitAnything = true;
        }
      }
    }
  }

  return didHitAnything;
}

/**
 * Natychmiastowe wykonanie akcji kopnięcia (Kick) postaci
 */
export function performKick(p, options = {}) {
  if (!p || p.isDead || p.isSliding || p.isIntro || p.staggerTimer > 0) return false;
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
  p.hitThisSwing = false;
  p.kickBufferTimer = 16;

  const classCooldownSec = p.kickCooldownTime ?? p.currentClass?.stats?.kickCooldown ?? p.classConfig?.stats?.kickCooldown ?? 0.50;
  const defaultCooldownFrames = Math.round(classCooldownSec * 60);
  p.kickCooldown = (typeof options.cooldown === 'number') ? options.cooldown : defaultCooldownFrames;

  const currentFloor = p.currentGroundY || p.groundY || 500;
  const isAirborne = p.isJumping || (currentFloor > 0 && p.y < currentFloor - p.h - 4);

  const targets = options.targets || p._targets;
  const isFullyChargedForSpartan = (p.chargePower || 0) >= 0.95;
  const meleeTarget = isFullyChargedForSpartan ? findMeleeTarget(p, targets) : null;

  if (isAirborne) {
    p.kickMode = 'SCISSOR';
    p.scissorTimer = 0;
    p.scissorDuration = 22;
    p.kickState = 'SWING';
  } else if (isFullyChargedForSpartan && meleeTarget && !meleeTarget.isDead) {
    triggerSpartanKick(p, meleeTarget);
  } else {
    p.kickMode = 'GROUND';
    p.kickLeg = p.nextLeg || 'front';
    p.kickState = 'SWING';
    p.kickAngle = 0;
    p.swingSpeed = 0.24;
    p.kickRecoverSpeed = 0.18;
    p.nextLeg = (p.kickLeg === 'front') ? 'back' : 'front';
  }

  const footInit = getKickingFootPos(p);
  p.kickingFootX = footInit.x;
  p.kickingFootY = footInit.y;

  applyKickInteractions(p, options.ball || p._ball, targets, options.obstacles, currentFloor, options.spawnGrass);

  return p.kickMode;
}

export const kick = performKick;

export function getGroundKickTrajectory(phase, angle, power, hipX, hipY, floorY, facing, speed, plantWorldX) {
  let kickFootX, kickFootY, kickAnkle;
  let supportFootX, supportFootY, supportAnkle;

  const speedRatio = Math.min(1.0, speed / CONFIG.SPRINT_MAX);
  const plantFloorY = floorY - 3.5;

  if (speed > 0.8 && plantWorldX) {
    supportFootX = plantWorldX;
    const hipPastPlant = (hipX - plantWorldX) * facing;

    if (hipPastPlant < 24) {
      supportFootY = plantFloorY;
      supportAnkle = 0.0;
    } else {
      const toeProgress = Math.min(1.0, (hipPastPlant - 24) / 18);
      const toePinLift = Math.sin(toeProgress * 0.45) * 6.0;
      supportFootY = plantFloorY - toePinLift;
      supportAnkle = (toeProgress * 0.45) * facing;
    }
  } else {
    supportFootX = hipX - 6.0 * facing;
    supportFootY = plantFloorY;
    supportAnkle = 0.0;
  }

  if (phase === 'CHARGE') {
    const p = ease(power);
    const sprintForwardOffset = speedRatio * 16.0;
    kickFootX = hipX + (6.0 + p * 4.0 + sprintForwardOffset) * facing;
    kickFootY = plantFloorY;
    kickAnkle = 0.0;
  } else if (phase === 'SWING') {
    const u = Math.min(1.0, angle / 2.1);

    if (u < 0.35) {
      const w = ease(u / 0.35);
      const startX = 6.0 + speedRatio * 8.0;
      const startY = plantFloorY - hipY;
      const strikeX = 36 + speedRatio * 16 + power * 10;
      const strikeY = 36 - power * 6;

      kickFootX = hipX + lerp(startX, strikeX, w) * facing;
      kickFootY = hipY + lerp(startY, strikeY, w);
      kickAnkle = lerp(0.0, 0.45, w) * facing;
    } else if (u < 0.75) {
      const w = ease((u - 0.35) / 0.40);
      const strikeX = 36 + speedRatio * 16 + power * 10;
      const strikeY = 36 - power * 6;
      const peakX = strikeX + 10 + speedRatio * 8;
      const peakY = lerp(strikeY, 14 - power * 16, w);

      kickFootX = hipX + lerp(strikeX, peakX, w) * facing;
      kickFootY = hipY + peakY;
      kickAnkle = lerp(0.45, -0.25, w) * facing;
    } else {
      const w = ease((u - 0.75) / 0.25);
      const strikeX = 36 + speedRatio * 16 + power * 10;
      const peakX = strikeX + 10 + speedRatio * 8;
      const peakY = 14 - power * 16;
      const targetLandingX = 14 + speedRatio * 8;
      const targetLandingY = plantFloorY - hipY;

      kickFootX = hipX + lerp(peakX, targetLandingX, w) * facing;
      kickFootY = hipY + lerp(peakY, targetLandingY, w);
      kickAnkle = lerp(-0.25, 0.10, w) * facing;
    }
  } else {
    // Faza RECOVER
    const u = Math.max(0, Math.min(1.0, angle / 2.1));
    const w = ease(u);
    const peakX = 46 + speedRatio * 22 + power * 10;
    const peakY = 14 - power * 16;

    const targetLandingX = 14 + speedRatio * 8;
    const targetLandingY = plantFloorY - hipY;

    kickFootX = hipX + lerp(targetLandingX, peakX, w) * facing;
    kickFootY = hipY + lerp(targetLandingY, peakY, w);
    kickAnkle = lerp(0.05, 0.15, w) * facing;
  }

  return {
    kicking: { x: kickFootX, y: kickFootY, ankle: kickAnkle },
    support: { x: supportFootX, y: supportFootY, ankle: supportAnkle }
  };
}

export function getScissorLegTargets(timer, duration, hipX, hipY, facing, power = 0) {
  const u = Math.min(1.0, timer / duration);
  const R = 41.5;

  const strikePeakAngle = 0.75 + (power * 0.90);
  const backCounterAngle = -0.55 - (power * 0.25);

  let angBack, angFront, ankleBack, ankleFront;

  if (u < 0.32) {
    const w = ease(u / 0.32);
    angBack = lerp(-0.30, 0.65, w);
    angFront = lerp(0.20, -0.55, w);
    ankleBack = lerp(-0.18, 0.35, w) * facing;
    ankleFront = lerp(0.22, -0.40, w) * facing;
  } else if (u < 0.75) {
    const w = ease((u - 0.32) / 0.43);
    angBack = lerp(0.65, backCounterAngle, w);
    angFront = lerp(-0.55, strikePeakAngle, w);
    ankleBack = lerp(0.35, -0.08, w) * facing;
    ankleFront = lerp(-0.40, 0.10, w) * facing;
  } else {
    const w = ease((u - 0.75) / 0.25);
    angBack = lerp(backCounterAngle, -0.20, w);
    angFront = lerp(strikePeakAngle, 0.25, w);
    ankleBack = lerp(-0.08, 0.0, w) * facing;
    ankleFront = lerp(0.10, 0.05, w) * facing;
  }

  const frontX = hipX + (R * Math.sin(angFront)) * facing;
  const frontY = hipY + (R * Math.cos(angFront));
  const backX = hipX + (R * Math.sin(angBack)) * facing;
  const backY = hipY + (R * Math.cos(angBack));

  return {
    front: { x: frontX, y: frontY, ankle: ankleFront },
    back: { x: backX, y: backY, ankle: ankleBack }
  };
}

export function getBackflipTargets(timer, duration, hipX, hipY, facing) {
  const u = Math.min(1.0, timer / duration);
  const flipAngle = u * Math.PI * 2;

  let rKick, rGuide, kickAngOffset, guideAngOffset;

  if (u < 0.28) {
    const w = ease(u / 0.28);
    rKick = lerp(40, 20, w);
    rGuide = lerp(40, 18, w);
    kickAngOffset = 0.22;
    guideAngOffset = 0.42;
  } else if (u < 0.68) {
    const w = Math.sin(((u - 0.28) / 0.40) * Math.PI);
    rKick = lerp(20, 48, w);
    rGuide = 18;
    kickAngOffset = lerp(0.22, -0.65, w);
    guideAngOffset = 0.42;
  } else {
    const w = ease((u - 0.68) / 0.32);
    rKick = lerp(20, 42, w);
    rGuide = lerp(18, 42, w);
    kickAngOffset = lerp(0.22, 0.05, w);
    guideAngOffset = 0.42;
  }

  const totKick = flipAngle + kickAngOffset;
  const totGuide = flipAngle + guideAngOffset;

  const kx = hipX + (rKick * Math.sin(totKick)) * facing;
  const ky = hipY + (rKick * Math.cos(totKick));
  const gx = hipX + (rGuide * Math.sin(totGuide)) * facing;
  const gy = hipY + (rGuide * Math.cos(totGuide));

  return {
    rotation: flipAngle,
    kicking: { x: kx, y: ky, ankle: 0.35 * facing },
    guide: { x: gx, y: gy, ankle: -0.18 * facing }
  };
}

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

  const activeTargets = targets || player._targets;
  const enemy = player.spartanTarget || findMeleeTarget(player, activeTargets);

  if (enemy && !enemy.isDead) {
    const ex = enemy.x + (enemy.w || 24) / 2;
    const ey = enemy.y + (enemy.h || 70) * 0.45;

    triggerHitstop(4);
    triggerScreenShake(14);
    spawnJetpackSparks(ex, ey, player.facing, 9);
    spawnBloodSpurt(ex + (player.facing * 8), ey, player.facing, -0.2, 10, 1.2);

    const dmg = 11;
    enemy.hp = Math.max(0, (enemy.hp !== undefined ? enemy.hp : 100) - dmg);

    // 5. Fizyka celu: potężny knockback i 2 sekundy ogłuszenia (120 klatek przy 60 FPS)
    enemy.facing = -player.facing;
    enemy.vx = player.facing * 16.5;
    enemy.airVx = enemy.vx;
    enemy.vy = -4.5;
    enemy.isJumping = true;
    enemy.onGround = false;
    enemy.staggerTimer = 120;
    enemy.staggerLanded = false;
    enemy.staggerRecoveryTimer = 0;
    enemy.isCharging = false;
    enemy.isShooting = false;
    enemy.isSliding = false;
    enemy.isCrouching = false;
    enemy.crouchToggled = false;
    enemy.isProne = false;

    if (enemy.hp <= 0 && !enemy.isDead) {
      enemy.isDead = true;
      enemy.respawnTimer = 180;
      enemy.corpseAngle = 0;
      enemy.corpseFloorY = groundY;
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

  return false;
}

export function getProneIKTargets(crawlPhase, isCrawling, hipX, plantFloorY, facing) {
  if (isCrawling) {
    const legStride = Math.sin(crawlPhase) * 8;
    return {
      front: {
        x: hipX - (44 + legStride) * facing,
        y: plantFloorY,
        ankle: 0.05 * facing
      },
      back: {
        x: hipX - (44 - legStride) * facing,
        y: plantFloorY,
        ankle: -0.05 * facing
      },
      frontArm: {
        swing: 0.85 + Math.cos(crawlPhase) * 0.35,
        elbow: 1.40
      },
      backArm: {
        swing: 0.85 - Math.cos(crawlPhase) * 0.35,
        elbow: 1.40
      }
    };
  }

  return {
    front: {
      x: hipX - 44 * facing,
      y: plantFloorY,
      ankle: 0.0
    },
    back: {
      x: hipX - 46 * facing,
      y: plantFloorY,
      ankle: 0.0
    },
    frontArm: {
      swing: 0.70,
      elbow: 1.30
    },
    backArm: {
      swing: 0.65,
      elbow: 1.25
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
export function throwTacticalGrenade(p, targetX = null, targetY = null) {
  if (!p || p.isDead || p.isIntro) return false;

  // Sprawdzenie 10-sekundowego czasu odnowienia (cooldown)
  if (p.grenadeCooldown !== undefined && p.grenadeCooldown > 0) {
    return false;
  }

  // Ustalenie pozycji celu (kursor myszy lub kierunek zwrotu)
  const aimX = (targetX !== null && targetX !== undefined) ? targetX : (p.aimX !== undefined ? p.aimX : (p.x + (p.facing || 1) * 300));
  const aimY = (targetY !== null && targetY !== undefined) ? targetY : (p.aimY !== undefined ? p.aimY : (p.y - 40));

  // Wystrzelenie pocisku granatu niszczącego teren
  const grenade = spawnAeroSuperGrenade(p, aimX, aimY);

  // Natychmiastowe nałożenie 10-sekundowego cooldownu
  p.grenadeMaxCooldown = p.grenadeMaxCooldown || 10.0;
  p.grenadeCooldown = p.grenadeMaxCooldown;

  // Wizualny odrzut i wstrząs kamery przy rzucie
  p.recoilAnim = 8;
  triggerScreenShake(2.5);

  return grenade;
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

