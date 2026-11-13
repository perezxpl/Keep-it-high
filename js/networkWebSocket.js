// =============================================================================
// JS/NETWORKWEBSOCKET.JS - KLIENT DEDYKOWANEGO SERWERA WEBSOCKET (DO 6 GRACZY)
// Automatyczny matchmaking, laczenie do pokoi z limitem 6 graczy i synchronizacja
// Standard: Zero emojis, modularyzacja ES, pelna integracja z silnikiem gry
// =============================================================================

import {
  getOrCreateRemotePlayer,
  removeRemotePlayer,
  clearAllRemotePlayers,
  MAX_MATCH_PLAYERS
} from './networkPlayers.js';
import { player } from './player.js';
import { switchArena, activeArenaId } from './obstacles.js';
import { refreshDeathmatchParticipants } from './deathmatch/index.js';
import { triggerCombatFeedBanner } from './ui/combatFeed.js';
import { addChatMessageToUI, updatePingUI } from './networkUI.js';
import { playUiClick } from './audio/index.js';

export const wsState = {
  socket: null,
  socketId: null,
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
  serverUrl: null,
  arenaId: null
};

if (typeof window !== 'undefined') {
  window.wsState = wsState;
}

export const DEFAULT_PRODUCTION_SERVER_URL = 'wss://modern-military.onrender.com';

let wsWakeupTimeout = null;
let wsConnectionTimeout = null;
let wsLaunchTimeout = null;
let wsAbortController = null;

function clearWsTimers() {
  if (wsWakeupTimeout) {
    clearTimeout(wsWakeupTimeout);
    wsWakeupTimeout = null;
  }
  if (wsConnectionTimeout) {
    clearTimeout(wsConnectionTimeout);
    wsConnectionTimeout = null;
  }
  if (wsLaunchTimeout) {
    clearTimeout(wsLaunchTimeout);
    wsLaunchTimeout = null;
  }
  if (wsAbortController) {
    try { wsAbortController.abort(); } catch (_) {}
    wsAbortController = null;
  }
}

function updateBriefingServerIndicator(status) {
  const dot = document.getElementById('briefing-mp-status-dot');
  const txt = document.getElementById('briefing-mp-status-text');
  if (!dot && !txt) return;

  if (status === 'connecting') {
    if (dot) {
      dot.className = 'mp-status-dot';
      dot.style.background = '#eab308';
      dot.style.boxShadow = '0 0 6px #eab308';
    }
    if (txt) txt.textContent = 'SERWER: NAWIĄZYWANIE POŁĄCZENIA...';
  } else if (status === 'online') {
    if (dot) {
      dot.className = 'mp-status-dot dot-green';
      dot.style.background = '#22c55e';
      dot.style.boxShadow = '0 0 6px #22c55e';
    }
    if (txt) txt.textContent = 'SERWER DEDYKOWANY: ONLINE (FRANKFURT)';
  } else if (status === 'error') {
    if (dot) {
      dot.className = 'mp-status-dot';
      dot.style.background = '#ef4444';
      dot.style.boxShadow = '0 0 6px #ef4444';
    }
    if (txt) txt.textContent = 'SERWER: BŁĄD / UŚPIONY (RENDER)';
  } else {
    if (dot) {
      dot.className = 'mp-status-dot dot-green';
      dot.style.background = '#22c55e';
      dot.style.boxShadow = '0 0 6px #22c55e';
    }
    if (txt) txt.textContent = 'SERWER DEDYKOWANY: GOTOWY (FRANKFURT)';
  }
}

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
 * Obsługuje błąd lub zerwanie połączenia z serwerem i aktualizuje interfejs
 */
export function handleWsConnectionFailure(errorMessage) {
  clearWsTimers();

  wsState.connected = false;
  wsState.socketId = null;
  wsState.status = 'disconnected';
  wsState.roomId = null;
  wsState.playersCount = 1;

  if (wsState.socket) {
    try { wsState.socket.close(); } catch (_) {}
    wsState.socket = null;
  }

  updateBriefingServerIndicator('error');

  const briefingStatus = document.getElementById('briefing-matchmake-status');
  if (briefingStatus) {
    briefingStatus.style.color = '#f87171';
    briefingStatus.innerHTML = `<span style="font-weight: 800; color: #f87171;">BŁĄD POŁĄCZENIA:</span> ${errorMessage || 'Serwer w chmurze jest uśpiony lub niedostępny.'}<br><span style="color: #94a3b8; font-size: 10px;">Wskazówka: Możesz zagrać natychmiast ze znajomym przez Kod Pokoju P2P (poniżej) lub spróbować ponownie.</span>`;
  }

  const briefingMmBtn = document.getElementById('briefing-matchmake-btn');
  if (briefingMmBtn) {
    briefingMmBtn.textContent = '▶ SPRÓBUJ PONOWNIE';
  }

  const launchBtn = document.getElementById('btn-arena-launch');
  const btnText = launchBtn ? launchBtn.querySelector('.btn-text') : null;
  if (btnText && typeof window !== 'undefined' && window.uiManager && window.uiManager.currentBriefingMode === 'multi') {
    btnText.textContent = '▶ SPRÓBUJ PONOWNIE';
  }

  const mmBtn = document.getElementById('mp-matchmake-btn');
  if (mmBtn) {
    mmBtn.textContent = 'SPRÓBUJ PONOWNIE';
    mmBtn.classList.remove('mp-btn-searching');
  }

  const mmStatus = document.getElementById('mp-matchmake-status');
  if (mmStatus) {
    mmStatus.style.display = 'block';
    mmStatus.style.color = '#f87171';
    mmStatus.textContent = errorMessage || 'Błąd połączenia z serwerem.';
  }

  // Automatyczne rozwinięcie sekcji P2P, aby gracze mieli natychmiastową alternatywę
  const p2pDetails = document.getElementById('briefing-p2p-details');
  if (p2pDetails) {
    p2pDetails.open = true;
  }
}

/**
 * Rozpoczyna automatyczny matchmaking na serwerze dedykowanym (max 6 graczy na mecz)
 * @param {string} playerName - Nazwa lokalnego gracza
 * @param {Object} [options] - Dodatkowe opcje (preferowana arena, tryb)
 */
export function startDedicatedMatchmaking(playerName, options = {}) {
  clearWsTimers();

  const url = options.serverUrl || getDefaultServerUrl();
  wsState.serverUrl = url;
  wsState.status = 'connecting';
  wsState.arenaId = options.arenaId || activeArenaId || 'arena-1';

  if (wsState.socket) {
    try { wsState.socket.close(); } catch (_) {}
    wsState.socket = null;
  }

  updateBriefingServerIndicator('connecting');

  // Aktualizacja statusu UI na start
  const briefingStatus = document.getElementById('briefing-matchmake-status');
  if (briefingStatus) {
    briefingStatus.style.color = '#38bdf8';
    briefingStatus.textContent = 'Łączenie z serwerem i szukanie graczy [1/6]...';
  }
  const briefingMmBtn = document.getElementById('briefing-matchmake-btn');
  if (briefingMmBtn) {
    briefingMmBtn.textContent = 'ANULUJ SZUKANIE MECZU...';
  }
  const launchBtn = document.getElementById('btn-arena-launch');
  const btnText = launchBtn ? launchBtn.querySelector('.btn-text') : null;
  if (btnText && typeof window !== 'undefined' && window.uiManager && window.uiManager.currentBriefingMode === 'multi') {
    btnText.textContent = 'SZUKANIE MECZU ONLINE...';
  }

  // 1. HTTP Wake-up ping (Render free tier usypia kontenery - zapytanie HTTP budzi maszynę)
  const httpUrl = url.replace(/^wss:/i, 'https:').replace(/^ws:/i, 'http:');
  try {
    wsAbortController = new AbortController();
    fetch(httpUrl, { method: 'GET', mode: 'cors', cache: 'no-store', signal: wsAbortController.signal })
      .then(res => {
        if (res.ok && wsState.status === 'connecting') {
          const bStatus = document.getElementById('briefing-matchmake-status');
          if (bStatus && wsState.status === 'connecting') {
            bStatus.style.color = '#4ade80';
            bStatus.textContent = 'Serwer w chmurze aktywny! Nawiązywanie połączenia WebSocket...';
          }
        }
      })
      .catch(() => {});
  } catch (_) {}

  // 2. Ostrzeżenie o wybudzaniu z uśpienia po 3.5s
  wsWakeupTimeout = setTimeout(() => {
    if (wsState.status === 'connecting') {
      const bStatus = document.getElementById('briefing-matchmake-status');
      if (bStatus) {
        bStatus.style.color = '#fbbf24';
        bStatus.textContent = 'Wybudzanie serwera w chmurze (Render free tier, ok. 25-35s)... Proszę czekać...';
      }
    }
  }, 3500);

  // 3. Timeout połączenia po 38 sekundach
  wsConnectionTimeout = setTimeout(() => {
    if (wsState.status === 'connecting') {
      handleWsConnectionFailure('Przekroczono czas oczekiwania na serwer w chmurze (38s). Serwer może być przeciążony.');
    }
  }, 38000);

  // 4. Inicjalizacja właściwego gniazda WebSocket
  try {
    const ws = new WebSocket(url);
    wsState.socket = ws;

    ws.onopen = () => {
      clearWsTimers();
      wsState.connected = true;
      wsState.status = 'searching';

      updateBriefingServerIndicator('online');

      const bStatus = document.getElementById('briefing-matchmake-status');
      if (bStatus) {
        bStatus.style.color = '#38bdf8';
        bStatus.textContent = 'Połączono z serwerem! Wyszukiwanie otwartego pokoju...';
      }

      // Wysłanie zapytania o wolny mecz (max 6 osób)
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
      if (wsState.status === 'connecting' || wsState.status === 'searching') {
        handleWsConnectionFailure('Połączenie z serwerem zostało zamknięte przed znalezieniem graczy.');
      } else {
        wsState.connected = false;
        wsState.socketId = null;
        wsState.status = 'disconnected';
        wsState.roomId = null;
        updateBriefingServerIndicator('idle');
      }
    };

    ws.onerror = (err) => {
      console.warn('[WS CLIENT] Błąd połączenia z serwerem dedykowanym:', err);
      if (wsState.status === 'connecting' || wsState.status === 'searching') {
        handleWsConnectionFailure('Nie udało się połączyć z serwerem w chmurze (serwer uśpiony lub offline).');
      }
    };
  } catch (e) {
    console.warn('[WS CLIENT] Nie udało się zainicjalizować WebSocket:', e);
    handleWsConnectionFailure('Błąd inicjalizacji klienta WebSocket.');
  }
}

/**
 * Anuluje biezace poszukiwanie meczu i rozlacza sie z serwerem
 */
export function cancelDedicatedMatchmaking() {
  clearWsTimers();

  if (wsState.socket && wsState.connected) {
    try {
      wsState.socket.send(JSON.stringify({ type: 'LEAVE_MATCH' }));
      wsState.socket.close();
    } catch (_) {}
  }
  wsState.connected = false;
  wsState.socketId = null;
  wsState.status = 'disconnected';
  wsState.roomId = null;
  wsState.playersCount = 1;
  clearAllRemotePlayers();

  updateBriefingServerIndicator('idle');

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
    briefingMmBtn.textContent = '▶ SZUKAJ MECZU (GRAJ ONLINE)';
  }
  const briefingStatus = document.getElementById('briefing-matchmake-status');
  if (briefingStatus) {
    briefingStatus.style.color = '#38bdf8';
    briefingStatus.textContent = 'Gotowy do połączenia z serwerem modern-military.onrender.com';
  }
  const launchBtn = document.getElementById('btn-arena-launch');
  const btnText = launchBtn ? launchBtn.querySelector('.btn-text') : null;
  if (btnText && typeof window !== 'undefined' && window.uiManager && window.uiManager.currentBriefingMode === 'multi') {
    btnText.textContent = '▶ SZUKAJ MECZU (GRAJ ONLINE)';
  }
}

/**
 * Wprowadza gracza do bitwy multiplayer (przełączenie areny, start rundy z 3s odliczaniem, ukrycie modali)
 * @param {Object} [options]
 */
export function enterMultiplayerMatch(options = {}) {
  clearWsTimers();

  if (typeof window !== 'undefined' && window.gameState === 'PLAYING' && !options.force) {
    wsState.status = 'in_game';
    return;
  }

  wsState.status = 'in_game';

  // 1. Zamknięcie modali
  const modal = document.getElementById('mp-modal');
  if (modal && !modal.classList.contains('mp-modal-hidden')) {
    modal.classList.add('mp-modal-hidden');
  }

  // 2. Przełączenie areny jeśli inna niż bieżąca
  const targetArena = options.arenaId || wsState.arenaId || activeArenaId || 'arena-1';
  if (typeof switchArena === 'function') {
    switchArena(targetArena, player);
  }

  // 3. Uruchomienie rundy i 3-sekundowego odliczania taktycznego (3.. 2.. 1.. GO!)
  if (typeof window !== 'undefined' && typeof window.startRound === 'function') {
    window.startRound();
  }

  // 4. Wejście do stanu gry PLAYING (ukrycie ekranów menu/odprawy)
  if (typeof window !== 'undefined' && typeof window.setGameState === 'function') {
    window.setGameState('PLAYING');
  }

  // 5. Powiadomienie audio i baner desantu
  triggerCombatFeedBanner('BITWA', 'ODLICZANIE TAKTYCZNE // PRZYGOTUJ SIĘ DO WALKI!');
}

if (typeof window !== 'undefined') {
  window.enterMultiplayerMatch = enterMultiplayerMatch;
}

/**
 * Wysyla pakiet do serwera dedykowanego
 * @param {Object} packet
 */
const WS_DROPPABLE_BUFFER_THRESHOLD = 2048;

export function sendWsPacket(packet, options = {}) {
  if (wsState.socket && wsState.socket.readyState === WebSocket.OPEN) {
    if (options.droppable && wsState.socket.bufferedAmount > WS_DROPPABLE_BUFFER_THRESHOLD) {
      return false;
    }
    try {
      wsState.socket.send(JSON.stringify(packet));
      return true;
    } catch (_) {}
  }
  return false;
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
      wsState.socketId = msg.yourId || null;
      wsState.roomId = msg.roomId;
      wsState.slotIndex = msg.slotIndex;
      wsState.team = msg.team;
      wsState.isHost = !!msg.isHost;
      wsState.playersCount = msg.playersCount || 1;
      wsState.maxPlayers = msg.maxPlayers || MAX_MATCH_PLAYERS;
      wsState.arenaId = msg.arenaId || activeArenaId;

      // Przypisanie wlasnej druzyny i wyzerowanie ewentualnego stanu intro
      if (player) {
        player.team = msg.team;
        player.isIntro = false;
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

      // Synchronizacja liczby botow wyznaczonej przez serwer
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

      const briefingMmBtn = document.getElementById('briefing-matchmake-btn');
      const briefingStatus = document.getElementById('briefing-matchmake-status');
      const launchBtn = document.getElementById('btn-arena-launch');
      const btnText = launchBtn ? launchBtn.querySelector('.btn-text') : null;
      const mmBtn = document.getElementById('mp-matchmake-btn');
      const mmStatus = document.getElementById('mp-matchmake-status');

      if (wsState.playersCount >= 2) {
        // Znaleziono przeciwnika! Odliczanie i desant na arenę
        triggerCombatFeedBanner('SYSTEM', `ZNALEZIONO MECZ // POKÓJ: ${msg.roomId} [${wsState.playersCount}/${wsState.maxPlayers}]`);
        if (typeof playUiClick === 'function') playUiClick();

        if (briefingStatus) {
          briefingStatus.style.color = '#4ade80';
          briefingStatus.innerHTML = `<span style="font-weight: 800; color: #4ade80;">ZNALEZIONO PRZECIWNIKA!</span> [${wsState.playersCount}/${wsState.maxPlayers}]<br><span style="color: #38bdf8;">Desant na arenę za 1.5s...</span>`;
        }
        if (briefingMmBtn) {
          briefingMmBtn.textContent = 'DESANT ZA CHWILĘ...';
        }
        if (btnText) {
          btnText.textContent = 'DESANT ZA CHWILĘ...';
        }
        if (mmBtn) {
          mmBtn.textContent = `START ZA 1.5s [${wsState.playersCount}/${wsState.maxPlayers}]`;
          mmBtn.classList.remove('mp-btn-searching');
        }
        if (mmStatus) {
          mmStatus.style.display = 'block';
          mmStatus.textContent = `Gracze gotowi (${wsState.playersCount}/${wsState.maxPlayers})! Rozpoczynanie bitwy...`;
        }

        wsLaunchTimeout = setTimeout(() => {
          if (wsState.status === 'matched') {
            enterMultiplayerMatch({ arenaId: msg.arenaId });
          }
        }, 1200);

      } else {
        // Pierwszy gracz w pokoju (1/6) - czekamy w lobby na dołączenie drugiego gracza!
        triggerCombatFeedBanner('SYSTEM', `UTWORZONO POKÓJ // ${msg.roomId} [1/${wsState.maxPlayers}]. OCZEKIWANIE NA GRACZY...`);

        if (briefingStatus) {
          briefingStatus.style.color = '#38bdf8';
          briefingStatus.innerHTML = `<span style="font-weight: 800; color: #38bdf8;">POKÓJ: ${msg.roomId} [1/${wsState.maxPlayers}]</span><br><span style="color: #fbbf24;">Oczekiwanie na dołączenie drugiego gracza...</span>`;
        }
        if (briefingMmBtn) {
          briefingMmBtn.textContent = '▶ WEJDŹ TERAZ (SOLO Z BOTAMI)';
        }
        if (btnText) {
          btnText.textContent = '▶ WEJDŹ TERAZ (SOLO)';
        }
        if (mmBtn) {
          mmBtn.textContent = '▶ WEJDŹ TERAZ (SOLO Z BOTAMI)';
          mmBtn.classList.remove('mp-btn-searching');
        }
        if (mmStatus) {
          mmStatus.style.display = 'block';
          mmStatus.textContent = `Pokój utworzony: ${msg.roomId} [1/${wsState.maxPlayers}]. Oczekiwanie na rywala...`;
        }
      }
      break;
    }

    // 2. NOWY GRACZ DOLACZYL DO POKOJU (PLAYER JOINED)
    case 'PLAYER_JOINED': {
      if (!msg.player) return;
      if (wsState.socketId && msg.player.id === wsState.socketId) return;
      getOrCreateRemotePlayer(msg.player.id, msg.player.slotIndex, msg.player.name, msg.player.team);
      wsState.playersCount = msg.playersCount || (wsState.playersCount + 1);

      refreshDeathmatchParticipants(player, [], Array.from(window.remotePlayers?.values() || []));
      triggerCombatFeedBanner('SYSTEM', `${msg.player.name} DOŁĄCZYŁ DO BITWY [${wsState.playersCount}/${wsState.maxPlayers}]`);
      if (typeof playUiClick === 'function') playUiClick();

      const isCurrentlyPlaying = (typeof window !== 'undefined' && window.gameState === 'PLAYING');
      if (!isCurrentlyPlaying) {
        // Jeśli jesteśmy w lobby / odprawie -> startujemy desant dla obu graczy!
        const briefingStatus = document.getElementById('briefing-matchmake-status');
        if (briefingStatus) {
          briefingStatus.style.color = '#4ade80';
          briefingStatus.innerHTML = `<span style="font-weight: 800; color: #4ade80;">${msg.player.name} DOŁĄCZYŁ!</span> [${wsState.playersCount}/${wsState.maxPlayers}]<br><span style="color: #38bdf8;">Desant na arenę za 1.5s...</span>`;
        }
        const briefingMmBtn = document.getElementById('briefing-matchmake-btn');
        if (briefingMmBtn) {
          briefingMmBtn.textContent = 'DESANT ZA CHWILĘ...';
        }
        const launchBtn = document.getElementById('btn-arena-launch');
        const btnText = launchBtn ? launchBtn.querySelector('.btn-text') : null;
        if (btnText) {
          btnText.textContent = 'DESANT ZA CHWILĘ...';
        }

        // Host synchronizuje komendę wejścia
        if (wsState.isHost) {
          sendWsPacket({ type: 'start_game', arenaId: activeArenaId });
        }

        wsLaunchTimeout = setTimeout(() => {
          enterMultiplayerMatch({ arenaId: activeArenaId });
        }, 1200);
      } else {
        // Jeśli host już gra, wyślij komendę wejścia nowemu graczowi
        if (wsState.isHost) {
          sendWsPacket({ type: 'start_game', arenaId: activeArenaId });
        }
      }

      // Jesli jestesmy hostem, wyslij natychmiast synchronizacje areny do nowego gracza
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

    // 2b. SYNCHRONIZOWANY START MECZU
    case 'start_game': {
      if (msg.arenaId && msg.arenaId !== activeArenaId) {
        switchArena(msg.arenaId, player);
      }
      enterMultiplayerMatch({ arenaId: msg.arenaId || activeArenaId });
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

    // 4. STRZAL Z BRONI (alias shoot_event -> shoot przekierowany do wspolnego routera)
    case 'shoot_event': {
      if (typeof window !== 'undefined' && typeof window.handleNetworkData === 'function') {
        window.handleNetworkData({ ...msg, type: 'shoot' }, msg.senderId || null);
      }
      break;
    }

    // 5. PONG (PING CHECK)
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
