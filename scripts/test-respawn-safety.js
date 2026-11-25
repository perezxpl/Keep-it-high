// =========================================================================
// TEST-RESPAWN-SAFETY.JS - WERYFIKACJA GASZENIA OGNIA I BEZPIECZNEGO RESPAWNU
// Testuje:
// 1. Brak ognia po odrodzeniu dla gracza oraz bota (po smierci od ognia i od broni)
// 2. Blokade podpalenia w trakcie spawn protection
// 3. Omijanie rozlanego ognia i kropel napalmu (lacznie z dynamicznym fallbackiem)
// 4. Omijanie kwasu, kaluz kwasu, rzeki/wody, kraterow, dziur w podlozu, magmy, gejzerow,
//    opadajacej suwnicy A5, laser gate i wybuchajacych beczek
// =========================================================================

import assert from 'node:assert';

globalThis.window = globalThis;
globalThis.innerWidth = 1920;
globalThis.innerHeight = 1080;
globalThis.devicePixelRatio = 1;
if (!globalThis.navigator) {
  Object.defineProperty(globalThis, 'navigator', {
    value: { maxTouchPoints: 0, userAgent: 'node-test' },
    configurable: true
  });
}
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.document = {
  createElement: () => ({
    getContext: () => ({
      save() {}, restore() {}, clearRect() {}, fillRect() {}, strokeRect() {},
      beginPath() {}, moveTo() {}, lineTo() {}, arc() {}, fill() {}, stroke() {},
      drawImage() {}, translate() {}, scale() {}, rotate() {}, createPattern() { return {}; }
    }),
    width: 1920,
    height: 1080
  }),
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {}
};
globalThis.Image = class {
  constructor() {
    this.naturalWidth = 512;
    this.naturalHeight = 512;
    this.width = 512;
    this.height = 512;
    this.complete = true;
    this.src = '';
  }
};
globalThis.performance = { now: () => Date.now() };

await import('../js/config.js');
await import('../js/world.js');
const { createPlayerInstance } = await import('../js/player/state.js');
const { handlePlayerDeath, getFarthestSpawnPoint } = await import('../js/player/death.js');
const { evaluateSpawnSafety, isSpawnPointSafe } = await import('../js/player/spawnSafety.js');
const {
  igniteCombatant,
  extinguishCombatant,
  spawnSurfaceFire,
  clearFlamethrowerState,
  updateFlamethrower,
  hasFireHazardInBox
} = await import('../js/weapons/flamethrower.js');
const { switchArena, getActiveArena, customObstacles } = await import('../js/obstacles.js');
const { groundSegments } = await import('../js/world.js');
const { ACID_SURGE_SYSTEM } = await import('../js/arenas/arena2/state.js');
const { carveTerrainCrater, ARENA_3_BRIDGE_BLOCKS, getRiverbankGroundY } = await import('../js/arenas/arena3/state.js');
const { arena5State, CELL_SIZE } = await import('../js/arenas/arena5/state.js');
const { hazardsState, createBarrelInstance, resetHazardsState } = await import('../js/hazards/state.js');

function forceRespawnThroughDeath(entity, groundY, combatants) {
  entity.hp = 0;
  entity.isDead = true;
  entity.respawnTimer = 1;
  entity._droppedWeaponThisDeath = true;
  handlePlayerDeath(entity, groundY, combatants);
}

console.log('--- TEST 1: Gaszenie ognia na postaci przy zgonie i odrodzeniu (gracz + bot) ---');
{
  clearFlamethrowerState();
  resetHazardsState();
  switchArena('ARENA_1');
  const groundY = 1000;

  const p = createPlayerInstance({ isBot: false, team: 'CYAN', x: 300, y: 790 });
  const b = createPlayerInstance({ isBot: true, active: true, team: 'ORANGE', x: 2500, y: 790 });

  // Podpalenie obu postaci, nastepnie zgon (zarowno bezposredni np. od kuli, jak i w trakcie palenia)
  p.spawnProtectionTimer = 0;
  b.spawnProtectionTimer = 0;
  igniteCombatant(p, b, 240);
  igniteCombatant(b, p, 240);
  assert.strictEqual(p.burnTimer, 240, 'Gracz powinien plonac przed zgonem');
  assert.strictEqual(b.burnTimer, 240, 'Bot powinien plonac przed zgonem');

  forceRespawnThroughDeath(p, groundY, [p, b]);
  forceRespawnThroughDeath(b, groundY, [p, b]);

  assert.strictEqual(p.isDead, false, 'Gracz powinien sie odrodzic');
  assert.strictEqual(b.isDead, false, 'Bot powinien sie odrodzic');
  assert.strictEqual(p.burnTimer, 0, 'Gracz po odrodzeniu musi miec wyzerowany burnTimer');
  assert.strictEqual(p.burnIntensity, 0, 'Gracz po odrodzeniu musi miec wyzerowana burnIntensity');
  assert.strictEqual(p.burnAttacker, null, 'Gracz po odrodzeniu musi miec wyczyszczony burnAttacker');
  assert.strictEqual(b.burnTimer, 0, 'Bot po odrodzeniu musi miec wyzerowany burnTimer');
  assert.strictEqual(b.burnIntensity, 0, 'Bot po odrodzeniu musi miec wyzerowana burnIntensity');
  assert.strictEqual(b.burnAttacker, null, 'Bot po odrodzeniu musi miec wyczyszczony burnAttacker');

  // Test stopniowania podpalenia: lekkie musniecie vs lanie napalmu z miotacza
  p.spawnProtectionTimer = 0;
  igniteCombatant(p, b, 65, { intensity: 0.24, additiveIntensity: 0.11, additiveDuration: 18, maxDuration: 165, maxIntensity: 0.85 });
  const lightIntensity = p.burnIntensity;
  const lightDuration = p.burnTimer;
  assert.ok(lightIntensity < 0.35, 'Krotkie wejscie w ogien powinno dac niska intensywnosc podpalenia');

  // Kolejne uderzenia strumienia miotacza powinny kumulatywnie zwiekszac ogien do pelnego pozaru
  for (let hit = 0; hit < 6; hit++) {
    igniteCombatant(p, b, 120, { intensity: 0.36, additiveIntensity: 0.14, additiveDuration: 26, maxDuration: 265, maxIntensity: 1.0 });
  }
  assert.ok(p.burnIntensity >= 0.90, `Lanie napalmu z miotacza powinno rozpalic postac do pelnego pozaru (jest ${p.burnIntensity})`);
  assert.ok(p.burnTimer > lightDuration, 'Czas trwania po oblaniu napalmem powinien byc dluzszy niz po musnieciu');

  extinguishCombatant(p);
  assert.strictEqual(p.burnTimer, 0);
  assert.strictEqual(p.burnIntensity, 0);
  p.spawnProtectionTimer = 150;

  // Dodatkowo: ponowne podpalenie z aktywna ochrona po odrodzeniu musi byc odrzucone
  igniteCombatant(p, b, 180);
  assert.strictEqual(p.burnTimer, 0, 'Spawn protection musi blokowac natychmiastowe podpalenie po odrodzeniu');

  // Dodatkowo: nawet jesli obiekt mial zamrozony burnTimer po zgonie od innych obrazen, updateFlamethrower czysci go
  p.isDead = true;
  p.burnTimer = 99;
  p.burnAttacker = b;
  updateFlamethrower(groundY, null, null, [p], null);
  assert.strictEqual(p.burnTimer, 0, 'Martwa postac nie moze utrzymywac burnTimer w trakcie updateFlamethrower');
  console.log('PASS: Gaszenie ognia na graczu i bocie podczas zgonu/odrodzenia dziala poprawnie.');
}

console.log('--- TEST 2: Respawn omija plonace miejsca oraz szuka bezpiecznego miejsca gdy wszystkie spawny plona ---');
{
  clearFlamethrowerState();
  resetHazardsState();
  switchArena('ARENA_1');
  const activeArena = getActiveArena();
  const groundY = 1000;
  const p = createPlayerInstance({ isBot: false, team: 'CYAN', x: 300, y: 790 });
  const enemy = createPlayerInstance({ isBot: true, active: true, team: 'ORANGE', x: 2500, y: 790 });

  // Podpal wszystkie predefiniowane spawny oprocz jednego (index 5)
  const spList = activeArena.spawns;
  assert.ok(spList.length >= 2, 'Arena 1 musi miec predefiniowane spawny');
  for (let i = 0; i < spList.length; i++) {
    if (i === 5) continue;
    const sp = spList[i];
    spawnSurfaceFire(sp.x + 12, sp.y + 70, 0, -1, enemy, 'ORANGE', 44, 300, 1.1);
  }

  for (let trial = 0; trial < 12; trial++) {
    const chosen = getFarthestSpawnPoint(activeArena, p, [p, enemy], groundY);
    assert.ok(isSpawnPointSafe(chosen, activeArena, p, groundY), 'Wybrany spawn musi byc wolny od ognia');
    assert.strictEqual(hasFireHazardInBox(chosen.x - 10, chosen.y, chosen.x + 36, chosen.y + 74), false, 'Na wybranym spawnie nie moze byc ognia');
  }

  // Teraz podpal ROWNIEZ ostatni spawn -> dynamiczny fallback musi znalezc niepalace sie miejsce na platformie/gruncie
  const lastSp = spList[5];
  spawnSurfaceFire(lastSp.x + 12, lastSp.y + 70, 0, -1, enemy, 'ORANGE', 44, 300, 1.1);
  const dynamicSpawn = getFarthestSpawnPoint(activeArena, p, [p, enemy], groundY);
  assert.ok(dynamicSpawn && typeof dynamicSpawn.x === 'number', 'Dynamiczny fallback musi zwrocic punkt');
  assert.strictEqual(hasFireHazardInBox(dynamicSpawn.x - 10, dynamicSpawn.y, dynamicSpawn.x + 36, dynamicSpawn.y + 74), false, 'Dynamiczny punkt nie moze lezec w ogniu');
  assert.strictEqual(evaluateSpawnSafety(dynamicSpawn, activeArena, p, groundY).safe, true, 'Dynamiczny spawn musi przejsc pelna walidacje bezpieczenstwa');
  console.log('PASS: Respawn unika rozlanego ognia i dynamicznie szuka bezpiecznego miejsca.');
}

console.log('--- TEST 3: Arena 1 - unikanie dziur w podlozu, laser gate i wybuchajacej beczki ---');
{
  clearFlamethrowerState();
  resetHazardsState();
  customObstacles.length = 0;
  switchArena('ARENA_1');
  const activeArena = getActiveArena();
  const groundY = 1000;
  const p = createPlayerInstance({ isBot: false, team: 'CYAN', x: 400, y: 928 });

  // Wytnij dziure w gruncie pod X=500..650 i sprawdz bezpiecznosc punktu przy gruncie
  for (const seg of groundSegments) {
    if (seg.x >= 460 && seg.x <= 660) seg.destroyed = true;
  }
  const holeSpawnCheck = evaluateSpawnSafety({ x: 540, y: 928, facing: 1 }, activeArena, p, groundY);
  assert.strictEqual(holeSpawnCheck.lethalSafe, false, 'Spawn nad wybita dziura w podlozu musi byc odrzucony');

  // Postaw laser_gate oraz tykajaca beczke na spawnie [0]
  const sp0 = activeArena.spawns[0];
  customObstacles.push({ type: 'laser_gate', x: sp0.x - 4, y: sp0.y + 10, w: 40, h: 60, solid: true });
  const chosenAfterLaser = getFarthestSpawnPoint(activeArena, p, [p], groundY);
  assert.notStrictEqual(Math.round(chosenAfterLaser.x), Math.round(sp0.x), 'Respawn musi ominac spawn z laser_gate');

  const sp1 = activeArena.spawns[1];
  const fusingBarrel = createBarrelInstance({ type: 'EXPLOSIVE', x: sp1.x, y: sp1.y + 20 });
  fusingBarrel.fuseTimer = 0.05;
  hazardsState.barrels.push(fusingBarrel);
  assert.strictEqual(isSpawnPointSafe(sp1, activeArena, p, groundY), false, 'Spawn obok tykajacej beczki musi byc odrzucony');

  customObstacles.length = 0;
  console.log('PASS: Dziury w podlozu, laser_gate i tykajace beczki sa poprawnie blokowane.');
}

console.log('--- TEST 4: Arena 2 - unikanie podniesionego kwasu oraz kaluz kwasu ---');
{
  clearFlamethrowerState();
  resetHazardsState();
  switchArena('ARENA_2');
  const activeArena = getActiveArena();
  const groundY = 1440;
  const p = createPlayerInstance({ isBot: false, team: 'CYAN', x: 530, y: 350 });

  // Podnies kwas na 900 -> dolne spawny (y=1010) sa zalane
  ACID_SURGE_SYSTEM.currentY = 900;
  for (const sp of activeArena.spawns) {
    if (sp.y >= 900) {
      assert.strictEqual(evaluateSpawnSafety(sp, activeArena, p, groundY).lethalSafe, false, 'Zalany kwasem spawn musi byc śmiertelny/odrzucony');
    }
  }

  // Wylej kaluze kwasu na hubie centralnym i wybranych kładkach
  hazardsState.acidPools.push({ x: 2000, y: 720, radius: 75, timer: 10 });
  assert.strictEqual(isSpawnPointSafe({ x: 2000, y: 650, facing: 1 }, activeArena, p, groundY), false, 'Spawn na kaluzy kwasu musi byc odrzucony');

  const chosenA2 = getFarthestSpawnPoint(activeArena, p, [p], groundY);
  assert.ok(chosenA2.y + 72 < ACID_SURGE_SYSTEM.currentY - 40, 'Wybrany spawn na Arenie 2 musi byc wysoko nad kwasem');
  assert.strictEqual(isSpawnPointSafe(chosenA2, activeArena, p, groundY), true, 'Wybrany spawn A2 musi byc w pelni bezpieczny');
  console.log('PASS: Respawn A2 unika lustra kwasu oraz kaluz toksycznych.');
}

console.log('--- TEST 5: Arena 3 - unikanie rzeki/wody, zerwanego mostu i zalanego krateru ---');
{
  clearFlamethrowerState();
  resetHazardsState();
  switchArena('ARENA_3');
  const activeArena = getActiveArena();
  const groundY = 1200;
  const p = createPlayerInstance({ isBot: false, team: 'CYAN', x: 500, y: 1130 });

  // Zniszcz most na srodku kanalu rzeki
  for (let i = 8; i <= 15; i++) {
    if (ARENA_3_BRIDGE_BLOCKS[i]) {
      ARENA_3_BRIDGE_BLOCKS[i].intact = false;
      ARENA_3_BRIDGE_BLOCKS[i].solid = false;
    }
  }
  const waterCheck = evaluateSpawnSafety({ x: 2200, y: 780, facing: 1 }, activeArena, p, groundY);
  // Most kamienny (x=2200, y=780) jest nad rzeka -> jesli zniszczymy kraterem grunt przy spawnie x=1050:
  carveTerrainCrater(1050, getRiverbankGroundY(1050), 175);
  const craterG = getRiverbankGroundY(1050);
  if (craterG >= 1300) {
    assert.strictEqual(evaluateSpawnSafety({ x: 1050, y: 1130, facing: 1 }, activeArena, p, groundY).lethalSafe, false, 'Zalany krater przy 1050 musi byc odrzucony');
  }

  // Test bezposrednio nad otwarta woda (X=2200, Y=1150) bez mostu
  const openRiverCheck = evaluateSpawnSafety({ x: 2200, y: 1150, facing: 1 }, activeArena, p, groundY);
  assert.strictEqual(openRiverCheck.lethalSafe, false, 'Punkt nad otwarta woda w rzece musi byc zawsze odrzucony');

  const chosenA3 = getFarthestSpawnPoint(activeArena, p, [p], groundY);
  assert.ok(!(chosenA3.x >= 1750 && chosenA3.x <= 2650 && chosenA3.y > 1200), 'Respawn A3 nie moze ladowac w rzece');
  assert.strictEqual(isSpawnPointSafe(chosenA3, activeArena, p, groundY), true, 'Respawn A3 musi miec pewne podloze');
  console.log('PASS: Respawn A3 bezpiecznie omija wode, zerwany most i zalane kratery.');
}

console.log('--- TEST 6: Arena 4 - unikanie magmy i wybuchajacych gejzerow ---');
{
  clearFlamethrowerState();
  resetHazardsState();
  switchArena('ARENA_4');
  const activeArena = getActiveArena();
  const groundY = 1400;
  const p = createPlayerInstance({ isBot: false, team: 'CYAN', x: 980, y: 970 });

  // Test w jeziorze magmy
  const magmaCheck = evaluateSpawnSafety({ x: 1600, y: 1350, facing: 1 }, activeArena, p, groundY);
  assert.strictEqual(magmaCheck.lethalSafe, false, 'Spawn przy jeziorze magmy musi byc odrzucony');

  // Test przy wybuchajacym gejzerze na x=1300 (na wysokosci rampy/pomostu)
  activeArena.geysers[0].state = 'ERUPTING';
  const geyserCheck = evaluateSpawnSafety({ x: 1295, y: 850, facing: 1 }, activeArena, p, groundY);
  assert.strictEqual(geyserCheck.lethalSafe, false, 'Spawn w kolumnie erupcji gejzeru musi byc odrzucony');

  const chosenA4 = getFarthestSpawnPoint(activeArena, p, [p], groundY);
  assert.strictEqual(isSpawnPointSafe(chosenA4, activeArena, p, groundY), true, 'Wybrany spawn A4 musi byc bezpieczny');
  console.log('PASS: Respawn A4 omija jezioro magmy oraz aktywne gejzery.');
}

console.log('--- TEST 7: Arena 5 - unikanie suwnicy (crane WARNING/FALLING) oraz dolnego utylizatora ---');
{
  clearFlamethrowerState();
  resetHazardsState();
  switchArena('ARENA_5');
  const activeArena = getActiveArena();
  const groundY = 1200;
  const p = createPlayerInstance({ isBot: false, team: 'CYAN', x: 200, y: 1105 });

  // Ustaw suwnice w trybie FALLING na kolumnach 2..3 (x = 200..400)
  arena5State.crane.phase = 'FALLING';
  arena5State.crane.col = 2;
  arena5State.crane.dropX = 2 * CELL_SIZE;
  arena5State.crane.shape = { w: 2, h: 2, cells: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 0, r: 1 }, { c: 1, r: 1 }] };

  const craneCheck = evaluateSpawnSafety({ x: 250, y: 1105, facing: 1 }, activeArena, p, groundY);
  assert.strictEqual(craneCheck.lethalSafe, false, 'Spawn bezposrednio pod opadajaca suwnica musi byc odrzucony');

  // Test utylizatora na dole
  arena5State.recyclerY = 1150;
  const recyclerCheck = evaluateSpawnSafety({ x: 600, y: 1105, facing: 1 }, activeArena, p, groundY);
  assert.strictEqual(recyclerCheck.lethalSafe, false, 'Spawn zbyt blisko dolnego utylizatora musi byc odrzucony');

  arena5State.recyclerY = 1600;
  const chosenA5 = getFarthestSpawnPoint(activeArena, p, [p], groundY);
  assert.ok(chosenA5.x + 26 < 200 - 15 || chosenA5.x > 400 + 15, 'Wybrany spawn A5 nie moze znajdowac sie pod suwnica');
  assert.strictEqual(isSpawnPointSafe(chosenA5, activeArena, p, groundY), true, 'Wybrany spawn A5 musi byc w pelni bezpieczny');
  console.log('PASS: Respawn A5 omija opadajaca suwnice oraz utylizator.');
}

console.log('\n[SUKCES] Wszystkie testy bezpieczenstwa respawnu i gaszenia ognia zaliczone!');
