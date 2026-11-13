// =============================================================================
// JS/NETWORKPLAYERS.JS - ZARZADZANIE PULA ZDALNYCH GRACZY (DO 6 GRACZY W MECZU)
// Obsluga do 5 zdalnych graczy (Sloty 1..5) + 1 lokalny gracz (Slot 0) = max 6 graczy.
// Standard: Zero emojis, modularyzacja ES, wysoka wydajnosc interpolacji 60 FPS.
// =============================================================================

import { createPlayerInstance, setPlayerClass, getJetpackNozzlePos } from './player.js';
import { WEAPONS } from './weapons.js';
import { GROUND_Y, spawnJetpackSparks } from './world.js';
import { getJetpackFlamePalette } from './player/jetpack.js';

export const MAX_MATCH_PLAYERS = 6;
export const MAX_REMOTE_PLAYERS = 5;

// Dynamiczna mapa przechowujaca instancje zdalnych graczy (key: peerId lub slotId, value: PlayerInstance)
export const remotePlayers = new Map();

// Glowna instancja pierwszego zdalnego gracza (dla pelnej kompatybilnosci wstecznej z istniejacym kodem)
const initialGroundY = (typeof GROUND_Y === 'number' && GROUND_Y > 0) ? GROUND_Y : 500;
export const remotePlayer = createPlayerInstance({
  isIntro: false,
  x: 2600,
  y: initialGroundY - 70,
  facing: -1
});
Object.assign(remotePlayer, {
  active: false,
  isRemote: true,
  name: 'Gracz 2',
  slotIndex: 1,
  targetX: 2600,
  targetY: initialGroundY - 70,
  groundY: initialGroundY,
  currentGroundY: initialGroundY,
  stridePhase: 0,
  isJetpacking: false,
  team: 'ORANGE'
});

if (typeof window !== 'undefined') {
  window.remotePlayers = remotePlayers;
  window.remotePlayer = remotePlayer;
}

/**
 * Zwraca tablice wszystkich aktywnych zdalnych graczy w meczu
 * @returns {Array<Object>}
 */
export function getActiveRemotePlayers() {
  const activeList = [];
  for (const rp of remotePlayers.values()) {
    if (rp && rp.active) {
      activeList.push(rp);
    }
  }
  // Jesli mapa jest pusta, ale glowny remotePlayer jest aktywny (np. polaczenie 1v1 legacy)
  if (activeList.length === 0 && remotePlayer && remotePlayer.active) {
    activeList.push(remotePlayer);
  }
  return activeList;
}

/**
 * Pobiera lub tworzy instancje zdalnego gracza dla danego ID i slotu
 * @param {string} id - Identyfikator gracza (peerId lub socketId)
 * @param {number} slotIndex - Numer slotu na arenie (1..5)
 * @param {string} [name] - Nazwa gracza
 * @param {string} [team] - Druzyna (CYAN lub ORANGE)
 * @param {Object} [customVisuals] - Niestandardowy wyglad gracza z kreatora
 * @param {string} [classId] - Id klasy postaci gracza
 * @returns {Object} Instancja gracza
 */
export function getOrCreateRemotePlayer(id, slotIndex = 1, name = null, team = null, customVisuals = null, classId = null) {
  if (remotePlayers.has(id)) {
    const existing = remotePlayers.get(id);
    if (name) existing.name = name;
    if (team) existing.team = team;
    if (customVisuals && typeof customVisuals === 'object') {
      existing.customVisuals = { ...(existing.customVisuals || {}), ...customVisuals };
      existing._visualsDirty = true;
    }
    if (classId && existing.classId !== classId) {
      setPlayerClass(classId, existing);
    }
    existing.active = true;
    return existing;
  }

  // Weryfikacja limitu maksymalnie 5 zdalnych graczy (lacznie 6 z lokalnym graczem)
  const currentActiveCount = getActiveRemotePlayers().length;
  if (currentActiveCount >= MAX_REMOTE_PLAYERS) {
    console.warn(`[MULTIPLAYER] Osiagnieto limit ${MAX_MATCH_PLAYERS} graczy na mecz. Ignorowanie gracza: ${id}`);
    return null;
  }

  const assignedSlot = (slotIndex >= 1 && slotIndex <= 5) ? slotIndex : (currentActiveCount + 1);
  const defaultTeam = (assignedSlot <= 2) ? 'CYAN' : 'ORANGE';
  const effectiveTeam = team || defaultTeam;
  const effectiveName = name || `Gracz ${assignedSlot + 1}`;

  // Wspolrzedne poczatkowe na podstawie slotu
  const startX = (effectiveTeam === 'CYAN') ? (400 + assignedSlot * 70) : (2500 + (assignedSlot - 3) * 70);
  const startFacing = (effectiveTeam === 'CYAN') ? 1 : -1;
  const initialYaw = (startFacing < 0) ? Math.PI : 0;

  const newPlayer = createPlayerInstance({
    isIntro: false,
    x: startX,
    y: initialGroundY - 70,
    facing: startFacing
  });

  Object.assign(newPlayer, {
    active: true,
    isRemote: true,
    peerId: id,
    slotIndex: assignedSlot,
    name: effectiveName,
    team: effectiveTeam,
    facing: startFacing,
    yaw: initialYaw,
    targetYaw: initialYaw,
    shootPoseWeight: 0,
    gaitMode: 'run',
    targetX: startX,
    targetY: initialGroundY - 70,
    groundY: initialGroundY,
    currentGroundY: initialGroundY,
    hasReceivedState: false,
    stridePhase: 0,
    isJetpacking: false,
    hp: 100,
    maxHp: 100,
    isDead: false,
    respawnTimer: 0
  });

  if (classId) {
    setPlayerClass(classId, newPlayer);
  }

  if (customVisuals && typeof customVisuals === 'object' && Object.keys(customVisuals).length > 0) {
    newPlayer.customVisuals = { ...customVisuals };
  } else {
    applyTeamVisualsToRemotePlayer(newPlayer, effectiveTeam);
  }

  remotePlayers.set(id, newPlayer);

  // Synchronizacja z legacy remotePlayer jesli to pierwszy zdalny gracz
  if (remotePlayers.size === 1) {
    Object.assign(remotePlayer, {
      active: true,
      peerId: id,
      slotIndex: assignedSlot,
      name: effectiveName,
      team: effectiveTeam,
      x: newPlayer.x,
      y: newPlayer.y,
      targetX: newPlayer.targetX,
      targetY: newPlayer.targetY,
      facing: newPlayer.facing,
      yaw: newPlayer.yaw,
      targetYaw: newPlayer.targetYaw,
      customVisuals: newPlayer.customVisuals
    });
  }

  return newPlayer;
}

/**
 * Usuwa zdalnego gracza z sesji gry po rozlaczeniu
 * @param {string} id - Identyfikator gracza
 */
export function removeRemotePlayer(id) {
  if (remotePlayers.has(id)) {
    const rp = remotePlayers.get(id);
    rp.active = false;
    rp.isDead = true;
    remotePlayers.delete(id);
  }

  if (remotePlayer.peerId === id) {
    const remaining = getActiveRemotePlayers();
    if (remaining.length > 0) {
      Object.assign(remotePlayer, remaining[0]);
    } else {
      remotePlayer.active = false;
    }
  }
}

/**
 * Czysci wszystkich zdalnych graczy przy powrocie do lobby lub restarcie
 */
export function clearAllRemotePlayers() {
  for (const rp of remotePlayers.values()) {
    if (rp) {
      rp.active = false;
      rp.isDead = true;
    }
  }
  remotePlayers.clear();
  remotePlayer.active = false;
}

/**
 * Przypisuje taktyczne barwy druzynowe do sylwetki zdalnego gracza
 * @param {Object} p - Obiekt gracza
 * @param {string} team - Druzyna (CYAN lub ORANGE)
 */
export function applyTeamVisualsToRemotePlayer(p, team) {
  if (!p) return;
  p.team = team;
  const isCyan = (team === 'CYAN');
  if (!p.customVisuals) p.customVisuals = {};
  if (!p.customVisuals.pantsColor) p.customVisuals.pantsColor = isCyan ? '#0284c7' : '#ea580c';
  if (!p.customVisuals.torsoColor) p.customVisuals.torsoColor = isCyan ? '#0369a1' : '#c2410c';
  if (!p.customVisuals.jetpackColor) p.customVisuals.jetpackColor = isCyan ? '#38bdf8' : '#fb923c';
  if (!p.customVisuals.headgearColor) p.customVisuals.headgearColor = isCyan ? '#0c4a6e' : '#7c2d12';
}

/**
 * Aktualizacja i interpolacja pozycji wszystkich aktywnych zdalnych graczy w klatce update()
 * @param {number} groundY - Wysokosc podloza aktywnej areny
 */
export function updateAllRemotePlayers(groundY) {
  const activeList = getActiveRemotePlayers();

  for (const rp of activeList) {
    if (!rp || !rp.active) continue;

    if (typeof rp.groundY !== 'number') rp.groundY = groundY;
    if (typeof rp.currentGroundY !== 'number') rp.currentGroundY = rp.groundY;

    // Spadek timerow animacji i wystrzalu
    if (rp.shootCooldown > 0) rp.shootCooldown--;
    if (rp.shootPoseTimer > 0) rp.shootPoseTimer--;
    if (rp.muzzleFlashTimer > 0) rp.muzzleFlashTimer--;
    if (rp.weaponKickback > 0.05) rp.weaponKickback *= 0.65; else rp.weaponKickback = 0;
    if (rp.muzzleRise > 0.005) rp.muzzleRise *= 0.72; else rp.muzzleRise = 0;
    if (rp.pumpTimer > 0) rp.pumpTimer--;

    // Plynna interpolacja pozycji (lerp)
    const targetX = (typeof rp.targetX === 'number') ? rp.targetX : rp.x;
    const targetY = (typeof rp.targetY === 'number') ? rp.targetY : rp.y;
    const dx = targetX - rp.x;
    const dy = targetY - rp.y;
    const dist = Math.hypot(dx, dy);

    if (!rp.hasReceivedState || dist > 130) {
      // Pierwsza klatka lub duzy przeskok (respawn / teleport / catch-up)
      rp.x = targetX;
      rp.y = targetY;
    } else {
      rp.x += dx * 0.65;
      rp.y += dy * 0.65;
    }

    // Obrot i orientacja sylwetki (yaw) - plynna interpolacja katowa
    let targetYaw = (typeof rp.targetYaw === 'number') ? rp.targetYaw : (rp.facing < 0 ? Math.PI : 0);
    if (rp.facing < 0 && Math.cos(targetYaw) > 0.1) {
      targetYaw = Math.PI;
    } else if (rp.facing > 0 && Math.cos(targetYaw) < -0.1) {
      targetYaw = 0;
    }
    if (typeof rp.yaw !== 'number') {
      rp.yaw = targetYaw;
    } else {
      let dyaw = targetYaw - rp.yaw;
      while (dyaw < -Math.PI) dyaw += Math.PI * 2;
      while (dyaw > Math.PI) dyaw -= Math.PI * 2;
      rp.yaw += dyaw * 0.35;
    }

    // Plynna waga pozycji celowania / trzymania broni przy ramieniu
    const isAimingOrShooting = (rp.shootPoseTimer > 0 || Math.abs((rp.aimX || 0) - rp.x) > 10);
    const targetPoseWeight = isAimingOrShooting ? 1 : 0;
    if (typeof rp.shootPoseWeight !== 'number') rp.shootPoseWeight = targetPoseWeight;
    else rp.shootPoseWeight += (targetPoseWeight - rp.shootPoseWeight) * 0.25;

    if (!rp.gaitMode) rp.gaitMode = 'run';

    // Animacja biegu / cyklu chodu
    const rSpeed = Math.abs(rp.vx || 0);
    if (rp.isRunning || rSpeed > 0.1) {
      rp.animTimer = (rp.animTimer || 0) + 0.22;
      if (!rp.isJumping) {
        rp.stridePhase = (rp.stridePhase || 0) + rSpeed * 0.04;
      }
    }

    // Czasteczki plomienia jetpacka u zdalnego gracza
    if (rp.isJetpacking) {
      const nozzle = getJetpackNozzlePos(rp);
      const defaultCol = (rp.team === 'CYAN') ? '#00e5ff' : '#f97316';
      const remoteFlameCol = rp.customVisuals?.jetpackColor || defaultCol;
      const remoteJetColors = getJetpackFlamePalette(remoteFlameCol).particles;
      spawnJetpackSparks(nozzle.x, nozzle.y, rp.facing, 4, remoteJetColors, rp.vx || 0, rp.vy || 0, nozzle.angle);
    }
  }

  // Synchronizacja legacy remotePlayer jesli aktywny
  if (remotePlayers.size > 0) {
    const firstActive = activeList[0];
    if (firstActive && remotePlayer !== firstActive) {
      remotePlayer.active = true;
      remotePlayer.peerId = firstActive.peerId;
      remotePlayer.slotIndex = firstActive.slotIndex;
      remotePlayer.x = firstActive.x;
      remotePlayer.y = firstActive.y;
      remotePlayer.vx = firstActive.vx;
      remotePlayer.vy = firstActive.vy;
      remotePlayer.facing = firstActive.facing;
      remotePlayer.hp = firstActive.hp;
      remotePlayer.team = firstActive.team;
      remotePlayer.name = firstActive.name;
      remotePlayer.currentWeapon = firstActive.currentWeapon;
      remotePlayer.isAiming = firstActive.isAiming;
      remotePlayer.aimX = firstActive.aimX;
      remotePlayer.aimY = firstActive.aimY;
      remotePlayer.aimAngle = firstActive.aimAngle;
      remotePlayer.isDead = firstActive.isDead;
      remotePlayer.isHolstered = firstActive.isHolstered;
      remotePlayer.isCrouching = firstActive.isCrouching;
      remotePlayer.isProne = firstActive.isProne;
      remotePlayer.isSliding = firstActive.isSliding;
      remotePlayer.isJumping = firstActive.isJumping;
      remotePlayer.isJetpacking = firstActive.isJetpacking;
      remotePlayer.onGround = firstActive.onGround;
      remotePlayer.currentGroundY = firstActive.currentGroundY;
      remotePlayer.shootPoseTimer = firstActive.shootPoseTimer;
      remotePlayer.muzzleFlashTimer = firstActive.muzzleFlashTimer;
      remotePlayer.weaponKickback = firstActive.weaponKickback;
      remotePlayer.muzzleRise = firstActive.muzzleRise;
    }
  }
}
