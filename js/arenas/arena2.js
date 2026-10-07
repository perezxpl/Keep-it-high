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
  // C. WISZĄCE MOSTY LINOWE (X: 880-1360 oraz 2240-2720)
  // -----------------------------------------------------------------------
  {
    id: 'rope_bridge_left',
    name: 'Lewy Wiszący Most Linowy',
    isPlatform: true,
    isDropThrough: true,
    oneWay: true,
    isVineBridge: true,
    x: 880,
    y: 990,
    w: 480,
    h: 18
  },
  {
    id: 'rope_bridge_right',
    name: 'Prawy Wiszący Most Linowy',
    isPlatform: true,
    isDropThrough: true,
    oneWay: true,
    isVineBridge: true,
    x: 2240,
    y: 990,
    w: 480,
    h: 18
  },

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
function drawDeepWaterBasin(ctx, x0, x1, time, bottomY) {
  ctx.save();
  ctx.shadowBlur = 0;
  const width = x1 - x0;
  const steps = 24;
  const dx = width / steps;

  // A. SKALNE KORYTO BASENU - W 100% KRYJĄCY PODKŁAD OD LINII FAL DO BOTTOM_Y (ZERO PRZEŚWITÓW)
  ctx.fillStyle = '#010906';
  ctx.beginPath();
  ctx.moveTo(x0 - 15, getWaterSurfaceY(x0, time) - 4);
  for (let i = 1; i <= steps; i++) {
    const px = x0 + i * dx;
    ctx.lineTo(px, getWaterSurfaceY(px, time) - 4);
  }
  ctx.lineTo(x1 + 15, bottomY + 120);
  ctx.lineTo(x0 - 15, bottomY + 120);
  ctx.closePath();
  ctx.fill();

  const bedGrad = ctx.createLinearGradient(0, 1200, 0, bottomY);
  bedGrad.addColorStop(0.00, '#051811');
  bedGrad.addColorStop(0.35, '#03120c');
  bedGrad.addColorStop(0.70, '#020b08');
  bedGrad.addColorStop(1.00, '#010806');
  ctx.fillStyle = bedGrad;
  ctx.fillRect(x0 - 4, 1200, width + 8, (bottomY - 1200) + 120);

  // B. ZATOPIONE STAROŻYTNE BRUKI I SCHODY NA DNIE (Y: 1450 - BOTTOM_Y)
  ctx.fillStyle = '#062018';
  ctx.fillRect(x0, 1450, width, (bottomY - 1450) + 120);
  ctx.strokeStyle = '#041510';
  ctx.lineWidth = 1.6;
  for (let sx = x0 + 15; sx < x1; sx += 40) {
    ctx.beginPath();
    ctx.moveTo(sx, 1450);
    ctx.lineTo(sx, bottomY);
    ctx.stroke();
  }
  for (let sy = 1470; sy < bottomY; sy += 32) {
    ctx.beginPath();
    ctx.moveTo(x0, sy);
    ctx.lineTo(x1, sy);
    ctx.stroke();
  }

  // C. MASA WODY - W 100% KRYJĄCY GRADIENT PIONOWY (ZERO PRZEŚWITÓW Z TŁA)
  const waterGrad = ctx.createLinearGradient(0, 1200, 0, bottomY);
  waterGrad.addColorStop(0.00, '#0284c7'); // 100% kryjący lśniący błękit/cyjan
  waterGrad.addColorStop(0.18, '#0d9488'); // 100% kryjący nasycony szmaragd
  waterGrad.addColorStop(0.55, '#064e3b'); // 100% kryjąca głęboka zieleń nefrytu
  waterGrad.addColorStop(0.85, '#022c22'); // 100% kryjące głębinowe dno
  waterGrad.addColorStop(1.00, '#01120d'); // 100% kryjąca ciemność otchłani

  ctx.fillStyle = waterGrad;
  ctx.beginPath();
  ctx.moveTo(x0, getWaterSurfaceY(x0, time));
  for (let i = 1; i <= steps; i++) {
    const px = x0 + i * dx;
    ctx.lineTo(px, getWaterSurfaceY(px, time));
  }
  ctx.lineTo(x1, bottomY + 120);
  ctx.lineTo(x0, bottomY + 120);
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
  drawQuayWall(ctx, x0 - 15, x0 + 8, 1210, bottomY);
  drawQuayWall(ctx, x1 - 8, x1 + 15, 1210, bottomY);

  ctx.restore();
}

/** Rysuje kamienne ciosane nabrzeże graniczące z wodą */
function drawQuayWall(ctx, x0, x1, topY, bottomY) {
  ctx.save();
  const w = x1 - x0;
  // 100% solidne nieprzezroczyste krycie
  ctx.fillStyle = '#020605';
  ctx.fillRect(x0 - 2, topY, w + 4, (bottomY - topY) + 120);

  const qGrad = ctx.createLinearGradient(x0, topY, x1, bottomY);
  qGrad.addColorStop(0.00, '#222d26');
  qGrad.addColorStop(0.25, '#19221c');
  qGrad.addColorStop(0.65, '#111713');
  qGrad.addColorStop(1.00, '#040705');
  ctx.fillStyle = qGrad;
  ctx.fillRect(x0, topY, w, (bottomY - topY) + 120);

  // Fugi murarskie
  ctx.strokeStyle = '#0d1310';
  ctx.lineWidth = 1.6;
  for (let sy = topY; sy < bottomY; sy += 28) {
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

  // 100% KRYJĄCY PODKŁAD LITEJ BRYŁY SKALNEJ (ZERO PRZEŚWITÓW TŁA)
  ctx.fillStyle = '#020605';
  ctx.fillRect(x - 4, y, w + 8, (bottomY - y) + 120);

  // A. PIONOWY GRADIENT SKAŁY: CIEMNY SZMARAGD/GRAFIT W #040705 NA DOLE
  const rockGrad = ctx.createLinearGradient(0, y, 0, bottomY);
  rockGrad.addColorStop(0.00, '#1c2822');
  rockGrad.addColorStop(0.20, '#15211b');
  rockGrad.addColorStop(0.50, '#0e1713');
  rockGrad.addColorStop(0.80, '#080d0a');
  rockGrad.addColorStop(1.00, '#040705');

  ctx.fillStyle = rockGrad;
  ctx.fillRect(x, y, w, (bottomY - y) + 120);

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
 * 4. WISZĄCE MOSTY LINOWE ZE SPLETYCH LIN I SZCZEBLI
 */
function drawHangingRopeBridge(ctx, x, y, w, h, time) {
  ctx.save();
  ctx.shadowBlur = 0;

  // Gruby oplot linowy / lina nośna górna i dolna
  const steps = 18;
  const dx = w / steps;
  const sagAmp = 10;

  // Liny nośne
  ctx.strokeStyle = '#52341b';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(x, y + 2);
  for (let i = 1; i <= steps; i++) {
    const px = x + i * dx;
    const sag = Math.sin((i / steps) * Math.PI) * sagAmp;
    ctx.lineTo(px, y + 2 + sag);
  }
  ctx.stroke();

  // Drewniane poprzeczki / szczeble kładki
  const plankSpacing = 26;
  for (let bx = x + 10; bx < x + w - 10; bx += plankSpacing) {
    const relProgress = (bx - x) / w;
    const sag = Math.sin(relProgress * Math.PI) * sagAmp;
    const py = y + sag;

    // Cień klocka
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(bx - 8, py + 2, 16, 7);

    // Drewniany szczebel
    ctx.fillStyle = '#613d22';
    ctx.fillRect(bx - 7, py, 14, 6);
    ctx.strokeStyle = '#27170c';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(bx - 7, py, 14, 6);

    // Kępka mchu na szczeblu
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(bx - 4, py - 1, 8, 2);
  }

  // Słupy cumownicze / kotwiące na krańcach mostu
  ctx.fillStyle = '#3a2313';
  ctx.fillRect(x - 6, y - 20, 12, 28);
  ctx.fillRect(x + w - 6, y - 20, 12, 28);

  ctx.restore();
}

/**
 * 5. CENTRALNE SANKTUARIUM SŁOŃCA (3 POZIOMY, X: 1360 - 2240)
 */
function drawSunSanctuary(ctx, time, bottomY) {
  ctx.save();
  ctx.shadowBlur = 0;

  const baseStartX = 1360;
  const baseW = 880;
  const baseEndX = baseStartX + baseW;

  // -----------------------------------------------------------------------
  // POZIOM 1: MONOLITYCZNY COKÓŁ BAZOWY (X: 1360-2240, Y: 990 DO BOTTOM_Y)
  // -----------------------------------------------------------------------
  // 100% KRYJĄCY PODKŁAD COKOŁU (ZERO PRZEŚWITÓW TŁA)
  ctx.fillStyle = '#020605';
  ctx.fillRect(baseStartX - 4, 990, baseW + 8, (bottomY - 990) + 120);

  const pedestalGrad = ctx.createLinearGradient(0, 990, 0, bottomY);
  pedestalGrad.addColorStop(0.00, '#242f28');
  pedestalGrad.addColorStop(0.20, '#1a231e');
  pedestalGrad.addColorStop(0.50, '#121814');
  pedestalGrad.addColorStop(0.80, '#0a0e0c');
  pedestalGrad.addColorStop(1.00, '#040705');

  ctx.fillStyle = pedestalGrad;
  ctx.fillRect(baseStartX, 990, baseW, (bottomY - 990) + 120);

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

  const seaTopY = 1510;
  const cloudMinX = -200;
  const cloudMaxX = 3800;

  // 100% nieprzezroczyste dno otchłani (od 1550 do BOTTOM_Y + 120)
  ctx.fillStyle = '#010504';
  ctx.fillRect(cloudMinX, 1550, cloudMaxX - cloudMinX, (bottomY - 1550) + 120);

  // Podstawa otchłani chmur schodząca do 1550
  const baseGrad = ctx.createLinearGradient(0, seaTopY, 0, 1550);
  baseGrad.addColorStop(0.00, 'rgba(4, 18, 12, 0.0)');
  baseGrad.addColorStop(0.40, 'rgba(2, 10, 7, 0.65)');
  baseGrad.addColorStop(0.85, 'rgba(1, 5, 4, 0.95)');
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
  ctx.shadowBlur = 0;
  const time = performance.now() * 0.001;

  // DYNAMICZNE WYLICZENIE DOLNEJ KRAWĘDZI WIDOKU KAMERY Z BEZPIECZNYM BUFOREM
  const canvasH = (ctx.canvas && ctx.canvas.height) || (typeof window !== 'undefined' ? window.innerHeight : 1080);
  const camZoom = (camera && camera.zoom) ? camera.zoom : 1;
  const camY = (camera && typeof camera.y === 'number') ? camera.y : 0;
  const viewBottomY = camY + (canvasH / camZoom) + 400;
  const BOTTOM_Y = Math.max(2200, viewBottomY);

  // 0. ABSOLUTNY, W 100% KRYJĄCY PODKŁAD CAŁEJ DOLNEJ CZĘŚCI ARENY (ZERO PRZEŚWITÓW TŁA)
  ctx.fillStyle = '#020504';
  ctx.fillRect(-50, 990, 930 + 50, (BOTTOM_Y - 990) + 120);       // Lewy klif skalny
  ctx.fillRect(875, 1190, 490, (BOTTOM_Y - 1190) + 120);          // Lewy basen wodny
  ctx.fillRect(1355, 990, 890, (BOTTOM_Y - 990) + 120);          // Centralny cokół ołtarza
  ctx.fillRect(2235, 1190, 490, (BOTTOM_Y - 1190) + 120);         // Prawy basen wodny
  ctx.fillRect(2715, 990, 890 + 50, (BOTTOM_Y - 990) + 120);      // Prawy klif skalny

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
  drawHangingRopeBridge(ctx, 880, 990, 480, 18, time);
  drawHangingRopeBridge(ctx, 2240, 990, 480, 18, time);

  // 9. Pływający w powietrzu złoty pyłek i świetliki dżungli
  drawAtmosphericFireflies(ctx, time);
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

export function updateArena2(dt, players) {
  if (Array.isArray(players)) {
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (p) applyPandoraUpdraft(p);
    }
  }
}

export function onArena2BulletHit(bullet) {
  return false;
}

export function onArena2KickHit(player, kickBox) {
  return false;
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
  customObjects: [],
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
  }
};

export default arena2;
