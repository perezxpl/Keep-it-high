import { player, createPlayerInstance, setPlayerClass, getJetpackNozzlePos } from './player.js';
import { WEAPONS, shootWeapon, spawnBulletSparks } from './weapons.js';
import { customObstacles, obstacles, setCustomObstacles, clearCustomObstacles, undoCustomObstacle, activeArenaId, switchArena, normalizeObstacleType } from './obstacles.js';
import { spawnJetpackSparks, GROUND_Y, triggerScreenShake, spawnKnockedHelmet, spawnVestShreds, spawnBloodSpurt, resize } from './world.js';
import { ball } from './ball.js';
import { getJetpackFlamePalette } from './player/jetpack.js';
import { getMpBotCount, setMpBotCount, getMpBotLayoutDescription, getActiveBots, setBotCount, botCount, getStoredSinglePlayerBotCount, balanceBotClasses } from './bot.js';
import { refreshDeathmatchParticipants, deathmatchState, TEAMS, finishDeathmatch } from './deathmatch/index.js';
import { triggerCombatFeedBanner } from './ui/combatFeed.js';
import { ACID_SURGE_SYSTEM, playAcidSurgeSiren } from './arenas/arena2/state.js';
import { spawnAeroSuperGrenade } from './projectiles.js';
import {
  updateUIStatus,
  updatePingUI,
  displayHostRoomCode,
  openMultiplayerModal,
  closeMultiplayerModal,
  updateCursorVisibility,
  isChatActive,
  openChat,
  closeChat,
  addChatMessageToUI,
  syncMpBotUI,
  initNetworkUI
} from './networkUI.js';

export {
  updateUIStatus,
  updatePingUI,
  displayHostRoomCode,
  openMultiplayerModal,
  closeMultiplayerModal,
  updateCursorVisibility,
  isChatActive,
  openChat,
  closeChat,
  addChatMessageToUI,
  syncMpBotUI
};

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
  lastStateSent: 0,
  lastBotsStateSent: 0
};

if (typeof window !== 'undefined') {
  window.networkState = networkState;
  window.remotePlayer = remotePlayer;
}

// =============================================================================
// PRZYPISANIE DRUŻYNY SIECIOWEJ (CYAN VS ORANGE)
// Symetryczne przypisanie: Host = CYAN, Klient = ORANGE
// =============================================================================
export function applyTeamVisuals(isHost) {
  if (player) {
    player.team = isHost ? 'CYAN' : 'ORANGE';
    player.name = isHost ? 'HOST' : 'GRACZ 2';
  }
  if (remotePlayer) {
    remotePlayer.team = isHost ? 'ORANGE' : 'CYAN';
    remotePlayer.name = isHost ? 'GRACZ 2' : 'HOST';
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

  // Cząsteczki płomienia jetpacka u zdalnego gracza w barwach drużyny lub jego custom koloru
  if (remotePlayer.isJetpacking) {
    const nozzle = getJetpackNozzlePos(remotePlayer);
    const defaultCol = networkState.isHost ? '#f97316' : '#00e5ff';
    const remoteFlameCol = remotePlayer.customVisuals?.jetpackColor || defaultCol;
    const remoteJetColors = getJetpackFlamePalette(remoteFlameCol).particles;
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
      customVisuals: localPlayer.customVisuals,
      team: localPlayer.team,
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

export function sendBotsState(activeBotsList) {
  if (!networkState.isHost || !networkState.conn || !networkState.isConnected) return;
  const now = performance.now();
  if (now - (networkState.lastBotsStateSent || 0) < 22) return;
  networkState.lastBotsStateSent = now;

  try {
    networkState.conn.send({
      type: 'bots_state',
      bots: activeBotsList.map((b, idx) => ({
        idx,
        id: b.id,
        x: Math.round(b.x * 10) / 10,
        y: Math.round(b.y * 10) / 10,
        relY: Math.round((GROUND_Y - b.y) * 10) / 10,
        vx: Math.round((b.vx || 0) * 10) / 10,
        vy: Math.round((b.vy || 0) * 10) / 10,
        facing: b.facing || 1,
        aimX: Math.round(b.aimX || 0),
        aimY: Math.round(b.aimY || 0),
        relAimY: Math.round((GROUND_Y - (b.aimY || 0)) * 10) / 10,
        aimAngle: Math.round((b.aimAngle || 0) * 100) / 100,
        isJumping: !!b.isJumping,
        isSliding: !!b.isSliding,
        isProne: !!b.isProne,
        isRunning: !!b.isRunning,
        isJetpacking: !!b.isJetpacking,
        hp: (typeof b.hp === 'number') ? b.hp : 100,
        maxHp: b.maxHp || 100,
        isDead: !!b.isDead,
        selectedClass: b.selectedClass || b.currentClass?.id || 'STRIKER',
        currentWeaponId: b.currentWeapon ? b.currentWeapon.id : 'AK47',
        team: b.team || 'ORANGE',
        name: b.name
      }))
    });
  } catch (e) { }
}

export function sendBotShootEvent(botIdx, weaponId, muzzleX, muzzleY, aimAngle) {
  if (!networkState.isHost || !networkState.conn || !networkState.isConnected) return;
  try {
    networkState.conn.send({
      type: 'bot_shoot',
      botIdx: botIdx,
      weaponId: weaponId,
      x: Math.round(muzzleX * 10) / 10,
      y: Math.round(muzzleY * 10) / 10,
      relY: Math.round((GROUND_Y - muzzleY) * 10) / 10,
      aimAngle: Math.round(aimAngle * 1000) / 1000
    });
  } catch (e) { }
}

export function sendDamageEvent(damageData) {
  if (!networkState.conn || !networkState.isConnected) return;
  try {
    networkState.conn.send({
      type: 'deal_dmg',
      ...damageData
    });
  } catch (_) {}
}

export function sendKillBroadcast(killData) {
  if (!networkState.conn || !networkState.isConnected) return;
  try {
    networkState.conn.send({
      type: 'kill_event',
      ...killData
    });
  } catch (_) {}
}

export function sendGrenadeThrow(targetX, targetY, power, originX, originY) {
  if (!networkState.conn || !networkState.isConnected) return;
  try {
    networkState.conn.send({
      type: 'grenade_throw',
      x: Math.round(targetX * 10) / 10,
      y: Math.round(targetY * 10) / 10,
      relY: Math.round((GROUND_Y - targetY) * 10) / 10,
      power: Math.round(power * 100) / 100,
      originX: originX != null ? Math.round(originX * 10) / 10 : null,
      originY: originY != null ? Math.round(originY * 10) / 10 : null,
      relOriginY: originY != null ? Math.round((GROUND_Y - originY) * 10) / 10 : null
    });
  } catch (_) {}
}

export function sendDeathmatchSync(dmState) {
  if (!networkState.isHost || !networkState.conn || !networkState.isConnected) return;
  try {
    networkState.conn.send({
      type: 'dm_sync',
      timeRemaining: Math.round(dmState.timeRemaining * 10) / 10,
      scoreCyan: dmState.teamScores ? (dmState.teamScores[TEAMS.CYAN] || 0) : 0,
      scoreOrange: dmState.teamScores ? (dmState.teamScores[TEAMS.ORANGE] || 0) : 0,
      matchEnded: !!dmState.matchEnded,
      endCelebrationTimer: dmState.endCelebrationTimer || 0
    });
  } catch (_) {}
}

export function sendAcidSurgeSync(acidState) {
  if (!networkState.isHost || !networkState.conn || !networkState.isConnected) return;
  try {
    networkState.conn.send({
      type: 'acid_sync',
      state: acidState.state,
      timer: Math.round(acidState.timer * 10) / 10,
      currentY: Math.round(acidState.currentY)
    });
  } catch (_) {}
}

if (typeof window !== 'undefined') {
  window.sendDamageEvent = sendDamageEvent;
  window.sendKillBroadcast = sendKillBroadcast;
  window.sendGrenadeThrow = sendGrenadeThrow;
  window.sendDeathmatchSync = sendDeathmatchSync;
  window.sendAcidSurgeSync = sendAcidSurgeSync;
}

export function applyLocalPlayerDamage(data) {
  if (!player || player.isDead) return;
  if (player.spawnProtectionTimer && player.spawnProtectionTimer > 0) return;

  const hitPtX = (typeof data.hitX === 'number') ? data.hitX : (player.x + player.w / 2);
  const hitPtY = (data.relHitY !== undefined)
    ? (GROUND_Y - data.relHitY)
    : ((typeof data.hitY === 'number') ? data.hitY : (player.y + 20));

  const isKick = (data.weaponId === 'KICK' || data.weaponId === 'SPARTAN_KICK');
  if (isKick) {
    const isSpartan = (data.weaponId === 'SPARTAN_KICK');
    player.hp = Math.max(0, (player.hp !== undefined ? player.hp : 100) - (data.damage || 14));
    player.lastAttacker = remotePlayer;
    player.lastAttackerTimer = 240;
    player.staggerTimer = isSpartan ? 120 : (data.stagger || 22);
    player.staggerLanded = false;
    player.staggerRecoveryTimer = 0;
    player.isJumping = true;
    player.onGround = false;
    if (typeof data.vx === 'number') {
      player.vx = data.vx;
      player.airVx = data.vx;
    }
    if (typeof data.vy === 'number') player.vy = data.vy;
    if (data.facing !== undefined) player.facing = data.facing;
    player.isCharging = false;
    player.isShooting = false;
    player.isSliding = false;
    player.isCrouching = false;
    player.crouchToggled = false;
    player.isProne = false;

    spawnBulletSparks(hitPtX, hitPtY, '#ef4444', isSpartan ? 9 : 5);
    spawnBloodSpurt(hitPtX, hitPtY, (remotePlayer.facing || 1) * 2, -1, isSpartan ? 10 : 6, 1.0);
    triggerScreenShake(isSpartan ? 12 : 5);

    if (player.hp <= 0 && !player.isDead) {
      player.isDead = true;
      player.killer = remotePlayer;
      player.respawnTimer = 180;
      triggerCombatFeedBanner('DEATH', remotePlayer.name || (networkState.isHost ? 'GRACZ 2' : 'HOST'));
      sendKillBroadcast({
        killerId: 'remotePlayer',
        killerName: remotePlayer.name || (networkState.isHost ? 'GRACZ 2' : 'HOST'),
        victimId: 'player',
        victimName: player.name || (networkState.isHost ? 'HOST' : 'GRACZ 2')
      });
    }
    return;
  }

  let damageMultiplier = 1.0;
  let helmetAbsorbed = false;
  let vestAbsorbed = false;

  if (data.isHeadshot) {
    const hasHelm = !!(player.hasHelmet || player.visuals?.hasHelmet);
    const hasImmunity = ((player.headshotImmunityTimer || 0) > 0);
    if (hasImmunity) {
      damageMultiplier = 0.35;
      helmetAbsorbed = true;
      spawnBulletSparks(hitPtX, hitPtY, '#facc15', 5);
    } else if (hasHelm) {
      helmetAbsorbed = true;
      damageMultiplier = 0.40;
      player.hasHelmet = false;
      if (player.visuals) player.visuals.hasHelmet = false;
      player.helmetHits = 0;
      player.headshotImmunityTimer = 22;
      spawnKnockedHelmet(hitPtX, hitPtY - 4, (remotePlayer.facing || 1) * 8, -4, player.facing, player.visuals || player.currentClass?.visuals);
      triggerScreenShake(3.2);
      spawnBulletSparks(hitPtX, hitPtY, '#facc15', 12);
      if (typeof window !== 'undefined' && typeof window.syncArmorDevButtons === 'function') {
        window.syncArmorDevButtons();
      }
    } else {
      damageMultiplier = 2.25;
    }
  } else if (data.isTorsoShot) {
    damageMultiplier = 1.25;
  } else {
    damageMultiplier = 0.75;
  }

  let totalDamage = Math.round(data.damage * damageMultiplier);

  if (data.isTorsoShot && (player.hasVest || player.visuals?.hasVest)) {
    if (player.vestHp === undefined) {
      player.vestHp = 60;
      player.vestMaxHp = 60;
    }
    if (player.vestHp > 0) {
      vestAbsorbed = true;
      spawnBulletSparks(hitPtX, hitPtY, '#94a3b8', 7);
      if (player.vestHp >= totalDamage) {
        player.vestHp -= totalDamage;
        totalDamage = 0;
      } else {
        totalDamage -= player.vestHp;
        player.vestHp = 0;
      }
      if (player.vestHp <= 0) {
        player.vestHp = 0;
        player.hasVest = false;
        if (player.visuals) player.visuals.hasVest = false;
        spawnVestShreds(hitPtX, hitPtY, (remotePlayer.facing || 1) * 6, -3, player.visuals?.vestColor || '#18181b');
        triggerScreenShake(2.5);
        if (typeof window !== 'undefined' && typeof window.syncArmorDevButtons === 'function') {
          window.syncArmorDevButtons();
        }
      }
    }
  }

  player.hp = Math.max(0, (player.hp !== undefined ? player.hp : 100) - totalDamage);
  player.lastAttacker = remotePlayer;
  player.lastAttackerTimer = 240;

  if (data.isHeadshot) {
    if (!helmetAbsorbed) {
      spawnBulletSparks(hitPtX, hitPtY, '#ef4444', 8);
      spawnBloodSpurt(hitPtX, hitPtY, (remotePlayer.facing || 1) * 3, -2, 12, 1.4);
    }
    triggerScreenShake(data.weaponId === 'SHOTGUN' ? 4.5 : 2.5);
  } else {
    if (!vestAbsorbed) {
      spawnBulletSparks(hitPtX, hitPtY, '#ef4444', 4);
      spawnBloodSpurt(hitPtX, hitPtY, (remotePlayer.facing || 1) * 2, -1, 5, 0.8);
    }
    triggerScreenShake(data.weaponId === 'SHOTGUN' ? 2.5 : 1.2);
  }

  if (player.hp <= 0 && !player.isDead) {
    player.isDead = true;
    player.killer = remotePlayer;
    player.respawnTimer = 180;
    triggerCombatFeedBanner('DEATH', remotePlayer.name || (networkState.isHost ? 'GRACZ 2' : 'HOST'));
    sendKillBroadcast({
      killerId: 'remotePlayer',
      killerName: remotePlayer.name || (networkState.isHost ? 'GRACZ 2' : 'HOST'),
      victimId: 'player',
      victimName: player.name || (networkState.isHost ? 'HOST' : 'GRACZ 2')
    });
  }
}

export function applyRemoteBotDamage(data) {
  if (!networkState.isHost) return;
  const activeBots = getActiveBots();
  const b = activeBots[data.botIdx];
  if (!b || !b.active || b.isDead) return;

  const hitPtX = (typeof data.hitX === 'number') ? data.hitX : (b.x + b.w / 2);
  const hitPtY = (data.relHitY !== undefined)
    ? (GROUND_Y - data.relHitY)
    : ((typeof data.hitY === 'number') ? data.hitY : (b.y + 20));

  const isKick = (data.weaponId === 'KICK' || data.weaponId === 'SPARTAN_KICK');
  if (isKick) {
    const isSpartan = (data.weaponId === 'SPARTAN_KICK');
    b.hp = Math.max(0, (b.hp !== undefined ? b.hp : 100) - (data.damage || 14));
    b.lastAttacker = remotePlayer;
    b.lastAttackerTimer = 240;
    b.staggerTimer = isSpartan ? 120 : (data.stagger || 22);
    b.staggerLanded = false;
    b.staggerRecoveryTimer = 0;
    b.isJumping = true;
    b.onGround = false;
    if (typeof data.vx === 'number') {
      b.vx = data.vx;
      b.airVx = data.vx;
    }
    if (typeof data.vy === 'number') b.vy = data.vy;
    if (data.facing !== undefined) b.facing = data.facing;
    b.isCharging = false;
    b.isShooting = false;
    b.isSliding = false;
    b.isCrouching = false;
    b.isProne = false;

    spawnBulletSparks(hitPtX, hitPtY, '#ef4444', isSpartan ? 9 : 5);
    spawnBloodSpurt(hitPtX, hitPtY, (remotePlayer.facing || 1) * 2, -1, isSpartan ? 10 : 6, 1.0);

    if (b.hp <= 0 && !b.isDead) {
      b.isDead = true;
      b.killer = remotePlayer;
      b.respawnTimer = 180;
      sendKillBroadcast({
        killerId: 'remotePlayer',
        killerName: remotePlayer.name || 'GRACZ 2',
        victimId: b.id || `bot_${data.botIdx + 1}`,
        victimName: b.name || 'BOT AI'
      });
    }
    return;
  }

  let dmg = data.damage || 25;
  if (data.isHeadshot) dmg = Math.round(dmg * 2.25);
  else if (data.isTorsoShot) dmg = Math.round(dmg * 1.25);
  else dmg = Math.round(dmg * 0.75);

  b.hp = Math.max(0, (b.hp !== undefined ? b.hp : 100) - dmg);
  b.lastAttacker = remotePlayer;
  b.lastAttackerTimer = 240;

  spawnBulletSparks(hitPtX, hitPtY, '#ef4444', 6);
  spawnBloodSpurt(hitPtX, hitPtY, (remotePlayer.facing || 1) * 2, -1, 6, 0.9);

  if (b.hp <= 0 && !b.isDead) {
    b.isDead = true;
    b.killer = remotePlayer;
    b.respawnTimer = 180;
    sendKillBroadcast({
      killerId: 'remotePlayer',
      killerName: remotePlayer.name || 'GRACZ 2',
      victimId: b.id || `bot_${data.botIdx + 1}`,
      victimName: b.name || 'BOT AI'
    });
  }
}

export function updateRemoteBots(activeBots, groundY) {
  if (!Array.isArray(activeBots) || activeBots.length === 0) return;
  for (const b of activeBots) {
    if (!b.active) continue;
    b.groundY = groundY;
    b.currentGroundY = groundY;
    if (b.shootCooldown > 0) b.shootCooldown--;
    if (b.shootPoseTimer > 0) b.shootPoseTimer--;
    if (b.muzzleFlashTimer > 0) b.muzzleFlashTimer--;
    if (b.weaponKickback > 0.05) b.weaponKickback *= 0.65; else b.weaponKickback = 0;
    if (b.muzzleRise > 0.005) b.muzzleRise *= 0.72; else b.muzzleRise = 0;
    if (b.pumpTimer > 0) b.pumpTimer--;

    if (typeof b.targetX === 'number' && typeof b.targetY === 'number') {
      const dx = b.targetX - b.x;
      const dy = b.targetY - b.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 180) {
        b.x = b.targetX;
        b.y = b.targetY;
      } else {
        b.x += dx * 0.45;
        b.y += dy * 0.45;
      }
    }

    const speed = Math.abs(b.vx || 0);
    if (b.isRunning || speed > 0.1) {
      b.animTimer = (b.animTimer || 0) + 0.22;
      if (!b.isJumping) {
        b.stridePhase = (b.stridePhase || 0) + speed * 0.04;
      }
    }

    if (b.isJetpacking) {
      const nozzle = getJetpackNozzlePos(b);
      const flameCol = b.team === 'CYAN' ? '#00e5ff' : '#f97316';
      const jetColors = getJetpackFlamePalette(flameCol).particles;
      spawnJetpackSparks(nozzle.x, nozzle.y, b.facing || 1, 3, jetColors, b.vx || 0, b.vy || 0, nozzle.angle);
    }
  }
}

export function broadcastMpBotCount(count) {
  const newCount = setMpBotCount(count);
  syncMpBotUI(newCount);
  balanceBotClasses(player, getActiveBots());
  refreshDeathmatchParticipants(player, getActiveBots(), remotePlayer);

  if (networkState.isConnected && networkState.isHost && networkState.conn) {
    try {
      networkState.conn.send({
        type: 'mp_bot_count',
        count: newCount
      });
    } catch (e) { }
  }
}

function updateDevArenaButtonUI(arenaId) {
  const arenaBtn = document.getElementById('dev-arena-btn');
  if (!arenaBtn) return;
  if (arenaId === 'ARENA_3' || arenaId === 'ARENA_FOUNDRY') {
    arenaBtn.textContent = 'Arena: 3 (Dżungla)';
    arenaBtn.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(234, 179, 8, 0.25))';
    arenaBtn.style.borderColor = '#22c55e';
    arenaBtn.style.color = '#86efac';
    arenaBtn.style.boxShadow = '0 0 12px rgba(34, 197, 94, 0.45)';
  } else if (arenaId === 'ARENA_2' || arenaId === 'ARENA_2_PANDORA' || arenaId === 'ARENA_2_SECTOR_X') {
    arenaBtn.textContent = 'Arena: 2 (Sektor X)';
    arenaBtn.style.background = 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(239, 68, 68, 0.25))';
    arenaBtn.style.borderColor = '#eab308';
    arenaBtn.style.color = '#fef08a';
    arenaBtn.style.boxShadow = '0 0 12px rgba(234, 179, 8, 0.55)';
  } else {
    arenaBtn.textContent = 'Arena: 1';
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
      if (data.botCount !== undefined) {
        setBotCount(data.botCount, { isRemote: true });
        syncMpBotUI(data.botCount);
        balanceBotClasses(player, getActiveBots());
        refreshDeathmatchParticipants(player, getActiveBots(), remotePlayer);
      }
      if (data.ball) {
        ball.x = data.ball.x;
        ball.y = (data.ball.relY !== undefined) ? (GROUND_Y - data.ball.relY) : data.ball.y;
        ball.vx = data.ball.vx;
        ball.vy = data.ball.vy;
      }
      if (data.deathmatch) {
        deathmatchState.timeRemaining = data.deathmatch.timeRemaining;
        deathmatchState.mode = data.deathmatch.mode || deathmatchState.mode;
        deathmatchState.playerTeam = TEAMS.ORANGE;
        if (deathmatchState.teamScores) {
          deathmatchState.teamScores[TEAMS.CYAN] = data.deathmatch.scoreCyan || 0;
          deathmatchState.teamScores[TEAMS.ORANGE] = data.deathmatch.scoreOrange || 0;
        }
      }
      if (data.acidState && typeof ACID_SURGE_SYSTEM !== 'undefined') {
        ACID_SURGE_SYSTEM.state = data.acidState.state;
        ACID_SURGE_SYSTEM.timer = data.acidState.timer;
        ACID_SURGE_SYSTEM.currentY = data.acidState.currentY;
      }
      if (data.clientSpawn && player) {
        player.x = data.clientSpawn.x;
        player.y = data.clientSpawn.y;
        player.facing = data.clientSpawn.facing || -1;
        player.vx = 0;
        player.vy = 0;
        player.team = 'ORANGE';
      }
      if (typeof resize === 'function') {
        resize(player);
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
      if (data.customVisuals) {
        remotePlayer.customVisuals = { ...(remotePlayer.customVisuals || {}), ...data.customVisuals };
      }
      if (data.team) {
        remotePlayer.team = data.team;
      }
      if (data.name) {
        remotePlayer.name = data.name;
      }

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

    case 'mp_bot_count': {
      if (data.count !== undefined) {
        setBotCount(data.count, { isRemote: true });
        syncMpBotUI(data.count);
        balanceBotClasses(player, getActiveBots());
        refreshDeathmatchParticipants(player, getActiveBots(), remotePlayer);
      }
      break;
    }

    case 'bots_state': {
      if (networkState.isHost) break;
      const remoteBots = data.bots;
      if (!Array.isArray(remoteBots)) break;

      if (botCount !== remoteBots.length) {
        setBotCount(remoteBots.length, { isRemote: true });
        syncMpBotUI(remoteBots.length);
        balanceBotClasses(player, getActiveBots());
        refreshDeathmatchParticipants(player, getActiveBots(), remotePlayer);
      }

      const localBots = getActiveBots();
      remoteBots.forEach((rBot, idx) => {
        const localBot = localBots[idx];
        if (!localBot) return;
        localBot.active = true;
        localBot.targetX = rBot.x;
        localBot.targetY = (rBot.relY !== undefined) ? (GROUND_Y - rBot.relY) : rBot.y;
        localBot.vx = rBot.vx;
        localBot.vy = rBot.vy;
        localBot.facing = rBot.facing;
        localBot.aimX = rBot.aimX;
        localBot.aimY = (rBot.relAimY !== undefined) ? (GROUND_Y - rBot.relAimY) : rBot.aimY;
        localBot.aimAngle = rBot.aimAngle;
        localBot.isJumping = rBot.isJumping;
        localBot.isSliding = rBot.isSliding;
        localBot.isProne = rBot.isProne;
        localBot.isRunning = rBot.isRunning;
        localBot.isJetpacking = rBot.isJetpacking;
        localBot.hp = rBot.hp;
        localBot.maxHp = rBot.maxHp;
        localBot.isDead = rBot.isDead;
        if (rBot.team) localBot.team = rBot.team;
        if (rBot.name) localBot.name = rBot.name;
        if (rBot.selectedClass && localBot.selectedClass !== rBot.selectedClass) {
          setPlayerClass(rBot.selectedClass, localBot);
        }
        const wepId = rBot.currentWeaponId;
        if (wepId && WEAPONS[wepId]) {
          localBot.currentWeapon = WEAPONS[wepId];
        }
      });
      break;
    }

    case 'bot_shoot': {
      const localBots = getActiveBots();
      const b = localBots[data.botIdx];
      if (b && b.active && !b.isDead) {
        const wep = WEAPONS[data.weaponId] || b.currentWeapon || WEAPONS.AK47;
        b.currentWeapon = wep;
        b.aimAngle = data.aimAngle;
        b.facing = Math.cos(data.aimAngle) >= 0 ? 1 : -1;
        const originX = (typeof data.x === 'number') ? data.x : (b.x + b.w / 2);
        const originY = (data.relY !== undefined) ? (GROUND_Y - data.relY) : data.y;
        shootWeapon(b, wep, originX, originY, data.aimAngle);
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

    case 'deal_dmg': {
      if (data.target === 'player') {
        applyLocalPlayerDamage(data);
      } else if (data.target === 'bot' && networkState.isHost) {
        applyRemoteBotDamage(data);
      }
      break;
    }

    case 'kill_event': {
      if (data.victimId === 'player') {
        triggerCombatFeedBanner('DEATH', data.killerName || 'PRZECIWNIK');
      } else if (data.killerId === 'player' || (data.killerId === 'remotePlayer' && !networkState.isHost)) {
        triggerCombatFeedBanner('KILL', data.victimName || 'PRZECIWNIK');
      }
      break;
    }

    case 'grenade_throw': {
      const originX = (typeof data.originX === 'number') ? data.originX : (remotePlayer.x + remotePlayer.w / 2);
      const originY = (data.relOriginY !== undefined)
        ? (GROUND_Y - data.relOriginY)
        : ((typeof data.originY === 'number') ? data.originY : (remotePlayer.y + 20));
      const targetY = (data.relY !== undefined) ? (GROUND_Y - data.relY) : data.y;
      spawnAeroSuperGrenade(remotePlayer, data.x, targetY, data.power, originX, originY);
      break;
    }

    case 'dm_sync': {
      if (networkState.isHost) break;
      deathmatchState.timeRemaining = data.timeRemaining;
      if (deathmatchState.teamScores) {
        deathmatchState.teamScores[TEAMS.CYAN] = data.scoreCyan;
        deathmatchState.teamScores[TEAMS.ORANGE] = data.scoreOrange;
      }
      if (data.matchEnded && !deathmatchState.matchEnded) {
        finishDeathmatch();
      }
      break;
    }

    case 'acid_sync': {
      if (networkState.isHost) break;
      if (typeof ACID_SURGE_SYSTEM !== 'undefined') {
        if (data.state === 'WARNING' && ACID_SURGE_SYSTEM.state === 'CALM') {
          playAcidSurgeSiren();
        }
        ACID_SURGE_SYSTEM.state = data.state;
        ACID_SURGE_SYSTEM.timer = data.timer;
        ACID_SURGE_SYSTEM.currentY = data.currentY;
      }
      break;
    }

    case 'start_game': {
      closeMultiplayerModal();
      if (typeof window !== 'undefined' && typeof window.setGameState === 'function') {
        window.setGameState('PLAYING');
      }
      if (typeof resize === 'function') {
        resize(player);
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

    // Host wysyła inicjalny stan mapy, areny, botów, hazardów i punktu spawnu klienta
    if (isHost) {
      const isA2 = (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_SECTOR_X' || activeArenaId === 'ARENA_2_PANDORA');
      const isA3 = (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY');
      const clientSpawn = isA2
        ? { x: 3470, y: 350, facing: -1 }
        : (isA3 ? { x: 3800, y: 880, facing: -1 } : { x: 2600, y: GROUND_Y - 70, facing: -1 });

      conn.send({
        type: 'init_sync',
        arenaId: activeArenaId,
        botCount: getMpBotCount(),
        customObstacles: customObstacles,
        ball: {
          x: ball.x,
          y: ball.y,
          relY: GROUND_Y - ball.y,
          vx: ball.vx,
          vy: ball.vy
        },
        deathmatch: {
          timeRemaining: Math.round(deathmatchState.timeRemaining * 10) / 10,
          mode: deathmatchState.mode,
          scoreCyan: deathmatchState.teamScores ? (deathmatchState.teamScores[TEAMS.CYAN] || 0) : 0,
          scoreOrange: deathmatchState.teamScores ? (deathmatchState.teamScores[TEAMS.ORANGE] || 0) : 0
        },
        acidState: isA2 && typeof ACID_SURGE_SYSTEM !== 'undefined' ? {
          state: ACID_SURGE_SYSTEM.state,
          timer: Math.round(ACID_SURGE_SYSTEM.timer * 10) / 10,
          currentY: Math.round(ACID_SURGE_SYSTEM.currentY)
        } : null,
        clientSpawn
      });
    }

    syncMpBotUI(getMpBotCount());

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

  const spCount = getStoredSinglePlayerBotCount();
  setBotCount(spCount);
  balanceBotClasses(player, getActiveBots());
  refreshDeathmatchParticipants(player, getActiveBots(), remotePlayer);
  syncMpBotUI(getMpBotCount());

  updateUIStatus('disconnected', 'Rozłączono / Offline');
}

function handleDisconnect(reason) {
  stopPingLoop();
  if (heartbeatWorker) {
    try { heartbeatWorker.postMessage('stop'); } catch (e) { }
  }
  networkState.isConnected = false;
  networkState.isHost = false;
  remotePlayer.active = false;

  const spCount = getStoredSinglePlayerBotCount();
  setBotCount(spCount);
  balanceBotClasses(player, getActiveBots());
  refreshDeathmatchParticipants(player, getActiveBots(), remotePlayer);
  syncMpBotUI(getMpBotCount());

  updateUIStatus('disconnected', reason || 'Rozłączono');
}

// =============================================================================
// INICJALIZACJA PAKIETU SIECIOWEGO
// =============================================================================
export function initNetwork() {
  initNetworkUI({
    hostRoom,
    joinRoom,
    disconnectNetwork,
    broadcastMpBotCount
  });

  if (typeof window !== 'undefined') {
    window.sendBotShootEvent = sendBotShootEvent;
    window.broadcastMpBotCount = broadcastMpBotCount;
    window.syncMpBotUI = syncMpBotUI;
  }
}

