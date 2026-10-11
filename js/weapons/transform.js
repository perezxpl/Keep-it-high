// =========================================================================
// WEAPONS/TRANSFORM.JS - KATALOG BRONI, AMUNICJA I KINEMATYKA TRZYMANIA BRONI
// Wydzielony moduł z js/weapons.js
// =========================================================================

import { registerHitSparkCallback } from '../obstacles.js';
import { WEAPON_CONFIG } from '../config.js';
import { spawnDroppedMagazine } from '../particles.js';

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
  SNIPER: {
    id: 'SNIPER',
    name: 'Barrett .50',
    auto: false,            // Semi-auto precyzyjna snajperka
    fireRate: 68,           // Cooldown klatek (~1.13s między strzałami)
    cooldown: 68,
    damage: 90,             // Potężne obrażenia .50 BMG
    bulletSpeed: 52.0,      // Ponaddźwiękowa balistyka w stylu Soldat
    spread: 0.003,          // Bezwzględna precyzja
    crouchSpreadMult: 0.35, // Niemal zero rozrzutu w przysiadzie / leżeniu
    recoil: 4.8,            // Silny wizualny odrzut
    crouchRecoilMult: 0.40,
    recoilImpulse: 4.8,     // Fizyczny odrzut gracza w tył
    screenShake: 12,        // Wstrząs ekranu przy wystrzale
    muzzleRise: 0.22,       // Podrzut lufy
    kickbackDistance: 7.8,  // Silne cofnięcie broni
    ballPush: 0.85,         // Potężne pchnięcie piłki
    bodyPush: 0.22,         // Odrzut trafionego przeciwnika
    ragdollPushMult: 3.5,   // Katapultowanie zwłok
    pellets: 1,
    bulletColor: '#38bdf8', // Lśniący błękitno-biały pocisk smugowy
    magSize: WEAPON_CONFIG.SNIPER.magSize,
    currentAmmo: WEAPON_CONFIG.SNIPER.currentAmmo,
    reserveAmmo: WEAPON_CONFIG.SNIPER.reserveAmmo,
    reloadTime: WEAPON_CONFIG.SNIPER.reloadTime,
    reloadDuration: Math.round(WEAPON_CONFIG.SNIPER.reloadTime * 60)
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

function ease(t) {
  return 0.5 - 0.5 * Math.cos(t * Math.PI);
}

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
  if (shooter.isProne) {
    const floorY = shooter.currentGroundY || shooter.groundY || (shooter.y + (shooter.h || 70));
    hipY = floorY - 6.0;
  } else if (shooter.staggerTimer > 0) {
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
  const isSniper = (weapon.id === 'SNIPER');
  const isCrouch = !!(p.isCrouching || p.isProne);

  const isStaggered = (p.staggerTimer > 0);
  const recTimer = (p.staggerRecoveryTimer > 0) ? p.staggerRecoveryTimer : 0;
  const isThrowing = !!(p.throwAnim && p.throwAnim.active);
  let slingWeight = 0;
  if (isStaggered || isThrowing) {
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
    const leftHandWorldX = slingPivotX + (isSniper ? 18 : 14) * charFacing;
    const leftHandWorldY = slingPivotY + 2;
    const barrelLength = isSniper ? 45 : (isShotgun ? 28 : 34);

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
  const headBobOffset = (p.headBob || 0) * 0.70;
  const crouchDropY = isCrouch ? 4 : 0;
  let loosePivotX = hipX + (isSniper ? 6.5 : (isShotgun ? 5.2 : 5.8)) * charFacing;
  let loosePivotY = hipY - (isSniper ? 11.5 : (isShotgun ? 9.5 : 10.5)) + headBobOffset + crouchDropY;

  let directAngle = Math.atan2(aimY - loosePivotY, (aimX - loosePivotX) * charFacing);
  if (directAngle < -Math.PI / 2) {
    directAngle = Math.max(-1.66, directAngle);
  } else if (directAngle > Math.PI / 2 + 0.35) {
    directAngle = Math.min(Math.PI / 2 + 0.35, directAngle);
  }
  const idleDroop = isSniper ? 0.22 : (isShotgun ? 0.35 : 0.26);
  let looseAimAngle = directAngle + idleDroop;

  // DYNAMICZNE KOŁYSANIE BRONI W RUCHU BEZ CELOWANIA (WEAPON SWAY & BOB)
  const speed = Math.abs(p.vx || 0);
  const isMoving = speed > 0.1 && (p.onGround || !p.isJumping);
  const strideP = p.stridePhase || 0;
  const isAimActive = !!(p.isAiming || p.isShooting || (p.shootPoseTimer > 0));

  if (!isAimActive) {
    if (isMoving) {
      const isSprint = (p.gaitMode === 'SPRINT');
      const isJog = (p.gaitMode === 'JOG');

      // Pionowy bobbing w takt każdego kroku (stridePhase * 2)
      const bobAmp = isSprint ? 3.8 : (isJog ? 2.5 : 1.4);
      const bobY = Math.sin(strideP * 2) * bobAmp;

      // Poziome kołysanie przód-tył
      const swayAmp = isSprint ? 3.2 : (isJog ? 2.0 : 1.0);
      const swayX = Math.cos(strideP) * swayAmp * charFacing;

      // Kołysanie kątowe lufy (barrel pitch)
      const pitchAmp = isSprint ? 0.14 : (isJog ? 0.08 : 0.035);
      const swayPitch = Math.sin(strideP) * pitchAmp;

      // W sprincie taktyczne obniżenie broni (Tactical Sprint)
      const sprintDrop = isSprint ? 2.5 : 0;
      const sprintAngleDroop = isSprint ? 0.18 : 0;

      loosePivotX += swayX;
      loosePivotY += (bobY + sprintDrop);
      looseAimAngle += (swayPitch + sprintAngleDroop);
    } else {
      // Subtelny oddech na postoju
      const idleBreathe = Math.sin(performance.now() * 0.003) * 0.6;
      loosePivotY += idleBreathe;
      looseAimAngle += idleBreathe * 0.015;
    }
  }

  // STAN 2: Prowadzenie ognia (Shoulder-Braced / Combat Stance - Uniesienie broni do oka)
  const braceOffsetY = isCrouch ? 1.0 : 0;
  const shoulderPocketX = rightShoulderX - 0.5 * charFacing;
  const shoulderPocketY = rightShoulderY - 2.2 + braceOffsetY;

  const stockLen = isSniper ? 11.5 : (isShotgun ? 10.4 : 10.2);

  const muzzleRise = (p.muzzleRise || 0) * (isCrouch ? 0.55 : 1.0);
  let rawShoulderAngle = Math.atan2(aimY - shoulderPocketY, (aimX - shoulderPocketX) * charFacing);
  if (rawShoulderAngle < -Math.PI / 2) {
    rawShoulderAngle = Math.max(-1.66, rawShoulderAngle);
  } else if (rawShoulderAngle > Math.PI / 2 + 0.35) {
    rawShoulderAngle = Math.min(Math.PI / 2 + 0.35, rawShoulderAngle);
  }
  const shoulderAimAngle = rawShoulderAngle - muzzleRise;

  const shoulderPivotX = shoulderPocketX + Math.cos(shoulderAimAngle) * stockLen * charFacing;
  const shoulderPivotY = shoulderPocketY + Math.sin(shoulderAimAngle) * stockLen;

  const w = (typeof p.shootPoseWeight === 'number') ? p.shootPoseWeight : 0.0;
  const rawPivotX = loosePivotX + (shoulderPivotX - loosePivotX) * w;
  const rawPivotY = loosePivotY + (shoulderPivotY - loosePivotY) * w;
  // Punkty podparcia dłoni w spoczynku / strzale
  const rearGripDistX = isSniper ? 1.4 : (isShotgun ? 1.6 : 1.5);
  const rearGripDistY = isSniper ? 4.0 : (isShotgun ? 4.5 : 4.2);
  const pumpShift = isShotgun ? (p.pumpOffset || 0) : 0;
  // Wyprostowana ręka taktyczna z naturalnym, sprężystym ugięciem łokcia (ok. 25-35 stopni w stawie)
  const foreGripDistX = isSniper ? 16.5 : ((isShotgun ? 14.8 : 16.0) + pumpShift);
  const foreGripDistY = isSniper ? 1.0 : (isShotgun ? 1.8 : 1.0);

  // KINEMATYKA PROCEDURALNA PRZEŁADOWANIA BRONI
  const u = p.isReloading
    ? ((typeof p.reloadProgress === 'number') ? p.reloadProgress : (1.0 - (p.reloadTimer / (p.reloadDuration || 120))))
    : 0;

  let reloadAngleOffset = 0;
  let reloadPivotShiftX = 0;
  let reloadPivotShiftY = 0;
  let leftHandLocalX = foreGripDistX;
  let leftHandLocalY = foreGripDistY;
  let isMagInGun = true;
  let heldMag = null;
  let boltOffset = 0;

  if (p.isReloading && u > 0 && u < 1.0) {
    const reloadEnv = Math.sin(u * Math.PI);
    reloadAngleOffset = (isShotgun ? -0.28 : -0.20) * reloadEnv;
    reloadPivotShiftX = -2.5 * reloadEnv * charFacing;
    reloadPivotShiftY = 1.8 * reloadEnv;

    if (isSniper) {
      // -------------------------------------------------------------
      // SNIPER (.50 BMG) RELOAD ANIMATION
      // -------------------------------------------------------------
      if (u < 0.20) {
        // Faza 1: Ruch ręki ku zatrzaskowi magazynka (16.5, 1.0) -> (7.0, 6.0)
        const t = u / 0.20;
        leftHandLocalX = lerp(foreGripDistX, 7.0, ease(t));
        leftHandLocalY = lerp(foreGripDistY, 6.0, ease(t));
        isMagInGun = true;
      } else if (u < 0.34) {
        // Faza 2: Zwolnienie zatrzasku i wypięcie magazynka w dół
        const t = (u - 0.20) / 0.14;
        leftHandLocalX = lerp(7.0, 5.0, t);
        leftHandLocalY = lerp(6.0, 12.0, t);
        isMagInGun = (u < 0.24);
        if (u >= 0.23 && u <= 0.28) {
          reloadAngleOffset += Math.sin((u - 0.23) / 0.05 * Math.PI) * 0.05;
        }
      } else if (u < 0.52) {
        // Faza 3: Sięgnięcie do ładownicy przy oporządzeniu
        const t = (u - 0.34) / 0.18;
        leftHandLocalX = lerp(5.0, -2.0, ease(t));
        leftHandLocalY = lerp(12.0, 17.0, ease(t));
        isMagInGun = false;
      } else if (u < 0.72) {
        // Faza 4: Wyciągnięcie nowego magazynka i uniesienie ku gniazdu
        const t = (u - 0.52) / 0.20;
        leftHandLocalX = lerp(-2.0, 7.0, ease(t));
        leftHandLocalY = lerp(17.0, 5.5, ease(t));
        isMagInGun = false;
        heldMag = { type: 'SNIPER', x: leftHandLocalX, y: leftHandLocalY, angle: -0.15 };
        if (t > 0.88) {
          // Zatrzaśnięcie magazynka w gnieździe (Mag slap)
          const snapT = (t - 0.88) / 0.12;
          reloadAngleOffset -= Math.sin(snapT * Math.PI) * 0.10;
          reloadPivotShiftY -= Math.sin(snapT * Math.PI) * 1.5;
        }
      } else if (u < 0.82) {
        // Faza 5: Magazynek zaryglowany, ruch ręki w górę do rączki zamka
        isMagInGun = true;
        const t = (u - 0.72) / 0.10;
        leftHandLocalX = lerp(7.0, 3.5, ease(t));
        leftHandLocalY = lerp(5.5, -3.5, ease(t));
      } else if (u < 0.90) {
        // Faza 6: Cykl zamka (odciągnięcie w tył i zaryglowanie w przód)
        isMagInGun = true;
        const t = (u - 0.82) / 0.08;
        const pull = Math.sin(t * Math.PI);
        boltOffset = -pull * 4.8;
        leftHandLocalX = 3.5 + boltOffset;
        leftHandLocalY = -3.5;
        if (t > 0.5) reloadAngleOffset += Math.sin(t * Math.PI) * 0.06;
      } else {
        // Faza 7: Powrót ręki na łoże karabinu
        isMagInGun = true;
        const t = (u - 0.90) / 0.10;
        leftHandLocalX = lerp(3.5, foreGripDistX, ease(t));
        leftHandLocalY = lerp(-3.5, foreGripDistY, ease(t));
      }
    } else if (isShotgun) {
      // -------------------------------------------------------------
      // SHOTGUN RELOAD ANIMATION (ŁADOWANIE NABOI DO RURY)
      // -------------------------------------------------------------
      isMagInGun = true;
      if (u < 0.16) {
        // Sięgnięcie do ładownicy z nabojami
        const t = u / 0.16;
        leftHandLocalX = lerp(foreGripDistX, -3.0, ease(t));
        leftHandLocalY = lerp(foreGripDistY, 15.0, ease(t));
      } else if (u < 0.44) {
        // Nabój 1: pobranie i wciśnięcie do okna ładowania od spodu
        const t = (u - 0.16) / 0.28;
        leftHandLocalX = lerp(-3.0, 5.5, ease(t));
        leftHandLocalY = lerp(15.0, 4.0, ease(t));
        if (t < 0.85) {
          heldMag = { type: 'SHOTGUN_SHELL', x: leftHandLocalX, y: leftHandLocalY, angle: 0.35 };
        } else {
          reloadAngleOffset -= Math.sin((t - 0.85) / 0.15 * Math.PI) * 0.06;
        }
      } else if (u < 0.72) {
        // Nabój 2: powtórzenie cyklu ładowania
        const tSub = (u - 0.44) / 0.28;
        if (tSub < 0.45) {
          const t = tSub / 0.45;
          leftHandLocalX = lerp(5.5, -3.0, ease(t));
          leftHandLocalY = lerp(4.0, 15.0, ease(t));
        } else {
          const t = (tSub - 0.45) / 0.55;
          leftHandLocalX = lerp(-3.0, 5.5, ease(t));
          leftHandLocalY = lerp(15.0, 4.0, ease(t));
          if (t < 0.85) {
            heldMag = { type: 'SHOTGUN_SHELL', x: leftHandLocalX, y: leftHandLocalY, angle: 0.35 };
          } else {
            reloadAngleOffset -= Math.sin((t - 0.85) / 0.15 * Math.PI) * 0.06;
          }
        }
      } else if (u < 0.80) {
        // Przejście ręki na czółenko
        const t = (u - 0.72) / 0.08;
        leftHandLocalX = lerp(5.5, foreGripDistX, ease(t));
        leftHandLocalY = lerp(4.0, foreGripDistY, ease(t));
      } else if (u < 0.89) {
        // Przeładowanie pompką (Pump action): szarpnięcie w tył i rygiel w przód
        const t = (u - 0.80) / 0.09;
        const pull = Math.sin(t * Math.PI);
        p.pumpOffset = -pull * 4.5;
        leftHandLocalX = foreGripDistX + p.pumpOffset;
        leftHandLocalY = foreGripDistY;
        reloadAngleOffset += Math.sin(t * Math.PI) * 0.07;
      } else {
        p.pumpOffset = 0;
        const t = (u - 0.89) / 0.11;
        leftHandLocalX = foreGripDistX;
        leftHandLocalY = foreGripDistY;
      }
    } else {
      // -------------------------------------------------------------
      // AK-47 RELOAD ANIMATION (ROCK & LOCK + CHARGING HANDLE)
      // -------------------------------------------------------------
      if (u < 0.20) {
        // Faza 1: Ruch ręki ku gniazdu magazynka
        const t = u / 0.20;
        leftHandLocalX = lerp(foreGripDistX, 6.5, ease(t));
        leftHandLocalY = lerp(foreGripDistY, 6.0, ease(t));
        isMagInGun = true;
      } else if (u < 0.34) {
        // Faza 2: Wypięcie magazynka łukowego (w dół i tył)
        const t = (u - 0.20) / 0.14;
        leftHandLocalX = lerp(6.5, 4.5, t);
        leftHandLocalY = lerp(6.0, 11.5, t);
        isMagInGun = (u < 0.24);
        if (u >= 0.23 && u <= 0.28) {
          reloadAngleOffset += Math.sin((u - 0.23) / 0.05 * Math.PI) * 0.05;
        }
      } else if (u < 0.52) {
        // Faza 3: Sięgnięcie do ładownicy przy pasie
        const t = (u - 0.34) / 0.18;
        leftHandLocalX = lerp(4.5, -2.0, ease(t));
        leftHandLocalY = lerp(11.5, 16.0, ease(t));
        isMagInGun = false;
      } else if (u < 0.72) {
        // Faza 4: Wyciągnięcie i włożenie nowego magazynka (Rock & Lock)
        const t = (u - 0.52) / 0.20;
        leftHandLocalX = lerp(-2.0, 6.5, ease(t));
        leftHandLocalY = lerp(16.0, 5.5, ease(t));
        isMagInGun = false;
        heldMag = { type: 'AK47', x: leftHandLocalX, y: leftHandLocalY, angle: -0.25 };
        if (t > 0.88) {
          // Rock & Lock zatrzaśnięcie
          const snapT = (t - 0.88) / 0.12;
          reloadAngleOffset -= Math.sin(snapT * Math.PI) * 0.08;
          reloadPivotShiftY -= Math.sin(snapT * Math.PI) * 1.2;
        }
      } else if (u < 0.82) {
        // Faza 5: Magazynek zaryglowany, sięgnięcie do suwadła zamka
        isMagInGun = true;
        const t = (u - 0.72) / 0.10;
        leftHandLocalX = lerp(6.5, 8.0, ease(t));
        leftHandLocalY = lerp(5.5, -2.2, ease(t));
      } else if (u < 0.90) {
        // Faza 6: Odciągnięcie suwadła zamka i zrzut
        isMagInGun = true;
        const t = (u - 0.82) / 0.08;
        const pull = Math.sin(t * Math.PI);
        boltOffset = -pull * 4.2;
        leftHandLocalX = 8.0 + boltOffset;
        leftHandLocalY = -2.2;
        if (t > 0.5) reloadAngleOffset += Math.sin(t * Math.PI) * 0.05;
      } else {
        // Faza 7: Powrót ręki na łoże
        isMagInGun = true;
        const t = (u - 0.90) / 0.10;
        leftHandLocalX = lerp(8.0, foreGripDistX, ease(t));
        leftHandLocalY = lerp(-2.2, foreGripDistY, ease(t));
      }
    }
  }

  const blendedAngle = lerpAngle(looseAimAngle, shoulderAimAngle, w) + reloadAngleOffset;
  const kickback = p.weaponKickback || 0;

  let finalPivotX = rawPivotX - Math.cos(blendedAngle) * kickback * charFacing + reloadPivotShiftX;
  let finalPivotY = rawPivotY - Math.sin(blendedAngle) * kickback + reloadPivotShiftY;
  let proneAimAngle = blendedAngle;

  if (p.isProne) {
    const floorY = p.currentGroundY || p.groundY || (p.y + (p.h || 70)) || 560;
    const crawlP = p.crawlPhase || 0;
    const isCrawling = speed > 0.08;

    // 1. Pozycja strzelecka w leżeniu (podparcie na łokciach, kolba w barku, magazynek nad ziemią)
    const fireAngle = Math.max(-0.56, Math.min(0.16, shoulderAimAngle + reloadAngleOffset));
    const firePivotX = rightShoulderX + Math.cos(fireAngle) * (stockLen * 0.92) * charFacing - Math.cos(fireAngle) * kickback * 0.65 * charFacing + reloadPivotShiftX;
    const firePivotY = Math.max(floorY - 16.5, Math.min(floorY - 10.5, (floorY - 12.2) + Math.sin(fireAngle) * (stockLen * 0.75) - Math.sin(fireAngle) * kickback * 0.65 + reloadPivotShiftY));

    // 2. Pozycja czołgania z bronią w dłoniach (Tactical Cradle Crawl: broń blisko ziemi, lufa lekko uniesiona, kołysanie w rytm łokci)
    const crawlSwayX = isCrawling ? Math.cos(crawlP) * 2.8 * charFacing : 0;
    const crawlBobY = isCrawling ? Math.abs(Math.sin(crawlP)) * 1.4 : 0;
    const crawlPitch = isCrawling
      ? (-0.14 + Math.sin(crawlP) * 0.06 + reloadAngleOffset)
      : Math.max(-0.52, Math.min(0.14, directAngle * 0.85 + reloadAngleOffset));

    const cradlePivotX = rightShoulderX + 7.2 * charFacing + crawlSwayX + reloadPivotShiftX;
    const cradlePivotY = (floorY - 11.2) - crawlBobY + reloadPivotShiftY;

    // Płynny blend między czołganiem z bronią a stabilnym celowaniem/strzelaniem z podparcia na łokciach
    const proneFireBlend = isCrawling ? Math.min(1.0, w * 1.15) : Math.max(0.65, w);
    finalPivotX = lerp(cradlePivotX, firePivotX, proneFireBlend);
    finalPivotY = lerp(cradlePivotY, firePivotY, proneFireBlend);
    proneAimAngle = lerpAngle(crawlPitch, fireAngle, proneFireBlend);
  }

  let rightHandWorldX = finalPivotX + (Math.cos(proneAimAngle) * rearGripDistX - Math.sin(proneAimAngle) * rearGripDistY) * charFacing;
  let rightHandWorldY = finalPivotY + (Math.sin(proneAimAngle) * rearGripDistX + Math.cos(proneAimAngle) * rearGripDistY);
  let leftHandWorldX = finalPivotX + (Math.cos(proneAimAngle) * leftHandLocalX - Math.sin(proneAimAngle) * leftHandLocalY) * charFacing;
  let leftHandWorldY = finalPivotY + (Math.sin(proneAimAngle) * leftHandLocalX + Math.cos(proneAimAngle) * leftHandLocalY);

  if (slingWeight > 0) {
    finalPivotX = lerp(finalPivotX, slingPivotX, slingWeight);
    finalPivotY = lerp(finalPivotY, slingPivotY, slingWeight);
    proneAimAngle = lerpAngle(proneAimAngle, slingAngle, slingWeight);
    rightHandWorldX = lerp(rightHandWorldX, slingPivotX + 2 * charFacing, slingWeight);
    rightHandWorldY = lerp(rightHandWorldY, slingPivotY + 3, slingWeight);
    leftHandWorldX = lerp(leftHandWorldX, slingPivotX + (isSniper ? 18 : 14) * charFacing, slingWeight);
    leftHandWorldY = lerp(leftHandWorldY, slingPivotY + 2, slingWeight);
  }

  const barrelLength = isSniper ? 45 : (isShotgun ? 28 : 34);

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
    barrelLen: barrelLength,
    isMagInGun,
    heldMag,
    boltOffset
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
    const magSize = baseWep.magSize || (wepId === 'SHOTGUN' ? 8 : (wepId === 'SNIPER' ? 5 : 30));
    const reserveAmmo = baseWep.reserveAmmo ?? (wepId === 'SHOTGUN' ? 64 : (wepId === 'SNIPER' ? 25 : 90));
    const reloadTime = baseWep.reloadTime || (wepId === 'SHOTGUN' ? 2.5 : (wepId === 'SNIPER' ? 2.8 : 2.0));
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
  ammo._magEjected = false;
  ammo._pumpEjected = false;
  shooter.isReloading = true;
  shooter.reloadTimer = ammo.reloadTimer;
  shooter.reloadDuration = ammo.reloadDuration;
  shooter.reloadProgress = 0;
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
    ammo._magEjected = false;
    ammo._pumpEjected = false;
  }
  shooter.isReloading = false;
  shooter.reloadTimer = 0;
  shooter.reloadProgress = 0;
}

/**
 * Wystrzał z broni z obsługą amunicji i automatycznego przeładowania
 */
