// =========================================================================
// ARENAS/ARENA2.JS - SEKTOR X // INDUSTRIAL FOUNDRY & WASTE FACILITY
// Profesjonalna arena turniejowa w układzie „X / Klepsydra” w stylu SOLDAT
// Wymiary: 3600 x 1400 px
// =========================================================================

// =========================================================================
// 1. KONFIGURACJA ARENY (ARENA_2_CONFIG)
// =========================================================================
export const ARENA_2_CONFIG = {
  id: 'ARENA_2',
  alias: 'ARENA_2_SECTOR_X',
  name: 'Sektor X',
  subtitle: 'Industrial Foundry & Waste Facility',
  width: 3600,
  height: 1400,
  bounds: { minX: 0, maxX: 3600, minY: 0, maxY: 1400 },
  hazardZoneY: 1260, // Poziom lustra toksycznego kwasu
  abyssDeathY: 1350,
  spawns: [
    { x: 520,  y: 390, facing: 1 },  // Platforma A (Góra-Lewo)
    { x: 3080, y: 390, facing: -1 }, // Platforma B (Góra-Prawo)
    { x: 520,  y: 970, facing: 1 },  // Platforma C (Dół-Lewo)
    { x: 3080, y: 970, facing: -1 }  // Platforma D (Dół-Prawo)
  ]
};

export const ARENA_2_SECTOR_X = ARENA_2_CONFIG;
export const ARENA_2_PANDORA = ARENA_2_CONFIG; // Alias wstecznej kompatybilności

// =========================================================================
// 2. TABLICA FIZYCZNYCH PLATFORM (ARENA_2_PLATFORMS)
// Turniejowy układ „X / Klepsydra” ze zjazdami pochyłymi (slopes)
// =========================================================================
export const ARENA_2_PLATFORMS = [
  // 1. SUFIT: Wąskie belki techniczne i kratownice (drop-through)
  {
    id: 'ceil_pipe_left',
    name: 'Kratownica Sufitowa Lewa',
    x: 600,
    y: 180,
    w: 520,
    h: 16,
    isPlatform: true,
    isDropThrough: true,
    oneWay: true
  },
  {
    id: 'ceil_pipe_mid',
    name: 'Magistrala Sufitowa Środek',
    x: 1540,
    y: 150,
    w: 520,
    h: 16,
    isPlatform: true,
    isDropThrough: true,
    oneWay: true
  },
  {
    id: 'ceil_pipe_right',
    name: 'Kratownica Sufitowa Prawa',
    x: 2480,
    y: 180,
    w: 520,
    h: 16,
    isPlatform: true,
    isDropThrough: true,
    oneWay: true
  },

  // 2. GÓRNE BASTIONY A i B (Lite, solidne platformy)
  {
    id: 'plat_A_top_left',
    name: 'Bastion Górny A (Lewy)',
    x: 260,
    y: 460,
    w: 620,
    h: 32,
    isSolid: true,
    solid: true,
    isPlatform: true
  },
  {
    id: 'plat_B_top_right',
    name: 'Bastion Górny B (Prawy)',
    x: 2720,
    y: 460,
    w: 620,
    h: 32,
    isSolid: true,
    solid: true,
    isPlatform: true
  },

  // 3. RAMPY GÓRNE (Ukośne zjazdy łączące bastiony ze środkiem)
  // Z Platformy A ku centrum: od (880, 460) do (1440, 720)
  {
    id: 'ramp_top_left',
    name: 'Rampa Górna Lewa',
    x1: 880,
    y1: 460,
    x2: 1440,
    y2: 720,
    thickness: 18,
    isSlope: true,
    isPlatform: true,
    oneWay: true,
    x: 880,
    w: 560,
    y: 460,
    h: 260,
    startY: 460,
    endY: 720,
    surfacePoints: [
      { x: 880, y: 460 },
      { x: 1440, y: 720 }
    ]
  },
  // Z Platformy B ku centrum: od (2720, 460) do (2160, 720)
  {
    id: 'ramp_top_right',
    name: 'Rampa Górna Prawa',
    x1: 2720,
    y1: 460,
    x2: 2160,
    y2: 720,
    thickness: 18,
    isSlope: true,
    isPlatform: true,
    oneWay: true,
    x: 2160,
    w: 560,
    y: 460,
    h: 260,
    startY: 720,
    endY: 460,
    surfacePoints: [
      { x: 2160, y: 720 },
      { x: 2720, y: 460 }
    ]
  },

  // 4. [ŚRODEK] - Centralny hub taktyczny (kratownica drop-through)
  {
    id: 'center_hub',
    name: 'Centralny Hub Taktyczny',
    x: 1440,
    y: 720,
    w: 720,
    h: 26,
    isPlatform: true,
    isDropThrough: true,
    oneWay: true
  },

  // 5. RAMPY DOLNE (Ukośne zjazdy ze środka na dolne platformy)
  // Ze Środka do Platformy C: od (1440, 746) do (900, 1040)
  {
    id: 'ramp_bot_left',
    name: 'Rampa Dolna Lewa',
    x1: 1440,
    y1: 746,
    x2: 900,
    y2: 1040,
    thickness: 18,
    isSlope: true,
    isPlatform: true,
    oneWay: true,
    x: 900,
    w: 540,
    y: 746,
    h: 294,
    startY: 1040,
    endY: 746,
    surfacePoints: [
      { x: 900, y: 1040 },
      { x: 1440, y: 746 }
    ]
  },
  // Ze Środka do Platformy D: od (2160, 746) do (2700, 1040)
  {
    id: 'ramp_bot_right',
    name: 'Rampa Dolna Prawa',
    x1: 2160,
    y1: 746,
    x2: 2700,
    y2: 1040,
    thickness: 18,
    isSlope: true,
    isPlatform: true,
    oneWay: true,
    x: 2160,
    w: 540,
    y: 746,
    h: 294,
    startY: 746,
    endY: 1040,
    surfacePoints: [
      { x: 2160, y: 746 },
      { x: 2700, y: 1040 }
    ]
  },

  // 6. DOLNE BASTIONY C i D (Pozycje obronne nad kwasem)
  {
    id: 'plat_C_bot_left',
    name: 'Bastion Dolny C (Lewy)',
    x: 260,
    y: 1040,
    w: 640,
    h: 32,
    isSolid: true,
    solid: true,
    isPlatform: true
  },
  {
    id: 'plat_D_bot_right',
    name: 'Bastion Dolny D (Prawy)',
    x: 2700,
    y: 1040,
    w: 640,
    h: 32,
    isSolid: true,
    solid: true,
    isPlatform: true
  }
];

// Aliasy wstecznej kompatybilności dla fizyki i orkiestratora
export const ARENA_2_PANDORA_PLATFORMS = ARENA_2_PLATFORMS;
export const ARENA_CYBER_STADIUM_PLATFORMS = ARENA_2_PLATFORMS;
export const ARENA_2_PANDORA_GOALS = [];
export const ARENA_CYBER_STADIUM_GOALS = [];
export const ARENA_CYBER_STADIUM_BARRICADES = [];
export const ARENA_2_BRIDGES = [];
export const LEFT_VINE_BRIDGE_POINTS = [];
export const RIGHT_VINE_BRIDGE_POINTS = [];

export function resetArena2Bridges() {}
export function applyPandoraUpdraft() { return false; }
export function checkPandoraUpdraft() { return false; }

// =========================================================================
// 3. PREALOKOWANE STRUKTURY DLA 60 FPS (ZERO GC ALLOCATIONS)
// =========================================================================
const ACID_BUBBLES_COUNT = 28;
const _acidBubbles = [];
for (let i = 0; i < ACID_BUBBLES_COUNT; i++) {
  _acidBubbles.push({
    x: 100 + (i * 123.4) % 3400,
    y: 1260 + (i * 17.8) % 120,
    size: 2.5 + (i % 4) * 1.5,
    speedY: 0.6 + (i % 3) * 0.4,
    phase: i * 0.52,
    life: Math.random() * 80
  });
}

const INDUSTRIAL_DUST_COUNT = 32;
const _industrialDust = [];
for (let i = 0; i < INDUSTRIAL_DUST_COUNT; i++) {
  _industrialDust.push({
    baseX: 80 + (i * 110.5) % 3440,
    baseY: 200 + (i * 35.7) % 950,
    size: 1.4 + (i % 3) * 0.8,
    speedX: ((i % 5) - 2) * 3.5,
    speedY: -4.0 - (i % 4) * 2.5,
    phase: i * 0.4,
    colorType: (i % 3) // 0: amber, 1: smoke, 2: cyan
  });
}

/** Zwraca falujące lustro toksycznego kwasu (Y ≈ 1260) */
function getAcidSurfaceY(x, time) {
  return 1260 + Math.sin(time * 2.8 + x * 0.018) * 3.2 + Math.sin(time * 1.4 + x * 0.042) * 1.6;
}

// =========================================================================
// MONUMENTALNY PRZEMYSŁOWY WENTYLATOR CENTRALNY (SEKTOR X)
// Symetryczny punkt centralny areny w osi litery „X” (fanCenterX = 1800, fanCenterY = 580)
// =========================================================================
export function drawMonumentalCenterTurbine(ctx, time) {
  ctx.save();
  ctx.shadowBlur = 0;

  const fanCenterX = 1800;
  const fanCenterY = 580;
  const fanRadius = 300; // Kompaktowy promień (ok. 25% mniejszy, zgrabnie mieszczący się za kładką)
  const hubRadius = 54;  // Proporcjonalna piasta środkowa (54 px)
  const rotation = time * 0.45;

  // 1. ZEWNĘTRZNA CZELUŚĆ SZYBU WENTYLACYJNEGO (GŁĘBOKI TUNEL)
  ctx.fillStyle = '#020406';
  ctx.beginPath();
  ctx.arc(fanCenterX, fanCenterY, fanRadius + 20, 0, Math.PI * 2);
  ctx.fill();

  // 2. STALOWY KOŁNIERZ MONTAŻOWY (CASING FLANGE // R = 300 do 320)
  const flangeGrad = ctx.createRadialGradient(fanCenterX, fanCenterY, fanRadius - 6, fanCenterX, fanCenterY, fanRadius + 20);
  flangeGrad.addColorStop(0.00, '#0a1017');
  flangeGrad.addColorStop(0.55, '#151f2b');
  flangeGrad.addColorStop(0.85, '#222f3e');
  flangeGrad.addColorStop(1.00, '#090d14');
  ctx.fillStyle = flangeGrad;
  ctx.beginPath();
  ctx.arc(fanCenterX, fanCenterY, fanRadius + 20, 0, Math.PI * 2);
  ctx.arc(fanCenterX, fanCenterY, fanRadius, 0, Math.PI * 2, true);
  ctx.fill();

  ctx.strokeStyle = '#2d3748';
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.arc(fanCenterX, fanCenterY, fanRadius + 20, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#1a202c';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(fanCenterX, fanCenterY, fanRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Nity i śruby montażowe na obwodzie kołnierza (co 15 stopni)
  const boltCount = 24;
  const boltR = fanRadius + 10;
  for (let i = 0; i < boltCount; i++) {
    const bAngle = (i * Math.PI * 2) / boltCount;
    const bx = fanCenterX + Math.cos(bAngle) * boltR;
    const by = fanCenterY + Math.sin(bAngle) * boltR;

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(bx, by, 3.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(bx - 0.8, by - 0.8, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. CHŁODNY RADIALNY BLASK SZYBU WENTYLACYJNEGO (#0e2a38 -> transparent)
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const ventGlow = ctx.createRadialGradient(fanCenterX, fanCenterY, 20, fanCenterX, fanCenterY, fanRadius);
  ventGlow.addColorStop(0.00, 'rgba(14, 42, 56, 0.65)'); // #0e2a38
  ventGlow.addColorStop(0.45, 'rgba(14, 42, 56, 0.35)');
  ventGlow.addColorStop(0.75, 'rgba(10, 28, 38, 0.15)');
  ventGlow.addColorStop(1.00, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = ventGlow;
  ctx.beginPath();
  ctx.arc(fanCenterX, fanCenterY, fanRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 4. STALOWE BELKI NOŚNE KRZYŻAKA SZYBU (KRATOWNICA W TLE ZA ŁOPATKAMI)
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(fanCenterX - fanRadius, fanCenterY);
  ctx.lineTo(fanCenterX + fanRadius, fanCenterY);
  ctx.moveTo(fanCenterX, fanCenterY - fanRadius);
  ctx.lineTo(fanCenterX, fanCenterY + fanRadius);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(fanCenterX - fanRadius, fanCenterY);
  ctx.lineTo(fanCenterX + fanRadius, fanCenterY);
  ctx.moveTo(fanCenterX, fanCenterY - fanRadius);
  ctx.lineTo(fanCenterX, fanCenterY + fanRadius);
  ctx.stroke();

  // 5. OBROTOWE ŁOPATKI WENTYLATORA (rotation = time * 0.45)
  const bladeCount = 6;
  const bladeWidthAng = 0.28;

  for (let b = 0; b < bladeCount; b++) {
    const ang = rotation + (b * Math.PI * 2) / bladeCount;
    const cosAng = Math.cos(ang);
    const sinAng = Math.sin(ang);

    // Cień łopatki rzucany w głąb szybu
    ctx.save();
    ctx.fillStyle = 'rgba(2, 4, 8, 0.85)';
    ctx.beginPath();
    ctx.moveTo(fanCenterX + Math.cos(ang - bladeWidthAng * 0.4) * hubRadius, fanCenterY + Math.sin(ang - bladeWidthAng * 0.4) * hubRadius + 10);
    ctx.lineTo(fanCenterX + Math.cos(ang - bladeWidthAng) * fanRadius, fanCenterY + Math.sin(ang - bladeWidthAng) * fanRadius + 10);
    ctx.lineTo(fanCenterX + Math.cos(ang + bladeWidthAng) * fanRadius, fanCenterY + Math.sin(ang + bladeWidthAng) * fanRadius + 10);
    ctx.lineTo(fanCenterX + Math.cos(ang + bladeWidthAng * 0.4) * hubRadius, fanCenterY + Math.sin(ang + bladeWidthAng * 0.4) * hubRadius + 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Korpus stalowej aerodynamicznej łopatki z gradientem
    ctx.save();
    const bladeGrad = ctx.createLinearGradient(
      fanCenterX + cosAng * hubRadius, fanCenterY + sinAng * hubRadius,
      fanCenterX + cosAng * fanRadius, fanCenterY + sinAng * fanRadius
    );
    bladeGrad.addColorStop(0.00, '#0d131a');
    bladeGrad.addColorStop(0.35, '#141d27');
    bladeGrad.addColorStop(0.70, '#1c2836');
    bladeGrad.addColorStop(1.00, '#0a0f15');
    ctx.fillStyle = bladeGrad;

    ctx.beginPath();
    ctx.moveTo(fanCenterX + Math.cos(ang - bladeWidthAng * 0.35) * hubRadius, fanCenterY + Math.sin(ang - bladeWidthAng * 0.35) * hubRadius);
    ctx.lineTo(fanCenterX + Math.cos(ang - bladeWidthAng) * (fanRadius - 5), fanCenterY + Math.sin(ang - bladeWidthAng) * (fanRadius - 5));
    ctx.arc(fanCenterX, fanCenterY, fanRadius - 5, ang - bladeWidthAng, ang + bladeWidthAng);
    ctx.lineTo(fanCenterX + Math.cos(ang + bladeWidthAng * 0.35) * hubRadius, fanCenterY + Math.sin(ang + bladeWidthAng * 0.35) * hubRadius);
    ctx.closePath();
    ctx.fill();

    // Krawędź natarcia (jasny frezowany refleks stali)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(fanCenterX + Math.cos(ang - bladeWidthAng * 0.35) * hubRadius, fanCenterY + Math.sin(ang - bladeWidthAng * 0.35) * hubRadius);
    ctx.lineTo(fanCenterX + Math.cos(ang - bladeWidthAng) * (fanRadius - 5), fanCenterY + Math.sin(ang - bladeWidthAng) * (fanRadius - 5));
    ctx.stroke();

    // Przetłoczenie wzmacniające wzdłuż profilu łopatki
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(fanCenterX + cosAng * hubRadius, fanCenterY + sinAng * hubRadius);
    ctx.lineTo(fanCenterX + cosAng * (fanRadius - 8), fanCenterY + sinAng * (fanRadius - 8));
    ctx.stroke();

    ctx.restore();
  }

  // 6. CENTRALNA PIASTA ROTORA (ROTOR HUB // hubRadius = 54)
  const hubGrad = ctx.createRadialGradient(fanCenterX - 12, fanCenterY - 12, 6, fanCenterX, fanCenterY, hubRadius);
  hubGrad.addColorStop(0.00, '#2d3748');
  hubGrad.addColorStop(0.45, '#1a202c');
  hubGrad.addColorStop(0.85, '#0f172a');
  hubGrad.addColorStop(1.00, '#05080f');
  ctx.fillStyle = hubGrad;
  ctx.beginPath();
  ctx.arc(fanCenterX, fanCenterY, hubRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.arc(fanCenterX, fanCenterY, hubRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Wieniec śrub na obwodzie piasty
  const hubBoltCount = 8;
  const hubBoltR = 37;
  for (let i = 0; i < hubBoltCount; i++) {
    const hAngle = rotation + (i * Math.PI * 2) / hubBoltCount;
    const hbx = fanCenterX + Math.cos(hAngle) * hubBoltR;
    const hby = fanCenterY + Math.sin(hAngle) * hubBoltR;

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(hbx, hby, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(hbx - 0.6, hby - 0.6, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Centralny stożek aerodynamiczny wału silnika (spinner cone // R = 24)
  const coneGrad = ctx.createRadialGradient(fanCenterX - 6, fanCenterY - 6, 3, fanCenterX, fanCenterY, 24);
  coneGrad.addColorStop(0.00, '#475569');
  coneGrad.addColorStop(0.50, '#1e293b');
  coneGrad.addColorStop(1.00, '#090d16');
  ctx.fillStyle = coneGrad;
  ctx.beginPath();
  ctx.arc(fanCenterX, fanCenterY, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(fanCenterX, fanCenterY, 24, 0, Math.PI * 2);
  ctx.stroke();

  // Wskaźnik statusu osi / centralna dioda
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(fanCenterX, fanCenterY, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// =========================================================================
// 4. RENDEROWANIE TŁA INDUSTRIALNEGO (DRAWARENA2BACKGROUND / SEKTOR X)
// Ciemny bunkier przemysłowy, monumentalna turbina centralna, kratownice i rurociągi
// =========================================================================
export function drawArena2Background(ctx, camera) {
  if (!ctx) return;
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';

  const W_screen = ctx.canvas?.width || (typeof window !== 'undefined' ? window.innerWidth : 1920);
  const H_screen = ctx.canvas?.height || (typeof window !== 'undefined' ? window.innerHeight : 1080);
  const time = performance.now() * 0.001;

  const camX = camera ? (camera.x || 0) : 0;
  const camY = camera ? (camera.y || 0) : 0;

  // -----------------------------------------------------------------------
  // WARSTWA 0: BAZOWY GRADIENT BETONOWO-STALOWEGO BUNKRU
  // -----------------------------------------------------------------------
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H_screen);
  bgGrad.addColorStop(0.00, '#06090e'); // Ciemny grafit sufitu hali
  bgGrad.addColorStop(0.35, '#0a0f16'); // Ciemna stal bunkra
  bgGrad.addColorStop(0.70, '#0d151c'); // Poziom środkowych pomostów
  bgGrad.addColorStop(0.92, '#071813'); // Toksyczna poświata nad kwasem
  bgGrad.addColorStop(1.00, '#040d0a'); // Dno zbiornika odpadów
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W_screen, H_screen);

  // Pionowe dylatacje i płyty pancerne w tle (Paralaksa 0.015)
  ctx.save();
  const seamPeriod = 360;
  const seamOffset = ((camX * 0.015) % seamPeriod + seamPeriod) % seamPeriod;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1.5;
  for (let sx = -seamOffset; sx < W_screen + seamPeriod; sx += seamPeriod) {
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, H_screen);
    ctx.stroke();

    // Nitowania na łączeniach płyt
    ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
    for (let sy = 40; sy < H_screen; sy += 120) {
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
    }
  }
  ctx.restore();

  // -----------------------------------------------------------------------
  // WARSTWA 1: SIECI MAGISTRALI RUROWYCH I ZAWORÓW W GŁĘBI ŚCIANY (PARALAKSA 0.045)
  // -----------------------------------------------------------------------
  ctx.save();
  const pipeParallaxX = camX * 0.045;
  const pipeWrap = W_screen + 800;

  // Główny rurociąg chłodzący biegnący w tle hali
  const mainPipeY = H_screen * 0.40 - camY * 0.03;
  ctx.fillStyle = '#0a1017';
  ctx.fillRect(-100, mainPipeY, W_screen + 200, 26);
  ctx.strokeStyle = '#162232';
  ctx.lineWidth = 2.0;
  ctx.strokeRect(-100, mainPipeY, W_screen + 200, 26);

  // Kołnierze montażowe rurociągu co 280 px
  for (let fx = (-pipeParallaxX % 280 + 280) % 280 - 100; fx < W_screen + 100; fx += 280) {
    ctx.fillStyle = '#162232';
    ctx.fillRect(fx - 6, mainPipeY - 4, 12, 34);
    ctx.strokeStyle = '#223246';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(fx - 6, mainPipeY - 4, 12, 34);

    // Zielona/bursztynowa dioda statusu ciśnienia
    const isOk = ((Math.floor(fx / 280)) % 3 !== 0);
    ctx.fillStyle = isOk ? '#10b981' : '#f59e0b';
    ctx.fillRect(fx - 2, mainPipeY + 10, 4, 4);
  }

  // Pionowe rury zrzutowe opadające w dół po bokach
  for (let rx = 240; rx < 3400; rx += 680) {
    const screenRx = (rx - pipeParallaxX) % pipeWrap - 200;
    if (screenRx < -80 || screenRx > W_screen + 80) continue;

    ctx.fillStyle = '#0a1017';
    ctx.fillRect(screenRx - 14, 0, 28, H_screen);
    ctx.strokeStyle = 'rgba(22, 34, 50, 0.7)';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(screenRx - 14, 0, 28, H_screen);
  }
  ctx.restore();

  // -----------------------------------------------------------------------
  // WARSTWA 2: MONUMENTALNY PRZEMYSŁOWY WENTYLATOR CENTRALNY (SEKTOR X)
  // Dokładny środek areny: X = 1800, Y = 580 (promień 400 px, piasta 76 px)
  // Symetryczny punkt centralny za podestem taktycznym i skrzyżowaniem ramp „X”
  // -----------------------------------------------------------------------
  ctx.save();
  const camZoom = (camera && camera.zoom) ? camera.zoom : 1;
  ctx.scale(camZoom, camZoom);
  ctx.translate(-camX, -camY);

  drawMonumentalCenterTurbine(ctx, time);

  ctx.restore();

  // -----------------------------------------------------------------------
  // WARSTWA 3: PRZEMYSŁOWE NAPISY OSTRZEGAWCZE I GRAFIKI TAKTYCZNE
  // -----------------------------------------------------------------------
  ctx.save();
  const signX = (W_screen * 0.25 - camX * 0.035) % (W_screen + 600) - 100;
  const signY = H_screen * 0.24 - camY * 0.02;
  ctx.font = '900 24px monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.textAlign = 'left';
  ctx.fillText('SECTOR-X // HEAVY REFINERY', signX, signY);
  ctx.font = '700 12px monospace';
  ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
  ctx.fillText('⚠ DANGER: CAUSTIC WASTE DISPOSAL ⚠', signX, signY + 22);

  const sign2X = (W_screen * 0.72 - camX * 0.035) % (W_screen + 600) - 100;
  ctx.font = '900 20px monospace';
  ctx.fillStyle = 'rgba(16, 185, 129, 0.06)';
  ctx.fillText('FOUNDRY CORE // ZONE-02', sign2X, signY + 40);
  ctx.restore();

  // -----------------------------------------------------------------------
  // WARSTWA 4: UNOSZĄCE SIĘ CZĄSTECZKI PYŁU I OPARÓW PRZEMYSŁOWYCH (60 FPS)
  // -----------------------------------------------------------------------
  ctx.save();
  for (let i = 0; i < _industrialDust.length; i++) {
    const d = _industrialDust[i];
    const dx = (d.baseX + Math.sin(time * 1.2 + d.phase) * 20 - camX * 0.03 % W_screen + W_screen) % W_screen;
    const dy = ((d.baseY + time * d.speedY) % H_screen + H_screen) % H_screen;
    const pulse = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(time * 2.0 + d.phase));

    if (d.colorType === 0) {
      ctx.fillStyle = `rgba(245, 158, 11, ${pulse * 0.6})`; // Bursztynowy pył
    } else if (d.colorType === 1) {
      ctx.fillStyle = `rgba(148, 163, 184, ${pulse * 0.35})`; // Szary dym
    } else {
      ctx.fillStyle = `rgba(52, 211, 153, ${pulse * 0.65})`; // Cyjanowo-kwasowa drobina
    }
    ctx.beginPath();
    ctx.arc(dx, dy, d.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}

export function drawPandoraBackground(ctx, camera) {
  // Alias dla wstecznej kompatybilności
  drawArena2Background(ctx, camera);
}

// =========================================================================
// 5. RENDEROWANIE GEOMETRII ARENY 2 (DRAWARENA2GEOMETRY / SEKTOR X)
// Monolityczna konstrukcja industrialna: sufit, bastiony, zjazdy i basen kwasu
// =========================================================================
export function drawArena2Geometry(ctx, camera) {
  if (!ctx) return;
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';
  const time = performance.now() * 0.001;

  // DYNAMICZNE WYLICZENIE DOLNEJ KRAWĘDZI WIDOKU KAMERY
  const canvasH = (ctx.canvas && ctx.canvas.height) || (typeof window !== 'undefined' ? window.innerHeight : 1080);
  const camZoom = (camera && camera.zoom) ? camera.zoom : 1;
  const camY = (camera && typeof camera.y === 'number') ? camera.y : 0;
  const viewBottomY = camY + (canvasH / camZoom) + 400;
  const BOTTOM_Y = Math.max(1450, viewBottomY);

  // -----------------------------------------------------------------------
  // 0. ABSOLUTNY, W 100% KRYJĄCY MONOLITYCZNY PODKŁAD POD CAŁĄ ARENĄ
  // Zero widocznego tła od poziomu kwasu w dół (Y: 1250 do dna)
  // -----------------------------------------------------------------------
  ctx.fillStyle = '#010403';
  ctx.fillRect(-200, 1250, 4000, (BOTTOM_Y - 1250) + 200);


  // -----------------------------------------------------------------------
  // 1. ZBIORNIK TOKSYCZNEGO KWASU (HAZARD LAKE // Y = 1260 DO BOTTOM_Y)
  // Całkowicie kryjąca toń z bąblami chemicznymi i zielonym blaskiem
  // -----------------------------------------------------------------------
  drawAcidLake(ctx, time, BOTTOM_Y);

  // -----------------------------------------------------------------------
  // 2. SUFITOWE MAGISTRALE I BELKI TECHNICZNE (Y: 150-180)
  // -----------------------------------------------------------------------
  drawCeilingInfrastructure(ctx, time);

  // -----------------------------------------------------------------------
  // 3. GÓRNE BASTIONY A i B (X: 260-880 oraz 2720-3340, Y: 460)
  // -----------------------------------------------------------------------
  drawIndustrialFortressPlatform(ctx, 260, 460, 620, 32, 'A - TOP WEST', true, time);
  drawIndustrialFortressPlatform(ctx, 2720, 460, 620, 32, 'B - TOP EAST', false, time);

  // -----------------------------------------------------------------------
  // 4. UKOŚNE RAMPY GÓRNE (POŁĄCZENIE BASTIONÓW ZE ŚRODKIEM)
  // Rampa A: (880, 460) -> (1440, 720)
  // Rampa B: (2720, 460) -> (2160, 720)
  // -----------------------------------------------------------------------
  drawIndustrialTrussRamp(ctx, 880, 460, 1440, 720, 18, true, time);
  drawIndustrialTrussRamp(ctx, 2720, 460, 2160, 720, 18, false, time);

  // -----------------------------------------------------------------------
  // 5. CENTRALNY HUB TAKTYCZNY (X: 1440-2160, Y: 720, W: 720, H: 26)
  // -----------------------------------------------------------------------
  drawCenterTacticalHub(ctx, 1440, 720, 720, 26, time);

  // -----------------------------------------------------------------------
  // 6. UKOŚNE RAMPY DOLNE (ZE ŚRODKA NA DOLNE BASTIONY)
  // Rampa C: (1440, 746) -> (900, 1040)
  // Rampa D: (2160, 746) -> (2700, 1040)
  // -----------------------------------------------------------------------
  drawIndustrialTrussRamp(ctx, 1440, 746, 900, 1040, 18, false, time);
  drawIndustrialTrussRamp(ctx, 2160, 746, 2700, 1040, 18, true, time);

  // -----------------------------------------------------------------------
  // 7. DOLNE BASTIONY C i D (X: 260-900 oraz 2700-3340, Y: 1040)
  // -----------------------------------------------------------------------
  drawIndustrialFortressPlatform(ctx, 260, 1040, 640, 32, 'C - HAZARD DECK', true, time);
  drawIndustrialFortressPlatform(ctx, 2700, 1040, 640, 32, 'D - ACID PIER', false, time);

  // -----------------------------------------------------------------------
  // 8. ELEMENTY ATMOSFERYCZNE: OPARY KWASU I OSTRZEGAWCZE ŚWIATŁA STROBOSKOPOWE
  // -----------------------------------------------------------------------
  drawAcidVaporAndHazards(ctx, time);

  ctx.restore();
}

export function renderPandoraTerrain(ctx, camera) {
  drawArena2Geometry(ctx, camera);
}

export function drawArena2Foreground(ctx, camera) {
  drawArena2Geometry(ctx, camera);
}

// =========================================================================
// 6. SZCZEGÓŁOWE PROCEDURY RENDEROWANIA ELEMENTÓW INDUSTRIALNYCH
// =========================================================================

/** Rysuje jezioro żrącego kwasu o 100% kryciu */
function drawAcidLake(ctx, time, bottomY) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';

  const acidSteps = 36;
  const stepW = 3800 / acidSteps;

  // A. 100% KRYJĄCY GRADIENT TONI KWASU (ZERO PRZEŚWITÓW)
  const acidGrad = ctx.createLinearGradient(0, 1250, 0, bottomY);
  acidGrad.addColorStop(0.00, '#10b981'); // Jaskrawy szmaragdowy kwas na powierzchni
  acidGrad.addColorStop(0.12, '#059669'); // Głęboki szmaragd
  acidGrad.addColorStop(0.40, '#047857'); // Ciemna zieleń chemiczna
  acidGrad.addColorStop(0.75, '#022c22'); // Toksyczny osad
  acidGrad.addColorStop(1.00, '#01120d'); // Ciemność dna zbiornika

  ctx.fillStyle = acidGrad;
  ctx.beginPath();
  ctx.moveTo(-100, getAcidSurfaceY(-100, time));
  for (let i = 1; i <= acidSteps; i++) {
    const px = -100 + i * stepW;
    ctx.lineTo(px, getAcidSurfaceY(px, time));
  }
  ctx.lineTo(3700, bottomY + 200);
  ctx.lineTo(-100, bottomY + 200);
  ctx.closePath();
  ctx.fill();

  // B. PODWODNY SZLAK REFLEKSÓW KAUSTYCZNYCH
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.strokeStyle = 'rgba(167, 243, 208, 0.22)';
  ctx.lineWidth = 2.4;
  for (let c = 0; c < 12; c++) {
    const cx = c * 310 + Math.sin(time * 1.5 + c) * 35;
    const cy = getAcidSurfaceY(cx, time) + 8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(cx + 40, cy + 30, cx + 15, cy + 65);
    ctx.stroke();
  }
  ctx.restore();

  // C. LŚNIĄCA WSTĘGA I CYJANOWA PIANA NA FALACH KWASU
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.strokeStyle = 'rgba(209, 250, 229, 0.90)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-100, getAcidSurfaceY(-100, time));
  for (let i = 1; i <= acidSteps; i++) {
    const px = -100 + i * stepW;
    ctx.lineTo(px, getAcidSurfaceY(px, time));
  }
  ctx.stroke();

  // Dodatkowa neonowa poświata pod grzbietem fali
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
  ctx.lineWidth = 5.0;
  ctx.stroke();
  ctx.restore();

  // D. BĄBLE CHEMICZNE UNOSZĄCE SIĘ NA POWIERZCHNI
  for (let i = 0; i < _acidBubbles.length; i++) {
    const b = _acidBubbles[i];
    b.y -= b.speedY;
    if (b.y < 1254) {
      b.y = 1340 + Math.random() * 40;
      b.x = 80 + Math.random() * 3440;
    }
    const bx = b.x + Math.sin(time * 2.0 + b.phase) * 8;
    const by = b.y;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(167, 243, 208, 0.65)';
    ctx.beginPath();
    ctx.arc(bx, by, b.size, 0, Math.PI * 2);
    ctx.fill();

    // Punktowe białe lśnienie bąbelka
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bx - b.size * 0.3, by - b.size * 0.3, b.size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/** Rysuje rury i kratownice sufitowe (Y = 150-180) */
function drawCeilingInfrastructure(ctx, time) {
  const pipes = [
    { x: 600,  y: 180, w: 520, h: 16, id: 'pipe_A' },
    { x: 1540, y: 150, w: 520, h: 16, id: 'pipe_Mid' },
    { x: 2480, y: 180, w: 520, h: 16, id: 'pipe_B' }
  ];

  ctx.save();
  for (const p of pipes) {
    // Zawiesia sufitowe łączące rurę ze stropem hali
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3.0;
    for (let hx = p.x + 40; hx < p.x + p.w; hx += 110) {
      ctx.beginPath();
      ctx.moveTo(hx, 0);
      ctx.lineTo(hx, p.y);
      ctx.stroke();

      // Klamra mocująca
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(hx - 6, p.y - 8, 12, 10);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(hx - 6, p.y - 8, 12, 10);
    }

    // Korpus rury przemysłowej z metalicznym gradientem
    const pGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    pGrad.addColorStop(0.0, '#475569');
    pGrad.addColorStop(0.3, '#94a3b8');
    pGrad.addColorStop(0.6, '#334155');
    pGrad.addColorStop(1.0, '#0f172a');
    ctx.fillStyle = pGrad;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(p.x, p.y, p.w, p.h);

    // Górny pomost inspekcyjny (kratownica do biegania)
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + p.w, p.y);
    ctx.stroke();

    // Pierścienie uszczelniające co 60 px
    for (let rx = p.x + 30; rx < p.x + p.w; rx += 60) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(rx - 3, p.y - 2, 6, p.h + 4);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.0;
      ctx.strokeRect(rx - 3, p.y - 2, 6, p.h + 4);
    }

    // Neonowa linia wskaźnika telemetrycznego (bursztyn/cyjan)
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = p.id === 'pipe_Mid' ? '#38bdf8' : '#fbbf24';
    ctx.fillRect(p.x + 6, p.y + p.h / 2 - 1, p.w - 12, 2);
    ctx.restore();
  }
  ctx.restore();
}

/** Rysuje pancerny bastion ze stalowymi płytami i pasami ostrzegawczymi */
function drawIndustrialFortressPlatform(ctx, x, y, w, h, label, isLeft, time) {
  ctx.save();

  // Główny blok platformy (Hartowana stal pancerna - prosta, czysta belka)
  const platGrad = ctx.createLinearGradient(x, y, x, y + h);
  platGrad.addColorStop(0.0, '#334155');
  platGrad.addColorStop(0.2, '#1e293b');
  platGrad.addColorStop(0.8, '#0f172a');
  platGrad.addColorStop(1.0, '#020617');
  ctx.fillStyle = platGrad;
  ctx.fillRect(x, y, w, h);

  // Krawędź nośna platformy
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.0;
  ctx.strokeRect(x, y, w, h);

  // Pasy ostrzegawcze (Hazard Chevrons: Żółto-Czarne skosy) wzdłuż czoła
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 2, y + 2, w - 4, 10);
  ctx.clip();
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(x, y, w, 14);

  ctx.fillStyle = '#0f172a';
  for (let hx = x - 20; hx < x + w + 20; hx += 24) {
    ctx.beginPath();
    ctx.moveTo(hx, y);
    ctx.lineTo(hx + 12, y);
    ctx.lineTo(hx + 2, y + 14);
    ctx.lineTo(hx - 10, y + 14);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Nitowania konstrukcyjne na dolnej krawędzi
  ctx.fillStyle = '#475569';
  for (let nx = x + 18; nx < x + w - 10; nx += 38) {
    ctx.beginPath();
    ctx.arc(nx, y + h - 8, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Neonowy pasek taktyczny i napis identyfikacyjny platformy
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = isLeft ? '#06b6d4' : '#f97316';
  ctx.fillRect(x + (isLeft ? 12 : w - 90), y + 14, 78, 3);

  ctx.font = '900 9px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = isLeft ? 'left' : 'right';
  ctx.fillText(label, isLeft ? x + 16 : x + w - 16, y + 24);
  ctx.restore();

  ctx.restore();
}

/** Rysuje ukośną kratownicową rampę stalową łączącą poziomy */
function drawIndustrialTrussRamp(ctx, x1, y1, x2, y2, thickness, isAscending, time) {
  ctx.save();

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  ctx.translate(x1, y1);
  ctx.rotate(angle);

  // A. Dolna kratownica konstrukcyjna (Open-web steel truss)
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(0, thickness);
  ctx.lineTo(len, thickness);
  ctx.moveTo(0, thickness + 26);
  ctx.lineTo(len, thickness + 26);
  ctx.stroke();

  // Ukośne rygle kratownicy
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.8;
  const trussStep = 34;
  for (let tx = 0; tx < len - 20; tx += trussStep) {
    ctx.beginPath();
    ctx.moveTo(tx, thickness);
    ctx.lineTo(tx + trussStep / 2, thickness + 26);
    ctx.lineTo(tx + trussStep, thickness);
    ctx.stroke();
  }

  // B. Płyta bieżna rampy (Ryflowana stal antypoślizgowa)
  const rGrad = ctx.createLinearGradient(0, 0, 0, thickness);
  rGrad.addColorStop(0.0, '#475569');
  rGrad.addColorStop(0.3, '#334155');
  rGrad.addColorStop(1.0, '#0f172a');
  ctx.fillStyle = rGrad;
  ctx.fillRect(0, 0, len, thickness);

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(0, 0, len, thickness);

  // Poprzeczne rowki ryflowania antypoślizgowego
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.4;
  for (let rx = 10; rx < len - 6; rx += 14) {
    ctx.beginPath();
    ctx.moveTo(rx, 2);
    ctx.lineTo(rx, thickness - 2);
    ctx.stroke();
  }

  // C. Prowadnica świetlna wzdłuż krawędzi (LED guide strip)
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
  ctx.fillRect(4, 1, len - 8, 2.0);
  ctx.restore();

  ctx.restore();
}

/** Rysuje centralny podwieszany hub taktyczny */
function drawCenterTacticalHub(ctx, x, y, w, h, time) {
  ctx.save();

  // Potężne liny i ściągi nośne podwieszające hub pod strop hali
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.moveTo(x + 40, y);
  ctx.lineTo(x - 120, 0);
  ctx.moveTo(x + w - 40, y);
  ctx.lineTo(x + w + 120, 0);
  ctx.stroke();

  // Jaśniejszy rdzeń ściągów stalowych
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Podwieszany reaktor / generator energii pod hubem (Y: 746-860)
  const genX = x + w / 2 - 140;
  const genY = y + h;
  const genW = 280;
  const genH = 90;

  const gGrad = ctx.createLinearGradient(genX, genY, genX + genW, genY + genH);
  gGrad.addColorStop(0.0, '#0f172a');
  gGrad.addColorStop(0.5, '#1e293b');
  gGrad.addColorStop(1.0, '#020617');
  ctx.fillStyle = gGrad;
  ctx.fillRect(genX, genY, genW, genH);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2.0;
  ctx.strokeRect(genX, genY, genW, genH);

  // Pulsujący rdzeń plazmowy reaktora w trybie 'screen'
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const pulse = 0.55 + 0.35 * Math.sin(time * 3.5);
  ctx.fillStyle = `rgba(16, 185, 129, ${pulse})`;
  ctx.fillRect(genX + 30, genY + 25, genW - 60, 36);

  ctx.strokeStyle = `rgba(110, 231, 183, ${pulse * 1.2})`;
  ctx.lineWidth = 2.0;
  ctx.strokeRect(genX + 30, genY + 25, genW - 60, 36);
  ctx.restore();

  // Korpus platformy huba (Ażurowy pomost techniczny - kratownica)
  const hGrad = ctx.createLinearGradient(x, y, x, y + h);
  hGrad.addColorStop(0.0, '#384656');
  hGrad.addColorStop(0.4, '#1e293b');
  hGrad.addColorStop(1.0, '#0b111a');
  ctx.fillStyle = hGrad;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2.2;
  ctx.strokeRect(x, y, w, h);

  // Ażurowa siatka kratownicy (Catwalk mesh)
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 1.2;
  for (let mx = x + 8; mx < x + w - 4; mx += 16) {
    ctx.beginPath();
    ctx.moveTo(mx, y + 2);
    ctx.lineTo(mx, y + h - 2);
    ctx.stroke();
  }

  // Ostrzegawcze żółte obramowanie krawędzi wejściowych
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(x + 2, y + 2, 24, 4);
  ctx.fillRect(x + w - 26, y + 2, 24, 4);

  // Wskaźnik statusu huba
  ctx.font = '900 10px monospace';
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.fillText('◄ CENTER TAC-HUB // SECTOR X ►', x + w / 2, y + 17);

  ctx.restore();
}

/** Rysuje parę chemiczną i światła stroboskopowe */
function drawAcidVaporAndHazards(ctx, time) {
  ctx.save();

  // Mgła toksyczna unosząca się nad kwasem (Y: 1220-1260)
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let v = 0; v < 8; v++) {
    const vx = v * 480 + Math.sin(time * 0.9 + v) * 45;
    const vy = 1245 + Math.cos(time * 1.1 + v) * 8;
    const vr = 140;

    const vGrad = ctx.createRadialGradient(vx, vy, 10, vx, vy, vr);
    vGrad.addColorStop(0.0, 'rgba(52, 211, 153, 0.16)');
    vGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.06)');
    vGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = vGrad;
    ctx.beginPath();
    ctx.arc(vx, vy, vr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Pulsujące stroboskopy ostrzegawcze na rogach dolnych bastionów
  const strobeList = [
    { x: 265, y: 1040 },
    { x: 895, y: 1040 },
    { x: 2705, y: 1040 },
    { x: 3335, y: 1040 }
  ];

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let sIdx = 0; sIdx < strobeList.length; sIdx++) {
    const st = strobeList[sIdx];
    const flash = Math.pow(Math.sin(time * 4.0 + sIdx * 1.57), 8); // Ostre impulsy
    ctx.fillStyle = `rgba(239, 68, 68, ${0.2 + flash * 0.8})`;
    ctx.beginPath();
    ctx.arc(st.x, st.y - 4, 3.5, 0, Math.PI * 2);
    ctx.fill();

    if (flash > 0.4) {
      ctx.fillStyle = `rgba(254, 202, 202, ${flash})`;
      ctx.beginPath();
      ctx.arc(st.x, st.y - 4, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.restore();
}

// =========================================================================
// 7. AKTUALIZACJA LOGIKI ARENY 2 (UPDATEARENA2)
// Obrażenia od żrącego kwasu oraz strefa natychmiastowej śmierci (Abyss)
// =========================================================================
export function updateArena2(dt, players) {
  if (!Array.isArray(players)) return;

  const acidLevelY = ARENA_2_CONFIG.hazardZoneY; // 1260
  const deathLevelY = ARENA_2_CONFIG.abyssDeathY;  // 1350

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    if (!p || p.isDead) continue;

    const feetY = p.y + (p.h || 70);

    // Wpadnięcie w otchłań kwasu poniżej 1350 px -> natychmiastowa śmierć
    if (feetY >= deathLevelY) {
      p.hp = 0;
      p.isDead = true;
      p.respawnTimer = 75;
      p.vx = 0;
      p.vy = 2.0;
      p.onGround = false;
      p.currentPlatform = null;
    }
    // Zanurzenie w lustrze kwasu (1260 - 1350 px) -> silne obrażenia chemiczne
    else if (feetY >= acidLevelY) {
      p.hp -= 0.65; // ~39 HP na sekundę przy 60 FPS
      p.vx *= 0.94; // Opór gęstej cieczy chemicznej
      if (p.hp <= 0) {
        p.hp = 0;
        p.isDead = true;
        p.respawnTimer = 75;
      }
    }
  }
}

// =========================================================================
// 8. KONTRAKT WTYCZKI ARENY 2 (PLUGIN DEFINITION)
// =========================================================================
const arena2 = {
  id: 'arena-2',
  alias: 'ARENA_2_SECTOR_X',
  name: 'Sektor X (Industrial Foundry)',
  width: 3600,
  height: 1400,
  spawns: ARENA_2_CONFIG.spawns,
  platforms: ARENA_2_PLATFORMS,
  bridges: [],
  customObjects: [],
  reset() {},
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
    return false;
  },
  onKickHit(player, kickBox) {
    return false;
  },
  onExplosion(expX, expY, radius, context) {
    return false;
  }
};

export default arena2;
