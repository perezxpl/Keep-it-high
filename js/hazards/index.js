// =========================================================================
// HAZARDS/INDEX.JS - GŁÓWNY PUNKT WEJŚCIA MODUŁU ZAGROŻEŃ I BECZEK
// =========================================================================

export {
  BARREL_TYPES,
  BARREL_CONFIG,
  ARENA_BARREL_SPAWNS,
  hazardsState,
  createBarrelInstance,
  resetHazardsState
} from './state.js';

export {
  initHazardsForArena,
  kickBarrel,
  damageBarrel,
  detonateBarrel,
  updateHazards,
  checkBarrelKickInteraction
} from './logic.js';

export {
  drawHazards
} from './renderer.js';

import {
  hazardsState,
  createBarrelInstance
} from './state.js';

import {
  kickBarrel,
  damageBarrel,
  detonateBarrel,
  checkBarrelKickInteraction
} from './logic.js';

// Globalna ekspozycja dla modulow balistyki i fizyki Areny 5
if (typeof window !== 'undefined') {
  window.createBarrelInstance = createBarrelInstance;
  window.hazardsBarrels = hazardsState.barrels;
  window.damageBarrel = damageBarrel;
  window.kickBarrel = kickBarrel;
  window.checkBarrelKickInteraction = checkBarrelKickInteraction;
  window.detonateBarrel = detonateBarrel;
}
