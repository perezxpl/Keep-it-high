// =========================================================================
// ARENAS/ARENA3/ORGANICSTRUCTURES.JS - ORGANICZNA ARCHITEKTURA ARENY 3
// Zastępuje klockowate prostopadłościany płynną, naturalną estetyką dżungli:
// 1. Naturalne nawisy skalne (półki snajperskie wrośnięte w klify kanionu)
// 2. Ciągły most wiszący z poprzecznymi deskami i krzywą łańcuchową
// 3. Płynne rampy podejściowe z ciosanego drewna bez szwów
// 4. Ciągłe pomosty w koronach drzew (Canopy Skywalks)
// W 100% zachowuje pełną destrukcję, fizykę i kolizje segmentów!
// =========================================================================

import { getApproachInclineY, getRiverbankGroundY } from './state.js';

/**
 * Pomocnicze rysowanie skręcanej liny konopnej / pnącza.
 */
function drawBraidedRope(ctx, x1, y1, x2, y2, thickness = 3.5, color = '#4e3316') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Refleks świetlny na skręcie liny
  ctx.strokeStyle = 'rgba(215, 175, 95, 0.35)';
  ctx.lineWidth = Math.max(1, thickness * 0.35);
  ctx.beginPath();
  ctx.moveTo(x1, y1 - 0.5);
  ctx.lineTo(x2, y2 - 0.5);
  ctx.stroke();
  ctx.restore();
}

/**
 * Pomocnicze rysowanie organicznej kępy mchu górskiego.
 */
function drawMossClump(ctx, x, y, width, thickness = 3.5) {
  ctx.save();
  // Ciemny podkład
  ctx.strokeStyle = '#274312';
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.moveTo(x, y + 1.2);
  ctx.lineTo(x + width, y + 1.2);
  ctx.stroke();

  // Żywa zieleń mchu
  ctx.strokeStyle = '#4d7c0f';
  ctx.lineWidth = thickness * 0.7;
  ctx.beginPath();
  ctx.moveTo(x + 1, y + 0.5);
  ctx.lineTo(x + width - 1, y + 0.5);
  ctx.stroke();

  // Słoneczne akcenty
  ctx.strokeStyle = '#84cc16';
  ctx.lineWidth = thickness * 0.35;
  ctx.beginPath();
  ctx.moveTo(x + 2, y);
  ctx.lineTo(x + width - 2, y);
  ctx.stroke();
  ctx.restore();
}

/**
 * 1. PÓŁKI SNAJPERSKIE JAKO NATURALNE NAWISY SKALNE (ORGANIC ROCK CRAGS)
 * Zamiast 4 klockowatych płyt AABB — monumentalna półka skalna wrośnięta w klif,
 * ze skośnym skalnym wspornikiem pod spodem, warstwami bazaltu i mchem.
 * Gdy segment zostanie zniszczony, na przełomie powstaje poszarpany ząb skalny,
 * a oderwany głaz odpada z realną fizyką.
 */
export function drawOrganicSniperCrags(ctx, slabs, camL, camR, drawSplinteredRockSlabFn) {
  if (!slabs || slabs.length === 0) return;

  const leftSlabs = slabs.filter(s => s.side === 'left');
  const rightSlabs = slabs.filter(s => s.side === 'right');

  drawSingleSideRockCrag(ctx, leftSlabs, true, camL, camR, drawSplinteredRockSlabFn);
  drawSingleSideRockCrag(ctx, rightSlabs, false, camL, camR, drawSplinteredRockSlabFn);
}

function drawSingleSideRockCrag(ctx, sideSlabs, isLeft, camL, camR, drawSplinteredRockSlabFn) {
  if (sideSlabs.length === 0) return;

  // Znajdź ciągłe segmenty nienaruszonych bloków
  const groups = [];
  let currentGroup = [];

  for (let i = 0; i < sideSlabs.length; i++) {
    const s = sideSlabs[i];
    if (s.intact) {
      currentGroup.push(s);
    } else {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
        currentGroup = [];
      }
      // Rysuj oderwany głaz spadający w dół
      if (typeof drawSplinteredRockSlabFn === 'function') {
        ctx.save();
        drawSplinteredRockSlabFn(ctx, s);
        ctx.restore();
      }
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  // Rysowanie poszczególnych litych masywów skalnych
  for (let g = 0; g < groups.length; g++) {
    const grp = groups[g];
    const firstSlab = grp[0];
    const lastSlab = grp[grp.length - 1];

    const minX = firstSlab.x;
    const maxX = lastSlab.x + lastSlab.w;
    const topY = firstSlab.y;
    const slabH = firstSlab.h;

    // Culling
    if (maxX + 50 < camL || minX - 50 > camR) continue;

    const isAttachedToCliff = isLeft ? (firstSlab.slabIndex === 0) : (lastSlab.slabIndex === sideSlabs.length - 1);
    const isOuterTipIntact = isLeft ? (lastSlab.slabIndex === sideSlabs.length - 1) : (firstSlab.slabIndex === 0);

    ctx.save();

    // 1. Poligon monolitycznego nawisu skalnego (Natural Rock Outcropping)
    ctx.beginPath();

    if (isLeft) {
      // LEWA PÓŁKA: klif po lewej (X <= 600), nawis wysunięty w prawo (do X = 1000)
      ctx.moveTo(minX, topY);
      // Górna krawędź z mikro-chropowatością
      for (let x = minX + 20; x < maxX - 10; x += 30) {
        ctx.lineTo(x, topY + Math.sin(x * 0.15) * 1.2);
      }
      ctx.lineTo(maxX, topY);

      if (isOuterTipIntact) {
        // Naturalny zaokrąglony czubek półki skalnej
        ctx.lineTo(maxX + 4, topY + 8);
        ctx.lineTo(maxX + 2, topY + slabH * 0.6);
        ctx.lineTo(maxX - 8, topY + slabH);
      } else {
        // Poszarpany przełom skalny po eksplozji (Sheared fracture face)
        ctx.lineTo(maxX + 3, topY + 6);
        ctx.lineTo(maxX - 5, topY + 14);
        ctx.lineTo(maxX + 4, topY + 22);
        ctx.lineTo(maxX - 6, topY + slabH);
      }

      // Spód nawisu skalnego:
      if (isAttachedToCliff) {
        // Masywny ukośny wspornik skalny wrośnięty głęboko w klif (od Y: 834 aż do 910)
        ctx.lineTo(minX + (maxX - minX) * 0.65, topY + slabH + 8);
        ctx.lineTo(minX + (maxX - minX) * 0.35, topY + slabH + 28);
        ctx.lineTo(minX, topY + slabH + 65);
      } else {
        // Odizolowany fragment skalny (wyszczerbiony z obu stron)
        ctx.lineTo(minX + 20, topY + slabH + 12);
        ctx.lineTo(minX - 4, topY + slabH);
        ctx.lineTo(minX + 4, topY + 16);
        ctx.lineTo(minX - 3, topY + 6);
      }
      ctx.closePath();

    } else {
      // PRAWA PÓŁKA: klif po prawej (X >= 3800), nawis wysunięty w lewo (od X = 3400)
      ctx.moveTo(maxX, topY);
      for (let x = maxX - 20; x > minX + 10; x -= 30) {
        ctx.lineTo(x, topY + Math.sin(x * 0.15) * 1.2);
      }
      ctx.lineTo(minX, topY);

      if (isOuterTipIntact) {
        // Naturalny zaokrąglony czubek półki po lewej
        ctx.lineTo(minX - 4, topY + 8);
        ctx.lineTo(minX - 2, topY + slabH * 0.6);
        ctx.lineTo(minX + 8, topY + slabH);
      } else {
        // Poszarpany przełom skalny po eksplozji
        ctx.lineTo(minX - 3, topY + 6);
        ctx.lineTo(minX + 5, topY + 14);
        ctx.lineTo(minX - 4, topY + 22);
        ctx.lineTo(minX + 6, topY + slabH);
      }

      // Spód nawisu skalnego schodzący ukośnie w prawy klif:
      if (isAttachedToCliff) {
        ctx.lineTo(minX + (maxX - minX) * 0.35, topY + slabH + 8);
        ctx.lineTo(minX + (maxX - minX) * 0.65, topY + slabH + 28);
        ctx.lineTo(maxX, topY + slabH + 65);
      } else {
        ctx.lineTo(maxX - 20, topY + slabH + 12);
        ctx.lineTo(maxX + 4, topY + slabH);
        ctx.lineTo(maxX - 4, topY + 16);
        ctx.lineTo(maxX + 3, topY + 6);
      }
      ctx.closePath();
    }

    // 2. Skalny gradient bazaltowo-dolomitowy z głębokim cieniowaniem 3D
    const rockGrad = ctx.createLinearGradient(isLeft ? minX : maxX, topY, isLeft ? maxX : minX, topY + slabH + 60);
    rockGrad.addColorStop(0.00, '#38434f'); // Oświetlony szczyt bazaltu
    rockGrad.addColorStop(0.25, '#262f38');
    rockGrad.addColorStop(0.60, '#192026');
    rockGrad.addColorStop(1.00, '#0c1014'); // Głęboki cień pod nawisem
    ctx.fillStyle = rockGrad;
    ctx.fill();

    // 3. Poziome warstwy geologiczne i pęknięcia skały (Strata layers)
    ctx.strokeStyle = 'rgba(10, 14, 18, 0.75)';
    ctx.lineWidth = 1.4;
    for (let ly = topY + 12; ly < topY + slabH + 45; ly += 14) {
      ctx.beginPath();
      const lx1 = isLeft ? minX + 5 : minX + 15;
      const lx2 = isLeft ? maxX - 15 : maxX - 5;
      ctx.moveTo(lx1, ly);
      ctx.lineTo((lx1 + lx2) * 0.5, ly + ((ly % 5) - 2));
      ctx.lineTo(lx2, ly + ((ly % 3) - 1));
      ctx.stroke();

      // Jasny refleks światła na krawędzi warstwy
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(lx1 + 4, ly + 0.8);
      ctx.lineTo(lx2 - 4, ly + 0.8);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(10, 14, 18, 0.75)';
      ctx.lineWidth = 1.4;
    }

    // 4. Zacieki mineralne (żelazo / ochra)
    ctx.fillStyle = 'rgba(180, 83, 9, 0.16)';
    for (let rx = minX + 25; rx < maxX - 20; rx += 55) {
      ctx.fillRect(rx, topY + 4, 6, slabH + 18);
    }

    // 5. Zwisające korzenie i pnącza dżungli z dolnej krawędzi
    ctx.strokeStyle = '#2d1f12';
    ctx.lineWidth = 1.8;
    for (let vx = minX + 35; vx < maxX - 30; vx += 45) {
      const vLen = 16 + ((vx % 7) * 4);
      const startVy = topY + slabH + (isLeft ? (vx - minX) * 0.08 : (maxX - vx) * 0.08);
      ctx.beginPath();
      ctx.moveTo(vx, startVy);
      ctx.quadraticCurveTo(vx + 4, startVy + vLen * 0.6, vx - 2, startVy + vLen);
      ctx.stroke();

      // Drobne zielone listki na pnączu
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(vx + 2, startVy + vLen * 0.5, 3, 3);
      ctx.fillRect(vx - 3, startVy + vLen * 0.8, 3, 3);
    }

    // 6. Ciągły mech górski na całej powierzchni chodnika
    drawMossClump(ctx, minX, topY, maxX - minX, 4.0);

    // 7. Obrys konstrukcyjny skały
    ctx.strokeStyle = '#080c10';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * 2. CIĄGŁY MOST WISZĄCY W DŻUNGLI (ORGANIC SUSPENSION ROPE BRIDGE)
 * Zamiast 24 oddzielnych prostopadłościennych klocków — płynny most linowy
 * z wygiętymi linami nośnymi, poprzecznymi deskami kładki i olinowaniem poręczy.
 * Gdy blok zostanie zniszczony, na jego szerokości powstaje realna wyrwa (brak desek),
 * odsłaniając przepaść i poszarpane końce belek.
 */
export function drawOrganicSuspensionBridge(ctx, blocks, camL, camR, animTime) {
  if (!blocks || blocks.length === 0) return;

  const b0 = blocks[0];
  const bLast = blocks[blocks.length - 1];
  const startX = b0.origX;
  const endX = bLast.origX + bLast.w;

  if (endX + 60 < camL || startX - 60 > camR) return;

  ctx.save();

  // Oblicz punkty katenoidy / ugięcia mostu dla każdego bloku
  const pts = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const cx = b.x + b.w * 0.5;
    const cy = b.y + (b.sag || 0);
    pts.push({ x: cx, y: cy, intact: b.intact, block: b });
  }

  // 1. GŁÓWNA DOLNA LINA NOŚNA PODESTU (biegnie pod deskami)
  ctx.strokeStyle = '#2b1708';
  ctx.lineWidth = 5.0;
  ctx.beginPath();
  ctx.moveTo(startX - 15, b0.origY + 12);
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    ctx.lineTo(p.x, p.y + 12);
  }
  ctx.lineTo(endX + 15, bLast.origY + 12);
  ctx.stroke();

  // Wewnętrzny jaśniejszy rdzeń liny
  ctx.strokeStyle = '#664019';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(startX - 15, b0.origY + 11.5);
  for (let i = 0; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y + 11.5);
  }
  ctx.lineTo(endX + 15, bLast.origY + 11.5);
  ctx.stroke();

  // 2. GÓRNA LINA PORĘCZY (Handrail Cable, 30px nad kładką)
  const handrailH = 30;
  ctx.strokeStyle = '#38200c';
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.moveTo(startX - 15, b0.origY - handrailH);
  for (let i = 0; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y - handrailH);
  }
  ctx.lineTo(endX + 15, bLast.origY - handrailH);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(215, 175, 95, 0.45)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(startX - 15, b0.origY - handrailH - 0.5);
  for (let i = 0; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y - handrailH - 0.5);
  }
  ctx.lineTo(endX + 15, bLast.origY - handrailH - 0.5);
  ctx.stroke();

  // 3. PIONOWE WIESZAKI LINOWE (Dropper Ropes)
  for (let i = 0; i < pts.length; i += 2) {
    const p = pts[i];
    const topY = p.y - handrailH;
    const btmY = p.y + 12;

    if (p.intact) {
      drawBraidedRope(ctx, p.x, topY, p.x, btmY, 2.0, '#4e3316');

      // Żelazny zacisk wieszaka przy kładce
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(p.x - 2.5, btmY - 3, 5, 5);
    } else {
      // Rozpleciony, zwisający kikut liny w miejscu zniszczenia
      const frayLen = 14;
      const sway = Math.sin(animTime * 3.5 + p.x) * 4;
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(p.x, topY);
      ctx.quadraticCurveTo(p.x + sway * 0.5, topY + frayLen * 0.6, p.x + sway, topY + frayLen);
      ctx.stroke();
    }
  }

  // 4. POPRZECZNE DESKI KŁADKI MOSTU (Cross-planks)
  // Zamiast 1 wielkiego klocka — 3 naturalne wąskie deski na każdy blok!
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.x + b.w + 30 < camL || b.x - 30 > camR) continue;

    if (b.intact) {
      const currentY = b.y + (b.sag || 0);
      const plankCount = 3;
      const plankW = (b.w - 4) / plankCount;

      for (let pIdx = 0; pIdx < plankCount; pIdx++) {
        const px = b.x + 2 + pIdx * plankW;
        const py = currentY;
        const pw = plankW - 2.0; // 2px szczeliny między deskami
        const ph = 14;

        // Deska zestarzałego dębu/teku
        const pGrad = ctx.createLinearGradient(px, py, px, py + ph);
        pGrad.addColorStop(0.00, '#664019');
        pGrad.addColorStop(0.35, '#4a2c10');
        pGrad.addColorStop(0.75, '#2d1807');
        pGrad.addColorStop(1.00, '#1c0d03');
        ctx.fillStyle = pGrad;

        // Zaokrąglona faza deski
        ctx.beginPath();
        ctx.rect(px, py, pw, ph);
        ctx.fill();

        // Kuta krawędź górna
        ctx.strokeStyle = 'rgba(235, 195, 105, 0.40)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(px + 1, py + 0.6);
        ctx.lineTo(px + pw - 1, py + 0.6);
        ctx.stroke();

        // Ciemny obrys deski
        ctx.strokeStyle = '#100702';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(px, py, pw, ph);

        // Kute nity/gwoździe mocujące deskę do lin nośnych
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 2, py + 3, 2, 2);
        ctx.fillRect(px + pw - 4, py + 3, 2, 2);

        // Mech na zewnętrznej krawędzi
        if ((i + pIdx) % 4 === 0) {
          ctx.fillStyle = '#65a30d';
          ctx.fillRect(px + 1, py, 3, 2);
        }
      }
    } else {
      // 5. POSZARPANA WYRWA W MOŚCIE (Zniszczony segment)
      // Sterczące drzazgi z sąsiednich krawędzi
      const curY = b.y + (b.sag || 0);
      ctx.save();
      ctx.fillStyle = '#1a0d03';
      // Lewe drzazgi
      ctx.beginPath();
      ctx.moveTo(b.x, curY);
      ctx.lineTo(b.x + 8, curY + 2);
      ctx.lineTo(b.x + 4, curY + 7);
      ctx.lineTo(b.x + 10, curY + 11);
      ctx.lineTo(b.x, curY + 14);
      ctx.closePath();
      ctx.fill();

      // Prawe drzazgi
      ctx.beginPath();
      ctx.moveTo(b.x + b.w, curY);
      ctx.lineTo(b.x + b.w - 8, curY + 3);
      ctx.lineTo(b.x + b.w - 4, curY + 8);
      ctx.lineTo(b.x + b.w - 11, curY + 12);
      ctx.lineTo(b.x + b.w, curY + 14);
      ctx.closePath();
      ctx.fill();

      // Ciemne osmolenie wybuchu na krawędzi wyrwy
      ctx.fillStyle = 'rgba(8, 4, 1, 0.85)';
      ctx.fillRect(b.x - 4, curY + 1, 6, 12);
      ctx.fillRect(b.x + b.w - 2, curY + 1, 6, 12);
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * 3. PŁYNNE RAMPY PODEJŚCIOWE Z CIOSANEGO DREWNA (CONTINUOUS APPROACH INCLINE)
 * Zamiast 10 oddzielnych klocków ze szwami — spójne, ciągłe belki podestu
 * z listwami antypoślizgowymi, balustradą i słupkami.
 */
export function drawOrganicBridgeApproach(ctx, rampBlocks, isLeft, camL, camR) {
  if (!rampBlocks || rampBlocks.length === 0) return;

  const rx1 = isLeft ? 1150 : 2650;
  const rx2 = isLeft ? 1750 : 3250;
  if (rx2 < camL || rx1 > camR) return;

  ctx.save();

  // Pogrupuj sąsiadujące nienaruszone segmenty
  const intactGroups = [];
  let currentGroup = [];

  for (let i = 0; i < rampBlocks.length; i++) {
    const b = rampBlocks[i];
    if (b.intact) {
      currentGroup.push(b);
    } else {
      if (currentGroup.length > 0) {
        intactGroups.push(currentGroup);
        currentGroup = [];
      }
    }
  }
  if (currentGroup.length > 0) {
    intactGroups.push(currentGroup);
  }

  // Rysuj ciągłe podłużnice dla każdej grupy nienaruszonych bloków
  for (let g = 0; g < intactGroups.length; g++) {
    const grp = intactGroups[g];
    const bFirst = grp[0];
    const bLast = grp[grp.length - 1];

    const gx1 = bFirst.origX;
    const gx2 = bLast.origX + bLast.w;
    const gy1 = getApproachInclineY(gx1, isLeft);
    const gy2 = getApproachInclineY(gx2, isLeft);

    const beamH = 18;

    // 1. Ciągła pochyła belka podestu (Incline stringer)
    ctx.beginPath();
    ctx.moveTo(gx1, gy1);
    ctx.lineTo(gx2, gy2);
    ctx.lineTo(gx2, gy2 + beamH);
    ctx.lineTo(gx1, gy1 + beamH);
    ctx.closePath();

    const rampGrad = ctx.createLinearGradient(gx1, gy1, gx2, gy2 + beamH);
    rampGrad.addColorStop(0.00, '#664019');
    rampGrad.addColorStop(0.35, '#4a2c10');
    rampGrad.addColorStop(0.75, '#2d1807');
    rampGrad.addColorStop(1.00, '#1c0d03');
    ctx.fillStyle = rampGrad;
    ctx.fill();

    // Fazowana górna krawędź
    ctx.strokeStyle = 'rgba(235, 195, 105, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(gx1, gy1 + 0.6);
    ctx.lineTo(gx2, gy2 + 0.6);
    ctx.stroke();

    // Ciemny obrys belki
    ctx.strokeStyle = '#120702';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // 2. Równomiernie rozmieszczone listwy antypoślizgowe (Battens)
    for (let bx = gx1 + 14; bx <= gx2 - 10; bx += 20) {
      const by = getApproachInclineY(bx, isLeft);
      ctx.fillStyle = '#3a200a';
      ctx.fillRect(bx - 2, by - 1, 4, 6);

      ctx.strokeStyle = 'rgba(235, 195, 105, 0.85)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(bx - 3, by);
      ctx.lineTo(bx + 3, by + (isLeft ? -1.2 : 1.2));
      ctx.stroke();

      // Kuty gwóźdź
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(bx - 1, by + 2, 2, 2);
    }

    // 3. Mech na górnej krawędzi
    ctx.strokeStyle = '#4d7c0f';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(gx1, gy1 + 1);
    ctx.lineTo(gx2, gy2 + 1);
    ctx.stroke();

    // 4. Słupki poręczy i lina balustrady
    for (let i = 0; i < grp.length; i++) {
      const b = grp[i];
      const postX = b.stiltX;
      const postY = getApproachInclineY(postX, isLeft);
      const hrH = 32;

      // Słupek
      ctx.strokeStyle = '#321908';
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      ctx.moveTo(postX, postY);
      ctx.lineTo(postX, postY - hrH);
      ctx.stroke();

      // Okucie słupka
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(postX - 3, postY - hrH, 6, 6);

      // Linka do następnego słupka
      if (i < grp.length - 1) {
        const nextPostX = grp[i + 1].stiltX;
        const nextPostY = getApproachInclineY(nextPostX, isLeft);

        ctx.strokeStyle = '#533718';
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.moveTo(postX, postY - hrH + 3);
        ctx.lineTo(nextPostX, nextPostY - hrH + 3);
        ctx.stroke();

        ctx.strokeStyle = '#2d1808';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(postX, postY - hrH * 0.5);
        ctx.lineTo(nextPostX, nextPostY - hrH * 0.5);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

/**
 * 4. CIĄGŁE POMOSTY W KORONACH DRZEW (CANOPY SKYWALKS)
 * Zamiast 4 klocków — spójny wiszący pomost z poprzecznymi deskami
 * i mocnymi wiązaniami linowymi.
 */
export function drawOrganicCanopyDeck(ctx, plat, camL, camR) {
  if (!plat || !plat.blocks) return;

  const blocks = plat.blocks;
  const bFirst = blocks[0];
  const bLast = blocks[blocks.length - 1];

  ctx.save();

  // Belka wzdłużna podestu łącząca cały pomost
  const isAllIntact = blocks.every(b => b.intact);
  const pw = plat.w;
  const ph = plat.h;

  if (isAllIntact && plat.tiltAngle === 0) {
    const px = plat.origX + (plat.swayX || 0);
    const py = plat.origY + (plat.bounceY || 0);

    // Ciągły pomost
    const deckGrad = ctx.createLinearGradient(px, py, px, py + ph);
    deckGrad.addColorStop(0.00, '#664019');
    deckGrad.addColorStop(0.35, '#4a2c10');
    deckGrad.addColorStop(0.75, '#2d1807');
    deckGrad.addColorStop(1.00, '#1c0d03');
    ctx.fillStyle = deckGrad;
    ctx.fillRect(px, py, pw, ph);

    // Poprzeczne deski kładki (cross-planks)
    const plankW = 12;
    for (let x = px + 4; x < px + pw - 6; x += plankW + 2) {
      ctx.strokeStyle = '#140803';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x, py, plankW, ph);

      // Kuty gwóźdź
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + 2, py + 2, 2, 2);
      ctx.fillRect(x + plankW - 4, py + 2, 2, 2);
    }

    // Oplecione liny mocujące przy zawiesiach
    drawBraidedRope(ctx, px + 10, py, px + 10, py + ph, 2.8, '#4e3316');
    drawBraidedRope(ctx, px + pw - 10, py, px + pw - 10, py + ph, 2.8, '#4e3316');

    // Górny mech
    drawMossClump(ctx, px, py, pw, 3.2);

    // Ciemny obrys
    ctx.strokeStyle = '#0e0501';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(px, py, pw, ph);

  } else {
    // Gdy pomost jest przechylony lub podzielony na kawałki:
    for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
      const b = blocks[bIdx];
      if (!b.intact) continue;

      ctx.save();
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      ctx.translate(cx, cy);
      if (b.angle) ctx.rotate(b.angle);

      const halfW = b.w / 2;
      const halfH = b.h / 2;

      const bGrad = ctx.createLinearGradient(-halfW, -halfH, -halfW, halfH);
      bGrad.addColorStop(0.0, '#664019');
      bGrad.addColorStop(0.5, '#3b220e');
      bGrad.addColorStop(1.0, '#1c0d03');
      ctx.fillStyle = bGrad;
      ctx.fillRect(-halfW, -halfH, b.w, b.h);

      ctx.strokeStyle = '#100702';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(-halfW, -halfH, b.w, b.h);

      drawMossClump(ctx, -halfW, -halfH, b.w, 2.8);
      ctx.restore();
    }
  }

  ctx.restore();
}
