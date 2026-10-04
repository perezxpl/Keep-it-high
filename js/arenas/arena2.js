// =========================================================================
// ARENAS/ARENA2.JS - GÓRY PANDORY / HALLELUJAH MOUNTAINS (3600x1400 PX)
// Autonomiczny moduł areny (Plugin / Lifecycle Hooks Pattern)
// Całkowicie nowy układ lewitujących wysp, pnączy i otchłani z prądami wznoszącymi
// =========================================================================

import { drawPandoraBackground } from '../background.js';

// =========================================================================
// WYZNACZANIE PŁYNNYCH KRZYWYCH BEZIERA DLA MOSTÓW Z PNĄCZY
// =========================================================================
function generateBezierPoints(p0, p1, p2, steps = 14) {
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

export const LEFT_VINE_BRIDGE_POINTS = generateBezierPoints(
  { x: 850, y: 390 },  // Szczyt rampy lewej iglicy
  { x: 1080, y: 560 }, // Punkt ugięcia liany w powietrzu
  { x: 1350, y: 620 }, // Wierzchołek wyspy centralnej
  14
);

export const RIGHT_VINE_BRIDGE_POINTS = generateBezierPoints(
  { x: 2250, y: 620 }, // Wierzchołek wyspy centralnej (wschód)
  { x: 2520, y: 590 }, // Punkt ugięcia liany w powietrzu
  { x: 2750, y: 480 }, // Grań bazy prawej
  14
);

// =========================================================================
// STATYCZNA GEOMETRIA I PLATFORMY (ARENA_2_PANDORA_PLATFORMS)
// =========================================================================
export const ARENA_2_PANDORA_PLATFORMS = [
  // -----------------------------------------------------------------------
  // 1. WYSPA CENTRALNA (Główna komora: x: 1350–2250, y: 620, stalaktyty do 980)
  // -----------------------------------------------------------------------
  {
    id: 'pandora_central_top',
    name: 'Wyspa Centralna (Płaskowyż)',
    isPlatform: true,
    solid: true,
    x: 1350,
    w: 900,
    y: 590,
    h: 40,
    surfacePoints: [
      { x: 1350, y: 620 },
      { x: 1480, y: 610 },
      { x: 1650, y: 600 },
      { x: 1800, y: 590 },
      { x: 1950, y: 600 },
      { x: 2120, y: 610 },
      { x: 2250, y: 620 }
    ]
  },
  {
    id: 'pandora_central_tunnel_floor',
    name: 'Wyspa Centralna (Podłoga Tunelu Skalnego)',
    isPlatform: true,
    solid: true,
    x: 1600,
    w: 400,
    y: 730,
    h: 30
  },

  // -----------------------------------------------------------------------
  // 2. LEWA PODNIEBNA IGLICA (Baza lewa: x: 250–850, y: 440)
  // -----------------------------------------------------------------------
  {
    id: 'pandora_left_sniper_perch',
    name: 'Lewa Iglica (Półka Snajperska)',
    isPlatform: true,
    solid: true,
    x: 250,
    w: 160,
    y: 370,
    h: 30
  },
  {
    id: 'pandora_left_spire_main',
    name: 'Lewa Iglica (Główna Platforma Bazy)',
    isPlatform: true,
    solid: true,
    x: 390,
    w: 320,
    y: 440,
    h: 35
  },
  {
    id: 'pandora_left_launch_ramp',
    name: 'Lewa Iglica (Naturalna Rampa do Wyskoku)',
    type: 'ramp',
    isPlatform: true,
    isSlope: true,
    x: 700,
    w: 150,
    h: 50,
    startY: 440,
    endY: 390,
    surfacePoints: [
      { x: 700, y: 440 },
      { x: 850, y: 390 }
    ]
  },

  // -----------------------------------------------------------------------
  // 3. PRAWA GRAŃ (Baza prawa: x: 2750–3350, y: 480)
  // -----------------------------------------------------------------------
  {
    id: 'pandora_right_ridge_lower',
    name: 'Prawa Grań (Dolna Półka Skalna)',
    isPlatform: true,
    solid: true,
    x: 2750,
    w: 600,
    y: 480,
    h: 35
  },
  {
    id: 'pandora_right_ridge_upper',
    name: 'Prawa Grań (Górna Grań Snajperska)',
    isPlatform: true,
    oneWay: true,
    x: 2950,
    w: 400,
    y: 370,
    h: 24
  },
  {
    id: 'pandora_right_rock_cover',
    name: 'Prawa Grań (Naturalna Osłona Skalna)',
    isPlatform: true,
    solid: true,
    x: 2900,
    w: 45,
    y: 425,
    h: 55
  },

  // -----------------------------------------------------------------------
  // 4. TAKTYCZNE MAŁE WYSEPKI (ONE-WAY PLATFORMS: y: 780, 920, 1040)
  // -----------------------------------------------------------------------
  {
    id: 'pandora_small_island_1',
    name: 'Wysepka Zachodnia Górna (y: 780)',
    isPlatform: true,
    oneWay: true,
    x: 960,
    w: 180,
    y: 780,
    h: 22
  },
  {
    id: 'pandora_small_island_2',
    name: 'Wysepka Wschodnia Górna (y: 780)',
    isPlatform: true,
    oneWay: true,
    x: 2420,
    w: 180,
    y: 780,
    h: 22
  },
  {
    id: 'pandora_small_island_3',
    name: 'Wysepka Pośrednia (y: 920)',
    isPlatform: true,
    oneWay: true,
    x: 1140,
    w: 160,
    y: 920,
    h: 22
  },
  {
    id: 'pandora_small_island_4',
    name: 'Wysepka Głębinowa (y: 1040)',
    isPlatform: true,
    oneWay: true,
    x: 2020,
    w: 190,
    y: 1040,
    h: 22
  },

  // -----------------------------------------------------------------------
  // 5. NATURALNE MOSTY Z PNĄCZY (VINE BRIDGES - KOLIZJA OD GÓRY, POCHYŁOŚĆ)
  // -----------------------------------------------------------------------
  {
    id: 'pandora_vine_bridge_left',
    name: 'Most z Pnączy (Lewy)',
    isPlatform: true,
    oneWay: true,
    isSlope: true,
    isVineBridge: true,
    x: 850,
    w: 500,
    y: 390,
    h: 230,
    surfacePoints: LEFT_VINE_BRIDGE_POINTS
  },
  {
    id: 'pandora_vine_bridge_right',
    name: 'Most z Pnączy (Prawy)',
    isPlatform: true,
    oneWay: true,
    isSlope: true,
    isVineBridge: true,
    x: 2250,
    w: 500,
    y: 480,
    h: 140,
    surfacePoints: RIGHT_VINE_BRIDGE_POINTS
  }
];

// Aliasy kompatybilności wstecznej
export const ARENA_CYBER_STADIUM_PLATFORMS = ARENA_2_PANDORA_PLATFORMS;
export const ARENA_CYBER_STADIUM_BARRICADES = [];

// =========================================================================
// BRAMKI I CELE SPORTOWE DLA ARENY 2 (GÓRY PANDORY)
// =========================================================================
export const ARENA_2_PANDORA_GOALS = [
  {
    id: 'goal_cyan',
    team: 'CYAN',
    x: 260,
    y: 240,
    w: 90,
    h: 130,
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.85)',
    facing: 1
  },
  {
    id: 'goal_orange',
    team: 'ORANGE',
    x: 3250,
    y: 240,
    w: 90,
    h: 130,
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.85)',
    facing: -1
  }
];
export const ARENA_CYBER_STADIUM_GOALS = ARENA_2_PANDORA_GOALS;

// =========================================================================
// FIZYKA TERMIKI I OTCHŁANI PANDORY (UPDRAFT & ABYSS ZONE)
// =========================================================================
/**
 * Sprawdza i aplikuje siły w strefie chmur (y > 1260) oraz otchłani (y >= 1380):
 * - Gracz z paliwem: natychmiastowy potężny pionowy impuls wznoszący (vy = -680 impuls / wznios 680 px)
 * - Gracz bez paliwa: śmierć w otchłani przy y >= 1380 i respawn
 */
export function applyPandoraUpdraft(player) {
  if (!player || player.isDead) return false;

  // Strefa chmur poniżej y = 1260
  if (player.y > 1260) {
    const hasFuel = (player.jetFuel !== undefined ? player.jetFuel > 0 : true);

    if (hasFuel) {
      // Potężna termika wznosząca wyrzucająca z powrotem w strefę wysp
      // W modelu 60 FPS impuls ~680 px wzniosu trajektorii odpowiada pionowej prędkości -22.5
      player.vy = -22.5;
      player.updraftImpulse = -680;
      player.isJumping = true;
      player.onGround = false;
      player.currentPlatform = null;
      return true;
    } else if (player.y >= 1380) {
      // Gracz bez paliwa po osiągnięciu y = 1380 ginie (upadek w otchłań / respawn)
      player.hp = 0;
      player.isDead = true;
      player.respawnTimer = 75;
      return false;
    }
  }
  return false;
}

export function checkPandoraUpdraft(player) {
  return applyPandoraUpdraft(player);
}

// =========================================================================
// ARENA 2: SYSTEM RENDEROWANIA PANDORY (HALLELUJAH MOUNTAINS)
// =========================================================================

// Stan bioluminescencyjnych zarodników (Woodsprites / Atokirina)
const WOODSPRITES_COUNT = 32;
const _pandoraWoodsprites = [];
for (let i = 0; i < WOODSPRITES_COUNT; i++) {
  _pandoraWoodsprites.push({
    x: 200 + (i * 105.7) % 3200,
    y: 340 + (i * 37.3) % 860,
    baseX: 200 + (i * 105.7) % 3200,
    baseY: 340 + (i * 37.3) % 860,
    vx: ((i % 5) - 2) * 4.5,
    vy: -8.0 - (i % 4) * 4.0,
    phase: i * 0.45,
    pulseSpeed: 1.6 + (i % 3) * 0.5,
    size: 2.2 + (i % 4) * 0.7,
    colorType: (i % 2 === 0) ? 'cyan' : 'purple', // #E0F2FE lub #E879F9
    swayAmp: 16 + (i % 5) * 6,
    swaySpeed: 0.9 + (i % 3) * 0.4
  });
}

// Stan cząsteczek pary wodnej pod wodospadami (Generator cząsteczek mgły)
const WATERFALL_MIST_COUNT = 24;
const _waterfallMistParticles = [];
for (let i = 0; i < WATERFALL_MIST_COUNT; i++) {
  _waterfallMistParticles.push({
    wfIndex: i % 2, // 0 = lewa iglica (x: 620, y: 580), 1 = wyspa centralna (x: 1520, y: 760)
    relX: (Math.random() - 0.5) * 36,
    relY: Math.random() * 45,
    r: 10 + Math.random() * 18,
    vx: (Math.random() - 0.5) * 12,
    vy: -8 - Math.random() * 14,
    life: Math.random(),
    maxLife: 0.8 + Math.random() * 0.8
  });
}

/**
 * Główna dedykowana procedura renderowania terenu Areny 2 (Góry Pandory):
 * A. Organiczne wyspy i skały (wierzchołki ze szmaragdową roślinnością, wilgotny grafit,
 *    kryształy Unobtanium, zwisające korzenie i liany)
 * B. Podniebne wodospady (jaskrawy błękit #38BDF8, rozpraszanie w mgłę po 140 px)
 * C. Bioluminescencyjne zarodniki Woodsprites (#E0F2FE i #E879F9 z sinusoidalnym pulsem alpha 0.2..0.75)
 * D. Mosty z naturalnych pnączy łączące iglice z wyspą centralną
 */
export function renderPandoraTerrain(ctx, camera) {
  if (!ctx) return;
  const time = performance.now() * 0.001;

  // -------------------------------------------------------------------------
  // 1. BIOLUMINESCENCYJNE ZARODNIKI (WOODSPRITES / ATOKIRINA) W TLE
  // -------------------------------------------------------------------------
  ctx.save();
  for (let i = 0; i < _pandoraWoodsprites.length; i++) {
    const sp = _pandoraWoodsprites[i];

    // Płynny ruch dryfujący z sinusoidalnym kołysaniem
    const driftX = sp.baseX + Math.sin(time * sp.swaySpeed + sp.phase) * sp.swayAmp + Math.sin(time * 0.4 + i) * 10;
    const driftY = ((sp.baseY + time * sp.vy) % 1100 + 1100) % 1100 + 260;

    // Płynne pulsowanie przezroczystości (alpha sinusoidalna od 0.20 do 0.75)
    const sinAlpha = Math.sin(time * sp.pulseSpeed + sp.phase);
    const alpha = 0.20 + 0.55 * (0.5 + 0.5 * sinAlpha);

    const isCyan = sp.colorType === 'cyan';
    const coreColor = isCyan ? `rgba(224, 242, 254, ${alpha})` : `rgba(232, 121, 249, ${alpha})`;
    const glowColor = isCyan ? `rgba(34, 211, 238, ${alpha * 0.65})` : `rgba(216, 70, 239, ${alpha * 0.65})`;

    // Poświata radialna
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const bGrad = ctx.createRadialGradient(driftX, driftY, 1, driftX, driftY, sp.size * 3.5);
    bGrad.addColorStop(0.0, coreColor);
    bGrad.addColorStop(0.4, glowColor);
    bGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(driftX, driftY, sp.size * 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Świecące jądro zarodnika
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(driftX, driftY, sp.size, 0, Math.PI * 2);
    ctx.fill();

    // Falujące czułki / wici zarodnika
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1.0;
    const tailCount = 3;
    for (let t = 0; t < tailCount; t++) {
      const angle = (t / (tailCount - 1) - 0.5) * 1.0;
      const tailLen = sp.size * (3.8 + t * 0.8);
      const swayTail = Math.sin(time * 3.5 + i + t) * 3;
      ctx.beginPath();
      ctx.moveTo(driftX, driftY);
      ctx.quadraticCurveTo(
        driftX + Math.sin(angle) * (tailLen * 0.5) + swayTail,
        driftY + tailLen * 0.5,
        driftX + Math.sin(angle) * tailLen + swayTail * 1.5,
        driftY + tailLen
      );
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();

  // -------------------------------------------------------------------------
  // 2. PODNIEBNE WODOSPADY Z DWÓCH WYSP
  // -------------------------------------------------------------------------
  const waterfalls = [
    { x: 620, startY: 440, length: 140, w: 22 },   // Lewa Iglica (startY: 440, koniec y: 580)
    { x: 1520, startY: 620, length: 140, w: 26 }  // Wyspa Centralna (startY: 620, koniec y: 760)
  ];

  for (let wfIdx = 0; wfIdx < waterfalls.length; wfIdx++) {
    const wf = waterfalls[wfIdx];
    const endY = wf.startY + wf.length;

    ctx.save();
    // Główna struga wody w jaskrawym błękicie (#38BDF8)
    const waterGrad = ctx.createLinearGradient(wf.x, wf.startY, wf.x + wf.w, wf.startY);
    waterGrad.addColorStop(0.00, 'rgba(14, 116, 144, 0.70)');
    waterGrad.addColorStop(0.25, '#38BDF8');
    waterGrad.addColorStop(0.60, '#7DD3FC');
    waterGrad.addColorStop(0.85, '#38BDF8');
    waterGrad.addColorStop(1.00, 'rgba(14, 116, 144, 0.70)');

    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.moveTo(wf.x, wf.startY);
    // Zwężenie i poszarpana struga opadająca
    ctx.lineTo(wf.x + wf.w, wf.startY);
    ctx.quadraticCurveTo(wf.x + wf.w * 0.88, wf.startY + wf.length * 0.5, wf.x + wf.w * 0.75, endY);
    ctx.lineTo(wf.x + wf.w * 0.25, endY);
    ctx.quadraticCurveTo(wf.x + wf.w * 0.12, wf.startY + wf.length * 0.5, wf.x, wf.startY);
    ctx.closePath();
    ctx.fill();

    // Animowane świetliste refleksy spływające w dół
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.8;
    const refOffset = (time * 180) % 36;
    for (let ry = wf.startY + refOffset; ry < endY - 10; ry += 36) {
      ctx.beginPath();
      ctx.moveTo(wf.x + wf.w * 0.35, ry);
      ctx.lineTo(wf.x + wf.w * 0.60, ry + 16);
      ctx.stroke();
    }

    // Podświetlenie krawędzi wody
    ctx.strokeStyle = '#22D3EE';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // Biało-błękitna mgła / generator cząsteczek pary na wysokości 140 px pod wyspą
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let m = 0; m < _waterfallMistParticles.length; m++) {
      const mist = _waterfallMistParticles[m];
      if (mist.wfIndex !== wfIdx) continue;

      const mistLife = (time * 0.75 + m * 0.15) % 1.0;
      const mistR = mist.r + mistLife * 26;
      const mistAlpha = Math.sin(mistLife * Math.PI) * 0.42;

      const mx = wf.x + wf.w * 0.5 + mist.relX + Math.sin(time * 2.0 + m) * 12;
      const my = endY + mist.relY + mistLife * 35;

      const mGrad = ctx.createRadialGradient(mx, my, 2, mx, my, mistR);
      mGrad.addColorStop(0.00, `rgba(240, 249, 255, ${mistAlpha * 0.9})`);
      mGrad.addColorStop(0.40, `rgba(56, 189, 248, ${mistAlpha * 0.5})`);
      mGrad.addColorStop(1.00, 'rgba(56, 189, 248, 0.0)');

      ctx.fillStyle = mGrad;
      ctx.beginPath();
      ctx.arc(mx, my, mistR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // 3. MOSTY Z NATURALNYCH PNĄCZY I LIN (VINE BRIDGES - KRZYWE BEZIERA)
  // -------------------------------------------------------------------------
  const vineBridges = [
    // Most lewy: z iglicy (850, 390) do wyspy centralnej (1350, 620)
    { p0: { x: 850, y: 390 }, p1: { x: 1080, y: 560 }, p2: { x: 1350, y: 620 } },
    // Most prawy: z wyspy centralnej (2250, 620) do prawej grani (2750, 480)
    { p0: { x: 2250, y: 620 }, p1: { x: 2520, y: 590 }, p2: { x: 2750, y: 480 } }
  ];

  for (let vbIdx = 0; vbIdx < vineBridges.length; vbIdx++) {
    const bridge = vineBridges[vbIdx];
    ctx.save();

    // Gruba spleciona liana nośna (dolna)
    ctx.strokeStyle = '#064e3b';
    ctx.lineWidth = 9.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bridge.p0.x, bridge.p0.y + 4);
    ctx.quadraticCurveTo(bridge.p1.x, bridge.p1.y + 6, bridge.p2.x, bridge.p2.y + 4);
    ctx.stroke();

    // Wierzchnia liana biegowa z neonowym mchem (góra kolizji)
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 5.0;
    ctx.beginPath();
    ctx.moveTo(bridge.p0.x, bridge.p0.y);
    ctx.quadraticCurveTo(bridge.p1.x, bridge.p1.y, bridge.p2.x, bridge.p2.y);
    ctx.stroke();

    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Stopnie / poprzeczne pędy pnączy i drewniane szczeble co ~28 px
    const segs = 18;
    for (let s = 1; s < segs; s++) {
      const t = s / segs;
      const invT = 1 - t;
      const bx = invT * invT * bridge.p0.x + 2 * invT * t * bridge.p1.x + t * t * bridge.p2.x;
      const by = invT * invT * bridge.p0.y + 2 * invT * t * bridge.p1.y + t * t * bridge.p2.y;

      ctx.fillStyle = '#065f46';
      ctx.fillRect(bx - 3, by - 2, 6, 8);

      // Świecące porosty na szczeblach
      if (s % 3 === 0) {
        ctx.fillStyle = '#22D3EE';
        ctx.fillRect(bx - 1.5, by - 3, 3, 2);
      }

      // Zwisające wąsy pnączy pod mostem
      if (s % 2 === 0) {
        const vLen = 14 + ((s * 7) % 22);
        const sway = Math.sin(time * 2.0 + s) * 4;
        ctx.strokeStyle = '#022c22';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(bx, by + 4);
        ctx.quadraticCurveTo(bx + sway, by + 4 + vLen * 0.6, bx + sway * 1.5, by + 4 + vLen);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // 4. ORGANICZNE WYSPY I SKAŁY PANDORY (HALLELUJAH MONOLITHS)
  // -------------------------------------------------------------------------
  const islands = [
    // 1. Wyspa Centralna (Główna komora: x: 1350-2250, wierzchołek y: 620-590, stalaktyty do 980)
    {
      id: 'central',
      topProfile: [
        { x: 1350, y: 620 },
        { x: 1480, y: 610 },
        { x: 1650, y: 600 },
        { x: 1800, y: 590 },
        { x: 1950, y: 600 },
        { x: 2120, y: 610 },
        { x: 2250, y: 620 }
      ],
      bottomProfile: [
        { x: 2250, y: 620 },
        { x: 2240, y: 670 },
        { x: 2190, y: 780 },
        { x: 2140, y: 910 }, // Stalaktyt wschodni
        { x: 2060, y: 830 },
        { x: 1980, y: 930 },
        { x: 1890, y: 840 },
        { x: 1800, y: 980 }, // Wielki stalaktyt centralny y ≈ 980
        { x: 1710, y: 850 },
        { x: 1630, y: 940 },
        { x: 1540, y: 820 },
        { x: 1460, y: 900 }, // Stalaktyt zachodni
        { x: 1390, y: 750 },
        { x: 1350, y: 650 }
      ],
      tunnel: { cx: 1800, cy: 720, w: 380, h: 95 },
      crystals: [
        { rx: 1480, ry: 660, size: 14 },
        { rx: 1720, ry: 710, size: 18 },
        { rx: 1890, ry: 700, size: 16 },
        { rx: 2050, ry: 680, size: 15 },
        { rx: 1780, ry: 860, size: 22 },
        { rx: 1620, ry: 820, size: 14 }
      ]
    },
    // 2. Lewa Podniebna Iglica (Baza lewa: x: 250-850, y: 440, rampa, półka snajperska)
    {
      id: 'left_spire',
      topProfile: [
        { x: 250, y: 370 }, // Wysunięta półka snajperska
        { x: 380, y: 370 },
        { x: 410, y: 440 },
        { x: 700, y: 440 },
        { x: 850, y: 390 }  // Naturalna rampa do wyskoku
      ],
      bottomProfile: [
        { x: 850, y: 390 },
        { x: 840, y: 460 },
        { x: 760, y: 560 },
        { x: 670, y: 660 },
        { x: 490, y: 760 }, // Iglica stalaktytowa sięgająca w dół
        { x: 380, y: 640 },
        { x: 290, y: 520 },
        { x: 250, y: 420 }
      ],
      crystals: [
        { rx: 340, ry: 410, size: 16 },
        { rx: 530, ry: 510, size: 20 },
        { rx: 650, ry: 490, size: 15 },
        { rx: 490, ry: 670, size: 18 }
      ]
    },
    // 3. Prawa Grań (Baza prawa: x: 2750-3350, y: 480, dwa poziomy półek z osłoną)
    {
      id: 'right_ridge',
      topProfile: [
        { x: 2750, y: 480 },
        { x: 2900, y: 480 },
        { x: 2950, y: 370 }, // Górna grań snajperska
        { x: 3350, y: 370 }
      ],
      bottomProfile: [
        { x: 3350, y: 370 },
        { x: 3350, y: 520 },
        { x: 3260, y: 680 },
        { x: 3180, y: 840 }, // Główny stalaktyt wschodni
        { x: 3080, y: 730 },
        { x: 2940, y: 810 },
        { x: 2840, y: 670 },
        { x: 2750, y: 520 }
      ],
      rockCover: { x: 2900, y: 425, w: 45, h: 55 },
      crystals: [
        { rx: 2830, ry: 530, size: 16 },
        { rx: 3040, ry: 580, size: 19 },
        { rx: 3180, ry: 720, size: 22 },
        { rx: 3270, ry: 460, size: 14 }
      ]
    },
    // 4. Taktyczne małe wysepki (4 fragmenty skał: y: 780, 920, 1040)
    {
      id: 'small_1',
      topProfile: [{ x: 960, y: 780 }, { x: 1050, y: 775 }, { x: 1140, y: 780 }],
      bottomProfile: [{ x: 1140, y: 780 }, { x: 1110, y: 825 }, { x: 1045, y: 865 }, { x: 980, y: 825 }],
      crystals: [{ rx: 1040, ry: 815, size: 12 }]
    },
    {
      id: 'small_2',
      topProfile: [{ x: 2420, y: 780 }, { x: 2510, y: 775 }, { x: 2600, y: 780 }],
      bottomProfile: [{ x: 2600, y: 780 }, { x: 2570, y: 825 }, { x: 2505, y: 865 }, { x: 2440, y: 825 }],
      crystals: [{ rx: 2510, ry: 815, size: 12 }]
    },
    {
      id: 'small_3',
      topProfile: [{ x: 1140, y: 920 }, { x: 1220, y: 915 }, { x: 1300, y: 920 }],
      bottomProfile: [{ x: 1300, y: 920 }, { x: 1270, y: 960 }, { x: 1215, y: 995 }, { x: 1160, y: 955 }],
      crystals: [{ rx: 1220, ry: 950, size: 12 }]
    },
    {
      id: 'small_4',
      topProfile: [{ x: 2020, y: 1040 }, { x: 2110, y: 1035 }, { x: 2210, y: 1040 }],
      bottomProfile: [{ x: 2210, y: 1040 }, { x: 2180, y: 1080 }, { x: 2110, y: 1125 }, { x: 2045, y: 1080 }],
      crystals: [{ rx: 2115, ry: 1075, size: 14 }]
    }
  ];

  for (let iIdx = 0; iIdx < islands.length; iIdx++) {
    const isl = islands[iIdx];
    ctx.save();

    // BRYŁA SKALNA: głęboki, wilgotny grafit i ciemny turkus (#0F172A do #0A0F1D)
    const polyPts = [...isl.topProfile, ...isl.bottomProfile];
    ctx.beginPath();
    ctx.moveTo(polyPts[0].x, polyPts[0].y);
    for (let p = 1; p < polyPts.length; p++) {
      ctx.lineTo(polyPts[p].x, polyPts[p].y);
    }
    ctx.closePath();

    // Pionowy gradient skały
    const minY = Math.min(...polyPts.map(pt => pt.y));
    const maxY = Math.max(...polyPts.map(pt => pt.y));
    const rockGrad = ctx.createLinearGradient(0, minY, 0, maxY);
    rockGrad.addColorStop(0.00, '#0F172A');
    rockGrad.addColorStop(0.45, '#0C1322');
    rockGrad.addColorStop(1.00, '#0A0F1D');
    ctx.fillStyle = rockGrad;
    ctx.fill();

    // Poziome użylenia geologiczne (sediment strata)
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.65)';
    ctx.lineWidth = 2.0;
    for (let vy = minY + 25; vy < maxY - 15; vy += 32) {
      ctx.beginPath();
      ctx.moveTo(isl.topProfile[0].x - 80, vy);
      const midX = (isl.topProfile[0].x + isl.topProfile[isl.topProfile.length - 1].x) * 0.5;
      const endX = isl.topProfile[isl.topProfile.length - 1].x + 80;
      ctx.quadraticCurveTo(midX, vy + Math.sin(vy * 0.1) * 14, endX, vy + 4);
      ctx.stroke();
    }

    // Dodatkowe turkusowe pasma minerałów
    ctx.strokeStyle = 'rgba(14, 116, 144, 0.28)';
    ctx.lineWidth = 1.4;
    for (let vy = minY + 42; vy < maxY - 20; vy += 54) {
      ctx.beginPath();
      ctx.moveTo(isl.topProfile[0].x - 50, vy);
      const endX = isl.topProfile[isl.topProfile.length - 1].x + 50;
      ctx.lineTo(endX, vy + 6);
      ctx.stroke();
    }

    // SKALNY TUNEL W WYŚPIE CENTRALNEJ
    if (isl.tunnel) {
      const tun = isl.tunnel;
      ctx.fillStyle = '#060913';
      ctx.beginPath();
      ctx.ellipse(tun.cx, tun.cy + 10, tun.w * 0.5, tun.h * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.beginPath();
      ctx.ellipse(tun.cx, tun.cy + 10, tun.w * 0.42, tun.h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // NATURALNA OSŁONA SKALNA NA PRAWEJ GRANI
    if (isl.rockCover) {
      const rc = isl.rockCover;
      ctx.fillStyle = '#0b1329';
      ctx.beginPath();
      ctx.moveTo(rc.x, rc.y + rc.h);
      ctx.lineTo(rc.x + 8, rc.y + 12);
      ctx.lineTo(rc.x + rc.w * 0.5, rc.y);
      ctx.lineTo(rc.x + rc.w - 6, rc.y + 16);
      ctx.lineTo(rc.x + rc.w, rc.y + rc.h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // NIEBIESKIE KRYSZTAŁY UNOBTANIUM
    if (Array.isArray(isl.crystals)) {
      for (let cIdx = 0; cIdx < isl.crystals.length; cIdx++) {
        const c = isl.crystals[cIdx];
        const pulse = 0.65 + 0.35 * Math.sin(time * 2.4 + cIdx * 1.5 + iIdx);

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const cGlow = ctx.createRadialGradient(c.rx, c.ry, 2, c.rx, c.ry, c.size * 2.8);
        cGlow.addColorStop(0.0, `rgba(34, 211, 238, ${0.85 * pulse})`);
        cGlow.addColorStop(0.4, `rgba(14, 116, 144, ${0.45 * pulse})`);
        cGlow.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
        ctx.fillStyle = cGlow;
        ctx.beginPath();
        ctx.arc(c.rx, c.ry, c.size * 2.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.moveTo(c.rx, c.ry - c.size);
        ctx.lineTo(c.rx + c.size * 0.6, c.ry - c.size * 0.2);
        ctx.lineTo(c.rx + c.size * 0.4, c.ry + c.size);
        ctx.lineTo(c.rx - c.size * 0.4, c.ry + c.size);
        ctx.lineTo(c.rx - c.size * 0.6, c.ry - c.size * 0.2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#E0F2FE';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(c.rx - c.size * 0.15, c.ry - c.size * 0.35, c.size * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    ctx.restore(); // Koniec clip skały

    // WIERZCHOŁKI I GZYMSY: NEONOWO-SZMARAGDOWA ROŚLINNOŚĆ
    ctx.save();
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 8.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(isl.topProfile[0].x, isl.topProfile[0].y + 2);
    for (let p = 1; p < isl.topProfile.length; p++) {
      ctx.lineTo(isl.topProfile[p].x, isl.topProfile[p].y + 2);
    }
    ctx.stroke();

    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 4.0;
    ctx.stroke();

    for (let p = 0; p < isl.topProfile.length - 1; p++) {
      const pA = isl.topProfile[p];
      const pB = isl.topProfile[p + 1];
      const segDist = Math.hypot(pB.x - pA.x, pB.y - pA.y);
      const tuftSteps = Math.floor(segDist / 18);

      for (let s = 0; s <= tuftSteps; s++) {
        const u = s / (tuftSteps || 1);
        const tx = pA.x + u * (pB.x - pA.x);
        const ty = pA.y + u * (pB.y - pA.y);

        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.arc(tx, ty, 4, Math.PI, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(tx, ty - 1, 2.5, Math.PI, Math.PI * 2);
        ctx.fill();

        if ((p + s) % 3 === 0) {
          ctx.fillStyle = '#22D3EE';
          ctx.beginPath();
          ctx.arc(tx + 2, ty - 2, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();

    // DÓŁ WYSP: DZIESIĄTKI ZWISAJĄCYCH KORZENI I LIAN
    ctx.save();
    for (let b = 0; b < isl.bottomProfile.length - 1; b++) {
      const ptA = isl.bottomProfile[b];
      const ptB = isl.bottomProfile[b + 1];
      const rootSteps = 3;

      for (let r = 0; r < rootSteps; r++) {
        const u = (r + 0.5) / rootSteps;
        const rx = ptA.x + u * (ptB.x - ptA.x);
        const ry = ptA.y + u * (ptB.y - ptA.y);

        const rLen = 35 + ((b * 19 + r * 37) % 85);
        const sway = Math.sin(time * 1.6 + rx * 0.02) * 8;
        const angleLean = ((b % 4) - 1.5) * 12;

        ctx.strokeStyle = ((b + r) % 2 === 0) ? '#064e3b' : '#022c22';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.quadraticCurveTo(
          rx + angleLean + sway * 0.6,
          ry + rLen * 0.5,
          rx + angleLean * 1.5 + sway,
          ry + rLen
        );
        ctx.stroke();

        if ((b * 3 + r) % 5 === 0) {
          ctx.fillStyle = (r % 2 === 0) ? '#22D3EE' : '#E879F9';
          ctx.beginPath();
          ctx.arc(rx + angleLean * 1.5 + sway, ry + rLen, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();

    ctx.restore();
  }
}

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
  name: 'Góry Pandory (Hallelujah Mountains)',
  width: 3600,
  height: 1400,
  spawns: [
    { x: 480, y: 370 },  // Spawn gracza (Cyan) - Szczyt lewej iglicy
    { x: 3100, y: 410 }, // Spawn bota (Orange) - Szczyt prawej grani
    { x: 1800, y: 560 }, // Piłka na środku wyspy centralnej
    { x: 1550, y: 540 }, // Bezpieczna strefa wyspy centralnej (zachód)
    { x: 2050, y: 540 }  // Bezpieczna strefa wyspy centralnej (wschód)
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
