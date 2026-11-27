// =========================================================================
// PLAYER/LOCOMOTION.JS - TRAJEKTORIE LOKOMOCJI
// Odpowiada za cykle chodu, truchtu i sprintu.
// =========================================================================

import { CONFIG } from '../config.js';
import { ease, parabola, lerp } from './ik.js';

/**
 * Sprawdza stan kucania lub leżenia pod wejściem klawisza Ctrl / przycisku kucania na podstawie czasu trzymania:
 * - Początek trzymania / krótkie wciśnięcie (holdDuration < 450 ms): CROUCH
 * - Przytrzymanie dłużej (holdDuration >= 450 ms, w oknie 400-500 ms): płynne przejście w PRONE
 * - Puszczenie wejścia: STAND (o ile nie blokuje go sufit)
 *
 * @param {Object} player - Obiekt gracza
 * @param {boolean} crouchInputHeld - Czy klawisz crouch / Ctrl jest trzymany
 * @param {number} [holdDurationMs=0] - Czas trzymania w ms
 * @returns {'CROUCH' | 'PRONE' | 'STAND'}
 */
export function evaluateCrouchState(player, crouchInputHeld, holdDurationMs = 0) {
  if (!player || player.isDead) return 'STAND';
  if (!crouchInputHeld) return 'STAND';

  const isGrounded = (player.onGround !== undefined) ? (player.onGround && !player.isJumping) : (!player.isJumping);
  if (!isGrounded) return 'STAND';

  if (holdDurationMs >= 450) {
    return 'PRONE';
  }
  return 'CROUCH';
}

/**
 * Trajektoria stóp w sprincie
 */
export function getSprintFootTrajectory(p, strideMult = 1.0) {
  const t = p / (Math.PI * 2);
  let lx, ly, ankle;
  const maxPushLift = 7.5;

  if (t < 0.32) {
    const u = t / 0.32;
    const eu = ease(u);
    lx = (20 - eu * 58) * strideMult;
    ankle = lerp(0.08, 0.54, eu);
    ly = -Math.sin(ankle) * maxPushLift;
  } else if (t < 0.58) {
    const u = (t - 0.32) / 0.26;
    const eu = ease(u);
    lx = (-38 + eu * 22) * strideMult;
    const startY = -Math.sin(0.54) * maxPushLift;
    const peakY = -42;
    ly = lerp(startY, peakY, Math.sin(eu * Math.PI * 0.5));
    ankle = lerp(0.54, -0.12, eu);
  } else if (t < 0.82) {
    const u = (t - 0.58) / 0.24;
    const eu = ease(u);
    lx = (-16 + eu * 54) * strideMult;
    ly = -42 + (eu * 24);
    ankle = lerp(-0.12, 0.10, eu);
  } else {
    const u = (t - 0.82) / 0.18;
    const eu = ease(u);
    lx = (38 - eu * 18) * strideMult;
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
  const isGroundDashing = !!(playerRef?.rocketBoots?.dashing && playerRef?.rocketBoots?.dashType === 'GROUND');
  const strideMult = isGroundDashing ? 1.45 : 1.0;

  if (mode === 'SPRINT') {
    return getSprintFootTrajectory(p, strideMult);
  }

  let lx = 0, ly = 0, ankle = 0;

  if (mode === 'CROUCH_WALK') {
    // Chód w niskim pochyleniu (tactical prowl / hunched stalker walk):
    // Stopy stąpają cicho i stabilnie po ziemi (ly = 0 w fazie podparcia, brak sztucznego unoszenia stóp w powietrzu),
    // unosząc się płasko i miękko (stepHeight = 4.8 px) w fazie wykroku.
    let strideLen = 15.0;
    let ankleOffset = 0;
    if (playerRef && playerRef.isMovingBackwards) {
      strideLen = 12.0;
      ankleOffset = 0.05;
    }
    const stanceRatio = 0.58;
    const stanceLimit = stanceRatio;
    const pr = p / (Math.PI * 2);

    if (pr < stanceLimit) {
      const u = pr / stanceLimit;
      lx = (0.5 - u) * (strideLen * 2);
      ly = 0;
      // Płynne przetoczenie stopy: miękki kontakt -> płaskie podparcie -> lekkie uniesienie pięty na palcach
      if (u < 0.22) {
        ankle = lerp(-0.06, 0.0, ease(u / 0.22)) + ankleOffset;
      } else if (u < 0.65) {
        ankle = 0.0 + ankleOffset;
      } else {
        const tu = ease((u - 0.65) / 0.35);
        ankle = lerp(0.0, 0.22, tu) + ankleOffset;
        ly = -Math.sin(ankle) * 1.8;
      }
    } else {
      const u = (pr - stanceLimit) / (1.0 - stanceLimit);
      const eu = ease(u);
      lx = (-0.5 + eu) * (strideLen * 2);
      const stepHeight = 3.6; // Niski, zwinny krok skradania (stealth prowl)
      ly = -Math.sin(u * Math.PI) * stepHeight;
      ankle = lerp(0.22, -0.06, eu) + ankleOffset;
    }
  } else if (mode === 'WALK') {
    const stanceRatio = 0.58;
    const stanceLimit = Math.PI * 2 * stanceRatio;
    const strideLen = 18.5 * strideMult;
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
    const strideLen = (22 + ((speed - CONFIG.WALK_MAX) / (CONFIG.JOG_MAX - CONFIG.WALK_MAX)) * 4.5) * strideMult;
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
