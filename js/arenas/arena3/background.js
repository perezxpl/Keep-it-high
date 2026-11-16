// =========================================================================
// ARENAS/ARENA3/BACKGROUND.JS - PROCEDURALNE NOCNE TŁO ARENY 3 (CANVAS 2D)
// 100% proceduralny, zoptymalizowany silnik nocnego nieba:
// - Aksamitne nocne niebo (głęboki kosmiczny granat, ciemny petrol, szmaragd dżungli)
// - Dwuwarstwowe gwiazdy z paralaksą i organicznym migotaniem (twinkle)
// - Subtelna sporadyczna spadająca gwiazda (meteor)
// - Blady sierp księżyca z chłodną aureolą i światłem popielatym
// - Srebrzyste smugi księżycowe (moonbeams)
// - Wielowarstwowe zbuforowane sylwetki gór i prastarej dżungli w paralaksie
// - Bioluminescencyjne świetliki (fireflies) unoszące się w mroku
// - Nocne odbicie światła księżyca w toni rzeki
// =========================================================================

import { animTime } from './state.js';

// =========================================================================
// 1. ZAINICJALIZOWANE WARSTWY GWIAZD (DETERMINISTYCZNY STARFIELD)
// =========================================================================
const STAR_COUNT_FAR = 140;
const STAR_COUNT_NEAR = 36;
const STARS_FAR = [];
const STARS_NEAR = [];

// Prosty generator pseudolosowy (LCCG), aby układ gwiazd był stały i powtarzalny
let _seed = 48291;
function lcgRandom() {
  _seed = (_seed * 1664525 + 1013904223) % 4294967296;
  return _seed / 4294967296;
}

// Inicjalizacja gwiazd dalekich (mikro-gwiazdy, subtelne migotanie)
for (let i = 0; i < STAR_COUNT_FAR; i++) {
  STARS_FAR.push({
    xNorm: lcgRandom(), // 0.0 - 1.0 (rozpiętość horyzontu)
    yNorm: Math.pow(lcgRandom(), 1.35) * 0.72, // Skupione w górnych 72% nieba
    size: 0.75 + lcgRandom() * 0.65,
    speed: 1.2 + lcgRandom() * 2.4,
    phase: lcgRandom() * Math.PI * 2,
    baseAlpha: 0.35 + lcgRandom() * 0.50,
    colorType: Math.floor(lcgRandom() * 4) // 0: ice cyan, 1: pure white, 2: warm cream, 3: mint
  });
}

// Inicjalizacja gwiazd bliższych (wyraźniejsze punkty, konstelacje)
for (let i = 0; i < STAR_COUNT_NEAR; i++) {
  STARS_NEAR.push({
    xNorm: lcgRandom(),
    yNorm: Math.pow(lcgRandom(), 1.4) * 0.68,
    size: 1.5 + lcgRandom() * 0.7,
    speed: 0.8 + lcgRandom() * 1.6,
    phase: lcgRandom() * Math.PI * 2,
    baseAlpha: 0.55 + lcgRandom() * 0.40,
    hasCrossFlare: i < 5 // 5 najjaśniejszych gwiazd ma subtelny krzyżyk
  });
}

// Paleta odcieni gwiazd
const STAR_PALETTE = [
  '224, 242, 254', // Lodowy błękit (Sky-100)
  '248, 250, 252', // Czysta biel
  '254, 240, 138', // Ciepły blady bursztyn
  '187, 247, 208'  // Szmaragdowa mięta
];

// =========================================================================
// 2. BIOLUMINESCENCYJNE ŚWIETLIKI DŻUNGLI (FIREFLIES)
// =========================================================================
const FIREFLY_COUNT = 30;
const FIREFLIES = [];
for (let i = 0; i < FIREFLY_COUNT; i++) {
  FIREFLIES.push({
    baseX: 250 + lcgRandom() * 3900,
    baseY: 480 + lcgRandom() * 780,
    ampX: 25 + lcgRandom() * 45,
    ampY: 18 + lcgRandom() * 30,
    freqX: 0.4 + lcgRandom() * 0.7,
    freqY: 0.3 + lcgRandom() * 0.6,
    phaseX: lcgRandom() * Math.PI * 2,
    phaseY: lcgRandom() * Math.PI * 2,
    glowSpeed: 1.4 + lcgRandom() * 2.2,
    glowPhase: lcgRandom() * Math.PI * 2,
    size: 1.8 + lcgRandom() * 1.4
  });
}

// =========================================================================
// 3. BUFOROWANIE SYLWETEK GÓR, DŻUNGLI I NOCNEGO NIEBA (OFFSCREEN CANVAS CACHING)
// Gwarantuje 60/120 FPS bez narzutu na CPU / GC w pętli renderowania
// =========================================================================
let _cachedSkyStarsMoonCanvas = null;
let _cachedMountainsCanvas = null;
let _cachedJungleCanvas = null;

function ensureSkyStarsMoonCanvas() {
  if (_cachedSkyStarsMoonCanvas || typeof document === 'undefined') return;

  const w = 2400;
  const h = 1080;
  _cachedSkyStarsMoonCanvas = document.createElement('canvas');
  _cachedSkyStarsMoonCanvas.width = w;
  _cachedSkyStarsMoonCanvas.height = h;
  const sc = _cachedSkyStarsMoonCanvas.getContext('2d');
  if (!sc) return;

  sc.save();

  // 1. Aksamitny gradient nocnego nieba
  const sGrad = sc.createLinearGradient(0, 0, 0, h);
  sGrad.addColorStop(0.00, '#02050c'); // Kosmiczny granat
  sGrad.addColorStop(0.35, '#050e1a'); // Ciemny indygo
  sGrad.addColorStop(0.65, '#08171c'); // Ciemny petrol
  sGrad.addColorStop(0.85, '#0b211a'); // Szmaragd nocnej dżungli
  sGrad.addColorStop(1.00, '#071511'); // Podstawa horyzontu
  sc.fillStyle = sGrad;
  sc.fillRect(0, 0, w, h);

  // 2. Dalekie mikro-gwiazdy
  for (let i = 0; i < STAR_COUNT_FAR; i++) {
    const st = STARS_FAR[i];
    const sx = st.xNorm * w;
    const sy = st.yNorm * h;
    const alpha = st.baseAlpha * 0.75;
    sc.fillStyle = `rgba(${STAR_PALETTE[st.colorType]}, ${alpha.toFixed(2)})`;
    sc.fillRect(sx, sy, st.size, st.size);
  }

  // 3. Bliższe wyraźniejsze gwiazdy i konstelacje
  for (let i = 0; i < STAR_COUNT_NEAR; i++) {
    const st = STARS_NEAR[i];
    const sx = st.xNorm * w;
    const sy = st.yNorm * h;
    const alpha = st.baseAlpha * 0.85;

    sc.fillStyle = `rgba(240, 249, 255, ${alpha.toFixed(2)})`;
    sc.fillRect(sx - st.size * 0.5, sy - st.size * 0.5, st.size, st.size);

    if (st.hasCrossFlare) {
      sc.strokeStyle = `rgba(224, 242, 254, ${(alpha * 0.40).toFixed(2)})`;
      sc.lineWidth = 1;
      sc.beginPath();
      sc.moveTo(sx - 4.5, sy);
      sc.lineTo(sx + 4.5, sy);
      sc.moveTo(sx, sy - 4.5);
      sc.lineTo(sx, sy + 4.5);
      sc.stroke();
    }
  }

  // 4. Księżyc (Crescent Moon)
  const moonX = w * 0.74;
  const moonY = h * 0.22;
  const moonRadius = 24;

  // Miękka poświata księżycowa (Halo)
  const haloGrad = sc.createRadialGradient(moonX, moonY, moonRadius * 0.5, moonX, moonY, moonRadius * 5.5);
  haloGrad.addColorStop(0.0, 'rgba(186, 230, 253, 0.08)');
  haloGrad.addColorStop(0.5, 'rgba(186, 230, 253, 0.02)');
  haloGrad.addColorStop(1.0, 'rgba(186, 230, 253, 0)');
  sc.fillStyle = haloGrad;
  sc.beginPath();
  sc.arc(moonX, moonY, moonRadius * 5.5, 0, Math.PI * 2);
  sc.fill();

  // Ciemna tarcza księżyca (Earthshine)
  sc.fillStyle = 'rgba(12, 20, 34, 0.55)';
  sc.beginPath();
  sc.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
  sc.fill();

  // Jasny, ostry srebrzysty sierp
  sc.fillStyle = '#f0f9ff';
  sc.beginPath();
  sc.arc(moonX, moonY, moonRadius, -Math.PI * 0.42, Math.PI * 0.42, false);
  sc.quadraticCurveTo(moonX - moonRadius * 0.15, moonY, moonX + Math.cos(-Math.PI * 0.42) * moonRadius, moonY + Math.sin(-Math.PI * 0.42) * moonRadius);
  sc.closePath();
  sc.fill();

  // 5. Srebrzyste promienie księżycowe (Moonbeams)
  sc.globalCompositeOperation = 'screen';
  for (let r = 0; r < 5; r++) {
    const beamAlpha = 0.025;
    const bx = (moonX - 180) + r * 160;

    const bGrad = sc.createLinearGradient(bx, 0, bx + 220, h);
    bGrad.addColorStop(0.0, `rgba(186, 230, 253, ${(beamAlpha * 1.5).toFixed(3)})`);
    bGrad.addColorStop(0.6, `rgba(186, 230, 253, ${beamAlpha.toFixed(3)})`);
    bGrad.addColorStop(1.0, 'rgba(186, 230, 253, 0)');
    sc.fillStyle = bGrad;

    sc.beginPath();
    sc.moveTo(bx, 0);
    sc.lineTo(bx + 90, 0);
    sc.lineTo(bx + 380, h);
    sc.lineTo(bx + 180, h);
    sc.closePath();
    sc.fill();
  }

  sc.restore();
}

function ensureMountainsCanvas() {
  if (_cachedMountainsCanvas || typeof document === 'undefined') return;

  const w = 2400;
  const h = 580;
  _cachedMountainsCanvas = document.createElement('canvas');
  _cachedMountainsCanvas.width = w;
  _cachedMountainsCanvas.height = h;
  const mc = _cachedMountainsCanvas.getContext('2d');
  if (!mc) return;

  // Sylwetka dalekich szczytów górskich i monumentalnego wulkanu
  mc.save();
  const grad = mc.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#07101c'); // Ciemny granat szczytów
  grad.addColorStop(0.4, '#08141d');
  grad.addColorStop(0.75, '#091c1b'); // Ciemny petrol
  grad.addColorStop(1.0, '#0a221e'); // Mgła doliny
  mc.fillStyle = grad;

  mc.beginPath();
  mc.moveTo(0, h);
  mc.lineTo(0, h * 0.60);

  // Pasmo lewe
  mc.bezierCurveTo(200, h * 0.52, 380, h * 0.44, 520, h * 0.40);
  mc.bezierCurveTo(650, h * 0.37, 780, h * 0.46, 920, h * 0.42);

  // Centralny / wschodni monumentalny szczyt (jak w mistycznej dżungli)
  mc.bezierCurveTo(1100, h * 0.36, 1260, h * 0.16, 1420, h * 0.12);
  mc.bezierCurveTo(1490, h * 0.11, 1550, h * 0.22, 1680, h * 0.30);
  mc.bezierCurveTo(1820, h * 0.38, 1980, h * 0.32, 2140, h * 0.45);
  mc.bezierCurveTo(2260, h * 0.52, 2350, h * 0.56, w, h * 0.58);

  mc.lineTo(w, h);
  mc.closePath();
  mc.fill();

  // Srebrzyste światło księżyca na grani (delikatny rim lighting)
  mc.strokeStyle = 'rgba(186, 230, 253, 0.16)';
  mc.lineWidth = 1.6;
  mc.stroke();

  // Pasmo mgły u stóp szczytów
  const mistGrad = mc.createLinearGradient(0, h * 0.70, 0, h);
  mistGrad.addColorStop(0.0, 'rgba(10, 28, 24, 0)');
  mistGrad.addColorStop(1.0, 'rgba(10, 28, 24, 0.55)');
  mc.fillStyle = mistGrad;
  mc.fillRect(0, h * 0.65, w, h * 0.35);

  mc.restore();
}

function ensureJungleCanvas() {
  if (_cachedJungleCanvas || typeof document === 'undefined') return;

  const w = 2400;
  const h = 640;
  _cachedJungleCanvas = document.createElement('canvas');
  _cachedJungleCanvas.width = w;
  _cachedJungleCanvas.height = h;
  const jc = _cachedJungleCanvas.getContext('2d');
  if (!jc) return;

  jc.save();
  const jGrad = jc.createLinearGradient(0, 0, 0, h);
  jGrad.addColorStop(0.0, '#040d0a'); // Najciemniejszy szmaragd cienia
  jGrad.addColorStop(0.5, '#06130f');
  jGrad.addColorStop(1.0, '#071813');
  jc.fillStyle = jGrad;

  jc.beginPath();
  jc.moveTo(0, h);
  jc.lineTo(0, h * 0.55);

  // Proceduralne korony tropikalnych gigantów i prastarych drzew
  const treeNodes = [
    { x: 120, hRatio: 0.38, r: 130 },
    { x: 340, hRatio: 0.44, r: 110 },
    { x: 560, hRatio: 0.32, r: 150 },
    { x: 800, hRatio: 0.40, r: 120 },
    { x: 1050, hRatio: 0.35, r: 140 },
    { x: 1300, hRatio: 0.28, r: 160 }, // Monumentalny baldachim
    { x: 1540, hRatio: 0.34, r: 135 },
    { x: 1780, hRatio: 0.42, r: 115 },
    { x: 2020, hRatio: 0.33, r: 145 },
    { x: 2260, hRatio: 0.39, r: 125 }
  ];

  for (let i = 0; i < treeNodes.length; i++) {
    const node = treeNodes[i];
    const cy = h * node.hRatio;
    jc.arc(node.x, cy, node.r, Math.PI * 0.85, Math.PI * 0.15, false);
  }

  jc.lineTo(w, h * 0.55);
  jc.lineTo(w, h);
  jc.closePath();
  jc.fill();

  // Sylwetka prastarej świątyni / ruiny kamiennej w stylu Khmer w głębi dżungli (X: ~1400 do 1700)
  jc.fillStyle = '#030a08';
  jc.fillRect(1440, h * 0.42, 180, h * 0.58);
  jc.fillRect(1470, h * 0.32, 120, h * 0.10);
  jc.fillRect(1500, h * 0.24, 60, h * 0.08);
  // Otwór bramy
  jc.fillStyle = '#010403';
  jc.fillRect(1505, h * 0.60, 50, h * 0.40);

  // Liście palmowe na grzbietach koron
  jc.strokeStyle = '#051410';
  jc.lineWidth = 4;
  for (let px = 80; px < w; px += 260) {
    jc.beginPath();
    jc.moveTo(px, h * 0.38);
    jc.quadraticCurveTo(px + 45, h * 0.30, px + 80, h * 0.34);
    jc.stroke();
    jc.beginPath();
    jc.moveTo(px, h * 0.38);
    jc.quadraticCurveTo(px - 45, h * 0.30, px - 80, h * 0.34);
    jc.stroke();
  }

  jc.restore();
}

// =========================================================================
// 4. GŁÓWNA FUNKCJA RENDEROWANIA TŁA ARENY 3 (EXPORT DRAWARENA3BACKGROUND)
// =========================================================================
let _cachedSkyGrad = null;
let _cachedSkyH = -1;

export function drawArena3Background(ctx, camera) {
  if (!ctx) return;

  const W_screen = ctx.canvas?.width || (typeof window !== 'undefined' ? window.innerWidth : 1920);
  const H_screen = ctx.canvas?.height || (typeof window !== 'undefined' ? window.innerHeight : 1080);
  const time = (typeof animTime === 'number' && animTime > 0) ? animTime : (performance.now() * 0.001);

  const camX = camera ? (camera.x || 0) : 0;
  const camY = camera ? (camera.y || 0) : 0;
  const camZoom = camera ? (camera.zoom || 1) : 1;

  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';

  // -----------------------------------------------------------------------
  // WARSTWA 0-3: ZBUFOROWANE NOCNE NIEBO, GWIAZDY, KSIĘŻYC I PROMIENIE (OFFSCREEN CACHING)
  // -----------------------------------------------------------------------
  ensureSkyStarsMoonCanvas();
  if (_cachedSkyStarsMoonCanvas) {
    const skyW = 2400;
    const skyParallaxX = (camX * 0.02) % skyW;
    const drawSkyX = -skyParallaxX;
    ctx.drawImage(_cachedSkyStarsMoonCanvas, drawSkyX, 0, skyW, H_screen);
    if (drawSkyX + skyW < W_screen) {
      ctx.drawImage(_cachedSkyStarsMoonCanvas, drawSkyX + skyW, 0, skyW, H_screen);
    }
  }

  // 1C. Sporadyczna spadająca gwiazda (Meteor co ~17 sekund - lekki pojedynczy stroke)
  const meteorInterval = 17.0;
  const meteorCycle = time % meteorInterval;
  if (meteorCycle < 0.75) {
    const mProg = meteorCycle / 0.75;
    const mAlpha = Math.sin(mProg * Math.PI) * 0.75;
    const startX = W_screen * 0.45;
    const startY = H_screen * 0.08;
    const len = 70;
    const dx = 140 * mProg;
    const dy = 85 * mProg;
    const curX = startX + dx;
    const curY = startY + dy;

    ctx.save();
    ctx.strokeStyle = `rgba(240, 249, 255, ${mAlpha.toFixed(2)})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(curX - len * 0.85, curY - len * 0.52);
    ctx.lineTo(curX, curY);
    ctx.stroke();
    ctx.restore();
  }

  // -----------------------------------------------------------------------
  // WARSTWA 4: DALEKIE PASMO GÓRSKIE W NOCY (OFFSCREEN CANVAS CACHING)
  // -----------------------------------------------------------------------
  ensureMountainsCanvas();
  if (_cachedMountainsCanvas) {
    const mPeriod = 2400;
    const mParallax = (camX * 0.04) % mPeriod;
    const mY = H_screen * 0.32 - (camY * 0.025);

    for (let loop = -1; loop <= Math.ceil(W_screen / mPeriod) + 1; loop++) {
      const drawX = loop * mPeriod - mParallax;
      if (drawX + mPeriod < -100 || drawX > W_screen + 100) continue;
      ctx.drawImage(_cachedMountainsCanvas, drawX, mY, mPeriod, H_screen * 0.68);
    }
  }

  // -----------------------------------------------------------------------
  // WARSTWA 5: PRASTARE KORONY DRZEW I RUINY (OFFSCREEN CANVAS CACHING)
  // -----------------------------------------------------------------------
  ensureJungleCanvas();
  if (_cachedJungleCanvas) {
    const jPeriod = 2400;
    const jParallax = (camX * 0.08) % jPeriod;
    const jY = H_screen * 0.38 - (camY * 0.045);

    for (let loop = -1; loop <= Math.ceil(W_screen / jPeriod) + 1; loop++) {
      const drawX = loop * jPeriod - jParallax;
      if (drawX + jPeriod < -100 || drawX > W_screen + 100) continue;
      ctx.drawImage(_cachedJungleCanvas, drawX, jY, jPeriod, H_screen * 0.62);
    }
  }

  // -----------------------------------------------------------------------
  // WARSTWA 6: ELEMENTY W PRZESTRZENI ŚWIATA (TRANSFORMACJA KAMERY)
  // -----------------------------------------------------------------------
  ctx.save();
  if (camera) {
    ctx.scale(camZoom, camZoom);
    ctx.translate(-camX, -camY);
  }

  // 6A. Srebrzyste refleksy światła księżyca na powierzchni rzeki (X: 1600 do 2800) - zgrupowany 1 stroke
  ctx.save();
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.28)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let wx = 1660; wx < 2740; wx += 60) {
    const wy = 1302 + Math.sin(wx * 0.02 + time * 2.2) * 3.5;
    const glintLen = 14 + Math.sin(wx * 0.05 + time * 3.0) * 8;
    ctx.moveTo(wx, wy);
    ctx.lineTo(wx + glintLen, wy);
  }
  ctx.stroke();
  ctx.restore();

  // 6B. Bioluminescencyjne świetliki (Fireflies) - zgrupowane w 2 wywołania fill (poświata + rdzeń)
  const isTouchDevice = typeof window !== 'undefined' && ((window.innerWidth <= 1024) && (('ontouchstart' in window) || (navigator && navigator.maxTouchPoints > 0)));
  const maxFireflies = isTouchDevice ? 8 : FIREFLY_COUNT;

  const visibleFireflies = [];
  const minCamX = camX - 80;
  const maxCamX = camX + (W_screen / camZoom) + 80;
  const minCamY = camY - 80;
  const maxCamY = camY + (H_screen / camZoom) + 80;

  for (let i = 0; i < maxFireflies; i++) {
    const ff = FIREFLIES[i];
    const fx = ff.baseX + Math.sin(time * ff.freqX + ff.phaseX) * ff.ampX;
    const fy = ff.baseY + Math.cos(time * ff.freqY + ff.phaseY) * ff.ampY;

    if (fx < minCamX || fx > maxCamX || fy < minCamY || fy > maxCamY) continue;

    const glowRad = ff.size * 3.5;
    const coreRad = ff.size * 0.7;
    visibleFireflies.push(fx, fy, glowRad, coreRad);
  }

  if (visibleFireflies.length > 0) {
    // 1. Wspólna miękka poświata
    ctx.fillStyle = 'rgba(163, 230, 53, 0.22)';
    ctx.beginPath();
    for (let i = 0; i < visibleFireflies.length; i += 4) {
      const fx = visibleFireflies[i];
      const fy = visibleFireflies[i + 1];
      const glowRad = visibleFireflies[i + 2];
      ctx.moveTo(fx + glowRad, fy);
      ctx.arc(fx, fy, glowRad, 0, Math.PI * 2);
    }
    ctx.fill();

    // 2. Wspólny jasny rdzeń
    ctx.fillStyle = 'rgba(255, 255, 220, 0.85)';
    ctx.beginPath();
    for (let i = 0; i < visibleFireflies.length; i += 4) {
      const fx = visibleFireflies[i];
      const fy = visibleFireflies[i + 1];
      const coreRad = visibleFireflies[i + 3];
      ctx.moveTo(fx + coreRad, fy);
      ctx.arc(fx, fy, coreRad, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  ctx.restore(); // Przywrócenie transformacji kamery
  ctx.restore(); // Przywrócenie stanu nadrzędnego
}
