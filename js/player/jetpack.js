// =========================================================================
// PLAYER/JETPACK.JS - FASONY I MODYFIKACJA KOLORU OGNIA Z JETPACKA
// Dedykowany moduł stylów i barw napędu odrzutowego postaci
// =========================================================================

import { DEFAULT_VISUALS } from './hair.js';

export const JETPACK_STYLE_LIST = [
  'classic' // Model podstawowy: Tytanowy plecak odrzutowy Mk.I z dwoma cylindrami i diodami LED
];

export const JETPACK_STYLE_NAMES = {
  classic: 'Plecak Odrzutowy Mk.I'
};

// Dostępne kolory ognia i poświaty napędu jetpacka
export const JETPACK_COLOR_LIST = [
  '#00e5ff', // Błękitny Neon (Cyan Ion - domyślny hosta)
  '#f97316', // Ognisty Pomarańcz (Blaze Orange - klasyczny ogień)
  '#10b981', // Kwasowa Zieleń (Toxic Acid - kwasowy jad)
  '#a855f7', // Fioletowa Plazma (Void Plasma - antymateria)
  '#ef4444', // Rubinowa Czerwień (Crimson Fury - rakietowy)
  '#eab308', // Złocisty Słoneczny (Solar Gold - termiczny)
  '#ec4899', // Cyber Róż (Neon Pink - synthwave)
  '#f8fafc'  // Biały Kriogeniczny (Cryo Ice - chłodny lód)
];

export const JETPACK_COLOR_NAMES = {
  '#00e5ff': 'Błękitny Neon (Cyjan)',
  '#f97316': 'Ognisty Pomarańcz (Ogień)',
  '#10b981': 'Kwasowa Zieleń (Kwas)',
  '#a855f7': 'Fioletowa Plazma (Plazma)',
  '#ef4444': 'Rubinowa Czerwień (Rakietowy)',
  '#eab308': 'Złocisty Słoneczny (Słoneczny)',
  '#ec4899': 'Cyber Róż (Synthwave)',
  '#f8fafc': 'Kriogeniczny Lód (Biały)'
};

/**
 * Zwraca kompletną paletę barwną dla wybranego koloru ognia jetpacka:
 * odcień bazowy, poświatę, rdzeń, głęboki cień oraz zestaw barw dla cząsteczek.
 */
export function getJetpackFlamePalette(color = '#00e5ff') {
  const c = String(color).toLowerCase();

  switch (c) {
    case '#f97316': // Pomarańczowy ogień
      return {
        base: '#f97316',
        glow: '#fb923c',
        light: '#fed7aa',
        deep: '#ea580c',
        alphaZero: 'rgba(249, 115, 22, 0)',
        particles: ['#f97316', '#fb923c', '#fdba74', '#ffffff']
      };
    case '#10b981': // Kwasowa zieleń
      return {
        base: '#10b981',
        glow: '#34d399',
        light: '#a7f3d0',
        deep: '#059669',
        alphaZero: 'rgba(16, 185, 129, 0)',
        particles: ['#10b981', '#34d399', '#6ee7b7', '#ffffff']
      };
    case '#a855f7': // Fioletowa plazma
      return {
        base: '#a855f7',
        glow: '#c084fc',
        light: '#e9d5ff',
        deep: '#7e22ce',
        alphaZero: 'rgba(168, 85, 247, 0)',
        particles: ['#a855f7', '#c084fc', '#d8b4fe', '#ffffff']
      };
    case '#ef4444': // Rubinowa czerwień
      return {
        base: '#ef4444',
        glow: '#f87171',
        light: '#fecaca',
        deep: '#b91c1c',
        alphaZero: 'rgba(239, 68, 68, 0)',
        particles: ['#ef4444', '#f87171', '#fca5a5', '#ffffff']
      };
    case '#eab308': // Złocisty słoneczny
      return {
        base: '#eab308',
        glow: '#facc15',
        light: '#fef08a',
        deep: '#ca8a04',
        alphaZero: 'rgba(234, 179, 8, 0)',
        particles: ['#eab308', '#facc15', '#fde047', '#ffffff']
      };
    case '#ec4899': // Cyber róż
      return {
        base: '#ec4899',
        glow: '#f472b6',
        light: '#fbcfe8',
        deep: '#be185d',
        alphaZero: 'rgba(236, 72, 153, 0)',
        particles: ['#ec4899', '#f472b6', '#f9a8d4', '#ffffff']
      };
    case '#f8fafc': // Biały kriogeniczny
      return {
        base: '#e2e8f0',
        glow: '#93c5fd',
        light: '#ffffff',
        deep: '#64748b',
        alphaZero: 'rgba(226, 232, 240, 0)',
        particles: ['#ffffff', '#e2e8f0', '#93c5fd', '#60a5fa']
      };
    case '#00e5ff': // Błękitny cyjan (domyślny)
    default:
      return {
        base: '#00e5ff',
        glow: '#38bdf8',
        light: '#a5f3fc',
        deep: '#0284c7',
        alphaZero: 'rgba(0, 229, 255, 0)',
        particles: ['#00e5ff', '#38bdf8', '#0284c7', '#ffffff']
      };
  }
}

/**
 * Renderuje wielowarstwowy naddźwiękowy strumień ognia/plazmy z dyszy:
 * - wielostopniowy płaszcz gazowy o kształcie naddźwiękowej fali rozprężnej
 * - diamenty uderzeniowe Macha (Shock Diamonds) pulsujące w osi ciągu
 * - biały jaskrawy rdzeń plazmowy (Hot Core Needle)
 * - radialna poświata i addytywny blask (Bloom Glow)
 */
export function drawJetpackThrustPlume(
  ctx,
  originX,
  originY,
  nozzleWidth = 7.0,
  angle = Math.PI / 2,
  power = 1.0,
  palette = null,
  options = {}
) {
  if (!ctx) return;
  const pwr = Math.max(0.20, Math.min(1.4, power));
  const pal = palette || getJetpackFlamePalette('#00e5ff');
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());

  // Dynamiczne fluktuacje ciśnienia w komorze wylotowej
  const timeSec = now * 0.001;
  const jitter = Math.sin(timeSec * 50.0) * 0.55 + Math.cos(timeSec * 82.0) * 0.45;

  const baseLen = options.length || 36.0;
  const plumeLen = baseLen * (0.85 + pwr * 0.45 + jitter * 0.14);
  const mouthW = Math.max(nozzleWidth * 1.15, 5.0);

  ctx.save();
  ctx.translate(originX, originY);
  ctx.rotate(angle - Math.PI / 2); // Kąt wektora ciągu (w dół w osi Y)

  // 1. Zewnętrzna poświata wolumetryczna (Radial Bloom Glow)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const bloomR = plumeLen * 0.85;
  const bloomGrad = ctx.createRadialGradient(0, plumeLen * 0.35, 1, 0, plumeLen * 0.35, bloomR);
  bloomGrad.addColorStop(0.0, pal.glow);
  bloomGrad.addColorStop(0.35, pal.base);
  bloomGrad.addColorStop(1.0, pal.alphaZero);

  ctx.globalAlpha = 0.55 * pwr;
  ctx.fillStyle = bloomGrad;
  ctx.beginPath();
  ctx.arc(0, plumeLen * 0.35, bloomR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Główny płaszcz plazmowy (Outer Shock Envelope)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const halfW = mouthW * 0.55;
  const maxW = mouthW * (1.10 + jitter * 0.22);
  const tipWiggle = Math.sin(timeSec * 38.0) * (plumeLen * 0.05);

  const flameGrad = ctx.createLinearGradient(0, 0, 0, plumeLen);
  flameGrad.addColorStop(0.0, '#ffffff');
  flameGrad.addColorStop(0.15, pal.light);
  flameGrad.addColorStop(0.50, pal.base);
  flameGrad.addColorStop(0.85, pal.deep);
  flameGrad.addColorStop(1.0, pal.alphaZero);

  ctx.fillStyle = flameGrad;
  ctx.globalAlpha = 0.88;
  ctx.beginPath();
  ctx.moveTo(-halfW, 0);
  ctx.bezierCurveTo(
    -maxW * 1.35, plumeLen * 0.22,
    -maxW * 0.90, plumeLen * 0.65,
    tipWiggle, plumeLen
  );
  ctx.bezierCurveTo(
    maxW * 0.90, plumeLen * 0.65,
    maxW * 1.35, plumeLen * 0.22,
    halfW, 0
  );
  ctx.closePath();
  ctx.fill();

  // 3. Wewnętrzny jaskrawy strumień plazmy (Inner Jet Core)
  const innerLen = plumeLen * 0.74;
  const innerW = halfW * 0.70;
  const innerGrad = ctx.createLinearGradient(0, 0, 0, innerLen);
  innerGrad.addColorStop(0.0, '#ffffff');
  innerGrad.addColorStop(0.30, pal.light);
  innerGrad.addColorStop(0.80, pal.base);
  innerGrad.addColorStop(1.0, pal.alphaZero);

  ctx.fillStyle = innerGrad;
  ctx.globalAlpha = 1.0;
  ctx.beginPath();
  ctx.moveTo(-innerW, 0);
  ctx.quadraticCurveTo(-innerW * 1.25, innerLen * 0.40, 0, innerLen);
  ctx.quadraticCurveTo(innerW * 1.25, innerLen * 0.40, innerW, 0);
  ctx.closePath();
  ctx.fill();

  // 4. Diamenty Macha (Supersonic Shock Diamonds)
  const diamondCount = (plumeLen > 24.0) ? 3 : (plumeLen > 12.0 ? 2 : 1);
  const diamondOffsets = [0.22, 0.46, 0.70];
  const diamondSizes = [
    { w: mouthW * 0.52, h: plumeLen * 0.15 },
    { w: mouthW * 0.38, h: plumeLen * 0.12 },
    { w: mouthW * 0.24, h: plumeLen * 0.09 }
  ];

  for (let d = 0; d < diamondCount; d++) {
    const dDist = plumeLen * diamondOffsets[d] + Math.sin(timeSec * 52.0 + d * 2.2) * 1.1;
    const dw = diamondSizes[d].w * (0.92 + jitter * 0.15);
    const dh = diamondSizes[d].h * (0.92 - jitter * 0.15);

    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.moveTo(0, dDist - dh * 0.5);
    ctx.lineTo(dw * 0.5, dDist);
    ctx.lineTo(0, dDist + dh * 0.5);
    ctx.lineTo(-dw * 0.5, dDist);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = pal.light;
    ctx.lineWidth = 0.9;
    ctx.stroke();
  }

  // 5. Ostra iglica plazmowa w gardzieli wylotu
  const coreH = plumeLen * 0.38;
  const coreW = mouthW * 0.35;
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 1.0;
  ctx.beginPath();
  ctx.moveTo(-coreW, 0);
  ctx.lineTo(0, coreH);
  ctx.lineTo(coreW, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore(); // end lighter
  ctx.restore(); // end transform
}

/**
 * Renderuje estetyczny podgląd modelu jetpacka z aktywnym płomieniem wybranego koloru
 * wewnątrz kafelka Kreatora Postaci (canvas 68x68).
 */
export function drawJetpackPreview(
  ctx,
  canvasW,
  canvasH,
  styleId = 'classic',
  flameColor = '#00e5ff',
  visuals = {}
) {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvasW, canvasH);

  const flamePal = getJetpackFlamePalette(flameColor || visuals.jetpackColor || '#00e5ff');

  ctx.save();
  // Centrowanie w oknie kafelka
  ctx.translate(canvasW * 0.50, canvasH * 0.44);
  const scale = Math.min(canvasW, canvasH) / 38.0;
  ctx.scale(scale, scale);

  // 1. Główna płyta nośna plecaka (Backplate)
  const plateW = 15;
  const plateH = 21;
  const plateX = -plateW / 2;
  const plateY = -12;

  const plateGrad = ctx.createLinearGradient(plateX, 0, plateX + plateW, 0);
  plateGrad.addColorStop(0.0, '#0f172a');
  plateGrad.addColorStop(0.5, '#334155');
  plateGrad.addColorStop(1.0, '#0f172a');
  ctx.fillStyle = plateGrad;
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(plateX, plateY, plateW, plateH, 2.5);
  else ctx.rect(plateX, plateY, plateW, plateH);
  ctx.fill();
  ctx.stroke();

  // 2. Dwa cylindryczne zbiorniki paliwa (lewy i prawy)
  const tankW = 5.2;
  const tankH = 19;
  const tanks = [-6.2, 1.0];

  tanks.forEach((tx) => {
    const tankGrad = ctx.createLinearGradient(tx, 0, tx + tankW, 0);
    tankGrad.addColorStop(0.0, '#0f172a');
    tankGrad.addColorStop(0.35, '#475569');
    tankGrad.addColorStop(0.75, '#64748b');
    tankGrad.addColorStop(1.0, '#1e293b');
    ctx.fillStyle = tankGrad;
    ctx.fillRect(tx, plateY + 1, tankW, tankH);
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 0.7;
    ctx.strokeRect(tx, plateY + 1, tankW, tankH);

    // Górny zawór ciśnieniowy
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(tx + 1.1, plateY - 1.8, tankW - 2.2, 2.2);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(tx + 1.1, plateY - 1.8, tankW - 2.2, 2.2);

    // Obejmy mocujące (ribs)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(tx, plateY + 6.5, tankW, 1.5);
    ctx.fillRect(tx, plateY + 13.5, tankW, 1.5);

    // Dolna dysza wylotowa (nozzle)
    const nzX = tx + 0.4;
    const nzY = plateY + tankH + 1;
    const nzW = tankW - 0.8;
    const nzH = 4.0;

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(nzX + 0.6, nzY);
    ctx.lineTo(nzX + nzW - 0.6, nzY);
    ctx.lineTo(nzX + nzW + 0.9, nzY + nzH);
    ctx.lineTo(nzX - 0.9, nzY + nzH);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Pierścień żaroodporny dyszy
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(nzX - 0.9, nzY + nzH);
    ctx.lineTo(nzX + nzW + 0.9, nzY + nzH);
    ctx.stroke();

    // Płomień i naddźwiękowe diamenty uderzeniowe Macha z dyszy
    drawJetpackThrustPlume(
      ctx,
      nzX + nzW * 0.5,
      nzY + nzH,
      nzW,
      Math.PI / 2,
      1.0,
      flamePal,
      { length: 13.5 }
    );
  });

  // 3. Centralny wskaźnik LED paliwa (4 segmenty w wybranym kolorze napędu)
  const panelW = 3.6;
  const panelH = 15;
  const panelX = -panelW / 2;
  const panelY = plateY + 3.0;

  ctx.fillStyle = '#050811';
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 0.6;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  const segW = 2.4;
  const segH = 2.4;
  const segX = -segW / 2;
  const segOffsets = [10.8, 7.6, 4.4, 1.2];

  for (let i = 0; i < 4; i++) {
    const sY = panelY + segOffsets[i];
    ctx.save();
    ctx.fillStyle = flamePal.base;
    ctx.shadowColor = flamePal.glow;
    ctx.shadowBlur = 6;
    ctx.fillRect(segX, sY, segW, segH);

    // Jasny rdzeń diody LED
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(segX + 0.4, sY + 0.4, segW - 0.8, segH - 0.8);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Renderuje podgląd Butów Odrzutowych (Rocket Boots) Strikera w kafelku kreatora (68x68).
 */
export function drawRocketBootsPreview(
  ctx,
  canvasW,
  canvasH,
  styleId = 'classic',
  flameColor = '#00e5ff',
  visuals = {}
) {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvasW, canvasH);

  const flamePal = getJetpackFlamePalette(flameColor || visuals.jetpackColor || '#00e5ff');

  ctx.save();
  ctx.translate(canvasW * 0.44, canvasH * 0.42);
  const scale = Math.min(canvasW, canvasH) / 40.0;
  ctx.scale(scale, scale);

  // 1. Zarys bojowego buta i cholewki
  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.9;

  // Cholewka
  ctx.beginPath();
  ctx.rect(-3.5, -12, 8, 12);
  ctx.fill();
  ctx.stroke();

  // Stopa i podeszwa
  ctx.beginPath();
  ctx.moveTo(-3.5, 0);
  ctx.lineTo(8.5, 0);
  ctx.lineTo(9.5, 3.2);
  ctx.lineTo(-4.0, 3.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Gruby bieżnik podeszwy
  ctx.fillStyle = '#09090b';
  ctx.fillRect(-4.0, 2.2, 13.5, 1.2);

  // 2. Tytanowa nakładka egzoszkieletu Rocket Boots na łydce i pięcie
  const greaveGrad = ctx.createLinearGradient(-8, 0, -2, 0);
  greaveGrad.addColorStop(0.0, '#0f172a');
  greaveGrad.addColorStop(0.4, '#334155');
  greaveGrad.addColorStop(1.0, '#1e293b');
  ctx.fillStyle = greaveGrad;
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-8.5, -11, 5.2, 13.5, 1.5);
  else ctx.rect(-8.5, -11, 5.2, 13.5);
  ctx.fill();
  ctx.stroke();

  // Metalowe obejmy i hydrauliczny siłownik
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-8.0, -9.5, 4.2, 1.4);
  ctx.fillRect(-8.0, -1.5, 4.2, 1.4);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(-6.8, -7.5, 1.8, 5.5);

  // Wskaźnik LED mocy na szynie buta
  ctx.save();
  ctx.fillStyle = flamePal.base;
  ctx.shadowColor = flamePal.glow;
  ctx.shadowBlur = 6;
  ctx.fillRect(-5.2, -8.2, 1.4, 2.0);
  ctx.fillRect(-5.2, -5.5, 1.4, 2.0);
  ctx.fillRect(-5.2, -2.8, 1.4, 2.0);
  ctx.restore();

  // 3. Dysza dopalacza wylotowego na pięcie
  const nzX = -8.2;
  const nzY = 0.8;
  const nzW = 4.2;
  const nzH = 3.2;

  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(nzX, nzY);
  ctx.lineTo(nzX + nzW, nzY);
  ctx.lineTo(nzX + nzW + 0.6, nzY + nzH);
  ctx.lineTo(nzX - 0.6, nzY + nzH);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 0.7;
  ctx.stroke();

  // Pierścień żaroodporny
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(nzX - 0.6, nzY + nzH);
  ctx.lineTo(nzX + nzW + 0.6, nzY + nzH);
  ctx.stroke();

  // 4. Strumień ognia rakietowego z dyszy buta (wielowarstwowy naddźwiękowy płomień)
  drawJetpackThrustPlume(
    ctx,
    nzX + nzW * 0.5,
    nzY + nzH,
    nzW,
    Math.PI * 0.5 + 0.16,
    1.0,
    flamePal,
    { length: 15.0 }
  );

  ctx.restore();
}

/**
 * Renderuje podgląd Tłoków Kinetycznych / Siłowników Łydek Enforcera (68x68).
 * Ciężki but bojowy z zamontowanym siłownikiem pneumatycznym, sprężyną i zaworem parowym.
 */
export function drawStompModulePreview(
  ctx,
  canvasW,
  canvasH,
  styleId = 'classic',
  flameColor = '#ef4444',
  visuals = {}
) {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvasW, canvasH);

  const flamePal = getJetpackFlamePalette(flameColor || visuals.jetpackColor || '#ef4444');

  ctx.save();
  ctx.translate(canvasW * 0.44, canvasH * 0.58);
  const scale = Math.min(canvasW, canvasH) / 48.0;
  ctx.scale(scale, scale);

  // 1. Cień pod butem
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(3.0, 15.5, 12.0, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Cholewka i podeszwa ciężkiego buta bojowego
  // Gruba gumowa podeszwa z bieżnikiem
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-8.0, 11.0, 22.0, 4.5, 1.2);
  else ctx.rect(-8.0, 11.0, 22.0, 4.5);
  ctx.fill();

  // Bieżnik
  ctx.fillStyle = '#18181b';
  for (let tx = -7.0; tx <= 11.0; tx += 4.5) {
    ctx.fillRect(tx, 13.0, 2.4, 2.5);
  }

  // Korpus buta (skóra bojowa)
  ctx.fillStyle = '#1c1917';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-7.0, 11.0);
  ctx.lineTo(-7.0, 0.0);
  ctx.lineTo(-2.0, -2.0);
  ctx.lineTo(2.0, -2.0);
  ctx.lineTo(3.5, 5.0);
  ctx.lineTo(13.0, 8.5);
  ctx.lineTo(13.5, 11.0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Ochraniacz noska buta
  ctx.fillStyle = '#292524';
  ctx.beginPath();
  ctx.moveTo(4.0, 7.5);
  ctx.lineTo(12.5, 8.8);
  ctx.lineTo(13.5, 11.0);
  ctx.lineTo(5.0, 11.0);
  ctx.closePath();
  ctx.fill();

  // 3. WSPORNIK PNEUMATYCZNY (Kinetic Piston Brace) na ścięgnie achillesa / łydce
  // Karbonowy pałąk montażowy
  ctx.fillStyle = '#27272a';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-10.5, -12.0, 5.0, 22.0, 1.5);
  else ctx.rect(-10.5, -12.0, 5.0, 22.0);
  ctx.fill();
  ctx.stroke();

  // Główny cylinder hydrauliczny / pneumatyczny
  const cylGrad = ctx.createLinearGradient(-10.0, 0, -5.5, 0);
  cylGrad.addColorStop(0.0, '#3f3f46');
  cylGrad.addColorStop(0.45, '#71717a');
  cylGrad.addColorStop(1.0, '#27272a');
  ctx.fillStyle = cylGrad;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-9.8, -10.0, 3.8, 11.5, 1.0);
  else ctx.rect(-9.8, -10.0, 3.8, 11.5);
  ctx.fill();
  ctx.stroke();

  // Akcent statusu ciśnienia (neonowy pierścień w wybranym kolorze klasy)
  ctx.save();
  ctx.shadowColor = flamePal.glow;
  ctx.shadowBlur = 6;
  ctx.fillStyle = flamePal.light;
  ctx.fillRect(-9.8, -5.5, 3.8, 1.8);
  ctx.restore();

  // Tłoczysko (lśniący chromowany tłok)
  const rodGrad = ctx.createLinearGradient(-9.2, 0, -6.5, 0);
  rodGrad.addColorStop(0.0, '#d4d4d8');
  rodGrad.addColorStop(0.5, '#ffffff');
  rodGrad.addColorStop(1.0, '#a1a1aa');
  ctx.fillStyle = rodGrad;
  ctx.fillRect(-9.0, 1.5, 2.2, 7.5);

  // Sprężyna śrubowa (ciężka stal o wysokiej kompresji)
  ctx.strokeStyle = '#e4e4e7';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (let sy = -2.5; sy <= 7.0; sy += 2.3) {
    ctx.moveTo(-10.2, sy);
    ctx.lineTo(-6.0, sy + 1.2);
  }
  ctx.stroke();

  // Dolny punkt mocowania tłoka na pięcie
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.arc(-7.8, 9.5, 2.0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a1a1aa';
  ctx.beginPath();
  ctx.arc(-7.8, 9.5, 0.9, 0, Math.PI * 2);
  ctx.fill();

  // 4. Mosiężny zawór bezpieczeństwa na górze cylindra
  ctx.fillStyle = '#d97706';
  ctx.fillRect(-11.8, -11.5, 2.4, 2.8);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-12.8, -11.0, 1.4, 1.8);

  // 5. Wydobywająca się z zaworu delikatna para pod wysokim ciśnieniem
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.arc(-14.2, -10.0, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.arc(-17.0, -11.5, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.beginPath();
  ctx.arc(-20.5, -13.5, 4.0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Zunifikowany punkt wejścia renderera podglądu wyposażenia osobistego / narzędzia mobilności
 */
export function drawPersonalGearPreview(
  ctx,
  canvasW,
  canvasH,
  classId = 'RAPTOR',
  styleId = 'classic',
  flameColor = '#00e5ff',
  visuals = {}
) {
  const cid = String(classId || 'RAPTOR').toUpperCase();
  if (cid === 'STRIKER') {
    return drawRocketBootsPreview(ctx, canvasW, canvasH, styleId, flameColor, visuals);
  } else if (cid === 'ENFORCER') {
    return drawStompModulePreview(ctx, canvasW, canvasH, styleId, flameColor, visuals);
  } else {
    return drawJetpackPreview(ctx, canvasW, canvasH, styleId, flameColor, visuals);
  }
}

