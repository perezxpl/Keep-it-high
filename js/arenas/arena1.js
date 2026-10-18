// =========================================================================
// ARENAS/ARENA1.JS - SOLDAT NIGHT OPS (TAKTYCZNA BAZA WOJSKOWA 3200 PX)
// Autonomiczny moduł areny (Plugin / Lifecycle Hooks Pattern)
// =========================================================================

import { START_X, ARENA_WIDTH, MAP_WIDTH, MAP_HEIGHT, ARENA_LEFT, ARENA_RIGHT } from '../config.js';

const _mapW = MAP_WIDTH || ARENA_WIDTH || 3600;
const _mapH = MAP_HEIGHT || 1300;
export const centerX = _mapW / 2; // 1800
export const goalPlatformY = 490; // Wyniesione wysoko bramki (Górny poziom 3)
export const goalH = 140;
export const goalTopY = goalPlatformY - goalH; // 350

// =========================================================================
// DEFINICJE BRAMEK (CYAN & ORANGE NEON GOALS)
// =========================================================================
export const goalTriggerLeft = {
  id: 'goal_arena1_west',
  team: 'CYAN',
  x: 0,
  y: goalTopY, // 350
  w: 240,
  h: goalH, // 140
  bottomY: goalPlatformY, // 490 (spód bramki spoczywa bezpośrednio na platformie)
  lineX: 240,
  facing: 1,
  color: '#00F0FF',
  glowColor: 'rgba(0, 240, 255, 0.85)'
};

export const goalTriggerRight = {
  id: 'goal_arena1_east',
  team: 'ORANGE',
  x: _mapW - 240, // 3360
  y: goalTopY, // 350
  w: 240,
  h: goalH, // 140
  bottomY: goalPlatformY, // 490 (spód bramki spoczywa bezpośrednio na platformie)
  lineX: _mapW - 240,
  facing: -1,
  color: '#FF8800',
  glowColor: 'rgba(255, 136, 0, 0.85)'
};

export const ARENA_1_GOALS = [goalTriggerLeft, goalTriggerRight];

// =========================================================================
// STATYCZNA GEOMETRIA I PLATFORMY KOLIZYJNE - 3 POZIOMY WYSOKOŚCI
// =========================================================================
export const ARENA_1_PLATFORMS = [
  // =======================================================================
  // POZIOM 3 - WYSOKI POZIOM (HIGH TIER: Y = 490 / Poprzeczki Y = 350)
  // =======================================================================
  // 1. Lewa wysoka platforma bramkowa (Cyan Goal Deck)
  {
    id: 'goal_platform_west',
    type: 'catwalk',
    isGoalPlatform: true,
    theme: 'cyan',
    x: 0,
    w: 320,
    y: goalPlatformY, // 490
    h: 26,
    relY: 510,
    thickness: 26
  },
  // Poprzeczka lewej bramki (odbijająca piłkę)
  {
    id: 'crossbar_goal_west',
    type: 'catwalk',
    isCrossbar: true,
    x: 0,
    w: 240,
    y: goalTopY, // 350
    h: 14,
    relY: 650,
    thickness: 14
  },
  // Zachodni wysoki pomost snajperski / platforma obserwacyjna
  {
    id: 'high_overlook_west',
    type: 'catwalk',
    theme: 'cyan',
    x: 960,
    w: 340,
    y: 490,
    h: 22,
    relY: 510,
    thickness: 22
  },
  // Wschodni wysoki pomost snajperski / platforma obserwacyjna
  {
    id: 'high_overlook_east',
    type: 'catwalk',
    theme: 'orange',
    x: _mapW - 1300, // 2300
    w: 340,
    y: 490,
    h: 22,
    relY: 510,
    thickness: 22
  },
  // 2. Prawa wysoka platforma bramkowa (Orange Goal Deck)
  {
    id: 'goal_platform_east',
    type: 'catwalk',
    isGoalPlatform: true,
    theme: 'orange',
    x: _mapW - 320, // 3280
    w: 320,
    y: goalPlatformY, // 490
    h: 26,
    relY: 510,
    thickness: 26
  },
  // Poprzeczka prawej bramki (odbijająca piłkę)
  {
    id: 'crossbar_goal_east',
    type: 'catwalk',
    isCrossbar: true,
    x: _mapW - 240, // 3360
    w: 240,
    y: goalTopY, // 350
    h: 14,
    relY: 650,
    thickness: 14
  },

  // =======================================================================
  // POZIOM 2 - ŚREDNI POZIOM (MID TIER: Y = 680)
  // =======================================================================
  // Zachodnia kładka pośrednia łącząca bastion z poziomem wysokim
  {
    id: 'mid_catwalk_west',
    type: 'catwalk',
    theme: 'cyan',
    x: 480,
    w: 360,
    y: 680,
    h: 22,
    relY: 320,
    thickness: 22
  },
  // Platforma centralna z ołtarzem i cokołem pod lewitującą piłką
  {
    id: 'central_altar_platform',
    type: 'altar_island',
    isAltar: true,
    x: centerX - 180, // 1620
    w: 360,
    y: 680,
    h: 24,
    relY: 320,
    thickness: 24,
    props: [
      { type: 'altar_pedestal', rx: 110, w: 140, h: 20 }
    ]
  },
  // Wschodnia kładka pośrednia łącząca bastion z poziomem wysokim
  {
    id: 'mid_catwalk_east',
    type: 'catwalk',
    theme: 'orange',
    x: _mapW - 840, // 2760
    w: 360,
    y: 680,
    h: 22,
    relY: 320,
    thickness: 22
  },

  // =======================================================================
  // POZIOM 1 - NISKI POZIOM (LOW TIER: Y = 860)
  // =======================================================================
  // Dolny bastion zachodni
  {
    id: 'west_bastion_fortress',
    type: 'rock_platform',
    isBastion: true,
    theme: 'cyan',
    x: 0,
    w: 380,
    y: 860,
    h: 22,
    relY: 140,
    thickness: 22,
    props: []
  },
  // Zachodni niski posterunek skrzydłowy
  {
    id: 'low_outpost_west',
    type: 'catwalk',
    theme: 'cyan',
    x: 1080,
    w: 320,
    y: 860,
    h: 22,
    relY: 140,
    thickness: 22
  },
  // Wschodni niski posterunek skrzydłowy
  {
    id: 'low_outpost_east',
    type: 'catwalk',
    theme: 'orange',
    x: _mapW - 1400, // 2200
    w: 320,
    y: 860,
    h: 22,
    relY: 140,
    thickness: 22
  },
  // Dolny bastion wschodni
  {
    id: 'east_bastion_fortress',
    type: 'rock_platform',
    isBastion: true,
    theme: 'orange',
    x: _mapW - 380, // 3220
    w: 380,
    y: 860,
    h: 22,
    relY: 140,
    thickness: 22,
    props: []
  }
];

export const ARENA_1_BARRICADES = [];

export const arena1State = {
  waitingForKickoff: true,
  kickoffCooldown: 0,
  initialSetupDone: false,
  altarX: centerX, // 1800
  altarY: 570, // Lewitacja w powietrzu w snopie światła
  altarRelY: 430,
  altarPlatformY: 680,
  altarPulse: 0
};

// =========================================================================
// OFFSCREEN CACHING DLA DALEKIEJ PARALAKSY WIEŻ
// =========================================================================
let cachedTowersCanvas = null;
let cachedHorizonY = 0;

function getArena1TowersCanvas(horizonY) {
  if (cachedTowersCanvas && cachedHorizonY === horizonY) {
    return cachedTowersCanvas;
  }
  const c = (typeof document !== 'undefined') ? document.createElement('canvas') : null;
  if (!c) return { width: 1800, height: 800 };
  c.width = 1800;
  c.height = Math.max(horizonY + 80, 600);
  const tc = c.getContext('2d');
  if (!tc) return c;

  const farTowers = [
    { x: 120, w: 65, h: 280, type: 'cooling' },
    { x: 260, w: 22, h: 420, type: 'pylon' },
    { x: 420, w: 90, h: 320, type: 'complex' },
    { x: 620, w: 30, h: 380, type: 'pylon' },
    { x: 780, w: 75, h: 260, type: 'cooling' },
    { x: 960, w: 110, h: 350, type: 'monolith' },
    { x: 1180, w: 26, h: 440, type: 'pylon' },
    { x: 1320, w: 85, h: 300, type: 'complex' },
    { x: 1540, w: 70, h: 270, type: 'cooling' },
    { x: 1700, w: 28, h: 390, type: 'pylon' }
  ];

  for (let i = 0; i < farTowers.length; i++) {
    const tow = farTowers[i];
    const topY = horizonY - tow.h;
    const isCyanSide = (tow.x < c.width * 0.5);

    const towGrad = tc.createLinearGradient(tow.x, topY, tow.x, horizonY);
    towGrad.addColorStop(0.0, isCyanSide ? '#040b17' : '#140804');
    towGrad.addColorStop(0.5, '#070b14');
    towGrad.addColorStop(1.0, '#0a0d16');
    tc.fillStyle = towGrad;

    if (tow.type === 'cooling') {
      tc.beginPath();
      tc.moveTo(tow.x + 8, topY);
      tc.lineTo(tow.x + tow.w - 8, topY);
      tc.quadraticCurveTo(tow.x + tow.w * 0.5 + 14, topY + tow.h * 0.45, tow.x + tow.w, horizonY);
      tc.lineTo(tow.x, horizonY);
      tc.quadraticCurveTo(tow.x + tow.w * 0.5 - 14, topY + tow.h * 0.45, tow.x + 8, topY);
      tc.closePath();
      tc.fill();
    } else if (tow.type === 'pylon') {
      tc.fillRect(tow.x + tow.w * 0.5 - 2.5, topY, 5, tow.h);
      tc.beginPath();
      tc.moveTo(tow.x, horizonY);
      tc.lineTo(tow.x + tow.w * 0.5, topY);
      tc.lineTo(tow.x + tow.w, horizonY);
      tc.stroke();
    } else {
      tc.fillRect(tow.x, topY, tow.w, tow.h);
      tc.fillRect(tow.x + 12, topY - 28, tow.w - 24, 28);
    }
  }

  cachedTowersCanvas = c;
  cachedHorizonY = horizonY;
  return c;
}

// =========================================================================
// RENDEROWANIE TŁA I EFEKTÓW ATMOSFERYCZNYCH (DRAW BACKGROUND)
// =========================================================================
export function drawArena1Background(ctx, camera) {
  if (!ctx) return;
  const W = ctx.canvas?.width || 1920;
  const H = ctx.canvas?.height || 1080;
  const camX = camera ? (camera.x + (camera.viewWidth || (W / (camera.zoom || 1))) / 2) : 1760;
  const time = performance.now() * 0.001;
  const horizonY = H * 0.74;

  // 1. Dual-tone gradient nieba (głęboka czerń kosmiczna + neonowa łuna)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0.0, '#020208');
  skyGrad.addColorStop(0.35, '#060714');
  skyGrad.addColorStop(0.68, '#0d0f22');
  skyGrad.addColorStop(1.0, '#15132d');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Ambientowa poświata skrzydeł areny (Cyan / Orange)
  const leftGlowX = W * 0.20 + (ARENA_LEFT - camX) * 0.12;
  const rightGlowX = W * 0.80 + (ARENA_RIGHT - camX) * 0.12;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  const horizGlow = ctx.createLinearGradient(0, 0, W, 0);
  horizGlow.addColorStop(0.0, 'rgba(6, 182, 212, 0.18)');
  horizGlow.addColorStop(0.28, 'rgba(6, 182, 212, 0.08)');
  horizGlow.addColorStop(0.50, 'rgba(79, 70, 229, 0.06)');
  horizGlow.addColorStop(0.72, 'rgba(249, 115, 22, 0.08)');
  horizGlow.addColorStop(1.0, 'rgba(249, 115, 22, 0.18)');
  ctx.fillStyle = horizGlow;
  ctx.fillRect(0, H * 0.46, W, H * 0.54);

  const cyanRadius = Math.max(W * 0.60, 640);
  const cyanNebula = ctx.createRadialGradient(leftGlowX, horizonY, 20, leftGlowX, horizonY, cyanRadius);
  cyanNebula.addColorStop(0.0, 'rgba(6, 182, 212, 0.18)');
  cyanNebula.addColorStop(0.42, 'rgba(6, 182, 212, 0.05)');
  cyanNebula.addColorStop(1.0, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = cyanNebula;
  ctx.fillRect(0, 0, W, H);

  const orangeRadius = Math.max(W * 0.60, 640);
  const orangeNebula = ctx.createRadialGradient(rightGlowX, horizonY, 20, rightGlowX, horizonY, orangeRadius);
  orangeNebula.addColorStop(0.0, 'rgba(249, 115, 22, 0.18)');
  orangeNebula.addColorStop(0.42, 'rgba(249, 115, 22, 0.05)');
  orangeNebula.addColorStop(1.0, 'rgba(249, 115, 22, 0)');
  ctx.fillStyle = orangeNebula;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // 3. Cyfrowy pył / neonowe iskry
  const dustCount = 45;
  for (let i = 0; i < dustCount; i++) {
    const seed = i * 71.197;
    const periodX = 3600;
    const worldX = ((seed * 197.3 + time * 22 * ((i % 3 === 0) ? -1 : 1)) % periodX + periodX) % periodX;
    const scrX = Math.round(((worldX - camX * 0.04) % W + W) % W);
    const normY = (Math.sin(seed * 3.7) * 0.5 + 0.5);
    const scrY = Math.round(normY * (H * 0.70) + Math.sin(time * 1.5 + seed) * 10);
    const twinkle = Math.sin(time * 2.6 + seed * 4.1) * 0.5 + 0.5;
    const isCyanSide = (worldX < periodX * 0.5);
    const alpha = (0.28 + twinkle * 0.62).toFixed(2);
    ctx.fillStyle = isCyanSide ? `rgba(34, 211, 238, ${alpha})` : `rgba(251, 146, 60, ${alpha})`;
    const size = (i % 6 === 0) ? 2.4 : 1.4;
    ctx.fillRect(scrX, scrY, size, size);
  }

  // 4. Paralaksa wież przemysłowych w tle
  const towersCanvas = getArena1TowersCanvas(Math.round(horizonY));
  const farPeriod = 1800;
  const parallaxFactor = 0.03;
  const farOffset = Math.floor(((camX * parallaxFactor) % farPeriod + farPeriod) % farPeriod);
  const minLoop = Math.floor((-farOffset) / farPeriod) - 1;
  const maxLoop = Math.ceil((W - farOffset) / farPeriod) + 1;
  for (let loop = minLoop; loop <= maxLoop; loop++) {
    const drawX = Math.floor(loop * farPeriod - farOffset);
    if (drawX + farPeriod < 0 || drawX > W) continue;
    ctx.drawImage(towersCanvas, drawX, 0);
  }

  // 5. Reflektory / szperacze omiatające niebo
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const beamLen = H * 0.95;

  // Lewy reflektor (Cyan)
  const cyanBeamX = W * 0.22 + (ARENA_LEFT - camX) * 0.05;
  const cyanAngle = Math.sin(time * 0.8) * 0.35 - 0.25;
  ctx.save();
  ctx.translate(cyanBeamX, horizonY);
  ctx.rotate(cyanAngle);
  const cyanBeam = ctx.createLinearGradient(0, 0, 0, -beamLen);
  cyanBeam.addColorStop(0.0, 'rgba(6, 182, 212, 0.40)');
  cyanBeam.addColorStop(0.5, 'rgba(6, 182, 212, 0.10)');
  cyanBeam.addColorStop(1.0, 'rgba(6, 182, 212, 0.0)');
  ctx.fillStyle = cyanBeam;
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.lineTo(-140, -beamLen);
  ctx.lineTo(140, -beamLen);
  ctx.lineTo(16, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Prawy reflektor (Orange)
  const orangeBeamX = W * 0.78 + (ARENA_RIGHT - camX) * 0.05;
  const orangeAngle = Math.sin(time * 0.75 + 1.2) * 0.35 + 0.25;
  ctx.save();
  ctx.translate(orangeBeamX, horizonY);
  ctx.rotate(orangeAngle);
  const orangeBeam = ctx.createLinearGradient(0, 0, 0, -beamLen);
  orangeBeam.addColorStop(0.0, 'rgba(249, 115, 22, 0.40)');
  orangeBeam.addColorStop(0.5, 'rgba(249, 115, 22, 0.10)');
  orangeBeam.addColorStop(1.0, 'rgba(249, 115, 22, 0.0)');
  ctx.fillStyle = orangeBeam;
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.lineTo(-140, -beamLen);
  ctx.lineTo(140, -beamLen);
  ctx.lineTo(16, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

// =========================================================================
// RENDEROWANIE ELEMENTÓW ARENY (DRAW FOREGROUND)
// =========================================================================
export function drawArena1Foreground(ctx, camera) {
  if (!ctx) return;
  // Subtelna poświata lewitującej w powietrzu piłki w centrum
  const altarX = arena1State.altarX || centerX;
  const altarY = arena1State.altarY || 570;
  const pulse = Math.sin(performance.now() * 0.003) * 0.5 + 0.5;

  ctx.save();
  ctx.fillStyle = `rgba(0, 240, 255, ${0.08 + pulse * 0.08})`;
  ctx.shadowColor = '#00F0FF';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(altarX, altarY, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// =========================================================================
// PĘTLA AKTUALIZACJI SPECYFICZNA DLA ARENY 1
// =========================================================================
export function updateArena1(dt, players) {
  arena1State.altarPulse = (arena1State.altarPulse + 0.04) % (Math.PI * 2);
}

// =========================================================================
// HAKI KOLIZJI POCISKÓW I SPARTAN KICK
// =========================================================================
export function onArena1BulletHit(bullet) {
  if (!bullet) return false;
  // Lewitująca piłka / rdzeń ołtarza w centrum
  const altarX = arena1State.altarX || centerX;
  const altarY = arena1State.altarY || 570;
  const dist = Math.hypot(bullet.x - altarX, bullet.y - altarY);
  if (dist < 28) {
    if (arena1State.waitingForKickoff) {
      arena1State.waitingForKickoff = false;
      return false; // Nie pochłaniaj - pocisk wyzwala kickoff i nadaje piłce pęd!
    }
    return true; // Kula pochłonięta przez pole siłowe ołtarza
  }
  return false;
}

export function onArena1KickHit(player, kickBox) {
  if (!player || !kickBox) return false;
  const altarX = arena1State.altarX || centerX;
  const altarY = arena1State.altarY || 570;
  const dist = Math.hypot((player.x + (player.w || 24) / 2) - altarX, (player.y + 35) - altarY);
  if (dist < 90) {
    if (arena1State.waitingForKickoff) {
      arena1State.waitingForKickoff = false;
    }
    return true;
  }
  return false;
}

// =========================================================================
// KONTRAKT ARENY 1 (PLUGIN DEFINITION)
// =========================================================================
const arena1 = {
  id: 'arena-1',
  name: 'Neonowe Miasto',
  spawns: [
    { x: 220, y: 420, facing: 1 }, // Platforma bramkowa zachodnia (Poziom 3)
    { x: _mapW - 220, y: 420, facing: -1 }, // Platforma bramkowa wschodnia (Poziom 3)
    { x: 240, y: 790, facing: 1 }, // Bastion dolny zachodni (Poziom 1)
    { x: _mapW - 240, y: 790, facing: -1 }, // Bastion dolny wschodni (Poziom 1)
    { x: 660, y: 610, facing: 1 }, // Kładka pośrednia zachodnia (Poziom 2)
    { x: _mapW - 660, y: 610, facing: -1 }, // Kładka pośrednia wschodnia (Poziom 2)
    { x: centerX - 120, y: 610, facing: 1 } // Ołtarz centralny (Poziom 2)
  ],
  platforms: ARENA_1_PLATFORMS,
  customObjects: [
    ...ARENA_1_GOALS,
    { id: 'altar_core', type: 'altar', x: centerX, y: 680, w: 80, h: 40 }
  ],
  drawBackground(ctx, camera) {
    drawArena1Background(ctx, camera);
  },
  draw(ctx, camera) {
    drawArena1Foreground(ctx, camera);
  },
  update(dt, players) {
    updateArena1(dt, players);
  },
  onBulletHit(bullet) {
    return onArena1BulletHit(bullet);
  },
  onKickHit(player, kickBox) {
    return onArena1KickHit(player, kickBox);
  }
};

export default arena1;
