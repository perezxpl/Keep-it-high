// =========================================================================
// ARENAS/ARENA2.JS - ŚWIĘTA DŻUNGLA / ANCIENT JUNGLE SANCTUARY (3600x1400 PX)
// Autonomiczny moduł areny (Plugin / Lifecycle Hooks Pattern)
// W pełni zintegrowana grafika: starożytne ruiny w stylu Angkor Wat/Majów,
// organiczne pnie i sploty korzeni banyanów, wiszące mosty linowe,
// rzeźbiony Złoty Dysk Solarny z hieroglifami, ołtarz z ogniem i krystaliczny basen.
// =========================================================================

import { drawPandoraBackground } from '../background.js';

// =========================================================================
// WYZNACZANIE PŁYNNYCH KRZYWYCH BEZIERA DLA WISZĄCYCH MOSTÓW LINOWYCH
// =========================================================================
function generateBezierPoints(p0, p1, p2, steps = 18) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const inv = 1 - t;
    const x = Math.round(inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x);
    const y = Math.round(inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y);
    pts.push({ x, y });
  }
  return pts;
}

// Lewy wiszący most linowy: łączy platformę Banyanu (800, 780) ze Świątynią Słońca (1300, 740)
export const LEFT_VINE_BRIDGE_POINTS = generateBezierPoints(
  { x: 800, y: 780 },
  { x: 1050, y: 815 },
  { x: 1300, y: 740 },
  18
);

// Prawy wiszący most linowy: łączy Świątynię Słońca (2300, 740) z platformą Strażnicy (2800, 780)
export const RIGHT_VINE_BRIDGE_POINTS = generateBezierPoints(
  { x: 2300, y: 740 },
  { x: 2550, y: 815 },
  { x: 2800, y: 780 },
  18
);

// =========================================================================
// GEOMETRIA I PLATFORMY ARENY 2 (ARENA_2_PANDORA_PLATFORMS)
// =========================================================================
export const ARENA_2_PANDORA_PLATFORMS = [
  // -----------------------------------------------------------------------
  // 1. POZIOM GRUNTU: LITA SKAŁA, ZALANY DZIEDZINIEC I PODNÓŻA ŚWIĄTYNI (Y: 1040-1180)
  // -----------------------------------------------------------------------
  {
    id: 'jungle_ground_west',
    name: 'Zachodnie Podnóże Świątyni (Lita Skała)',
    isPlatform: true,
    solid: true,
    x: 0,
    w: 900,
    y: 1160,
    h: 240
  },
  {
    id: 'jungle_ground_courtyard',
    name: 'Zalany Dziedziniec Świątynny (Święte Źródło)',
    isPlatform: true,
    solid: true,
    x: 900,
    w: 1800,
    y: 1180,
    h: 220
  },
  {
    id: 'jungle_ground_east',
    name: 'Wschodnie Podnóże Świątyni (Lita Skała)',
    isPlatform: true,
    solid: true,
    x: 2700,
    w: 900,
    y: 1160,
    h: 240
  },

  // Podwyższone zrujnowane tarasy i schody na poziomie gruntu:
  {
    id: 'jungle_ruin_terrace_west',
    name: 'Zachodni Zrujnowany Taras Kolumnowy',
    isPlatform: true,
    solid: true,
    x: 180,
    w: 450,
    y: 1040,
    h: 120
  },
  {
    id: 'jungle_ramp_west',
    name: 'Starożytne Schody Zachodnie',
    type: 'ramp',
    isPlatform: true,
    isSlope: true,
    x: 630,
    w: 180,
    h: 120,
    startY: 1040,
    endY: 1160,
    surfacePoints: [
      { x: 630, y: 1040 },
      { x: 810, y: 1160 }
    ]
  },
  {
    id: 'jungle_altar_base',
    name: 'Podstawa Ołtarza Słońca (Dziedziniec)',
    isPlatform: true,
    solid: true,
    x: 1400,
    w: 800,
    y: 1060,
    h: 120
  },
  {
    id: 'jungle_ramp_east',
    name: 'Starożytne Schody Wschodnie',
    type: 'ramp',
    isPlatform: true,
    isSlope: true,
    x: 2790,
    w: 180,
    h: 120,
    startY: 1160,
    endY: 1040,
    surfacePoints: [
      { x: 2790, y: 1160 },
      { x: 2970, y: 1040 }
    ]
  },
  {
    id: 'jungle_ruin_terrace_east',
    name: 'Wschodni Zrujnowany Taras Kolumnowy',
    isPlatform: true,
    solid: true,
    x: 2970,
    w: 450,
    y: 1040,
    h: 120
  },

  // -----------------------------------------------------------------------
  // 2. POZIOM ŚREDNI: WIELKI BANYAN (ZACHÓD: X: 260-800, Y: 780)
  // -----------------------------------------------------------------------
  {
    id: 'jungle_banyan_main_west',
    name: 'Wielki Banyan (Główna Platforma Drewniana)',
    isPlatform: true,
    solid: true,
    x: 260,
    w: 540,
    y: 780,
    h: 36
  },
  {
    id: 'jungle_banyan_branch_west',
    name: 'Konar Banyanu (Półka Pośrednia)',
    isPlatform: true,
    oneWay: true,
    x: 340,
    w: 260,
    y: 600,
    h: 22
  },
  {
    id: 'jungle_banyan_nest_west',
    name: 'Gniazdo Obserwacyjne w Koronie Banyanu',
    isPlatform: true,
    oneWay: true,
    x: 580,
    w: 180,
    y: 440,
    h: 20
  },

  // -----------------------------------------------------------------------
  // 3. WISZĄCE MOSTY LINOWE (SUSPENSION ROPE BRIDGES)
  // -----------------------------------------------------------------------
  {
    id: 'jungle_rope_bridge_left',
    name: 'Zachodni Wiszący Most Linowy',
    isPlatform: true,
    oneWay: true,
    isSlope: true,
    isVineBridge: true,
    x: 800,
    w: 500,
    y: 740,
    h: 90,
    surfacePoints: LEFT_VINE_BRIDGE_POINTS
  },
  {
    id: 'jungle_rope_bridge_right',
    name: 'Wschodni Wiszący Most Linowy',
    isPlatform: true,
    oneWay: true,
    isSlope: true,
    isVineBridge: true,
    x: 2300,
    w: 500,
    y: 740,
    h: 90,
    surfacePoints: RIGHT_VINE_BRIDGE_POINTS
  },

  // -----------------------------------------------------------------------
  // 4. CYTADELA CENTRALNA: ŚWIĄTYNIA SŁOŃCA (X: 1300-2300)
  // -----------------------------------------------------------------------
  {
    id: 'jungle_temple_terrace',
    name: 'Główny Taras Świątyni Słońca',
    isPlatform: true,
    solid: true,
    x: 1300,
    w: 1000,
    y: 740,
    h: 40
  },
  {
    id: 'jungle_sun_altar',
    name: 'Święty Ołtarz Solarny (Podwyższenie)',
    isPlatform: true,
    solid: true,
    x: 1550,
    w: 500,
    y: 580,
    h: 32
  },
  {
    id: 'jungle_monolith_lintel',
    name: 'Nadproże Megalitu Słonecznego (Snajper)',
    isPlatform: true,
    oneWay: true,
    x: 1680,
    w: 240,
    y: 430,
    h: 22
  },
  {
    id: 'jungle_temple_crypt_floor',
    name: 'Krypta Podświątynna (Tunel Dolny)',
    isPlatform: true,
    solid: true,
    x: 1580,
    w: 440,
    y: 920,
    h: 30
  },

  // -----------------------------------------------------------------------
  // 5. POZIOM ŚREDNI: STRAŻNICA W DRZEWACH (WSCHÓD: X: 2800-3340, Y: 780)
  // -----------------------------------------------------------------------
  {
    id: 'jungle_treehouse_main_east',
    name: 'Strażnica w Koronach Drzew (Podest)',
    isPlatform: true,
    solid: true,
    x: 2800,
    w: 540,
    y: 780,
    h: 36
  },
  {
    id: 'jungle_treehouse_perch_east',
    name: 'Balkon Obserwacyjny Strażnicy',
    isPlatform: true,
    oneWay: true,
    x: 3000,
    w: 260,
    y: 600,
    h: 22
  },
  {
    id: 'jungle_treehouse_nest_east',
    name: 'Gniazdo Snajperskie Strażnicy',
    isPlatform: true,
    oneWay: true,
    x: 2840,
    w: 180,
    y: 440,
    h: 20
  },

  // -----------------------------------------------------------------------
  // 6. TAKTYCZNE MSZYSTE GŁAZY POŚREDNIE (ONE-WAY, Y: 950)
  // -----------------------------------------------------------------------
  {
    id: 'jungle_moss_rock_west',
    name: 'Mszysty Głaz Zawieszony (Zachód)',
    isPlatform: true,
    oneWay: true,
    x: 880,
    w: 180,
    y: 950,
    h: 24
  },
  {
    id: 'jungle_moss_rock_east',
    name: 'Mszysty Głaz Zawieszony (Wschód)',
    isPlatform: true,
    oneWay: true,
    x: 2540,
    w: 180,
    y: 950,
    h: 24
  }
];

// Aliasy kompatybilności wstecznej
export const ARENA_CYBER_STADIUM_PLATFORMS = ARENA_2_PANDORA_PLATFORMS;
export const ARENA_CYBER_STADIUM_BARRICADES = [];
export const ARENA_2_PANDORA_GOALS = [];
export const ARENA_CYBER_STADIUM_GOALS = [];

// =========================================================================
// FIZYKA OTCHŁANI / BEZPIECZEŃSTWA (ZABEZPIECZENIE PRZED WYPADNIĘCIEM)
// =========================================================================
export function applyPandoraUpdraft(player) {
  if (!player || player.isDead) return false;
  if (player.y > 1320) {
    if (player.y >= 1390) {
      player.hp = 0;
      player.isDead = true;
      player.respawnTimer = 75;
      return false;
    }
    player.vy = -18.0;
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
// ATMOSFERYCZNE CZĄSTECZKI DŻUNGLI I PRĄDÓW WZNOSZĄCYCH (STAŁE TABLICE, ZERO GC)
// =========================================================================

// A. Pływające w powietrzu świetliki dżungli (korony drzew i ruiny) - 20 sztuk
const JUNGLE_FIREFLIES_COUNT = 20;
const _jungleFireflies = [];
for (let i = 0; i < JUNGLE_FIREFLIES_COUNT; i++) {
  _jungleFireflies.push({
    baseX: 80 + (i * 91.3) % 3440,
    baseY: 280 + (i * 43.7) % 880,
    vx: ((i % 5) - 2) * 4.5,
    vy: -5.0 - (i % 4) * 3.0,
    phase: i * 0.45,
    pulseSpeed: 1.3 + (i % 4) * 0.5,
    size: 1.6 + (i % 3) * 0.6,
    isGolden: (i % 3 !== 1),
    swayAmp: 16 + (i % 4) * 6,
    swaySpeed: 0.7 + (i % 3) * 0.35
  });
}

// B. Zarodniki bioluminescencyjne i świetliki termiki (updraft) w otchłani chmur - 26 sztuk
const CLOUD_UPDRAFT_PARTICLES_COUNT = 26;
const _cloudUpdraftParticles = [];
for (let i = 0; i < CLOUD_UPDRAFT_PARTICLES_COUNT; i++) {
  _cloudUpdraftParticles.push({
    baseX: 100 + (i * 134.7) % 3400,
    speedY: -28.0 - (i % 5) * 6.5,
    swayAmp: 14 + (i % 4) * 5,
    swaySpeed: 1.1 + (i % 3) * 0.35,
    size: (i % 4 === 0) ? 2.4 : 1.5,
    phase: i * 0.62,
    isCyan: (i % 3 !== 0) // cyan/turkusowe vs złote
  });
}

// C. Wstęgi prądów wznoszących (updraft streamlines) - 16 sztuk
const UPDRAFT_WIND_LINES_COUNT = 16;
const _updraftWindLines = [];
for (let i = 0; i < UPDRAFT_WIND_LINES_COUNT; i++) {
  _updraftWindLines.push({
    x: 160 + i * 215 + ((i * 71) % 110),
    h: 190 + (i % 4) * 45,
    speed: 0.85 + (i % 3) * 0.3,
    phase: i * 0.75
  });
}

// =========================================================================
// GŁÓWNA PROCEDURA RENDEROWANIA TERENU DŻUNGLI (PANDORA TERRAIN)
// =========================================================================
export function renderPandoraTerrain(ctx, camera) {
  if (!ctx) return;
  ctx.shadowBlur = 0;
  const time = performance.now() * 0.001;

  // 1. Dolna strefa: Otchłań chmur i termika wznosząca (Cloud Zone & Updraft)
  drawPandoraCloudSeaAndUpdrafts(ctx, time);

  // 2. Pływający w powietrzu złoty pyłek i świetliki dżungli
  drawAtmosphericPollenAndFireflies(ctx, time);

  // 3. Podłoże: kamienne ciosane płyty, naturalne uskoki i Święty Basen Dziedzińca
  drawJungleGroundBedrock(ctx, time);

  // 4. Zrujnowane podwyższone tarasy i schody na poziomie gruntu
  drawOvergrownStoneTerrace(ctx, 180, 1040, 450, 120, 'west', time);
  drawAncientStoneRamp(ctx, 630, 1040, 180, 120, true, time);
  drawOvergrownStoneTerrace(ctx, 1400, 1060, 800, 120, 'center', time);
  drawAncientStoneRamp(ctx, 2790, 1160, 180, -120, false, time);
  drawOvergrownStoneTerrace(ctx, 2970, 1040, 450, 120, 'east', time);

  // 5. Lewa flanka: organiczny Wielki Banyan i drewniane platformy nadrzewne
  drawOrganicBanyanTree(ctx, 120, 780, time);
  drawHardwoodPlatform(ctx, 260, 780, 540, 36, true, time);
  drawHardwoodPlatform(ctx, 340, 600, 260, 22, false, time);
  drawHardwoodPlatform(ctx, 580, 440, 180, 20, false, time);

  // 6. Prawa flanka: drewniana strażnica z bali i platformy w koronach drzew
  drawTimberWatchtower(ctx, 3070, 780, time);
  drawHardwoodPlatform(ctx, 2800, 780, 540, 36, true, time);
  drawHardwoodPlatform(ctx, 3000, 600, 260, 22, false, time);
  drawHardwoodPlatform(ctx, 2840, 440, 180, 20, false, time);

  // 7. Wiszące mosty linowe ze splecionych lin i drewnianych szczebli (krzywa łańcuchowa)
  drawRealisticRopeBridge(ctx, { x: 800, y: 780 }, { x: 1050, y: 815 }, { x: 1300, y: 740 }, time);
  drawRealisticRopeBridge(ctx, { x: 2300, y: 740 }, { x: 2550, y: 815 }, { x: 2800, y: 780 }, time);

  // 8. Centralna Cytadela Świątyni Słońca (lewitujący masyw skalny, Złoty Dysk, ołtarz, płonące czary)
  drawAncientSunTemple(ctx, time);

  // 9. Taktyczne zawieszone mszyste głazy pośrednie z organicznym stalaktytowym podbrzuszem
  drawOvergrownSuspendedRock(ctx, 880, 950, 180, 24, time, 1);
  drawOvergrownSuspendedRock(ctx, 2540, 950, 180, 24, time + 2.0, 2);
}

// =========================================================================
// 1. DOLNA STREFA: OTCHŁAŃ CHMUR I TERMIKA WZNOSZĄCA (CLOUD ZONE & UPDRAFT)
// =========================================================================
function drawPandoraCloudSeaAndUpdrafts(ctx, time) {
  ctx.save();
  ctx.shadowBlur = 0;

  // Strefa chmur sięga poza śmiercionośną czeluść (1200 - 1520) bez ucięć krawędziowych
  const seaTopY = 1200;
  const seaBottomY = 1520;
  const cloudMinX = -600;
  const cloudMaxX = 4200;

  // A. GĘSTA PODSTAWA OTCHŁANI CHMUR (WIELOPOZIOMOWE KŁĘBY Z PIONOWYM GRADIENTEM)
  const cloudBaseGrad = ctx.createLinearGradient(0, seaTopY - 40, 0, seaBottomY);
  cloudBaseGrad.addColorStop(0.00, 'rgba(15, 61, 40, 0.0)');
  cloudBaseGrad.addColorStop(0.20, 'rgba(12, 50, 33, 0.45)');
  cloudBaseGrad.addColorStop(0.45, 'rgba(8, 36, 24, 0.78)');
  cloudBaseGrad.addColorStop(0.75, 'rgba(4, 20, 14, 0.95)');
  cloudBaseGrad.addColorStop(1.00, '#020d09');

  ctx.fillStyle = cloudBaseGrad;
  ctx.fillRect(cloudMinX, seaTopY - 40, cloudMaxX - cloudMinX, seaBottomY - seaTopY + 40);

  // B. KŁĘBIĄCE SIĘ PROCEDURALNE KOPUŁY CHMUR (WARSTWA GŁĘBOKA I ŚREDNIA)
  const cloudBeds = [
    { baseY: 1330, step: 240, rBase: 120, amp: 30, speed: 12, col: '#0d3824' },
    { baseY: 1270, step: 185, rBase: 95, amp: 24, speed: 18, col: '#12472e' }
  ];

  for (let b = 0; b < cloudBeds.length; b++) {
    const cb = cloudBeds[b];
    ctx.fillStyle = cb.col;
    ctx.beginPath();
    ctx.moveTo(cloudMinX, seaBottomY);

    const xOff = (time * cb.speed) % cb.step;
    for (let cx = cloudMinX - xOff; cx < cloudMaxX + cb.step; cx += cb.step) {
      const cr = cb.rBase + Math.sin(time * 0.8 + cx * 0.01) * cb.amp;
      const cy = cb.baseY + Math.cos(time * 0.6 + cx * 0.02) * 12;
      ctx.quadraticCurveTo(cx + cb.step * 0.25, cy - cr * 0.45, cx + cb.step * 0.5, cy - cr * 0.5);
      ctx.quadraticCurveTo(cx + cb.step * 0.75, cy - cr * 0.45, cx + cb.step, cy);
    }

    ctx.lineTo(cloudMaxX, seaBottomY);
    ctx.closePath();
    ctx.fill();
  }

  // C. MIĘKKIE ROZPROSZONE PODUSZKI MGŁY NA SZCZYTACH CHMUR (TRYB 'SCREEN')
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  const puffSpan = cloudMaxX - cloudMinX;
  for (let c = 0; c < 16; c++) {
    const puffX = cloudMinX + ((c * 290 + time * 16) % puffSpan + puffSpan) % puffSpan;
    const puffY = 1250 + Math.sin(time * 0.9 + c) * 18;
    const puffR = 140 + (c % 3) * 35;

    const puffGrad = ctx.createRadialGradient(puffX, puffY, 15, puffX, puffY, puffR);
    puffGrad.addColorStop(0.0, 'rgba(45, 212, 191, 0.16)');
    puffGrad.addColorStop(0.45, 'rgba(13, 148, 136, 0.08)');
    puffGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = puffGrad;
    ctx.beginPath();
    ctx.arc(puffX, puffY, puffR, 0, Math.PI * 2);
    ctx.fill();
  }

  // D. WIZUALIZACJA PRĄDÓW WZNOSZĄCYCH (UPDRAFT STREAMLINES - SMUGI WIATRU)
  ctx.lineWidth = 1.8;
  for (let l = 0; l < _updraftWindLines.length; l++) {
    const wl = _updraftWindLines[l];
    const waveY = ((time * wl.speed * 80 + wl.phase * 200) % 360);
    const startY = 1380 - waveY;
    if (startY < 1080) continue;

    const endY = startY - wl.h;
    const swayX = Math.sin(time * 2.4 + wl.phase + startY * 0.015) * 16;

    const lineAlpha = Math.sin((waveY / 360) * Math.PI) * 0.35;
    ctx.strokeStyle = `rgba(153, 246, 228, ${lineAlpha})`;

    ctx.beginPath();
    ctx.moveTo(wl.x, startY);
    ctx.quadraticCurveTo(wl.x + swayX, (startY + endY) * 0.5, wl.x + swayX * 0.5, endY);
    ctx.stroke();
  }

  // E. BIOLUMINESCENCYJNE ZARODNIKI ROŚLINNE I ŚWIETLIKI TERMIKI (UNOSZĄCE SIĘ W GÓRĘ)
  for (let p = 0; p < _cloudUpdraftParticles.length; p++) {
    const sp = _cloudUpdraftParticles[p];
    const lifeCycle = ((time * sp.speedY + p * 45) % 320 + 320) % 320;
    const px = sp.baseX + Math.sin(time * sp.swaySpeed + sp.phase) * sp.swayAmp;
    const py = 1390 - lifeCycle;

    // Przenikanie cząstki: płynne narodziny na dole i zanikanie u góry
    const lifeRatio = lifeCycle / 320;
    const alpha = Math.sin(lifeRatio * Math.PI) * (0.45 + 0.35 * Math.sin(time * 3.5 + p));

    ctx.fillStyle = sp.isCyan
      ? `rgba(94, 234, 212, ${alpha})`
      : `rgba(253, 224, 71, ${alpha * 0.9})`;

    ctx.beginPath();
    ctx.arc(px, py, sp.size, 0, Math.PI * 2);
    ctx.fill();

    // Drobna poświata dla większych zarodników
    if (sp.size > 2.0 && alpha > 0.2) {
      const haloGrad = ctx.createRadialGradient(px, py, 1, px, py, 9);
      haloGrad.addColorStop(0.0, sp.isCyan ? `rgba(45, 212, 191, ${alpha * 0.5})` : `rgba(250, 204, 21, ${alpha * 0.5})`);
      haloGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
  ctx.restore();
}

// =========================================================================
// 2. ŚWIETLIKI DŻUNGLI W KORONACH DRZEW I PRZY RUINACH
// =========================================================================
function drawAtmosphericPollenAndFireflies(ctx, time) {
  ctx.save();
  ctx.shadowBlur = 0;
  for (let i = 0; i < _jungleFireflies.length; i++) {
    const ff = _jungleFireflies[i];
    const driftX = ff.baseX + Math.sin(time * ff.swaySpeed + ff.phase) * ff.swayAmp + Math.sin(time * 0.35 + i) * 10;
    const driftY = ((ff.baseY + time * ff.vy) % 950 + 950) % 950 + 260;

    const sinP = Math.sin(time * ff.pulseSpeed + ff.phase);
    const alpha = 0.20 + 0.45 * (0.5 + 0.5 * sinP);

    ctx.fillStyle = ff.isGolden
      ? `rgba(254, 240, 138, ${alpha})`
      : `rgba(167, 243, 208, ${alpha * 0.85})`;

    ctx.beginPath();
    ctx.arc(driftX, driftY, ff.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// =========================================================================
// 3. ORGANICZNA DARŃ, GĘSTY CIENIOWANY MECH I KĘPKI TRAWY (REUSABLE TURF)
// =========================================================================
function drawLushMossyTurf(ctx, x, y, w, thickness = 7, isWood = false, time = 0) {
  ctx.save();

  // 1. Ciemna, chłodna podstawa mchu i wilgotnej gleby (ambient shadow)
  ctx.strokeStyle = isWood ? '#182410' : '#142911';
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.moveTo(x - 2, y + 1);
  ctx.lineTo(x + w + 2, y + 1);
  ctx.stroke();

  // 2. Średnia warstwa gęstego leśnego mchu
  ctx.strokeStyle = isWood ? '#2d4c1b' : '#2b5219';
  ctx.lineWidth = thickness * 0.6;
  ctx.beginPath();
  ctx.moveTo(x - 1, y);
  ctx.lineTo(x + w + 1, y);
  ctx.stroke();

  // 3. Jasne szmaragdowe refleksy i kępki trawy o zróżnicowanej wysokości
  ctx.fillStyle = '#4c842b';
  const tufts = Math.floor(w / 7);
  for (let t = 0; t <= tufts; t++) {
    const tx = x + t * 7;
    const bladeH = 3.5 + ((t * 13) % 7.5);
    const sway = Math.sin(time * 2.8 + tx * 0.05) * 1.8;

    ctx.beginPath();
    ctx.moveTo(tx - 2, y);
    ctx.quadraticCurveTo(tx + sway * 0.5, y - bladeH * 0.5, tx + sway, y - bladeH);
    ctx.quadraticCurveTo(tx + 2 + sway * 0.5, y - bladeH * 0.5, tx + 2, y);
    ctx.fill();
  }

  // 4. Jasne złocisto-szmaragdowe końcówki źdźbeł ("rim light" od porannego słońca)
  ctx.fillStyle = '#86efac';
  for (let t = 0; t <= tufts; t += 2) {
    const tx = x + t * 7;
    const bladeH = 4.0 + ((t * 13) % 7.5);
    const sway = Math.sin(time * 2.8 + tx * 0.05) * 1.8;
    ctx.beginPath();
    ctx.arc(tx + sway, y - bladeH, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Zwisające drobne pnącza na krawędziach przełamujące geometryczną prostoliniowość
  const edgeDrapes = [x + 6, x + 24, x + w - 24, x + w - 6];
  for (let i = 0; i < edgeDrapes.length; i++) {
    const ex = edgeDrapes[i];
    const eLen = 10 + ((i * 17) % 18);
    const eSway = Math.sin(time * 1.8 + i) * 3.5;

    ctx.strokeStyle = '#224716';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(ex, y + 2);
    ctx.quadraticCurveTo(ex + eSway * 0.5, y + 2 + eLen * 0.5, ex + eSway, y + 2 + eLen);
    ctx.stroke();

    ctx.fillStyle = '#3f7024';
    ctx.beginPath();
    ctx.arc(ex + eSway, y + 2 + eLen, 2.0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// Kompatybilność wsteczna
function drawMossyEdge(ctx, x, y, w, thickness) {
  drawLushMossyTurf(ctx, x, y, w, thickness, false, 0);
}

// =========================================================================
// 4. PROCEDURALNE STALAKTYTOWE PODBRZUSZE LEWITUJĄCEJ WYSPY (KARST KEEL)
// =========================================================================
function drawFloatingRockIslandKeel(ctx, x, topY, w, minDepth = 55, maxDepth = 120, seed = 1, time = 0) {
  ctx.save();

  const midX = x + w * 0.5;
  const bottomY = topY + maxDepth;

  // Główny korpus litej skały krasowej z organicznym, zwężającym się ku dołowi profilem
  const rockGrad = ctx.createLinearGradient(x, topY, x, bottomY);
  rockGrad.addColorStop(0.00, '#3d362a');
  rockGrad.addColorStop(0.25, '#2b261e');
  rockGrad.addColorStop(0.65, '#1b1713');
  rockGrad.addColorStop(1.00, '#0c0a07');

  ctx.fillStyle = rockGrad;
  ctx.beginPath();
  ctx.moveTo(x, topY);

  // Lewa poszarpana krawędź skalna schodząca w dół
  ctx.lineTo(x + w * 0.08, topY + minDepth * 0.45);
  ctx.lineTo(x + w * 0.05, topY + minDepth * 0.75);
  ctx.lineTo(x + w * 0.20, topY + minDepth);

  // Środkowe stalaktyty i iglice skalne zwężające się ku otchłani
  const peak1X = x + w * 0.38;
  const peak1Y = topY + maxDepth * 0.85;
  ctx.quadraticCurveTo(x + w * 0.28, peak1Y - 20, peak1X, peak1Y);

  const mainKeelX = midX + Math.sin(seed * 2.3) * (w * 0.08);
  const mainKeelY = bottomY;
  ctx.quadraticCurveTo(midX - w * 0.08, bottomY - 30, mainKeelX, mainKeelY);

  const peak2X = x + w * 0.72;
  const peak2Y = topY + maxDepth * 0.75;
  ctx.quadraticCurveTo(midX + w * 0.12, bottomY - 25, peak2X, peak2Y);

  // Prawa poszarpana ściana skalna wznosząca się do poziomu platformy
  ctx.lineTo(x + w * 0.88, topY + minDepth * 0.80);
  ctx.lineTo(x + w * 0.95, topY + minDepth * 0.40);
  ctx.lineTo(x + w, topY);
  ctx.closePath();
  ctx.fill();

  // Cieniowanie krawędziowe (ambient occlusion pod platformą)
  const aoGrad = ctx.createLinearGradient(x, topY, x, topY + 28);
  aoGrad.addColorStop(0.0, 'rgba(3, 10, 6, 0.75)');
  aoGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = aoGrad;
  ctx.fillRect(x, topY, w, 28);

  // Pionowe i ukośne spękania tektoniczne na powierzchni skały
  ctx.strokeStyle = '#120f0b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.22, topY + 12);
  ctx.lineTo(x + w * 0.26, topY + minDepth * 0.6);
  ctx.lineTo(peak1X - 6, peak1Y - 10);

  ctx.moveTo(midX - 10, topY + 18);
  ctx.lineTo(midX - 4, topY + maxDepth * 0.5);
  ctx.lineTo(mainKeelX, mainKeelY - 8);

  ctx.moveTo(x + w * 0.75, topY + 14);
  ctx.lineTo(x + w * 0.70, topY + maxDepth * 0.45);
  ctx.stroke();

  // Zwisające w pustkę korzenie i liany z wierzchołków stalaktytów
  const rootAnchors = [
    { rx: peak1X, ry: peak1Y, len: 45 + (seed * 17) % 35 },
    { rx: mainKeelX, ry: mainKeelY, len: 65 + (seed * 23) % 45 },
    { rx: peak2X, ry: peak2Y, len: 40 + (seed * 19) % 30 }
  ];

  ctx.strokeStyle = '#1c130b';
  ctx.lineWidth = 2.0;
  for (let r = 0; r < rootAnchors.length; r++) {
    const ra = rootAnchors[r];
    const sway = Math.sin(time * 1.5 + r + seed) * 7;
    ctx.beginPath();
    ctx.moveTo(ra.rx, ra.ry);
    ctx.quadraticCurveTo(ra.rx + sway * 0.5, ra.ry + ra.len * 0.5, ra.rx + sway, ra.ry + ra.len);
    ctx.stroke();

    // Drobny wiszący liść
    ctx.fillStyle = '#2d541e';
    ctx.beginPath();
    ctx.ellipse(ra.rx + sway, ra.ry + ra.len, 2.8, 1.6, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Szmaragdowo-złoty akcent świetlny ("rim light") na górnych krawędziach skierowanych ku słońcu
  ctx.strokeStyle = 'rgba(187, 247, 208, 0.30)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.95, topY + minDepth * 0.40);
  ctx.lineTo(x + w, topY);
  ctx.stroke();

  ctx.restore();
}

// =========================================================================
// 5. PODŁOŻE DŻUNGLI: LITA SKAŁA, USKOKI I KRYSTALICZNY BASEN ŚWIĄTYNNY
// =========================================================================

/** Zwraca falującą wysokość tafli wody w Świętym Basenie (wokół Y: 1180) */
function getWaterSurfaceY(x, time) {
  return 1180 + Math.sin(x * 0.022 + time * 2.2) * 2.6 + Math.cos(x * 0.048 - time * 1.7) * 1.4;
}

/** Rysuje pełny wielowarstwowy basen wodny z głębią aż do bedrockBottomY */
function drawSacredWaterBasin(ctx, x0, x1, bottomY, time) {
  ctx.save();
  const width = x1 - x0;
  const steps = 24;
  const dx = width / steps;

  // 1. ZATOPIONE STAROŻYTNE BRUKI I SCHODY NA DNIE BASENU (WIDOCZNE PRZEZ WODĘ)
  ctx.fillStyle = '#101c18';
  ctx.fillRect(x0, 1240, width, bottomY - 1240);
  ctx.strokeStyle = '#0b1613';
  ctx.lineWidth = 1.4;
  for (let sx = x0 + 20; sx < x1; sx += 45) {
    ctx.beginPath();
    ctx.moveTo(sx, 1240);
    ctx.lineTo(sx, bottomY);
    ctx.stroke();
  }
  for (let sy = 1260; sy < bottomY; sy += 35) {
    ctx.beginPath();
    ctx.moveTo(x0, sy);
    ctx.lineTo(x1, sy);
    ctx.stroke();
  }

  // 2. KORPUS WODY (POLYGON OD FALUJĄCEJ POWIERZCHNI DO GŁĘBOKIEGO DNA)
  const waterGrad = ctx.createLinearGradient(x0, 1180, x0, bottomY);
  waterGrad.addColorStop(0.00, 'rgba(20, 184, 166, 0.52)');  // Krystaliczny turkus
  waterGrad.addColorStop(0.12, 'rgba(13, 148, 136, 0.68)');  // Głęboki szmaragd
  waterGrad.addColorStop(0.38, 'rgba(15, 118, 110, 0.82)');  // Mroczna toń
  waterGrad.addColorStop(0.70, 'rgba(6, 44, 40, 0.94)');     // Głębinowa otchłań
  waterGrad.addColorStop(1.00, '#031412');                   // Lita ciemna głębina

  ctx.fillStyle = waterGrad;
  ctx.beginPath();
  ctx.moveTo(x0, getWaterSurfaceY(x0, time));
  for (let i = 1; i <= steps; i++) {
    const px = x0 + i * dx;
    ctx.lineTo(px, getWaterSurfaceY(px, time));
  }
  ctx.lineTo(x1, bottomY);
  ctx.lineTo(x0, bottomY);
  ctx.closePath();
  ctx.fill();

  // 3. PODWODNE REFLEKSY ŚWIATŁA (KAUSTYKA W TRYBIE 'SCREEN')
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.strokeStyle = 'rgba(153, 246, 228, 0.16)';
  ctx.lineWidth = 2.0;
  for (let c = 0; c < 6; c++) {
    const cx0 = x0 + 40 + c * (width / 6) + Math.sin(time * 1.5 + c) * 20;
    const cy0 = getWaterSurfaceY(cx0, time) + 4;
    ctx.beginPath();
    ctx.moveTo(cx0, cy0);
    ctx.quadraticCurveTo(cx0 + 25, cy0 + 40, cx0 + 10, cy0 + 85);
    ctx.stroke();
  }
  ctx.restore();

  // 4. REFLEKSY I BŁYSKI SŁONECZNE NA TAFLE WODY (SPECULAR SURFACE HIGHLIGHTS)
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // Główna lśniąca wstęga fali
  ctx.strokeStyle = 'rgba(230, 255, 250, 0.85)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x0, getWaterSurfaceY(x0, time));
  for (let i = 1; i <= steps; i++) {
    const px = x0 + i * dx;
    ctx.lineTo(px, getWaterSurfaceY(px, time));
  }
  ctx.stroke();

  // Cyanowa poświata pod grzbietem fali
  ctx.strokeStyle = 'rgba(94, 234, 212, 0.40)';
  ctx.lineWidth = 3.6;
  ctx.stroke();

  // Tańczące świetliste kresty piany
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.70)';
  ctx.lineWidth = 1.6;
  for (let w = 0; w < 7; w++) {
    const waveX = x0 + 25 + w * (width / 7) + Math.sin(time * 2.0 + w * 0.9) * 16;
    const waveY = getWaterSurfaceY(waveX, time) + 2;
    const waveW = 28 + (w % 3) * 12;
    ctx.beginPath();
    ctx.moveTo(waveX, waveY);
    ctx.quadraticCurveTo(waveX + waveW * 0.5, waveY - 2.5, waveX + waveW, waveY);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

/** Rysuje ciosane kamienne nabrzeże basenu schodzące w głąb podłoża */
function drawStoneQuayEmbankment(ctx, x0, x1, topY, bottomY, type, time) {
  ctx.save();
  const w = x1 - x0;
  const h = bottomY - topY;

  // Kamienne ciosane bloki nabrzeża
  const qGrad = ctx.createLinearGradient(x0, topY, x1, bottomY);
  qGrad.addColorStop(0.00, '#3f382c');
  qGrad.addColorStop(0.25, '#2c271e');
  qGrad.addColorStop(0.65, '#191611');
  qGrad.addColorStop(1.00, '#090806');

  ctx.fillStyle = qGrad;
  ctx.fillRect(x0, topY, w, h);

  // Kamienne spoiny / ciosy murarskie schodzące w głąb
  ctx.strokeStyle = '#15120c';
  ctx.lineWidth = 1.6;
  for (let sy = topY; sy < bottomY; sy += 28) {
    ctx.beginPath();
    ctx.moveTo(x0, sy);
    ctx.lineTo(x1, sy);
    ctx.stroke();
  }

  // Ciemny ślad zawilgocenia i glonów na linii wody (y: 1175 - 1195)
  ctx.fillStyle = 'rgba(16, 44, 28, 0.65)';
  ctx.fillRect(x0, 1175, w, 22);

  // Złocisty rim-light na górnej krawędzi nabrzeża
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x0, topY + 1);
  ctx.lineTo(x1, topY + 1);
  ctx.stroke();

  // Schodkowe stopnie zejściowe ku wodzie
  const isWestEdge = (type === 'west' || type === 'altar_east');
  ctx.fillStyle = '#221e17';
  if (isWestEdge) {
    ctx.fillRect(x1 - 14, 1168, 14, 12);
  } else {
    ctx.fillRect(x0, 1168, 14, 12);
  }

  // Starożytny spatynowany pierścień cumowniczy z brązu
  const ringX = x0 + w * 0.5;
  const ringY = 1172;
  ctx.strokeStyle = '#85542b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(ringX, ringY, 4.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawJungleGroundBedrock(ctx, time) {
  ctx.save();
  ctx.shadowBlur = 0;

  const bedrockBottomY = 1520;

  // -----------------------------------------------------------------------
  // A. ROZLEGŁE SKALNE PODNÓŻA (LITA SKAŁA BEZ UCIĘĆ KRAWĘDZIOWYCH)
  // Rozciągają się od x: -600 do 905 (zachód) oraz od 2695 do 4200 (wschód)
  // -----------------------------------------------------------------------
  const groundSlabs = [
    { x: -600, w: 1505, y: 1160, isWest: true },   // [-600 .. 905]
    { x: 2695, w: 1505, y: 1160, isWest: false }   // [2695 .. 4200]
  ];

  for (const slab of groundSlabs) {
    const sGrad = ctx.createLinearGradient(slab.x, slab.y, slab.x, bedrockBottomY);
    sGrad.addColorStop(0.00, '#3a3328');
    sGrad.addColorStop(0.12, '#27221a');
    sGrad.addColorStop(0.45, '#17140f');
    sGrad.addColorStop(0.80, '#0e0b08');
    sGrad.addColorStop(1.00, '#050403');

    ctx.fillStyle = sGrad;
    ctx.fillRect(slab.x, slab.y, slab.w, bedrockBottomY - slab.y);

    // Krawędź ciosanych bloków i pionowe szczeliny tektoniczne
    ctx.strokeStyle = 'rgba(18, 15, 11, 0.85)';
    ctx.lineWidth = 1.8;
    for (let bx = slab.x + 60; bx < slab.x + slab.w; bx += 85) {
      ctx.beginPath();
      ctx.moveTo(bx, slab.y);
      ctx.lineTo(bx + 14, slab.y + 70);
      ctx.lineTo(bx - 6, slab.y + 150);
      ctx.lineTo(bx + 8, slab.y + 240);
      ctx.stroke();
    }

    // Złocisty rim-light na górnej krawędzi
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.28)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(slab.x, slab.y + 1);
    ctx.lineTo(slab.x + slab.w, slab.y + 1);
    ctx.stroke();

    // Poduszka gęstego mchu i trawy na szczycie skał
    drawLushMossyTurf(ctx, slab.x, slab.y, slab.w, 8, false, time);
  }

  // -----------------------------------------------------------------------
  // B. KAMIENNE NABRZEŻA I SCHODKOWE CIOSY BASENÓW (QUAY EMBANKMENTS)
  // Zapewniają płynne, architektoniczne przejście między lądem a wodą
  // -----------------------------------------------------------------------
  drawStoneQuayEmbankment(ctx, 875, 910, 1160, bedrockBottomY, 'west', time);
  drawStoneQuayEmbankment(ctx, 1385, 1415, 1160, bedrockBottomY, 'altar_west', time);
  drawStoneQuayEmbankment(ctx, 2185, 2215, 1160, bedrockBottomY, 'altar_east', time);
  drawStoneQuayEmbankment(ctx, 2690, 2725, 1160, bedrockBottomY, 'east', time);

  // -----------------------------------------------------------------------
  // C. DWA MAJESTATYCZNE BASENY ŚWIĘTEGO ŹRÓDŁA (ZACHODNI I WSCHODNI)
  // Woda rozciąga się w głąb do bedrockBottomY (1520 px) - ZERO UCIĘĆ!
  // -----------------------------------------------------------------------
  drawSacredWaterBasin(ctx, 885, 1405, bedrockBottomY, time);
  drawSacredWaterBasin(ctx, 2195, 2715, bedrockBottomY, time);

  // -----------------------------------------------------------------------
  // D. NATURALNE LILIE WODNE I LIŚCIE LOTOSU (DYNAMICZNIE NA POWIERZCHNI FAL)
  // -----------------------------------------------------------------------
  const lotusBeds = [
    { x: 960, r: 15, flower: false },
    { x: 1070, r: 18, flower: true },
    { x: 1200, r: 14, flower: false },
    { x: 1330, r: 16, flower: true },
    { x: 2270, r: 15, flower: true },
    { x: 2390, r: 17, flower: false },
    { x: 2510, r: 18, flower: true },
    { x: 2630, r: 14, flower: false }
  ];

  for (const lb of lotusBeds) {
    const surfY = getWaterSurfaceY(lb.x, time);

    // Cień liścia na wodzie
    ctx.fillStyle = 'rgba(3, 18, 16, 0.55)';
    ctx.beginPath();
    ctx.arc(lb.x + 2, surfY + 3, lb.r, 0, Math.PI * 2);
    ctx.fill();

    // Soczysty szmaragdowy liść lotosu z wcięciem
    ctx.fillStyle = '#1e5223';
    ctx.beginPath();
    ctx.arc(lb.x, surfY, lb.r, 0.35, Math.PI * 2 - 0.35);
    ctx.lineTo(lb.x, surfY);
    ctx.closePath();
    ctx.fill();

    // Nerwy liścia
    ctx.strokeStyle = '#3d7a31';
    ctx.lineWidth = 1.0;
    for (let a = 0; a < 5; a++) {
      const ang = (a / 5) * Math.PI * 1.8 + 0.5;
      ctx.beginPath();
      ctx.moveTo(lb.x, surfY);
      ctx.lineTo(lb.x + Math.cos(ang) * lb.r * 0.9, surfY + Math.sin(ang) * lb.r * 0.9);
      ctx.stroke();
    }

    // Kwitnący kwiat lotosu (różowo-złoty)
    if (lb.flower) {
      ctx.save();
      ctx.fillStyle = '#f472b6';
      for (let p = 0; p < 6; p++) {
        const pAng = (p / 6) * Math.PI * 2 + time * 0.12;
        ctx.beginPath();
        ctx.ellipse(lb.x + Math.cos(pAng) * 4, surfY + Math.sin(pAng) * 4, 4.8, 2.6, pAng, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(lb.x, surfY, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // -----------------------------------------------------------------------
  // E. MGLAWE OPARY I PAROWANIE CIEPŁEGO ŚWIĘTEGO ŹRÓDŁA (TRYB 'SCREEN')
  // -----------------------------------------------------------------------
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let m = 0; m < 8; m++) {
    const isWest = (m < 4);
    const baseX = isWest ? (930 + m * 115) : (2230 + (m - 4) * 115);
    const mx = baseX + Math.sin(time * 0.9 + m * 1.4) * 35;
    const my = getWaterSurfaceY(mx, time) - 8;
    const mGrad = ctx.createRadialGradient(mx, my, 8, mx, my, 120);
    mGrad.addColorStop(0.0, 'rgba(204, 251, 241, 0.18)');
    mGrad.addColorStop(0.45, 'rgba(94, 234, 212, 0.07)');
    mGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = mGrad;
    ctx.fillRect(mx - 120, my - 35, 240, 70);
  }
  ctx.restore();

  ctx.restore();
}

// =========================================================================
// 6. STAROŻYTNE RUINY I TARASY (KAMIENNY PIASKOWIEC Z MCHEM)
// =========================================================================
function drawOvergrownStoneTerrace(ctx, x, y, w, h, style, time) {
  ctx.save();
  ctx.shadowBlur = 0;

  const foundationBottomY = 1520;
  // Dla 'center' (Ołtarz Słońca) oraz bocznych tarasów fundament sięga aż do bedrockBottomY (1520 px)!
  const fullH = (style === 'center' || style === 'west' || style === 'east')
    ? (foundationBottomY - y)
    : h;

  // Cień pod tarasem
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(x - 5, y + 6, w + 10, fullH);

  // Kamienne ciosane bloki piaskowca / megality
  const stoneGrad = ctx.createLinearGradient(x, y, x, y + fullH);
  stoneGrad.addColorStop(0.00, '#4a4437');
  stoneGrad.addColorStop(0.18, '#383428');
  stoneGrad.addColorStop(0.55, '#221f17');
  stoneGrad.addColorStop(0.85, '#14120e');
  stoneGrad.addColorStop(1.00, '#060504');

  ctx.fillStyle = stoneGrad;

  if (style === 'center') {
    // Lekko rozszerzająca się ku dołowi piramidalna podstawa ołtarza świątynnego
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w + 8, foundationBottomY);
    ctx.lineTo(x - 8, foundationBottomY);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(x, y, w, fullH);
  }

  // Kamienna fuga / ciosy murarskie
  ctx.strokeStyle = '#181611';
  ctx.lineWidth = 1.8;
  const blockW = 85;
  const blockH = 32;
  for (let by = y; by < y + fullH; by += blockH) {
    ctx.beginPath();
    ctx.moveTo(x - 8, by);
    ctx.lineTo(x + w + 8, by);
    ctx.stroke();

    const rowOffset = ((by - y) / blockH % 2) * (blockW * 0.5);
    for (let bx = x + rowOffset; bx < x + w; bx += blockW) {
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx, Math.min(y + fullH, by + blockH));
      ctx.stroke();
    }
  }

  // Zacieki, glony i zawilgocenie na poziomie wody (dla ołtarza centralnego)
  if (style === 'center') {
    ctx.fillStyle = 'rgba(12, 40, 26, 0.60)';
    ctx.fillRect(x - 6, 1175, w + 12, 24);
  }

  // Złocisty rim-light na górnej krawędzi skierowanej ku słońcu
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.35)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y + 1);
  ctx.lineTo(x + w, y + 1);
  ctx.stroke();

  // Naturalna poduszka mchu i trawy na szczycie tarasu
  drawLushMossyTurf(ctx, x, y, w, 7, false, time);

  // Pnącza i zwisające liście z krawędzi tarasu
  for (let v = 0; v < 6; v++) {
    const vx = x + 35 + v * (w / 6);
    const vLen = 20 + ((v * 17) % 38);
    const sway = Math.sin(time * 1.8 + v) * 4;
    ctx.strokeStyle = '#224016';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(vx, y + 4);
    ctx.quadraticCurveTo(vx + sway * 0.5, y + 4 + vLen * 0.5, vx + sway, y + 4 + vLen);
    ctx.stroke();

    ctx.fillStyle = '#3a6624';
    ctx.beginPath();
    ctx.ellipse(vx + sway, y + 4 + vLen, 4.0, 2.2, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/** Rysuje starożytne kamienne schody / rampę zakorzenioną w litej skale */
function drawAncientStoneRamp(ctx, x, y, w, h, isDown, time = 0) {
  ctx.save();
  ctx.shadowBlur = 0;

  const y0 = y;
  const y1 = y + h;
  const foundationBottomY = 1520;

  // Korpus rampy z fundamentem sięgającym w głąb skały (ZERO wiszenia w powietrzu!)
  const rampGrad = ctx.createLinearGradient(x, Math.min(y0, y1), x, foundationBottomY);
  rampGrad.addColorStop(0.00, '#3f3a2f');
  rampGrad.addColorStop(0.25, '#2c2820');
  rampGrad.addColorStop(0.65, '#181510');
  rampGrad.addColorStop(1.00, '#070605');

  ctx.fillStyle = rampGrad;
  ctx.beginPath();
  ctx.moveTo(x, y0);
  ctx.lineTo(x + w, y1);
  ctx.lineTo(x + w, foundationBottomY);
  ctx.lineTo(x, foundationBottomY);
  ctx.closePath();
  ctx.fill();

  // Stopnie kamienne (schodkowe zaciosy) wzdłuż biegu rampy
  const steps = 8;
  ctx.strokeStyle = '#181510';
  ctx.lineWidth = 1.6;
  for (let s = 1; s < steps; s++) {
    const sx = x + (s / steps) * w;
    const sy = y0 + (s / steps) * h;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy + 30);
    ctx.stroke();
  }

  // Fugi bloków w dolnym fundamencie rampy
  ctx.strokeStyle = 'rgba(20, 17, 12, 0.75)';
  ctx.lineWidth = 1.4;
  for (let fy = Math.max(y0, y1) + 30; fy < foundationBottomY; fy += 36) {
    ctx.beginPath();
    ctx.moveTo(x, fy);
    ctx.lineTo(x + w, fy);
    ctx.stroke();
  }

  // Krawędź biegowa schodów z mchem i rim-lightem
  ctx.strokeStyle = '#274516';
  ctx.lineWidth = 5.0;
  ctx.beginPath();
  ctx.moveTo(x, y0);
  ctx.lineTo(x + w, y1);
  ctx.stroke();

  ctx.strokeStyle = '#4c782b';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(254, 240, 138, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.restore();
}

// =========================================================================
// 7. ORGANICZNY WIELKI BANYAN (ZACHÓD: ROZSZERZAJĄCE SIĘ KORZENIE SZKARPOWE)
// =========================================================================
function drawOrganicBanyanTree(ctx, x, deckY, time) {
  ctx.save();

  // Splot potężnych, wijących się korzeni powietrznych banyanu
  const rootStems = [
    { startX: x - 60, startY: deckY + 40, endX: x - 20, endY: 1160, cpX: x - 10, cpY: deckY + 200, width: 28 },
    { startX: x + 20, startY: deckY + 10, endX: x + 90, endY: 1160, cpX: x + 70, cpY: deckY + 180, width: 36 },
    { startX: x + 90, startY: deckY + 20, endX: x + 220, endY: 1160, cpX: x + 130, cpY: deckY + 220, width: 30 },
    { startX: x + 160, startY: deckY + 50, endX: x + 310, endY: 1160, cpX: x + 240, cpY: deckY + 190, width: 24 }
  ];

  for (let r = 0; r < rootStems.length; r++) {
    const rt = rootStems[r];
    const sway = Math.sin(time * 1.2 + r) * 4;

    ctx.strokeStyle = (r % 2 === 0) ? '#382214' : '#27170e';
    ctx.lineWidth = rt.width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(rt.startX, rt.startY);
    ctx.quadraticCurveTo(rt.cpX + sway, rt.cpY, rt.endX, rt.endY);
    ctx.stroke();

    // Światłocień kory (jasny refleks z lewej strony)
    ctx.strokeStyle = 'rgba(107, 68, 41, 0.40)';
    ctx.lineWidth = rt.width * 0.35;
    ctx.beginPath();
    ctx.moveTo(rt.startX - rt.width * 0.2, rt.startY);
    ctx.quadraticCurveTo(rt.cpX - rt.width * 0.2 + sway, rt.cpY, rt.endX - rt.width * 0.2, rt.endY);
    ctx.stroke();

    // Mszyste porosty na korzeniach
    ctx.strokeStyle = 'rgba(56, 92, 34, 0.50)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(rt.startX + 2, rt.startY + 20);
    ctx.quadraticCurveTo(rt.cpX + 4 + sway, rt.cpY, rt.endX + 2, rt.endY);
    ctx.stroke();
  }

  // Wąskie zwisające wąsy korzeni powietrznych
  for (let t = 0; t < 6; t++) {
    const tx = x + 30 + t * 45;
    const tLen = 90 + ((t * 29) % 140);
    const sway = Math.sin(time * 1.6 + t) * 6;
    ctx.strokeStyle = '#20120a';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(tx, deckY + 30);
    ctx.quadraticCurveTo(tx + sway * 0.5, deckY + 30 + tLen * 0.5, tx + sway, deckY + 30 + tLen);
    ctx.stroke();
  }

  // Dzikie orchidee rosnące w rozwidleniu pnia banyanu
  drawWildOrchidCluster(ctx, x + 35, deckY + 15);
  drawWildOrchidCluster(ctx, x + 145, deckY + 35);

  ctx.restore();
}

// =========================================================================
// 8. STRAŻNICA Z BALI DREWNIANYCH (WSCHÓD)
// =========================================================================
function drawTimberWatchtower(ctx, x, deckY, time) {
  ctx.save();

  // Dwa potężne bale pionowe nośne z widocznymi słojami i cieniowaniem
  const poles = [
    { x: x - 130, yBottom: 1160, yTop: deckY, w: 26 },
    { x: x + 90, yBottom: 1160, yTop: deckY, w: 26 }
  ];

  for (const pole of poles) {
    const pGrad = ctx.createLinearGradient(pole.x, deckY, pole.x + pole.w, deckY);
    pGrad.addColorStop(0.0, '#4a2f1b');
    pGrad.addColorStop(0.4, '#382214');
    pGrad.addColorStop(1.0, '#21130a');

    ctx.fillStyle = pGrad;
    ctx.fillRect(pole.x, pole.yTop, pole.w, pole.yBottom - pole.yTop);

    ctx.strokeStyle = '#170c06';
    ctx.lineWidth = 1.4;
    for (let py = pole.yTop + 20; py < pole.yBottom; py += 35) {
      ctx.beginPath();
      ctx.moveTo(pole.x, py);
      ctx.lineTo(pole.x + pole.w, py + 4);
      ctx.stroke();
    }
  }

  // Masywne zastrzały ukośne wiązane linami
  ctx.strokeStyle = '#382214';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 120, deckY + 25);
  ctx.lineTo(x + 100, deckY + 180);
  ctx.moveTo(x + 80, deckY + 25);
  ctx.lineTo(x - 100, deckY + 180);
  ctx.stroke();

  // Węzły linowe na łączeniu belek
  ctx.fillStyle = '#85542b';
  ctx.fillRect(x - 18, deckY + 95, 18, 14);
  ctx.strokeStyle = '#543319';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(x - 18, deckY + 95, 18, 14);

  // Pnącza wspinające się po balach strażnicy
  for (let pole of poles) {
    ctx.strokeStyle = '#274719';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(pole.x + 8, pole.yBottom);
    for (let y = pole.yBottom - 20; y > pole.yTop + 10; y -= 35) {
      ctx.lineTo(pole.x + (y % 2 === 0 ? 18 : 2), y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

// =========================================================================
// 9. POMOSTY DREWNIANE: CIOSANE DESKI, WSPORNIKI I ZWISISTE LIANY
// =========================================================================
function drawHardwoodPlatform(ctx, x, y, w, h, isMain, time) {
  ctx.save();

  // Drewniane wsporniki / zastrzały pod pomostem (zamiast płaskiego klocka)
  const bracketStep = Math.max(90, Math.min(130, w / 4));
  for (let bx = x + 35; bx < x + w - 15; bx += bracketStep) {
    ctx.fillStyle = '#22140a';
    ctx.beginPath();
    ctx.moveTo(bx - 10, y + h);
    ctx.lineTo(bx + 10, y + h);
    ctx.lineTo(bx, y + h + 24);
    ctx.closePath();
    ctx.fill();
  }

  // Belka nośna (spatynowany palisander / drewno tekowe)
  const woodGrad = ctx.createLinearGradient(x, y, x, y + h);
  woodGrad.addColorStop(0.0, '#543620');
  woodGrad.addColorStop(0.3, '#3d2515');
  woodGrad.addColorStop(0.8, '#26150b');
  woodGrad.addColorStop(1.0, '#170c06');

  ctx.fillStyle = woodGrad;
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 3);
  else ctx.rect(x, y, w, h);
  ctx.fill();

  // Ciosane deski i szczeliny co ~30 px
  ctx.strokeStyle = '#170c06';
  ctx.lineWidth = 1.8;
  for (let px = x + 30; px < x + w; px += 30) {
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px, y + h);
    ctx.stroke();

    // Mosiężne / żelazne ćwieki
    ctx.fillStyle = '#784620';
    ctx.beginPath();
    ctx.arc(px - 15, y + 5, 1.5, 0, Math.PI * 2);
    ctx.arc(px - 15, y + h - 5, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wierzchnia krawędź biegowa: cieniowany mech, źdźbła trawy i złocisty rim light
  drawLushMossyTurf(ctx, x, y, w, 6, true, time);

  // Zwisające pnącza pod krawędzią desek
  const vineSteps = Math.floor(w / 45);
  for (let v = 0; v < vineSteps; v++) {
    if (v % 2 === 0) continue;
    const vx = x + 20 + v * 45;
    const vLen = 14 + ((v * 19) % 32);
    const sway = Math.sin(time * 1.8 + vx * 0.02) * 5;

    ctx.strokeStyle = '#1e3812';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(vx, y + h);
    ctx.quadraticCurveTo(vx + sway * 0.5, y + h + vLen * 0.5, vx + sway, y + h + vLen);
    ctx.stroke();

    ctx.fillStyle = '#365c22';
    ctx.beginPath();
    ctx.arc(vx + sway, y + h + vLen, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// =========================================================================
// 10. WISZĄCY MOST LINOWY: NATURALNA KRZYWA ŁAŃCUCHOWA, DESKI I LIANY
// =========================================================================
function drawRealisticRopeBridge(ctx, p0, p1, p2, time) {
  ctx.save();

  // Drewniane słupki kotwiczące most po obu stronach
  drawBridgeAnchorPost(ctx, p0.x - 14, p0.y - 36, 16, 44);
  drawBridgeAnchorPost(ctx, p2.x - 2, p2.y - 36, 16, 44);

  // 1. Dolna gruba spleciona lina nośna (krzywa łańcuchowa z quadraticCurveTo)
  ctx.strokeStyle = '#2b1b10';
  ctx.lineWidth = 9.0;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y + 6);
  ctx.quadraticCurveTo(p1.x, p1.y + 9, p2.x, p2.y + 6);
  ctx.stroke();

  // Jasny oplot liny konopnej
  ctx.strokeStyle = '#5a3b23';
  ctx.lineWidth = 5.0;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y + 5);
  ctx.quadraticCurveTo(p1.x, p1.y + 8, p2.x, p2.y + 5);
  ctx.stroke();

  // 2. Górna lina poręczowa (handrail) 28 px wyżej
  const hOff = -28;
  ctx.strokeStyle = '#362113';
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y + hOff);
  ctx.quadraticCurveTo(p1.x, p1.y + hOff, p2.x, p2.y + hOff);
  ctx.stroke();

  ctx.strokeStyle = '#71472a';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // 3. Drewniane szczeble pomostu ze zmiennym odstępem i zróżnicowanymi odcieniami starego drewna
  const segs = 22;
  const plankTints = ['#4a2e1a', '#3f2615', '#553620', '#3a2212'];

  for (let s = 1; s < segs; s++) {
    const t = s / segs;
    const inv = 1 - t;
    const bx = inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x;
    const by = inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y;

    // Pionowa linka nośna (dropper) wiążąca poręcz z deskami
    ctx.strokeStyle = 'rgba(84, 51, 27, 0.85)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(bx, by + hOff);
    ctx.lineTo(bx, by);
    ctx.stroke();

    // Cień deski
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(bx - 6, by + 4, 12, 4);

    // Pojedyncza deska z patyną starego drewna
    ctx.fillStyle = plankTints[s % plankTints.length];
    ctx.fillRect(bx - 6, by - 2, 12, 7);

    // Krawędź deski i słoje
    ctx.strokeStyle = '#633c23';
    ctx.lineWidth = 0.9;
    ctx.strokeRect(bx - 6, by - 2, 12, 7);

    // Zielone pnącza oplatające liny mostu na brzegach i w środku
    if (s % 3 === 0) {
      const vLen = 14 + ((s * 13) % 24);
      const sway = Math.sin(time * 2.0 + s) * 4;
      ctx.strokeStyle = '#244516';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(bx, by + 5);
      ctx.quadraticCurveTo(bx + sway * 0.5, by + 5 + vLen * 0.5, bx + sway, by + 5 + vLen);
      ctx.stroke();

      ctx.fillStyle = '#3a6624';
      ctx.beginPath();
      ctx.arc(bx + sway, by + 5 + vLen, 2.0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/** Słupek mocujący linę na krawędzi platformy */
function drawBridgeAnchorPost(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#2b1b10';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#472d1a';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x, y, w, h);

  // Oplot ze zwojów liny wokół słupka
  ctx.fillStyle = '#7a4e2c';
  for (let r = 0; r < 3; r++) {
    ctx.fillRect(x - 2, y + 12 + r * 6, w + 4, 3.5);
  }
  ctx.restore();
}

// =========================================================================
// 11. CENTRALNA ŚWIĄTYNIA SŁOŃCA (CYTADELA, SKALNE PODBRZUSZE, KOLUMNY, OŁTARZ)
// =========================================================================
function drawAncientSunTemple(ctx, time) {
  ctx.save();

  // 1. LEWITUJĄCE MASYWY SKALNE POD WSPORNIKAMI SKRZYDEŁ TARASU (x: 1275-1425 i 2175-2325)
  // Likwidacja zablokowania wnętrza! Kile skalne znajdują się pod skrzydłami zewnętrznymi
  drawFloatingRockIslandKeel(ctx, 1275, 780, 150, 55, 125, 3, time);
  drawFloatingRockIslandKeel(ctx, 2175, 780, 150, 55, 125, 5, time);

  // 2. GŁÓWNY TARAS ŚWIĄTYNNY (x: 1300-2300, y: 740-780)
  const terraceGrad = ctx.createLinearGradient(1300, 740, 1300, 780);
  terraceGrad.addColorStop(0.0, '#4a4336');
  terraceGrad.addColorStop(0.4, '#363126');
  terraceGrad.addColorStop(1.0, '#1c1a14');

  ctx.fillStyle = terraceGrad;
  ctx.fillRect(1300, 740, 1000, 40);

  // Rzeźbiony fryz geometryczny na czole tarasu
  ctx.strokeStyle = '#211d16';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(1300, 740, 1000, 40);

  // Kamienne płaskorzeźby spiralne wzdłuż krawędzi tarasu
  ctx.strokeStyle = 'rgba(180, 150, 100, 0.22)';
  ctx.lineWidth = 1.4;
  for (let fx = 1320; fx < 2280; fx += 40) {
    ctx.strokeRect(fx, 748, 24, 24);
    ctx.strokeRect(fx + 6, 754, 12, 12);
  }

  // Szmaragdowo-złoty akcent świetlny ("rim light") na górnej krawędzi tarasu
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.40)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(1300, 741);
  ctx.lineTo(2300, 741);
  ctx.stroke();

  // Gęsty cieniowany mech i trawa na szczycie tarasu
  drawLushMossyTurf(ctx, 1300, 740, 1000, 8, false, time);

  // 3. MONUMENTALNE KAMIENNE FILARY Z RELIEFAMI I RUNAMI (x: 1420 i 2100)
  const pillars = [1420, 2100];
  for (let pIdx = 0; pIdx < pillars.length; pIdx++) {
    const px = pillars[pIdx];

    // Cień filaru
    ctx.fillStyle = 'rgba(0, 0, 0, 0.50)';
    ctx.fillRect(px - 4, 780, 88, 280);

    const pilGrad = ctx.createLinearGradient(px, 780, px + 80, 780);
    pilGrad.addColorStop(0.0, '#3f382c');
    pilGrad.addColorStop(0.3, '#4a4335');
    pilGrad.addColorStop(0.7, '#332e24');
    pilGrad.addColorStop(1.0, '#1c1913');

    ctx.fillStyle = pilGrad;
    ctx.fillRect(px, 780, 80, 280);

    // Kanelury pionowe i reliefy
    ctx.strokeStyle = '#17140f';
    ctx.lineWidth = 1.8;
    for (let k = 1; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(px + k * 20, 780);
      ctx.lineTo(px + k * 20, 1060);
      ctx.stroke();
    }

    // Mistyczne, pulsujące runy słoneczne wyryte w filarach
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const runePulse = 0.55 + 0.35 * Math.sin(time * 2.4 + pIdx * 1.5);
    ctx.strokeStyle = `rgba(253, 224, 71, ${runePulse})`;
    ctx.lineWidth = 2.0;

    for (let ry = 810; ry < 1040; ry += 55) {
      ctx.beginPath();
      ctx.moveTo(px + 30, ry);
      ctx.lineTo(px + 40, ry - 12);
      ctx.lineTo(px + 50, ry);
      ctx.moveTo(px + 33, ry - 6);
      ctx.lineTo(px + 47, ry - 6);
      ctx.stroke();
    }
    ctx.restore();

    // Pnącza i korzenie oplatające filary
    ctx.strokeStyle = '#274719';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(px + 10, 1060);
    for (let py = 1040; py > 790; py -= 35) {
      ctx.lineTo(px + ((py / 35) % 2 === 0 ? 65 : 15), py);
    }
    ctx.stroke();
  }

  // 4. DOLNA KRYPTA ŚWIĄTYNNA (TUNEL DOLNY, x: 1580-2020, y: 920-950)
  const cryptGrad = ctx.createLinearGradient(1580, 920, 1580, 950);
  cryptGrad.addColorStop(0.00, '#423b2f');
  cryptGrad.addColorStop(0.40, '#2e2920');
  cryptGrad.addColorStop(1.00, '#191611');
  ctx.fillStyle = cryptGrad;
  ctx.fillRect(1580, 920, 440, 30);

  ctx.strokeStyle = '#17140f';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(1580, 920, 440, 30);

  // Kamienne wsporniki / kroksztyny pod belką stropową krypty
  for (let cx = 1620; cx < 2000; cx += 70) {
    ctx.fillStyle = '#1b1712';
    ctx.beginPath();
    ctx.moveTo(cx - 8, 950);
    ctx.lineTo(cx + 8, 950);
    ctx.lineTo(cx, 966);
    ctx.closePath();
    ctx.fill();
  }

  drawLushMossyTurf(ctx, 1580, 920, 440, 5, false, time);

  // 5. ŚWIĘTY OŁTARZ SOLARNY (x: 1550-2050, y: 580-612)
  const altarGrad = ctx.createLinearGradient(1550, 580, 1550, 612);
  altarGrad.addColorStop(0.0, '#574f3e');
  altarGrad.addColorStop(0.4, '#3f392c');
  altarGrad.addColorStop(1.0, '#26221a');

  ctx.fillStyle = altarGrad;
  if (ctx.roundRect) ctx.roundRect(1550, 580, 500, 32, 4);
  else ctx.rect(1550, 580, 500, 32);
  ctx.fill();

  // Złocisty rim-light na ołtarzu
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(1550, 581);
  ctx.lineTo(2050, 581);
  ctx.stroke();

  drawLushMossyTurf(ctx, 1550, 580, 500, 6, false, time);

  // 6. PŁONĄCE KAMIENNE CZARY OFIARNE (BRAZIERS)
  drawStoneFireBrazier(ctx, 1575, 580, time);
  drawStoneFireBrazier(ctx, 2025, 580, time + 1.4);

  // 7. CENTRALNY ARTEFAKT: RZEŹBIONY ZŁOTY DYSK SOLARNY Z RUNAMI I CIEPŁĄ POŚWIATĄ
  drawCarvedSunDiscMedallion(ctx, 1800, 660, 48, time);

  // 8. GÓRNE NADPROŻE MEGALITU SŁONECZNEGO (SNAJPER, x: 1680, w: 240, y: 430)
  ctx.fillStyle = '#3a3429';
  ctx.fillRect(1705, 452, 26, 128);
  ctx.fillRect(1869, 452, 26, 128);

  ctx.strokeStyle = '#17140f';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(1705, 452, 26, 128);
  ctx.strokeRect(1869, 452, 26, 128);

  const lintelGrad = ctx.createLinearGradient(1680, 430, 1680, 452);
  lintelGrad.addColorStop(0.0, '#5a5140');
  lintelGrad.addColorStop(0.5, '#3d372b');
  lintelGrad.addColorStop(1.0, '#26221a');
  ctx.fillStyle = lintelGrad;
  ctx.fillRect(1680, 430, 240, 22);

  ctx.strokeStyle = 'rgba(254, 240, 138, 0.40)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(1680, 431);
  ctx.lineTo(1920, 431);
  ctx.stroke();

  drawLushMossyTurf(ctx, 1680, 430, 240, 5, false, time);

  ctx.restore();
}

// =========================================================================
// 12. CENTRALNY ARTEFAKT: RZEŹBIONY ZŁOTY DYSK SOLARNY (PUNKT KULMINACYJNY SCENY)
// =========================================================================
function drawCarvedSunDiscMedallion(ctx, cx, cy, r, time) {
  ctx.save();
  ctx.shadowBlur = 0;

  // 1. PULSUJĄCA, CIEPŁA RADIALNA POŚWIATA BÓSTWA SŁONECZNEGO (TRYB 'SCREEN')
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const pulse = 0.82 + 0.18 * Math.sin(time * 2.2);

  // Szeroka, rozproszona łuna złoto-bursztynowa
  const glowAura = ctx.createRadialGradient(cx, cy, 6, cx, cy, r * 3.4);
  glowAura.addColorStop(0.00, `rgba(253, 224, 71, ${0.72 * pulse})`);
  glowAura.addColorStop(0.28, `rgba(245, 158, 11, ${0.40 * pulse})`);
  glowAura.addColorStop(0.65, `rgba(217, 119, 6, ${0.14 * pulse})`);
  glowAura.addColorStop(1.00, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = glowAura;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. ZEWNĘTRZNY PIERŚCIEŃ Z CIEMNEGO RZEŹBIONEGO BAZALTU Z MISTYCZNYMI RUNAMI
  ctx.fillStyle = '#221e17';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#120f0a';
  ctx.lineWidth = 2.8;
  ctx.stroke();

  // 3. ŚWIECĄCE RUNY WYRYTE W KAMIENNYM COKOLE WOKÓŁ DYSKU (TRYB 'SCREEN')
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const runeCount = 12;
  const runeR = r * 0.90;
  for (let i = 0; i < runeCount; i++) {
    const ang = (i / runeCount) * Math.PI * 2;
    const rx = cx + Math.cos(ang) * runeR;
    const ry = cy + Math.sin(ang) * runeR;

    const rGlow = 0.45 + 0.50 * (0.5 + 0.5 * Math.sin(time * 3.0 + i * 0.7));
    ctx.strokeStyle = `rgba(254, 240, 138, ${rGlow})`;
    ctx.lineWidth = 1.6;

    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(ang + Math.PI * 0.5);
    ctx.beginPath();
    ctx.moveTo(-3, 3);
    ctx.lineTo(0, -3);
    ctx.lineTo(3, 3);
    ctx.moveTo(-2, 0);
    ctx.lineTo(2, 0);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // 4. WEWNĘTRZNY MEDALION ZE STAREGO, PATYNOWANEGO ZŁOTA / BRĄZU
  const discGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  discGrad.addColorStop(0.00, '#fef08a');
  discGrad.addColorStop(0.28, '#facc15');
  discGrad.addColorStop(0.65, '#ca8a04');
  discGrad.addColorStop(1.00, '#713f12');

  ctx.fillStyle = discGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
  ctx.fill();

  // 5. RZEŹBIONE KONCENTRYCZNE KRĘGI ASTRONOMICZNE (KALENDARZ SOLARNY)
  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.60, 0, Math.PI * 2);
  ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
  ctx.stroke();

  // 6. RZEŹBIONE PROMIENIE SŁONECZNE O ZMIENNEJ DŁUGOŚCI (SOLAR FLARES)
  const rayCount = 16;
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 2.4;
  for (let i = 0; i < rayCount; i++) {
    const ang = (i / rayCount) * Math.PI * 2 + time * 0.25;
    const r1 = r * 0.80;
    const r2 = r * 1.15 + (i % 2 === 0 ? 6 : 0);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
    ctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
    ctx.stroke();
  }

  // 7. ŚWIĘTE CENTRUM / JĄDRO SŁOŃCA (BIŁY BURSZTYN / SOLITARY JEWEL)
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.24);
  coreGrad.addColorStop(0.0, '#ffffff');
  coreGrad.addColorStop(0.6, '#fef9c3');
  coreGrad.addColorStop(1.0, '#eab308');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.24, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// =========================================================================
// 13. KAMIENNA MISA OFIARNA Z ŻYWYM OGNIEM I ISKRAMI (BRAZIER)
// =========================================================================
function drawStoneFireBrazier(ctx, cx, baseY, time) {
  ctx.save();

  // Kamienna czara
  ctx.fillStyle = '#2b261d';
  ctx.beginPath();
  ctx.moveTo(cx - 18, baseY);
  ctx.lineTo(cx + 18, baseY);
  ctx.lineTo(cx + 12, baseY - 20);
  ctx.lineTo(cx - 12, baseY - 20);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#473e30';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Żar wewnątrz czary
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(cx - 9, baseY - 22, 18, 4);

  // Dynamiczne wielowarstwowe płomienie ognia (tryb 'screen')
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const flameH = 26 + Math.sin(time * 9.0) * 6;
  const flameW = 11 + Math.cos(time * 7.5) * 3;

  const fGrad = ctx.createLinearGradient(cx, baseY - 20, cx, baseY - 20 - flameH);
  fGrad.addColorStop(0.0, '#ea580c');
  fGrad.addColorStop(0.4, '#facc15');
  fGrad.addColorStop(0.85, '#fef08a');
  fGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = fGrad;
  ctx.beginPath();
  ctx.moveTo(cx - flameW, baseY - 20);
  ctx.quadraticCurveTo(cx - flameW * 0.3, baseY - 20 - flameH * 0.6, cx, baseY - 20 - flameH);
  ctx.quadraticCurveTo(cx + flameW * 0.3, baseY - 20 - flameH * 0.6, cx + flameW, baseY - 20);
  ctx.closePath();
  ctx.fill();

  // Ciepła radialna łuna ognia rozświetlająca otoczenie
  const glowGrad = ctx.createRadialGradient(cx, baseY - 28, 3, cx, baseY - 28, 45);
  glowGrad.addColorStop(0.0, 'rgba(251, 146, 60, 0.45)');
  glowGrad.addColorStop(0.55, 'rgba(234, 179, 8, 0.18)');
  glowGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, baseY - 28, 45, 0, Math.PI * 2);
  ctx.fill();

  // Płonące iskry unoszące się ku górze
  for (let s = 0; s < 3; s++) {
    const sPhase = (time * 2.5 + s * 0.7) % 1.0;
    const sx = cx + Math.sin(time * 4.0 + s) * 8;
    const sy = (baseY - 24) - sPhase * 38;
    const sAlpha = (1.0 - sPhase) * 0.9;
    ctx.fillStyle = `rgba(254, 240, 138, ${sAlpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}

// =========================================================================
// 14. TAKTYCZNE ZAWIESZONE MSZYSTE GŁAZY (ORGANICZNE LEWITUJĄCE SKAŁY)
// =========================================================================
function drawOvergrownSuspendedRock(ctx, x, y, w, h, time, seed = 1) {
  ctx.save();

  // Stalagmitowo-krasowe podbrzusze zawieszonego głazu (likwidacja płaskiego dołu)
  drawFloatingRockIslandKeel(ctx, x, y + h - 2, w, 35, 68, seed, time);

  // Korpus głazu ze spatynowanego kamienia piaskowcowego
  const rockGrad = ctx.createLinearGradient(x, y, x, y + h);
  rockGrad.addColorStop(0.0, '#4a4336');
  rockGrad.addColorStop(0.4, '#363126');
  rockGrad.addColorStop(1.0, '#1f1c15');

  ctx.fillStyle = rockGrad;
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 4);
  else ctx.rect(x, y, w, h);
  ctx.fill();

  // Szmaragdowy rim-light na górnej krawędzi głazu
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y + 1);
  ctx.lineTo(x + w, y + 1);
  ctx.stroke();

  // Poduszka mchu i trawy na szczycie głazu
  drawLushMossyTurf(ctx, x, y, w, 6, false, time);

  ctx.restore();
}

// =========================================================================
// 15. DZIKIE TROPIKALNE ORCHIDEE
// =========================================================================
function drawWildOrchidCluster(ctx, cx, cy) {
  ctx.save();
  const flowerCols = ['#ec4899', '#f43f5e', '#d946ef'];
  for (let i = 0; i < 3; i++) {
    const fx = cx + (i - 1) * 9;
    const fy = cy + (i % 2) * 5;
    const col = flowerCols[i];

    ctx.fillStyle = col;
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

/** Zaślepka dla usuniętych snopów światła (60 FPS kompatybilność) */
function drawVolumetricForegroundLight() {}

// =========================================================================
// RENDEROWANIE I HOOKI CYKLU ŻYCIA ARENY 2
// =========================================================================
export function drawArena2Background(ctx, camera) {
  drawPandoraBackground(ctx, camera);
}

export function drawArena2Foreground(ctx, camera) {
  renderPandoraTerrain(ctx, camera);
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
// KONTRAKT ARENY 2 (PLUGIN DEFINITION)
// =========================================================================
const arena2 = {
  id: 'arena-2',
  alias: 'ARENA_2_PANDORA',
  name: 'Święta Dżungla (Ancient Sanctuary)',
  width: 3600,
  height: 1400,
  spawns: [
    { x: 500, y: 710 },  // Spawn gracza (Cyan) - Wielki Banyan (platforma zachodnia)
    { x: 3060, y: 710 }  // Spawn bota (Orange) - Strażnica w Drzewach (platforma wschodnia)
  ],
  platforms: ARENA_2_PANDORA_PLATFORMS,
  customObjects: [
    ...ARENA_2_PANDORA_GOALS
  ],
  drawBackground(ctx, camera) {
    drawArena2Background(ctx, camera);
  },
  draw(ctx, camera) {
    drawArena2Foreground(ctx, camera);
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
