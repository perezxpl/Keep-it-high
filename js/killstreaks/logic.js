// =============================================================================
// JS/KILLSTREAKS/LOGIC.JS - LOGIKA SERII ZABÓJSTW I AKTYWACJA NAGRÓD
// Obsługa liczników na jedno życie, wygasania timerów i uruchamiania wsparcia
// =============================================================================

import {
  KILLSTREAKS,
  killstreakState,
  getKillstreakDef,
  getNextKillstreakGoal,
  setKillstreakNotification,
  triggerKillstreakUnlockAnim,
  triggerKillstreakActivateAnim
} from './state.js';
import { triggerCombatFeedBanner } from '../ui/combatFeed.js';
import { isTouchDevice } from '../config.js';
import { player } from '../player/state.js';
import { getActiveArena } from '../obstacles.js';
import { initCarePackages, spawnCarePackage, updateCarePackages } from './carePackage.js';
import { spawnMortarStrike, updateMortarStrikes, spawnAttackDrone, updateAttackDrones } from './supportStrikes.js';
import { initSentryGuns, spawnSentryGun, updateSentryGuns } from './sentryGun.js';

function resetUiAnimState() {
  if (!killstreakState.uiAnim) killstreakState.uiAnim = {};
  killstreakState.uiAnim.killBump = 0;
  killstreakState.uiAnim.unlockPop = 0;
  killstreakState.uiAnim.activateFlash = 0;
  killstreakState.uiAnim.activateColor = '#00e5ff';
  killstreakState.uiAnim.smoothProgress = 0;
  killstreakState.uiAnim.notifEnter = 0;
  killstreakState.uiAnim.shimmerPos = -0.35;
}

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
  resetUiAnimState();
  killstreakState.hudButtonBounds = null;
  killstreakState.mortarTargeting = false;
  killstreakState.mortarCameraX = 0;
  killstreakState.mortarTargetX = 0;
  killstreakState.mortarTargetTouchId = null;
  killstreakState.lastTouchScreenX = null;
  killstreakState.mortarCancelButtonBounds = null;
  killstreakState.mortarPlayerButtonBounds = null;
  killstreakState.mortarConfirmButtonBounds = null;
  killstreakState.mortarLeftNavBounds = null;
  killstreakState.mortarRightNavBounds = null;
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
  if (killstreakState.uiAnim) {
    killstreakState.uiAnim.killBump = 1.0;
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
    triggerKillstreakUnlockAnim(awarded.id);

    // Powiadomienie bojowe na ekranie
    const notifMsg = `SERIA ${streak}: ODBLOKOWANO ${awarded.name.toUpperCase()}! ${keyHint}`;
    setKillstreakNotification(
      `SERIA ZABÓJSTW [${streak}]`,
      `${awarded.tag} ${awarded.name.toUpperCase()} GOTOWY DO UŻYCIA ${keyHint}`,
      awarded.accent || '#00e5ff',
      4.0,
      awarded.id
    );

    // Banner w feedzie bojowym
    triggerCombatFeedBanner('KILL', notifMsg);
    return awarded;
  } else {
    // Natychmiastowy feedback o postępie w serii na bieżące zabójstwo (dla każdego fraga)
    const nextGoal = getNextKillstreakGoal(streak);
    if (nextGoal) {
      const left = nextGoal.killsRequired - streak;
      const fragUnit = left === 1 ? 'FRAG' : ((left >= 2 && left <= 4) ? 'FRAGI' : 'FRAGÓW');
      setKillstreakNotification(
        `SERIA ZABÓJSTW: ${streak}`,
        `CEL: ${nextGoal.tag} ${nextGoal.name.toUpperCase()} ZA ${left} ${fragUnit}`,
        nextGoal.accent || '#38bdf8',
        2.2,
        nextGoal.id
      );
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
  if (killstreakState.uiAnim) {
    killstreakState.uiAnim.smoothProgress = 0;
    killstreakState.uiAnim.killBump = 0;
  }
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

    triggerKillstreakActivateAnim('UAV');
    setKillstreakNotification('[UAV] RADAR TAKTYCZNY', 'SKANOWANIE OBSZARU AKTYWNE PRZEZ 20S', def.accent || '#00e5ff', 3.0, 'UAV');
    if (typeof window !== 'undefined' && typeof window.sendKillstreakEvent === 'function') {
      window.sendKillstreakEvent({ subType: 'UAV' }, player);
    }
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
    triggerKillstreakActivateAnim('CARE_PACKAGE');

    setKillstreakNotification('[ZRZUT] FLARA TAKTYCZNA', 'TRANSPORT ZAOPATRZENIA W DRODZE', def.accent || '#f97316', 3.5, 'CARE_PACKAGE');
    return true;
  }

  // Obsługa nagrody: MORTAR_STRIKE (Nalot Moździerzowy)
  if (streakId === 'MORTAR_STRIKE') {
    // Ponowne kliknięcie w trybie celowania anuluje celowanie
    if (killstreakState.mortarTargeting) {
      cancelMortarStrikeTargeting();
      return false;
    }

    // Przejście w tryb wyboru miejsca nalotu na ekranie
    killstreakState.mortarTargeting = true;
    const defaultX = (player?.x || 600) + (player?.facing || 1) * 220;
    killstreakState.mortarTargetX = defaultX;
    killstreakState.mortarCameraX = player?.x || defaultX;
    killstreakState.mortarTargetTouchId = null;
    killstreakState.lastTouchScreenX = null;
    killstreakState.touchStartX = null;
    killstreakState.touchStartY = null;
    triggerKillstreakActivateAnim('MORTAR_STRIKE');

    setKillstreakNotification('[NALOT] WYBIERZ PUNKT UDERZENIA', 'STERUJ KAMERĄ I WSKAŻ PUNKT SALWY ARTYLERYJSKIEJ', def.accent || '#ef4444', 4.0, 'MORTAR_STRIKE');
    return true;
  }

  // Obsługa nagrody: SENTRY_GUN (Wieżyczka Strażnicza)
  if (streakId === 'SENTRY_GUN') {
    killstreakState.availableStreaks.splice(idx, 1);
    const facing = player?.facing || 1;
    const deployX = (player?.x || 600) + facing * 42;
    spawnSentryGun(player, deployX);
    triggerKillstreakActivateAnim('SENTRY_GUN');

    setKillstreakNotification('[SENTRY] WIEŻYCZKA STRAŻNICZA', 'SYSTEM ROZSTAWIONY - OBRONA SEKTORA (30S)', def.accent || '#38bdf8', 3.5, 'SENTRY_GUN');
    return true;
  }

  // Obsługa nagrody: ATTACK_DRONE (Dron Bojowy)
  if (streakId === 'ATTACK_DRONE') {
    killstreakState.availableStreaks.splice(idx, 1);
    spawnAttackDrone(player);
    triggerKillstreakActivateAnim('ATTACK_DRONE');

    setKillstreakNotification('[DRON] WSPARCIE POWIETRZNE', 'DRON BOJOWY AKTYWNY PRZEZ 25S', def.accent || '#10b981', 3.5, 'ATTACK_DRONE');
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
    triggerKillstreakActivateAnim('JUGGERNAUT');

    setKillstreakNotification('[KOLOS] PANCERZ JUGGERNAUT', 'CIĘŻKI BALISTYCZNY PANCERZ 250 HP I 200 KEVLARU', def.accent || '#eab308', 4.5, 'JUGGERNAUT');
    triggerCombatFeedBanner('KILL', '[KOLOS] WYPOSAŻONO PANCERZ JUGGERNAUT (250 HP)!');
    if (typeof window !== 'undefined' && typeof window.sendKillstreakEvent === 'function') {
      window.sendKillstreakEvent({ subType: 'JUGGERNAUT' }, player);
    }
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
 * Potwierdza i uruchamia nalot moździerzowy we wskazanym punkcie świata X
 * @param {number} worldX
 * @param {object} firingPlayer
 */
export function confirmMortarStrikeTarget(worldX, firingPlayer = player) {
  if (!killstreakState.mortarTargeting) return false;

  const idx = killstreakState.availableStreaks.indexOf('MORTAR_STRIKE');
  if (idx === -1) {
    killstreakState.mortarTargeting = false;
    return false;
  }

  // Usunięcie nagrody z ekwipunku serii zabójstw
  killstreakState.availableStreaks.splice(idx, 1);
  killstreakState.mortarTargeting = false;
  killstreakState.mortarTargetTouchId = null;
  killstreakState.lastTouchScreenX = null;
  killstreakState.touchStartX = null;
  killstreakState.touchStartY = null;
  killstreakState.mortarCancelButtonBounds = null;
  killstreakState.mortarPlayerButtonBounds = null;
  killstreakState.mortarConfirmButtonBounds = null;
  killstreakState.mortarLeftNavBounds = null;
  killstreakState.mortarRightNavBounds = null;

  const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
  const minX = (typeof curArena?.bounds?.minX === 'number') ? (curArena.bounds.minX + 80) : 120;
  const maxX = (typeof curArena?.bounds?.maxX === 'number') ? (curArena.bounds.maxX - 80) : ((typeof curArena?.width === 'number') ? (curArena.width - 80) : 2800);
  const safeX = Math.max(minX, Math.min(maxX, (typeof worldX === 'number' && !isNaN(worldX)) ? worldX : 600));

  spawnMortarStrike(safeX, firingPlayer || player);
  triggerKillstreakActivateAnim('MORTAR_STRIKE');

  setKillstreakNotification('[NALOT] CEL POTWIERDZONY', 'SALWA 5 POCISKÓW ARTYLERYJSKICH W DRODZE', '#ef4444', 3.5, 'MORTAR_STRIKE');
  return true;
}

/**
 * Anuluje aktywny tryb celowania nalotu
 */
export function cancelMortarStrikeTargeting() {
  if (!killstreakState.mortarTargeting) return false;
  killstreakState.mortarTargeting = false;
  killstreakState.mortarTargetTouchId = null;
  killstreakState.lastTouchScreenX = null;
  killstreakState.touchStartX = null;
  killstreakState.touchStartY = null;
  killstreakState.mortarCancelButtonBounds = null;
  killstreakState.mortarPlayerButtonBounds = null;
  killstreakState.mortarConfirmButtonBounds = null;
  killstreakState.mortarLeftNavBounds = null;
  killstreakState.mortarRightNavBounds = null;
  setKillstreakNotification('[NALOT] ANULOWANO', 'CELOWANIE NALOTU PRZERWANE', '#94a3b8', 2.0, 'MORTAR_STRIKE');
  return true;
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
 * Obsługa płynnego przesuwania kamery w trybie wyboru celu nalotu (PC: klawisze A/D, strzałki, panning krawędziowy; Mobile: panning krawędziowy dotyku)
 */
export function updateMortarTargetingControls(safeDt, activePlayer) {
  if (!killstreakState.mortarTargeting) return;

  const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
  const minX = (typeof curArena?.bounds?.minX === 'number') ? (curArena.bounds.minX + 80) : 120;
  const maxX = (typeof curArena?.bounds?.maxX === 'number') ? (curArena.bounds.maxX - 80) : ((typeof curArena?.width === 'number') ? (curArena.width - 80) : 2800);

  const activeKeys = (typeof window !== 'undefined' && window.keys) ? window.keys : null;
  const isShift = !!activeKeys?.shift;
  const panSpeed = isShift ? 2200 : 1300;

  // 1. Klawiatura PC (A / D, Strzałki w lewo / w prawo)
  if (activeKeys?.left || activeKeys?.KeyA || activeKeys?.ArrowLeft) {
    killstreakState.mortarCameraX = (killstreakState.mortarCameraX || (activePlayer?.x || 600)) - panSpeed * safeDt;
  }
  if (activeKeys?.right || activeKeys?.KeyD || activeKeys?.ArrowRight) {
    killstreakState.mortarCameraX = (killstreakState.mortarCameraX || (activePlayer?.x || 600)) + panSpeed * safeDt;
  }

  // 2. Panning krawędziowy myszą na PC
  const isTouch = !!(
    isTouchDevice ||
    (typeof window !== 'undefined' && (window.innerWidth <= 850 || ('ontouchstart' in window) || (navigator && navigator.maxTouchPoints > 0)))
  );

  const activeMouse = (typeof window !== 'undefined' && window.mouseState) ? window.mouseState : null;
  if (!isTouch && activeMouse && typeof activeMouse.screenX === 'number') {
    const winW = (typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : 1280;
    const edgeMargin = Math.max(90, winW * 0.16);

    if (activeMouse.screenX < edgeMargin && activeMouse.screenX >= 0) {
      const edgeFactor = Math.min(1.0, (edgeMargin - activeMouse.screenX) / edgeMargin);
      killstreakState.mortarCameraX = (killstreakState.mortarCameraX || (activePlayer?.x || 600)) - (450 + edgeFactor * 1350) * safeDt;
    } else if (activeMouse.screenX > winW - edgeMargin && activeMouse.screenX <= winW) {
      const edgeFactor = Math.min(1.0, (activeMouse.screenX - (winW - edgeMargin)) / edgeMargin);
      killstreakState.mortarCameraX = (killstreakState.mortarCameraX || (activePlayer?.x || 600)) + (450 + edgeFactor * 1350) * safeDt;
    }
  }

  // 3. Panning krawędziowy dotykiem na ekranie mobilnym
  if (killstreakState.mortarTargetTouchId !== null && typeof killstreakState.lastTouchScreenX === 'number') {
    const winW = (typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : 800;
    const touchEdgeMargin = Math.max(70, winW * 0.18);

    if (killstreakState.lastTouchScreenX < touchEdgeMargin) {
      const edgeFactor = Math.min(1.0, (touchEdgeMargin - killstreakState.lastTouchScreenX) / touchEdgeMargin);
      killstreakState.mortarCameraX = (killstreakState.mortarCameraX || (activePlayer?.x || 600)) - (400 + edgeFactor * 1200) * safeDt;
    } else if (killstreakState.lastTouchScreenX > winW - touchEdgeMargin) {
      const edgeFactor = Math.min(1.0, (killstreakState.lastTouchScreenX - (winW - touchEdgeMargin)) / touchEdgeMargin);
      killstreakState.mortarCameraX = (killstreakState.mortarCameraX || (activePlayer?.x || 600)) + (400 + edgeFactor * 1200) * safeDt;
    }
  }

  // Ograniczenie współrzędnych do areny
  if (typeof killstreakState.mortarCameraX === 'number' && !isNaN(killstreakState.mortarCameraX)) {
    killstreakState.mortarCameraX = Math.max(minX, Math.min(maxX, killstreakState.mortarCameraX));
  }
  if (typeof killstreakState.mortarTargetX === 'number' && !isNaN(killstreakState.mortarTargetX)) {
    killstreakState.mortarTargetX = Math.max(minX, Math.min(maxX, killstreakState.mortarTargetX));
  }
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

  // Aktualizacja mikro-animacji HUD (pop, flash, shimmer, smoothProgress, banner ease-out)
  if (killstreakState.uiAnim) {
    const anim = killstreakState.uiAnim;
    if (anim.killBump > 0) anim.killBump = Math.max(0, anim.killBump - safeDt * 3.8);
    if (anim.unlockPop > 0) anim.unlockPop = Math.max(0, anim.unlockPop - safeDt * 2.2);
    if (anim.activateFlash > 0) anim.activateFlash = Math.max(0, anim.activateFlash - safeDt * 3.2);
    if (anim.shimmerPos < 1.45) anim.shimmerPos += safeDt * 2.4;
    if (killstreakState.notificationTimer > 0 && anim.notifEnter < 1) {
      anim.notifEnter = Math.min(1, anim.notifEnter + safeDt * 5.8);
    }
    const nextGoal = getNextKillstreakGoal(killstreakState.currentStreak || 0);
    const goalReq = nextGoal ? nextGoal.killsRequired : Math.max(1, (killstreakState.currentStreak || 0) + 1);
    const targetProg = Math.max(0, Math.min(1, (killstreakState.currentStreak || 0) / goalReq));
    anim.smoothProgress += (targetProg - anim.smoothProgress) * Math.min(1, safeDt * 12);
  }

  // Odliczanie czasu trwania aktywnych nagród
  for (let i = killstreakState.activeStreaks.length - 1; i >= 0; i--) {
    const streak = killstreakState.activeStreaks[i];
    streak.timeRemaining -= safeDt;

    if (streak.timeRemaining <= 0) {
      // Wygaśnięcie nagrody
      killstreakState.activeStreaks.splice(i, 1);
      setKillstreakNotification(`${streak.tag} WYGASŁ`, 'WSPARCIE TAKTYCZNE ZAKOŃCZONE', '#94a3b8', 2.0, streak.id);
    }
  }

  const activePlayer = playerOverride || player;
  const combatantsList = Array.isArray(combatantsOverride)
    ? combatantsOverride
    : (activePlayer ? [activePlayer] : []);

  updateMortarTargetingControls(safeDt, activePlayer);
  updateCarePackages(safeDt, activePlayer, combatantsList);
  updateMortarStrikes(safeDt, combatantsList);
  updateAttackDrones(safeDt, combatantsList);
  updateSentryGuns(safeDt, combatantsList);
}
