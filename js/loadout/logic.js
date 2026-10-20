// =========================================================================
// LOADOUT/LOGIC.JS - PRZEŁĄCZANIE BRONI, SLOTÓW I OBSŁUGA KIESZENI 1 & 2
// =========================================================================

import { WEAPONS, cancelReload } from '../weapons/transform.js';
import { rightStick } from '../mobileControls.js';
import { saveStoredLoadout } from './state.js';

/**
 * Wybiera konkretny slot w Kieszeni 1 (0 = Główna, 1 = Dodatkowa/Glock, 2 = Trzecia)
 */
export function equipPocket1Slot(p, slotIndex) {
  if (!p || p.isDead) return false;
  if (!p.loadout?.pocket1?.slots) return false;

  const slots = p.loadout.pocket1.slots;
  if (slotIndex < 0 || slotIndex >= slots.length) return false;

  // Zapamiętaj poprzedni slot dla Quick Switch (klawisz Q)
  if (p.loadout.pocket1.activeSlotIndex !== slotIndex) {
    p.loadout.previousSlotIndex = p.loadout.pocket1.activeSlotIndex;
  }

  p.loadout.pocket1.activeSlotIndex = slotIndex;
  const wepId = slots[slotIndex];
  const targetWeapon = WEAPONS[wepId] || WEAPONS.AK47;

  // Jeśli broń się zmieniła, anuluj trwające przeładowanie
  if (p.currentWeapon !== targetWeapon) {
    cancelReload(p, p.currentWeapon);
  }

  p.currentWeapon = targetWeapon;
  p.isHolstered = false;
  if (rightStick) {
    rightStick.armedMode = 'FIREARM';
  }

  saveStoredLoadout(p.loadout);
  return true;
}

/**
 * Cykliczne przełączanie slotów w Kieszeni 1 (kliknięcie kafelka dotykowego lub kółko myszy)
 */
export function cyclePocket1(p, direction = 1) {
  if (!p || p.isDead) return false;
  if (!p.loadout?.pocket1?.slots) return false;

  const count = p.loadout.pocket1.slots.length;
  if (count <= 1) return false;

  const curIdx = p.loadout.pocket1.activeSlotIndex || 0;
  const nextIdx = (curIdx + direction + count) % count;
  return equipPocket1Slot(p, nextIdx);
}

/**
 * Szybkie przełączenie między dwoma ostatnio używanymi slotami (Quick Switch - klawisz Q)
 */
export function quickSwitchPocket1(p) {
  if (!p || p.isDead) return false;
  if (!p.loadout?.pocket1?.slots) return false;

  const prevIdx = (typeof p.loadout.previousSlotIndex === 'number') ? p.loadout.previousSlotIndex : 1;
  const count = p.loadout.pocket1.slots.length;
  const targetIdx = (prevIdx >= 0 && prevIdx < count && prevIdx !== p.loadout.pocket1.activeSlotIndex)
    ? prevIdx
    : ((p.loadout.pocket1.activeSlotIndex + 1) % count);

  return equipPocket1Slot(p, targetIdx);
}

/**
 * Przełączenie rodzaju broni miotanej w Kieszeni 2
 */
export function cyclePocket2(p, direction = 1) {
  if (!p || p.isDead) return false;
  if (!p.loadout?.pocket2?.throwables) return false;

  const count = p.loadout.pocket2.throwables.length;
  if (count <= 1) return false;

  const curIdx = p.loadout.pocket2.activeThrowableIndex || 0;
  p.loadout.pocket2.activeThrowableIndex = (curIdx + direction + count) % count;
  return true;
}
