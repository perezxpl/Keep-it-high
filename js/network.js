import { player, createPlayerInstance, setPlayerClass, getJetpackNozzlePos } from './player.js?v=v72_three_classes';
import { WEAPONS, shootWeapon } from './weapons.js?v=v72_three_classes';
import { customObstacles, obstacles, setCustomObstacles, clearCustomObstacles, undoCustomObstacle, activeArenaId, switchArena, normalizeObstacleType } from './obstacles.js?v=v72_three_classes';
import { spawnJetpackSparks, GROUND_Y } from './world.js?v=v72_three_classes';
import { ball } from './ball.js?v=v72_three_classes';

// =============================================================================
// ZDALNY GRACZ (REMOTE PLAYER INSTANCE)
// =============================================================================
const initialGroundY = (typeof GROUND_Y === 'number' && GROUND_Y > 0) ? GROUND_Y : 500;
export const remotePlayer = createPlayerInstance({
  isIntro: false,
  x: 2600,
  y: initialGroundY - 70,
  facing: -1
});
remotePlayer.active = false;
remotePlayer.isRemote = true;
remotePlayer.name = 'Gracz 2';
remotePlayer.targetX = 2600;
remotePlayer.targetY = initialGroundY - 70;
remotePlayer.groundY = initialGroundY;
remotePlayer.currentGroundY = initialGroundY;
remotePlayer.stridePhase = 0;
remotePlayer.isJetpacking = false;

// =============================================================================
// STAN SIECI I POŁĄCZENIA
// =============================================================================
export const networkState = {
  isHost: false,
  isConnected: false,
  roomId: null,
  peer: null,
  conn: null,
  ping: 0,
  status: 'disconnected', // 'disconnected' | 'hosting' | 'connecting' | 'connected'
  statusMsg: 'Offline',
  lastPingSent: 0,
  lastStateSent: 0
};

// =============================================================================
// STYLIZACJA WIZUALNA DRUŻYN (CYAN VS ORANGE)
// =============================================================================
export function applyTeamVisuals(isHost) {
  if (!remotePlayer || !remotePlayer.visuals) return;
  if (isHost) {
    // Host to Cyan, Gracz 2 to Orange
    remotePlayer.visuals.jerseyFront0 = '#c2410c';
    remotePlayer.visuals.jerseyFront1 = '#ea580c';
    remotePlayer.visuals.jerseyFront2 = '#f97316';
    remotePlayer.visuals.jerseyFront3 = '#fb923c';
    remotePlayer.visuals.jerseyBack0 = '#9a3412';
    remotePlayer.visuals.jerseyBack1 = '#c2410c';
    remotePlayer.visuals.jerseyBack2 = '#7c2d12';
    remotePlayer.visuals.jerseyStripe = '#f97316';
    remotePlayer.visuals.wristbandColor = '#fb923c';
    remotePlayer.visuals.headbandColor = '#fb923c';
    remotePlayer.name = 'P2 (ORANGE)';
  } else {
    // Client to Orange, Gracz 2 (Host) to Cyan
    remotePlayer.visuals.jerseyFront0 = '#0e7490';
    remotePlayer.visuals.jerseyFront1 = '#0891b2';
    remotePlayer.visuals.jerseyFront2 = '#06b6d4';
    remotePlayer.visuals.jerseyFront3 = '#22d3ee';
    remotePlayer.visuals.jerseyBack0 = '#155e75';
    remotePlayer.visuals.jerseyBack1 = '#0e7490';
    remotePlayer.visuals.jerseyBack2 = '#164e63';
    remotePlayer.visuals.jerseyStripe = '#06b6d4';
    remotePlayer.visuals.wristbandColor = '#22d3ee';
    remotePlayer.visuals.headbandColor = '#22d3ee';
    remotePlayer.name = 'P1 (CYAN)';
  }
}

// =============================================================================
// AKTUALIZACJA I INTERPOLACJA ZDALNEGO GRACZA
// =============================================================================
export function updateRemotePlayer(groundY) {
  if (!remotePlayer.active) return;

  remotePlayer.groundY = groundY;
  remotePlayer.currentGroundY = groundY;

  // Spadek timerów animacji i wystrzału
  if (remotePlayer.shootCooldown > 0) remotePlayer.shootCooldown--;
  if (remotePlayer.shootPoseTimer > 0) remotePlayer.shootPoseTimer--;
  if (remotePlayer.muzzleFlashTimer > 0) remotePlayer.muzzleFlashTimer--;
  if (remotePlayer.weaponKickback > 0.05) remotePlayer.weaponKickback *= 0.65; else remotePlayer.weaponKickback = 0;
  if (remotePlayer.muzzleRise > 0.005) remotePlayer.muzzleRise *= 0.72; else remotePlayer.muzzleRise = 0;
  if (remotePlayer.pumpTimer > 0) remotePlayer.pumpTimer--;

  // Płynna interpolacja pozycji (lerp)
  const dx = remotePlayer.targetX - remotePlayer.x;
  const dy = remotePlayer.targetY - remotePlayer.y;
  const dist = Math.hypot(dx, dy);

  if (dist > 180) {
    // Duży przeskok (respawn / teleport)
    remotePlayer.x = remotePlayer.targetX;
    remotePlayer.y = remotePlayer.targetY;
  } else {
    remotePlayer.x += dx * 0.45;
    remotePlayer.y += dy * 0.45;
  }

  // Animacja biegu / cyklu chodu
  const rSpeed = Math.abs(remotePlayer.vx || 0);
  if (remotePlayer.isRunning || rSpeed > 0.1) {
    remotePlayer.animTimer = (remotePlayer.animTimer || 0) + 0.22;
    if (!remotePlayer.isJumping) {
      remotePlayer.stridePhase = (remotePlayer.stridePhase || 0) + rSpeed * 0.04;
    }
  }

  // Cząsteczki płomienia jetpacka u zdalnego gracza w barwach drużyny
  if (remotePlayer.isJetpacking) {
    const nozzle = getJetpackNozzlePos(remotePlayer);
    const remoteJetColors = networkState.isHost
      ? ['#f97316', '#fb923c', '#fdba74', '#ffffff'] // Zdalny to Klient (P2 Orange)
      : ['#00e5ff', '#38bdf8', '#0284c7', '#ffffff']; // Zdalny to Host (P1 Cyan)
    spawnJetpackSparks(nozzle.x, nozzle.y, remotePlayer.facing, 4, remoteJetColors, remotePlayer.vx || 0, remotePlayer.vy || 0, nozzle.angle);
  }
}

// =============================================================================
// WYSYŁANIE PAKIETÓW SIECIOWYCH
// =============================================================================
export function sendPlayerState(localPlayer) {
  if (!networkState.conn || !networkState.isConnected) return;

  const now = performance.now();
  // Wysyłamy co klatkę lub max 60 Hz
  if (now - networkState.lastStateSent < 16) return;
  networkState.lastStateSent = now;

  try {
    networkState.conn.send({
      type: 'p_state',
      x: Math.round(localPlayer.x * 10) / 10,
      y: Math.round(localPlayer.y * 10) / 10,
      relY: Math.round((GROUND_Y - localPlayer.y) * 10) / 10,
      vx: Math.round(localPlayer.vx * 10) / 10,
      vy: Math.round(localPlayer.vy * 10) / 10,
      facing: localPlayer.facing,
      aimX: Math.round(localPlayer.aimX),
      aimY: Math.round(localPlayer.aimY),
      relAimY: Math.round((GROUND_Y - localPlayer.aimY) * 10) / 10,
      aimAngle: Math.round((localPlayer.aimAngle || 0) * 100) / 100,
      isJumping: !!localPlayer.isJumping,
      isSliding: !!localPlayer.isSliding,
      isProne: !!localPlayer.isProne,
      staggerTimer: localPlayer.staggerTimer || 0,
      staggerLanded: !!localPlayer.staggerLanded,
      isRunning: !!localPlayer.isRunning,
      isKickCharging: !!localPlayer.isKickCharging,
      kickCharge: Math.round((localPlayer.kickCharge || 0) * 100) / 100,
      hp: localPlayer.hp,
      maxHp: localPlayer.maxHp || 100,
      isDead: !!localPlayer.isDead,
      selectedClass: localPlayer.selectedClass,
      currentWeaponId: localPlayer.currentWeapon ? localPlayer.currentWeapon.id : 'AK47',
      isHolstered: !!localPlayer.isHolstered,
      isJetpacking: !!localPlayer.isJetpacking,
      jetFuel: Math.round(localPlayer.jetFuel || 0),
      gaitMode: localPlayer.gaitMode
    });
  } catch (e) {
    console.warn('[P2P] Send player state error:', e);
  }
}

export function sendBallState(localBall) {
  // Tylko host zarządza autorytatywnie piłką i wysyła jej pozycję
  if (!networkState.isHost || !networkState.conn || !networkState.isConnected) return;

  try {
    networkState.conn.send({
      type: 'b_state',
      x: Math.round(localBall.x * 10) / 10,
      y: Math.round(localBall.y * 10) / 10,
      relY: Math.round((GROUND_Y - localBall.y) * 10) / 10,
      vx: Math.round(localBall.vx * 100) / 100,
      vy: Math.round(localBall.vy * 100) / 100,
      rot: Math.round((localBall.rot || 0) * 100) / 100,
      isGrounded: !!localBall.isGrounded
    });
  } catch (e) { }
}

export function sendShootEvent(weaponId, muzzleX, muzzleY, aimAngle) {
  if (!networkState.conn || !networkState.isConnected) return;
  try {
    networkState.conn.send({
      type: 'shoot',
      weaponId: weaponId,
      x: Math.round(muzzleX * 10) / 10,
      y: Math.round(muzzleY * 10) / 10,
      relY: Math.round((GROUND_Y - muzzleY) * 10) / 10,
      aimAngle: Math.round(aimAngle * 1000) / 1000
    });
  } catch (e) { }
}

export function sendKickEvent(vx, vy, spin = 0) {
  if (!networkState.conn || !networkState.isConnected) return;
  try {
    networkState.conn.send({
      type: 'kick_ball',
      vx: Math.round(vx * 100) / 100,
      vy: Math.round(vy * 100) / 100,
      spin: Math.round(spin * 100) / 100
    });
  } catch (e) { }
}

export function sendObstacleAdd(obstacle) {
  if (!networkState.conn || !networkState.isConnected) return;
  try {
    networkState.conn.send({
      type: 'obs_add',
      obs: obstacle
    });
  } catch (e) { }
}

export function sendObstacleRemove(obs) {
  if (!networkState.conn || !networkState.isConnected) return;
  try {
    networkState.conn.send({
      type: 'obs_rem',
      x: obs.x,
      y: obs.y,
      type: obs.type
    });
  } catch (e) { }
}

export function sendObstacleClear() {
  if (!networkState.conn || !networkState.isConnected) return;
  try {
    networkState.conn.send({ type: 'obs_clr' });
  } catch (e) { }
}

export function sendObstacleUndo() {
  if (!networkState.conn || !networkState.isConnected) return;
  try {
    networkState.conn.send({ type: 'obs_undo' });
  } catch (e) { }
}

export function sendArenaSwitch(arenaId) {
  if (!networkState.conn || !networkState.isConnected) return;
  try {
    networkState.conn.send({
      type: 'arena_sw',
      arenaId: arenaId
    });
  } catch (e) { }
}

function updateDevArenaButtonUI(arenaId) {
  const arenaBtn = document.getElementById('dev-arena-btn');
  if (!arenaBtn) return;
  if (arenaId === 'ARENA_3' || arenaId === 'ARENA_FOUNDRY') {
    arenaBtn.textContent = '🏟️ Arena: 3 (Dżungla)';
    arenaBtn.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(234, 179, 8, 0.25))';
    arenaBtn.style.borderColor = '#22c55e';
    arenaBtn.style.color = '#86efac';
    arenaBtn.style.boxShadow = '0 0 12px rgba(34, 197, 94, 0.45)';
  } else if (arenaId === 'ARENA_2' || arenaId === 'ARENA_2_PANDORA' || arenaId === 'ARENA_2_SECTOR_X') {
    arenaBtn.textContent = '🏭 Arena: 2 (Sektor X)';
    arenaBtn.style.background = 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(239, 68, 68, 0.25))';
    arenaBtn.style.borderColor = '#eab308';
    arenaBtn.style.color = '#fef08a';
    arenaBtn.style.boxShadow = '0 0 12px rgba(234, 179, 8, 0.55)';
  } else {
    arenaBtn.textContent = '🏟️ Arena: 1';
    arenaBtn.style.background = '';
    arenaBtn.style.borderColor = '#06b6d4';
    arenaBtn.style.color = '#22d3ee';
    arenaBtn.style.boxShadow = '';
  }
}

// =============================================================================
// ODBIÓR PAKIETÓW SIECIOWYCH
// =============================================================================
function handleNetworkData(data) {
  if (!data || !data.type) return;

  switch (data.type) {
    case 'init_sync': {
      if (data.arenaId && data.arenaId !== activeArenaId) {
        switchArena(data.arenaId, player, remotePlayer, ball);
        updateDevArenaButtonUI(data.arenaId);
        if (typeof window !== 'undefined' && window.uiManager && typeof window.uiManager.updateMpArenaUI === 'function') {
          window.uiManager.updateMpArenaUI(data.arenaId);
        }
      }
      if (data.customObstacles) {
        setCustomObstacles(data.customObstacles);
      }
      if (data.ball) {
        ball.x = data.ball.x;
        ball.y = (data.ball.relY !== undefined) ? (GROUND_Y - data.ball.relY) : data.ball.y;
        ball.vx = data.ball.vx;
        ball.vy = data.ball.vy;
      }
      break;
    }

    case 'p_state': {
      remotePlayer.active = true;
      remotePlayer.targetX = data.x;
      remotePlayer.targetY = (data.relY !== undefined) ? (GROUND_Y - data.relY) : data.y;
      remotePlayer.groundY = GROUND_Y;
      remotePlayer.currentGroundY = GROUND_Y;
      remotePlayer.vx = data.vx;
      remotePlayer.vy = data.vy;
      remotePlayer.facing = data.facing;
      remotePlayer.aimX = data.aimX;
      remotePlayer.aimY = (data.relAimY !== undefined) ? (GROUND_Y - data.relAimY) : data.aimY;
      remotePlayer.aimAngle = data.aimAngle;
      remotePlayer.isJumping = data.isJumping;
      remotePlayer.isSliding = data.isSliding;
      if (data.isProne !== undefined) remotePlayer.isProne = !!data.isProne;
      if (data.staggerTimer !== undefined) remotePlayer.staggerTimer = data.staggerTimer;
      if (data.staggerLanded !== undefined) remotePlayer.staggerLanded = !!data.staggerLanded;
      remotePlayer.isRunning = data.isRunning;
      remotePlayer.isKickCharging = data.isKickCharging;
      remotePlayer.kickCharge = data.kickCharge;
      remotePlayer.hp = data.hp;
      remotePlayer.maxHp = data.maxHp;
      remotePlayer.isDead = data.isDead;
      remotePlayer.isJetpacking = data.isJetpacking;
      remotePlayer.jetFuel = data.jetFuel;
      if (data.gaitMode) remotePlayer.gaitMode = data.gaitMode;

      if (data.selectedClass && remotePlayer.selectedClass !== data.selectedClass) {
        setPlayerClass(data.selectedClass, remotePlayer);
        applyTeamVisuals(networkState.isHost);
      }

      const wepId = data.currentWeaponId || data.weaponId;
      if (wepId && WEAPONS[wepId]) {
        remotePlayer.currentWeapon = WEAPONS[wepId];
      }
      if (data.isHolstered !== undefined) {
        remotePlayer.isHolstered = !!data.isHolstered;
      }
      break;
    }

    case 'b_state': {
      // Tylko klient przyjmuje pozycję piłki od hosta
      if (!networkState.isHost) {
        const targetBallY = (data.relY !== undefined) ? (GROUND_Y - data.relY) : data.y;
        const dx = data.x - ball.x;
        const dy = targetBallY - ball.y;
        if (Math.hypot(dx, dy) > 90) {
          ball.x = data.x;
          ball.y = targetBallY;
        } else {
          ball.x += dx * 0.45;
          ball.y += dy * 0.45;
        }
        ball.vx = data.vx;
        ball.vy = data.vy;
        ball.rot = data.rot;
        ball.isGrounded = data.isGrounded;
      }
      break;
    }

    case 'shoot': {
      const wep = WEAPONS[data.weaponId] || remotePlayer.currentWeapon || WEAPONS.AK47;
      remotePlayer.currentWeapon = wep;
      remotePlayer.aimAngle = data.aimAngle;
      remotePlayer.facing = Math.cos(data.aimAngle) >= 0 ? 1 : -1;

      // Oblicz pozycję wylotu lufy zsynchronizowaną z lokalnym GROUND_Y odbiorcy
      const shootOriginX = (typeof data.x === 'number') ? data.x : (remotePlayer.x + remotePlayer.w / 2);
      const shootOriginY = (data.relY !== undefined)
        ? (GROUND_Y - data.relY)
        : ((typeof data.y === 'number') ? data.y : (remotePlayer.y + 20));

      shootWeapon(remotePlayer, wep, shootOriginX, shootOriginY, data.aimAngle);
      break;
    }

    case 'hb': {
      lastReceivedDataTime = performance.now();
      break;
    }

    case 'kick_ball': {
      if (networkState.isHost) {
        ball.vx = data.vx;
        ball.vy = data.vy;
        if (data.spin !== undefined) ball.spin = data.spin;
      }
      break;
    }

    case 'obs_add': {
      if (data.obs) {
        const obs = data.obs;
        if (obs.relY !== undefined) {
          obs.y = GROUND_Y - obs.relY;
        }
        const norm = normalizeObstacleType(obs.type);
        if (!obs.w || obs.w <= 0) obs.w = norm === 'ammo_depot' ? 32 : (norm === 'sandbags' ? 48 : 40);
        if (!obs.h || obs.h <= 0) obs.h = norm === 'ammo_depot' ? 24 : (norm === 'sandbags' ? 24 : 20);
        if (norm === 'ammo_depot') {
          if (obs.isPickup === undefined) obs.isPickup = true;
          if (obs.isInteractable === undefined) obs.isInteractable = true;
        }
        customObstacles.push(obs);
        obstacles.push(obs);
        spawnJetpackSparks(obs.x + obs.w / 2, obs.y + obs.h / 2, 0, 4);
      }
      break;
    }

    case 'obs_rem': {
      for (let i = customObstacles.length - 1; i >= 0; i--) {
        const o = customObstacles[i];
        if (Math.abs(o.x - data.x) < 5 && Math.abs(o.y - data.y) < 5) {
          spawnJetpackSparks(o.x + o.w / 2, o.y + o.h / 2, 0, 5);
          customObstacles.splice(i, 1);
          const obsIdx = obstacles.indexOf(o);
          if (obsIdx >= 0) obstacles.splice(obsIdx, 1);
          break;
        }
      }
      break;
    }

    case 'obs_clr': {
      clearCustomObstacles();
      break;
    }

    case 'obs_undo': {
      undoCustomObstacle();
      break;
    }

    case 'arena_sw': {
      if (data.arenaId) {
        switchArena(data.arenaId, player, remotePlayer, ball);
        updateDevArenaButtonUI(data.arenaId);
        if (typeof window !== 'undefined' && window.uiManager && typeof window.uiManager.updateMpArenaUI === 'function') {
          window.uiManager.updateMpArenaUI(data.arenaId);
        }
      }
      break;
    }

    case 'ping': {
      try {
        networkState.conn.send({
          type: 'pong',
          ts: data.ts
        });
      } catch (e) { }
      break;
    }

    case 'pong': {
      if (data.ts) {
        networkState.ping = Math.max(1, Math.round(performance.now() - data.ts));
        updatePingUI(networkState.ping);
      }
      break;
    }

    case 'chat_msg': {
      if (data.text) {
        const senderName = data.sender || (networkState.isHost ? 'P2' : 'P1');
        const senderCol = data.color || (networkState.isHost ? '#f97316' : '#00e5ff');
        addChatMessageToUI(senderName, data.text, senderCol);
      }
      break;
    }
  }
}

// =============================================================================
// ZARZĄDZANIE SESJĄ PEERJS, STUN I RESILIENT MULTIPLAYER
// =============================================================================
const PEER_CONFIG = {
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ],
    iceCandidatePoolSize: 10
  }
};

let pingInterval = null;
let lastReceivedDataTime = 0;

const savedSession = {
  isHost: false,
  roomId: null,
  targetJoinId: null,
  reconnecting: false,
  reconnectAttempts: 0
};

// Web Worker utrzymujący heartbeat w tle na urządzeniach mobilnych (gdy setInterval jest dławiony)
let heartbeatWorker = null;
function initHeartbeatWorker() {
  if (heartbeatWorker) return;
  try {
    const blobCode = `
      let timer = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (timer) clearInterval(timer);
          timer = setInterval(function() {
            self.postMessage('hb_tick');
          }, 1200);
        } else if (e.data === 'stop') {
          if (timer) { clearInterval(timer); timer = null; }
        }
      };
    `;
    const blob = new Blob([blobCode], { type: 'application/javascript' });
    heartbeatWorker = new Worker(URL.createObjectURL(blob));
    heartbeatWorker.onmessage = () => {
      if (networkState.conn && networkState.isConnected) {
        try {
          networkState.conn.send({ type: 'hb', ts: performance.now() });
        } catch (e) { }
      }
    };
  } catch (err) {
    console.warn('[P2P] WebWorker heartbeat niedostępny, fallback do setInterval:', err);
  }
}

function startPingLoop() {
  if (pingInterval) clearInterval(pingInterval);
  pingInterval = setInterval(() => {
    if (networkState.conn && networkState.isConnected) {
      try {
        networkState.conn.send({
          type: 'ping',
          ts: performance.now()
        });
      } catch (e) { }

      // Sprawdź brak pakietów (>25s) tylko gdy okno jest aktywne
      if (!document.hidden && lastReceivedDataTime > 0 && (performance.now() - lastReceivedDataTime > 25000)) {
        console.warn('[P2P] Timeout braku pakietów >25s');
        handleDisconnect('Utracono kontakt z drugim graczem (Timeout).');
      }
    }
  }, 2000);
}

function stopPingLoop() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
}

export function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    console.log('[P2P] Aplikacja wznowiona na pierwszym planie.');

    // 1. Wznów połączenie sygnalizacyjne z serwerem PeerJS
    if (networkState.peer && !networkState.peer.destroyed && networkState.peer.disconnected) {
      console.log('[P2P] Ponowne łączenie z serwerem sygnalizacyjnym PeerJS...');
      try { networkState.peer.reconnect(); } catch (e) { }
    }

    // 2. Jeśli kanał WebRTC DataChannel nadal jest otwarty, wyślij natychmiastowe keepalive
    if (networkState.conn && networkState.conn.open) {
      try {
        networkState.conn.send({ type: 'hb', ts: performance.now() });
        networkState.conn.send({ type: 'ping', ts: performance.now() });
      } catch (e) { }
      updateUIStatus('connected', networkState.isHost ? 'Połączono z Graczem 2 (Klient)' : 'Połączono z Hostem gry');
      return;
    }

    // 3. Jeśli połączenie zerwało się podczas uśpienia na telefonie, automatycznie wznów połączenie!
    if (!networkState.isHost && savedSession.targetJoinId && !savedSession.reconnecting) {
      console.log('[P2P] Wznawianie zerwanego połączenia klienta po uśpieniu do pokoju:', savedSession.targetJoinId);
      savedSession.reconnecting = true;
      updateUIStatus('connecting', 'Wznawianie gry po uśpieniu telefonu...');
      setTimeout(() => {
        if (!networkState.isConnected && savedSession.targetJoinId) {
          joinRoom(savedSession.targetJoinId, true);
        }
      }, 500);
    }
  }
}

function setupConnection(conn, isHost) {
  networkState.conn = conn;
  networkState.isHost = isHost;
  lastReceivedDataTime = performance.now();

  conn.on('open', () => {
    networkState.isConnected = true;
    networkState.status = 'connected';
    savedSession.reconnecting = false;
    savedSession.reconnectAttempts = 0;
    updateUIStatus('connected', isHost ? 'Połączono z Graczem 2 (Klient)' : 'Połączono z Hostem gry');

    remotePlayer.active = true;
    remotePlayer.isDead = false;
    remotePlayer.hp = 100;
    applyTeamVisuals(isHost);

    // Host wysyła inicjalny stan mapy, areny i piłki (z pozycją Y względną do ziemi)
    if (isHost) {
      conn.send({
        type: 'init_sync',
        arenaId: activeArenaId,
        customObstacles: customObstacles,
        ball: {
          x: ball.x,
          y: ball.y,
          relY: GROUND_Y - ball.y,
          vx: ball.vx,
          vy: ball.vy
        }
      });
    }

    startPingLoop();
    initHeartbeatWorker();
    if (heartbeatWorker) {
      try { heartbeatWorker.postMessage('start'); } catch (e) { }
    }
  });

  conn.on('data', (data) => {
    lastReceivedDataTime = performance.now();
    handleNetworkData(data);
  });

  conn.on('close', () => {
    console.warn('[P2P] WebRTC conn zamknięty. document.hidden:', document.hidden);
    if (document.hidden) {
      // Jeśli telefon został zminimalizowany, nie pokazuj od razu błędu – poczekaj na wznowienie
      networkState.isConnected = false;
      return;
    }
    handleDisconnect('Połączenie zostało zamknięte przez drugiego gracza.');
  });

  conn.on('error', (err) => {
    console.warn('[P2P] Connection error:', err);
    if (!document.hidden) {
      handleDisconnect('Błąd transmisji danych WebRTC.');
    }
  });
}

export function hostRoom() {
  if (typeof Peer === 'undefined') {
    alert('Biblioteka PeerJS nie została załadowana. Sprawdź połączenie internetowe.');
    return;
  }

  disconnectNetwork();

  updateUIStatus('hosting', 'Rejestracja pokoju...');
  const shortId = 'kih-' + Math.random().toString(36).substring(2, 6);
  savedSession.isHost = true;
  savedSession.roomId = shortId;
  savedSession.targetJoinId = null;

  try {
    const peer = new Peer(shortId, PEER_CONFIG);
    networkState.peer = peer;
    networkState.isHost = true;

    peer.on('open', (id) => {
      networkState.roomId = id;
      savedSession.roomId = id;
      updateUIStatus('hosting', `Oczekiwanie na gracza... Kod: ${id}`);
      displayHostRoomCode(id);
    });

    peer.on('disconnected', () => {
      console.warn('[P2P] Host peer rozłączony z serwerem sygnalizacyjnym, ponawianie...');
      if (networkState.peer && !networkState.peer.destroyed) {
        try { networkState.peer.reconnect(); } catch (e) { }
      }
    });

    peer.on('connection', (conn) => {
      setupConnection(conn, true);
    });

    peer.on('error', (err) => {
      console.warn('[P2P] Peer host error:', err);
      if (err.type === 'unavailable-id') {
        const autoPeer = new Peer(PEER_CONFIG);
        networkState.peer = autoPeer;
        autoPeer.on('open', (id) => {
          networkState.roomId = id;
          savedSession.roomId = id;
          updateUIStatus('hosting', `Oczekiwanie na gracza... Kod: ${id}`);
          displayHostRoomCode(id);
        });
        autoPeer.on('disconnected', () => {
          if (networkState.peer && !networkState.peer.destroyed) {
            try { networkState.peer.reconnect(); } catch (e) { }
          }
        });
        autoPeer.on('connection', (c) => setupConnection(c, true));
      } else {
        updateUIStatus('disconnected', `Błąd: ${err.message || err.type}`);
      }
    });
  } catch (err) {
    updateUIStatus('disconnected', 'Nie udało się utworzyć pokoju.');
  }
}

export function joinRoom(targetId, isAutoReconnect = false) {
  if (!targetId || targetId.trim() === '') {
    if (!isAutoReconnect) alert('Wpisz prawidłowy kod pokoju!');
    return;
  }
  if (typeof Peer === 'undefined') {
    if (!isAutoReconnect) alert('Biblioteka PeerJS nie została załadowana. Sprawdź połączenie internetowe.');
    return;
  }

  targetId = targetId.trim().toLowerCase();
  savedSession.isHost = false;
  savedSession.targetJoinId = targetId;

  if (!isAutoReconnect) {
    disconnectNetwork();
    savedSession.targetJoinId = targetId;
  } else {
    stopPingLoop();
    if (networkState.conn) {
      try { networkState.conn.close(); } catch (e) { }
      networkState.conn = null;
    }
    if (networkState.peer) {
      try { networkState.peer.destroy(); } catch (e) { }
      networkState.peer = null;
    }
    networkState.isConnected = false;
  }

  updateUIStatus('connecting', isAutoReconnect ? `Wznawianie gry z ${targetId}...` : `Łączenie z ${targetId}...`);

  try {
    const peer = new Peer(PEER_CONFIG);
    networkState.peer = peer;
    networkState.isHost = false;

    peer.on('open', () => {
      const conn = peer.connect(targetId, {
        reliable: true
      });
      setupConnection(conn, false);
    });

    peer.on('disconnected', () => {
      console.warn('[P2P] Client peer rozłączony z serwerem sygnalizacyjnym, ponawianie...');
      if (networkState.peer && !networkState.peer.destroyed) {
        try { networkState.peer.reconnect(); } catch (e) { }
      }
    });

    peer.on('error', (err) => {
      console.warn('[P2P] Peer join error:', err);
      if (!isAutoReconnect || savedSession.reconnectAttempts >= 3) {
        updateUIStatus('disconnected', `Nie można połączyć z ${targetId}. Sprawdź kod pokoju.`);
        savedSession.reconnecting = false;
      }
    });
  } catch (err) {
    updateUIStatus('disconnected', 'Błąd tworzenia klienta P2P.');
    savedSession.reconnecting = false;
  }
}

export function disconnectNetwork() {
  stopPingLoop();
  if (heartbeatWorker) {
    try { heartbeatWorker.postMessage('stop'); } catch (e) { }
  }

  savedSession.roomId = null;
  savedSession.targetJoinId = null;
  savedSession.reconnecting = false;
  savedSession.reconnectAttempts = 0;

  if (networkState.conn) {
    try { networkState.conn.close(); } catch (e) { }
    networkState.conn = null;
  }
  if (networkState.peer) {
    try { networkState.peer.destroy(); } catch (e) { }
    networkState.peer = null;
  }

  networkState.isConnected = false;
  networkState.isHost = false;
  networkState.roomId = null;
  networkState.ping = 0;
  remotePlayer.active = false;

  updateUIStatus('disconnected', 'Rozłączono / Offline');
}

function handleDisconnect(reason) {
  stopPingLoop();
  if (heartbeatWorker) {
    try { heartbeatWorker.postMessage('stop'); } catch (e) { }
  }
  networkState.isConnected = false;
  remotePlayer.active = false;
  updateUIStatus('disconnected', reason || 'Rozłączono');
}

// =============================================================================
// INTERFEJS UŻYTKOWNIKA (UI BINDINGS & HELPERS)
// =============================================================================
function updateUIStatus(status, message) {
  networkState.status = status;
  networkState.statusMsg = message;

  const dot = document.getElementById('mp-status-dot');
  const text = document.getElementById('mp-status-text');
  const pingTag = document.getElementById('mp-ping-tag');
  const roleVal = document.getElementById('mp-role-val');
  const setupView = document.getElementById('mp-setup-view');
  const connectedView = document.getElementById('mp-connected-view');
  const topBadge = document.getElementById('mp-open-btn');

  if (dot) {
    dot.className = 'mp-status-dot';
    if (status === 'connected') dot.classList.add('dot-green');
    else if (status === 'hosting' || status === 'connecting') dot.classList.add('dot-yellow');
    else dot.classList.add('dot-red');
  }

  if (text) text.textContent = message.toUpperCase();

  if (topBadge) {
    if (status === 'connected') {
      topBadge.textContent = '🟢 MULTI (ON)';
      topBadge.style.borderColor = '#4ade80';
      topBadge.style.color = '#4ade80';
    } else if (status === 'hosting' || status === 'connecting') {
      topBadge.textContent = '🟡 MULTI (...)';
      topBadge.style.borderColor = '#facc15';
      topBadge.style.color = '#facc15';
    } else {
      topBadge.textContent = '🌐 MULTI';
      topBadge.style.borderColor = 'rgba(0, 229, 255, 0.5)';
      topBadge.style.color = '#00e5ff';
    }
  }

  if (status === 'connected') {
    if (setupView) setupView.style.display = 'none';
    if (connectedView) connectedView.style.display = 'block';
    if (pingTag) pingTag.style.display = 'inline-block';
    if (roleVal) {
      roleVal.textContent = networkState.isHost ? 'HOST (Baza Cyan / Władca Fizyki)' : 'KLIENT (Baza Orange)';
      roleVal.style.color = networkState.isHost ? '#00e5ff' : '#f97316';
    }
  } else {
    if (setupView) setupView.style.display = 'block';
    if (connectedView) connectedView.style.display = 'none';
    if (pingTag) pingTag.style.display = 'none';
  }
}

function updatePingUI(ping) {
  const pingTag = document.getElementById('mp-ping-tag');
  const livePing = document.getElementById('mp-live-ping');
  const str = `${ping} ms`;
  if (pingTag) pingTag.textContent = str;
  if (livePing) livePing.textContent = str;
}

function displayHostRoomCode(id) {
  const hostInit = document.getElementById('mp-host-start-row');
  const hostInfo = document.getElementById('mp-host-info-row');
  const codeVal = document.getElementById('mp-host-code-val');

  if (hostInit) hostInit.style.display = 'none';
  if (hostInfo) hostInfo.style.display = 'block';
  if (codeVal) codeVal.textContent = id;
}

export function openMultiplayerModal() {
  const modal = document.getElementById('mp-modal');
  if (modal) modal.classList.remove('mp-modal-hidden');
  updateCursorVisibility();
}

export function closeMultiplayerModal() {
  const modal = document.getElementById('mp-modal');
  if (modal) modal.classList.add('mp-modal-hidden');
  updateCursorVisibility();
}

// =============================================================================
// ZARZĄDZANIE WIDOCZNOŚCIĄ KURSORA (DEV MENU / MULTI / CZAT)
// =============================================================================
let isHoveringUI = false;

export function updateCursorVisibility() {
  const gameContainer = document.getElementById('game-container');
  const canvasEl = document.getElementById('game');
  const mpModal = document.getElementById('mp-modal');
  const devMenu = document.getElementById('dev-menu');

  const isMpOpen = mpModal && !mpModal.classList.contains('mp-modal-hidden');
  const isDevOpen = devMenu && !devMenu.classList.contains('dev-menu-hidden');
  const isChatOpen = !!isChatActive;
  const isNotInGame = (typeof window !== 'undefined' && window.GAME_STATE && window.GAME_STATE.current !== 'PLAYING');

  const showCursor = isMpOpen || isDevOpen || isChatOpen || isHoveringUI || isNotInGame;

  if (gameContainer) {
    if (showCursor) {
      gameContainer.classList.add('cursor-visible');
    } else {
      gameContainer.classList.remove('cursor-visible');
    }
  }
  if (canvasEl) {
    canvasEl.style.cursor = showCursor ? 'default' : 'none';
  }
}

// =============================================================================
// SYSTEM CZATU TEKSTOWEGO ONLINE (KLAWISZ "T")
// =============================================================================
export let isChatActive = false;

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

export function addChatMessageToUI(sender, text, color = '#00e5ff') {
  const chatMessages = document.getElementById('chat-messages');
  const chatContainer = document.getElementById('game-chat');
  if (!chatMessages) return;

  const msgEl = document.createElement('div');
  msgEl.className = 'chat-msg';
  msgEl.style.borderLeftColor = color;
  msgEl.innerHTML = `<span class="chat-sender" style="color: ${color}">[${escapeHtml(sender)}]:</span><span class="chat-text">${escapeHtml(text)}</span>`;

  chatMessages.appendChild(msgEl);

  // Ogranicz do ostatnich 20 wiadomości w historii
  while (chatMessages.children.length > 20) {
    chatMessages.removeChild(chatMessages.firstChild);
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Odśwież widoczność czatu dla nowej wiadomości
  if (chatContainer) {
    chatContainer.style.opacity = '1';
  }

  // Płynne wygaszenie po 7 sekundach
  setTimeout(() => {
    msgEl.classList.add('msg-fading');
  }, 7000);
}

export function sendChatMessage(text) {
  if (!text || !text.trim()) return;
  text = text.trim();

  const myName = networkState.isHost ? 'P1 (TY)' : (networkState.isConnected ? 'P2 (TY)' : 'TY');
  const myColor = networkState.isHost ? '#00e5ff' : '#f97316';

  if (networkState.conn && networkState.isConnected) {
    try {
      networkState.conn.send({
        type: 'chat_msg',
        text: text,
        sender: networkState.isHost ? 'P1' : 'P2',
        color: networkState.isHost ? '#00e5ff' : '#f97316'
      });
    } catch (e) {
      console.warn('[P2P] Send chat error:', e);
    }
  }

  addChatMessageToUI(myName, text, myColor);
}

export function openChat() {
  const chatContainer = document.getElementById('game-chat');
  const chatInput = document.getElementById('chat-input');
  if (!chatContainer || !chatInput) return;

  isChatActive = true;
  chatContainer.classList.remove('chat-hidden');
  chatContainer.style.opacity = '1';

  // Przywróć pełną widoczność wszystkich ostatnich wiadomości
  const msgs = chatContainer.querySelectorAll('.chat-msg');
  msgs.forEach((m) => m.classList.remove('msg-fading'));

  chatInput.value = '';
  setTimeout(() => {
    chatInput.focus();
    chatInput.select();
  }, 10);

  updateCursorVisibility();
}

export function closeChat() {
  const chatContainer = document.getElementById('game-chat');
  const chatInput = document.getElementById('chat-input');
  if (!chatContainer) return;

  isChatActive = false;
  chatContainer.classList.add('chat-hidden');
  if (chatInput) {
    chatInput.value = '';
    chatInput.blur();
  }

  updateCursorVisibility();
}

function initChatUI() {
  const chatInput = document.getElementById('chat-input');
  const chatWrapper = document.getElementById('chat-input-wrapper');
  const sendBtn = document.getElementById('chat-send-btn');
  const closeChatBtn = document.getElementById('chat-close-btn');
  const mobileChatBtn = document.getElementById('mobile-chat-btn');
  if (!chatInput) return;

  let isInteractingWithChatControls = false;
  const preventBlurControls = [sendBtn, closeChatBtn, mobileChatBtn].filter(Boolean);
  preventBlurControls.forEach((btn) => {
    btn.addEventListener('pointerdown', (e) => {
      isInteractingWithChatControls = true;
      e.stopPropagation();
    });
    btn.addEventListener('touchstart', (e) => {
      isInteractingWithChatControls = true;
      e.stopPropagation();
    }, { passive: false });
    btn.addEventListener('pointerup', () => {
      setTimeout(() => { isInteractingWithChatControls = false; }, 300);
    });
    btn.addEventListener('touchend', () => {
      setTimeout(() => { isInteractingWithChatControls = false; }, 300);
    });
  });

  if (chatWrapper) {
    chatWrapper.addEventListener('mousedown', (e) => e.stopPropagation());
    chatWrapper.addEventListener('pointerdown', (e) => e.stopPropagation());
    chatWrapper.addEventListener('touchstart', (e) => e.stopPropagation());
  }

  const handleSend = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const text = chatInput.value.trim();
    if (text) {
      sendChatMessage(text);
    }
    closeChat();
  };

  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeChat();
  };

  const handleMobileToggle = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isChatActive) {
      closeChat();
    } else {
      openChat();
    }
  };

  if (sendBtn) {
    sendBtn.addEventListener('click', handleSend);
    sendBtn.addEventListener('touchend', handleSend);
  }

  if (closeChatBtn) {
    closeChatBtn.addEventListener('click', handleClose);
    closeChatBtn.addEventListener('touchend', handleClose);
  }

  if (mobileChatBtn) {
    mobileChatBtn.addEventListener('click', handleMobileToggle);
    mobileChatBtn.addEventListener('touchend', handleMobileToggle);
  }

  chatInput.addEventListener('keydown', (e) => {
    e.stopPropagation(); // Blokuj propagację do silnika gry!
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    }
  });

  chatInput.addEventListener('keyup', (e) => e.stopPropagation());
  chatInput.addEventListener('keypress', (e) => e.stopPropagation());

  chatInput.addEventListener('blur', () => {
    setTimeout(() => {
      if (isChatActive && !isInteractingWithChatControls) {
        closeChat();
      }
    }, 250);
  });
}

export function initNetwork() {
  // Przycisk otwierający w nagłówku
  const openBtn = document.getElementById('mp-open-btn');
  if (openBtn) openBtn.onclick = () => openMultiplayerModal();

  // Przycisk otwierający w menu DEV
  const devMpBtn = document.getElementById('dev-mp-btn');
  if (devMpBtn) devMpBtn.onclick = () => openMultiplayerModal();

  // Przycisk zamykający
  const closeBtn = document.getElementById('mp-close-btn');
  if (closeBtn) closeBtn.onclick = () => closeMultiplayerModal();

  const backdrop = document.getElementById('mp-backdrop');
  if (backdrop) backdrop.onclick = () => closeMultiplayerModal();

  // Przycisk tworzenia pokoju (Host)
  const hostBtn = document.getElementById('mp-host-btn');
  if (hostBtn) hostBtn.onclick = () => hostRoom();

  // Kopiowanie kodu pokoju
  const copyCodeBtn = document.getElementById('mp-copy-code-btn');
  if (copyCodeBtn) {
    copyCodeBtn.onclick = () => {
      if (networkState.roomId) {
        navigator.clipboard.writeText(networkState.roomId).then(() => {
          copyCodeBtn.textContent = '✅ Skopiowano!';
          setTimeout(() => { copyCodeBtn.textContent = '📋 Kopiuj Kod'; }, 2000);
        });
      }
    };
  }

  // Kopiowanie linku z zaproszeniem
  const copyLinkBtn = document.getElementById('mp-copy-link-btn');
  if (copyLinkBtn) {
    copyLinkBtn.onclick = () => {
      if (networkState.roomId) {
        const url = `${window.location.origin}${window.location.pathname}?room=${networkState.roomId}`;
        navigator.clipboard.writeText(url).then(() => {
          copyLinkBtn.textContent = '✅ Link Skopiowany do Schowka!';
          setTimeout(() => { copyLinkBtn.textContent = '🔗 Kopiuj Link z Zaproszeniem'; }, 2500);
        });
      }
    };
  }

  // Dołączanie do pokoju
  const joinBtn = document.getElementById('mp-join-btn');
  const joinInput = document.getElementById('mp-join-input');
  if (joinBtn && joinInput) {
    joinBtn.onclick = () => {
      const code = joinInput.value.trim();
      if (code) joinRoom(code);
    };
    joinInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        const code = joinInput.value.trim();
        if (code) joinRoom(code);
      }
    };
  }

  // Rozłączenie gry
  const disconnectBtn = document.getElementById('mp-disconnect-btn');
  if (disconnectBtn) {
    disconnectBtn.onclick = () => disconnectNetwork();
  }

  // Inicjalizacja czatu tekstowego
  initChatUI();

  // Nasłuchiwanie najechania kursorem na panele UI
  const bindHover = (elId) => {
    const el = document.getElementById(elId);
    if (el) {
      el.addEventListener('mouseenter', () => { isHoveringUI = true; updateCursorVisibility(); });
      el.addEventListener('mouseleave', () => { isHoveringUI = false; updateCursorVisibility(); });
    }
  };

  bindHover('dev-panel-container');
  bindHover('mp-modal');
  bindHover('game-chat');

  // Monitorowanie przycisku przełączania menu DEV
  const devToggleBtn = document.getElementById('dev-toggle-btn');
  if (devToggleBtn) {
    devToggleBtn.addEventListener('click', () => {
      setTimeout(updateCursorVisibility, 50);
    });
  }

  // Auto-connect jeśli w adresie URL przekazano ?room=... lub ?join=...
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const targetRoom = urlParams.get('room') || urlParams.get('join');
    if (targetRoom) {
      openMultiplayerModal();
      if (joinInput) joinInput.value = targetRoom;
      setTimeout(() => {
        joinRoom(targetRoom);
      }, 500);
    }
  } catch (e) { }

  // Obsługa powrotu z uśpienia / minimalizacji na urządzeniach mobilnych
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pageshow', handleVisibilityChange);
  window.addEventListener('focus', handleVisibilityChange);

  updateCursorVisibility();
}
