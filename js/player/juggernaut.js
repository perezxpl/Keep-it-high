// =========================================================================
// PLAYER/JUGGERNAUT.JS - PANCERZ BALISTYCZNY JUGGERNAUT [KOLOS]
// Ciężki pancerz szturmowy (EOD / Bulldozer): wielowarstwowa płyta klatki,
// wysoki kołnierz balistyczny, masywne naramienniki, karwasze, nagolenniki,
// zasobnik amunicji na plecach, przyłbica bez anteny i ciężkie wejście.
// Zero shadowBlur (stałe 60 FPS), zero emojis.
// =========================================================================

import { WEAPONS } from '../weapons/transform.js';
import { triggerScreenShake } from '../camera.js';
import { GROUND_Y, spawnGroundPuff, spawnJetpackSparks } from '../world/state.js';
import { addDynamicLight } from '../lighting/index.js';
import { playSound } from '../audio/index.js';

const JUGG_GOLD = '#eab308';
const JUGG_AMBER = '#facc15';
const JUGG_ORANGE = '#f97316';
const JUGG_VISOR_CORE = '#fef08a';
const JUGG_STEEL_EDGE = '#94a3b8';
const JUGG_STEEL_LIGHT = '#475569';
const JUGG_STEEL_MID = '#1e293b';
const JUGG_STEEL_DARK = '#0f172a';
const JUGG_RIM = '#05070b';

export const JUGGERNAUT_ARMOR_HP = 250;

/**
 * Aktywuje pełne wyposażenie Juggernauta (osobne 250 HP pancerza + pełne HP operatora + M134 Minigun + ciężkie wejście)
 * @param {object} target - postać (gracz / bot / zdalny gracz)
 * @param {object} [options] - { fromNetwork, skipWeaponEquip }
 */
export function activateJuggernautMode(target, options = {}) {
  if (!target) return;

  const classMaxHp = target.currentClass?.stats?.maxHp || target.currentClass?.stats?.hp || 100;
  target.isJuggernaut = true;
  target.juggernautDeployAnim = 1.0;
  target.maxHp = classMaxHp;
  target.hp = classMaxHp;
  target.hasVest = true;
  target.vestHp = JUGGERNAUT_ARMOR_HP;
  target.vestMaxHp = JUGGERNAUT_ARMOR_HP;
  target.hasHelmet = true;
  target.helmetHits = 3;

  if (target.visuals) {
    target.visuals.hasVest = true;
    target.visuals.hasHelmet = true;
  }

  // Wyposażenie w ciężkiego M134 Miniguna (zgodnie z opisem nagrody [KOLOS])
  if (!options.skipWeaponEquip && WEAPONS && WEAPONS.MINIGUN) {
    if (!target.ammo) target.ammo = {};
    target.ammo.MINIGUN = {
      magSize: WEAPONS.MINIGUN.magSize || 150,
      currentAmmo: WEAPONS.MINIGUN.magSize || 150,
      reserveAmmo: WEAPONS.MINIGUN.reserveAmmo || 300,
      reloadDuration: WEAPONS.MINIGUN.reloadDuration || 210,
      reloadTime: WEAPONS.MINIGUN.reloadTime || 3.5,
      isReloading: false,
      reloadTimer: 0
    };

    if (target.loadout?.pocket1?.slots) {
      target.loadout.pocket1.slots[0] = 'MINIGUN';
      target.loadout.pocket1.activeSlotIndex = 0;
    }

    target.currentWeapon = WEAPONS.MINIGUN;
    target._previousFirearm = WEAPONS.MINIGUN;
    target.isHolstered = false;
    target.holsterWeight = 0;
    target.isReloading = false;
    target.reloadTimer = 0;
    target.weaponKickback = 0;
    target.muzzleRise = 0;
    if (target.throwAnim) {
      target.throwAnim.active = false;
      target.throwAnim.aiming = false;
    }
  }

  // Ciężki efekt wejścia w świecie gry (wstrząs, iskry pancerza, rozbłysk, ciężki huk stali)
  const cx = (target.x || 0) + (target.w || 26) * 0.5;
  const cy = (target.y || 0) + (target.h || 70) * 0.5;
  const floorY = (typeof target.currentGroundY === 'number')
    ? target.currentGroundY
    : ((target.y || 0) + (target.h || 70) || GROUND_Y);

  const isLocal = !target.isBot && !target.isRemote;
  triggerScreenShake(isLocal ? 6.8 : 3.4);
  if (typeof spawnGroundPuff === 'function') {
    spawnGroundPuff(cx, floorY);
  }
  if (typeof spawnJetpackSparks === 'function') {
    spawnJetpackSparks(cx, cy, 1, 26, [JUGG_GOLD, JUGG_AMBER, JUGG_ORANGE, '#ffffff', JUGG_STEEL_EDGE], 0, -3.0);
  }
  if (typeof addDynamicLight === 'function') {
    addDynamicLight({
      x: cx,
      y: cy,
      radius: 230,
      color: JUGG_AMBER,
      intensity: 0.95,
      duration: 0.45,
      expand: true
    });
  }
  if (typeof playSound === 'function') {
    playSound('enforcer_ground_slam', { x: cx, y: cy, gainScale: isLocal ? 0.95 : 0.72 });
    playSound('hit_armor', { x: cx, y: cy, gainScale: isLocal ? 1.1 : 0.8 });
  }
}

/**
 * Zdejmuje status i statystyki Juggernauta przy zgonie / odrodzeniu
 */
export function clearJuggernautMode(target) {
  if (!target) return;
  target.isJuggernaut = false;
  target.juggernautDeployAnim = 0;
  const classMaxHp = target.currentClass?.stats?.maxHp || target.currentClass?.stats?.hp || 100;
  target.maxHp = classMaxHp;
  if (typeof target.hp === 'number' && target.hp > classMaxHp) {
    target.hp = classMaxHp;
  }
  target.vestMaxHp = 60;
  if (typeof target.vestHp === 'number' && target.vestHp > 60) {
    target.vestHp = 60;
  }
  target.helmetHits = 2;
}

/**
 * Rysuje masywny pancerz tułowia Kolosa: wielowarstwową zbroję piersiową, wysoki kołnierz EOD,
 * zasobnik amunicji na plecach, wzmocniony pas taktyczny i fartuch balistyczny
 */
export function drawJuggernautTorsoArmor(ctx, p, absCos, absSin, cosYaw, isLookingAway, shoulderHalfW, waistHalfW, waistY, fDir) {
  const chestW = shoulderHalfW + 2.2;
  const bellyW = waistHalfW + 1.6;

  const armorGrad = ctx.createLinearGradient(-chestW, 0, chestW, 0);
  armorGrad.addColorStop(0.0, JUGG_STEEL_DARK);
  armorGrad.addColorStop(0.28, JUGG_STEEL_MID);
  armorGrad.addColorStop(0.55, JUGG_STEEL_LIGHT);
  armorGrad.addColorStop(0.78, JUGG_STEEL_MID);
  armorGrad.addColorStop(1.0, JUGG_STEEL_DARK);

  // 1. Ciężki moduł zasilania / opancerzony zasobnik na plecach (widoczny w profilu i z tyłu)
  if (absCos > 0.22 || isLookingAway) {
    const packDir = isLookingAway ? 0 : -fDir;
    const packCenterX = isLookingAway ? 0 : packDir * (bellyW + 2.4);
    const packW = isLookingAway ? bellyW * 1.45 : 5.4;
    const packLeft = packCenterX - packW * 0.5;
    const packTop = -23.4;
    const packH = 18.6;

    ctx.fillStyle = JUGG_STEEL_DARK;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(packLeft, packTop, packW, packH, 1.8);
    else ctx.rect(packLeft, packTop, packW, packH);
    ctx.fill();
    ctx.strokeStyle = JUGG_RIM;
    ctx.lineWidth = 1.05;
    ctx.stroke();

    // Stalowe żebra i pomarańczowo-złoty rdzeń zasilania podajnika Miniguna
    ctx.fillStyle = JUGG_STEEL_LIGHT;
    ctx.fillRect(packLeft + 0.8, packTop + 1.8, packW - 1.6, 2.2);
    ctx.fillStyle = JUGG_ORANGE;
    ctx.fillRect(packLeft + 1.1, packTop + 6.0, packW - 2.2, 4.4);
    ctx.fillStyle = JUGG_AMBER;
    ctx.fillRect(packLeft + 1.5, packTop + 7.2, packW - 3.0, 1.8);
    ctx.fillStyle = '#334155';
    ctx.fillRect(packLeft + 0.8, packTop + 12.6, packW - 1.6, 4.2);
  }

  // 2. Towering EOD Blast Collar (wysoki kołnierz ochronny wokół szyi i barków)
  const collarTopY = -28.6;
  const collarBotY = -21.8;
  const collarBackX = -fDir * (chestW * 0.78);
  const collarFrontX = fDir * (chestW * 0.70);

  ctx.fillStyle = JUGG_STEEL_DARK;
  ctx.beginPath();
  ctx.moveTo(collarBackX, collarBotY);
  ctx.lineTo(collarBackX * 0.94, collarTopY);
  ctx.quadraticCurveTo(0, collarTopY + 1.8, collarFrontX * 0.88, collarTopY + 1.2);
  ctx.lineTo(collarFrontX, collarBotY + 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 1.1;
  ctx.stroke();

  // Złota i stalowa krawędź kołnierza
  ctx.strokeStyle = JUGG_GOLD;
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  ctx.moveTo(collarBackX * 0.90, collarTopY + 0.7);
  ctx.quadraticCurveTo(0, collarTopY + 2.3, collarFrontX * 0.84, collarTopY + 1.6);
  ctx.stroke();

  // 3. Główny wielowarstwowy pancerz klatki piersiowej i boków (Armored Cuirass)
  ctx.fillStyle = armorGrad;
  ctx.beginPath();
  ctx.moveTo(-bellyW, waistY + 0.8);
  ctx.lineTo(-chestW, -23.6);
  ctx.lineTo(-chestW * 0.56, -24.5);
  ctx.quadraticCurveTo(cosYaw * 1.3, -21.0, chestW * 0.56, -24.5);
  ctx.lineTo(chestW, -23.6);
  ctx.lineTo(bellyW, waistY + 0.8);
  ctx.quadraticCurveTo(0, waistY + 2.2, -bellyW, waistY + 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Fazowane górne płyty barkowe (Shoulder Yoke Plates z jasnym stalowym szlifem)
  ctx.fillStyle = JUGG_STEEL_LIGHT;
  ctx.fillRect(-chestW * 0.92, -24.0, chestW * 1.84, 2.8);
  ctx.strokeStyle = JUGG_STEEL_EDGE;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-chestW * 0.88, -23.8);
  ctx.lineTo(chestW * 0.88, -23.8);
  ctx.stroke();

  // 4. Przednia / tylna płyta SAPI z nitami, ukośnym ostrzeżeniem hazard i żebrowaniem
  const plateW = Math.min(chestW, bellyW) * 1.46;
  const plateCenterX = isLookingAway ? (-absSin * 0.8) : (cosYaw * 1.6);
  const plateLeft = plateCenterX - plateW * 0.5;

  ctx.fillStyle = JUGG_STEEL_DARK;
  ctx.beginPath();
  ctx.moveTo(plateLeft + 1.4, -20.6);
  ctx.lineTo(plateLeft + plateW - 1.4, -20.6);
  ctx.lineTo(plateLeft + plateW, -18.2);
  ctx.lineTo(plateLeft + plateW, -9.8);
  ctx.lineTo(plateLeft + plateW - 1.6, -7.8);
  ctx.lineTo(plateLeft + 1.6, -7.8);
  ctx.lineTo(plateLeft, -9.8);
  ctx.lineTo(plateLeft, -18.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_STEEL_EDGE;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Dwie warstwy pancerza piersiowego + pasy hazardowe złoto-czarne
  ctx.fillStyle = JUGG_STEEL_LIGHT;
  ctx.fillRect(plateLeft + 1.2, -19.2, plateW - 2.4, 3.0);

  // Złoty chevron i paski taktyczne na płycie piersiowej
  ctx.fillStyle = JUGG_GOLD;
  ctx.fillRect(plateLeft + 1.6, -15.4, plateW - 3.2, 2.1);
  ctx.fillStyle = JUGG_ORANGE;
  ctx.fillRect(plateCenterX - plateW * 0.20, -15.4, plateW * 0.40, 2.1);

  // Dolne ładownice / segmenty pancerza brzusznego
  ctx.fillStyle = JUGG_STEEL_MID;
  ctx.fillRect(plateLeft + 1.4, -12.3, plateW * 0.44, 3.6);
  ctx.fillRect(plateCenterX + 0.5, -12.3, plateW * 0.44, 3.6);
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 0.7;
  ctx.strokeRect(plateLeft + 1.4, -12.3, plateW * 0.44, 3.6);
  ctx.strokeRect(plateCenterX + 0.5, -12.3, plateW * 0.44, 3.6);

  // Stalowe nity balistyczne
  ctx.fillStyle = '#e2e8f0';
  const rOffX = plateW * 0.42;
  ctx.fillRect(plateCenterX - rOffX, -19.8, 1.1, 1.1);
  ctx.fillRect(plateCenterX + rOffX - 1.1, -19.8, 1.1, 1.1);
  ctx.fillRect(plateCenterX - rOffX, -9.4, 1.1, 1.1);
  ctx.fillRect(plateCenterX + rOffX - 1.1, -9.4, 1.1, 1.1);

  // 5. Wzmocniony ciężki pas taktyczny + opancerzona osłona podbrzusza (Pelvic Blast Flap)
  ctx.fillStyle = JUGG_STEEL_LIGHT;
  ctx.fillRect(-bellyW * 0.96, -5.2, bellyW * 1.92, 3.4);
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 0.95;
  ctx.strokeRect(-bellyW * 0.96, -5.2, bellyW * 1.92, 3.4);

  // Złota klamra ciężkiego pasa
  const buckleX = fDir * (bellyW * 0.42);
  ctx.fillStyle = JUGG_GOLD;
  ctx.fillRect(buckleX - 2.0, -4.7, 4.0, 2.4);

  // Masywny fartuch balistyczny (Pelvic & Hip Blast Guard)
  ctx.fillStyle = JUGG_STEEL_MID;
  ctx.beginPath();
  ctx.moveTo(-bellyW * 0.92, -1.8);
  ctx.lineTo(bellyW * 0.92, -1.8);
  ctx.lineTo(bellyW * 0.76, 4.6);
  ctx.lineTo(0, 6.2);
  ctx.lineTo(-bellyW * 0.76, 4.6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 1.05;
  ctx.stroke();

  ctx.fillStyle = JUGG_STEEL_LIGHT;
  ctx.fillRect(-bellyW * 0.52, 0.2, bellyW * 1.04, 1.8);
  ctx.fillStyle = JUGG_GOLD;
  ctx.fillRect(-bellyW * 0.44, 3.0, bellyW * 0.88, 1.3);
}

/**
 * Rysuje wielowarstwowy, pancerny naramiennik Kolosa (Multi-Plate Heavy Pauldron)
 */
export function drawJuggernautUpperArmArmor(ctx, upperLen, armHalfH, isFront) {
  const padStart = -2.4;
  const padEnd = upperLen * 0.72;
  const padTop = -armHalfH * 1.65;
  const padBot = armHalfH * 1.42;

  // Warstwa dolna (osłona stawu barkowego)
  ctx.fillStyle = isFront ? JUGG_STEEL_DARK : JUGG_RIM;
  ctx.beginPath();
  ctx.moveTo(padStart, padBot * 0.90);
  ctx.quadraticCurveTo(padStart - 2.4, 0, padStart, padTop * 0.82);
  ctx.quadraticCurveTo(padEnd * 0.55, padTop * 1.15, padEnd * 1.04, padTop * 0.65);
  ctx.lineTo(padEnd * 0.98, padBot * 0.90);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 1.05;
  ctx.stroke();

  // Główna górna tarcza naramiennika
  ctx.fillStyle = isFront ? JUGG_STEEL_MID : JUGG_STEEL_DARK;
  ctx.beginPath();
  ctx.moveTo(padStart + 0.6, padBot * 0.62);
  ctx.quadraticCurveTo(padStart - 1.4, -armHalfH * 0.2, padStart + 0.6, padTop * 0.72);
  ctx.lineTo(padEnd * 0.76, padTop * 0.78);
  ctx.lineTo(padEnd * 0.82, padBot * 0.56);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = isFront ? JUGG_STEEL_EDGE : JUGG_RIM;
  ctx.lineWidth = 0.85;
  ctx.stroke();

  if (isFront) {
    // Stalowy grzebień na szczycie barku + podwójny złoty chevron taktyczny
    ctx.fillStyle = JUGG_STEEL_LIGHT;
    ctx.fillRect(0.0, -armHalfH * 1.15, padEnd * 0.64, 2.2);

    ctx.fillStyle = JUGG_GOLD;
    ctx.fillRect(padEnd * 0.14, -armHalfH * 0.55, padEnd * 0.54, 1.8);
    ctx.fillStyle = JUGG_ORANGE;
    ctx.fillRect(padEnd * 0.24, -armHalfH * 0.10, padEnd * 0.36, 1.2);

    // Stalowe nity pancerza
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(padEnd * 0.16, -armHalfH * 0.92, 0.85, 0, Math.PI * 2);
    ctx.arc(padEnd * 0.58, -armHalfH * 0.92, 0.85, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Rysuje pancerny karwasz przedramienia z osłoną łokcia (Heavy Vambrace & Elbow Cowl)
 */
export function drawJuggernautForearmArmor(ctx, foreLen, elbowR, wristR, isFront) {
  // Osłona stawu łokciowego (Armored Elbow Couters)
  ctx.fillStyle = isFront ? JUGG_STEEL_LIGHT : JUGG_STEEL_MID;
  ctx.beginPath();
  ctx.ellipse(0.6, 0.4, elbowR * 0.92, elbowR * 1.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 0.95;
  ctx.stroke();

  // Karwasz przedramienia
  const x0 = foreLen * 0.08;
  const x1 = foreLen * 0.84;
  const top0 = -elbowR * 1.28;
  const top1 = -wristR * 1.46;
  const bot0 = elbowR * 1.14;
  const bot1 = wristR * 1.28;

  ctx.fillStyle = isFront ? JUGG_STEEL_MID : JUGG_STEEL_DARK;
  ctx.beginPath();
  ctx.moveTo(x0, top0);
  ctx.lineTo(x1, top1);
  ctx.lineTo(x1 + 1.0, bot1);
  ctx.lineTo(x0 - 0.6, bot0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 1.0;
  ctx.stroke();

  if (isFront) {
    ctx.fillStyle = JUGG_STEEL_LIGHT;
    ctx.fillRect(x0 + 1.0, top0 * 0.82, (x1 - x0) * 0.78, 1.9);
    ctx.fillStyle = JUGG_GOLD;
    ctx.fillRect(foreLen * 0.34, top0 * 0.22, 1.8, (bot0 - top0) * 0.52);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x1 - 2.2, top1 * 0.4, 1.1, 1.1);
  }
}

/**
 * Rysuje masywną osłonę udową Juggernauta z ładownicą pancerną (Heavy Thigh Tasset)
 */
export function drawJuggernautThighArmor(ctx, l1, thighHalfH, isFrontLeg) {
  const x0 = l1 * 0.12;
  const x1 = l1 * 0.76;
  const halfH = thighHalfH * 0.98;

  ctx.fillStyle = isFrontLeg ? JUGG_STEEL_MID : JUGG_STEEL_DARK;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x0, -halfH, x1 - x0, halfH * 1.92, 1.8);
  else ctx.rect(x0, -halfH, x1 - x0, halfH * 1.92);
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 1.0;
  ctx.stroke();

  if (isFrontLeg) {
    ctx.fillStyle = JUGG_STEEL_LIGHT;
    ctx.fillRect(x0 + 1.4, -halfH + 1.2, (x1 - x0) - 2.8, 2.0);
    ctx.fillStyle = JUGG_GOLD;
    ctx.fillRect(x0 + 1.6, -halfH + 3.6, (x1 - x0) - 3.2, 1.3);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x0 + 2.0, halfH - 2.2, 1.0, 1.0);
    ctx.fillRect(x1 - 3.0, halfH - 2.2, 1.0, 1.0);
  }
}

/**
 * Rysuje wielki nakolannik kopułkowy i opancerzony nagolennik Kolosa (Heavy Knee Cop & Greave)
 */
export function drawJuggernautShinArmor(ctx, l2, calfBulge, achillesHalfW, isFrontLeg) {
  // 1. Masywny pancerny nakolannik
  ctx.fillStyle = isFrontLeg ? JUGG_STEEL_LIGHT : JUGG_STEEL_MID;
  ctx.beginPath();
  ctx.ellipse(0.8, -calfBulge * 0.42, 4.2, 3.0, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 1.0;
  ctx.stroke();

  if (isFrontLeg) {
    ctx.fillStyle = JUGG_GOLD;
    ctx.fillRect(-1.4, -calfBulge * 0.50, 4.4, 1.1);
  }

  // 2. Przednia ciężka płyta nagolennika (Armored Greave Plate)
  const gx0 = 3.5;
  const gx1 = l2 * 0.84;
  ctx.fillStyle = isFrontLeg ? JUGG_STEEL_MID : JUGG_STEEL_DARK;
  ctx.beginPath();
  ctx.moveTo(gx0, -calfBulge * 0.96);
  ctx.lineTo(gx1, -achillesHalfW * 1.52);
  ctx.lineTo(gx1 - 0.5, 1.8);
  ctx.lineTo(gx0 - 0.5, 2.0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 0.95;
  ctx.stroke();

  if (isFrontLeg) {
    ctx.fillStyle = JUGG_STEEL_LIGHT;
    ctx.fillRect(gx0 + 1.4, -calfBulge * 0.82, (gx1 - gx0) * 0.72, 1.6);
    ctx.fillStyle = JUGG_GOLD;
    ctx.fillRect(gx0 + 2.0, -calfBulge * 0.52, (gx1 - gx0) * 0.56, 1.2);
  }
}

/**
 * Rysuje hełm szturmowy Kolosa (Altyn / Bulldozer EOD bez antenki, z masywną przyłbicą,
 * wystającym daszkiem opancerzenia i żarzącym się wizjerem szczelinowym - profil)
 */
export function drawJuggernautHelmetProfile(ctx) {
  // 1. Masywna kopuła hełmu szturmowego z głęboką osłoną potylicy i karku (BRAK ANTENKI)
  const helmGrad = ctx.createLinearGradient(-8.4, -13.2, 7.8, 3.0);
  helmGrad.addColorStop(0.0, JUGG_STEEL_DARK);
  helmGrad.addColorStop(0.40, JUGG_STEEL_LIGHT);
  helmGrad.addColorStop(0.75, JUGG_STEEL_MID);
  helmGrad.addColorStop(1.0, JUGG_STEEL_DARK);

  ctx.fillStyle = helmGrad;
  ctx.beginPath();
  ctx.moveTo(-7.8, 2.2);
  ctx.quadraticCurveTo(-9.2, -5.2, -6.2, -10.6);
  ctx.quadraticCurveTo(-1.0, -13.8, 5.2, -11.0);
  ctx.quadraticCurveTo(8.2, -8.2, 7.6, -4.0);
  ctx.lineTo(3.6, -3.5);
  ctx.lineTo(-1.4, -0.4);
  ctx.lineTo(-4.8, 3.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Spawany pas pancerza czołowego i korony (Brow Armor Crest)
  ctx.fillStyle = JUGG_STEEL_LIGHT;
  ctx.beginPath();
  ctx.moveTo(-5.2, -9.6);
  ctx.quadraticCurveTo(0.2, -12.6, 5.8, -9.4);
  ctx.lineTo(7.8, -5.4);
  ctx.lineTo(3.4, -4.8);
  ctx.quadraticCurveTo(-0.5, -8.8, -4.8, -7.8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 0.85;
  ctx.stroke();

  // Złoty pas taktyczny wzdłuż szczytu hełmu
  ctx.fillStyle = JUGG_GOLD;
  ctx.beginPath();
  ctx.moveTo(-3.6, -11.6);
  ctx.quadraticCurveTo(0.6, -12.8, 4.2, -10.8);
  ctx.lineTo(3.6, -9.3);
  ctx.quadraticCurveTo(0.4, -11.0, -3.0, -10.0);
  ctx.closePath();
  ctx.fill();

  // 2. Spawana osłona przyłbicy i szczęki (Bulldozer Blast Faceplate & Respirator Mandible)
  ctx.fillStyle = JUGG_STEEL_MID;
  ctx.beginPath();
  ctx.moveTo(0.4, -5.2);
  ctx.lineTo(8.2, -4.8);
  ctx.lineTo(8.6, 2.2);
  ctx.lineTo(6.0, 5.8);
  ctx.lineTo(-0.8, 5.4);
  ctx.lineTo(-2.6, 1.8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 1.15;
  ctx.stroke();

  // Stalowy okap nad wizjerem (Armored Brow Rim)
  ctx.fillStyle = JUGG_STEEL_LIGHT;
  ctx.fillRect(1.6, -5.2, 6.8, 1.7);
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 0.75;
  ctx.strokeRect(1.6, -5.2, 6.8, 1.7);

  // Wąska pancerna szczelina wizjera z bursztynowo-pomarańczowym blaskiem optyki
  ctx.fillStyle = JUGG_RIM;
  ctx.fillRect(2.2, -3.4, 6.0, 2.5);
  ctx.fillStyle = JUGG_ORANGE;
  ctx.fillRect(2.7, -2.9, 5.2, 1.5);
  ctx.fillStyle = JUGG_VISOR_CORE;
  ctx.fillRect(3.8, -2.7, 2.8, 0.8);

  // Ciężka pancerna kratka respiratora na szczęce + masywne śruby mocujące przyłbicę
  ctx.fillStyle = JUGG_STEEL_DARK;
  ctx.fillRect(3.4, 0.2, 4.4, 4.2);
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 0.7;
  ctx.strokeRect(3.4, 0.2, 4.4, 4.2);

  ctx.fillStyle = JUGG_GOLD;
  ctx.fillRect(4.1, 1.0, 3.0, 0.7);
  ctx.fillRect(4.1, 2.4, 3.0, 0.7);

  // Masywna śruba zawiasu przyłbicy + boczna płyta policzkowa
  ctx.fillStyle = JUGG_STEEL_EDGE;
  ctx.beginPath();
  ctx.arc(0.0, -1.8, 1.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 0.7;
  ctx.stroke();
}

/**
 * Rysuje hełm Juggernauta z przodu (masywna przyłbica z poziomą szczeliną wizjera i kratką respiratora)
 */
export function drawJuggernautHelmetFront(ctx) {
  const frontGrad = ctx.createLinearGradient(-7.6, -11.0, 7.6, 5.0);
  frontGrad.addColorStop(0.0, JUGG_STEEL_DARK);
  frontGrad.addColorStop(0.5, JUGG_STEEL_LIGHT);
  frontGrad.addColorStop(1.0, JUGG_STEEL_DARK);

  // Poszerzona kopuła hełmu i osłona policzków
  ctx.fillStyle = frontGrad;
  ctx.beginPath();
  ctx.arc(0, -2.6, 7.6, Math.PI * 0.90, Math.PI * 0.10, false);
  ctx.lineTo(7.2, 4.8);
  ctx.lineTo(3.6, 6.4);
  ctx.lineTo(-3.6, 6.4);
  ctx.lineTo(-7.2, 4.8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 1.15;
  ctx.stroke();

  // Złoty grzebień czołowy i płyta nadwizjerowa
  ctx.fillStyle = JUGG_GOLD;
  ctx.fillRect(-1.8, -9.8, 3.6, 2.8);
  ctx.fillStyle = JUGG_STEEL_LIGHT;
  ctx.fillRect(-5.6, -5.2, 11.2, 2.0);
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 0.75;
  ctx.strokeRect(-5.6, -5.2, 11.2, 2.0);

  // Pozioma pancerna szczelina wizjera
  ctx.fillStyle = JUGG_RIM;
  ctx.fillRect(-5.2, -3.2, 10.4, 2.6);
  ctx.fillStyle = JUGG_ORANGE;
  ctx.fillRect(-4.6, -2.7, 9.2, 1.5);
  ctx.fillStyle = JUGG_VISOR_CORE;
  ctx.fillRect(-2.6, -2.5, 5.2, 0.8);

  // Ciężka osłona szczęki z kratką oddechową
  ctx.fillStyle = JUGG_STEEL_MID;
  ctx.fillRect(-4.8, 0.8, 9.6, 4.4);
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 0.85;
  ctx.strokeRect(-4.8, 0.8, 9.6, 4.4);

  ctx.fillStyle = JUGG_GOLD;
  ctx.fillRect(-3.0, 1.8, 6.0, 0.8);
  ctx.fillRect(-3.0, 3.3, 6.0, 0.8);
}

/**
 * Rysuje hełm Juggernauta z tyłu (pełna osłona karku bez antenki, spawany pas stalowy i oznaczenie Kolosa)
 */
export function drawJuggernautHelmetBack(ctx) {
  ctx.fillStyle = JUGG_STEEL_MID;
  ctx.beginPath();
  ctx.arc(0, -2.6, 7.6, Math.PI * 0.86, Math.PI * 0.14, false);
  ctx.lineTo(6.8, 4.8);
  ctx.lineTo(-6.8, 4.8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 1.15;
  ctx.stroke();

  // Płyty potylicy i złoty pas identyfikacyjny (ZERO ANTENY)
  ctx.fillStyle = JUGG_STEEL_LIGHT;
  ctx.fillRect(-5.0, -1.8, 10.0, 2.6);
  ctx.fillStyle = JUGG_GOLD;
  ctx.fillRect(-4.2, -5.8, 8.4, 2.0);
  ctx.fillStyle = JUGG_STEEL_EDGE;
  ctx.fillRect(-4.6, 2.2, 1.2, 1.2);
  ctx.fillRect(3.4, 2.2, 1.2, 1.2);
}

/**
 * Rysuje falę energetyczną wejścia Kolosa po aktywacji nagrody
 */
export function drawJuggernautDeployAura(ctx, p) {
  if (!p || !(p.juggernautDeployAnim > 0) || p.isDead) return;
  const t = Math.max(0, Math.min(1, p.juggernautDeployAnim));
  const prog = 1 - t;
  const cx = p.x + (p.w || 26) * 0.5;
  const cy = p.y + (p.h || 70) * 0.52;
  const radius = 18 + prog * 54;

  ctx.save();
  ctx.globalAlpha = t * 0.85;
  ctx.strokeStyle = JUGG_AMBER;
  ctx.lineWidth = 2.8 * t + 0.8;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(250, 204, 21, 0.14)';
  ctx.fill();

  ctx.font = '900 10px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#050810';
  ctx.lineWidth = 2.6;
  ctx.fillStyle = JUGG_AMBER;
  const labelY = p.y - 16 - prog * 14;
  ctx.strokeText('[KOLOS ONLINE]', cx, labelY);
  ctx.fillText('[KOLOS ONLINE]', cx, labelY);
  ctx.restore();
}
