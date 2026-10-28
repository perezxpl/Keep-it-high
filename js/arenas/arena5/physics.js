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
  BASE_FLOOR_Y,
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

  // 2. Aktualizacja suwnicy i spadającego bloku
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
 * Obsługa cyklu życia suwnicy: Ostrzeżenie (2.2s) -> Płynny zrzut -> Uderzenie -> Cooldown (2.0s)
 */
function updateCrane(dt, combatants) {
  const crane = arena5State.crane;
  if (!crane || !crane.shape) return;

  if (crane.phase === 'WARNING') {
    crane.timer -= dt;
    if (crane.timer <= 0) {
      crane.phase = 'FALLING';
      crane.vy = 4.0; // Płynny start opadania
    }
  } else if (crane.phase === 'FALLING') {
    // Płynne, czytelne przyspieszenie zrzutu
    crane.vy = Math.min(22.0, crane.vy + 0.70);
    crane.currentY += crane.vy;

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
 * Sprawdza, czy spadający klocek uderza w postać pod sobą.
 * W powietrzu klocek odpycha w bok (deflection), a zmiażdżenie (Squash)
 * zachodzi wyłącznie w momencie dociśnięcia do twardej powierzchni poniżej.
 */
function checkFallingSquash(combatants) {
  const crane = arena5State.crane;
  if (crane.phase !== 'FALLING') return;

  const craneLeft = getGridX(crane.col);
  const craneRight = craneLeft + crane.shape.w * CELL_SIZE;
  const craneCenterX = (craneLeft + craneRight) * 0.5;

  // Zmiażdżenie (Squash) może nastąpić WYŁĄCZNIE gdy klocek dotarł tuż nad powierzchnię lądowania (ostatnie 30 px)
  const isNearImpact = (crane.currentY >= crane.targetLandY - 30);

  for (const cell of crane.shapeCells) {
    const cellX = getGridX(crane.col + cell.colRel);
    const cellY = crane.currentY + (crane.shape.h - 1 - cell.rowRel) * CELL_SIZE;
    const cellW = CELL_SIZE;
    const cellH = CELL_SIZE;

    for (const victim of combatants) {
      if (!victim || victim.isDead) continue;

      const pW = victim.w || 26;
      const pH = victim.h || 72;
      const pX = victim.x;
      const pY = victim.y;

      const overlapX = (pX < cellX + cellW - 4) && (pX + pW > cellX + 4);
      const overlapY = (pY < cellY + cellH) && (pY + pH > cellY + 8);

      if (overlapX && overlapY) {
        // Czy pod ofiarą jest twarde podłoże bazowe lub inny klocek?
        const isSupportedBelow = (victim.onGround || !!victim.currentPlatform || victim.y >= (BASE_FLOOR_Y - pH - 6));

        if (isNearImpact && isSupportedBelow) {
          executeSquashKill(victim);
        } else if (!isNearImpact) {
          // W powietrzu lub w trakcie opadania: zepchnięcie w BOK (odrzut z toru zrzutu)
          // NIGDY nie spychamy postaci w dół w głąb podłogi/klocków!
          const pushDir = (pX + pW * 0.5 < craneCenterX) ? -1 : 1;
          victim.vx = pushDir * 8.0;
          victim.vy = Math.min(victim.vy, -2.5);
          if (typeof victim.takeDamage === 'function') {
            victim.takeDamage(15, { name: 'KONTENER', cause: 'IMPACT' });
          } else {
            victim.hp = Math.max(1, (victim.hp || 100) - 15);
          }
          triggerScreenShake(5);
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
  crane.cooldownTimer = 2.0; // Spokojna 2-sekundowa przerwa przed ostrzeżeniem kolejnego modułu
  arena5State.totalBlocksDropped++;

  triggerScreenShake(9);

  // Osadzenie komórek w siatce gridRows oraz dodanie trwałych obiektów platform
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

  // Zastosuj grawitację (na wypadek gdyby klocek oparł się niżej) i sprawdź linie
  applyColumnGravity(combatants);
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
 * Stosuje normalną grawitację dla wszystkich klocków w siatce (Cascade / Gravity Physics).
 * Jeśli jakikolwiek klocek w kolumnie straci podparcie pod sobą (np. zniszczenie pociskiem,
 * wybuch, detonacja linii), wszystkie klocki powyżej opadają w dół, dopóki nie oprą się
 * na innym klocku lub płycie fundamentowej.
 */
export function applyColumnGravity(combatants = []) {
  let anyBlockFell = false;
  const minRow = arena5State.minFloorRow || 0;

  for (let c = 0; c < COLS; c++) {
    let targetRow = minRow;
    const maxR = arena5State.highestRowIndex + 6;

    for (let r = minRow; r <= maxR; r++) {
      const rowData = arena5State.gridRows.get(r);
      const cell = rowData ? rowData[c] : null;

      if (cell && cell.hp > 0) {
        if (r > targetRow) {
          // Klocek w kolumnie c wisi w powietrzu! Przesuń go w dół do targetRow
          anyBlockFell = true;
          rowData[c] = null;

          let targetRowData = arena5State.gridRows.get(targetRow);
          if (!targetRowData) {
            targetRowData = new Array(COLS).fill(null);
            arena5State.gridRows.set(targetRow, targetRowData);
          }
          targetRowData[c] = cell;

          const oldY = cell.y;
          cell.row = targetRow;
          cell.y = getGridY(targetRow);

          if (cell.platformObj) {
            cell.platformObj.y = cell.y;
            cell.platformObj.gridRow = targetRow;
          }

          // Postacie stojące na opadającym klocku płynnie zjeżdżają razem z nim
          if (Array.isArray(combatants)) {
            for (const victim of combatants) {
              if (!victim || victim.isDead) continue;
              const isVictimStandingOnThis = (victim.currentPlatform === cell.platformObj) ||
                (victim.onGround && Math.abs(victim.y + (victim.h || 72) - oldY) <= 12 &&
                 victim.x + (victim.w || 26) > cell.x && victim.x < cell.x + cell.w);

              if (isVictimStandingOnThis) {
                victim.y = cell.y - (victim.h || 72);
                victim.vy = 0;
                victim.onGround = true;
                victim.currentPlatform = cell.platformObj;
              }
            }
          }

          spawnConcreteDebris(cell.x + CELL_SIZE * 0.5, cell.y + CELL_SIZE, 3);
        }
        targetRow++;
      }
    }
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
        timer: 0.45,
        maxTimer: 0.45,
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
 * Aktualizuje podnoszącą się podłogę bazową (a5_base_floor) wraz ze wspinaczką kamery.
 * Nowe klocki zrzucane przez suwnicę lądują na bieżącej podłodze, a postacie są podciągane w górę.
 */
export function updateRisingFloor(camera, combatants = []) {
  if (!camera) return;

  const viewHeight = camera.viewHeight || (1080 / (camera.zoom || 0.75));
  const baseGroundCamY = BASE_FLOOR_Y - (viewHeight * 0.72);

  // Sprawdź o ile segmentów (CELL_SIZE = 80px) kamera wspięła się w górę
  const activeCamY = (typeof arena5State.minCameraY === 'number')
    ? arena5State.minCameraY
    : (typeof camera.targetY === 'number' ? camera.targetY : camera.y);

  if (typeof activeCamY === 'number' && activeCamY < baseGroundCamY) {
    const segmentsShifted = Math.max(0, Math.round((baseGroundCamY - activeCamY) / CELL_SIZE));
    arena5State.minFloorRow = segmentsShifted;
    arena5State.currentFloorY = BASE_FLOOR_Y - (segmentsShifted * CELL_SIZE);
  } else {
    arena5State.minFloorRow = 0;
    arena5State.currentFloorY = BASE_FLOOR_Y;
  }

  // Synchronizacja platformy podłogi w fizyce gry (a5_base_floor)
  const floorPlat = arena5State.platforms.find(p => p && p.id === 'a5_base_floor');
  if (floorPlat) {
    floorPlat.y = arena5State.currentFloorY;
  }
  if (typeof window !== 'undefined' && Array.isArray(window.ARENA_PLATFORMS)) {
    const wPlat = window.ARENA_PLATFORMS.find(p => p && p.id === 'a5_base_floor');
    if (wPlat) wPlat.y = arena5State.currentFloorY;
  }

  // Podniesienie strefy śmierci utylizatora pod bieżącą podłogę
  arena5State.recyclerY = arena5State.currentFloorY + 120;

  // Postacie stojące na podłodze są płynnie unoszone wraz z podnoszącą się podłogą
  if (Array.isArray(combatants)) {
    for (const victim of combatants) {
      if (!victim || victim.isDead) continue;
      const vH = victim.h || 72;
      const vFootY = victim.y + vH;
      if (vFootY > arena5State.currentFloorY - 4) {
        victim.y = arena5State.currentFloorY - vH;
        victim.vy = Math.min(victim.vy, 0);
        victim.onGround = true;
        victim.currentGroundY = arena5State.currentFloorY;
        if (floorPlat) victim.currentPlatform = floorPlat;
      }
    }
  }

  // Usunięcie starych klocków i platform z wierszy poniżej bieżącej podłogi
  if (arena5State.minFloorRow > 0) {
    for (const [r, rowData] of arena5State.gridRows.entries()) {
      if (r < arena5State.minFloorRow) {
        if (rowData) {
          for (let c = 0; c < COLS; c++) {
            if (rowData[c]) removePlatformForCell(rowData[c]);
          }
        }
        arena5State.gridRows.delete(r);
      }
    }
  }
}

/**
 * Dolny utylizator: uaktywnia się gdy postać spadnie poniżej podnoszącej się podłogi
 */
function updateBottomRecycler(combatants) {
  const currentDeathLineY = arena5State.recyclerY || (arena5State.currentFloorY + 120);

  // Jeśli gracz lub bot spadnie poniżej linii utylizatora pod podłogą -> eliminacja i respawn na wieży
  for (const victim of combatants) {
    if (!victim || victim.isDead) continue;
    if (victim.y > currentDeathLineY) {
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

  const s1 = getSafeSpawnForColRange(2, 5, SHAFT_LEFT + 240);
  const s2 = getSafeSpawnForColRange(6, 9, SHAFT_LEFT + 640);
  const s3 = getSafeSpawnForColRange(10, 13, SHAFT_LEFT + 1040);

  arena5State.spawns = [
    { x: s1.x, y: s1.y, facing: 1, isGround: true },
    { x: s2.x, y: s2.y, facing: 1, isGround: true },
    { x: s3.x, y: s3.y, facing: -1, isGround: true }
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
