// =============================================================================
// JS/KILLSTREAKS/MORTARBALLISTICS.JS - WSPÓLNA BALISTYKA I WYGLĄD POCISKÓW
// Zapewnia ciągłą parabolę lotu w obrębie ekranu/areny od luf okrętu aż po cel,
// bez znikania pocisków za górną krawędzią ekranu.
// =============================================================================

export const ARENA3_SHIP_WORLD_X = 2200;
export const ARENA3_SHIP_MORTAR_STAGGER = 0.28;
export const ARENA3_SHIP_MORTAR_ASCENT = 0.68;
export const ARENA3_SHIP_FLASH_DURATION = 0.16;
export const ARENA3_MORTAR_FALL_GRAVITY = 0.44;

export function clampVal(v, min, max) {
  return v < min ? min : (v > max ? max : v);
}

/**
 * Wylicza liczbę klatek (60 Hz) potrzebnych na spadek z startY do destY przy stałej grawitacji.
 */
export function solveMortarFallTicks(startY, destY, vyStart = 0, gravity = ARENA3_MORTAR_FALL_GRAVITY) {
  const dy = Math.max(10, destY - startY);
  if (gravity <= 0.0001) {
    return dy / Math.max(1, vyStart);
  }
  const disc = vyStart * vyStart + 2 * gravity * dy;
  return (-vyStart + Math.sqrt(Math.max(0, disc))) / gravity;
}

/**
 * Oblicza jednolitą parabolę dla pocisku moździerzowego okrętu (Arena 3):
 * - Szczyt paraboli (apexWorldX, apexWorldY) znajduje się zawsze w widocznym niebie areny
 * - Faza 1 (tło/okręt) kończy lot dokładnie w punkcie szczytu (vy = 0)
 * - Faza 2 (świat gry) płynnie przejmuje ten sam punkt i spada po paraboli w cel (destX, destY)
 */
export function computeUnifiedShipMortarArc(destX, destY, camera = null, turretIdx = 0) {
  const safeDestX = (typeof destX === 'number' && !isNaN(destX)) ? destX : ARENA3_SHIP_WORLD_X;
  const safeDestY = (typeof destY === 'number' && !isNaN(destY)) ? destY : 1200;

  const camX = camera ? (camera.x || 0) : 0;
  const camY = camera ? (camera.y || 0) : 0;
  const camZoom = (camera && camera.zoom) ? camera.zoom : 0.75;
  const viewW = (camera && typeof camera.viewWidth === 'number' && camera.viewWidth > 0)
    ? camera.viewWidth
    : (1920 / Math.max(0.25, camZoom));
  const viewH = (camera && typeof camera.viewHeight === 'number' && camera.viewHeight > 0)
    ? camera.viewHeight
    : (1080 / Math.max(0.25, camZoom));

  // Dokładna pozycja okrętu w przestrzeni świata odpowiadająca jego pozycji na ekranie
  const viewCenterX = camX + viewW * 0.5;
  const turretOffsetWorld = (turretIdx === 0 ? 65 : -75) / Math.max(0.35, camZoom);
  const shipWorldX = viewCenterX - ((viewCenterX - ARENA3_SHIP_WORLD_X) * 0.12) / Math.max(0.35, camZoom) + turretOffsetWorld;

  // Szczyt łuku umieszczony pod górną krawędzią kadru/areny (zawsze widoczny na ekranie)
  const rawApexY = Math.min(safeDestY - 240, camY + Math.max(105, viewH * 0.11));
  const apexWorldY = Math.max(95, rawApexY);
  const rawApexX = shipWorldX + (safeDestX - shipWorldX) * 0.48;
  const apexWorldX = clampVal(rawApexX, 140, 4260);

  // Kąt elewacji lufy wycelowany z okrętu ku pierwszemu odcinkowi paraboli
  const dxToApex = apexWorldX - shipWorldX;
  const dyToApex = Math.min(-240, apexWorldY - (camY + viewH * 0.55));
  const rawAngle = Math.atan2(dyToApex, dxToApex * 0.75);
  const barrelAngle = clampVal(rawAngle, -Math.PI * 0.76, -Math.PI * 0.24);

  const fallGravity = ARENA3_MORTAR_FALL_GRAVITY;
  const fallTicks = solveMortarFallTicks(apexWorldY, safeDestY, 0, fallGravity);
  const fallVx = (safeDestX - apexWorldX) / Math.max(1, fallTicks);

  return {
    shipWorldX,
    apexWorldX,
    apexWorldY,
    barrelAngle,
    fallVx,
    fallVyStart: 0,
    fallGravity,
    fallTicks
  };
}

/**
 * Zwraca kąt elewacji lufy okrętu dla podanego punktu X (używane do śledzenia celownika na żywo).
 */
export function computeShipTurretAimAngle(targetX, camera = null, turretIdx = 0) {
  return computeUnifiedShipMortarArc(targetX, 1200, camera, turretIdx).barrelAngle;
}

/**
 * Rysuje aerodynamiczną bombę moździerzową z brzechwami, korpusem i ogonem ogniowym,
 * obróconą zgodnie z kierunkiem lotu (wspólny model dla wznoszenia w tle i opadania w świecie).
 */
export function drawMortarBombSprite(ctx, x, y, angle, scale = 1.0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  // 1. Płomień ładunku miotającego / smugacza z ogona pocisku (skierowany do tyłu: -X)
  ctx.fillStyle = 'rgba(249, 115, 22, 0.42)';
  ctx.beginPath();
  ctx.ellipse(-10.5, 0, 7.5, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fb923c';
  ctx.beginPath();
  ctx.moveTo(-6, -2.5);
  ctx.lineTo(-16, 0);
  ctx.lineTo(-6, 2.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.moveTo(-6, -1.3);
  ctx.lineTo(-11.5, 0);
  ctx.lineTo(-6, 1.3);
  ctx.closePath();
  ctx.fill();

  // 2. Stateczniki (brzechwy ogonowe)
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#090d14';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(-7.5, -4.4);
  ctx.lineTo(-3.2, -2.2);
  ctx.lineTo(-3.2, 2.2);
  ctx.lineTo(-7.5, 4.4);
  ctx.lineTo(-5.8, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Korpus aerodynamiczny bomby (stalowo-grafitowy z opływem na przodzie +X)
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(-5.0, -2.6);
  ctx.lineTo(3.2, -3.1);
  ctx.quadraticCurveTo(9.5, -2.2, 11.2, 0);
  ctx.quadraticCurveTo(9.5, 2.2, 3.2, 3.1);
  ctx.lineTo(-5.0, 2.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Metaliczny refleks na grzbiecie korpusu
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-3.6, -2.1, 6.2, 1.1);

  // Czerwony pierścień głowicy bojowej
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(3.4, -2.6, 2.2, 5.2);

  // Zapalnik na czubku
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(10.2, 0, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
