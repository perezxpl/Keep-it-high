// =============================================================================
// JS/KILLSTREAKS/LOGIC.JS - LOGIKA SERII ZABÓJSTW I AKTYWACJA NAGRÓD
// Obsługa liczników na jedno życie, wygasania timerów i uruchamiania wsparcia
// =============================================================================

import { KILLSTREAKS, killstreakState, getKillstreakDef, getNextKillstreakGoal } from './state.js';
import { triggerCombatFeedBanner } from '../ui/combatFeed.js';
import { isTouchDevice } from '../config.js';
import { player } from '../player/state.js';
import { getActiveArena } from '../obstacles.js';
import { initCarePackages, spawnCarePackage, updateCarePackages } from './carePackage.js';
import { spawnMortarStrike, updateMortarStrikes, spawnAttackDrone, updateAttackDrones } from './supportStrikes.js';
import { initSentryGuns, spawnSentryGun, updateSentryGuns } from './sentryGun.js';

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
  initCarePackages();
  initSentryGuns();
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

  // Obsługa nagrody: CARE_PACKAGE (Zrzut Zaopatrzenia)
  if (streakId === 'CARE_PACKAGE') {
    killstreakState.availableStreaks.splice(idx, 1);
    const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
    const minX = (typeof curArena?.bounds?.minX === 'number') ? (curArena.bounds.minX + 80) : 120;
    const maxX = (typeof curArena?.bounds?.maxX === 'number') ? (curArena.bounds.maxX - 80) : ((typeof curArena?.width === 'number') ? (curArena.width - 80) : 2800);
    const dropTargetX = Math.max(minX, Math.min(maxX, (player?.x || 600) + (player?.facing || 1) * 75));

    spawnCarePackage(player, dropTargetX);

    killstreakState.recentNotification = {
      title: '[ZRZUT] FLARA TAKTYCZNA',
      text: 'TRANSPORT ZAOPATRZENIA W DRODZE',
      color: '#f97316'
    };
    killstreakState.notificationTimer = 3.5;
    return true;
  }

  // Obsługa nagrody: MORTAR_STRIKE (Nalot Moździerzowy)
  if (streakId === 'MORTAR_STRIKE') {
    killstreakState.availableStreaks.splice(idx, 1);
    const strikeTargetX = (player?.x || 600) + (player?.facing || 1) * 260;
    spawnMortarStrike(strikeTargetX, player);

    killstreakState.recentNotification = {
      title: '[NALOT] MOŹDZIERZ TAKTYCZNY',
      text: 'SALWA 5 POCISKÓW ARTYLERYJSKICH W DRODZE',
      color: '#ef4444'
    };
    killstreakState.notificationTimer = 3.5;
    return true;
  }

  // Obsługa nagrody: SENTRY_GUN (Wieżyczka Strażnicza)
  if (streakId === 'SENTRY_GUN') {
    killstreakState.availableStreaks.splice(idx, 1);
    const facing = player?.facing || 1;
    const deployX = (player?.x || 600) + facing * 42;
    spawnSentryGun(player, deployX);

    killstreakState.recentNotification = {
      title: '[SENTRY] WIEŻYCZKA STRAŻNICZA',
      text: 'SYSTEM ROZSTAWIONY - OBRONA SEKTORA (30S)',
      color: '#00e5ff'
    };
    killstreakState.notificationTimer = 3.5;
    return true;
  }

  // Obsługa nagrody: ATTACK_DRONE (Dron Bojowy)
  if (streakId === 'ATTACK_DRONE') {
    killstreakState.availableStreaks.splice(idx, 1);
    spawnAttackDrone(player);

    killstreakState.recentNotification = {
      title: '[DRON] WSPARCIE POWIETRZNE',
      text: 'DRON BOJOWY AKTYWNY PRZEZ 25S',
      color: '#00e5ff'
    };
    killstreakState.notificationTimer = 3.5;
    return true;
  }

  // Obsługa nagrody: JUGGERNAUT (Pancerz Juggernaut)
  if (streakId === 'JUGGERNAUT') {
    killstreakState.availableStreaks.splice(idx, 1);
    if (player) {
      player.maxHp = 250;
      player.hp = 250;
      player.hasVest = true;
      player.vestHp = 200;
      player.hasHelmet = true;
      if (player.visuals) {
        player.visuals.hasVest = true;
        player.visuals.hasHelmet = true;
      }
    }

    killstreakState.recentNotification = {
      title: '[KOLOS] PANCERZ JUGGERNAUT',
      text: 'CIĘŻKI BALISTYCZNY PANCERZ 250 HP I 200 KEVLARU',
      color: '#eab308'
    };
    killstreakState.notificationTimer = 4.5;
    triggerCombatFeedBanner('KILL', '[KOLOS] WYPOSAŻONO PANCERZ JUGGERNAUT (250 HP)!');
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
  // Aktualizacja skrzyń zrzutowych, nalotów artyleryjskich i dronów bojowych
export function updateKillstreaks(dt = (1 / 60), playerOverride = null, combatantsOverride = null) {
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

  const activePlayer = playerOverride || player;
  const combatantsList = Array.isArray(combatantsOverride)
    ? combatantsOverride
    : (activePlayer ? [activePlayer] : []);

  updateCarePackages(safeDt, activePlayer, combatantsList);
  updateMortarStrikes(safeDt, combatantsList);
  updateAttackDrones(safeDt, combatantsList);
  updateSentryGuns(safeDt, combatantsList);
}
