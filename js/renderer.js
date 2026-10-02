// =========================================================================
// RENDERER.JS - Procedury renderowania przeszkód na Canvasie
// =========================================================================

export {
  drawObstacles,
  drawSingleObstacleByType,
  drawPlatformScorchEdges,
  drawCrate,
  drawSandbags,
  drawCatwalk,
  drawBunkerBlock,
  drawCyberCatwalk,
  drawNeonBarrier,
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
  OBSTACLE_RENDERERS,
  normalizeObstacleType
} from './obstacles.js';

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
  groundSegments,
  carveGroundHole,
  isGroundAt,
  isGroundSupporting,
  findGroundHoleAt,
  resetGroundSegments,
  GROUND_SLAB_HEIGHT,
  GROUND_SEG_WIDTH,
  PILLAR_SPACING
} from './world.js';

export {
  throwTacticalGrenade,
  executeAeroUlt
} from './player/actions.js';


