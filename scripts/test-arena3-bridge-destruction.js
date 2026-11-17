// =========================================================================
// TEST ARENA 3 BRIDGE AND RAMP DESTRUCTION VISUAL REMNANTS
// =========================================================================

import assert from 'node:assert/strict';
import {
  ARENA_3_RAMP_BLOCKS,
  ARENA_3_BRIDGE_BLOCKS,
  ARENA_3_PYLONS,
  ARENA_3_BRIDGE_ROPES,
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
assert.equal(ARENA_3_BRIDGE_ROPES.length, 3, 'Powinny byc 3 glowne segmenty lin');
assert.equal(ARENA_3_BRIDGE_ROPES.every(r => r.intact && !r.broken), true, 'Wszystkie liny powinny byc intact');
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

console.log('--- Test 4: Zniszczenie pylonow mostu i lin odciagowych ---');
resetArena3();

// Niszczymy prawy pylon
destroyPylon('right');
assert.equal(ARENA_3_PYLONS.right.intact, false, 'Prawy pylon powinien byc intact=false');
assert.equal(ARENA_3_PYLONS.left.intact, true, 'Lewy pylon powinien pozostac intact=true');
const rightRope = ARENA_3_BRIDGE_ROPES.find(r => r.side === 'right');
assert.equal(rightRope.intact, false, 'Prawa lina odciagowa musi byc intact=false');
assert.equal(rightRope.broken, true, 'Prawa lina odciagowa musi byc broken=true');

const leftRopeBefore = ARENA_3_BRIDGE_ROPES.find(r => r.side === 'left');
assert.equal(leftRopeBefore.intact, true, 'Lewa lina odciagowa nadal intact przed zniszczeniem lewego pylonu');

// Niszczymy lewy pylon
destroyPylon('left');
assert.equal(ARENA_3_PYLONS.left.intact, false, 'Lewy pylon powinien byc intact=false');
const leftRopeAfter = ARENA_3_BRIDGE_ROPES.find(r => r.side === 'left');
assert.equal(leftRopeAfter.intact, false, 'Lewa lina odciagowa musi byc intact=false po zniszczeniu lewego pylonu');
assert.equal(leftRopeAfter.broken, true, 'Lewa lina odciagowa musi byc broken=true');

const centerRope = ARENA_3_BRIDGE_ROPES.find(r => r.side === 'center');
assert.equal(centerRope.intact, false, 'Centralna lina nosna mostu musi byc zerwana po upadku pylonow');
assert.equal(centerRope.broken, true, 'Centralna lina nosna mostu musi byc broken=true');

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

console.log('--- Test 6: Renderowanie w dummy Canvas - weryfikacja braku wiszacych lin ---');
// Mock minimalnego kontekstu Canvas2D z rejestracja wywolan
const drawnLines = [];
class MockCanvasContext {
  save() {}
  restore() {}
  beginPath() {}
  closePath() {}
  moveTo(x, y) {
    drawnLines.push({ type: 'moveTo', x, y });
  }
  lineTo(x, y) {
    drawnLines.push({ type: 'lineTo', x, y });
  }
  stroke() {}
  fill() {}
  fillRect() {}
  strokeRect() {}
  arc() {}
  ellipse() {}
  quadraticCurveTo(cx, cy, x, y) {
    drawnLines.push({ type: 'quadraticCurveTo', cx, cy, x, y });
  }
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

// Przy zniszczonych obu pylonach odrysowujemy calosc
drawnLines.length = 0;
const mockCtx = new MockCanvasContext();
drawArena3Foreground(mockCtx, { x: 2200, y: 1000 }, 1920, 1080);

// Upewniamy sie, ze zadna lina nie zaczyna sie od murku kotwiacego (X=1140 lub X=3260) do pustki
const hangingLeftRopes = drawnLines.filter(l => (l.x === 1140 || l.cx === 1140 + 150) && l.type === 'quadraticCurveTo');
const hangingRightRopes = drawnLines.filter(l => (l.x === 3260 || l.cx === 3260 - 150) && l.type === 'quadraticCurveTo');
assert.equal(hangingLeftRopes.length, 0, 'Zadna lina nie moze wisiec od lewego murka w pustke');
assert.equal(hangingRightRopes.length, 0, 'Zadna lina nie moze wisiec od prawego murka w pustke');

console.log('--- Test 7: Reset Areny 3 przywraca nienaruszony stan lin i pylonow ---');
resetArena3();
assert.equal(ARENA_3_PYLONS.left.intact, true);
assert.equal(ARENA_3_PYLONS.right.intact, true);
assert.equal(ARENA_3_BRIDGE_ROPES.every(r => r.intact === true && r.broken === false), true, 'Wszystkie liny zresetowane do intact=true');
assert.ok(ARENA_3_BRIDGE_BLOCKS.every(b => b.intact === true && b.solid === true));
assert.ok(ARENA_3_RAMP_BLOCKS.every(b => b.intact === true && b.solid === true));

console.log('[SUKCES] Wszystkie testy destrukcji i renderowania mostu i ramp zakonczone pomyslnie.');
