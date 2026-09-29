// =========================================================================
// OBSTACLES.JS - WIELOPOZIOMOWE WYSPY ARENY I OBSŁUGA KOLIZJI PLATFORM
// =========================================================================

import { ARENA_LEFT, ARENA_RIGHT, START_X, ARENA_WIDTH } from './config.js';
import { triggerScreenShake, triggerGoalCelebration, spawnJetpackSparks, resolveSegmentCollision, distToSegment } from './world.js';
import { bot } from './bot.js';
import { bullets, spawnHitSparks, spawnBulletSparks } from './weapons.js';

export const obstacles = [];
export const customObstacles = [];
export let _activePlayer = null;
export let _activeBall = null;

export const OBSTACLE_PALETTE = {
  ARENA_1: [
    { type: 'catwalk', name: 'Stalowa Kładka', label: '⛓️ Kładka', category: 'platforms', w: 200, h: 14, isPlatform: true, oneWay: true, chains: [25, 175] },
    { type: 'sniper_tower', name: 'Wieża Snajperska', label: '🗼 Ambona', category: 'platforms', w: 90, h: 160, isPlatform: true, oneWay: true },
    { type: 'metal_ramp_left', name: 'Rampa Lewa', label: '📐 Rampa L', category: 'platforms', w: 80, h: 40, isPlatform: true },
    { type: 'metal_ramp_right', name: 'Rampa Prawa', label: '📐 Rampa P', category: 'platforms', w: 80, h: 40, isPlatform: true },
    { type: 'tall_concrete_wall', name: 'Mur Zbrojony', label: '🏛️ Mur', category: 'defense', w: 26, h: 110, solid: true },
    { type: 'bunker_block', name: 'Blok Betonowy', label: '🛡️ Blok', category: 'defense', w: 120, h: 40, isPlatform: true, solid: true },
    { type: 'sandbags', name: 'Worki z Piaskiem', label: '🧱 Worki', category: 'defense', w: 55, h: 22, isPlatform: true, solid: true },
    { type: 'ammo_depot', name: 'Skrzynia Ammo', label: '📦 Ammo', category: 'defense', w: 42, h: 28, isPlatform: true, solid: true },
    { type: 'explosive_barrel', name: 'Beczka Wybuchowa', label: '💥 Beczka', category: 'traps', w: 22, h: 34, solid: true },
    { type: 'barbed_wire', name: 'Drut Kolczasty', label: '🕸️ Drut', category: 'traps', w: 60, h: 18 },
    { type: 'hedgehog', name: 'Jeż Stalowy', label: '✖️ Jeż', category: 'traps', w: 32, h: 32, size: 32, isHedgehog: true }
  ],
  ARENA_2: [
    { type: 'cyber_catwalk', name: 'Cyber Kładka', label: '⚡ Cyber Kładka', category: 'platforms', w: 200, h: 16, isPlatform: true, oneWay: true },
    { type: 'floating_hex', name: 'Heksagon Lewitujący', label: '⬡ Heksagon', category: 'platforms', w: 110, h: 16, isPlatform: true, oneWay: true },
    { type: 'cyber_pillar', name: 'Pylon Neonowy', label: '🗼 Pylon', category: 'defense', w: 24, h: 120, isPlatform: true, solid: true },
    { type: 'neon_barrier', name: 'Bariera Energetyczna', label: '💠 Bariera', category: 'defense', w: 60, h: 24, isPlatform: true, solid: true },
    { type: 'speed_booster_pad', name: 'Pas Przyspieszający', label: '⏩ Booster', category: 'traps', w: 80, h: 10 },
    { type: 'gravity_lift', name: 'Winda Grawitacyjna', label: '⬆️ Grav-Lift', category: 'traps', w: 50, h: 180 },
    { type: 'cyber_bumper', name: 'Bumper Pinball', label: '🔘 Bumper', category: 'traps', w: 40, h: 40, size: 40, radius: 20 },
    { type: 'laser_gate', name: 'Brama Laserowa', label: '🚨 Laser', category: 'traps', w: 12, h: 140 },
    { type: 'jump_pad', name: 'Jump Pad', label: '🚀 Jump Pad', category: 'traps', w: 70, h: 14, isPlatform: true, isJumpPad: true }
  ]
};

export function getObstacleDef(type) {
  for (const arenaKey of ['ARENA_1', 'ARENA_2']) {
    const found = OBSTACLE_PALETTE[arenaKey].find(d => d.type === type);
    if (found) return found;
  }
  return null;
}

export function clearCustomObstacles() {
  customObstacles.length = 0;
}

export function undoCustomObstacle() {
  return customObstacles.pop();
}

// =========================================================================
// ARENA 1: SOLDAT NIGHT OPS (TAKTYCZNA BAZA WOJSKOWA 3200 PX)
// =========================================================================
export const ARENA_1_PLATFORMS = [
  {
    id: 'west_bastion_fortress',
    type: 'rock_platform',
    isBastion: true,
    theme: 'cyan',
    x: START_X + 20,
    w: 380,
    relY: 130,
    thickness: 22,
    props: [
      { type: 'bunker_tier', rx: 150, w: 140, h: 30 },
      { type: 'sandbags', rx: 310, w: 50, h: 20 },
      { type: 'crate', rx: 40, w: 36, h: 26 }
    ]
  },
  {
    id: 'catwalk_goal_west',
    type: 'catwalk',
    x: START_X + 20,
    w: 260,
    relY: 500,
    thickness: 16,
    chains: [30, 230]
  },
  {
    id: 'central_altar_platform',
    type: 'altar_island',
    isAltar: true,
    x: START_X + 1440,
    w: 320,
    relY: 190,
    thickness: 24,
    props: [
      { type: 'altar_pedestal', rx: 90, w: 140, h: 32 },
      { type: 'sandbags', rx: 20, w: 45, h: 20 },
      { type: 'sandbags', rx: 255, w: 45, h: 20 }
    ]
  },
  {
    id: 'catwalk_goal_east',
    type: 'catwalk',
    x: START_X + ARENA_WIDTH - 280,
    w: 260,
    relY: 500,
    thickness: 16,
    chains: [30, 230]
  },
  {
    id: 'east_bastion_fortress',
    type: 'rock_platform',
    isBastion: true,
    theme: 'orange',
    x: START_X + 2800,
    w: 380,
    relY: 130,
    thickness: 22,
    props: [
      { type: 'sandbags', rx: 20, w: 50, h: 20 },
      { type: 'bunker_tier', rx: 90, w: 140, h: 30 },
      { type: 'crate', rx: 300, w: 36, h: 26 }
    ]
  }
];

export const ARENA_1_BARRICADES = [];

export const ARENA_1_GOALS = [
  {
    id: 'goal_arena1_west',
    team: 'CYAN',
    x: START_X + 35,
    relY: 500,
    w: 100,
    h: 125,
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.85)',
    facing: 1
  },
  {
    id: 'goal_arena1_east',
    team: 'ORANGE',
    x: START_X + ARENA_WIDTH - 135,
    relY: 500,
    w: 100,
    h: 125,
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.85)',
    facing: -1
  }
];

export const arena1State = {
  waitingForKickoff: true,
  kickoffCooldown: 0,
  initialSetupDone: false,
  altarX: START_X + ARENA_WIDTH / 2,
  altarRelY: 245
};

const altarShockwaves = [];
export function spawnAltarShockwave(x, y) {
  altarShockwaves.push({
    x,
    y,
    radius: 12,
    maxRadius: 95,
    alpha: 1.0,
    color: '#00e5ff'
  });
}

// =========================================================================
// ARENA 2: CYBERPUNKOWE KOLOSEUM (CYBER STADIUM)
// =========================================================================
export const ARENA_CYBER_STADIUM_PLATFORMS = [
  {
    id: 'cyber_bastion_west',
    type: 'rock_platform',
    isCyberBastion: true,
    theme: 'cyan',
    x: 160,
    w: 280,
    relY: 240,
    thickness: 22,
    props: [
      { type: 'bunker_tier', rx: 20, w: 90, h: 28 },
      { type: 'sandbags', rx: 130, w: 50, h: 20 }
    ]
  },
  {
    id: 'cyber_bastion_east',
    type: 'rock_platform',
    isCyberBastion: true,
    theme: 'orange',
    x: 1480,
    w: 280,
    relY: 240,
    thickness: 22,
    props: [
      { type: 'sandbags', rx: 100, w: 50, h: 20 },
      { type: 'bunker_tier', rx: 170, w: 90, h: 28 }
    ]
  }
];

export const ARENA_CYBER_STADIUM_BARRICADES = [];

export const ARENA_CYBER_STADIUM_GOALS = [
  {
    id: 'goal_cyan',
    team: 'CYAN',
    x: 180,
    relY: 240,
    w: 90,
    h: 110,
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.85)',
    facing: 1
  },
  {
    id: 'goal_orange',
    team: 'ORANGE',
    x: 1650,
    relY: 240,
    w: 90,
    h: 110,
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.85)',
    facing: -1
  }
];

export let activeArenaId = 'ARENA_1';
export const ARENA_PLATFORMS = [...ARENA_1_PLATFORMS];
export const GROUND_BARRICADES = [...ARENA_1_BARRICADES];
export const GOALS = [...ARENA_1_GOALS];
export const arenaScore = { cyan: 0, orange: 0 };
export let goalCelebrationTimer = 0;

export function setGoalCelebrationTimer(val) {
  goalCelebrationTimer = val;
}

export function switchArena(arenaId, playerObj, botObj, ballObj) {
  activeArenaId = (arenaId === 'ARENA_2' || arenaId === 2 || arenaId === 'CYBER_STADIUM') ? 'ARENA_2' : 'ARENA_1';

  ARENA_PLATFORMS.length = 0;
  GROUND_BARRICADES.length = 0;
  GOALS.length = 0;

  const groundY = (typeof window !== 'undefined' && window.innerHeight) ? (window.innerHeight - 75) : 500;

  if (activeArenaId === 'ARENA_2') {
    ARENA_PLATFORMS.push(...ARENA_CYBER_STADIUM_PLATFORMS);
    GROUND_BARRICADES.push(...ARENA_CYBER_STADIUM_BARRICADES);
    GOALS.push(...ARENA_CYBER_STADIUM_GOALS);
    arena1State.waitingForKickoff = false;

    if (playerObj) {
      playerObj.x = 750;
      playerObj.y = groundY - playerObj.h;
      playerObj.vx = 0;
      playerObj.vy = 0;
      playerObj.facing = 1;
      playerObj.isIntro = false;
      playerObj.isJumping = false;
      playerObj.isSliding = false;
      playerObj.gaitMode = 'IDLE';
    }
    if (botObj) {
      botObj.active = true;
      botObj.x = 1170;
      botObj.y = groundY - botObj.h;
      botObj.vx = 0;
      botObj.vy = 0;
      botObj.facing = -1;
      botObj.isJumping = false;
      botObj.isSliding = false;
      botObj.gaitMode = 'IDLE';
    }
    if (ballObj) {
      ballObj.x = 960;
      ballObj.y = groundY - ballObj.colRadius;
      ballObj.vx = 0;
      ballObj.vy = 0;
      ballObj.spin = 0;
      ballObj.trail = [];
    }
  } else {
    ARENA_PLATFORMS.push(...ARENA_1_PLATFORMS);
    GROUND_BARRICADES.push(...ARENA_1_BARRICADES);
    GOALS.push(...ARENA_1_GOALS);

    arena1State.waitingForKickoff = true;
    arena1State.kickoffCooldown = 0;

    if (playerObj) {
      playerObj.x = START_X + 240;
      playerObj.y = groundY - 130 - playerObj.h;
      playerObj.vx = 0;
      playerObj.vy = 0;
      playerObj.facing = 1;
      playerObj.isIntro = false;
      playerObj.juggleTimer = 0;
      playerObj.isJumping = false;
      playerObj.isSliding = false;
      playerObj.gaitMode = 'IDLE';
    }
    if (botObj) {
      botObj.x = START_X + ARENA_WIDTH - 240;
      botObj.y = groundY - 130 - botObj.h;
      botObj.vx = 0;
      botObj.vy = 0;
      botObj.facing = -1;
      botObj.isJumping = false;
      botObj.isSliding = false;
      botObj.gaitMode = 'IDLE';
    }
    if (ballObj) {
      ballObj.x = arena1State.altarX;
      ballObj.y = groundY - arena1State.altarRelY;
      ballObj.vx = 0;
      ballObj.vy = 0;
      ballObj.spin = 0;
      ballObj.trail = [];
    }
  }

  return activeArenaId;
}

export function getPlatformSurfaceY(plat, px, groundY) {
  return groundY - plat.relY;
}

// =========================================================================
// SYSTEM EKSPLOZJI BECZEK I CZĄSTECZEK OGNIOWYCH
// =========================================================================
export const barrelExplosionParticles = [];

export function spawnBarrelExplosion(cx, cy) {
  for (let i = 0; i < 28; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 7.5 + 2.5;
    barrelExplosionParticles.push({
      type: 'fire',
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.8,
      size: Math.random() * 8 + 6,
      life: 1.0,
      decay: Math.random() * 0.035 + 0.025,
      color: Math.random() < 0.4 ? '#f97316' : (Math.random() < 0.7 ? '#ef4444' : '#facc15')
    });
  }
  for (let i = 0; i < 16; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3.5 + 1.0;
    barrelExplosionParticles.push({
      type: 'smoke',
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2.8,
      size: Math.random() * 14 + 8,
      life: 1.0,
      decay: Math.random() * 0.02 + 0.015,
      color: '#334155'
    });
  }
  spawnAltarShockwave(cx, cy);
}

export function updateBarrelExplosionParticles() {
  for (let i = barrelExplosionParticles.length - 1; i >= 0; i--) {
    const p = barrelExplosionParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.94;
    p.vy *= 0.94;
    if (p.type === 'smoke') {
      p.vy -= 0.04;
      p.size += 0.25;
    }
    p.life -= p.decay;
    if (p.life <= 0) {
      barrelExplosionParticles.splice(i, 1);
    }
  }
}

export function drawBarrelExplosionParticles(ctx) {
  for (const p of barrelExplosionParticles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    if (p.type === 'fire') {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, p.size * p.life), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function explodeBarrel(barrel, groundY) {
  if (!barrel || barrel.exploded) return;
  barrel.exploded = true;

  const idx = customObstacles.indexOf(barrel);
  if (idx !== -1) {
    customObstacles.splice(idx, 1);
  }

  const topY = barrel.y !== undefined ? barrel.y : (groundY - barrel.relY);
  const cx = barrel.x + barrel.w / 2;
  const cy = topY + barrel.h / 2;

  triggerScreenShake(8);
  spawnBarrelExplosion(cx, cy);

  const radius = 120;
  const maxDmg = 45;

  if (_activePlayer && !_activePlayer.isDead) {
    const px = _activePlayer.x + _activePlayer.w / 2;
    const py = _activePlayer.y + _activePlayer.h / 2;
    const distP = Math.hypot(px - cx, py - cy);
    if (distP <= radius) {
      const dmg = Math.round(maxDmg * (1 - distP / radius * 0.45));
      _activePlayer.hp = Math.max(0, (_activePlayer.hp !== undefined ? _activePlayer.hp : 100) - dmg);
      const nx = distP > 0.001 ? (px - cx) / distP : 0;
      const push = (1 - distP / radius) * 14 + 7;
      _activePlayer.vx += nx * push;
      _activePlayer.vy = -Math.abs(push * 0.75) - 4.5;
      _activePlayer.isJumping = true;
      if (_activePlayer.hp <= 0 && !_activePlayer.isDead) {
        _activePlayer.isDead = true;
        _activePlayer.respawnTimer = 180;
      }
    }
  }

  if (bot && bot.active && !bot.isDead) {
    const bx = bot.x + bot.w / 2;
    const by = bot.y + bot.h / 2;
    const distB = Math.hypot(bx - cx, by - cy);
    if (distB <= radius) {
      const dmg = Math.round(maxDmg * (1 - distB / radius * 0.45));
      bot.hp = Math.max(0, (bot.hp !== undefined ? bot.hp : 100) - dmg);
      const nx = distB > 0.001 ? (bx - cx) / distB : 0;
      const push = (1 - distB / radius) * 14 + 7;
      bot.vx += nx * push;
      bot.vy = -Math.abs(push * 0.75) - 4.5;
      bot.isJumping = true;
      if (bot.hp <= 0 && !bot.isDead) {
        bot.isDead = true;
        bot.respawnTimer = 180;
      }
    }
  }

  if (_activeBall) {
    const distBall = Math.hypot(_activeBall.x - cx, _activeBall.y - cy);
    if (distBall <= radius) {
      const nx = distBall > 0.001 ? (_activeBall.x - cx) / distBall : (Math.random() - 0.5);
      const push = (1 - distBall / radius) * 18 + 9;
      _activeBall.vx += nx * push;
      _activeBall.vy = -Math.abs(push * 0.75) - 6;
      _activeBall.spin = (_activeBall.vx > 0 ? 1 : -1) * 0.9;
    }
  }

  for (let i = customObstacles.length - 1; i >= 0; i--) {
    const other = customObstacles[i];
    if (other && other.type === 'explosive_barrel' && !other.exploded) {
      const otherTopY = other.y !== undefined ? other.y : (groundY - other.relY);
      const ocx = other.x + other.w / 2;
      const ocy = otherTopY + other.h / 2;
      if (Math.hypot(ocx - cx, ocy - cy) <= radius) {
        explodeBarrel(other, groundY);
      }
    }
  }
}

// =========================================================================
// OBSŁUGA LĄDOWANIA I ZESKOKU (DROP-THROUGH)
// =========================================================================
export function checkPlayerPlatformLanding(p, groundY) {
  if (!p || p.isIntro) return;

  if (p.boostCooldown > 0) p.boostCooldown--;
  if (p.laserCooldown > 0) p.laserCooldown--;

  const feetY = p.y + p.h;
  const centerX = p.x + p.w / 2;

  // POPRAWKA: Zeskok w dół następuje WYŁĄCZNIE gdy aktywuje się dropThroughTimer
  // (np. podwójne szarpnięcie drążkiem w dół lub podwójne 'S').
  // Kucanie (p.isCrouching) NIE zrzuca już gracza z platformy!
  const wantDrop = (p.dropThroughTimer > 0);

  if (wantDrop) {
    for (const plat of ARENA_PLATFORMS) {
      if (centerX >= plat.x - 6 && centerX <= plat.x + plat.w + 6) {
        const topY = getPlatformSurfaceY(plat, centerX, groundY);

        if (Math.abs(feetY - topY) <= 14 && p.y < groundY - p.h - 2) {
          p.y = topY - p.h + 12;
          p.vy = 2.8;
          p.isJumping = true;
          p.isCrouching = false;
          p.airVx = p.vx;
          p.currentGroundY = groundY;
          return;
        }

        if (plat.props) {
          const tier = plat.props.find(pr => pr.type === 'bunker_tier' || pr.type === 'altar_pedestal');
          if (tier) {
            const tierLeft = plat.x + tier.rx;
            const tierRight = tierLeft + tier.w;
            if (centerX >= tierLeft - 4 && centerX <= tierRight + 4) {
              const tierTopY = topY - tier.h;
              if (Math.abs(feetY - tierTopY) <= 14 && p.y < groundY - p.h - 2) {
                p.y = tierTopY - p.h + 12;
                p.vy = 2.8;
                p.isJumping = true;
                p.isCrouching = false;
                p.airVx = p.vx;
                p.currentGroundY = groundY;
                return;
              }
            }
          }
        }
      }
    }

    for (const obs of customObstacles) {
      if (obs.type === 'catwalk' || obs.type === 'cyber_catwalk' || obs.type === 'floating_hex' || obs.type === 'sniper_tower' || obs.type === 'metal_ramp_left' || obs.type === 'metal_ramp_right') {
        const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
        if (centerX >= obs.x - 6 && centerX <= obs.x + obs.w + 6) {
          let surfaceY = topY;
          if (obs.type === 'metal_ramp_left') {
            const t = Math.max(0, Math.min(1, (centerX - obs.x) / obs.w));
            surfaceY = topY + t * obs.h;
          } else if (obs.type === 'metal_ramp_right') {
            const t = Math.max(0, Math.min(1, (centerX - obs.x) / obs.w));
            surfaceY = topY + (1 - t) * obs.h;
          }
          if (Math.abs(feetY - surfaceY) <= 16 && p.y < groundY - p.h - 2) {
            p.y = surfaceY - p.h + 12;
            p.vy = 2.8;
            p.isJumping = true;
            p.isCrouching = false;
            p.airVx = p.vx;
            p.currentGroundY = groundY;
            return;
          }
        }
      }
    }

    p.currentGroundY = groundY;
    return;
  }

  // Interaktywne przeszkody gracza (customObstacles)
  for (const obs of customObstacles) {
    const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
    const bottomY = topY + obs.h;

    if (obs.type === 'jump_pad') {
      if (centerX >= obs.x - 6 && centerX <= obs.x + obs.w + 6) {
        if (feetY >= topY - 14 && feetY <= topY + Math.max(22, p.vy + 12)) {
          p.y = topY - p.h - 4;
          p.vy = -12.5;
          p.isJumping = true;
          p.isCrouching = false;
          p.airVx = p.vx;
          triggerScreenShake(5.0);
          spawnJetpackSparks(centerX, topY, 0, 6);
          return;
        }
      }
    } else if (obs.type === 'speed_booster_pad') {
      if (centerX >= obs.x && centerX <= obs.x + obs.w && feetY >= topY - 8 && feetY <= topY + 12) {
        if (!p.boostCooldown || p.boostCooldown <= 0) {
          const facing = p.facing || (p.vx >= 0 ? 1 : -1);
          p.vx += facing * 8.5;
          p.boostCooldown = 18;
          spawnJetpackSparks(centerX, topY, facing, 5);
          triggerScreenShake(3.0);
        }
      }
    } else if (obs.type === 'gravity_lift') {
      if (p.x + p.w > obs.x && p.x < obs.x + obs.w && feetY > topY && p.y < bottomY) {
        p.vy = Math.max(-6.5, p.vy - 0.7);
        p.isJumping = true;
        p.airVx = p.vx;
        spawnJetpackSparks(centerX, p.y + p.h, 0, 1);
      }
    } else if (obs.type === 'cyber_bumper') {
      const cx = obs.x + obs.w / 2;
      const cy = topY + obs.h / 2;
      const px = p.x + p.w / 2;
      const py = p.y + p.h / 2;
      const bdist = Math.hypot(px - cx, py - cy);
      if (bdist < 20 + 16) {
        const nx = bdist > 0.001 ? (px - cx) / bdist : 0;
        const ny = bdist > 0.001 ? (py - cy) / bdist : -1;
        p.x = cx + nx * 38 - p.w / 2;
        p.y = cy + ny * 38 - p.h / 2;
        p.vx = nx * 15.0;
        p.vy = ny * 15.0;
        p.isJumping = true;
        obs.hitTimer = 14;
        triggerScreenShake(5.0);
        spawnJetpackSparks(cx + nx * 20, cy + ny * 20, 0, 8);
      }
    } else if (obs.type === 'barbed_wire') {
      if (p.x + p.w > obs.x && p.x < obs.x + obs.w && feetY >= topY && p.y <= bottomY) {
        p.vx *= 0.45;
        obs.wireDmgTick = (obs.wireDmgTick || 0) + 1;
        if (obs.wireDmgTick % 18 === 0) {
          p.hp = Math.max(0, (p.hp !== undefined ? p.hp : 100) - 1);
          if (p.hp <= 0 && !p.isDead) { p.isDead = true; p.respawnTimer = 180; }
        }
      }
    } else if (obs.type === 'laser_gate') {
      if (p.x + p.w > obs.x && p.x < obs.x + obs.w && feetY > topY && p.y < bottomY) {
        if (!p.laserCooldown || p.laserCooldown <= 0) {
          p.hp = Math.max(0, (p.hp !== undefined ? p.hp : 100) - 15);
          p.laserCooldown = 30;
          triggerScreenShake(4.0);
          spawnHitSparks(obs.x + obs.w / 2, p.y + p.h / 2, 0, -1, 6);
          if (p.hp <= 0 && !p.isDead) { p.isDead = true; p.respawnTimer = 180; }
        }
      }
    }
  }

  let landedSurface = null;

  for (const plat of ARENA_PLATFORMS) {
    if (centerX >= plat.x - 4 && centerX <= plat.x + plat.w + 4) {
      const topY = getPlatformSurfaceY(plat, centerX, groundY);
      const prevFeetY = feetY - p.vy;
      const isLanding = p.vy >= 0 && prevFeetY <= topY + 12 && feetY >= topY - 10 && feetY <= topY + Math.max(20, p.vy + 10);

      if (isLanding) {
        landedSurface = topY;
        break;
      }
    }
  }

  for (const obs of customObstacles) {
    if (obs.type === 'hedgehog' || obs.type === 'gravity_lift' || obs.type === 'barbed_wire' || obs.type === 'laser_gate' || obs.type === 'cyber_bumper' || obs.type === 'speed_booster_pad') {
      continue;
    }

    const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);

    if (obs.type === 'metal_ramp_left') {
      if (centerX >= obs.x - 4 && centerX <= obs.x + obs.w + 4) {
        const t = Math.max(0, Math.min(1, (centerX - obs.x) / obs.w));
        const rampSurfaceY = topY + t * obs.h;
        const prevFeetY = feetY - p.vy;
        const isLanding = p.vy >= 0 && prevFeetY <= rampSurfaceY + 12 && feetY >= rampSurfaceY - 10 && feetY <= rampSurfaceY + Math.max(20, p.vy + 10);
        if (isLanding) {
          if (landedSurface === null || rampSurfaceY < landedSurface) {
            landedSurface = rampSurfaceY;
          }
        }
      }
    } else if (obs.type === 'metal_ramp_right') {
      if (centerX >= obs.x - 4 && centerX <= obs.x + obs.w + 4) {
        const t = Math.max(0, Math.min(1, (centerX - obs.x) / obs.w));
        const rampSurfaceY = topY + (1 - t) * obs.h;
        const prevFeetY = feetY - p.vy;
        const isLanding = p.vy >= 0 && prevFeetY <= rampSurfaceY + 12 && feetY >= rampSurfaceY - 10 && feetY <= rampSurfaceY + Math.max(20, p.vy + 10);
        if (isLanding) {
          if (landedSurface === null || rampSurfaceY < landedSurface) {
            landedSurface = rampSurfaceY;
          }
        }
      }
    } else {
      if (centerX >= obs.x - 4 && centerX <= obs.x + obs.w + 4) {
        const prevFeetY = feetY - p.vy;
        const isLanding = p.vy >= 0 && prevFeetY <= topY + 12 && feetY >= topY - 10 && feetY <= topY + Math.max(20, p.vy + 10);
        if (isLanding) {
          if (landedSurface === null || topY < landedSurface) {
            landedSurface = topY;
          }
        }
      }
    }
  }

  for (const obs of customObstacles) {
    if (obs.type === 'bunker_block' || obs.type === 'cyber_pillar' || obs.type === 'tall_concrete_wall' || obs.type === 'explosive_barrel') {
      const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
      const bottomY = topY + obs.h;
      if (feetY > topY + 8 && p.y < bottomY - 4) {
        if (p.x + p.w > obs.x && p.x < obs.x + obs.w) {
          const midX = obs.x + obs.w / 2;
          if (p.x + p.w / 2 < midX) {
            p.x = obs.x - p.w;
            if (p.vx > 0) p.vx = 0;
          } else {
            p.x = obs.x + obs.w;
            if (p.vx < 0) p.vx = 0;
          }
        }
      }
    }
  }

  if (landedSurface === null) {
    for (const plat of ARENA_PLATFORMS) {
      if (plat.props) {
        const tier = plat.props.find(pr => pr.type === 'bunker_tier' || pr.type === 'altar_pedestal');
        if (tier) {
          const tierLeft = plat.x + tier.rx;
          const tierRight = tierLeft + tier.w;
          if (centerX >= tierLeft - 3 && centerX <= tierRight + 3) {
            const tierTopY = getPlatformSurfaceY(plat, centerX, groundY) - tier.h;
            const prevFeetY = feetY - p.vy;
            if (p.vy >= 0 && prevFeetY <= tierTopY + 12 && feetY >= tierTopY - 8 && feetY <= tierTopY + Math.max(18, p.vy + 10)) {
              landedSurface = tierTopY;
              break;
            }
          }
        }
      }
    }
  }

  if (landedSurface !== null) {
    p.y = landedSurface - p.h;
    p.vy = 0;
    p.isJumping = false;
    p.airVx = 0;
    p.currentGroundY = landedSurface;
    if (p.jetFuel < p.jetMax) {
      p.jetFuel = Math.min(p.jetMax, p.jetFuel + 2.5);
    }
  } else {
    p.currentGroundY = groundY;
  }
}

export function resolveBallObstacleCollisions(ball, groundY) {
  if (!ball) return;
  const speed = Math.hypot(ball.vx, ball.vy);
  const cR = ball.colRadius !== undefined ? ball.colRadius : ball.radius;
  const prevX = ball.prevX !== undefined ? ball.prevX : (ball.x - ball.vx);
  const prevY = ball.prevY !== undefined ? ball.prevY : (ball.y - ball.vy);

  for (const plat of ARENA_PLATFORMS) {
    if (plat.type === 'catwalk') {
      const topY = groundY - plat.relY;
      const platLeft = plat.x;
      const platRight = plat.x + plat.w;

      if (ball.x >= platLeft - cR && ball.x <= platRight + cR) {
        if (ball.vy > 0) {
          const prevBottomY = (ball.y - ball.vy) + cR;
          if (ball.y + cR >= topY && prevBottomY <= topY + 8) {
            ball.y = topY - cR;
            ball.vy = Math.abs(ball.vy) > 0.8 ? -ball.vy * 0.65 : 0;
            ball.vx *= 0.98;
            ball.spin *= 0.94;
            ball.rotation += ball.vx * 0.08;
            if (speed > 8.0) triggerScreenShake(2.5);
          }
        }
      }
    } else {
      const topY = groundY - plat.relY;
      const platLeft = plat.x;
      const platRight = plat.x + plat.w;
      const thickness = plat.thickness || 20;

      if (ball.x >= platLeft - cR && ball.x <= platRight + cR) {
        const prevBottomY = prevY + cR;
        const curBottomY = ball.y + cR;

        if (ball.vy > 0 && prevBottomY <= topY + 14 && curBottomY >= topY && ball.y - cR <= topY + thickness + 10) {
          ball.y = topY - cR;
          ball.vy = Math.abs(ball.vy) > 0.8 ? -ball.vy * 0.65 : 0;
          ball.vx *= 0.98;
          ball.spin *= 0.94;
          ball.rotation += ball.vx * 0.08;
          if (speed > 8.0) triggerScreenShake(2.5);
        }
      }

      if (plat.props) {
        for (const prop of plat.props) {
          if (prop.type === 'bunker_tier' || prop.type === 'altar_pedestal') {
            const bx = plat.x + prop.rx;
            const by = topY - prop.h;
            const bw = prop.w;
            const bh = prop.h;

            const clampX = Math.max(bx, Math.min(bx + bw, ball.x));
            const clampY = Math.max(by, Math.min(by + bh, ball.y));
            const cdx = ball.x - clampX;
            const cdy = ball.y - clampY;
            const cdist = Math.hypot(cdx, cdy);

            if (cdist < cR) {
              let cnx = 0, cny = -1;
              if (cdist > 0.001) {
                cnx = cdx / cdist;
                cny = cdy / cdist;
              }
              const pen = cR - cdist;
              ball.x += cnx * pen;
              ball.y += cny * pen;

              const bvn = ball.vx * cnx + ball.vy * cny;
              if (bvn < 0) {
                const bjn = -(1 + 0.65) * bvn;
                ball.vx += bjn * cnx;
                ball.vy += bjn * cny;
              }
            }
          }
        }
      }
    }
  }

  for (const bar of GROUND_BARRICADES) {
    if (bar.type === 'sandbags' || bar.type === 'ammo_depot') {
      const barLeft = bar.x;
      const barRight = bar.x + bar.w;
      const barTop = groundY - bar.h;
      const barBottom = groundY;

      const ballLeft = ball.x - cR;
      const ballRight = ball.x + cR;
      const ballTop = ball.y - cR;
      const ballBottom = ball.y + cR;

      if (ballRight > barLeft && ballLeft < barRight && ballBottom > barTop && ballTop < barBottom) {
        const overlapLeft = ballRight - barLeft;
        const overlapRight = barRight - ballLeft;
        const overlapTop = ballBottom - barTop;

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop);
        const isRollingFlat = Math.abs(ball.vy) < 1.0 || (ball.y + cR >= groundY - 4);

        if (minOverlap === overlapTop && ball.vy >= 0) {
          ball.y = barTop - cR;
          ball.vy = -Math.abs(ball.vy) * 0.55;
          ball.vx *= 0.88;
        } else if (minOverlap === overlapLeft) {
          ball.x = barLeft - cR;
          ball.vx = -Math.abs(ball.vx) * 0.70;
          if (isRollingFlat) ball.vy = 0;
        } else if (minOverlap === overlapRight) {
          ball.x = barRight + cR;
          ball.vx = Math.abs(ball.vx) * 0.70;
          if (isRollingFlat) ball.vy = 0;
        }
      }
    } else if (bar.type === 'hedgehog') {
      const hcx = bar.x;
      const hcy = groundY - bar.size / 2;
      const hr = bar.size / 2;
      const hdx = ball.x - hcx;
      const hdy = ball.y - hcy;
      const hd = Math.hypot(hdx, hdy);
      const minDistH = cR + hr;

      if (hd < minDistH) {
        const hnx = hd > 0.001 ? hdx / hd : 0;
        const hny = hd > 0.001 ? hdy / hd : -1;
        const hpen = minDistH - hd;
        ball.x += hnx * hpen;
        ball.y += hny * hpen;
        ball.vx = -ball.vx * 0.65;
        ball.vy *= 0.5;
        if (ball.y + cR >= groundY - 4 && ball.vy < 0) ball.vy = 0;
        if (speed > 6.0) triggerScreenShake(2.2);
      }
    }
  }

  for (const obs of customObstacles) {
    const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
    const bottomY = topY + obs.h;
    const obsLeft = obs.x;
    const obsRight = obs.x + obs.w;

    if (obs.type === 'cyber_bumper') {
      const cx = obs.x + obs.w / 2;
      const cy = topY + obs.h / 2;
      const br = 20;
      const bdx = ball.x - cx;
      const bdy = ball.y - cy;
      const bdist = Math.hypot(bdx, bdy);
      if (bdist < br + cR) {
        const bnx = bdist > 0.001 ? bdx / bdist : 0;
        const bny = bdist > 0.001 ? bdy / bdist : -1;
        ball.x = cx + bnx * (br + cR + 2);
        ball.y = cy + bny * (br + cR + 2);
        const impulse = Math.max(16.0, Math.hypot(ball.vx, ball.vy) * 2.2);
        ball.vx = bnx * impulse;
        ball.vy = bny * impulse;
        ball.spin = (ball.vx > 0 ? 1 : -1) * 0.9;
        obs.hitTimer = 14;
        triggerScreenShake(5.0);
        spawnAltarShockwave(cx, cy);
        continue;
      }
    } else if (obs.type === 'speed_booster_pad') {
      if (ball.x >= obsLeft - cR && ball.x <= obsRight + cR && ball.y + cR >= topY - 3 && ball.y - cR <= bottomY) {
        const dir = Math.abs(ball.vx) > 0.5 ? Math.sign(ball.vx) : 1;
        ball.y = topY - cR;
        ball.vx = dir * (Math.abs(ball.vx) + 8.5);
        ball.vy = -3.2;
        spawnJetpackSparks(ball.x, topY, dir, 4);
        triggerScreenShake(2.5);
        continue;
      }
    } else if (obs.type === 'gravity_lift') {
      if (ball.x >= obsLeft - cR && ball.x <= obsRight + cR && ball.y >= topY - cR && ball.y <= bottomY + cR) {
        ball.vy = Math.max(-6.5, ball.vy - 0.7);
        continue;
      }
    } else if (obs.type === 'metal_ramp_left') {
      resolveSegmentCollision(ball, obs.x, topY, obs.x + obs.w, topY + obs.h, 6, 0, 0, 0, 0, 0.75, 0.20);
      continue;
    } else if (obs.type === 'metal_ramp_right') {
      resolveSegmentCollision(ball, obs.x, topY + obs.h, obs.x + obs.w, topY, 6, 0, 0, 0, 0, 0.75, 0.20);
      continue;
    } else if (obs.type === 'jump_pad') {
      if (ball.x >= obsLeft - cR && ball.x <= obsRight + cR) {
        if (ball.y + cR >= topY - 2 && ball.y - cR <= bottomY) {
          ball.y = topY - cR - 3;
          ball.vy = -14.0;
          ball.vx *= 1.05;
          ball.spin = (ball.vx > 0 ? 1 : -1) * 0.8;
          triggerScreenShake(5.0);
          spawnAltarShockwave(ball.x, topY);
          continue;
        }
      }
    } else if (obs.type === 'catwalk' || obs.type === 'cyber_catwalk' || obs.type === 'floating_hex' || obs.type === 'sniper_tower') {
      if (ball.x >= obsLeft - cR && ball.x <= obsRight + cR) {
        if (ball.vy > 0) {
          const prevBottomY = (ball.y - ball.vy) + cR;
          if (ball.y + cR >= topY && prevBottomY <= topY + 12) {
            ball.y = topY - cR;
            ball.vy = Math.abs(ball.vy) > 0.8 ? -ball.vy * 0.65 : 0;
            ball.vx *= 0.98;
            ball.spin *= 0.94;
            ball.rotation += ball.vx * 0.08;
            if (speed > 8.0) triggerScreenShake(2.5);
          }
        }
      }
    } else if (obs.type === 'barbed_wire') {
      if (ball.x >= obsLeft - cR && ball.x <= obsRight + cR && ball.y + cR >= topY && ball.y - cR <= bottomY) {
        ball.vx *= 0.94;
      }
    } else if (obs.type === 'hedgehog') {
      const hcx = obs.x + obs.w / 2;
      const hcy = topY + obs.h / 2;
      const hr = (obs.size || 32) / 2;
      const hdx = ball.x - hcx;
      const hdy = ball.y - hcy;
      const hd = Math.hypot(hdx, hdy);
      const minDistH = cR + hr;

      if (hd < minDistH) {
        const hnx = hd > 0.001 ? hdx / hd : 0;
        const hny = hd > 0.001 ? hdy / hd : -1;
        const hpen = minDistH - hd;
        ball.x += hnx * hpen;
        ball.y += hny * hpen;
        ball.vx = -ball.vx * 0.70;
        ball.vy = -ball.vy * 0.70;
        if (speed > 6.0) triggerScreenShake(2.2);
      }
    } else {
      const ballLeft = ball.x - cR;
      const ballRight = ball.x + cR;
      const ballTop = ball.y - cR;
      const ballBottom = ball.y + cR;

      if (ballRight > obsLeft && ballLeft < obsRight && ballBottom > topY && ballTop < bottomY) {
        const overlapLeft = ballRight - obsLeft;
        const overlapRight = obsRight - ballLeft;
        const overlapTop = ballBottom - topY;
        const overlapBottom = bottomY - ballTop;

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
        const rest = obs.type === 'laser_gate' ? 0.95 : (obs.type === 'neon_barrier' ? 0.82 : 0.65);

        if (minOverlap === overlapTop && ball.vy >= 0) {
          ball.y = topY - cR;
          ball.vy = -Math.abs(ball.vy) * rest;
          ball.vx *= 0.92;
        } else if (minOverlap === overlapBottom && ball.vy <= 0) {
          ball.y = bottomY + cR;
          ball.vy = Math.abs(ball.vy) * rest;
        } else if (minOverlap === overlapLeft) {
          ball.x = obsLeft - cR;
          ball.vx = -Math.abs(ball.vx) * rest;
        } else if (minOverlap === overlapRight) {
          ball.x = obsRight + cR;
          ball.vx = Math.abs(ball.vx) * rest;
        }
        if (obs.type === 'laser_gate') {
          spawnHitSparks(ball.x, ball.y, ball.vx > 0 ? 1 : -1, 0, 4);
        }
        if (speed > 6.0) triggerScreenShake(2.2);
      }
    }
  }
}

export function checkObstacleCollisions(ball, groundY, p = null) {
  _activeBall = ball;
  _activePlayer = p;

  updateBarrelExplosionParticles();
  for (const obs of customObstacles) {
    if (obs.hitTimer > 0) obs.hitTimer--;
  }

  if (p) {
    checkPlayerPlatformLanding(p, groundY);
  }
  if (ball) {
    resolveBallObstacleCollisions(ball, groundY);
  }

  if (activeArenaId === 'ARENA_1') {
    if (!arena1State.initialSetupDone) {
      arena1State.initialSetupDone = true;
      arena1State.waitingForKickoff = true;
      if (p) {
        p.x = START_X + 240;
        p.y = groundY - 130 - p.h;
        p.vx = 0;
        p.vy = 0;
        p.facing = 1;
        p.isIntro = false;
        p.gaitMode = 'IDLE';
      }
      if (ball) {
        ball.x = arena1State.altarX;
        ball.y = groundY - arena1State.altarRelY;
        ball.vx = 0;
        ball.vy = 0;
        ball.spin = 0;
        ball.trail = [];
      }
    }

    if (p && p.isIntro) {
      p.isIntro = false;
      p.gaitMode = 'IDLE';
      p.x = START_X + 240;
      p.y = groundY - 130 - p.h;
      p.facing = 1;
      arena1State.waitingForKickoff = true;
      arena1State.kickoffCooldown = 0;
      if (ball) {
        ball.x = arena1State.altarX;
        ball.y = groundY - arena1State.altarRelY;
        ball.vx = 0;
        ball.vy = 0;
        ball.spin = 0;
        ball.trail = [];
      }
    }

    if (arena1State.kickoffCooldown > 0) {
      arena1State.kickoffCooldown--;
    }

    if (arena1State.waitingForKickoff && ball) {
      const time = performance.now() * 0.003;
      const hoverY = (groundY - arena1State.altarRelY) + Math.sin(time) * 6;
      ball.x = arena1State.altarX;
      ball.y = hoverY;
      ball.vx = 0;
      ball.vy = 0;
      ball.spin = 0;
      ball.trail = [];

      if (arena1State.kickoffCooldown <= 0) {
        const pCenterX = p ? p.x + p.w / 2 : Infinity;
        const pCenterY = p ? p.y + p.h / 2 : Infinity;
        const distP = Math.hypot(ball.x - pCenterX, ball.y - pCenterY);

        const bCenterX = (bot && bot.active) ? bot.x + bot.w / 2 : Infinity;
        const bCenterY = (bot && bot.active) ? bot.y + bot.h / 2 : Infinity;
        const distB = Math.hypot(ball.x - bCenterX, ball.y - bCenterY);

        const isNear = distP < 55 || distB < 55;
        const isKicking = p && p.kickState === 'SWING' && distP < 85;

        if (isNear || isKicking) {
          arena1State.waitingForKickoff = false;
          triggerScreenShake(7);
          ball.vy = -6.2;
          ball.vx = (distP <= distB) ? ((p?.facing || 1) * 6.5) : ((bot?.facing || -1) * 6.5);
          ball.spin = (ball.vx > 0 ? 1 : -1) * 0.6;
          spawnAltarShockwave(ball.x, ball.y);
        }
      }
    }

    if (!arena1State.waitingForKickoff && ball) {
      for (const g of GOALS) {
        const bottomY = groundY - g.relY;
        const topY = bottomY - g.h;
        const leftX = g.x;
        const rightX = g.x + g.w;

        if (ball.x >= leftX && ball.x <= rightX && ball.y >= topY && ball.y <= bottomY) {
          const scoringTeam = (g.team === 'CYAN') ? 'ORANGE' : 'CYAN';
          if (scoringTeam === 'CYAN') {
            arenaScore.cyan++;
          } else {
            arenaScore.orange++;
          }

          triggerScreenShake(15);
          triggerGoalCelebration(scoringTeam, scoringTeam === 'CYAN' ? '#06b6d4' : '#f97316');

          arena1State.waitingForKickoff = true;
          arena1State.kickoffCooldown = 65;
          ball.x = arena1State.altarX;
          ball.y = groundY - arena1State.altarRelY;
          ball.prevX = ball.x;
          ball.prevY = ball.y;
          ball.vx = 0;
          ball.vy = 0;
          ball.spin = 0;
          ball.trail = [];
          break;
        }
      }
    }
  }
}

function drawHazardStripes(ctx, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = '#eab308';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#18181b';
  for (let sx = x - h; sx < x + w + h; sx += 12) {
    ctx.beginPath();
    ctx.moveTo(sx, y);
    ctx.lineTo(sx + 6, y);
    ctx.lineTo(sx - 2, y + h);
    ctx.lineTo(sx - 8, y + h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawSandbags(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#78716c';
  ctx.strokeStyle = '#44403c';
  ctx.lineWidth = 1.2;
  const bagW = w / 2;
  const bagH = h / 2;
  for (let i = 0; i < 2; i++) {
    ctx.fillRect(x + i * bagW, y + bagH, bagW - 1, bagH);
    ctx.strokeRect(x + i * bagW, y + bagH, bagW - 1, bagH);
  }
  ctx.fillRect(x + bagW * 0.25, y, bagW * 1.5, bagH);
  ctx.strokeRect(x + bagW * 0.25, y, bagW * 1.5, bagH);
  ctx.restore();
}

function drawCrate(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#365314';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#1e3a1e';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + w, y + h);
  ctx.moveTo(x + w, y); ctx.lineTo(x, y + h);
  ctx.stroke();
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 7px monospace';
  ctx.fillText('AMMO', x + 4, y + h / 2 + 2);
  ctx.restore();
}

function drawHedgehog(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(-size / 2, size / 2); ctx.lineTo(size / 2, -size / 2);
  ctx.moveTo(-size / 2, -size / 2); ctx.lineTo(size / 2, size / 2);
  ctx.moveTo(0, -size / 2); ctx.lineTo(0, size / 2);
  ctx.stroke();
  ctx.restore();
}

export function drawBunkerBlock(ctx, x, y, w, h) {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#475569');
  grad.addColorStop(0.35, '#334155');
  grad.addColorStop(1, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x, y, w, 2.5);

  ctx.fillStyle = '#cbd5e1';
  const rRad = 2.2;
  ctx.beginPath();
  ctx.arc(x + 6, y + 6, rRad, 0, Math.PI * 2);
  ctx.arc(x + w - 6, y + 6, rRad, 0, Math.PI * 2);
  ctx.arc(x + 6, y + h - 6, rRad, 0, Math.PI * 2);
  ctx.arc(x + w - 6, y + h - 6, rRad, 0, Math.PI * 2);
  ctx.fill();

  const stripeH = Math.min(10, h * 0.3);
  const stripeY = y + (h - stripeH) / 2;
  drawHazardStripes(ctx, x + 4, stripeY, w - 8, stripeH);

  ctx.fillStyle = '#090d16';
  ctx.fillRect(x + w * 0.25, y + 7, w * 0.5, 4);
  ctx.restore();
}

export function drawCyberCatwalk(ctx, x, y, w, h) {
  ctx.save();
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 25, y); ctx.lineTo(x + 25, y - 180);
  ctx.moveTo(x + w - 25, y); ctx.lineTo(x + w - 25, y - 180);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 10;
  ctx.fillRect(x, y, w, 3);

  ctx.fillStyle = 'rgba(6, 182, 212, 0.18)';
  for (let sx = x + 10; sx < x + w - 10; sx += 18) {
    ctx.fillRect(sx, y + 5, 11, h - 8);
  }

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

export function drawNeonBarrier(ctx, x, y, w, h) {
  ctx.save();
  const time = performance.now() * 0.003;
  const pulse = 0.7 + 0.3 * Math.sin(time * 2);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x, y, 6, h);
  ctx.fillRect(x + w - 6, y, 6, h);

  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, `rgba(0, 229, 255, ${0.45 * pulse})`);
  grad.addColorStop(0.5, `rgba(168, 85, 247, ${0.30 * pulse})`);
  grad.addColorStop(1, `rgba(0, 229, 255, ${0.45 * pulse})`);
  ctx.fillStyle = grad;
  ctx.fillRect(x + 6, y, w - 12, h);

  ctx.strokeStyle = `rgba(0, 229, 255, ${0.85 * pulse})`;
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  const scanY = y + ((time * 35) % h);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 6, scanY);
  ctx.lineTo(x + w - 6, scanY);
  ctx.stroke();

  ctx.restore();
}

export function drawJumpPad(ctx, x, y, w, h) {
  ctx.save();
  const time = performance.now() * 0.005;

  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y + 4, w, h - 4, 3);
  else ctx.rect(x, y + 4, w, h - 4);
  ctx.fill();
  ctx.stroke();

  const padGrad = ctx.createLinearGradient(x, y, x + w, y);
  padGrad.addColorStop(0, '#10b981');
  padGrad.addColorStop(0.5, '#34d399');
  padGrad.addColorStop(1, '#10b981');
  ctx.fillStyle = padGrad;
  ctx.shadowColor = '#10b981';
  ctx.shadowBlur = 12;
  ctx.fillRect(x + 4, y, w - 8, 4);

  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const wave = Math.sin(time * 3);
  ctx.fillStyle = wave > 0 ? '#ffffff' : '#34d399';
  ctx.fillText('▲  ▲  ▲', x + w / 2, y + h / 2 + 1);

  ctx.restore();
}

export function drawCyberPillar(ctx, x, y, w, h) {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, '#090d16');
  grad.addColorStop(0.5, '#1e293b');
  grad.addColorStop(1, '#090d16');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);

  ctx.strokeStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 8;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 4);
  ctx.lineTo(x + w / 2, y + h - 4);
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 6;
  for (let ry = y + 16; ry < y + h - 10; ry += 24) {
    ctx.fillRect(x - 2, ry, w + 4, 3);
  }

  ctx.fillStyle = '#64748b';
  ctx.shadowBlur = 0;
  ctx.fillRect(x - 3, y, w + 6, 4);
  ctx.fillRect(x - 3, y + h - 4, w + 6, 4);
  ctx.restore();
}

export function drawExplosiveBarrel(ctx, x, y, w, h) {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, '#7f1d1d');
  grad.addColorStop(0.3, '#dc2626');
  grad.addColorStop(0.7, '#ef4444');
  grad.addColorStop(1, '#991b1b');
  ctx.fillStyle = grad;
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 3);
  else ctx.rect(x, y, w, h);
  ctx.fill();

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(x, y + 6); ctx.lineTo(x + w, y + 6);
  ctx.moveTo(x, y + h - 6); ctx.lineTo(x + w, y + h - 6);
  ctx.stroke();

  drawHazardStripes(ctx, x + 2, y + h * 0.38, w - 4, 8);

  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 6;
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🔥', x + w / 2, y + h * 0.72);

  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

export function drawBarbedWire(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#78716c';
  ctx.strokeStyle = '#292524';
  ctx.lineWidth = 1.2;
  ctx.fillRect(x + 4, y, 5, h);
  ctx.strokeRect(x + 4, y, 5, h);
  ctx.fillRect(x + w - 9, y, 5, h);
  ctx.strokeRect(x + w - 9, y, 5, h);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const cy = y + h / 2;
  for (let i = x + 8; i < x + w - 8; i += 7) {
    ctx.ellipse(i, cy, 3.5, 6, 0.4, 0, Math.PI * 2);
  }
  ctx.stroke();

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = x + 11; i < x + w - 10; i += 10) {
    ctx.moveTo(i - 2, cy - 5); ctx.lineTo(i + 2, cy + 5);
    ctx.moveTo(i - 2, cy + 5); ctx.lineTo(i + 2, cy - 5);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawSniperTower(ctx, x, y, w, h) {
  ctx.save();
  const platH = 14;
  const platY = y;
  const legsTopY = platY + platH;
  const legsBottomY = y + h;

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.0;

  ctx.beginPath();
  ctx.moveTo(x + 12, legsTopY); ctx.lineTo(x + 4, legsBottomY);
  ctx.moveTo(x + w - 12, legsTopY); ctx.lineTo(x + w - 4, legsBottomY);
  ctx.stroke();

  const numSections = 4;
  const secH = (legsBottomY - legsTopY) / numSections;
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = '#64748b';
  for (let s = 0; s < numSections; s++) {
    const sy1 = legsTopY + s * secH;
    const sy2 = sy1 + secH;
    const t1 = s / numSections;
    const t2 = (s + 1) / numSections;
    const lx1 = (x + 12) * (1 - t1) + (x + 4) * t1;
    const rx1 = (x + w - 12) * (1 - t1) + (x + w - 4) * t1;
    const lx2 = (x + 12) * (1 - t2) + (x + 4) * t2;
    const rx2 = (x + w - 12) * (1 - t2) + (x + w - 4) * t2;

    ctx.beginPath();
    ctx.moveTo(lx1, sy1); ctx.lineTo(rx2, sy2);
    ctx.moveTo(rx1, sy1); ctx.lineTo(lx2, sy2);
    ctx.moveTo(lx2, sy2); ctx.lineTo(rx2, sy2);
    ctx.stroke();
  }

  const ladderX = x + w / 2;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ladderX - 5, legsTopY); ctx.lineTo(ladderX - 5, legsBottomY);
  ctx.moveTo(ladderX + 5, legsTopY); ctx.lineTo(ladderX + 5, legsBottomY);
  ctx.stroke();

  ctx.lineWidth = 1.0;
  for (let ly = legsTopY + 10; ly < legsBottomY; ly += 12) {
    ctx.beginPath();
    ctx.moveTo(ladderX - 5, ly); ctx.lineTo(ladderX + 5, ly);
    ctx.stroke();
  }

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x, platY, w, platH);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, platY, w, platH);

  drawHazardStripes(ctx, x, platY + platH - 4, w, 4);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 2, platY - 14); ctx.lineTo(x + w - 2, platY - 14);
  ctx.moveTo(x + 2, platY); ctx.lineTo(x + 2, platY - 14);
  ctx.moveTo(x + w - 2, platY); ctx.lineTo(x + w - 2, platY - 14);
  ctx.moveTo(x + 24, platY); ctx.lineTo(x + 24, platY - 14);
  ctx.moveTo(x + w - 24, platY); ctx.lineTo(x + w - 24, platY - 14);
  ctx.stroke();

  ctx.restore();
}

export function drawMetalRamp(ctx, x, y, w, h, isLeft) {
  ctx.save();
  ctx.beginPath();
  if (isLeft) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
  } else {
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
  }
  ctx.closePath();

  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#334155');
  grad.addColorStop(0.5, '#1e293b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.2;
  for (let rx = x + 16; rx < x + w - 8; rx += 16) {
    const t = (rx - x) / w;
    const topRampY = isLeft ? (y + t * h) : (y + (1 - t) * h);
    ctx.beginPath();
    ctx.moveTo(rx, topRampY);
    ctx.lineTo(rx, y + h);
    ctx.stroke();
  }

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  if (isLeft) {
    ctx.moveTo(x, y); ctx.lineTo(x + w, y + h);
  } else {
    ctx.moveTo(x, y + h); ctx.lineTo(x + w, y);
  }
  ctx.stroke();

  drawHazardStripes(ctx, x, y + h - 4, w, 4);
  ctx.restore();
}

export function drawTallConcreteWall(ctx, x, y, w, h) {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, '#475569');
  grad.addColorStop(0.35, '#334155');
  grad.addColorStop(1, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x - 2, y, w + 4, 4);

  drawHazardStripes(ctx, x + 2, y + h * 0.45, w - 4, 12);

  ctx.fillStyle = '#0f172a';
  for (let ry = y + 16; ry < y + h - 14; ry += 28) {
    ctx.beginPath();
    ctx.arc(x + w / 2, ry, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawSpeedBoosterPad(ctx, x, y, w, h) {
  ctx.save();
  const time = performance.now() * 0.006;
  ctx.fillStyle = '#090d16';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 10;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(x, y, w, h);

  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const offset = Math.floor((time * 15) % 3);
  for (let i = 0; i < 4; i++) {
    const arrowX = x + 14 + i * 16;
    ctx.fillStyle = ((i + offset) % 3 === 0) ? '#ffffff' : '#00e5ff';
    ctx.fillText('▶▶', arrowX, y + h / 2 + 1);
  }
  ctx.restore();
}

export function drawGravityLift(ctx, x, y, w, h) {
  ctx.save();
  const time = performance.now() * 0.003;
  const pulse = 0.6 + 0.4 * Math.sin(time * 3);

  const padH = 10;
  const padY = y + h - padH;
  ctx.fillStyle = '#090d16';
  ctx.fillRect(x, padY, w, padH);
  ctx.strokeStyle = '#a855f7';
  ctx.shadowColor = '#a855f7';
  ctx.shadowBlur = 10;
  ctx.lineWidth = 2.0;
  ctx.strokeRect(x, padY, w, padH);

  const beamGrad = ctx.createLinearGradient(x, padY, x, y);
  beamGrad.addColorStop(0, `rgba(168, 85, 247, ${0.45 * pulse})`);
  beamGrad.addColorStop(0.5, `rgba(0, 229, 255, ${0.30 * pulse})`);
  beamGrad.addColorStop(1, 'rgba(168, 85, 247, 0.0)');
  ctx.fillStyle = beamGrad;
  ctx.fillRect(x + 4, y, w - 8, h - padH);

  ctx.strokeStyle = `rgba(0, 229, 255, ${0.65 * pulse})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 4, padY); ctx.lineTo(x + 4, y);
  ctx.moveTo(x + w - 4, padY); ctx.lineTo(x + w - 4, y);
  ctx.stroke();

  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#00e5ff';
  for (let k = 0; k < 3; k++) {
    const arrowY = padY - (((time * 45 + k * 50) % (h - 20)));
    ctx.fillText('▲', x + w / 2, arrowY);
  }
  ctx.restore();
}

export function drawLaserGate(ctx, x, y, w, h) {
  ctx.save();
  const time = performance.now() * 0.005;
  const pulse = 0.7 + 0.3 * Math.sin(time * 6);

  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 1.5;
  ctx.fillRect(x - 3, y, w + 6, 8);
  ctx.strokeRect(x - 3, y, w + 6, 8);
  ctx.fillRect(x - 3, y + h - 8, w + 6, 8);
  ctx.strokeRect(x - 3, y + h - 8, w + 6, 8);

  const laserGrad = ctx.createLinearGradient(x, y, x + w, y);
  laserGrad.addColorStop(0, `rgba(244, 63, 94, ${0.75 * pulse})`);
  laserGrad.addColorStop(0.5, '#ffffff');
  laserGrad.addColorStop(1, `rgba(244, 63, 94, ${0.75 * pulse})`);
  ctx.fillStyle = laserGrad;
  ctx.shadowColor = '#f43f5e';
  ctx.shadowBlur = 14;
  ctx.fillRect(x + 2, y + 8, w - 4, h - 16);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  for (let ly = y + 14; ly < y + h - 14; ly += 14) {
    const jitter = Math.sin(time * 8 + ly) * 3;
    ctx.moveTo(x, ly);
    ctx.lineTo(x + w + jitter, ly);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawFloatingHex(ctx, x, y, w, h) {
  ctx.save();
  const time = performance.now() * 0.002;
  const pulse = 0.5 + 0.5 * Math.sin(time * 3);
  const cut = 12;

  ctx.beginPath();
  ctx.moveTo(x + cut, y);
  ctx.lineTo(x + w - cut, y);
  ctx.lineTo(x + w, y + h / 2);
  ctx.lineTo(x + w - cut, y + h);
  ctx.lineTo(x + cut, y + h);
  ctx.lineTo(x, y + h / 2);
  ctx.closePath();

  ctx.fillStyle = '#0f172a';
  ctx.fill();

  ctx.strokeStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 10;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(x + 20, y + h / 2 - 2, w - 40, 4);

  ctx.fillStyle = `rgba(0, 229, 255, ${0.35 + pulse * 0.35})`;
  ctx.shadowBlur = 16;
  ctx.fillRect(x + cut + 6, y + h, w - 2 * cut - 12, 4);

  ctx.restore();
}

export function drawCyberBumper(ctx, x, y, w, h, hitTimer = 0) {
  ctx.save();
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = (w || 40) / 2;
  const isHit = hitTimer > 0;

  ctx.fillStyle = isHit ? '#ffffff' : '#090d16';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isHit ? '#f43f5e' : '#00e5ff';
  ctx.shadowColor = isHit ? '#f43f5e' : '#00e5ff';
  ctx.shadowBlur = isHit ? 22 : 12;
  ctx.lineWidth = isHit ? 3.5 : 2.5;
  ctx.stroke();

  ctx.strokeStyle = isHit ? '#ffffff' : '#38bdf8';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = isHit ? '#f43f5e' : '#00e5ff';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawSingleObstacleByType(ctx, type, x, y, w, h, groundY = 500, hitTimer = 0) {
  if (type === 'catwalk') {
    drawCatwalk(ctx, { x, w, relY: groundY - y, thickness: h, chains: [25, w - 25] }, groundY);
  } else if (type === 'sandbags') {
    drawSandbags(ctx, x, y, w, h);
  } else if (type === 'ammo_depot') {
    drawCrate(ctx, x, y, w, h);
  } else if (type === 'hedgehog') {
    drawHedgehog(ctx, x + w / 2, y + h / 2, w);
  } else if (type === 'bunker_block') {
    drawBunkerBlock(ctx, x, y, w, h);
  } else if (type === 'cyber_catwalk') {
    drawCyberCatwalk(ctx, x, y, w, h);
  } else if (type === 'neon_barrier') {
    drawNeonBarrier(ctx, x, y, w, h);
  } else if (type === 'jump_pad') {
    drawJumpPad(ctx, x, y, w, h);
  } else if (type === 'cyber_pillar') {
    drawCyberPillar(ctx, x, y, w, h);
  } else if (type === 'explosive_barrel') {
    drawExplosiveBarrel(ctx, x, y, w, h);
  } else if (type === 'barbed_wire') {
    drawBarbedWire(ctx, x, y, w, h);
  } else if (type === 'sniper_tower') {
    drawSniperTower(ctx, x, y, w, h);
  } else if (type === 'metal_ramp_left') {
    drawMetalRamp(ctx, x, y, w, h, true);
  } else if (type === 'metal_ramp_right') {
    drawMetalRamp(ctx, x, y, w, h, false);
  } else if (type === 'tall_concrete_wall') {
    drawTallConcreteWall(ctx, x, y, w, h);
  } else if (type === 'speed_booster_pad') {
    drawSpeedBoosterPad(ctx, x, y, w, h);
  } else if (type === 'gravity_lift') {
    drawGravityLift(ctx, x, y, w, h);
  } else if (type === 'laser_gate') {
    drawLaserGate(ctx, x, y, w, h);
  } else if (type === 'floating_hex') {
    drawFloatingHex(ctx, x, y, w, h);
  } else if (type === 'cyber_bumper') {
    drawCyberBumper(ctx, x, y, w, h, hitTimer);
  }
}

function drawRockIsland(ctx, plat, groundY) {
  const topY = groundY - plat.relY;
  const time = performance.now() * 0.002;
  const thick = plat.thickness || 20;

  ctx.save();

  if (plat.isCyberBastion || plat.isBastion) {
    const accentCol = plat.theme === 'cyan' ? '#06b6d4' : '#f97316';
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(plat.x, topY, plat.w, thick);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plat.x, topY, plat.w, thick);

    ctx.save();
    ctx.strokeStyle = accentCol;
    ctx.shadowColor = accentCol;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(plat.x, topY);
    ctx.lineTo(plat.x + plat.w, topY);
    ctx.stroke();
    ctx.restore();

    drawHazardStripes(ctx, plat.x, topY + thick - 5, plat.w, 4);
  } else if (plat.isAltar || plat.type === 'altar_island') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(plat.x, topY, plat.w, thick);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(plat.x, topY, plat.w, thick);

    ctx.save();
    ctx.strokeStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(plat.x, topY);
    ctx.lineTo(plat.x + plat.w, topY);
    ctx.stroke();
    ctx.restore();

    drawHazardStripes(ctx, plat.x, topY + thick - 5, plat.w, 4);
  } else {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(plat.x, topY, plat.w, thick);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plat.x, topY, plat.w, thick);

    ctx.fillStyle = '#334155';
    ctx.fillRect(plat.x, topY, plat.w, 3);

    drawHazardStripes(ctx, plat.x, topY + thick - 4, plat.w, 4);
  }

  if (plat.props) {
    for (let prop of plat.props) {
      const px = plat.x + prop.rx;
      if (prop.type === 'sandbags') {
        drawSandbags(ctx, px, topY - prop.h, prop.w, prop.h);
      } else if (prop.type === 'crate') {
        drawCrate(ctx, px, topY - prop.h, prop.w, prop.h);
      } else if (prop.type === 'bunker_tier') {
        const by = topY - prop.h;
        ctx.fillStyle = '#334155';
        ctx.fillRect(px, by, prop.w, prop.h);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px, by, prop.w, prop.h);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 14, by + 8, prop.w - 28, 6);
        drawHazardStripes(ctx, px, by + prop.h - 4, prop.w, 4);
      } else if (prop.type === 'altar_pedestal') {
        const by = topY - prop.h;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px, by, prop.w, prop.h);
        ctx.strokeStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2.0;
        ctx.strokeRect(px, by, prop.w, prop.h);
        ctx.shadowBlur = 0;
        drawHazardStripes(ctx, px + 8, by + prop.h - 6, prop.w - 16, 4);

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ ALTAR OF WAR ⚡', px + prop.w / 2, by + 16);
      } else if (prop.type === 'antenna') {
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, topY - 36);
        ctx.lineTo(px, topY - 36 - prop.h);
        ctx.stroke();

        const pulse = 0.4 + 0.6 * Math.sin(time * 3);
        ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, topY - 36 - prop.h, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  ctx.restore();
}

function drawCatwalk(ctx, cat, groundY) {
  const topY = groundY - cat.relY;

  ctx.save();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.2;
  for (const cx of cat.chains) {
    ctx.beginPath();
    ctx.moveTo(cat.x + cx, topY);
    ctx.lineTo(cat.x + cx, topY - 260);
    ctx.stroke();
  }

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cat.x, topY, cat.w, cat.thickness);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(cat.x, topY, cat.w, cat.thickness);

  ctx.fillStyle = '#0f172a';
  for (let hx = cat.x + 8; hx < cat.x + cat.w - 8; hx += 16) {
    ctx.fillRect(hx, topY + 3, 10, cat.thickness - 6);
  }

  drawHazardStripes(ctx, cat.x, topY + cat.thickness - 4, cat.w, 4);
  ctx.restore();
}

function drawBastionSubstructure(ctx, startX, width, topY, bottomY, accentColor) {
  const h = bottomY - topY;
  const pillarW = 28;
  const numPillars = 4;
  const span = (width - pillarW) / (numPillars - 1);

  for (let i = 0; i < numPillars; i++) {
    const px = startX + i * span;
    const colGrad = ctx.createLinearGradient(px, topY, px + pillarW, topY);
    colGrad.addColorStop(0.0, '#1e293b');
    colGrad.addColorStop(0.5, '#334155');
    colGrad.addColorStop(1.0, '#0f172a');
    ctx.fillStyle = colGrad;
    ctx.fillRect(px, topY, pillarW, h);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(px, topY, pillarW, h);

    ctx.fillStyle = '#0f172a';
    for (let y = topY + 25; y < bottomY - 10; y += 32) {
      ctx.fillRect(px, y, pillarW, 2.5);
    }
  }

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2.8;
  for (let i = 0; i < numPillars - 1; i++) {
    const p1X = startX + i * span + pillarW;
    const p2X = startX + (i + 1) * span;
    if (p2X <= p1X) continue;

    const numBays = 3;
    const bayH = h / numBays;
    for (let b = 0; b < numBays; b++) {
      const bayTop = topY + b * bayH;
      const bayBottom = bayTop + bayH;

      ctx.beginPath();
      ctx.moveTo(p1X, bayTop);
      ctx.lineTo(p2X, bayBottom);
      ctx.moveTo(p2X, bayTop);
      ctx.lineTo(p1X, bayBottom);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(p1X, bayBottom);
      ctx.lineTo(p2X, bayBottom);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc((p1X + p2X) / 2, (bayTop + bayBottom) / 2, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.save();
  ctx.strokeStyle = accentColor;
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 9;
  ctx.lineWidth = 2.2;
  const accentX = (accentColor === '#06b6d4') ? (startX + width - 10) : (startX + 10);
  ctx.beginPath();
  ctx.moveTo(accentX, topY + 8);
  ctx.lineTo(accentX, bottomY - 12);
  ctx.stroke();
  ctx.restore();
}

function drawCyberStadiumStructures(ctx, groundY) {
  ctx.save();
  drawBastionSubstructure(ctx, 160, 280, groundY - 240, groundY, '#06b6d4');
  drawBastionSubstructure(ctx, 1480, 280, groundY - 240, groundY, '#f97316');
  ctx.restore();
}

function drawNeonGoals(ctx, groundY, goals) {
  if (!goals || goals.length === 0) return;

  for (const g of goals) {
    const bottomY = groundY - g.relY;
    const topY = bottomY - g.h;
    const leftX = g.x;
    const rightX = g.x + g.w;
    const isCyan = g.team === 'CYAN';

    ctx.save();

    const netGlow = ctx.createLinearGradient(
      g.facing === 1 ? leftX : rightX, bottomY,
      g.facing === 1 ? rightX : leftX, bottomY
    );
    netGlow.addColorStop(0.0, isCyan ? 'rgba(6, 182, 212, 0.22)' : 'rgba(249, 115, 22, 0.22)');
    netGlow.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = netGlow;
    ctx.fillRect(leftX, topY, g.w, g.h);

    ctx.save();
    ctx.strokeStyle = isCyan ? 'rgba(6, 182, 212, 0.35)' : 'rgba(249, 115, 22, 0.35)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    const netStep = 11;
    for (let x = leftX; x <= rightX; x += netStep) {
      ctx.moveTo(x, topY);
      ctx.lineTo(x + (g.facing === 1 ? -6 : 6), bottomY);
    }
    for (let y = topY; y <= bottomY; y += netStep) {
      ctx.moveTo(leftX, y);
      ctx.lineTo(rightX, y + 2);
    }
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = g.color;
    ctx.shadowColor = g.glowColor;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 3.6;

    const mouthX = g.facing === 1 ? rightX : leftX;
    const backX = g.facing === 1 ? leftX : rightX;

    ctx.beginPath();
    ctx.moveTo(mouthX, bottomY);
    ctx.lineTo(mouthX, topY);
    ctx.lineTo(backX, topY);
    ctx.lineTo(backX, bottomY);
    ctx.stroke();

    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(backX, bottomY);
    ctx.lineTo(mouthX, bottomY);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(mouthX, bottomY);
    ctx.lineTo(mouthX, topY);
    ctx.lineTo(backX, topY);
    ctx.lineTo(backX, bottomY);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = g.color;
    ctx.shadowColor = g.color;
    ctx.shadowBlur = 8;
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'center';
    const tagText = isCyan ? '◄ CYAN GOAL' : 'ORANGE GOAL ►';
    ctx.fillText(tagText, (leftX + rightX) / 2, topY - 7);
    ctx.restore();

    ctx.restore();
  }
}

function drawAltarSpotlightAndLevitation(ctx, groundY) {
  const altarX = arena1State.altarX;
  const topY = groundY - 190;
  const pedestalY = topY - 32;
  const hoverY = (groundY - arena1State.altarRelY) + Math.sin(performance.now() * 0.003) * 6;
  const gantryY = groundY - 1050;
  const time = performance.now() * 0.001;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  const beamTopW = 40;
  const beamBottomW = 240;

  const beamGrad = ctx.createLinearGradient(altarX, gantryY, altarX, topY);
  beamGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.75)');
  beamGrad.addColorStop(0.12, 'rgba(186, 230, 253, 0.50)');
  beamGrad.addColorStop(0.50, 'rgba(56, 189, 248, 0.28)');
  beamGrad.addColorStop(0.85, 'rgba(6, 182, 212, 0.16)');
  beamGrad.addColorStop(1.0, 'rgba(6, 182, 212, 0.02)');

  ctx.fillStyle = beamGrad;
  ctx.beginPath();
  ctx.moveTo(altarX - beamTopW / 2, gantryY);
  ctx.lineTo(altarX + beamTopW / 2, gantryY);
  ctx.lineTo(altarX + beamBottomW / 2, topY + 8);
  ctx.lineTo(altarX - beamBottomW / 2, topY + 8);
  ctx.closePath();
  ctx.fill();

  const coreGrad = ctx.createLinearGradient(altarX, gantryY, altarX, topY);
  coreGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.90)');
  coreGrad.addColorStop(0.35, 'rgba(224, 242, 254, 0.45)');
  coreGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.moveTo(altarX - 14, gantryY);
  ctx.lineTo(altarX + 14, gantryY);
  ctx.lineTo(altarX + 65, topY);
  ctx.lineTo(altarX - 65, topY);
  ctx.closePath();
  ctx.fill();

  const poolGrad = ctx.createRadialGradient(altarX, pedestalY + 4, 10, altarX, pedestalY + 4, 120);
  poolGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.70)');
  poolGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.40)');
  poolGrad.addColorStop(0.80, 'rgba(6, 182, 212, 0.14)');
  poolGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = poolGrad;
  ctx.beginPath();
  ctx.ellipse(altarX, pedestalY + 2, 115, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.arc(altarX, gantryY, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  if (arena1State.waitingForKickoff) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 3.5);

    ctx.save();
    const bubbleGrad = ctx.createRadialGradient(altarX, hoverY, 4, altarX, hoverY, 30 + pulse * 6);
    bubbleGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.65)');
    bubbleGrad.addColorStop(0.4, 'rgba(0, 229, 255, 0.35)');
    bubbleGrad.addColorStop(0.8, 'rgba(6, 182, 212, 0.12)');
    bubbleGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bubbleGrad;
    ctx.beginPath();
    ctx.arc(altarX, hoverY, 30 + pulse * 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(0, 229, 255, ${0.75 + pulse * 0.25})`;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.ellipse(altarX, hoverY, 26 + pulse * 3, 9, time * 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(altarX, hoverY, 26 + pulse * 3, 9, -time * 2.2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
    ctx.fillText('⚡ KICKOFF READY ⚡', altarX, hoverY - 26);
    ctx.restore();
  }

  for (let i = altarShockwaves.length - 1; i >= 0; i--) {
    const sw = altarShockwaves[i];
    sw.radius += 3.5;
    sw.alpha -= 0.035;

    ctx.save();
    ctx.strokeStyle = sw.color;
    ctx.shadowColor = sw.color;
    ctx.shadowBlur = 12;
    ctx.globalAlpha = Math.max(0, sw.alpha);
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
      altarShockwaves.splice(i, 1);
    }
  }
}

export function drawObstacles(ctx, groundY) {
  if (activeArenaId === 'ARENA_1') {
    drawBastionSubstructure(ctx, START_X + 20, 380, groundY - 130, groundY, '#06b6d4');
    drawBastionSubstructure(ctx, START_X + 2800, 380, groundY - 130, groundY, '#f97316');
  } else if (activeArenaId === 'ARENA_2') {
    drawCyberStadiumStructures(ctx, groundY);
  }

  for (const bar of GROUND_BARRICADES) {
    if (bar.type === 'sandbags') drawSandbags(ctx, bar.x, groundY - bar.h, bar.w, bar.h);
    else if (bar.type === 'ammo_depot') drawCrate(ctx, bar.x, groundY - bar.h, bar.w, bar.h);
    else if (bar.type === 'hedgehog') drawHedgehog(ctx, bar.x, groundY - bar.size / 2, bar.size);
  }

  for (const plat of ARENA_PLATFORMS) {
    if (plat.type === 'catwalk') {
      drawCatwalk(ctx, plat, groundY);
    } else {
      drawRockIsland(ctx, plat, groundY);
    }
  }

  for (const obs of customObstacles) {
    const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
    drawSingleObstacleByType(ctx, obs.type, obs.x, topY, obs.w, obs.h, groundY, obs.hitTimer || 0);
  }

  drawBarrelExplosionParticles(ctx);
  drawNeonGoals(ctx, groundY, GOALS);

  if (activeArenaId === 'ARENA_1') {
    drawAltarSpotlightAndLevitation(ctx, groundY);
  }
}

export function resetObstacles() { obstacles.length = 0; }
export function resetBirds() { }
export function updateProceduralObstacles() { }
export function updateProceduralBirds() { }
export function drawBirds() { }

// =========================================================================
// INTERSEKCJE TRAJEKTORII POCISKÓW Z PRZESZKODAMI I TERENEM
// =========================================================================

export function getSegmentAABBIntersection(x1, y1, x2, y2, left, top, right, bottom) {
  let t0 = 0.0;
  let t1 = 1.0;
  const dx = x2 - x1;
  const dy = y2 - y1;

  const p = [-dx, dx, -dy, dy];
  const q = [x1 - left, right - x1, y1 - top, bottom - y1];
  const normals = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
  ];

  let hitNorm = [0, -1];

  for (let k = 0; k < 4; k++) {
    if (p[k] === 0) {
      if (q[k] < 0) return null;
    } else {
      const t = q[k] / p[k];
      if (p[k] < 0) {
        if (t > t1) return null;
        if (t > t0) {
          t0 = t;
          hitNorm = normals[k];
        }
      } else {
        if (t < t0) return null;
        if (t < t1) {
          t1 = t;
        }
      }
    }
  }

  if (t0 <= t1) {
    const startInside = (x1 >= left && x1 <= right && y1 >= top && y1 <= bottom);
    const hitT = startInside ? 0 : t0;
    return {
      hit: true,
      t: hitT,
      x: x1 + dx * hitT,
      y: y1 + dy * hitT,
      nx: hitNorm[0],
      ny: hitNorm[1]
    };
  }

  return null;
}

export function getSegmentCircleIntersection(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;

  if (c <= 0) {
    const d = Math.hypot(fx, fy) || 1;
    return {
      hit: true,
      t: 0,
      x: x1,
      y: y1,
      nx: fx / d,
      ny: fy / d
    };
  }

  if (a === 0) return null;

  const discriminant = b * b - 4 * a * c;
  if (discriminant >= 0) {
    const sqrtDisc = Math.sqrt(discriminant);
    const t0 = (-b - sqrtDisc) / (2 * a);
    if (t0 >= 0 && t0 <= 1) {
      const hx = x1 + dx * t0;
      const hy = y1 + dy * t0;
      const d = Math.hypot(hx - cx, hy - cy) || 1;
      return {
        hit: true,
        t: t0,
        x: hx,
        y: hy,
        nx: (hx - cx) / d,
        ny: (hy - cy) / d
      };
    }
  }
  return null;
}

export function getSegmentSegmentIntersection(x1, y1, x2, y2, sx1, sy1, sx2, sy2) {
  const d1x = x2 - x1;
  const d1y = y2 - y1;
  const d2x = sx2 - sx1;
  const d2y = sy2 - sy1;

  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 0.0001) return null;

  const u = ((sx1 - x1) * d2y - (sy1 - y1) * d2x) / denom;
  const v = ((sx1 - x1) * d1y - (sy1 - y1) * d1x) / denom;

  if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
    const len = Math.hypot(d2x, d2y) || 1;
    let nx = -d2y / len;
    let ny = d2x / len;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    return {
      hit: true,
      t: u,
      x: x1 + d1x * u,
      y: y1 + d1y * u,
      nx,
      ny
    };
  }
  return null;
}

export function checkRayObstacleCollision(x1, y1, x2, y2, groundY, extraObstacles = null) {
  let closestHit = null;

  function recordHit(candidate, sourceName = 'unknown') {
    if (!candidate || !candidate.hit) return;
    if (!closestHit || candidate.t < closestHit.t) {
      closestHit = candidate;
      closestHit.source = sourceName;
    }
  }

  if (y2 >= groundY) {
    if (y1 < groundY) {
      const dy = y2 - y1;
      const t = dy !== 0 ? Math.max(0, Math.min(1, (groundY - y1) / dy)) : 0;
      recordHit({
        hit: true,
        t,
        x: x1 + (x2 - x1) * t,
        y: groundY,
        nx: 0,
        ny: -1
      });
    } else {
      recordHit({
        hit: true,
        t: 0,
        x: x1,
        y: groundY,
        nx: 0,
        ny: -1
      });
    }
  }

  if (Array.isArray(GROUND_BARRICADES)) {
    for (const bar of GROUND_BARRICADES) {
      if (bar.type === 'sandbags' || bar.type === 'ammo_depot') {
        const left = bar.x;
        const right = bar.x + bar.w;
        const top = groundY - bar.h;
        const bottom = groundY;
        const hit = getSegmentAABBIntersection(x1, y1, x2, y2, left, top, right, bottom);
        recordHit(hit);
      } else if (bar.type === 'hedgehog') {
        const cx = bar.x;
        const r = (bar.size || 30) / 2;
        const cy = groundY - r;
        const hit = getSegmentCircleIntersection(x1, y1, x2, y2, cx, cy, r);
        recordHit(hit);
      }
    }
  }

  if (Array.isArray(ARENA_PLATFORMS)) {
    for (const plat of ARENA_PLATFORMS) {
      if (plat.type === 'rock_platform' || plat.type === 'citadel_island' || plat.type === 'altar_island') {
        const topY = groundY - plat.relY;
        const thick = plat.thickness || 20;

        const rockHit = getSegmentAABBIntersection(x1, y1, x2, y2, plat.x, topY, plat.x + plat.w, topY + thick);
        recordHit(rockHit);

        if (Array.isArray(plat.props)) {
          for (const prop of plat.props) {
            if (prop.w && prop.h) {
              const bx = plat.x + prop.rx;
              const by = topY - prop.h;
              const propHit = getSegmentAABBIntersection(x1, y1, x2, y2, bx, by, bx + prop.w, topY);
              recordHit(propHit);
            }
          }
        }
      } else if (plat.type === 'catwalk') {
        const topY = groundY - plat.relY;
        const thick = plat.thickness || 14;
        const catHit = getSegmentAABBIntersection(x1, y1, x2, y2, plat.x, topY, plat.x + plat.w, topY + thick);
        recordHit(catHit);
      }
    }
  }

  const obsList = extraObstacles || obstacles;
  if (Array.isArray(obsList)) {
    for (const obs of obsList) {
      if (obs.type === 'sandbags' || obs.type === 'ammo_depot') {
        const left = obs.x;
        const right = obs.x + obs.w;
        const top = groundY - obs.h;
        const bottom = groundY;
        const hit = getSegmentAABBIntersection(x1, y1, x2, y2, left, top, right, bottom);
        recordHit(hit);
      } else if (obs.type === 'hedgehog') {
        const cx = obs.x;
        const r = (obs.size || 30) / 2;
        const cy = groundY - r;
        const hit = getSegmentCircleIntersection(x1, y1, x2, y2, cx, cy, r);
        recordHit(hit);
      }
    }
  }

  if (Array.isArray(customObstacles)) {
    for (const obs of customObstacles) {
      const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
      const bottomY = topY + obs.h;

      if (obs.type === 'hedgehog') {
        const cx = obs.x + obs.w / 2;
        const cy = topY + obs.h / 2;
        const r = (obs.size || 32) / 2;
        const hit = getSegmentCircleIntersection(x1, y1, x2, y2, cx, cy, r);
        recordHit(hit, 'custom_hedgehog');
      } else if (obs.type === 'cyber_bumper') {
        const cx = obs.x + obs.w / 2;
        const cy = topY + obs.h / 2;
        const r = 20;
        const hit = getSegmentCircleIntersection(x1, y1, x2, y2, cx, cy, r);
        if (hit) {
          obs.hitTimer = 10;
          recordHit(hit, 'custom_cyber_bumper');
        }
      } else if (obs.type === 'metal_ramp_left') {
        const rampHit = getSegmentSegmentIntersection(x1, y1, x2, y2, obs.x, topY, obs.x + obs.w, topY + obs.h);
        if (rampHit) recordHit(rampHit, 'custom_metal_ramp_left');
        const backHit = getSegmentSegmentIntersection(x1, y1, x2, y2, obs.x, topY, obs.x, topY + obs.h);
        if (backHit) recordHit(backHit, 'custom_metal_ramp_left');
        const botHit = getSegmentSegmentIntersection(x1, y1, x2, y2, obs.x, topY + obs.h, obs.x + obs.w, topY + obs.h);
        if (botHit) recordHit(botHit, 'custom_metal_ramp_left');
      } else if (obs.type === 'metal_ramp_right') {
        const rampHit = getSegmentSegmentIntersection(x1, y1, x2, y2, obs.x, topY + obs.h, obs.x + obs.w, topY);
        if (rampHit) recordHit(rampHit, 'custom_metal_ramp_right');
        const backHit = getSegmentSegmentIntersection(x1, y1, x2, y2, obs.x + obs.w, topY, obs.x + obs.w, topY + obs.h);
        if (backHit) recordHit(backHit, 'custom_metal_ramp_right');
        const botHit = getSegmentSegmentIntersection(x1, y1, x2, y2, obs.x, topY + obs.h, obs.x + obs.w, topY + obs.h);
        if (botHit) recordHit(botHit, 'custom_metal_ramp_right');
      } else if (obs.type === 'explosive_barrel') {
        const hit = getSegmentAABBIntersection(x1, y1, x2, y2, obs.x, topY, obs.x + obs.w, bottomY);
        if (hit) {
          recordHit(hit, 'custom_explosive_barrel');
          explodeBarrel(obs, groundY);
        }
      } else if (obs.type === 'laser_gate') {
        const hit = getSegmentAABBIntersection(x1, y1, x2, y2, obs.x, topY, obs.x + obs.w, bottomY);
        if (hit) {
          let ricocheted = false;
          if (Array.isArray(bullets)) {
            for (const b of bullets) {
              if (Math.hypot(b.prevX - x1, b.prevY - y1) < 4 || Math.hypot(b.x - x2, b.y - y2) < 4) {
                if (!b.laserBounces || b.laserBounces < 3) {
                  b.laserBounces = (b.laserBounces || 0) + 1;
                  b.vx = -b.vx * 0.92;
                  b.x = hit.x + (b.vx > 0 ? 3 : -3);
                  b.prevX = b.x;
                  spawnHitSparks(hit.x, hit.y, b.vx > 0 ? 1 : -1, 0, 5);
                  triggerScreenShake(2.5);
                  ricocheted = true;
                  break;
                }
              }
            }
          }
          if (!ricocheted) {
            recordHit(hit, 'custom_laser_gate');
          }
        }
      } else if (obs.type === 'barbed_wire' || obs.type === 'gravity_lift' || obs.type === 'speed_booster_pad') {
        continue;
      } else {
        const hit = getSegmentAABBIntersection(x1, y1, x2, y2, obs.x, topY, obs.x + obs.w, bottomY);
        recordHit(hit, 'custom_' + obs.type);
      }
    }
  }

  return closestHit;
}
