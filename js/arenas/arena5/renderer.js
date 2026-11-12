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

  // 10. Kinowy baner taktyczny aktywnej dyrektywy architektonicznej wieży
  drawArena5DirectiveBanner(ctx, camera);

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
    ctx.fillText('DYREKTYWA: ' + (arena5State.directiveName || 'AKTYWNA'), SHAFT_LEFT - 80, ty + 24);
    ctx.fillText('DYREKTYWA: ' + (arena5State.directiveName || 'AKTYWNA'), SHAFT_RIGHT + 80, ty + 24);
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
const _materialTileCache = new Map();

function getMaterialTileCanvas(material) {
  const key = material || 'STEEL';
  if (_materialTileCache.has(key)) return _materialTileCache.get(key);
  if (typeof document === 'undefined') return null;

  const tile = document.createElement('canvas');
  tile.width = CELL_SIZE;
  tile.height = CELL_SIZE;
  const tctx = tile.getContext('2d');
  if (!tctx) return null;

  const w = CELL_SIZE;
  const h = CELL_SIZE;

  if (key === 'STEEL') {
    tctx.fillStyle = '#1e293b';
    tctx.fillRect(0, 0, w, h);
    tctx.fillStyle = '#0f172a';
    for (let rx = 12; rx < w - 12; rx += 16) {
      tctx.fillRect(rx, 10, 8, h - 20);
    }
    tctx.font = '900 8.5px monospace';
    tctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    tctx.fillText('PMC-100', 14, 22);
  } else if (key === 'CONCRETE_CRACKED') {
    tctx.fillStyle = '#334155';
    tctx.fillRect(0, 0, w, h);
    tctx.strokeStyle = '#0f172a';
    tctx.lineWidth = 1.8;
    tctx.beginPath();
    tctx.moveTo(15, 5);
    tctx.lineTo(40, 45);
    tctx.lineTo(30, 80);
    tctx.lineTo(65, 95);
    tctx.stroke();
    tctx.strokeStyle = '#eab308';
    tctx.lineWidth = 2;
    tctx.beginPath();
    tctx.moveTo(w - 14, 20);
    tctx.lineTo(w - 2, 14);
    tctx.stroke();
  } else if (key === 'EXPLOSIVE') {
    tctx.fillStyle = '#7f1d1d';
    tctx.fillRect(0, 0, w, h);
    drawHazardStripes(tctx, 4, 4, w - 8, 12);
    drawHazardStripes(tctx, 4, h - 16, w - 8, 12);
    tctx.fillStyle = '#facc15';
    tctx.beginPath();
    tctx.moveTo(w * 0.5, 24);
    tctx.lineTo(w * 0.5 + 18, 58);
    tctx.lineTo(w * 0.5 - 18, 58);
    tctx.closePath();
    tctx.fill();
    tctx.fillStyle = '#000000';
    tctx.font = '900 15px monospace';
    tctx.textAlign = 'center';
    tctx.fillText('!', w * 0.5, 52);
  } else if (key === 'SCAFFOLDING') {
    tctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    tctx.fillRect(0, 0, w, h);
    tctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    tctx.lineWidth = 1.2;
    tctx.beginPath();
    for (let gx = 10; gx < w; gx += 14) {
      tctx.moveTo(gx, 0);
      tctx.lineTo(gx, h);
    }
    for (let gy = 10; gy < h; gy += 14) {
      tctx.moveTo(0, gy);
      tctx.lineTo(w, gy);
    }
    tctx.stroke();
  }

  _materialTileCache.set(key, tile);
  return tile;
}

function drawSettledBlocks(ctx, camera) {
  const camY = camera ? camera.y : 0;
  const viewHeight = camera ? (camera.viewHeight || (1080 / (camera.zoom || 0.75))) : 1080;
  const camTop = camY - 120;
  const camBottom = camY + viewHeight + 120;
  const now = performance.now();

  let clearingRows = null;
  if (Array.isArray(arena5State.activeLineClears) && arena5State.activeLineClears.length > 0) {
    clearingRows = new Set();
    for (let i = 0; i < arena5State.activeLineClears.length; i++) {
      clearingRows.add(arena5State.activeLineClears[i].row);
    }
  }
  const flashWhite = clearingRows && (Math.floor(now * 0.02) % 2 === 0);

  for (const rowData of arena5State.gridRows.values()) {
    if (!rowData) continue;
    for (let c = 0; c < COLS; c++) {
      const cell = rowData[c];
      if (!cell || cell.hp <= 0) continue;
      if (cell.y + cell.h < camTop || cell.y > camBottom) continue;

      const outerEdges = cell._outerEdges || getCellOuterEdges(cell);
      const isClearing = clearingRows !== null && clearingRows.has(cell.row);
      const blockColor = isClearing ? (flashWhite ? '#ffffff' : '#00f0ff') : cell.accentColor;

      drawSingleBlock(ctx, cell.x, cell.y, cell.w, cell.h, cell.material, cell.hp, cell.maxHp, outerEdges, blockColor);

      if (isClearing) {
        const pulse = 0.5 + 0.5 * Math.sin(now * 0.04 + c * 0.4);
        ctx.fillStyle = `rgba(56, 189, 248, ${0.45 + 0.35 * pulse})`;
        ctx.fillRect(cell.x + 3, cell.y + 3, cell.w - 6, cell.h - 6);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.25 + 0.35 * pulse})`;
        ctx.fillRect(cell.x + 12, cell.y + 12, cell.w - 24, cell.h - 24);
      }
    }
  }
}

/**
 * Rysuje pojedynczy kafelek kontenera wg jego materiału, stanu uszkodzeń oraz obwódek figury
 */
export function drawSingleBlock(ctx, x, y, w, h, material, hp, maxHp, outerEdges = null, accentColor = null) {
  const edges = outerEdges || { top: true, bottom: true, left: true, right: true };
  const borderCol = accentColor || '#eab308';

  const tile = getMaterialTileCanvas(material);
  if (tile) {
    ctx.drawImage(tile, x, y, w, h);
  } else {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, w, h);
  }

  // Delikatne szwy wewnętrzne na łączeniach komórek tej samej figury stalowej
  if (material === 'STEEL' && (!edges.top || !edges.bottom || !edges.left || !edges.right)) {
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (!edges.top) { ctx.moveTo(x + 4, y); ctx.lineTo(x + w - 4, y); }
    if (!edges.bottom) { ctx.moveTo(x + 4, y + h); ctx.lineTo(x + w - 4, y + h); }
    if (!edges.left) { ctx.moveTo(x, y + 4); ctx.lineTo(x, y + h - 4); }
    if (!edges.right) { ctx.moveTo(x + w, y + 4); ctx.lineTo(x + w, y + h - 4); }
    ctx.stroke();
  }

  // 2. WYRAZISTA OBWÓDKA FIGURY (TETRIS SHAPE CONTOUR) — jeden batch path
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'square';
  ctx.beginPath();
  if (edges.top) {
    ctx.moveTo(x, y + 1.75);
    ctx.lineTo(x + w, y + 1.75);
  }
  if (edges.bottom) {
    ctx.moveTo(x, y + h - 1.75);
    ctx.lineTo(x + w, y + h - 1.75);
  }
  if (edges.left) {
    ctx.moveTo(x + 1.75, y);
    ctx.lineTo(x + 1.75, y + h);
  }
  if (edges.right) {
    ctx.moveTo(x + w - 1.75, y);
    ctx.lineTo(x + w - 1.75, y + h);
  }
  ctx.stroke();

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
    let highestRowInCol = minRow - 1;

    for (let r = arena5State.highestRowIndex + 4; r >= minRow; r--) {
      const rData = arena5State.gridRows.get(r);
      if (rData && rData[wCol] && rData[wCol].hp > 0) {
        surfaceY = rData[wCol].y;
        highestRowInCol = r;
        break;
      }
    }

    // Cień/ostrzeżenie pojawia się WYŁĄCZNIE na tych powierzchniach, na które klocek faktycznie uderzy
    // (pomijamy nawisy/mosty, pod którymi pozostanie wolna przestrzeń dla graczy):
    const willLandOnSurface = (crane.targetLandingRow + bottomCell.rowRel === highestRowInCol + 1);
    if (!willLandOnSurface) continue;

    // Bieżąca dolna krawędź tej kolumny spadającej figury
    const cellBottomY = crane.currentY + (crane.shape.h - bottomCell.rowRel) * CELL_SIZE;
    const distToSurface = surfaceY - cellBottomY;

    // Czerwona migająca linia pojawia się na górnej krawędzi gdy klocek opada z góry
    if (distToSurface >= -10 && distToSurface <= 1500) {
      const proximity = Math.max(0, Math.min(1, 1 - (distToSurface / 1200)));
      // Im bliżej uderzenia, tym szybsze i intensywniejsze miganie (od 6 Hz do 14 Hz)
      const pulseRate = 0.014 + 0.018 * proximity;
      const blink = 0.35 + 0.65 * Math.pow(Math.abs(Math.sin(now * pulseRate)), 1.4);
      const intensity = (0.50 + 0.50 * proximity) * blink;

      const bx = getGridX(wCol);
      const bw = CELL_SIZE;

      // 1. Pionowa poświata warstwowa bez createLinearGradient (zero alokacji w pętli)
      const glowH = 14 + 6 * proximity;
      ctx.fillStyle = `rgba(239, 68, 68, ${0.14 * intensity})`;
      ctx.fillRect(bx, surfaceY - glowH, bw, glowH * 2);
      ctx.fillStyle = `rgba(255, 30, 30, ${0.28 * intensity})`;
      ctx.fillRect(bx, surfaceY - glowH * 0.45, bw, glowH * 0.9);

      // 2. Warstwa poświaty zewnętrznej
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.40 * intensity})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(bx, surfaceY);
      ctx.lineTo(bx + bw, surfaceY);
      ctx.stroke();

      // 3. Warstwa intensywnego czerwonego lasera (ostry neon wektorowy bez blur)
      ctx.strokeStyle = `rgba(255, 50, 50, ${0.85 * intensity})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bx, surfaceY);
      ctx.lineTo(bx + bw, surfaceY);
      ctx.stroke();

      // 4. Rdzeń linii - gorący jasny środek
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
  if (!crane || (crane.phase !== 'FALLING' && crane.phase !== 'LANDED_WAIT') || !crane.shape) return;

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
 * Rysuje spektakularne, kinowe efekty kasowania linii:
 * 1. Faza ładowania (Charge-up / Overload): neonowe wiązki plazmy, łuki elektryczne, celowniki holograficzne
 * 2. Faza detonacji i powidoku (Disintegration Beam / Afterglow): potężny poziomy promień lasera,
 *    snopy iskier spawania na ścianach, rozpadające się woksele i baner combo.
 */
function drawLineClearEffects(ctx) {
  const now = performance.now();

  // FAZA 1: Ładowanie plazmowe i łuki elektryczne w rzędach przygotowywanych do detonacji
  if (Array.isArray(arena5State.activeLineClears)) {
    for (const clear of arena5State.activeLineClears) {
      const progress = Math.max(0, Math.min(1, 1 - (clear.timer / clear.maxTimer)));
      const ly = clear.y;
      const topY = ly - CELL_SIZE * 0.5;
      const bottomY = ly + CELL_SIZE * 0.5;

      ctx.save();

      // 1. Pulsująca poświata całego rzędu
      const pulse = 0.5 + 0.5 * Math.sin(now * 0.035);
      const rowAlpha = (0.35 + 0.45 * progress) * pulse;
      const rowGrad = ctx.createLinearGradient(0, topY, 0, bottomY);
      rowGrad.addColorStop(0, `rgba(56, 189, 248, ${rowAlpha * 0.6})`);
      rowGrad.addColorStop(0.5, `rgba(255, 255, 255, ${rowAlpha})`);
      rowGrad.addColorStop(1, `rgba(56, 189, 248, ${rowAlpha * 0.6})`);
      ctx.fillStyle = rowGrad;
      ctx.fillRect(SHAFT_LEFT, topY, COLS * CELL_SIZE, CELL_SIZE);

      // 2. Poziome laserowe krawędzie tnące na górze i na dole
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5 + progress * 2.0;
      ctx.beginPath();
      ctx.moveTo(SHAFT_LEFT, topY); ctx.lineTo(SHAFT_RIGHT, topY);
      ctx.moveTo(SHAFT_LEFT, bottomY); ctx.lineTo(SHAFT_RIGHT, bottomY);
      ctx.stroke();

      // 3. Rozbiegające się błyskawice / łuki elektryczne w poprzek rzędu
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(SHAFT_LEFT, ly);
      const segments = 16;
      const segWidth = (SHAFT_RIGHT - SHAFT_LEFT) / segments;
      for (let i = 1; i < segments; i++) {
        const sx = SHAFT_LEFT + i * segWidth;
        const jitter = Math.sin(i * 3.7 + now * 0.05) * (14 * progress);
        ctx.lineTo(sx, ly + jitter);
      }
      ctx.lineTo(SHAFT_RIGHT, ly);
      ctx.stroke();

      // Druga cyanowa poświata łuku
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.7 * pulse})`;
      ctx.stroke();

      // 4. Biegające po rzędzie fotony / punkty plazmy
      const runner1 = (now * 1.8) % (SHAFT_RIGHT - SHAFT_LEFT);
      const runner2 = (SHAFT_RIGHT - SHAFT_LEFT) - ((now * 1.5) % (SHAFT_RIGHT - SHAFT_LEFT));
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(SHAFT_LEFT + runner1 - 15, ly - 4, 30, 8);
      ctx.fillRect(SHAFT_LEFT + runner2 - 15, ly - 4, 30, 8);

      // 5. Centralny taktyczny celownik i napis holograficzny
      const centerX = (SHAFT_LEFT + SHAFT_RIGHT) * 0.5;
      const tagW = 260;
      const tagH = 26;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
      ctx.fillRect(centerX - tagW * 0.5, ly - tagH * 0.5, tagW, tagH);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(centerX - tagW * 0.5, ly - tagH * 0.5, tagW, tagH);

      // Narożniki celownika [ ]
      const cL = 6;
      const bx = centerX - tagW * 0.5;
      const by = ly - tagH * 0.5;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(bx + cL, by); ctx.lineTo(bx, by); ctx.lineTo(bx, by + cL);
      ctx.moveTo(bx + tagW - cL, by); ctx.lineTo(bx + tagW, by); ctx.lineTo(bx + tagW, by + cL);
      ctx.moveTo(bx + cL, by + tagH); ctx.lineTo(bx, by + tagH); ctx.lineTo(bx, by + tagH - cL);
      ctx.moveTo(bx + tagW - cL, by + tagH); ctx.lineTo(bx + tagW, by + tagH); ctx.lineTo(bx + tagW, by + tagH - cL);
      ctx.stroke();

      ctx.font = '900 11px monospace';
      ctx.fillStyle = '#facc15';
      ctx.textAlign = 'center';
      const pct = Math.min(100, Math.floor(progress * 100));
      ctx.fillText(`KRYTYCZNE PRZEŁADOWANIE // ${pct}%`, centerX, ly + 4);

      ctx.restore();
    }
  }

  // FAZA 2 & 3: Kinowy promień dezintegracji lasera i powidok po detonacji
  if (Array.isArray(arena5State.activeLineAfterglows)) {
    for (const ag of arena5State.activeLineAfterglows) {
      const progress = Math.max(0, Math.min(1, 1 - (ag.timer / ag.maxTimer)));
      const fade = Math.max(0, ag.timer / ag.maxTimer);
      const ly = ag.y;
      const topY = ly - CELL_SIZE * 0.5;

      ctx.save();

      // 1. Centralny oślepiający promień rozpadu (Disintegration Beam)
      if (progress < 0.40) {
        const beamFade = Math.sin((progress / 0.40) * Math.PI);
        // Zewnętrzna poświata lasera
        ctx.fillStyle = `rgba(56, 189, 248, ${0.55 * beamFade})`;
        ctx.fillRect(SHAFT_LEFT, ly - 35 * beamFade, COLS * CELL_SIZE, 70 * beamFade);

        // Rdzeń plazmowy
        ctx.fillStyle = `rgba(254, 240, 138, ${0.85 * beamFade})`;
        ctx.fillRect(SHAFT_LEFT, ly - 16 * beamFade, COLS * CELL_SIZE, 32 * beamFade);

        // Biały rdzeń laserowy
        ctx.fillStyle = `rgba(255, 255, 255, ${1.0 * beamFade})`;
        ctx.fillRect(SHAFT_LEFT, ly - 6 * beamFade, COLS * CELL_SIZE, 12 * beamFade);
      } else {
        // Zanikająca cienka linia energii
        ctx.strokeStyle = `rgba(56, 189, 248, ${fade * 0.8})`;
        ctx.lineWidth = 3.0 * fade;
        ctx.beginPath();
        ctx.moveTo(SHAFT_LEFT, ly);
        ctx.lineTo(SHAFT_RIGHT, ly);
        ctx.stroke();
      }

      // 2. Rozbłysk iskier na ścianach szybu
      const wallSparkRadius = 36 * fade;
      if (wallSparkRadius > 2) {
        ctx.fillStyle = `rgba(251, 191, 36, ${fade})`;
        ctx.beginPath();
        ctx.arc(SHAFT_LEFT, ly, wallSparkRadius, 0, Math.PI * 2);
        ctx.arc(SHAFT_RIGHT, ly, wallSparkRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, ${fade * 0.9})`;
        ctx.beginPath();
        ctx.arc(SHAFT_LEFT, ly, wallSparkRadius * 0.5, 0, Math.PI * 2);
        ctx.arc(SHAFT_RIGHT, ly, wallSparkRadius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Rozpadające się woksele (hologramowe klatki komórek rozszerzające się i unoszące)
      const expand = (1 - fade) * 22;
      const liftY = (1 - fade) * -16;
      ctx.strokeStyle = `rgba(0, 240, 255, ${fade * 0.75})`;
      ctx.lineWidth = 1.5;
      for (let c = 0; c < COLS; c++) {
        const bx = getGridX(c) - expand * 0.5;
        const by = topY + liftY - expand * 0.5;
        const bw = CELL_SIZE + expand;
        const bh = CELL_SIZE + expand;
        ctx.strokeRect(bx, by, bw, bh);
      }

      // 4. Pływający taktyczny napis Combo (jeśli zdetonowano więcej niż 1 linię naraz)
      if (ag.combo > 1) {
        ctx.font = '900 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(250, 204, 21, ${fade})`;
        ctx.fillText(`COMBO x${ag.combo} TĄPNIĘCIE!`, (SHAFT_LEFT + SHAFT_RIGHT) * 0.5, ly - 30 - (1 - fade) * 20);
      }

      ctx.restore();
    }
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

/**
 * Rysuje kinowy, taktyczny baner informujący o aktywnej dyrektywie budowy wieży (np. BLIŹNIACZE BASTIONY, UKŁAD KLASYCZNY).
 * Wyświetla się przez 4 sekundy po zmianie dyrektywy pod górną krawędzią ekranu w przestrzeni kamery.
 */
function drawArena5DirectiveBanner(ctx, camera) {
  const changedAt = arena5State.directiveChangedAt || 0;
  if (!changedAt) return;

  const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  const elapsed = (now - changedAt) / 1000;
  if (elapsed >= 4.0 || elapsed < 0) return;

  const fadeIn = Math.min(1.0, elapsed / 0.4);
  const fadeOut = Math.min(1.0, (4.0 - elapsed) / 0.8);
  const alpha = Math.min(fadeIn, fadeOut);

  if (alpha <= 0.01) return;

  ctx.save();

  const viewWidth = camera.viewWidth || 1600;
  const centerX = camera.x + viewWidth * 0.5;
  const bannerY = camera.y + 40;
  const bannerW = 480;
  const bannerH = 48;

  // Półprzezroczyste grafitowe tło
  ctx.fillStyle = `rgba(10, 15, 26, ${0.88 * alpha})`;
  ctx.fillRect(centerX - bannerW * 0.5, bannerY, bannerW, bannerH);

  const accent = arena5State.directiveColor || '#38bdf8';
  ctx.strokeStyle = accent;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(centerX - bannerW * 0.5, bannerY, bannerW, bannerH);

  // Narożniki taktyczne [ ]
  const cLen = 9;
  const bx = centerX - bannerW * 0.5;
  const by = bannerY;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  // Lewy górny
  ctx.moveTo(bx + cLen, by); ctx.lineTo(bx, by); ctx.lineTo(bx, by + cLen);
  // Prawy górny
  ctx.moveTo(bx + bannerW - cLen, by); ctx.lineTo(bx + bannerW, by); ctx.lineTo(bx + bannerW, by + cLen);
  // Lewy dolny
  ctx.moveTo(bx + cLen, by + bannerH); ctx.lineTo(bx, by + bannerH); ctx.lineTo(bx, by + bannerH - cLen);
  // Prawy dolny
  ctx.moveTo(bx + bannerW - cLen, by + bannerH); ctx.lineTo(bx + bannerW, by + bannerH); ctx.lineTo(bx + bannerW, by + bannerH - cLen);
  ctx.stroke();

  // Nagłówek: SEKTOR 05 // DYREKTYWA PREFABRYKATORA
  ctx.font = '900 10px monospace';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
  ctx.textAlign = 'center';
  ctx.fillText('SEKTOR 05 // DYREKTYWA PREFABRYKATORA', centerX, bannerY + 16);

  // Główna nazwa dyrektywy: np. BLIŹNIACZE BASTIONY
  ctx.font = '900 16px monospace';
  ctx.fillStyle = accent;
  ctx.fillText(arena5State.directiveName || 'DYREKTYWA AKTYWNA', centerX, bannerY + 36);

  ctx.restore();
}
