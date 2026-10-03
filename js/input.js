// =========================================================================
// INPUT.JS - OBSŁUGA STEROWANIA I MAPOWANIE WEJŚCIA
// Centralny moduł mapowania sterowania myszą i klawiaturą:
// - LPM: Strzał z broni
// - PPM: Natychmiastowe kopnięcie (Kick) z kierunkiem na kursor myszy / zwrot postaci
// - Klawisz skoku / W / Spacja w locie: Dedykowane sterowanie jetpackiem (bez PPM)
// =========================================================================

import { performKick, kick, playerSlide, throwTacticalGrenade } from './player/actions.js';

export { performKick, kick, playerSlide, throwTacticalGrenade };

export const mouseState = {
  lmbDown: false,
  rmbDown: false,
  semiFired: false
};

export const keys = {
  left: false,
  right: false,
  down: false,
  up: false,
  space: false,
  shift: false,
  slide: false,
  ctrl: false,
  crouch: false,
  grenade: false
};

export const DOUBLE_TAP_THRESHOLD = 300; // ms (okno czasowe double-tap)

export const jetpackState = {
  lastWPressTime: 0,
  isJetpacking: false,
  doubleTapThreshold: DOUBLE_TAP_THRESHOLD
};

/**
 * Resetuje stan wszystkich klawiszy wejściowych i stanu myszy przy utracie fokusu
 */
export function resetKeys() {
  for (const k in keys) {
    keys[k] = false;
  }
  jetpackState.isJetpacking = false;
  mouseState.lmbDown = false;
  mouseState.rmbDown = false;
  mouseState.semiFired = false;
}

if (typeof window !== 'undefined') {
  window.addEventListener('blur', () => {
    resetKeys();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resetKeys();
    }
  });
}

/**
 * Obsługa zdarzenia keydown dla klawiszy Control (Kucanie i Leżenie: Crouch & Prone)
 * @param {KeyboardEvent} e
 * @returns {boolean} Czy klawisz został obsłużony
 */
export function handleControlKeyDown(e) {
  if (!e) return false;
  if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.key === 'Control') {
    if (typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    keys.ctrl = true;
    keys.crouch = true;
    return true;
  }
  return false;
}

/**
 * Obsługa zdarzenia keyup dla klawiszy Control (Kucanie i Leżenie: Crouch & Prone)
 * @param {KeyboardEvent} e
 * @returns {boolean} Czy klawisz został obsłużony
 */
export function handleControlKeyUp(e) {
  if (!e) return false;
  if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.key === 'Control') {
    keys.ctrl = false;
    keys.crouch = false;
    return true;
  }
  return false;
}

/**
 * Obsługa zdarzenia keydown dla klawiszy Shift / Slide (Wślizg WYŁĄCZNIE w biegu)
 * @param {KeyboardEvent} e
 * @param {Object} [player]
 * @param {Function} [spawnGrass]
 * @param {number} [groundY]
 * @returns {boolean}
 */
export function handleSlideKeyDown(e, player, spawnGrass, groundY) {
  if (!e) return false;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') {
    if (typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    keys.shift = true;
    keys.slide = true;
    const minSpeed = 2.5;
    if (player && player.onGround && Math.abs(player.vx) > minSpeed) {
      return playerSlide(spawnGrass, groundY, player);
    }
    return false;
  }
  return false;
}

/**
 * Obsługa zdarzenia keyup dla klawiszy Shift / Slide
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
export function handleSlideKeyUp(e) {
  if (!e) return false;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') {
    keys.shift = false;
    keys.slide = false;
    return true;
  }
  return false;
}

/**
 * Wywołuje akcję kopnięcia postaci w kierunku pozycji kursora myszy.
 * Całkowicie uniezależnione od jetpacka.
 *
 * @param {Object} player - Obiekt gracza
 * @param {number} mouseScreenX - Pozycja X kursora na ekranie
 * @param {number} mouseScreenY - Pozycja Y kursora na ekranie
 * @param {Object} camera - Obiekt kamery { x, y, zoom }
 * @param {number} W - Szerokość canvasa
 * @param {number} H - Wysokość canvasa
 * @param {Object} extraOptions - Opcje (ball, targets, obstacles, spawnGrass)
 */
export function triggerMouseKick(player, mouseScreenX, mouseScreenY, camera, W, H, extraOptions = {}) {
  if (!player || player.isDead) return false;

  const zoom = (camera && camera.zoom) ? camera.zoom : 1;
  const camX = (camera && camera.x) ? camera.x : 0;
  const camY = (camera && camera.y) ? camera.y : 0;

  const worldMouseX = camX + mouseScreenX / zoom;
  const worldMouseY = camY + mouseScreenY / zoom;

  return performKick(player, {
    aimX: worldMouseX,
    aimY: worldMouseY,
    ball: extraOptions.ball,
    targets: extraOptions.targets,
    obstacles: extraOptions.obstacles,
    spawnGrass: extraOptions.spawnGrass,
    power: extraOptions.power || 0.70
  });
}

// =========================================================================
// OBSŁUGA STEROWANIA JETPACKIEM: DOUBLE-TAP 'W' (250-300 MS)
// - Pojedyncze wciśnięcie 'W': normalny skok z podłoża
// - Podwójne wciśnięcie 'W': aktywacja jetpacka (isJetpacking = true)
// - Trzymanie 'W' po double-tap: podtrzymanie lotu dopóki klawisz jest wciśnięty i jest paliwo
// - Keyup 'W': natychmiastowe zresetowanie stanu lotu
// =========================================================================

/**
 * Obsługa zdarzenia keydown dla 'W' / skoku
 * @param {Object} player - Obiekt gracza
 * @param {number} [now] - Opcjonalny timestamp (domyślnie Date.now())
 * @returns {boolean} Czy jetpack został aktywowany (double-tap)
 */
export function handleWKeyDown(player, now = Date.now()) {
  const timeSinceLast = now - jetpackState.lastWPressTime;
  const isDoubleTap = (timeSinceLast < jetpackState.doubleTapThreshold);

  if (isDoubleTap && (player?.jetFuel || 0) > 0) {
    jetpackState.isJetpacking = true;
    if (player) player.isJetpacking = true;
  } else {
    jetpackState.isJetpacking = false;
    if (player) player.isJetpacking = false;
  }

  jetpackState.lastWPressTime = now;
  return jetpackState.isJetpacking;
}

/**
 * Obsługa zdarzenia keyup dla 'W'
 * @param {Object} player - Obiekt gracza
 */
export function handleWKeyUp(player) {
  jetpackState.isJetpacking = false;
  if (player) player.isJetpacking = false;
}

// =========================================================================
// RE-EKSPORT STEROWANIA MOBILNEGO (MOBILE CONTROLS)
// =========================================================================
export {
  leftStick,
  rightStick,
  btnCluster,
  updateButtonLayout,
  updateMobileControlStates,
  handleSlideProneButtonPress,
  triggerRightStickKick,
  checkRightStickFlickOrTap
} from './mobileControls.js';


