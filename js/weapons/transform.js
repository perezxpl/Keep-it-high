// =========================================================================
// WEAPONS/TRANSFORM.JS - KATALOG BRONI, AMUNICJA I KINEMATYKA TRZYMANIA BRONI
// Wydzielony moduł z js/weapons.js
// =========================================================================

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
  GLOCK: {
    id: 'GLOCK',
    name: 'Glock 17',
    fullName: 'GLOCK 17',
    category: 'SECONDARY',
    auto: false,             // Semi-auto precyzyjny pistolet bojowy (pojedynczy strzał na kliknięcie)
    fireRate: 18,            // Realistyczny cykl spustu semi-auto (~3.3 strzałów/s przy 60 FPS)
    damage: 24,              // 4-5 celnych trafień eliminuje cel (100 HP), headshot x2.25 = 54
    bulletSpeed: 30,         // Szybki pocisk 9x19mm Parabellum
    spread: 0.020,           // Wysoka celność pierwszego strzału
    crouchSpreadMult: 0.60,
    recoil: 1.1,             // Sprężysty odrzut zamka blowback
    crouchRecoilMult: 0.50,
    muzzleRise: 0.075,
    kickbackDistance: 2.0,
    ballPush: 0.14,
    bodyPush: 0.026,
    ragdollPushMult: 0.90,
    pellets: 1,
    bulletColor: '#fde047',
    magSize: WEAPON_CONFIG.GLOCK.magSize,
    currentAmmo: WEAPON_CONFIG.GLOCK.currentAmmo,
    reserveAmmo: WEAPON_CONFIG.GLOCK.reserveAmmo,
    reloadTime: WEAPON_CONFIG.GLOCK.reloadTime,
    reloadDuration: Math.round(WEAPON_CONFIG.GLOCK.reloadTime * 60)
  },
  REVOLVER: {
    id: 'REVOLVER',
    name: 'Magnum .44',
    fullName: 'MAGNUM .44',
    category: 'SECONDARY',
    auto: false,
    fireRate: 28,
    damage: 55,
    bulletSpeed: 38,
    spread: 0.012,
    crouchSpreadMult: 0.50,
    recoil: 2.6,
    crouchRecoilMult: 0.45,
    muzzleRise: 0.16,
    kickbackDistance: 4.2,
    ballPush: 0.35,
    bodyPush: 0.08,
    ragdollPushMult: 1.8,
    pellets: 1,
    bulletColor: '#fbbf24',
    magSize: WEAPON_CONFIG.REVOLVER.magSize,
    currentAmmo: WEAPON_CONFIG.REVOLVER.currentAmmo,
    reserveAmmo: WEAPON_CONFIG.REVOLVER.reserveAmmo,
    reloadTime: WEAPON_CONFIG.REVOLVER.reloadTime,
    reloadDuration: Math.round(WEAPON_CONFIG.REVOLVER.reloadTime * 60)
  },
  SAWED_OFF: {
    id: 'SAWED_OFF',
    name: 'Obrzyn 12G',
    fullName: 'SAWED-OFF 12G',
    category: 'SECONDARY',
    auto: false,
    fireRate: 20,
    damage: 12,
    bulletSpeed: 22,
    spread: 0.22,
    crouchSpreadMult: 0.70,
    recoil: 3.2,
    crouchRecoilMult: 0.50,
    muzzleRise: 0.20,
    kickbackDistance: 5.5,
    ballPush: 0.45,
    bodyPush: 0.12,
    ragdollPushMult: 2.4,
    pellets: 8,
    bulletColor: '#fb923c',
    magSize: WEAPON_CONFIG.SAWED_OFF.magSize,
    currentAmmo: WEAPON_CONFIG.SAWED_OFF.currentAmmo,
    reserveAmmo: WEAPON_CONFIG.SAWED_OFF.reserveAmmo,
    reloadTime: WEAPON_CONFIG.SAWED_OFF.reloadTime,
    reloadDuration: Math.round(WEAPON_CONFIG.SAWED_OFF.reloadTime * 60)
  },
  KNIFE: {
    id: 'KNIFE',
    name: 'Nóż M9',
    fullName: 'Nóż M9',
    category: 'MELEE',
    isMelee: true,
    auto: false,
    fireRate: 16,
    damage: 65,
    range: 58,
    bulletSpeed: 0,
    pellets: 0,
    magSize: 0,
    currentAmmo: 0,
    reserveAmmo: 0,
    reloadTime: 0,
    reloadDuration: 0,
    recoil: 0,
    ballPush: 0.65,
    bodyPush: 3.2,
    ragdollPushMult: 1.5
  },
  MACHETE: {
    id: 'MACHETE',
    name: 'Maczeta Kukri',
    fullName: 'Maczeta Kukri',
    category: 'MELEE',
    isMelee: true,
    auto: false,
    fireRate: 24,
    damage: 85,
    range: 72,
    bulletSpeed: 0,
    pellets: 0,
    magSize: 0,
    currentAmmo: 0,
    reserveAmmo: 0,
    reloadTime: 0,
    reloadDuration: 0,
    recoil: 0,
    ballPush: 0.85,
    bodyPush: 5.5,
    ragdollPushMult: 2.0
  },
  AXE: {
    id: 'AXE',
    name: 'Toporek Tomahawk',
    fullName: 'Toporek Tomahawk',
    category: 'MELEE',
    isMelee: true,
    auto: false,
    fireRate: 32,
    damage: 105,
    range: 64,
    bulletSpeed: 0,
    pellets: 0,
    magSize: 0,
    currentAmmo: 0,
    reserveAmmo: 0,
    reloadTime: 0,
    reloadDuration: 0,
    recoil: 0,
    ballPush: 1.0,
    bodyPush: 8.0,
    ragdollPushMult: 2.8
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
  if (bulletParticles.length > 50) {
    bulletParticles.splice(0, bulletParticles.length - 50);
  }
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
  if (bulletParticles.length > 50) {
    bulletParticles.splice(0, bulletParticles.length - 50);
  }
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

export const WEAPON_GRIP_CONFIGS = {
  AK47: {
    rearGripX: 5.2,
    rearGripY: 4.4,
    foreGripX: 15.5,
    foreGripY: 1.3,
    barrelLen: 34.0,
    stockLen: 10.2
  },
  SHOTGUN: {
    rearGripX: 3.9,
    rearGripY: 3.8,
    foreGripX: 13.8,
    foreGripY: 1.3,
    barrelLen: 28.0,
    stockLen: 10.4
  },
  SNIPER: {
    rearGripX: 4.9,
    rearGripY: 4.6,
    foreGripX: 15.2,
    foreGripY: 1.6,
    barrelLen: 45.5,
    stockLen: 11.5
  },
  GLOCK: {
    rearGripX: 1.8,
    rearGripY: 3.8,
    foreGripX: 2.6,
    foreGripY: 3.4,
    barrelLen: 13.5,
    stockLen: 4.0
  },
  REVOLVER: {
    rearGripX: -2.2,
    rearGripY: 3.0,
    foreGripX: -1.4,
    foreGripY: 3.6,
    barrelLen: 17.0,
    stockLen: 4.0
  },
  SAWED_OFF: {
    rearGripX: -1.7,
    rearGripY: 3.1,
    foreGripX: 9.0,
    foreGripY: 1.7,
    barrelLen: 19.5,
    stockLen: 4.5
  },
  KNIFE: {
    rearGripX: -1.0,
    rearGripY: 0.0,
    foreGripX: -4.5,
    foreGripY: -3.5,
    barrelLen: 19.5,
    stockLen: 0.0
  },
  MACHETE: {
    rearGripX: 0.0,
    rearGripY: 0.0,
    foreGripX: -4.0,
    foreGripY: 0.0,
    barrelLen: 24.0,
    stockLen: 0.0
  },
  AXE: {
    rearGripX: 0.0,
    rearGripY: 0.0,
    foreGripX: -4.0,
    foreGripY: 0.0,
    barrelLen: 18.0,
    stockLen: 0.0
  }
};

/**
 * Sekwencja 3-uderzeniowego combo nożem bojowym (Knife 3-Hit Combo Chain)
 */
export const KNIFE_COMBO_MOVES = [
  {
    step: 0,
    name: 'FOREHAND_SLASH',
    label: 'Cięcie ukośne z góry',
    type: 'SLASH',
    totalFrames: 19, windupFrames: 5, activeFrames: 6, recoveryFrames: 8, cooldownFrames: 12,
    arcStart: -0.90,  // ostrze uniesione w prawo-górę (-51 st)
    arcEnd: 1.05,     // cięcie ukośne w poprzek klatki (+60 st)
    reach: 58, width: 28, damage: 55, backstabMultiplier: 1.8,
    lungeForce: 2.0, bodyPush: 3.2, hitstopFrames: 2, screenShake: 4,
    ballPush: { vx: 12.0, vy: -4.0, spin: 0.4 }
  },
  {
    step: 1,
    name: 'BACKHAND_SLICE',
    label: 'Cięcie powrotne z dołu',
    type: 'BACKHAND',
    totalFrames: 19, windupFrames: 5, activeFrames: 6, recoveryFrames: 8, cooldownFrames: 12,
    arcStart: 0.95,   // ostrze z dołu (+54 st)
    arcEnd: -0.85,    // błyskawiczne podcięcie powrotne w górę (-48 st)
    reach: 58, width: 28, damage: 65, backstabMultiplier: 2.0,
    lungeForce: 2.2, bodyPush: 3.6, hitstopFrames: 2, screenShake: 5,
    ballPush: { vx: 13.5, vy: -5.5, spin: -0.5 }
  },
  {
    step: 2,
    name: 'LETHAL_THRUST',
    label: 'Śmiertelne pchnięcie sztychem',
    type: 'THRUST',
    totalFrames: 25, windupFrames: 7, activeFrames: 7, recoveryFrames: 11, cooldownFrames: 22,
    reach: 66, width: 24, damage: 85, backstabMultiplier: 2.2, // 187 dmg - cichy finisher
    lungeForce: 3.8, bodyPush: 6.0, hitstopFrames: 4, screenShake: 8,
    ballPush: { vx: 17.0, vy: -2.5, spin: 0.2 }
  }
];

/**
 * Sekwencja 2-uderzeniowego combo maczetą taktyczną Kukri (Machete 2-Hit Continuous Cleave Chain)
 */
export const MACHETE_COMBO_MOVES = [
  {
    step: 0,
    name: 'OVERHEAD_CLEAVE',
    label: 'Zamaszyste cięcie z góry na dół',
    type: 'OVERHEAD_CLEAVE',
    totalFrames: 36, windupFrames: 12, activeFrames: 10, recoveryFrames: 14, cooldownFrames: 22,
    arcStart: -1.90,  // wysokie uniesienie za plecy / nad głowę (~10:30, -109 st)
    arcEnd: 1.20,     // zamaszyste cięcie w dół przed kolana (~5:00, +69 st)
    reach: 80, width: 44, damage: 85, backstabMultiplier: 1.7,
    lungeForce: 1.4, bodyPush: 5.5, hitstopFrames: 4, screenShake: 9, cleave: true,
    ballPush: { vx: 20.0, vy: -5.0, spin: 0.8 }
  },
  {
    step: 1,
    name: 'UNDERHAND_CLEAVE',
    label: 'Zamaszyste cięcie powrotne z dołu w górę',
    type: 'UNDERHAND_CLEAVE',
    totalFrames: 34, windupFrames: 10, activeFrames: 10, recoveryFrames: 14, cooldownFrames: 34,
    arcStart: 1.55,   // płynny start zamachu z tyłu-dołu (~7:30, +89 st)
    arcEnd: -1.45,    // potężny powrotny zamach omiatający w górę przed twarz (~1:30, -83 st)
    reach: 80, width: 44, damage: 90, backstabMultiplier: 1.8,
    lungeForce: 1.4, bodyPush: 6.0, hitstopFrames: 4, screenShake: 10, cleave: true,
    ballPush: { vx: 21.0, vy: -8.0, spin: -0.8 }
  }
];

/**
 * Konfiguracje fizyki i kinematyki broni białych (Melee Attack Physics)
 */
export const MELEE_CONFIGS = {
  KNIFE: {
    id: 'KNIFE',
    name: 'Nóż Bojowy M9',
    type: 'COMBO',
    comboMoves: KNIFE_COMBO_MOVES,
    totalFrames: 19, windupFrames: 5, activeFrames: 6, recoveryFrames: 8,
    reach: 58, width: 28, damage: 65, backstabMultiplier: 2.0,
    lungeForce: 2.2, bodyPush: 3.5, hitstopFrames: 2, screenShake: 5,
    ballPush: { vx: 14.0, vy: -4.5, spin: 0.3 }
  },
  MACHETE: {
    id: 'MACHETE',
    name: 'Maczeta Kukri',
    type: 'COMBO',
    comboMoves: MACHETE_COMBO_MOVES,
    totalFrames: 36, windupFrames: 12, activeFrames: 10, recoveryFrames: 14,
    arcStart: -1.90, arcEnd: 1.20,
    reach: 80, width: 44, damage: 85, backstabMultiplier: 1.7,
    lungeForce: 1.4, bodyPush: 5.5, hitstopFrames: 4, screenShake: 9, cleave: true,
    ballPush: { vx: 20.0, vy: -5.0, spin: 0.8 }
  },
  AXE: {
    id: 'AXE',
    name: 'Toporek Tomahawk',
    type: 'OVERHEAD_CHOP',
    totalFrames: 26, windupFrames: 8, activeFrames: 6, recoveryFrames: 12, cooldownFrames: 28,
    arcStart: -1.65, // pionowo nad głową (-95 st)
    arcEnd: 0.85,    // druzgocące rąbnięcie w dół (+49 st)
    reach: 64, width: 32, damage: 105, backstabMultiplier: 1.4,
    lungeForce: 3.0, downwardImpact: 1.8, bodyPush: 8.0, staggerDuration: 22,
    hitstopFrames: 6, screenShake: 14,
    ballPush: { vx: 21.0, vy: 5.0, spin: 0.4 },
    cleave: false
  }
};

/**
 * Wyliczenie transformacji broni i wektorów podparcia dłoni dla praworęcznego strzelca
 */
export function getWeaponHoldTransform(p) {
  const charFacing = p.facing || 1;
  const { rightShoulderX, rightShoulderY, leftShoulderX, leftShoulderY, hipX, hipY } = getShooterShoulderPos(p);
  const weapon = p.currentWeapon || WEAPONS.AK47;
  const wepKey = (weapon && weapon.id && WEAPON_GRIP_CONFIGS[weapon.id]) ? weapon.id : 'AK47';
  const gripCfg = WEAPON_GRIP_CONFIGS[wepKey] || WEAPON_GRIP_CONFIGS.AK47;
  const isShotgun = (weapon.id === 'SHOTGUN');
  const isSniper = (weapon.id === 'SNIPER');
  const isPistol = (weapon.id === 'GLOCK' || weapon.id === 'REVOLVER' || weapon.id === 'SAWED_OFF');
  const isTwoHandedHandgun = (weapon.id === 'GLOCK' || weapon.id === 'REVOLVER');
  const isKnife = (weapon.id === 'KNIFE');
  const isMachete = (weapon.id === 'MACHETE');
  const isAxe = (weapon.id === 'AXE');
  const isMelee = !!(weapon.isMelee || isKnife || isMachete || isAxe);
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
      barrelLen: gripCfg.barrelLen
    };
  }

  const aimX = (typeof p.aimX === 'number' && !isNaN(p.aimX)) ? p.aimX : (rightShoulderX + charFacing * 120);
  const aimY = (typeof p.aimY === 'number' && !isNaN(p.aimY)) ? p.aimY : rightShoulderY;

  // STAN 1: Luźne trzymanie (Low-Ready / Patrol Carry / Melee Ready)
  const headBobOffset = (p.headBob || 0) * 0.70;
  const crouchDropY = isCrouch ? 4 : 0;
  let loosePivotX;
  let loosePivotY;
  let directAngle;
  let looseAimAngle;

  if (isKnife) {
    // Pozycja bojowa gotowości z nożem (Combat Low-Ready):
    // Ręka z nożem przy prawym boku/biodrze, ostrze skierowane lekko w górę
    loosePivotX = hipX + 7.5 * charFacing;
    loosePivotY = hipY - 14.0 + headBobOffset + crouchDropY;
    directAngle = Math.atan2(aimY - loosePivotY, (aimX - loosePivotX) * charFacing);
    if (directAngle < -Math.PI / 2) {
      directAngle = Math.max(-1.66, directAngle);
    } else if (directAngle > Math.PI / 2 + 0.35) {
      directAngle = Math.min(Math.PI / 2 + 0.35, directAngle);
    }
    looseAimAngle = directAngle * 0.40 - 0.22;
  } else if (isMachete) {
    // Pozycja gotowości z maczetą (Machete Low-Ready):
    // Ręka z maczetą pewnie przy boku, ostrze uniesione w górę pod kątem ~ -60 st
    loosePivotX = hipX + 9.5 * charFacing;
    loosePivotY = hipY - 11.0 + headBobOffset + crouchDropY;
    directAngle = Math.atan2(aimY - loosePivotY, (aimX - loosePivotX) * charFacing);
    if (directAngle < -Math.PI / 2) {
      directAngle = Math.max(-1.66, directAngle);
    } else if (directAngle > Math.PI / 2 + 0.35) {
      directAngle = Math.min(Math.PI / 2 + 0.35, directAngle);
    }
    looseAimAngle = -1.05 + directAngle * 0.15;
  } else if (isAxe) {
    // Pozycja gotowości z toporkiem tomahawk w jednej ręce (Tomahawk Low-Ready):
    // Prawa ręka trzyma stylisko przy biodrze, głowica uniesiona pod kątem
    loosePivotX = hipX + 8.5 * charFacing;
    loosePivotY = hipY - 12.0 + headBobOffset + crouchDropY;
    directAngle = Math.atan2(aimY - loosePivotY, (aimX - loosePivotX) * charFacing);
    if (directAngle < -Math.PI / 2) {
      directAngle = Math.max(-1.66, directAngle);
    } else if (directAngle > Math.PI / 2 + 0.35) {
      directAngle = Math.min(Math.PI / 2 + 0.35, directAngle);
    }
    looseAimAngle = -0.95 + directAngle * 0.18;
  } else {
    loosePivotX = hipX + (isSniper ? 6.5 : (isShotgun ? 5.2 : (isPistol ? 4.5 : 5.8))) * charFacing;
    loosePivotY = hipY - (isSniper ? 11.5 : (isShotgun ? 9.5 : (isPistol ? 8.5 : 10.5))) + headBobOffset + crouchDropY;
    directAngle = Math.atan2(aimY - loosePivotY, (aimX - loosePivotX) * charFacing);
    if (directAngle < -Math.PI / 2) {
      directAngle = Math.max(-1.66, directAngle);
    } else if (directAngle > Math.PI / 2 + 0.35) {
      directAngle = Math.min(Math.PI / 2 + 0.35, directAngle);
    }
    const idleDroop = isSniper ? 0.22 : (isShotgun ? 0.35 : (isPistol ? 0.16 : 0.26));
    looseAimAngle = directAngle + idleDroop;
  }

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
  const shoulderPocketX = rightShoulderX + (isPistol ? 6.5 : -0.5) * charFacing;
  const shoulderPocketY = rightShoulderY - (isPistol ? 0.5 : 2.2) + braceOffsetY;
  const stockLen = gripCfg.stockLen || 0;
  const muzzleRise = (p.muzzleRise || 0) * (isCrouch ? 0.55 : 1.0);

  let shoulderPivotX;
  let shoulderPivotY;
  let shoulderAimAngle;

  if (isKnife) {
    // Dynamiczne wysunięcie noża w stronę kursora (Combat Knife Extension)
    const knifeReachDist = 14.5;
    shoulderAimAngle = directAngle;
    shoulderPivotX = rightShoulderX + Math.cos(directAngle) * knifeReachDist * charFacing;
    shoulderPivotY = rightShoulderY + Math.sin(directAngle) * knifeReachDist + braceOffsetY;
  } else if (isMachete) {
    // Gotowość bojowa z uniesioną maczetą kukri (Machete Slashing Stance):
    // Dłoń wysunięta pewnie do przodu (dx ~ 12.0 px), ostrze uniesione i gotowe do zamachu tnącego (~ -51 st)
    shoulderAimAngle = -0.90 + directAngle * 0.40;
    shoulderPivotX = rightShoulderX + 12.0 * charFacing;
    shoulderPivotY = rightShoulderY + 4.0 + braceOffsetY;
  } else if (isAxe) {
    // Gotowość bojowa z uniesionym toporkiem w jednej dłoni (Tomahawk Chambered Stance)
    shoulderAimAngle = -0.85 + directAngle * 0.35;
    shoulderPivotX = rightShoulderX + 11.5 * charFacing;
    shoulderPivotY = rightShoulderY + 4.5 + braceOffsetY;
  } else if (isTwoHandedHandgun) {
    // Postawa oburęczna z wyprostowanymi ramionami (Modern Isosceles / Two-Handed Handgun Extension)
    const chestCenterX = (rightShoulderX + leftShoulderX) * 0.5;
    const chestCenterY = (rightShoulderY + leftShoulderY) * 0.5 + braceOffsetY;
    let rawPistolAngle = Math.atan2(aimY - chestCenterY, (aimX - chestCenterX) * charFacing);
    if (rawPistolAngle < -Math.PI / 2) rawPistolAngle = Math.max(-1.66, rawPistolAngle);
    else if (rawPistolAngle > Math.PI / 2 + 0.35) rawPistolAngle = Math.min(Math.PI / 2 + 0.35, rawPistolAngle);
    shoulderAimAngle = rawPistolAngle - muzzleRise;
    const totalArmReach = (p.upperArmLen || 14) + (p.forearmLen || 13);
    const avgGripX = ((gripCfg.rearGripX || 0) + (gripCfg.foreGripX || 0)) * 0.5;
    // Wyprostowane łokcie (~90% zasięgu ramion) do celowania i strzelania
    const targetHandDist = totalArmReach * 0.90;
    const pistolExtension = targetHandDist - avgGripX;
    shoulderPivotX = chestCenterX + Math.cos(shoulderAimAngle) * pistolExtension * charFacing;
    shoulderPivotY = chestCenterY + Math.sin(shoulderAimAngle) * pistolExtension;
  } else {
    let rawShoulderAngle = Math.atan2(aimY - shoulderPocketY, (aimX - shoulderPocketX) * charFacing);
    if (rawShoulderAngle < -Math.PI / 2) rawShoulderAngle = Math.max(-1.66, rawShoulderAngle);
    else if (rawShoulderAngle > Math.PI / 2 + 0.35) rawShoulderAngle = Math.min(Math.PI / 2 + 0.35, rawShoulderAngle);
    shoulderAimAngle = rawShoulderAngle - muzzleRise;
    shoulderPivotX = shoulderPocketX + Math.cos(shoulderAimAngle) * stockLen * charFacing;
    shoulderPivotY = shoulderPocketY + Math.sin(shoulderAimAngle) * stockLen;
  }

  const w = (typeof p.shootPoseWeight === 'number') ? p.shootPoseWeight : 0.0;
  const rawPivotX = loosePivotX + (shoulderPivotX - loosePivotX) * w;
  const rawPivotY = loosePivotY + (shoulderPivotY - loosePivotY) * w;
  // Punkty podparcia dłoni w spoczynku / strzale z precyzyjnej mapy geometrii WEAPON_GRIP_CONFIGS
  const rearGripDistX = gripCfg.rearGripX;
  const rearGripDistY = gripCfg.rearGripY;
  const pumpShift = isShotgun ? (p.pumpOffset || 0) : 0;
  // Wyprostowana ręka taktyczna z naturalnym, sprężystym ugięciem łokcia
  const foreGripDistX = gripCfg.foreGripX + pumpShift;
  const foreGripDistY = gripCfg.foreGripY;

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
    reloadAngleOffset = (isShotgun ? -0.28 : (isPistol ? -0.24 : -0.20)) * reloadEnv;
    reloadPivotShiftX = (isPistol ? -1.5 : -2.5) * reloadEnv * charFacing;
    reloadPivotShiftY = (isPistol ? 1.2 : 1.8) * reloadEnv;

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
    } else if (isPistol) {
      // -------------------------------------------------------------
      // GLOCK 17 RELOAD ANIMATION (TACTICAL 9MM MAG SWAP & SLIDE RACK)
      // -------------------------------------------------------------
      if (u < 0.22) {
        // Faza 1: Zwolnienie zatrzasku magazynka i opuszczenie lewej ręki do pasa
        const t = u / 0.22;
        leftHandLocalX = lerp(foreGripDistX, -2.0, ease(t));
        leftHandLocalY = lerp(foreGripDistY, 14.0, ease(t));
        isMagInGun = (u < 0.12);
      } else if (u < 0.45) {
        // Faza 2: Chwyt nowego magazynka 9mm przy ładownicy
        const t = (u - 0.22) / 0.23;
        leftHandLocalX = lerp(-2.0, -1.0, ease(t));
        leftHandLocalY = lerp(14.0, 12.0, ease(t));
        isMagInGun = false;
        heldMag = { type: 'GLOCK', x: leftHandLocalX, y: leftHandLocalY, angle: -0.25 };
      } else if (u < 0.70) {
        // Faza 3: Uniesienie magazynka i wprowadzenie do gniazda w chwycie
        const t = (u - 0.45) / 0.25;
        leftHandLocalX = lerp(-1.0, 0.8, ease(t));
        leftHandLocalY = lerp(12.0, 6.0, ease(t));
        isMagInGun = false;
        heldMag = { type: 'GLOCK', x: leftHandLocalX, y: leftHandLocalY, angle: -0.15 };
        if (t > 0.85) {
          // Zatrzaśnięcie magazynka w chwycie (Mag slap)
          const snapT = (t - 0.85) / 0.15;
          reloadAngleOffset -= Math.sin(snapT * Math.PI) * 0.09;
          reloadPivotShiftY -= Math.sin(snapT * Math.PI) * 1.2;
        }
      } else if (u < 0.84) {
        // Faza 4: Magazynek zaryglowany, ruch ręki w górę na zamek (Slide Rack)
        isMagInGun = true;
        const t = (u - 0.70) / 0.14;
        leftHandLocalX = lerp(0.8, 1.5, ease(t));
        leftHandLocalY = lerp(6.0, -3.2, ease(t));
      } else if (u < 0.92) {
        // Faza 5: Odciągnięcie zamka i zrzut (Chambering 9mm round)
        isMagInGun = true;
        const t = (u - 0.84) / 0.08;
        const pull = Math.sin(t * Math.PI);
        boltOffset = -pull * 2.8;
        leftHandLocalX = 1.5 + boltOffset;
        leftHandLocalY = -3.2;
        if (t > 0.5) reloadAngleOffset += Math.sin(t * Math.PI) * 0.05;
      } else {
        // Faza 6: Powrót ręki do dwuręcznego chwytu pistoletu
        isMagInGun = true;
        const t = (u - 0.92) / 0.08;
        leftHandLocalX = lerp(1.5, foreGripDistX, ease(t));
        leftHandLocalY = lerp(-3.2, foreGripDistY, ease(t));
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

  // Proceduralna kinematyka i trajektoria poszczególnych broni białych (Melee Physics)
  let meleeAngleOffset = 0;
  if (isMelee) {
    const ms = p.meleeState;
    const wepId = weapon.id || 'KNIFE';
    const cfg = (ms && ms.cfg) ? ms.cfg : (MELEE_CONFIGS[wepId] || MELEE_CONFIGS.KNIFE);

    if (ms) {
      const timer = ms.timer;
      const wFrames = cfg.windupFrames || 2;
      const aFrames = cfg.activeFrames || 3;
      const rFrames = cfg.recoveryFrames || 5;

      if (isMachete) {
        // Proceduralna kinematyka 2D profilu maczety (Machete 2D Profile Sweeps)
        const isMove1 = (cfg.name === 'UNDERHAND_CLEAVE' || cfg.type === 'UNDERHAND_CLEAVE' || cfg.name === 'BACKHAND_CLEAVE' || ms.comboStep === 1);
        let dx, dy, targetAngle;

        if (ms.phase === 'WINDUP') {
          const u = Math.min(1.0, Math.max(0.0, timer / Math.max(1, wFrames)));
          const s = ease(u);
          if (isMove1) {
            // Ruch 1 (Cięcie powrotne z dołu w górę): Przygotowanie zamachu z tyłu-dołu (~7:30, +89 st)
            dx = lerp(13.0, -3.0, s);
            dy = lerp(14.0, 16.0, s);
            targetAngle = lerp(1.10, 1.55, s);
            leftHandLocalX = -2.0 * s;
            leftHandLocalY = -3.0 * s;
          } else {
            // Ruch 0 (Zamaszyste cięcie z góry na dół): Wysokie uniesienie za bark / nad głowę (~10:30, -109 st)
            dx = lerp(12.0, -4.0, s);
            dy = lerp(4.0, -14.0, s);
            targetAngle = lerp(-0.90, -1.90, s);
            leftHandLocalX = 4.0 * s;
            leftHandLocalY = -2.0 * s;
          }
          p.meleeTorsoTilt = 0;
        } else if (ms.phase === 'ACTIVE') {
          const activeTimer = timer - wFrames;
          const u = Math.min(1.0, Math.max(0.0, activeTimer / Math.max(1, aFrames)));
          const s = Math.sin(u * Math.PI * 0.5);
          const t = u;
          const inv = 1 - t;
          if (isMove1) {
            // Ruch 1: Potężny powrotny zamach omiatający od dołu w górę przed twarz (~1:30, -83 st)
            dx = inv * inv * (-3.0) + 2 * inv * t * 24.0 + t * t * 15.0;
            dy = inv * inv * 16.0 + 2 * inv * t * 6.0 + t * t * (-12.0);
            targetAngle = lerp(1.55, -1.45, s);
            leftHandLocalX = lerp(-2.0, 2.0, s);
            leftHandLocalY = lerp(-3.0, 2.0, s);
          } else {
            // Ruch 0: Zamaszyste cięcie po łuku w dół przed kolana (~5:00, +69 st)
            dx = inv * inv * (-4.0) + 2 * inv * t * 25.0 + t * t * 16.0;
            dy = inv * inv * (-14.0) + 2 * inv * t * (-2.0) + t * t * 16.0;
            targetAngle = lerp(-1.90, 1.20, s);
            leftHandLocalX = lerp(4.0, -4.0, s);
            leftHandLocalY = lerp(-2.0, 2.0, s);
          }
          p.meleeTorsoTilt = 0;
        } else { // RECOVERY
          const recTimer = timer - wFrames - aFrames;
          const u = Math.min(1.0, Math.max(0.0, recTimer / Math.max(1, rFrames)));
          const s = ease(u);
          if (isMove1) {
            // Ruch 1: Płynny powrót z wysokiego wykończenia do neutralnej pozycji gotowości
            dx = lerp(15.0, 12.0, s);
            dy = lerp(-12.0, 4.0, s);
            targetAngle = lerp(-1.45, -0.90, s);
            leftHandLocalX = lerp(2.0, 0.0, s);
            leftHandLocalY = lerp(2.0, 0.0, s);
          } else {
            // Ruch 0: Wyhamowanie w dolnej strefie (13, 14), skąd natychmiast płynnie startuje Ruch 1
            dx = lerp(16.0, 13.0, s);
            dy = lerp(16.0, 14.0, s);
            targetAngle = lerp(1.20, 1.10, s);
            leftHandLocalX = lerp(-4.0, 0.0, s);
            leftHandLocalY = lerp(2.0, 0.0, s);
          }
          p.meleeTorsoTilt = 0;
        }

        const aimBias = (typeof directAngle === 'number') ? directAngle * 0.40 : 0;
        const cosB = Math.cos(aimBias);
        const sinB = Math.sin(aimBias);
        const rotX = dx * cosB - dy * sinB;
        const rotY = dx * sinB + dy * cosB;

        finalPivotX = rightShoulderX + rotX * charFacing;
        finalPivotY = rightShoulderY + rotY + braceOffsetY;
        meleeAngleOffset = (targetAngle + aimBias) - blendedAngle;
      } else {
        let shiftForward = 0;
        let shiftY = 0;

        if (ms.phase === 'WINDUP') {
          const u = Math.min(1.0, timer / Math.max(1, wFrames));
          const s = ease(u);
          if (cfg.name === 'FOREHAND_SLASH') {
            // Nóż Ruch 1: Uniesienie łokcia i ostrza w prawo-górę (-48 st), garda lewej dłoni przy szyi
            meleeAngleOffset = cfg.arcStart * s;
            shiftForward = -6.0 * s;
            shiftY = -6.0 * s;
            leftHandLocalX = -4.0 * s;
            leftHandLocalY = -8.0 * s;
            p.meleeTorsoTilt = -0.10 * charFacing * s;
          } else if (cfg.name === 'BACKHAND_SLICE') {
            // Nóż Ruch 2: Błyskawiczny obrót nadgarstka, ostrze od dołu-lewej (+51 st)
            meleeAngleOffset = cfg.arcStart * s;
            shiftForward = -4.0 * s;
            shiftY = 6.0 * s;
            leftHandLocalX = 2.0 * s;
            leftHandLocalY = -3.0 * s;
            p.meleeTorsoTilt = 0.06 * charFacing * s;
          } else if (cfg.name === 'LETHAL_THRUST' || cfg.type === 'THRUST') {
            // Nóż Ruch 3: Głębokie cofnięcie ostrza do żeber, lewa ręka odciągnięta w tył (ładowanie energii)
            shiftForward = -10.0 * s;
            shiftY = -2.0 * s;
            leftHandLocalX = -10.0 * s;
            leftHandLocalY = 3.0 * s;
            p.meleeTorsoTilt = -0.16 * charFacing * s;
          } else if (cfg.type === 'OVERHEAD_CHOP') {
            // Toporek: ciężkie uniesienie topora pionowo nad głowę (overhead chambering)
            meleeAngleOffset = cfg.arcStart * s;
            shiftForward = -8.0 * s;
            shiftY = -18.0 * s;
            leftHandLocalX = 0;
            leftHandLocalY = -10.0 * s;
            p.meleeTorsoTilt = -0.22 * charFacing * s;
          }
        } else if (ms.phase === 'ACTIVE') {
          const activeTimer = timer - wFrames;
          const u = Math.min(1.0, Math.max(0.0, activeTimer / Math.max(1, aFrames)));
          const s = Math.sin(u * Math.PI * 0.5);

          if (cfg.name === 'FOREHAND_SLASH') {
            // Nóż Ruch 1: Cięcie ukośne z góry w dół w poprzek klatki (-48 st -> +54 st)
            meleeAngleOffset = lerp(cfg.arcStart, cfg.arcEnd, s);
            shiftForward = lerp(-6.0, 20.0, s);
            shiftY = lerp(-6.0, 8.0, s);
            leftHandLocalX = -4.0;
            leftHandLocalY = -7.0;
            p.meleeTorsoTilt = lerp(-0.10, 0.16, s) * charFacing;
          } else if (cfg.name === 'BACKHAND_SLICE') {
            // Nóż Ruch 2: Błyskawiczne podcięcie z dołu w górę (+51 st -> -46 st)
            meleeAngleOffset = lerp(cfg.arcStart, cfg.arcEnd, s);
            shiftForward = lerp(-4.0, 18.0, s);
            shiftY = lerp(6.0, -8.0, s);
            leftHandLocalX = 2.0;
            leftHandLocalY = -3.0;
            p.meleeTorsoTilt = lerp(0.06, -0.12, s) * charFacing;
          } else if (cfg.name === 'LETHAL_THRUST' || cfg.type === 'THRUST') {
            // Nóż Ruch 3: Eksplozja tłokowa prosto w celownik z maksymalnym wyprostem
            const thrustProg = Math.sin(u * Math.PI * 0.5);
            shiftForward = -10.0 + 38.0 * thrustProg;
            shiftY = -2.0 + 1.0 * u;
            leftHandLocalX = -10.0;
            leftHandLocalY = 3.0;
            p.meleeTorsoTilt = 0.22 * charFacing * thrustProg;
          } else if (cfg.type === 'OVERHEAD_CHOP') {
            // Toporek: potężne przyspieszenie w dół (grawitacja + masa obucha)
            const sChop = u * u;
            meleeAngleOffset = lerp(cfg.arcStart, cfg.arcEnd, sChop);
            shiftForward = lerp(-8.0, 20.0, sChop);
            shiftY = lerp(-18.0, 16.0, sChop);
            leftHandLocalX = lerp(0, -6.0, sChop);
            leftHandLocalY = lerp(-10.0, 0, sChop);
            p.meleeTorsoTilt = lerp(-0.22, 0.28, sChop) * charFacing;
          }
        } else { // RECOVERY
          const recTimer = timer - wFrames - aFrames;
          const u = Math.min(1.0, Math.max(0.0, recTimer / Math.max(1, rFrames)));
          const s = ease(u);

          if (cfg.name === 'FOREHAND_SLASH') {
            meleeAngleOffset = lerp(cfg.arcEnd, 0.0, s);
            shiftForward = lerp(20.0, 0.0, s);
            shiftY = lerp(8.0, 0.0, s);
            leftHandLocalX = lerp(-4.0, 0.0, s);
            leftHandLocalY = lerp(-7.0, 0.0, s);
            p.meleeTorsoTilt = lerp(0.16, 0.0, s) * charFacing;
          } else if (cfg.name === 'BACKHAND_SLICE') {
            meleeAngleOffset = lerp(cfg.arcEnd, 0.0, s);
            shiftForward = lerp(18.0, 0.0, s);
            shiftY = lerp(-8.0, 0.0, s);
            leftHandLocalX = lerp(2.0, 0.0, s);
            leftHandLocalY = lerp(-3.0, 0.0, s);
            p.meleeTorsoTilt = lerp(-0.12, 0.0, s) * charFacing;
          } else if (cfg.name === 'LETHAL_THRUST' || cfg.type === 'THRUST') {
            shiftForward = 28.0 * (1.0 - s);
            leftHandLocalX = lerp(-10.0, 0.0, s);
            leftHandLocalY = lerp(3.0, 0.0, s);
            p.meleeTorsoTilt = 0.22 * charFacing * (1.0 - s);
          } else if (cfg.type === 'OVERHEAD_CHOP') {
            const rebound = Math.sin(u * Math.PI) * 4.0;
            meleeAngleOffset = lerp(cfg.arcEnd, 0.0, s) - rebound * 0.04;
            shiftForward = lerp(20.0, 0.0, s);
            shiftY = lerp(16.0, 0.0, s) - rebound;
            p.meleeTorsoTilt = lerp(0.28, 0.0, s) * charFacing;
          }
        }

        const attackVectorAngle = (isMelee && typeof directAngle === 'number') ? directAngle : blendedAngle;
        finalPivotX += Math.cos(attackVectorAngle) * shiftForward * charFacing - Math.sin(attackVectorAngle) * shiftY * charFacing;
        finalPivotY += Math.sin(attackVectorAngle) * shiftForward + Math.cos(attackVectorAngle) * shiftY;
      }
    } else if (p.meleeAttackTimer > 0 && !isMachete) {
      const meleeProg = p.meleeAttackTimer / 12;
      const thrustDist = Math.sin(meleeProg * Math.PI) * 14.0;
      finalPivotX += Math.cos(blendedAngle) * thrustDist * charFacing;
      finalPivotY += Math.sin(blendedAngle) * thrustDist;
    } else {
      const isMeleeStance = isKnife && !p.isProne;
      p.meleeTorsoTilt = isMeleeStance ? 0.04 * charFacing : 0;
    }
  }

  let proneAimAngle = blendedAngle + meleeAngleOffset;

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
  let leftHandWorldX;
  let leftHandWorldY;

  if (isKnife && !p.isProne) {
    // Lewa ręka w taktycznej gardzie CQC (Tactical Guard & Parry Pose)
    const guardBaseX = rightShoulderX + 2.0 * charFacing;
    const guardBaseY = rightShoulderY + 4.0 + headBobOffset;
    const aimFwd = Math.cos(directAngle);
    const aimUp = Math.sin(directAngle);

    // Subtelne ukierunkowanie gardy w stronę celu
    const guardX = guardBaseX + (aimFwd * 5.0) * charFacing;
    const guardY = guardBaseY + (aimUp * 4.0);

    leftHandWorldX = guardX + (leftHandLocalX || 0) * charFacing;
    leftHandWorldY = guardY + (leftHandLocalY || 0);
  } else if ((isMachete || isAxe) && !p.isProne) {
    // Lewa ręka w naturalnej gardzie taktycznej i równoważącej tułów (One-Handed Grip)
    // Dłoń wysunięta przed lewy bark i klatkę piersiową z naturalnym ugięciem łokcia
    const guardBaseX = leftShoulderX + (isAxe ? 8.5 : 10.0) * charFacing;
    const guardBaseY = leftShoulderY + (isAxe ? 5.0 : 6.0) + headBobOffset;
    const aimFwd = Math.cos(directAngle);
    const aimUp = Math.sin(directAngle);

    const guardX = guardBaseX + (aimFwd * 3.5) * charFacing;
    const guardY = guardBaseY + (aimUp * 2.5);

    leftHandWorldX = guardX + (leftHandLocalX || 0) * charFacing;
    leftHandWorldY = guardY + (leftHandLocalY || 0);
  } else {
    leftHandWorldX = finalPivotX + (Math.cos(proneAimAngle) * leftHandLocalX - Math.sin(proneAimAngle) * leftHandLocalY) * charFacing;
    leftHandWorldY = finalPivotY + (Math.sin(proneAimAngle) * leftHandLocalX + Math.cos(proneAimAngle) * leftHandLocalY);
  }

  if (slingWeight > 0) {
    finalPivotX = lerp(finalPivotX, slingPivotX, slingWeight);
    finalPivotY = lerp(finalPivotY, slingPivotY, slingWeight);
    proneAimAngle = lerpAngle(proneAimAngle, slingAngle, slingWeight);
    rightHandWorldX = lerp(rightHandWorldX, slingPivotX + 2 * charFacing, slingWeight);
    rightHandWorldY = lerp(rightHandWorldY, slingPivotY + 3, slingWeight);
    leftHandWorldX = lerp(leftHandWorldX, slingPivotX + (isSniper ? 18 : 14) * charFacing, slingWeight);
    leftHandWorldY = lerp(leftHandWorldY, slingPivotY + 2, slingWeight);
  }

  const barrelLength = gripCfg.barrelLen;
  const bladeReach = (wepKey === 'MACHETE' ? 24.0 : (wepKey === 'AXE' ? 26.0 : 22.0));
  const hiltReach = 0.5;
  const tipX = finalPivotX + Math.cos(proneAimAngle) * bladeReach * charFacing;
  const tipY = finalPivotY + Math.sin(proneAimAngle) * bladeReach;
  const hiltX = finalPivotX + Math.cos(proneAimAngle) * hiltReach * charFacing;
  const hiltY = finalPivotY + Math.sin(proneAimAngle) * hiltReach;

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
    bladeTip: { x: tipX, y: tipY },
    bladeHilt: { x: hiltX, y: hiltY },
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
