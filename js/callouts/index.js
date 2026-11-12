// =============================================================================
// JS/CALLOUTS/INDEX.JS - PUNKT WEJŚCIA MODUŁU DYMKÓW MEDALI BOJOWYCH
// =============================================================================

export { CALLOUT_CONFIG, calloutState } from './state.js';
export {
  initCallouts,
  resetCalloutMatchState,
  onPlayerDeathCallout,
  registerCalloutKill,
  updateCallouts
} from './logic.js';
export { drawCallouts } from './renderer.js';
