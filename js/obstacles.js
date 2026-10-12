// =========================================================================
// OBSTACLES.JS - FASADA SYSTEMU PRZESZKÓD, PLATFORM, FIZYKI I RENDEROWANIA
// =========================================================================

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

export function drawObstacles(ctx, groundY) {
  for (const bar of GROUND_BARRICADES) {
    if (!bar) continue;
    const bType = normalizeObstacleType(bar.type);
    if (bType === 'sandbags') drawSandbags(ctx, bar.x, groundY - bar.h, bar.w, bar.h);
    else if (bType === 'ammo_depot') drawCrate(ctx, bar.x, groundY - bar.h, bar.w, bar.h);
    else if (bType === 'hedgehog') drawHedgehog(ctx, bar.x, groundY - bar.size / 2, bar.size);
  }

  for (const plat of ARENA_PLATFORMS) {
    if (!plat || plat.isCrossbar || plat.isWall || plat.isCanyonTerrain || plat.isHanging || plat.id === 'lower_cavern_floor' || plat.type === 'rock_shelf') continue;
    const curArenaObj = typeof getActiveArena === 'function' ? getActiveArena() : null;
    const isA3 = (curArenaObj?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3');
    if (isA3) {
      // W Arenie 3 cała autorska architektura i platformy rysowane są w drawArena3Foreground
      continue;
    }
    if (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X') {
      // W Arenie 2 (Święta Dżungla) cała autorska architektura, świątynia i mosty rysowane są w drawArena2Foreground
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

    const topY = obs.y !== undefined ? obs.y : (groundY - obs.relY);
    const norm = normalizeObstacleType(obs.type);
    const w = (obs.w && obs.w > 0) ? obs.w : (norm === 'ammo_depot' ? 32 : (norm === 'sandbags' ? 48 : 40));
    const h = (obs.h && obs.h > 0) ? obs.h : (norm === 'ammo_depot' ? 24 : (norm === 'sandbags' ? 24 : 20));

    drawSingleObstacleByType(ctx, obs.type, obs.x, topY, w, h, groundY, obs.hitTimer || 0);
  }

  drawBarrelExplosionParticles(ctx);

  if (activeArenaId !== 'ARENA_3' && activeArenaId !== 'ARENA_FOUNDRY' && activeArenaId !== 'arena-3' && activeArenaId !== 'ARENA_2' && activeArenaId !== 'ARENA_2_PANDORA' && activeArenaId !== 'arena-2' && activeArenaId !== 'ARENA_2_SECTOR_X') {
    drawNeonGoals(ctx, groundY, GOALS);
  }

  if (activeArenaId === 'ARENA_1') {
    drawAltarSpotlightAndLevitation(ctx, groundY);
  }
}
