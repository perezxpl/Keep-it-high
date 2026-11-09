// =============================================================================
// SERVER/INDEX.JS - DEDYKOWANY SERWER MATCHMAKINGU I SYNCHRONIZACJI
// Architektura: Node.js WebSocket (ws) + HTTP Healthcheck
// Standard: Zero emojis, limit do 6 graczy na mecz (3v3 / 6 FFA), 60 Hz relay
// =============================================================================

import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS_PER_MATCH = 6;

// Rejestr aktywnych pokojow meczowych: key = roomId, value = Room
const rooms = new Map();
let nextRoomSeq = 1;

/**
 * Struktura pokoju meczowego dla maksymalnie 6 graczy
 */
class GameRoom {
  constructor(id, arenaId = 'arena-1', mode = 'TEAMS') {
    this.id = id;
    this.arenaId = arenaId;
    this.mode = mode;
    this.maxPlayers = MAX_PLAYERS_PER_MATCH;
    this.players = new Map(); // key = socketId, value = PlayerEntry
    this.created = Date.now();
    this.status = 'LOBBY'; // 'LOBBY', 'PLAYING', 'CLOSED'
  }

  get isFull() {
    return this.players.size >= this.maxPlayers;
  }

  get count() {
    return this.players.size;
  }

  findAvailableSlot() {
    const occupied = new Set();
    for (const p of this.players.values()) {
      occupied.add(p.slotIndex);
    }
    for (let slot = 0; slot < this.maxPlayers; slot++) {
      if (!occupied.has(slot)) return slot;
    }
    return -1;
  }

  broadcast(messageObj, excludeSocketId = null) {
    const raw = JSON.stringify(messageObj);
    for (const [sId, p] of this.players.entries()) {
      if (sId !== excludeSocketId && p.ws.readyState === WebSocket.OPEN) {
        try {
          p.ws.send(raw);
        } catch (_) {}
      }
    }
  }

  getPlayersSummary() {
    const list = [];
    for (const p of this.players.values()) {
      list.push({
        id: p.id,
        slotIndex: p.slotIndex,
        name: p.name,
        team: p.team,
        classId: p.classId,
        isHost: p.isHost
      });
    }
    return list;
  }
}

// -----------------------------------------------------------------------------
// SERWER HTTP (Healthcheck dla platform hostingowych Render / Fly / Railway)
// -----------------------------------------------------------------------------
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let totalActivePlayers = 0;
  const roomSummaries = [];
  for (const r of rooms.values()) {
    totalActivePlayers += r.count;
    roomSummaries.push({
      id: r.id,
      arenaId: r.arenaId,
      mode: r.mode,
      players: `${r.count}/${r.maxPlayers}`,
      status: r.status
    });
  }

  res.writeHead(200);
  res.end(JSON.stringify({
    service: 'keep-it-high-matchmaker',
    status: 'online',
    maxPlayersPerMatch: MAX_PLAYERS_PER_MATCH,
    totalPlayersOnline: totalActivePlayers,
    activeRoomsCount: rooms.size,
    rooms: roomSummaries
  }, null, 2));
});

// -----------------------------------------------------------------------------
// SERWER WEBSOCKET (Obsluga komunikacji w czasie rzeczywistym)
// -----------------------------------------------------------------------------
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  const socketId = 'p_' + Math.random().toString(36).substring(2, 9);
  let currentRoom = null;
  let currentSlot = -1;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (_) {
      return;
    }

    if (!msg || !msg.type) return;

    switch (msg.type) {
      // 1. ZADANIE DOSTEPNEGO MECZU (MATCHMAKING)
      case 'MATCHMAKE': {
        const preferredArena = msg.preferredArena || 'arena-1';
        const mode = msg.mode === 'FFA' ? 'FFA' : 'TEAMS';
        const playerName = (typeof msg.name === 'string' && msg.name.trim().length > 0)
          ? msg.name.trim().substring(0, 20)
          : `Gracz ${Math.floor(Math.random() * 900 + 100)}`;
        const classId = msg.classId || 'STRIKER';

        // Szukaj otwartego pokoju z wolnym miejscem (< 6 graczy)
        let room = null;
        for (const r of rooms.values()) {
          if (r.mode === mode && !r.isFull && r.status !== 'CLOSED') {
            room = r;
            break;
          }
        }

        // Jesli brak otwartego pokoju -> utworz nowy z limitem max 6 graczy
        if (!room) {
          const roomId = `match_${nextRoomSeq++}`;
          room = new GameRoom(roomId, preferredArena, mode);
          rooms.set(roomId, room);
        }

        const slotIndex = room.findAvailableSlot();
        if (slotIndex === -1) {
          ws.send(JSON.stringify({
            type: 'ROOM_FULL',
            message: 'Pokoj zostal zapelniony. Sprobuj ponownie.'
          }));
          return;
        }

        const isHost = (room.count === 0);
        // Sloty 0, 1, 2 to Team Alpha (CYAN), Sloty 3, 4, 5 to Team Beta (ORANGE)
        const team = (mode === 'FFA')
          ? `FFA_${slotIndex + 1}`
          : (slotIndex < 3 ? 'CYAN' : 'ORANGE');

        const playerEntry = {
          id: socketId,
          ws,
          slotIndex,
          name: playerName,
          team,
          classId,
          isHost,
          customVisuals: msg.customVisuals || null
        };

        room.players.set(socketId, playerEntry);
        currentRoom = room;
        currentSlot = slotIndex;

        // Potwierdzenie dolaczenia do pokoju
        ws.send(JSON.stringify({
          type: 'MATCH_JOINED',
          roomId: room.id,
          slotIndex,
          team,
          isHost,
          arenaId: room.arenaId,
          mode: room.mode,
          maxPlayers: MAX_PLAYERS_PER_MATCH,
          playersCount: room.count,
          players: room.getPlayersSummary()
        }));

        // Powiadomienie pozostalych graczy w pokoju
        room.broadcast({
          type: 'PLAYER_JOINED',
          player: {
            id: socketId,
            slotIndex,
            name: playerName,
            team,
            classId,
            isHost,
            customVisuals: msg.customVisuals || null
          },
          playersCount: room.count,
          maxPlayers: MAX_PLAYERS_PER_MATCH
        }, socketId);

        // Jesli pokoj osiagnal 6/6 graczy -> oznacz jako pelny i uruchom natychmiastowy start
        if (room.isFull) {
          room.broadcast({
            type: 'ROOM_STATUS',
            status: 'FULL',
            message: 'Pelny sklad (6/6 graczy)! Mecz gotowy do walki.'
          });
        }
        break;
      }

      // 2. TRANSMISJA STANU POSTACI (P_STATE RELAY)
      case 'p_state': {
        if (!currentRoom) return;
        currentRoom.broadcast({
          ...msg,
          senderId: socketId,
          slotIndex: currentSlot
        }, socketId);
        break;
      }

      // 3. WYSTRZAL Z BRONI (SHOOT EVENT)
      case 'shoot_event': {
        if (!currentRoom) return;
        currentRoom.broadcast({
          ...msg,
          senderId: socketId,
          slotIndex: currentSlot
        }, socketId);
        break;
      }

      // 4. OBRAZENIA / TRAFIENIE (DAMAGE EVENT)
      case 'deal_dmg': {
        if (!currentRoom) return;
        currentRoom.broadcast(msg, socketId);
        break;
      }

      // 5. ELIMINACJA / ZGON (KILL EVENT)
      case 'kill_event': {
        if (!currentRoom) return;
        currentRoom.broadcast(msg);
        break;
      }

      // 6. RZUT GRANATEM LUB TOPORKIEM
      case 'grenade_throw':
      case 'tomahawk_throw': {
        if (!currentRoom) return;
        currentRoom.broadcast(msg, socketId);
        break;
      }

      // 7. SYNCHRONIZACJA ARENY / KLOCKOW TETRISA
      case 'arena_sync':
      case 'deathmatch_sync': {
        if (!currentRoom) return;
        currentRoom.broadcast(msg, socketId);
        break;
      }

      // 8. CZAT TEKSTOWY W GRZE
      case 'chat_message': {
        if (!currentRoom) return;
        currentRoom.broadcast({
          type: 'chat_message',
          sender: msg.sender || `Gracz ${currentSlot + 1}`,
          senderSlot: currentSlot,
          text: msg.text || ''
        });
        break;
      }

      // 9. PING / PONG
      case 'ping': {
        ws.send(JSON.stringify({ type: 'pong', time: msg.time }));
        break;
      }

      // 10. OPUSZCZENIE MECZU
      case 'LEAVE_MATCH': {
        cleanupPlayer();
        break;
      }
    }
  });

  function cleanupPlayer() {
    if (currentRoom) {
      currentRoom.players.delete(socketId);
      currentRoom.broadcast({
        type: 'PLAYER_LEFT',
        senderId: socketId,
        slotIndex: currentSlot,
        playersCount: currentRoom.count,
        maxPlayers: MAX_PLAYERS_PER_MATCH
      });

      if (currentRoom.count === 0) {
        rooms.delete(currentRoom.id);
      }
      currentRoom = null;
      currentSlot = -1;
    }
  }

  ws.on('close', cleanupPlayer);
  ws.on('error', cleanupPlayer);
});

server.listen(PORT, () => {
  console.log(`[DEDYKOWANY SERWER] Matchmaker Keep-it-high nasluchuje na porcie ${PORT}`);
  console.log(`[DEDYKOWANY SERWER] Limit graczy na mecz: ${MAX_PLAYERS_PER_MATCH} (3v3 / 6 FFA)`);
});
