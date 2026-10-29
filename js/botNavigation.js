// =========================================================================
// BOTNAVIGATION.JS - SYSTEM INTELIGENTNEJ NAWIGACJI I WYDOBYWANIA SIĘ BOTÓW
// Wykrywanie figur/przeszkód nad głową (Arena 5 Tetris, platformy, jaskinie),
// tłumienie uderzania głową w sufit, szukanie wyjść i przełamywanie utknięcia
// Standard: Zero emojis, modularyzacja ES, optymalizacja 60 FPS
// =========================================================================

import { arena5State, CELL_SIZE, COLS } from './arenas/arena5/state.js';
import { ARENA_PLATFORMS, customObstacles } from './obstacles/state.js';
import { triggerStrikerGroundDash } from './classes/striker.js';
import { triggerEnforcerBlastJump } from './classes/enforcer.js';

/**
 * Wykrywa obecność konstrukcji lub figur nad głową bota oraz wyznacza
 * wolne drogi ewakuacji (w lewo lub w prawo).
 *
 * @param {Object} botTarget Instancja bota
 * @param {string} currentArenaId Identyfikator areny
 * @param {number} maxDistance Zasięg sprawdzania w górę (domyślnie 160px)
 * @returns {Object} Informacje o sufitach i punktach wyjścia
 */
export function getOverheadStructureInfo(botTarget, currentArenaId = '', maxDistance = 160) {
  if (!botTarget || botTarget.isDead) {
    return {
      isUnderOverhead: false,
      overheadBottomY: -Infinity,
      clearance: 999,
      exitLeftX: 0,
      exitRightX: 0,
      isLeftBlocked: false,
      isRightBlocked: false,
      structureType: 'NONE'
    };
  }

  const bW = botTarget.w || 24;
  const bH = botTarget.h || 70;
  const bX = botTarget.x;
  const bY = botTarget.y;
  const botLeft = bX + 2;
  const botRight = bX + bW - 2;
  const botCenterX = bX + bW / 2;
  const headY = bY;
  const feetY = bY + bH;
  const checkTopLimit = headY - maxDistance;

  let isUnderOverhead = false;
  let overheadBottomY = -Infinity;
  let exitLeftX = botCenterX - 140;
  let exitRightX = botCenterX + 140;
  let isLeftBlocked = false;
  let isRightBlocked = false;
  let structureType = 'NONE';

  // -------------------------------------------------------------------------
  // 1. ARENA 5: PREFABRYKATOR ORBITALNY (DYNAMICZNA SIATKA TETRIS + SUWNICA)
  // -------------------------------------------------------------------------
  const a5 = (typeof window !== 'undefined' && window.arena5State) || arena5State;
  const isA5 = (currentArenaId === 'arena-5' || currentArenaId === 'ARENA_5' || currentArenaId === 'orbital_prefab') || (a5 && a5.gridRows && a5.gridRows.size > 0);

  if (isA5 && a5 && a5.gridRows) {
    const minCol = Math.max(0, Math.min(COLS - 1, Math.floor(botLeft / CELL_SIZE)));
    const maxCol = Math.max(0, Math.min(COLS - 1, Math.floor(botRight / CELL_SIZE)));

    // A. Klocki w ułożonej wieży
    for (let c = minCol; c <= maxCol; c++) {
      for (const [r, rowData] of a5.gridRows.entries()) {
        if (!rowData) continue;
        const cell = rowData[c];
        if (!cell || cell.hp <= 0) continue;

        const cellBottom = cell.y + cell.h;
        // Spód klocka styka się z głową lub wisi nad nią w zasięgu skoku
        if (cellBottom <= headY + 14 && cellBottom >= checkTopLimit && feetY > cellBottom) {
          isUnderOverhead = true;
          structureType = 'TETRIS_GRID';
          if (cellBottom > overheadBottomY) {
            overheadBottomY = cellBottom;
          }
        }
      }
    }

    // B. Suwnica opadająca lub ostrzegawcza
    const crane = a5.crane;
    if (crane && crane.shape && (crane.phase === 'WARNING' || crane.phase === 'FALLING')) {
      const craneX = crane.dropX;
      const craneY = crane.currentY;
      for (const cellDef of crane.shape.cells) {
        const blkX = craneX + cellDef.c * CELL_SIZE;
        const blkY = craneY - cellDef.r * CELL_SIZE;
        const blkBottom = blkY + CELL_SIZE;
        if (blkX + CELL_SIZE > botLeft && blkX < botRight) {
          if (blkBottom <= headY + 14 && blkBottom >= checkTopLimit && feetY > blkBottom) {
            isUnderOverhead = true;
            structureType = 'FALLING_CRANE';
            if (blkBottom > overheadBottomY) {
              overheadBottomY = blkBottom;
            }
          }
        }
      }
    }

    // Wyznaczenie wolnych kolumn do ewakuacji w Arenie 5
    if (isUnderOverhead) {
      // Skan kolumn w lewo
      let foundLeft = false;
      for (let c = minCol - 1; c >= 0; c--) {
        let wallAtBody = false;
        let clearAbove = true;
        for (const [r, rowData] of a5.gridRows.entries()) {
          if (!rowData) continue;
          const cell = rowData[c];
          if (!cell || cell.hp <= 0) continue;

          // Ściana na wysokości ciała bota
          if (cell.y + cell.h > headY + 10 && cell.y < feetY - 6) {
            wallAtBody = true;
            break;
          }
          // Sufit nad głową w tej kolumnie
          if (cell.y + cell.h <= headY + 14 && cell.y + cell.h >= checkTopLimit) {
            clearAbove = false;
          }
        }
        if (wallAtBody) {
          isLeftBlocked = true;
          break;
        }
        if (clearAbove) {
          exitLeftX = c * CELL_SIZE + CELL_SIZE * 0.5;
          foundLeft = true;
          break;
        }
      }
      if (!foundLeft && !isLeftBlocked) {
        exitLeftX = Math.max(40, (minCol - 1) * CELL_SIZE + CELL_SIZE * 0.5);
      }

      // Skan kolumn w prawo
      let foundRight = false;
      for (let c = maxCol + 1; c < COLS; c++) {
        let wallAtBody = false;
        let clearAbove = true;
        for (const [r, rowData] of a5.gridRows.entries()) {
          if (!rowData) continue;
          const cell = rowData[c];
          if (!cell || cell.hp <= 0) continue;

          if (cell.y + cell.h > headY + 10 && cell.y < feetY - 6) {
            wallAtBody = true;
            break;
          }
          if (cell.y + cell.h <= headY + 14 && cell.y + cell.h >= checkTopLimit) {
            clearAbove = false;
          }
        }
        if (wallAtBody) {
          isRightBlocked = true;
          break;
        }
        if (clearAbove) {
          exitRightX = c * CELL_SIZE + CELL_SIZE * 0.5;
          foundRight = true;
          break;
        }
      }
      if (!foundRight && !isRightBlocked) {
        exitRightX = Math.min(COLS * CELL_SIZE - 40, (maxCol + 1) * CELL_SIZE + CELL_SIZE * 0.5);
      }
    }
  }

  // -------------------------------------------------------------------------
  // 2. PLATFORMY AREN (ARENA_PLATFORMS)
  // -------------------------------------------------------------------------
  if (Array.isArray(ARENA_PLATFORMS)) {
    for (let i = 0; i < ARENA_PLATFORMS.length; i++) {
      const plat = ARENA_PLATFORMS[i];
      if (!plat || plat.solid === false || plat.isDropThrough === true || plat.type === 'catwalk' || plat.type === 'cyber_catwalk') continue;

      const pLeft = plat.x;
      const pRight = plat.x + plat.w;
      const pH = plat.h || plat.thickness || 24;
      const pBottom = plat.y + pH;

      if (pRight > botLeft && pLeft < botRight) {
        if (pBottom <= headY + 14 && pBottom >= checkTopLimit && feetY > pBottom) {
          isUnderOverhead = true;
          if (structureType === 'NONE') structureType = 'ARENA_PLATFORM';
          if (pBottom > overheadBottomY) {
            overheadBottomY = pBottom;
          }
          const candLeft = pLeft - bW - 14;
          const candRight = pRight + 14;
          if (candLeft < exitLeftX || exitLeftX === botCenterX - 140) exitLeftX = Math.max(30, candLeft);
          if (candRight > exitRightX || exitRightX === botCenterX + 140) exitRightX = candRight;
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // 3. PRZESZKODY NIESTANDARDOWE (CUSTOM_OBSTACLES)
  // -------------------------------------------------------------------------
  if (Array.isArray(customObstacles)) {
    for (let i = 0; i < customObstacles.length; i++) {
      const obs = customObstacles[i];
      if (!obs || obs.exploded || obs.solid === false) continue;
      const oLeft = obs.x;
      const oRight = obs.x + (obs.w || 40);
      const oBottom = (obs.y !== undefined ? obs.y : (1200 - obs.relY)) + (obs.h || 24);
      if (oRight > botLeft && oLeft < botRight) {
        if (oBottom <= headY + 14 && oBottom >= checkTopLimit && feetY > oBottom) {
          isUnderOverhead = true;
          if (structureType === 'NONE') structureType = 'CUSTOM_OBSTACLE';
          if (oBottom > overheadBottomY) overheadBottomY = oBottom;
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // 4. ARENA 3: STROP DOLNEGO TUNELU (THE FOUNDRY)
  // -------------------------------------------------------------------------
  const isA3 = (currentArenaId === 'arena-3' || currentArenaId === 'ARENA_3' || currentArenaId === 'ARENA_FOUNDRY');
  if (isA3 && feetY > 970) {
    const isUnderHatch = (botCenterX >= 750 && botCenterX <= 950) || (botCenterX >= 3450 && botCenterX <= 3650);
    if (!isUnderHatch && headY < 970) {
      isUnderOverhead = true;
      structureType = 'TUNNEL_CEILING';
      overheadBottomY = Math.max(overheadBottomY, 970);
      exitLeftX = 850;
      exitRightX = 3550;
    }
  }

  const clearance = isUnderOverhead ? Math.max(0, overheadBottomY - (feetY - bH)) : 999;

  return {
    isUnderOverhead,
    overheadBottomY,
    clearance,
    exitLeftX,
    exitRightX,
    isLeftBlocked,
    isRightBlocked,
    structureType
  };
}

/**
 * Główna ewaluacja nawigacji pod przeszkodami i uwalniania botów w każdej klatce.
 * Tłumi bezcelowe skakanie w sufit, wyznacza kierunek ewakuacji i przełamuje zacięcia.
 *
 * @param {Object} botTarget Instancja bota
 * @param {Object} bKeys Obiekt klawiszy wejściowych bota
 * @param {number} targetX Współrzędna docelowa bota
 * @param {number} targetY Współrzędna docelowa pionowa
 * @param {string} currentArenaId Aktywna arena
 * @param {number} groundY Poziom podłoża
 * @param {Function} spawnGrass Funkcja cząsteczek
 * @returns {boolean} True jeśli bot znajduje się pod strukturą i manewruje ku wyjściu
 */
export function evaluateBotUnstuck(botTarget, bKeys, targetX, targetY, currentArenaId = '', groundY = 1200, spawnGrass = null) {
  if (!botTarget || botTarget.isDead || !bKeys) return false;

  const botCenterX = botTarget.x + (botTarget.w || 24) / 2;

  // Inicjalizacja pól nawigacyjnych bota jeśli brak
  if (typeof botTarget._lastNavX !== 'number') botTarget._lastNavX = botTarget.x;
  if (typeof botTarget._lastNavY !== 'number') botTarget._lastNavY = botTarget.y;
  botTarget._stuckTimer = botTarget._stuckTimer || 0;
  botTarget._overheadEscapeLockTimer = botTarget._overheadEscapeLockTimer || 0;
  botTarget._overheadEscapeDir = botTarget._overheadEscapeDir || 0;

  // Pomiary przemieszczenia i unieruchomienia
  const deltaX = Math.abs(botTarget.x - botTarget._lastNavX);
  const deltaY = Math.abs(botTarget.y - botTarget._lastNavY);
  const movedDist = Math.hypot(deltaX, deltaY);
  botTarget._lastNavX = botTarget.x;
  botTarget._lastNavY = botTarget.y;

  const isTryingToMove = !!(bKeys.left || bKeys.right || bKeys.up);
  if (isTryingToMove && movedDist < 0.35) {
    botTarget._stuckTimer++;
  } else if (movedDist > 1.2) {
    botTarget._stuckTimer = Math.max(0, botTarget._stuckTimer - 2);
  }

  // Pobranie informacji o strukturach nad głową
  const info = getOverheadStructureInfo(botTarget, currentArenaId, 160);

  // -------------------------------------------------------------------------
  // SYTUACJA A: BOT ZNAJDUJE SIĘ POD FIGURĄ LUB SUFITEM
  // -------------------------------------------------------------------------
  if (info.isUnderOverhead) {
    // 1. Bezwzględne tłumienie skoku i jetpacka w spód figury
    bKeys.up = false;
    botTarget.isJetpacking = false;
    botTarget.jetpackPower = 0;

    // 2. Kalkulacja kierunku ucieczki spod figury
    if (botTarget._overheadEscapeLockTimer > 0) {
      botTarget._overheadEscapeLockTimer--;
    } else {
      const distLeft = Math.abs(botCenterX - info.exitLeftX);
      const distRight = Math.abs(botCenterX - info.exitRightX);

      if (info.isLeftBlocked && !info.isRightBlocked) {
        botTarget._overheadEscapeDir = 1;
      } else if (info.isRightBlocked && !info.isLeftBlocked) {
        botTarget._overheadEscapeDir = -1;
      } else {
        const tX = (typeof targetX === 'number' && !isNaN(targetX)) ? targetX : botCenterX;
        const targetDir = Math.sign(tX - botCenterX);

        if (targetDir < 0 && distLeft <= distRight + 120) {
          botTarget._overheadEscapeDir = -1;
        } else if (targetDir > 0 && distRight <= distLeft + 120) {
          botTarget._overheadEscapeDir = 1;
        } else {
          botTarget._overheadEscapeDir = (distLeft <= distRight) ? -1 : 1;
        }
      }
      botTarget._overheadEscapeLockTimer = 14;
    }

    // 3. Wymuszenie ruchu ku wyjściu (ominięcie martwej strefy deadzone)
    if (botTarget._overheadEscapeDir < 0) {
      bKeys.left = true;
      bKeys.right = false;
    } else if (botTarget._overheadEscapeDir > 0) {
      bKeys.right = true;
      bKeys.left = false;
    }

    // 4. Kucanie przy niskim prześwicie (< 70px)
    const clearance = info.overheadBottomY - botTarget.y;
    if (clearance > -10 && clearance < 70) {
      bKeys.down = true;
      botTarget.crouchTimer = 16;
    }

    // 5. Przełamanie zacięcia pod figurą przy użyciu zdolności klasowych
    const botClassId = (botTarget.currentClass?.id || '').toUpperCase();
    const isStriker = (botClassId === 'STRIKER' || botClassId === 'PLAYMAKER' || botClassId === 'SWEEPER');
    const isEnforcer = (botClassId === 'ENFORCER');

    if (botTarget._stuckTimer > 15) {
      if (isStriker && botTarget.strikerDashCooldown <= 0 && (botTarget.jetFuel || 0) >= 15 && !botTarget.isCrouching) {
        botTarget.jetFuel = Math.max(0, botTarget.jetFuel - 15);
        triggerStrikerGroundDash(botTarget, botTarget._overheadEscapeDir || 1, 'STICK', 1.0);
        botTarget.strikerDashCooldown = 50;
      } else if (isEnforcer && botTarget.enforcerBlastCooldown <= 0 && botTarget.onGround) {
        triggerEnforcerBlastJump(botTarget, (botTarget._overheadEscapeDir || 1) * 0.75, spawnGrass);
        botTarget.enforcerBlastCooldown = 60;
      }
    }

    // 6. Odwrócenie kierunku ewakuacji jeśli bot ugrzązł na dłużej
    if (botTarget._stuckTimer > 25) {
      botTarget._overheadEscapeDir = (botTarget._overheadEscapeDir === 1) ? -1 : 1;
      botTarget._overheadEscapeLockTimer = 24;
      botTarget._stuckTimer = 8;
    }

    return true;
  }

  // -------------------------------------------------------------------------
  // SYTUACJA B: BOT NA OTWARTEJ PRZESTRZENI
  // -------------------------------------------------------------------------
  botTarget._overheadEscapeDir = 0;

  // Przeskoczenie małego schodka terenu jeśli bot stoi w miejscu i próbuje iść
  if (botTarget.onGround && botTarget._stuckTimer > 18 && (bKeys.left || bKeys.right) && !botTarget.isJumping) {
    bKeys.up = true;
    botTarget._stuckTimer = 0;
  }

  return false;
}
