// =============================================================================
// JS/KILLSTREAKS/STATE.JS - REJESTR SERII ZABÓJSTW (KILLSTREAKS) I STAN SESJI
// System serii zabójstw na jedno życie gracza w stylu Modern Military / CoD
// =============================================================================

/**
 * Katalog dostępnych nagród za serie zabójstw.
 * Wartości i koszty (liczba eliminacji bez zgonu) zoptymalizowane pod dynamikę 2D.
 */
export const KILLSTREAKS = [
  {
    id: 'UAV',
    name: 'Radar UAV',
    tag: '[UAV]',
    short: 'UAV',
    killsRequired: 3,
    duration: 20, // czas działania w sekundach
    icon: '◆',
    accent: '#00e5ff',
    bgTint: 'rgba(8, 36, 56, 0.92)',
    desc: 'Skaner taktyczny ujawniający pozycje wrogów i botów przez przeszkody oraz wskazujący cele poza ekranem.',
    implemented: true
  },
  {
    id: 'CARE_PACKAGE',
    name: 'Zrzut Zaopatrzenia',
    tag: '[ZRZUT]',
    short: 'ZRZUT',
    killsRequired: 4,
    icon: '■',
    accent: '#f97316',
    bgTint: 'rgba(46, 22, 10, 0.92)',
    desc: 'Skrzynia zrzucana na spadochronie zawierająca ciężki pancerz kevlarowy, odnowienie amunicji, nalot lub wsparcie bojowe.',
    implemented: true
  },
  {
    id: 'MORTAR_STRIKE',
    name: 'Nalot Moździerzowy',
    tag: '[NALOT]',
    short: 'NALOT',
    killsRequired: 5,
    icon: '▲',
    accent: '#ef4444',
    bgTint: 'rgba(54, 14, 18, 0.94)',
    desc: 'Salwa pocisków artyleryjskich spadająca na pozycje wroga i platformy z potężną falą uderzeniową.',
    implemented: true
  },
  {
    id: 'SENTRY_GUN',
    name: 'Wieżyczka Strażnicza',
    tag: '[SENTRY]',
    short: 'SENTRY',
    killsRequired: 7,
    icon: '◈',
    accent: '#38bdf8',
    bgTint: 'rgba(12, 34, 54, 0.92)',
    desc: 'Automatyczne działko obrotowe z celownikiem laserowym, prowadzące ogień zaporowy do celów w zasięgu wzroku.',
    implemented: true
  },
  {
    id: 'ATTACK_DRONE',
    name: 'Dron Bojowy',
    tag: '[DRON]',
    short: 'DRON',
    killsRequired: 9,
    duration: 25,
    icon: '►',
    accent: '#10b981',
    bgTint: 'rgba(10, 42, 34, 0.92)',
    desc: 'Zaawansowany dron asystujący graczowi z powietrza ciągłym ogniem w kierunku celowania.',
    implemented: true
  },
  {
    id: 'JUGGERNAUT',
    name: 'Pancerz Juggernaut',
    tag: '[KOLOS]',
    short: 'KOLOS',
    killsRequired: 11,
    icon: '■■',
    accent: '#eab308',
    bgTint: 'rgba(46, 34, 8, 0.94)',
    desc: 'Ciężki pancerz balistyczny (250 HP) oraz wielolufowy Minigun kosztem obniżonej mobilności operatora.',
    implemented: true
  }
];

export const MAX_EQUIPPED_KILLSTREAKS = 3;
export const KILLSTREAKS_STORAGE_KEY = 'keep_it_high_killstreak_loadout_v1';
export const DEFAULT_EQUIPPED_KILLSTREAKS = ['UAV', 'CARE_PACKAGE', 'MORTAR_STRIKE'];

const _loadoutListeners = new Set();

function normalizeEquippedKillstreakIds(ids) {
  if (!Array.isArray(ids)) return [];
  const validSet = new Set(KILLSTREAKS.map(k => k.id));
  const unique = [];
  for (const id of ids) {
    if (typeof id === 'string' && validSet.has(id) && !unique.includes(id)) {
      unique.push(id);
      if (unique.length >= MAX_EQUIPPED_KILLSTREAKS) break;
    }
  }
  return unique.sort((a, b) => {
    const defA = KILLSTREAKS.find(k => k.id === a);
    const defB = KILLSTREAKS.find(k => k.id === b);
    return (defA?.killsRequired || 0) - (defB?.killsRequired || 0);
  });
}

export function loadEquippedKillstreaks() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(KILLSTREAKS_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return normalizeEquippedKillstreakIds(parsed);
        }
      }
    }
  } catch (_) {}
  return [...DEFAULT_EQUIPPED_KILLSTREAKS];
}

export function saveEquippedKillstreaks(ids = killstreakState.equippedStreaks) {
  const normalized = normalizeEquippedKillstreakIds(ids);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KILLSTREAKS_STORAGE_KEY, JSON.stringify(normalized));
    }
  } catch (_) {}
  return normalized;
}

const _initialEquipped = loadEquippedKillstreaks();

/**
 * Obiekt stanu sesji serii zabójstw
 */
export const killstreakState = {
  // Wybrane przez gracza nagrody na mecz (maksymalnie 3, jak w Call of Duty)
  equippedStreaks: [..._initialEquipped],
  selectionHistory: [..._initialEquipped],

  // Bieżąca seria zabójstw gracza na bieżące życie (resetowana przy zgonie)
  currentStreak: 0,

  // Rekordowa seria zabójstw w bieżącym meczu
  highestStreak: 0,

  // Ostatnio nagrodzony poziom serii (zapobiega duplikatom)
  lastAwardedThreshold: 0,

  // Nagrody odblokowane i gotowe do aktywacji (np. ['UAV'])
  // Zachowywane w ekwipunku gracza nawet po zgonie, dopóki nie zostaną zużyte!
  availableStreaks: [],

  // Aktualnie trwające efekty na arenie (np. [{ id: 'UAV', duration: 20, timeRemaining: 20 }])
  activeStreaks: [],

  // Pomiary i animacje radarowe UAV
  uavScanPhase: 0,

  // Flaga ostatniego powiadomienia na HUD
  recentNotification: null,
  notificationTimer: 0,

  // Mikro-animacje HUD (odblokowanie, impuls fraga, aktywacja, płynny postęp)
  uiAnim: {
    killBump: 0,
    unlockPop: 0,
    activateFlash: 0,
    activateColor: '#00e5ff',
    smoothProgress: 0,
    notifEnter: 0,
    shimmerPos: -0.35
  },

  // Współrzędne klikalnego widgetu HUD na ekranie (dla myszy i dotyku)
  hudButtonBounds: null,

  // Tryb celowania nalotu moździerzowego (duży czerwony celownik, przytrzymanie i przeciąganie)
  mortarTargeting: false,
  mortarDragging: false,
  mortarDragMode: null,
  mortarDragOffsetX: 0,
  mortarDragOffsetY: 0,
  mortarCrosshairScreenX: null,
  mortarCrosshairScreenY: null,
  mortarCameraX: 0,
  mortarCameraY: null,
  mortarTargetX: 0,
  mortarTargetY: 0,
  mortarPendingLaunch: null,
  mortarTargetTouchId: null,
  lastTouchScreenX: null,
  touchStartX: null,
  touchStartY: null,
  lastTapTime: 0,
  lastTapX: 0,
  mortarCancelButtonBounds: null,
  mortarPlayerButtonBounds: null,
  mortarConfirmButtonBounds: null,
  mortarLeftNavBounds: null,
  mortarRightNavBounds: null
};

/**
 * Pobiera definicję nagrody po identyfikatorze
 */
export function getKillstreakDef(id) {
  if (!id) return null;
  return KILLSTREAKS.find(k => k.id === id) || null;
}

/**
 * Zwraca listę ID wybranych nagród za serię zabójstw (max 3)
 */
export function getEquippedKillstreaks() {
  if (!Array.isArray(killstreakState.equippedStreaks)) {
    killstreakState.equippedStreaks = loadEquippedKillstreaks();
  }
  return [...killstreakState.equippedStreaks];
}

/**
 * Zwraca pełne definicje wybranych nagród posortowane po wymaganym progu fragów
 */
export function getEquippedKillstreakDefs() {
  const ids = getEquippedKillstreaks();
  return ids
    .map(id => getKillstreakDef(id))
    .filter(Boolean)
    .sort((a, b) => a.killsRequired - b.killsRequired);
}

export function subscribeKillstreakLoadout(listener) {
  if (typeof listener !== 'function') return () => {};
  _loadoutListeners.add(listener);
  return () => _loadoutListeners.delete(listener);
}

function notifyLoadoutListeners() {
  for (const fn of _loadoutListeners) {
    try { fn(getEquippedKillstreaks()); } catch (_) {}
  }
}

/**
 * Ustawia zestaw wybranych nagród za serię zabójstw (maksymalnie 3) i zapisuje go lokalnie
 */
export function setEquippedKillstreaks(ids) {
  const normalized = normalizeEquippedKillstreakIds(ids);
  killstreakState.equippedStreaks = normalized;
  killstreakState.selectionHistory = [...normalized];
  saveEquippedKillstreaks(normalized);
  notifyLoadoutListeners();
  return [...normalized];
}

/**
 * Przełącza nagrodę w zestawie gracza (do 3 nagród; przy pełnych 3 zastępuje najstarszą wybraną)
 */
export function toggleEquippedKillstreak(streakId) {
  const def = getKillstreakDef(streakId);
  if (!def) return { equipped: getEquippedKillstreaks(), action: 'invalid', replacedId: null };

  const cur = Array.isArray(killstreakState.equippedStreaks) ? [...killstreakState.equippedStreaks] : [];
  let history = Array.isArray(killstreakState.selectionHistory)
    ? killstreakState.selectionHistory.filter(id => cur.includes(id))
    : [...cur];
  for (const id of cur) {
    if (!history.includes(id)) history.push(id);
  }

  let action = 'added';
  let replacedId = null;
  const existingIdx = cur.indexOf(streakId);

  if (existingIdx !== -1) {
    cur.splice(existingIdx, 1);
    history = history.filter(id => id !== streakId);
    action = 'removed';
  } else {
    if (cur.length >= MAX_EQUIPPED_KILLSTREAKS) {
      replacedId = history.shift() || cur[0];
      const remIdx = cur.indexOf(replacedId);
      if (remIdx !== -1) cur.splice(remIdx, 1);
      action = 'replaced';
    }
    cur.push(streakId);
    history.push(streakId);
  }

  const normalized = normalizeEquippedKillstreakIds(cur);
  killstreakState.equippedStreaks = normalized;
  killstreakState.selectionHistory = history;
  saveEquippedKillstreaks(normalized);
  notifyLoadoutListeners();

  return { equipped: [...normalized], action, replacedId };
}

/**
 * Zwraca najbliższy wybrany killstreak do osiągnięcia na podstawie aktualnej liczby fragów
 */
export function getNextKillstreakGoal(streak = killstreakState.currentStreak) {
  const equippedDefs = getEquippedKillstreakDefs();
  for (const ks of equippedDefs) {
    if (ks.killsRequired > streak) {
      return ks;
    }
  }
  return null;
}

export function setKillstreakNotification(title, text, color = '#00e5ff', duration = 3.0, streakId = null) {
  killstreakState.recentNotification = {
    title,
    text,
    color,
    duration,
    streakId
  };
  killstreakState.notificationTimer = duration;
  if (killstreakState.uiAnim) {
    killstreakState.uiAnim.notifEnter = 0;
  }
}

export function triggerKillstreakUnlockAnim(streakId = null) {
  const def = getKillstreakDef(streakId);
  if (!killstreakState.uiAnim) return;
  killstreakState.uiAnim.unlockPop = 1.0;
  killstreakState.uiAnim.shimmerPos = -0.35;
  killstreakState.uiAnim.activateColor = def?.accent || '#00e5ff';
}

export function triggerKillstreakActivateAnim(streakId = null) {
  const def = getKillstreakDef(streakId);
  if (!killstreakState.uiAnim) return;
  killstreakState.uiAnim.activateFlash = 1.0;
  killstreakState.uiAnim.activateColor = def?.accent || '#00e5ff';
}
