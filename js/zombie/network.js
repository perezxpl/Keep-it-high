// =========================================================================
// ZOMBIE/NETWORK.JS - SYNCHRONIZACJA SIECIOWA SYSTEMU ZOMBIE (HOST -> CLIENT)
// Odpowiada za serializację, rozsyłanie i interpolację zombie na klientach
// Standard: Zero emojis, modularyzacja ES, optymalizacja pasma i stabilne 60 FPS
// =========================================================================

import { zombieState, ZOMBIE_CONFIG, isZombieModeActive, setZombieModeActive, createZombieInstance } from './state.js';
import { isMatchHost, isMatchClient, isMatchActive, broadcastNetworkPacket, sendDamageEvent } from '../network.js';
import { wsState } from '../networkWebSocket.js';

let lastZombiesSyncTime = 0;

/**
 * Serializuje stan aktywnych zombie i leżących ciał do transmisji sieciowej
 */
export function serializeZombiesState() {
  if (!zombieState.enabled) return null;

  const zombiesData = [];
  for (let i = 0; i < zombieState.zombies.length; i++) {
    const z = zombieState.zombies[i];
    if (!z || z.isDissolved) continue;
    zombiesData.push({
      id: z.id,
      x: Math.round(z.x * 10) / 10,
      y: Math.round(z.y * 10) / 10,
      vx: Math.round((z.vx || 0) * 10) / 10,
      vy: Math.round((z.vy || 0) * 10) / 10,
      facing: z.facing || 1,
      hp: Math.round(z.hp || 0),
      maxHp: z.maxHp || ZOMBIE_CONFIG.MAX_HP,
      isDead: !!z.isDead,
      decapitated: !!z.decapitated,
      hasHead: z.hasHead !== false,
      walkAnim: Math.round((z.walkAnim || 0) * 100) / 100,
      attackAnim: Math.round((z.attackAnim || 0) * 100) / 100,
      riseTimer: Math.round((z.riseTimer || 0) * 100) / 100,
      decayTimer: Math.round((z.decayTimer || 0) * 100) / 100,
      name: z.name || 'ZOMBIE',
      originalName: z.originalName || '',
      classId: z.currentClass?.id || 'STRIKER',
      customVisuals: z.customVisuals || null
    });
  }

  const corpsesData = [];
  for (let i = 0; i < zombieState.corpses.length; i++) {
    const c = zombieState.corpses[i];
    if (!c || c.decapitated || !c.hasHead) continue;
    corpsesData.push({
      id: c.id,
      x: Math.round(c.x * 10) / 10,
      y: Math.round(c.y * 10) / 10,
      centerX: Math.round((c.centerX || c.x) * 10) / 10,
      feetY: Math.round((c.feetY || (c.y + 70)) * 10) / 10,
      facing: c.facing || 1,
      timer: Math.round((c.timer || 0) * 100) / 100,
      twitch: Math.round((c.twitch || 0) * 10) / 10,
      originalName: c.originalName || '',
      classId: c.currentClass?.id || 'STRIKER',
      customVisuals: c.customVisuals || null
    });
  }

  return {
    zombies: zombiesData,
    corpses: corpsesData
  };
}

/**
 * Host wysyła stan zombie do wszystkich podłączonych graczy
 */
export function sendZombiesState() {
  if (!isMatchHost() || !isMatchActive() || !zombieState.enabled) return;

  const now = performance.now();
  const minInterval = (wsState && wsState.connected) ? 40 : 25; // ~25-40 Hz
  if (now - lastZombiesSyncTime < minInterval) return;
  lastZombiesSyncTime = now;

  const snapshot = serializeZombiesState();
  if (!snapshot) return;

  try {
    broadcastNetworkPacket({
      type: 'zombies_state',
      zombies: snapshot.zombies,
      corpses: snapshot.corpses
    });
  } catch (_) {}
}

/**
 * Klient odbiera autorytatywny stan zombie od Hosta i synchronizuje encje
 */
export function applyRemoteZombiesState(data) {
  if (!data) return;

  if (!zombieState.enabled) {
    setZombieModeActive(true);
  }

  // 1. Synchronizacja aktywnych zombie
  if (Array.isArray(data.zombies)) {
    const serverZombieIds = new Set();

    for (const rz of data.zombies) {
      serverZombieIds.add(rz.id);
      let localZ = zombieState.zombies.find(z => z.id === rz.id);

      if (!localZ) {
        localZ = createZombieInstance(rz.x, rz.y, rz.facing, {
          id: rz.id,
          name: rz.name,
          originalName: rz.originalName,
          classId: rz.classId,
          customVisuals: rz.customVisuals
        });
        localZ.targetX = rz.x;
        localZ.targetY = rz.y;
        localZ.vx = rz.vx;
        localZ.vy = rz.vy;
        localZ.hp = rz.hp;
        localZ.maxHp = rz.maxHp;
        localZ.isDead = rz.isDead;
        localZ.decapitated = rz.decapitated;
        localZ.hasHead = rz.hasHead;
        localZ.walkAnim = rz.walkAnim;
        localZ.attackAnim = rz.attackAnim;
        localZ.riseTimer = rz.riseTimer;
        localZ.decayTimer = rz.decayTimer;
        zombieState.zombies.push(localZ);
      } else {
        localZ.targetX = rz.x;
        localZ.targetY = rz.y;
        localZ.vx = rz.vx;
        localZ.vy = rz.vy;
        localZ.facing = rz.facing;
        localZ.hp = rz.hp;
        localZ.maxHp = rz.maxHp;
        localZ.isDead = rz.isDead;
        localZ.decapitated = rz.decapitated;
        localZ.hasHead = rz.hasHead;
        localZ.walkAnim = rz.walkAnim;
        localZ.attackAnim = rz.attackAnim;
        localZ.riseTimer = rz.riseTimer;
        localZ.decayTimer = rz.decayTimer;

        // Płynny lerp pozycji
        const dx = localZ.targetX - localZ.x;
        const dy = localZ.targetY - localZ.y;
        if (Math.hypot(dx, dy) > 90) {
          localZ.x = localZ.targetX;
          localZ.y = localZ.targetY;
        } else {
          localZ.x += dx * 0.65;
          localZ.y += dy * 0.65;
        }
      }
    }

    // Usunięcie zombie, których nie ma już na serwerze
    for (let i = zombieState.zombies.length - 1; i >= 0; i--) {
      if (!serverZombieIds.has(zombieState.zombies[i].id)) {
        zombieState.zombies.splice(i, 1);
      }
    }
  }

  // 2. Synchronizacja ciał do reanimacji
  if (Array.isArray(data.corpses)) {
    const serverCorpseIds = new Set();

    for (const rc of data.corpses) {
      serverCorpseIds.add(rc.id);
      let localC = zombieState.corpses.find(c => c.id === rc.id);

      if (!localC) {
        zombieState.corpses.push({
          id: rc.id,
          isCorpse: true,
          isZombie: true,
          isBot: true,
          active: true,
          team: 'INFECTED',
          isDead: true,
          hasHead: true,
          decapitated: false,
          x: rc.x,
          y: rc.y,
          centerX: rc.centerX,
          feetY: rc.feetY,
          w: 24,
          h: 70,
          vx: 0,
          vy: 0,
          hp: 0,
          facing: rc.facing,
          timer: rc.timer,
          twitch: rc.twitch,
          originalName: rc.originalName,
          customVisuals: rc.customVisuals,
          visuals: rc.customVisuals,
          _cachedVisuals: rc.customVisuals
        });
      } else {
        localC.timer = rc.timer;
        localC.twitch = rc.twitch;
        localC.x = rc.x;
        localC.y = rc.y;
        localC.centerX = rc.centerX;
        localC.feetY = rc.feetY;
        localC.facing = rc.facing;
      }
    }

    // Usunięcie ciał, które już wstały lub zostały usunięte
    for (let i = zombieState.corpses.length - 1; i >= 0; i--) {
      if (!serverCorpseIds.has(zombieState.corpses[i].id)) {
        zombieState.corpses.splice(i, 1);
      }
    }
  }
}

/**
 * Host przetwarza trafienie zombie zgłoszone przez klienta
 */
export function applyRemoteZombieDamage(damageData) {
  if (!isMatchHost() || !damageData || !damageData.zombieId) return;

  const targetZombie = zombieState.zombies.find(z => z.id === damageData.zombieId);
  if (!targetZombie || targetZombie.isDead) return;

  const dmg = damageData.damage || 20;
  targetZombie.hp = Math.max(0, targetZombie.hp - dmg);
  targetZombie.hitStunTimer = 0.18;

  if (targetZombie.hp <= 0 && !targetZombie.isDead) {
    targetZombie.hp = 0;
    targetZombie.isDead = true;
    targetZombie.decayTimer = 0;
    if (damageData.isHeadshot) {
      targetZombie.decapitated = true;
      targetZombie.hasHead = false;
    }
  }

  // Wymuszenie natychmiastowej transmisji zaktualizowanego stanu
  lastZombiesSyncTime = 0;
  sendZombiesState();
}
