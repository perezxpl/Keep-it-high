// =========================================================================
// ARENAS/ARENA5/STATE.JS - PREFABRYKATOR ORBITALNY (SEKTOR 05)
// Stan, siatka dynamicznej wieży, definicje kształtów klocków i suwnicy
// Standard: Zero emojis, modularyzacja ES, optymalizacja pamięci
// =========================================================================

export const CELL_SIZE = 100; // 100px: nieco większe od Enforcera (74px), z bezpiecznym schronieniem w lukach pod figurami
export const COLS = 16; // 16 kolumn x 100px = 1600px: dokładnie od lewej do prawej krawędzi ekranu
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
  { id: 'STAIRS_3',  name: 'SCHODKI',     accentColor: '#14b8a6', w: 3, h: 2, cells: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 2, r: 0 }, { c: 2, r: 1 }] },
  // 13. Filar pionowy 1x3 - szybka budowa pionowych wież i osłon
  { id: 'PILLAR_3',  name: 'FILAR P-3',   accentColor: '#0284c7', w: 1, h: 3, cells: [{ c: 0, r: 0 }, { c: 0, r: 1 }, { c: 0, r: 2 }] },
  // 14. Wysoka iglica pionowa 1x4 (klasyczny pionowy I-Beam)
  { id: 'I_VERT_4',  name: 'IGLICA I-4',  accentColor: '#06b6d4', w: 1, h: 4, cells: [{ c: 0, r: 0 }, { c: 0, r: 1 }, { c: 0, r: 2 }, { c: 0, r: 3 }] },
  // 15. Moduł wieżowy 2x3 (masywny dwupiętrowy bastion)
  { id: 'TOWER_2X3', name: 'BASTION 2x3', accentColor: '#8b5cf6', w: 2, h: 3, cells: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 0, r: 1 }, { c: 1, r: 1 }, { c: 0, r: 2 }, { c: 1, r: 2 }] },
  // 16. Wieża z półką snajperską (2x3)
  { id: 'TOWER_LEDGE', name: 'WIEŻA Z PÓŁKĄ', accentColor: '#c084fc', w: 2, h: 3, cells: [{ c: 0, r: 0 }, { c: 0, r: 1 }, { c: 0, r: 2 }, { c: 1, r: 2 }] }
];

export function getGridX(col) {
  return SHAFT_LEFT + col * CELL_SIZE;
}

export function getGridY(row) {
  return BASE_FLOOR_Y - (row + 1) * CELL_SIZE;
}

export const ARENA5_DIRECTIVES = {
  TWIN_BASTIONS: {
    id: 'TWIN_BASTIONS',
    name: 'BLIŹNIACZE BASTIONY',
    desc: 'Wznoszenie wież obronnych na skrzydłach areny',
    accentColor: '#38bdf8'
  },
  TETRIS_FLAT: {
    id: 'TETRIS_FLAT',
    name: 'UKŁAD KLASYCZNY',
    desc: 'Wyrównywanie terenu i detonacja pełnych linii',
    accentColor: '#eab308'
  },
  CITADEL_SPIRE: {
    id: 'CITADEL_SPIRE',
    name: 'CYTADELA CENTRALNA',
    desc: 'Budowa centralnego monolitu wysokościowego',
    accentColor: '#a855f7'
  },
  STEPPED_TERRACES: {
    id: 'STEPPED_TERRACES',
    name: 'KASKADOWE TARASY',
    desc: 'Wielopoziomowe schody i platformy taktyczne',
    accentColor: '#14b8a6'
  },
  PILLARS_CANYON: {
    id: 'PILLARS_CANYON',
    name: 'KOLUMNADA I ROZPADLINY',
    desc: 'Iglice filarowe i głębokie szczeliny bojowe',
    accentColor: '#ef4444'
  }
};

export const DIRECTIVE_CYCLE = [
  'TWIN_BASTIONS',
  'TETRIS_FLAT',
  'CITADEL_SPIRE',
  'TETRIS_FLAT',
  'STEPPED_TERRACES',
  'TETRIS_FLAT',
  'PILLARS_CANYON',
  'TETRIS_FLAT'
];

export const arena5State = {
  // Siatka ułożonych bloków: klucz to indeks wiersza (0, 1, 2, ...), wartość to tablica 10 komórek
  gridRows: new Map(),

  // Dynamiczne dyrektywy architektoniczne budowy wieży
  directive: 'TWIN_BASTIONS',
  directiveIndex: 0,
  directiveDropsLeft: 6,
  directiveName: 'BLIŹNIACZE BASTIONY',
  directiveDesc: 'Wznoszenie wież obronnych na skrzydłach areny',
  directiveColor: '#38bdf8',
  directiveChangedAt: 0,

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
  activeLineAfterglows: [],
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

  // Dynamiczne punkty odrodzenia na szczycie wieży (rozmieszczone w 16 kolumnach)
  spawns: [
    { x: 200, y: BASE_FLOOR_Y - 95, facing: 1, isGround: true },
    { x: 600, y: BASE_FLOOR_Y - 95, facing: 1, isGround: true },
    { x: 1000, y: BASE_FLOOR_Y - 95, facing: -1, isGround: true },
    { x: 1400, y: BASE_FLOOR_Y - 95, facing: -1, isGround: true }
  ]
};

if (typeof window !== 'undefined') {
  window.arena5State = arena5State;
}

export function advanceArena5Directive() {
  arena5State.directiveIndex = ((arena5State.directiveIndex || 0) + 1) % DIRECTIVE_CYCLE.length;
  setArena5Directive(DIRECTIVE_CYCLE[arena5State.directiveIndex]);
}

export function setArena5Directive(directiveId) {
  const def = ARENA5_DIRECTIVES[directiveId] || ARENA5_DIRECTIVES.TETRIS_FLAT;
  const changed = (arena5State.directive !== def.id);
  arena5State.directive = def.id;
  arena5State.directiveName = def.name;
  arena5State.directiveDesc = def.desc;
  arena5State.directiveColor = def.accentColor;
  arena5State.directiveDropsLeft = (def.id === 'TETRIS_FLAT')
    ? (4 + Math.floor(Math.random() * 3))
    : (5 + Math.floor(Math.random() * 3));
  if (changed) {
    arena5State.directiveChangedAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  }
}

export function resetArena5State() {
  arena5State.gridRows.clear();
  arena5State.activeLineClears.length = 0;
  arena5State.activeLineAfterglows.length = 0;
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
  arena5State.directiveIndex = 0;
  setArena5Directive('TWIN_BASTIONS');

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
    { x: 200, y: BASE_FLOOR_Y - 95, facing: 1, isGround: true },
    { x: 600, y: BASE_FLOOR_Y - 95, facing: 1, isGround: true },
    { x: 1000, y: BASE_FLOOR_Y - 95, facing: -1, isGround: true },
    { x: 1400, y: BASE_FLOOR_Y - 95, facing: -1, isGround: true }
  ];

  if (typeof window !== 'undefined' && Array.isArray(window.ARENA_PLATFORMS)) {
    window.ARENA_PLATFORMS.length = 0;
    window.ARENA_PLATFORMS.push(...arena5State.platforms);
  }
}

/**
 * Inteligentny dobór kolumny zrzutu z uwzględnieniem aktywnej dyrektywy architektonicznej:
 * - TWIN_BASTIONS: wznosi wysokie wieże na lewym i prawym skrzydle, zostawiając dolinę pośrodku
 * - CITADEL_SPIRE: buduje potężny monolit wieżowy w centrum areny
 * - STEPPED_TERRACES: tworzy wielopoziomowe schody i tarasy taktyczne
 * - PILLARS_CANYON: buduje wysokie, wąskie iglice oddzielone rozpadlinami
 * - TETRIS_FLAT: wyrównuje teren, wypełnia doliny i detonuje pełne linie
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
  const directive = arena5State.directive || 'TETRIS_FLAT';

  // 1. Analiza zapełnienia poszczególnych wierszy (szukanie wierszy bliskich domknięcia)
  const rowOccupancy = new Map();
  for (let r = minRow; r <= arena5State.highestRowIndex + 4; r++) {
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
    const centerCol = c + (shapeDef.w - 1) / 2;
    const shapeTopRow = landingRow + shapeDef.h - 1;

    // 2. Bonus za zapełnianie linii i detonację pełnych wierszy
    for (let rRel = 0; rRel < shapeDef.h; rRel++) {
      const wRow = landingRow + rRel;
      const existingInRow = rowOccupancy.get(wRow) || 0;
      const addedInThisRow = shapeDef.cells.filter(cell => cell.r === rRel).length;
      const totalAfter = existingInRow + addedInThisRow;

      if (totalAfter >= COLS) {
        score += (directive === 'TETRIS_FLAT') ? 2500 : 1200; // Bezwzględny priorytet w trybie klasycznym
      } else if (totalAfter >= COLS - 2) {
        score += (directive === 'TETRIS_FLAT') ? 750 : 350;
      } else if (directive === 'TETRIS_FLAT') {
        if (totalAfter >= COLS - 5) score += 200;
        if (existingInRow >= 11) score += addedInThisRow * 100;
      }
    }

    // 3. Punktacja w zależności od wybranej dyrektywy architektonicznej
    if (directive === 'TWIN_BASTIONS') {
      // Skrzydło lewe (kolumny 0.5..4.5) oraz skrzydło prawe (kolumny 10.5..14.5)
      const isLeftBastion = (centerCol >= 0.5 && centerCol <= 4.5);
      const isRightBastion = (centerCol >= 10.5 && centerCol <= 14.5);
      const isValley = (centerCol >= 5.5 && centerCol <= 9.5);

      if (isLeftBastion || isRightBastion) {
        score += 850; // Skupiaj klocki na skrzydłach
        score += Math.max(0, (landingRow - minRow)) * 32; // Piętrz wieże w górę
      } else if (isValley) {
        score -= 420; // Zostaw dolinę na środku pustą
        if (landingRow <= avgHeight - 2) score += 180; // Dopuszczalny tylko niski fundament
      }
    } else if (directive === 'CITADEL_SPIRE') {
      // Centralna cytadela / iglica w środku (kolumny 5..10)
      const isCenter = (centerCol >= 5.0 && centerCol <= 10.0);
      const isFlank = (centerCol < 4.0 || centerCol > 11.0);

      if (isCenter) {
        score += 950; // Centralny monolit
        score += Math.max(0, (landingRow - minRow)) * 36; // Imponująca wysokość
      } else if (isFlank) {
        score -= 360; // Skrzydła pozostają niżej
      }
    } else if (directive === 'STEPPED_TERRACES') {
      // Kaskadowy profil terenu: lewa strona wysoka (+4 wiersze), prawa niska
      const targetTier = minRow + Math.round((1 - centerCol / (COLS - 1)) * 4.5);
      const diff = Math.abs(landingRow - targetTier);
      score += Math.max(0, (5 - diff) * 130);
    } else if (directive === 'PILLARS_CANYON') {
      // Filarowa kolumnada: 3 iglice wokół kolumn ~2, ~7.5, ~13
      const distToPillar1 = Math.abs(centerCol - 2.0);
      const distToPillar2 = Math.abs(centerCol - 7.5);
      const distToPillar3 = Math.abs(centerCol - 13.0);
      const minDist = Math.min(distToPillar1, distToPillar2, distToPillar3);

      if (minDist <= 1.2) {
        score += 900;
        score += Math.max(0, (landingRow - minRow)) * 30;
      } else {
        score -= 400; // Zachowaj kaniony między iglicami
      }
    } else {
      // TETRIS_FLAT: Układ klasyczny - wyrównywanie i wypełnianie dołków
      if (shapeTopRow <= avgHeight) {
        score += (avgHeight - shapeTopRow + 1) * 35; // Wypełniaj najniższe luki
      } else if (shapeTopRow > avgHeight + 1) {
        score -= (shapeTopRow - avgHeight) * 30; // Kara za wąskie kominy
      }

      const leftNeighborH = c > 0 ? colHeights[c - 1] : landingRow;
      const rightNeighborH = (c + shapeDef.w < COLS) ? colHeights[c + shapeDef.w] : landingRow;
      const diffLeft = Math.abs(leftNeighborH - landingRow);
      const diffRight = Math.abs(rightNeighborH - landingRow);
      score -= (diffLeft + diffRight) * 3.0;
    }

    // Drobny szum losowy dla naturalności
    score += Math.random() * 12;

    scoredCols.push({ col: c, score });
  }

  scoredCols.sort((a, b) => b.score - a.score);

  // 85% szans na wybór bezwzględnie najlepszej kolumny, 15% na drugą najlepszą
  if (Math.random() < 0.85 && scoredCols.length >= 2) {
    return scoredCols[0].col;
  } else if (scoredCols.length >= 2) {
    return scoredCols[1].col;
  }

  return scoredCols[0].col;
}

/**
 * Losuje kolejny kształt, materiał i inteligentną pozycję zrzutu
 */
export function prepareNextCraneDrop() {
  if (typeof window !== 'undefined' && typeof window.isMatchClient === 'function' && window.isMatchClient()) {
    return;
  }

  const minRow = arena5State.minFloorRow || 0;

  // Analiza rozpiętości wysokości kolumn
  let minColH = 9999;
  let maxColH = -1;
  for (let c = 0; c < COLS; c++) {
    for (let r = arena5State.highestRowIndex + 8; r >= minRow; r--) {
      const rowData = arena5State.gridRows.get(r);
      if (rowData && rowData[c] && rowData[c].hp > 0) {
        if (r < minColH) minColH = r;
        if (r > maxColH) maxColH = r;
        break;
      }
    }
  }
  const heightSpread = (maxColH >= minRow) ? (maxColH - Math.max(minRow - 1, minColH)) : 0;

  // Zarządzanie cyklem dyrektyw budowy wieży
  arena5State.directiveDropsLeft = (arena5State.directiveDropsLeft || 6) - 1;
  if (arena5State.directiveDropsLeft <= 0) {
    advanceArena5Directive();
  } else if (arena5State.directive !== 'TETRIS_FLAT' && heightSpread >= 6) {
    // Jeśli wieże są już bardzo wysokie (różnica 6 klocków), automatycznie przejdź w tryb TETRIS_FLAT
    setArena5Directive('TETRIS_FLAT');
  } else if (arena5State.directive === 'TETRIS_FLAT' && heightSpread <= 1 && arena5State.totalBlocksDropped > 4) {
    // Jeśli teren stał się zupełnie płaski, od razu zacznij nową formację wieżową!
    advanceArena5Directive();
  }

  const directive = arena5State.directive || 'TETRIS_FLAT';

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

  // W trybie TETRIS_FLAT lub gdy wiersz ma >= 13 klocków: dobierz klocek domykający lukę
  if ((directive === 'TETRIS_FLAT' || maxRowFilled >= 13) && maxRowFilled >= 12 && targetRowIndex !== -1 && Math.random() < 0.70) {
    const rowData = arena5State.gridRows.get(targetRowIndex);
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
      candidateShape = SHAPE_DEFS.find(s => s.id === 'PILLAR_2' || s.id === 'PILLAR_3') || SHAPE_DEFS[2];
    }
  }

  // Dobór kształtu pod kątem aktywnej dyrektywy
  let shapeDef = candidateShape;
  if (!shapeDef) {
    if (directive === 'TWIN_BASTIONS' || directive === 'CITADEL_SPIRE') {
      // 70% szans na wysokie kształty wieżowe i moduły bastionowe
      const towerShapes = ['PILLAR_3', 'I_VERT_4', 'TOWER_2X3', 'TOWER_LEDGE', 'PILLAR_2', 'O_BLOCK', 'L_BLOCK_3', 'J_BLOCK_3', 'U_BUNKER'];
      if (Math.random() < 0.70) {
        const id = towerShapes[Math.floor(Math.random() * towerShapes.length)];
        shapeDef = SHAPE_DEFS.find(s => s.id === id);
      }
    } else if (directive === 'PILLARS_CANYON') {
      const spireShapes = ['PILLAR_3', 'I_VERT_4', 'PILLAR_2', 'TOWER_2X3'];
      if (Math.random() < 0.75) {
        const id = spireShapes[Math.floor(Math.random() * spireShapes.length)];
        shapeDef = SHAPE_DEFS.find(s => s.id === id);
      }
    } else if (directive === 'STEPPED_TERRACES') {
      const stepShapes = ['STAIRS_3', 'L_BLOCK_2', 'L_BLOCK_3', 'J_BLOCK_3', 'I_HORIZ_3', 'O_BLOCK'];
      if (Math.random() < 0.65) {
        const id = stepShapes[Math.floor(Math.random() * stepShapes.length)];
        shapeDef = SHAPE_DEFS.find(s => s.id === id);
      }
    } else {
      // TETRIS_FLAT: preferuj poziome belki i klocki łączące
      const flatShapes = ['I_HORIZ_4', 'I_HORIZ_3', 'O_BLOCK', 'T_BLOCK', 'S_BLOCK', 'Z_BLOCK'];
      if (Math.random() < 0.60) {
        const id = flatShapes[Math.floor(Math.random() * flatShapes.length)];
        shapeDef = SHAPE_DEFS.find(s => s.id === id);
      }
    }
  }

  if (!shapeDef) {
    shapeDef = SHAPE_DEFS[Math.floor(Math.random() * SHAPE_DEFS.length)];
  }

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

  // W trybie wieloosobowym host rozgłasza dane zrzutu do pozostałych graczy
  if (typeof window !== 'undefined' && typeof window.isMatchHost === 'function' && window.isMatchHost() &&
      typeof window.isMatchActive === 'function' && window.isMatchActive() &&
      typeof window.broadcastNetworkPacket === 'function') {
    window.broadcastNetworkPacket({
      type: 'a5_crane_drop',
      shapeId: shapeDef.id,
      col,
      material,
      pieceId,
      currentY: Math.round(arena5State.crane.currentY),
      targetLandY: Math.round(arena5State.crane.targetLandY),
      targetLandingRow: arena5State.crane.targetLandingRow,
      vy: Math.round((arena5State.crane.vy || 1) * 10) / 10,
      directive: arena5State.directive,
      directiveName: arena5State.directiveName,
      directiveColor: arena5State.directiveColor
    });
  }
}

/**
 * Zastosowanie zrzutu suwnicy otrzymanego przez sieć od hosta
 */
export function applyRemoteCraneDrop(data) {
  if (!data || !data.shapeId) return;
  const shapeDef = SHAPE_DEFS.find(s => s.id === data.shapeId) || SHAPE_DEFS[0];
  const material = data.material || 'STEEL';
  const col = (typeof data.col === 'number') ? data.col : 0;
  const pieceId = data.pieceId || ('p_' + (arena5State.nextPieceId++));

  if (data.directive && data.directive !== arena5State.directive) {
    setArena5Directive(data.directive);
  }

  const matDef = BLOCK_MATERIALS[material] || BLOCK_MATERIALS.STEEL;
  const shapeCells = shapeDef.cells.map(c => ({
    pieceId,
    shapeId: shapeDef.id,
    accentColor: shapeDef.accentColor,
    colRel: c.c,
    rowRel: c.r,
    hp: matDef.maxHp,
    maxHp: matDef.maxHp,
    material
  }));

  arena5State.crane.phase = 'FALLING';
  arena5State.crane.timer = 0;
  arena5State.crane.warningMax = 0;
  arena5State.crane.cooldownTimer = 0;
  arena5State.crane.cooldownMax = 0.85;
  arena5State.crane.pieceId = pieceId;
  arena5State.crane.shape = shapeDef;
  arena5State.crane.material = material;
  arena5State.crane.accentColor = shapeDef.accentColor;
  arena5State.crane.col = col;
  arena5State.crane.dropX = getGridX(col);
  arena5State.crane.vy = (typeof data.vy === 'number') ? data.vy : 1.0;
  arena5State.crane.shapeCells = shapeCells;

  calculateTargetLandY();
  if (typeof data.currentY === 'number') {
    arena5State.crane.currentY = data.currentY;
  }
  if (typeof data.targetLandY === 'number') {
    arena5State.crane.targetLandY = data.targetLandY;
  }
  if (typeof data.targetLandingRow === 'number') {
    arena5State.crane.targetLandingRow = data.targetLandingRow;
  }
}

let _lastA5GridSyncSentAt = 0;

/**
 * Rozgłasza autorytatywny stan wieży Arena 5 z hosta z opcjonalnym limitem częstotliwości
 */
export function broadcastArena5GridSync(options = {}) {
  if (typeof window === 'undefined') return false;
  if (typeof window.isMatchHost !== 'function' || !window.isMatchHost()) return false;
  if (typeof window.isMatchActive !== 'function' || !window.isMatchActive()) return false;
  if (typeof window.broadcastNetworkPacket !== 'function') return false;

  const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  const minInterval = (typeof options.minIntervalMs === 'number') ? options.minIntervalMs : 0;
  if (minInterval > 0 && (now - _lastA5GridSyncSentAt) < minInterval) {
    return false;
  }
  _lastA5GridSyncSentAt = now;

  window.broadcastNetworkPacket({
    type: 'a5_grid_sync',
    snapshot: serializeArena5Grid()
  });
  return true;
}

/**
 * Serializuje stan klocków wieży do kompaktowego formatu sieciowego
 * Format krotek: [r, c, pieceId, shapeId, material, hp, maxHp, accentColor]
 */
export function serializeArena5Grid() {
  const blocks = [];
  for (const [r, rowData] of arena5State.gridRows.entries()) {
    if (!rowData) continue;
    for (let c = 0; c < COLS; c++) {
      const cell = rowData[c];
      if (cell && cell.hp > 0) {
        blocks.push([
          r,
          c,
          cell.pieceId,
          cell.shapeId,
          cell.material,
          Math.round(cell.hp),
          Math.round(cell.maxHp),
          cell.accentColor || '#eab308'
        ]);
      }
    }
  }
  return {
    compact: 1,
    blocks,
    minFloorRow: arena5State.minFloorRow || 0,
    highestRowIndex: arena5State.highestRowIndex || 0,
    totalBlocksDropped: arena5State.totalBlocksDropped || 0,
    directive: arena5State.directive,
    directiveName: arena5State.directiveName,
    directiveDesc: arena5State.directiveDesc,
    directiveColor: arena5State.directiveColor
  };
}

/**
 * Odtwarza stan wieży klocków na podstawie autorytatywnego snapshotu od hosta
 */
export function applyArena5GridSnapshot(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.blocks)) return;

  if (snapshot.directive && snapshot.directive !== arena5State.directive) {
    setArena5Directive(snapshot.directive);
  }

  // 1. O(N) usuniecie starych platform klockow z ARENA_PLATFORMS bez splice w petli
  const newBlockPlats = [];
  if (typeof window !== 'undefined' && Array.isArray(window.ARENA_PLATFORMS)) {
    const kept = window.ARENA_PLATFORMS.filter(p => !p || !p.isA5Block);
    window.ARENA_PLATFORMS.length = 0;
    for (let i = 0; i < kept.length; i++) {
      window.ARENA_PLATFORMS.push(kept[i]);
    }
  }

  // 2. Usuniecie platform klockow z arena5State.platforms
  arena5State.platforms = arena5State.platforms.filter(p => !p || !p.isA5Block);

  // 3. Wyczyszczenie wierszy siatki
  arena5State.gridRows.clear();
  arena5State.minFloorRow = (typeof snapshot.minFloorRow === 'number') ? snapshot.minFloorRow : 0;
  arena5State.highestRowIndex = (typeof snapshot.highestRowIndex === 'number') ? snapshot.highestRowIndex : 0;
  if (typeof snapshot.totalBlocksDropped === 'number') {
    arena5State.totalBlocksDropped = snapshot.totalBlocksDropped;
  }

  // 4. Rekonstrukcja klocków (obsługa kompaktowych krotek oraz starszego formatu obiektowego)
  for (const b of snapshot.blocks) {
    const isTuple = Array.isArray(b);
    const worldRow = isTuple ? b[0] : b.r;
    const worldCol = isTuple ? b[1] : b.c;
    const pieceId = isTuple ? b[2] : b.pId;
    const shapeId = isTuple ? b[3] : b.sId;
    const material = isTuple ? b[4] : b.mat;
    const hp = isTuple ? b[5] : b.hp;
    const maxHp = isTuple ? b[6] : b.mHp;
    const accentColor = (isTuple ? b[7] : b.clr) || '#eab308';

    let rowData = arena5State.gridRows.get(worldRow);
    if (!rowData) {
      rowData = new Array(COLS).fill(null);
      arena5State.gridRows.set(worldRow, rowData);
    }

    const matDef = BLOCK_MATERIALS[material] || BLOCK_MATERIALS.STEEL;
    const cellObj = {
      pieceId,
      shapeId,
      accentColor,
      material,
      hp,
      maxHp: maxHp || matDef.maxHp,
      x: getGridX(worldCol),
      y: getGridY(worldRow),
      w: CELL_SIZE,
      h: CELL_SIZE,
      col: worldCol,
      row: worldRow,
      color: matDef.color,
      trimColor: matDef.trimColor,
      isSolid: true,
      platformObj: null
    };

    const platObj = {
      id: `a5_block_${worldRow}_${worldCol}`,
      name: matDef.name,
      x: cellObj.x,
      y: cellObj.y,
      w: cellObj.w,
      h: cellObj.h,
      width: cellObj.w,
      height: cellObj.h,
      solid: true,
      isGround: true,
      type: material === 'SCAFFOLDING' ? 'catwalk' : 'container_block',
      isA5Block: true,
      gridRow: worldRow,
      gridCol: worldCol,
      pieceId,
      cellRef: cellObj
    };
    cellObj.platformObj = platObj;
    rowData[worldCol] = cellObj;

    arena5State.platforms.push(platObj);
    newBlockPlats.push(platObj);
  }

  if (typeof window !== 'undefined' && Array.isArray(window.ARENA_PLATFORMS) && newBlockPlats.length > 0) {
    window.ARENA_PLATFORMS.push(...newBlockPlats);
  }

  if (typeof window !== 'undefined') {
    if (typeof window.updateTowerApexAndSpawns === 'function') {
      window.updateTowerApexAndSpawns();
    }
    if (typeof window.syncArena5ExposedSurfaces === 'function') {
      window.syncArena5ExposedSurfaces();
    }
  }
}

if (typeof window !== 'undefined') {
  window.arena5State = arena5State;
  window.applyRemoteCraneDrop = applyRemoteCraneDrop;
  window.broadcastArena5GridSync = broadcastArena5GridSync;
  window.serializeArena5Grid = serializeArena5Grid;
  window.applyArena5GridSnapshot = applyArena5GridSnapshot;
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

  // Startowa wysokość spadania: zrzut z góry (dużo wyżej, z głębokiego nieba nad wieżą)
  if (!preserveCurrentY) {
    const apexY = (typeof arena5State.highestBlockY === 'number') ? arena5State.highestBlockY : crane.targetLandY;
    const spawnDistance = 1500; // 1500px (15 bloków) ponad celem i szczytem wieży
    crane.currentY = Math.min(crane.targetLandY - spawnDistance, apexY - spawnDistance);
  }
}
