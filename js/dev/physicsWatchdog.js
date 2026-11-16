// =========================================================================
// DEV/PHYSICSWATCHDOG.JS - AUTOMATYCZNY MONITOR FIZYKI I WYDAJNOŚCI
// Komponent diagnostyczny silnika gry Keep-it-high.
// Wykrywa anomalie fizyki (teleporty, penetracje, missed squash, desynchronizacje)
// oraz spadki wydajności (frame stutter > 28ms) bez angażowania człowieka.
// Standard: Strict ES Module DAG, zero emojis, polskie opisy techniczne.
// =========================================================================

import { getGridX, getGridY, CELL_SIZE, arena5State } from '../arenas/arena5/state.js';
import { ARENA_3_BRIDGE_BLOCKS, ARENA_3_RAMP_BLOCKS } from '../arenas/arena3/state.js';
import { ARENA_PLATFORMS } from '../obstacles.js';
import { player } from '../player.js';
import { getActiveBots, setBotCount } from '../bot.js';

export const watchdogState = {
  enabled: true,
  autoPlaytestEnabled: false,
  strictMode: false,
  frameCount: 0,
  warmupFrames: 60,
  simulationStartTime: 0,
  frameTimes: [], // czasy klatek w ms do wyliczania FPS
  frameExecTimes: [],
  maxFrameTimeMs: 0,
  maxDtMs: 0,
  anomalies: [],
  dedupMap: new Map(), // key -> anomaly
  combatantStates: new WeakMap(), // postac -> { prevX, prevY, prevVx, prevVy, prevOnGround, groundHistory: [], streak: 0 }
  summary: {
    teleportAnomalies: 0,
    blockPenetrations: 0,
    fallingBlockGlitches: 0,
    surfaceJitters: 0,
    blockStateDesyncs: 0,
    frameStutters: 0,
    highDrawCalls: 0
  }
};

/**
 * Profiler operacji Canvas 2D (GPU Draw Calls).
 * Aktywny wyłącznie w trybie testowym AI (?aiTest=1).
 */
export const canvasProfiler = {
  installed: false,
  active: false,
  current: {
    fill: 0,
    stroke: 0,
    drawImage: 0,
    arc: 0,
    quadraticCurveTo: 0,
    clip: 0,
    totalDrawCalls: 0
  },
  samples: [],
  breakdowns: [],
  maxTotal: 0
};

/**
 * Instaluje lekki wrapper na CanvasRenderingContext2D.prototype zliczający operacje rysujące.
 */
export function installCanvasProfiler() {
  if (canvasProfiler.installed) return;
  if (typeof window === 'undefined' || typeof window.CanvasRenderingContext2D === 'undefined') return;

  canvasProfiler.installed = true;
  const proto = window.CanvasRenderingContext2D.prototype;

  const origFill = proto.fill;
  proto.fill = function(...args) {
    if (canvasProfiler.active) {
      canvasProfiler.current.fill++;
      canvasProfiler.current.totalDrawCalls++;
    }
    return origFill.apply(this, args);
  };

  const origStroke = proto.stroke;
  proto.stroke = function(...args) {
    if (canvasProfiler.active) {
      canvasProfiler.current.stroke++;
      canvasProfiler.current.totalDrawCalls++;
    }
    return origStroke.apply(this, args);
  };

  const origDrawImage = proto.drawImage;
  proto.drawImage = function(...args) {
    if (canvasProfiler.active) {
      canvasProfiler.current.drawImage++;
      canvasProfiler.current.totalDrawCalls++;
    }
    return origDrawImage.apply(this, args);
  };

  const origArc = proto.arc;
  proto.arc = function(...args) {
    if (canvasProfiler.active) {
      canvasProfiler.current.arc++;
    }
    return origArc.apply(this, args);
  };

  const origQuad = proto.quadraticCurveTo;
  proto.quadraticCurveTo = function(...args) {
    if (canvasProfiler.active) {
      canvasProfiler.current.quadraticCurveTo++;
    }
    return origQuad.apply(this, args);
  };

  const origClip = proto.clip;
  proto.clip = function(...args) {
    if (canvasProfiler.active) {
      canvasProfiler.current.clip++;
    }
    return origClip.apply(this, args);
  };
}

/**
 * Rejestruje anomalię z automatyczną deduplikacją powtarzających się zdarzeń.
 */
function registerAnomaly(type, key, title, details, metadata = {}) {
  const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
  const existing = watchdogState.dedupMap.get(key);

  if (existing) {
    existing.count++;
    existing.lastFrame = watchdogState.frameCount;
    existing.lastTimeMs = now;
    existing.details = details;
    existing.metadata = { ...existing.metadata, ...metadata };
    return existing;
  }

  const anomaly = {
    id: watchdogState.anomalies.length + 1,
    type,
    key,
    firstFrame: watchdogState.frameCount,
    lastFrame: watchdogState.frameCount,
    firstTimeMs: now,
    lastTimeMs: now,
    count: 1,
    title,
    details,
    metadata
  };

  watchdogState.anomalies.push(anomaly);
  watchdogState.dedupMap.set(key, anomaly);

  if (type === 'TELEPORT_ANOMALY') watchdogState.summary.teleportAnomalies++;
  else if (type === 'BLOCK_PENETRATION') watchdogState.summary.blockPenetrations++;
  else if (type === 'FALLING_BLOCK_GLITCH') watchdogState.summary.fallingBlockGlitches++;
  else if (type === 'SURFACE_JITTER') watchdogState.summary.surfaceJitters++;
  else if (type === 'BLOCK_STATE_DESYNC') watchdogState.summary.blockStateDesyncs++;
  else if (type === 'FRAME_STUTTER') watchdogState.summary.frameStutters++;
  else if (type === 'HIGH_DRAW_CALLS') watchdogState.summary.highDrawCalls++;

  return anomaly;
}

/**
 * Formatuje sekwencję ostatnich 5 klatek z historii ruchu postaci.
 */
function formatHistoryTrail(history) {
  if (!Array.isArray(history) || history.length === 0) return '';
  const lines = ['\n- **Sekwencja ostatnich 5 klatek (trail przed anomalią):**'];
  for (let idx = 0; idx < history.length; idx++) {
    const h = history[idx];
    const rel = history.length - 1 - idx;
    lines.push(`  - [T-${rel}] klatka ${h.frame}: pos=(${h.x}, ${h.y}), vel=(${h.vx}, ${h.vy}), onGround=${h.onGround}, plat=${h.platformId || 'brak'}`);
  }
  return lines.join('\n');
}

/**
 * Szuka najbliższego klocka z siatki Areny 5 lub suwnicy w zadanym promieniu.
 */
function findNearbyA5BlockInfo(x, y, radius = 120) {
  if (!arena5State || !arena5State.gridRows) return 'Brak klocków A5 w pobliżu.';

  let closestDist = Infinity;
  let closestCellInfo = null;

  for (const rowData of arena5State.gridRows.values()) {
    if (!rowData) continue;
    for (let c = 0; c < 10; c++) {
      const cell = rowData[c];
      if (!cell || cell.hp <= 0) continue;
      const cellCenterX = cell.x + cell.w / 2;
      const cellCenterY = cell.y + cell.h / 2;
      const d = Math.hypot(cellCenterX - x, cellCenterY - y);
      if (d < radius && d < closestDist) {
        closestDist = d;
        closestCellInfo = `klocek [row=${cell.row}, col=${cell.col}, isFalling=${!!cell.isFalling}, isSliding=${!!cell.isSliding}, y=${cell.y.toFixed(1)}, targetY=${cell.targetY}] w odl. ${d.toFixed(1)}px`;
      }
    }
  }

  const crane = arena5State.crane;
  if (crane && crane.phase === 'FALLING' && Array.isArray(crane.shapeCells)) {
    for (const cell of crane.shapeCells) {
      const cellX = getGridX(crane.col + cell.colRel);
      const cellY = crane.currentY + (crane.shape.h - 1 - cell.rowRel) * CELL_SIZE;
      const d = Math.hypot(cellX + CELL_SIZE / 2 - x, cellY + CELL_SIZE / 2 - y);
      if (d < radius && d < closestDist) {
        closestDist = d;
        closestCellInfo = `opadający blok suwnicy [craneCol=${crane.col}, currentY=${crane.currentY.toFixed(1)}] w odl. ${d.toFixed(1)}px`;
      }
    }
  }

  return closestCellInfo ? `W promieniu ${radius}px: ${closestCellInfo}.` : `Brak klocków w promieniu ${radius}px.`;
}

/**
 * Główna pętla diagnostyczna wywoływana w każdej klatce z poziomu main.js.
 * @param {number} dt Odstęp czasu klatki w sekundach (delta / 1000)
 * @param {number} frameExecutionMs Czas faktycznego wykonywania update i draw w ms
 */
export function updatePhysicsWatchdog(dt, frameExecutionMs = 0) {
  if (!watchdogState.enabled) return;

  const currentGameState = (typeof window !== 'undefined' && window.GAME_STATE?.current) || 'PLAYING';
  if (currentGameState !== 'PLAYING') return;

  watchdogState.frameCount++;
  const dtMs = dt * 1000;
  if (watchdogState.simulationStartTime === 0) {
    watchdogState.simulationStartTime = (typeof performance !== 'undefined') ? performance.now() : Date.now();
  }

  // Zapis próbek wydajności (z ograniczeniem do ostatnich 7200 klatek = 2 minuty)
  if (watchdogState.frameCount > watchdogState.warmupFrames) {
    if (watchdogState.frameTimes.length < 7200) {
      watchdogState.frameTimes.push(dtMs);
      watchdogState.frameExecTimes.push(frameExecutionMs);
    }
    if (dtMs > watchdogState.maxDtMs) watchdogState.maxDtMs = dtMs;
    if (frameExecutionMs > watchdogState.maxFrameTimeMs) watchdogState.maxFrameTimeMs = frameExecutionMs;

    if (canvasProfiler.active) {
      const totalCalls = canvasProfiler.current.totalDrawCalls;
      canvasProfiler.samples.push(totalCalls);
      canvasProfiler.breakdowns.push({ ...canvasProfiler.current });
      if (totalCalls > canvasProfiler.maxTotal) {
        canvasProfiler.maxTotal = totalCalls;
      }
      if (totalCalls > 850) {
        const key = `HIGH_DRAW_CALLS::${Math.floor(watchdogState.frameCount / 30)}`; // deduplikacja w oknie 30 klatek (~500ms)
        const curArenaId = (typeof window !== 'undefined' && window.activeArenaId) || 'nieznana';
        const title = `Przekroczony limit Draw Calls: ${totalCalls} > 850`;
        const desc = `Zarejestrowano wysokie obciążenie Canvas 2D w klatce ${watchdogState.frameCount}: totalDrawCalls=${totalCalls} (fill=${canvasProfiler.current.fill}, stroke=${canvasProfiler.current.stroke}, drawImage=${canvasProfiler.current.drawImage}, arc=${canvasProfiler.current.arc}, quadraticCurveTo=${canvasProfiler.current.quadraticCurveTo}). Arena: ${curArenaId}.`;
        registerAnomaly('HIGH_DRAW_CALLS', key, title, desc, {
          totalCalls,
          breakdown: { ...canvasProfiler.current },
          arena: curArenaId
        });
      }
    }
  }

  // Reset licznika klatkowego operacji rysujących na kolejną klatkę
  if (canvasProfiler.installed) {
    canvasProfiler.current.fill = 0;
    canvasProfiler.current.stroke = 0;
    canvasProfiler.current.drawImage = 0;
    canvasProfiler.current.arc = 0;
    canvasProfiler.current.quadraticCurveTo = 0;
    canvasProfiler.current.clip = 0;
    canvasProfiler.current.totalDrawCalls = 0;
  }

  // =========================================================================
  // 1. MONITORING PRZYCIĘĆ WYDAJNOŚCI (FRAME_STUTTER > 28 ms)
  // =========================================================================
  if (watchdogState.frameCount > watchdogState.warmupFrames && (dtMs > 28.0 || frameExecutionMs > 28.0)) {
    const curArenaId = (typeof window !== 'undefined' && window.activeArenaId) || 'nieznana';
    const combatantsList = (typeof window !== 'undefined' && Array.isArray(window.combatants)) ? window.combatants : [player];
    const aliveCombatants = combatantsList.filter(c => c && !c.isDead).length;
    const bulletsCount = (typeof window !== 'undefined' && Array.isArray(window.bullets)) ? window.bullets.length : 0;
    const particlesCount = (typeof window !== 'undefined' && Array.isArray(window.particles)) ? window.particles.length : 0;
    const goreCount = (typeof window !== 'undefined' && Array.isArray(window.goreParticles)) ? window.goreParticles.length : 0;

    let fallingBlocksCount = 0;
    let clearingRowsCount = 0;
    if (arena5State && arena5State.gridRows) {
      for (const rowData of arena5State.gridRows.values()) {
        if (!rowData) continue;
        for (let c = 0; c < 10; c++) {
          if (rowData[c] && rowData[c].isFalling) fallingBlocksCount++;
        }
      }
      clearingRowsCount = (arena5State.clearingRows && arena5State.clearingRows.size) || 0;
    }

    const key = `STUTTER::${Math.floor(watchdogState.frameCount / 15)}`; // deduplikacja w oknie 15 klatek (~250ms)
    const title = `Przycięcie klatki: dt=${dtMs.toFixed(1)}ms, exec=${frameExecutionMs.toFixed(1)}ms`;
    const desc = `Zarejestrowano spadek płynności w klatce ${watchdogState.frameCount} (dt=${dtMs.toFixed(1)}ms, wykonanie=${frameExecutionMs.toFixed(1)}ms > limit 28ms). Arena: ${curArenaId}, żywe postacie: ${aliveCombatants}, pociski: ${bulletsCount}, cząsteczki: ${particlesCount}, krew: ${goreCount}, opadające klocki: ${fallingBlocksCount}, wybuchy linii: ${clearingRowsCount}.`;

    registerAnomaly('FRAME_STUTTER', key, title, desc, {
      dtMs,
      frameExecutionMs,
      arena: curArenaId,
      aliveCombatants,
      bulletsCount,
      particlesCount,
      fallingBlocksCount,
      clearingRowsCount
    });
  }

  // Pobranie listy aktywnych uczestników walki
  const combatants = (typeof window !== 'undefined' && Array.isArray(window.combatants) && window.combatants.length > 0)
    ? window.combatants
    : [player, ...(typeof getActiveBots === 'function' ? getActiveBots() : [])].filter(Boolean);

  const isArena5 = (typeof window !== 'undefined' && (window.activeArenaId === 'ARENA_5' || window.activeArenaId === 'arena-5' || window.activeArenaId === 'PREFAB_TOWER'));
  const isArena3 = (typeof window !== 'undefined' && (window.activeArenaId === 'ARENA_3' || window.activeArenaId === 'arena-3' || window.activeArenaId === 'ARENA_FOUNDRY'));
  const currentFloorY = isArena5
    ? ((typeof arena5State?.currentFloorY === 'number') ? arena5State.currentFloorY : 1200)
    : 1200;

  // =========================================================================
  // 2. MONITORING POSTACI (TELEPORT, PENETRACJA, JITTER, MISSED SQUASH)
  // =========================================================================
  for (let i = 0; i < combatants.length; i++) {
    const p = combatants[i];
    if (!p) continue;

    let cState = watchdogState.combatantStates.get(p);
    if (!cState) {
      cState = {
        prevX: p.x,
        prevY: p.y,
        prevVx: p.vx || 0,
        prevVy: p.vy || 0,
        prevOnGround: !!p.onGround,
        prevBottom: p.y + (p.h || 72),
        groundHistory: [!!p.onGround],
        penetrationStreak: 0
      };
      watchdogState.combatantStates.set(p, cState);
      continue;
    }

    const colH = (p.staggerTimer > 0) ? 15 : ((p.isProne) ? (p.hitboxHeight || 26) : (p.h || 72));
    const pW = p.w || 24;
    const pLeft = p.x;
    const pRight = p.x + pW;
    const pTop = p.y;
    const pBottom = p.y + colH;
    const pName = p.name || (p === player ? 'LOKALNY GRACZ' : `BOT_${i}`);

    // Rejestracja historii ostatnich 5 klatek postaci
    if (!cState.history) cState.history = [];
    cState.history.push({
      frame: watchdogState.frameCount,
      x: Math.round(p.x * 10) / 10,
      y: Math.round(p.y * 10) / 10,
      vx: Math.round((p.vx || 0) * 100) / 100,
      vy: Math.round((p.vy || 0) * 100) / 100,
      onGround: !!p.onGround,
      platformId: p.currentPlatform?.id || null
    });
    if (cState.history.length > 5) {
      cState.history.shift();
    }

    const wasDead = !!cState.prevIsDead;
    const isAlive = !p.isDead && (p.hp > 0) && ((p.deathTimer || 0) <= 0) && !p.isRespawning && ((p.respawnTimer || 0) <= 0);
    const isJustRespawned = (wasDead && isAlive) || (typeof p.spawnProtectionTimer === 'number' && p.spawnProtectionTimer > 100) || (p.respawnTimer && p.respawnTimer > 0);
    const isActionLaunch = !!(p.isDashing || p.isAirDashing || p._superDashActive || p._isSlidingDash || (p.jumpTakeoffTimer && p.jumpTakeoffTimer > 0) || (p.dropThroughTimer && p.dropThroughTimer > 18));

    // Po odrodzeniu (respawn na wybranym punkcie wieży / areny) synchronizujemy pozycję bazową bez zgłaszania teleportu
    if (isJustRespawned || !isAlive) {
      cState.prevX = p.x;
      cState.prevY = p.y;
      cState.prevVx = p.vx || 0;
      cState.prevVy = p.vy || 0;
      cState.prevBottom = pBottom;
      cState.penetrationStreak = 0;
      cState.prevIsDead = !isAlive;
      continue;
    }

    const isStrict = watchdogState.strictMode;

    // --- ANOMALIA 1: TELEPORT_ANOMALY ---
    if (isAlive && !isActionLaunch && !isJustRespawned && watchdogState.frameCount > watchdogState.warmupFrames) {
      const dx = p.x - cState.prevX;
      const dy = p.y - cState.prevY;

      const pSteps = (typeof window !== 'undefined' && window.lastPhysicsSteps) ? Math.max(1, window.lastPhysicsSteps) : 1;

      // Sprawdzenie czy gracz jedzie na przesuwającym się klocku (sliding block platform)
      let platformSpeedX = 0;
      if (isArena5 && arena5State && arena5State.gridRows) {
        for (const rowData of arena5State.gridRows.values()) {
          if (!rowData) continue;
          for (let c = 0; c < 10; c++) {
            const cell = rowData[c];
            if (cell && cell.isSliding) {
              if (Math.abs((cell.x + cell.w / 2) - (p.x + pW / 2)) < 90 && Math.abs(cell.y - pBottom) <= 12) {
                platformSpeedX = Math.max(platformSpeedX, cell.slideSpeed || 22);
              }
            }
          }
        }
      }

      const maxVx = Math.max(Math.abs(p.vx || 0), Math.abs(cState.prevVx || 0), platformSpeedX);
      const maxVy = Math.max(Math.abs(p.vy || 0), Math.abs(cState.prevVy || 0));

      // Progi wykrywania: w trybie strict zaostrzone do |dx| > maxVx*1.4*steps + 14 oraz |dy| > maxVy*1.4*steps + 18
      const maxAllowedDx = isStrict
        ? (maxVx * 1.4 * pSteps + 14)
        : (maxVx * 2.1 * pSteps + 26);

      const slopeMargin = (p.onGround && cState.prevOnGround)
        ? (isStrict ? (maxVx * 1.2 + 6) : (maxVx * 2.0 + 10))
        : 0;

      const maxAllowedDy = isStrict
        ? (maxVy * 1.4 * pSteps + 18 + slopeMargin)
        : (maxVy * 2.1 * pSteps + 34 + slopeMargin);

      // Sprawdzenie zmiany pozycji stóp (wstawanie ze staggara lub prone przesuwa p.y do góry o deltaH, ale stopy nie teleportują się)
      const dFootY = pBottom - cState.prevBottom;
      const isPostureShift = (Math.abs(dFootY) <= Math.abs(p.vy || 0) + 24);

      // Sprawdzenie czy w promieniu 100px znajduje się opadający lub przesuwający się klocek
      let isNearFallingOrSliding = false;
      if (isArena5 && arena5State && arena5State.gridRows) {
        for (const rowData of arena5State.gridRows.values()) {
          if (!rowData || isNearFallingOrSliding) continue;
          for (let c = 0; c < 10; c++) {
            const cell = rowData[c];
            if (cell && (cell.isFalling || cell.isSliding)) {
              if (Math.hypot((cell.x + cell.w / 2) - p.x, (cell.y + cell.h / 2) - p.y) < 100) {
                isNearFallingOrSliding = true;
                break;
              }
            }
          }
        }
      }

      // W trybie strict=1 NIE ignoruj anomalii jako step-down jeśli w promieniu 100px jest opadający/przesuwający się klocek
      const allowStepDown = !isStrict || !isNearFallingOrSliding;
      const isStepDown = allowStepDown && (dy > 0 && dy <= 105 && p.onGround);
      const isStepUp = (dy < 0 && dy >= -115 && p.onGround);
      const isStepValid = isStepDown || isStepUp;

      if (Math.abs(dx) > maxAllowedDx || (Math.abs(dy) > maxAllowedDy && !isPostureShift && !isStepValid)) {
        const nearInfo = isArena5 ? findNearbyA5BlockInfo(p.x, p.y, 120) : 'Poza Areną 5.';
        const historyTrail = formatHistoryTrail(cState.history);
        const key = `TELEPORT::${pName}::${Math.round(p.x / 80)}_${Math.round(p.y / 80)}`;
        const title = `Nieoczekiwana teleportacja postaci: ${pName}`;
        const desc = `Postać "${pName}" przemieściła się w 1 klatce o dx=${dx.toFixed(1)}px, dy=${dy.toFixed(1)}px (dozwolony limit: dx<=${maxAllowedDx.toFixed(1)}, dy<=${maxAllowedDy.toFixed(1)}). Prędkość: vx=${(p.vx || 0).toFixed(2)}, vy=${(p.vy || 0).toFixed(2)}, onGround=${!!p.onGround}. ${nearInfo}${historyTrail}`;

        registerAnomaly('TELEPORT_ANOMALY', key, title, desc, {
          character: pName,
          dx, dy, vx: p.vx, vy: p.vy, onGround: !!p.onGround,
          history: [...cState.history]
        });
      }
    }

    // --- ANOMALIA 2: BLOCK_PENETRATION ---
    let maxPenetrationFound = 0;
    let worstPenDetails = null;

    if (isAlive && watchdogState.frameCount > watchdogState.warmupFrames) {
      if (isArena5 && arena5State && arena5State.gridRows) {
        for (const rowData of arena5State.gridRows.values()) {
          if (!rowData) continue;
          for (let c = 0; c < 10; c++) {
            const cell = rowData[c];
            if (!cell || cell.hp <= 0 || cell.isFalling || cell.isSliding) continue;

            const cLeft = cell.x;
            const cRight = cell.x + cell.w;
            const cTop = cell.y;
            const cBottom = cell.y + cell.h;

            const overlapX = Math.min(pRight, cRight) - Math.max(pLeft, cLeft);
            const overlapY = Math.min(pBottom, cBottom) - Math.max(pTop, cTop);

            if (overlapX > 4 && overlapY > 4) {
              const penDepth = Math.min(overlapX, overlapY);
              if (penDepth > maxPenetrationFound) {
                maxPenetrationFound = penDepth;
                const penTop = Math.max(0, pBottom - cTop);
                const penBottom = Math.max(0, cBottom - pTop);
                const penLeft = Math.max(0, pRight - cLeft);
                const penRight = Math.max(0, cRight - pLeft);

                worstPenDetails = {
                  cellRow: cell.row,
                  cellCol: cell.col,
                  cellX: cell.x,
                  cellY: cell.y,
                  cellW: cell.w,
                  cellH: cell.h,
                  penTop,
                  penBottom,
                  penLeft,
                  penRight,
                  penDepth
                };
              }
            }
          }
        }
      }

      // W trybie strict=1 wykrywaj penetrację już od 1 klatki wnikania > 4px (w trybie standardowym >= 2 klatek > 6px)
      const penThreshold = isStrict ? 4.0 : 6.0;
      const streakThreshold = isStrict ? 1 : 2;

      if (maxPenetrationFound > penThreshold) {
        cState.penetrationStreak++;
        if (cState.penetrationStreak >= streakThreshold && worstPenDetails) {
          const historyTrail = formatHistoryTrail(cState.history);
          const key = `PENETRATION::${pName}::r${worstPenDetails.cellRow}_c${worstPenDetails.cellCol}`;
          const title = `Wnikanie w lity klocek: ${pName}`;
          const desc = `Hitbox żywej postaci "${pName}" (x=${p.x.toFixed(1)}, y=${p.y.toFixed(1)}, w=${pW}, h=${colH}) wnika głębiej niż ${penThreshold}px (${worstPenDetails.penDepth.toFixed(1)}px) do wnętrza litego klocka [row=${worstPenDetails.cellRow}, col=${worstPenDetails.cellCol}] przez ${cState.penetrationStreak} klatek. Głębokości: penTop=${worstPenDetails.penTop.toFixed(1)}px, penBottom=${worstPenDetails.penBottom.toFixed(1)}px, penLeft=${worstPenDetails.penLeft.toFixed(1)}px, penRight=${worstPenDetails.penRight.toFixed(1)}px. Pozycja klocka: x=${worstPenDetails.cellX.toFixed(1)}, y=${worstPenDetails.cellY.toFixed(1)}.${historyTrail}`;

          registerAnomaly('BLOCK_PENETRATION', key, title, desc, {
            character: pName,
            history: [...cState.history],
            ...worstPenDetails
          });
        }
      } else {
        cState.penetrationStreak = 0;
      }
    }

    // --- ANOMALIA 3: FALLING_BLOCK_GLITCH / MISSED_SQUASH ---
    if (isArena5 && isAlive && watchdogState.frameCount > watchdogState.warmupFrames) {
      if (arena5State && arena5State.gridRows) {
        for (const rowData of arena5State.gridRows.values()) {
          if (!rowData) continue;
          for (let c = 0; c < 10; c++) {
            const cell = rowData[c];
            if (!cell || cell.hp <= 0 || !cell.isFalling) continue;

            const isHorizAligned = (pRight > cell.x + 6 && pLeft < cell.x + cell.w - 6);
            if (!isHorizAligned) continue;

            // Sprawdzenie czy opadający klocek wepchnął postać w głąb podłoża
            if (pBottom > currentFloorY + 4) {
              const key = `MISSED_SQUASH::${pName}::r${cell.row}_c${cell.col}`;
              const title = `Brak zmiażdżenia (Missed Squash): ${pName}`;
              const desc = `Opadający klocek [row=${cell.row}, col=${cell.col}, vy=${(cell.vy || 0).toFixed(1)}] zepchnął stopy postaci "${pName}" na y=${pBottom.toFixed(1)} poniżej podłoża (floorY=${currentFloorY.toFixed(1)}) zamiast wykonać squash kill.`;

              registerAnomaly('FALLING_BLOCK_GLITCH', key, title, desc, {
                character: pName,
                cellRow: cell.row,
                cellCol: cell.col,
                pBottom,
                currentFloorY
              });
            }

            // Sprawdzenie czy postać przeniknęła pionowo przez opadający klocek na jego dach
            const wasBelowRoof = (cState.prevBottom > cell.y + 12 && cState.prevY < cell.y + cell.h);
            const isNowOnRoof = (pBottom <= cell.y + 6 && pBottom >= cell.y - 8);
            const noJumpOrJet = (!p.isJumping && !p.isJetpacking && (p.vy || 0) >= -0.5);

            if (wasBelowRoof && isNowOnRoof && noJumpOrJet) {
              const key = `BLOCK_POP_THROUGH::${pName}::r${cell.row}_c${cell.col}`;
              const title = `Przeniknięcie przez opadający klocek na dach: ${pName}`;
              const desc = `Postać "${pName}" przeniknęła przez opadający klocek [row=${cell.row}, col=${cell.col}, y=${cell.y.toFixed(1)}] i pojawiła się na jego dachu bez wykonania skoku ani ciągu jetpacka.`;

              registerAnomaly('FALLING_BLOCK_GLITCH', key, title, desc, {
                character: pName,
                cellRow: cell.row,
                cellCol: cell.col
              });
            }
          }
        }
      }
    }

    // --- ANOMALIA 4: SURFACE_JITTER ---
    cState.groundHistory.push(!!p.onGround);
    if (cState.groundHistory.length > 10) {
      cState.groundHistory.shift();
    }

    if (cState.groundHistory.length === 10 && watchdogState.frameCount > watchdogState.warmupFrames) {
      let toggleCount = 0;
      for (let h = 1; h < cState.groundHistory.length; h++) {
        if (cState.groundHistory[h] !== cState.groundHistory[h - 1]) {
          toggleCount++;
        }
      }

      if (toggleCount > 4) {
        // Zgodnie ze specyfikacją: sprawdzaj migotanie TYLKO w bezpośrednim pobliżu opadającego klocka lub rampy
        let isNearFallingOrRamp = false;
        let nearDetails = '';

        if (isArena5 && arena5State && arena5State.gridRows) {
          for (const rowData of arena5State.gridRows.values()) {
            if (!rowData || isNearFallingOrRamp) continue;
            for (let c = 0; c < 10; c++) {
              const cell = rowData[c];
              if (cell && (cell.isFalling || cell.isSliding)) {
                const d = Math.hypot((cell.x + cell.w / 2) - p.x, (cell.y + cell.h / 2) - p.y);
                if (d < 140) {
                  isNearFallingOrRamp = true;
                  nearDetails = `opadający klocek [r=${cell.row}, c=${cell.col}] w odl. ${d.toFixed(1)}px`;
                  break;
                }
              }
            }
          }
          if (!isNearFallingOrRamp && arena5State.crane && arena5State.crane.phase === 'FALLING') {
            const d = Math.hypot((getGridX(arena5State.crane.col) + 50) - p.x, arena5State.crane.currentY - p.y);
            if (d < 140) {
              isNearFallingOrRamp = true;
              nearDetails = `opadająca suwnica w odl. ${d.toFixed(1)}px`;
            }
          }
        } else if (isArena3) {
          const rampBlocks = (typeof window !== 'undefined' && Array.isArray(window.ARENA_3_RAMP_BLOCKS)) ? window.ARENA_3_RAMP_BLOCKS : ARENA_3_RAMP_BLOCKS;
          if (Array.isArray(rampBlocks)) {
            for (const r of rampBlocks) {
              if (r && Math.hypot((r.x + (r.w || 40) / 2) - p.x, (r.y + (r.h || 20) / 2) - p.y) < 140) {
                isNearFallingOrRamp = true;
                nearDetails = `rampa #${r.id || '?'} w odl. < 140px`;
                break;
              }
            }
          }
        }

        if (isNearFallingOrRamp) {
          const key = `JITTER::${pName}::${Math.round(p.x / 60)}`;
          const title = `Migotanie stanu podłoża (Surface Jitter): ${pName}`;
          const desc = `Postać "${pName}" zmieniła stan onGround ${toggleCount} razy w ciągu ostatnich 10 klatek w pobliżu: ${nearDetails} (x=${p.x.toFixed(1)}, y=${p.y.toFixed(1)}).`;

          registerAnomaly('SURFACE_JITTER', key, title, desc, {
            character: pName,
            toggleCount,
            x: p.x,
            y: p.y
          });
        }
      }
    }

    // Aktualizacja stanu bazowego dla kolejnej klatki
    cState.prevX = p.x;
    cState.prevY = p.y;
    cState.prevVx = p.vx || 0;
    cState.prevVy = p.vy || 0;
    cState.prevOnGround = !!p.onGround;
    cState.prevBottom = pBottom;
    cState.prevPlatform = p.currentPlatform;
    cState.prevIsDead = !isAlive || !!p.isDead;
  }

  // =========================================================================
  // 3. MONITORING SYNCHRONIZACJI KLOCKÓW (BLOCK_STATE_DESYNC)
  // =========================================================================
  if (watchdogState.frameCount > watchdogState.warmupFrames) {
    // A. Arena 5 (Prefabrykator)
    if (isArena5 && arena5State && arena5State.gridRows) {
      for (const rowData of arena5State.gridRows.values()) {
        if (!rowData) continue;
        for (let c = 0; c < 10; c++) {
          const cell = rowData[c];
          if (!cell || cell.hp <= 0) continue;

          // Klocek osiadły (powinien idealnie pasować do siatki getGridX/Y)
          if (!cell.isFalling && !cell.isSliding) {
            const expectedX = getGridX(cell.col);
            const expectedY = getGridY(cell.row);
            const diffX = Math.abs(cell.x - expectedX);
            const diffY = Math.abs(cell.y - expectedY);

            if (diffX > 2.0 || diffY > 2.0) {
              const key = `DESYNC_A5_GRID::r${cell.row}_c${cell.col}`;
              const title = `Rozsynchronizowanie osiadłego klocka z siatką: [r=${cell.row}, c=${cell.col}]`;
              const desc = `Klocek [row=${cell.row}, col=${cell.col}] ma nieprawidłowe współrzędne: x=${cell.x.toFixed(1)} (oczekiwano ${expectedX.toFixed(1)}, diff=${diffX.toFixed(1)}px), y=${cell.y.toFixed(1)} (oczekiwano ${expectedY.toFixed(1)}, diff=${diffY.toFixed(1)}px).`;

              registerAnomaly('BLOCK_STATE_DESYNC', key, title, desc, {
                row: cell.row,
                col: cell.col,
                diffX,
                diffY
              });
            }
          }

          // Klocek opadający (isFalling=true)
          if (cell.isFalling) {
            if ((cell.vy || 0) === 0 && watchdogState.frameCount % 30 === 0) {
              const key = `DESYNC_A5_STUCK::r${cell.row}_c${cell.col}`;
              const title = `Klocek zawisł w powietrzu (vy=0 przy isFalling): [r=${cell.row}, c=${cell.col}]`;
              const desc = `Klocek [row=${cell.row}, col=${cell.col}] posiada flagę isFalling=true, ale jego prędkość vy=0. Pozycja: y=${cell.y.toFixed(1)}, docelowy targetY=${cell.targetY}.`;

              registerAnomaly('BLOCK_STATE_DESYNC', key, title, desc, {
                row: cell.row,
                col: cell.col,
                y: cell.y,
                targetY: cell.targetY
              });
            }

            if (typeof cell.targetY === 'number' && cell.y > cell.targetY + 5.0) {
              const key = `DESYNC_A5_OVERSHOOT::r${cell.row}_c${cell.col}`;
              const title = `Klocek spadł poniżej poziomu docelowego targetY: [r=${cell.row}, c=${cell.col}]`;
              const desc = `Klocek [row=${cell.row}, col=${cell.col}] przeleciał swój targetY: y=${cell.y.toFixed(1)} > targetY+5 (${(cell.targetY + 5).toFixed(1)}).`;

              registerAnomaly('BLOCK_STATE_DESYNC', key, title, desc, {
                row: cell.row,
                col: cell.col,
                y: cell.y,
                targetY: cell.targetY
              });
            }
          }
        }
      }
    }

    // B. Arena 3 (Tajemnicza Dżungla)
    if (isArena3) {
      const bridgeBlocks = (typeof window !== 'undefined' && Array.isArray(window.ARENA_3_BRIDGE_BLOCKS))
        ? window.ARENA_3_BRIDGE_BLOCKS
        : ARENA_3_BRIDGE_BLOCKS;

      if (Array.isArray(bridgeBlocks)) {
        for (let bIdx = 0; bIdx < bridgeBlocks.length; bIdx++) {
          const b = bridgeBlocks[bIdx];
          if (!b) continue;

          // Zniszczona belka pływająca w wodzie nadal mająca aktywny solid
          if (!b.intact && (b.y >= 1290) && (b.solid === true || b.isPlatform === true)) {
            const key = `DESYNC_A3_WATER_SOLID::bridge_${bIdx}`;
            const title = `Zniszczona belka w wodzie zachowuje kolizję solid: #${bIdx}`;
            const desc = `Zniszczona belka mostu #${bIdx} unosi się w rzece na y=${b.y.toFixed(1)} >= 1290, ale nadal posiada flagę solid=true lub isPlatform=true, blokując postacie i pociski.`;

            registerAnomaly('BLOCK_STATE_DESYNC', key, title, desc, {
              blockIndex: bIdx,
              y: b.y,
              solid: b.solid
            });
          }
        }
      }

      const rampBlocks = (typeof window !== 'undefined' && Array.isArray(window.ARENA_3_RAMP_BLOCKS))
        ? window.ARENA_3_RAMP_BLOCKS
        : ARENA_3_RAMP_BLOCKS;

      if (Array.isArray(rampBlocks)) {
        for (let rIdx = 0; rIdx < rampBlocks.length; rIdx++) {
          const r = rampBlocks[rIdx];
          if (!r) continue;

          if (!r.intact && (r.y >= 1290) && (r.solid === true || r.isPlatform === true)) {
            const key = `DESYNC_A3_RAMP_SOLID::ramp_${rIdx}`;
            const title = `Zniszczony segment rampy w wodzie ma aktywny solid: #${rIdx}`;
            const desc = `Zniszczony segment rampy #${rIdx} znajduje się w wodzie (y=${r.y.toFixed(1)}), ale nadal posiada solid=true.`;

            registerAnomaly('BLOCK_STATE_DESYNC', key, title, desc, {
              rampIndex: rIdx,
              y: r.y
            });
          }
        }
      }
    }
  }
}

/**
 * Oblicza statystyki wydajności i stabilności klatek.
 */
export function getWatchdogStats() {
  const count = watchdogState.frameTimes.length;
  if (count === 0) {
    return {
      frameCount: watchdogState.frameCount,
      analyzedFrames: 0,
      durationSeconds: 0,
      avgFps: 60,
      avgFrameTimeMs: 16.67,
      onePercentLowFps: 60,
      p99FrameTimeMs: 16.67,
      maxFrameTimeMs: 0,
      maxDtMs: 0,
      avgDrawCalls: 0,
      maxDrawCalls: 0,
      drawCallsBreakdown: {
        fill: 0,
        stroke: 0,
        drawImage: 0,
        arc: 0,
        quadraticCurveTo: 0,
        clip: 0
      }
    };
  }

  let sumDt = 0;
  for (let i = 0; i < count; i++) {
    sumDt += watchdogState.frameTimes[i];
  }
  const avgFrameTimeMs = sumDt / count;
  const avgFps = avgFrameTimeMs > 0 ? (1000 / avgFrameTimeMs) : 60;

  // 1% Low FPS: sortujemy kopię czasów klatek i bierzemy 99-ty percentyl najdłuższych czasów
  const sortedTimes = [...watchdogState.frameTimes].sort((a, b) => a - b);
  const p99Index = Math.min(count - 1, Math.floor(count * 0.99));
  const p99FrameTimeMs = sortedTimes[p99Index] || 16.67;
  const onePercentLowFps = p99FrameTimeMs > 0 ? (1000 / p99FrameTimeMs) : 60;

  const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
  const durationSeconds = (watchdogState.simulationStartTime > 0)
    ? ((now - watchdogState.simulationStartTime) / 1000)
    : (count / 60);

  // Statystyki operacji rysujących Canvas 2D (GPU Draw Calls)
  const drawSampleCount = canvasProfiler.samples.length;
  let avgDrawCalls = 0;
  let maxDrawCalls = canvasProfiler.maxTotal;
  let avgFill = 0;
  let avgStroke = 0;
  let avgDrawImage = 0;
  let avgArc = 0;
  let avgQuad = 0;
  let avgClip = 0;

  if (drawSampleCount > 0) {
    const sumTotal = canvasProfiler.samples.reduce((a, b) => a + b, 0);
    avgDrawCalls = Math.round(sumTotal / drawSampleCount);

    let sumFill = 0, sumStroke = 0, sumDrawImage = 0, sumArc = 0, sumQuad = 0, sumClip = 0;
    for (let i = 0; i < canvasProfiler.breakdowns.length; i++) {
      const b = canvasProfiler.breakdowns[i];
      sumFill += b.fill;
      sumStroke += b.stroke;
      sumDrawImage += b.drawImage;
      sumArc += b.arc;
      sumQuad += b.quadraticCurveTo;
      sumClip += b.clip;
    }
    avgFill = Math.round(sumFill / drawSampleCount);
    avgStroke = Math.round(sumStroke / drawSampleCount);
    avgDrawImage = Math.round(sumDrawImage / drawSampleCount);
    avgArc = Math.round(sumArc / drawSampleCount);
    avgQuad = Math.round(sumQuad / drawSampleCount);
    avgClip = Math.round(sumClip / drawSampleCount);
  }

  return {
    frameCount: watchdogState.frameCount,
    analyzedFrames: count,
    durationSeconds: Number(durationSeconds.toFixed(1)),
    avgFps: Number(avgFps.toFixed(1)),
    avgFrameTimeMs: Number(avgFrameTimeMs.toFixed(2)),
    onePercentLowFps: Number(onePercentLowFps.toFixed(1)),
    p99FrameTimeMs: Number(p99FrameTimeMs.toFixed(2)),
    maxFrameTimeMs: Number(watchdogState.maxFrameTimeMs.toFixed(2)),
    maxDtMs: Number(watchdogState.maxDtMs.toFixed(2)),
    avgDrawCalls,
    maxDrawCalls,
    drawCallsBreakdown: {
      fill: avgFill,
      stroke: avgStroke,
      drawImage: avgDrawImage,
      arc: avgArc,
      quadraticCurveTo: avgQuad,
      clip: avgClip
    }
  };
}

/**
 * Zwraca raport w formacie JSON z pełnymi metrykami i listą anomalii.
 */
export function getWatchdogReportJSON() {
  const stats = getWatchdogStats();
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    stats,
    summary: watchdogState.summary,
    anomaliesCount: watchdogState.anomalies.length,
    anomalies: watchdogState.anomalies
  }, null, 2);
}

/**
 * Generuje kompletny, sformatowany raport w formacie Markdown z podsumowaniem testu.
 */
export function getWatchdogSummaryMarkdown() {
  const stats = getWatchdogStats();
  const totalAnomalies = watchdogState.anomalies.length;
  const isClean = (totalAnomalies === 0);

  const lines = [
    `# Raport Diagnostyczny Fizyki i Wydajności (Keep-it-high Watchdog)`,
    ``,
    `> Data testu: ${new Date().toLocaleString('pl-PL')}`,
    `> Tryb diagnostyczny: **${watchdogState.strictMode ? 'ŚCISŁY (strict=1)' : 'STANDARDOWY'}**`,
    `> Status końcowy: **${isClean ? 'CZYSTO - BRAK ANOMALII' : `WYKRYTO ANOMALIE (${totalAnomalies})`}**`,
    ``,
    `## 1. Statystyki Wydajności i Płynności (FPS)`,
    `- **Czas trwania testu:** ${stats.durationSeconds} s (${stats.frameCount} przetworzonych klatek, ${stats.analyzedFrames} analizowanych)`,
    `- **Średni FPS:** **${stats.avgFps} FPS** (średni czas klatki: ${stats.avgFrameTimeMs} ms)`,
    `- **1% Low FPS:** **${stats.onePercentLowFps} FPS** (99. percentyl czasu klatki: ${stats.p99FrameTimeMs} ms)`,
    `- **Maksymalny czas wykonania klatki (exec):** ${stats.maxFrameTimeMs} ms`,
    `- **Maksymalny odstęp między klatkami (dt):** ${stats.maxDtMs} ms`,
    `- **Liczba przycięć (FRAME_STUTTER > 28 ms):** ${watchdogState.summary.frameStutters}`,
    `- **Średnie Draw Calls / klatkę (GPU):** **${stats.avgDrawCalls}** (fill: ${stats.drawCallsBreakdown.fill}, stroke: ${stats.drawCallsBreakdown.stroke}, drawImage: ${stats.drawCallsBreakdown.drawImage}, arc: ${stats.drawCallsBreakdown.arc}, quadraticCurveTo: ${stats.drawCallsBreakdown.quadraticCurveTo}, clip: ${stats.drawCallsBreakdown.clip})`,
    `- **Maksymalne Draw Calls / klatkę (GPU):** **${stats.maxDrawCalls}**`,
    ``,
    `## 2. Podsumowanie Wykrytych Zdarzeń Fizyki`,
    `| Kategoria Anomalii | Liczba Zdarzeń | Status |`,
    `| :--- | :---: | :---: |`,
    `| **TELEPORT_ANOMALY** (Gwałtowne przesunięcia postaci) | ${watchdogState.summary.teleportAnomalies} | ${watchdogState.summary.teleportAnomalies === 0 ? 'OK' : 'UWAGA'} |`,
    `| **BLOCK_PENETRATION** (Wnikanie w lite klocki > ${watchdogState.strictMode ? '4' : '6'}px) | ${watchdogState.summary.blockPenetrations} | ${watchdogState.summary.blockPenetrations === 0 ? 'OK' : 'UWAGA'} |`,
    `| **FALLING_BLOCK_GLITCH** (Brak squash kill / pop through) | ${watchdogState.summary.fallingBlockGlitches} | ${watchdogState.summary.fallingBlockGlitches === 0 ? 'OK' : 'UWAGA'} |`,
    `| **SURFACE_JITTER** (Migotanie onGround na platformach) | ${watchdogState.summary.surfaceJitters} | ${watchdogState.summary.surfaceJitters === 0 ? 'OK' : 'UWAGA'} |`,
    `| **BLOCK_STATE_DESYNC** (Desynchronizacja siatki / wody) | ${watchdogState.summary.blockStateDesyncs} | ${watchdogState.summary.blockStateDesyncs === 0 ? 'OK' : 'UWAGA'} |`,
    `| **FRAME_STUTTER** (Spadki poniżej 35 FPS) | ${watchdogState.summary.frameStutters} | ${watchdogState.summary.frameStutters === 0 ? 'OK' : 'UWAGA'} |`,
    `| **HIGH_DRAW_CALLS** (Przeciążenie GPU > 850 wywołań) | ${watchdogState.summary.highDrawCalls} | ${watchdogState.summary.highDrawCalls === 0 ? 'OK' : 'UWAGA'} |`,
    ``
  ];

  if (isClean) {
    lines.push(`## 3. Szczegółowa Lista Zdarzeń`);
    lines.push(`> STATUS: CZYSTO. Wszystkie postacie i klocki poruszały się zgodnie z prawami fizyki silnika.`);
    lines.push(`> Nie wykryto żadnych anomalii kolizyjnych, zacięć bloków ani krytycznych przycięć wydajności.`);
  } else {
    lines.push(`## 3. Szczegółowa Lista Wykrytych Zdarzeń`);
    lines.push(``);

    watchdogState.anomalies.forEach((a, idx) => {
      const durationFrames = a.lastFrame - a.firstFrame + 1;
      const countLabel = a.count > 1 ? ` (wystąpiło ${a.count} razy, klatki ${a.firstFrame}-${a.lastFrame}, trwanie: ${durationFrames} klatek)` : ` (klatka ${a.firstFrame})`;
      lines.push(`### ${idx + 1}. [${a.type}] ${a.title}${countLabel}`);
      lines.push(`- **Opis techniczny:** ${a.details}`);
      lines.push(``);
    });
  }

  return lines.join('\n');
}

/**
 * Resetuje stan diagnostyczny watchdoga.
 */
export function resetWatchdog() {
  watchdogState.frameCount = 0;
  watchdogState.simulationStartTime = 0;
  watchdogState.frameTimes.length = 0;
  watchdogState.frameExecTimes.length = 0;
  watchdogState.maxFrameTimeMs = 0;
  watchdogState.maxDtMs = 0;
  watchdogState.anomalies.length = 0;
  watchdogState.dedupMap.clear();
  watchdogState.summary = {
    teleportAnomalies: 0,
    blockPenetrations: 0,
    fallingBlockGlitches: 0,
    surfaceJitters: 0,
    blockStateDesyncs: 0,
    frameStutters: 0,
    highDrawCalls: 0
  };
  canvasProfiler.samples.length = 0;
  canvasProfiler.breakdowns.length = 0;
  canvasProfiler.maxTotal = 0;
  canvasProfiler.current.fill = 0;
  canvasProfiler.current.stroke = 0;
  canvasProfiler.current.drawImage = 0;
  canvasProfiler.current.arc = 0;
  canvasProfiler.current.quadraticCurveTo = 0;
  canvasProfiler.current.clip = 0;
  canvasProfiler.current.totalDrawCalls = 0;
}

/**
 * Automatyczna inicjalizacja trybu testowego AI z parametru URL (?aiTest=1).
 * Gdy aiTest=1:
 * - Instaluje lekki profiler operacji Canvas 2D (GPU Draw Calls).
 * - Ustawia liczbę botów na 5 (razem z graczem = 6 walczących postaci).
 * - Włącza sterowanie lokalnego gracza przez autonomiczny algorytm bota.
 */
export function checkAndInitAutoPlaytest() {
  if (typeof window === 'undefined' || !window.location) return;

  const params = new URLSearchParams(window.location.search);
  const isAiTest = params.get('aiTest') === '1' || params.has('aiTest');
  const isStrict = params.get('strict') === '1' || params.has('strict');

  if (isStrict) {
    watchdogState.strictMode = true;
  }

  if (isAiTest) {
    watchdogState.autoPlaytestEnabled = true;
    installCanvasProfiler();
    canvasProfiler.active = true;

    // Ustawienie 5 botów (aby łącznie z graczem było 6 postaci)
    const botsParam = parseInt(params.get('bots'), 10);
    const targetBots = Number.isInteger(botsParam) && botsParam >= 1 ? botsParam : 5;
    if (typeof setBotCount === 'function') {
      setBotCount(targetBots);
    }

    // Skonfigurowanie lokalnego gracza do autonomicznego sterowania przez AI bota
    if (player) {
      player.isAiTestControlled = true;
      player.botKeys = {
        left: false,
        right: false,
        up: false,
        down: false,
        shoot: false,
        jump: false,
        slide: false,
        jetpack: false
      };
      player.difficulty = 'hard';
    }
  }
}

// Inicjalizacja globalnego API diagnostycznego na window
if (typeof window !== 'undefined') {
  window.physicsWatchdog = {
    getSummaryMarkdown: () => getWatchdogSummaryMarkdown(),
    getReportJSON: () => getWatchdogReportJSON(),
    getStats: () => getWatchdogStats(),
    getAnomalies: () => watchdogState.anomalies,
    clear: () => resetWatchdog(),
    enable: () => { watchdogState.enabled = true; },
    disable: () => { watchdogState.enabled = false; },
    canvasProfiler,
    state: watchdogState
  };

  checkAndInitAutoPlaytest();
}
