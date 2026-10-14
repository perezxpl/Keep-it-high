// =========================================================================
// DEATHMATCH/LOGIC.JS - LOGIKA BITWY DEATHMATCH I ROZLICZANIE WYNIKÓW
// Odliczanie 5 minut (300s), rejestracja zabójstw, ranking, rozliczanie nagród XP
// =========================================================================

import {
  DEATHMATCH_DURATION,
  DEATHMATCH_XP_REWARDS,
  DEATHMATCH_MODES,
  TEAMS,
  deathmatchConfig,
  deathmatchState
} from './state.js';
import { addPlayerXP, recordMatchResult, recordKill, recordDeath } from '../progression.js';
import { ARENA_2_CONFIG } from '../arenas/arena2/state.js';
import { balanceBotClasses } from '../bot.js';

/**
 * Inicjalizacja sesji Deathmatch przy wejściu na Arenę 2
 */
export function initDeathmatch(player, botOrBots, remotePlayer) {
  deathmatchState.active = true;
  deathmatchState.mode = deathmatchConfig.mode || DEATHMATCH_MODES.TDM;
  deathmatchState.playerTeam = deathmatchConfig.playerTeam || TEAMS.CYAN;
  deathmatchState.timeRemaining = DEATHMATCH_DURATION;
  deathmatchState.matchEnded = false;
  deathmatchState.endCelebrationTimer = 0;
  deathmatchState.xpAwarded = false;
  deathmatchState.awardedXpAmount = 0;
  deathmatchState.playerPlace = 1;
  deathmatchState.teamScores[TEAMS.CYAN] = 0;
  deathmatchState.teamScores[TEAMS.ORANGE] = 0;

  // Ustawienie drużyny i reset flag walki gracza
  if (player) {
    player.team = deathmatchState.playerTeam;
    player.killer = null;
    player.lastAttacker = null;
    player.lastAttackerTimer = 0;
    player._dmDeathRecorded = false;
  }

  const botList = Array.isArray(botOrBots) ? botOrBots : (botOrBots ? [botOrBots] : []);
  const enemyTeam = (deathmatchState.playerTeam === TEAMS.CYAN ? TEAMS.ORANGE : TEAMS.CYAN);

  // Aktywacja i konfiguracja botów
  botList.forEach((b, idx) => {
    if (!b) return;
    b.active = true;
    b.isBot = true;
    b.killer = null;
    b.lastAttacker = null;
    b.lastAttackerTimer = 0;
    b._dmDeathRecorded = false;

    if (deathmatchState.mode === DEATHMATCH_MODES.TDM) {
      // W TDM przy 3 botach: 1 sojusznik (CYAN), 2 wrogów (ORANGE) -> mecz 2 vs 2!
      // Przy 5 botach: 2 sojuszników (CYAN), 3 wrogów (ORANGE) -> mecz 3 vs 3!
      let isAlly = false;
      if (botList.length === 3 && idx === 0) isAlly = true;
      else if (botList.length >= 4 && idx < Math.floor(botList.length / 2)) isAlly = true;

      b.team = isAlly ? deathmatchState.playerTeam : enemyTeam;
    } else {
      b.team = TEAMS.ORANGE;
    }
  });

  // Automatyczny dobór zróżnicowanych klas bez duplikatów (TDM: 2 pozostałe klasy dla botów; FFA: minimalna powtarzalność)
  balanceBotClasses(player, botList, deathmatchState.mode);

  // Rejestracja uczestników do rankingu
  const pList = [];

  if (player) {
    pList.push({
      id: 'player',
      name: 'OPERATOR [TY]',
      isPlayer: true,
      team: deathmatchState.playerTeam,
      kills: 0,
      deaths: 0,
      ref: player
    });
  }

  botList.forEach((b, idx) => {
    if (!b) return;
    pList.push({
      id: b.id || `bot_${idx + 1}`,
      name: `${b.name || 'SGT. STRIKER'} [AI]`,
      isPlayer: false,
      team: b.team,
      kills: 0,
      deaths: 0,
      ref: b
    });
  });

  if (remotePlayer && remotePlayer.active) {
    const remoteTeam = (deathmatchState.mode === DEATHMATCH_MODES.TDM)
      ? enemyTeam
      : TEAMS.ORANGE;
    remotePlayer.team = remoteTeam;
    pList.push({
      id: 'remotePlayer',
      name: 'OPERATOR [P2P]',
      isPlayer: false,
      team: remoteTeam,
      kills: 0,
      deaths: 0,
      ref: remotePlayer
    });
  }

  deathmatchState.participants = pList;
  updateLeaderboard();
}

/**
 * Aktualizacja rankingu na żywo
 */
export function updateLeaderboard() {
  const list = [...deathmatchState.participants];
  list.sort((a, b) => {
    if (b.kills !== a.kills) return b.kills - a.kills;
    return a.deaths - b.deaths; // Mniej śmierci przy remisie
  });
  deathmatchState.leaderboard = list;

  const playerIdx = list.findIndex(p => p.isPlayer);
  deathmatchState.playerPlace = (playerIdx !== -1) ? (playerIdx + 1) : 1;
}

/**
 * Główna pętla logiki Deathmatch wywoływana w każdej klatce gry
 */
export function updateDeathmatch(dt, player, botOrBots, remotePlayer, arenaScore) {
  if (!deathmatchState.active) return;

  // Odliczanie po zakończeniu meczu (podium)
  if (deathmatchState.matchEnded) {
    if (deathmatchState.endCelebrationTimer > 0) {
      deathmatchState.endCelebrationTimer--;
      if (deathmatchState.endCelebrationTimer <= 0) {
        // Po zakończeniu celebracji, restart sesji na nowe 5 minut
        initDeathmatch(player, botOrBots, remotePlayer);
      }
    }
    return;
  }

  // 1. Odliczanie czasu bitwy (5 minut = 300s)
  const stepTime = (typeof dt === 'number' && dt > 0 && dt < 1) ? dt : (1 / 60);
  deathmatchState.timeRemaining = Math.max(0, deathmatchState.timeRemaining - stepTime);

  // 2. Obsługa faktycznych eliminacji w walce
  const botList = Array.isArray(botOrBots) ? botOrBots : (botOrBots ? [botOrBots] : []);
  const combatants = [];
  if (player) combatants.push(player);
  for (const b of botList) {
    if (b && b.active) combatants.push(b);
  }
  if (remotePlayer && remotePlayer.active) combatants.push(remotePlayer);

  for (let i = 0; i < combatants.length; i++) {
    const c = combatants[i];
    if (!c) continue;

    // Odliczanie okna czasowego agresora
    if (c.lastAttackerTimer > 0) {
      c.lastAttackerTimer--;
      if (c.lastAttackerTimer <= 0) {
        c.lastAttacker = null;
      }
    }

    if (c.isDead) {
      if (!c._dmDeathRecorded) {
        c._dmDeathRecorded = true;

        // Rejestracja zgonu dla ofiary
        const victimData = deathmatchState.participants.find(p => p.ref === c);
        if (victimData) {
          victimData.deaths++;
        }
        if (c === player) {
          recordDeath();
        }

        // Sprawdzenie, czy ofiara została FAKTYCZNIE zabita przez przeciwnika
        const killerRef = c.killer;
        const isSelfKill = !killerRef || (killerRef === c);
        const isFriendlyFire = (deathmatchState.mode === DEATHMATCH_MODES.TDM) && killerRef && (killerRef.team === c.team);

        if (!isSelfKill && !isFriendlyFire) {
          // FAKTYCZNE ZABÓJSTWO: zabójca otrzymuje 1 punkt, a jego drużyna +1
          const killerData = deathmatchState.participants.find(p => p.ref === killerRef);
          if (killerData) {
            killerData.kills++;
            if (deathmatchState.teamScores[killerData.team] !== undefined) {
              deathmatchState.teamScores[killerData.team]++;
            }
          }

          if (killerRef === player) {
            recordKill();
          }
        }
        // Jeśli przeciwnik zginął sam (kwas, upadek, samobójstwo) –
        // przeciwna drużyna NIE dostaje za to punktu! Punkty są wyłącznie za faktyczne zabójstwo.

        updateLeaderboard();
      }
    } else {
      c._dmDeathRecorded = false;
      c.killer = null;
    }
  }

  // 3. Synchronizacja wyniku z globalnym arenaScore (do HUD-u)
  if (arenaScore) {
    arenaScore.cyan = deathmatchState.teamScores[TEAMS.CYAN];
    arenaScore.orange = deathmatchState.teamScores[TEAMS.ORANGE];
  }

  // 4. Sprawdzenie warunku zakończenia bitwy (Koniec 5 minut)
  if (deathmatchState.timeRemaining <= 0) {
    finishDeathmatch();
  }
}

/**
 * Finał meczu: wyłonienie zwycięzców, przyznanie nagród XP i uruchomienie ekranu podium
 */
export function finishDeathmatch() {
  if (deathmatchState.matchEnded) return;

  deathmatchState.matchEnded = true;
  deathmatchState.endCelebrationTimer = deathmatchState.maxEndCelebrationTimer;
  updateLeaderboard();

  // Ustalenie miejsca gracza i nagrody XP (100 / 80 / 60 / 40 XP)
  const place = deathmatchState.playerPlace;
  let rewardXp = DEATHMATCH_XP_REWARDS.PARTICIPATION; // Domyślnie 40 XP za udział

  if (place === 1) {
    rewardXp = DEATHMATCH_XP_REWARDS.PLACE_1; // 100 XP
  } else if (place === 2) {
    rewardXp = DEATHMATCH_XP_REWARDS.PLACE_2; // 80 XP
  } else if (place === 3) {
    rewardXp = DEATHMATCH_XP_REWARDS.PLACE_3; // 60 XP
  }

  deathmatchState.awardedXpAmount = rewardXp;
  deathmatchState.xpAwarded = true;

  // Przyznanie XP
  addPlayerXP(rewardXp);

  // Zapis do statystyk (wygrana przy 1. miejscu lub triumfie drużyny)
  const isTeamWinner = (deathmatchState.mode === DEATHMATCH_MODES.TDM) &&
    (deathmatchState.teamScores[deathmatchState.playerTeam] > deathmatchState.teamScores[deathmatchState.playerTeam === TEAMS.CYAN ? TEAMS.ORANGE : TEAMS.CYAN]);
  const isFfaWinner = (deathmatchState.mode === DEATHMATCH_MODES.FFA) && (place === 1);

  if (isTeamWinner || isFfaWinner) {
    recordMatchResult('WIN');
  } else {
    recordMatchResult('LOSS');
  }
}
