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
 * Obsługa cyklu życia suwnicy: Ostrzeżenie -> Zrzut -> Uderzenie -> Cooldown
 */
function updateCrane(dt, combatants) {
  const crane = arena5State.crane;
  if (!crane || !crane.shape) return;

  if (crane.phase === 'WARNING') {
    crane.timer -= dt;
    if (crane.timer <= 0) {
      crane.phase = 'FALLING';
      crane.vy = 8.0; // Początkowa prędkość zrzutu
    }
  } else if (crane.phase === 'FALLING') {
    // Przyspieszenie grawitacyjne zrzutu kontenera
    crane.vy = Math.min(32.0, crane.vy + 1.2);
    crane.currentY += crane.vy;

    // Detekcja zmiażdżenia postaci (Squash) podczas lotu
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
 * Sprawdza, czy spadający klocek zmiażdżył gracza lub bota pod sobą
 */
function checkFallingSquash(combatants) {
  const crane = arena5State.crane;
  if (crane.phase !== 'FALLING') return;

  for (const cell of crane.shapeCells) {
    const cellX = getGridX(crane.col + cell.colRel);
    const cellY = crane.currentY + cell.rowRel * CELL_SIZE;
    const cellW = CELL_SIZE;
    const cellH = CELL_SIZE;

    for (const victim of combatants) {
      if (!victim || victim.isDead) continue;

      const pW = victim.w || 26;
      const pH = victim.h || 72;
      const pX = victim.x;
      const pY = victim.y;

      // Nakładanie prostokątów AABB
      const overlapX = (pX < cellX + cellW) && (pX + pW > cellX);
      const overlapY = (pY < cellY + cellH) && (pY + pH > cellY);

      if (overlapX && overlapY) {
        // Jeśli postać stoi na twardym podłożu lub klocku pod spodem: NATYCHMIASTOWE ZMIAŻDŻENIE (Insta-kill)
        const isSupportedBelow = (victim.onGround || victim.currentPlatform || victim.y >= (BASE_FLOOR_Y - pH - 4));

        if (isSupportedBelow) {
          executeSquashKill(victim);
        } else {
          // Jeśli jest w powietrzu: mocny impuls w dół i ciężkie obrażenia
          victim.vy = Math.max(victim.vy, crane.vy + 6);
          victim.y = cellY + cellH;
          if (typeof victim.takeDamage === 'function') {
            victim.takeDamage(45, { name: 'KONTENER', cause: 'IMPACT' });
          } else {
            victim.hp = Math.max(1, (victim.hp || 100) - 45);
          }
          triggerScreenShake(7);
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
  victim.respawnTimer = 150;
  victim.vx = 0;
  victim.vy = 0;
  victim.onGround = true;

  // Soczyste efekty krwi i potężny wstrząs ekranu
  triggerScreenShake(24);
  spawnBloodSpurt(victim.x + (victim.w || 26) * 0.5, victim.y + (victim.h || 72) * 0.5, 0, -1, 35, 3.5);

  const victimName = victim.name || (victim.isBot ? 'BOT' : 'OPERATOR');
  triggerCombatFeedBanner('DEATH', `ZMIAŻDŻONY PRZEZ KONTENER`);
}

/**
 * Obsługa impaktu: osadzenie klocków w siatce, pył, wstrząs i sprawdzenie pełnych linii
 */
function onCraneBlockImpact(combatants) {
  const crane = arena5State.crane;
  crane.phase = 'COOLDOWN';
  crane.cooldownTimer = 0.45; // Krótki interwał przed przygotowaniem kolejnego modułu
  arena5State.totalBlocksDropped++;

  triggerScreenShake(11);

  // Osadzenie komórek w siatce gridRows
  for (const cell of crane.shapeCells) {
    const worldCol = crane.col + cell.colRel;
    // Inwersja wiersza: komórka na dole kształtu ma r = crane.shape.h - 1
    const worldRow = crane.targetLandingRow + (crane.shape.h - 1 - cell.rowRel);

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

    // Pył uderzeniowy pod każdym segmentem
    spawnConcreteDebris(getGridX(worldCol) + CELL_SIZE * 0.5, getGridY(worldRow) + CELL_SIZE, 6);
  }

  // Sprawdzenie czy powstała pełna linia
  checkAndTriggerLineClears(combatants);
}

/**
 * Sprawdza wszystkie wiersze siatki i inicjuje detonację pełnych rzędów
 */
function checkAndTriggerLineClears(combatants) {
  const clearedRows = [];

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
      clearedRows.push(rowIndex);
    }
  }

  if (clearedRows.length === 0) return;

  // Sortuj od najwyższego do najniższego, by poprawne było opadanie
  clearedRows.sort((a, b) => b - a);

  for (const r of clearedRows) {
    detonateLine(r, combatants);
  }
}

/**
 * Detonuje pełny rząd: seria wybuchów, odłamki, obrażenia i opadnięcie rzędów powyżej
 */
function detonateLine(rowIndex, combatants) {
  const lineY = getGridY(rowIndex) + CELL_SIZE * 0.5;
  arena5State.linesClearedCount++;

  // Rejestracja animacji detonacji
  arena5State.activeLineClears.push({
    row: rowIndex,
    y: lineY,
    timer: 0.35,
    maxTimer: 0.35
  });

  triggerScreenShake(18);
  triggerCombatFeedBanner('KILL', `CZYSZCZENIE LINII // TĄPNIĘCIE!`);

  // Wybuchy i fala uderzeniowa na całej szerokości 10 kolumn
  for (let c = 0; c < COLS; c++) {
    const cx = getGridX(c) + CELL_SIZE * 0.5;
    spawnShockwaveRing(cx, lineY, 90, '#f59e0b');
    spawnConcreteDebris(cx, lineY, 14);
    spawnRicochetSparks(cx, lineY, (Math.random() - 0.5) * 12, -Math.random() * 10, 8);
  }

  // Rani przeciwników stojących bezpośrednio na lub w pobliżu detonowanego rzędu
  for (const victim of combatants) {
    if (!victim || victim.isDead) continue;
    const vY = victim.y + (victim.h || 72);
    if (Math.abs(vY - (getGridY(rowIndex))) < 60) {
      victim.vy = -9.0; // Podrzucenie postaci w powietrze
      victim.vx += (Math.random() - 0.5) * 8.0;
      if (typeof victim.takeDamage === 'function') {
        victim.takeDamage(35, { name: 'EKSPLOZJA LINII' });
      } else {
        victim.hp = Math.max(1, (victim.hp || 100) - 35);
      }
    }
  }

  // Usuń ten wiersz
  arena5State.gridRows.delete(rowIndex);

  // Wszystkie wiersze powyżej opadają o 1 poziom (100 px) w dół!
  const rowsAbove = [];
  for (const [r, rowData] of arena5State.gridRows.entries()) {
    if (r > rowIndex) {
      rowsAbove.push({ oldR: r, data: rowData });
    }
  }

  // Sortujemy od najniższego, by przesuwać w dół
  rowsAbove.sort((a, b) => a.oldR - b.oldR);

  for (const item of rowsAbove) {
    arena5State.gridRows.delete(item.oldR);
    const newR = item.oldR - 1;
    // Zaktualizuj współrzędne Y komórek
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
 * Aktualizacja timerów czyszczenia linii
 */
function updateLineClears(dt) {
  for (let i = arena5State.activeLineClears.length - 1; i >= 0; i--) {
    const clear = arena5State.activeLineClears[i];
    clear.timer -= dt;
    if (clear.timer <= 0) {
      arena5State.activeLineClears.splice(i, 1);
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
    p.vy += 0.45; // grawitacja odłamków
    p.life -= dt * 1.5;
    p.rot += p.vRot;
    if (p.life <= 0) {
      arena5State.debrisParticles.splice(i, 1);
    }
  }
}

/**
 * Dolny utylizator: klocki i gracze poniżej dolnej krawędzi ekranu znikają/giną
 */
function updateBottomRecycler(combatants, camera) {
  if (!camera) return;

  const viewHeight = camera.viewHeight || (1080 / (camera.zoom || 0.75));
  const bottomVisibleY = camera.y + viewHeight;
  arena5State.recyclerY = bottomVisibleY;

  // 1. Zwykłe usuwanie starych klocków poniżej dolnej krawędzi ekranu (zwolnienie pamięci i fizyki)
  const rowsToDelete = [];
  for (const [r, rowData] of arena5State.gridRows.entries()) {
    const rowY = getGridY(r);
    if (rowY > bottomVisibleY + 140) {
      rowsToDelete.push(r);
    }
  }

  for (const r of rowsToDelete) {
    arena5State.gridRows.delete(r);
  }

  // 2. Jeśli gracz lub bot spadnie pod linię ekranu -> natychmiastowa śmierć w utylizatorze
  for (const victim of combatants) {
    if (!victim || victim.isDead) continue;
    const vFootY = victim.y + (victim.h || 72);
    if (vFootY > bottomVisibleY - 15) {
      executeRecyclerKill(victim);
    }
  }
}

/**
 * Eliminacja przez utylizator z odrodzeniem na szczycie
 */
function executeRecyclerKill(victim) {
  if (!victim || victim.isDead) return;

  victim.hp = 0;
  victim.isDead = true;
  victim.killer = { name: 'STREFA UTYLIZACJI', cause: 'RECYCLER_DEATH' };
  victim.respawnTimer = 140;
  victim.vx = 0;
  victim.vy = 0;
  victim.onGround = false;
  victim.currentPlatform = null;

  triggerScreenShake(8);
  spawnBloodSpurt(victim.x + (victim.w || 26) * 0.5, victim.y + 20, 0, -1, 20, 2.2);

  const victimName = victim.name || (victim.isBot ? 'BOT' : 'OPERATOR');
  triggerCombatFeedBanner('DEATH', `POCHŁONIĘTY PRZEZ UTYLIZATOR`);
}

/**
 * Aktualizuje szczyt wieży oraz dynamiczne punkty odrodzenia
 */
function updateTowerApexAndSpawns() {
  let highestRow = 0;
  for (const r of arena5State.gridRows.keys()) {
    if (r > highestRow) highestRow = r;
  }
  arena5State.highestRowIndex = highestRow;

  // Najwyższy Y
  const topY = getGridY(highestRow);
  arena5State.highestBlockY = topY;

  // Punkty odrodzenia: 3 bezpieczne miejsca na szczycie ułożonej wieży
  arena5State.spawns = [
    { x: SHAFT_LEFT + 200, y: topY - 85, facing: 1, isGround: true },
    { x: SHAFT_LEFT + 500, y: topY - 85, facing: 1, isGround: true },
    { x: SHAFT_LEFT + 800, y: topY - 85, facing: -1, isGround: true }
  ];
}

/**
 * Buduje i synchronizuje listę platform dla silnika fizyki gry (ARENA_PLATFORMS)
 */
function syncPhysicsPlatforms() {
  const plats = [];

  // 1. Lewa ściana szybu fabrycznego (zamknięta, solidna)
  plats.push({
    id: 'a5_wall_left',
    name: 'LEWA ŚCIANA SZYBU',
    x: ARENA_LEFT,
    y: arena5State.highestBlockY - 2000,
    w: WALL_WIDTH,
    h: 50000,
    width: WALL_WIDTH,
    height: 50000,
    solid: true,
    isWall: true,
    isGround: false,
    type: 'factory_wall'
  });

  // 2. Prawa ściana szybu fabrycznego (zamknięta, solidna)
  plats.push({
    id: 'a5_wall_right',
    name: 'PRAWA ŚCIANA SZYBU',
    x: SHAFT_RIGHT,
    y: arena5State.highestBlockY - 2000,
    w: WALL_WIDTH,
    h: 50000,
    width: WALL_WIDTH,
    height: 50000,
    solid: true,
    isWall: true,
    isGround: false,
    type: 'factory_wall'
  });

  // 3. Podstawa startowa szybu (BASE FLOOR) dopóki nie zniknie
  if (BASE_FLOOR_Y < arena5State.recyclerY + 200) {
    plats.push({
      id: 'a5_base_floor',
      name: 'PŁYTA FUNDAMENTOWA',
      x: SHAFT_LEFT,
      y: BASE_FLOOR_Y,
      w: COLS * CELL_SIZE,
      h: 200,
      width: COLS * CELL_SIZE,
      height: 200,
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
          isA5Block: true,
          gridRow: cell.row,
          gridCol: cell.col,
          cellRef: cell
        });
      }
    }
  }

  arena5State.platforms.length = 0;
  arena5State.platforms.push(...plats);

  // Utrzymuj zsynchronizowaną tablicę globalną ARENA_PLATFORMS w oknie
  if (typeof window !== 'undefined' && Array.isArray(window.ARENA_PLATFORMS)) {
    window.ARENA_PLATFORMS.length = 0;
    window.ARENA_PLATFORMS.push(...plats);
  }
}

/**
 * Obsługa trafienia pociskiem w klocki na Arenie 5 (wywoływana przez activeArena.onBulletHit)
 */
export function handleArena5BulletHit(bullet) {
  if (!bullet) return false;

  const bx = bullet.x;
  const by = bullet.y;

  // Sprawdź czy pocisk uderzył w któryś z bloków siatki
  for (const rowData of arena5State.gridRows.values()) {
    if (!rowData) continue;
    for (let c = 0; c < COLS; c++) {
      const cell = rowData[c];
      if (!cell || cell.hp <= 0) continue;

      if (bx >= cell.x && bx <= cell.x + cell.w && by >= cell.y && by <= cell.y + cell.h) {
        // Jeśli to pomost ażurowy, pociski mogą przelatywać
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
 * Obsługa fali uderzeniowej eksplozji (granaty, RPG, moździerze)
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
        const dmg = Math.round(110 * factor);
        cell.hp -= dmg;

        if (cell.hp <= 0) {
          destroyGridCell(r, c);
        }
      }
    }
  }
}

/**
 * Niszczy komórkę w siatce, odpala cząstki oraz ewentualną detonację kontenera paliwowego
 */
function destroyGridCell(row, col) {
  const rowData = arena5State.gridRows.get(row);
  if (!rowData || !rowData[col]) return;

  const cell = rowData[col];
  rowData[col] = null;

  const midX = cell.x + cell.w * 0.5;
  const midY = cell.y + cell.h * 0.5;

  spawnConcreteDebris(midX, midY, 12);
  triggerScreenShake(6);

  // Dodaj fragmenty do lokalnych cząstek
  for (let i = 0; i < 6; i++) {
    arena5State.debrisParticles.push({
      x: midX + (Math.random() - 0.5) * 30,
      y: midY + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 8 - 2,
      vRot: (Math.random() - 0.5) * 0.3,
      rot: Math.random() * Math.PI * 2,
      w: 12 + Math.random() * 14,
      h: 8 + Math.random() * 10,
      color: cell.color,
      life: 1.0
    });
  }

  // Jeśli to był kontener wybuchowy -> eksplozja wtórna!
  if (cell.material === 'EXPLOSIVE') {
    spawnShockwaveRing(midX, midY, 150, '#ef4444');
    triggerScreenShake(14);
    handleArena5Explosion(midX, midY, 180);
  }
}
