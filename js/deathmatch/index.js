// =========================================================================
// DEATHMATCH/INDEX.JS - GŁÓWNY PUNKT WEJŚCIA MODUŁU TRYBU DEATHMATCH
// =========================================================================

export {
  DEATHMATCH_DURATION,
  DEATHMATCH_XP_REWARDS,
  DEATHMATCH_MODES,
  TEAMS,
  deathmatchConfig,
  deathmatchState,
  setDeathmatchMode,
  setDeathmatchPlayerTeam,
  resetDeathmatchState
} from './state.js';

export {
  initDeathmatch,
  updateDeathmatch,
  updateLeaderboard,
  finishDeathmatch
} from './logic.js';

export {
  drawDeathmatchHUD,
  drawDeathmatchPodium
} from './renderer.js';
