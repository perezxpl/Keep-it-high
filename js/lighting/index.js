// =========================================================================
// LIGHTING/INDEX.JS - GŁÓWNY PUNKT WEJŚCIA MODUŁU OŚWIETLENIA I EFEKTÓW
// =========================================================================

import {
  LIGHT_PRESETS,
  lightingState,
  addDynamicLight,
  addShockwave,
  clearLightingState
} from './state.js';

import { updateLighting } from './logic.js';
import { drawLighting, drawShockwaves, drawCinematicVignette } from './renderer.js';

export function initLighting() {
  clearLightingState();
}

export {
  LIGHT_PRESETS,
  lightingState,
  addDynamicLight,
  addShockwave,
  clearLightingState,
  updateLighting,
  drawLighting,
  drawShockwaves,
  drawCinematicVignette
};
