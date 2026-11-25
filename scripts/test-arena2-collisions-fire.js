// =========================================================================
// TEST-ARENA2-COLLISIONS-FIRE.JS
// Weryfikacja:
// 1. Kolizje platform Areny 2 (lądowanie, skok od spodu, zeskok drop-through, szwy ramp)
// 2. Kolizje wszystkich 12 platform Areny 2 z pociskami oraz ogniem (Flamethrower / Molotov)
// 3. Synchronizacja wiszących belek sufitowych między ARENA_PLATFORMS a updateArena2
// 4. Reakcja beczek na ogień (FlameParticle, SurfaceFire, BurningFuelGlob, Molotov)
// =========================================================================

import assert from 'node:assert';

globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.innerWidth = 1920;
globalThis.innerHeight = 1080;
globalThis.devicePixelRatio = 1;
globalThis.document = {
  createElement: () => ({
    getContext: () => null,
    width: 1920,
    height: 1080
  }),
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {}
};
globalThis.Image = class {
  constructor() {
    this.naturalWidth = 128;
    this.naturalHeight = 128;
    this.width = 128;
    this.height = 128;
    this.complete = true;
    this.src = '';
  }
};
globalThis.performance = { now: () => Date.now() };
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

await import('../js/config.js');
await import('../js/world.js');
await import('../js/player/state.js');
const { ARENA_PLATFORMS, switchArena, checkPlayerPlatformLanding, checkRayObstacleCollision } = await import('../js/obstacles.js');
const { getActiveArena } = await import('../js/arenas/index.js');
const { ACID_SURGE_SYSTEM, updateArena2 } = await import('../js/arenas/arena2.js');
const { hazardsState, createBarrelInstance, resetHazardsState } = await import('../js/hazards/state.js');
const { updateHazards } = await import('../js/hazards/logic.js');
const {
  FlameParticle,
  BurningFuelGlob,
  SurfaceFire,
  activeSurfaceFires,
  activeFuelGlobs,
  activeFlameStreams,
  clearFlamethrowerState
} = await import('../js/weapons/flamethrower.js');
const { MolotovCocktail, detonateMolotovExplosion } = await import('../js/weapons/molotov.js');

// Helper creating minimal player object
function makePlayer(x, y, opts = {}) {
  return {
    x,
    y,
    w: 24,
    h: 72,
    vx: 0,
    vy: 0,
    airVx: 0,
    facing: 1,
    onGround: false,
    isJumping: false,
    isCrouching: false,
    isProne: false,
    isSliding: false,
    isIntro: false,
    isDead: false,
    hp: 100,
    maxHp: 100,
    jetFuel: 100,
    jetMax: 100,
    currentPlatform: null,
    currentGroundY: null,
    dropThroughTimer: 0,
    dropThroughPlatform: null,
    _dropThroughOriginY: null,
    staggerTimer: 0,
    ...opts
  };
}

switchArena('arena-2');
const arena2 = getActiveArena();
assert.strictEqual(arena2.id, 'arena-2', 'Aktywna arena musi byc arena-2');
assert.strictEqual(ARENA_PLATFORMS.length, 12, 'Arena 2 powinna miec 12 platform kolizyjnych');

console.log('--- TEST 1: Wszystkie platformy Areny 2 wspieraja drop-through i blokowanie pociskow ---');
{
  for (const plat of ARENA_PLATFORMS) {
    assert.strictEqual(plat.isDropThrough, true, `Platforma ${plat.id} musi miec isDropThrough = true`);
    assert.strictEqual(plat.blocksBullets, true, `Platforma ${plat.id} musi miec blocksBullets = true`);
    assert.strictEqual(plat.oneWay, true, `Platforma ${plat.id} musi miec oneWay = true`);
  }
  console.log('PASS: Flagi platform Areny 2 sa spojne.');
}

console.log('--- TEST 2: Skok od spodu przez platformy >600px (brak teleportu na wierzch) ---');
{
  // Gracz skacze od spodu pod plat_A_top_left (y: 420..452, w: 700)
  const p = makePlayer(400, 425, { vy: -7.0, isJumping: true, onGround: false });
  checkPlayerPlatformLanding(p, 1600);
  assert.strictEqual(p.onGround, false, 'Gracz lecacy w gore przez plat_A_top_left nie moze zostac zlapany na jej wierzch');
  assert.ok(p.vy < 0, 'Predkosc wznoszenia gracza musi pozostac ujemna');

  // Gracz przelatuje pod srodkiem rampy ramp_top_left (x: 1200, powierzchnia y ~ 561, bounding box y: 420..720)
  const pRamp = makePlayer(1200, 620, { vy: -5.0, isJumping: true, onGround: false });
  checkPlayerPlatformLanding(pRamp, 1600);
  assert.strictEqual(pRamp.onGround, false, 'Gracz pod rampa ramp_top_left nie moze zostac teleportowany na gore rampy');
  console.log('PASS: Skok od spodu dziala poprawnie na wszystkich szerokich platformach i pod rampami.');
}

console.log('--- TEST 3: Zeskok (drop-through) ze wszystkich typow platform Areny 2 ---');
{
  const dropTargets = [
    { id: 'ceil_pipe_mid', x: 1950, y: 150 - 72 },
    { id: 'plat_A_top_left', x: 500, y: 420 - 72 },
    { id: 'plat_B_top_right', x: 3400, y: 420 - 72 },
    { id: 'center_hub', x: 2000, y: 720 - 72 },
    { id: 'ramp_top_left', x: 1200, y: 561 - 72 },
    { id: 'plat_C_bot_left', x: 500, y: 1080 - 72 },
    // Test szwu miedzy center_hub a ramp_top_left / ramp_bot_left (x = 1565)
    { id: 'center_hub', x: 1565, y: 720 - 72 }
  ];

  for (const dt of dropTargets) {
    const plat = ARENA_PLATFORMS.find(pl => pl.id === dt.id);
    assert.ok(plat, `Brak platformy ${dt.id}`);
    const p = makePlayer(dt.x, dt.y, {
      onGround: true,
      currentPlatform: plat,
      currentGroundY: dt.y + 72
    });
    // Symulacja zainicjowania zeskoku (jak w keyboardMouse / touchHandlers)
    p.dropThroughTimer = 22;
    p.dropThroughPlatform = plat;
    p._dropThroughOriginY = dt.y + 72;
    p.y += 4;
    p.vy = 4.5;
    p.currentPlatform = null;
    p.onGround = false;
    p.isJumping = true;

    for (let f = 0; f < 6; f++) {
      p.y += p.vy;
      p.vy += 0.38;
      p.dropThroughTimer--;
      checkPlayerPlatformLanding(p, 1600);
    }

    assert.ok(
      p.y > dt.y + 25,
      `Gracz powinien spasc pod platforme ${dt.id} przy x=${dt.x} (p.y=${p.y}, startY=${dt.y})`
    );
  }
  console.log('PASS: Zeskok (drop-through) dziala na wszystkich platformach i szwach ramp.');
}

console.log('--- TEST 4: Kolizje WSZYSTKICH 12 platform Areny 2 z pociskami oraz ogniem ---');
{
  const testRays = [
    { id: 'ceil_pipe_left', x: 900, y1: 140, y2: 230 },
    { id: 'ceil_pipe_mid', x: 2000, y1: 110, y2: 200 },
    { id: 'ceil_pipe_right', x: 3050, y1: 140, y2: 230 },
    { id: 'plat_A_top_left', x: 500, y1: 380, y2: 490 },
    { id: 'plat_B_top_right', x: 3450, y1: 380, y2: 490 },
    { id: 'ramp_top_left', x: 1220, y1: 500, y2: 640 },
    { id: 'ramp_top_right', x: 2780, y1: 500, y2: 640 },
    { id: 'center_hub', x: 2000, y1: 680, y2: 780 },
    { id: 'ramp_bot_left', x: 1230, y1: 820, y2: 960 },
    { id: 'ramp_bot_right', x: 2770, y1: 820, y2: 960 },
    { id: 'plat_C_bot_left', x: 500, y1: 1040, y2: 1140 },
    { id: 'plat_D_bot_right', x: 3450, y1: 1040, y2: 1140 }
  ];

  for (const r of testRays) {
    const bulletHit = checkRayObstacleCollision(r.x, r.y1, r.x, r.y2, 1600, null, { weaponId: 'AK47' });
    assert.ok(bulletHit && bulletHit.hit, `Pocisk musi kolidowac z platforma ${r.id}`);

    const fireHit = checkRayObstacleCollision(r.x, r.y1, r.x, r.y2, 1600, null, null);
    assert.ok(fireHit && fireHit.hit, `Ogien musi kolidowac z platforma ${r.id}`);
  }

  // Test strzalu od spodu w rampe (prawidlowa normalna skierowana w dol ny > 0)
  const undersideHit = checkRayObstacleCollision(1220, 650, 1220, 550, 1600, null, null);
  assert.ok(undersideHit && undersideHit.hit, 'Ogien lecacy od spodu musi trafic spod rampy');
  assert.ok(undersideHit.ny > 0, `Normalna spodu rampy musi wskazywac w dol (ny > 0, otrzymano ${undersideHit.ny})`);

  // Test dynamicznego poziomu kwasu: przy spokojnym kwasie (1440) pocisk na Y=1300 nie uderza w niewidzialna sciane
  ACID_SURGE_SYSTEM.currentY = 1440;
  const openAirShot = checkRayObstacleCollision(2000, 1220, 2000, 1340, 1600, null, { weaponId: 'AK47' });
  assert.strictEqual(openAirShot, null, 'Przy kwasie na Y=1440 pocisk na Y=1300 nie powinien uderzac w powietrze');
  console.log('PASS: Wszystkie 12 platform Areny 2 poprawnie blokuja pociski i ogien.');
}

console.log('--- TEST 5: Synchronizacja wiszacych rur sufitowych ---');
{
  const pipeInArena = ARENA_PLATFORMS.find(p => p.id === 'ceil_pipe_mid');
  const p = makePlayer(2000, 150 - 72, { onGround: true, currentPlatform: pipeInArena, currentGroundY: 150 });
  const startY = pipeInArena.y;
  for (let i = 0; i < 20; i++) {
    updateArena2(1 / 60, [p]);
  }
  assert.ok(pipeInArena.y > startY, 'Wiszaca rura w ARENA_PLATFORMS musi uginac sie pod ciezarem gracza');
  arena2.reset();
  assert.strictEqual(pipeInArena.y, pipeInArena.baseY, 'Reset areny musi przywrocic wysokosc rury w ARENA_PLATFORMS');
  console.log('PASS: Wiszace rury sufitowe sa zsynchronizowane miedzy ARENA_PLATFORMS a logika areny.');
}

console.log('--- TEST 6: Molotov nad rampa nie rozbija sie w powietrzu i trafia w rampa ---');
{
  clearFlamethrowerState();
  // Nad ramp_top_left przy x=1220: powierzchnia rampy to ~570. Na y=420 (stary blad) musi leciec dalej!
  const mol = new MolotovCocktail(null, 1220, 480, 0.5, 1220, 405);
  mol.vx = 0;
  mol.vy = 6.0;
  mol.prevX = 1220;
  mol.prevY = 408;
  mol.x = 1220;
  mol.y = 418;
  const aliveAboveRamp = mol.update(1600, ARENA_PLATFORMS, null, [], null);
  assert.strictEqual(aliveAboveRamp, true, 'Molotov nad rampa przy y=424 nie moze rozbic sie o niewidzialny bounding box');
  assert.strictEqual(mol.detonated, false, 'Molotov nie moze przedwczesnie wybuchnac w powietrzu nad rampa');
  console.log('PASS: Molotov przelatuje poprawnie nad skosem rampy.');
}

console.log('--- TEST 7: Beczki reaguja na ogien (FlameParticle, SurfaceFire, BurningFuelGlob, Molotov) ---');
{
  clearFlamethrowerState();

  // 7A. Strumien z miotacza ognia (FlameParticle) podpala i uszkadza beczke
  resetHazardsState();
  hazardsState.currentArenaId = 'arena-2';
  const b1 = createBarrelInstance({ type: 'EXPLOSIVE', x: 500, y: 382 });
  b1.onGround = true;
  hazardsState.barrels.push(b1);

  const shooter = makePlayer(420, 348);
  const fp = new FlameParticle(shooter, 480, 400, 0, 22, { damage: 6, bulletSpeed: 22 });
  fp.prevX = 480;
  fp.prevY = 400;
  fp.vx = 35;
  fp.vy = 0;
  fp.update(1600, ARENA_PLATFORMS, null, [], null);

  assert.ok(b1.hp < b1.maxHp, 'Strumien z miotacza ognia musi zadac obrazenia beczce');
  assert.ok(b1.burnTimer > 0, 'Strumien z miotacza ognia musi podpalic beczke (burnTimer > 0)');

  // Podpalona beczka dopala sie w updateHazards i detonuje
  for (let s = 0; s < 150 && !b1.isDead; s++) {
    updateHazards(1 / 60, [], 1600);
  }
  assert.strictEqual(b1.isDead, true, 'Podpalona przez ogien beczka musi wybuchnac od temperatury');

  // 7B. Rozlany ogien na powierzchni (SurfaceFire) niszczy stojącą w nim beczkę
  resetHazardsState();
  hazardsState.currentArenaId = 'arena-2';
  const b2 = createBarrelInstance({ type: 'TOXIC', x: 500, y: 382 });
  b2.onGround = true;
  hazardsState.barrels.push(b2);

  const sf = new SurfaceFire(512, 420, 0, -1, shooter, 'CYAN', 40, 240, 1.0);
  sf.update([], null, 1600, null);
  assert.ok(b2.hp < b2.maxHp, 'Ogien powierzchniowy (SurfaceFire) musi zadac obrazenia beczce stojacej w ogniu');
  assert.ok(b2.burnTimer > 0, 'SurfaceFire musi podpalic beczke');

  // 7C. Kropla płonącego paliwa (BurningFuelGlob) trafia beczkę
  resetHazardsState();
  hazardsState.currentArenaId = 'arena-2';
  const b3 = createBarrelInstance({ type: 'EXPLOSIVE', x: 500, y: 382 });
  b3.onGround = true;
  hazardsState.barrels.push(b3);

  const glob = new BurningFuelGlob(480, 400, 35, 0, shooter, 'CYAN', 1.0);
  glob.prevX = 480;
  glob.prevY = 400;
  glob.update(1600, ARENA_PLATFORMS, null);
  assert.ok(b3.hp < b3.maxHp, 'Kropla napalmu (BurningFuelGlob) musi uszkodzic beczke');

  // 7D. Koktajl Mołotowa (bezpośrednie trafienie + eksplozja)
  resetHazardsState();
  hazardsState.currentArenaId = 'arena-2';
  const b4 = createBarrelInstance({ type: 'EXPLOSIVE', x: 500, y: 382 });
  b4.onGround = true;
  hazardsState.barrels.push(b4);

  const molHit = new MolotovCocktail(shooter, 512, 400, 1.0, 485, 400);
  molHit.x = 505;
  molHit.y = 400;
  const molAlive = molHit.update(1600, ARENA_PLATFORMS, null, [], null);
  assert.strictEqual(molAlive, false, 'Molotov przy uderzeniu w beczke musi sie rozbic');
  assert.strictEqual(molHit.detonated, true, 'Molotov po trafieniu w beczke musi zdetonowac');
  assert.ok(b4.hp <= 0 || b4.burnTimer > 0, 'Wybuch Mołotowa musi uszkodzic/podpalic beczke');

  // Wybuch Mołotowa w pobliżu beczki
  resetHazardsState();
  hazardsState.currentArenaId = 'arena-2';
  const b5 = createBarrelInstance({ type: 'EXPLOSIVE', x: 500, y: 382 });
  b5.onGround = true;
  hazardsState.barrels.push(b5);
  detonateMolotovExplosion(550, 415, 140, shooter, 1600, ARENA_PLATFORMS, null, [], null);
  assert.ok(b5.hp < b5.maxHp && b5.burnTimer > 0, 'detonateMolotovExplosion musi uszkodzic i podpalic beczke w zasiegu');

  console.log('PASS: Beczki reaguja poprawnie na kazdy rodzaj ognia.');
}

clearFlamethrowerState();
console.log('\n[SUKCES] Wszystkie testy Areny 2 (platformy, zeskok, pociski, ogien) i beczek przeszly!');
