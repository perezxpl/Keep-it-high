// =========================================================================
// LOADOUT/STATE.JS - KONFIGURACJA EKWIPUNKU I KIESZENI BOJOWYCH
// =========================================================================

import { WEAPONS } from '../weapons/transform.js';

export const STORAGE_KEY_LOADOUT = 'keep_it_high_loadout';

export function getDefaultLoadout() {
  return {
    pocket1: {
      // Slot 1: Broń Główna (Primary)
      // Slot 2: Broń Dodatkowa (Secondary - Glock 17)
      // Slot 3: Broń Biała / Rezerwa (Melee / Reserve)
      slots: ['AK47', 'GLOCK', 'SNIPER'],
      activeSlotIndex: 0
    },
    pocket2: {
      // Broń Miotana (Throwables)
      throwables: ['GRENADE'],
      activeThrowableIndex: 0
    },
    previousSlotIndex: 1
  };
}

export var DEFAULT_LOADOUT = getDefaultLoadout();

/**
 * Bezpieczny odczyt zapisanego zestawu uzbrojenia z localStorage
 */
export function getStoredLoadout() {
  const fallback = getDefaultLoadout();
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_LOADOUT);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const slots = Array.isArray(parsed?.pocket1?.slots) ? parsed.pocket1.slots : fallback.pocket1.slots;
    const validatedSlots = slots.map(id => ((WEAPONS && WEAPONS[id]) ? id : 'AK47'));
    if (validatedSlots.length < 2) validatedSlots.push('GLOCK');

    return {
      pocket1: {
        slots: validatedSlots,
        activeSlotIndex: Math.max(0, Math.min(validatedSlots.length - 1, Number(parsed?.pocket1?.activeSlotIndex) || 0))
      },
      pocket2: {
        throwables: Array.isArray(parsed?.pocket2?.throwables) ? parsed.pocket2.throwables : ['GRENADE'],
        activeThrowableIndex: 0
      },
      previousSlotIndex: 1
    };
  } catch (_) {
    return fallback;
  }
}

/**
 * Zapis konfiguracji uzbrojenia do localStorage
 */
export function saveStoredLoadout(loadout) {
  if (typeof window === 'undefined' || !window.localStorage || !loadout) return;
  try {
    const fallback = getDefaultLoadout();
    window.localStorage.setItem(STORAGE_KEY_LOADOUT, JSON.stringify({
      pocket1: {
        slots: loadout.pocket1?.slots || fallback.pocket1.slots,
        activeSlotIndex: loadout.pocket1?.activeSlotIndex || 0
      },
      pocket2: {
        throwables: loadout.pocket2?.throwables || fallback.pocket2.throwables,
        activeThrowableIndex: loadout.pocket2?.activeThrowableIndex || 0
      }
    }));
  } catch (_) {}
}

/**
 * Inicjalizacja loadoutu dla postaci gracza
 */
export function initPlayerLoadout(p) {
  if (!p) return;
  if (!p.loadout) {
    p.loadout = getStoredLoadout();
  }
  const curSlotId = p.loadout.pocket1.slots[p.loadout.pocket1.activeSlotIndex] || 'AK47';
  if (WEAPONS && WEAPONS[curSlotId]) {
    p.currentWeapon = WEAPONS[curSlotId];
  }
}
