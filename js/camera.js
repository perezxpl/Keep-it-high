// =========================================================================
// CAMERA.JS - SYSTEM ZARZĄDZANIA KAMERĄ I STRICT CAMERA CLAMPING
// Warstwa 1: Środowisko fizyczne / Silnik kamery
// =========================================================================

import { CONFIG, ARENA_LEFT as CFG_ARENA_LEFT, ARENA_RIGHT as CFG_ARENA_RIGHT, isTouchDevice } from './config.js';

let _cameraCanvas = null;
let _cameraGroundY = null;
let _cameraArenaId = 'ARENA_1';

export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return !!(
    isTouchDevice ||
    ('ontouchstart' in window) ||
    (navigator && (navigator.maxTouchPoints > 0)) ||
    (window.innerWidth <= 850)
  );
}

const initialMobile = (typeof window !== 'undefined' && (
  isTouchDevice ||
  ('ontouchstart' in window) ||
  (navigator && navigator.maxTouchPoints > 0) ||
  (window.innerWidth <= 850)
));
const initialDefaultZoom = initialMobile ? 0.35 : 0.60;

export function setCameraCanvas(c) {
  _cameraCanvas = c;
}

export function getCameraCanvas() {
  if (_cameraCanvas) return _cameraCanvas;
  if (typeof document !== 'undefined') {
    return document.getElementById('gameCanvas') || document.querySelector('canvas');
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
  shakeDecay: 0.88,
  shakeX: 0,
  shakeY: 0,
  activeArenaId: 'ARENA_1',
  mouseScreenX: null,
  mouseScreenY: null,
  aimLeadX: 0,
  aimLeadY: 0
};

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
  devZoomLevel = val !== null ? Math.max(0.35, Math.min(2.5, val)) : null;
}

export function triggerScreenShake(intensity) {
  camera.shakeIntensity = Math.min(26, Math.max(camera.shakeIntensity, intensity));
}

export function shakeImpulse(intensity = 14, duration = 0.15) {
  camera.shakeIntensity = Math.min(32, Math.max(camera.shakeIntensity || 0, intensity));
  camera.shakeDecay = (typeof duration === 'number' && duration <= 0.25) ? 0.72 : 0.85;
}
camera.shakeImpulse = shakeImpulse;

Object.defineProperty(camera, 'shake', {
  get() { return this.shakeIntensity || 0; },
  set(val) {
    this.shakeIntensity = Math.min(32, Math.max(0, val));
  },
  configurable: true
});

/**
 * Logiczna szerokość canvasa w przestrzeni CSS (z uwzględnieniem DPR)
 */
export function getCanvasLogicalWidth() {
  const c = getCameraCanvas();
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? Math.min(window.devicePixelRatio, 2) : 1;
  if (c && c.width && dpr > 0) {
    return c.width / dpr;
  }
  return (typeof window !== 'undefined' ? window.innerWidth : 1920);
}

/**
 * Logiczna wysokość canvasa w przestrzeni CSS (z uwzględnieniem DPR)
 */
export function getCanvasLogicalHeight() {
  const c = getCameraCanvas();
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? Math.min(window.devicePixelRatio, 2) : 1;
  if (c && c.height && dpr > 0) {
    return c.height / dpr;
  }
  return (typeof window !== 'undefined' ? window.innerHeight : 1080);
}

/**
 * 1. Pobranie dokładnych współrzędnych granic areny (World Bounds)
 */
export function getArenaBounds() {
  const arenaId = getCameraArenaId();
  const isArena3 = (arenaId === 'ARENA_3' || arenaId === 'ARENA_FOUNDRY' || arenaId === 'arena-3');
  const isArena2 = (arenaId === 'ARENA_2' || arenaId === 'ARENA_2_PANDORA' || arenaId === 'arena-2' || arenaId === 'ARENA_2_SECTOR_X');
  const minX = isArena3 ? 0 : (isArena2 ? 0 : CFG_ARENA_LEFT);
  const maxX = isArena3 ? 4400 : (isArena2 ? 3600 : CFG_ARENA_RIGHT);
  const groundFloor = getCameraGroundY();

  return {
    minX,
    maxX,
    arenaWidth: maxX - minX,
    minY: (isArena3 || isArena2) ? 0 : (groundFloor - 3000),
    maxY: isArena3 ? 1400 : (isArena2 ? 1400 : groundFloor)
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

/**
 * Twarde, natychmiastowe obcięcie współrzędnych kamery w granicach areny
 */
export function clampCamera(cam = camera) {
  const bounds = (typeof world !== 'undefined' && world && world.bounds) ? world.bounds : getArenaBounds();
  const ARENA_LEFT = (bounds && typeof bounds.minX === 'number') ? bounds.minX : CFG_ARENA_LEFT;
  const ARENA_RIGHT = (bounds && typeof bounds.maxX === 'number') ? bounds.maxX : CFG_ARENA_RIGHT;
  const arenaWidth = ARENA_RIGHT - ARENA_LEFT;

  const canvasWidth = getCanvasLogicalWidth();
  const canvasHeight = getCanvasLogicalHeight();
  const minZoom = canvasWidth / arenaWidth;

  if (cam.zoom < minZoom) cam.zoom = minZoom;
  if (cam.targetZoom < minZoom) cam.targetZoom = minZoom;

  const viewWidth = canvasWidth / cam.zoom;
  const viewHeight = canvasHeight / cam.zoom;
  cam.viewWidth = viewWidth;
  cam.viewHeight = viewHeight;

  if (viewWidth < arenaWidth) {
    cam.x = Math.max(ARENA_LEFT, Math.min(cam.x, ARENA_RIGHT - viewWidth));
    cam.targetX = Math.max(ARENA_LEFT, Math.min(cam.targetX, ARENA_RIGHT - viewWidth));
  } else {
    cam.x = ARENA_LEFT;
    cam.targetX = ARENA_LEFT;
  }

  const arenaId = getCameraArenaId();
  const isArena3 = (arenaId === 'ARENA_3' || arenaId === 'ARENA_FOUNDRY' || arenaId === 'arena-3');
  const isArena2 = (arenaId === 'ARENA_2' || arenaId === 'ARENA_2_PANDORA' || arenaId === 'arena-2' || arenaId === 'ARENA_2_SECTOR_X');
  const groundFloor = getCameraGroundY();
  const minCamY = (isArena3 || isArena2) ? 0 : (groundFloor - 3000);
  const maxCamY = (isArena3 || isArena2) ? Math.max(0, 1400 - viewHeight) : (groundFloor - (viewHeight * 0.72));

  cam.y = Math.max(minCamY, Math.min(cam.y, maxCamY));
  cam.targetY = Math.max(minCamY, Math.min(cam.targetY, maxCamY));
}

/**
 * Główna funkcja aktualizacji kamery z zachowaniem rygorystycznego clampingu
 */
export function updateCamera(player, ball, options = {}) {
  // 1. Dokładne współrzędne pionowych granic areny:
  const bounds = (typeof world !== 'undefined' && world && world.bounds) ? world.bounds : getArenaBounds();
  const ARENA_LEFT = (bounds && typeof bounds.minX === 'number') ? bounds.minX : CFG_ARENA_LEFT;
  const ARENA_RIGHT = (bounds && typeof bounds.maxX === 'number') ? bounds.maxX : CFG_ARENA_RIGHT;
  const arenaWidth = ARENA_RIGHT - ARENA_LEFT;

  // 2. Blokada zoomu (kamera nie może widzieć więcej niż szerokość areny):
  const canvasWidth = getCanvasLogicalWidth();
  const canvasHeight = getCanvasLogicalHeight();
  const minZoom = canvasWidth / arenaWidth;
  const arenaId = getCameraArenaId();
  const isArena3 = (arenaId === 'ARENA_3' || arenaId === 'ARENA_FOUNDRY' || arenaId === 'arena-3');
  const isArena2 = (arenaId === 'ARENA_2' || arenaId === 'ARENA_2_PANDORA' || arenaId === 'arena-2');
  const isMobile = isMobileDevice();

  const isSniperActive = !player?.isHolstered && (player?.currentWeapon?.id === 'SNIPER');

  if (devZoomLevel !== null) {
    camera.targetZoom = Math.max(minZoom, devZoomLevel);
  } else {
    // Domyślny zoom gry gwarantujący płynne i optymalne pole widzenia
    // Na telefonach: maksymalne oddalenie kamery według limitu DEV (0.35) jako wartość domyślna
    let defaultGameZoom = isMobile
      ? Math.max(0.35, minZoom)
      : (isArena3 ? Math.max(0.48, minZoom) : (isArena2 ? Math.max(0.55, minZoom) : Math.max(0.60, minZoom)));

    // Tryb snajperski na PC: lekkie oddalenie pola widzenia w stylu Soldat (taktyczny przegląd areny)
    if (isSniperActive && !isMobile) {
      const sniperZoomMult = CONFIG.CAMERA_SNIPER_ZOOM_MULT || 0.88;
      defaultGameZoom = Math.max(minZoom, defaultGameZoom * sniperZoomMult);
    }

    camera.targetZoom = defaultGameZoom;
  }

  camera.zoom += (camera.targetZoom - camera.zoom) * (camera.smoothZoom || 0.04);

  if (camera.zoom < minZoom) {
    camera.zoom = minZoom;
  }
  camera.minZoom = minZoom;

  // 3. Twarde ograniczenie pozycji X (Strict Clamping):
  const viewWidth = canvasWidth / camera.zoom;
  const viewHeight = canvasHeight / camera.zoom;
  camera.viewWidth = viewWidth;
  camera.viewHeight = viewHeight;

  // Dynamiczne wyprzedzenie celowania (Soldat-style Aim Look-Ahead)
  let aimLeadX = 0;
  let aimLeadY = 0;
  const disableAimLead = !!(options && options.disableAimLead);

  if (CONFIG.CAMERA_AIM_LEAD_ENABLED !== false && !disableAimLead && player && !player.isDead) {
    if (isMobile) {
      // --- TRYB MOBILNY (Dotyk / Wirtualny Prawy Drążek) ---
      const rs = (typeof window !== 'undefined' && window.rightStick) ? window.rightStick : null;
      if (rs && rs.active && typeof rs.power === 'number' && rs.power > 0.05) {
        // Dynamiczny zasięg w proporcji do szerokości/wysokości ekranu na telefonie:
        // Przy mocnym wychyleniu drążka postać przesuwa się w stronę krawędzi ekranu
        const mobileLeadRatioX = isSniperActive ? 0.44 : 0.35;
        const mobileLeadRatioY = isSniperActive ? 0.32 : 0.25;
        const maxLeadX = Math.max(CONFIG.CAMERA_AIM_MOBILE_MAX_LEAD_X || 650, viewWidth * mobileLeadRatioX);
        const maxLeadY = Math.max(CONFIG.CAMERA_AIM_MOBILE_MAX_LEAD_Y || 360, viewHeight * mobileLeadRatioY);
        aimLeadX = (rs.axisX || 0) * rs.power * maxLeadX;
        aimLeadY = (rs.axisY || 0) * rs.power * maxLeadY;
      } else {
        // Gdy prawy drążek nie jest aktywnie wychylony: wyprzedzenie w stronę zwrotu postaci
        const facingDir = (typeof player.facing === 'number') ? player.facing : 1;
        aimLeadX = facingDir * 80;
        aimLeadY = 0;
      }
    } else {
      // --- TRYB PC (Mysz / Celownik ekranowy) ---
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

      if (screenCenterX > 0 && screenCenterY > 0) {
        const normX = Math.max(-1, Math.min(1, (rawMouseX - screenCenterX) / screenCenterX));
        const normY = Math.max(-1, Math.min(1, (rawMouseY - screenCenterY) / screenCenterY));

        // Martwa strefa (deadzone 8%), aby drobne ruchy w centrum ekranu nie powodowały drżenia kadru
        const deadzone = 0.08;
        const filteredX = Math.abs(normX) > deadzone ? (normX - Math.sign(normX) * deadzone) / (1 - deadzone) : 0;
        const filteredY = Math.abs(normY) > deadzone ? (normY - Math.sign(normY) * deadzone) / (1 - deadzone) : 0;

        const leadMult = isSniperActive ? (CONFIG.CAMERA_SNIPER_LEAD_MULT || 1.85) : 1.0;
        const maxLeadX = (CONFIG.CAMERA_AIM_MAX_LEAD_X || 240) * leadMult;
        const maxLeadY = (CONFIG.CAMERA_AIM_MAX_LEAD_Y || 140) * leadMult;

        aimLeadX = filteredX * maxLeadX;
        aimLeadY = filteredY * maxLeadY;
      }
    }
  }

  camera.aimLeadX = aimLeadX;
  camera.aimLeadY = aimLeadY;

  const target = player || ball;
  const targetX = target ? (target.x + (target.w ? target.w / 2 : 0)) : (camera.x + viewWidth / 2);
  const targetVx = (target && typeof target.vx === 'number') ? target.vx : 0;
  const lookAhead = targetVx * (isMobile ? 4.5 : 5.5);

  let targetCamX;
  if (viewWidth < arenaWidth) {
    targetCamX = (targetX + lookAhead + aimLeadX) - (viewWidth / 2);
    targetCamX = Math.max(ARENA_LEFT, Math.min(targetCamX, ARENA_RIGHT - viewWidth));
  } else {
    targetCamX = ARENA_LEFT;
  }

  // Ograniczenie pionowe (Y): podłoga i podziemne bunkry
  const groundFloor = getCameraGroundY();
  const targetY = target ? (target.y !== undefined ? target.y : (isArena2 ? 910 : groundFloor - 50)) : (isArena2 ? 910 : groundFloor - 50);
  let targetCamY = (targetY + aimLeadY) - (viewHeight * 0.65);

  const minCamY = (isArena3 || isArena2) ? 0 : (groundFloor - 3000);
  const subterraneanBottom = isArena3 ? 1400 : (isArena2 ? 2000 : groundFloor);
  const maxCamY = isArena3 ? Math.max(0, 1400 - viewHeight) : (isArena2 ? Math.max(0, 2000 - viewHeight) : (subterraneanBottom - (viewHeight * 0.72)));
  targetCamY = Math.max(minCamY, Math.min(targetCamY, maxCamY));

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

  // 4. Wyeliminowanie overshootingu przy wygładzaniu (Lerp):
  const baseLerpSpeed = CONFIG.CAMERA_SMOOTH_SPEED || camera.lerpSpeed || camera.smoothSpeed || 0.08;
  const lerpSpeed = isMobile ? Math.min(baseLerpSpeed, 0.075) : baseLerpSpeed;

  if (!camera._initialized) {
    camera._initialized = true;
    camera.x = targetCamX;
    camera.y = targetCamY;
    camera.zoom = camera.targetZoom;
  } else {
    camera.x += (targetCamX - camera.x) * lerpSpeed + camera.shakeX;
    camera.y += (targetCamY - camera.y) * lerpSpeed + camera.shakeY;
  }

  // Opcjonalne ręczne wymuszenie pozycji kamery w parametrach URL (?camX=...&camY=...)
  if (typeof window !== 'undefined' && window.location) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('camX')) camera.x = Number(urlParams.get('camX'));
    if (urlParams.has('camY')) camera.y = Number(urlParams.get('camY'));
  }

  // Ograniczenie wykonaj ZAWSZE na samym końcu, po wyliczeniu wygładzenia:
  if (viewWidth < arenaWidth) {
    camera.x = Math.max(ARENA_LEFT, Math.min(camera.x, ARENA_RIGHT - viewWidth));
  } else {
    camera.x = ARENA_LEFT;
  }
  camera.y = Math.max(minCamY, Math.min(camera.y, maxCamY));
}

/**
 * 5. Zastosowanie transformacji w canvas (Strict View Matrix):
 */
export function applyCameraTransform(ctx, cam = camera) {
  ctx.save();
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-cam.x, -cam.y);
}

export function restoreCameraTransform(ctx) {
  ctx.restore();
}

/**
 * Konwersja współrzędnych świata na piksele ekranu
 */
export function worldToScreen(worldX, worldY, cam = camera) {
  return {
    x: (worldX - cam.x) * cam.zoom,
    y: (worldY - cam.y) * cam.zoom
  };
}

/**
 * Konwersja pikseli ekranu na współrzędne świata
 */
export function screenToWorld(screenX, screenY, cam = camera) {
  return {
    x: cam.x + screenX / cam.zoom,
    y: cam.y + screenY / cam.zoom
  };
}
