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

// 1. ZASOBY GRAFICZNE (Proceduralne tło nocne)
import { triggerScreenShake } from '../../camera.js';
export const bgImg = null;

// =========================================================================
// 2. STAN ANIMACJI I EFEKTY RUCHOME
// =========================================================================
export let animTime = 0;
export function addArena3AnimTime(dt) { animTime += dt; }

// Cząsteczki opadających liści dżungli (wyłączone w nocnym motywie)
export const LEAF_PARTICLES = [];

// Bąbelki / pluski w strefie wody
export const WATER_RIPPLES = [];
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
export const BRIDGE_BLOCK_COUNT = 24;
export const BRIDGE_START_X = 1750;
export const BRIDGE_TOTAL_W = 900;
export const BRIDGE_BLOCK_W = BRIDGE_TOTAL_W / BRIDGE_BLOCK_COUNT; // 37.5 px
export const BRIDGE_BASE_Y = 1000;
export const BRIDGE_BLOCK_H = 18;

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
    collapsed: false,
    fallDropY: 0,
    fallDropVy: 0
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
    collapsed: false,
    fallDropY: 0,
    fallDropVy: 0
  }
};

export function destroyPylon(k) {
  const p = ARENA_3_PYLONS[k];
  if (!p || !p.intact) return;
  p.intact = false;
  p.vRot = (k === 'left' ? 0.022 : -0.022);
  p.fallDropY = 0;
  p.fallDropVy = 0;
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
    p.fallDropY = 0;
    p.fallDropVy = 0;
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
    pillar.fallDropY = 0;
    pillar.fallDropVy = 0;
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
    collapsed: false,
    fallDropY: 0,
    fallDropVy: 0
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
    collapsed: false,
    fallDropY: 0,
    fallDropVy: 0
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
  pillar.vRot = (side === 'left' ? 0.024 : -0.024);
  pillar.fallDropY = 0;
  pillar.fallDropVy = 0;

  spawnBridgeSplinters(pillar.stemX, 600, (side === 'left' ? 7 : -7), -4, 28);
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
  // -----------------------------------------------------------------------
  // LEWY BRZEG (SEKTOR ALFA / CYAN) - PŁASKIE PODŁOŻE (X: 0 do 1150, Y: 1200)
  // -----------------------------------------------------------------------
  {
    id: 'ground_left',
    name: 'Lewy Brzeg - Podłoże',
    x: 0,
    y: 1200,
    w: 1150,
    h: 200,
    thickness: 200,
    solid: true,
    isPlatform: true
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
  // -----------------------------------------------------------------------
  // PRAWY BRZEG (SEKTOR BRAVO / ORANGE) - PŁASKIE PODŁOŻE (X: 3250 do 4400, Y: 1200)
  // -----------------------------------------------------------------------
  {
    id: 'ground_right',
    name: 'Prawy Brzeg - Podłoże',
    x: 3250,
    y: 1200,
    w: 1150,
    h: 200,
    thickness: 200,
    solid: true,
    isPlatform: true
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
