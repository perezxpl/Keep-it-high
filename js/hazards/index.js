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

// Globalna ekspozycja dla modułów balistyki i fizyki Areny 5
if (typeof window !== 'undefined') {
  import('./state.js').then(st => {
    window.createBarrelInstance = st.createBarrelInstance;
    window.hazardsBarrels = st.hazardsState.barrels;
  }).catch(() => {});
  import('./logic.js').then(m => {
    window.damageBarrel = m.damageBarrel;
    window.kickBarrel = m.kickBarrel;
    window.checkBarrelKickInteraction = m.checkBarrelKickInteraction;
    window.detonateBarrel = m.detonateBarrel;
  }).catch(() => {});
}
