// =========================================================================
// BACKGROUND.JS - GŁĘBOKIE PODZIEMNE ŚCIANY SKALNE, GŁĘBIA PRZESTRZENNA I DYM
// ORAZ TŁO PRZEMYSŁOWE SEKTOR X (ARENA 2)
// =========================================================================

import { camera } from './camera.js';
import { drawArena2Background } from './arenas/arena2.js';

/**
 * Renderuje głęboką, ciemną ścianę skalną podziemnej jaskini:
 * - Ciemny gradient pionowy od #08090C (góra) do #12151B (dno)
 * - 2-3 duże, rozmyte cienie potężnych filarów skalnych w głębi (paralaksa)
 * - Wolno unoszące się drobiny pyłu jaskiniowego (1-2px, alpha 0.15-0.3)
 * - Miękkie oświetlenie wolumetryczne lamp górniczych (radial gradient, screen blend)
 */
export function drawMineCaveBackground(ctx, camX = 1800, camY = 0) {
  const time = performance.now() * 0.001;
  const W = ctx.canvas?.width || (typeof window !== 'undefined' ? window.innerWidth : 1920);
  const H = ctx.canvas?.height || (typeof window !== 'undefined' ? window.innerHeight : 1080);

  // 1. CIEMNY GRADIENT PIONOWY TŁA (#08090C do #12151B)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0.0, '#08090C');
  bgGrad.addColorStop(1.0, '#12151B');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. POTĘŻNE, ROZMYTE CIENIE FILARÓW SKALNYCH W GŁĘBI (PARALAKSA DALEKA I ŚREDNIA)
  // Filar 1: Monumentalny filar w lewej części pieczary (paralaksa 0.018)
  const p1Period = 1400;
  const p1Offset = Math.floor(((camX * 0.018) % p1Period + p1Period) % p1Period);
  const minP1 = Math.floor((-p1Offset) / p1Period) - 1;
  const maxP1 = Math.ceil((W - p1Offset) / p1Period) + 1;

  ctx.save();
  for (let loop = minP1; loop <= maxP1; loop++) {
    const px = Math.floor(loop * p1Period - p1Offset + 240);
    const pw = 280;
    if (px + pw < -80 || px > W + 80) continue;

    // Rozmyty cień potężnego filaru z gradientem wielostopniowym
    const fGrad = ctx.createLinearGradient(px, 0, px + pw, 0);
    fGrad.addColorStop(0.0, 'rgba(8, 9, 12, 0.0)');
    fGrad.addColorStop(0.2, '#0B0D12');
    fGrad.addColorStop(0.5, '#0E1117');
    fGrad.addColorStop(0.8, '#0B0D12');
    fGrad.addColorStop(1.0, 'rgba(8, 9, 12, 0.0)');
    ctx.fillStyle = fGrad;
    ctx.fillRect(px, 0, pw, H);

    // Subtelne pofalowane krawędzie filaru
    ctx.strokeStyle = 'rgba(20, 24, 32, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px + pw * 0.35, 0);
    ctx.quadraticCurveTo(px + pw * 0.32, H * 0.5, px + pw * 0.36, H);
    ctx.stroke();
  }

  // Filar 2: Monumentalny filar centralno-wschodni (paralaksa 0.038)
  const p2Period = 1100;
  const p2Offset = Math.floor(((camX * 0.038) % p2Period + p2Period) % p2Period);
  const minP2 = Math.floor((-p2Offset) / p2Period) - 1;
  const maxP2 = Math.ceil((W - p2Offset) / p2Period) + 1;

  for (let loop = minP2; loop <= maxP2; loop++) {
    const px = Math.floor(loop * p2Period - p2Offset + 680);
    const pw = 340;
    if (px + pw < -80 || px > W + 80) continue;

    const fGrad = ctx.createLinearGradient(px, 0, px + pw, 0);
    fGrad.addColorStop(0.0, 'rgba(8, 9, 12, 0.0)');
    fGrad.addColorStop(0.25, '#0D1016');
    fGrad.addColorStop(0.50, '#10141C');
    fGrad.addColorStop(0.75, '#0D1016');
    fGrad.addColorStop(1.0, 'rgba(8, 9, 12, 0.0)');
    ctx.fillStyle = fGrad;
    ctx.fillRect(px, 0, pw, H);

    // Szczeliny sedymentacyjne w głębi filaru
    ctx.strokeStyle = 'rgba(7, 9, 12, 0.65)';
    ctx.lineWidth = 2.0;
    for (let sy = 60; sy < H; sy += 90) {
      ctx.beginPath();
      ctx.moveTo(px + 40, sy);
      ctx.lineTo(px + pw - 40, sy + 10);
      ctx.stroke();
    }
  }
  ctx.restore();

  // 3. MIĘKKIE OŚWIETLENIE WOLUMETRYCZNE W TLE (SMOOTH LIGHTING Z COMPOSITE 'SCREEN')
  const lampPeriod = 900;
  const lampOffset = Math.floor(((camX * 0.055) % lampPeriod + lampPeriod) % lampPeriod);
  const minLamp = Math.floor((-lampOffset) / lampPeriod) - 1;
  const maxLamp = Math.ceil((W - lampOffset) / lampPeriod) + 1;

  for (let loop = minLamp; loop <= maxLamp; loop++) {
    const lx = Math.floor(loop * lampPeriod - lampOffset + 420);
    const ly = H * 0.26;
    if (lx < -150 || lx > W + 150) continue;

    const flicker = 0.88 + 0.12 * Math.sin(time * 5.2 + loop * 2.7);

    // Blask wolumetryczny w trybie screen
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Miękki stożek światła z radialnym gradientem (dystans 220px, płynny falloff)
    const coneGrad = ctx.createRadialGradient(lx, ly + 4, 3, lx, ly + 110, 220);
    coneGrad.addColorStop(0.00, `rgba(255, 250, 240, ${0.80 * flicker})`); // jądro #FFFAF0
    coneGrad.addColorStop(0.12, `rgba(245, 158, 11, ${0.50 * flicker})`); // poświata #F59E0B
    coneGrad.addColorStop(0.38, `rgba(217, 119, 6, ${0.25 * flicker})`);  // alpha 0.25
    coneGrad.addColorStop(0.70, `rgba(180, 83, 9, ${0.08 * flicker})`);
    coneGrad.addColorStop(1.00, 'rgba(0, 0, 0, 0.0)');                     // 0.0 na dystansie 220px

    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(lx - 8, ly + 4);
    ctx.lineTo(lx - 130, ly + 220);
    ctx.quadraticCurveTo(lx, ly + 240, lx + 130, ly + 220);
    ctx.lineTo(lx + 8, ly + 4);
    ctx.closePath();
    ctx.fill();

    // Kolista poświata wokół klosza
    const bloom = ctx.createRadialGradient(lx, ly + 6, 2, lx, ly + 6, 36);
    bloom.addColorStop(0.0, `rgba(255, 250, 240, ${0.85 * flicker})`);
    bloom.addColorStop(0.3, `rgba(245, 158, 11, ${0.45 * flicker})`);
    bloom.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.arc(lx, ly + 6, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Precyzyjna oprawa lampy ze stali
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(lx, ly - 30);
    ctx.lineTo(lx, ly);
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.fillRect(lx - 7, ly, 14, 5);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(lx - 7, ly, 14, 5);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(lx - 5, ly + 5, 10, 8);
    ctx.fillStyle = '#fffbeb';
    ctx.fillRect(lx - 2, ly + 7, 4, 4);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(lx - 6, ly + 4, 12, 10);
    ctx.beginPath();
    ctx.moveTo(lx, ly + 4); ctx.lineTo(lx, ly + 14);
    ctx.moveTo(lx - 6, ly + 9); ctx.lineTo(lx + 6, ly + 9);
    ctx.stroke();
  }

  // 4. WOLNO UNOSZĄCE SIĘ DROBINY PYŁU JASKINIOWEGO (Zoptymalizowano do 22 sztuk, bez cieni)
  ctx.save();
  ctx.shadowBlur = 0;
  const moteCount = 22;
  for (let i = 0; i < moteCount; i++) {
    const seedX = (i * 73.19) % W;
    const seedY = (i * 47.83) % H;

    const driftX = (seedX - (camX * 0.02) + Math.sin(time * 0.35 + i) * 25 + W * 10) % W;
    const driftY = (seedY - (time * 9.0) + Math.cos(time * 0.45 + i * 1.5) * 18 + H * 10) % H;

    const baseAlpha = 0.15 + ((i % 5) * 0.035);
    const twinkle = 0.8 + 0.2 * Math.sin(time * 2.0 + i * 2.1);
    const alpha = baseAlpha * twinkle;

    const size = (i % 3 === 0) ? 2.0 : 1.2;

    ctx.fillStyle = `rgba(203, 213, 225, ${alpha})`;
    ctx.beginPath();
    ctx.arc(driftX, driftY, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// =========================================================================
// ARENA 2: SEKTOR X // INDUSTRIAL FOUNDRY & WASTE FACILITY
// Tło przemysłowe delegowane bezpośrednio do modułu arenas/arena2.js
// =========================================================================

// Zaślepki kompatybilności wstecznej
export function drawSunRays() {}
export function drawGodRays() {}
export function drawVolumetricLight() {}
export function drawLightBeams() {}

export function drawPandoraBackground(ctx, camera) {
  drawArena2Background(ctx, camera);
}
export { drawArena2Background };

export { drawArena1Background } from './arenas/arena1.js';
