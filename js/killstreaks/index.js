// =============================================================================
// JS/KILLSTREAKS/INDEX.JS - GŁÓWNY PUNKT WEJŚCIA DLA MODUŁU SERII ZABÓJSTW
// =============================================================================

export {
  KILLSTREAKS,
  killstreakState,
  getKillstreakDef,
  getNextKillstreakGoal
} from './state.js';

export {
  initKillstreaks,
  registerKillstreakKill,
  resetKillstreak,
  activateKillstreak,
  activateNextAvailableStreak,
  isKillstreakActive,
  getKillstreakTimeRemaining,
  updateKillstreaks,
  confirmMortarStrikeTarget,
  cancelMortarStrikeTargeting
} from './logic.js';

export {
  drawKillstreakWorld,
  drawKillstreakHUD
} from './renderer.js';

export {
  activeCarePackages,
  spawnCarePackage,
  getCarePackageSurfaceY
} from './carePackage.js';

export {
  activeMortarStrikes,
  activeAttackDrones,
  spawnMortarStrike,
  spawnAttackDrone
} from './supportStrikes.js';

export {
  activeSentryGuns,
  spawnSentryGun,
  updateSentryGuns,
  drawSentryGuns,
  initSentryGuns
} from './sentryGun.js';

