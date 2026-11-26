// =============================================================================
// JS/KILLSTREAKS/INDEX.JS - GŁÓWNY PUNKT WEJŚCIA DLA MODUŁU SERII ZABÓJSTW
// =============================================================================

export {
  KILLSTREAKS,
  MAX_EQUIPPED_KILLSTREAKS,
  DEFAULT_EQUIPPED_KILLSTREAKS,
  killstreakState,
  getKillstreakDef,
  getNextKillstreakGoal,
  loadEquippedKillstreaks,
  saveEquippedKillstreaks,
  setEquippedKillstreaks,
  toggleEquippedKillstreak,
  getEquippedKillstreaks,
  getEquippedKillstreakDefs,
  subscribeKillstreakLoadout
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
  drawKillstreakHUD,
  drawKillstreakVectorIcon
} from './renderer.js';

export {
  initKillstreakSelectorUI,
  renderKillstreakSelectors
} from './selectorUI.js';

export {
  activeCarePackages,
  spawnCarePackage,
  applyRemoteCarePackageOpened,
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
  applyRemoteSentryDestroyed,
  updateSentryGuns,
  drawSentryGuns,
  initSentryGuns
} from './sentryGun.js';

