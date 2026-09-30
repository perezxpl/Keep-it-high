// =========================================================================
// PLAYER/LOCOMOTION.JS - TRAJEKTORIE LOKOMOCJI I FREESTYLE
// Odpowiada za cykle chodu, truchtu, sprintu oraz sekwencję freestyle.
// =========================================================================

import { CONFIG } from '../config.js';
import { ease, parabola, lerp } from './ik.js';

/**
 * Sekwencja żonglerki i podbicia piłki w intro przed startem
 */
export function getFreestyleChoreography(timer, hipBaseX, hipBaseY, groundY, facing, ballRadius) {
  let loopTimer = timer;
  if (timer > 60) {
    loopTimer = 60 + ((timer - 60) % 150);
  }

  const sweetSpotX = hipBaseX + 16 * facing;
  const plantY = groundY - 3.5;

  let ballX = sweetSpotX;
  let ballY = groundY - ballRadius;
  let footFrontX = sweetSpotX;
  let footFrontY = plantY;
  let footFrontAnkle = 0;
  let footBackX = hipBaseX - 5 * facing;
  let footBackY = plantY;
  let footBackAnkle = 0;
  let hipShiftX = 0;
  let pelvisDip = 0;
  let torsoLean = 0.03;
  let frontLegOverBall = false;
  let trickName = 'PODBICIE Z ZIEMI';

  if (loopTimer < 60) {
    trickName = 'PODBICIE Z ZIEMI';
    hipShiftX = -3 * facing;

    if (loopTimer < 18) {
      const u = ease(loopTimer / 18);
      ballX = hipBaseX + 26 * facing;
      ballY = groundY - ballRadius;

      footFrontX = hipBaseX + (12 + u * 14) * facing;
      footFrontY = plantY - 2;
      footFrontAnkle = 0.18 * u * facing;
      torsoLean = 0.05 * u;
    } else if (loopTimer < 38) {
      const u = ease((loopTimer - 18) / 20);
      ballX = hipBaseX + (26 - u * 10) * facing;
      ballY = groundY - ballRadius;

      footFrontX = ballX + 2 * facing;
      footFrontY = plantY - 1;
      footFrontAnkle = 0.15 * facing;
      frontLegOverBall = true;
    } else {
      const u = (loopTimer - 38) / 22;
      const lift = parabola(u);
      ballX = sweetSpotX;
      ballY = (groundY - ballRadius) - (lift * 32);

      const footSnap = Math.sin(u * Math.PI);
      footFrontX = sweetSpotX;
      footFrontY = plantY - (footSnap * 15);
      footFrontAnkle = -0.28 * footSnap * facing;
      pelvisDip = -footSnap * 1.5;
    }

    footBackX = hipBaseX - 5 * facing;
    footBackY = plantY;
  } else if (loopTimer < 150) {
    const subTimer = loopTimer - 60;
    const rep = Math.floor(subTimer / 22);
    const u = (subTimer % 22) / 22;
    const isRightFoot = (rep % 2 === 0);

    trickName = isRightFoot ? 'KAPKOWANIE: PRAWA' : 'KAPKOWANIE: LEWA';

    const ballArc = parabola(u);
    ballX = sweetSpotX;
    ballY = (groundY - ballRadius - 8) - (ballArc * 26);

    if (isRightFoot) {
      hipShiftX = -4 * facing;
      pelvisDip = Math.sin(u * Math.PI) * 1.5;

      const kickSnap = Math.max(0, Math.sin(u * Math.PI * 1.8));
      footFrontX = sweetSpotX;
      footFrontY = plantY - 2 - (kickSnap * 14);
      footFrontAnkle = (0.12 - (kickSnap * 0.35)) * facing;

      footBackX = hipBaseX - 5 * facing;
      footBackY = plantY;
      footBackAnkle = 0;
    } else {
      hipShiftX = 2 * facing;
      pelvisDip = Math.sin(u * Math.PI) * 1.5;

      footFrontX = hipBaseX + 6 * facing;
      footFrontY = plantY;
      footFrontAnkle = 0;

      const kickSnap = Math.max(0, Math.sin(u * Math.PI * 1.8));
      footBackX = sweetSpotX - (2 * facing) + (kickSnap * 2 * facing);
      footBackY = plantY - 2 - (kickSnap * 14);
      footBackAnkle = (0.12 - (kickSnap * 0.35)) * facing;
    }
  } else {
    trickName = 'AROUND THE WORLD';
    const u = (loopTimer - 150) / 60;
    hipShiftX = -4 * facing;

    const ballArc = parabola(u);
    ballX = sweetSpotX;
    ballY = (groundY - ballRadius - 10) - (ballArc * 36);

    if (u < 0.20) {
      const snap = Math.sin((u / 0.20) * Math.PI);
      footFrontX = sweetSpotX;
      footFrontY = plantY - (snap * 16);
      footFrontAnkle = -0.25 * facing;
      frontLegOverBall = false;
    } else if (u < 0.45) {
      const upU = (u - 0.20) / 0.25;
      footFrontX = sweetSpotX - (2 * facing);
      footFrontY = (plantY - 16) - upU * (plantY - ballY);
      footFrontAnkle = -0.15 * facing;
      frontLegOverBall = false;
    } else if (u < 0.72) {
      const downU = (u - 0.45) / 0.27;
      footFrontX = sweetSpotX + (1 * facing);
      footFrontY = (ballY - 16) + downU * 36;
      footFrontAnkle = 0.28 * downU * facing;
      frontLegOverBall = true;
      pelvisDip = -Math.sin(downU * Math.PI) * 2;
    } else {
      const landU = (u - 0.72) / 0.28;
      footFrontX = sweetSpotX;
      footFrontY = plantY - ((1 - landU) * 6);
      footFrontAnkle = 0.10 * facing;
      frontLegOverBall = false;
    }

    footBackX = hipBaseX - 5 * facing;
    footBackY = plantY;
  }

  return {
    ballX, ballY,
    footFrontX, footFrontY, footFrontAnkle,
    footBackX, footBackY, footBackAnkle,
    hipShiftX, pelvisDip, torsoLean,
    frontLegOverBall, trickName
  };
}

/**
 * Trajektoria stóp w sprincie
 */
export function getSprintFootTrajectory(p) {
  const t = p / (Math.PI * 2);
  let lx, ly, ankle;
  const maxPushLift = 7.5;

  if (t < 0.32) {
    const u = t / 0.32;
    const eu = ease(u);
    lx = 20 - eu * 58;
    ankle = lerp(0.08, 0.54, eu);
    ly = -Math.sin(ankle) * maxPushLift;
  } else if (t < 0.58) {
    const u = (t - 0.32) / 0.26;
    const eu = ease(u);
    lx = -38 + eu * 22;
    const startY = -Math.sin(0.54) * maxPushLift;
    const peakY = -42;
    ly = lerp(startY, peakY, Math.sin(eu * Math.PI * 0.5));
    ankle = lerp(0.54, -0.12, eu);
  } else if (t < 0.82) {
    const u = (t - 0.58) / 0.24;
    const eu = ease(u);
    lx = -16 + eu * 54;
    ly = -42 + (eu * 24);
    ankle = lerp(-0.12, 0.10, eu);
  } else {
    const u = (t - 0.82) / 0.18;
    const eu = ease(u);
    lx = 38 - eu * 18;
    ly = -18 + eu * 18;
    ankle = lerp(0.10, 0.08, eu);
  }

  return { lx, ly, ankle };
}

/**
 * Biomechaniczne trajektorie stóp dla różnych trybów lokomocji
 */
export function getBiomechanicFootTrajectory(phase, mode, speed, playerRef) {
  const p = ((phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

  if (mode === 'SPRINT') {
    return getSprintFootTrajectory(p);
  }

  let lx = 0, ly = 0, ankle = 0;

  if (mode === 'CROUCH_WALK') {
    let strideLen = 14;
    let ankleOffset = 0;
    if (playerRef && playerRef.isMovingBackwards) {
      strideLen = 14 * 0.7;
      ankleOffset = 0.2;
    }
    const stanceLimit = 0.55;
    const pr = p / (Math.PI * 2);

    if (pr < stanceLimit) {
      const u = pr / stanceLimit;
      lx = (0.5 - u) * (strideLen * 2);
      ly = -6.5;
      ankle = lerp(0.32, 0.60, ease(u)) + ankleOffset;
    } else {
      const u = (pr - stanceLimit) / (1.0 - stanceLimit);
      lx = (-0.5 + ease(u)) * (strideLen * 2);
      ly = -6.5 - Math.sin(u * Math.PI) * 7.5;
      ankle = lerp(0.60, 0.32, ease(u)) + ankleOffset;
    }
  } else if (mode === 'WALK') {
    const stanceRatio = 0.58;
    const stanceLimit = Math.PI * 2 * stanceRatio;
    const strideLen = 18.5;
    const stepHeight = 11.5;
    const toePinLiftMax = 5.8;

    if (p < stanceLimit) {
      const u = p / stanceLimit;
      lx = (0.5 - u) * (strideLen * 2);

      if (u < 0.18) {
        const hu = ease(u / 0.18);
        ankle = lerp(-0.12, 0.0, hu);
        ly = 0;
      } else if (u < 0.62) {
        ankle = 0.0;
        ly = 0;
      } else {
        const tu = ease((u - 0.62) / 0.38);
        ankle = lerp(0.0, 0.42, tu);
        ly = -Math.sin(ankle) * toePinLiftMax;
      }
    } else {
      const u = (p - stanceLimit) / (Math.PI * 2 - stanceLimit);
      const eu = ease(u);
      lx = (-0.5 + eu) * (strideLen * 2);

      const endLift = Math.sin(0.42) * toePinLiftMax;
      ly = -Math.sin(u * Math.PI) * stepHeight - endLift * (1.0 - u) * (1.0 - u);

      if (u < 0.25) {
        const su = ease(u / 0.25);
        ankle = lerp(0.42, -0.04, su);
      } else if (u < 0.75) {
        ankle = -0.04;
      } else {
        const prep = ease((u - 0.75) / 0.25);
        ankle = lerp(-0.04, -0.12, prep);
      }
    }
  } else if (mode === 'JOG') {
    const stanceRatio = 0.42;
    const stanceLimit = Math.PI * 2 * stanceRatio;
    const strideLen = 22 + ((speed - CONFIG.WALK_MAX) / (CONFIG.JOG_MAX - CONFIG.WALK_MAX)) * 4.5;
    const stepHeight = 15.5;
    const toePinLiftMax = 7.5;

    if (p < stanceLimit) {
      const u = p / stanceLimit;
      const eu = ease(u);
      lx = (0.5 - eu) * strideLen * 2;

      if (u < 0.18) {
        const hu = ease(u / 0.18);
        ankle = lerp(-0.14, 0.0, hu);
        ly = 0;
      } else if (u < 0.55) {
        ankle = 0.0;
        ly = 0;
      } else {
        const tu = ease((u - 0.55) / 0.45);
        ankle = lerp(0.0, 0.52, tu);
        ly = -Math.sin(ankle) * toePinLiftMax;
      }
    } else {
      const u = (p - stanceLimit) / (Math.PI * 2 - stanceLimit);
      const eu = ease(u);
      lx = (-0.5 + eu) * strideLen * 2;

      const endLift = Math.sin(0.52) * toePinLiftMax;
      ly = -Math.sin(u * Math.PI) * stepHeight - endLift * (1.0 - u) * (1.0 - u);

      if (u < 0.3) {
        const su = ease(u / 0.3);
        ankle = lerp(0.52, 0.10, su);
      } else if (u < 0.7) {
        const su = ease((u - 0.3) / 0.4);
        ankle = lerp(0.10, -0.05, su);
      } else {
        const su = ease((u - 0.7) / 0.3);
        ankle = lerp(-0.05, -0.14, su);
      }
    }
  }

  return { lx, ly, ankle };
}
