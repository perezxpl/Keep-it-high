// =============================================================================
// JS/CALLOUTS/LOGIC.JS - LOGIKA MEDALI BOJOWYCH, WIELOBÓJSTW I ZEMSTY
// Śledzenie serii zabójstw (do 2s między zgonami), trafień jednym pociskiem
// ("1 strzał = 2/3 trupy"), zemsty przed ponownym zgonem oraz bonusowego XP.
// =============================================================================

import { CALLOUT_CONFIG, calloutState } from './state.js';
import { player } from '../player/state.js';
import { addPlayerXP, notifyXpGained } from '../progression.js';
import { isHazardName } from '../ui/combatFeed.js';
import { playSound } from '../audio/index.js';

function getNowMs() {
  return (typeof performance !== 'undefined' && typeof performance.now === 'function')
    ? performance.now()
    : Date.now();
}

function isZombieActor(entity, flag) {
  if (flag === true) return true;
  return Boolean(entity && entity.isZombie === true);
}

function isSameEntity(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.peerId && b.peerId && a.peerId === b.peerId) return true;
  if (a.id && b.id && a.id === b.id) return true;
  return false;
}

function isLocalPlayerActor(actor, actorId, flag) {
  if (flag === true) return true;
  if (actor && actor === player) return true;
  if (actorId && actorId === 'player') return true;
  if (player.peerId && actorId && actorId === player.peerId) return true;
  return false;
}

function isInvalidOpponent(actor, name, opts = {}) {
  if (opts.isHazard || opts.isSelf) return true;
  if (typeof actor === 'string') return true;
  if (actor && (actor.isSelf || actor.isHazard || actor === player)) return true;
  if (actor && actor.name && isHazardName(actor.name)) return true;
  if (name && isHazardName(name)) return true;
  return false;
}

function getVictimDedupeKey(victim, opts) {
  if (opts.victimId) return `id:${opts.victimId}`;
  if (victim && victim.peerId) return `peer:${victim.peerId}`;
  if (victim && victim.id) return `ent:${victim.id}`;
  if (opts.victimName) return `name:${opts.victimName}`;
  return null;
}

function matchesRevengeTarget(victim, opts, target) {
  if (!target) return false;
  if (victim && target.ref && isSameEntity(victim, target.ref)) return true;
  const vPeer = (victim && victim.peerId) || opts.victimPeerId || null;
  if (vPeer && target.peerId && vPeer === target.peerId) return true;
  const vId = (victim && victim.id) || opts.victimId || null;
  if (vId && target.id && vId === target.id) return true;
  const vName = (victim && victim.name) || opts.victimName || null;
  if (!vPeer && !vId && vName && target.name && vName === target.name) return true;
  return false;
}

function getOneShotDescriptor(count) {
  const trupWord = count >= 5 ? 'TRUPÓW' : 'TRUPY';
  const xp = count === 2
    ? CALLOUT_CONFIG.XP_BONUSES.ONE_SHOT_2
    : (count === 3 ? CALLOUT_CONFIG.XP_BONUSES.ONE_SHOT_3 : CALLOUT_CONFIG.XP_BONUSES.ONE_SHOT_4_PLUS);

  return {
    kind: 'ONESHOT',
    priority: 3,
    xp,
    notifyLabel: `1 STRZAŁ = ${count} ${trupWord}`,
    notifyColor: '#38bdf8',
    accentColor: '#38bdf8',
    secondaryColor: '#fef08a',
    bgTop: '#081b2e',
    bgBottom: '#0f172a',
    words: [
      { text: '1', tilt: -0.10, scale: 1.06, color: '#fef08a', row: 0 },
      { text: 'STRZAŁ =', tilt: 0.04, scale: 0.88, color: '#e0f2fe', row: 0 },
      { text: `${count}`, tilt: -0.08, scale: 1.32, color: '#38bdf8', row: 1 },
      { text: trupWord, tilt: 0.07, scale: 1.05, color: '#ffffff', row: 1 }
    ]
  };
}

function getMultiKillDescriptor(count) {
  let xp = CALLOUT_CONFIG.XP_BONUSES.MULTI_KILL;
  let words;
  let accentColor = '#f59e0b';
  let notifyLabel = `SERIA ${count} ZABÓJSTW`;

  if (count === 2) {
    xp = CALLOUT_CONFIG.XP_BONUSES.DOUBLE_KILL;
    notifyLabel = 'PODWÓJNE ZABÓJSTWO';
    accentColor = '#fbbf24';
    words = [
      { text: 'PODWÓJNE', tilt: -0.09, scale: 1.04, color: '#fef08a', row: 0 },
      { text: 'ZABÓJSTWO', tilt: 0.06, scale: 1.10, color: '#f59e0b', row: 1 }
    ];
  } else if (count === 3) {
    xp = CALLOUT_CONFIG.XP_BONUSES.TRIPLE_KILL;
    notifyLabel = 'POTRÓJNE ZABÓJSTWO';
    accentColor = '#fb923c';
    words = [
      { text: 'POTRÓJNE', tilt: -0.10, scale: 1.08, color: '#ffedd5', row: 0 },
      { text: 'ZABÓJSTWO', tilt: 0.07, scale: 1.12, color: '#fb923c', row: 1 }
    ];
  } else if (count === 4) {
    xp = CALLOUT_CONFIG.XP_BONUSES.QUAD_KILL;
    notifyLabel = 'POCZWÓRNE ZABÓJSTWO';
    accentColor = '#f97316';
    words = [
      { text: 'POCZWÓRNE', tilt: -0.08, scale: 1.06, color: '#fed7aa', row: 0 },
      { text: 'ZABÓJSTWO', tilt: 0.06, scale: 1.14, color: '#f97316', row: 1 }
    ];
  } else if (count === 5) {
    xp = CALLOUT_CONFIG.XP_BONUSES.PENTA_KILL;
    notifyLabel = 'PIĘCIOKROTNE ZABÓJSTWO';
    accentColor = '#ef4444';
    words = [
      { text: 'PIĘCIOKROTNE', tilt: -0.07, scale: 1.02, color: '#fecaca', row: 0 },
      { text: 'ZABÓJSTWO', tilt: 0.06, scale: 1.14, color: '#ef4444', row: 1 }
    ];
  } else {
    words = [
      { text: 'SERIA', tilt: -0.09, scale: 0.96, color: '#fecaca', row: 0 },
      { text: `${count}x`, tilt: 0.08, scale: 1.26, color: '#ef4444', row: 0 },
      { text: 'ZABÓJSTW', tilt: -0.04, scale: 1.06, color: '#ffffff', row: 1 }
    ];
    accentColor = '#ef4444';
  }

  return {
    kind: 'MULTIKILL',
    priority: 2,
    xp,
    notifyLabel,
    notifyColor: accentColor,
    accentColor,
    secondaryColor: '#ffffff',
    bgTop: '#291507',
    bgBottom: '#17111c',
    words
  };
}

function getRevengeDescriptor(targetName) {
  const cleanName = (targetName && typeof targetName === 'string')
    ? targetName.trim().slice(0, 14).toUpperCase()
    : '';
  const words = [
    { text: 'ZEMSTA', tilt: -0.09, scale: 1.24, color: '#ff4757', row: 0 }
  ];
  if (cleanName) {
    words.push({ text: cleanName, tilt: 0.05, scale: 0.78, color: '#ffeaa7', row: 1 });
  }

  return {
    kind: 'REVENGE',
    priority: 4,
    xp: CALLOUT_CONFIG.XP_BONUSES.REVENGE,
    notifyLabel: cleanName ? `ZEMSTA (${cleanName})` : 'ZEMSTA',
    notifyColor: '#ff6b6b',
    accentColor: '#ff4757',
    secondaryColor: '#ffd166',
    bgTop: '#2b0912',
    bgBottom: '#160d18',
    words
  };
}

function computeStaggerOffset(worldX, worldY, kind) {
  let nearbyCount = 0;
  for (const b of calloutState.bubbles) {
    if (b.age > 1.25) continue;
    const dx = Math.abs(b.worldX - worldX);
    const dy = Math.abs(b.worldY - worldY);
    if (dx < 190 && dy < 150) {
      nearbyCount++;
    }
  }
  const sideDir = (nearbyCount % 2 === 0) ? 1 : -1;
  const horizontalNudge = nearbyCount > 0 ? sideDir * (34 + nearbyCount * 14) : (kind === 'REVENGE' ? -22 : 14);
  const verticalNudge = -(nearbyCount * 54);
  return {
    offsetX: horizontalNudge,
    offsetY: verticalNudge
  };
}

function findBubbleById(id) {
  if (!id) return null;
  for (const b of calloutState.bubbles) {
    if (b.id === id) return b;
  }
  return null;
}

function spawnCalloutBubble(descriptor, worldX, worldY) {
  const { offsetX, offsetY } = computeStaggerOffset(worldX, worldY, descriptor.kind);
  const bubble = {
    id: calloutState.nextBubbleId++,
    kind: descriptor.kind,
    worldX,
    worldY,
    offsetX,
    offsetY,
    age: 0,
    lifetime: CALLOUT_CONFIG.BUBBLE_LIFETIME_SEC,
    popAge: 0,
    tilt: descriptor.kind === 'REVENGE'
      ? -0.055
      : (descriptor.kind === 'ONESHOT' ? 0.045 : ((calloutState.nextBubbleId % 2 === 0) ? -0.035 : 0.035)),
    tailDir: (calloutState.nextBubbleId % 2 === 0) ? -1 : 1,
    accentColor: descriptor.accentColor,
    secondaryColor: descriptor.secondaryColor,
    bgTop: descriptor.bgTop,
    bgBottom: descriptor.bgBottom,
    words: descriptor.words,
    xpText: descriptor.xp > 0 ? `+${descriptor.xp} XP` : ''
  };

  calloutState.bubbles.push(bubble);
  while (calloutState.bubbles.length > CALLOUT_CONFIG.MAX_ACTIVE_BUBBLES) {
    calloutState.bubbles.shift();
  }
  return bubble;
}

function upgradeCalloutBubble(bubble, descriptor, newWorldX, newWorldY) {
  bubble.worldX = newWorldX;
  bubble.worldY = newWorldY;
  bubble.age = 0;
  bubble.popAge = 0;
  bubble.accentColor = descriptor.accentColor;
  bubble.secondaryColor = descriptor.secondaryColor;
  bubble.bgTop = descriptor.bgTop;
  bubble.bgBottom = descriptor.bgBottom;
  bubble.words = descriptor.words;
  bubble.xpText = descriptor.xp > 0 ? `+${descriptor.xp} XP` : '';
  return bubble;
}

function grantCalloutXp(label, deltaXp, color) {
  if (!deltaXp || deltaXp <= 0) return;
  addPlayerXP(deltaXp);
  notifyXpGained(label, deltaXp, color);
}

export function initCallouts() {
  resetCalloutMatchState();
}

export function resetCalloutMatchState() {
  calloutState.bubbles = [];
  calloutState.multiKillCount = 0;
  calloutState.lastKillAtMs = 0;
  calloutState.lastMultiKillBubbleId = null;
  calloutState.lastMultiKillSpawnAtMs = 0;
  calloutState.revengeTarget = null;
  calloutState.bulletKills.clear();
  calloutState.recentVictimKills.clear();
}

export function onPlayerDeathCallout(killer, opts = {}) {
  // Śmierć gracza natychmiast kasuje serię wielobójstw oraz poprzedni cel zemsty
  calloutState.multiKillCount = 0;
  calloutState.lastKillAtMs = 0;
  calloutState.lastMultiKillBubbleId = null;
  calloutState.lastMultiKillSpawnAtMs = 0;

  const killerName = (killer && typeof killer === 'object' ? killer.name : null) || opts.killerName || null;
  if (isZombieActor(killer, opts.isZombie) || isInvalidOpponent(killer, killerName, opts)) {
    calloutState.revengeTarget = null;
    return;
  }

  const refObj = (killer && typeof killer === 'object') ? killer : null;
  const kPeer = (refObj && refObj.peerId) || opts.killerPeerId || null;
  const kId = (refObj && refObj.id) || opts.killerId || null;

  if (!refObj && !kPeer && !kId && !killerName) {
    calloutState.revengeTarget = null;
    return;
  }

  calloutState.revengeTarget = {
    ref: refObj,
    peerId: kPeer,
    id: kId,
    name: killerName,
    diedAtMs: getNowMs()
  };
}

export function registerCalloutKill(killer, victim, opts = {}) {
  if (!isLocalPlayerActor(killer, opts.killerId, opts.killerIsLocal)) return;
  if (victim && victim === player) return;
  if (isZombieActor(victim, opts.isZombie)) return;

  const now = getNowMs();
  const dedupeKey = getVictimDedupeKey(victim, opts);
  if (dedupeKey) {
    for (const [k, ts] of calloutState.recentVictimKills.entries()) {
      if ((now - ts) > CALLOUT_CONFIG.DEDUPE_WINDOW_MS) {
        calloutState.recentVictimKills.delete(k);
      }
    }
    const prevTs = calloutState.recentVictimKills.get(dedupeKey);
    if (prevTs !== undefined && (now - prevTs) <= CALLOUT_CONFIG.DEDUPE_WINDOW_MS) {
      return;
    }
    calloutState.recentVictimKills.set(dedupeKey, now);
  }

  const worldX = (typeof opts.x === 'number')
    ? opts.x
    : ((victim && typeof victim.x === 'number') ? victim.x : player.x);
  const worldY = (typeof opts.y === 'number')
    ? opts.y
    : ((victim && typeof victim.y === 'number') ? victim.y - 52 : player.y - 58);

  // 1. Sprawdzenie trafień jednym pociskiem ("1 strzał = 2/3 trupy")
  let triggeredOneShot = false;
  const bulletId = opts.bulletId || (victim && victim.killerBulletId) || null;
  if (bulletId) {
    for (const [bId, entry] of calloutState.bulletKills.entries()) {
      if ((now - entry.lastTime) > CALLOUT_CONFIG.BULLET_TRACK_TTL_MS) {
        calloutState.bulletKills.delete(bId);
      }
    }

    let bEntry = calloutState.bulletKills.get(bulletId);
    if (!bEntry) {
      bEntry = {
        count: 0,
        xSum: 0,
        ySum: 0,
        bubbleId: null,
        xpAwarded: 0,
        lastTime: now
      };
      calloutState.bulletKills.set(bulletId, bEntry);
    }

    bEntry.count += 1;
    bEntry.xSum += worldX;
    bEntry.ySum += worldY;
    bEntry.lastTime = now;

    if (bEntry.count >= 2) {
      triggeredOneShot = true;
      const desc = getOneShotDescriptor(bEntry.count);
      const midX = bEntry.xSum / bEntry.count;
      const midY = bEntry.ySum / bEntry.count;
      const xpDelta = Math.max(0, desc.xp - bEntry.xpAwarded);
      bEntry.xpAwarded = desc.xp;

      const existing = findBubbleById(bEntry.bubbleId);
      if (existing) {
        upgradeCalloutBubble(existing, desc, midX, midY);
      } else {
        const created = spawnCalloutBubble(desc, midX, midY);
        bEntry.bubbleId = created.id;
      }

      if (xpDelta > 0) {
        grantCalloutXp(desc.notifyLabel, xpDelta, desc.notifyColor);
      }
      playSound('ui_callout_oneshot');
    }
  }

  // 2. Wielobójstwo czasowe (okno do 2s między kolejnymi zgonami)
  if ((now - calloutState.lastKillAtMs) <= CALLOUT_CONFIG.MULTI_KILL_WINDOW_MS) {
    calloutState.multiKillCount += 1;
  } else {
    calloutState.multiKillCount = 1;
    calloutState.lastMultiKillBubbleId = null;
  }
  calloutState.lastKillAtMs = now;

  if (!triggeredOneShot && calloutState.multiKillCount >= 2) {
    const count = calloutState.multiKillCount;
    const desc = getMultiKillDescriptor(count);
    const sameBurst = (now - calloutState.lastMultiKillSpawnAtMs) <= CALLOUT_CONFIG.SAME_BURST_MERGE_MS;
    const existing = sameBurst ? findBubbleById(calloutState.lastMultiKillBubbleId) : null;

    let xpDelta = desc.xp;
    if (existing) {
      const prevDesc = getMultiKillDescriptor(Math.max(2, count - 1));
      xpDelta = Math.max(0, desc.xp - prevDesc.xp);
      const avgX = (existing.worldX + worldX) * 0.5;
      const avgY = (existing.worldY + worldY) * 0.5;
      upgradeCalloutBubble(existing, desc, avgX, avgY);
    } else {
      const created = spawnCalloutBubble(desc, worldX, worldY);
      calloutState.lastMultiKillBubbleId = created.id;
      calloutState.lastMultiKillSpawnAtMs = now;
    }

    if (xpDelta > 0) {
      grantCalloutXp(desc.notifyLabel, xpDelta, desc.notifyColor);
    }
    playSound('ui_callout_multikill');
  }

  // 3. Zemsta (ważna wyłącznie przed kolejną śmiercią lokalnego gracza)
  if (calloutState.revengeTarget && matchesRevengeTarget(victim, opts, calloutState.revengeTarget)) {
    const revName = calloutState.revengeTarget.name || (victim && victim.name) || opts.victimName || '';
    calloutState.revengeTarget = null;
    const revDesc = getRevengeDescriptor(revName);
    spawnCalloutBubble(revDesc, worldX, worldY);
    grantCalloutXp(revDesc.notifyLabel, revDesc.xp, revDesc.notifyColor);
    playSound('ui_callout_revenge');
  }
}

export function updateCallouts(dt = 1 / 60) {
  if (!calloutState.bubbles.length) return;
  const step = (typeof dt === 'number' && dt > 0 && dt < 0.25) ? dt : (1 / 60);
  for (let i = calloutState.bubbles.length - 1; i >= 0; i--) {
    const b = calloutState.bubbles[i];
    b.age += step;
    b.popAge += step;
    if (b.age >= b.lifetime) {
      calloutState.bubbles.splice(i, 1);
    }
  }
}
