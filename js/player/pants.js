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
  // Centrowanie nogi w kadrze kafelka
  ctx.translate(canvasW * 0.44, canvasH * 0.48);
  const scale = Math.min(canvasW, canvasH) / 42.0;
  ctx.scale(scale, scale);

  // 1. Pas taktyczny na górze
  ctx.fillStyle = '#27272a';
  ctx.fillRect(-6.5, -17.5, 13.0, 3.2);
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.85;
  ctx.strokeRect(-6.5, -17.5, 13.0, 3.2);

  // Klamra pasa
  ctx.fillStyle = '#71717a';
  ctx.fillRect(-1.2, -17.0, 2.4, 2.2);

  // 2. Miednica / biodro (górna część spodni)
  const buildPreviewPelvisPath = () => {
    ctx.beginPath();
    ctx.moveTo(-6.2, -14.5);
    ctx.lineTo(6.2, -14.5);
    ctx.quadraticCurveTo(6.5, -8.0, 4.8, -4.5);
    ctx.lineTo(-4.8, -4.5);
    ctx.quadraticCurveTo(-6.5, -8.0, -6.2, -14.5);
    ctx.closePath();
  };

  buildPreviewPelvisPath();
  if (camo) {
    ctx.save();
    ctx.clip();
    drawCamoSplotches(ctx, camo, -7, -15, 7, -4);
    ctx.restore();
    buildPreviewPelvisPath();
  } else {
    ctx.fillStyle = pal.base;
    ctx.fill();
  }
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.95;
  ctx.stroke();

  // 3. Udo (thigh)
  const thighLen = 13.5;
  const thighW = 5.2;

  const buildPreviewThighPath = () => {
    ctx.beginPath();
    ctx.moveTo(-4.5, -4.5);
    ctx.lineTo(4.5, -4.5);
    ctx.quadraticCurveTo(5.2, 2.0, 3.8, thighLen * 0.65);
    ctx.lineTo(-3.8, thighLen * 0.65);
    ctx.quadraticCurveTo(-5.2, 2.0, -4.5, -4.5);
    ctx.closePath();
  };

  buildPreviewThighPath();
  if (camo) {
    ctx.save();
    ctx.clip();
    drawCamoSplotches(ctx, camo, -5.5, -5, 5.5, thighLen * 0.7);
    ctx.restore();
    buildPreviewThighPath();
  } else {
    ctx.fillStyle = pal.base;
    ctx.fill();
  }
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.95;
  ctx.stroke();

  // Boczna kieszeń Cargo na udzie
  ctx.fillStyle = camo ? 'rgba(0, 0, 0, 0.28)' : pal.dark;
  ctx.fillRect(1.5, -1.0, 3.4, 6.2);
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.75;
  ctx.strokeRect(1.5, -1.0, 3.4, 6.2);

  // Klapa kieszeni
  ctx.fillStyle = camo ? 'rgba(0, 0, 0, 0.40)' : pal.base;
  ctx.fillRect(1.3, -2.2, 3.8, 1.6);
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.65;
  ctx.strokeRect(1.3, -2.2, 3.8, 1.6);

  // 4. Kolano i łydka (shin)
  const kneeY = thighLen * 0.65;
  const shinLen = 12.0;

  if (isShort) {
    // KRÓTKIE SPODENKI: Odsłonięta skóra kolana i łydki (bez dziwnych kółek!)
    const legGrad = ctx.createLinearGradient(-3.5, 0, 3.5, 0);
    legGrad.addColorStop(0.0, v.skinDark);
    legGrad.addColorStop(0.4, v.skinMid);
    legGrad.addColorStop(1.0, v.skinLight);

    // Naturalna rzepka i łydka
    ctx.beginPath();
    ctx.moveTo(-3.4, kneeY);
    ctx.lineTo(3.4, kneeY);
    ctx.quadraticCurveTo(4.2, kneeY + 5.0, 2.8, kneeY + shinLen - 2.5);
    ctx.lineTo(-2.8, kneeY + shinLen - 2.5);
    ctx.quadraticCurveTo(-4.2, kneeY + 5.0, -3.4, kneeY);
    ctx.closePath();
    ctx.fillStyle = legGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // Anatomiczne, miękkie cieniowanie rzepki kolanowej (delikatna fałda, bez plastikowego kółka)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.arc(0.2, kneeY + 2.4, 1.6, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

  } else {
    // DŁUGIE BOJÓWKI: Materiał nogawki opada w dół z marszczeniem nad butem
    const buildPreviewShinPath = () => {
      ctx.beginPath();
      ctx.moveTo(-3.8, kneeY);
      ctx.lineTo(3.8, kneeY);
      ctx.quadraticCurveTo(4.8, kneeY + 5.0, 3.6, kneeY + shinLen - 2.0);
      ctx.lineTo(-3.6, kneeY + shinLen - 2.0);
      ctx.quadraticCurveTo(-4.8, kneeY + 5.0, -3.8, kneeY);
      ctx.closePath();
    };

    buildPreviewShinPath();
    if (camo) {
      ctx.save();
      ctx.clip();
      drawCamoSplotches(ctx, camo, -5, kneeY - 1, 5, kneeY + shinLen);
      ctx.restore();
      buildPreviewShinPath();
    } else {
      ctx.fillStyle = pal.base;
      ctx.fill();
    }
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // Naturalne fałdy zgięcia materiału na kolanie (zamiast twardego owalnego kółka)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-2.2, kneeY + 2.2);
    ctx.quadraticCurveTo(0, kneeY + 3.4, 2.2, kneeY + 2.2);
    ctx.stroke();

    // Marszczenie materiału nad butem
    ctx.beginPath();
    ctx.moveTo(-3.0, kneeY + shinLen - 3.5);
    ctx.quadraticCurveTo(0, kneeY + shinLen - 2.2, 3.0, kneeY + shinLen - 3.5);
    ctx.stroke();
  }

  // 5. But taktyczny na dole
  const bootY = kneeY + shinLen - 2.0;
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.moveTo(-3.2, bootY);
  ctx.lineTo(3.2, bootY);
  ctx.lineTo(4.6, bootY + 4.8);
  ctx.lineTo(-3.8, bootY + 4.8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.95;
  ctx.stroke();

  // Podeszwa
  ctx.fillStyle = '#09090b';
  ctx.fillRect(-4.2, bootY + 4.6, 9.2, 1.8);

  ctx.restore();
}
