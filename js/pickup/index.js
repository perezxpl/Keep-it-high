// =========================================================================
// PICKUP/INDEX.JS - GŁÓWNY PUNKT WEJŚCIA MODUŁU PODNOSZENIA BRONI I INTERAKCJI
// Standard: Modularyzacja ES, Strict DAG, Zero Emojis
// =========================================================================

import { resetPickupState, pickupState, pickupPromptState } from './state.js';
import {
  spawnDroppedWeapon,
  performWeaponSwap,
  performTomahawkPickup,
  performCarePackageCapture,
  updatePickups,
  handlePickupTouchStart,
  handlePickupTouchMove,
  handlePickupTouchEnd
} from './logic.js';
import {
  drawPickupsWorld,
  drawPickupPrompt
} from './renderer.js';

export function initPickups() {
  resetPickupState();
}

export function resetPickups() {
  resetPickupState();
}

export {
  pickupState,
  pickupPromptState,
  resetPickupState,
  spawnDroppedWeapon,
  performWeaponSwap,
  performTomahawkPickup,
  performCarePackageCapture,
  updatePickups,
  handlePickupTouchStart,
  handlePickupTouchMove,
  handlePickupTouchEnd,
  drawPickupsWorld,
  drawPickupPrompt
};
