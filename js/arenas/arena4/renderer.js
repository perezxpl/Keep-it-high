// =========================================================================
// ARENAS/ARENA4/RENDERER.JS - POTOK RENDEROWANIA OBSIDIAN CALDERA
// Atmosfera kaldery, wielowarstwowe tło, paralaksa, organiczne pęknięcia termiczne,
// realistyczna płynna magma z krami i trójwarstwowe erupcje gejzerów
// ZERO ctx.filter, ZERO ctx.shadowBlur - Gwarancja 60 FPS
// =========================================================================

import { ARENA_4_WIDTH, ARENA_4_HEIGHT } from './state.js';

/**
 * Pre-renderuje klimatyczne tło kaldery wulkanicznej w skali 1:1 (3800x1500)
 */
export function renderCalderaBackgroundBuffer(ctx) {
  if (!ctx) return;

  const w = ARENA_4_WIDTH;
  const h = ARENA_4_HEIGHT;

  // 1. Mroczna, gorąca atmosfera kaldery (ambient glow od dołu)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0.00, '#050304'); // Smolisty strop jaskini
  skyGrad.addColorStop(0.25, '#120504');
  skyGrad.addColorStop(0.55, '#220805'); // Środkowa poświata
  skyGrad.addColorStop(0.85, '#3b0d07'); // Blask od jeziora magmy
  skyGrad.addColorStop(1.00, '#5c1409');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Skalne nawisy i stalaktyty stropu kaldery (y: 0..220)
  ctx.fillStyle = '#080507';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w, 120);
  for (let sx = w; sx >= 0; sx -= 80) {
    const stalactiteLen = 60 + ((sx * 17) % 110);
    ctx.lineTo(sx - 40, stalactiteLen);
    ctx.lineTo(sx - 80, 50 + ((sx * 7) % 40));
  }
  ctx.closePath();
  ctx.fill();

  // 3. Chmury wulkanicznego pyłu i dymu w tle
  ctx.fillStyle = 'rgba(28, 9, 7, 0.55)';
  ctx.beginPath();
  ctx.ellipse(500, 420, 620, 140, -0.04, 0, Math.PI * 2);
  ctx.ellipse(1500, 360, 780, 150, 0.02, 0, Math.PI * 2);
  ctx.ellipse(2600, 400, 740, 140, -0.02, 0, Math.PI * 2);
  ctx.ellipse(3500, 380, 580, 130, 0.03, 0, Math.PI * 2);
  ctx.fill();

  // 4. Daleki pierścień kaldery z fasetowanymi turniami i szczelinami
  ctx.fillStyle = '#0b070a';
  ctx.beginPath();
  ctx.moveTo(0, 350);
  ctx.lineTo(350, 480);
  ctx.lineTo(750, 410);
  ctx.lineTo(1250, 560);
  ctx.lineTo(1750, 490);
  ctx.lineTo(2250, 570);
  ctx.lineTo(2750, 460);
  ctx.lineTo(3250, 540);
  ctx.lineTo(w, 360);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Ściany skalne z żyłami stygnącej lawy w tle
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.moveTo(280, 390); ctx.lineTo(380, 510); ctx.lineTo(340, 680); ctx.lineTo(410, 850);
  ctx.moveTo(1350, 480); ctx.lineTo(1420, 620); ctx.lineTo(1580, 780); ctx.lineTo(1510, 960);
  ctx.moveTo(2550, 470); ctx.lineTo(2680, 610); ctx.lineTo(2620, 790); ctx.lineTo(2740, 950);
  ctx.stroke();

  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(280, 390); ctx.lineTo(380, 510); ctx.lineTo(340, 680); ctx.lineTo(410, 850);
  ctx.moveTo(1350, 480); ctx.lineTo(1420, 620); ctx.lineTo(1580, 780); ctx.lineTo(1510, 960);
  ctx.moveTo(2550, 470); ctx.lineTo(2680, 610); ctx.lineTo(2620, 790); ctx.lineTo(2740, 950);
  ctx.stroke();

  // 5. Ciężka magistrala rurociągów geotermalnych w średnim tle
  ctx.strokeStyle = '#140f13';
  ctx.lineWidth = 10.0;
  ctx.beginPath();
  ctx.moveTo(0, 690);
  ctx.lineTo(1100, 720);
  ctx.lineTo(2500, 690);
  ctx.lineTo(w, 730);
  ctx.stroke();

  ctx.strokeStyle = '#221921';
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.moveTo(0, 688);
  ctx.lineTo(1100, 718);
  ctx.lineTo(2500, 688);
  ctx.lineTo(w, 728);
  ctx.stroke();

  // Słupy kratownicowe podtrzymujące rurociąg
  ctx.fillStyle = '#100c0f';
  for (let rx = 250; rx < w; rx += 420) {
    ctx.fillRect(rx - 8, 700, 16, 420);

    // Czerwona lampa ostrzegawcza
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(rx - 3, 692, 6, 6);
    ctx.fillStyle = '#100c0f';
  }
}

/**
 * Rysuje tło panoramiczne, paralaksę dalekich iglic oraz strukturę kaldery w skali 1:1
 */
export function drawCalderaBackground(ctx, camera, bgCanvas, calderaCanvas, animTime = 0) {
  const canvasW = (ctx.canvas && ctx.canvas.width) ? (ctx.canvas.clientWidth || ctx.canvas.width) : 1920;
  const canvasH = (ctx.canvas && ctx.canvas.height) ? (ctx.canvas.clientHeight || ctx.canvas.height) : 1080;

  const camX = camera ? (camera.x || 0) : 0;
  const camY = camera ? (camera.y || 0) : 0;

  // 1. Ekranowy bazowy gradient atmosfery kaldery wulkanicznej
  const skyGrad = ctx.createLinearGradient(0, 0, 0, canvasH);
  skyGrad.addColorStop(0.00, '#050304'); // Smolisty strop
  skyGrad.addColorStop(0.30, '#100404');
  skyGrad.addColorStop(0.65, '#220805'); // Środkowa poświata
  skyGrad.addColorStop(0.90, '#380a06'); // Blask od jeziora magmy
  skyGrad.addColorStop(1.00, '#541208');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // 2. Dymiące tło krateru z bufora z paralaksą (0.22x prędkości kamery)
  if (bgCanvas) {
    ctx.save();
    const bgDrawX = -camX * 0.22;
    const bgDrawY = -camY * 0.12;
    ctx.drawImage(bgCanvas, bgDrawX, bgDrawY);
    ctx.restore();
  }

  // 3. Paralaksa dalekich iglic bazaltowych (0.38x prędkości kamery, płynne zapętlenie ekranowe)
  if (camera && typeof camera.x === 'number') {
    ctx.save();
    const spirePeriod = 420;
    const spireOffset = ((-camX * 0.38) % spirePeriod + spirePeriod) % spirePeriod;
    ctx.fillStyle = 'rgba(18, 11, 15, 0.70)';
    for (let sx = spireOffset - spirePeriod; sx <= canvasW + spirePeriod; sx += spirePeriod) {
      const spireH = 260 + (Math.abs(Math.sin(sx * 0.015)) * 140);
      ctx.beginPath();
      ctx.moveTo(sx - 55, canvasH);
      ctx.lineTo(sx, canvasH - spireH);
      ctx.lineTo(sx + 55, canvasH);
      ctx.closePath();
      ctx.fill();

      // Dolne rozświetlenie iglic ciepłą poświatą lawy
      const spireGlow = ctx.createLinearGradient(0, canvasH, 0, canvasH - 160);
      spireGlow.addColorStop(0.0, 'rgba(234, 88, 12, 0.25)');
      spireGlow.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = spireGlow;
      ctx.fill();
      ctx.fillStyle = 'rgba(18, 11, 15, 0.70)';
    }
    ctx.restore();
  }

  // 4. Rysowanie bazaltowej struktury Obsidian Caldera w przestrzeni świata
  if (camera && typeof camera.x === 'number' && typeof camera.y === 'number' && calderaCanvas) {
    ctx.save();
    const zoom = camera.zoom || 1;
    ctx.scale(zoom, zoom);
    ctx.translate(-camera.x, -camera.y);

    // Zbuforowane fasetowane kolumny, rampy, pomosty i osłony
    ctx.drawImage(calderaCanvas, 0, 0);

    // 5. Dynamiczna pulsacja termiczna żył magmy wewnątrz kolumn bazaltowych
    drawDynamicCracksGlow(ctx, animTime);

    ctx.restore();
  }
}

/**
 * Dynamiczny, pulsujący żar żył magmy w kolumnach bazaltowych (tryb 'lighter')
 */
export function drawDynamicCracksGlow(ctx, animTime) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Harmoniczna pulsacja termiczna
  const pulse = 0.65 + 0.35 * Math.sin(animTime * 2.5);
  const pulseFast = 0.50 + 0.50 * Math.sin(animTime * 4.2);

  // Poświata lewej kolumny (x: 1120..1260)
  ctx.strokeStyle = `rgba(249, 115, 22, ${0.40 * pulse})`;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(1173, 450); ctx.lineTo(1181, 540); ctx.lineTo(1167, 670); ctx.lineTo(1187, 800); ctx.lineTo(1177, 950); ctx.lineTo(1183, 1100);
  ctx.stroke();

  ctx.strokeStyle = `rgba(254, 240, 138, ${0.70 * pulseFast})`;
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.moveTo(1173, 450); ctx.lineTo(1181, 540); ctx.lineTo(1167, 670); ctx.lineTo(1187, 800); ctx.lineTo(1177, 950); ctx.lineTo(1183, 1100);
  ctx.stroke();

  // Poświata prawej kolumny (x: 1940..2080)
  ctx.strokeStyle = `rgba(249, 115, 22, ${0.40 * pulse})`;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(2027, 440); ctx.lineTo(2017, 560); ctx.lineTo(2033, 700); ctx.lineTo(2015, 840); ctx.lineTo(2035, 980); ctx.lineTo(2023, 1120);
  ctx.stroke();

  ctx.strokeStyle = `rgba(254, 240, 138, ${0.70 * pulseFast})`;
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.moveTo(2027, 440); ctx.lineTo(2017, 560); ctx.lineTo(2033, 700); ctx.lineTo(2015, 840); ctx.lineTo(2035, 980); ctx.lineTo(2023, 1120);
  ctx.stroke();

  ctx.restore();
}

/**
 * Renderuje elementy areny na pierwszym planie (wywoływane w przestrzeni świata po postaciach):
 * Wielowarstwowe jezioro magmy, dryfujące kry, erupcje gejzerów i cząsteczki
 */
export function drawCalderaForeground(ctx, camera, animTime, geysers, crusts, embers, magmaSplashes) {
  // 1. Wielowarstwowe wrzące jezioro magmy na dnie (y: 1380..1500)
  drawMultiLayerMagmaLake(ctx, animTime, crusts);

  // 2. Aktywne gejzery termiczne (trójwarstwowy słup ognia i gazu na X: 1300 i X: 2500)
  drawThreeLayerGeysers(ctx, animTime, geysers);

  // 3. Dynamiczne unoszące się drobiny żaru i rozbryzgi magmy
  drawCalderaParticles(ctx, embers, magmaSplashes);
}

/**
 * Wielowarstwowe wrzące jezioro magmy (ZERO SERA, CZYSTA PŁYNNA LAWY):
 * A. Głęboka podstawa lawowa (ciemna purpura i stopiona skorupa)
 * B. Płynąca magma z harmonicznymi falami i gradientem termicznym
 * C. Pływające chropowate kry czarnego obsydianu ze szczelinami żaru
 * D. Rozżarzona linia wierzchołkowa w trybie 'lighter'
 * E. Ciepła poświata odbita na podstawach kolumn i platform
 */
export function drawMultiLayerMagmaLake(ctx, t, crusts = []) {
  ctx.save();

  const totalW = ARENA_4_WIDTH;

  // -------------------------------------------------------------------------
  // A. WARSTWA GŁĘBOKA: Ciemna purpura i gęsta lawa bazowa
  // -------------------------------------------------------------------------
  const deepGrad = ctx.createLinearGradient(0, 1370, 0, 1500);
  deepGrad.addColorStop(0.00, '#661414');
  deepGrad.addColorStop(0.35, '#3b0a0a');
  deepGrad.addColorStop(1.00, '#1a0303');
  ctx.fillStyle = deepGrad;

  ctx.beginPath();
  ctx.moveTo(0, 1500);
  ctx.lineTo(0, 1386);
  for (let x = 0; x <= totalW; x += 100) {
    const waveY = 1386 + Math.sin(x * 0.006 + t * 2.2) * 7 + Math.cos(x * 0.012 - t * 1.6) * 5;
    ctx.lineTo(x, waveY);
  }
  ctx.lineTo(totalW, 1500);
  ctx.closePath();
  ctx.fill();

  // -------------------------------------------------------------------------
  // B. WARSTWA PŁYNNA: Płynący strumień magmy
  // -------------------------------------------------------------------------
  const flowGrad = ctx.createLinearGradient(0, 1380, 0, 1460);
  flowGrad.addColorStop(0.00, '#ea580c');
  flowGrad.addColorStop(0.30, '#dc2626');
  flowGrad.addColorStop(0.70, '#991b1b');
  flowGrad.addColorStop(1.00, '#500707');
  ctx.fillStyle = flowGrad;

  ctx.beginPath();
  ctx.moveTo(0, 1500);
  ctx.lineTo(0, 1391);
  for (let x = 0; x <= totalW; x += 70) {
    const waveY = 1391 + Math.sin(x * 0.008 + t * 2.8) * 10 + Math.cos(x * 0.015 - t * 2.1) * 6;
    ctx.lineTo(x, waveY);
  }
  ctx.lineTo(totalW, 1500);
  ctx.closePath();
  ctx.fill();

  // -------------------------------------------------------------------------
  // C. PŁYWAJĄCE KRY OBSYDIANU (ostre wieloboki bazaltu)
  // -------------------------------------------------------------------------
  for (let i = 0; i < crusts.length; i++) {
    const c = crusts[i];
    const waveY = 1391 + Math.sin(c.x * 0.008 + t * 2.8) * 10 + Math.cos(c.x * 0.015 - t * 2.1) * 6;
    const crustY = waveY - 3 + Math.sin(t * 1.8 + c.phase) * 2.5;

    ctx.save();
    ctx.translate(c.x, crustY);

    // Bryła kry obsydianowej
    ctx.fillStyle = '#0f1117';
    ctx.beginPath();
    ctx.moveTo(c.roughness[0].dx, c.roughness[0].dy);
    for (let pi = 1; pi < c.roughness.length; pi++) {
      ctx.lineTo(c.roughness[pi].dx, c.roughness[pi].dy);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#272d3b';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Żarząca się szczelina w krze
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-c.width * 0.25, 0);
    ctx.lineTo(0, c.height * 0.35);
    ctx.lineTo(c.width * 0.22, -2);
    ctx.stroke();

    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // D. ROZŻARZONA LINIA WIERZCHOŁKOWA MAGMY ('LIGHTER')
  // -------------------------------------------------------------------------
  ctx.globalCompositeOperation = 'lighter';

  // Szeroki żar pomarańczowy
  ctx.strokeStyle = 'rgba(249, 115, 22, 0.70)';
  ctx.lineWidth = 6.0;
  ctx.beginPath();
  for (let x = 0; x <= totalW; x += 50) {
    const waveY = 1391 + Math.sin(x * 0.008 + t * 2.8) * 10 + Math.cos(x * 0.015 - t * 2.1) * 6;
    if (x === 0) ctx.moveTo(x, waveY);
    else ctx.lineTo(x, waveY);
  }
  ctx.stroke();

  // Wewnętrzny gorący rdzeń biało-żółty
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.95)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let x = 0; x <= totalW; x += 50) {
    const waveY = 1391 + Math.sin(x * 0.008 + t * 2.8) * 10 + Math.cos(x * 0.015 - t * 2.1) * 6;
    if (x === 0) ctx.moveTo(x, waveY);
    else ctx.lineTo(x, waveY);
  }
  ctx.stroke();

  // E. Poświata termiczna rzucana od spodu na podstawy kolumn bazaltowych
  for (const pillarBaseX of [1120, 1940]) {
    const collarGrad = ctx.createRadialGradient(pillarBaseX + 70, 1395, 20, pillarBaseX + 70, 1395, 120);
    collarGrad.addColorStop(0.00, 'rgba(255, 120, 0, 0.45)');
    collarGrad.addColorStop(0.60, 'rgba(220, 38, 38, 0.15)');
    collarGrad.addColorStop(1.00, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = collarGrad;
    ctx.fillRect(pillarBaseX - 30, 1340, 200, 80);
  }

  ctx.restore();
}

/**
 * Trójwarstwowy strumień erupcji gejzeru:
 * 1. Zewnętrzny dymny płaszcz gazowy
 * 2. Wewnętrzny słup ognia (#ff5500 -> #ffea00)
 * 3. Przegrzany biały rdzeń plazmowy (#ffffff)
 */
export function drawThreeLayerGeysers(ctx, t, geysers = []) {
  for (let gi = 0; gi < geysers.length; gi++) {
    const g = geysers[gi];

    if (g.state === 'ERUPTING') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const flick = Math.sin(t * 24.0 + gi * 7) * 4;
      const wBase = (g.width * 0.5) + flick;
      const hErupt = g.height;

      // 1. Zewnętrzny stożek gazowo-ogniowy
      const outerGrad = ctx.createLinearGradient(g.x, g.y, g.x, g.y - hErupt);
      outerGrad.addColorStop(0.00, '#ea580c');
      outerGrad.addColorStop(0.35, '#dc2626');
      outerGrad.addColorStop(0.80, '#7f1d1d');
      outerGrad.addColorStop(1.00, 'rgba(127, 29, 29, 0)');

      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.moveTo(g.x - wBase * 1.3, g.y);
      ctx.quadraticCurveTo(g.x - wBase * 1.05, g.y - hErupt * 0.6, g.x, g.y - hErupt * 1.04);
      ctx.quadraticCurveTo(g.x + wBase * 1.05, g.y - hErupt * 0.6, g.x + wBase * 1.3, g.y);
      ctx.closePath();
      ctx.fill();

      // 2. Słup ognia i gazu
      const midGrad = ctx.createLinearGradient(g.x, g.y, g.x, g.y - hErupt);
      midGrad.addColorStop(0.00, '#ffffff');
      midGrad.addColorStop(0.20, '#ffea00');
      midGrad.addColorStop(0.55, '#f97316');
      midGrad.addColorStop(0.90, '#dc2626');
      midGrad.addColorStop(1.00, 'rgba(220, 38, 38, 0)');

      ctx.fillStyle = midGrad;
      ctx.beginPath();
      ctx.moveTo(g.x - wBase, g.y);
      ctx.quadraticCurveTo(g.x - wBase * 0.75, g.y - hErupt * 0.6, g.x, g.y - hErupt);
      ctx.quadraticCurveTo(g.x + wBase * 0.75, g.y - hErupt * 0.6, g.x + wBase, g.y);
      ctx.closePath();
      ctx.fill();

      // 3. Przegrzany biały rdzeń plazmowy
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.moveTo(g.x - wBase * 0.35, g.y);
      ctx.lineTo(g.x, g.y - hErupt * 0.80);
      ctx.lineTo(g.x + wBase * 0.35, g.y);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    } else if (g.state === 'TELEGRAPH') {
      // Telegrafowanie: szczelina ze stopniowo narastającym żarem
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const pulseT = 0.65 + 0.35 * Math.sin(t * 18.0);

      ctx.fillStyle = `rgba(255, 102, 0, ${0.70 * pulseT})`;
      ctx.beginPath();
      ctx.ellipse(g.x, g.y - 4, 32, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 240, 138, ${0.85 * pulseT})`;
      ctx.beginPath();
      ctx.ellipse(g.x, g.y - 4, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
}

/**
 * Renderuje unoszące się cząsteczki żaru i rozbryzgi magmy
 */
export function drawCalderaParticles(ctx, embers = [], magmaSplashes = []) {
  if (embers.length === 0 && magmaSplashes.length === 0) return;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Drobiny żaru (embers)
  for (let i = 0; i < embers.length; i++) {
    const e = embers[i];
    ctx.fillStyle = e.color;
    ctx.globalAlpha = e.alpha;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rozbryzgi magmy
  for (let i = 0; i < magmaSplashes.length; i++) {
    const p = magmaSplashes[i];
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
