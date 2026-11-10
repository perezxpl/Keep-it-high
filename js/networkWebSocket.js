// =============================================================================
// JS/NETWORKWEBSOCKET.JS - KLIENT DEDYKOWANEGO SERWERA WEBSOCKET (DO 6 GRACZY)
// Automatyczny matchmaking, laczenie do pokoi z limitem 6 graczy i synchronizacja
// Standard: Zero emojis, modularyzacja ES, pelna integracja z silnikiem gry
// =============================================================================

import {
  getOrCreateRemotePlayer,
  removeRemotePlayer,
  clearAllRemotePlayers,
  applyTeamVisualsToRemotePlayer,
  MAX_MATCH_PLAYERS
} from './networkPlayers.js';
import { player, setPlayerClass } from './player.js';
import { WEAPONS, shootWeapon } from './weapons.js';
import { switchArena, activeArenaId } from './obstacles.js';
import { GROUND_Y } from './world.js';
import { deathmatchState, refreshDeathmatchParticipants, TEAMS } from './deathmatch/index.js';
import { triggerCombatFeedBanner, triggerCombatFeedEvent } from './ui/combatFeed.js';
import { addChatMessageToUI, updatePingUI } from './networkUI.js';
import { spawnThrownTomahawk, spawnAeroSuperGrenade } from './projectiles.js';

export const wsState = {
  socket: null,
  connected: false,
  status: 'disconnected', // 'disconnected', 'connecting', 'searching', 'matched', 'in_game'
  roomId: null,
  slotIndex: 0,
  team: 'CYAN',
  isHost: false,
  playersCount: 1,
  maxPlayers: MAX_MATCH_PLAYERS,
  ping: 0,
  lastPingSent: 0,
  serverUrl: null
};

if (typeof window !== 'undefined') {
  window.wsState = wsState;
}

export const DEFAULT_PRODUCTION_SERVER_URL = 'wss://modern-military.onrender.com';

/**
 * Zwraca domyslny adres serwera dedykowanego z fallbackiem na zmienna globalna lub serwer produkcyjny
 */
export function getDefaultServerUrl() {
  if (typeof window !== 'undefined' && window.KIH_SERVER_URL) {
    return window.KIH_SERVER_URL;
  }
  if (typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.USE_LOCAL_WS) {
    return 'ws://localhost:3000';
  }
  return DEFAULT_PRODUCTION_SERVER_URL;
}

/**
 * Rozpoczyna automatyczny matchmaking na serwerze dedykowanym (max 6 graczy na mecz)
 * @param {string} playerName - Nazwa lokalnego gracza
 * @param {Object} [options] - Dodatkowe opcje (preferowana arena, tryb)
 */
export function startDedicatedMatchmaking(playerName, options = {}) {
  const url = options.serverUrl || getDefaultServerUrl();
  wsState.serverUrl = url;
  wsState.status = 'connecting';

  if (wsState.socket) {
    try { wsState.socket.close(); } catch (_) {}
    wsState.socket = null;
  }

  try {
    const ws = new WebSocket(url);
    wsState.socket = ws;

    ws.onopen = () => {
      wsState.connected = true;
      wsState.status = 'searching';

      // Wyslanie zapytania o wolny mecz (max 6 osob)
      ws.send(JSON.stringify({
        type: 'MATCHMAKE',
        name: playerName || player.name || 'Operator',
        preferredArena: options.arenaId || activeArenaId || 'arena-1',
        mode: options.mode || 'TEAMS',
        classId: player.currentClass?.id || 'STRIKER',
        customVisuals: player.customVisuals || null
      }));

      startWsPingLoop();
    };

    ws.onmessage = (event) => {
      handleServerMessage(event.data);
    };

    ws.onclose = () => {
      wsState.connected = false;
      wsState.status = 'disconnected';
      wsState.roomId = null;
    };

    ws.onerror = (err) => {
      console.warn('[WS CLIENT] Blad polaczenia z serwerem dedykowanym:', err);
      wsState.status = 'disconnected';
    };
  } catch (e) {
    console.warn('[WS CLIENT] Nie udalo sie zainicjalizowac WebSocket:', e);
    wsState.status = 'disconnected';
  }
}

/**
 * Anuluje biezace poszukiwanie meczu i rozlacza sie z serwerem
 */
export function cancelDedicatedMatchmaking() {
  if (wsState.socket && wsState.connected) {
    try {
      wsState.socket.send(JSON.stringify({ type: 'LEAVE_MATCH' }));
      wsState.socket.close();
    } catch (_) {}
  }
  wsState.connected = false;
  wsState.status = 'disconnected';
  wsState.roomId = null;
  wsState.playersCount = 1;
  clearAllRemotePlayers();

  const mmBtn = document.getElementById('mp-matchmake-btn');
  if (mmBtn) {
    mmBtn.textContent = 'SZUKAJ MECZU (MATCHMAKING)';
    mmBtn.classList.remove('mp-btn-searching');
  }
  const mmStatus = document.getElementById('mp-matchmake-status');
  if (mmStatus) {
    mmStatus.style.display = 'none';
  }
  const briefingMmBtn = document.getElementById('briefing-matchmake-btn');
  if (briefingMmBtn) {
    briefingMmBtn.textContent = '▶ SZUKAJ MECZU ONLINE (MATCHMAKING)';
  }
  const briefingStatus = document.getElementById('briefing-matchmake-status');
  if (briefingStatus) {
    briefingStatus.textContent = 'Gotowy do gry na serwerze dedykowanym';
  }
  const launchBtn = document.getElementById('btn-arena-launch');
  const btnText = launchBtn ? launchBtn.querySelector('.btn-text') : null;
  if (btnText && typeof window !== 'undefined' && window.uiManager && window.uiManager.currentBriefingMode === 'multi') {
    btnText.textContent = '▶ SZUKAJ MECZU (GRAJ ONLINE)';
  }
}

/**
 * Wysyla pakiet do serwera dedykowanego
 * @param {Object} packet
 */
export function sendWsPacket(packet) {
  if (wsState.socket && wsState.socket.readyState === WebSocket.OPEN) {
    try {
      wsState.socket.send(JSON.stringify(packet));
    } catch (_) {}
  }
}

/**
 * Glowny router komunikatow przychodzacych z dedykowanego serwera
 */
function handleServerMessage(rawData) {
  let msg;
  try {
    msg = JSON.parse(rawData);
  } catch (_) {
    return;
  }

  if (!msg || !msg.type) return;

  switch (msg.type) {
    // 1. DOLACZONO DO MECZU (MATCH JOINED)
    case 'MATCH_JOINED': {
      wsState.status = 'matched';
      wsState.roomId = msg.roomId;
      wsState.slotIndex = msg.slotIndex;
      wsState.team = msg.team;
      wsState.isHost = !!msg.isHost;
      wsState.playersCount = msg.playersCount || 1;
      wsState.maxPlayers = msg.maxPlayers || MAX_MATCH_PLAYERS;

      // Przypisanie wlasnej druzyny
      if (player) {
        player.team = msg.team;
      }

      // Przypisanie areny wyznaczonej przez serwer
      if (msg.arenaId && msg.arenaId !== activeArenaId) {
        switchArena(msg.arenaId, player);
      }

      // Rejestracja istniejacych graczy w pokoju
      if (Array.isArray(msg.players)) {
        for (const p of msg.players) {
          if (p.id !== wsState.socketId && p.slotIndex !== wsState.slotIndex) {
            getOrCreateRemotePlayer(p.id, p.slotIndex, p.name, p.team);
          }
        }
      }

      // Synchronizacja liczby botow wyznaczonej przez serwer (domyslnie 0 w 1v1 ze znajomym)
      const matchBotCount = (typeof msg.botCount === 'number') ? msg.botCount : 0;
      if (typeof window !== 'undefined') {
        if (typeof window.setBotCount === 'function') {
          window.setBotCount(matchBotCount, { isRemote: true });
        }
        if (typeof window.setBotEnabled === 'function') {
          window.setBotEnabled(matchBotCount > 0);
        }
      }

      refreshDeathmatchParticipants(player, [], Array.from(window.remotePlayers?.values() || []));
      triggerCombatFeedBanner('SYSTEM', `DOŁĄCZONO DO BITWY // POKÓJ: ${msg.roomId} [${wsState.playersCount}/${wsState.maxPlayers}]`);

      // Aktualizacja przycisków i statusów
      const mmBtn = document.getElementById('mp-matchmake-btn');
      if (mmBtn) {
        mmBtn.textContent = `▶ WEJDŹ DO GRY [${wsState.playersCount}/${wsState.maxPlayers}]`;
        mmBtn.classList.remove('mp-btn-searching');
      }
      const mmStatus = document.getElementById('mp-matchmake-status');
      if (mmStatus) {
        mmStatus.style.display = 'block';
        mmStatus.textContent = `Dołączono do pokoju ${msg.roomId} [${wsState.playersCount}/${wsState.maxPlayers}]. Wchodzenie do bitwy...`;
      }
      const briefingMmBtn = document.getElementById('briefing-matchmake-btn');
      if (briefingMmBtn) {
        briefingMmBtn.textContent = `▶ WEJDŹ DO BITWY [${wsState.playersCount}/${wsState.maxPlayers}]`;
      }
      const briefingStatus = document.getElementById('briefing-matchmake-status');
      if (briefingStatus) {
        briefingStatus.textContent = `Mecz znaleziony! Pokój: ${msg.roomId} [${wsState.playersCount}/${wsState.maxPlayers} graczy]. Start...`;
      }
      const launchBtn = document.getElementById('btn-arena-launch');
      const btnText = launchBtn ? launchBtn.querySelector('.btn-text') : null;
      if (btnText) {
        btnText.textContent = `▶ WEJDŹ DO GRY [${wsState.playersCount}/${wsState.maxPlayers}]`;
      }

      // Automatyczne wejście na mapę do gry
      setTimeout(() => {
        if (wsState.status === 'matched') {
          const modal = document.getElementById('mp-modal');
          if (modal && !modal.classList.contains('mp-modal-hidden')) {
            modal.classList.add('mp-modal-hidden');
          }
          if (typeof window !== 'undefined' && typeof window.setGameState === 'function') {
            window.setGameState('PLAYING');
          }
        }
      }, 900);
      break;
    }

    // 2. NOWY GRACZ DOLACZYL DO POKOJU (PLAYER JOINED)
    case 'PLAYER_JOINED': {
      if (!msg.player) return;
      const rp = getOrCreateRemotePlayer(msg.player.id, msg.player.slotIndex, msg.player.name, msg.player.team);
      wsState.playersCount = msg.playersCount || (wsState.playersCount + 1);

      refreshDeathmatchParticipants(player, [], Array.from(window.remotePlayers?.values() || []));
      triggerCombatFeedBanner('SYSTEM', `${msg.player.name} DOLACZYL DO BITWY [${wsState.playersCount}/${wsState.maxPlayers}]`);

      // Jesli jestesmy hostem, wyslij natychmiast synchronizacje specyficzna dla areny do nowego gracza
      if (wsState.isHost && typeof window !== 'undefined') {
        if (typeof window.serializeArena5Grid === 'function' && typeof window.broadcastNetworkPacket === 'function') {
          const snapshot = window.serializeArena5Grid();
          if (snapshot) window.broadcastNetworkPacket({ type: 'a5_grid_sync', snapshot });
        }
        if (typeof window.serializeArena3State === 'function' && typeof window.broadcastNetworkPacket === 'function') {
          const snapshot = window.serializeArena3State();
          if (snapshot) window.broadcastNetworkPacket({ type: 'a3_sync', snapshot });
        }
        if (typeof window.sendAcidSurgeSync === 'function' && typeof window.ACID_SURGE_SYSTEM !== 'undefined') {
          window.sendAcidSurgeSync(window.ACID_SURGE_SYSTEM);
        }
        if (typeof window.sendDeathmatchSync === 'function' && typeof window.deathmatchState !== 'undefined') {
          window.sendDeathmatchSync(window.deathmatchState);
        }
      }
      break;
    }

    // 3. GRACZ OPUSCIL POKOJ (PLAYER LEFT)
    case 'PLAYER_LEFT': {
      removeRemotePlayer(msg.senderId);
      wsState.playersCount = msg.playersCount || Math.max(1, wsState.playersCount - 1);
      refreshDeathmatchParticipants(player, [], Array.from(window.remotePlayers?.values() || []));
      triggerCombatFeedBanner('SYSTEM', `GRACZ OPUSCIL GRE [${wsState.playersCount}/${wsState.maxPlayers}]`);
      break;
    }

    // 4. SYNCHRONIZACJA POZYCJI I STANU GRACZA
    case 'p_state': {
      const pId = msg.senderId;
      if (!pId) return;
      const rp = getOrCreateRemotePlayer(pId, msg.slotIndex, msg.name, msg.team);
      if (!rp) return;

      rp.active = true;
      rp.targetX = msg.x;
      rp.targetY = (typeof msg.y === 'number') ? msg.y : ((msg.relY !== undefined) ? (GROUND_Y - msg.relY) : msg.y);
      rp.groundY = GROUND_Y;
      rp.currentGroundY = GROUND_Y;
      rp.vx = msg.vx;
      rp.vy = msg.vy;
      rp.facing = msg.facing;
      rp.aimX = msg.aimX;
      rp.aimY = (msg.relAimY !== undefined) ? (GROUND_Y - msg.relAimY) : msg.aimY;
      rp.aimAngle = msg.aimAngle;
      rp.isJumping = !!msg.isJumping;
      rp.isSliding = !!msg.isSliding;
      rp.isRunning = !!msg.isRunning;
      rp.hp = msg.hp;
      rp.maxHp = msg.maxHp || 100;
      rp.isDead = !!msg.isDead;
      rp.isJetpacking = !!msg.isJetpacking;
      rp.jetFuel = msg.jetFuel;

      const wepId = msg.currentWeaponId || msg.weaponId;
      if (wepId && WEAPONS[wepId]) {
        rp.currentWeapon = WEAPONS[wepId];
      }
      break;
    }

    // 5. STRZAL Z BRONI PRZEZ INNEGO GRACZA
    case 'shoot_event': {
      const rp = window.remotePlayers?.get(msg.senderId);
      if (rp && rp.active) {
        shootWeapon(rp, msg.aimAngle, msg.weaponId, [player]);
      }
      break;
    }

    // 6. RZUT GRANATEM
    case 'grenade_throw': {
      spawnAeroSuperGrenade(msg.targetX, msg.targetY, msg.power, msg.originX, msg.originY, msg.fuse);
      break;
    }

    // 7. RZUT TOPOREM TOMAHAWK
    case 'tomahawk_throw': {
      const rp = window.remotePlayers?.get(msg.senderId);
      spawnThrownTomahawk(msg.targetX, msg.targetY, msg.power, msg.originX, msg.originY, rp);
      break;
    }

    // 8. PONG (PING CHECK)
    case 'pong': {
      if (msg.time) {
        wsState.ping = Math.max(1, Math.round(performance.now() - msg.time));
        updatePingUI(wsState.ping);
      }
      break;
    }

    // 9. WIADOMOSC CZATU
    case 'chat_message': {
      addChatMessageToUI(msg.sender, msg.text, msg.senderSlot === wsState.slotIndex);
      break;
    }

    // 10. POZOSTALE PAKIETY ROZGRYWKI (BOTY, PILKA, KLOCKI ARENY 5, OBRAZENIA, ZGONY)
    default: {
      if (typeof window !== 'undefined' && typeof window.handleNetworkData === 'function') {
        window.handleNetworkData(msg, msg.senderId || null);
      }
      break;
    }
  }
}

let wsPingInterval = null;
function startWsPingLoop() {
  if (wsPingInterval) clearInterval(wsPingInterval);
  wsPingInterval = setInterval(() => {
    if (wsState.socket && wsState.socket.readyState === WebSocket.OPEN) {
      wsState.lastPingSent = performance.now();
      wsState.socket.send(JSON.stringify({ type: 'ping', time: wsState.lastPingSent }));
    } else {
      clearInterval(wsPingInterval);
      wsPingInterval = null;
    }
  }, 2000);
}
