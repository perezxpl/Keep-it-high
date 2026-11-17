import assert from 'node:assert';

// Mock DOM / Canvas environment
globalThis.window = globalThis;
globalThis.window.addEventListener = () => {};
globalThis.window.removeEventListener = () => {};
globalThis.document = {
  createElement: (tag) => {
    if (tag === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: () => ({
          save: () => {},
          restore: () => {},
          fillRect: () => {},
          strokeRect: () => {},
          beginPath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          stroke: () => {},
          fill: () => {},
          arc: () => {},
          closePath: () => {},
          drawImage: () => {},
          fillText: () => {},
          translate: () => {},
          rotate: () => {},
          setLineDash: () => {}
        })
      };
    }
    return {};
  }
};
globalThis.ARENA_PLATFORMS = [];

const state = await import('../js/arenas/arena3/state.js');
const arena3Module = await import('../js/arenas/arena3.js');
const renderer = await import('../js/arenas/arena3/renderer.js');
const destruction = await import('../js/arenas/arena3/destruction.js');

console.log('[TEST] Start: Arena 3 Watchtowers & Slabs Destruction Tests');

// Test 1: Initial state
state.resetArena3();
assert.strictEqual(state.ARENA_3_TOWER_BLOCKS.length, 10, 'Should have 10 tower blocks in total');
assert.strictEqual(state.ARENA_3_SNIPER_SLABS.length, 8, 'Should have 8 sniper slabs in total');
assert(state.ARENA_3_TOWER_ROOFS.left.intact, 'Left tower roof should be intact');
assert(state.ARENA_3_TOWER_ROOFS.right.intact, 'Right tower roof should be intact');
assert(state.ARENA_3_TOWER_PILLARS.left.intact, 'Left tower pillar should be intact');

// Test 2: breakTowerBlock on lower deck block triggers cascade collapse
const leftLower = state.ARENA_3_TOWER_BLOCKS.find(b => b.side === 'left' && b.tier === 'lower');
assert(leftLower, 'Should find left lower block');
assert(leftLower.intact, 'Should be intact initially');

state.breakTowerBlock(leftLower, -1, 1, 0.1);

// Verify immediate loss of solid/platform
assert.strictEqual(leftLower.intact, false, 'leftLower should be marked not intact');
assert.strictEqual(leftLower.solid, false, 'leftLower.solid must be false immediately');
assert.strictEqual(leftLower.isPlatform, false, 'leftLower.isPlatform must be false immediately');

// Verify cascade to upper blocks
const leftUpperBlocks = state.ARENA_3_TOWER_BLOCKS.filter(b => b.side === 'left' && b.tier === 'upper');
for (const ub of leftUpperBlocks) {
  assert.strictEqual(ub.intact, false, 'Upper block should cascade collapse when lower block breaks');
  assert.strictEqual(ub.solid, false, 'Upper block solid must be false');
  assert.strictEqual(ub.isPlatform, false, 'Upper block isPlatform must be false');
}

// Verify roof collapse
assert.strictEqual(state.ARENA_3_TOWER_ROOFS.left.intact, false, 'Left roof should collapse when lower tier breaks');
assert(state.activeFallingBlocks.includes(state.ARENA_3_TOWER_ROOFS.left), 'Left roof should be in activeFallingBlocks');

// Test 3: Watchtower blocks at X < 300 must NOT be discarded on frame 1
const initialFallingCount = state.activeFallingBlocks.length;
assert(initialFallingCount > 0, 'activeFallingBlocks should contain fallen blocks');

// Run physics update step
arena3Module.updateArena3();

// Verify blocks at X: 100-300 did not get prematurely killed by out-of-bounds
for (const ub of leftUpperBlocks) {
  if (ub.x < 300) {
    assert(ub.y >= ub.origY, 'Block should fall downwards');
  }
}

// Test 4: Land impact decay and removal from platforms
// Simulate blocks falling from Y: 400 to Y: 1200 + land decay (45 frames)
for (let step = 0; step < 180; step++) {
  arena3Module.updateArena3();
}

// After blocks hit land and decay, leftLower and upper blocks should have completed land decay and vanished
for (const ub of leftUpperBlocks) {
  assert.strictEqual(ub.vanished, true, 'Block on land should vanish after decay');
  assert.strictEqual(ub.isDead, true, 'Block on land should be marked isDead');
  assert(!state.ARENA_3_PLATFORMS.includes(ub), 'Block should be removed from ARENA_3_PLATFORMS');
}

// Test 5: breakSniperSlab immediate collision removal and land decay
const slabLeft = state.ARENA_3_SNIPER_SLABS[0];
assert(slabLeft.intact, 'Slab should be intact initially');
state.breakSniperSlab(slabLeft, 0, 1, 0.05);
assert.strictEqual(slabLeft.intact, false, 'Slab should not be intact');
assert.strictEqual(slabLeft.solid, false, 'Slab solid must be false immediately');
assert.strictEqual(slabLeft.isPlatform, false, 'Slab isPlatform must be false immediately');

// Run physics for slab to land (Y: 800 to 1200: ~45 frames) and decay (45 frames)
for (let step = 0; step < 120; step++) {
  arena3Module.updateArena3();
}
assert.strictEqual(slabLeft.vanished, true, 'Slab on land should vanish after decay');

// Test 6: destroyTowerPillar on right side
state.destroyTowerPillar('right');
assert.strictEqual(state.ARENA_3_TOWER_PILLARS.right.intact, false, 'Right pillar should be destroyed');
assert.strictEqual(state.ARENA_3_TOWER_ROOFS.right.intact, false, 'Right roof should be collapsed');

const rightBlocks = state.ARENA_3_TOWER_BLOCKS.filter(b => b.side === 'right');
for (const rb of rightBlocks) {
  assert.strictEqual(rb.intact, false, 'All right tower blocks should be broken');
  assert.strictEqual(rb.solid, false, 'All right tower blocks solid should be false');
}

// Test 7: resetArena3 restores everything
state.resetArena3();
for (const b of state.ARENA_3_TOWER_BLOCKS) {
  assert.strictEqual(b.intact, true, 'Block should be restored intact');
  assert.strictEqual(b.solid, true, 'Block solid should be restored');
  assert.strictEqual(b.isPlatform, true, 'Block isPlatform should be restored');
  assert.strictEqual(b.vanished, false, 'Block vanished should be reset to false');
}
assert(state.ARENA_3_TOWER_ROOFS.left.intact, 'Left roof restored');
assert(state.ARENA_3_TOWER_ROOFS.right.intact, 'Right roof restored');
assert(state.ARENA_3_TOWER_PILLARS.left.intact, 'Left pillar restored');
assert(state.ARENA_3_TOWER_PILLARS.right.intact, 'Right pillar restored');

// Test 8: Bullet hits at X: 200 (left tower) and X: 4200 (right tower) are NOT rejected by fast AABB
state.resetArena3();
const initialPillarHp = state.ARENA_3_TOWER_PILLARS.left.hp;

// Mock bullet aimed at left tower pillar (stemX: 185, between decks at Y: 500)
const testBulletLeft = {
  x: 185,
  y: 500,
  prevX: 180,
  prevY: 500,
  vx: 5,
  vy: 0,
  damage: 50
};
const bulletHit = destruction.onArena3BulletHit(testBulletLeft);
assert.strictEqual(bulletHit, true, 'Bullet at X: 185 should hit the left tower pillar');
assert(state.ARENA_3_TOWER_PILLARS.left.hp < initialPillarHp, 'Pillar HP should be reduced');

// Test 9: OffscreenCanvas invalidation on block damage
const rightUpper = state.ARENA_3_TOWER_BLOCKS.find(b => b.side === 'right' && b.tier === 'upper');
const testBulletRight = {
  x: rightUpper.x + 5,
  y: rightUpper.y + 5,
  prevX: rightUpper.x,
  prevY: rightUpper.y + 5,
  vx: 5,
  vy: 0,
  damage: 40
};
const rightBlockHit = destruction.onArena3BulletHit(testBulletRight);
assert.strictEqual(rightBlockHit, true, 'Bullet at X: 4100+ should hit the right upper tower block');
assert(rightUpper.hp < rightUpper.maxHp, 'Right upper block should take damage');

// Test 10: Explosion damage cascade
state.resetArena3();
// Explosion near left lower deck (X: 180, Y: 600)
destruction.onArena3Explosion(180, 600, 150);
const leftUpperAfterExplosion = state.ARENA_3_TOWER_BLOCKS.filter(b => b.side === 'left' && b.tier === 'upper');
for (const ub of leftUpperAfterExplosion) {
  assert.strictEqual(ub.intact, false, 'Explosion at tower base should cause entire upper deck to collapse');
  assert.strictEqual(ub.solid, false, 'Upper block solid must be false');
}
assert.strictEqual(state.ARENA_3_TOWER_ROOFS.left.intact, false, 'Left roof should collapse from explosion');

console.log('[TEST] Wszystkie testy wiez strazniczych i polek snajperskich zakonczone sukcesem!');
