// =========================================================================
// OBSTACLES.JS - FASADA SYSTEMU PRZESZKÓD, PLATFORM, FIZYKI I RENDEROWANIA
// =========================================================================

import { camera, getCanvasLogicalWidth } from './camera.js';
import { getActiveArena } from './arenas/index.js';
import { normalizeObstacleType } from './obstacles/palette.js';
import {
  obstacles,
  customObstacles,
  activeArenaId,
  ARENA_PLATFORMS,
  GROUND_BARRICADES,
  GOALS,
  drawBarrelExplosionParticles
} from './obstacles/state.js';
import {
  drawSandbags,
  drawCrate,
  drawHedgehog,
  drawJungleWoodStructure,
  drawCatwalk,
  drawRockIsland,
  drawSingleObstacleByType,
  drawNeonGoals,
  drawAltarSpotlightAndLevitation
} from './obstacles/renderer.js';

export * from './obstacles/palette.js';
export * from './obstacles/state.js';
export * from './obstacles/playerPhysics.js';
export * from './obstacles/ballPhysics.js';
export * from './obstacles/raycast.js';
export * from './obstacles/renderer.js';
export { killByHazard } from './arenas/arena4_space.js';

export function drawObstacles(ctx, groundY) {
  const curArenaObj = typeof getActiveArena === 'function' ? getActiveArena() : null;
  const isA5 = (curArenaObj?.id === 'arena-5' || activeArenaId === 'ARENA_5' || activeArenaId === 'arena-5' || activeArenaId === 'PREFAB_TOWER');
  if (isA5) {
    // W Arenie 5 (Prefabrykator Orbitalny) nie ma żadnych zewnętrznych platform ani barykad – wyłącznie szyb, fundament i klocki
    return;
  }

  const camW = typeof getCanvasLogicalWidth === 'function' ? getCanvasLogicalWidth() : (ctx.canvas ? ctx.canvas.width : 1920);
  const zoom = (camera && camera.zoom) ? camera.zoom : 1;
  const viewW = camera.viewWidth || (camW / zoom);
  const viewLeft = (camera && typeof camera.x === 'number') ? camera.x - 100 : -100;
  const viewRight = (camera && typeof camera.x === 'number') ? camera.x + viewW + 100 : 5000;

  const isA4 = (curArenaObj?.id === 'arena-4' || activeArenaId === 'ARENA_4' || activeArenaId === 'arena-4' || activeArenaId === 'ARMORED_TRAIN');

  if (!isA4) {
    for (const bar of GROUND_BARRICADES) {
      if (!bar) continue;
      const barW = bar.w || bar.size || 60;
      if (bar.x + barW < viewLeft || bar.x > viewRight) continue;
      const bType = normalizeObstacleType(bar.type);
      if (bType === 'sandbags') drawSandbags(ctx, bar.x, groundY - bar.h, bar.w, bar.h);
      else if (bType === 'ammo_depot') drawCrate(ctx, bar.x, groundY - bar.h, bar.w, bar.h);
      else if (bType === 'hedgehog') drawHedgehog(ctx, bar.x, groundY - bar.size / 2, bar.size);
    }
  }

  for (const plat of ARENA_PLATFORMS) {
    if (!plat || plat.isCrossbar || plat.isWall || plat.isCanyonTerrain || plat.isHanging || plat.id === 'lower_cavern_floor' || plat.type === 'rock_shelf') continue;
    const platW = plat.w || 200;
    if (plat.x + platW < viewLeft || plat.x > viewRight) continue;
    const isA3 = (curArenaObj?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3');
    if (isA3) {
      // W Arenie 3 cała autorska architektura i platformy rysowane są w drawArena3Foreground
      continue;
    }
    if (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X') {
      // W Arenie 2 (Święta Dżungla) cała autorska architektura, świątynia i mosty rysowane są w drawArena2Foreground
      continue;
    }
    if (isA4) {
      // W Arenie 4 (Pędzący Pociąg) cała autorska architektura i wagony pociągu rysowane są w module arena4
      continue;
    }
    if (plat.type === 'catwalk') {
      if (plat.theme === 'wood' || plat.isLadder || plat.isJungleHut || plat.isHutRoof || plat.isTowerDeck || plat.isRavineDeck || plat.isRavineRoof || plat.isSkywalk || plat.isTunnelFloor || plat.isUpperDrift || plat.isDrainageTunnel) {
        drawJungleWoodStructure(ctx, plat, groundY);
      } else {
        drawCatwalk(ctx, plat, groundY);
      }
    } else {
      drawRockIsland(ctx, plat, groundY);
    }
  }

  // Główna pętla renderowania postawionych obiektów (spójna w trybie gry i trybie edycji)
  // UWAGA: Nie filtrujemy obiektów z flagami isPickup ani isInteractable!
  const renderedSet = new Set();
  const allObstacles = [...customObstacles, ...obstacles];
  for (const obs of allObstacles) {
    if (!obs || renderedSet.has(obs)) continue;
    if (obs.team || obs.holeCx !== undefined || obs.id?.startsWith('goal') || obs.type === 'goal') continue;
    renderedSet.add(obs);

    const norm = normalizeObstacleType(obs.type);
    const w = (obs.w && obs.w > 0) ? obs.w : (norm === 'ammo_depot' ? 32 : (norm === 'sandbags' ? 48 : 40));
    if (obs.x + w < viewLeft || obs.x > viewRight) continue;

    const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
    const h = (obs.h && obs.h > 0) ? obs.h : (norm === 'ammo_depot' ? 24 : (norm === 'sandbags' ? 24 : 20));

    drawSingleObstacleByType(ctx, obs.type, obs.x, topY, w, h, groundY, obs.hitTimer || 0);
  }

  drawBarrelExplosionParticles(ctx, viewLeft, viewRight);

  if (activeArenaId !== 'ARENA_3' && activeArenaId !== 'ARENA_FOUNDRY' && activeArenaId !== 'arena-3' && activeArenaId !== 'ARENA_2' && activeArenaId !== 'ARENA_2_PANDORA' && activeArenaId !== 'arena-2' && activeArenaId !== 'ARENA_2_SECTOR_X' && !isA4) {
    drawNeonGoals(ctx, groundY, GOALS);
  }

  if (activeArenaId === 'ARENA_1') {
    drawAltarSpotlightAndLevitation(ctx, groundY);
  }
}
