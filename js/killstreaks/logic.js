// =============================================================================
// JS/KILLSTREAKS/LOGIC.JS - LOGIKA SERII ZABÓJSTW I AKTYWACJA NAGRÓD
// Obsługa liczników na jedno życie, wygasania timerów i uruchamiania wsparcia
// =============================================================================

import { KILLSTREAKS, killstreakState, getKillstreakDef, getNextKillstreakGoal } from './state.js';
import { triggerCombatFeedBanner } from '../ui/combatFeed.js';
import { isTouchDevice } from '../config.js';

/**
 * Inicjalizacja / reset całego stanu sesji serii zabójstw (np. nowy mecz)
 */
export function initKillstreaks() {
  killstreakState.currentStreak = 0;
  killstreakState.highestStreak = 0;
  killstreakState.lastAwardedThreshold = 0;
  killstreakState.availableStreaks = [];
  killstreakState.activeStreaks = [];
  killstreakState.uavScanPhase = 0;
  killstreakState.recentNotification = null;
  killstreakState.notificationTimer = 0;
  killstreakState.hudButtonBounds = null;
}

/**
 * Rejestracja eliminacji wroga przez gracza (przyznaje postęp serii)
 * @returns {object|null} Zwraca definicję odblokowanego killstreaka, jeśli próg został przekroczony
 */
export function registerKillstreakKill() {
  killstreakState.currentStreak += 1;
  if (killstreakState.currentStreak > killstreakState.highestStreak) {
    killstreakState.highestStreak = killstreakState.currentStreak;
  }

  const streak = killstreakState.currentStreak;
  const isMobile = !!(
    isTouchDevice ||
    (typeof window !== 'undefined' && (window.innerWidth <= 850 || ('ontouchstart' in window) || (navigator && navigator.maxTouchPoints > 0)))
  );
  const keyHint = isMobile ? '[DOTKNIJ WIDGET]' : '[KLAWISZ 4]';

  // Sprawdzamy czy osiągnięto próg którejkolwiek nagrody
  const awarded = KILLSTREAKS.find(k => k.killsRequired === streak);
  if (awarded) {
    // Dodajemy nagrodę do dostępnych zasobów gracza
    killstreakState.availableStreaks.push(awarded.id);
    killstreakState.lastAwardedThreshold = streak;

    // Powiadomienie bojowe na ekranie
    const notifMsg = `SERIA ${streak}: ODBLOKOWANO ${awarded.name.toUpperCase()}! ${keyHint}`;
    killstreakState.recentNotification = {
      title: `SERIA ZABÓJSTW [${streak}]`,
      text: `${awarded.tag} ${awarded.name.toUpperCase()} GOTOWY DO UŻYCIA ${keyHint}`,
      color: '#00e5ff'
    };
    killstreakState.notificationTimer = 4.0;

    // Banner w feedzie bojowym
    triggerCombatFeedBanner('KILL', notifMsg);
    return awarded;
  } else {
    // Natychmiastowy feedback o postępie w serii na bieżące zabójstwo (dla każdego fraga)
    const nextGoal = getNextKillstreakGoal(streak);
    if (nextGoal) {
      const left = nextGoal.killsRequired - streak;
      const fragUnit = left === 1 ? 'FRAG' : ((left >= 2 && left <= 4) ? 'FRAGI' : 'FRAGÓW');
      killstreakState.recentNotification = {
        title: `SERIA ZABÓJSTW: ${streak}`,
        text: `CEL: ${nextGoal.tag} ${nextGoal.name.toUpperCase()} ZA ${left} ${fragUnit}`,
        color: '#38bdf8'
      };
      killstreakState.notificationTimer = 2.2;
    }
  }

  return null;
}

/**
 * Reset serii zabójstw po zgonie gracza.
 * Uwaga: odblokowane nagrody w `availableStreaks` NIE przepadają – gracz może ich użyć po odrodzeniu!
 */
export function resetKillstreak() {
  killstreakState.currentStreak = 0;
  killstreakState.lastAwardedThreshold = 0;
}

/**
 * Aktywacja wskazanej nagrody z ekwipunku gracza
 * @param {string} streakId - np. 'UAV'
 * @returns {boolean} true jeśli aktywowano pomyślnie
 */
export function activateKillstreak(streakId) {
  if (!streakId) return false;

  const idx = killstreakState.availableStreaks.indexOf(streakId);
  if (idx === -1) {
    return false;
  }

  const def = getKillstreakDef(streakId);
  if (!def) return false;

  // Obsługa nagrody: UAV (Radar Taktyczny)
  if (streakId === 'UAV') {
    // Usunięcie nagrody z zasobów
    killstreakState.availableStreaks.splice(idx, 1);

    // Sprawdzenie czy UAV już nie działa (jeśli działa, przedłużamy czas)
    const existing = killstreakState.activeStreaks.find(s => s.id === 'UAV');
    if (existing) {
      existing.timeRemaining = Math.max(existing.timeRemaining, def.duration || 20);
    } else {
      killstreakState.activeStreaks.push({
        id: 'UAV',
        name: def.name,
        tag: def.tag,
        duration: def.duration || 20,
        timeRemaining: def.duration || 20,
        startedAt: Date.now()
      });
    }

    killstreakState.recentNotification = {
      title: '[UAV] RADAR TAKTYCZNY',
      text: 'SKANOWANIE OBSZARU AKTYWNE PRZEZ 20S',
      color: '#00e5ff'
    };
    killstreakState.notificationTimer = 3.0;
    return true;
  }

  // W przypadku kolejnych nagród w trakcie wdrażania informujemy gracza bez utraty slotu
  killstreakState.recentNotification = {
    title: `${def.tag} ${def.name.toUpperCase()}`,
    text: 'SYSTEM BOJOWY W TRAKCIE KALIBRACJI',
    color: '#facc15'
  };
  killstreakState.notificationTimer = 2.5;
  return false;
}

/**
 * Aktywuje pierwszy dostępny killstreak z kolejki (np. po wciśnięciu [4] lub kliknięciu widgetu)
 */
export function activateNextAvailableStreak() {
  if (!killstreakState.availableStreaks || killstreakState.availableStreaks.length === 0) {
    return false;
  }
  const nextId = killstreakState.availableStreaks[0];
  return activateKillstreak(nextId);
}

/**
 * Sprawdza czy dany killstreak jest aktualnie aktywny w świecie gry
 */
export function isKillstreakActive(id) {
  if (!id || !killstreakState.activeStreaks) return false;
  return killstreakState.activeStreaks.some(s => s.id === id && s.timeRemaining > 0);
}

/**
 * Pobiera pozostały czas trwania aktywnego killstreaka
 */
export function getKillstreakTimeRemaining(id) {
  if (!id || !killstreakState.activeStreaks) return 0;
  const found = killstreakState.activeStreaks.find(s => s.id === id);
  return found ? Math.max(0, found.timeRemaining) : 0;
}

/**
 * Pętla aktualizacji logiki killstreaków w każdej klatce gry
 * @param {number} dt - krok czasu w sekundach
 */
export function updateKillstreaks(dt = (1 / 60)) {
  const safeDt = (typeof dt === 'number' && dt > 0 && dt < 1) ? dt : (1 / 60);

  // Aktualizacja animacji radaru UAV
  killstreakState.uavScanPhase += safeDt * 3.0;
  if (killstreakState.uavScanPhase > Math.PI * 2) {
    killstreakState.uavScanPhase -= Math.PI * 2;
  }

  // Odliczanie aktywnego powiadomienia
  if (killstreakState.notificationTimer > 0) {
    killstreakState.notificationTimer = Math.max(0, killstreakState.notificationTimer - safeDt);
    if (killstreakState.notificationTimer === 0) {
      killstreakState.recentNotification = null;
    }
  }

  // Odliczanie czasu trwania aktywnych nagród
  for (let i = killstreakState.activeStreaks.length - 1; i >= 0; i--) {
    const streak = killstreakState.activeStreaks[i];
    streak.timeRemaining -= safeDt;

    if (streak.timeRemaining <= 0) {
      // Wygaśnięcie nagrody
      killstreakState.activeStreaks.splice(i, 1);
      killstreakState.recentNotification = {
        title: `${streak.tag} WYGASŁ`,
        text: 'WSPARCIE TAKTYCZNE ZAKOŃCZONE',
        color: '#94a3b8'
      };
      killstreakState.notificationTimer = 2.0;
    }
  }
}
