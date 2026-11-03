// =========================================================================
// DEATHMATCH/INDEX.JS - GŁÓWNY PUNKT WEJŚCIA MODUŁU TRYBU DEATHMATCH
// =========================================================================

export {
  DEATHMATCH_DURATION,
  DEATHMATCH_XP_REWARDS,
  DEATHMATCH_MODES,
  TEAMS,
  WIN_CONDITIONS,
  deathmatchConfig,
  deathmatchState,
  setDeathmatchMode,
  setDeathmatchPlayerTeam,
  setDeathmatchWinCondition,
  setDeathmatchFragLimit,
  setDeathmatchDuration,
  resetDeathmatchState,
  isDeathmatchFFA
} from './state.js';

export {
  initDeathmatch,
  refreshDeathmatchParticipants,
  updateDeathmatch,
  updateLeaderboard,
  finishDeathmatch
} from './logic.js';

export {
  drawDeathmatchHUD,
  drawDeathmatchPodium
} from './renderer.js';
