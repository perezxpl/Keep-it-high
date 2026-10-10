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
} from './obstacles.js?v=v71_raptor_customizer';

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
} from './projectiles.js?v=v71_raptor_customizer';

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
  ladders
} from './world.js?v=v71_raptor_customizer';

export function drawLadderRungs() {}

export {
  throwTacticalGrenade
} from './player/actions.js?v=v71_raptor_customizer';

import { ARENA_PLATFORMS, customObstacles } from './obstacles.js?v=v71_raptor_customizer';
import { getActiveArena, setActiveArena, ARENAS } from './arenas/index.js';
import { drawSky, LOWER_CAVERN_CEILING_PROFILE } from './world.js?v=v71_raptor_customizer';

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
// Flaga aktywowana domyślnie lub przełączana klawiszem F1 / Tylda (~)
// =========================================================================
export let DEBUG_COLLIDERS = false;

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.code === 'F1' || e.key === '`' || e.key === '~') {
      DEBUG_COLLIDERS = !DEBUG_COLLIDERS;
      console.log(`[DEBUG] Collider visualizer: ${DEBUG_COLLIDERS ? 'ENABLED' : 'DISABLED'}`);
    }
  });
}

/**
 * Rysuje obrysy wszystkich fizycznych koliderów na canvasie (debug mode):
 * - Platformy i ściany (AABB): ctx.strokeStyle = '#00FF00'; ctx.strokeRect(...)
 * - Linie pochyłe (slopes/polygons): ctx.strokeStyle = '#FF0055'; ctx.beginPath()... ctx.stroke()
 * - Obrys stropu dolnej komory: ctx.strokeStyle = '#00FFFF'
 * - Hitbox i raycast podłoża gracza: ctx.strokeStyle = '#FFFF00'
 */
export function drawDebugColliders(ctx, groundY, player) {
  if (!ctx || !DEBUG_COLLIDERS) return;
  ctx.save();
  ctx.shadowBlur = 0;

  const activeArena = getActiveArena();
  const plats = (typeof ARENA_PLATFORMS !== 'undefined' && Array.isArray(ARENA_PLATFORMS) && ARENA_PLATFORMS.length > 0)
    ? ARENA_PLATFORMS
    : (activeArena?.platforms || []);


  // 1. Linie pochyłe (slopes/polygons): ctx.strokeStyle = '#FF0055'; ctx.beginPath()... ctx.stroke()
  ctx.strokeStyle = '#FF0055';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 0; i < plats.length; i++) {
    const plat = plats[i];
    if (!plat) continue;
    if (Array.isArray(plat.surfacePoints) && plat.surfacePoints.length >= 2) {
      const pts = plat.surfacePoints;
      ctx.beginPath();
      for (let pIdx = 0; pIdx < pts.length; pIdx++) {
        const pt = pts[pIdx];
        const py = (pt.y !== undefined) ? pt.y : (groundY - (pt.relY || 0));
        if (pIdx === 0) ctx.moveTo(pt.x, py);
        else ctx.lineTo(pt.x, py);
      }
      ctx.stroke();

      // Węzły pochyłości (vertices)
      ctx.fillStyle = '#FF0055';
      for (let pIdx = 0; pIdx < pts.length; pIdx++) {
        const pt = pts[pIdx];
        const py = (pt.y !== undefined) ? pt.y : (groundY - (pt.relY || 0));
        ctx.fillRect(pt.x - 3, py - 3, 6, 6);
      }
    } else if (plat.isSlope) {
      const y0 = plat.startY !== undefined ? plat.startY : (groundY - (plat.startRelY || 0));
      const y1 = plat.endY !== undefined ? plat.endY : (groundY - (plat.endRelY || 0));
      ctx.beginPath();
      ctx.moveTo(plat.x, y0);
      ctx.lineTo(plat.x + plat.w, y1);
      ctx.stroke();
    }
  }

  // 2. Platformy i ściany (AABB): ctx.strokeStyle = '#00FF00'; ctx.strokeRect(...)
  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 2;

  for (let i = 0; i < plats.length; i++) {
    const plat = plats[i];
    if (!plat) continue;
    // Pomiń platformy zdefiniowane jako wielokąty pochyłe (narysowane wyżej jako linie #FF0055)
    if (Array.isArray(plat.surfacePoints) && plat.surfacePoints.length >= 2) continue;
    if (plat.isSlope) continue;

    const topY = (plat.y !== undefined) ? plat.y : (groundY - (plat.relY || 0));
    const h = plat.h || plat.thickness || 20;

    ctx.strokeStyle = '#00FF00';
    ctx.strokeRect(plat.x, topY, plat.w, h);

    // Etykieta kolidera
    ctx.fillStyle = '#00FF00';
    ctx.font = '10px monospace';
    const label = plat.isWall ? `WALL: ${plat.id || 'wall'}` : (plat.name || plat.id || 'plat');
    ctx.fillText(`${label} [${Math.round(plat.x)},${Math.round(topY)}]`, plat.x + 2, topY - 3);
  }

  // Obiekty użytkownika (custom obstacles)
  const custObs = (typeof customObstacles !== 'undefined' && Array.isArray(customObstacles)) ? customObstacles : [];
  for (let i = 0; i < custObs.length; i++) {
    const obs = custObs[i];
    const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
    ctx.strokeStyle = '#00FF00';
    ctx.strokeRect(obs.x, topY, obs.w, obs.h || 20);
  }

  // 3. Strop dolnej komory bojowej (twardy sufit blokujący jetpack w głąb skały)
  if (activeArena?.id !== 'arena-3' && typeof LOWER_CAVERN_CEILING_PROFILE !== 'undefined' && Array.isArray(LOWER_CAVERN_CEILING_PROFILE)) {
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    for (let i = 0; i < LOWER_CAVERN_CEILING_PROFILE.length; i++) {
      const pt = LOWER_CAVERN_CEILING_PROFILE[i];
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#00FFFF';
    ctx.font = '10px monospace';
    ctx.fillText('[CEILING CLAMP: STROP]', 1550, 770);
  }

  // 4. Hitbox gracza i promień sprawdzania ziemi (groundCheck raycast) w #FFFF00
  if (player && !player.isDead) {
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(player.x, player.y, player.w || 24, player.h || 70);

    const centerX = player.x + (player.w || 24) * 0.5;
    const feetY = player.y + (player.h || 70);
    const targetGroundY = (player.currentGroundY !== null && player.currentGroundY !== undefined) ? player.currentGroundY : (feetY + 40);

    ctx.beginPath();
    ctx.moveTo(centerX, feetY);
    ctx.lineTo(centerX, targetGroundY);
    ctx.stroke();
    ctx.fillRect(centerX - 3, targetGroundY - 2, 6, 4);

    ctx.fillStyle = '#FFFF00';
    ctx.font = 'bold 9px monospace';
    const platName = player.currentPlatform ? (player.currentPlatform.name || player.currentPlatform.id || 'plat') : 'air';
    ctx.fillText(`onGround: ${player.onGround} | floor: ${Math.round(targetGroundY)} | plat: ${platName}`, player.x - 40, player.y - 12);
  }

  ctx.restore();
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




