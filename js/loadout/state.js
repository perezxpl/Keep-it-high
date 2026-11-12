// =========================================================================
// LOADOUT/STATE.JS - KONFIGURACJA EKWIPUNKU I KIESZENI BOJOWYCH
// =========================================================================

import { WEAPONS, cancelReload } from '../weapons/transform.js';

export const STORAGE_KEY_LOADOUT = 'keep_it_high_loadout';

export function getDefaultLoadout() {
  return {
    pocket1: {
      // Slot 1: Broń Główna (Primary: AK47, SHOTGUN, SNIPER)
      // Slot 2: Broń Dodatkowa (Secondary: GLOCK, REVOLVER, SAWED_OFF)
      // Slot 3: Broń Biała (Melee: KNIFE, MACHETE, AXE)
      slots: ['AK47', 'GLOCK', 'KNIFE'],
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
    const rawSlots = Array.isArray(parsed?.pocket1?.slots) ? parsed.pocket1.slots : fallback.pocket1.slots;
    
    // Ścisła walidacja ról bojowych slotów:
    const validSlot0 = ['AK47', 'SHOTGUN', 'SNIPER'];
    const validSlot1 = ['GLOCK', 'REVOLVER', 'SAWED_OFF', 'RPG7'];
    const validSlot2 = ['KNIFE', 'MACHETE', 'AXE'];

    const s0 = validSlot0.includes(rawSlots[0]) ? rawSlots[0] : 'AK47';
    const s1 = validSlot1.includes(rawSlots[1]) ? rawSlots[1] : 'GLOCK';
    const s2 = validSlot2.includes(rawSlots[2]) ? rawSlots[2] : 'KNIFE';

    const validatedSlots = [s0, s1, s2];

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
  const stored = getStoredLoadout();
  p.armoryLoadout = JSON.parse(JSON.stringify(stored));
  p.loadout = JSON.parse(JSON.stringify(stored));
  const curSlotId = p.loadout.pocket1.slots[p.loadout.pocket1.activeSlotIndex] || 'AK47';
  if (WEAPONS && WEAPONS[curSlotId]) {
    p.currentWeapon = WEAPONS[curSlotId];
  }
}

/**
 * Przywraca poczatkowe uzbrojenie wybrane w zbrojowni (wywolywane po smierci / respawnie)
 */
export function restorePlayerArmoryLoadout(p) {
  if (!p) return;
  const armory = p.armoryLoadout || getStoredLoadout();
  if (!armory) return;

  if (!p.loadout) {
    p.loadout = getDefaultLoadout();
  }

  // 1. Przywrocenie poczatkowych slotow broni ze zbrojowni
  if (Array.isArray(armory.pocket1?.slots)) {
    p.loadout.pocket1.slots = [...armory.pocket1.slots];
  }

  // 2. Przywrocenie wyposazenia kieszeni 2 (miotana)
  if (Array.isArray(armory.pocket2?.throwables)) {
    p.loadout.pocket2.throwables = [...armory.pocket2.throwables];
  }

  // 3. Po smierci gracz odradza sie z bronia glowna ze zbrojowni (slot 0)
  p.loadout.pocket1.activeSlotIndex = 0;
  p.loadout.previousSlotIndex = 1;

  // 4. Natychmiastowe wyposazenie w dlonie broni glownej ze zbrojowni
  const initialWepId = p.loadout.pocket1.slots[0] || 'AK47';
  const initialWeapon = WEAPONS[initialWepId] || WEAPONS.AK47;

  cancelReload(p, p.currentWeapon);
  p.currentWeapon = initialWeapon;
  p._previousFirearm = initialWeapon;
  p.isHolstered = false;
  p.isReloading = false;
  p.reloadTimer = 0;
  p.shootTimer = 0;

  // 5. Anulowanie trwajacej animacji rzutu
  if (p.throwAnim) {
    p.throwAnim.active = false;
    p.throwAnim.aiming = false;
  }
}
