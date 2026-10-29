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

  // 3. Normalna grawitacja dla klocków: jeśli klocek podpierający został zniszczony, reszta opada w dół
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

      // Czy spadający klocek dosięgnął głowy postaci z góry lub postać wbiła się w niego od dołu?
      const isUnderBlock = (headY <= cellBottomY + 4) && (feetY > cellY + 8);
      if (!isUnderBlock) continue;

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

      // Sprawdź czy ofiara została dociśnięta / uwięziona między spadającym klocem a twardym podłożem/bloczkiem
      const isCompressed = (cellBottomY + pH >= surfaceBelowY - 6) ||
                           (feetY >= surfaceBelowY - 8 && (victim.onGround || !!victim.currentPlatform));

      if (isCompressed) {
        // ZMIAŻDŻENIE (Squash Kill) przy kontakcie z twardą powierzchnią poniżej!
        executeSquashKill(victim);
      } else {
        // W powietrzu: spadający klocek ściąga postać w dół i uniemożliwia przeniknięcie w górę!
        victim.y = cellBottomY;
        victim.vy = Math.max(victim.vy, (crane.vy || 6.0) + 1.5);
        victim.onGround = false;
        victim.currentPlatform = null;

        // Anuluj wszelkie zrywy jetpacka / dasha w górę
        if (victim.rocketBoots?.dashing && victim.rocketBoots.dashDirY < 0) {
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
}

/**
 * Usuwa obiekt platformy dla danej komórki
 */
function removePlatformForCell(cell) {
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
export function applyPieceGravity(combatants = []) {
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

    // 3. Znajdź niepodparte klastry i posortuj od najniższego rzędu
    const unsupportedClusters = clusters
      .filter(cl => !supportedClusterIds.has(cl.id))
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

        // Usuń ze starych pozycji
        for (const cell of cluster.cells) {
          const oldRowData = arena5State.gridRows.get(cell.row);
          if (oldRowData && oldRowData[cell.col] === cell) {
            oldRowData[cell.col] = null;
          }
        }

        // Wstaw na nowe pozycje
        for (const cell of cluster.cells) {
          const oldY = cell.y;
          const newRow = cell.row - maxDrop;
          cell.row = newRow;
          cell.y = getGridY(newRow);

          let newRowData = arena5State.gridRows.get(newRow);
          if (!newRowData) {
            newRowData = new Array(COLS).fill(null);
            arena5State.gridRows.set(newRow, newRowData);
          }
          newRowData[cell.col] = cell;

          if (cell.platformObj) {
            cell.platformObj.y = cell.y;
            cell.platformObj.gridRow = newRow;
          }

          if (Array.isArray(combatants)) {
            for (const victim of combatants) {
              if (!victim || victim.isDead) continue;
              const isStandingOnCell = (victim.currentPlatform === cell.platformObj) ||
                (victim.onGround && Math.abs(victim.y + (victim.h || 72) - oldY) <= 14 &&
                 victim.x + (victim.w || 26) > cell.x && victim.x < cell.x + cell.w);

              if (isStandingOnCell) {
                victim.y = cell.y - (victim.h || 72);
                victim.vy = 0;
                victim.onGround = true;
                victim.currentPlatform = cell.platformObj;
              }
            }
          }

          spawnConcreteDebris(cell.x + CELL_SIZE * 0.5, cell.y + CELL_SIZE, 3);
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

    // Sprawdź czy opadające klocki nie ułożyły nowej pełnej linii
    checkAndTriggerLineClears(combatants);

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

    const spawnY = Math.min(bestY - 85, (arena5State.currentFloorY || BASE_FLOOR_Y) - 85);
    return { x: bestX, y: spawnY };
  }

  const s1 = getSafeSpawnForColRange(2, 6, 280);
  const s2 = getSafeSpawnForColRange(7, 11, 680);
  const s3 = getSafeSpawnForColRange(12, 15, 1080);
  const s4 = getSafeSpawnForColRange(16, 18, 1400);

  arena5State.spawns = [
    { x: s1.x, y: s1.y, facing: 1, isGround: true },
    { x: s2.x, y: s2.y, facing: 1, isGround: true },
    { x: s3.x, y: s3.y, facing: -1, isGround: true },
    { x: s4.x, y: s4.y, facing: -1, isGround: true }
  ];
}

/**
 * Obsługa trafienia pociskiem w klocki
 */
export function handleArena5BulletHit(bullet) {
  if (!bullet) return false;

  const bx = bullet.x;
  const by = bullet.y;

  for (const rowData of arena5State.gridRows.values()) {
    if (!rowData) continue;
    for (let c = 0; c < COLS; c++) {
      const cell = rowData[c];
      if (!cell || cell.hp <= 0) continue;

      if (bx >= cell.x && bx <= cell.x + cell.w && by >= cell.y && by <= cell.y + cell.h) {
        if (cell.material === 'SCAFFOLDING') {
          return false;
        }

        const dmg = bullet.damage || 25;
        cell.hp -= dmg;
        spawnRicochetSparks(bx, by, -bullet.vx * 0.4, -bullet.vy * 0.4, 4);

        if (cell.hp <= 0) {
          destroyGridCell(cell.row, cell.col);
        }
        return true;
      }
    }
  }

  return false;
}

/**
 * Obsługa fali uderzeniowej eksplozji
 */
export function handleArena5Explosion(expX, expY, radius) {
  const radSq = radius * radius;
  let anyDestroyed = false;

  for (const [r, rowData] of arena5State.gridRows.entries()) {
    if (!rowData) continue;
    for (let c = 0; c < COLS; c++) {
      const cell = rowData[c];
      if (!cell || cell.hp <= 0) continue;

      const cellMidX = cell.x + cell.w * 0.5;
      const cellMidY = cell.y + cell.h * 0.5;
      const distSq = (cellMidX - expX) * (cellMidX - expX) + (cellMidY - expY) * (cellMidY - expY);

      if (distSq < radSq) {
        const factor = 1.0 - Math.sqrt(distSq) / radius;
        const dmg = Math.round(95 * factor);
        cell.hp -= dmg;

        if (cell.hp <= 0) {
          destroyGridCell(r, c);
          anyDestroyed = true;
        }
      }
    }
  }

  if (anyDestroyed) {
    applyColumnGravity(_activeCombatants);
  }
}

/**
 * Niszczy komórkę w siatce i natychmiast aplikuje grawitację na klocki powyżej
 */
function destroyGridCell(row, col) {
  const rowData = arena5State.gridRows.get(row);
  if (!rowData || !rowData[col]) return;

  const cell = rowData[col];
  removePlatformForCell(cell);
  rowData[col] = null;

  const midX = cell.x + cell.w * 0.5;
  const midY = cell.y + cell.h * 0.5;

  spawnConcreteDebris(midX, midY, 10);
  triggerScreenShake(5);

  for (let i = 0; i < 5; i++) {
    arena5State.debrisParticles.push({
      x: midX + (Math.random() - 0.5) * 20,
      y: midY + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 10,
      vy: -Math.random() * 6 - 2,
      vRot: (Math.random() - 0.5) * 0.25,
      rot: Math.random() * Math.PI * 2,
      w: 10 + Math.random() * 12,
      h: 8 + Math.random() * 8,
      color: cell.color,
      life: 1.0
    });
  }

  if (cell.material === 'EXPLOSIVE') {
    spawnShockwaveRing(midX, midY, 140, '#ef4444');
    triggerScreenShake(12);
    handleArena5Explosion(midX, midY, 160);
  }

  // KLUCZOWE: Zniszczenie klocka powoduje natychmiastowe opadnięcie klocków podpieranych powyżej!
  applyColumnGravity(_activeCombatants);

  // Przelicz cel suwnicy
  if (arena5State.crane && arena5State.crane.shape) {
    calculateTargetLandY(true);
  }
}

/**
 * Wyznacza najkrótszy dystans od odcinka (p1->p2) do prostopadłościanu 2D (AABB)
 */
function distSegmentToBox(p1x, p1y, p2x, p2y, rx, ry, rw, rh) {
  if (p1x >= rx && p1x <= rx + rw && p1y >= ry && p1y <= ry + rh) return 0;
  if (p2x >= rx && p2x <= rx + rw && p2y >= ry && p2y <= ry + rh) return 0;

  let minDist = Infinity;
  for (let i = 0; i <= 5; i++) {
    const t = i / 5;
    const px = p1x + (p2x - p1x) * t;
    const py = p1y + (p2y - p1y) * t;
    const clampX = Math.max(rx, Math.min(rx + rw, px));
    const clampY = Math.max(ry, Math.min(ry + rh, py));
    const d = Math.hypot(px - clampX, py - clampY);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

/**
 * Obsługa uderzenia bronią białą w klocki wieży (Nóż, Maczeta, Toporek)
 * Zadaje zredukowane obrażenia, umożliwiając graczowi wydostanie się z pułapki.
 */
export function handleArena5MeleeHit(shooter, p1, p2, width = 24, weaponId = 'KNIFE', hitTargets = null) {
  if (!p1 || !p2) return false;

  let baseDmg = 25;
  if (weaponId === 'KNIFE') baseDmg = 22;
  else if (weaponId === 'MACHETE') baseDmg = 32;
  else if (weaponId === 'TOMAHAWK') baseDmg = 38;

  const hitRadius = (width * 0.5) + 14;
  let closestCell = null;
  let closestDist = Infinity;
  let closestRow = -1;
  let closestCol = -1;

  for (const [r, rowData] of arena5State.gridRows.entries()) {
    if (!rowData) continue;
    for (let c = 0; c < COLS; c++) {
      const cell = rowData[c];
      if (!cell || cell.hp <= 0) continue;

      const d = distSegmentToBox(p1.x, p1.y, p2.x, p2.y, cell.x, cell.y, cell.w, cell.h);
      if (d <= hitRadius && d < closestDist) {
        closestDist = d;
        closestCell = cell;
        closestRow = r;
        closestCol = c;
      }
    }
  }

  if (closestCell) {
    closestCell.hp -= baseDmg;
    const hitX = Math.max(closestCell.x, Math.min(closestCell.x + closestCell.w, p2.x));
    const hitY = Math.max(closestCell.y, Math.min(closestCell.y + closestCell.h, p2.y));

    spawnRicochetSparks(hitX, hitY, (Math.random() - 0.5) * 6, -3, 5);
    spawnConcreteDebris(hitX, hitY, 3);
    triggerScreenShake(3);

    if (closestCell.hp <= 0) {
      destroyGridCell(closestRow, closestCol);
    }
    return true;
  }

  return false;
}

/**
 * Obsługa kopnięcia w klocki wieży (kop zwykły, w powietrzu lub Spartan Kick)
 * Zadaje zredukowane obrażenia (18-28 HP) i pozwala rozbić klocki uniemożliwiające ucieczkę.
 */
export function handleArena5KickHit(player, options = {}) {
  if (!player) return false;

  const isSpartan = !!options.isSpartan;
  const kickDmg = isSpartan ? 28 : 18;
  const facing = player.facing || 1;

  const footX = options.footX !== undefined
    ? options.footX
    : (player.x + (player.w || 26) * 0.5 + facing * 32);
  const footY = options.footY !== undefined
    ? options.footY
    : (player.y + (isSpartan ? (player.h || 72) * 0.5 : (player.h || 72) - 20));

  const kickRadius = options.kickRadius || (isSpartan ? 42 : 32);

  let closestCell = null;
  let closestDist = Infinity;
  let closestRow = -1;
  let closestCol = -1;

  for (const [r, rowData] of arena5State.gridRows.entries()) {
    if (!rowData) continue;
    for (let c = 0; c < COLS; c++) {
      const cell = rowData[c];
      if (!cell || cell.hp <= 0) continue;

      const clampX = Math.max(cell.x, Math.min(cell.x + cell.w, footX));
      const clampY = Math.max(cell.y, Math.min(cell.y + cell.h, footY));
      const d = Math.hypot(footX - clampX, footY - clampY);

      if (d <= kickRadius && d < closestDist) {
        closestDist = d;
        closestCell = cell;
        closestRow = r;
        closestCol = c;
      }
    }
  }

  if (closestCell) {
    closestCell.hp -= kickDmg;
    const hitX = Math.max(closestCell.x, Math.min(closestCell.x + closestCell.w, footX));
    const hitY = Math.max(closestCell.y, Math.min(closestCell.y + closestCell.h, footY));

    spawnConcreteDebris(hitX, hitY, isSpartan ? 6 : 3);
    spawnRicochetSparks(hitX, hitY, facing * 4, -2, 4);
    triggerScreenShake(isSpartan ? 6 : 3);

    if (closestCell.hp <= 0) {
      destroyGridCell(closestRow, closestCol);
    }
    return true;
  }

  return false;
}
