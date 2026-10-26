// =========================================================================
// PLAYER/SHOES.JS - F工程 OBUWIA, KOLORYSTYKA I RENDEROWANIE BUTÓW
// Dedykowany moduł fasonów obuwia: ciężkie buty, sneakersy, korki, hi-topy, wysokie glany
// =========================================================================

import { DEFAULT_VISUALS } from './hair.js';
import { getJetpackFlamePalette, drawJetpackThrustPlume } from './jetpack.js';

export const SHOES_STYLE_LIST = [
  'combat_boots',
  'sneakers',
  'cleats',
  'hitops',
  'high_boots'
];

export const SHOES_STYLE_NAMES = {
  combat_boots: 'Buty Desantowe',
  sneakers: 'Sneakersy Miejskie',
  cleats: 'Korki Bojowe',
  hitops: 'Wysokie Trampki Hi-Top',
  high_boots: 'Wysokie Glany z Klamrami'
};

export const SHOES_COLOR_LIST = [
  '#18181b', // Czerń taktyczna
  '#27272a', // Grafit / Karbon
  '#2e3a24', // Oliwka wojskowa
  '#44382c', // Coyote Tan / Piaskowy
  '#e4e4e7', // Czysta biel / Popiel
  '#991b1b'  // Czerwień Crimson
];

/**
 * Zwraca paletę kolorystyczną obuwia
 */
export function getShoesPalette(hex = '#18181b') {
  if (hex === '#18181b') return { base: '#18181b', light: '#3f3f46', dark: '#09090b', sole: '#09090b', accent: '#71717a' };
  if (hex === '#27272a') return { base: '#27272a', light: '#52525b', dark: '#18181b', sole: '#09090b', accent: '#a1a1aa' };
  if (hex === '#2e3a24') return { base: '#2e3a24', light: '#4b5e3a', dark: '#1a2214', sole: '#18181b', accent: '#65a30d' };
  if (hex === '#44382c') return { base: '#44382c', light: '#6b5845', dark: '#292119', sole: '#18181b', accent: '#d97706' };
  if (hex === '#e4e4e7') return { base: '#e4e4e7', light: '#ffffff', dark: '#a1a1aa', sole: '#27272a', accent: '#09090b' };
  if (hex === '#991b1b') return { base: '#991b1b', light: '#dc2626', dark: '#450a0a', sole: '#09090b', accent: '#fca5a5' };
  return { base: hex, light: '#3f3f46', dark: '#18181b', sole: '#09090b', accent: '#71717a' };
}

/**
 * Zwraca true jeśli dany model to wysokie buty zakrywające nogawkę
 */
export function isHighBoot(style = 'combat_boots') {
  return style === 'high_boots' || style === 'combat_boots' || style === 'hitops';
}

/**
 * Renderuje cholewkę buta w układzie współrzędnych łydki (shin frame),
 * wywoływane PO narysowaniu nogawki spodni, tak aby wyższe buty zakrywały nogawkę.
 */
export function drawBootCollarOverPants(ctx, style, color, isFrontLeg, muscle, l2, achillesHalfW, v, facing = 1) {
  const pal = getShoesPalette(color || v.shoesColor || '#18181b');
  const bCol = color || v.shoesColor || '#18181b';

  const collarGrad = ctx.createLinearGradient(0, -3.4, 0, 3.4);
  collarGrad.addColorStop(0.0, isFrontLeg ? pal.light : pal.base);
  collarGrad.addColorStop(0.5, bCol);
  collarGrad.addColorStop(1.0, pal.dark);

  if (style === 'high_boots') {
    // 1. WYSOKIE GLANY Z KLAMRAMI - najwyższa cholewa sięgająca wysoko na łydkę i zakrywająca nogawkę
    const collarTop = l2 - 9.4 * muscle;
    const collarH = 9.4 * muscle;
    const collarHalfW = achillesHalfW * 1.36;

    ctx.fillStyle = collarGrad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(collarTop, -collarHalfW, collarH, collarHalfW * 2, 1.2);
    else ctx.rect(collarTop, -collarHalfW, collarH, collarHalfW * 2);
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // Dwa poprzeczne pasy z klamrami opinające nogawkę
    // Górny pas
    const strap1X = collarTop + 1.8;
    ctx.fillStyle = '#09090b';
    ctx.fillRect(strap1X, -collarHalfW - 0.2, 1.8, collarHalfW * 2 + 0.4);
    // Klamra górna
    ctx.fillStyle = '#a1a1aa';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(strap1X - 0.2, -1.3, 2.2, 2.6, 0.4);
    else ctx.rect(strap1X - 0.2, -1.3, 2.2, 2.6);
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Dolny pas
    const strap2X = collarTop + 5.2;
    ctx.fillStyle = '#09090b';
    ctx.fillRect(strap2X, -collarHalfW - 0.2, 1.8, collarHalfW * 2 + 0.4);
    // Klamra dolna
    ctx.fillStyle = '#a1a1aa';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(strap2X - 0.2, -1.3, 2.2, 2.6, 0.4);
    else ctx.rect(strap2X - 0.2, -1.3, 2.2, 2.6);
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.6;
    ctx.stroke();

  } else if (style === 'hitops') {
    // 2. WYSOKIE TRAMPKI HI-TOP - cholewka canvas zakrywająca nogawkę ze sznurowaniem i naszywką
    const collarTop = l2 - 7.6 * muscle;
    const collarH = 7.6 * muscle;
    const collarHalfW = achillesHalfW * 1.26;

    ctx.fillStyle = collarGrad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(collarTop, -collarHalfW, collarH, collarHalfW * 2, 1.0);
    else ctx.rect(collarTop, -collarHalfW, collarH, collarHalfW * 2);
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // Okrągła naszywka All-Star z boku kostki
    if (isFrontLeg) {
      ctx.fillStyle = '#e4e4e7';
      ctx.beginPath();
      ctx.arc(collarTop + 3.2, 0, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.55;
      ctx.stroke();

      // Czerwona gwiazdka wewnątrz naszywki
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(collarTop + 3.2, 0, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wysokie białe oczka i sznurowadła z przodu
    ctx.fillStyle = '#e4e4e7';
    for (let lx = collarTop + 1.2; lx <= l2 - 1.5; lx += 1.8) {
      ctx.fillRect(lx, -collarHalfW, 0.9, 0.6);
    }

  } else if (style === 'combat_boots') {
    // 3. BUTY DESANTOWE - solidna wojskowa cholewka zakrywająca dół nogawki
    const collarTop = l2 - 6.6 * muscle;
    const collarH = 6.6 * muscle;
    const collarHalfW = achillesHalfW * 1.30;

    ctx.fillStyle = collarGrad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(collarTop, -collarHalfW, collarH, collarHalfW * 2, 1.0);
    else ctx.rect(collarTop, -collarHalfW, collarH, collarHalfW * 2);
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // Skórzany wyściełany wałek kołnierza na górze
    ctx.fillStyle = '#27272a';
    ctx.fillRect(collarTop - 0.2, -collarHalfW - 0.2, 1.5, collarHalfW * 2 + 0.4);
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.6;
    ctx.strokeRect(collarTop - 0.2, -collarHalfW - 0.2, 1.5, collarHalfW * 2 + 0.4);

    // Przelotki szybkiego sznurowania (speed hooks)
    if (isFrontLeg) {
      ctx.fillStyle = '#71717a';
      for (let lx = collarTop + 1.8; lx <= l2 - 1.2; lx += 1.8) {
        ctx.fillRect(lx, -collarHalfW, 0.9, 0.7);
      }
    }

  } else if (style === 'cleats') {
    // 4. KORKI PIŁKARSKIE - elastyczny mankiet skarpety kompresyjnej (Dynamic Fit)
    const collarTop = l2 - 4.2 * muscle;
    const collarH = 4.2 * muscle;
    const collarHalfW = achillesHalfW * 1.15;

    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(collarTop, -collarHalfW, collarH, collarHalfW * 2, 0.8);
    else ctx.rect(collarTop, -collarHalfW, collarH, collarHalfW * 2);
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.8;
    ctx.stroke();

  } else {
    // 5. SNEAKERSY MIEJSKIE - niski kołnierz pod kostką z widocznym ściągaczem sportowej skarpety
    const collarTop = l2 - 3.8 * muscle;
    const collarH = 3.8 * muscle;
    const collarHalfW = achillesHalfW * 1.15;

    // Ściągacz białej skarpety sportowej
    ctx.fillStyle = '#e4e4e7';
    ctx.fillRect(collarTop - 1.4, -collarHalfW * 0.95, 1.4, collarHalfW * 1.9);
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(collarTop - 1.4, -collarHalfW * 0.95, 1.4, collarHalfW * 1.9);

    // Niski wyściełany kołnierz sneakera
    ctx.fillStyle = collarGrad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(collarTop, -collarHalfW, collarH, collarHalfW * 2, 0.8);
    else ctx.rect(collarTop, -collarHalfW, collarH, collarHalfW * 2);
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.85;
    ctx.stroke();
  }

  // =========================================================================
  // NAKŁADKA EGZOSZKIELETOWA I WSKAŹNIK MOCY LED NA ŁYDCE (KLASA STRIKER)
  // Nakładka z buta wchodząca w górę łydki z pionowym wskaźnikiem energii
  // =========================================================================
  if (v.hasRocketBoots) {
    drawRocketBootsCalfGreave(ctx, isFrontLeg, muscle, l2, achillesHalfW, v, facing);
  } else if (v.hasKineticPistons) {
    drawKineticPistonCalfBrace(ctx, isFrontLeg, muscle, l2, achillesHalfW, v, facing, v.pistonCompression);
  }
}

/**
 * Renderuje przemysłowy siłownik pneumatyczny / hydrauliczny na tyle łydki i pięcie buta (Klasa Enforcer).
 * Tłok kompresuje się w czasie głębokiego siłowego przysiadu, a z bocznego zaworu ulatniają się obłoki pary!
 */
export function drawKineticPistonCalfBrace(ctx, isFrontLeg, muscle = 1.0, l2 = 26.0, achillesHalfW = 2.8, v = {}, facing = 1, compressionRatio = 0) {
  const strutTop = l2 - 14.2 * muscle;
  const strutH = 13.8 * muscle;
  const comp = Math.max(0, Math.min(1.0, (typeof compressionRatio === 'number') ? compressionRatio : (v.pistonCompression || 0)));

  ctx.save();

  // 1. TYŁ ŁYDKI - PANCERNA PŁYTA MONTAŻOWA ZE STALI WĘGLOWEJ
  const greaveW = achillesHalfW * 1.25;
  const greaveY = achillesHalfW * 0.18;
  ctx.fillStyle = isFrontLeg ? '#18181b' : '#09090b';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.85;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(strutTop, greaveY, strutH, greaveW, 1.2);
  else ctx.rect(strutTop, greaveY, strutH, greaveW);
  ctx.fill();
  ctx.stroke();

  // Klamry zaciskowe wokół łydki
  ctx.fillStyle = '#27272a';
  ctx.fillRect(strutTop + 1.2, -achillesHalfW * 0.95, 1.6, achillesHalfW * 2.1);
  ctx.fillRect(l2 - 3.2, -achillesHalfW * 0.95, 1.6, achillesHalfW * 2.1);
  ctx.fillStyle = '#71717a';
  ctx.fillRect(strutTop + 1.4, greaveY + 0.3, 1.0, 1.0);
  ctx.fillRect(l2 - 3.0, greaveY + 0.3, 1.0, 1.0);

  // 2. CYLINDER PNEUMATYCZNY (GÓRNA CZĘŚĆ SIŁOWNIKA)
  const cylX = strutTop + 2.2;
  const cylLen = 6.0 * muscle;
  const cylY = greaveY + greaveW * 0.22;
  const cylH = greaveW * 0.58;

  const cylGrad = ctx.createLinearGradient(cylX, cylY, cylX, cylY + cylH);
  cylGrad.addColorStop(0.0, '#52525b');
  cylGrad.addColorStop(0.5, '#71717a');
  cylGrad.addColorStop(1.0, '#27272a');
  ctx.fillStyle = cylGrad;
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(cylX, cylY, cylLen, cylH, 0.8);
  else ctx.rect(cylX, cylY, cylLen, cylH);
  ctx.fill();
  ctx.stroke();

  // 3. TŁOK HYDRAULICZNY / CHROMOWANY RDZEŃ (ŚCIŚNIĘTY PROPORCJONALNIE DO PRZYSIADU)
  const maxStroke = 4.6 * muscle;
  const currentStroke = maxStroke * (1.0 - comp * 0.65);
  const rodX = cylX + cylLen;
  const rodY = cylY + cylH * 0.22;
  const rodH = cylH * 0.56;

  ctx.fillStyle = '#f4f4f5';
  ctx.strokeStyle = '#71717a';
  ctx.lineWidth = 0.5;
  ctx.fillRect(rodX, rodY, currentStroke, rodH);
  ctx.strokeRect(rodX, rodY, currentStroke, rodH);

  // 4. PRZEMYSŁOWA SPRĘŻYNA SKOKOWA NAWINIĘTA NA TŁOK
  ctx.strokeStyle = '#d4d4d8';
  ctx.lineWidth = 0.9;
  const coils = 5;
  const coilSpacing = Math.max(0.6, currentStroke / coils);
  ctx.beginPath();
  for (let c = 0; c < coils; c++) {
    const cx = rodX + c * coilSpacing;
    ctx.moveTo(cx, rodY - 0.5);
    ctx.lineTo(cx + coilSpacing * 0.5, rodY + rodH + 0.5);
  }
  ctx.stroke();

  // 5. ZAWÓR UPUSTOWY CIŚNIENIA Z MOSIĄDZU
  const valveX = cylX + cylLen * 0.35;
  const valveY = cylY - 1.2;
  ctx.fillStyle = '#eab308';
  ctx.strokeStyle = '#713f12';
  ctx.lineWidth = 0.5;
  ctx.fillRect(valveX, valveY, 1.8, 1.2);
  ctx.strokeRect(valveX, valveY, 1.8, 1.2);

  // Głowica zaworu
  ctx.fillStyle = comp > 0.85 ? '#ef4444' : '#ca8a04';
  ctx.fillRect(valveX + 0.3, valveY - 0.7, 1.2, 0.7);

  ctx.restore();
}

/**
 * Renderuje opancerzoną nakładkę egzoszkieletową na łydce wraz z pionowym wskaźnikiem LED mocy
 */
export function drawRocketBootsCalfGreave(ctx, isFrontLeg, muscle = 1.0, l2 = 24.0, achillesHalfW = 2.4, v = {}, facing = 1) {
  const strutTop = l2 - 13.0 * muscle;
  const strutH = 12.8 * muscle;
  const flameCol = v.jetpackColor || '#00e5ff';
  const flamePal = getJetpackFlamePalette ? getJetpackFlamePalette(flameCol) : { base: flameCol, glow: flameCol };

  ctx.save();

  // 1. TYTANOWA SZYNOPŁYTA EGZOSZKIELETU NA TYLE ŁYDKI (ŚCIĘGNO ACHILLESA)
  ctx.fillStyle = isFrontLeg ? '#1f2937' : '#111827';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  const greaveW = achillesHalfW * 1.15;
  const greaveY = achillesHalfW * 0.15;
  if (ctx.roundRect) {
    ctx.roundRect(strutTop, greaveY, strutH, greaveW * 0.9, 1.2);
  } else {
    ctx.rect(strutTop, greaveY, strutH, greaveW * 0.9);
  }
  ctx.fill();
  ctx.stroke();

  // Krawędź wzmacniająca z fazowaniem
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(strutTop + 0.8, greaveY + greaveW * 0.9 - 0.5);
  ctx.lineTo(strutTop + strutH - 0.8, greaveY + greaveW * 0.9 - 0.5);
  ctx.stroke();

  // 2. METALOWE KLAMRY MOCUJĄCE DO ŁYDKI
  const strapCol = '#0f172a';
  const clampCol = '#94a3b8';
  // Górna klamra obejmująca całą łydkę
  ctx.fillStyle = strapCol;
  ctx.fillRect(strutTop + 1.6, -achillesHalfW * 0.95, 1.8, achillesHalfW * 2.2);
  ctx.fillStyle = clampCol;
  ctx.fillRect(strutTop + 1.9, greaveY + greaveW * 0.3, 1.2, 1.0);

  // Dolna klamra przy stawie skokowym
  ctx.fillStyle = strapCol;
  ctx.fillRect(l2 - 3.4, -achillesHalfW * 0.95, 1.8, achillesHalfW * 2.2);
  ctx.fillStyle = clampCol;
  ctx.fillRect(l2 - 3.1, greaveY + greaveW * 0.3, 1.2, 1.0);

  // Tłoczek siłownika hydraulicznego biegnący do dyszy buta na pięcie
  ctx.fillStyle = '#64748b';
  ctx.fillRect(l2 - 2.0, greaveY + greaveW * 0.25, 2.8, 1.2);
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(l2 - 2.0, greaveY + greaveW * 0.25, 2.8, 1.2);

  // 3. PIONOWY WSKAŹNIK MOCY LED (FUEL/POWER INDICATOR)
  // Wyfrezowane czarne korytko pod diody
  const gaugeX = strutTop + 3.8;
  const gaugeW = 6.8 * muscle;
  const gaugeY = greaveY + greaveW * 0.25;
  const gaugeH = 2.0;

  ctx.fillStyle = '#030712';
  ctx.fillRect(gaugeX, gaugeY, gaugeW, gaugeH);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(gaugeX, gaugeY, gaugeW, gaugeH);

  // Obliczenie poziomu paliwa / gotowości do Dashu
  const curFuel = (typeof v.jetFuel === 'number') ? v.jetFuel : 100;
  const maxFuel = (typeof v.jetMax === 'number' && v.jetMax > 0) ? v.jetMax : 100;
  const ratio = Math.max(0, Math.min(1.0, curFuel / maxFuel));

  // 4 segmenty LED wskaźnika energii
  // Segment 1 (>= 20%): podstawa
  // Segment 2 (>= 50%): GOTOWY 1 SUPER DASH!
  // Segment 3 (>= 75%): ładowanie drugiego
  // Segment 4 (>= 98%): GOTOWE 2 SUPER DASHE (PEŁNY BAK)!
  const segW = (gaugeW - 2.0) / 4;
  const isBlinkLow = (ratio < 0.50) && (Math.floor(performance.now() / 200) % 2 === 0);

  for (let i = 0; i < 4; i++) {
    const segX = gaugeX + 0.5 + i * (segW + 0.3);
    const reqRatio = (i + 1) * 0.25;
    const isLit = ratio >= reqRatio || (i === 0 && ratio > 0.08);

    if (isLit) {
      if (ratio < 0.50 && i === 0 && isBlinkLow) {
        // Ostrzeżenie: brak energii na kolejny Super Dash (miga na czerwono)
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 4;
      } else {
        // Pełna moc w kolorze płomienia jetpacka
        ctx.fillStyle = flamePal.base || flameCol;
        ctx.shadowColor = flamePal.glow || flameCol;
        ctx.shadowBlur = 4;
      }
    } else {
      ctx.fillStyle = '#1e293b'; // Wygaszona dioda
      ctx.shadowBlur = 0;
    }

    ctx.fillRect(segX, gaugeY + 0.35, segW - 0.3, gaugeH - 0.7);
  }

  ctx.restore();
}

/**
 * Renderuje stopę obuwia w układzie współrzędnych stopy (foot frame: ik.footX, ik.footY, effAnkle, facing)
 */
export function drawFootwear(ctx, style = 'combat_boots', color = '#18181b', isFrontLeg = true, muscle = 1.0, isSculpted = false, v = {}) {
  const bootLen = 10.6 * (isSculpted ? muscle * 0.95 : muscle);
  const pal = getShoesPalette(color || v.shoesColor || '#18181b');
  const bCol = color || v.shoesColor || '#18181b';

  const bootGrad = ctx.createLinearGradient(-4.5, -4.2, bootLen, 3.4);
  if (isFrontLeg) {
    bootGrad.addColorStop(0.0, pal.light);
    bootGrad.addColorStop(0.45, bCol);
    bootGrad.addColorStop(1.0, pal.dark);
  } else {
    bootGrad.addColorStop(0.0, pal.base);
    bootGrad.addColorStop(1.0, pal.dark);
  }

  if (style === 'combat_boots') {
    // =========================================================================
    // 1. CIĘŻKIE BUTY DESANTOWE (Lowa / Vibram Combat Boots)
    // =========================================================================
    ctx.beginPath();
    ctx.moveTo(-3.6, -3.8);
    ctx.quadraticCurveTo(-4.4, -1.0, -4.4, 2.5);
    ctx.lineTo(bootLen - 0.6, 2.5);
    ctx.quadraticCurveTo(bootLen + 1.2, 2.2, bootLen + 0.8, 0.3);
    ctx.quadraticCurveTo(bootLen + 0.2, -1.3, bootLen - 2.6, -1.5);
    ctx.quadraticCurveTo(3.4, -1.8, 2.2, -3.8);
    ctx.lineTo(-3.6, -3.8);
    ctx.closePath();
    ctx.fillStyle = bootGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Przeszycia noska i pięty
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-4.2, 0.2); ctx.quadraticCurveTo(-1.5, 0.4, -1.0, 2.4);
    ctx.moveTo(bootLen - 3.0, -1.4); ctx.quadraticCurveTo(bootLen - 2.2, 0.5, bootLen - 2.6, 2.4);
    ctx.stroke();

    // Sznurowanie
    if (isFrontLeg) {
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(1.2, -3.0); ctx.lineTo(2.4, -2.8);
      ctx.moveTo(1.8, -2.0); ctx.lineTo(3.0, -1.8);
      ctx.moveTo(2.6, -1.1); ctx.lineTo(3.8, -0.9);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(bootLen - 2.0, -0.8);
      ctx.quadraticCurveTo(bootLen + 0.1, -0.4, bootLen + 0.2, 0.8);
      ctx.stroke();
    }

    // Gruba podeszwa Vibram z zębami
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(-4.5, 2.3);
    ctx.lineTo(bootLen + 0.8, 2.3);
    ctx.lineTo(bootLen + 0.5, 4.2);
    ctx.lineTo(2.2, 4.2);
    ctx.lineTo(1.8, 3.6);
    ctx.lineTo(-0.4, 3.6);
    ctx.lineTo(-0.8, 4.3);
    ctx.lineTo(-4.4, 4.3);
    ctx.closePath();
    ctx.fill();

    // Ząbki protektora
    ctx.fillStyle = '#000000';
    for (let lx = -4.0; lx <= -1.4; lx += 1.3) ctx.fillRect(lx, 4.0, 0.9, 0.8);
    for (let lx = 2.6; lx <= bootLen - 0.8; lx += 1.6) ctx.fillRect(lx, 3.9, 1.0, 0.8);

  } else if (style === 'sneakers') {
    // =========================================================================
    // 2. NISKIE SNEAKERSY (Vans Defcon / Altama Maritime Trainers)
    // =========================================================================
    ctx.beginPath();
    ctx.moveTo(-3.4, -2.2);
    ctx.quadraticCurveTo(-4.2, 0.0, -4.0, 2.4);
    ctx.lineTo(bootLen - 0.4, 2.4);
    ctx.quadraticCurveTo(bootLen + 1.0, 2.2, bootLen + 0.6, 0.4);
    ctx.quadraticCurveTo(bootLen + 0.0, -0.9, bootLen - 2.4, -1.1);
    ctx.quadraticCurveTo(2.8, -1.4, 1.8, -2.4);
    ctx.lineTo(-3.4, -2.2);
    ctx.closePath();
    ctx.fillStyle = bootGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // Boczny pasek w stylu skate (Wave Stripe / Chevron)
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-2.5, 0.4);
    ctx.quadraticCurveTo(1.5, 0.0, bootLen - 3.8, 1.6);
    ctx.stroke();

    // Sportowe płaskie sznurowadła
    if (isFrontLeg) {
      ctx.strokeStyle = '#e4e4e7';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(1.2, -1.8); ctx.lineTo(2.4, -1.5);
      ctx.moveTo(2.2, -1.0); ctx.lineTo(3.4, -0.7);
      ctx.moveTo(3.2, -0.2); ctx.lineTo(4.4, 0.1);
      ctx.stroke();
    }

    // Płaska podeszwa miejska z gumowym otokiem
    ctx.fillStyle = '#e4e4e7';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-4.2, 2.2, bootLen + 5.0, 2.0, 0.5);
    else ctx.rect(-4.2, 2.2, bootLen + 5.0, 2.0);
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Ciemny pasek pinstripe na podeszwie
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-4.0, 3.1);
    ctx.lineTo(bootLen + 0.6, 3.1);
    ctx.stroke();

  } else if (style === 'cleats') {
    // =========================================================================
    // 3. KORKI PIŁKARSKIE (Predator Tactical Football Cleats)
    // =========================================================================
    ctx.beginPath();
    ctx.moveTo(-3.4, -2.4);
    ctx.quadraticCurveTo(-4.0, 0.2, -3.8, 2.5);
    ctx.lineTo(bootLen + 0.2, 2.5);
    ctx.quadraticCurveTo(bootLen + 1.4, 2.0, bootLen + 0.8, 0.2);
    ctx.quadraticCurveTo(bootLen - 0.5, -1.0, bootLen - 2.8, -1.2);
    ctx.quadraticCurveTo(2.4, -1.6, 1.6, -2.6);
    ctx.lineTo(-3.4, -2.4);
    ctx.closePath();
    ctx.fillStyle = bootGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // Żebra strefy uderzenia piłki na nosku (Rubber Strike Fins)
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(bootLen - 4.6, -0.8); ctx.lineTo(bootLen - 3.4, 0.4);
    ctx.moveTo(bootLen - 3.2, -0.4); ctx.lineTo(bootLen - 2.0, 0.8);
    ctx.moveTo(bootLen - 1.8, 0.0); ctx.lineTo(bootLen - 0.6, 1.2);
    ctx.stroke();

    // Dynamiczny błysk boczny (Speed Flash)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-2.0, 1.2);
    ctx.quadraticCurveTo(2.0, 0.2, bootLen - 3.0, 2.0);
    ctx.stroke();

    // Cienka płyta podeszwy (Soleplate)
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-4.0, 2.4, bootLen + 4.6, 0.9);

    // Ostre kołki / korki do gry w piłkę (Cleat Studs)
    ctx.fillStyle = '#71717a';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.6;

    const drawStud = (sx) => {
      ctx.beginPath();
      ctx.moveTo(sx - 0.5, 3.2);
      ctx.lineTo(sx + 0.5, 3.2);
      ctx.lineTo(sx + 0.3, 4.6);
      ctx.lineTo(sx - 0.3, 4.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    drawStud(-3.2);
    drawStud(-1.4);
    drawStud(bootLen - 4.2);
    drawStud(bootLen - 1.8);

  } else if (style === 'hitops') {
    // =========================================================================
    // 4. WYSOKIE TRAMPKI HI-TOP (Chuck Taylor / Retro Action Hi-Tops)
    // =========================================================================
    ctx.beginPath();
    ctx.moveTo(-3.6, -3.2);
    ctx.quadraticCurveTo(-4.2, -0.6, -4.2, 2.4);
    ctx.lineTo(bootLen - 0.5, 2.4);
    ctx.quadraticCurveTo(bootLen + 1.1, 2.1, bootLen + 0.7, 0.4);
    ctx.quadraticCurveTo(bootLen + 0.1, -1.0, bootLen - 2.5, -1.2);
    ctx.quadraticCurveTo(3.0, -1.6, 2.0, -3.2);
    ctx.lineTo(-3.6, -3.2);
    ctx.closePath();
    ctx.fillStyle = bootGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    // Gumowy biały nosek z przodu (Rubber Toe Cap)
    ctx.fillStyle = '#e4e4e7';
    ctx.beginPath();
    ctx.moveTo(bootLen - 3.0, -0.8);
    ctx.quadraticCurveTo(bootLen + 0.2, -0.6, bootLen + 0.7, 0.4);
    ctx.lineTo(bootLen + 0.5, 2.4);
    ctx.lineTo(bootLen - 3.0, 2.4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Sznurowanie w białych oczkach
    if (isFrontLeg) {
      ctx.strokeStyle = '#e4e4e7';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(1.2, -2.6); ctx.lineTo(2.4, -2.3);
      ctx.moveTo(2.0, -1.8); ctx.lineTo(3.2, -1.5);
      ctx.moveTo(2.8, -1.0); ctx.lineTo(4.0, -0.7);
      ctx.moveTo(3.8, -0.2); ctx.lineTo(5.0, 0.1);
      ctx.stroke();
    }

    // Gruba wulkanizowana biała podeszwa z paskiem
    ctx.fillStyle = '#e4e4e7';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-4.4, 2.3, bootLen + 5.2, 2.1, 0.5);
    else ctx.rect(-4.4, 2.3, bootLen + 5.2, 2.1);
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Pasek pinstripe
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.moveTo(-4.2, 3.2);
    ctx.lineTo(bootLen + 0.6, 3.2);
    ctx.stroke();

  } else {
    // =========================================================================
    // 5. WYSOKIE GLANY Z KLAMRAMI (High Biker / Combat Jump Boots)
    // =========================================================================
    ctx.beginPath();
    ctx.moveTo(-3.8, -3.8);
    ctx.quadraticCurveTo(-4.5, -1.2, -4.5, 2.5);
    ctx.lineTo(bootLen - 0.4, 2.5);
    ctx.quadraticCurveTo(bootLen + 1.2, 2.2, bootLen + 0.8, 0.2);
    ctx.quadraticCurveTo(bootLen + 0.2, -1.4, bootLen - 2.6, -1.6);
    ctx.quadraticCurveTo(3.2, -1.9, 2.2, -3.8);
    ctx.lineTo(-3.8, -3.8);
    ctx.closePath();
    ctx.fillStyle = bootGrad;
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1.05;
    ctx.stroke();

    // Stalowe okucie noska (Steel Toe Cap)
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.moveTo(bootLen - 2.8, -0.6);
    ctx.quadraticCurveTo(bootLen + 0.3, -0.3, bootLen + 0.8, 0.2);
    ctx.lineTo(bootLen + 0.5, 2.5);
    ctx.lineTo(bootLen - 2.8, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.75;
    ctx.stroke();

    // Poprzeczny skórzany pas z metaliczną klamrą na podbiciu
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(0.5, -1.4);
    ctx.lineTo(4.2, 1.8);
    ctx.lineTo(3.2, 2.8);
    ctx.lineTo(-0.5, -0.4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.7;
    ctx.stroke();

    // Srebrna klamra
    ctx.fillStyle = '#a1a1aa';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(1.4, 0.2, 2.2, 2.2, 0.4);
    else ctx.rect(1.4, 0.2, 2.2, 2.2);
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Gruba pancerna podeszwa platformowa z głębokim bieżnikiem
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(-4.6, 2.3);
    ctx.lineTo(bootLen + 0.8, 2.3);
    ctx.lineTo(bootLen + 0.5, 4.4);
    ctx.lineTo(2.2, 4.4);
    ctx.lineTo(1.8, 3.6);
    ctx.lineTo(-0.4, 3.6);
    ctx.lineTo(-0.8, 4.5);
    ctx.lineTo(-4.5, 4.5);
    ctx.closePath();
    ctx.fill();

    // Masywne nacięcia bieżnika
    ctx.fillStyle = '#000000';
    for (let lx = -4.2; lx <= -1.2; lx += 1.4) ctx.fillRect(lx, 4.1, 1.0, 0.9);
    for (let lx = 2.4; lx <= bootLen - 0.6; lx += 1.5) ctx.fillRect(lx, 4.0, 1.0, 0.9);
  }

  // =========================================================================
  // DYSZA BUTA ODRZUTOWEGO (ROCKET BOOTS DLA KLASY STRIKER)
  // =========================================================================
  if (v.hasRocketBoots) {
    const thrusterColor = v.jetpackColor || '#00e5ff';
    ctx.save();
    // Metalowa obudowa dyszy na pięcie
    ctx.fillStyle = '#27272a';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.rect(-5.8, -0.4, 1.8, 2.6);
    ctx.fill();
    ctx.stroke();

    // Wewnętrzny stożek wylotowy
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(-5.8, -0.2);
    ctx.lineTo(-7.2, -0.7);
    ctx.lineTo(-7.2, 2.5);
    ctx.lineTo(-5.8, 2.0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Świecący rdzeń plazmowy
    ctx.fillStyle = thrusterColor;
    ctx.shadowColor = thrusterColor;
    ctx.shadowBlur = 6;
    ctx.fillRect(-7.0, 0.2, 1.0, 1.4);
    ctx.shadowBlur = 0;

    // Dynamiczny płomień odrzutowy przy locie / zrywie rakietowym
    const isThrusting = !!(v.isJetpacking || v.bootsDashing || v.bootsCharging);
    if (isThrusting) {
      const flamePal = getJetpackFlamePalette(thrusterColor);
      const isDash = !!v.bootsDashing;
      const plumeLen = isDash ? 38.0 : (v.bootsCharging ? 20.0 : 28.0);
      drawJetpackThrustPlume(
        ctx,
        -7.2,
        0.9,
        3.4,
        Math.PI, // Kąt w tył za piętę buta
        isDash ? 1.4 : 1.0,
        flamePal,
        { length: plumeLen }
      );
    }
    ctx.restore();
  }
}

/**
 * Renderuje podgląd buta na kafelku w Kreatorze Postaci (68x68 px)
 */
export function drawShoesPreview(
  ctx,
  canvasW,
  canvasH,
  styleId = 'combat_boots',
  color = '#18181b',
  visuals = {}
) {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvasW, canvasH);

  const pal = getShoesPalette(color || '#18181b');
  const bCol = color || '#18181b';

  ctx.save();
  // Centrowanie i dopasowanie skali w okienku kafelka
  ctx.translate(canvasW * 0.45, canvasH * 0.54);
  const scale = Math.min(canvasW, canvasH) / 38.0;
  ctx.scale(scale, scale);

  const shoeGrad = ctx.createLinearGradient(-5.0, -10.0, 10.0, 6.0);
  shoeGrad.addColorStop(0.0, pal.light);
  shoeGrad.addColorStop(0.45, bCol);
  shoeGrad.addColorStop(1.0, pal.dark);

  if (styleId === 'combat_boots') {
    // 1. Ciężkie Buty Desantowe
    // Cholewka
    ctx.fillStyle = shoeGrad;
    ctx.beginPath();
    ctx.moveTo(-3.4, -9.0); ctx.lineTo(1.8, -9.0); ctx.lineTo(2.4, -2.5); ctx.lineTo(-4.0, -2.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#09090b'; ctx.lineWidth = 1.0; ctx.stroke();

    // Wałek kołnierza
    ctx.fillStyle = '#27272a';
    ctx.fillRect(-3.6, -9.8, 5.6, 1.4);
    ctx.strokeStyle = '#09090b'; ctx.lineWidth = 0.7; ctx.strokeRect(-3.6, -9.8, 5.6, 1.4);

    // Stopa
    ctx.beginPath();
    ctx.moveTo(-4.0, -2.5);
    ctx.lineTo(2.4, -2.5);
    ctx.quadraticCurveTo(4.5, -1.0, 8.2, 3.2);
    ctx.lineTo(8.2, 4.8);
    ctx.lineTo(-4.2, 4.8);
    ctx.quadraticCurveTo(-4.5, 2.2, -4.0, -2.5);
    ctx.closePath();
    ctx.fillStyle = shoeGrad; ctx.fill();
    ctx.strokeStyle = '#09090b'; ctx.lineWidth = 1.0; ctx.stroke();

    // Sznurowanie
    ctx.fillStyle = '#71717a';
    ctx.fillRect(1.5, -6.5, 0.9, 0.7);
    ctx.fillRect(1.8, -4.2, 0.9, 0.7);
    ctx.fillRect(2.2, -2.0, 0.9, 0.7);
    ctx.fillRect(3.4, 0.2, 0.9, 0.7);

    // Podeszwa z wycięciem
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(-4.6, 4.8); ctx.lineTo(8.4, 4.8); ctx.lineTo(8.0, 7.4); ctx.lineTo(3.0, 7.4);
    ctx.lineTo(2.4, 6.4); ctx.lineTo(-0.2, 6.4); ctx.lineTo(-0.6, 7.4); ctx.lineTo(-4.6, 7.4);
    ctx.closePath(); ctx.fill();

    // Ząbki
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-3.5, 6.8); ctx.lineTo(-3.5, 8.0);
    ctx.moveTo(-1.8, 6.8); ctx.lineTo(-1.8, 8.0);
    ctx.moveTo(4.0, 6.8); ctx.lineTo(4.0, 8.0);
    ctx.moveTo(6.0, 6.8); ctx.lineTo(6.0, 8.0);
    ctx.stroke();

  } else if (styleId === 'sneakers') {
    // 2. Niskie Sneakersy
    // Skarpetka
    ctx.fillStyle = '#e4e4e7';
    ctx.fillRect(-2.8, -5.5, 4.2, 1.8);
    ctx.strokeStyle = '#71717a'; ctx.lineWidth = 0.6; ctx.strokeRect(-2.8, -5.5, 4.2, 1.8);

    // Niski kołnierz
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.moveTo(-3.2, -4.0); ctx.lineTo(1.4, -4.0); ctx.lineTo(2.0, -1.0); ctx.lineTo(-3.6, -1.0);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#09090b'; ctx.lineWidth = 0.8; ctx.stroke();

    // Stopa
    ctx.beginPath();
    ctx.moveTo(-3.6, -1.0);
    ctx.lineTo(1.8, -1.0);
    ctx.quadraticCurveTo(4.2, 0.6, 8.0, 3.6);
    ctx.lineTo(8.0, 5.2);
    ctx.lineTo(-3.8, 5.2);
    ctx.quadraticCurveTo(-4.2, 2.8, -3.6, -1.0);
    ctx.closePath();
    ctx.fillStyle = shoeGrad; ctx.fill();
    ctx.strokeStyle = '#09090b'; ctx.lineWidth = 0.95; ctx.stroke();

    // Fala / pasek boczny
    ctx.strokeStyle = pal.accent; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-2.6, 2.5); ctx.quadraticCurveTo(0.0, 1.8, 5.8, 4.2);
    ctx.stroke();

    // Sznurowanie sportowe
    ctx.strokeStyle = '#e4e4e7'; ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(1.6, -0.6); ctx.lineTo(2.8, -0.2);
    ctx.moveTo(2.4, 0.6); ctx.lineTo(3.8, 1.0);
    ctx.moveTo(3.6, 1.8); ctx.lineTo(5.0, 2.2);
    ctx.stroke();

    // Płaska podeszwa miejska
    ctx.fillStyle = '#e4e4e7';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-4.0, 5.0, 12.2, 2.0, 0.5);
    else ctx.rect(-4.0, 5.0, 12.2, 2.0);
    ctx.fill();
    ctx.strokeStyle = '#09090b'; ctx.lineWidth = 0.8; ctx.stroke();

    // Pinstripe
    ctx.strokeStyle = '#18181b'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(-3.8, 5.8); ctx.lineTo(8.0, 5.8); ctx.stroke();

  } else if (styleId === 'cleats') {
    // 3. Korki Bojowe
    // Kołnierz skarpety
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(-3.0, -5.0); ctx.lineTo(1.2, -5.0); ctx.lineTo(1.8, -1.8); ctx.lineTo(-3.4, -1.8);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#09090b'; ctx.lineWidth = 0.8; ctx.stroke();

    // Opływowa stopa
    ctx.beginPath();
    ctx.moveTo(-3.4, -1.8);
    ctx.lineTo(1.8, -1.8);
    ctx.quadraticCurveTo(4.6, -0.2, 8.6, 3.8);
    ctx.lineTo(8.6, 5.0);
    ctx.lineTo(-3.6, 5.0);
    ctx.quadraticCurveTo(-4.0, 2.5, -3.4, -1.8);
    ctx.closePath();
    ctx.fillStyle = shoeGrad; ctx.fill();
    ctx.strokeStyle = '#09090b'; ctx.lineWidth = 0.95; ctx.stroke();

    // Żebra strefy uderzenia Predator
    ctx.strokeStyle = pal.accent; ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(3.2, 0.2); ctx.lineTo(4.4, 1.2);
    ctx.moveTo(4.2, 1.2); ctx.lineTo(5.4, 2.2);
    ctx.moveTo(5.2, 2.2); ctx.lineTo(6.4, 3.2);
    ctx.stroke();

    // Błysk prędkości
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(-2.0, 3.0); ctx.quadraticCurveTo(1.5, 2.0, 6.8, 4.2); ctx.stroke();

    // Płyta podeszwy
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-3.8, 5.0, 12.4, 0.8);

    // Kołki / korki piłkarskie
    ctx.fillStyle = '#71717a';
    ctx.strokeStyle = '#09090b'; ctx.lineWidth = 0.55;
    const drawStud = (sx) => {
      ctx.beginPath();
      ctx.moveTo(sx - 0.4, 5.8); ctx.lineTo(sx + 0.4, 5.8);
      ctx.lineTo(sx + 0.2, 7.8); ctx.lineTo(sx - 0.2, 7.8);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    };
    drawStud(-2.8); drawStud(-0.8); drawStud(4.6); drawStud(6.8);

  } else if (styleId === 'hitops') {
    // 4. Wysokie Trampki Hi-Top
    // Wysoka cholewka
    ctx.fillStyle = shoeGrad;
    ctx.beginPath();
    ctx.moveTo(-3.4, -10.0); ctx.lineTo(1.8, -10.0); ctx.lineTo(2.2, -2.0); ctx.lineTo(-3.8, -2.0);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#09090b'; ctx.lineWidth = 0.95; ctx.stroke();

    // Okrągła naszywka All-Star
    ctx.fillStyle = '#e4e4e7';
    ctx.beginPath(); ctx.arc(-0.8, -6.5, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#09090b'; ctx.lineWidth = 0.5; ctx.stroke();
    ctx.fillStyle = '#991b1b';
    ctx.beginPath(); ctx.arc(-0.8, -6.5, 0.6, 0, Math.PI * 2); ctx.fill();

    // Stopa
    ctx.beginPath();
    ctx.moveTo(-3.8, -2.0);
    ctx.lineTo(2.2, -2.0);
    ctx.quadraticCurveTo(4.4, -0.6, 8.0, 3.4);
    ctx.lineTo(8.0, 4.8);
    ctx.lineTo(-4.0, 4.8);
    ctx.quadraticCurveTo(-4.4, 2.5, -3.8, -2.0);
    ctx.closePath();
    ctx.fillStyle = shoeGrad; ctx.fill();
    ctx.strokeStyle = '#09090b'; ctx.lineWidth = 0.95; ctx.stroke();

    // Biały gumowy nosek
    ctx.fillStyle = '#e4e4e7';
    ctx.beginPath();
    ctx.moveTo(5.4, 1.8);
    ctx.quadraticCurveTo(7.6, 2.8, 8.0, 3.6);
    ctx.lineTo(8.0, 4.8); ctx.lineTo(5.4, 4.8);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#09090b'; ctx.lineWidth = 0.75; ctx.stroke();

    // Wysokie sznurowanie
    ctx.strokeStyle = '#e4e4e7'; ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(1.4, -8.2); ctx.lineTo(2.4, -8.0);
    ctx.moveTo(1.6, -6.0); ctx.lineTo(2.6, -5.8);
    ctx.moveTo(1.8, -3.8); ctx.lineTo(2.8, -3.6);
    ctx.moveTo(2.4, -1.6); ctx.lineTo(3.6, -1.2);
    ctx.moveTo(3.4, 0.6); ctx.lineTo(4.6, 1.0);
    ctx.stroke();

    // Gruba wulkanizowana biała podeszwa z paskiem
    ctx.fillStyle = '#e4e4e7';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-4.2, 4.8, 12.4, 2.2, 0.4);
    else ctx.rect(-4.2, 4.8, 12.4, 2.2);
    ctx.fill();
    ctx.strokeStyle = '#09090b'; ctx.lineWidth = 0.8; ctx.stroke();

    ctx.strokeStyle = '#18181b'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(-4.0, 5.8); ctx.lineTo(8.0, 5.8); ctx.stroke();

  } else {
    // 5. Wysokie Glany z Klamrami
    // Bardzo wysoka cholewa
    ctx.fillStyle = shoeGrad;
    ctx.beginPath();
    ctx.moveTo(-3.6, -12.5); ctx.lineTo(2.0, -12.5); ctx.lineTo(2.4, -2.5); ctx.lineTo(-4.2, -2.5);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#09090b'; ctx.lineWidth = 1.05; ctx.stroke();

    // Pasy z klamrami
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-3.8, -11.0, 6.0, 1.5);
    ctx.fillRect(-4.0, -7.5, 6.2, 1.5);

    // Klamry
    ctx.fillStyle = '#a1a1aa';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(0.8, -11.2, 1.8, 1.9, 0.3);
      ctx.roundRect(1.0, -7.7, 1.8, 1.9, 0.3);
    } else {
      ctx.rect(0.8, -11.2, 1.8, 1.9);
      ctx.rect(1.0, -7.7, 1.8, 1.9);
    }
    ctx.fill();
    ctx.strokeStyle = '#09090b'; ctx.lineWidth = 0.6; ctx.stroke();

    // Stopa
    ctx.beginPath();
    ctx.moveTo(-4.2, -2.5);
    ctx.lineTo(2.4, -2.5);
    ctx.quadraticCurveTo(4.6, -1.0, 8.2, 3.2);
    ctx.lineTo(8.2, 4.6);
    ctx.lineTo(-4.4, 4.6);
    ctx.quadraticCurveTo(-4.6, 2.2, -4.2, -2.5);
    ctx.closePath();
    ctx.fillStyle = shoeGrad; ctx.fill();
    ctx.strokeStyle = '#09090b'; ctx.lineWidth = 1.05; ctx.stroke();

    // Pas podbicia z klamrą
    ctx.strokeStyle = '#09090b'; ctx.lineWidth = 2.0; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-2.0, 0.5); ctx.lineTo(4.5, 2.8); ctx.stroke();

    ctx.fillStyle = '#a1a1aa';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(1.2, 0.8, 1.8, 1.8, 0.3);
    else ctx.rect(1.2, 0.8, 1.8, 1.8);
    ctx.fill();
    ctx.strokeStyle = '#09090b'; ctx.lineWidth = 0.55; ctx.stroke();

    // Stalowe okucie noska
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.moveTo(5.8, 1.8); ctx.quadraticCurveTo(8.2, 3.8, 8.2, 4.6); ctx.lineTo(5.8, 4.6);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#09090b'; ctx.lineWidth = 0.7; ctx.stroke();

    // Masywna podeszwa commando z obcasem
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(-4.8, 4.6); ctx.lineTo(8.4, 4.6); ctx.lineTo(8.0, 7.6); ctx.lineTo(2.8, 7.6);
    ctx.lineTo(2.2, 6.4); ctx.lineTo(-0.4, 6.4); ctx.lineTo(-0.8, 7.6); ctx.lineTo(-4.8, 7.6);
    ctx.closePath(); ctx.fill();

    // Głęboki bieżnik
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-3.8, 7.0); ctx.lineTo(-3.8, 8.4);
    ctx.moveTo(-2.0, 7.0); ctx.lineTo(-2.0, 8.4);
    ctx.moveTo(3.8, 7.0); ctx.lineTo(3.8, 8.4);
    ctx.moveTo(5.8, 7.0); ctx.lineTo(5.8, 8.4);
    ctx.moveTo(7.4, 7.0); ctx.lineTo(7.4, 8.4);
    ctx.stroke();
  }

  ctx.restore();
}
