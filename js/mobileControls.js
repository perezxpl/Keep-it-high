// =========================================================================
// MOBILECONTROLS.JS - ZAAWANSOWANE STEROWANIE DOTYKOWE (MOBILE CONTROLS)
// Obsługuje wirtualne drążki, dynamiczny kontekstowy przycisk (Wślizg / Leżenie)
// oraz gesty kopnięcia z prawego drążka (Right Stick Kick).
// =========================================================================

import { CONFIG } from './config.js';
import { performKick, kick, playerSlide, isBallInKickReach } from './player/actions.js';

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
  maxRadius: 65,

  // Detekcja flick / tap wykopu z drążka
  touchStartTime: 0,
  startX: 0,
  startY: 0,
  hasKicked: false,

  // Tryb strzelania i okno po wycelowaniu
  isShooting: false,
  waitingForSecondTap: false,
  windowTimer: 0,
  lingerAlpha: 0,
  gestureState: 'IDLE'
};

export const btnCluster = {
  slide: {
    x: 0,
    y: 0,
    r: 27,
    active: false,
    id: null,
    enabled: false,
    mode: 'SLIDE'
  },
  prone: {
    x: 0,
    y: 0,
    r: 28,
    active: false,
    id: null,
    visible: false
  },
  crouch: {
    x: 0,
    y: 0,
    r: 28,
    active: false,
    id: null,
    visible: false
  },
  grenade: {
    x: 0,
    y: 0,
    r: 25,
    active: false,
    id: null,
    enabled: true
  },
  kick: {
    x: 0,
    y: 0,
    r: 30,
    active: false,
    id: null,
    enabled: true
  }
};

/**
 * Aktualizuje pozycje przycisków dotykowych na ekranie
 * @param {number} W - Szerokość ekranu
 * @param {number} H - Wysokość ekranu
 */
export function updateButtonLayout(W, H) {
  const curW = (typeof W === 'number' && W > 0) ? W : (typeof window !== 'undefined' ? window.innerWidth : 800);
  const curH = (typeof H === 'number' && H > 0) ? H : (typeof window !== 'undefined' ? window.innerHeight : 600);

  // Sztywno umiejscowione, stałe pozycje drążków dotykowych (Fixed Sticks)
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

  // Dedykowany, duży przycisk wykopu (KOP)
  if (!btnCluster.kick) {
    btnCluster.kick = { x: 0, y: 0, r: 30, active: false, id: null, enabled: true };
  }
  btnCluster.kick.x = Math.round(rsX - 85);
  btnCluster.kick.y = Math.round(rsY + 15);
  btnCluster.kick.r = 30;

  // Przycisk wślizgu
  btnCluster.slide.x = Math.round(rsX - 85);
  btnCluster.slide.y = Math.round(rsY - 60);
  btnCluster.slide.r = 27;

  // Przycisk kładzenia się (pojawiający się w momencie kucania)
  if (!btnCluster.prone) {
    btnCluster.prone = { x: 0, y: 0, r: 28, active: false, id: null, visible: false };
  }
  btnCluster.prone.x = Math.round(rsX - 10);
  btnCluster.prone.y = Math.round(rsY - 88);
  btnCluster.prone.r = 28;
  btnCluster.crouch = btnCluster.prone;

  // Przycisk granatu taktycznego
  if (!btnCluster.grenade) {
    btnCluster.grenade = { x: 0, y: 0, r: 25, active: false, id: null, enabled: true };
  }
  btnCluster.grenade.x = Math.round(rsX - 75);
  btnCluster.grenade.y = Math.round(rsY - 130);
  btnCluster.grenade.r = 25;
}

/**
 * Monitoruje ruch postaci i stan cooldownu wślizgu dla przycisku mobilnego:
 * - Wślizg dostępny tylko w pełnym biegu (|vx| > MIN_RUN_SPEED) i na podłożu
 * - Przycisk kładzenia się widoczny WYŁĄCZNIE w momencie kucania lub leżenia
 *
 * @param {Object} player - Obiekt gracza
 * @param {Object} [lStick] - Lewy drążek
 * @param {Object} [bCluster] - Zespół przycisków
 */
export function updateMobileControlStates(player, lStick = leftStick, bCluster = btnCluster) {
  if (!player || !bCluster) return;

  const minSpeed = CONFIG.MIN_RUN_SPEED || 2.5;
  const isRunning = (player.onGround && !player.isJumping && Math.abs(player.vx) > minSpeed);
  const cooldownOk = (!player.slideCooldown || player.slideCooldown <= 0);

  if (bCluster.slide) {
    bCluster.slide.mode = 'SLIDE';
    bCluster.slide.enabled = isRunning && cooldownOk;
  }

  // Przycisk kładzenia się pojawia się dynamicznie w momencie kucania / leżenia
  if (bCluster.prone) {
    bCluster.prone.visible = !!(player.isCrouching || player.isProne);
  }

  if (bCluster.grenade) {
    bCluster.grenade.enabled = (player.grenadeCooldown === undefined || player.grenadeCooldown <= 0);
  }
}

/**
 * Obsługa wciśnięcia mobilnego przycisku wślizgu:
 * - Warunek konieczny: Wślizg może wykonać się tylko wtedy, gdy postać biegnie (|vx| > MIN_RUN_SPEED).
 * - Jeśli gracz stoi w miejscu, wślizg nie aktywuje się.
 *
 * @param {Object} player - Obiekt gracza
 * @param {Function} spawnGrass - Funkcja spawnu cząsteczek
 * @param {number} GROUND_Y - Poziom podłoża
 * @param {Object} [bCluster] - Zespół przycisków
 * @returns {boolean}
 */
export function handleSlideProneButtonPress(player, spawnGrass, GROUND_Y, bCluster = btnCluster) {
  if (!player || player.isDead || player.isIntro) return false;

  const minSpeed = CONFIG.MIN_RUN_SPEED || 2.5;
  if (!player.onGround || Math.abs(player.vx) <= minSpeed) {
    return false;
  }

  const slid = playerSlide(spawnGrass, GROUND_Y, player);
  return slid;
}

/**
 * Wyzwala kopnięcie z prawego drążka (Right Stick Kick):
 * - Wektor siły wyliczany wzdłuż kąta wychylenia prawego drążka (w stronę celowania)
 * - Wywołuje performKick z fizycznym kontaktem stopy z piłką oraz zbalansowaną siłą klasy
 *
 * @param {Object} player - Obiekt gracza
 * @param {Object} [rStick] - Prawy drążek
 * @param {Object} [extraOptions] - Dodatkowe opcje (ball, targets, obstacles, spawnGrass)
 * @returns {string|null}
 */
export function triggerRightStickKick(player, rStick = rightStick, extraOptions = {}) {
  if (!player || player.isDead) return null;

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
    // Tap w miejscu - kopnięcie w przód w stronę zwrotu
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
