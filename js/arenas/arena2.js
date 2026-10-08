// =========================================================================
// ARENAS/ARENA2.JS - ŚWIĘTA DŻUNGLA / ANCIENT JUNGLE SANCTUARY (3600 x 1800 PX)
// Profesjonalny silnik geometrii i renderowania poziomu w stylu SOLDAT
// =========================================================================

import { drawPandoraBackground } from '../background.js';

// =========================================================================
// 1. KONFIGURACJA ARENY (ARENA_2_CONFIG)
// =========================================================================
export const ARENA_2_CONFIG = {
  id: 'ARENA_2',
  alias: 'ARENA_2_PANDORA',
  name: 'Święta Dżungla',
  subtitle: 'Ancient Jungle Sanctuary',
  width: 3600,
  height: 2000,
  bounds: {
    minX: 0,
    maxX: 3600,
    minY: 0,
    maxY: 2000
  },
  spawns: {
    left: { x: 420, y: 910 },
    right: { x: 3180, y: 910 }
  },
  cloudZoneY: 1510,
  abyssDeathY: 1660,
  updraftImpulse: -680
};

export const ARENA_2_PANDORA = ARENA_2_CONFIG;

// =========================================================================
// 2. TABLICA FIZYCZNYCH PLATFORM (ARENA_2_PLATFORMS)
// Obniżone o 130 px w dół dla idealnej kompozycji i przestrzeni pod sufitem
// =========================================================================
export const ARENA_2_PLATFORMS = [
  // -----------------------------------------------------------------------
  // A. LEWY BASTION SKALNY (X: 0 - 880)
  // -----------------------------------------------------------------------
  {
    id: 'left_bastion_main',
    name: 'Lewy Bastion Skalny (Główna Platforma)',
    isPlatform: true,
    isSolid: true,
    solid: true,
    x: 0,
    y: 990,
    w: 880,
    h: 1010
  },
  {
    id: 'left_bastion_mid_shelf',
    name: 'Lewy Bastion - Średnia Półka Nadrzewna',
    isPlatform: true,
    isDropThrough: true,
    oneWay: true,
    x: 120,
    y: 790,
    w: 320,
    h: 22
  },
  {
    id: 'left_bastion_sniper_nest',
    name: 'Lewy Bastion - Wysokie Gniazdo Snajperskie',
    isPlatform: true,
    isDropThrough: true,
    oneWay: true,
    x: 540,
    y: 630,
    w: 240,
    h: 20
  },

  // -----------------------------------------------------------------------
  // B. PRAWY BASTION SKALNY (X: 2720 - 3600)
  // -----------------------------------------------------------------------
  {
    id: 'right_bastion_main',
    name: 'Prawy Bastion Skalny (Główna Platforma)',
    isPlatform: true,
    isSolid: true,
    solid: true,
    x: 2720,
    y: 990,
    w: 880,
    h: 1010
  },
  {
    id: 'right_bastion_mid_shelf',
    name: 'Prawy Bastion - Średnia Półka Nadrzewna',
    isPlatform: true,
    isDropThrough: true,
    oneWay: true,
    x: 3160,
    y: 790,
    w: 320,
    h: 22
  },
  {
    id: 'right_bastion_sniper_nest',
    name: 'Prawy Bastion - Wysokie Gniazdo Snajperskie',
    isPlatform: true,
    isDropThrough: true,
    oneWay: true,
    x: 2820,
    y: 630,
    w: 240,
    h: 20
  },

  // -----------------------------------------------------------------------
  // C. DYNAMICZNE ZNISZCZALNE MOSTY LINOWE (X: 880-1360 oraz 2240-2720)
  // Dawne sztywne platformy zastąpione dynamicznym systemem ARENA_2_BRIDGES (Soldat-style)
  // -----------------------------------------------------------------------

  // -----------------------------------------------------------------------
  // D. CENTRALNE SANKTUARIUM SŁOŃCA (3 POZIOMY, X: 1360 - 2240)
  // -----------------------------------------------------------------------
  {
    id: 'sanctuary_base_pedestal',
    name: 'Sanktuarium Słońca - Monolityczny Cokół Bazowy',
    isPlatform: true,
    isSolid: true,
    solid: true,
    x: 1360,
    y: 990,
    w: 880,
    h: 1010
  },
  {
    id: 'sanctuary_floor_catwalk',
    name: 'Sanktuarium Słońca - Kładka Piętra (Poziom Średni)',
    isPlatform: true,
    isDropThrough: true,
    oneWay: true,
    x: 1480,
    y: 810,
    w: 640,
    h: 24
  },
  {
    id: 'sanctuary_altar_disc',
    name: 'Sanktuarium Słońca - Szczytowy Ołtarz (Czysta Kładka)',
    isPlatform: true,
    isDropThrough: true,
    oneWay: true,
    x: 1660,
    y: 650,
    w: 280,
    h: 24
  },

  // -----------------------------------------------------------------------
  // E. DOLNE WYSEPKI TAKTYCZNE NAD WODĄ (Y: 1150)
  // -----------------------------------------------------------------------
  {
    id: 'tactical_water_island_left',
    name: 'Lewa Wysepka Taktyczna (Nad Wodą)',
    isPlatform: true,
    isDropThrough: true,
    oneWay: true,
    x: 1040,
    y: 1150,
    w: 180,
    h: 20
  },
  {
    id: 'tactical_water_island_right',
    name: 'Prawa Wysepka Taktyczna (Nad Wodą)',
    isPlatform: true,
    isDropThrough: true,
    oneWay: true,
    x: 2380,
    y: 1150,
    w: 180,
    h: 20
  }
];

// Aliasy wstecznej kompatybilności dla fizyki i orkiestratora
export const ARENA_2_PANDORA_PLATFORMS = ARENA_2_PLATFORMS;
export const ARENA_CYBER_STADIUM_PLATFORMS = ARENA_2_PLATFORMS;
export const ARENA_2_PANDORA_GOALS = [];
export const ARENA_CYBER_STADIUM_GOALS = [];
export const ARENA_CYBER_STADIUM_BARRICADES = [];
export const LEFT_VINE_BRIDGE_POINTS = [];
export const RIGHT_VINE_BRIDGE_POINTS = [];

// =========================================================================
// 2B. SYSTEM INTERAKTYWNYCH ZNISZCZALNYCH MOSTÓW LINOWYCH (SOLDAT-STYLE)
// =========================================================================
export const ARENA_2_WOOD_SPLINTERS = [];

export function spawnWoodSplinters(x, y, vxBase = 0, vyBase = 0, count = 4) {
  for (let i = 0; i < count; i++) {
    ARENA_2_WOOD_SPLINTERS.push({
      x,
      y,
      vx: vxBase * 0.35 + (Math.random() - 0.5) * 6.5,
      vy: vyBase * 0.35 - Math.random() * 4.5 - 1.0,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.5,
      size: 2.5 + Math.random() * 3.5,
      life: 35 + Math.random() * 25,
      color: ['#613d22', '#8b5a2b', '#452a15', '#3d2612', '#784d28'][Math.floor(Math.random() * 5)]
    });
  }
  if (ARENA_2_WOOD_SPLINTERS.length > 80) {
    ARENA_2_WOOD_SPLINTERS.splice(0, ARENA_2_WOOD_SPLINTERS.length - 80);
  }
}

function createBridgePlanks(bridgeId, anchorLeftX, anchorLeftY, count = 20, bridgeW = 480) {
  const planks = [];
  const spacing = bridgeW / count; // 24 px
  const plankW = 18;
  const plankH = 8;
  const offset = (spacing - plankW) / 2; // 3 px

  for (let i = 0; i < count; i++) {
    const relProgress = (i + 0.5) / count;
    const sag = Math.sin(relProgress * Math.PI) * 10;
    const px = anchorLeftX + i * spacing + offset;
    const py = anchorLeftY + sag;

    planks.push({
      id: `${bridgeId}_plank_${i}`,
      bridgeId,
      index: i,
      x: px,
      y: py,
      origX: px,
      origY: py,
      w: plankW,
      h: plankH,
      hp: 35,
      maxHp: 35,
      destroyed: false,
      isFalling: false,
      vx: 0,
      vy: 0,
      rot: 0,
      rotVel: 0,
      isBridgePlank: true,
      seed: (i * 17 + (bridgeId === 'a2_bridge_left' ? 3 : 7)) % 100
    });
  }
  return planks;
}

export const ARENA_2_BRIDGES = [
  {
    id: 'a2_bridge_left',
    name: 'Lewy Wiszący Most Linowy',
    anchorLeft: { x: 880, y: 990 },
    anchorRight: { x: 1360, y: 990 },
    w: 480,
    h: 18,
    isSnapped: false,
    snapIndex: -1,
    leftSwingAngle: 0,
    leftSwingVel: 0,
    rightSwingAngle: 0,
    rightSwingVel: 0,
    planks: createBridgePlanks('a2_bridge_left', 880, 990, 20, 480)
  },
  {
    id: 'a2_bridge_right',
    name: 'Prawy Wiszący Most Linowy',
    anchorLeft: { x: 2240, y: 990 },
    anchorRight: { x: 2720, y: 990 },
    w: 480,
    h: 18,
    isSnapped: false,
    snapIndex: -1,
    leftSwingAngle: 0,
    leftSwingVel: 0,
    rightSwingAngle: 0,
    rightSwingVel: 0,
    planks: createBridgePlanks('a2_bridge_right', 2240, 990, 20, 480)
  }
];

export function resetArena2Bridges() {
  ARENA_2_WOOD_SPLINTERS.length = 0;
  for (let bIdx = 0; bIdx < ARENA_2_BRIDGES.length; bIdx++) {
    const bridge = ARENA_2_BRIDGES[bIdx];
    bridge.isSnapped = false;
    bridge.snapIndex = -1;
    bridge.leftSwingAngle = 0;
    bridge.leftSwingVel = 0;
    bridge.rightSwingAngle = 0;
    bridge.rightSwingVel = 0;
    const spacing = bridge.w / bridge.planks.length;
    const offset = (spacing - 18) / 2;

    for (let i = 0; i < bridge.planks.length; i++) {
      const plank = bridge.planks[i];
      const relProgress = (i + 0.5) / bridge.planks.length;
      const sag = Math.sin(relProgress * Math.PI) * 10;
      plank.x = bridge.anchorLeft.x + i * spacing + offset;
      plank.y = bridge.anchorLeft.y + sag;
      plank.origX = plank.x;
      plank.origY = plank.y;
      plank.hp = plank.maxHp;
      plank.destroyed = false;
      plank.isFalling = false;
      plank.vx = 0;
      plank.vy = 0;
      plank.rot = 0;
      plank.rotVel = 0;
    }
  }
}

export function snapBridge(bridge, snapIndex = -1) {
  if (!bridge || bridge.isSnapped) return;
  bridge.isSnapped = true;
  if (snapIndex < 0 || snapIndex >= bridge.planks.length) {
    snapIndex = Math.floor(bridge.planks.length / 2);
  }
  bridge.snapIndex = snapIndex;

  // Zerwanie liny: obie połówki zaczynają zwisać pionowo z punktów zakotwiczenia,
  // wahając się z początkowym wychyleniem
  bridge.leftSwingAngle = 1.35;
  bridge.leftSwingVel = 0;
  bridge.rightSwingAngle = 1.35;
  bridge.rightSwingVel = 0;

  const snapPlank = bridge.planks[snapIndex];
  if (snapPlank) {
    spawnWoodSplinters(snapPlank.x + snapPlank.w / 2, snapPlank.y + snapPlank.h / 2, 0, -2, 8);
  }
}

export function checkBridgeSnapConditions(bridge) {
  if (!bridge || bridge.isSnapped) return;
  let consecutive = 0;
  let snapIndex = -1;

  for (let i = 0; i < bridge.planks.length; i++) {
    if (bridge.planks[i].destroyed) {
      consecutive++;
      if (consecutive >= 3) {
        snapIndex = i - 1;
        break;
      }
    } else {
      consecutive = 0;
    }
  }

  if (snapIndex !== -1) {
    snapBridge(bridge, snapIndex);
  }
}

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

// =========================================================================
// 3. FIZYKA OTCHŁANI I PRĄDÓW WZNOSZĄCYCH (UPDRAFT SAFETY ZONE)
// =========================================================================
export function applyPandoraUpdraft(player) {
  if (!player || player.isDead) return false;
  if (player.y > 1510) {
    if (player.y >= 1660) {
      player.hp = 0;
      player.isDead = true;
      player.respawnTimer = 75;
      return false;
    }
    player.vy = -18.5;
    player.isJumping = true;
    player.onGround = false;
    player.currentPlatform = null;
    return true;
  }
  return false;
}

export function checkPandoraUpdraft(player) {
  return applyPandoraUpdraft(player);
}

// =========================================================================
// 4. PREALOKOWANE STRUKTURY DLA ZACHOWANIA 60 FPS (ZERO GC ALLOCATIONS)
// =========================================================================
const FIREFLIES_COUNT = 24;
const _fireflies = [];
for (let i = 0; i < FIREFLIES_COUNT; i++) {
  _fireflies.push({
    baseX: 100 + (i * 147.3) % 3400,
    baseY: 400 + (i * 47.9) % 860,
    speedX: ((i % 5) - 2) * 5.0,
    speedY: -6.0 - (i % 4) * 3.5,
    phase: i * 0.48,
    pulseSpeed: 1.4 + (i % 4) * 0.5,
    size: 1.6 + (i % 3) * 0.7,
    isGolden: (i % 3 !== 1)
  });
}

const _lotusBeds = [
  // Lewy basen (X: 880 - 1360, wysepka na 1040 - 1220)
  { x: 940, r: 15, flower: true },
  { x: 990, r: 17, flower: false },
  { x: 1270, r: 16, flower: true },
  { x: 1320, r: 14, flower: false },
  // Prawy basen (X: 2240 - 2720, wysepka na 2380 - 2560)
  { x: 2290, r: 15, flower: false },
  { x: 2330, r: 17, flower: true },
  { x: 2610, r: 16, flower: true },
  { x: 2670, r: 14, flower: false }
];

const _cloudPuffs = [
  { baseY: 1610, step: 220, rBase: 125, amp: 28, speed: 14, col: '#062016' },
  { baseY: 1550, step: 175, rBase: 100, amp: 24, speed: 20, col: '#082b1d' }
];

// =========================================================================
// 5. PROCEDURY RENDEROWANIA ELEMENTÓW GEOMETRII
// =========================================================================

/** Zwraca falujące lustro wody na poziomie Y = 1210 */
function getWaterSurfaceY(x, time) {
  return 1210 + Math.sin(time * 3.2 + x * 0.022) * 4.2 + Math.sin(time * 1.7 + x * 0.045) * 2.0;
}

/** Rysuje poduszkę mchu i trawy na płaskiej krawędzi platformy */
function drawMossCushion(ctx, x, y, w, thickness = 8, time = 0) {
  ctx.save();
  // Głęboki ciemnozielony spód mchu
  ctx.strokeStyle = '#154826';
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.moveTo(x - 2, y + 1);
  ctx.lineTo(x + w + 2, y + 1);
  ctx.stroke();

  // Średnia warstwa soczystej trawy
  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = thickness * 0.6;
  ctx.beginPath();
  ctx.moveTo(x - 2, y + 0.5);
  ctx.lineTo(x + w + 2, y + 0.5);
  ctx.stroke();

  // Jasny, świeży szmaragdowy wierzch
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = thickness * 0.25;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();

  // Złocisty rim-light na górnej krawędzi
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y - 0.5);
  ctx.lineTo(x + w, y - 0.5);
  ctx.stroke();

  // Naturalne małe kępki trawy
  ctx.fillStyle = '#22c55e';
  const tufts = Math.floor(w / 22);
  for (let t = 0; t <= tufts; t++) {
    const tx = x + t * 22;
    const th = 2.5 + ((t * 7) % 4);
    ctx.beginPath();
    ctx.arc(tx, y, th, Math.PI, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Rysuje kępę dzikich tropikalnych orchidei (fuksja/magenta z żółtym środkiem) */
function drawWildOrchids(ctx, cx, cy) {
  ctx.save();
  const flowerCols = ['#ec4899', '#f43f5e', '#d946ef'];
  for (let i = 0; i < 3; i++) {
    const fx = cx + (i - 1) * 8;
    const fy = cy + (i % 2) * 4;
    ctx.fillStyle = flowerCols[i];
    for (let p = 0; p < 5; p++) {
      const ang = (p / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(fx + Math.cos(ang) * 3.5, fy + Math.sin(ang) * 3.5, 3.2, 1.8, ang, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(fx, fy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 1. GŁĘBOKA WODA DO SAMEGO SPODU WIDOKU (BOTTOM_Y)
 * Dwa baseny: lewy (X: 880-1360) oraz prawy (X: 2240-2720)
 */
export function drawPandoraWaterAndBasin(ctx, x0, x1, time, bottomY) {
  drawDeepWaterBasin(ctx, x0, x1, time, bottomY);
}

function drawDeepWaterBasin(ctx, x0, x1, time, bottomY) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';
  const width = x1 - x0;
  const steps = 24;
  const dx = width / steps;

  // A. SKALNE KORYTO BASENU - W 100% KRYJĄCY PODKŁAD OD LINII FAL DO BOTTOM_Y (ZERO PRZEŚWITÓW)
  ctx.fillStyle = '#010806';
  ctx.beginPath();
  ctx.moveTo(x0 - 20, getWaterSurfaceY(x0, time) - 6);
  for (let i = 1; i <= steps; i++) {
    const px = x0 + i * dx;
    ctx.lineTo(px, getWaterSurfaceY(px, time) - 6);
  }
  ctx.lineTo(x1 + 20, bottomY + 200);
  ctx.lineTo(x0 - 20, bottomY + 200);
  ctx.closePath();
  ctx.fill();

  const bedGrad = ctx.createLinearGradient(0, 1190, 0, bottomY);
  bedGrad.addColorStop(0.00, '#051811');
  bedGrad.addColorStop(0.35, '#03120c');
  bedGrad.addColorStop(0.70, '#020b08');
  bedGrad.addColorStop(1.00, '#010806');
  ctx.fillStyle = bedGrad;
  ctx.fillRect(x0 - 10, 1190, width + 20, (bottomY - 1190) + 200);

  // B. ZATOPIONE STAROŻYTNE BRUKI I SCHODY NA DNIE (Y: 1450 - BOTTOM_Y)
  ctx.fillStyle = '#062018';
  ctx.fillRect(x0 - 4, 1450, width + 8, (bottomY - 1450) + 200);
  ctx.strokeStyle = '#041510';
  ctx.lineWidth = 1.6;
  for (let sx = x0 + 15; sx < x1; sx += 40) {
    ctx.beginPath();
    ctx.moveTo(sx, 1450);
    ctx.lineTo(sx, bottomY + 50);
    ctx.stroke();
  }
  for (let sy = 1470; sy < bottomY + 50; sy += 32) {
    ctx.beginPath();
    ctx.moveTo(x0, sy);
    ctx.lineTo(x1, sy);
    ctx.stroke();
  }

  // C. MASA WODY - W 100% KRYJĄCY GRADIENT PIONOWY (ZERO PRZEŚWITÓW Z TŁA)
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';
  const waterGrad = ctx.createLinearGradient(0, 1190, 0, bottomY);
  waterGrad.addColorStop(0.00, '#0284c7'); // 100% kryjący lśniący błękit/cyjan
  waterGrad.addColorStop(0.18, '#0d9488'); // 100% kryjący nasycony szmaragd
  waterGrad.addColorStop(0.55, '#064e3b'); // 100% kryjąca głęboka zieleń nefrytu
  waterGrad.addColorStop(0.85, '#022c22'); // 100% kryjące głębinowe dno
  waterGrad.addColorStop(1.00, '#01120d'); // 100% kryjąca ciemność otchłani

  ctx.fillStyle = waterGrad;
  ctx.beginPath();
  ctx.moveTo(x0 - 8, getWaterSurfaceY(x0, time));
  for (let i = 1; i <= steps; i++) {
    const px = x0 + i * dx;
    ctx.lineTo(px, getWaterSurfaceY(px, time));
  }
  ctx.lineTo(x1 + 8, bottomY + 200);
  ctx.lineTo(x0 - 8, bottomY + 200);
  ctx.closePath();
  ctx.fill();

  // D. PODWODNE REFLEKSY ŚWIATŁA (KAUSTYKA W TRYBIE 'SCREEN')
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.strokeStyle = 'rgba(153, 246, 228, 0.16)';
  ctx.lineWidth = 2.0;
  for (let c = 0; c < 6; c++) {
    const cx0 = x0 + 35 + c * (width / 6) + Math.sin(time * 1.5 + c) * 18;
    const cy0 = getWaterSurfaceY(cx0, time) + 4;
    ctx.beginPath();
    ctx.moveTo(cx0, cy0);
    ctx.quadraticCurveTo(cx0 + 25, cy0 + 40, cx0 + 10, cy0 + 85);
    ctx.stroke();
  }
  ctx.restore();

  // E. REFLEKSY, PIANA I CYJANOWA POŚWIATA NA TAFLE WODY
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  // Główna lśniąca wstęga fali
  ctx.strokeStyle = 'rgba(230, 255, 250, 0.88)';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(x0, getWaterSurfaceY(x0, time));
  for (let i = 1; i <= steps; i++) {
    const px = x0 + i * dx;
    ctx.lineTo(px, getWaterSurfaceY(px, time));
  }
  ctx.stroke();

  // Cyjanowa poświata pod grzbietem fali
  ctx.strokeStyle = 'rgba(94, 234, 212, 0.42)';
  ctx.lineWidth = 4.0;
  ctx.stroke();

  // Tańczące świetliste kresty piany
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1.6;
  for (let w = 0; w < 6; w++) {
    const waveX = x0 + 25 + w * (width / 6) + Math.sin(time * 2.0 + w * 0.9) * 16;
    const waveY = getWaterSurfaceY(waveX, time) + 2;
    const waveW = 28 + (w % 3) * 12;
    ctx.beginPath();
    ctx.moveTo(waveX, waveY);
    ctx.quadraticCurveTo(waveX + waveW * 0.5, waveY - 2.5, waveX + waveW, waveY);
    ctx.stroke();
  }
  ctx.restore();

  // F. KAMIENNE NABRZEŻA OBRAMOWUJĄCE WODĘ PO BOKACH
  drawQuayWall(ctx, x0 - 20, x0 + 10, 990, bottomY);
  drawQuayWall(ctx, x1 - 10, x1 + 20, 990, bottomY);

  ctx.restore();
}

/** Rysuje kamienne ciosane nabrzeże graniczące z wodą */
function drawQuayWall(ctx, x0, x1, topY, bottomY) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';
  const w = x1 - x0;
  // 100% solidne nieprzezroczyste krycie
  ctx.fillStyle = '#020605';
  ctx.fillRect(x0 - 4, topY, w + 8, (bottomY - topY) + 200);

  const qGrad = ctx.createLinearGradient(x0, topY, x1, bottomY);
  qGrad.addColorStop(0.00, '#222d26');
  qGrad.addColorStop(0.25, '#19221c');
  qGrad.addColorStop(0.65, '#111713');
  qGrad.addColorStop(1.00, '#040705');
  ctx.fillStyle = qGrad;
  ctx.fillRect(x0, topY, w, (bottomY - topY) + 200);

  // Fugi murarskie
  ctx.strokeStyle = '#0d1310';
  ctx.lineWidth = 1.6;
  for (let sy = topY; sy < bottomY + 50; sy += 28) {
    ctx.beginPath();
    ctx.moveTo(x0, sy);
    ctx.lineTo(x1, sy);
    ctx.stroke();
  }
  // Zacieki wilgoci wokół linii wody
  ctx.fillStyle = 'rgba(16, 44, 28, 0.65)';
  ctx.fillRect(x0, 1206, w, 24);
  ctx.restore();
}

/**
 * 2. LEWY I PRAWY BASTION SKALNY (LITA BRYŁA OD Y = 860 DO BOTTOM_Y)
 */
function drawRockBastion(ctx, x, y, w, h, isLeft, time, bottomY) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';

  // 100% KRYJĄCY PODKŁAD LITEJ BRYŁY SKALNEJ (ZERO PRZEŚWITÓW TŁA)
  ctx.fillStyle = '#020605';
  ctx.fillRect(x - 8, y, w + 16, (bottomY - y) + 200);

  // A. PIONOWY GRADIENT SKAŁY: CIEMNY SZMARAGD/GRAFIT W #040705 NA DOLE
  const rockGrad = ctx.createLinearGradient(0, y, 0, bottomY);
  rockGrad.addColorStop(0.00, '#1c2822');
  rockGrad.addColorStop(0.20, '#15211b');
  rockGrad.addColorStop(0.50, '#0e1713');
  rockGrad.addColorStop(0.80, '#080d0a');
  rockGrad.addColorStop(1.00, '#040705');

  ctx.fillStyle = rockGrad;
  ctx.fillRect(x - 4, y, w + 8, (bottomY - y) + 200);

  // B. PIONOWE SZCZELINY TEKTONICZNE I STRUKTURA GEOLOGICZNA
  ctx.strokeStyle = 'rgba(11, 19, 15, 0.85)';
  ctx.lineWidth = 1.8;
  const startFx = isLeft ? 60 : x + 40;
  const endFx = isLeft ? x + w - 30 : x + w - 40;
  for (let fx = startFx; fx < endFx; fx += 90) {
    ctx.beginPath();
    ctx.moveTo(fx, y);
    ctx.lineTo(fx + 12, y + 140);
    ctx.lineTo(fx - 8, y + 360);
    ctx.lineTo(fx + 6, bottomY);
    ctx.stroke();
  }

  // C. ZACIEKI WILGOCI I CIEMNE GLONY W STREFIE WODNEJ (Y: 1210)
  ctx.fillStyle = 'rgba(12, 38, 26, 0.55)';
  const edgeX = isLeft ? (x + w - 70) : x;
  ctx.fillRect(edgeX, 1205, 70, 35);

  // D. PODUSZKA MCHU I TRAWY NA SZCZYCIE BASTIONU (Y = 990)
  drawMossCushion(ctx, x, y, w, 8, time);

  // E. DZIKIE ORCHIDEE NA KRAWĘDZIACH SKALNYCH
  if (isLeft) {
    drawWildOrchids(ctx, x + 240, y - 2);
    drawWildOrchids(ctx, x + 720, y - 2);
  } else {
    drawWildOrchids(ctx, x + 160, y - 2);
    drawWildOrchids(ctx, x + 640, y - 2);
  }

  ctx.restore();
}

/**
 * 3. PÓŁKI NADRZEWNE I WYSOKIE GNIAZDA SNAJPERSKIE
 */
function drawHardwoodPlatform(ctx, x, y, w, h, isSniper, time) {
  ctx.save();
  ctx.shadowBlur = 0;

  // Cień platformy
  ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
  ctx.fillRect(x - 2, y + 4, w + 4, h + 4);

  // Grube deski z twardego drewna dżungli
  const woodGrad = ctx.createLinearGradient(x, y, x, y + h);
  woodGrad.addColorStop(0.0, '#53321d');
  woodGrad.addColorStop(0.4, '#3d2414');
  woodGrad.addColorStop(1.0, '#22130a');
  ctx.fillStyle = woodGrad;
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 3);
  else ctx.rect(x, y, w, h);
  ctx.fill();

  // Fugi i słoje desek podłogi
  ctx.strokeStyle = '#1a0e07';
  ctx.lineWidth = 1.4;
  const plankW = 32;
  for (let px = x + plankW; px < x + w; px += plankW) {
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px, y + h);
    ctx.stroke();
  }

  // Kute okucia stalowe na krawędziach
  ctx.fillStyle = '#26170d';
  ctx.fillRect(x, y, 6, h);
  ctx.fillRect(x + w - 6, y, 6, h);

  // Poduszka mchu na szczycie platformy
  drawMossCushion(ctx, x, y, w, 5, time);

  // Zwisające wąsy pnączy i korzeni powietrznych pod spodem
  for (let v = 0; v < 4; v++) {
    const vx = x + 30 + v * (w / 4);
    const vLen = 16 + ((v * 19) % 28);
    const sway = Math.sin(time * 1.6 + v) * 4;
    ctx.strokeStyle = '#1e3814';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(vx, y + h);
    ctx.quadraticCurveTo(vx + sway * 0.5, y + h + vLen * 0.5, vx + sway, y + h + vLen);
    ctx.stroke();
  }

  // Balustrada strażnicy dla gniazda snajperskiego
  if (isSniper) {
    ctx.strokeStyle = '#382213';
    ctx.lineWidth = 2.4;
    // Słupki balustrady
    for (let postX = x + 10; postX <= x + w - 10; postX += 45) {
      ctx.beginPath();
      ctx.moveTo(postX, y);
      ctx.lineTo(postX, y - 26);
      ctx.stroke();
    }
    // Pochwyt poręczy
    ctx.beginPath();
    ctx.moveTo(x + 8, y - 26);
    ctx.lineTo(x + w - 8, y - 26);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 4. INTERAKTYWNE ZNISZCZALNE MOSTY LINOWE (SOLDAT-STYLE SUSPENSION BRIDGES)
 */
export function drawArena2Bridges(ctx, time) {
  ctx.save();
  ctx.shadowBlur = 0;

  for (let bIdx = 0; bIdx < ARENA_2_BRIDGES.length; bIdx++) {
    const bridge = ARENA_2_BRIDGES[bIdx];
    const { anchorLeft, anchorRight, planks, isSnapped, snapIndex, leftSwingAngle, rightSwingAngle } = bridge;
    const spacing = bridge.w / planks.length;

    // 1. Słupy cumownicze / kotwiące na obu krańcach
    drawBridgeMooringPost(ctx, anchorLeft.x, anchorLeft.y);
    drawBridgeMooringPost(ctx, anchorRight.x, anchorRight.y);

    if (!isSnapped) {
      // -------------------------------------------------------------------
      // MOST CAŁY: GŁÓWNA LINA NOŚNA, PORĘCZE I ELEMENTY WIĄŻĄCE
      // -------------------------------------------------------------------
      const steps = 24;
      const dx = bridge.w / steps;

      // Górna poręcz linowa (Handrail) na wysokości y - 16
      ctx.strokeStyle = '#4a2c13';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(anchorLeft.x, anchorLeft.y - 16);
      for (let i = 1; i <= steps; i++) {
        const px = anchorLeft.x + i * dx;
        const sag = Math.sin((i / steps) * Math.PI) * 8;
        ctx.lineTo(px, anchorLeft.y - 16 + sag);
      }
      ctx.stroke();

      // Pionowe więzy linowe (Vertical rope ties) łączące poręcz z kładką
      ctx.strokeStyle = '#38200e';
      ctx.lineWidth = 1.0;
      for (let i = 1; i < planks.length; i += 2) {
        const pl = planks[i];
        const relProgress = (i + 0.5) / planks.length;
        const sagTop = Math.sin(relProgress * Math.PI) * 8;
        ctx.beginPath();
        ctx.moveTo(pl.x + pl.w / 2, anchorLeft.y - 16 + sagTop);
        ctx.lineTo(pl.x + pl.w / 2, pl.y + 4);
        ctx.stroke();
      }

      // Główna dolna lina nośna (Catenary foot rope) pod deskami
      ctx.strokeStyle = '#2d1808';
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(anchorLeft.x, anchorLeft.y + 4);
      for (let i = 1; i <= steps; i++) {
        const px = anchorLeft.x + i * dx;
        const sag = Math.sin((i / steps) * Math.PI) * 10;
        ctx.lineTo(px, anchorLeft.y + 4 + sag);
      }
      ctx.stroke();

      // Jaśniejszy rdzeń liny
      ctx.strokeStyle = '#613d22';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(anchorLeft.x, anchorLeft.y + 4);
      for (let i = 1; i <= steps; i++) {
        const px = anchorLeft.x + i * dx;
        const sag = Math.sin((i / steps) * Math.PI) * 10;
        ctx.lineTo(px, anchorLeft.y + 4 + sag);
      }
      ctx.stroke();

      // Rysowanie desek mostu całego
      for (let i = 0; i < planks.length; i++) {
        const pl = planks[i];
        if (!pl.destroyed && !pl.isFalling) {
          drawBridgePlank(ctx, pl.x, pl.y, pl.w, pl.h, 0, pl.hp, pl.maxHp, pl.seed);
        }
      }
    } else {
      // -------------------------------------------------------------------
      // MOST ZERWANY: DWIE ZWISAJĄCE I WAHADŁOWO PORUSZAJĄCE SIĘ POŁÓWKI
      // -------------------------------------------------------------------
      // A. Lewa połówka (wokół anchorLeft)
      const leftCount = snapIndex + 1;
      const leftLen = leftCount * spacing;
      const leftTipX = anchorLeft.x + Math.sin(leftSwingAngle) * leftLen;
      const leftTipY = anchorLeft.y + Math.cos(leftSwingAngle) * leftLen;

      // Lina nośna lewej połówki
      ctx.strokeStyle = '#2d1808';
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(anchorLeft.x, anchorLeft.y);
      ctx.lineTo(leftTipX, leftTipY);
      ctx.stroke();

      ctx.strokeStyle = '#613d22';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(anchorLeft.x, anchorLeft.y);
      ctx.lineTo(leftTipX, leftTipY);
      ctx.stroke();

      // Strzępki zerwanej liny (Frayed severed fibers) na lewym końcu
      drawFrayedRopeEnd(ctx, leftTipX, leftTipY, leftSwingAngle);

      // Deski lewej połówki
      for (let i = 0; i <= snapIndex; i++) {
        const pl = planks[i];
        if (!pl.destroyed && !pl.isFalling) {
          drawBridgePlank(ctx, pl.x, pl.y, pl.w, pl.h, pl.rot, pl.hp, pl.maxHp, pl.seed);
        }
      }

      // B. Prawa połówka (wokół anchorRight)
      const rightCount = planks.length - (snapIndex + 1);
      const rightLen = rightCount * spacing;
      const rightTipX = anchorRight.x - Math.sin(rightSwingAngle) * rightLen;
      const rightTipY = anchorRight.y + Math.cos(rightSwingAngle) * rightLen;

      // Lina nośna prawej połówki
      ctx.strokeStyle = '#2d1808';
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(anchorRight.x, anchorRight.y);
      ctx.lineTo(rightTipX, rightTipY);
      ctx.stroke();

      ctx.strokeStyle = '#613d22';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(anchorRight.x, anchorRight.y);
      ctx.lineTo(rightTipX, rightTipY);
      ctx.stroke();

      // Strzępki zerwanej liny na prawym końcu
      drawFrayedRopeEnd(ctx, rightTipX, rightTipY, -rightSwingAngle);

      // Deski prawej połówki
      for (let i = snapIndex + 1; i < planks.length; i++) {
        const pl = planks[i];
        if (!pl.destroyed && !pl.isFalling) {
          drawBridgePlank(ctx, pl.x, pl.y, pl.w, pl.h, pl.rot, pl.hp, pl.maxHp, pl.seed);
        }
      }
    }

    // ---------------------------------------------------------------------
    // SPADAJĄCE ODRZUCONE DESKI (ODŁAMKI W LOCIE DO WODY / OTCHŁANI)
    // ---------------------------------------------------------------------
    for (let i = 0; i < planks.length; i++) {
      const pl = planks[i];
      if (pl.isFalling && pl.y < 2200) {
        drawBridgePlank(ctx, pl.x, pl.y, pl.w, pl.h, pl.rot, 0, pl.maxHp, pl.seed, true);
      }
    }
  }

  // -----------------------------------------------------------------------
  // CZĄSTKI DRZAZG DREWNIANYCH (WOOD SPLINTERS)
  // -----------------------------------------------------------------------
  for (let i = 0; i < ARENA_2_WOOD_SPLINTERS.length; i++) {
    const sp = ARENA_2_WOOD_SPLINTERS[i];
    const alpha = Math.max(0, Math.min(1, sp.life / 20));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(sp.x, sp.y);
    ctx.rotate(sp.rot);
    ctx.fillStyle = sp.color;
    ctx.fillRect(-sp.size / 2, -sp.size / 4, sp.size, sp.size / 2);
    ctx.restore();
  }

  ctx.restore();
}

function drawBridgeMooringPost(ctx, x, y) {
  // Słup cumowniczy z ciemnego drewna ze splotami lin i mchem
  ctx.save();
  ctx.fillStyle = '#22150a';
  ctx.fillRect(x - 6, y - 24, 12, 34);

  ctx.fillStyle = '#3a2313';
  ctx.fillRect(x - 5, y - 23, 10, 32);

  // Żelazne klamry wzmacniające
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x - 6, y - 22, 12, 3);
  ctx.fillRect(x - 6, y + 4, 12, 3);

  // Oplot linowy
  ctx.fillStyle = '#784d28';
  ctx.fillRect(x - 7, y - 10, 14, 5);
  ctx.fillStyle = '#52341b';
  ctx.fillRect(x - 7, y - 5, 14, 4);

  // Kępka mchu na słupku
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(x - 4, y - 25, 8, 2);
  ctx.restore();
}

function drawBridgePlank(ctx, x, y, w, h, rot, hp, maxHp, seed = 0, isDebris = false) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (rot !== 0) ctx.rotate(rot);

  // Cień deski
  ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
  ctx.fillRect(-w / 2 - 1, -h / 2 + 2, w + 2, h);

  // Korpus drewnianej belki
  ctx.fillStyle = isDebris ? '#4a2c13' : '#613d22';
  ctx.fillRect(-w / 2, -h / 2, w, h);

  // Obrys i słoje drewna
  ctx.strokeStyle = '#27170c';
  ctx.lineWidth = 1.0;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  // Rozjaśnienie górnej krawędzi
  ctx.fillStyle = '#784d28';
  ctx.fillRect(-w / 2 + 1, -h / 2 + 1, w - 2, 2);

  // Dwa kołki montażowe na końcach deski
  ctx.fillStyle = '#1f1309';
  ctx.fillRect(-w / 2 + 2, -h / 2 + 3, 2, 2);
  ctx.fillRect(w / 2 - 4, -h / 2 + 3, 2, 2);

  // Kępka mchu (na co trzeciej desce)
  if (seed % 3 === 0 && !isDebris) {
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-w / 2 + 3, -h / 2 - 1, 6, 2);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(-w / 2 + 5, -h / 2, 3, 1);
  }

  // Efekt uszkodzenia (pęknięcia przy niskim HP)
  if (hp > 0 && hp < maxHp) {
    const crackRatio = 1 - hp / maxHp;
    ctx.strokeStyle = '#180d05';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-w / 4, -h / 2);
    ctx.lineTo(0, h / 4 * crackRatio);
    ctx.lineTo(w / 4, h / 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawFrayedRopeEnd(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.strokeStyle = '#784d28';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  // Strzępki wystające z zerwanej liny
  ctx.moveTo(0, 0);
  ctx.lineTo(-4, 7);
  ctx.moveTo(0, 0);
  ctx.lineTo(1, 9);
  ctx.moveTo(0, 0);
  ctx.lineTo(4, 6);
  ctx.stroke();

  ctx.restore();
}

function drawHangingRopeBridge(ctx, x, y, w, h, time) {
  // Alias wstecznej kompatybilności dla renderera poziomu
  drawArena2Bridges(ctx, time);
}

/**
 * 5. CENTRALNE SANKTUARIUM SŁOŃCA (3 POZIOMY, X: 1360 - 2240)
 */
function drawSunSanctuary(ctx, time, bottomY) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';

  const baseStartX = 1360;
  const baseW = 880;
  const baseEndX = baseStartX + baseW;

  // -----------------------------------------------------------------------
  // POZIOM 1: MONOLITYCZNY COKÓŁ BAZOWY (X: 1360-2240, Y: 990 DO BOTTOM_Y)
  // -----------------------------------------------------------------------
  // 100% KRYJĄCY PODKŁAD COKOŁU (ZERO PRZEŚWITÓW TŁA)
  ctx.fillStyle = '#020605';
  ctx.fillRect(baseStartX - 8, 990, baseW + 16, (bottomY - 990) + 200);

  const pedestalGrad = ctx.createLinearGradient(0, 990, 0, bottomY);
  pedestalGrad.addColorStop(0.00, '#242f28');
  pedestalGrad.addColorStop(0.20, '#1a231e');
  pedestalGrad.addColorStop(0.50, '#121814');
  pedestalGrad.addColorStop(0.80, '#0a0e0c');
  pedestalGrad.addColorStop(1.00, '#040705');

  ctx.fillStyle = pedestalGrad;
  ctx.fillRect(baseStartX - 4, 990, baseW + 8, (bottomY - 990) + 200);

  // Kamienne ciosy murarskie i fugi schodzące w dół aż do BOTTOM_Y
  ctx.strokeStyle = '#0d1310';
  ctx.lineWidth = 1.8;
  const blockW = 88;
  const blockH = 34;
  for (let by = 990; by < bottomY; by += blockH) {
    ctx.beginPath();
    ctx.moveTo(baseStartX, by);
    ctx.lineTo(baseEndX, by);
    ctx.stroke();

    const rowOffset = (((by - 990) / blockH) % 2) * (blockW * 0.5);
    for (let bx = baseStartX + rowOffset; bx < baseEndX; bx += blockW) {
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx, Math.min(bottomY, by + blockH));
      ctx.stroke();
    }
  }

  // Zacieki wilgoci i ciemne glony przy lustrze wody (Y: 1210)
  ctx.fillStyle = 'rgba(12, 40, 26, 0.60)';
  ctx.fillRect(baseStartX - 4, 1205, baseW + 8, 30);

  // Geometryczny rzeźbiony fryz meandrowy na czole cokołu (styl Majów)
  ctx.strokeStyle = 'rgba(180, 150, 100, 0.25)';
  ctx.lineWidth = 1.4;
  for (let fx = baseStartX + 20; fx < baseEndX - 20; fx += 44) {
    ctx.strokeRect(fx, 998, 24, 24);
    ctx.strokeRect(fx + 6, 1004, 12, 12);
  }

  // Poduszka mchu na koronie cokołu (Y = 990)
  drawMossCushion(ctx, baseStartX, 990, baseW, 8, time);

  // -----------------------------------------------------------------------
  // POZIOM 2: KŁADKA PIĘTRA (X: 1480-2120, Y: 810, W: 640, H: 24)
  // -----------------------------------------------------------------------
  // Dwa potężne monolityczne filary podtrzymujące kładkę (od Y = 810 do Y = 990)
  const pillarXList = [1540, 2020];
  for (let p = 0; p < pillarXList.length; p++) {
    const px = pillarXList[p];
    const pilGrad = ctx.createLinearGradient(px, 810, px + 80, 810);
    pilGrad.addColorStop(0.0, '#382f24');
    pilGrad.addColorStop(0.5, '#453c30');
    pilGrad.addColorStop(1.0, '#262017');
    ctx.fillStyle = pilGrad;
    ctx.fillRect(px, 810, 80, 180);

    ctx.strokeStyle = '#17140f';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(px, 810, 80, 180);

    // Świecące runy słoneczne wyryte w filarach (tryb 'screen')
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const runeGlow = 0.55 + 0.35 * Math.sin(time * 2.5 + p);
    ctx.strokeStyle = `rgba(253, 224, 71, ${runeGlow})`;
    ctx.lineWidth = 1.8;
    for (let ry = 840; ry < 970; ry += 45) {
      ctx.beginPath();
      ctx.moveTo(px + 28, ry);
      ctx.lineTo(px + 40, ry - 10);
      ctx.lineTo(px + 52, ry);
      ctx.moveTo(px + 32, ry - 5);
      ctx.lineTo(px + 48, ry - 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Korpus kładki piętra (Y = 810)
  const catwalkX = 1480;
  const catwalkW = 640;
  const catwalkH = 24;
  const catwalkGrad = ctx.createLinearGradient(catwalkX, 810, catwalkX, 834);
  catwalkGrad.addColorStop(0.0, '#4a4133');
  catwalkGrad.addColorStop(0.5, '#352e23');
  catwalkGrad.addColorStop(1.0, '#1d1913');
  ctx.fillStyle = catwalkGrad;
  if (ctx.roundRect) ctx.roundRect(catwalkX, 810, catwalkW, catwalkH, 4);
  else ctx.rect(catwalkX, 810, catwalkW, catwalkH);
  ctx.fill();

  ctx.strokeStyle = '#18140e';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  drawMossCushion(ctx, catwalkX, 810, catwalkW, 6, time);

  // -----------------------------------------------------------------------
  // POZIOM 3: SZCZYTOWY OŁTARZ (X: 1660-1940, Y: 650, W: 280, H: 24)
  // Czysta platforma do walki - dysk słońca i przeszkadzające elementy usunięte
  // -----------------------------------------------------------------------
  const altarX = 1660;
  const altarW = 280;
  const altarH = 24;
  const altarGrad = ctx.createLinearGradient(altarX, 650, altarX, 674);
  altarGrad.addColorStop(0.0, '#594e3c');
  altarGrad.addColorStop(0.5, '#3e3629');
  altarGrad.addColorStop(1.0, '#231e16');
  ctx.fillStyle = altarGrad;
  if (ctx.roundRect) ctx.roundRect(altarX, 650, altarW, altarH, 4);
  else ctx.rect(altarX, 650, altarW, altarH);
  ctx.fill();

  ctx.strokeStyle = '#18140e';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  drawMossCushion(ctx, altarX, 650, altarW, 6, time);

  ctx.restore();
}

/** Rysuje kamienną misę ofiarną z animowanym żywym ogniem */
function drawStoneFireBrazier(ctx, cx, baseY, time) {
  ctx.save();
  // Kamienna czara
  ctx.fillStyle = '#2b2319';
  ctx.beginPath();
  ctx.moveTo(cx - 16, baseY);
  ctx.lineTo(cx + 16, baseY);
  ctx.lineTo(cx + 11, baseY - 16);
  ctx.lineTo(cx - 11, baseY - 16);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#18130d';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Żywe wielowarstwowe płomienie w trybie 'screen'
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const flameH = 26 + Math.sin(time * 9.0) * 6;
  const flameW = 12 + Math.cos(time * 8.0) * 3;
  const flameGrad = ctx.createRadialGradient(cx, baseY - 14, 2, cx, baseY - 18, flameH);
  flameGrad.addColorStop(0.0, '#ffffff');
  flameGrad.addColorStop(0.2, '#fef08a');
  flameGrad.addColorStop(0.5, '#f97316');
  flameGrad.addColorStop(0.8, '#dc2626');
  flameGrad.addColorStop(1.0, 'rgba(0,0,0,0)');

  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.moveTo(cx - flameW, baseY - 16);
  ctx.quadraticCurveTo(cx - flameW * 0.5, baseY - 16 - flameH * 0.6, cx, baseY - 16 - flameH);
  ctx.quadraticCurveTo(cx + flameW * 0.5, baseY - 16 - flameH * 0.6, cx + flameW, baseY - 16);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * 6. DOLNE WYSEPKI TAKTYCZNE NAD WODĄ (Y: 1150)
 */
function drawTacticalIsland(ctx, x, y, w, h, time, seed = 1) {
  ctx.save();
  ctx.shadowBlur = 0;

  // Głaz schodzący od Y = 1150 w głąb wody (bez wiszących czarnych szpiców)
  const islandGrad = ctx.createLinearGradient(x, y, x, y + h + 60);
  islandGrad.addColorStop(0.00, '#423c31');
  islandGrad.addColorStop(0.30, '#332e25');
  islandGrad.addColorStop(0.60, '#1e241c');
  islandGrad.addColorStop(1.00, '#06130d');

  ctx.fillStyle = islandGrad;
  ctx.beginPath();
  ctx.moveTo(x + 12, y);
  ctx.lineTo(x + w - 12, y);
  ctx.quadraticCurveTo(x + w + 8, y + h * 0.5, x + w - 6, y + h + 20);
  ctx.quadraticCurveTo(x + w * 0.5, y + h + 42, x + 6, y + h + 20);
  ctx.quadraticCurveTo(x - 8, y + h * 0.5, x + 12, y);
  ctx.closePath();
  ctx.fill();

  // Ciemny pas glonów i wilgoci na poziomie wody (Y = 1210)
  ctx.fillStyle = 'rgba(6, 40, 24, 0.70)';
  ctx.fillRect(x - 4, 1206, w + 8, 16);

  // Poduszka mchu na szczycie wysepki (Y = 1150)
  drawMossCushion(ctx, x + 6, y, w - 12, 6, time);

  // Dzikie orchidee na wysepce
  drawWildOrchids(ctx, x + w * 0.3, y - 2);
  if (seed === 2) {
    drawWildOrchids(ctx, x + w * 0.7, y - 2);
  }

  ctx.restore();
}

/**
 * 7. ATMOSFERYCZNA OTCHŁAŃ CHMUR I CZĄSTECZKI (OD CLOUD_ZONE_Y DO BOTTOM_Y)
 */
function drawAbyssCloudZone(ctx, time, bottomY) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';

  const seaTopY = 1510;
  const cloudMinX = -200;
  const cloudMaxX = 3800;

  // 100% nieprzezroczyste dno otchłani (od 1550 do BOTTOM_Y + 200)
  ctx.fillStyle = '#010504';
  ctx.fillRect(cloudMinX, 1550, cloudMaxX - cloudMinX, (bottomY - 1550) + 200);

  // Podstawa otchłani chmur schodząca do 1550 - 100% kryjący lity gradient
  const baseGrad = ctx.createLinearGradient(0, seaTopY, 0, 1550);
  baseGrad.addColorStop(0.00, '#04120c');
  baseGrad.addColorStop(0.40, '#020a07');
  baseGrad.addColorStop(0.85, '#010504');
  baseGrad.addColorStop(1.00, '#010504');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(cloudMinX, seaTopY, cloudMaxX - cloudMinX, 1550 - seaTopY);

  // Kłębiące się proceduralne kopuły mgły
  for (let b = 0; b < _cloudPuffs.length; b++) {
    const cb = _cloudPuffs[b];
    ctx.fillStyle = cb.col;
    for (let cx = cloudMinX - 100; cx < cloudMaxX + 200; cx += cb.step) {
      const puffX = cx + Math.sin(time * 0.8 + cx) * 20;
      const puffY = cb.baseY + Math.sin(time * 1.2 + cx * 0.01) * cb.amp;
      ctx.beginPath();
      ctx.arc(puffX, puffY, cb.rBase, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 8. PŁYWAJĄCY W POWIETRZU ZŁOTY PYŁEK I ŚWIETLIKI DŻUNGLI
 */
function drawAtmosphericFireflies(ctx, time) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < _fireflies.length; i++) {
    const ff = _fireflies[i];
    const fx = ff.baseX + Math.sin(time * 1.1 + ff.phase) * 25;
    const fy = ff.baseY + Math.cos(time * 1.3 + ff.phase) * 18;
    const pulse = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time * ff.pulseSpeed + ff.phase));

    ctx.fillStyle = ff.isGolden ? `rgba(254, 240, 138, ${pulse})` : `rgba(110, 231, 183, ${pulse})`;
    ctx.beginPath();
    ctx.arc(fx, fy, ff.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Rysuje lilie wodne i liście lotosu na lustrze wody Y = 1210 */
function drawWaterLotuses(ctx, time) {
  ctx.save();
  for (let l = 0; l < _lotusBeds.length; l++) {
    const lb = _lotusBeds[l];
    const surfY = getWaterSurfaceY(lb.x, time);

    // Cień liścia
    ctx.fillStyle = 'rgba(3, 18, 16, 0.55)';
    ctx.beginPath();
    ctx.arc(lb.x + 2, surfY + 3, lb.r, 0, Math.PI * 2);
    ctx.fill();

    // Szmaragdowy liść lotosu z wcięciem
    ctx.fillStyle = '#1e5223';
    ctx.beginPath();
    ctx.arc(lb.x, surfY, lb.r, 0.35, Math.PI * 2 - 0.35);
    ctx.lineTo(lb.x, surfY);
    ctx.closePath();
    ctx.fill();

    // Kwitnący różowo-złoty kwiat lotosu
    if (lb.flower) {
      ctx.fillStyle = '#f472b6';
      for (let p = 0; p < 6; p++) {
        const ang = (p / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(lb.x + Math.cos(ang) * 4.5, surfY - 2 + Math.sin(ang) * 2.5, 4.0, 2.2, ang, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(lb.x, surfY - 2, 2.0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// =========================================================================
// 6. GŁÓWNA PROCEDURA RENDEROWANIA GEOMETRII (DRAWARENA2GEOMETRY)
// Wylicza dynamiczną krawędź dolną BOTTOM_Y wypełniającą ekran bez limitu
// =========================================================================
export function drawArena2Geometry(ctx, camera) {
  if (!ctx) return;
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';
  ctx.shadowBlur = 0;
  const time = performance.now() * 0.001;

  // DYNAMICZNE WYLICZENIE DOLNEJ KRAWĘDZI WIDOKU KAMERY Z BEZPIECZNYM BUFOREM
  const canvasH = (ctx.canvas && ctx.canvas.height) || (typeof window !== 'undefined' ? window.innerHeight : 1080);
  const camZoom = (camera && camera.zoom) ? camera.zoom : 1;
  const camY = (camera && typeof camera.y === 'number') ? camera.y : 0;
  const viewBottomY = camY + (canvasH / camZoom) + 400;
  const BOTTOM_Y = Math.max(2200, viewBottomY);

  // 0. ABSOLUTNY, W 100% KRYJĄCY MONOLITYCZNY PODKŁAD CAŁEJ DOLNEJ CZĘŚCI ARENY (ZERO PRZEŚWITÓW TŁA)
  ctx.fillStyle = '#010504';
  // Monolityczna podstawa od linii wody (Y = 1190) w dół na całej szerokości areny (-200 do 3800)
  ctx.fillRect(-200, 1190, 4000, (BOTTOM_Y - 1190) + 200);

  // Masywne bryły klifów skalnych i cokołu ołtarza od Y = 990 w dół
  ctx.fillRect(-200, 990, 1090, (BOTTOM_Y - 990) + 200);   // Lewy klif skalny (X: -200 do 890)
  ctx.fillRect(1350, 990, 900, (BOTTOM_Y - 990) + 200);    // Centralny cokół ołtarza (X: 1350 do 2250)
  ctx.fillRect(2710, 990, 1090, (BOTTOM_Y - 990) + 200);   // Prawy klif skalny (X: 2710 do 3800)

  // 1. Atmosferyczna strefa otchłani chmur na dnie (Y = 1510 do BOTTOM_Y)
  drawAbyssCloudZone(ctx, time, BOTTOM_Y);

  // 2. Dwa baseny wodne sięgające dna świata (lewy: 880-1360, prawy: 2240-2720 do BOTTOM_Y)
  drawDeepWaterBasin(ctx, 880, 1360, time, BOTTOM_Y);
  drawDeepWaterBasin(ctx, 2240, 2720, time, BOTTOM_Y);

  // 3. Lilie wodne i liście lotosu na lustrze wody (Y = 1210)
  drawWaterLotuses(ctx, time);

  // 4. Dolne wysepki taktyczne nad wodą (Y: 1150)
  drawTacticalIsland(ctx, 1040, 1150, 180, 20, time, 1);
  drawTacticalIsland(ctx, 2380, 1150, 180, 20, time, 2);

  // 5. Lewy Bastion Skalny (Lita bryła X: 0-880, Y: 990 do BOTTOM_Y)
  drawRockBastion(ctx, 0, 990, 880, 1010, true, time, BOTTOM_Y);
  // Półki nadrzewne i gniazdo snajperskie lewego bastionu (obniżone)
  drawHardwoodPlatform(ctx, 120, 790, 320, 22, false, time);
  drawHardwoodPlatform(ctx, 540, 630, 240, 20, true, time);

  // 6. Prawy Bastion Skalny (Lita bryła X: 2720-3600, Y: 990 do BOTTOM_Y)
  drawRockBastion(ctx, 2720, 990, 880, 1010, false, time, BOTTOM_Y);
  // Półki nadrzewne i gniazdo snajperskie prawego bastionu (obniżone)
  drawHardwoodPlatform(ctx, 3160, 790, 320, 22, false, time);
  drawHardwoodPlatform(ctx, 2820, 630, 240, 20, true, time);

  // 7. Centralne Sanktuarium Słońca (3 poziomy, X: 1360-2240, Y: 990 do BOTTOM_Y)
  drawSunSanctuary(ctx, time, BOTTOM_Y);

  // 8. Wiszące Mosty Linowe (X: 880-1360 oraz 2240-2720 na poziomie Y = 990)
  drawArena2Bridges(ctx, time);

  // 9. Pływający w powietrzu złoty pyłek i świetliki dżungli
  drawAtmosphericFireflies(ctx, time);

  ctx.restore();
}

// Re-eksporty dla kompatybilności z rendererem i orkiestratorem
export function renderPandoraTerrain(ctx, camera) {
  drawArena2Geometry(ctx, camera);
}

export function drawArena2Foreground(ctx, camera) {
  drawArena2Geometry(ctx, camera);
}

export function drawArena2Background(ctx, camera) {
  drawPandoraBackground(ctx, camera);
}

export function updateArena2Bridges(dt, players) {
  for (let bIdx = 0; bIdx < ARENA_2_BRIDGES.length; bIdx++) {
    const bridge = ARENA_2_BRIDGES[bIdx];

    // Symuluj ruch wahadłowy z tłumieniem
    if (bridge.isSnapped) {
      bridge.leftSwingVel += -Math.sin(bridge.leftSwingAngle) * 0.08;
      bridge.leftSwingVel *= 0.985;
      bridge.leftSwingAngle += bridge.leftSwingVel;

      bridge.rightSwingVel += -Math.sin(bridge.rightSwingAngle) * 0.08;
      bridge.rightSwingVel *= 0.985;
      bridge.rightSwingAngle += bridge.rightSwingVel;
    }

    const spacing = bridge.w / bridge.planks.length;
    for (let i = 0; i < bridge.planks.length; i++) {
      const plank = bridge.planks[i];

      if (plank.isFalling) {
        plank.vy += 0.38;
        plank.vx *= 0.995;
        plank.x += plank.vx;
        plank.y += plank.vy;
        plank.rot += plank.rotVel;
        plank.rotVel *= 0.992;
      } else if (bridge.isSnapped) {
        if (i <= bridge.snapIndex) {
          const dist = (i + 0.5) * spacing;
          plank.x = bridge.anchorLeft.x + Math.sin(bridge.leftSwingAngle) * dist - plank.w / 2;
          plank.y = bridge.anchorLeft.y + Math.cos(bridge.leftSwingAngle) * dist - plank.h / 2;
          plank.rot = bridge.leftSwingAngle;
        } else {
          const dist = (bridge.planks.length - i - 0.5) * spacing;
          plank.x = bridge.anchorRight.x - Math.sin(bridge.rightSwingAngle) * dist - plank.w / 2;
          plank.y = bridge.anchorRight.y + Math.cos(bridge.rightSwingAngle) * dist - plank.h / 2;
          plank.rot = -bridge.rightSwingAngle;
        }
      } else {
        const relProgress = (i + 0.5) / bridge.planks.length;
        const sag = Math.sin(relProgress * Math.PI) * 10;
        plank.x = bridge.anchorLeft.x + i * spacing + (spacing - plank.w) / 2;
        plank.y = bridge.anchorLeft.y + sag;
        plank.rot = 0;
      }
    }
  }

  // Cząsteczki drzazg drewnianych
  for (let i = ARENA_2_WOOD_SPLINTERS.length - 1; i >= 0; i--) {
    const sp = ARENA_2_WOOD_SPLINTERS[i];
    sp.life--;
    if (sp.life <= 0) {
      ARENA_2_WOOD_SPLINTERS.splice(i, 1);
      continue;
    }
    sp.vy += 0.28;
    sp.x += sp.vx;
    sp.y += sp.vy;
    sp.rot += sp.vRot;
  }

  // Weryfikacja podłoża graczy/botów: natychmiastowe zrzucenie w przepaść przy uszkodzeniu podłoża
  if (Array.isArray(players)) {
    for (const p of players) {
      if (!p) continue;
      if (p.currentPlatform && p.currentPlatform.isBridgePlank) {
        const br = ARENA_2_BRIDGES.find(b => b.id === p.currentPlatform.bridgeId);
        if (p.currentPlatform.destroyed || p.currentPlatform.isFalling || (br && br.isSnapped)) {
          p.currentPlatform = null;
          p.onGround = false;
          p.isJumping = true;
        }
      }
    }
  }
}

export function updateBridges(dt, players) {
  updateArena2Bridges(dt, players);
}

export function updateArena2(dt, players) {
  updateArena2Bridges(dt, players);
  if (Array.isArray(players)) {
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (p) applyPandoraUpdraft(p);
    }
  }
}

export function onArena2BulletHit(bullet) {
  if (!bullet || !bullet.alive) return false;

  const bx = bullet.x;
  const by = bullet.y;
  const bx0 = (bullet.prevX !== undefined) ? bullet.prevX : (bx - (bullet.vx || 0));
  const by0 = (bullet.prevY !== undefined) ? bullet.prevY : (by - (bullet.vy || 0));
  const bDamage = bullet.damage || 25;

  for (let bIdx = 0; bIdx < ARENA_2_BRIDGES.length; bIdx++) {
    const bridge = ARENA_2_BRIDGES[bIdx];

    for (let pIdx = 0; pIdx < bridge.planks.length; pIdx++) {
      const plank = bridge.planks[pIdx];
      if (plank.destroyed || plank.isFalling) continue;

      if (rayIntersectsAABB(bx0, by0, bx, by, plank.x - 2, plank.y - 4, plank.x + plank.w + 2, plank.y + plank.h + 4)) {
        plank.hp -= bDamage;
        const splCount = 3 + Math.floor(Math.random() * 3); // 3–5 drobnych cząstek drzazg
        spawnWoodSplinters(bx, by, (bullet.vx || 0) * 0.15, -1.5, splCount);

        if (plank.hp <= 0) {
          plank.destroyed = true;
          plank.isFalling = true;
          plank.vx = (bullet.vx || 0) * 0.1;
          plank.vy = 1 + Math.random() * 2; // vy = 1..3
          plank.rotVel = (Math.random() - 0.5) * 0.35; // rotVel = random
          checkBridgeSnapConditions(bridge);
        }
        return true;
      }
    }
  }

  return false;
}

export function onArena2Explosion(expX, expY, radius = 140, context = null) {
  let hitAny = false;
  const blastRad = radius || 140;

  for (let bIdx = 0; bIdx < ARENA_2_BRIDGES.length; bIdx++) {
    const bridge = ARENA_2_BRIDGES[bIdx];
    let bridgeHit = false;
    let closestPlankIdx = -1;
    let minPlankDist = Infinity;

    for (let pIdx = 0; pIdx < bridge.planks.length; pIdx++) {
      const plank = bridge.planks[pIdx];
      const cx = plank.x + plank.w / 2;
      const cy = plank.y + plank.h / 2;
      const dist = Math.hypot(cx - expX, cy - expY);

      if (dist < minPlankDist) {
        minPlankDist = dist;
        closestPlankIdx = pIdx;
      }

      if (dist <= blastRad) {
        bridgeHit = true;
        hitAny = true;
        if (!plank.destroyed) {
          plank.destroyed = true;
          plank.isFalling = true;
          const dirX = dist > 0.001 ? (cx - expX) / dist : (Math.random() - 0.5);
          plank.vx = dirX * 6 + (Math.random() - 0.5) * 3;
          plank.vy = -2 - Math.random() * 4;
          plank.rotVel = (Math.random() - 0.5) * 0.4;
          spawnWoodSplinters(cx, cy, plank.vx, plank.vy, 4);
        }
      }
    }

    // Wybuch w promieniu 140 px od mostu natychmiast wywołuje pęknięcie liny nośnej w punkcie wybuchu
    if (minPlankDist <= blastRad || bridgeHit) {
      hitAny = true;
      if (!bridge.isSnapped) {
        snapBridge(bridge, closestPlankIdx !== -1 ? closestPlankIdx : Math.floor(bridge.planks.length / 2));
        const dirX = expX < (bridge.anchorLeft.x + bridge.w / 2) ? 1 : -1;
        bridge.leftSwingVel += dirX * 0.05;
        bridge.rightSwingVel -= dirX * 0.05;
      }
    }
  }

  return hitAny;
}

export function onArena2KickHit(player, kickBox) {
  if (!kickBox) return false;
  let hitAny = false;
  for (let bIdx = 0; bIdx < ARENA_2_BRIDGES.length; bIdx++) {
    const bridge = ARENA_2_BRIDGES[bIdx];
    for (let pIdx = 0; pIdx < bridge.planks.length; pIdx++) {
      const plank = bridge.planks[pIdx];
      if (plank.destroyed || plank.isFalling) continue;
      const overlaps = (
        kickBox.x < plank.x + plank.w &&
        kickBox.x + kickBox.w > plank.x &&
        kickBox.y < plank.y + plank.h &&
        kickBox.y + kickBox.h > plank.y
      );
      if (overlaps) {
        plank.hp -= 20;
        spawnWoodSplinters(plank.x + plank.w / 2, plank.y + plank.h / 2, (player?.facing || 1) * 3, -1.5, 4);
        if (plank.hp <= 0) {
          plank.destroyed = true;
          plank.isFalling = true;
          plank.vx = (player?.facing || 1) * 2.5;
          plank.vy = 2.0;
          plank.rotVel = (player?.facing || 1) * 0.2;
          checkBridgeSnapConditions(bridge);
        }
        hitAny = true;
      }
    }
  }
  return hitAny;
}

// =========================================================================
// 7. KONTRAKT WTYCZKI ARENY 2 (PLUGIN DEFINITION)
// =========================================================================
const arena2 = {
  id: 'arena-2',
  alias: 'ARENA_2_PANDORA',
  name: 'Święta Dżungla (Ancient Sanctuary)',
  width: 3600,
  height: 2000,
  spawns: [
    { x: 420, y: 910 },   // Lewy bastion
    { x: 3180, y: 910 }   // Prawy bastion
  ],
  platforms: ARENA_2_PLATFORMS,
  bridges: ARENA_2_BRIDGES,
  customObjects: [],
  reset() {
    resetArena2Bridges();
  },
  drawBackground(ctx, camera) {
    drawArena2Background(ctx, camera);
  },
  draw(ctx, camera) {
    drawArena2Geometry(ctx, camera);
  },
  update(dt, players) {
    updateArena2(dt, players);
  },
  onBulletHit(bullet) {
    return onArena2BulletHit(bullet);
  },
  onKickHit(player, kickBox) {
    return onArena2KickHit(player, kickBox);
  },
  onExplosion(expX, expY, radius, context) {
    return onArena2Explosion(expX, expY, radius, context);
  }
};

if (typeof window !== 'undefined') {
  window.ARENA_2_BRIDGES = ARENA_2_BRIDGES;
  window.resetArena2Bridges = resetArena2Bridges;
}

export default arena2;
