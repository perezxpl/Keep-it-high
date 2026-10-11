// =========================================================================
// PLAYER/RENDERER.JS - WARSTWA WIZUALNA I SILNIK RENDEROWANIA 2.5D IK
// Odpowiada za anatomię mięśni, cieniowanie tkanin, kikuty oraz rysowanie postaci.
// =========================================================================

import { CONFIG } from '../config.js';
import { solve2BoneIK, getArmAnglesForTarget, lerp, lerpAngle } from './ik.js';
import { getFreestyleChoreography, getBiomechanicFootTrajectory } from './locomotion.js?v=v77_hair_creator';
import {
  isBallInKickReach, getGroundKickTrajectory, getScissorLegTargets,
  getBackflipTargets, getSpartanKickTargets, getProneIKTargets,
  getThrowHandPosition
} from './actions.js?v=v77_hair_creator';
import { getRagdollRenderPose } from './death.js?v=v77_hair_creator';
import { drawHeldWeapon, getWeaponHoldTransform } from '../weapons.js?v=v77_hair_creator';
import { camera } from '../camera.js';

export const DEFAULT_VISUALS = {
  sculptedMuscles: false,
  muscleMult: 1.0,
  sleeveless: false,
  sleeveLengthMult: 1.0,
  hasWristband: false,
  wristbandColor: '#18181b',
  hasTacticalGloves: true,
  gloveColor: '#18181b',
  hasHeadband: false,
  headbandColor: '#ffffff',
  hairStyle: 'buzzcut',
  hairColor: '#18181b',
  hasHelmet: false,
  helmetColor: '#27272a',
  helmetVisorGlow: '#00e5ff',
  hasVest: false,
  vestColor: '#18181b',
  hairColor0: '#0f172a',
  hairColor1: '#1e293b',
  hairColor2: '#334155',
  shortsColor0: '#27272a',
  shortsColor1: '#3f3f46',
  shortsColor2: '#18181b',
  skinLight: '#fed7aa',
  skinMid: '#f5b078',
  skinDark: '#b45309',
  skinBack: '#de935e',
  jerseyFront0: '#18181b',
  jerseyFront1: '#27272a',
  jerseyFront2: '#3f3f46',
  jerseyFront3: '#18181b',
  jerseyBack0: '#09090b',
  jerseyBack1: '#18181b',
  jerseyBack2: '#09090b',
  jerseyStripe: '#52525b',
  armColorFront: '#27272a',
  armColorBack: '#18181b',
  legThighFront: '#27272a',
  legShinFront: '#3f3f46',
  legThighBack: '#18181b',
  legShinBack: '#27272a',
  bootColor: '#18181b',
  bootBack: '#09090b',
  bootAccent: '#52525b',
  crestColor: '#71717a',
  seamColor: '#09090b',
  crosshairColor: '#ef4444',
  number: '00'
};

export const HAIR_STYLE_LIST = [
  'buzzcut',
  'crewcut',
  'mohawk',
  'slickback',
  'messy',
  'ponytail',
  'long_flowing',
  'dreadlocks',
  'topknot'
];

export const HAIR_COLOR_LIST = [
  '#18181b', // Kruczoczarny
  '#3b2314', // Ciemny brąz / Espresso
  '#6b3e26', // Kasztanowy brąz
  '#92400e', // Ciepły bursztyn / Brudny blond
  '#eab308', // Złoty blond
  '#c2410c', // Miedziany rudy
  '#64748b', // Stalowosiwy
  '#e2e8f0'  // Platynowy / Biały
];

let localPlayerCustomVisuals = {};

export function setLocalPlayerCustomVisuals(custom) {
  if (custom && typeof custom === 'object') {
    localPlayerCustomVisuals = { ...localPlayerCustomVisuals, ...custom };
  }
}

export function getLocalPlayerCustomVisuals() {
  return { ...localPlayerCustomVisuals };
}

/**
 * Rysuje poszarpany kikut mięśniowy i odłamaną kość w miejscu urwanej kończyny
 */
export function drawLimbStump(ctx, x, y, angle, type, facing, visuals, isFront) {
  const v = { ...DEFAULT_VISUALS, ...(visuals || {}) };
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(facing, 1);

  if (type === 'arm') {
    if (!v.sleeveless) {
      ctx.fillStyle = isFront ? (v.armColorFront || '#dc2626') : (v.armColorBack || '#991b1b');
      ctx.beginPath();
      ctx.moveTo(-3, -3.5);
      ctx.lineTo(4.5, -3.5);
      ctx.lineTo(5.5, 3.5);
      ctx.lineTo(-3, 3.5);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(5, 0, 3.5, 4.0, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.ellipse(5.5, 0, 2.2, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(4.5, -1.0, 4.5, 2.0);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(8.0, -1.2, 1.2, 2.4);

    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.arc(5, 0, 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = isFront ? v.shortsColor0 : v.shortsColor2;
    ctx.beginPath();
    ctx.moveTo(-4.5, 0);
    ctx.lineTo(4.5, 0);
    ctx.lineTo(4.0, 6.5);
    ctx.lineTo(-4.0, 6.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(0, 7.0, 4.5, 3.0, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.ellipse(0, 7.2, 3.0, 2.0, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-1.2, 6.0, 2.4, 4.5);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-1.5, 9.5, 3.0, 1.2);

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(1.2, 12.0, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Rysuje uzbrojony granat w dłoni rzucającej (z pulsującą diodą zapalnika i łyżką)
 */
export function drawHandheldGrenade(ctx, x, y, scale = 1.0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Korpus granatu – fasetowany, ciemno-stalowy aero-kanister
  const gGrad = ctx.createLinearGradient(-3.5, -4, 3.5, 4);
  gGrad.addColorStop(0.0, '#334155');
  gGrad.addColorStop(0.4, '#1e293b');
  gGrad.addColorStop(1.0, '#0f172a');

  ctx.fillStyle = gGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 3.6, 4.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Żebrowania segmentów odłamkowych
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-3.0, -1.6); ctx.lineTo(3.0, -1.6);
  ctx.moveTo(-3.4, 0);    ctx.lineTo(3.4, 0);
  ctx.moveTo(-3.0, 1.6);  ctx.lineTo(3.0, 1.6);
  ctx.stroke();

  // Zespół zapalnika (fuse assembly)
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-1.4, -5.8, 2.8, 1.8);

  // Odgięta łyżka bezpiecznika (safety lever)
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(1.0, -5.6);
  ctx.quadraticCurveTo(3.2, -4.2, 2.6, -1.0);
  ctx.stroke();

  // Pulsująca dioda LED uzbrojonego zapalnika (Pulsing Armed LED)
  const pulse = 0.6 + 0.4 * Math.sin(performance.now() * 0.015);
  ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 6 * pulse;
  ctx.beginPath();
  ctx.arc(0, -1.0, 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
}

// =========================================================================
// SYSTEM ŚLADÓW OBRAŻEŃ BITEWNYCH I RAN (PROGRESSIVE BATTLE DAMAGE & WOUNDS)
// Renderuje rany postrzałowe, okopcone otwory wlotowe pocisków, rozdarcia
// odłamkowe, nasiąkającą krew w mundurze i stróżki krwi spływające z ciała.
// =========================================================================

/**
 * Rysuje otwór wlotowy pocisku z okopconą krawędzią balistyczną, kraterem i wsiąkniętą plamą krwi
 */
function drawBulletPuncture(ctx, x, y, radius, alpha) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, alpha);

  // 1. Ciemna plama krwi wsiąkająca w tkaninę/kamizelkę wokół wlotu pocisku
  const haloGrad = ctx.createRadialGradient(x, y, radius * 0.4, x, y, radius * 3.2);
  haloGrad.addColorStop(0.0, 'rgba(127, 29, 29, 0.90)');
  haloGrad.addColorStop(0.5, 'rgba(69, 10, 10, 0.65)');
  haloGrad.addColorStop(1.0, 'rgba(69, 10, 10, 0.0)');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius * 3.2, 0, Math.PI * 2);
  ctx.fill();

  // 2. Okopcona, postrzępiona krawędź wlotu (ballistic powder burn / frayed Kevlar rim)
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.35, 0, Math.PI * 2);
  ctx.fill();

  // 3. Ciemna jama przestrzeliny (entry cavity)
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.85, 0, Math.PI * 2);
  ctx.fill();

  // 4. Świeża krew wypływająca z krawędzi otworu (bright arterial rim highlight)
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 0.65;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.75, 0.25 * Math.PI, 1.25 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

/**
 * Rysuje poszarpaną ranę ciętą lub odłamkową z zakrwawionymi krawędziami
 */
function drawShrapnelSlash(ctx, x1, y1, x2, y2, width, alpha) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, alpha);
  ctx.lineCap = 'round';

  // Otoczka krwi wsiąkniętej w materiał lub skórę
  ctx.strokeStyle = 'rgba(69, 10, 10, 0.70)';
  ctx.lineWidth = width + 2.0;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Głęboki bordowy rdzeń rozcięcia
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = width + 0.6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Świeża jasnoczerwona krew w centrum rany
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = Math.max(0.6, width * 0.45);
  ctx.beginPath();
  ctx.moveTo(x1 * 0.85 + x2 * 0.15, y1 * 0.85 + y2 * 0.15);
  ctx.lineTo(x1 * 0.15 + x2 * 0.85, y1 * 0.15 + y2 * 0.85);
  ctx.stroke();

  ctx.restore();
}

/**
 * Rysuje realistyczną stróżkę krwi spływającą w dół z kroplą na końcu
 */
function drawBloodTrickle(ctx, startX, startY, len, curveX, width, alpha) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, alpha);
  ctx.lineCap = 'round';

  const endX = startX + curveX;
  const endY = startY + len;
  const midX = startX + curveX * 0.45;
  const midY = startY + len * 0.55;

  // Główna ciemnoczerwona stróżka
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = width + 0.6;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(midX, midY, endX, endY);
  ctx.stroke();

  // Jaśniejszy rdzeń krwi
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = Math.max(0.5, width * 0.55);
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(midX, midY, endX, endY);
  ctx.stroke();

  // Kropla zbierająca się na końcu stróżki
  ctx.fillStyle = '#991b1b';
  ctx.beginPath();
  ctx.arc(endX, endY + 0.4, width * 0.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Rysuje rozlaną, wsiąkniętą plamę krwi na tkaninie munduru / kamizelki
 */
function drawBloodSoak(ctx, cx, cy, rx, ry, alpha) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, alpha);
  const grad = ctx.createRadialGradient(cx, cy, 0.8, cx, cy, Math.max(rx, ry));
  grad.addColorStop(0.0, 'rgba(127, 29, 29, 0.85)');
  grad.addColorStop(0.45, 'rgba(80, 10, 10, 0.60)');
  grad.addColorStop(1.0, 'rgba(69, 10, 10, 0.0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Rysuje mikro-odpryski i plamki krwi w stałych współrzędnych
 */
function drawBloodSpecks(ctx, specks, alpha) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, alpha);
  ctx.fillStyle = '#991b1b';
  for (let i = 0; i < specks.length; i++) {
    const s = specks[i];
    ctx.beginPath();
    ctx.arc(s[0], s[1], s[2], 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Rysuje nakładaną kamizelkę kuloodporną / Plate Carrier PMC (warstwa modularna)
 */
export function drawPlateCarrierOverlay(ctx, p, v, absCos, absSin, cosYaw, isLookingAway, shoulderHalfW, waistHalfW, waistY) {
  const vestGrad = ctx.createLinearGradient(-shoulderHalfW, 0, shoulderHalfW, 0);
  const vestBaseCol = isLookingAway ? (v.jerseyBack1 || '#18181b') : (v.jerseyFront1 || '#27272a');
  const vestLightCol = isLookingAway ? (v.jerseyBack0 || '#27272a') : (v.jerseyFront2 || '#3f3f46');
  const vestDarkCol = isLookingAway ? (v.jerseyBack2 || '#09090b') : (v.jerseyFront0 || '#18181b');
  vestGrad.addColorStop(0.0, vestDarkCol);
  vestGrad.addColorStop(0.35, vestBaseCol);
  vestGrad.addColorStop(0.75, vestLightCol);
  vestGrad.addColorStop(1.0, vestDarkCol);

  const strapLeftX = -shoulderHalfW * 0.48;
  const strapRightX = shoulderHalfW * 0.48;
  const scoopCenterX = !isLookingAway ? (cosYaw * 1.0) : (-absSin * 0.8);
  const scoopCenterY = !isLookingAway ? -21.5 : -23.2;

  // Główny korpus plate carriera
  ctx.beginPath();
  ctx.moveTo(-waistHalfW, waistY);
  ctx.lineTo(-shoulderHalfW, -24.4);
  ctx.lineTo(strapLeftX, -24.4);
  ctx.quadraticCurveTo(scoopCenterX, scoopCenterY, strapRightX, -24.4);
  ctx.lineTo(shoulderHalfW, -24.4);
  ctx.lineTo(waistHalfW, waistY);
  ctx.quadraticCurveTo(0, waistY + 0.8, -waistHalfW, waistY);
  ctx.closePath();
  ctx.fillStyle = vestGrad;
  ctx.fill();

  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Pasy nośne i taśmy MOLLE (Modular Lightweight Load-carrying Equipment)
  const plateW = Math.min(shoulderHalfW, waistHalfW) * 1.5;
  const molleCol = 'rgba(0, 0, 0, 0.45)';
  const molleStitch = 'rgba(255, 255, 255, 0.15)';

  // Pas piersiowy MOLLE 1
  ctx.fillStyle = molleCol;
  ctx.fillRect(-plateW * 0.45, -17.0, plateW * 0.9, 1.8);
  ctx.fillStyle = molleStitch;
  ctx.fillRect(-plateW * 0.15, -17.0, 0.8, 1.8);
  ctx.fillRect(plateW * 0.15, -17.0, 0.8, 1.8);

  // Pas brzuszny MOLLE 2
  ctx.fillStyle = molleCol;
  ctx.fillRect(-plateW * 0.48, -12.5, plateW * 0.96, 1.8);
  ctx.fillStyle = molleStitch;
  ctx.fillRect(-plateW * 0.18, -12.5, 0.8, 1.8);
  ctx.fillRect(plateW * 0.18, -12.5, 0.8, 1.8);

  // Pas dolny MOLLE 3
  ctx.fillStyle = molleCol;
  ctx.fillRect(-plateW * 0.50, -8.0, plateW * 1.0, 1.8);
  ctx.fillStyle = molleStitch;
  ctx.fillRect(-plateW * 0.20, -8.0, 0.8, 1.8);
  ctx.fillRect(plateW * 0.20, -8.0, 0.8, 1.8);

  // Panel rzepu taktycznego / Velcro Morale Patch na klatce piersiowej
  if (!isLookingAway && absCos > 0.25) {
    const patchX = (cosYaw * 2.0) - (plateW * 0.32);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(patchX, -20.2, plateW * 0.64, 2.4);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 0.6;
    ctx.strokeRect(patchX, -20.2, plateW * 0.64, 2.4);
  }
}

/**
 * Renderuje rany i ślady krwi na torsie oraz kamizelce kuloodpornej / plate carrierze
 */
function drawTorsoWounds(ctx, dmgRatio, absCos, absSin, cosYaw, plateW, waistHalfW, shoulderHalfW, isLookingAway) {
  if (dmgRatio < 0.15) return;

  const t1 = Math.min(1.0, Math.max(0.0, (dmgRatio - 0.15) / 0.22));
  const t2 = Math.min(1.0, Math.max(0.0, (dmgRatio - 0.37) / 0.25));
  const t3 = Math.min(1.0, Math.max(0.0, (dmgRatio - 0.62) / 0.28));

  const facingSign = cosYaw >= 0 ? 1 : -1;

  if (!isLookingAway) {
    // PRZÓD KAMIZELKI TAKTYCZNEJ / KLATKA PIERSIOWA

    // STAGE 1: Otarcia odłamkowe i pojedyncze plamki krwi
    if (t1 > 0) {
      drawShrapnelSlash(ctx, -plateW * 0.28 * facingSign, -19.5, -plateW * 0.12 * facingSign, -17.0, 0.9, t1 * 0.85);
      drawBloodSpecks(ctx, [
        [plateW * 0.18 * facingSign, -14.5, 0.7],
        [plateW * 0.25 * facingSign, -16.0, 0.6],
        [-plateW * 0.08 * facingSign, -11.0, 0.65]
      ], t1 * 0.8);
    }

    // STAGE 2: Wyraźne przestrzeliny, nasiąkanie kamizelki i pierwsze stróżki
    if (t2 > 0) {
      // Przestrzelina 1: Górna część klatki piersiowej
      const b1X = plateW * 0.22 * facingSign;
      const b1Y = -17.2;
      drawBulletPuncture(ctx, b1X, b1Y, 1.25, t2);
      drawBloodTrickle(ctx, b1X, b1Y + 1.2, 5.0, -0.6 * facingSign, 0.9, t2);

      // Przestrzelina 2: Żebra / splot słoneczny
      const b2X = -plateW * 0.24 * facingSign;
      const b2Y = -12.0;
      drawBulletPuncture(ctx, b2X, b2Y, 1.35, t2);
      drawBloodTrickle(ctx, b2X, b2Y + 1.4, 5.5, 0.8 * facingSign, 1.0, t2);
      drawBloodSoak(ctx, b2X - 0.5, b2Y + 1.0, 3.8, 2.6, t2 * 0.75);

      // Rozcięcie na kołnierzu / szyi
      drawShrapnelSlash(ctx, plateW * 0.10 * facingSign, -23.5, plateW * 0.22 * facingSign, -22.0, 0.8, t2 * 0.9);
    }

    // STAGE 3: Ciężkie rany postrzałowe, głębokie rozdarcia, spływająca krew na pas
    if (t3 > 0) {
      // Przestrzelina 3: Centralny brzuch / dolna płyta kamizelki
      const b3X = plateW * 0.04 * facingSign;
      const b3Y = -7.5;
      drawBulletPuncture(ctx, b3X, b3Y, 1.5, t3);
      drawBloodTrickle(ctx, b3X, b3Y + 1.5, 7.8, -0.4 * facingSign, 1.2, t3);

      // Poszarpane rozdarcie odłamkiem na żebrach
      drawShrapnelSlash(ctx, plateW * 0.32 * facingSign, -10.5, plateW * 0.16 * facingSign, -6.5, 1.2, t3);

      // Duża plama krwi nasiąkająca dolny pas MOLLE
      drawBloodSoak(ctx, b3X + 1.0, -6.0, 5.2, 3.5, t3 * 0.85);
      drawBloodSoak(ctx, -plateW * 0.18 * facingSign, -10.0, 4.5, 3.0, t3 * 0.80);

      // Gęste rozbryzgi krwi
      drawBloodSpecks(ctx, [
        [plateW * 0.12 * facingSign, -8.0, 0.9],
        [-plateW * 0.30 * facingSign, -8.5, 0.8],
        [plateW * 0.28 * facingSign, -4.5, 0.7],
        [0.0, -2.5, 0.85]
      ], t3);
    }

  } else {
    // TYŁ KAMIZELKI / PLECY
    if (t1 > 0) {
      drawShrapnelSlash(ctx, -plateW * 0.22, -18.0, -plateW * 0.05, -16.0, 0.9, t1 * 0.85);
      drawBloodSpecks(ctx, [
        [plateW * 0.20, -15.0, 0.7],
        [-plateW * 0.15, -12.0, 0.6]
      ], t1 * 0.8);
    }

    if (t2 > 0) {
      const bBack1X = plateW * 0.22;
      const bBack1Y = -15.5;
      drawBulletPuncture(ctx, bBack1X, bBack1Y, 1.3, t2);
      drawBloodTrickle(ctx, bBack1X, bBack1Y + 1.2, 5.0, 0.5, 0.9, t2);
      drawBloodSoak(ctx, bBack1X, bBack1Y, 3.5, 2.5, t2 * 0.7);
    }

    if (t3 > 0) {
      const bBack2X = -plateW * 0.18;
      const bBack2Y = -9.0;
      drawBulletPuncture(ctx, bBack2X, bBack2Y, 1.4, t3);
      drawBloodTrickle(ctx, bBack2X, bBack2Y + 1.4, 7.0, -0.6, 1.1, t3);
      drawBloodSoak(ctx, 0, -8.0, 5.0, 3.2, t3 * 0.85);
    }
  }
}

/**
 * Renderuje rany i strużki krwi na profilu głowy
 */
function drawHeadWoundsProfile(ctx, dmgRatio) {
  if (dmgRatio < 0.15) return;

  const t1 = Math.min(1.0, Math.max(0.0, (dmgRatio - 0.15) / 0.22));
  const t2 = Math.min(1.0, Math.max(0.0, (dmgRatio - 0.37) / 0.25));
  const t3 = Math.min(1.0, Math.max(0.0, (dmgRatio - 0.62) / 0.28));

  // STAGE 1: Lekkie rozcięcie łuku brwiowego
  if (t1 > 0) {
    drawShrapnelSlash(ctx, 2.2, -4.1, 3.4, -3.6, 0.65, t1 * 0.9);
    drawBloodSpecks(ctx, [[3.6, -3.5, 0.45]], t1);
  }

  // STAGE 2: Krew spływająca z brwi na skroń, rozcięta warga i otarcie na policzku
  if (t2 > 0) {
    drawShrapnelSlash(ctx, 1.8, -4.3, 3.6, -3.6, 0.85, t2);
    drawBloodTrickle(ctx, 2.0, -3.7, 3.2, -0.6, 0.75, t2);
    drawShrapnelSlash(ctx, 4.8, 1.8, 5.3, 2.4, 0.75, t2);
    drawBloodSpecks(ctx, [[5.2, 2.5, 0.55]], t2);
    drawShrapnelSlash(ctx, 2.6, 0.2, 3.6, 0.8, 0.65, t2 * 0.85);
  }

  // STAGE 3: Strużka krwi z ust spływająca po podbródku, rany czołowe
  if (t3 > 0) {
    drawBloodTrickle(ctx, 4.9, 2.4, 3.0, -0.6, 0.85, t3);
    drawBloodSoak(ctx, 0.6, -5.4, 1.8, 1.2, t3 * 0.8);
    drawShrapnelSlash(ctx, -0.2, -5.6, 1.6, -5.0, 0.8, t3);
    drawBloodSpecks(ctx, [
      [3.2, 1.6, 0.5],
      [1.4, -1.0, 0.45],
      [3.8, 4.5, 0.6]
    ], t3);
  }
}

/**
 * Renderuje rany na twarzy w widoku z przodu / 3/4
 */
function drawHeadWoundsFront(ctx, dmgRatio) {
  if (dmgRatio < 0.15) return;

  const t1 = Math.min(1.0, Math.max(0.0, (dmgRatio - 0.15) / 0.22));
  const t2 = Math.min(1.0, Math.max(0.0, (dmgRatio - 0.37) / 0.25));
  const t3 = Math.min(1.0, Math.max(0.0, (dmgRatio - 0.62) / 0.28));

  if (t1 > 0) {
    drawShrapnelSlash(ctx, 1.4, -3.2, 2.8, -2.8, 0.65, t1 * 0.9);
    drawBloodSpecks(ctx, [[2.9, -2.7, 0.45]], t1);
  }

  if (t2 > 0) {
    drawBloodTrickle(ctx, 2.2, -2.7, 3.4, 0.4, 0.75, t2);
    drawShrapnelSlash(ctx, 0.4, 2.2, 1.2, 2.7, 0.75, t2);
    drawShrapnelSlash(ctx, -2.8, 0.2, -1.6, 0.8, 0.65, t2 * 0.85);
  }

  if (t3 > 0) {
    drawBloodTrickle(ctx, 0.8, 2.6, 2.8, -0.2, 0.85, t3);
    drawShrapnelSlash(ctx, -3.2, -2.5, -2.0, -1.8, 0.8, t3);
    drawBloodSoak(ctx, -2.4, -2.0, 1.5, 1.0, t3 * 0.75);
    drawBloodSpecks(ctx, [
      [-1.2, 1.5, 0.5],
      [2.0, 0.8, 0.45],
      [0.6, 4.8, 0.6]
    ], t3);
  }
}

/**
 * Renderuje rany z tyłu głowy / hełmu
 */
function drawHeadWoundsAway(ctx, dmgRatio) {
  if (dmgRatio < 0.25) return;
  const t2 = Math.min(1.0, Math.max(0.0, (dmgRatio - 0.25) / 0.30));
  const t3 = Math.min(1.0, Math.max(0.0, (dmgRatio - 0.60) / 0.30));

  if (t2 > 0) {
    drawShrapnelSlash(ctx, -2.0, 2.2, 1.2, 2.8, 0.8, t2 * 0.85);
    drawBloodSpecks(ctx, [[-0.5, 3.2, 0.55]], t2);
  }
  if (t3 > 0) {
    drawBloodSoak(ctx, 0.0, 2.5, 2.5, 1.8, t3 * 0.75);
    drawBloodTrickle(ctx, 0.2, 2.8, 3.2, 0.4, 0.8, t3);
  }
}

/**
 * Renderuje anatomiczną, taktyczną dłoń bojową w rękawicy taktycznej z protektorem kostek
 * Zastępuje dawną "kulkę" profesjonalną rękawicą operatorską (Mechanix / Oakley style)
 */
export function drawTacticalHand(ctx, foreLen, wristR, isFront, muscle, isSculpted, v) {
  const handScale = (isFront ? 1.0 : 0.88) * (isSculpted ? Math.max(1.0, muscle * 0.95) : muscle);
  const hX = foreLen - 0.4;
  const useGloves = v.hasTacticalGloves !== false;
  const gloveCol0 = v.gloveColor || '#18181b';
  const gloveCol1 = '#27272a';
  const gloveCol2 = '#3f3f46';

  // 1. MANKIET RĘKAWICY / PASEK Z RZEPEM VELCRO (Cuff & Wrist Strap)
  if (useGloves) {
    const cuffW = 2.2 * handScale;
    const cuffH = wristR * 1.12;
    const cuffGrad = ctx.createLinearGradient(hX - 0.8, -cuffH, hX + cuffW, cuffH);
    cuffGrad.addColorStop(0.0, '#09090b');
    cuffGrad.addColorStop(0.5, gloveCol0);
    cuffGrad.addColorStop(1.0, '#09090b');

    ctx.fillStyle = cuffGrad;
    ctx.beginPath();
    ctx.rect(hX - 0.8, -cuffH, cuffW, cuffH * 2);
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // Pasek z rzepem Velcro na nadgarstku (Wrist Cinch Strap)
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(hX - 0.4, -cuffH * 0.7, 1.2, cuffH * 1.4);
    ctx.fillStyle = '#71717a';
    ctx.fillRect(hX + 0.4, -cuffH * 0.35, 0.6, cuffH * 0.7);
  }

  // 2. GŁÓWNA BRYŁA DŁONI / ŚRÓDRĘCZE (Metacarpus & Palm)
  const palmLen = 4.8 * handScale;
  const palmTop = -2.4 * handScale;
  const palmBottom = 2.2 * handScale;

  const palmGrad = ctx.createLinearGradient(hX, palmTop, hX + palmLen, palmBottom);
  if (useGloves) {
    palmGrad.addColorStop(0.0, isFront ? gloveCol1 : gloveCol0);
    palmGrad.addColorStop(0.4, isFront ? gloveCol2 : gloveCol1);
    palmGrad.addColorStop(0.85, isFront ? gloveCol1 : gloveCol0);
    palmGrad.addColorStop(1.0, '#09090b');
  } else {
    palmGrad.addColorStop(0.0, isFront ? v.skinLight : v.skinMid);
    palmGrad.addColorStop(0.55, isFront ? v.skinMid : v.skinBack);
    palmGrad.addColorStop(1.0, v.skinDark);
  }

  // Anatomiczny profil dłoni w chwycie bojowym (nie owal, lecz ścięte śródręcze przechodzące w palce)
  ctx.beginPath();
  ctx.moveTo(hX + 0.8, palmTop * 0.85);
  ctx.lineTo(hX + palmLen * 0.65, palmTop * 1.15);
  ctx.lineTo(hX + palmLen, palmTop * 0.55);
  ctx.lineTo(hX + palmLen + 1.2, 0.0);
  ctx.lineTo(hX + palmLen * 0.95, palmBottom * 0.65);
  ctx.lineTo(hX + palmLen * 0.75, palmBottom * 0.95);
  ctx.lineTo(hX + palmLen * 0.35, palmBottom);
  ctx.lineTo(hX + 0.8, palmBottom * 0.75);
  ctx.closePath();
  ctx.fillStyle = palmGrad;
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // 3. PROTEKTOR KOSTEK (Tactical Knuckle Guard)
  if (useGloves) {
    const kX = hX + palmLen * 0.35;
    const kW = palmLen * 0.42;
    const kH = Math.abs(palmTop) * 1.2;

    const kGrad = ctx.createLinearGradient(kX, -kH, kX + kW, kH);
    kGrad.addColorStop(0.0, '#52525b');
    kGrad.addColorStop(0.5, '#27272a');
    kGrad.addColorStop(1.0, '#09090b');

    ctx.fillStyle = kGrad;
    ctx.beginPath();
    ctx.moveTo(kX, -kH * 0.75);
    ctx.quadraticCurveTo(kX + kW * 0.5, -kH * 1.05, kX + kW, -kH * 0.6);
    ctx.lineTo(kX + kW * 0.85, 0.2);
    ctx.lineTo(kX + kW * 0.15, 0.0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.fillStyle = '#71717a';
    for (let i = 0; i < 3; i++) {
      const segX = kX + 0.4 + i * (kW * 0.28);
      const segY = -kH * 0.65 + i * 0.2;
      ctx.fillRect(segX, segY, 0.9, 1.6);
    }
  }

  // 4. KCIUK TAKTYCZNY (Tactical Thumb)
  const thumbBaseX = hX + palmLen * 0.20;
  const thumbTipX = hX + palmLen * 0.72;
  const thumbGrad = ctx.createLinearGradient(thumbBaseX, -1.8, thumbTipX, 1.2);
  if (useGloves) {
    thumbGrad.addColorStop(0.0, gloveCol1);
    thumbGrad.addColorStop(0.6, gloveCol2);
    thumbGrad.addColorStop(1.0, '#09090b');
  } else {
    thumbGrad.addColorStop(0.0, isFront ? v.skinLight : v.skinMid);
    thumbGrad.addColorStop(1.0, isFront ? v.skinMid : v.skinDark);
  }

  ctx.beginPath();
  ctx.moveTo(thumbBaseX, -0.6 * handScale);
  ctx.quadraticCurveTo(hX + palmLen * 0.45, -1.8 * handScale, thumbTipX, -0.4 * handScale);
  ctx.lineTo(hX + palmLen * 0.60, 0.8 * handScale);
  ctx.lineTo(thumbBaseX + 0.4, 0.3 * handScale);
  ctx.closePath();
  ctx.fillStyle = thumbGrad;
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.85;
  ctx.stroke();

  if (useGloves) {
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(thumbTipX - 0.6, -0.2 * handScale, 0.8 * handScale, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. SEGMENTY ZGIĘTYCH PALCÓW (Fingers in Grip)
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(hX + palmLen * 0.75, -0.2);
  ctx.lineTo(hX + palmLen + 0.8, -0.2);
  ctx.moveTo(hX + palmLen * 0.70, 0.8);
  ctx.lineTo(hX + palmLen + 0.4, 0.8);
  ctx.moveTo(hX + palmLen * 0.55, 1.6);
  ctx.lineTo(hX + palmLen * 0.85, 1.6);
  ctx.stroke();

  ctx.fillStyle = useGloves ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(hX + palmLen * 0.8, -0.8, 1.4, 0.6);
}

export function renderArm(ctx, shX, shY, swingAngle, elbowAngle, facing, upperCol, foreCol, isFront, visuals, armUpperLen = 14, armForeLen = 13, playerRef = null) {
  const v = { ...DEFAULT_VISUALS, ...(visuals || {}) };
  const upperLen = armUpperLen || 14;
  const foreLen = armForeLen || 13;
  const muscle = v.muscleMult || 1.0;
  const isSculpted = !!v.sculptedMuscles;

  const armMaxHp = playerRef ? (playerRef.maxHp || 100) : 100;
  const armCurHp = playerRef ? Math.max(0, playerRef.hp ?? 100) : armMaxHp;
  const armDmgRatio = (playerRef && playerRef.isDead) ? 1.0 : Math.max(0, Math.min(1.0, 1.0 - (armCurHp / armMaxHp)));

  let elbowX = shX + Math.sin(swingAngle) * upperLen * facing;
  let elbowY = shY + Math.cos(swingAngle) * upperLen;

  const forearmAngle = swingAngle + elbowAngle;
  let wristX = elbowX + Math.sin(forearmAngle) * foreLen * facing;
  let wristY = elbowY + Math.cos(forearmAngle) * foreLen;

  // W pozycji leżącej (PRONE) łokieć i przedramię opierają się na podłożu i nie wnikają pod ziemię
  if (playerRef && playerRef.isProne && !playerRef.isDead) {
    const proneFloorY = (playerRef.currentGroundY || playerRef.groundY || (playerRef.y + (playerRef.h || 70))) - 2.0;
    if (elbowY > proneFloorY) {
      const dyOver = elbowY - proneFloorY;
      elbowY = proneFloorY;
      wristY -= dyOver * 0.45;
    }
    if (wristY > proneFloorY) {
      wristY = proneFloorY;
    }
  }

  const armDir = Math.atan2(elbowY - shY, elbowX - shX);
  const foreDir = Math.atan2(wristY - elbowY, wristX - elbowX);

  ctx.save();
  ctx.translate(shX, shY);
  ctx.rotate(armDir);

  const sleeveLen = v.sleeveless ? 0 : (upperLen * 0.58 * (v.sleeveLengthMult ?? 1.0));
  const sleeveHalfH = 3.9 * muscle;
  const armHalfH = 2.8 * muscle;

  const deltoidW = armHalfH * (isSculpted ? 1.48 : 1.32);
  const deltoidLen = upperLen * (isSculpted ? 0.48 : 0.42);

  const deltoidGrad = ctx.createRadialGradient(deltoidLen * 0.2, -deltoidW * 0.25, 1.0, deltoidLen * 0.35, 0, deltoidW * 1.4);
  if (isFront) {
    deltoidGrad.addColorStop(0.0, v.skinLight);
    deltoidGrad.addColorStop(0.40, v.skinMid);
    deltoidGrad.addColorStop(0.85, v.skinDark);
    deltoidGrad.addColorStop(1.0, '#78350f');
  } else {
    deltoidGrad.addColorStop(0.0, v.skinMid);
    deltoidGrad.addColorStop(0.45, v.skinBack);
    deltoidGrad.addColorStop(1.0, v.skinDark);
  }

  if (v.sleeveless) {
    ctx.beginPath();
    ctx.arc(0, 0, deltoidW * 0.92, Math.PI * 0.5, -Math.PI * 0.5, false);
    ctx.quadraticCurveTo(deltoidLen * 0.55, -deltoidW * 0.92, deltoidLen, -armHalfH * 0.65);
    ctx.lineTo(deltoidLen, armHalfH * 0.65);
    ctx.quadraticCurveTo(deltoidLen * 0.55, deltoidW * 0.92, 0, deltoidW * 0.92);
    ctx.closePath();
    ctx.fillStyle = deltoidGrad;
    ctx.fill();

    if (isSculpted) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.20)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(deltoidLen * 0.15, -deltoidW * 0.55);
      ctx.quadraticCurveTo(deltoidLen * 0.52, -deltoidW * 0.22, deltoidLen * 0.85, 0);
      ctx.stroke();
    }
  } else if (sleeveLen > 0) {
    const sleeveGrad = ctx.createLinearGradient(0, -deltoidW, 0, deltoidW);
    sleeveGrad.addColorStop(0.0, upperCol || v.armColorFront);
    sleeveGrad.addColorStop(0.45, upperCol || v.armColorFront);
    sleeveGrad.addColorStop(1.0, v.armColorBack || '#18181b');

    // Organiczny obrys rękawa z gładką główką barku i lekko podwiniętym mankietem
    ctx.beginPath();
    ctx.arc(0, 0, sleeveHalfH * 0.92, Math.PI * 0.5, -Math.PI * 0.5, false);
    ctx.bezierCurveTo(
      sleeveLen * 0.28, -sleeveHalfH * 1.02,
      sleeveLen * 0.65, -sleeveHalfH * 1.06,
      sleeveLen, -sleeveHalfH * 0.94
    );
    // Zaokrąglona krawędź mankietu
    ctx.quadraticCurveTo(sleeveLen + 0.9, 0, sleeveLen - 0.3, sleeveHalfH * 0.98);
    // Dolna linia rękawa z lekkim pofalowaniem materiału pod pachą
    ctx.bezierCurveTo(
      sleeveLen * 0.62, sleeveHalfH * 1.06,
      sleeveLen * 0.28, sleeveHalfH * 0.96,
      0, sleeveHalfH * 0.92
    );
    ctx.closePath();
    ctx.fillStyle = sleeveGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.85;
    ctx.stroke();

    // Podwinięty brzeg rękawa (mankiet z tkaniny zamiast prostego białego paska)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(sleeveLen - 1.5, -sleeveHalfH * 0.92);
    ctx.quadraticCurveTo(sleeveLen - 0.7, 0, sleeveLen - 1.7, sleeveHalfH * 0.94);
    ctx.stroke();

    // Fałdy napięcia materiału pod pachą i w zgięciu ramienia
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.30)';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(sleeveLen * 0.18, sleeveHalfH * 0.65);
    ctx.quadraticCurveTo(sleeveLen * 0.45, sleeveHalfH * 0.15, sleeveLen * 0.72, -sleeveHalfH * 0.20);
    ctx.moveTo(sleeveLen * 0.35, sleeveHalfH * 0.78);
    ctx.quadraticCurveTo(sleeveLen * 0.58, sleeveHalfH * 0.38, sleeveLen * 0.82, sleeveHalfH * 0.12);
    ctx.stroke();

    // Subtelny blask na grzbiecie fałdy rękawa
    ctx.strokeStyle = isFront ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(sleeveLen * 0.15, -sleeveHalfH * 0.55);
    ctx.quadraticCurveTo(sleeveLen * 0.50, -sleeveHalfH * 0.65, sleeveLen * 0.85, -sleeveHalfH * 0.45);
    ctx.stroke();
  }

  const bicepGrad = ctx.createLinearGradient(0, -armHalfH * 1.4, 0, armHalfH * 1.4);
  if (isFront) {
    bicepGrad.addColorStop(0.0, v.skinLight);
    bicepGrad.addColorStop(0.35, v.skinMid);
    bicepGrad.addColorStop(0.85, v.skinDark);
    bicepGrad.addColorStop(1.0, '#78350f');
  } else {
    bicepGrad.addColorStop(0.0, v.skinMid);
    bicepGrad.addColorStop(0.4, v.skinBack);
    bicepGrad.addColorStop(1.0, v.skinDark);
  }

  ctx.beginPath();
  if (isSculpted) {
    const startX = v.sleeveless ? deltoidLen * 0.35 : sleeveLen;
    ctx.moveTo(startX, -armHalfH * 1.05);
    ctx.quadraticCurveTo(upperLen * 0.35, -armHalfH * 1.55, upperLen * 0.65, -armHalfH * 1.25);
    ctx.lineTo(upperLen, -armHalfH * 0.75);
    ctx.lineTo(upperLen, armHalfH * 0.65);
    ctx.quadraticCurveTo(upperLen * 0.55, armHalfH * 1.60, upperLen * 0.25, armHalfH * 1.15);
    ctx.quadraticCurveTo(startX, armHalfH * 0.95, startX, -armHalfH * 1.05);
  } else {
    const startX = v.sleeveless ? 0 : sleeveLen;
    const bareLen = upperLen - startX + 1.2;
    if (ctx.roundRect) ctx.roundRect(startX, -armHalfH, bareLen, armHalfH * 2, 2);
    else ctx.rect(startX, -armHalfH, bareLen, armHalfH * 2);
  }
  ctx.closePath();
  ctx.fillStyle = bicepGrad;
  ctx.fill();

  if (isSculpted) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(upperLen * 0.38, -armHalfH * 0.2);
    ctx.quadraticCurveTo(upperLen * 0.58, 0, upperLen * 0.78, armHalfH * 0.2);
    ctx.stroke();
  }

  // Rany i ślady krwi na ramieniu / bicepsie
  if (armDmgRatio >= 0.15) {
    const t1 = Math.min(1.0, Math.max(0.0, (armDmgRatio - 0.15) / 0.22));
    const t2 = Math.min(1.0, Math.max(0.0, (armDmgRatio - 0.37) / 0.25));
    const t3 = Math.min(1.0, Math.max(0.0, (armDmgRatio - 0.62) / 0.28));

    if (isFront) {
      if (t1 > 0) {
        drawShrapnelSlash(ctx, upperLen * 0.28, -armHalfH * 0.75, upperLen * 0.48, -armHalfH * 0.35, 0.7, t1 * 0.85);
      }
      if (t2 > 0) {
        drawShrapnelSlash(ctx, upperLen * 0.42, -armHalfH * 0.85, upperLen * 0.72, -armHalfH * 0.55, 0.9, t2);
        drawBloodTrickle(ctx, upperLen * 0.60, -armHalfH * 0.65, 4.2, upperLen * 0.15, 0.8, t2);
        drawBloodSoak(ctx, upperLen * 0.55, -armHalfH * 0.6, 2.8, 1.8, t2 * 0.75);
      }
      if (t3 > 0) {
        drawBulletPuncture(ctx, upperLen * 0.52, 0.0, 1.15, t3);
        drawBloodSpecks(ctx, [[upperLen * 0.35, armHalfH * 0.3, 0.6], [upperLen * 0.75, 0.4, 0.55]], t3);
      }
    } else {
      if (t1 > 0) {
        drawShrapnelSlash(ctx, upperLen * 0.35, armHalfH * 0.35, upperLen * 0.55, armHalfH * 0.70, 0.7, t1 * 0.8);
      }
      if (t2 > 0) {
        drawBulletPuncture(ctx, upperLen * 0.48, -armHalfH * 0.2, 1.1, t2);
        drawBloodTrickle(ctx, upperLen * 0.48, 0.0, 4.0, upperLen * 0.1, 0.75, t2);
      }
      if (t3 > 0) {
        drawBloodSoak(ctx, upperLen * 0.50, 0.0, 3.2, 2.0, t3 * 0.8);
      }
    }
  }

  ctx.restore();

  ctx.save();
  ctx.translate(elbowX, elbowY);
  ctx.rotate(foreDir);

  const elbowR = 2.9 * muscle;
  const wristR = 1.9 * (isSculpted ? Math.max(1.1, muscle * 0.85) : muscle);

  const jointGrad = ctx.createLinearGradient(0, -elbowR, 0, elbowR);
  jointGrad.addColorStop(0.0, isFront ? v.skinLight : v.skinMid);
  jointGrad.addColorStop(0.5, isFront ? v.skinMid : v.skinBack);
  jointGrad.addColorStop(1.0, v.skinDark);

  ctx.beginPath();
  ctx.arc(0, 0, elbowR * 0.8, 0, Math.PI * 2);
  ctx.fillStyle = jointGrad;
  ctx.fill();

  const forearmGrad = ctx.createLinearGradient(0, -elbowR * 1.4, 0, elbowR * 1.4);
  if (isFront) {
    forearmGrad.addColorStop(0.0, v.skinLight);
    forearmGrad.addColorStop(0.35, v.skinMid);
    forearmGrad.addColorStop(1.0, v.skinDark);
  } else {
    forearmGrad.addColorStop(0.0, v.skinMid);
    forearmGrad.addColorStop(0.4, v.skinBack);
    forearmGrad.addColorStop(1.0, v.skinDark);
  }

  ctx.beginPath();
  if (isSculpted) {
    ctx.moveTo(0, -elbowR * 0.85);
    ctx.quadraticCurveTo(foreLen * 0.28, -elbowR * 1.45, foreLen * 0.65, -wristR * 1.15);
    ctx.lineTo(foreLen * 0.85, -wristR);
    ctx.lineTo(foreLen * 0.85, wristR);
    ctx.quadraticCurveTo(foreLen * 0.35, elbowR * 1.25, 0, elbowR * 0.85);
  } else {
    ctx.moveTo(0, -elbowR);
    ctx.lineTo(foreLen * 0.78, -wristR);
    ctx.lineTo(foreLen * 0.78, wristR);
    ctx.lineTo(0, elbowR);
  }
  ctx.closePath();
  ctx.fillStyle = forearmGrad;
  ctx.fill();

  if (isSculpted) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(foreLen * 0.20, -elbowR * 0.3);
    ctx.lineTo(foreLen * 0.60, -wristR * 0.2);
    ctx.stroke();
  }

  if (isFront && v.hasWristband) {
    const bandX = foreLen * 0.52;
    const bandW = 4.0;
    ctx.fillStyle = v.wristbandColor;
    ctx.fillRect(bandX, -wristR - 0.5, bandW, (wristR + 0.5) * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(bandX, -wristR - 0.5, bandW, (wristR + 0.5) * 2);
  }

  // DŁOŃ BOJOWA W RĘKAWICY TAKTYCZNEJ (Zastępuje dawną kulkę)
  drawTacticalHand(ctx, foreLen, wristR, isFront, muscle, isSculpted, v);

  if (isFront && visuals && visuals.heldGrenade) {
    drawHandheldGrenade(ctx, foreLen + 4.2, 0, 1.0);
  }

  // Rany i rozcięcia na przedramieniu i dłoni
  if (armDmgRatio >= 0.25) {
    const t2 = Math.min(1.0, Math.max(0.0, (armDmgRatio - 0.25) / 0.30));
    const t3 = Math.min(1.0, Math.max(0.0, (armDmgRatio - 0.60) / 0.28));

    if (isFront) {
      if (t2 > 0) {
        drawShrapnelSlash(ctx, foreLen * 0.25, -wristR * 0.6, foreLen * 0.60, -wristR * 0.35, 0.8, t2);
        drawBloodTrickle(ctx, foreLen * 0.50, -wristR * 0.4, 4.5, foreLen * 0.2, 0.75, t2);
        drawBloodSoak(ctx, foreLen * 0.45, -wristR * 0.3, 2.5, 1.6, t2 * 0.7);
      }
      if (t3 > 0) {
        drawShrapnelSlash(ctx, foreLen * 0.55, wristR * 0.2, foreLen * 0.82, wristR * 0.45, 0.9, t3);
        drawBloodSpecks(ctx, [[foreLen * 0.88, -0.4, 0.65], [foreLen * 0.95, 0.6, 0.55]], t3);
      }
    } else {
      if (t2 > 0) {
        drawShrapnelSlash(ctx, foreLen * 0.35, 0.0, foreLen * 0.68, wristR * 0.3, 0.75, t2 * 0.85);
        drawBloodTrickle(ctx, foreLen * 0.55, 0.0, 4.0, foreLen * 0.15, 0.7, t2);
      }
      if (t3 > 0) {
        drawBloodSoak(ctx, foreLen * 0.50, 0.0, 2.8, 1.8, t3 * 0.8);
      }
    }
  }

  ctx.restore();
}

export function renderIKLeg(ctx, hipX, hipY, targetFootX, targetFootY, l1, l2, ankleRot, facing, colorThigh, colorShin, colorBoot, isFront, visuals, playerRef = null) {
  const v = { ...DEFAULT_VISUALS, ...(visuals || {}) };
  const muscle = v.muscleMult || 1.0;
  const isSculpted = !!v.sculptedMuscles;
  const isFrontLeg = !!isFront;

  const legMaxHp = playerRef ? (playerRef.maxHp || 100) : 100;
  const legCurHp = playerRef ? Math.max(0, playerRef.hp ?? 100) : legMaxHp;
  const legDmgRatio = (playerRef && playerRef.isDead) ? 1.0 : Math.max(0, Math.min(1.0, 1.0 - (legCurHp / legMaxHp)));

  const isSpecialKickOrProne = !!(playerRef && (
    playerRef.isProne ||
    playerRef.kickMode === 'SPARTAN' ||
    playerRef.kickMode === 'BACKFLIP' ||
    playerRef.kickMode === 'SPIN_VOLLEY' ||
    playerRef.kickMode === 'SCISSOR' ||
    playerRef.kickState === 'SWING' ||
    playerRef.isSliding ||
    playerRef.kneeJuggleWeight > 0 ||
    playerRef.isIntro ||
    (playerRef.jumpTakeoffTimer > 0 && (playerRef.jumpLaunchSpeed || 0) > 0.8)
  ));

  const safeFootY = isSpecialKickOrProne ? targetFootY : Math.max(hipY + 6, targetFootY);
  if (playerRef && playerRef.isProne && !playerRef.isDead) {
    // Projekcja 2.5D w leżeniu: przy podciąganiu kolana w bok po ziemi udo i łydka ulegają skrótowi perspektywicznemu,
    // dzięki czemu nakolannik ślizga się płasko po powierzchni gruntu zamiast wbijać się pod ziemię lub sterczeć w górę
    const dProne = Math.hypot(targetFootX - hipX, safeFootY - hipY);
    const desiredTotalL = Math.min(l1 + l2, Math.sqrt(dProne * dProne + 32));
    const proneScale = Math.max(0.62, desiredTotalL / Math.max(1, l1 + l2));
    l1 = l1 * proneScale;
    l2 = l2 * proneScale;
  }
  const ik = solve2BoneIK(hipX, hipY, targetFootX, safeFootY, l1, l2, facing, -1, isSpecialKickOrProne);
  const thighAng = Math.atan2(ik.kneeY - hipY, ik.kneeX - hipX);
  const shinAng = Math.atan2(ik.footY - ik.kneeY, ik.footX - ik.kneeX);

  ctx.save();

  // UDO - BOJÓWKI CARGO PMC
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(thighAng);

  const thighHalfH = 4.15 * muscle;
  const pantsGrad = ctx.createLinearGradient(0, -thighHalfH, 0, thighHalfH);
  const pantsThighCol = isFrontLeg ? (v.legThighFront || '#3f3f46') : (v.legThighBack || '#27272a');
  pantsGrad.addColorStop(0.0, pantsThighCol);
  pantsGrad.addColorStop(0.4, isFrontLeg ? (v.shortsColor1 || '#334155') : '#1e293b');
  pantsGrad.addColorStop(1.0, isFrontLeg ? (v.shortsColor2 || '#18181b') : '#0f172a');

  // Nogawka bojówek na udzie – płynne przejście z miednicy bez czarnego obrysu wokół kulki biodra
  ctx.beginPath();
  ctx.moveTo(0, thighHalfH);
  ctx.quadraticCurveTo(-thighHalfH * 0.42, 0, 0, -thighHalfH);
  // Górny/przedni profil uda
  ctx.bezierCurveTo(
    l1 * 0.32, -thighHalfH * 1.06,
    l1 * 0.68, -thighHalfH * 1.00,
    l1 - 2.2, -thighHalfH * 0.78
  );
  // Marszczenie nad nakolannikiem
  ctx.quadraticCurveTo(l1 - 0.6, -thighHalfH * 0.52, l1, -2.5);
  ctx.lineTo(l1, 2.5);
  // Dolny/tylny profil uda
  ctx.quadraticCurveTo(l1 - 1.0, thighHalfH * 0.68, l1 - 2.8, thighHalfH * 0.88);
  ctx.bezierCurveTo(
    l1 * 0.65, thighHalfH * 1.04,
    l1 * 0.28, thighHalfH * 0.96,
    0, thighHalfH
  );
  ctx.closePath();
  ctx.fillStyle = pantsGrad;
  ctx.fill();

  // Obrys zewnętrzny nogawki (tylko wzdłuż uda od x = 3.2, bez zamykania kółka na biodrze!)
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(3.2, -thighHalfH * 1.01);
  ctx.bezierCurveTo(
    l1 * 0.42, -thighHalfH * 1.06,
    l1 * 0.70, -thighHalfH * 1.00,
    l1 - 2.2, -thighHalfH * 0.78
  );
  ctx.quadraticCurveTo(l1 - 0.6, -thighHalfH * 0.52, l1, -2.5);
  ctx.moveTo(l1, 2.5);
  ctx.quadraticCurveTo(l1 - 1.0, thighHalfH * 0.68, l1 - 2.8, thighHalfH * 0.88);
  ctx.bezierCurveTo(
    l1 * 0.68, thighHalfH * 1.04,
    l1 * 0.36, thighHalfH * 0.98,
    3.4, thighHalfH * 0.96
  );
  ctx.stroke();

  // Zagięcia materiału w pachwinie i z tyłu kolana
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(l1 * 0.14, -thighHalfH * 0.55);
  ctx.quadraticCurveTo(l1 * 0.22, -thighHalfH * 0.08, l1 * 0.18, thighHalfH * 0.42);
  ctx.moveTo(l1 * 0.76, thighHalfH * 0.72);
  ctx.quadraticCurveTo(l1 * 0.84, thighHalfH * 0.20, l1 * 0.90, -thighHalfH * 0.25);
  ctx.moveTo(l1 * 0.85, thighHalfH * 0.62);
  ctx.quadraticCurveTo(l1 * 0.91, thighHalfH * 0.25, l1 * 0.95, -0.5);
  ctx.stroke();

  // Boczna kieszeń miechowa Cargo (wyprofilowana z fałdą i klapą)
  const pocketX = l1 * 0.24;
  const pocketW = l1 * 0.48;
  const pocketH = thighHalfH * 0.82;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.moveTo(pocketX + 0.4, -pocketH);
  ctx.quadraticCurveTo(pocketX + pocketW * 0.5, -pocketH - 0.9, pocketX + pocketW + 0.4, -pocketH);
  ctx.quadraticCurveTo(pocketX + pocketW + 0.9, 0, pocketX + pocketW + 0.3, pocketH * 0.82);
  ctx.quadraticCurveTo(pocketX + pocketW * 0.5, pocketH * 0.98, pocketX + 0.3, pocketH * 0.82);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = isFrontLeg ? (v.shortsColor0 || '#27272a') : 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.moveTo(pocketX, -pocketH);
  ctx.quadraticCurveTo(pocketX + pocketW * 0.5, -pocketH - 0.7, pocketX + pocketW, -pocketH);
  ctx.quadraticCurveTo(pocketX + pocketW + 0.5, 0, pocketX + pocketW, pocketH * 0.76);
  ctx.quadraticCurveTo(pocketX + pocketW * 0.5, pocketH * 0.92, pocketX, pocketH * 0.76);
  ctx.quadraticCurveTo(pocketX - 0.4, 0, pocketX, -pocketH);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.50)';
  ctx.lineWidth = 0.75;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.beginPath();
  ctx.moveTo(pocketX + pocketW * 0.5, -pocketH + 1.2);
  ctx.lineTo(pocketX + pocketW * 0.5, pocketH * 0.78);
  ctx.stroke();

  ctx.fillStyle = isFrontLeg ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.moveTo(pocketX - 0.4, -pocketH - 0.5);
  ctx.quadraticCurveTo(pocketX + pocketW * 0.5, -pocketH - 1.2, pocketX + pocketW + 0.4, -pocketH - 0.5);
  ctx.lineTo(pocketX + pocketW + 0.2, -pocketH + 1.5);
  ctx.quadraticCurveTo(pocketX + pocketW * 0.5, -pocketH + 2.1, pocketX - 0.2, -pocketH + 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.lineWidth = 0.7;
  ctx.stroke();

  // Rany postrzałowe i rozdarcia bojówek na udzie
  if (legDmgRatio >= 0.15) {
    const t1 = Math.min(1.0, Math.max(0.0, (legDmgRatio - 0.15) / 0.22));
    const t2 = Math.min(1.0, Math.max(0.0, (legDmgRatio - 0.37) / 0.25));
    const t3 = Math.min(1.0, Math.max(0.0, (legDmgRatio - 0.62) / 0.28));

    if (isFrontLeg) {
      if (t1 > 0) {
        drawShrapnelSlash(ctx, l1 * 0.35, -thighHalfH * 0.30, l1 * 0.48, -thighHalfH * 0.15, 0.75, t1 * 0.85);
        drawBloodSpecks(ctx, [[l1 * 0.42, -thighHalfH * 0.25, 0.6]], t1);
      }
      if (t2 > 0) {
        const bLegX = l1 * 0.48;
        const bLegY = -thighHalfH * 0.35;
        drawBulletPuncture(ctx, bLegX, bLegY, 1.25, t2);
        drawBloodSoak(ctx, bLegX, bLegY, 4.0, 2.8, t2 * 0.85);
        drawBloodTrickle(ctx, bLegX, bLegY + 1.2, 5.5, l1 * 0.22, 0.9, t2);
      }
      if (t3 > 0) {
        drawShrapnelSlash(ctx, l1 * 0.68, thighHalfH * 0.30, l1 * 0.88, thighHalfH * 0.10, 1.1, t3);
        drawBloodSoak(ctx, l1 * 0.75, 0.0, 5.0, 3.2, t3 * 0.85);
        drawBloodSpecks(ctx, [[l1 * 0.30, thighHalfH * 0.35, 0.7], [l1 * 0.60, -thighHalfH * 0.20, 0.8]], t3);
      }
    } else {
      if (t1 > 0) {
        drawShrapnelSlash(ctx, l1 * 0.40, 0.0, l1 * 0.58, thighHalfH * 0.25, 0.75, t1 * 0.8);
      }
      if (t2 > 0) {
        drawShrapnelSlash(ctx, l1 * 0.52, -thighHalfH * 0.25, l1 * 0.75, 0.0, 0.9, t2);
        drawBloodTrickle(ctx, l1 * 0.60, 0.0, 4.5, l1 * 0.15, 0.8, t2);
        drawBloodSoak(ctx, l1 * 0.60, 0.0, 3.5, 2.2, t2 * 0.75);
      }
      if (t3 > 0) {
        const bLegBackX = l1 * 0.38;
        drawBulletPuncture(ctx, bLegBackX, 0.0, 1.2, t3);
        drawBloodSoak(ctx, bLegBackX, 0.0, 4.2, 2.8, t3 * 0.8);
      }
    }
  }

  ctx.restore();

  // ŁYDKA, BOJÓWKI I NAKOLANNIK TAKTYCZNY
  ctx.save();
  ctx.translate(ik.kneeX, ik.kneeY);
  ctx.rotate(shinAng);

  const calfBulge = (isSculpted ? 5.2 : 4.5) * muscle;
  const achillesHalfW = 2.5 * muscle;
  const pantsShinGrad = ctx.createLinearGradient(0, -4.8 * muscle, 0, 4.4 * muscle);
  const shinCol = isFrontLeg ? (v.legShinFront || '#3f3f46') : (v.legShinBack || '#27272a');
  pantsShinGrad.addColorStop(0.0, shinCol);
  pantsShinGrad.addColorStop(0.5, isFrontLeg ? (v.shortsColor1 || '#334155') : '#1e293b');
  pantsShinGrad.addColorStop(1.0, '#18181b');

  // Cholewa buta wojskowego (wchodząca pod zbluzowaną nogawkę)
  const collarGrad = ctx.createLinearGradient(0, -3.2, 0, 3.2);
  collarGrad.addColorStop(0.0, '#27272a');
  collarGrad.addColorStop(0.5, '#18181b');
  collarGrad.addColorStop(1.0, '#09090b');
  ctx.fillStyle = collarGrad;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(l2 - 6.2, -2.7, 6.2, 5.4, 1.0);
  else ctx.rect(l2 - 6.2, -2.7, 6.2, 5.4);
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // Nogawka na łydce z realistycznym zbluzowaniem (marszczeniem materiału) nad cholewką buta
  const blouseEnd = l2 - 4.2;
  ctx.beginPath();
  ctx.moveTo(1.5, -calfBulge * 0.72);
  ctx.bezierCurveTo(
    l2 * 0.30, -3.4 * muscle,
    l2 * 0.62, -3.6 * muscle,
    blouseEnd - 1.6, -achillesHalfW * 1.42
  );
  ctx.quadraticCurveTo(blouseEnd + 0.6, -achillesHalfW * 1.15, blouseEnd, -achillesHalfW * 0.85);
  ctx.quadraticCurveTo(blouseEnd + 0.8, 0, blouseEnd, achillesHalfW * 0.92);
  ctx.quadraticCurveTo(blouseEnd + 0.5, achillesHalfW * 1.38, blouseEnd - 2.2, achillesHalfW * 1.45);
  ctx.bezierCurveTo(
    l2 * 0.58, calfBulge * 0.98,
    l2 * 0.28, calfBulge * 1.05,
    1.5, calfBulge * 0.65
  );
  ctx.closePath();
  ctx.fillStyle = pantsShinGrad;
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Zagięcia i fałdy materiału na łydce oraz w miejscu zbluzowania nad butem
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.34)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(3.8, calfBulge * 0.55);
  ctx.quadraticCurveTo(l2 * 0.26, calfBulge * 0.15, l2 * 0.34, -1.2);
  ctx.moveTo(blouseEnd - 3.6, -achillesHalfW * 0.95);
  ctx.quadraticCurveTo(blouseEnd - 1.4, 0.2, blouseEnd - 3.0, achillesHalfW * 1.10);
  ctx.moveTo(blouseEnd - 1.8, -achillesHalfW * 0.85);
  ctx.quadraticCurveTo(blouseEnd - 0.3, 0.0, blouseEnd - 1.4, achillesHalfW * 0.95);
  ctx.stroke();

  if (isFrontLeg) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(l2 * 0.22, -2.2 * muscle);
    ctx.quadraticCurveTo(l2 * 0.52, -2.5 * muscle, blouseEnd - 2.2, -achillesHalfW * 0.95);
    ctx.stroke();
  }

  // NAKOLANNIK TAKTYCZNY (Hard-Shell Combat Knee Pad)
  const padR = 3.6 * (isSculpted ? muscle * 0.95 : muscle);
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.moveTo(-0.8, -padR * 1.10);
  ctx.quadraticCurveTo(1.1, -padR * 0.95, 2.8, -padR * 1.10);
  ctx.lineTo(2.8, padR * 1.10);
  ctx.quadraticCurveTo(1.1, padR * 0.95, -0.8, padR * 1.10);
  ctx.closePath();
  ctx.fill();

  const padGrad = ctx.createLinearGradient(-1.0, -padR, 3.5, padR);
  padGrad.addColorStop(0.0, '#3f3f46');
  padGrad.addColorStop(0.5, '#27272a');
  padGrad.addColorStop(1.0, '#18181b');
  ctx.fillStyle = padGrad;
  ctx.strokeStyle = '#52525b';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.ellipse(1.5, 0, padR * 0.85, padR * 1.15, 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#a1a1aa';
  ctx.beginPath();
  ctx.arc(1.5, -padR * 0.65, 0.6, 0, Math.PI * 2);
  ctx.arc(1.5, padR * 0.65, 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Rany na łydce, uszkodzenia nakolannika i krew na cholewie buta
  if (legDmgRatio >= 0.15) {
    const t1 = Math.min(1.0, Math.max(0.0, (legDmgRatio - 0.15) / 0.22));
    const t2 = Math.min(1.0, Math.max(0.0, (legDmgRatio - 0.37) / 0.25));
    const t3 = Math.min(1.0, Math.max(0.0, (legDmgRatio - 0.62) / 0.28));

    if (isFrontLeg) {
      if (t1 > 0) {
        drawShrapnelSlash(ctx, 0.5, -padR * 0.5, 2.5, padR * 0.3, 0.65, t1 * 0.8);
      }
      if (t2 > 0) {
        drawShrapnelSlash(ctx, 0.2, -padR * 0.6, 2.8, padR * 0.5, 0.9, t2);
        drawBloodSoak(ctx, 1.5, 0.0, 2.8, 2.4, t2 * 0.75);
        drawShrapnelSlash(ctx, l2 * 0.32, calfBulge * 0.30, l2 * 0.54, calfBulge * 0.50, 0.85, t2);
        drawBloodTrickle(ctx, l2 * 0.40, calfBulge * 0.35, 5.0, l2 * 0.15, 0.8, t2);
      }
      if (t3 > 0) {
        const bShinX = l2 * 0.45;
        drawBulletPuncture(ctx, bShinX, 0.0, 1.2, t3);
        drawBloodSoak(ctx, l2 - 5.0, 0.0, 3.8, 2.6, t3 * 0.85);
        drawBloodTrickle(ctx, bShinX, 1.0, 6.0, l2 * 0.20, 0.95, t3);
        drawBloodSpecks(ctx, [[l2 - 3.0, -1.2, 0.7], [l2 - 2.0, 1.5, 0.65]], t3);
      }
    } else {
      if (t1 > 0) {
        drawShrapnelSlash(ctx, l2 * 0.35, -calfBulge * 0.3, l2 * 0.52, -calfBulge * 0.1, 0.7, t1 * 0.75);
      }
      if (t2 > 0) {
        drawShrapnelSlash(ctx, 0.5, -padR * 0.4, 2.5, padR * 0.2, 0.8, t2 * 0.8);
        drawBloodSoak(ctx, 1.5, 0.0, 2.2, 1.8, t2 * 0.7);
        drawBloodTrickle(ctx, l2 * 0.45, -calfBulge * 0.2, 4.5, l2 * 0.15, 0.75, t2);
      }
      if (t3 > 0) {
        const bShinBackX = l2 * 0.50;
        drawBulletPuncture(ctx, bShinBackX, 0.0, 1.15, t3);
        drawBloodSoak(ctx, bShinBackX, 0.0, 3.4, 2.2, t3 * 0.8);
      }
    }
  }

  ctx.restore();

  // WOJSKOWY BUT TAKTYCZNY (MILITARY COMBAT BOOT – bez kolorowych pasków)
  const shinDx = (ik.footX - ik.kneeX) * facing;
  const shinDy = ik.footY - ik.kneeY;
  const localShinAng = Math.atan2(shinDy, shinDx);

  const isSpecialKick = playerRef && (playerRef.kickState === 'SWING' || playerRef.isCharging || playerRef.kickMode === 'BACKFLIP');

  let targetEffAnkle = ankleRot;
  let targetFlex = 0;

  if (playerRef && playerRef.isDead) {
    targetEffAnkle = ankleRot;
    targetFlex = 0;
  } else if (playerRef && playerRef.isProne) {
    targetEffAnkle = ankleRot;
    const ankleMag = Math.abs(ankleRot);
    targetFlex = Math.max(0.45, Math.min(0.95, (ankleMag - 0.85) * 1.35));
  } else if (isSpecialKick && Math.abs(ankleRot) > 1.1) {
    targetEffAnkle = ankleRot;
    targetFlex = 0;
  } else {
    const shinPerp = localShinAng - Math.PI / 2;
    const heelToBall = shinPerp + (ankleRot * facing * 0.28);
    targetEffAnkle = heelToBall * facing;

    if (heelToBall > 0.02) {
      const t = Math.min(1.0, (heelToBall - 0.02) / 0.85);
      targetFlex = (0.5 - 0.5 * Math.cos(t * Math.PI)) * 1.25;
    }
  }

  const pose = playerRef ? playerRef.pose : {};
  const flexProp = isFrontLeg ? 'flexFront' : 'flexBack';
  const effProp = isFrontLeg ? 'effAnkleFront' : 'effAnkleBack';

  if (pose[flexProp] === undefined) pose[flexProp] = targetFlex;
  if (pose[effProp] === undefined) pose[effProp] = targetEffAnkle;

  let flexSmooth = 0.24;
  let ankleSmooth = 0.28;
  if (playerRef && playerRef.isDead) {
    flexSmooth = 0.85;
    ankleSmooth = 0.85;
  } else if (isSpecialKick || (playerRef && playerRef.kickMode === 'BACKFLIP')) {
    flexSmooth = 0.45;
    ankleSmooth = 0.55;
  }

  pose[flexProp] += (targetFlex - pose[flexProp]) * flexSmooth;
  pose[effProp] = lerpAngle(pose[effProp], targetEffAnkle, ankleSmooth);

  const effAnkle = pose[effProp];
  const flexAngle = Math.max(0, pose[flexProp]);

  ctx.save();
  ctx.translate(ik.footX, ik.footY);
  ctx.rotate(effAnkle);
  ctx.scale(facing, 1);

  const bootLen = 10.6 * (isSculpted ? muscle * 0.95 : muscle);
  const bCol = colorBoot || v.bootColor || '#18181b';
  const bootGrad = ctx.createLinearGradient(-4.5, -4.2, bootLen, 3.4);
  if (isFrontLeg) {
    bootGrad.addColorStop(0.0, '#27272a');
    bootGrad.addColorStop(0.45, bCol);
    bootGrad.addColorStop(1.0, '#09090b');
  } else {
    bootGrad.addColorStop(0.0, '#18181b');
    bootGrad.addColorStop(1.0, '#09090b');
  }

  // 1. Główna bryła wojskowego buta desantowego (wysoka cholewka + wyprofilowane śródstopie + zaokrąglony militarny nosek)
  ctx.beginPath();
  // Tylna krawędź cholewki i usztywniona pięta
  ctx.moveTo(-3.6, -3.8);
  ctx.quadraticCurveTo(-4.4, -1.0, -4.4, 2.5);
  // Spód pod podeszwę
  ctx.lineTo(bootLen - 0.6, 2.5);
  // Zaokrąglony, wysoki wojskowy nosek (Toe Box)
  ctx.quadraticCurveTo(bootLen + 1.2, 2.2, bootLen + 0.8, 0.3);
  ctx.quadraticCurveTo(bootLen + 0.2, -1.3, bootLen - 2.6, -1.5);
  // Podbicie i język ze sznurowaniem w górę do cholewki
  ctx.quadraticCurveTo(3.4, -1.8, 2.2, -3.8);
  ctx.lineTo(-3.6, -3.8);
  ctx.closePath();
  ctx.fillStyle = bootGrad;
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // 2. Wzmocniona łata pięty (Heel Counter) i przeszycie noska (Toe Cap Seam)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  // Szew pięty
  ctx.moveTo(-4.2, 0.2);
  ctx.quadraticCurveTo(-1.5, 0.4, -1.0, 2.4);
  // Szew noska
  ctx.moveTo(bootLen - 3.0, -1.4);
  ctx.quadraticCurveTo(bootLen - 2.2, 0.5, bootLen - 2.6, 2.4);
  ctx.stroke();

  // 3. Wojskowe sznurowanie na przodzie cholewki i podbiciu (ciemne przelotki bez kolorowych pasków)
  if (isFrontLeg) {
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(1.2, -3.0); ctx.lineTo(2.4, -2.8);
    ctx.moveTo(1.8, -2.0); ctx.lineTo(3.0, -1.8);
    ctx.moveTo(2.6, -1.1); ctx.lineTo(3.8, -0.9);
    ctx.stroke();

    // Subtelny połysk na czubku skórzanego noska
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(bootLen - 2.0, -0.8);
    ctx.quadraticCurveTo(bootLen + 0.1, -0.4, bootLen + 0.2, 0.8);
    ctx.stroke();
  }

  // 4. Gruba, czarna ząbkowana podeszwa taktyczna (Vibram Combat Sole)
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.moveTo(-4.5, 2.3);
  ctx.lineTo(bootLen + 0.8, 2.3);
  ctx.lineTo(bootLen + 0.5, 4.2);
  // Wcięcie obcasa (tactical heel arch)
  ctx.lineTo(2.2, 4.2);
  ctx.lineTo(1.8, 3.6);
  ctx.lineTo(-0.4, 3.6);
  ctx.lineTo(-0.8, 4.3);
  ctx.lineTo(-4.4, 4.3);
  ctx.closePath();
  ctx.fill();

  // Bieżnik podeszwy (protektor)
  ctx.fillStyle = '#000000';
  for (let lx = -4.0; lx <= -1.4; lx += 1.3) {
    ctx.fillRect(lx, 4.0, 0.9, 0.8);
  }
  for (let lx = 2.6; lx <= bootLen - 0.8; lx += 1.6) {
    ctx.fillRect(lx, 3.9, 1.0, 0.8);
  }

  ctx.restore();
  ctx.restore();

  return ik;
}

export function drawFrontLegOnly(ctx, GROUND_Y, p) {
  if (!p || p.dismembered?.legFront) return;

  const hipX = (p.x + p.w / 2) + p.lastHipShiftX;
  const hipY = p.y + p.h - 40 + (p.pelvisY !== undefined ? p.pelvisY : -11.8);

  const v = { ...DEFAULT_VISUALS, ...(p.currentClass?.visuals || {}) };

  renderIKLeg(
    ctx,
    hipX + (2 * p.facing),
    hipY,
    p.lastFootFrontX,
    p.lastFootFrontY,
    p.thighLen,
    p.shinLen,
    p.lastFootFrontAnkle,
    p.facing,
    v.jerseyStripe,
    v.jerseyStripe,
    v.bootColor,
    true,
    v,
    p
  );
}

export function getJetpackNozzlePos(p) {
  const hipX = p.x + p.w / 2;
  const hipY = p.y + p.h - 40 + (p.pelvisY || 0);
  const facingDir = (p.facing === 'left' || p.facing === -1) ? -1 : 1;
  const tilt = (p.pose && p.pose.torsoTilt !== undefined) 
    ? p.pose.torsoTilt 
    : (p.torsoTilt || 0);

  // Wektor dyszy w lokalnym układzie tułowia (na plecach postaci, u wylotu dyszy):
  const localX = -facingDir * 7.5;
  const localY = 2.5;

  const cosA = Math.cos(tilt);
  const sinA = Math.sin(tilt);

  return {
    x: hipX + (localX * cosA - localY * sinA),
    y: hipY + (localX * sinA + localY * cosA),
    angle: tilt + Math.PI / 2
  };
}

export function drawJetpack(ctx, p, facingDir, isLookingAway, absCos, absSin, waistHalfW, shoulderHalfW) {
  const isFiring = !!p.isJetpacking;
  const isHost = (p.team === 'CYAN' || (!p.team && (p.isLocal !== false)));
  const themeColor = isHost ? '#00e5ff' : '#f97316';
  const glowColor = isHost ? '#38bdf8' : '#fb923c';

  const maxJet = p.jetMax || 100;
  const curJet = Math.max(0, p.jetFuel ?? 0);
  const jetRatio = Math.max(0, Math.min(1, curJet / maxJet));

  // Segmentowy wskaźnik paliwa (4 segmenty LED w stylu retro / sci-fi)
  const isLowFuel = curJet > 0 && jetRatio < 0.20;
  const timeNow = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const blinkLow = !isLowFuel || (Math.floor(timeNow / 150) % 2 === 0);

  const getSegmentColor = (idx) => {
    if (idx === 0) return isLowFuel ? '#ef4444' : (jetRatio < 0.35 ? '#f59e0b' : themeColor);
    if (idx === 1) return (jetRatio < 0.50 ? '#f59e0b' : themeColor);
    return themeColor;
  };

  const isSegmentLit = (idx) => {
    if (idx === 0) return curJet > 0.01 && blinkLow;
    if (idx === 1) return jetRatio >= 0.25;
    if (idx === 2) return jetRatio >= 0.50;
    if (idx === 3) return jetRatio >= 0.75;
    return false;
  };

  ctx.save();

  if (isLookingAway) {
    // Widok z tyłu (obie dysze i korpus plecaka widoczny centralnie na plecach)
    const packW = 14;
    const packH = 20;
    const packX = -packW / 2;
    const packY = -22;

    // Główna metalowa płyta nośna
    const plateGrad = ctx.createLinearGradient(packX, 0, packX + packW, 0);
    plateGrad.addColorStop(0.0, '#1e293b');
    plateGrad.addColorStop(0.5, '#334155');
    plateGrad.addColorStop(1.0, '#1e293b');
    ctx.fillStyle = plateGrad;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(packX, packY, packW, packH, 3);
    else ctx.rect(packX, packY, packW, packH);
    ctx.fill();
    ctx.stroke();

    // Dwa zbiorniki paliwa (lewy i prawy cylinder)
    const tankW = 5.2;
    const tankH = 18;
    for (const tx of [-5.5, 0.3]) {
      const tankGrad = ctx.createLinearGradient(tx, 0, tx + tankW, 0);
      tankGrad.addColorStop(0.0, '#0f172a');
      tankGrad.addColorStop(0.4, '#475569');
      tankGrad.addColorStop(0.8, '#64748b');
      tankGrad.addColorStop(1.0, '#1e293b');
      ctx.fillStyle = tankGrad;
      ctx.fillRect(tx, packY + 1, tankW, tankH);
      ctx.strokeRect(tx, packY + 1, tankW, tankH);

      // Górny zawór zbiornika
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(tx + 1, packY - 1.5, tankW - 2, 2.5);

      // Dolna dysza wylotowa (nozzle)
      const nzX = tx + 0.4;
      const nzY = packY + tankH;
      const nzW = tankW - 0.8;
      const nzH = 4.5;

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(nzX + 0.6, nzY);
      ctx.lineTo(nzX + nzW - 0.6, nzY);
      ctx.lineTo(nzX + nzW + 0.8, nzY + nzH);
      ctx.lineTo(nzX - 0.8, nzY + nzH);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Płonące wnętrze dyszy, gdy jetpack jest aktywny
      if (isFiring) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8;
        ctx.fillRect(nzX, nzY + nzH - 1.5, nzW, 2.0);
        ctx.shadowBlur = 0;
      }
    }

    // WSKAŹNIK STANU PALIWA: 4 SEGMENTY LED W CENTRALNEJ KIESZENI
    const panelW = 4.0;
    const panelH = 14.5;
    const panelX = -panelW / 2;
    const panelY = packY + 2.8;

    // Gniazdo montażowe (ramka)
    ctx.fillStyle = '#050811';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.6;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // 4 segmenty LED (indeksy 0..3 od dołu do góry)
    const segW = 2.8;
    const segH = 2.2;
    const segX = -segW / 2;
    const segOffsets = [10.5, 7.5, 4.5, 1.5]; // Y offset od panelY

    for (let i = 0; i < 4; i++) {
      const sY = panelY + segOffsets[i];
      const lit = isSegmentLit(i);

      if (lit) {
        const segCol = getSegmentColor(i);
        ctx.fillStyle = segCol;
        ctx.shadowColor = (isLowFuel && i === 0) ? '#ef4444' : glowColor;
        ctx.shadowBlur = isFiring ? 12 : 6;
        ctx.fillRect(segX, sY, segW, segH);

        // Wyraźny jasny rdzeń wyładowania
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(segX + 0.5, sY + 0.5, segW - 1.0, segH - 1.0);
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(segX, sY, segW, segH);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 0.4;
        ctx.strokeRect(segX, sY, segW, segH);
      }
    }
    ctx.shadowBlur = 0;

  } else {
    // Widok z boku / profilu (plecak przylegający do pleców)
    // Plecy są po przeciwnej stronie niż zwrot postaci: -facingDir
    const backSign = -facingDir;
    const packW = 7.5;
    const packH = 20;
    const packTopY = -22;
    const packBottomY = packTopY + packH;
    const anchorX = backSign * (waistHalfW * 0.85);
    const outerX = anchorX + backSign * packW;
    const leftX = Math.min(anchorX, outerX);
    const rightX = Math.max(anchorX, outerX);

    // 1. Paski montażowe / uprząż taktyczna (harness straps) wokół klatki i ramion
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(anchorX, packTopY + 2);
    ctx.lineTo(facingDir * (shoulderHalfW * 0.4), packTopY + 3);
    ctx.moveTo(anchorX, 0);
    ctx.lineTo(facingDir * (waistHalfW * 0.3), 1);
    ctx.stroke();

    // 2. Główny korpus zbiornika jetpacka (tytanowy cylinder w profilu)
    const tankGrad = ctx.createLinearGradient(leftX, 0, rightX, 0);
    if (facingDir > 0) {
      tankGrad.addColorStop(0.0, '#0f172a');
      tankGrad.addColorStop(0.35, '#334155');
      tankGrad.addColorStop(0.70, '#475569');
      tankGrad.addColorStop(1.0, '#1e293b');
    } else {
      tankGrad.addColorStop(0.0, '#1e293b');
      tankGrad.addColorStop(0.30, '#475569');
      tankGrad.addColorStop(0.65, '#334155');
      tankGrad.addColorStop(1.0, '#0f172a');
    }

    ctx.fillStyle = tankGrad;
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(leftX, packTopY, packW, packH, [3, 3, 2, 2]);
    } else {
      ctx.rect(leftX, packTopY, packW, packH);
    }
    ctx.fill();
    ctx.stroke();

    // Górny zawór ciśnieniowy / wzmocniona kopuła
    ctx.fillStyle = '#64748b';
    ctx.fillRect(leftX + 1.2, packTopY - 2.0, packW - 2.4, 2.5);
    ctx.strokeRect(leftX + 1.2, packTopY - 2.0, packW - 2.4, 2.5);

    // Metalowe opaski stabilizujące (ribs)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(leftX, packTopY + 6, packW, 1.8);
    ctx.fillRect(leftX, packTopY + 13, packW, 1.8);

    // WSKAŹNIK STANU PALIWA: 4 SEGMENTY LED W PROFILU PLECAKA
    const panelW = 3.0;
    const panelH = 14.5;
    const panelX = (facingDir > 0 ? leftX + 0.6 : rightX - panelW - 0.6);
    const panelY = packTopY + 2.8;

    // Gniazdo montażowe (ramka)
    ctx.fillStyle = '#050811';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.6;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // 4 segmenty LED (indeksy 0..3 od dołu do góry)
    const segW = 2.0;
    const segH = 2.2;
    const segX = panelX + (panelW - segW) / 2;
    const segOffsets = [10.5, 7.5, 4.5, 1.5]; // Y offset od panelY

    for (let i = 0; i < 4; i++) {
      const sY = panelY + segOffsets[i];
      const lit = isSegmentLit(i);

      if (lit) {
        const segCol = getSegmentColor(i);
        ctx.fillStyle = segCol;
        ctx.shadowColor = (isLowFuel && i === 0) ? '#ef4444' : glowColor;
        ctx.shadowBlur = isFiring ? 12 : 6;
        ctx.fillRect(segX, sY, segW, segH);

        // Wyraźny jasny rdzeń wyładowania
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(segX + 0.4, sY + 0.4, segW - 0.8, segH - 0.8);
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(segX, sY, segW, segH);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 0.4;
        ctx.strokeRect(segX, sY, segW, segH);
      }
    }
    ctx.shadowBlur = 0;

    // 3. Stożkowa dysza wylotowa (nozzle) u dołu plecaka
    const nzCenterX = (leftX + rightX) / 2;
    const nzTopY = packBottomY;
    const nzH = 4.5;
    const throatW = 4.2;
    const mouthW = 6.4;

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(nzCenterX - throatW / 2, nzTopY);
    ctx.lineTo(nzCenterX + throatW / 2, nzTopY);
    ctx.lineTo(nzCenterX + mouthW / 2, nzTopY + nzH);
    ctx.lineTo(nzCenterX - mouthW / 2, nzTopY + nzH);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // Metalowa kryza / pierścień żaroodporny u wylotu dyszy
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(nzCenterX - mouthW / 2, nzTopY + nzH);
    ctx.lineTo(nzCenterX + mouthW / 2, nzTopY + nzH);
    ctx.stroke();

    // Efekt aktywnego płomienia wewnątrz dyszy podczas lotu
    if (isFiring) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(nzCenterX, nzTopY + nzH, mouthW * 0.42, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mały język ognia u samego wylotu dyszy
      const flameGrad = ctx.createLinearGradient(0, nzTopY + nzH, 0, nzTopY + nzH + 8);
      flameGrad.addColorStop(0.0, '#ffffff');
      flameGrad.addColorStop(0.4, themeColor);
      flameGrad.addColorStop(1.0, 'rgba(0, 229, 255, 0)');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(nzCenterX - mouthW * 0.35, nzTopY + nzH);
      ctx.lineTo(nzCenterX, nzTopY + nzH + (6.0 + Math.random() * 4.0));
      ctx.lineTo(nzCenterX + mouthW * 0.35, nzTopY + nzH);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  ctx.restore();
}

export function drawPlayer(ctx, GROUND_Y, p) {
  if (p.isDead && p.acidDeath && p.acidDeath.dissolved) {
    ctx.save();
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4ade80';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    const secLeft = Math.max(1, Math.ceil(p.respawnTimer / 60));
    ctx.fillText(`☠️ ROZPUSZCZONO // RESPAWN ZA ${secLeft}s`, p.x + p.w / 2, (p.acidDeath.hazardY || (p.y + (p.h || 70))) - 24);
    ctx.restore();
    return;
  }

  if (p.isDead && p.isGibbed) {
    ctx.save();
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText(`💀 RESPAWN ZA ${Math.ceil(p.respawnTimer / 60)}s`, p.x + p.w / 2, p.y - 14);
    ctx.restore();
    return;
  }

  ctx.save();

  // Animacja rozpuszczania w kwasie (Arena 2): ultra-lekki render bez filtrów CSS (Stałe 60 FPS)
  const isDissolving = !!(p.acidDeath && p.acidDeath.active);
  const maxDuration = (p.acidDeath && (p.acidDeath.maxDuration || p.acidDeath.duration)) || 1.2;
  const dissolveProgress = isDissolving ? Math.min(1.0, Math.max(0, (p.acidDeath.timer || 0) / maxDuration)) : 0;
  if (isDissolving && dissolveProgress >= 1.0) {
    ctx.restore();
    return;
  }

  if (isDissolving) {
    const anchorY = p.acidDeath.hazardY || (p.y + (p.h || 70));
    const anchorX = p.x + (p.w || 24) / 2;

    // 1. Płynne topnienie i zapadanie się sylwetki w dół
    ctx.translate(anchorX, anchorY);
    ctx.scale(1 - dissolveProgress * 0.25, Math.max(0.05, 1 - dissolveProgress));
    ctx.translate(-anchorX, -anchorY);

    // 2. Płynne zanikanie (zwykła przezroczystość nie obciąża karty ani CPU)
    ctx.globalAlpha = Math.max(0, 1 - dissolveProgress);
  }

  const isLocalOrCreator = !!(p._isCreatorPreview || (typeof window !== 'undefined' && p === window.player));
  const v = {
    ...DEFAULT_VISUALS,
    ...(p.currentClass?.visuals || {}),
    ...(isLocalOrCreator ? localPlayerCustomVisuals : {}),
    ...(p.customVisuals || {})
  };
  v.heldGrenade = !!(p.throwAnim && p.throwAnim.active && !p.throwAnim.spawned);
  const muscle = v.muscleMult || 1.0;
  const isSculpted = !!v.sculptedMuscles;

  const centerX = p.x + p.w / 2;
  const isGrounded = (p.onGround !== undefined)
    ? (p.onGround && !p.isJumping)
    : (!p.isJumping && (p.y >= (GROUND_Y - p.h - 2) || (p.currentGroundY !== undefined && Math.abs(p.y + p.h - p.currentGroundY) < 4)));
  const standingY = (isGrounded && p.currentGroundY !== undefined && p.currentGroundY >= p.y + p.h - 6)
    ? p.currentGroundY
    : (p.y + p.h);
  const floorY = standingY;
  const plantFloorY = floorY - 3.5;
  let hipX = centerX;
  let hipY = p.y + p.h - 40 + (p.pelvisY !== undefined ? p.pelvisY : -11.8);
  if (p.isProne) {
    hipY = plantFloorY - 2.5; // Tors i miednica przylegają równolegle do podłoża (y = floorY - 6 px)
  } else if (p.staggerTimer > 0) {
    // 2. Po zetknięciu z gruntem obniż punkt bioder bezpośrednio do poziomu podłoża:
    // hipY = floorY - 6 (zamiast normalnej wysokości stojącej ~p.y - 28 px)
    const isStaggerLanded = (p.staggerLanded || p.onGround);
    if (isStaggerLanded) {
      hipY = floorY - 6;
    } else {
      hipY = p.y + 10;
    }
  }
  const speed = Math.abs(p.vx);

  const yaw = p.yaw || 0;
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);

  const currentFacingDir = cosYaw >= 0 ? 1 : -1;
  const isRightLimbForeground = cosYaw >= 0;
  const isLookingAway = sinYaw < -0.45;
  const isNearProfile = Math.abs(cosYaw) >= 0.28;

  let rawFootBackTargetX, rawFootBackTargetY, rawFootBackAnkle;
  let rawFootFrontTargetX, rawFootFrontTargetY, rawFootFrontAnkle;
  let rawFrontSwing = 0.05, rawFrontElbow = 0.32;
  let rawBackSwing = -0.03, rawBackElbow = 0.26;

  const isVisualCharging = (p.isCharging && speed < 0.8);

  const isGroundKicking = !p.isIntro && !p.isSliding && !p.isJumping &&
    p.kickMode === 'GROUND' &&
    (isVisualCharging || p.kickState === 'SWING' || p.kickState === 'RECOVER');

  if (p.isDead) {
    const ragPose = getRagdollRenderPose(p, standingY);
    hipX = ragPose.hipX;
    hipY = ragPose.hipY;
    p.torsoTilt = ragPose.torsoTilt;
    p.headPitch = ragPose.headPitch;

    rawFootFrontTargetX = ragPose.footFrontX;
    rawFootFrontTargetY = ragPose.footFrontY;
    rawFootFrontAnkle = ragPose.footFrontAnkle;

    rawFootBackTargetX = ragPose.footBackX;
    rawFootBackTargetY = ragPose.footBackY;
    rawFootBackAnkle = ragPose.footBackAnkle;

    rawFrontSwing = ragPose.armFrontSwing;
    rawFrontElbow = ragPose.armFrontElbow;
    rawBackSwing = ragPose.armBackSwing;
    rawBackElbow = ragPose.armBackElbow;
  } else if (p.isIntro) {
    const choreo = getFreestyleChoreography(p.juggleTimer, hipX, hipY, floorY, p.facing, 8);
    hipX += choreo.hipShiftX;
    rawFootFrontTargetX = choreo.footFrontX;
    rawFootFrontTargetY = choreo.footFrontY;
    rawFootFrontAnkle = choreo.footFrontAnkle;
    rawFootBackTargetX = choreo.footBackX;
    rawFootBackTargetY = choreo.footBackY;
    rawFootBackAnkle = choreo.footBackAnkle;

    const armWave = Math.sin((p.juggleTimer / 22) * Math.PI);
    rawFrontSwing = 0.16 + armWave * 0.08;
    rawFrontElbow = 0.85;
    rawBackSwing = -0.14 - armWave * 0.08;
    rawBackElbow = 0.80;

    p.lastHipShiftX = choreo.hipShiftX;
    p.lastFootFrontX = rawFootFrontTargetX;
    p.lastFootFrontY = rawFootFrontTargetY;
    p.lastFootFrontAnkle = rawFootFrontAnkle;
  } else if (p.staggerTimer > 0) {
    // Sylwetka leży płasko na plecach (efekt ścięcia z nóg i lądowania na łopatkach):
    // Kończyny dolne: nogi ułożone luźno na podłożu, lekko ugięte w kolanach, spoczywające płasko na ziemi
    rawFootFrontTargetX = hipX + (28 * p.facing);
    rawFootFrontTargetY = floorY - 2;
    rawFootFrontAnkle = 0.10 * p.facing;

    rawFootBackTargetX = hipX + (22 * p.facing);
    rawFootBackTargetY = floorY - 3;
    rawFootBackAnkle = 0.20 * p.facing;

    // Ramiona postaci: odepnij IK rąk od chwytu bojowego – ręce spoczywają bezwładnie wzdłuż tułowia lub jedna spoczywa luźno na broni:
    rawFrontSwing = -1.25;
    rawFrontElbow = 0.85;
    rawBackSwing = -1.50;
    rawBackElbow = 0.20;
  } else if (p.kickMode === 'BACKFLIP') {
    const flip = getBackflipTargets(p.bicycleTimer, p.bicycleDuration, hipX, hipY, p.facing);
    rawFootFrontTargetX = flip.kicking.x;
    rawFootFrontTargetY = flip.kicking.y;
    rawFootFrontAnkle = flip.kicking.ankle;

    rawFootBackTargetX = flip.guide.x;
    rawFootBackTargetY = flip.guide.y;
    rawFootBackAnkle = flip.guide.ankle;

    const uFlip = p.bicycleTimer / p.bicycleDuration;
    if (uFlip < 0.28) {
      rawFrontSwing = 0.90; rawFrontElbow = 0.50;
      rawBackSwing = 0.90; rawBackElbow = 0.50;
    } else if (uFlip < 0.68) {
      rawFrontSwing = -0.30; rawFrontElbow = 1.25;
      rawBackSwing = -0.30; rawBackElbow = 1.25;
    } else {
      rawFrontSwing = 0.40; rawFrontElbow = 0.65;
      rawBackSwing = -0.40; rawBackElbow = 0.65;
    }
  } else if (p.kickMode === 'BACKFLIP_LAND') {
    rawFootFrontTargetX = hipX + (6 * p.facing);
    rawFootFrontTargetY = plantFloorY;
    rawFootFrontAnkle = 0.10 * p.facing;

    rawFootBackTargetX = hipX - (6 * p.facing);
    rawFootBackTargetY = plantFloorY;
    rawFootBackAnkle = -0.10 * p.facing;

    rawFrontSwing = 0.35;
    rawFrontElbow = 0.85;
    rawBackSwing = -0.35;
    rawBackElbow = 0.85;
  } else if (p.kickMode === 'SCISSOR' && p.kickState === 'SWING') {
    const targets = getScissorLegTargets(p.scissorTimer, p.scissorDuration, hipX, hipY, p.facing, p.kickPower);
    rawFootFrontTargetX = targets.front.x;
    rawFootFrontTargetY = targets.front.y;
    rawFootFrontAnkle = targets.front.ankle;

    rawFootBackTargetX = targets.back.x;
    rawFootBackTargetY = targets.back.y;
    rawFootBackAnkle = targets.back.ankle;

    rawFrontSwing = -0.35;
    rawFrontElbow = 0.85;
    rawBackSwing = 0.45;
    rawBackElbow = 0.75;
  } else if (p.kickMode === 'SPARTAN') {
    const targets = getSpartanKickTargets(p.spartanTimer || 0, p.spartanDuration || 22, hipX, hipY, p.facing, plantFloorY);
    const isFrontKicking = (p.kickLeg === 'front');

    if (isFrontKicking) {
      rawFootFrontTargetX = targets.kicking.x;
      rawFootFrontTargetY = targets.kicking.y;
      rawFootFrontAnkle = targets.kicking.ankle;

      rawFootBackTargetX = targets.support.x;
      rawFootBackTargetY = targets.support.y;
      rawFootBackAnkle = targets.support.ankle;
    } else {
      rawFootBackTargetX = targets.kicking.x;
      rawFootBackTargetY = targets.kicking.y;
      rawFootBackAnkle = targets.kicking.ankle;

      rawFootFrontTargetX = targets.support.x;
      rawFootFrontTargetY = targets.support.y;
      rawFootFrontAnkle = targets.support.ankle;
    }

    const t = p.spartanTimer || 0;
    if (t <= 4) {
      rawFrontSwing = -0.35;
      rawFrontElbow = 1.10;
      rawBackSwing = 0.40;
      rawBackElbow = 0.80;
    } else if (t <= 15) {
      rawFrontSwing = -0.75;
      rawFrontElbow = 0.50;
      rawBackSwing = -0.80;
      rawBackElbow = 0.60;
    } else {
      const w = Math.min(1.0, (t - 15) / 7);
      rawFrontSwing = lerp(-0.75, 0.0, w);
      rawFrontElbow = lerp(0.50, 0.35, w);
      rawBackSwing = lerp(-0.80, 0.0, w);
      rawBackElbow = lerp(0.60, 0.30, w);
    }
  } else if (p.isProne) {
    const isCrawling = speed > 0.08;
    const crawlP = p.crawlPhase || 0;
    const proneTargets = getProneIKTargets(crawlP, isCrawling, hipX, plantFloorY, p.facing);

    rawFootFrontTargetX = proneTargets.front.x;
    rawFootFrontTargetY = proneTargets.front.y;
    rawFootFrontAnkle = proneTargets.front.ankle;

    rawFootBackTargetX = proneTargets.back.x;
    rawFootBackTargetY = proneTargets.back.y;
    rawFootBackAnkle = proneTargets.back.ankle;

    rawFrontSwing = proneTargets.frontArm.swing;
    rawFrontElbow = proneTargets.frontArm.elbow;
    rawBackSwing = proneTargets.backArm.swing;
    rawBackElbow = proneTargets.backArm.elbow;
  } else if (p.isJumpCharging && speed < 0.8) {
    rawFootFrontTargetX = hipX + (4 * p.facing);
    rawFootFrontTargetY = plantFloorY;
    rawFootFrontAnkle = 0.08 * p.facing;

    rawFootBackTargetX = hipX - (4 * p.facing);
    rawFootBackTargetY = plantFloorY;
    rawFootBackAnkle = -0.08 * p.facing;

    rawFrontSwing = -0.55 * p.jumpChargePower;
    rawFrontElbow = 0.85 + 0.35 * p.jumpChargePower;
    rawBackSwing = -0.65 * p.jumpChargePower;
    rawBackElbow = 0.85 + 0.35 * p.jumpChargePower;
  } else if (isGroundKicking) {
    const kickPhase = isVisualCharging ? 'CHARGE' : p.kickState;
    const kickPow = isVisualCharging ? p.chargePower : p.kickPower;
    const kickTraj = getGroundKickTrajectory(kickPhase, p.kickAngle, kickPow, hipX, hipY, floorY, p.facing, speed, p.kickPlantWorldX);

    const isFrontKicking = (p.kickLeg === 'front');

    if (isFrontKicking) {
      rawFootFrontTargetX = kickTraj.kicking.x;
      rawFootFrontTargetY = kickTraj.kicking.y;
      rawFootFrontAnkle = kickTraj.kicking.ankle;

      rawFootBackTargetX = kickTraj.support.x;
      rawFootBackTargetY = kickTraj.support.y;
      rawFootBackAnkle = kickTraj.support.ankle;
    } else {
      rawFootBackTargetX = kickTraj.kicking.x;
      rawFootBackTargetY = kickTraj.kicking.y;
      rawFootBackAnkle = kickTraj.kicking.ankle;

      rawFootFrontTargetX = kickTraj.support.x;
      rawFootFrontTargetY = kickTraj.support.y;
      rawFootFrontAnkle = kickTraj.support.ankle;
    }

    const kickArmSwing = speed > 1.2 ? -0.88 : -0.68;
    const suppArmSwing = speed > 1.2 ? 0.72 : 0.52;
    const kickArmElbow = speed > 1.2 ? 0.75 : 0.60;
    const suppArmElbow = speed > 1.2 ? 1.20 : 0.90;

    if (isFrontKicking) {
      rawFrontSwing = kickArmSwing;
      rawFrontElbow = kickArmElbow;
      rawBackSwing = suppArmSwing;
      rawBackElbow = suppArmElbow;
    } else {
      rawFrontSwing = suppArmSwing;
      rawFrontElbow = suppArmElbow;
      rawBackSwing = kickArmSwing;
      rawBackElbow = kickArmElbow;
    }
  } else if (p.isSliding) {
    const fullLegReach = (p.thighLen + p.shinLen);
    const verticalDrop = Math.max(0, plantFloorY - hipY);
    const straightReachX = Math.sqrt(Math.max(1, fullLegReach * fullLegReach - verticalDrop * verticalDrop));

    rawFootFrontTargetX = hipX + (straightReachX + 6.0) * p.facing;
    rawFootFrontTargetY = plantFloorY;
    rawFootFrontAnkle = 0.08 * p.facing;

    rawFootBackTargetX = hipX - (5.0 * p.facing);
    rawFootBackTargetY = hipY + 13.0;
    rawFootBackAnkle = -0.70 * p.facing;

    rawFrontSwing = 0.85;
    rawFrontElbow = 0.75;
    rawBackSwing = -0.90;
    rawBackElbow = 0.40;
  } else if (p.kickMode === 'SPIN_VOLLEY') {
    const u = p.spinVolleyTimer / p.spinVolleyDuration;
    rawFootFrontTargetX = hipX + Math.cos(u * Math.PI) * 36 * p.facing;
    rawFootFrontTargetY = hipY + 4;
    rawFootFrontAnkle = 0.55 * p.facing;

    rawFootBackTargetX = hipX - (6 * p.facing);
    rawFootBackTargetY = plantFloorY;
    rawFootBackAnkle = 0.05 * p.facing;

    rawFrontSwing = -0.60;
    rawFrontElbow = 0.85;
    rawBackSwing = 0.60;
    rawBackElbow = 0.85;
  } else if (p.isJumping || !isGrounded || Math.abs(p.vy) > 1.2 || p.vy > 100) {
    if (p.jumpTakeoffTimer > 0) {
      // -------------------------------------------------------------------
      // WYBICIE NOGAMI DO WYSKOKU: EKSPLOZYWNE PCHNIĘCIE TŁOKOWE (PISTON TAKEOFF)
      // Miednica i tors wystrzeliwują w górę, a stopy napierają na podłoże
      // z palcami stóp w pełnym wyproście (plantar flexion) aż do zerwania kontaktu.
      // -------------------------------------------------------------------
      const maxLegReach = (p.thighLen || 25) + (p.shinLen || 24) + 7.5; // pełen wyprost z czubkami butów skierowanymi w dół
      const launchFloor = (p.jumpLaunchFloorY !== undefined && p.jumpLaunchFloorY > 0)
        ? (p.jumpLaunchFloorY - 3.5)
        : plantFloorY;
      const contactY = Math.min(launchFloor, hipY + maxLegReach);
      const isExtended = (hipY + maxLegReach) <= launchFloor;
      const isStandstill = (p.jumpLaunchSpeed !== undefined ? p.jumpLaunchSpeed : speed) <= 0.8;

      if (isStandstill) {
        // Symetryczne potężne pchnięcie obunóż:
        // Obie stopy mocno prostują się w dół ku ziemi, stając na czubkach butów
        rawFootFrontTargetX = hipX + (4.0 * p.facing);
        rawFootFrontTargetY = contactY;
        rawFootFrontAnkle = (isExtended ? 0.45 : 0.65) * p.facing;

        rawFootBackTargetX = hipX - (4.0 * p.facing);
        rawFootBackTargetY = contactY;
        rawFootBackAnkle = (isExtended ? 0.40 : 0.60) * p.facing;

        // Wyrzut ramion w górę dla asysty pionowej
        rawFrontSwing = -0.58;
        rawFrontElbow = 0.70;
        rawBackSwing = -0.58;
        rawBackElbow = 0.70;
      } else {
        // Atletyczne wybicie w biegu (Hurdle Drive):
        // Noga zakroczna to tłok wybijający, zapierający się o podłoże z tyłu:
        rawFootBackTargetX = hipX - (16.0 * p.facing);
        rawFootBackTargetY = contactY;
        rawFootBackAnkle = -0.58 * p.facing; // Stopa odpycha się mocno od murawy w tył-dół

        // Noga wykroczna dynamicznie wyrzuca kolano w przód i wysoko w górę:
        const maxTakeoff = p.jumpTakeoffMax || 8;
        const uTakeoff = 1.0 - (p.jumpTakeoffTimer / maxTakeoff);
        const leadProg = Math.sin(uTakeoff * Math.PI * 0.5);

        rawFootFrontTargetX = hipX + (14.0 + leadProg * 8.0) * p.facing;
        rawFootFrontTargetY = hipY + lerp(22.0, 11.0, leadProg);
        rawFootFrontAnkle = 0.38 * p.facing;

        // Dynamiczny kontr-wymach ramion sprintera
        rawFrontSwing = -0.72;
        rawFrontElbow = 0.80;
        rawBackSwing = 0.60;
        rawBackElbow = 0.60;
      }
    } else {
      // Płynne przejście pozycji nóg w locie (wznoszenie / zawis na jetpacku / opadanie)
      // wraz z naturalnym odchyleniem nóg wzdłuż osi pochylenia tułowia w kierunku lotu
      const vyVal = (typeof p.vy === 'number' && p.vy < 90) ? p.vy : 1.0;
      const rawRise = Math.max(0, Math.min(1, (-vyVal + 0.6) / 4.2));
      const riseBlend = p.isJetpacking ? Math.max(0.28, rawRise * 0.85) : rawRise;
      const curTilt = (p.pose && typeof p.pose.torsoTilt === 'number') ? p.pose.torsoTilt : (p.torsoTilt || 0);
      const flightTrailX = -Math.sin(curTilt) * 17.5 - Math.max(-5.5, Math.min(5.5, (p.vx || 0) * 0.55));

      rawFootFrontTargetX = hipX + lerp(3, 10, riseBlend) * p.facing + flightTrailX;
      rawFootFrontTargetY = hipY + lerp(44.5, 26.0, riseBlend);
      rawFootFrontAnkle = lerp(0.15, 0.22, riseBlend) * p.facing + curTilt * 0.35;

      rawFootBackTargetX = hipX + lerp(-3, -7, riseBlend) * p.facing + flightTrailX;
      rawFootBackTargetY = hipY + lerp(45.0, 34.5, riseBlend);
      rawFootBackAnkle = lerp(0.08, -0.12, riseBlend) * p.facing + curTilt * 0.35;

      rawFrontSwing = lerp(-0.15, -0.35, riseBlend);
      rawFrontElbow = lerp(0.45, 0.75, riseBlend);
      rawBackSwing = lerp(0.15, 0.35, riseBlend);
      rawBackElbow = lerp(0.45, 0.65, riseBlend);
    }
  } else if (p.gaitMode === 'CROUCH') {
    const braceW = (p.shootPoseWeight || 0);
    rawFootFrontTargetX = hipX + (lerp(6, 12, braceW) * p.facing);
    rawFootFrontTargetY = plantFloorY - 6.5;
    rawFootFrontAnkle = 0.50 * p.facing;
    rawFootBackTargetX = hipX - (lerp(8, 14, braceW) * p.facing);
    rawFootBackTargetY = plantFloorY - 7.0;
    rawFootBackAnkle = 0.60 * p.facing;

    rawFrontSwing = 0.12;
    rawFrontElbow = 0.55;
    rawBackSwing = -0.12;
    rawBackElbow = 0.55;
  } else if (p.gaitMode === 'IDLE') {
    const braceW = (p.shootPoseWeight || 0);
    const frontOffset = lerp(3, 16, braceW) * p.facing;
    const backOffset = lerp(-3, -15, braceW) * p.facing;

    rawFootFrontTargetX = hipX + frontOffset;
    rawFootFrontTargetY = plantFloorY;
    rawFootFrontAnkle = lerp(0, 0.06, braceW) * p.facing;

    rawFootBackTargetX = hipX + backOffset;
    rawFootBackTargetY = plantFloorY;
    rawFootBackAnkle = lerp(0, -0.14, braceW) * p.facing;

    const breathe = Math.sin(performance.now() * 0.003) * 0.03;
    rawFrontSwing = 0.05 + breathe;
    rawFrontElbow = 0.35;
    rawBackSwing = -0.05 - breathe;
    rawBackElbow = 0.30;

    if (p.kneeJuggleWeight > 0) {
      const kw = p.kneeJuggleWeight;
      const snap = Math.max(0, Math.sin(performance.now() * 0.014)) * 3.5;
      const kneeFootX = hipX + (13 * p.facing);
      const kneeFootY = hipY + 8 - snap;
      const kneeAnkle = 0.35 * p.facing;

      rawFootFrontTargetX = rawFootFrontTargetX * (1 - kw) + kneeFootX * kw;
      rawFootFrontTargetY = rawFootFrontTargetY * (1 - kw) + kneeFootY * kw;
      rawFootFrontAnkle = rawFootFrontAnkle * (1 - kw) + kneeAnkle * kw;

      rawFrontSwing = -0.25;
      rawFrontElbow = 0.75;
      rawBackSwing = 0.25;
      rawBackElbow = 0.75;
    }
  } else {
    const legBackTraj = getBiomechanicFootTrajectory(p.stridePhase + Math.PI, p.gaitMode, speed, p);
    const legFrontTraj = getBiomechanicFootTrajectory(p.stridePhase, p.gaitMode, speed, p);

    rawFootBackTargetX = hipX + (legBackTraj.lx * p.facing);
    rawFootBackTargetY = plantFloorY + legBackTraj.ly;
    rawFootBackAnkle = legBackTraj.ankle * p.facing;

    rawFootFrontTargetX = hipX + (legFrontTraj.lx * p.facing);
    rawFootFrontTargetY = plantFloorY + legFrontTraj.ly;
    rawFootFrontAnkle = legFrontTraj.ankle * p.facing;

    const armPhase = Math.sin(p.stridePhase);

    if (p.gaitMode === 'CROUCH_WALK') {
      rawFrontSwing = -armPhase * 0.28;
      rawBackSwing = armPhase * 0.28;
      rawFrontElbow = 0.85;
      rawBackElbow = 0.85;
    } else if (p.gaitMode === 'WALK') {
      rawFrontSwing = -armPhase * 0.38;
      rawBackSwing = armPhase * 0.38;
      rawFrontElbow = 0.32 + Math.max(0, -armPhase) * 0.16;
      rawBackElbow = 0.32 + Math.max(0, armPhase) * 0.16;
    } else if (p.gaitMode === 'JOG') {
      rawFrontSwing = -armPhase * 0.75;
      rawBackSwing = armPhase * 0.75;
      rawFrontElbow = 1.05 + Math.max(0, -armPhase) * 0.22;
      rawBackElbow = 1.05 + Math.max(0, armPhase) * 0.22;
    } else if (p.gaitMode === 'SPRINT') {
      rawFrontSwing = -armPhase * 1.68 - 0.10;
      rawBackSwing = armPhase * 1.68 - 0.10;
      rawFrontElbow = 1.48 + Math.max(0, -armPhase) * 0.36 + Math.max(0, armPhase) * 0.15;
      rawBackElbow = 1.48 + Math.max(0, armPhase) * 0.36 + Math.max(0, -armPhase) * 0.15;
    }

    if (p.isJumpCharging) {
      rawFrontSwing -= p.jumpChargePower * 0.40;
      rawBackSwing -= p.jumpChargePower * 0.40;
      rawFrontElbow += p.jumpChargePower * 0.25;
      rawBackElbow += p.jumpChargePower * 0.25;
    }

    if (p.kneeJuggleWeight > 0) {
      const kw = p.kneeJuggleWeight;
      const snap = Math.max(0, Math.sin(performance.now() * 0.014)) * 3.5;
      const kneeFootX = hipX + (13 * p.facing);
      const kneeFootY = hipY + 8 - snap;
      const kneeAnkle = 0.35 * p.facing;

      rawFootFrontTargetX = rawFootFrontTargetX * (1 - kw) + kneeFootX * kw;
      rawFootFrontTargetY = rawFootFrontTargetY * (1 - kw) + kneeFootY * kw;
      rawFootFrontAnkle = rawFootFrontAnkle * (1 - kw) + kneeAnkle * kw;

      rawFrontSwing = -0.25;
      rawFrontElbow = 0.75;
      rawBackSwing = 0.25;
      rawBackElbow = 0.75;
    }
  }

  const hWeight = (typeof p.holsterWeight === 'number') ? p.holsterWeight : (p.isHolstered ? 1.0 : 0.0);
  const hasActiveWeapon = p.currentWeapon && hWeight < 0.99 && !p.isDead && !(p.staggerTimer > 0) && !(p.throwAnim && p.throwAnim.active);

  if (hasActiveWeapon) {
    const hold = getWeaponHoldTransform(p);

    const tiltWep = p.pose?.torsoTilt || p.torsoTilt || 0;
    const cosTWep = Math.cos(tiltWep);
    const sinTWep = Math.sin(tiltWep);
    const shTiltWep = p.pose?.shoulderTilt || 0;

    const shOffsetHorizWep = (cosYaw * 1.6) - (sinYaw * 4.6);
    const lyRightWep = -24.0 - (shTiltWep * 7.5 * cosYaw);
    const lyLeftWep = -24.0 + (shTiltWep * 7.5 * cosYaw);

    const shRightX = hipX + (shOffsetHorizWep * cosTWep - lyRightWep * sinTWep);
    const shRightY = hipY + (shOffsetHorizWep * sinTWep + lyRightWep * cosTWep);

    // W chwycie oburęcznym broni lewy bark wspierający obraca się ku łożu (Tactical Lead Shoulder)
    const tacticalLeadSh = (1.8 * cosYaw);
    const shLeftX = hipX + ((-shOffsetHorizWep + tacticalLeadSh) * cosTWep - lyLeftWep * sinTWep);
    const shLeftY = hipY + ((-shOffsetHorizWep + tacticalLeadSh) * sinTWep + lyLeftWep * cosTWep);

    const rightArmRelX = (hold.rightHandTarget.x - shRightX) * currentFacingDir;
    const rightArmRelY = hold.rightHandTarget.y - shRightY;

    const leftArmRelX = (hold.leftHandTarget.x - shLeftX) * currentFacingDir;
    const leftArmRelY = hold.leftHandTarget.y - shLeftY;

    const armRight = getArmAnglesForTarget(rightArmRelX, rightArmRelY, p.upperArmLen, p.forearmLen, 1);
    const armLeft = getArmAnglesForTarget(leftArmRelX, leftArmRelY, p.upperArmLen, p.forearmLen, 1);

    if (hWeight > 0.01) {
      rawFrontSwing = lerpAngle(armRight.swing, rawFrontSwing, hWeight);
      rawFrontElbow = lerpAngle(armRight.elbow, rawFrontElbow, hWeight);
      rawBackSwing = lerpAngle(armLeft.swing, rawBackSwing, hWeight);
      rawBackElbow = lerpAngle(armLeft.elbow, rawBackElbow, hWeight);
    } else {
      rawFrontSwing = armRight.swing;
      rawFrontElbow = armRight.elbow;
      rawBackSwing = armLeft.swing;
      rawBackElbow = armLeft.elbow;
    }
  }

  // PROCEDURALNA KINEMATYKA RZUTU BRONIĄ MIOTANĄ (GRANATEM)
  if (p.throwAnim && p.throwAnim.active) {
    const tAnim = p.throwAnim;
    const facingDir = p.facing || 1;
    const handBaseX = p.x + p.w / 2;
    const handBaseY = p.y + p.h * 0.38;
    const targetX = (typeof tAnim.targetX === 'number' && !isNaN(tAnim.targetX)) ? tAnim.targetX : (handBaseX + facingDir * 120);
    const targetY = (typeof tAnim.targetY === 'number' && !isNaN(tAnim.targetY)) ? tAnim.targetY : (handBaseY - 60);
    const localAimAngle = Math.atan2(targetY - handBaseY, (targetX - handBaseX) * facingDir);

    let throwSwing = 0, throwElbow = 0;
    let guideSwing = 0, guideElbow = 0;

    if (tAnim.phase === 'WINDUP') {
      // 1. ZAMACH / CHAMBERING: Dłoń z granatem uniesiona za głową/uchem
      const uWindup = Math.min(1.0, (tAnim.timer || 0) / (tAnim.windupDuration || 6));
      const windupSwing = -2.15 + localAimAngle * 0.22;
      const windupElbow = 2.05;
      throwSwing = lerp(rawFrontSwing, windupSwing, Math.max(0.4, uWindup));
      throwElbow = lerp(rawFrontElbow, windupElbow, Math.max(0.4, uWindup));

      // Ręka nie-dominująca wyciągnięta w stronę celu (stabilizacja i celowanie)
      const pointSwing = 1.05 + localAimAngle * 0.65;
      guideSwing = lerp(rawBackSwing, pointSwing, Math.max(0.4, uWindup));
      guideElbow = 0.35;

      p.torsoTilt = -0.22 * facingDir;
      if (p.pose) {
        p.pose.torsoTilt = p.torsoTilt;
        p.pose.shoulderTilt = -0.15;
      }
    } else if (tAnim.phase === 'THROW') {
      // 2. WYRZUT / SNAP FORWARD & RELEASE APEX: Eksplozja ramienia w wektor celu
      const dur = tAnim.throwDuration || 5;
      const uT = Math.min(1.0, (tAnim.timer || 0) / dur);
      const releaseSwing = (Math.PI / 2) - localAimAngle;
      const followSwing = releaseSwing - 0.45;

      if (uT < 0.45) {
        // Eksplozja w przód w stronę Apex (Klatka 0 do 2)
        const uApex = uT / 0.45;
        throwSwing = lerp(-2.15 + localAimAngle * 0.22, releaseSwing, uApex);
        throwElbow = lerp(2.05, 0.25, uApex);
        guideSwing = lerp(1.05, -0.55, uApex);
        guideElbow = lerp(0.35, 0.85, uApex);
        p.torsoTilt = lerp(-0.22, 0.35, uApex) * facingDir;
        if (p.pose) p.pose.shoulderTilt = lerp(-0.15, 0.20, uApex);
      } else {
        // Follow-through po wypuszczeniu granatu z dłoni (Klatka 2 do 5)
        const uFollow = (uT - 0.45) / 0.55;
        throwSwing = lerp(releaseSwing, followSwing, uFollow);
        throwElbow = lerp(0.25, 0.45, uFollow);
        guideSwing = -0.55;
        guideElbow = 0.85;
        p.torsoTilt = 0.35 * facingDir;
        if (p.pose) p.pose.shoulderTilt = 0.20;
      }
      if (p.pose) p.pose.torsoTilt = p.torsoTilt;
    } else if (tAnim.phase === 'RECOVERY') {
      // 3. POWRÓT DO POSTAWY / RECOVERY: Płynne wyhamowanie i powrót do gotowości
      const uRec = Math.min(1.0, (tAnim.timer || 0) / (tAnim.recoveryDuration || 8));
      const releaseSwing = (Math.PI / 2) - localAimAngle;
      const followSwing = releaseSwing - 0.45;

      throwSwing = lerp(followSwing, 0.05, uRec);
      throwElbow = lerp(0.45, 0.35, uRec);
      guideSwing = lerp(-0.55, -0.05, uRec);
      guideElbow = lerp(0.85, 0.28, uRec);

      p.torsoTilt = lerp(0.35, 0, uRec) * facingDir;
      if (p.pose) {
        p.pose.torsoTilt = p.torsoTilt;
        p.pose.shoulderTilt = lerp(0.20, 0, uRec);
      }
    }

    if (isRightLimbForeground) {
      rawFrontSwing = throwSwing;
      rawFrontElbow = throwElbow;
      rawBackSwing = guideSwing;
      rawBackElbow = guideElbow;
    } else {
      rawBackSwing = throwSwing;
      rawBackElbow = throwElbow;
      rawFrontSwing = guideSwing;
      rawFrontElbow = guideElbow;
    }
  }

  if (!p.pose) {
    p.pose = { initialized: false };
  }
  const pose = p.pose;
  if (!pose.initialized || Math.abs(rawFootFrontTargetX - pose.footFrontX) > 150) {
    pose.footFrontX = rawFootFrontTargetX;
    pose.footFrontY = rawFootFrontTargetY;
    pose.footFrontAnkle = rawFootFrontAnkle;
    pose.footBackX = rawFootBackTargetX;
    pose.footBackY = rawFootBackTargetY;
    pose.footBackAnkle = rawFootBackAnkle;
    pose.effAnkleFront = rawFootFrontAnkle;
    pose.effAnkleBack = rawFootBackAnkle;
    pose.flexFront = 0;
    pose.flexBack = 0;
    pose.armFrontSwing = rawFrontSwing;
    pose.armFrontElbow = rawFrontElbow;
    pose.armBackSwing = rawBackSwing;
    pose.armBackElbow = rawBackElbow;
    pose.torsoTilt = p.torsoTilt;
    pose.shoulderTilt = 0;
    pose.headPitch = p.headPitch;
    pose.initialized = true;
  }

  const wepWeight = (p.currentWeapon && !p.isHolstered && typeof p.shootPoseWeight === 'number') ? p.shootPoseWeight : 0;
  let footBlend = p.isDead ? 0.90 : 0.32;
  let armBlend = p.isDead ? 0.90 : ((p.currentWeapon && !p.isHolstered && !p.isDead) ? (wepWeight > 0.4 ? 0.78 : 0.45) : 0.28);

  if (p.jumpTakeoffTimer > 0) {
    footBlend = 0.85;
    armBlend = 0.55;
  } else if (!isGrounded && p.vy > 0.8) {
    footBlend = 0.45;
  } else if (p.kickMode === 'BACKFLIP') {
    footBlend = 0.85;
    armBlend = 0.65;
  } else if (p.kickMode === 'BACKFLIP_LAND') {
    footBlend = 0.60;
    armBlend = 0.45;
  } else if (p.isJumpCharging && speed < 0.8) {
    footBlend = 0.40;
    armBlend = 0.35;
  } else if (p.kickState === 'SWING') {
    footBlend = 0.65;
    armBlend = 0.45;
  } else if (p.isSliding || p.kickMode === 'SCISSOR') {
    footBlend = 0.50;
    armBlend = 0.35;
  } else if (p.kickMode === 'SPIN_VOLLEY') {
    footBlend = 0.75;
    armBlend = 0.45;
  } else if (p.kickMode === 'SPARTAN') {
    footBlend = 0.75;
    armBlend = 0.55;
  } else if (p.staggerTimer > 0) {
    footBlend = 0.85;
    armBlend = 0.85;
  } else if (p.isProne) {
    footBlend = 0.55;
    armBlend = 0.45;
  }

  if (p.throwAnim && p.throwAnim.active) {
    armBlend = 0.85;
  } else if (p.isReloading && !p.isDead) {
    armBlend = 0.82;
  }

  // Kompensacja inercyjna układu odniesienia ciała w locie:
  // Aktualizujemy pozycję stóp o wektor prędkości (vx, vy), aby bezwładność nie podwijała nóg pod miednicę podczas spadania
  if (!isGrounded || p.isJumping) {
    const deltaY = (typeof p.vy === 'number' && !isNaN(p.vy)) ? p.vy : 0;
    const deltaX = (typeof p.vx === 'number' && !isNaN(p.vx)) ? p.vx : 0;
    pose.footFrontX += deltaX;
    pose.footFrontY += deltaY;
    pose.footBackX += deltaX;
    pose.footBackY += deltaY;
  }

  if (p.isSliding) {
    pose.footFrontX = rawFootFrontTargetX;
    pose.footFrontY = rawFootFrontTargetY;
    pose.footFrontAnkle = rawFootFrontAnkle;
  } else {
    pose.footFrontX += (rawFootFrontTargetX - pose.footFrontX) * footBlend;
    pose.footFrontY += (rawFootFrontTargetY - pose.footFrontY) * footBlend;
    pose.footFrontAnkle = lerpAngle(pose.footFrontAnkle, rawFootFrontAnkle, footBlend);
  }

  pose.footBackX += (rawFootBackTargetX - pose.footBackX) * footBlend;
  pose.footBackY += (rawFootBackTargetY - pose.footBackY) * footBlend;
  pose.footBackAnkle = lerpAngle(pose.footBackAnkle, rawFootBackAnkle, footBlend);

  pose.armFrontSwing = lerpAngle(pose.armFrontSwing, rawFrontSwing, armBlend);
  pose.armFrontElbow = lerpAngle(pose.armFrontElbow, rawFrontElbow, armBlend);
  pose.armBackSwing = lerpAngle(pose.armBackSwing, rawBackSwing, armBlend);
  pose.armBackElbow = lerpAngle(pose.armBackElbow, rawBackElbow, armBlend);

  if (p.isDead) {
    pose.torsoTilt = p.torsoTilt;
    pose.headPitch = p.headPitch;
  } else if (p.kickMode === 'BACKFLIP') {
    pose.torsoTilt = p.torsoTilt;
    pose.headPitch += (p.headPitch - pose.headPitch) * 0.22;
  } else if (p.staggerTimer > 0) {
    // Sylwetka leży płasko na plecach: tors i głowa płasko równolegle do platformy (-90 stopni odchylenia)
    pose.torsoTilt = -Math.PI / 2 * p.facing;
    pose.headPitch = 0;
  } else if (p.kickMode === 'SPARTAN') {
    const t = p.spartanTimer || 0;
    if (t <= 4) {
      // Faza 1: Chambering (klatki 0-4): korpus lekko pochylony ku celowi
      pose.torsoTilt = 0.15 * p.facing;
      pose.headPitch = 0.08 * p.facing;
    } else if (t <= 15) {
      // Fazy 2 i 3: Piston Thrust i Impact Hold (klatki 5-15): tors mocno w tył w geście zaparcia (-0.45 * facing)
      pose.torsoTilt = -0.45 * p.facing;
      pose.headPitch = 0.14 * p.facing;
    } else {
      // Faza 4: Recovery (klatki 16-22): płynny powrót do pionu
      const w = Math.min(1.0, (t - 15) / 7);
      pose.torsoTilt = lerp(-0.45, 0.0, w) * p.facing;
      pose.headPitch = lerp(0.14, 0.0, w) * p.facing;
    }
  } else if (p.isProne) {
    const isCrawlingNow = speed > 0.08;
    let targetProneTilt = isCrawlingNow
      ? (1.28 + Math.sin((p.crawlPhase || 0) * 2) * 0.025)
      : 1.24;

    let proneWorldAimPitch = isCrawlingNow ? (0.06 + Math.sin((p.crawlPhase || 0) * 2) * 0.03) : 0.02;
    if (typeof p.aimX === 'number' && typeof p.aimY === 'number' && !isNaN(p.aimX) && !isNaN(p.aimY)) {
      const shEstX = hipX + 20 * currentFacingDir;
      const shEstY = hipY - 7;
      const rawAimP = Math.atan2(p.aimY - shEstY, Math.max(8, (p.aimX - shEstX) * currentFacingDir));
      proneWorldAimPitch = Math.max(-0.55, Math.min(0.20, rawAimP));
      targetProneTilt = Math.max(1.14, Math.min(1.34, targetProneTilt + proneWorldAimPitch * 0.18));
    }

    const finalProneTilt = targetProneTilt * currentFacingDir;
    pose.torsoTilt += (finalProneTilt - pose.torsoTilt) * 0.28;

    // Głowa uniesiona ku górze (-abs(torsoTilt)) + podążanie za kątem celowania + przyłożenie policzka do kolby
    const absTorso = Math.abs(pose.torsoTilt);
    const proneCheekWeld = (hasActiveWeapon && (p.shootPoseWeight || 0) > 0.05) ? (0.12 * p.shootPoseWeight) : 0;
    const targetProneHeadPitch = -absTorso + proneWorldAimPitch + proneCheekWeld;
    pose.headPitch += (targetProneHeadPitch - pose.headPitch) * 0.28;
  } else {
    pose.torsoTilt += (p.torsoTilt - pose.torsoTilt) * 0.24;
    pose.headPitch += (p.headPitch - pose.headPitch) * 0.22;

    // Przyłożenie policzka do baki kolby (Cheek Weld) podczas celowania/strzału
    if (hasActiveWeapon && (p.shootPoseWeight || 0) > 0.05) {
      const cheekWeld = 0.10 * p.shootPoseWeight * currentFacingDir;
      pose.headPitch += (cheekWeld - pose.headPitch) * 0.25;
    }
  }

  let shoulderCounterTilt = 0;
  if (!p.isDead && speed > 0.08) {
    if (p.isProne) {
      shoulderCounterTilt = -Math.cos(p.crawlPhase || 0) * 0.08 * currentFacingDir;
    } else {
      let targetShoulderAmp = 0.05;
      if (p.gaitMode === 'SPRINT') targetShoulderAmp = 0.12;
      else if (p.gaitMode === 'JOG') targetShoulderAmp = 0.08;
      shoulderCounterTilt = -Math.sin(p.stridePhase) * targetShoulderAmp * currentFacingDir;
    }
  }
  pose.shoulderTilt += (shoulderCounterTilt - pose.shoulderTilt) * 0.20;

  const cosTorsoT = Math.cos(pose.torsoTilt);
  const sinTorsoT = Math.sin(pose.torsoTilt);

  const headTopX = hipX + (36 * sinTorsoT);
  const headTopY = hipY - (36 * cosTorsoT) + ((p.headBob || 0) * 0.75);
  p.head = { x: headTopX, y: headTopY };
  if (!p.height) p.height = p.h || 70;
  if (!p.width) p.width = p.w || 24;

  const shOffsetHoriz = (-cosYaw * 0.35) - (sinYaw * 4.5);
  const lyRightSh = -19.5 - (pose.shoulderTilt * 7.5 * cosYaw);
  const lyLeftSh = -19.5 + (pose.shoulderTilt * 7.5 * cosYaw);

  const shRightX = hipX + (shOffsetHoriz * cosTorsoT - lyRightSh * sinTorsoT);
  const shRightY = hipY + (shOffsetHoriz * sinTorsoT + lyRightSh * cosTorsoT);

  const tacticalLeadSh = hasActiveWeapon ? (1.8 * cosYaw) : 0;
  const shLeftX = hipX + ((-shOffsetHoriz + tacticalLeadSh) * cosTorsoT - lyLeftSh * sinTorsoT);
  const shLeftY = hipY + ((-shOffsetHoriz + tacticalLeadSh) * sinTorsoT + lyLeftSh * cosTorsoT);

  const hipOffsetHoriz = (cosYaw * 0.35) - (sinYaw * 3.2);
  const hipRightX = hipX + hipOffsetHoriz;
  const hipLeftX = hipX - hipOffsetHoriz;

  const armColBack = v.armColorBack || '#991b1b';
  const legThighBack = v.legThighBack || '#991b1b';
  const legShinBack = v.legShinBack || '#b91c1c';
  const bootBack = v.bootBack || '#111827';

  p.currentClass?.onDrawUnder?.(ctx, p);

  const isArmFrontDismembered = !!p.dismembered?.armFront;
  const isArmBackDismembered = !!p.dismembered?.armBack;
  const isLegFrontDismembered = !!p.dismembered?.legFront;
  const isLegBackDismembered = !!p.dismembered?.legBack;

  const maxHp = p.maxHp || 100;
  const curHp = Math.max(0, p.hp ?? 100);
  const dmgRatio = p.isDead ? 1.0 : Math.max(0, Math.min(1.0, 1.0 - (curHp / maxHp)));

  // KOŃCZYNY W TLE
  if (isRightLimbForeground) {
    if (!isArmBackDismembered) {
      renderArm(ctx, shLeftX, shLeftY, pose.armBackSwing, pose.armBackElbow, currentFacingDir, armColBack, null, false, v, p.upperArmLen, p.forearmLen, p);
    } else {
      drawLimbStump(ctx, shLeftX, shLeftY, pose.armBackSwing, 'arm', currentFacingDir, v, false);
    }

    if (!isLegBackDismembered) {
      renderIKLeg(ctx, hipLeftX, hipY, pose.footBackX, pose.footBackY, p.thighLen, p.shinLen, pose.footBackAnkle, currentFacingDir, legThighBack, legShinBack, bootBack, false, v, p);
    } else {
      drawLimbStump(ctx, hipLeftX, hipY, pose.torsoTilt, 'leg', currentFacingDir, v, false);
    }
  } else {
    if (!isArmFrontDismembered) {
      renderArm(ctx, shRightX, shRightY, pose.armFrontSwing, pose.armFrontElbow, currentFacingDir, armColBack, null, false, v, p.upperArmLen, p.forearmLen, p);
    } else {
      drawLimbStump(ctx, shRightX, shRightY, pose.armFrontSwing, 'arm', currentFacingDir, v, false);
    }

    if (!isLegFrontDismembered) {
      renderIKLeg(ctx, hipRightX, hipY, pose.footFrontX, pose.footFrontY, p.thighLen, p.shinLen, pose.footFrontAnkle, currentFacingDir, legThighBack, legShinBack, bootBack, false, v, p);
    } else {
      drawLimbStump(ctx, hipRightX, hipY, pose.torsoTilt, 'leg', currentFacingDir, v, false);
    }
  }

  // TORS, PAS I SZYJA
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(pose.torsoTilt);

  const absCos = Math.abs(cosYaw);
  const absSin = Math.sin(sinYaw);
  const fDir = currentFacingDir;

  const waistHalfW = (4.65 + absSin * 1.2) * muscle;
  const shoulderHalfW = (4.8 + absSin * 1.5) * (isSculpted ? muscle * 1.22 : muscle);
  const waistY = -3.8;

  // SZYJA (Anatomiczny cylinder szyi łączący podstawę czaszki i żuchwę z kołnierzem koszulki)
  const neckBackX = -fDir * (3.1 * absCos + 2.6 * (1 - absCos)) * muscle;
  const neckFrontX = fDir * (1.9 * absCos + 2.6 * (1 - absCos)) * muscle;
  const neckGrad = ctx.createLinearGradient(
    Math.min(neckBackX, neckFrontX), 0,
    Math.max(neckBackX, neckFrontX), 0
  );
  if (fDir > 0) {
    neckGrad.addColorStop(0.0, v.skinDark);
    neckGrad.addColorStop(0.45, v.skinBack);
    neckGrad.addColorStop(0.85, v.skinMid);
    neckGrad.addColorStop(1.0, v.skinLight);
  } else {
    neckGrad.addColorStop(0.0, v.skinLight);
    neckGrad.addColorStop(0.15, v.skinMid);
    neckGrad.addColorStop(0.55, v.skinBack);
    neckGrad.addColorStop(1.0, v.skinDark);
  }

  ctx.beginPath();
  ctx.moveTo(neckBackX * 0.96, -28.8);
  ctx.quadraticCurveTo(neckBackX * 0.90, -26.0, neckBackX * 1.08, -23.6);
  ctx.lineTo(neckFrontX * 1.15, -22.6);
  ctx.quadraticCurveTo(neckFrontX * 0.92, -25.2, neckFrontX * 0.95, -27.8);
  ctx.closePath();
  ctx.fillStyle = neckGrad;
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.95;
  ctx.stroke();

  // Cień pod żuchwą i zarys mięśnia mostkowo-obojczykowo-sutkowego (SCM) na szyi
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.moveTo(neckBackX * 0.20, -27.2);
  ctx.lineTo(neckFrontX * 0.95, -26.5);
  ctx.lineTo(neckFrontX * 0.85, -24.8);
  ctx.lineTo(neckBackX * 0.10, -25.8);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.24)';
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  ctx.moveTo(-fDir * 0.8, -27.0);
  ctx.quadraticCurveTo(fDir * 0.4, -25.2, neckFrontX * 0.75, -23.2);
  ctx.stroke();

  // MIEDNICA, POŚLADKI I KROK (Górna część bojówek pod pasem taktycznym, obejmująca staw biodrowy y = 0)
  const thighMatchHalfW = 4.15 * muscle;
  const pelvisTopY = -2.2;
  const pelvisBottomY = 4.4;
  const gluteOutX = -fDir * (waistHalfW + 0.55 * absCos);
  const pelvisBackBottomX = -fDir * (thighMatchHalfW - 0.35 * absCos);
  const pelvisFrontBottomX = fDir * (thighMatchHalfW + 0.35 * absCos);

  const pelvisGrad = ctx.createLinearGradient(0, pelvisTopY, -fDir * waistHalfW, pelvisBottomY);
  pelvisGrad.addColorStop(0.0, v.legThighFront || '#3f3f46');
  pelvisGrad.addColorStop(0.45, v.shortsColor1 || '#334155');
  pelvisGrad.addColorStop(1.0, v.shortsColor2 || '#18181b');

  ctx.beginPath();
  ctx.moveTo(-fDir * waistHalfW, pelvisTopY);
  // Profil pośladka (gluteus) płynnie przechodzący w tylną krawędź uda
  ctx.bezierCurveTo(
    gluteOutX, -0.4,
    gluteOutX * 0.96, 2.2,
    pelvisBackBottomX, pelvisBottomY
  );
  // Dolne połączenie w kroku (wewnątrz obrysu uda, bez poziomej kreski odcinającej nogę!)
  ctx.lineTo(pelvisFrontBottomX, pelvisBottomY - 0.4);
  // Przedni profil biodra / rozporka do pasa
  ctx.quadraticCurveTo(
    fDir * (waistHalfW + 0.20 * absCos), 0.8,
    fDir * waistHalfW, pelvisTopY
  );
  ctx.closePath();
  ctx.fillStyle = pelvisGrad;
  ctx.fill();

  // Zewnętrzny obrys bioder i pośladka (tylko boczne krawędzie przechodzące w udo, bez zamykania dołu!)
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(-fDir * waistHalfW, pelvisTopY);
  ctx.bezierCurveTo(
    gluteOutX, -0.4,
    gluteOutX * 0.96, 2.2,
    pelvisBackBottomX, pelvisBottomY
  );
  ctx.moveTo(fDir * waistHalfW, pelvisTopY);
  ctx.quadraticCurveTo(
    fDir * (waistHalfW + 0.20 * absCos), 0.8,
    pelvisFrontBottomX, pelvisBottomY - 0.4
  );
  ctx.stroke();

  // Szew boczny bojówek, skośna kieszeń biodrowa i zagięcie materiału w pachwinie
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-fDir * 0.6, pelvisTopY + 0.6);
  ctx.lineTo(fDir * 1.4, 2.8);
  ctx.moveTo(-fDir * waistHalfW * 0.45, 1.4);
  ctx.quadraticCurveTo(0, 3.2, fDir * waistHalfW * 0.55, 2.4);
  ctx.stroke();

  // BAZA MUNDURU: TAKTYCZNY COMBAT SHIRT / T-SHIRT Z NATURALNYMI ZAGIĘCIAMI TKANINY
  const shirtGrad = ctx.createLinearGradient(-shoulderHalfW, 0, shoulderHalfW, 0);
  const shirtBaseCol = isLookingAway ? (v.jerseyBack1 || '#18181b') : (v.jerseyFront1 || '#27272a');
  const shirtLightCol = isLookingAway ? (v.jerseyBack0 || '#27272a') : (v.jerseyFront2 || '#3f3f46');
  const shirtDarkCol = isLookingAway ? (v.jerseyBack2 || '#09090b') : (v.jerseyFront0 || '#18181b');
  shirtGrad.addColorStop(0.0, shirtDarkCol);
  shirtGrad.addColorStop(0.35, shirtBaseCol);
  shirtGrad.addColorStop(0.75, shirtLightCol);
  shirtGrad.addColorStop(1.0, shirtDarkCol);

  const backCollarX = neckBackX * 1.12;
  const frontCollarX = neckFrontX * 1.22;
  const backCollarY = -24.2;
  const frontCollarY = -22.8;

  // Główny korpus koszulki/bluzy bojowej – anatomiczny kołnierz przy szyi, profil klatki piersiowej, pleców i zbluzowanie nad pasem
  const frontShX = fDir * (shoulderHalfW * 0.78);
  const backShX = -fDir * (shoulderHalfW * 0.82);
  const frontWaistX = fDir * waistHalfW;
  const backWaistX = -fDir * waistHalfW;
  const chestOut = fDir * (shoulderHalfW + 0.95 * absCos);
  const backOut = -fDir * (shoulderHalfW + 0.65 * absCos);
  const ribInFront = fDir * (waistHalfW - 0.25 * absCos);
  const lumbarInBack = -fDir * (waistHalfW - 0.45 * absCos);
  const blouseFrontX = fDir * (waistHalfW + 0.55);
  const blouseBackX = -fDir * (waistHalfW + 0.45);

  ctx.beginPath();
  ctx.moveTo(backWaistX, waistY);
  // Zbluzowanie materiału nad pasem z tyłu i profil lędźwi oraz łopatki
  ctx.quadraticCurveTo(blouseBackX, waistY - 1.5, lumbarInBack, -8.5);
  ctx.bezierCurveTo(
    backOut * 0.94, -13.5,
    backOut, -19.0,
    backShX, -22.8
  );
  // Kark i anatomiczny kołnierz wokół podstawy szyi (crew-neck)
  ctx.quadraticCurveTo(backCollarX * 1.05, -24.0, backCollarX, backCollarY);
  ctx.quadraticCurveTo(
    (backCollarX + frontCollarX) * 0.5, -23.1,
    frontCollarX, frontCollarY
  );
  // Górna część piersi od grdyki do klatki piersiowej
  ctx.quadraticCurveTo(frontShX * 0.92, -22.2, frontShX, -21.0);
  // Profil klatki piersiowej (mięsień piersiowy), talii i zbluzowanie materiału nad pasem z przodu
  ctx.bezierCurveTo(
    chestOut, -17.5,
    chestOut * 0.94, -12.5,
    ribInFront, -8.0
  );
  ctx.quadraticCurveTo(blouseFrontX, waistY - 1.4, frontWaistX, waistY);
  // Miękko pofalowany dół koszulki wchodzący w pas taktyczny
  ctx.bezierCurveTo(
    frontWaistX * 0.35, waistY + 0.9,
    backWaistX * 0.35, waistY + 0.8,
    backWaistX, waistY
  );
  ctx.closePath();
  ctx.fillStyle = shirtGrad;
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Taktyczny ściągacz kołnierza (ribbed crew-neck collar band) wokół nasady szyi
  ctx.fillStyle = shirtDarkCol;
  ctx.beginPath();
  ctx.moveTo(backCollarX, backCollarY);
  ctx.quadraticCurveTo(
    (backCollarX + frontCollarX) * 0.5, -23.1,
    frontCollarX, frontCollarY
  );
  ctx.lineTo(frontCollarX + fDir * 0.4, frontCollarY + 1.3);
  ctx.quadraticCurveTo(
    (backCollarX + frontCollarX) * 0.5, -21.7,
    backCollarX - fDir * 0.3, backCollarY + 1.3
  );
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Realistyczne fałdy i zagięcia materiału na koszulce (napięcie pod pachą, pod piersią i marszczenie nad pasem)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  // 1. Ukośna fałda napięcia od pachy ku klatce piersiowej
  ctx.moveTo(-fDir * shoulderHalfW * 0.10, -17.8);
  ctx.quadraticCurveTo(fDir * shoulderHalfW * 0.42, -15.2, fDir * shoulderHalfW * 0.78, -12.8);
  // 2. Fałda materiału na żebrach / brzuchu
  ctx.moveTo(-fDir * waistHalfW * 0.30, -12.2);
  ctx.quadraticCurveTo(fDir * waistHalfW * 0.25, -10.2, fDir * waistHalfW * 0.68, -8.4);
  // 3. Marszczenie (zbluzowanie) tkaniny tuż nad pasem taktycznym
  ctx.moveTo(-waistHalfW * 0.45, -7.2);
  ctx.quadraticCurveTo(-waistHalfW * 0.30, -5.5, -waistHalfW * 0.40, waistY - 0.4);
  ctx.moveTo(waistHalfW * 0.12, -7.6);
  ctx.quadraticCurveTo(waistHalfW * 0.26, -5.6, waistHalfW * 0.18, waistY - 0.3);
  ctx.moveTo(waistHalfW * 0.52, -6.8);
  ctx.quadraticCurveTo(waistHalfW * 0.64, -5.2, waistHalfW * 0.48, waistY - 0.4);
  ctx.stroke();

  // Subtelne rozjaśnienia na grzbietach fałd koszulki (nadają tkaninie trójwymiarowość)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(fDir * shoulderHalfW * 0.12, -19.5);
  ctx.quadraticCurveTo(chestOut * 0.80, -15.8, fDir * shoulderHalfW * 0.52, -13.2);
  ctx.moveTo(-fDir * waistHalfW * 0.22, -11.2);
  ctx.quadraticCurveTo(fDir * waistHalfW * 0.28, -9.2, fDir * waistHalfW * 0.64, -7.6);
  ctx.stroke();

  // PAS TAKTYCZNY PMC (Duty / Riggers Belt – na wysokości anatomicznej talii powyżej stawu biodrowego)
  const beltTopY = -4.6;
  const beltBotY = -1.4;
  const beltGrad = ctx.createLinearGradient(-waistHalfW, 0, waistHalfW, 0);
  beltGrad.addColorStop(0.0, '#09090b');
  beltGrad.addColorStop(0.5, '#18181b');
  beltGrad.addColorStop(1.0, '#09090b');

  ctx.beginPath();
  ctx.moveTo(-waistHalfW - 0.2, beltTopY);
  ctx.quadraticCurveTo(0, beltTopY + 0.6, waistHalfW + 0.2, beltTopY);
  ctx.lineTo(waistHalfW + 0.1, beltBotY);
  ctx.quadraticCurveTo(0, beltBotY + 0.7, -waistHalfW - 0.1, beltBotY);
  ctx.closePath();
  ctx.fillStyle = beltGrad;
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Metalowa klamra pasa taktycznego Cobra (z przodu pasa)
  const buckleX = fDir * (waistHalfW * 0.48);
  ctx.fillStyle = '#52525b';
  ctx.fillRect(buckleX - 1.5, beltTopY + 0.6, 3.0, 2.3);
  ctx.fillStyle = '#71717a';
  ctx.fillRect(buckleX - 0.9, beltTopY + 1.0, 1.8, 1.5);

  // NAKŁADANA KAMIZELKA KULOODPORNA (MODULAR BULLETPROOF VEST / PLATE CARRIER)
  // Rysowana TYLKO wtedy, gdy gracz posiada pancerz lub ma ustawione p.hasVest / v.hasVest
  const hasEquippedVest = !!(p.hasVest || v.hasVest);
  if (hasEquippedVest) {
    drawPlateCarrierOverlay(ctx, p, v, absCos, absSin, cosYaw, isLookingAway, shoulderHalfW, waistHalfW, waistY);
  }

  const plateW = Math.min(shoulderHalfW, waistHalfW) * 1.5;

  // WIDOCZNE ŚLADY KRWI I OBRAŻEŃ OD KUL/WYBUCHÓW NA TORSIE
  drawTorsoWounds(ctx, dmgRatio, absCos, absSin, cosYaw, plateW, waistHalfW, shoulderHalfW, isLookingAway);

  // MODEL JETPACKA NA PLECACH POSTACI
  drawJetpack(ctx, p, currentFacingDir, isLookingAway, absCos, absSin, waistHalfW, shoulderHalfW);

  // GŁOWA LUB KIKUT SZYI
  ctx.save();
  if (p.isProne && !p.isDead) {
    ctx.translate(-2.0 * currentFacingDir, -29.4 + ((p.headBob || 0) * 0.25));
  } else {
    ctx.translate(0.0, -30.5 + ((p.headBob || 0) * 0.35));
  }

  if (p.isDead && (!p.hasHead || p.decapitated || p.severedHead)) {
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(0, 3.5, 4.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(0, 3.5, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-1.0, 2.5, 2.0, 2.0);
  } else if (isNearProfile) {
    ctx.scale(currentFacingDir, 1);
    ctx.rotate(pose.headPitch);

    // 1. ANATOMICZNA CZASZKA (ŁYSA GŁOWA / MILITARY SHAVED HEAD)
    const faceGrad = ctx.createLinearGradient(-5.0, 0, 7.0, 0);
    faceGrad.addColorStop(0.0, v.skinBack);
    faceGrad.addColorStop(0.5, v.skinMid);
    faceGrad.addColorStop(1.0, v.skinLight);

    ctx.beginPath();
    // Potylica i ciemieniowa kopuła czaszki (okrągła, czysta łysa głowa)
    ctx.moveTo(-4.6, 2.5);
    ctx.quadraticCurveTo(-6.4, 0.2, -6.0, -2.8);
    ctx.quadraticCurveTo(-5.4, -7.2, -1.2, -7.2);
    // Łuk czołowy
    ctx.quadraticCurveTo(2.8, -7.0, 4.2, -5.2);
    // Łuk brwiowy i nasada nosa
    ctx.lineTo(4.4, -3.4);
    ctx.lineTo(6.8, -1.0); // czubek nosa
    ctx.lineTo(5.1, -0.4);
    ctx.lineTo(5.5, 0.6);  // górna warga
    ctx.lineTo(4.9, 1.4);  // usta
    ctx.lineTo(5.3, 2.3);  // broda
    ctx.lineTo(4.3, 4.8);  // dolna szczęka
    ctx.lineTo(0.2, 4.4);
    ctx.lineTo(-3.5, 3.8);
    ctx.closePath();
    ctx.fillStyle = faceGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    const hasHelmet = !!(p.hasHelmet || v.hasHelmet);
    const hairPal = getHairPalette(v.hairColor || v.hairColor0 || '#18181b');

    // Włosy i fryzura (warstwa pod uchem / cieniowanie skroni oraz główna fryzura i fizyka długich włosów)
    drawCharacterHairProfile(ctx, p, v, currentFacingDir, pose.torsoTilt, pose.headPitch, hasHelmet);

    // Małżowina uszna (anatomiczne ucho z cieniowaniem)
    ctx.fillStyle = v.skinBack;
    ctx.beginPath();
    ctx.ellipse(-2.6, -0.6, 1.6, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = v.skinDark;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(-2.5, -0.6, 1.1, 0.4 * Math.PI, 1.7 * Math.PI, false);
    ctx.stroke();

    // Kosmyki nachodzące przed ucho / na skroń dla wybranych fryzur
    drawCharacterHairOverEarProfile(ctx, v, hairPal, hasHelmet);

    // 2. MODULARNE NAKRYCIE GŁOWY: HEŁM BALISTYCZNY FAST (jeśli założony)
    if (hasHelmet) {
      const isCyan = (p.team === 'CYAN' || (!p.team && (p.isLocal !== false)));
      const visorNeon = isCyan ? '#00e5ff' : '#f97316';
      const helmGrad = ctx.createLinearGradient(-6.0, -11.0, 6.0, -2.0);
      helmGrad.addColorStop(0.0, '#18181b');
      helmGrad.addColorStop(0.5, v.helmetColor || '#27272a');
      helmGrad.addColorStop(1.0, '#09090b');

      ctx.beginPath();
      ctx.moveTo(-5.5, -1.8);
      ctx.lineTo(-6.8, -6.5);
      ctx.quadraticCurveTo(-6.5, -10.5, -1.2, -10.8);
      ctx.quadraticCurveTo(4.5, -10.5, 5.5, -6.2);
      ctx.lineTo(4.8, -3.2);
      ctx.lineTo(2.0, -3.5);
      ctx.quadraticCurveTo(-1.0, -3.0, -5.5, -1.8);
      ctx.closePath();
      ctx.fillStyle = helmGrad;
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // Montaż czołowy noktowizora (NVG Shroud)
      ctx.fillStyle = '#52525b';
      ctx.fillRect(4.4, -7.5, 1.5, 3.2);
      ctx.strokeStyle = '#71717a';
      ctx.lineWidth = 0.6;
      ctx.strokeRect(4.4, -7.5, 1.5, 3.2);

      // Boczna szyna montażowa ARC Rail
      ctx.fillStyle = '#09090b';
      ctx.fillRect(-4.5, -5.0, 6.5, 1.6);

      // Pasek podbródkowy (Chinstrap)
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-2.5, -1.5);
      ctx.lineTo(2.5, 3.6);
      ctx.stroke();

      // Taktyczny neonowy wizjer / HUD Visor
      ctx.fillStyle = visorNeon;
      ctx.shadowColor = visorNeon;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(2.2, -4.2);
      ctx.lineTo(5.2, -3.8);
      ctx.lineTo(4.6, -1.8);
      ctx.lineTo(2.2, -2.0);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    const eyeCenterX = 2.7;
    const eyeCenterY = -2.1;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(eyeCenterX, eyeCenterY, 1.5, 1.0, 0, 0, Math.PI * 2);
    ctx.fill();

    let lookX = 0.55;
    let lookY = 0.0;

    if (!p.isDead && p.lastBallX !== undefined && p.lastBallY !== undefined) {
      const headWorldX = hipX + (28 * Math.sin(pose.torsoTilt));
      const headWorldY = hipY - (28 * Math.cos(pose.torsoTilt)) - 10;
      const dxLook = (p.lastBallX - headWorldX) * p.facing;
      const dyLook = p.lastBallY - headWorldY;

      const lookAngle = Math.atan2(dyLook, Math.max(6, dxLook));
      const relAngle = lookAngle - (pose.torsoTilt * p.facing) - pose.headPitch;
      lookX = Math.cos(relAngle) * 0.65;
      lookY = Math.sin(relAngle) * 0.45;
    }

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(eyeCenterX + lookX, eyeCenterY + lookY, 0.72, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeCenterX + lookX * 0.5 + 0.25, eyeCenterY + lookY * 0.5 - 0.25, 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = hairPal.dark;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(1.4, -3.3);
    ctx.lineTo(4.4, -3.5);
    ctx.stroke();

    // Rany na twarzy w profilu
    drawHeadWoundsProfile(ctx, dmgRatio);

  } else if (isLookingAway) {
    ctx.rotate(pose.headPitch * 0.5);

    // Anatomiczna potylica czaszki (okrągła, czysta łysa głowa)
    const headBackGrad = ctx.createLinearGradient(-4.8, -8.0, 4.8, 4.0);
    headBackGrad.addColorStop(0.0, v.skinBack);
    headBackGrad.addColorStop(0.5, v.skinMid);
    headBackGrad.addColorStop(1.0, v.skinLight);

    ctx.beginPath();
    ctx.ellipse(0, -1.5, 4.9, 5.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = headBackGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    const hasHelmet = !!(p.hasHelmet || v.hasHelmet);
    drawCharacterHairFrontOrBack(ctx, v, true, hasHelmet);

    // Hełm z tyłu (jeśli założony)
    if (hasHelmet) {
      const helmBackGrad = ctx.createLinearGradient(-5.5, -9.0, 5.5, 0);
      helmBackGrad.addColorStop(0.0, '#18181b');
      helmBackGrad.addColorStop(0.5, v.helmetColor || '#27272a');
      helmBackGrad.addColorStop(1.0, '#09090b');

      ctx.beginPath();
      ctx.arc(0, -2.0, 5.5, Math.PI * 0.85, Math.PI * 0.15, true);
      ctx.closePath();
      ctx.fillStyle = helmBackGrad;
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.fillStyle = '#09090b';
      ctx.fillRect(-2.5, -4.5, 5.0, 2.0);
      ctx.fillStyle = '#52525b';
      ctx.beginPath();
      ctx.arc(0, -1.0, 1.0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rany z tyłu głowy
    drawHeadWoundsAway(ctx, dmgRatio);

  } else {
    ctx.rotate(pose.headPitch * 0.5);

    // Anatomiczna twarz z przodu
    const faceFrontGrad = ctx.createLinearGradient(-4.8, -6.0, 4.8, 6.0);
    faceFrontGrad.addColorStop(0.0, v.skinBack);
    faceFrontGrad.addColorStop(0.5, v.skinMid);
    faceFrontGrad.addColorStop(1.0, v.skinLight);

    ctx.beginPath();
    ctx.ellipse(0, -0.6, 4.8, 5.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = faceFrontGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    const hasHelmet = !!(p.hasHelmet || v.hasHelmet);
    const hairPal = getHairPalette(v.hairColor || v.hairColor0 || '#18181b');
    drawCharacterHairFrontOrBack(ctx, v, false, hasHelmet);

    // Hełm z przodu (jeśli założony)
    if (hasHelmet) {
      const isCyan = (p.team === 'CYAN' || (!p.team && (p.isLocal !== false)));
      const visorNeon = isCyan ? '#00e5ff' : '#f97316';

      const helmFrontGrad = ctx.createLinearGradient(-5.5, -8.0, 5.5, 0);
      helmFrontGrad.addColorStop(0.0, '#18181b');
      helmFrontGrad.addColorStop(0.5, v.helmetColor || '#27272a');
      helmFrontGrad.addColorStop(1.0, '#09090b');

      ctx.beginPath();
      ctx.arc(0, -1.8, 5.4, Math.PI * 0.9, Math.PI * 0.1, true);
      ctx.closePath();
      ctx.fillStyle = helmFrontGrad;
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.fillStyle = '#52525b';
      ctx.fillRect(-1.4, -6.0, 2.8, 2.4);

      ctx.fillStyle = visorNeon;
      ctx.shadowColor = visorNeon;
      ctx.shadowBlur = 6;
      ctx.fillRect(-3.6, -2.8, 7.2, 1.8);
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-2.0, -1.5, 1.2, 0.8, 0, 0, Math.PI * 2);
    ctx.ellipse(2.0, -1.5, 1.2, 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-1.8, -1.5, 0.55, 0, Math.PI * 2);
    ctx.arc(2.2, -1.5, 0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = hairPal.dark;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-3.2, -2.8);
    ctx.lineTo(-0.8, -2.5);
    ctx.moveTo(3.2, -2.8);
    ctx.lineTo(0.8, -2.5);
    ctx.stroke();

    // Rany na twarzy z przodu
    drawHeadWoundsFront(ctx, dmgRatio);
  }

  ctx.restore();
  ctx.restore();

  drawHeldWeapon(ctx, p);

  const armColFront = v.armColorFront || '#e53935';
  const legThighFront = v.legThighFront || '#dc2626';
  const legShinFront = v.legShinFront || '#e53935';
  const bootFront = v.bootColor || '#18181b';

  // KOŃCZYNY NA PIERWSZYM PLANIE
  if (isRightLimbForeground) {
    if (!isLegFrontDismembered) {
      renderIKLeg(ctx, hipRightX, hipY, pose.footFrontX, pose.footFrontY, p.thighLen, p.shinLen, pose.footFrontAnkle, currentFacingDir, legThighFront, legShinFront, bootFront, true, v, p);
    } else {
      drawLimbStump(ctx, hipRightX, hipY, pose.torsoTilt, 'leg', currentFacingDir, v, true);
    }

    if (!isArmFrontDismembered) {
      renderArm(ctx, shRightX, shRightY, pose.armFrontSwing, pose.armFrontElbow, currentFacingDir, armColFront, null, true, v, p.upperArmLen, p.forearmLen, p);
    } else {
      drawLimbStump(ctx, shRightX, shRightY, pose.armFrontSwing, 'arm', currentFacingDir, v, true);
    }
  } else {
    if (!isLegBackDismembered) {
      renderIKLeg(ctx, hipLeftX, hipY, pose.footBackX, pose.footBackY, p.thighLen, p.shinLen, pose.footBackAnkle, currentFacingDir, legThighFront, legShinFront, bootFront, true, v, p);
    } else {
      drawLimbStump(ctx, hipLeftX, hipY, pose.torsoTilt, 'leg', currentFacingDir, v, true);
    }

    if (!isArmBackDismembered) {
      renderArm(ctx, shLeftX, shLeftY, pose.armBackSwing, pose.armBackElbow, currentFacingDir, armColFront, null, true, v, p.upperArmLen, p.forearmLen, p);
    } else {
      drawLimbStump(ctx, shLeftX, shLeftY, pose.armBackSwing, 'arm', currentFacingDir, v, true);
    }
  }

  p.currentClass?.onDrawOverlay?.(ctx, p);

  if (p.isDead) {
    ctx.save();
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText(`💀 RESPAWN ZA ${Math.ceil(p.respawnTimer / 60)}s`, p.x + p.w / 2, p.y - 14);
    ctx.restore();
  } else if (p.emptyAmmoAlert > 0) {
    ctx.save();
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.fillText('⛔ NO AMMO', p.x + p.w / 2, p.y - 16);
    ctx.restore();
  }



  if (isDissolving) {
    // 4. Błyskawiczny, lekki zielony blask (jeden prosty okrąg zamiast filtrów blur)
    ctx.globalAlpha = (1 - dissolveProgress) * 0.35;
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(p.x + (p.w || 24) / 2, p.y + (p.h || 70) / 2, 24 * (1 - dissolveProgress * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Rysuje sylwetkę broni w slocie HUD.
 */
export function drawWeaponSilhouette(ctx, type, cx, cy, isSelected) {
  ctx.save();
  ctx.translate(cx, cy);

  if (isSelected) {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.45)';
    ctx.shadowBlur = 4;
  } else {
    ctx.fillStyle = '#94a3b8';
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  if (type === 'AK47') {
    // Kolba
    ctx.fillRect(-13, -1, 5, 2.5);
    // Komora i łoże
    ctx.fillRect(-8, -2, 12, 3.5);
    // Magazynek łukowy
    ctx.beginPath();
    ctx.moveTo(-4, 1.5);
    ctx.lineTo(-2, 5.5);
    ctx.lineTo(0.5, 5.5);
    ctx.lineTo(-1, 1.5);
    ctx.closePath();
    ctx.fill();
    // Lufa
    ctx.fillRect(4, -1, 8, 1.8);
  } else if (type === 'SHOTGUN') {
    // Kolba
    ctx.fillRect(-12, -1, 6, 3);
    // Komora zamkowa
    ctx.fillRect(-6, -2, 10, 4);
    // Długa lufa i podlufowy magazynek
    ctx.fillRect(4, -2, 9, 2.5);
    ctx.fillRect(4, 0.8, 7, 1.8);
  }

  ctx.restore();
}

/**
 * Rysuje pojedynczy, minimalistyczny kwadratowy kafelek broni w interfejsie HUD.
 */
export function drawWeaponSlot(ctx, btn, isSelected, player, isMobile = false) {
  const isActive = isSelected;
  const accentCol = btn.id === 'SHOTGUN' ? '#fb923c' : '#f59e0b';

  // Pobranie stanu amunicji z obiektu gracza
  const ammoObj = player.ammo?.[btn.id];
  const defMag = (btn.id === 'SHOTGUN' ? 8 : 30);
  const defRes = (btn.id === 'SHOTGUN' ? 64 : 90);
  const bCurrentAmmo = ammoObj ? ammoObj.currentAmmo : defMag;
  const bReserveAmmo = ammoObj ? ammoObj.reserveAmmo : defRes;
  const bMagSize = ammoObj ? (ammoObj.magSize || defMag) : defMag;
  const bIsReloading = !!ammoObj?.isReloading;
  const bIsNoAmmo = (bCurrentAmmo === 0 && bReserveAmmo === 0);
  const bIsLowAmmo = (!bIsNoAmmo && bCurrentAmmo <= Math.ceil(bMagSize * 0.25));

  const tileSize = btn.w;
  const tileX = btn.x;
  const tileY = btn.y;

  ctx.save();
  ctx.globalAlpha = isMobile ? 0.80 : 0.85;

  // 1. Tło kwadratowego kafelka (Dark Glass)
  const radius = isMobile ? 5 : 6;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(tileX, tileY, tileSize, tileSize, radius);
  } else {
    ctx.rect(tileX, tileY, tileSize, tileSize);
  }
  ctx.fillStyle = isActive
    ? 'rgba(30, 41, 59, 0.85)'
    : 'rgba(15, 23, 42, 0.80)';
  ctx.fill();

  // 2. Obrys ramki (akcent dla aktywnej, przygaszony szary dla nieaktywnej)
  let borderCol = isActive ? accentCol : 'rgba(148, 163, 184, 0.40)';
  if (isActive && bIsNoAmmo) borderCol = '#ef4444';
  else if (isActive && bIsLowAmmo) borderCol = '#f97316';

  ctx.strokeStyle = borderCol;
  ctx.lineWidth = isActive ? 1.6 : 1.0;
  if (isActive) {
    ctx.shadowColor = borderCol;
    ctx.shadowBlur = 6;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 3. Pasek postępu przeładowania na dolnej krawędzi kafelka
  if (bIsReloading && ammoObj) {
    const dur = ammoObj.reloadDuration || 120;
    const prog = Math.max(0, Math.min(1, 1 - (ammoObj.reloadTimer / dur)));
    ctx.save();
    ctx.fillStyle = accentCol;
    ctx.shadowColor = accentCol;
    ctx.shadowBlur = 4;
    ctx.fillRect(tileX + 3, tileY + tileSize - 3, (tileSize - 6) * prog, 2);
    ctx.restore();
  }

  // 4. Ikonka / sylwetka broni w centrum kafelka
  const iconScale = isMobile ? 0.82 : 0.95;
  ctx.save();
  ctx.translate(tileX + tileSize / 2, tileY + tileSize / 2);
  ctx.scale(iconScale, iconScale);
  drawWeaponSilhouette(ctx, btn.id, 0, 0, isActive);
  ctx.restore();

  // 5. Mały, dyskretny licznik amunicji pod ikoną
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const ammoY = tileY + tileSize + (isMobile ? 3 : 4);

  if (bIsReloading) {
    ctx.font = isMobile ? 'bold 8px monospace' : 'bold 9px monospace';
    ctx.fillStyle = accentCol;
    ctx.fillText('RELOAD', tileX + tileSize / 2, ammoY);
  } else if (bIsNoAmmo) {
    ctx.font = isMobile ? 'bold 8px monospace' : 'bold 9px monospace';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('EMPTY', tileX + tileSize / 2, ammoY);
  } else {
    ctx.font = isMobile ? 'bold 8px monospace' : 'bold 9px monospace';
    ctx.fillStyle = isActive ? '#f8fafc' : '#94a3b8';
    ctx.fillText(`${bCurrentAmmo}/${bReserveAmmo}`, tileX + tileSize / 2, ammoY);
  }

  ctx.restore();
}

/**
 * Paski zdrowia i paliwa są renderowane bezpośrednio nad głową każdej postaci w drawPlayer.
 */
export function drawEntityHealthBar(ctx, entity, yOffset = 0) {
  // Zastąpione przez minimalistyczne paski HP i JET nad głową w drawPlayer
}

/**
 * Rysuje w czasie rzeczywistym trajektorię balistyczną rzutu granatem (oryginalne białe kropki)
 */
export function drawGrenadeTrajectory(ctx, p, targetX, targetY, power = 1.0, groundY = 500) {
  if (!p) return;
  const pFacing = p.facing || 1;
  const handPos = (typeof getThrowHandPosition === 'function') ? getThrowHandPosition(p) : null;
  const startX = handPos ? handPos.x : (p.x + (p.w || 24) / 2 + pFacing * 14);
  const startY = handPos ? handPos.y : (p.y + (p.h || 70) * 0.42);

  const aimX = (typeof targetX === 'number' && !isNaN(targetX)) ? targetX : (startX + pFacing * 200);
  const aimY = (typeof targetY === 'number' && !isNaN(targetY)) ? targetY : (startY - 0.2 * 200);
  const angle = Math.atan2(aimY - startY, aimX - startX);

  const pwr = (typeof power === 'number' && power > 0) ? Math.min(1.5, Math.max(0.4, power * 1.3)) : 1.0;
  const speedMult = pwr;
  const initialSpeed = (960 / 60) * speedMult;
  const gVx = Math.cos(angle) * initialSpeed + (p.vx || 0) * 0.35;
  const gVy = Math.sin(angle) * initialSpeed + (p.vy || 0) * 0.25 - (3.2 * Math.min(1.2, speedMult));
  const grav = (CONFIG.GRAVITY || 0.38) * 0.95;

  ctx.save();
  const numDots = 14;
  const zoom = (camera && typeof camera.zoom === 'number' && camera.zoom > 0) ? camera.zoom : 1.0;

  for (let step = 1; step <= numDots; step++) {
    const tFrames = step * 3.5;
    const wx = startX + gVx * tFrames;
    const wy = startY + gVy * tFrames + 0.5 * grav * tFrames * tFrames;

    const alpha = Math.max(0.18, 0.85 - (step / numDots) * 0.65);
    const screenRadius = Math.max(2.2, 4.2 - step * 0.16);
    const worldRadius = screenRadius / zoom;

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(wx, wy, worldRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// =========================================================================
// SYSTEM FRYZUR I FIZYKI DŁUGICH WŁOSÓW 2D (VERLET / SPRING CHAIN)
// =========================================================================

export function getHairPalette(hexColor = '#18181b') {
  const clean = String(hexColor || '#18181b').replace('#', '');
  const num = parseInt(clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean.padEnd(6, '0'), 16) || 0x18181b;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const rgb = (rr, gg, bb) => `rgb(${clamp(rr)}, ${clamp(gg)}, ${clamp(bb)})`;
  const rgba = (rr, gg, bb, a) => `rgba(${clamp(rr)}, ${clamp(gg)}, ${clamp(bb)}, ${a})`;

  return {
    base: rgb(r, g, b),
    dark: rgb(r * 0.62, g * 0.62, b * 0.62),
    deep: rgb(r * 0.35, g * 0.35, b * 0.35),
    light: rgb(r + (255 - r) * 0.28 + 14, g + (255 - g) * 0.28 + 14, b + (255 - b) * 0.28 + 14),
    highlight: rgba(Math.min(255, r + 75), Math.min(255, g + 75), Math.min(255, b + 75), 0.32),
    fadeStart: rgba(r * 0.65, g * 0.65, b * 0.65, 0.48),
    fadeMid: rgba(r * 0.65, g * 0.65, b * 0.65, 0.18),
    fadeEnd: rgba(r * 0.65, g * 0.65, b * 0.65, 0.0)
  };
}

function updateAndBuildHairChain(p, hairStyle, currentFacingDir, torsoTilt, headPitch, anchorX, anchorY, segLen, phaseShift = 0) {
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const isStaticTile = !!(p && p._isStaticTile);

  if (!p._hairPhys) {
    p._hairPhys = {
      thetas: [2.05, 1.98, 1.90, 1.82],
      omegas: [0, 0, 0, 0],
      lastUpdate: now,
      lastFacing: currentFacingDir || 1,
      lastHeadBob: (p && p.headBob) || 0
    };
  }

  const phys = p._hairPhys;
  const dtRaw = (now - phys.lastUpdate) / 1000;

  // Aktualizacja fizyki raz na klatkę renderowania (gdy upłynęło >= 4ms)
  if (!isStaticTile && dtRaw >= 0.004) {
    const dt = Math.min(0.045, dtRaw);
    phys.lastUpdate = now;

    if (phys.lastFacing !== currentFacingDir) {
      for (let i = 0; i < 4; i++) {
        phys.omegas[i] += 5.5 * (1 + i * 0.25);
      }
      phys.lastFacing = currentFacingDir;
    }

    if (p._hairImpulse) {
      for (let i = 0; i < 4; i++) {
        phys.omegas[i] += p._hairImpulse * (2.8 + i * 0.9);
      }
      p._hairImpulse = 0;
    }

    const dBob = ((p.headBob || 0) - phys.lastHeadBob);
    phys.lastHeadBob = p.headBob || 0;

    const rot = (torsoTilt * currentFacingDir) + headPitch;
    const gx = Math.sin(rot);
    const gy = Math.cos(rot);

    const relVx = (p.vx || 0) * currentFacingDir;
    const relVy = (p.vy || 0) + dBob * 4.0;

    // W podglądzie Kreatora dodajemy delikatny, żywy powiew wiatru, by było widać fizykę długich włosów
    const breezeVx = p._isCreatorPreview
      ? (0.95 + Math.sin(now * 0.0028) * 0.70 + Math.sin(now * 0.0064) * 0.30)
      : (Math.sin(now * 0.0022) * 0.14);
    const breezeVy = p._isCreatorPreview
      ? (Math.cos(now * 0.0035) * 0.22)
      : 0;

    const wx = -(relVx + breezeVx) * 0.35;
    const wy = -(relVy + breezeVy) * 0.28 + (p.isJetpacking ? 1.6 : 0);

    const windLocalX = wx * Math.cos(rot) + wy * Math.sin(rot);
    const windLocalY = -wx * Math.sin(rot) + wy * Math.cos(rot);
    const flowMag = Math.hypot(wx, wy);

    const isHeavy = (hairStyle === 'dreadlocks');
    const stiffness = isHeavy ? 15.0 : 19.5;
    const damping = isHeavy ? 0.82 : 0.85;

    for (let i = 0; i < 4; i++) {
      let rootPushX = -0.32 * (1 - i * 0.18);
      let rootPushY = 0;
      if (i === 0) {
        if (hairStyle === 'topknot') {
          rootPushX = -0.95;
          rootPushY = -0.22;
        } else if (hairStyle === 'ponytail') {
          rootPushX = -0.72;
          rootPushY = 0.05;
        } else {
          rootPushX = -0.45;
          rootPushY = 0.15;
        }
      }

      const waveFreq = p.isJetpacking ? 0.026 : (0.0038 + Math.min(0.016, flowMag * 0.007));
      const flutter = Math.sin(now * waveFreq - i * 0.92) * (0.06 + Math.min(0.28, flowMag * 0.11)) * (0.35 + i * 0.25);

      const fx = gx + windLocalX + rootPushX;
      const fy = gy + windLocalY + rootPushY;

      let targetTheta = Math.atan2(fy, fx) + flutter;
      if (targetTheta < -Math.PI * 0.25) targetTheta += Math.PI * 2;

      if (i > 0) {
        targetTheta = targetTheta * 0.72 + phys.thetas[i - 1] * 0.28;
      }

      const minTheta = (hairStyle === 'topknot' && i === 0) ? Math.PI * 0.58 : Math.PI * 0.49;
      const maxTheta = Math.PI * 1.38;
      targetTheta = Math.max(minTheta, Math.min(maxTheta, targetTheta));

      phys.omegas[i] = (phys.omegas[i] + (targetTheta - phys.thetas[i]) * stiffness * dt) * damping;
      phys.thetas[i] += phys.omegas[i] * dt * 6.5;

      if (phys.thetas[i] < minTheta) {
        phys.thetas[i] = minTheta;
        phys.omegas[i] = Math.max(0, phys.omegas[i] * -0.2);
      } else if (phys.thetas[i] > maxTheta) {
        phys.thetas[i] = maxTheta;
        phys.omegas[i] = Math.min(0, phys.omegas[i] * -0.2);
      }
    }
  }

  const pts = [{ x: anchorX, y: anchorY }];
  const norms = [];
  for (let i = 0; i < 4; i++) {
    const a = phys.thetas[i] + phaseShift * (0.35 + i * 0.22);
    const nx = pts[i].x + Math.cos(a) * segLen;
    const ny = pts[i].y + Math.sin(a) * segLen;
    pts.push({ x: nx, y: ny });
    norms.push({ x: -Math.sin(a), y: Math.cos(a) });
  }
  norms.push(norms[norms.length - 1]);
  return { pts, norms };
}

function drawTaperedHairStrand(ctx, pts, norms, widths, fillStyle, strokeStyle = '#09090b', highlightStyle = null) {
  const leftPts = [];
  const rightPts = [];
  for (let i = 0; i < pts.length; i++) {
    const w = widths[i] ?? 0;
    leftPts.push({
      x: pts[i].x + norms[i].x * w,
      y: pts[i].y + norms[i].y * w
    });
    rightPts.push({
      x: pts[i].x - norms[i].x * w,
      y: pts[i].y - norms[i].y * w
    });
  }

  ctx.beginPath();
  ctx.moveTo(leftPts[0].x, leftPts[0].y);
  for (let i = 1; i < leftPts.length - 1; i++) {
    const xc = (leftPts[i].x + leftPts[i + 1].x) * 0.5;
    const yc = (leftPts[i].y + leftPts[i + 1].y) * 0.5;
    ctx.quadraticCurveTo(leftPts[i].x, leftPts[i].y, xc, yc);
  }
  const lastIdx = leftPts.length - 1;
  ctx.lineTo(pts[lastIdx].x, pts[lastIdx].y);
  for (let i = lastIdx - 1; i >= 1; i--) {
    const xc = (rightPts[i].x + rightPts[i - 1].x) * 0.5;
    const yc = (rightPts[i].y + rightPts[i - 1].y) * 0.5;
    ctx.quadraticCurveTo(rightPts[i].x, rightPts[i].y, xc, yc);
  }
  ctx.lineTo(rightPts[0].x, rightPts[0].y);
  ctx.closePath();

  ctx.fillStyle = fillStyle;
  ctx.fill();
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 0.85;
    ctx.stroke();
  }

  if (highlightStyle) {
    ctx.strokeStyle = highlightStyle;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(pts[0].x + norms[0].x * (widths[0] * 0.35), pts[0].y + norms[0].y * (widths[0] * 0.35));
    ctx.quadraticCurveTo(
      pts[2].x + norms[2].x * (widths[2] * 0.35),
      pts[2].y + norms[2].y * (widths[2] * 0.35),
      pts[3].x,
      pts[3].y
    );
    ctx.stroke();
  }
}

export function drawCharacterHairProfile(ctx, p, v, currentFacingDir, torsoTilt, headPitch, hasHelmet) {
  const rawStyle = String(v.hairStyle || 'buzzcut').toLowerCase();
  const style = (rawStyle === 'shaved' || rawStyle === 'none') ? 'buzzcut' : rawStyle;
  const pal = getHairPalette(v.hairColor || v.hairColor0 || '#18181b');

  // 1. Subtelne cieniowanie wygolonych skroni / potylicy (fade bazowy dla krótkich/podgolonych fryzur)
  if (style === 'buzzcut' || style === 'crewcut' || style === 'mohawk' || style === 'slickback' || style === 'topknot') {
    const buzzGrad = ctx.createLinearGradient(-6.2, -6.5, 2.2, 0.5);
    buzzGrad.addColorStop(0.0, pal.fadeStart);
    buzzGrad.addColorStop(0.6, pal.fadeMid);
    buzzGrad.addColorStop(1.0, pal.fadeEnd);

    ctx.beginPath();
    ctx.moveTo(-6.0, -1.8);
    ctx.quadraticCurveTo(-5.4, -6.8, -1.2, -7.0);
    ctx.quadraticCurveTo(2.4, -6.8, 3.8, -5.0);
    ctx.quadraticCurveTo(1.0, -3.0, -2.5, -1.0);
    ctx.closePath();
    ctx.fillStyle = buzzGrad;
    ctx.fill();
  }

  if (style === 'buzzcut') {
    return;
  }

  const hairGrad = ctx.createLinearGradient(-6.5, -10.5, 4.5, 1.0);
  hairGrad.addColorStop(0.0, pal.dark);
  hairGrad.addColorStop(0.55, pal.base);
  hairGrad.addColorStop(1.0, pal.light);

  // 2. KRÓTKIE FRYZURY NA CZASZCE (ukrywane tylko gdy nałożony jest pełny hełm)
  if (!hasHelmet) {
    if (style === 'crewcut') {
      // Wojskowy jeżyk (Flat Top / High & Tight)
      ctx.beginPath();
      ctx.moveTo(-5.6, -3.6);
      ctx.quadraticCurveTo(-6.1, -6.4, -4.7, -8.3);
      // Płaski, lekko wznoszący się ku przodowi wierzch szczotki
      ctx.lineTo(0.2, -8.8);
      ctx.lineTo(4.7, -8.5);
      // Ostra przednia krawędź jeżyka nad czołem
      ctx.quadraticCurveTo(4.6, -6.6, 4.1, -5.1);
      // Wycięcie skroniowe (high & tight)
      ctx.lineTo(1.8, -5.3);
      ctx.quadraticCurveTo(0.4, -4.4, -1.8, -4.1);
      ctx.quadraticCurveTo(-4.0, -4.0, -5.6, -3.6);
      ctx.closePath();
      ctx.fillStyle = hairGrad;
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      // Tekstura krótkich nastroszonych włosków na koronie
      ctx.strokeStyle = pal.highlight;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      for (let hx = -3.8; hx <= 3.8; hx += 1.25) {
        ctx.moveTo(hx, -6.8);
        ctx.lineTo(hx + 0.3, -8.3);
      }
      ctx.stroke();

    } else if (style === 'mohawk') {
      // Kultowy Irokez (Soldat Mohawk) – 5 ostrych, wygiętych w tył kolców od czoła po kark
      ctx.beginPath();
      ctx.moveTo(-5.7, 1.4);
      // Kolec 5 (dolny na potylicy)
      ctx.quadraticCurveTo(-7.6, 0.8, -8.8, -0.4);
      ctx.quadraticCurveTo(-7.4, -1.3, -6.4, -1.8);
      // Kolec 4 (tylny)
      ctx.quadraticCurveTo(-8.6, -2.8, -9.8, -4.6);
      ctx.quadraticCurveTo(-7.8, -5.1, -6.1, -5.2);
      // Kolec 3 (środkowy szczytowy)
      ctx.quadraticCurveTo(-7.2, -7.8, -7.4, -10.6);
      ctx.quadraticCurveTo(-5.0, -9.2, -3.5, -7.4);
      // Kolec 2 (przednio-górny)
      ctx.quadraticCurveTo(-3.2, -10.2, -1.8, -12.0);
      ctx.quadraticCurveTo(-0.2, -10.2, 0.7, -7.5);
      // Kolec 1 (czołowy)
      ctx.quadraticCurveTo(1.8, -10.0, 4.1, -11.2);
      ctx.quadraticCurveTo(4.3, -8.2, 3.6, -5.6);
      // Podstawa irokeza wzdłuż czaszki
      ctx.quadraticCurveTo(0.8, -6.4, -2.2, -5.8);
      ctx.quadraticCurveTo(-4.6, -4.0, -4.8, -0.8);
      ctx.lineTo(-5.7, 1.4);
      ctx.closePath();
      ctx.fillStyle = hairGrad;
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      // Wewnętrzne rozjaśnienia pasm irokeza
      ctx.strokeStyle = pal.highlight;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(2.4, -6.4);
      ctx.lineTo(3.4, -10.0);
      ctx.moveTo(-0.8, -7.0);
      ctx.lineTo(-1.5, -10.8);
      ctx.moveTo(-4.4, -6.2);
      ctx.lineTo(-6.6, -9.5);
      ctx.stroke();

    } else if (style === 'slickback') {
      // Zaczes do tyłu / Undercut z warstwowymi końcówkami z tyłu głowy
      ctx.beginPath();
      ctx.moveTo(4.0, -5.2);
      // Uniesiony przód (pompadour / slick back)
      ctx.quadraticCurveTo(5.0, -7.2, 3.6, -8.5);
      ctx.bezierCurveTo(0.8, -9.5, -3.5, -9.2, -7.8, -5.6);
      // Trzy zaczesane w tył ostre pasma na potylicy
      ctx.lineTo(-6.0, -4.7);
      ctx.lineTo(-7.9, -3.5);
      ctx.lineTo(-5.8, -2.8);
      ctx.lineTo(-7.2, -1.5);
      // Linia podcięcia nad uchem i skronią
      ctx.quadraticCurveTo(-4.4, -1.8, -2.2, -3.2);
      ctx.quadraticCurveTo(0.6, -3.8, 1.8, -5.1);
      ctx.closePath();
      ctx.fillStyle = hairGrad;
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      // Linie zaczesania włosów (grzebień / pasma)
      ctx.strokeStyle = pal.highlight;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(3.4, -7.0);
      ctx.quadraticCurveTo(-0.5, -8.2, -5.8, -5.2);
      ctx.moveTo(2.2, -5.8);
      ctx.quadraticCurveTo(-1.2, -6.6, -5.5, -3.6);
      ctx.stroke();

    } else if (style === 'messy') {
      // Krótkie potargane / Spiky Crop
      ctx.beginPath();
      ctx.moveTo(-5.2, 2.2);
      ctx.lineTo(-6.8, 1.2);
      ctx.lineTo(-5.9, 0.2);
      ctx.lineTo(-7.4, -1.4);
      ctx.lineTo(-6.2, -2.6);
      ctx.lineTo(-7.6, -4.8);
      ctx.lineTo(-5.8, -5.8);
      ctx.lineTo(-6.2, -8.2);
      ctx.lineTo(-4.0, -7.8);
      ctx.lineTo(-3.2, -9.7);
      ctx.lineTo(-1.1, -8.3);
      ctx.lineTo(0.6, -9.8);
      ctx.lineTo(2.1, -8.1);
      ctx.lineTo(4.2, -9.0);
      ctx.lineTo(3.8, -7.0);
      // Kosmyki grzywki nad czołem
      ctx.lineTo(5.4, -5.8);
      ctx.lineTo(4.1, -5.1);
      ctx.lineTo(5.0, -4.1);
      ctx.quadraticCurveTo(2.8, -4.5, 1.4, -3.8);
      // Wokół ucha do karku
      ctx.quadraticCurveTo(-1.2, -3.2, -3.4, -1.6);
      ctx.quadraticCurveTo(-4.6, 0.4, -5.2, 2.2);
      ctx.closePath();
      ctx.fillStyle = hairGrad;
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      // Wewnętrzne linie potarganych kosmyków
      ctx.strokeStyle = pal.highlight;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(-2.8, -8.4);
      ctx.lineTo(-1.2, -5.8);
      ctx.moveTo(0.4, -8.8);
      ctx.lineTo(1.5, -5.6);
      ctx.moveTo(-5.5, -4.4);
      ctx.lineTo(-3.4, -3.2);
      ctx.stroke();
    }
  }

  // 3. DŁUGIE WŁOSY Z FIZYKĄ RUCHU 2D (działają zarówno bez hełmu, jak i wystając spod hełmu)
  if (style === 'ponytail') {
    if (!hasHelmet) {
      // Ciasno ściągnięte do tyłu włosy na czaszce
      ctx.beginPath();
      ctx.moveTo(-4.8, 1.8);
      ctx.quadraticCurveTo(-6.3, -0.5, -6.2, -3.2);
      ctx.quadraticCurveTo(-5.6, -7.6, -1.0, -7.7);
      ctx.quadraticCurveTo(2.8, -7.4, 4.1, -5.3);
      ctx.quadraticCurveTo(1.8, -5.1, 0.2, -3.8);
      ctx.quadraticCurveTo(-1.6, -3.0, -3.6, -1.4);
      ctx.quadraticCurveTo(-4.4, 0.2, -4.8, 1.8);
      ctx.closePath();
      ctx.fillStyle = hairGrad;
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      // Linie napięcia pasm ściągniętych do gumki
      ctx.strokeStyle = pal.highlight;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(2.6, -6.2);
      ctx.quadraticCurveTo(-1.5, -6.4, -5.8, -3.2);
      ctx.moveTo(0.8, -4.6);
      ctx.quadraticCurveTo(-2.5, -4.4, -5.8, -2.6);
      ctx.stroke();
    }

    // Fizyczny łańcuch końskiego ogona (4 segmenty)
    const { pts, norms } = updateAndBuildHairChain(
      p, 'ponytail', currentFacingDir, torsoTilt, headPitch,
      -6.0, -2.6, 3.6, 0
    );

    // Dolne cieńsze pasmo dla głębi
    const subChain = updateAndBuildHairChain(
      p, 'ponytail', currentFacingDir, torsoTilt, headPitch,
      -5.9, -2.2, 3.3, -0.14
    );
    drawTaperedHairStrand(ctx, subChain.pts, subChain.norms, [1.1, 1.4, 1.2, 0.7, 0.0], pal.dark, '#09090b', null);

    // Główny falujący koński ogon
    drawTaperedHairStrand(ctx, pts, norms, [1.6, 2.3, 2.0, 1.2, 0.0], hairGrad, '#09090b', pal.highlight);

    // Gumka / opaska taktyczna spinająca kucyk
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.ellipse(-5.9, -2.6, 1.1, 1.7, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

  } else if (style === 'long_flowing') {
    if (!hasHelmet) {
      // Pełna czupryna długich włosów na górze głowy i skroniach (styl Rambo)
      ctx.beginPath();
      ctx.moveTo(-5.2, 2.4);
      ctx.quadraticCurveTo(-6.8, -0.6, -6.5, -3.8);
      ctx.quadraticCurveTo(-5.8, -8.2, -1.0, -8.4);
      ctx.quadraticCurveTo(3.2, -8.1, 4.5, -5.6);
      ctx.lineTo(4.9, -4.3);
      ctx.quadraticCurveTo(2.6, -4.8, 0.8, -3.6);
      ctx.quadraticCurveTo(-1.5, -2.8, -3.6, -1.0);
      ctx.lineTo(-5.2, 2.4);
      ctx.closePath();
      ctx.fillStyle = hairGrad;
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }

    // 3 warstwowe, niezależnie falujące pasma długich rozpuszczonych włosów opadające na kark i plecy
    const backStrand = updateAndBuildHairChain(
      p, 'long_flowing', currentFacingDir, torsoTilt, headPitch,
      -5.8, -3.6, 3.8, 0.16
    );
    const midStrand = updateAndBuildHairChain(
      p, 'long_flowing', currentFacingDir, torsoTilt, headPitch,
      -5.2, -1.6, 3.9, 0.0
    );
    const lowStrand = updateAndBuildHairChain(
      p, 'long_flowing', currentFacingDir, torsoTilt, headPitch,
      -4.5, 0.4, 3.5, -0.14
    );

    drawTaperedHairStrand(ctx, backStrand.pts, backStrand.norms, [2.0, 2.4, 2.1, 1.3, 0.0], pal.dark, '#09090b', null);
    drawTaperedHairStrand(ctx, lowStrand.pts, lowStrand.norms, [1.8, 2.1, 1.8, 1.0, 0.0], pal.base, '#09090b', null);
    drawTaperedHairStrand(ctx, midStrand.pts, midStrand.norms, [2.2, 2.6, 2.2, 1.3, 0.0], hairGrad, '#09090b', pal.highlight);

  } else if (style === 'dreadlocks') {
    if (!hasHelmet) {
      // Sekcje zaplecionych u nasady dredów na czaszce
      ctx.beginPath();
      ctx.moveTo(-5.4, 1.4);
      ctx.quadraticCurveTo(-6.6, -1.5, -6.2, -4.4);
      ctx.quadraticCurveTo(-5.4, -8.0, -1.0, -8.1);
      ctx.quadraticCurveTo(2.8, -7.8, 4.1, -5.4);
      ctx.quadraticCurveTo(1.5, -4.8, -0.5, -3.6);
      ctx.quadraticCurveTo(-2.8, -2.6, -4.2, -0.2);
      ctx.closePath();
      ctx.fillStyle = hairGrad;
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      // Linie podziału warkoczyków przy skórze głowy
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(3.2, -6.4);
      ctx.quadraticCurveTo(-1.0, -6.8, -5.6, -4.4);
      ctx.moveTo(1.8, -5.2);
      ctx.quadraticCurveTo(-2.0, -5.2, -5.8, -2.4);
      ctx.stroke();
    }

    // 4 grube dredy bojowe z fizyką i metalowymi obrączkami
    const anchors = [
      { x: -5.4, y: -4.8, len: 3.6, phase: 0.22, col: pal.dark },
      { x: -5.9, y: -3.0, len: 3.8, phase: 0.08, col: pal.base },
      { x: -5.8, y: -1.2, len: 3.7, phase: -0.06, col: hairGrad },
      { x: -5.0, y: 0.6, len: 3.4, phase: -0.18, col: pal.dark }
    ];

    for (let d = 0; d < anchors.length; d++) {
      const cfg = anchors[d];
      const { pts } = updateAndBuildHairChain(
        p, 'dreadlocks', currentFacingDir, torsoTilt, headPitch,
        cfg.x, cfg.y, cfg.len, cfg.phase
      );

      // Obrys pojedynczego grubego dreda
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.quadraticCurveTo(pts[1].x, pts[1].y, pts[2].x, pts[2].y);
      ctx.quadraticCurveTo(pts[3].x, pts[3].y, pts[4].x, pts[4].y);
      ctx.stroke();

      // Wypełnienie dreda
      ctx.strokeStyle = cfg.col;
      ctx.lineWidth = 1.9;
      ctx.stroke();

      // Metalowa obrączka / koralik taktyczny na dredzie (przy 3. węźle)
      ctx.fillStyle = '#94a3b8';
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(pts[3].x, pts[3].y, 1.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

  } else if (style === 'topknot') {
    if (!hasHelmet) {
      // Wygolone boki z pasmem włosów ściągniętym na sam czubek potylicy
      ctx.beginPath();
      ctx.moveTo(-5.2, -4.8);
      ctx.quadraticCurveTo(-5.4, -7.6, -1.2, -7.8);
      ctx.quadraticCurveTo(2.6, -7.5, 4.0, -5.4);
      ctx.quadraticCurveTo(1.5, -5.2, -1.0, -4.6);
      ctx.quadraticCurveTo(-3.4, -4.4, -5.2, -4.8);
      ctx.closePath();
      ctx.fillStyle = hairGrad;
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }

    // Sprężysta kitka wojownika na czubku potylicy
    const { pts, norms } = updateAndBuildHairChain(
      p, 'topknot', currentFacingDir, torsoTilt, headPitch,
      -4.8, -6.6, 3.1, 0.15
    );

    drawTaperedHairStrand(ctx, pts, norms, [1.5, 2.2, 1.9, 1.1, 0.0], hairGrad, '#09090b', pal.highlight);

    // Owijka / węzeł u podstawy kitki
    ctx.fillStyle = '#09090b';
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.ellipse(-4.6, -6.4, 1.3, 1.6, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

export function drawCharacterHairOverEarProfile(ctx, v, pal, hasHelmet) {
  if (hasHelmet) return;
  const style = String(v.hairStyle || 'buzzcut').toLowerCase();

  if (style === 'messy') {
    // Krótki pejs / kosmyk przed uchem
    ctx.fillStyle = pal.base;
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(-1.8, -3.6);
    ctx.lineTo(-0.4, -0.2);
    ctx.lineTo(-1.5, -0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === 'long_flowing') {
    // Dłuższe pasmo skroniowe opadające przed uchem
    ctx.fillStyle = pal.base;
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0.8, -4.2);
    ctx.quadraticCurveTo(-0.6, -1.5, -0.9, 2.4);
    ctx.quadraticCurveTo(-1.8, 0.4, -1.5, -2.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

export function drawCharacterHairFrontOrBack(ctx, v, isBackView, hasHelmet) {
  const rawStyle = String(v.hairStyle || 'buzzcut').toLowerCase();
  const style = (rawStyle === 'shaved' || rawStyle === 'none') ? 'buzzcut' : rawStyle;
  const pal = getHairPalette(v.hairColor || v.hairColor0 || '#18181b');

  const buzzGrad = ctx.createLinearGradient(0, -8.0, 0, 1.0);
  buzzGrad.addColorStop(0.0, pal.fadeStart);
  buzzGrad.addColorStop(0.7, pal.fadeMid);
  buzzGrad.addColorStop(1.0, pal.fadeEnd);

  if (isBackView) {
    ctx.beginPath();
    ctx.ellipse(0, -2.5, 4.7, 4.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = buzzGrad;
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, -2.5, 4.8, Math.PI * 0.85, Math.PI * 0.15, true);
    ctx.closePath();
    ctx.fillStyle = buzzGrad;
    ctx.fill();
  }

  if (hasHelmet || style === 'buzzcut') return;

  ctx.fillStyle = pal.base;
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.9;

  if (style === 'mohawk') {
    ctx.beginPath();
    ctx.moveTo(-1.6, -5.5);
    ctx.lineTo(0, -11.5);
    ctx.lineTo(1.6, -5.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === 'crewcut') {
    ctx.beginPath();
    ctx.moveTo(-4.6, -4.5);
    ctx.lineTo(-4.8, -8.2);
    ctx.lineTo(4.8, -8.2);
    ctx.lineTo(4.6, -4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, -2.8, 5.2, Math.PI * 0.92, Math.PI * 0.08, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/**
 * Renderuje samą głowę z wybraną fryzurą i kolorem włosów na kafelku wyboru w Kreatorze Postaci.
 */
export function drawHeadHairPreview(ctx, canvasW, canvasH, hairStyle = 'buzzcut', hairColor = '#18181b') {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvasW, canvasH);

  const v = {
    ...DEFAULT_VISUALS,
    hairStyle,
    hairColor
  };
  const hairPal = getHairPalette(hairColor);

  // Statyczny obiekt podglądu z naturalnie ułożonym łańcuchem fizyki dla kafelka
  const tileDummy = {
    _isStaticTile: true,
    _hairPhys: {
      thetas: [2.16, 2.04, 1.92, 1.80],
      omegas: [0, 0, 0, 0],
      lastUpdate: 0,
      lastFacing: 1,
      lastHeadBob: 0
    }
  };

  ctx.save();
  // Wyśrodkowanie głowy wraz z miejscem na wysokiego irokeza u góry oraz długie włosy z tyłu/dołu
  ctx.translate(canvasW * 0.58, canvasH * 0.50);
  const scale = Math.min(canvasW, canvasH) / 29.0;
  ctx.scale(scale, scale);

  // 1. Krótki odcinek szyi pod głową (by długie włosy naturalnie układały się za karkiem)
  const neckGrad = ctx.createLinearGradient(-3.2, 0, 2.0, 0);
  neckGrad.addColorStop(0.0, v.skinDark);
  neckGrad.addColorStop(0.5, v.skinBack);
  neckGrad.addColorStop(1.0, v.skinMid);

  ctx.beginPath();
  ctx.moveTo(-3.0, 2.2);
  ctx.lineTo(-3.2, 7.6);
  ctx.quadraticCurveTo(-0.5, 8.4, 2.0, 7.6);
  ctx.lineTo(1.8, 3.2);
  ctx.closePath();
  ctx.fillStyle = neckGrad;
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // Cień pod żuchwą
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.moveTo(-0.8, 3.2);
  ctx.lineTo(1.8, 3.8);
  ctx.lineTo(1.7, 5.4);
  ctx.lineTo(-0.8, 4.4);
  ctx.closePath();
  ctx.fill();

  // 2. Czaszka i profil twarzy
  const faceGrad = ctx.createLinearGradient(-5.0, 0, 7.0, 0);
  faceGrad.addColorStop(0.0, v.skinBack);
  faceGrad.addColorStop(0.5, v.skinMid);
  faceGrad.addColorStop(1.0, v.skinLight);

  ctx.beginPath();
  ctx.moveTo(-4.6, 2.5);
  ctx.quadraticCurveTo(-6.4, 0.2, -6.0, -2.8);
  ctx.quadraticCurveTo(-5.4, -7.2, -1.2, -7.2);
  ctx.quadraticCurveTo(2.8, -7.0, 4.2, -5.2);
  ctx.lineTo(4.4, -3.4);
  ctx.lineTo(6.8, -1.0);
  ctx.lineTo(5.1, -0.4);
  ctx.lineTo(5.5, 0.6);
  ctx.lineTo(4.9, 1.4);
  ctx.lineTo(5.3, 2.3);
  ctx.lineTo(4.3, 4.8);
  ctx.lineTo(0.2, 4.4);
  ctx.lineTo(-3.5, 3.8);
  ctx.closePath();
  ctx.fillStyle = faceGrad;
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // 3. Fryzura (warstwa główna i długie pasma)
  drawCharacterHairProfile(ctx, tileDummy, v, 1, 0, 0, false);

  // 4. Ucho
  ctx.fillStyle = v.skinBack;
  ctx.beginPath();
  ctx.ellipse(-2.6, -0.6, 1.6, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = v.skinDark;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(-2.5, -0.6, 1.1, 0.4 * Math.PI, 1.7 * Math.PI, false);
  ctx.stroke();

  // 5. Kosmyki przed uchem
  drawCharacterHairOverEarProfile(ctx, v, hairPal, false);

  // 6. Oko i brew
  const eyeCenterX = 2.7;
  const eyeCenterY = -2.1;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(eyeCenterX, eyeCenterY, 1.5, 1.0, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(eyeCenterX + 0.55, eyeCenterY, 0.72, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(eyeCenterX + 0.52, eyeCenterY - 0.25, 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hairPal.dark;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(1.4, -3.3);
  ctx.lineTo(4.4, -3.5);
  ctx.stroke();

  ctx.restore();
}



