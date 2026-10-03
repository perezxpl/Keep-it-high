// =========================================================================
// PHYSICS.JS - MODUŁ FIZYKI I KOLIZJI ARENY
// Re-eksportuje funkcje kolizji, podłoża i geometrii ze światem gry.
// =========================================================================

export {
  checkPlayerPlatformLanding,
  getPlatformSurfaceInfo,
  getPlatformSurfaceY,
  ARENA_PLATFORMS,
  ARENA_FOUNDRY_PLATFORMS,
  ARENA_FOUNDRY_WALLS,
  customObstacles
} from './obstacles.js';

export {
  isGroundAt,
  isGroundSupporting,
  findGroundHoleAt,
  getCanyonSurfaceInfo,
  getCanyonSurfaceY,
  getCaveCeilingInfo,
  getCaveCeilingY,
  getLowerCavernCeilingY,
  platforms,
  slopes,
  walls,
  obstacles,
  resetColliders,
  LEFT_MASSIF_AND_RAMP_PROFILE,
  CENTRAL_HILL_PROFILE,
  RIGHT_MASSIF_PROFILE,
  LOWER_CAVERN_FLOOR,
  LOWER_CAVERN_SHELVES,
  LOWER_CAVERN_CEILING_PROFILE
} from './world.js';
