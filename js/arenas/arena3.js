// =========================================================================
// ARENAS/ARENA3.JS - JUNGLE ARENA / MILITARNA DŻUNGLA (4400x1400 PX)
// Autonomiczny moduł areny (Plugin / Lifecycle Hooks Pattern)
// Ściśle przestrzega reguł AGENT.md (Strict DAG: Warstwa 1)
//
// Architektura:
// - Statyczne tło: wygenerowane w grafice PNG (assets/jungle_arena_bg.png)
// - Geometria, platformy, bramki i kolidery: generowane w kodzie (Canvas 2D)
// - Ruchome elementy: falująca rzeka, cząsteczki liści, promienie słońca, pulsujące kielichy
// =========================================================================

// 1. ZASOBY GRAFICZNE PNG (Statyczne tło)
import { triggerScreenShake } from '../camera.js';
const bgImg = new Image();
bgImg.src = 'assets/jungle_arena_bg.png';

// =========================================================================
// 2. STAN ANIMACJI I EFEKTY RUCHOME
// =========================================================================
let animTime = 0;

// Cząsteczki opadających liści dżungli
const LEAF_PARTICLES = [];
const MAX_LEAVES = 24;
for (let i = 0; i < MAX_LEAVES; i++) {
  LEAF_PARTICLES.push({
    x: Math.random() * 4400,
    y: Math.random() * 1200 + 50,
    vx: -(0.6 + Math.random() * 1.4),
    vy: 0.4 + Math.random() * 0.6,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 2.0,
    size: 7 + Math.random() * 9,
    alpha: 0.45 + Math.random() * 0.45,
    color: ['#2d6e2d', '#3a7c3a', '#4a9e4a', '#5aae3a', '#78b832', '#99a826'][Math.floor(Math.random() * 6)]
  });
}

// Bąbelki / pluski w strefie wody
const WATER_RIPPLES = [];
for (let i = 0; i < 14; i++) {
  WATER_RIPPLES.push({
    x: 1650 + Math.random() * 1100,
    y: 1300 + Math.random() * 80,
    r: 3 + Math.random() * 7,
    speed: 0.3 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2
  });
}

// =========================================================================
// 2B. FIZYKA TERENU I MODUŁOWYCH BLOKÓW MOSTU (ANGRY BIRDS STYLE COLLAPSE)
// =========================================================================
export const LEFT_OVAL_POINTS = [
  { x: 1150, y: 1200 },
  { x: 1300, y: 1225 },
  { x: 1450, y: 1260 },
  { x: 1580, y: 1295 },
  { x: 1680, y: 1320 },
  { x: 1750, y: 1335 }
];

export const RIGHT_OVAL_POINTS = [
  { x: 2650, y: 1335 },
  { x: 2720, y: 1320 },
  { x: 2820, y: 1295 },
  { x: 2950, y: 1260 },
  { x: 3100, y: 1225 },
  { x: 3250, y: 1200 }
];

export function getRiverbankGroundY(x) {
  if (x <= 1150) return 1200;
  if (x >= 3250) return 1200;
  if (x >= 1150 && x <= 1750) {
    for (let i = 0; i < LEFT_OVAL_POINTS.length - 1; i++) {
      if (x >= LEFT_OVAL_POINTS[i].x && x <= LEFT_OVAL_POINTS[i + 1].x) {
        const t = (x - LEFT_OVAL_POINTS[i].x) / (LEFT_OVAL_POINTS[i + 1].x - LEFT_OVAL_POINTS[i].x);
        return LEFT_OVAL_POINTS[i].y + t * (LEFT_OVAL_POINTS[i + 1].y - LEFT_OVAL_POINTS[i].y);
      }
    }
    return 1335;
  }
  if (x >= 2650 && x <= 3250) {
    for (let i = 0; i < RIGHT_OVAL_POINTS.length - 1; i++) {
      if (x >= RIGHT_OVAL_POINTS[i].x && x <= RIGHT_OVAL_POINTS[i + 1].x) {
        const t = (x - RIGHT_OVAL_POINTS[i].x) / (RIGHT_OVAL_POINTS[i + 1].x - RIGHT_OVAL_POINTS[i].x);
        return RIGHT_OVAL_POINTS[i].y + t * (RIGHT_OVAL_POINTS[i + 1].y - RIGHT_OVAL_POINTS[i].y);
      }
    }
    return 1335;
  }
  return 1380; // Dno kanału rzeki
}

// 24 modularne klocki drewniane mostu (rozpiętość X: 1750 do 2650, 900 px)
export const ARENA_3_BRIDGE_BLOCKS = [];
const BRIDGE_BLOCK_COUNT = 24;
const BRIDGE_START_X = 1750;
const BRIDGE_TOTAL_W = 900;
const BRIDGE_BLOCK_W = BRIDGE_TOTAL_W / BRIDGE_BLOCK_COUNT; // 37.5 px
const BRIDGE_BASE_Y = 1000;
const BRIDGE_BLOCK_H = 18;

for (let i = 0; i < BRIDGE_BLOCK_COUNT; i++) {
  const bx = BRIDGE_START_X + i * BRIDGE_BLOCK_W;
  ARENA_3_BRIDGE_BLOCKS.push({
    id: `bridge_block_${i}`,
    name: `Belka Mostu ${i + 1}`,
    type: 'platform',
    isBridgeBlock: true,
    blockIndex: i,
    origX: bx,
    origY: BRIDGE_BASE_Y,
    x: bx,
    y: BRIDGE_BASE_Y,
    w: BRIDGE_BLOCK_W,
    h: BRIDGE_BLOCK_H,
    thickness: BRIDGE_BLOCK_H,
    solid: true,
    isPlatform: true,
    oneWay: true,
    vx: 0,
    vy: 0,
    angle: 0,
    vRot: 0,
    intact: true,
    hp: 320,
    maxHp: 320,
    isAsleep: false,
    sleepTimer: 0,
    cableAttached: true,
    collapseDelay: 0,
    sag: 0,
    sagVel: 0,
    seed: (i * 37 + 13) % 100
  });
}

// =========================================================================
// 2B2. ZNISZCZALNE MODUŁOWE RAMPY PODEJŚCIOWE NA MOST (DESTRUCTIBLE RAMPS)
// Lewe podejście: X: 1150 do 1750 (10 segmentów po 60 px)
// Prawe podejście: X: 2650 do 3250 (10 segmentów po 60 px)
// =========================================================================
export function getApproachInclineY(x, isLeft) {
  if (isLeft) {
    if (x <= 1150) return 1200;
    if (x >= 1750) return 1000;
    const t = (x - 1150) / 600;
    return 1200 - t * 200;
  } else {
    if (x <= 2650) return 1000;
    if (x >= 3250) return 1200;
    const t = (x - 2650) / 600;
    return 1000 + t * 200;
  }
}

export const ARENA_3_RAMP_BLOCKS = [];
const RAMP_BLOCK_COUNT = 10;
const RAMP_BLOCK_W = 60;

// Lewa rampa (X: 1150 do 1750)
for (let i = 0; i < RAMP_BLOCK_COUNT; i++) {
  const bx = 1150 + i * RAMP_BLOCK_W;
  const yStart = getApproachInclineY(bx, true);
  const yEnd = getApproachInclineY(bx + RAMP_BLOCK_W, true);
  const curY = Math.min(yStart, yEnd);
  ARENA_3_RAMP_BLOCKS.push({
    id: `ramp_left_block_${i}`,
    name: `Rampa Lewa - Segment ${i + 1}`,
    type: 'platform',
    isRampBlock: true,
    side: 'left',
    rampIndex: i,
    origX: bx,
    origY: curY,
    x: bx,
    y: curY,
    w: RAMP_BLOCK_W,
    h: 22,
    thickness: 22,
    solid: true,
    isPlatform: true,
    oneWay: true,
    isSlope: true,
    startY: yStart,
    endY: yEnd,
    surfacePoints: [
      { x: bx, y: yStart },
      { x: bx + RAMP_BLOCK_W, y: yEnd }
    ],
    vx: 0,
    vy: 0,
    angle: 0,
    vRot: 0,
    intact: true,
    hp: 350,
    maxHp: 350,
    isAsleep: false,
    sleepTimer: 0,
    collapseDelay: 0,
    stiltX: bx + RAMP_BLOCK_W * 0.5,
    seed: (i * 29 + 17) % 100
  });
}

// Prawa rampa (X: 2650 do 3250)
for (let i = 0; i < RAMP_BLOCK_COUNT; i++) {
  const bx = 2650 + i * RAMP_BLOCK_W;
  const yStart = getApproachInclineY(bx, false);
  const yEnd = getApproachInclineY(bx + RAMP_BLOCK_W, false);
  const curY = Math.min(yStart, yEnd);
  ARENA_3_RAMP_BLOCKS.push({
    id: `ramp_right_block_${i}`,
    name: `Rampa Prawa - Segment ${i + 1}`,
    type: 'platform',
    isRampBlock: true,
    side: 'right',
    rampIndex: i,
    origX: bx,
    origY: curY,
    x: bx,
    y: curY,
    w: RAMP_BLOCK_W,
    h: 22,
    thickness: 22,
    solid: true,
    isPlatform: true,
    oneWay: true,
    isSlope: true,
    startY: yStart,
    endY: yEnd,
    surfacePoints: [
      { x: bx, y: yStart },
      { x: bx + RAMP_BLOCK_W, y: yEnd }
    ],
    vx: 0,
    vy: 0,
    angle: 0,
    vRot: 0,
    intact: true,
    hp: 350,
    maxHp: 350,
    isAsleep: false,
    sleepTimer: 0,
    collapseDelay: 0,
    stiltX: bx + RAMP_BLOCK_W * 0.5,
    seed: (i * 31 + 43) % 100
  });
}

export function breakRampBlock(block, impulseX = 0, impulseY = 0, angularImpulse = 0) {
  if (!block || !block.intact) return;
  block.intact = false;
  block.isSlope = false;
  delete block.surfacePoints;
  // Po zniszczeniu pozostaje namacalny jako swobodny blok fizyczny
  block.solid = true;
  block.isPlatform = true;
  block.oneWay = true;
  block.vx += impulseX;
  block.vy += impulseY;
  block.vRot += angularImpulse;
  block.isAsleep = false;
  block.sleepTimer = 0;

  spawnBridgeSplinters(block.x + block.w / 2, block.y + block.h / 2, impulseX, impulseY, 14);
  if (typeof triggerScreenShake === 'function') {
    triggerScreenShake(7);
  }
}

// Cząsteczki drzazg i odłamków drewna po wybuchach / strzałach
export const BRIDGE_SPLINTERS = [];

export function spawnBridgeSplinters(x, y, vxBase = 0, vyBase = 0, count = 8) {
  for (let i = 0; i < count; i++) {
    BRIDGE_SPLINTERS.push({
      x,
      y,
      vx: vxBase * 0.4 + (Math.random() - 0.5) * 7.5,
      vy: vyBase * 0.4 - Math.random() * 5.5 - 1.5,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.45,
      size: 3 + Math.random() * 5,
      life: 40 + Math.random() * 30,
      maxLife: 70,
      color: ['#785226', '#563814', '#362108', '#8b5a2b', '#2e1909'][Math.floor(Math.random() * 5)]
    });
  }
  if (BRIDGE_SPLINTERS.length > 70) {
    BRIDGE_SPLINTERS.splice(0, BRIDGE_SPLINTERS.length - 70);
  }
}

// Cząsteczki rozbryzgu wody w rzece Areny 3 (pociski, granaty, gejzery)
export const ARENA_3_WATER_SPLASHES = [];

export function spawnArena3WaterSplash(x, y, count = 10, isGeyser = false) {
  const num = isGeyser ? Math.round(count * 2.2) : count;
  for (let i = 0; i < num; i++) {
    ARENA_3_WATER_SPLASHES.push({
      x: x + (Math.random() - 0.5) * (isGeyser ? 44 : 14),
      y: y + (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * (isGeyser ? 9.5 : 4.5),
      vy: isGeyser ? (-Math.random() * 12.0 - 5.5) : (-Math.random() * 5.5 - 2.2),
      size: isGeyser ? (3.5 + Math.random() * 5.0) : (2.0 + Math.random() * 3.5),
      alpha: 0.95,
      life: isGeyser ? (45 + Math.random() * 30) : (25 + Math.random() * 20),
      maxLife: isGeyser ? 75 : 45,
      color: ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#ffffff'][Math.floor(Math.random() * 5)]
    });
  }
  if (ARENA_3_WATER_SPLASHES.length > 100) {
    ARENA_3_WATER_SPLASHES.splice(0, ARENA_3_WATER_SPLASHES.length - 100);
  }
}

export function breakBridgeBlock(block, impulseX = 0, impulseY = 0, angularImpulse = 0) {
  if (!block || !block.intact) return;
  block.intact = false;
  // Zniszczona deska staje się namacalnym spadającym/pływającym obiektem (nie duchem!)
  block.solid = true;
  block.isPlatform = true;
  block.oneWay = true;
  block.cableAttached = false;
  block.vx += impulseX;
  block.vy += impulseY;
  block.vRot += angularImpulse;
  block.isAsleep = false;
  block.sleepTimer = 0;

  spawnBridgeSplinters(block.x + block.w / 2, block.y + block.h / 2, impulseX, impulseY, 10);
}

// =========================================================================
// 2C. PYLONY NOŚNE MOSTU (DESTRUCTIBLE BRIDGE PYLONS - ANGRY BIRDS STYLE)
// Posadowione na potężnych kamiennych kesonach od 1100 do dna rzeki 1395 (NIGDY NIE LEWITUJĄ)
// =========================================================================
export const ARENA_3_PYLONS = {
  left: {
    id: 'pylon_left',
    name: 'Lewy Pylon Mostu',
    x: 1755,
    topY: 850,
    baseY: 1100, // Belki wieży stoją na kesonie kamiennym
    caissonBottomY: 1395, // Osadzony głęboko w litym dnie rzeki
    w: 56,
    h: 250,
    hp: 950,
    maxHp: 950,
    intact: true,
    tiltAngle: 0,
    vRot: 0,
    collapsed: false
  },
  right: {
    id: 'pylon_right',
    name: 'Prawy Pylon Mostu',
    x: 2645,
    topY: 850,
    baseY: 1100,
    caissonBottomY: 1395,
    w: 56,
    h: 250,
    hp: 950,
    maxHp: 950,
    intact: true,
    tiltAngle: 0,
    vRot: 0,
    collapsed: false
  }
};

export function destroyPylon(k) {
  const p = ARENA_3_PYLONS[k];
  if (!p || !p.intact) return;
  p.intact = false;
  p.vRot = (k === 'left' ? 0.022 : -0.022);
  spawnBridgeSplinters(p.x, 1025, (k === 'left' ? 6 : -6), -4, 25);
  if (typeof triggerScreenShake === 'function') {
    triggerScreenShake(14);
  }
  // Odczep liny nośne z tej strony
  for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
    if ((k === 'left' && i < 14) || (k === 'right' && i >= 10)) {
      ARENA_3_BRIDGE_BLOCKS[i].cableAttached = false;
    }
  }
  evaluateBridgeIntegrity();
}

// =========================================================================
// 2D. WISZĄCE POMOSTY W KORONACH DRZEW (DESTRUCTIBLE CANOPY PLATFORMS)
// Pełna fizyka dwuliniowego wahadła, kołysania, ugięcia i przechyłu pod ciężarem gracza
// =========================================================================
export const ARENA_3_CANOPY_PLATFORMS = [
  {
    id: 'bridge_skywalk_left',
    name: 'Wiszący Pomost Nad Mostem Lewy',
    origX: 1880,
    origY: 620,
    w: 260,
    h: 20,
    ropeLeft: { x: 1900, anchorX: 1900, anchorY: 0, intact: true, hp: 180, maxHp: 180 },
    ropeRight: { x: 2120, anchorX: 2120, anchorY: 0, intact: true, hp: 180, maxHp: 180 },
    swayX: 0,
    swayVx: 0,
    bounceY: 0,
    bounceVy: 0,
    tiltAngle: 0,
    vRot: 0,
    isSplit: false,
    _splitTriggered: false,
    leftTiltAngle: 0,
    leftVRot: 0,
    leftSwayX: 0,
    leftSwayVx: 0,
    leftBounceY: 0,
    leftBounceVy: 0,
    rightTiltAngle: 0,
    rightVRot: 0,
    rightSwayX: 0,
    rightSwayVx: 0,
    rightBounceY: 0,
    rightBounceVy: 0,
    blocks: []
  },
  {
    id: 'bridge_skywalk_right',
    name: 'Wiszący Pomost Nad Mostem Prawy',
    origX: 2260,
    origY: 620,
    w: 260,
    h: 20,
    ropeLeft: { x: 2280, anchorX: 2280, anchorY: 0, intact: true, hp: 180, maxHp: 180 },
    ropeRight: { x: 2500, anchorX: 2500, anchorY: 0, intact: true, hp: 180, maxHp: 180 },
    swayX: 0,
    swayVx: 0,
    bounceY: 0,
    bounceVy: 0,
    tiltAngle: 0,
    vRot: 0,
    isSplit: false,
    _splitTriggered: false,
    leftTiltAngle: 0,
    leftVRot: 0,
    leftSwayX: 0,
    leftSwayVx: 0,
    leftBounceY: 0,
    leftBounceVy: 0,
    rightTiltAngle: 0,
    rightVRot: 0,
    rightSwayX: 0,
    rightSwayVx: 0,
    rightBounceY: 0,
    rightBounceVy: 0,
    blocks: []
  },
  {
    id: 'bridge_skywalk_upper_left',
    name: 'Wiszący Pomost Górny Lewy (Flanka)',
    origX: 1400,
    origY: 430,
    w: 300,
    h: 20,
    ropeLeft: { x: 1420, anchorX: 1420, anchorY: 0, intact: true, hp: 180, maxHp: 180 },
    ropeRight: { x: 1680, anchorX: 1680, anchorY: 0, intact: true, hp: 180, maxHp: 180 },
    swayX: 0,
    swayVx: 0,
    bounceY: 0,
    bounceVy: 0,
    tiltAngle: 0,
    vRot: 0,
    isSplit: false,
    _splitTriggered: false,
    leftTiltAngle: 0,
    leftVRot: 0,
    leftSwayX: 0,
    leftSwayVx: 0,
    leftBounceY: 0,
    leftBounceVy: 0,
    rightTiltAngle: 0,
    rightVRot: 0,
    rightSwayX: 0,
    rightSwayVx: 0,
    rightBounceY: 0,
    rightBounceVy: 0,
    blocks: []
  },
  {
    id: 'bridge_skywalk_upper_right',
    name: 'Wiszący Pomost Górny Prawy (Flanka)',
    origX: 2700,
    origY: 430,
    w: 300,
    h: 20,
    ropeLeft: { x: 2720, anchorX: 2720, anchorY: 0, intact: true, hp: 180, maxHp: 180 },
    ropeRight: { x: 2980, anchorX: 2980, anchorY: 0, intact: true, hp: 180, maxHp: 180 },
    swayX: 0,
    swayVx: 0,
    bounceY: 0,
    bounceVy: 0,
    tiltAngle: 0,
    vRot: 0,
    isSplit: false,
    _splitTriggered: false,
    leftTiltAngle: 0,
    leftVRot: 0,
    leftSwayX: 0,
    leftSwayVx: 0,
    leftBounceY: 0,
    leftBounceVy: 0,
    rightTiltAngle: 0,
    rightVRot: 0,
    rightSwayX: 0,
    rightSwayVx: 0,
    rightBounceY: 0,
    rightBounceVy: 0,
    blocks: []
  }
];

export const ALL_CANOPY_BLOCKS = [];
const CANOPY_BLOCKS_PER_PLATFORM = 5;

for (let pIdx = 0; pIdx < ARENA_3_CANOPY_PLATFORMS.length; pIdx++) {
  const plat = ARENA_3_CANOPY_PLATFORMS[pIdx];
  const blockW = plat.w / CANOPY_BLOCKS_PER_PLATFORM;
  for (let bIdx = 0; bIdx < CANOPY_BLOCKS_PER_PLATFORM; bIdx++) {
    const bx = plat.origX + bIdx * blockW;
    const block = {
      id: `${plat.id}_block_${bIdx}`,
      name: `${plat.name} - Belka ${bIdx + 1}`,
      type: 'platform',
      isCanopyBlock: true,
      parentPlatId: plat.id,
      blockIndex: bIdx,
      origX: bx,
      origY: plat.origY,
      x: bx,
      y: plat.origY,
      w: blockW,
      h: plat.h,
      thickness: plat.h,
      solid: true,
      isPlatform: true,
      oneWay: true,
      vx: 0,
      vy: 0,
      angle: 0,
      vRot: 0,
      intact: true,
      hp: 280,
      maxHp: 280,
      isAsleep: false,
      sleepTimer: 0,
      collapseDelay: 0,
      seed: (pIdx * 31 + bIdx * 17) % 100
    };
    plat.blocks.push(block);
    ALL_CANOPY_BLOCKS.push(block);
  }
}

export function evaluateCanopyPlatformIntegrity(plat) {
  if (!plat || plat._evaluatingIntegrity) return;
  plat._evaluatingIntegrity = true;

  try {
    let leftChainEnd = -1;
    for (let i = 0; i < plat.blocks.length; i++) {
      if (plat.blocks[i].intact) {
        leftChainEnd = i;
      } else {
        break;
      }
    }

    let rightChainStart = plat.blocks.length;
    for (let i = plat.blocks.length - 1; i >= 0; i--) {
      if (plat.blocks[i].intact) {
        rightChainStart = i;
      } else {
        break;
      }
    }

    const isContinuous = (leftChainEnd >= rightChainStart - 1) && (leftChainEnd >= 0);

    // Klocki odcięte od obu lin odpadają natychmiast
    for (let i = 0; i < plat.blocks.length; i++) {
      const b = plat.blocks[i];
      if (b.intact) {
        const inLeft = (i <= leftChainEnd && plat.ropeLeft.intact);
        const inRight = (i >= rightChainStart && plat.ropeRight.intact);
        if (!inLeft && !inRight) {
          breakCanopyBlock(b, (Math.random() - 0.5) * 3, Math.random() * 2 + 1, (Math.random() - 0.5) * 0.2);
        }
      }
    }

    if (isContinuous) {
      plat.isSplit = false;
    } else {
      const hasLeftSegment = (leftChainEnd >= 0 && plat.ropeLeft.intact);
      const hasRightSegment = (rightChainStart < plat.blocks.length && plat.ropeRight.intact);

      if (hasLeftSegment && hasRightSegment) {
        plat.isSplit = true;
        if (!plat._splitTriggered) {
          plat._splitTriggered = true;
          plat.leftTiltAngle = plat.tiltAngle || 0;
          plat.rightTiltAngle = plat.tiltAngle || 0;
          plat.leftVRot = 0.85;
          plat.rightVRot = -0.85;
          plat.leftSwayX = plat.swayX || 0;
          plat.rightSwayX = plat.swayX || 0;
          plat.leftSwayVx = -1.6;
          plat.rightSwayVx = 1.6;
          plat.leftBounceY = plat.bounceY || 0;
          plat.rightBounceY = plat.bounceY || 0;
          if (typeof triggerScreenShake === 'function') {
            triggerScreenShake(7);
          }
          const breakX = plat.origX + (leftChainEnd + 1) * (plat.w / plat.blocks.length);
          spawnBridgeSplinters(breakX, plat.origY + 10, 0, -3, 16);
        }
      } else if (hasLeftSegment && !hasRightSegment) {
        if (plat.isSplit) {
          plat.tiltAngle = plat.leftTiltAngle || 0;
          plat.vRot = plat.leftVRot || 0;
          plat.swayX = plat.leftSwayX || 0;
          plat.swayVx = plat.leftSwayVx || 0;
          plat.bounceY = plat.leftBounceY || 0;
        }
        plat.isSplit = false;
        plat.ropeRight.intact = false;
      } else if (hasRightSegment && !hasLeftSegment) {
        if (plat.isSplit) {
          plat.tiltAngle = plat.rightTiltAngle || 0;
          plat.vRot = plat.rightVRot || 0;
          plat.swayX = plat.rightSwayX || 0;
          plat.swayVx = plat.rightSwayVx || 0;
          plat.bounceY = plat.rightBounceY || 0;
        }
        plat.isSplit = false;
        plat.ropeLeft.intact = false;
      } else {
        plat.isSplit = false;
        plat.ropeLeft.intact = false;
        plat.ropeRight.intact = false;
      }
    }
  } finally {
    plat._evaluatingIntegrity = false;
  }
}

export function onCanopyRopeSnapped(plat, side) {
  if (typeof triggerScreenShake === 'function') {
    triggerScreenShake(8);
  }
  const snapX = (side === 'left' ? (plat.attachLX ?? plat.ropeLeft.x) : (plat.attachRX ?? plat.ropeRight.x));
  const snapY = (side === 'left' ? (plat.attachLY ?? plat.origY) : (plat.attachRY ?? plat.origY));
  spawnBridgeSplinters(snapX, snapY, 0, -3, 14);

  if (!plat.ropeLeft.intact && !plat.ropeRight.intact) {
    for (let i = 0; i < plat.blocks.length; i++) {
      const b = plat.blocks[i];
      if (b.intact) {
        breakCanopyBlock(b, (Math.random() - 0.5) * 3, Math.random() * 2 + 1, (Math.random() - 0.5) * 0.2);
      }
    }
  } else {
    evaluateCanopyPlatformIntegrity(plat);
    // Impuls początkowy swobodnego wahadła po zerwaniu liny (opadanie od poziomu do pionu z bezwładnością)
    plat.vRot = (plat.vRot || 0) + (side === 'left' ? -0.95 : 0.95);
    plat.swayVx = (plat.swayVx || 0) + (side === 'left' ? 2.4 : -2.4);
    plat.bounceVy = (plat.bounceVy || 0) + 35.0;
  }
}

export function breakCanopyBlock(block, impulseX = 0, impulseY = 0, angularImpulse = 0) {
  if (!block || !block.intact) return;
  block.intact = false;
  // Pozostaje solidnym i namacalnym obiektem
  block.solid = true;
  block.isPlatform = true;
  block.oneWay = true;
  block.vx += impulseX;
  block.vy += impulseY;
  block.vRot += angularImpulse;
  block.isAsleep = false;
  block.sleepTimer = 0;

  spawnBridgeSplinters(block.x + block.w / 2, block.y + block.h / 2, impulseX, impulseY, 10);

  const parentPlat = ARENA_3_CANOPY_PLATFORMS.find(p => p.id === block.parentPlatId);
  if (parentPlat) {
    evaluateCanopyPlatformIntegrity(parentPlat);
  }
}

export function evaluateBridgeIntegrity() {
  let segStart = -1;
  const segments = [];
  for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
    if (ARENA_3_BRIDGE_BLOCKS[i].intact) {
      if (segStart === -1) segStart = i;
    } else {
      if (segStart !== -1) {
        segments.push({ start: segStart, end: i - 1 });
        segStart = -1;
      }
    }
  }
  if (segStart !== -1) {
    segments.push({ start: segStart, end: ARENA_3_BRIDGE_BLOCKS.length - 1 });
  }

  for (const seg of segments) {
    const anchoredLeft = (seg.start === 0 && ARENA_3_PYLONS.left.intact);
    const anchoredRight = (seg.end === ARENA_3_BRIDGE_BLOCKS.length - 1 && ARENA_3_PYLONS.right.intact);

    if (!anchoredLeft && !anchoredRight) {
      for (let i = seg.start; i <= seg.end; i++) {
        const b = ARENA_3_BRIDGE_BLOCKS[i];
        if (b.intact && b.collapseDelay === 0) {
          const distFromEdge = Math.min(i - seg.start, seg.end - i);
          b.collapseDelay = Math.max(1, distFromEdge * 3);
        }
      }
    } else {
      const segLen = (seg.end - seg.start + 1);
      if (segLen > 8) {
        if (anchoredLeft && !anchoredRight) {
          for (let i = seg.end; i > seg.start + 7; i--) {
            const b = ARENA_3_BRIDGE_BLOCKS[i];
            if (b.intact && b.collapseDelay === 0) {
              b.collapseDelay = (seg.end - i + 1) * 3;
            }
          }
        } else if (anchoredRight && !anchoredLeft) {
          for (let i = seg.start; i < seg.end - 7; i++) {
            const b = ARENA_3_BRIDGE_BLOCKS[i];
            if (b.intact && b.collapseDelay === 0) {
              b.collapseDelay = (i - seg.start + 1) * 3;
            }
          }
        }
      }
    }
  }
}

export function resetArena3() {
  // 1. Reset pylonów
  for (const k of ['left', 'right']) {
    const p = ARENA_3_PYLONS[k];
    p.hp = p.maxHp;
    p.intact = true;
    p.tiltAngle = 0;
    p.vRot = 0;
    p.collapsed = false;
  }

  // 2. Reset kładki mostu
  for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
    const b = ARENA_3_BRIDGE_BLOCKS[i];
    b.x = b.origX;
    b.y = b.origY;
    b.vx = 0;
    b.vy = 0;
    b.angle = 0;
    b.vRot = 0;
    b.intact = true;
    b.hp = b.maxHp;
    b.solid = true;
    b.isPlatform = true;
    b.oneWay = true;
    b.isAsleep = false;
    b.sleepTimer = 0;
    b.cableAttached = true;
    b.collapseDelay = 0;
    b.sag = 0;
    b.sagVel = 0;
  }

  // 2B. Reset ramp podejściowych
  for (let i = 0; i < ARENA_3_RAMP_BLOCKS.length; i++) {
    const b = ARENA_3_RAMP_BLOCKS[i];
    b.x = b.origX;
    b.y = b.origY;
    b.vx = 0;
    b.vy = 0;
    b.angle = 0;
    b.vRot = 0;
    b.intact = true;
    b.hp = b.maxHp;
    b.solid = true;
    b.isPlatform = true;
    b.oneWay = true;
    b.isSlope = true;
    b.isAsleep = false;
    b.sleepTimer = 0;
    b.collapseDelay = 0;
    const yStart = getApproachInclineY(b.origX, b.side === 'left');
    const yEnd = getApproachInclineY(b.origX + b.w, b.side === 'left');
    b.surfacePoints = [
      { x: b.origX, y: yStart },
      { x: b.origX + b.w, y: yEnd }
    ];
  }

  // 3. Reset pomostów wiszących
  for (let pIdx = 0; pIdx < ARENA_3_CANOPY_PLATFORMS.length; pIdx++) {
    const plat = ARENA_3_CANOPY_PLATFORMS[pIdx];
    plat.ropeLeft.intact = true;
    plat.ropeLeft.hp = plat.ropeLeft.maxHp;
    plat.ropeRight.intact = true;
    plat.ropeRight.hp = plat.ropeRight.maxHp;
    plat.swayX = 0;
    plat.swayVx = 0;
    plat.bounceY = 0;
    plat.bounceVy = 0;
    plat.tiltAngle = 0;
    plat.vRot = 0;
    plat.isSplit = false;
    plat._splitTriggered = false;
    plat.leftTiltAngle = 0;
    plat.leftVRot = 0;
    plat.leftSwayX = 0;
    plat.leftSwayVx = 0;
    plat.leftBounceY = 0;
    plat.leftBounceVy = 0;
    plat.rightTiltAngle = 0;
    plat.rightVRot = 0;
    plat.rightSwayX = 0;
    plat.rightSwayVx = 0;
    plat.rightBounceY = 0;
    plat.rightBounceVy = 0;
    plat.attachLX = plat.ropeLeft.x;
    plat.attachLY = plat.origY;
    plat.attachRX = plat.ropeRight.x;
    plat.attachRY = plat.origY;
    for (let bIdx = 0; bIdx < plat.blocks.length; bIdx++) {
      const b = plat.blocks[bIdx];
      b.x = b.origX;
      b.y = b.origY;
      b.vx = 0;
      b.vy = 0;
      b.angle = 0;
      b.vRot = 0;
      b.intact = true;
      b.hp = b.maxHp;
      b.solid = true;
      b.isPlatform = true;
      b.oneWay = true;
      b.isAsleep = false;
      b.sleepTimer = 0;
      b.collapseDelay = 0;
    }
  }

  // 4. Reset płyt skalnych snajperów
  for (let i = 0; i < ARENA_3_SNIPER_SLABS.length; i++) {
    const slab = ARENA_3_SNIPER_SLABS[i];
    slab.x = slab.origX;
    slab.y = slab.origY;
    slab.vx = 0;
    slab.vy = 0;
    slab.angle = 0;
    slab.vRot = 0;
    slab.intact = true;
    slab.hp = slab.maxHp;
    slab.solid = true;
    slab.isPlatform = true;
    slab.oneWay = true;
    slab.isAsleep = false;
    slab.sleepTimer = 0;
  }

  // 5. Reset wież bojowych i podestów
  for (const side of ['left', 'right']) {
    const pillar = ARENA_3_TOWER_PILLARS[side];
    pillar.hp = pillar.maxHp;
    pillar.intact = true;
    pillar.tiltAngle = 0;
    pillar.vRot = 0;
    pillar.collapsed = false;
  }
  for (let i = 0; i < ARENA_3_TOWER_BLOCKS.length; i++) {
    const b = ARENA_3_TOWER_BLOCKS[i];
    b.x = b.origX;
    b.y = b.origY;
    b.vx = 0;
    b.vy = 0;
    b.angle = 0;
    b.vRot = 0;
    b.intact = true;
    b.hp = b.maxHp;
    b.solid = true;
    b.isPlatform = true;
    b.oneWay = true;
    b.isAsleep = false;
    b.sleepTimer = 0;
  }
  const stemL = ARENA_3_PLATFORMS.find(p => p.id === 'tower_cyan_stem');
  if (stemL) {
    stemL.solid = true;
    stemL.isWall = true;
  }
  const stemR = ARENA_3_PLATFORMS.find(p => p.id === 'tower_orange_stem');
  if (stemR) {
    stemR.solid = true;
    stemR.isWall = true;
  }
  if (typeof window !== 'undefined' && Array.isArray(window.ARENA_PLATFORMS)) {
    const actStemL = window.ARENA_PLATFORMS.find(p => p && p.id === 'tower_cyan_stem');
    if (actStemL) {
      actStemL.solid = true;
      actStemL.isWall = true;
    }
    const actStemR = window.ARENA_PLATFORMS.find(p => p && p.id === 'tower_orange_stem');
    if (actStemR) {
      actStemR.solid = true;
      actStemR.isWall = true;
    }
  }

  BRIDGE_SPLINTERS.length = 0;
  STONE_DEBRIS.length = 0;
}

// =========================================================================
// 2E. CZĄSTECZKI ODŁAMKÓW SKALNYCH I PYŁU (STONE DEBRIS)
// =========================================================================
export const STONE_DEBRIS = [];

export function spawnStoneDebris(x, y, vxBase = 0, vyBase = 0, count = 10) {
  for (let i = 0; i < count; i++) {
    STONE_DEBRIS.push({
      x,
      y,
      vx: vxBase * 0.4 + (Math.random() - 0.5) * 8.5,
      vy: vyBase * 0.4 - Math.random() * 5.5 - 2.0,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.35,
      size: 4 + Math.random() * 6,
      life: 50 + Math.random() * 35,
      maxLife: 85,
      color: ['#475569', '#334155', '#1e293b', '#64748b', '#3f4738', '#52525b'][Math.floor(Math.random() * 6)]
    });
  }
  if (STONE_DEBRIS.length > 80) {
    STONE_DEBRIS.splice(0, STONE_DEBRIS.length - 80);
  }
}

// =========================================================================
// 2F. ZNISZCZALNE PÓŁKI SKALNE SNAJPERÓW (DESTRUCTIBLE SNIPER ROCK SLABS)
// 4 modularne płyty skalne na lewej półce (X: 600-1000, Y: 800)
// 4 modularne płyty skalne na prawej półce (X: 3400-3800, Y: 800)
// =========================================================================
export const ARENA_3_SNIPER_SLABS = [];
const SNIPER_SLABS_CONFIG = [
  { side: 'left', id: 'sniper_shelf_left', startX: 600, y: 800, w: 400, h: 34, count: 4, name: 'Półka Snajperska Lewa' },
  { side: 'right', id: 'sniper_shelf_right', startX: 3400, y: 800, w: 400, h: 34, count: 4, name: 'Prawa Półka Snajperska' }
];

for (const cfg of SNIPER_SLABS_CONFIG) {
  const slabW = cfg.w / cfg.count;
  for (let i = 0; i < cfg.count; i++) {
    const sx = cfg.startX + i * slabW;
    ARENA_3_SNIPER_SLABS.push({
      id: `${cfg.id}_slab_${i}`,
      name: `${cfg.name} - Płyta ${i + 1}`,
      type: 'platform',
      isSniperSlab: true,
      side: cfg.side,
      slabIndex: i,
      origX: sx,
      origY: cfg.y,
      x: sx,
      y: cfg.y,
      w: slabW,
      h: cfg.h,
      thickness: cfg.h,
      solid: true,
      isPlatform: true,
      oneWay: true,
      vx: 0,
      vy: 0,
      angle: 0,
      vRot: 0,
      intact: true,
      hp: 500,
      maxHp: 500,
      isAsleep: false,
      sleepTimer: 0,
      seed: (i * 29 + (cfg.side === 'left' ? 7 : 43)) % 100
    });
  }
}

export function breakSniperSlab(slab, impulseX = 0, impulseY = 0, angularImpulse = 0) {
  if (!slab || !slab.intact) return;
  slab.intact = false;
  // Pozostaje solidnym i namacalnym obiektem
  slab.solid = true;
  slab.isPlatform = true;
  slab.oneWay = true;
  slab.vx += impulseX;
  slab.vy += impulseY;
  slab.vRot += angularImpulse;
  slab.isAsleep = false;
  slab.sleepTimer = 0;

  spawnStoneDebris(slab.x + slab.w / 2, slab.y + slab.h / 2, impulseX, impulseY, 15);
  if (typeof triggerScreenShake === 'function') {
    triggerScreenShake(8);
  }
}

// =========================================================================
// 2G. ZNISZCZALNE WIEŻE STRAŻNICZE ALPHA I BRAVO (WATCHTOWERS & SNIPER NESTS)
// Słupy nośne (filary tekowego drewna) oraz modularne podesty inspekcyjne i snajperskie
// =========================================================================
export const ARENA_3_TOWER_PILLARS = {
  left: {
    id: 'tower_pillar_left',
    side: 'left',
    name: 'Wieża Alfa - Główny Filar Nośny',
    stemX: 185,
    topY: 400,
    baseY: 1200,
    w: 30,
    h: 800,
    hp: 750,
    maxHp: 750,
    intact: true,
    tiltAngle: 0,
    vRot: 0,
    collapsed: false
  },
  right: {
    id: 'tower_pillar_right',
    side: 'right',
    name: 'Wieża Bravo - Główny Filar Nośny',
    stemX: 4185,
    topY: 400,
    baseY: 1200,
    w: 30,
    h: 800,
    hp: 750,
    maxHp: 750,
    intact: true,
    tiltAngle: 0,
    vRot: 0,
    collapsed: false
  }
};

export const ARENA_3_TOWER_BLOCKS = [];

const TOWER_DECKS_CONFIG = [
  // Wieża Lewa (Alfa)
  { side: 'left', tier: 'lower', id: 'tower_cyan_deck', startX: 120, y: 600, w: 160, h: 24, count: 2, name: 'Wieża Alfa - Pomost Dolny' },
  { side: 'left', tier: 'upper', id: 'tower_cyan_sniper_deck', startX: 100, y: 400, w: 200, h: 22, count: 3, name: 'Wieża Alfa - Pomost Snajperski' },
  // Wieża Prawa (Bravo)
  { side: 'right', tier: 'lower', id: 'tower_orange_deck', startX: 4120, y: 600, w: 160, h: 24, count: 2, name: 'Wieża Bravo - Pomost Dolny' },
  { side: 'right', tier: 'upper', id: 'tower_orange_sniper_deck', startX: 4100, y: 400, w: 200, h: 22, count: 3, name: 'Wieża Bravo - Pomost Snajperski' }
];

for (const deckCfg of TOWER_DECKS_CONFIG) {
  const blockW = deckCfg.w / deckCfg.count;
  for (let i = 0; i < deckCfg.count; i++) {
    const bx = deckCfg.startX + i * blockW;
    ARENA_3_TOWER_BLOCKS.push({
      id: `${deckCfg.id}_block_${i}`,
      name: `${deckCfg.name} - Segment ${i + 1}`,
      type: 'platform',
      isTowerBlock: true,
      side: deckCfg.side,
      tier: deckCfg.tier,
      deckIndex: i,
      origX: bx,
      origY: deckCfg.y,
      x: bx,
      y: deckCfg.y,
      w: blockW,
      h: deckCfg.h,
      thickness: deckCfg.h,
      solid: true,
      isPlatform: true,
      oneWay: true,
      vx: 0,
      vy: 0,
      angle: 0,
      vRot: 0,
      intact: true,
      hp: 300,
      maxHp: 300,
      isAsleep: false,
      sleepTimer: 0,
      seed: (i * 23 + (deckCfg.side === 'left' ? 11 : 67)) % 100
    });
  }
}

export function breakTowerBlock(block, impulseX = 0, impulseY = 0, angularImpulse = 0) {
  if (!block || !block.intact) return;
  block.intact = false;
  // Pozostaje solidnym i namacalnym obiektem
  block.solid = true;
  block.isPlatform = true;
  block.oneWay = true;
  block.vx += impulseX;
  block.vy += impulseY;
  block.vRot += angularImpulse;
  block.isAsleep = false;
  block.sleepTimer = 0;

  if (typeof window !== 'undefined' && Array.isArray(window.ARENA_PLATFORMS)) {
    const actBlock = window.ARENA_PLATFORMS.find(p => p && p.id === block.id);
    if (actBlock && actBlock !== block) {
      actBlock.intact = false;
      actBlock.solid = true;
      actBlock.isPlatform = true;
      actBlock.oneWay = true;
      actBlock.x = block.x;
      actBlock.y = block.y;
      actBlock.vx = block.vx;
      actBlock.vy = block.vy;
      actBlock.isAsleep = false;
      actBlock.sleepTimer = 0;
    }
  }

  spawnBridgeSplinters(block.x + block.w / 2, block.y + block.h / 2, impulseX, impulseY, 12);
  if (typeof triggerScreenShake === 'function') {
    triggerScreenShake(6);
  }
}

export function destroyTowerPillar(side) {
  const pillar = ARENA_3_TOWER_PILLARS[side];
  if (!pillar || !pillar.intact) return;
  pillar.intact = false;
  pillar.vRot = (side === 'left' ? -0.024 : 0.024);

  spawnBridgeSplinters(pillar.stemX, 600, (side === 'left' ? -7 : 7), -4, 28);
  if (typeof triggerScreenShake === 'function') {
    triggerScreenShake(14);
  }

  // Odłamanie wszystkich podestów na tej wieży
  for (let i = 0; i < ARENA_3_TOWER_BLOCKS.length; i++) {
    const b = ARENA_3_TOWER_BLOCKS[i];
    if (b.side === side && b.intact) {
      breakTowerBlock(b, (side === 'left' ? -4.5 : 4.5) + (Math.random() - 0.5) * 2, Math.random() * 2 + 1.2, (side === 'left' ? -0.16 : 0.16));
    }
  }

  // Dezaktywacja ściany filaru
  const stemId = (side === 'left' ? 'tower_cyan_stem' : 'tower_orange_stem');
  const stemObj = ARENA_3_PLATFORMS.find(p => p.id === stemId);
  if (stemObj) {
    stemObj.solid = false;
    stemObj.isWall = false;
  }
  if (typeof window !== 'undefined' && Array.isArray(window.ARENA_PLATFORMS)) {
    const actStem = window.ARENA_PLATFORMS.find(p => p && p.id === stemId);
    if (actStem) {
      actStem.solid = false;
      actStem.isWall = false;
    }
  }
}

// =========================================================================
// 3. STATYCZNA GEOMETRIA I PLATFORMY KOLIZYJNE (ARENA_3_PLATFORMS)
//
// Układ współrzędnych: [0,0] w lewym górnym rogu; [4400, 1400] w prawym dolnym.
// =========================================================================
export const ARENA_3_PLATFORMS = [

  // -----------------------------------------------------------------------
  // GRANICE ŚWIATA (Ściany boczne zapobiegające wypadnięciu poza canvas 4400 px)
  // -----------------------------------------------------------------------
  {
    id: 'world_boundary_left',
    name: 'Lewa Krawędź Świata',
    x: -60,
    y: 0,
    w: 60,
    h: 1400,
    solid: true,
    isPlatform: false,
    isWall: true,
    pushSide: 'right'
  },
  {
    id: 'world_boundary_right',
    name: 'Prawa Krawędź Świata',
    x: 4400,
    y: 0,
    w: 60,
    h: 1400,
    solid: true,
    isPlatform: false,
    isWall: true,
    pushSide: 'left'
  },

  // -----------------------------------------------------------------------
  // A. PODŁOŻE, ŁAGODNE PODEJŚCIA NA MOST I OWALNE STOKI DO WODY
  // - Płaski grunt główny (X: 0-1150 oraz X: 3250-4400, Y: 1200)
  // - Łagodne podejścia na most (X: 1150-1750 oraz X: 2650-3250, Y: 1200 do 1000)
  // - Owalne brzegi rzeczne schodzące do wody (X: 1150-1750 oraz X: 2650-3250, Y: 1200 do 1335)
  // -----------------------------------------------------------------------
  {
    id: 'ground_left',
    name: 'Lewy Brzeg - Płaski Grunt',
    x: 0,
    y: 1200,
    w: 1150,
    h: 200,
    thickness: 200,
    solid: true,
    isPlatform: true,
    surfacePoints: [
      { x: 0, y: 1200 },
      { x: 500, y: 1200 },
      { x: 1000, y: 1200 },
      { x: 1150, y: 1200 }
    ]
  },
  // -----------------------------------------------------------------------
  // ZNISZCZALNE MODUŁOWE RAMPY PODEJŚCIOWE NA MOST (X: 1150-1750 oraz 2650-3250)
  // -----------------------------------------------------------------------
  ...ARENA_3_RAMP_BLOCKS,

  {
    id: 'riverbank_left_oval',
    name: 'Lewy Brzeg - Owalny Stok Schodzący do Wody',
    x: 1150,
    y: 1200,
    w: 600,
    h: 200,
    thickness: 200,
    solid: true,
    isPlatform: true,
    surfacePoints: [
      { x: 1150, y: 1200 },
      { x: 1300, y: 1225 },
      { x: 1450, y: 1260 },
      { x: 1580, y: 1295 },
      { x: 1680, y: 1320 },
      { x: 1750, y: 1335 }
    ]
  },
  {
    id: 'riverbank_right_oval',
    name: 'Prawy Brzeg - Owalny Stok Schodzący do Wody',
    x: 2650,
    y: 1200,
    w: 600,
    h: 200,
    thickness: 200,
    solid: true,
    isPlatform: true,
    surfacePoints: [
      { x: 2650, y: 1335 },
      { x: 2720, y: 1320 },
      { x: 2820, y: 1295 },
      { x: 2950, y: 1260 },
      { x: 3100, y: 1225 },
      { x: 3250, y: 1200 }
    ]
  },
  {
    id: 'ground_right',
    name: 'Prawy Brzeg - Płaski Grunt',
    x: 3250,
    y: 1200,
    w: 1150,
    h: 200,
    thickness: 200,
    solid: true,
    isPlatform: true,
    surfacePoints: [
      { x: 3250, y: 1200 },
      { x: 3400, y: 1200 },
      { x: 3900, y: 1200 },
      { x: 4400, y: 1200 }
    ]
  },

  // -----------------------------------------------------------------------
  // A. STREFA WODY (TRIGGER AREA - X: 1600 do 2800, Y: 1300 do 1400)
  // Śmiertelna głębia: gracz tonie, piłka natychmiast wraca na środek
  // -----------------------------------------------------------------------
  {
    id: 'water_zone',
    name: 'Rzeka / Strefa Wody (Śmiertelna)',
    type: 'water',
    x: 1600,
    y: 1300,
    w: 1200,
    h: 100,
    solid: false,
    isPlatform: false,
    passBall: true,
    waterDrag: 0.6
  },

  // -----------------------------------------------------------------------
  // B. DREWNIANE WIEŻE NOŚNE (Główne pionowe słupy nośne)
  // -----------------------------------------------------------------------
  // Wieża Lewa (Alfa - Team A):
  {
    id: 'tower_cyan_stem',
    name: 'Drewniana Wieża Lewa - Filar Nośny',
    x: 185,
    y: 624,
    w: 30,
    h: 576,
    solid: true,
    isPlatform: false,
    isWall: true
  },
  // Wieża Prawa (Bravo - Team B):
  {
    id: 'tower_orange_stem',
    name: 'Drewniana Wieża Prawa - Filar Nośny',
    x: 4185,
    y: 624,
    w: 30,
    h: 576,
    solid: true,
    isPlatform: false,
    isWall: true
  },

  // -----------------------------------------------------------------------
  // B. ZNISZCZALNE MODUŁOWE PÓŁKI SKALNE SNAJPERÓW (X: 600 i X: 3400, Y: 800)
  // 8 modularnych płyt skalnych rozpadających się pod ogniem i wybuchami
  // -----------------------------------------------------------------------
  ...ARENA_3_SNIPER_SLABS,

  // -----------------------------------------------------------------------
  // C. ZNISZCZALNE POMOSTY WIEŻ STRAŻNICZYCH (Y: 600 dolne oraz Y: 400 górne)
  // Modularne segmenty drewnianych podestów baz Alfa i Bravo
  // -----------------------------------------------------------------------
  ...ARENA_3_TOWER_BLOCKS,

  // -----------------------------------------------------------------------
  // D. WISZĄCY MOST MODUŁOWY (Angry Birds Style Physics Blocks)
  // Przęsło rozpięte od X: 1750 do 2650 (24 zniszczalne drewniane belki/klocki)
  // -----------------------------------------------------------------------
  ...ARENA_3_BRIDGE_BLOCKS,

  // -----------------------------------------------------------------------
  // E. PLATFORMY W KORONACH DRZEW (POZIOM ŚREDNI Y: 620 ORAZ NAJWYŻSZY Y: 430)
  // Zniszczalne modułowe pomosty taktyczne w koronach drzew (Angry Birds Physics)
  // -----------------------------------------------------------------------
  ...ALL_CANOPY_BLOCKS
];

// =========================================================================
// 4. OBIEKTY SPECJALNE (CUSTOM OBJECTS)
// Czysty tryb bojowy / Tactical Combat - brak bramek piłkarskich
// =========================================================================
export const ARENA_3_CUSTOM_OBJECTS = [];

// =========================================================================
// PUNKTY ODRODZEŃ (SPAWNERS)
// =========================================================================
export const ARENA_3_SPAWNS = {
  teamA: [
    { x: 1050, y: 1130 }, // Na płaskim gruncie tuż przed wejściem na rampę mostu (X: 1050, Y: 1130)
    { x: 800, y: 730 }    // Na platformie snajperskiej Y: 800
  ],
  teamB: [
    { x: 3350, y: 1130 }, // Na płaskim gruncie tuż przed wejściem na prawe podejście (X: 3350, Y: 1130)
    { x: 3600, y: 730 }   // Na platformie snajperskiej Y: 800
  ]
};

export const ARENA_3_MINECARTS = [];

export function resetArena3Minecarts() {}
export function resetArena3Breaches() {}

// =========================================================================
// 5. GŁÓWNA PĘTLA AKTUALIZACJI ARENY 3 (UPDATE TICK)
// =========================================================================
export function updateArena3(dt, players, ball) {
  animTime += dt;

  // 1. Animacja liści dżungli
  for (let i = 0; i < LEAF_PARTICLES.length; i++) {
    const leaf = LEAF_PARTICLES[i];
    leaf.x += leaf.vx * 60 * dt;
    leaf.y += leaf.vy * 60 * dt;
    leaf.rot += leaf.rotSpeed * dt;
    leaf.x += Math.sin(animTime * 1.5 + i * 0.7) * 0.35;

    if (leaf.x < -40) {
      leaf.x = 4440;
      leaf.y = Math.random() * 1000 + 40;
    }
    if (leaf.y > 1380) {
      leaf.y = -30;
      leaf.x = Math.random() * 4400;
    }
  }

  // 2. Fizyka strefy wody (Trigger Area - X: 1600 do 2800, Y: 1300 do 1400)
  // W PŁYTKIEJ WODZIE (BRZEG) GRACZ ZWALNIA (DRAG), A PO WEJŚCIU GŁĘBIEJ TONIE
  if (Array.isArray(players)) {
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (!p) continue;

      const pw = p.w || 24;
      const ph = p.h || 70;
      const pCenterX = p.x + pw * 0.5;
      const pFeetY = p.y + ph;
      const pCenterY = p.y + ph * 0.5;

      const inWaterX = (pCenterX >= 1560 && pCenterX <= 2840);
      const inWaterY = (pFeetY >= 1300);

      if (inWaterX && inWaterY) {
        // Czy postać weszła GŁĘBIEJ do wody?
        // 1. Zanurzenie głębokie: tułów w wodzie (pCenterY >= 1325) lub stopy głęboko (pFeetY >= 1350)
        // 2. W otwartym kanale rzecznym bez dna (X: 1750-2650) przy zanurzeniu (pFeetY >= 1335)
        const inOpenChannel = (pCenterX > 1750 && pCenterX < 2650);
        const isDeepWater = (pFeetY >= 1350) || (pCenterY >= 1325) || (inOpenChannel && pFeetY >= 1335);

        if (isDeepWater) {
          if (!p.isDead) {
            // Śmierć przez utonięcie w głębokiej toni rzeki
            p.hp = 0;
            p.isDead = true;
            p.respawnTimer = 85;
            p.vx = 0;
            p.vy = 2.0; // powolne tonięcie na dno rzeki
            p.onGround = false;
            p.isJumping = false;
            p.currentPlatform = null;
            p.corpseAngle = 0;
            if (p.currentWeapon && typeof spawnDroppedWeapon === 'function') {
              spawnDroppedWeapon(pCenterX, p.y + 20, 0, -2, p.currentWeapon, p.facing);
              p.currentWeapon = null;
            }
            if (typeof triggerScreenShake === 'function') {
              triggerScreenShake(6);
            }
          } else {
            // Martwa postać powoli opada ku dnu
            p.vx *= 0.8;
            p.vy = Math.min(2.4, p.vy + 0.08);
            p.onGround = false;
          }
        } else if (!p.isDead) {
          // Płytka woda przy brzegu - postać NIE ginie, może brodzić i wyskoczyć; woda stawia opór
          p.vx *= 0.82;
          if (p.vy > 0) p.vy *= 0.92;
        }
      }
    }
  }

  // 3A. Fizyka i upadek pylonów mostu (Angry Birds Style Tower Collapse)
  for (const k of ['left', 'right']) {
    const p = ARENA_3_PYLONS[k];
    if (!p.intact && !p.collapsed) {
      p.tiltAngle += p.vRot;
      const maxTilt = (k === 'left' ? 0.38 : -0.38);
      if ((k === 'left' && p.tiltAngle >= maxTilt) || (k === 'right' && p.tiltAngle <= maxTilt)) {
        p.tiltAngle = maxTilt;
        p.vRot = 0;
        p.collapsed = true;
        spawnBridgeSplinters(p.x + (k === 'left' ? 70 : -70), 1220, 0, -2, 12);
        if (typeof triggerScreenShake === 'function') {
          triggerScreenShake(6);
        }
      }
    }
  }

  // 3B. Prawdziwa fizyka wiszących pomostów w koronach drzew (Canopy Platforms)
  for (let pIdx = 0; pIdx < ARENA_3_CANOPY_PLATFORMS.length; pIdx++) {
    const plat = ARENA_3_CANOPY_PLATFORMS[pIdx];

    // Detekcja graczy na pomostach: nacisk, bieg i moment obrotowy
    let playerTorque = 0;
    let playersCount = 0;
    if (Array.isArray(players)) {
      for (let pi = 0; pi < players.length; pi++) {
        const p = players[pi];
        if (!p || p.isDead) continue;
        const pw = p.w || 24;
        const ph = p.h || 70;
        const pFeetX = p.x + pw * 0.5;
        const pFeetY = p.y + ph;

        const platCurY = plat.origY + (plat.bounceY || 0);
        if (pFeetX >= plat.origX - 15 && pFeetX <= plat.origX + plat.w + 15 && Math.abs(pFeetY - platCurY) <= 30) {
          playersCount++;
          const platMidX = plat.origX + plat.w * 0.5 + (plat.swayX || 0);
          const normOffset = (pFeetX - platMidX) / (plat.w * 0.5);
          playerTorque += normOffset * 0.22;

          // Reakcja horyzontalna od biegu
          if (Math.abs(p.vx) > 0.4) {
            plat.swayVx = (plat.swayVx || 0) + (p.vx > 0 ? 0.3 : -0.3);
          }
          // Impuls lądowania
          if (p.vy > 1.2) {
            plat.bounceVy = (plat.bounceVy || 0) + p.vy * 0.35;
          }
        }
      }
    }

    if (plat.isSplit) {
      // 0. PLATFORMA PRZERWANA NA PÓŁ - DWIE OSOBNE POŁÓWKI WISZĄCE SWOBODNIE NA SWOICH LINACH
      if (plat.ropeLeft.intact) {
        const targetAngle = Math.PI * 0.5;
        const angleDiff = targetAngle - plat.leftTiltAngle;
        const pendAcc = Math.sin(angleDiff) * 14.5 - plat.leftVRot * 0.45 - plat.leftVRot * Math.abs(plat.leftVRot) * 0.05;
        plat.leftVRot += pendAcc * dt;
        plat.leftTiltAngle += plat.leftVRot * dt;
        if (Math.abs(angleDiff) < 0.002 && Math.abs(plat.leftVRot) < 0.01) {
          plat.leftTiltAngle = targetAngle;
          plat.leftVRot = 0;
        }
        const swayAcc = -0.05 * (plat.leftSwayX || 0) + Math.cos(plat.leftTiltAngle) * plat.leftVRot * 0.14;
        plat.leftSwayVx = ((plat.leftSwayVx || 0) + swayAcc) * 0.968;
        plat.leftSwayX = Math.max(-55, Math.min(55, (plat.leftSwayX || 0) + plat.leftSwayVx));
        if (Math.abs(plat.leftSwayX) < 0.12 && Math.abs(plat.leftSwayVx) < 0.04 && plat.leftVRot === 0) {
          plat.leftSwayX = 0;
          plat.leftSwayVx = 0;
        }
        plat.leftBounceY = Math.max(0, Math.min(18, (plat.leftBounceY || 0) * 0.92 + Math.abs(plat.leftVRot) * 0.35));
      }
      if (plat.ropeRight.intact) {
        const targetAngle = -Math.PI * 0.5;
        const angleDiff = targetAngle - plat.rightTiltAngle;
        const pendAcc = Math.sin(angleDiff) * 14.5 - plat.rightVRot * 0.45 - plat.rightVRot * Math.abs(plat.rightVRot) * 0.05;
        plat.rightVRot += pendAcc * dt;
        plat.rightTiltAngle += plat.rightVRot * dt;
        if (Math.abs(angleDiff) < 0.002 && Math.abs(plat.rightVRot) < 0.01) {
          plat.rightTiltAngle = targetAngle;
          plat.rightVRot = 0;
        }
        const swayAcc = -0.05 * (plat.rightSwayX || 0) - Math.cos(plat.rightTiltAngle) * plat.rightVRot * 0.14;
        plat.rightSwayVx = ((plat.rightSwayVx || 0) + swayAcc) * 0.968;
        plat.rightSwayX = Math.max(-55, Math.min(55, (plat.rightSwayX || 0) + plat.rightSwayVx));
        if (Math.abs(plat.rightSwayX) < 0.12 && Math.abs(plat.rightSwayVx) < 0.04 && plat.rightVRot === 0) {
          plat.rightSwayX = 0;
          plat.rightSwayVx = 0;
        }
        plat.rightBounceY = Math.max(0, Math.min(18, (plat.rightBounceY || 0) * 0.92 + Math.abs(plat.rightVRot) * 0.35));
      }
    } else if (plat.ropeLeft.intact && plat.ropeRight.intact) {
      // 1. OBYDWIE LINY CAŁE: fizyczne wahadło dwuliniowe + ugięcie sprężyste + wychył od ciężaru
      const swayForce = -0.045 * (plat.swayX || 0);
      plat.swayVx = ((plat.swayVx || 0) + swayForce) * 0.985;
      plat.swayX = Math.max(-45, Math.min(45, (plat.swayX || 0) + plat.swayVx));

      const springK = 38.0;
      const springDamp = 7.5;
      const targetBounce = playersCount * 4.5;
      const bounceForce = -springK * ((plat.bounceY || 0) - targetBounce) - springDamp * (plat.bounceVy || 0);
      plat.bounceVy = (plat.bounceVy || 0) + bounceForce * dt;
      plat.bounceY = Math.max(-4, Math.min(18, (plat.bounceY || 0) + plat.bounceVy * dt));

      const tiltSpring = (playerTorque - plat.tiltAngle) * 32.0 - plat.vRot * 7.5;
      plat.vRot += tiltSpring * dt;
      plat.tiltAngle = Math.max(-0.24, Math.min(0.24, plat.tiltAngle + plat.vRot * dt));
    } else if ((plat.ropeLeft.intact && !plat.ropeRight.intact) || (!plat.ropeLeft.intact && plat.ropeRight.intact)) {
      // 2 & 3. JEDNA LINA ZERWANA: swobodne fizyczne wahadło kołyszące się wokół zaczepu ocalałej liny aż do pionowego zatrzymania!
      const isLeftRope = plat.ropeLeft.intact;
      const targetAngle = isLeftRope ? (Math.PI * 0.5) : (-Math.PI * 0.5);
      const angleDiff = targetAngle - plat.tiltAngle;
      const pendAcc = Math.sin(angleDiff) * 13.5 - plat.vRot * 0.42 - plat.vRot * Math.abs(plat.vRot) * 0.045;
      plat.vRot += pendAcc * dt;
      plat.tiltAngle += plat.vRot * dt;

      if (Math.abs(angleDiff) < 0.002 && Math.abs(plat.vRot) < 0.01) {
        plat.tiltAngle = targetAngle;
        plat.vRot = 0;
      }

      const swayPull = (isLeftRope ? 1 : -1) * Math.cos(plat.tiltAngle) * plat.vRot * 0.16;
      const swayAcc = -0.05 * (plat.swayX || 0) + swayPull;
      plat.swayVx = ((plat.swayVx || 0) + swayAcc) * 0.968;
      plat.swayX = Math.max(-60, Math.min(60, (plat.swayX || 0) + plat.swayVx));
      if (Math.abs(plat.swayX) < 0.12 && Math.abs(plat.swayVx) < 0.04 && plat.vRot === 0) {
        plat.swayX = 0;
        plat.swayVx = 0;
      }

      const targetBounce = Math.min(10, Math.abs(plat.vRot) * 1.4);
      const bounceForce = -32.0 * ((plat.bounceY || 0) - targetBounce) - 6.5 * (plat.bounceVy || 0);
      plat.bounceVy = (plat.bounceVy || 0) + bounceForce * dt;
      plat.bounceY = Math.max(-4, Math.min(18, (plat.bounceY || 0) + plat.bounceVy * dt));
      if (plat.vRot === 0 && Math.abs(plat.bounceY) < 0.1 && Math.abs(plat.bounceVy) < 0.1) {
        plat.bounceY = 0;
        plat.bounceVy = 0;
      }
    } else {
      // 4. OBYDWIE LINY ZERWANE: wszystkie klocki odczepiają się i spadają
      for (let i = 0; i < plat.blocks.length; i++) {
        const b = plat.blocks[i];
        if (b.intact) {
          breakCanopyBlock(b, (Math.random() - 0.5) * 3, Math.random() * 2 + 1, (Math.random() - 0.5) * 0.2);
        }
      }
    }

    // Aktualizacja punktów zaczepienia lin i pozycji każdego bloku na pomostach wiszących
    const anchorLX = plat.ropeLeft.anchorX || plat.ropeLeft.x;
    const anchorRX = plat.ropeRight.anchorX || plat.ropeRight.x;
    const ropeLen = plat.origY;

    if (plat.isSplit) {
      const swayLX = plat.leftSwayX || 0;
      const swayRX = plat.rightSwayX || 0;
      plat.attachLX = anchorLX + swayLX;
      plat.attachLY = Math.sqrt(Math.max(3600, ropeLen * ropeLen - swayLX * swayLX)) + (plat.leftBounceY || 0);
      plat.attachRX = anchorRX + swayRX;
      plat.attachRY = Math.sqrt(Math.max(3600, ropeLen * ropeLen - swayRX * swayRX)) + (plat.rightBounceY || 0);

      for (let bIdx = 0; bIdx < plat.blocks.length; bIdx++) {
        const b = plat.blocks[bIdx];
        if (!b.intact) continue;
        const isLeftHalf = (bIdx < plat.blocks.length / 2);
        const tilt = isLeftHalf ? plat.leftTiltAngle : plat.rightTiltAngle;
        const pivotOrigX = isLeftHalf ? plat.ropeLeft.x : plat.ropeRight.x;
        const attachX = isLeftHalf ? plat.attachLX : plat.attachRX;
        const attachY = isLeftHalf ? plat.attachLY : plat.attachRY;

        const relX = (b.origX + b.w * 0.5) - pivotOrigX;
        const cosA = Math.cos(tilt);
        const sinA = Math.sin(tilt);

        b.x = attachX + relX * cosA - b.w * 0.5;
        b.y = attachY + relX * sinA - b.h * 0.5;
        b.angle = tilt;

        if (Math.abs(tilt) < 0.88) {
          b.solid = true;
          b.isPlatform = true;
          b.oneWay = true;
        } else {
          b.solid = false;
          b.isPlatform = false;
        }
      }
    } else if (plat.ropeLeft.intact && !plat.ropeRight.intact) {
      // Obrót wokół punktu zaczepienia LEWEJ liny
      const swayX = plat.swayX || 0;
      plat.attachLX = anchorLX + swayX;
      plat.attachLY = Math.sqrt(Math.max(3600, ropeLen * ropeLen - swayX * swayX)) + (plat.bounceY || 0);
      const cosA = Math.cos(plat.tiltAngle);
      const sinA = Math.sin(plat.tiltAngle);
      const relRX = plat.ropeRight.x - plat.ropeLeft.x;
      plat.attachRX = plat.attachLX + relRX * cosA;
      plat.attachRY = plat.attachLY + relRX * sinA;

      for (let bIdx = 0; bIdx < plat.blocks.length; bIdx++) {
        const b = plat.blocks[bIdx];
        if (!b.intact) continue;
        const relX = (b.origX + b.w * 0.5) - plat.ropeLeft.x;
        b.x = plat.attachLX + relX * cosA - b.w * 0.5;
        b.y = plat.attachLY + relX * sinA - b.h * 0.5;
        b.angle = plat.tiltAngle;

        if (Math.abs(plat.tiltAngle) < 0.88) {
          b.solid = true;
          b.isPlatform = true;
          b.oneWay = true;
        } else {
          b.solid = false;
          b.isPlatform = false;
        }
      }
    } else if (!plat.ropeLeft.intact && plat.ropeRight.intact) {
      // Obrót wokół punktu zaczepienia PRAWEJ liny
      const swayX = plat.swayX || 0;
      plat.attachRX = anchorRX + swayX;
      plat.attachRY = Math.sqrt(Math.max(3600, ropeLen * ropeLen - swayX * swayX)) + (plat.bounceY || 0);
      const cosA = Math.cos(plat.tiltAngle);
      const sinA = Math.sin(plat.tiltAngle);
      const relLX = plat.ropeLeft.x - plat.ropeRight.x;
      plat.attachLX = plat.attachRX + relLX * cosA;
      plat.attachLY = plat.attachRY + relLX * sinA;

      for (let bIdx = 0; bIdx < plat.blocks.length; bIdx++) {
        const b = plat.blocks[bIdx];
        if (!b.intact) continue;
        const relX = (b.origX + b.w * 0.5) - plat.ropeRight.x;
        b.x = plat.attachRX + relX * cosA - b.w * 0.5;
        b.y = plat.attachRY + relX * sinA - b.h * 0.5;
        b.angle = plat.tiltAngle;

        if (Math.abs(plat.tiltAngle) < 0.88) {
          b.solid = true;
          b.isPlatform = true;
          b.oneWay = true;
        } else {
          b.solid = false;
          b.isPlatform = false;
        }
      }
    } else {
      // Obydwie liny całe (lub obydwie zerwane) - obrót wokół środka pomostu
      const platCenterX = plat.origX + plat.w * 0.5 + (plat.swayX || 0);
      const platCenterY = plat.origY + (plat.bounceY || 0);
      const cosA = Math.cos(plat.tiltAngle);
      const sinA = Math.sin(plat.tiltAngle);
      const relLX = plat.ropeLeft.x - (plat.origX + plat.w * 0.5);
      plat.attachLX = platCenterX + relLX * cosA;
      plat.attachLY = platCenterY + relLX * sinA;
      const relRX = plat.ropeRight.x - (plat.origX + plat.w * 0.5);
      plat.attachRX = platCenterX + relRX * cosA;
      plat.attachRY = platCenterY + relRX * sinA;

      for (let bIdx = 0; bIdx < plat.blocks.length; bIdx++) {
        const b = plat.blocks[bIdx];
        if (!b.intact) continue;
        const relX = (b.origX + b.w * 0.5) - (plat.origX + plat.w * 0.5);
        b.x = platCenterX + relX * cosA - b.w * 0.5;
        b.y = platCenterY + relX * sinA - b.h * 0.5;
        b.angle = plat.tiltAngle;

        if (Math.abs(plat.tiltAngle) < 0.88) {
          b.solid = true;
          b.isPlatform = true;
          b.oneWay = true;
        } else {
          b.solid = false;
          b.isPlatform = false;
        }
      }
    }
  }

  // 3A2. Fizyka upadku filarów wież bojowych (Tower Pillars Collapse)
  for (const side of ['left', 'right']) {
    const pillar = ARENA_3_TOWER_PILLARS[side];
    if (!pillar.intact && !pillar.collapsed) {
      pillar.tiltAngle += pillar.vRot;
      const maxTilt = (side === 'left' ? -0.32 : 0.32);
      if ((side === 'left' && pillar.tiltAngle <= maxTilt) || (side === 'right' && pillar.tiltAngle >= maxTilt)) {
        pillar.tiltAngle = maxTilt;
        pillar.vRot = 0;
        pillar.collapsed = true;
        spawnBridgeSplinters(pillar.stemX + (side === 'left' ? -50 : 50), 1200, 0, -2, 16);
        if (typeof triggerScreenShake === 'function') {
          triggerScreenShake(7);
        }
      }
    }
  }

  // 3A3. Sprężyste uginanie mostu wiszącego pod ciężarem i lądowaniem graczy
  if (Array.isArray(players)) {
    for (let pIdx = 0; pIdx < players.length; pIdx++) {
      const p = players[pIdx];
      if (!p || p.isDead) continue;
      const pw = p.w || 24;
      const ph = p.h || 70;
      const pFootX = p.x + pw * 0.5;
      const pFootY = p.y + ph;

      if (pFootX >= BRIDGE_START_X && pFootX <= BRIDGE_START_X + BRIDGE_TOTAL_W && Math.abs(pFootY - BRIDGE_BASE_Y) <= 18) {
        const bIdx = Math.floor((pFootX - BRIDGE_START_X) / BRIDGE_BLOCK_W);
        if (bIdx >= 0 && bIdx < ARENA_3_BRIDGE_BLOCKS.length) {
          const b = ARENA_3_BRIDGE_BLOCKS[bIdx];
          if (b.intact) {
            const impact = Math.max(0.8, Math.min(4.5, (p.vy > 0 ? p.vy * 0.45 : 1.2)));
            b.sagVel = (b.sagVel || 0) + impact * 2.2;
            if (bIdx > 0 && ARENA_3_BRIDGE_BLOCKS[bIdx - 1].intact) {
              ARENA_3_BRIDGE_BLOCKS[bIdx - 1].sagVel = (ARENA_3_BRIDGE_BLOCKS[bIdx - 1].sagVel || 0) + impact * 1.1;
            }
            if (bIdx < ARENA_3_BRIDGE_BLOCKS.length - 1 && ARENA_3_BRIDGE_BLOCKS[bIdx + 1].intact) {
              ARENA_3_BRIDGE_BLOCKS[bIdx + 1].sagVel = (ARENA_3_BRIDGE_BLOCKS[bIdx + 1].sagVel || 0) + impact * 1.1;
            }
          }
        }
      }
    }
  }

  // Tłumiony oscylator harmoniczny dla sprężystego uginania belek mostu
  for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
    const b = ARENA_3_BRIDGE_BLOCKS[i];
    if (b.intact) {
      const springK = 36.0;
      const damping = 7.0;
      const force = -springK * (b.sag || 0) - damping * (b.sagVel || 0);
      b.sagVel = (b.sagVel || 0) + force * dt;
      b.sag = Math.max(-2, Math.min(10, (b.sag || 0) + (b.sagVel || 0) * dt));
    } else {
      b.sag = 0;
      b.sagVel = 0;
    }
  }

  // 3C. Fizyka wszystkich zniszczalnych belek, ramp i płyt (namacalne platformy + crush damage)
  const allDestructibleBlocks = [
    ...ARENA_3_BRIDGE_BLOCKS,
    ...ARENA_3_RAMP_BLOCKS,
    ...ALL_CANOPY_BLOCKS,
    ...ARENA_3_TOWER_BLOCKS,
    ...ARENA_3_SNIPER_SLABS
  ];
  for (let i = 0; i < allDestructibleBlocks.length; i++) {
    const b = allDestructibleBlocks[i];

    // Obsługa kaskadowego zapadania się klocków
    if (b.collapseDelay > 0) {
      b.collapseDelay--;
      if (b.collapseDelay === 0 && b.intact) {
        if (b.isBridgeBlock) {
          breakBridgeBlock(b, (Math.random() - 0.5) * 2.5, Math.random() * 2.0 + 1.2, (Math.random() - 0.5) * 0.15);
        } else if (b.isRampBlock) {
          breakRampBlock(b, (Math.random() - 0.5) * 2.5, Math.random() * 2.0 + 1.2, (Math.random() - 0.5) * 0.15);
        } else if (b.isCanopyBlock) {
          breakCanopyBlock(b, (Math.random() - 0.5) * 2.5, Math.random() * 2.0 + 1.2, (Math.random() - 0.5) * 0.15);
        } else if (b.isTowerBlock) {
          breakTowerBlock(b, (Math.random() - 0.5) * 2.5, Math.random() * 2.0 + 1.2, (Math.random() - 0.5) * 0.15);
        } else if (b.isSniperSlab) {
          breakSniperSlab(b, (Math.random() - 0.5) * 2.0, Math.random() * 2.5 + 1.5, (Math.random() - 0.5) * 0.12);
        }
      }
    }

    if (b.intact) {
      if (b.isBridgeBlock) {
        b.x = b.origX;
        b.y = b.origY;
        b.solid = true;
        b.isPlatform = true;
        b.oneWay = true;
      }
      continue;
    }

    // ZAWALONE ELEMENTY SĄ NAMACALNE (NIE JAK DUCH)
    b.solid = true;
    b.isPlatform = true;
    b.oneWay = true;

    // OBRAŻENIA OD SPADAJĄCYCH ELEMENTÓW NA GRACZY (CRUSH DAMAGE)
    if (b.vy > 1.2 && Array.isArray(players)) {
      for (let pIdx = 0; pIdx < players.length; pIdx++) {
        const p = players[pIdx];
        if (!p || p.isDead) continue;
        const pw = p.w || 24;
        const ph = p.h || 70;
        const pLeft = p.x;
        const pRight = p.x + pw;
        const pTop = p.y;
        const pBottom = p.y + ph;

        const bLeft = b.x;
        const bRight = b.x + b.w;
        const bTop = b.y;
        const bBottom = b.y + b.h;

        if (bRight > pLeft + 4 && bLeft < pRight - 4 && bBottom >= pTop && bTop <= pBottom - 8) {
          if (!b.playerHitCooldown || b.playerHitCooldown <= 0) {
            b.playerHitCooldown = 18;
            let crushDmg = 0;
            if (b.isSniperSlab) {
              crushDmg = Math.round(40 + b.vy * 8);
              spawnStoneDebris(p.x + pw * 0.5, bBottom, b.vx, -2, 12);
            } else if (b.isTowerBlock || b.isRampBlock) {
              crushDmg = Math.round(26 + b.vy * 6);
              spawnBridgeSplinters(p.x + pw * 0.5, bBottom, b.vx, -2, 10);
            } else {
              crushDmg = Math.round(18 + b.vy * 5);
              spawnBridgeSplinters(p.x + pw * 0.5, bBottom, b.vx, -2, 8);
            }

            p.hp = Math.max(0, (p.hp || 100) - crushDmg);
            p.vy = Math.max(p.vy, b.vy * 0.6 + 2.0);
            p.vx += (b.vx || 0) * 0.5 + (p.x < b.x ? -2.5 : 2.5);

            if (typeof triggerScreenShake === 'function') {
              triggerScreenShake(b.isSniperSlab ? 10 : 6);
            }

            b.vy *= 0.35;
            b.vx *= 0.5;

            if (p.hp <= 0 && !p.isDead) {
              p.isDead = true;
              p.respawnTimer = 180;
            }
          }
        }
      }
    }
    if (b.playerHitCooldown > 0) b.playerHitCooldown--;

    if (b.isAsleep) continue;

    const inWater = (b.y + b.h >= 1305);

    if (b.isSniperSlab) {
      // FIZYKA PŁYTY SKALNEJ: Ciężka masa, tonie w rzece na dno
      if (inWater) {
        b.vy = Math.min(2.4, (b.vy + 0.14) * 0.94);
        b.vx *= 0.88;
        b.vRot *= 0.85;
      } else {
        b.vy += 0.46;
        b.vx *= 0.992;
        b.vy *= 0.995;
        b.vRot *= 0.99;
      }
    } else {
      // FIZYKA ELEMENTÓW DREWNIANYCH (Most, Rampy, Wieże, Pomosty wiszące)
      if (inWater) {
        // Wyporność drewna na wodzie (Buoyancy)
        const immersion = (b.y + b.h) - 1305;
        const buoyancy = Math.min(immersion * 0.055, 0.95);
        b.vy -= buoyancy;

        // Opór wody i tłumienie rotacji
        b.vx *= 0.90;
        b.vy *= 0.86;
        b.vRot *= 0.82;

        // Wyrównywanie deski poziomo na powierzchni wody
        b.vRot -= b.angle * 0.05;

        // Kołysanie na falach rzeki
        b.y += Math.sin(animTime * 3.0 + (b.blockIndex || b.rampIndex || 0) * 0.6) * 0.28;

        if (Math.abs(b.vx) < 0.08 && Math.abs(b.vy) < 0.12 && Math.abs(b.vRot) < 0.015) {
          b.sleepTimer++;
          if (b.sleepTimer > 35) {
            b.isAsleep = true;
          }
        } else {
          b.sleepTimer = 0;
        }
      } else {
        // Klocek w powietrzu - grawitacja
        b.vy += 0.38;
        b.vx *= 0.995;
        b.vy *= 0.995;
        b.vRot *= 0.992;
      }
    }

    // Kolizja ze zboczami brzegu rzeki i dnem
    const groundFloorY = getRiverbankGroundY(b.x + b.w / 2);
    if (b.y + b.h >= groundFloorY) {
      b.y = groundFloorY - b.h;
      b.vy = -b.vy * (b.isSniperSlab ? 0.18 : 0.26);
      b.vx *= (b.isSniperSlab ? 0.48 : 0.62);
      b.vRot *= 0.48;

      if (Math.abs(b.vx) < 0.1 && Math.abs(b.vy) < 0.15 && Math.abs(b.vRot) < 0.02) {
        b.sleepTimer++;
        if (b.sleepTimer > 35) {
          b.isAsleep = true;
        }
      } else {
        b.sleepTimer = 0;
      }
    }

    // Całkowanie kinematyki
    b.x += b.vx;
    b.y += b.vy;
    b.angle += b.vRot;
  }

  // 4. Detekcja graczy na belkach / płytach (jeśli solidne, gracz stoi; jeśli nie, spada)
  if (Array.isArray(players)) {
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (!p) continue;
      const cp = p.currentPlatform;
      if (cp && (cp.isBridgeBlock || cp.isCanopyBlock || cp.isTowerBlock || cp.isSniperSlab || cp.isRampBlock)) {
        if (!cp.solid) {
          p.currentPlatform = null;
          p.onGround = false;
          p.isJumping = true;
        } else if (!cp.intact) {
          // Gracz stoi na zawalonym / pływającym klocku - reakcja ugięcia pod ciężarem
          cp.isAsleep = false;
          cp.sleepTimer = 0;
          if (cp.y + cp.h >= 1300) {
            cp.vy = Math.min(1.8, (cp.vy || 0) + 0.12);
          }
        }
      }
    }
  }

  // 5. Aktualizacja cząsteczek drzazg (Bridge Splinters)
  for (let i = BRIDGE_SPLINTERS.length - 1; i >= 0; i--) {
    const sp = BRIDGE_SPLINTERS[i];
    sp.x += sp.vx;
    sp.y += sp.vy;
    sp.vy += 0.34;
    sp.rot += sp.vRot;
    sp.life--;
    if (sp.life <= 0 || sp.y > 1390) {
      BRIDGE_SPLINTERS.splice(i, 1);
    }
  }

  // 6. Aktualizacja cząsteczek odłamków skalnych (Stone Debris)
  for (let i = STONE_DEBRIS.length - 1; i >= 0; i--) {
    const sd = STONE_DEBRIS[i];
    sd.x += sd.vx;
    sd.y += sd.vy;
    sd.vy += 0.38;
    sd.rot += sd.vRot;
    sd.life--;
    if (sd.life <= 0 || sd.y > 1390) {
      STONE_DEBRIS.splice(i, 1);
    }
  }

  // 7. Aktualizacja rozbryzgów wody w rzece
  for (let i = ARENA_3_WATER_SPLASHES.length - 1; i >= 0; i--) {
    const ws = ARENA_3_WATER_SPLASHES[i];
    ws.x += ws.vx;
    ws.y += ws.vy;
    ws.vy += 0.30;
    ws.life--;
    ws.alpha = Math.max(0, ws.life / ws.maxLife);
    if (ws.life <= 0 || ws.y > 1395) {
      ARENA_3_WATER_SPLASHES.splice(i, 1);
    }
  }
}

// =========================================================================
// 6. RENDEROWANIE TŁA (PNG + WARSTWY RUCHOME)
// =========================================================================
export function drawArena3Background(ctx, camera) {
  if (!ctx) return;

  // 1. Zmierzchowe / tropikalne niebo jako ekranowy podkład
  const W_screen = ctx.canvas?.width || (typeof window !== 'undefined' ? window.innerWidth : 1920);
  const H_screen = ctx.canvas?.height || (typeof window !== 'undefined' ? window.innerHeight : 1080);
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H_screen);
  skyGrad.addColorStop(0.0, '#78b0d0');
  skyGrad.addColorStop(0.4, '#a2cda2');
  skyGrad.addColorStop(0.8, '#3d6829');
  skyGrad.addColorStop(1.0, '#1a3a12');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W_screen, H_screen);

  ctx.save();
  if (camera) {
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
  }

  // 2. Rysowanie statycznego obrazu tła (4400 x 1400 px na współrzędnych [0, 0])
  if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
    ctx.drawImage(bgImg, 0, 0, 4400, 1400);
  } else {
    // Rezerwowy gradient gdy obraz się ładuje
    const g = ctx.createLinearGradient(0, 0, 0, 1400);
    g.addColorStop(0, '#8ec5e5');
    g.addColorStop(0.3, '#c2e0b8');
    g.addColorStop(0.65, '#3b6a2e');
    g.addColorStop(1.0, '#142e0d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4400, 1400);
  }

  // 3. Promienie słońca przebijające się przez korony drzew (God Rays)
  ctx.save();
  ctx.globalAlpha = 0.08 + Math.sin(animTime * 0.8) * 0.03;
  ctx.fillStyle = '#fffbe8';
  for (let r = 0; r < 5; r++) {
    const rx = 800 + r * 650;
    ctx.beginPath();
    ctx.moveTo(rx, 0);
    ctx.lineTo(rx + 220, 0);
    ctx.lineTo(rx + 480, 1400);
    ctx.lineTo(rx + 160, 1400);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 4. Liście opadające w tle (pomiędzy tłem a postaciami)
  for (let i = 0; i < LEAF_PARTICLES.length; i += 2) {
    const leaf = LEAF_PARTICLES[i];
    ctx.save();
    ctx.globalAlpha = leaf.alpha * 0.55;
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.rot);
    ctx.fillStyle = leaf.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, leaf.size, leaf.size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

// =========================================================================
// 7. RENDEROWANIE PIERWSZEGO PLANU (PLATFORMY, TEREN, WIEŻE, BRAMKI Y, RZEKA)
// Pixel-perfect dopasowanie do geometrii kolizyjnej ARENA_3_PLATFORMS
// =========================================================================
export function drawArena3Foreground(ctx, camera) {
  if (!ctx) return;

  ctx.save();

  const camL = camera ? camera.x - 200 : 0;
  const camR = camera ? camera.x + (camera.viewWidth || 2000) + 200 : 4400;

  // -----------------------------------------------------------------------
  // 1. PODŁOŻE: OWALNE PŁASZCZYZNY SCHODZĄCE DO WODY (LEWY I PRAWY BRZEG)
  // Przekształcone w naturalne, owalne wzgórza łagodnie zanurzające się w rzece
  // -----------------------------------------------------------------------
  const leftOvalPoints = [
    { x: 0, y: 1200 },
    { x: 500, y: 1200 },
    { x: 1000, y: 1200 },
    { x: 1150, y: 1200 },
    { x: 1300, y: 1225 },
    { x: 1450, y: 1260 },
    { x: 1580, y: 1295 },
    { x: 1680, y: 1320 },
    { x: 1750, y: 1335 }
  ];

  const rightOvalPoints = [
    { x: 2650, y: 1335 },
    { x: 2720, y: 1320 },
    { x: 2820, y: 1295 },
    { x: 2950, y: 1260 },
    { x: 3100, y: 1225 },
    { x: 3250, y: 1200 },
    { x: 3400, y: 1200 },
    { x: 3900, y: 1200 },
    { x: 4400, y: 1200 }
  ];

  // A. Lewy brzeg - owalna płaszczyzna schodząca do wody (X: 0 do 1750)
  if (camL < 1850 && camR > -50) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 1400);
    ctx.lineTo(0, 1200);
    for (let i = 1; i < leftOvalPoints.length; i++) {
      ctx.lineTo(leftOvalPoints[i].x, leftOvalPoints[i].y);
    }
    ctx.lineTo(1750, 1400);
    ctx.closePath();

    const gGradL = ctx.createLinearGradient(0, 1200, 0, 1400);
    gGradL.addColorStop(0.0, '#42321e');
    gGradL.addColorStop(0.18, '#2e2214');
    gGradL.addColorStop(0.55, '#1e160c');
    gGradL.addColorStop(1.0, '#100c06');
    ctx.fillStyle = gGradL;
    ctx.fill();

    // Detale starożytnych bloków kamiennych zatopionych w gruncie
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let kx = 60; kx < 1520; kx += 110) {
      const ky = 1200 + Math.pow(kx / 1750, 2) * 135;
      ctx.fillRect(kx, ky + 26, 60, 22);
      ctx.fillRect(kx + 35, ky + 62, 50, 20);
    }

    // Warstwa mchu i dżunglowej trawy na owalnej krawędzi
    ctx.save();
    ctx.strokeStyle = '#3e7025';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(leftOvalPoints[0].x, leftOvalPoints[0].y);
    for (let i = 1; i < leftOvalPoints.length; i++) {
      ctx.lineTo(leftOvalPoints[i].x, leftOvalPoints[i].y);
    }
    ctx.stroke();

    // Jaśniejsza trawa
    ctx.strokeStyle = '#589e34';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(leftOvalPoints[0].x, leftOvalPoints[0].y - 2);
    for (let i = 1; i < leftOvalPoints.length; i++) {
      ctx.lineTo(leftOvalPoints[i].x, leftOvalPoints[i].y - 2);
    }
    ctx.stroke();

    // Rim lighting (światło na owalnej krawędzi stoku)
    ctx.strokeStyle = 'rgba(125, 220, 60, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(leftOvalPoints[0].x, leftOvalPoints[0].y - 4);
    for (let i = 1; i < leftOvalPoints.length; i++) {
      ctx.lineTo(leftOvalPoints[i].x, leftOvalPoints[i].y - 4);
    }
    ctx.stroke();

    // Kępki trawy / paprocie wzdłuż owalnego zbocza (aż do linii wody)
    ctx.fillStyle = '#4fa32c';
    for (let i = 0; i < leftOvalPoints.length - 2; i++) {
      const pA = leftOvalPoints[i];
      const pB = leftOvalPoints[i + 1];
      for (let t = 0.2; t <= 0.8; t += 0.3) {
        const gx = pA.x + (pB.x - pA.x) * t;
        const gy = pA.y + (pB.y - pA.y) * t;
        if (gy < 1290) {
          ctx.beginPath();
          ctx.moveTo(gx - 4, gy);
          ctx.lineTo(gx, gy - 7);
          ctx.lineTo(gx + 4, gy);
          ctx.fill();
        }
      }
    }

    // Zaokrąglone, gładkie kamienie rzeczne przy i pod linią wody (schodzenie do wody)
    ctx.fillStyle = '#2d3748';
    ctx.strokeStyle = '#1a202c';
    ctx.lineWidth = 1.5;
    const riverStonesL = [
      { x: 1620, y: 1290, rx: 14, ry: 8 },
      { x: 1655, y: 1298, rx: 16, ry: 9 },
      { x: 1690, y: 1308, rx: 18, ry: 10 },
      { x: 1725, y: 1320, rx: 20, ry: 11 },
      { x: 1745, y: 1332, rx: 15, ry: 9 }
    ];
    for (const st of riverStonesL) {
      ctx.beginPath();
      ctx.ellipse(st.x, st.y, st.rx, st.ry, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Kontur stoku
    ctx.strokeStyle = '#18120a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 1200);
    for (let i = 1; i < leftOvalPoints.length; i++) {
      ctx.lineTo(leftOvalPoints[i].x, leftOvalPoints[i].y);
    }
    ctx.lineTo(1750, 1400);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  // B. Prawy brzeg - owalna płaszczyzna schodząca do wody (X: 2650 do 4400)
  if (camL < 4450 && camR > 2600) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(4400, 1400);
    ctx.lineTo(4400, 1200);
    for (let i = rightOvalPoints.length - 1; i >= 0; i--) {
      ctx.lineTo(rightOvalPoints[i].x, rightOvalPoints[i].y);
    }
    ctx.lineTo(2650, 1400);
    ctx.closePath();

    const gGradR = ctx.createLinearGradient(4400, 1200, 4400, 1400);
    gGradR.addColorStop(0.0, '#42321e');
    gGradR.addColorStop(0.18, '#2e2214');
    gGradR.addColorStop(0.55, '#1e160c');
    gGradR.addColorStop(1.0, '#100c06');
    ctx.fillStyle = gGradR;
    ctx.fill();

    // Detale starożytnych bloków kamiennych
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let kx = 2860; kx < 4350; kx += 110) {
      const u = (4400 - kx) / 1750;
      const ky = 1200 + Math.pow(u, 2) * 135;
      ctx.fillRect(kx, ky + 26, 60, 22);
      ctx.fillRect(kx + 35, ky + 62, 50, 20);
    }

    // Warstwa mchu i dżunglowej trawy
    ctx.save();
    ctx.strokeStyle = '#3e7025';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(rightOvalPoints[0].x, rightOvalPoints[0].y);
    for (let i = 1; i < rightOvalPoints.length; i++) {
      ctx.lineTo(rightOvalPoints[i].x, rightOvalPoints[i].y);
    }
    ctx.stroke();

    ctx.strokeStyle = '#589e34';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(rightOvalPoints[0].x, rightOvalPoints[0].y - 2);
    for (let i = 1; i < rightOvalPoints.length; i++) {
      ctx.lineTo(rightOvalPoints[i].x, rightOvalPoints[i].y - 2);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(125, 220, 60, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(rightOvalPoints[0].x, rightOvalPoints[0].y - 4);
    for (let i = 1; i < rightOvalPoints.length; i++) {
      ctx.lineTo(rightOvalPoints[i].x, rightOvalPoints[i].y - 4);
    }
    ctx.stroke();

    // Kępki trawy
    ctx.fillStyle = '#4fa32c';
    for (let i = 1; i < rightOvalPoints.length - 1; i++) {
      const pA = rightOvalPoints[i];
      const pB = rightOvalPoints[i + 1];
      for (let t = 0.2; t <= 0.8; t += 0.3) {
        const gx = pA.x + (pB.x - pA.x) * t;
        const gy = pA.y + (pB.y - pA.y) * t;
        if (gy < 1290) {
          ctx.beginPath();
          ctx.moveTo(gx - 4, gy);
          ctx.lineTo(gx, gy - 7);
          ctx.lineTo(gx + 4, gy);
          ctx.fill();
        }
      }
    }

    // Zaokrąglone kamienie rzeczne
    ctx.fillStyle = '#2d3748';
    ctx.strokeStyle = '#1a202c';
    ctx.lineWidth = 1.5;
    const riverStonesR = [
      { x: 2660, y: 1332, rx: 15, ry: 9 },
      { x: 2685, y: 1320, rx: 19, ry: 11 },
      { x: 2720, y: 1308, rx: 17, ry: 10 },
      { x: 2755, y: 1298, rx: 16, ry: 9 },
      { x: 2790, y: 1290, rx: 14, ry: 8 }
    ];
    for (const st of riverStonesR) {
      ctx.beginPath();
      ctx.ellipse(st.x, st.y, st.rx, st.ry, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Kontur stoku
    ctx.strokeStyle = '#18120a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(2650, 1400);
    for (let i = 0; i < rightOvalPoints.length; i++) {
      ctx.lineTo(rightOvalPoints[i].x, rightOvalPoints[i].y);
    }
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // 2. STREFA WODY - RZEKA (X: 1600 do 2800, Y: 1300 do 1400)
  // Falująca powierzchnia wody, głębia, odbicia
  // -----------------------------------------------------------------------
  if (camL < 2850 && camR > 1550) {
    // A. Wypełnienie toni wodnej (płycizny przy brzegach i mroczna, śmiertelna głębia w środku)
    // Brzegi: przezroczysta woda rzeczna
    const shoreGrad = ctx.createLinearGradient(1600, 1300, 1600, 1400);
    shoreGrad.addColorStop(0.0, 'rgba(28, 120, 180, 0.70)');
    shoreGrad.addColorStop(0.5, 'rgba(16, 85, 145, 0.82)');
    shoreGrad.addColorStop(1.0, 'rgba(8, 48, 92, 0.90)');
    ctx.fillStyle = shoreGrad;
    ctx.fillRect(1600, 1300, 1200, 100);

    // Głęboki nurt centralny (X: 1750 do 2650) - głęboka toń śmiertelna
    const deepAbyssGrad = ctx.createLinearGradient(2200, 1315, 2200, 1400);
    deepAbyssGrad.addColorStop(0.0, 'rgba(12, 55, 95, 0.75)');
    deepAbyssGrad.addColorStop(0.3, 'rgba(6, 32, 65, 0.92)');
    deepAbyssGrad.addColorStop(1.0, 'rgba(3, 14, 34, 0.98)');
    ctx.fillStyle = deepAbyssGrad;
    ctx.fillRect(1750, 1315, 900, 85);

    // B. Falująca powierzchnia rzeki
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(1600, 1300);
    const waveStep = 30;
    for (let wx = 1600; wx <= 2800; wx += waveStep) {
      const wave1 = Math.sin((wx * 0.022) + animTime * 2.8) * 5.5;
      const wave2 = Math.cos((wx * 0.011) - animTime * 1.9) * 3.5;
      ctx.lineTo(wx, 1300 + wave1 + wave2);
    }
    ctx.lineTo(2800, 1400);
    ctx.lineTo(1600, 1400);
    ctx.closePath();

    const surfGrad = ctx.createLinearGradient(1600, 1292, 1600, 1340);
    surfGrad.addColorStop(0.0, 'rgba(96, 210, 255, 0.92)');
    surfGrad.addColorStop(0.4, 'rgba(32, 150, 220, 0.75)');
    surfGrad.addColorStop(1.0, 'rgba(16, 90, 160, 0.50)');
    ctx.fillStyle = surfGrad;
    ctx.fill();

    // C. Błyszczące refleksy piany na powierzchni rzeki
    ctx.strokeStyle = 'rgba(200, 245, 255, 0.85)';
    ctx.lineWidth = 2.2;
    for (let wx = 1630; wx < 2770; wx += 95) {
      const wy = 1300 + Math.sin((wx * 0.022) + animTime * 2.8) * 5.5;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + 45, wy - 1);
      ctx.stroke();
    }

    // D. Bąbelki / piana w strefie wody
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    for (let i = 0; i < WATER_RIPPLES.length; i++) {
      const rip = WATER_RIPPLES[i];
      const ry = rip.y + Math.sin(animTime * 2 + rip.phase) * 6;
      ctx.beginPath();
      ctx.arc(rip.x, ry, rip.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // E. Ostrzeżenie przed głębią rzeki (umieszczone centralnie w kanale)
    ctx.save();
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = 'rgba(239, 68, 68, 0.50)';
    ctx.textAlign = 'center';
    ctx.fillText('☠  GŁĘBIA RZEKI (ŚMIERTELNA)  ☠', 2200, 1370);
    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // 3. DREWNIANE WIEŻE NOŚNE BRAMEK (X: 200 oraz X: 4200)
  // Fortyfikacje w stylu militarnej dżungli ze starożytnymi okuciami
  // -----------------------------------------------------------------------
  // -----------------------------------------------------------------------
  // 3. DREWNIANE WIEŻE NOŚNE (X: 185 oraz X: 4185)
  // Fortyfikacje w stylu militarnej dżungli z zniszczalnymi pilarami i podestami
  // -----------------------------------------------------------------------
  function drawTowerStructure(isLeft) {
    const sideKey = isLeft ? 'left' : 'right';
    const pillar = ARENA_3_TOWER_PILLARS[sideKey];
    const tx = isLeft ? 185 : 4185;
    const tw = 30;
    const ty = 600;
    const th = 600;
    if (tx + tw + 160 < camL || tx - 160 > camR) return;

    ctx.save();
    // A. Kamienna podstawa / cokół na gruncie (zawsze niezniszczalny)
    const stoneGrad = ctx.createLinearGradient(tx - 15, ty + th - 60, tx + tw + 15, ty + th);
    stoneGrad.addColorStop(0, '#3f4738');
    stoneGrad.addColorStop(0.5, '#2b3325');
    stoneGrad.addColorStop(1, '#1b2117');
    ctx.fillStyle = stoneGrad;
    ctx.fillRect(tx - 12, ty + th - 60, tw + 24, 60);
    ctx.strokeStyle = '#12170f';
    ctx.lineWidth = 2;
    ctx.strokeRect(tx - 12, ty + th - 60, tw + 24, 60);

    // Mech na cokole
    ctx.fillStyle = '#4d8028';
    ctx.fillRect(tx - 12, ty + th - 60, tw + 24, 6);

    if (pillar && pillar.intact) {
      // B. Główny pionowy drewniany słup (filar z bali tekowych)
      const woodGrad = ctx.createLinearGradient(tx, ty, tx + tw, ty + th);
      woodGrad.addColorStop(0, '#533418');
      woodGrad.addColorStop(0.5, '#3c230e');
      woodGrad.addColorStop(1, '#251406');
      ctx.fillStyle = woodGrad;
      ctx.fillRect(tx, ty, tw, th);

      // C. Słoje drewna i nacięcia
      ctx.strokeStyle = 'rgba(16, 8, 3, 0.65)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(tx + 8, ty);
      ctx.lineTo(tx + 8, ty + th);
      ctx.moveTo(tx + 21, ty);
      ctx.lineTo(tx + 21, ty + th);
      ctx.stroke();

      // D. Drewniane zastrzały / krzyżulce wzmacniające wieżę
      ctx.strokeStyle = '#3e240e';
      ctx.lineWidth = 8;
      for (let sy = ty + 40; sy < ty + th - 60; sy += 90) {
        ctx.beginPath();
        const spreadX = isLeft ? (tx - 50) : (tx + 50 + tw);
        ctx.moveTo(tx + tw / 2, sy);
        ctx.lineTo(spreadX, sy + 60);
        ctx.stroke();
      }

      // E. Kute żelazne obejmy i pasy nitowane
      for (let by = ty + 50; by < ty + th - 40; by += 90) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(tx - 4, by, tw + 8, 12);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(tx - 4, by, tw + 8, 12);
        // Nity
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(tx - 2, by + 3.5, 3, 5);
        ctx.fillRect(tx + tw - 1, by + 3.5, 3, 5);
      }

      // Pęknięcia w drewnie przy uszkodzeniu
      if (pillar.hp < pillar.maxHp) {
        const dmgRatio = 1 - (pillar.hp / pillar.maxHp);
        ctx.strokeStyle = '#0f0502';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(tx + 10, ty + 120);
        ctx.lineTo(tx + 18, ty + 160);
        ctx.lineTo(tx + 12, ty + 210);
        if (dmgRatio > 0.45) {
          ctx.moveTo(tx + 22, ty + 260);
          ctx.lineTo(tx + 14, ty + 310);
          ctx.lineTo(tx + 20, ty + 360);
        }
        ctx.stroke();
      }
    } else if (pillar) {
      // ZAWALONY FILAR WIEŻY (PO ZNISZCZENIU)
      // Wyszczerbiony kikut przy fundamencie
      ctx.fillStyle = '#3a210b';
      ctx.beginPath();
      ctx.moveTo(tx - 10, ty + th - 60);
      ctx.lineTo(tx - 10, ty + th - 85);
      ctx.lineTo(tx + 8, ty + th - 110);
      ctx.lineTo(tx + tw + 10, ty + th - 75);
      ctx.lineTo(tx + tw + 10, ty + th - 60);
      ctx.closePath();
      ctx.fill();

      // Przechylony pień słupa
      ctx.save();
      ctx.translate(tx + tw / 2, ty + th - 70);
      ctx.rotate(pillar.tiltAngle);
      const fallenGrad = ctx.createLinearGradient(-tw / 2, -th + 70, tw / 2, 0);
      fallenGrad.addColorStop(0, '#533418');
      fallenGrad.addColorStop(1, '#251406');
      ctx.fillStyle = fallenGrad;
      ctx.fillRect(-tw / 2, -th + 70, tw, th - 90);
      ctx.restore();
    }

    // F. Pomost inspekcyjny dolny przy wieży (Y: 600) - RYSOWANY Z MODUŁOWYCH BLOKÓW
    const lowerBlocks = ARENA_3_TOWER_BLOCKS.filter(b => b.side === sideKey && b.tier === 'lower');
    for (let i = 0; i < lowerBlocks.length; i++) {
      const b = lowerBlocks[i];
      if (b.x + b.w + 30 < camL || b.x - 30 > camR) continue;

      ctx.save();
      if (b.intact) {
        const deckGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
        deckGrad.addColorStop(0, '#5f3c1a');
        deckGrad.addColorStop(0.5, '#43280f');
        deckGrad.addColorStop(1, '#2c1706');
        ctx.fillStyle = deckGrad;
        ctx.fillRect(b.x, b.y, b.w, b.h);

        // Krawędź pomostu z mchem
        ctx.fillStyle = '#4c7a2b';
        ctx.fillRect(b.x, b.y, b.w, 4);

        ctx.strokeStyle = '#1c1005';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        // Nity
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(b.x + 4, b.y + 4, 3, 3);
        ctx.fillRect(b.x + b.w - 7, b.y + 4, 3, 3);

        // Pęknięcia jeśli oberwał
        if (b.hp < b.maxHp) {
          ctx.strokeStyle = '#120802';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(b.x + b.w * 0.4, b.y);
          ctx.lineTo(b.x + b.w * 0.5, b.y + b.h);
          ctx.stroke();
        }
      } else {
        // Zniszczona belka pomostu w powietrzu lub w wodzie
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        ctx.translate(cx, cy);
        ctx.rotate(b.angle);

        const halfW = b.w / 2;
        const halfH = b.h / 2;

        const deckGrad = ctx.createLinearGradient(-halfW, -halfH, -halfW, halfH);
        deckGrad.addColorStop(0, '#4d2e12');
        deckGrad.addColorStop(1, '#1e0e04');
        ctx.fillStyle = deckGrad;
        ctx.fillRect(-halfW, -halfH, b.w, b.h);

        ctx.strokeStyle = '#120802';
        ctx.lineWidth = 2;
        ctx.strokeRect(-halfW, -halfH, b.w, b.h);
      }
      ctx.restore();
    }

    // Podpory pomostu od dołu (drewniane zastrzały)
    if (pillar && pillar.intact) {
      const deckX = isLeft ? 120 : 4120;
      const deckW = 160;
      const deckY = 600;
      const deckH = 24;
      ctx.strokeStyle = '#3a220c';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(deckX + 25, deckY + deckH);
      ctx.lineTo(tx + tw / 2, deckY + deckH + 50);
      ctx.moveTo(deckX + deckW - 25, deckY + deckH);
      ctx.lineTo(tx + tw / 2, deckY + deckH + 50);
      ctx.stroke();

      // G. Zwisający z boku wieży militarny proporzec drużyny (Field Banner)
      const bannerX = isLeft ? 90 : 4270;
      const bannerY = 635;
      const bannerW = 42;
      const bannerH = 110;
      const teamColDark = isLeft ? '#0e7490' : '#c2410c';
      const teamColLight = isLeft ? '#06b6d4' : '#f97316';

      ctx.fillStyle = '#221508';
      ctx.fillRect(bannerX - 4, bannerY - 6, bannerW + 8, 6);

      ctx.save();
      ctx.fillStyle = teamColDark;
      ctx.beginPath();
      ctx.moveTo(bannerX, bannerY);
      ctx.lineTo(bannerX + bannerW, bannerY);
      ctx.lineTo(bannerX + bannerW, bannerY + bannerH);
      ctx.lineTo(bannerX + bannerW / 2, bannerY + bannerH - 20);
      ctx.lineTo(bannerX, bannerY + bannerH);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = teamColLight;
      ctx.font = '900 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isLeft ? 'A' : 'B', bannerX + bannerW / 2, bannerY + 45);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(bannerX + 5, bannerY + 60, bannerW - 10, 4);
      ctx.fillRect(bannerX + 8, bannerY + 70, bannerW - 16, 3);
      ctx.restore();
    }

    ctx.restore();
  }

  drawTowerStructure(true);
  drawTowerStructure(false);

  // -----------------------------------------------------------------------
  // 4. WOJSKOWE WIEŻE OBSERWACYJNE I GNIAZDA SNAJPERSKIE (X: 200 oraz X: 4200)
  // Zniszczalne gniazda snajperskie na Y: 400 z modularnymi podestami
  // -----------------------------------------------------------------------
  function drawWatchtowerSniperNest(isLeft) {
    const sideKey = isLeft ? 'left' : 'right';
    const pillar = ARENA_3_TOWER_PILLARS[sideKey];
    const cx = isLeft ? 200 : 4200;
    const stemX = isLeft ? 185 : 4185;
    const deckX = isLeft ? 100 : 4100;
    const deckY = 400;
    const deckW = 200;
    const deckH = 22;

    if (cx + 250 < camL || cx - 250 > camR) return;

    ctx.save();
    const teamCol = isLeft ? '#06b6d4' : '#f97316';
    const teamName = isLeft ? 'FORTRESS ALPHA' : 'OUTPOST BRAVO';

    if (pillar && pillar.intact) {
      // A. Przedłużenie słupów wieży w górę (od Y: 600 do 400)
      const stemGrad = ctx.createLinearGradient(stemX, 400, stemX + 30, 600);
      stemGrad.addColorStop(0, '#533418');
      stemGrad.addColorStop(0.5, '#3c230e');
      stemGrad.addColorStop(1, '#251406');
      ctx.fillStyle = stemGrad;
      ctx.fillRect(stemX, 400, 30, 200);

      // Stalowe okucia i nity słupa
      for (let py = 430; py < 590; py += 50) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(stemX - 3, py, 36, 10);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(stemX - 3, py, 36, 10);
      }

      ctx.strokeStyle = '#1b0e04';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(stemX, 400, 30, 200);

      // Drabina drewniana łącząca dolny pomost Y: 600 z górnym pomostem Y: 400
      const ladderX = isLeft ? 150 : 4230;
      ctx.strokeStyle = '#38200b';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(ladderX, 420);
      ctx.lineTo(ladderX, 600);
      ctx.moveTo(ladderX + 16, 420);
      ctx.lineTo(ladderX + 16, 600);
      ctx.stroke();

      ctx.strokeStyle = '#5c3917';
      ctx.lineWidth = 2.5;
      for (let ly = 435; ly < 595; ly += 18) {
        ctx.beginPath();
        ctx.moveTo(ladderX, ly);
        ctx.lineTo(ladderX + 16, ly);
        ctx.stroke();
      }

      // B. Drewniane zastrzały podtrzymujące górny pomost snajperski
      ctx.strokeStyle = '#321c08';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(stemX + 15, 470);
      ctx.lineTo(deckX + 30, 422);
      ctx.moveTo(stemX + 15, 470);
      ctx.lineTo(deckX + deckW - 30, 422);
      ctx.stroke();
    }

    // C. MODUŁOWE PŁYTY PODŁOGOWE GNIAZDA SNAJPERSKIEGO (Y: 400)
    const upperBlocks = ARENA_3_TOWER_BLOCKS.filter(b => b.side === sideKey && b.tier === 'upper');
    for (let i = 0; i < upperBlocks.length; i++) {
      const b = upperBlocks[i];
      if (b.x + b.w + 30 < camL || b.x - 30 > camR) continue;

      ctx.save();
      if (b.intact) {
        const platGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
        platGrad.addColorStop(0.0, '#6d431c');
        platGrad.addColorStop(0.5, '#492a0f');
        platGrad.addColorStop(1.0, '#2b1606');
        ctx.fillStyle = platGrad;
        ctx.fillRect(b.x, b.y, b.w, b.h);

        // Mech i zbrojenia na krawędzi
        ctx.fillStyle = '#4c7a2b';
        ctx.fillRect(b.x, b.y, b.w, 4);

        ctx.strokeStyle = '#1a0e04';
        ctx.lineWidth = 2.2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        // Nacięcia desek i śruby
        ctx.strokeStyle = 'rgba(20, 10, 4, 0.6)';
        ctx.lineWidth = 1.5;
        for (let dx = b.x + 10; dx < b.x + b.w - 5; dx += 20) {
          ctx.beginPath();
          ctx.moveTo(dx, b.y);
          ctx.lineTo(dx, b.y + b.h);
          ctx.stroke();
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(dx - 1, b.y + 4, 2.5, 2.5);
        }

        // D. Drewniana balustrada obronna z otworami strzelniczymi nad tą deską
        ctx.fillStyle = '#43260d';
        ctx.fillRect(b.x + 2, b.y - 30, b.w - 4, 30);
        ctx.strokeStyle = '#1c0f04';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(b.x + 2, b.y - 30, b.w - 4, 30);

        // Szczelina strzelnicza
        ctx.fillStyle = '#110903';
        ctx.fillRect(b.x + b.w * 0.5 - 9, b.y - 22, 18, 12);
      } else {
        // Odłamany segment podestu gniazda snajperskiego
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        ctx.translate(cx, cy);
        ctx.rotate(b.angle);

        const halfW = b.w / 2;
        const halfH = b.h / 2;

        const bGrad = ctx.createLinearGradient(-halfW, -halfH, -halfW, halfH);
        bGrad.addColorStop(0, '#533418');
        bGrad.addColorStop(1, '#211003');
        ctx.fillStyle = bGrad;
        ctx.fillRect(-halfW, -halfH, b.w, b.h);

        ctx.strokeStyle = '#110903';
        ctx.lineWidth = 2;
        ctx.strokeRect(-halfW, -halfH, b.w, b.h);
      }
      ctx.restore();
    }

    if (pillar && pillar.intact) {
      // E. Słupy zadaszenia i maskująca płachta taktyczna (Camo Netting)
      ctx.strokeStyle = '#321908';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(deckX + 14, deckY - 32);
      ctx.lineTo(deckX + 14, deckY - 75);
      ctx.moveTo(deckX + deckW - 14, deckY - 32);
      ctx.lineTo(deckX + deckW - 14, deckY - 75);
      ctx.stroke();

      // Daszek cieniujący
      ctx.fillStyle = '#2d471c';
      ctx.beginPath();
      ctx.moveTo(deckX - 6, deckY - 70);
      ctx.lineTo(deckX + deckW / 2, deckY - 84);
      ctx.lineTo(deckX + deckW + 6, deckY - 70);
      ctx.lineTo(deckX + deckW, deckY - 75);
      ctx.lineTo(deckX, deckY - 75);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#182b0d';
      ctx.lineWidth = 2;
      ctx.stroke();

      // F. Maszt radiowy łączności wojskowej z pulsującą czerwoną diodą
      const antX = isLeft ? (deckX + 18) : (deckX + deckW - 18);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(antX, deckY - 75);
      ctx.lineTo(antX, deckY - 120);
      ctx.stroke();

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(antX - 8, deckY - 110);
      ctx.lineTo(antX + 8, deckY - 110);
      ctx.moveTo(antX - 5, deckY - 100);
      ctx.lineTo(antX + 5, deckY - 100);
      ctx.stroke();

      const bBlink = (Math.sin(animTime * 6.0) > 0);
      ctx.fillStyle = bBlink ? '#ef4444' : '#500707';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = bBlink ? 12 : 0;
      ctx.beginPath();
      ctx.arc(antX, deckY - 121, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // G. Tablica informacyjna bazy
      const signW = 120;
      const signH = 18;
      const signX = cx - signW / 2;
      const signY = deckY - 26;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(signX, signY, signW, signH);
      ctx.strokeStyle = teamCol;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(signX, signY, signW, signH);

      ctx.font = '900 9.5px monospace';
      ctx.fillStyle = teamCol;
      ctx.textAlign = 'center';
      ctx.fillText(teamName, cx, signY + 12);
    }

    ctx.restore();
  }

  drawWatchtowerSniperNest(true);
  drawWatchtowerSniperNest(false);

  // -----------------------------------------------------------------------
  // 5. GŁÓWNE PLATFORMY SNAJPERSKIE (X: 600-1000 ORAZ X: 3400-3800, Y: 800)
  // Zniszczalne modułowe płyty skalne dolomitowe porośnięte dżunglą
  // -----------------------------------------------------------------------
  function drawSniperSlabs() {
    for (let i = 0; i < ARENA_3_SNIPER_SLABS.length; i++) {
      const slab = ARENA_3_SNIPER_SLABS[i];
      if (slab.x + slab.w + 50 < camL || slab.x - 50 > camR) continue;

      ctx.save();
      if (slab.intact) {
        const px = slab.x;
        const py = slab.y;
        const pw = slab.w;
        const ph = slab.h;

        // A. Skalna masa (dolomit / bazalt porośnięty dżunglą)
        const rockGrad = ctx.createLinearGradient(px, py, px, py + ph);
        rockGrad.addColorStop(0.0, '#536353');
        rockGrad.addColorStop(0.3, '#3a473a');
        rockGrad.addColorStop(0.8, '#262f26');
        rockGrad.addColorStop(1.0, '#151b15');
        ctx.fillStyle = rockGrad;
        ctx.fillRect(px, py, pw, ph);

        // B. Warstwa mchu na szczycie półki skalnej
        ctx.fillStyle = '#4e8d2e';
        ctx.fillRect(px, py, pw, 9);
        ctx.fillStyle = '#6ab83e';
        ctx.fillRect(px + 6, py, pw - 12, 4);

        // C. Ostra krawędź komiksowa / rim lighting
        ctx.strokeStyle = 'rgba(135, 235, 75, 0.75)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + pw, py);
        ctx.stroke();

        // D. Kamienne spękania przy uszkodzeniu
        if (slab.hp < slab.maxHp) {
          const dmgRatio = 1 - (slab.hp / slab.maxHp);
          ctx.strokeStyle = '#0d130d';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(px + pw * 0.35, py);
          ctx.lineTo(px + pw * 0.42, py + ph * 0.55);
          ctx.lineTo(px + pw * 0.38, py + ph);
          if (dmgRatio > 0.45) {
            ctx.moveTo(px + pw * 0.75, py + 2);
            ctx.lineTo(px + pw * 0.65, py + ph * 0.7);
          }
          ctx.stroke();
        }

        // Reliefy ruin
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.fillRect(px + 8, py + 14, pw - 16, 12);

        // E. Zwieszające się pnącza (liany) pod platformą
        ctx.strokeStyle = '#3d6325';
        ctx.lineWidth = 2.8;
        const vineLen = 32 + Math.sin(slab.origX * 0.3) * 14;
        ctx.beginPath();
        ctx.moveTo(px + pw * 0.5, py + ph);
        ctx.quadraticCurveTo(px + pw * 0.5 + 8, py + ph + vineLen * 0.5, px + pw * 0.5 - 4, py + ph + vineLen);
        ctx.stroke();

        // F. Obrys płyty
        ctx.strokeStyle = '#1b231b';
        ctx.lineWidth = 2.2;
        ctx.strokeRect(px, py, pw, ph);
      } else {
        // Zniszczona płyta skalna (boulder spadający w powietrzu lub spoczywający na dnie)
        const cx = slab.x + slab.w / 2;
        const cy = slab.y + slab.h / 2;
        ctx.translate(cx, cy);
        ctx.rotate(slab.angle);

        const halfW = slab.w / 2;
        const halfH = slab.h / 2;

        const rockGrad = ctx.createLinearGradient(-halfW, -halfH, -halfW, halfH);
        rockGrad.addColorStop(0.0, '#3f4b3f');
        rockGrad.addColorStop(0.5, '#2b352b');
        rockGrad.addColorStop(1.0, '#151c15');
        ctx.fillStyle = rockGrad;

        // Wyszczerbiony nieregularny kamień
        ctx.beginPath();
        ctx.moveTo(-halfW + 6, -halfH);
        ctx.lineTo(halfW - 8, -halfH + 3);
        ctx.lineTo(halfW, halfH - 4);
        ctx.lineTo(-halfW + 4, halfH);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#111811';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        ctx.strokeStyle = '#090d09';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-halfW + 12, -halfH + 4);
        ctx.lineTo(2, 0);
        ctx.lineTo(-halfW + 10, halfH - 4);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawSniperSlabs();

  // -----------------------------------------------------------------------
  // 6. WISZĄCY MOST (X: 1750 do 2650, Y: 1000)
  // Potężne pylony kotwiczące i wiszące przęsło rozpięte bezpośrednio nad rzeką
  // -----------------------------------------------------------------------
  const bridgeX1 = 1750;
  const bridgeX2 = 2650;
  const bridgeY = 1000;
  const pylonLeftX = 1755;
  const pylonRightX = 2645;
  const pylonTopY = 850;

  // A. PYLONY NOŚNE MOSTU (Drewniano-kamienne wieże bramowe na brzegach rzeki)
  function drawBridgePylon(pylonKey) {
    const p = ARENA_3_PYLONS[pylonKey];
    if (!p) return;
    const px = p.x;
    if (px + 90 < camL || px - 90 > camR) return;

    ctx.save();
    // 1. Potężny kamienny keson / filar fundamentowy (Y: 1100 aż do litego dna rzeki Y: 1395)
    // Osadzony głęboko w litym dnie rzeki - NIGDY NIE LEWITUJE W POWIETRZU!
    const caissonTopY = 1100;
    const caissonBottomY = 1395;
    const caissonW = 62;
    const caissonLeft = px - caissonW / 2;

    const pBaseGrad = ctx.createLinearGradient(caissonLeft, caissonTopY, caissonLeft + caissonW, caissonBottomY);
    pBaseGrad.addColorStop(0.0, '#4a5445');
    pBaseGrad.addColorStop(0.35, '#313a2d');
    pBaseGrad.addColorStop(0.70, '#1f251c'); // Strefa zanurzona w wodzie poniżej 1300
    pBaseGrad.addColorStop(1.0, '#121710');
    ctx.fillStyle = pBaseGrad;
    ctx.fillRect(caissonLeft, caissonTopY, caissonW, caissonBottomY - caissonTopY);
    ctx.strokeStyle = '#141812';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(caissonLeft, caissonTopY, caissonW, caissonBottomY - caissonTopY);

    // Kute żelazne klamry i obejmy kesonu
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(caissonLeft - 2, 1130, caissonW + 4, 10);
    ctx.fillRect(caissonLeft - 2, 1210, caissonW + 4, 10);
    ctx.fillRect(caissonLeft - 2, 1290, caissonW + 4, 12);
    ctx.fillRect(caissonLeft - 2, 1345, caissonW + 4, 12);

    // Ciosane bloki kamienne i spoiny
    ctx.strokeStyle = '#182015';
    ctx.lineWidth = 2;
    for (let by = caissonTopY + 30; by < caissonBottomY; by += 35) {
      ctx.beginPath();
      ctx.moveTo(caissonLeft, by);
      ctx.lineTo(caissonLeft + caissonW, by);
      ctx.stroke();
    }

    if (p.intact) {
      // 2. Masywne pionowe słupy pylonu (A-frame z belek tekowych od 850 do 1100)
      const pWoodGrad = ctx.createLinearGradient(px - 25, pylonTopY, px + 25, caissonTopY);
      pWoodGrad.addColorStop(0, '#533418');
      pWoodGrad.addColorStop(0.5, '#3c230e');
      pWoodGrad.addColorStop(1, '#251406');
      ctx.fillStyle = pWoodGrad;

      // Lewa i prawa noga pylonu
      ctx.fillRect(px - 24, pylonTopY, 18, caissonTopY - pylonTopY);
      ctx.fillRect(px + 6, pylonTopY, 18, caissonTopY - pylonTopY);

      // Krzyżowe rygle wzmacniające (X-bracing)
      ctx.strokeStyle = '#3e240e';
      ctx.lineWidth = 6;
      for (let crossY = pylonTopY + 40; crossY < caissonTopY - 20; crossY += 75) {
        ctx.beginPath();
        ctx.moveTo(px - 20, crossY);
        ctx.lineTo(px + 20, crossY + 60);
        ctx.moveTo(px + 20, crossY);
        ctx.lineTo(px - 20, crossY + 60);
        ctx.stroke();

        ctx.fillStyle = '#334155';
        ctx.fillRect(px - 26, crossY - 4, 52, 8);
      }

      // Dynamiczne pęknięcia drewna przy uszkodzeniu
      if (p.hp < p.maxHp) {
        const damageRatio = 1 - (p.hp / p.maxHp);
        ctx.strokeStyle = '#0a0502';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(px - 15, 950);
        ctx.lineTo(px - 8, 990);
        ctx.lineTo(px - 14, 1040);
        if (damageRatio > 0.4) {
          ctx.moveTo(px + 12, 920);
          ctx.lineTo(px + 18, 970);
          ctx.lineTo(px + 10, 1020);
        }
        if (damageRatio > 0.7) {
          ctx.moveTo(px - 20, 1060);
          ctx.lineTo(px + 15, 1080);
        }
        ctx.stroke();
      }

      // 3. Szczyt pylonu: siodło linowe (Cable Saddle z żelaza i brązu)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px - 30, pylonTopY - 14, 60, 16);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.strokeRect(px - 30, pylonTopY - 14, 60, 16);

      // Kołowroty / rolki linowe
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(px - 10, pylonTopY - 6, 7, 0, Math.PI * 2);
      ctx.arc(px + 10, pylonTopY - 6, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // PYLON ZNISZCZONY (ANGRY BIRDS RUBBLE / FALLEN TOWER)
      // A. Wyszczerbione kikuty przy szczycie kesonu
      ctx.fillStyle = '#3a210b';
      ctx.beginPath();
      ctx.moveTo(px - 24, caissonTopY);
      ctx.lineTo(px - 24, caissonTopY - 25);
      ctx.lineTo(px - 16, caissonTopY - 40);
      ctx.lineTo(px - 12, caissonTopY - 20);
      ctx.lineTo(px - 6, caissonTopY - 30);
      ctx.lineTo(px - 6, caissonTopY);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(px + 6, caissonTopY);
      ctx.lineTo(px + 6, caissonTopY - 35);
      ctx.lineTo(px + 14, caissonTopY - 20);
      ctx.lineTo(px + 18, caissonTopY - 45);
      ctx.lineTo(px + 24, caissonTopY - 30);
      ctx.lineTo(px + 24, caissonTopY);
      ctx.closePath();
      ctx.fill();

      // B. Przechylony / zawalony korpus wieży pylonu
      ctx.save();
      ctx.translate(px, caissonTopY - 25);
      ctx.rotate(p.tiltAngle);

      const towerLen = caissonTopY - pylonTopY;
      const pFallenGrad = ctx.createLinearGradient(-25, -towerLen, 25, 0);
      pFallenGrad.addColorStop(0, '#533418');
      pFallenGrad.addColorStop(1, '#251406');
      ctx.fillStyle = pFallenGrad;

      ctx.fillRect(-24, -towerLen, 18, towerLen - 25);
      ctx.fillRect(6, -towerLen, 18, towerLen - 25);

      ctx.strokeStyle = '#2a1608';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-20, -towerLen + 50);
      ctx.lineTo(20, -towerLen + 110);
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-30, -towerLen - 14, 60, 16);
      ctx.restore();
    }

    ctx.restore();
  }

  drawBridgePylon('left');
  drawBridgePylon('right');

  // B. ZNISZCZALNE MODUŁOWE RAMPY PODEJŚCIOWE NA MOST (Łączące grunt z kładką)
  function drawGentleBridgeApproach(isLeft) {
    const rx1 = isLeft ? 1150 : 2650;
    const rx2 = isLeft ? 1750 : 3250;

    if (rx2 < camL || rx1 > camR) return;

    ctx.save();

    // Filtruj bloki dla tej strony
    const rampBlocks = ARENA_3_RAMP_BLOCKS.filter(b => isLeft ? b.side === 'left' : b.side === 'right');

    for (let rIdx = 0; rIdx < rampBlocks.length; rIdx++) {
      const b = rampBlocks[rIdx];
      if (b.x + b.w + 40 < camL || b.x - 40 > camR) continue;

      const y1 = getApproachInclineY(b.origX, isLeft);
      const y2 = getApproachInclineY(b.origX + b.w, isLeft);
      const groundY = getRiverbankGroundY(b.stiltX);

      if (b.intact) {
        // 1. Drewniany pal nośny (stilt) pod kładką zakotwiczony w podłożu
        if (groundY > Math.max(y1, y2) + 14) {
          ctx.strokeStyle = '#38200b';
          ctx.lineWidth = 9;
          ctx.beginPath();
          ctx.moveTo(b.stiltX, Math.max(y1, y2) + 12);
          ctx.lineTo(b.stiltX, groundY + 12);
          ctx.stroke();

          // Światło na krawędzi pala
          ctx.strokeStyle = '#5a3818';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(b.stiltX - 3, Math.max(y1, y2) + 12);
          ctx.lineTo(b.stiltX - 3, groundY + 12);
          ctx.stroke();

          // Żelazne klamry mocujące pal do podłoża i kładki
          ctx.fillStyle = '#334155';
          ctx.fillRect(b.stiltX - 7, Math.max(y1, y2) + 18, 14, 7);
          ctx.fillRect(b.stiltX - 7, groundY - 14, 14, 7);

          // Zastrzały krzyżowe do sąsiedniego pala jeśli oba są całe
          if (rIdx < rampBlocks.length - 1 && rampBlocks[rIdx + 1].intact) {
            const nextB = rampBlocks[rIdx + 1];
            const nextY = Math.max(getApproachInclineY(nextB.origX, isLeft), getApproachInclineY(nextB.origX + nextB.w, isLeft));
            const nextGroundY = getRiverbankGroundY(nextB.stiltX);

            ctx.strokeStyle = '#281507';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(b.stiltX, Math.max(y1, y2) + 26);
            ctx.lineTo(nextB.stiltX, Math.min(nextGroundY, nextY + 60));
            ctx.moveTo(nextB.stiltX, nextY + 26);
            ctx.lineTo(b.stiltX, Math.min(groundY, Math.max(y1, y2) + 60));
            ctx.stroke();
          }
        }

        // 2. Belka podestu rampy
        ctx.beginPath();
        ctx.moveTo(b.origX, y1);
        ctx.lineTo(b.origX + b.w, y2);
        ctx.lineTo(b.origX + b.w, y2 + 20);
        ctx.lineTo(b.origX, y1 + 20);
        ctx.closePath();

        const blockGrad = ctx.createLinearGradient(b.origX, y1, b.origX + b.w, y2);
        blockGrad.addColorStop(0.0, '#785226');
        blockGrad.addColorStop(0.5, '#563814');
        blockGrad.addColorStop(1.0, '#362108');
        ctx.fillStyle = blockGrad;
        ctx.fill();

        ctx.strokeStyle = '#221306';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 3. Listwy antypoślizgowe
        for (let ax = b.origX + 15; ax <= b.origX + b.w - 10; ax += 22) {
          const ay = getApproachInclineY(ax, isLeft);
          ctx.strokeStyle = 'rgba(235, 195, 105, 0.85)';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(ax - 5, ay);
          ctx.lineTo(ax + 5, ay + 6);
          ctx.stroke();

          ctx.fillStyle = '#1e293b';
          ctx.fillRect(ax - 1, ay + 3, 3, 3);
        }

        // Mech na górnej krawędzi
        ctx.strokeStyle = 'rgba(95, 180, 50, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(b.origX, y1 + 1);
        ctx.lineTo(b.origX + b.w, y2 + 1);
        ctx.stroke();

        // Pęknięcia jeśli rampa jest uszkodzona
        if (b.hp < b.maxHp) {
          const dmgRatio = 1 - (b.hp / b.maxHp);
          ctx.strokeStyle = '#100702';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(b.origX + b.w * 0.4, y1 + 5);
          ctx.lineTo(b.origX + b.w * 0.5, y1 + 14);
          if (dmgRatio > 0.5) {
            ctx.moveTo(b.origX + b.w * 0.7, y2 + 4);
            ctx.lineTo(b.origX + b.w * 0.6, y2 + 16);
          }
          ctx.stroke();
        }

        // 4. Słupek poręczy na środku segmentu
        const postX = b.stiltX;
        const postY = getApproachInclineY(postX, isLeft);
        const handrailH = 34;

        ctx.strokeStyle = '#3e240e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(postX, postY);
        ctx.lineTo(postX, postY - handrailH);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(postX, postY - handrailH, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Linka poręczy do kolejnego segmentu
        if (rIdx < rampBlocks.length - 1 && rampBlocks[rIdx + 1].intact) {
          const nextPostX = rampBlocks[rIdx + 1].stiltX;
          const nextPostY = getApproachInclineY(nextPostX, isLeft);

          ctx.strokeStyle = '#5a3d1c';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(postX, postY - handrailH);
          ctx.lineTo(nextPostX, nextPostY - handrailH);
          ctx.stroke();

          ctx.strokeStyle = '#3d2610';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(postX, postY - handrailH * 0.5);
          ctx.lineTo(nextPostX, nextPostY - handrailH * 0.5);
          ctx.stroke();
        }
      } else {
        // ZNISZCZONY SEGMENT RAMPY (Wyrwa na podejściu - klocek spadający lub spoczywający na zboczu/rzece)
        // A. Wyszczerbiony kikut pala podestu
        if (groundY > Math.max(y1, y2) + 14) {
          ctx.strokeStyle = '#251406';
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(b.stiltX, groundY + 12);
          ctx.lineTo(b.stiltX, groundY - 20);
          ctx.stroke();
        }

        // B. Spadający / spoczywający modularny drewniany segment
        ctx.save();
        const bcx = b.x + b.w / 2;
        const bcy = b.y + b.h / 2;
        ctx.translate(bcx, bcy);
        ctx.rotate(b.angle);

        const halfW = b.w / 2;
        const halfH = b.h / 2;

        const rotGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
        rotGrad.addColorStop(0, '#533614');
        rotGrad.addColorStop(0.6, '#37200b');
        rotGrad.addColorStop(1, '#1e0e04');
        ctx.fillStyle = rotGrad;
        ctx.fillRect(-halfW, -halfH, b.w, b.h);

        ctx.strokeStyle = '#150901';
        ctx.lineWidth = 2.2;
        ctx.strokeRect(-halfW, -halfH, b.w, b.h);

        ctx.strokeStyle = '#0f0501';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-halfW + 6, -halfH);
        ctx.lineTo(4, 0);
        ctx.lineTo(-halfW + 10, halfH);
        ctx.stroke();

        ctx.restore();

        // Piana jeśli klocek wpadł do rzeki
        if (b.y + b.h >= 1300) {
          ctx.save();
          ctx.strokeStyle = 'rgba(195, 240, 255, 0.75)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.ellipse(bcx, 1306, b.w * 0.7, 4, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // 5. Oznaczenie wejściowe na gruntowej krawędzi rampy
    const entryX = isLeft ? 1150 : 3250;
    const entryY = 1200;
    ctx.fillStyle = '#3a200a';
    ctx.fillRect(entryX - 6, entryY - 45, 12, 45);
    ctx.strokeStyle = '#1a0e05';
    ctx.lineWidth = 2;
    ctx.strokeRect(entryX - 6, entryY - 45, 12, 45);

    // Kute zwieńczenie słupa (bez pomarańczowych poświat)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(entryX - 8, entryY - 50, 16, 6);
    ctx.restore();
  }

  drawGentleBridgeApproach(true);
  drawGentleBridgeApproach(false);

  // -----------------------------------------------------------------------
  // PLATFORMY DUŻO WYŻEJ NAD POMOSTEM (Y: 620, most Y: 1000)
  // Wiszące w koronach drzew dżungli pomosty taktyczne
  // -----------------------------------------------------------------------
  // -----------------------------------------------------------------------
  // PLATFORMY DUŻO WYŻEJ NAD POMOSTEM (Y: 620, most Y: 1000)
  // Zniszczalne wiszące pomosty taktyczne w koronach drzew (Angry Birds Physics)
  // -----------------------------------------------------------------------
  function drawHighCanopyPlatform(plat) {
    if (!plat) return;
    const px = plat.origX;
    const py = plat.origY;
    const pw = plat.w;
    const ph = plat.h;

    if (px + pw * 2 + 80 < camL || px - pw - 80 > camR) return;

    ctx.save();
    // 1. Długie liny nośne z baldachimu dżungli biegnące prosto do punktów zaczepienia
    const anchorLX = plat.ropeLeft.anchorX || plat.ropeLeft.x;
    const anchorRX = plat.ropeRight.anchorX || plat.ropeRight.x;
    let attachLX = plat.attachLX;
    let attachLY = plat.attachLY;
    let attachRX = plat.attachRX;
    let attachRY = plat.attachRY;

    if (attachLX === undefined || attachLY === undefined || attachRX === undefined || attachRY === undefined) {
      const ropeLen = plat.origY;
      if (plat.isSplit) {
        const swayLX = plat.leftSwayX || 0;
        const swayRX = plat.rightSwayX || 0;
        attachLX = anchorLX + swayLX;
        attachLY = Math.sqrt(Math.max(3600, ropeLen * ropeLen - swayLX * swayLX)) + (plat.leftBounceY || 0);
        attachRX = anchorRX + swayRX;
        attachRY = Math.sqrt(Math.max(3600, ropeLen * ropeLen - swayRX * swayRX)) + (plat.rightBounceY || 0);
      } else if (plat.ropeLeft.intact && !plat.ropeRight.intact) {
        const swayX = plat.swayX || 0;
        attachLX = anchorLX + swayX;
        attachLY = Math.sqrt(Math.max(3600, ropeLen * ropeLen - swayX * swayX)) + (plat.bounceY || 0);
        const relRX = plat.ropeRight.x - plat.ropeLeft.x;
        attachRX = attachLX + relRX * Math.cos(plat.tiltAngle);
        attachRY = attachLY + relRX * Math.sin(plat.tiltAngle);
      } else if (!plat.ropeLeft.intact && plat.ropeRight.intact) {
        const swayX = plat.swayX || 0;
        attachRX = anchorRX + swayX;
        attachRY = Math.sqrt(Math.max(3600, ropeLen * ropeLen - swayX * swayX)) + (plat.bounceY || 0);
        const relLX = plat.ropeLeft.x - plat.ropeRight.x;
        attachLX = attachRX + relLX * Math.cos(plat.tiltAngle);
        attachLY = attachRY + relLX * Math.sin(plat.tiltAngle);
      } else {
        const platCenterX = plat.origX + plat.w * 0.5 + (plat.swayX || 0);
        const platCenterY = plat.origY + (plat.bounceY || 0);
        const cosA = Math.cos(plat.tiltAngle);
        const sinA = Math.sin(plat.tiltAngle);
        const relLX = plat.ropeLeft.x - (plat.origX + plat.w * 0.5);
        attachLX = platCenterX + relLX * cosA;
        attachLY = platCenterY + relLX * sinA;
        const relRX = plat.ropeRight.x - (plat.origX + plat.w * 0.5);
        attachRX = platCenterX + relRX * cosA;
        attachRY = platCenterY + relRX * sinA;
      }
    }

    // Lewa lina nośna
    if (plat.ropeLeft.intact) {
      ctx.strokeStyle = '#4e3316';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(anchorLX, 0);
      ctx.lineTo(attachLX, attachLY);
      ctx.stroke();

      // Owijające się liany wokół lin
      ctx.strokeStyle = '#3e6822';
      ctx.lineWidth = 2;
      for (let t = 0.15; t <= 0.85; t += 0.18) {
        const lx = anchorLX + (attachLX - anchorLX) * t;
        const ly = attachLY * t;
        ctx.beginPath();
        ctx.arc(lx, ly, 6, 0, Math.PI);
        ctx.stroke();
      }

      // Nacięcia / postrzępienia jeśli lina jest uszkodzona
      if (plat.ropeLeft.hp < plat.ropeLeft.maxHp) {
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.strokeRect(attachLX - 3, attachLY - 25, 6, 12);
      }
    } else {
      // Zerwana lina powiewająca na wietrze z baldachimu
      const vSway = Math.sin(animTime * 3.0 + px * 0.05) * 8;
      ctx.strokeStyle = '#3a200a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(anchorLX, 0);
      ctx.quadraticCurveTo(anchorLX + vSway * 0.5, 45, anchorLX + vSway, 85);
      ctx.stroke();
    }

    // Prawa lina nośna
    if (plat.ropeRight.intact) {
      ctx.strokeStyle = '#4e3316';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(anchorRX, 0);
      ctx.lineTo(attachRX, attachRY);
      ctx.stroke();

      ctx.strokeStyle = '#3e6822';
      ctx.lineWidth = 2;
      for (let t = 0.2; t <= 0.85; t += 0.18) {
        const rx = anchorRX + (attachRX - anchorRX) * t;
        const ry = attachRY * t;
        ctx.beginPath();
        ctx.arc(rx, ry, 6, 0, Math.PI);
        ctx.stroke();
      }

      if (plat.ropeRight.hp < plat.ropeRight.maxHp) {
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.strokeRect(attachRX - 3, attachRY - 25, 6, 12);
      }
    } else {
      const vSway = Math.sin(animTime * 3.0 + px * 0.05 + 1.2) * 8;
      ctx.strokeStyle = '#3a200a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(anchorRX, 0);
      ctx.quadraticCurveTo(anchorRX + vSway * 0.5, 45, anchorRX + vSway, 85);
      ctx.stroke();
    }

    // 2. Kładka i modularne deski pomostu wiszącego
    for (let bIdx = 0; bIdx < plat.blocks.length; bIdx++) {
      const b = plat.blocks[bIdx];
      if (b.x + b.w + 20 < camL || b.x - 20 > camR) continue;

      ctx.save();
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      ctx.translate(cx, cy);
      if (b.angle) {
        ctx.rotate(b.angle);
      }
      const halfW = b.w / 2;
      const halfH = b.h / 2;

      if (b.intact) {
        const platGrad = ctx.createLinearGradient(-halfW, -halfH, -halfW, halfH);
        platGrad.addColorStop(0.0, '#7c582c');
        platGrad.addColorStop(0.5, '#563a18');
        platGrad.addColorStop(1.0, '#35220c');
        ctx.fillStyle = platGrad;
        ctx.fillRect(-halfW, -halfH, b.w, b.h);

        // Szczeble i gwoździe
        ctx.strokeStyle = '#201306';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -halfH);
        ctx.lineTo(0, halfH);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-halfW + 4, -halfH + 3, 2, 2);
        ctx.fillRect(halfW - 6, -halfH + 3, 2, 2);

        // Mech na deskach
        ctx.fillStyle = '#4c802b';
        ctx.fillRect(-halfW, -halfH, b.w, 3.5);

        // Obrys i rim light
        ctx.strokeStyle = '#1b1005';
        ctx.lineWidth = 2;
        ctx.strokeRect(-halfW, -halfH, b.w, b.h);

        ctx.strokeStyle = 'rgba(235, 195, 100, 0.85)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-halfW, -halfH);
        ctx.lineTo(halfW, -halfH);
        ctx.stroke();

        // Pęknięcia jeśli oberwała
        if (b.hp < b.maxHp) {
          ctx.strokeStyle = '#150901';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-halfW + 6, -halfH);
          ctx.lineTo(2, 0);
          ctx.stroke();
        }
      } else {
        // Zniszczona deska (spadająca / unosząca się w wodzie)
        const rotGrad = ctx.createLinearGradient(-halfW, -halfH, -halfW, halfH);
        rotGrad.addColorStop(0, '#533614');
        rotGrad.addColorStop(0.6, '#37200b');
        rotGrad.addColorStop(1, '#1e0e04');
        ctx.fillStyle = rotGrad;
        ctx.fillRect(-halfW, -halfH, b.w, b.h);

        ctx.strokeStyle = '#150901';
        ctx.lineWidth = 2;
        ctx.strokeRect(-halfW, -halfH, b.w, b.h);

        ctx.strokeStyle = '#0f0501';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-halfW + 4, -halfH);
        ctx.lineTo(2, 0);
        ctx.lineTo(-halfW + 6, halfH);
        ctx.stroke();
      }
      ctx.restore();

      // Piana wodna wokół klocka w wodzie
      if (!b.intact && b.y + b.h >= 1300) {
        ctx.save();
        ctx.strokeStyle = 'rgba(195, 240, 255, 0.75)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(cx, 1306, b.w * 0.7, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  // Renderowanie wszystkich 4 wiszących pomostów taktycznych
  for (let pIdx = 0; pIdx < ARENA_3_CANOPY_PLATFORMS.length; pIdx++) {
    drawHighCanopyPlatform(ARENA_3_CANOPY_PLATFORMS[pIdx]);
  }

  // C. MONOLITYCZNE BLOKI KOTWIĄCE I KABLE ODCIĄGOWE (Tension Anchor Blocks & Backstays)
  const anchorLeftX = 1140;
  const anchorLeftY = 1185;
  const anchorRightX = 3260;
  const anchorRightY = 1185;

  function drawAnchorBlock(ax, ay) {
    if (ax + 50 < camL || ax - 50 > camR) return;
    ctx.save();
    // 1. Monolityczny kamienny blok kotwiący wkopany w lity grunt
    const aGrad = ctx.createLinearGradient(ax - 26, ay - 24, ax + 26, ay + 18);
    aGrad.addColorStop(0.0, '#3e473b');
    aGrad.addColorStop(0.5, '#283126');
    aGrad.addColorStop(1.0, '#151b14');
    ctx.fillStyle = aGrad;
    ctx.fillRect(ax - 26, ay - 24, 52, 42);
    ctx.strokeStyle = '#0f140e';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(ax - 26, ay - 24, 52, 42);

    // Warstwa mchu
    ctx.fillStyle = '#4e8d2e';
    ctx.fillRect(ax - 26, ay - 24, 52, 5);

    // Kute żelazne pasy kotwiczne z nitami
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(ax - 22, ay - 14, 44, 9);
    ctx.fillRect(ax - 22, ay + 4, 44, 9);

    // Śruba rzymska (Turnbuckle) i ucho kotwiące ze stali
    ctx.fillStyle = '#475569';
    ctx.fillRect(ax - 7, ay - 34, 14, 14);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(ax - 7, ay - 34, 14, 14);

    // Otwór ściągacza
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(ax - 3, ay - 30, 6, 6);
    ctx.restore();
  }

  drawAnchorBlock(anchorLeftX, anchorLeftY);
  drawAnchorBlock(anchorRightX, anchorRightY);

  // Kable odciągowe od pylonów do bloków kotwiących
  ctx.save();
  ctx.strokeStyle = '#4e3316';
  ctx.lineWidth = 5;
  ctx.beginPath();
  if (ARENA_3_PYLONS.left.intact) {
    ctx.moveTo(pylonLeftX, pylonTopY - 6);
    ctx.lineTo(anchorLeftX, anchorLeftY - 26);
  } else {
    const vSway = Math.sin(animTime * 2.5) * 12;
    ctx.moveTo(anchorLeftX, anchorLeftY - 26);
    ctx.quadraticCurveTo(anchorLeftX + 150, anchorLeftY + 20 + vSway, anchorLeftX + 280, anchorLeftY + 15);
  }
  if (ARENA_3_PYLONS.right.intact) {
    ctx.moveTo(pylonRightX, pylonTopY - 6);
    ctx.lineTo(anchorRightX, anchorRightY - 26);
  } else {
    const vSway = Math.sin(animTime * 2.5 + 1.2) * 12;
    ctx.moveTo(anchorRightX, anchorRightY - 26);
    ctx.quadraticCurveTo(anchorRightX - 150, anchorRightY + 20 + vSway, anchorRightX - 280, anchorRightY + 15);
  }
  ctx.stroke();

  // Druga lina odciągowa (podwójna lina stalowa)
  ctx.strokeStyle = '#2d1c0a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  if (ARENA_3_PYLONS.left.intact) {
    ctx.moveTo(pylonLeftX + 4, pylonTopY - 6);
    ctx.lineTo(anchorLeftX + 3, anchorLeftY - 26);
  }
  if (ARENA_3_PYLONS.right.intact) {
    ctx.moveTo(pylonRightX - 4, pylonTopY - 6);
    ctx.lineTo(anchorRightX - 3, anchorRightY - 26);
  }
  ctx.stroke();
  ctx.restore();

  // D. GŁÓWNE LINY NOŚNE PRZĘSŁA (Łuk paraboliczny od pylonu do pylonu)
  if (bridgeX2 + 80 >= camL && bridgeX1 - 80 <= camR) {
    ctx.save();
    const leftAnchorX = ARENA_3_PYLONS.left.intact ? pylonLeftX : (pylonLeftX + 40);
    const leftAnchorY = ARENA_3_PYLONS.left.intact ? (pylonTopY - 6) : 1150;
    const rightAnchorX = ARENA_3_PYLONS.right.intact ? pylonRightX : (pylonRightX - 40);
    const rightAnchorY = ARENA_3_PYLONS.right.intact ? (pylonTopY - 6) : 1150;
    const midSagY = (ARENA_3_PYLONS.left.intact && ARENA_3_PYLONS.right.intact) ? 970 : 1260;

    // 1. Górna główna lina nośna (Main Cable)
    ctx.strokeStyle = '#5a3b19';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(leftAnchorX, leftAnchorY);
    ctx.quadraticCurveTo(2200, midSagY, rightAnchorX, rightAnchorY);
    ctx.stroke();

    // Ciemna krawędź liny (cień)
    ctx.strokeStyle = '#2c1a0a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftAnchorX, leftAnchorY + 3);
    ctx.quadraticCurveTo(2200, midSagY + 3, rightAnchorX, rightAnchorY + 3);
    ctx.stroke();

    // 2. Dolna lina poręczy (Handrail cable)
    if (ARENA_3_PYLONS.left.intact && ARENA_3_PYLONS.right.intact) {
      ctx.strokeStyle = '#432910';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(bridgeX1 - 10, bridgeY - 35);
      ctx.lineTo(bridgeX2 + 10, bridgeY - 35);
      ctx.stroke();
    }

    // 3. Pionowe wieszaki linowe łączące główną linę z kładką (Vertical Suspenders)
    ctx.strokeStyle = 'rgba(115, 78, 38, 0.85)';
    ctx.lineWidth = 2;
    for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
      const b = ARENA_3_BRIDGE_BLOCKS[i];
      const hx = b.origX + b.w / 2;
      const u = (hx - pylonLeftX) / (pylonRightX - pylonLeftX);
      const cableY = (1 - u) * (1 - u) * leftAnchorY + 2 * (1 - u) * u * midSagY + u * u * rightAnchorY;
      const currentY = b.y + (b.intact ? (b.sag || 0) : 0);

      if (b.intact && b.cableAttached) {
        // Nienaruszona lina nośna
        ctx.beginPath();
        ctx.moveTo(hx, cableY);
        ctx.lineTo(hx, currentY);
        ctx.stroke();

        // Stalowa obejma na desce
        ctx.fillStyle = '#334155';
        ctx.fillRect(hx - 2, currentY - 2, 4, 6);
      } else {
        // Zerwana lina powiewająca na wietrze (frayed cable)
        const vSway = Math.sin(animTime * 3.5 + i * 0.8) * 8;
        ctx.beginPath();
        ctx.moveTo(hx, cableY);
        ctx.quadraticCurveTo(hx + vSway * 0.5, cableY + 18, hx + vSway, cableY + 36);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // E. DREWNIANE MODUŁOWE BELKI MOSTU (24 klocki, Angry Birds Dynamic Destruction)
  for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
    const b = ARENA_3_BRIDGE_BLOCKS[i];
    if (b.x + b.w + 40 < camL || b.x - 40 > camR) continue;

    ctx.save();
    if (b.intact) {
      // 1. NIENARUSZONA BELKA MOSTU (Stabilna część pomostu ze sprężystym uginaniem)
      const currentY = b.y + (b.sag || 0);
      const bGrad = ctx.createLinearGradient(b.x, currentY, b.x, currentY + b.h);
      bGrad.addColorStop(0.0, '#785226');
      bGrad.addColorStop(0.5, '#563814');
      bGrad.addColorStop(1.0, '#362108');
      ctx.fillStyle = bGrad;
      ctx.fillRect(b.x, currentY, b.w, b.h);

      // Słoje i nacięcia drewna
      ctx.strokeStyle = 'rgba(28, 16, 5, 0.65)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(b.x + b.w * 0.5, currentY);
      ctx.lineTo(b.x + b.w * 0.5, currentY + b.h);
      ctx.stroke();

      // Śruby mocujące deski
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(b.x + 3, currentY + 3, 2.5, 2.5);
      ctx.fillRect(b.x + b.w - 5, currentY + 3, 2.5, 2.5);
      ctx.fillRect(b.x + 3, currentY + 12, 2.5, 2.5);
      ctx.fillRect(b.x + b.w - 5, currentY + 12, 2.5, 2.5);

      // Warstwa mchu na górnej krawędzi
      ctx.strokeStyle = '#4d8028';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(b.x, currentY + 1);
      ctx.lineTo(b.x + b.w, currentY + 1);
      ctx.stroke();

      // Jasny rim light
      ctx.strokeStyle = 'rgba(225, 185, 95, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.x, currentY);
      ctx.lineTo(b.x + b.w, currentY);
      ctx.stroke();

      // Obrys belki
      ctx.strokeStyle = '#241405';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(b.x, currentY, b.w, b.h);

      // Zwisające pnącza co kilka segmentów
      if (b.blockIndex % 3 === 0) {
        ctx.strokeStyle = '#32571e';
        ctx.lineWidth = 2.2;
        const vLen = 22 + Math.sin(b.x * 0.15) * 10;
        const vSway = Math.sin(animTime * 2.2 + b.x * 0.05) * 6;
        ctx.beginPath();
        ctx.moveTo(b.x + b.w / 2, currentY + b.h);
        ctx.quadraticCurveTo(b.x + b.w / 2 + vSway * 0.5, currentY + b.h + vLen * 0.5, b.x + b.w / 2 + vSway, currentY + b.h + vLen);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      // 2. ODERWANY / ZAWALONY KLOCEK FIZYCZNY (Falling / Floating Rubble)
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      ctx.translate(cx, cy);
      ctx.rotate(b.angle);

      const halfW = b.w / 2;
      const halfH = b.h / 2;

      // Ciemniejsze, wyszczerbione drewno odłamka
      const bGrad = ctx.createLinearGradient(-halfW, -halfH, -halfW, halfH);
      bGrad.addColorStop(0.0, '#664019');
      bGrad.addColorStop(0.5, '#45280c');
      bGrad.addColorStop(1.0, '#231204');
      ctx.fillStyle = bGrad;
      ctx.fillRect(-halfW, -halfH, b.w, b.h);

      // Wyszczerbione, pęknięte krawędzie
      ctx.strokeStyle = '#150901';
      ctx.lineWidth = 2;
      ctx.strokeRect(-halfW, -halfH, b.w, b.h);

      // Pęknięcie w poprzek klocka
      ctx.strokeStyle = '#0f0501';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-halfW + 4, -halfH);
      ctx.lineTo(2, 0);
      ctx.lineTo(-halfW + 6, halfH);
      ctx.stroke();

      // Stalowe okucie lub wygięta klamra
      ctx.fillStyle = '#334155';
      ctx.fillRect(-halfW + 2, -halfH + 2, 4, 4);

      ctx.restore();

      // Piana wodna i fale wokół unoszącego się klocka w rzece
      if (b.y + b.h >= 1300) {
        ctx.save();
        ctx.strokeStyle = 'rgba(195, 240, 255, 0.75)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(cx, 1306, b.w * 0.75, 4.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // F. CZĄSTECZKI DRZAZG DREWNIANYCH (Bridge Splinters)
  for (let i = 0; i < BRIDGE_SPLINTERS.length; i++) {
    const sp = BRIDGE_SPLINTERS[i];
    if (sp.x < camL - 20 || sp.x > camR + 20) continue;
    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.rotate(sp.rot);
    ctx.fillStyle = sp.color;
    ctx.fillRect(-sp.size / 2, -sp.size * 0.3, sp.size, sp.size * 0.6);
    ctx.restore();
  }

  // F2. CZĄSTECZKI ODŁAMKÓW SKALNYCH (Stone Debris)
  for (let i = 0; i < STONE_DEBRIS.length; i++) {
    const sd = STONE_DEBRIS[i];
    if (sd.x < camL - 20 || sd.x > camR + 20) continue;
    ctx.save();
    ctx.translate(sd.x, sd.y);
    ctx.rotate(sd.rot);
    ctx.fillStyle = sd.color;
    ctx.beginPath();
    ctx.moveTo(-sd.size / 2, -sd.size / 2);
    ctx.lineTo(sd.size / 2, -sd.size * 0.3);
    ctx.lineTo(sd.size * 0.3, sd.size / 2);
    ctx.lineTo(-sd.size * 0.4, sd.size * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // F3. ROZBRYZGI WODY W RZECE (Arena 3 Water Splashes)
  for (let i = 0; i < ARENA_3_WATER_SPLASHES.length; i++) {
    const ws = ARENA_3_WATER_SPLASHES[i];
    if (ws.x < camL - 20 || ws.x > camR + 20) continue;
    ctx.save();
    ctx.globalAlpha = ws.alpha;
    ctx.fillStyle = ws.color;
    ctx.beginPath();
    ctx.arc(ws.x, ws.y, ws.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // 7. LIŚCIE OPADAJĄCE NA PIERWSZYM PLANIE (PRZED PLATFORMAMI)
  // -----------------------------------------------------------------------
  for (let i = 1; i < LEAF_PARTICLES.length; i += 2) {
    const leaf = LEAF_PARTICLES[i];
    if (leaf.x < camL - 40 || leaf.x > camR + 40) continue;

    ctx.save();
    ctx.globalAlpha = leaf.alpha;
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.rot + 0.3);
    ctx.fillStyle = leaf.color;
    ctx.strokeStyle = 'rgba(10, 45, 10, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, leaf.size * 1.15, leaf.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

// Pomocnicze funkcje przecięcia promienia pocisku (swept segment)
function rayIntersectsAABB(x1, y1, x2, y2, left, top, right, bottom) {
  if (x2 >= left && x2 <= right && y2 >= top && y2 <= bottom) return true;
  if (x1 >= left && x1 <= right && y1 >= top && y1 <= bottom) return true;
  let t0 = 0.0, t1 = 1.0;
  const dx = x2 - x1, dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - left, right - x1, y1 - top, bottom - y1];
  for (let k = 0; k < 4; k++) {
    if (p[k] === 0) {
      if (q[k] < 0) return false;
    } else {
      const t = q[k] / p[k];
      if (p[k] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return t0 <= t1;
}

function rayIntersectsVerticalLine(x1, y1, x2, y2, lineX, topY, bottomY, tolerance = 7) {
  const minX = Math.min(x1, x2) - tolerance;
  const maxX = Math.max(x1, x2) + tolerance;
  if (lineX < minX || lineX > maxX) return false;
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  if (maxY < topY - 4 || minY > bottomY + 4) return false;
  const dx = x2 - x1;
  if (Math.abs(dx) < 0.001) {
    return Math.abs(x1 - lineX) <= tolerance;
  }
  const t = (lineX - x1) / dx;
  if (t < 0 || t > 1) return false;
  const hitY = y1 + t * (y2 - y1);
  return hitY >= topY - 4 && hitY <= bottomY + 4;
}

export function onArena3BulletHit(bullet) {
  if (!bullet) return false;
  const bx = bullet.x;
  const by = bullet.y;
  const bx0 = bullet.prevX !== undefined ? bullet.prevX : (bx - (bullet.vx || 0));
  const by0 = bullet.prevY !== undefined ? bullet.prevY : (by - (bullet.vy || 0));
  const bDamage = bullet.damage || 14;

  // 1. Lustro wody w rzece (X: 1600 do 2800, linia wody Y: 1305) - absorpcja i rozbryzg wodny
  if ((by >= 1305 || (by0 < 1305 && by >= 1305)) && bx >= 1600 && bx <= 2800) {
    spawnArena3WaterSplash(bx, 1305, 8);
    return true;
  }

  // 2. Liny nośne pomostów wiszących (swept ray zapobiega przenikaniu pocisków snajperskich)
  for (let pIdx = 0; pIdx < ARENA_3_CANOPY_PLATFORMS.length; pIdx++) {
    const plat = ARENA_3_CANOPY_PLATFORMS[pIdx];

    // Lewa lina
    if (plat.ropeLeft.intact) {
      const attachX = plat.attachLX !== undefined ? plat.attachLX : plat.ropeLeft.x;
      const attachY = plat.attachLY !== undefined ? plat.attachLY : plat.origY;
      if (rayIntersectsVerticalLine(bx0, by0, bx, by, attachX, 0, attachY + 6, 8)) {
        plat.ropeLeft.hp -= bDamage * 0.60;
        spawnBridgeSplinters(attachX, by, (bullet.vx || 0) * 0.15, -1.5, 5);
        if (plat.ropeLeft.hp <= 0) {
          plat.ropeLeft.intact = false;
          onCanopyRopeSnapped(plat, 'left');
        }
        return true;
      }
    }

    // Prawa lina
    if (plat.ropeRight.intact) {
      const attachX = plat.attachRX !== undefined ? plat.attachRX : plat.ropeRight.x;
      const attachY = plat.attachRY !== undefined ? plat.attachRY : plat.origY;
      if (rayIntersectsVerticalLine(bx0, by0, bx, by, attachX, 0, attachY + 6, 8)) {
        plat.ropeRight.hp -= bDamage * 0.60;
        spawnBridgeSplinters(attachX, by, (bullet.vx || 0) * 0.15, -1.5, 5);
        if (plat.ropeRight.hp <= 0) {
          plat.ropeRight.intact = false;
          onCanopyRopeSnapped(plat, 'right');
        }
        return true;
      }
    }
  }

  // 3. Pylony mostu (drewniana wieża A-frame oraz masywne podwodne kesony kamienne)
  for (const k of ['left', 'right']) {
    const p = ARENA_3_PYLONS[k];
    // Drewniana wieża A-frame (Y: topY do baseY)
    if (p.intact && rayIntersectsAABB(bx0, by0, bx, by, p.x - 28, p.topY, p.x + 28, p.baseY)) {
      p.hp -= bDamage * 0.40;
      spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.2, -1.5, 6);
      if (p.hp <= 0) {
        destroyPylon(k);
      }
      return true;
    }
    // Kamienny fundament kesonu w wodzie (Y: baseY do caissonBottomY)
    const caissonBot = p.caissonBottomY || 1395;
    if (rayIntersectsAABB(bx0, by0, bx, by, p.x - 30, p.baseY, p.x + 30, caissonBot)) {
      spawnStoneDebris(bx, by, (bullet.vx || 0) * 0.2, -1.5, 6);
      return true;
    }
  }

  // 4. Klocki ramp podejścia do mostu (ARENA_3_RAMP_BLOCKS) - całe i zawalone
  for (let i = 0; i < ARENA_3_RAMP_BLOCKS.length; i++) {
    const b = ARENA_3_RAMP_BLOCKS[i];
    if (rayIntersectsAABB(bx0, by0, bx, by, b.x - 2, b.y - 10, b.x + b.w + 2, b.y + b.h + 16)) {
      if (b.intact) {
        b.hp -= bDamage * 0.45;
        spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.25, -2, 6);
        if (b.hp <= 0) {
          const impX = (bullet.vx || 0) * 0.1;
          const impY = Math.min(3.5, Math.max(1.2, (bullet.vy || 0) * 0.1 + 1.5));
          breakRampBlock(b, impX, impY, (Math.random() - 0.5) * 0.2);
        }
      } else {
        // Zawalony element jest namacalny: odrzucenie i drzazgi
        spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.2, -1.5, 5);
        b.vx += (bullet.vx || 0) * 0.05;
        b.vy += (bullet.vy || 0) * 0.05;
        b.vRot += (Math.random() - 0.5) * 0.08;
        b.isAsleep = false;
        b.sleepTimer = 0;
      }
      return true;
    }
  }

  // 5. Klocki mostu głównego (ARENA_3_BRIDGE_BLOCKS) - całe i zawalone pływające deski
  for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
    const b = ARENA_3_BRIDGE_BLOCKS[i];
    if (rayIntersectsAABB(bx0, by0, bx, by, b.x - 2, b.y - 6, b.x + b.w + 2, b.y + b.h + 8)) {
      if (b.intact) {
        b.hp -= bDamage * 0.45;
        spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.25, -2, 6);
        if (b.hp <= 0) {
          const impX = (bullet.vx || 0) * 0.1;
          const impY = Math.min(3.5, Math.max(1.2, (bullet.vy || 0) * 0.1 + 1.5));
          breakBridgeBlock(b, impX, impY, (Math.random() - 0.5) * 0.2);
          evaluateBridgeIntegrity();
        }
      } else {
        spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.2, -1.5, 5);
        b.vx += (bullet.vx || 0) * 0.06;
        b.vy += (bullet.vy || 0) * 0.06;
        b.vRot += (Math.random() - 0.5) * 0.08;
        b.isAsleep = false;
        b.sleepTimer = 0;
      }
      return true;
    }
  }

  // 6. Klocki wiszących pomostów taktycznych (ALL_CANOPY_BLOCKS)
  for (let i = 0; i < ALL_CANOPY_BLOCKS.length; i++) {
    const b = ALL_CANOPY_BLOCKS[i];
    if (rayIntersectsAABB(bx0, by0, bx, by, b.x - 2, b.y - 6, b.x + b.w + 2, b.y + b.h + 8)) {
      if (b.intact) {
        b.hp -= bDamage * 0.45;
        spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.25, -2, 6);
        const parentPlat = ARENA_3_CANOPY_PLATFORMS.find(p => p.id === b.parentPlatId);
        if (parentPlat) {
          const pushX = (bullet.vx || 0) * 0.035;
          if (parentPlat.isSplit) {
            if (b.blockIndex < parentPlat.blocks.length / 2) {
              parentPlat.leftVRot = (parentPlat.leftVRot || 0) - pushX * 0.45;
              parentPlat.leftSwayVx = (parentPlat.leftSwayVx || 0) + pushX * 0.35;
            } else {
              parentPlat.rightVRot = (parentPlat.rightVRot || 0) - pushX * 0.45;
              parentPlat.rightSwayVx = (parentPlat.rightSwayVx || 0) + pushX * 0.35;
            }
          } else {
            parentPlat.vRot = (parentPlat.vRot || 0) - pushX * 0.45;
            parentPlat.swayVx = (parentPlat.swayVx || 0) + pushX * 0.35;
          }
        }
        if (b.hp <= 0) {
          const impX = (bullet.vx || 0) * 0.1;
          const impY = Math.min(3.5, Math.max(1.2, (bullet.vy || 0) * 0.1 + 1.5));
          breakCanopyBlock(b, impX, impY, (Math.random() - 0.5) * 0.2);
        }
      } else {
        spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.2, -1.5, 5);
        b.vx += (bullet.vx || 0) * 0.06;
        b.vy += (bullet.vy || 0) * 0.06;
        b.vRot += (Math.random() - 0.5) * 0.08;
        b.isAsleep = false;
        b.sleepTimer = 0;
      }
      return true;
    }
  }

  // 7. Modularne płyty skalne snajperów (ARENA_3_SNIPER_SLABS)
  for (let i = 0; i < ARENA_3_SNIPER_SLABS.length; i++) {
    const slab = ARENA_3_SNIPER_SLABS[i];
    if (rayIntersectsAABB(bx0, by0, bx, by, slab.x - 2, slab.y - 4, slab.x + slab.w + 2, slab.y + slab.h + 6)) {
      if (slab.intact) {
        slab.hp -= bDamage * 0.35;
        spawnStoneDebris(bx, by, (bullet.vx || 0) * 0.25, -2, 6);
        if (slab.hp <= 0) {
          breakSniperSlab(slab, (bullet.vx || 0) * 0.08, Math.max(1.5, (bullet.vy || 0) * 0.1 + 1.8), (Math.random() - 0.5) * 0.15);
        }
      } else {
        spawnStoneDebris(bx, by, (bullet.vx || 0) * 0.2, -1.5, 6);
        slab.vx += (bullet.vx || 0) * 0.04;
        slab.vy += (bullet.vy || 0) * 0.04;
        slab.vRot += (Math.random() - 0.5) * 0.06;
        slab.isAsleep = false;
        slab.sleepTimer = 0;
      }
      return true;
    }
  }

  // 8. Modularne drewniane podesty wież strażniczych (ARENA_3_TOWER_BLOCKS)
  for (let i = 0; i < ARENA_3_TOWER_BLOCKS.length; i++) {
    const b = ARENA_3_TOWER_BLOCKS[i];
    if (rayIntersectsAABB(bx0, by0, bx, by, b.x - 2, b.y - 6, b.x + b.w + 2, b.y + b.h + 8)) {
      if (b.intact) {
        b.hp -= bDamage * 0.45;
        spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.25, -2, 6);
        if (b.hp <= 0) {
          breakTowerBlock(b, (bullet.vx || 0) * 0.1, Math.min(3.5, Math.max(1.2, (bullet.vy || 0) * 0.1 + 1.5)), (Math.random() - 0.5) * 0.2);
        }
      } else {
        spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.2, -1.5, 5);
        b.vx += (bullet.vx || 0) * 0.06;
        b.vy += (bullet.vy || 0) * 0.06;
        b.vRot += (Math.random() - 0.5) * 0.08;
        b.isAsleep = false;
        b.sleepTimer = 0;
      }
      return true;
    }
  }

  // 9. Główne filary nośne wież strażniczych (ARENA_3_TOWER_PILLARS)
  for (const side of ['left', 'right']) {
    const pillar = ARENA_3_TOWER_PILLARS[side];
    if (!pillar || !pillar.intact) continue;
    if (rayIntersectsAABB(bx0, by0, bx, by, pillar.stemX - 6, pillar.topY + 22, pillar.stemX + pillar.w + 6, pillar.baseY)) {
      pillar.hp -= bDamage * 0.40;
      spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.2, -1.5, 6);
      if (pillar.hp <= 0) {
        destroyTowerPillar(side);
      }
      return true;
    }
  }

  return false;
}

export function onArena3KickHit(player, kickBox) {
  if (!player) return false;
  let hitAny = false;
  const kx = kickBox?.footX || (player.facing === 1 ? (player.x + (player.w || 24) + 25) : (player.x - 25));
  const ky = kickBox?.footY || (player.y + (player.h || 70) * 0.65);
  const kickPower = (player.chargePower || 0) > 0 ? (1.0 + player.chargePower * 1.5) : 1.0;
  const kickDamage = 85 * kickPower;
  const dirX = player.facing || 1;

  // 1. Spartan Kick w klocki ramp podejścia do mostu
  for (let i = 0; i < ARENA_3_RAMP_BLOCKS.length; i++) {
    const b = ARENA_3_RAMP_BLOCKS[i];
    const bcx = b.x + b.w / 2;
    const bcy = b.y + b.h / 2;
    if (Math.abs(kx - bcx) <= b.w * 0.6 + 10 && Math.abs(ky - bcy) <= 35) {
      hitAny = true;
      if (b.intact) {
        b.hp -= kickDamage;
        spawnBridgeSplinters(kx, ky, dirX * 5, -2, 10);
        if (b.hp <= 0) {
          breakRampBlock(b, dirX * 3.5, 4.0, dirX * 0.25);
        }
      } else {
        b.vx += dirX * 6.5;
        b.vy -= 3.8;
        b.vRot += dirX * 0.22;
        b.isAsleep = false;
        b.sleepTimer = 0;
        spawnBridgeSplinters(kx, ky, dirX * 4, -2, 6);
      }
      if (typeof triggerScreenShake === 'function') triggerScreenShake(6);
      return true;
    }
  }

  // 2. Spartan Kick w belki mostu głównego
  for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
    const b = ARENA_3_BRIDGE_BLOCKS[i];
    const bcx = b.x + b.w / 2;
    const bcy = b.y + b.h / 2;
    if (Math.abs(kx - bcx) <= b.w * 0.5 + 8 && Math.abs(ky - bcy) <= 30) {
      hitAny = true;
      if (b.intact) {
        b.hp -= kickDamage;
        spawnBridgeSplinters(kx, ky, dirX * 5, -2, 10);
        if (b.hp <= 0) {
          breakBridgeBlock(b, dirX * 3.5, 4.0, dirX * 0.25);
          evaluateBridgeIntegrity();
        }
      } else {
        b.vx += dirX * 6.5;
        b.vy -= 3.8;
        b.vRot += dirX * 0.22;
        b.isAsleep = false;
        b.sleepTimer = 0;
        spawnBridgeSplinters(kx, ky, dirX * 4, -2, 6);
      }
      if (typeof triggerScreenShake === 'function') triggerScreenShake(6);
      return true;
    }
  }

  // 2B. Spartan Kick w pomosty wiszące w koronach drzew
  for (let i = 0; i < ALL_CANOPY_BLOCKS.length; i++) {
    const b = ALL_CANOPY_BLOCKS[i];
    const bcx = b.x + b.w / 2;
    const bcy = b.y + b.h / 2;
    if (Math.abs(kx - bcx) <= b.w * 0.5 + 8 && Math.abs(ky - bcy) <= 30) {
      hitAny = true;
      if (b.intact) {
        b.hp -= kickDamage;
        spawnBridgeSplinters(kx, ky, dirX * 5, -2, 10);
        const parentPlat = ARENA_3_CANOPY_PLATFORMS.find(p => p.id === b.parentPlatId);
        if (parentPlat) {
          if (parentPlat.isSplit) {
            if (b.blockIndex < parentPlat.blocks.length / 2) {
              parentPlat.leftVRot = (parentPlat.leftVRot || 0) - dirX * 1.35;
              parentPlat.leftSwayVx = (parentPlat.leftSwayVx || 0) + dirX * 2.2;
            } else {
              parentPlat.rightVRot = (parentPlat.rightVRot || 0) - dirX * 1.35;
              parentPlat.rightSwayVx = (parentPlat.rightSwayVx || 0) + dirX * 2.2;
            }
          } else {
            parentPlat.vRot = (parentPlat.vRot || 0) - dirX * 1.35;
            parentPlat.swayVx = (parentPlat.swayVx || 0) + dirX * 2.2;
          }
        }
        if (b.hp <= 0) {
          breakCanopyBlock(b, dirX * 3.5, 3.5, dirX * 0.25);
        }
      } else {
        b.vx += dirX * 6.5;
        b.vy -= 3.8;
        b.vRot += dirX * 0.22;
        b.isAsleep = false;
        b.sleepTimer = 0;
        spawnBridgeSplinters(kx, ky, dirX * 4, -2, 6);
      }
      if (typeof triggerScreenShake === 'function') triggerScreenShake(6);
      return true;
    }
  }

  // 3. Spartan Kick w liny pomostów wiszących
  for (let pIdx = 0; pIdx < ARENA_3_CANOPY_PLATFORMS.length; pIdx++) {
    const plat = ARENA_3_CANOPY_PLATFORMS[pIdx];
    const curAttachLX = plat.attachLX ?? plat.ropeLeft.x;
    const curAttachLY = plat.attachLY ?? plat.origY;
    if (plat.ropeLeft.intact && Math.abs(kx - curAttachLX) <= 25 && ky >= 0 && ky <= curAttachLY + 20) {
      hitAny = true;
      plat.ropeLeft.hp -= kickDamage;
      plat.swayVx = (plat.swayVx || 0) + dirX * 1.8;
      spawnBridgeSplinters(curAttachLX, ky, dirX * 3, -2, 8);
      if (plat.ropeLeft.hp <= 0) {
        plat.ropeLeft.intact = false;
        onCanopyRopeSnapped(plat, 'left');
      }
      if (typeof triggerScreenShake === 'function') triggerScreenShake(6);
      return true;
    }
    const curAttachRX = plat.attachRX ?? plat.ropeRight.x;
    const curAttachRY = plat.attachRY ?? plat.origY;
    if (plat.ropeRight.intact && Math.abs(kx - curAttachRX) <= 25 && ky >= 0 && ky <= curAttachRY + 20) {
      hitAny = true;
      plat.ropeRight.hp -= kickDamage;
      plat.swayVx = (plat.swayVx || 0) + dirX * 1.8;
      spawnBridgeSplinters(curAttachRX, ky, dirX * 3, -2, 8);
      if (plat.ropeRight.hp <= 0) {
        plat.ropeRight.intact = false;
        onCanopyRopeSnapped(plat, 'right');
      }
      if (typeof triggerScreenShake === 'function') triggerScreenShake(6);
      return true;
    }
  }

  // 4. Spartan Kick w płyty skalne snajperów
  for (let i = 0; i < ARENA_3_SNIPER_SLABS.length; i++) {
    const slab = ARENA_3_SNIPER_SLABS[i];
    const scx = slab.x + slab.w / 2;
    const scy = slab.y + slab.h / 2;
    if (Math.abs(kx - scx) <= slab.w * 0.75 + 15 && Math.abs(ky - scy) <= 35) {
      hitAny = true;
      if (slab.intact) {
        slab.hp -= kickDamage * 0.95;
        spawnStoneDebris(kx, ky, dirX * 5, -2, 10);
        if (slab.hp <= 0) {
          breakSniperSlab(slab, dirX * 3.0, 3.5, dirX * 0.2);
        }
      } else {
        slab.vx += dirX * 5.5;
        slab.vy -= 3.2;
        slab.vRot += dirX * 0.18;
        slab.isAsleep = false;
        slab.sleepTimer = 0;
        spawnStoneDebris(kx, ky, dirX * 4, -2, 7);
      }
      if (typeof triggerScreenShake === 'function') triggerScreenShake(7);
      return true;
    }
  }

  // 5. Spartan Kick w podesty wież strażniczych
  for (let i = 0; i < ARENA_3_TOWER_BLOCKS.length; i++) {
    const b = ARENA_3_TOWER_BLOCKS[i];
    const bcx = b.x + b.w / 2;
    const bcy = b.y + b.h / 2;
    if (Math.abs(kx - bcx) <= b.w * 0.75 + 15 && Math.abs(ky - bcy) <= 35) {
      hitAny = true;
      if (b.intact) {
        b.hp -= kickDamage;
        spawnBridgeSplinters(kx, ky, dirX * 5, -2, 10);
        if (b.hp <= 0) {
          breakTowerBlock(b, dirX * 3.5, 3.5, dirX * 0.25);
        }
      } else {
        b.vx += dirX * 6.5;
        b.vy -= 3.8;
        b.vRot += dirX * 0.22;
        b.isAsleep = false;
        b.sleepTimer = 0;
        spawnBridgeSplinters(kx, ky, dirX * 4, -2, 6);
      }
      if (typeof triggerScreenShake === 'function') triggerScreenShake(6);
      return true;
    }
  }

  // 6. Spartan Kick w filary wież
  for (const side of ['left', 'right']) {
    const pillar = ARENA_3_TOWER_PILLARS[side];
    if (!pillar.intact) continue;
    if (Math.abs(kx - (pillar.stemX + pillar.w / 2)) <= 35 && ky >= pillar.topY && ky <= pillar.baseY) {
      hitAny = true;
      pillar.hp -= kickDamage * 0.8;
      spawnBridgeSplinters(kx, ky, dirX * 4, -2, 8);
      if (pillar.hp <= 0) {
        destroyTowerPillar(side);
      }
      if (typeof triggerScreenShake === 'function') triggerScreenShake(8);
      return true;
    }
  }

  // 7. Spartan Kick w pylony mostu
  for (const k of ['left', 'right']) {
    const p = ARENA_3_PYLONS[k];
    if (!p.intact) continue;
    if (Math.abs(kx - p.x) <= 35 && ky >= p.topY && ky <= p.baseY) {
      hitAny = true;
      p.hp -= kickDamage * 0.8;
      spawnBridgeSplinters(kx, ky, dirX * 4, -2, 8);
      if (p.hp <= 0) {
        destroyPylon(k);
      }
      if (typeof triggerScreenShake === 'function') triggerScreenShake(8);
      return true;
    }
  }

  return hitAny;
}

export function onArena3Explosion(expX, expY, radius, context) {
  let hitAny = false;
  const blastRad = radius || 140;

  // 1. Wybuch w klocki ramp podejścia do mostu
  for (let i = 0; i < ARENA_3_RAMP_BLOCKS.length; i++) {
    const b = ARENA_3_RAMP_BLOCKS[i];
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const d = Math.hypot(cx - expX, cy - expY);

    if (d <= blastRad + 40) {
      hitAny = true;
      const intensity = Math.max(0, 1 - d / (blastRad + 40));
      const dirX = d > 0.001 ? (cx - expX) / d : 0;
      const dirY = d > 0.001 ? (cy - expY) / d : -1;

      const blastForce = intensity * 19;
      const impulseX = dirX * blastForce + (Math.random() - 0.5) * 4;
      const impulseY = (dirY - 0.55) * blastForce - 2.8;
      const angularImpulse = (dirX >= 0 ? 1 : -1) * (0.12 + Math.random() * 0.24) * intensity;

      if (b.intact) {
        b.hp -= intensity * 170;
        if (b.hp <= 0 || d <= blastRad) {
          breakRampBlock(b, impulseX, impulseY, angularImpulse);
        }
      } else {
        b.vx += impulseX * 0.85;
        b.vy += impulseY * 0.85;
        b.vRot += angularImpulse * 0.8;
        b.isAsleep = false;
        b.sleepTimer = 0;
      }
    }
  }

  // 2. Wybuch w klocki mostu głównego
  for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
    const b = ARENA_3_BRIDGE_BLOCKS[i];
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const d = Math.hypot(cx - expX, cy - expY);

    if (d <= blastRad + 40) {
      hitAny = true;
      const intensity = Math.max(0, 1 - d / (blastRad + 40));
      const dirX = d > 0.001 ? (cx - expX) / d : 0;
      const dirY = d > 0.001 ? (cy - expY) / d : -1;

      const blastForce = intensity * 19;
      const impulseX = dirX * blastForce + (Math.random() - 0.5) * 4;
      const impulseY = (dirY - 0.55) * blastForce - 2.8;
      const angularImpulse = (dirX >= 0 ? 1 : -1) * (0.12 + Math.random() * 0.24) * intensity;

      if (b.intact) {
        b.hp -= intensity * 170;
        if (b.hp <= 0 || d <= blastRad) {
          breakBridgeBlock(b, impulseX, impulseY, angularImpulse);
        }
      } else {
        b.vx += impulseX * 0.85;
        b.vy += impulseY * 0.85;
        b.vRot += angularImpulse * 0.8;
        b.isAsleep = false;
        b.sleepTimer = 0;
      }
    }
  }

  // 2. Wybuch w klocki pomostów wiszących
  for (let i = 0; i < ALL_CANOPY_BLOCKS.length; i++) {
    const b = ALL_CANOPY_BLOCKS[i];
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const d = Math.hypot(cx - expX, cy - expY);

    if (d <= blastRad + 40) {
      hitAny = true;
      const intensity = Math.max(0, 1 - d / (blastRad + 40));
      const dirX = d > 0.001 ? (cx - expX) / d : 0;
      const dirY = d > 0.001 ? (cy - expY) / d : -1;

      const blastForce = intensity * 19;
      const impulseX = dirX * blastForce + (Math.random() - 0.5) * 4;
      const impulseY = (dirY - 0.55) * blastForce - 2.8;
      const angularImpulse = (dirX >= 0 ? 1 : -1) * (0.12 + Math.random() * 0.24) * intensity;

      if (b.intact) {
        const parentPlat = ARENA_3_CANOPY_PLATFORMS.find(p => p.id === b.parentPlatId);
        if (parentPlat) {
          if (parentPlat.isSplit) {
            if (b.blockIndex < parentPlat.blocks.length / 2) {
              parentPlat.leftVRot = (parentPlat.leftVRot || 0) - dirX * intensity * 1.1;
              parentPlat.leftSwayVx = (parentPlat.leftSwayVx || 0) + dirX * intensity * 1.6;
            } else {
              parentPlat.rightVRot = (parentPlat.rightVRot || 0) - dirX * intensity * 1.1;
              parentPlat.rightSwayVx = (parentPlat.rightSwayVx || 0) + dirX * intensity * 1.6;
            }
          } else {
            parentPlat.vRot = (parentPlat.vRot || 0) - dirX * intensity * 1.1;
            parentPlat.swayVx = (parentPlat.swayVx || 0) + dirX * intensity * 1.6;
          }
        }
        b.hp -= intensity * 160;
        if (b.hp <= 0 || d <= blastRad) {
          breakCanopyBlock(b, impulseX, impulseY, angularImpulse);
        }
      } else {
        b.vx += impulseX * 0.85;
        b.vy += impulseY * 0.85;
        b.vRot += angularImpulse * 0.8;
        b.isAsleep = false;
        b.sleepTimer = 0;
      }
    }
  }

  // 3. Wybuch w liny pomostów wiszących
  for (let pIdx = 0; pIdx < ARENA_3_CANOPY_PLATFORMS.length; pIdx++) {
    const plat = ARENA_3_CANOPY_PLATFORMS[pIdx];

    // Lewa lina
    if (plat.ropeLeft.intact) {
      const curAttachLX = plat.attachLX ?? plat.ropeLeft.x;
      const curAttachLY = plat.attachLY ?? plat.origY;
      const clampRopeY = Math.max(0, Math.min(curAttachLY, expY));
      const distL = Math.hypot(curAttachLX - expX, clampRopeY - expY);
      if (distL <= blastRad + 25) {
        hitAny = true;
        const intensity = 1 - distL / (blastRad + 25);
        plat.ropeLeft.hp -= intensity * 110;
        if (plat.ropeLeft.hp <= 0) {
          plat.ropeLeft.intact = false;
          onCanopyRopeSnapped(plat, 'left');
        }
      }
    }

    // Prawa lina
    if (plat.ropeRight.intact) {
      const curAttachRX = plat.attachRX ?? plat.ropeRight.x;
      const curAttachRY = plat.attachRY ?? plat.origY;
      const clampRopeY = Math.max(0, Math.min(curAttachRY, expY));
      const distR = Math.hypot(curAttachRX - expX, clampRopeY - expY);
      if (distR <= blastRad + 25) {
        hitAny = true;
        const intensity = 1 - distR / (blastRad + 25);
        plat.ropeRight.hp -= intensity * 110;
        if (plat.ropeRight.hp <= 0) {
          plat.ropeRight.intact = false;
          onCanopyRopeSnapped(plat, 'right');
        }
      }
    }
  }

  // 4. Wybuch w filary pylonów mostu
  for (const k of ['left', 'right']) {
    const p = ARENA_3_PYLONS[k];
    if (!p.intact) continue;

    const clampPylonY = Math.max(p.topY, Math.min(p.baseY, expY));
    const distP = Math.hypot(p.x - expX, clampPylonY - expY);
    if (distP <= blastRad + 50) {
      hitAny = true;
      const intensity = 1 - distP / (blastRad + 50);
      p.hp -= intensity * 260;
      spawnBridgeSplinters(p.x, clampPylonY, (p.x - expX) * 0.2, -3, 14);
      if (p.hp <= 0) {
        destroyPylon(k);
      }
    }
  }

  // 5. Wybuch w płyty skalne snajperów
  for (let i = 0; i < ARENA_3_SNIPER_SLABS.length; i++) {
    const slab = ARENA_3_SNIPER_SLABS[i];
    const cx = slab.x + slab.w / 2;
    const cy = slab.y + slab.h / 2;
    const d = Math.hypot(cx - expX, cy - expY);

    if (d <= blastRad + 50) {
      hitAny = true;
      const intensity = Math.max(0, 1 - d / (blastRad + 50));
      const dirX = d > 0.001 ? (cx - expX) / d : 0;
      const dirY = d > 0.001 ? (cy - expY) / d : -1;

      const blastForce = intensity * 18;
      const impulseX = dirX * blastForce + (Math.random() - 0.5) * 3;
      const impulseY = (dirY - 0.4) * blastForce - 2.5;
      const angularImpulse = (dirX >= 0 ? 1 : -1) * (0.08 + Math.random() * 0.16) * intensity;

      if (slab.intact) {
        slab.hp -= intensity * 180;
        if (slab.hp <= 0 || d <= blastRad * 0.8) {
          breakSniperSlab(slab, impulseX, impulseY, angularImpulse);
        }
      } else {
        slab.vx += impulseX * 0.8;
        slab.vy += impulseY * 0.8;
        slab.vRot += angularImpulse * 0.8;
        slab.isAsleep = false;
        slab.sleepTimer = 0;
      }
    }
  }

  // 6. Wybuch w podesty wież strażniczych
  for (let i = 0; i < ARENA_3_TOWER_BLOCKS.length; i++) {
    const b = ARENA_3_TOWER_BLOCKS[i];
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const d = Math.hypot(cx - expX, cy - expY);

    if (d <= blastRad + 40) {
      hitAny = true;
      const intensity = Math.max(0, 1 - d / (blastRad + 40));
      const dirX = d > 0.001 ? (cx - expX) / d : 0;
      const dirY = d > 0.001 ? (cy - expY) / d : -1;

      const blastForce = intensity * 19;
      const impulseX = dirX * blastForce + (Math.random() - 0.5) * 4;
      const impulseY = (dirY - 0.55) * blastForce - 2.8;
      const angularImpulse = (dirX >= 0 ? 1 : -1) * (0.12 + Math.random() * 0.24) * intensity;

      if (b.intact) {
        b.hp -= intensity * 160;
        if (b.hp <= 0 || d <= blastRad) {
          breakTowerBlock(b, impulseX, impulseY, angularImpulse);
        }
      } else {
        b.vx += impulseX * 0.85;
        b.vy += impulseY * 0.85;
        b.vRot += angularImpulse * 0.8;
        b.isAsleep = false;
        b.sleepTimer = 0;
      }
    }
  }

  // 7. Wybuch w filary wież strażniczych
  for (const side of ['left', 'right']) {
    const pillar = ARENA_3_TOWER_PILLARS[side];
    if (!pillar.intact) continue;

    const clampPillarY = Math.max(pillar.topY, Math.min(pillar.baseY, expY));
    const distP = Math.hypot(pillar.stemX - expX, clampPillarY - expY);
    if (distP <= blastRad + 50) {
      hitAny = true;
      const intensity = 1 - distP / (blastRad + 50);
      pillar.hp -= intensity * 260;
      spawnBridgeSplinters(pillar.stemX, clampPillarY, (pillar.stemX - expX) * 0.2, -3, 14);
      if (pillar.hp <= 0) {
        destroyTowerPillar(side);
      }
    }
  }

  if (hitAny) {
    evaluateBridgeIntegrity();
  }

  return hitAny;
}

// =========================================================================
// 9. KONTRAKT ARENY 3 (PLUGIN DEFINITION / LIFECYCLE HOOKS)
// =========================================================================
const arena3 = {
  id: 'arena-3',
  alias: 'JUNGLE_ARENA',
  mapId: 'jungle_arena_01',
  name: 'Tajemnicza Dżungla',
  width: 4400,
  height: 1400,
  physics: {
    gravity: 9.8,
    waterDrag: 0.6
  },
  spawns: [
    // Team A (Cyan): na płaskim gruncie tuż przed rampą mostu (X: 1050, Y: 1130)
    { x: 1050, y: 1130 },
    // Team B (Orange): na płaskim gruncie tuż przed prawym podejściem (X: 3350, Y: 1130)
    { x: 3350, y: 1130 }
  ],
  detailedSpawns: ARENA_3_SPAWNS,
  platforms: ARENA_3_PLATFORMS,
  customObjects: ARENA_3_CUSTOM_OBJECTS,
  minecarts: ARENA_3_MINECARTS,
  reset() {
    resetArena3();
    resetArena3Minecarts();
    resetArena3Breaches();
  },
  drawBackground(ctx, camera) {
    drawArena3Background(ctx, camera);
  },
  draw(ctx, camera) {
    drawArena3Foreground(ctx, camera);
  },
  update(dt, players, ball) {
    updateArena3(dt, players, ball);
  },
  onBulletHit(bullet) {
    return onArena3BulletHit(bullet);
  },
  onKickHit(player, kickBox) {
    return onArena3KickHit(player, kickBox);
  },
  onExplosion(expX, expY, radius, context) {
    return onArena3Explosion(expX, expY, radius, context);
  }
};

if (typeof window !== 'undefined') {
  window.spawnArena3WaterSplash = spawnArena3WaterSplash;
  window.ARENA_3_WATER_SPLASHES = ARENA_3_WATER_SPLASHES;
  window.ARENA_3_RAMP_BLOCKS = ARENA_3_RAMP_BLOCKS;
  window.breakRampBlock = breakRampBlock;
  window.ARENA_3_BRIDGE_BLOCKS = ARENA_3_BRIDGE_BLOCKS;
  window.ARENA_3_PYLONS = ARENA_3_PYLONS;
  window.ARENA_3_CANOPY_PLATFORMS = ARENA_3_CANOPY_PLATFORMS;
  window.ALL_CANOPY_BLOCKS = ALL_CANOPY_BLOCKS;
  window.ARENA_3_SNIPER_SLABS = ARENA_3_SNIPER_SLABS;
  window.ARENA_3_TOWER_PILLARS = ARENA_3_TOWER_PILLARS;
  window.ARENA_3_TOWER_BLOCKS = ARENA_3_TOWER_BLOCKS;
  window.STONE_DEBRIS = STONE_DEBRIS;
  window.arena3 = arena3;
}

export default arena3;
