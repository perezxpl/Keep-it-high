// =========================================================================
// BACKGROUND.JS - GŁĘBOKIE PODZIEMNE ŚCIANY SKALNE, GŁĘBIA PRZESTRZENNA I DYM
// Surowa, naturalna grota skalna: brak prymitywów, realistyczna głębia i światło
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

  // 4. WOLNO UNOSZĄCE SIĘ DROBINY PYŁU JASKINIOWEGO (1-2px, alpha 0.15–0.3)
  ctx.save();
  const moteCount = 50;
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

// Wygenerowany obraz tła Areny 2 (Hallelujah Mountains / Pandora)
const pandoraBgImage = new Image();
pandoraBgImage.src = 'assets/pandora_arena2_bg.jpg';

// =========================================================================
// ARENA 2: HALLELUJAH MOUNTAINS (PANDORA) - UNIKALNE OBCE TŁO 3-WARSTWOWE
// =========================================================================
/**
 * Renderuje 3-warstwowe tło obcej biosfery Pandory dla Areny 2:
 * 1. Warstwa kosmiczna: zmierzchowe fioletowo-granatowe niebo (#0B0F19 do #1E1B4B)
 *    oraz gigantyczny gazowy olbrzym Polyphemus z pasami chmur i pierścieniami.
 * 2. Średnia warstwa paralaksy: zamglone sylwetki dalszych lewitujących wysp (#1E293B z 40% kryciem).
 * 3. Dolne morze chmur: wolno przesuwające się gęste obłoki (y: 1150–1400) z gradientem rozmycia.
 */
export function drawPandoraBackground(ctx, camera) {
  if (!ctx) return;
  const W_screen = ctx.canvas?.width || (typeof window !== 'undefined' ? window.innerWidth : 1920);
  const H_screen = ctx.canvas?.height || (typeof window !== 'undefined' ? window.innerHeight : 1080);
  const time = performance.now() * 0.001;

  const camX = camera ? (camera.x || 0) : 0;
  const camY = camera ? (camera.y || 0) : 0;
  const zoom = camera ? (camera.zoom || 1) : 1;

  // -------------------------------------------------------------------------
  // OBRAZ TŁA (cover-fit + delikatna paralaksa kamery). Fallback: procedura poniżej.
  // -------------------------------------------------------------------------
  if (pandoraBgImage.complete && pandoraBgImage.naturalWidth > 0) {
    const iw = pandoraBgImage.naturalWidth;
    const ih = pandoraBgImage.naturalHeight;
    const overscan = 1.04; // zapas na ruch paralaksy
    const scale = Math.max(W_screen / iw, H_screen / ih) * overscan;
    const dw = iw * scale;
    const dh = ih * scale;
    const slackX = dw - W_screen;
    const slackY = dh - H_screen;
    // Przesunięcie 0..1 wg pozycji kamery na arenie (3600x1400)
    const tx = Math.max(0, Math.min(1, camX / 3600));
    const ty = Math.max(0, Math.min(1, camY / 1400));
    const dx = -slackX * tx;
    // Kadr przesunięty ku górze: widać planetę i platformy, bez znaku wodnego na dole obrazu
    const dy = -slackY * (0.18 + 0.25 * ty);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(pandoraBgImage, dx, dy, dw, dh);
    ctx.restore();
    return;
  }

  // -------------------------------------------------------------------------
  // WARSTWA 1: KOSMICZNE NIEBO, GWIAZDY I GAZOWY OLBRZYM (POLYPHEMUS)
  // -------------------------------------------------------------------------
  // A. Zmierzchowe, fioletowo-granatowe niebo (#0B0F19 do #1E1B4B)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H_screen);
  skyGrad.addColorStop(0.00, '#0B0F19');
  skyGrad.addColorStop(0.38, '#10132B');
  skyGrad.addColorStop(0.72, '#18173E');
  skyGrad.addColorStop(1.00, '#1E1B4B');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W_screen, H_screen);

  // B. Subtelne migoczące gwiazdy w górnych partiach atmosfery
  ctx.save();
  const starCount = 45;
  for (let s = 0; s < starCount; s++) {
    const sx = (s * 89.37) % W_screen;
    const sy = (s * 43.19) % (H_screen * 0.55);
    const twinkle = 0.4 + 0.6 * Math.sin(time * 1.8 + s * 1.7);
    const starAlpha = Math.max(0.05, Math.min(0.85, (0.35 + (s % 3) * 0.2) * twinkle));
    const starR = (s % 7 === 0) ? 1.6 : 1.0;
    ctx.fillStyle = `rgba(224, 242, 254, ${starAlpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, starR, 0, Math.PI * 2);
    ctx.fill();
  }

  // C. Gigantyczny gazowy olbrzym (Polyphemus) w prawym górnym rogu z pasami chmur i pierścieniami
  // Pozycja z delikatną paralaksą (0.012)
  const polyCenterX = W_screen * 0.82 - (camX * 0.012);
  const polyCenterY = H_screen * 0.24 - (camY * 0.012);
  const polyR = Math.max(85, Math.min(170, Math.min(W_screen, H_screen) * 0.17));

  ctx.save();
  ctx.translate(polyCenterX, polyCenterY);

  // Cień i tylna część pierścieni planetarnych (przed narysowaniem globu)
  const ringTilt = -0.38; // Kąt pochylenia płaszczyzny pierścieni (~ -22 stopnie)
  const ringRx = polyR * 2.35;
  const ringRy = polyR * 0.44;

  ctx.save();
  ctx.rotate(ringTilt);

  // Tylna połowa pierścieni (y < 0 w układzie obróconym)
  ctx.beginPath();
  ctx.rect(-ringRx - 20, -ringRy - 20, (ringRx + 20) * 2, ringRy + 20);
  ctx.clip();

  // Zewnętrzny pierścień lodowy A
  ctx.beginPath();
  ctx.ellipse(0, 0, ringRx, ringRy, 0, 0, Math.PI * 2);
  ctx.lineWidth = polyR * 0.22;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.stroke();

  // Przerwa Cassiniego (ciemna szczelina)
  ctx.beginPath();
  ctx.ellipse(0, 0, ringRx * 0.86, ringRy * 0.86, 0, 0, Math.PI * 2);
  ctx.lineWidth = polyR * 0.04;
  ctx.strokeStyle = 'rgba(11, 15, 25, 0.7)';
  ctx.stroke();

  // Wewnętrzny pierścień B (gęstszy błękitny)
  ctx.beginPath();
  ctx.ellipse(0, 0, ringRx * 0.74, ringRy * 0.74, 0, 0, Math.PI * 2);
  ctx.lineWidth = polyR * 0.18;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
  ctx.stroke();

  ctx.restore();

  // Glob gazowego olbrzyma (Polyphemus)
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, polyR, 0, Math.PI * 2);
  ctx.clip();

  // Tło bazowe tarczy planety
  const planetBase = ctx.createLinearGradient(-polyR, -polyR, polyR, polyR);
  planetBase.addColorStop(0.0, '#0e7490');
  planetBase.addColorStop(0.5, '#1e1b4b');
  planetBase.addColorStop(1.0, '#090d16');
  ctx.fillStyle = planetBase;
  ctx.fill();

  // Pasma chmur gazowych (alternujące warstwy cyjanu, indygo i purpury)
  const bandCount = 14;
  for (let b = 0; b < bandCount; b++) {
    const by = -polyR + (b / bandCount) * (polyR * 2);
    const bh = (polyR * 2) / bandCount;
    const bandWave = Math.sin(b * 1.3) * 6;

    let bandColor = 'rgba(30, 27, 75, 0.55)';
    if (b % 4 === 0) bandColor = 'rgba(14, 116, 144, 0.45)';
    else if (b % 4 === 1) bandColor = 'rgba(67, 56, 202, 0.40)';
    else if (b % 4 === 2) bandColor = 'rgba(21, 94, 117, 0.50)';
    else bandColor = 'rgba(49, 46, 129, 0.60)';

    ctx.fillStyle = bandColor;
    ctx.beginPath();
    ctx.ellipse(0, by + bh / 2, polyR * 1.05, bh * 0.75 + Math.abs(bandWave) * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ciemna cyjanowa plama burzowa (Great Storm Eye)
  const stormX = polyR * 0.32;
  const stormY = polyR * 0.12;
  const stormGrad = ctx.createRadialGradient(stormX, stormY, 2, stormX, stormY, polyR * 0.22);
  stormGrad.addColorStop(0.0, 'rgba(34, 211, 238, 0.85)');
  stormGrad.addColorStop(0.4, 'rgba(14, 116, 144, 0.65)');
  stormGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.0)');
  ctx.fillStyle = stormGrad;
  ctx.beginPath();
  ctx.ellipse(stormX, stormY, polyR * 0.22, polyR * 0.12, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Sferyczne oświetlenie i głęboki cień planety (oświetlenie z lewego-góry)
  const shadowGrad = ctx.createRadialGradient(-polyR * 0.45, -polyR * 0.45, polyR * 0.15, polyR * 0.25, polyR * 0.25, polyR * 1.05);
  shadowGrad.addColorStop(0.00, 'rgba(255, 255, 255, 0.15)');
  shadowGrad.addColorStop(0.45, 'rgba(0, 0, 0, 0.0)');
  shadowGrad.addColorStop(0.78, 'rgba(5, 8, 16, 0.65)');
  shadowGrad.addColorStop(1.00, 'rgba(3, 5, 10, 0.94)');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, polyR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // Koniec clip globu

  // Przednia część pierścieni planetarnych (przechodząca przed planetą z cieniem)
  ctx.save();
  ctx.rotate(ringTilt);
  ctx.beginPath();
  ctx.rect(-ringRx - 20, 0, (ringRx + 20) * 2, ringRy + 20);
  ctx.clip();

  ctx.beginPath();
  ctx.ellipse(0, 0, ringRx, ringRy, 0, 0, Math.PI * 2);
  ctx.lineWidth = polyR * 0.22;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.42)';
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, 0, ringRx * 0.86, ringRy * 0.86, 0, 0, Math.PI * 2);
  ctx.lineWidth = polyR * 0.04;
  ctx.strokeStyle = 'rgba(11, 15, 25, 0.8)';
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, 0, ringRx * 0.74, ringRy * 0.74, 0, 0, Math.PI * 2);
  ctx.lineWidth = polyR * 0.18;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.stroke();
  ctx.restore();

  // Atmosferyczna luminescencja wokół Polyphemusa (screen bloom)
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const bloomGrad = ctx.createRadialGradient(0, 0, polyR * 0.92, 0, 0, polyR * 1.25);
  bloomGrad.addColorStop(0.0, 'rgba(34, 211, 238, 0.22)');
  bloomGrad.addColorStop(0.6, 'rgba(129, 140, 248, 0.10)');
  bloomGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = bloomGrad;
  ctx.beginPath();
  ctx.arc(0, 0, polyR * 1.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Mały naturalny satelita w pobliżu planety
  const moonX = -polyR * 1.55;
  const moonY = polyR * 0.85;
  const moonR = polyR * 0.10;
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
  ctx.beginPath();
  ctx.arc(moonX + moonR * 0.35, moonY, moonR * 0.85, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // Koniec układu Polyphemus

  // -------------------------------------------------------------------------
  // WARSTWA 2: ODLEGŁE GÓRY HALLELUJAH (ŚREDNIA WARSTWA PARALAKSY)
  // Niski kontrast, barwa #1E293B z 40% kryciem (rgba(30, 41, 59, 0.40))
  // -------------------------------------------------------------------------
  ctx.save();
  const distantIslands = [
    { worldX: 420, worldY: 340, w: 320, h: 220, stalactiteH: 190 },
    { worldX: 1100, worldY: 260, w: 260, h: 180, stalactiteH: 150 },
    { worldX: 1850, worldY: 320, w: 420, h: 260, stalactiteH: 230 },
    { worldX: 2650, worldY: 240, w: 290, h: 190, stalactiteH: 160 },
    { worldX: 3350, worldY: 360, w: 350, h: 240, stalactiteH: 210 }
  ];

  const parallaxFactorX = 0.10;
  const parallaxFactorY = 0.08;

  ctx.fillStyle = 'rgba(30, 41, 59, 0.40)';
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
  ctx.lineWidth = 1.5;

  for (let i = 0; i < distantIslands.length; i++) {
    const isl = distantIslands[i];
    // Rzutowanie na współrzędne ekranu z paralaksą
    const scrX = (isl.worldX - camX * parallaxFactorX) * zoom + (W_screen * 0.15);
    const scrY = (isl.worldY - camY * parallaxFactorY) * zoom + (H_screen * 0.18);
    const w = isl.w * zoom;
    const h = isl.h * zoom;
    const stalH = isl.stalactiteH * zoom;

    if (scrX + w < -100 || scrX > W_screen + 100) continue;

    ctx.beginPath();
    // Płaski, lekko zaokrąglony wierzchołek wyspy
    ctx.moveTo(scrX, scrY);
    ctx.quadraticCurveTo(scrX + w * 0.5, scrY - h * 0.15, scrX + w, scrY);
    // Poszarpany bok prawy
    ctx.lineTo(scrX + w * 0.92, scrY + h * 0.35);
    ctx.lineTo(scrX + w * 0.78, scrY + h * 0.70);
    // Dolny stalaktyt zwisający w dół
    ctx.lineTo(scrX + w * 0.52, scrY + h + stalH);
    // Poszarpany bok lewy
    ctx.lineTo(scrX + w * 0.28, scrY + h * 0.65);
    ctx.lineTo(scrX + w * 0.08, scrY + h * 0.30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Drobna strugka odległego wodospadu zamglonego w oddali
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = 1.8 * zoom;
    ctx.beginPath();
    ctx.moveTo(scrX + w * 0.42, scrY + h * 0.25);
    ctx.lineTo(scrX + w * 0.42, scrY + h * 0.85);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // -------------------------------------------------------------------------
  // WARSTWA 3: DOLNE MORZE CHMUR (Y: 1150–1400) Z ŁAGODNYM GRADIENTEM ROZMYCIA
  // -------------------------------------------------------------------------
  ctx.save();

  // Wyliczenie pozycji horyzontu chmur na ekranie na podstawie kamery
  const cloudWorldTop = 1150;
  const cloudWorldBottom = 1400;
  const cloudScreenTop = (cloudWorldTop - camY) * zoom;
  const cloudScreenBottom = (cloudWorldBottom - camY) * zoom;

  // Podstawa morza chmur wypełniająca dół ekranu
  const cloudFloorY = Math.max(H_screen * 0.60, cloudScreenTop);
  const cloudHeight = Math.max(H_screen - cloudFloorY + 120, 260);

  // Gradient pionowy głębi morza chmur (łagodny gradient rozmycia)
  const cloudGrad = ctx.createLinearGradient(0, cloudFloorY - 60, 0, H_screen);
  cloudGrad.addColorStop(0.00, 'rgba(15, 23, 42, 0.00)');
  cloudGrad.addColorStop(0.25, 'rgba(30, 41, 59, 0.48)');
  cloudGrad.addColorStop(0.60, 'rgba(15, 23, 42, 0.85)');
  cloudGrad.addColorStop(1.00, 'rgba(8, 12, 22, 0.98)');
  ctx.fillStyle = cloudGrad;
  ctx.fillRect(0, cloudFloorY - 60, W_screen, cloudHeight + 80);

  // Wolno przesuwające się kłęby gęstych obłoków (3 warstwy falujących krzywych i puchów)
  const cloudLayers = [
    { speed: 12, alpha: 0.32, color: '#334155', yOffset: -25, r: 65 },
    { speed: 22, alpha: 0.45, color: '#1e293b', yOffset: 15, r: 85 },
    { speed: 32, alpha: 0.60, color: '#0f172a', yOffset: 45, r: 110 }
  ];

  for (let cl = 0; cl < cloudLayers.length; cl++) {
    const layer = cloudLayers[cl];
    const offset = (time * layer.speed + cl * 180) % (W_screen + 240);
    ctx.fillStyle = layer.color;
    ctx.globalAlpha = layer.alpha;

    ctx.beginPath();
    const segW = 120;
    const startX = -140;
    const endX = W_screen + 140;

    ctx.moveTo(startX, H_screen);
    for (let cx = startX; cx <= endX; cx += segW) {
      const puffY = cloudFloorY + layer.yOffset + Math.sin((cx + offset) * 0.015 + cl) * 22;
      ctx.quadraticCurveTo(
        cx + segW * 0.5,
        puffY - layer.r * 0.45,
        cx + segW,
        puffY
      );
    }
    ctx.lineTo(endX, H_screen);
    ctx.closePath();
    ctx.fill();
  }

  // Wstęgi prądów wznoszących (subtelne smugi pary unoszące się pionowo)
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 1.4;
  for (let u = 0; u < 12; u++) {
    const ux = ((u * 170.83) + (time * 8.0) + W_screen * 10) % W_screen;
    const uyStart = cloudFloorY + 40;
    const uyLen = 70 + Math.sin(time * 2.0 + u) * 25;
    ctx.beginPath();
    ctx.moveTo(ux, uyStart);
    ctx.lineTo(ux + Math.sin(time * 1.5 + u) * 12, uyStart - uyLen);
    ctx.stroke();
  }

  ctx.restore();
}

