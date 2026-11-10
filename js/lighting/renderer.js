// =========================================================================
// LIGHTING/RENDERER.JS - RENDEROWANIE DYNAMICZNYCH ŚWIATEŁ, FAL I WINIETY
// Zoptymalizowane: zbuforowane tekstury sprajtów światła i winiety (stałe 60 FPS)
// =========================================================================

import { lightingState } from './state.js';

// Bufor pre-renderowanych sprajtów świateł (128x128) - zero createRadialGradient w pętli gry
const _lightSpriteCache = new Map();

function getCachedLightSprite(colorHex) {
  let sprite = _lightSpriteCache.get(colorHex);
  if (!sprite) {
    if (typeof document === 'undefined') return null;
    sprite = document.createElement('canvas');
    sprite.width = 128;
    sprite.height = 128;
    const sctx = sprite.getContext('2d');
    const grad = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0.00, hexToRgba(colorHex, 1.0));
    grad.addColorStop(0.28, hexToRgba(colorHex, 0.65));
    grad.addColorStop(0.62, hexToRgba(colorHex, 0.20));
    grad.addColorStop(1.00, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 128, 128);
    _lightSpriteCache.set(colorHex, sprite);
  }
  return sprite;
}

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
  // Tryb mieszania 'lighter' daje sprzętowo akcelerowany rozbłysk
  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < lights.length; i++) {
    const l = lights[i];
    const progress = 1 - (l.life / l.maxDuration);

    // Dynamiczna ekspansja światła dla eksplozji
    const r = l.expand
      ? (l.radius * (0.45 + 0.55 * Math.min(1.0, progress * 4.0)))
      : l.radius;

    // Culling - pomiń źródła światła poza widokiem kamery
    if (l.x + r < camL || l.x - r > camR || l.y + r < camT || l.y - r > camB) continue;

    let alpha = (1 - progress) * l.intensity;

    if (l.flicker) {
      alpha *= (0.88 + Math.sin(performance.now() * 0.045 + l.x) * 0.12);
    }

    if (alpha <= 0.01) continue;

    const sprite = getCachedLightSprite(l.color || '#ffaa33');
    if (!sprite) continue;

    // Ograniczenie maksymalnej przezroczystości (zapobiega wypaleniu ekranu na biały blur)
    const clampedAlpha = Math.min(0.70, alpha * 0.80);

    ctx.globalAlpha = clampedAlpha;
    ctx.drawImage(sprite, l.x - r, l.y - r, r * 2, r * 2);
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

// Zbuforowany canvas winiety ekranowej (zero alokacji radialnego gradientu w klatce)
let _vignetteCanvas = null;
let _vignetteW = 0;
let _vignetteH = 0;
let _vignetteAlpha = -1;

/**
 * Renderuje kinową winietę na ekranie (w przestrzeni ekranowej po przywróceniu kamery).
 * Daje filmowy klimat, skupiając uwagę gracza w centrum akcji.
 */
export function drawCinematicVignette(ctx) {
  if (!lightingState.enabled) return;

  const w = ctx.canvas?.width || (typeof window !== 'undefined' ? window.innerWidth : 1920);
  const h = ctx.canvas?.height || (typeof window !== 'undefined' ? window.innerHeight : 1080);
  if (w <= 0 || h <= 0) return;

  if (!_vignetteCanvas || _vignetteW !== w || _vignetteH !== h || _vignetteAlpha !== lightingState.vignetteAlpha) {
    if (typeof document === 'undefined') return;
    _vignetteCanvas = document.createElement('canvas');
    _vignetteCanvas.width = w;
    _vignetteCanvas.height = h;
    _vignetteW = w;
    _vignetteH = h;
    _vignetteAlpha = lightingState.vignetteAlpha;

    const vctx = _vignetteCanvas.getContext('2d');
    const cx = w * 0.5;
    const cy = h * 0.5;
    const innerR = Math.min(w, h) * 0.42;
    const outerR = Math.hypot(w * 0.5, h * 0.5);

    const vGrad = vctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
    vGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0.0)');
    vGrad.addColorStop(0.65, 'rgba(2, 4, 8, 0.18)');
    vGrad.addColorStop(1.0, `rgba(1, 2, 5, ${lightingState.vignetteAlpha})`);

    vctx.fillStyle = vGrad;
    vctx.fillRect(0, 0, w, h);
  }

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(_vignetteCanvas, 0, 0, w, h);
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
