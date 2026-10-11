// =========================================================================
// ARENAS/ARENA2/SEWERPIPES.JS - KOLEKTORY ŚCIEKOWE I WYCIEKI W TLE
// Masywne pionowe rury ściekowe w ciemnej przestrzeni po bokach wentylatora
// Płynny, organiczny laminarny strumień kwasu, piana i bąble w miejscu uderzenia
// Pełna optymalizacja: Viewport culling, 0 alokacji gradientów/GC w pętli renderującej (stałe 60 FPS)
// 100% symetria osiowa względem X = 2000
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
    pourDuration: 5.0,
    phase: 0.0,
    streamWidth: 18,
    label: 'SEW-01A'
  },
  {
    id: 'sewer_inner_right',
    x: 2580,
    width: 50,
    topY: 0,
    nozzleY: 570,
    cycleDuration: 16.0,
    pourDuration: 5.0,
    phase: 0.0,
    streamWidth: 18,
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
    pourDuration: 5.4,
    phase: 5.5,
    streamWidth: 22,
    label: 'COL-02A'
  },
  {
    id: 'sewer_mid_right',
    x: 2880,
    width: 58,
    topY: 0,
    nozzleY: 660,
    cycleDuration: 17.0,
    pourDuration: 5.4,
    phase: 5.5,
    streamWidth: 22,
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
    pourDuration: 4.8,
    phase: 11.0,
    streamWidth: 20,
    label: 'DRN-03A'
  },
  {
    id: 'sewer_outer_right',
    x: 3300,
    width: 54,
    topY: 0,
    nozzleY: 760,
    cycleDuration: 18.0,
    pourDuration: 4.8,
    phase: 11.0,
    streamWidth: 20,
    label: 'DRN-03B'
  }
];

/**
 * Główna funkcja renderująca kolektory ściekowe i wycieki w warstwie tła
 * Zawiera viewport culling na podstawie kamery
 */
export function drawSewerPipes(ctx, time, camera) {
  if (!ctx) return;
  ctx.save();
  ctx.shadowBlur = 0;

  // Viewport culling w układzie współrzędnych świata
  const camZoom = (camera && camera.zoom) ? camera.zoom : 1;
  const camX = (camera && typeof camera.x === 'number') ? camera.x : 0;
  const canvasW = (ctx.canvas && ctx.canvas.width) ? ctx.canvas.width : 1920;
  const viewLeft = camX - 120;
  const viewRight = camX + (canvasW / camZoom) + 120;

  for (let i = 0; i < ARENA_2_SEWER_PIPES.length; i++) {
    const pipe = ARENA_2_SEWER_PIPES[i];
    // Odrzucenie niewidocznych rur poza ekranem (ogromny zysk FPS!)
    if (pipe.x + pipe.width * 0.5 < viewLeft || pipe.x - pipe.width * 0.5 > viewRight) {
      continue;
    }
    drawSingleSewerPipe(ctx, pipe, time);
  }

  ctx.restore();
}

/**
 * Rysuje pojedynczy kolektor ściekowy wraz z dynamicznym wyciekiem (zero dynamicznych gradientów)
 */
function drawSingleSewerPipe(ctx, pipe, time) {
  const px = pipe.x;
  const pw = pipe.width;
  const halfW = pw * 0.5;
  const nozzleY = pipe.nozzleY;
  const topY = pipe.topY || 0;
  const pipeH = nozzleY - topY;

  // 1. KORPUS RURY (CZARNO-STALOWY CYLINDER Z PRZETŁOCZENIAMI)
  ctx.fillStyle = '#141d27';
  ctx.fillRect(px - halfW, topY, pw, pipeH);

  // Krawędziowe cienie głębi
  ctx.fillStyle = '#06090e';
  ctx.fillRect(px - halfW, topY, 8, pipeH);
  ctx.fillRect(px + halfW - 8, topY, 8, pipeH);

  // Jasny odblask cylindryczny
  ctx.fillStyle = 'rgba(71, 85, 105, 0.25)';
  ctx.fillRect(px - halfW * 0.18, topY, 7, pipeH);

  ctx.strokeStyle = '#0a0f16';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(px - halfW, topY, pw, pipeH);

  // 2. KOŁNIERZE ŁĄCZENIOWE (FLANGE JOINTS CO 95 PX - SZYBKI RENDER BEZ GRADIENTÓW)
  const flangeH = 14;
  const flangeExtra = 8;
  const fx = px - halfW - flangeExtra * 0.5;
  const fw = pw + flangeExtra;

  for (let fy = topY + 70; fy < nozzleY - 30; fy += 95) {
    // Korpus kołnierza
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(fx, fy, fw, flangeH);

    // Górna krawędź odbijająca światło
    ctx.fillStyle = '#475569';
    ctx.fillRect(fx, fy, fw, 2);

    // Dolny głęboki cień
    ctx.fillStyle = '#06090e';
    ctx.fillRect(fx, fy + flangeH - 2, fw, 2);

    ctx.strokeStyle = '#0a0f16';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(fx, fy, fw, flangeH);

    // Śruby mocujące
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(fx + 3, fy + 5, 3, 3);
    ctx.fillRect(px - 1.5, fy + 5, 3, 3);
    ctx.fillRect(fx + fw - 6, fy + 5, 3, 3);

    // Kotwy ścienne
    ctx.fillStyle = '#0a0f16';
    ctx.fillRect(fx - 10, fy + 2, 10, flangeH - 4);
    ctx.fillRect(fx + fw, fy + 2, 10, flangeH - 4);
  }

  // 3. ZACIEKI CHEMICZNEJ KOROZJI NA PANCERZU
  ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
  ctx.fillRect(px - 6, nozzleY - 110, 12, 110);
  ctx.fillStyle = 'rgba(16, 185, 129, 0.28)';
  ctx.fillRect(px - 2, nozzleY - 60, 5, 60);

  // 4. KIELICH WYLOTOWY (SEWER DISCHARGE SPOUT)
  const bellH = 22;
  const bellExtra = 14;
  const bellX = px - halfW - bellExtra * 0.5;
  const bellW = pw + bellExtra;

  // Trapezowy kołnierz wylewowy
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(px - halfW, nozzleY - bellH);
  ctx.lineTo(px + halfW, nozzleY - bellH);
  ctx.lineTo(bellX + bellW, nozzleY);
  ctx.lineTo(bellX, nozzleY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Nity na kołnierzu
  ctx.fillStyle = '#94a3b8';
  for (let bx = bellX + 4; bx <= bellX + bellW - 4; bx += 8) {
    ctx.fillRect(bx, nozzleY - 4, 2.2, 2.2);
  }

  // Czeluść otworu wylotowego
  ctx.fillStyle = '#020406';
  ctx.beginPath();
  ctx.ellipse(px, nozzleY, bellW * 0.44, 5.0, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Etykieta techniczna
  ctx.font = '900 8px monospace';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText(pipe.label, px, nozzleY - 9);

  // 5. OBSŁUGA CYKLU ZRZUTU
  const cycleTime = ((time + pipe.phase) % pipe.cycleDuration + pipe.cycleDuration) % pipe.cycleDuration;
  const surfaceY = getAcidSurfaceY(px, time);

  if (cycleTime < pipe.pourDuration) {
    // Płynna funkcja natężenia przepływu: Smoothstep sinus (łagodne rozpoczęcie i łagodne zakończenie)
    const pourProgress = cycleTime / pipe.pourDuration;
    const rawSin = Math.sin(pourProgress * Math.PI);
    // Smoothstep curve: eliminuje skoki i tworzy płynne napływanie cieczy
    const intensity = rawSin * rawSin * (3.0 - 2.0 * rawSin);

    drawToxicCascadeStream(ctx, px, nozzleY, surfaceY, pipe.streamWidth * intensity, time, intensity);
  } else {
    // Spoczynek: płynnie skapujące krople
    drawToxicNozzleDrips(ctx, px, nozzleY, surfaceY, time, pipe.phase);
  }
}

/**
 * Rysuje PŁYNNY, laminarny, organiczny strumień zielonego kwasu
 * Bez schodków, bez kanciastych segmentów, z ruchem falującym w dół (zgodnym z grawitacją)
 */
function drawToxicCascadeStream(ctx, x, startY, endY, streamWidth, time, intensity) {
  if (intensity <= 0.01) return;

  // Gdy wylot rury zalała wysoka fala kwasu (Y = 600)
  if (endY <= startY + 8) {
    drawSubmergedNozzleBoil(ctx, x, endY, time, intensity);
    return;
  }

  const sW = Math.max(2.5, streamWidth);
  const halfSW = sW * 0.5;
  const height = endY - startY;
  if (height <= 4) return;

  // Krok próbkowania 22px zapewnia idealną, organiczną krzywiznę przy maksymalnym FPS (zero lagów)
  const step = 22;
  const numSteps = Math.ceil(height / step);

  // -------------------------------------------------------------------------
  // 1. GŁÓWNY PŁYNNY KORPUS SZLAMU (CIEMNOZIELONA GĘSTA CIECZ PIANKOWA)
  // Laminarny spływ: fale przemieszczają się W DÓŁ (czas * 10 - y * 0.02)
  // Czysty, organiczny strumień bez kanciastej poświaty/ramki w tle
  // -------------------------------------------------------------------------
  ctx.save();
  ctx.fillStyle = `rgba(16, 185, 129, ${0.88 * intensity})`;
  ctx.beginPath();

  // Płynny menisk wylewowy na wylocie rury
  ctx.moveTo(x - halfSW * 1.25, startY);

  // Lewa krawędź strumienia opadająca w dół z grawitacyjnym zwężeniem
  for (let i = 0; i <= numSteps; i++) {
    const cy = Math.min(endY, startY + i * step);
    const prog = (cy - startY) / height;
    // Grawitacja: przyspieszająca ciecz naturalnie zwęża się w połowie wysokości
    const gravityTaper = 1.0 - 0.28 * Math.sin(prog * Math.PI * 0.9);
    // Płynna fala w dół z sumy dwóch harmonicznych
    const wave = Math.sin(time * 9.5 - cy * 0.020) * (1.6 * intensity) +
                 Math.sin(time * 15.0 - cy * 0.038) * (0.8 * intensity);
    ctx.lineTo(x - (halfSW * gravityTaper) + wave, cy);
  }

  // Podstawa na tafli kwasu (lekkie rozszerzenie przed zderzeniem)
  ctx.lineTo(x + halfSW * 1.15, endY);

  // Prawa krawędź wznosząca się ku dyszy
  for (let i = numSteps; i >= 0; i--) {
    const cy = Math.min(endY, startY + i * step);
    const prog = (cy - startY) / height;
    const gravityTaper = 1.0 - 0.28 * Math.sin(prog * Math.PI * 0.9);
    const wave = Math.sin(time * 9.5 - cy * 0.020) * (1.6 * intensity) +
                 Math.sin(time * 15.0 - cy * 0.038) * (0.8 * intensity);
    ctx.lineTo(x + (halfSW * gravityTaper) + wave, cy);
  }

  ctx.closePath();
  ctx.fill();

  // -------------------------------------------------------------------------
  // 3. JASKRAWY RADIOAKTYWNY RDZEŃ STRUMIENIA (#86efac)
  // Zapewnia głębię 3D i efekt płynącego ciekłego neonu
  // -------------------------------------------------------------------------
  const coreW = halfSW * 0.45;
  ctx.fillStyle = `rgba(134, 239, 172, ${0.92 * intensity})`;
  ctx.beginPath();
  ctx.moveTo(x - coreW, startY);

  for (let i = 0; i <= numSteps; i++) {
    const cy = Math.min(endY, startY + i * step);
    const wave = Math.sin(time * 9.5 - cy * 0.020 + 0.3) * (1.4 * intensity);
    ctx.lineTo(x - coreW + wave, cy);
  }
  ctx.lineTo(x + coreW, endY);
  for (let i = numSteps; i >= 0; i--) {
    const cy = Math.min(endY, startY + i * step);
    const wave = Math.sin(time * 9.5 - cy * 0.020 + 0.3) * (1.4 * intensity);
    ctx.lineTo(x + coreW + wave, cy);
  }
  ctx.closePath();
  ctx.fill();

  // -------------------------------------------------------------------------
  // 4. LŚNIĄCA WSTĘGA LAMINARNA (SPECULAR FLUID RIBBON)
  // Cienka biało-limonkowa linia płynąca w centrum strumienia
  // -------------------------------------------------------------------------
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.60 * intensity})`;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= numSteps; i++) {
    const cy = Math.min(endY, startY + i * step);
    const wave = Math.sin(time * 9.5 - cy * 0.020) * (1.5 * intensity);
    if (i === 0) ctx.moveTo(x + wave, cy);
    else ctx.lineTo(x + wave, cy);
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * Rysuje piane, bąble i rozbryzgi w miejscu uderzenia strumienia w kwas
 * Wywoływane w warstwie geometrii (drawArena2Geometry) bezpośrednio na tafli kwasu
 */
export function drawSewerImpacts(ctx, time, camera) {
  if (!ctx) return;

  const camZoom = (camera && camera.zoom) ? camera.zoom : 1;
  const camX = (camera && typeof camera.x === 'number') ? camera.x : 0;
  const canvasW = (ctx.canvas && ctx.canvas.width) ? ctx.canvas.width : 1920;
  const viewLeft = camX - 100;
  const viewRight = camX + (canvasW / camZoom) + 100;

  for (let i = 0; i < ARENA_2_SEWER_PIPES.length; i++) {
    const pipe = ARENA_2_SEWER_PIPES[i];

    // Viewport culling strefy uderzenia
    if (pipe.x + 80 < viewLeft || pipe.x - 80 > viewRight) {
      continue;
    }

    const cycleTime = ((time + pipe.phase) % pipe.cycleDuration + pipe.cycleDuration) % pipe.cycleDuration;
    if (cycleTime < pipe.pourDuration) {
      const pourProgress = cycleTime / pipe.pourDuration;
      const rawSin = Math.sin(pourProgress * Math.PI);
      const intensity = rawSin * rawSin * (3.0 - 2.0 * rawSin);

      if (intensity > 0.02) {
        const surfaceY = getAcidSurfaceY(pipe.x, time);
        if (surfaceY > pipe.nozzleY + 8) {
          drawAcidImpactZone(ctx, pipe.x, surfaceY, pipe.streamWidth * intensity, time, intensity);
        } else {
          drawSubmergedNozzleBoil(ctx, pipe.x, surfaceY, time, intensity);
        }
      }
    }
  }
}

/**
 * Rysuje strefę uderzenia cieczy w kwas (bez alokacji gradientów)
 */
function drawAcidImpactZone(ctx, x, surfaceY, streamWidth, time, intensity) {
  ctx.save();
  const impactR = Math.max(14, streamWidth * 2.0);

  // 1. ŁUNA ROZBLYSKU NA TAFLE (PŁYNNA I WYDAJNA BEZ TRYBU SCREEN)
  ctx.fillStyle = `rgba(34, 197, 94, ${0.30 * intensity})`;
  ctx.beginPath();
  ctx.ellipse(x, surfaceY, impactR * 1.5, 7.0, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(134, 239, 172, ${0.45 * intensity})`;
  ctx.beginPath();
  ctx.ellipse(x, surfaceY, impactR * 0.85, 4.0, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. ROZSZERZAJĄCE SIĘ PIERŚCIENIE PIANY (SHOCKWAVE RINGS)
  const ringProgress1 = (time * 2.8) % 1.0;
  const ringR1 = 6 + ringProgress1 * (impactR * 1.15);
  const ringA1 = (1.0 - ringProgress1) * 0.70 * intensity;
  ctx.strokeStyle = `rgba(167, 243, 208, ${ringA1})`;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(x, surfaceY, ringR1 * 1.35, 4.0, 0, 0, Math.PI * 2);
  ctx.stroke();

  const ringProgress2 = (time * 2.8 + 0.5) % 1.0;
  const ringR2 = 6 + ringProgress2 * (impactR * 1.15);
  const ringA2 = (1.0 - ringProgress2) * 0.65 * intensity;
  ctx.strokeStyle = `rgba(134, 239, 172, ${ringA2})`;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.ellipse(x, surfaceY, ringR2 * 1.35, 4.0, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 3. PIENIĄCY SIĘ GRZEBIEŃ WRZENIA (FOAM CREST)
  ctx.fillStyle = `rgba(240, 253, 244, ${0.92 * intensity})`;
  const foamW = streamWidth * 1.3;
  ctx.beginPath();
  ctx.ellipse(x, surfaceY - 0.5, foamW, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. KROPLE ROZPRYSKU W WYNIKU UDERZENIA (4 stałe trajektorie, 0 alokacji)
  ctx.fillStyle = '#86efac';
  for (let d = 0; d < 4; d++) {
    const dProg = ((time * 4.0 + d * 0.25) % 1.0);
    const sign = (d % 2 === 0 ? -1 : 1);
    const dDist = 5 + dProg * 22;
    const dropX = x + sign * dDist * (0.8 + d * 0.1);
    const dropY = surfaceY - Math.sin(dProg * Math.PI) * 14;
    const dropR = (1.0 - dProg) * 2.0 * intensity;

    if (dropR > 0.4) {
      ctx.beginPath();
      ctx.arc(dropX, dropY, dropR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 5. BULGOCZĄCE BĄBLE PIANY WOKÓŁ PUNKTU UDERZENIA
  for (let b = 0; b < 4; b++) {
    const bProg = ((time * 1.6 + b * 0.25) % 1.0);
    const bx = x + Math.sin(b * 2.3 + time * 2) * (streamWidth * 1.1);
    const by = surfaceY + Math.cos(b * 1.9) * 1.5;
    const br = 1.2 + bProg * 2.2;
    const bAlpha = (1.0 - bProg * 0.4) * 0.85 * intensity;

    ctx.fillStyle = `rgba(167, 243, 208, ${bAlpha})`;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();

    // Punktowy biały błysk
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bx - br * 0.3, by - br * 0.3, br * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Płynne skapywanie kropel w fazie spoczynku (trajektoria paraboliczna przyspieszenia)
 */
function drawToxicNozzleDrips(ctx, x, startY, surfaceY, time, phase) {
  if (surfaceY <= startY + 4) return;

  const dripCycle = ((time * 1.35 + phase) % 1.0);
  // Przyspieszenie grawitacyjne kropli
  const dropY = startY + (dripCycle * dripCycle) * Math.min(260, surfaceY - startY);

  if (dropY < surfaceY) {
    ctx.save();
    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.arc(x, dropY, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // Płynny smukły ogon kropli
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.40)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, dropY);
    ctx.lineTo(x, dropY - 6 * dripCycle);
    ctx.stroke();
    ctx.restore();
  }

  // Zaciek na dolnej wardze dyszy
  ctx.save();
  ctx.fillStyle = 'rgba(74, 222, 128, 0.85)';
  ctx.beginPath();
  ctx.arc(x, startY + 1.2, 2.0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Efekt bąbli i gejzeru, gdy dysza jest całkowicie zalana wysokim kwasem (Y = 600)
 */
function drawSubmergedNozzleBoil(ctx, x, surfaceY, time, intensity) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (let b = 0; b < 5; b++) {
    const bProg = ((time * 2.4 + b * 0.2) % 1.0);
    const bx = x + Math.sin(time * 3 + b) * 12;
    const by = surfaceY - (1.0 - bProg) * 7;
    const br = 1.5 + bProg * 3.2;

    ctx.fillStyle = `rgba(110, 231, 183, ${(1.0 - bProg) * 0.70 * intensity})`;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
