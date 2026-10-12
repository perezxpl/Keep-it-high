/**
 * Moduł progresji i rang wojskowych dla Fragball (Keep-it-high)
 * System czysto statystyczny / prestiżowy oparty na punktach XP w localStorage.
 */

export const RANKS = [
  { id: 'SZEREGOWY', name: 'Szeregowy', short: 'Szer.', minXp: 0, icon: '━' },
  { id: 'ST_SZEREGOWY', name: 'St. Szeregowy', short: 'St. szer.', minXp: 400, icon: '━━' },
  { id: 'KAPRAL', name: 'Kapral', short: 'Kpr.', minXp: 1000, icon: '▲▲' },
  { id: 'ST_KAPRAL', name: 'St. Kapral', short: 'St. kpr.', minXp: 1800, icon: '▲▲━' },
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

// Opcjonalne wystawienie w celach pomocniczych/debugowania w konsoli przeglądarki
if (typeof window !== 'undefined') {
  window.FragballProgression = {
    RANKS,
    getPlayerXP,
    addPlayerXP,
    getCurrentRank,
    getNextRank,
    getRankProgress
  };
}
