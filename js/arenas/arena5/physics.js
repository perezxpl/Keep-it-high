// =========================================================================
// ARENAS/ARENA5/PHYSICS.JS - FIZYKA ZWIEŃCZENIA, ZMIAŻDŻENIA I DETONACJI LINII
// Warstwa fizyczna: grawitacja kontenerów, kolizje squash, tąpnięcia wieży,
// utylizator dolny i niszczenie bloków pociskami
// Standard: Zero emojis, strict module safety, 60 FPS
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
  prepareNextCraneDrop
} from './state.js';
import { triggerScreenShake } from '../../camera.js';
import { spawnBloodSpurt } from '../../world/gore.js';
import { spawnShockwaveRing, spawnConcreteDebris, spawnRicochetSparks } from '../../particles.js';
import { triggerCombatFeedBanner } from '../../ui/combatFeed.js';

/**
 * Główna pętla fizyki Areny 5 wywoływana w każdej klatce update()
 */
export function updateArena5Physics(dt, combatants = [], camera = null) {
  const stepTime = (typeof dt === 'number' && dt > 0 && dt < 0.2) ? dt : (1 / 60);

  // 1. Aktualizacja suwnicy i spadającego bloku
  updateCrane(stepTime, combatants);

  // 2. Aktualizacja animacji i efektów czyszczenia linii
  updateLineClears(stepTime, combatants);

  // 3. Aktualizacja cząsteczek odłamków zniszczonych klocków
  updateDebris(stepTime);

  // 4. Dolny utylizator i eliminacja graczy, którzy utknęli pod dolną krawędzią ekranu
  updateBottomRecycler(combatants, camera);

  // 5. Aktualizacja najwyższego punktu wieży i punktów odrodzenia
  updateTowerApexAndSpawns();

  // 6. Synchronizacja listy platform kolizyjnych z silnikiem gry
  syncPhysicsPlatforms();
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
    crane.vy = Math.min(20.0, crane.vy + 0.65);
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
 * Sprawdza, czy spadający klocek uderza w postać pod sobą
 */
function checkFallingSquash(combatants) {
  const crane = arena5State.crane;
  if (crane.phase !== 'FALLING') return;

  // Zmiażdżenie (Squash) może nastąpić WYŁĄCZNIE gdy klocek dotarł tuż nad powierzchnię lądowania (ostatnie 25 px)
  const isNearImpact = (crane.currentY >= crane.targetLandY - 25);

  for (const cell of crane.shapeCells) {
    const cellX = getGridX(crane.col + cell.colRel);
    // cell.rowRel: 0 to dolny wiersz klocka, więc jego pozycja Y od dołu to (shape.h - 1 - rowRel)
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
      const overlapY = (pY < cellY + cellH) && (pY + pH > cellY + 10);

      if (overlapX && overlapY) {
        const isSupportedBelow = (victim.onGround || victim.currentPlatform || victim.y >= (BASE_FLOOR_Y - pH - 6));

        if (isNearImpact && isSupportedBelow) {
          // Natychmiastowe zmiażdżenie w momencie dociśnięcia do gruntu/klocka pod spodem
          executeSquashKill(victim);
        } else if (!isNearImpact) {
          // W powietrzu lub w trakcie opadania: zepchnięcie postaci w dół z lekkimi obrażeniami
          victim.vy = Math.max(victim.vy, crane.vy + 4);
          victim.y = cellY + cellH;
          if (typeof victim.takeDamage === 'function') {
            victim.takeDamage(20, { name: 'KONTENER', cause: 'IMPACT' });
          } else {
            victim.hp = Math.max(1, (victim.hp || 100) - 20);
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
 * Obsługa impaktu: osadzenie klocków w siatce, pył, wstrząs i sprawdzenie pełnych linii
 */
function onCraneBlockImpact(combatants) {
  const crane = arena5State.crane;
  crane.phase = 'COOLDOWN';
  crane.cooldownTimer = 2.0; // Spokojna 2-sekundowa przerwa przed ostrzeżeniem kolejnego modułu
  arena5State.totalBlocksDropped++;

  triggerScreenShake(9);

  // Osadzenie komórek w siatce gridRows
  for (const cell of crane.shapeCells) {
    const worldCol = crane.col + cell.colRel;
    // Prawidłowy wiersz w siatce: dolny wiersz kształtu (rowRel=0) ląduje na targetLandingRow
    const worldRow = crane.targetLandingRow + cell.rowRel;

    let rowData = arena5State.gridRows.get(worldRow);
    if (!rowData) {
      rowData = new Array(COLS).fill(null);
      arena5State.gridRows.set(worldRow, rowData);
    }

    rowData[worldCol] = {
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
      isSolid: true
    };

    spawnConcreteDebris(getGridX(worldCol) + CELL_SIZE * 0.5, getGridY(worldRow) + CELL_SIZE, 5);
  }

  // Sprawdzenie czy powstała pełna linia
  checkAndTriggerLineClears(combatants);
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
      if (!rowData[c]) {
        isFull = false;
        break;
      }
    }
    if (isFull) {
      fullRows.push(rowIndex);
    }
  }

  if (fullRows.length === 0) return;

  fullRows.sort((a, b) => b - a);

  for (const r of fullRows) {
    const alreadyClearing = arena5State.activeLineClears.some(c => c.row === r);
    if (!alreadyClearing) {
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
 * Aktualizacja timerów czyszczenia linii i odpalenie wybuchu po upływie czasu ostrzeżenia
 */
function updateLineClears(dt, combatants) {
  for (let i = arena5State.activeLineClears.length - 1; i >= 0; i--) {
    const clear = arena5State.activeLineClears[i];
    clear.timer -= dt;

    if (clear.timer <= 0 && !clear.detonated) {
      clear.detonated = true;
      executeLineDetonation(clear.row, combatants);
      arena5State.activeLineClears.splice(i, 1);
    }
  }
}

/**
 * Detonuje pełny rząd: seria wybuchów, odłamki, obrażenia i opadnięcie rzędów powyżej
 */
function executeLineDetonation(rowIndex, combatants) {
  const lineY = getGridY(rowIndex) + CELL_SIZE * 0.5;
  arena5State.linesClearedCount++;

  triggerScreenShake(16);
  triggerCombatFeedBanner('KILL', `CZYSZCZENIE LINII // TĄPNIĘCIE!`);

  // Wybuchy i fala uderzeniowa na całej szerokości
  for (let c = 0; c < COLS; c++) {
    const cx = getGridX(c) + CELL_SIZE * 0.5;
    spawnShockwaveRing(cx, lineY, 80, '#f59e0b');
    spawnConcreteDebris(cx, lineY, 10);
    spawnRicochetSparks(cx, lineY, (Math.random() - 0.5) * 10, -Math.random() * 8, 6);
  }

  // Rani przeciwników stojących na detonowanym rzędzie
  for (const victim of combatants) {
    if (!victim || victim.isDead) continue;
    const vY = victim.y + (victim.h || 72);
    if (Math.abs(vY - getGridY(rowIndex)) < 55) {
      victim.vy = -8.0;
      victim.vx += (Math.random() - 0.5) * 6.0;
      if (typeof victim.takeDamage === 'function') {
        victim.takeDamage(35, { name: 'EKSPLOZJA LINII' });
      } else {
        victim.hp = Math.max(1, (victim.hp || 100) - 35);
      }
    }
  }

  // Usuń wiersz z siatki
  arena5State.gridRows.delete(rowIndex);

  // Wszystkie wiersze powyżej opadają o 1 poziom (80 px) w dół!
  const rowsAbove = [];
  for (const [r, rowData] of arena5State.gridRows.entries()) {
    if (r > rowIndex) {
      rowsAbove.push({ oldR: r, data: rowData });
    }
  }

  rowsAbove.sort((a, b) => a.oldR - b.oldR);

  for (const item of rowsAbove) {
    arena5State.gridRows.delete(item.oldR);
    const newR = item.oldR - 1;
    for (let c = 0; c < COLS; c++) {
      if (item.data[c]) {
        item.data[c].row = newR;
        item.data[c].y = getGridY(newR);
      }
    }
    arena5State.gridRows.set(newR, item.data);
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
 * Dolny utylizator: uaktywnia się WYŁĄCZNIE gdy kamera wspięła się w górę,
 * eliminując graczy, którzy wypadli całkowicie pod dolną krawędź ekranu
 */
function updateBottomRecycler(combatants, camera) {
  if (!camera) return;

  const viewHeight = camera.viewHeight || (1080 / (camera.zoom || 0.75));
  const bottomVisibleY = camera.y + viewHeight;

  // Jeśli podłoże startowe jest wciąż w zasięgu widoku ekranu (+50px),
  // utylizator spoczywa bezpiecznie pod ziemią (brak jakichkolwiek zgonów na starcie!)
  if (bottomVisibleY + 50 >= BASE_FLOOR_Y) {
    arena5State.recyclerY = BASE_FLOOR_Y + 300;
    return;
  }

  // Gdy kamera wspięła się już w górę, strefa śmierci znajduje się 40px pod dolną krawędzią ekranu
  const currentDeathLineY = bottomVisibleY + 40;
  arena5State.recyclerY = currentDeathLineY;

  // 1. Zwykłe usuwanie starych klocków pozostających pod ekranem
  const rowsToDelete = [];
  for (const [r, rowData] of arena5State.gridRows.entries()) {
    const rowY = getGridY(r);
    if (rowY > currentDeathLineY + 80) {
      rowsToDelete.push(r);
    }
  }

  for (const r of rowsToDelete) {
    arena5State.gridRows.delete(r);
  }

  // 2. Jeśli gracz lub bot spadnie poniżej linii utylizatora pod ekranem -> śmierć i respawn na szczycie
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
 * Aktualizuje szczyt wieży oraz dynamiczne punkty odrodzenia
 */
function updateTowerApexAndSpawns() {
  let highestRow = -1;
  for (const r of arena5State.gridRows.keys()) {
    if (r > highestRow) highestRow = r;
  }
  arena5State.highestRowIndex = Math.max(0, highestRow);

  const topY = (highestRow >= 0) ? getGridY(highestRow) : (BASE_FLOOR_Y - CELL_SIZE);
  arena5State.highestBlockY = topY;

  // Bezpieczne punkty odrodzenia na szczycie wieży
  arena5State.spawns = [
    { x: SHAFT_LEFT + 160, y: topY - 85, facing: 1, isGround: true },
    { x: SHAFT_LEFT + 400, y: topY - 85, facing: 1, isGround: true },
    { x: SHAFT_LEFT + 640, y: topY - 85, facing: -1, isGround: true }
  ];
}

/**
 * Buduje i synchronizuje listę platform dla silnika fizyki gry
 */
export function syncPhysicsPlatforms() {
  const plats = [];

  // 1. Lewa ściana szybu fabrycznego z twardym odpychaniem w prawo
  plats.push({
    id: 'a5_wall_left',
    name: 'LEWA ŚCIANA SZYBU',
    x: ARENA_LEFT,
    y: -100000,
    w: WALL_WIDTH,
    h: 200000,
    width: WALL_WIDTH,
    height: 200000,
    solid: true,
    isWall: true,
    pushSide: 'right',
    isGround: false,
    type: 'factory_wall'
  });

  // 2. Prawa ściana szybu fabrycznego z twardym odpychaniem w lewo
  plats.push({
    id: 'a5_wall_right',
    name: 'PRAWA ŚCIANA SZYBU',
    x: SHAFT_RIGHT,
    y: -100000,
    w: WALL_WIDTH,
    h: 200000,
    width: WALL_WIDTH,
    height: 200000,
    solid: true,
    isWall: true,
    pushSide: 'left',
    isGround: false,
    type: 'factory_wall'
  });

  // 3. Podstawa startowa szybu (BASE FLOOR) dopóki nie zostanie zniszczona przez utylizator
  if (BASE_FLOOR_Y < arena5State.recyclerY + 80) {
    plats.push({
      id: 'a5_base_floor',
      name: 'PŁYTA FUNDAMENTOWA',
      x: SHAFT_LEFT - 100,
      y: BASE_FLOOR_Y,
      w: COLS * CELL_SIZE + 200,
      h: 300,
      width: COLS * CELL_SIZE + 200,
      height: 300,
      solid: true,
      isGround: true,
      type: 'solid_deck'
    });
  }

  // 4. Wszystkie aktywne segmenty kontenerów z siatki
  for (const rowData of arena5State.gridRows.values()) {
    if (!rowData) continue;
    for (let c = 0; c < COLS; c++) {
      const cell = rowData[c];
      if (cell && cell.hp > 0) {
        plats.push({
          id: `a5_block_${cell.row}_${cell.col}`,
          name: BLOCK_MATERIALS[cell.material].name,
          x: cell.x,
          y: cell.y,
          w: cell.w,
          h: cell.h,
          width: cell.w,
          height: cell.h,
          solid: true,
          isGround: true,
          type: cell.material === 'SCAFFOLDING' ? 'catwalk' : 'container_block',
          isA5Block: true, // Flaga dla blokady przechodzenia przez boki klocków
          gridRow: cell.row,
          gridCol: cell.col,
          cellRef: cell
        });
      }
    }
  }

  arena5State.platforms.length = 0;
  arena5State.platforms.push(...plats);

  if (typeof window !== 'undefined' && Array.isArray(window.ARENA_PLATFORMS)) {
    window.ARENA_PLATFORMS.length = 0;
    window.ARENA_PLATFORMS.push(...plats);
  }
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
        }
      }
    }
  }
}

/**
 * Niszczy komórkę w siatce
 */
function destroyGridCell(row, col) {
  const rowData = arena5State.gridRows.get(row);
  if (!rowData || !rowData[col]) return;

  const cell = rowData[col];
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
}
