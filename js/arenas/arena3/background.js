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
import { playSound } from '../../audio/index.js';

// =========================================================================
// 0. STAN INTERAKTYWNEGO OKRĘTU WOJENNEGO I SALW MOŹDZIERZOWYCH NA MORZU
// =========================================================================
export const arena3ShipMortarState = {
  salvos: [],
  recoilForward: 0,
  recoilAft: 0,
  muzzleFlashForward: 0,
  muzzleFlashAft: 0
};

export function resetArena3ShipMortars() {
  arena3ShipMortarState.salvos.length = 0;
  arena3ShipMortarState.recoilForward = 0;
  arena3ShipMortarState.recoilAft = 0;
  arena3ShipMortarState.muzzleFlashForward = 0;
  arena3ShipMortarState.muzzleFlashAft = 0;
}

/**
 * Uruchamia wizualną salwę moździerzy z okrętu wojennego w tle Areny 3.
 * Pociski wznoszą się z pokładu ponad górną krawędź ekranu przed opadnięciem na cel.
 */
export function triggerArena3ShipMortarSalvo(targetX, offsets = []) {
  const safeTargetX = (typeof targetX === 'number' && !isNaN(targetX)) ? targetX : 2200;
  const count = 5;
  const shells = [];

  for (let i = 0; i < count; i++) {
    const off = (Array.isArray(offsets) && typeof offsets[i] === 'number')
      ? offsets[i]
      : Math.round((i - 2) * 58);
    shells.push({
      delay: i * 0.22,
      flightDuration: 0.90,
      launched: false,
      launchElapsed: 0,
      turretIdx: i % 2, // 0 = dziobowa wyrzutnia, 1 = rufowa wyrzutnia
      destX: safeTargetX + off,
      spreadJitterX: (Math.random() - 0.5) * 32,
      smokeTrail: []
    });
  }

  arena3ShipMortarState.salvos.push({
    targetX: safeTargetX,
    age: 0,
    shells
  });
}

function getArena3WarshipLayout(W_screen, H_screen, camera, time) {
  const camX = camera ? (camera.x || 0) : 0;
  const camY = camera ? (camera.y || 0) : 0;
  const camZoom = camera ? (camera.zoom || 1) : 1;
  const viewW = (camera && typeof camera.viewWidth === 'number' && camera.viewWidth > 0)
    ? camera.viewWidth
    : (W_screen / Math.max(0.25, camZoom));
  const viewCenterX = camX + viewW * 0.5;

  const seaHorizonY = H_screen * 0.49 - (camY * 0.025);
  const shipScale = Math.max(0.68, Math.min(1.24, H_screen / 860));
  const patrolOffsetX = Math.sin(time * 0.065) * 115;
  const shipWorldX = 2200 + patrolOffsetX;
  const shipX = W_screen * 0.5 + (shipWorldX - viewCenterX) * 0.24;
  const bobY = Math.sin(time * 1.15) * 2.0 * shipScale;
  const pitch = Math.sin(time * 0.85) * 0.014;
  const shipWaterY = seaHorizonY + Math.max(20, H_screen * 0.045);
  const shipY = shipWaterY + bobY;

  // Lokalne współrzędne wyrzutni moździerzy na pokładzie (w układzie okrętu przed skalowaniem)
  const forwardTurretLocal = { x: -58, y: -15 + arena3ShipMortarState.recoilForward * 3.5 };
  const aftTurretLocal = { x: 54, y: -14 + arena3ShipMortarState.recoilAft * 3.5 };

  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const toScreen = (lx, ly) => ({
    x: shipX + (lx * cosP - ly * sinP) * shipScale,
    y: shipY + (lx * sinP + ly * cosP) * shipScale
  });

  return {
    seaHorizonY,
    shipX,
    shipY,
    shipWaterY,
    shipScale,
    pitch,
    turrets: [
      toScreen(forwardTurretLocal.x, forwardTurretLocal.y),
      toScreen(aftTurretLocal.x, aftTurretLocal.y)
    ]
  };
}

/**
 * Aktualizuje lot wznoszących się pocisków z okrętu i wygasanie smug/rozbłysków.
 */
export function updateArena3ShipMortars(dt = (1 / 60), camera = null) {
  const safeDt = (typeof dt === 'number' && dt > 0 && dt < 0.5) ? dt : (1 / 60);

  if (arena3ShipMortarState.recoilForward > 0) {
    arena3ShipMortarState.recoilForward = Math.max(0, arena3ShipMortarState.recoilForward - safeDt * 4.5);
  }
  if (arena3ShipMortarState.recoilAft > 0) {
    arena3ShipMortarState.recoilAft = Math.max(0, arena3ShipMortarState.recoilAft - safeDt * 4.5);
  }
  if (arena3ShipMortarState.muzzleFlashForward > 0) {
    arena3ShipMortarState.muzzleFlashForward = Math.max(0, arena3ShipMortarState.muzzleFlashForward - safeDt);
  }
  if (arena3ShipMortarState.muzzleFlashAft > 0) {
    arena3ShipMortarState.muzzleFlashAft = Math.max(0, arena3ShipMortarState.muzzleFlashAft - safeDt);
  }

  if (arena3ShipMortarState.salvos.length === 0) return;

  const cam = camera || (typeof window !== 'undefined' ? window.camera : null);
  const canvasEl = (typeof document !== 'undefined') ? (document.getElementById('game') || document.getElementById('gameCanvas') || document.querySelector('canvas')) : null;
  const W_screen = (canvasEl && canvasEl.clientWidth) ? canvasEl.clientWidth : ((typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : 1920);
  const H_screen = (canvasEl && canvasEl.clientHeight) ? canvasEl.clientHeight : ((typeof window !== 'undefined' && window.innerHeight) ? window.innerHeight : 1080);
  const time = (typeof animTime === 'number' && animTime > 0) ? animTime : (performance.now() * 0.001);
  const layout = getArena3WarshipLayout(W_screen, H_screen, cam, time);
  const camX = cam ? (cam.x || 0) : 0;
  const camZoom = cam ? (cam.zoom || 1) : 1;

  for (let i = arena3ShipMortarState.salvos.length - 1; i >= 0; i--) {
    const salvo = arena3ShipMortarState.salvos[i];
    salvo.age += safeDt;
    let allFinished = true;

    for (let s = 0; s < salvo.shells.length; s++) {
      const sh = salvo.shells[s];

      if (!sh.launched) {
        allFinished = false;
        if (salvo.age >= sh.delay) {
          sh.launched = true;
          sh.launchElapsed = 0;
          if (sh.turretIdx === 0) {
            arena3ShipMortarState.recoilForward = 1.0;
            arena3ShipMortarState.muzzleFlashForward = 0.24;
          } else {
            arena3ShipMortarState.recoilAft = 1.0;
            arena3ShipMortarState.muzzleFlashAft = 0.24;
          }
          playSound('mortar_ship_fire');
        }
        continue;
      }

      if (sh.launchElapsed < sh.flightDuration) {
        allFinished = false;
        sh.launchElapsed += safeDt;
        const p = Math.min(1, sh.launchElapsed / sh.flightDuration);
        const startPos = layout.turrets[sh.turretIdx] || layout.turrets[0];
        const rawDestScreenX = (sh.destX - camX) * camZoom;
        const apexScreenX = Math.max(50, Math.min(W_screen - 50, rawDestScreenX + sh.spreadJitterX));
        const apexY = -65;

        // Balistyczne wznoszenie: szybki start z lufy i łagodne odchylenie w stronę celu
        const easeX = p * p * (0.35 + 0.65 * p);
        const easeY = Math.pow(p, 0.80);
        const curX = startPos.x + (apexScreenX - startPos.x) * easeX;
        const curY = startPos.y + (apexY - startPos.y) * easeY;
        sh.curX = curX;
        sh.curY = curY;
        sh.angle = Math.atan2((apexY - startPos.y) * 0.80, (apexScreenX - startPos.x) * 0.65);

        sh.smokeTrail.push({
          x: curX,
          y: curY,
          r: (2.2 + p * 2.4) * layout.shipScale,
          alpha: 0.72
        });
        if (sh.smokeTrail.length > 18) sh.smokeTrail.shift();
      }

      // Wygaszanie smugi dymu wznoszącego się pocisku
      for (let tIdx = sh.smokeTrail.length - 1; tIdx >= 0; tIdx--) {
        const smk = sh.smokeTrail[tIdx];
        smk.alpha -= safeDt * 1.15;
        smk.r += safeDt * 3.8;
        smk.y -= safeDt * 6.0;
        if (smk.alpha <= 0.03) {
          sh.smokeTrail.splice(tIdx, 1);
        } else {
          allFinished = false;
        }
      }
    }

    if (allFinished) {
      arena3ShipMortarState.salvos.splice(i, 1);
    }
  }
}

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
  const h = 420;
  _cachedMountainsCanvas = document.createElement('canvas');
  _cachedMountainsCanvas.width = w;
  _cachedMountainsCanvas.height = h;
  const mc = _cachedMountainsCanvas.getContext('2d');
  if (!mc) return;

  // Sylwetki przybrzeżnych gór na lewym i prawym przylądku + odległe wyspy nad morzem
  mc.save();
  const grad = mc.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#07101c'); // Ciemny granat szczytów
  grad.addColorStop(0.55, '#081520');
  grad.addColorStop(1.0, '#07181f'); // Morska mgiełka przy horyzoncie
  mc.fillStyle = grad;

  // Lewy przylądek górski (opadający ku zatoce)
  mc.beginPath();
  mc.moveTo(0, h);
  mc.lineTo(0, h * 0.36);
  mc.bezierCurveTo(160, h * 0.28, 320, h * 0.22, 470, h * 0.34);
  mc.bezierCurveTo(580, h * 0.44, 670, h * 0.80, 790, h);
  mc.closePath();
  mc.fill();
  mc.strokeStyle = 'rgba(186, 230, 253, 0.14)';
  mc.lineWidth = 1.5;
  mc.stroke();

  // Prawy masyw / wulkan opadający ku morzu
  mc.beginPath();
  mc.moveTo(1620, h);
  mc.bezierCurveTo(1740, h * 0.78, 1840, h * 0.42, 1980, h * 0.24);
  mc.bezierCurveTo(2070, h * 0.14, 2140, h * 0.16, 2220, h * 0.32);
  mc.bezierCurveTo(2300, h * 0.44, 2360, h * 0.42, w, h * 0.38);
  mc.lineTo(w, h);
  mc.closePath();
  mc.fill();
  mc.stroke();

  // Dwie dalekie niskie wyspy na morskim horyzoncie
  mc.fillStyle = '#06121b';
  mc.beginPath();
  mc.moveTo(880, h);
  mc.quadraticCurveTo(960, h * 0.84, 1050, h);
  mc.closePath();
  mc.fill();

  mc.beginPath();
  mc.moveTo(1430, h);
  mc.quadraticCurveTo(1505, h * 0.87, 1580, h);
  mc.closePath();
  mc.fill();

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
  jGrad.addColorStop(0.55, '#06130f');
  jGrad.addColorStop(1.0, '#071813');
  jc.fillStyle = jGrad;

  jc.beginPath();
  jc.moveTo(0, h);
  jc.lineTo(0, h * 0.42);

  // Lewy brzeg dżungli (wysokie korony oprawiające zatokę morską)
  const leftNodes = [
    { x: 90, hRatio: 0.30, r: 125 },
    { x: 270, hRatio: 0.36, r: 110 },
    { x: 440, hRatio: 0.46, r: 95 },
    { x: 590, hRatio: 0.62, r: 75 }
  ];
  for (let i = 0; i < leftNodes.length; i++) {
    const node = leftNodes[i];
    jc.arc(node.x, h * node.hRatio, node.r, Math.PI * 0.90, Math.PI * 0.15, false);
  }

  // Otwarta zatoka morska w środku (niska linia przybrzeżnych krzewów i skał w dolnej części)
  jc.bezierCurveTo(820, h * 0.68, 1080, h * 0.71, 1240, h * 0.70);
  jc.bezierCurveTo(1420, h * 0.72, 1650, h * 0.68, 1810, h * 0.62);

  // Prawy brzeg dżungli i ruiny świątyni
  const rightNodes = [
    { x: 1890, hRatio: 0.50, r: 85 },
    { x: 2040, hRatio: 0.36, r: 115 },
    { x: 2220, hRatio: 0.30, r: 130 },
    { x: 2370, hRatio: 0.38, r: 110 }
  ];
  for (let i = 0; i < rightNodes.length; i++) {
    const node = rightNodes[i];
    jc.arc(node.x, h * node.hRatio, node.r, Math.PI * 0.85, Math.PI * 0.10, false);
  }

  jc.lineTo(w, h * 0.48);
  jc.lineTo(w, h);
  jc.closePath();
  jc.fill();

  // Sylwetka prastarej świątyni / ruiny kamiennej w głębi prawej dżungli (X: ~1980 do 2160)
  jc.fillStyle = '#030a08';
  jc.fillRect(2000, h * 0.42, 140, h * 0.58);
  jc.fillRect(2025, h * 0.33, 90, h * 0.09);
  jc.fillRect(2048, h * 0.25, 44, h * 0.08);
  jc.fillStyle = '#010403';
  jc.fillRect(2050, h * 0.58, 40, h * 0.42);

  // Liście palmowe na brzegach zatoki
  jc.strokeStyle = '#051410';
  jc.lineWidth = 3.5;
  const palmPositions = [
    { px: 160, py: h * 0.30 },
    { px: 470, py: h * 0.45 },
    { px: 1890, py: h * 0.48 },
    { px: 2240, py: h * 0.30 }
  ];
  for (const palm of palmPositions) {
    jc.beginPath();
    jc.moveTo(palm.px, palm.py);
    jc.quadraticCurveTo(palm.px + 42, palm.py - 34, palm.px + 74, palm.py - 16);
    jc.stroke();
    jc.beginPath();
    jc.moveTo(palm.px, palm.py);
    jc.quadraticCurveTo(palm.px - 42, palm.py - 34, palm.px - 74, palm.py - 16);
    jc.stroke();
  }

  jc.restore();
}

// =========================================================================
// 4. NOCNE MORZE, OKRĘT WOJENNY I WZNOSZĄCE SIĘ MOŹDZIERZE
// =========================================================================
let _cachedSeaGrad = null;
let _cachedSeaHorizonY = -1;
let _cachedSeaH = -1;
let _cachedWarshipCanvas = null;

function ensureWarshipCanvas() {
  if (_cachedWarshipCanvas || typeof document === 'undefined') return;
  const cw = 260;
  const ch = 90;
  const cx = 130;
  const cy = 74;
  _cachedWarshipCanvas = document.createElement('canvas');
  _cachedWarshipCanvas.width = cw;
  _cachedWarshipCanvas.height = ch;
  const wc = _cachedWarshipCanvas.getContext('2d');
  if (!wc) return;

  wc.save();
  wc.translate(cx, cy);

  // Kadłub stealth niszczyciela
  wc.fillStyle = '#0c1824';
  wc.beginPath();
  wc.moveTo(-114, 2);
  wc.lineTo(-96, -15);
  wc.lineTo(96, -14);
  wc.lineTo(108, 2);
  wc.closePath();
  wc.fill();

  // Księżycowa krawędź pokładu i dziobu
  wc.strokeStyle = 'rgba(148, 210, 235, 0.28)';
  wc.lineWidth = 1.2;
  wc.beginPath();
  wc.moveTo(-112, 0);
  wc.lineTo(-96, -15);
  wc.lineTo(96, -14);
  wc.stroke();

  // Główna nadbudówka (mostek)
  wc.fillStyle = '#0f2030';
  wc.beginPath();
  wc.moveTo(-36, -14);
  wc.lineTo(-26, -34);
  wc.lineTo(12, -34);
  wc.lineTo(22, -26);
  wc.lineTo(36, -26);
  wc.lineTo(42, -14);
  wc.closePath();
  wc.fill();

  // Komin i rufowy hangar
  wc.fillStyle = '#0b1622';
  wc.beginPath();
  wc.moveTo(16, -26);
  wc.lineTo(22, -40);
  wc.lineTo(32, -40);
  wc.lineTo(36, -26);
  wc.closePath();
  wc.fill();

  // Maszt radarowy
  wc.strokeStyle = '#1e3548';
  wc.lineWidth = 2.0;
  wc.beginPath();
  wc.moveTo(-10, -34);
  wc.lineTo(-7, -56);
  wc.moveTo(-14, -46);
  wc.lineTo(-2, -46);
  wc.stroke();

  // Światło mostka
  wc.fillStyle = 'rgba(56, 189, 248, 0.55)';
  wc.fillRect(-23, -30, 12, 2);

  wc.restore();
}

function drawArena3NightSea(ctx, W_screen, H_screen, seaHorizonY, camX, time) {
  const seaHeight = Math.max(80, H_screen - seaHorizonY);
  const qHoriz = Math.round(seaHorizonY);
  if (!_cachedSeaGrad || Math.abs(_cachedSeaHorizonY - qHoriz) > 1 || _cachedSeaH !== H_screen) {
    const seaGrad = ctx.createLinearGradient(0, qHoriz, 0, H_screen);
    seaGrad.addColorStop(0.0, '#071b2b');
    seaGrad.addColorStop(0.28, '#051522');
    seaGrad.addColorStop(0.65, '#030d16');
    seaGrad.addColorStop(1.0, '#02080d');
    _cachedSeaGrad = seaGrad;
    _cachedSeaHorizonY = qHoriz;
    _cachedSeaH = H_screen;
  }
  ctx.fillStyle = _cachedSeaGrad;
  ctx.fillRect(0, seaHorizonY, W_screen, seaHeight);

  // Chłodna linia horyzontu morskiego i odbicie księżyca zgrane w minimalną liczbę pathów
  const skyW = 2400;
  const skyParallaxX = (camX * 0.02) % skyW;
  let moonScreenX = (skyW * 0.74) - skyParallaxX;
  if (moonScreenX < -100) moonScreenX += skyW;
  if (moonScreenX > W_screen + 100) moonScreenX -= skyW;

  ctx.save();
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.24)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, seaHorizonY);
  ctx.lineTo(W_screen, seaHorizonY);
  for (let row = 0; row < 10; row++) {
    const tRow = row / 10;
    const wy = seaHorizonY + 6 + tRow * Math.min(seaHeight * 0.45, 160);
    const halfSpan = 16 + tRow * 44;
    const drift = Math.sin(time * 2.1 + row * 1.3) * (6 + tRow * 8);
    const segW = 14 + tRow * 24 + Math.cos(time * 2.8 + row) * 6;
    const sx = moonScreenX + drift - segW * 0.5;
    if (sx + halfSpan >= -50 && sx - halfSpan <= W_screen + 50) {
      ctx.moveTo(sx, wy);
      ctx.lineTo(sx + segW, wy);
    }
  }
  ctx.stroke();

  // Delikatne nocne grzebienie fal na całej szerokości zatoki (1 batch stroke)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.09)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  const waveOffset = ((camX * 0.14) % 160 + 160) % 160;
  for (let row = 0; row < 4; row++) {
    const wy = seaHorizonY + 16 + row * 28;
    if (wy > H_screen) break;
    for (let wx = -waveOffset - 40; wx < W_screen + 160; wx += 160) {
      const shimmer = Math.sin(time * 1.4 + row + wx * 0.02) * 10;
      const len = 28 + row * 10;
      ctx.moveTo(wx + shimmer, wy);
      ctx.lineTo(wx + shimmer + len, wy);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawArena3Warship(ctx, layout, time) {
  const { shipX, shipY, shipWaterY, shipScale, pitch, turrets } = layout;
  ensureWarshipCanvas();

  ctx.save();

  // 1. Zbuforowane odbicie okrętu w wodzie + rozbłysk odbity na wodzie
  if (_cachedWarshipCanvas) {
    ctx.save();
    ctx.translate(shipX, shipWaterY + 3 * shipScale);
    ctx.scale(shipScale, -shipScale * 0.40);
    ctx.globalAlpha = 0.22;
    ctx.drawImage(_cachedWarshipCanvas, -130, -74);
    ctx.restore();
  }

  const flashF = arena3ShipMortarState.muzzleFlashForward;
  const flashA = arena3ShipMortarState.muzzleFlashAft;
  if (flashF > 0 && turrets[0]) {
    const fAlpha = Math.min(0.45, flashF * 2.0);
    ctx.fillStyle = `rgba(251, 146, 60, ${fAlpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(turrets[0].x, shipWaterY + 5 * shipScale, 26 * shipScale, 4 * shipScale, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (flashA > 0 && turrets[1]) {
    const aAlpha = Math.min(0.45, flashA * 2.0);
    ctx.fillStyle = `rgba(251, 146, 60, ${aAlpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(turrets[1].x, shipWaterY + 5 * shipScale, 26 * shipScale, 4 * shipScale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Zbuforowany kadłub + animowane elementy pokładu (radar, wieże moździerzy, kilwater)
  ctx.translate(shipX, shipY);
  ctx.rotate(pitch);
  ctx.scale(shipScale, shipScale);

  if (_cachedWarshipCanvas) {
    ctx.drawImage(_cachedWarshipCanvas, -130, -74);
  }

  // Obracająca się antena radaru
  const radarW = 5 + Math.abs(Math.cos(time * 2.4)) * 9;
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-7 - radarW * 0.5, -56);
  ctx.lineTo(-7 + radarW * 0.5, -56);
  // Lufy wyrzutni i kilwater
  const rFwd = arena3ShipMortarState.recoilForward * 2.8;
  const rAft = arena3ShipMortarState.recoilAft * 2.8;
  ctx.stroke();

  ctx.fillStyle = '#16293a';
  ctx.fillRect(-66, -20 + rFwd * 0.5, 16, 6);
  ctx.fillRect(46, -19 + rAft * 0.5, 16, 6);

  ctx.strokeStyle = '#244159';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-58, -19 + rFwd * 0.5);
  ctx.lineTo(-55, -29 + rFwd);
  ctx.moveTo(54, -18 + rAft * 0.5);
  ctx.lineTo(56, -28 + rAft);
  ctx.stroke();

  // Czerwona dioda na szczycie masztu
  ctx.fillStyle = (Math.sin(time * 4.5) > 0) ? 'rgba(239, 68, 68, 0.85)' : 'rgba(127, 29, 29, 0.45)';
  ctx.beginPath();
  ctx.arc(-7, -59, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // 3. Rozbłyski wystrzałów z wyrzutni okrętu (Muzzle Flash)
  if (flashF > 0) {
    const fT = Math.min(1, flashF / 0.24);
    ctx.fillStyle = `rgba(251, 146, 60, ${(0.85 * fT).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(-55, -31, 12 * fT, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255, 255, 235, ${(0.95 * fT).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(-55, -31, 5.5 * fT, 0, Math.PI * 2);
    ctx.fill();
  }
  if (flashA > 0) {
    const aT = Math.min(1, flashA / 0.24);
    ctx.fillStyle = `rgba(251, 146, 60, ${(0.85 * aT).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(56, -30, 12 * aT, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255, 255, 235, ${(0.95 * aT).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(56, -30, 5.5 * aT, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Piana / ślad kilwateru na linii wody
  ctx.save();
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.22)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(shipX - 118 * shipScale, shipWaterY + 2 * shipScale);
  ctx.lineTo(shipX + 114 * shipScale, shipWaterY + 2 * shipScale);
  ctx.stroke();
  ctx.restore();
}

function drawArena3ShipMortars(ctx, layout) {
  if (arena3ShipMortarState.salvos.length === 0) return;

  ctx.save();
  for (const salvo of arena3ShipMortarState.salvos) {
    for (const sh of salvo.shells) {
      // Smuga dymu po locie pocisku wznoszącego się z okrętu
      for (const smk of sh.smokeTrail) {
        ctx.fillStyle = `rgba(203, 213, 225, ${Math.max(0, smk.alpha * 0.45).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(smk.x, smk.y, smk.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (sh.launched && sh.launchElapsed < sh.flightDuration && typeof sh.curX === 'number') {
        const sc = layout.shipScale || 1;
        // Pomarańczowa łuna silnika/ładunku miotającego
        ctx.fillStyle = 'rgba(249, 115, 22, 0.45)';
        ctx.beginPath();
        ctx.arc(sh.curX, sh.curY, 5.5 * sc, 0, Math.PI * 2);
        ctx.fill();

        // Jasny ognisty rdzeń i korpus wznoszącej się bomby moździerzowej
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(sh.curX, sh.curY, 3.0 * sc, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(sh.curX + Math.cos(sh.angle || -Math.PI / 2) * 2.8 * sc, sh.curY + Math.sin(sh.angle || -Math.PI / 2) * 2.8 * sc, 2.2 * sc, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

// =========================================================================
// 5. GŁÓWNA FUNKCJA RENDEROWANIA TŁA ARENY 3 (EXPORT DRAWARENA3BACKGROUND)
// =========================================================================
let _cachedSkyGrad = null;
let _cachedSkyH = -1;

export function drawArena3Background(ctx, camera) {
  if (!ctx) return;

  const W_screen = (ctx.canvas && ctx.canvas.clientWidth) ? ctx.canvas.clientWidth : ((typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : (ctx.canvas?.width || 1920));
  const H_screen = (ctx.canvas && ctx.canvas.clientHeight) ? ctx.canvas.clientHeight : ((typeof window !== 'undefined' && window.innerHeight) ? window.innerHeight : (ctx.canvas?.height || 1080));
  const time = (typeof animTime === 'number' && animTime > 0) ? animTime : (performance.now() * 0.001);

  const camX = camera ? (camera.x || 0) : 0;
  const camY = camera ? (camera.y || 0) : 0;
  const camZoom = camera ? (camera.zoom || 1) : 1;
  const viewW = (camera && typeof camera.viewWidth === 'number' && camera.viewWidth > 0) ? camera.viewWidth : (W_screen / Math.max(0.25, camZoom));
  const arenaCenterShift = (camX + viewW * 0.5) - 2200;

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
    const skyParallaxX = ((camX * 0.02) % skyW + skyW) % skyW;
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

  const warshipLayout = getArena3WarshipLayout(W_screen, H_screen, camera, time);
  const seaHorizonY = warshipLayout.seaHorizonY;

  // -----------------------------------------------------------------------
  // WARSTWA 4: PRZYBRZEŻNE GÓRY I WYSPY NAD MORZEM (OFFSCREEN CANVAS CACHING)
  // -----------------------------------------------------------------------
  ensureMountainsCanvas();
  if (_cachedMountainsCanvas) {
    const mPeriod = 2400;
    const mBaseX = (W_screen * 0.5 - mPeriod * 0.5) - (arenaCenterShift * 0.04);
    const mHeight = H_screen * 0.34;
    const mY = seaHorizonY - mHeight + 2;

    for (let loop = -1; loop <= 1; loop++) {
      const drawX = mBaseX + loop * mPeriod;
      if (drawX + mPeriod < -100 || drawX > W_screen + 100) continue;
      ctx.drawImage(_cachedMountainsCanvas, drawX, mY, mPeriod, mHeight);
    }
  }

  // -----------------------------------------------------------------------
  // WARSTWA 4.5: NOCNE MORZE I OKRĘT WOJENNY W ZATOCE
  // -----------------------------------------------------------------------
  drawArena3NightSea(ctx, W_screen, H_screen, seaHorizonY, camX, time);
  drawArena3Warship(ctx, warshipLayout, time);

  // -----------------------------------------------------------------------
  // WARSTWA 5: PRASTARE KORONY DRZEW I RUINY OPRAWIAJĄCE ZATOKĘ (OFFSCREEN CACHING)
  // -----------------------------------------------------------------------
  ensureJungleCanvas();
  if (_cachedJungleCanvas) {
    const jPeriod = 2400;
    const jBaseX = (W_screen * 0.5 - jPeriod * 0.5) - (arenaCenterShift * 0.08);
    const jHeight = H_screen * 0.64;
    const jY = seaHorizonY - H_screen * 0.14 - (camY * 0.02);

    for (let loop = -1; loop <= 1; loop++) {
      const drawX = jBaseX + loop * jPeriod;
      if (drawX + jPeriod < -100 || drawX > W_screen + 100) continue;
      ctx.drawImage(_cachedJungleCanvas, drawX, jY, jPeriod, jHeight);
    }
  }

  // -----------------------------------------------------------------------
  // WARSTWA 5.5: WZNOSZĄCE SIĘ POCISKI MOŹDZIERZOWE Z OKRĘTU PONAD EKRAN
  // -----------------------------------------------------------------------
  drawArena3ShipMortars(ctx, warshipLayout);

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
