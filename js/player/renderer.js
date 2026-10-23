// =========================================================================
// PLAYER/RENDERER.JS - GŁÓWNY ORKIESTRATOR RENDEROWANIA POSTACI 2.5D
// Kończyny/jetpack/rany -> ./limbs.js | Fryzury/fizyka włosów -> ./hair.js
// =========================================================================

import { CONFIG } from '../config.js';
import { solve2BoneIK, getArmAnglesForTarget, lerp, lerpAngle } from './ik.js';
import { getFreestyleChoreography, getBiomechanicFootTrajectory } from './locomotion.js';
import {
  isBallInKickReach, getGroundKickTrajectory, getScissorLegTargets,
  getBackflipTargets, getSpartanKickTargets, getProneIKTargets,
  getThrowHandPosition
} from './actions.js';
import { getRagdollRenderPose } from './death.js';
import { drawHeldWeapon, getWeaponHoldTransform } from '../weapons.js';
import { camera } from '../camera.js';
import { drawBackWeapon } from './holsters.js';

import {
  DEFAULT_VISUALS,
  HAIR_STYLE_LIST,
  HAIR_COLOR_LIST,
  setLocalPlayerCustomVisuals,
  getLocalPlayerCustomVisuals,
  localPlayerCustomVisuals,
  getHairPalette,
  drawCharacterHairProfile,
  drawCharacterHairOverEarProfile,
  drawCharacterHairFrontOrBack,
  drawHeadHairPreview
} from './hair.js';

import {
  BEARD_STYLE_LIST,
  BEARD_COLOR_LIST,
  getBeardPalette,
  drawCharacterFacialHairProfile,
  drawHeadBeardPreview
} from './facialHair.js';

import {
  HEADGEAR_STYLE_LIST,
  HEADGEAR_COLOR_LIST,
  getHeadgearPalette,
  drawCharacterHeadgearProfile,
  drawHeadHeadgearPreview
} from './headgear.js';

import {
  MASK_STYLE_LIST,
  MASK_COLOR_LIST,
  doesMaskSupportColor,
  getMaskPalette,
  drawCharacterMaskProfile,
  drawHeadMaskPreview
} from './mask.js';

import {
  NECK_STYLE_LIST,
  doesNeckSupportColor,
  drawCharacterNeckProfile,
  drawHeadNeckPreview
} from './neck.js';

import {
  TORSO_STYLE_LIST,
  TORSO_COLOR_LIST,
  isLongSleeve,
  getCamoType,
  doesTorsoSupportColor,
  getTorsoPalette,
  drawCamoSplotches,
  drawTorsoShirt,
  drawTorsoPreview
} from './torso.js';

import {
  PANTS_STYLE_LIST,
  PANTS_COLOR_LIST,
  isPantsShorts,
  getPantsCamoType,
  doesPantsSupportColor,
  getPantsPalette,
  drawPantsPreview
} from './pants.js';

import {
  SHOES_STYLE_LIST,
  SHOES_STYLE_NAMES,
  SHOES_COLOR_LIST,
  getShoesPalette,
  isHighBoot,
  drawBootCollarOverPants,
  drawFootwear,
  drawShoesPreview
} from './shoes.js';

import {
  JETPACK_STYLE_LIST,
  JETPACK_STYLE_NAMES,
  JETPACK_COLOR_LIST,
  getJetpackFlamePalette,
  drawJetpackPreview,
  drawPersonalGearPreview
} from './jetpack.js';

import {
  drawLimbStump,
  drawHandheldGrenade,
  drawBulletPuncture,
  drawShrapnelSlash,
  drawBloodTrickle,
  drawBloodSoak,
  drawBloodSpecks,
  drawPlateCarrierOverlay,
  drawTorsoWounds,
  drawHeadWoundsProfile,
  drawHeadWoundsFront,
  drawHeadWoundsAway,
  drawTacticalHand,
  renderArm,
  renderIKLeg,
  drawFrontLegOnly,
  getJetpackNozzlePos,
  drawJetpack
} from './limbs.js';

export {
  DEFAULT_VISUALS,
  HAIR_STYLE_LIST,
  HAIR_COLOR_LIST,
  setLocalPlayerCustomVisuals,
  getLocalPlayerCustomVisuals,
  getHairPalette,
  drawCharacterHairProfile,
  drawCharacterHairOverEarProfile,
  drawCharacterHairFrontOrBack,
  drawHeadHairPreview,
  BEARD_STYLE_LIST,
  BEARD_COLOR_LIST,
  getBeardPalette,
  drawCharacterFacialHairProfile,
  drawHeadBeardPreview,
  HEADGEAR_STYLE_LIST,
  HEADGEAR_COLOR_LIST,
  getHeadgearPalette,
  drawCharacterHeadgearProfile,
  drawHeadHeadgearPreview,
  MASK_STYLE_LIST,
  MASK_COLOR_LIST,
  doesMaskSupportColor,
  getMaskPalette,
  drawCharacterMaskProfile,
  drawHeadMaskPreview,
  NECK_STYLE_LIST,
  doesNeckSupportColor,
  drawCharacterNeckProfile,
  drawHeadNeckPreview,
  TORSO_STYLE_LIST,
  TORSO_COLOR_LIST,
  isLongSleeve,
  getCamoType,
  doesTorsoSupportColor,
  getTorsoPalette,
  drawCamoSplotches,
  drawTorsoShirt,
  drawTorsoPreview,
  PANTS_STYLE_LIST,
  PANTS_COLOR_LIST,
  isPantsShorts,
  getPantsCamoType,
  doesPantsSupportColor,
  getPantsPalette,
  drawPantsPreview,
  SHOES_STYLE_LIST,
  SHOES_STYLE_NAMES,
  SHOES_COLOR_LIST,
  getShoesPalette,
  isHighBoot,
  drawBootCollarOverPants,
  drawFootwear,
  drawShoesPreview,
  JETPACK_STYLE_LIST,
  JETPACK_STYLE_NAMES,
  JETPACK_COLOR_LIST,
  getJetpackFlamePalette,
  drawJetpackPreview,
  drawPersonalGearPreview,
  drawLimbStump,
  drawHandheldGrenade,
  drawPlateCarrierOverlay,
  drawTacticalHand,
  renderArm,
  renderIKLeg,
  drawFrontLegOnly,
  getJetpackNozzlePos,
  drawJetpack
};

export function drawPlayer(ctx, GROUND_Y, p) {
  if (!p) return;

  // Frustum culling: pomiń kosztowny render postaci znajdujących się całkowicie poza widokiem kamery
  if (!p._isCreatorPreview && camera && typeof camera.x === 'number' && typeof camera.y === 'number') {
    const margin = 160;
    const zoom = camera.zoom || 0.6;
    const viewW = (camera.viewWidth || (window.innerWidth / zoom));
    const viewH = (camera.viewHeight || (window.innerHeight / zoom));
    const camL = camera.x - margin;
    const camR = camera.x + viewW + margin;
    const camT = camera.y - margin;
    const camB = camera.y + viewH + margin;

    const pL = p.x - 20;
    const pR = p.x + (p.w || 26) + 20;
    const pT = p.y - 45;
    const pB = p.y + (p.h || 70) + 25;

    if (pR < camL || pL > camR || pB < camT || pT > camB) {
      return;
    }
  }

  if (p.isDead && p.acidDeath && p.acidDeath.dissolved) {
    ctx.save();
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4ade80';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    const secLeft = Math.max(1, Math.ceil(p.respawnTimer / 60));
    ctx.fillText(`ROZPUSZCZONO // RESPAWN: ${secLeft}s`, p.x + p.w / 2, (p.acidDeath.hazardY || (p.y + (p.h || 70))) - 24);
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
    ctx.fillText(`RESPAWN: ${Math.ceil(p.respawnTimer / 60)}s`, p.x + p.w / 2, p.y - 14);
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
  } else if (p.spawnProtectionTimer > 0 && !p.isDead) {
    const pulse = 0.55 + 0.35 * Math.sin(performance.now() * 0.016);
    ctx.globalAlpha = pulse;
  }

  const isLocalOrCreator = !!(p._isCreatorPreview || (typeof window !== 'undefined' && p === window.player));
  if (!p._cachedVisuals || p._visualsDirty || isLocalOrCreator) {
    p._cachedVisuals = {
      ...DEFAULT_VISUALS,
      ...(p.currentClass?.visuals || {}),
      ...(isLocalOrCreator ? localPlayerCustomVisuals : {}),
      ...(p.customVisuals || {})
    };
    p._visualsDirty = false;
  }
  const v = p._cachedVisuals;
  v.jetFuel = p.jetFuel;
  v.jetMax = p.jetMax;
  v.isJetpacking = !!p.isJetpacking;
  v.bootsDashing = !!(p.rocketBoots && p.rocketBoots.dashing);
  if (p.currentClass?.id === 'STRIKER') {
    v.hasRocketBoots = true;
  }
  v.heldGrenade = !!(p.throwAnim && p.throwAnim.active && !p.throwAnim.spawned && p.throwAnim.throwType !== 'TOMAHAWK');
  v.heldTomahawk = !!(p.throwAnim && p.throwAnim.active && !p.throwAnim.spawned && p.throwAnim.throwType === 'TOMAHAWK');
  v.grenadeCookRatio = (p.throwAnim && p.throwAnim.active && p.throwAnim.cookTimer) ? Math.min(1.0, p.throwAnim.cookTimer / 300) : 0;
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
  } else if (isGrounded && p.isJumpCharging && speed < 0.8) {
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
  } else if (isGrounded && p.isJumpCharging && speed < 0.8) {
    const cp = (p.jumpChargePower || 0);
    const frontOffset = (7 + cp * 10) * p.facing;
    const backOffset = (-7 - cp * 10) * p.facing;

    rawFootFrontTargetX = hipX + frontOffset;
    rawFootFrontTargetY = plantFloorY;
    rawFootFrontAnkle = (0.08 + cp * 0.20) * p.facing;

    rawFootBackTargetX = hipX + backOffset;
    rawFootBackTargetY = plantFloorY;
    rawFootBackAnkle = (-0.08 - cp * 0.20) * p.facing;

    rawFrontSwing = -0.12 - cp * 0.30;
    rawFrontElbow = 0.60 + cp * 0.40;
    rawBackSwing = 0.12 + cp * 0.30;
    rawBackElbow = 0.60 + cp * 0.40;
  } else if (p.gaitMode === 'IDLE') {
    let braceW = (p.shootPoseWeight || 0);
    if (p.meleeState) {
      braceW = Math.max(braceW, 0.85);
    }
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

    if (isGrounded && p.isJumpCharging) {
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

    if (hold.straightArms && !p.isProne) {
      // W postawie wyprostowanej ramiona celują bezpośrednio w chwyt broni z zachowaniem naturalnego 2-bone IK
      if (!p.isReloading) {
        // Obie ręce podążają za wyliczonym IK chwytu oburęcznego
      }
    }

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
  let armBlend = p.isDead ? 0.90 : ((p.currentWeapon && !p.isHolstered && !p.isDead) ? 0.98 : 0.28);

  // Dynamiczny, natychmiastowy czas reakcji kończyn podczas ataku wręcz (brak opóźnienia i dławienia klatek animacji)
  if (p.meleeState && !p.isDead) {
    armBlend = 0.96;
    footBlend = 0.65;
  }

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
  } else if (isGrounded && p.isJumpCharging && speed < 0.8) {
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

  // Dynamiczne wychylenie torsu w natarciu bronią białą (Melee Torso Tilt)
  if (p.meleeTorsoTilt) {
    pose.torsoTilt += p.meleeTorsoTilt;
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

  v.pistonCompression = (isGrounded && p.isJumpCharging) ? (p.jumpChargePower || (p.blastBelt ? p.blastBelt.chargeRatio : 0)) : 0;
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
      renderIKLeg(ctx, hipLeftX, hipY, pose.footBackX, pose.footBackY, p.thighLen, p.shinLen, pose.footBackAnkle, currentFacingDir, legThighBack, legShinBack, bootBack, false, v, p, 'left');
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
      renderIKLeg(ctx, hipRightX, hipY, pose.footFrontX, pose.footFrontY, p.thighLen, p.shinLen, pose.footFrontAnkle, currentFacingDir, legThighBack, legShinBack, bootBack, false, v, p, 'right');
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

  const pantsStyle = v.pantsStyle || 'cargo_long';
  const pantsColor = v.pantsColor || v.legThighFront || '#18181b';
  const pantsCamo = getPantsCamoType(pantsStyle);
  const pantsPal = getPantsPalette(pantsColor);

  const tracePelvis = () => {
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
  };

  tracePelvis();

  if (pantsCamo) {
    ctx.save();
    ctx.clip();
    drawCamoSplotches(ctx, pantsCamo, -waistHalfW * 1.25, pelvisTopY - 1, waistHalfW * 1.25, pelvisBottomY + 1);
    ctx.restore();
    tracePelvis();
  } else {
    const pelvisGrad = ctx.createLinearGradient(0, pelvisTopY, -fDir * waistHalfW, pelvisBottomY);
    pelvisGrad.addColorStop(0.0, pantsPal.light);
    pelvisGrad.addColorStop(0.45, pantsPal.base);
    pelvisGrad.addColorStop(1.0, pantsPal.dark);
    ctx.fillStyle = pelvisGrad;
    ctx.fill();
  }

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

  // BAZA MUNDURU: TAKTYCZNY COMBAT SHIRT / T-SHIRT (KRÓTKI / DŁUGI RĘKAW, MORO JASNE I CIEMNE)
  drawTorsoShirt(
    ctx, p, v, absCos, absSin, cosYaw, isLookingAway,
    shoulderHalfW, waistHalfW, waistY, fDir, neckBackX, neckFrontX
  );

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

  // Wyposażenie pasa klasy (np. Pas Ładunków Wybuchowych Enforcera)
  p.currentClass?.onDrawBelt?.(ctx, p, v, fDir, waistHalfW, beltTopY, beltBotY);

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
  drawJetpack(ctx, p, currentFacingDir, isLookingAway, absCos, absSin, waistHalfW, shoulderHalfW, v);

  // Broń główna na plecach lub stelażu jetpacka
  const hasJetpackOnBack = !((p.currentClass?.id === 'STRIKER' || p.currentClass?.id === 'ENFORCER') && !v.forceJetpackBackpack);
  drawBackWeapon(ctx, p, currentFacingDir, waistHalfW, shoulderHalfW, v, hasJetpackOnBack);

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

    const rawHeadgear = String((v && v.headgearStyle) || 'none').toLowerCase();
    const isBalaclava = (rawHeadgear === 'balaclava');

    // Małżowina uszna (ukrywana gdy założona jest pełna kominiarka)
    if (!isBalaclava) {
      ctx.fillStyle = v.skinBack;
      ctx.beginPath();
      ctx.ellipse(-2.6, -0.6, 1.6, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = v.skinDark;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(-2.5, -0.6, 1.1, 0.4 * Math.PI, 1.7 * Math.PI, false);
      ctx.stroke();
    }

    // Zarost twarzy (broda, wąs, kilkudniowy cień zarostu na żuchwie i podbródku - rysowany pod włosami)
    drawCharacterFacialHairProfile(ctx, v, hasHelmet);

    // Włosy i fryzura (pokrywające górę, bok głowy, skroń oraz opadające NA zarost wraz z płynną fizyką pasm)
    drawCharacterHairProfile(ctx, p, v, currentFacingDir, pose.torsoTilt, pose.headPitch, hasHelmet);
    drawCharacterHairOverEarProfile(ctx, v, hairPal, hasHelmet);

    // Nakrycie głowy (beret, czapka z daszkiem, kominiarka, bandana, boonie hat, arafatka, gogle)
    drawCharacterHeadgearProfile(ctx, p, v, hasHelmet, currentFacingDir, pose.torsoTilt, pose.headPitch);

    // 2. MODULARNE NAKRYCIE GŁOWY: HEŁM BALISTYCZNY FAST (jeśli założony)
    if (hasHelmet) {
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

    // Rany na twarzy w profilu (tylko na odsłoniętej twarzy)
    if (!isBalaclava) {
      drawHeadWoundsProfile(ctx, dmgRatio);
    }

    // Maska na twarz, okulary przeciwsłoneczne lub chusta
    drawCharacterMaskProfile(ctx, p, v, hasHelmet, currentFacingDir, pose.torsoTilt, pose.headPitch);
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

  // OZDOBA SZYI I KLATKI PIERSIOWEJ (nieśmiertelnik wojskowy / złoty łańcuch)
  // Rysowana na torsie na dekolcie koszulki – całkowicie niezależna od obrotu głowy (headPitch)
  if (isNearProfile && (!p.isDead || p.hasHead)) {
    const headBobOffset = (p.headBob || 0);
    const neckBaseX = (p.isProne && !p.isDead) ? -2.0 * currentFacingDir : 0.0;
    const neckBaseY = (p.isProne && !p.isDead) ? -29.4 + (headBobOffset * 0.25) : -30.5 + (headBobOffset * 0.35);

    ctx.save();
    ctx.translate(neckBaseX, neckBaseY);
    ctx.scale(currentFacingDir, 1);
    drawCharacterNeckProfile(ctx, p, v, currentFacingDir, pose.torsoTilt, 0);
    ctx.restore();
  }

  ctx.restore();

  const armColFront = v.armColorFront || '#e53935';
  const legThighFront = v.legThighFront || '#dc2626';
  const legShinFront = v.legShinFront || '#e53935';
  const bootFront = v.bootColor || '#18181b';

  // KOŃCZYNY I TRZYMANA BROŃ NA PIERWSZYM PLANIE
  // W perspektywie 2D relacja warstw zależy od kierunku patrzenia (facing):
  if (isRightLimbForeground) {
    // 1. PATRZENIE W PRAWO:
    // Prawa noga jest na pierwszym planie za bronią
    if (!isLegFrontDismembered) {
      renderIKLeg(ctx, hipRightX, hipY, pose.footFrontX, pose.footFrontY, p.thighLen, p.shinLen, pose.footFrontAnkle, currentFacingDir, legThighFront, legShinFront, bootFront, true, v, p, 'right');
    } else {
      drawLimbStump(ctx, hipRightX, hipY, pose.torsoTilt, 'leg', currentFacingDir, v, true);
    }

    // Broń trzymana w prawej ręce PRZED prawą nogą
    drawHeldWeapon(ctx, p);

    // Prawe ramię na wierzchu (dłoń obejmuje chwyt broni)
    if (!isArmFrontDismembered) {
      renderArm(ctx, shRightX, shRightY, pose.armFrontSwing, pose.armFrontElbow, currentFacingDir, armColFront, null, true, v, p.upperArmLen, p.forearmLen, p);
    } else {
      drawLimbStump(ctx, shRightX, shRightY, pose.armFrontSwing, 'arm', currentFacingDir, v, true);
    }
  } else {
    // 2. PATRZENIE W LEWO:
    // Broń w prawej dłoni w tle znajduje się ZA pierwszoplanową lewą nogą
    drawHeldWeapon(ctx, p);

    // Lewa noga na pierwszym planie (zasłania broń trzymaną w tle)
    if (!isLegBackDismembered) {
      renderIKLeg(ctx, hipLeftX, hipY, pose.footBackX, pose.footBackY, p.thighLen, p.shinLen, pose.footBackAnkle, currentFacingDir, legThighFront, legShinFront, bootFront, true, v, p, 'left');
    } else {
      drawLimbStump(ctx, hipLeftX, hipY, pose.torsoTilt, 'leg', currentFacingDir, v, true);
    }

    // Lewe ramię na pierwszym planie
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
    ctx.fillText(`RESPAWN: ${Math.ceil(p.respawnTimer / 60)}s`, p.x + p.w / 2, p.y - 14);
    ctx.restore();
  } else if (p.emptyAmmoAlert > 0) {
    ctx.save();
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.fillText('BRAK AMUNICJI', p.x + p.w / 2, p.y - 16);
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

  if (p.spawnProtectionTimer > 0 && !p.isDead) {
    const shieldAlpha = (0.28 + 0.22 * Math.sin(performance.now() * 0.015)) * Math.min(1.0, p.spawnProtectionTimer / 30);
    const cx = p.x + (p.w || 24) * 0.5;
    const cy = p.y + (p.h || 70) * 0.5;
    ctx.save();
    ctx.strokeStyle = `rgba(0, 240, 255, ${shieldAlpha * 1.6})`;
    ctx.fillStyle = `rgba(0, 240, 255, ${shieldAlpha * 0.22})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(cx, cy, (p.w || 24) * 0.9 + 12, (p.h || 70) * 0.55 + 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wskaźnik taktyczny OSŁONA
    ctx.font = '900 9.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(0, 240, 255, ${Math.min(1.0, shieldAlpha * 2.2)})`;
    ctx.fillText('OSŁONA', cx, p.y - 12);
    ctx.restore();
  }

  // Trajektoria celowania miotanego (Granat / Toporek Tomahawk)
  if (p.throwAnim && p.throwAnim.active && p.throwAnim.aiming) {
    drawGrenadeTrajectory(ctx, p, p.throwAnim.targetX, p.throwAnim.targetY, p.throwAnim.power || 1.0, GROUND_Y);
  }

  ctx.restore();
}

export { drawWeaponSilhouette, drawWeaponSlot, drawEntityHealthBar } from '../ui/hudCanvas.js';

/**
 * Rysuje w czasie rzeczywistym trajektorię balistyczną rzutu granatem lub toporkiem
 */
export function drawGrenadeTrajectory(ctx, p, targetX, targetY, power = 1.0, groundY = 500) {
  if (!p) return;
  const isAxeThrow = (p.throwAnim?.throwType === 'TOMAHAWK');
  const pFacing = p.facing || 1;
  const handPos = (typeof getThrowHandPosition === 'function') ? getThrowHandPosition(p) : null;
  const startX = handPos ? handPos.x : (p.x + (p.w || 24) / 2 + pFacing * 14);
  const startY = handPos ? handPos.y : (p.y + (p.h || 70) * 0.42);

  const aimX = (typeof targetX === 'number' && !isNaN(targetX)) ? targetX : (startX + pFacing * 200);
  const aimY = (typeof targetY === 'number' && !isNaN(targetY)) ? targetY : (startY - 0.2 * 200);
  const angle = Math.atan2(aimY - startY, aimX - startX);

  const pwr = (typeof power === 'number' && power > 0) ? Math.min(1.5, Math.max(0.4, power * 1.3)) : 1.0;
  const speedMult = pwr;
  const initialSpeed = isAxeThrow ? (19.5 * speedMult) : ((960 / 60) * speedMult);
  const gVx = Math.cos(angle) * initialSpeed + (p.vx || 0) * 0.35;
  const gVy = Math.sin(angle) * initialSpeed + (p.vy || 0) * 0.25 - (isAxeThrow ? 2.4 : (3.2 * Math.min(1.2, speedMult)));
  const grav = (CONFIG.GRAVITY || 0.38) * (isAxeThrow ? 0.82 : 0.95);

  ctx.save();
  const numDots = 14;
  const zoom = (camera && typeof camera.zoom === 'number' && camera.zoom > 0) ? camera.zoom : 1.0;

  // Taktyczny licznik zapalnika czasowego podczas celowania granatem (Cooking the grenade)
  if (p.throwAnim && p.throwAnim.active && p.throwAnim.aiming) {
    ctx.save();
    ctx.font = '900 11px monospace';
    ctx.textAlign = 'center';

    if (isAxeThrow) {
      ctx.fillStyle = '#fb923c';
      ctx.shadowColor = '#ea580c';
      ctx.shadowBlur = 6;
      ctx.fillText('[RZUT TOPOREK]', startX, startY - 26);
    } else {
      const cookTimer = p.throwAnim.cookTimer || 0;
      const remainingSec = Math.max(0, (300 - cookTimer) / 60);
      const timeStr = remainingSec.toFixed(1) + 's';
      const timeCol = (remainingSec <= 1.5) ? '#ef4444' : (remainingSec <= 3.0 ? '#eab308' : '#00e5ff');
      ctx.fillStyle = timeCol;
      ctx.shadowColor = timeCol;
      ctx.shadowBlur = (remainingSec <= 1.5) ? 8 : 4;
      ctx.fillText('[ZAPALNIK: ' + timeStr + ']', startX, startY - 26);
    }
    ctx.restore();
  }

  for (let step = 1; step <= numDots; step++) {
    const tFrames = step * 3.5;
    const wx = startX + gVx * tFrames;
    const wy = startY + gVy * tFrames + 0.5 * grav * tFrames * tFrames;

    const alpha = Math.max(0.18, 0.85 - (step / numDots) * 0.65);
    const screenRadius = Math.max(2.2, 4.2 - step * 0.16);
    const worldRadius = screenRadius / zoom;

    if (isAxeThrow) {
      ctx.fillStyle = `rgba(251, 146, 60, ${alpha})`;
    } else {
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    }
    ctx.beginPath();
    ctx.arc(wx, wy, worldRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

