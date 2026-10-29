// =========================================================================
// ARENAS/ARENA5/INDEX.JS - GŁÓWNY PUNKT WEJŚCIA ARENY 5 (PREFABRYKATOR ORBITALNY)
// Wzorzec: Plugin / Lifecycle Hooks Pattern
// Standard: Modularyzacja ES, Strict DAG, Zero Emojis
// =========================================================================

import { arena5State, resetArena5State, BASE_FLOOR_Y } from './state.js';
import {
  updateArena5Physics
} from './physics.js';
import {
  handleArena5BulletHit,
  handleArena5Explosion,
  handleArena5MeleeHit,
  handleArena5KickHit,
  handleArena5GrenadeCollision
} from './combat.js';
import { drawArena5Background, drawArena5Foreground } from './renderer.js';
import { camera } from '../../camera.js';

export class Arena5PrefabTower {
  constructor() {
    this.id = 'arena-5';
    this.alias = 'PREFAB_TOWER';
    this.mapId = 'orbital_prefab_tower_05';
    this.name = 'PREFABRYKATOR ORBITALNY';
    this.width = 1600;
    this.height = 50000;
    this.animTime = 0;
  }

  get mainDeckY() {
    return arena5State.currentFloorY || BASE_FLOOR_Y;
  }

  get spawns() {
    return arena5State.spawns;
  }

  get spawnPoints() {
    return arena5State.spawns;
  }

  get platforms() {
    return arena5State.platforms;
  }

  init() {
    resetArena5State();
  }

  update(dt, combatants = [], ball = null) {
    this.animTime += dt || (1 / 60);

    const activeCam = camera || ((typeof window !== 'undefined' && window.camera) ? window.camera : null);
    updateArena5Physics(dt, combatants, activeCam);
  }

  drawBackground(ctx, camera) {
    drawArena5Background(ctx, camera);
  }

  draw(ctx, camera) {
    drawArena5Foreground(ctx, camera);
  }

  render(ctx) {
    const activeCam = camera || ((typeof window !== 'undefined' && window.camera) ? window.camera : null);
    drawArena5Foreground(ctx, activeCam);
  }

  reset() {
    resetArena5State();
  }

  onBulletHit(bullet) {
    return handleArena5BulletHit(bullet);
  }

  onExplosion(expX, expY, radius, context = null) {
    handleArena5Explosion(expX, expY, radius);
    return true;
  }

  onMeleeHit(shooter, p1, p2, width, weaponId, hitTargets) {
    return handleArena5MeleeHit(shooter, p1, p2, width, weaponId, hitTargets);
  }

  onKickHit(player, options) {
    return handleArena5KickHit(player, options);
  }

  onGrenadeCollision(grenade) {
    return handleArena5GrenadeCollision(grenade);
  }
}

export const arena5 = new Arena5PrefabTower();
arena5.init();

export default arena5;

if (typeof window !== 'undefined') {
  window.arena5 = arena5;
}
