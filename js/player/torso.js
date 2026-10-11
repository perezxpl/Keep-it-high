// =========================================================================
// PLAYER/TORSO.JS - UBRANIE TORSU: KRÓTKI / DŁUGI RĘKAW ORAZ MORO JASNE I CIEMNE
// =========================================================================

import { DEFAULT_VISUALS } from './hair.js';

export const TORSO_STYLE_LIST = [
  'short_sleeve',      // Krótki rękaw (jednolity z paletą barw)
  'long_sleeve',       // Długi rękaw (bluza bojowa / jednolita)
  'camo_light_short',  // Moro jasne (krótki rękaw / pustynne arid)
  'camo_light_long',   // Moro jasne (długi rękaw / pustynne arid)
  'camo_dark_short',   // Moro ciemne (krótki rękaw / nocny woodland)
  'camo_dark_long'     // Długi rękaw (moro ciemne / nocny woodland)
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
 * Renderuje organiczne plamy kamuflażu moro wewnątrz aktywnego obrysu clipping mask
 */
export function drawCamoSplotches(ctx, camoType = 'light', minX = -12, minY = -25, maxX = 12, maxY = 5) {
  if (!camoType) return;
  ctx.save();

  if (camoType === 'light') {
    // 1. MORO JASNE (Pustynny / Arid Desert Camo)
    // Tło piaskowo-khaki
    ctx.fillStyle = '#cfbe9f';
    ctx.fillRect(minX, minY, maxX - minX, maxY - minY);

    // Plamy szałwiowej oliwki (Sage Olive)
    ctx.fillStyle = '#7a8c6a';
    const oliveBlobs = [
      { x: minX + 2.5, y: minY + 3.0, rx: 3.8, ry: 2.2, a: 0.3 },
      { x: minX + 8.5, y: minY + 6.0, rx: 3.2, ry: 2.6, a: -0.4 },
      { x: minX + 4.0, y: minY + 12.0, rx: 4.2, ry: 2.8, a: 0.2 },
      { x: minX + 11.0, y: minY + 16.0, rx: 3.6, ry: 2.2, a: -0.2 },
      { x: minX + 3.0, y: minY + 21.0, rx: 3.9, ry: 2.4, a: 0.4 },
      { x: minX + 9.5, y: minY + 24.0, rx: 4.5, ry: 2.5, a: -0.3 }
    ];
    oliveBlobs.forEach(b => {
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.rx, b.ry, b.a, 0, Math.PI * 2);
      ctx.fill();
    });

    // Plamy ziemistego brązu (Earth Coyote)
    ctx.fillStyle = '#94724b';
    const brownBlobs = [
      { x: minX + 7.0, y: minY + 2.0, rx: 2.8, ry: 2.0, a: -0.2 },
      { x: minX + 2.0, y: minY + 8.5, rx: 3.4, ry: 2.2, a: 0.5 },
      { x: minX + 9.0, y: minY + 11.5, rx: 3.5, ry: 2.4, a: -0.3 },
      { x: minX + 5.0, y: minY + 17.0, rx: 3.8, ry: 2.2, a: 0.1 },
      { x: minX + 12.0, y: minY + 21.5, rx: 3.2, ry: 2.0, a: -0.4 },
      { x: minX + 5.5, y: minY + 25.5, rx: 3.0, ry: 2.0, a: 0.2 }
    ];
    brownBlobs.forEach(b => {
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.rx, b.ry, b.a, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ciemne mikroplamki grafitowo-ziemiste (Dark Speckles)
    ctx.fillStyle = '#42372d';
    const darkSpecks = [
      { x: minX + 4.5, y: minY + 5.5, r: 1.1 },
      { x: minX + 9.5, y: minY + 9.0, r: 0.9 },
      { x: minX + 3.2, y: minY + 15.0, r: 1.2 },
      { x: minX + 7.8, y: minY + 19.5, r: 1.0 },
      { x: minX + 11.2, y: minY + 25.0, r: 1.1 },
      { x: minX + 2.0, y: minY + 24.0, r: 0.95 }
    ];
    darkSpecks.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

  } else if (camoType === 'dark') {
    // 2. MORO CIEMNE (Nocny Woodland / Tactical Urban Camo)
    // Tło ciemnooliwkowo-grafitowe
    ctx.fillStyle = '#1e261e';
    ctx.fillRect(minX, minY, maxX - minX, maxY - minY);

    // Plamy zgaszonej leśnej zieleni (Forest Moss)
    ctx.fillStyle = '#344534';
    const greenBlobs = [
      { x: minX + 3.0, y: minY + 3.0, rx: 4.2, ry: 2.5, a: 0.2 },
      { x: minX + 9.5, y: minY + 7.0, rx: 3.6, ry: 2.8, a: -0.3 },
      { x: minX + 4.5, y: minY + 12.5, rx: 4.5, ry: 2.6, a: 0.3 },
      { x: minX + 11.5, y: minY + 17.0, rx: 3.8, ry: 2.4, a: -0.2 },
      { x: minX + 3.5, y: minY + 21.5, rx: 4.0, ry: 2.6, a: 0.4 },
      { x: minX + 10.0, y: minY + 25.0, rx: 4.2, ry: 2.4, a: -0.3 }
    ];
    greenBlobs.forEach(b => {
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.rx, b.ry, b.a, 0, Math.PI * 2);
      ctx.fill();
    });

    // Plamy ciemnobrązowo-ziemiste (Deep Mud Brown)
    ctx.fillStyle = '#2f241a';
    const darkBrownBlobs = [
      { x: minX + 7.5, y: minY + 2.5, rx: 3.2, ry: 2.2, a: -0.3 },
      { x: minX + 2.5, y: minY + 8.0, rx: 3.5, ry: 2.4, a: 0.4 },
      { x: minX + 9.0, y: minY + 12.0, rx: 3.6, ry: 2.2, a: -0.2 },
      { x: minX + 5.5, y: minY + 17.5, rx: 4.0, ry: 2.4, a: 0.2 },
      { x: minX + 12.0, y: minY + 22.0, rx: 3.4, ry: 2.0, a: -0.4 },
      { x: minX + 6.0, y: minY + 26.0, rx: 3.2, ry: 2.0, a: 0.3 }
    ];
    darkBrownBlobs.forEach(b => {
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.rx, b.ry, b.a, 0, Math.PI * 2);
      ctx.fill();
    });

    // Czysta czerń taktyczna (Shadow Black)
    ctx.fillStyle = '#090c09';
    const blackBlobs = [
      { x: minX + 4.8, y: minY + 5.0, rx: 2.2, ry: 1.4, a: 0.2 },
      { x: minX + 10.2, y: minY + 9.5, rx: 2.0, ry: 1.6, a: -0.4 },
      { x: minX + 3.0, y: minY + 15.5, rx: 2.4, ry: 1.5, a: 0.3 },
      { x: minX + 8.2, y: minY + 19.8, rx: 2.5, ry: 1.4, a: -0.1 },
      { x: minX + 11.5, y: minY + 25.5, rx: 2.2, ry: 1.3, a: -0.3 },
      { x: minX + 2.2, y: minY + 24.5, rx: 1.9, ry: 1.3, a: 0.4 }
    ];
    blackBlobs.forEach(b => {
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.rx, b.ry, b.a, 0, Math.PI * 2);
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
  const torsoColor = v.torsoColor || v.jerseyFront1 || '#18181b';
  const camoType = getCamoType(torsoStyle);
  const pal = getTorsoPalette(torsoColor);

  const backCollarX = neckBackX * 1.12;
  const frontCollarX = neckFrontX * 1.22;
  const backCollarY = -24.2;
  const frontCollarY = -22.8;

  const frontShX = fDir * (shoulderHalfW * 0.78);
  const backShX = -fDir * (shoulderHalfW * 0.82);
  const frontWaistX = fDir * waistHalfW;
  const backWaistX = -fDir * waistHalfW;
  const chestOut = fDir * (shoulderHalfW + 0.95 * absCos);
  const backOut = -fDir * (shoulderHalfW + 0.65 * absCos);
  const ribInFront = fDir * (waistHalfW - 0.25 * absCos);
  const lumbarInBack = -fDir * (waistHalfW - 0.45 * absCos);
  const blouseFrontX = fDir * (waistHalfW + 0.55);
  const blouseBackX = -fDir * (waistHalfW + 0.45);

  // 1. ŚCIEŻKA KONTURU KOSZULKI
  ctx.save();
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

  // Wypełnienie tła koszulki
  if (camoType) {
    ctx.save();
    ctx.clip();
    drawCamoSplotches(ctx, camoType, -shoulderHalfW * 1.3, -26, shoulderHalfW * 1.3, waistY + 2);
    ctx.restore();
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

  ctx.restore();
}

/**
 * Renderuje nakładkę kamuflażu moro na rękawie ramienia lub przedramienia
 */
export function drawArmSleeveCamo(ctx, camoType, len, halfH, isForearm = false) {
  if (!camoType) return;
  ctx.save();
  ctx.clip();
  const startX = isForearm ? 0 : -2;
  const endX = len + 2;
  const minH = -halfH * 1.5;
  const maxH = halfH * 1.5;
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

  const isLong = isLongSleeve(torsoStyle);
  const camo = getCamoType(torsoStyle);
  const pal = getTorsoPalette(torsoColor);

  const v = {
    ...DEFAULT_VISUALS,
    ...(visuals || {}),
    torsoStyle,
    torsoColor
  };

  ctx.save();
  // Centrowanie sylwetki torsu i ramienia w kadrze
  ctx.translate(canvasW * 0.48, canvasH * 0.52);
  const scale = Math.min(canvasW, canvasH) / 36.0;
  ctx.scale(scale, scale);

  // 1. Szyja z kołnierzem
  const neckGrad = ctx.createLinearGradient(-3.0, 0, 2.5, 0);
  neckGrad.addColorStop(0.0, v.skinDark);
  neckGrad.addColorStop(0.5, v.skinBack);
  neckGrad.addColorStop(1.0, v.skinMid);

  ctx.fillStyle = neckGrad;
  ctx.beginPath();
  ctx.moveTo(-2.8, -9.0);
  ctx.lineTo(-3.0, -4.5);
  ctx.quadraticCurveTo(-0.5, -3.5, 2.2, -4.5);
  ctx.lineTo(2.0, -9.0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.85;
  ctx.stroke();

  // 2. Tors (korpus koszulki z wycięciem dekoltu)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-5.5, 8.5);
  ctx.lineTo(-6.2, -4.2);
  ctx.quadraticCurveTo(-3.2, -5.5, -3.0, -4.5);
  ctx.quadraticCurveTo(-0.5, -3.5, 2.2, -4.5);
  ctx.lineTo(5.2, -3.8);
  ctx.quadraticCurveTo(6.2, 0.0, 5.5, 4.0);
  ctx.lineTo(5.0, 8.5);
  ctx.closePath();

  if (camo) {
    ctx.save();
    ctx.clip();
    drawCamoSplotches(ctx, camo, -7, -7, 7, 10);
    ctx.restore();
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
  ctx.moveTo(-3.0, -4.5);
  ctx.quadraticCurveTo(-0.5, -3.5, 2.2, -4.5);
  ctx.lineTo(2.0, -3.6);
  ctx.quadraticCurveTo(-0.5, -2.5, -2.8, -3.6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.75;
  ctx.stroke();

  // 3. Pas na dole
  ctx.fillStyle = '#27272a';
  ctx.fillRect(-5.8, 8.0, 11.2, 2.6);
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-5.8, 8.0, 11.2, 2.6);

  // 4. Ramię z rękawem (widoczne na pierwszym planie)
  // Ramię opada w dół lekko ukośnie
  const armShX = 2.0;
  const armShY = -3.5;
  const armLen = 11.5;
  const foreLen = 10.5;

  ctx.save();
  ctx.translate(armShX, armShY);
  ctx.rotate(0.35); // lekki wymach ramienia

  const armHalfW = 2.5;
  const sleeveLen = isLong ? armLen + 0.5 : armLen * 0.52;

  // Główny rękaw na ramieniu
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, armHalfW * 1.15, Math.PI * 0.5, -Math.PI * 0.5, false);
  ctx.lineTo(sleeveLen, -armHalfW * 0.95);
  ctx.lineTo(sleeveLen, armHalfW * 0.95);
  ctx.closePath();

  if (camo) {
    ctx.save();
    ctx.clip();
    drawCamoSplotches(ctx, camo, -2, -armHalfW * 1.5, sleeveLen + 1, armHalfW * 1.5);
    ctx.restore();
  } else {
    ctx.fillStyle = pal.base;
    ctx.fill();
  }
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.85;
  ctx.stroke();

  // Mankiet rękawa
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(sleeveLen - 0.8, -armHalfW * 0.95);
  ctx.lineTo(sleeveLen - 0.8, armHalfW * 0.95);
  ctx.stroke();
  ctx.restore();

  // Przedramię (odsłonięte ciało lub długi rękaw)
  const elbowX = armLen;
  const elbowY = 0;

  ctx.save();
  ctx.translate(elbowX, elbowY);
  ctx.rotate(0.20); // lekkie zgięcie w łokciu

  const foreHalfW = 1.9;

  ctx.beginPath();
  ctx.arc(0, 0, foreHalfW * 1.05, Math.PI * 0.5, -Math.PI * 0.5, false);
  ctx.lineTo(foreLen * 0.78, -foreHalfW * 0.75);
  ctx.lineTo(foreLen * 0.78, foreHalfW * 0.75);
  ctx.closePath();

  if (isLong) {
    // Długi rękaw na przedramieniu
    if (camo) {
      ctx.save();
      ctx.clip();
      drawCamoSplotches(ctx, camo, -1, -foreHalfW * 1.5, foreLen * 0.85, foreHalfW * 1.5);
      ctx.restore();
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
    ctx.ellipse(foreLen * 0.18, 0, 2.0, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.65;
    ctx.stroke();
  } else {
    // Odsłonięta skóra przedramienia
    const foreGrad = ctx.createLinearGradient(0, -foreHalfW, 0, foreHalfW);
    foreGrad.addColorStop(0.0, v.skinLight);
    foreGrad.addColorStop(0.5, v.skinMid);
    foreGrad.addColorStop(1.0, v.skinDark);
    ctx.fillStyle = foreGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.85;
    ctx.stroke();
  }

  // Rękawica taktyczna na dłoni
  ctx.fillStyle = '#18181b';
  ctx.fillRect(foreLen * 0.75, -foreHalfW * 0.85, 3.2, foreHalfW * 1.7);
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.75;
  ctx.strokeRect(foreLen * 0.75, -foreHalfW * 0.85, 3.2, foreHalfW * 1.7);

  ctx.restore();
  ctx.restore();

  // Tekstura etykiety w rogu kafelka
  ctx.restore();
}
