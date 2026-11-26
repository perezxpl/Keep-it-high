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

/**
 * Obiekt stanu sesji serii zabójstw
 */
export const killstreakState = {
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

  // Tryb celowania nalotu moździerzowego (dotyk / mysz na ekranie)
  mortarTargeting: false,
  mortarCameraX: 0,
  mortarTargetX: 0,
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
 * Zwraca najbliższy killstreak do osiągnięcia na podstawie aktualnej liczby fragów
 */
export function getNextKillstreakGoal(streak = killstreakState.currentStreak) {
  for (const ks of KILLSTREAKS) {
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
