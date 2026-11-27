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
import { killstreakState } from '../../killstreaks/state.js';
import {
  ARENA3_SHIP_WORLD_X,
  ARENA3_SHIP_MORTAR_STAGGER,
  ARENA3_SHIP_MORTAR_ASCENT,
  ARENA3_SHIP_FLASH_DURATION,
  ARENA3_MORTAR_SCALE_FAR,
  ARENA3_MORTAR_SCALE_APEX,
  computeUnifiedShipMortarArc,
  computeShipTurretAimAngle,
  drawMortarBombSprite
} from '../../killstreaks/mortarBallistics.js';
import {
  setWarshipHelipadScreenAnchor,
  drawBackgroundShipDrones,
  resetDroneTransports
} from '../../killstreaks/droneTransports.js';

export { ARENA3_SHIP_MORTAR_STAGGER, ARENA3_SHIP_MORTAR_ASCENT };

// =========================================================================
// 0. ŁADOWANIE KADŁUBA OKRĘTU + RUCHOME WIEŻE MOŹDZIERZOWE I SALWY
// =========================================================================
const WARSHIP_CELL_W = 768;
const WARSHIP_CELL_H = 256;
// Pozycje osi obrotu ruchomych wież na pokładzie (w klatce 768x256)
const WARSHIP_TURRET_FWD = { u: 0.786, v: 0.672, barrelLen: 34 };
const WARSHIP_TURRET_AFT = { u: 0.167, v: 0.726, barrelLen: 30 };
const WARSHIP_HULL_BOTTOM_V = 0.953; // Linia wodna stępki w klatce 768x256

let _warshipNightCanvas = null;
let _warshipLoadStarted = false;

function ensureWarshipSpriteSheet() {
  if (_warshipNightCanvas || typeof document === 'undefined' || typeof Image === 'undefined') return _warshipNightCanvas;
  if (!_warshipLoadStarted) {
    _warshipLoadStarted = true;
    const img = new Image();
    img.src = 'assets/arena3_warship_sheet.png';
    img.onload = () => {
      try {
        const w = WARSHIP_CELL_W;
        const h = WARSHIP_CELL_H;
        const off = document.createElement('canvas');
        off.width = w;
        off.height = h;
        const octx = off.getContext('2d');
        if (!octx) return;

        // Pobieramy bazową klatkę kadłuba (0) i usuwamy starą nieruchomą wieżę dziobową z lufą,
        // aby zastąpić ją ruchomymi wieżami celującymi w stronę celu
        octx.drawImage(img, 0, 0, w, h, 0, 0, w, h);
        octx.clearRect(580, 140, 102, 37);

        const imgData = octx.getImageData(0, 0, w, h);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const a = d[i + 3];
          if (a < 8) continue;
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const isCyanLight = (b > 170 && g > 170 && r < 150);
          const isRedBeacon = (r > 175 && g < 115 && b < 115);
          if (isCyanLight || isRedBeacon) continue;
          d[i] = Math.round(r * 0.46 + 4);
          d[i + 1] = Math.round(g * 0.56 + 11);
          d[i + 2] = Math.round(b * 0.68 + 18);
        }
        octx.putImageData(imgData, 0, 0);
        _warshipNightCanvas = off;
      } catch (_) {
        _warshipNightCanvas = img;
      }
    };
  }
  return _warshipNightCanvas;
}

if (typeof window !== 'undefined') {
  ensureWarshipSpriteSheet();
}

export const arena3ShipMortarState = {
  salvos: [],
  turretAngleFwd: -Math.PI * 0.5,
  turretAngleAft: -Math.PI * 0.5,
  recoilForward: 0,
  recoilAft: 0,
  muzzleFlashForward: 0,
  muzzleFlashAft: 0
};

export function resetArena3ShipMortars() {
  arena3ShipMortarState.salvos.length = 0;
  arena3ShipMortarState.turretAngleFwd = -Math.PI * 0.5;
  arena3ShipMortarState.turretAngleAft = -Math.PI * 0.5;
  arena3ShipMortarState.recoilForward = 0;
  arena3ShipMortarState.recoilAft = 0;
  arena3ShipMortarState.muzzleFlashForward = 0;
  arena3ShipMortarState.muzzleFlashAft = 0;
  resetDroneTransports();
}

/**
 * Uruchamia wizualną salwę moździerzy z okrętu wojennego w tle Areny 3.
 * Ruchome lufy kierują się dokładnie w stronę celu, a pociski lecą zsynchronizowanym łukiem.
 */
export function triggerArena3ShipMortarSalvo(targetX, offsets = [], arcs = []) {
  const safeTargetX = (typeof targetX === 'number' && !isNaN(targetX)) ? targetX : ARENA3_SHIP_WORLD_X;
  const count = 5;
  const shells = [];
  const cam = (typeof window !== 'undefined' && window.camera) ? window.camera : null;

  for (let i = 0; i < count; i++) {
    const off = (Array.isArray(offsets) && typeof offsets[i] === 'number')
      ? offsets[i]
      : Math.round((i - 2) * 58);
    const destX = safeTargetX + off;
    const turretIdx = i % 2; // 0 = dziobowa wieża, 1 = rufowa wyrzutnia
    const arc = (Array.isArray(arcs) && arcs[i])
      ? arcs[i]
      : computeUnifiedShipMortarArc(destX, 1200, cam, turretIdx);
    const delay = i * ARENA3_SHIP_MORTAR_STAGGER;
    shells.push({
      delay,
      flightDuration: ARENA3_SHIP_MORTAR_ASCENT,
      handoffTime: delay + ARENA3_SHIP_MORTAR_ASCENT,
      launched: false,
      activePhase1: false,
      turretIdx,
      barrelAngle: arc.barrelAngle,
      apexWorldX: arc.apexWorldX,
      apexWorldY: arc.apexWorldY,
      fallVx: arc.fallVx,
      destX,
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

  // Zakotwiczenie rozlewiska i okrętu w osi doliny (X = 2200) z subtelną paralaksą 0.12
  const arenaCenterShift = viewCenterX - ARENA3_SHIP_WORLD_X;
  const estuaryCenterX = W_screen * 0.5 - arenaCenterShift * 0.12;
  const estuaryHorizonY = H_screen * 0.52 - (camY * 0.025);
  const estuaryHalfW = Math.max(175, Math.min(340, W_screen * 0.21));
  const shipWaterY = estuaryHorizonY + Math.max(24, H_screen * 0.045);

  const shipDrawW = Math.max(165, Math.min(340, H_screen * 0.315));
  const shipDrawH = shipDrawW * (WARSHIP_CELL_H / WARSHIP_CELL_W);
  const patrolOffsetX = Math.sin(time * 0.06) * Math.min(48, estuaryHalfW * 0.22);
  const shipX = estuaryCenterX + patrolOffsetX;
  const bobY = Math.sin(time * 1.15) * (shipDrawH * 0.018);
  const pitch = Math.sin(time * 0.85) * 0.011;
  const shipY = shipWaterY + bobY;
  const shipScale = shipDrawW / 240;

  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const uvToScreen = (u, v) => {
    const lx = (u - 0.5) * shipDrawW;
    const ly = (v - WARSHIP_HULL_BOTTOM_V) * shipDrawH;
    return {
      x: shipX + lx * cosP - ly * sinP,
      y: shipY + lx * sinP + ly * cosP
    };
  };

  const fwdPivot = uvToScreen(WARSHIP_TURRET_FWD.u, WARSHIP_TURRET_FWD.v);
  const aftPivot = uvToScreen(WARSHIP_TURRET_AFT.u, WARSHIP_TURRET_AFT.v);
  const padPos = uvToScreen(0.085, 0.728);
  setWarshipHelipadScreenAnchor(padPos.x, padPos.y, shipScale);

  const fwdAngle = arena3ShipMortarState.turretAngleFwd + pitch;
  const aftAngle = arena3ShipMortarState.turretAngleAft + pitch;
  const fwdBarrelLen = (WARSHIP_TURRET_FWD.barrelLen - arena3ShipMortarState.recoilForward * 5.5) * shipScale;
  const aftBarrelLen = (WARSHIP_TURRET_AFT.barrelLen - arena3ShipMortarState.recoilAft * 5.5) * shipScale;

  const fwdTip = {
    x: fwdPivot.x + Math.cos(fwdAngle) * fwdBarrelLen,
    y: fwdPivot.y + Math.sin(fwdAngle) * fwdBarrelLen
  };
  const aftTip = {
    x: aftPivot.x + Math.cos(aftAngle) * aftBarrelLen,
    y: aftPivot.y + Math.sin(aftAngle) * aftBarrelLen
  };

  return {
    seaHorizonY: estuaryHorizonY,
    estuaryCenterX,
    estuaryHorizonY,
    estuaryHalfW,
    shipX,
    shipY,
    shipWaterY,
    shipDrawW,
    shipDrawH,
    shipScale,
    pitch,
    pivots: [fwdPivot, aftPivot],
    angles: [fwdAngle, aftAngle],
    turrets: [fwdTip, aftTip]
  };
}

/**
 * Aktualizuje obrót luf okrętu (śledzenie celownika / celu), odrzut oraz lot pocisków.
 */
export function updateArena3ShipMortars(dt = (1 / 60), camera = null) {
  const safeDt = (typeof dt === 'number' && dt > 0 && dt < 0.5) ? dt : (1 / 60);
  const time = (typeof animTime === 'number' && animTime > 0) ? animTime : (performance.now() * 0.001);

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

  const cam = camera || (typeof window !== 'undefined' ? window.camera : null);

  // Płynne kierowanie ruchomych luf w stronę aktywnego celu lub celownika gracza
  let desiredAngle = -Math.PI * 0.5 + 0.14 + Math.sin(time * 0.4) * 0.07;
  if (arena3ShipMortarState.salvos.length > 0) {
    const activeSalvo = arena3ShipMortarState.salvos[arena3ShipMortarState.salvos.length - 1];
    const nextPending = activeSalvo.shells.find(s => !s.launched) || activeSalvo.shells[activeSalvo.shells.length - 1];
    if (nextPending && typeof nextPending.barrelAngle === 'number') {
      desiredAngle = nextPending.barrelAngle;
    } else {
      desiredAngle = computeShipTurretAimAngle(activeSalvo.targetX, cam, 0);
    }
  } else if (killstreakState && (killstreakState.mortarTargeting || killstreakState.mortarPendingLaunch)) {
    const aimX = killstreakState.mortarPendingLaunch
      ? killstreakState.mortarPendingLaunch.targetX
      : killstreakState.mortarTargetX;
    if (typeof aimX === 'number' && !isNaN(aimX)) {
      desiredAngle = computeShipTurretAimAngle(aimX, cam, 0);
    }
  }

  const aimLerp = Math.min(1, safeDt * 10.0);
  arena3ShipMortarState.turretAngleFwd += (desiredAngle - arena3ShipMortarState.turretAngleFwd) * aimLerp;
  arena3ShipMortarState.turretAngleAft += (desiredAngle - arena3ShipMortarState.turretAngleAft) * aimLerp;

  if (arena3ShipMortarState.salvos.length === 0) return;

  const canvasEl = (typeof document !== 'undefined') ? (document.getElementById('game') || document.getElementById('gameCanvas') || document.querySelector('canvas')) : null;
  const W_screen = (canvasEl && canvasEl.clientWidth) ? canvasEl.clientWidth : ((typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : 1920);
  const H_screen = (canvasEl && canvasEl.clientHeight) ? canvasEl.clientHeight : ((typeof window !== 'undefined' && window.innerHeight) ? window.innerHeight : 1080);
  const layout = getArena3WarshipLayout(W_screen, H_screen, cam, time);
  const camX = cam ? (cam.x || 0) : 0;
  const camY = cam ? (cam.y || 0) : 0;
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
          if (sh.turretIdx === 0) {
            arena3ShipMortarState.turretAngleFwd = sh.barrelAngle;
            arena3ShipMortarState.recoilForward = 1.0;
            arena3ShipMortarState.muzzleFlashForward = ARENA3_SHIP_FLASH_DURATION;
          } else {
            arena3ShipMortarState.turretAngleAft = sh.barrelAngle;
            arena3ShipMortarState.recoilAft = 1.0;
            arena3ShipMortarState.muzzleFlashAft = ARENA3_SHIP_FLASH_DURATION;
          }
          playSound('mortar_ship_fire');
        } else {
          continue;
        }
      }

      if (salvo.age < sh.handoffTime) {
        allFinished = false;
        sh.activePhase1 = true;
        const p = Math.max(0, Math.min(1, (salvo.age - sh.delay) / sh.flightDuration));
        // Krzywa przyspieszenia perspektywicznego: wolny wylot z oddali (0.25x) -> szybsze zbliżanie (2.50x)
        const sCurve = 0.25 * p + 0.75 * p * p * p;
        const startPos = layout.turrets[sh.turretIdx] || layout.turrets[0];
        const apexScreenX = (sh.apexWorldX - camX) * camZoom;
        const apexScreenY = (sh.apexWorldY - camY) * camZoom;

        // Krzywa Beziera startująca z lufy okrętu i przechodząca poziomo przez szczyt pod sufitem areny
        const dirX = Math.cos(sh.barrelAngle);
        const dirY = Math.sin(sh.barrelAngle);
        const barrelLead = Math.max(70 * layout.shipScale, (startPos.y - apexScreenY) * 0.36);
        const c1x = startPos.x + dirX * barrelLead;
        const c1y = startPos.y + dirY * barrelLead;
        const apexDirX = (sh.destX >= sh.apexWorldX) ? 1 : -1;
        const dsdtTick = (2.50 / Math.max(0.2, sh.flightDuration)) / 60;
        const targetHandle = Math.abs((sh.fallVx || 0) * camZoom) / (3 * dsdtTick);
        const maxHandle = Math.max(120, Math.abs(apexScreenX - startPos.x) * 0.65);
        const handleX = Math.max(28 * camZoom, Math.min(maxHandle, targetHandle || 36));
        const c2x = apexScreenX - apexDirX * handleX;
        const c2y = apexScreenY;

        const u = 1 - sCurve;
        const uu = u * u;
        const tt = sCurve * sCurve;
        const curX = uu * u * startPos.x + 3 * uu * sCurve * c1x + 3 * u * tt * c2x + tt * sCurve * apexScreenX;
        const curY = uu * u * startPos.y + 3 * uu * sCurve * c1y + 3 * u * tt * c2y + tt * sCurve * apexScreenY;

        const dxdt = 3 * uu * (c1x - startPos.x) + 6 * u * sCurve * (c2x - c1x) + 3 * tt * (apexScreenX - c2x);
        const dydt = 3 * uu * (c1y - startPos.y) + 6 * u * sCurve * (c2y - c1y) + 3 * tt * (apexScreenY - c2y);

        sh.curX = curX;
        sh.curY = curY;
        sh.angle = Math.atan2(dydt, dxdt);
        const startScale = Math.max(0.14, ARENA3_MORTAR_SCALE_FAR * layout.shipScale);
        const endScale = ARENA3_MORTAR_SCALE_APEX * camZoom;
        sh.renderScale = startScale + (endScale - startScale) * sCurve;

        sh.smokeTrail.push({
          x: curX,
          y: curY,
          r: (0.75 + sCurve * 1.9) * Math.max(layout.shipScale, camZoom),
          alpha: 0.72
        });
        if (sh.smokeTrail.length > 42) sh.smokeTrail.shift();
      } else {
        sh.activePhase1 = false;
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
  const h = 580;
  _cachedMountainsCanvas = document.createElement('canvas');
  _cachedMountainsCanvas.width = w;
  _cachedMountainsCanvas.height = h;
  const mc = _cachedMountainsCanvas.getContext('2d');
  if (!mc) return;

  // Pełne nocne pasmo górskie z naturalną przełęczą / doliną rzeczną w centrum (X: ~1100-1320)
  mc.save();
  const grad = mc.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#07101c'); // Ciemny granat szczytów
  grad.addColorStop(0.45, '#08141d');
  grad.addColorStop(0.78, '#091c1b'); // Ciemny petrol
  grad.addColorStop(1.0, '#0a221e'); // Mgła doliny
  mc.fillStyle = grad;

  mc.beginPath();
  mc.moveTo(0, h);
  mc.lineTo(0, h * 0.56);

  // Pasmo zachodnie wznoszące się ponad dżunglę
  mc.bezierCurveTo(220, h * 0.44, 420, h * 0.30, 620, h * 0.28);
  mc.bezierCurveTo(790, h * 0.27, 920, h * 0.46, 1080, h * 0.72);

  // Przełęcz / dolina rzeki opadająca ku rozlewisku
  mc.bezierCurveTo(1140, h * 0.80, 1260, h * 0.80, 1340, h * 0.68);

  // Monumentalny szczyt wschodni (wulkan / turnia dżungli)
  mc.bezierCurveTo(1480, h * 0.42, 1620, h * 0.14, 1760, h * 0.11);
  mc.bezierCurveTo(1860, h * 0.10, 1950, h * 0.26, 2100, h * 0.34);
  mc.bezierCurveTo(2230, h * 0.42, 2320, h * 0.48, w, h * 0.56);

  mc.lineTo(w, h);
  mc.closePath();
  mc.fill();

  // Srebrzyste światło księżyca na grani (rim lighting)
  mc.strokeStyle = 'rgba(186, 230, 253, 0.16)';
  mc.lineWidth = 1.6;
  mc.stroke();

  // Pasmo mgły u stóp szczytów
  const mistGrad = mc.createLinearGradient(0, h * 0.70, 0, h);
  mistGrad.addColorStop(0.0, 'rgba(10, 28, 24, 0)');
  mistGrad.addColorStop(1.0, 'rgba(10, 28, 24, 0.62)');
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
  jc.lineTo(0, h * 0.48);

  // Lewy ciąg koron dżungli schodzący ku dolinie rozlewiska (X: 0..950)
  const leftNodes = [
    { x: 110, hRatio: 0.32, r: 125 },
    { x: 320, hRatio: 0.38, r: 115 },
    { x: 540, hRatio: 0.28, r: 140 },
    { x: 760, hRatio: 0.36, r: 120 },
    { x: 940, hRatio: 0.50, r: 85 }
  ];
  for (let i = 0; i < leftNodes.length; i++) {
    const node = leftNodes[i];
    jc.arc(node.x, h * node.hRatio, node.r, Math.PI * 0.88, Math.PI * 0.14, false);
  }

  // Prześwit na odległe rozlewisko w dolinie (X: 980..1420)
  jc.bezierCurveTo(1060, h * 0.78, 1340, h * 0.78, 1420, h * 0.54);

  // Prawy ciąg koron dżungli z prastarymi ruinami świątyni (X: 1440..2400)
  const rightNodes = [
    { x: 1480, hRatio: 0.44, r: 90 },
    { x: 1680, hRatio: 0.30, r: 135 },
    { x: 1920, hRatio: 0.38, r: 120 },
    { x: 2140, hRatio: 0.29, r: 140 },
    { x: 2330, hRatio: 0.36, r: 120 }
  ];
  for (let i = 0; i < rightNodes.length; i++) {
    const node = rightNodes[i];
    jc.arc(node.x, h * node.hRatio, node.r, Math.PI * 0.86, Math.PI * 0.12, false);
  }

  jc.lineTo(w, h * 0.52);
  jc.lineTo(w, h);
  jc.closePath();
  jc.fill();

  // Sylwetka prastarej świątyni / ruiny kamiennej w stylu Khmer w głębi prawej dżungli (X: ~1760..1920)
  jc.fillStyle = '#030a08';
  jc.fillRect(1770, h * 0.38, 150, h * 0.62);
  jc.fillRect(1795, h * 0.29, 100, h * 0.09);
  jc.fillRect(1820, h * 0.22, 50, h * 0.07);
  jc.fillStyle = '#010403';
  jc.fillRect(1824, h * 0.54, 42, h * 0.46);

  // Liście palmowe na grzbietach koron
  jc.strokeStyle = '#051410';
  jc.lineWidth = 3.6;
  for (let px = 120; px < w; px += 250) {
    if (px > 930 && px < 1450) continue;
    jc.beginPath();
    jc.moveTo(px, h * 0.35);
    jc.quadraticCurveTo(px + 42, h * 0.27, px + 76, h * 0.31);
    jc.stroke();
    jc.beginPath();
    jc.moveTo(px, h * 0.35);
    jc.quadraticCurveTo(px - 42, h * 0.27, px - 76, h * 0.31);
    jc.stroke();
  }

  jc.restore();
}

// =========================================================================
// 4. PERSPEKTYWICZNA RZEKA, ROZLEWISKO I OKRĘT WOJENNY (SPRITE SHEET)
// =========================================================================
let _cachedRiverGrad = null;
let _cachedRiverTopY = -1;
let _cachedRiverBotY = -1;

function drawArena3EstuaryAndRiver(ctx, layout, W_screen, H_screen, camera, time) {
  const { estuaryCenterX, estuaryHorizonY, estuaryHalfW } = layout;
  const camX = camera ? (camera.x || 0) : 0;
  const camY = camera ? (camera.y || 0) : 0;
  const camZoom = camera ? (camera.zoom || 1) : 1;

  // Współrzędne pierwszego planu rzeki (X: 1600..2800, Y: 1300 w przestrzeni świata)
  const nearLeftX = (1600 - camX) * camZoom;
  const nearRightX = (2800 - camX) * camZoom;
  const nearCenterX = (nearLeftX + nearRightX) * 0.5;
  const nearHalfW = (nearRightX - nearLeftX) * 0.5;
  const rawNearY = (1302 - camY) * camZoom;
  const nearY = Math.max(estuaryHorizonY + 90, rawNearY);

  // Punkty kontrolne S-krzywizny rzeki wijącej się między brzegami dżungli od rozlewiska do mostu
  const estuaryFrontY = estuaryHorizonY + Math.max(46, (nearY - estuaryHorizonY) * 0.26);
  const farLeftX = estuaryCenterX - estuaryHalfW;
  const farRightX = estuaryCenterX + estuaryHalfW;
  const neckHalfW = Math.max(58, nearHalfW * 0.24);
  const bendOffset = (nearCenterX - estuaryCenterX) * 0.18;

  const qTop = Math.round(estuaryHorizonY);
  const qBot = Math.round(nearY + 40);
  if (!_cachedRiverGrad || Math.abs(_cachedRiverTopY - qTop) > 2 || Math.abs(_cachedRiverBotY - qBot) > 2) {
    const rGrad = ctx.createLinearGradient(0, qTop, 0, qBot);
    rGrad.addColorStop(0.00, '#071b2d'); // Zamglone dalekie rozlewisko
    rGrad.addColorStop(0.26, '#092a44'); // Środkowy bieg rzeki
    rGrad.addColorStop(0.68, '#0f4770'); // Nocny granat/cyjan nurtu
    rGrad.addColorStop(1.00, '#1a6ea3'); // Płynne przejście w powierzchnię rzeki na arenie
    _cachedRiverGrad = rGrad;
    _cachedRiverTopY = qTop;
    _cachedRiverBotY = qBot;
  }

  const lP0 = { x: farLeftX - 24, y: estuaryHorizonY + 10 };
  const lP1 = { x: farLeftX - 42, y: estuaryFrontY + 18 };
  const lP2 = { x: estuaryCenterX - neckHalfW * 1.15 - bendOffset * 0.6, y: estuaryFrontY + (nearY - estuaryFrontY) * 0.42 };
  const lP3 = { x: nearLeftX, y: nearY };

  const rP0 = { x: farRightX + 24, y: estuaryHorizonY + 9 };
  const rP1 = { x: farRightX + 42, y: estuaryFrontY + 22 };
  const rP2 = { x: estuaryCenterX + neckHalfW * 1.38 + bendOffset, y: estuaryFrontY + (nearY - estuaryFrontY) * 0.34 };
  const rP3 = { x: nearRightX, y: nearY };

  const evalCubic = (p0, p1, p2, p3, t) => {
    const u = 1 - t;
    const uu = u * u;
    const tt = t * t;
    return {
      x: uu * u * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + tt * t * p3.x,
      y: uu * u * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p3.y
    };
  };

  // 1. Zarys rozlewiska w dolinie oraz wijącego się koryta rzeki
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(lP0.x, lP0.y);
  ctx.quadraticCurveTo(estuaryCenterX - estuaryHalfW * 0.52, estuaryHorizonY - 6, estuaryCenterX, estuaryHorizonY + 3);
  ctx.quadraticCurveTo(estuaryCenterX + estuaryHalfW * 0.52, estuaryHorizonY - 7, rP0.x, rP0.y);
  ctx.bezierCurveTo(rP1.x, rP1.y, rP2.x, rP2.y, rP3.x, rP3.y);
  ctx.lineTo(nearRightX, Math.max(nearY + 35, H_screen));
  ctx.lineTo(nearLeftX, Math.max(nearY + 35, H_screen));
  ctx.lineTo(lP3.x, lP3.y);
  ctx.bezierCurveTo(lP2.x, lP2.y, lP1.x, lP1.y, lP0.x, lP0.y);
  ctx.closePath();

  ctx.fillStyle = _cachedRiverGrad;
  ctx.fill();

  // 2. Perspektywiczne refleksy księżyca i mgła dolinna (w przycięciu do koryta)
  ctx.save();
  ctx.clip();

  const skyW = 2400;
  const skyParallaxX = ((camX * 0.02) % skyW + skyW) % skyW;
  let moonScreenX = (skyW * 0.74) - skyParallaxX;
  if (moonScreenX < -100) moonScreenX += skyW;
  if (moonScreenX > W_screen + 100) moonScreenX -= skyW;

  // Miękka mgiełka nad dalekim brzegiem rozlewiska (płynne przejście wody w dolinę górską)
  const hazeH = Math.max(36, (estuaryFrontY - estuaryHorizonY) * 0.85);
  const hazeGrad = ctx.createLinearGradient(0, estuaryHorizonY - 10, 0, estuaryHorizonY + hazeH);
  hazeGrad.addColorStop(0.0, 'rgba(9, 28, 27, 0.88)');
  hazeGrad.addColorStop(0.35, 'rgba(10, 34, 42, 0.35)');
  hazeGrad.addColorStop(1.0, 'rgba(12, 42, 54, 0)');
  ctx.fillStyle = hazeGrad;
  ctx.fillRect(farLeftX - 80, estuaryHorizonY - 12, estuaryHalfW * 2 + 160, hazeH + 12);

  // Niskie zalesione wysepki / półwyspy przy dalekim brzegu rozlewiska
  ctx.fillStyle = '#061512';
  ctx.beginPath();
  ctx.moveTo(farLeftX - 30, estuaryHorizonY + 14);
  ctx.quadraticCurveTo(farLeftX + estuaryHalfW * 0.30, estuaryHorizonY - 3, farLeftX + estuaryHalfW * 0.62, estuaryHorizonY + 9);
  ctx.lineTo(farLeftX - 30, estuaryHorizonY + 14);
  ctx.moveTo(farRightX + 30, estuaryHorizonY + 14);
  ctx.quadraticCurveTo(farRightX - estuaryHalfW * 0.26, estuaryHorizonY - 4, farRightX - estuaryHalfW * 0.56, estuaryHorizonY + 10);
  ctx.lineTo(farRightX + 30, estuaryHorizonY + 14);
  ctx.fill();

  // Perspektywiczne fale w głąb rzeki (1 batch stroke)
  ctx.strokeStyle = 'rgba(148, 226, 255, 0.22)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const rows = 14;
  for (let r = 0; r < rows; r++) {
    const t = r / (rows - 1);
    const pt = t * t;
    const wy = estuaryHorizonY + 14 + pt * (nearY - estuaryHorizonY - 20);
    const centerAtY = estuaryCenterX + (nearCenterX - estuaryCenterX) * pt;
    const spanAtY = Math.max(40, (t < 0.25 ? estuaryHalfW * 0.7 : (neckHalfW + (nearHalfW - neckHalfW) * pt)) * 0.72);
    const segCount = t < 0.3 ? 3 : 4;
    for (let k = 0; k < segCount; k++) {
      const frac = ((k + 0.5) / segCount) * 2 - 1;
      const sx = centerAtY + frac * spanAtY * 0.65 + Math.sin(time * 1.9 + r + k) * (4 + pt * 12);
      const len = (10 + pt * 36) * (0.8 + 0.3 * Math.cos(time * 2.3 + r * 1.7 + k));
      ctx.moveTo(sx - len * 0.5, wy);
      ctx.lineTo(sx + len * 0.5, wy);
    }
  }
  // Ścieżka księżycowego blasku na rozlewisku
  for (let r = 0; r < 7; r++) {
    const wy = estuaryHorizonY + 13 + r * 6.5;
    const drift = Math.sin(time * 2.2 + r * 1.2) * (3 + r * 1.4);
    const segW = 14 + r * 3.5;
    ctx.moveTo(moonScreenX + drift - segW * 0.5, wy);
    ctx.lineTo(moonScreenX + drift + segW * 0.5, wy);
  }
  ctx.stroke();

  ctx.restore(); // koniec clip

  // 3. Organiczne zalesione brzegi dżungli wzdłuż wijącej się rzeki (jednolity kolor #06130f z koronami dokładnie po zewnętrznej stronie krzywej)
  ctx.fillStyle = '#06130f';
  ctx.beginPath();
  ctx.moveTo(lP0.x, lP0.y);
  ctx.bezierCurveTo(lP1.x, lP1.y, lP2.x, lP2.y, lP3.x, lP3.y);
  ctx.lineTo(lP3.x - 360, nearY + 45);
  ctx.lineTo(Math.min(-120, farLeftX - 520), nearY + 45);
  ctx.lineTo(Math.min(-120, farLeftX - 520), estuaryHorizonY + 26);
  ctx.quadraticCurveTo(farLeftX - 180, estuaryHorizonY + 12, lP0.x, lP0.y);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(rP0.x, rP0.y);
  ctx.bezierCurveTo(rP1.x, rP1.y, rP2.x, rP2.y, rP3.x, rP3.y);
  ctx.lineTo(rP3.x + 360, nearY + 45);
  ctx.lineTo(Math.max(W_screen + 120, farRightX + 520), nearY + 45);
  ctx.lineTo(Math.max(W_screen + 120, farRightX + 520), estuaryHorizonY + 26);
  ctx.quadraticCurveTo(farRightX + 180, estuaryHorizonY + 12, rP0.x, rP0.y);
  ctx.closePath();
  ctx.fill();

  // Krzewy i korony dżungli wyprofilowane dokładnie wzdłuż obu krzywych brzegu (nigdy nie wchodzą na wodę)
  ctx.beginPath();
  for (let s = 0; s <= 9; s++) {
    const t = s / 9;
    const radL = 14 + (t * t) * 26 + (s % 2) * 8;
    const ptL = evalCubic(lP0, lP1, lP2, lP3, t);
    ctx.moveTo(ptL.x - radL * 0.55 + radL, ptL.y);
    ctx.arc(ptL.x - radL * 0.55, ptL.y, radL, 0, Math.PI * 2);

    const radR = 14 + (t * t) * 26 + ((s + 1) % 2) * 8;
    const ptR = evalCubic(rP0, rP1, rP2, rP3, t);
    ctx.moveTo(ptR.x + radR * 0.55 + radR, ptR.y);
    ctx.arc(ptR.x + radR * 0.55, ptR.y, radR, 0, Math.PI * 2);
  }
  ctx.fill();

  ctx.restore();
}

function drawArticulatedWarshipTurret(ctx, pivot, angle, barrelLen, recoil, flashTimer, scale, isAft = false) {
  ctx.save();
  ctx.translate(pivot.x, pivot.y);

  // 1. Ruchoma lufa z odrzutem wzdłuż osi strzału
  ctx.save();
  ctx.rotate(angle);
  const recoilShift = recoil * 5.5 * scale;
  const bLen = barrelLen * scale - recoilShift;
  const bThick = (isAft ? 4.4 : 3.8) * scale;

  ctx.fillStyle = '#1b2b3d';
  ctx.strokeStyle = '#070b11';
  ctx.lineWidth = Math.max(1.0, 1.2 * scale);
  ctx.fillRect(0, -bThick * 0.5, bLen, bThick);
  ctx.strokeRect(0, -bThick * 0.5, bLen, bThick);

  // Księżycowe rozjaśnienie górnej krawędzi lufy + hamulec wylotowy
  ctx.fillStyle = '#476582';
  ctx.fillRect(2 * scale, -bThick * 0.5 + 0.5, Math.max(4, bLen - 4 * scale), Math.max(1, bThick * 0.28));
  ctx.fillStyle = '#25394f';
  ctx.fillRect(bLen - 4.2 * scale, -bThick * 0.72, 4.2 * scale, bThick * 1.44);
  ctx.strokeRect(bLen - 4.2 * scale, -bThick * 0.72, 4.2 * scale, bThick * 1.44);

  // Kierunkowy błysk wystrzału u wylotu obróconej lufy
  if (flashTimer > 0) {
    const fT = Math.min(1, flashTimer / ARENA3_SHIP_FLASH_DURATION);
    ctx.fillStyle = `rgba(249, 115, 22, ${(0.55 * fT).toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(bLen + 11 * scale, 0, 15 * scale * fT, 6.5 * scale * fT, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(254, 240, 138, ${(0.95 * fT).toFixed(2)})`;
    ctx.beginPath();
    ctx.moveTo(bLen, -3.5 * scale * fT);
    ctx.lineTo(bLen + 20 * scale * fT, 0);
    ctx.lineTo(bLen, 3.5 * scale * fT);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 2. Opancerzona kopuła wieży na pokładzie
  const cupW = (isAft ? 16 : 19) * scale;
  const cupH = (isAft ? 9 : 10.5) * scale;
  ctx.fillStyle = '#182635';
  ctx.strokeStyle = '#070b11';
  ctx.lineWidth = Math.max(1.1, 1.3 * scale);
  ctx.beginPath();
  ctx.moveTo(-cupW * 0.56, 2 * scale);
  ctx.lineTo(-cupW * 0.42, -cupH);
  ctx.lineTo(cupW * 0.34, -cupH);
  ctx.lineTo(cupW * 0.56, 2 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#3b5773';
  ctx.fillRect(-cupW * 0.36, -cupH + 1.2 * scale, cupW * 0.64, 1.4 * scale);

  ctx.restore();
}

function drawArena3Warship(ctx, layout, time) {
  const { shipX, shipY, shipWaterY, shipDrawW, shipDrawH, shipScale, pitch, pivots, angles, turrets } = layout;
  const sheet = ensureWarshipSpriteSheet();

  const flashF = arena3ShipMortarState.muzzleFlashForward;
  const flashA = arena3ShipMortarState.muzzleFlashAft;

  ctx.save();

  // 1. Odbicie kadłuba i błysków wystrzału w wodzie rozlewiska
  if (sheet) {
    ctx.save();
    ctx.translate(shipX, shipWaterY + 2);
    ctx.rotate(-pitch * 0.5);
    ctx.scale(1, -0.34);
    ctx.globalAlpha = 0.25;
    ctx.drawImage(
      sheet,
      0,
      0,
      WARSHIP_CELL_W,
      WARSHIP_CELL_H,
      -shipDrawW * 0.5,
      -shipDrawH * WARSHIP_HULL_BOTTOM_V,
      shipDrawW,
      shipDrawH
    );
    ctx.restore();
  }

  if (flashF > 0 && turrets[0]) {
    const fAlpha = Math.min(0.45, flashF * 2.4);
    ctx.fillStyle = `rgba(251, 146, 60, ${fAlpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(turrets[0].x, shipWaterY + 5 * shipScale, 28 * shipScale, 4.5 * shipScale, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (flashA > 0 && turrets[1]) {
    const aAlpha = Math.min(0.45, flashA * 2.4);
    ctx.fillStyle = `rgba(251, 146, 60, ${aAlpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(turrets[1].x, shipWaterY + 5 * shipScale, 28 * shipScale, 4.5 * shipScale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Kadłub okrętu ze sprite sheetu + dwie ruchome wieże kierujące się na cel
  ctx.save();
  ctx.translate(shipX, shipY);
  ctx.rotate(pitch);

  if (sheet) {
    ctx.globalAlpha = 0.94;
    ctx.drawImage(
      sheet,
      0,
      0,
      WARSHIP_CELL_W,
      WARSHIP_CELL_H,
      -shipDrawW * 0.5,
      -shipDrawH * WARSHIP_HULL_BOTTOM_V,
      shipDrawW,
      shipDrawH
    );
  } else {
    ctx.fillStyle = '#0c1824';
    ctx.fillRect(-shipDrawW * 0.42, -14, shipDrawW * 0.84, 14);
    ctx.fillRect(-shipDrawW * 0.12, -32, shipDrawW * 0.24, 18);
  }
  ctx.restore();

  // Ruchoma wieża dziobowa i rufowa na pokładzie
  if (pivots && pivots[0]) {
    drawArticulatedWarshipTurret(
      ctx,
      pivots[0],
      angles[0],
      WARSHIP_TURRET_FWD.barrelLen,
      arena3ShipMortarState.recoilForward,
      flashF,
      shipScale,
      false
    );
  }
  if (pivots && pivots[1]) {
    drawArticulatedWarshipTurret(
      ctx,
      pivots[1],
      angles[1],
      WARSHIP_TURRET_AFT.barrelLen,
      arena3ShipMortarState.recoilAft,
      flashA,
      shipScale,
      true
    );
  }

  // 3. Delikatny ślad kilwateru na linii wody pod kadłubem
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.24)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(shipX - shipDrawW * 0.48, shipWaterY + 1.5);
  ctx.lineTo(shipX + shipDrawW * 0.48, shipWaterY + 1.5);
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

      if (sh.activePhase1 && typeof sh.curX === 'number') {
        const sc = sh.renderScale || Math.max(0.14, ARENA3_MORTAR_SCALE_FAR * (layout.shipScale || 1));
        drawMortarBombSprite(ctx, sh.curX, sh.curY, sh.angle ?? sh.barrelAngle ?? (-Math.PI * 0.5), sc);
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
  const estuaryHorizonY = warshipLayout.estuaryHorizonY;

  // -----------------------------------------------------------------------
  // WARSTWA 4: PEŁNE NOCNE PASMO GÓRSKIE Z DOLINĄ NAD ROZLEWISKIEM
  // -----------------------------------------------------------------------
  ensureMountainsCanvas();
  if (_cachedMountainsCanvas) {
    const mPeriod = 2400;
    const mBaseX = (W_screen * 0.5 - mPeriod * 0.5) - (arenaCenterShift * 0.04);
    const mHeight = H_screen * 0.44;
    const mY = estuaryHorizonY - mHeight * 0.84 - (camY * 0.015);

    for (let loop = -1; loop <= 1; loop++) {
      const drawX = mBaseX + loop * mPeriod;
      if (drawX + mPeriod < -100 || drawX > W_screen + 100) continue;
      ctx.drawImage(_cachedMountainsCanvas, drawX, mY, mPeriod, mHeight);
    }
  }

  // -----------------------------------------------------------------------
  // WARSTWA 5: KORONY DRZEW DŻUNGLI I RUINY OTACZAJĄCE DOLINĘ
  // -----------------------------------------------------------------------
  ensureJungleCanvas();
  if (_cachedJungleCanvas) {
    const jPeriod = 2400;
    const jBaseX = (W_screen * 0.5 - jPeriod * 0.5) - (arenaCenterShift * 0.08);
    const jHeight = H_screen * 0.62;
    const jY = estuaryHorizonY - H_screen * 0.16 - (camY * 0.02);

    for (let loop = -1; loop <= 1; loop++) {
      const drawX = jBaseX + loop * jPeriod;
      if (drawX + jPeriod < -100 || drawX > W_screen + 100) continue;
      ctx.drawImage(_cachedJungleCanvas, drawX, jY, jPeriod, jHeight);
    }
  }

  // -----------------------------------------------------------------------
  // WARSTWA 5.2: PERSPEKTYWICZNA RZEKA ŁĄCZĄCA ARENĘ Z ROZLEWISKIEM + OKRĘT
  // -----------------------------------------------------------------------
  drawArena3EstuaryAndRiver(ctx, warshipLayout, W_screen, H_screen, camera, time);
  drawArena3Warship(ctx, warshipLayout, time);

  // -----------------------------------------------------------------------
  // WARSTWA 5.5: WZNOSZĄCE SIĘ POCISKI MOŹDZIERZOWE Z OKRĘTU PONAD EKRAN
  // -----------------------------------------------------------------------
  drawArena3ShipMortars(ctx, warshipLayout);
  drawBackgroundShipDrones(ctx, camera);

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
