// =========================================================================
// PLAYER/PANTS.JS - UBRANIE DOLNE: DŁUGIE BOJÓWKI I KRÓTKIE SPODENKI MORO / JEDNOLITE
// Zarządza fasonami spodni (bojówki cargo, krótkie spodenki, kamuflaże moro),
// ich paletami barw, renderowaniem podglądu w Kreatorze oraz integracją z fizyką nóg.
// =========================================================================

import { DEFAULT_VISUALS } from './hair.js';
import { drawCamoSplotches } from './torso.js';

export const PANTS_STYLE_LIST = [
  'cargo_long',         // 1. Długie bojówki bojowe PMC (jednolite z paletą barw)
  'shorts',             // 2. Krótkie spodenki bojówkowe (odsłonięte łydki / mięśnie)
  'camo_light_long',    // 3. Moro jasne – długie bojówki (pustynne desert camo)
  'camo_light_shorts',  // 4. Moro jasne – krótkie spodenki (pustynne)
  'camo_dark_long',     // 5. Moro ciemne – długie bojówki (leśny/miejski woodland)
  'camo_dark_shorts'    // 6. Moro ciemne – krótkie spodenki (nocny woodland)
];

export const PANTS_COLOR_LIST = [
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
 * Sprawdza czy dany fason to krótkie spodenki (odsłaniające łydki)
 */
export function isPantsShorts(style = 'cargo_long') {
  const s = String(style).toLowerCase();
  return s === 'shorts' || s === 'camo_light_shorts' || s === 'camo_dark_shorts';
}

/**
 * Zwraca rodzaj kamuflażu spodni: 'light', 'dark' lub null
 */
export function getPantsCamoType(style = 'cargo_long') {
  const s = String(style).toLowerCase();
  if (s.startsWith('camo_light') || s === 'camo_light') return 'light';
  if (s.startsWith('camo_dark') || s === 'camo_dark') return 'dark';
  return null;
}

/**
 * Czy dany fason spodni obsługuje zmianę koloru z palety
 */
export function doesPantsSupportColor(style = 'cargo_long') {
  return !getPantsCamoType(style);
}

/**
 * Zwraca paletę odcieni dla jednolitego koloru spodni
 */
export function getPantsPalette(baseHex = '#18181b') {
  const hex = String(baseHex || '#18181b').trim();
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
 * Renderuje podgląd fasonu spodni na kafelku w Kreatorze Postaci (68x68 px)
 */
export function drawPantsPreview(
  ctx,
  canvasW,
  canvasH,
  pantsStyle = 'cargo_long',
  pantsColor = '#18181b',
  visuals = {}
) {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvasW, canvasH);

  const isShort = isPantsShorts(pantsStyle);
  const camo = getPantsCamoType(pantsStyle);
  const pal = getPantsPalette(pantsColor);

  const v = {
    ...DEFAULT_VISUALS,
    ...(visuals || {}),
    pantsStyle,
    pantsColor
  };

  ctx.save();
  // Centrowanie nogi w profilu bocznym (dokładnie jak na ubranej postaci w grze)
  ctx.translate(canvasW * 0.44, canvasH * 0.48);
  const scale = Math.min(canvasW, canvasH) / 44.0;
  ctx.scale(scale, scale);

  // 1. Pas taktyczny na górze
  ctx.fillStyle = '#27272a';
  ctx.fillRect(-6.0, -18.5, 12.0, 3.0);
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-6.0, -18.5, 12.0, 3.0);

  // Klamra pasa
  ctx.fillStyle = '#71717a';
  ctx.fillRect(1.5, -18.0, 2.2, 2.0);

  // 2. Biodro w profilu bocznym
  const traceHip = () => {
    ctx.beginPath();
    ctx.moveTo(-5.5, -15.5);
    ctx.lineTo(4.8, -15.5);
    ctx.quadraticCurveTo(5.5, -11.0, 4.0, -8.0);
    ctx.lineTo(-4.0, -8.0);
    ctx.quadraticCurveTo(-5.8, -11.0, -5.5, -15.5);
    ctx.closePath();
  };

  traceHip();

  if (camo) {
    ctx.save();
    ctx.clip();
    drawCamoSplotches(ctx, camo, -6.5, -16.0, 6.5, -7.5);
    ctx.restore();
    traceHip();
  } else {
    ctx.fillStyle = pal.base;
    ctx.fill();
  }
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // 3. Udo i noga w naturalnej pozycji (profil boczny jak w grze)
  const hipX = 0;
  const hipY = -8.0;
  const thighLen = 14.5;
  const shinLen = 15.0;
  const thighAng = 1.32;
  const shinAng = 1.48;

  const kneeX = hipX + Math.cos(thighAng) * thighLen;
  const kneeY = hipY + Math.sin(thighAng) * thighLen;

  // UDO
  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.rotate(thighAng);

  const thighHalfH = 3.8;
  const kneeR = 2.6;

  if (isShort) {
    const shortsEnd = thighLen * 0.90; // Wydłużone prawie do kolan
    const shortsCuffHalfW = thighHalfH * 1.15; // Szeroki, luźny mankiet

    // Odsłonięta dolna część uda tuż przed kolanem
    ctx.beginPath();
    ctx.moveTo(shortsEnd - 2.0, -kneeR * 0.9);
    ctx.lineTo(thighLen, -kneeR * 0.85);
    ctx.lineTo(thighLen, kneeR * 0.85);
    ctx.lineTo(shortsEnd - 2.0, kneeR * 0.9);
    ctx.closePath();
    ctx.fillStyle = v.skinMid;
    ctx.fill();

    // Wewnętrzny cień szerokiej nogawki
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(shortsEnd, 0, 1.5, shortsCuffHalfW, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nogawka spodenek
    const traceShorts = () => {
      ctx.beginPath();
      ctx.moveTo(0, thighHalfH);
      ctx.quadraticCurveTo(-thighHalfH * 0.4, 0, 0, -thighHalfH);
      ctx.bezierCurveTo(thighLen * 0.3, -thighHalfH * 1.05, thighLen * 0.65, -shortsCuffHalfW * 1.02, shortsEnd, -shortsCuffHalfW);
      ctx.lineTo(shortsEnd, shortsCuffHalfW);
      ctx.bezierCurveTo(thighLen * 0.65, shortsCuffHalfW * 1.02, thighLen * 0.3, thighHalfH * 1.04, 0, thighHalfH);
      ctx.closePath();
    };

    traceShorts();

    if (camo) {
      ctx.save();
      ctx.clip();
      drawCamoSplotches(ctx, camo, -1, -shortsCuffHalfW * 1.1, shortsEnd + 1, shortsCuffHalfW * 1.1);
      ctx.restore();
      traceShorts();
    } else {
      ctx.fillStyle = pal.base;
      ctx.fill();
    }
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // Mankiet podwinięty z szwem
    const hemX = shortsEnd - 2.2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(hemX, -shortsCuffHalfW + 0.3, 2.2, shortsCuffHalfW * 2 - 0.6);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(hemX, -shortsCuffHalfW + 0.3);
    ctx.lineTo(hemX, shortsCuffHalfW - 0.3);
    ctx.stroke();

    // Kieszeń boczna cargo
    ctx.fillStyle = camo ? 'rgba(0, 0, 0, 0.28)' : pal.dark;
    ctx.fillRect(thighLen * 0.22, -thighHalfH * 0.8, thighLen * 0.45, thighHalfH * 1.6);
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.7;
    ctx.strokeRect(thighLen * 0.22, -thighHalfH * 0.8, thighLen * 0.45, thighHalfH * 1.6);

  } else {
    // Długie bojówki na udzie
    const traceLongThigh = () => {
      ctx.beginPath();
      ctx.moveTo(0, thighHalfH);
      ctx.quadraticCurveTo(-thighHalfH * 0.4, 0, 0, -thighHalfH);
      ctx.bezierCurveTo(thighLen * 0.3, -thighHalfH * 1.05, thighLen * 0.7, -thighHalfH * 0.95, thighLen, -kneeR * 1.05);
      ctx.lineTo(thighLen, kneeR * 1.05);
      ctx.bezierCurveTo(thighLen * 0.7, thighHalfH * 0.95, thighLen * 0.3, thighHalfH * 1.04, 0, thighHalfH);
      ctx.closePath();
    };

    traceLongThigh();

    if (camo) {
      ctx.save();
      ctx.clip();
      drawCamoSplotches(ctx, camo, -1, -thighHalfH * 1.1, thighLen + 1, thighHalfH * 1.1);
      ctx.restore();
      traceLongThigh();
    } else {
      ctx.fillStyle = pal.base;
      ctx.fill();
    }
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // Kieszeń boczna cargo
    ctx.fillStyle = camo ? 'rgba(0, 0, 0, 0.28)' : pal.dark;
    ctx.fillRect(thighLen * 0.24, -thighHalfH * 0.8, thighLen * 0.48, thighHalfH * 1.6);
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.7;
    ctx.strokeRect(thighLen * 0.24, -thighHalfH * 0.8, thighLen * 0.48, thighHalfH * 1.6);
  }

  ctx.restore();

  // ŁYDKA I BUT
  ctx.save();
  ctx.translate(kneeX, kneeY);
  ctx.rotate(shinAng);

  const calfBulge = 4.2;
  const achillesHalfW = 2.4;

  // Cholewa buta
  ctx.fillStyle = '#18181b';
  ctx.fillRect(shinLen - 5.5, -2.5, 5.5, 5.0);
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.85;
  ctx.strokeRect(shinLen - 5.5, -2.5, 5.5, 5.0);

  if (isShort) {
    // Główka stawu kolanowego (naturalna, bez komicznych wypukłości)
    ctx.beginPath();
    ctx.arc(0, 0, kneeR * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = v.skinMid;
    ctx.fill();

    // Odsłonięta kość piszczelowa i brzusiec łydki
    ctx.beginPath();
    ctx.moveTo(0, -kneeR * 0.85);
    ctx.quadraticCurveTo(shinLen * 0.35, -kneeR * 0.90, shinLen - 3.0, -achillesHalfW);
    ctx.lineTo(shinLen - 3.0, achillesHalfW);
    ctx.quadraticCurveTo(shinLen * 0.65, achillesHalfW * 1.15, shinLen * 0.35, calfBulge * 1.05);
    ctx.quadraticCurveTo(shinLen * 0.12, calfBulge * 0.85, 0, kneeR * 0.85);
    ctx.closePath();
    ctx.fillStyle = v.skinMid;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // Naturalny zarys rzepki kolanowej
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.arc(0.2, -0.2, kneeR * 0.70, -0.45 * Math.PI, 0.45 * Math.PI);
    ctx.stroke();

  } else {
    // Długie bojówki na łydce
    const traceLongShin = () => {
      ctx.beginPath();
      ctx.moveTo(0, -kneeR * 1.05);
      ctx.bezierCurveTo(shinLen * 0.3, -3.2, shinLen * 0.65, -3.4, shinLen - 3.8, -achillesHalfW * 1.3);
      ctx.lineTo(shinLen - 3.8, achillesHalfW * 1.3);
      ctx.bezierCurveTo(shinLen * 0.6, calfBulge * 0.95, shinLen * 0.25, calfBulge * 1.05, 0, kneeR * 1.05);
      ctx.closePath();
    };

    traceLongShin();

    if (camo) {
      ctx.save();
      ctx.clip();
      drawCamoSplotches(ctx, camo, 0, -3.5, shinLen - 3, 3.5);
      ctx.restore();
      traceLongShin();
    } else {
      ctx.fillStyle = pal.base;
      ctx.fill();
    }
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // Zaszewki zgięcia kolana
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.30)';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(1.2, -2.4);
    ctx.quadraticCurveTo(2.0, 0, 1.2, 2.2);
    ctx.stroke();
  }

  // Wojskowy but bojowy
  ctx.save();
  ctx.translate(shinLen, 0);
  ctx.rotate(-shinAng + Math.PI / 2);

  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.moveTo(-3.2, -2.0);
  ctx.lineTo(6.8, -2.0);
  ctx.lineTo(6.8, 3.0);
  ctx.lineTo(-3.2, 3.0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.85;
  ctx.stroke();

  // Podeszwa buta z protektorem
  ctx.fillStyle = '#18181b';
  ctx.fillRect(-3.6, 2.8, 10.8, 1.6);

  ctx.restore();
  ctx.restore();
  ctx.restore();
}
