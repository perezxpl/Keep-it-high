// =========================================================================
// TEST-WEAPON-SWAP-PROMPT.JS
// Weryfikacja:
// 1. PC (Klawiatura / Fizyczny Pad): kompaktowa pastylka [E] / [X] / [Square]
//    z podpisem "ZAMIEN" pod bronia (brak zaslaniania sylwetki gracza).
// 2. Ekran dotykowy (Mobile): wylaczenie plywajacego przycisku WEAPON nad
//    postacia; rysowanie strzalek zamiany w tle oraz sylwetki nowej broni
//    bezposrednio na kieszeni broni (pockets.firearm) + natychmiastowa i
//    przytrzymana zamiana bez przypadkowego przeladowania.
// =========================================================================

import assert from 'node:assert';

const canvasListeners = {};
const windowListeners = {};

globalThis.window = globalThis;
globalThis.addEventListener = (type, fn) => {
  if (!windowListeners[type]) windowListeners[type] = [];
  windowListeners[type].push(fn);
};
globalThis.removeEventListener = () => {};
globalThis.innerWidth = 1280;
globalThis.innerHeight = 720;
globalThis.devicePixelRatio = 1;

function createMockCtx() {
  const ops = [];
  const ctx = {
    ops,
    font: '10px sans-serif',
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    shadowBlur: 0,
    shadowColor: 'transparent',
    save() { ops.push(['save']); },
    restore() { ops.push(['restore']); },
    translate(x, y) { ops.push(['translate', x, y]); },
    rotate(a) { ops.push(['rotate', a]); },
    scale(x, y) { ops.push(['scale', x, y]); },
    beginPath() { ops.push(['beginPath']); },
    closePath() { ops.push(['closePath']); },
    moveTo(x, y) { ops.push(['moveTo', x, y]); },
    lineTo(x, y) { ops.push(['lineTo', x, y]); },
    quadraticCurveTo(cpx, cpy, x, y) { ops.push(['quad', cpx, cpy, x, y]); },
    bezierCurveTo() { ops.push(['bezier']); },
    rect(x, y, w, h) { ops.push(['rect', x, y, w, h]); },
    roundRect(x, y, w, h, r) { ops.push(['roundRect', x, y, w, h, r]); },
    arc(x, y, r, s, e) { ops.push(['arc', x, y, r, s, e]); },
    ellipse(x, y, rx, ry) { ops.push(['ellipse', x, y, rx, ry]); },
    fill() { ops.push(['fill']); },
    stroke() { ops.push(['stroke']); },
    fillRect(x, y, w, h) { ops.push(['fillRect', x, y, w, h]); },
    strokeRect(x, y, w, h) { ops.push(['strokeRect', x, y, w, h]); },
    fillText(txt, x, y) { ops.push(['fillText', txt, x, y]); },
    strokeText(txt, x, y) { ops.push(['strokeText', txt, x, y]); },
    measureText(txt) { return { width: String(txt || '').length * 6 }; },
    createRadialGradient() { return { addColorStop() {} }; },
    createLinearGradient() { return { addColorStop() {} }; },
    setLineDash() {},
    setTransform() {},
    resetTransform() {},
    clearRect() {},
    clip() {}
  };
  return ctx;
}

const mockCanvas = {
  width: 1280,
  height: 720,
  style: {},
  addEventListener: (type, fn) => {
    if (!canvasListeners[type]) canvasListeners[type] = [];
    canvasListeners[type].push(fn);
  },
  removeEventListener: () => {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
  getContext: () => createMockCtx()
};

globalThis.document = {
  createElement: () => ({ ...mockCanvas, getContext: () => createMockCtx() }),
  getElementById: (id) => (id === 'game' ? mockCanvas : null),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
  activeElement: null
};
globalThis.Image = class {
  constructor() {
    this.naturalWidth = 64;
    this.naturalHeight = 64;
    this.width = 64;
    this.height = 64;
    this.complete = true;
    this.src = '';
  }
};
let fakeNow = 1000;
globalThis.performance = { now: () => fakeNow };
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

const { setTouchDevice } = await import('../js/config.js');
const TEST_GAME_STATE = { current: 'PLAYING', previous: 'MENU' };
globalThis.window.GAME_STATE = TEST_GAME_STATE;
const { initCanvas, initGroundSegments } = await import('../js/world.js');
initCanvas(mockCanvas);
initGroundSegments();
const { player } = await import('../js/player.js');
const { initPlayerLoadout } = await import('../js/loadout/state.js');
const { WEAPONS } = await import('../js/weapons/transform.js');
const { pockets, updateButtonLayout } = await import('../js/mobileControls.js');
globalThis.window.pockets = pockets;
updateButtonLayout(1280, 720);

const {
  gamepadState,
  pollGamepadInput,
  notifyKeyboardMouseActivity,
  isGamepadPrimaryInput,
  getGamepadStyle
} = await import('../js/input/gamepad.js');
const { initAllInputHandlers, updatePlayerInputAndCombat } = await import('../js/input/index.js');
const {
  pickupState,
  pickupPromptState,
  resetPickupState,
  spawnDroppedWeapon,
  updatePickups,
  drawPickupPrompt
} = await import('../js/pickup/index.js');
const { ARENA_PLATFORMS } = await import('../js/obstacles/state.js');
const { drawHUD } = await import('../js/ui/hudCanvas.js');

initAllInputHandlers({
  GAME_STATE: TEST_GAME_STATE,
  setGameState: () => {},
  selectPlayerClass: () => {},
  teleportToDistance: () => {},
  BIOME_TELEPORT_TARGETS: [],
  devSetClass: () => {},
  toggleDevPanel: () => {},
  toggleArena: () => {},
  setJetpackActive: () => {}
});
initPlayerLoadout(player);
player.currentWeapon = WEAPONS.AK47;
player.x = 600;
player.y = 1000 - (player.h || 72);

const cam = { x: 0, y: 400, zoom: 1, viewWidth: 1280, viewHeight: 720 };

// =========================================================================
// TEST 1: TRYB PC (KLAWIATURA) - PODPIS [E] ZAMIEN POD BRONIA
// =========================================================================
setTouchDevice(false);
resetPickupState();
const testSwapPlat = {
  id: 'test_swap_floor',
  x: 500,
  y: 1000,
  w: 300,
  h: 40,
  solid: true,
  isPlatform: true,
  intact: true
};
ARENA_PLATFORMS.push(testSwapPlat);
const dw1 = spawnDroppedWeapon(
  600 + (player.w || 28) * 0.5,
  996,
  0,
  0,
  WEAPONS.SNIPER,
  1,
  { currentAmmo: 5, reserveAmmo: 20 },
  null
);
dw1.isGrounded = true;
dw1.stuckPlatform = testSwapPlat;
dw1.stuckOffsetX = dw1.x - testSwapPlat.x;
dw1.vy = 0;

for (let i = 0; i < 10; i++) {
  updatePickups(0.05, player, [], cam);
}

assert(pickupPromptState.currentInteractable?.type === 'WEAPON', 'Kandydat WEAPON powinien byc wykryty');
assert(pickupPromptState.touchButtonBounds.active === true, 'Na PC bounds podpowiedzi powinny byc aktywne');
assert(
  pickupPromptState.touchButtonBounds.y > (dw1.y - cam.y),
  `Na PC podpowiedz musi byc pod bronia (y > ${dw1.y - cam.y}), a ma ${pickupPromptState.touchButtonBounds.y}`
);

notifyKeyboardMouseActivity();
assert.strictEqual(isGamepadPrimaryInput(), false, 'Po aktywnosci klawiatury priorytetem jest klawiatura');

const ctxPc = createMockCtx();
drawPickupPrompt(ctxPc, cam, false);
const textsPc = ctxPc.ops.filter(o => o[0] === 'fillText').map(o => o[1]);
assert(textsPc.includes('E'), `Oczekiwano klawisza E na PC, otrzymano: ${JSON.stringify(textsPc)}`);
assert(textsPc.includes('ZAMIEŃ'), `Oczekiwano podpisu ZAMIEŃ na PC, otrzymano: ${JSON.stringify(textsPc)}`);

// =========================================================================
// TEST 2: TRYB FIZYCZNEGO PADA (XBOX ORAZ PLAYSTATION)
// =========================================================================
fakeNow = 2000;
gamepadState.connected = true;
gamepadState.index = 0;
gamepadState.id = 'Xbox Wireless Controller (STANDARD GAMEPAD)';
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: {
    getGamepads: () => [{
      connected: true,
      index: 0,
      axes: [0.5, 0, 0, 0],
      buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }))
    }]
  }
});
pollGamepadInput();
assert.strictEqual(isGamepadPrimaryInput(), true, 'Po ruchu galka pada powinien byc aktywny tryb pada');
assert.strictEqual(getGamepadStyle(), 'XBOX');

const ctxXbox = createMockCtx();
drawPickupPrompt(ctxXbox, cam, false);
const textsXbox = ctxXbox.ops.filter(o => o[0] === 'fillText').map(o => o[1]);
assert(textsXbox.includes('X'), `Oczekiwano symbolu X dla Xboxa, otrzymano: ${JSON.stringify(textsXbox)}`);
assert(textsXbox.includes('ZAMIEŃ'), 'Oczekiwano podpisu ZAMIEŃ dla Xboxa');

gamepadState.id = 'Sony Interactive Entertainment DualSense Wireless Controller (054c)';
assert.strictEqual(getGamepadStyle(), 'PLAYSTATION');
const ctxPs = createMockCtx();
drawPickupPrompt(ctxPs, cam, false);
const hasSquareGlyph = ctxPs.ops.some(o => o[0] === 'strokeRect');
const textsPs = ctxPs.ops.filter(o => o[0] === 'fillText').map(o => o[1]);
assert(hasSquareGlyph, 'Dla PlayStation powinien byc narysowany symbol Kwadratu (strokeRect)');
assert(textsPs.includes('ZAMIEŃ'), 'Oczekiwano podpisu ZAMIEŃ dla PlayStation');
assert(!textsPs.includes('E'), 'W trybie pada nie powinien rysowac sie klawisz E');

gamepadState.connected = false;
gamepadState.lastInputTime = 0;

// =========================================================================
// TEST 3: TRYB MOBILNY / DOTYKOWY - UKRYCIE IKONY NAD POSTACIA + KIESZEN BRONI
// =========================================================================
setTouchDevice(true);
for (let i = 0; i < 10; i++) {
  updatePickups(0.05, player, [], cam);
}
assert.strictEqual(
  pickupPromptState.touchButtonBounds.active,
  false,
  'Na ekranie dotykowym plywajacy przycisk WEAPON nie moze zaslaniac postaci'
);

const ctxTouchPrompt = createMockCtx();
drawPickupPrompt(ctxTouchPrompt, cam, true);
assert.strictEqual(
  ctxTouchPrompt.ops.length,
  0,
  'drawPickupPrompt nie powinien rysowac zadnych ksztaltow dla WEAPON na urzadzeniu dotykowym'
);

// Weryfikacja rysowania na kieszeni broni palnej (strzalki zamiany w tle + bron z ziemi SNIPER)
const ctxHud = createMockCtx();
drawHUD(ctxHud, player, cam, 1 / 60, () => {});
const hudArcCount = ctxHud.ops.filter(o => o[0] === 'arc').length;
const hudTexts = ctxHud.ops.filter(o => o[0] === 'fillText').map(o => o[1]);
assert(hudArcCount >= 4, 'HUD kieszeni broni powinien rysowac pierscienie oraz strzalki zamiany');
assert(hudTexts.includes('5'), `Kieszen broni podczas zamiany powinna pokazywac amunicje lezacego Barretta (5), znaleziono: ${JSON.stringify(hudTexts)}`);

// =========================================================================
// TEST 4: DOTYK KIESZENI BRONI PALNEJ PODCZAS ZAMIANY (BRAK PRZELADOWANIA + SWAP)
// =========================================================================
const pFarm = pockets.firearm;
assert(pFarm && pFarm.x > 0, 'Kieszen broni palnej musi miec obliczona pozycje');
const startWeaponId = player.currentWeapon.id;
assert.strictEqual(startWeaponId, 'AK47');

// Symulacja dotkniecia kieszeni palcem
fakeNow = 5000;
const touchStartEvt = {
  touches: [{ identifier: 77, clientX: pFarm.x, clientY: pFarm.y }],
  changedTouches: [{ identifier: 77, clientX: pFarm.x, clientY: pFarm.y }],
  preventDefault() {}
};
for (const fn of (canvasListeners.touchstart || [])) fn(touchStartEvt);

assert.strictEqual(pFarm.active, true, 'Dotkniecie kieszeni musi ja aktywowac');
assert.strictEqual(pFarm.swapIntent, true, 'Kieszen powinna wykryc intencje zamiany broni');

// Uplywa 600ms -> NIE wolno wywolac przeladowania zamiast zamiany!
fakeNow = 5600;
updatePlayerInputAndCombat('ARENA_2');
assert.strictEqual(pFarm.reloadTriggered, false, 'Przy intencji zamiany przytrzymanie NIE moze wywolac przeladowania');
assert.strictEqual(!!player.isReloading, false, 'Gracz nie powinien zaczac przeladowania podczas zamiany');

// Zwalniamy dotyk (tap / krótkie puszczenie) -> natychmiastowa zamiana broni na SNIPER!
const touchEndEvt = {
  touches: [],
  changedTouches: [{ identifier: 77, clientX: pFarm.x, clientY: pFarm.y }],
  preventDefault() {}
};
for (const fn of (canvasListeners.touchend || [])) fn(touchEndEvt);

assert.strictEqual(
  player.currentWeapon.id,
  'SNIPER',
  `Po dotknieciu kieszeni broni podczas podpowiedzi gracz powinien miec SNIPER, ma: ${player.currentWeapon.id}`
);
assert(
  pickupState.droppedWeapons.some(d => d.weaponId === 'AK47'),
  'Poprzednia bron AK47 powinna zostac upuszczona na ziemie'
);

// Przywracamy stan
resetPickupState();
const swapPlatIdx = ARENA_PLATFORMS.indexOf(testSwapPlat);
if (swapPlatIdx !== -1) ARENA_PLATFORMS.splice(swapPlatIdx, 1);
setTouchDevice(false);

console.log('[OK] Wszystkie testy ikony zamiany broni (PC / Pad / Touch Pocket) zakonczone sukcesem.');
