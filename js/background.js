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

// Cząsteczki bioluminescencyjnego pyłku i zarodników nocnej Pandory (stałe 60 FPS)
const BG_JUNGLE_MOTES_COUNT = 28;
const _bgJungleMotes = [];
for (let i = 0; i < BG_JUNGLE_MOTES_COUNT; i++) {
  _bgJungleMotes.push({
    seedX: 50 + (i * 87.7) % 3600,
    seedY: 100 + (i * 41.3) % 950,
    speedX: ((i % 5) - 2) * 4.5,
    speedY: -6.0 - (i % 4) * 3.0,
    swayAmp: 16 + (i % 4) * 6,
    swaySpeed: 0.75 + (i % 3) * 0.4,
    size: (i % 4 === 0) ? 2.2 : (i % 3 === 0 ? 1.6 : 1.1),
    pulseSpeed: 1.4 + (i % 3) * 0.6,
    phase: i * 0.52,
    hueType: i % 3
  });
}

// Delikatne gwiazdy nocnego nieba Pandory
const PANDORA_STARS_COUNT = 90;
const _pandoraStars = [];
for (let i = 0; i < PANDORA_STARS_COUNT; i++) {
  _pandoraStars.push({
    xRatio: (i * 0.01173 + 0.007) % 1.0,
    yRatio: (i * 0.00713 + 0.015) % 0.58, // górne 58% ekranu
    size: 0.7 + (i % 3) * 0.5,
    color: (i % 4 === 0) ? '#a5f3fc' : ((i % 4 === 1) ? '#c7d2fe' : ((i % 4 === 2) ? '#ffffff' : '#99f6e4')),
    twinkleSpeed: 1.2 + (i % 5) * 0.6,
    phase: i * 0.68
  });
}

// Funkcje zaślepkowe dla usuniętych snopów światła i poświaty (kompatybilność)
export function drawSunRays() {}
export function drawGodRays() {}
export function drawVolumetricLight() {}
export function drawLightBeams() {}

/**
 * Renderuje autorskie tło nocnej Pandory (Ancient Sanctuary / Arena 2):
 * - Kosmiczne, głębokie niebo (indygo, granat, szafir) z zamglonym szmaragdowo-cyjanowym horyzontem
 * - Całkowity brak oślepiającej tarczy słonecznej (czysta, nastrojowa noc)
 * - Mrugające delikatne gwiazdy i subtelna kosmiczna mgławica
 * - Lewitujące krasowe iglice (Hallelujah) z bioluminescencyjną cyjanową poświatą krawędzi
 * - Spływające kaskady świecącej, turkusowo-cyjanowej wody
 * - Nocne sylwetki potężnych banyanów z pulsującymi zarodnikami grzybów
 * - Unoszący się w powietrzu cyjanowo-szmaragdowy pył bioluminescencyjny
 */
export function drawPandoraBackground(ctx, camera) {
  if (!ctx) return;
  ctx.shadowBlur = 0;
  const W_screen = ctx.canvas?.width || (typeof window !== 'undefined' ? window.innerWidth : 1920);
  const H_screen = ctx.canvas?.height || (typeof window !== 'undefined' ? window.innerHeight : 1080);
  const time = performance.now() * 0.001;

  const camX = camera ? (camera.x || 0) : 0;
  const camY = camera ? (camera.y || 0) : 0;

  // -------------------------------------------------------------------------
  // WARSTWA 0: NOCNE NIEBO PANDORY (GŁĘBOKIE INDYGO, GRANAT, CYJANOWY HORYZONT)
  // ZERO SŁOŃCA / ZERO ŚWIECĄCEJ TARCZY
  // -------------------------------------------------------------------------
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H_screen);
  skyGrad.addColorStop(0.00, '#010309'); // kosmiczna czerń z odcieniem indygo
  skyGrad.addColorStop(0.22, '#040817'); // ciemny nocny szafir
  skyGrad.addColorStop(0.48, '#081226'); // głęboki nocny granat / indygo
  skyGrad.addColorStop(0.70, '#0b1c34'); // pruskie nocne indygo
  skyGrad.addColorStop(0.85, '#07242e'); // nocny morski cyjan
  skyGrad.addColorStop(1.00, '#041c22'); // szmaragdowo-cyjanowy horyzont Pandory
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W_screen, H_screen);

  // Delikatne gwiazdy nocnego nieba Pandory
  ctx.save();
  const starParallaxX = camX * 0.005;
  const starParallaxY = camY * 0.003;
  for (let i = 0; i < _pandoraStars.length; i++) {
    const st = _pandoraStars[i];
    const sx = ((st.xRatio * W_screen - starParallaxX) % W_screen + W_screen) % W_screen;
    const sy = st.yRatio * H_screen - starParallaxY;
    if (sy < 0 || sy > H_screen * 0.65) continue;

    const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * st.twinkleSpeed + st.phase));
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = st.color;
    ctx.beginPath();
    ctx.arc(sx, sy, st.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Eteryczna wstęga kosmicznej mgławicy / zorzy polarno-bioluminescencyjnej w trybie 'screen'
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const nebX = W_screen * 0.55 - camX * 0.008;
  const nebY = H_screen * 0.22 - camY * 0.005;
  const nebR = W_screen * 0.45;
  const nebGrad = ctx.createRadialGradient(nebX, nebY, 30, nebX, nebY, nebR);
  nebGrad.addColorStop(0.00, 'rgba(6, 182, 212, 0.12)'); // cyjan
  nebGrad.addColorStop(0.38, 'rgba(59, 130, 246, 0.06)'); // szafir
  nebGrad.addColorStop(0.72, 'rgba(99, 102, 241, 0.03)'); // indygo
  nebGrad.addColorStop(1.00, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = nebGrad;
  ctx.beginPath();
  ctx.arc(nebX, nebY, nebR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // -------------------------------------------------------------------------
  // WARSTWA 1: ZAMGLONE SZMARAGDOWO-CYJANOWE IGLICE KRASOWE (HALLELUJAH) [PARALAKSA 0.020]
  // -------------------------------------------------------------------------
  ctx.save();
  const farX = camX * 0.020;
  const farY = camY * 0.015;
  const farBaseY = H_screen * 0.74 - farY;
  const wrapW = W_screen + 800;

  const karstPeaks = [
    { x: 120, w: 230, h: 320, waist: 0.68, stupa: true, floatGap: 55 },
    { x: 440, w: 180, h: 420, waist: 0.55, stupa: false, floatGap: 0 },
    { x: 760, w: 290, h: 290, waist: 0.72, stupa: true, floatGap: 40 },
    { x: 1140, w: 340, h: 460, waist: 0.60, stupa: true, floatGap: 70 },
    { x: 1560, w: 220, h: 360, waist: 0.58, stupa: false, floatGap: 0 },
    { x: 1920, w: 380, h: 490, waist: 0.62, stupa: true, floatGap: 80 },
    { x: 2380, w: 240, h: 330, waist: 0.65, stupa: false, floatGap: 30 },
    { x: 2760, w: 350, h: 430, waist: 0.57, stupa: true, floatGap: 65 },
    { x: 3200, w: 270, h: 350, waist: 0.70, stupa: false, floatGap: 0 },
    { x: 3580, w: 310, h: 440, waist: 0.61, stupa: true, floatGap: 50 }
  ];

  for (let i = 0; i < karstPeaks.length; i++) {
    const kp = karstPeaks[i];
    const sx = (kp.x - farX) % wrapW - 300;
    if (sx < -kp.w - 100 || sx > W_screen + kp.w + 100) continue;

    const sy = farBaseY - kp.h;
    const peakBaseY = kp.floatGap > 0 ? (farBaseY - kp.floatGap) : (farBaseY + 60);

    // Ciemna bryła krasowej iglicy w nocnym odcieniu petrol/teal
    ctx.fillStyle = '#03121a';
    ctx.beginPath();
    ctx.moveTo(sx - kp.w * 0.45, peakBaseY);
    ctx.quadraticCurveTo(sx - kp.w * 0.55 * kp.waist, sy + kp.h * 0.55, sx - kp.w * 0.28, sy + kp.h * 0.22);
    ctx.quadraticCurveTo(sx - kp.w * 0.12, sy + kp.h * 0.06, sx, sy);
    ctx.quadraticCurveTo(sx + kp.w * 0.14, sy + kp.h * 0.08, sx + kp.w * 0.30, sy + kp.h * 0.25);
    ctx.quadraticCurveTo(sx + kp.w * 0.52 * kp.waist, sy + kp.h * 0.58, sx + kp.w * 0.46, peakBaseY);

    if (kp.floatGap > 0) {
      ctx.quadraticCurveTo(sx + kp.w * 0.22, peakBaseY + 38, sx, peakBaseY + 52);
      ctx.quadraticCurveTo(sx - kp.w * 0.22, peakBaseY + 38, sx - kp.w * 0.45, peakBaseY);
    } else {
      ctx.lineTo(sx - kp.w * 0.45, peakBaseY);
    }
    ctx.closePath();
    ctx.fill();

    // Szmaragdowo-cyjanowy mech bioluminescencyjny na szczycie iglicy
    ctx.fillStyle = '#06282e';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 3, kp.w * 0.24, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Delikatny cyjanowy rim-light na krawędzi szczytowej iglicy
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.22)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(sx - kp.w * 0.20, sy + 6);
    ctx.quadraticCurveTo(sx, sy, sx + kp.w * 0.20, sy + 6);
    ctx.stroke();

    // Spękania tektoniczne w głębi
    ctx.strokeStyle = 'rgba(2, 9, 14, 0.70)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(sx - kp.w * 0.08, sy + 18);
    ctx.quadraticCurveTo(sx - kp.w * 0.12, sy + kp.h * 0.45, sx - kp.w * 0.04, peakBaseY - 10);
    ctx.moveTo(sx + kp.w * 0.12, sy + 32);
    ctx.quadraticCurveTo(sx + kp.w * 0.08, sy + kp.h * 0.52, sx + kp.w * 0.16, peakBaseY - 15);
    ctx.stroke();

    // Starożytne stupy świątynne na szczytach iglic
    if (kp.stupa) {
      ctx.fillStyle = '#020b10';
      ctx.fillRect(sx - 14, sy - 8, 28, 8);
      ctx.fillRect(sx - 11, sy - 17, 22, 9);
      ctx.beginPath();
      ctx.moveTo(sx - 9, sy - 17);
      ctx.quadraticCurveTo(sx, sy - 34, sx + 9, sy - 17);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(sx - 13, sy - 33, 26, 3);
      ctx.fillRect(sx - 9, sy - 38, 18, 2.5);
      ctx.fillRect(sx - 5, sy - 43, 10, 2);
      ctx.beginPath();
      ctx.moveTo(sx - 2, sy - 43);
      ctx.lineTo(sx + 2, sy - 43);
      ctx.lineTo(sx, sy - 60);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Nocna mgła dolinna u podnóża krasowych iglic
  const farMist = ctx.createLinearGradient(0, farBaseY - 110, 0, farBaseY + 90);
  farMist.addColorStop(0.0, 'rgba(4, 22, 28, 0)');
  farMist.addColorStop(0.35, 'rgba(6, 32, 40, 0.45)');
  farMist.addColorStop(0.70, 'rgba(5, 26, 32, 0.68)');
  farMist.addColorStop(1.0, 'rgba(2, 14, 18, 0.88)');
  ctx.fillStyle = farMist;
  ctx.fillRect(0, farBaseY - 110, W_screen, 200);

  ctx.restore();

  // -------------------------------------------------------------------------
  // WARSTWA 2: BIOLUMINESCENCYJNE WODOSPADY I NOCNY BALDACHIM [PARALAKSA 0.055]
  // -------------------------------------------------------------------------
  ctx.save();
  const midX = camX * 0.055;
  const midY = camY * 0.035;
  const midBaseY = H_screen * 0.81 - midY;
  const canopyWrap = W_screen + 600;

  const domeCount = 20;
  const domeStep = canopyWrap / domeCount;

  // 1. Tylna ciemniejsza warstwa baldachimu (nocny grafitowy szmaragd)
  ctx.fillStyle = '#021418';
  ctx.beginPath();
  ctx.moveTo(-100, H_screen);
  ctx.lineTo(-100, midBaseY);
  for (let d = 0; d <= domeCount + 1; d++) {
    const dx = (d * domeStep - midX * 0.85) % canopyWrap - 200;
    const treeH = 105 + Math.sin(d * 1.5) * 40 + Math.cos(d * 2.1) * 25;
    const dy = midBaseY - treeH;
    ctx.quadraticCurveTo(dx - domeStep * 0.35, dy - 18, dx, dy);
    ctx.quadraticCurveTo(dx + domeStep * 0.35, dy + 16, dx + domeStep * 0.5, midBaseY);
  }
  ctx.lineTo(W_screen + 100, midBaseY);
  ctx.lineTo(W_screen + 100, H_screen);
  ctx.closePath();
  ctx.fill();

  // 2. Przednia nasycona warstwa baldachimu w odcieniach głębokiego nocnego tealu (#042327 i #021619)
  const midCanopyGrad = ctx.createLinearGradient(0, midBaseY - 160, 0, midBaseY + 100);
  midCanopyGrad.addColorStop(0.0, '#042327');
  midCanopyGrad.addColorStop(0.45, '#021619');
  midCanopyGrad.addColorStop(1.0, '#010c0e');
  ctx.fillStyle = midCanopyGrad;

  ctx.beginPath();
  ctx.moveTo(-100, H_screen);
  ctx.lineTo(-100, midBaseY);
  for (let d = 0; d <= domeCount + 1; d++) {
    const dx = (d * domeStep - midX) % canopyWrap - 200;
    const treeH = 90 + Math.sin(d * 1.9 + 1.2) * 50 + Math.cos(d * 2.7) * 32;
    const dy = midBaseY - treeH;
    ctx.quadraticCurveTo(dx - domeStep * 0.30, dy - 24, dx, dy);
    ctx.quadraticCurveTo(dx + domeStep * 0.30, dy + 20, dx + domeStep * 0.5, midBaseY);
  }
  ctx.lineTo(W_screen + 100, midBaseY);
  ctx.lineTo(W_screen + 100, H_screen);
  ctx.closePath();
  ctx.fill();

  // TRZY GÓRSKIE WODOSPADY Z BIOLUMINESCENCYJNĄ CYJANOWĄ POŚWIATĄ
  const waterfalls = [
    { xRel: 0.22, startYOff: -160, len: 195, w: 18, speed: 170 },
    { xRel: 0.58, startYOff: -190, len: 230, w: 22, speed: 190 },
    { xRel: 0.85, startYOff: -150, len: 180, w: 16, speed: 160 }
  ];

  for (let wf of waterfalls) {
    const wx = (W_screen * wf.xRel - midX) % canopyWrap - 200;
    if (wx < -80 || wx > W_screen + 80) continue;

    const startY = midBaseY + wf.startYOff;
    const endY = startY + wf.len;

    // Skalna półka kaskady
    ctx.fillStyle = '#020e12';
    ctx.beginPath();
    ctx.ellipse(wx + wf.w * 0.5, startY + 2, wf.w * 1.3, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Główny strumień wody kaskady z nocnym cyjanem
    const wfGrad = ctx.createLinearGradient(wx, startY, wx + wf.w, startY);
    wfGrad.addColorStop(0.0, 'rgba(8, 64, 76, 0.80)');
    wfGrad.addColorStop(0.28, '#06b6d4');
    wfGrad.addColorStop(0.68, '#38bdf8');
    wfGrad.addColorStop(1.0, 'rgba(8, 64, 76, 0.80)');
    ctx.fillStyle = wfGrad;

    ctx.beginPath();
    ctx.moveTo(wx, startY);
    ctx.lineTo(wx + wf.w, startY);
    ctx.quadraticCurveTo(wx + wf.w * 0.82, startY + wf.len * 0.5, wx + wf.w * 0.70, endY);
    ctx.lineTo(wx + wf.w * 0.30, endY);
    ctx.quadraticCurveTo(wx + wf.w * 0.18, startY + wf.len * 0.5, wx, startY);
    ctx.closePath();
    ctx.fill();

    // Animowane spływające smugi piany
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.6;
    const yOff = (time * wf.speed) % 28;
    for (let py = startY + yOff; py < endY - 6; py += 28) {
      ctx.beginPath();
      ctx.moveTo(wx + wf.w * 0.32, py);
      ctx.lineTo(wx + wf.w * 0.68, py + 12);
      ctx.stroke();
    }

    // Pióropusz bioluminescencyjnej mgły wodnej u dołu wodospadu (tryb 'screen')
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const mistR = wf.w * 2.4;
    const mistGrad = ctx.createRadialGradient(wx + wf.w * 0.5, endY, 4, wx + wf.w * 0.5, endY, mistR);
    mistGrad.addColorStop(0.0, 'rgba(165, 243, 252, 0.45)');
    mistGrad.addColorStop(0.48, 'rgba(34, 211, 238, 0.22)');
    mistGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = mistGrad;
    ctx.beginPath();
    ctx.arc(wx + wf.w * 0.5, endY, mistR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Monumentalne nocne liany przewieszone w powietrzu
  ctx.strokeStyle = '#010c0e';
  ctx.lineWidth = 4.0;
  for (let l = 0; l < 2; l++) {
    const lx1 = (W_screen * (0.24 + l * 0.45) - midX) % canopyWrap - 200;
    const lx2 = lx1 + 280;
    const ly = midBaseY - 110 + l * 25;
    ctx.beginPath();
    ctx.moveTo(lx1, ly);
    ctx.quadraticCurveTo(lx1 + 140, ly + 65, lx2, ly - 10);
    ctx.stroke();
  }

  ctx.restore();

  // -------------------------------------------------------------------------
  // WARSTWA 3: NOCNE SYLWETKI BANYANÓW I ZARODNIKI [PARALAKSA 0.11]
  // -------------------------------------------------------------------------
  ctx.save();
  const nearX = camX * 0.11;
  const nearY = camY * 0.07;
  const nearBaseY = H_screen * 0.91 - nearY;
  const trunkWrap = W_screen + 700;

  const bigTrunks = [
    { xRel: 70, w: 105, h: 510 },
    { xRel: 560, w: 130, h: 560 },
    { xRel: 1180, w: 145, h: 530 },
    { xRel: 1780, w: 110, h: 490 },
    { xRel: 2340, w: 135, h: 550 },
    { xRel: 2950, w: 120, h: 520 }
  ];

  for (let i = 0; i < bigTrunks.length; i++) {
    const tr = bigTrunks[i];
    const tx = (tr.xRel - nearX) % trunkWrap - 250;
    if (tx < -tr.w - 150 || tx > W_screen + tr.w + 150) continue;

    const topY = nearBaseY - tr.h;

    // Organiczna nocna sylwetka pnia banyanu
    ctx.fillStyle = '#010a0c';
    ctx.beginPath();
    ctx.moveTo(tx - tr.w * 0.85, H_screen);
    ctx.quadraticCurveTo(tx - tr.w * 0.50, nearBaseY - tr.h * 0.25, tx - tr.w * 0.35, topY + tr.h * 0.20);
    ctx.quadraticCurveTo(tx - tr.w * 0.45, topY, tx - tr.w * 0.25, topY);
    ctx.lineTo(tx + tr.w * 0.25, topY);
    ctx.quadraticCurveTo(tx + tr.w * 0.45, topY, tx + tr.w * 0.35, topY + tr.h * 0.20);
    ctx.quadraticCurveTo(tx + tr.w * 0.50, nearBaseY - tr.h * 0.25, tx + tr.w * 0.85, H_screen);
    ctx.closePath();
    ctx.fill();

    // Centralny grzbiet pnia
    ctx.strokeStyle = '#02161b';
    ctx.lineWidth = tr.w * 0.22;
    ctx.beginPath();
    ctx.moveTo(tx, topY + 20);
    ctx.quadraticCurveTo(tx + 8, topY + tr.h * 0.5, tx - 6, H_screen);
    ctx.stroke();

    // Świecące bioluminescencyjne zarodniki na korze pnia (tryb 'screen')
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let sp = 0; sp < 4; sp++) {
      const spY = topY + 80 + sp * 85;
      const spX = tx - tr.w * 0.15 + ((sp * 31) % (tr.w * 0.3));
      const spGlow = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time * 2.2 + sp + i));
      ctx.fillStyle = sp % 2 === 0 ? `rgba(34, 211, 238, ${spGlow * 0.75})` : `rgba(52, 211, 153, ${spGlow * 0.65})`;
      ctx.beginPath();
      ctx.arc(spX, spY, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Zwieszające się nocne liany
    ctx.strokeStyle = '#010809';
    ctx.lineWidth = 2.4;
    for (let l = 0; l < 4; l++) {
      const lx = tx - tr.w * 0.3 + l * (tr.w * 0.22);
      const lLen = 150 + ((l * 47 + i * 29) % 210);
      const sway = Math.sin(time * 1.5 + l * 0.9 + tx * 0.008) * 11;

      ctx.beginPath();
      ctx.moveTo(lx, topY + 60);
      ctx.quadraticCurveTo(lx + sway * 0.5, topY + 60 + lLen * 0.5, lx + sway, topY + 60 + lLen);
      ctx.stroke();

      ctx.fillStyle = '#041d24';
      ctx.beginPath();
      ctx.ellipse(lx + sway, topY + 60 + lLen, 3.2, 1.8, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Zarys tropikalnych paproci na dolnej krawędzi
  ctx.strokeStyle = '#010c0e';
  ctx.lineWidth = 3.5;
  for (let f = 0; f < 16; f++) {
    const fx = (f * 160 - nearX) % (W_screen + 350) - 100;
    const fy = nearBaseY + 15;
    for (let fr = -2; fr <= 2; fr++) {
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.quadraticCurveTo(fx + fr * 24, fy - 48, fx + fr * 38, fy - 72);
      ctx.stroke();
    }
  }

  ctx.restore();

  // -------------------------------------------------------------------------
  // WARSTWA 4: PŁYWAJĄCY BIOLUMINESCENCYJNY PYŁ PANDORY (60 FPS)
  // -------------------------------------------------------------------------
  ctx.save();
  ctx.shadowBlur = 0;
  for (let m = 0; m < _bgJungleMotes.length; m++) {
    const mt = _bgJungleMotes[m];
    const mx = (mt.seedX + Math.sin(time * mt.swaySpeed + mt.phase) * mt.swayAmp - camX * 0.03 % W_screen + W_screen) % W_screen;
    const my = ((mt.seedY + time * mt.speedY) % H_screen + H_screen) % H_screen;

    const sinP = Math.sin(time * mt.pulseSpeed + mt.phase);
    const alpha = 0.30 + 0.55 * (0.5 + 0.5 * sinP);

    if (mt.hueType === 0) {
      ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`; // neonowy cyjan
    } else if (mt.hueType === 1) {
      ctx.fillStyle = `rgba(45, 212, 191, ${alpha * 0.95})`; // morski turkus
    } else {
      ctx.fillStyle = `rgba(110, 231, 183, ${alpha * 0.85})`; // szmaragdowa mięta
    }

    ctx.beginPath();
    ctx.arc(mx, my, mt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export { drawArena1Background } from './arenas/arena1.js';
