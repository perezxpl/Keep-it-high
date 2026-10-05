// =========================================================================
// ARENAS/INDEX.JS - CENTRALNY REJESTR I ORKIESTRATOR AREN
// Warstwa 1: Środowisko Fizyczne i Świat (Strict DAG)
// Wzorzec: Plugin / Lifecycle Hooks Pattern
// =========================================================================

import arena1 from './arena1.js';
import arena2 from './arena2.js';
import arena3 from './arena3.js';

export const ARENAS = {
  get 'arena-1'() { return arena1; },
  get 'arena-2'() { return arena2; },
  get 'arena-3'() { return arena3; },
  // Aliasy kompatybilności
  get 'ARENA_1'() { return arena1; },
  get 'ARENA_2'() { return arena2; },
  get 'ARENA_2_PANDORA'() { return arena2; },
  get 'PANDORA'() { return arena2; },
  get 'HALLELUJAH'() { return arena2; },
  get 'ARENA_3'() { return arena3; },
  get '1'() { return arena1; },
  get '2'() { return arena2; },
  get '3'() { return arena3; },
  get 'CYBER_STADIUM'() { return arena2; },
  get 'ARENA_FOUNDRY'() { return arena3; },
  get 'FOUNDRY'() { return arena3; },
  get 'AERO_REFINERY'() { return arena3; },
  get 'AERO_RAFINERIA'() { return arena3; },
  get 'AERO'() { return arena3; },
  get 'SKY_DISTRICT'() { return arena3; },
  get 'PODNIEBNY_DYSTRYKT'() { return arena3; }
};

function normalizeArenaId(rawId) {
  if (!rawId) return 'arena-1';
  const str = String(rawId).trim();
  const lower = str.toLowerCase();
  const cleaned = lower.replace(/[-_]/g, '');
  if (cleaned === '1' || cleaned === 'arena1') return 'arena-1';
  if (cleaned === '2' || cleaned === 'arena2' || cleaned === 'pandora' || cleaned === 'arena2pandora' || cleaned === 'hallelujah' || cleaned === 'cyber' || cleaned === 'cyberstadium') return 'arena-2';
  if (cleaned === '3' || cleaned === 'arena3' || cleaned === 'foundry' || cleaned === 'jungle' || cleaned === 'mine' || cleaned === 'aero' || cleaned === 'refinery' || cleaned === 'aerorafineria' || cleaned === 'sky' || cleaned === 'aerorefinery' || cleaned === 'skydistrict' || cleaned === 'podniebnydystrykt') return 'arena-3';
  if (ARENAS[str]) return ARENAS[str].id;
  if (ARENAS[lower]) return ARENAS[lower].id;
  return 'arena-1';
}

// Pobieranie ID startowej areny z parametru URL (np. ?arena=arena-2 lub ?arena=3)
let activeArena = null;

/**
 * Zwraca aktualnie aktywny moduł areny
 * @returns {Object} Aktywny obiekt areny
 */
export function getActiveArena() {
  if (!activeArena) {
    const initialUrlId = (typeof window !== 'undefined' && window.location)
      ? (new URLSearchParams(window.location.search).get('arena') || 'arena-1')
      : 'arena-1';
    activeArena = ARENAS[normalizeArenaId(initialUrlId)] || arena1;
  }
  return activeArena;
}

const arenaChangeListeners = [];

/**
 * Rejestruje funkcję wywoływaną przy zmianie aktywnej areny
 * @param {Function} fn - Callback (arena) => void
 */
export function onArenaChange(fn) {
  if (typeof fn === 'function') {
    arenaChangeListeners.push(fn);
  }
}

/**
 * Przełącza aktywną arenę na podany obiekt lub ID
 * @param {string|Object} idOrArena - Identyfikator ('arena-1', 'arena-2', 'arena-3') lub obiekt wtyczki
 * @returns {Object} Nowo aktywna arena
 */
export function setActiveArena(idOrArena) {
  if (!idOrArena) return activeArena;
  let nextArena = activeArena;
  if (typeof idOrArena === 'object' && idOrArena.id) {
    nextArena = idOrArena;
  } else {
    const normId = normalizeArenaId(idOrArena);
    if (ARENAS[normId]) {
      nextArena = ARENAS[normId];
    }
  }

  if (nextArena !== activeArena) {
    activeArena = nextArena;
    for (let i = 0; i < arenaChangeListeners.length; i++) {
      try {
        arenaChangeListeners[i](activeArena);
      } catch (err) {
        console.error('[ARENA] Error in onArenaChange listener:', err);
      }
    }
  }
  return activeArena;
}

export { arena1, arena2, arena3 };

