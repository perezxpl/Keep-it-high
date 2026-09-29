// =========================================================================
// WEAPONS.JS - SYSTEM BRONI, BALISTYKI I KINEMATYKI STRZELECKIEJ (SOLDAT STYLE)
// =========================================================================

import {
  triggerScreenShake, GROUND_Y, triggerHitstop,
  spawnHeadGib, spawnBloodSpurt, spawnBloodFountain, spawnDroppedWeapon
} from './world.js';
import { checkRayObstacleCollision, obstacles } from './obstacles.js';

export const WEAPONS = {
  AK47: {
    id: 'AK47',
    name: 'AK-47',
    auto: true,           // Ciągły ogień przy trzymaniu LPM / drążka
    fireRate: 6,          // Strzał co 6 klatek (~10 strz./s przy 60 FPS)
    damage: 13,
    bulletSpeed: 25,
    spread: 0.042,        // Bazowy rozrzut w radianach
    crouchSpreadMult: 0.55, // Redukcja rozrzutu w kucaniu (-45%)
    recoil: 0.65,         // Siła odrzutu wizualnego
    crouchRecoilMult: 0.45,
    muzzleRise: 0.045,    // Podrzut lufy w górę na strzał (rad)
    kickbackDistance: 2.8,// Cofnięcie samej broni w tył (px)
    ballPush: 0.18,       // Pchnięcie piłki
    pellets: 1,
    bulletColor: '#facc15'
  },
  SHOTGUN: {
    id: 'SHOTGUN',
    name: 'SHOTGUN',
    auto: false,          // Semi-auto
    fireRate: 35,         // Odstęp między wystrzałami
    damage: 9,            // Obrażenia na pojedynczy śrut
    bulletSpeed: 21,
    spread: 0.165,        // Stożek śrutu
    crouchSpreadMult: 0.65,
    recoil: 2.5,          // Silny odrzut wizualny
    crouchRecoilMult: 0.42,
    muzzleRise: 0.185,    // Skok lufy ku górze (rad)
    kickbackDistance: 5.8,// Silne cofnięcie broni ku barkowi
    ballPush: 0.38,
    pellets: 6,
    bulletColor: '#fb923c'
  }
};

export const bullets = [];
export const bulletParticles = [];

export function spawnBulletSparks(x, y, color = '#facc15', count = 4) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = Math.random() * 3.5 + 1.0;
    bulletParticles.push({
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 1.0,
      size: Math.random() * 2 + 1.2,
      color,
      life: 1.0
    });
  }
}

export function spawnHitSparks(x, y, nx = 0, ny = -1, count = 4) {
  const baseAngle = Math.atan2(ny, nx);
  for (let i = 0; i < count; i++) {
    const spread = (Math.random() - 0.5) * (Math.PI * 0.7);
    const angle = baseAngle + spread;
    const speed = Math.random() * 4.0 + 1.5;
    bulletParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 2.2 + 1.2,
      color: Math.random() < 0.6 ? '#facc15' : '#fb923c',
      life: 0.8 + Math.random() * 0.4
    });
  }
}

function lerpAngle(a, b, t) {
  let diff = (b - a) % (Math.PI * 2);
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > Math.PI) diff -= Math.PI * 2;
  return a + diff * t;
}

/**
 * Obliczenie pozycji anatomicznych barków strzelca (z uwzględnieniem praworęczności)
 */
export function getShooterShoulderPos(shooter) {
  const charFacing = shooter.facing || 1;
  const hipX = shooter.x + shooter.w / 2;
  const hipY = shooter.y + shooter.h - 40 + (shooter.pelvisY || 0);
  const torsoTilt = shooter.pose?.torsoTilt || shooter.torsoTilt || 0;

  const shoulderBaseX = hipX + (21 * Math.sin(torsoTilt));
  const shoulderBaseY = hipY - (21 * Math.cos(torsoTilt));

  const yaw = shooter.yaw || 0;
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);

  const shOffsetHoriz = (cosYaw * 1.4) - (sinYaw * 4.5);
  const shoulderTilt = shooter.pose?.shoulderTilt || 0;

  const rightShoulderX = shoulderBaseX + shOffsetHoriz;
  const rightShoulderY = shoulderBaseY - (shoulderTilt * 4 * cosYaw);

  const leftShoulderX = shoulderBaseX - shOffsetHoriz;
  const leftShoulderY = shoulderBaseY + (shoulderTilt * 4 * cosYaw);

  return {
    rightShoulderX,
    rightShoulderY,
    leftShoulderX,
    leftShoulderY,
    shoulderX: rightShoulderX,
    shoulderY: rightShoulderY,
    hipX,
    hipY,
    charFacing
  };
}

/**
 * Wyliczenie transformacji broni i wektorów podparcia dłoni dla praworęcznego strzelca
 */
export function getWeaponHoldTransform(p) {
  const charFacing = p.facing || 1;
  const { rightShoulderX, rightShoulderY, hipX, hipY } = getShooterShoulderPos(p);
  const weapon = p.currentWeapon || WEAPONS.AK47;
  const isShotgun = (weapon.id === 'SHOTGUN');
  const isCrouch = !!p.isCrouching;

  const aimX = (typeof p.aimX === 'number' && !isNaN(p.aimX)) ? p.aimX : (rightShoulderX + charFacing * 120);
  const aimY = (typeof p.aimY === 'number' && !isNaN(p.aimY)) ? p.aimY : rightShoulderY;

  // STAN 1: Luźne trzymanie (Low-Ready / Patrol Carry)
  const headBobOffset = (p.headBob || 0) * 0.35;
  const crouchDropY = isCrouch ? 4 : 0;
  const loosePivotX = hipX + (isShotgun ? 5 : 7) * charFacing;
  const loosePivotY = hipY - (isShotgun ? 10 : 13) + headBobOffset + crouchDropY;

  const directAngle = Math.atan2(aimY - loosePivotY, (aimX - loosePivotX) * charFacing);
  const idleDroop = isShotgun ? 0.40 : 0.26;
  const looseAimAngle = directAngle + idleDroop;

  // STAN 2: Prowadzenie ognia (Shoulder-Braced / Combat Stance)
  const muscleMult = p.currentClass?.visuals?.muscleMult || 1.0;
  const braceForward = (isShotgun ? 4.0 : 3.5) + (muscleMult - 1.0) * 3.5;
  const braceOffsetY = isCrouch ? 1.5 : 0;
  const shoulderPocketX = rightShoulderX + braceForward * charFacing;
  const shoulderPocketY = rightShoulderY + braceOffsetY;

  const stockLen = isShotgun ? 13.0 : 12.5;

  const muzzleRise = (p.muzzleRise || 0) * (isCrouch ? 0.55 : 1.0);
  const shoulderAimAngle = Math.atan2(aimY - shoulderPocketY, (aimX - shoulderPocketX) * charFacing) - muzzleRise;

  const shoulderPivotX = shoulderPocketX + Math.cos(shoulderAimAngle) * stockLen * charFacing;
  const shoulderPivotY = shoulderPocketY + Math.sin(shoulderAimAngle) * stockLen;

  const w = (typeof p.shootPoseWeight === 'number') ? p.shootPoseWeight : 0.0;
  const rawPivotX = loosePivotX + (shoulderPivotX - loosePivotX) * w;
  const rawPivotY = loosePivotY + (shoulderPivotY - loosePivotY) * w;
  const blendedAngle = lerpAngle(looseAimAngle, shoulderAimAngle, w);

  const kickback = p.weaponKickback || 0;
  const finalPivotX = rawPivotX - Math.cos(blendedAngle) * kickback * charFacing;
  const finalPivotY = rawPivotY - Math.sin(blendedAngle) * kickback;

  const cosA = Math.cos(blendedAngle);
  const sinA = Math.sin(blendedAngle);

  // Punkty podparcia dłoni skorygowane do nowego chwytu broni (chwyt pistoletowy i łoże)
  const rearGripDistX = isShotgun ? 1.6 : 1.5;
  const rearGripDistY = isShotgun ? 4.5 : 4.2;
  const rightHandWorldX = finalPivotX + (cosA * rearGripDistX - sinA * rearGripDistY) * charFacing;
  const rightHandWorldY = finalPivotY + (sinA * rearGripDistX + cosA * rearGripDistY);

  const pumpShift = isShotgun ? (p.pumpOffset || 0) : 0;
  const foreGripDistX = (isShotgun ? 16.5 : 17.5) + pumpShift;
  const foreGripDistY = isShotgun ? 2.0 : 1.2;
  const leftHandWorldX = finalPivotX + (cosA * foreGripDistX - sinA * foreGripDistY) * charFacing;
  const leftHandWorldY = finalPivotY + (sinA * foreGripDistX + cosA * foreGripDistY);

  const barrelLength = isShotgun ? 28 : 34;

  return {
    pivotX: finalPivotX,
    pivotY: finalPivotY,
    angle: blendedAngle,
    charFacing,
    rightShoulderX,
    rightShoulderY,
    shoulderPocketX,
    shoulderPocketY,
    aimX,
    aimY,
    weight: w,
    kickback,
    muzzleRise,
    rightHandTarget: { x: rightHandWorldX, y: rightHandWorldY },
    leftHandTarget: { x: leftHandWorldX, y: leftHandWorldY },
    barrelLen: barrelLength
  };
}

/**
 * Obliczenie punktu wylotu pocisków (Muzzle)
 */
export function getMuzzlePosition(shooter, weapon) {
  const hold = getWeaponHoldTransform(shooter);
  const muzzleX = hold.pivotX + Math.cos(hold.angle) * hold.barrelLen * hold.charFacing;
  const muzzleY = hold.pivotY + Math.sin(hold.angle) * hold.barrelLen;

  return {
    muzzleX,
    muzzleY,
    shoulderX: hold.rightShoulderX,
    shoulderY: hold.rightShoulderY,
    aimAngle: hold.angle,
    charFacing: hold.charFacing,
    barrelLen: hold.barrelLen,
    aimX: hold.aimX,
    aimY: hold.aimY,
    gunPivotX: hold.pivotX,
    gunPivotY: hold.pivotY
  };
}

/**
 * Wystrzał z broni – z wyłączonym fizycznym odpychaniem postaci
 */
export function shootWeapon(shooter, weapon) {
  if (!shooter || !weapon || shooter.isDead) return;
  if (shooter.shootCooldown > 0) return;

  const isCrouch = !!shooter.isCrouching;

  if (weapon.id === 'SHOTGUN') {
    shooter.shootPoseTimer = 10;
    shooter.weaponKickback = weapon.kickbackDistance;
    shooter.muzzleRise = (shooter.muzzleRise || 0) + weapon.muzzleRise;
    shooter.pumpTimer = 18;
  } else {
    shooter.shootPoseTimer = weapon.fireRate + 3;
    shooter.weaponKickback = weapon.kickbackDistance;
    shooter.muzzleRise = Math.min(0.24, (shooter.muzzleRise || 0) + weapon.muzzleRise);
  }
  shooter.shootPoseWeight = 1.0;

  const { muzzleX, muzzleY, shoulderX, shoulderY, aimAngle, charFacing, aimX, aimY } = getMuzzlePosition(shooter, weapon);
  const effectiveGroundY = (typeof shooter.groundY === 'number' && shooter.groundY > 0)
    ? shooter.groundY
    : (typeof GROUND_Y === 'number' && GROUND_Y > 0 ? GROUND_Y : 500);

  const wallHit = checkRayObstacleCollision(shoulderX, shoulderY, muzzleX, muzzleY, effectiveGroundY, obstacles);
  if (wallHit) {
    spawnHitSparks(wallHit.x, wallHit.y, wallHit.nx, wallHit.ny, 5);
    shooter.shootCooldown = weapon.fireRate;
    shooter.muzzleFlashTimer = 2;
    if (weapon.recoil > 1.2) triggerScreenShake(2.5);
    return;
  }

  const theta = Math.atan2(aimY - muzzleY, aimX - muzzleX);
  const activeSpread = weapon.spread * (isCrouch ? weapon.crouchSpreadMult : 1.0);

  for (let i = 0; i < weapon.pellets; i++) {
    const dev = (Math.random() * 2 - 1) * activeSpread;
    const angle = theta + dev;
    const speed = weapon.bulletSpeed * (0.96 + Math.random() * 0.08);

    bullets.push({
      x: muzzleX,
      y: muzzleY,
      prevX: muzzleX,
      prevY: muzzleY,
      originX: muzzleX,
      originY: muzzleY,
      weaponId: weapon.id,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: weapon.damage,
      ballPush: weapon.ballPush,
      color: weapon.bulletColor,
      shooter: shooter,
      life: 75
    });
  }

  shooter.shootCooldown = weapon.fireRate;
  shooter.muzzleFlashTimer = 2;

  if (weapon.recoil > 1.5) {
    triggerScreenShake(isCrouch ? 2.4 : 3.8);
  } else {
    triggerScreenShake(1.2);
  }

  spawnBulletSparks(muzzleX + Math.cos(theta) * 6, muzzleY + Math.sin(theta) * 6, weapon.bulletColor, 3);
}

/**
 * Aktualizacja klatkowa stanów broni
 */
export function updateWeaponState(p) {
  if (!p) return;

  if (p.weaponKickback > 0.05) {
    p.weaponKickback *= 0.65;
  } else {
    p.weaponKickback = 0;
  }

  if (p.muzzleRise > 0.005) {
    p.muzzleRise *= 0.72;
  } else {
    p.muzzleRise = 0;
  }

  if (p.pumpTimer > 0) {
    p.pumpTimer--;
    if (p.pumpTimer > 9) {
      p.pumpOffset = -4.2 * ((18 - p.pumpTimer) / 9);
    } else {
      p.pumpOffset = -4.2 * (p.pumpTimer / 9);
    }
  } else {
    p.pumpOffset = 0;
  }
}

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

function getSegmentAABBHitT(x1, y1, x2, y2, left, top, right, bottom) {
  let t0 = 0.0, t1 = 1.0;
  const dx = x2 - x1, dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - left, right - x1, y1 - top, bottom - y1];
  for (let k = 0; k < 4; k++) {
    if (p[k] === 0) {
      if (q[k] < 0) return null;
    } else {
      const t = q[k] / p[k];
      if (p[k] < 0) {
        if (t > t1) return null;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return null;
        if (t < t1) t1 = t;
      }
    }
  }
  if (t0 <= t1) {
    const startInside = (x1 >= left && x1 <= right && y1 >= top && y1 <= bottom);
    return startInside ? 0 : t0;
  }
  return null;
}

/**
 * Aktualizacja pocisków i detekcja dekapitacji / zgonu
 */
export function updateBullets(groundY, obstaclesList, ball, characters) {
  for (let i = bulletParticles.length - 1; i >= 0; i--) {
    const p = bulletParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.22;
    p.life -= 0.055;
    if (p.life <= 0) {
      bulletParticles.splice(i, 1);
    }
  }

  const charList = characters || [];
  const obs = obstaclesList || obstacles;

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.prevX = b.x;
    b.prevY = b.y;
    b.x += b.vx;
    b.y += b.vy;
    b.vy += 0.04;
    b.life--;

    if (b.life <= 0) {
      bullets.splice(i, 1);
      continue;
    }

    const mapHit = checkRayObstacleCollision(b.prevX, b.prevY, b.x, b.y, groundY, obs);
    const endX = mapHit ? mapHit.x : b.x;
    const endY = mapHit ? mapHit.y : b.y;
    const maxT = mapHit ? mapHit.t : 1.0;

    let hitBall = false;
    if (ball) {
      const cR = ball.colRadius || 5.2;
      const distToBall = distPointToSegment(ball.x, ball.y, b.prevX, b.prevY, endX, endY);

      if (distToBall <= cR + 5) {
        ball.vx += b.vx * b.ballPush;
        ball.vy += b.vy * b.ballPush;
        ball.spin += (b.vx > 0 ? 0.25 : -0.25);
        spawnBulletSparks(endX, endY, '#38bdf8', 4);
        bullets.splice(i, 1);
        hitBall = true;
        continue;
      }
    }
    if (hitBall) continue;

    let hitChar = false;
    let closestChar = null;
    let closestCharT = Infinity;

    for (const ch of charList) {
      if (!ch || ch === b.shooter || ch.isDead) continue;
      if (ch.isBot && !ch.active) continue;

      const hitW = ch.w || 24;
      const hitH = ch.h || 70;
      const charLeft = ch.x;
      const charRight = ch.x + hitW;
      const charTop = ch.y;
      const charBottom = ch.y + hitH;

      const charT = getSegmentAABBHitT(b.prevX, b.prevY, endX, endY, charLeft, charTop, charRight, charBottom);
      if (charT !== null && charT <= maxT && charT < closestCharT) {
        closestCharT = charT;
        closestChar = ch;
      }
    }

    if (closestChar) {
      const hitPtX = b.prevX + (b.x - b.prevX) * closestCharT;
      const hitPtY = b.prevY + (b.y - b.prevY) * closestCharT;

      closestChar.hp = Math.max(0, (closestChar.hp !== undefined ? closestChar.hp : 100) - b.damage);
      spawnBulletSparks(hitPtX, hitPtY, '#ef4444', 5);
      spawnBloodSpurt(hitPtX, hitPtY, b.vx * 0.35, b.vy * 0.35, 4, 0.7);

      // =====================================================================
      // OBSŁUGA ZGONU I DEKAPITACJI
      // =====================================================================
      if (closestChar.hp <= 0 && !closestChar.isDead) {
        closestChar.isDead = true;
        closestChar.respawnTimer = 180;
        closestChar.corpseAngle = 0;
        closestChar.corpseRotVel = 0;
        closestChar.torsoTiltVel = 0;
        closestChar.headBobVel = 0;
        closestChar.rotSpeed = 0;
        closestChar.spin = 0;
        closestChar.kickMode = 'GROUND';
        closestChar.kickState = 'IDLE';
        closestChar.bicycleTimer = 0;
        closestChar.spinVolleyTimer = 0;
        closestChar.scissorTimer = 0;
        closestChar.corpseFloorY = groundY;
        closestChar.isGibbed = false; // Całkowite rozerwanie jest zarezerwowane wyłącznie dla beczki!

        // Soldat dynamic death impulse: mocny impuls w tył oraz poderwanie w górę
        const hitDir = Math.sign(b.vx) || (closestChar.facing * -1);
        closestChar.vx = hitDir * (Math.random() * 1.5 + 4.2); // pęd w stronę lotu kuli
        closestChar.vy = -(Math.random() * 1.2 + 3.8);         // podbicie w powietrze
        closestChar.isJumping = true;

        // Inicjalizacja dynamiki przewrotu
        closestChar.deathTilt = 0;              // bieżący kąt przewrotu
        closestChar.deathRotVel = hitDir * 0.14; // prędkość obrotu tułowia w locie
        closestChar.isSettled = false;          // czy ciało znieruchomiało na ziemi
        closestChar.pelvisY = 0;

        const shotDist = Math.hypot(hitPtX - (b.originX || hitPtX), hitPtY - (b.originY || hitPtY));
        const isHeadshot = (hitPtY <= closestChar.y + 22);
        const isCloseShotgun = (b.weaponId === 'SHOTGUN' && shotDist < 155);

        // Odłącz i wyrzuć broń ofiary w świat
        if (closestChar.currentWeapon) {
          spawnDroppedWeapon(
            closestChar.x + closestChar.w / 2,
            closestChar.y + 28,
            b.vx * 0.22,
            -3.8,
            closestChar.currentWeapon,
            closestChar.facing
          );
        }

        if (isHeadshot && isCloseShotgun) {
          // =================================================================
          // 1. CZYSTA DEKAPITACJA: ODCIĘTA GŁOWA + FONTANNA KRWI
          // =================================================================
          closestChar.hasHead = false;
          closestChar.decapitated = true;
          closestChar.neckFountainTimer = 55; // Kikut szyi tryska fontanną przez 55 klatek

          triggerHitstop(6);
          triggerScreenShake(16);

          // Wystrzelenie odciętej głowy w powietrze (głowa może swobodnie rotować)
          spawnHeadGib(
            closestChar.x + closestChar.w / 2,
            closestChar.y + 8,
            b.vx * 0.55,
            -5.5,
            closestChar.facing,
            closestChar.currentClass?.visuals
          );

          spawnBloodSpurt(hitPtX, hitPtY, b.vx, -2.5, 25, 1.4);
          spawnBloodFountain(closestChar.x + closestChar.w / 2, closestChar.y + 14, closestChar.facing, 6);
        } else {
          // =================================================================
          // 2. NORMALNA ŚMIERĆ KINETYCZNA (Głowa odpada, ciało wykonuje przewrót w stylu Soldat)
          // =================================================================
          closestChar.hasHead = true;
          closestChar.decapitated = false;
          closestChar.neckFountainTimer = 0;

          triggerHitstop(3);
          triggerScreenShake(7);

          // Odpadająca głowa (severedHead) – rotować może się wyłącznie odcięta głowa
          closestChar.severedHead = {
            x: closestChar.x + closestChar.w / 2,
            y: closestChar.y + 12,
            vx: (b.vx * 0.06) + (Math.random() - 0.5) * 1.5,
            vy: -3.8 - Math.random() * 1.5,
            rotation: 0,
            rotSpeed: (Math.random() - 0.5) * 0.25,
            onGround: false,
            life: 420,
            fadeTimer: 60,
            alpha: 1.0,
            facing: closestChar.facing,
            visuals: closestChar.currentClass?.visuals
          };

          spawnBloodSpurt(hitPtX, hitPtY, b.vx * 0.5, -1.2, 10, 0.8);
        }
      }

      bullets.splice(i, 1);
      hitChar = true;
      continue;
    }
    if (hitChar) continue;

    if (mapHit) {
      spawnHitSparks(mapHit.x, mapHit.y, mapHit.nx, mapHit.ny, 4);
      bullets.splice(i, 1);
      continue;
    }
  }
}

export function drawBullets(ctx) {
  for (const p of bulletParticles) {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }

  ctx.save();
  for (const b of bullets) {
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 2.0;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(b.x - b.vx * 0.7, b.y - b.vy * 0.7);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(b.x - 1, b.y - 1, 2, 2);
  }
  ctx.restore();
}

/**
 * Renderowanie broni w rękach strzelca
 */
export function drawHeldWeapon(ctx, p) {
  if (!p || !p.currentWeapon || p.isDead) return;

  const hold = getWeaponHoldTransform(p);
  const weapon = p.currentWeapon;

  ctx.save();
  ctx.translate(hold.pivotX, hold.pivotY);
  ctx.scale(hold.charFacing, 1);
  ctx.rotate(hold.angle);

  if (weapon.id === 'AK47') {
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(0, -1);
    ctx.lineTo(-12, 1.5);
    ctx.lineTo(-12, 6.5);
    ctx.lineTo(-6, 4.5);
    ctx.lineTo(0, 2.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-12.5, 1.5, 1.5, 5);

    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(1, 2);
    ctx.lineTo(-1, 7);
    ctx.lineTo(2.2, 7.5);
    ctx.lineTo(4, 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, -2.5, 14, 4.5);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, -1.8, 14, 3.5);

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(6.5, 2.0);
    ctx.quadraticCurveTo(8.5, 8.5, 13.5, 10.5);
    ctx.lineTo(11.2, 11.5);
    ctx.quadraticCurveTo(5.5, 9.5, 4.0, 2.0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    ctx.fillStyle = '#78350f';
    ctx.fillRect(14, -2.2, 8.5, 3.8);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(14, -2.2, 8.5, 1.0);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(22.5, -1.4, 11.5, 2.4);
    ctx.fillStyle = '#334155';
    ctx.fillRect(22.5, -2.2, 4, 1.2);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(29.5, -3.2, 1.5, 2.0);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(32.5, -1.6, 1.5, 2.8);

    if (p.muzzleFlashTimer > 0) {
      drawMuzzleFlash(ctx, 34, -0.2, 11, false);
    }
  } else if (weapon.id === 'SHOTGUN') {
    ctx.fillStyle = '#3f2712';
    ctx.beginPath();
    ctx.moveTo(0, -1);
    ctx.lineTo(-12, 1.8);
    ctx.lineTo(-12, 7.0);
    ctx.lineTo(-5, 4.8);
    ctx.lineTo(0, 3.0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-12.5, 1.8, 1.5, 5.2);

    ctx.fillStyle = '#3f2712';
    ctx.fillRect(0, 2.5, 3.2, 5);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, -2.6, 11, 5.4);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, -3.2, 11, 1.2);

    ctx.fillStyle = '#334155';
    ctx.fillRect(11, -2.4, 17, 3.0);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(11, 0.6, 14, 2.4);

    const pumpX = 13 + (p.pumpOffset || 0);
    ctx.fillStyle = '#3f2712';
    ctx.fillRect(pumpX, -0.2, 7.5, 3.8);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.7;
    ctx.strokeRect(pumpX, -0.2, 7.5, 3.8);

    ctx.fillStyle = '#090d16';
    ctx.fillRect(26.5, -2.6, 1.5, 3.4);

    if (p.muzzleFlashTimer > 0) {
      drawMuzzleFlash(ctx, 28, -0.9, 15, true);
    }
  }

  ctx.restore();
}

function drawMuzzleFlash(ctx, mx, my, size, isShotgun) {
  ctx.save();
  ctx.translate(mx, my);

  ctx.fillStyle = '#f97316';
  ctx.shadowColor = '#facc15';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.35);
  ctx.lineTo(size * 0.9, -size * 0.15);
  ctx.lineTo(size * 1.3, 0);
  ctx.lineTo(size * 0.9, size * 0.15);
  ctx.lineTo(0, size * 0.35);
  ctx.lineTo(size * 0.25, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.5);
  ctx.lineTo(size * 0.7, 0);
  ctx.lineTo(0, size * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(2, 0, size * 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
