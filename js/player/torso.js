// =========================================================================
// PLAYER/TORSO.JS - UBRANIE TORSU: KRÓTKI / DŁUGI RĘKAW ORAZ MORO JASNE I CIEMNE
// =========================================================================

import { DEFAULT_VISUALS } from './hair.js';

export const TORSO_STYLE_LIST = [
  'sleeveless',            // Bezrękawnik bojowy (tank-top odsłaniający ramiona)
  'short_sleeve',          // Krótki rękaw (jednolity z paletą barw)
  'long_sleeve',           // Długi rękaw (bluza bojowa / jednolita)
  'camo_light_sleeveless', // Moro jasne bezrękawnik (arid tank-top)
  'camo_light_short',      // Moro jasne (krótki rękaw / pustynne arid)
  'camo_light_long',       // Moro jasne (długi rękaw / pustynne arid)
  'camo_dark_sleeveless',  // Moro ciemne bezrękawnik (woodland tank-top)
  'camo_dark_short',       // Moro ciemne (krótki rękaw / nocny woodland)
  'camo_dark_long'         // Długi rękaw (moro ciemne / nocny woodland)
];

export const TORSO_COLOR_LIST = [
  '#18181b', // Czarny taktyczny (Tactical Black)
  '#27272a', // Grafitowy (Stealth Charcoal)
  '#3f3f46', // Stalowoszary (Urban Slate)
  '#334155', // Granat bojowy (Navy Blue PMC)
  '#3f4830', // Oliwkowy (Ranger Olive Drab)
  '#715c44', // Piaskowy coyote (Coyote Tan)
  '#57534e', // Ziemisty khaki (Earth Warm)
  '#991b1b'  // Bordowy taktyczny (Crimson Operator)
];

/**
 * Sprawdza czy dany styl to bezrękawnik (tank-top)
 */
export function isSleeveless(style = 'short_sleeve') {
  const s = String(style).toLowerCase();
  return s === 'sleeveless' || s.includes('sleeveless') || s === 'tank_top';
}

/**
 * Sprawdza czy dany styl to długi rękaw
 */
export function isLongSleeve(style = 'short_sleeve') {
  const s = String(style).toLowerCase();
  return s === 'long_sleeve' || s === 'camo_light_long' || s === 'camo_dark_long';
}

/**
 * Zwraca rodzaj kamuflażu: 'light', 'dark' lub null
 */
export function getCamoType(style = 'short_sleeve') {
  const s = String(style).toLowerCase();
  if (s.startsWith('camo_light') || s === 'camo_light') return 'light';
  if (s.startsWith('camo_dark') || s === 'camo_dark') return 'dark';
  return null;
}

/**
 * Czy dany styl pozwala na zmianę koloru z palety
 */
export function doesTorsoSupportColor(style = 'short_sleeve') {
  return !getCamoType(style);
}

/**
 * Zwraca paletę kolorów dla jednolitej koszulki
 */
export function getTorsoPalette(baseHex = '#18181b') {
  const hex = String(baseHex || '#18181b').trim();
  // Standardowe odcienie
  if (hex === '#18181b') {
    return { base: '#18181b', light: '#27272a', dark: '#09090b', highlight: 'rgba(255,255,255,0.08)' };
  }
  if (hex === '#3f4830') {
    return { base: '#3f4830', light: '#4d593b', dark: '#28301e', highlight: 'rgba(255,255,255,0.12)' };
  }
  if (hex === '#715c44') {
    return { base: '#715c44', light: '#866f54', dark: '#4f402f', highlight: 'rgba(255,255,255,0.12)' };
  }
  if (hex === '#334155') {
    return { base: '#334155', light: '#475569', dark: '#1e293b', highlight: 'rgba(255,255,255,0.12)' };
  }
  if (hex === '#991b1b') {
    return { base: '#991b1b', light: '#b91c1c', dark: '#7f1d1d', highlight: 'rgba(255,255,255,0.14)' };
  }
  return { base: hex, light: '#3f3f46', dark: '#18181b', highlight: 'rgba(255,255,255,0.10)' };
}

/**
 * Renderuje organiczne plamy kamuflażu moro wewnątrz aktywnego obrysu clipping mask.
 * Znormalizowane współrzędne gwarantują, że plamy nigdy nie wykraczają poza zadany prostokąt.
 */
export function drawCamoSplotches(ctx, camoType = 'light', minX = -12, minY = -25, maxX = 12, maxY = 5) {
  if (!camoType) return;
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  ctx.save();

  if (camoType === 'light') {
    // 1. MORO JASNE (Pustynny / Arid Desert Camo)
    // Tło piaskowo-khaki
    ctx.fillStyle = '#cfbe9f';
    ctx.fillRect(minX, minY, w, h);

    // Plamy szałwiowej oliwki (Sage Olive)
    ctx.fillStyle = '#7a8c6a';
    const oliveBlobs = [
      { u: 0.20, v: 0.16, rx: w * 0.20, ry: h * 0.15, a: 0.3 },
      { u: 0.75, v: 0.25, rx: w * 0.18, ry: h * 0.16, a: -0.4 },
      { u: 0.38, v: 0.50, rx: w * 0.22, ry: h * 0.16, a: 0.2 },
      { u: 0.82, v: 0.65, rx: w * 0.19, ry: h * 0.15, a: -0.2 },
      { u: 0.28, v: 0.82, rx: w * 0.20, ry: h * 0.16, a: 0.4 },
      { u: 0.72, v: 0.88, rx: w * 0.21, ry: h * 0.15, a: -0.3 }
    ];
    oliveBlobs.forEach(b => {
      ctx.beginPath();
      ctx.ellipse(minX + w * b.u, minY + h * b.v, Math.max(1.2, b.rx), Math.max(1.0, b.ry), b.a, 0, Math.PI * 2);
      ctx.fill();
    });

    // Plamy ziemistego brązu (Earth Coyote)
    ctx.fillStyle = '#94724b';
    const brownBlobs = [
      { u: 0.55, v: 0.12, rx: w * 0.16, ry: h * 0.14, a: -0.2 },
      { u: 0.15, v: 0.38, rx: w * 0.18, ry: h * 0.15, a: 0.5 },
      { u: 0.70, v: 0.48, rx: w * 0.19, ry: h * 0.15, a: -0.3 },
      { u: 0.45, v: 0.72, rx: w * 0.20, ry: h * 0.15, a: 0.1 },
      { u: 0.86, v: 0.85, rx: w * 0.17, ry: h * 0.14, a: -0.4 },
      { u: 0.48, v: 0.94, rx: w * 0.17, ry: h * 0.13, a: 0.2 }
    ];
    brownBlobs.forEach(b => {
      ctx.beginPath();
      ctx.ellipse(minX + w * b.u, minY + h * b.v, Math.max(1.0, b.rx), Math.max(0.9, b.ry), b.a, 0, Math.PI * 2);
      ctx.fill();
    });

  } else if (camoType === 'dark') {
    // 2. MORO CIEMNE (Nocny Woodland / Tactical Urban Camo)
    // Tło ciemnooliwkowo-grafitowe
    ctx.fillStyle = '#1e261e';
    ctx.fillRect(minX, minY, w, h);

    // Plamy zgaszonej leśnej zieleni (Forest Moss)
    ctx.fillStyle = '#344534';
    const greenBlobs = [
      { u: 0.22, v: 0.14, rx: w * 0.21, ry: h * 0.16, a: 0.2 },
      { u: 0.78, v: 0.26, rx: w * 0.19, ry: h * 0.17, a: -0.3 },
      { u: 0.36, v: 0.52, rx: w * 0.22, ry: h * 0.16, a: 0.3 },
      { u: 0.85, v: 0.68, rx: w * 0.20, ry: h * 0.15, a: -0.2 },
      { u: 0.28, v: 0.84, rx: w * 0.21, ry: h * 0.16, a: 0.4 },
      { u: 0.76, v: 0.92, rx: w * 0.21, ry: h * 0.15, a: -0.3 }
    ];
    greenBlobs.forEach(b => {
      ctx.beginPath();
      ctx.ellipse(minX + w * b.u, minY + h * b.v, Math.max(1.2, b.rx), Math.max(1.0, b.ry), b.a, 0, Math.PI * 2);
      ctx.fill();
    });

    // Plamy ciemnobrązowo-ziemiste (Deep Mud Brown)
    ctx.fillStyle = '#2f241a';
    const darkBrownBlobs = [
      { u: 0.60, v: 0.12, rx: w * 0.18, ry: h * 0.14, a: -0.3 },
      { u: 0.18, v: 0.35, rx: w * 0.19, ry: h * 0.15, a: 0.4 },
      { u: 0.72, v: 0.48, rx: w * 0.20, ry: h * 0.14, a: -0.2 },
      { u: 0.44, v: 0.74, rx: w * 0.21, ry: h * 0.15, a: 0.2 },
      { u: 0.88, v: 0.86, rx: w * 0.18, ry: h * 0.13, a: -0.4 },
      { u: 0.50, v: 0.95, rx: w * 0.18, ry: h * 0.13, a: 0.3 }
    ];
    darkBrownBlobs.forEach(b => {
      ctx.beginPath();
      ctx.ellipse(minX + w * b.u, minY + h * b.v, Math.max(1.0, b.rx), Math.max(0.9, b.ry), b.a, 0, Math.PI * 2);
      ctx.fill();
    });

    // Czysta czerń taktyczna (Shadow Black)
    ctx.fillStyle = '#090c09';
    const blackBlobs = [
      { u: 0.40, v: 0.22, rx: w * 0.15, ry: h * 0.12, a: 0.2 },
      { u: 0.82, v: 0.38, rx: w * 0.14, ry: h * 0.12, a: -0.4 },
      { u: 0.24, v: 0.62, rx: w * 0.16, ry: h * 0.13, a: 0.3 },
      { u: 0.66, v: 0.78, rx: w * 0.16, ry: h * 0.12, a: -0.1 },
      { u: 0.88, v: 0.95, rx: w * 0.15, ry: h * 0.11, a: -0.3 },
      { u: 0.18, v: 0.94, rx: w * 0.13, ry: h * 0.11, a: 0.4 }
    ];
    blackBlobs.forEach(b => {
      ctx.beginPath();
      ctx.ellipse(minX + w * b.u, minY + h * b.v, Math.max(1.0, b.rx), Math.max(0.9, b.ry), b.a, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.restore();
}

/**
 * Renderuje korpus koszulki bojowej / bluzy na klatce piersiowej i plecach
 */
export function drawTorsoShirt(
  ctx,
  p,
  v,
  absCos,
  absSin,
  cosYaw,
  isLookingAway,
  shoulderHalfW,
  waistHalfW,
  waistY,
  fDir,
  neckBackX,
  neckFrontX
) {
  const torsoStyle = v.torsoStyle || 'short_sleeve';
  const isTank = isSleeveless(torsoStyle);
  const torsoColor = v.torsoColor || v.jerseyFront1 || '#18181b';
  const camoType = getCamoType(torsoStyle);
  const pal = getTorsoPalette(torsoColor);

  const backCollarX = neckBackX * 1.12;
  const frontCollarX = neckFrontX * 1.22;
  const backCollarY = -24.2;
  const frontCollarY = -22.8;

  const frontShX = fDir * (shoulderHalfW * (isTank ? 0.64 : 0.78));
  const backShX = -fDir * (shoulderHalfW * (isTank ? 0.68 : 0.82));
  const frontWaistX = fDir * waistHalfW;
  const backWaistX = -fDir * waistHalfW;
  const chestOut = fDir * (shoulderHalfW + (isTank ? 0.65 : 0.95) * absCos);
  const backOut = -fDir * (shoulderHalfW + (isTank ? 0.45 : 0.65) * absCos);
  const ribInFront = fDir * (waistHalfW - 0.25 * absCos);
  const lumbarInBack = -fDir * (waistHalfW - 0.45 * absCos);
  const blouseFrontX = fDir * (waistHalfW + 0.55);
  const blouseBackX = -fDir * (waistHalfW + 0.45);

  // 1. ŚCIEŻKA KONTURU KOSZULKI
  const buildShirtPath = () => {
    ctx.beginPath();
    ctx.moveTo(backWaistX, waistY);
    ctx.quadraticCurveTo(blouseBackX, waistY - 1.5, lumbarInBack, -8.5);
    ctx.bezierCurveTo(
      backOut * 0.94, -13.5,
      backOut, -19.0,
      backShX, -22.8
    );
    ctx.quadraticCurveTo(backCollarX * 1.05, -24.0, backCollarX, backCollarY);
    ctx.quadraticCurveTo(
      (backCollarX + frontCollarX) * 0.5, -23.1,
      frontCollarX, frontCollarY
    );
    ctx.quadraticCurveTo(frontShX * 0.92, -22.2, frontShX, -21.0);
    ctx.bezierCurveTo(
      chestOut, -17.5,
      chestOut * 0.94, -12.5,
      ribInFront, -8.0
    );
    ctx.quadraticCurveTo(blouseFrontX, waistY - 1.4, frontWaistX, waistY);
    ctx.bezierCurveTo(
      frontWaistX * 0.35, waistY + 0.9,
      backWaistX * 0.35, waistY + 0.8,
      backWaistX, waistY
    );
    ctx.closePath();
  };

  ctx.save();
  buildShirtPath();

  // Wypełnienie tła koszulki
  if (camoType) {
    ctx.save();
    ctx.clip();
    drawCamoSplotches(ctx, camoType, -shoulderHalfW * 1.25, -25, shoulderHalfW * 1.25, waistY + 1);
    ctx.restore();
    // Przywracamy ścieżkę koszulki, aby stroke obrysował kontur koszulki, a nie plamy camo
    buildShirtPath();
  } else {
    const shirtGrad = ctx.createLinearGradient(-shoulderHalfW, 0, shoulderHalfW, 0);
    shirtGrad.addColorStop(0.0, pal.dark);
    shirtGrad.addColorStop(0.35, pal.base);
    shirtGrad.addColorStop(0.75, pal.light);
    shirtGrad.addColorStop(1.0, pal.dark);
    ctx.fillStyle = shirtGrad;
    ctx.fill();
  }

  // Obrys główny koszulki
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // 2. TAKTYCZNY ŚCIĄGACZ KOŁNIERZA (Ribbed Collar Band)
  const collarCol = camoType === 'light' ? '#4a3f35' : (camoType === 'dark' ? '#0f140f' : pal.dark);
  ctx.fillStyle = collarCol;
  ctx.beginPath();
  ctx.moveTo(backCollarX, backCollarY);
  ctx.quadraticCurveTo(
    (backCollarX + frontCollarX) * 0.5, -23.1,
    frontCollarX, frontCollarY
  );
  ctx.lineTo(frontCollarX + fDir * 0.4, frontCollarY + 1.3);
  ctx.quadraticCurveTo(
    (backCollarX + frontCollarX) * 0.5, -21.7,
    backCollarX - fDir * 0.3, backCollarY + 1.3
  );
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // 3. FAŁDY I ZAGIĘCIA TKANINY (Cloth Tension Creases)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  // Ukośna fałda napięcia od pachy ku klatce piersiowej
  ctx.moveTo(-fDir * shoulderHalfW * 0.10, -17.8);
  ctx.quadraticCurveTo(fDir * shoulderHalfW * 0.42, -15.2, fDir * shoulderHalfW * 0.78, -12.8);
  // Fałda materiału na żebrach / brzuchu
  ctx.moveTo(-fDir * waistHalfW * 0.30, -12.2);
  ctx.quadraticCurveTo(fDir * waistHalfW * 0.25, -10.2, fDir * waistHalfW * 0.68, -8.4);
  // Marszczenie nad pasem taktycznym
  ctx.moveTo(-waistHalfW * 0.45, -7.2);
  ctx.quadraticCurveTo(-waistHalfW * 0.30, -5.5, -waistHalfW * 0.40, waistY - 0.4);
  ctx.moveTo(waistHalfW * 0.12, -7.6);
  ctx.quadraticCurveTo(waistHalfW * 0.26, -5.6, waistHalfW * 0.18, waistY - 0.3);
  ctx.moveTo(waistHalfW * 0.52, -6.8);
  ctx.quadraticCurveTo(waistHalfW * 0.64, -5.2, waistHalfW * 0.48, waistY - 0.4);
  ctx.stroke();

  // Subtelne rozjaśnienia na grzbietach fałd koszulki
  ctx.strokeStyle = pal.highlight;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(fDir * shoulderHalfW * 0.12, -19.5);
  ctx.quadraticCurveTo(chestOut * 0.80, -15.8, fDir * shoulderHalfW * 0.52, -13.2);
  ctx.moveTo(-fDir * waistHalfW * 0.22, -11.2);
  ctx.quadraticCurveTo(fDir * waistHalfW * 0.28, -9.2, fDir * waistHalfW * 0.64, -7.6);
  ctx.stroke();

  // Ściągacz wycięcia pachy bezrękawnika (Tank-top Armhole Binding)
  if (isTank) {
    const armholeCol = camoType === 'light' ? '#4a3f35' : (camoType === 'dark' ? '#0f140f' : pal.dark);
    ctx.strokeStyle = armholeCol;
    ctx.lineWidth = 0.95;
    ctx.beginPath();
    ctx.moveTo(frontShX, -21.0);
    ctx.bezierCurveTo(chestOut * 0.90, -17.0, chestOut * 0.86, -12.5, ribInFront, -8.0);
    ctx.stroke();
  }

  // 4. ANATOMICZNE RZEŹBIENIE KLATKI I BRZUCHA DLA POSTACI O ROZWINIĘTEJ MUSKULATURZE
  if (v.sculptedMuscles) {
    const isHeavy = (v.muscleMult && v.muscleMult >= 1.35);
    const shadowAlpha = isHeavy ? 0.34 : 0.22;
    const highlightAlpha = isHeavy ? 0.18 : 0.12;

    // Cienie pod dolnym łukiem klatki piersiowej (Pectoralis Major) i mostkiem
    ctx.strokeStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    // Dolny kontur mięśnia piersiowego
    ctx.moveTo(fDir * (shoulderHalfW * 0.10), -14.6);
    ctx.quadraticCurveTo(fDir * (shoulderHalfW * 0.46), -13.6, fDir * (shoulderHalfW * 0.82), -15.0);
    // Pionowa linia mostka
    ctx.moveTo(fDir * (shoulderHalfW * 0.10), -18.8);
    ctx.quadraticCurveTo(fDir * (shoulderHalfW * 0.06), -16.5, fDir * (shoulderHalfW * 0.10), -14.6);
    // Zarys mięśni brzucha / zębatych pod koszulką
    ctx.moveTo(fDir * (waistHalfW * 0.12), -11.4);
    ctx.quadraticCurveTo(fDir * (waistHalfW * 0.36), -10.8, fDir * (waistHalfW * 0.65), -11.5);
    ctx.moveTo(fDir * (waistHalfW * 0.10), -8.6);
    ctx.quadraticCurveTo(fDir * (waistHalfW * 0.34), -8.0, fDir * (waistHalfW * 0.60), -8.7);
    ctx.stroke();

    // Rozjaśnienia uwypuklające mięśnie klatki piersiowej
    ctx.strokeStyle = pal.highlight || `rgba(255, 255, 255, ${highlightAlpha})`;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(fDir * (shoulderHalfW * 0.14), -18.2);
    ctx.quadraticCurveTo(fDir * (shoulderHalfW * 0.50), -17.2, chestOut * 0.80, -16.0);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renderuje nakładkę kamuflażu moro na rękawie ramienia lub przedramienia
 */
export function drawArmSleeveCamo(ctx, camoType, len, halfH, isForearm = false) {
  if (!camoType) return;
  ctx.save();
  ctx.clip();
  const startX = isForearm ? 0 : -1;
  const endX = len;
  const minH = -halfH * 1.05;
  const maxH = halfH * 1.05;
  drawCamoSplotches(ctx, camoType, startX, minH, endX, maxH);
  ctx.restore();
}

/**
 * Renderuje podgląd fasonu ubrania torsu na kafelku w Kreatorze Postaci
 */
export function drawTorsoPreview(
  ctx,
  canvasW,
  canvasH,
  torsoStyle = 'short_sleeve',
  torsoColor = '#18181b',
  visuals = {}
) {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvasW, canvasH);

  const isTank = isSleeveless(torsoStyle);
  const isLong = !isTank && isLongSleeve(torsoStyle);
  const camo = getCamoType(torsoStyle);
  const pal = getTorsoPalette(torsoColor);

  const v = {
    ...DEFAULT_VISUALS,
    ...(visuals || {}),
    torsoStyle,
    torsoColor
  };

  ctx.save();
  // Centrowanie sylwetki torsu i ramienia w kadrze kafelka (profil boczny jak w grze)
  ctx.translate(canvasW * 0.46, canvasH * 0.50);
  const scale = Math.min(canvasW, canvasH) / 44.0;
  ctx.scale(scale, scale);

  // 1. Szyja z kołnierzem
  const neckGrad = ctx.createLinearGradient(-3.0, 0, 2.5, 0);
  neckGrad.addColorStop(0.0, v.skinDark);
  neckGrad.addColorStop(0.5, v.skinBack);
  neckGrad.addColorStop(1.0, v.skinMid);

  ctx.beginPath();
  ctx.moveTo(-3.0, -17.0);
  ctx.lineTo(-3.2, -11.5);
  ctx.quadraticCurveTo(-0.5, -10.5, 2.5, -11.5);
  ctx.lineTo(2.2, -17.0);
  ctx.closePath();
  ctx.fillStyle = neckGrad;
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.85;
  ctx.stroke();

  // 2. Tors (korpus koszulki w profilu bocznym)
  const traceTorso = () => {
    ctx.beginPath();
    ctx.moveTo(-5.5, 6.0);
    ctx.lineTo(-6.0, -11.5);
    ctx.quadraticCurveTo(-2.0, -13.0, 2.5, -11.5);
    ctx.quadraticCurveTo(isTank ? 4.0 : 5.5, -7.0, isTank ? 3.8 : 5.0, 0.0);
    ctx.lineTo(4.2, 6.0);
    ctx.closePath();
  };

  traceTorso();

  if (camo) {
    ctx.save();
    ctx.clip();
    drawCamoSplotches(ctx, camo, -7.0, -14.0, 7.0, 7.0);
    ctx.restore();
    traceTorso();
  } else {
    const shirtGrad = ctx.createLinearGradient(-5, 0, 5, 0);
    shirtGrad.addColorStop(0.0, pal.dark);
    shirtGrad.addColorStop(0.4, pal.base);
    shirtGrad.addColorStop(0.8, pal.light);
    shirtGrad.addColorStop(1.0, pal.dark);
    ctx.fillStyle = shirtGrad;
    ctx.fill();
  }
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.95;
  ctx.stroke();

  // Ściągacz kołnierza
  const collarCol = camo === 'light' ? '#4a3f35' : (camo === 'dark' ? '#0f140f' : pal.dark);
  ctx.fillStyle = collarCol;
  ctx.beginPath();
  ctx.moveTo(-3.2, -11.5);
  ctx.quadraticCurveTo(-0.5, -10.0, 2.5, -11.5);
  ctx.lineTo(2.2, -10.2);
  ctx.quadraticCurveTo(-0.5, -8.8, -3.0, -10.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.75;
  ctx.stroke();

  // 3. Pas taktyczny na dole
  ctx.fillStyle = '#27272a';
  ctx.fillRect(-5.8, 5.5, 10.5, 3.2);
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-5.8, 5.5, 10.5, 3.2);

  // Klamra pasa
  ctx.fillStyle = '#71717a';
  ctx.fillRect(1.2, 6.0, 2.4, 2.2);

  // 4. Ramię z rękawem w pozycji gotowości bojowej (dokładnie jak na ubranej postaci)
  const shX = 0.5;
  const shY = -9.0;
  const upperLen = 13.5;
  const foreLen = 12.5;
  const armDir = 0.42; // naturalne pochylenie ramienia
  const foreDir = 0.75; // naturalne ugięcie łokcia

  const elbowX = shX + Math.cos(armDir) * upperLen;
  const elbowY = shY + Math.sin(armDir) * upperLen;

  // RAMIĘ
  ctx.save();
  ctx.translate(shX, shY);
  ctx.rotate(armDir);

  const armHalfH = 3.2;
  const sleeveLen = isLong ? upperLen + 0.5 : upperLen * 0.58;
  const sleeveHalfH = 3.8;

  if (isTank) {
    // Bezrękawnik: całe ramię (deltoid i biceps) odsłonięte
    const bicepGrad = ctx.createLinearGradient(0, -armHalfH * 1.2, 0, armHalfH * 1.2);
    bicepGrad.addColorStop(0.0, v.skinLight);
    bicepGrad.addColorStop(0.4, v.skinMid);
    bicepGrad.addColorStop(1.0, v.skinDark);

    ctx.beginPath();
    ctx.arc(0, 0, armHalfH * 1.15, Math.PI * 0.5, -Math.PI * 0.5, false);
    ctx.quadraticCurveTo(upperLen * 0.5, -armHalfH * 1.35, upperLen, -armHalfH * 0.95);
    ctx.lineTo(upperLen, armHalfH * 0.95);
    ctx.quadraticCurveTo(upperLen * 0.5, armHalfH * 1.35, 0, armHalfH * 1.15);
    ctx.closePath();
    ctx.fillStyle = bicepGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // Wyrazisty zarys mięśnia ramienia
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(upperLen * 0.35, -armHalfH * 0.3);
    ctx.quadraticCurveTo(upperLen * 0.55, 0, upperLen * 0.75, armHalfH * 0.3);
    ctx.stroke();
  } else {
    // Główny rękaw (krótki lub długi)
    const traceSleeve = () => {
      ctx.beginPath();
      ctx.arc(0, 0, sleeveHalfH * 0.95, Math.PI * 0.5, -Math.PI * 0.5, false);
      ctx.bezierCurveTo(sleeveLen * 0.3, -sleeveHalfH * 1.05, sleeveLen * 0.7, -sleeveHalfH * 1.02, sleeveLen, -sleeveHalfH * 0.94);
      ctx.lineTo(sleeveLen, sleeveHalfH * 0.94);
      ctx.bezierCurveTo(sleeveLen * 0.7, sleeveHalfH * 1.02, sleeveLen * 0.3, sleeveHalfH * 0.96, 0, sleeveHalfH * 0.92);
      ctx.closePath();
    };

    traceSleeve();

    if (camo) {
      ctx.save();
      ctx.clip();
      drawCamoSplotches(ctx, camo, -2, -sleeveHalfH * 1.1, sleeveLen + 1, sleeveHalfH * 1.1);
      ctx.restore();
      traceSleeve();
    } else {
      ctx.fillStyle = pal.base;
      ctx.fill();
    }
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // Mankiet rękawa
    if (!isLong) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.42)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(sleeveLen - 1.2, -sleeveHalfH * 0.92);
      ctx.lineTo(sleeveLen - 1.2, sleeveHalfH * 0.92);
      ctx.stroke();

      // Odsłonięte ramię / biceps pod rękawem
      ctx.beginPath();
      ctx.moveTo(sleeveLen, -armHalfH * 0.9);
      ctx.lineTo(upperLen, -armHalfH * 0.85);
      ctx.lineTo(upperLen, armHalfH * 0.85);
      ctx.lineTo(sleeveLen, armHalfH * 0.9);
      ctx.closePath();
      ctx.fillStyle = v.skinMid;
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.85;
      ctx.stroke();
    }
  }

  ctx.restore();

  // PRZEDRAMIĘ
  ctx.save();
  ctx.translate(elbowX, elbowY);
  ctx.rotate(foreDir);

  const elbowR = 2.8;
  const wristR = 1.9;

  if (isLong) {
    // Staw łokciowy
    ctx.beginPath();
    ctx.arc(0, 0, elbowR * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = pal.dark;
    ctx.fill();

    // Długi rękaw przedramienia
    const traceForeSleeve = () => {
      ctx.beginPath();
      ctx.moveTo(0, -elbowR);
      ctx.lineTo(foreLen * 0.8, -wristR * 1.05);
      ctx.lineTo(foreLen * 0.8, wristR * 1.05);
      ctx.lineTo(0, elbowR);
      ctx.closePath();
    };

    traceForeSleeve();

    if (camo) {
      ctx.save();
      ctx.clip();
      drawCamoSplotches(ctx, camo, 0, -elbowR * 1.1, foreLen * 0.85, elbowR * 1.1);
      ctx.restore();
      traceForeSleeve();
    } else {
      ctx.fillStyle = pal.base;
      ctx.fill();
    }
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.85;
    ctx.stroke();

    // Wzmocniona łata na łokciu (Tactical Elbow Reinforcement)
    ctx.fillStyle = camo === 'light' ? '#4a3f35' : (camo === 'dark' ? '#0f140f' : pal.dark);
    ctx.beginPath();
    ctx.ellipse(foreLen * 0.16, 0, elbowR * 0.75, elbowR * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.65;
    ctx.stroke();
  } else {
    // Odsłonięty łokieć (dokładnie jak na postaci!)
    ctx.beginPath();
    ctx.arc(0, 0, elbowR * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = v.skinMid;
    ctx.fill();

    // Odsłonięte przedramię
    ctx.beginPath();
    ctx.moveTo(0, -elbowR * 0.85);
    ctx.quadraticCurveTo(foreLen * 0.3, -elbowR * 1.3, foreLen * 0.78, -wristR);
    ctx.lineTo(foreLen * 0.78, wristR);
    ctx.quadraticCurveTo(foreLen * 0.35, elbowR * 1.15, 0, elbowR * 0.85);
    ctx.closePath();
    ctx.fillStyle = v.skinMid;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.85;
    ctx.stroke();

    // Subtelna linia definicji mięśnia
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(foreLen * 0.22, -elbowR * 0.3);
    ctx.lineTo(foreLen * 0.60, -wristR * 0.2);
    ctx.stroke();
  }

  // Rękawica taktyczna na dłoni
  ctx.fillStyle = '#18181b';
  ctx.fillRect(foreLen * 0.76, -wristR * 0.95, 3.8, wristR * 1.9);
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.75;
  ctx.strokeRect(foreLen * 0.76, -wristR * 0.95, 3.8, wristR * 1.9);

  ctx.restore();
  ctx.restore();
}
