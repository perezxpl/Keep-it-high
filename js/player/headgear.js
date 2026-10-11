// =========================================================================
// PLAYER/HEADGEAR.JS - SYSTEM NAKRYĆ GŁOWY, PALET I PODGLĄDÓW KREATORA
// Zarządza stylami nakryć głowy (beret, czapka, kominiarka, bandana, boonie hat,
// shemagh, gogle) oraz ich renderowaniem na profilu postaci i w Kreatorze.
// =========================================================================

import {
  DEFAULT_VISUALS,
  getHairPalette,
  drawCharacterHairProfile,
  drawCharacterHairOverEarProfile,
  updateAndBuildHairChain,
  drawTaperedHairStrand
} from './hair.js';
import { drawCharacterFacialHairProfile } from './facialHair.js';

export const HEADGEAR_STYLE_LIST = [
  'none',       // 1. Brak nakrycia (sama fryzura)
  'beret',      // 2. Wojskowy beret spadochroniarzy / komandosa (na bakier z orzełkiem)
  'cap',        // 3. Czapka z daszkiem wojskowa / Operator Patrol Cap (z rzepem Velcro)
  'balaclava',  // 4. Kominiarka taktyczna SpecOps (zakrywająca szyję i twarz)
  'bandana',    // 5. Bandana bojowa komandosa (opaska na czole z 2 powiewającymi końcami)
  'boonie',     // 6. Wojskowy kapelusz polowy Boonie Hat (szerokie rondo i taśma maskująca)
  'shemagh',    // 7. Chusta taktyczna / Shemagh (Arafatka na szyję i dolną twarz)
  'goggles'     // 8. Gogle balistyczne na czole (ze stylowym paskiem wokół głowy)
];

export const HEADGEAR_COLOR_LIST = [
  '#18181b', // 1. Taktyczna czerń / Onyx
  '#3f4a3c', // 2. Oliwkowa zieleń (Olive Drab / Ranger Green)
  '#5c4a38', // 3. Coyote Brown / Khaki
  '#7f1d1d', // 4. Bordowy / Karmazynowy (beret desantu)
  '#1e293b', // 5. Ciemny granat (Navy / SWAT)
  '#475569', // 6. Stalowoszary (Urban Grey)
  '#a16207', // 7. Pustynny piaskowy (Desert Tan)
  '#e2e8f0'  // 8. Arktyczny biały / Śnieżny kamuflaż
];

/**
 * Zwraca paletę odcieni dla koloru nakrycia głowy (baza, cienie, podświetlenia, lamówka)
 */
export function getHeadgearPalette(hexColor = '#18181b') {
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
    highlight: rgba(Math.min(255, r + 75), Math.min(255, g + 75), Math.min(255, b + 75), 0.38),
    trim: rgb(r * 0.40, g * 0.40, b * 0.40)
  };
}

/**
 * Renderuje wybrane nakrycie głowy na profilu postaci.
 *
 * Współrzędne twarzy w profilu:
 * - Czoło: (4.2, -5.2) do (4.4, -3.4)
 * - Nos: (6.8, -1.0)
 * - Oczy: (2.7, -2.1)
 * - Wargi/usta: (4.9, 1.4)
 * - Podbródek: (4.3, 4.8)
 * - Kąt żuchwy: (-3.5, 3.8)
 * - Ucho: (-2.6, -0.6), rX: 1.6, rY: 2.2
 * - Szczyt czaszki: (-1.2, -7.2)
 * - Potylica: (-5.4, -7.2) do (-6.0, -2.8)
 * - Kark: (-4.6, 2.5) do (-3.0, 2.2)
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} p - obiekt gracza
 * @param {Object} v - właściwości wizualne gracza (visuals)
 * @param {boolean} hasHelmet - czy gracz posiada nałożony pancerz hełmu FAST
 */
export function drawCharacterHeadgearProfile(
  ctx,
  p,
  v,
  hasHelmet = false,
  currentFacingDir = 1,
  torsoTilt = 0,
  headPitch = 0
) {
  const rawStyle = String(v.headgearStyle || 'none').toLowerCase();
  const style = (rawStyle === 'brak' || rawStyle === 'shaved') ? 'none' : rawStyle;
  if (style === 'none') return;

  // Jeśli gracz ma założony hełm pancerza FAST:
  // - kominiarka i arafatka (shemagh) są noszone POD hełmem i pozostają widoczne na szyi/twarzy
  // - sztywne czapki, berety, kapelusze i gogle ustępują miejsca hełmowi balistycznemu
  if (hasHelmet && style !== 'balaclava' && style !== 'shemagh') {
    return;
  }

  const colorHex = v.headgearColor || '#18181b';
  const pal = getHeadgearPalette(colorHex);

  const headGrad = ctx.createLinearGradient(-5.0, -10.0, 5.0, 0.0);
  headGrad.addColorStop(0.0, pal.light);
  headGrad.addColorStop(0.55, pal.base);
  headGrad.addColorStop(1.0, pal.dark);

  ctx.save();

  if (style === 'beret') {
    // -------------------------------------------------------------------------
    // 1. BERET WOJSKOWY (Military Beret na bakier z orzełkiem i tasiemkami ściągacza)
    // -------------------------------------------------------------------------
    // A. Skórzany otok / sweatband (opasający czoło, skronie i schodzący głęboko w dół na potylicę)
    ctx.beginPath();
    ctx.moveTo(4.4, -4.6);
    ctx.quadraticCurveTo(0.0, -4.8, -6.0, -0.6); // schodzi nisko na tył potylicy
    ctx.lineTo(-5.6, 0.4);                       // dolna krawędź otoku z tyłu
    ctx.quadraticCurveTo(0.0, -3.6, 4.4, -3.4);  // dolna krawędź otoku z przodu
    ctx.closePath();
    ctx.fillStyle = '#09090b';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.85;
    ctx.stroke();

    // Tasiemki ściągacza z tyłu beretu (dwie czarne wstążki ze ściągacza potylicznego)
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-5.8, -0.1);
    ctx.quadraticCurveTo(-6.8, 0.6, -7.4, 2.2);
    ctx.moveTo(-5.8, 0.2);
    ctx.quadraticCurveTo(-6.4, 1.2, -6.8, 3.0);
    ctx.stroke();

    // B. Sukienna czasza beretu:
    // Wznosi się z przodu nad czołem, pokrywa całe sklepienie czaszki i opada na bakier,
    // zakrywając tył głowy aż do linii otoku
    ctx.beginPath();
    ctx.moveTo(4.4, -4.6);
    ctx.quadraticCurveTo(5.4, -8.6, 1.6, -9.6);   // uniesiony przód i grzbiet czaszy
    ctx.quadraticCurveTo(-4.8, -9.6, -6.8, -5.2);  // opadający profil tyłu
    ctx.quadraticCurveTo(-7.2, -2.4, -6.0, -0.6);  // zachodzi głęboko na tył głowy
    ctx.quadraticCurveTo(0.0, -4.8, 4.4, -4.6);    // linia połączenia z otokiem
    ctx.closePath();
    ctx.fillStyle = headGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // Miękka fałda zagniecenia wełny na bakier
    ctx.strokeStyle = pal.deep;
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(-0.5, -9.4);
    ctx.quadraticCurveTo(-4.2, -8.0, -6.2, -4.2);
    ctx.stroke();

    // Akcent światła na grzbiecie beretu
    ctx.strokeStyle = pal.highlight;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(3.2, -8.2);
    ctx.quadraticCurveTo(1.2, -9.0, -1.2, -8.8);
    ctx.stroke();

    // C. Orzełek / naszywka jednostki z przodu beretu
    ctx.save();
    ctx.fillStyle = '#e2e8f0'; // srebrny metal
    ctx.beginPath();
    ctx.moveTo(3.2, -7.2);
    ctx.lineTo(3.9, -5.6);
    ctx.lineTo(2.6, -5.8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Złota tarcza / gwiazdka
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(3.2, -6.4, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

  } else if (style === 'cap') {
    // -------------------------------------------------------------------------
    // 2. CZAPKA Z DASZKIEM WOJSKOWA (Operator Patrol Cap z rzepem Velcro)
    // -------------------------------------------------------------------------
    // A. Korona czapki – obejmuje czoło, całe sklepienie czaszki i schodzi głęboko na tył potylicy
    ctx.beginPath();
    // Od daszka na czole
    ctx.moveTo(4.4, -4.6);
    // Przedni panel wznoszący się do szczytu korony
    ctx.quadraticCurveTo(3.8, -8.8, -0.6, -9.0);
    // Sklepienie korony ku potylicy
    ctx.quadraticCurveTo(-4.6, -9.0, -6.4, -5.2);
    // Tył korony schodzący w dół potylicy
    ctx.quadraticCurveTo(-6.8, -2.6, -6.2, -0.4);
    // Półkoliste wycięcie regulacji z tyłu potylicy (arch cutout)
    ctx.quadraticCurveTo(-5.4, -1.8, -4.6, -1.4);
    // Dolna krawędź czapki biegnąca nad uchem do czoła
    ctx.quadraticCurveTo(0.0, -4.2, 4.0, -3.8);
    ctx.lineTo(4.4, -4.6);
    ctx.closePath();
    ctx.fillStyle = headGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // Pasek regulacji z tyłu w wycięciu (strap & buckle)
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-6.2, -0.4);
    ctx.lineTo(-4.6, -1.4);
    ctx.stroke();

    // Guzik na szczycie korony (squatchee)
    ctx.fillStyle = pal.dark;
    ctx.beginPath();
    ctx.arc(-0.6, -9.0, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // B. Panel rzepu Velcro z przodu na morale patch
    ctx.fillStyle = pal.dark;
    ctx.beginPath();
    ctx.rect(1.8, -7.5, 2.3, 2.2);
    ctx.fill();
    ctx.strokeStyle = pal.deep;
    ctx.lineWidth = 0.55;
    ctx.strokeRect(1.8, -7.5, 2.3, 2.2);

    // Mikro-akcent na rzepie
    ctx.fillStyle = pal.light;
    ctx.fillRect(2.3, -6.6, 1.2, 0.6);

    // C. Wygięty sztywny daszek taktyczny wystający w przód
    ctx.beginPath();
    ctx.moveTo(4.4, -4.6);
    ctx.quadraticCurveTo(6.8, -4.6, 9.6, -3.6);
    ctx.lineTo(9.4, -2.7);
    ctx.quadraticCurveTo(6.4, -3.8, 3.8, -3.8);
    ctx.closePath();
    ctx.fillStyle = pal.dark;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // Przeszycie daszka
    ctx.strokeStyle = pal.highlight;
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.moveTo(4.6, -4.3);
    ctx.quadraticCurveTo(6.8, -4.3, 9.2, -3.4);
    ctx.stroke();

  } else if (style === 'balaclava') {
    // -------------------------------------------------------------------------
    // 3. KOMINIARKA TAKTYCZNA (SpecOps Balaclava zakrywająca całą głowę i szyję)
    // -------------------------------------------------------------------------
    // Kominiarka szczelnie pokrywa całą czaszkę, całą potylicę, kark, uszy,
    // podbródek, usta i nos, z anatomicznym wycięciem na oczy. Nic nie jest ucięte!
    const balaGrad = ctx.createLinearGradient(-5.0, -9.0, 5.0, 8.0);
    balaGrad.addColorStop(0.0, pal.light);
    balaGrad.addColorStop(0.45, pal.base);
    balaGrad.addColorStop(1.0, pal.dark);

    ctx.beginPath();
    // 1. Dół szyi z tyłu (wpuszczony głęboko w kołnierz bluzy bojowej)
    ctx.moveTo(-3.6, 8.0);
    // 2. Kark i dolna potylica – anatomiczny łuk obejmujący całą szyję i tył głowy
    ctx.quadraticCurveTo(-4.8, 4.4, -4.8, 2.4);
    // 3. Pełna wypukłość potylicy z naddatkiem na grubość kominiarki (bez ucinania!)
    ctx.quadraticCurveTo(-6.8, 0.2, -6.5, -2.8);
    // 4. Sklepienie czaszki i ciemię
    ctx.quadraticCurveTo(-5.8, -7.8, -1.2, -7.8);
    // 5. Czoło
    ctx.quadraticCurveTo(3.2, -7.6, 4.6, -5.2);
    ctx.lineTo(4.7, -3.6); // górna krawędź wycięcia na oko

    // 6. Anatomiczne wycięcie na oczy (wizjer)
    ctx.lineTo(1.4, -3.5);
    ctx.quadraticCurveTo(0.4, -2.1, 1.4, -1.0);
    ctx.lineTo(4.8, -1.1); // dolna krawędź wycięcia na nasadzie nosa

    // 7. Nos, wargi i podbródek opięte tkaniną
    ctx.lineTo(7.0, -0.9); // nos
    ctx.lineTo(5.3, 0.4);
    ctx.lineTo(5.6, 1.4);  // usta
    ctx.lineTo(5.1, 2.2);
    ctx.lineTo(5.5, 2.8);
    ctx.lineTo(4.5, 5.0);  // podbródek
    // 8. Przód szyi schodzący do kołnierza
    ctx.lineTo(2.2, 8.0);
    // 9. Dół kominiarki zamykający się pod kołnierzem
    ctx.quadraticCurveTo(-0.6, 8.5, -3.6, 8.0);
    ctx.closePath();
    ctx.fillStyle = balaGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Wzmocniona elastyczna lamówka wokół wycięcia na oczy
    ctx.strokeStyle = pal.deep;
    ctx.lineWidth = 0.95;
    ctx.beginPath();
    ctx.moveTo(4.7, -3.6);
    ctx.lineTo(1.4, -3.5);
    ctx.quadraticCurveTo(0.4, -2.1, 1.4, -1.0);
    ctx.lineTo(4.8, -1.1);
    ctx.stroke();

    // Płaskie szwy taktyczne kominiarki
    ctx.strokeStyle = pal.deep;
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    // Szew na nosie i podbródku
    ctx.moveTo(4.8, -1.1);
    ctx.lineTo(6.8, -0.9);
    ctx.lineTo(5.2, 2.0);
    ctx.lineTo(4.4, 4.9);
    // Boczny szew anatomiczny od oka wzdłuż żuchwy ku szyi
    ctx.moveTo(1.4, -1.0);
    ctx.quadraticCurveTo(0.8, 2.4, 0.5, 7.8);
    ctx.stroke();

    // Zagięcia tkaniny na karku i podbródku
    ctx.strokeStyle = pal.highlight;
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    ctx.moveTo(-4.2, 2.0);
    ctx.quadraticCurveTo(-2.5, 3.2, -1.0, 3.8);
    ctx.moveTo(2.4, 4.8);
    ctx.quadraticCurveTo(1.2, 5.8, 0.0, 6.4);
    ctx.stroke();

  } else if (style === 'bandana') {
    // -------------------------------------------------------------------------
    // 4. BANDANA BOJOWA KOMANDOSA (Combat Bandana z długimi końcami i fizyką 2D)
    // -------------------------------------------------------------------------
    // A. Opaska opasająca czoło i potylicę
    ctx.beginPath();
    ctx.moveTo(4.5, -4.8);
    ctx.quadraticCurveTo(0.0, -4.4, -5.6, -3.6);
    ctx.lineTo(-5.4, -2.0);
    ctx.quadraticCurveTo(0.0, -2.8, 4.6, -3.0);
    ctx.closePath();
    ctx.fillStyle = headGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // Górne i dolne fałdy opaski
    ctx.strokeStyle = pal.highlight;
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.moveTo(4.4, -4.5);
    ctx.quadraticCurveTo(0.0, -4.1, -5.2, -3.3);
    ctx.stroke();

    // B. Dwa długie, swobodne końce bandany z pełną fizyką 2D (Verlet / Spring chain)
    // 1. Dolna wstęga (nieco krótsza, powiewająca niezależnie pod spodem)
    const ribbonBotChain = updateAndBuildHairChain(
      p, 'bandana_bot', currentFacingDir, torsoTilt, headPitch,
      -5.4, -2.2, 2.55,
      {
        id: 'bd_ribbon_bot',
        phase: 1.6,
        restOffset: -0.06,
        archRoot: 0.22,
        liftMult: 1.40,
        gravMult: 0.88,
        stiffMult: 0.90,
        restProfile: [2.32, 2.04, 1.80, 1.65, 1.70, 1.78]
      }
    );
    drawTaperedHairStrand(
      ctx,
      ribbonBotChain.pts,
      ribbonBotChain.norms,
      [1.25, 1.60, 1.45, 1.20, 0.85, 0.45, 0.0],
      pal.dark,
      '#09090b',
      null
    );

    // 2. Górna wstęga (dłuższa, główna wstęga powiewająca swobodnie na wietrze)
    const ribbonTopChain = updateAndBuildHairChain(
      p, 'bandana_top', currentFacingDir, torsoTilt, headPitch,
      -5.6, -2.5, 2.95,
      {
        id: 'bd_ribbon_top',
        phase: 0.0,
        restOffset: 0.14,
        archRoot: 0.34,
        liftMult: 1.50,
        gravMult: 0.80,
        stiffMult: 0.86,
        restProfile: [2.54, 2.20, 1.90, 1.70, 1.74, 1.84]
      }
    );
    drawTaperedHairStrand(
      ctx,
      ribbonTopChain.pts,
      ribbonTopChain.norms,
      [1.35, 1.75, 1.65, 1.40, 1.05, 0.55, 0.0],
      headGrad,
      '#09090b',
      pal.highlight
    );

    // C. Węzeł chusty z tyłu potylicy (przykrywający nasadę powiewających wstęg)
    ctx.fillStyle = pal.dark;
    ctx.beginPath();
    ctx.ellipse(-5.6, -2.5, 1.30, 1.60, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // Środek węzła ze zagnieceniami
    ctx.fillStyle = pal.base;
    ctx.beginPath();
    ctx.ellipse(-5.8, -2.4, 0.80, 1.10, 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = pal.highlight;
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.moveTo(-5.9, -3.2);
    ctx.quadraticCurveTo(-5.5, -2.5, -5.7, -1.7);
    ctx.stroke();

  } else if (style === 'boonie') {
    // -------------------------------------------------------------------------
    // 5. WOJSKOWY KAPELUSZ POLOWY (Boonie Hat z miękkim rondem i taśmą)
    // -------------------------------------------------------------------------
    // A. Korona kapelusza – pełne zakrycie sklepienia czaszki do y = -10.0
    ctx.beginPath();
    ctx.moveTo(-5.4, -4.4);
    ctx.lineTo(-4.8, -9.4);
    ctx.quadraticCurveTo(-0.5, -10.0, 3.0, -9.2);
    ctx.lineTo(4.2, -4.6);
    ctx.quadraticCurveTo(0.0, -5.0, -5.4, -4.4);
    ctx.closePath();
    ctx.fillStyle = headGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // B. Taśma maskująca wokół korony (foliage ring)
    ctx.fillStyle = pal.deep;
    ctx.beginPath();
    ctx.moveTo(-5.3, -5.4);
    ctx.lineTo(-5.0, -6.8);
    ctx.quadraticCurveTo(-0.5, -7.4, 3.5, -6.8);
    ctx.lineTo(3.8, -5.4);
    ctx.quadraticCurveTo(-0.5, -6.0, -5.3, -5.4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.65;
    ctx.stroke();

    // Przeszycia taśmy maskującej
    ctx.strokeStyle = pal.light;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-3.2, -5.6); ctx.lineTo(-3.1, -6.9);
    ctx.moveTo(-0.8, -5.8); ctx.lineTo(-0.8, -7.2);
    ctx.moveTo(1.4, -5.6);  ctx.lineTo(1.5, -7.0);
    ctx.stroke();

    // Mosiężne oczka wentylacyjne
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(-2.0, -8.0, 0.45, 0, Math.PI * 2);
    ctx.arc(1.0, -8.0, 0.45, 0, Math.PI * 2);
    ctx.fill();

    // C. Pofalowane miękkie rondo kapelusza (brim)
    ctx.beginPath();
    ctx.moveTo(-8.6, -2.8);
    ctx.quadraticCurveTo(-6.0, -4.6, -5.4, -4.4);
    ctx.quadraticCurveTo(0.0, -5.0, 4.2, -4.6);
    ctx.quadraticCurveTo(6.8, -4.2, 9.6, -2.8);
    ctx.quadraticCurveTo(6.6, -3.6, 4.0, -3.8);
    ctx.quadraticCurveTo(0.0, -4.0, -5.2, -3.6);
    ctx.quadraticCurveTo(-7.0, -3.4, -8.6, -2.8);
    ctx.closePath();
    ctx.fillStyle = pal.dark;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Cień rzucany przez rondo na czoło i skroń
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.moveTo(-5.2, -3.6);
    ctx.quadraticCurveTo(0.0, -4.0, 4.0, -3.8);
    ctx.lineTo(3.6, -2.4);
    ctx.quadraticCurveTo(0.0, -2.6, -4.6, -2.4);
    ctx.closePath();
    ctx.fill();

    // D. Pasek podbródkowy ze stoperem
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-2.4, -3.2);
    ctx.quadraticCurveTo(-0.6, 0.8, 0.2, 4.4);
    ctx.stroke();

  } else if (style === 'shemagh') {
    // -------------------------------------------------------------------------
    // 6. CHUSTA TAKTYCZNA / SHEMAGH (Arafatka na dolną twarz i szyję)
    // -------------------------------------------------------------------------
    // Owinięta wokół szyi, karku, podbródka i nosa, z taktycznym deseniem
    const shemGrad = ctx.createLinearGradient(-3.0, -1.0, 3.0, 8.0);
    shemGrad.addColorStop(0.0, pal.light);
    shemGrad.addColorStop(0.55, pal.base);
    shemGrad.addColorStop(1.0, pal.dark);

    ctx.beginPath();
    // Od nasady nosa pod okiem
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
    ctx.fillStyle = shemGrad;
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

    // Frędzle na dole chusty
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(2.8, 8.2); ctx.lineTo(3.2, 9.4);
    ctx.moveTo(1.2, 8.5); ctx.lineTo(1.4, 9.8);
    ctx.moveTo(-0.8, 8.6); ctx.lineTo(-0.7, 9.7);
    ctx.moveTo(-2.4, 8.4); ctx.lineTo(-2.6, 9.5);
    ctx.stroke();

  } else if (style === 'goggles') {
    // -------------------------------------------------------------------------
    // 7. GOGLE BALISTYCZNE NA CZOLE (Tactical Goggles z elastycznym paskiem)
    // -------------------------------------------------------------------------
    // A. Elastyczny pasek opasający głowę
    ctx.beginPath();
    ctx.moveTo(4.2, -5.2);
    ctx.quadraticCurveTo(0.0, -5.8, -5.4, -4.6);
    ctx.lineTo(-5.2, -3.6);
    ctx.quadraticCurveTo(0.0, -4.8, 4.0, -4.2);
    ctx.closePath();
    ctx.fillStyle = '#09090b';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // B. Rama gogli balistycznych na czole
    ctx.beginPath();
    ctx.roundRect(1.4, -7.0, 4.0, 2.6, 0.8);
    ctx.fillStyle = pal.dark;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // C. Przyciemniane soczewki poliwęglanowe
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(1.8, -6.6, 3.2, 1.8, 0.5);
    ctx.fill();

    // Odblask światła na soczewce (diagonalny błysk)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.moveTo(2.4, -6.4);
    ctx.lineTo(4.4, -5.0);
    ctx.stroke();

    // D. Boczny zawias i regulator paska
    ctx.fillStyle = '#52525b';
    ctx.fillRect(1.1, -6.4, 0.6, 1.4);
  }

  ctx.restore();
}

/**
 * Renderuje samą głowę z wybranym nakryciem głowy, fryzurą, zarostem i kolorami
 * na kafelku wyboru w Kreatorze Postaci (zakładka "NAKRYCIE GŁOWY").
 */
export function drawHeadHeadgearPreview(
  ctx,
  canvasW,
  canvasH,
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

  // 3. Ucho (ukrywane pod kominiarką)
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

  // 4. Zarost twarzy (pod włosami i nakryciem)
  drawCharacterFacialHairProfile(ctx, v, false);

  // 5. Fryzura postaci (włosy z głowy)
  drawCharacterHairProfile(ctx, tileDummy, v, 1, 0, 0, false);
  drawCharacterHairOverEarProfile(ctx, v, hairPal, false);

  // 6. Nakrycie głowy (rysowane na fryzurze)
  drawCharacterHeadgearProfile(ctx, tileDummy, v, false, 1, 0, 0);

  // 7. Oko i brew (dla kominiarki i innych stylów widoczne w otworze)
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
