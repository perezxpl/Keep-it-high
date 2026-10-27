// =========================================================================
// LIGHTING/RENDERER.JS - RENDEROWANIE DYNAMICZNYCH ŚWIATEŁ, FAL I WINIETY
// =========================================================================

import { lightingState } from './state.js';

/**
 * Renderuje dynamiczne źródła światła (wystrzały, wybuchy, ogień jetpacka)
 * w przestrzeni świata gry (przed przywróceniem kamery).
 */
export function drawLighting(ctx, camera, activeArenaId) {
  if (!lightingState.enabled) return;

  const lights = lightingState.activeLights;
  if (!lights || lights.length === 0) return;

  const camL = camera ? (camera.x - 200) : -500;
  const camR = camera ? (camera.x + (camera.viewWidth || 2000) + 200) : 5000;
  const camT = camera ? (camera.y - 200) : -500;
  const camB = camera ? (camera.y + (camera.viewHeight || 1200) + 200) : 3000;

  ctx.save();
  // Tryb mieszania 'lighter' daje sprzętowo akcelerowany rozbłysk oświetlający postacie, krew i teren
  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < lights.length; i++) {
    const l = lights[i];
    const progress = 1 - (l.life / l.maxDuration);

    // Dynamiczna ekspansja światła dla eksplozji (naturalny rozbłysk bez sztucznych okręgów)
    const r = l.expand
      ? (l.radius * (0.35 + 0.65 * Math.min(1.0, progress * 4.0)))
      : l.radius;

    // Culling - pomiń źródła światła poza widokiem kamery
    if (l.x + r < camL || l.x - r > camR || l.y + r < camT || l.y - r > camB) continue;

    let alpha = (1 - progress) * l.intensity;

    if (l.flicker) {
      alpha *= (0.88 + Math.sin(performance.now() * 0.045 + l.x) * 0.12);
    }

    if (alpha <= 0.01) continue;

    // Trójstopniowy radialny gradient światła
    const grad = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, r);
    grad.addColorStop(0.00, hexToRgba(l.color, alpha * 0.95));
    grad.addColorStop(0.35, hexToRgba(l.color, alpha * 0.50));
    grad.addColorStop(0.70, hexToRgba(l.color, alpha * 0.15));
    grad.addColorStop(1.00, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(l.x, l.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Renderuje ewentualne efekty fal w przestrzeni świata gry.
 * Usunięto sztuczne okręgi z cienkiej linii na rzecz naturalnej poświaty i cząsteczek.
 */
export function drawShockwaves(ctx, camera) {
  // Funkcja zachowana dla stabilności API bez renderowania sztucznych linii wektorowych
}

/**
 * Renderuje kinową winietę na ekranie (w przestrzeni ekranowej po przywróceniu kamery).
 * Daje filmowy klimat, skupiając uwagę gracza w centrum akcji.
 */
export function drawCinematicVignette(ctx) {
  if (!lightingState.enabled) return;

  const w = ctx.canvas?.width || (typeof window !== 'undefined' ? window.innerWidth : 1920);
  const h = ctx.canvas?.height || (typeof window !== 'undefined' ? window.innerHeight : 1080);
  const cx = w * 0.5;
  const cy = h * 0.5;
  const innerR = Math.min(w, h) * 0.42;
  const outerR = Math.hypot(w * 0.5, h * 0.5);

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';

  const vGrad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
  vGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0.0)');
  vGrad.addColorStop(0.65, 'rgba(2, 4, 8, 0.18)');
  vGrad.addColorStop(1.0, `rgba(1, 2, 5, ${lightingState.vignetteAlpha})`);

  ctx.fillStyle = vGrad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/**
 * Pomocnicza konwersja koloru HEX (#rrggbb lub #rgb) na ciąg rgba(r,g,b,a).
 */
function hexToRgba(hex, alpha) {
  if (!hex || typeof hex !== 'string') return `rgba(255, 170, 50, ${alpha})`;
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;

  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(255, 170, 50, ${alpha})`;

  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}
