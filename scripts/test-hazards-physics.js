// =========================================================================
// TEST-HAZARDS-PHYSICS.JS - WERYFIKACJA FIZYKI I ZACHOWANIA BECZEK ORAZ KWASU
// =========================================================================

import assert from 'node:assert';

// Mock minimal browser globals for testing
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.document = {
  createElement: () => ({
    getContext: () => null,
    width: 0,
    height: 0
  }),
  addEventListener: () => {},
  removeEventListener: () => {}
};
globalThis.Image = class {
  constructor() {
    this.naturalWidth = 512;
    this.naturalHeight = 704;
    this.width = 512;
    this.height = 704;
    this.src = '';
  }
};
globalThis.performance = { now: () => Date.now() };

// Import modules
const { hazardsState, BARREL_CONFIG, BARREL_TYPES, createBarrelInstance, resetHazardsState } = await import('../js/hazards/state.js');
const { getBarrelSurfaceY, kickBarrel, damageBarrel, detonateBarrel, updateHazards, checkBarrelKickInteraction, spawnAirdropBarrel } = await import('../js/hazards/logic.js');
const { setActiveArena } = await import('../js/arenas/index.js');

console.log('--- TEST 1: Dotyk i bieg postaci w beczke (Brak wybuchu i obrazen) ---');
{
  resetHazardsState();
  const barrel = createBarrelInstance({ type: 'EXPLOSIVE', x: 500, y: 700 });
  barrel.onGround = true;
  hazardsState.barrels.push(barrel);

  const player = {
    x: 480,
    y: 670,
    w: 24,
    h: 70,
    vx: 4.5, // Sprint w strone beczki
    vy: 0,
    hp: 100,
    isDead: false
  };

  // Klatka fizyki
  updateHazards(1 / 60, [player], 738);

  assert.strictEqual(barrel.isDead, false, 'Beczka nie powinna wybuchnac od wbiegniecia gracza');
  assert.strictEqual(barrel.hp, barrel.maxHp, 'Beczka nie powinna otrzymac obrazen od dotkniecia');
  assert.strictEqual(player.hp, 100, 'Gracz nie powinien otrzymac obrazen od dotkniecia beczki');
  assert.strictEqual(barrel.isKicked, false, 'Beczka nie powinna byc oznaczona jako isKicked przy zwyklym dotyku');
  console.log('PASS: Dotyk i bieg postaci nie detonuje beczki.');
}

console.log('--- TEST 2: Spartan Kick wykopuje beczke z statusem isKicked i detonuje przy impakcie ---');
{
  resetHazardsState();
  const barrel = createBarrelInstance({ type: 'EXPLOSIVE', x: 500, y: 700 });
  barrel.onGround = true;
  hazardsState.barrels.push(barrel);

  const kicker = {
    x: 470,
    y: 670,
    w: 24,
    h: 70,
    facing: 1,
    isDead: false
  };

  const kicked = checkBarrelKickInteraction(kicker, false);
  assert.strictEqual(kicked, barrel, 'checkBarrelKickInteraction powinien zwrocic wykopana beczke');
  assert.strictEqual(barrel.isKicked, true, 'Wykopana beczka musi miec isKicked = true');
  assert.ok(barrel.vx > 10, 'Wykopana beczka powinna posiadac wysoka predkosc pozioma');

  // Wrog na trajektorii
  const enemy = {
    x: 520,
    y: 670,
    w: 24,
    h: 70,
    vx: 0,
    vy: 0,
    hp: 100,
    isDead: false
  };

  updateHazards(1 / 60, [kicker, enemy], 738);
  assert.strictEqual(barrel.isDead, true, 'Beczka wykopana Spartan Kickiem musi zdetonowac przy uderzeniu w przeciwnika');
  console.log('PASS: Spartan Kick poprawnie weaponizuje beczke i detonuje przy impakcie.');
}

console.log('--- TEST 3: Dynamiczne podloze: brak lewitacji po wycieciu krateru ---');
{
  resetHazardsState();
  const barrel = createBarrelInstance({ type: 'EXPLOSIVE', x: 500, y: 700 });
  barrel.onGround = true;
  hazardsState.barrels.push(barrel);

  // Symulacja podloza: standardowo Y: 738, ale pod beczka wycieto krater do Y: 800
  globalThis.isGroundAt = (x, y) => true;
  // Udawajmy, ze podloze pod beczka obnizylo sie z 738 do 800
  const oldSurfaceY = 738;
  const newSurfaceY = 800;

  // Sprawdzamy logike utraty oparcia
  const feetY = barrel.y + barrel.h; // 738
  assert.strictEqual(feetY, 738);

  // Klatka z nowym nizszym podlozem
  updateHazards(1 / 60, [], newSurfaceY);

  assert.strictEqual(barrel.onGround, false, 'Beczka musi natychmiast stracic onGround po zapadnieciu podloza');
  assert.ok(barrel.vy > 0, 'Beczka musi zaczac spadac w dol z grawitacja');
  console.log('PASS: Beczka traci oparcie i spada po wycieciu krateru (brak lewitacji).');
}

console.log('--- TEST 4: Dynamiczne podloze dla kaluzy kwasu (opadanie i znikanie) ---');
{
  setActiveArena('arena-1');
  resetHazardsState();
  hazardsState.currentArenaId = 'arena-1';
  hazardsState.acidPools.push({
    x: 500,
    y: 738,
    radius: 65,
    timer: 8.0,
    maxTimer: 8.0,
    dps: 14.0
  });

  // 1. Zapadniecie platformy do 780
  updateHazards(1 / 60, [], 780);
  assert.strictEqual(hazardsState.acidPools[0].y, 780, 'Kaluza kwasu musi natychmiast opasc na nowe dno krateru');

  // 2. Wpadniecie w przepasc / wode (Arena 3 river: >= 1280)
  setActiveArena('arena-3');
  hazardsState.currentArenaId = 'arena-3';
  hazardsState.acidPools.length = 0;
  hazardsState.acidPools.push({
    x: 2200, // Srodek rzeki (Arena 3)
    y: 1300,
    radius: 65,
    timer: 8.0,
    maxTimer: 8.0,
    dps: 14.0
  });
  updateHazards(1 / 60, [], 1380);
  assert.strictEqual(hazardsState.acidPools.length, 0, 'Kaluza kwasu wpadajaca do rzeki musi natychmiast zniknac');
  setActiveArena('arena-1');
  hazardsState.currentArenaId = 'arena-1';
  console.log('PASS: Kaluza kwasu opada na nowe dno krateru i znika w rzece.');
}

console.log('--- TEST 5: Zmiażdżenie z góry (Squash) ---');
{
  resetHazardsState();
  const barrel = createBarrelInstance({ type: 'EXPLOSIVE', x: 500, y: 700 });
  barrel.onGround = true;
  hazardsState.barrels.push(barrel);

  // Symulacja opadajacej suwnicy Areny 5
  globalThis.arena5State = {
    crane: { x: 450, y: 680, w: 200, h: 40 }
  };

  updateHazards(1 / 60, [], 738);
  assert.strictEqual(barrel.isDead, true, 'Beczka musi zdetonowac przy zmiazdzeniu przez suwnice/klocek');
  globalThis.arena5State = null;
  console.log('PASS: Beczka prawidlowo ulega detonacji przy zmiazdzeniu (Squash).');
}

console.log('--- TEST 6: Airdrop i limit beczek ---');
{
  resetHazardsState();
  hazardsState.barrels.push(createBarrelInstance({ type: 'EXPLOSIVE', x: 500, y: 700 }));
  hazardsState.barrels.push(createBarrelInstance({ type: 'TOXIC', x: 900, y: 700 }));

  // Proba airdropu gdy sa juz 2 beczki
  const spawned = spawnAirdropBarrel('arena-1', 738, []);
  assert.strictEqual(spawned, false, 'Airdrop nie moze nastapic gdy sa >= 2 beczki');

  // Usuniecie jednej beczki
  hazardsState.barrels.pop();
  assert.strictEqual(hazardsState.barrels.length, 1);

  const spawned2 = spawnAirdropBarrel('arena-1', 738, []);
  assert.strictEqual(spawned2, true, 'Airdrop powinien sie powiesc gdy jest < 2 beczki');
  assert.strictEqual(hazardsState.barrels.length, 2);

  const newB = hazardsState.barrels[1];
  assert.strictEqual(newB.y, -40, 'Nowa zrzucona beczka musi spadac z powietrza');
  assert.strictEqual(newB.onGround, false, 'Nowa zrzucona beczka musi byc w powietrzu');
  assert.ok(Math.abs(newB.x - 500) >= 140, 'Nowa beczka musi zachowac min. 140px dystansu od istniejacej');
  console.log('PASS: Airdrop dziala precyzyjnie z zachowaniem limitu i dystansu min. 140px.');
}

console.log('--- TEST 7: Obrazenia beczki od pocisku / damageBarrel ---');
{
  resetHazardsState();
  const barrel = createBarrelInstance({ type: 'EXPLOSIVE', x: 500, y: 700 });
  hazardsState.barrels.push(barrel);

  damageBarrel(barrel, 15);
  assert.strictEqual(barrel.hp, 10, 'Obrazenia 15 powinny zmniejszyc hp z 25 do 10');
  assert.strictEqual(barrel.isDead, false, 'Beczka nie powinna byc martwa przy hp = 10');

  damageBarrel(barrel, 20);
  assert.ok(barrel.hp <= 0, 'Obrazenia powinny zbic hp ponizej zera');
  assert.ok(barrel.fuseTimer > 0, 'Beczka przy hp <= 0 powinna rozpoczac fuseTimer');

  // Po uplywie fuseTimer beczka detonuje
  updateHazards(0.10, [], 738);
  assert.strictEqual(barrel.isDead, true, 'Beczka powinna zdetonowac po uplywie fuseTimer');
  console.log('PASS: damageBarrel prawidlowo zadaje obrazenia i odpala detonacje.');
}

console.log('--- TEST 8: Eksplozja granatu (detonateGrenadeExplosion) zadaje obrazenia beczkom ---');
{
  resetHazardsState();
  const barrel = createBarrelInstance({ type: 'EXPLOSIVE', x: 500, y: 700 });
  hazardsState.barrels.push(barrel);

  const { detonateGrenadeExplosion } = await import('../js/projectiles.js');
  // Granat wybucha w odleglosci 60px (promien 140)
  detonateGrenadeExplosion(440, 715, 140, null, 738, [], [], null, null, 'GRENADE');

  assert.ok(barrel.hp < 25, 'Eksplozja granatu musi zadac obrazenia pobliskiej beczce');
  console.log('PASS: detonateGrenadeExplosion zadaje obrazenia beczkom.');
}

console.log('\n[SUKCES] Wszystkie testy fizyki i zachowania beczek oraz kwasu zakonczone sukcesem!');
