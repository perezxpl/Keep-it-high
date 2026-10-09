// =========================================================================
// PLAYER/LOCOMOTION.JS - TRAJEKTORIE LOKOMOCJI I FREESTYLE
// Odpowiada za cykle chodu, truchtu, sprintu oraz sekwencję freestyle.
// =========================================================================

import { CONFIG } from '../config.js';
import { ease, parabola, lerp } from './ik.js';

export const MIN_RUN_SPEED = 2.5; // Minimalna prędkość pozioma (~150 px/s przy 60 FPS) wymagana do ślizgu

/**
 * Sprawdza, czy postać może wykonać ślizg (Slide):
 * Ślizg możliwy WYŁĄCZNIE w pełnym biegu (na ziemi i z prędkością > MIN_RUN_SPEED).
 *
 * @param {Object} player - Obiekt gracza
 * @returns {boolean}
 */
export function canSlide(player) {
  if (!player || player.isDead || player.isIntro) return false;
  const isGrounded = (player.onGround !== undefined) ? (player.onGround && !player.isJumping) : (!player.isJumping);
  const minSpeed = CONFIG.MIN_RUN_SPEED || MIN_RUN_SPEED;
  return isGrounded && Math.abs(player.vx) > minSpeed;
}

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
  if (!player || player.isDead || player.isIntro) return 'STAND';
  if (!crouchInputHeld) return 'STAND';

  const isGrounded = (player.onGround !== undefined) ? (player.onGround && !player.isJumping) : (!player.isJumping);
  if (!isGrounded) return 'STAND';

  if (holdDurationMs >= 450) {
    return 'PRONE';
  }
  return 'CROUCH';
}

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
  const maxPushLift = 12.5;

  // Cykl sprintu: 34% faza podparcia (kontakt na śródstopiu / palcach), 66% faza wymachu (wysokie uniesienie kolana)
  if (t < 0.34) {
    // 1. FAZA PODPARCIA (STANCE): liniowy ruch podłoża względem bioder bez ślizgania
    const u = t / 0.34;
    lx = 22 - u * 52;
    // Wybicie z palców / plantarflexion: agresywne zgięcie stopy i uniesienie pięty
    const push = Math.pow(u, 1.20);
    ankle = lerp(0.10, 0.82, push);
    ly = -Math.sin(ankle) * maxPushLift;
  } else if (t < 0.62) {
    // 2. PODRYW I WYBICIE (TOE-OFF & HIGH KNEE DRIVE): stopa podciągana pod pośladek
    const u = (t - 0.34) / 0.28;
    const eu = ease(u);
    lx = -30 + eu * 24;
    const startY = -Math.sin(0.82) * maxPushLift;
    const peakY = -38;
    ly = lerp(startY, peakY, Math.sin(eu * Math.PI * 0.5));
    ankle = lerp(0.82, -0.06, eu);
  } else if (t < 0.84) {
    // 3. PRZENIESIENIE W PRZÓD (LEG EXTENSION FORWARD): kolano w przód, goleń rozprostowuje się
    const u = (t - 0.62) / 0.22;
    const eu = ease(u);
    lx = -6 + eu * 34;
    ly = -38 + eu * 24;
    ankle = lerp(-0.06, 0.12, eu);
  } else {
    // 4. PRZYGOTOWANIE DO LĄDOWANIA (GROUND CAPTURE): aktywne opuszczenie stopy na śródstopie
    const u = (t - 0.84) / 0.16;
    const eu = ease(u);
    lx = 28 - eu * 6;
    const landY = -Math.sin(0.10) * maxPushLift;
    ly = lerp(-14, landY, eu);
    ankle = lerp(0.12, 0.10, eu);
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
    const isBack = playerRef && playerRef.isMovingBackwards;
    const baseStride = 13.5;
    const strideLen = isBack ? baseStride * 0.75 : baseStride;
    const stanceRatio = 0.58;
    const pr = p / (Math.PI * 2);

    if (pr < stanceRatio) {
      // 1. FAZA PODPARCIA (STANCE): Stopa stabilnie na podłożu z wyraźnym przetoczeniem i wybiciem
      const u = pr / stanceRatio;
      lx = (0.5 - u) * (strideLen * 2);

      if (u < 0.20) {
        // Wejście na podłoże: płaskie / neutralne przyleganie podeszwy
        const hu = ease(u / 0.20);
        ankle = lerp(-0.08, 0.0, hu);
        ly = 0;
      } else if (u < 0.52) {
        // Midstance: cała podeszwa pewnie i stabilnie na ziemi
        ankle = 0.0;
        ly = 0;
      } else {
        // Push-off: wyraźne uniesienie pięty i praca palców (toe-break flex)
        const tu = ease((u - 0.52) / 0.48);
        ankle = lerp(0.0, 0.68, tu);
        ly = -Math.sin(ankle) * 6.5;
      }
    } else {
      // 2. FAZA PRZENIESIENIA (SWING): Płynny łuk uniesienia stopy nad gruntem
      const u = (pr - stanceRatio) / (1.0 - stanceRatio);
      const eu = ease(u);
      lx = (-0.5 + eu) * (strideLen * 2);

      const startLift = Math.sin(0.68) * 6.5;
      ly = -Math.sin(u * Math.PI) * 9.5 - startLift * (1.0 - u) * (1.0 - u);

      if (u < 0.28) {
        // Odejście od podłoża: sprężysty powrót palców ku pozycji neutralnej
        const su = ease(u / 0.28);
        ankle = lerp(0.68, 0.04, su);
      } else if (u < 0.72) {
        ankle = 0.04;
      } else {
        // Przygotowanie do lądowania stopy
        const prep = ease((u - 0.72) / 0.28);
        ankle = lerp(0.04, -0.08, prep);
      }
    }
  } else if (mode === 'WALK') {
    const isBack = playerRef && playerRef.isMovingBackwards;
    const stanceRatio = 0.58;
    const stanceLimit = Math.PI * 2 * stanceRatio;
    const baseStride = 16.5;
    const strideLen = isBack ? baseStride * 0.78 : baseStride;
    const stepHeight = 11.5;
    const toePinLiftMax = 9.5;

    if (p < stanceLimit) {
      // 1. FAZA PODPARCIA (STANCE PHASE): Stopa na podłożu przemieszcza się liniowo w tył
      const u = p / stanceLimit;
      lx = (0.5 - u) * (strideLen * 2);

      if (u < 0.16) {
        // Heel strike -> płynne przetoczenie na całą podeszwę (Loading Response)
        const hu = ease(u / 0.16);
        ankle = lerp(-0.16, 0.0, hu);
        ly = 0;
      } else if (u < 0.50) {
        // Midstance: cała podeszwa idealnie płasko na ziemi
        ankle = 0.0;
        ly = 0;
      } else {
        // Push-off / Terminal Stance: wyraźne uniesienie pięty ze sprężystym zgięciem palców (toe-break)
        const tu = ease((u - 0.50) / 0.50);
        ankle = lerp(0.0, 0.65, tu);
        ly = -Math.sin(ankle) * toePinLiftMax;
      }
    } else {
      // 2. FAZA PRZENIESIENIA (SWING PHASE): Płynny łuk nad podłożem bez szarpania
      const u = (p - stanceLimit) / (Math.PI * 2 - stanceLimit);
      const eu = ease(u);
      lx = (-0.5 + eu) * (strideLen * 2);

      const startLift = Math.sin(0.65) * toePinLiftMax;
      ly = -Math.sin(u * Math.PI) * stepHeight - startLift * (1.0 - u) * (1.0 - u);

      if (u < 0.25) {
        // Wyjście z wybicia: powrót stopy do pozycji neutralnej / lekkiego uniesienia palców
        const su = ease(u / 0.25);
        ankle = lerp(0.65, -0.04, su);
      } else if (u < 0.75) {
        // Mid-swing: stopa neutralna, bezpieczny prześwit nad podłożem
        ankle = -0.04;
      } else {
        // Terminal swing: przygotowanie do kontaktu pięty z podłożem (dorsiflexion)
        const prep = ease((u - 0.75) / 0.25);
        ankle = lerp(-0.04, -0.16, prep);
      }
    }
  } else if (mode === 'JOG') {
    const isBack = playerRef && playerRef.isMovingBackwards;
    const stanceRatio = 0.44;
    const stanceLimit = Math.PI * 2 * stanceRatio;
    const baseStride = 21.0 + ((speed - CONFIG.WALK_MAX) / Math.max(0.1, CONFIG.JOG_MAX - CONFIG.WALK_MAX)) * 3.5;
    const strideLen = isBack ? baseStride * 0.78 : baseStride;
    const stepHeight = 14.5;
    const toePinLiftMax = 11.5;

    if (p < stanceLimit) {
      // 1. FAZA PODPARCIA (STANCE): liniowe prowadzenie stopy po podłożu
      const u = p / stanceLimit;
      lx = (0.5 - u) * (strideLen * 2);

      if (u < 0.15) {
        const hu = ease(u / 0.15);
        ankle = lerp(-0.14, 0.0, hu);
        ly = 0;
      } else if (u < 0.48) {
        ankle = 0.0;
        ly = 0;
      } else {
        const tu = ease((u - 0.48) / 0.52);
        ankle = lerp(0.0, 0.72, tu);
        ly = -Math.sin(ankle) * toePinLiftMax;
      }
    } else {
      // 2. FAZA PRZENIESIENIA (SWING): paraboliczny łuk kroku biegowego
      const u = (p - stanceLimit) / (Math.PI * 2 - stanceLimit);
      const eu = ease(u);
      lx = (-0.5 + eu) * (strideLen * 2);

      const startLift = Math.sin(0.72) * toePinLiftMax;
      ly = -Math.sin(u * Math.PI) * stepHeight - startLift * (1.0 - u) * (1.0 - u);

      if (u < 0.25) {
        const su = ease(u / 0.25);
        ankle = lerp(0.72, 0.04, su);
      } else if (u < 0.70) {
        const su = ease((u - 0.25) / 0.45);
        ankle = lerp(0.04, -0.04, su);
      } else {
        const su = ease((u - 0.70) / 0.30);
        ankle = lerp(-0.04, -0.14, su);
      }
    }
  }

  return { lx, ly, ankle };
}
