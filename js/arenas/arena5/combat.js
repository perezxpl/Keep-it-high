// =========================================================================
// ARENAS/ARENA5/COMBAT.JS - INTERAKCJE BOJOWE I NISZCZENIE KLOCKOW WIEZY
// Obsluga: trafienia pociskami, wybuchy, uderzenia bronia biala, kopniecia
// pojedynczych klockow (przesuwanie o 1 rozmiar w bok), kolizje granatow
// Standard: Zero emojis, modularyzacja ES, strict DAG
// =========================================================================

import {
  CELL_SIZE,
  COLS,
  getGridX,
  getGridY,
  arena5State,
  calculateTargetLandY,
  BLOCK_MATERIALS
} from './state.js';
import {
  applyPieceGravity,
  removePlatformForCell,
  getActiveCombatants
} from './physics.js';
import { triggerScreenShake } from '../../camera.js';
import { spawnShockwaveRing, spawnConcreteDebris, spawnRicochetSparks } from '../../particles.js';

/**
 * Sprawdza przecięcie odcinka (x1, y1 -> x2, y2) z prostokątem AABB
 */
function rayIntersectsAABB(x1, y1, x2, y2, rx, ry, rw, rh) {
  if (x2 >= rx && x2 <= rx + rw && y2 >= ry && y2 <= ry + rh) return true;
  if (x1 >= rx && x1 <= rx + rw && y1 >= ry && y1 <= ry + rh) return true;

  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  if (maxX < rx || minX > rx + rw || maxY < ry || minY > ry + rh) return false;

  let tMin = 0;
  let tMax = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (Math.abs(dx) > 1e-6) {
    let tx1 = (rx - x1) / dx;
    let tx2 = (rx + rw - x1) / dx;
    if (tx1 > tx2) { const tmp = tx1; tx1 = tx2; tx2 = tmp; }
    tMin = Math.max(tMin, tx1);
    tMax = Math.min(tMax, tx2);
    if (tMin > tMax) return false;
  } else if (x1 < rx || x1 > rx + rw) {
    return false;
  }

  if (Math.abs(dy) > 1e-6) {
    let ty1 = (ry - y1) / dy;
    let ty2 = (ry + rh - y1) / dy;
    if (ty1 > ty2) { const tmp = ty1; ty1 = ty2; ty2 = tmp; }
    tMin = Math.max(tMin, ty1);
    tMax = Math.min(tMax, ty2);
    if (tMin > tMax) return false;
  } else if (y1 < ry || y1 > ry + rh) {
    return false;
  }

  return tMin <= 1 && tMax >= 0;
}

/**
 * Niszczy pojedynczą komórkę spadającej z suwnicy figury
 */
export function destroyCraneCell(cell) {
  const crane = arena5State.crane;
  if (!crane || !Array.isArray(crane.shapeCells)) return;

  const idx = crane.shapeCells.indexOf(cell);
  if (idx === -1) return;

  const cellX = getGridX(crane.col + cell.colRel);
  const cellY = crane.currentY + (crane.shape.h - 1 - cell.rowRel) * CELL_SIZE;
  const midX = cellX + CELL_SIZE * 0.5;
  const midY = cellY + CELL_SIZE * 0.5;

  spawnConcreteDebris(midX, midY, 10);
  triggerScreenShake(5);

  const matColor = BLOCK_MATERIALS[cell.material]?.color || '#64748b';
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
      color: matColor,
      life: 1.0
    });
  }

  // Usunięcie komórki z figury
  crane.shapeCells.splice(idx, 1);

  if (cell.material === 'EXPLOSIVE') {
    spawnShockwaveRing(midX, midY, 140, '#ef4444');
    triggerScreenShake(12);
    handleArena5Explosion(midX, midY, 160);
  }

  // Jeśli zniszczono wszystkie klocki figury
  if (crane.shapeCells.length === 0) {
    crane.phase = 'COOLDOWN';
    crane.cooldownTimer = 0.85;
    triggerScreenShake(8);
  } else {
    // Jeśli zostały jeszcze komórki w figurze, przelicz cel lądowania
    calculateTargetLandY(true);
  }
}

/**
 * Obsluga trafienia pociskiem w klocki wiezy oraz w spadajace figury
 */
export function handleArena5BulletHit(bullet) {
  if (!bullet) return false;

  const bx = bullet.x;
  const by = bullet.y;
  const prevX = (typeof bullet.prevX === 'number') ? bullet.prevX : bx;
  const prevY = (typeof bullet.prevY === 'number') ? bullet.prevY : by;
  const dmg = bullet.damage || 25;

  // 1. Sprawdz spadajacy blok na suwnicy (crane.phase === 'FALLING')
  const crane = arena5State.crane;
  if (crane && crane.phase === 'FALLING' && crane.shape && Array.isArray(crane.shapeCells)) {
    for (let i = crane.shapeCells.length - 1; i >= 0; i--) {
      const cell = crane.shapeCells[i];
      if (!cell || cell.hp <= 0) continue;

      const cellX = getGridX(crane.col + cell.colRel);
      const cellY = crane.currentY + (crane.shape.h - 1 - cell.rowRel) * CELL_SIZE;

      if (rayIntersectsAABB(prevX, prevY, bx, by, cellX, cellY, CELL_SIZE, CELL_SIZE)) {
        if (cell.material === 'SCAFFOLDING') {
          // Rusztowanie azurowe przepuszcza pociski
          continue;
        }

        cell.hp -= dmg;
        spawnRicochetSparks(bx, by, -bullet.vx * 0.4, -bullet.vy * 0.4, 4);

        if (cell.hp <= 0) {
          destroyCraneCell(cell);
        }
        return true;
      }
    }
  }

  // 2. Sprawdz klocki w siatce wiezy (w tym opadajace kaskadowo i przesuwane)
  for (const rowData of arena5State.gridRows.values()) {
    if (!rowData) continue;
    for (let c = 0; c < COLS; c++) {
      const cell = rowData[c];
      if (!cell || cell.hp <= 0) continue;

      if (rayIntersectsAABB(prevX, prevY, bx, by, cell.x, cell.y, cell.w, cell.h)) {
        if (cell.material === 'SCAFFOLDING') {
          return false;
        }

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
 * Obsluga fali uderzeniowej eksplozji
 */
export function handleArena5Explosion(expX, expY, radius) {
  const radSq = radius * radius;
  let anyDestroyed = false;

  // 1. Sprawdz komorki spadajacej suwnicy
  const crane = arena5State.crane;
  if (crane && crane.phase === 'FALLING' && crane.shape && Array.isArray(crane.shapeCells)) {
    for (let i = crane.shapeCells.length - 1; i >= 0; i--) {
      const cell = crane.shapeCells[i];
      if (!cell || cell.hp <= 0) continue;

      const cellX = getGridX(crane.col + cell.colRel);
      const cellY = crane.currentY + (crane.shape.h - 1 - cell.rowRel) * CELL_SIZE;
      const cellMidX = cellX + CELL_SIZE * 0.5;
      const cellMidY = cellY + CELL_SIZE * 0.5;
      const distSq = (cellMidX - expX) * (cellMidX - expX) + (cellMidY - expY) * (cellMidY - expY);

      if (distSq < radSq) {
        const factor = 1.0 - Math.sqrt(distSq) / radius;
        const dmg = Math.round(95 * factor);
        cell.hp -= dmg;

        if (cell.hp <= 0) {
          destroyCraneCell(cell);
        }
      }
    }
  }

  // 2. Sprawdz komorki w siatce wiezy
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
    applyPieceGravity(getActiveCombatants());
  }
}

/**
 * Niszczy komorke w siatce i natychmiast aplikuje grawitacje na klocki powyzej
 */
export function destroyGridCell(row, col) {
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

  // Zniszczenie klocka powoduje plynne opadniecie klockow podpieranych powyzej
  applyPieceGravity(getActiveCombatants());

  // Przelicz cel suwnicy
  if (arena5State.crane && arena5State.crane.shape) {
    calculateTargetLandY(true);
  }
}

/**
 * Wyznacza najkrotszy dystans od odcinka (p1->p2) do prostopadloscianu 2D (AABB)
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
 * Obsluga uderzenia bronia biala w klocki wiezy (Noz, Maczeta, Toporek)
 * Zadaje zredukowane obrazenia, umozliwiajac graczowi wydostanie sie z pulapki.
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
  let isCraneHit = false;

  // 1. Sprawdz spadajacy blok na suwnicy
  const crane = arena5State.crane;
  if (crane && crane.phase === 'FALLING' && crane.shape && Array.isArray(crane.shapeCells)) {
    for (const cell of crane.shapeCells) {
      if (!cell || cell.hp <= 0) continue;
      const cellX = getGridX(crane.col + cell.colRel);
      const cellY = crane.currentY + (crane.shape.h - 1 - cell.rowRel) * CELL_SIZE;

      const d = distSegmentToBox(p1.x, p1.y, p2.x, p2.y, cellX, cellY, CELL_SIZE, CELL_SIZE);
      if (d <= hitRadius && d < closestDist) {
        closestDist = d;
        closestCell = cell;
        isCraneHit = true;
      }
    }
  }

  // 2. Sprawdz klocki w siatce wiezy
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
        isCraneHit = false;
      }
    }
  }

  if (closestCell) {
    closestCell.hp -= baseDmg;
    const cX = isCraneHit ? getGridX(crane.col + closestCell.colRel) : closestCell.x;
    const cY = isCraneHit ? (crane.currentY + (crane.shape.h - 1 - closestCell.rowRel) * CELL_SIZE) : closestCell.y;
    const cW = isCraneHit ? CELL_SIZE : closestCell.w;
    const cH = isCraneHit ? CELL_SIZE : closestCell.h;

    const hitX = Math.max(cX, Math.min(cX + cW, p2.x));
    const hitY = Math.max(cY, Math.min(cY + cH, p2.y));

    spawnRicochetSparks(hitX, hitY, (Math.random() - 0.5) * 6, -3, 5);
    spawnConcreteDebris(hitX, hitY, 3);
    triggerScreenShake(3);

    if (closestCell.hp <= 0) {
      if (isCraneHit) {
        destroyCraneCell(closestCell);
      } else {
        destroyGridCell(closestRow, closestCol);
      }
    }
    return true;
  }

  return false;
}

/**
 * Sprawdza, czy dany bloczek jest pojedynczy (1x1), tzn. czy w calej siatce wiezy
 * nie ma innych aktywnych kafelkow nalezacych do tej samej polaczonej figury Tetris.
 */
export function isSingleBlock(cell) {
  if (!cell || cell.hp <= 0) return false;

  const targetPieceId = cell.pieceId;
  if (!targetPieceId) return true;

  const r = cell.row;
  const c = cell.col;

  // Sprawdz bezposrednio sasiadujace klocki z tym samym pieceId
  const checkNeighbor = (rowIdx, colIdx) => {
    if (colIdx < 0 || colIdx >= COLS) return false;
    const rData = arena5State.gridRows.get(rowIdx);
    const n = rData ? rData[colIdx] : null;
    return !!(n && n.hp > 0 && n.pieceId === targetPieceId);
  };

  if (checkNeighbor(r + 1, c)) return false;
  if (checkNeighbor(r - 1, c)) return false;
  if (checkNeighbor(r, c - 1)) return false;
  if (checkNeighbor(r, c + 1)) return false;

  // Sprawdz laczna liczbe aktywnych klockow z tym pieceId w calej siatce
  let countWithSamePiece = 0;
  for (const rowData of arena5State.gridRows.values()) {
    if (!rowData) continue;
    for (let col = 0; col < COLS; col++) {
      const other = rowData[col];
      if (other && other.hp > 0 && other.pieceId === targetPieceId) {
        countWithSamePiece++;
        if (countWithSamePiece > 1) {
          return false;
        }
      }
    }
  }

  return countWithSamePiece <= 1;
}

/**
 * Obsluga kopniecia w klocki wiezy (kop zwykly, w powietrzu lub Spartan Kick):
 * Zdarzenie kopniecia nie niszczy bloczka, lecz przesuwa go o jeden rozmiar w bok (CELL_SIZE = 100px),
 * o ile bloczek jest pojedynczy (1x1) i pole docelowe jest wolne.
 */
export function handleArena5KickHit(player, options = {}) {
  if (!player) return false;

  const isSpartan = !!options.isSpartan;
  const facing = (typeof player.facing === 'number') ? player.facing : 1;
  const kickDir = facing >= 0 ? 1 : -1;

  const footX = options.footX !== undefined
    ? options.footX
    : (player.x + (player.w || 26) * 0.5 + facing * 32);
  const footY = options.footY !== undefined
    ? options.footY
    : (player.y + (isSpartan ? (player.h || 72) * 0.5 : (player.h || 72) - 20));

  const kickRadius = options.kickRadius || (isSpartan ? 44 : 34);

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

  if (!closestCell) return false;

  const hitX = Math.max(closestCell.x, Math.min(closestCell.x + closestCell.w, footX));
  const hitY = Math.max(closestCell.y, Math.min(closestCell.y + closestCell.h, footY));

  // 1. Weryfikacja czy kopany bloczek jest pojedynczy (1x1)
  const isSingle = isSingleBlock(closestCell);

  if (isSingle) {
    const targetCol = closestCol + kickDir;

    // A. Sciany szybu wiezy blokuja przesuniecie na zewnatrz mapy
    if (targetCol < 0 || targetCol >= COLS) {
      spawnRicochetSparks(hitX, hitY, facing * 4, -1, 4);
      triggerScreenShake(2);
      return true;
    }

    // B. Sprawdzenie czy sasiednie pole w danym rzedzie jest wolne
    const curRowData = arena5State.gridRows.get(closestRow);
    const targetCell = curRowData ? curRowData[targetCol] : null;

    if (!targetCell || targetCell.hp <= 0) {
      // Sukces! Przesuniecie bloczka o jeden rozmiar w bok
      if (curRowData) {
        curRowData[closestCol] = null;
        curRowData[targetCol] = closestCell;
      }
      closestCell.col = targetCol;
      closestCell.isSliding = true;
      closestCell.slideStartX = closestCell.x;
      closestCell.slideTargetX = getGridX(targetCol);
      closestCell.slideSpeed = 22.0;

      if (closestCell.platformObj) {
        closestCell.platformObj.gridCol = targetCol;
      }

      spawnRicochetSparks(hitX, hitY, kickDir * 6, -2, 7);
      spawnConcreteDebris(hitX, hitY, isSpartan ? 5 : 3);
      triggerScreenShake(isSpartan ? 6 : 4);

      return true;
    } else {
      // Pole docelowe zablokowane przez inny klocek
      spawnRicochetSparks(hitX, hitY, facing * 4, -1, 4);
      triggerScreenShake(2);
      return true;
    }
  } else {
    // Blok jest czescia nienaruszonej figury (np. "L", "T", "O") - nie przesuwa sie i nie niszczy
    spawnRicochetSparks(hitX, hitY, facing * 3, -1, 4);
    triggerScreenShake(2);
    return true;
  }
}

/**
 * Obsluga kolizji i odbic granatu od klockow wiezy Areny 5 (w siatce oraz na suwnicy).
 * Gwarantuje, ze granat odbija sie od kazdej sciany bloku i nie przenika przez klocki.
 */
export function handleArena5GrenadeCollision(grenade) {
  if (!grenade || grenade.detonated) return false;

  const r = grenade.radius || 9;
  const gx = grenade.x;
  const gy = grenade.y;
  const prevX = (typeof grenade.prevX === 'number') ? grenade.prevX : (gx - (grenade.vx || 0));
  const prevY = (typeof grenade.prevY === 'number') ? grenade.prevY : (gy - (grenade.vy || 0));

  // 1. Sprawdz spadajacy blok na suwnicy
  const crane = arena5State.crane;
  if (crane && crane.phase === 'FALLING' && crane.shape) {
    for (const cell of crane.shapeCells) {
      const cellX = getGridX(crane.col + cell.colRel);
      const cellY = crane.currentY + (crane.shape.h - 1 - cell.rowRel) * CELL_SIZE;
      const cellW = CELL_SIZE;
      const cellH = CELL_SIZE;

      if (resolveGrenadeBoxBounce(grenade, prevX, prevY, gx, gy, r, cellX, cellY, cellW, cellH)) {
        return true;
      }
    }
  }

  // 2. Sprawdz ulozone bloczki w siatce w poblizu granatu
  const colLeft = Math.max(0, Math.min(COLS - 1, Math.floor((gx - r - 6) / CELL_SIZE)));
  const colRight = Math.max(0, Math.min(COLS - 1, Math.floor((gx + r + 6) / CELL_SIZE)));
  const minRow = arena5State.minFloorRow || 0;

  for (let c = colLeft; c <= colRight; c++) {
    for (const [rowIdx, rowData] of arena5State.gridRows.entries()) {
      if (rowIdx < minRow || !rowData) continue;
      const cell = rowData[c];
      if (!cell || cell.hp <= 0) continue;

      if (resolveGrenadeBoxBounce(grenade, prevX, prevY, gx, gy, r, cell.x, cell.y, cell.w, cell.h)) {
        return true;
      }
    }
  }

  return false;
}

function resolveGrenadeBoxBounce(grenade, prevX, prevY, gx, gy, r, bx, by, bw, bh) {
  // AABB test z marginesem promienia granatu
  if (gx + r < bx || gx - r > bx + bw || gy + r < by || gy - r > by + bh) {
    return false;
  }

  const rest = grenade.restitution || 0.58;

  // Sprawdz przez ktora krawedz granat wniknal na podstawie poprzedniej pozycji
  const cameFromTop = (prevY + r <= by + 8) && (grenade.vy > 0);
  const cameFromBottom = (prevY - r >= by + bh - 8) && (grenade.vy < 0);
  const cameFromLeft = (prevX + r <= bx + 8) && (grenade.vx > 0);
  const cameFromRight = (prevX - r >= bx + bw - 8) && (grenade.vx < 0);

  if (cameFromTop) {
    grenade.y = by - r;
    grenade.vy = -grenade.vy * rest;
    grenade.vx *= 0.85;
    grenade.vRot *= 0.75;
    grenade.bounces = (grenade.bounces || 0) + 1;
    spawnRicochetSparks(gx, by, 0, -2, 5);
    return true;
  }

  if (cameFromBottom) {
    grenade.y = by + bh + r;
    grenade.vy = -grenade.vy * rest;
    grenade.bounces = (grenade.bounces || 0) + 1;
    spawnRicochetSparks(gx, by + bh, 0, 2, 5);
    return true;
  }

  if (cameFromLeft) {
    grenade.x = bx - r;
    grenade.vx = -Math.abs(grenade.vx) * rest;
    grenade.vRot = -grenade.vRot * 0.8;
    grenade.bounces = (grenade.bounces || 0) + 1;
    spawnRicochetSparks(bx, gy, -2, 0, 5);
    return true;
  }

  if (cameFromRight) {
    grenade.x = bx + bw + r;
    grenade.vx = Math.abs(grenade.vx) * rest;
    grenade.vRot = -grenade.vRot * 0.8;
    grenade.bounces = (grenade.bounces || 0) + 1;
    spawnRicochetSparks(bx + bw, gy, 2, 0, 5);
    return true;
  }

  // Zaglebienie (penetracja z powodu duzej predkosci): wypchnij wzdluz najmniejszego zaglebienia
  const dTop = (gy + r) - by;
  const dBottom = (by + bh) - (gy - r);
  const dLeft = (gx + r) - bx;
  const dRight = (bx + bw) - (gx - r);
  const minD = Math.min(dTop, dBottom, dLeft, dRight);

  if (minD === dTop) {
    grenade.y = by - r;
    grenade.vy = -Math.abs(grenade.vy || 2) * rest;
    grenade.vx *= 0.85;
  } else if (minD === dBottom) {
    grenade.y = by + bh + r;
    grenade.vy = Math.abs(grenade.vy || 2) * rest;
  } else if (minD === dLeft) {
    grenade.x = bx - r;
    grenade.vx = -Math.abs(grenade.vx || 2) * rest;
  } else {
    grenade.x = bx + bw + r;
    grenade.vx = Math.abs(grenade.vx || 2) * rest;
  }

  grenade.bounces = (grenade.bounces || 0) + 1;
  spawnRicochetSparks(grenade.x, grenade.y, (Math.random() - 0.5) * 4, -2, 5);
  return true;
}
