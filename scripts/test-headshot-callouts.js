// =========================================================================
// TEST-HEADSHOT-CALLOUTS.JS - WERYFIKACJA HEADSHOTOW, DEKAPITACJI I DYMKOW
// =========================================================================

import assert from 'node:assert';

globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
const _storage = new Map();
globalThis.localStorage = {
  getItem: (k) => (_storage.has(k) ? _storage.get(k) : null),
  setItem: (k, v) => _storage.set(k, String(v)),
  removeItem: (k) => _storage.delete(k)
};
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

const { shouldDecapitateHeadshot, isMeleeStrikeWeapon, updateBullets } = await import('../js/weapons.js');
const { spawnThrownTomahawk, updateProjectiles } = await import('../js/projectiles.js');
const { bullets } = await import('../js/weapons/transform.js');
const { calloutState } = await import('../js/callouts/state.js');
const { initCallouts, registerCalloutKill } = await import('../js/callouts/logic.js');
const { player } = await import('../js/player/state.js');

console.log('--- TEST 1: Zasady dekapitacji (shouldDecapitateHeadshot) ---');
{
  const humanBot = { isZombie: false };
  const zombie = { isZombie: true };

  // AK47 i GLOCK nigdy nie odrywaja glowy ludziom (niezaleznie od dystansu)
  assert.strictEqual(shouldDecapitateHeadshot(humanBot, 'AK47', 40), false, 'AK47 z bliska nie moze odrywac glowy');
  assert.strictEqual(shouldDecapitateHeadshot(humanBot, 'AK47', 600), false, 'AK47 z daleka nie moze odrywac glowy');
  assert.strictEqual(shouldDecapitateHeadshot(humanBot, 'GLOCK', 30), false, 'GLOCK z bliska nie moze odrywac glowy');

  // SNIPER i RPG zawsze odrywaja glowe
  assert.strictEqual(shouldDecapitateHeadshot(humanBot, 'SNIPER', 900), true, 'Barrett .50 zawsze odrywa glowe przy smiertelnym headshocie');
  assert.strictEqual(shouldDecapitateHeadshot(humanBot, 'RPG', 400), true, 'Bezposredni headshot z RPG zawsze odrywa glowe');

  // Strzelby odrywaja glowe tylko z bliskiego dystansu (<= 220px)
  assert.strictEqual(shouldDecapitateHeadshot(humanBot, 'SHOTGUN', 120), true, 'SHOTGUN z bliska powinien oderwac glowe');
  assert.strictEqual(shouldDecapitateHeadshot(humanBot, 'SHOTGUN', 450), false, 'SHOTGUN z daleka nie powinien odrywac glowy');
  assert.strictEqual(shouldDecapitateHeadshot(humanBot, 'SAWED_OFF', 150), true, 'SAWED_OFF z bliska powinien oderwac glowe');
  assert.strictEqual(shouldDecapitateHeadshot(humanBot, 'SAWED_OFF', 380), false, 'SAWED_OFF z daleka nie powinien odrywac glowy');

  // Zombie przy smiertelnym strzale w glowe zawsze traci glowe (by nie wstalo)
  assert.strictEqual(shouldDecapitateHeadshot(zombie, 'AK47', 100), true, 'Zombie powinno stracic glowe przy headshocie by nie wstalo');
  assert.strictEqual(shouldDecapitateHeadshot(zombie, 'GLOCK', 100), true, 'Zombie powinno stracic glowe przy headshocie by nie wstalo');
  console.log('PASS: Reguly dekapitacji sa precyzyjne i zgodne z wymaganiami.');
}

console.log('--- TEST 2: Smiertelny headshot z AK47 zostawia glowe i oznacza killedByHeadshot ---');
{
  bullets.length = 0;
  player.x = 100;
  player.y = 700;
  player.team = 'CYAN';

  const enemy = {
    id: 'bot_ak_target',
    name: 'TEST_BOT',
    team: 'ORANGE',
    isBot: true,
    active: true,
    isZombie: false,
    x: 400,
    y: 700,
    w: 24,
    h: 70,
    hp: 20,
    facing: -1,
    hasHelmet: false,
    hasVest: false,
    hasHead: true,
    decapitated: false,
    isDead: false
  };

  // Pocisk AK47 trafia dokladnie w strefe glowy (y <= 712)
  bullets.push({
    x: 412,
    y: 702,
    prevX: 380,
    prevY: 702,
    vx: 32,
    vy: 0,
    gravity: 0,
    drag: 1,
    life: 60,
    damage: 25,
    shooter: player,
    weaponId: 'AK47',
    bulletId: 'b_ak_1',
    originX: 120,
    originY: 702,
    ballPush: 0
  });

  updateBullets(800, [], null, [player, enemy]);

  assert.strictEqual(enemy.isDead, true, 'Przeciwnik powinien zginac od trafienia w glowe');
  assert.strictEqual(enemy.killedByHeadshot, true, 'Przeciwnik zabity strzalem w glowe musi miec killedByHeadshot = true');
  assert.strictEqual(enemy.hasHead, true, 'AK47 nie moze odrywac glowy (hasHead musi pozostac true)');
  assert.strictEqual(enemy.decapitated, false, 'AK47 nie moze ustawiac decapitated = true');
  console.log('PASS: AK47 zabija czystym headshotem bez odrywania glowy.');
}

console.log('--- TEST 3: Smiertelny headshot ze SNIPER odrywa glowe i oznacza killedByHeadshot ---');
{
  bullets.length = 0;
  const enemy = {
    id: 'bot_sniper_target',
    name: 'TEST_BOT_2',
    team: 'ORANGE',
    isBot: true,
    active: true,
    isZombie: false,
    x: 900,
    y: 700,
    w: 24,
    h: 70,
    hp: 100,
    facing: -1,
    hasHelmet: false,
    hasVest: false,
    hasHead: true,
    decapitated: false,
    isDead: false
  };

  bullets.push({
    x: 912,
    y: 702,
    prevX: 860,
    prevY: 702,
    vx: 52,
    vy: 0,
    gravity: 0,
    drag: 1,
    life: 60,
    damage: 90,
    shooter: player,
    weaponId: 'SNIPER',
    isSniper: true,
    bulletId: 'b_sniper_1',
    originX: 120,
    originY: 702,
    ballPush: 0
  });

  updateBullets(800, [], null, [player, enemy]);

  assert.strictEqual(enemy.isDead, true, 'Przeciwnik powinien zginac od headshota ze snajperki');
  assert.strictEqual(enemy.killedByHeadshot, true, 'SNIPER headshot musi ustawiac killedByHeadshot = true');
  assert.strictEqual(enemy.hasHead, false, 'SNIPER powinien oderwac glowe (hasHead = false)');
  assert.strictEqual(enemy.decapitated, true, 'SNIPER powinien ustawic decapitated = true');
  console.log('PASS: Snajperka odrywa glowe i poprawnie flaguje killedByHeadshot.');
}

console.log('--- TEST 4: Dymek HEADSHOT w callouts (pojawia sie ludziom, NIE pojawia sie zombie) ---');
{
  initCallouts();

  const botVictim = {
    id: 'bot_callout_1',
    name: 'RIVAL_BOT',
    isZombie: false,
    killedByHeadshot: true,
    x: 500,
    y: 700
  };

  registerCalloutKill(player, botVictim, {
    victimId: botVictim.id,
    victimName: botVictim.name,
    isZombie: false,
    isHeadshot: true,
    x: 500,
    y: 650
  });

  const hsBubbles = calloutState.bubbles.filter((b) => b.kind === 'HEADSHOT');
  assert.strictEqual(hsBubbles.length, 1, 'Po zabiciu bota headshotem powinien pojawic sie 1 dymek HEADSHOT');
  assert.strictEqual(hsBubbles[0].words[0].text, 'HEADSHOT', 'Tekst dymka musi brzmiec HEADSHOT');
  assert.ok(hsBubbles[0].xpText.includes('+'), 'Dymek HEADSHOT powinien zawierac bonus XP');

  // Zabojstwo zombie headshotem NIE moze generowac zadnego dymka
  const beforeCount = calloutState.bubbles.length;
  const zombieVictim = {
    id: 'zombie_callout_1',
    name: 'ZOMBIE',
    isZombie: true,
    killedByHeadshot: true,
    x: 620,
    y: 700
  };
  registerCalloutKill(player, zombieVictim, {
    victimId: zombieVictim.id,
    victimName: zombieVictim.name,
    isZombie: true,
    isHeadshot: true,
    x: 620,
    y: 650
  });
  assert.strictEqual(calloutState.bubbles.length, beforeCount, 'Zabojstwo zombie headshotem NIE moze generowac dymka HEADSHOT');

  // Drugie zabojstwo headshotem w oknie czasowym (Podwojne zabojstwo + Headshot bez nakladania)
  const botVictim2 = {
    id: 'bot_callout_2',
    name: 'RIVAL_BOT_2',
    isZombie: false,
    killedByHeadshot: true,
    x: 520,
    y: 700
  };
  registerCalloutKill(player, botVictim2, {
    victimId: botVictim2.id,
    victimName: botVictim2.name,
    isZombie: false,
    isHeadshot: true,
    x: 520,
    y: 650
  });

  const multiBubbles = calloutState.bubbles.filter((b) => b.kind === 'MULTIKILL');
  const allHsBubbles = calloutState.bubbles.filter((b) => b.kind === 'HEADSHOT');
  assert.strictEqual(multiBubbles.length, 1, 'Powinien pojawic sie dymek PODWOJNE ZABOJSTWO');
  assert.strictEqual(allHsBubbles.length, 2, 'Powinien pojawic sie drugi dymek HEADSHOT');
  const lastMulti = multiBubbles[0];
  const lastHs = allHsBubbles[1];
  assert.ok(lastMulti.offsetY !== lastHs.offsetY || lastMulti.offsetX !== lastHs.offsetX, 'Dymki PODWOJNE ZABOJSTWO i HEADSHOT nie moga nakladac sie na siebie');

  console.log('PASS: System dymkow HEADSHOT dziala poprawnie i pomija zombie.');
}

console.log('--- TEST 5: Brak HEADSHOT od walki wrecz vs HEADSHOT przy rzucie toporkiem (TOMAHAWK) ---');
{
  assert.strictEqual(isMeleeStrikeWeapon('KNIFE'), true, 'KNIFE to cios wrecz (bez HEADSHOT calloutu)');
  assert.strictEqual(isMeleeStrikeWeapon('MACHETE'), true, 'MACHETE to cios wrecz (bez HEADSHOT calloutu)');
  assert.strictEqual(isMeleeStrikeWeapon('AXE'), true, 'AXE to cios wrecz (bez HEADSHOT calloutu)');
  assert.strictEqual(isMeleeStrikeWeapon('TOMAHAWK'), false, 'TOMAHAWK to rzut i moze wywolac HEADSHOT callout');
  assert.strictEqual(isMeleeStrikeWeapon('AK47'), false, 'AK47 to bron palna');

  // Symulacja rzutu Tomahawkiem w glowe przeciwnika bez helmu
  player.x = 100;
  player.y = 700;
  player.facing = 1;
  player.team = 'CYAN';

  const target = {
    id: 'bot_tomahawk_target',
    name: 'AXE_VICTIM',
    team: 'ORANGE',
    isBot: true,
    active: true,
    isZombie: false,
    x: 200,
    y: 700,
    w: 24,
    h: 70,
    hp: 100,
    facing: -1,
    hasHelmet: false,
    hasVest: false,
    hasHead: true,
    decapitated: false,
    isDead: false
  };

  const tomahawk = spawnThrownTomahawk(player, 212, 704, 1.0, 140, 704);
  tomahawk.x = 212;
  tomahawk.y = 704;
  tomahawk.vx = 18;
  tomahawk.vy = 0;

  updateProjectiles(800, [], null, [player, target], null, 1 / 60);

  assert.strictEqual(target.isDead, true, 'Rzut Tomahawkiem w glowe powinien zabic przeciwnika');
  assert.strictEqual(target.killedByHeadshot, true, 'Rzut broni bialej (Tomahawk) w glowe musi ustawiac killedByHeadshot = true');
  console.log('PASS: Walka wrecz blokuje napis HEADSHOT, a rzut Tomahawkiem w glowe go wyzwala.');
}

console.log('\n[SUKCES] Wszystkie testy headshotow, dekapitacji i calloutow zakonczone sukcesem!');
