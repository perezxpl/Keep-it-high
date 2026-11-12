// =========================================================================
// DEATHMATCH/LOGIC.JS - LOGIKA BITWY DEATHMATCH I ROZLICZANIE WYNIKÓW
// Odliczanie 5 minut (300s), rejestracja zabójstw, ranking, rozliczanie nagród XP
// =========================================================================

import {
  DEATHMATCH_DURATION,
  DEATHMATCH_XP_REWARDS,
  DEATHMATCH_MODES,
  TEAMS,
  DEATHMATCH_PHASES,
  deathmatchConfig,
  deathmatchState
} from './state.js';
import { addPlayerXP, recordMatchResult, recordKill, recordDeath } from '../progression.js';
import { registerKillstreakKill, resetKillstreak } from '../killstreaks/index.js';
import { registerCalloutKill, onPlayerDeathCallout } from '../callouts/index.js';
import { ARENA_2_CONFIG } from '../arenas/arena2/state.js';
import { balanceBotClasses } from '../bot.js';
import { triggerCombatFeedBanner, triggerCombatFeedEvent, updateCombatFeed, isHazardName } from '../ui/combatFeed.js';
import { mpMatchConfig, getMpBotTeamsList } from '../networkMatch.js';
import { getActiveRemotePlayers } from '../networkPlayers.js';
import { playSound } from '../audio/index.js';

let _dmSyncTimer = 0;

/**
 * Inicjalizacja sesji Deathmatch przy wejściu na Arenę 2
 */
export function initDeathmatch(player, botOrBots, remotePlayer) {
  deathmatchState.active = true;
  const isMulti = (remotePlayer && remotePlayer.active);
  if (isMulti && mpMatchConfig) {
    deathmatchState.mode = (mpMatchConfig.mode === 'FFA') ? DEATHMATCH_MODES.FFA : DEATHMATCH_MODES.TDM;
    deathmatchState.playerTeam = player?.team || (mpMatchConfig.hostTeam || TEAMS.CYAN);
  } else {
    deathmatchState.mode = deathmatchConfig.mode || DEATHMATCH_MODES.TDM;
    deathmatchState.playerTeam = deathmatchConfig.playerTeam || TEAMS.CYAN;
  }
  deathmatchState.winCondition = deathmatchConfig.winCondition || 'BOTH';
  deathmatchState.fragLimit = deathmatchConfig.fragLimit || 25;
  deathmatchState.matchDuration = deathmatchConfig.duration || DEATHMATCH_DURATION;
  deathmatchState.timeRemaining = deathmatchState.matchDuration;
  deathmatchState.elapsedTime = 0;
  deathmatchState.matchPhase = DEATHMATCH_PHASES.COUNTDOWN;
  deathmatchState.countdownTimer = 3.0;
  deathmatchState.countdownDuration = 3.0;
  deathmatchState.countdownBeeps = { 3: false, 2: false, 1: false, 0: false };
  deathmatchState.fightBannerTimer = 0;
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

  // Ustawienie drużyny i reset flag walki gracza
  const isFFA = (deathmatchState.mode === DEATHMATCH_MODES.FFA);
  if (player) {
    player.team = isFFA ? 'FFA_PLAYER' : deathmatchState.playerTeam;
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

    if (!isFFA) {
      if (remotePlayer && remotePlayer.active) {
        const mpBotTeams = getMpBotTeamsList();
        b.team = (mpBotTeams && mpBotTeams[idx]) ? mpBotTeams[idx] : (b.team || enemyTeam);
      } else {
        // W TDM przy 3 botach: 1 sojusznik (CYAN), 2 wrogów (ORANGE) -> mecz 2 vs 2!
        // Przy 5 botach: 2 sojuszników (CYAN), 3 wrogów (ORANGE) -> mecz 3 vs 3!
        let isAlly = false;
        if (botList.length === 3 && idx === 0) isAlly = true;
        else if (botList.length >= 4 && idx < Math.floor(botList.length / 2)) isAlly = true;

        b.team = isAlly ? deathmatchState.playerTeam : enemyTeam;
      }
    } else {
      b.team = `FFA_BOT_${idx + 1}`;
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
      team: player.team,
      kills: 0,
      deaths: 0,
      ref: player
    });
  }

  botList.forEach((b, idx) => {
    if (!b || !b.active) return;
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

  const rPlayers = Array.isArray(remotePlayer)
    ? remotePlayer
    : (remotePlayer && remotePlayer.active ? [remotePlayer] : ((typeof getActiveRemotePlayers === 'function') ? getActiveRemotePlayers() : []));

  rPlayers.forEach((rp, idx) => {
    if (!rp || !rp.active) return;
    const rpTeam = isFFA
      ? `FFA_REMOTE_${idx + 1}`
      : (rp.team || ((deathmatchState.mode === DEATHMATCH_MODES.TDM) ? enemyTeam : TEAMS.ORANGE));
    rp.team = rpTeam;
    pList.push({
      id: rp.peerId || `remotePlayer_${rp.slotIndex || (idx + 1)}`,
      name: rp.name || `OPERATOR [P${(rp.slotIndex || idx) + 1}]`,
      isPlayer: false,
      team: rpTeam,
      kills: 0,
      deaths: 0,
      ref: rp
    });
  });

  deathmatchState.participants = pList;
  updateLeaderboard();

  // Wizualny komunikat taktyczny przy starcie fazy odliczania
  triggerCombatFeedBanner('SYSTEM', 'PRZYGOTOWAC SIE // ODLICZANIE 3S');
}

/**
 * Dynamiczne odświeżenie listy uczestników bez resetu zegara meczu (np. przy zmianie liczby botów przez Hosta)
 */
export function refreshDeathmatchParticipants(player, botOrBots, remotePlayer) {
  if (!deathmatchState.active) return;
  const isFFA = (deathmatchState.mode === DEATHMATCH_MODES.FFA);
  if (player) {
    player.team = isFFA ? 'FFA_PLAYER' : deathmatchState.playerTeam;
  }
  const botList = Array.isArray(botOrBots) ? botOrBots : (botOrBots ? [botOrBots] : []);
  const enemyTeam = (deathmatchState.playerTeam === TEAMS.CYAN ? TEAMS.ORANGE : TEAMS.CYAN);

  botList.forEach((b, idx) => {
    if (!b) return;
    if (!isFFA) {
      if (remotePlayer && remotePlayer.active) {
        const mpBotTeams = getMpBotTeamsList();
        b.team = (mpBotTeams && mpBotTeams[idx]) ? mpBotTeams[idx] : (b.team || enemyTeam);
      } else {
        let isAlly = false;
        if (botList.length === 3 && idx === 0) isAlly = true;
        else if (botList.length >= 4 && idx < Math.floor(botList.length / 2)) isAlly = true;
        b.team = isAlly ? deathmatchState.playerTeam : enemyTeam;
      }
    } else {
      b.team = `FFA_BOT_${idx + 1}`;
    }
  });

  balanceBotClasses(player, botList, deathmatchState.mode);

  const prevParticipants = deathmatchState.participants || [];
  const getPrev = (ref, id) => prevParticipants.find(p => p.ref === ref || p.id === id);

  const pList = [];
  if (player) {
    const prev = getPrev(player, 'player');
    pList.push({
      id: 'player',
      name: 'OPERATOR [TY]',
      isPlayer: true,
      team: player.team,
      kills: prev ? prev.kills : 0,
      deaths: prev ? prev.deaths : 0,
      ref: player
    });
  }

  botList.forEach((b, idx) => {
    if (!b || !b.active) return;
    const bId = b.id || `bot_${idx + 1}`;
    const prev = getPrev(b, bId);
    pList.push({
      id: bId,
      name: `${b.name || 'SGT. STRIKER'} [AI]`,
      isPlayer: false,
      team: b.team,
      kills: prev ? prev.kills : 0,
      deaths: prev ? prev.deaths : 0,
      ref: b
    });
  });

  const rPlayers = Array.isArray(remotePlayer)
    ? remotePlayer
    : (remotePlayer && remotePlayer.active ? [remotePlayer] : ((typeof getActiveRemotePlayers === 'function') ? getActiveRemotePlayers() : []));

  rPlayers.forEach((rp, idx) => {
    if (!rp || !rp.active) return;
    const rpTeam = isFFA ? `FFA_REMOTE_${idx + 1}` : (rp.team || ((deathmatchState.mode === DEATHMATCH_MODES.TDM) ? enemyTeam : TEAMS.ORANGE));
    rp.team = rpTeam;
    const pId = rp.peerId || `remotePlayer_${rp.slotIndex || (idx + 1)}`;
    const prev = getPrev(rp, pId);
    pList.push({
      id: pId,
      name: rp.name || `OPERATOR [P${(rp.slotIndex || idx) + 1}]`,
      isPlayer: false,
      team: rpTeam,
      kills: prev ? prev.kills : 0,
      deaths: prev ? prev.deaths : 0,
      ref: rp
    });
  });

  deathmatchState.participants = pList;
  updateLeaderboard();
}

/**
 * Aktualizacja rankingu na żywo
 */
export function updateLeaderboard() {
  const list = [...deathmatchState.participants];
  const isA5 = (typeof window !== 'undefined' && (window.activeArenaId === 'ARENA_5' || window.activeArenaId === 'arena-5'));

  if (isA5) {
    // Arena 5: Survival Deathmatch – wygrywa ten, kto najmniej razy zginie!
    list.sort((a, b) => {
      if (a.deaths !== b.deaths) return a.deaths - b.deaths; // Mniej śmierci = wyższa pozycja!
      return b.kills - a.kills; // Więcej fragów przy remisie w zgonach
    });
  } else {
    list.sort((a, b) => {
      if (b.kills !== a.kills) return b.kills - a.kills;
      return a.deaths - b.deaths; // Mniej śmierci przy remisie
    });
  }
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
        // Po zakończeniu prezentacji wyników, powrót do lobby
        if (typeof window !== 'undefined' && typeof window.concludeMatchAndReturnToLobby === 'function') {
          window.concludeMatchAndReturnToLobby();
        } else {
          resetDeathmatchState();
        }
      }
    }
    return;
  }

  // 0. Obsługa odliczania przedmeczowego (Lockdown 3.. 2.. 1.. WALKA!)
  const stepTime = (typeof dt === 'number' && dt > 0 && dt < 1) ? dt : (1 / 60);

  if (deathmatchState.matchPhase === DEATHMATCH_PHASES.COUNTDOWN) {
    deathmatchState.countdownTimer = Math.max(0, deathmatchState.countdownTimer - stepTime);

    // Dźwięki piknięć dla sekund 3, 2, 1
    const secFloor = Math.min(3, Math.max(1, Math.ceil(deathmatchState.countdownTimer)));
    if (secFloor >= 1 && secFloor <= 3 && !deathmatchState.countdownBeeps[secFloor]) {
      deathmatchState.countdownBeeps[secFloor] = true;
      try {
        playSound('ui_countdown_tick', { pitch: 0.95 + (3 - secFloor) * 0.15 });
      } catch (_) {}
    }

    // Zamrożenie postaci w pozycji gotowości
    if (player) {
      player.vx = 0;
      player.airVx = 0;
      player.isShooting = false;
    }
    const bList = Array.isArray(botOrBots) ? botOrBots : (botOrBots ? [botOrBots] : []);
    for (let i = 0; i < bList.length; i++) {
      const b = bList[i];
      if (b && b.active) {
        b.vx = 0;
        b.airVx = 0;
        b.isShooting = false;
      }
    }

    if (deathmatchState.countdownTimer <= 0) {
      deathmatchState.countdownTimer = 0;
      deathmatchState.matchPhase = DEATHMATCH_PHASES.ACTIVE;
      deathmatchState.fightBannerTimer = 1.2;
      if (!deathmatchState.countdownBeeps[0]) {
        deathmatchState.countdownBeeps[0] = true;
        try {
          playSound('ui_countdown_go');
        } catch (_) {}
      }
      const condText = (deathmatchState.winCondition === 'FRAGS')
        ? `LIMIT: ${deathmatchState.fragLimit} FRAGOW`
        : (deathmatchState.winCondition === 'TIME')
          ? `LIMIT: ${Math.round(deathmatchState.matchDuration / 60)} MINUT`
          : `CEL: ${deathmatchState.fragLimit} FRAGOW / ${Math.round(deathmatchState.matchDuration / 60)} MIN`;
      triggerCombatFeedBanner('SYSTEM', `MISJA ROZPOCZETA // ${condText}`);
    }

    updateCombatFeed(stepTime);
    return;
  }

  // Wygaszanie banera "WALKA!" po rozpoczęciu meczu
  if (deathmatchState.fightBannerTimer > 0) {
    deathmatchState.fightBannerTimer = Math.max(0, deathmatchState.fightBannerTimer - stepTime);
  }

  // 1. Odliczanie czasu bitwy (lub zliczanie upływu czasu)
  deathmatchState.elapsedTime = (deathmatchState.elapsedTime || 0) + stepTime;

  const winCond = deathmatchState.winCondition || 'BOTH';
  const hasTimeLimit = (winCond === 'BOTH' || winCond === 'TIME');

  if (hasTimeLimit) {
    deathmatchState.timeRemaining = Math.max(0, deathmatchState.timeRemaining - stepTime);
  }
  updateCombatFeed(stepTime);

  // Synchronizacja stanu deathmatch przez Hosta (zegar, wynik drużyn)
  const sendDm = (typeof window !== 'undefined' && window.sendDeathmatchSync) ? window.sendDeathmatchSync : null;
  if (typeof window !== 'undefined' && typeof window.isMatchHost === 'function' && window.isMatchHost() &&
      typeof window.isMatchActive === 'function' && window.isMatchActive() && typeof sendDm === 'function') {
    _dmSyncTimer = (_dmSyncTimer || 0) + stepTime;
    if (_dmSyncTimer >= 1.0) {
      _dmSyncTimer = 0;
      sendDm(deathmatchState);
    }
  }

  // 2. Obsługa faktycznych eliminacji w walce
  const botList = Array.isArray(botOrBots) ? botOrBots : (botOrBots ? [botOrBots] : []);
  const combatants = [];
  if (player) combatants.push(player);
  for (const b of botList) {
    if (b && b.active) combatants.push(b);
  }
  const rPlayers = Array.isArray(remotePlayer)
    ? remotePlayer
    : (remotePlayer && remotePlayer.active ? [remotePlayer] : ((typeof getActiveRemotePlayers === 'function') ? getActiveRemotePlayers() : []));
  for (const rp of rPlayers) {
    if (rp && rp.active) combatants.push(rp);
  }

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

        const victimName = c.name || victimData?.name || 'PRZECIWNIK';
        const victimTeam = c.team || victimData?.team || null;

        // Sprawdzenie, czy ofiara została FAKTYCZNIE zabita przez przeciwnika
        const killerRef = c.killer || c.lastAttacker;
        const isHazardKiller = typeof killerRef === 'string' || (killerRef && (killerRef.isHazard || isHazardName(killerRef.name || killerRef)));
        const isSelfKill = !killerRef || (killerRef === c) || (killerRef && killerRef.isSelf === true) || isHazardKiller;
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

          const killerName = (typeof killerRef === 'string') ? killerRef : (killerRef?.name || killerData?.name || 'OPERATOR');
          const killerTeam = killerRef?.team || killerData?.team || null;

          if (killerRef === player) {
            recordKill();
            registerKillstreakKill();
            registerCalloutKill(player, c, {
              bulletId: c.killerBulletId || null,
              victimId: c.peerId || c.id || null,
              victimName: victimName,
              isZombie: Boolean(c.isZombie),
              x: c.x,
              y: c.y - 52
            });
            triggerCombatFeedEvent({
              type: 'PLAYER_KILL',
              killer: player,
              victim: c,
              victimName: victimName,
              victimTeam: victimTeam
            });
          } else if (c === player) {
            recordDeath();
            resetKillstreak();
            if (!player._calloutDeathRecorded) {
              player._calloutDeathRecorded = true;
              onPlayerDeathCallout(killerRef, {
                killerName: killerName,
                killerPeerId: killerRef?.peerId || null,
                killerId: killerRef?.id || null,
                isZombie: Boolean(killerRef?.isZombie)
              });
            }
            triggerCombatFeedEvent({
              type: 'PLAYER_DEATH',
              killer: killerRef,
              killerName: killerName,
              killerTeam: killerTeam,
              victim: player
            });
          } else {
            // Zabiła jednostka trzecia (Bot vs Bot, RemotePlayer vs Bot itp.)
            triggerCombatFeedEvent({
              type: 'COMBAT_KILL',
              killer: killerRef,
              killerName: killerName,
              killerTeam: killerTeam,
              victim: c,
              victimName: victimName,
              victimTeam: victimTeam
            });
          }
        } else {
          // Zgon środowiskowy, kwas, przepaść lub samobójstwo
          const hazardName = (typeof c.killer === 'string')
            ? c.killer
            : (c.killer?.name || (c.acidDeath?.active || c.isAcidDying ? 'TOKSYCZNY KWAS' : (c.killer?.cause || 'ŚRODOWISKO')));

          if (c === player) {
            recordDeath();
            resetKillstreak();
            if (!player._calloutDeathRecorded) {
              player._calloutDeathRecorded = true;
              onPlayerDeathCallout(null, { isHazard: true, killerName: hazardName });
            }
            triggerCombatFeedEvent({
              type: 'PLAYER_DEATH',
              victim: player,
              cause: hazardName
            });
          } else {
            triggerCombatFeedEvent({
              type: 'COMBAT_HAZARD',
              victim: c,
              victimName: victimName,
              victimTeam: victimTeam,
              cause: hazardName
            });
          }
        }

        updateLeaderboard();

        // 2.5. Sprawdzenie warunku zwycięstwa przez limit fragów (Frag Limit)
        const fragLimit = deathmatchState.fragLimit || 25;
        const checksFrags = (winCond === 'BOTH' || winCond === 'FRAGS');
        if (checksFrags && fragLimit > 0) {
          if (deathmatchState.mode === DEATHMATCH_MODES.TDM) {
            const cyanKills = deathmatchState.teamScores[TEAMS.CYAN] || 0;
            const orangeKills = deathmatchState.teamScores[TEAMS.ORANGE] || 0;
            if (cyanKills >= fragLimit || orangeKills >= fragLimit) {
              deathmatchState.winningTeam = (cyanKills >= fragLimit) ? TEAMS.CYAN : TEAMS.ORANGE;
              finishDeathmatch('FRAG_LIMIT');
              return;
            }
          } else {
            // FFA: wygrywa uczestnik, który jako pierwszy osiągnie pułap fragów
            const leader = deathmatchState.leaderboard[0];
            if (leader && leader.kills >= fragLimit) {
              deathmatchState.winningPlayer = leader;
              finishDeathmatch('FRAG_LIMIT');
              return;
            }
          }
        }
      }
    } else {
      c._dmDeathRecorded = false;
      c.killer = null;
      c.killerBulletId = null;
      if (c === player) c._calloutDeathRecorded = false;
    }
  }

  // 3. Synchronizacja wyniku z globalnym arenaScore (do HUD-u)
  if (arenaScore) {
    arenaScore.cyan = deathmatchState.teamScores[TEAMS.CYAN];
    arenaScore.orange = deathmatchState.teamScores[TEAMS.ORANGE];
  }

  // 4. Sprawdzenie warunku zakończenia bitwy (Limit czasu)
  if (hasTimeLimit && deathmatchState.timeRemaining <= 0) {
    finishDeathmatch('TIME_LIMIT');
  }
}

/**
 * Finał meczu: wyłonienie zwycięzców, przyznanie nagród XP i uruchomienie ekranu podium
 */
export function finishDeathmatch(reason = 'TIME_LIMIT') {
  if (deathmatchState.matchEnded) return;

  deathmatchState.matchEnded = true;
  deathmatchState.endReason = reason;
  deathmatchState.endCelebrationTimer = deathmatchState.maxEndCelebrationTimer;
  updateLeaderboard();

  // Ustalenie zwycięzcy
  if (!deathmatchState.winningTeam && deathmatchState.mode === DEATHMATCH_MODES.TDM) {
    const cScore = deathmatchState.teamScores[TEAMS.CYAN] || 0;
    const oScore = deathmatchState.teamScores[TEAMS.ORANGE] || 0;
    if (cScore > oScore) deathmatchState.winningTeam = TEAMS.CYAN;
    else if (oScore > cScore) deathmatchState.winningTeam = TEAMS.ORANGE;
    else deathmatchState.winningTeam = 'DRAW';
  }
  if (!deathmatchState.winningPlayer && deathmatchState.leaderboard.length > 0) {
    deathmatchState.winningPlayer = deathmatchState.leaderboard[0];
  }

  const sendDm = (typeof window !== 'undefined' && window.sendDeathmatchSync) ? window.sendDeathmatchSync : null;
  if (typeof window !== 'undefined' && typeof window.isMatchHost === 'function' && window.isMatchHost() &&
      typeof window.isMatchActive === 'function' && window.isMatchActive() && typeof sendDm === 'function') {
    sendDm(deathmatchState);
  }

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
