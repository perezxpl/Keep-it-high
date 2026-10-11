// =========================================================================
// ARENAS/ARENA2/SEWERPIPES.JS - KOLEKTORY ŚCIEKOWE I WYCIEKI W TLE
// Masywne pionowe rury ściekowe w ciemnej przestrzeni po bokach wentylatora
// Cykliczne wycieki toksycznego kwasu, piana i bąble w miejscu uderzenia
// 100% symetria osiowa (X = 2000), 0 alokacji GC w pętli renderującej
// =========================================================================

import { getAcidSurfaceY, ACID_SURGE_SYSTEM } from './state.js';

/**
 * Konfiguracja 3 symetrycznych par potężnych kolektorów ściekowych (łącznie 6 rur)
 * Oś symetrii: X = 2000
 */
export const ARENA_2_SEWER_PIPES = [
  // 1. Para przyturbinowa (tuż obok wentylatora: |X - 2000| = 580)
  {
    id: 'sewer_inner_left',
    x: 1420,
    width: 50,
    topY: 0,
    nozzleY: 570,
    cycleDuration: 16.0,
    pourDuration: 4.8,
    phase: 0.0,
    streamWidth: 16,
    label: 'SEW-01A'
  },
  {
    id: 'sewer_inner_right',
    x: 2580,
    width: 50,
    topY: 0,
    nozzleY: 570,
    cycleDuration: 16.0,
    pourDuration: 4.8,
    phase: 0.0,
    streamWidth: 16,
    label: 'SEW-01B'
  },

  // 2. Para centralno-szczelinowa (w ciemnej luce między rampami: |X - 2000| = 880)
  {
    id: 'sewer_mid_left',
    x: 1120,
    width: 58,
    topY: 0,
    nozzleY: 660,
    cycleDuration: 17.0,
    pourDuration: 5.2,
    phase: 5.5,
    streamWidth: 20,
    label: 'COL-02A'
  },
  {
    id: 'sewer_mid_right',
    x: 2880,
    width: 58,
    topY: 0,
    nozzleY: 660,
    cycleDuration: 17.0,
    pourDuration: 5.2,
    phase: 5.5,
    streamWidth: 20,
    label: 'COL-02B'
  },

  // 3. Para bastionowa (pod skrzydłami bastionów zewnętrznych: |X - 2000| = 1300)
  {
    id: 'sewer_outer_left',
    x: 700,
    width: 54,
    topY: 0,
    nozzleY: 760,
    cycleDuration: 18.0,
    pourDuration: 4.6,
    phase: 11.0,
    streamWidth: 18,
    label: 'DRN-03A'
  },
  {
    id: 'sewer_outer_right',
    x: 3300,
    width: 54,
    topY: 0,
    nozzleY: 760,
    cycleDuration: 18.0,
    pourDuration: 4.6,
    phase: 11.0,
    streamWidth: 18,
    label: 'DRN-03B'
  }
];

/**
 * Główna funkcja renderująca kolektory ściekowe i wycieki w tle
 */
export function drawSewerPipes(ctx, time) {
  if (!ctx) return;
  ctx.save();
  ctx.shadowBlur = 0;

  for (let i = 0; i < ARENA_2_SEWER_PIPES.length; i++) {
    const pipe = ARENA_2_SEWER_PIPES[i];
    drawSingleSewerPipe(ctx, pipe, time);
  }

  ctx.restore();
}

/**
 * Rysuje pojedynczy kolektor ściekowy wraz z dynamicznym wyciekiem
 */
function drawSingleSewerPipe(ctx, pipe, time) {
  const px = pipe.x;
  const pw = pipe.width;
  const halfW = pw * 0.5;
  const nozzleY = pipe.nozzleY;
  const topY = pipe.topY || 0;

  // -------------------------------------------------------------------------
  // 1. MASYWNY CYLINDER RURY (CIEMNOSZARY INDUSTRIALNY KORPUS Z METALICZNYM CIENIEM)
  // -------------------------------------------------------------------------
  const pipeGrad = ctx.createLinearGradient(px - halfW, 0, px + halfW, 0);
  pipeGrad.addColorStop(0.00, '#070b10'); // głęboki cień krawędzi
  pipeGrad.addColorStop(0.18, '#141d27');
  pipeGrad.addColorStop(0.48, '#243242'); // oświetlony brzeg cylindra
  pipeGrad.addColorStop(0.78, '#141c26');
  pipeGrad.addColorStop(1.00, '#070b10');
  ctx.fillStyle = pipeGrad;
  ctx.fillRect(px - halfW, topY, pw, nozzleY - topY);

  ctx.strokeStyle = '#0a0f16';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(px - halfW, topY, pw, nozzleY - topY);

  // Wewnętrzny jaśniejszy pasek odblasku stali
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(px - halfW * 0.15, topY);
  ctx.lineTo(px - halfW * 0.15, nozzleY);
  ctx.stroke();

  // -------------------------------------------------------------------------
  // 2. KOŁNIERZE ŁĄCZENIOWE I ŚRUBY MONTAŻOWE (FLANGE JOINTS CO 95 PX)
  // -------------------------------------------------------------------------
  const flangeH = 14;
  const flangeExtra = 8;
  for (let fy = topY + 70; fy < nozzleY - 30; fy += 95) {
    const fx = px - halfW - flangeExtra * 0.5;
    const fw = pw + flangeExtra;

    const fGrad = ctx.createLinearGradient(fx, 0, fx + fw, 0);
    fGrad.addColorStop(0.0, '#0a0f16');
    fGrad.addColorStop(0.5, '#2f3e50');
    fGrad.addColorStop(1.0, '#0a0f16');
    ctx.fillStyle = fGrad;
    ctx.fillRect(fx, fy, fw, flangeH);

    ctx.strokeStyle = '#05070a';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(fx, fy, fw, flangeH);

    // Stalowe śruby na kołnierzu
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(fx + 4, fy + flangeH * 0.5, 1.8, 0, Math.PI * 2);
    ctx.arc(fx + fw - 4, fy + flangeH * 0.5, 1.8, 0, Math.PI * 2);
    ctx.arc(px, fy + flangeH * 0.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Uchwyt ścienny (Heavy Wall Bracket mocujący rurę do bunkra w tle)
    ctx.fillStyle = '#0a0f16';
    ctx.fillRect(fx - 12, fy + 2, 12, flangeH - 4);
    ctx.fillRect(fx + fw, fy + 2, 12, flangeH - 4);
  }

  // -------------------------------------------------------------------------
  // 3. ZACIEKI CHEMICZNE I KOROZJA (TOXIC STAIN SLIME ON PIPE CASING)
  // -------------------------------------------------------------------------
  ctx.save();
  ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
  ctx.beginPath();
  ctx.moveTo(px - 6, nozzleY - 140);
  ctx.lineTo(px + 4, nozzleY - 140);
  ctx.lineTo(px + 8, nozzleY);
  ctx.lineTo(px - 10, nozzleY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
  ctx.beginPath();
  ctx.moveTo(px - 2, nozzleY - 70);
  ctx.lineTo(px + 3, nozzleY - 70);
  ctx.lineTo(px + 5, nozzleY);
  ctx.lineTo(px - 4, nozzleY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // -------------------------------------------------------------------------
  // 4. KIELICH WYLOTOWY (HEAVY SEWER DISCHARGE NOZZLE / SPOUT)
  // -------------------------------------------------------------------------
  const bellH = 22;
  const bellExtra = 14;
  const bellX = px - halfW - bellExtra * 0.5;
  const bellW = pw + bellExtra;

  // Trapezowy kołnierz rozszerzający się ku wylotowi
  const nGrad = ctx.createLinearGradient(bellX, 0, bellX + bellW, 0);
  nGrad.addColorStop(0.0, '#06090e');
  nGrad.addColorStop(0.2, '#1a2533');
  nGrad.addColorStop(0.5, '#334458');
  nGrad.addColorStop(0.8, '#1a2533');
  nGrad.addColorStop(1.0, '#06090e');
  ctx.fillStyle = nGrad;

  ctx.beginPath();
  ctx.moveTo(px - halfW, nozzleY - bellH);
  ctx.lineTo(px + halfW, nozzleY - bellH);
  ctx.lineTo(bellX + bellW, nozzleY);
  ctx.lineTo(bellX, nozzleY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#05070a';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Wieniec nitów wylewowych
  ctx.fillStyle = '#94a3b8';
  for (let bx = bellX + 4; bx <= bellX + bellW - 4; bx += 8) {
    ctx.fillRect(bx, nozzleY - 4, 2, 2);
  }

  // Wewnętrzny otwór wylotu (Czeluść rury)
  ctx.fillStyle = '#020406';
  ctx.beginPath();
  ctx.ellipse(px, nozzleY, bellW * 0.45, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Tabliczka identyfikacyjna na kielichu
  ctx.save();
  ctx.font = '900 8px monospace';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText(pipe.label, px, nozzleY - 9);
  ctx.restore();

  // -------------------------------------------------------------------------
  // 5. CYKL WYCIECIEK I ZRZUTU TOKSYCZNEGO ŚCIEKU DO KWASU
  // -------------------------------------------------------------------------
  const cycleTime = ((time + pipe.phase) % pipe.cycleDuration + pipe.cycleDuration) % pipe.cycleDuration;
  const isPouring = cycleTime < pipe.pourDuration;
  const surfaceY = getAcidSurfaceY(px, time);

  if (isPouring) {
    // FAZA GŁÓWNEGO ZRZUTU: CIĄGŁA STRÓŻA / WODOSPAD ŚCIEKU
    const pourProgress = cycleTime / pipe.pourDuration;
    // Płynne wejście i wygaszanie strumienia (ease-in / ease-out)
    const intensity = Math.sin(pourProgress * Math.PI);
    drawToxicCascadeStream(ctx, px, nozzleY, surfaceY, pipe.streamWidth * intensity, time, intensity);
  } else {
    // FAZA SPOCZYNKU: OKRESOWE SKAPYWANIE POJEDYNCZYCH KROPEL (DRIPS)
    drawToxicNozzleDrips(ctx, px, nozzleY, surfaceY, time, pipe.phase);
  }
}

/**
 * Rysuje ciągłą, turbulentną smugę zielonego ścieku spływającego do kwasu
 */
function drawToxicCascadeStream(ctx, x, startY, endY, streamWidth, time, intensity) {
  // Jeśli lustro kwasu zalało wylot, zamiast strumienia powietrznego rysujemy wrzenie w kwasie
  if (endY <= startY + 6) {
    drawSubmergedNozzleBoil(ctx, x, endY, time, intensity);
    return;
  }

  const sW = Math.max(3.5, streamWidth);
  const halfSW = sW * 0.5;
  const height = endY - startY;

  // 1. ZIELONA POŚWIATA ATMOSFERYCZNA WOKÓŁ STRUMIENIA (SCREEN GLOW)
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const glowW = sW * 3.2;
  const glowGrad = ctx.createLinearGradient(x - glowW, 0, x + glowW, 0);
  glowGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
  glowGrad.addColorStop(0.35, `rgba(34, 197, 94, ${0.15 * intensity})`);
  glowGrad.addColorStop(0.50, `rgba(74, 222, 128, ${0.30 * intensity})`);
  glowGrad.addColorStop(0.65, `rgba(34, 197, 94, ${0.15 * intensity})`);
  glowGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(x - glowW, startY, glowW * 2, height);
  ctx.restore();

  // 2. GŁÓWNE CIAŁO STRUMIENIA (PŁYNĄCY WODOSPAD KWASU)
  ctx.save();
  const streamGrad = ctx.createLinearGradient(x - halfSW, 0, x + halfSW, 0);
  streamGrad.addColorStop(0.0, 'rgba(16, 185, 129, 0.85)');
  streamGrad.addColorStop(0.25, 'rgba(34, 197, 94, 0.95)');
  streamGrad.addColorStop(0.50, '#86efac'); // jasny radioaktywny rdzeń
  streamGrad.addColorStop(0.75, 'rgba(34, 197, 94, 0.95)');
  streamGrad.addColorStop(1.0, 'rgba(16, 185, 129, 0.85)');
  ctx.fillStyle = streamGrad;

  // Falująca kaskada z mikro-drganiami strumienia
  ctx.beginPath();
  const step = 20;
  // Lewa krawędź opadającej cieczy
  ctx.moveTo(x - halfSW, startY);
  for (let cy = startY; cy <= endY; cy += step) {
    const wave = Math.sin(time * 24 + cy * 0.05) * (1.8 * intensity);
    // Grawitacyjne zwężenie strumienia
    const taper = 1.0 - Math.min(0.25, (cy - startY) / (height + 1) * 0.25);
    ctx.lineTo(x - halfSW * taper + wave, cy);
  }
  ctx.lineTo(x + halfSW, endY);
  // Prawa krawędź wznosząca się ku dyszy
  for (let cy = endY; cy >= startY; cy -= step) {
    const wave = Math.sin(time * 24 + cy * 0.05) * (1.8 * intensity);
    const taper = 1.0 - Math.min(0.25, (cy - startY) / (height + 1) * 0.25);
    ctx.lineTo(x + halfSW * taper + wave, cy);
  }
  ctx.closePath();
  ctx.fill();

  // 3. PĘDZĄCE STRUGI PRĘDKOŚCI (SPEED LINES WEWNĄTRZ WODOSPADU)
  ctx.strokeStyle = '#dcfce7';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  const speedOffset = (time * 620) % 36;
  for (let sy = startY + speedOffset; sy < endY - 12; sy += 36) {
    const swave = Math.sin(time * 24 + sy * 0.05) * 1.5;
    ctx.moveTo(x + swave, sy);
    ctx.lineTo(x + swave, sy + 18);
  }
  ctx.stroke();
  ctx.restore();

  // 4. MIEJSCE UDERZENIA W KWAS (SPLASHDOWN IMPACT ZONE)
  drawAcidImpactZone(ctx, x, endY, sW, time, intensity);
}

/**
 * Rysuje piane, bąble i rozbryzg w miejscu uderzenia strugi w kwas
 */
function drawAcidImpactZone(ctx, x, surfaceY, streamWidth, time, intensity) {
  ctx.save();

  // A. Promienista poświata uderzeniowa na tafli (glow impact spot)
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const impactR = Math.max(18, streamWidth * 2.2);
  const glowGrad = ctx.createRadialGradient(x, surfaceY, 2, x, surfaceY, impactR);
  glowGrad.addColorStop(0.0, `rgba(134, 239, 172, ${0.85 * intensity})`);
  glowGrad.addColorStop(0.35, `rgba(74, 222, 128, ${0.55 * intensity})`);
  glowGrad.addColorStop(0.70, `rgba(34, 197, 94, ${0.20 * intensity})`);
  glowGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.ellipse(x, surfaceY, impactR * 1.6, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // B. Rozszerzające się pierścienie piany uderzeniowej (impact shockwaves)
  const ringProgress = (time * 3.5) % 1.0;
  const ringR = 8 + ringProgress * (impactR * 1.1);
  const ringAlpha = (1.0 - ringProgress) * 0.75 * intensity;
  ctx.strokeStyle = `rgba(167, 243, 208, ${ringAlpha})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(x, surfaceY, ringR * 1.4, 4.5, 0, 0, Math.PI * 2);
  ctx.stroke();

  // C. Grzebień wrzącej piany wokół strugi (frothing foam crest)
  ctx.fillStyle = 'rgba(240, 253, 244, 0.90)';
  const foamW = streamWidth * 1.4;
  ctx.beginPath();
  ctx.ellipse(x, surfaceY - 1, foamW, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // D. Wyrzucane rozbryzgi kropel (impact splash droplets)
  ctx.fillStyle = '#86efac';
  for (let d = 0; d < 4; d++) {
    const dProg = ((time * 4.5 + d * 0.25) % 1.0);
    const angle = (d % 2 === 0 ? -1 : 1) * (0.55 + (d * 0.2));
    const dist = 6 + dProg * 24;
    const dropX = x + Math.sin(angle) * dist;
    const dropY = surfaceY - Math.cos(angle) * dist * 0.7 + (dProg * dProg * 12);
    const dropR = (1.0 - dProg) * 2.2 * intensity;

    if (dropR > 0.4) {
      ctx.beginPath();
      ctx.arc(dropX, dropY, dropR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // E. Bąble gazu pęczniejące wokół punktu zrzutu (froth bubbles)
  for (let b = 0; b < 5; b++) {
    const bProg = ((time * 1.8 + b * 0.38) % 1.0);
    const bx = x + Math.sin(b * 1.7) * (streamWidth * 1.2 * (bProg + 0.4));
    const by = surfaceY + Math.cos(b * 2.1) * 2.0;
    const br = 1.2 + bProg * 2.4;
    const bAlpha = (1.0 - bProg * 0.5) * 0.85 * intensity;

    ctx.fillStyle = `rgba(167, 243, 208, ${bAlpha})`;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();

    // Punktowy biały błysk na bąblu
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bx - br * 0.3, by - br * 0.3, br * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Okresowe skapywanie kropel z dyszy w fazie uśpienia
 */
function drawToxicNozzleDrips(ctx, x, startY, surfaceY, time, phase) {
  if (surfaceY <= startY + 4) return;

  const dripCycle = (time * 1.4 + phase) % 1.0;
  const dropY = startY + dripCycle * Math.min(220, surfaceY - startY);

  if (dropY < surfaceY) {
    ctx.save();
    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.arc(x, dropY, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // Ogon kropli
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, dropY);
    ctx.lineTo(x, dropY - 5);
    ctx.stroke();
    ctx.restore();
  }

  // Mały zaciek na krawędzi wylotu
  ctx.save();
  ctx.fillStyle = '#4ade80';
  ctx.beginPath();
  ctx.arc(x, startY + 1.5, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Efekt bąbli i gejzeru, gdy dysza jest całkowicie zalana wysokim kwasem (Y = 600)
 */
function drawSubmergedNozzleBoil(ctx, x, surfaceY, time, intensity) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  // Bulgotanie z zalanego wylotu ku powierzchni
  for (let b = 0; b < 6; b++) {
    const bProg = ((time * 2.5 + b * 0.22) % 1.0);
    const bx = x + Math.sin(time * 3 + b) * 14;
    const by = surfaceY - (1.0 - bProg) * 8;
    const br = 1.5 + bProg * 3.5;

    ctx.fillStyle = `rgba(110, 231, 183, ${(1.0 - bProg) * 0.75 * intensity})`;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Rysuje pianę, bąble i rozbryzgi na tafli kwasu w miejscach uderzenia aktywnych strumieni ścieków
 * Wywoływane w warstwie geometrii (drawArena2Geometry) bezpośrednio na tafli kwasu
 */
export function drawSewerImpacts(ctx, time) {
  if (!ctx) return;
  for (let i = 0; i < ARENA_2_SEWER_PIPES.length; i++) {
    const pipe = ARENA_2_SEWER_PIPES[i];
    const cycleTime = ((time + pipe.phase) % pipe.cycleDuration + pipe.cycleDuration) % pipe.cycleDuration;
    if (cycleTime < pipe.pourDuration) {
      const pourProgress = cycleTime / pipe.pourDuration;
      const intensity = Math.sin(pourProgress * Math.PI);
      const surfaceY = getAcidSurfaceY(pipe.x, time);
      if (surfaceY > pipe.nozzleY + 6) {
        drawAcidImpactZone(ctx, pipe.x, surfaceY, pipe.streamWidth * intensity, time, intensity);
      } else {
        drawSubmergedNozzleBoil(ctx, pipe.x, surfaceY, time, intensity);
      }
    }
  }
}
