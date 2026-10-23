// =========================================================================
// ARENAS/ARENA4/INDEX.JS - GŁÓWNY PUNKT WEJŚCIA ARENY 4 (PĘDZĄCY POCIĄG PANCERNY)
// Autonomiczny moduł areny (Plugin / Lifecycle Hooks Pattern)
// =========================================================================

import { ARENA_4_CONFIG, ARENA_4_SPAWNS, SPAWN_POINTS, wagon1, wagon2, wagon3, wagon4, wagon5, resetArena4State } from './state.js';
import { ARENA_4_PLATFORMS, createTrainPlatforms } from './platforms.js';
import { updateArena4Hazards, killByHazard, isEntityInTrainGap } from './hazards.js';
import { drawArena4Background, drawArena4Foreground } from './renderer.js';

export {
  ARENA_4_CONFIG,
  ARENA_4_SPAWNS,
  SPAWN_POINTS,
  wagon1,
  wagon2,
  wagon3,
  wagon4,
  wagon5,
  resetArena4State,
  ARENA_4_PLATFORMS,
  createTrainPlatforms,
  updateArena4Hazards,
  killByHazard,
  isEntityInTrainGap,
  drawArena4Background,
  drawArena4Foreground
};

export const arena4 = {
  id: ARENA_4_CONFIG.id,
  alias: ARENA_4_CONFIG.codeName,
  mapId: 'armored_train_01',
  name: ARENA_4_CONFIG.name,
  width: ARENA_4_CONFIG.mapWidth,
  height: ARENA_4_CONFIG.mapHeight,
  physics: {
    gravity: 9.8,
    trainSpeedKmh: ARENA_4_CONFIG.trainSpeedKmh
  },
  spawns: ARENA_4_SPAWNS,
  platforms: ARENA_4_PLATFORMS,
  customObjects: [],
  reset() {
    resetArena4State();
  },
  drawBackground(ctx, camera) {
    drawArena4Background(ctx, camera);
  },
  draw(ctx, camera) {
    drawArena4Foreground(ctx, camera);
  },
  update(dt, combatants, ball) {
    updateArena4Hazards(dt, combatants);
  },
  onBulletHit(bullet) {
    return false;
  },
  onKickHit(player, kickBox) {
    return false;
  },
  onExplosion(expX, expY, radius, context) {
    return false;
  }
};

if (typeof window !== 'undefined') {
  window.arena4 = arena4;
}

export default arena4;
