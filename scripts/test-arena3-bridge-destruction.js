// =========================================================================
// TEST ARENA 3 BRIDGE AND RAMP DESTRUCTION VISUAL REMNANTS
// =========================================================================

import assert from 'node:assert/strict';
import {
  ARENA_3_RAMP_BLOCKS,
  ARENA_3_BRIDGE_BLOCKS,
  ARENA_3_PYLONS,
  breakRampBlock,
  breakBridgeBlock,
  destroyPylon,
  resetArena3,
  invalidateRampCanvas,
  setRampCanvasInvalidator,
  getRiverbankGroundY
} from '../js/arenas/arena3/state.js';

import {
  drawArena3Foreground,
  resetArena3RenderCache
} from '../js/arenas/arena3/renderer.js';

console.log('--- Test 1: Inicjalizacja i stan nienaruszony ---');
resetArena3();
resetArena3RenderCache();

assert.equal(ARENA_3_PYLONS.left.intact, true, 'Lewy pylon powinien byc intact');
assert.equal(ARENA_3_PYLONS.right.intact, true, 'Prawy pylon powinien byc intact');
assert.equal(ARENA_3_RAMP_BLOCKS.length, 20, 'Powinno byc 20 segmentow ramp (10 lewych + 10 prawych)');
assert.equal(ARENA_3_BRIDGE_BLOCKS.length, 24, 'Powinno byc 24 klocki mostu');

for (const r of ARENA_3_RAMP_BLOCKS) {
  assert.equal(r.intact, true, 'Segment rampy powinien byc intact');
  assert.equal(r.solid, true, 'Segment rampy powinien byc solid przed zniszczeniem');
  assert.equal(r.isPlatform, true, 'Segment rampy powinien byc platforma przed zniszczeniem');
}

console.log('--- Test 2: Niszczenie segmentu rampy i uniewaznienie cache ---');
let rampInvalidatedSide = null;
setRampCanvasInvalidator((side) => {
  rampInvalidatedSide = side;
});

const ramp0 = ARENA_3_RAMP_BLOCKS[0];
breakRampBlock(ramp0, 2.0, -1.5, 0.05);

assert.equal(ramp0.intact, false, 'Segment rampy powinien byc intact=false');
assert.equal(ramp0.solid, false, 'Zniszczony segment rampy musi miec solid=false (brak kolizji platformy)');
assert.equal(ramp0.isPlatform, false, 'Zniszczony segment rampy musi miec isPlatform=false');
assert.equal(ramp0.oneWay, false, 'Zniszczony segment rampy musi miec oneWay=false');
assert.equal(rampInvalidatedSide, ramp0.side, 'Powinno uniewaznic cache dla odpowiedniej strony rampy');

console.log('--- Test 3: Weryfikacja wysokosci zlamanego kikuta pala pod rampa ---');
for (const r of ARENA_3_RAMP_BLOCKS) {
  const groundY = getRiverbankGroundY(r.stiltX);
  const stumpH = 12 + (r.seed % 10);
  const breakTopY = Math.min(1315, groundY - stumpH);

  // Sprawdzamy czy kikut konczy sie blisko gruntu, a nie wisi na wysokosci pomostu (Y: 1000..1050)
  assert.ok(breakTopY >= 1180, `breakTopY=${breakTopY} musi byc blisko gruntu (>= 1180), a nie w powietrzu`);
  assert.ok(breakTopY <= groundY, `breakTopY=${breakTopY} musi byc rowne lub ponizej linii gruntu ${groundY}`);
}

console.log('--- Test 4: Zniszczenie pylonow mostu ---');
resetArena3();

// Niszczymy prawy pylon
destroyPylon('right');
assert.equal(ARENA_3_PYLONS.right.intact, false, 'Prawy pylon powinien byc intact=false');
assert.equal(ARENA_3_PYLONS.left.intact, true, 'Lewy pylon powinien pozostac intact=true');

// Niszczymy lewy pylon
destroyPylon('left');
assert.equal(ARENA_3_PYLONS.left.intact, false, 'Lewy pylon powinien byc intact=false');

console.log('--- Test 5: Zniszczenie >60% przesel mostu ---');
resetArena3();
assert.equal(ARENA_3_PYLONS.left.intact, true);
assert.equal(ARENA_3_PYLONS.right.intact, true);

// Niszczymy 16 z 24 klockow (66%)
for (let i = 0; i < 16; i++) {
  breakBridgeBlock(ARENA_3_BRIDGE_BLOCKS[i], 0, 0, 0);
  assert.equal(ARENA_3_BRIDGE_BLOCKS[i].intact, false);
}

let intactCount = 0;
for (let i = 0; i < ARENA_3_BRIDGE_BLOCKS.length; i++) {
  if (ARENA_3_BRIDGE_BLOCKS[i].intact) intactCount++;
}
const destroyedRatio = 1 - (intactCount / ARENA_3_BRIDGE_BLOCKS.length);
assert.ok(destroyedRatio >= 0.60, `Zniszczono ${destroyedRatio * 100}% mostu (>= 60%)`);

console.log('--- Test 6: Renderowanie w dummy Canvas bez rzucania wyjatkow ---');
// Mock minimalnego kontekstu Canvas2D
class MockCanvasContext {
  save() {}
  restore() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  stroke() {}
  fill() {}
  fillRect() {}
  strokeRect() {}
  arc() {}
  ellipse() {}
  quadraticCurveTo() {}
  rotate() {}
  drawImage() {}
  translate() {}
  setLineDash() {}
  clip() {}
  measureText() { return { width: 50 }; }
  fillText() {}
  strokeText() {}
  createLinearGradient() {
    return { addColorStop() {} };
  }
  createPattern() {
    return null;
  }
}

const mockCtx = new MockCanvasContext();
// Uruchomienie potoku renderowania dla obu pylonow zniszczonych i klockow w wodzie
drawArena3Foreground(mockCtx, { x: 2200, y: 1000 }, 1920, 1080);

console.log('--- Test 7: Reset Areny 3 przywraca nienaruszony stan ---');
resetArena3();
assert.equal(ARENA_3_PYLONS.left.intact, true);
assert.equal(ARENA_3_PYLONS.right.intact, true);
assert.ok(ARENA_3_BRIDGE_BLOCKS.every(b => b.intact === true && b.solid === true));
assert.ok(ARENA_3_RAMP_BLOCKS.every(b => b.intact === true && b.solid === true));

console.log('[SUKCES] Wszystkie testy destrukcji i renderowania mostu i ramp zakonczone pomyslnie.');
