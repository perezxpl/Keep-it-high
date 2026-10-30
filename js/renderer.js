// =========================================================================
// RENDERER.JS - Procedury renderowania przeszkód na Canvasie
// =========================================================================

export {
  drawObstacles,
  drawSingleObstacleByType,
  drawPlatformScorchEdges,
  drawCrate,
  drawSandbags,
  drawBunkerBlock,
  drawCyberCatwalk,
  drawNeonBarrier,
  drawNeonGoals,
  goalTriggerLeft,
  goalTriggerRight,
  ARENA_1_GOALS,
  drawJumpPad,
  drawCyberPillar,
  drawExplosiveBarrel,
  drawBarbedWire,
  drawSniperTower,
  drawMetalRamp,
  drawTallConcreteWall,
  drawSpeedBoosterPad,
  drawGravityLift,
  drawLaserGate,
  drawFloatingHex,
  drawCyberBumper,
  drawJungleRockPlatform,
  drawSniperTowerStructure,
  drawWoodenStiltsAndOverhangBrackets,
  drawSubterraneanCorridors,
  drawWoodenLogBunker,
  drawJungleCanyonProps,
  drawMineCavernProps,
  drawMineOreCart,
  drawDynamiteCrate,
  drawWoodenLadder,
  getPlatformSurfaceInfo,
  getPlatformSurfaceY,
  OBSTACLE_RENDERERS,
  normalizeObstacleType
} from './obstacles.js';

export {
  drawMineCaveBackground,
  drawPandoraBackground,
  drawArena1Background
} from './background.js';

export {
  drawBulletCasing,
  drawBulletCasings,
  drawDustClouds,
  drawConcreteDebris,
  drawShrapnelStreaks,
  drawRicochetSparks,
  drawPowderSmoke,
  drawAllExplosionParticles,
  drawExplosionSmokeBackground,
  drawExplosionFireAndSparks,
  drawGrenadeJuiceExplosion,
  ExplosionFirePuff,
  StretchedSparks,
  ShockwaveRing,
  HeavySmokePuff,
  spawnExplosionFirePuff,
  spawnStretchedSparks,
  spawnShockwaveRing,
  spawnHeavySmokePuff,
  spawnJuiceExplosion
} from './particles.js';

export {
  camera,
  updateCamera,
  clampCamera,
  getArenaBounds,
  world,
  applyCameraTransform,
  restoreCameraTransform,
  worldToScreen,
  screenToWorld,
  devZoomLevel,
  setDevZoom,
  triggerScreenShake,
  shakeImpulse
} from './camera.js';

export {
  drawProjectiles,
  drawRubbleParticles,
  drawExplosionEffects,
  drawExplosionCraters,
  AeroSuperGrenade,
  activeProjectiles,
  rubbleParticles,
  explosionEffects
} from './projectiles.js';

export {
  drawGround,
  drawSeveredGroundEdge,
  drawArenaEnergyBoundaries,
  drawSky,
  drawFoundrySky,
  drawJungleSky,
  groundSegments,
  carveGroundHole,
  isGroundAt,
  isGroundSupporting,
  findGroundHoleAt,
  resetGroundSegments,
  GROUND_SLAB_HEIGHT,
  GROUND_SEG_WIDTH,
  PILLAR_SPACING,
  JUNGLE_CANYON_PROFILE,
  getCanyonSurfaceInfo,
  getCanyonSurfaceY,
  MINE_CAVE_CEILING_PROFILE,
  getCaveCeilingInfo,
  getCaveCeilingY,
  drawCaveTerrain,
  drawCaveCeilingAndStalactites,
  drawLowerCavern,
  drawLowerCavernBackground,
  drawBedrockAndSideSlopes,
  drawCentralRockBridge,
  drawLowerCavernPropsAndLighting,
  drawLedgeDebris,
  LEFT_MASSIF_AND_RAMP_PROFILE,
  CENTRAL_HILL_PROFILE,
  RIGHT_MASSIF_PROFILE,
  LOWER_CAVERN_FLOOR,
  LOWER_CAVERN_SHELVES,
  LOWER_CAVERN_CEILING_PROFILE,
  getLowerCavernCeilingY,
  LOWER_CAVERN_BOUNDS,
  LOWER_CAVERN_FLOOR_Y,
  LOWER_CAVERN_CEILING_Y,
  drawHazardStripes,
  ladders,
  initCanvas,
  setupCanvas,
  resize,
  resizeCanvas
} from './world.js';

export function drawLadderRungs() {}

export {
  throwTacticalGrenade
} from './player/actions.js';

import { ARENA_PLATFORMS, customObstacles, activeArenaId } from './obstacles.js';
import { camera } from './camera.js';
import { getActiveArena, setActiveArena, ARENAS } from './arenas/index.js';
import { drawSky, LOWER_CAVERN_CEILING_PROFILE } from './world.js';
import { arena5State, CELL_SIZE, getGridX } from './arenas/arena5/state.js';
import { ball } from './ball.js';
import { getActiveBots } from './bot.js';
import { remotePlayer } from './network.js';
import { activeCarePackages } from './killstreaks/carePackage.js';
import { activeSentryGuns } from './killstreaks/sentryGun.js';

export { getActiveArena, setActiveArena, ARENAS };

// Funkcje zaślepkowe dla usuniętych snopów światła i lampionów (60 FPS & kompatybilność)
export function drawSunRays() {}
export function drawGodRays() {}
export function drawVolumetricLight() {}
export function drawLightBeams() {}
export function drawHangingLanterns() {}

/**
 * Renderuje tło aktywnej areny (przed postaciami i obiektami świata)
 * @param {CanvasRenderingContext2D} ctx - Kontekst renderowania
 * @param {Object} camera - Obiekt kamery ze stanem przesunięcia i przybliżenia
 */
export function renderArenaBackground(ctx, camera) {
  if (ctx) {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
  }
  const activeArena = getActiveArena();
  if (activeArena && typeof activeArena.drawBackground === 'function') {
    activeArena.drawBackground(ctx, camera);
  } else {
    drawSky(ctx);
  }
  if (ctx) {
    ctx.restore();
  }
}

/**
 * Renderuje elementy areny na pierwszym planie (po postaciach i obiektach świata w przestrzeni świata)
 * @param {CanvasRenderingContext2D} ctx - Kontekst renderowania
 * @param {Object} camera - Obiekt kamery ze stanem przesunięcia i przybliżenia
 */
export function renderArenaForeground(ctx, camera) {
  if (ctx) {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
  }
  const activeArena = getActiveArena();
  if (activeArena && typeof activeArena.draw === 'function') {
    activeArena.draw(ctx, camera);
  }
  if (ctx) {
    ctx.restore();
  }
}

// =========================================================================
// TRYB DEBUGOWANIA KOLIZJI (COLLIDER DEBUG VISUALIZER)
// Podgląd linii kolizji w formie przerywanej białej linii
// Przełączany przyciskiem w panelu DEV lub klawiszem F1 / Tylda (~)
// =========================================================================
export const collisionDebugState = {
  enabled: false
};
export let DEBUG_COLLIDERS = false;

if (typeof window !== 'undefined' && window.DEBUG_MODE === undefined) {
  window.DEBUG_MODE = false;
}

export function isDebugCollidersEnabled() {
  const isDebugMode = typeof window !== 'undefined' ? !!window.DEBUG_MODE : false;
  return collisionDebugState.enabled || DEBUG_COLLIDERS || (typeof window !== 'undefined' && !!window.DEBUG_COLLIDERS) || isDebugMode;
}

export function setDebugColliders(enabled) {
  const val = !!enabled;
  collisionDebugState.enabled = val;
  DEBUG_COLLIDERS = val;
  if (typeof window !== 'undefined') {
    window.DEBUG_COLLIDERS = val;
    if (typeof window.syncDevCollisionButtonUI === 'function') {
      window.syncDevCollisionButtonUI();
    }
  }
}

export function toggleDebugColliders() {
  setDebugColliders(!isDebugCollidersEnabled());
  return isDebugCollidersEnabled();
}

if (typeof window !== 'undefined') {
  window.toggleDebugColliders = toggleDebugColliders;
  window.setDebugColliders = setDebugColliders;
  window.isDebugCollidersEnabled = isDebugCollidersEnabled;

  window.addEventListener('keydown', (e) => {
    if (e.code === 'F1' || e.key === '`' || e.key === '~') {
      toggleDebugColliders();
    }
  });
}

/**
 * Rysuje obrysy wszystkich fizycznych koliderów na płótnie w przestrzeni świata (debug mode).
 * Zgodnie z wymaganiami technicznymi napisy [PLAT:], [BOT:], [COVER:] oraz przerywane linie (ctx.setLineDash)
 * renderowane są wyłącznie wtedy, gdy aktywny jest tryb debugowania (window.DEBUG_MODE).
 * Optymalizacja: Viewport culling i przycinanie koliderów (strokeClippedBox) zapobiega zawieszaniu
 * przeglądarki przy obiektach o wysokości np. 200000px oraz ogranicza obciążenie Canvas 2D.
 */
export function drawDebugColliders(ctx, groundY, player, extra = {}) {
  if (!ctx || !isDebugCollidersEnabled()) return;

  const isDebugMode = typeof window !== 'undefined' ? !!window.DEBUG_MODE : false;

  ctx.save();
  try {
    ctx.shadowBlur = 0;
    // Przerywana biała linia dla odróżnienia od całej reszty grafiki gry (wyłącznie pod warunkiem window.DEBUG_MODE)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    if (isDebugMode) {
      ctx.setLineDash([5, 5]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';

    // Granice widoku kamery z bezpiecznym marginesem 100px (viewport culling)
    const activeCam = (typeof camera !== 'undefined' && camera) ? camera : (typeof window !== 'undefined' ? window.camera : null);
    const camZoom = (activeCam && typeof activeCam.zoom === 'number' && activeCam.zoom > 0) ? activeCam.zoom : 1;
    const viewW = (activeCam && typeof activeCam.viewWidth === 'number') ? activeCam.viewWidth : (ctx.canvas.width / camZoom);
    const viewH = (activeCam && typeof activeCam.viewHeight === 'number') ? activeCam.viewHeight : (ctx.canvas.height / camZoom);
    const camL = (activeCam && typeof activeCam.x === 'number') ? activeCam.x - 100 : -3000;
    const camR = (activeCam && typeof activeCam.x === 'number') ? activeCam.x + viewW + 100 : 3000;
    const camT = (activeCam && typeof activeCam.y === 'number') ? activeCam.y - 100 : -3000;
    const camB = (activeCam && typeof activeCam.y === 'number') ? activeCam.y + viewH + 100 : 3000;

    const strokeClippedBox = (x, y, w, h, label = null) => {
      const boxL = x;
      const boxR = x + w;
      const boxT = y;
      const boxB = y + h;

      // Całkowicie poza ekranem - odrzucamy bez obciążania rasteryzatora
      if (boxR < camL || boxL > camR || boxB < camT || boxT > camB) {
        return;
      }

      // Przytnij do widoku kamery, by uniknąć setLineDash na ścianach 200000px
      const drawL = Math.max(boxL, camL);
      const drawR = Math.min(boxR, camR);
      const drawT = Math.max(boxT, camT);
      const drawB = Math.min(boxB, camB);
      const drawW = drawR - drawL;
      const drawH = drawB - drawT;

      if (drawW > 0 && drawH > 0) {
        ctx.strokeRect(drawL, drawT, drawW, drawH);
        if (label && isDebugMode) {
          const textX = Math.max(drawL + 2, camL + 4);
          const textY = Math.max(drawT - 3, camT + 12);
          ctx.fillText(label, textX, textY);
        }
      }
    };

    const activeArena = getActiveArena();
    const curArenaId = activeArena?.id || activeArenaId || (typeof window !== 'undefined' ? window.activeArenaId : '');
    const plats = (typeof ARENA_PLATFORMS !== 'undefined' && Array.isArray(ARENA_PLATFORMS) && ARENA_PLATFORMS.length > 0)
      ? ARENA_PLATFORMS
      : (activeArena?.platforms || []);

    // 1. Platformy i ściany o nieregularnych / pochyłych kształtach (surfacePoints lub isSlope)
    for (let i = 0; i < plats.length; i++) {
      const plat = plats[i];
      if (!plat) continue;
      if (Array.isArray(plat.surfacePoints) && plat.surfacePoints.length >= 2) {
        const pts = plat.surfacePoints;
        let pMinX = Infinity, pMaxX = -Infinity;
        for (let pIdx = 0; pIdx < pts.length; pIdx++) {
          if (pts[pIdx].x < pMinX) pMinX = pts[pIdx].x;
          if (pts[pIdx].x > pMaxX) pMaxX = pts[pIdx].x;
        }
        if (pMaxX < camL || pMinX > camR) continue;

        ctx.beginPath();
        for (let pIdx = 0; pIdx < pts.length; pIdx++) {
          const pt = pts[pIdx];
          const py = (pt.y !== undefined) ? pt.y : (groundY - (pt.relY || 0));
          if (pIdx === 0) ctx.moveTo(pt.x, py);
          else ctx.lineTo(pt.x, py);
        }
        ctx.stroke();

        // Węzły pochyłości (vertices)
        for (let pIdx = 0; pIdx < pts.length; pIdx++) {
          const pt = pts[pIdx];
          const py = (pt.y !== undefined) ? pt.y : (groundY - (pt.relY || 0));
          if (pt.x >= camL && pt.x <= camR && py >= camT && py <= camB) {
            ctx.fillRect(pt.x - 2, py - 2, 4, 4);
          }
        }
      } else if (plat.isSlope) {
        if (plat.x + plat.w < camL || plat.x > camR) continue;
        const y0 = plat.startY !== undefined ? plat.startY : (groundY - (plat.startRelY || 0));
        const y1 = plat.endY !== undefined ? plat.endY : (groundY - (plat.endRelY || 0));
        ctx.beginPath();
        ctx.moveTo(plat.x, y0);
        ctx.lineTo(plat.x + plat.w, y1);
        ctx.stroke();
      }
    }

    // 2. Platformy i ściany prostopadłościenne (AABB) z bezpiecznym cullingiem i przycinaniem
    for (let i = 0; i < plats.length; i++) {
      const plat = plats[i];
      if (!plat) continue;
      if (Array.isArray(plat.surfacePoints) && plat.surfacePoints.length >= 2) continue;
      if (plat.isSlope) continue;

      const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
      const h = plat.h || plat.thickness || 20;
      const label = (plat.isCover || plat.isCoverWall)
        ? `[COVER: ${plat.id || 'cover'}]`
        : (plat.isWall
          ? `[ŚCIANA: ${plat.id || 'wall'}]`
          : `[PLAT: ${plat.name || plat.id || 'plat'} ${Math.round(plat.w)}x${Math.round(h)}] [${Math.round(plat.x)},${Math.round(topY)}]`);

      strokeClippedBox(plat.x, topY, plat.w, h, label);

      // Podwyższenia / elementy zdefiniowane na platformie (np. ołtarz, worki z piaskiem)
      if (Array.isArray(plat.props)) {
        for (const pr of plat.props) {
          if (!pr || typeof pr.rx !== 'number') continue;
          const prX = plat.x + pr.rx;
          const prY = topY - (pr.h || 0);
          strokeClippedBox(prX, prY, pr.w || 20, pr.h || 20, `[PROP: ${pr.type}]`);
        }
      }
    }

    // 3. Obiekty użytkownika (custom obstacles)
    const custObs = (typeof customObstacles !== 'undefined' && Array.isArray(customObstacles)) ? customObstacles : [];
    for (let i = 0; i < custObs.length; i++) {
      const obs = custObs[i];
      if (!obs) continue;
      const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
      strokeClippedBox(obs.x, topY, obs.w, obs.h || 20, `[OBS: ${obs.type || 'obstacle'} ${Math.round(obs.w)}x${Math.round(obs.h || 20)}]`);
    }

    // 4. Strop dolnej komory bojowej (wyłącznie Arena 1)
    const isA1 = (curArenaId === 'arena-1' || curArenaId === 'ARENA_1' || !curArenaId);
    if (isA1 && typeof LOWER_CAVERN_CEILING_PROFILE !== 'undefined' && Array.isArray(LOWER_CAVERN_CEILING_PROFILE)) {
      ctx.beginPath();
      for (let i = 0; i < LOWER_CAVERN_CEILING_PROFILE.length; i++) {
        const pt = LOWER_CAVERN_CEILING_PROFILE[i];
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      if (isDebugMode && 1550 >= camL && 1550 <= camR && 770 >= camT && 770 <= camB) {
        ctx.fillText('[STROP DOLNY: CEILING CLAMP]', 1550, 770);
      }
    }

    // 5. Arena 5: Klocki wieży i spadająca figura suwnicy
    const isA5 = (curArenaId === 'arena-5' || curArenaId === 'ARENA_5' || curArenaId === 'PREFAB_TOWER');
    const a5 = (typeof arena5State !== 'undefined' && arena5State) ? arena5State : ((typeof window !== 'undefined' && window.arena5State) ? window.arena5State : null);
    if (isA5 && a5) {
      // Siatka ułożonych klocków wieży
      if (a5.gridRows) {
        for (const [r, rowData] of a5.gridRows.entries()) {
          if (!rowData) continue;
          for (let c = 0; c < 10; c++) {
            const cell = rowData[c];
            if (cell && cell.hp > 0) {
              strokeClippedBox(cell.x, cell.y, cell.w, cell.h, `[KONTENER r:${r} c:${c} HP:${Math.round(cell.hp)}]`);
            }
          }
        }
      }

      // Spadająca figura suwnicy
      const crane = a5.crane;
      if (crane && crane.phase === 'FALLING' && crane.shapeCells) {
        for (const cell of crane.shapeCells) {
          const cellX = getGridX(crane.col + cell.colRel);
          const cellY = crane.currentY + (crane.shape.h - 1 - cell.rowRel) * CELL_SIZE;
          strokeClippedBox(cellX, cellY, CELL_SIZE, CELL_SIZE, '[SPADAJĄCY BLOK]');

          // Cel lądowania w siatce
          const targetCellY = crane.targetLandY + (crane.shape.h - 1 - cell.rowRel) * CELL_SIZE;
          strokeClippedBox(cellX, targetCellY, CELL_SIZE, CELL_SIZE, '[CEL LĄDOWANIA]');
        }
      }

      // Dolny utylizator
      if (typeof a5.recyclerY === 'number' && a5.recyclerY >= camT && a5.recyclerY <= camB) {
        const lineX1 = Math.max(-1000, camL);
        const lineX2 = Math.min(2600, camR);
        if (lineX2 > lineX1) {
          ctx.beginPath();
          ctx.moveTo(lineX1, a5.recyclerY);
          ctx.lineTo(lineX2, a5.recyclerY);
          ctx.stroke();
          if (isDebugMode) {
            ctx.fillText('[DOLNY UTYLIZATOR / HAZARD]', Math.max(lineX1 + 10, camL + 10), a5.recyclerY - 6);
          }
        }
      }
    }

    // 6. Linia bazowa poziomu podłogi (przycięta do widoku kamery)
    if (typeof groundY === 'number' && groundY >= camT && groundY <= camB) {
      const lineX1 = Math.max(-5000, camL);
      const lineX2 = Math.min(5000, camR);
      if (lineX2 > lineX1) {
        ctx.beginPath();
        ctx.moveTo(lineX1, groundY);
        ctx.lineTo(lineX2, groundY);
        ctx.stroke();
        if (isDebugMode) {
          ctx.fillText(`[POZIOM PODŁOGI Y:${Math.round(groundY)}]`, Math.max(lineX1 + 10, camL + 10), groundY - 6);
        }
      }
    }

    // 7. Hitboxy postaci (Gracz, Boty, Zdalny gracz)
    if (player && !player.isDead) {
      const colH = (player.staggerTimer > 0) ? 15 : (player.h || 70);
      const colY = player.y + (player.h || 70) - colH;
      const pW = player.w || 26;
      strokeClippedBox(player.x, colY, pW, colH);

      const centerX = player.x + pW * 0.5;
      const feetY = player.y + (player.h || 70);
      const targetGroundY = (player.currentGroundY !== null && player.currentGroundY !== undefined) ? player.currentGroundY : groundY;

      if (centerX >= camL && centerX <= camR) {
        ctx.beginPath();
        ctx.moveTo(centerX, feetY);
        ctx.lineTo(centerX, targetGroundY);
        ctx.stroke();
        ctx.fillRect(centerX - 3, targetGroundY - 2, 6, 4);
      }

      const platName = player.currentPlatform ? (player.currentPlatform.name || player.currentPlatform.id || 'plat') : 'powietrze';
      if (isDebugMode && player.x + 100 >= camL && player.x - 50 <= camR) {
        ctx.fillText(`[GRACZ onGround:${player.onGround} podłoże:${Math.round(targetGroundY)} plat:${platName}]`, player.x - 30, colY - 6);
      }
    }

    const bots = extra.activeBots || (typeof getActiveBots === 'function' ? getActiveBots() : (typeof window !== 'undefined' && window.getActiveBots ? window.getActiveBots() : []));
    if (Array.isArray(bots)) {
      for (const b of bots) {
        if (!b || b.isDead) continue;
        const bColH = (b.staggerTimer > 0) ? 15 : (b.h || 70);
        const bColY = b.y + (b.h || 70) - bColH;
        strokeClippedBox(b.x, bColY, b.w || 26, bColH, `[BOT: ${b.name || 'AI'} onGround:${b.onGround}]`);
      }
    }

    const rPlayer = extra.remotePlayer || (typeof remotePlayer !== 'undefined' ? remotePlayer : (typeof window !== 'undefined' && window.remotePlayer ? window.remotePlayer : null));
    if (rPlayer && rPlayer.active && !rPlayer.isDead) {
      const rColH = (rPlayer.staggerTimer > 0) ? 15 : (rPlayer.h || 70);
      const rColY = rPlayer.y + (rPlayer.h || 70) - rColH;
      strokeClippedBox(rPlayer.x, rColY, rPlayer.w || 26, rColH, `[ZDALNY: ${rPlayer.name || 'P2P'}]`);
    }

    // 8. Piłka
    const activeBall = extra.ball || (typeof ball !== 'undefined' ? ball : (typeof window !== 'undefined' && window.ball ? window.ball : null));
    if (activeBall && activeBall.active) {
      const bRad = activeBall.radius || 12;
      if (activeBall.x + bRad >= camL && activeBall.x - bRad <= camR && activeBall.y + bRad >= camT && activeBall.y - bRad <= camB) {
        ctx.beginPath();
        ctx.arc(activeBall.x, activeBall.y, bRad, 0, Math.PI * 2);
        ctx.stroke();
        if (isDebugMode) {
          ctx.fillText(`[PIŁKA r:${bRad}]`, activeBall.x - 18, activeBall.y - bRad - 4);
        }
      }
    }

    // 9. Elementy taktyczne (Care Package i Sentry Gun)
    if (typeof activeCarePackages !== 'undefined' && Array.isArray(activeCarePackages)) {
      for (const cp of activeCarePackages) {
        if (!cp || cp.state === 'CAPTURED') continue;
        strokeClippedBox(cp.x - 26, cp.y - 21, 52, 42, '[ZRZUT: CARE PACKAGE]');
      }
    }

    if (typeof activeSentryGuns !== 'undefined' && Array.isArray(activeSentryGuns)) {
      for (const sg of activeSentryGuns) {
        if (!sg || sg.state === 'DESTROYED') continue;
        strokeClippedBox(sg.x - 22, sg.y - 48, 44, 48, `[SENTRY GUN HP:${Math.round(sg.hp)}]`);
      }
    }
  } catch (err) {
    console.error('Błąd podczas renderowania linii kolizji debug:', err);
  } finally {
    ctx.setLineDash([]);
    ctx.restore();
  }
}

// =========================================================================
// ARENA 2: SEKTOR X // INDUSTRIAL FOUNDRY & WASTE FACILITY
// Re-eksport dedykowanej procedury renderowania geometrii z modułu areny
// =========================================================================
export {
  drawArena2Geometry,
  drawArena2Geometry as renderSectorXTerrain,
  renderPandoraTerrain,
  drawArena2Background,
  drawRotatingHazardBeacons,
  drawAcidUpwardUnderglow,
  drawPlatformRimLighting,
  drawToxicVaporMotes,
  drawAcidSurfaceBubbles,
  drawAcidLevel,
  drawAcidLake,
  createAcidSplash,
  spawnAcidSmoke,
  spawnAcidDebris,
  spawnAcidBoilEmitter,
  ARENA_2_EMERGENCY_BEACONS,
  _toxicVaporParticles,
  _surfaceBubbles
} from './arenas/arena2.js';




