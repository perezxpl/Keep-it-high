/**
 * Moduł progresji i rang wojskowych dla Fragball (Keep-it-high)
 * System czysto statystyczny / prestiżowy oparty na punktach XP w localStorage.
 */

export const RANKS = [
  { id: 'SZEREGOWY', name: 'Szeregowy', short: 'Szer.', minXp: 0, icon: '━' },
  { id: 'ST_SZEREGOWY', name: 'Starszy Szeregowy', short: 'St. szer.', minXp: 400, icon: '━━' },
  { id: 'KAPRAL', name: 'Kapral', short: 'Kpr.', minXp: 1000, icon: '▲▲' },
  { id: 'ST_KAPRAL', name: 'Starszy Kapral', short: 'St. kpr.', minXp: 1800, icon: '▲▲━' },
  { id: 'PLUTONOWY', name: 'Plutonowy', short: 'Plut.', minXp: 3000, icon: '▲▲▲' },
  { id: 'SIERZANT', name: 'Sierżant', short: 'Sierż.', minXp: 4600, icon: '▲▲▲━' },
  { id: 'CHORAZY', name: 'Chorąży', short: 'Chor.', minXp: 6800, icon: '★' },
  { id: 'PODPORUCZNIK', name: 'Podporucznik', short: 'Ppor.', minXp: 9500, icon: '★★' },
  { id: 'KAPITAN', name: 'Kapitan', short: 'Kpt.', minXp: 13000, icon: '★★★' },
  { id: 'MAJOR', name: 'Major', short: 'Mjr.', minXp: 18000, icon: '✦' },
  { id: 'PULKOWNIK', name: 'Pułkownik', short: 'Płk.', minXp: 25000, icon: '✦✦' },
  { id: 'GENERAL', name: 'Generał Areny', short: 'Gen.', minXp: 35000, icon: '⚔ ★' }
];

export function getPlayerXP() {
  const parsed = parseInt(localStorage.getItem('fragball_xp') || '0', 10);
  return Number.isFinite(parsed) && !Number.isNaN(parsed) ? parsed : 0;
}

export function addPlayerXP(amount) {
  const delta = parseInt(amount, 10);
  if (!Number.isFinite(delta) || Number.isNaN(delta)) return getPlayerXP();
  const current = getPlayerXP();
  const updated = Math.max(0, current + delta);
  localStorage.setItem('fragball_xp', updated.toString());
  return updated;
}

export function getCurrentRank(xp = getPlayerXP()) {
  const safeXp = Number.isFinite(xp) ? xp : getPlayerXP();
  let rank = RANKS[0];
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (safeXp >= RANKS[i].minXp) {
      rank = RANKS[i];
      break;
    }
  }
  return rank;
}

export function getNextRank(xp = getPlayerXP()) {
  const current = getCurrentRank(xp);
  const currentIndex = RANKS.findIndex(r => r.id === current.id);
  if (currentIndex < RANKS.length - 1) {
    return RANKS[currentIndex + 1];
  }
  return null; // Osiągnięto rangę maksymalną
}

export function getRankProgress(xp = getPlayerXP()) {
  const current = getCurrentRank(xp);
  const next = getNextRank(xp);
  if (!next) return 1.0;
  const span = next.minXp - current.minXp;
  if (span <= 0) return 1.0;
  return Math.min(1.0, Math.max(0.0, (xp - current.minXp) / span));
}

// =============================================================================
// STATYSTYKI BOJOWE GRACZA (DOSSIER)
// =============================================================================
export const DEFAULT_PLAYER_STATS = {
  matchesPlayed: 0,
  matchesWon: 0,
  matchesLost: 0,
  kills: 0,
  deaths: 0,
  goalsScored: 0
};

const STATS_STORAGE_KEY = 'fragball_player_stats_v1';

export function getPlayerStats() {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PLAYER_STATS };
    const p = JSON.parse(raw);
    return {
      matchesPlayed: Number.isFinite(p.matchesPlayed) && p.matchesPlayed >= 0 ? p.matchesPlayed : 0,
      matchesWon: Number.isFinite(p.matchesWon) && p.matchesWon >= 0 ? p.matchesWon : 0,
      matchesLost: Number.isFinite(p.matchesLost) && p.matchesLost >= 0 ? p.matchesLost : 0,
      kills: Number.isFinite(p.kills) && p.kills >= 0 ? p.kills : 0,
      deaths: Number.isFinite(p.deaths) && p.deaths >= 0 ? p.deaths : 0,
      goalsScored: Number.isFinite(p.goalsScored) && p.goalsScored >= 0 ? p.goalsScored : 0
    };
  } catch (e) {
    console.warn('[PROG] Błąd odczytu statystyk gracza:', e);
    return { ...DEFAULT_PLAYER_STATS };
  }
}

export function savePlayerStats(stats) {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn('[PROG] Błąd zapisu statystyk gracza:', e);
  }
}

export function recordMatchResult(result) {
  const stats = getPlayerStats();
  stats.matchesPlayed = (stats.matchesPlayed || 0) + 1;
  if (result === 'WIN') {
    stats.matchesWon = (stats.matchesWon || 0) + 1;
  } else if (result === 'LOSS') {
    stats.matchesLost = (stats.matchesLost || 0) + 1;
  }
  savePlayerStats(stats);
  return stats;
}

export function recordKill(amount = 1) {
  const stats = getPlayerStats();
  stats.kills = (stats.kills || 0) + Math.max(1, parseInt(amount, 10) || 1);
  savePlayerStats(stats);
  return stats;
}

export function recordDeath(amount = 1) {
  const stats = getPlayerStats();
  stats.deaths = (stats.deaths || 0) + Math.max(1, parseInt(amount, 10) || 1);
  savePlayerStats(stats);
  return stats;
}

export function recordGoal(amount = 1) {
  const stats = getPlayerStats();
  stats.goalsScored = (stats.goalsScored || 0) + Math.max(1, parseInt(amount, 10) || 1);
  savePlayerStats(stats);
  return stats;
}

export function resetPlayerStats() {
  const def = { ...DEFAULT_PLAYER_STATS };
  savePlayerStats(def);
  return def;
}

export function getPlayerStatsSummary() {
  const s = getPlayerStats();
  let kdRatio = '0.00';
  if (s.deaths === 0) {
    kdRatio = s.kills > 0 ? s.kills.toFixed(2) : '0.00';
  } else {
    kdRatio = (s.kills / s.deaths).toFixed(2);
  }

  const winRate = s.matchesPlayed === 0 
    ? '0%' 
    : `${Math.round((s.matchesWon / s.matchesPlayed) * 100)}%`;

  return {
    ...s,
    kdRatio,
    winRate
  };
}

// Opcjonalne wystawienie w celach pomocniczych/debugowania w konsoli przeglądarki
if (typeof window !== 'undefined') {
  window.FragballProgression = {
    RANKS,
    getPlayerXP,
    addPlayerXP,
    getCurrentRank,
    getNextRank,
    getRankProgress,
    getPlayerStats,
    savePlayerStats,
    recordMatchResult,
    recordKill,
    recordDeath,
    recordGoal,
    resetPlayerStats,
    getPlayerStatsSummary
  };
}
