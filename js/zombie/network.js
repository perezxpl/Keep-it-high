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
      isReaching: !!z.isReaching,
      reachBlend: Math.round((z.reachBlend || 0) * 100) / 100,
      isCrawling: !!z.isCrawling,
      crawlPhase: Math.round((z.crawlPhase || 0) * 100) / 100,
      legHp: Math.round(z.legHp !== undefined ? z.legHp : 40),
      reviveTimer: Math.round((z.reviveTimer || 0) * 100) / 100,
      downedHp: Math.round(z.downedHp !== undefined ? z.downedHp : 60),
      groundY: Math.round((z.groundY || (z.y + (z.h || 70))) * 10) / 10,
      dismembered: z.dismembered ? {
        armFront: !!z.dismembered.armFront,
        armBack: !!z.dismembered.armBack,
        legFront: !!z.dismembered.legFront,
        legBack: !!z.dismembered.legBack
      } : null,
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
  if (!data || !isZombieModeActive()) return;

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
          customVisuals: rz.customVisuals,
          rawCoords: true
        });
        localZ.targetX = rz.x;
        localZ.targetY = rz.y;
        localZ.vx = rz.vx;
        localZ.vy = rz.vy;
        localZ.facing = rz.facing || 1;
        localZ.yaw = (rz.facing < 0 ? Math.PI : 0);
        localZ.hp = rz.hp;
        localZ.maxHp = rz.maxHp;
        localZ.isDead = rz.isDead;
        localZ.decapitated = rz.decapitated;
        localZ.hasHead = rz.hasHead;
        localZ.walkAnim = rz.walkAnim;
        localZ.attackAnim = rz.attackAnim;
        localZ.riseTimer = rz.riseTimer;
        localZ.decayTimer = rz.decayTimer;
        localZ.reviveTimer = rz.reviveTimer !== undefined ? rz.reviveTimer : 0;
        localZ.downedHp = rz.downedHp !== undefined ? rz.downedHp : 60;
        localZ.groundY = rz.groundY !== undefined ? rz.groundY : (rz.y + (rz.isCrawling ? 26 : 70));
        localZ.isReaching = !!rz.isReaching;
        localZ.reachBlend = rz.reachBlend || 0;
        localZ.isCrawling = !!rz.isCrawling;
        localZ.crawlPhase = rz.crawlPhase || 0;
        localZ.legHp = rz.legHp !== undefined ? rz.legHp : 40;
        if (rz.dismembered) {
          localZ.dismembered = {
            armFront: !!rz.dismembered.armFront,
            armBack: !!rz.dismembered.armBack,
            legFront: !!rz.dismembered.legFront,
            legBack: !!rz.dismembered.legBack
          };
        }
        if (localZ.isCrawling) {
          localZ.h = 26;
          localZ.w = 34;
          if (!localZ.dismembered) localZ.dismembered = { armFront: false, armBack: false, legFront: true, legBack: false };
          else localZ.dismembered.legFront = true;
        }
        zombieState.zombies.push(localZ);
      } else {
        localZ.targetX = rz.x;
        localZ.targetY = rz.y;
        localZ.vx = rz.vx;
        localZ.vy = rz.vy;
        if (localZ.facing !== rz.facing) {
          localZ.facing = rz.facing;
          localZ.yaw = (rz.facing < 0 ? Math.PI : 0);
        }
        localZ.hp = rz.hp;
        localZ.maxHp = rz.maxHp;
        localZ.isDead = rz.isDead;
        localZ.decapitated = rz.decapitated;
        localZ.hasHead = rz.hasHead;
        localZ.walkAnim = rz.walkAnim;
        localZ.attackAnim = rz.attackAnim;
        localZ.riseTimer = rz.riseTimer;
        localZ.decayTimer = rz.decayTimer;
        localZ.reviveTimer = rz.reviveTimer !== undefined ? rz.reviveTimer : 0;
        localZ.downedHp = rz.downedHp !== undefined ? rz.downedHp : 60;
        localZ.groundY = rz.groundY !== undefined ? rz.groundY : (rz.y + (rz.isCrawling ? 26 : 70));
        localZ.isReaching = !!rz.isReaching;
        localZ.reachBlend = rz.reachBlend || 0;
        localZ.isCrawling = !!rz.isCrawling;
        localZ.crawlPhase = rz.crawlPhase || 0;
        localZ.legHp = rz.legHp !== undefined ? rz.legHp : 40;
        if (rz.dismembered) {
          localZ.dismembered = {
            armFront: !!rz.dismembered.armFront,
            armBack: !!rz.dismembered.armBack,
            legFront: !!rz.dismembered.legFront,
            legBack: !!rz.dismembered.legBack
          };
        }
        if (localZ.isCrawling) {
          localZ.h = 26;
          localZ.w = 34;
          if (!localZ.dismembered) localZ.dismembered = { armFront: false, armBack: false, legFront: true, legBack: false };
          else localZ.dismembered.legFront = true;
        }

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
          team: 'ZOMBIE',
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
  if (!targetZombie) return;
  if (targetZombie.isDead && (!targetZombie.hasHead || targetZombie.decapitated)) return;

  const dmg = damageData.damage || 20;

  if (targetZombie.isDead) {
    // Lezacy zombie czekajacy na reanimacje - klient moze go dobic lub wykonac headshot
    if (damageData.isHeadshot) {
      targetZombie.hasHead = false;
      targetZombie.decapitated = true;
      targetZombie.reviveTimer = 0;
      targetZombie.neckFountainTimer = 65;
    } else {
      targetZombie.downedHp = (targetZombie.downedHp !== undefined ? targetZombie.downedHp : 60) - dmg;
      targetZombie.reviveTimer = Math.max(targetZombie.reviveTimer || 0, 3.5);
      if (targetZombie.downedHp <= 0) {
        targetZombie.hasHead = false;
        targetZombie.decapitated = true;
        targetZombie.reviveTimer = 0;
        targetZombie.neckFountainTimer = 65;
      }
    }
    lastZombiesSyncTime = 0;
    sendZombiesState();
    return;
  }

  // Zywy zombie - sprawdzenie trafienia w nogi
  const isLegHit = !!damageData.isLegshot || (damageData.hitY !== undefined && damageData.hitY >= targetZombie.y + (targetZombie.h || 70) * 0.62);
  if (isLegHit && !targetZombie.isCrawling) {
    targetZombie.legHp = (targetZombie.legHp !== undefined ? targetZombie.legHp : 40) - dmg;
    if (targetZombie.legHp <= 0) {
      targetZombie.isCrawling = true;
      targetZombie.isReaching = false;
      targetZombie.h = 26;
      targetZombie.w = 34;
      targetZombie.y += 44;
      targetZombie.groundY = targetZombie.y + targetZombie.h;
      if (!targetZombie.dismembered) {
        targetZombie.dismembered = { armFront: false, armBack: false, legFront: true, legBack: false };
      } else {
        targetZombie.dismembered.legFront = true;
      }
    }
  }

  targetZombie.hp = Math.max(0, targetZombie.hp - dmg);
  targetZombie.hitStunTimer = 0.18;

  if (targetZombie.hp <= 0 && !targetZombie.isDead) {
    targetZombie.hp = 0;
    targetZombie.isDead = true;
    targetZombie.decayTimer = 0;
    if (damageData.isHeadshot) {
      targetZombie.decapitated = true;
      targetZombie.hasHead = false;
      targetZombie.reviveTimer = 0;
      targetZombie.neckFountainTimer = 65;
    } else {
      targetZombie.hasHead = true;
      targetZombie.decapitated = false;
      targetZombie.reviveTimer = ZOMBIE_CONFIG.REVIVE_DELAY || 4.0;
      targetZombie.downedHp = targetZombie.maxDownedHp || 60;
    }
  }

  // Wymuszenie natychmiastowej transmisji zaktualizowanego stanu
  lastZombiesSyncTime = 0;
  sendZombiesState();
}
