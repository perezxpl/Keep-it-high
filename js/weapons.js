// =========================================================================
// WEAPONS.JS - SYSTEM BRONI, BALISTYKI I KINEMATYKI STRZELECKIEJ (SOLDAT STYLE)
// Obsługa stref trafień, odrzutu celu oraz rozrywania kończyn (Dismemberment)
// =========================================================================

import {
  triggerScreenShake, GROUND_Y, triggerHitstop,
  spawnHeadGib, spawnBloodSpurt, spawnBloodFountain, spawnDroppedWeapon,
  bodyGibs
} from './world.js';
import { checkRayObstacleCollision, obstacles, registerHitSparkCallback } from './obstacles.js';
import { WEAPON_CONFIG } from './config.js';
import { getActiveArena } from './arenas/index.js';
import {
  spawnBulletCasing,
  updateBulletCasings,
  drawBulletCasings,
  clearBulletCasings,
  bulletCasings
} from './particles.js';

export {
  spawnBulletCasing,
  updateBulletCasings,
  drawBulletCasings,
  clearBulletCasings,
  bulletCasings
};

export const WEAPONS = {
  AK47: {
    id: 'AK47',
    name: 'AK-47',
    auto: true,             // Ciągły ogień przy trzymaniu LPM / drążka
    fireRate: 6,            // Strzał co 6 klatek (~10 strz./s przy 60 FPS)
    damage: 13,
    bulletSpeed: 25,
    spread: 0.042,          // Bazowy rozrzut w radianach
    crouchSpreadMult: 0.55, // Redukcja rozrzutu w kucaniu (-45%)
    recoil: 0.65,           // Siła odrzutu wizualnego
    crouchRecoilMult: 0.45,
    muzzleRise: 0.045,      // Podrzut lufy w górę na strzał (rad)
    kickbackDistance: 2.8,  // Cofnięcie samej broni w tył (px)
    ballPush: 0.18,         // Pchnięcie piłki
    bodyPush: 0.032,        // Subtelne wytrącenie z równowagi żywej postaci
    ragdollPushMult: 0.85,  // Standardowy, realistyczny impuls śmierci
    pellets: 1,
    bulletColor: '#facc15',
    magSize: WEAPON_CONFIG.AK47.magSize,
    currentAmmo: WEAPON_CONFIG.AK47.currentAmmo,
    reserveAmmo: WEAPON_CONFIG.AK47.reserveAmmo,
    reloadTime: WEAPON_CONFIG.AK47.reloadTime,
    reloadDuration: Math.round(WEAPON_CONFIG.AK47.reloadTime * 60)
  },
  SHOTGUN: {
    id: 'SHOTGUN',
    name: 'SHOTGUN',
    auto: false,            // Semi-auto
    fireRate: 35,           // Odstęp między wystrzałami
    damage: 9,              // Obrażenia na pojedynczy śrut
    bulletSpeed: 21,
    spread: 0.165,          // Stożek śrutu
    crouchSpreadMult: 0.65,
    recoil: 2.5,            // Silny odrzut wizualny
    crouchRecoilMult: 0.42,
    muzzleRise: 0.185,      // Skok lufy ku górze (rad)
    kickbackDistance: 5.8,  // Silne cofnięcie broni ku barkowi
    ballPush: 0.38,
    bodyPush: 0.095,        // Silny odrzut kinetyczny żywej postaci od każdego śrutu
    ragdollPushMult: 2.20,  // Potężne katapultowanie bezwładnego ciała w tył
    pellets: 6,
    bulletColor: '#fb923c',
    magSize: WEAPON_CONFIG.SHOTGUN.magSize,
    currentAmmo: WEAPON_CONFIG.SHOTGUN.currentAmmo,
    reserveAmmo: WEAPON_CONFIG.SHOTGUN.reserveAmmo,
    reloadTime: WEAPON_CONFIG.SHOTGUN.reloadTime,
    reloadDuration: Math.round(WEAPON_CONFIG.SHOTGUN.reloadTime * 60)
  },
  GRENADE: {
    id: 'GRENADE',
    name: 'GRENADE',
    fullName: 'HE GRENADE',
    type: 'TACTICAL',
    cooldown: 3.5,
    maxCooldown: 3.5,
    damage: 85,
    radius: 90
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
registerHitSparkCallback(spawnHitSparks);

function lerp(a, b, t) {
  return a + (b - a) * t;
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
  let hipY = shooter.y + shooter.h - 40 + (shooter.pelvisY || 0);
  if (shooter.staggerTimer > 0) {
    const floorY = shooter.currentGroundY || shooter.groundY || (shooter.y + 15);
    hipY = floorY - 6;
  }
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
  const isCrouch = !!(p.isCrouching || p.isProne);

  const isStaggered = (p.staggerTimer > 0);
  const recTimer = (p.staggerRecoveryTimer > 0) ? p.staggerRecoveryTimer : 0;
  let slingWeight = 0;
  if (isStaggered) {
    slingWeight = 1.0;
  } else if (recTimer > 0) {
    slingWeight = Math.min(1.0, recTimer / 8.0);
  }

  // Pozycja pasa taktycznego (tactical sling) na klatce piersiowej leżącej postaci:
  // x = hipX + 4 * p.facing, y = hipY - 4 (tuż nad ziemią, na klatce)
  // Kąt broni: zablokowany wzdłuż leżącego torsu (0 = równolegle do podłoża)
  const slingPivotX = hipX + 4 * charFacing;
  const slingPivotY = hipY - 4;
  const slingAngle = 0;

  if (slingWeight >= 1.0) {
    // 3. POZYCJA BRONI I RAMION – PAS TAKTYCZNY:
    // CAŁKOWICIE odetnij broń i ramiona od śledzenia kursora myszy (aimAngle).
    // Broń nie może sterczeć w powietrze ani celować w niebo.
    const rightHandWorldX = slingPivotX + 2 * charFacing;
    const rightHandWorldY = slingPivotY + 3;
    const leftHandWorldX = slingPivotX + 14 * charFacing;
    const leftHandWorldY = slingPivotY + 2;
    const barrelLength = isShotgun ? 28 : 34;

    return {
      pivotX: slingPivotX,
      pivotY: slingPivotY,
      angle: slingAngle,
      charFacing,
      rightShoulderX,
      rightShoulderY,
      shoulderPocketX: rightShoulderX,
      shoulderPocketY: rightShoulderY,
      aimX: slingPivotX + 50 * charFacing,
      aimY: slingPivotY,
      weight: 0,
      kickback: 0,
      muzzleRise: 0,
      rightHandTarget: { x: rightHandWorldX, y: rightHandWorldY },
      leftHandTarget: { x: leftHandWorldX, y: leftHandWorldY },
      barrelLen: barrelLength
    };
  }

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
  const reloadDip = p.isReloading ? Math.sin((p.reloadTimer / (p.reloadDuration || 120)) * Math.PI) * 0.16 : 0;
  const blendedAngle = lerpAngle(looseAimAngle, shoulderAimAngle, w) + reloadDip;
  const kickback = p.weaponKickback || 0;

  let finalPivotX = rawPivotX - Math.cos(blendedAngle) * kickback * charFacing;
  let finalPivotY = rawPivotY - Math.sin(blendedAngle) * kickback;

  if (p.isProne) {
    const floorY = p.currentGroundY || p.groundY || 560;
    finalPivotY = Math.max(floorY - 9.0, Math.min(floorY - 6.5, finalPivotY));
  }

  let proneAimAngle = p.isProne ? Math.max(-0.42, Math.min(0.08, blendedAngle)) : blendedAngle;

  // Punkty podparcia dłoni
  const rearGripDistX = isShotgun ? 1.6 : 1.5;
  const rearGripDistY = isShotgun ? 4.5 : 4.2;
  const pumpShift = isShotgun ? (p.pumpOffset || 0) : 0;
  const foreGripDistX = (isShotgun ? 16.5 : 17.5) + pumpShift;
  const foreGripDistY = isShotgun ? 2.0 : 1.2;

  let rightHandWorldX = finalPivotX + (Math.cos(proneAimAngle) * rearGripDistX - Math.sin(proneAimAngle) * rearGripDistY) * charFacing;
  let rightHandWorldY = finalPivotY + (Math.sin(proneAimAngle) * rearGripDistX + Math.cos(proneAimAngle) * rearGripDistY);
  let leftHandWorldX = finalPivotX + (Math.cos(proneAimAngle) * foreGripDistX - Math.sin(proneAimAngle) * foreGripDistY) * charFacing;
  let leftHandWorldY = finalPivotY + (Math.sin(proneAimAngle) * foreGripDistX + Math.cos(proneAimAngle) * foreGripDistY);

  if (slingWeight > 0) {
    finalPivotX = lerp(finalPivotX, slingPivotX, slingWeight);
    finalPivotY = lerp(finalPivotY, slingPivotY, slingWeight);
    proneAimAngle = lerpAngle(proneAimAngle, slingAngle, slingWeight);
    rightHandWorldX = lerp(rightHandWorldX, slingPivotX + 2 * charFacing, slingWeight);
    rightHandWorldY = lerp(rightHandWorldY, slingPivotY + 3, slingWeight);
    leftHandWorldX = lerp(leftHandWorldX, slingPivotX + 14 * charFacing, slingWeight);
    leftHandWorldY = lerp(leftHandWorldY, slingPivotY + 2, slingWeight);
  }

  const barrelLength = isShotgun ? 28 : 34;

  return {
    pivotX: finalPivotX,
    pivotY: finalPivotY,
    angle: proneAimAngle,
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
 * Pobranie obiektu stanu amunicji dla danego strzelca i broni
 */
export function getWeaponAmmo(shooter, weapon = shooter?.currentWeapon) {
  if (!shooter) return null;
  const wepId = weapon?.id || (typeof weapon === 'string' ? weapon : 'AK47');
  if (!shooter.ammo) {
    shooter.ammo = {};
  }
  if (!shooter.ammo[wepId]) {
    const baseWep = WEAPONS[wepId] || WEAPONS.AK47;
    const magSize = baseWep.magSize || (wepId === 'SHOTGUN' ? 8 : 30);
    const reserveAmmo = baseWep.reserveAmmo ?? (wepId === 'SHOTGUN' ? 64 : 90);
    const reloadTime = baseWep.reloadTime || (wepId === 'SHOTGUN' ? 2.5 : 2.0);
    shooter.ammo[wepId] = {
      magSize,
      currentAmmo: magSize,
      reserveAmmo,
      reloadTime,
      reloadDuration: Math.round(reloadTime * 60),
      isReloading: false,
      reloadTimer: 0
    };
  }
  return shooter.ammo[wepId];
}

/**
 * Rozpoczęcie przeładowania bieżącej broni gracza
 */
export function reloadWeapon(shooter, weapon = shooter?.currentWeapon) {
  if (!shooter || shooter.isDead) return false;
  const ammo = getWeaponAmmo(shooter, weapon);
  if (!ammo) return false;
  if (ammo.isReloading) return false;
  if (ammo.currentAmmo >= ammo.magSize) return false;
  if (ammo.reserveAmmo <= 0) return false;

  ammo.isReloading = true;
  ammo.reloadDuration = ammo.reloadDuration || Math.round((ammo.reloadTime || 2.0) * 60);
  ammo.reloadTimer = ammo.reloadDuration;
  shooter.isReloading = true;
  shooter.reloadTimer = ammo.reloadTimer;
  shooter.reloadDuration = ammo.reloadDuration;
  return true;
}

/**
 * Anulowanie przeładowania (np. przy zmianie broni)
 */
export function cancelReload(shooter, weapon = shooter?.currentWeapon) {
  if (!shooter) return;
  const ammo = getWeaponAmmo(shooter, weapon);
  if (ammo) {
    ammo.isReloading = false;
    ammo.reloadTimer = 0;
  }
  shooter.isReloading = false;
  shooter.reloadTimer = 0;
}

/**
 * Wystrzał z broni z obsługą amunicji i automatycznego przeładowania
 */
export function shootWeapon(shooter, weapon, overrideX, overrideY, overrideAngle) {
  if (!shooter || !weapon || shooter.isDead || shooter.staggerTimer > 0) return false;
  if (shooter.shootCooldown > 0 && !shooter.isRemote) return false;

  // Weryfikacja amunicji dla gracza lokalnego
  if (!shooter.isRemote && !shooter.isBot) {
    const ammo = getWeaponAmmo(shooter, weapon);
    if (ammo) {
      // Zablokuj strzał w trakcie przeładowania
      if (ammo.isReloading) {
        return false;
      }
      // Zablokuj strzał, gdy magazynek jest pusty
      if (ammo.currentAmmo <= 0) {
        if (ammo.reserveAmmo > 0) {
          // Automatyczne przeładowanie przy próbie strzału z pustego magazynka
          reloadWeapon(shooter, weapon);
        } else {
          // Brak amunicji w ogóle - "pusty klik"
          shooter.shootCooldown = 12;
          shooter.emptyAmmoAlert = 35;
        }
        return false;
      }
      // Zmniejszaj currentAmmo o 1 przy każdym wystrzale
      ammo.currentAmmo--;
    }
  }

  const isCrouch = !!(shooter.isCrouching || shooter.isProne);

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

  let muzzleX, muzzleY, theta;
  if (overrideX !== undefined && overrideY !== undefined && overrideAngle !== undefined) {
    muzzleX = overrideX;
    muzzleY = overrideY;
    theta = overrideAngle;
  } else {
    const muzzle = getMuzzlePosition(shooter, weapon);
    muzzleX = muzzle.muzzleX;
    muzzleY = muzzle.muzzleY;

    const effectiveGroundY = (typeof shooter.groundY === 'number' && shooter.groundY > 0)
      ? shooter.groundY
      : (typeof GROUND_Y === 'number' && GROUND_Y > 0 ? GROUND_Y : 500);

    const wallHit = checkRayObstacleCollision(muzzle.shoulderX, muzzle.shoulderY, muzzleX, muzzleY, effectiveGroundY, obstacles);
    if (wallHit) {
      spawnHitSparks(wallHit.x, wallHit.y, wallHit.nx, wallHit.ny, 5);
      if (!shooter.isRemote) shooter.shootCooldown = weapon.fireRate;
      shooter.muzzleFlashTimer = 2;
      if (weapon.recoil > 1.2 && !shooter.isRemote) triggerScreenShake(2.5);

      // Wyrzut łuski z zamka broni przy strzale
      const hold = getWeaponHoldTransform(shooter);
      const breechDist = (weapon.id === 'SHOTGUN' ? 8 : 10);
      const charFacing = (shooter && typeof shooter.facing === 'number') ? shooter.facing : (hold.charFacing || 1);
      const bX = hold.pivotX + Math.cos(hold.angle) * breechDist * charFacing;
      const bY = hold.pivotY + Math.sin(hold.angle) * breechDist - 1.5;
      spawnBulletCasing(bX, bY, hold.angle, weapon.id, charFacing, shooter.vx || 0, shooter.vy || 0);

      return true;
    }

    theta = Math.atan2(muzzle.aimY - muzzleY, muzzle.aimX - muzzleX);
  }

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
      bodyPush: weapon.bodyPush || 0.03,
      ragdollPushMult: weapon.ragdollPushMult || 1.0,
      color: weapon.bulletColor,
      shooter: shooter,
      life: 75
    });
  }

  shooter.muzzleFlashTimer = 2;
  if (!shooter.isRemote) {
    shooter.shootCooldown = weapon.fireRate;
    if (weapon.recoil > 1.5) {
      triggerScreenShake(isCrouch ? 2.4 : 3.8);
    } else {
      triggerScreenShake(1.2);
    }
  }

  spawnBulletSparks(muzzleX + Math.cos(theta) * 6, muzzleY + Math.sin(theta) * 6, weapon.bulletColor, 3);

  // Wyrzut łuski z zamka broni (Ejection Mechanics: punkt startowy na zamku, lekko cofnięty w stronę broni/gracza)
  let breechX, breechY;
  const charFacing = (shooter && typeof shooter.facing === 'number') ? shooter.facing : (Math.cos(theta) >= 0 ? 1 : -1);

  if (shooter && overrideX === undefined) {
    const hold = getWeaponHoldTransform(shooter);
    const breechDist = (weapon.id === 'SHOTGUN' ? 8 : 10);
    breechX = hold.pivotX + Math.cos(hold.angle) * breechDist * charFacing;
    breechY = hold.pivotY + Math.sin(hold.angle) * breechDist - 1.5;
  } else {
    const backDist = (weapon.id === 'SHOTGUN' ? 18 : 22);
    breechX = muzzleX - Math.cos(theta) * backDist;
    breechY = muzzleY - Math.sin(theta) * backDist - 1.5;
  }

  const inheritVx = shooter ? (shooter.vx || 0) : 0;
  const inheritVy = shooter ? (shooter.vy || 0) : 0;
  spawnBulletCasing(breechX, breechY, theta, weapon.id, charFacing, inheritVx, inheritVy);

  return true;
}

/**
 * Aktualizacja klatkowa stanów broni i cyklu przeładowania
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

  if (p.emptyAmmoAlert > 0) {
    p.emptyAmmoAlert--;
  }

  // Obsługa amunicji i przeładowania broni gracza
  const curWep = p.currentWeapon || WEAPONS.AK47;
  const curWepId = curWep?.id || 'AK47';

  // Anulowanie trwającego przeładowania przy zmianie broni
  if (p._prevWeaponId && p._prevWeaponId !== curWepId) {
    if (p.ammo && p.ammo[p._prevWeaponId]) {
      p.ammo[p._prevWeaponId].isReloading = false;
      p.ammo[p._prevWeaponId].reloadTimer = 0;
    }
  }
  p._prevWeaponId = curWepId;

  if (p.ammo) {
    const ammo = getWeaponAmmo(p, curWep);
    if (ammo && ammo.isReloading) {
      ammo.reloadTimer--;
      p.isReloading = true;
      p.reloadTimer = ammo.reloadTimer;
      p.reloadDuration = ammo.reloadDuration;

      if (ammo.reloadTimer <= 0) {
        // Zakończenie przeładowania: doładuj magazynek do pełna, odejmując zużytą liczbę z reserveAmmo
        const needed = ammo.magSize - ammo.currentAmmo;
        const toLoad = Math.min(needed, ammo.reserveAmmo);
        ammo.currentAmmo += toLoad;
        ammo.reserveAmmo -= toLoad;
        ammo.isReloading = false;
        ammo.reloadTimer = 0;
        p.isReloading = false;
        p.reloadTimer = 0;
      }
    } else {
      p.isReloading = false;
      p.reloadTimer = 0;
    }
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
 * Aktualizacja pocisków, strefy trafień (Headshot / Torso / Legs) i rozrywanie kończyn
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
  updateBulletCasings(1 / 60, groundY, obs);

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

    const mapHit = checkRayObstacleCollision(b.prevX, b.prevY, b.x, b.y, groundY, obs, b);
    const endX = mapHit ? mapHit.x : b.x;
    const endY = mapHit ? mapHit.y : b.y;
    const maxT = mapHit ? mapHit.t : 1.0;

    let hitBall = false;
    if (ball) {
      const cR = ball.colRadius || 5.2;
      const distToBall = distPointToSegment(ball.x, ball.y, b.prevX, b.prevY, endX, endY);

      if (distToBall <= cR + 5) {
        ball.isLevitating = false;
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

    // Przechwycenie trafienia pocisku w unikalne elementy mapy (Plugin Lifecycle Hook)
    const activeArena = getActiveArena();
    if (activeArena && typeof activeArena.onBulletHit === 'function') {
      if (activeArena.onBulletHit(b)) {
        b.alive = false;
        bullets.splice(i, 1);
        continue;
      }
    }

    let hitChar = false;
    let closestChar = null;
    let closestCharT = Infinity;

    for (const ch of charList) {
      if (!ch || ch === b.shooter || ch.isDead) continue;
      if (ch.isBot && !ch.active) continue;

      const hitW = ch.w || 24;
      const hitH = ch.h || 70;
      let charLeft = ch.x;
      let charRight = ch.x + hitW;
      let charTop = ch.y - 25;
      let charBottom = ch.y + hitH;

      if (ch.isProne || ch.staggerTimer > 0) {
        // Obniżony profil kolizji dla pozycji leżącej na brzuchu lub na plecach po powaleniu
        charTop = ch.y + hitH - 24;
        charBottom = ch.y + hitH + 2;
        charLeft = ch.x - (ch.facing === 1 ? 14 : 38);
        charRight = ch.x + hitW + (ch.facing === 1 ? 38 : 14);
      } else if (ch.isCrouching) {
        charTop = ch.y + 12;
      }

      const charT = getSegmentAABBHitT(b.prevX, b.prevY, endX, endY, charLeft, charTop, charRight, charBottom);
      if (charT !== null && charT <= maxT && charT < closestCharT) {
        closestCharT = charT;
        closestChar = ch;
      }
    }

    if (closestChar) {
      const hitPtX = b.prevX + (b.x - b.prevX) * closestCharT;
      const hitPtY = b.prevY + (b.y - b.prevY) * closestCharT;

      const isHeadshot = (hitPtY <= closestChar.y + 6);
      const isLegshot = (hitPtY >= closestChar.y + 40);

      let damageMultiplier = 1.0;
      if (isHeadshot) {
        damageMultiplier = 2.5; // Trafienie w głowę: 250% obrażeń!
      } else if (isLegshot) {
        damageMultiplier = 0.75; // Rany nóg: 75% obrażeń
      }

      const totalDamage = Math.round(b.damage * damageMultiplier);
      closestChar.hp = Math.max(0, (closestChar.hp !== undefined ? closestChar.hp : 100) - totalDamage);

      const isShotgun = (b.weaponId === 'SHOTGUN');

      // Odrzut kinetyczny celu
      if (!closestChar.isDead && closestChar.hp > 0) {
        const pushFactor = b.bodyPush || (isShotgun ? 0.095 : 0.032);
        closestChar.vx += b.vx * pushFactor;
        if (isShotgun) {
          closestChar.vy = Math.min(closestChar.vy, closestChar.vy * 0.8 - 0.85);
          triggerScreenShake(1.6);
        }
      }

      if (isHeadshot) {
        spawnBulletSparks(hitPtX, hitPtY, '#ef4444', 8);
        spawnBloodSpurt(hitPtX, hitPtY, b.vx * 0.55, b.vy * 0.55, 12, 1.4);
        triggerScreenShake(isShotgun ? 4.5 : 2.2);
      } else {
        spawnBulletSparks(hitPtX, hitPtY, '#ef4444', 4);
        spawnBloodSpurt(hitPtX, hitPtY, b.vx * 0.35, b.vy * 0.35, 5, 0.8);
        if (isShotgun) triggerScreenShake(2.0);
      }

      // =====================================================================
      // OBSŁUGA ZGONU: REALISTYCZNY IMPULS RAGDOLLA I ROZRYWANIE KOŃCZYN
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
        closestChar.isGibbed = false;

        // Inicjalizacja stanu uszkodzeń kończyn
        closestChar.dismembered = {
          armFront: false,
          armBack: false,
          legFront: false,
          legBack: false
        };

        closestChar.deathHitPoint = { x: hitPtX, y: hitPtY };

        // Mnożnik odepchnięcia
        const pushMult = b.ragdollPushMult || (isShotgun ? 2.20 : 0.85);
        const liftBonus = isShotgun ? -2.6 : 0;

        if (isLegshot) {
          closestChar.deathImpulse = {
            vx: b.vx * 0.44 * pushMult + (Math.random() - 0.5) * 1.5,
            vy: -1.2 + liftBonus * 0.5
          };
        } else if (isHeadshot) {
          closestChar.deathImpulse = {
            vx: b.vx * 0.54 * pushMult + (Math.random() - 0.5) * 1.5,
            vy: -3.0 + liftBonus
          };
        } else {
          closestChar.deathImpulse = {
            vx: b.vx * 0.40 * pushMult + (Math.random() - 0.5) * 1.5,
            vy: -2.0 + liftBonus
          };
        }

        // Reset ragdolla wymusza świeżą inicjalizację z aktualnej pozycji
        closestChar.ragdoll = null;

        const shotDist = Math.hypot(hitPtX - (b.originX || hitPtX), hitPtY - (b.originY || hitPtY));
        const isCloseShotgun = (isShotgun && shotDist < 170);

        // Wyrzucenie trzymanej broni
        if (closestChar.currentWeapon) {
          const dropMult = isShotgun ? 0.35 : 0.22;
          spawnDroppedWeapon(
            closestChar.x + closestChar.w / 2,
            closestChar.y + 28,
            b.vx * dropMult,
            -3.8 + (isShotgun ? -1.5 : 0),
            closestChar.currentWeapon,
            closestChar.facing
          );
        }

        if (isHeadshot && isCloseShotgun) {
          // 1. Dekapitacja (wyłącznie bliski strzał w głowę ze strzelby)
          closestChar.hasHead = false;
          closestChar.decapitated = true;
          closestChar.severedHead = null;
          closestChar.neckFountainTimer = 55;

          triggerHitstop(6);
          triggerScreenShake(18);

          spawnHeadGib(
            closestChar.x + closestChar.w / 2,
            closestChar.y - 8,
            b.vx * 0.65,
            -6.5,
            closestChar.facing,
            closestChar.currentClass?.visuals
          );

          spawnBloodSpurt(hitPtX, hitPtY, b.vx, -2.5, 25, 1.4);
          spawnBloodFountain(closestChar.x + closestChar.w / 2, closestChar.y + 14, closestChar.facing, 6);
        } else if (isCloseShotgun) {
          // 2. ODERWANIE KOŃCZYNY ZE STRZELBY Z BLISKA!
          closestChar.hasHead = true;
          closestChar.decapitated = false;
          closestChar.severedHead = null;
          closestChar.neckFountainTimer = 0;

          triggerHitstop(5);
          triggerScreenShake(16);

          if (isLegshot) {
            // Oderwanie przedniej nogi
            closestChar.dismembered.legFront = true;
            bodyGibs.push({
              type: 'leg',
              x: hitPtX,
              y: hitPtY,
              vx: b.vx * 0.40 + (Math.random() - 0.5) * 2.0,
              vy: -4.5 - Math.random() * 2.0,
              rot: Math.random() * Math.PI * 2,
              vRot: (Math.random() - 0.5) * 0.4,
              facing: closestChar.facing,
              visuals: closestChar.currentClass?.visuals || {},
              groundBounces: 0,
              life: 360
            });
            spawnBloodFountain(closestChar.x + closestChar.w / 2, closestChar.y + 45, closestChar.facing, 5);
          } else {
            // Oderwanie przedniej ręki
            closestChar.dismembered.armFront = true;
            bodyGibs.push({
              type: 'arm',
              x: hitPtX,
              y: hitPtY,
              vx: b.vx * 0.45 + (Math.random() - 0.5) * 2.5,
              vy: -5.0 - Math.random() * 2.0,
              rot: Math.random() * Math.PI * 2,
              vRot: (Math.random() - 0.5) * 0.45,
              facing: closestChar.facing,
              visuals: closestChar.currentClass?.visuals || {},
              groundBounces: 0,
              life: 360
            });
            spawnBloodFountain(closestChar.x + closestChar.w / 2, closestChar.y + 16, closestChar.facing, 5);
          }

          spawnBloodSpurt(hitPtX, hitPtY, b.vx * 0.7, -2.0, 24, 1.4);
        } else if (isHeadshot) {
          // Headshot z AK-47 – głowa zostaje na ciele
          closestChar.hasHead = true;
          closestChar.decapitated = false;
          closestChar.severedHead = null;
          closestChar.neckFountainTimer = 0;

          triggerHitstop(4);
          triggerScreenShake(10);
          spawnBloodSpurt(hitPtX, hitPtY, b.vx * 0.65, -2.2, 18, 1.3);
        } else {
          // Trafienie z dystansu lub z AK-47 w korpus/nogi – ciało w całości
          closestChar.hasHead = true;
          closestChar.decapitated = false;
          closestChar.severedHead = null;
          closestChar.neckFountainTimer = 0;

          triggerHitstop(2);
          triggerScreenShake(isLegshot ? 4 : 6);
          spawnBloodSpurt(hitPtX, hitPtY, b.vx * 0.35, -1.0, 8, 0.8);
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
  drawBulletCasings(ctx);

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
