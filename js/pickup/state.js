// =========================================================================
// PICKUP/STATE.JS - STAN SYSTEMU PODNOSZENIA BRONI I INTERAKCJI ZE ŚWIATEM
// Standard: Zero emojis, modularyzacja ES, strict DAG
// =========================================================================

export const pickupState = {
  droppedWeapons: [],
  maxDroppedWeapons: 24
};

export const pickupPromptState = {
  currentInteractable: null,
  isHoldingTouch: false,
  activeTouchId: null,
  isHoldingMouse: false,
  touchButtonBounds: {
    x: 0,
    y: 0,
    r: 30,
    hitR: 44,
    active: false
  },
  promptAlpha: 0.0
};

/**
 * Resetuje stan podnoszenia przedmiotow (np. przy zmianie areny lub restarcie meczu)
 */
export function resetPickupState() {
  pickupState.droppedWeapons.length = 0;
  pickupPromptState.currentInteractable = null;
  pickupPromptState.isHoldingTouch = false;
  pickupPromptState.activeTouchId = null;
  pickupPromptState.isHoldingMouse = false;
  pickupPromptState.touchButtonBounds.active = false;
  pickupPromptState.promptAlpha = 0.0;
}
