// =============================================================================
// JS/KILLSTREAKS/DRONETRANSPORTS.JS - SYSTEM LOTÓW 2.5D Z OKRĘTU (ARENA 3)
// Obsługuje przylot z dalekiego pokładu (od małego piksela 0.09 -> 1.00) i odlot
// z powrotem na okręt dla: Zrzutów Zaopatrzenia, Wieżyczek oraz Drona Bojowego.
// =============================================================================

import { camera as globalCamera } from '../camera.js';
import { ARENA3_SHIP_WORLD_X } from './mortarBallistics.js';
import { drawDroneBody } from './droneModel.js';

export const ARENA3_DRONE_SCALE_FAR = 0.09;
export const DRONE_LAYER_CROSSOVER_SCALE = 0.60;

export const activeDroneTransports = [];

const _warshipHelipadAnchor = {
  screenX: 0,
  screenY: 0,
  shipScale: 1,
  valid: false
};

export function isArena3ActiveForDrones() {
  const aid = (globalCamera && globalCamera.activeArenaId)
    || (typeof window !== 'undefined' ? window.activeArenaId : null);
  return (aid === 'ARENA_3' || aid === 'arena-3' || aid === 'ARENA_FOUNDRY');
}

/**
 * Aktualizuje dokładną pozycję lądowiska na rufie okrętu z getArena3WarshipLayout
 */
export function setWarshipHelipadScreenAnchor(screenX, screenY, shipScale = 1) {
  if (typeof screenX === 'number' && !isNaN(screenX) && typeof screenY === 'number' && !isNaN(screenY)) {
    _warshipHelipadAnchor.screenX = screenX;
    _warshipHelipadAnchor.screenY = screenY;
    _warshipHelipadAnchor.shipScale = shipScale || 1;
    _warshipHelipadAnchor.valid = true;
  }
}

/**
 * Zwraca współrzędne lądowiska okrętu przeliczone na aktualną przestrzeń świata gry
 */
export function getWarshipHelipadWorldPos(camera = null) {
  const cam = camera || globalCamera || (typeof window !== 'undefined' ? window.camera : null);
  const camX = cam ? (cam.x || 0) : 0;
  const camY = cam ? (cam.y || 0) : 0;
  const camZoom = (cam && cam.zoom) ? cam.zoom : 0.75;

  if (_warshipHelipadAnchor.valid) {
    return {
      x: camX + _warshipHelipadAnchor.screenX / camZoom,
      y: camY + _warshipHelipadAnchor.screenY / camZoom,
      shipScale: _warshipHelipadAnchor.shipScale
    };
  }

  // Fallback geometryczny przed pierwszą klatką rysowania
  const viewW = (cam && typeof cam.viewWidth === 'number' && cam.viewWidth > 0)
    ? cam.viewWidth
    : (1920 / Math.max(0.25, camZoom));
  const viewH = (cam && typeof cam.viewHeight === 'number' && cam.viewHeight > 0)
    ? cam.viewHeight
    : (1080 / Math.max(0.25, camZoom));
  const viewCenterX = camX + viewW * 0.5;
  const shipWorldX = viewCenterX - ((viewCenterX - ARENA3_SHIP_WORLD_X) * 0.12) / Math.max(0.35, camZoom);
  const shipWorldY = camY + viewH * 0.55;
  return {
    x: shipWorldX - 85 / Math.max(0.35, camZoom),
    y: shipWorldY,
    shipScale: 1
  };
}

export function resetDroneTransports() {
  activeDroneTransports.length = 0;
  _warshipHelipadAnchor.valid = false;
}

/**
 * Oblicza próbkę pozycji i skali 2.5D między pokładem okrętu a punktem na arenie
 */
export function computeWarshipFlightSample(padPos, targetX, targetY, prog, arcLift = 135, isReturn = false) {
  const p = Math.max(0, Math.min(1, prog));
  // Krzywa głębi Z: wolno i drobno na dalekim okręcie, coraz szybciej bliżej pierwszego planu
  const s = isReturn
    ? (1 - (0.22 * p + 0.78 * p * p * p))
    : (0.22 * p + 0.78 * p * p * p);

  const x = padPos.x + (targetX - padPos.x) * s;
  const lift = Math.sin(s * Math.PI) * arcLift;
  const y = padPos.y + (targetY - padPos.y) * s - lift;
  const scale = ARENA3_DRONE_SCALE_FAR + (1.0 - ARENA3_DRONE_SCALE_FAR) * s;

  const dxDir = isReturn ? (padPos.x - targetX) : (targetX - padPos.x);
  const facing = Math.abs(dxDir) > 4 ? (dxDir >= 0 ? 1 : -1) : 1;
  const speedRatio = isReturn ? -(0.22 + 2.34 * p * p) : (0.22 + 2.34 * p * p);
  const rawTilt = facing * Math.min(0.32, Math.abs(targetX - padPos.x) * 0.00025 * Math.abs(speedRatio));

  return {
    x,
    y,
    scale,
    facing,
    tilt: isReturn ? -rawTilt * 0.85 : rawTilt,
    depthS: s
  };
}

/**
 * Tworzy lot drona z okrętu na arenę (lub sam powrót na okręt)
 */
export function spawnShipDroneTransport({
  cargoType = 'NONE',
  showTurret = false,
  targetX = 1200,
  targetY = 600,
  getTargetPos = null,
  approachDuration = 1.1,
  returnDuration = 1.05,
  arcLift = 135,
  returnOnArrive = true,
  startPhase = 'APPROACH',
  initialX = targetX,
  initialY = targetY,
  initialFacing = 1,
  owner = null,
  onArrive = null
} = {}) {
  const transport = {
    id: `dt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    cargoType,
    showTurret,
    targetX,
    targetY,
    getTargetPos,
    approachDuration: Math.max(0.3, approachDuration),
    returnDuration: Math.max(0.4, returnDuration),
    arcLift,
    returnOnArrive,
    phase: startPhase, // 'APPROACH' | 'HOVER_DROP' | 'RETURN'
    elapsed: 0,
    hoverDuration: 0.14,
    rotorAngle: Math.random() * Math.PI * 2,
    life: 10.0,
    facing: initialFacing,
    tilt: 0,
    x: initialX,
    y: initialY,
    scale: startPhase === 'RETURN' ? 1.0 : ARENA3_DRONE_SCALE_FAR,
    returnStartX: initialX,
    returnStartY: initialY,
    owner,
    onArrive,
    arrivedFired: false
  };

  activeDroneTransports.push(transport);
  return transport;
}

/**
 * Aktualizuje wszystkie aktywne loty dronów transportowych i bojowych w przylocie/odlocie
 */
export function updateDroneTransports(dt = (1 / 60)) {
  if (activeDroneTransports.length === 0) return;
  const safeDt = (typeof dt === 'number' && dt > 0 && dt < 1) ? dt : (1 / 60);
  const padPos = getWarshipHelipadWorldPos(globalCamera);

  for (let i = activeDroneTransports.length - 1; i >= 0; i--) {
    const tr = activeDroneTransports[i];
    tr.rotorAngle += safeDt * 52;
    tr.life += safeDt;

    if (tr.phase === 'APPROACH') {
      if (typeof tr.getTargetPos === 'function') {
        const dyn = tr.getTargetPos();
        if (!dyn) {
          // Cel (np. gracz) przestał być aktywny — odwrót na okręt
          tr.phase = 'RETURN';
          tr.elapsed = 0;
          tr.returnStartX = tr.x;
          tr.returnStartY = tr.y;
          tr.cargoType = 'NONE';
          continue;
        }
        tr.targetX = dyn.x;
        tr.targetY = dyn.y;
      }

      tr.elapsed += safeDt;
      const p = Math.min(1, tr.elapsed / tr.approachDuration);
      const sample = computeWarshipFlightSample(padPos, tr.targetX, tr.targetY, p, tr.arcLift, false);
      tr.x = sample.x;
      tr.y = sample.y;
      tr.scale = sample.scale;
      tr.facing = sample.facing;
      tr.tilt = sample.tilt;

      if (p >= 1) {
        if (!tr.arrivedFired) {
          tr.arrivedFired = true;
          if (typeof tr.onArrive === 'function') {
            tr.onArrive(tr);
          }
        }
        if (!tr.returnOnArrive) {
          activeDroneTransports.splice(i, 1);
          continue;
        }
        tr.cargoType = 'NONE';
        tr.phase = 'HOVER_DROP';
        tr.elapsed = 0;
        tr.returnStartX = tr.x;
        tr.returnStartY = tr.y;
      }
    } else if (tr.phase === 'HOVER_DROP') {
      tr.elapsed += safeDt;
      tr.y -= safeDt * 55;
      tr.tilt *= 0.85;
      tr.scale = 1.0;
      if (tr.elapsed >= tr.hoverDuration) {
        tr.phase = 'RETURN';
        tr.elapsed = 0;
        tr.returnStartX = tr.x;
        tr.returnStartY = tr.y;
      }
    } else if (tr.phase === 'RETURN') {
      tr.elapsed += safeDt;
      const p = Math.min(1, tr.elapsed / tr.returnDuration);
      const sample = computeWarshipFlightSample(padPos, tr.returnStartX, tr.returnStartY, p, tr.arcLift * 1.15, true);
      tr.x = sample.x;
      tr.y = sample.y;
      tr.scale = sample.scale;
      tr.facing = sample.facing;
      tr.tilt = sample.tilt;

      if (p >= 1) {
        activeDroneTransports.splice(i, 1);
      }
    }
  }
}

/**
 * Warstwa TŁA (drawArena3Background): rysuje drony w głębi doliny (scale < 0.60), w przestrzeni ekranu
 */
export function drawBackgroundShipDrones(ctx, camera) {
  if (activeDroneTransports.length === 0) return;

  const cam = camera || globalCamera || { x: 0, y: 0, zoom: 1 };
  const camX = cam.x || 0;
  const camY = cam.y || 0;
  const camZoom = cam.zoom || 1;

  for (const tr of activeDroneTransports) {
    if (tr.scale >= DRONE_LAYER_CROSSOVER_SCALE) continue;
    const screenX = (tr.x - camX) * camZoom;
    const screenY = (tr.y - camY) * camZoom;
    const screenScale = tr.scale * camZoom;

    drawDroneBody(ctx, {
      x: screenX,
      y: screenY,
      scale: screenScale,
      facing: tr.facing,
      tilt: tr.tilt,
      rotorAngle: tr.rotorAngle,
      aimAngle: tr.facing >= 0 ? 0.12 : (Math.PI - 0.12),
      life: tr.life,
      totalLife: 10,
      leaving: tr.phase === 'RETURN',
      cargoType: tr.cargoType,
      showTurret: tr.showTurret
    });
  }
}

/**
 * Warstwa ŚWIATA (drawKillstreakWorld): rysuje drony w pierwszym planie (scale >= 0.60), w koordynatach świata
 */
export function drawForegroundShipDrones(ctx) {
  if (activeDroneTransports.length === 0) return;

  for (const tr of activeDroneTransports) {
    if (tr.scale < DRONE_LAYER_CROSSOVER_SCALE) continue;
    drawDroneBody(ctx, {
      x: tr.x,
      y: tr.y,
      scale: tr.scale,
      facing: tr.facing,
      tilt: tr.tilt,
      rotorAngle: tr.rotorAngle,
      aimAngle: tr.facing >= 0 ? 0.12 : (Math.PI - 0.12),
      life: tr.life,
      totalLife: 10,
      leaving: tr.phase === 'RETURN',
      cargoType: tr.cargoType,
      showTurret: tr.showTurret
    });
  }
}
