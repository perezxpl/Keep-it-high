// =========================================================================
// ARENAS/ARENA2/RENDERER.JS - RENDEROWANIE TŁA, GEOMETRII I KWASU ARENY 2
// Wydzielony moduł z js/arenas/arena2.js
// =========================================================================

import {
  ACID_SURGE_SYSTEM,
  _industrialDust,
  ARENA_2_EMERGENCY_BEACONS,
  _toxicVaporParticles,
  _surfaceBubbles,
  getAcidSurfaceY,
  drawAcidDeathEffects
} from './state.js';

// MONUMENTALNY PRZEMYSŁOWY WENTYLATOR CENTRALNY (SEKTOR X)
// Symetryczny punkt centralny areny w osi litery „X” (fanCenterX = 1800, fanCenterY = 580)
// =========================================================================
export function drawMonumentalCenterTurbine(ctx, time) {
  ctx.save();
  ctx.shadowBlur = 0;

  const fanCenterX = 1800;
  const fanCenterY = 580;
  const fanRadius = 300; // Kompaktowy promień (ok. 25% mniejszy, zgrabnie mieszczący się za kładką)
  const hubRadius = 54;  // Proporcjonalna piasta środkowa (54 px)
  const rotation = time * 0.45;

  // 1. ZEWNĘTRZNA CZELUŚĆ SZYBU WENTYLACYJNEGO (GŁĘBOKI TUNEL)
  ctx.fillStyle = '#020406';
  ctx.beginPath();
  ctx.arc(fanCenterX, fanCenterY, fanRadius + 20, 0, Math.PI * 2);
  ctx.fill();

  // 2. STALOWY KOŁNIERZ MONTAŻOWY (CASING FLANGE // R = 300 do 320)
  const flangeGrad = ctx.createRadialGradient(fanCenterX, fanCenterY, fanRadius - 6, fanCenterX, fanCenterY, fanRadius + 20);
  flangeGrad.addColorStop(0.00, '#0a1017');
  flangeGrad.addColorStop(0.55, '#151f2b');
  flangeGrad.addColorStop(0.85, '#222f3e');
  flangeGrad.addColorStop(1.00, '#090d14');
  ctx.fillStyle = flangeGrad;
  ctx.beginPath();
  ctx.arc(fanCenterX, fanCenterY, fanRadius + 20, 0, Math.PI * 2);
  ctx.arc(fanCenterX, fanCenterY, fanRadius, 0, Math.PI * 2, true);
  ctx.fill();

  ctx.strokeStyle = '#2d3748';
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.arc(fanCenterX, fanCenterY, fanRadius + 20, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#1a202c';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(fanCenterX, fanCenterY, fanRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Nity i śruby montażowe na obwodzie kołnierza (co 15 stopni)
  const boltCount = 24;
  const boltR = fanRadius + 10;
  for (let i = 0; i < boltCount; i++) {
    const bAngle = (i * Math.PI * 2) / boltCount;
    const bx = fanCenterX + Math.cos(bAngle) * boltR;
    const by = fanCenterY + Math.sin(bAngle) * boltR;

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(bx, by, 3.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(bx - 0.8, by - 0.8, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. CHŁODNY RADIALNY BLASK SZYBU WENTYLACYJNEGO (#0e2a38 -> transparent)
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const ventGlow = ctx.createRadialGradient(fanCenterX, fanCenterY, 20, fanCenterX, fanCenterY, fanRadius);
  ventGlow.addColorStop(0.00, 'rgba(14, 42, 56, 0.65)'); // #0e2a38
  ventGlow.addColorStop(0.45, 'rgba(14, 42, 56, 0.35)');
  ventGlow.addColorStop(0.75, 'rgba(10, 28, 38, 0.15)');
  ventGlow.addColorStop(1.00, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = ventGlow;
  ctx.beginPath();
  ctx.arc(fanCenterX, fanCenterY, fanRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 4. STALOWE BELKI NOŚNE KRZYŻAKA SZYBU (KRATOWNICA W TLE ZA ŁOPATKAMI)
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(fanCenterX - fanRadius, fanCenterY);
  ctx.lineTo(fanCenterX + fanRadius, fanCenterY);
  ctx.moveTo(fanCenterX, fanCenterY - fanRadius);
  ctx.lineTo(fanCenterX, fanCenterY + fanRadius);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(fanCenterX - fanRadius, fanCenterY);
  ctx.lineTo(fanCenterX + fanRadius, fanCenterY);
  ctx.moveTo(fanCenterX, fanCenterY - fanRadius);
  ctx.lineTo(fanCenterX, fanCenterY + fanRadius);
  ctx.stroke();

  // 5. OBROTOWE ŁOPATKI WENTYLATORA (rotation = time * 0.45)
  const bladeCount = 6;
  const bladeWidthAng = 0.28;

  for (let b = 0; b < bladeCount; b++) {
    const ang = rotation + (b * Math.PI * 2) / bladeCount;
    const cosAng = Math.cos(ang);
    const sinAng = Math.sin(ang);

    // Cień łopatki rzucany w głąb szybu
    ctx.save();
    ctx.fillStyle = 'rgba(2, 4, 8, 0.85)';
    ctx.beginPath();
    ctx.moveTo(fanCenterX + Math.cos(ang - bladeWidthAng * 0.4) * hubRadius, fanCenterY + Math.sin(ang - bladeWidthAng * 0.4) * hubRadius + 10);
    ctx.lineTo(fanCenterX + Math.cos(ang - bladeWidthAng) * fanRadius, fanCenterY + Math.sin(ang - bladeWidthAng) * fanRadius + 10);
    ctx.lineTo(fanCenterX + Math.cos(ang + bladeWidthAng) * fanRadius, fanCenterY + Math.sin(ang + bladeWidthAng) * fanRadius + 10);
    ctx.lineTo(fanCenterX + Math.cos(ang + bladeWidthAng * 0.4) * hubRadius, fanCenterY + Math.sin(ang + bladeWidthAng * 0.4) * hubRadius + 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Korpus stalowej aerodynamicznej łopatki z gradientem
    ctx.save();
    const bladeGrad = ctx.createLinearGradient(
      fanCenterX + cosAng * hubRadius, fanCenterY + sinAng * hubRadius,
      fanCenterX + cosAng * fanRadius, fanCenterY + sinAng * fanRadius
    );
    bladeGrad.addColorStop(0.00, '#0d131a');
    bladeGrad.addColorStop(0.35, '#141d27');
    bladeGrad.addColorStop(0.70, '#1c2836');
    bladeGrad.addColorStop(1.00, '#0a0f15');
    ctx.fillStyle = bladeGrad;

    ctx.beginPath();
    ctx.moveTo(fanCenterX + Math.cos(ang - bladeWidthAng * 0.35) * hubRadius, fanCenterY + Math.sin(ang - bladeWidthAng * 0.35) * hubRadius);
    ctx.lineTo(fanCenterX + Math.cos(ang - bladeWidthAng) * (fanRadius - 5), fanCenterY + Math.sin(ang - bladeWidthAng) * (fanRadius - 5));
    ctx.arc(fanCenterX, fanCenterY, fanRadius - 5, ang - bladeWidthAng, ang + bladeWidthAng);
    ctx.lineTo(fanCenterX + Math.cos(ang + bladeWidthAng * 0.35) * hubRadius, fanCenterY + Math.sin(ang + bladeWidthAng * 0.35) * hubRadius);
    ctx.closePath();
    ctx.fill();

    // Krawędź natarcia (jasny frezowany refleks stali)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(fanCenterX + Math.cos(ang - bladeWidthAng * 0.35) * hubRadius, fanCenterY + Math.sin(ang - bladeWidthAng * 0.35) * hubRadius);
    ctx.lineTo(fanCenterX + Math.cos(ang - bladeWidthAng) * (fanRadius - 5), fanCenterY + Math.sin(ang - bladeWidthAng) * (fanRadius - 5));
    ctx.stroke();

    // Przetłoczenie wzmacniające wzdłuż profilu łopatki
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(fanCenterX + cosAng * hubRadius, fanCenterY + sinAng * hubRadius);
    ctx.lineTo(fanCenterX + cosAng * (fanRadius - 8), fanCenterY + sinAng * (fanRadius - 8));
    ctx.stroke();

    ctx.restore();
  }

  // 6. CENTRALNA PIASTA ROTORA (ROTOR HUB // hubRadius = 54)
  const hubGrad = ctx.createRadialGradient(fanCenterX - 12, fanCenterY - 12, 6, fanCenterX, fanCenterY, hubRadius);
  hubGrad.addColorStop(0.00, '#2d3748');
  hubGrad.addColorStop(0.45, '#1a202c');
  hubGrad.addColorStop(0.85, '#0f172a');
  hubGrad.addColorStop(1.00, '#05080f');
  ctx.fillStyle = hubGrad;
  ctx.beginPath();
  ctx.arc(fanCenterX, fanCenterY, hubRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.arc(fanCenterX, fanCenterY, hubRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Wieniec śrub na obwodzie piasty
  const hubBoltCount = 8;
  const hubBoltR = 37;
  for (let i = 0; i < hubBoltCount; i++) {
    const hAngle = rotation + (i * Math.PI * 2) / hubBoltCount;
    const hbx = fanCenterX + Math.cos(hAngle) * hubBoltR;
    const hby = fanCenterY + Math.sin(hAngle) * hubBoltR;

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(hbx, hby, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(hbx - 0.6, hby - 0.6, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Centralny stożek aerodynamiczny wału silnika (spinner cone // R = 24)
  const coneGrad = ctx.createRadialGradient(fanCenterX - 6, fanCenterY - 6, 3, fanCenterX, fanCenterY, 24);
  coneGrad.addColorStop(0.00, '#475569');
  coneGrad.addColorStop(0.50, '#1e293b');
  coneGrad.addColorStop(1.00, '#090d16');
  ctx.fillStyle = coneGrad;
  ctx.beginPath();
  ctx.arc(fanCenterX, fanCenterY, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(fanCenterX, fanCenterY, 24, 0, Math.PI * 2);
  ctx.stroke();

  // Wskaźnik statusu osi / centralna dioda
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(fanCenterX, fanCenterY, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// =========================================================================
// 4. RENDEROWANIE TŁA INDUSTRIALNEGO (DRAWARENA2BACKGROUND / SEKTOR X)
// Ciemny bunkier przemysłowy, monumentalna turbina centralna, kratownice i rurociągi
// =========================================================================
export function drawArena2Background(ctx, camera) {
  if (!ctx) return;
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';

  const W_screen = ctx.canvas?.width || (typeof window !== 'undefined' ? window.innerWidth : 1920);
  const H_screen = ctx.canvas?.height || (typeof window !== 'undefined' ? window.innerHeight : 1080);
  const time = performance.now() * 0.001;

  const camX = camera ? (camera.x || 0) : 0;
  const camY = camera ? (camera.y || 0) : 0;

  // -----------------------------------------------------------------------
  // WARSTWA 0: BAZOWY GRADIENT BETONOWO-STALOWEGO BUNKRU
  // -----------------------------------------------------------------------
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H_screen);
  bgGrad.addColorStop(0.00, '#06090e'); // Ciemny grafit sufitu hali
  bgGrad.addColorStop(0.35, '#0a0f16'); // Ciemna stal bunkra
  bgGrad.addColorStop(0.70, '#0d151c'); // Poziom środkowych pomostów
  bgGrad.addColorStop(0.92, '#071813'); // Toksyczna poświata nad kwasem
  bgGrad.addColorStop(1.00, '#040d0a'); // Dno zbiornika odpadów
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W_screen, H_screen);

  // Pionowe dylatacje i płyty pancerne w tle (Paralaksa 0.015)
  ctx.save();
  const seamPeriod = 360;
  const seamOffset = ((camX * 0.015) % seamPeriod + seamPeriod) % seamPeriod;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1.5;
  for (let sx = -seamOffset; sx < W_screen + seamPeriod; sx += seamPeriod) {
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, H_screen);
    ctx.stroke();

    // Nitowania na łączeniach płyt
    ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
    for (let sy = 40; sy < H_screen; sy += 120) {
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
    }
  }
  ctx.restore();

  // -----------------------------------------------------------------------
  // WARSTWA 1: SIECI MAGISTRALI RUROWYCH I ZAWORÓW W GŁĘBI ŚCIANY (PARALAKSA 0.045)
  // -----------------------------------------------------------------------
  ctx.save();
  const pipeParallaxX = camX * 0.045;
  const pipeWrap = W_screen + 800;

  // Główny rurociąg chłodzący biegnący w tle hali
  const mainPipeY = H_screen * 0.40 - camY * 0.03;
  ctx.fillStyle = '#0a1017';
  ctx.fillRect(-100, mainPipeY, W_screen + 200, 26);
  ctx.strokeStyle = '#162232';
  ctx.lineWidth = 2.0;
  ctx.strokeRect(-100, mainPipeY, W_screen + 200, 26);

  // Kołnierze montażowe rurociągu co 280 px
  for (let fx = (-pipeParallaxX % 280 + 280) % 280 - 100; fx < W_screen + 100; fx += 280) {
    ctx.fillStyle = '#162232';
    ctx.fillRect(fx - 6, mainPipeY - 4, 12, 34);
    ctx.strokeStyle = '#223246';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(fx - 6, mainPipeY - 4, 12, 34);

    // Zielona/bursztynowa dioda statusu ciśnienia
    const isOk = ((Math.floor(fx / 280)) % 3 !== 0);
    ctx.fillStyle = isOk ? '#10b981' : '#f59e0b';
    ctx.fillRect(fx - 2, mainPipeY + 10, 4, 4);
  }

  // Pionowe rury zrzutowe opadające w dół po bokach
  for (let rx = 240; rx < 3400; rx += 680) {
    const screenRx = (rx - pipeParallaxX) % pipeWrap - 200;
    if (screenRx < -80 || screenRx > W_screen + 80) continue;

    ctx.fillStyle = '#0a1017';
    ctx.fillRect(screenRx - 14, 0, 28, H_screen);
    ctx.strokeStyle = 'rgba(22, 34, 50, 0.7)';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(screenRx - 14, 0, 28, H_screen);
  }
  ctx.restore();

  // -----------------------------------------------------------------------
  // WARSTWA 2: MONUMENTALNY PRZEMYSŁOWY WENTYLATOR CENTRALNY (SEKTOR X)
  // ORAZ PRZEMYSŁOWE KOGUTY ALARMOWE W TLE (ROTATING EMERGENCY BEACONS)
  // Dokładny środek areny: X = 1800, Y = 580 (promień 300 px, piasta 54 px)
  // -----------------------------------------------------------------------
  ctx.save();
  const camZoom = (camera && camera.zoom) ? camera.zoom : 1;
  ctx.scale(camZoom, camZoom);
  ctx.translate(-camX, -camY);

  drawMonumentalCenterTurbine(ctx, time);
  drawRotatingHazardBeacons(ctx, time);

  ctx.restore();

  // -----------------------------------------------------------------------
  // WARSTWA 3: UNOSZĄCE SIĘ CZĄSTECZKI PYŁU I OPARÓW PRZEMYSŁOWYCH (60 FPS)
  // -----------------------------------------------------------------------
  ctx.save();
  for (let i = 0; i < _industrialDust.length; i++) {
    const d = _industrialDust[i];
    const dx = (d.baseX + Math.sin(time * 1.2 + d.phase) * 20 - camX * 0.03 % W_screen + W_screen) % W_screen;
    const dy = ((d.baseY + time * d.speedY) % H_screen + H_screen) % H_screen;
    const pulse = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(time * 2.0 + d.phase));

    if (d.colorType === 0) {
      ctx.fillStyle = `rgba(245, 158, 11, ${pulse * 0.6})`; // Bursztynowy pył
    } else if (d.colorType === 1) {
      ctx.fillStyle = `rgba(148, 163, 184, ${pulse * 0.35})`; // Szary dym
    } else {
      ctx.fillStyle = `rgba(52, 211, 153, ${pulse * 0.65})`; // Cyjanowo-kwasowa drobina
    }
    ctx.beginPath();
    ctx.arc(dx, dy, d.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}

export function drawPandoraBackground(ctx, camera) {
  // Alias dla wstecznej kompatybilności
  drawArena2Background(ctx, camera);
}

// =========================================================================
// 5. RENDEROWANIE GEOMETRII ARENY 2 (DRAWARENA2GEOMETRY / SEKTOR X)
// Monolityczna konstrukcja industrialna: sufit, bastiony, zjazdy i basen kwasu
// =========================================================================
export function drawArena2Geometry(ctx, camera) {
  if (!ctx) return;
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';
  const time = performance.now() * 0.001;

  // DYNAMICZNE WYLICZENIE DOLNEJ KRAWĘDZI WIDOKU KAMERY
  const canvasH = (ctx.canvas && ctx.canvas.height) || (typeof window !== 'undefined' ? window.innerHeight : 1080);
  const camZoom = (camera && camera.zoom) ? camera.zoom : 1;
  const camY = (camera && typeof camera.y === 'number') ? camera.y : 0;
  const viewBottomY = camY + (canvasH / camZoom) + 400;
  const BOTTOM_Y = Math.max(1450, viewBottomY);

  // -----------------------------------------------------------------------
  // 0. ABSOLUTNY, W 100% KRYJĄCY MONOLITYCZNY PODKŁAD POD CAŁĄ ARENĄ
  // Zero widocznego tła od dynamicznego poziomu kwasu w dół
  // -----------------------------------------------------------------------
  const curAcidY = Math.floor((typeof ACID_SURGE_SYSTEM !== 'undefined') ? ACID_SURGE_SYSTEM.currentY : 1260);
  ctx.fillStyle = '#010403';
  ctx.fillRect(-200, curAcidY - 10, 4000, (BOTTOM_Y - curAcidY) + 210);

  // -----------------------------------------------------------------------
  // 2. SUFITOWE MAGISTRALE I BELKI TECHNICZNE (Y: 150-180)
  // -----------------------------------------------------------------------
  drawCeilingInfrastructure(ctx, time);

  // -----------------------------------------------------------------------
  // 3. GÓRNE BASTIONY A i B (X: 260-880 oraz 2720-3340, Y: 460)
  // -----------------------------------------------------------------------
  drawIndustrialFortressPlatform(ctx, 260, 460, 620, 32, 'A - TOP WEST', true, time);
  drawIndustrialFortressPlatform(ctx, 2720, 460, 620, 32, 'B - TOP EAST', false, time);

  // -----------------------------------------------------------------------
  // 4. UKOŚNE RAMPY GÓRNE (POŁĄCZENIE BASTIONÓW ZE ŚRODKIEM)
  // Rampa A: (880, 460) -> (1440, 720)
  // Rampa B (Mirror): (2720, 460) -> (2160, 720)
  // -----------------------------------------------------------------------
  drawIndustrialTrussRamp(ctx, 880, 460, 1440, 720, 18, true, time);
  drawIndustrialTrussRamp(ctx, 2720, 460, 2160, 720, 18, false, time);

  // -----------------------------------------------------------------------
  // 6. UKOŚNE RAMPY DOLNE (ZE ŚRODKA NA DOLNE BASTIONY)
  // Rampa C: (1440, 720) -> (900, 1040)
  // Rampa D (Mirror): (2160, 720) -> (2700, 1040)
  // -----------------------------------------------------------------------
  drawIndustrialTrussRamp(ctx, 1440, 720, 900, 1040, 18, false, time);
  drawIndustrialTrussRamp(ctx, 2160, 720, 2700, 1040, 18, true, time);

  // -----------------------------------------------------------------------
  // 6B. WĘZŁY KRATOWNIC PRZY ŚRODKU (JUNCTION CAPS - LEWY I PRAWY)
  // Symetryczne zwieńczenia wierzchołków przy X = 1440 oraz X = 2160
  // -----------------------------------------------------------------------
  drawRampJunctionCap(ctx, 1440, 720, true);
  drawRampJunctionCap(ctx, 2160, 720, false);

  // -----------------------------------------------------------------------
  // 7. DOLNE BASTIONY C i D (X: 260-900 oraz 2700-3340, Y: 1040)
  // -----------------------------------------------------------------------
  drawIndustrialFortressPlatform(ctx, 260, 1040, 640, 32, 'C - HAZARD DECK', true, time);
  drawIndustrialFortressPlatform(ctx, 2700, 1040, 640, 32, 'D - ACID PIER', false, time);

  // -----------------------------------------------------------------------
  // 1. ZBIORNIK TOKSYCZNEGO KWASU (HAZARD LAKE // Y = currentY DO BOTTOM_Y)
  // Jednolity, stały render cieczy niezależnie od stanu i fazy alarmu
  // -----------------------------------------------------------------------
  drawAcidLevel(ctx, curAcidY, BOTTOM_Y);

  // 1B. PĘCZNIENIE I PĘKANIE PĘCHERZY GAZU NA POWIERZCHNI KWASU
  drawAcidSurfaceBubbles(ctx, time);

  // 1C. GŁÓWNA ŁUNA OD KWASU (ACID UPWARD UNDERGLOW)
  drawAcidUpwardUnderglow(ctx);

  // 1D. DYNAMICZNE EFEKTY ZGONU W KWASIE (WRZENIE, GEJZERY KROPEL, DYM, WYRZUCONY EKWIPUNEK)
  drawAcidDeathEffects(ctx, time);

  // -----------------------------------------------------------------------
  // 5. CENTRALNY HUB TAKTYCZNY (X: 1440-2160, Y: 720, W: 720, H: 26)
  // Renderowany na szczycie fali zalania (Y = 720)
  // -----------------------------------------------------------------------
  drawCenterTacticalHub(ctx, 1440, 720, 720, 26, time);

  // 7B. ZIELONY AKCENT NA KRAWĘDZIACH PLATFORM I RAMP (RIM LIGHT // SCREEN)
  drawPlatformRimLighting(ctx);

  // -----------------------------------------------------------------------
  // 8. ELEMENTY ATMOSFERYCZNE: OPARY KWASU I OSTRZEGAWCZE ŚWIATŁA STROBOSKOPOWE
  // -----------------------------------------------------------------------
  drawToxicVaporMotes(ctx, time);
  drawAcidVaporAndHazards(ctx, time);

  // KOGUTY ALARMOWE (renderowane w geometrii w przypadku braku tła)
  drawRotatingHazardBeacons(ctx, time);

  // -----------------------------------------------------------------------
  // 9. TAKTYCZNE OSTRZEŻENIE O ZALANIU / SYRENY WIZUALNE
  // -----------------------------------------------------------------------
  drawAcidSurgeWarningBanner(ctx, time, camera);

  ctx.restore();
}

export function renderPandoraTerrain(ctx, camera) {
  drawArena2Geometry(ctx, camera);
}

export function drawArena2Foreground(ctx, camera) {
  drawArena2Geometry(ctx, camera);
}

// =========================================================================
// 6. SZCZEGÓŁOWE PROCEDURY RENDEROWANIA ELEMENTÓW INDUSTRIALNYCH
// =========================================================================

// Jednolity, stały render cieczy niezależnie od stanu i fazy alarmu
export function drawAcidLevel(ctx, currentY, bottomY = 1400) {
  const curY = (currentY !== undefined && currentY !== null)
    ? currentY
    : ((typeof ACID_SURGE_SYSTEM !== 'undefined') ? ACID_SURGE_SYSTEM.currentY : 1260);
  const BOTTOM_Y = Math.max(1400, bottomY || 1400); // lub dynamiczna dolna granica ekranu
  const time = performance.now() * 0.001;

  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';

  // 1. Zawsze ten sam, niezmienny gradient głębinowy
  const acidGrad = ctx.createLinearGradient(0, curY, 0, BOTTOM_Y);
  acidGrad.addColorStop(0.00, '#22c55e'); // standardowa zieleń na powierzchni
  acidGrad.addColorStop(0.18, '#15803d');
  acidGrad.addColorStop(0.55, '#052e16');
  acidGrad.addColorStop(1.00, '#010a05'); // 100% kryjące dno

  // 2. Ta sama standardowa powierzchnia fal
  ctx.fillStyle = acidGrad;
  ctx.beginPath();
  ctx.moveTo(0, BOTTOM_Y);
  ctx.lineTo(0, curY);

  // Stała formuła fal bez względu na to, czy kwas stoi, czy się podnosi
  const step = 20;
  for (let x = 0; x <= 3600; x += step) {
    const waveY = curY + Math.sin(time * 3.0 + x * 0.02) * 5.0;
    ctx.lineTo(x, waveY);
  }

  ctx.lineTo(3600, BOTTOM_Y);
  ctx.closePath();
  ctx.fill();

  // 3. Ta sama, delikatna linia grzbietu fali
  ctx.strokeStyle = '#86efac';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  for (let x = 0; x <= 3600; x += step) {
    const waveY = curY + Math.sin(time * 3.0 + x * 0.02) * 5.0;
    if (x === 0) ctx.moveTo(x, waveY);
    else ctx.lineTo(x, waveY);
  }
  ctx.stroke();

  ctx.restore();
}

/** Alias kompatybilności */
export function drawAcidLake(ctx, time, bottomY) {
  const curY = (typeof ACID_SURGE_SYSTEM !== 'undefined') ? ACID_SURGE_SYSTEM.currentY : 1260;
  drawAcidLevel(ctx, curY, bottomY);
}

/** Rysuje rury i kratownice sufitowe (Y = 150-180) */
function drawCeilingInfrastructure(ctx, time) {
  const pipes = [
    { x: 600,  y: 180, w: 520, h: 16, id: 'pipe_A' },
    { x: 1540, y: 150, w: 520, h: 16, id: 'pipe_Mid' },
    { x: 2480, y: 180, w: 520, h: 16, id: 'pipe_B' }
  ];

  ctx.save();
  for (const p of pipes) {
    // Zawiesia sufitowe łączące rurę ze stropem hali
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3.0;
    for (let hx = p.x + 40; hx < p.x + p.w; hx += 110) {
      ctx.beginPath();
      ctx.moveTo(hx, 0);
      ctx.lineTo(hx, p.y);
      ctx.stroke();

      // Klamra mocująca
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(hx - 6, p.y - 8, 12, 10);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(hx - 6, p.y - 8, 12, 10);
    }

    // Korpus rury przemysłowej z metalicznym gradientem
    const pGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    pGrad.addColorStop(0.0, '#475569');
    pGrad.addColorStop(0.3, '#94a3b8');
    pGrad.addColorStop(0.6, '#334155');
    pGrad.addColorStop(1.0, '#0f172a');
    ctx.fillStyle = pGrad;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(p.x, p.y, p.w, p.h);

    // Górny pomost inspekcyjny (kratownica do biegania)
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + p.w, p.y);
    ctx.stroke();

    // Pierścienie uszczelniające co 60 px
    for (let rx = p.x + 30; rx < p.x + p.w; rx += 60) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(rx - 3, p.y - 2, 6, p.h + 4);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.0;
      ctx.strokeRect(rx - 3, p.y - 2, 6, p.h + 4);
    }

    // Neonowa linia wskaźnika telemetrycznego (bursztyn/cyjan)
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = p.id === 'pipe_Mid' ? '#38bdf8' : '#fbbf24';
    ctx.fillRect(p.x + 6, p.y + p.h / 2 - 1, p.w - 12, 2);
    ctx.restore();
  }
  ctx.restore();
}

/** Rysuje pancerny bastion ze stalowymi płytami i pasami ostrzegawczymi */
function drawIndustrialFortressPlatform(ctx, x, y, w, h, label, isLeft, time) {
  ctx.save();

  // Główny blok platformy (Hartowana stal pancerna - prosta, czysta belka)
  const platGrad = ctx.createLinearGradient(x, y, x, y + h);
  platGrad.addColorStop(0.0, '#334155');
  platGrad.addColorStop(0.2, '#1e293b');
  platGrad.addColorStop(0.8, '#0f172a');
  platGrad.addColorStop(1.0, '#020617');
  ctx.fillStyle = platGrad;
  ctx.fillRect(x, y, w, h);

  // Krawędź nośna platformy
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.0;
  ctx.strokeRect(x, y, w, h);

  // Pasy ostrzegawcze (Hazard Chevrons: Żółto-Czarne skosy) wzdłuż czoła
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 2, y + 2, w - 4, 10);
  ctx.clip();
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(x, y, w, 14);

  ctx.fillStyle = '#0f172a';
  for (let hx = x - 20; hx < x + w + 20; hx += 24) {
    ctx.beginPath();
    ctx.moveTo(hx, y);
    ctx.lineTo(hx + 12, y);
    ctx.lineTo(hx + 2, y + 14);
    ctx.lineTo(hx - 10, y + 14);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Nitowania konstrukcyjne na dolnej krawędzi
  ctx.fillStyle = '#475569';
  for (let nx = x + 18; nx < x + w - 10; nx += 38) {
    ctx.beginPath();
    ctx.arc(nx, y + h - 8, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Neonowy pasek taktyczny i napis identyfikacyjny platformy
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = isLeft ? '#06b6d4' : '#f97316';
  ctx.fillRect(x + (isLeft ? 12 : w - 90), y + 14, 78, 3);

  ctx.font = '900 9px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = isLeft ? 'left' : 'right';
  ctx.fillText(label, isLeft ? x + 16 : x + w - 16, y + 24);
  ctx.restore();

  // Zielony akcent na dolnej krawędzi platform C i D (Rim Light od kwasu)
  if (y >= 1000) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/** Rysuje ukośną kratownicową rampę stalową łączącą poziomy */
function drawIndustrialTrussRamp(ctx, x1, y1, x2, y2, thickness = 18, isAscending, time) {
  ctx.save();
  ctx.beginPath();

  // Upewniamy się, że rysujemy od lewej do prawej strony (startX <= endX),
  // dzięki czemu oś Y w układzie lokalnym jest ZAWSZE skierowana pionowo w dół świata (w stronę grawitacji).
  // Zapobiega to rysowaniu kratownicy do góry nogami i wystawaniu ponad podesty A, B oraz podest środkowy.
  const p1 = (x1 <= x2) ? { x: x1, y: y1 } : { x: x2, y: y2 };
  const p2 = (x1 <= x2) ? { x: x2, y: y2 } : { x: x1, y: y1 };

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) {
    ctx.restore();
    return;
  }
  const angle = Math.atan2(dy, dx);

  ctx.translate(p1.x, p1.y);
  ctx.rotate(angle);

  // A. Dolna kratownica konstrukcyjna (Open-web steel truss pod bieżnią)
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(0, thickness);
  ctx.lineTo(len, thickness);
  ctx.moveTo(0, thickness + 26);
  ctx.lineTo(len, thickness + 26);
  ctx.stroke();

  // Ukośne rygle kratownicy
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.8;
  const trussStep = 34;
  for (let tx = 0; tx < len - 20; tx += trussStep) {
    ctx.beginPath();
    ctx.moveTo(tx, thickness);
    ctx.lineTo(tx + trussStep / 2, thickness + 26);
    ctx.lineTo(tx + trussStep, thickness);
    ctx.stroke();
  }

  // B. Płyta bieżna rampy (Ryflowana stal antypoślizgowa na górnej krawędzi)
  const rGrad = ctx.createLinearGradient(0, 0, 0, thickness);
  rGrad.addColorStop(0.0, '#475569');
  rGrad.addColorStop(0.3, '#334155');
  rGrad.addColorStop(1.0, '#0f172a');
  ctx.fillStyle = rGrad;
  ctx.fillRect(0, 0, len, thickness);

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(0, 0, len, thickness);

  // Poprzeczne rowki ryflowania antypoślizgowego
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.4;
  for (let rx = 10; rx < len - 6; rx += 14) {
    ctx.beginPath();
    ctx.moveTo(rx, 2);
    ctx.lineTo(rx, thickness - 2);
    ctx.stroke();
  }

  // C. Prowadnica świetlna wzdłuż krawędzi (LED guide strip)
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
  ctx.fillRect(4, 1, len - 8, 2.0);
  ctx.restore();

  ctx.restore();
}

/** Rysuje trójkątne zwieńczenie węzła kratownic przy środkowym podeście (Junction Cap) */
function drawRampJunctionCap(ctx, jx, jy, isLeft) {
  ctx.save();
  ctx.beginPath();

  const sign = isLeft ? -1 : 1;
  const apexX = jx + sign * 22;
  const apexY = jy + 39; // zbieg dolnych pasów kratownic (Y: 759)

  // Trójkątna nakładka węzłowa łącząca górną i dolną rampę z czołem podestu
  ctx.beginPath();
  ctx.moveTo(jx, jy);       // (1440 / 2160, 720) - górny narożnik bieżni
  ctx.lineTo(apexX, apexY);  // wierzchołek zbiegu dolnych pasów kratownic
  ctx.lineTo(jx, jy + 26);   // (1440 / 2160, 746) - dolny narożnik profilu podestu
  ctx.closePath();

  const gGrad = ctx.createLinearGradient(jx, jy, apexX, apexY);
  gGrad.addColorStop(0.0, '#334155');
  gGrad.addColorStop(0.5, '#1e293b');
  gGrad.addColorStop(1.0, '#0f172a');
  ctx.fillStyle = gGrad;
  ctx.fill();

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Wewnętrzny ryflowany profil usztywniający
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(jx, jy + 13);
  ctx.lineTo(apexX, apexY);
  ctx.stroke();

  // Śruby węzłowe
  ctx.fillStyle = '#94a3b8';
  const bolts = [
    { dx: sign * 5, dy: 8 },
    { dx: sign * 14, dy: 28 },
    { dx: sign * 5, dy: 20 }
  ];
  for (const b of bolts) {
    ctx.beginPath();
    ctx.arc(jx + b.dx, jy + b.dy, 2.0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Neonowy punkt telemetryczny LED na węźle
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(jx + sign * 4, jy + 4, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/** Rysuje centralny podwieszany hub taktyczny */
function drawCenterTacticalHub(ctx, x, y, w, h, time) {
  ctx.save();

  // Potężne liny i ściągi nośne podwieszające hub pod strop hali
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.moveTo(x + 40, y);
  ctx.lineTo(x - 120, 0);
  ctx.moveTo(x + w - 40, y);
  ctx.lineTo(x + w + 120, 0);
  ctx.stroke();

  // Jaśniejszy rdzeń ściągów stalowych
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.6;
  ctx.stroke();


  // Korpus platformy huba (Ażurowy pomost techniczny - kratownica)
  const hGrad = ctx.createLinearGradient(x, y, x, y + h);
  hGrad.addColorStop(0.0, '#384656');
  hGrad.addColorStop(0.4, '#1e293b');
  hGrad.addColorStop(1.0, '#0b111a');
  ctx.fillStyle = hGrad;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2.2;
  ctx.strokeRect(x, y, w, h);

  // Ażurowa siatka kratownicy (Catwalk mesh)
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 1.2;
  for (let mx = x + 8; mx < x + w - 4; mx += 16) {
    ctx.beginPath();
    ctx.moveTo(mx, y + 2);
    ctx.lineTo(mx, y + h - 2);
    ctx.stroke();
  }

  // Ostrzegawcze żółte obramowanie krawędzi wejściowych
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(x + 2, y + 2, 24, 4);
  ctx.fillRect(x + w - 26, y + 2, 24, 4);

  // Wskaźnik statusu huba
  ctx.font = '900 10px monospace';
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.fillText('◄ CENTER TAC-HUB // SECTOR X ►', x + w / 2, y + 17);

  ctx.restore();
}

// =========================================================================
// NOWE FUNKCJE ŚWIETLNE I EFEKTÓW CZĄSTECZKOWYCH (KROK 3 - LIGHTING & FX)
// =========================================================================

/**
 * 1. Podświetlenie od spodu kwasem (Acid Upward Underglow)
 * Poziomy, rozmyty gradient unoszącego się zielonego blasku tuż nad kwasem (Y = 1260 -> 980 px)
 */
export function drawAcidUpwardUnderglow(ctx) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'screen';

  const curY = (typeof ACID_SURGE_SYSTEM !== 'undefined') ? ACID_SURGE_SYSTEM.currentY : 1260;
  const underglowGrad = ctx.createLinearGradient(0, curY, 0, curY - 280);
  underglowGrad.addColorStop(0.00, 'rgba(34, 197, 94, 0.28)');
  underglowGrad.addColorStop(0.50, 'rgba(16, 185, 129, 0.12)');
  underglowGrad.addColorStop(1.00, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = underglowGrad;
  ctx.fillRect(-200, curY - 280, 4000, 280);
  ctx.restore();
}

/**
 * 1B. Zielony akcent na krawędziach platform (Rim Light)
 * Cienka fosforyzująca linia (rgba(74, 222, 128, 0.35), lineWidth: 1.8) symulująca odbijanie światła kwasu
 */
export function drawPlatformRimLighting(ctx) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'screen';
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';

  ctx.beginPath();
  // Dolne krawędzie platform C i D (Y: 1072 tuż nad kwasem)
  ctx.moveTo(260, 1072);
  ctx.lineTo(900, 1072);
  ctx.moveTo(2700, 1072);
  ctx.lineTo(3340, 1072);
  ctx.stroke();

  ctx.restore();
}

/**
 * 2. Przemysłowe koguty alarmowe (Rotating Emergency Beacons)
 * 2 lampy na pionowych słupach z obracającym się snopem światła (bursztynowy/czerwony stożek 45°, R=165 px)
 */
let _lastBeaconsTime = -1;

export function drawRotatingHazardBeacons(ctx, time, force = false) {
  if (!force && _lastBeaconsTime === time) return;
  _lastBeaconsTime = time;

  ctx.save();
  ctx.shadowBlur = 0;

  const state = (typeof ACID_SURGE_SYSTEM !== 'undefined') ? ACID_SURGE_SYSTEM.state : 'CALM';
  const isAlarm = (state === 'WARNING' || state === 'RISING');
  const rotSpeed = isAlarm ? 8.4 : 3.8;

  const beamLength = 165;
  const spread = 45 * Math.PI / 180; // Kąt rozwarcia ~45°
  const halfSpread = spread * 0.5;

  for (let i = 0; i < ARENA_2_EMERGENCY_BEACONS.length; i++) {
    const beacon = ARENA_2_EMERGENCY_BEACONS[i];
    const bx = beacon.x;
    const by = beacon.y;
    const angle = (time * rotSpeed + i * 1.57) % (Math.PI * 2);

    // A. PIONOWY SŁUPEK / STALOWY WSPORNIK NA ŚCIANIE W TLE
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(bx - 3, by - 24, 6, 48);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(bx - 3, by - 24, 6, 48);

    // Nitowania wspornika
    ctx.fillStyle = '#475569';
    ctx.fillRect(bx - 1.5, by - 20, 3, 3);
    ctx.fillRect(bx - 1.5, by + 18, 3, 3);

    // B. OBRACAJĄCY SIĘ SNOP ŚWIATŁA (TRYB 'SCREEN')
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Główny stożek światła z miękkim radialnym gradientem (bursztynowy/czerwony alarm)
    ctx.beginPath();
    ctx.moveTo(bx, by - 2);
    ctx.arc(bx, by - 2, beamLength, angle - halfSpread, angle + halfSpread);
    ctx.closePath();

    const beamGrad = ctx.createRadialGradient(bx, by - 2, 2, bx, by - 2, beamLength);
    beamGrad.addColorStop(0.00, isAlarm ? 'rgba(239, 68, 68, 0.65)' : 'rgba(245, 158, 11, 0.45)');
    beamGrad.addColorStop(0.35, isAlarm ? 'rgba(249, 115, 22, 0.35)' : 'rgba(245, 158, 11, 0.24)');
    beamGrad.addColorStop(0.70, isAlarm ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)');
    beamGrad.addColorStop(1.00, 'rgba(245, 158, 11, 0.00)');
    ctx.fillStyle = beamGrad;
    ctx.fill();

    // Wewnętrzny jaśniejszy rdzeń snopu
    const innerHalfSpread = halfSpread * 0.4;
    ctx.beginPath();
    ctx.moveTo(bx, by - 2);
    ctx.arc(bx, by - 2, beamLength * 0.85, angle - innerHalfSpread, angle + innerHalfSpread);
    ctx.closePath();

    const innerGrad = ctx.createRadialGradient(bx, by - 2, 1, bx, by - 2, beamLength * 0.85);
    innerGrad.addColorStop(0.00, 'rgba(254, 240, 138, 0.45)');
    innerGrad.addColorStop(0.45, isAlarm ? 'rgba(239, 68, 68, 0.20)' : 'rgba(245, 158, 11, 0.12)');
    innerGrad.addColorStop(1.00, 'rgba(245, 158, 11, 0.00)');
    ctx.fillStyle = innerGrad;
    ctx.fill();

    // Radialna poświata żarówki
    const bulbGlow = ctx.createRadialGradient(bx, by - 2, 1, bx, by - 2, 18);
    bulbGlow.addColorStop(0.00, 'rgba(254, 215, 170, 0.65)');
    bulbGlow.addColorStop(0.50, isAlarm ? 'rgba(239, 68, 68, 0.30)' : 'rgba(245, 158, 11, 0.20)');
    bulbGlow.addColorStop(1.00, 'rgba(245, 158, 11, 0.00)');
    ctx.fillStyle = bulbGlow;
    ctx.beginPath();
    ctx.arc(bx, by - 2, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // C. MAŁA METALOWA OBUDOWA: CIEMNOSZARY COKÓŁ (#1e293b) 12x8 px
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx - 6, by + 1, 12, 8);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(bx - 6, by + 1, 12, 8);

    // Nity na cokole
    ctx.fillStyle = '#64748b';
    ctx.fillRect(bx - 4.5, by + 5, 2, 2);
    ctx.fillRect(bx + 2.5, by + 5, 2, 2);

    // D. PRZEZROCZYSTY POMARAŃCZOWY/CZERWONY KLOSZ
    ctx.save();
    ctx.fillStyle = isAlarm ? 'rgba(239, 68, 68, 0.88)' : 'rgba(245, 158, 11, 0.82)';
    ctx.beginPath();
    ctx.moveTo(bx - 5, by + 1);
    ctx.lineTo(bx - 5, by - 3);
    ctx.quadraticCurveTo(bx - 5, by - 7, bx, by - 7);
    ctx.quadraticCurveTo(bx + 5, by - 7, bx + 5, by - 3);
    ctx.lineTo(bx + 5, by + 1);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = isAlarm ? '#b91c1c' : '#d97706';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Szklany połysk
    ctx.strokeStyle = 'rgba(254, 243, 199, 0.65)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(bx - 3, by - 2);
    ctx.lineTo(bx - 2, by - 5);
    ctx.stroke();
    ctx.restore();

    // E. PULSUJĄCY RDZEŃ ŻARÓWKI
    const bulbPulse = 0.70 + 0.30 * Math.sin(time * (isAlarm ? 15.0 : 7.6) + i * 1.57);
    ctx.fillStyle = isAlarm ? `rgba(239, 68, 68, ${0.90 * bulbPulse})` : `rgba(245, 158, 11, ${0.85 * bulbPulse})`;
    ctx.beginPath();
    ctx.arc(bx, by - 2.5, 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 255, 255, ${bulbPulse})`;
    ctx.beginPath();
    ctx.arc(bx, by - 2.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 3. Cząstki unoszących się oparów toksycznych (Steam Motes)
 * 28 cząstek pary dryfujących pionowo od poziomu kwasu w górę z falowaniem poziomym
 */
export function drawToxicVaporMotes(ctx, time) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'screen';

  const curY = (typeof ACID_SURGE_SYSTEM !== 'undefined') ? ACID_SURGE_SYSTEM.currentY : 1260;

  for (let i = 0; i < _toxicVaporParticles.length; i++) {
    const p = _toxicVaporParticles[i];
    const progress = ((time * p.driftSpeed + p.phase) % 1.0 + 1.0) % 1.0;
    const y = curY - progress * 180;
    const x = p.baseX + Math.sin(time * p.speed + p.phase) * p.amp;
    const r = p.radius * (0.85 + 0.35 * progress);

    const alpha = Math.sin(progress * Math.PI) * 0.16;
    if (alpha <= 0.005) continue;

    ctx.fillStyle = `rgba(52, 211, 153, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 3B. Pęcherze gazu na powierzchni (Bubbles)
 * Bąble (promień 2–4 px) pęczniejące na tafli kwasu i pękające, wyrzucające 2–3 mikro-kropelki
 */
export function drawAcidSurfaceBubbles(ctx, time) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'screen';

  for (let i = 0; i < _surfaceBubbles.length; i++) {
    const b = _surfaceBubbles[i];
    const cycleTime = (time + b.phase) % b.cycleDuration;
    const cycleProgress = cycleTime / b.cycleDuration;
    const surfaceY = getAcidSurfaceY(b.x, time);

    if (cycleProgress < 0.72) {
      // FAZA 1: PĘCZNIENIE NA TAFLI KWASU (promień 2–4 px)
      const growProgress = cycleProgress / 0.72;
      const r = 0.8 + (b.maxRadius - 0.8) * growProgress;
      const bubbleY = surfaceY - r * 0.45;

      ctx.fillStyle = 'rgba(167, 243, 208, 0.75)';
      ctx.beginPath();
      ctx.arc(b.x, bubbleY, r, 0, Math.PI * 2);
      ctx.fill();

      // Punktowe białe lśnienie
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x - r * 0.3, bubbleY - r * 0.35, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // FAZA 2: PĘKNIĘCIE I WYRZUCENIE 2–3 MIKRO-KROPELEK CIECZY
      const popProgress = (cycleProgress - 0.72) / 0.28;

      if (popProgress < 0.35) {
        const burstR = b.maxRadius + popProgress * 9.0;
        const ringAlpha = (1.0 - popProgress / 0.35) * 0.65;
        ctx.strokeStyle = `rgba(110, 231, 183, ${ringAlpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(b.x, surfaceY, burstR, 0, Math.PI * 2);
        ctx.stroke();
      }

      const dropAlpha = (1.0 - popProgress) * 0.85;
      ctx.fillStyle = `rgba(167, 243, 208, ${dropAlpha})`;

      for (let d = 0; d < b.droplets.length; d++) {
        const dr = b.droplets[d];
        const dtSeconds = popProgress * 0.45;
        const dropX = b.x + dr.vx * dtSeconds;
        const dropY = surfaceY + dr.vy * dtSeconds + 0.5 * 180 * dtSeconds * dtSeconds;

        ctx.beginPath();
        ctx.arc(dropX, dropY, dr.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

/** Rysuje narożne stroboskopy ostrzegawcze na platformach dolnych */
function drawAcidVaporAndHazards(ctx, time) {
  ctx.save();

  // Pulsujące stroboskopy ostrzegawcze na rogach dolnych bastionów
  const strobeList = [
    { x: 265, y: 1040 },
    { x: 895, y: 1040 },
    { x: 2705, y: 1040 },
    { x: 3335, y: 1040 }
  ];

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let sIdx = 0; sIdx < strobeList.length; sIdx++) {
    const st = strobeList[sIdx];
    const flash = Math.pow(Math.sin(time * 4.0 + sIdx * 1.57), 8); // Ostre impulsy
    ctx.fillStyle = `rgba(239, 68, 68, ${0.2 + flash * 0.8})`;
    ctx.beginPath();
    ctx.arc(st.x, st.y - 4, 3.5, 0, Math.PI * 2);
    ctx.fill();

    if (flash > 0.4) {
      ctx.fillStyle = `rgba(254, 202, 202, ${flash})`;
      ctx.beginPath();
      ctx.arc(st.x, st.y - 4, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.restore();
}

// =========================================================================
// 6B. TAKTYCZNE OSTRZEŻENIE O ZALANIU (ACID SURGE WARNING BANNER & HUD)
// =========================================================================
export function drawAcidSurgeWarningBanner(ctx, time, camera) {
  const state = (typeof ACID_SURGE_SYSTEM !== 'undefined') ? ACID_SURGE_SYSTEM.state : 'CALM';
  if (state !== 'WARNING' && state !== 'FLOODED') return;

  ctx.save();
  ctx.shadowBlur = 0;

  const canvasW = (ctx.canvas && ctx.canvas.width) || (typeof window !== 'undefined' ? window.innerWidth : 1920);
  const camZoom = (camera && camera.zoom) ? camera.zoom : 1;
  const camX = (camera && typeof camera.x === 'number') ? camera.x : 0;
  const camY = (camera && typeof camera.y === 'number') ? camera.y : 0;

  const screenCenterX = camX + (canvasW / camZoom) * 0.5;
  const bannerY = camY + 80 / camZoom;

  if (state === 'WARNING') {
    const pulse = 0.5 + 0.5 * Math.sin(time * 14.0);
    const bannerW = 600;
    const bannerH = 46;
    const bx = screenCenterX - bannerW * 0.5;
    const by = bannerY;

    // Tło z industrialną obwódką
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(bx, by, bannerW, bannerH);
    ctx.strokeStyle = `rgba(245, 158, 11, ${0.4 + 0.6 * pulse})`;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(bx, by, bannerW, bannerH);

    // Paski ostrzegawcze (hazard stripes) na bokach
    ctx.fillStyle = `rgba(245, 158, 11, ${0.8 * pulse})`;
    for (let sx = bx + 4; sx < bx + 36; sx += 8) {
      ctx.fillRect(sx, by + 4, 4, bannerH - 8);
    }
    for (let sx = bx + bannerW - 36; sx < bx + bannerW - 4; sx += 8) {
      ctx.fillRect(sx, by + 4, 4, bannerH - 8);
    }

    ctx.font = '900 13px monospace';
    ctx.fillStyle = `rgba(254, 240, 138, ${0.9 + 0.1 * pulse})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚠ ALARM: ZRZUT KWASU // EWAKUACJA DOLNYCH SEKTORÓW ⚠', screenCenterX, by + 16);

    ctx.font = '700 11px monospace';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`POZIOM ZAGROŻENIA ROŚNIE ZA: ${Math.max(0, ACID_SURGE_SYSTEM.timer).toFixed(1)}s`, screenCenterX, by + 33);
  } else if (state === 'FLOODED') {
    const pulse = 0.6 + 0.4 * Math.sin(time * 3.5);
    const bannerW = 440;
    const bannerH = 26;
    const bx = screenCenterX - bannerW * 0.5;
    const by = bannerY;

    ctx.fillStyle = 'rgba(6, 30, 20, 0.85)';
    ctx.fillRect(bx, by, bannerW, bannerH);
    ctx.strokeStyle = `rgba(16, 185, 129, ${0.5 * pulse})`;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, bannerW, bannerH);

    ctx.font = '900 11px monospace';
    ctx.fillStyle = `rgba(167, 243, 208, ${0.9 * pulse})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`☣ SEKTOR X ZALANY // CZAS DO ODPŁYWU: ${Math.max(0, ACID_SURGE_SYSTEM.timer).toFixed(0)}s ☣`, screenCenterX, by + 13);
  }

  ctx.restore();
}

// =========================================================================
