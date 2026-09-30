// =========================================================================
// PLAYER/RENDERER.JS - WARSTWA WIZUALNA I SILNIK RENDEROWANIA 2.5D IK
// Odpowiada za anatomię mięśni, cieniowanie tkanin, kikuty oraz rysowanie postaci.
// =========================================================================

import { CONFIG } from '../config.js';
import { solve2BoneIK, getArmAnglesForTarget, lerp, lerpAngle } from './ik.js';
import { getFreestyleChoreography, getBiomechanicFootTrajectory } from './locomotion.js';
import { isBallInKickReach, getGroundKickTrajectory, getScissorLegTargets, getBackflipTargets } from './actions.js';
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
  shortsColor0: '#ffffff',
  shortsColor1: '#f8fafc',
  shortsColor2: '#cbd5e1',
  skinLight: '#fed7aa',
  skinMid: '#f5b078',
  skinDark: '#b45309',
  skinBack: '#de935e',
  jerseyFront0: '#991b1b',
  jerseyFront1: '#dc2626',
  jerseyFront2: '#ef4444',
  jerseyFront3: '#b91c1c',
  jerseyBack0: '#7f1d1d',
  jerseyBack1: '#991b1b',
  jerseyBack2: '#5f1212',
  jerseyStripe: '#e53935',
  armColorFront: '#e53935',
  armColorBack: '#991b1b',
  legThighFront: '#dc2626',
  legShinFront: '#e53935',
  legThighBack: '#991b1b',
  legShinBack: '#b91c1c',
  bootColor: '#18181b',
  bootBack: '#111827',
  bootAccent: '#38bdf8',
  crestColor: '#fbc02d',
  seamColor: '#7f1d1d',
  crosshairColor: '#38bdf8',
  number: '10'
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

  const ik = solve2BoneIK(hipX, hipY, targetFootX, targetFootY, l1, l2, facing, -1);
  const thighAng = Math.atan2(ik.kneeY - hipY, ik.kneeX - hipX);
  const shinAng = Math.atan2(ik.footY - ik.kneeY, ik.footX - ik.kneeX);

  ctx.save();

  // UDO I SPODENKI
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(thighAng);

  const shortsLen = l1 * (isSculpted ? 0.56 : 0.65);
  const shortsHalfH = 4.8 * muscle;
  const quadHalfH = 3.8 * muscle;
  const quadLen = l1 - shortsLen;

  const shortsGrad = ctx.createLinearGradient(0, -shortsHalfH, 0, shortsHalfH);
  if (isFrontLeg) {
    shortsGrad.addColorStop(0.0, v.shortsColor0);
    shortsGrad.addColorStop(0.4, v.shortsColor1);
    shortsGrad.addColorStop(1.0, v.shortsColor2);
  } else {
    shortsGrad.addColorStop(0.0, v.shortsColor1);
    shortsGrad.addColorStop(0.5, v.shortsColor2);
    shortsGrad.addColorStop(1.0, '#334155');
  }

  const cuffBulge = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, -shortsHalfH);
  ctx.lineTo(shortsLen, -shortsHalfH + 0.8);
  ctx.quadraticCurveTo(shortsLen + cuffBulge, 0, shortsLen, shortsHalfH - 0.8);
  ctx.lineTo(0, shortsHalfH);
  ctx.closePath();
  ctx.fillStyle = shortsGrad;
  ctx.fill();

  const stripeGrad = ctx.createLinearGradient(0, -shortsHalfH, 0, -shortsHalfH + 1.6);
  stripeGrad.addColorStop(0.0, isFrontLeg ? v.jerseyStripe : v.jerseyFront0);
  stripeGrad.addColorStop(1.0, isFrontLeg ? (v.jerseyFront1 || v.jerseyColor || '#dc2626') : '#991b1b');
  ctx.fillStyle = stripeGrad;
  ctx.beginPath();
  ctx.moveTo(0, -shortsHalfH);
  ctx.lineTo(shortsLen, -shortsHalfH + 0.8);
  ctx.lineTo(shortsLen, -shortsHalfH + 2.4);
  ctx.lineTo(0, -shortsHalfH + 1.6);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = isFrontLeg ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(shortsLen - 0.8, -shortsHalfH + 0.8);
  ctx.quadraticCurveTo(shortsLen - 0.8 + cuffBulge, 0, shortsLen - 0.8, shortsHalfH - 0.8);
  ctx.stroke();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
  ctx.beginPath();
  ctx.moveTo(shortsLen, -quadHalfH);
  ctx.quadraticCurveTo(shortsLen + cuffBulge, 0, shortsLen, quadHalfH);
  ctx.lineTo(shortsLen + 2.2, quadHalfH - 0.3);
  ctx.quadraticCurveTo(shortsLen + 2.2 + cuffBulge, 0, shortsLen + 2.2, -quadHalfH + 0.3);
  ctx.closePath();
  ctx.fill();

  const quadGrad = ctx.createLinearGradient(0, -quadHalfH * 1.3, 0, quadHalfH * 1.3);
  if (isFrontLeg) {
    quadGrad.addColorStop(0.0, v.skinLight);
    quadGrad.addColorStop(0.35, v.skinMid);
    quadGrad.addColorStop(1.0, v.skinDark);
  } else {
    quadGrad.addColorStop(0.0, v.skinMid);
    quadGrad.addColorStop(0.4, v.skinBack);
    quadGrad.addColorStop(1.0, v.skinDark);
  }

  ctx.beginPath();
  if (isSculpted) {
    ctx.moveTo(shortsLen - 0.5, -quadHalfH * 0.95);
    ctx.quadraticCurveTo(shortsLen + quadLen * 0.32, -quadHalfH * 1.18, shortsLen + quadLen * 0.68, -quadHalfH * 0.88);
    ctx.quadraticCurveTo(shortsLen + quadLen * 0.90, -quadHalfH * 0.62, l1, -2.4);
    ctx.lineTo(l1, 2.2);
    ctx.quadraticCurveTo(shortsLen + quadLen * 0.60, quadHalfH * 0.92, shortsLen + quadLen * 0.25, quadHalfH * 0.98);
    ctx.quadraticCurveTo(shortsLen, quadHalfH * 0.95, shortsLen - 0.5, quadHalfH * 0.90);
  } else {
    ctx.moveTo(shortsLen - 0.5, -quadHalfH);
    ctx.quadraticCurveTo(shortsLen + quadLen * 0.40, -quadHalfH * 1.05, shortsLen + quadLen * 0.75, -quadHalfH * 0.82);
    ctx.lineTo(l1, -2.4);
    ctx.lineTo(l1, 2.2);
    ctx.quadraticCurveTo(shortsLen + quadLen * 0.50, quadHalfH * 0.90, shortsLen - 0.5, quadHalfH * 0.92);
  }
  ctx.closePath();
  ctx.fillStyle = quadGrad;
  ctx.fill();

  if (isSculpted && isFrontLeg) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(shortsLen + quadLen * 0.50, -quadHalfH * 0.65);
    ctx.quadraticCurveTo(shortsLen + quadLen * 0.78, -quadHalfH * 0.45, l1 - 1.5, -1.8);
    ctx.stroke();
  }

  ctx.restore();

  // ŁYDKA I GETRA
  ctx.save();
  ctx.translate(ik.kneeX, ik.kneeY);
  ctx.rotate(shinAng);

  const patellaR = 2.4 * (isSculpted ? muscle * 0.95 : muscle);
  const patellaGrad = ctx.createLinearGradient(0, -patellaR, 0, patellaR);
  patellaGrad.addColorStop(0.0, isFrontLeg ? v.skinLight : v.skinMid);
  patellaGrad.addColorStop(0.5, isFrontLeg ? v.skinMid : v.skinBack);
  patellaGrad.addColorStop(1.0, v.skinDark);

  ctx.beginPath();
  ctx.ellipse(1.6, -0.4, patellaR * 0.95, patellaR * 1.15, -0.1, 0, Math.PI * 2);
  ctx.fillStyle = patellaGrad;
  ctx.fill();

  ctx.fillStyle = isFrontLeg ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.20)';
  ctx.beginPath();
  ctx.arc(1.5, -0.8, patellaR * 0.45, 0, Math.PI * 2);
  ctx.fill();

  const sockGrad = ctx.createLinearGradient(0, -4.8 * muscle, 0, 4.4 * muscle);
  const shinCol = colorShin || v.legShinFront;
  const thighCol = colorThigh || v.legThighFront;
  sockGrad.addColorStop(0.0, shinCol);
  sockGrad.addColorStop(0.3, shinCol);
  sockGrad.addColorStop(1.0, thighCol);

  const achillesHalfW = 1.9 * (isSculpted ? Math.max(1.0, muscle * 0.88) : muscle);
  const calfBulge = (isSculpted ? 5.2 : 4.4) * muscle;

  ctx.beginPath();
  ctx.moveTo(1.8, -patellaR * 0.7);
  ctx.lineTo(l2 * 0.15, -2.4 * muscle);
  ctx.lineTo(l2 - 4.5, -achillesHalfW);
  ctx.lineTo(l2 - 4.5, achillesHalfW);
  ctx.quadraticCurveTo(l2 * 0.68, achillesHalfW * 1.15, l2 * 0.48, calfBulge * 0.75);
  ctx.quadraticCurveTo(l2 * 0.30, calfBulge, l2 * 0.14, calfBulge * 0.78);
  ctx.quadraticCurveTo(0.8, patellaR * 0.9, 1.8, patellaR * 0.6);
  ctx.closePath();
  ctx.fillStyle = sockGrad;
  ctx.fill();

  if (isFrontLeg) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(l2 * 0.20, -2.1 * muscle);
    ctx.lineTo(l2 * 0.75, -achillesHalfW * 0.8);
    ctx.stroke();

    if (isSculpted) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.beginPath();
      ctx.moveTo(l2 * 0.26, calfBulge * 0.25);
      ctx.quadraticCurveTo(l2 * 0.35, calfBulge * 0.35, l2 * 0.52, achillesHalfW * 0.4);
      ctx.stroke();
    }
  }

  if (isFrontLeg) {
    ctx.save();
    ctx.translate(l2 * 0.42, -4.1 * muscle);
    ctx.rotate(-0.06);
    ctx.beginPath();
    ctx.ellipse(0, 0, l2 * 0.22, 1.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.60)';
    ctx.fill();
    ctx.restore();
  }

  const tapeGrad = ctx.createLinearGradient(0, -2.8, 0, 2.8);
  tapeGrad.addColorStop(0.0, '#ffffff');
  tapeGrad.addColorStop(0.5, '#f1f5f9');
  tapeGrad.addColorStop(1.0, isFrontLeg ? '#94a3b8' : '#64748b');

  ctx.fillStyle = tapeGrad;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(l2 - 4.5, -2.6, 4.0, 5.2, 1);
  } else {
    ctx.rect(l2 - 4.5, -2.6, 4.0, 5.2);
  }
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

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-4.2, 2.6, hingeX + 4.2, 1.2);

  ctx.save();
  ctx.translate(hingeX, 2.6);
  ctx.rotate(-flexAngle);
  ctx.fillRect(0, 0, toeLen, 1.2);

  const studGrad = ctx.createLinearGradient(0, 1.2, 0, 2.6);
  studGrad.addColorStop(0.0, '#94a3b8');
  studGrad.addColorStop(1.0, '#cbd5e1');
  ctx.fillStyle = studGrad;
  ctx.fillRect(1.8, 1.2, 1.5, 1.3);
  ctx.fillRect(toeLen - 2.0, 1.2, 1.4, 1.3);
  ctx.restore();

  ctx.fillStyle = studGrad;
  ctx.fillRect(-2.4, 3.6, 1.6, 1.3);

  ctx.restore();
  ctx.restore();

  return ik;
}

export function drawFrontLegOnly(ctx, GROUND_Y, p) {
  if (p.dismembered?.legFront) return;

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
  const standingY = (p.currentGroundY !== undefined && !p.isJumping) ? p.currentGroundY : (p.y + p.h);
  const floorY = standingY;
  const plantFloorY = floorY - 3.5;
  let hipX = centerX;
  let hipY = p.y + p.h - 40 + p.pelvisY;
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

  const isVisualCharging = (p.isCharging && speed < 0.8 && isBallInKickReach(p, p._ball));

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
  } else if (p.isJumping) {
    const isRising = p.vy < 0;
    if (isRising) {
      rawFootFrontTargetX = hipX + (14 * p.facing);
      rawFootFrontTargetY = hipY + 22;
      rawFootFrontAnkle = 0.22 * p.facing;

      rawFootBackTargetX = hipX - (8 * p.facing);
      rawFootBackTargetY = hipY + 34;
      rawFootBackAnkle = -0.15 * p.facing;
    } else {
      rawFootFrontTargetX = hipX + (8 * p.facing);
      rawFootFrontTargetY = hipY + 38;
      rawFootFrontAnkle = 0.10 * p.facing;

      rawFootBackTargetX = hipX - (6 * p.facing);
      rawFootBackTargetY = hipY + 40;
      rawFootBackAnkle = 0.05 * p.facing;
    }

    rawFrontSwing = -0.35;
    rawFrontElbow = 0.75;
    rawBackSwing = 0.35;
    rawBackElbow = 0.65;
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

  if (p.currentWeapon && !p.isDead) {
    const hold = getWeaponHoldTransform(p);

    const shoulderBaseX = hipX + (21 * Math.sin(p.pose?.torsoTilt || p.torsoTilt || 0));
    const shoulderBaseY = hipY - (21 * Math.cos(p.pose?.torsoTilt || p.torsoTilt || 0));
    const shOffsetHoriz = (cosYaw * 1.4) - (sinYaw * 4.5);
    const shoulderTilt = p.pose?.shoulderTilt || 0;

    const shRightX = shoulderBaseX + shOffsetHoriz;
    const shRightY = shoulderBaseY - (shoulderTilt * 4 * cosYaw);

    const shLeftX = shoulderBaseX - shOffsetHoriz;
    const shLeftY = shoulderBaseY + (shoulderTilt * 4 * cosYaw);

    const rightArmRelX = (hold.rightHandTarget.x - shRightX) * currentFacingDir;
    const rightArmRelY = hold.rightHandTarget.y - shRightY;

    const leftArmRelX = (hold.leftHandTarget.x - shLeftX) * currentFacingDir;
    const leftArmRelY = hold.leftHandTarget.y - shLeftY;

    const armRight = getArmAnglesForTarget(rightArmRelX, rightArmRelY, p.upperArmLen, p.forearmLen, 1);
    const armLeft = getArmAnglesForTarget(leftArmRelX, leftArmRelY, p.upperArmLen, p.forearmLen, 1);

    rawFrontSwing = armRight.swing;
    rawFrontElbow = armRight.elbow;
    rawBackSwing = armLeft.swing;
    rawBackElbow = armLeft.elbow;
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

  const wepWeight = (p.currentWeapon && typeof p.shootPoseWeight === 'number') ? p.shootPoseWeight : 0;
  let footBlend = p.isDead ? 0.90 : 0.32;
  let armBlend = p.isDead ? 0.90 : ((p.currentWeapon && !p.isDead) ? (wepWeight > 0.4 ? 0.78 : 0.45) : 0.24);

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
  } else {
    pose.torsoTilt += (p.torsoTilt - pose.torsoTilt) * 0.24;
    pose.headPitch += (p.headPitch - pose.headPitch) * 0.22;
  }

  const shoulderCounterTilt = p.isDead ? 0 : -Math.sin(p.stridePhase) * (speed > 0.8 ? 0.045 : 0.015) * currentFacingDir;
  pose.shoulderTilt += (shoulderCounterTilt - pose.shoulderTilt) * 0.20;

  const shoulderBaseX = hipX + (21 * Math.sin(pose.torsoTilt));
  const shoulderBaseY = hipY - (21 * Math.cos(pose.torsoTilt));

  const shOffsetHoriz = (cosYaw * 1.4) - (sinYaw * 4.5);
  const shRightX = shoulderBaseX + shOffsetHoriz;
  const shLeftX = shoulderBaseX - shOffsetHoriz;
  const shRightY = shoulderBaseY - (pose.shoulderTilt * 4 * cosYaw);
  const shLeftY = shoulderBaseY + (pose.shoulderTilt * 4 * cosYaw);

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

  const pelvisShortsGrad = ctx.createLinearGradient(-waistHalfW, 0, waistHalfW, 0);
  pelvisShortsGrad.addColorStop(0.0, v.shortsColor2);
  pelvisShortsGrad.addColorStop(0.5, v.shortsColor0);
  pelvisShortsGrad.addColorStop(1.0, v.shortsColor2);

  ctx.beginPath();
  ctx.moveTo(-waistHalfW, 0);
  ctx.quadraticCurveTo(0, 1.4, waistHalfW, 0);
  ctx.lineTo(waistHalfW - 0.4, 4.4);
  ctx.quadraticCurveTo(0, 6.2, -waistHalfW + 0.4, 4.4);
  ctx.closePath();
  ctx.fillStyle = pelvisShortsGrad;
  ctx.fill();

  const jerseyGrad = ctx.createLinearGradient(-shoulderHalfW, 0, shoulderHalfW, 0);
  if (isLookingAway) {
    jerseyGrad.addColorStop(0.0, v.jerseyBack0);
    jerseyGrad.addColorStop(0.5, v.jerseyBack1);
    jerseyGrad.addColorStop(1.0, v.jerseyBack2);
  } else {
    jerseyGrad.addColorStop(0.0, v.jerseyFront0);
    jerseyGrad.addColorStop(0.35, v.jerseyFront1);
    jerseyGrad.addColorStop(0.75, v.jerseyFront2);
    jerseyGrad.addColorStop(1.0, v.jerseyFront3);
  }

  const scoopCenterX = !isLookingAway ? (cosYaw * 1.2) : (-sinYaw * 0.8);
  const scoopCenterY = !isLookingAway ? -19.8 : -23.2;
  const strapLeftX = -shoulderHalfW * 0.48;
  const strapRightX = shoulderHalfW * 0.48;

  ctx.beginPath();
  ctx.moveTo(-waistHalfW, waistY);
  if (isSculpted) {
    ctx.quadraticCurveTo(-waistHalfW * 1.15, -12.0, -shoulderHalfW, -24.4);
  } else {
    ctx.lineTo(-shoulderHalfW, -24.4);
  }
  ctx.lineTo(strapLeftX, -24.4);
  ctx.quadraticCurveTo(scoopCenterX, scoopCenterY, strapRightX, -24.4);
  ctx.lineTo(shoulderHalfW, -24.4);
  if (isSculpted) {
    ctx.quadraticCurveTo(shoulderHalfW * 1.05, -12.0, waistHalfW, waistY);
  } else {
    ctx.quadraticCurveTo(shoulderHalfW + 0.8, -14.0, waistHalfW, waistY);
  }
  ctx.quadraticCurveTo(0, waistY + 0.8, -waistHalfW, waistY);
  ctx.closePath();
  ctx.fillStyle = jerseyGrad;
  ctx.fill();

  ctx.strokeStyle = v.seamColor || 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(strapLeftX, -24.4);
  ctx.quadraticCurveTo(scoopCenterX, scoopCenterY, strapRightX, -24.4);
  ctx.stroke();

  if (isSculpted && !isLookingAway && absCos > 0.3) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-shoulderHalfW * 0.65, -16.5);
    ctx.lineTo(0, -15.5);
    ctx.lineTo(shoulderHalfW * 0.65, -16.5);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.moveTo(-waistHalfW, waistY - 1.2);
  ctx.quadraticCurveTo(0, waistY + 0.8, waistHalfW, waistY - 1.2);
  ctx.lineTo(waistHalfW, waistY + 0.6);
  ctx.quadraticCurveTo(0, waistY + 2.6, -waistHalfW, waistY + 0.6);
  ctx.closePath();
  ctx.fill();

  const seamX = cosYaw * 2.2;
  ctx.fillStyle = v.seamColor;
  ctx.beginPath();
  ctx.moveTo(seamX - 0.8, waistY);
  ctx.lineTo(seamX - 1.4, scoopCenterY);
  ctx.lineTo(seamX - 0.4, scoopCenterY);
  ctx.lineTo(seamX + 0.2, waistY);
  ctx.closePath();
  ctx.fill();

  const classNum = v.number || '10';
  if (isLookingAway) {
    const numScale = Math.max(0.4, absSin * 1.0);
    ctx.save();
    ctx.translate(-sinYaw * 1.5, -13.0);
    ctx.scale(numScale, 1.0);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.font = 'bold 8.0px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(classNum, 0, 0);
    ctx.restore();
  } else {
    const crestX = (cosYaw * 3.0) + (sinYaw * -3.2);
    ctx.fillStyle = v.crestColor;
    ctx.beginPath();
    ctx.arc(crestX, -17.8, 1.4, 0, Math.PI * 2);
    ctx.fill();

    if (absCos > 0.45) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.font = 'bold 7.0px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(classNum, -0.5 * cosYaw, -13.0);
    }
  }

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
  }

  ctx.restore();
}
