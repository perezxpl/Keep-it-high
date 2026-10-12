// =========================================================================
// PLAYER/LIMBS.JS - KOŃCZYNY 2.5D IK, DŁONIE, KIKUTY, RANY I JETPACK
// Wydzielony moduł z js/player/renderer.js
// =========================================================================

import { CONFIG } from '../config.js';
import { solve2BoneIK, getArmAnglesForTarget, lerp, lerpAngle } from './ik.js';
import { DEFAULT_VISUALS } from './hair.js';
import { isLongSleeve, getCamoType, drawCamoSplotches, getTorsoPalette } from './torso.js';
import { isPantsShorts, getPantsCamoType, getPantsPalette } from './pants.js';
import { drawBootCollarOverPants, drawFootwear } from './shoes.js';
import { getJetpackFlamePalette } from './jetpack.js';

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
export function drawBulletPuncture(ctx, x, y, radius, alpha) {
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
export function drawShrapnelSlash(ctx, x1, y1, x2, y2, width, alpha) {
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
export function drawBloodTrickle(ctx, startX, startY, len, curveX, width, alpha) {
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
export function drawBloodSoak(ctx, cx, cy, rx, ry, alpha) {
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
export function drawBloodSpecks(ctx, specks, alpha) {
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
export function drawTorsoWounds(ctx, dmgRatio, absCos, absSin, cosYaw, plateW, waistHalfW, shoulderHalfW, isLookingAway) {
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
export function drawHeadWoundsProfile(ctx, dmgRatio) {
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
export function drawHeadWoundsFront(ctx, dmgRatio) {
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
export function drawHeadWoundsAway(ctx, dmgRatio) {
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

  const isLong = isLongSleeve(v.torsoStyle);
  const camoType = getCamoType(v.torsoStyle);
  const pal = getTorsoPalette(v.torsoColor || upperCol || v.armColorFront);

  const sleeveLen = v.sleeveless ? 0 : (isLong ? upperLen * 1.04 : (upperLen * 0.58 * (v.sleeveLengthMult ?? 1.0)));
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
    sleeveGrad.addColorStop(0.0, pal.light);
    sleeveGrad.addColorStop(0.45, pal.base);
    sleeveGrad.addColorStop(1.0, pal.dark);

    // Organiczny obrys rękawa z gładką główką barku i lekko podwiniętym mankietem
    const traceSleeve = () => {
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
    };

    traceSleeve();

    if (camoType) {
      ctx.save();
      ctx.clip();
      drawCamoSplotches(ctx, camoType, -1, -sleeveHalfH * 1.05, sleeveLen, sleeveHalfH * 1.05);
      ctx.restore();
      // Przywracamy obrys rękawa, aby stroke nie obrysował plam ani kropek
      traceSleeve();
    } else {
      ctx.fillStyle = sleeveGrad;
      ctx.fill();
    }

    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.85;
    ctx.stroke();

    // Podwinięty brzeg rękawa (mankiet z tkaniny zamiast prostego białego paska)
    if (!isLong) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.38)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(sleeveLen - 1.5, -sleeveHalfH * 0.92);
      ctx.quadraticCurveTo(sleeveLen - 0.7, 0, sleeveLen - 1.7, sleeveHalfH * 0.94);
      ctx.stroke();
    }

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

  if (!isLong) {
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
  }

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

  if (isLong) {
    // 1. Łokieć w bluzie bojowej
    const elbowCol = camoType ? (camoType === 'light' ? '#7a8c6a' : '#2f3b2f') : pal.dark;
    ctx.beginPath();
    ctx.arc(0, 0, elbowR * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = elbowCol;
    ctx.fill();

    // 2. Długi rękaw przedramienia z mankietem
    const traceForeSleeve = () => {
      ctx.beginPath();
      ctx.moveTo(0, -elbowR);
      ctx.lineTo(foreLen * 0.82, -wristR * 1.05);
      ctx.lineTo(foreLen * 0.82, wristR * 1.05);
      ctx.lineTo(0, elbowR);
      ctx.closePath();
    };

    traceForeSleeve();

    if (camoType) {
      ctx.save();
      ctx.clip();
      drawCamoSplotches(ctx, camoType, 0, -elbowR * 1.02, foreLen * 0.82, elbowR * 1.02);
      ctx.restore();
      // Przywracamy obrys przedramienia, aby stroke nie obrysował plam ani kropek
      traceForeSleeve();
    } else {
      const foreSleeveGrad = ctx.createLinearGradient(0, -elbowR, 0, elbowR);
      foreSleeveGrad.addColorStop(0.0, pal.light);
      foreSleeveGrad.addColorStop(0.5, pal.base);
      foreSleeveGrad.addColorStop(1.0, pal.dark);
      ctx.fillStyle = foreSleeveGrad;
      ctx.fill();
    }
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.85;
    ctx.stroke();

    // 3. Wzmocniona łata ochronna na łokciu (Tactical Elbow Pad)
    const patchCol = camoType === 'light' ? '#42372d' : (camoType === 'dark' ? '#090c09' : pal.dark);
    ctx.fillStyle = patchCol;
    ctx.beginPath();
    ctx.ellipse(foreLen * 0.16, 0, elbowR * 0.75, elbowR * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.65;
    ctx.stroke();

    // Szew mankietu nad rękawicą
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(foreLen * 0.76, -wristR * 1.02);
    ctx.lineTo(foreLen * 0.76, wristR * 1.02);
    ctx.stroke();

  } else {
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
  }

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
  const pantsStyle = v.pantsStyle || 'cargo_long';
  const pantsColor = v.pantsColor || (isFrontLeg ? v.legThighFront : v.legThighBack) || '#18181b';
  const pantsCamo = getPantsCamoType(pantsStyle);
  const pantsPal = getPantsPalette(pantsColor);
  const isShorts = isPantsShorts(pantsStyle);
  const shoesStyle = v.shoesStyle || 'combat_boots';
  const shoesColor = v.shoesColor || colorBoot || v.bootColor || '#18181b';

  if (isShorts) {
    // 1. KRÓTKIE SPODENKI BOJÓWKI (LUŹNE, SZEROKIE NOGAWKI CARGO – SIĘGAJĄCE PRAWIE DO KOLAN)
    const shortsEnd = l1 * 0.90; // Spodenki wydłużone prawie do kolan
    const shortsCuffHalfW = thighHalfH * 1.15; // Szeroki, luźny mankiet cargo

    // A. Odsłonięta dolna część uda tuż nad kolanem (Distal Thigh Skin)
    const skinGrad = ctx.createLinearGradient(0, -3.2 * muscle, 0, 3.2 * muscle);
    if (isFrontLeg) {
      skinGrad.addColorStop(0.0, v.skinLight);
      skinGrad.addColorStop(0.42, v.skinMid);
      skinGrad.addColorStop(1.0, v.skinDark);
    } else {
      skinGrad.addColorStop(0.0, v.skinMid);
      skinGrad.addColorStop(0.45, v.skinBack);
      skinGrad.addColorStop(1.0, v.skinDark);
    }

    ctx.beginPath();
    ctx.moveTo(shortsEnd - 2.5, -2.8 * muscle);
    ctx.lineTo(l1, -2.6 * muscle);
    ctx.lineTo(l1, 2.4 * muscle);
    ctx.lineTo(shortsEnd - 2.5, 2.6 * muscle);
    ctx.closePath();
    ctx.fillStyle = skinGrad;
    ctx.fill();

    // Naturalny obrys przejścia w kolano
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(shortsEnd - 0.5, -2.8 * muscle);
    ctx.lineTo(l1, -2.6 * muscle);
    ctx.moveTo(l1, 2.4 * muscle);
    ctx.lineTo(shortsEnd - 0.5, 2.6 * muscle);
    ctx.stroke();

    // B. Cień wewnątrz szerokiej nogawki (Inner cuff shadow)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(shortsEnd, 0, 1.6, shortsCuffHalfW, 0, 0, Math.PI * 2);
    ctx.fill();

    // C. Szeroka nogawka spodenek cargo sięgająca prawie do kolana
    const traceShorts = () => {
      ctx.beginPath();
      ctx.moveTo(0, thighHalfH);
      ctx.quadraticCurveTo(-thighHalfH * 0.42, 0, 0, -thighHalfH);
      // Górna/przednia krawędź – swobodnie opadający luźny materiał
      ctx.bezierCurveTo(
        l1 * 0.28, -thighHalfH * 1.06,
        l1 * 0.65, -shortsCuffHalfW * 1.02,
        shortsEnd, -shortsCuffHalfW
      );
      // Mankiet nogawki
      ctx.lineTo(shortsEnd, shortsCuffHalfW);
      // Dolna/tylna krawędź
      ctx.bezierCurveTo(
        l1 * 0.65, shortsCuffHalfW * 1.02,
        l1 * 0.28, thighHalfH * 1.04,
        0, thighHalfH
      );
      ctx.closePath();
    };

    traceShorts();

    if (pantsCamo) {
      ctx.save();
      ctx.clip();
      drawCamoSplotches(ctx, pantsCamo, 0, -shortsCuffHalfW * 1.05, shortsEnd, shortsCuffHalfW * 1.05);
      ctx.restore();
      traceShorts();
    } else {
      const pantsGrad = ctx.createLinearGradient(0, -shortsCuffHalfW, 0, shortsCuffHalfW);
      pantsGrad.addColorStop(0.0, pantsPal.light);
      pantsGrad.addColorStop(0.4, pantsPal.base);
      pantsGrad.addColorStop(1.0, pantsPal.dark);
      ctx.fillStyle = pantsGrad;
      ctx.fill();
    }

    // Obrys zewnętrzny luźnej nogawki
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(3.2, -thighHalfH * 1.01);
    ctx.bezierCurveTo(
      l1 * 0.28, -thighHalfH * 1.06,
      l1 * 0.65, -shortsCuffHalfW * 1.02,
      shortsEnd, -shortsCuffHalfW
    );
    ctx.lineTo(shortsEnd, shortsCuffHalfW);
    ctx.bezierCurveTo(
      l1 * 0.65, shortsCuffHalfW * 1.02,
      l1 * 0.28, thighHalfH * 1.04,
      3.4, thighHalfH * 0.96
    );
    ctx.stroke();

    // Szerokie podwinięcie mankietu z podwójnym szwem taktycznym (Double-needle Hem)
    const hemX = shortsEnd - 2.4;
    ctx.fillStyle = isFrontLeg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.16)';
    ctx.fillRect(hemX, -shortsCuffHalfW + 0.3, 2.4, shortsCuffHalfW * 2 - 0.6);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(hemX, -shortsCuffHalfW + 0.3);
    ctx.lineTo(hemX, shortsCuffHalfW - 0.3);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(hemX + 1.2, -shortsCuffHalfW + 0.6);
    ctx.lineTo(hemX + 1.2, shortsCuffHalfW - 0.6);
    ctx.stroke();

    // Fałdy materiału
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.24)';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(l1 * 0.14, -thighHalfH * 0.52);
    ctx.quadraticCurveTo(l1 * 0.22, -thighHalfH * 0.08, l1 * 0.18, thighHalfH * 0.42);
    ctx.moveTo(l1 * 0.45, shortsCuffHalfW * 0.50);
    ctx.quadraticCurveTo(l1 * 0.55, shortsCuffHalfW * 0.18, shortsEnd - 3.2, shortsCuffHalfW * 0.35);
    ctx.stroke();

    // Boczna kieszeń cargo na spodenkach (dokładnie jak na kafelkach wyboru)
    const pocketX = l1 * 0.22;
    const pocketW = l1 * 0.46;
    const pocketH = thighHalfH * 0.78;

    // Korpus kieszeni cargo
    ctx.fillStyle = pantsCamo ? 'rgba(0, 0, 0, 0.22)' : (isFrontLeg ? pantsPal.base : pantsPal.dark);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(pocketX, -pocketH, pocketW, pocketH * 1.9, 0.8);
    else ctx.rect(pocketX, -pocketH, pocketW, pocketH * 1.9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 0.75;
    ctx.stroke();

    // Patka kieszeni cargo
    ctx.fillStyle = pantsCamo ? 'rgba(0, 0, 0, 0.32)' : (isFrontLeg ? pantsPal.dark : '#09090b');
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(pocketX - 0.4, -pocketH - 1.2, pocketW + 0.8, 2.4, 0.6);
    else ctx.rect(pocketX - 0.4, -pocketH - 1.2, pocketW + 0.8, 2.4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.lineWidth = 0.75;
    ctx.stroke();

  } else {
    // 2. DŁUGIE BOJÓWKI CARGO (cargo_long, camo_light_long, camo_dark_long)
    const traceThigh = () => {
      ctx.beginPath();
      ctx.moveTo(0, thighHalfH);
      ctx.quadraticCurveTo(-thighHalfH * 0.42, 0, 0, -thighHalfH);
      // Górny/przedni profil uda
      ctx.bezierCurveTo(
        l1 * 0.32, -thighHalfH * 1.06,
        l1 * 0.68, -thighHalfH * 1.00,
        l1 - 2.2, -thighHalfH * 0.82
      );
      // Łagodne ergonomiczne przejście w kolano z miejscem na staw
      ctx.quadraticCurveTo(l1 - 0.6, -thighHalfH * 0.65, l1, -3.2 * muscle);
      ctx.lineTo(l1, 3.0 * muscle);
      // Dolny/tylny profil uda
      ctx.quadraticCurveTo(l1 - 1.0, thighHalfH * 0.75, l1 - 2.8, thighHalfH * 0.90);
      ctx.bezierCurveTo(
        l1 * 0.65, thighHalfH * 1.04,
        l1 * 0.28, thighHalfH * 0.96,
        0, thighHalfH
      );
      ctx.closePath();
    };

    traceThigh();

    if (pantsCamo) {
      ctx.save();
      ctx.clip();
      drawCamoSplotches(ctx, pantsCamo, 0, -thighHalfH * 1.05, l1, thighHalfH * 1.05);
      ctx.restore();
      traceThigh();
    } else {
      const pantsGrad = ctx.createLinearGradient(0, -thighHalfH, 0, thighHalfH);
      pantsGrad.addColorStop(0.0, pantsPal.light);
      pantsGrad.addColorStop(0.4, pantsPal.base);
      pantsGrad.addColorStop(1.0, pantsPal.dark);
      ctx.fillStyle = pantsGrad;
      ctx.fill();
    }

    // Obrys zewnętrzny nogawki
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(3.2, -thighHalfH * 1.01);
    ctx.bezierCurveTo(
      l1 * 0.42, -thighHalfH * 1.06,
      l1 * 0.70, -thighHalfH * 1.00,
      l1 - 2.2, -thighHalfH * 0.82
    );
    ctx.quadraticCurveTo(l1 - 0.6, -thighHalfH * 0.65, l1, -3.2 * muscle);
    ctx.moveTo(l1, 3.0 * muscle);
    ctx.quadraticCurveTo(l1 - 1.0, thighHalfH * 0.75, l1 - 2.8, thighHalfH * 0.90);
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

    // Boczna kieszeń miechowa Cargo (dokładnie jak na kafelkach wyboru)
    const pocketX = l1 * 0.24;
    const pocketW = l1 * 0.48;
    const pocketH = thighHalfH * 0.80;

    // Korpus kieszeni cargo
    ctx.fillStyle = pantsCamo ? 'rgba(0, 0, 0, 0.22)' : (isFrontLeg ? pantsPal.base : pantsPal.dark);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(pocketX, -pocketH, pocketW, pocketH * 1.9, 0.8);
    else ctx.rect(pocketX, -pocketH, pocketW, pocketH * 1.9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 0.75;
    ctx.stroke();

    // Patka kieszeni cargo
    ctx.fillStyle = pantsCamo ? 'rgba(0, 0, 0, 0.32)' : (isFrontLeg ? pantsPal.dark : '#09090b');
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(pocketX - 0.4, -pocketH - 1.2, pocketW + 0.8, 2.4, 0.6);
    else ctx.rect(pocketX - 0.4, -pocketH - 1.2, pocketW + 0.8, 2.4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.lineWidth = 0.75;
    ctx.stroke();
  }

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

  if (isShorts) {
    // 1. KRÓTKIE SPODENKI: Naturalny staw kolanowy i wysportowana łydka (estetyka tożsama z łokciem)
    const kneeR = 2.8 * muscle;

    // A. Gładka główka stawu kolanowego (w dokładnie takiej samej technice jak łokieć ręki)
    const jointGrad = ctx.createLinearGradient(0, -kneeR, 0, kneeR);
    if (isFrontLeg) {
      jointGrad.addColorStop(0.0, v.skinLight);
      jointGrad.addColorStop(0.45, v.skinMid);
      jointGrad.addColorStop(1.0, v.skinDark);
    } else {
      jointGrad.addColorStop(0.0, v.skinMid);
      jointGrad.addColorStop(0.45, v.skinBack);
      jointGrad.addColorStop(1.0, v.skinDark);
    }

    ctx.beginPath();
    ctx.arc(0, 0, kneeR * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = jointGrad;
    ctx.fill();

    // B. Płynny profil kości piszczelowej i brzuśca łydki
    const calfGrad = ctx.createLinearGradient(0, -calfBulge, 0, calfBulge);
    if (isFrontLeg) {
      calfGrad.addColorStop(0.0, v.skinLight);
      calfGrad.addColorStop(0.40, v.skinMid);
      calfGrad.addColorStop(1.0, v.skinDark);
    } else {
      calfGrad.addColorStop(0.0, v.skinMid);
      calfGrad.addColorStop(0.45, v.skinBack);
      calfGrad.addColorStop(1.0, v.skinDark);
    }

    ctx.beginPath();
    ctx.moveTo(0, -kneeR * 0.85);
    // Przednia krawędź kości piszczelowej schodząca czysto do buta
    ctx.quadraticCurveTo(l2 * 0.35, -kneeR * 0.90, l2 - 3.2, -achillesHalfW);
    ctx.lineTo(l2 - 3.2, achillesHalfW);
    // Ścięgno Achillesa i brzusiec mięśnia łydki (gastrocnemius)
    ctx.quadraticCurveTo(l2 * 0.65, achillesHalfW * 1.15, l2 * 0.35, calfBulge * 1.05);
    ctx.quadraticCurveTo(l2 * 0.12, calfBulge * 0.85, 0, kneeR * 0.85);
    ctx.closePath();

    ctx.fillStyle = calfGrad;
    ctx.fill();

    // Naturalny obrys boczny nogi (TYLKO przednia i tylna krawędź – ZERO czarnej kreski w poprzek kolana!)
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    // Przednia krawędź piszczeli (od kolana do buta)
    ctx.moveTo(0, -kneeR * 0.85);
    ctx.quadraticCurveTo(l2 * 0.35, -kneeR * 0.90, l2 - 3.2, -achillesHalfW);
    // Tylna krawędź łydki (od buta do kolana)
    ctx.moveTo(l2 - 3.2, achillesHalfW);
    ctx.quadraticCurveTo(l2 * 0.65, achillesHalfW * 1.15, l2 * 0.35, calfBulge * 1.05);
    ctx.quadraticCurveTo(l2 * 0.12, calfBulge * 0.85, 0, kneeR * 0.85);
    ctx.stroke();

    // C. Subtelny blask na przedniej krawędzi piszczeli (delikatne światło, brak jakiejkolwiek kreski dzielenia)
    if (isFrontLeg) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(kneeR * 0.6, -kneeR * 0.4);
      ctx.lineTo(l2 * 0.55, -achillesHalfW * 0.7);
      ctx.stroke();
    }

  } else {
    // 2. DŁUGIE BOJÓWKI: Zbluzowana nogawka materiału z ergonomicznym panelem kolanowym
    const blouseEnd = l2 - 4.2;

    // Gładka główka stawu kolanowego materiału bojówek (spaja udo i łydkę w jedną całość bez przerw)
    const kneeCapR = 3.3 * muscle;
    ctx.beginPath();
    ctx.arc(0, 0, kneeCapR, 0, Math.PI * 2);
    if (pantsCamo) {
      ctx.save();
      ctx.clip();
      drawCamoSplotches(ctx, pantsCamo, -kneeCapR, -kneeCapR, kneeCapR, kneeCapR);
      ctx.restore();
    } else {
      const kneeGrad = ctx.createLinearGradient(0, -kneeCapR, 0, kneeCapR);
      kneeGrad.addColorStop(0.0, pantsPal.light);
      kneeGrad.addColorStop(0.5, pantsPal.base);
      kneeGrad.addColorStop(1.0, pantsPal.dark);
      ctx.fillStyle = kneeGrad;
      ctx.fill();
    }

    const traceShinPants = () => {
      ctx.beginPath();
      ctx.moveTo(0, -3.2 * muscle);
      // Wyprofilowanie rzepki pod materiałem bojówek
      ctx.quadraticCurveTo(1.8, -3.75 * muscle, 2.8, -3.6 * muscle);
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
        0, 3.0 * muscle
      );
      ctx.closePath();
    };

    traceShinPants();

    if (pantsCamo) {
      ctx.save();
      ctx.clip();
      drawCamoSplotches(ctx, pantsCamo, 0, -calfBulge * 1.05, blouseEnd, calfBulge * 1.05);
      ctx.restore();
      traceShinPants();
    } else {
      const pantsShinGrad = ctx.createLinearGradient(0, -4.8 * muscle, 0, 4.4 * muscle);
      pantsShinGrad.addColorStop(0.0, pantsPal.light);
      pantsShinGrad.addColorStop(0.5, pantsPal.base);
      pantsShinGrad.addColorStop(1.0, pantsPal.dark);
      ctx.fillStyle = pantsShinGrad;
      ctx.fill();
    }

    // Obrys zewnętrzny nogawki na łydce (TYLKO przednia i tylna krawędź – ZERO kresek w poprzek kolana!)
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    // Przednia krawędź nogawki schodząca do buta
    ctx.moveTo(0, -3.2 * muscle);
    ctx.quadraticCurveTo(1.8, -3.75 * muscle, 2.8, -3.6 * muscle);
    ctx.bezierCurveTo(
      l2 * 0.30, -3.4 * muscle,
      l2 * 0.62, -3.6 * muscle,
      blouseEnd - 1.6, -achillesHalfW * 1.42
    );
    ctx.quadraticCurveTo(blouseEnd + 0.6, -achillesHalfW * 1.15, blouseEnd, -achillesHalfW * 0.85);
    ctx.quadraticCurveTo(blouseEnd + 0.8, 0, blouseEnd, achillesHalfW * 0.92);
    ctx.quadraticCurveTo(blouseEnd + 0.5, achillesHalfW * 1.38, blouseEnd - 2.2, achillesHalfW * 1.45);
    // Tylna krawędź nogawki
    ctx.moveTo(blouseEnd - 2.2, achillesHalfW * 1.45);
    ctx.bezierCurveTo(
      l2 * 0.58, calfBulge * 0.98,
      l2 * 0.28, calfBulge * 1.05,
      0, 3.0 * muscle
    );
    ctx.stroke();

    // Fałdy zbluzowania materiału nad butem
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.34)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(blouseEnd - 3.6, -achillesHalfW * 0.95);
    ctx.quadraticCurveTo(blouseEnd - 1.4, 0.2, blouseEnd - 3.0, achillesHalfW * 1.10);
    ctx.moveTo(blouseEnd - 1.8, -achillesHalfW * 0.85);
    ctx.quadraticCurveTo(blouseEnd - 0.3, 0.0, blouseEnd - 1.4, achillesHalfW * 0.95);
    ctx.stroke();

    if (isFrontLeg) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(0.6, -2.4 * muscle);
      ctx.quadraticCurveTo(2.0, -2.7 * muscle, 3.4, -2.3 * muscle);
      ctx.moveTo(l2 * 0.22, -2.2 * muscle);
      ctx.quadraticCurveTo(l2 * 0.52, -2.5 * muscle, blouseEnd - 2.2, -achillesHalfW * 0.95);
      ctx.stroke();
    }
  }

  // Rany na łydce / uszkodzenia tkaniny
  if (legDmgRatio >= 0.15) {
    const t1 = Math.min(1.0, Math.max(0.0, (legDmgRatio - 0.15) / 0.22));
    const t2 = Math.min(1.0, Math.max(0.0, (legDmgRatio - 0.37) / 0.25));
    const t3 = Math.min(1.0, Math.max(0.0, (legDmgRatio - 0.62) / 0.28));

    if (isFrontLeg) {
      if (t1 > 0) {
        drawShrapnelSlash(ctx, 0.5, -calfBulge * 0.25, 2.5, calfBulge * 0.15, 0.65, t1 * 0.8);
      }
      if (t2 > 0) {
        drawShrapnelSlash(ctx, 0.2, -calfBulge * 0.3, 2.8, calfBulge * 0.25, 0.9, t2);
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
        drawShrapnelSlash(ctx, 0.5, -calfBulge * 0.2, 2.5, calfBulge * 0.1, 0.8, t2 * 0.8);
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

  // Cholewka buta rysowana NA wierzchu nogawki (wyższe buty zakrywają dół spodni)
  drawBootCollarOverPants(ctx, shoesStyle, shoesColor, isFrontLeg, muscle, l2, achillesHalfW, v);

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

  drawFootwear(ctx, shoesStyle, shoesColor, isFrontLeg, muscle, isSculpted, v);

  ctx.restore();
  ctx.restore();

  return ik;
}

export function drawFrontLegOnly(ctx, GROUND_Y, p) {
  if (!p || p.dismembered?.legFront) return;

  const hipX = (p.x + p.w / 2) + p.lastHipShiftX;
  const hipY = p.y + p.h - 40 + (p.pelvisY !== undefined ? p.pelvisY : -11.8);

  const v = { ...DEFAULT_VISUALS, ...(p.currentClass?.visuals || {}) };
  v.jetFuel = p.jetFuel;
  v.jetMax = p.jetMax;
  if (p.currentClass?.id === 'STRIKER') {
    v.hasRocketBoots = true;
  }

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

export function drawJetpack(ctx, p, facingDir, isLookingAway, absCos, absSin, waistHalfW, shoulderHalfW, v = {}) {
  // Klasa Striker używa Butów Odrzutowych (Rocket Boots) – nie nosi plecaka na plecach
  if (p.currentClass?.id === 'STRIKER' && !v.forceJetpackBackpack) {
    return;
  }

  const isFiring = !!p.isJetpacking;
  const isHost = (p.team === 'CYAN' || (!p.team && (p.isLocal !== false)));
  const defaultCol = isHost ? '#00e5ff' : '#f97316';
  const flameCol = v.jetpackColor || p.customVisuals?.jetpackColor || defaultCol;
  const flamePal = getJetpackFlamePalette(flameCol);
  const themeColor = flamePal.base;
  const glowColor = flamePal.glow;

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

        const flameGradBack = ctx.createLinearGradient(0, nzY + nzH, 0, nzY + nzH + 7);
        flameGradBack.addColorStop(0.0, '#ffffff');
        flameGradBack.addColorStop(0.45, themeColor);
        flameGradBack.addColorStop(1.0, flamePal.alphaZero);
        ctx.fillStyle = flameGradBack;
        ctx.beginPath();
        ctx.moveTo(nzX, nzY + nzH);
        ctx.lineTo(nzX + nzW / 2, nzY + nzH + 5.0 + Math.random() * 3.0);
        ctx.lineTo(nzX + nzW, nzY + nzH);
        ctx.closePath();
        ctx.fill();
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
      flameGrad.addColorStop(1.0, flamePal.alphaZero);

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

