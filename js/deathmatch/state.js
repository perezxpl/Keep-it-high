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

const STORAGE_KEY_MODE = 'kih_deathmatch_mode_v1';
const STORAGE_KEY_TEAM = 'kih_deathmatch_player_team_v1';

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

export const deathmatchConfig = {
  duration: DEATHMATCH_DURATION,
  mode: getStoredMode(),
  playerTeam: getStoredTeam(),
  killLimit: 20 // Opcjonalny pułap fragów
};

export function isDeathmatchFFA() {
  return deathmatchState.mode === DEATHMATCH_MODES.FFA || deathmatchConfig.mode === DEATHMATCH_MODES.FFA;
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

export const deathmatchState = {
  active: false,
  mode: deathmatchConfig.mode,
  playerTeam: deathmatchConfig.playerTeam,
  timeRemaining: DEATHMATCH_DURATION, // Sekundy (odliczanie 300 -> 0)
  matchEnded: false,
  endCelebrationTimer: 0,
  maxEndCelebrationTimer: 480, // ~8 sekund prezentacji podium
  xpAwarded: false,
  awardedXpAmount: 0,
  playerPlace: 1,

  // Statystyki drużynowe w trybie TDM
  teamScores: {
    [TEAMS.CYAN]: 0,
    [TEAMS.ORANGE]: 0
  },

  // Uczestnicy meczu (Gracz + Boty AI)
  participants: [],

  // Posortowana tablica wyników (Leaderboard)
  leaderboard: []
};

export function resetDeathmatchState() {
  deathmatchState.active = false;
  deathmatchState.mode = deathmatchConfig.mode;
  deathmatchState.playerTeam = deathmatchConfig.playerTeam;
  deathmatchState.timeRemaining = deathmatchConfig.duration;
  deathmatchState.matchEnded = false;
  deathmatchState.endCelebrationTimer = 0;
  deathmatchState.xpAwarded = false;
  deathmatchState.awardedXpAmount = 0;
  deathmatchState.playerPlace = 1;
  deathmatchState.teamScores[TEAMS.CYAN] = 0;
  deathmatchState.teamScores[TEAMS.ORANGE] = 0;
  deathmatchState.participants.length = 0;
  deathmatchState.leaderboard.length = 0;
}

if (typeof window !== 'undefined') {
  window.deathmatchState = deathmatchState;
  window.deathmatchConfig = deathmatchConfig;
  window.isDeathmatchFFA = isDeathmatchFFA;
}
