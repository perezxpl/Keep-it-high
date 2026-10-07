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
  ARENA_2_PANDORA_PLATFORMS,
  ARENA_2_PANDORA_GOALS,
  LEFT_VINE_BRIDGE_POINTS,
  RIGHT_VINE_BRIDGE_POINTS,
  applyPandoraUpdraft,
  checkPandoraUpdraft
} from './arenas/arena2.js';

export function isPandoraAbyss(y) {
  return y > 1510;
}

export function isPandoraDeath(y) {
  return y >= 1660;
}


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
