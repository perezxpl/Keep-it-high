// =========================================================================
// PLAYER/MASK.JS - SYSTEM MASEK, OKULARÓW I AKCESORIÓW TWARZY
// Zarządza stylami masek (chusta shemagh, ciemne okulary, muchy, czaszka Ghost,
// maska gazowa, maska hokejowa, balistyczna, Oni, respirator)
// oraz ich renderowaniem na profilu postaci i w Kreatorze.
// =========================================================================

import {
  DEFAULT_VISUALS,
  getHairPalette,
  drawCharacterHairProfile,
  drawCharacterHairOverEarProfile
} from './hair.js';
import { drawCharacterFacialHairProfile } from './facialHair.js';
import { drawCharacterHeadgearProfile } from './headgear.js';

export const MASK_STYLE_LIST = [
  'none',         // 1. Brak maski / czysta twarz
  'shemagh',      // 2. Chusta taktyczna / Arafatka (przeniesiona z nakryć głowy)
  'shades_dark',  // 3. Ciemne okulary przeciwsłoneczne (Black Tactical Shades)
  'shades_fly',   // 4. Okulary "muchy" z lekko przezroczystymi szkłami (Oversized Bug-Eye Shades)
  'skull',        // 5. Półmaska neoprenowa z czaszką (Ghost Skull Half-Mask)
  'gasmask',      // 6. Maska gazowa SAS / Cyber-respirator (Tactical Gas Mask)
  'hockey',       // 7. Maska hokejowa slashera (Hockey Slasher Mask)
  'ballistic',    // 8. Maska balistyczna kevlarowa (Ballistic Face Mask)
  'oni',          // 9. Cyber-Samuraj / Maska Oni (Menpo Half-Mask)
  'respirator'    // 10. Podwójny respirator neoprenowy (Dual-Valve Smog Respirator)
];

export const MASK_COLOR_LIST = [
  '#18181b', // 1. Taktyczna czerń / Onyx
  '#3f4a3c', // 2. Oliwkowa zieleń (Olive Drab / Ranger Green)
  '#5c4a38', // 3. Coyote Brown / Khaki
  '#7f1d1d', // 4. Bordowy / Karmazynowy
  '#1e293b', // 5. Ciemny granat (Navy / SWAT)
  '#475569', // 6. Stalowoszary (Urban Grey)
  '#a16207', // 7. Pustynny piaskowy (Desert Tan)
  '#e2e8f0'  // 8. Arktyczny biały / Śnieżny kamuflaż
];

/**
 * Sprawdza, czy dany styl maski obsługuje dynamiczny wybór koloru z palety
 */
export function doesMaskSupportColor(styleId = 'none') {
  const clean = String(styleId || 'none').toLowerCase();
  return clean === 'shemagh' || clean === 'respirator';
}

/**
 * Zwraca paletę odcieni dla koloru maski
 */
export function getMaskPalette(hexColor = '#18181b') {
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
    dark: rgb(r * 0.58, g * 0.58, b * 0.58),
    deep: rgb(r * 0.32, g * 0.32, b * 0.32),
    light: rgb(r + (255 - r) * 0.30 + 12, g + (255 - g) * 0.30 + 12, b + (255 - b) * 0.30 + 12),
    highlight: rgba(Math.min(255, r + 75), Math.min(255, g + 75), Math.min(255, b + 75), 0.38)
  };
}

/**
 * Rysuje maskę / okulary na profilu głowy postaci w grze i w kreatorze.
 */
export function drawCharacterMaskProfile(
  ctx,
  p,
  v,
  hasHelmet = false,
  currentFacingDir = 1,
  torsoTilt = 0,
  headPitch = 0
) {
  const rawStyle = String((v && v.maskStyle) || 'none').toLowerCase();
  const style = (rawStyle === 'brak' || rawStyle === 'shaved') ? 'none' : rawStyle;
  if (style === 'none') return;

  const colorHex = (v && v.maskColor) || '#18181b';
  const pal = getMaskPalette(colorHex);

  const maskGrad = ctx.createLinearGradient(-3.0, -1.0, 4.0, 8.0);
  maskGrad.addColorStop(0.0, pal.light);
  maskGrad.addColorStop(0.55, pal.base);
  maskGrad.addColorStop(1.0, pal.dark);

  ctx.save();

  if (style === 'shemagh') {
    // -------------------------------------------------------------------------
    // 1. CHUSTA TAKTYCZNA / SHEMAGH (Arafatka na dolną twarz i szyję)
    // -------------------------------------------------------------------------
    ctx.beginPath();
    ctx.moveTo(4.6, -1.6);
    ctx.lineTo(6.8, -1.0); // czubek nosa zakryty chustą
    ctx.lineTo(5.8, 1.2);
    ctx.lineTo(5.6, 3.2);
    ctx.lineTo(4.8, 5.2);  // podbródek
    // Obfita kaskada fałd wokół szyi i kołnierza
    ctx.lineTo(3.6, 8.2);
    ctx.quadraticCurveTo(0.2, 8.8, -2.8, 8.4);
    ctx.lineTo(-4.4, 5.0);
    ctx.lineTo(-4.2, 1.8);
    ctx.quadraticCurveTo(-1.0, -0.2, 1.2, -1.4);
    ctx.lineTo(4.6, -1.6);
    ctx.closePath();
    ctx.fillStyle = maskGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // Fałdy i zagniecenia tkaniny
    ctx.strokeStyle = pal.deep;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(1.2, -1.4);
    ctx.quadraticCurveTo(3.2, 1.2, 4.8, 4.0);
    ctx.moveTo(-1.8, 1.2);
    ctx.quadraticCurveTo(1.0, 3.8, 2.8, 7.2);
    ctx.moveTo(-3.2, 4.0);
    ctx.quadraticCurveTo(-0.8, 5.6, 1.0, 8.0);
    ctx.stroke();

    // Tradycyjny deseń w jodełkę / kratkę na chuście
    ctx.strokeStyle = pal.light;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let sy = 0; sy <= 6.5; sy += 1.8) {
      ctx.moveTo(0.5, sy);
      ctx.lineTo(3.5, sy + 1.2);
      ctx.moveTo(-2.5, sy + 1.0);
      ctx.lineTo(0.5, sy + 2.2);
    }
    ctx.stroke();

  } else if (style === 'shades_dark') {
    // -------------------------------------------------------------------------
    // 2. CIEMNE OKULARY PRZECIWSŁONECZNE (Black Tactical Shades / Wayfarer)
    // -------------------------------------------------------------------------
    // A. Zausznik biegnący od skroni ku uchu
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(2.2, -2.4);
    ctx.lineTo(-2.8, -1.4);
    ctx.stroke();

    // B. Czarna, taktyczna ramka okularów
    ctx.beginPath();
    ctx.moveTo(1.2, -3.2);
    ctx.lineTo(4.7, -3.2);
    ctx.quadraticCurveTo(5.2, -3.1, 5.0, -1.4);
    ctx.quadraticCurveTo(4.7, -0.6, 3.2, -0.8);
    ctx.quadraticCurveTo(1.4, -0.9, 1.2, -2.0);
    ctx.closePath();
    ctx.fillStyle = '#09090b';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // C. Ciemne szkło z ostrym, dynamicznym odblaskiem światła
    const lensGrad = ctx.createLinearGradient(1.5, -3.0, 4.5, -1.0);
    lensGrad.addColorStop(0.0, '#18181b');
    lensGrad.addColorStop(0.5, '#09090b');
    lensGrad.addColorStop(1.0, '#1e293b');
    ctx.beginPath();
    ctx.moveTo(1.6, -2.9);
    ctx.lineTo(4.4, -2.9);
    ctx.quadraticCurveTo(4.7, -2.9, 4.6, -1.6);
    ctx.quadraticCurveTo(4.3, -1.0, 3.2, -1.1);
    ctx.quadraticCurveTo(1.7, -1.1, 1.6, -2.0);
    ctx.closePath();
    ctx.fillStyle = lensGrad;
    ctx.fill();

    // Błysk światła (biała diagonalna smuga)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(2.2, -2.8);
    ctx.lineTo(3.8, -1.2);
    ctx.stroke();

    // Metalowy srebrny nit zawiasu na skroni
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(1.8, -2.6, 0.35, 0, Math.PI * 2);
    ctx.fill();

  } else if (style === 'shades_fly') {
    // -------------------------------------------------------------------------
    // 3. OKULARY "MUCHY" Z LEKKO PRZEZROCZYSTYMI SZKŁAMI (Bug-Eye Shades)
    // -------------------------------------------------------------------------
    // A. Cienka, stylowa metalowa oprawka i zausznik
    ctx.strokeStyle = '#94a3b8'; // stalowo-srebrny metal
    ctx.lineWidth = 0.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(2.0, -2.3);
    ctx.lineTo(-2.6, -1.3);
    ctx.stroke();

    // B. Duża, zaokrąglona soczewka typu "mucha"
    ctx.beginPath();
    ctx.moveTo(1.0, -3.6);
    ctx.quadraticCurveTo(3.2, -4.0, 5.4, -3.4);
    ctx.quadraticCurveTo(5.9, -1.8, 5.2, -0.4);
    ctx.quadraticCurveTo(3.8, 0.3, 2.0, -0.2);
    ctx.quadraticCurveTo(0.6, -0.8, 1.0, -3.6);
    ctx.closePath();

    // C. Półprzezroczyste, gradientowe dymiono-herbaciane szkło (widać oko pod spodem!)
    const flyGrad = ctx.createLinearGradient(1.5, -3.8, 4.5, 0.0);
    flyGrad.addColorStop(0.0, 'rgba(30, 41, 59, 0.60)');  // ciemniejszy szczyt
    flyGrad.addColorStop(0.5, 'rgba(180, 83, 9, 0.38)');  // ciepły bursztynowy gradient
    flyGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.45)');  // delikatny dół
    ctx.fillStyle = flyGrad;
    ctx.fill();

    // Cienka metalowa ramka z połyskiem
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 0.75;
    ctx.stroke();

    // Szeroki łukowaty odblask światła na wypukłej soczewce
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.arc(3.4, -1.8, 1.6, 1.1 * Math.PI, 1.6 * Math.PI, false);
    ctx.stroke();

  } else if (style === 'skull') {
    // -------------------------------------------------------------------------
    // 4. PÓŁMASKA NEOPRENOWA Z CZASZKĄ (Ghost Skull Half-Mask)
    // -------------------------------------------------------------------------
    // A. Czarny neoprenowy korpus zakrywający nos, usta, podbródek i żuchwę
    ctx.beginPath();
    ctx.moveTo(4.6, -2.0);
    ctx.lineTo(6.8, -1.0); // nos
    ctx.lineTo(5.8, 1.4);
    ctx.lineTo(5.4, 3.0);
    ctx.lineTo(4.6, 5.0);  // podbródek
    ctx.quadraticCurveTo(1.6, 5.2, -0.8, 4.4); // linia żuchwy
    ctx.quadraticCurveTo(-2.8, 2.0, -2.2, 0.4); // przejście pod uchem
    ctx.quadraticCurveTo(0.0, -0.8, 1.6, -1.6); // górny brzeg na policzku
    ctx.lineTo(4.6, -2.0);
    ctx.closePath();
    ctx.fillStyle = '#18181b';
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // Elastyczna górna lamówka
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.moveTo(1.6, -1.6);
    ctx.lineTo(4.6, -2.0);
    ctx.stroke();

    // B. Kredowy nadruk czaszki / szczęki (Ghost Skull Print)
    ctx.fillStyle = '#e2e8f0';
    // Kość policzkowa i nos czaszki
    ctx.beginPath();
    ctx.moveTo(4.6, -1.2);
    ctx.lineTo(6.4, -0.8);
    ctx.lineTo(5.4, 0.4);
    ctx.lineTo(3.8, 0.0);
    ctx.closePath();
    ctx.fill();

    // Zęby górne i dolne (białe segmenty z czarnymi szczelinami)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(4.2, 0.8, 1.6, 0.9);
    ctx.fillRect(4.0, 1.9, 1.5, 0.9);

    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(4.2, 1.7); ctx.lineTo(5.8, 1.7); // szczelina zgryzu
    ctx.moveTo(4.6, 0.8); ctx.lineTo(4.6, 2.8); // separacja zębów 1
    ctx.moveTo(5.1, 0.8); ctx.lineTo(5.1, 2.8); // separacja zębów 2
    ctx.stroke();

    // Dolna żuchwa czaszki
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(3.6, 2.6);
    ctx.lineTo(4.8, 2.8);
    ctx.lineTo(4.2, 4.4);
    ctx.lineTo(2.8, 4.0);
    ctx.closePath();
    ctx.fill();

  } else if (style === 'gasmask') {
    // -------------------------------------------------------------------------
    // 5. MASKA GAZOWA SAS / CYBER-RESPIRATOR (Tactical Gas Mask)
    // -------------------------------------------------------------------------
    // A. Gumowy korpus pokrywający całą twarz od czoła po podbródek
    ctx.beginPath();
    ctx.moveTo(4.4, -4.6);
    ctx.lineTo(7.2, -0.8);
    ctx.lineTo(5.8, 1.8);
    ctx.lineTo(5.6, 3.4);
    ctx.lineTo(4.6, 5.2);
    ctx.lineTo(0.0, 4.8);
    ctx.quadraticCurveTo(-2.8, 2.2, -2.4, -1.8);
    ctx.quadraticCurveTo(0.0, -4.2, 4.4, -4.6);
    ctx.closePath();
    ctx.fillStyle = '#09090b';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // B. Paski mocujące z tyłu głowy
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-1.8, -3.2); ctx.lineTo(-4.6, -2.6);
    ctx.moveTo(-2.2, 1.8);  ctx.lineTo(-4.4, 2.4);
    ctx.stroke();

    // C. Szklany wizjer z metalową oprawą
    ctx.beginPath();
    ctx.ellipse(3.2, -2.0, 1.8, 1.5, 0.1, 0, Math.PI * 2);
    ctx.fillStyle = '#022c22'; // głęboka butelkowa zieleń
    ctx.fill();
    ctx.strokeStyle = '#475569'; // stalowy pierścień
    ctx.lineWidth = 0.85;
    ctx.stroke();

    // Odblask światła na szkle wizjera
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(3.0, -2.2, 1.1, 1.2 * Math.PI, 1.8 * Math.PI, false);
    ctx.stroke();

    // D. Pochłaniacz / filtr boczny z perforacją (puszka filtra)
    ctx.save();
    ctx.translate(6.2, 2.0);
    ctx.rotate(0.2);
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.roundRect(0, -1.6, 2.8, 3.2, 0.6);
    ctx.fill();
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 0.75;
    ctx.stroke();

    // Metalowa krawędź filtra i kratka wlotowa
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(2.3, -1.2, 0.5, 2.4);
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0.8, -1.2); ctx.lineTo(0.8, 1.2);
    ctx.moveTo(1.6, -1.2); ctx.lineTo(1.6, 1.2);
    ctx.stroke();
    ctx.restore();

    // Centralny zawór wydechowy pod nosem
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.arc(5.0, 0.8, 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.6;
    ctx.stroke();

  } else if (style === 'hockey') {
    // -------------------------------------------------------------------------
    // 6. MASKA HOKEJOWA SLASHER (Hockey Mask)
    // -------------------------------------------------------------------------
    // A. Sztywna skorupa w kolorze kości słoniowej
    ctx.beginPath();
    ctx.moveTo(4.2, -4.6);
    ctx.lineTo(7.2, -0.8);
    ctx.lineTo(6.2, 2.2);
    ctx.lineTo(4.6, 5.2);
    ctx.quadraticCurveTo(1.6, 4.4, 0.4, 2.2);
    ctx.quadraticCurveTo(0.2, -2.2, 4.2, -4.6);
    ctx.closePath();
    ctx.fillStyle = '#e2e8f0'; // kość słoniowa / przybrudzona biel
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Wycięcie na oko
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.ellipse(3.2, -2.1, 1.3, 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    // B. Czerwone trójkątne oznaczenia (Slasher Chevrons)
    ctx.fillStyle = '#dc2626';
    // Trójkąt na czole
    ctx.beginPath();
    ctx.moveTo(3.6, -4.2);
    ctx.lineTo(4.4, -3.2);
    ctx.lineTo(2.8, -3.2);
    ctx.closePath();
    ctx.fill();
    // Trójkąt na policzku
    ctx.beginPath();
    ctx.moveTo(4.6, -0.4);
    ctx.lineTo(3.6, 0.6);
    ctx.lineTo(4.8, 0.8);
    ctx.closePath();
    ctx.fill();

    // C. Otwory wentylacyjne (perforacja z czarnych kropek)
    ctx.fillStyle = '#09090b';
    const holes = [
      { x: 5.6, y: -0.6 },
      { x: 5.2, y: 0.4 },
      { x: 4.8, y: 1.4 },
      { x: 4.2, y: 2.4 },
      { x: 3.6, y: 3.4 },
      { x: 3.6, y: 1.6 },
      { x: 2.8, y: 2.6 }
    ];
    holes.forEach(h => {
      ctx.beginPath();
      ctx.arc(h.x, h.y, 0.35, 0, Math.PI * 2);
      ctx.fill();
    });

    // Paski mocujące z nitami
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(1.2, -3.6); ctx.lineTo(-2.8, -2.2);
    ctx.moveTo(0.8, 1.4);  ctx.lineTo(-2.8, 0.8);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(1.2, -3.6, 0.4, 0, Math.PI * 2);
    ctx.arc(0.8, 1.4, 0.4, 0, Math.PI * 2);
    ctx.fill();

  } else if (style === 'ballistic') {
    // -------------------------------------------------------------------------
    // 7. MASKA BALISTYCZNA KEVLAROWA (Ballistic Face Mask)
    // -------------------------------------------------------------------------
    // A. Ciężki kompozyt kevlarowy o kanciastym, pancernym profilu
    ctx.beginPath();
    ctx.moveTo(4.4, -4.8);
    ctx.lineTo(7.4, -0.8);
    ctx.lineTo(6.4, 1.6);
    ctx.lineTo(5.8, 3.6);
    ctx.lineTo(4.4, 5.4);
    ctx.lineTo(0.6, 4.4);
    ctx.quadraticCurveTo(-0.8, 0.0, 1.2, -3.6);
    ctx.lineTo(4.4, -4.8);
    ctx.closePath();
    ctx.fillStyle = '#27272a';
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Wąska szczelina wizyjna na oko (slit visor)
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(1.8, -2.6);
    ctx.lineTo(4.6, -2.5);
    ctx.lineTo(4.4, -1.8);
    ctx.lineTo(1.6, -1.9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Pancerne załamania geometryczne (facets)
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.moveTo(7.4, -0.8); ctx.lineTo(3.2, 0.2);
    ctx.moveTo(6.4, 1.6);  ctx.lineTo(2.4, 2.2);
    ctx.moveTo(4.4, 5.4);  ctx.lineTo(1.8, 3.4);
    ctx.stroke();

    // Czarne nity taktyczne
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(2.0, -4.0, 0.4, 0, Math.PI * 2);
    ctx.arc(1.2, 3.8, 0.4, 0, Math.PI * 2);
    ctx.fill();

  } else if (style === 'oni') {
    // -------------------------------------------------------------------------
    // 8. CYBER-SAMURAJ / MASKA ONI (Menpo Half-Mask)
    // -------------------------------------------------------------------------
    // A. Dolna maska bojowa z agresywnym grymasem
    ctx.beginPath();
    ctx.moveTo(4.6, -1.6);
    ctx.lineTo(7.0, -0.8);
    ctx.lineTo(6.4, 1.6);
    ctx.lineTo(5.8, 3.4);
    ctx.lineTo(4.6, 5.2);
    ctx.quadraticCurveTo(1.6, 5.0, -0.4, 3.8);
    ctx.quadraticCurveTo(-1.8, 1.2, 1.4, -1.2);
    ctx.lineTo(4.6, -1.6);
    ctx.closePath();
    ctx.fillStyle = '#7f1d1d'; // karmazynowa czerwień samurajska
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // Złote okucia i zawiasy na policzku
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(1.4, -0.4, 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Wyraziste kły i zęby demona Oni
    ctx.fillStyle = '#f8fafc';
    // Górny kieł
    ctx.beginPath();
    ctx.moveTo(4.6, 1.0);
    ctx.lineTo(5.6, 0.4);
    ctx.lineTo(4.8, 2.0);
    ctx.closePath();
    ctx.fill();
    // Dolny kieł sterczący w górę
    ctx.beginPath();
    ctx.moveTo(4.0, 2.8);
    ctx.lineTo(5.2, 1.6);
    ctx.lineTo(4.6, 3.2);
    ctx.closePath();
    ctx.fill();

    // Złote wąsy / bruzdy grymasu
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(6.4, -0.2);
    ctx.quadraticCurveTo(5.2, 0.8, 3.4, 0.4);
    ctx.stroke();

  } else if (style === 'respirator') {
    // -------------------------------------------------------------------------
    // 9. PODWÓJNY RESPIRATOR NEOPRENOWY (Dual-Valve Smog Respirator)
    // -------------------------------------------------------------------------
    // A. Neoprenowa baza z wybranym kolorem tkaniny
    ctx.beginPath();
    ctx.moveTo(4.6, -1.8);
    ctx.lineTo(6.8, -1.0);
    ctx.lineTo(6.0, 1.6);
    ctx.lineTo(5.4, 3.4);
    ctx.lineTo(4.4, 5.0);
    ctx.quadraticCurveTo(1.4, 4.8, -0.6, 3.8);
    ctx.quadraticCurveTo(-1.8, 1.4, 1.2, -1.2);
    ctx.lineTo(4.6, -1.8);
    ctx.closePath();
    ctx.fillStyle = maskGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // Aluminiowy klips na grzbiecie nosa
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.rect(5.4, -1.6, 1.2, 0.6);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 0.4;
    ctx.strokeRect(5.4, -1.6, 1.2, 0.6);

    // Okrągły zawór wydechowy z filtrem na boku maski
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.ellipse(3.8, 1.8, 1.1, 1.4, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 0.65;
    ctx.stroke();

    // Membrana zaworu
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.arc(3.8, 1.8, 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Elastyczny pasek za uszami
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(1.2, -1.2); ctx.lineTo(-2.2, -0.6);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renderuje samą głowę z wybraną maską, nakryciem głowy, fryzurą, zarostem i kolorami
 * na kafelku wyboru w Kreatorze Postaci (zakładka "MASKA").
 */
export function drawHeadMaskPreview(
  ctx,
  canvasW,
  canvasH,
  maskStyle = 'none',
  maskColor = '#18181b',
  headgearStyle = 'none',
  headgearColor = '#18181b',
  hairStyle = 'buzzcut',
  hairColor = '#18181b',
  beardStyle = 'clean',
  beardColor = '#18181b'
) {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvasW, canvasH);

  const v = {
    ...DEFAULT_VISUALS,
    maskStyle,
    maskColor,
    headgearStyle,
    headgearColor,
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

  // 3. Ucho (ukrywane pod pełną kominiarką)
  if (headgearStyle !== 'balaclava') {
    ctx.fillStyle = v.skinBack;
    ctx.beginPath();
    ctx.ellipse(-2.6, -0.6, 1.6, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = v.skinDark;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(-2.5, -0.6, 1.1, 0.4 * Math.PI, 1.7 * Math.PI, false);
    ctx.stroke();
  }

  // 4. Zarost twarzy
  drawCharacterFacialHairProfile(ctx, v, false);

  // 5. Fryzura postaci
  drawCharacterHairProfile(ctx, tileDummy, v, 1, 0, 0, false);
  drawCharacterHairOverEarProfile(ctx, v, hairPal, false);

  // 6. Nakrycie głowy
  drawCharacterHeadgearProfile(ctx, tileDummy, v, false, 1, 0, 0);

  // 7. Oko i brew (zawsze rysowane pod ewentualnymi okularami lub maską)
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

  // 8. MASKA LUB OKULARY (na wierzchu)
  drawCharacterMaskProfile(ctx, tileDummy, v, false, 1, 0, 0);

  ctx.restore();
}
