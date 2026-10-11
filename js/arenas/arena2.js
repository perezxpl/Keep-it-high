// =========================================================================
// ARENAS/ARENA2.JS - SEKTOR X // INDUSTRIAL FOUNDRY & WASTE FACILITY
// Fasada wtyczki Areny 2: stan/logika -> ./arena2/state.js | renderowanie -> ./arena2/renderer.js
// =========================================================================

import {
  ARENA_2_CONFIG,
  ARENA_2_PLATFORMS,
  ARENA_2_COVERS,
  ARENA_2_BARRELS,
  ARENA_2_SUPPLY,
  ACID_SURGE_SYSTEM,
  getAcidSurfaceY,
  _acidSplashParticles,
  _acidDebrisList,
  _acidSmokeParticles,
  _acidBoilEmitters,
  createAcidSplash,
  spawnAcidSmoke,
  spawnAcidDebris,
  spawnAcidBoilEmitter,
  isPlayerSubmergedInAcid,
  triggerPlayerAcidDeath,
  updateArena2
} from './arena2/state.js';
import {
  drawArena2Background,
  drawArena2Geometry,
  drawArena2Foreground,
  drawAcidLevel,
  drawAcidLake
} from './arena2/renderer.js';

export * from './arena2/state.js';
export * from './arena2/renderer.js';

// =========================================================================
// 8. KONTRAKT WTYCZKI ARENY 2 (PLUGIN DEFINITION)
// =========================================================================
const arena2 = {
  id: 'arena-2',
  alias: 'ARENA_2_SECTOR_X',
  name: 'Toksyczna Rafineria',
  width: 3600,
  height: 1400,
  spawns: ARENA_2_CONFIG.spawns,
  platforms: ARENA_2_PLATFORMS,
  bridges: [],
  covers: ARENA_2_COVERS,
  barrels: ARENA_2_BARRELS,
  supply: ARENA_2_SUPPLY,
  acidSurge: ACID_SURGE_SYSTEM,
  customObjects: [],
  reset() {
    ACID_SURGE_SYSTEM.state = 'CALM';
    ACID_SURGE_SYSTEM.timer = ACID_SURGE_SYSTEM.durations.calm;
    ACID_SURGE_SYSTEM.currentY = ACID_SURGE_SYSTEM.baseY;
    ARENA_2_CONFIG.hazardZoneY = ACID_SURGE_SYSTEM.baseY;
    ARENA_2_CONFIG.abyssDeathY = ACID_SURGE_SYSTEM.baseY + 90;
    _acidSplashParticles.length = 0;
    _acidDebrisList.length = 0;
    _acidSmokeParticles.length = 0;
    _acidBoilEmitters.length = 0;
  },
  drawBackground(ctx, camera) {
    drawArena2Background(ctx, camera);
  },
  draw(ctx, camera) {
    drawArena2Geometry(ctx, camera);
  },
  update(dt, players) {
    updateArena2(dt, players);
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
  window.ARENA_2_COVERS = ARENA_2_COVERS;
  window.ARENA_2_BARRELS = ARENA_2_BARRELS;
  window.ARENA_2_SUPPLY = ARENA_2_SUPPLY;
  window.ACID_SURGE_SYSTEM = ACID_SURGE_SYSTEM;
  window.drawAcidLevel = drawAcidLevel;
  window.drawAcidLake = drawAcidLake;
  window.createAcidSplash = createAcidSplash;
  window.spawnAcidSmoke = spawnAcidSmoke;
  window.spawnAcidDebris = spawnAcidDebris;
  window.spawnAcidBoilEmitter = spawnAcidBoilEmitter;
  window.triggerPlayerAcidDeath = triggerPlayerAcidDeath;
  window.isPlayerSubmergedInAcid = isPlayerSubmergedInAcid;
  window.getAcidSurfaceY = getAcidSurfaceY;
  window.arena2 = arena2;
}

export default arena2;

