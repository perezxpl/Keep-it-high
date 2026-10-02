// =========================================================================
// RENDERER.JS - Procedury renderowania przeszkód na Canvasie
// =========================================================================

export {
  drawObstacles,
  drawSingleObstacleByType,
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
  drawBulletCasings
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
  triggerScreenShake
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

