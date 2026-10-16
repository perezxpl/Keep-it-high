/**
 * Moduł progresji i rang wojskowych dla Fragball (Keep-it-high)
 * System czysto statystyczny / prestiżowy oparty na punktach XP w localStorage.
 */

export const RANKS = [
  {
    id: 'SZEREGOWY',
    tier: 1,
    name: 'Szeregowy',
    short: 'Szer.',
    minXp: 0,
    icon: '━',
    desc: 'Podstawowy stopień rekruta. Chrzest bojowy na arenie walki.',
    unlocks: [
      { type: 'WEAPON', label: 'Karabin AK-47' },
      { type: 'STREAK', label: 'Seria: [UAV] Radar (3 fragi)' }
    ]
  },
  {
    id: 'ST_SZEREGOWY',
    tier: 2,
    name: 'Starszy Szeregowy',
    short: 'St. szer.',
    minXp: 400,
    icon: '━━',
    desc: 'Weteran pierwszych potyczek o potwierdzonej dyscyplinie.',
    unlocks: [
      { type: 'CAMO', label: 'Kamuflaż broni: Pustynny DPM' },
      { type: 'TITLE', label: 'Tytuł: Operator Polowy' }
    ]
  },
  {
    id: 'KAPRAL',
    tier: 3,
    name: 'Kapral',
    short: 'Kpr.',
    minXp: 1000,
    icon: '▲▲',
    desc: 'Młodszy podoficer. Wysoka skuteczność w starciach kontaktowych.',
    unlocks: [
      { type: 'WEAPON', label: 'Strzelba bojowa Shotgun' },
      { type: 'PERK', label: 'Atut: Zwinne Dłonie (-30% czas przeładowania)' }
    ]
  },
  {
    id: 'ST_KAPRAL',
    tier: 4,
    name: 'Starszy Kapral',
    short: 'St. kpr.',
    minXp: 1800,
    icon: '▲▲━',
    desc: 'Doświadczony operator sekcji szturmowej na arenie.',
    unlocks: [
      { type: 'STREAK', label: 'Seria: [ZRZUT] Skrzynia Zaopatrzenia (4 fragi)' },
      { type: 'CAMO', label: 'Kamuflaż broni: Miejski Cyfrowy' }
    ]
  },
  {
    id: 'PLUTONOWY',
    tier: 5,
    name: 'Plutonowy',
    short: 'Plut.',
    minXp: 3000,
    icon: '▲▲▲',
    desc: 'Lider natarcia. Doskonała precyzja i mobilność jetpacka.',
    unlocks: [
      { type: 'WEAPON', label: 'Pistolet Maszynowy SMG / MP5' },
      { type: 'PERK', label: 'Atut: Szabrownik (Pakiety amunicji z wrogów)' }
    ]
  },
  {
    id: 'SIERZANT',
    tier: 6,
    name: 'Sierżant',
    short: 'Sierż.',
    minXp: 4600,
    icon: '▲▲▲━',
    desc: 'Taktyczny kręgosłup drużyny w defensywie i ataku.',
    unlocks: [
      { type: 'STREAK', label: 'Seria: [NALOT] Ostrzał Moździerzowy (5 fragów)' },
      { type: 'CAMO', label: 'Kamuflaż broni: Tygrys Leśny' }
    ]
  },
  {
    id: 'CHORAZY',
    tier: 7,
    name: 'Chorąży',
    short: 'Chor.',
    minXp: 6800,
    icon: '◈',
    desc: 'Starszy podoficer koordynujący kluczowe przełamania wroga.',
    unlocks: [
      { type: 'WEAPON', label: 'Barrett .50 Karabin Wyborowy' },
      { type: 'PERK', label: 'Atut: Kamizelka Flak (-40% obrażeń od wybuchów)' }
    ]
  },
  {
    id: 'PODPORUCZNIK',
    tier: 8,
    name: 'Podporucznik',
    short: 'Ppor.',
    minXp: 9500,
    icon: '◈◈',
    desc: 'Oficer polowy o bezwzględnej celności i instynkcie walki.',
    unlocks: [
      { type: 'STREAK', label: 'Seria: [SENTRY] Wieżyczka Strażnicza (7 fragów)' },
      { type: 'CAMO', label: 'Kamuflaż broni: Arktyczny Śnieg' }
    ]
  },
  {
    id: 'KAPITAN',
    tier: 9,
    name: 'Kapitan',
    short: 'Kpt.',
    minXp: 13000,
    icon: '◈◈◈',
    desc: 'Dowódca operacji specjalnych. Prowadzi drużynę do wiktorii.',
    unlocks: [
      { type: 'PERK', label: 'Atut: Lekki Krok (+10% prędkości sprintu/wślizgu)' },
      { type: 'GEAR', label: 'Nakrycie: Elitarny Beret Komandosa' }
    ]
  },
  {
    id: 'MAJOR',
    tier: 10,
    name: 'Major',
    short: 'Mjr.',
    minXp: 18000,
    icon: '◆',
    desc: 'Starszy oficer areny i mistrz manewrów powietrznych.',
    unlocks: [
      { type: 'STREAK', label: 'Seria: [DRON] Bojowy Dron Wsparcia (9 fragów)' },
      { type: 'CAMO', label: 'Kamuflaż broni: Taktyczna Czerń Midnight' }
    ]
  },
  {
    id: 'PULKOWNIK',
    tier: 11,
    name: 'Pułkownik',
    short: 'Płk.',
    minXp: 25000,
    icon: '◆◆',
    desc: 'Żywa legenda frontu budząca respekt wszystkich rywali.',
    unlocks: [
      { type: 'STREAK', label: 'Seria: [KOLOS] Pancerz Juggernaut (11 fragów)' },
      { type: 'GEAR', label: 'Maska: Balistyczna Maska Bojowa Specnazu' }
    ]
  },
  {
    id: 'GENERAL',
    tier: 12,
    name: 'Generał Areny',
    short: 'Gen.',
    minXp: 35000,
    icon: '◈ ◆ ◈',
    desc: 'Maksymalny stopień wojskowy. Absolutna elita Modern Military.',
    unlocks: [
      { type: 'CAMO', label: 'Prestiż: Złote Pokrycie Broni (Gold Plated)' },
      { type: 'FLAME', label: 'Jetpack: Złoty Płomień Wiktorii' }
    ]
  }
];

export const XP_REWARDS = {
  MATCH_WIN: 40,
  GOAL_SCORED: 15,
  ENEMY_KILL: 10,
  DEATHMATCH_1ST: 100,
  DEATHMATCH_2ND: 80,
  DEATHMATCH_3RD: 60,
  DEATHMATCH_PARTICIPATION: 40
};

export const XP_RULES = [
  {
    id: 'DM_1ST',
    title: '1. Miejsce — Deathmatch (5 min)',
    category: 'Deathmatch 5 Min',
    xp: 100,
    icon: '#1',
    badgeClass: 'xp-badge-goal',
    desc: 'Najwięcej eliminacji w 5-minutowej bitwie na Arenie 2 (Sektor X).',
    tip: 'Zdominuj platformy, unikaj kwasu i eliminuj rywali seriami.'
  },
  {
    id: 'DM_2ND',
    title: '2. Miejsce — Deathmatch (5 min)',
    category: 'Deathmatch 5 Min',
    xp: 80,
    icon: '#2',
    badgeClass: 'xp-badge-win',
    desc: 'Drugi wynik eliminacji w 5-minutowym starciu na Arenie 2.',
    tip: 'Wicemistrzostwo bitwy z wysoką premią doświadczenia.'
  },
  {
    id: 'DM_3RD',
    title: '3. Miejsce — Deathmatch (5 min)',
    category: 'Deathmatch 5 Min',
    xp: 60,
    icon: '#3',
    badgeClass: 'xp-badge-kill',
    desc: 'Trzecie miejsce na podium w 5-minutowej bitwie na Arenie 2.',
    tip: 'Utrzymanie się na podium w dynamicznym starciu wielu rywali.'
  },
  {
    id: 'DM_PARTICIPATION',
    title: 'Udział w Deathmatch (5 min)',
    category: 'Deathmatch 5 Min',
    xp: 40,
    icon: 'DM',
    badgeClass: 'xp-badge-win',
    desc: 'Ukończenie 5-minutowej bitwy na Arenie 2 poza podium.',
    tip: 'Gwarantowana premia bojowa za rozegranie pełnego 5-minutowego meczu.'
  },
  {
    id: 'WIN',
    title: 'Zwycięstwo w Meczu (Fragball)',
    category: 'Turniej',
    xp: 40,
    icon: 'WIN',
    badgeClass: 'xp-badge-win',
    desc: 'Wygranie meczu piłkarskiego (3 bramki na Arenie 1).',
    tip: 'Zgranie taktyczne i obrona prowadzą do pewnego triumfu.'
  },
  {
    id: 'GOAL',
    title: 'Zdobycie Bramki',
    category: 'Cel Meczu',
    xp: 15,
    icon: 'GOL',
    badgeClass: 'xp-badge-goal',
    desc: 'Celny strzał umieszczający piłkę bezpośrednio w siatce rywali.',
    tip: 'Uderzenia z woleja, Spartan Kick lub rykoszety sufitowe.'
  },
  {
    id: 'KILL',
    title: 'Eliminacja Wroga (Frag)',
    category: 'Walka',
    xp: 10,
    icon: 'FRAG',
    badgeClass: 'xp-badge-kill',
    desc: 'Zlikwidowanie wrogiego bota lub przeciwnika bronią lub granatem.',
    tip: 'Prowadź ogień ciągły lub eliminuj cele jednym strzałem snajperki.'
  },
  {
    id: 'SPARTAN',
    title: 'Spartan Kick / Wślizg',
    category: 'Walka Wręcz',
    xp: 10,
    icon: 'KICK',
    badgeClass: 'xp-badge-melee',
    desc: 'Wepchnięcie rywala potężnym kopnięciem lub wślizgiem w kwas lub przepaść.',
    tip: 'Użyj klawisza F lub X, aby odrzucić nacierającego wroga.'
  },
  {
    id: 'LOSS',
    title: 'Porażka w Meczu',
    category: 'Wynik',
    xp: 0,
    icon: 'LOSS',
    badgeClass: 'xp-badge-loss',
    desc: 'Koniec spotkania zwycięstwem drużyny przeciwnej.',
    tip: 'Zero kary punktowej — zgromadzone wcześniej XP nie przepada.'
  }
];

let _xpNotificationCallback = null;
export function setXpNotificationCallback(fn) {
  _xpNotificationCallback = fn;
}

export function notifyXpGained(text, amount, color) {
  if (typeof _xpNotificationCallback === 'function') {
    _xpNotificationCallback(text, amount, color);
  }
}

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
  const count = Math.max(1, parseInt(amount, 10) || 1);
  stats.kills = (stats.kills || 0) + count;
  savePlayerStats(stats);
  const xpEarned = XP_REWARDS.ENEMY_KILL * count;
  addPlayerXP(xpEarned);
  notifyXpGained(`+${xpEarned} XP ELIMINACJA!`, xpEarned, '#38bdf8');
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
  const count = Math.max(1, parseInt(amount, 10) || 1);
  stats.goalsScored = (stats.goalsScored || 0) + count;
  savePlayerStats(stats);
  const xpEarned = XP_REWARDS.GOAL_SCORED * count;
  addPlayerXP(xpEarned);
  notifyXpGained(`+${xpEarned} XP GOL!`, xpEarned, '#facc15');
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
    XP_REWARDS,
    XP_RULES,
    setXpNotificationCallback,
    notifyXpGained,
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
