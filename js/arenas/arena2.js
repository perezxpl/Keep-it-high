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
// ATMOSFERYCZNE CZĄSTECZKI DŻUNGLI (ZOPTYMALIZOWANE DO 20 SZTUK)
// =========================================================================
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

// =========================================================================
// GŁÓWNA PROCEDURA RENDEROWANIA TERENU DŻUNGLI
// =========================================================================
export function renderPandoraTerrain(ctx, camera) {
  if (!ctx) return;
  ctx.shadowBlur = 0;
  const time = performance.now() * 0.001;

  // 1. Pływający w powietrzu złoty pyłek i świetliki dżungli (zoptymalizowane)
  drawAtmosphericPollenAndFireflies(ctx, time);

  // 2. Podłoże: kamienne ciosane płyty, naturalne uskoki i zintegrowane korzenie
  drawJungleGroundBedrock(ctx, time);

  // 3. Zrujnowane podwyższone tarasy i schody na poziomie gruntu
  drawOvergrownStoneTerrace(ctx, 180, 1040, 450, 120, 'west', time);
  drawAncientStoneRamp(ctx, 630, 1040, 180, 120, true);
  drawOvergrownStoneTerrace(ctx, 1400, 1060, 800, 120, 'center', time);
  drawAncientStoneRamp(ctx, 2790, 1160, 180, -120, false);
  drawOvergrownStoneTerrace(ctx, 2970, 1040, 450, 120, 'east', time);

  // 4. Lewa flanka: organiczny splot korzeni Banyanu i drewniane platformy nadrzewne
  drawOrganicBanyanTree(ctx, 120, 780, time);
  drawHardwoodPlatform(ctx, 260, 780, 540, 36, true, time);
  drawHardwoodPlatform(ctx, 340, 600, 260, 22, false, time);
  drawHardwoodPlatform(ctx, 580, 440, 180, 20, false, time);

  // 5. Prawa flanka: drewniana strażnica z bali i platformy w koronach drzew
  drawTimberWatchtower(ctx, 3070, 780, time);
  drawHardwoodPlatform(ctx, 2800, 780, 540, 36, true, time);
  drawHardwoodPlatform(ctx, 3000, 600, 260, 22, false, time);
  drawHardwoodPlatform(ctx, 2840, 440, 180, 20, false, time);

  // 6. Wiszące mosty linowe ze splecionych lin i drewnianych szczebli
  drawRealisticRopeBridge(ctx, { x: 800, y: 780 }, { x: 1050, y: 815 }, { x: 1300, y: 740 }, time);
  drawRealisticRopeBridge(ctx, { x: 2300, y: 740 }, { x: 2550, y: 815 }, { x: 2800, y: 780 }, time);

  // 7. Centralna Świątynia Słońca (kamienne rzeźbione kolumny, reliefy, Złoty Dysk i płonące czary)
  drawAncientSunTemple(ctx, time);

  // 8. Taktyczne zawieszone mszyste głazy pośrednie
  drawOvergrownSuspendedRock(ctx, 880, 950, 180, 24, time);
  drawOvergrownSuspendedRock(ctx, 2540, 950, 180, 24, time + 2.0);

  // 9. (Usunięto przednie pomarańczowe pionowe snopy światła słonecznego)
}

// =========================================================================
// 1. ZŁOTY PYŁEK I ŚWIETLIKI DŻUNGLI (PŁASKIE RENDEROWANIE BEZ GRADIENTÓW I CIENI)
// =========================================================================
function drawAtmosphericPollenAndFireflies(ctx, time) {
  ctx.save();
  ctx.shadowBlur = 0;
  for (let i = 0; i < _jungleFireflies.length; i++) {
    const ff = _jungleFireflies[i];
    const driftX = ff.baseX + Math.sin(time * ff.swaySpeed + ff.phase) * ff.swayAmp + Math.sin(time * 0.35 + i) * 10;
    const driftY = ((ff.baseY + time * ff.vy) % 1050 + 1050) % 1050 + 260;

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
// 2. PODŁOŻE DŻUNGLI: KAMIENNE PŁYTY I TRANSPARENTNY BASEN ŚWIĄTYNNY
// =========================================================================
function drawJungleGroundBedrock(ctx, time) {
  ctx.save();

  // A. Płyty kamienne po lewej (x: 0-900) i prawej (x: 2700-3600)
  // Zamiast jednolitego czarnego bloku: teksturowana podstawa z cieniowaniem w dół
  const groundSlabs = [
    { x: 0, w: 900, y: 1160, h: 240 },
    { x: 2700, w: 900, y: 1160, h: 240 }
  ];

  for (const slab of groundSlabs) {
    const sGrad = ctx.createLinearGradient(slab.x, slab.y, slab.x, slab.y + slab.h);
    sGrad.addColorStop(0.0, '#383226');
    sGrad.addColorStop(0.18, '#26221a');
    sGrad.addColorStop(0.65, '#17140f');
    sGrad.addColorStop(1.0, 'rgba(12, 10, 8, 0.85)');

    ctx.fillStyle = sGrad;
    ctx.fillRect(slab.x, slab.y, slab.w, slab.h);

    // Krawędź ciosanych bloków i pęknięcia
    ctx.strokeStyle = 'rgba(20, 18, 14, 0.75)';
    ctx.lineWidth = 1.8;
    for (let bx = slab.x + 60; bx < slab.x + slab.w; bx += 90) {
      ctx.beginPath();
      ctx.moveTo(bx, slab.y);
      ctx.lineTo(bx + 12, slab.y + 70);
      ctx.lineTo(bx - 6, slab.y + 140);
      ctx.stroke();
    }

    // Poduszka mchu na górnej krawędzi (ciepła zieleń leśna z nieregularnymi kępkami)
    drawMossyEdge(ctx, slab.x, slab.y, slab.w, 8);
  }

  // B. Krystaliczny Święty Basen w centralnym dziedzińcu (x: 900-2700, y: 1180-1260)
  // Transparentna tafla wody ukazująca głębię z tła zamiast płaskiej niebieskiej plamy
  const waterGrad = ctx.createLinearGradient(900, 1180, 900, 1260);
  waterGrad.addColorStop(0.0, 'rgba(13, 148, 136, 0.40)');
  waterGrad.addColorStop(0.35, 'rgba(15, 118, 110, 0.55)');
  waterGrad.addColorStop(0.75, 'rgba(17, 94, 89, 0.70)');
  waterGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.88)');

  ctx.fillStyle = waterGrad;
  ctx.fillRect(900, 1180, 1800, 80);

  // Kamienne brzegi basenu z lewej i prawej (x: 885-905, 2695-2715)
  ctx.fillStyle = '#26221a';
  ctx.fillRect(895, 1160, 15, 90);
  ctx.fillRect(2690, 1160, 15, 90);

  // Animowane smugi refleksów światła słonecznego na tafli wody
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.strokeStyle = 'rgba(204, 251, 241, 0.45)';
  ctx.lineWidth = 1.5;
  for (let w = 0; w < 16; w++) {
    const waveX = 930 + w * 110 + Math.sin(time * 1.6 + w * 0.7) * 24;
    const waveY = 1186 + (w % 4) * 14;
    const waveW = 35 + (w % 3) * 15;
    ctx.beginPath();
    ctx.moveTo(waveX, waveY);
    ctx.quadraticCurveTo(waveX + waveW * 0.5, waveY - 2.5, waveX + waveW, waveY);
    ctx.stroke();
  }
  ctx.restore();

  // Naturalne lilie wodne i liście lotosu z żyłkowaniem
  const lotusBeds = [
    { x: 970, y: 1192, r: 15 },
    { x: 1080, y: 1198, r: 18, flower: true },
    { x: 1220, y: 1190, r: 14 },
    { x: 2360, y: 1194, r: 16, flower: true },
    { x: 2490, y: 1188, r: 14 },
    { x: 2620, y: 1196, r: 17, flower: true }
  ];

  for (const lb of lotusBeds) {
    // Cień liścia na wodzie
    ctx.fillStyle = 'rgba(10, 20, 25, 0.45)';
    ctx.beginPath();
    ctx.arc(lb.x + 2, lb.y + 3, lb.r, 0, Math.PI * 2);
    ctx.fill();

    // Liść lotosu
    ctx.fillStyle = '#2d5a27';
    ctx.beginPath();
    ctx.arc(lb.x, lb.y, lb.r, 0.35, Math.PI * 2 - 0.35);
    ctx.lineTo(lb.x, lb.y);
    ctx.closePath();
    ctx.fill();

    // Żyłki liścia
    ctx.strokeStyle = '#417a36';
    ctx.lineWidth = 1.0;
    for (let a = 0; a < 5; a++) {
      const ang = (a / 5) * Math.PI * 1.8 + 0.5;
      ctx.beginPath();
      ctx.moveTo(lb.x, lb.y);
      ctx.lineTo(lb.x + Math.cos(ang) * lb.r * 0.9, lb.y + Math.sin(ang) * lb.r * 0.9);
      ctx.stroke();
    }

    // Kwiat lotosu z miękkimi różowo-białymi płatkami
    if (lb.flower) {
      ctx.save();
      ctx.fillStyle = '#f472b6';
      for (let p = 0; p < 6; p++) {
        const pAng = (p / 6) * Math.PI * 2 + time * 0.1;
        ctx.beginPath();
        ctx.ellipse(lb.x + Math.cos(pAng) * 4, lb.y + Math.sin(pAng) * 4, 4.5, 2.5, pAng, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(lb.x, lb.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Delikatna mgła unosząca się nad taflą wody
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let m = 0; m < 5; m++) {
    const mx = 980 + m * 330 + Math.sin(time * 0.8 + m) * 40;
    const my = 1184;
    const mGrad = ctx.createRadialGradient(mx, my, 10, mx, my, 110);
    mGrad.addColorStop(0.0, 'rgba(204, 251, 241, 0.14)');
    mGrad.addColorStop(0.5, 'rgba(94, 234, 212, 0.06)');
    mGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = mGrad;
    ctx.fillRect(mx - 110, my - 30, 220, 60);
  }
  ctx.restore();

  ctx.restore();
}

// =========================================================================
// 3. STAROŻYTNE RUINY I TARASY (KAMIENNY PIASKOWIEC Z MCHEM)
// =========================================================================
function drawOvergrownStoneTerrace(ctx, x, y, w, h, style, time) {
  ctx.save();
  // Cień pod tarasem
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(x - 4, y + 6, w + 8, h);

  // Kamienne ciosane bloki piaskowca (ciepły piaskowiec zharmonizowany z tłem)
  const stoneGrad = ctx.createLinearGradient(x, y, x, y + h);
  stoneGrad.addColorStop(0.0, '#4a4437');
  stoneGrad.addColorStop(0.3, '#383428');
  stoneGrad.addColorStop(0.7, '#27241b');
  stoneGrad.addColorStop(1.0, '#191711');
  ctx.fillStyle = stoneGrad;
  ctx.fillRect(x, y, w, h);

  // Kamienna fuga / ciosy murarskie
  ctx.strokeStyle = '#181611';
  ctx.lineWidth = 1.8;
  const blockW = 85;
  const blockH = 32;
  for (let by = y; by < y + h; by += blockH) {
    ctx.beginPath();
    ctx.moveTo(x, by);
    ctx.lineTo(x + w, by);
    ctx.stroke();

    const rowOffset = ((by - y) / blockH % 2) * (blockW * 0.5);
    for (let bx = x + rowOffset; bx < x + w; bx += blockW) {
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx, Math.min(y + h, by + blockH));
      ctx.stroke();
    }
  }

  // Wyszczerbienia, pęknięcia i zwietrzenia kamienia
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.0;
  for (let c = 0; c < 4; c++) {
    const cx = x + 35 + c * 105;
    ctx.beginPath();
    ctx.moveTo(cx, y + 8);
    ctx.lineTo(cx + 14, y + 26);
    ctx.lineTo(cx + 8, y + 42);
    ctx.stroke();
  }

  // Naturalna poduszka mchu na szczycie tarasu
  drawMossyEdge(ctx, x, y, w, 7);

  // Pnącza i zwisające liście z krawędzi tarasu
  for (let v = 0; v < 5; v++) {
    const vx = x + 40 + v * (w / 5);
    const vLen = 18 + ((v * 17) % 36);
    const sway = Math.sin(time * 1.8 + v) * 4;
    ctx.strokeStyle = '#224016';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(vx, y + 4);
    ctx.quadraticCurveTo(vx + sway * 0.5, y + 4 + vLen * 0.5, vx + sway, y + 4 + vLen);
    ctx.stroke();

    // Liść na końcu pnącza
    ctx.fillStyle = '#3a6624';
    ctx.beginPath();
    ctx.ellipse(vx + sway, y + 4 + vLen, 4.0, 2.2, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/** Rysuje starożytne kamienne schody / rampę */
function drawAncientStoneRamp(ctx, x, y, w, h, isDown) {
  ctx.save();
  const y0 = y;
  const y1 = y + h;

  // Korpus rampy
  const rampGrad = ctx.createLinearGradient(x, Math.min(y0, y1), x + w, Math.max(y0, y1));
  rampGrad.addColorStop(0.0, '#3f3a2f');
  rampGrad.addColorStop(0.5, '#2c2820');
  rampGrad.addColorStop(1.0, '#1c1913');

  ctx.fillStyle = rampGrad;
  ctx.beginPath();
  ctx.moveTo(x, y0);
  ctx.lineTo(x + w, y1);
  ctx.lineTo(x + w, Math.max(y0, y1) + 40);
  ctx.lineTo(x, Math.max(y0, y1) + 40);
  ctx.closePath();
  ctx.fill();

  // Stopnie kamienne (schodkowe zaciosy)
  const steps = 8;
  ctx.strokeStyle = '#181510';
  ctx.lineWidth = 1.6;
  for (let s = 1; s < steps; s++) {
    const sx = x + (s / steps) * w;
    const sy = y0 + (s / steps) * h;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy + 18);
    ctx.stroke();
  }

  // Krawędź biegowa schodów z mchem
  ctx.strokeStyle = '#2b4718';
  ctx.lineWidth = 5.0;
  ctx.beginPath();
  ctx.moveTo(x, y0);
  ctx.lineTo(x + w, y1);
  ctx.stroke();

  ctx.strokeStyle = '#4c782b';
  ctx.lineWidth = 2.0;
  ctx.stroke();
  ctx.restore();
}

// =========================================================================
// 4. ORGANICZNY WIELKI BANYAN (ZACHÓD)
// =========================================================================
function drawOrganicBanyanTree(ctx, x, deckY, time) {
  ctx.save();

  // Splot potężnych, wijących się korzeni powietrznych banyanu
  // Ciepłe odcienie ciemnej kory tropikalnej ze słojami i mchem
  const rootStems = [
    { startX: x - 60, startY: deckY + 40, endX: x - 20, endY: 1160, cpX: x - 10, cpY: deckY + 200, width: 26 },
    { startX: x + 20, startY: deckY + 10, endX: x + 90, endY: 1160, cpX: x + 70, cpY: deckY + 180, width: 34 },
    { startX: x + 90, startY: deckY + 20, endX: x + 220, endY: 1160, cpX: x + 130, cpY: deckY + 220, width: 28 },
    { startX: x + 160, startY: deckY + 50, endX: x + 310, endY: 1160, cpX: x + 240, cpY: deckY + 190, width: 22 }
  ];

  for (let r = 0; r < rootStems.length; r++) {
    const rt = rootStems[r];
    const sway = Math.sin(time * 1.2 + r) * 4;

    // Główny korzeń
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
// 5. STRAŻNICA Z BALI DREWNIANYCH (WSCHÓD)
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

    // Kora i słoje drewna
    ctx.strokeStyle = '#170c06';
    ctx.lineWidth = 1.4;
    for (let py = pole.yTop + 20; py < pole.yBottom; py += 35) {
      ctx.beginPath();
      ctx.moveTo(pole.x, py);
      ctx.lineTo(pole.x + pole.w, py + 4);
      ctx.stroke();
    }
  }

  // Masywne zastrzały ukośne (diagonal timber struts) wiązane linami
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
// 6. REALISTYCZNE POMOSTY DREWNIANE Z CIOSANYCH DESEK
// =========================================================================
function drawHardwoodPlatform(ctx, x, y, w, h, isMain, time) {
  ctx.save();
  // Cień belki pod pomostem
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(x + 2, y + h, w - 4, 8);

  // Belka nośna (spatynowany palisander / ciemne drewno tekowe)
  const woodGrad = ctx.createLinearGradient(x, y, x, y + h);
  woodGrad.addColorStop(0.0, '#543620');
  woodGrad.addColorStop(0.3, '#3d2515');
  woodGrad.addColorStop(0.8, '#26150b');
  woodGrad.addColorStop(1.0, '#170c06');

  ctx.fillStyle = woodGrad;
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 3);
  else ctx.rect(x, y, w, h);
  ctx.fill();

  // Pionowe szczeliny i deski co ~30 px
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

  // Wierzchnia krawędź biegowa: przetarcia drewna i kępki leśnego mchu
  ctx.strokeStyle = '#274516';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(x, y + 1);
  ctx.lineTo(x + w, y + 1);
  ctx.stroke();

  ctx.strokeStyle = '#436d28';
  ctx.lineWidth = 1.4;
  ctx.stroke();

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

    // Listek
    ctx.fillStyle = '#365c22';
    ctx.beginPath();
    ctx.arc(vx + sway, y + h + vLen, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// =========================================================================
// 7. WISZĄCY MOST LINOWY ZE SPLECIONYCH LIN I SZCZEBLI
// =========================================================================
function drawRealisticRopeBridge(ctx, p0, p1, p2, time) {
  ctx.save();

  // Drewniane słupki kotwiczące most po obu stronach
  drawBridgeAnchorPost(ctx, p0.x - 12, p0.y - 36, 16, 42);
  drawBridgeAnchorPost(ctx, p2.x - 4, p2.y - 36, 16, 42);

  // 1. Dolna gruba spleciona lina nośna (skręcona lina konopna)
  ctx.strokeStyle = '#2b1b10';
  ctx.lineWidth = 9.0;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y + 6);
  ctx.quadraticCurveTo(p1.x, p1.y + 8, p2.x, p2.y + 6);
  ctx.stroke();

  // Jasny oplot liny
  ctx.strokeStyle = '#573822';
  ctx.lineWidth = 5.0;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y + 5);
  ctx.quadraticCurveTo(p1.x, p1.y + 7, p2.x, p2.y + 5);
  ctx.stroke();

  // 2. Górna lina poręczowa (handrail) 28 px wyżej
  const hOff = -28;
  ctx.strokeStyle = '#362113';
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y + hOff);
  ctx.quadraticCurveTo(p1.x, p1.y + hOff, p2.x, p2.y + hOff);
  ctx.stroke();

  ctx.strokeStyle = '#6e4529';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // 3. Drewniane szczeble pomostu i pionowe olinowanie co 24 px
  const segs = 20;
  for (let s = 1; s < segs; s++) {
    const t = s / segs;
    const inv = 1 - t;
    const bx = inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x;
    const by = inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y;

    // Pionowa linka wiążąca poręcz ze szczeblami
    ctx.strokeStyle = 'rgba(84, 51, 27, 0.85)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(bx, by + hOff);
    ctx.lineTo(bx, by);
    ctx.stroke();

    // Drewniany szczebel kładki z cieniem
    ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
    ctx.fillRect(bx - 5, by + 4, 10, 4);

    ctx.fillStyle = '#422817';
    ctx.fillRect(bx - 5, by - 2, 10, 7);

    // Krawędź deski
    ctx.strokeStyle = '#633c23';
    ctx.lineWidth = 0.9;
    ctx.strokeRect(bx - 5, by - 2, 10, 7);

    // Zielone pnącza wplecione w liny poręczy
    if (s % 3 === 0) {
      const vLen = 14 + ((s * 13) % 22);
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
// 8. CENTRALNA ŚWIĄTYNIA SŁOŃCA (ANGKOR WAT / MAJOWIE)
// =========================================================================
function drawAncientSunTemple(ctx, time) {
  ctx.save();

  // 1. Główny taras świątynny (x: 1300-2300, y: 740-780)
  const terraceGrad = ctx.createLinearGradient(1300, 740, 1300, 780);
  terraceGrad.addColorStop(0.0, '#453f33');
  terraceGrad.addColorStop(0.4, '#332f25');
  terraceGrad.addColorStop(1.0, '#1c1a14');

  ctx.fillStyle = terraceGrad;
  ctx.fillRect(1300, 740, 1000, 40);

  // Rzeźbiony fryz geometryczny na czole tarasu
  ctx.strokeStyle = '#211d16';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(1300, 740, 1000, 40);

  // Kamienne płaskorzeźby spiralne wzdłuż krawędzi tarasu
  ctx.strokeStyle = 'rgba(180, 150, 100, 0.20)';
  ctx.lineWidth = 1.4;
  for (let fx = 1320; fx < 2280; fx += 40) {
    ctx.strokeRect(fx, 748, 24, 24);
    ctx.strokeRect(fx + 6, 754, 12, 12);
  }

  // Mech na krawędzi tarasu
  drawMossyEdge(ctx, 1300, 740, 1000, 7);

  // 2. Dwa monumentalne rzeźbione filary podtrzymujące taras (x: 1420 i 2100)
  const pillars = [1420, 2100];
  for (const px of pillars) {
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

    // Kanelury / żłobienia pionowe na filarach
    ctx.strokeStyle = '#17140f';
    ctx.lineWidth = 1.8;
    for (let k = 1; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(px + k * 20, 780);
      ctx.lineTo(px + k * 20, 1060);
      ctx.stroke();
    }

    // Pnącza oplecione wokół kolumn
    ctx.strokeStyle = '#274719';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(px + 10, 1060);
    for (let py = 1040; py > 790; py -= 35) {
      ctx.lineTo(px + ((py / 35) % 2 === 0 ? 65 : 15), py);
    }
    ctx.stroke();
  }

  // 3. Dolna krypta / tunel podświątynny (x: 1580-2020, y: 920-950)
  ctx.fillStyle = '#17140f';
  ctx.fillRect(1580, 920, 440, 30);
  ctx.strokeStyle = '#2b4718';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(1580, 920, 440, 2);

  // 4. Święty Ołtarz Solarny (x: 1550-2050, y: 580-612)
  const altarGrad = ctx.createLinearGradient(1550, 580, 1550, 612);
  altarGrad.addColorStop(0.0, '#574f3e');
  altarGrad.addColorStop(0.4, '#3f392c');
  altarGrad.addColorStop(1.0, '#26221a');

  ctx.fillStyle = altarGrad;
  if (ctx.roundRect) ctx.roundRect(1550, 580, 500, 32, 4);
  else ctx.rect(1550, 580, 500, 32);
  ctx.fill();

  drawMossyEdge(ctx, 1550, 580, 500, 6);

  // 5. Płonące kamienne czary ofiarne na obu rogach ołtarza
  drawStoneFireBrazier(ctx, 1575, 580, time);
  drawStoneFireBrazier(ctx, 2025, 580, time + 1.4);

  // 6. RZEŹBIONY ZŁOTY DYSK SOLARNY (ZAMIAST ŻÓŁTEJ KROPKI)
  drawCarvedSunDiscMedallion(ctx, 1800, 660, 44, time);

  // 7. Górne Nadproże Megalitu Słonecznego (Snajper: x: 1680, w: 240, y: 430)
  // Dwa smukłe kamienne słupy
  ctx.fillStyle = '#3a3429';
  ctx.fillRect(1705, 452, 26, 128);
  ctx.fillRect(1869, 452, 26, 128);

  ctx.strokeStyle = '#17140f';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(1705, 452, 26, 128);
  ctx.strokeRect(1869, 452, 26, 128);

  // Belka nadproża z ciosanego kamienia z mchem
  const lintelGrad = ctx.createLinearGradient(1680, 430, 1680, 452);
  lintelGrad.addColorStop(0.0, '#5a5140');
  lintelGrad.addColorStop(0.5, '#3d372b');
  lintelGrad.addColorStop(1.0, '#26221a');
  ctx.fillStyle = lintelGrad;
  ctx.fillRect(1680, 430, 240, 22);

  drawMossyEdge(ctx, 1680, 430, 240, 5);

  ctx.restore();
}

/** Rzeźbiony Złoty Dysk Solarny z hieroglifami, promieniami i ciepłą poświatą */
function drawCarvedSunDiscMedallion(ctx, cx, cy, r, time) {
  ctx.save();

  // Ciepła, radialna złota poświata bóstwa słonecznego
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const pulse = 0.82 + 0.18 * Math.sin(time * 2.2);
  const glowGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, r * 2.6);
  glowGrad.addColorStop(0.0, `rgba(253, 224, 71, ${0.65 * pulse})`);
  glowGrad.addColorStop(0.35, `rgba(234, 179, 8, ${0.35 * pulse})`);
  glowGrad.addColorStop(0.75, `rgba(202, 138, 4, ${0.12 * pulse})`);
  glowGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Zewnętrzny pierścień z ciemnego rzeźbionego kamienia
  ctx.fillStyle = '#2b261d';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#18150f';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Wewnętrzny medalion ze starego, patynowanego złota / brązu
  const discGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  discGrad.addColorStop(0.0, '#fef08a');
  discGrad.addColorStop(0.35, '#eab308');
  discGrad.addColorStop(0.70, '#ca8a04');
  discGrad.addColorStop(1.0, '#713f12');

  ctx.fillStyle = discGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
  ctx.fill();

  // Rzeźbione koncentryczne kręgi kalendarzowe (styl Majów)
  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
  ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
  ctx.stroke();

  // Wewnętrzny symbol solarny w centrum
  ctx.fillStyle = '#fef9c3';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.24, 0, Math.PI * 2);
  ctx.fill();

  // Rzeźbione promienie słoneczne rozchodzące się wokół dysku
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 2.2;
  const rayCount = 12;
  for (let i = 0; i < rayCount; i++) {
    const ang = (i / rayCount) * Math.PI * 2 + time * 0.3;
    const r1 = r * 0.88;
    const r2 = r * 1.14 + (i % 2 === 0 ? 5 : 0);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
    ctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
    ctx.stroke();
  }

  ctx.restore();
}

/** Kamienna misa ofiarna z żywym, animowanym ogniem i unoszącymi się iskrami */
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

  // Czerwony żar wewnątrz czary
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(cx - 9, baseY - 22, 18, 4);

  // Dynamiczne wielowarstwowe płomienie ognia
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
// 9. ZAWIESZONE MSZYSTE GŁAZY POŚREDNIE
// =========================================================================
function drawOvergrownSuspendedRock(ctx, x, y, w, h, time) {
  ctx.save();
  // Korpus głazu ze spatynowanego kamienia
  const rockGrad = ctx.createLinearGradient(x, y, x, y + h);
  rockGrad.addColorStop(0.0, '#4a4336');
  rockGrad.addColorStop(0.4, '#363126');
  rockGrad.addColorStop(1.0, '#1f1c15');

  ctx.fillStyle = rockGrad;
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 6);
  else ctx.rect(x, y, w, h);
  ctx.fill();

  ctx.strokeStyle = '#181510';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Poduszka mchu na górnej krawędzi
  drawMossyEdge(ctx, x, y, w, 5);

  // Zwisające wąsy mchu pod spodem
  for (let m = 0; m < 4; m++) {
    const mx = x + 25 + m * 38;
    const mLen = 12 + ((m * 11) % 18);
    const sway = Math.sin(time * 1.8 + m) * 3;
    ctx.strokeStyle = '#244516';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(mx, y + h);
    ctx.lineTo(mx + sway, y + h + mLen);
    ctx.stroke();
  }

  ctx.restore();
}

// =========================================================================
// POMOCNICZE: KĘPKI MCHU ORAZ DZIKIE ORCHIDEE
// =========================================================================

/** Rysuje nieregularną, naturalną poduszkę mchu wzdłuż górnej krawędzi bloku */
function drawMossyEdge(ctx, x, y, w, thickness) {
  ctx.save();
  // Głęboka podstawa mchu (oliwkowa)
  ctx.strokeStyle = '#274516';
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.moveTo(x - 1, y + 1);
  ctx.lineTo(x + w + 1, y + 1);
  ctx.stroke();

  // Średnia warstwa mchu z naturalnymi kępkami
  ctx.strokeStyle = '#3e6b24';
  ctx.lineWidth = thickness * 0.55;
  ctx.stroke();

  // Jasne szmaragdowe refleksy słońca
  ctx.fillStyle = '#5c9635';
  const tufts = Math.floor(w / 18);
  for (let t = 0; t <= tufts; t++) {
    const tx = x + t * 18;
    const th = 2.5 + ((t * 7) % 4);
    ctx.beginPath();
    ctx.arc(tx, y, th, Math.PI, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Rysuje kępę dzikich tropikalnych orchidei (fuksja/magenta z żółtym środkiem) */
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
    // Środek kwiatka
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(fx, fy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Promienie światła słonecznego usunięte na rzecz czystego widoku 60 FPS */
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
