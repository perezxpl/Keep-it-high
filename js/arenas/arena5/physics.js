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
 * Działa ściśle na zasadzie Swept Y od dołu: wyłącznie gdy postać porusza się w górę (vy < 0)
 * i jej poprzednia pozycja głowy znajdowała się na lub poniżej spodu odsłoniętego klocka.
 */
export function checkArena5CeilingCollisions(combatants) {
  if (!Array.isArray(combatants) || combatants.length === 0) return;

  const minRow = arena5State.minFloorRow || 0;

  for (const p of combatants) {
    if (!p || p.isDead || p.vy >= 0) continue;

    const pW = p.w || 26;
    const pH = p.h || 72;
    const pX = p.x;
    const pY = p.y;
    const headY = pY;
    const feetY = pY + pH;
    const prevHeadY = pY - p.vy;

    // Zakres kolumn z bezpiecznym marginesem 6px, aby ślizganie po ścianie nie aktywowało sufitu
    const colLeft = Math.max(0, Math.min(COLS - 1, Math.floor((pX + 6) / CELL_SIZE)));
    const colRight = Math.max(0, Math.min(COLS - 1, Math.floor((pX + pW - 6) / CELL_SIZE)));

    let hitCeiling = false;
    let pushDownToY = -Infinity;

    for (let c = colLeft; c <= colRight; c++) {
      for (const [r, rowData] of arena5State.gridRows.entries()) {
        if (r < minRow || !rowData) continue;
        const cell = rowData[c];
        if (!cell || cell.hp <= 0) continue;

        // Sprawdź czy krawędzie poziome nie stykają się jedynie marginesem
        if (pX + pW <= cell.x + 6 || pX >= cell.x + cell.w - 6) continue;

        // Sprawdź czy spód tego bloczka jest odsłonięty (czy pod nim nie ma innego litego klocka)
        const rowBelow = arena5State.gridRows.get(r - 1);
        const cellBelow = rowBelow ? rowBelow[c] : null;
        const isBottomExposed = (r === minRow) ? false : (!cellBelow || cellBelow.hp <= 0);
        if (!isBottomExposed) continue;

        const blockBottom = cell.y + cell.h;
        const blockTop = cell.y;

        // Warunek kolizji sufitowej Swept Y od dołu:
        // Poprzednia pozycja głowy była na lub poniżej krawędzi sufitu, a obecna przebiła sufit
        const maxTol = Math.max(14, Math.abs(p.vy) + 6);
        if (headY < blockBottom && prevHeadY >= blockBottom - maxTol && feetY > blockBottom && headY >= blockTop) {
          hitCeiling = true;
          if (blockBottom > pushDownToY) {
            pushDownToY = blockBottom;
          }
        }
      }
    }

    if (hitCeiling && pushDownToY > -Infinity) {
      if (p.y < pushDownToY) {
        p.y = pushDownToY;
      }
      p.vy = 0.5; // Zatrzymanie ruchu w górę i lekkie odbicie w dół
      if (p.rocketBoots?.dashing && p.rocketBoots.dashDirY < -0.1) {
        p.rocketBoots.dashDirY = 0;
        p.rocketBoots.dashing = false;
      }
    }
  }
}

/**
 * Obsługa spadającego klocka, kolizji fizycznej i zmiażdżenia (Squash):
 * Zapewnia pełną, precyzyjną bryłę kolizyjną dla spadającej figury:
 * 1. Góra: stabilne lądowanie i jazda na opadającym klocku (gracz może na nim stać i zeskakiwać).
 * 2. Boki: twarde ściany boczne blokujące przenikanie postaci przy podlatywaniu z lewej/prawej.
 * 3. Spód: spycha postać w dół w powietrzu, a przy braku miejsca (<58% pH) miażdży o podłoże.
 */
function checkFallingSquash(combatants) {
  const crane = arena5State.crane;
  if (!crane || crane.phase !== 'FALLING' || !crane.shape || !Array.isArray(crane.shapeCells)) return;
  if (!Array.isArray(combatants) || combatants.length === 0) return;

  const minRow = arena5State.minFloorRow || 0;
  const currentFloorY = (arena5State && typeof arena5State.currentFloorY === 'number')
    ? arena5State.currentFloorY
    : BASE_FLOOR_Y;

  // 1. Rozbicie klocka polyomino na listę prostych prostokątów składowych (Sub-tile AABB w koordynatach świata)
  const subTiles = crane.shapeCells.map(cell => {
    const cellX = getGridX(crane.col + cell.colRel);
    const cellY = crane.currentY + (crane.shape.h - 1 - cell.rowRel) * CELL_SIZE;
    return {
      cell,
      left: cellX,
      right: cellX + CELL_SIZE,
      top: cellY,
      bottom: cellY + CELL_SIZE,
      worldCol: crane.col + cell.colRel,
      colRel: cell.colRel,
      rowRel: cell.rowRel,
      isTopEdge: !crane.shapeCells.some(o => o.colRel === cell.colRel && o.rowRel === cell.rowRel + 1),
      isBottomEdge: !crane.shapeCells.some(o => o.colRel === cell.colRel && o.rowRel === cell.rowRel - 1),
      isLeftEdge: !crane.shapeCells.some(o => o.colRel === cell.colRel - 1 && o.rowRel === cell.rowRel),
      isRightEdge: !crane.shapeCells.some(o => o.colRel === cell.colRel + 1 && o.rowRel === cell.rowRel)
    };
  });

  for (const victim of combatants) {
    if (!victim || victim.isDead) continue;

    const pW = victim.w || 26;
    const pH = victim.h || 72;
    const prevBottom = (victim.y - (victim.vy || 0)) + pH;
    const newBottom = victim.y + pH;
    const relVy = (victim.vy || 0) - (crane.vy || 0);

    // =========================================================================
    // SEPARACJA OSI: FAZA 1 - RUCH I KOLIZJA W OSI Y (Swept landing & Ceiling/Squash)
    // =========================================================================
    let landedOnCrane = false;

    // A. Lądowanie na odsłoniętych szczytach kafelków (Continuous / Swept check w osi Y)
    // Sortowanie od najwyższego kafelka, by gracz lądował na najwyższej półce/dachu
    const topTiles = subTiles.filter(st => st.isTopEdge).sort((a, b) => a.top - b.top);
    const craneStep = (crane.vy || 0) * 1;
    for (const st of topTiles) {
      if (victim.x + pW > st.left + 2 && victim.x < st.right - 2) {
        const tolerance = Math.max(22, Math.abs(relVy) + craneStep + 14);
        const isSweptCross = (prevBottom <= st.top + tolerance && newBottom >= st.top - 4);
        if (isSweptCross && victim.y < st.bottom && (victim.vy >= -3.0 || relVy >= -6.0)) {
          victim.y = st.top - pH;
          victim.vy = crane.vy;
          victim.onGround = true;
          victim.isJumping = false;
          victim.currentGroundY = st.top;
          landedOnCrane = true;
          break;
        }
      }
    }

    // B. Sprawdzenie spodu opadających kafelków (Ceiling hit / Squash kill / Push down)
    if (!landedOnCrane) {
      for (const st of subTiles) {
        if (!st.isBottomEdge) continue;

        if (victim.x + pW > st.left + 2 && victim.x < st.right - 2) {
          if (victim.y < st.bottom && victim.y + pH > st.bottom) {
            let surfaceBelowY = currentFloorY;
            for (let r = arena5State.highestRowIndex + 4; r >= minRow; r--) {
              const rData = arena5State.gridRows.get(r);
              if (rData && rData[st.worldCol] && rData[st.worldCol].hp > 0) {
                if (rData[st.worldCol].y >= victim.y + 20) {
                  surfaceBelowY = rData[st.worldCol].y;
                  break;
                }
              }
            }

            const cellTargetRow = crane.targetLandingRow + st.rowRel;
            const cellTargetY = getGridY(cellTargetRow);
            const cellTargetBottomY = cellTargetY + CELL_SIZE;
            const finalGap = surfaceBelowY - cellTargetBottomY;
            const hasSafePocketUnderneath = (finalGap >= pH - 8);

            if (hasSafePocketUnderneath && (victim.y >= cellTargetBottomY - 4)) {
              victim.y = st.bottom;
              if (victim.vy < 0) victim.vy = 0.5;
              if (victim.rocketBoots?.dashing && victim.rocketBoots.dashDirY < 0) {
                victim.rocketBoots.dashDirY = 0;
                victim.rocketBoots.dashing = false;
              }
              break;
            }

            const remainingSpace = surfaceBelowY - st.bottom;
            const isPhysicallyCrushed = (remainingSpace <= pH * 0.58) && (victim.y + pH >= surfaceBelowY - 10);

            if (isPhysicallyCrushed) {
              executeSquashKill(victim);
              break;
            } else {
              victim.y = st.bottom;
              victim.vy = Math.max(victim.vy, (crane.vy || 4.0) + 1.2);
              victim.onGround = false;
              victim.currentPlatform = null;

              if (victim.rocketBoots?.dashing && victim.rocketBoots.dashDirY < 0) {
                victim.rocketBoots.dashDirY = 0;
                victim.rocketBoots.dashing = false;
              }

              if (Math.random() < 0.25) {
                spawnRicochetSparks(victim.x + pW * 0.5, st.bottom, (Math.random() - 0.5) * 4, 3, 2);
                triggerScreenShake(3);
              }
              break;
            }
          }
        }
      }
    }

    // =========================================================================
    // SEPARACJA OSI: FAZA 2 - KOLIZJA W OSI X (Z ignorowaniem krawędzi wewnętrznych)
    // =========================================================================
    const victimBottom = victim.y + pH;
    for (const st of subTiles) {
      // Ignorowanie wewnętrznych krawędzi (Internal Edges / Ghost Vertices):
      // Jeśli stopy gracza są na lub powyżej dachu kafelka (victimBottom <= st.top + 2), kafelek nie blokuje w osi X
      if (victimBottom <= st.top + 2) continue;

      if (victimBottom > st.top + 2 && victim.y < st.bottom - 2) {
        if (victim.x + pW > st.left && victim.x < st.right) {
          const overlapLeft = (victim.x + pW) - st.left;
          const overlapRight = st.right - victim.x;

          if (st.isLeftEdge && (!st.isRightEdge || victim.vx > 0.1 || overlapLeft <= overlapRight)) {
            victim.x = st.left - pW;
            if (victim.vx > 0) victim.vx = 0;
          } else if (st.isRightEdge) {
            victim.x = st.right;
            if (victim.vx < 0) victim.vx = 0;
          }
        }
      }
    }

    // =========================================================================
    // SEPARACJA OSI: FAZA 3 - BEZWZGLĘDNA DEPENETRACJA SPADAJĄCEJ FIGURY
    // =========================================================================
    // Jeśli gracz nadal penetruje którykolwiek kafelek spadającej figury, wypchnij go
    // na najbliższą zewnętrzną krawędź bryły
    for (const st of subTiles) {
      if (victim.x + pW > st.left + 1 && victim.x < st.right - 1 &&
          victim.y + pH > st.top + 1 && victim.y < st.bottom - 1) {
        const victimCenterY = victim.y + pH * 0.5;
        const cellCenterY = st.top + CELL_SIZE * 0.5;

        if (st.isTopEdge && victimCenterY <= cellCenterY) {
          victim.y = st.top - pH;
          victim.vy = crane.vy || 0;
          victim.onGround = true;
          victim.isJumping = false;
          victim.currentGroundY = st.top;
        } else {
          const rowTiles = subTiles.filter(t => t.rowRel === st.rowRel);
          const minLeft = Math.min(...rowTiles.map(t => t.left));
          const maxRight = Math.max(...rowTiles.map(t => t.right));
          const distToLeft = (victim.x + pW) - minLeft;
          const distToRight = maxRight - victim.x;

          if (distToLeft <= distToRight) {
            victim.x = minLeft - pW;
            if (victim.vx > 0) victim.vx = 0;
          } else {
            victim.x = maxRight;
            if (victim.vx < 0) victim.vx = 0;
          }
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
  syncArena5ExposedSurfaces();
  checkAndTriggerLineClears(combatants);
  resolveArena5BlockPenetration(combatants);
}

/**
 * Synchronizuje flagi odsłonięcia powierzchni górnych (topExposed) dla wszystkich klocków w wieży:
 * Jeśli nad danym kafelkiem (r, c) w (r + 1, c) znajduje się inny aktywny, lity klocek,
 * to górna krawędź kafelka (r, c) jest wewnętrznym szwem i nie może być celem lądowania.
 */
export function syncArena5ExposedSurfaces() {
  if (!arena5State.gridRows) return;
  const minRow = arena5State.minFloorRow || 0;

  for (const [r, rowData] of arena5State.gridRows.entries()) {
    if (r < minRow || !rowData) continue;
    const rowAbove = arena5State.gridRows.get(r + 1);

    for (let c = 0; c < COLS; c++) {
      const cell = rowData[c];
      if (!cell || cell.hp <= 0) continue;

      const cellAbove = rowAbove ? rowAbove[c] : null;
      const isCovered = !!(cellAbove && cellAbove.hp > 0 && (!cellAbove.isFalling || cell.isFalling));
      const isTopExposed = !isCovered;

      cell.topExposed = isTopExposed;
      if (cell.platformObj) {
        cell.platformObj.topExposed = isTopExposed;
      }
    }
  }
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
  syncArena5ExposedSurfaces();
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

  syncArena5ExposedSurfaces();
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

  // 1. Płynne przesuwanie w bok po kopnięciu (Sliding)
  for (const rowData of arena5State.gridRows.values()) {
    if (!rowData) continue;
    for (let c = 0; c < COLS; c++) {
      const cell = rowData[c];
      if (!cell || cell.hp <= 0) continue;

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
    }
  }

  // 2. Płynne opadanie w dół po utracie podparcia (Falling)
  const fallingCells = [];
  for (const rowData of arena5State.gridRows.values()) {
    if (!rowData) continue;
    for (let c = 0; c < COLS; c++) {
      const cell = rowData[c];
      if (cell && cell.hp > 0 && cell.isFalling) {
        fallingCells.push(cell);
      }
    }
  }

  if (fallingCells.length > 0) {
    anyFallingOrSliding = true;

    // Faza A: Najpierw przesuń wszystkie spadające komórki o krok fizyki w danej klatce
    const fallAccel = 20.0;
    for (const cell of fallingCells) {
      cell.vy = Math.min(11.0, (cell.vy || 1.0) + fallAccel * dt);
      const step = cell.vy * (dt * 60);
      cell.oldY = cell.y;
      cell.y += step;
      if (cell.platformObj) {
        cell.platformObj.y = cell.y;
        cell.platformObj.oldY = cell.oldY;
      }
    }

    // Faza B: Następnie dla każdego żywego gracza sprawdź interakcję ze spadającymi klockami
    const minRow = arena5State.minFloorRow || 0;
    const baseFloor = arena5State.currentFloorY || BASE_FLOOR_Y;

    if (Array.isArray(combatants) && combatants.length > 0) {
      for (const victim of combatants) {
        if (!victim || victim.isDead) continue;
        const pH = victim.h || 72;
        const pW = victim.w || 26;
        const prevBottom = (victim.y - (victim.vy || 0)) + pH;

        // B1. Lądowanie / stabilna jazda na dachu opadającego klocka:
        // Może nastąpić WYŁĄCZNIE, gdy góra jest odsłonięta, a gracz znajdował się na lub ponad dachem
        let ridingCell = null;
        for (const cell of fallingCells) {
          const rowAbove = arena5State.gridRows.get(cell.row + 1);
          const cellAbove = rowAbove ? rowAbove[cell.col] : null;
          const isTopExposed = !cellAbove || cellAbove.hp <= 0;
          if (!isTopExposed) continue;

          const isHoriz = (victim.x + pW > cell.x + 3 && victim.x < cell.x + cell.w - 3);
          if (!isHoriz) continue;

          const wasAboveRoof = (victim.currentPlatform === cell.platformObj) ||
            (prevBottom <= cell.oldY + 16 && victim.y < cell.oldY);

          // Nigdy nie wciągaj gracza na dach, jeśli gracz znajduje się pod klockiem lub wewnątrz jego obrysu!
          if (wasAboveRoof && victim.y < cell.oldY - 10) {
            ridingCell = cell;
            break;
          }
        }

        if (ridingCell) {
          victim.y = ridingCell.y - pH;
          victim.vy = ridingCell.vy;
          victim.onGround = true;
          victim.currentPlatform = ridingCell.platformObj;
          continue; // Gracz jedzie bezpiecznie na dachu
        }

        // B2. Uderzenie od góry i zmiażdżenie (executeSquashKill) przez opadający klocek
        for (const cell of fallingCells) {
          if (victim.isDead) break;

          const isHoriz = (victim.x + pW > cell.x + 3 && victim.x < cell.x + cell.w - 3);
          const isVertHit = (victim.y < cell.y + cell.h && victim.y + pH > cell.oldY + 6);

          if (isHoriz && isVertHit) {
            // Wyznacz surfaceBelowY: najwyższy nieopadający klocek w tej kolumnie poniżej głowy gracza
            let surfaceBelowY = baseFloor;
            for (let r = arena5State.highestRowIndex + 4; r >= minRow; r--) {
              const rData = arena5State.gridRows.get(r);
              const other = rData ? rData[cell.col] : null;
              if (other && other.hp > 0 && !other.isFalling && other.y >= victim.y + 16) {
                surfaceBelowY = other.y;
                break;
              }
            }

            const cellTargetY = (typeof cell.targetY === 'number') ? cell.targetY : getGridY(cell.row);
            const cellTargetBottomY = cellTargetY + CELL_SIZE;
            const finalGap = surfaceBelowY - cellTargetBottomY;

            if (finalGap >= pH - 8) {
              // Pod opadającym kafelkiem po wylądowaniu zostanie bezpieczna wnęka: zepchnij gracza do wnęki
              victim.y = Math.min(surfaceBelowY - pH, cell.y + cell.h);
              if (victim.vy < 0) victim.vy = 0.5;
            } else {
              // Kafelek zamyka przestrzeń nad podłożem:
              const remainingSpace = surfaceBelowY - (cell.y + cell.h);
              if ((remainingSpace <= pH * 0.65 || cell.y >= cellTargetY) && (victim.y + pH >= surfaceBelowY - 16)) {
                executeSquashKill(victim);
                break;
              } else {
                victim.y = cell.y + cell.h;
                victim.vy = Math.max(victim.vy || 0, (cell.vy || 4.0) + 1.2);
                victim.onGround = false;
                victim.currentPlatform = null;
                if (victim.rocketBoots?.dashing && victim.rocketBoots.dashDirY < 0) {
                  victim.rocketBoots.dashDirY = 0;
                  victim.rocketBoots.dashing = false;
                }
              }
            }
          } else {
            // Kolizja boczna ze ścianami opadającego klocka
            const overlapX = (victim.x + pW > cell.x) && (victim.x < cell.x + cell.w);
            const overlapY = (victim.y + pH > cell.y + 6) && (victim.y < cell.y + cell.h - 6);
            if (overlapX && overlapY) {
              const penLeft = (victim.x + pW) - cell.x;
              const penRight = (cell.x + cell.w) - victim.x;
              if (penLeft <= penRight) {
                victim.x = cell.x - pW;
                if (victim.vx > 0) victim.vx = 0;
              } else {
                victim.x = cell.x + cell.w;
                if (victim.vx < 0) victim.vx = 0;
              }
            }
          }
        }
      }
    }

    // Faza C: Zamknij lądowanie komórek, które osiągnęły cell.y >= targetY
    for (const cell of fallingCells) {
      const targetY = (typeof cell.targetY === 'number') ? cell.targetY : getGridY(cell.row);
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

  if (anyLanded) {
    triggerScreenShake(3);
    updateTowerApexAndSpawns();
    syncArena5ExposedSurfaces();
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
  if (!Array.isArray(combatants) || combatants.length === 0) return;

  const minRow = arena5State.minFloorRow || 0;

  for (const p of combatants) {
    if (!p || p.isDead) continue;

    const pW = p.w || 26;
    const pH = p.h || 72;

    // Do 2 iteracji depenetracji dla narożników i styków sąsiadujących klocków
    for (let iter = 0; iter < 2; iter++) {
      let resolvedAny = false;

      const pX = p.x;
      const pY = p.y;
      const feetY = pY + pH;
      const headY = pY;

      // Zakres kolumn, które może przecinać model postaci
      const colLeft = Math.max(0, Math.min(COLS - 1, Math.floor((pX - 2) / CELL_SIZE)));
      const colRight = Math.max(0, Math.min(COLS - 1, Math.floor((pX + pW + 2) / CELL_SIZE)));

      for (let c = colLeft; c <= colRight; c++) {
        for (const [r, rowData] of arena5State.gridRows.entries()) {
          if (r < minRow || !rowData) continue;
          const cell = rowData[c];
          if (!cell || cell.hp <= 0 || cell.isFalling) continue;

          const cellLeft = cell.x;
          const cellRight = cell.x + cell.w;
          const cellTop = cell.y;
          const cellBottom = cell.y + cell.h;

          // Ignorowanie wewnętrznych krawędzi (Internal Edges / Ghost Vertices):
          // Jeśli stopy gracza znajdują się na dachu kafelka (feetY <= cellTop + 2), to nie jest wniknięcie w ten kafelek
          if (feetY <= cellTop + 2) continue;

          // Czy bounding box postaci przecina tę komórkę siatki?
          const overlapX = (p.x + pW > cellLeft + 1) && (p.x < cellRight - 1);
          const overlapY = (feetY > cellTop + 2) && (headY < cellBottom - 2);
          if (!overlapX || !overlapY) continue;

          const penTop = feetY - cellTop;          // Głębokość wniknięcia stóp od góry
          const penBottom = cellBottom - headY;    // Głębokość wniknięcia głowy od dołu
          const penLeft = (p.x + pW) - cellLeft;   // Głębokość wniknięcia od lewej
          const penRight = cellRight - p.x;        // Głębokość wniknięcia od prawej

          // Sprawdź stan komórek bezpośrednio sąsiadujących (otwarta przestrzeń)
          const rowAbove = arena5State.gridRows.get(r + 1);
          const cellAbove = rowAbove ? rowAbove[c] : null;
          const isAboveClear = !cellAbove || cellAbove.hp <= 0;

          const rowBelow = arena5State.gridRows.get(r - 1);
          const cellBelow = rowBelow ? rowBelow[c] : null;
          const isBelowClear = (r > minRow) ? (!cellBelow || cellBelow.hp <= 0) : true;

          // Ściany boczne szybu Areny 5 (c === 0 oraz c === COLS - 1) są litymi ścianami szybu
          let isLeftClear = false;
          if (c > 0) {
            const leftCellCur = rowData ? rowData[c - 1] : null;
            const leftCurFree = !leftCellCur || leftCellCur.hp <= 0;
            let leftAboveFree = true;
            if (headY < cellTop) {
              const leftCellAbove = rowAbove ? rowAbove[c - 1] : null;
              leftAboveFree = !leftCellAbove || leftCellAbove.hp <= 0;
            }
            isLeftClear = leftCurFree && leftAboveFree;
          }

          let isRightClear = false;
          if (c < COLS - 1) {
            const rightCellCur = rowData ? rowData[c + 1] : null;
            const rightCurFree = !rightCellCur || rightCellCur.hp <= 0;
            let rightAboveFree = true;
            if (headY < cellTop) {
              const rightCellAbove = rowAbove ? rowAbove[c + 1] : null;
              rightAboveFree = !rightCellAbove || rightCellAbove.hp <= 0;
            }
            isRightClear = rightCurFree && rightAboveFree;
          }

          // Sprawdzenie czy pod kafelkiem jest wystarczająco dużo miejsca na całą wysokość gracza pH
          let canFitUnderneath = false;
          if (isBelowClear) {
            let clearanceBelow = 999;
            for (let testR = r - 1; testR >= minRow; testR--) {
              const testRowData = arena5State.gridRows.get(testR);
              const testCell = testRowData ? testRowData[c] : null;
              if (testCell && testCell.hp > 0) {
                clearanceBelow = testCell.y - cellBottom;
                break;
              }
            }
            if (clearanceBelow === 999) {
              const floorY = arena5State.currentFloorY || BASE_FLOOR_Y;
              clearanceBelow = floorY - cellBottom;
            }
            canFitUnderneath = clearanceBelow >= pH;
          }

          // Minimum Translation Vector (MTV) po dostępnych, otwartych ścianach
          let bestDir = null;
          let minPen = Infinity;

          // 1. Priorytet lądowania na dachu kafelka (TOP)
          const allowTop = isAboveClear && penTop <= 42 && p.vy >= -2.0;
          const topPriority = allowTop && (
            (penTop <= penLeft + 6 && penTop <= penRight + 6) ||
            (!isLeftClear && !isRightClear)
          );

          if (topPriority) {
            bestDir = 'TOP';
            minPen = penTop;
          }

          // 2. Kolizja sufitowa (uderzenie od spodu, tylko jeśli pod spodem zmieści się gracz pH)
          if (!bestDir && isBelowClear && canFitUnderneath && p.vy < 0 && penBottom <= 24 && headY >= cellBottom - 28) {
            if (penBottom < minPen) {
              minPen = penBottom;
              bestDir = 'BOTTOM';
            }
          }

          // 3. Ściana lewa oraz prawa
          // W regułach LEFT i RIGHT nie wypychaj gracza w bok, jeśli isAboveClear && penTop < penLeft && penTop < penRight && penTop <= 48
          const topFavoredOverSides = isAboveClear && penTop < penLeft && penTop < penRight && penTop <= 48;

          if (!bestDir && !topFavoredOverSides) {
            if (isLeftClear && (!isRightClear || penLeft <= penRight) && penLeft < minPen) {
              minPen = penLeft;
              bestDir = 'LEFT';
            }
            if (isRightClear && (!isLeftClear || penRight < penLeft) && penRight < minPen) {
              minPen = penRight;
              bestDir = 'RIGHT';
            }
          }

          // Fallback, gdy żaden kierunek nie został wybrany
          if (!bestDir) {
            if (isAboveClear && penTop <= 42 && p.y < cellTop) {
              bestDir = 'TOP';
            } else if (isLeftClear && (!isRightClear || penLeft <= penRight)) {
              bestDir = 'LEFT';
            } else if (isRightClear) {
              bestDir = 'RIGHT';
            } else if (isLeftClear) {
              bestDir = 'LEFT';
            } else if (isBelowClear && canFitUnderneath && headY >= cellBottom - 28) {
              bestDir = 'BOTTOM';
            }
          }

          // Głębokie zaklinowanie (penTop > 42 lub brak wolnych bezpośrednich ścian)
          if (!bestDir) {
            if (penTop > 42 && !canFitUnderneath && feetY >= cellBottom - 16) {
              executeSquashKill(p);
              resolvedAny = true;
              break;
            } else {
              // Wypchnij gracza poziomo w stronę najbliższej wolnej kolumny w tym rzędzie
              let nearestLeftDist = Infinity;
              let nearestLeftCol = -1;
              for (let testC = c - 1; testC >= 0; testC--) {
                const testCell = rowData ? rowData[testC] : null;
                if (!testCell || testCell.hp <= 0) {
                  nearestLeftCol = testC;
                  nearestLeftDist = c - testC;
                  break;
                }
              }

              let nearestRightDist = Infinity;
              let nearestRightCol = -1;
              for (let testC = c + 1; testC < COLS; testC++) {
                const testCell = rowData ? rowData[testC] : null;
                if (!testCell || testCell.hp <= 0) {
                  nearestRightCol = testC;
                  nearestRightDist = testC - c;
                  break;
                }
              }

              if (nearestLeftCol !== -1 && nearestLeftDist <= nearestRightDist) {
                bestDir = 'LEFT';
              } else if (nearestRightCol !== -1) {
                bestDir = 'RIGHT';
              } else if (isAboveClear && penTop <= 42 && p.y < cellTop) {
                bestDir = 'TOP';
              }
            }
          }

          if (bestDir === 'TOP') {
            p.y = cellTop - pH;
            if (p.vy > 0) p.vy = 0;
            p.onGround = true;
            p.isJumping = false;
            p.currentPlatform = cell.platformObj;
            p.currentGroundY = cellTop;
            resolvedAny = true;
          } else if (bestDir === 'BOTTOM') {
            p.y = cellBottom;
            p.vy = 0.5;
            if (p.rocketBoots?.dashing && p.rocketBoots.dashDirY < -0.1) {
              p.rocketBoots.dashDirY = 0;
              p.rocketBoots.dashing = false;
            }
            resolvedAny = true;
          } else if (bestDir === 'LEFT') {
            p.x = cellLeft - pW;
            if (p.vx > 0) p.vx = 0;
            resolvedAny = true;
          } else if (bestDir === 'RIGHT') {
            p.x = cellRight;
            if (p.vx < 0) p.vx = 0;
            resolvedAny = true;
          }
        }
        if (p.isDead) break;
      }

      if (p.isDead || !resolvedAny) break;
    }
  }
}

