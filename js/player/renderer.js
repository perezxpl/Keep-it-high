// =========================================================================
// PLAYER/RENDERER.JS - WARSTWA WIZUALNA I SILNIK RENDEROWANIA 2.5D IK
// Odpowiada za anatomię mięśni, cieniowanie tkanin, kikuty oraz rysowanie postaci.
// =========================================================================

import { CONFIG } from '../config.js';
import { solve2BoneIK, getArmAnglesForTarget, lerp, lerpAngle } from './ik.js';
import { getFreestyleChoreography, getBiomechanicFootTrajectory } from './locomotion.js';
import {
  isBallInKickReach, getGroundKickTrajectory, getScissorLegTargets,
  getBackflipTargets, getSpartanKickTargets, getProneIKTargets
} from './actions.js';
import { getRagdollRenderPose } from './death.js';
import { drawHeldWeapon, getWeaponHoldTransform } from '../weapons.js';

export const DEFAULT_VISUALS = {
  sculptedMuscles: false,
  muscleMult: 1.0,
  sleeveless: false,
  sleeveLengthMult: 1.0,
  hasWristband: true,
  wristbandColor: '#ffffff',
  hasHeadband: true,
  headbandColor: '#ffffff',
  hairColor0: '#1c0d06',
  hairColor1: '#2e160a',
  hairColor2: '#452210',
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
  crosshairColor: '#38bdf8',
  number: '00'
};

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

export function renderArm(ctx, shX, shY, swingAngle, elbowAngle, facing, upperCol, foreCol, isFront, visuals, armUpperLen = 14, armForeLen = 13) {
  const v = { ...DEFAULT_VISUALS, ...(visuals || {}) };
  const upperLen = armUpperLen || 14;
  const foreLen = armForeLen || 13;
  const muscle = v.muscleMult || 1.0;
  const isSculpted = !!v.sculptedMuscles;

  const elbowX = shX + Math.sin(swingAngle) * upperLen * facing;
  const elbowY = shY + Math.cos(swingAngle) * upperLen;

  const forearmAngle = swingAngle + elbowAngle;
  const wristX = elbowX + Math.sin(forearmAngle) * foreLen * facing;
  const wristY = elbowY + Math.cos(forearmAngle) * foreLen;

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
    ctx.moveTo(-deltoidW * 0.45, 0);
    ctx.quadraticCurveTo(-deltoidW * 0.40, -deltoidW * 1.15, deltoidLen * 0.22, -deltoidW * 1.08);
    ctx.quadraticCurveTo(deltoidLen * 0.65, -deltoidW * 0.85, deltoidLen, -armHalfH * 0.65);
    ctx.lineTo(deltoidLen, armHalfH * 0.65);
    ctx.quadraticCurveTo(deltoidLen * 0.65, deltoidW * 0.85, deltoidLen * 0.22, deltoidW * 1.08);
    ctx.quadraticCurveTo(-deltoidW * 0.40, deltoidW * 1.15, -deltoidW * 0.45, 0);
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
    sleeveGrad.addColorStop(0.35, upperCol || v.armColorFront);
    sleeveGrad.addColorStop(1.0, upperCol || v.armColorBack);

    ctx.beginPath();
    ctx.moveTo(-deltoidW * 0.40, 0);
    ctx.quadraticCurveTo(-deltoidW * 0.35, -deltoidW, sleeveLen * 0.3, -sleeveHalfH * 1.05);
    ctx.lineTo(sleeveLen, -sleeveHalfH);
    ctx.lineTo(sleeveLen, sleeveHalfH);
    ctx.quadraticCurveTo(sleeveLen * 0.3, sleeveHalfH * 1.05, -deltoidW * 0.35, deltoidW);
    ctx.closePath();
    ctx.fillStyle = sleeveGrad;
    ctx.fill();

    ctx.fillStyle = isFront ? 'rgba(255, 255, 255, 0.70)' : 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(sleeveLen - 1.6, -sleeveHalfH, 1.6, sleeveHalfH * 2);
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

  const handX = foreLen + 0.5;
  const handScale = (isFront ? 1.0 : 0.88) * (isSculpted ? Math.max(1.0, muscle * 0.95) : muscle);
  const fW = 4.4 * handScale;
  const fH = 3.3 * handScale;

  const handGrad = ctx.createRadialGradient(handX + fW * 0.35, -fH * 0.2, 0.8, handX + fW * 0.4, 0, fW + 1.5);
  handGrad.addColorStop(0.0, isFront ? v.skinLight : v.skinMid);
  handGrad.addColorStop(0.55, isFront ? v.skinMid : v.skinBack);
  handGrad.addColorStop(1.0, v.skinDark);

  ctx.beginPath();
  ctx.moveTo(handX - 0.5, -wristR * 0.85);
  ctx.lineTo(handX + fW * 0.25, -fH * 0.95);
  ctx.quadraticCurveTo(handX + fW * 0.55, -fH * 1.05, handX + fW * 0.72, -fH * 0.85);
  ctx.quadraticCurveTo(handX + fW * 1.05, -fH * 0.65, handX + fW, -fH * 0.25);
  ctx.quadraticCurveTo(handX + fW * 1.05, fH * 0.35, handX + fW * 0.75, fH * 0.85);
  ctx.quadraticCurveTo(handX + fW * 0.35, fH * 0.95, handX - 0.5, wristR * 0.85);
  ctx.closePath();
  ctx.fillStyle = handGrad;
  ctx.fill();

  const thumbGrad = ctx.createLinearGradient(handX, -fH * 0.7, handX + fW * 0.6, fH * 0.2);
  thumbGrad.addColorStop(0.0, isFront ? v.skinLight : v.skinMid);
  thumbGrad.addColorStop(1.0, isFront ? v.skinMid : v.skinDark);

  ctx.beginPath();
  ctx.moveTo(handX + fW * 0.05, -fH * 0.45);
  ctx.quadraticCurveTo(handX + fW * 0.45, -fH * 0.75, handX + fW * 0.70, -fH * 0.15);
  ctx.quadraticCurveTo(handX + fW * 0.55, fH * 0.25, handX + fW * 0.25, fH * 0.10);
  ctx.quadraticCurveTo(handX + fW * 0.10, -fH * 0.10, handX + fW * 0.05, -fH * 0.45);
  ctx.closePath();
  ctx.fillStyle = thumbGrad;
  ctx.fill();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  ctx.moveTo(handX + fW * 0.72, -fH * 0.45);
  ctx.lineTo(handX + fW * 0.95, -fH * 0.25);
  ctx.moveTo(handX + fW * 0.68, -fH * 0.05);
  ctx.lineTo(handX + fW * 0.92, fH * 0.15);
  ctx.moveTo(handX + fW * 0.18, -fH * 0.35);
  ctx.quadraticCurveTo(handX + fW * 0.40, -fH * 0.30, handX + fW * 0.50, fH * 0.05);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.arc(handX + fW * 0.65, -fH * 0.68, 0.75 * handScale, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function renderIKLeg(ctx, hipX, hipY, targetFootX, targetFootY, l1, l2, ankleRot, facing, colorThigh, colorShin, colorBoot, isFront, visuals, playerRef = null) {
  const v = { ...DEFAULT_VISUALS, ...(visuals || {}) };
  const muscle = v.muscleMult || 1.0;
  const isSculpted = !!v.sculptedMuscles;
  const isFrontLeg = !!isFront;

  const isSpecialKickOrProne = !!(playerRef && (
    playerRef.isProne ||
    playerRef.kickMode === 'SPARTAN' ||
    playerRef.kickMode === 'BACKFLIP' ||
    playerRef.kickMode === 'SPIN_VOLLEY' ||
    playerRef.kickMode === 'SCISSOR' ||
    playerRef.kickState === 'SWING' ||
    playerRef.isSliding ||
    playerRef.kneeJuggleWeight > 0 ||
    playerRef.isIntro
  ));

  const safeFootY = isSpecialKickOrProne ? targetFootY : Math.max(hipY + 6, targetFootY);
  const ik = solve2BoneIK(hipX, hipY, targetFootX, safeFootY, l1, l2, facing, -1, isSpecialKickOrProne);
  const thighAng = Math.atan2(ik.kneeY - hipY, ik.kneeX - hipX);
  const shinAng = Math.atan2(ik.footY - ik.kneeY, ik.footX - ik.kneeX);

  ctx.save();

  // UDO - BOJÓWKI CARGO PMC
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(thighAng);

  const thighHalfH = 4.8 * muscle;
  const pantsGrad = ctx.createLinearGradient(0, -thighHalfH, 0, thighHalfH);
  const pantsThighCol = isFrontLeg ? (v.legThighFront || '#3f3f46') : (v.legThighBack || '#27272a');
  pantsGrad.addColorStop(0.0, pantsThighCol);
  pantsGrad.addColorStop(0.4, isFrontLeg ? (v.shortsColor1 || '#334155') : '#1e293b');
  pantsGrad.addColorStop(1.0, isFrontLeg ? (v.shortsColor2 || '#18181b') : '#0f172a');

  // Nogawka bojówek rozciągająca się na całą długość uda
  ctx.beginPath();
  ctx.moveTo(0, -thighHalfH);
  ctx.lineTo(l1 - 1.5, -thighHalfH + 0.6);
  ctx.lineTo(l1, -2.4);
  ctx.lineTo(l1, 2.4);
  ctx.lineTo(l1 - 1.5, thighHalfH - 0.6);
  ctx.lineTo(0, thighHalfH);
  ctx.closePath();
  ctx.fillStyle = pantsGrad;
  ctx.fill();

  // Boczna kieszeń cargo (Cargo Pocket) z klapą i przeszyciami
  const pocketX = l1 * 0.22;
  const pocketW = l1 * 0.50;
  const pocketH = thighHalfH * 0.85;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.fillRect(pocketX, -pocketH - 0.4, pocketW, pocketH * 1.8);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(pocketX, -pocketH - 0.4, pocketW, pocketH * 1.8);

  // Klapa kieszeni cargo (Pocket Flap)
  ctx.fillStyle = isFrontLeg ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(pocketX - 0.5, -pocketH - 0.8, pocketW + 1.0, 2.2);

  // Szew wzmacniający bojówek
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(l1, 0);
  ctx.stroke();

  ctx.restore();

  // ŁYDKA, BOJÓWKI I NAKOLANNIK TAKTYCZNY
  ctx.save();
  ctx.translate(ik.kneeX, ik.kneeY);
  ctx.rotate(shinAng);

  const calfBulge = (isSculpted ? 5.2 : 4.4) * muscle;
  const achillesHalfW = 2.4 * muscle;
  const pantsShinGrad = ctx.createLinearGradient(0, -4.8 * muscle, 0, 4.4 * muscle);
  const shinCol = isFrontLeg ? (v.legShinFront || '#3f3f46') : (v.legShinBack || '#27272a');
  pantsShinGrad.addColorStop(0.0, shinCol);
  pantsShinGrad.addColorStop(0.5, isFrontLeg ? (v.shortsColor1 || '#334155') : '#1e293b');
  pantsShinGrad.addColorStop(1.0, '#18181b');

  ctx.beginPath();
  ctx.moveTo(1.8, -calfBulge * 0.7);
  ctx.lineTo(l2 * 0.15, -2.8 * muscle);
  ctx.lineTo(l2 - 4.5, -achillesHalfW);
  ctx.lineTo(l2 - 4.5, achillesHalfW);
  ctx.quadraticCurveTo(l2 * 0.68, achillesHalfW * 1.15, l2 * 0.48, calfBulge * 0.75);
  ctx.quadraticCurveTo(l2 * 0.30, calfBulge, l2 * 0.14, calfBulge * 0.78);
  ctx.quadraticCurveTo(0.8, calfBulge * 0.8, 1.8, calfBulge * 0.6);
  ctx.closePath();
  ctx.fillStyle = pantsShinGrad;
  ctx.fill();

  // NAKOLANNIK TAKTYCZNY (Hard-Shell Combat Knee Pad)
  const padR = 3.6 * (isSculpted ? muscle * 0.95 : muscle);
  // Neoprenowy pas nośny nakolannika wokół stawu
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.rect(-0.8, -padR * 1.15, 3.8, padR * 2.3);
  ctx.fill();

  // Twarda polimerowa czasza nakolannika
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

  // Nity montażowe nakolannika
  ctx.fillStyle = '#a1a1aa';
  ctx.beginPath();
  ctx.arc(1.5, -padR * 0.65, 0.6, 0, Math.PI * 2);
  ctx.arc(1.5, padR * 0.65, 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Cholewa buta bojowego (Combat Boot Collar)
  const collarGrad = ctx.createLinearGradient(0, -3.2, 0, 3.2);
  collarGrad.addColorStop(0.0, '#27272a');
  collarGrad.addColorStop(0.5, '#18181b');
  collarGrad.addColorStop(1.0, '#09090b');
  ctx.fillStyle = collarGrad;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(l2 - 5.5, -2.8, 5.2, 5.6, 1.2);
  else ctx.rect(l2 - 5.5, -2.8, 5.2, 5.6);
  ctx.fill();

  ctx.restore();

  // BUT PIŁKARSKI
  const shinDx = (ik.footX - ik.kneeX) * facing;
  const shinDy = ik.footY - ik.kneeY;
  const localShinAng = Math.atan2(shinDy, shinDx);

  const isSpecialKick = playerRef && (playerRef.kickState === 'SWING' || playerRef.isCharging || playerRef.kickMode === 'BACKFLIP');

  let targetEffAnkle = ankleRot;
  let targetFlex = 0;

  if (playerRef && playerRef.isDead) {
    targetEffAnkle = ankleRot;
    targetFlex = 0;
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

  const hingeX = 3.6;
  const hingeY = 2.6;
  const toeLen = 8.0 * (isSculpted ? muscle * 0.95 : muscle);

  const cosF = Math.cos(-flexAngle);
  const sinF = Math.sin(-flexAngle);

  const toeTipX = hingeX + cosF * toeLen;
  const toeTipY = hingeY + sinF * toeLen;

  const toeNoseX = hingeX + cosF * (toeLen + 0.6) - sinF * 1.8;
  const toeNoseY = hingeY + sinF * (toeLen + 0.6) + cosF * 1.8 - 1.8;

  const creaseX = hingeX - 0.5;
  const creaseY = -1.6;

  ctx.fillStyle = isFrontLeg ? '#1e293b' : '#0f172a';
  ctx.beginPath();
  ctx.moveTo(-3.6, -1.8);
  ctx.lineTo(2.4, -2.0);
  ctx.lineTo(1.8, 0.8);
  ctx.lineTo(-3.8, 0.8);
  ctx.closePath();
  ctx.fill();

  const bootGrad = ctx.createLinearGradient(0, -2.8, 0, 3.0);
  const bCol = colorBoot || v.bootColor;
  if (isFrontLeg) {
    bootGrad.addColorStop(0.0, '#334155');
    bootGrad.addColorStop(0.45, bCol);
    bootGrad.addColorStop(1.0, '#09090b');
  } else {
    bootGrad.addColorStop(0.0, '#1f2937');
    bootGrad.addColorStop(1.0, '#030712');
  }

  ctx.beginPath();
  ctx.moveTo(-4.2, -1.4);
  ctx.quadraticCurveTo(-4.6, 0.6, -4.2, 2.8);
  ctx.lineTo(hingeX, 2.8);
  ctx.lineTo(toeTipX, toeTipY + 0.2);
  ctx.quadraticCurveTo(toeNoseX + 0.8, toeNoseY + 0.5, toeNoseX, toeNoseY - 0.4);
  ctx.lineTo(creaseX + cosF * 1.0, creaseY + sinF * 1.0);
  ctx.quadraticCurveTo(1.8, -1.8, -1.8, -1.8);
  ctx.quadraticCurveTo(-3.6, -1.8, -4.2, -1.4);
  ctx.closePath();
  ctx.fillStyle = bootGrad;
  ctx.fill();

  if (flexAngle > 0.08) {
    const foldAlpha = Math.min(1.0, (flexAngle - 0.08) / 0.25);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.20 * foldAlpha})`;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(creaseX - 0.5, creaseY + 0.4);
    ctx.lineTo(creaseX + 0.5, creaseY + 2.2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(0, 0, 0, ${0.45 * foldAlpha})`;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(creaseX + 0.5, creaseY + 0.5);
    ctx.lineTo(creaseX + 1.5, creaseY + 2.3);
    ctx.stroke();
  }

  ctx.strokeStyle = isFrontLeg ? v.bootAccent : '#0284c7';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-1.2, -0.6);
  ctx.lineTo(hingeX - 0.5, -0.2);
  ctx.lineTo(hingeX + cosF * 4.5, -0.2 + sinF * 4.5);
  ctx.stroke();

  // GRUBA ZĄBKOWANA PODESZWA WIBRAMOWA (#18181b)
  ctx.fillStyle = '#18181b';
  ctx.fillRect(-4.5, 2.6, hingeX + 4.5, 2.2);

  // Wibramowe protektory i ząbki podeszwy (tread lugs)
  ctx.fillStyle = '#09090b';
  ctx.fillRect(-4.2, 4.4, 1.4, 1.2);
  ctx.fillRect(-2.2, 4.4, 1.4, 1.2);
  ctx.fillRect(-0.2, 4.4, 1.4, 1.2);
  ctx.fillRect(1.8, 4.4, 1.4, 1.2);

  // Przednia część podeszwy (pracująca z kątem zgięcia palców)
  ctx.save();
  ctx.translate(hingeX, 2.6);
  ctx.rotate(-flexAngle);
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, toeLen + 0.5, 2.2);

  // Ząbkowane bieżniki przedniej części podeszwy
  ctx.fillStyle = '#09090b';
  ctx.fillRect(1.2, 1.8, 1.5, 1.2);
  ctx.fillRect(3.6, 1.8, 1.5, 1.2);
  ctx.fillRect(5.8, 1.8, 1.5, 1.2);
  if (toeLen > 7.2) ctx.fillRect(7.6, 1.8, 1.5, 1.2);

  // WZMOCNIONY NOSEK BOJOWY (Steel Toe Cap)
  const capGrad = ctx.createLinearGradient(toeLen - 3.8, 0, toeLen + 1.2, 0);
  capGrad.addColorStop(0.0, 'rgba(63, 63, 70, 0.4)');
  capGrad.addColorStop(0.4, '#3f3f46');
  capGrad.addColorStop(0.85, '#27272a');
  capGrad.addColorStop(1.0, '#18181b');
  ctx.fillStyle = capGrad;
  ctx.beginPath();
  ctx.moveTo(toeLen - 3.2, 2.4);
  ctx.lineTo(toeLen + 0.6, 2.4);
  ctx.quadraticCurveTo(toeLen + 1.6, 1.0, toeLen + 0.2, -1.2);
  ctx.quadraticCurveTo(toeLen - 2.0, -1.0, toeLen - 3.2, 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#71717a';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Nit wzmacniający noska
  ctx.fillStyle = '#a1a1aa';
  ctx.beginPath();
  ctx.arc(toeLen - 1.8, 0.8, 0.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.restore();
  ctx.restore();

  return ik;
}

export function drawFrontLegOnly(ctx, GROUND_Y, p) {
  if (!p || p.dismembered?.legFront) return;

  const hipX = (p.x + p.w / 2) + p.lastHipShiftX;
  const hipY = p.y + p.h - 40 + p.pelvisY;

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

  // Wektor dyszy w lokalnym układzie tułowia (na plecach postaci, u dołu dyszy):
  const localX = -facingDir * 7.5;
  const localY = 2.0;

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

    // Centralna dioda statusu energetycznego
    ctx.fillStyle = isFiring ? '#ffffff' : themeColor;
    ctx.shadowColor = themeColor;
    ctx.shadowBlur = isFiring ? 10 : 4;
    ctx.beginPath();
    ctx.arc(0, packY + 8, 1.8, 0, Math.PI * 2);
    ctx.fill();
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

    // Neonowy wskaźnik stanu / LED
    ctx.fillStyle = isFiring ? '#ffffff' : themeColor;
    ctx.shadowColor = themeColor;
    ctx.shadowBlur = isFiring ? 10 : 5;
    ctx.fillRect(leftX + (facingDir > 0 ? 1.0 : packW - 2.5), packTopY + 8, 1.5, 3.5);
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

  const v = { ...DEFAULT_VISUALS, ...(p.currentClass?.visuals || {}) };
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
  let hipY = p.y + p.h - 40 + p.pelvisY;
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
    const isFalling = (p.vy > 0.8 || p.vy > 100);
    const isRising = p.vy < -0.5;

    if (isRising) {
      rawFootFrontTargetX = hipX + (12 * p.facing);
      rawFootFrontTargetY = hipY + 24;
      rawFootFrontAnkle = 0.20 * p.facing;

      rawFootBackTargetX = hipX - (8 * p.facing);
      rawFootBackTargetY = hipY + 34;
      rawFootBackAnkle = -0.15 * p.facing;

      rawFrontSwing = -0.35;
      rawFrontElbow = 0.75;
      rawBackSwing = 0.35;
      rawBackElbow = 0.65;
    } else {
      // Naturalna, lekko ugięta poza spadania / opadania z wysokości (nogi skierowane w dół, stopy pod biodrami)
      rawFootFrontTargetX = hipX + (5 * p.facing);
      rawFootFrontTargetY = hipY + 41;
      rawFootFrontAnkle = 0.12 * p.facing;

      rawFootBackTargetX = hipX - (4 * p.facing);
      rawFootBackTargetY = hipY + 43;
      rawFootBackAnkle = 0.06 * p.facing;

      rawFrontSwing = -0.20;
      rawFrontElbow = 0.60;
      rawBackSwing = 0.20;
      rawBackElbow = 0.50;
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
      rawFrontSwing = -armPhase * 0.35;
      rawBackSwing = armPhase * 0.35;
      rawFrontElbow = 0.75;
      rawBackElbow = 0.75;
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

  const isProneCrawling = p.isProne && speed > 0.08 && (!p.shootPoseWeight || p.shootPoseWeight < 0.2);
  const hWeight = (typeof p.holsterWeight === 'number') ? p.holsterWeight : (p.isHolstered ? 1.0 : 0.0);
  const hasActiveWeapon = p.currentWeapon && hWeight < 0.99 && !p.isDead && !isProneCrawling && !(p.staggerTimer > 0);

  if (hasActiveWeapon) {
    const hold = getWeaponHoldTransform(p);

    const shoulderBaseX = hipX + (21 * Math.sin(p.pose?.torsoTilt || p.torsoTilt || 0));
    const shoulderBaseY = hipY - (21 * Math.cos(p.pose?.torsoTilt || p.torsoTilt || 0));
    const shOffsetHoriz = (cosYaw * 1.4) - (sinYaw * 4.5);
    const shoulderTilt = p.pose?.shoulderTilt || 0;

    const shRightX = shoulderBaseX + shOffsetHoriz;
    const shRightY = shoulderBaseY - (shoulderTilt * 8 * cosYaw);

    const shLeftX = shoulderBaseX - shOffsetHoriz;
    const shLeftY = shoulderBaseY + (shoulderTilt * 8 * cosYaw);

    const rightArmRelX = (hold.rightHandTarget.x - shRightX) * currentFacingDir;
    const rightArmRelY = hold.rightHandTarget.y - shRightY;

    const leftArmRelX = (hold.leftHandTarget.x - shLeftX) * currentFacingDir;
    const leftArmRelY = hold.leftHandTarget.y - shLeftY;

    const armRight = getArmAnglesForTarget(rightArmRelX, rightArmRelY, p.upperArmLen, p.forearmLen, 1);
    const armLeft = getArmAnglesForTarget(leftArmRelX, leftArmRelY, p.upperArmLen, p.forearmLen, 1);

    if (hWeight > 0.01) {
      rawFrontSwing = lerp(armRight.swing, rawFrontSwing, hWeight);
      rawFrontElbow = lerp(armRight.elbow, rawFrontElbow, hWeight);
      rawBackSwing = lerp(armLeft.swing, rawBackSwing, hWeight);
      rawBackElbow = lerp(armLeft.elbow, rawBackElbow, hWeight);
    } else {
      rawFrontSwing = armRight.swing;
      rawFrontElbow = armRight.elbow;
      rawBackSwing = armLeft.swing;
      rawBackElbow = armLeft.elbow;
    }
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

  if (p.kickMode === 'BACKFLIP') {
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

  pose.armFrontSwing += (rawFrontSwing - pose.armFrontSwing) * armBlend;
  pose.armFrontElbow += (rawFrontElbow - pose.armFrontElbow) * armBlend;
  pose.armBackSwing += (rawBackSwing - pose.armBackSwing) * armBlend;
  pose.armBackElbow += (rawBackElbow - pose.armBackElbow) * armBlend;

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
    pose.torsoTilt = 1.48 * p.facing;
    pose.headPitch = -0.45 * p.facing;
  } else {
    pose.torsoTilt += (p.torsoTilt - pose.torsoTilt) * 0.24;
    pose.headPitch += (p.headPitch - pose.headPitch) * 0.22;
  }

  let targetShoulderAmp = 0;
  if (!p.isDead && speed > 0.1) {
    if (p.gaitMode === 'SPRINT') targetShoulderAmp = 0.12;
    else if (p.gaitMode === 'JOG') targetShoulderAmp = 0.08;
    else targetShoulderAmp = 0.05;
  }
  const shoulderCounterTilt = p.isDead ? 0 : -Math.sin(p.stridePhase) * targetShoulderAmp * currentFacingDir;
  pose.shoulderTilt += (shoulderCounterTilt - pose.shoulderTilt) * 0.20;

  const shoulderBaseX = hipX + (21 * Math.sin(pose.torsoTilt));
  const shoulderBaseY = hipY - (21 * Math.cos(pose.torsoTilt));

  const headTopX = hipX + (36 * Math.sin(pose.torsoTilt));
  const headTopY = hipY - (36 * Math.cos(pose.torsoTilt)) + ((p.headBob || 0) * 0.75);
  p.head = { x: headTopX, y: headTopY };
  if (!p.height) p.height = p.h || 70;
  if (!p.width) p.width = p.w || 24;

  const shOffsetHoriz = (cosYaw * 1.4) - (sinYaw * 4.5);
  const shRightX = shoulderBaseX + shOffsetHoriz;
  const shLeftX = shoulderBaseX - shOffsetHoriz;
  const shRightY = shoulderBaseY - (pose.shoulderTilt * 8 * cosYaw);
  const shLeftY = shoulderBaseY + (pose.shoulderTilt * 8 * cosYaw);

  const hipOffsetHoriz = (cosYaw * 2.0) - (sinYaw * 3.5);
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

  // KOŃCZYNY W TLE
  if (isRightLimbForeground) {
    if (!isArmBackDismembered) {
      renderArm(ctx, shLeftX, shLeftY, pose.armBackSwing, pose.armBackElbow, currentFacingDir, armColBack, null, false, v, p.upperArmLen, p.forearmLen);
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
      renderArm(ctx, shRightX, shRightY, pose.armFrontSwing, pose.armFrontElbow, currentFacingDir, armColBack, null, false, v, p.upperArmLen, p.forearmLen);
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

  const waistHalfW = (4.4 + absSin * 1.2) * (isSculpted ? muscle * 0.90 : muscle);
  const shoulderHalfW = (4.8 + absSin * 1.5) * (isSculpted ? muscle * 1.28 : muscle);
  const waistY = 2.0;

  const neckBaseHalfW = (2.2 * absCos + 3.0 * absSin) * muscle;
  const trapHalfW = shoulderHalfW * 0.98;
  const neckGrad = ctx.createLinearGradient(-trapHalfW, 0, trapHalfW, 0);
  neckGrad.addColorStop(0.0, v.skinDark);
  neckGrad.addColorStop(0.35, v.skinBack);
  neckGrad.addColorStop(0.70, v.skinMid);
  neckGrad.addColorStop(1.0, v.skinLight);

  ctx.beginPath();
  ctx.moveTo(-neckBaseHalfW * 0.85, -29.2);
  ctx.lineTo(neckBaseHalfW * 0.85, -28.8);
  ctx.quadraticCurveTo(neckBaseHalfW * 1.35, -26.8, trapHalfW, -23.6);
  ctx.lineTo(trapHalfW, -19.0);
  ctx.lineTo(-trapHalfW, -19.0);
  ctx.lineTo(-trapHalfW, -23.6);
  ctx.quadraticCurveTo(-neckBaseHalfW * 1.35, -26.8, -neckBaseHalfW * 0.85, -29.2);
  ctx.closePath();
  ctx.fillStyle = neckGrad;
  ctx.fill();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  ctx.beginPath();
  ctx.moveTo(0.0, -28.8);
  ctx.lineTo(neckBaseHalfW * 0.45, -28.6);
  ctx.lineTo(neckBaseHalfW * 0.25, -26.5);
  ctx.lineTo(0.0, -26.0);
  ctx.closePath();
  ctx.fill();

  // PAS TAKTYCZNY PMC (Duty / Riggers Belt)
  const beltGrad = ctx.createLinearGradient(-waistHalfW, 0, waistHalfW, 0);
  beltGrad.addColorStop(0.0, '#09090b');
  beltGrad.addColorStop(0.5, '#18181b');
  beltGrad.addColorStop(1.0, '#09090b');

  ctx.beginPath();
  ctx.moveTo(-waistHalfW, 0);
  ctx.quadraticCurveTo(0, 1.4, waistHalfW, 0);
  ctx.lineTo(waistHalfW - 0.4, 4.6);
  ctx.quadraticCurveTo(0, 6.2, -waistHalfW + 0.4, 4.6);
  ctx.closePath();
  ctx.fillStyle = beltGrad;
  ctx.fill();

  // Metalowa klamra pasa taktycznego
  ctx.fillStyle = '#52525b';
  ctx.fillRect(-1.6, 1.2, 3.2, 2.6);
  ctx.fillStyle = '#71717a';
  ctx.fillRect(-1.0, 1.7, 2.0, 1.6);

  // KAMIZELKA TAKTYCZNA / PLATE CARRIER PMC
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
  const scoopCenterX = !isLookingAway ? (cosYaw * 1.0) : (-sinYaw * 0.8);
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

  // Obrys i wzmocnione krawędzie pancerza
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

  // MODEL JETPACKA NA PLECACH POSTACI
  drawJetpack(ctx, p, currentFacingDir, isLookingAway, absCos, absSin, waistHalfW, shoulderHalfW);

  // GŁOWA LUB KIKUT SZYI
  ctx.save();
  ctx.translate(0.0, -30.5 + (p.headBob * 0.35));

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

    const faceGrad = ctx.createLinearGradient(-5.0, 0, 7.0, 0);
    faceGrad.addColorStop(0.0, v.skinBack);
    faceGrad.addColorStop(0.5, v.skinMid);
    faceGrad.addColorStop(1.0, v.skinLight);

    ctx.beginPath();
    ctx.moveTo(-4.6, -6.6);
    ctx.lineTo(4.2, -6.6);
    ctx.lineTo(4.8, -4.2);
    ctx.lineTo(4.3, -3.3);
    ctx.lineTo(6.8, -1.0);
    ctx.lineTo(5.1, -0.4);
    ctx.lineTo(5.5, 0.6);
    ctx.lineTo(4.9, 1.4);
    ctx.lineTo(5.3, 2.3);
    ctx.lineTo(4.3, 4.8);
    ctx.lineTo(0.2, 4.4);
    ctx.lineTo(-4.6, 1.2);
    ctx.closePath();
    ctx.fillStyle = faceGrad;
    ctx.fill();

    ctx.fillStyle = v.skinBack;
    ctx.beginPath();
    ctx.ellipse(-3.2, -0.8, 1.5, 2.0, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = v.skinDark;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(-3.1, -0.8, 1.0, 0.4 * Math.PI, 1.7 * Math.PI, false);
    ctx.stroke();

    const hairGrad = ctx.createLinearGradient(-6.0, -12.0, 5.0, -5.0);
    hairGrad.addColorStop(0.0, v.hairColor0);
    hairGrad.addColorStop(0.6, v.hairColor1);
    hairGrad.addColorStop(1.0, v.hairColor2);

    ctx.beginPath();
    ctx.moveTo(-4.8, -4.8);
    ctx.lineTo(-6.0, -10.6);
    ctx.bezierCurveTo(-6.0, -11.6, -1.5, -12.8, 2.5, -12.2);
    ctx.quadraticCurveTo(6.0, -9.5, 5.2, -6.8);
    ctx.lineTo(3.6, -4.8);
    ctx.closePath();
    ctx.fillStyle = hairGrad;
    ctx.fill();

    if (v.hasHeadband) {
      ctx.strokeStyle = v.headbandColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-5.2, -6.6);
      ctx.lineTo(4.4, -6.6);
      ctx.stroke();
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

    ctx.strokeStyle = '#23120b';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(1.4, -3.3);
    ctx.lineTo(4.4, -3.5);
    ctx.stroke();

  } else if (isLookingAway) {
    ctx.rotate(pose.headPitch * 0.5);
    const hairBackGrad = ctx.createLinearGradient(-4.8, -10.0, 4.8, 4.0);
    hairBackGrad.addColorStop(0.0, v.hairColor0);
    hairBackGrad.addColorStop(0.5, v.hairColor1);
    hairBackGrad.addColorStop(1.0, v.hairColor2);

    ctx.beginPath();
    ctx.ellipse(0, -1.0, 4.8, 5.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = hairBackGrad;
    ctx.fill();

    if (v.hasHeadband) {
      ctx.strokeStyle = v.headbandColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -1.6, 4.8, Math.PI * 0.8, Math.PI * 0.2, true);
      ctx.stroke();
    }
  } else {
    ctx.rotate(pose.headPitch * 0.5);
    const faceFrontGrad = ctx.createLinearGradient(-4.8, -6.0, 4.8, 6.0);
    faceFrontGrad.addColorStop(0.0, v.skinBack);
    faceFrontGrad.addColorStop(0.5, v.skinMid);
    faceFrontGrad.addColorStop(1.0, v.skinLight);

    ctx.beginPath();
    ctx.ellipse(0, -0.6, 4.8, 5.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = faceFrontGrad;
    ctx.fill();

    ctx.fillStyle = v.hairColor1;
    ctx.beginPath();
    ctx.arc(0, -2.5, 4.9, Math.PI * 0.85, Math.PI * 0.15, true);
    ctx.closePath();
    ctx.fill();

    if (v.hasHeadband) {
      ctx.strokeStyle = v.headbandColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-4.7, -2.8);
      ctx.lineTo(4.7, -2.8);
      ctx.stroke();
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
      renderArm(ctx, shRightX, shRightY, pose.armFrontSwing, pose.armFrontElbow, currentFacingDir, armColFront, null, true, v, p.upperArmLen, p.forearmLen);
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
      renderArm(ctx, shLeftX, shLeftY, pose.armBackSwing, pose.armBackElbow, currentFacingDir, armColFront, null, true, v, p.upperArmLen, p.forearmLen);
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
  } else if (p.isReloading) {
    ctx.save();
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.009);
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(250, 204, 21, ${0.55 + pulse * 0.45})`;
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 6;
    ctx.fillText('⚡ RELOADING...', p.x + p.w / 2, p.y - 18);

    if (p.reloadDuration > 0) {
      const prog = Math.max(0, Math.min(1, 1 - ((p.reloadTimer || 0) / p.reloadDuration)));
      const barW = 34;
      const barH = 3;
      const barX = p.x + p.w / 2 - barW / 2;
      const barY = p.y - 13;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(barX, barY, barW * prog, barH);
    }
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

  // TAKTYCZNY CHEVRON / HOLOGRAM DRUŻYNY (CYAN vs ORANGE) UNOSZĄCY SIĘ 16 PX NAD GŁOWĄ
  if (!p.isDead) {
    ctx.save();
    const isCyan = (p.team === 'CYAN' || (!p.team && (p.isLocal !== false)));
    const teamNeon = isCyan ? '#00f0ff' : '#f97316';
    const teamCore = isCyan ? '#a5f3fc' : '#fed7aa';
    const teamGlow = isCyan ? 'rgba(6, 182, 212, ' : 'rgba(249, 115, 22, ';

    const headTopX = p.head ? p.head.x : (hipX + (36 * Math.sin(pose.torsoTilt)));
    const headTopY = p.head ? p.head.y : (hipY - (36 * Math.cos(pose.torsoTilt)) + (p.headBob * 0.35));

    const now = performance.now();
    const hoverY = Math.sin(now * 0.005) * 1.5;
    const pulse = 0.65 + 0.35 * Math.sin(now * 0.007);

    const chevX = headTopX;
    const chevY = headTopY - 8 + hoverY;

    // Poświata neonowa hologramu
    ctx.shadowColor = teamNeon;
    ctx.shadowBlur = 8 + pulse * 6;

    // Pierścień / emiter projekcji holograficznej
    ctx.strokeStyle = `${teamGlow}${0.35 * pulse})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(chevX, headTopY - 4, 7.0, 2.2, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Taktyczne nawiasy HUD
    ctx.strokeStyle = `${teamGlow}${0.55 * pulse})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(chevX - 7.5, chevY - 3.5);
    ctx.lineTo(chevX - 6.0, chevY - 5.5);
    ctx.lineTo(chevX - 3.0, chevY - 5.5);
    ctx.moveTo(chevX + 7.5, chevY - 3.5);
    ctx.lineTo(chevX + 6.0, chevY - 5.5);
    ctx.lineTo(chevX + 3.0, chevY - 5.5);
    ctx.stroke();

    // Holograficzny taktyczny chevron (▼)
    ctx.fillStyle = teamNeon;
    ctx.beginPath();
    ctx.moveTo(chevX - 4.8, chevY - 4.5);
    ctx.lineTo(chevX + 4.8, chevY - 4.5);
    ctx.lineTo(chevX, chevY + 2.8);
    ctx.closePath();
    ctx.fill();

    // Wewnętrzny rdzeń neonu
    ctx.fillStyle = teamCore;
    ctx.beginPath();
    ctx.moveTo(chevX - 2.8, chevY - 3.8);
    ctx.lineTo(chevX + 2.8, chevY - 3.8);
    ctx.lineTo(chevX, chevY + 0.8);
    ctx.closePath();
    ctx.fill();

    // DWA CIENKIE, MINIMALISTYCZNE PASKI (34 px x 3 px) BEZPOŚREDNIO NAD GŁOWĄ, TUŻ POD CHEVRONEM:
    // Górny pasek: Zdrowie (zielony/czerwony)
    // Dolny pasek: Jetpack (jasny cyjan #06b6d4)
    // Zero tekstu, zero cyfr – czysta minimalistyczna geometria
    const barW = 34;
    const barH = 3;
    const barX = headTopX - (barW / 2);
    const barY_hp = headTopY - 9;
    const barY_jet = headTopY - 5;

    const maxHp = p.maxHp || 100;
    const curHp = Math.max(0, p.hp ?? 100);
    const hpRatio = Math.max(0, Math.min(1, curHp / maxHp));

    const maxJet = p.jetMax || 100;
    const curJet = Math.max(0, p.jetFuel ?? 0);
    const jetRatio = Math.max(0, Math.min(1, curJet / maxJet));

    // Tło paska HP
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.fillRect(barX - 0.5, barY_hp - 0.5, barW + 1, barH + 1);
    // Wypełnienie HP (zielony / czerwony)
    if (hpRatio > 0) {
      ctx.fillStyle = (hpRatio > 0.25) ? '#22c55e' : '#ef4444';
      ctx.fillRect(barX, barY_hp, barW * hpRatio, barH);
    }

    // Tło paska Jetpack
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.fillRect(barX - 0.5, barY_jet - 0.5, barW + 1, barH + 1);
    // Wypełnienie Jetpack (jasny cyjan #06b6d4)
    if (jetRatio > 0) {
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(barX, barY_jet, barW * jetRatio, barH);
    }

    ctx.restore();
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

