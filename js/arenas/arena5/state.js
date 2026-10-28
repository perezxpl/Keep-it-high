// =========================================================================
// ARENAS/ARENA5/STATE.JS - PREFABRYKATOR ORBITALNY (SEKTOR 05)
// Stan, siatka dynamicznej wieży, definicje kształtów klocków i suwnicy
// Standard: Zero emojis, modularyzacja ES, optymalizacja pamięci
// =========================================================================

export const CELL_SIZE = 100;
export const COLS = 10;
export const SHAFT_LEFT = 700;
export const SHAFT_RIGHT = SHAFT_LEFT + COLS * CELL_SIZE; // 1700
export const WALL_WIDTH = 150;
export const ARENA_LEFT = SHAFT_LEFT - WALL_WIDTH; // 550
export const ARENA_RIGHT = SHAFT_RIGHT + WALL_WIDTH; // 1850
export const ARENA_WIDTH = ARENA_RIGHT - ARENA_LEFT; // 1300
export const BASE_FLOOR_Y = 1200;

export const BLOCK_MATERIALS = {
  STEEL: {
    id: 'STEEL',
    name: 'STALOWY KONTENER',
    maxHp: 240,
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
    explosionRadius: 220,
    explosionDamage: 90
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

export const SHAPE_DEFS = [
  // 1. I-Beam poziomy (4x1)
  { id: 'I_HORIZ', w: 4, h: 1, cells: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 2, r: 0 }, { c: 3, r: 0 }] },
  // 2. I-Beam pionowy (1x3)
  { id: 'I_VERT',  w: 1, h: 3, cells: [{ c: 0, r: 0 }, { c: 0, r: 1 }, { c: 0, r: 2 }] },
  // 3. Moduł kwadratowy 2x2
  { id: 'O_BLOCK', w: 2, h: 2, cells: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 0, r: 1 }, { c: 1, r: 1 }] },
  // 4. Trójnik T (3x2)
  { id: 'T_BLOCK', w: 3, h: 2, cells: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 2, r: 0 }, { c: 1, r: 1 }] },
  // 5. Kątownik L (3x2)
  { id: 'L_BLOCK', w: 3, h: 2, cells: [{ c: 0, r: 0 }, { c: 0, r: 1 }, { c: 1, r: 0 }, { c: 2, r: 0 }] },
  // 6. Odwrócony kątownik J (3x2)
  { id: 'J_BLOCK', w: 3, h: 2, cells: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 2, r: 0 }, { c: 2, r: 1 }] },
  // 7. Stopnie S (3x2)
  { id: 'S_BLOCK', w: 3, h: 2, cells: [{ c: 1, r: 0 }, { c: 2, r: 0 }, { c: 0, r: 1 }, { c: 1, r: 1 }] },
  // 8. Stopnie Z (3x2)
  { id: 'Z_BLOCK', w: 3, h: 2, cells: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 1, r: 1 }, { c: 2, r: 1 }] },
  // 9. Bunkier U (3x2 ze schronem pośrodku)
  { id: 'U_BUNKER', w: 3, h: 2, cells: [{ c: 0, r: 0 }, { c: 0, r: 1 }, { c: 1, r: 1 }, { c: 2, r: 1 }, { c: 2, r: 0 }] },
  // 10. Kolumna / Filar 1x2
  { id: 'PILLAR',  w: 1, h: 2, cells: [{ c: 0, r: 0 }, { c: 0, r: 1 }] }
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
    timer: 1.1,       // Czas ostrzeżenia w sekundach (1.1s)
    warningMax: 1.1,
    cooldownTimer: 0,
    shape: null,
    material: 'STEEL',
    col: 3,
    dropX: 0,
    currentY: 0,
    vy: 0,
    targetLandY: BASE_FLOOR_Y - CELL_SIZE,
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

  // Dolna strefa mielenia / utylizator
  recyclerY: BASE_FLOOR_Y + 100,

  // Płaskie platformy eksportowane do silnika fizyki gry
  platforms: [],
  walls: [],

  // Dynamiczne punkty odrodzenia na szczycie wieży
  spawns: [
    { x: SHAFT_LEFT + 200, y: BASE_FLOOR_Y - 90, facing: 1, isGround: true },
    { x: SHAFT_LEFT + 500, y: BASE_FLOOR_Y - 90, facing: 1, isGround: true },
    { x: SHAFT_LEFT + 800, y: BASE_FLOOR_Y - 90, facing: -1, isGround: true }
  ]
};

export function resetArena5State() {
  arena5State.gridRows.clear();
  arena5State.activeLineClears.length = 0;
  arena5State.debrisParticles.length = 0;
  arena5State.linesClearedCount = 0;
  arena5State.totalBlocksDropped = 0;
  arena5State.highestBlockY = BASE_FLOOR_Y;
  arena5State.highestRowIndex = 0;
  arena5State.recyclerY = BASE_FLOOR_Y + 100;
  arena5State.flashEffectTimer = 0;

  // Przygotuj pierwszy zrzut
  prepareNextCraneDrop();
}

/**
 * Losuje kolejny kształt, materiał i kolumnę zrzutu
 */
export function prepareNextCraneDrop() {
  const shapeDef = SHAPE_DEFS[Math.floor(Math.random() * SHAPE_DEFS.length)];
  const maxCol = Math.max(0, COLS - shapeDef.w);
  const col = Math.floor(Math.random() * (maxCol + 1));

  // Losowanie materiału: 60% stal, 20% beton, 10% wybuchowy, 10% ażurowy
  const randMat = Math.random();
  let material = 'STEEL';
  if (randMat < 0.60) material = 'STEEL';
  else if (randMat < 0.80) material = 'CONCRETE_CRACKED';
  else if (randMat < 0.90) material = 'EXPLOSIVE';
  else material = 'SCAFFOLDING';

  const shapeCells = shapeDef.cells.map(c => ({
    colRel: c.c,
    rowRel: c.r,
    hp: BLOCK_MATERIALS[material].maxHp,
    maxHp: BLOCK_MATERIALS[material].maxHp,
    material
  }));

  arena5State.crane.phase = 'WARNING';
  arena5State.crane.timer = 1.15;
  arena5State.crane.warningMax = 1.15;
  arena5State.crane.cooldownTimer = 0;
  arena5State.crane.shape = shapeDef;
  arena5State.crane.material = material;
  arena5State.crane.col = col;
  arena5State.crane.dropX = getGridX(col);
  arena5State.crane.vy = 0;
  arena5State.crane.shapeCells = shapeCells;

  // Obliczenie docelowego poziomu lądowania
  calculateTargetLandY();
}

/**
 * Oblicza dokładną wysokość docelowego lądowania dla aktualnego kształtu i kolumny
 */
export function calculateTargetLandY() {
  const crane = arena5State.crane;
  if (!crane.shape) return;

  // Dla każdej kolumny kształtu znajdujemy najwyższy zajęty wiersz
  let highestLandingRow = -1;

  for (const cell of crane.shapeCells) {
    const worldCol = crane.col + cell.colRel;
    // Sprawdź od najwyższego wiersza w dół
    for (let r = arena5State.highestRowIndex + 5; r >= 0; r--) {
      const rowData = arena5State.gridRows.get(r);
      if (rowData && rowData[worldCol]) {
        // Oblicz wiersz lądowania dla tej komórki
        const landingRowForThisCell = r + 1 - cell.rowRel;
        if (landingRowForThisCell > highestLandingRow) {
          highestLandingRow = landingRowForThisCell;
        }
        break;
      }
    }
  }

  if (highestLandingRow < 0) {
    highestLandingRow = 0;
  }

  // targetLandY to współrzędna Y szczytu kształtu (komórka r = 0)
  crane.targetLandingRow = highestLandingRow;
  crane.targetLandY = BASE_FLOOR_Y - (highestLandingRow + crane.shape.h) * CELL_SIZE;

  // Startowa wysokość spadania: co najmniej 450 px nad celem
  crane.currentY = crane.targetLandY - 550;
}
