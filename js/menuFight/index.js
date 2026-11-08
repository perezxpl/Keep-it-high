// =========================================================================
// MENUFIGHT/INDEX.JS - GŁÓWNY PUNKT WEJŚCIA MODUŁU WALKI W TLE MENU
// =========================================================================

export {
  menuFightState,
  menuBots,
  createMenuBotInstance,
  resetMenuBot,
  MENU_SPAWN_POINTS
} from './state.js';

export {
  isMenuFightActive,
  initMenuFight,
  updateMenuFight,
  stopMenuFight
} from './logic.js';

export {
  drawMenuFight
} from './renderer.js';
