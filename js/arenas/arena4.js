// =========================================================================
// ARENAS/ARENA4.JS - OBSIDIAN CALDERA // WULKANICZNY KRATER MAGMOWY
// Fasada modułu Areny 4: deleguje do wyspecjalizowanych podmodułów w ./arena4/
// =========================================================================

import arena4, {
  Arena4Caldera,
  Arena4Titan,
  ARENA_TITAN,
  ARENA_CALDERA,
  ARENA_OBSIDIAN_CALDERA,
  spawnMagmaSplash,
  spawnOceanSplash,
  killByHazard,
  ARENA_4_WIDTH,
  ARENA_4_HEIGHT,
  ARENA_4_DEATH_Y,
  ARENA_4_MAIN_DECK_Y,
  CALDERA_SPAWN_POINTS,
  CALDERA_GEYSERS,
  CALDERA_PLATFORMS
} from './arena4/index.js';

export default arena4;
export {
  Arena4Caldera,
  arena4,
  Arena4Titan,
  ARENA_TITAN,
  ARENA_CALDERA,
  ARENA_OBSIDIAN_CALDERA,
  spawnMagmaSplash,
  spawnOceanSplash,
  killByHazard,
  ARENA_4_WIDTH,
  ARENA_4_HEIGHT,
  ARENA_4_DEATH_Y,
  ARENA_4_MAIN_DECK_Y,
  CALDERA_SPAWN_POINTS,
  CALDERA_GEYSERS,
  CALDERA_PLATFORMS
};
