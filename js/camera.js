// =========================================================================
// CAMERA.JS - SYSTEM ZARZĄDZANIA KAMERĄ I STRICT CAMERA CLAMPING
// Warstwa 1: Środowisko fizyczne / Silnik kamery
// =========================================================================

import { CONFIG, ARENA_LEFT as CFG_ARENA_LEFT, ARENA_RIGHT as CFG_ARENA_RIGHT, isTouchDevice } from './config.js';
import { killstreakState } from './killstreaks/state.js';
import { arena5State } from './arenas/arena5/state.js';

let _cameraCanvas = null;
let _cameraGroundY = null;
let _cameraArenaId = 'ARENA_1';
let _cachedIsMobile = null;

export function isMobileDevice(forceRefresh = false) {
  if (typeof window === 'undefined') return false;
  if (_cachedIsMobile !== null && !forceRefresh) return _cachedIsMobile;

  if (window.location && (new URLSearchParams(window.location.search).has('mobile') || new URLSearchParams(window.location.search).has('touch'))) {
    _cachedIsMobile = true;
    return true;
  }

  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
  const isSmallScreen = (window.innerWidth <= 850) || (window.innerHeight <= 520);
  const isPureTouch = (typeof window.matchMedia === 'function') &&
    window.matchMedia('(pointer: coarse)').matches &&
    !window.matchMedia('(pointer: fine)').matches;

  _cachedIsMobile = isMobileUA || (isTouchDevice && isSmallScreen) || isPureTouch;
  return _cachedIsMobile;
}

let _cachedCamX = null;
let _cachedCamY = null;
let _hasCustomCamUrl = false;
if (typeof window !== 'undefined' && window.location) {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('camX')) {
      _cachedCamX = Number(urlParams.get('camX'));
      _hasCustomCamUrl = true;
    }
    if (urlParams.has('camY')) {
      _cachedCamY = Number(urlParams.get('camY'));
      _hasCustomCamUrl = true;
    }
  } catch (_) {}
}

// =========================================================================
// UNIFIED ARENA CAMERA PROFILES (JEDNO ŹRÓDŁO PRAWDY DLA 5 AREN)
// =========================================================================
const ARENA5_ALIASES = new Set([
  'ARENA_5', 'ARENA-5', '5', 'PREFAB_TOWER', 'PREFABRYKATOR',
  'PREFABRYKATOR_ORBITALNY', 'SEKTOR_05'
]);

const ARENA4_ALIASES = new Set([
  'ARENA_4', 'ARENA-4', '4', 'OBSIDIAN_CALDERA', 'CALDERA', 'OBSIDIAN',
  'KRATER', 'WULKAN', 'MAGMA', 'USS_TITAN', 'TITAN', 'LOTNISKOWIEC',
  'AIRCRAFT_CARRIER', 'CARRIER', 'OIL_RIG_TYPHOON', 'TYPHOON', 'TYFON',
  'OIL_RIG', 'RIG', 'RIG_08', 'OFFSHORE_RIG', 'PLATFORMA_WIERTNICZA',
  'PLATFORMA_MORSKA', 'PLATFORMA', 'ARMORED_TRAIN', 'TRAIN', 'POCIAG',
  'POCIĄG', 'PEDZACY_POCIAG', 'PĘDZĄCY_POCIĄG', 'SPACE_STATION', 'SPACE',
  'ARES', 'ARES_STATION', 'ARES_ORBITAL_STATION', 'STACJA_ARES', 'STACJA_ORBITALNA_ARES'
]);

const ARENA3_ALIASES = new Set([
  'ARENA_3', 'ARENA-3', '3', 'ARENA_FOUNDRY', 'FOUNDRY',
  'AERO_REFINERY', 'AERO_RAFINERIA', 'AERO', 'SKY_DISTRICT',
  'PODNIEBNY_DYSTRYKT', 'JUNGLE', 'JUNGLE_ARENA', 'DZUNGLA', 'MILITARNA_DZUNGLA'
]);

const ARENA2_ALIASES = new Set([
  'ARENA_2', 'ARENA-2', '2', 'ARENA_2_PANDORA', 'ARENA_2_SECTOR_X',
  'SECTOR_X', 'SEKTOR_X', 'PANDORA', 'HALLELUJAH', 'CYBER_STADIUM'
]);

export function normalizeCameraArenaKey(arenaId) {
  const key = String(arenaId || 'ARENA_1').trim().toUpperCase();
  if (ARENA5_ALIASES.has(key)) return 'ARENA_5';
  if (ARENA4_ALIASES.has(key)) return 'ARENA_4';
  if (ARENA3_ALIASES.has(key)) return 'ARENA_3';
  if (ARENA2_ALIASES.has(key)) return 'ARENA_2';
  return 'ARENA_1';
}

export function getArenaCameraProfile(arenaId = getCameraArenaId()) {
  const key = normalizeCameraArenaKey(arenaId);
  const groundFloor = getCameraGroundY();

  if (key === 'ARENA_5') {
    return {
      key: 'ARENA_5',
      minX: 0,
      maxX: 1600,
      width: 1600,
      minY: -100000,
      maxY: 2000,
      height: 2000,
      baseFloorY: 1200,
      isVerticalTower: true,
      hardBottomY: null,
      lockTopZero: false,
      minZoomHeightLimit: null,
      elevAnchorDeltaPC: 0.15,
      elevAnchorDeltaMobile: 0.15,
      safeMarginTopRatio: 0.20,
      safeMarginBottomRatio: 0.16,
      safeMarginBottomMin: 70,
      getMinCamY: () => -100000,
      getMaxCamY: (viewHeight, _gf, a5FloorY) => (typeof a5FloorY === 'number' ? a5FloorY : 1200) - viewHeight,
      getMenuTarget: (isMobile) => ({
        centerX: 800,
        targetBottomY: isMobile ? 1290 : 1270,
        targetWorldHeight: isMobile ? 1040 : 1100,
        targetWorldWidth: isMobile ? 1550 : 1600
      })
    };
  }

  if (key === 'ARENA_4') {
    return {
      key: 'ARENA_4',
      minX: 0,
      maxX: 3800,
      width: 3800,
      minY: 0,
      maxY: 1500,
      height: 1500,
      baseFloorY: 1040,
      isVerticalTower: false,
      hardBottomY: 1500,
      lockTopZero: true,
      minZoomHeightLimit: 1500,
      elevAnchorDeltaPC: 0.20,
      elevAnchorDeltaMobile: 0.22,
      safeMarginTopRatio: 0.18,
      safeMarginBottomRatio: 0.16,
      safeMarginBottomMin: 65,
      getMinCamY: () => 0,
      getMaxCamY: (viewHeight) => Math.max(0, 1500 - viewHeight),
      getMenuTarget: (isMobile) => ({
        centerX: 1600,
        targetBottomY: isMobile ? 1420 : 1400,
        targetWorldHeight: isMobile ? 1160 : 1220,
        targetWorldWidth: isMobile ? 2150 : 2260
      })
    };
  }

  if (key === 'ARENA_3') {
    return {
      key: 'ARENA_3',
      minX: 0,
      maxX: 4400,
      width: 4400,
      minY: 0,
      maxY: 1400,
      height: 1400,
      baseFloorY: 1200,
      isVerticalTower: false,
      hardBottomY: 1400,
      lockTopZero: false,
      minZoomHeightLimit: 1850,
      elevAnchorDeltaPC: 0.23,
      elevAnchorDeltaMobile: 0.25,
      safeMarginTopRatio: 0.20,
      safeMarginBottomRatio: 0.18,
      safeMarginBottomMin: 75,
      getMinCamY: (viewHeight) => Math.min(-320, 1400 - viewHeight),
      getMaxCamY: (viewHeight) => 1400 - viewHeight,
      getMenuTarget: (isMobile) => ({
        centerX: 2180,
        targetBottomY: isMobile ? 1380 : 1340,
        targetWorldHeight: isMobile ? 1160 : 1200,
        targetWorldWidth: isMobile ? 2200 : 2280
      })
    };
  }

  if (key === 'ARENA_2') {
    return {
      key: 'ARENA_2',
      minX: 0,
      maxX: 4000,
      width: 4000,
      minY: 0,
      maxY: 1600,
      height: 1600,
      baseFloorY: 1150,
      isVerticalTower: false,
      hardBottomY: 1600,
      lockTopZero: true,
      minZoomHeightLimit: 1720,
      elevAnchorDeltaPC: 0.23,
      elevAnchorDeltaMobile: 0.25,
      safeMarginTopRatio: 0.20,
      safeMarginBottomRatio: 0.18,
      safeMarginBottomMin: 75,
      getMinCamY: () => 0,
      getMaxCamY: (viewHeight) => Math.max(0, 1600 - viewHeight),
      getMenuTarget: (isMobile) => ({
        centerX: 2000,
        targetBottomY: isMobile ? 1515 : 1485,
        targetWorldHeight: isMobile ? 1220 : 1270.588,
        targetWorldWidth: isMobile ? 2200 : 2260
      })
    };
  }

  // ARENA_1 (Neonowe Miasto)
  return {
    key: 'ARENA_1',
    minX: CFG_ARENA_LEFT,
    maxX: CFG_ARENA_RIGHT,
    width: CFG_ARENA_RIGHT - CFG_ARENA_LEFT,
    minY: 0,
    maxY: 1300,
    height: 1300,
    baseFloorY: groundFloor,
    isVerticalTower: false,
    hardBottomY: null,
    lockTopZero: false,
    minZoomHeightLimit: null,
    elevAnchorDeltaPC: 0.23,
    elevAnchorDeltaMobile: 0.25,
    safeMarginTopRatio: 0.20,
    safeMarginBottomRatio: 0.18,
    safeMarginBottomMin: 75,
    getMinCamY: (viewHeight, gf) => Math.min(-360, (typeof gf === 'number' ? gf : groundFloor) - viewHeight * 0.72),
    getMaxCamY: (viewHeight, gf) => Math.max(-360, (typeof gf === 'number' ? gf : groundFloor) - viewHeight * 0.72),
    getMenuTarget: (isMobile) => ({
      centerX: 1800,
      targetBottomY: isMobile ? 1180 : 1150,
      targetWorldHeight: isMobile ? 1050 : 1120,
      targetWorldWidth: isMobile ? 2100 : 2260
    })
  };
}

export function calculateArena5Zoom(canvasWidth, canvasHeight, isMobile = isMobileDevice()) {
  const w = canvasWidth || 1920;
  const h = canvasHeight || 1080;
  const widthFillZoom = w / 1600;
  if (isMobile) {
    return Math.round(Math.max(0.35, Math.min(1.8, widthFillZoom)) * 1000) / 1000;
  }
  // Na bardzo szerokich monitorach (21:9 / 32:9) pilnujemy min. ~900px wysokości szybu w pionie
  const minVerticalViewCap = h / 900;
  const zoom = Math.max(0.35, Math.min(1.8, Math.min(widthFillZoom, minVerticalViewCap)));
  return Math.round(zoom * 1000) / 1000;
}

export function computeArenaMinZoom(profile, canvasWidth, canvasHeight, isMobile = isMobileDevice()) {
  const w = canvasWidth || 1920;
  const h = canvasHeight || 1080;
  if (!profile) return w / (CFG_ARENA_RIGHT - CFG_ARENA_LEFT);
  if (profile.isVerticalTower) {
    return calculateArena5Zoom(w, h, isMobile);
  }
  const minZoomX = w / profile.width;
  const minZoomY = (typeof profile.minZoomHeightLimit === 'number' && profile.minZoomHeightLimit > 0)
    ? (h / profile.minZoomHeightLimit)
    : 0;
  return Math.max(minZoomX, minZoomY);
}

/**
 * Dynamicznie oblicza optymalny bazowy zoom kamery dopasowany do rozmiaru, proporcji ekranu oraz areny.
 */
export function calculateOptimalBaseZoom(canvasWidth, canvasHeight, isMobile, arenaId = null) {
  const w = canvasWidth || (typeof window !== 'undefined' ? window.innerWidth : 1920);
  const h = canvasHeight || (typeof window !== 'undefined' ? window.innerHeight : 1080);
  const profile = arenaId ? getArenaCameraProfile(arenaId) : null;

  if (profile && profile.isVerticalTower) {
    return calculateArena5Zoom(w, h, isMobile);
  }

  let baseZoom;
  if (isMobile) {
    // Proporcjonalne dopasowanie dla smartfonów (16:9..20:9) i tabletów (4:3..16:10)
    const minDim = Math.min(w, h);
    const t = Math.max(0, Math.min(1, (minDim - 380) / 380));
    const targetWorldW = 1660 + t * 440; // 1660 -> 2100
    const targetWorldH = 780 + t * 520;  // 780 -> 1300
    const zoomByAspect = Math.min(w / targetWorldW, h / targetWorldH);
    const minReadable = (w < h) ? 0.36 : 0.45;
    baseZoom = Math.max(minReadable, Math.min(0.66, zoomByAspect));
  } else {
    // Złoty standard 16:9: 1920x1080 -> 0.75 (2560 x 1440 px w świecie)
    const zoomRefW = w / 2560;
    const zoomRefH = h / 1440;
    const rawZoom = Math.min(zoomRefW, zoomRefH);

    let zoomByViewport;
    if (rawZoom >= 0.75) {
      zoomByViewport = rawZoom;
    } else {
      // Mniejsze okna PC, laptopy 720p i proporcje 4:3: płynne przejście z ochroną czytelności postaci
      const blended = 0.30 + (rawZoom / 0.75) * (0.75 - 0.30);
      zoomByViewport = Math.max(0.46, blended);
    }

    // Ochrona przed zbyt szerokim polem widzenia na monitorach Ultrawide (21:9 / 32:9)
    const maxAllowedWorldWidth = 2720;
    const zoomByWidthCap = w / maxAllowedWorldWidth;
    baseZoom = Math.max(zoomByViewport, zoomByWidthCap);
  }

  if (profile) {
    const arenaMinZoom = computeArenaMinZoom(profile, w, h, isMobile);
    baseZoom = Math.max(arenaMinZoom, baseZoom);
  }

  return Math.round(baseZoom * 1000) / 1000;
}

const initialCanvasW = typeof window !== 'undefined' ? window.innerWidth : 1920;
const initialCanvasH = typeof window !== 'undefined' ? window.innerHeight : 1080;
const initialMobile = isMobileDevice();
const initialDefaultZoom = calculateOptimalBaseZoom(initialCanvasW, initialCanvasH, initialMobile);

export function setCameraCanvas(c) {
  _cameraCanvas = c;
  updateCanvasDimensionsCache();
}

export function getCameraCanvas() {
  if (_cameraCanvas) return _cameraCanvas;
  if (typeof document !== 'undefined') {
    return document.getElementById('game') || document.getElementById('gameCanvas') || document.querySelector('canvas');
  }
  return null;
}

export function setCameraGroundY(val) {
  _cameraGroundY = val;
}

export function getCameraGroundY() {
  if (typeof _cameraGroundY === 'number') return _cameraGroundY;
  return 1000;
}

export function setCameraArenaId(id) {
  if (id) {
    _cameraArenaId = id;
    camera.activeArenaId = id;
  }
}

export function getCameraArenaId() {
  return camera.activeArenaId || _cameraArenaId || 'ARENA_1';
}

/**
 * Stan globalny kamery
 */
export const camera = {
  x: CFG_ARENA_LEFT,
  y: 0,
  targetX: CFG_ARENA_LEFT,
  targetY: 0,
  zoom: initialDefaultZoom,
  targetZoom: initialDefaultZoom,
  minZoom: initialDefaultZoom,
  lerpSpeed: 0.08,
  smoothSpeed: 0.08,
  smoothPos: 0.08,
  smoothZoom: 0.04,
  viewWidth: 1920,
  viewHeight: 1080,
  shakeIntensity: 0,
  shakeDecay: 0.82,
  shakeX: 0,
  shakeY: 0,
  activeArenaId: 'ARENA_1',
  mouseScreenX: null,
  mouseScreenY: null,
  aimLeadX: 0,
  aimLeadY: 0,
  aimZoomFactor: 0,
  aimZoomHoldFrames: 0
};

if (typeof window !== 'undefined') {
  window.camera = camera;
}

export const mouseScreenPos = {
  x: typeof window !== 'undefined' ? window.innerWidth * 0.5 : 960,
  y: typeof window !== 'undefined' ? window.innerHeight * 0.5 : 540,
  active: false
};

export function setCameraMouseScreenPos(x, y) {
  if (typeof x === 'number' && typeof y === 'number') {
    camera.mouseScreenX = x;
    camera.mouseScreenY = y;
    mouseScreenPos.x = x;
    mouseScreenPos.y = y;
    mouseScreenPos.active = true;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', (e) => {
    mouseScreenPos.x = e.clientX;
    mouseScreenPos.y = e.clientY;
    mouseScreenPos.active = true;
    camera.mouseScreenX = e.clientX;
    camera.mouseScreenY = e.clientY;
  }, { passive: true });
}

export let devZoomLevel = null; // null = dynamiczny zoom gry, liczba = stały zoom DEV
export function setDevZoom(val) {
  devZoomLevel = val !== null ? Math.max(0.35, Math.min(3.5, val)) : null;
}
if (typeof window !== 'undefined') {
  window.setDevZoom = setDevZoom;
}

export function triggerScreenShake(intensity) {
  if (typeof window !== 'undefined' && window.uiManager && window.uiManager.settings && window.uiManager.settings.screenShake === false) return;
  if (typeof window !== 'undefined' && (window.GAME_STATE?.current === 'MENU' || window.gameState === 'MENU' || window.isMenuShowcase)) return;
  camera.shakeIntensity = Math.min(26, Math.max(camera.shakeIntensity, intensity));
}

export function shakeImpulse(intensity = 14, duration = 0.15) {
  if (typeof window !== 'undefined' && window.uiManager && window.uiManager.settings && window.uiManager.settings.screenShake === false) return;
  if (typeof window !== 'undefined' && (window.GAME_STATE?.current === 'MENU' || window.gameState === 'MENU' || window.isMenuShowcase)) return;
  camera.shakeIntensity = Math.min(32, Math.max(camera.shakeIntensity || 0, intensity));
  camera.shakeDecay = (typeof duration === 'number' && duration <= 0.25) ? 0.72 : 0.85;
}
camera.shakeImpulse = shakeImpulse;

Object.defineProperty(camera, 'shake', {
  get() { return this.shakeIntensity || 0; },
  set(val) {
    if (typeof window !== 'undefined' && (window.GAME_STATE?.current === 'MENU' || window.gameState === 'MENU' || window.isMenuShowcase)) {
      this.shakeIntensity = 0;
      this.shakeX = 0;
      this.shakeY = 0;
      return;
    }
    this.shakeIntensity = Math.min(32, Math.max(0, val));
  },
  configurable: true
});

let _cachedLogicalWidth = 0;
let _cachedLogicalHeight = 0;

export function updateCanvasDimensionsCache() {
  const c = getCameraCanvas();
  if (c && c.clientWidth > 0 && c.clientHeight > 0) {
    _cachedLogicalWidth = c.clientWidth;
    _cachedLogicalHeight = c.clientHeight;
    return;
  }
  const isTouchMobile = typeof window !== 'undefined' && window.innerWidth <= 1024 && (('ontouchstart' in window) || (navigator && navigator.maxTouchPoints > 0));
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio && isTouchMobile) ? Math.min(window.devicePixelRatio, 2.0) : 1.0;
  if (c && c.width && c.height && dpr > 0) {
    _cachedLogicalWidth = c.width / dpr;
    _cachedLogicalHeight = c.height / dpr;
    return;
  }
  _cachedLogicalWidth = (typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1920);
  _cachedLogicalHeight = (typeof window !== 'undefined' && window.innerHeight ? window.innerHeight : 1080);
}

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    _cachedIsMobile = null;
    isMobileDevice();
    updateCanvasDimensionsCache();
  }, { passive: true });
}

export function getCanvasLogicalWidth() {
  if (_cachedLogicalWidth <= 0) updateCanvasDimensionsCache();
  return _cachedLogicalWidth;
}

export function getCanvasLogicalHeight() {
  if (_cachedLogicalHeight <= 0) updateCanvasDimensionsCache();
  return _cachedLogicalHeight;
}

/**
 * 1. Pobranie dokładnych współrzędnych granic areny (World Bounds)
 */
export function getArenaBounds() {
  const profile = getArenaCameraProfile(getCameraArenaId());
  return {
    minX: profile.minX,
    maxX: profile.maxX,
    arenaWidth: profile.width,
    minY: profile.minY,
    maxY: profile.maxY
  };
}

export const world = {
  get bounds() {
    return getArenaBounds();
  },
  initialState: null,
  resetArena() {
    if (typeof this._resetArenaFn === 'function') {
      this._resetArenaFn();
    }
  },
  saveInitialState() {
    if (typeof this._saveSnapshotFn === 'function') {
      this._saveSnapshotFn();
    }
  }
};

function clampHorizontalCamera(cam, arenaLeft, arenaRight, viewWidth, isVerticalTower) {
  const arenaWidth = arenaRight - arenaLeft;
  if (viewWidth < arenaWidth && !isVerticalTower) {
    cam.x = Math.max(arenaLeft, Math.min(cam.x, arenaRight - viewWidth));
    cam.targetX = Math.max(arenaLeft, Math.min(cam.targetX, arenaRight - viewWidth));
  } else if (viewWidth >= arenaWidth) {
    const centeredX = (arenaLeft + arenaRight - viewWidth) * 0.5;
    cam.x = centeredX;
    cam.targetX = centeredX;
  } else {
    cam.x = arenaLeft;
    cam.targetX = arenaLeft;
  }
}

/**
 * Twarde, natychmiastowe obcięcie współrzędnych kamery w granicach areny
 */
export function clampCamera(cam = camera) {
  const profile = getArenaCameraProfile(getCameraArenaId());
  const canvasWidth = getCanvasLogicalWidth();
  const canvasHeight = getCanvasLogicalHeight();
  const isMobile = isMobileDevice();
  const minZoom = computeArenaMinZoom(profile, canvasWidth, canvasHeight, isMobile);

  if (cam.zoom < minZoom) cam.zoom = minZoom;
  if (cam.targetZoom < minZoom) cam.targetZoom = minZoom;
  cam.minZoom = minZoom;

  const viewWidth = canvasWidth / cam.zoom;
  const viewHeight = canvasHeight / cam.zoom;
  cam.viewWidth = viewWidth;
  cam.viewHeight = viewHeight;

  clampHorizontalCamera(cam, profile.minX, profile.maxX, viewWidth, profile.isVerticalTower);

  const groundFloor = getCameraGroundY();
  const a5FloorY = (arena5State && typeof arena5State.currentFloorY === 'number')
    ? arena5State.currentFloorY
    : (typeof window !== 'undefined' ? (window.arena5State?.currentFloorY ?? 1200) : 1200);
  const a5MinCam = (arena5State && typeof arena5State.minCameraY === 'number')
    ? arena5State.minCameraY
    : (typeof window !== 'undefined' ? window.arena5State?.minCameraY : null);

  let minCamY = profile.getMinCamY(viewHeight, groundFloor);
  const maxCamY = (profile.isVerticalTower && a5MinCam !== null && typeof a5MinCam === 'number')
    ? a5MinCam
    : profile.getMaxCamY(viewHeight, groundFloor, a5FloorY);
  if (maxCamY < minCamY) minCamY = maxCamY;

  cam.y = Math.max(minCamY, Math.min(cam.y, maxCamY));
  cam.targetY = Math.max(minCamY, Math.min(cam.targetY, maxCamY));
}

function computeSmallScreenFactor(canvasWidth, canvasHeight, baseZoom, isMobile) {
  if (isMobile) {
    return canvasHeight <= 650 ? 1.0 : 0.75;
  }
  const baseViewW = canvasWidth / Math.max(0.25, baseZoom);
  const baseViewH = canvasHeight / Math.max(0.25, baseZoom);
  const wShort = Math.max(0, Math.min(1, (2400 - baseViewW) / 800));
  const hShort = Math.max(0, Math.min(1, (1320 - baseViewH) / 500));
  const physSmall = Math.max(0, Math.min(1, (1360 - canvasWidth) / 460));
  return Math.max(wShort, hShort, physSmall);
}

function getScreenNormalizedMouse(canvasWidth, canvasHeight) {
  let rawMouseX = (typeof camera.mouseScreenX === 'number') ? camera.mouseScreenX : mouseScreenPos.x;
  let rawMouseY = (typeof camera.mouseScreenY === 'number') ? camera.mouseScreenY : mouseScreenPos.y;

  const c = getCameraCanvas();
  if (c && typeof c.getBoundingClientRect === 'function') {
    const rect = c.getBoundingClientRect();
    rawMouseX -= rect.left;
    rawMouseY -= rect.top;
  }

  const screenCenterX = canvasWidth * 0.5;
  const screenCenterY = canvasHeight * 0.5;
  if (screenCenterX <= 0 || screenCenterY <= 0) {
    return { filteredX: 0, filteredY: 0 };
  }

  const normX = Math.max(-1, Math.min(1, (rawMouseX - screenCenterX) / screenCenterX));
  const normY = Math.max(-1, Math.min(1, (rawMouseY - screenCenterY) / screenCenterY));
  const deadzone = 0.08;
  const filteredX = Math.abs(normX) > deadzone ? (normX - Math.sign(normX) * deadzone) / (1 - deadzone) : 0;
  const filteredY = Math.abs(normY) > deadzone ? (normY - Math.sign(normY) * deadzone) / (1 - deadzone) : 0;
  return { filteredX, filteredY };
}

/**
 * Główna funkcja aktualizacji kamery z zachowaniem rygorystycznego clampingu
 */
export function updateCamera(player, ball, options = {}) {
  if (typeof window !== 'undefined' && (window.GAME_STATE?.current === 'MENU' || window.gameState === 'MENU')) {
    updateMenuCamera();
    return;
  }

  const profile = getArenaCameraProfile(getCameraArenaId());
  const ARENA_LEFT = profile.minX;
  const ARENA_RIGHT = profile.maxX;
  const arenaWidth = profile.width;

  const canvasWidth = getCanvasLogicalWidth();
  const canvasHeight = getCanvasLogicalHeight();
  const isMobile = isMobileDevice();
  const minZoom = computeArenaMinZoom(profile, canvasWidth, canvasHeight, isMobile);

  const curWeapon = player?.currentWeapon || null;
  const isSniperActive = !player?.isHolstered && (curWeapon?.id === 'SNIPER');
  const isNonThrownMelee = !player?.isHolstered && !!(curWeapon?.isMelee && curWeapon.id !== 'AXE');
  const disableAimLead = !!(options && options.disableAimLead);

  // Wyliczenie wysokości gracza nad głównym poziomem gruntu (Altitude & Smoothed Elevation Factor)
  const groundFloor = getCameraGroundY();
  const baseFloorY = profile.baseFloorY;
  const focusEntity = (typeof window !== 'undefined' && window._cameraFocusTarget) ? window._cameraFocusTarget : player;
  const target = focusEntity || ball;
  const fallbackY = profile.key === 'ARENA_2' ? 910 : (profile.key === 'ARENA_4' ? 1040 : groundFloor - 50);
  const rawTargetY = target ? (target.y !== undefined ? target.y : fallbackY) : fallbackY;
  const playerFootY = rawTargetY + (target && target.h ? target.h : 70);
  const altitude = Math.max(0, baseFloorY - playerFootY);

  const rawElevationFactor = Math.max(0, Math.min(1, (altitude - 140) / 560));
  if (typeof camera.elevationFactor !== 'number' || !camera._initialized) {
    camera.elevationFactor = rawElevationFactor;
  } else {
    camera.elevationFactor += (rawElevationFactor - camera.elevationFactor) * 0.075;
  }
  const elev = camera.elevationFactor;

  const optimalBaseZoom = calculateOptimalBaseZoom(canvasWidth, canvasHeight, isMobile, profile.key);
  const smallScreenFactor = computeSmallScreenFactor(canvasWidth, canvasHeight, optimalBaseZoom, isMobile);

  // Pomiar aktywności celowania (dotyk / pad / mysz) pod wyprzedzenie oraz lekkie oddalenie na małych ekranach
  const rs = (typeof window !== 'undefined' && window.rightStick) ? window.rightStick : null;
  const gp = (typeof window !== 'undefined' && window.gamepadState && window.gamepadState.connected) ? window.gamepadState : null;
  const hasActiveTouchStick = !!(rs && rs.active && typeof rs.power === 'number' && rs.power > 0.05);
  const hasActiveGamepadStick = !!(gp && gp.rightStick && gp.rightStick.magnitude > 0.18);
  const mouseMetrics = (!isMobile && !hasActiveGamepadStick) ? getScreenNormalizedMouse(canvasWidth, canvasHeight) : null;

  let rawAimZoom = 0;
  if (CONFIG.CAMERA_AIM_LEAD_ENABLED !== false && !disableAimLead && player && !player.isDead && !isNonThrownMelee && smallScreenFactor > 0) {
    if (hasActiveTouchStick) {
      rawAimZoom = Math.max(0, Math.min(1, (rs.power - 0.15) / 0.70));
    } else if (hasActiveGamepadStick) {
      rawAimZoom = Math.max(0, Math.min(1, (gp.rightStick.magnitude - 0.20) / 0.70));
    } else if (mouseMetrics) {
      const distNorm = Math.min(1, Math.hypot(mouseMetrics.filteredX, mouseMetrics.filteredY));
      if (player.isAiming || player.isShooting) {
        rawAimZoom = Math.max(0.55, distNorm);
      } else if (distNorm > 0.28) {
        rawAimZoom = Math.min(1, (distNorm - 0.28) / 0.62);
      }
    }
  }

  // Asymetryczne wygładzanie + krótkie podtrzymanie (eliminuje pompowanie kamery przy seriach strzałów)
  if (typeof camera.aimZoomFactor !== 'number' || !camera._initialized) {
    camera.aimZoomFactor = rawAimZoom;
    camera.aimZoomHoldFrames = rawAimZoom > 0.05 ? (CONFIG.CAMERA_AIM_ZOOM_HOLD_FRAMES || 24) : 0;
  } else if (rawAimZoom > 0.05) {
    camera.aimZoomHoldFrames = CONFIG.CAMERA_AIM_ZOOM_HOLD_FRAMES || 24;
    camera.aimZoomFactor += (rawAimZoom - camera.aimZoomFactor) * 0.09;
  } else if (camera.aimZoomHoldFrames > 0) {
    camera.aimZoomHoldFrames--;
  } else {
    camera.aimZoomFactor += (0 - camera.aimZoomFactor) * 0.035;
  }

  if (devZoomLevel !== null) {
    camera.targetZoom = Math.max(minZoom, devZoomLevel);
  } else if (profile.isVerticalTower) {
    camera.targetZoom = minZoom;
  } else if (killstreakState && killstreakState.mortarTargeting) {
    const tacticalOverviewMult = isMobile ? 0.74 : 0.80;
    camera.targetZoom = Math.max(minZoom, optimalBaseZoom * tacticalOverviewMult);
  } else {
    const maxAimOut = (typeof CONFIG.CAMERA_SMALL_SCREEN_AIM_ZOOM_OUT === 'number' ? CONFIG.CAMERA_SMALL_SCREEN_AIM_ZOOM_OUT : 0.15) * smallScreenFactor;
    const aimOut = camera.aimZoomFactor * maxAimOut;
    const elevOut = elev * (isMobile ? 0.25 : 0.10);
    const maxCombinedOut = isMobile ? 0.28 : 0.22;
    const combinedTacticalOut = Math.min(maxCombinedOut, elevOut + aimOut * (1.0 - elevOut * 0.55));
    const tacticalMult = 1.0 - combinedTacticalOut;

    let sniperMult = 1.0;
    if (isSniperActive) {
      if (isMobile) {
        sniperMult = (elev > 0.15 || camera.aimZoomFactor > 0.25) ? 0.94 : 1.0;
      } else {
        sniperMult = CONFIG.CAMERA_SNIPER_ZOOM_MULT || 0.88;
      }
    }

    const readabilityFloor = isMobile ? 0.35 : 0.38;
    const desiredZoom = optimalBaseZoom * tacticalMult * sniperMult;
    camera.targetZoom = Math.max(minZoom, Math.max(readabilityFloor, desiredZoom));
  }

  camera.zoom += (camera.targetZoom - camera.zoom) * (camera.smoothZoom || 0.04);
  if (camera.zoom < minZoom) {
    camera.zoom = minZoom;
  }
  camera.minZoom = minZoom;

  const viewWidth = canvasWidth / camera.zoom;
  const viewHeight = canvasHeight / camera.zoom;
  camera.viewWidth = viewWidth;
  camera.viewHeight = viewHeight;

  // Dynamiczne wyprzedzenie celowania (Soldat-style Aim Look-Ahead)
  let aimLeadX = 0;
  let aimLeadY = 0;

  if (CONFIG.CAMERA_AIM_LEAD_ENABLED !== false && !disableAimLead && player && !player.isDead) {
    if (hasActiveGamepadStick) {
      const rx = gp.rightStick.x || 0;
      const ry = gp.rightStick.y || 0;
      const mag = gp.rightStick.magnitude || 0;
      const ratioX = isSniperActive ? 0.24 : 0.18;
      const maxLeadX = Math.min(viewWidth * ratioX, (CONFIG.CAMERA_AIM_MOBILE_MAX_LEAD_X || 340) * (isSniperActive ? 1.35 : 1.0));
      const downwardRatio = 0.15 + (elev * 0.17);
      const downwardMaxPx = ((CONFIG.CAMERA_AIM_MOBILE_MAX_LEAD_Y || 140) + (elev * 190)) * (isSniperActive ? 1.25 : 1.0);
      const maxLeadY = ry < 0
        ? Math.min(viewHeight * 0.10, (CONFIG.CAMERA_AIM_MOBILE_MAX_LEAD_Y || 120))
        : Math.min(viewHeight * downwardRatio, downwardMaxPx);
      aimLeadX = rx * mag * maxLeadX;
      aimLeadY = ry * mag * maxLeadY;
    } else if (isMobile) {
      if (hasActiveTouchStick) {
        const mobileRatioX = isSniperActive ? 0.26 : 0.20;
        const maxLeadX = Math.min(viewWidth * mobileRatioX, (CONFIG.CAMERA_AIM_MOBILE_MAX_LEAD_X || 340) * (isSniperActive ? 1.35 : 1.0));
        const axisY = rs.axisY || 0;
        const downwardRatio = 0.15 + (elev * 0.19);
        const downwardMaxPx = ((CONFIG.CAMERA_AIM_MOBILE_MAX_LEAD_Y || 150) + (elev * 210)) * (isSniperActive ? 1.25 : 1.0);
        const maxLeadY = axisY < 0
          ? Math.min(viewHeight * 0.10, (CONFIG.CAMERA_AIM_MOBILE_MAX_LEAD_Y || 120))
          : Math.min(viewHeight * downwardRatio, downwardMaxPx);

        aimLeadX = (rs.axisX || 0) * rs.power * maxLeadX;
        aimLeadY = axisY * rs.power * maxLeadY;
      } else {
        const facingDir = (typeof player.facing === 'number') ? player.facing : 1;
        aimLeadX = facingDir * 40;
        aimLeadY = 0;
      }
    } else if (mouseMetrics) {
      const leadMult = isSniperActive ? (CONFIG.CAMERA_SNIPER_LEAD_MULT || 1.40) : 1.0;
      const maxLeadX = (CONFIG.CAMERA_AIM_MAX_LEAD_X || 180) * leadMult;
      const downwardRatioPC = 0.15 + (elev * 0.14);
      const downwardMaxPxPC = ((CONFIG.CAMERA_AIM_MAX_LEAD_Y || 135) + (elev * 160)) * leadMult;
      const maxLeadY = mouseMetrics.filteredY < 0
        ? Math.min(viewHeight * 0.10, (CONFIG.CAMERA_AIM_MAX_LEAD_Y || 95) * leadMult)
        : Math.min(viewHeight * downwardRatioPC, downwardMaxPxPC);

      aimLeadX = mouseMetrics.filteredX * maxLeadX;
      aimLeadY = mouseMetrics.filteredY * maxLeadY;
    }
  }

  camera.aimLeadX = aimLeadX;
  camera.aimLeadY = aimLeadY;

  const targetX = target ? (target.x + (target.w ? target.w / 2 : 0)) : (camera.x + viewWidth / 2);
  const targetVx = (target && typeof target.vx === 'number') ? target.vx : 0;

  const maxVelLead = 65;
  const rawVelLead = targetVx * (isMobile ? 3.5 : 4.5);
  const lookAhead = Math.max(-maxVelLead, Math.min(maxVelLead, rawVelLead));

  let targetCamX;
  if (killstreakState && killstreakState.mortarTargeting) {
    const focusX = (typeof killstreakState.mortarCameraX === 'number' && !isNaN(killstreakState.mortarCameraX))
      ? killstreakState.mortarCameraX
      : ((typeof killstreakState.mortarTargetX === 'number' && !isNaN(killstreakState.mortarTargetX)) ? killstreakState.mortarTargetX : (targetX || 600));
    targetCamX = focusX - (viewWidth / 2);
    if (viewWidth < arenaWidth) {
      targetCamX = Math.max(ARENA_LEFT, Math.min(targetCamX, ARENA_RIGHT - viewWidth));
    } else {
      targetCamX = (ARENA_LEFT + ARENA_RIGHT - viewWidth) * 0.5;
    }
  } else if (profile.isVerticalTower || viewWidth >= arenaWidth) {
    targetCamX = (viewWidth >= arenaWidth) ? (ARENA_LEFT + ARENA_RIGHT - viewWidth) * 0.5 : ARENA_LEFT;
  } else {
    targetCamX = (targetX + lookAhead + aimLeadX) - (viewWidth / 2);
    targetCamX = Math.max(ARENA_LEFT, Math.min(targetCamX, ARENA_RIGHT - viewWidth));
  }

  // Dynamiczna kotwica wysokościowa (Altitude-Based Vertical Framing)
  const targetY = rawTargetY;
  const elevDelta = isMobile ? profile.elevAnchorDeltaMobile : profile.elevAnchorDeltaPC;
  const verticalAnchor = 0.65 - (elev * elevDelta);
  let targetCamY = (targetY + aimLeadY) - (viewHeight * verticalAnchor);

  const a5FloorY = (arena5State && typeof arena5State.currentFloorY === 'number')
    ? arena5State.currentFloorY
    : (typeof window !== 'undefined' ? (window.arena5State?.currentFloorY ?? 1200) : 1200);

  if (profile.isVerticalTower) {
    const floorCamY = a5FloorY - viewHeight;
    const pCenterY = (player && !player.isDead) ? (player.y + (player.h ? player.h / 2 : 35)) : targetY;
    const playerTargetCamY = (pCenterY + aimLeadY) - (viewHeight * 0.55);
    targetCamY = Math.max(-100000, Math.min(floorCamY, playerTargetCamY));
  }

  let minCamY = profile.getMinCamY(viewHeight, groundFloor);
  const maxCamY = profile.getMaxCamY(viewHeight, groundFloor, a5FloorY);
  if (maxCamY < minCamY) minCamY = maxCamY;
  targetCamY = Math.max(minCamY, Math.min(targetCamY, maxCamY));

  if (killstreakState && killstreakState.mortarTargeting) {
    targetCamY = baseFloorY - (viewHeight * 0.70);
    targetCamY = Math.max(minCamY, Math.min(targetCamY, maxCamY));
  }

  // ZABEZPIECZENIE CELU KAMERY (Target Player Box)
  if (focusEntity && !focusEntity.isDead && (!killstreakState || !killstreakState.mortarTargeting)) {
    const pY = focusEntity.y + (focusEntity.h ? focusEntity.h / 2 : 35);
    const topMarginRatio = profile.isVerticalTower ? profile.safeMarginTopRatio : (profile.safeMarginTopRatio - (elev * 0.04));
    const safeMarginTop = Math.max(isMobile ? 55 : 68, viewHeight * topMarginRatio);
    const safeMarginBottom = Math.max(profile.safeMarginBottomMin, viewHeight * profile.safeMarginBottomRatio);

    targetCamY = Math.max(pY - viewHeight + safeMarginBottom, Math.min(targetCamY, pY - safeMarginTop));
    if (profile.isVerticalTower || viewWidth >= arenaWidth) {
      targetCamX = (viewWidth >= arenaWidth) ? (ARENA_LEFT + ARENA_RIGHT - viewWidth) * 0.5 : ARENA_LEFT;
    } else {
      targetCamX = Math.max(ARENA_LEFT, Math.min(targetCamX, ARENA_RIGHT - viewWidth));
    }
    targetCamY = Math.max(minCamY, Math.min(targetCamY, maxCamY));
  }

  camera.targetX = targetCamX;
  camera.targetY = targetCamY;

  // Obsługa Screen Shake
  if (camera.shakeIntensity > 0.1) {
    camera.shakeX = (Math.random() * 2 - 1) * camera.shakeIntensity;
    camera.shakeY = (Math.random() * 2 - 1) * camera.shakeIntensity;
    camera.shakeIntensity *= camera.shakeDecay;
  } else {
    camera.shakeIntensity = 0;
    camera.shakeX = 0;
    camera.shakeY = 0;
  }

  // Interpolacja pozycji (Lerp)
  const baseLerpSpeed = (killstreakState && killstreakState.mortarTargeting)
    ? 0.12
    : (CONFIG.CAMERA_SMOOTH_SPEED || camera.lerpSpeed || camera.smoothSpeed || 0.08);
  const lerpSpeed = (killstreakState && killstreakState.mortarTargeting)
    ? 0.12
    : (isMobile ? Math.min(baseLerpSpeed, 0.085) : baseLerpSpeed);

  if (!camera._initialized) {
    camera._initialized = true;
    camera.x = targetCamX;
    camera.y = targetCamY;
    camera.zoom = camera.targetZoom;
  } else {
    camera.x += (targetCamX - camera.x) * lerpSpeed;
    camera.y += (targetCamY - camera.y) * lerpSpeed;
  }

  // ŻELAZNA GWARANCJA: Gracz FIZYCZNIE ZAWSZE w kadrze (Hard Player Boundary)
  if (focusEntity && !focusEntity.isDead && (!killstreakState || !killstreakState.mortarTargeting)) {
    const pX = focusEntity.x + (focusEntity.w ? focusEntity.w / 2 : 12);
    const pY = focusEntity.y + (focusEntity.h ? focusEntity.h / 2 : 35);
    const hardPadX = Math.max(60, viewWidth * 0.10);
    const hardPadTop = Math.max(isMobile ? 50 : 60, viewHeight * 0.16);
    const hardPadBottom = Math.max(60, viewHeight * 0.12);

    if (profile.isVerticalTower) {
      camera.x = (viewWidth >= arenaWidth) ? (ARENA_LEFT + ARENA_RIGHT - viewWidth) * 0.5 : ARENA_LEFT;
      if (pY < camera.y + hardPadTop) {
        camera.y = pY - hardPadTop;
      } else if (pY > camera.y + viewHeight - hardPadBottom) {
        const floorCamY = a5FloorY - viewHeight;
        camera.y = Math.min(floorCamY, pY - viewHeight + hardPadBottom);
      }
    } else {
      if (pX < camera.x + hardPadX) {
        camera.x = pX - hardPadX;
      } else if (pX > camera.x + viewWidth - hardPadX) {
        camera.x = pX - viewWidth + hardPadX;
      }

      if (pY < camera.y + hardPadTop) {
        camera.y = pY - hardPadTop;
      } else if (pY > camera.y + viewHeight - hardPadBottom) {
        camera.y = pY - viewHeight + hardPadBottom;
      }
    }
  }

  if (_hasCustomCamUrl) {
    if (_cachedCamX !== null) camera.x = _cachedCamX;
    if (_cachedCamY !== null) camera.y = _cachedCamY;
  }

  // Końcowy clamping w granicach areny
  clampHorizontalCamera(camera, ARENA_LEFT, ARENA_RIGHT, viewWidth, profile.isVerticalTower);
  camera.y = Math.max(minCamY, Math.min(camera.y, maxCamY));
}

/**
 * 5. Zastosowanie transformacji w canvas (Strict View Matrix):
 */
export function applyCameraTransform(ctx, cam = camera) {
  ctx.save();
  ctx.scale(cam.zoom, cam.zoom);
  const sx = cam.shakeX || 0;
  const sy = cam.shakeY || 0;
  ctx.translate(-cam.x - sx, -cam.y - sy);
}

export function restoreCameraTransform(ctx) {
  ctx.restore();
}

export function worldToScreen(worldX, worldY, cam = camera) {
  const sx = cam.shakeX || 0;
  const sy = cam.shakeY || 0;
  return {
    x: (worldX - cam.x - sx) * cam.zoom,
    y: (worldY - cam.y - sy) * cam.zoom
  };
}

export function screenToWorld(screenX, screenY, cam = camera) {
  const sx = cam.shakeX || 0;
  const sy = cam.shakeY || 0;
  return {
    x: cam.x + sx + screenX / cam.zoom,
    y: cam.y + sy + screenY / cam.zoom
  };
}

/**
 * Oblicza spójny zoom dla statycznego kadru Live Menu Showcase dopasowany do areny i proporcji ekranu.
 */
export function calculateMenuShowcaseZoom(canvasWidth, canvasHeight, arenaId, showcaseConfig = null) {
  const w = canvasWidth || getCanvasLogicalWidth();
  const h = canvasHeight || getCanvasLogicalHeight();
  const isMobile = isMobileDevice();
  const profile = getArenaCameraProfile(arenaId);

  const targetW = isMobile ? 1680 : (profile.isVerticalTower ? 1600 : 2100);
  const targetH = isMobile ? 840 : (profile.isVerticalTower ? 1050 : 1180);
  const preferredZoom = (showcaseConfig && typeof showcaseConfig.zoom === 'number') ? showcaseConfig.zoom : 0.86;
  const aspectZoom = Math.min(w / targetW, h / targetH);

  // Na 1080p zachowuje filmowy zoom (~0.86), na mniejszych/szerszych ekranach proporcjonalnie dopasowuje kadr
  const blendedZoom = isMobile
    ? aspectZoom
    : Math.min(preferredZoom * (h / 1080), aspectZoom * 1.06);

  const minBoundZoom = profile.isVerticalTower
    ? calculateArena5Zoom(w, h, isMobile)
    : computeArenaMinZoom(profile, w, h, isMobile);

  return Math.round(Math.max(minBoundZoom, Math.min(1.8, Math.max(0.42, blendedZoom))) * 1000) / 1000;
}

/**
 * Sztywna, statyczna kamera zablokowana na centrum aktywnej areny w menu głównym.
 */
export function updateMenuCamera() {
  const canvasWidth = getCanvasLogicalWidth();
  const canvasHeight = getCanvasLogicalHeight();
  const isMobile = isMobileDevice();
  const profile = getArenaCameraProfile(getCameraArenaId());
  const menuTarget = profile.getMenuTarget(isMobile);

  const zoomByHeight = canvasHeight / menuTarget.targetWorldHeight;
  const zoomByWidth = canvasWidth / menuTarget.targetWorldWidth;
  let zoom = Math.min(zoomByHeight, zoomByWidth);

  const minZoomForArenaBounds = computeArenaMinZoom(profile, canvasWidth, canvasHeight, isMobile);
  zoom = Math.max(minZoomForArenaBounds, Math.min(1.8, zoom));
  zoom = Math.round(zoom * 1000) / 1000;

  camera.zoom = zoom;
  camera.targetZoom = zoom;
  camera.minZoom = minZoomForArenaBounds;

  const viewWidth = canvasWidth / zoom;
  const viewHeight = canvasHeight / zoom;
  camera.viewWidth = viewWidth;
  camera.viewHeight = viewHeight;

  camera.x = menuTarget.centerX - viewWidth * 0.5;
  camera.y = menuTarget.targetBottomY - viewHeight;

  clampHorizontalCamera(camera, profile.minX, profile.maxX, viewWidth, profile.isVerticalTower);

  const groundFloor = getCameraGroundY();
  let minCamY = profile.getMinCamY(viewHeight, groundFloor);
  const maxCamY = profile.getMaxCamY(viewHeight, groundFloor, 1200);
  if (maxCamY < minCamY) minCamY = maxCamY;
  camera.y = Math.max(minCamY, Math.min(camera.y, maxCamY));

  camera.targetX = camera.x;
  camera.targetY = camera.y;
  camera.shakeIntensity = 0;
  camera.shakeDecay = 0;
  camera.shakeX = 0;
  camera.shakeY = 0;
}
