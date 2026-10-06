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
    hp: 100,
    isAsleep: false,
    sleepTimer: 0,
    cableAttached: true,
    collapseDelay: 0,
    seed: (i * 37 + 13) % 100
  });
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

export function breakBridgeBlock(block, impulseX = 0, impulseY = 0, angularImpulse = 0) {
  if (!block || !block.intact) return;
  block.intact = false;
  block.solid = false;
  block.isPlatform = false;
  block.cableAttached = false;
  block.vx += impulseX;
  block.vy += impulseY;
  block.vRot += angularImpulse;
  block.isAsleep = false;
  block.sleepTimer = 0;

  spawnBridgeSplinters(block.x + block.w / 2, block.y + block.h / 2, impulseX, impulseY, 10);
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
    const anchoredLeft = (seg.start === 0);
    const anchoredRight = (seg.end === ARENA_3_BRIDGE_BLOCKS.length - 1);

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
  for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
    const b = ARENA_3_BRIDGE_BLOCKS[i];
    b.x = b.origX;
    b.y = b.origY;
    b.vx = 0;
    b.vy = 0;
    b.angle = 0;
    b.vRot = 0;
    b.intact = true;
    b.hp = 100;
    b.solid = true;
    b.isPlatform = true;
    b.isAsleep = false;
    b.sleepTimer = 0;
    b.cableAttached = true;
    b.collapseDelay = 0;
  }
  BRIDGE_SPLINTERS.length = 0;
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
  {
    id: 'bridge_approach_left',
    name: 'Łagodne Podejście na Most Lewe',
    type: 'platform',
    x: 1150,
    y: 1000,
    w: 600,
    h: 220,
    thickness: 20,
    solid: true,
    isPlatform: true,
    oneWay: true,
    surfacePoints: [
      { x: 1150, y: 1200 },
      { x: 1300, y: 1165 },
      { x: 1450, y: 1120 },
      { x: 1600, y: 1065 },
      { x: 1750, y: 1000 }
    ]
  },
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
    id: 'bridge_approach_right',
    name: 'Łagodne Podejście na Most Prawe',
    type: 'platform',
    x: 2650,
    y: 1000,
    w: 600,
    h: 220,
    thickness: 20,
    solid: true,
    isPlatform: true,
    oneWay: true,
    surfacePoints: [
      { x: 2650, y: 1000 },
      { x: 2800, y: 1065 },
      { x: 2950, y: 1120 },
      { x: 3100, y: 1165 },
      { x: 3250, y: 1200 }
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
  // B. DREWNIANE WIEŻE NOŚNE BRAMEK (X: 200 oraz X: 4200)
  // Konstrukcje startujące od poziomu gruntu, na których osadzone są bramki
  // -----------------------------------------------------------------------
  // Wieża Lewa (Cyan - Team A):
  {
    id: 'tower_cyan_stem',
    name: 'Drewniana Wieża Lewa - Filar Nośny',
    x: 185,
    y: 600,
    w: 30,
    h: 600,
    solid: true,
    isPlatform: false,
    isWall: true
  },
  {
    id: 'tower_cyan_deck',
    name: 'Wieża Lewa - Pomost Inspekcyjny',
    x: 120,
    y: 600,
    w: 160,
    h: 24,
    thickness: 24,
    solid: true,
    isPlatform: true
  },

  // Wieża Prawa (Orange - Team B):
  {
    id: 'tower_orange_stem',
    name: 'Drewniana Wieża Prawa - Filar Nośny',
    x: 4185,
    y: 600,
    w: 30,
    h: 600,
    solid: true,
    isPlatform: false,
    isWall: true
  },
  {
    id: 'tower_orange_deck',
    name: 'Wieża Prawa - Pomost Inspekcyjny',
    x: 4120,
    y: 600,
    w: 160,
    h: 24,
    thickness: 24,
    solid: true,
    isPlatform: true
  },

  // -----------------------------------------------------------------------
  // B. GŁÓWNE PLATFORMY SNAJPERSKIE (X: 800, Y: 800 oraz X: 3600, Y: 800)
  // Solidne półki skalne porośnięte mchem, szerokość ok. 400 px
  // -----------------------------------------------------------------------
  {
    id: 'sniper_shelf_left',
    name: 'Platforma Snajperska Lewa (Team A)',
    x: 600,
    y: 800,
    w: 400,
    h: 34,
    thickness: 34,
    solid: true,
    isPlatform: true
  },
  {
    id: 'sniper_shelf_right',
    name: 'Platforma Snajperska Prawa (Team B)',
    x: 3400,
    y: 800,
    w: 400,
    h: 34,
    thickness: 34,
    solid: true,
    isPlatform: true
  },

  // -----------------------------------------------------------------------
  // B. WISZĄCY MOST MODUŁOWY (Angry Birds Style Physics Blocks)
  // Przęsło rozpięte od X: 1750 do 2650 (24 zniszczalne drewniane belki/klocki)
  // -----------------------------------------------------------------------
  ...ARENA_3_BRIDGE_BLOCKS,

  // -----------------------------------------------------------------------
  // PLATFORMY DUŻO WYŻEJ NAD POMOSTEM (POZIOM ŚREDNI Y: 620 ORAZ NAJWYŻSZY Y: 430)
  // Wiszące w koronach drzew dżungli pomosty snajpersko-taktyczne
  // -----------------------------------------------------------------------
  {
    id: 'bridge_skywalk_left',
    name: 'Wiszący Pomost Nad Mostem Lewy',
    type: 'platform',
    x: 1880,
    y: 620,
    w: 260,
    h: 20,
    thickness: 20,
    solid: true,
    isPlatform: true,
    oneWay: true
  },
  {
    id: 'bridge_skywalk_right',
    name: 'Wiszący Pomost Nad Mostem Prawy',
    type: 'platform',
    x: 2260,
    y: 620,
    w: 260,
    h: 20,
    thickness: 20,
    solid: true,
    isPlatform: true,
    oneWay: true
  },
  {
    id: 'bridge_skywalk_upper_left',
    name: 'Wiszący Pomost Górny Lewy (Flanka)',
    type: 'platform',
    x: 1400,
    y: 430,
    w: 300,
    h: 20,
    thickness: 20,
    solid: true,
    isPlatform: true,
    oneWay: true
  },
  {
    id: 'bridge_skywalk_upper_right',
    name: 'Wiszący Pomost Górny Prawy (Flanka)',
    type: 'platform',
    x: 2700,
    y: 430,
    w: 300,
    h: 20,
    thickness: 20,
    solid: true,
    isPlatform: true,
    oneWay: true
  },

  // -----------------------------------------------------------------------
  // C. WOJSKOWE WIEŻE OBSERWACYJNE / GNIAZDA SNAJPERSKIE (X: 200 oraz X: 4200, Y: 400)
  // Fortyfikacje bojowe zamiast bramek piłkarskich - punkty taktyczne dla snajperów
  // -----------------------------------------------------------------------
  {
    id: 'tower_cyan_sniper_deck',
    name: 'Wieża Snajperska Lewa (Team A) - Górny Pomost',
    type: 'platform',
    x: 100,
    y: 400,
    w: 200,
    h: 22,
    thickness: 22,
    solid: true,
    isPlatform: true,
    oneWay: true
  },
  {
    id: 'tower_orange_sniper_deck',
    name: 'Wieża Snajperska Prawa (Team B) - Górny Pomost',
    type: 'platform',
    x: 4100,
    y: 400,
    w: 200,
    h: 22,
    thickness: 22,
    solid: true,
    isPlatform: true,
    oneWay: true
  }
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
    { x: 600, y: 1130 },  // Na gruncie Y: 1200
    { x: 800, y: 730 }    // Na platformie snajperskiej Y: 800
  ],
  teamB: [
    { x: 3800, y: 1130 }, // Na gruncie Y: 1200
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

  // 3. Fizyka i symulacja modularnego mostu (Angry Birds Physics)
  for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
    const b = ARENA_3_BRIDGE_BLOCKS[i];

    // Obsługa kaskadowego zapadania się klocków (chain reaction collapse)
    if (b.collapseDelay > 0) {
      b.collapseDelay--;
      if (b.collapseDelay === 0 && b.intact) {
        breakBridgeBlock(b, (Math.random() - 0.5) * 2.5, Math.random() * 2.0 + 1.2, (Math.random() - 0.5) * 0.15);
      }
    }

    if (b.intact) {
      // Intaktny klocek pozostaje stabilną platformą w spoczynku
      b.x = b.origX;
      b.y = b.origY;
      b.solid = true;
      b.isPlatform = true;
      continue;
    }

    // Klocek jest oderwany / dynamiczny / gruz
    b.solid = false;
    b.isPlatform = false;

    if (b.isAsleep) continue;

    const inWater = (b.y + b.h >= 1305);

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
      b.y += Math.sin(animTime * 3.0 + b.blockIndex * 0.6) * 0.28;

      // Sprawdzenie stanu uśpienia (Sleep State - 60 FPS Optimization)
      if (Math.abs(b.vx) < 0.08 && Math.abs(b.vy) < 0.12 && Math.abs(b.vRot) < 0.015) {
        b.sleepTimer++;
        if (b.sleepTimer > 35) {
          b.isAsleep = true;
        }
      } else {
        b.sleepTimer = 0;
      }
    } else {
      // Klocek w powietrzu - standardowa grawitacja
      b.vy += 0.38;
      b.vx *= 0.995;
      b.vy *= 0.995;
      b.vRot *= 0.992;
    }

    // Kolizja ze zboczami brzegu rzeki i dnem
    const groundFloorY = getRiverbankGroundY(b.x + b.w / 2);
    if (b.y + b.h >= groundFloorY) {
      b.y = groundFloorY - b.h;
      b.vy = -b.vy * 0.26;
      b.vx *= 0.62;
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

  // 4. Detekcja graczy na zniszczonych belkach
  if (Array.isArray(players)) {
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (!p) continue;
      if (p.currentPlatform && p.currentPlatform.isBridgeBlock && !p.currentPlatform.intact) {
        p.currentPlatform = null;
        p.onGround = false;
        p.isJumping = true;
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
  function drawTowerStructure(isLeft) {
    const tx = isLeft ? 185 : 4185;
    const tw = 30;
    const ty = 600;
    const th = 600;
    if (tx + tw + 140 < camL || tx - 140 > camR) return;

    ctx.save();
    // A. Kamienna podstawa / cokół na gruncie
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

    // F. Pomost inspekcyjny przy wieży (Y: 600, w: 160)
    const deckX = isLeft ? 120 : 4120;
    const deckW = 160;
    const deckY = 600;
    const deckH = 24;

    const deckGrad = ctx.createLinearGradient(deckX, deckY, deckX, deckY + deckH);
    deckGrad.addColorStop(0, '#5f3c1a');
    deckGrad.addColorStop(0.5, '#43280f');
    deckGrad.addColorStop(1, '#2c1706');
    ctx.fillStyle = deckGrad;
    ctx.fillRect(deckX, deckY, deckW, deckH);

    // Krawędź pomostu z mchem i ciosanym drewnem
    ctx.fillStyle = '#4c7a2b';
    ctx.fillRect(deckX, deckY, deckW, 4);

    ctx.strokeStyle = '#1c1005';
    ctx.lineWidth = 2;
    ctx.strokeRect(deckX, deckY, deckW, deckH);

    // Podpory pomostu od dołu (drewniane zastrzały)
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

    // Drążek proporca
    ctx.fillStyle = '#221508';
    ctx.fillRect(bannerX - 4, bannerY - 6, bannerW + 8, 6);

    // Tkanina proporca z wycięciem na dole
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

    // Oznaczenie / runa drużyny na proporcu
    ctx.fillStyle = teamColLight;
    ctx.font = '900 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(isLeft ? 'A' : 'B', bannerX + bannerW / 2, bannerY + 45);

    // Pasy militarne na proporcu
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(bannerX + 5, bannerY + 60, bannerW - 10, 4);
    ctx.fillRect(bannerX + 8, bannerY + 70, bannerW - 16, 3);
    ctx.restore();

    ctx.restore();
  }

  drawTowerStructure(true);
  drawTowerStructure(false);

  // -----------------------------------------------------------------------
  // 4. WOJSKOWE WIEŻE OBSERWACYJNE I GNIAZDA SNAJPERSKIE (X: 200 oraz X: 4200)
  // Fortyfikacje obronne w dżungli z pomostem snajperskim na Y: 400
  // -----------------------------------------------------------------------
  function drawWatchtowerSniperNest(isLeft) {
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

    // C. Główna platforma podłogowa gniazda snajperskiego (Y: 400)
    const platGrad = ctx.createLinearGradient(deckX, deckY, deckX, deckY + deckH);
    platGrad.addColorStop(0.0, '#6d431c');
    platGrad.addColorStop(0.5, '#492a0f');
    platGrad.addColorStop(1.0, '#2b1606');
    ctx.fillStyle = platGrad;
    ctx.fillRect(deckX, deckY, deckW, deckH);

    // Mech i zbrojenia na krawędzi
    ctx.fillStyle = '#4c7a2b';
    ctx.fillRect(deckX, deckY, deckW, 4);

    ctx.strokeStyle = '#1a0e04';
    ctx.lineWidth = 2.2;
    ctx.strokeRect(deckX, deckY, deckW, deckH);

    // Nacięcia desek i śruby
    ctx.strokeStyle = 'rgba(20, 10, 4, 0.6)';
    ctx.lineWidth = 1.5;
    for (let dx = deckX + 15; dx < deckX + deckW - 10; dx += 25) {
      ctx.beginPath();
      ctx.moveTo(dx, deckY);
      ctx.lineTo(dx, deckY + deckH);
      ctx.stroke();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(dx - 1, deckY + 4, 2.5, 2.5);
    }

    // D. Drewniana balustrada obronna / przedpiersie z otworami strzelniczymi (Y: 365 do 400)
    ctx.fillStyle = '#43260d';
    ctx.fillRect(deckX + 6, deckY - 32, deckW - 12, 32);
    ctx.strokeStyle = '#1c0f04';
    ctx.lineWidth = 2;
    ctx.strokeRect(deckX + 6, deckY - 32, deckW - 12, 32);

    // Szczeliny strzelnicze
    ctx.fillStyle = '#110903';
    for (let fx = deckX + 24; fx < deckX + deckW - 20; fx += 38) {
      ctx.fillRect(fx, deckY - 24, 18, 12);
    }

    // E. Słupy zadaszenia i maskująca płachta taktyczna (Camo Netting)
    ctx.strokeStyle = '#321908';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(deckX + 14, deckY - 32);
    ctx.lineTo(deckX + 14, deckY - 75);
    ctx.moveTo(deckX + deckW - 14, deckY - 32);
    ctx.lineTo(deckX + deckW - 14, deckY - 75);
    ctx.stroke();

    // Daszek cieniujący z liści palmowych i siatki maskującej
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

    // F. Maszt radiowy łączności wojskowej z pulsującą czerwoną diodą ostrzegawczą
    const antX = isLeft ? (deckX + 18) : (deckX + deckW - 18);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(antX, deckY - 75);
    ctx.lineTo(antX, deckY - 120);
    ctx.stroke();

    // Poprzeczki anteny
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(antX - 8, deckY - 110);
    ctx.lineTo(antX + 8, deckY - 110);
    ctx.moveTo(antX - 5, deckY - 100);
    ctx.lineTo(antX + 5, deckY - 100);
    ctx.stroke();

    // Dioda ostrzegawcza (Beacon)
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

    ctx.restore();
  }

  drawWatchtowerSniperNest(true);
  drawWatchtowerSniperNest(false);

  // -----------------------------------------------------------------------
  // 5. GŁÓWNE PLATFORMY SNAJPERSKIE (X: 800, Y: 800 oraz X: 3600, Y: 800)
  // Solidne półki skalne porośnięte mchem, szerokość ok. 400 px
  // -----------------------------------------------------------------------
  function drawSniperRock(px, py, pw, ph) {
    if (px + pw < camL || px > camR) return;

    ctx.save();
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
    ctx.fillRect(px + 10, py, pw - 20, 4);

    // C. Ostra krawędź komiksowa / rim lighting
    ctx.strokeStyle = 'rgba(135, 235, 75, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + pw, py);
    ctx.stroke();

    // D. Kamienne spękania i reliefy starożytnych ruin
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let rx = px + 25; rx < px + pw - 25; rx += 60) {
      ctx.fillRect(rx, py + 14, 40, 12);
    }

    // E. Zwieszające się pnącza (liany) pod platformą
    ctx.strokeStyle = '#3d6325';
    ctx.lineWidth = 3;
    for (let lx = px + 40; lx < px + pw - 40; lx += 80) {
      const vineLen = 35 + Math.sin(lx * 0.2) * 15;
      ctx.beginPath();
      ctx.moveTo(lx, py + ph);
      ctx.quadraticCurveTo(lx + 10, py + ph + vineLen * 0.5, lx - 5, py + ph + vineLen);
      ctx.stroke();
    }

    // F. Obrys platformy
    ctx.strokeStyle = '#1b231b';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(px, py, pw, ph);

    ctx.restore();
  }

  drawSniperRock(600, 800, 400, 34);
  drawSniperRock(3400, 800, 400, 34);

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
  function drawBridgePylon(px) {
    if (px + 60 < camL || px - 60 > camR) return;

    ctx.save();
    // 1. Kamienny fundament na brzegu (Y: 1200 do 1280)
    const pBaseGrad = ctx.createLinearGradient(px - 30, 1200, px + 30, 1280);
    pBaseGrad.addColorStop(0, '#4a5445');
    pBaseGrad.addColorStop(1, '#23291f');
    ctx.fillStyle = pBaseGrad;
    ctx.fillRect(px - 28, 1200, 56, 80);
    ctx.strokeStyle = '#141812';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(px - 28, 1200, 56, 80);

    // 2. Masywne pionowe słupy pylonu (A-frame z belek tekowych od 850 do 1200)
    const pWoodGrad = ctx.createLinearGradient(px - 25, pylonTopY, px + 25, 1200);
    pWoodGrad.addColorStop(0, '#533418');
    pWoodGrad.addColorStop(0.5, '#3c230e');
    pWoodGrad.addColorStop(1, '#251406');
    ctx.fillStyle = pWoodGrad;

    // Lewa noga pylonu
    ctx.fillRect(px - 24, pylonTopY, 18, 1200 - pylonTopY);
    // Prawa noga pylonu
    ctx.fillRect(px + 6, pylonTopY, 18, 1200 - pylonTopY);

    // Krzyżowe rygle wzmacniające (X-bracing)
    ctx.strokeStyle = '#3e240e';
    ctx.lineWidth = 6;
    for (let crossY = pylonTopY + 40; crossY < 1200 - 40; crossY += 75) {
      ctx.beginPath();
      ctx.moveTo(px - 20, crossY);
      ctx.lineTo(px + 20, crossY + 60);
      ctx.moveTo(px + 20, crossY);
      ctx.lineTo(px - 20, crossY + 60);
      ctx.stroke();

      // Stalowe klamry na skrzyżowaniach
      ctx.fillStyle = '#334155';
      ctx.fillRect(px - 26, crossY - 4, 52, 8);
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

    ctx.restore();
  }

  drawBridgePylon(pylonLeftX);
  drawBridgePylon(pylonRightX);

  // B. ŁAGODNE PODEJŚCIA NA MOST (Łączące płaski grunt Y: 1200 z kładką mostu Y: 1000)
  // Naturalna, łagodna rampa o nachyleniu ~18°, z drewnianym pomostem, palami nośnymi i poręczami
  function drawGentleBridgeApproach(isLeft) {
    const rx1 = isLeft ? 1150 : 2650;
    const rx2 = isLeft ? 1750 : 3250;

    if (rx2 < camL || rx1 > camR) return;

    const approachPts = isLeft ? [
      { x: 1150, y: 1200 },
      { x: 1300, y: 1165 },
      { x: 1450, y: 1120 },
      { x: 1600, y: 1065 },
      { x: 1750, y: 1000 }
    ] : [
      { x: 2650, y: 1000 },
      { x: 2800, y: 1065 },
      { x: 2950, y: 1120 },
      { x: 3100, y: 1165 },
      { x: 3250, y: 1200 }
    ];

    function getApproachY(x) {
      if (isLeft) {
        if (x <= 1150) return 1200;
        if (x >= 1750) return 1000;
        for (let i = 0; i < approachPts.length - 1; i++) {
          if (x >= approachPts[i].x && x <= approachPts[i + 1].x) {
            const t = (x - approachPts[i].x) / (approachPts[i + 1].x - approachPts[i].x);
            return approachPts[i].y + t * (approachPts[i + 1].y - approachPts[i].y);
          }
        }
      } else {
        if (x <= 2650) return 1000;
        if (x >= 3250) return 1200;
        for (let i = 0; i < approachPts.length - 1; i++) {
          if (x >= approachPts[i].x && x <= approachPts[i + 1].x) {
            const t = (x - approachPts[i].x) / (approachPts[i + 1].x - approachPts[i].x);
            return approachPts[i].y + t * (approachPts[i + 1].y - approachPts[i].y);
          }
        }
      }
      return 1200;
    }

    function getRiverbankGroundY(x) {
      if (isLeft) {
        if (x <= 1150) return 1200;
        const pts = leftOvalPoints;
        for (let i = 0; i < pts.length - 1; i++) {
          if (x >= pts[i].x && x <= pts[i + 1].x) {
            const t = (x - pts[i].x) / (pts[i + 1].x - pts[i].x);
            return pts[i].y + t * (pts[i + 1].y - pts[i].y);
          }
        }
        return 1335;
      } else {
        if (x >= 3250) return 1200;
        const pts = rightOvalPoints;
        for (let i = 0; i < pts.length - 1; i++) {
          if (x >= pts[i].x && x <= pts[i + 1].x) {
            const t = (x - pts[i].x) / (pts[i + 1].x - pts[i].x);
            return pts[i].y + t * (pts[i + 1].y - pts[i].y);
          }
        }
        return 1335;
      }
    }

    ctx.save();

    // 1. Drewniane pale nośne (podpory pod podejściem) zakotwiczone w owalnym zboczu
    const stiltXs = isLeft ? [1260, 1370, 1480, 1590, 1690] : [2710, 2810, 2920, 3030, 3140];
    for (let sIdx = 0; sIdx < stiltXs.length; sIdx++) {
      const sx = stiltXs[sIdx];
      const rampY = getApproachY(sx);
      const groundY = getRiverbankGroundY(sx);

      if (groundY > rampY + 16) {
        // Główny pal nośny z drewna tekowego
        ctx.strokeStyle = '#38200b';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(sx, rampY + 14);
        ctx.lineTo(sx, groundY + 12);
        ctx.stroke();

        // Światło na krawędzi pala
        ctx.strokeStyle = '#5a3818';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sx - 3, rampY + 14);
        ctx.lineTo(sx - 3, groundY + 12);
        ctx.stroke();

        // Żelazne klamry mocujące
        ctx.fillStyle = '#334155';
        ctx.fillRect(sx - 7, rampY + 22, 14, 7);
        ctx.fillRect(sx - 7, groundY - 14, 14, 7);

        // Zastrzały krzyżowe pomiędzy sąsiednimi palami
        if (sIdx < stiltXs.length - 1) {
          const nextSx = stiltXs[sIdx + 1];
          const nextRampY = getApproachY(nextSx);
          const nextGroundY = getRiverbankGroundY(nextSx);

          ctx.strokeStyle = '#281507';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(sx, rampY + 30);
          ctx.lineTo(nextSx, Math.min(nextGroundY, nextRampY + 70));
          ctx.moveTo(nextSx, nextRampY + 30);
          ctx.lineTo(sx, Math.min(groundY, rampY + 70));
          ctx.stroke();
        }
      }
    }

    // 2. Gruba drewniana belka policzkowa / korpus kładki rampy
    ctx.beginPath();
    ctx.moveTo(approachPts[0].x, approachPts[0].y);
    for (let i = 1; i < approachPts.length; i++) {
      ctx.lineTo(approachPts[i].x, approachPts[i].y);
    }
    for (let i = approachPts.length - 1; i >= 0; i--) {
      ctx.lineTo(approachPts[i].x, approachPts[i].y + 20);
    }
    ctx.closePath();

    const deckGrad = ctx.createLinearGradient(rx1, isLeft ? 1200 : 1000, rx2, isLeft ? 1000 : 1200);
    deckGrad.addColorStop(0.0, '#785226');
    deckGrad.addColorStop(0.5, '#563814');
    deckGrad.addColorStop(1.0, '#362108');
    ctx.fillStyle = deckGrad;
    ctx.fill();

    ctx.strokeStyle = '#221306';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 3. Poprzeczne listwy antypoślizgowe i nity (szczeble co 24px)
    for (let ax = rx1 + 18; ax <= rx2 - 14; ax += 24) {
      const ay = getApproachY(ax);
      // Nacięcie / listwa poprzeczna
      ctx.strokeStyle = 'rgba(235, 195, 105, 0.85)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(ax - 5, ay);
      ctx.lineTo(ax + 5, ay + 7);
      ctx.stroke();

      // Cień pod listwą
      ctx.strokeStyle = 'rgba(20, 10, 3, 0.6)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(ax - 5, ay + 2);
      ctx.lineTo(ax + 5, ay + 9);
      ctx.stroke();

      // Nit żelazny
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(ax - 1, ay + 4, 3, 3);
    }

    // Warstwa delikatnego mchu na górnej krawędzi
    ctx.strokeStyle = 'rgba(95, 180, 50, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(approachPts[0].x, approachPts[0].y + 1);
    for (let i = 1; i < approachPts.length; i++) {
      ctx.lineTo(approachPts[i].x, approachPts[i].y + 1);
    }
    ctx.stroke();

    // 4. Słupki poręczy i liny asekuracyjne
    const postStep = 48;
    const handrailHeight = 34;

    ctx.strokeStyle = '#3e240e';
    ctx.lineWidth = 4.5;
    for (let px = rx1 + 20; px <= rx2 - 10; px += postStep) {
      const py = getApproachY(px);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, py - handrailHeight);
      ctx.stroke();

      // Mosiężna głowica słupka
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(px, py - handrailHeight, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Główna lina poręczy biegnąca po szczytach słupków
    ctx.strokeStyle = '#5a3d1c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(approachPts[0].x, approachPts[0].y - handrailHeight);
    for (let i = 1; i < approachPts.length; i++) {
      ctx.lineTo(approachPts[i].x, approachPts[i].y - handrailHeight);
    }
    ctx.stroke();

    // Dolna lina asekuracyjna
    ctx.strokeStyle = '#3d2610';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(approachPts[0].x, approachPts[0].y - handrailHeight * 0.5);
    for (let i = 1; i < approachPts.length; i++) {
      ctx.lineTo(approachPts[i].x, approachPts[i].y - handrailHeight * 0.5);
    }
    ctx.stroke();

    // 5. Oznaczenie / Latarnia wejściowa na gruntowej krawędzi rampy
    const entryX = isLeft ? 1150 : 3250;
    const entryY = 1200;

    // Słup bramowy z ciosanego drewna
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
  function drawHighCanopyPlatform(px, py, pw, ph) {
    if (px + pw < camL || px > camR) return;

    ctx.save();
    // 1. Długie liny nośne z baldachimu dżungli (od Y = 0 do py)
    ctx.strokeStyle = '#4e3316';
    ctx.lineWidth = 3.5;
    // Lewa lina nośna
    ctx.beginPath();
    ctx.moveTo(px + 20, 0);
    ctx.lineTo(px + 20, py);
    ctx.stroke();
    // Prawa lina nośna
    ctx.beginPath();
    ctx.moveTo(px + pw - 20, 0);
    ctx.lineTo(px + pw - 20, py);
    ctx.stroke();

    // Owijające się liany wokół lin
    ctx.strokeStyle = '#3e6822';
    ctx.lineWidth = 2;
    for (let ly = 40; ly < py - 20; ly += 60) {
      ctx.beginPath();
      ctx.arc(px + 20, ly, 6, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px + pw - 20, ly + 25, 6, 0, Math.PI);
      ctx.stroke();
    }

    // 2. Drewniany pomost wiszący (bambus i ciosany tek)
    const platGrad = ctx.createLinearGradient(px, py, px, py + ph);
    platGrad.addColorStop(0.0, '#7c582c');
    platGrad.addColorStop(0.5, '#563a18');
    platGrad.addColorStop(1.0, '#35220c');
    ctx.fillStyle = platGrad;
    ctx.fillRect(px, py, pw, ph);

    // Szczeble i gwoździe
    ctx.strokeStyle = '#201306';
    ctx.lineWidth = 2;
    for (let bx = px + 15; bx < px + pw - 10; bx += 20) {
      ctx.beginPath();
      ctx.moveTo(bx, py);
      ctx.lineTo(bx, py + ph);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(bx - 1, py + 3, 2, 2);
      ctx.fillRect(bx - 1, py + ph - 5, 2, 2);
    }

    // Warstewka mchu na deskach
    ctx.fillStyle = '#4c802b';
    ctx.fillRect(px, py, pw, 3.5);

    // Rim lighting
    ctx.strokeStyle = 'rgba(235, 195, 100, 0.85)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + pw, py);
    ctx.stroke();

    ctx.strokeStyle = '#1b1005';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    // 3. Poręcz linowa na pomoście
    ctx.strokeStyle = '#3e240e';
    ctx.lineWidth = 3.5;
    for (let sx = px + 25; sx <= px + pw - 25; sx += 42) {
      ctx.beginPath();
      ctx.moveTo(sx, py);
      ctx.lineTo(sx, py - 24);
      ctx.stroke();
    }
    ctx.strokeStyle = '#5c3d1b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px + 10, py - 24);
    ctx.lineTo(px + pw - 10, py - 24);
    ctx.stroke();

    // 4. Wiszące pnącza pod pomostem
    ctx.strokeStyle = '#2f521b';
    ctx.lineWidth = 2.2;
    for (let vx = px + 30; vx < px + pw - 30; vx += 50) {
      const vLen = 22 + Math.sin(vx * 0.2) * 10;
      const vSway = Math.sin(animTime * 2.5 + vx * 0.1) * 5;
      ctx.beginPath();
      ctx.moveTo(vx, py + ph);
      ctx.quadraticCurveTo(vx + vSway * 0.5, py + ph + vLen * 0.5, vx + vSway, py + ph + vLen);
      ctx.stroke();
    }

    // 5. (Usunięto wiszące pomarańczowe lampiony pod kładkami dla czystego dziennego krajobrazu i 60 FPS)

    ctx.restore();
  }

  // Dolne pomosty w koronach drzew (Y: 620)
  drawHighCanopyPlatform(1880, 620, 260, 20);
  drawHighCanopyPlatform(2260, 620, 260, 20);

  // Dodatkowe wyższe pomosty taktyczne w koronach drzew (Y: 430, rozstawione szerzej na flankach)
  drawHighCanopyPlatform(1400, 430, 300, 20);
  drawHighCanopyPlatform(2700, 430, 300, 20);

  // C. KABLE KOTWICZĄCE ODCIĄGOWE (Od szczytów pylonów do litej skały brzegów)
  ctx.save();
  ctx.strokeStyle = '#4e3316';
  ctx.lineWidth = 5;
  ctx.beginPath();
  // Lewy odciąg
  ctx.moveTo(pylonLeftX, pylonTopY - 6);
  ctx.lineTo(1560, 1260);
  // Prawy odciąg
  ctx.moveTo(pylonRightX, pylonTopY - 6);
  ctx.lineTo(2840, 1260);
  ctx.stroke();

  // Druga lina odciągowa (podwójna lina stalowo-linowa)
  ctx.strokeStyle = '#2d1c0a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pylonLeftX + 4, pylonTopY - 6);
  ctx.lineTo(1564, 1260);
  ctx.moveTo(pylonRightX - 4, pylonTopY - 6);
  ctx.lineTo(2836, 1260);
  ctx.stroke();

  // Żelazne kotwice wbite w skałę
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(1550, 1250, 20, 25);
  ctx.fillRect(2830, 1250, 20, 25);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.strokeRect(1550, 1250, 20, 25);
  ctx.strokeRect(2830, 1250, 20, 25);
  ctx.restore();

  // D. GŁÓWNE LINY NOŚNE PRZĘSŁA (Łuk paraboliczny od pylonu do pylonu)
  if (bridgeX2 + 80 >= camL && bridgeX1 - 80 <= camR) {
    ctx.save();
    // 1. Górna główna lina nośna (Main Cable)
    ctx.strokeStyle = '#5a3b19';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(pylonLeftX, pylonTopY - 6);
    ctx.quadraticCurveTo(2200, 970, pylonRightX, pylonTopY - 6);
    ctx.stroke();

    // Ciemna krawędź liny (cień)
    ctx.strokeStyle = '#2c1a0a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pylonLeftX, pylonTopY - 3);
    ctx.quadraticCurveTo(2200, 973, pylonRightX, pylonTopY - 3);
    ctx.stroke();

    // 2. Dolna lina poręczy (Handrail cable)
    ctx.strokeStyle = '#432910';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(bridgeX1 - 10, bridgeY - 35);
    ctx.lineTo(bridgeX2 + 10, bridgeY - 35);
    ctx.stroke();

    // 3. Pionowe wieszaki linowe łączące główną linę z kładką (Vertical Suspenders)
    ctx.strokeStyle = 'rgba(115, 78, 38, 0.85)';
    ctx.lineWidth = 2;
    for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
      const b = ARENA_3_BRIDGE_BLOCKS[i];
      const hx = b.origX + b.w / 2;
      const u = (hx - pylonLeftX) / (pylonRightX - pylonLeftX);
      const cableY = (1 - u) * (1 - u) * (pylonTopY - 6) + 2 * (1 - u) * u * 970 + u * u * (pylonTopY - 6);

      if (b.intact && b.cableAttached) {
        // Nienaruszona lina nośna
        ctx.beginPath();
        ctx.moveTo(hx, cableY);
        ctx.lineTo(hx, b.y);
        ctx.stroke();

        // Stalowa obejma na desce
        ctx.fillStyle = '#334155';
        ctx.fillRect(hx - 2, b.y - 2, 4, 6);
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
      // 1. NIENARUSZONA BELKA MOSTU (Stabilna część pomostu)
      const bGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      bGrad.addColorStop(0.0, '#785226');
      bGrad.addColorStop(0.5, '#563814');
      bGrad.addColorStop(1.0, '#362108');
      ctx.fillStyle = bGrad;
      ctx.fillRect(b.x, b.y, b.w, b.h);

      // Słoje i nacięcia drewna
      ctx.strokeStyle = 'rgba(28, 16, 5, 0.65)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(b.x + b.w * 0.5, b.y);
      ctx.lineTo(b.x + b.w * 0.5, b.y + b.h);
      ctx.stroke();

      // Śruby mocujące deski
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(b.x + 3, b.y + 3, 2.5, 2.5);
      ctx.fillRect(b.x + b.w - 5, b.y + 3, 2.5, 2.5);
      ctx.fillRect(b.x + 3, b.y + 12, 2.5, 2.5);
      ctx.fillRect(b.x + b.w - 5, b.y + 12, 2.5, 2.5);

      // Warstwa mchu na górnej krawędzi
      ctx.strokeStyle = '#4d8028';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + 1);
      ctx.lineTo(b.x + b.w, b.y + 1);
      ctx.stroke();

      // Jasny rim light
      ctx.strokeStyle = 'rgba(225, 185, 95, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + b.w, b.y);
      ctx.stroke();

      // Obrys belki
      ctx.strokeStyle = '#241405';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(b.x, b.y, b.w, b.h);

      // Zwisające pnącza co kilka segmentów
      if (b.blockIndex % 3 === 0) {
        ctx.strokeStyle = '#32571e';
        ctx.lineWidth = 2.2;
        const vLen = 22 + Math.sin(b.x * 0.15) * 10;
        const vSway = Math.sin(animTime * 2.2 + b.x * 0.05) * 6;
        ctx.beginPath();
        ctx.moveTo(b.x + b.w / 2, b.y + b.h);
        ctx.quadraticCurveTo(b.x + b.w / 2 + vSway * 0.5, b.y + b.h + vLen * 0.5, b.x + b.w / 2 + vSway, b.y + b.h + vLen);
        ctx.stroke();
      }
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

// =========================================================================
// 8. HOOKI INTERAKCJI BOJOWYCH
// =========================================================================
export function onArena3BulletHit(bullet) {
  if (!bullet) return false;
  const bx = bullet.x;
  const by = bullet.y;

  for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
    const b = ARENA_3_BRIDGE_BLOCKS[i];
    if (!b.intact) continue;

    if (bx >= b.x - 2 && bx <= b.x + b.w + 2 && by >= b.y - 4 && by <= b.y + b.h + 4) {
      b.hp -= (bullet.damage || 14);
      spawnBridgeSplinters(bx, by, (bullet.vx || 0) * 0.25, -2, 6);

      if (b.hp <= 0) {
        const impX = (bullet.vx || 0) * 0.1;
        const impY = Math.min(3.5, Math.max(1.2, (bullet.vy || 0) * 0.1 + 1.5));
        breakBridgeBlock(b, impX, impY, (Math.random() - 0.5) * 0.2);
        evaluateBridgeIntegrity();
      }
      return true;
    }
  }
  return false;
}

export function onArena3KickHit(player, kickBox) {
  return false;
}

export function onArena3Explosion(expX, expY, radius, context) {
  let hitAny = false;
  const blastRad = radius || 140;

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
  name: 'Jungle Arena (Militarna Dżungla)',
  width: 4400,
  height: 1400,
  physics: {
    gravity: 9.8,
    waterDrag: 0.6
  },
  spawns: [
    // Team A (Cyan): grunt lewy Y: 1200 (wysokość gracza 70px -> y: 1130)
    { x: 600, y: 1130 },
    // Team B (Orange): grunt prawy Y: 1200 (wysokość gracza 70px -> y: 1130)
    { x: 3800, y: 1130 }
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

export default arena3;
