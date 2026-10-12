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

    // Płomień i poświata z dyszy
    ctx.save();
    ctx.shadowColor = flamePal.glow;
    ctx.shadowBlur = 9;

    // Stożek płomienia
    const flameH = 9.5;
    const flameGrad = ctx.createLinearGradient(0, nzY + nzH, 0, nzY + nzH + flameH);
    flameGrad.addColorStop(0.0, '#ffffff');
    flameGrad.addColorStop(0.35, flamePal.base);
    flameGrad.addColorStop(1.0, flamePal.alphaZero);

    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(nzX - 0.6, nzY + nzH);
    ctx.quadraticCurveTo(nzX + nzW / 2, nzY + nzH + flameH * 0.4, nzX + nzW / 2, nzY + nzH + flameH);
    ctx.quadraticCurveTo(nzX + nzW / 2, nzY + nzH + flameH * 0.4, nzX + nzW + 0.6, nzY + nzH);
    ctx.closePath();
    ctx.fill();

    // Biały rdzeń płomienia
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(nzX + 0.3, nzY + nzH);
    ctx.lineTo(nzX + nzW / 2, nzY + nzH + 4.2);
    ctx.lineTo(nzX + nzW - 0.3, nzY + nzH);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
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

  // 4. Strumień ognia rakietowego z dyszy buta
  ctx.save();
  ctx.shadowColor = flamePal.glow;
  ctx.shadowBlur = 10;

  const fH = 11;
  const fGrad = ctx.createLinearGradient(0, nzY + nzH, 0, nzY + nzH + fH);
  fGrad.addColorStop(0.0, '#ffffff');
  fGrad.addColorStop(0.35, flamePal.base);
  fGrad.addColorStop(1.0, flamePal.alphaZero);

  ctx.fillStyle = fGrad;
  ctx.beginPath();
  ctx.moveTo(nzX - 0.4, nzY + nzH);
  ctx.quadraticCurveTo(nzX + nzW * 0.5 - 1.5, nzY + nzH + fH * 0.4, nzX + nzW * 0.5 - 2, nzY + nzH + fH);
  ctx.quadraticCurveTo(nzX + nzW * 0.5 + 0.5, nzY + nzH + fH * 0.4, nzX + nzW + 0.4, nzY + nzH);
  ctx.closePath();
  ctx.fill();

  // Rdzeń płomienia
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(nzX + 0.4, nzY + nzH);
  ctx.lineTo(nzX + nzW * 0.5 - 0.8, nzY + nzH + 4.5);
  ctx.lineTo(nzX + nzW - 0.4, nzY + nzH);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Renderuje podgląd Pasa Ładunków Wybuchowych (Blast Belt) Enforcera (68x68).
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
  ctx.translate(canvasW * 0.50, canvasH * 0.40);
  const scale = Math.min(canvasW, canvasH) / 40.0;
  ctx.scale(scale, scale);

  // 1. Ciężki pas taktyczny saperski Enforcera
  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-14.5, -5.5, 29.0, 6.2, 1.5);
  else ctx.rect(-14.5, -5.5, 29.0, 6.2);
  ctx.fill();
  ctx.stroke();

  // Metalowa klamra pasa pośrodku
  ctx.fillStyle = '#52525b';
  ctx.fillRect(-2.6, -4.8, 5.2, 4.8);
  ctx.fillStyle = '#71717a';
  ctx.fillRect(-1.5, -3.8, 3.0, 2.8);

  // 2. Trzy pancerne kasety ładunków wybuchowych (C4 / Blast Canisters) na pasie
  const canPositions = [-10.0, 0.0, 10.0];
  canPositions.forEach((cx) => {
    const x = cx - 2.4;
    const y = -7.0;
    const w = 4.8;
    const h = 9.2;

    // Obudowa ładunku
    ctx.fillStyle = '#27272a';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 1.0);
    else ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();

    // Górna zawleczka
    ctx.fillStyle = '#71717a';
    ctx.fillRect(x + 0.8, y - 1.0, w - 1.6, 1.1);

    // Rozżarzony rdzeń ładunku
    ctx.save();
    ctx.shadowColor = flamePal.glow;
    ctx.shadowBlur = 6;
    ctx.fillStyle = flamePal.light;
    ctx.fillRect(x + 0.7, y + 2.6, w - 1.4, 3.0);
    ctx.restore();

    // Dolna dysza wyrzutnika
    ctx.fillStyle = '#09090b';
    ctx.fillRect(x + 0.9, y + h, w - 1.8, 1.4);

    // 3. Płomień podpalonego lontu i zrzut w dół
    ctx.save();
    ctx.shadowColor = flamePal.glow;
    ctx.shadowBlur = 10;
    const fGrad = ctx.createLinearGradient(cx, y + h + 1.0, cx, y + h + 11.0);
    fGrad.addColorStop(0.0, '#ffffff');
    fGrad.addColorStop(0.45, flamePal.base);
    fGrad.addColorStop(1.0, flamePal.alphaZero);

    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 2.0, y + h + 1.0);
    ctx.lineTo(cx, y + h + 11.0);
    ctx.lineTo(cx + 2.0, y + h + 1.0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  // 4. Fala uderzeniowa wybuchu na dole
  ctx.save();
  ctx.shadowColor = flamePal.glow;
  ctx.shadowBlur = 10;
  ctx.strokeStyle = flamePal.light;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 13.5, 13.5, 2.6, 0, 0, Math.PI * 2);
  ctx.stroke();
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

