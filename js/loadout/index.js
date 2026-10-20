// =========================================================================
// LOADOUT/INDEX.JS - GŁÓWNY PUNKT WEJŚCIA MODUŁU EKWIPUNKU
// =========================================================================

export {
  DEFAULT_LOADOUT,
  STORAGE_KEY_LOADOUT,
  getDefaultLoadout,
  getStoredLoadout,
  saveStoredLoadout,
  initPlayerLoadout
} from './state.js';

export {
  equipPocket1Slot,
  cyclePocket1,
  quickSwitchPocket1,
  cyclePocket2
} from './logic.js';

export {
  ARMORY_CATALOG,
  initArmoryUI,
  openArmory,
  closeArmory,
  openSlotPicker,
  closeSlotPicker,
  renderArmoryUI,
  getCatalogWeapon,
  equipArmoryWeapon
} from './armoryUI.js';
