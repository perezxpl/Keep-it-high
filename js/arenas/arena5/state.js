// =========================================================================
// ARENAS/ARENA5/STATE.JS - PREFABRYKATOR ORBITALNY (SEKTOR 05)
// Stan, siatka dynamicznej wieży, definicje kształtów klocków i suwnicy
// Standard: Zero emojis, modularyzacja ES, optymalizacja pamięci
// =========================================================================

export const CELL_SIZE = 80; // 80px: dopasowanie do Enforcera (74px) z zachowaniem pełnej zdolności do wskakiwania
export const COLS = 20; // 20 kolumn x 80px = 1600px: dokładnie od lewej do prawej krawędzi ekranu
export const MAX_TOWER_ROWS = 20; // Maksymalna wysokość aktywnej wieży: 20 segmentów w pionie
export const ARENA_LEFT = 0;
export const ARENA_WIDTH = 1600;
export const ARENA_RIGHT = ARENA_LEFT + ARENA_WIDTH; // 1600
export const WALL_WIDTH = 0;
export const SHAFT_LEFT = 0;
export const SHAFT_RIGHT = ARENA_WIDTH; // 1600 (pełna szerokość ekranu)
export const BASE_FLOOR_Y = 1200;

export const BLOCK_MATERIALS = {
  STEEL: {
    id: 'STEEL',
    name: 'STALOWY KONTENER',
    maxHp: 220,
    color: '#334155',
    trimColor: '#eab308',
    passThroughBullets: false
  },
  CONCRETE_CRACKED: {
    id: 'CONCRETE_CRACKED',
    name: 'PĘKNIĘTY ŻELBET',
    maxHp: 80,
    color: '#475569',
    trimColor: '#94a3b8',
    passThroughBullets: false
  },
  EXPLOSIVE: {
    id: 'EXPLOSIVE',
    name: 'KONTENER PALIWOWY',
    maxHp: 40,
    color: '#991b1b',
    trimColor: '#f97316',
    passThroughBullets: false,
    isExplosive: true,
    explosionRadius: 200,
    explosionDamage: 85
  },
  SCAFFOLDING: {
    id: 'SCAFFOLDING',
    name: 'POMOST AŻUROWY',
    maxHp: 120,
    color: '#1e293b',
    trimColor: '#38bdf8',
    passThroughBullets: true
  }
};

/**
 * Definicje klocków:
 * c: kolumna względna (0 .. w-1)
 * r: wiersz względny OD DOŁU (0 = dolny wiersz klocka, 1 = jeden wiersz wyżej)
 */
export const SHAPE_DEFS = [
  // 1. I-Beam poziomy (4x1) - klasyczna długa belka Tetris
  { id: 'I_HORIZ_4', name: 'DŹWIGAR I-4', accentColor: '#00e5ff', w: 4, h: 1, cells: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 2, r: 0 }, { c: 3, r: 0 }] },
  // 2. I-Beam poziomy (3x1)
  { id: 'I_HORIZ_3', name: 'DŹWIGAR I-3', accentColor: '#38bdf8', w: 3, h: 1, cells: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 2, r: 0 }] },
  // 3. I-Beam pionowy (1x2) - filar
  { id: 'PILLAR_2',  name: 'FILAR P-2',   accentColor: '#0ea5e9', w: 1, h: 2, cells: [{ c: 0, r: 0 }, { c: 0, r: 1 }] },
  // 4. Moduł kwadratowy 2x2 - klasyczny klocek O
  { id: 'O_BLOCK',   name: 'KONTENER O',  accentColor: '#eab308', w: 2, h: 2, cells: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 0, r: 1 }, { c: 1, r: 1 }] },
  // 5. Trójnik T (3x2, płaska podstawa z wypustem pośrodku)
  { id: 'T_BLOCK',   name: 'TRÓJNIK T',   accentColor: '#a855f7', w: 3, h: 2, cells: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 2, r: 0 }, { c: 1, r: 1 }] },
  // 6. Kątownik L (3x2, klasyczny Tetris L z nawisem)
  { id: 'L_BLOCK_3', name: 'KĄTOWNIK L',  accentColor: '#f97316', w: 3, h: 2, cells: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 2, r: 0 }, { c: 0, r: 1 }] },
  // 7. Kątownik J (3x2, odwrócony Tetris J z nawisem)
  { id: 'J_BLOCK_3', name: 'KĄTOWNIK J',  accentColor: '#3b82f6', w: 3, h: 2, cells: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 2, r: 0 }, { c: 2, r: 1 }] },
  // 8. Kątownik L mały (2x2)
  { id: 'L_BLOCK_2', name: 'MODUŁ L-2',   accentColor: '#fb923c', w: 2, h: 2, cells: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 0, r: 1 }] },
  // 9. Zygzak S (3x2)
  { id: 'S_BLOCK',   name: 'ZYGZAK S',    accentColor: '#22c55e', w: 3, h: 2, cells: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 1, r: 1 }, { c: 2, r: 1 }] },
  // 10. Zygzak Z (3x2)
  { id: 'Z_BLOCK',   name: 'ZYGZAK Z',    accentColor: '#ef4444', w: 3, h: 2, cells: [{ c: 1, r: 0 }, { c: 2, r: 0 }, { c: 0, r: 1 }, { c: 1, r: 1 }] },
  // 11. Bunkier U (3x2 z niszą pośrodku do ukrycia się)
  { id: 'U_BUNKER',  name: 'BUNKIER U',   accentColor: '#ec4899', w: 3, h: 2, cells: [{ c: 0, r: 0 }, { c: 2, r: 0 }, { c: 0, r: 1 }, { c: 1, r: 1 }, { c: 2, r: 1 }] },
  // 12. Schodki 3-stopniowe (3x2)
  { id: 'STAIRS_3',  name: 'SCHODKI',     accentColor: '#14b8a6', w: 3, h: 2, cells: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 2, r: 0 }, { c: 2, r: 1 }] }
];

export function getGridX(col) {
  return SHAFT_LEFT + col * CELL_SIZE;
}

export function getGridY(row) {
  return BASE_FLOOR_Y - (row + 1) * CELL_SIZE;
}

export const arena5State = {
  // Siatka ułożonych bloków: klucz to indeks wiersza (0, 1, 2, ...), wartość to tablica 10 komórek
  gridRows: new Map(),

  // Aktywna suwnica i spadający blok
  crane: {
    phase: 'WARNING', // 'WARNING' | 'FALLING' | 'COOLDOWN'
    timer: 2.2,       // Spokojny, czytelny czas ostrzeżenia (2.2s)
    warningMax: 2.2,
    cooldownTimer: 0,
    cooldownMax: 2.0, // Przerwa między zrzutami (2.0s)
    shape: null,
    material: 'STEEL',
    col: 3,
    dropX: 0,
    currentY: 0,
    vy: 0,
    targetLandY: BASE_FLOOR_Y - CELL_SIZE,
    targetLandingRow: 0,
    shapeCells: []
  },

  // Statystyki wieży
  highestBlockY: BASE_FLOOR_Y,
  highestRowIndex: 0,
  linesClearedCount: 0,
  totalBlocksDropped: 0,

  // Lista aktywnych wybuchów i czyszczenia linii
  activeLineClears: [],
  debrisParticles: [],
  flashEffectTimer: 0,

  // Dolna strefa mielenia / utylizator (bezpiecznie pod gruntem na starcie)
  recyclerY: BASE_FLOOR_Y + 400,

  // Podnoszący się poziom podłogi wraz ze wspinaczką kamery
  currentFloorY: BASE_FLOOR_Y,
  minFloorRow: 0,

  // Najwyższy punkt kamery (aby kamera wspinała się wyłącznie w górę)
  minCameraY: null,

  // Płaskie platformy eksportowane do silnika fizyki gry
  platforms: [],

  // Licznik unikalnych identyfikatorów figur (spójne klocki Tetris)
  nextPieceId: 1,

  // Dynamiczne punkty odrodzenia na szczycie wieży (rozmieszczone w 20 kolumnach)
  spawns: [
    { x: 280, y: BASE_FLOOR_Y - 90, facing: 1, isGround: true },
    { x: 680, y: BASE_FLOOR_Y - 90, facing: 1, isGround: true },
    { x: 1080, y: BASE_FLOOR_Y - 90, facing: -1, isGround: true },
    { x: 1400, y: BASE_FLOOR_Y - 90, facing: -1, isGround: true }
  ]
};

if (typeof window !== 'undefined') {
  window.arena5State = arena5State;
}

export function resetArena5State() {
  arena5State.gridRows.clear();
  arena5State.activeLineClears.length = 0;
  arena5State.debrisParticles.length = 0;
  arena5State.linesClearedCount = 0;
  arena5State.totalBlocksDropped = 0;
  arena5State.highestBlockY = BASE_FLOOR_Y;
  arena5State.highestRowIndex = 0;
  arena5State.recyclerY = BASE_FLOOR_Y + 400;
  arena5State.currentFloorY = BASE_FLOOR_Y;
  arena5State.minFloorRow = 0;
  arena5State.minCameraY = null;
  arena5State.flashEffectTimer = 0;
  arena5State.nextPieceId = 1;

  // Inicjalizacja bazowych platform (ściany + podstawa) od 1. klatki
  rebuildInitialPlatforms();

  // Przygotuj pierwszy zrzut
  prepareNextCraneDrop();
}

/**
 * Buduje platformy startowe (ściany boczne i podłogę), aby postacie nie spadały w próżnię.
 * Ściany rozciągają się daleko poza krawędzie ekranu, aby na monitorach o dowolnej szerokości
 * nie było widocznej czarnej pustki.
 */
export function rebuildInitialPlatforms() {
  arena5State.platforms.length = 0;
  arena5State.platforms.push(
    {
      id: 'a5_wall_left',
      name: 'LEWA ŚCIANA SZYBU',
      x: -10000,
      y: -100000,
      w: 10000 + SHAFT_LEFT,
      h: 200000,
      width: 10000 + SHAFT_LEFT,
      height: 200000,
      solid: true,
      isWall: true,
      pushSide: 'right',
      isGround: false,
      type: 'factory_wall'
    },
    {
      id: 'a5_wall_right',
      name: 'PRAWA ŚCIANA SZYBU',
      x: SHAFT_RIGHT,
      y: -100000,
      w: 10000,
      h: 200000,
      width: 10000,
      height: 200000,
      solid: true,
      isWall: true,
      pushSide: 'left',
      isGround: false,
      type: 'factory_wall'
    },
    {
      id: 'a5_base_floor',
      name: 'PŁYTA FUNDAMENTOWA',
      x: -2000,
      y: BASE_FLOOR_Y,
      w: 5600,
      h: 400,
      width: 5600,
      height: 400,
      solid: true,
      isGround: true,
      type: 'solid_deck'
    }
  );

  arena5State.spawns = [
    { x: 280, y: BASE_FLOOR_Y - 90, facing: 1, isGround: true },
    { x: 680, y: BASE_FLOOR_Y - 90, facing: 1, isGround: true },
    { x: 1080, y: BASE_FLOOR_Y - 90, facing: -1, isGround: true },
    { x: 1400, y: BASE_FLOOR_Y - 90, facing: -1, isGround: true }
  ];

  if (typeof window !== 'undefined' && Array.isArray(window.ARENA_PLATFORMS)) {
    window.ARENA_PLATFORMS.length = 0;
    window.ARENA_PLATFORMS.push(...arena5State.platforms);
  }
}

/**
 * Inteligentny dobór kolumny zrzutu w stylu Tetrisa:
 * AI ocenia potencjał domknięcia linii, wypełniania nisz i unikania sztucznych iglic
 */
export function findSmartCranePlacement(shapeDef) {
  const minRow = arena5State.minFloorRow || 0;
  const maxCol = Math.max(0, COLS - shapeDef.w);
  if (maxCol <= 0) return 0;

  // Wysokość każdej kolumny w wieży
  const colHeights = new Array(COLS).fill(minRow - 1);
  for (let c = 0; c < COLS; c++) {
    for (let r = arena5State.highestRowIndex + 8; r >= minRow; r--) {
      const rowData = arena5State.gridRows.get(r);
      if (rowData && rowData[c] && rowData[c].hp > 0) {
        colHeights[c] = r;
        break;
      }
    }
  }

  const avgHeight = colHeights.reduce((sum, h) => sum + h, 0) / COLS;

  // 1. Analiza zapełnienia poszczególnych wierszy (szukanie wierszy bliskich domknięcia)
  const rowOccupancy = new Map();
  for (let r = minRow; r <= arena5State.highestRowIndex + 3; r++) {
    const rowData = arena5State.gridRows.get(r);
    let count = 0;
    if (rowData) {
      for (let c = 0; c < COLS; c++) {
        if (rowData[c] && rowData[c].hp > 0) count++;
      }
    }
    if (count > 0) {
      rowOccupancy.set(r, count);
    }
  }

  const scoredCols = [];

  for (let c = 0; c <= maxCol; c++) {
    let landingRow = minRow;
    for (const cell of shapeDef.cells) {
      const wCol = c + cell.c;
      const hOcc = colHeights[wCol];
      const reqRow = hOcc + 1 - cell.r;
      if (reqRow > landingRow) {
        landingRow = reqRow;
      }
    }

    let score = 50;

    // 2. Potężna premia za zapełnianie linii i detonację pełnych wierszy (Tetris Line Clear)
    for (let rRel = 0; rRel < shapeDef.h; rRel++) {
      const wRow = landingRow + rRel;
      const existingInRow = rowOccupancy.get(wRow) || 0;
      const addedInThisRow = shapeDef.cells.filter(cell => cell.r === rRel).length;
      const totalAfter = existingInRow + addedInThisRow;

      if (totalAfter >= COLS) {
        score += 2000; // Bezwzględny priorytet: czyszczenie linii!
      } else if (totalAfter >= COLS - 2) {
        score += 650; // Krok od domknięcia
      } else if (totalAfter >= COLS - 5) {
        score += 300;
      } else if (totalAfter >= 10) {
        score += 120;
      }

      // Bonus za wpasowanie w luki wiersza o wysokim zapełnieniu
      if (existingInRow >= 12) {
        score += addedInThisRow * 150;
      } else if (existingInRow >= 7) {
        score += addedInThisRow * 60;
      }
    }

    // 3. Wyrównywanie terenu: premia za wypełnianie dolin, kara za tworzenie iglic
    const shapeTopRow = landingRow + shapeDef.h - 1;
    if (shapeTopRow <= avgHeight) {
      score += (avgHeight - shapeTopRow + 1) * 22; // Wypełniaj najniższe luki
    } else if (shapeTopRow > avgHeight + 2) {
      score -= (shapeTopRow - avgHeight) * 25; // Kara za wąskie kominy
    }

    // 4. Spasowanie z sąsiednimi kolumnami
    const leftNeighborH = c > 0 ? colHeights[c - 1] : landingRow;
    const rightNeighborH = (c + shapeDef.w < COLS) ? colHeights[c + shapeDef.w] : landingRow;
    const diffLeft = Math.abs(leftNeighborH - landingRow);
    const diffRight = Math.abs(rightNeighborH - landingRow);
    score -= (diffLeft + diffRight) * 2.5;

    // Drobny szum losowy dla naturalności
    score += Math.random() * 10;

    scoredCols.push({ col: c, score });
  }

  scoredCols.sort((a, b) => b.score - a.score);

  // 90% szans na wybór bezwzględnie najlepszej lub drugiej najlepszej kolumny
  if (Math.random() < 0.90 && scoredCols.length >= 2) {
    const pickIdx = Math.random() < 0.75 ? 0 : 1;
    return scoredCols[pickIdx].col;
  }

  return scoredCols[0].col;
}

/**
 * Losuje kolejny kształt, materiał i inteligentną pozycję zrzutu
 */
export function prepareNextCraneDrop() {
  const minRow = arena5State.minFloorRow || 0;

  // Analiza czy któryś z wierszy jest bliski pełnego domknięcia
  let candidateShape = null;
  let maxRowFilled = 0;
  let targetRowIndex = -1;

  for (let r = minRow; r <= arena5State.highestRowIndex + 2; r++) {
    const rowData = arena5State.gridRows.get(r);
    if (!rowData) continue;
    let count = 0;
    for (let c = 0; c < COLS; c++) {
      if (rowData[c] && rowData[c].hp > 0) count++;
    }
    if (count > maxRowFilled && count < COLS) {
      maxRowFilled = count;
      targetRowIndex = r;
    }
  }

  // Jeśli wiersz ma 13..19 klocków, celowo dobierz kształt ułatwiający zamknięcie linii
  if (maxRowFilled >= 13 && targetRowIndex !== -1 && Math.random() < 0.65) {
    const rowData = arena5State.gridRows.get(targetRowIndex);
    // Znajdź pierwszą lukę
    let gapStart = -1;
    let gapLen = 0;
    for (let c = 0; c < COLS; c++) {
      if (!rowData || !rowData[c] || rowData[c].hp <= 0) {
        if (gapStart === -1) gapStart = c;
        gapLen++;
      } else if (gapStart !== -1) {
        break;
      }
    }

    if (gapLen >= 4) {
      candidateShape = SHAPE_DEFS.find(s => s.id === 'I_HORIZ_4') || SHAPE_DEFS[0];
    } else if (gapLen === 3) {
      candidateShape = SHAPE_DEFS.find(s => s.id === 'I_HORIZ_3') || SHAPE_DEFS[1];
    } else if (gapLen === 2) {
      candidateShape = SHAPE_DEFS.find(s => s.id === 'O_BLOCK' || s.id === 'L_BLOCK_2') || SHAPE_DEFS[3];
    } else if (gapLen === 1) {
      candidateShape = SHAPE_DEFS.find(s => s.id === 'PILLAR_2') || SHAPE_DEFS[2];
    }
  }

  const shapeDef = candidateShape || SHAPE_DEFS[Math.floor(Math.random() * SHAPE_DEFS.length)];
  const col = findSmartCranePlacement(shapeDef);

  // 60% stal, 20% beton, 10% wybuchowy, 10% ażurowy
  const randMat = Math.random();
  let material = 'STEEL';
  if (randMat < 0.60) material = 'STEEL';
  else if (randMat < 0.80) material = 'CONCRETE_CRACKED';
  else if (randMat < 0.90) material = 'EXPLOSIVE';
  else material = 'SCAFFOLDING';

  const pieceId = 'p_' + (arena5State.nextPieceId++);

  const shapeCells = shapeDef.cells.map(c => ({
    pieceId,
    shapeId: shapeDef.id,
    accentColor: shapeDef.accentColor,
    colRel: c.c,
    rowRel: c.r, // 0 = dolny wiersz klocka, 1 = wiersz wyżej
    hp: BLOCK_MATERIALS[material].maxHp,
    maxHp: BLOCK_MATERIALS[material].maxHp,
    material
  }));

  // Płynny, częsty zrzut: brak zbędnego wskaźnika opadania, natychmiastowe płynne opadanie
  arena5State.crane.phase = 'FALLING';
  arena5State.crane.timer = 0;
  arena5State.crane.warningMax = 0;
  arena5State.crane.cooldownTimer = 0;
  arena5State.crane.cooldownMax = 0.85; // Częstsze zrzuty: szybka przerwa 0.85s
  arena5State.crane.pieceId = pieceId;
  arena5State.crane.shape = shapeDef;
  arena5State.crane.material = material;
  arena5State.crane.accentColor = shapeDef.accentColor;
  arena5State.crane.col = col;
  arena5State.crane.dropX = getGridX(col);
  arena5State.crane.vy = 1.0; // Spokojny start płynnego opadania
  arena5State.crane.shapeCells = shapeCells;

  // Obliczenie docelowego poziomu lądowania
  calculateTargetLandY();
}

/**
 * Oblicza dokładny wiersz i współrzędną Y lądowania klocka w siatce.
 * Gdy preserveCurrentY jest prawdziwe (np. po tąpnięciu wieży), aktualizujemy wyłącznie cel lądowania,
 * bez cofania spadającego już klocka w górę.
 */
export function calculateTargetLandY(preserveCurrentY = false) {
  const crane = arena5State.crane;
  if (!crane.shape) return;

  const minRow = arena5State.minFloorRow || 0;
  // Znajdź najwyższy zajęty wiersz dla każdej kolumny (nie niżej niż bieżący poziom podłogi)
  let targetLandingRow = minRow;

  for (const cell of crane.shapeCells) {
    const worldCol = crane.col + cell.colRel;
    if (worldCol < 0 || worldCol >= COLS) continue;
    let highestOccupiedInCol = minRow - 1;

    for (let r = arena5State.highestRowIndex + 8; r >= minRow; r--) {
      const rowData = arena5State.gridRows.get(r);
      if (rowData && rowData[worldCol] && rowData[worldCol].hp > 0) {
        highestOccupiedInCol = r;
        break;
      }
    }

    // Komórka (colRel, rowRel) musi wylądować na poziomie >= highestOccupiedInCol + 1
    // Ponieważ jej wiersz to targetLandingRow + rowRel:
    // targetLandingRow + rowRel >= highestOccupiedInCol + 1
    // => targetLandingRow >= highestOccupiedInCol + 1 - rowRel
    const requiredRow = highestOccupiedInCol + 1 - cell.rowRel;
    if (requiredRow > targetLandingRow) {
      targetLandingRow = requiredRow;
    }
  }

  crane.targetLandingRow = Math.max(minRow, targetLandingRow);
  // targetLandY to współrzędna Y szczytu kształtu po wylądowaniu
  crane.targetLandY = BASE_FLOOR_Y - (crane.targetLandingRow + crane.shape.h) * CELL_SIZE;

  // Startowa wysokość spadania: płynny zrzut z góry (450px nad celem)
  if (!preserveCurrentY) {
    crane.currentY = crane.targetLandY - 450;
  }
}
