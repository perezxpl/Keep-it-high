// =============================================================================
// JS/KILLSTREAKS/LOGIC.JS - LOGIKA SERII ZABÓJSTW I AKTYWACJA NAGRÓD
// Obsługa liczników na jedno życie, wygasania timerów i uruchamiania wsparcia
// =============================================================================

import {
  KILLSTREAKS,
  killstreakState,
  getKillstreakDef,
  getEquippedKillstreakDefs,
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
import { resetDroneTransports, updateDroneTransports } from './droneTransports.js';
import { activateJuggernautMode } from '../player/juggernaut.js';
import { playSound } from '../audio/index.js';

function getViewportSize() {
  if (typeof document !== 'undefined') {
    const c = document.getElementById('game') || document.getElementById('gameCanvas') || document.querySelector('canvas');
    if (c && c.clientWidth > 0 && c.clientHeight > 0) {
      return { W: c.clientWidth, H: c.clientHeight };
    }
  }
  return {
    W: (typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : 1280,
    H: (typeof window !== 'undefined' && window.innerHeight) ? window.innerHeight : 720
  };
}

function getArenaTargetBounds() {
  const curArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
  const rawMinX = (typeof curArena?.bounds?.minX === 'number') ? curArena.bounds.minX : 40;
  const rawMaxX = (typeof curArena?.bounds?.maxX === 'number')
    ? curArena.bounds.maxX
    : ((typeof curArena?.width === 'number') ? curArena.width : 2800);
  return {
    rawMinX,
    rawMaxX,
    minX: rawMinX + 80,
    maxX: rawMaxX - 80
  };
}

function resetMortarTargetingState() {
  killstreakState.mortarTargeting = false;
  killstreakState.mortarDragging = false;
  killstreakState.mortarDragMode = null;
  killstreakState.mortarDragOffsetX = 0;
  killstreakState.mortarDragOffsetY = 0;
  killstreakState.mortarCrosshairScreenX = null;
  killstreakState.mortarCrosshairScreenY = null;
  killstreakState.mortarCameraY = null;
  killstreakState.mortarTargetTouchId = null;
  killstreakState.lastTouchScreenX = null;
  killstreakState.touchStartX = null;
  killstreakState.touchStartY = null;
  killstreakState.mortarCancelButtonBounds = null;
  killstreakState.mortarPlayerButtonBounds = null;
  killstreakState.mortarConfirmButtonBounds = null;
  killstreakState.mortarLeftNavBounds = null;
  killstreakState.mortarRightNavBounds = null;
}

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
  killstreakState.mortarCameraX = 0;
  killstreakState.mortarTargetX = 0;
  killstreakState.mortarTargetY = 0;
  killstreakState.mortarPendingLaunch = null;
  resetMortarTargetingState();
  initCarePackages();
  initSentryGuns();
  resetDroneTransports();
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

  // Sprawdzamy czy osiągnięto próg którejkolwiek z wybranych nagród (max 3 w zestawie)
  const equippedDefs = getEquippedKillstreakDefs();
  const awarded = equippedDefs.find(k => k.killsRequired === streak);
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

    // Przejście w tryb wyboru miejsca nalotu: duży czerwony celownik pojawia się na środku ekranu
    const { W, H } = getViewportSize();
    const cam = (typeof window !== 'undefined' && window.camera) ? window.camera : null;
    const zoom = cam?.zoom || 1;
    const viewW = (cam && typeof cam.viewWidth === 'number' && cam.viewWidth > 0) ? cam.viewWidth : (W / zoom);
    const viewH = (cam && typeof cam.viewHeight === 'number' && cam.viewHeight > 0) ? cam.viewHeight : (H / zoom);
    const centerWorldX = cam ? (cam.x + viewW * 0.5) : (player?.x || 600);
    const centerWorldY = cam ? (cam.y + viewH * 0.5) : (player?.y || 600);

    resetMortarTargetingState();
    killstreakState.mortarTargeting = true;
    killstreakState.mortarCrosshairScreenX = W * 0.5;
    killstreakState.mortarCrosshairScreenY = H * 0.5;
    killstreakState.mortarCameraX = centerWorldX;
    killstreakState.mortarCameraY = centerWorldY;
    killstreakState.mortarTargetX = centerWorldX;
    killstreakState.mortarTargetY = centerWorldY;
    triggerKillstreakActivateAnim('MORTAR_STRIKE');

    setKillstreakNotification('[NALOT] NAMIERZ CEL', 'PRZYTRZYMAJ CELOWNIK, PRZESUŃ I PUŚĆ ABY ODPALIĆ', def.accent || '#ef4444', 4.0, 'MORTAR_STRIKE');
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

  // Obsługa nagrody: JUGGERNAUT (Pancerz Juggernaut + M134 Minigun)
  if (streakId === 'JUGGERNAUT') {
    killstreakState.availableStreaks.splice(idx, 1);
    activateJuggernautMode(player);
    triggerKillstreakActivateAnim('JUGGERNAUT');

    setKillstreakNotification('[KOLOS] PANCERZ JUGGERNAUT', 'OSOBNE 250 HP PANCERZA + M134 MINIGUN!', def.accent || '#eab308', 4.5, 'JUGGERNAUT');
    triggerCombatFeedBanner('KILL', '[KOLOS] WYPOSAŻONO PANCERZ JUGGERNAUT (250 HP PANCERZA + M134 MINIGUN)!');
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
 * Rozpoczyna przytrzymanie i przeciąganie dużego czerwonego celownika nalotu
 */
export function beginMortarCrosshairDrag(screenX, screenY, mode = 'mouse', touchId = null) {
  if (!killstreakState.mortarTargeting) return false;
  const { W, H } = getViewportSize();
  const curX = (typeof killstreakState.mortarCrosshairScreenX === 'number') ? killstreakState.mortarCrosshairScreenX : (W * 0.5);
  const curY = (typeof killstreakState.mortarCrosshairScreenY === 'number') ? killstreakState.mortarCrosshairScreenY : (H * 0.5);

  const dist = Math.hypot(screenX - curX, screenY - curY);
  if (dist <= 95) {
    killstreakState.mortarDragOffsetX = curX - screenX;
    killstreakState.mortarDragOffsetY = curY - screenY;
  } else {
    killstreakState.mortarDragOffsetX = 0;
    killstreakState.mortarDragOffsetY = 0;
    killstreakState.mortarCrosshairScreenX = Math.max(36, Math.min(W - 36, screenX));
    killstreakState.mortarCrosshairScreenY = Math.max(36, Math.min(H - 36, screenY));
  }

  killstreakState.mortarDragging = true;
  killstreakState.mortarDragMode = mode;
  killstreakState.mortarTargetTouchId = touchId;
  killstreakState.lastTouchScreenX = screenX;
  syncMortarWorldTargetFromCrosshair();
  return true;
}

/**
 * Aktualizuje pozycję celownika podczas przytrzymania i przesuwania po ekranie
 */
export function moveMortarCrosshairDrag(screenX, screenY) {
  if (!killstreakState.mortarTargeting || !killstreakState.mortarDragging) return false;
  const { W, H } = getViewportSize();
  const nextX = screenX + (killstreakState.mortarDragOffsetX || 0);
  const nextY = screenY + (killstreakState.mortarDragOffsetY || 0);
  killstreakState.mortarCrosshairScreenX = Math.max(36, Math.min(W - 36, nextX));
  killstreakState.mortarCrosshairScreenY = Math.max(36, Math.min(H - 36, nextY));
  killstreakState.lastTouchScreenX = screenX;
  syncMortarWorldTargetFromCrosshair();
  return true;
}

function syncMortarWorldTargetFromCrosshair() {
  const { W, H } = getViewportSize();
  const cx = (typeof killstreakState.mortarCrosshairScreenX === 'number') ? killstreakState.mortarCrosshairScreenX : (W * 0.5);
  const cy = (typeof killstreakState.mortarCrosshairScreenY === 'number') ? killstreakState.mortarCrosshairScreenY : (H * 0.5);
  const cam = (typeof window !== 'undefined' && window.camera) ? window.camera : null;
  const zoom = cam?.zoom || 1;
  const { minX, maxX } = getArenaTargetBounds();
  const worldX = cam ? (cam.x + cx / zoom) : cx;
  const worldY = cam ? (cam.y + cy / zoom) : cy;
  killstreakState.mortarTargetX = Math.max(minX, Math.min(maxX, worldX));
  killstreakState.mortarTargetY = worldY;
}

/**
 * Kończy przytrzymanie celownika: blokuje cel i odpala moździerze po krótkiej chwili
 */
export function endMortarCrosshairDrag(firingPlayer = player) {
  if (!killstreakState.mortarTargeting || !killstreakState.mortarDragging) return false;
  syncMortarWorldTargetFromCrosshair();

  const idx = killstreakState.availableStreaks.indexOf('MORTAR_STRIKE');
  if (idx === -1) {
    resetMortarTargetingState();
    return false;
  }

  const { minX, maxX } = getArenaTargetBounds();
  const safeX = Math.max(minX, Math.min(maxX, (typeof killstreakState.mortarTargetX === 'number' && !isNaN(killstreakState.mortarTargetX)) ? killstreakState.mortarTargetX : 600));
  const safeY = (typeof killstreakState.mortarTargetY === 'number' && !isNaN(killstreakState.mortarTargetY)) ? killstreakState.mortarTargetY : 800;

  killstreakState.availableStreaks.splice(idx, 1);
  resetMortarTargetingState();
  killstreakState.mortarPendingLaunch = {
    targetX: safeX,
    targetY: safeY,
    timer: 0.45,
    totalDelay: 0.45,
    owner: firingPlayer || player
  };

  playSound('ui_mortar_lock');
  setKillstreakNotification('[NALOT] CEL ZABLOKOWANY', 'ODPALANIE SALWY MOŹDZIERZOWEJ...', '#ef4444', 2.2, 'MORTAR_STRIKE');
  return true;
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
    resetMortarTargetingState();
    return false;
  }

  // Usunięcie nagrody z ekwipunku serii zabójstw
  killstreakState.availableStreaks.splice(idx, 1);
  resetMortarTargetingState();

  const { minX, maxX } = getArenaTargetBounds();
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
  resetMortarTargetingState();
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
 * Obsługa płynnego podążania kamery za dużym celownikiem podczas przytrzymania i przesuwania
 */
export function updateMortarTargetingControls(safeDt, activePlayer) {
  if (!killstreakState.mortarTargeting) return;

  const { W, H } = getViewportSize();
  const { rawMinX, rawMaxX, minX, maxX } = getArenaTargetBounds();
  const cam = (typeof window !== 'undefined' && window.camera) ? window.camera : null;
  const zoom = cam?.zoom || 1;
  const viewW = (cam && typeof cam.viewWidth === 'number' && cam.viewWidth > 0) ? cam.viewWidth : (W / zoom);
  const viewH = (cam && typeof cam.viewHeight === 'number' && cam.viewHeight > 0) ? cam.viewHeight : (H / zoom);

  if (typeof killstreakState.mortarCrosshairScreenX !== 'number' || isNaN(killstreakState.mortarCrosshairScreenX)) {
    killstreakState.mortarCrosshairScreenX = W * 0.5;
  }
  if (typeof killstreakState.mortarCrosshairScreenY !== 'number' || isNaN(killstreakState.mortarCrosshairScreenY)) {
    killstreakState.mortarCrosshairScreenY = H * 0.5;
  }

  const cx = killstreakState.mortarCrosshairScreenX;
  const cy = killstreakState.mortarCrosshairScreenY;

  // 1. Płynne podążanie kamery za przesuwanym celownikiem (kierunek od środka ekranu)
  if (killstreakState.mortarDragging) {
    const offX = (cx - W * 0.5) / Math.max(1, W * 0.5); // -1..1
    const offY = (cy - H * 0.5) / Math.max(1, H * 0.5); // -1..1
    const deadzoneX = 0.08;
    const deadzoneY = 0.14;

    if (Math.abs(offX) > deadzoneX) {
      const magX = Math.min(1, (Math.abs(offX) - deadzoneX) / (1 - deadzoneX));
      const panSpeedX = 240 + Math.pow(magX, 1.35) * 1650;
      const baseCamX = (typeof killstreakState.mortarCameraX === 'number' && !isNaN(killstreakState.mortarCameraX))
        ? killstreakState.mortarCameraX
        : (cam ? cam.x + viewW * 0.5 : (activePlayer?.x || 600));
      killstreakState.mortarCameraX = baseCamX + Math.sign(offX) * panSpeedX * safeDt;
    }

    if (Math.abs(offY) > deadzoneY) {
      const magY = Math.min(1, (Math.abs(offY) - deadzoneY) / (1 - deadzoneY));
      const panSpeedY = 160 + Math.pow(magY, 1.35) * 820;
      const baseCamY = (typeof killstreakState.mortarCameraY === 'number' && !isNaN(killstreakState.mortarCameraY))
        ? killstreakState.mortarCameraY
        : (cam ? cam.y + viewH * 0.5 : (activePlayer?.y || 600));
      killstreakState.mortarCameraY = baseCamY + Math.sign(offY) * panSpeedY * safeDt;
    }
  }

  // 2. Opcjonalne wsparcie klawiatury PC (A / D, Strzałki)
  const activeKeys = (typeof window !== 'undefined' && window.keys) ? window.keys : null;
  const isShift = !!activeKeys?.shift;
  const keyPanSpeed = isShift ? 2000 : 1200;
  if (activeKeys?.left || activeKeys?.KeyA || activeKeys?.ArrowLeft) {
    killstreakState.mortarCameraX = (killstreakState.mortarCameraX || (activePlayer?.x || 600)) - keyPanSpeed * safeDt;
  }
  if (activeKeys?.right || activeKeys?.KeyD || activeKeys?.ArrowRight) {
    killstreakState.mortarCameraX = (killstreakState.mortarCameraX || (activePlayer?.x || 600)) + keyPanSpeed * safeDt;
  }

  // Ograniczenie środka kamery do zakresu ruchu kamery (brak "pustego" przewijania przy krawędziach)
  const arenaW = rawMaxX - rawMinX;
  if (typeof killstreakState.mortarCameraX === 'number' && !isNaN(killstreakState.mortarCameraX)) {
    if (viewW < arenaW) {
      const minCamCenter = rawMinX + viewW * 0.5;
      const maxCamCenter = rawMaxX - viewW * 0.5;
      killstreakState.mortarCameraX = Math.max(minCamCenter, Math.min(maxCamCenter, killstreakState.mortarCameraX));
    } else {
      killstreakState.mortarCameraX = (rawMinX + rawMaxX) * 0.5;
    }
  }

  if (typeof killstreakState.mortarCameraY === 'number' && !isNaN(killstreakState.mortarCameraY)) {
    killstreakState.mortarCameraY = Math.max(-400, Math.min(1800, killstreakState.mortarCameraY));
  }

  // Synchronizacja punktu uderzenia na świecie z aktualną pozycją celownika na ekranie
  syncMortarWorldTargetFromCrosshair();
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
    const equippedCount = getEquippedKillstreakDefs().length;
    const nextGoal = getNextKillstreakGoal(killstreakState.currentStreak || 0);
    let targetProg = 0;
    if (equippedCount > 0) {
      targetProg = nextGoal
        ? Math.max(0, Math.min(1, (killstreakState.currentStreak || 0) / nextGoal.killsRequired))
        : 1.0;
    }
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

  if (killstreakState.mortarPendingLaunch) {
    killstreakState.mortarPendingLaunch.timer -= safeDt;
    if (killstreakState.mortarPendingLaunch.timer <= 0) {
      const pending = killstreakState.mortarPendingLaunch;
      killstreakState.mortarPendingLaunch = null;
      spawnMortarStrike(pending.targetX, pending.owner || activePlayer);
      triggerKillstreakActivateAnim('MORTAR_STRIKE');
      setKillstreakNotification('[NALOT] SALWA ODPALONA', 'POCISKI MOŹDZIERZOWE W DRODZE NA CEL', '#ef4444', 3.0, 'MORTAR_STRIKE');
    }
  }

  updateDroneTransports(safeDt);
  updateCarePackages(safeDt, activePlayer, combatantsList);
  updateMortarStrikes(safeDt, combatantsList);
  updateAttackDrones(safeDt, combatantsList);
  updateSentryGuns(safeDt, combatantsList);
}
