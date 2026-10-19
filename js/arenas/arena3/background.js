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

import { animTime, LEAF_PARTICLES } from './state.js';

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
// 3. BUFOROWANIE SYLWETEK GÓR I DŻUNGLI (OFFSCREEN CANVAS CACHING)
// Gwarantuje 60/120 FPS bez narzutu na CPU / GC w pętli renderowania
// =========================================================================
let _cachedMountainsCanvas = null;
let _cachedJungleCanvas = null;

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
  // WARSTWA 0: BAZOWY GRADIENT NOCNEGO NIEBA (EKRANOWY)
  // -----------------------------------------------------------------------
  if (!_cachedSkyGrad || _cachedSkyH !== H_screen) {
    _cachedSkyGrad = ctx.createLinearGradient(0, 0, 0, H_screen);
    _cachedSkyGrad.addColorStop(0.00, '#02050c'); // Aksamitny, głęboki kosmiczny granat
    _cachedSkyGrad.addColorStop(0.35, '#050e1a'); // Ciemny indygo
    _cachedSkyGrad.addColorStop(0.65, '#08171c'); // Ciemny petrol
    _cachedSkyGrad.addColorStop(0.85, '#0b211a'); // Szmaragd nocnej dżungli
    _cachedSkyGrad.addColorStop(1.00, '#071511'); // Podstawa horyzontu
    _cachedSkyH = H_screen;
  }
  ctx.fillStyle = _cachedSkyGrad;
  ctx.fillRect(0, 0, W_screen, H_screen);

  // -----------------------------------------------------------------------
  // WARSTWA 1: ROZGWIEŻDŻONE NIEBO (PARALAKSA + DELIKATNY TWINKLE)
  // -----------------------------------------------------------------------
  // 1A. Dalekie mikro-gwiazdy
  const farParallaxX = (camX * 0.015) % W_screen;
  const farParallaxY = (camY * 0.008);
  for (let i = 0; i < STAR_COUNT_FAR; i++) {
    const st = STARS_FAR[i];
    const sx = ((st.xNorm * W_screen - farParallaxX) % W_screen + W_screen) % W_screen;
    const sy = st.yNorm * H_screen - farParallaxY;
    if (sy < 0 || sy > H_screen * 0.85) continue;

    const twinkle = Math.sin(time * st.speed + st.phase) * 0.5 + 0.5;
    const alpha = (st.baseAlpha * (0.45 + twinkle * 0.55)).toFixed(2);
    ctx.fillStyle = `rgba(${STAR_PALETTE[st.colorType]}, ${alpha})`;
    ctx.fillRect(sx, sy, st.size, st.size);
  }

  // 1B. Bliższe wyraźniejsze gwiazdy i konstelacje
  const nearParallaxX = (camX * 0.035) % W_screen;
  const nearParallaxY = (camY * 0.015);
  for (let i = 0; i < STAR_COUNT_NEAR; i++) {
    const st = STARS_NEAR[i];
    const sx = ((st.xNorm * W_screen - nearParallaxX) % W_screen + W_screen) % W_screen;
    const sy = st.yNorm * H_screen - nearParallaxY;
    if (sy < 0 || sy > H_screen * 0.82) continue;

    const twinkle = Math.sin(time * st.speed + st.phase) * 0.5 + 0.5;
    const alpha = st.baseAlpha * (0.60 + twinkle * 0.40);

    ctx.fillStyle = `rgba(240, 249, 255, ${alpha.toFixed(2)})`;
    ctx.fillRect(sx - st.size * 0.5, sy - st.size * 0.5, st.size, st.size);

    // Delikatny mikro-krzyżyk dyfrakcyjny dla najjaśniejszych gwiazd
    if (st.hasCrossFlare && alpha > 0.65) {
      ctx.strokeStyle = `rgba(224, 242, 254, ${(alpha * 0.35).toFixed(2)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx - 4.5, sy);
      ctx.lineTo(sx + 4.5, sy);
      ctx.moveTo(sx, sy - 4.5);
      ctx.lineTo(sx, sy + 4.5);
      ctx.stroke();
    }
  }

  // 1C. Sporadyczna spadająca gwiazda (Meteor co ~17 sekund)
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
  // WARSTWA 2: SUBTELNY SIERP KSIĘŻYCA Z CHŁODNĄ AUREOLĄ (CRESCENT MOON)
  // -----------------------------------------------------------------------
  const moonX = W_screen * 0.74 - ((camX * 0.022) % W_screen);
  const moonY = H_screen * 0.22 - (camY * 0.012);
  const moonRadius = 24;

  ctx.save();
  // Miękka poświata księżycowa (Halo)
  const haloGrad = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.5, moonX, moonY, moonRadius * 5.5);
  haloGrad.addColorStop(0.0, 'rgba(186, 230, 253, 0.08)');
  haloGrad.addColorStop(0.5, 'rgba(186, 230, 253, 0.02)');
  haloGrad.addColorStop(1.0, 'rgba(186, 230, 253, 0)');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonRadius * 5.5, 0, Math.PI * 2);
  ctx.fill();

  // Ciemna tarcza księżyca (światło popielate / Earthshine)
  ctx.fillStyle = 'rgba(12, 20, 34, 0.55)';
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
  ctx.fill();

  // Jasny, ostry srebrzysty sierp
  ctx.fillStyle = '#f0f9ff';
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonRadius, -Math.PI * 0.42, Math.PI * 0.42, false);
  ctx.quadraticCurveTo(moonX - moonRadius * 0.15, moonY, moonX + Math.cos(-Math.PI * 0.42) * moonRadius, moonY + Math.sin(-Math.PI * 0.42) * moonRadius);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // -----------------------------------------------------------------------
  // WARSTWA 3: SREBRZYSTE PROMIENIE KSIĘŻYCOWE (MOONBEAMS)
  // -----------------------------------------------------------------------
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let r = 0; r < 5; r++) {
    const beamPulse = Math.sin(time * 0.6 + r * 1.3) * 0.012;
    const beamAlpha = 0.022 + beamPulse;
    const bx = (moonX - 180) + r * 160;

    const bGrad = ctx.createLinearGradient(bx, 0, bx + 220, H_screen);
    bGrad.addColorStop(0.0, `rgba(186, 230, 253, ${(beamAlpha * 1.5).toFixed(3)})`);
    bGrad.addColorStop(0.6, `rgba(186, 230, 253, ${beamAlpha.toFixed(3)})`);
    bGrad.addColorStop(1.0, 'rgba(186, 230, 253, 0)');
    ctx.fillStyle = bGrad;

    ctx.beginPath();
    ctx.moveTo(bx, 0);
    ctx.lineTo(bx + 90, 0);
    ctx.lineTo(bx + 380, H_screen);
    ctx.lineTo(bx + 180, H_screen);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

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

  // 6A. Srebrzyste refleksy światła księżyca na powierzchni rzeki (X: 1600 do 2800)
  ctx.save();
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.28)';
  ctx.lineWidth = 1.8;
  for (let wx = 1660; wx < 2740; wx += 60) {
    const wy = 1302 + Math.sin(wx * 0.02 + time * 2.2) * 3.5;
    const glintLen = 14 + Math.sin(wx * 0.05 + time * 3.0) * 8;
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.lineTo(wx + glintLen, wy);
    ctx.stroke();
  }
  ctx.restore();

  // 6B. Bioluminescencyjne świetliki (Fireflies)
  for (let i = 0; i < FIREFLY_COUNT; i++) {
    const ff = FIREFLIES[i];
    const fx = ff.baseX + Math.sin(time * ff.freqX + ff.phaseX) * ff.ampX;
    const fy = ff.baseY + Math.cos(time * ff.freqY + ff.phaseY) * ff.ampY;

    // Viewport culling dla świetlików
    if (fx < camX - 80 || fx > camX + (W_screen / camZoom) + 80) continue;
    if (fy < camY - 80 || fy > camY + (H_screen / camZoom) + 80) continue;

    const pulse = Math.sin(time * ff.glowSpeed + ff.glowPhase) * 0.5 + 0.5;
    const ffAlpha = 0.35 + pulse * 0.65;

    ctx.save();
    // Subtelna poświata świetlika
    const glowRad = ff.size * 3.5;
    const fGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, glowRad);
    fGrad.addColorStop(0.0, `rgba(234, 255, 150, ${ffAlpha.toFixed(2)})`);
    fGrad.addColorStop(0.4, `rgba(163, 230, 53, ${(ffAlpha * 0.45).toFixed(2)})`);
    fGrad.addColorStop(1.0, 'rgba(163, 230, 53, 0)');
    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.arc(fx, fy, glowRad, 0, Math.PI * 2);
    ctx.fill();

    // Jasny złocisty rdzeń
    ctx.fillStyle = `rgba(255, 255, 220, ${(ffAlpha * 0.95).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(fx, fy, ff.size * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 6C. Nocne opadające liście dżungli (zgaszona, tajemnicza nocna paleta)
  const NOCTURNE_LEAF_COLORS = ['#1a3d24', '#214728', '#14362b', '#1b4d32', '#2d4a22'];
  for (let i = 0; i < LEAF_PARTICLES.length; i += 2) {
    const leaf = LEAF_PARTICLES[i];
    if (leaf.x < camX - 50 || leaf.x > camX + (W_screen / camZoom) + 50) continue;
    if (leaf.y < camY - 50 || leaf.y > camY + (H_screen / camZoom) + 50) continue;

    ctx.save();
    ctx.globalAlpha = leaf.alpha * 0.45;
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.rot);
    ctx.fillStyle = NOCTURNE_LEAF_COLORS[i % NOCTURNE_LEAF_COLORS.length];
    ctx.beginPath();
    ctx.ellipse(0, 0, leaf.size, leaf.size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore(); // Przywrócenie transformacji kamery
  ctx.restore(); // Przywrócenie stanu nadrzędnego
}
