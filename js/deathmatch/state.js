// =========================================================================
// DEATHMATCH/STATE.JS - STAN I KONFIGURACJA TRYBU DEATHMATCH (ARENA 2)
// Czas trwania: 5 minut (300 sekund) | Tryby: Team Deathmatch & FFA
// Nagrody XP: 1. miejsce (100 XP), 2. miejsce (80 XP), 3. miejsce (60 XP), udział (40 XP)
// =========================================================================

export const DEATHMATCH_DURATION = 300; // 5 minut w sekundach

export const DEATHMATCH_XP_REWARDS = {
  PLACE_1: 100,
  PLACE_2: 80,
  PLACE_3: 60,
  PARTICIPATION: 40
};

export const DEATHMATCH_MODES = {
  TDM: 'TDM', // Drużynowy Deathmatch (Niebiescy vs Czerwoni)
  FFA: 'FFA'  // Każdy na Każdego (Free For All)
};

export const TEAMS = {
  CYAN: 'CYAN',     // Drużyna Niebieska
  ORANGE: 'ORANGE'  // Drużyna Czerwona / Pomarańczowa
};

export const WIN_CONDITIONS = {
  BOTH: 'BOTH',   // Czas lub limit fragów (co pierwsze)
  FRAGS: 'FRAGS', // Tylko limit fragów
  TIME: 'TIME'    // Tylko limit czasu
};

export const DEATHMATCH_PHASES = {
  COUNTDOWN: 'COUNTDOWN', // 3-sekundowe zamrożenie i odliczanie (3.. 2.. 1..)
  ACTIVE: 'ACTIVE',       // Runda w toku (ruch, walka, naliczanie czasu)
  ENDED: 'ENDED'          // Mecz zakończony (podium i statystyki)
};

const STORAGE_KEY_MODE = 'kih_deathmatch_mode_v1';
const STORAGE_KEY_TEAM = 'kih_deathmatch_player_team_v1';
const STORAGE_KEY_WIN_CONDITION = 'kih_deathmatch_win_condition_v1';
const STORAGE_KEY_FRAG_LIMIT = 'kih_deathmatch_frag_limit_v1';
const STORAGE_KEY_DURATION = 'kih_deathmatch_duration_v1';

function getStoredMode() {
  try {
    const val = localStorage.getItem(STORAGE_KEY_MODE);
    if (val === 'FFA' || val === 'TDM') return val;
  } catch (_) {}
  return DEATHMATCH_MODES.TDM;
}

function getStoredTeam() {
  try {
    const val = localStorage.getItem(STORAGE_KEY_TEAM);
    if (val === 'ORANGE' || val === 'CYAN') return val;
  } catch (_) {}
  return TEAMS.CYAN;
}

function getStoredWinCondition() {
  try {
    const val = localStorage.getItem(STORAGE_KEY_WIN_CONDITION);
    if (val === 'FRAGS' || val === 'TIME' || val === 'BOTH') return val;
  } catch (_) {}
  return WIN_CONDITIONS.BOTH;
}

function getStoredFragLimit() {
  try {
    const val = parseInt(localStorage.getItem(STORAGE_KEY_FRAG_LIMIT), 10);
    if (!isNaN(val) && val >= 5 && val <= 100) return val;
  } catch (_) {}
  return 25;
}

function getStoredDuration() {
  try {
    const val = parseInt(localStorage.getItem(STORAGE_KEY_DURATION), 10);
    if (!isNaN(val) && val >= 60 && val <= 1800) return val;
  } catch (_) {}
  return DEATHMATCH_DURATION;
}

export const deathmatchConfig = {
  duration: getStoredDuration(),
  mode: getStoredMode(),
  playerTeam: getStoredTeam(),
  winCondition: getStoredWinCondition(),
  fragLimit: getStoredFragLimit(),
  killLimit: getStoredFragLimit()
};

export function isDeathmatchFFA() {
  return deathmatchState.mode === DEATHMATCH_MODES.FFA || deathmatchConfig.mode === DEATHMATCH_MODES.FFA;
}

export function isDeathmatchCountdown() {
  return deathmatchState.active && deathmatchState.matchPhase === DEATHMATCH_PHASES.COUNTDOWN;
}

export function isDeathmatchActive() {
  return deathmatchState.active && deathmatchState.matchPhase === DEATHMATCH_PHASES.ACTIVE;
}

export function setDeathmatchMode(mode) {
  if (mode === DEATHMATCH_MODES.TDM || mode === DEATHMATCH_MODES.FFA) {
    deathmatchConfig.mode = mode;
    deathmatchState.mode = mode;
    try { localStorage.setItem(STORAGE_KEY_MODE, mode); } catch (_) {}
  }
}

export function setDeathmatchPlayerTeam(team) {
  if (team === TEAMS.CYAN || team === TEAMS.ORANGE) {
    deathmatchConfig.playerTeam = team;
    deathmatchState.playerTeam = team;
    try { localStorage.setItem(STORAGE_KEY_TEAM, team); } catch (_) {}
  }
}

export function setDeathmatchWinCondition(condition) {
  if (condition === WIN_CONDITIONS.BOTH || condition === WIN_CONDITIONS.FRAGS || condition === WIN_CONDITIONS.TIME) {
    deathmatchConfig.winCondition = condition;
    deathmatchState.winCondition = condition;
    try { localStorage.setItem(STORAGE_KEY_WIN_CONDITION, condition); } catch (_) {}
  }
}

export function setDeathmatchFragLimit(limit) {
  const parsed = parseInt(limit, 10);
  if (!isNaN(parsed) && parsed >= 5 && parsed <= 100) {
    deathmatchConfig.fragLimit = parsed;
    deathmatchConfig.killLimit = parsed;
    deathmatchState.fragLimit = parsed;
    try { localStorage.setItem(STORAGE_KEY_FRAG_LIMIT, String(parsed)); } catch (_) {}
  }
}

export function setDeathmatchDuration(seconds) {
  const parsed = parseInt(seconds, 10);
  if (!isNaN(parsed) && parsed >= 60 && parsed <= 1800) {
    deathmatchConfig.duration = parsed;
    deathmatchState.timeRemaining = parsed;
    deathmatchState.matchDuration = parsed;
    try { localStorage.setItem(STORAGE_KEY_DURATION, String(parsed)); } catch (_) {}
  }
}

export const deathmatchState = {
  active: false,
  matchPhase: DEATHMATCH_PHASES.COUNTDOWN, // 'COUNTDOWN' | 'ACTIVE' | 'ENDED'
  countdownTimer: 3.0,                     // 3-sekundowe odliczanie przed startem
  countdownDuration: 3.0,
  countdownBeeps: { 3: false, 2: false, 1: false, 0: false },
  fightBannerTimer: 0,                     // Czas wyświetlania banera WALKA! po zakończeniu odliczania
  mode: deathmatchConfig.mode,
  playerTeam: deathmatchConfig.playerTeam,
  winCondition: deathmatchConfig.winCondition,
  fragLimit: deathmatchConfig.fragLimit,
  matchDuration: deathmatchConfig.duration,
  timeRemaining: deathmatchConfig.duration, // Sekundy (odliczanie duration -> 0)
  elapsedTime: 0,
  matchEnded: false,
  endReason: null, // 'FRAG_LIMIT', 'TIME_LIMIT', 'FORFEIT'
  endCelebrationTimer: 0,
  maxEndCelebrationTimer: 480, // ~8 sekund prezentacji podium
  xpAwarded: false,
  awardedXpAmount: 0,
  playerPlace: 1,
  winningTeam: null,
  winningPlayer: null,

  // Statystyki drużynowe w trybie TDM
  teamScores: {
    [TEAMS.CYAN]: 0,
    [TEAMS.ORANGE]: 0
  },

  // Uczestnicy meczu (Gracz + Boty AI)
  participants: [],

  // Posortowana tablica wyników (Leaderboard)
  leaderboard: [],

  // Granice przycisku powrotu do lobby na ekranie podium
  returnButtonBounds: null
};

export function resetDeathmatchState() {
  deathmatchState.active = false;
  deathmatchState.matchPhase = DEATHMATCH_PHASES.COUNTDOWN;
  deathmatchState.countdownTimer = 3.0;
  deathmatchState.countdownDuration = 3.0;
  deathmatchState.countdownBeeps = { 3: false, 2: false, 1: false, 0: false };
  deathmatchState.fightBannerTimer = 0;
  deathmatchState.mode = deathmatchConfig.mode;
  deathmatchState.playerTeam = deathmatchConfig.playerTeam;
  deathmatchState.winCondition = deathmatchConfig.winCondition;
  deathmatchState.fragLimit = deathmatchConfig.fragLimit;
  deathmatchState.matchDuration = deathmatchConfig.duration;
  deathmatchState.timeRemaining = deathmatchConfig.duration;
  deathmatchState.elapsedTime = 0;
  deathmatchState.matchEnded = false;
  deathmatchState.endReason = null;
  deathmatchState.endCelebrationTimer = 0;
  deathmatchState.xpAwarded = false;
  deathmatchState.awardedXpAmount = 0;
  deathmatchState.playerPlace = 1;
  deathmatchState.winningTeam = null;
  deathmatchState.winningPlayer = null;
  deathmatchState.teamScores[TEAMS.CYAN] = 0;
  deathmatchState.teamScores[TEAMS.ORANGE] = 0;
  deathmatchState.participants.length = 0;
  deathmatchState.leaderboard.length = 0;
  deathmatchState.returnButtonBounds = null;
}

if (typeof window !== 'undefined') {
  window.deathmatchState = deathmatchState;
  window.deathmatchConfig = deathmatchConfig;
  window.isDeathmatchFFA = isDeathmatchFFA;
  window.isDeathmatchCountdown = isDeathmatchCountdown;
  window.isDeathmatchActive = isDeathmatchActive;
  window.DEATHMATCH_PHASES = DEATHMATCH_PHASES;
  window.WIN_CONDITIONS = WIN_CONDITIONS;
  window.setDeathmatchWinCondition = setDeathmatchWinCondition;
  window.setDeathmatchFragLimit = setDeathmatchFragLimit;
  window.setDeathmatchDuration = setDeathmatchDuration;
}
