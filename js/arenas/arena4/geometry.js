// =========================================================================
// ARENAS/ARENA4/GEOMETRY.JS - PROCEDURALNA ARCHITEKTURA BAZALTOWA I PRZEMYSŁOWA
// Fasetowane kolumny obsydianu, stalowe kratownice, pionowe łańcuchy i kładki
// ZERO ctx.filter, ZERO ctx.shadowBlur - Gwarancja 60 FPS
// =========================================================================

/**
 * Główna funkcja pre-renderująca całą monumentalną architekturę kaldery w skali 1:1 (3800x1500).
 * Zbuforowana w calderaCanvas – brak spadków klatek podczas dynamicznej rozgrywki.
 */
export function renderCalderaStructures(ctx) {
  if (!ctx) return;

  ctx.save();

  // -------------------------------------------------------------------------
  // 1. MONUMENTALNE WIĄZKI KOLUMN BAZALTOWYCH (LEWA: 1120..1260, PRAWA: 1940..2080)
  // -------------------------------------------------------------------------
  drawBasaltColumnCluster(ctx, 1120, 360, 140, 1120, true, 1);
  drawBasaltColumnCluster(ctx, 1940, 360, 140, 1120, false, 2);

  // -------------------------------------------------------------------------
  // 2. DOLNE STACJE SKALNE (LEWA: 850..1120, PRAWA: 2080..2350, y: 1040)
  // -------------------------------------------------------------------------
  drawIndustrialStagingDeck(ctx, 850, 1040, 270, 30, true);
  drawIndustrialStagingDeck(ctx, 2080, 1040, 270, 30, false);

  // -------------------------------------------------------------------------
  // 3. FLANKI: CIĘŻKIE RAMPY BAZALTOWE ZE STALOWĄ KRATOWNICĄ I WSPORNIKAMI
  // -------------------------------------------------------------------------
  // Rampa zachodnia: x: 150..850, y: 600..1040 (kąt 32.1°)
  drawEngineeredBasaltRamp(ctx, 150, 600, 850, 1040, 36, true);
  // Górna półka zachodnia: x: 40..200, y: 600
  drawIndustrialStagingDeck(ctx, 40, 600, 160, 28, true);

  // Rampa wschodnia: x: 2350..3050, y: 1040..600
  drawEngineeredBasaltRamp(ctx, 2350, 1040, 3050, 600, 36, false);
  // Górna półka wschodnia: x: 3000..3160, y: 600
  drawIndustrialStagingDeck(ctx, 3000, 600, 160, 28, false);

  // -------------------------------------------------------------------------
  // 4. KANRTYLEWERY I WSPORNIKI KŁADEK ANKROWANE W KOLUMNACH BAZALTOWYCH
  // -------------------------------------------------------------------------
  // Wsporniki górnego mostu (y: 520) do lewej i prawej kolumny
  drawCantileverSupportBracket(ctx, 1260, 560, 1360, 520);
  drawCantileverSupportBracket(ctx, 1940, 560, 1840, 520);

  // Wsporniki dolnego pomostu (y: 920) do lewej i prawej kolumny
  drawCantileverSupportBracket(ctx, 1260, 970, 1400, 920);
  drawCantileverSupportBracket(ctx, 1940, 970, 1800, 920);

  // -------------------------------------------------------------------------
  // 5. PIONOWE CIĘŻKIE ŁAŃCUCHY PODWIESZENIA (ZERO KRESEK W POPRZEK!)
  // -------------------------------------------------------------------------
  // Pionowe łańcuchy podwieszające górny most (y: 0 do y: 520)
  drawVerticalForgedChain(ctx, 1420, 0, 520);
  drawVerticalForgedChain(ctx, 1600, 0, 520);
  drawVerticalForgedChain(ctx, 1780, 0, 520);

  // Pionowe wieszaki podwieszające dolny pomost z górnego mostu (y: 540 do y: 920)
  drawVerticalHangerAssembly(ctx, 1460, 540, 920);
  drawVerticalHangerAssembly(ctx, 1740, 540, 920);

  // -------------------------------------------------------------------------
  // 6. CIĘŻKIE POMOSTY PRZEMYSŁOWE (KRATOWNICE I DWUTEOWNIKI)
  // -------------------------------------------------------------------------
  // Górny most wiszący (x: 1360..1840, y: 520, w: 480, h: 26)
  drawHeavyIndustrialBridge(ctx, 1360, 520, 480, 26, true);

  // Dolny pomost pośredni (x: 1400..1800, y: 920, w: 400, h: 24)
  drawHeavyIndustrialBridge(ctx, 1400, 920, 400, 24, false);

  // -------------------------------------------------------------------------
  // 7. TWARDE OSŁONY TERENOWE (COVERS)
  // -------------------------------------------------------------------------
  // Schron badawczy Vulcan-01: x: 920, y: 975, w: 85, h: 65
  drawVulcanResearchPod(ctx, 920, 975, 85, 65);

  // Fasetowany głaz obsydianu na górnym moście: x: 1550, y: 470, w: 80, h: 50
  drawFacetedObsidianMonolith(ctx, 1550, 470, 80, 50);

  // Aparatura sejsmiczna z amortyzacją: x: 2160, y: 985, w: 70, h: 55
  drawRuggedSeismicStation(ctx, 2160, 985, 70, 55);

  ctx.restore();
}

/**
 * 1. Rysuje monumentalną wiązkę heksagonalnych kolumn bazaltowych o naturalnych uskokach
 */
export function drawBasaltColumnCluster(ctx, x, topY, w, h, isWest = true, crackSeed = 1) {
  ctx.save();

  // Wiązka 5 wyrazistych pionowych słupów bazaltu o różnych wysokościach
  const subColumns = [
    { xOff: 0.00, wRatio: 0.22, topDelta: isWest ? 35 : 15, baseCol: '#11141b', faceCol: '#181d26', edgeCol: '#252c3b' },
    { xOff: 0.18, wRatio: 0.24, topDelta: isWest ? 0 : 25,  baseCol: '#1a1f2b', faceCol: '#222938', edgeCol: '#333d52' },
    { xOff: 0.38, wRatio: 0.26, topDelta: -25,             baseCol: '#242b3b', faceCol: '#2c3547', edgeCol: '#3e4a63' }, // Główny frontowy
    { xOff: 0.60, wRatio: 0.22, topDelta: isWest ? 18 : 0,  baseCol: '#1a1f2b', faceCol: '#222938', edgeCol: '#333d52' },
    { xOff: 0.78, wRatio: 0.22, topDelta: isWest ? 12 : 30, baseCol: '#11141b', faceCol: '#181d26', edgeCol: '#252c3b' }
  ];

  // A. Podkład skały i cienie
  for (const col of subColumns) {
    const cx = x + col.xOff * w;
    const cw = col.wRatio * w;
    const cy = topY + col.topDelta;
    const ch = h - col.topDelta;

    // Gradient pionowy słupa: chłodny bazalt -> ciemny grafit -> żarzące przypalenie przy magmie
    const grad = ctx.createLinearGradient(0, cy, 0, cy + ch);
    grad.addColorStop(0.00, col.edgeCol);
    grad.addColorStop(0.08, col.faceCol);
    grad.addColorStop(0.50, col.baseCol);
    grad.addColorStop(0.85, '#0b0d12');
    grad.addColorStop(0.96, '#260c07'); // Podświetlenie od lawy
    grad.addColorStop(1.00, '#4a150a');

    ctx.fillStyle = grad;
    ctx.fillRect(cx, cy, cw, ch);

    // B. Fasetowany heksagonalny szczyt słupa (wielobok ścięty 3D)
    ctx.fillStyle = col.edgeCol;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + cw * 0.5, cy - 8);
    ctx.lineTo(cx + cw, cy);
    ctx.lineTo(cx + cw * 0.5, cy + 6);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // C. Pionowe krawędzie fasetowania słupa
    ctx.strokeStyle = col.edgeCol;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx + cw * 0.5, cy + 6);
    ctx.lineTo(cx + cw * 0.5, cy + ch);
    ctx.stroke();

    // D. Poprzeczne spękania chłodzenia bazaltu (cios kolumnowy co 45-85px)
    ctx.strokeStyle = '#090b0e';
    ctx.lineWidth = 2.0;
    for (let py = cy + 45; py < cy + ch - 50; py += 55 + ((cx * 3) % 30)) {
      ctx.beginPath();
      ctx.moveTo(cx, py);
      ctx.lineTo(cx + cw * 0.5, py + 3);
      ctx.lineTo(cx + cw, py - 1);
      ctx.stroke();
    }
  }

  // B. Zewnętrzny obrys ciosu skalnego kolumny
  ctx.strokeStyle = '#323b4d';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x, topY + subColumns[0].topDelta);
  for (let i = 1; i < subColumns.length; i++) {
    const sc = subColumns[i];
    ctx.lineTo(x + sc.xOff * w, topY + sc.topDelta);
    ctx.lineTo(x + (sc.xOff + sc.wRatio) * w, topY + sc.topDelta);
  }
  ctx.lineTo(x + w, topY + h);
  ctx.lineTo(x, topY + h);
  ctx.closePath();
  ctx.stroke();

  // C. Organiczne pęknięcia termiczne wzdłuż szczelin bazaltu
  drawIntegratedMagmaFissure(ctx, x, topY, w, h, crackSeed);

  ctx.restore();
}

/**
 * 2. Rysuje realistyczne, organiczne pęknięcie termiczne biegnące wzdłuż szczelin bazaltowych
 */
export function drawIntegratedMagmaFissure(ctx, x, topY, w, h, seed = 1) {
  ctx.save();

  const isLeft = (seed === 1);
  const baseX = isLeft ? (x + w * 0.38) : (x + w * 0.62);

  // Nieregularna trajektoria podążająca za fugami bloków skalnych
  const path = isLeft ? [
    { x: baseX, y: topY + 90 },
    { x: baseX + 8, y: topY + 180 },
    { x: baseX - 6, y: topY + 310 },
    { x: baseX + 14, y: topY + 440 },
    { x: baseX + 4, y: topY + 590 },
    { x: baseX - 8, y: topY + 730 },
    { x: baseX + 10, y: topY + 870 },
    { x: baseX - 2, y: topY + 1010 }
  ] : [
    { x: baseX, y: topY + 80 },
    { x: baseX - 10, y: topY + 200 },
    { x: baseX + 6, y: topY + 340 },
    { x: baseX - 12, y: topY + 480 },
    { x: baseX + 8, y: topY + 620 },
    { x: baseX - 4, y: topY + 770 },
    { x: baseX + 12, y: topY + 910 },
    { x: baseX, y: topY + 1030 }
  ];

  // Odnogi boczne pęknięcia
  const offshoots = isLeft ? [
    [{ x: path[2].x, y: path[2].y }, { x: path[2].x + 18, y: path[2].y + 40 }, { x: path[2].x + 24, y: path[2].y + 65 }],
    [{ x: path[4].x, y: path[4].y }, { x: path[4].x - 16, y: path[4].y + 35 }, { x: path[4].x - 22, y: path[4].y + 60 }]
  ] : [
    [{ x: path[2].x, y: path[2].y }, { x: path[2].x - 20, y: path[2].y + 45 }, { x: path[2].x - 26, y: path[2].y + 70 }],
    [{ x: path[4].x, y: path[4].y }, { x: path[4].x + 18, y: path[4].y + 35 }, { x: path[4].x + 24, y: path[4].y + 55 }]
  ];

  // Warstwa 1: Przypalenie i zwęglenie krawędzi pęknięcia
  ctx.strokeStyle = '#050202';
  ctx.lineWidth = 12.0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'bevel';
  renderFissureStrokes(ctx, path, offshoots);

  // Warstwa 2: Zewnętrzna poświata termiczna
  ctx.strokeStyle = 'rgba(234, 88, 12, 0.45)';
  ctx.lineWidth = 8.0;
  renderFissureStrokes(ctx, path, offshoots);

  // Warstwa 3: Nasycony żar lawowy
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 4.0;
  renderFissureStrokes(ctx, path, offshoots);

  // Warstwa 4: Rozżarzony rdzeń biało-żółty
  ctx.strokeStyle = '#fffbeb';
  ctx.lineWidth = 1.6;
  renderFissureStrokes(ctx, path, offshoots);

  // Gorące punkty termiczne w węzłach pęknięć
  for (let i = 1; i < path.length - 1; i += 2) {
    const pt = path[i];
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function renderFissureStrokes(ctx, mainPath, branches) {
  ctx.beginPath();
  ctx.moveTo(mainPath[0].x, mainPath[0].y);
  for (let i = 1; i < mainPath.length; i++) {
    ctx.lineTo(mainPath[i].x, mainPath[i].y);
  }
  for (const br of branches) {
    ctx.moveTo(br[0].x, br[0].y);
    for (let k = 1; k < br.length; k++) {
      ctx.lineTo(br[k].x, br[k].y);
    }
  }
  ctx.stroke();
}

/**
 * 3. Rysuje inżynieryjną rampę bazaltową ze stalową kratownicą i wspornikami (brak pomarańczowych plam!)
 */
export function drawEngineeredBasaltRamp(ctx, x1, y1, x2, y2, thickness = 36, isWest = true) {
  ctx.save();

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx);

  // A. Ciężka ścięta płyta bazaltowa (podbudowa skalna)
  ctx.fillStyle = '#0e1117';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x2, y2 + thickness + 14);
  ctx.lineTo(x1, y1 + thickness + 14);
  ctx.closePath();
  ctx.fill();

  // B. Ciężkie stalowe słupy nośne i zastrzały kratownicy pod rampą
  const numPylons = 5;
  for (let i = 1; i < numPylons; i++) {
    const t = i / numPylons;
    const px = x1 + dx * t;
    const py = y1 + dy * t + thickness;

    // Stalowy słup pionowy
    ctx.fillStyle = '#1e2533';
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 1.5;
    ctx.fillRect(px - 6, py, 12, 38);
    ctx.strokeRect(px - 6, py, 12, 38);

    // Zastrzał krzyżulcowy
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(px - 14, py + 4);
    ctx.lineTo(px + 14, py + 32);
    ctx.moveTo(px + 14, py + 4);
    ctx.lineTo(px - 14, py + 32);
    ctx.stroke();
  }

  // C. Stalowa konstrukcja pomostu roboczego ze stopniami
  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(ang);

  // Główny dwuteownik nośny rampy
  const stringerGrad = ctx.createLinearGradient(0, -4, 0, thickness);
  stringerGrad.addColorStop(0.00, '#475569');
  stringerGrad.addColorStop(0.25, '#334155');
  stringerGrad.addColorStop(0.85, '#1e293b');
  stringerGrad.addColorStop(1.00, '#0f172a');
  ctx.fillStyle = stringerGrad;
  ctx.fillRect(0, 0, len, thickness);

  // Krawędź antypoślizgowa z żółto-czarną taśmą ostrzegawczą
  drawHazardStripesPattern(ctx, 4, 1, len - 8, 5);

  // Stopnie i perforacja kratownicy co 18px
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.5;
  for (let sx = 14; sx < len - 14; sx += 18) {
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx + 5, thickness * 0.65);
    ctx.stroke();
  }

  // Stalowe nity mocujące
  ctx.fillStyle = '#94a3b8';
  for (let sx = 20; sx < len - 20; sx += 36) {
    ctx.beginPath();
    ctx.arc(sx, thickness * 0.78, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Barierki ochronne wzdłuż rampy
  const railH = -22;
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, railH);
  ctx.lineTo(len, railH);
  ctx.stroke();

  // Słupki barierki
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.0;
  for (let sx = 25; sx <= len - 25; sx += 65) {
    ctx.beginPath();
    ctx.moveTo(sx, railH);
    ctx.lineTo(sx, 0);
    ctx.stroke();
  }

  ctx.restore();

  // Czyste, subtelne rozświetlenie dolnej krawędzi od magmy (bez żadnych sztucznych prostokątów!)
  const bottomY = Math.max(y1, y2) + thickness;
  const edgeGlow = ctx.createLinearGradient(0, bottomY, 0, bottomY - 20);
  edgeGlow.addColorStop(0.00, 'rgba(234, 88, 12, 0.28)');
  edgeGlow.addColorStop(1.00, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = edgeGlow;
  ctx.fillRect(Math.min(x1, x2), bottomY - 20, Math.abs(dx), 20);

  ctx.restore();
}

/**
 * 4. Rysuje dolne i boczne platformy stacji technologicznych
 */
export function drawIndustrialStagingDeck(ctx, x, y, w, h, isWest = true) {
  ctx.save();

  // Podkład skalno-stalowy
  const deckGrad = ctx.createLinearGradient(0, y, 0, y + h + 16);
  deckGrad.addColorStop(0.00, '#334155');
  deckGrad.addColorStop(0.20, '#1e293b');
  deckGrad.addColorStop(0.85, '#0f172a');
  deckGrad.addColorStop(1.00, '#070a0e');
  ctx.fillStyle = deckGrad;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - (isWest ? 16 : 0), y + h + 12);
  ctx.lineTo(x + (isWest ? 0 : 16), y + h + 12);
  ctx.closePath();
  ctx.fill();

  // Stalowa belka czołowa z nitami
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();

  // Nity montażowe
  ctx.fillStyle = '#cbd5e1';
  for (let px = x + 18; px < x + w - 18; px += 28) {
    ctx.beginPath();
    ctx.arc(px, y + 8, 2.0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Taśma ostrzegawcza
  drawHazardStripesPattern(ctx, x + 10, y + 1, 45, 5);
  drawHazardStripesPattern(ctx, x + w - 55, y + 1, 45, 5);

  ctx.restore();
}

/**
 * 5. Prawdziwe pionowe łańcuchy podwieszenia ze stali kutej (spadające z góry do dołu)
 */
export function drawVerticalForgedChain(ctx, x, startY, endY) {
  ctx.save();

  // A. Kotwa sufitowa / jarzmo montażowe w stropie kaldery
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.0;
  ctx.fillRect(x - 14, startY, 28, 22);
  ctx.strokeRect(x - 14, startY, 28, 22);

  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(x, startY + 11, 4.0, 0, Math.PI * 2);
  ctx.fill();

  // B. Pionowe ogniwa łańcucha (naprzemienne bez obrotu macierzy!)
  const linkH = 15;
  const linkW = 8;
  for (let y = startY + 22; y < endY - 32; y += linkH) {
    const isAlt = (Math.floor(y / linkH) % 2 === 0);

    if (isAlt) {
      // Ogniwo widoczne od frontu (szeroki owal z otworem)
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(x, y + linkH * 0.5, linkW * 0.5, linkH * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(x, y + linkH * 0.5, linkW * 0.22, linkH * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Ogniwo obrócone o 90 stopni (węższe, profilowane)
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.3;
      ctx.fillRect(x - 2.5, y + linkH * 0.15, 5, linkH * 0.7);
      ctx.strokeRect(x - 2.5, y + linkH * 0.15, 5, linkH * 0.7);
    }
  }

  // C. Siłownik hydrauliczny napinający tuż nad kładką
  drawHeavyTurnbuckle(ctx, x, endY - 30);

  ctx.restore();
}

/**
 * 6. Pionowy wieszak podwieszający dolny pomost z górnego mostu
 */
export function drawVerticalHangerAssembly(ctx, x, startY, endY) {
  ctx.save();

  // Pręt stalowy wysokiej wytrzymałości
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(x - 3.5, startY, 7, endY - startY);
  ctx.strokeRect(x - 3.5, startY, 7, endY - startY);

  // Śruba rzymska napinająca (turnbuckle) w środku wysokości
  const midY = (startY + endY) * 0.5;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x - 7, midY - 14, 14, 28);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - 7, midY - 14, 14, 28);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x - 3, midY - 8, 6, 16);

  ctx.restore();
}

/**
 * 7. Siłownik naciągowy / napinacz łańcucha z manometrem
 */
export function drawHeavyTurnbuckle(ctx, x, y) {
  ctx.save();

  // Korpus cylindra napinacza
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.8;
  ctx.fillRect(x - 9, y, 18, 28);
  ctx.strokeRect(x - 9, y, 18, 28);

  // Tłoczysko chromowane
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(x - 3.5, y + 6, 7, 16);

  // Manometr ciśnienia naciągu
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(x + 7, y + 14, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.restore();
}

/**
 * 8. Zastrzał wsporczy (knee brace) łączący kolumnę bazaltową z pomostem
 */
export function drawCantileverSupportBracket(ctx, colX, colY, deckX, deckY) {
  ctx.save();

  // Masywny dwuteownik stalowy zakotwiczony pod kątem
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 6.0;
  ctx.beginPath();
  ctx.moveTo(colX, colY);
  ctx.lineTo(deckX, deckY + 12);
  ctx.stroke();

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(colX, colY);
  ctx.lineTo(deckX, deckY + 12);
  ctx.stroke();

  // Płyta montażowa w skale z nitami
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(colX - 4, colY - 12, 8, 24);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(colX - 4, colY - 12, 8, 24);

  ctx.restore();
}

/**
 * 9. Ciężki pomost przemysłowy (kratownica, dwuteowniki i pasy ostrzegawcze)
 */
export function drawHeavyIndustrialBridge(ctx, x, y, w, h, hasRailings = true) {
  ctx.save();

  // A. Dolna kratownica nośna z dwuteowników (I-beam truss)
  const beamGrad = ctx.createLinearGradient(0, y, 0, y + h);
  beamGrad.addColorStop(0.00, '#475569');
  beamGrad.addColorStop(0.20, '#334155');
  beamGrad.addColorStop(0.85, '#1e293b');
  beamGrad.addColorStop(1.00, '#0f172a');
  ctx.fillStyle = beamGrad;
  ctx.fillRect(x, y, w, h);

  // Pasy dwuteownika (kołnierze górny i dolny)
  ctx.fillStyle = '#64748b';
  ctx.fillRect(x, y, w, 4);
  ctx.fillRect(x, y + h - 4, w, 4);

  // Pionowe żebra wzmacniające z nitami co 40px
  ctx.fillStyle = '#1e293b';
  for (let bx = x + 25; bx < x + w - 20; bx += 42) {
    ctx.fillRect(bx, y + 4, 6, h - 8);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(bx + 1.5, y + 6, 3, 3);
    ctx.fillRect(bx + 1.5, y + h - 9, 3, 3);
    ctx.fillStyle = '#1e293b';
  }

  // B. Ażurowa kratownica pomostowa (industrial grating)
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.0;
  for (let gx = x + 8; gx < x + w - 8; gx += 14) {
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + 5);
    ctx.stroke();
  }

  // C. Pasy ostrzegawcze (hazard stripes) na obu końcach
  drawHazardStripesPattern(ctx, x + 6, y + 2, 50, 5);
  drawHazardStripesPattern(ctx, x + w - 56, y + 2, 50, 5);

  // D. Barierki techniczne z żółtymi lampami ostrzegawczymi
  if (hasRailings) {
    const railY = y - 26;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(x, railY);
    ctx.lineTo(x + w, railY);
    ctx.stroke();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, railY + 13);
    ctx.lineTo(x + w, railY + 13);
    ctx.stroke();

    // Słupki barierki
    for (let postX = x + 20; postX <= x + w - 20; postX += 60) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(postX - 2, railY, 4, 26);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.strokeRect(postX - 2, railY, 4, 26);
    }

    // Tabliczka informacyjna
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x + w * 0.5 - 32, railY + 2, 64, 10);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('HIGH VOLCANIC RISK', x + w * 0.5 - 30, railY + 10);
  }

  ctx.restore();
}

/**
 * Pasy ostrzegawcze (czarno-żółte)
 */
export function drawHazardStripesPattern(ctx, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.fillStyle = '#eab308';
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = '#0f172a';
  for (let sx = x - h; sx < x + w + h; sx += 8) {
    ctx.beginPath();
    ctx.moveTo(sx, y);
    ctx.lineTo(sx + 4, y);
    ctx.lineTo(sx - 2, y + h);
    ctx.lineTo(sx - 6, y + h);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 10. Schron badawczy Vulcan-01 z tłoczonymi panelami i ryglowaniem
 */
export function drawVulcanResearchPod(ctx, x, y, w, h) {
  ctx.save();

  // Bryła schronu
  const bGrad = ctx.createLinearGradient(x, y, x, y + h);
  bGrad.addColorStop(0.00, '#7f1d1d');
  bGrad.addColorStop(0.40, '#5c1d1d');
  bGrad.addColorStop(1.00, '#300d0d');
  ctx.fillStyle = bGrad;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 2.0;
  ctx.strokeRect(x, y, w, h);

  // Wzmocnienia tłoczone w blasze
  ctx.strokeStyle = '#280a0a';
  ctx.lineWidth = 2.5;
  for (let cx = x + 14; cx < x + w - 10; cx += 16) {
    ctx.beginPath();
    ctx.moveTo(cx, y + 4);
    ctx.lineTo(cx, y + h - 4);
    ctx.stroke();

    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(cx + 2, y + 4);
    ctx.lineTo(cx + 2, y + h - 4);
    ctx.stroke();
    ctx.strokeStyle = '#280a0a';
    ctx.lineWidth = 2.5;
  }

  // Wrota pancerne z ryglem kołowym
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + 10, y + 10, 24, h - 20);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 10, y + 10, 24, h - 20);

  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(x + 22, y + h * 0.5, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Dioda statusowa LED
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(x + 18, y + 14, 8, 3);

  // Tablica identyfikacyjna
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + 38, y + 10, 42, 12);
  ctx.fillStyle = '#fca5a5';
  ctx.font = 'bold 7px monospace';
  ctx.fillText('VULCAN-01', x + 40, y + 19);

  ctx.restore();
}

/**
 * 11. Fasetowany głaz obsydianowy z ostrymi krawędziami fazowanymi
 */
export function drawFacetedObsidianMonolith(ctx, x, y, w, h) {
  ctx.save();

  const pts = [
    { x: x, y: y + h },
    { x: x + 6, y: y + h * 0.35 },
    { x: x + w * 0.35, y: y },
    { x: x + w * 0.72, y: y + 4 },
    { x: x + w, y: y + h * 0.40 },
    { x: x + w - 8, y: y + h }
  ];

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();

  const oGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  oGrad.addColorStop(0.00, '#333d52');
  oGrad.addColorStop(0.40, '#1c222e');
  oGrad.addColorStop(1.00, '#0a0d13');
  ctx.fillStyle = oGrad;
  ctx.fill();

  ctx.strokeStyle = '#4a5568';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Wewnętrzne fasety odłamu
  ctx.strokeStyle = '#181d26';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pts[2].x, pts[2].y);
  ctx.lineTo(x + w * 0.52, y + h * 0.62);
  ctx.lineTo(pts[0].x, pts[0].y);
  ctx.moveTo(x + w * 0.52, y + h * 0.62);
  ctx.lineTo(pts[4].x, pts[4].y);
  ctx.stroke();

  // Mikropęknięcie z żarem
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.48, y + 12);
  ctx.lineTo(x + w * 0.54, y + 26);
  ctx.lineTo(x + w * 0.68, y + 42);
  ctx.stroke();

  ctx.restore();
}

/**
 * 12. Aparatura sejsmiczna Vulcan
 */
export function drawRuggedSeismicStation(ctx, x, y, w, h) {
  ctx.save();

  // Obudowa skrzyni aparaturowej
  ctx.fillStyle = '#6b2d07';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 2.0;
  ctx.strokeRect(x, y, w, h);

  // Gumowane narożniki antywstrząsowe
  ctx.fillStyle = '#1c1917';
  for (const [cx, cy] of [[x, y], [x + w - 8, y], [x, y + h - 8], [x + w - 8, y + h - 8]]) {
    ctx.fillRect(cx, cy, 8, 8);
  }

  // Panel aparatury ze wskaźnikiem fali
  ctx.fillStyle = '#0c0a09';
  ctx.fillRect(x + 10, y + 8, w - 20, 18);
  ctx.strokeStyle = '#292524';
  ctx.lineWidth = 1.0;
  ctx.strokeRect(x + 10, y + 8, w - 20, 18);

  // Wykres sejsmiczny (zielona sinusoida)
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let px = x + 12; px < x + w - 12; px += 3) {
    const sy = y + 17 + Math.sin((px - x) * 0.5) * 4;
    if (px === x + 12) ctx.moveTo(px, sy);
    else ctx.lineTo(px, sy);
  }
  ctx.stroke();

  // Diody LED
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(x + 12, y + h - 14, 4, 4);
  ctx.fillStyle = '#eab308';
  ctx.fillRect(x + 20, y + h - 14, 4, 4);

  ctx.restore();
}
