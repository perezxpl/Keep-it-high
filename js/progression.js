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
      { type: 'WEAPON', label: 'Wyrzutnia Rakiet RPG-7' },
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
  PLAYER_KILL: 25,
  BOT_KILL: 5,
  ZOMBIE_KILL: 3,
  ENEMY_KILL: 5, // Alias wstecznej kompatybilności
  ONE_SHOT_DOUBLE: 30,
  ONE_SHOT_TRIPLE: 45,
  DOUBLE_KILL: 15,
  TRIPLE_KILL: 25,
  REVENGE_KILL: 15,
  DEATHMATCH_1ST: 100,
  DEATHMATCH_2ND: 80,
  DEATHMATCH_3RD: 60,
  DEATHMATCH_PARTICIPATION: 40
};

export const XP_RULES = [
  {
    id: 'DM_1ST',
    title: '1. Miejsce — Deathmatch Online',
    category: 'Deathmatch Online',
    xp: 100,
    icon: '#1',
    badgeClass: 'xp-badge-goal',
    desc: 'Najwięcej eliminacji w meczu online na Arenie.',
    tip: 'Zdominuj platformy, unikaj zagrożeń i eliminuj żywych rywali.'
  },
  {
    id: 'DM_2ND',
    title: '2. Miejsce — Deathmatch Online',
    category: 'Deathmatch Online',
    xp: 80,
    icon: '#2',
    badgeClass: 'xp-badge-win',
    desc: 'Drugi wynik eliminacji w meczu Deathmatch Online.',
    tip: 'Wicemistrzostwo bitwy z wysoką premią doświadczenia.'
  },
  {
    id: 'DM_3RD',
    title: '3. Miejsce — Deathmatch Online',
    category: 'Deathmatch Online',
    xp: 60,
    icon: '#3',
    badgeClass: 'xp-badge-kill',
    desc: 'Trzecie miejsce na podium w starciu Deathmatch Online.',
    tip: 'Utrzymanie się na podium w dynamicznym starciu wielu rywali.'
  },
  {
    id: 'DM_PARTICIPATION',
    title: 'Udział w Meczu Online',
    category: 'Deathmatch Online',
    xp: 40,
    icon: 'DM',
    badgeClass: 'xp-badge-win',
    desc: 'Ukończenie pełnego meczu Deathmatch poza podium.',
    tip: 'Gwarantowana premia bojowa za rozegranie pełnego spotkania.'
  },
  {
    id: 'KILL_PLAYER',
    title: 'Eliminacja Gracza (PvP)',
    category: 'Walka PvP',
    xp: 25,
    icon: 'PVP',
    badgeClass: 'xp-badge-goal',
    desc: 'Zlikwidowanie żywego gracza online — 5x więcej XP niż za bota AI.',
    tip: 'Poluj na prawdziwych operatorów drużyny przeciwnej, aby szybko awansować.'
  },
  {
    id: 'KILL_BOT',
    title: 'Eliminacja Bota (AI)',
    category: 'Walka AI',
    xp: 5,
    icon: 'BOT',
    badgeClass: 'xp-badge-kill',
    desc: 'Zlikwidowanie bota uzupełniającego braki w składzie drużyny.',
    tip: 'Boty dopełniają składy i dają bazowe wsparcie punktowe (+5 XP).'
  },
  {
    id: 'KILL_ZOMBIE',
    title: 'Eliminacja Zombie',
    category: 'Plaga Zombie',
    xp: 3,
    icon: 'ZMB',
    badgeClass: 'xp-badge-melee',
    desc: 'Ostateczne uśmiercenie zombie w trybie Plagi Zombie.',
    tip: 'Celuj w głowę lub użyj maczety / ognia, aby zombie nie wstał.'
  },
  {
    id: 'one_shot_collateral',
    title: '1 strzał = 2/3 trupy',
    category: 'Medale Bojowe',
    xp: 30,
    icon: '1=2',
    badgeClass: 'xp-badge-kill',
    desc: 'Przebicie i zabicie 2 lub 3 przeciwników jednym pociskiem (+30 / +45 XP; bez zombie).',
    tip: 'Ustaw wrogów w jednej linii z Barrettem .50 lub Magnum .44.'
  },
  {
    id: 'multi_kill_combo',
    title: 'Seria Wielobójstw',
    category: 'Medale Bojowe',
    xp: 15,
    icon: '2X',
    badgeClass: 'xp-badge-kill',
    desc: 'Podwójne (+15 XP), potrójne (+25 XP) i wyższe serie zabójstw w odstępie do 2s (bez zombie).',
    tip: 'Łącz krótkie serie z karabinka, granaty i RPG-7 w szybkim tempie.'
  },
  {
    id: 'revenge_kill',
    title: 'Zemsta',
    category: 'Medale Bojowe',
    xp: 15,
    icon: 'ZEM',
    badgeClass: 'xp-badge-kill',
    desc: 'Zabicie oprawcy, który ostatnio Cię wyeliminował — zanim zginiesz ponownie.',
    tip: 'Zapoluj na przeciwnika zaraz po odrodzeniu, unikając wcześniejszej śmierci.'
  },
  {
    id: 'SPARTAN',
    title: 'Spartan Kick',
    category: 'Walka Wręcz',
    xp: 10,
    icon: 'KICK',
    badgeClass: 'xp-badge-melee',
    desc: 'Wepchnięcie rywala potężnym kopnięciem w kwas, lawę lub przepaść.',
    tip: 'Użyj Spacji lub PPM, aby odrzucić nacierającego wroga.'
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

let _rankUpCallback = null;
export function setRankUpCallback(fn) {
  _rankUpCallback = fn;
}

export function notifyXpGained(text, amount, color) {
  if (typeof window !== 'undefined' && window.isMenuShowcase) return;
  if (typeof _xpNotificationCallback === 'function') {
    _xpNotificationCallback(text, amount, color);
  }
}

export function getPlayerXP() {
  const parsed = parseInt(localStorage.getItem('fragball_xp') || '0', 10);
  return Number.isFinite(parsed) && !Number.isNaN(parsed) ? parsed : 0;
}

export function addPlayerXP(amount) {
  if (typeof window !== 'undefined' && window.isMenuShowcase) return getPlayerXP();
  const delta = parseInt(amount, 10);
  if (!Number.isFinite(delta) || Number.isNaN(delta)) return getPlayerXP();
  const current = getPlayerXP();
  const prevRank = getCurrentRank(current);
  const updated = Math.max(0, current + delta);
  localStorage.setItem('fragball_xp', updated.toString());
  const newRank = getCurrentRank(updated);
  if (newRank.id !== prevRank.id) {
    if (typeof _rankUpCallback === 'function') {
      _rankUpCallback(newRank);
    }
  }
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
  playerKills: 0,
  botKills: 0,
  zombieKills: 0,
  deaths: 0
};

const STATS_STORAGE_KEY = 'fragball_player_stats_v1';
const _recentKillRecords = new Map();
const KILL_DEDUPE_WINDOW_MS = 1200;

export function classifyVictimTargetType(victim) {
  if (!victim) return 'BOT';
  if (typeof victim === 'string') {
    const up = victim.toUpperCase();
    if (up === 'PLAYER' || up === 'HUMAN' || up === 'PVP') return 'PLAYER';
    if (up === 'ZOMBIE') return 'ZOMBIE';
    return 'BOT';
  }
  if (victim.isZombie) return 'ZOMBIE';
  if (victim.isRemote || victim.isHuman || (Boolean(victim.peerId) && !victim.isBot)) return 'PLAYER';
  if (victim.isBot) return 'BOT';
  return 'BOT';
}

export function getPlayerStats() {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PLAYER_STATS };
    const p = JSON.parse(raw);
    const totalKills = Number.isFinite(p.kills) && p.kills >= 0 ? p.kills : 0;
    const pKills = Number.isFinite(p.playerKills) && p.playerKills >= 0 ? p.playerKills : 0;
    const bKills = Number.isFinite(p.botKills) && p.botKills >= 0 ? p.botKills : Math.max(0, totalKills - pKills);
    const zKills = Number.isFinite(p.zombieKills) && p.zombieKills >= 0 ? p.zombieKills : 0;
    return {
      matchesPlayed: Number.isFinite(p.matchesPlayed) && p.matchesPlayed >= 0 ? p.matchesPlayed : 0,
      matchesWon: Number.isFinite(p.matchesWon) && p.matchesWon >= 0 ? p.matchesWon : 0,
      matchesLost: Number.isFinite(p.matchesLost) && p.matchesLost >= 0 ? p.matchesLost : 0,
      kills: Math.max(totalKills, pKills + bKills),
      playerKills: pKills,
      botKills: bKills,
      zombieKills: zKills,
      deaths: Number.isFinite(p.deaths) && p.deaths >= 0 ? p.deaths : 0
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
  if (typeof window !== 'undefined' && window.isMenuShowcase) return getPlayerStats();
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

export function recordKill(targetOrOpts = 'BOT', amountOverride = 1) {
  if (typeof window !== 'undefined' && window.isMenuShowcase) return getPlayerStats();

  let targetType = 'BOT';
  let victim = null;
  let victimId = null;
  let count = 1;

  if (typeof targetOrOpts === 'number') {
    count = Math.max(1, parseInt(targetOrOpts, 10) || 1);
    targetType = 'BOT';
  } else if (typeof targetOrOpts === 'string') {
    targetType = classifyVictimTargetType(targetOrOpts);
    count = Math.max(1, parseInt(amountOverride, 10) || 1);
  } else if (targetOrOpts && typeof targetOrOpts === 'object') {
    const isOptionsObj = ('targetType' in targetOrOpts || 'victim' in targetOrOpts || 'victimId' in targetOrOpts || 'count' in targetOrOpts) && !('hp' in targetOrOpts) && !('x' in targetOrOpts);
    if (isOptionsObj) {
      victim = targetOrOpts.victim || null;
      victimId = targetOrOpts.victimId || victim?.peerId || victim?.id || null;
      targetType = targetOrOpts.targetType ? classifyVictimTargetType(targetOrOpts.targetType) : classifyVictimTargetType(victim);
      count = Math.max(1, parseInt(targetOrOpts.count ?? amountOverride, 10) || 1);
    } else {
      victim = targetOrOpts;
      victimId = victim.peerId || victim.id || null;
      targetType = classifyVictimTargetType(victim);
      count = Math.max(1, parseInt(amountOverride, 10) || 1);
    }
  }

  // Ochrona przed podwojnym naliczeniem tego samego zgonu (np. z deathmatch i kill_event)
  if (victim && victim._progKillRecorded) {
    return getPlayerStats();
  }
  if (victimId) {
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    for (const [k, ts] of _recentKillRecords.entries()) {
      if ((now - ts) > KILL_DEDUPE_WINDOW_MS) _recentKillRecords.delete(k);
    }
    const prevTs = _recentKillRecords.get(String(victimId));
    if (prevTs !== undefined && (now - prevTs) <= KILL_DEDUPE_WINDOW_MS) {
      return getPlayerStats();
    }
    _recentKillRecords.set(String(victimId), now);
  }
  if (victim) {
    victim._progKillRecorded = true;
  }

  const stats = getPlayerStats();
  let xpPerKill = XP_REWARDS.BOT_KILL;
  let notifyText = '';
  let notifyColor = '#38bdf8';

  if (targetType === 'PLAYER') {
    stats.playerKills = (stats.playerKills || 0) + count;
    stats.kills = (stats.kills || 0) + count;
    xpPerKill = XP_REWARDS.PLAYER_KILL;
    notifyColor = '#facc15';
  } else if (targetType === 'ZOMBIE') {
    stats.zombieKills = (stats.zombieKills || 0) + count;
    xpPerKill = XP_REWARDS.ZOMBIE_KILL;
    notifyColor = '#4ade80';
  } else {
    stats.botKills = (stats.botKills || 0) + count;
    stats.kills = (stats.kills || 0) + count;
    xpPerKill = XP_REWARDS.BOT_KILL;
    notifyColor = '#38bdf8';
  }

  savePlayerStats(stats);
  const xpEarned = xpPerKill * count;
  addPlayerXP(xpEarned);

  if (targetType === 'PLAYER') {
    notifyText = `+${xpEarned} XP GRACZ (PvP)!`;
  } else if (targetType === 'ZOMBIE') {
    notifyText = `+${xpEarned} XP ZOMBIE`;
  } else {
    notifyText = `+${xpEarned} XP BOT (AI)`;
  }
  notifyXpGained(notifyText, xpEarned, notifyColor);
  return stats;
}

export function recordDeath(amount = 1) {
  if (typeof window !== 'undefined' && window.isMenuShowcase) return getPlayerStats();
  const stats = getPlayerStats();
  stats.deaths = (stats.deaths || 0) + Math.max(1, parseInt(amount, 10) || 1);
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
  const pKills = s.playerKills || 0;
  let kdRatio = '0.00';
  if (s.deaths === 0) {
    kdRatio = s.kills > 0 ? s.kills.toFixed(2) : '0.00';
  } else {
    kdRatio = (s.kills / s.deaths).toFixed(2);
  }

  let pvpKdRatio = '0.00';
  if (s.deaths === 0) {
    pvpKdRatio = pKills > 0 ? pKills.toFixed(2) : '0.00';
  } else {
    pvpKdRatio = (pKills / s.deaths).toFixed(2);
  }

  const winRate = s.matchesPlayed === 0 
    ? '0%' 
    : `${Math.round((s.matchesWon / s.matchesPlayed) * 100)}%`;

  return {
    ...s,
    kdRatio,
    pvpKdRatio,
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
    resetPlayerStats,
    getPlayerStatsSummary
  };
}
