// =========================================================================
// ARENAS/INDEX.JS - CENTRALNY REJESTR I ORKIESTRATOR AREN
// Warstwa 1: Środowisko Fizyczne i Świat (Strict DAG)
// Wzorzec: Plugin / Lifecycle Hooks Pattern
// =========================================================================

import arena1 from './arena1.js';
import arena2 from './arena2.js';
import arena3 from './arena3.js';

export const ARENAS = {
  'arena-1': arena1,
  'arena-2': arena2,
  'arena-3': arena3,
  // Aliasy kompatybilności
  'ARENA_1': arena1,
  'ARENA_2': arena2,
  'ARENA_3': arena3,
  '1': arena1,
  '2': arena2,
  '3': arena3,
  'CYBER_STADIUM': arena2,
  'ARENA_FOUNDRY': arena3,
  'FOUNDRY': arena3
};

function normalizeArenaId(rawId) {
  if (!rawId) return 'arena-1';
  const str = String(rawId).trim();
  if (ARENAS[str]) return ARENAS[str].id;
  const lower = str.toLowerCase();
  if (ARENAS[lower]) return ARENAS[lower].id;
  if (lower === '1' || lower === 'arena1') return 'arena-1';
  if (lower === '2' || lower === 'arena2' || lower === 'cyber' || lower === 'cyber_stadium') return 'arena-2';
  if (lower === '3' || lower === 'arena3' || lower === 'foundry' || lower === 'jungle' || lower === 'mine') return 'arena-3';
  return 'arena-1';
}

// Pobieranie ID startowej areny z parametru URL (np. ?arena=arena-2 lub ?arena=3)
const initialUrlId = (typeof window !== 'undefined' && window.location)
  ? (new URLSearchParams(window.location.search).get('arena') || 'arena-1')
  : 'arena-1';

let activeArena = ARENAS[normalizeArenaId(initialUrlId)] || arena1;

/**
 * Zwraca aktualnie aktywny moduł areny
 * @returns {Object} Aktywny obiekt areny
 */
export function getActiveArena() {
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

