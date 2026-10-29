// =========================================================================
// ARENAS/ARENA5/PHYSICS.JS - FIZYKA ZWIEŃCZENIA, ZMIAŻDŻENIA I GRAWITACJI KLOCKÓW
// Warstwa fizyczna: normalna grawitacja kontenerów (Cascade Gravity Physics),
// kolizje squash, tąpnięcia wieży, utylizator dolny i niszczenie bloków pociskami
// Standard: Zero emojis, strict module safety, 60 FPS, persistent platforms
// =========================================================================

import {
  CELL_SIZE,
  COLS,
  SHAFT_LEFT,
  SHAFT_RIGHT,
  WALL_WIDTH,
  ARENA_LEFT,
  ARENA_RIGHT,
  ARENA_WIDTH,
  BASE_FLOOR_Y,
  MAX_TOWER_ROWS,
  BLOCK_MATERIALS,
  getGridX,
  getGridY,
  arena5State,
  prepareNextCraneDrop,
  calculateTargetLandY
} from './state.js';
import { triggerScreenShake } from '../../camera.js';
import { spawnBloodSpurt } from '../../world/gore.js';
import { spawnShockwaveRing, spawnConcreteDebris, spawnRicochetSparks } from '../../particles.js';
import { triggerCombatFeedBanner } from '../../ui/combatFeed.js';

let _activeCombatants = [];

export function getActiveCombatants() {
  return _activeCombatants;
}

/**
 * Główna pętla fizyki Areny 5 wywoływana w każdej klatce update()
 */
export function updateArena5Physics(dt, combatants = [], camera = null) {
  const stepTime = (typeof dt === 'number' && dt > 0 && dt < 0.2) ? dt : (1 / 60);
  _activeCombatants = Array.isArray(combatants) ? combatants : [];

  // 1. Podnoszenie podłogi wraz ze wspinaczką kamery
  updateRisingFloor(camera, _activeCombatants);

  // 2. Blokada przenikania przez bloczki od dołu (Ceiling collision)
  checkArena5CeilingCollisions(_activeCombatants);

  // 3. Aktualizacja suwnicy i spadającego bloku
  updateCrane(stepTime, _activeCombatants);

  // 4. Płynne opadanie i przesuwanie klocków w dół (Smooth Physics Falling & Sliding)
  updateFallingBlocks(stepTime, _activeCombatants);

  // 5. Normalna grawitacja dla klocków: jeśli klocek podpierający został zniszczony, reszta opada w dół
  applyColumnGravity(_activeCombatants);

  // 4. Detekcja i aktualizacja czyszczenia pełnych linii
  checkAndTriggerLineClears(_activeCombatants);
  updateLineClears(stepTime, _activeCombatants);

  // 5. Aktualizacja cząsteczek odłamków zniszczonych klocków
  updateDebris(stepTime);

  // 6. Dolny utylizator i eliminacja graczy, którzy znaleźli się poniżej podłogi
  updateBottomRecycler(_activeCombatants, camera);

  // 7. Aktualizacja najwyższego punktu wieży i stabilnych punktów odrodzenia
  updateTowerApexAndSpawns();

  // 8. Aktywna depenetracja postaci z klocków (Anti-Stuck Solver: zapobiega wpadaniu i uwięzieniu w bloczku)
  resolveArena5BlockPenetration(_activeCombatants);
}

/**
 * Obsługa cyklu życia suwnicy: Płynne opadanie oparte na dt -> Uderzenie -> Krótki Cooldown (0.85s)
 */
function updateCrane(dt, combatants) {
  const crane = arena5State.crane;
  if (!crane || !crane.shape) return;

  if (crane.phase === 'WARNING') {
    // Usunięty wskaźnik/ostrzeżenie: natychmiastowe przejście do płynnego opadania
    crane.phase = 'FALLING';
    crane.vy = 1.0; // Spokojny, łagodny start opadania
  } else if (crane.phase === 'FALLING') {
    // Płynne, czytelne i spokojniejsze opadanie z przyspieszeniem fizycznym
    const fallAccel = 8.0;
    crane.vy = Math.min(6.0, crane.vy + fallAccel * dt);
    crane.currentY += crane.vy * (dt * 60);

    // Detekcja uderzenia / zmiażdżenia
    checkFallingSquash(combatants);

    // Warunek uderzenia w wieżę / podłoże
    if (crane.currentY >= crane.targetLandY) {
      crane.currentY = crane.targetLandY;
      onCraneBlockImpact(combatants);
    }
  } else if (crane.phase === 'COOLDOWN') {
    crane.cooldownTimer -= dt;
    if (crane.cooldownTimer <= 0) {
      prepareNextCraneDrop();
    }
  }
}

/**
 * Blokada przenikania przez ułożone bloczki od dołu (Ceiling Collision):
 * Postać uderzając głową w spód bloczka zatrzymuje się i nie może przez niego przelecieć.
 */
export function checkArena5CeilingCollisions(combatants) {
  if (!Array.isArray(combatants)) return;

  const minRow = arena5State.minFloorRow || 0;

  for (const p of combatants) {
    if (!p || p.isDead) continue;

    const pW = p.w || 26;
    const pH = p.h || 72;
    const pX = p.x;
    const pY = p.y;
    const headY = pY;
    const feetY = pY + pH;

    // Zakres kolumn, z którymi styka się model postaci
    const colLeft = Math.max(0, Math.min(COLS - 1, Math.floor((pX + 4) / CELL_SIZE)));
    const colRight = Math.max(0, Math.min(COLS - 1, Math.floor((pX + pW - 4) / CELL_SIZE)));

    let hitCeiling = false;
    let pushDownToY = -Infinity;

    for (let c = colLeft; c <= colRight; c++) {
      for (const [r, rowData] of arena5State.gridRows.entries()) {
        if (r < minRow || !rowData) continue;
        const cell = rowData[c];
        if (!cell || cell.hp <= 0) continue;

        const blockBottom = cell.y + cell.h;
        const blockTop = cell.y;

        // Warunek kolizji sufitowej:
        // Głowa wbiła się w dolną krawędź bloczka (headY <= blockBottom),
        // ale postać znajduje się pod klockiem (headY >= blockTop + 8 oraz feetY > blockBottom)
        if (headY <= blockBottom && headY >= blockTop + 8 && feetY > blockBottom) {
          hitCeiling = true;
          if (blockBottom > pushDownToY) {
            pushDownToY = blockBottom;
          }
        }
      }
    }

    if (hitCeiling) {
      p.y = pushDownToY;
      if (p.vy < 0) {
        p.vy = 0.5; // Zatrzymanie ruchu w górę i lekkie odbicie w dół
      }
      if (p.rocketBoots?.dashing && p.rocketBoots.dashDirY < -0.1) {
        p.rocketBoots.dashing = false;
      }
    }
  }
}

/**
 * Obsługa spadającego klocka i zmiażdżenia (Squash):
 * W powietrzu spadający klocek nie pozwala postaci przeniknąć od dołu –
 * fizycznie ściąga ją w dół i miażdży przy kontakcie ze spodnim bloczkiem lub podłogą.
 */
function checkFallingSquash(combatants) {
  const crane = arena5State.crane;
  if (!crane || crane.phase !== 'FALLING' || !crane.shape) return;

  const minRow = arena5State.minFloorRow || 0;
  const currentFloorY = (arena5State && typeof arena5State.currentFloorY === 'number')
    ? arena5State.currentFloorY
    : BASE_FLOOR_Y;

  for (const cell of crane.shapeCells) {
    const cellX = getGridX(crane.col + cell.colRel);
    const cellY = crane.currentY + (crane.shape.h - 1 - cell.rowRel) * CELL_SIZE;
    const cellW = CELL_SIZE;
    const cellH = CELL_SIZE;
    const cellBottomY = cellY + cellH;
    const worldCol = crane.col + cell.colRel;

    // Obliczenie docelowego poziomu zatrzymania tego segmentu figury
    const cellTargetRow = crane.targetLandingRow + cell.rowRel;
    const cellTargetY = getGridY(cellTargetRow);
    const cellTargetBottomY = cellTargetY + CELL_SIZE;

    for (const victim of combatants) {
      if (!victim || victim.isDead) continue;

      const pW = victim.w || 26;
      const pH = victim.h || 72;
      const pX = victim.x;
      const pY = victim.y;
      const headY = pY;
      const feetY = pY + pH;

      // Sprawdź czy postać znajduje się w rzucie poziomym tego spadającego segmentu
      const overlapX = (pX + 4 < cellX + cellW) && (pX + pW - 4 > cellX);
      if (!overlapX) continue;

      // Znajdź twardą powierzchnię pod stopami ofiary (spodni bloczek wieży lub podłoga)
      let surfaceBelowY = currentFloorY;
      for (let r = arena5State.highestRowIndex + 4; r >= minRow; r--) {
        const rData = arena5State.gridRows.get(r);
        if (rData && rData[worldCol] && rData[worldCol].hp > 0) {
          if (rData[worldCol].y >= pY + 20) {
            surfaceBelowY = rData[worldCol].y;
            break;
          }
        }
      }

      // 1. Sprawdź, czy figura zatrzyma się bezpiecznie nad postacią dzięki podparciu innego klocka
      // (np. figura "L", "T" lub most):
      const finalGap = surfaceBelowY - cellTargetBottomY;
      const hasSafePocketUnderneath = (finalGap >= pH - 8);

      if (hasSafePocketUnderneath) {
        // Figura zatrzyma się nad głową postaci!
        // Podczas opadania suwnica nigdy nie osiągnie poziomu niższego niż cellTargetBottomY.
        // Jeśli postać skoczy w górę pod nawisem, działa standardowa kolizja sufitowa:
        if (headY <= cellBottomY + 4 && feetY > cellY + 8) {
          victim.y = Math.max(cellBottomY, surfaceBelowY - pH);
          victim.vy = Math.max(0.5, victim.vy);
          if (victim.rocketBoots?.dashing && victim.rocketBoots.dashDirY < 0) {
            victim.rocketBoots.dashDirY = 0;
            victim.rocketBoots.dashing = false;
          }
        }
        continue; // Pełne bezpieczeństwo pod nawisem dla wszystkich klas
      }

      // 2. Jeśli pod segmentem NIE MA bezpiecznego prześwitu (klocek zmiażdży ten sektor do podłoża):
      const isUnderBlock = (headY <= cellBottomY + 4) && (feetY > cellY + 8);
      if (!isUnderBlock) continue;

      // Zmiażdżenie (Squash Kill) następuje TYLKO wtedy, gdy przestrzeń została fizycznie ściśnięta
      // poniżej możliwości przeżycia (< 58% wysokości postaci) i postać spoczywa na podłożu:
      const remainingSpace = surfaceBelowY - cellBottomY;
      const isPhysicallyCrushed = (remainingSpace <= pH * 0.58) && (feetY >= surfaceBelowY - 10);

      if (isPhysicallyCrushed) {
        executeSquashKill(victim);
      } else {
        // W powietrzu: spadający klocek spycha postać w dół
        victim.y = cellBottomY;
        victim.vy = Math.max(victim.vy, (crane.vy || 4.0) + 1.2);
        victim.onGround = false;
        victim.currentPlatform = null;

        // Anuluj wszelkie zrywy jetpacka / dasha w górę
        if (victim.rocketBoots?.dashing && victim.rocketBoots.dashDirY < 0) {
          victim.rocketBoots.dashDirY = 0;
          victim.rocketBoots.dashing = false;
        }

        if (Math.random() < 0.25) {
          spawnRicochetSparks(pX + pW * 0.5, cellBottomY, (Math.random() - 0.5) * 4, 3, 2);
          triggerScreenShake(3);
        }
      }
    }
  }
}

/**
 * Wykonuje widowiskowe zmiażdżenie postaci (Squash)
 */
export function executeSquashKill(victim) {
  if (!victim || victim.isDead) return;

  victim.hp = 0;
  victim.isDead = true;
  victim.killer = { name: 'KONTENER PRZEMYSŁOWY', cause: 'CRUSH_KILL' };
  victim.respawnTimer = 140;
  victim.vx = 0;
  victim.vy = 0;
  victim.onGround = true;

  triggerScreenShake(20);
  spawnBloodSpurt(victim.x + (victim.w || 26) * 0.5, victim.y + (victim.h || 72) * 0.5, 0, -1, 30, 3.0);

  triggerCombatFeedBanner('DEATH', `ZMIAŻDŻONY PRZEZ KONTENER`);
}

/**
 * Obsługa impaktu: osadzenie klocków w siatce, utworzenie stałych platform, pył i sprawdzenie linii
 */
function onCraneBlockImpact(combatants) {
  const crane = arena5State.crane;
  crane.phase = 'COOLDOWN';
  crane.cooldownTimer = 0.85; // Częstsze zrzuty: dynamiczna przerwa 0.85s
  arena5State.totalBlocksDropped++;

  triggerScreenShake(9);

  // Osadzenie komórek w siatce gridRows oraz dodanie trwałych obiektów platform
  const pieceId = crane.pieceId || ('p_' + (arena5State.nextPieceId++));
  const shapeId = crane.shape ? crane.shape.id : 'CUSTOM';
  const accentColor = crane.shape ? (crane.shape.accentColor || '#eab308') : '#eab308';

  for (const cell of crane.shapeCells) {
    const worldCol = crane.col + cell.colRel;
    if (worldCol < 0 || worldCol >= COLS) continue;
    // Prawidłowy wiersz w siatce: dolny wiersz kształtu (rowRel=0) ląduje na targetLandingRow
    const worldRow = crane.targetLandingRow + cell.rowRel;

    let rowData = arena5State.gridRows.get(worldRow);
    if (!rowData) {
      rowData = new Array(COLS).fill(null);
      arena5State.gridRows.set(worldRow, rowData);
    }

    const cellObj = {
      pieceId,
      shapeId,
      accentColor,
      material: cell.material,
      hp: cell.hp,
      maxHp: cell.maxHp,
      x: getGridX(worldCol),
      y: getGridY(worldRow),
      w: CELL_SIZE,
      h: CELL_SIZE,
      col: worldCol,
      row: worldRow,
      color: BLOCK_MATERIALS[cell.material].color,
      trimColor: BLOCK_MATERIALS[cell.material].trimColor,
      isSolid: true,
      platformObj: null
    };

    // Utwórz trwały obiekt platformy fizycznej z zachowaniem stabilnej referencji
    const platObj = {
      id: `a5_block_${worldRow}_${worldCol}`,
      name: BLOCK_MATERIALS[cell.material].name,
      x: cellObj.x,
      y: cellObj.y,
      w: cellObj.w,
      h: cellObj.h,
      width: cellObj.w,
      height: cellObj.h,
      solid: true,
      isGround: true,
      type: cell.material === 'SCAFFOLDING' ? 'catwalk' : 'container_block',
      isA5Block: true,
      gridRow: worldRow,
      gridCol: worldCol,
      pieceId,
      cellRef: cellObj
    };
    cellObj.platformObj = platObj;
    rowData[worldCol] = cellObj;

    arena5State.platforms.push(platObj);
    if (typeof window !== 'undefined' && Array.isArray(window.ARENA_PLATFORMS)) {
      window.ARENA_PLATFORMS.push(platObj);
    }

    spawnConcreteDebris(getGridX(worldCol) + CELL_SIZE * 0.5, getGridY(worldRow) + CELL_SIZE, 5);
  }

  // Ważne: Nowo zrzucona figura wylądowała jako sztywna całość (Tetris block) na najwyższym podparciu.
  // Jej nawisy nie opadają – opierają się na podparciu reszty figury!
  updateTowerApexAndSpawns();
  checkAndTriggerLineClears(combatants);
  resolveArena5BlockPenetration(combatants);
}

/**
 * Usuwa obiekt platformy dla danej komórki
 */
export function removePlatformForCell(cell) {
  if (!cell || !cell.platformObj) return;
  const plat = cell.platformObj;
  const idx1 = arena5State.platforms.indexOf(plat);
  if (idx1 !== -1) arena5State.platforms.splice(idx1, 1);
  if (typeof window !== 'undefined' && Array.isArray(window.ARENA_PLATFORMS)) {
    const idx2 = window.ARENA_PLATFORMS.indexOf(plat);
    if (idx2 !== -1) window.ARENA_PLATFORMS.splice(idx2, 1);
  }
  cell.platformObj = null;
}

/**
 * Dzieli wszystkie aktywne komórki w siatce na spójne klastry figur Tetris.
 * Komórki należą do jednego klastra, jeśli mają ten sam pieceId i stykają się ze sobą.
 */
export function getGridClusters() {
  const minRow = arena5State.minFloorRow || 0;
  const clusters = [];
  const visited = new Set();

  for (const [r, rowData] of arena5State.gridRows.entries()) {
    if (r < minRow || !rowData) continue;
    for (let c = 0; c < COLS; c++) {
      const cell = rowData[c];
      if (!cell || cell.hp <= 0) continue;
      const key = `${r}_${c}`;
      if (visited.has(key)) continue;

      const clusterId = clusters.length + 1;
      const cluster = {
        id: clusterId,
        pieceId: cell.pieceId || `legacy_${r}_${c}`,
        cells: [],
        minRow: r
      };

      const q = [cell];
      visited.add(key);

      while (q.length > 0) {
        const cur = q.shift();
        cur._clusterId = clusterId;
        cluster.cells.push(cur);
        if (cur.row < cluster.minRow) cluster.minRow = cur.row;

        const neighbors = [
          { r: cur.row + 1, c: cur.col },
          { r: cur.row - 1, c: cur.col },
          { r: cur.row, c: cur.col - 1 },
          { r: cur.row, c: cur.col + 1 }
        ];

        for (const n of neighbors) {
          if (n.r < minRow || n.c < 0 || n.c >= COLS) continue;
          const nKey = `${n.r}_${n.c}`;
          if (visited.has(nKey)) continue;

          const nRowData = arena5State.gridRows.get(n.r);
          const nCell = nRowData ? nRowData[n.c] : null;
          if (nCell && nCell.hp > 0 && nCell.pieceId === cluster.pieceId) {
            visited.add(nKey);
            q.push(nCell);
          }
        }
      }

      clusters.push(cluster);
    }
  }

  return clusters;
}

/**
 * Fizyka figur Tetris (Piece-Based Rigid Gravity):
 * Figury (np. "L", "T", "O") stanowią spójną całość. Jeśli figura opiera się na innym bloku
 * choćby jedną końcówką, cała figura z nawisami pozostaje w powietrzu.
 * Dopiero gdy jej podparcie zostanie zniszczone (pociskami, wybuchem, detonacją linii),
 * figura opada w dół jako spójny blok, dopóki nie oprze się na nowym podłożu.
 */
export function applyPieceGravity(combatants = null) {
  const activeTargets = (Array.isArray(combatants) && combatants.length) ? combatants : _activeCombatants;
  let anyBlockFell = false;
  const minRow = arena5State.minFloorRow || 0;

  let iterations = 0;
  const maxIterations = 20;

  while (iterations < maxIterations) {
    iterations++;

    // 1. Wyznacz spójne klastry figur w siatce
    const clusters = getGridClusters();
    if (clusters.length === 0) break;

    // 2. BFS podparcia od dołu (od płyty podłogi minRow)
    const supportedClusterIds = new Set();
    const queue = [];

    // Faza A: Klastry dotykające podłogi bazowej
    for (const cluster of clusters) {
      if (cluster.cells.some(c => c.row <= minRow)) {
        supportedClusterIds.add(cluster.id);
        queue.push(cluster);
      }
    }

    // Faza B: Propagacja podparcia na klastry spoczywające na podpartych
    while (queue.length > 0) {
      const parent = queue.shift();
      for (const pCell of parent.cells) {
        const aboveRowData = arena5State.gridRows.get(pCell.row + 1);
        const aboveCell = aboveRowData ? aboveRowData[pCell.col] : null;
        if (aboveCell && aboveCell.hp > 0 && aboveCell._clusterId !== undefined) {
          if (!supportedClusterIds.has(aboveCell._clusterId)) {
            supportedClusterIds.add(aboveCell._clusterId);
            const childCluster = clusters.find(cl => cl.id === aboveCell._clusterId);
            if (childCluster) {
              queue.push(childCluster);
            }
          }
        }
      }
    }

    // 3. Znajdź niepodparte klastry i posortuj od najniższego rzędu (pomijamy klastry będące już w trakcie płynnego opadania)
    const unsupportedClusters = clusters
      .filter(cl => !supportedClusterIds.has(cl.id) && !cl.cells.some(c => c.isFalling))
      .sort((a, b) => a.minRow - b.minRow);

    if (unsupportedClusters.length === 0) {
      break;
    }

    let stepFell = false;

    // 4. Każdy niepodparty klaster opada jako sztywna figura
    for (const cluster of unsupportedClusters) {
      let maxDrop = 999;

      for (const cell of cluster.cells) {
        let allowedDropForCell = 0;
        let testRow = cell.row - 1;

        while (testRow >= minRow) {
          const rData = arena5State.gridRows.get(testRow);
          const belowCell = rData ? rData[cell.col] : null;
          if (belowCell && belowCell.hp > 0) {
            if (belowCell._clusterId === cluster.id) {
              allowedDropForCell++;
              testRow--;
              continue;
            } else {
              break;
            }
          }
          allowedDropForCell++;
          testRow--;
        }

        if (allowedDropForCell < maxDrop) {
          maxDrop = allowedDropForCell;
        }
      }

      if (maxDrop > 0 && maxDrop !== 999) {
        stepFell = true;
        anyBlockFell = true;

        // Usuń ze starych pozycji w siatce
        for (const cell of cluster.cells) {
          const oldRowData = arena5State.gridRows.get(cell.row);
          if (oldRowData && oldRowData[cell.col] === cell) {
            oldRowData[cell.col] = null;
          }
        }

        // Zarezerwuj nowe pozycje w siatce i zainicjuj płynne opadanie fizyczne (brak teleportacji)
        for (const cell of cluster.cells) {
          const newRow = cell.row - maxDrop;
          cell.row = newRow;
          cell.targetY = getGridY(newRow);
          cell.isFalling = true;
          cell.vy = Math.max(1.0, cell.vy || 1.0);

          let newRowData = arena5State.gridRows.get(newRow);
          if (!newRowData) {
            newRowData = new Array(COLS).fill(null);
            arena5State.gridRows.set(newRow, newRowData);
          }
          newRowData[cell.col] = cell;

          if (cell.platformObj) {
            cell.platformObj.gridRow = newRow;
          }
        }

        supportedClusterIds.add(cluster.id);
      }
    }

    if (!stepFell) break;
  }

  // Wyczyść całkowicie puste wiersze z mapy
  const emptyRows = [];
  for (const [r, rowData] of arena5State.gridRows.entries()) {
    if (!rowData || rowData.every(c => !c || c.hp <= 0)) {
      emptyRows.push(r);
    }
  }
  for (const r of emptyRows) {
    arena5State.gridRows.delete(r);
  }

  if (anyBlockFell) {
    triggerScreenShake(4);
    updateTowerApexAndSpawns();

    // Wypchnij postacie, które mogły znaleźć się w strefie opadania klocka
    resolveArena5BlockPenetration(activeTargets);

    // Sprawdź czy opadające klocki nie ułożyły nowej pełnej linii
    checkAndTriggerLineClears(activeTargets);

    // Koryguj cel lądowania suwnicy
    if (arena5State.crane && arena5State.crane.shape) {
      calculateTargetLandY(true);
      if (arena5State.crane.currentY > arena5State.crane.targetLandY) {
        arena5State.crane.currentY = arena5State.crane.targetLandY - 40;
      }
    }
  }

  return anyBlockFell;
}

export const applyColumnGravity = applyPieceGravity;

/**
 * Obsługa płynnego opadania (grawitacji) oraz przesuwania (kopnięć) klocków w wieży.
 * Zapobiega teleportowaniu się klocków po zniszczeniu podparcia.
 */
function updateFallingBlocks(dt, combatants) {
  let anyFallingOrSliding = false;
  let anyLanded = false;

  for (const rowData of arena5State.gridRows.values()) {
    if (!rowData) continue;
    for (let c = 0; c < COLS; c++) {
      const cell = rowData[c];
      if (!cell || cell.hp <= 0) continue;

      // 1. Płynne przesuwanie w bok po kopnięciu (Sliding)
      if (cell.isSliding) {
        anyFallingOrSliding = true;
        const targetX = (typeof cell.slideTargetX === 'number') ? cell.slideTargetX : cell.x;
        const diffX = targetX - cell.x;
        const dirX = Math.sign(diffX);
        const speed = (cell.slideSpeed || 22.0) * (dt * 60);

        const oldX = cell.x;
        if (Math.abs(diffX) <= speed) {
          cell.x = targetX;
          cell.isSliding = false;
          if (cell.platformObj) cell.platformObj.x = targetX;
          spawnRicochetSparks(cell.x + CELL_SIZE * 0.5, cell.y + CELL_SIZE, 0, -2, 4);
          applyPieceGravity(combatants);
        } else {
          cell.x += dirX * speed;
          if (cell.platformObj) cell.platformObj.x = cell.x;
        }

        // Przenoszenie postaci stojącej na przesuwanym klocku
        const stepX = cell.x - oldX;
        if (stepX !== 0 && Array.isArray(combatants)) {
          for (const victim of combatants) {
            if (!victim || victim.isDead) continue;
            const pH = victim.h || 72;
            const pW = victim.w || 26;
            const isStandingOnCell = (victim.currentPlatform === cell.platformObj) ||
              (victim.onGround && Math.abs((victim.y + pH) - cell.y) <= 18 &&
               victim.x + pW > cell.x && victim.x < cell.x + cell.w);

            if (isStandingOnCell) {
              victim.x += stepX;
            }
          }
        }
      }

      // 2. Płynne opadanie w dół po utracie podparcia (Falling)
      if (cell.isFalling) {
        anyFallingOrSliding = true;
        const targetY = (typeof cell.targetY === 'number') ? cell.targetY : getGridY(cell.row);

        const fallAccel = 20.0;
        cell.vy = Math.min(11.0, (cell.vy || 1.0) + fallAccel * dt);
        const step = cell.vy * (dt * 60);
        const oldY = cell.y;
        cell.y += step;

        // Przenoszenie postaci stojącej na opadającym klocku
        if (Array.isArray(combatants)) {
          for (const victim of combatants) {
            if (!victim || victim.isDead) continue;
            const pH = victim.h || 72;
            const pW = victim.w || 26;
            const isStandingOnCell = (victim.currentPlatform === cell.platformObj) ||
              (victim.onGround && Math.abs((victim.y + pH) - oldY) <= 18 &&
               victim.x + pW > cell.x + 4 && victim.x < cell.x + cell.w - 4);

            if (isStandingOnCell) {
              victim.y = cell.y - pH;
              victim.vy = cell.vy;
              victim.onGround = true;
              victim.currentPlatform = cell.platformObj;
            }
          }
        }

        if (cell.platformObj) {
          cell.platformObj.y = cell.y;
        }

        // Dotarcie do docelowego rzędu
        if (cell.y >= targetY) {
          cell.y = targetY;
          cell.isFalling = false;
          cell.vy = 0;
          if (cell.platformObj) {
            cell.platformObj.y = targetY;
          }
          anyLanded = true;
          spawnConcreteDebris(cell.x + CELL_SIZE * 0.5, cell.y + CELL_SIZE, 3);
        }
      }
    }
  }

  if (anyLanded) {
    triggerScreenShake(3);
    updateTowerApexAndSpawns();
    checkAndTriggerLineClears(combatants);
    resolveArena5BlockPenetration(combatants);
  }

  return anyFallingOrSliding;
}

/**
 * Sprawdza wszystkie wiersze siatki i inicjuje ostrzeżenie przed detonacją pełnych rzędów
 */
function checkAndTriggerLineClears(combatants) {
  const fullRows = [];

  for (const [rowIndex, rowData] of arena5State.gridRows.entries()) {
    if (!rowData) continue;
    let isFull = true;
    for (let c = 0; c < COLS; c++) {
      if (!rowData[c] || rowData[c].hp <= 0) {
        isFull = false;
        break;
      }
    }
    if (isFull) {
      fullRows.push(rowIndex);
    }
  }

  if (fullRows.length === 0) return;

  for (const r of fullRows) {
    if (!arena5State.activeLineClears.some(c => c.row === r)) {
      arena5State.activeLineClears.push({
        row: r,
        y: getGridY(r) + CELL_SIZE * 0.5,
        timer: 0.25,
        maxTimer: 0.25,
        detonated: false
      });
    }
  }
}

/**
 * Aktualizacja timerów czyszczenia linii i odpalenie wybuchu
 */
function updateLineClears(dt, combatants) {
  if (arena5State.activeLineClears.length === 0) return;

  let anyTimerExpired = false;
  for (let i = 0; i < arena5State.activeLineClears.length; i++) {
    const clear = arena5State.activeLineClears[i];
    clear.timer -= dt;
    if (clear.timer <= 0) {
      anyTimerExpired = true;
    }
  }

  if (anyTimerExpired) {
    // Odpal zbiorczą detonację wszystkich gotowych linii
    const rowsToDetonate = arena5State.activeLineClears
      .filter(c => c.timer <= 0 && !c.detonated)
      .map(c => c.row);

    if (rowsToDetonate.length > 0) {
      executeBatchLineDetonation(rowsToDetonate, combatants);
    }
    arena5State.activeLineClears = arena5State.activeLineClears.filter(c => c.timer > 0);
  }
}

/**
 * Zbiorcza detonacja pełnych rzędów: wybuchy, odłamki, obrażenia i atomowe opadnięcie rzędów powyżej
 */
function executeBatchLineDetonation(rowsToDetonate, combatants) {
  const uniqueRows = Array.from(new Set(rowsToDetonate)).sort((a, b) => a - b);
  if (uniqueRows.length === 0) return;

  arena5State.linesClearedCount += uniqueRows.length;
  triggerScreenShake(Math.min(26, 14 + uniqueRows.length * 4));
  triggerCombatFeedBanner('KILL', uniqueRows.length > 1 ? `CZYSZCZENIE ${uniqueRows.length} LINII // COMBO TĄPNIĘCIE!` : `CZYSZCZENIE LINII // TĄPNIĘCIE!`);

  // Wybuchy i fala uderzeniowa na całej szerokości detonowanych wierszy
  for (const r of uniqueRows) {
    const lineY = getGridY(r) + CELL_SIZE * 0.5;
    for (let c = 0; c < COLS; c++) {
      const cx = getGridX(c) + CELL_SIZE * 0.5;
      spawnShockwaveRing(cx, lineY, 80, '#f59e0b');
      spawnConcreteDebris(cx, lineY, 8);
      spawnRicochetSparks(cx, lineY, (Math.random() - 0.5) * 10, -Math.random() * 8, 4);
    }

    // Obrażenia dla postaci stojących na detonowanym rzędzie
    for (const victim of combatants) {
      if (!victim || victim.isDead) continue;
      const vFootY = victim.y + (victim.h || 72);
      if (Math.abs(vFootY - getGridY(r)) < 55) {
        victim.vy = -9.0;
        victim.vx += (Math.random() - 0.5) * 6.0;
        if (typeof victim.takeDamage === 'function') {
          victim.takeDamage(35, { name: 'EKSPLOZJA LINII' });
        } else {
          victim.hp = Math.max(1, (victim.hp || 100) - 35);
        }
      }
    }

    // Usuń komórki i platformy detonowanego wiersza
    const rowData = arena5State.gridRows.get(r);
    if (rowData) {
      for (let c = 0; c < COLS; c++) {
        if (rowData[c]) {
          removePlatformForCell(rowData[c]);
        }
      }
    }
    arena5State.gridRows.delete(r);
  }

  // Zastosuj normalną grawitację kolumnową dla wszystkich klocków powyżej
  applyColumnGravity(combatants);

  // Koryguj cel lądowania suwnicy
  if (arena5State.crane && arena5State.crane.shape) {
    calculateTargetLandY(true);
    if (arena5State.crane.currentY > arena5State.crane.targetLandY) {
      arena5State.crane.currentY = arena5State.crane.targetLandY - 40;
    }
  }
}

/**
 * Aktualizacja cząsteczek odłamków
 */
function updateDebris(dt) {
  for (let i = arena5State.debrisParticles.length - 1; i >= 0; i--) {
    const p = arena5State.debrisParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.40;
    p.life -= dt * 1.5;
    p.rot += p.vRot;
    if (p.life <= 0) {
      arena5State.debrisParticles.splice(i, 1);
    }
  }
}

/**
 * Aktualizuje rosnącą wieżę z oknem maksymalnie 20 segmentów:
 * Gdy wieża urośnie powyżej 20 segmentów, każdy najniższy segment znika,
 * a podstawa i linia utylizatora podnoszą się w ślad za nim.
 */
export function updateRisingFloor(camera, combatants = []) {
  // 1. Znajdź najwyższy aktywny wiersz w siatce
  let highestRow = -1;
  for (const [r, rowData] of arena5State.gridRows.entries()) {
    if (rowData && rowData.some(cell => cell && cell.hp > 0)) {
      if (r > highestRow) highestRow = r;
    }
  }

  // 2. Okno maksymalnie 20 segmentów wieży
  if (highestRow >= MAX_TOWER_ROWS) {
    const minKeepRow = highestRow - (MAX_TOWER_ROWS - 1);
    if (minKeepRow > arena5State.minFloorRow) {
      // Usunięcie wszystkich najniższych wierszy poniżej dozwolonego okna 20 segmentów
      for (const [r, rowData] of arena5State.gridRows.entries()) {
        if (r < minKeepRow) {
          if (rowData) {
            for (let c = 0; c < COLS; c++) {
              if (rowData[c]) {
                removePlatformForCell(rowData[c]);
                spawnConcreteDebris(rowData[c].x + CELL_SIZE * 0.5, rowData[c].y + CELL_SIZE * 0.5, 2);
              }
            }
          }
          arena5State.gridRows.delete(r);
        }
      }
      arena5State.minFloorRow = minKeepRow;
    }
    arena5State.currentFloorY = BASE_FLOOR_Y - (arena5State.minFloorRow * CELL_SIZE);
    arena5State.recyclerY = arena5State.currentFloorY + 80;
  } else {
    arena5State.minFloorRow = 0;
    arena5State.currentFloorY = BASE_FLOOR_Y;
    arena5State.recyclerY = BASE_FLOOR_Y + 400; // Bezpiecznie pod podłogą na starcie
  }

  // 3. Synchronizacja platformy podłogi w fizyce gry (a5_base_floor)
  const floorPlat = arena5State.platforms.find(p => p && p.id === 'a5_base_floor');
  if (floorPlat) {
    floorPlat.y = arena5State.currentFloorY;
    floorPlat.x = -2000;
    floorPlat.w = 5600;
    floorPlat.width = 5600;
  }
  if (typeof window !== 'undefined' && Array.isArray(window.ARENA_PLATFORMS)) {
    const wPlat = window.ARENA_PLATFORMS.find(p => p && p.id === 'a5_base_floor');
    if (wPlat) {
      wPlat.y = arena5State.currentFloorY;
      wPlat.x = -2000;
      wPlat.w = 5600;
      wPlat.width = 5600;
    }
  }
}

/**
 * Dolny utylizator: uaktywnia się gdy postać spadnie poniżej dolnej krawędzi ekranu
 */
function updateBottomRecycler(combatants) {
  const currentDeathLineY = arena5State.recyclerY || (arena5State.currentFloorY + 80);

  // Jeśli stopy gracza lub bota spadną poniżej linii śmierci -> eliminacja i respawn na wieży
  for (const victim of combatants) {
    if (!victim || victim.isDead) continue;
    const footY = victim.y + (victim.h || 72);
    if (footY > currentDeathLineY) {
      executeRecyclerKill(victim);
    }
  }
}

/**
 * Eliminacja przez utylizator z natychmiastowym bezpiecznym odrodzeniem na szczycie wieży
 */
function executeRecyclerKill(victim) {
  if (!victim || victim.isDead) return;

  victim.hp = 0;
  victim.isDead = true;
  victim.killer = { name: 'STREFA UTYLIZACJI', cause: 'RECYCLER_DEATH' };
  victim.respawnTimer = 120; // 2 sekundy do odrodzenia
  victim.vx = 0;
  victim.vy = 0;
  victim.onGround = false;
  victim.currentPlatform = null;

  triggerScreenShake(7);
  spawnBloodSpurt(victim.x + (victim.w || 26) * 0.5, victim.y + 20, 0, -1, 18, 2.0);

  triggerCombatFeedBanner('DEATH', `POCHŁONIĘTY PRZEZ UTYLIZATOR`);
}

/**
 * Aktualizuje szczyt wieży oraz dynamiczne, bezpieczne punkty odrodzenia.
 * Każdy punkt odrodzenia spoczywa wyłącznie nad solidnym klockiem lub gruntem
 * i zawsze bezpiecznie powyżej bieżącej podłogi.
 */
function updateTowerApexAndSpawns() {
  let highestRow = -1;
  const minRow = arena5State.minFloorRow || 0;
  for (const [r, rowData] of arena5State.gridRows.entries()) {
    if (r >= minRow && rowData && rowData.some(cell => cell && cell.hp > 0)) {
      if (r > highestRow) highestRow = r;
    }
  }
  arena5State.highestRowIndex = Math.max(minRow, highestRow);

  const topY = (highestRow >= minRow) ? getGridY(highestRow) : (arena5State.currentFloorY || BASE_FLOOR_Y);
  arena5State.highestBlockY = topY;

  function getSafeSpawnForColRange(startCol, endCol, fallbackX) {
    let bestY = arena5State.currentFloorY || BASE_FLOOR_Y;
    let bestX = fallbackX;
    let foundSolid = false;

    // Przeszukaj kolumny w danym sektorze
    for (let c = startCol; c <= endCol; c++) {
      for (let r = arena5State.highestRowIndex + 2; r >= minRow; r--) {
        const rowData = arena5State.gridRows.get(r);
        if (rowData && rowData[c] && rowData[c].hp > 0) {
          const blockTopY = rowData[c].y;
          if (blockTopY < arena5State.recyclerY - 40) {
            if (!foundSolid || blockTopY < bestY) {
              bestY = blockTopY;
              bestX = getGridX(c) + CELL_SIZE * 0.5;
              foundSolid = true;
            }
          }
          break;
        }
      }
    }

    if (!foundSolid) {
      // Jeśli w danym sektorze nie ma klocków powyżej utylizatora, znajdź najwyższy solidny punkt w całej wieży
      for (let c = 0; c < COLS; c++) {
        for (let r = arena5State.highestRowIndex + 2; r >= minRow; r--) {
          const rowData = arena5State.gridRows.get(r);
          if (rowData && rowData[c] && rowData[c].hp > 0) {
            const bY = rowData[c].y;
            if (bY < arena5State.recyclerY - 40) {
              if (bY < bestY) {
                bestY = bY;
                bestX = getGridX(c) + CELL_SIZE * 0.5;
                foundSolid = true;
              }
            }
          }
        }
      }
    }

    const spawnY = Math.min(bestY - 95, (arena5State.currentFloorY || BASE_FLOOR_Y) - 95);
    return { x: bestX, y: spawnY };
  }

  const s1 = getSafeSpawnForColRange(1, 4, 200);
  const s2 = getSafeSpawnForColRange(5, 8, 600);
  const s3 = getSafeSpawnForColRange(9, 11, 1000);
  const s4 = getSafeSpawnForColRange(12, 14, 1400);

  arena5State.spawns = [
    { x: s1.x, y: s1.y, facing: 1, isGround: true },
    { x: s2.x, y: s2.y, facing: 1, isGround: true },
    { x: s3.x, y: s3.y, facing: -1, isGround: true },
    { x: s4.x, y: s4.y, facing: -1, isGround: true }
  ];
}

/**
 * Aktywny system antypentracyjny (Depenetration & Anti-Stuck Solver):
 * Sprawdza, czy którakolwiek postać (gracz lub bot) wbiła się / znalazła się wewnątrz
 * litego klocka wieży i natychmiast wypycha ją na zewnątrz (na szczyt klocka lub w bok).
 * Gwarantuje, że gracz nigdy nie utknie wewnątrz bloku i sylwetka nie stanie się niewidoczna.
 */
export function resolveArena5BlockPenetration(combatants) {
  if (!Array.isArray(combatants)) return;

  const minRow = arena5State.minFloorRow || 0;

  for (const p of combatants) {
    if (!p || p.isDead) continue;

    const pW = p.w || 26;
    const pH = p.h || 72;
    const pX = p.x;
    const pY = p.y;
    const feetY = pY + pH;
    const headY = pY;

    // Zakres kolumn, które może przecinać model postaci
    const colLeft = Math.max(0, Math.min(COLS - 1, Math.floor((pX + 2) / CELL_SIZE)));
    const colRight = Math.max(0, Math.min(COLS - 1, Math.floor((pX + pW - 2) / CELL_SIZE)));

    for (let c = colLeft; c <= colRight; c++) {
      for (const [r, rowData] of arena5State.gridRows.entries()) {
        if (r < minRow || !rowData) continue;
        const cell = rowData[c];
        if (!cell || cell.hp <= 0) continue;

        const cellLeft = cell.x;
        const cellRight = cell.x + cell.w;
        const cellTop = cell.y;
        const cellBottom = cell.y + cell.h;

        // Czy bounding box postaci przecina tę komórkę?
        const overlapX = (p.x + 2 < cellRight) && (p.x + pW - 2 > cellLeft);
        const overlapY = (p.y < cellBottom - 2) && (feetY > cellTop + 4);

        if (overlapX && overlapY) {
          // Postać wniknęła w solidny blok!
          const penTop = feetY - cellTop;          // Jak głęboko stopy wniknęły od góry
          const penBottom = cellBottom - headY;    // Jak głęboko głowa wniknęła od dołu
          const penLeft = (p.x + pW) - cellLeft;   // Wniknięcie z lewej
          const penRight = cellRight - p.x;        // Wniknięcie z prawej

          // Sprawdź czy komórka powyżej (r + 1) jest pusta
          const rowAbove = arena5State.gridRows.get(r + 1);
          const cellAbove = rowAbove ? rowAbove[c] : null;
          const isAboveClear = !cellAbove || cellAbove.hp <= 0;

          // 1. Lądowanie na klocku od góry: TYLKO jeśli stopy wniknęły minimalnie od góry (penTop <= 10)
          // i postać opada w dół z powietrza (p.vy >= 0). W przeciwnym razie jest to uderzenie w bok klocka (ściana)!
          if (penTop <= 10 && isAboveClear && (p.vy >= 0 || penTop <= 4)) {
            p.y = cellTop - pH;
            p.vy = 0;
            p.onGround = true;
            p.isJumping = false;
            p.currentPlatform = cell.platformObj;
            p.currentGroundY = cellTop;
          }
          // 2. Jeśli głowa wniknęła od dołu i postać leci w górę:
          else if (penBottom <= 35 && p.vy < 0) {
            p.y = cellBottom;
            p.vy = 0.5;
            if (p.rocketBoots?.dashing && p.rocketBoots.dashDirY < -0.1) {
              p.rocketBoots.dashing = false;
            }
          }
          // 3. Wypchnięcie boczne w bok (uderzenie w ścianę pionową):
          else {
            // Sprawdź czy kolumna z lewej / prawej jest wolna na tej wysokości
            const isLeftClear = (c > 0) && (!rowData[c - 1] || rowData[c - 1].hp <= 0);
            const isRightClear = (c < COLS - 1) && (!rowData[c + 1] || rowData[c + 1].hp <= 0);

            if (isLeftClear && (!isRightClear || penLeft < penRight)) {
              p.x = cellLeft - pW;
              if (p.vx > 0) p.vx = 0;
            } else if (isRightClear) {
              p.x = cellRight;
              if (p.vx < 0) p.vx = 0;
            } else {
              // Z obu stron są klocki (uwięziony w szybie): wypchnij na szczyt tej kolumny!
              let topSolidY = arena5State.currentFloorY || BASE_FLOOR_Y;
              for (let tr = arena5State.highestRowIndex + 4; tr >= minRow; tr--) {
                const trData = arena5State.gridRows.get(tr);
                if (trData && trData[c] && trData[c].hp > 0) {
                  topSolidY = trData[c].y;
                  break;
                }
              }
              p.y = topSolidY - pH;
              p.vy = 0;
              p.onGround = true;
              p.isJumping = false;
              p.currentPlatform = cell.platformObj;
              p.currentGroundY = topSolidY;
            }
          }
        }
      }
    }
  }
}

