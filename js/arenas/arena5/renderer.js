// =========================================================================
// ARENAS/ARENA5/RENDERER.JS - RENDERER PREFABRYKATORA ORBITALNEGO (SEKTOR 05)
// Wizualia: Surowy szyb fabryczny, moduły kontenerowe ISO,
// laserowe wiązki ostrzegawcze suwnic, eksplozje czyszczenia linii i utylizator
// Standard: 60 FPS, Zero Emojis, Military Industrial Aesthetic
// =========================================================================

import {
  CELL_SIZE,
  COLS,
  SHAFT_LEFT,
  SHAFT_RIGHT,
  WALL_WIDTH,
  ARENA_LEFT,
  ARENA_RIGHT,
  BASE_FLOOR_Y,
  getGridX,
  getGridY,
  arena5State
} from './state.js';

/**
 * Renderuje tło szybu fabrycznego w przestrzeni ekranu (przed postaciami i transformatą kamery)
 */
export function drawArena5Background(ctx, camera) {
  if (!ctx) return;

  const canvasWidth = (ctx.canvas && ctx.canvas.width) ? (ctx.canvas.clientWidth || ctx.canvas.width) : 1920;
  const canvasHeight = (ctx.canvas && ctx.canvas.height) ? (ctx.canvas.clientHeight || ctx.canvas.height) : 1080;

  ctx.save();

  // Głębokie, surowe tło przemysłowego silosu orbitalnego wypełniające cały ekran
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  bgGrad.addColorStop(0, '#060a12');
  bgGrad.addColorStop(0.5, '#0a101d');
  bgGrad.addColorStop(1, '#05070d');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.restore();
}

/**
 * Renderuje elementy areny na pierwszym planie (ściany, klocki, lasery ostrzegawcze, utylizator)
 * w przestrzeni świata gry
 */
export function drawArena5Foreground(ctx, camera) {
  if (!ctx || !camera) return;

  ctx.save();

  // 1. Tło wewnętrzne szybu (szyny i siatka)
  drawShaftBackdrop(ctx, camera);

  // 2. Pancerne ściany szybu po lewej i prawej stronie rozciągające się do końca ekranu
  drawShaftWalls(ctx, camera);

  // 3. Podłoże bazowe (jeśli widoczne w kadrze kamery)
  drawBaseFloor(ctx, camera);

  // 4. Ułożone klocki w wieży
  drawSettledBlocks(ctx, camera);

  // 5. Czerwona migająca z poświatą linia na górnej krawędzi bloczków pod spadającymi klockami
  drawLandingWarningLine(ctx);

  // 6. Spadający kontener (bez wskaźnika opadania)
  drawFallingCraneBlock(ctx);

  // 6. Animacje detonacji pełnych linii
  drawLineClearEffects(ctx);

  // 8. Cząsteczki odłamków
  drawDebris(ctx);

  // 9. Dolny utylizator (strefa śmierci)
  drawBottomRecycler(ctx, camera);

  ctx.restore();
}

/**
 * Rysuje tło wewnętrzne szybu (pionowe i poziome elementy konstrukcyjne oraz zębate szyny)
 */
function drawShaftBackdrop(ctx, camera) {
  const camY = camera.y;
  const viewHeight = camera.viewHeight || (1080 / (camera.zoom || 0.75));
  const topY = camY - 200;
  const h = viewHeight + 400;

  ctx.save();
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
  ctx.lineWidth = 1.5;

  // Pionowe linie kolumn wewnątrz szybu
  for (let c = 0; c <= COLS; c++) {
    const gx = SHAFT_LEFT + c * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(gx, topY);
    ctx.lineTo(gx, topY + h);
    ctx.stroke();
  }

  // Poziome dźwigary konstrukcyjne co 200 px
  const startGridY = Math.floor(topY / 200) * 200;
  for (let gy = startGridY; gy <= topY + h; gy += 200) {
    ctx.beginPath();
    ctx.moveTo(SHAFT_LEFT, gy);
    ctx.lineTo(SHAFT_RIGHT, gy);
    ctx.stroke();

    ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.fillRect(SHAFT_LEFT, gy - 4, 8, 8);
    ctx.fillRect(SHAFT_RIGHT - 8, gy - 4, 8, 8);
  }

  // Zębate szyny hydrauliczne po bokach
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(SHAFT_LEFT - 24, topY, 24, h);
  ctx.fillRect(SHAFT_RIGHT, topY, 24, h);

  ctx.fillStyle = '#1e293b';
  const startToothY = Math.floor(topY / 40) * 40;
  for (let ty = startToothY; ty <= topY + h; ty += 40) {
    ctx.fillRect(SHAFT_LEFT - 20, ty, 14, 18);
    ctx.fillRect(SHAFT_RIGHT + 6, ty, 14, 18);
  }
  ctx.restore();
}

/**
 * Rysuje pancerne ściany szybu rozciągające się do końca ekranów
 */
function drawShaftWalls(ctx, camera) {
  const camY = camera.y;
  const viewHeight = camera.viewHeight || (1080 / (camera.zoom || 0.75));
  const topY = camY - 200;
  const h = viewHeight + 400;

  // Lewa ściana: wypełnia wszystko od dalekiego brzegu po lewej aż do SHAFT_LEFT
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(camera.x - 3000, topY, 3000 + SHAFT_LEFT, h);

  // Prawa ściana: wypełnia wszystko od SHAFT_RIGHT aż do dalekiego brzegu po prawej
  ctx.fillRect(SHAFT_RIGHT, topY, 3000 + (camera.viewWidth || 1600), h);

  // Żółto-czarne pasy ostrzegawcze na krawędziach wewnętrznych
  drawHazardStripes(ctx, SHAFT_LEFT - 24, topY, 24, h);
  drawHazardStripes(ctx, SHAFT_RIGHT, topY, 24, h);

  // Napisy taktyczne na ścianach
  ctx.save();
  ctx.font = '900 12px monospace';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
  ctx.textAlign = 'center';

  const startTextY = Math.floor(topY / 300) * 300;
  for (let ty = startTextY; ty < topY + h; ty += 300) {
    ctx.fillText('SEKTOR 05 // SZYB PREFABRYKATÓW', SHAFT_LEFT - 80, ty);
    ctx.fillText('UWAGA: ZRZUT PIONOWY', SHAFT_RIGHT + 80, ty);
  }
  ctx.restore();
}

/**
 * Rysuje pasy ostrzegawcze (hazard stripes)
 */
function drawHazardStripes(ctx, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 10;
  const stripeStep = 24;
  const startY = Math.floor(y / stripeStep) * stripeStep - w;
  for (let sy = startY; sy < y + h + w; sy += stripeStep) {
    ctx.beginPath();
    ctx.moveTo(x - 5, sy);
    ctx.lineTo(x + w + 5, sy + w);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Rysuje płytę fundamentową (wznoszącą się wraz z klockami i kamerą)
 */
function drawBaseFloor(ctx, camera) {
  const floorY = (arena5State && typeof arena5State.currentFloorY === 'number')
    ? arena5State.currentFloorY
    : BASE_FLOOR_Y;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(SHAFT_LEFT - 100, floorY, (COLS * CELL_SIZE) + 200, 5000);

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.strokeRect(SHAFT_LEFT - 100, floorY, (COLS * CELL_SIZE) + 200, 5000);

  // Górna krawędź fundamentu z fazowaniem
  ctx.fillStyle = '#475569';
  ctx.fillRect(SHAFT_LEFT - 100, floorY, (COLS * CELL_SIZE) + 200, 6);

  // Przemysłowe skośne pasy ostrzegawcze na krawędzi platformy
  ctx.save();
  ctx.beginPath();
  ctx.rect(SHAFT_LEFT - 100, floorY + 6, (COLS * CELL_SIZE) + 200, 14);
  ctx.clip();
  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(SHAFT_LEFT - 100, floorY + 6, (COLS * CELL_SIZE) + 200, 14);
  ctx.fillStyle = '#0f172a';
  for (let x = SHAFT_LEFT - 120; x < SHAFT_LEFT + (COLS * CELL_SIZE) + 120; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, floorY + 20);
    ctx.lineTo(x + 14, floorY + 20);
    ctx.lineTo(x + 24, floorY + 6);
    ctx.lineTo(x + 10, floorY + 6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Wyznacza, które krawędzie komórki stanowią zewnętrzny obrys jej figury Tetris
 */
export function getCellOuterEdges(cell) {
  const pId = cell.pieceId;
  const col = cell.col;
  const row = cell.row;

  const rowAbove = arena5State.gridRows.get(row + 1);
  const cellAbove = rowAbove ? rowAbove[col] : null;
  const hasTop = !!(cellAbove && cellAbove.hp > 0 && cellAbove.pieceId === pId);

  const rowBelow = arena5State.gridRows.get(row - 1);
  const cellBelow = rowBelow ? rowBelow[col] : null;
  const hasBottom = !!(cellBelow && cellBelow.hp > 0 && cellBelow.pieceId === pId);

  const rowData = arena5State.gridRows.get(row);
  const cellLeft = (col > 0 && rowData) ? rowData[col - 1] : null;
  const hasLeft = !!(cellLeft && cellLeft.hp > 0 && cellLeft.pieceId === pId);

  const cellRight = (col < COLS - 1 && rowData) ? rowData[col + 1] : null;
  const hasRight = !!(cellRight && cellRight.hp > 0 && cellRight.pieceId === pId);

  return {
    top: !hasTop,
    bottom: !hasBottom,
    left: !hasLeft,
    right: !hasRight
  };
}

/**
 * Rysuje wszystkie ułożone klocki w wieży z wyrazistym obrysem figur i frustum cullingiem
 */
function drawSettledBlocks(ctx, camera) {
  const camY = camera ? camera.y : 0;
  const viewHeight = camera ? (camera.viewHeight || (1080 / (camera.zoom || 0.75))) : 1080;
  const camTop = camY - 120;
  const camBottom = camY + viewHeight + 120;

  for (const rowData of arena5State.gridRows.values()) {
    if (!rowData) continue;
    for (let c = 0; c < COLS; c++) {
      const cell = rowData[c];
      if (!cell || cell.hp <= 0) continue;
      if (cell.y + cell.h < camTop || cell.y > camBottom) continue;

      const outerEdges = getCellOuterEdges(cell);
      drawSingleBlock(ctx, cell.x, cell.y, cell.w, cell.h, cell.material, cell.hp, cell.maxHp, outerEdges, cell.accentColor);
    }
  }
}

/**
 * Rysuje pojedynczy kafelek kontenera wg jego materiału, stanu uszkodzeń oraz obwódek figury
 */
export function drawSingleBlock(ctx, x, y, w, h, material, hp, maxHp, outerEdges = null, accentColor = null) {
  ctx.save();

  const edges = outerEdges || { top: true, bottom: true, left: true, right: true };
  const borderCol = accentColor || '#eab308';

  // 1. WYPEŁNIENIE I TEKSTURA PRZEMYSŁOWA MATERIAŁU
  if (material === 'STEEL') {
    // Ciężki stalowy kontener ISO
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, w, h);

    // Wewnętrzne wytłoczenia blachy ryflowanej
    ctx.fillStyle = '#0f172a';
    for (let rx = x + 12; rx < x + w - 12; rx += 16) {
      ctx.fillRect(rx, y + 10, 8, h - 20);
    }

    // Delikatne szwy wewnętrzne na łączeniach komórek tej samej figury
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
    ctx.lineWidth = 1;
    if (!edges.top) { ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.lineTo(x + w - 4, y); ctx.stroke(); }
    if (!edges.bottom) { ctx.beginPath(); ctx.moveTo(x + 4, y + h); ctx.lineTo(x + w - 4, y + h); ctx.stroke(); }
    if (!edges.left) { ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x, y + h - 4); ctx.stroke(); }
    if (!edges.right) { ctx.beginPath(); ctx.moveTo(x + w, y + 4); ctx.lineTo(x + w, y + h - 4); ctx.stroke(); }

    // Oznaczenie taktyczne
    ctx.font = '900 8.5px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillText('PMC-100', x + 14, y + 22);

  } else if (material === 'CONCRETE_CRACKED') {
    // Pęknięty żelbet
    ctx.fillStyle = '#334155';
    ctx.fillRect(x, y, w, h);

    // Widoczne pęknięcia
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x + 15, y + 5);
    ctx.lineTo(x + 40, y + 45);
    ctx.lineTo(x + 30, y + 80);
    ctx.lineTo(x + 65, y + 95);
    ctx.stroke();

    // Sterczące zbrojenie
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w - 8, y + 20);
    ctx.lineTo(x + w + 6, y + 14);
    ctx.stroke();

  } else if (material === 'EXPLOSIVE') {
    // Czerwona skrzynia paliwowa / amunicyjna
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(x, y, w, h);

    // Żółto-czarne skośne pasy na krawędziach
    drawHazardStripes(ctx, x + 4, y + 4, w - 8, 12);
    drawHazardStripes(ctx, x + 4, y + h - 16, w - 8, 12);

    // Trójkąt ostrzegawczy z wykrzyknikiem w centrum
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y + 24);
    ctx.lineTo(x + w * 0.5 + 18, y + 58);
    ctx.lineTo(x + w * 0.5 - 18, y + 58);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = '900 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', x + w * 0.5, y + 52);

  } else if (material === 'SCAFFOLDING') {
    // Pomost ażurowy / krata podłogowa
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(x, y, w, h);

    // Ażurowa siatka
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1.2;
    for (let gx = x + 10; gx < x + w; gx += 14) {
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + h);
      ctx.stroke();
    }
    for (let gy = y + 10; gy < y + h; gy += 14) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();
    }
  }

  // 2. WYRAZISTA OBWÓDKA FIGURY (TETRIS SHAPE CONTOUR)
  // Rysowana wyłącznie na zewnętrznych krawędziach figury!
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'square';

  if (edges.top) {
    ctx.beginPath();
    ctx.moveTo(x, y + 1.75);
    ctx.lineTo(x + w, y + 1.75);
    ctx.stroke();
  }
  if (edges.bottom) {
    ctx.beginPath();
    ctx.moveTo(x, y + h - 1.75);
    ctx.lineTo(x + w, y + h - 1.75);
    ctx.stroke();
  }
  if (edges.left) {
    ctx.beginPath();
    ctx.moveTo(x + 1.75, y);
    ctx.lineTo(x + 1.75, y + h);
    ctx.stroke();
  }
  if (edges.right) {
    ctx.beginPath();
    ctx.moveTo(x + w - 1.75, y);
    ctx.lineTo(x + w - 1.75, y + h);
    ctx.stroke();
  }

  // 3. NAROŻNIKI KONTENERA ISO NA ZEWNĘTRZNYCH ROGACH FIGURY
  ctx.fillStyle = borderCol;
  const cSize = 7;
  if (edges.top && edges.left) {
    ctx.fillRect(x + 2, y + 2, cSize, cSize);
  }
  if (edges.top && edges.right) {
    ctx.fillRect(x + w - cSize - 2, y + 2, cSize, cSize);
  }
  if (edges.bottom && edges.left) {
    ctx.fillRect(x + 2, y + h - cSize - 2, cSize, cSize);
  }
  if (edges.bottom && edges.right) {
    ctx.fillRect(x + w - cSize - 2, y + h - cSize - 2, cSize, cSize);
  }

  // 4. Wskaźnik uszkodzeń (jeśli zdrowie < maxHp)
  if (hp < maxHp) {
    const dmgRatio = Math.max(0, hp / maxHp);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x + 10, y + h - 9, w - 20, 5);

    ctx.fillStyle = dmgRatio > 0.4 ? '#22c55e' : '#ef4444';
    ctx.fillRect(x + 10, y + h - 9, (w - 20) * dmgRatio, 5);
  }

  ctx.restore();
}

/**
 * Rysuje czerwoną migającą z poświatą linię na górnej krawędzi bloczków (lub podłogi),
 * na które spadną dane segmenty opadającej figury.
 */
function drawLandingWarningLine(ctx) {
  const crane = arena5State.crane;
  if (!crane || crane.phase !== 'FALLING' || !crane.shape) return;

  const minRow = arena5State.minFloorRow || 0;
  const currentFloorY = (arena5State && typeof arena5State.currentFloorY === 'number')
    ? arena5State.currentFloorY
    : BASE_FLOOR_Y;

  // Sprawdź każdą unikalną kolumnę zajmowaną przez spadający kształt i znajdź jej dolną komórkę
  const colBottomMap = new Map();
  for (const cell of crane.shapeCells) {
    const wCol = crane.col + cell.colRel;
    if (!colBottomMap.has(wCol) || cell.rowRel < colBottomMap.get(wCol).rowRel) {
      colBottomMap.set(wCol, cell);
    }
  }

  const now = performance.now();

  ctx.save();

  for (const [wCol, bottomCell] of colBottomMap.entries()) {
    if (wCol < 0 || wCol >= COLS) continue;

    // Szukamy najwyższego bloku poniżej tej kolumny figury
    let surfaceY = currentFloorY;

    for (let r = arena5State.highestRowIndex + 4; r >= minRow; r--) {
      const rData = arena5State.gridRows.get(r);
      if (rData && rData[wCol] && rData[wCol].hp > 0) {
        surfaceY = rData[wCol].y;
        break;
      }
    }

    // Bieżąca dolna krawędź tej kolumny spadającej figury
    const cellBottomY = crane.currentY + (crane.shape.h - bottomCell.rowRel) * CELL_SIZE;
    const distToSurface = surfaceY - cellBottomY;

    // Czerwona migająca linia pojawia się na górnej krawędzi gdy klocek opada
    if (distToSurface >= -10 && distToSurface <= 1200) {
      const proximity = Math.max(0, Math.min(1, 1 - (distToSurface / 900)));
      // Im bliżej uderzenia, tym szybsze i intensywniejsze miganie (od 6 Hz do 14 Hz)
      const pulseRate = 0.014 + 0.018 * proximity;
      const blink = 0.35 + 0.65 * Math.pow(Math.abs(Math.sin(now * pulseRate)), 1.4);
      const intensity = (0.50 + 0.50 * proximity) * blink;

      const bx = getGridX(wCol);
      const bw = CELL_SIZE;

      // 1. Pionowa poświata (Red Glow Aura) nad i pod krawędzią
      const glowH = 14 + 6 * proximity;
      const glowGrad = ctx.createLinearGradient(bx, surfaceY - glowH, bx, surfaceY + glowH);
      glowGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
      glowGrad.addColorStop(0.3, `rgba(239, 68, 68, ${0.18 * intensity})`);
      glowGrad.addColorStop(0.5, `rgba(255, 30, 30, ${0.45 * intensity})`);
      glowGrad.addColorStop(0.7, `rgba(239, 68, 68, ${0.18 * intensity})`);
      glowGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = glowGrad;
      ctx.fillRect(bx, surfaceY - glowH, bw, glowH * 2);

      // 2. Warstwa poświaty zewnętrznej
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.40 * intensity})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(bx, surfaceY);
      ctx.lineTo(bx + bw, surfaceY);
      ctx.stroke();

      // 3. Warstwa intensywnego czerwonego lasera z cieniem neonowym
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8 * intensity;
      ctx.strokeStyle = `rgba(255, 50, 50, ${0.85 * intensity})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bx, surfaceY);
      ctx.lineTo(bx + bw, surfaceY);
      ctx.stroke();

      // 4. Rdzeń linii - gorący jasny środek
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(255, 230, 230, ${0.95 * intensity})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx, surfaceY);
      ctx.lineTo(bx + bw, surfaceY);
      ctx.stroke();

      // 5. Taktyczne znaczniki krawędziowe (małe ograniczniki na końcach kolumny)
      ctx.strokeStyle = `rgba(255, 100, 100, ${0.80 * intensity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, surfaceY - 5);
      ctx.lineTo(bx, surfaceY + 5);
      ctx.moveTo(bx + bw, surfaceY - 5);
      ctx.lineTo(bx + bw, surfaceY + 5);
      ctx.stroke();
    }
  }

  ctx.restore();
}

const drawLandingSurfaceShadow = drawLandingWarningLine;

// Wskaźnik opadania klocków został usunięty na życzenie użytkownika (brak laserów i obrysu)
function drawCraneWarning(ctx, camera) {
  // Pusta funkcja zachowana dla wstecznej kompatybilności
}

/**
 * Rysuje spadający klocek z suwnicy z kompletnym obrysem figury
 */
function drawFallingCraneBlock(ctx) {
  const crane = arena5State.crane;
  if (!crane || crane.phase !== 'FALLING' || !crane.shape) return;

  ctx.save();
  for (const cell of crane.shapeCells) {
    const bx = getGridX(crane.col + cell.colRel);
    const by = crane.currentY + (crane.shape.h - 1 - cell.rowRel) * CELL_SIZE;

    // Cień i efekt pędu w dół
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(bx, by - 12, CELL_SIZE, 12);

    const outerEdges = {
      top: !crane.shapeCells.some(o => o.colRel === cell.colRel && o.rowRel === cell.rowRel + 1),
      bottom: !crane.shapeCells.some(o => o.colRel === cell.colRel && o.rowRel === cell.rowRel - 1),
      left: !crane.shapeCells.some(o => o.colRel === cell.colRel - 1 && o.rowRel === cell.rowRel),
      right: !crane.shapeCells.some(o => o.colRel === cell.colRel + 1 && o.rowRel === cell.rowRel)
    };

    drawSingleBlock(ctx, bx, by, CELL_SIZE, CELL_SIZE, cell.material, cell.hp, cell.maxHp, outerEdges, crane.accentColor || crane.shape?.accentColor);
  }
  ctx.restore();
}

/**
 * Rysuje efekty detonacji pełnych linii
 */
function drawLineClearEffects(ctx) {
  for (const clear of arena5State.activeLineClears) {
    const tRatio = clear.timer / clear.maxTimer;
    const ly = clear.y;

    ctx.save();
    // Błysk wybuchu w rzędzie
    ctx.fillStyle = `rgba(251, 191, 36, ${0.6 * tRatio})`;
    ctx.fillRect(SHAFT_LEFT, ly - CELL_SIZE * 0.5, COLS * CELL_SIZE, CELL_SIZE);

    ctx.strokeStyle = `rgba(239, 68, 68, ${tRatio})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(SHAFT_LEFT, ly);
    ctx.lineTo(SHAFT_RIGHT, ly);
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Rysuje odłamki zniszczonych klocków
 */
function drawDebris(ctx) {
  for (const p of arena5State.debrisParticles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color || '#475569';
    ctx.fillRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h);
    ctx.restore();
  }
}

/**
 * Rysuje dolny utylizator (laserową strefę mielenia odpadów)
 */
function drawBottomRecycler(ctx, camera) {
  const bottomY = arena5State.recyclerY;
  // Na starcie rozgrywki (gdy utylizator spoczywa pod ziemią) nie rysujemy strefy śmierci
  if (bottomY >= BASE_FLOOR_Y) return;

  const viewWidth = camera.viewWidth || (1920 / (camera.zoom || 0.75));

  ctx.save();

  // Czerwona poświata dolnej strefy śmierci
  const pulse = 0.75 + 0.25 * Math.sin(performance.now() * 0.02);
  const deathGrad = ctx.createLinearGradient(camera.x, bottomY - 60, camera.x, bottomY + 120);
  deathGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
  deathGrad.addColorStop(0.5, `rgba(220, 38, 38, ${0.55 * pulse})`);
  deathGrad.addColorStop(1, 'rgba(153, 27, 27, 0.95)');

  ctx.fillStyle = deathGrad;
  ctx.fillRect(camera.x - 50, bottomY - 60, viewWidth + 100, 180);

  // Zębate laserowe linie mielenia
  ctx.strokeStyle = `rgba(254, 202, 202, ${pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = camera.x - 50; x < camera.x + viewWidth + 50; x += 30) {
    ctx.moveTo(x, bottomY);
    ctx.lineTo(x + 15, bottomY - 14);
    ctx.lineTo(x + 30, bottomY);
  }
  ctx.stroke();

  // Napis ostrzegawczy na dole
  ctx.font = '900 11px monospace';
  ctx.fillStyle = '#fee2e2';
  ctx.textAlign = 'center';
  ctx.fillText('STREFA UTYLIZACJI // ŚMIERĆ PRZY UPADKU', SHAFT_LEFT + (COLS * CELL_SIZE) * 0.5, bottomY + 22);

  ctx.restore();
}
