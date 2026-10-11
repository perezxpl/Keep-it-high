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
  // Centrowanie i proporcjonalne skalowanie na kafelku 68x68 px
  ctx.translate(canvasW * 0.46, canvasH * 0.48);
  const scale = Math.min(canvasW, canvasH) / 46.0;
  ctx.scale(scale, scale);

  // Paleta skóry (dla nóg w krótkich spodenkach)
  const skinLight = v.skinLight || '#fde047';
  const skinMid = v.skinMid || '#d4a373';
  const skinDark = v.skinDark || '#8d5b4c';

  if (isShort) {
    // =========================================================================
    // 1. KRÓTKIE SPODENKI BOJÓWKI (CARGO SHORTS)
    // =========================================================================

    // A. ODSŁONIĘTA NOGA (DOLNE UDO, NATURALNE KOLANO I ŁYDKA - BEZ ŻADNYCH CZARNYCH KRESEK DZIELENIA!)
    // Jednolity, anatomiczny kontur nogi schodzący z wnętrza mankietu spodenek do cholewy buta
    const traceBareLeg = () => {
      ctx.beginPath();
      // Start z wnętrza mankietu spodenek (niewidoczny punkt początkowy)
      ctx.moveTo(3.8, 2.2);
      // Przód: dolne udo -> łagodne, naturalne kolano (rzepka) -> zarys kości piszczelowej -> kostka
      ctx.quadraticCurveTo(4.1, 4.5, 4.0, 5.8);
      ctx.bezierCurveTo(3.7, 9.2, 3.2, 13.2, 2.3, 17.2);
      // Dół przy cholewce buta
      ctx.lineTo(-2.2, 17.2);
      // Tył: ścięgno Achillesa -> brzusiec mięśnia łydki -> dół podkolanowy -> tył uda
      ctx.quadraticCurveTo(-2.8, 14.5, -4.3, 10.8);
      ctx.quadraticCurveTo(-4.5, 7.5, -3.3, 5.4);
      ctx.quadraticCurveTo(-3.5, 3.8, -3.6, 2.2);
      ctx.closePath();
    };

    traceBareLeg();
    const skinGrad = ctx.createLinearGradient(-4.5, 0, 4.2, 0);
    skinGrad.addColorStop(0.0, skinMid);
    skinGrad.addColorStop(0.4, skinLight);
    skinGrad.addColorStop(1.0, skinDark);
    ctx.fillStyle = skinGrad;
    ctx.fill();

    // Naturalny obrys boczny nogi (TYLKO przednia i tylna krawędź – ZERO kreski dzielenia w poprzek kolana!)
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.beginPath();
    // Przednia krawędź od krawędzi mankietu do buta
    ctx.moveTo(3.9, 3.5);
    ctx.quadraticCurveTo(4.1, 4.8, 4.0, 5.8);
    ctx.bezierCurveTo(3.7, 9.2, 3.2, 13.2, 2.3, 17.2);
    // Tylna krawędź od buta do mankietu
    ctx.moveTo(-2.2, 17.2);
    ctx.quadraticCurveTo(-2.8, 14.5, -4.3, 10.8);
    ctx.quadraticCurveTo(-4.5, 7.5, -3.3, 5.4);
    ctx.quadraticCurveTo(-3.5, 4.2, -3.6, 3.5);
    ctx.stroke();

    // Subtelny, naturalny blask anatomiczny na piszczeli (bardzo delikatny, bez ciemnych linii)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(3.5, 7.0);
    ctx.lineTo(2.7, 14.0);
    ctx.stroke();

    // B. SPODENKI BOJÓWKI (JEDNOLITY, PŁYNNY KRÓJ OD PASA DO MANKIETU TUŻ NAD KOLANEM)
    const traceShorts = () => {
      ctx.beginPath();
      // Pas biodrowy z tyłu
      ctx.moveTo(-5.8, -20.0);
      // Pas biodrowy z przodu
      ctx.lineTo(4.6, -20.0);
      // Przednia linia: pas -> rozporek -> udo -> szeroki mankiet cargo sięgający prawie do kolan
      ctx.bezierCurveTo(4.8, -15.0, 4.9, -8.0, 4.8, 3.5);
      // Dolna krawędź szerokiego mankietu
      ctx.lineTo(-5.4, 3.5);
      // Tylna linia: mankiet -> pośladek -> pas z tyłu
      ctx.bezierCurveTo(-6.6, -4.0, -7.2, -13.0, -5.8, -20.0);
      ctx.closePath();
    };

    traceShorts();

    if (camo) {
      ctx.save();
      ctx.clip();
      drawCamoSplotches(ctx, camo, -8.0, -21.0, 6.0, 4.0);
      ctx.restore();
      traceShorts();
    } else {
      const pantsGrad = ctx.createLinearGradient(-6.0, 0, 5.0, 0);
      pantsGrad.addColorStop(0.0, pal.dark);
      pantsGrad.addColorStop(0.35, pal.base);
      pantsGrad.addColorStop(0.8, pal.light);
      pantsGrad.addColorStop(1.0, pal.dark);
      ctx.fillStyle = pantsGrad;
      ctx.fill();
    }
    // Obrys zewnętrzny spodenek
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // Cień wylotu luźnej nogawki rzucany na udo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(-0.3, 3.5, 5.1, 1.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Podwinięcie mankietu z podwójnym szwem
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.fillRect(-5.3, 1.8, 10.0, 1.7);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(-5.3, 1.8);
    ctx.lineTo(4.7, 1.8);
    ctx.stroke();

    // Boczna kieszeń cargo na spodenkach (zintegrowana, miękka patka, bez dzielenia spodni na klocki)
    ctx.fillStyle = camo ? 'rgba(0, 0, 0, 0.22)' : pal.dark;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-2.0, -6.5, 4.8, 5.5, 0.6);
    else ctx.rect(-2.0, -6.5, 4.8, 5.5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 0.7;
    ctx.stroke();

    // Patka kieszeni cargo
    ctx.fillStyle = camo ? 'rgba(0, 0, 0, 0.32)' : 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-2.2, -7.8, 5.2, 1.8, 0.5);
    else ctx.rect(-2.2, -7.8, 5.2, 1.8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.lineWidth = 0.7;
    ctx.stroke();

  } else {
    // =========================================================================
    // 2. DŁUGIE BOJÓWKI BOJOWE (LONG CARGO TROUSERS)
    // =========================================================================
    // Jednolity, ergonomiczny krój bojówek Crye Precision:
    // Płynna ciągła sylwetka od pasa po kostkę, ZERO czarnej kreski w kolanie, ZERO sztucznych segmentów!

    const traceLongTrousers = () => {
      ctx.beginPath();
      // Pas z tyłu
      ctx.moveTo(-5.8, -20.0);
      // Pas z przodu
      ctx.lineTo(4.6, -20.0);
      // Przód: pas -> rozporek -> udo -> łagodne przejście przez kolano -> łydka -> dół nogawki
      ctx.bezierCurveTo(4.8, -15.0, 4.8, -9.0, 4.6, -3.0);
      ctx.bezierCurveTo(4.4, 1.0, 4.2, 4.5, 4.0, 6.5); // okolica kolana (płynny profil materiału)
      ctx.bezierCurveTo(3.8, 9.5, 3.4, 13.5, 2.6, 17.2); // łydka i mankiet
      // Dół nogawki przy cholewce buta
      ctx.lineTo(-3.2, 17.2);
      // Tył: ściągacz -> zbluzowana łydka -> dół podkolanowy -> udo -> pośladek -> pas z tyłu
      ctx.bezierCurveTo(-4.4, 14.0, -4.8, 10.5, -4.0, 6.5); // łydka i tył kolana
      ctx.bezierCurveTo(-4.4, 2.5, -5.4, -4.0, -6.5, -9.0); // udo
      ctx.bezierCurveTo(-7.2, -13.0, -7.0, -16.5, -5.8, -20.0); // pośladek do pasa
      ctx.closePath();
    };

    traceLongTrousers();

    if (camo) {
      ctx.save();
      ctx.clip();
      drawCamoSplotches(ctx, camo, -8.0, -21.0, 6.0, 18.0);
      ctx.restore();
      traceLongTrousers();
    } else {
      const pantsGrad = ctx.createLinearGradient(-6.0, 0, 5.0, 0);
      pantsGrad.addColorStop(0.0, pal.dark);
      pantsGrad.addColorStop(0.35, pal.base);
      pantsGrad.addColorStop(0.8, pal.light);
      pantsGrad.addColorStop(1.0, pal.dark);
      ctx.fillStyle = pantsGrad;
      ctx.fill();
    }

    // Obrys zewnętrzny całych spodni (tylko obwód – ZERO wewnętrznych czarnych kresek!)
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // Boczna kieszeń miechowa cargo na udzie
    ctx.fillStyle = camo ? 'rgba(0, 0, 0, 0.22)' : pal.dark;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-2.0, -5.5, 5.0, 6.5, 0.6);
    else ctx.rect(-2.0, -5.5, 5.0, 6.5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 0.7;
    ctx.stroke();

    // Patka kieszeni cargo
    ctx.fillStyle = camo ? 'rgba(0, 0, 0, 0.32)' : 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-2.2, -7.0, 5.4, 2.0, 0.5);
    else ctx.rect(-2.2, -7.0, 5.4, 2.0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.lineWidth = 0.7;
    ctx.stroke();

    // Ergonomiczne zaszewki profilujące kolano (subtelny miękki cień materiału, ZERO czarnej kreski dzielenia!)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(3.6, 4.5);
    ctx.quadraticCurveTo(2.8, 6.5, 1.4, 6.5);
    ctx.stroke();

    // Naturalny cień zbluzowanego mankietu opadającego na but
    ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
    ctx.beginPath();
    ctx.ellipse(-0.3, 17.0, 2.9, 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // =========================================================================
  // 3. PAS TAKTYCZNY NA GÓRZE (ZINTEGROWANY ZE SPODNIAMI)
  // =========================================================================
  ctx.fillStyle = '#27272a';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-5.8, -20.0, 10.4, 2.8, 0.4);
  else ctx.rect(-5.8, -20.0, 10.4, 2.8);
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.85;
  ctx.stroke();

  // Klamra pasa taktycznego
  ctx.fillStyle = '#71717a';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(1.2, -19.6, 2.2, 2.0, 0.3);
  else ctx.rect(1.2, -19.6, 2.2, 2.0);
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.65;
  ctx.stroke();

  // Metaliczny refleks klamry
  ctx.fillStyle = '#a1a1aa';
  ctx.fillRect(1.5, -19.3, 1.4, 1.4);

  // =========================================================================
  // 4. WOJSKOWY BUT BOJOWY (TACTICAL COMBAT BOOT)
  // =========================================================================
  // Cholewa buta
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-2.6, 17.2, 5.0, 2.0, 0.4);
  else ctx.rect(-2.6, 17.2, 5.0, 2.0);
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Korpus buta (profil boczny z noskiem)
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.moveTo(-3.4, 18.8);
  ctx.lineTo(1.8, 18.8);
  ctx.quadraticCurveTo(3.8, 19.3, 5.8, 20.8);
  ctx.lineTo(5.8, 21.4);
  ctx.lineTo(-3.4, 21.4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Podeszwa buta z protektorem
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-3.8, 21.2, 9.8, 1.4, 0.3);
  else ctx.rect(-3.8, 21.2, 9.8, 1.4);
  ctx.fill();

  // Ząbki protektora
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-1.5, 21.4); ctx.lineTo(-1.5, 22.6);
  ctx.moveTo(1.0, 21.4); ctx.lineTo(1.0, 22.6);
  ctx.moveTo(3.5, 21.4); ctx.lineTo(3.5, 22.6);
  ctx.stroke();

  ctx.restore();
}
