// =========================================================================
// ARENAS/ARENA5/INDEX.JS - GŁÓWNY PUNKT WEJŚCIA ARENY 5 (PREFABRYKATOR ORBITALNY)
// Wzorzec: Plugin / Lifecycle Hooks Pattern
// Standard: Modularyzacja ES, Strict DAG, Zero Emojis
// =========================================================================

import { arena5State, resetArena5State, BASE_FLOOR_Y } from './state.js';
import { updateArena5Physics, handleArena5BulletHit, handleArena5Explosion } from './physics.js';
import { drawArena5Background, drawArena5Foreground } from './renderer.js';

export class Arena5PrefabTower {
  constructor() {
    this.id = 'arena-5';
    this.alias = 'PREFAB_TOWER';
    this.mapId = 'orbital_prefab_tower_05';
    this.name = 'PREFABRYKATOR ORBITALNY';
    this.width = 2400;
    this.height = 50000;
    this.mainDeckY = BASE_FLOOR_Y;
    this.animTime = 0;
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

    // Pobierz aktywną kamerę z modułu kamery
    const cam = (typeof window !== 'undefined' && window.camera) ? window.camera : null;
    updateArena5Physics(dt, combatants, cam);
  }

  drawBackground(ctx, camera) {
    drawArena5Background(ctx, camera);
  }

  draw(ctx, camera) {
    drawArena5Foreground(ctx, camera);
  }

  render(ctx) {
    const cam = (typeof window !== 'undefined' && window.camera) ? window.camera : null;
    drawArena5Foreground(ctx, cam);
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

  onKickHit(player, kickBox) {
    return false;
  }
}

export const arena5 = new Arena5PrefabTower();
arena5.init();

export default arena5;

if (typeof window !== 'undefined') {
  window.arena5 = arena5;
}
