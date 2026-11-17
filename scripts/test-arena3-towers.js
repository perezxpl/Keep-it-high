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

// Test 11: Crush damage rules on Arena 3
state.resetArena3();

// Create mock player standing on ground at X: 500, Y: 1130 (head at 1130, feet at 1200)
const mockPlayer = {
  id: 'player_test',
  x: 500,
  y: 1130,
  w: 24,
  h: 70,
  hp: 100,
  isDead: false,
  vx: 0,
  vy: 0,
  onGround: true,
  currentPlatform: { solid: true }
};

// Scenario A: Low vertical velocity (b.vy = 4.0 < 5.5) -> 0 damage
const mockBlockA = {
  x: 495,
  y: 1120,
  w: 30,
  h: 20,
  vy: 4.0,
  vx: 0,
  startY: 1000,
  solid: false,
  isPlatform: false,
  intact: false
};
state.activeFallingBlocks.push(mockBlockA);
arena3Module.updateArena3(0.016, [mockPlayer]);
assert.strictEqual(mockPlayer.hp, 100, 'Low speed block (vy < 5.5) must deal 0 damage');

// Scenario B: Insufficient fall distance (fallDist = 20 < 40) -> 0 damage
const mockBlockB = {
  x: 495,
  y: 1120,
  w: 30,
  h: 20,
  vy: 7.0,
  vx: 0,
  startY: 1110, // fallDist = 10 < 40
  solid: false,
  isPlatform: false,
  intact: false
};
state.activeFallingBlocks.push(mockBlockB);
arena3Module.updateArena3(0.016, [mockPlayer]);
assert.strictEqual(mockPlayer.hp, 100, 'Block with short fall distance (< 40) must deal 0 damage');

// Scenario C: Block in water / touching water -> 0 damage
const mockBlockC = {
  x: 495,
  y: 1290,
  w: 30,
  h: 20, // y + h = 1310 >= 1300
  vy: 8.0,
  vx: 0,
  startY: 1000,
  solid: false,
  isPlatform: false,
  intact: false
};
state.activeFallingBlocks.push(mockBlockC);
arena3Module.updateArena3(0.016, [mockPlayer]);
assert.strictEqual(mockPlayer.hp, 100, 'Block in water must deal 0 damage');

// Scenario D: Glancing side contact (overlapX = 6 < 12) -> 0 damage
const mockBlockD = {
  x: 518, // player right is 524, overlapX = 524 - 518 = 6 < 12
  y: 1120,
  w: 30,
  h: 20,
  vy: 7.0,
  vx: 0,
  startY: 1000,
  solid: false,
  isPlatform: false,
  intact: false
};
state.activeFallingBlocks.push(mockBlockD);
arena3Module.updateArena3(0.016, [mockPlayer]);
assert.strictEqual(mockPlayer.hp, 100, 'Side contact (overlapX < 12) must deal 0 damage');

// Scenario E: Character jumping onto block from above (bBottom > pTop + ph * 0.65) -> 0 damage
const mockBlockE = {
  x: 495,
  y: 1165, // bottom at 1185 > pTop + ph * 0.65 = 1130 + 45.5 = 1175.5
  w: 30,
  h: 20,
  vy: 7.0,
  vx: 0,
  startY: 1000,
  solid: false,
  isPlatform: false,
  intact: false
};
state.activeFallingBlocks.push(mockBlockE);
arena3Module.updateArena3(0.016, [mockPlayer]);
assert.strictEqual(mockPlayer.hp, 100, 'Block below chest level must deal 0 damage');

// Scenario F: Real direct moderate fall on head (vy = 7.0, fallDist = 120, overlapX = 24)
// Expected damage: partial 25..55 HP + sideways nudge
const mockBlockF = {
  x: 495,
  y: 1120, // bottom at 1140 (penetrates 10px below pTop 1130, well within top 65%)
  w: 30,
  h: 20,
  vy: 7.0,
  vx: 0,
  startY: 1000,
  solid: false,
  isPlatform: false,
  intact: false
};
state.activeFallingBlocks.push(mockBlockF);
arena3Module.updateArena3(0.016, [mockPlayer]);
const hpAfterHit = mockPlayer.hp;
assert(hpAfterHit <= 75 && hpAfterHit >= 45, `Moderate hit should deal 25-55 HP damage (got hp=${hpAfterHit})`);
assert.notStrictEqual(mockPlayer.vx, 0, 'Player should be nudged sideways');

// Scenario G: Multi-frame re-hit within 400ms cooldown -> 0 additional damage
arena3Module.updateArena3(0.016, [mockPlayer]);
assert.strictEqual(mockPlayer.hp, hpAfterHit, 'Cooldown must block damage in consecutive frames');

// Scenario H: High-speed lethal crush on grounded character (vy > 9.5) -> lethal
mockPlayer.hp = 100;
mockPlayer._lastCrushHitTime = 0; // reset cooldown for test
const mockBlockH = {
  x: 495,
  y: 1120,
  w: 30,
  h: 20,
  vy: 10.5,
  vx: 0,
  startY: 900,
  solid: false,
  isPlatform: false,
  intact: false
};
state.activeFallingBlocks.push(mockBlockH);
arena3Module.updateArena3(0.016, [mockPlayer]);
assert.strictEqual(mockPlayer.isDead, true, 'High-speed fall (> 9.5) on grounded character must be fatal crush');
assert.strictEqual(mockPlayer.hp, 0, 'HP must be reduced to 0 on fatal crush');
assert.strictEqual(mockPlayer.killer.cause, 'CRUSH', 'Killer cause should be CRUSH');

console.log('[TEST] Wszystkie testy wiez strazniczych, polek snajperskich oraz fizyki crush zakonczone sukcesem!');
