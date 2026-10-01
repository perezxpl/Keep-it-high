// =========================================================================
// INPUT.JS - OBSŁUGA STEROWANIA I MAPOWANIE WEJŚCIA
// Centralny moduł mapowania sterowania myszą i klawiaturą:
// - LPM: Strzał z broni
// - PPM: Natychmiastowe kopnięcie (Kick) z kierunkiem na kursor myszy / zwrot postaci
// - Klawisz skoku / W / Spacja w locie: Dedykowane sterowanie jetpackiem (bez PPM)
// =========================================================================

import { performKick, kick } from './player/actions.js';

export { performKick, kick };

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
  slide: false,
  ctrl: false
};

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

  const worldMouseX = camX + (mouseScreenX - W * 0.40) / zoom;
  const worldMouseY = camY + (mouseScreenY - H * 0.68) / zoom;

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
export const DOUBLE_TAP_THRESHOLD = 300; // ms (okno czasowe double-tap)

export const jetpackState = {
  lastWPressTime: 0,
  isJetpacking: false,
  doubleTapThreshold: DOUBLE_TAP_THRESHOLD
};

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

