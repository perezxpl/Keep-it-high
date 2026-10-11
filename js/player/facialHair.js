// =========================================================================
// PLAYER/FACIALHAIR.JS - SYSTEM ZAROSTU TWARZY, PALET I PODGLĄDÓW KREATORA
// Zarządza stylami zarostu (brody, wąsy, kilkudniowy zarost) oraz renderowaniem
// =========================================================================

import { DEFAULT_VISUALS, getHairPalette, drawCharacterHairProfile, drawCharacterHairOverEarProfile } from './hair.js';

export const BEARD_STYLE_LIST = [
  'clean',              // 1. Gładko ogolony (brak zarostu)
  'stubble',            // 2. Delikatny, jednolity cień zarostu (bez kropek)
  'mustache',           // 3. Klasyczny gęsty wąs wojskowy / komandos
  'goatee',             // 4. Kozia bródka z wąsem (van dyke / circle beard)
  'short_beard',        // 5. Krótka, przycięta broda taktyczna z wąsem
  'beard_no_mustache'   // 6. Pełna broda wzdłuż żuchwy i podbródka bez wąsów (chin curtain)
];

export const BEARD_COLOR_LIST = [
  '#18181b', // Kruczoczarny
  '#3b2314', // Ciemny brąz / Espresso
  '#6b3e26', // Kasztanowy brąz
  '#92400e', // Ciepły bursztyn / Brudny blond
  '#eab308', // Złoty blond
  '#c2410c', // Miedziany rudy
  '#64748b', // Stalowosiwy / Sól z pieprzem
  '#e2e8f0'  // Platynowy / Siwy
];

/**
 * Zwraca paletę odcieni dla koloru zarostu (baza, cienie, podświetlenia, stubble)
 */
export function getBeardPalette(hexColor) {
  const clean = String(hexColor || '#18181b').trim().replace('#', '');
  const num = parseInt(clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean.padEnd(6, '0'), 16) || 0x18181b;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const rgb = (rr, gg, bb) => `rgb(${clamp(rr)}, ${clamp(gg)}, ${clamp(bb)})`;
  const rgba = (rr, gg, bb, a) => `rgba(${clamp(rr)}, ${clamp(gg)}, ${clamp(bb)}, ${a})`;

  return {
    base: rgb(r, g, b),
    dark: rgb(r * 0.60, g * 0.60, b * 0.60),
    deep: rgb(r * 0.35, g * 0.35, b * 0.35),
    light: rgb(r + (255 - r) * 0.25 + 10, g + (255 - g) * 0.25 + 10, b + (255 - b) * 0.25 + 10),
    highlight: rgba(Math.min(255, r + 70), Math.min(255, g + 70), Math.min(255, b + 70), 0.35),
    stubbleDark: rgba(r * 0.42, g * 0.42, b * 0.42, 0.26),
    stubbleMid: rgba(r * 0.50, g * 0.50, b * 0.50, 0.14),
    stubbleFade: rgba(r, g, b, 0.0)
  };
}

/**
 * Renderuje wybrany zarost na profilu twarzy postaci.
 * Współrzędne twarzy w profilu:
 * - Nos: (6.8, -1.0)
 * - Pod nosem: (5.1, -0.4)
 * - Warga górna: (5.5, 0.6)
 * - Usta: (4.9, 1.4)
 * - Warga dolna: (5.3, 2.3)
 * - Podbródek: (4.3, 4.8)
 * - Żuchwa: (0.2, 4.4) do kąta żuchwy (-3.5, 3.8)
 * - Ucho: (-2.6, -0.6), promień poziomy 1.6, promień pionowy 2.2 -> przednia krawędź ucha to x = -1.0.
 *
 * Wszystkie linie zarostu i baczki leżą ściśle przed uchem (x >= -0.9) lub pod płatkiem ucha (y >= 2.0),
 * dzięki czemu zarost NIGDY nie zasłania ucha!
 */
export function drawCharacterFacialHairProfile(ctx, v, hasHelmet = false) {
  const rawHeadgear = String((v && v.headgearStyle) || 'none').toLowerCase();
  if (rawHeadgear === 'balaclava') return;

  const rawStyle = String(v.beardStyle || 'clean').toLowerCase();
  const style = (rawStyle === 'none' || rawStyle === 'shaved') ? 'clean' : rawStyle;
  if (style === 'clean') return;

  const colorHex = v.beardColor || v.hairColor || '#18181b';
  const pal = getBeardPalette(colorHex);

  const beardGrad = ctx.createLinearGradient(0, 0, 5.5, 5.0);
  beardGrad.addColorStop(0.0, pal.dark);
  beardGrad.addColorStop(0.55, pal.base);
  beardGrad.addColorStop(1.0, pal.light);

  ctx.save();

  if (style === 'stubble') {
    // 1. DELIKATNY, JEDNOLITY 3-DNIOWY ZAROST (STUBBLE - GŁADKI I MIĘKKI CIEŃ BEZ KROPEK)
    // Miękki, półprzezroczysty gradient rozłożony wzdłuż żuchwy, podbródka i nad wargą.
    const stubGrad = ctx.createLinearGradient(-0.8, 1.0, 5.0, 4.5);
    stubGrad.addColorStop(0.0, pal.stubbleDark);
    stubGrad.addColorStop(0.65, pal.stubbleMid);
    stubGrad.addColorStop(1.0, pal.stubbleFade);

    ctx.beginPath();
    // Baczki ściśle przed uchem (ucho kończy się na x = -1.0)
    ctx.moveTo(-0.9, 0.6);
    ctx.quadraticCurveTo(0.2, 1.4, 2.0, 1.5); // łagodna linia policzka
    ctx.lineTo(3.8, 0.2); // pod nosem
    ctx.lineTo(5.1, 0.0);
    ctx.lineTo(5.4, 0.8); // warga górna
    ctx.lineTo(4.8, 1.4); // kącik ust
    ctx.lineTo(5.2, 2.4); // warga dolna
    ctx.lineTo(4.4, 4.8); // podbródek
    ctx.lineTo(0.2, 4.5); // dolna krawędź żuchwy
    ctx.lineTo(-2.0, 3.8); // kąt żuchwy (pod płatkiem ucha)
    ctx.lineTo(-0.9, 0.6);
    ctx.closePath();
    ctx.fillStyle = stubGrad;
    ctx.fill();

  } else if (style === 'mustache') {
    // 2. KLASYCZNY WOJSKOWY WĄS
    ctx.beginPath();
    ctx.moveTo(3.6, -0.2);
    ctx.quadraticCurveTo(4.6, -0.6, 5.4, -0.3); // nasada pod nosem
    ctx.quadraticCurveTo(6.1, 0.5, 5.8, 1.3); // krawędź wąsa nad wargą
    ctx.lineTo(4.8, 1.5);
    ctx.quadraticCurveTo(4.2, 0.8, 3.6, 0.5);
    ctx.closePath();
    ctx.fillStyle = beardGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Kosmyki / pasma wąsa
    ctx.strokeStyle = pal.highlight;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(4.2, 0.1);
    ctx.lineTo(5.5, 0.6);
    ctx.moveTo(3.9, 0.4);
    ctx.lineTo(5.2, 1.1);
    ctx.stroke();

  } else if (style === 'goatee') {
    // 3. KOZIA BRÓDKA Z WĄSEM (CIRCLE BEARD)
    // A. Wąs
    ctx.beginPath();
    ctx.moveTo(3.8, -0.1);
    ctx.quadraticCurveTo(4.6, -0.5, 5.4, -0.2);
    ctx.quadraticCurveTo(6.0, 0.6, 5.7, 1.4);
    ctx.lineTo(4.8, 1.5);
    ctx.quadraticCurveTo(4.3, 0.7, 3.8, 0.4);
    ctx.closePath();
    ctx.fillStyle = beardGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // B. Bródka na podbródku
    ctx.beginPath();
    ctx.moveTo(4.4, 2.4); // pod dolną wargą
    ctx.lineTo(5.5, 2.7);
    ctx.quadraticCurveTo(5.4, 4.4, 4.7, 5.4); // wydłużony podbródek
    ctx.lineTo(2.8, 4.8);
    ctx.quadraticCurveTo(2.6, 3.6, 3.5, 2.6);
    ctx.closePath();
    ctx.fillStyle = beardGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Pasmo łączące kącik ust z bródką
    ctx.beginPath();
    ctx.moveTo(4.8, 1.4);
    ctx.lineTo(5.5, 2.5);
    ctx.lineTo(4.8, 2.6);
    ctx.closePath();
    ctx.fillStyle = pal.base;
    ctx.fill();

    // Akcent świetlny na podbródku
    ctx.strokeStyle = pal.highlight;
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.moveTo(4.2, 3.3);
    ctx.lineTo(4.5, 4.8);
    ctx.stroke();

  } else if (style === 'short_beard') {
    // 4. KRÓTKA BRODA TAKTYCZNA Z WĄSEM (Baczki przed uchem, żuchwa, podbródek i wąs)
    ctx.beginPath();
    // Baczki ściśle przed uchem (ucho jest na x = -2.6 do -1.0)
    ctx.moveTo(-0.9, 0.2);
    ctx.lineTo(-0.1, 0.2);
    // Przejście przez policzek
    ctx.quadraticCurveTo(1.2, 1.2, 2.5, 1.3);
    // Wąs pod nosem
    ctx.lineTo(3.8, -0.1);
    ctx.quadraticCurveTo(4.7, -0.5, 5.4, -0.2);
    ctx.quadraticCurveTo(6.0, 0.6, 5.7, 1.4);
    ctx.lineTo(5.0, 1.6);
    // Krawędź wokół ust i dolnej wargi
    ctx.lineTo(5.4, 2.4);
    ctx.lineTo(5.6, 3.8); // zarys podbródka
    ctx.quadraticCurveTo(5.2, 5.3, 4.4, 5.5);
    // Linia dolna żuchwy
    ctx.lineTo(0.0, 5.0);
    ctx.lineTo(-2.2, 4.0); // poniżej ucha
    ctx.lineTo(-0.9, 0.2); // powrót przed uchem
    ctx.closePath();
    ctx.fillStyle = beardGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.85;
    ctx.stroke();

    // Wycięcie na usta / wargi
    ctx.fillStyle = v.skinMid || '#f5b078';
    ctx.beginPath();
    ctx.moveTo(4.2, 1.4);
    ctx.lineTo(4.8, 1.3);
    ctx.lineTo(4.5, 2.3);
    ctx.lineTo(3.8, 2.0);
    ctx.closePath();
    ctx.fill();

    // Kosmyki i podświetlenia
    ctx.strokeStyle = pal.highlight;
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.moveTo(0.2, 1.6);
    ctx.lineTo(2.0, 3.6);
    ctx.moveTo(3.4, 3.2);
    ctx.lineTo(4.4, 5.0);
    ctx.stroke();

  } else if (style === 'beard_no_mustache') {
    // 5. PEŁNA BRODA CAŁEGO PODBRÓDKA I ŻUCHWY BEZ WĄSÓW (CHIN CURTAIN / SHENANDOAH)
    // Wąs pod nosem i nad górną wargą jest całkowicie wygolony / gładki
    ctx.beginPath();
    // Baczki ściśle przed uchem (ucho jest na x = -2.6 do -1.0)
    ctx.moveTo(-0.9, 0.2);
    ctx.lineTo(-0.1, 0.2);
    // Linia policzka schodząca wprost do podbródka, omijając wąs
    ctx.quadraticCurveTo(1.2, 1.4, 2.4, 1.8);
    // Krawędź omijająca usta – biegnie pod dolną wargą (brak wąsa pod nosem!)
    ctx.lineTo(4.2, 2.5);
    ctx.lineTo(5.2, 2.8);
    ctx.lineTo(5.6, 4.0); // mocny zarys podbródka
    ctx.quadraticCurveTo(5.2, 5.5, 4.4, 5.6);
    // Linia dolna żuchwy
    ctx.lineTo(0.0, 5.1);
    ctx.lineTo(-2.2, 4.1); // poniżej ucha
    ctx.lineTo(-0.9, 0.2); // powrót przed uchem
    ctx.closePath();
    ctx.fillStyle = beardGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.90;
    ctx.stroke();

    // Akcenty pasm brody
    ctx.strokeStyle = pal.highlight;
    ctx.lineWidth = 0.70;
    ctx.beginPath();
    ctx.moveTo(0.5, 2.2);
    ctx.lineTo(2.6, 4.2);
    ctx.moveTo(3.5, 3.4);
    ctx.lineTo(4.6, 5.2);
    ctx.stroke();

    ctx.strokeStyle = pal.dark;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(-0.2, 2.8);
    ctx.lineTo(1.8, 4.6);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renderuje samą głowę z wybranym stylem zarostu, kolorem zarostu, fryzurą i kolorem włosów
 * na kafelku wyboru w Kreatorze Postaci (zakładka "ZAROST").
 *
 * KOLEJNOŚĆ WARSTW:
 * 1. Szyja i czaszka (twarz)
 * 2. Ucho
 * 3. ZAROST TWARZY (drawCharacterFacialHairProfile)
 * 4. WŁOSY Z GŁOWY (drawCharacterHairProfile + overEar) - opadają NA zarost i baczki
 * 5. Oko i brew
 */
export function drawHeadBeardPreview(
  ctx,
  canvasW,
  canvasH,
  beardStyle = 'clean',
  beardColor = '#18181b',
  hairStyle = 'buzzcut',
  hairColor = '#18181b'
) {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvasW, canvasH);

  const v = {
    ...DEFAULT_VISUALS,
    hairStyle,
    hairColor,
    beardStyle,
    beardColor
  };
  const hairPal = getHairPalette(hairColor);

  const tileDummy = {
    _isStaticTile: true
  };

  ctx.save();
  // Wyśrodkowanie głowy
  ctx.translate(canvasW * 0.58, canvasH * 0.50);
  const scale = Math.min(canvasW, canvasH) / 29.0;
  ctx.scale(scale, scale);

  // 1. Szyja
  const neckGrad = ctx.createLinearGradient(-3.2, 0, 2.0, 0);
  neckGrad.addColorStop(0.0, v.skinDark);
  neckGrad.addColorStop(0.5, v.skinBack);
  neckGrad.addColorStop(1.0, v.skinMid);

  ctx.beginPath();
  ctx.moveTo(-3.0, 2.2);
  ctx.lineTo(-3.2, 7.6);
  ctx.quadraticCurveTo(-0.5, 8.4, 2.0, 7.6);
  ctx.lineTo(1.8, 3.2);
  ctx.closePath();
  ctx.fillStyle = neckGrad;
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // Cień pod żuchwą
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.moveTo(-0.8, 3.2);
  ctx.lineTo(1.8, 3.8);
  ctx.lineTo(1.7, 5.4);
  ctx.lineTo(-0.8, 4.4);
  ctx.closePath();
  ctx.fill();

  // 2. Czaszka i profil twarzy
  const faceGrad = ctx.createLinearGradient(-5.0, 0, 7.0, 0);
  faceGrad.addColorStop(0.0, v.skinBack);
  faceGrad.addColorStop(0.5, v.skinMid);
  faceGrad.addColorStop(1.0, v.skinLight);

  ctx.beginPath();
  ctx.moveTo(-4.6, 2.5);
  ctx.quadraticCurveTo(-6.4, 0.2, -6.0, -2.8);
  ctx.quadraticCurveTo(-5.4, -7.2, -1.2, -7.2);
  ctx.quadraticCurveTo(2.8, -7.0, 4.2, -5.2);
  ctx.lineTo(4.4, -3.4);
  ctx.lineTo(6.8, -1.0);
  ctx.lineTo(5.1, -0.4);
  ctx.lineTo(5.5, 0.6);
  ctx.lineTo(4.9, 1.4);
  ctx.lineTo(5.3, 2.3);
  ctx.lineTo(4.3, 4.8);
  ctx.lineTo(0.2, 4.4);
  ctx.lineTo(-3.5, 3.8);
  ctx.closePath();
  ctx.fillStyle = faceGrad;
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // 3. Ucho (zarost nie zasłania ucha)
  ctx.fillStyle = v.skinBack;
  ctx.beginPath();
  ctx.ellipse(-2.6, -0.6, 1.6, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = v.skinDark;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(-2.5, -0.6, 1.1, 0.4 * Math.PI, 1.7 * Math.PI, false);
  ctx.stroke();

  // 4. Zarost twarzy (rysowany POD włosami z głowy!)
  drawCharacterFacialHairProfile(ctx, v, false);

  // 5. Fryzura postaci (włosy z głowy nakładające się z góry NA zarost i baczki)
  drawCharacterHairProfile(ctx, tileDummy, v, 1, 0, 0, false);
  drawCharacterHairOverEarProfile(ctx, v, hairPal, false);

  // 6. Oko i brew
  const eyeCenterX = 2.7;
  const eyeCenterY = -2.1;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(eyeCenterX, eyeCenterY, 1.5, 1.0, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(eyeCenterX + 0.55, eyeCenterY, 0.72, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(eyeCenterX + 0.52, eyeCenterY - 0.25, 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hairPal.dark;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(1.4, -3.3);
  ctx.lineTo(4.4, -3.5);
  ctx.stroke();

  ctx.restore();
}
