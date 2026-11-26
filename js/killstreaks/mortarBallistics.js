// =============================================================================
// JS/KILLSTREAKS/MORTARBALLISTICS.JS - WSPÓLNA BALISTYKA I WYGLĄD POCISKÓW
// Zapewnia pełną synchronizację kąta luf okrętu, toru wznoszenia w tle
// oraz parabolicznego opadania i wyglądu bomb moździerzowych w świecie gry.
// =============================================================================

export const ARENA3_SHIP_WORLD_X = 2200;
export const ARENA3_SHIP_MORTAR_STAGGER = 0.28;
export const ARENA3_SHIP_MORTAR_ASCENT = 0.72;
export const ARENA3_SHIP_FLASH_DURATION = 0.16;
export const ARENA3_SHIP_APEX_HANG = 0.12;

export function clampVal(v, min, max) {
  return v < min ? min : (v > max ? max : v);
}

/**
 * Oblicza spójne parametry balistyczne dla strzału z okrętu (Arena 3) w stronę celu destX.
 * Kąt lufy (-90° ± 32°) bezpośrednio wyznacza kierunek wznoszenia i dryf poziomy opadania.
 */
export function computeShipMortarBallistics(destX, shipWorldX = ARENA3_SHIP_WORLD_X) {
  const safeDestX = (typeof destX === 'number' && !isNaN(destX)) ? destX : shipWorldX;
  const dxWorld = safeDestX - shipWorldX;
  const dxNorm = clampVal(dxWorld / 1650, -1, 1);

  // Kąt elewacji lufy (-PI/2 = pionowo w górę; ujemny dla lewej flanki, większy dla prawej)
  const barrelAngle = -Math.PI * 0.5 + dxNorm * 0.56;

  // Prędkość pozioma i przyspieszenie grawitacyjne opadającego pocisku w świecie gry
  const fallVx = dxNorm * 6.4;
  const fallVyStart = 15.5;
  const fallGravity = 0.24;

  return {
    dxNorm,
    barrelAngle,
    fallVx,
    fallVyStart,
    fallGravity
  };
}

/**
 * Wylicza liczbę klatek (60 Hz) potrzebnych na spadek z startY do destY przy stałej grawitacji.
 */
export function solveMortarFallTicks(startY, destY, vyStart = 15.5, gravity = 0.24) {
  const dy = Math.max(10, destY - startY);
  if (gravity <= 0.0001) {
    return dy / Math.max(1, vyStart);
  }
  const disc = vyStart * vyStart + 2 * gravity * dy;
  return (-vyStart + Math.sqrt(Math.max(0, disc))) / gravity;
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
