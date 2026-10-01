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
  downIntent: false
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
    r: 30,
    active: false,
    id: null,
    mode: 'SLIDE' // 'SLIDE' | 'PRONE'
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
  btnCluster.slide.x = curW - 65;
  btnCluster.slide.y = curH - 85;
  btnCluster.slide.r = 30;
}

/**
 * Monitoruje wychylenie lewego drążka i zarządza kontekstem przycisku:
 * - joystick.y > 0.6 (mocne wychylenie w dół) -> zmiana na "POŁÓŻ SIĘ" / "LEŻENIE"
 * - joystick neutralny / bieg w przód -> natychmiast wraca do "WŚLIZG"
 * - jeśli gracz leży (isProne) -> przycisk pozostaje w trybie PRONE z etykietą "WSTAŃ"
 *
 * @param {Object} player - Obiekt gracza
 * @param {Object} [lStick] - Lewy drążek
 * @param {Object} [bCluster] - Zespół przycisków
 */
export function updateMobileControlStates(player, lStick = leftStick, bCluster = btnCluster) {
  if (!player || !bCluster || !bCluster.slide) return;

  const slideBtn = bCluster.slide;

  if (player.isCrouching || player.isProne) {
    slideBtn.mode = 'PRONE';
    slideBtn.enabled = true;
  } else if (player.gaitMode === 'SPRINT' && (player.sprintDuration || 0) >= 60 && (player.slideCooldown || 0) <= 0) {
    slideBtn.mode = 'SLIDE';
    slideBtn.enabled = true;
  } else {
    slideBtn.mode = 'DISABLED';
    slideBtn.enabled = false;
  }
}

/**
 * Obsługa wciśnięcia kontekstowego przycisku wślizgu / leżenia:
 * - W trybie PRONE (podczas kucania): kładzie postać płasko na brzuchu (CRAWL) lub wznosi do kucania
 * - W trybie SLIDE (podczas sprintu >= 1s i po zejściu cooldownu): odpala wślizg, nakłada cooldown 300 i zeruje sprint
 * - W pozostałych stanach: przycisk nieaktywny
 *
 * @param {Object} player - Obiekt gracza
 * @param {Function} spawnGrass - Funkcja spawnu cząsteczek
 * @param {number} GROUND_Y - Poziom podłoża
 * @param {Object} [bCluster] - Zespół przycisków
 * @returns {boolean}
 */
export function handleSlideProneButtonPress(player, spawnGrass, GROUND_Y, bCluster = btnCluster) {
  if (!player || player.isDead || player.isIntro) return false;

  const slideBtn = bCluster?.slide;
  if (!slideBtn || !slideBtn.enabled) return false;

  if (slideBtn.mode === 'PRONE' || player.isCrouching || player.isProne) {
    if (player.isProne) {
      // Wstawanie z leżenia do kucania
      player.isProne = false;
      player.isCrouching = true;
      player.crouchToggled = false;
    } else {
      // Kładzenie się płasko na ziemi (PRONE / CRAWL)
      player.isProne = true;
      player.isCrouching = false;
      player.crouchToggled = false;
      player.isSliding = false;
    }
    return true;
  }

  if (slideBtn.mode === 'SLIDE') {
    const slid = playerSlide(spawnGrass, GROUND_Y, player);
    if (slid) {
      player.slideCooldown = 300; // 5 sekund blokady przy 60 FPS
      player.sprintDuration = 0;
    }
    return slid;
  }

  return false;
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
