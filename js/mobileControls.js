// =========================================================================
// MOBILECONTROLS.JS - ZAAWANSOWANE STEROWANIE DOTYKOWE (MOBILE CONTROLS)
// Obsługuje wirtualne drążki, dynamiczny kontekstowy przycisk (Wślizg / Leżenie)
// oraz gesty kopnięcia z prawego drążka (Right Stick Kick).
// =========================================================================

import { CONFIG } from './config.js';
import { performKick, kick, playerSlide, isBallInKickReach, triggerSpartanKick, findMeleeTarget } from './player/actions.js?v=v74_creator_fix';
import { ball } from './ball.js?v=v74_creator_fix';
import { activeArenaId as obstacleArenaId } from './obstacles.js?v=v74_creator_fix';

export function isArena1() {
  const cur = (typeof window !== 'undefined' && window.activeArenaId)
    ? window.activeArenaId
    : obstacleArenaId;
  return (cur === 'ARENA_1' || cur === 'arena-1' || cur === '1');
}

export const leftStick = {
  active: false,
  id: null,
  baseX: 0,
  baseY: 0,
  curX: 0,
  curY: 0,
  axisX: 0,
  axisY: 0,
  maxRadius: 55,

  // Skok i obsługa jetpacka na lewym drążku
  jumpTriggered: false,
  jetpackNeutralized: true,
  waitingForJetpackTap: false,
  jetpackWindowTimer: 0,
  isJetpacking: false,
  jetpackAirborneSession: false,
  downIntent: false,
  downStartTime: 0,
  downFlickDetected: false
};

export const rightStick = {
  active: false,
  id: null,
  baseX: 0,
  baseY: 0,
  curX: 0,
  curY: 0,
  axisX: 0,
  axisY: 0,
  power: 0,
  movedDist: 0,
  maxRadius: 58,

  // Tryb wyposażenia drążka: 'FIREARM' (broń palna) lub 'GRENADE' (broń miotana)
  armedMode: 'FIREARM',

  // Obsługa strzelania i rzutu granatem
  touchStartTime: 0,
  startX: 0,
  startY: 0,
  isShooting: false,
  shotgunFiredThisTap: false,

  // Płynne przeciąganie ikony na prawy drążek (Drag & Drop)
  draggedSlot: null, // null lub { type: 'FIREARM'|'GRENADE', startX, startY, curX, curY, touchId }

  waitingForSecondTap: false,
  windowTimer: 0,
  lingerAlpha: 0,
  gestureState: 'IDLE'
};

// =========================================================================
// KIESZENIE WOKÓŁ PRAWEGO DRĄŻKA (POCKETS) & DYNAMICZNY PRZYCISK RUCHU
// =========================================================================
export const pockets = {
  // 1. Kieszeń na broń palną (puszczenie < 1s = zmiana broni, przytrzymanie 1s = przeładowanie, przeciągnięcie = założenie na drążek)
  firearm: {
    x: 0,
    y: 0,
    r: 26,
    active: false,
    id: null,
    touchStartTime: 0,
    startX: 0,
    startY: 0,
    isDragging: false,
    reloadTriggered: false
  },

  // 2. Kieszeń na broń miotaną (granat)
  throwable: {
    x: 0,
    y: 0,
    r: 26,
    active: false,
    id: null,
    touchStartTime: 0,
    startX: 0,
    startY: 0,
    isDragging: false
  },

  // 3. Zunifikowany 1 przycisk akcji (wślizg / kładzenie się / wstawanie / kopniak)
  action: {
    x: 0,
    y: 0,
    r: 28,
    active: false,
    id: null,
    currentMode: 'KICK' // 'SLIDE' | 'PRONE' | 'STAND' | 'KICK'
  }
};

export const btnCluster = {
  firearm: pockets.firearm,
  throwable: pockets.throwable,
  action: pockets.action,
  slide: pockets.action,
  prone: pockets.action,
  crouch: pockets.action,
  grenade: pockets.throwable,
  kick: pockets.action
};

/**
 * Aktualizuje pozycje przycisków dotykowych na ekranie
 * @param {number} W - Szerokość ekranu
 * @param {number} H - Wysokość ekranu
 */
export function updateButtonLayout(W, H) {
  const curW = (typeof W === 'number' && W > 0) ? W : (typeof window !== 'undefined' ? window.innerWidth : 800);
  const curH = (typeof H === 'number' && H > 0) ? H : (typeof window !== 'undefined' ? window.innerHeight : 600);

  // Sztywno umiejscowione, ergonomiczne pozycje drążków dotykowych
  leftStick.baseX = Math.round(Math.min(135, Math.max(95, curW * 0.14)));
  leftStick.baseY = Math.round(curH - Math.min(135, Math.max(95, curH * 0.28)));
  leftStick.maxRadius = 55;
  if (!leftStick.active) {
    leftStick.curX = leftStick.baseX;
    leftStick.curY = leftStick.baseY;
  }

  rightStick.baseX = Math.round(curW - Math.min(135, Math.max(95, curW * 0.14)));
  rightStick.baseY = Math.round(curH - Math.min(135, Math.max(95, curH * 0.28)));
  rightStick.maxRadius = 58;
  if (!rightStick.active) {
    rightStick.curX = rightStick.baseX;
    rightStick.curY = rightStick.baseY;
  }

  const rsX = rightStick.baseX;
  const rsY = rightStick.baseY;

  // Ergonomiczne rozmieszczenie przycisków w łuku/kolumnie przy prawej dolnej krawędzi:
  // - Przycisk ruchów najniżej (blisko dolnej krawędzi ekranu)
  // - Po środku broń miotana (granat)
  // - Wyżej broń palna (AK47 / Shotgun)
  const bottomMargin = Math.max(40, Math.min(52, Math.round(curH * 0.09)));
  const btnSpacing = Math.max(54, Math.min(60, Math.round(curH * 0.125)));

  // 1. Zunifikowany przycisk akcji dynamicznej (wślizg / kładzenie się / kopniak) – NAJNIŻEJ, blisko dolnej krawędzi
  pockets.action.r = 27;
  pockets.action.x = Math.round(rsX - 78);
  pockets.action.y = Math.round(curH - bottomMargin);

  // 2. Kieszeń na broń miotaną (granat) – PO ŚRODKU
  pockets.throwable.r = 26;
  pockets.throwable.x = Math.round(rsX - 84);
  pockets.throwable.y = Math.round(pockets.action.y - btnSpacing);

  // 3. Kieszeń na broń palną – WYŻEJ
  pockets.firearm.r = 26;
  pockets.firearm.x = Math.round(rsX - 76);
  pockets.firearm.y = Math.round(pockets.throwable.y - btnSpacing);
}

/**
 * Monitoruje ruch postaci i dynamicznie przełącza kontekstowy tryb przycisku akcji:
 * - W pełnym biegu (|vx| > MIN_RUN_SPEED): WŚLIZG (SLIDE)
 * - W kucaniu / leżeniu: KŁADZENIE SIĘ / WSTAWANIE (PRONE / STAND)
 * - W pozostałych stanach: KOPNIAK (KICK)
 *
 * @param {Object} player - Obiekt gracza
 * @param {Object} [lStick] - Lewy drążek
 * @param {Object} [bCluster] - Zespół przycisków
 */
export function updateMobileControlStates(player, lStick = leftStick, bCluster = btnCluster) {
  if (!player) return;

  const jogMax = player.currentClass?.stats?.jogMax || CONFIG.JOG_MAX || 4.2;
  const sprintMax = player.currentClass?.stats?.sprintMax || CONFIG.SPRINT_MAX || 6.8;
  const minSprintSpeed = Math.max(jogMax + 0.15, sprintMax * 0.80);
  const isSprinting = (
    player.onGround &&
    !player.isJumping &&
    player.gaitMode === 'SPRINT' &&
    Math.abs(player.vx) >= minSprintSpeed &&
    (player.sprintDuration || 0) >= 8
  );
  const cooldownOk = (!player.slideCooldown || player.slideCooldown <= 0);

  if (player.isProne) {
    pockets.action.currentMode = 'STAND';
  } else if (player.isCrouching) {
    // Tryb leżenia jest dostępny WYŁĄCZNIE kiedy gracz kuca!
    pockets.action.currentMode = 'PRONE';
  } else if (isSprinting && cooldownOk) {
    pockets.action.currentMode = 'SLIDE';
  } else {
    // Kiedy stoi normalnie (nie kuca, nie leży, nie jest rozpędzony do sprintu) – KICK (Spartan Kick / wykop piłki w Arenie 1)
    pockets.action.currentMode = 'KICK';
  }
}

/**
 * Obsługa wciśnięcia zunifikowanego przycisku akcji dynamicznej:
 * - 'SLIDE': wślizg po rozpędzeniu do sprintu
 * - 'PRONE': położenie się na ziemi (dostępne TYLKO podczas kucania)
 * - 'STAND': wstanie na równe nogi
 * - 'KICK': wykop piłki w Arenie 1 LUB Spartan Kick w starciu wręcz / Arenach 2 i 3
 *
 * @param {Object} player - Obiekt gracza
 * @param {Function} spawnGrass - Funkcja spawnu cząsteczek
 * @param {number} GROUND_Y - Poziom podłoża
 * @param {Object} [extraOptions] - Dodatkowe opcje (ball, targets, obstacles)
 * @returns {boolean|string}
 */
export function handleDynamicActionButtonPress(player, spawnGrass, GROUND_Y, extraOptions = {}) {
  if (!player || player.isDead || player.isIntro) return false;

  const mode = pockets.action.currentMode || 'KICK';

  if (mode === 'SLIDE') {
    if (player.onGround) {
      return playerSlide(spawnGrass, GROUND_Y, player);
    }
  } else if (mode === 'PRONE') {
    // Tryb leżenia ma być dostępny TYLKO kiedy gracz kuca
    if (!player.isCrouching) return false;

    player.isProne = true;
    player.isCrouching = false;
    player.crouchToggled = true;
    player.state = 'PRONE';
    player.hitboxHeight = 26;
    pockets.action.currentMode = 'STAND';
    return true;
  } else if (mode === 'STAND') {
    player.isProne = false;
    player.isCrouching = false;
    player.crouchToggled = false;
    player.state = 'STAND';
    player.hitboxHeight = player.h || 70;
    pockets.action.currentMode = 'KICK';
    return true;
  } else {
    // Mode KICK: wykop piłki w Arenie 1 LUB przywrócony SPARTAN KICK w walce
    if (player.kickState !== 'IDLE' || (player.kickCooldown && player.kickCooldown > 0)) return false;

    player.isProne = false;
    player.isCrouching = false;
    player.crouchToggled = false;

    // Jeśli Arena 1 i piłka jest w zasięgu – wykop piłki
    if (isArena1() && extraOptions.ball && extraOptions.ball.active !== false && isBallInKickReach(player, extraOptions.ball)) {
      return triggerRightStickKick(player, rightStick, {
        ball: extraOptions.ball || ball,
        targets: extraOptions.targets,
        obstacles: extraOptions.obstacles,
        spawnGrass: spawnGrass
      });
    }

    // W pozostałych przypadkach (Areny 2 i 3 oraz Arena 1 poza piłką) – SPARTAN KICK!
    const activeTargets = extraOptions.targets || [
      (typeof window !== 'undefined' && window.bot?.active ? window.bot : null),
      (typeof window !== 'undefined' && window.remotePlayer?.active ? window.remotePlayer : null)
    ].filter(Boolean);
    const meleeTarget = findMeleeTarget(player, activeTargets);
    return triggerSpartanKick(player, meleeTarget) || false;
  }
  return false;
}

export function handleSlideProneButtonPress(player, spawnGrass, GROUND_Y, bCluster = btnCluster) {
  return handleDynamicActionButtonPress(player, spawnGrass, GROUND_Y);
}

/**
 * Wyzwala kopnięcie z prawego drążka (Right Stick Kick):
 * - Wektor siły wyliczany wzdłuż kąta wychylenia prawego drążka (w stronę celowania)
 * - Wywołuje performKick z fizycznym kontaktem stopy z piłką LUB Spartan Kick w walce
 *
 * @param {Object} player - Obiekt gracza
 * @param {Object} [rStick] - Prawy drążek
 * @param {Object} [extraOptions] - Dodatkowe opcje (ball, targets, obstacles, spawnGrass)
 * @returns {string|null}
 */
export function triggerRightStickKick(player, rStick = rightStick, extraOptions = {}) {
  if (!player || player.isDead || player.isSliding || player.staggerTimer > 0) return null;
  if (player.kickState !== 'IDLE' || (player.kickCooldown && player.kickCooldown > 0)) return null;

  const currentFloor = player.currentGroundY || player.groundY || 500;
  const isAirborne = player.isJumping || (currentFloor > 0 && player.y < currentFloor - player.h - 4);

  // W Arenie 1 przy aktywnej piłce w zasięgu: wykop piłki
  const canKickBall = isArena1() && extraOptions.ball && extraOptions.ball.active !== false && isBallInKickReach(player, extraOptions.ball);
  if (canKickBall) {
    const hipX = player.x + player.w / 2;
    const hipY = player.y + player.h - 40 + (player.pelvisY || 0);

    let dirX = rStick ? rStick.axisX : 0;
    let dirY = rStick ? rStick.axisY : 0;
    const mag = Math.hypot(dirX, dirY);

    let aimX, aimY;
    if (mag > 0.08) {
      dirX /= mag;
      dirY /= mag;
      aimX = hipX + dirX * 160;
      aimY = hipY + dirY * 160;
    } else {
      dirX = player.facing || 1;
      dirY = -0.15;
      aimX = hipX + dirX * 160;
      aimY = hipY - 20;
    }

    const pwr = (rStick && rStick.power > 0.15)
      ? Math.min(1.0, Math.max(0.70, rStick.power))
      : 0.85;

    return performKick(player, {
      aimX: aimX,
      aimY: aimY,
      power: extraOptions.power || pwr,
      ball: extraOptions.ball,
      targets: extraOptions.targets,
      obstacles: extraOptions.obstacles,
      spawnGrass: extraOptions.spawnGrass
    });
  }

  // W powietrzu: nożyce (SCISSOR)
  if (isAirborne) {
    const classCooldownSec = player.kickCooldownTime ?? player.currentClass?.stats?.kickCooldown ?? player.classConfig?.stats?.kickCooldown ?? 0.50;
    player.kickCooldown = Math.max(24, Math.round(classCooldownSec * 60));
    player.kickMode = 'SCISSOR';
    player.scissorTimer = 0;
    player.scissorDuration = 22;
    player.kickState = 'SWING';
    return 'SCISSOR';
  }

  // Na ziemi w walce / niszczeniu otoczenia: SPARTAN KICK!
  const activeTargets = extraOptions.targets || [
    (typeof window !== 'undefined' && window.bot?.active ? window.bot : null),
    (typeof window !== 'undefined' && window.remotePlayer?.active ? window.remotePlayer : null)
  ].filter(Boolean);
  const meleeTarget = findMeleeTarget(player, activeTargets);
  return triggerSpartanKick(player, meleeTarget);
}

/**
 * Sprawdza czy dotyk prawego drążka kwalifikuje się jako tap lub szybki flick wykopu
 *
 * @param {Object} rStick - Prawy drążek
 * @param {number} touchDuration - Czas trwania dotknięcia w ms
 * @param {number} movedDist - Maksymalne przemieszczenie palca w px
 * @returns {boolean}
 */
export function checkRightStickFlickOrTap(rStick, touchDuration, movedDist) {
  if (!rStick) return false;

  // 1. Szybki tap w gałkę (< 240 ms, minimalny ruch)
  const isTap = (touchDuration < 240 && movedDist < 25);

  // 2. Szybki flick / gest krawędziowy (< 320 ms, dynamiczne pociągnięcie w stronę krawędzi)
  const isFlick = (touchDuration < 320 && (movedDist >= 25 || rStick.power > 0.35));

  return isTap || isFlick;
}
