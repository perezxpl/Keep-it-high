// =============================================================================
// JS/NETWORKQUEUE.JS - KOLEJKOWANIE I DEDUPLIKACJA PAKIETOW SIECIOWYCH
// Eliminuje dlawienie glownego watku (Event Loop / Microtasks) na iOS Safari (iPhone 16)
// oraz na urzadzeniach 120Hz (Poco / Galaxy S24) poprzez agregacje ciaglych stanow klatkowych.
// Standard: zero emojis, modularyzacja ES, stala plynnosc 60 FPS.
// =============================================================================

let _networkDataHandler = null;

/**
 * Rejestruje glowna funkcje obslugi pakietow sieciowych (handleNetworkData)
 * @param {Function} handler
 */
export function registerNetworkDataHandler(handler) {
  _networkDataHandler = handler;
}

const inboundBuffer = {
  latestBallState: null,
  latestPlayerStates: new Map(), // key: senderId -> { data, senderId }
  latestBotsState: null,
  latestZombiesState: null,
  latestDmSync: null,
  latestAcidSync: null,
  discreteEvents: []
};

const MAX_DISCRETE_EVENTS = 64;

/**
 * Przyjmuje pakiet sieciowy z WebSocket lub P2P DataChannel.
 * Ciagle stany klatek (p_state, b_state, bots_state, zombies_state) sa deduplikowane O(1),
 * a dyskretne zdarzenia bojowe (shoot, deal_dmg, kill) trafiaja do bezpiecznej kolejki FIFO.
 * @param {Object} data
 * @param {string|null} senderId
 */
export function enqueueNetworkPacket(data, senderId = null) {
  if (!data || !data.type) return;

  const type = data.type;

  // 1. Deduplikacja ciaglych stanow klatkowych:
  if (type === 'p_state') {
    const key = data.senderId || senderId || 'remote_1';
    inboundBuffer.latestPlayerStates.set(key, { data, senderId });
    return;
  }
  if (type === 'b_state') {
    inboundBuffer.latestBallState = { data, senderId };
    return;
  }
  if (type === 'bots_state') {
    inboundBuffer.latestBotsState = { data, senderId };
    return;
  }
  if (type === 'zombies_state') {
    inboundBuffer.latestZombiesState = { data, senderId };
    return;
  }
  if (type === 'dm_sync') {
    inboundBuffer.latestDmSync = { data, senderId };
    return;
  }
  if (type === 'acid_sync') {
    inboundBuffer.latestAcidSync = { data, senderId };
    return;
  }

  // 2. Dyskretne pakiety zdarzeniowe (FIFO):
  if (inboundBuffer.discreteEvents.length < MAX_DISCRETE_EVENTS) {
    inboundBuffer.discreteEvents.push({ data, senderId });
  } else {
    // Bezpieczne zwolnienie najstarszego zdarzenia przy anomalii sieciowej
    inboundBuffer.discreteEvents.shift();
    inboundBuffer.discreteEvents.push({ data, senderId });
  }
}

/**
 * Wywolywana na poczatku kazdego kroku update() w main.js.
 * Wypycha skumulowane zdarzenia oraz najswiezsze stany do swiata gry dokladnie raz na klatke fizyki.
 */
export function flushNetworkQueue() {
  if (typeof _networkDataHandler !== 'function') return;

  // 1. Wykonanie dyskretnych zdarzen w kolejnosci ich nadejscia (strzaly, obrazenia, zgony, rzuty):
  const events = inboundBuffer.discreteEvents;
  if (events.length > 0) {
    const len = events.length;
    for (let i = 0; i < len; i++) {
      const item = events[i];
      try {
        _networkDataHandler(item.data, item.senderId);
      } catch (err) {
        console.error('[NET QUEUE EVENT ERROR]', err);
      }
    }
    events.length = 0;
  }

  // 2. Zastosowanie najswiezszego stanu pilki (zrzut zbednych posrednich klatek):
  if (inboundBuffer.latestBallState) {
    const b = inboundBuffer.latestBallState;
    inboundBuffer.latestBallState = null;
    try {
      _networkDataHandler(b.data, b.senderId);
    } catch (_) {}
  }

  // 3. Zastosowanie najswiezszego stanu kazdego ze zdalnych graczy:
  if (inboundBuffer.latestPlayerStates.size > 0) {
    for (const p of inboundBuffer.latestPlayerStates.values()) {
      try {
        _networkDataHandler(p.data, p.senderId);
      } catch (_) {}
    }
    inboundBuffer.latestPlayerStates.clear();
  }

  // 4. Zastosowanie najswiezszego stanu botow:
  if (inboundBuffer.latestBotsState) {
    const bt = inboundBuffer.latestBotsState;
    inboundBuffer.latestBotsState = null;
    try {
      _networkDataHandler(bt.data, bt.senderId);
    } catch (_) {}
  }

  // 5. Zastosowanie najswiezszego stanu zombie:
  if (inboundBuffer.latestZombiesState) {
    const z = inboundBuffer.latestZombiesState;
    inboundBuffer.latestZombiesState = null;
    try {
      _networkDataHandler(z.data, z.senderId);
    } catch (_) {}
  }

  // 6. Zastosowanie najswiezszego stanu Deathmatch (punkty i zegar):
  if (inboundBuffer.latestDmSync) {
    const dm = inboundBuffer.latestDmSync;
    inboundBuffer.latestDmSync = null;
    try {
      _networkDataHandler(dm.data, dm.senderId);
    } catch (_) {}
  }

  // 7. Zastosowanie najswiezszego stanu kwasu w Arenie 2:
  if (inboundBuffer.latestAcidSync) {
    const ac = inboundBuffer.latestAcidSync;
    inboundBuffer.latestAcidSync = null;
    try {
      _networkDataHandler(ac.data, ac.senderId);
    } catch (_) {}
  }
}

/**
 * Czysci cala kolejke i bufory stanow przy rozlaczeniu lub powrocie do lobby
 */
export function clearNetworkQueue() {
  inboundBuffer.latestBallState = null;
  inboundBuffer.latestPlayerStates.clear();
  inboundBuffer.latestBotsState = null;
  inboundBuffer.latestZombiesState = null;
  inboundBuffer.latestDmSync = null;
  inboundBuffer.latestAcidSync = null;
  inboundBuffer.discreteEvents.length = 0;
}

if (typeof window !== 'undefined') {
  window.enqueueNetworkPacket = enqueueNetworkPacket;
  window.flushNetworkQueue = flushNetworkQueue;
  window.clearNetworkQueue = clearNetworkQueue;
}
