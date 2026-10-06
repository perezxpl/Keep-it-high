// =========================================================================
// BACKGROUND.JS - GŁĘBOKIE PODZIEMNE ŚCIANY SKALNE, GŁĘBIA PRZESTRZENNA I DYM
// ORAZ PROCEDURALNE WIELOWARSTWOWE TŁO DŻUNGLI Z PARALAKSĄ
// =========================================================================

import { camera } from './camera.js';

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
// ARENA 2: ŚWIĘTA DŻUNGLA (ANCIENT JUNGLE SANCTUARY) - PURE PROCEDURAL ART
// W pełni autorskie, wielowarstwowe tło dżungli z płynną paralaksą:
// 1. Zmierzchowe szmaragdowo-złote niebo z promienistym słońcem porannym
// 2. Odległe iglice krasowe (karst mountain spires) i ruiny stup świątynnych
// 3. Spływające kaskadami górskie wodospady z animowaną pianą i mgłą
// 4. Potężne sylwetki banyanów, liany i prehistoryczna roślinność
// 5. Wolumetryczne złote promienie słońca (god rays) i świetliki dżungli
// =========================================================================

// Cząsteczki pyłku i świetlików w tle (zoptymalizowano do 24 sztuk dla stałych 60 FPS)
const BG_JUNGLE_MOTES_COUNT = 24;
const _bgJungleMotes = [];
for (let i = 0; i < BG_JUNGLE_MOTES_COUNT; i++) {
  _bgJungleMotes.push({
    seedX: 50 + (i * 87.7) % 3600,
    seedY: 100 + (i * 41.3) % 950,
    speedX: ((i % 5) - 2) * 5.5,
    speedY: -7.0 - (i % 4) * 3.5,
    swayAmp: 18 + (i % 4) * 7,
    swaySpeed: 0.75 + (i % 3) * 0.4,
    size: (i % 4 === 0) ? 2.0 : 1.2,
    pulseSpeed: 1.4 + (i % 3) * 0.6,
    phase: i * 0.52,
    isGolden: (i % 3 !== 1)
  });
}

// Funkcje zaślepkowe dla usuniętych snopów światła i poświaty (kompatybilność)
export function drawSunRays() {}
export function drawGodRays() {}
export function drawVolumetricLight() {}
export function drawLightBeams() {}

export function drawPandoraBackground(ctx, camera) {
  if (!ctx) return;
  ctx.shadowBlur = 0;
  const W_screen = ctx.canvas?.width || (typeof window !== 'undefined' ? window.innerWidth : 1920);
  const H_screen = ctx.canvas?.height || (typeof window !== 'undefined' ? window.innerHeight : 1080);
  const time = performance.now() * 0.001;

  const camX = camera ? (camera.x || 0) : 0;
  const camY = camera ? (camera.y || 0) : 0;

  // -------------------------------------------------------------------------
  // WARSTWA 0: CZYSTE, NATURALNE NIEBO DŻUNGLI (USUNIĘTO POMARAŃCZOWĄ POŚWIATĘ)
  // -------------------------------------------------------------------------
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H_screen);
  skyGrad.addColorStop(0.00, '#021810');
  skyGrad.addColorStop(0.25, '#052b1d');
  skyGrad.addColorStop(0.55, '#0b422a');
  skyGrad.addColorStop(0.78, '#144c31');
  skyGrad.addColorStop(0.92, '#185938');
  skyGrad.addColorStop(1.00, '#103d27');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W_screen, H_screen);

  // Naturalne poranne słońce przedzierające się przez mgłę dżungli (bez pomarańczowych plam)
  const sunX = W_screen * 0.64 - (camX * 0.006);
  const sunY = H_screen * 0.30 - (camY * 0.004);
  const sunR = Math.max(75, Math.min(135, H_screen * 0.16));

  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'screen';
  // Dyskretna korona słoneczna
  const coronaGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunR * 2.4);
  coronaGrad.addColorStop(0.0, 'rgba(255, 255, 240, 0.40)');
  coronaGrad.addColorStop(0.35, 'rgba(254, 249, 195, 0.16)');
  coronaGrad.addColorStop(0.75, 'rgba(220, 252, 231, 0.05)');
  coronaGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = coronaGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Tarcza słońca
  const sunCore = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
  sunCore.addColorStop(0.0, '#ffffff');
  sunCore.addColorStop(0.40, '#fef9c3');
  sunCore.addColorStop(0.85, 'rgba(254, 240, 138, 0.25)');
  sunCore.addColorStop(1.0, 'rgba(254, 240, 138, 0)');
  ctx.fillStyle = sunCore;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // -------------------------------------------------------------------------
  // WARSTWA 1: ODLEGŁE IGLICE KRASOWE I STUPY ŚWIĄTYNNE (PARALAKSA 0.020)
  // -------------------------------------------------------------------------
  ctx.save();
  const farX = camX * 0.020;
  const farY = camY * 0.015;
  const farBaseY = H_screen * 0.75 - farY;

  ctx.fillStyle = '#09261a';
  ctx.beginPath();
  ctx.moveTo(0, H_screen);
  ctx.lineTo(0, farBaseY);

  const karstPeaks = [
    { x: 120, w: 220, h: 290, stupa: true },
    { x: 420, w: 180, h: 370 },
    { x: 740, w: 280, h: 260 },
    { x: 1100, w: 320, h: 410, stupa: true },
    { x: 1540, w: 240, h: 330 },
    { x: 1880, w: 360, h: 440, stupa: true },
    { x: 2340, w: 210, h: 300 },
    { x: 2700, w: 340, h: 380, stupa: true },
    { x: 3150, w: 260, h: 320 }
  ];

  for (let i = 0; i < karstPeaks.length; i++) {
    const kp = karstPeaks[i];
    const sx = (kp.x - farX) % (W_screen + 500) - 250;
    const sy = farBaseY - kp.h;

    ctx.lineTo(sx - kp.w * 0.5, farBaseY);
    ctx.quadraticCurveTo(sx - kp.w * 0.15, sy + kp.h * 0.28, sx, sy);
    ctx.quadraticCurveTo(sx + kp.w * 0.15, sy + kp.h * 0.28, sx + kp.w * 0.5, farBaseY);

    // Starożytna wieża / stupa na wierzchołku szczytu
    if (kp.stupa) {
      ctx.rect(sx - 9, sy - 28, 18, 28);
      ctx.moveTo(sx - 14, sy - 28);
      ctx.lineTo(sx + 14, sy - 28);
      ctx.lineTo(sx, sy - 46);
      ctx.closePath();
    }
  }
  ctx.lineTo(W_screen, farBaseY);
  ctx.lineTo(W_screen, H_screen);
  ctx.closePath();
  ctx.fill();

  // Mgiełka dolinna między górami
  const farMist = ctx.createLinearGradient(0, farBaseY - 80, 0, farBaseY + 70);
  farMist.addColorStop(0.0, 'rgba(15, 60, 42, 0)');
  farMist.addColorStop(0.6, 'rgba(19, 70, 48, 0.35)');
  farMist.addColorStop(1.0, 'rgba(11, 42, 29, 0.65)');
  ctx.fillStyle = farMist;
  ctx.fillRect(0, farBaseY - 80, W_screen, 150);
  ctx.restore();

  // -------------------------------------------------------------------------
  // WARSTWA 2: GĘSTE KORONY DRZEW I KASKADOWE WODOSPADY (PARALAKSA 0.055)
  // -------------------------------------------------------------------------
  ctx.save();
  const midX = camX * 0.055;
  const midY = camY * 0.035;
  const midBaseY = H_screen * 0.82 - midY;

  // Głębokie leśne korony drzew
  const midCanopyGrad = ctx.createLinearGradient(0, midBaseY - 180, 0, midBaseY + 120);
  midCanopyGrad.addColorStop(0.0, '#0e3d27');
  midCanopyGrad.addColorStop(0.4, '#134c32');
  midCanopyGrad.addColorStop(1.0, '#0a2417');
  ctx.fillStyle = midCanopyGrad;

  ctx.beginPath();
  ctx.moveTo(0, H_screen);
  ctx.lineTo(0, midBaseY);

  const domeCount = 18;
  const domeStep = (W_screen + 400) / domeCount;
  for (let d = 0; d <= domeCount + 1; d++) {
    const dx = (d * domeStep - midX) % (W_screen + 400) - 200;
    const treeH = 110 + Math.sin(d * 1.8) * 45 + Math.cos(d * 2.5) * 30;
    const dy = midBaseY - treeH;
    ctx.quadraticCurveTo(dx - domeStep * 0.3, dy - 20, dx, dy);
    ctx.quadraticCurveTo(dx + domeStep * 0.3, dy + 15, dx + domeStep * 0.5, midBaseY);
  }
  ctx.lineTo(W_screen, midBaseY);
  ctx.lineTo(W_screen, H_screen);
  ctx.closePath();
  ctx.fill();

  // DWA GÓRSKIE WODOSPADY W TLE
  const waterfalls = [
    { x: W_screen * 0.28 - (camX * 0.055) % (W_screen + 600), startY: midBaseY - 140, len: 170, w: 18 },
    { x: W_screen * 0.76 - (camX * 0.055) % (W_screen + 600), startY: midBaseY - 160, len: 190, w: 22 }
  ];

  for (let wf of waterfalls) {
    const endY = wf.startY + wf.len;

    // Struga wody
    const wfGrad = ctx.createLinearGradient(wf.x, wf.startY, wf.x + wf.w, wf.startY);
    wfGrad.addColorStop(0.0, 'rgba(14, 116, 144, 0.65)');
    wfGrad.addColorStop(0.3, '#38bdf8');
    wfGrad.addColorStop(0.7, '#7dd3fc');
    wfGrad.addColorStop(1.0, 'rgba(14, 116, 144, 0.65)');
    ctx.fillStyle = wfGrad;

    ctx.beginPath();
    ctx.moveTo(wf.x, wf.startY);
    ctx.lineTo(wf.x + wf.w, wf.startY);
    ctx.quadraticCurveTo(wf.x + wf.w * 0.85, wf.startY + wf.len * 0.5, wf.x + wf.w * 0.70, endY);
    ctx.lineTo(wf.x + wf.w * 0.30, endY);
    ctx.quadraticCurveTo(wf.x + wf.w * 0.15, wf.startY + wf.len * 0.5, wf.x, wf.startY);
    ctx.closePath();
    ctx.fill();

    // Animowane spływające smugi piany
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.6;
    const yOff = (time * 160) % 32;
    for (let py = wf.startY + yOff; py < endY - 8; py += 32) {
      ctx.beginPath();
      ctx.moveTo(wf.x + wf.w * 0.35, py);
      ctx.lineTo(wf.x + wf.w * 0.65, py + 14);
      ctx.stroke();
    }

    // Pióropusz mgły u dołu wodospadu
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const mistGrad = ctx.createRadialGradient(wf.x + wf.w * 0.5, endY, 4, wf.x + wf.w * 0.5, endY, 45);
    mistGrad.addColorStop(0.0, 'rgba(204, 251, 241, 0.45)');
    mistGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.18)');
    mistGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = mistGrad;
    ctx.beginPath();
    ctx.arc(wf.x + wf.w * 0.5, endY, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Odległe potężne liany przerzucone między wierzchołkami koron
  ctx.strokeStyle = '#071f14';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(waterfalls[0].x - 140, midBaseY - 110);
  ctx.quadraticCurveTo(waterfalls[0].x, midBaseY - 50, waterfalls[0].x + 180, midBaseY - 120);
  ctx.stroke();

  ctx.restore();

  // -------------------------------------------------------------------------
  // WARSTWA 3: BLISKA DŻUNGLA, GIGANTYCZNE PNIE I LIANY (PARALAKSA 0.11)
  // -------------------------------------------------------------------------
  ctx.save();
  const nearX = camX * 0.11;
  const nearY = camY * 0.07;
  const nearBaseY = H_screen * 0.90 - nearY;

  // Ciemne sylwetki masywnych pni banyanów i zarośli
  ctx.fillStyle = '#071910';

  const bigTrunks = [
    { x: 80 - nearX % (W_screen + 600), w: 90, h: 480 },
    { x: 580 - nearX % (W_screen + 600), w: 110, h: 540 },
    { x: 1220 - nearX % (W_screen + 600), w: 130, h: 510 },
    { x: 1840 - nearX % (W_screen + 600), w: 95, h: 470 },
    { x: 2380 - nearX % (W_screen + 600), w: 120, h: 530 }
  ];

  for (const tr of bigTrunks) {
    ctx.beginPath();
    ctx.moveTo(tr.x - tr.w * 0.5, H_screen);
    ctx.lineTo(tr.x - tr.w * 0.35, nearBaseY - tr.h);
    ctx.lineTo(tr.x + tr.w * 0.35, nearBaseY - tr.h);
    ctx.lineTo(tr.x + tr.w * 0.5, H_screen);
    ctx.closePath();
    ctx.fill();

    // Zwieszające się wici lian z pni w tle
    ctx.strokeStyle = '#05130c';
    ctx.lineWidth = 2.5;
    for (let l = 0; l < 3; l++) {
      const lx = tr.x - tr.w * 0.2 + l * (tr.w * 0.25);
      const lLen = 140 + ((l * 43) % 180);
      const sway = Math.sin(time * 1.5 + l + tr.x * 0.01) * 8;
      ctx.beginPath();
      ctx.moveTo(lx, nearBaseY - tr.h + 80);
      ctx.quadraticCurveTo(lx + sway * 0.5, nearBaseY - tr.h + 80 + lLen * 0.5, lx + sway, nearBaseY - tr.h + 80 + lLen);
      ctx.stroke();
    }
  }

  // Zarys tropikalnych paproci i liści palmowych na dolnej krawędzi
  ctx.strokeStyle = '#081d13';
  ctx.lineWidth = 3.5;
  for (let f = 0; f < 14; f++) {
    const fx = (f * 175 - nearX) % (W_screen + 300) - 100;
    const fy = nearBaseY + 20;
    for (let fr = -2; fr <= 2; fr++) {
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.quadraticCurveTo(fx + fr * 24, fy - 45, fx + fr * 38, fy - 65);
      ctx.stroke();
    }
  }

  ctx.restore();

  // -------------------------------------------------------------------------
  // WARSTWA 4: PŁYWAJĄCY PYŁEK DŻUNGLI (ZOPTYMALIZOWANY DO 24 SZTUK, BEZ CIENI I GRADIENTÓW)
  // -------------------------------------------------------------------------
  // (Usunięto pionowe pomarańczowe snopy światła / god rays)
  ctx.save();
  ctx.shadowBlur = 0;
  for (let m = 0; m < _bgJungleMotes.length; m++) {
    const mt = _bgJungleMotes[m];
    const mx = (mt.seedX + Math.sin(time * mt.swaySpeed + mt.phase) * mt.swayAmp - camX * 0.03 % W_screen + W_screen) % W_screen;
    const my = ((mt.seedY + time * mt.speedY) % H_screen + H_screen) % H_screen;

    const sinP = Math.sin(time * mt.pulseSpeed + mt.phase);
    const alpha = 0.25 + 0.50 * (0.5 + 0.5 * sinP);

    ctx.fillStyle = mt.isGolden
      ? `rgba(254, 240, 138, ${alpha})`
      : `rgba(167, 243, 208, ${alpha * 0.85})`;

    ctx.beginPath();
    ctx.arc(mx, my, mt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export { drawArena1Background } from './arenas/arena1.js';
