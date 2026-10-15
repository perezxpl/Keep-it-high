// =========================================================================
// BOT.JS - SZTUCZNA INTELIGENCJA PRZECIWNIKA (AI CASUAL / INTERMEDIATE)
// =========================================================================

import { createPlayerInstance, updatePlayer, executeReleaseKick, playerSlide, throwTacticalGrenade, getJetpackNozzlePos, player, setPlayerClass } from './player.js';
import { CLASSES } from './classes/index.js';
import { triggerStrikerAirDash, triggerStrikerGroundDash } from './classes/striker.js';
import { triggerEnforcerBlastJump } from './classes/enforcer.js';
import { START_X, CONFIG } from './config.js';
import { WEAPONS, shootWeapon } from './weapons.js';
import { spawnJetpackSparks } from './world.js';
import { getJetpackFlamePalette } from './player/jetpack.js';
import { ARENA_PLATFORMS, getActiveArena, activeArenaId, getPlatformSurfaceY } from './obstacles.js';
import { ARENA_2_CONFIG, ACID_SURGE_SYSTEM } from './arenas/arena2.js';
import { ARENA_3_BRIDGE_BLOCKS } from './arenas/arena3.js';
import { deathmatchState } from './deathmatch/state.js';
import { camera } from './camera.js';
import { W, H } from './world/state.js';

/**
 * Wirtualny kontroler bota przekazywany do silnika fizyki updatePlayer
 */
export const botKeys = {
  left: false,
  right: false,
  up: false,
  down: false,
  space: false,
  slide: false
};

export const BOT_CLASS_PROFILES = {
  RAPTOR: {
    name: 'CPL. RAPTOR',
    weapon: WEAPONS.SNIPER,
    visuals: {
      headgearStyle: 'boonie',
      headgearColor: '#283618',
      torsoStyle: 'short_sleeve',
      pantsStyle: 'cargo_long',
      shoesStyle: 'combat_boots'
    }
  },
  STRIKER: {
    name: 'SGT. STRIKER',
    weapon: WEAPONS.AK47,
    visuals: {
      headgearStyle: 'beret',
      headgearColor: '#1e293b',
      torsoStyle: 'long_sleeve',
      pantsStyle: 'cargo_long',
      shoesStyle: 'combat_boots'
    }
  },
  ENFORCER: {
    name: 'LT. ENFORCER',
    weapon: WEAPONS.SHOTGUN,
    visuals: {
      headgearStyle: 'marcus_bandana',
      headgearColor: '#18181b',
      torsoStyle: 'sleeveless',
      pantsStyle: 'cargo_long',
      shoesStyle: 'combat_boots'
    }
  }
};

export const BOT_NAMES_BY_CLASS = {
  RAPTOR: ['CPL. RAPTOR', 'CAPT. RAPTOR', 'WO. RAPTOR', 'PVT. RAPTOR', 'SPEC. RAPTOR'],
  STRIKER: ['SGT. STRIKER', 'MAJ. STRIKER', 'LT. STRIKER', 'CPL. STRIKER', 'STAFF STRIKER'],
  ENFORCER: ['LT. ENFORCER', 'COL. ENFORCER', 'GEN. ENFORCER', 'SGT. ENFORCER', 'CHIEF ENFORCER']
};

export const BOT_PROFILES = [
  { name: 'SGT. STRIKER', classKey: 'STRIKER', weapon: WEAPONS.AK47, facing: -1, team: 'ORANGE' },
  { name: 'CPL. RAPTOR', classKey: 'RAPTOR', weapon: WEAPONS.SNIPER, facing: -1, team: 'ORANGE' },
  { name: 'LT. ENFORCER', classKey: 'ENFORCER', weapon: WEAPONS.SHOTGUN, facing: 1, team: 'ORANGE' },
  { name: 'PVT. VIPER', classKey: 'STRIKER', weapon: WEAPONS.AK47, facing: -1, team: 'ORANGE' },
  { name: 'MAJ. TITAN', classKey: 'ENFORCER', weapon: WEAPONS.SHOTGUN, facing: 1, team: 'ORANGE' }
];

/**
 * Konfiguruje klasę, uzbrojenie, wygląd i stopień wojskowy dla instancji bota
 */
export function applyBotClassAndConfig(botTarget, classKey, team = 'ORANGE') {
  if (!botTarget) return;
  const key = String(classKey || 'STRIKER').toUpperCase();
  const cls = CLASSES[key] || CLASSES.STRIKER || CLASSES.RAPTOR;

  setPlayerClass(cls, botTarget);

  botTarget.team = team;
  const isCyan = (team === 'CYAN');
  const flameCol = isCyan ? '#00e5ff' : '#f97316';

  const botIdx = botTarget.id ? (parseInt(botTarget.id.replace('bot_', ''), 10) - 1) : 0;
  const namePool = BOT_NAMES_BY_CLASS[key] || BOT_NAMES_BY_CLASS.STRIKER;
  botTarget.name = namePool[Math.abs(botIdx) % namePool.length];

  if (key === 'RAPTOR') {
    botTarget.currentWeapon = WEAPONS.SNIPER;
  } else if (key === 'ENFORCER') {
    botTarget.currentWeapon = WEAPONS.SHOTGUN;
  } else {
    botTarget.currentWeapon = WEAPONS.AK47;
  }

  const prof = BOT_CLASS_PROFILES[key] || BOT_CLASS_PROFILES.STRIKER;
  botTarget.customVisuals = {
    ...(botTarget.customVisuals || {}),
    ...(prof.visuals || {}),
    jetpackColor: flameCol
  };

  botTarget.strikerDashCooldown = Math.floor(Math.random() * 25 + 15);
  botTarget.enforcerBlastCooldown = Math.floor(Math.random() * 35 + 20);
  botTarget.raptorHoverTimer = 0;
}

/**
 * Automatyczny dobór zróżnicowanych klas dla botów na bazie wyboru gracza:
 * - W trybie drużynowym (TDM): po jednej różnej klasie na drużynę; jeśli gracz wybierze daną klasę,
 *   automat dobiera 2 pozostałe dla botów bez duplikatów.
 * - W trybie FFA (Każdy na Każdego): zróżnicowane klasy z minimalną powtarzalnością.
 */
export function balanceBotClasses(humanPlayer = player, activeBotsList = null, mode = null) {
  const bList = Array.isArray(activeBotsList) ? activeBotsList : getActiveBots();
  if (!bList || bList.length === 0) return;

  const curMode = mode || (deathmatchState && deathmatchState.active ? deathmatchState.mode : 'TDM');
  const isFFA = (curMode === 'FFA');

  const pClassRaw = (humanPlayer?.currentClass?.id || 'RAPTOR').toUpperCase();
  const pClassId = (pClassRaw === 'AERO') ? 'RAPTOR' : ((pClassRaw === 'PLAYMAKER' || pClassRaw === 'SWEEPER') ? 'STRIKER' : pClassRaw);

  const ALL_CLASSES = ['RAPTOR', 'STRIKER', 'ENFORCER'];
  const remainingClasses = ALL_CLASSES.filter(c => c !== pClassId);

  if (isFFA) {
    // Tryb FFA: Minimalna powtarzalność. Rotacja: 2 pozostałe klasy, następnie klasa gracza
    const ffaRoster = [remainingClasses[0], remainingClasses[1], pClassId];
    bList.forEach((b, idx) => {
      const targetClassKey = ffaRoster[idx % ffaRoster.length];
      applyBotClassAndConfig(b, targetClassKey, b.team || 'ORANGE');
    });
  } else {
    // Tryb Drużynowy (TDM):
    // Po jednej różnej klasie w drużynach.
    const pTeam = humanPlayer?.team || 'CYAN';
    const enemyTeam = (pTeam === 'CYAN' ? 'ORANGE' : 'CYAN');

    const allies = [];
    const enemies = [];

    const isMpActive = (typeof window !== 'undefined' && window.remotePlayer && window.remotePlayer.active);

    bList.forEach((b, idx) => {
      if (isMpActive) {
        b.team = (idx % 2 === 0) ? pTeam : enemyTeam;
      }
      if (b.team === pTeam) {
        allies.push(b);
      } else {
        enemies.push(b);
      }
    });

    // Sojusznicy gracza: Gracz ma pClassId, więc sojusznicy dobierają pozostałe klasy
    const allyPool = [...remainingClasses];
    allies.forEach((ally, i) => {
      const clsKey = allyPool[i % allyPool.length];
      applyBotClassAndConfig(ally, clsKey, pTeam);
    });

    // Drużyna przeciwna: Wróg 1 otrzymuje drugą z pozostałych klas, kolejni bez duplikatu
    let enemyPool;
    if (allies.length > 0) {
      enemyPool = [remainingClasses[1], pClassId, remainingClasses[0]];
    } else {
      enemyPool = [remainingClasses[0], remainingClasses[1], pClassId];
    }

    enemies.forEach((enemy, i) => {
      const clsKey = enemyPool[i % enemyPool.length];
      applyBotClassAndConfig(enemy, clsKey, enemyTeam);
    });
  }
}

/**
 * Zwraca wysokość bezpiecznego podłoża/platformy pod pozycją (x, feetY),
 * lub null jeśli poniżej znajduje się śmiertelne niebezpieczeństwo (kwas w A2, głęboka rzeka w A3, przepaść).
 */
export function getSafeSurfaceBelow(x, feetY, arenaId = '') {
  const effectiveId = arenaId || (typeof activeArenaId !== 'undefined' ? activeArenaId : '');
  const isA2 = (effectiveId === 'ARENA_2' || effectiveId === 'arena-2' || effectiveId === 'ARENA_2_SECTOR_X' || effectiveId === 'ARENA_2_PANDORA');
  const isA3 = (effectiveId === 'ARENA_3' || effectiveId === 'arena-3' || effectiveId === 'ARENA_FOUNDRY');

  if (isA2) {
    const hazardY = (ACID_SURGE_SYSTEM && typeof ACID_SURGE_SYSTEM.currentY === 'number')
      ? ACID_SURGE_SYSTEM.currentY
      : ((ARENA_2_CONFIG && ARENA_2_CONFIG.hazardZoneY) || 1440);

    let closestTopY = Infinity;
    if (Array.isArray(ARENA_PLATFORMS)) {
      for (let i = 0; i < ARENA_PLATFORMS.length; i++) {
        const plat = ARENA_PLATFORMS[i];
        if (!plat || plat.solid === false || plat.isWall) continue;
        if (x >= plat.x - 12 && x <= plat.x + plat.w + 12) {
          let topY = plat.y;
          if (plat.isSlope && typeof getPlatformSurfaceY === 'function') {
            topY = getPlatformSurfaceY(plat, x, 1600);
          }
          if (typeof topY === 'number' && topY >= feetY - 32 && topY < closestTopY && topY < hazardY - 35) {
            closestTopY = topY;
          }
        }
      }
    }
    return closestTopY < Infinity ? closestTopY : null;
  }

  if (isA3) {
    // Kanał rzeczny: śmiertelna woda między X: 1560 a 2840
    if (x >= 1560 && x <= 2840) {
      if (Array.isArray(ARENA_3_BRIDGE_BLOCKS)) {
        for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
          const block = ARENA_3_BRIDGE_BLOCKS[i];
          if (block && block.intact && x >= block.x - 4 && x <= block.x + block.w + 4) {
            if (block.y >= feetY - 6) {
              return block.y;
            }
          }
        }
      }
      return null; // Brak nienaruszonego przęsła mostu – bezpośrednio pod stopami jest głęboka woda!
    }

    // Poza otwartą rzeką: stałe podłoże i platformy dżungli
    let closestTopY = Infinity;
    if (Array.isArray(ARENA_PLATFORMS)) {
      for (let i = 0; i < ARENA_PLATFORMS.length; i++) {
        const plat = ARENA_PLATFORMS[i];
        if (!plat || plat.solid === false || plat.isWall || plat.type === 'water') continue;
        if (plat.intact === false) continue;
        if (x >= plat.x - 10 && x <= plat.x + plat.w + 10) {
          if (typeof plat.y === 'number' && plat.y >= feetY - 6 && plat.y < closestTopY) {
            closestTopY = plat.y;
          }
        }
      }
    }
    return closestTopY < Infinity ? closestTopY : 1200;
  }

  // Arena 1 (Stadion) lub domyślny grunt
  let closestTopY = Infinity;
  if (Array.isArray(ARENA_PLATFORMS)) {
    for (let i = 0; i < ARENA_PLATFORMS.length; i++) {
      const plat = ARENA_PLATFORMS[i];
      if (!plat || plat.solid === false || plat.isWall) continue;
      if (x >= plat.x - 10 && x <= plat.x + plat.w + 10) {
        if (typeof plat.y === 'number' && plat.y >= feetY - 6 && plat.y < closestTopY) {
          closestTopY = plat.y;
        }
      }
    }
  }
  return closestTopY < Infinity ? closestTopY : 1000;
}

export function getStoredSinglePlayerBotCount() {
  try {
    const stored = localStorage.getItem('kih_bot_count_v1');
    if (stored !== null && stored !== undefined) {
      const parsed = parseInt(stored, 10);
      if (parsed >= 1 && parsed <= 5) return parsed;
    }
  } catch (_) {}
  return 1;
}

export function createBotInstance(index = 0, isActive = true) {
  const profile = BOT_PROFILES[index % BOT_PROFILES.length];
  const botClass = (CLASSES && CLASSES[profile.classKey]) ? CLASSES[profile.classKey] : (CLASSES?.STRIKER || CLASSES?.RAPTOR);
  const instanceKeys = (index === 0) ? botKeys : { left: false, right: false, up: false, down: false, space: false, slide: false };

  const instance = createPlayerInstance({
    isBot: true,
    active: isActive,
    frozen: false,
    team: profile.team || 'ORANGE',
    facing: profile.facing || -1,
    x: START_X + 600 + (index * 80),
    y: 0,
    w: 24,
    h: 70,
    dropThroughTimer: 0,
    currentClass: botClass,
    name: profile.name,
    id: `bot_${index + 1}`,
    botIndex: index,

    hp: botClass?.stats?.hp || 100,
    maxHp: botClass?.stats?.hp || 100,
    currentWeapon: profile.weapon || WEAPONS.AK47,
    shootCooldown: 0,
    isDead: false,
    respawnTimer: 0,
    deathTilt: 0,
    deathRotVel: 0,
    isSettled: false,
    pelvisY: 0,
    burstShotsRemaining: 0,
    burstPauseTimer: 0,
    grenadeCooldown: 0,

    isJetpacking: false,
    jetpackPower: 0,
    jetFuel: botClass?.stats?.jetMax || 100,
    jetMax: botClass?.stats?.jetMax || 100,

    difficulty: getStoredBotDifficulty(),
    decisionTimer: 0,
    aimErrorAngle: 0,
    strafeTimer: 0,
    strafeDir: 0,
    chargeTarget: 0.55,
    idleDecisionTimer: 0,
    crouchTimer: 0,
    shootHesitationTimer: 0,
    strikerDashCooldown: 0,
    enforcerBlastCooldown: 0,
    raptorHoverTimer: 0,
    botKeys: instanceKeys
  });
  return instance;
}

/**
 * Główna instancja bota (Bot 1) dla 100% kompatybilności wstecznej
 */
export const bot = createBotInstance(0, true);

/**
 * Tablica wszystkich instancji botów
 */
export const bots = [bot];

export let botCount = getStoredSinglePlayerBotCount();

// Natychmiastowa inicjalizacja instancji botów pod kątem zapisanego stanu
while (bots.length < botCount) {
  bots.push(createBotInstance(bots.length, true));
}
for (let i = 0; i < bots.length; i++) {
  bots[i].active = (i < botCount);
}

export function setBotCount(count, options = {}) {
  const parsed = parseInt(count, 10);
  const num = Math.max(0, Math.min(5, isNaN(parsed) ? 1 : parsed));
  botCount = num;
  while (bots.length < num) {
    bots.push(createBotInstance(bots.length, true));
  }
  for (let i = 0; i < bots.length; i++) {
    bots[i].active = (i < num);
    if (i >= num) {
      bots[i].isDead = false;
      bots[i].hp = 0;
    } else {
      bots[i].isDead = false;
      if (bots[i].hp <= 0) {
        bots[i].hp = bots[i].maxHp || bots[i].currentClass?.stats?.hp || 100;
      }
    }
  }
  if (!options.isRemote && !options.skipStorage) {
    try {
      localStorage.setItem('kih_bot_count_v1', String(num));
    } catch (_) {}
  }
  if (num > 0) {
    balanceBotClasses(player, bots.slice(0, num));
  }
  if (typeof window !== 'undefined' && window.deathmatchState && window.deathmatchState.active) {
    if (typeof window.refreshDeathmatchParticipants === 'function') {
      window.refreshDeathmatchParticipants(player, getActiveBots(), window.remotePlayer);
    }
  }
  return botCount;
}

export function getBotCount() {
  try {
    const stored = localStorage.getItem('kih_bot_count_v1');
    if (stored !== null && stored !== undefined) {
      const parsed = parseInt(stored, 10);
      if (parsed >= 0 && parsed <= 5) {
        if (botCount !== parsed) {
          setBotCount(parsed, { skipStorage: true });
        }
        return parsed;
      }
    }
  } catch (_) {}
  return botCount;
}

export function getActiveBots() {
  if (botCount === 0) return [];
  while (bots.length < botCount) {
    bots.push(createBotInstance(bots.length, true));
  }
  for (let i = 0; i < botCount; i++) {
    if (bots[i]) {
      bots[i].active = true;
    }
  }
  return bots.slice(0, botCount).filter(b => b && b.active);
}

export function getMpBotCount() {
  try {
    const stored = localStorage.getItem('kih_mp_bot_count');
    if (stored !== null && stored !== undefined) {
      const parsed = parseInt(stored, 10);
      if (parsed >= 0 && parsed <= 5) return parsed;
    }
  } catch (_) {}
  return 2; // Domyślnie 2 boty w grze sieciowej (mecz 2v2)
}

export function setMpBotCount(count) {
  const parsed = parseInt(count, 10);
  const num = Math.max(0, Math.min(5, isNaN(parsed) ? 2 : parsed));
  try {
    localStorage.setItem('kih_mp_bot_count', String(num));
  } catch (_) {}
  setBotCount(num, { skipStorage: true });
  return num;
}

export function getMpBotLayoutDescription(count) {
  const num = parseInt(count, 10);
  switch (num) {
    case 0:
      return 'Układ: Czysty pojedynek 1 na 1 (Host vs Klient, brak botów)';
    case 1:
      return 'Układ: 1 bot AI na arenie (mecz 3-osobowy)';
    case 2:
      return 'Układ: Mecz 2v2 (Drużyna CYAN [Host + Bot] vs Drużyna ORANGE [Klient + Bot])';
    case 3:
      return 'Układ: 3 boty AI na arenie (skład mieszany)';
    case 4:
      return 'Układ: Mecz 3v3 (Drużyna CYAN [Host + 2 Boty] vs Drużyna ORANGE [Klient + 2 Boty])';
    case 5:
      return 'Układ: 5 botów AI na arenie (maksymalne zagęszczenie walki)';
    default:
      return `Układ: ${num} botów AI w meczu`;
  }
}

/**
 * Konfiguracja parametrów 3 poziomów trudności botów:
 * - easy: NOWY, przystępny poziom dla każdego gracza (ludzki czas reakcji ~0.5s-0.75s, duży rozrzut, brak granatów)
 * - medium: dawny poziom ŁATWY (zbalansowany, umiarkowany rozrzut, 3-strzałowe serie)
 * - hard: dawny poziom ŚREDNI (wymagający, taktyczny, bez nieludzkiego 1-klatkowego aimbota)
 */
export const BOT_DIFFICULTY_CONFIG = {
  easy: {
    decisionMin: 28,
    decisionMax: 44,       // 28-44 klatek (~0.46s - 0.73s reakcji)
    aimErrorMin: 30,
    aimErrorMax: 48,       // Duży błąd celowania: ±30° do ±48°
    aimLerp: 0.055,        // Płynny, powolny ruch celownika
    grenadeChance: 0.0,    // Brak granatów odłamkowych
    grenadeCooldown: 30.0,
    enforcerClimbCooldown: 300,
    enforcerStompCooldown: 340,
    strikerAirCooldown: 280,
    strikerGroundCooldown: 300,
    akBurstShots: 2,       // Krótkie 2-strzałowe serie z AK-47
    akBurstPause: 65,      // Długa pauza (~1.1s) pomiędzy seriami
    shotHesitation: 20,    // Wahanie przed pociągnięciem za spust (~0.33s)
    slideChance: 0.08,     // Rzadkie wślizgi
    kickChance: 0.35,      // Rzadkie kopnięcia w zwarciu
    kitingEnabled: false   // Raptor nie ucieka wysoko w niebo
  },
  medium: {
    decisionMin: 14,
    decisionMax: 23,       // 14-23 klatek (~0.23s - 0.38s)
    aimErrorMin: 16,
    aimErrorMax: 28,       // Umiarkowany błąd: ±16° do ±28°
    aimLerp: 0.11,         // Średnia szybkość obrotu broni
    grenadeChance: 0.05,   // Sporadyczne granaty (5%)
    grenadeCooldown: 18.0,
    enforcerClimbCooldown: 190,
    enforcerStompCooldown: 210,
    strikerAirCooldown: 170,
    strikerGroundCooldown: 190,
    akBurstShots: 3,       // 3-strzałowe serie
    akBurstPause: 40,      // Średnia pauza (~0.66s)
    shotHesitation: 9,     // Krótkie wahanie (~0.15s)
    slideChance: 0.22,
    kickChance: 0.70,
    kitingEnabled: true
  },
  hard: {
    decisionMin: 6,
    decisionMax: 11,       // 6-11 klatek (~0.10s - 0.18s)
    aimErrorMin: 6,
    aimErrorMax: 14,       // Niewielki błąd: ±6° do ±14°
    aimLerp: 0.18,         // Szybkie naprowadzanie celownika
    grenadeChance: 0.16,   // Taktyczne granaty (16%)
    grenadeCooldown: 12.0,
    enforcerClimbCooldown: 125,
    enforcerStompCooldown: 145,
    strikerAirCooldown: 110,
    strikerGroundCooldown: 125,
    akBurstShots: 4,       // Długie 4-strzałowe serie
    akBurstPause: 25,      // Krótka pauza (~0.4s)
    shotHesitation: 0,     // Błyskawiczny strzał bez wahania
    slideChance: 0.40,
    kickChance: 1.0,
    kitingEnabled: true
  }
};

export function getBotDifficultyConfig(botTarget) {
  const d = botTarget?.difficulty || 'medium';
  return BOT_DIFFICULTY_CONFIG[d] || BOT_DIFFICULTY_CONFIG.medium;
}

function getStoredBotDifficulty() {
  try {
    const val = localStorage.getItem('kih_bot_diff_v1');
    if (val === 'easy' || val === 'medium' || val === 'hard') return val;
  } catch (_) {}
  return 'medium';
}

export function setBotDifficulty(diff) {
  let d = 'medium';
  if (diff === 'easy' || diff === 'latwy') {
    d = 'easy';
  } else if (diff === 'hard' || diff === 'trudny' || diff === 'veteran') {
    d = 'hard';
  } else {
    d = 'medium';
  }
  bots.forEach(b => { b.difficulty = d; });
  try {
    localStorage.setItem('kih_bot_diff_v1', d);
  } catch (_) {}
}

/**
 * Sprawdza, czy bot znajduje sie w kadrze kamery gracza (na ekranie z bezpiecznym marginesem)
 * Zgodnie z zasada fair play boty nie moga atakowac gracza z ukrycia / zza krawedzi ekranu.
 */
export function isBotVisibleToPlayer(botTarget, margin = 24) {
  if (!camera || typeof camera.x !== 'number' || typeof camera.y !== 'number') return true;
  if (!botTarget || typeof botTarget.x !== 'number' || typeof botTarget.y !== 'number') return false;
  const zoom = (typeof camera.zoom === 'number' && camera.zoom > 0) ? camera.zoom : 1;
  const viewW = camera.viewWidth || ((typeof W === 'number' ? W : 1920) / zoom);
  const viewH = camera.viewHeight || ((typeof H === 'number' ? H : 1080) / zoom);
  const camL = camera.x - margin;
  const camR = camera.x + viewW + margin;
  const camT = camera.y - margin;
  const camB = camera.y + viewH + margin;

  const botL = botTarget.x;
  const botR = botTarget.x + (botTarget.w || 24);
  const botT = botTarget.y;
  const botB = botTarget.y + (botTarget.h || 70);

  return (botR >= camL && botL <= camR && botB >= camT && botT <= camB);
}

/**
 * Główna pętla sztucznej inteligencji bota (reakcje, taktyka, celowanie, fizyka)
 */
export function updateBotBrain(ball, humanPlayer, groundY, spawnGrass, botTarget = bot, allCombatants = null) {
  if (!botTarget || !botTarget.active) return;
  const bKeys = botTarget.botKeys || botKeys;

  const curArenaObj = typeof getActiveArena === 'function' ? getActiveArena() : null;
  const currentArenaId = (curArenaObj?.id) || activeArenaId || 'ARENA_1';
  const isA1 = (currentArenaId === 'arena-1' || currentArenaId === 'ARENA_1');
  const isA2 = (currentArenaId === 'arena-2' || currentArenaId === 'ARENA_2' || currentArenaId === 'ARENA_2_SECTOR_X' || currentArenaId === 'ARENA_2_PANDORA');
  const isA3 = (currentArenaId === 'arena-3' || currentArenaId === 'ARENA_3' || currentArenaId === 'ARENA_FOUNDRY');

  // W Arenie 1 (mecz piłkarski) broń palna jest regulaminowo schowana w kaburze
  if (isA1) {
    botTarget.isHolstered = true;
    botTarget.holsterWeight = 1.0;
  } else {
    botTarget.isHolstered = false;
    botTarget.holsterWeight = 0.0;
  }

  // Wyszukanie wrogiego celu do ataku (najbliższy przeciwnik)
  const isFFA = (typeof deathmatchState !== 'undefined' && deathmatchState.active && deathmatchState.mode === 'FFA');
  const isHumanTeammate = (!isFFA && botTarget.team && humanPlayer && humanPlayer.team && botTarget.team === humanPlayer.team);
  let targetEnemy = (humanPlayer && !humanPlayer.isDead && !isHumanTeammate) ? humanPlayer : null;

  if (Array.isArray(allCombatants) && allCombatants.length > 0) {
    let closestDist = Infinity;
    let closestCand = null;
    const botMidX = botTarget.x + botTarget.w / 2;
    const botMidY = botTarget.y + botTarget.h / 2;

    for (let i = 0; i < allCombatants.length; i++) {
      const c = allCombatants[i];
      if (!c || c === botTarget || c.isDead || (c.isBot && !c.active)) continue;
      // W trybie drużynowym (TDM lub mecze ligowe) sojusznicy z tej samej drużyny nie są celem
      if (!isFFA && botTarget.team && c.team && botTarget.team === c.team) continue;
      const d = Math.hypot((c.x + c.w / 2) - botMidX, (c.y + c.h / 2) - botMidY);
      if (d < closestDist) {
        closestDist = d;
        closestCand = c;
      }
    }
    targetEnemy = closestCand;
  }

  const meleeTargets = targetEnemy ? [targetEnemy] : [];

  // Obsługa stanu śmierci oraz rozpuszczania w kwasie
  if (botTarget.isDead || botTarget.isAcidDying || (botTarget.acidDeath && botTarget.acidDeath.active)) {
    bKeys.left = false;
    bKeys.right = false;
    bKeys.up = false;
    bKeys.down = false;
    bKeys.space = false;
    bKeys.slide = false;
    botTarget.isJetpacking = false;
    botTarget.jetpackPower = 0;
    botTarget.isShooting = false;
    botTarget.isCharging = false;
    botTarget.isJumpCharging = false;
    updatePlayer(bKeys, null, groundY, ball, spawnGrass, botTarget, meleeTargets);
    return;
  }

  // Obsługa oszołomienia po Spartan Kick
  if (botTarget.staggerTimer > 0) {
    bKeys.left = false;
    bKeys.right = false;
    bKeys.up = false;
    bKeys.down = false;
    bKeys.space = false;
    bKeys.slide = false;
    botTarget.isJetpacking = false;
    botTarget.jetpackPower = 0;
    botTarget.isShooting = false;
    botTarget.isCharging = false;
    botTarget.decisionTimer = 0;
    botTarget.shootPoseTimer = 0;
    updatePlayer(bKeys, null, groundY, ball, spawnGrass, botTarget, meleeTargets);
    return;
  }

  // =========================================================================
  // TRYB ZATRZYMANIA W MIEJSCU (BOT FROZEN / STANDSTILL)
  // =========================================================================
  if (botTarget.frozen) {
    bKeys.left = false;
    bKeys.right = false;
    bKeys.up = false;
    bKeys.down = false;
    bKeys.space = false;
    bKeys.slide = false;
    botTarget.isJetpacking = false;
    botTarget.jetpackPower = 0;
    botTarget.vx = 0;
    botTarget.airVx = 0;
    botTarget.isShooting = false;
    botTarget.isCharging = false;
    botTarget.shootPoseTimer = 0;
    updatePlayer(bKeys, null, groundY, ball, spawnGrass, botTarget, meleeTargets);
    return;
  }

  const botCenterX = botTarget.x + botTarget.w / 2;
  const botCenterY = botTarget.y + botTarget.h / 2;

  // Dekrementacja timerów decyzyjnych, strzeleckich oraz umiejętności klasowych
  if (botTarget.burstPauseTimer > 0) botTarget.burstPauseTimer--;
  if (botTarget.decisionTimer > 0) botTarget.decisionTimer--;
  if (botTarget.strafeTimer > 0) botTarget.strafeTimer--;
  if (botTarget.idleDecisionTimer > 0) botTarget.idleDecisionTimer--;
  if (botTarget.shootHesitationTimer > 0) botTarget.shootHesitationTimer--;
  if (botTarget.grenadeCooldown > 0) {
    botTarget.grenadeCooldown = Math.max(0, botTarget.grenadeCooldown - (1 / 60));
  }
  if (botTarget.crouchTimer > 0) {
    botTarget.crouchTimer--;
    if (botTarget.crouchTimer <= 0) bKeys.down = false;
  }
  if (botTarget.strikerDashCooldown > 0) botTarget.strikerDashCooldown--;
  if (botTarget.enforcerBlastCooldown > 0) botTarget.enforcerBlastCooldown--;
  if (botTarget.raptorHoverTimer > 0) botTarget.raptorHoverTimer--;

  const botClassId = (botTarget.currentClass?.id || 'STRIKER').toUpperCase();
  const isEnforcer = (botClassId === 'ENFORCER');
  const isStriker = (botClassId === 'STRIKER' || botClassId === 'PLAYMAKER' || botClassId === 'SWEEPER');
  const isRaptor = (botClassId === 'RAPTOR' || botClassId === 'AERO');
  const diffCfg = getBotDifficultyConfig(botTarget);

  // =========================================================================
  // 1. WYBÓR BRONI NA BAZIE DYSTANSU DO WROGA I KLASY (ARENY BOJOWE 2 i 3)
  // =========================================================================
  const distToEnemy = targetEnemy ? Math.hypot((targetEnemy.x + targetEnemy.w / 2) - botCenterX, (targetEnemy.y + targetEnemy.h / 2) - botCenterY) : Infinity;

  if (!isA1) {
    const curWepId = botTarget.currentWeapon?.id || 'AK47';
    if (isRaptor) {
      // Raptor: karabin wyborowy z histerezą (zbliżenie <= 180px -> AK-47, oddalenie >= 250px -> SNIPER)
      if (curWepId === 'SNIPER' && distToEnemy <= 180) {
        botTarget.currentWeapon = WEAPONS.AK47;
      } else if (curWepId !== 'SNIPER' && distToEnemy >= 250) {
        botTarget.currentWeapon = WEAPONS.SNIPER;
      }
    } else if (isEnforcer) {
      // Enforcer: strzelba w zwarciu (oddalenie >= 300px -> AK-47, zbliżenie <= 220px -> SHOTGUN)
      if (curWepId === 'SHOTGUN' && distToEnemy >= 300) {
        botTarget.currentWeapon = WEAPONS.AK47;
      } else if (curWepId !== 'SHOTGUN' && distToEnemy <= 220) {
        botTarget.currentWeapon = WEAPONS.SHOTGUN;
      }
    } else {
      // Striker: karabinek uniwersalny (szarża <= 140px -> SHOTGUN, wycofanie >= 210px -> AK-47, daleki dystans > 520px -> SNIPER, powrót < 440px -> AK-47)
      if (curWepId === 'SHOTGUN' && distToEnemy >= 210) {
        botTarget.currentWeapon = WEAPONS.AK47;
      } else if (curWepId === 'SNIPER' && distToEnemy < 440) {
        botTarget.currentWeapon = WEAPONS.AK47;
      } else if (curWepId === 'AK47') {
        if (distToEnemy <= 140) botTarget.currentWeapon = WEAPONS.SHOTGUN;
        else if (distToEnemy > 520) botTarget.currentWeapon = WEAPONS.SNIPER;
      }
    }
  }

  // Taktyczny rzut granatem odłamkowym (Arena 2 i 3)
  if (!isA1 && targetEnemy && !targetEnemy.isDead && (botTarget.grenadeCooldown <= 0)) {
    const isTargetingHuman = (!targetEnemy.isBot || targetEnemy === humanPlayer);
    const canEngageTarget = !isTargetingHuman || isBotVisibleToPlayer(botTarget);

    if (canEngageTarget && distToEnemy >= 230 && distToEnemy <= 520 && botTarget.decisionTimer <= 1) {
      const grenadeRoll = Math.random();
      if (diffCfg.grenadeChance > 0 && grenadeRoll < diffCfg.grenadeChance) {
        throwTacticalGrenade(botTarget, targetEnemy.x + targetEnemy.w / 2, targetEnemy.y + targetEnemy.h / 2);
        botTarget.grenadeCooldown = diffCfg.grenadeCooldown;
      }
    }
  }

  // =========================================================================
  // 2. CZAS REAKCJI I TAKTYCZNA MASZYNA STANÓW
  // =========================================================================
  const hasBall = (ball && ball.active);
  const targetY = (hasBall && ball.y < groundY - 20) ? ball.y : (targetEnemy ? targetEnemy.y : (isA2 ? 420 : (isA3 ? 1130 : groundY)));

  if (botTarget.decisionTimer <= 0) {
    const dRange = Math.max(1, diffCfg.decisionMax - diffCfg.decisionMin);
    botTarget.decisionTimer = Math.floor(Math.random() * dRange + diffCfg.decisionMin);

    // Dynamiczny błąd kąta celowania:
    // Łatwy (nowy): ±30° do ±48°, Średni (dawny łatwy): ±16° do ±28°, Trudny (dawny średni): ±6° do ±14°
    const errRange = Math.max(1, diffCfg.aimErrorMax - diffCfg.aimErrorMin);
    const errorDeg = (diffCfg.aimErrorMin + Math.random() * errRange) * (Math.random() < 0.5 ? -1 : 1);
    botTarget.aimErrorAngle = errorDeg * (Math.PI / 180);

    // Punkt docelowy nawigacji
    let targetX;
    if (hasBall) {
      const predOffset = Math.sin(performance.now() * 0.002) * 20;
      targetX = ball.x + (ball.vx * 12) + predOffset;
    } else if (targetEnemy && !targetEnemy.isDead) {
      targetX = targetEnemy.x + targetEnemy.w / 2;
    } else {
      targetX = isA2 ? 2000 : (isA3 ? 2200 : botCenterX);
    }

    // Ewakuacja przed falą kwasu w Arenie 2
    if (isA2 && ACID_SURGE_SYSTEM && (ACID_SURGE_SYSTEM.state === 'WARNING' || ACID_SURGE_SYSTEM.state === 'RISING' || ACID_SURGE_SYSTEM.state === 'FLOODED')) {
      if (botTarget.y > 900) {
        // Natychmiastowa ucieczka na wyższy poziom (Centralny Hub X: 2000 lub rampy)
        targetX = (botCenterX < 2000) ? 1750 : 2250;
      }
    }

    // Martwa strefa (deadzone)
    const diffX = targetX - botCenterX;
    if (Math.abs(diffX) < 35) {
      bKeys.left = false;
      bKeys.right = false;
    } else if (diffX > 0) {
      bKeys.right = true;
      bKeys.left = false;
    } else {
      bKeys.left = true;
      bKeys.right = false;
    }

    // Bezpieczeństwo krawędzi platform: zapobieganie spadaniu w kwas lub głęboką rzekę
    if (botTarget.onGround && !botTarget.isJumping) {
      const moveDir = bKeys.right ? 1 : (bKeys.left ? -1 : 0);
      if (moveDir !== 0) {
        const lookaheadX = botCenterX + moveDir * 32;
        const safeAhead = getSafeSurfaceBelow(lookaheadX, botTarget.y + botTarget.h + 8, currentArenaId);
        if (safeAhead === null) {
          // Przed botem jest otchłań kwasu lub rwąca woda bez mostu
          if (Math.abs(diffX) > 60 && (botTarget.jetFuel || 0) > 15) {
            bKeys.up = true; // Przeskocz wyrwę z użyciem odrzutu!
          } else if (isEnforcer && botTarget.enforcerBlastCooldown <= 0) {
            triggerEnforcerBlastJump(botTarget, moveDir * 0.95, spawnGrass);
            botTarget.enforcerBlastCooldown = 85;
          } else {
            bKeys.left = false;
            bKeys.right = false;
          }
        }
      }
    }

    // Nawigacja wertykalna: wspinaczka
    if (targetY < botTarget.y - 48) {
      if (!botTarget.isJumping && !botTarget.isSliding) {
        if (isEnforcer && botTarget.enforcerBlastCooldown <= 0 && botTarget.onGround) {
          // Kolos wykonuje potężny wyskok pneumatyczny z kruszeniem ziemi na wyższą platformę
          const blastDirX = Math.abs(diffX) > 25 ? (Math.sign(diffX) * 0.9) : (botTarget.facing || 1) * 0.3;
          triggerEnforcerBlastJump(botTarget, blastDirX, spawnGrass);
          botTarget.enforcerBlastCooldown = diffCfg.enforcerClimbCooldown;
        } else if (!isEnforcer) {
          bKeys.up = true;
        }
      }
    }

    // Bezpieczny zeskok z kładki (drop-through) – wyłącznie jeśli pod spodem jest stabilny grunt
    if (targetY > botTarget.y + 70) {
      if (botTarget.onGround && botTarget.currentPlatform && (botTarget.currentPlatform.isDropThrough === true || botTarget.currentPlatform.type === 'catwalk' || botTarget.currentPlatform.type === 'cyber_catwalk')) {
        const platThick = botTarget.currentPlatform.thickness || botTarget.currentPlatform.h || 20;
        const testFeetY = botTarget.y + botTarget.h + platThick + 14;
        const safeBelow = getSafeSurfaceBelow(botCenterX, testFeetY, currentArenaId);

        // Zeskok dozwolony WYŁĄCZNIE wtedy, gdy poniżej jest potwierdzona bezpieczna platforma
        if (safeBelow !== null && safeBelow <= targetY + 140) {
          botTarget.dropThroughTimer = 20;
          botTarget.dropThroughPlatform = botTarget.currentPlatform;
          botTarget.y += platThick + 12;
          botTarget.currentPlatform = null;
          botTarget.onGround = false;
          botTarget.isJumping = true;
          botTarget.vy = Math.max(botTarget.vy || 0, 4.2);
        }
      }
    }

    // Wślizg taktyczny (Soldat Slide Tackle / Enforcer Ram)
    if (hasBall) {
      const ballSpeed = Math.hypot(ball.vx, ball.vy);
      const dxToBall = ball.x - botCenterX;
      const isBallMovingTowardsBot = (ball.vx * dxToBall < 0);
      const distToBallX = Math.abs(dxToBall);

      if (distToBallX >= 60 && distToBallX <= 110 && Math.abs(botTarget.vx) > 3.0 && (ballSpeed > 3.0 || isBallMovingTowardsBot)) {
        if (Math.random() < 0.40) {
          playerSlide(spawnGrass, groundY, botTarget);
        }
      }
    } else if (targetEnemy && !targetEnemy.isDead) {
      const dxToEnemy = (targetEnemy.x + targetEnemy.w / 2) - botCenterX;
      const distToEnemyX = Math.abs(dxToEnemy);
      const slideProb = isEnforcer ? (diffCfg.slideChance * 1.3) : diffCfg.slideChance;
      if (distToEnemyX >= 50 && distToEnemyX <= 135 && Math.abs(botTarget.vx) > 3.0 && (botTarget.vx * dxToEnemy > 0)) {
        if (Math.random() < slideProb) {
          playerSlide(spawnGrass, groundY, botTarget);
        }
      }
    }
  }

  // =========================================================================
  // UMIEJĘTNOŚCI SPECJALNE KLAS:
  // =========================================================================

  // A. KLASA CIĘŻKA: ENFORCER – KINETIC PISTON LEAP (BLAST JUMP)
  if (isEnforcer && botTarget.onGround && !botTarget.isJumping && !botTarget.isSliding && botTarget.enforcerBlastCooldown <= 0) {
    let shouldBlast = false;
    let bDirX = 0;

    // 1. Tąpnięcie kinetyczne i fala uderzeniowa w walce wręcz
    if (targetEnemy && !targetEnemy.isDead && distToEnemy < 100) {
      shouldBlast = true;
      bDirX = Math.sign(targetEnemy.x - botCenterX) * 0.6;
    }
    // 2. Kinetyczny wystrzał piłki na bramkę w Arenie 1
    else if (hasBall && ballDistFromHip < 110) {
      shouldBlast = true;
      const enemyGoalX = (botTarget.team === 'CYAN') ? 3460 : 140;
      bDirX = Math.sign(enemyGoalX - botCenterX);
    }
    // 3. Awaryjna ucieczka przed kwasem / rwącą rzeką
    else if ((isA2 && botTarget.y > 900) || (isA3 && botCenterX >= 1540 && botCenterX <= 2860 && botTarget.y > 1150)) {
      shouldBlast = true;
      bDirX = (botCenterX < 2000 ? 1.0 : -1.0);
    }

    if (shouldBlast) {
      triggerEnforcerBlastJump(botTarget, bDirX, spawnGrass);
      bKeys.up = false;
      botTarget.enforcerBlastCooldown = diffCfg.enforcerStompCooldown;
    }
  }

  // B. KLASA ŚREDNIA: STRIKER – ROCKET BOOTS (AIR DASH & GROUND DASH)
  if (isStriker && botTarget.strikerDashCooldown <= 0) {
    const isAirborneNow = botTarget.isJumping || !botTarget.onGround;
    const isGroundedNow = botTarget.onGround && !botTarget.isJumping && !botTarget.isSliding;

    // 1. Air Dash w powietrzu (wymaga >= 50 paliwa)
    if (isAirborneNow && (botTarget.jetFuel || 0) >= 50) {
      let triggerAir = false;
      let nx = 0;
      let ny = 0;

      // Szarża powietrzna na przeciwnika z rakietowym przyspieszeniem
      if (targetEnemy && !targetEnemy.isDead && distToEnemy >= 120 && distToEnemy <= 380) {
        const dxE = (targetEnemy.x + targetEnemy.w / 2) - botCenterX;
        const dyE = (targetEnemy.y + targetEnemy.h / 2) - botCenterY;
        const dMag = Math.hypot(dxE, dyE) || 1;
        nx = dxE / dMag;
        ny = Math.max(-0.8, Math.min(0.6, dyE / dMag));
        triggerAir = true;
      }
      // Przechwyt piłki w powietrzu w Arenie 1
      else if (hasBall && ballDistFromHip > 80 && ballDistFromHip < 320) {
        const dxB = ball.x - botCenterX;
        const dyB = ball.y - botCenterY;
        const bMag = Math.hypot(dxB, dyB) || 1;
        nx = dxB / bMag;
        ny = dyB / bMag;
        triggerAir = true;
      }
      // Awaryjny doskok do bezpiecznej kładki nad kwasem/wodą
      else {
        const safeUnder = getSafeSurfaceBelow(botCenterX, botTarget.y + botTarget.h + 8, currentArenaId);
        if (safeUnder === null && (botTarget.vy || 0) > -1.0) {
          nx = (botCenterX < 2000 ? 1 : -1) * 0.85;
          ny = -0.52;
          triggerAir = true;
        }
      }

      if (triggerAir) {
        botTarget.jetFuel = Math.max(0, botTarget.jetFuel - 50);
        triggerStrikerAirDash(botTarget, nx, ny, 1.0);
        botTarget.strikerDashCooldown = diffCfg.strikerAirCooldown;
      }
    }
    // 2. Ground Dash na ziemi (dopalacz rakietowy w butach)
    else if (isGroundedNow && (botTarget.jetFuel || 0) >= 15) {
      let triggerGround = false;
      let gDir = 0;

      if (targetEnemy && !targetEnemy.isDead && distToEnemy > 280) {
        gDir = Math.sign(targetEnemy.x - botCenterX) || botTarget.facing || 1;
        triggerGround = true;
      } else if (targetEnemy && !targetEnemy.isDead && botTarget.hp < 35 && distToEnemy < 180) {
        gDir = -Math.sign(targetEnemy.x - botCenterX) || -botTarget.facing || -1;
        triggerGround = true;
      } else if (hasBall && ballDistFromHip > 180) {
        gDir = Math.sign(ball.x - botCenterX) || botTarget.facing || 1;
        triggerGround = true;
      }

      if (triggerGround && gDir !== 0) {
        botTarget.jetFuel = Math.max(0, botTarget.jetFuel - 15);
        triggerStrikerGroundDash(botTarget, gDir, 'STICK', 1.0);
        botTarget.strikerDashCooldown = diffCfg.strikerGroundCooldown;
      }
    }
  }

  // =========================================================================
  // 3. LOT JETPACKIEM I NAPĘD ODRZUTOWY BOTA
  // =========================================================================
  const isAirborne = botTarget.isJumping || !botTarget.onGround;
  let wantsJetpack = false;

  // Enforcer nie posiada jetpacka
  if (!isEnforcer && isAirborne && (botTarget.jetFuel || 0) > 4) {
    // A. Awaryjny ciąg ratunkowy przed kwasem (Arena 2)
    if (isA2) {
      const hazardY = (ACID_SURGE_SYSTEM && typeof ACID_SURGE_SYSTEM.currentY === 'number')
        ? ACID_SURGE_SYSTEM.currentY
        : ((ARENA_2_CONFIG && ARENA_2_CONFIG.hazardZoneY) || 1440);
      if (botTarget.y + botTarget.h > hazardY - 170) {
        wantsJetpack = true;
      }
    }
    // B. Awaryjny ciąg ratunkowy przed utonięciem w rzece (Arena 3)
    else if (isA3) {
      if (botCenterX >= 1540 && botCenterX <= 2860 && botTarget.y + botTarget.h > 1200) {
        wantsJetpack = true;
      }
    }

    // C. Wspinaczka ku platformie znajdującej się powyżej
    if (targetY < botTarget.y - 45) {
      wantsJetpack = true;
    }

    // D. Pokonywanie przepaści w powietrzu
    const safeDirectlyUnder = getSafeSurfaceBelow(botCenterX, botTarget.y + botTarget.h + 8, currentArenaId);
    if (safeDirectlyUnder === null && (botTarget.vy || 0) > -1.2) {
      wantsJetpack = true;
    }

    // E. Klasa Lekka: RAPTOR – Aerial Superiority, Kiting i Hovering
    if (isRaptor && diffCfg.kitingEnabled !== false) {
      if (targetEnemy && !targetEnemy.isDead) {
        // Kiting w zwarciu: ucieczka w górę i w tył przed wrogiem
        if (distToEnemy < 125) {
          bKeys.up = true;
          wantsJetpack = true;
          if (targetEnemy.x > botCenterX) {
            bKeys.left = true;
            bKeys.right = false;
          } else {
            bKeys.right = true;
            bKeys.left = false;
          }
        }
        // Utrzymywanie przewagi wysokości i zawis
        else if (botTarget.y > targetEnemy.y - 110) {
          wantsJetpack = true;
        }
        if (botTarget.y < targetEnemy.y - 60 && (botTarget.vy || 0) > 0.1) {
          botTarget.vy = Math.min(botTarget.vy * 0.45, 0.35);
          wantsJetpack = true;
        }
      } else if (hasBall && ball.y < groundY - 60 && ballDistFromHip < 280) {
        bKeys.up = true;
        wantsJetpack = true;
      }
    }
  }

  if (wantsJetpack) {
    botTarget.isJetpacking = true;
    botTarget.jetpackPower = 1.0;
    botTarget.vy = Math.max(-6.8, (botTarget.vy || 0) - 0.72);
    botTarget.jetFuel = Math.max(0, (botTarget.jetFuel || 0) - 0.70);

    const nozzle = getJetpackNozzlePos(botTarget);
    const flameCol = (botTarget.team === 'CYAN') ? '#00e5ff' : '#f97316';
    const flameColors = getJetpackFlamePalette(flameCol).particles;
    spawnJetpackSparks(nozzle.x, nozzle.y, botTarget.facing, 2, flameColors, botTarget.vx || 0, botTarget.vy || 0, nozzle.angle);
  } else {
    botTarget.isJetpacking = false;
    botTarget.jetpackPower = 0;
  }

  // =========================================================================
  // 4. STRAFE BOJOWY I ZACHOWANIA TAKTYCZNE
  // =========================================================================
  if (!hasBall && targetEnemy && !targetEnemy.isDead) {
    // W trybie bojowym: taktyczne manewry w zależności od posiadanej broni
    if (botTarget.idleDecisionTimer <= 0) {
      botTarget.idleDecisionTimer = Math.floor(Math.random() * 45 + 30);
      if (botTarget.currentWeapon === WEAPONS.SNIPER) {
        // Snajper kuca dla stabilizacji celownika laserowego
        if (distToEnemy > 280 && Math.random() < 0.45) {
          bKeys.down = true;
          botTarget.crouchTimer = Math.floor(Math.random() * 35 + 25);
        }
      } else if (botTarget.currentWeapon === WEAPONS.AK47) {
        // Karabinek szturmowy: krótkie serie strafe lewo-prawo
        botTarget.strafeDir = Math.random() < 0.5 ? -1 : 1;
        botTarget.strafeTimer = Math.floor(Math.random() * 16 + 10);
      }
    }

    if (botTarget.strafeTimer > 0) {
      if (botTarget.strafeDir > 0) {
        bKeys.right = true;
        bKeys.left = false;
      } else if (botTarget.strafeDir < 0) {
        bKeys.left = true;
        bKeys.right = false;
      }
    }
  } else if (hasBall) {
    const distToBallTotal = Math.hypot(ball.x - botCenterX, ball.y - botCenterY);
    if (distToBallTotal > 260) {
      if (botTarget.idleDecisionTimer <= 0) {
        botTarget.idleDecisionTimer = Math.floor(Math.random() * 60 + 60);
        const roll = Math.random();
        if (roll < 0.40) {
          botTarget.strafeDir = Math.random() < 0.5 ? -1 : 1;
          botTarget.strafeTimer = Math.floor(Math.random() * 16 + 12);
        } else if (roll < 0.65) {
          if (!botTarget.isJumping && !botTarget.isSliding) {
            bKeys.up = true;
          }
        }
      }
      if (botTarget.strafeTimer > 0) {
        if (botTarget.strafeDir > 0) {
          bKeys.right = true;
          bKeys.left = false;
        } else if (botTarget.strafeDir < 0) {
          bKeys.left = true;
          bKeys.right = false;
        }
      }
    }
  }

  // =========================================================================
  // 5. CELOWANIE (PIŁKA NA BRAMKĘ / WRÓG W WALCE)
  // =========================================================================
  const hitReach = botTarget.currentClass?.stats?.hitReach || 56;
  const hipX = botCenterX;
  const hipY = botTarget.y + botTarget.h - 40 + (botTarget.pelvisY || 0);
  const ballDistFromHip = hasBall ? Math.hypot(ball.x - hipX, ball.y - hipY) : Infinity;

  let aimTargetX, aimTargetY;
  if (hasBall) {
    // W Arenie 1 celowanie w piłkę przy prowadzeniu, a w bramkę rywala przy strzale
    const enemyGoalX = (botTarget.team === 'CYAN') ? 3460 : 140;
    const enemyGoalY = 580;

    if (ballDistFromHip <= hitReach + 20 || botTarget.isCharging) {
      aimTargetX = enemyGoalX;
      aimTargetY = enemyGoalY;
    } else {
      aimTargetX = ball.x + (ball.vx * 3);
      aimTargetY = ball.y + (ball.vy * 3);
    }
  } else if (targetEnemy && !targetEnemy.isDead) {
    const isTargetingHuman = (!targetEnemy.isBot || targetEnemy === humanPlayer);
    const canEngageTarget = !isTargetingHuman || isBotVisibleToPlayer(botTarget);

    if (canEngageTarget) {
      aimTargetX = targetEnemy.x + targetEnemy.w / 2;
      aimTargetY = targetEnemy.y + targetEnemy.h / 2;
    } else {
      // Bot poza zasiegiem widzenia gracza: patrzy przed siebie w strone marszu
      const lookDir = Math.sign((targetEnemy.x + targetEnemy.w / 2) - botCenterX) || botTarget.facing || 1;
      aimTargetX = botCenterX + lookDir * 160;
      aimTargetY = botCenterY;
    }
  } else {
    aimTargetX = botCenterX + (botTarget.facing || 1) * 160;
    aimTargetY = botCenterY;
  }

  const dxAim = aimTargetX - botCenterX;
  const dyAim = aimTargetY - botCenterY;
  const baseAngle = Math.atan2(dyAim, dxAim);
  const finalAimAngle = baseAngle + (botTarget.aimErrorAngle || 0);

  const aimDist = 160;
  const desiredAimX = botCenterX + Math.cos(finalAimAngle) * aimDist;
  const desiredAimY = botCenterY + Math.sin(finalAimAngle) * aimDist;

  if (typeof botTarget.aimX !== 'number' || isNaN(botTarget.aimX)) botTarget.aimX = desiredAimX;
  if (typeof botTarget.aimY !== 'number' || isNaN(botTarget.aimY)) botTarget.aimY = desiredAimY;

  const aimLerp = diffCfg.aimLerp || 0.11;
  botTarget.aimX += (desiredAimX - botTarget.aimX) * aimLerp;
  botTarget.aimY += (desiredAimY - botTarget.aimY) * aimLerp;

  // =========================================================================
  // 6. OSTRZAŁ BOTA (TYLKO POZA ARENĄ 1)
  // =========================================================================
  if (!isA1 && targetEnemy && !targetEnemy.isDead) {
    const isTargetingHuman = (!targetEnemy.isBot || targetEnemy === humanPlayer);
    const canEngageTarget = !isTargetingHuman || isBotVisibleToPlayer(botTarget);

    if (canEngageTarget) {
      const enemyCenterX = targetEnemy.x + targetEnemy.w / 2;
      const enemyCenterY = targetEnemy.y + targetEnemy.h / 2;
      const shooterOriginY = botTarget.y + 20;

      const angleToEnemy = Math.atan2(enemyCenterY - shooterOriginY, enemyCenterX - botCenterX);
      const currentAimAngle = Math.atan2(botTarget.aimY - shooterOriginY, botTarget.aimX - botCenterX);

      let angleDiff = Math.abs(currentAimAngle - finalAimAngle);
      while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);

      let directDiff = Math.abs(currentAimAngle - angleToEnemy);
      while (directDiff > Math.PI) directDiff = Math.abs(directDiff - Math.PI * 2);

      const toleranceRad = (botTarget.currentWeapon === WEAPONS.SNIPER ? 10 : 16) * (Math.PI / 180);
      const isAimedAtEnemy = (angleDiff <= toleranceRad) || (directDiff <= toleranceRad);

      if (isAimedAtEnemy) {
        if (!botTarget._aimLocked) {
          botTarget._aimLocked = true;
          botTarget.shootHesitationTimer = diffCfg.shotHesitation || 0;
        }

        const canPullTrigger = (botTarget.shootHesitationTimer <= 0);

        if (canPullTrigger) {
          botTarget.shootPoseTimer = Math.max(botTarget.shootPoseTimer || 0, 25);
          if (botTarget.currentWeapon === WEAPONS.AK47) {
            if (botTarget.burstShotsRemaining > 0) {
              if (botTarget.shootCooldown <= 0) {
                shootWeapon(botTarget, botTarget.currentWeapon);
                botTarget.burstShotsRemaining--;
                if (botTarget.burstShotsRemaining <= 0) {
                  botTarget.burstPauseTimer = diffCfg.akBurstPause;
                }
              }
            } else if (botTarget.burstPauseTimer <= 0 && botTarget.shootCooldown <= 0) {
              botTarget.burstShotsRemaining = diffCfg.akBurstShots;
              shootWeapon(botTarget, botTarget.currentWeapon);
              botTarget.burstShotsRemaining--;
            }
          } else if (botTarget.currentWeapon === WEAPONS.SHOTGUN) {
            if (distToEnemy < 180 && botTarget.shootCooldown <= 0) {
              shootWeapon(botTarget, botTarget.currentWeapon);
              if (botTarget.difficulty === 'easy') {
                botTarget.shootCooldown = Math.max(botTarget.shootCooldown || 0, 35);
              }
            }
          } else if (botTarget.currentWeapon === WEAPONS.SNIPER) {
            if (botTarget.shootCooldown <= 0) {
              shootWeapon(botTarget, botTarget.currentWeapon);
              if (botTarget.difficulty === 'easy') {
                botTarget.shootCooldown = Math.max(botTarget.shootCooldown || 0, 45);
              }
            }
          }
        }
      } else {
        botTarget._aimLocked = false;
      }
    } else {
      // Bot jest poza polem widzenia gracza - nie prowadzi ognia
      botTarget.isShooting = false;
      botTarget.burstShotsRemaining = 0;
      botTarget._aimLocked = false;
    }
  }

  // =========================================================================
  // 7. KOPANIE PIŁKI I SPARTAN MELEE KICK
  // =========================================================================
  if (hasBall) {
    if (ballDistFromHip <= hitReach + 10) {
      if (!botTarget.isCharging && botTarget.kickState === 'IDLE' && botTarget.kickCooldown <= 0) {
        botTarget.isCharging = true;
        botTarget.chargePower = 0;
        botTarget.chargeTarget = Math.random() * 0.55 + 0.30;
      } else if (botTarget.isCharging) {
        if (botTarget.chargePower >= botTarget.chargeTarget) {
          executeReleaseKick(ball, botTarget, 0, meleeTargets);
        }
      }
    } else if (botTarget.isCharging) {
      if (botTarget.chargePower >= botTarget.chargeTarget || ballDistFromHip > hitReach + 40) {
        executeReleaseKick(ball, botTarget, 0, meleeTargets);
      }
    }
  } else if (targetEnemy && !targetEnemy.isDead) {
    // Tryb Deathmatch: Spartan Kick wręcz we wroga
    const distToEnemyFromHip = Math.hypot((targetEnemy.x + targetEnemy.w / 2) - hipX, (targetEnemy.y + targetEnemy.h / 2) - hipY);
    if (distToEnemyFromHip <= hitReach + 20) {
      if (!botTarget.isCharging && botTarget.kickState === 'IDLE' && botTarget.kickCooldown <= 0) {
        if (Math.random() < (diffCfg.kickChance !== undefined ? diffCfg.kickChance : 0.70)) {
          botTarget.isCharging = true;
          botTarget.chargePower = 0;
          botTarget.chargeTarget = Math.random() * 0.40 + 0.45;
        }
      } else if (botTarget.isCharging) {
        if (botTarget.chargePower >= botTarget.chargeTarget) {
          executeReleaseKick(null, botTarget, 0, meleeTargets);
        }
      }
    } else if (botTarget.isCharging) {
      executeReleaseKick(null, botTarget, 0, meleeTargets);
    }
  }

  // =========================================================================
  // 8. WYWOŁANIE FIZYKI POSTACI
  // =========================================================================
  updatePlayer(bKeys, null, groundY, ball, spawnGrass, botTarget, meleeTargets);
}
