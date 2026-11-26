// =========================================================================
// PLAYER/JUGGERNAUT.JS - PANCERZ BALISTYCZNY JUGGERNAUT [KOLOS]
// Ciężki pancerz EOD / Altyn, przyłbica z wizjerem, naramienniki, karwasze,
// nagolenniki, wyposażenie w M134 Miniguna i ciężki efekt wejścia (0 shadowBlur)
// =========================================================================

import { WEAPONS } from '../weapons/transform.js';
import { triggerScreenShake } from '../camera.js';
import { GROUND_Y, spawnGroundPuff, spawnJetpackSparks } from '../world/state.js';
import { addDynamicLight } from '../lighting/index.js';
import { playSound } from '../audio/index.js';

const JUGG_GOLD = '#eab308';
const JUGG_AMBER = '#facc15';
const JUGG_VISOR_CORE = '#fef08a';
const JUGG_STEEL_LIGHT = '#475569';
const JUGG_STEEL_MID = '#1e293b';
const JUGG_STEEL_DARK = '#0f172a';
const JUGG_RIM = '#09090b';

/**
 * Aktywuje pełne wyposażenie Juggernauta (pancerz 250 HP + 200 kevlaru + hełm Altyn + M134 Minigun + ciężkie wejście)
 * @param {object} target - postać (gracz / bot / zdalny gracz)
 * @param {object} [options] - { fromNetwork, skipWeaponEquip }
 */
export function activateJuggernautMode(target, options = {}) {
  if (!target) return;

  target.isJuggernaut = true;
  target.juggernautDeployAnim = 1.0;
  target.maxHp = 250;
  target.hp = 250;
  target.hasVest = true;
  target.vestHp = 200;
  target.vestMaxHp = 200;
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
  triggerScreenShake(isLocal ? 6.5 : 3.2);
  if (typeof spawnGroundPuff === 'function') {
    spawnGroundPuff(cx, floorY);
  }
  if (typeof spawnJetpackSparks === 'function') {
    spawnJetpackSparks(cx, cy, 1, 22, [JUGG_GOLD, JUGG_AMBER, '#ffffff', '#64748b'], 0, -2.8);
  }
  if (typeof addDynamicLight === 'function') {
    addDynamicLight({
      x: cx,
      y: cy,
      radius: 220,
      color: JUGG_AMBER,
      intensity: 0.92,
      duration: 0.42,
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
  target.vestMaxHp = 60;
  target.helmetHits = 1;
}

/**
 * Rysuje masywny pancerz tułowia Juggernauta: kołnierz EOD, płyty SAPI, rdzeń taktyczny i fartuch biodrowy
 */
export function drawJuggernautTorsoArmor(ctx, p, absCos, absSin, cosYaw, isLookingAway, shoulderHalfW, waistHalfW, waistY, fDir) {
  const armorGrad = ctx.createLinearGradient(-shoulderHalfW, 0, shoulderHalfW, 0);
  armorGrad.addColorStop(0.0, JUGG_STEEL_DARK);
  armorGrad.addColorStop(0.32, JUGG_STEEL_MID);
  armorGrad.addColorStop(0.68, JUGG_STEEL_LIGHT);
  armorGrad.addColorStop(1.0, JUGG_STEEL_DARK);

  // 1. Masywny kołnierz ochronny EOD wokół szyi i obojczyków (Blast Gorget Collar)
  const collarTopY = -27.2;
  const collarBotY = -22.2;
  const collarBackX = -fDir * (shoulderHalfW * 0.72);
  const collarFrontX = fDir * (shoulderHalfW * 0.66);

  ctx.fillStyle = JUGG_STEEL_DARK;
  ctx.beginPath();
  ctx.moveTo(collarBackX, collarBotY);
  ctx.lineTo(collarBackX * 0.92, collarTopY);
  ctx.quadraticCurveTo(0, collarTopY + 1.4, collarFrontX * 0.82, collarTopY + 1.0);
  ctx.lineTo(collarFrontX, collarBotY + 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Złota krawędź kołnierza balistycznego
  ctx.strokeStyle = JUGG_GOLD;
  ctx.lineWidth = 0.95;
  ctx.beginPath();
  ctx.moveTo(collarBackX * 0.85, collarTopY + 0.8);
  ctx.lineTo(collarFrontX * 0.78, collarTopY + 1.5);
  ctx.stroke();

  // 2. Zewnętrzna skorupa pancerza klatki piersiowej i pleców
  const chestW = shoulderHalfW + 1.25;
  const bellyW = waistHalfW + 1.05;

  ctx.fillStyle = armorGrad;
  ctx.beginPath();
  ctx.moveTo(-bellyW, waistY + 0.4);
  ctx.lineTo(-chestW, -23.6);
  ctx.lineTo(-chestW * 0.52, -24.2);
  ctx.quadraticCurveTo(cosYaw * 1.2, -21.2, chestW * 0.52, -24.2);
  ctx.lineTo(chestW, -23.6);
  ctx.lineTo(bellyW, waistY + 0.4);
  ctx.quadraticCurveTo(0, waistY + 1.5, -bellyW, waistY + 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 1.1;
  ctx.stroke();

  // Fazowane górne płyty barkowe (Shoulder Yoke Plates)
  ctx.fillStyle = JUGG_STEEL_LIGHT;
  ctx.fillRect(-chestW * 0.88, -23.8, chestW * 1.76, 2.2);

  // Złoty pas taktyczny i nity na płycie pancerza
  const plateW = Math.min(chestW, bellyW) * 1.38;
  const plateCenterX = isLookingAway ? (-absSin * 0.8) : (cosYaw * 1.5);

  ctx.fillStyle = JUGG_STEEL_DARK;
  ctx.fillRect(plateCenterX - plateW * 0.50, -19.8, plateW, 8.2);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(plateCenterX - plateW * 0.50, -19.8, plateW, 8.2);

  // Złote oznaczenie klasy KOLOS na piersi / plecach
  ctx.fillStyle = JUGG_GOLD;
  ctx.fillRect(plateCenterX - plateW * 0.42, -18.3, plateW * 0.84, 1.8);
  ctx.fillStyle = JUGG_AMBER;
  ctx.fillRect(plateCenterX - plateW * 0.16, -15.2, plateW * 0.32, 2.0);

  // Stalowe nity balistyczne w narożnikach płyty
  ctx.fillStyle = '#cbd5e1';
  const rOffX = plateW * 0.43;
  ctx.fillRect(plateCenterX - rOffX, -19.0, 1.0, 1.0);
  ctx.fillRect(plateCenterX + rOffX - 1.0, -19.0, 1.0, 1.0);
  ctx.fillRect(plateCenterX - rOffX, -12.8, 1.0, 1.0);
  ctx.fillRect(plateCenterX + rOffX - 1.0, -12.8, 1.0, 1.0);

  // Dolny pancerz podbrzusza (Groin & Pelvic Ballistic Flap)
  ctx.fillStyle = JUGG_STEEL_MID;
  ctx.beginPath();
  ctx.moveTo(-bellyW * 0.85, -1.6);
  ctx.lineTo(bellyW * 0.85, -1.6);
  ctx.lineTo(bellyW * 0.68, 4.2);
  ctx.lineTo(0, 5.2);
  ctx.lineTo(-bellyW * 0.68, 4.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 0.95;
  ctx.stroke();

  ctx.fillStyle = JUGG_GOLD;
  ctx.fillRect(-bellyW * 0.42, 2.2, bellyW * 0.84, 1.2);
}

/**
 * Rysuje wielowarstwowy naramiennik pancerny Juggernauta (Layered Shoulder Pauldron)
 */
export function drawJuggernautUpperArmArmor(ctx, upperLen, armHalfH, isFront) {
  const padStart = -1.6;
  const padEnd = upperLen * 0.62;
  const padTop = -armHalfH * 1.48;
  const padBot = armHalfH * 1.28;

  // Zewnętrzny ciężki naramiennik
  ctx.fillStyle = isFront ? JUGG_STEEL_MID : JUGG_STEEL_DARK;
  ctx.beginPath();
  ctx.moveTo(padStart, padBot * 0.8);
  ctx.quadraticCurveTo(padStart - 1.8, 0, padStart, padTop * 0.72);
  ctx.quadraticCurveTo(padEnd * 0.5, padTop * 1.12, padEnd, padTop * 0.68);
  ctx.lineTo(padEnd * 0.92, padBot * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 0.95;
  ctx.stroke();

  // Górna płytka pancerza naramiennika + złoty pasek (na przednim ramieniu)
  if (isFront) {
    ctx.fillStyle = JUGG_STEEL_LIGHT;
    ctx.beginPath();
    ctx.moveTo(0.2, -armHalfH * 0.95);
    ctx.lineTo(padEnd * 0.86, -armHalfH * 0.92);
    ctx.lineTo(padEnd * 0.78, -armHalfH * 0.35);
    ctx.lineTo(0.2, -armHalfH * 0.35);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = JUGG_GOLD;
    ctx.fillRect(padEnd * 0.16, -armHalfH * 0.22, padEnd * 0.56, 1.5);

    // Stalowy nit na barku
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(padEnd * 0.22, -armHalfH * 0.82, 0.75, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Rysuje pancerny karwasz przedramienia (Armored Vambrace)
 */
export function drawJuggernautForearmArmor(ctx, foreLen, elbowR, wristR, isFront) {
  const x0 = foreLen * 0.10;
  const x1 = foreLen * 0.78;
  const top0 = -elbowR * 1.18;
  const top1 = -wristR * 1.32;
  const bot0 = elbowR * 1.05;
  const bot1 = wristR * 1.18;

  ctx.fillStyle = isFront ? JUGG_STEEL_MID : JUGG_STEEL_DARK;
  ctx.beginPath();
  ctx.moveTo(x0, top0);
  ctx.lineTo(x1, top1);
  ctx.lineTo(x1 + 0.8, bot1);
  ctx.lineTo(x0 - 0.6, bot0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 0.9;
  ctx.stroke();

  if (isFront) {
    ctx.fillStyle = JUGG_STEEL_LIGHT;
    ctx.fillRect(x0 + 1.0, top0 * 0.75, (x1 - x0) * 0.75, 1.6);
    ctx.fillStyle = JUGG_GOLD;
    ctx.fillRect(foreLen * 0.38, top0 * 0.25, 1.6, (bot0 - top0) * 0.45);
  }
}

/**
 * Rysuje boczną osłonę udową Juggernauta (Ballistic Thigh Tasset)
 */
export function drawJuggernautThighArmor(ctx, l1, thighHalfH, isFrontLeg) {
  const x0 = l1 * 0.16;
  const x1 = l1 * 0.72;
  const halfH = thighHalfH * 0.86;

  ctx.fillStyle = isFrontLeg ? JUGG_STEEL_MID : JUGG_STEEL_DARK;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x0, -halfH, x1 - x0, halfH * 1.72, 1.6);
  else ctx.rect(x0, -halfH, x1 - x0, halfH * 1.72);
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 0.9;
  ctx.stroke();

  if (isFrontLeg) {
    ctx.fillStyle = JUGG_GOLD;
    ctx.fillRect(x0 + 1.5, -halfH + 1.0, (x1 - x0) - 3.0, 1.2);
  }
}

/**
 * Rysuje ciężki nakolannik i nagolennik pancerny (Heavy Kneepad & Greave)
 */
export function drawJuggernautShinArmor(ctx, l2, calfBulge, achillesHalfW, isFrontLeg) {
  // 1. Pancerny nakolannik kopułkowy
  ctx.fillStyle = isFrontLeg ? JUGG_STEEL_LIGHT : JUGG_STEEL_MID;
  ctx.beginPath();
  ctx.ellipse(1.0, -calfBulge * 0.38, 3.4, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 0.85;
  ctx.stroke();

  // 2. Przednia płyta nagolennika (Shin Greave)
  const gx0 = 3.8;
  const gx1 = l2 * 0.78;
  ctx.fillStyle = isFrontLeg ? JUGG_STEEL_MID : JUGG_STEEL_DARK;
  ctx.beginPath();
  ctx.moveTo(gx0, -calfBulge * 0.86);
  ctx.lineTo(gx1, -achillesHalfW * 1.38);
  ctx.lineTo(gx1 - 0.6, 0.8);
  ctx.lineTo(gx0 - 0.4, 1.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 0.85;
  ctx.stroke();

  if (isFrontLeg) {
    ctx.fillStyle = JUGG_GOLD;
    ctx.fillRect(gx0 + 1.8, -calfBulge * 0.56, (gx1 - gx0) * 0.62, 1.1);
  }
}

/**
 * Rysuje hełm szturmowy Altyn / EOD z ciężką przyłbicą i bursztynowo-złotym wizjerem (widok z profilu)
 */
export function drawJuggernautHelmetProfile(ctx) {
  // 1. Główna skorupa hełmu Altyn (powiększona, głęboko zachodząca na kark i uszy)
  const helmGrad = ctx.createLinearGradient(-7.8, -12.4, 7.2, 2.0);
  helmGrad.addColorStop(0.0, JUGG_STEEL_DARK);
  helmGrad.addColorStop(0.45, JUGG_STEEL_LIGHT);
  helmGrad.addColorStop(1.0, JUGG_STEEL_MID);

  ctx.fillStyle = helmGrad;
  ctx.beginPath();
  ctx.moveTo(-7.2, 1.2);
  ctx.quadraticCurveTo(-8.4, -5.2, -5.8, -9.8);
  ctx.quadraticCurveTo(-1.2, -12.8, 4.6, -10.4);
  ctx.quadraticCurveTo(7.4, -7.8, 6.8, -3.8);
  ctx.lineTo(3.4, -3.5);
  ctx.lineTo(-1.2, -0.8);
  ctx.lineTo(-4.2, 2.6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 1.1;
  ctx.stroke();

  // Złoty pas taktyczny wzdłuż korony hełmu
  ctx.fillStyle = JUGG_GOLD;
  ctx.beginPath();
  ctx.moveTo(-3.8, -10.8);
  ctx.quadraticCurveTo(0.2, -12.0, 3.6, -10.2);
  ctx.lineTo(3.0, -8.8);
  ctx.quadraticCurveTo(0.0, -10.2, -3.2, -9.3);
  ctx.closePath();
  ctx.fill();

  // Antena łączności taktycznej wystająca z tyłu hełmu
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-4.6, -7.8);
  ctx.lineTo(-5.8, -17.2);
  ctx.stroke();
  ctx.fillStyle = JUGG_AMBER;
  ctx.beginPath();
  ctx.arc(-5.8, -17.2, 1.0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Opancerzona osłona twarzy i szczęki (Blast Visor Shield + Mandible Guard)
  ctx.fillStyle = JUGG_STEEL_MID;
  ctx.beginPath();
  ctx.moveTo(0.8, -4.4);
  ctx.lineTo(7.4, -4.2);
  ctx.lineTo(7.8, 1.8);
  ctx.lineTo(5.6, 5.4);
  ctx.lineTo(-0.4, 5.0);
  ctx.lineTo(-2.2, 1.8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 1.05;
  ctx.stroke();

  // Wąski opancerzony wizjer z bursztynowym blaskiem optyki (Visor Slit)
  ctx.fillStyle = '#09090b';
  ctx.fillRect(2.2, -3.2, 5.2, 2.2);
  ctx.fillStyle = JUGG_AMBER;
  ctx.fillRect(2.6, -2.8, 4.5, 1.4);
  ctx.fillStyle = JUGG_VISOR_CORE;
  ctx.fillRect(3.6, -2.6, 2.4, 0.7);

  // Żebra wentylacyjne na osłonie szczęki + śruba zawiasu przyłbicy
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(4.0, 1.2); ctx.lineTo(6.6, 1.2);
  ctx.moveTo(4.0, 2.8); ctx.lineTo(6.2, 2.8);
  ctx.stroke();

  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(0.4, -2.2, 1.1, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Rysuje hełm Juggernauta z przodu (z opuszczoną przyłbicą i poziomym złotym wizjerem)
 */
export function drawJuggernautHelmetFront(ctx) {
  const frontGrad = ctx.createLinearGradient(-6.8, -10.0, 6.8, 4.0);
  frontGrad.addColorStop(0.0, JUGG_STEEL_DARK);
  frontGrad.addColorStop(0.5, JUGG_STEEL_LIGHT);
  frontGrad.addColorStop(1.0, JUGG_STEEL_DARK);

  // Kopuła hełmu
  ctx.fillStyle = frontGrad;
  ctx.beginPath();
  ctx.arc(0, -2.4, 6.8, Math.PI * 0.92, Math.PI * 0.08, false);
  ctx.lineTo(6.4, 4.4);
  ctx.lineTo(3.2, 6.0);
  ctx.lineTo(-3.2, 6.0);
  ctx.lineTo(-6.4, 4.4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 1.05;
  ctx.stroke();

  // Złota korona i grzebień centralny
  ctx.fillStyle = JUGG_GOLD;
  ctx.fillRect(-1.4, -8.8, 2.8, 2.6);

  // Poziomy wizjer balistyczny
  ctx.fillStyle = '#09090b';
  ctx.fillRect(-4.6, -2.8, 9.2, 2.4);
  ctx.fillStyle = JUGG_AMBER;
  ctx.fillRect(-4.1, -2.3, 8.2, 1.4);
  ctx.fillStyle = JUGG_VISOR_CORE;
  ctx.fillRect(-2.4, -2.1, 4.8, 0.7);

  // Osłona szczęki z otworami oddechowymi
  ctx.fillStyle = JUGG_STEEL_MID;
  ctx.fillRect(-4.2, 1.2, 8.4, 3.6);
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-4.2, 1.2, 8.4, 3.6);
  ctx.fillStyle = '#09090b';
  ctx.fillRect(-2.2, 2.2, 1.4, 1.6);
  ctx.fillRect(0.8, 2.2, 1.4, 1.6);
}

/**
 * Rysuje hełm Juggernauta z tyłu (głęboka osłona potylicy, antena i złoty pas identyfikacyjny)
 */
export function drawJuggernautHelmetBack(ctx) {
  ctx.fillStyle = JUGG_STEEL_MID;
  ctx.beginPath();
  ctx.arc(0, -2.4, 6.8, Math.PI * 0.88, Math.PI * 0.12, false);
  ctx.lineTo(6.0, 4.0);
  ctx.lineTo(-6.0, 4.0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = JUGG_RIM;
  ctx.lineWidth = 1.05;
  ctx.stroke();

  ctx.fillStyle = JUGG_GOLD;
  ctx.fillRect(-3.6, -5.2, 7.2, 1.8);

  // Antena
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-4.8, -5.2);
  ctx.lineTo(-5.2, -16.2);
  ctx.stroke();
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
  ctx.lineWidth = 2.6 * t + 0.8;
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
