// =============================================================================
// JS/NETWORKMATCH.JS - KONFIGURACJA SKŁADÓW DRUŻYN (SMASH BROS ROSTER SYSTEM)
// Obsługa różnorodnych trybów: Kooperacja (Host+Klient vs Boty), Rywalizacja (PvP),
// dowolny podział botów na Team Alpha i Beta oraz tryb FFA (Każdy na każdego).
// =============================================================================

export const MP_TEAMS = {
  ALPHA: 'CYAN',
  BETA: 'ORANGE'
};

export const MP_MODES = {
  TEAMS: 'TEAMS',
  FFA: 'FFA'
};

export const MAX_ARENA_COMBATANTS = 8;
export const MAX_MP_BOTS = 6;

export const MP_PRESETS = {
  COOP: 'COOP',
  VERSUS_4V4: 'VERSUS_4V4',
  VERSUS_3V3: 'VERSUS_3V3',
  VERSUS_2V2: 'VERSUS_2V2',
  DUEL_1V1: 'DUEL_1V1',
  FFA: 'FFA',
  CUSTOM: 'CUSTOM'
};

const STORAGE_KEY_CONFIG = 'kih_mp_match_config_v2';

function loadStoredConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const bA = Math.max(0, Math.min(MAX_MP_BOTS, parseInt(parsed.botsAlpha, 10) || 0));
        const bB = Math.max(0, Math.min(MAX_MP_BOTS - bA, parseInt(parsed.botsBeta, 10) || 0));
        return {
          mode: parsed.mode === 'FFA' ? 'FFA' : 'TEAMS',
          hostTeam: parsed.hostTeam === 'ORANGE' ? 'ORANGE' : 'CYAN',
          clientTeam: parsed.clientTeam === 'CYAN' ? 'CYAN' : 'ORANGE',
          botsAlpha: bA,
          botsBeta: bB,
          botsFFA: Math.max(0, Math.min(MAX_MP_BOTS, parseInt(parsed.botsFFA, 10) || 4)),
          preset: parsed.preset || 'VERSUS_2V2'
        };
      }
    }
  } catch (_) {}
  return {
    mode: 'TEAMS',
    hostTeam: 'CYAN',
    clientTeam: 'ORANGE',
    botsAlpha: 1,
    botsBeta: 1,
    botsFFA: 4,
    preset: 'VERSUS_2V2'
  };
}

export const mpMatchConfig = loadStoredConfig();

export function saveMpMatchConfig() {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(mpMatchConfig));
  } catch (_) {}
}

/**
 * Zastosowanie szybkiego szablonu taktycznego (Preset)
 * @param {string} presetName
 */
export function applyMpPreset(presetName) {
  switch (presetName) {
    case MP_PRESETS.COOP:
      // KOOPERACJA: Host i Klient razem w Team Alpha (Cyan) vs wrogie boty w Team Beta (Orange)
      mpMatchConfig.mode = 'TEAMS';
      mpMatchConfig.hostTeam = 'CYAN';
      mpMatchConfig.clientTeam = 'CYAN';
      mpMatchConfig.botsAlpha = 0;
      mpMatchConfig.botsBeta = 4;
      mpMatchConfig.preset = MP_PRESETS.COOP;
      break;

    case MP_PRESETS.VERSUS_4V4:
      // RYWALIZACJA 4v4: Host+3 Boty (Alpha) vs Klient+3 Boty (Beta) -> Pełne 8 postaci na arenie!
      mpMatchConfig.mode = 'TEAMS';
      mpMatchConfig.hostTeam = 'CYAN';
      mpMatchConfig.clientTeam = 'ORANGE';
      mpMatchConfig.botsAlpha = 3;
      mpMatchConfig.botsBeta = 3;
      mpMatchConfig.preset = MP_PRESETS.VERSUS_4V4;
      break;

    case MP_PRESETS.VERSUS_3V3:
      // RYWALIZACJA 3v3: Host+2 Boty (Alpha) vs Klient+2 Boty (Beta) -> 6 postaci
      mpMatchConfig.mode = 'TEAMS';
      mpMatchConfig.hostTeam = 'CYAN';
      mpMatchConfig.clientTeam = 'ORANGE';
      mpMatchConfig.botsAlpha = 2;
      mpMatchConfig.botsBeta = 2;
      mpMatchConfig.preset = MP_PRESETS.VERSUS_3V3;
      break;

    case MP_PRESETS.VERSUS_2V2:
      // RYWALIZACJA 2v2: Host+1 Bot (Alpha) vs Klient+1 Bot (Beta) -> 4 postacie
      mpMatchConfig.mode = 'TEAMS';
      mpMatchConfig.hostTeam = 'CYAN';
      mpMatchConfig.clientTeam = 'ORANGE';
      mpMatchConfig.botsAlpha = 1;
      mpMatchConfig.botsBeta = 1;
      mpMatchConfig.preset = MP_PRESETS.VERSUS_2V2;
      break;

    case MP_PRESETS.DUEL_1V1:
      // CZYSTY POJEDYNEK 1v1: Host vs Klient (brak botów) -> 2 postacie
      mpMatchConfig.mode = 'TEAMS';
      mpMatchConfig.hostTeam = 'CYAN';
      mpMatchConfig.clientTeam = 'ORANGE';
      mpMatchConfig.botsAlpha = 0;
      mpMatchConfig.botsBeta = 0;
      mpMatchConfig.preset = MP_PRESETS.DUEL_1V1;
      break;

    case MP_PRESETS.FFA:
      // KAŻDY NA KAŻDEGO: brak drużyn, 2 graczy + 6 botów FFA -> 8 postaci!
      mpMatchConfig.mode = 'FFA';
      mpMatchConfig.hostTeam = 'FFA_HOST';
      mpMatchConfig.clientTeam = 'FFA_CLIENT';
      mpMatchConfig.botsFFA = 6;
      mpMatchConfig.preset = MP_PRESETS.FFA;
      break;

    default:
      mpMatchConfig.preset = MP_PRESETS.CUSTOM;
      break;
  }

  saveMpMatchConfig();
  return mpMatchConfig;
}

/**
 * Zmiana drużyny dla wybranego gracza (Host lub Klient)
 */
export function setMpPlayerTeam(role, team) {
  const safeTeam = (team === 'ORANGE') ? 'ORANGE' : 'CYAN';
  if (role === 'host') {
    mpMatchConfig.hostTeam = safeTeam;
  } else if (role === 'client') {
    mpMatchConfig.clientTeam = safeTeam;
  }
  mpMatchConfig.mode = 'TEAMS';
  mpMatchConfig.preset = detectCurrentPreset();
  saveMpMatchConfig();
  return mpMatchConfig;
}

/**
 * Zmiana liczby botów przypisanych do danej drużyny (Team Alpha lub Team Beta)
 * Maksymalna łączna liczba botów w multiplayer = 6 (2 graczy + 6 botów = 8 postaci na arenie!)
 */
export function setMpTeamBots(teamKey, count) {
  const target = Math.max(0, Math.min(MAX_MP_BOTS, parseInt(count, 10) || 0));

  if (teamKey === 'alpha' || teamKey === 'CYAN') {
    mpMatchConfig.botsAlpha = target;
    if (mpMatchConfig.botsAlpha + mpMatchConfig.botsBeta > MAX_MP_BOTS) {
      mpMatchConfig.botsBeta = Math.max(0, MAX_MP_BOTS - mpMatchConfig.botsAlpha);
    }
  } else if (teamKey === 'beta' || teamKey === 'ORANGE') {
    mpMatchConfig.botsBeta = target;
    if (mpMatchConfig.botsAlpha + mpMatchConfig.botsBeta > MAX_MP_BOTS) {
      mpMatchConfig.botsAlpha = Math.max(0, MAX_MP_BOTS - mpMatchConfig.botsBeta);
    }
  }

  mpMatchConfig.mode = 'TEAMS';
  mpMatchConfig.preset = detectCurrentPreset();
  saveMpMatchConfig();
  return mpMatchConfig;
}

/**
 * Wygodny stepper botów z ochroną limitu 8 postaci
 */
export function adjustMpTeamBots(teamKey, delta) {
  const curAlpha = mpMatchConfig.botsAlpha || 0;
  const curBeta = mpMatchConfig.botsBeta || 0;
  const total = curAlpha + curBeta;

  if (teamKey === 'alpha' || teamKey === 'CYAN') {
    if (delta > 0 && total >= MAX_MP_BOTS) return mpMatchConfig;
    const nextVal = Math.max(0, Math.min(MAX_MP_BOTS, curAlpha + delta));
    return setMpTeamBots('alpha', nextVal);
  } else {
    if (delta > 0 && total >= MAX_MP_BOTS) return mpMatchConfig;
    const nextVal = Math.max(0, Math.min(MAX_MP_BOTS, curBeta + delta));
    return setMpTeamBots('beta', nextVal);
  }
}

/**
 * Zmiana liczby botów w trybie Każdy na Każdego (FFA, 0 do 6 botów)
 */
export function setMpFFABots(count) {
  mpMatchConfig.botsFFA = Math.max(0, Math.min(MAX_MP_BOTS, parseInt(count, 10) || 0));
  mpMatchConfig.mode = 'FFA';
  mpMatchConfig.preset = MP_PRESETS.FFA;
  saveMpMatchConfig();
  return mpMatchConfig;
}

export function adjustMpFFABots(delta) {
  const cur = (mpMatchConfig.botsFFA !== undefined) ? mpMatchConfig.botsFFA : 4;
  const nextVal = Math.max(0, Math.min(MAX_MP_BOTS, cur + delta));
  return setMpFFABots(nextVal);
}

/**
 * Zmiana trybu głównego (TEAMS lub FFA)
 */
export function setMpMode(mode) {
  mpMatchConfig.mode = (mode === 'FFA') ? 'FFA' : 'TEAMS';
  if (mpMatchConfig.mode === 'FFA') {
    mpMatchConfig.preset = MP_PRESETS.FFA;
  } else {
    mpMatchConfig.preset = detectCurrentPreset();
  }
  saveMpMatchConfig();
  return mpMatchConfig;
}

export function detectCurrentPreset() {
  if (mpMatchConfig.mode === 'FFA') return MP_PRESETS.FFA;
  const hT = mpMatchConfig.hostTeam;
  const cT = mpMatchConfig.clientTeam;
  const bA = mpMatchConfig.botsAlpha;
  const bB = mpMatchConfig.botsBeta;

  if (hT === 'CYAN' && cT === 'CYAN' && bA === 0 && bB > 0) return MP_PRESETS.COOP;
  if (hT === 'CYAN' && cT === 'ORANGE' && bA === 3 && bB === 3) return MP_PRESETS.VERSUS_4V4;
  if (hT === 'CYAN' && cT === 'ORANGE' && bA === 2 && bB === 2) return MP_PRESETS.VERSUS_3V3;
  if (hT === 'CYAN' && cT === 'ORANGE' && bA === 1 && bB === 1) return MP_PRESETS.VERSUS_2V2;
  if (hT === 'CYAN' && cT === 'ORANGE' && bA === 0 && bB === 0) return MP_PRESETS.DUEL_1V1;
  return MP_PRESETS.CUSTOM;
}

/**
 * Zwraca łączną liczbę wszystkich postaci na arenie (Gracze + Boty <= 8)
 */
export function getTotalMpCombatants(cfg = mpMatchConfig) {
  if (cfg.mode === 'FFA') {
    return 2 + ((cfg.botsFFA !== undefined) ? cfg.botsFFA : 4);
  }
  return 2 + (cfg.botsAlpha || 0) + (cfg.botsBeta || 0);
}

/**
 * Zwraca łączną liczbę botów do zespawnowania w meczu
 */
export function getTotalMpBotCount() {
  if (mpMatchConfig.mode === 'FFA') {
    return mpMatchConfig.botsFFA !== undefined ? mpMatchConfig.botsFFA : 2;
  }
  return (mpMatchConfig.botsAlpha || 0) + (mpMatchConfig.botsBeta || 0);
}

/**
 * Generuje tablicę drużyn dla wszystkich aktywnych botów [0 .. N-1]
 * np. ['CYAN', 'ORANGE', 'ORANGE']
 */
export function getMpBotTeamsList() {
  if (mpMatchConfig.mode === 'FFA') {
    const list = [];
    const count = getTotalMpBotCount();
    for (let i = 0; i < count; i++) {
      list.push(`FFA_BOT_${i + 1}`);
    }
    return list;
  }

  const list = [];
  const bA = mpMatchConfig.botsAlpha || 0;
  const bB = mpMatchConfig.botsBeta || 0;

  for (let i = 0; i < bA; i++) {
    list.push('CYAN');
  }
  for (let i = 0; i < bB; i++) {
    list.push('ORANGE');
  }
  return list;
}

/**
 * Generuje profesjonalny, taktyczny opis aktualnego składu drużyn (ZERO EMOJIS)
 */
export function getMpMatchRosterSummary(cfg = mpMatchConfig) {
  const total = getTotalMpCombatants(cfg);
  const tag = (total >= MAX_ARENA_COMBATANTS) ? `[${total}/${MAX_ARENA_COMBATANTS} MAKS]` : `[${total}/${MAX_ARENA_COMBATANTS}]`;

  if (cfg.mode === 'FFA') {
    const bCount = (cfg.botsFFA !== undefined) ? cfg.botsFFA : 4;
    return `${tag} KAŻDY NA KAŻDEGO (FFA): 2 GRACZY + ${bCount} BOTÓW [BEZ SOJUSZY]`;
  }

  const hT = cfg.hostTeam || 'CYAN';
  const cT = cfg.clientTeam || 'ORANGE';
  const bA = cfg.botsAlpha || 0;
  const bB = cfg.botsBeta || 0;

  const alphaHumans = (hT === 'CYAN' ? 1 : 0) + (cT === 'CYAN' ? 1 : 0);
  const betaHumans = (hT === 'ORANGE' ? 1 : 0) + (cT === 'ORANGE' ? 1 : 0);

  const alphaTotal = alphaHumans + bA;
  const betaTotal = betaHumans + bB;

  // Kooperacja (Host i Klient razem w jednej drużynie)
  if (hT === cT) {
    const teamName = (hT === 'CYAN') ? 'ALPHA (CYAN)' : 'BETA (ORANGE)';
    const enemyName = (hT === 'CYAN') ? 'BETA (ORANGE)' : 'ALPHA (CYAN)';
    const allyBots = (hT === 'CYAN') ? bA : bB;
    const enemyBots = (hT === 'CYAN') ? bB : bA;

    const allySuffix = (allyBots > 0) ? ` + ${allyBots} BOT${allyBots > 1 ? 'Y' : ''}` : '';
    return `${tag} KOOPERACJA: TEAM ${teamName} [HOST + KLIENT${allySuffix}] VS TEAM ${enemyName} [${enemyBots} BOTÓW AI]`;
  }

  // Czysty pojedynek 1v1
  if (bA === 0 && bB === 0) {
    return `${tag} POJEDYNEK 1V1: HOST (ALPHA) VS KLIENT (BETA)`;
  }

  // Mecz drużynowy symetryczny lub asymetryczny
  const alphaDetails = [];
  if (hT === 'CYAN') alphaDetails.push('HOST');
  if (cT === 'CYAN') alphaDetails.push('KLIENT');
  if (bA > 0) alphaDetails.push(`${bA} BOT${bA > 1 ? 'Y' : ''}`);

  const betaDetails = [];
  if (hT === 'ORANGE') betaDetails.push('HOST');
  if (cT === 'ORANGE') betaDetails.push('KLIENT');
  if (bB > 0) betaDetails.push(`${bB} BOT${bB > 1 ? 'Y' : ''}`);

  return `${tag} BITWA ${alphaTotal}v${betaTotal}: ALPHA [${alphaDetails.join(' + ')}] VS BETA [${betaDetails.join(' + ')}]`;
}

/**
 * Oblicza optymalne punkty spawnu dla Hosta, Klienta i botów na podstawie wybranej mapy i drużyn
 */
export function getMpSpawnPositions(arenaId, cfg = mpMatchConfig, groundY = 800) {
  const isA2 = (arenaId === 'ARENA_2' || arenaId === 'ARENA_2_SECTOR_X' || arenaId === 'ARENA_2_PANDORA');
  const isA3 = (arenaId === 'ARENA_3' || arenaId === 'ARENA_FOUNDRY');

  // Domyślne współrzędne bazowe (lewa = Team Alpha / Cyan, prawa = Team Beta / Orange)
  let alphaBaseX, betaBaseX, spawnY;
  if (isA2) {
    alphaBaseX = 350;
    betaBaseX = 3470;
    spawnY = 350;
  } else if (isA3) {
    alphaBaseX = 400;
    betaBaseX = 3800;
    spawnY = 880;
  } else {
    alphaBaseX = 500;
    betaBaseX = 2600;
    spawnY = groundY - 70;
  }

  const hTeam = cfg.hostTeam || 'CYAN';
  const cTeam = cfg.clientTeam || 'ORANGE';

  // Spawn Hosta
  const hostSpawn = {
    x: (hTeam === 'CYAN') ? alphaBaseX : betaBaseX,
    y: spawnY,
    facing: (hTeam === 'CYAN') ? 1 : -1
  };

  // Spawn Klienta: jeśli jest w tej samej drużynie co Host, odsuwamy o +180px by nie nakładali się na siebie
  let clientX;
  if (cTeam === 'CYAN') {
    clientX = (hTeam === 'CYAN') ? (alphaBaseX + 220) : alphaBaseX;
  } else {
    clientX = (hTeam === 'ORANGE') ? (betaBaseX - 220) : betaBaseX;
  }

  const clientSpawn = {
    x: clientX,
    y: spawnY,
    facing: (cTeam === 'CYAN') ? 1 : -1
  };

  // Spawny dla botów
  const botSpawns = [];
  const bList = getMpBotTeamsList();

  if (cfg.mode === 'FFA') {
    const totalEntities = bList.length + 2;
    const minX = alphaBaseX;
    const maxX = betaBaseX;
    const span = Math.max(220, (maxX - minX) / Math.max(1, totalEntities - 1));
    for (let i = 0; i < bList.length; i++) {
      botSpawns.push({
        x: Math.round(minX + span * (i + 1)),
        y: spawnY,
        facing: (i % 2 === 0) ? 1 : -1
      });
    }
  } else {
    let cyanBotOffset = 0;
    let orangeBotOffset = 0;
    for (let i = 0; i < bList.length; i++) {
      const bTeam = bList[i];
      if (bTeam === 'CYAN') {
        const offsetX = 300 + (cyanBotOffset * 125);
        cyanBotOffset++;
        botSpawns.push({
          x: alphaBaseX + offsetX,
          y: spawnY,
          facing: 1
        });
      } else {
        const offsetX = 300 + (orangeBotOffset * 125);
        orangeBotOffset++;
        botSpawns.push({
          x: betaBaseX - offsetX,
          y: spawnY,
          facing: -1
        });
      }
    }
  }

  return {
    host: hostSpawn,
    client: clientSpawn,
    bots: botSpawns
  };
}

/**
 * Przypisanie drużyn sieciowych i identyfikatorów dla gracza lokalnego i zdalnego
 */
export function applyMpTeamVisuals(isHost, localPlayer, remotePlayer) {
  const isFFA = (mpMatchConfig.mode === 'FFA');
  const hTeam = mpMatchConfig.hostTeam || 'CYAN';
  const cTeam = mpMatchConfig.clientTeam || 'ORANGE';

  if (localPlayer) {
    if (isFFA) {
      localPlayer.team = isHost ? 'FFA_HOST' : 'FFA_CLIENT';
    } else {
      localPlayer.team = isHost ? hTeam : cTeam;
    }
    localPlayer.name = isHost ? 'HOST' : 'GRACZ 2';
  }

  if (remotePlayer) {
    if (isFFA) {
      remotePlayer.team = isHost ? 'FFA_CLIENT' : 'FFA_HOST';
    } else {
      remotePlayer.team = isHost ? cTeam : hTeam;
    }
    remotePlayer.name = isHost ? 'GRACZ 2' : 'HOST';
  }
}
