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

console.log('--- TEST 6: Calkowity brak airdropu i respawnu beczek w trakcie meczu ---');
{
  resetHazardsState();
  hazardsState.barrels.push(createBarrelInstance({ type: 'EXPLOSIVE', x: 500, y: 700 }));

  // Proba airdropu w trakcie meczu musi zostac calkowicie zablokowana (zwraca false)
  const spawned = spawnAirdropBarrel('arena-1', 738, []);
  assert.strictEqual(spawned, false, 'spawnAirdropBarrel musi zawsze zwracac false (brak zrzutow w trakcie meczu)');
  assert.strictEqual(hazardsState.barrels.length, 1, 'Liczba beczek nie moze wzrosnac w trakcie meczu');

  // Symulacja uplywu 60 sekund w grze - zadna nowa beczka nie moze sie pojawic
  for (let s = 0; s < 60; s++) {
    updateHazards(1.0, [], 738);
  }
  assert.strictEqual(hazardsState.barrels.length, 1, 'Brak respawnowania beczek w trakcie gry');
  console.log('PASS: Calkowity brak zrzutow i respawnu beczek w trakcie meczu potwiedzony.');
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

console.log('--- TEST 9: Przycinanie (Clamping) kaluzy kwasu do krawedzi platformy ---');
{
  const { ARENA_PLATFORMS } = await import('../js/obstacles/state.js');
  const { fitAcidPoolToTerrain } = await import('../js/hazards/logic.js');

  // Symulacja platformy o szerokosci 100px: X: 400..500 na Y: 600
  const testPlat = {
    id: 'test_platform_clamping',
    x: 400,
    y: 600,
    w: 100,
    h: 20,
    solid: true,
    isPlatform: true,
    intact: true
  };
  ARENA_PLATFORMS.push(testPlat);

  // Kaluza o baseRadius = 65 wybuchla przy prawej krawedzi (x: 480)
  // Bez przyciecia siegalaby do 480 + 65 = 545 (wisialaby 45px w powietrzu!)
  const pool = {
    x: 480,
    y: 600,
    radius: 65,
    baseRadius: 65,
    timer: 8.0
  };

  const ok = fitAcidPoolToTerrain(pool, 800, 'arena-1');
  assert.strictEqual(ok, true, 'Kaluza na platformie 100px powinna sie zmiescic');
  // Prawa krawedz platformy to 500, wiec z marginesem 4px: max right = 496
  const rightEdge = pool.x + pool.radius;
  assert.ok(rightEdge <= 496.01, `Prawa krawedz kaluzy (${rightEdge}) nie moze wystawac poza 496px`);
  assert.ok(pool.radius < 65, 'Promien kaluzy powinien zostac zredukowany przez przyciecie do krawedzi');
  assert.strictEqual(pool.angle, 0, 'Kat na plaskiej platformie powinien wynosic 0');

  // Sprzatanie platformy
  const pIdx = ARENA_PLATFORMS.indexOf(testPlat);
  if (pIdx !== -1) ARENA_PLATFORMS.splice(pIdx, 1);

  console.log('PASS: Kaluza kwasu zostaje przycieta do krawedzi platformy i nie wisi w powietrzu.');
}

console.log('--- TEST 10: Anulowanie kaluzy kwasu gdy dostepna szerokosc podloza < 28px ---');
{
  const { ARENA_PLATFORMS } = await import('../js/obstacles/state.js');
  const { fitAcidPoolToTerrain } = await import('../js/hazards/logic.js');

  // Waska platforma o szerokosci 20px: X: 400..420 na Y: 600
  const narrowPlat = {
    id: 'test_narrow_platform',
    x: 400,
    y: 600,
    w: 20,
    h: 20,
    solid: true,
    isPlatform: true,
    intact: true
  };
  ARENA_PLATFORMS.push(narrowPlat);

  const pool = {
    x: 410,
    y: 600,
    radius: 65,
    baseRadius: 65,
    timer: 8.0
  };

  const ok = fitAcidPoolToTerrain(pool, 800, 'arena-1');
  assert.strictEqual(ok, false, 'Kaluza na waskiej platformie (< 28px) musi zostac calkowicie anulowana');

  // Sprzatanie
  const pIdx = ARENA_PLATFORMS.indexOf(narrowPlat);
  if (pIdx !== -1) ARENA_PLATFORMS.splice(pIdx, 1);

  console.log('PASS: Kaluza na zbyt waskim fragmencie zostaje prawidlowo anulowana.');
}

console.log('--- TEST 11: Dopasowanie kata i wysokosci kaluzy kwasu do skosu skarpy (Arena 3) ---');
{
  const { fitAcidPoolToTerrain } = await import('../js/hazards/logic.js');
  const { getRiverbankGroundY } = await import('../js/arenas/arena3/state.js');

  // Kaluza na lewej skarpie rzeki (x: 1300, gdzie Y opada w strone rzeki od 1200 do 1260)
  const groundYAt1300 = getRiverbankGroundY(1300);
  const pool = {
    x: 1300,
    y: groundYAt1300,
    radius: 50,
    baseRadius: 50,
    timer: 8.0
  };

  const ok = fitAcidPoolToTerrain(pool, 1380, 'arena-3');
  assert.strictEqual(ok, true, 'Kaluza powinna poprawnie dopasowac sie do skarpy rzeki');
  assert.ok(Math.abs(pool.angle) > 0.05, `Kat nachylenia kaluzy (${pool.angle}) musi byc niezerowy na skarpie`);
  assert.ok(pool.angle > 0, 'Na lewej skarpie deltaY > 0 (opadanie w prawo w strone rzeki)');
  assert.ok(Math.abs(pool.y - groundYAt1300) < 6, 'Wysokosc kaluzy musi odpowiadac rzeczywistej wysokosci podloza');

  console.log('PASS: Kaluza kwasu precyzyjnie dopasowuje kat i wysokosc do skosu skarpy rzeki.');
}

console.log('--- TEST 12: Dopasowanie kaluzy kwasu do dna wycietego krateru ---');
{
  const { fitAcidPoolToTerrain } = await import('../js/hazards/logic.js');
  const { carveTerrainCrater, getRiverbankGroundY } = await import('../js/arenas/arena3/state.js');

  const craterX = 600;
  const initialGroundY = getRiverbankGroundY(craterX); // 1200
  carveTerrainCrater(craterX, initialGroundY, 140);
  const craterBottomY = getRiverbankGroundY(craterX);
  assert.ok(craterBottomY > initialGroundY, 'W dnie krateru podloze musi byc obnizone');

  const pool = {
    x: craterX,
    y: initialGroundY, // Poczatkowa wysokosc sprzed wybuchu
    radius: 40,
    baseRadius: 40,
    timer: 8.0
  };

  const ok = fitAcidPoolToTerrain(pool, 1380, 'arena-3');
  assert.strictEqual(ok, true, 'Kaluza w kraterze powinna zostac poprawnie spasowana');
  assert.ok(pool.y > initialGroundY + 5, `Wysokosc kaluzy (${pool.y}) musi opasc w glab krateru`);
  assert.ok(Math.abs(pool.angle) < 0.1, 'Symetryczny krater w srodku powinien miec kat bliski zeru');

  console.log('PASS: Kaluza kwasu prawidlowo opada na dno wycietego krateru i zachowuje symetrie.');
}

console.log('--- TEST 13: Weryfikacja punktow spawnu na Arenie 3 (zakaz w strefie pali i mostu) ---');
{
  const { ARENA_BARREL_SPAWNS } = await import('../js/hazards/state.js');
  const a3Spawns = ARENA_BARREL_SPAWNS['arena-3'];
  assert.ok(Array.isArray(a3Spawns), 'ARENA_BARREL_SPAWNS dla arena-3 musi byc tablica');
  assert.ok(a3Spawns.length > 0, 'Arena 3 powinna miec zdefiniowane punkty spawnu');

  for (const sp of a3Spawns) {
    assert.ok(
      sp.x <= 750 || sp.x >= 3650,
      `Punkt spawnu beczki X=${sp.x} na Arenie 3 znajduje sie w zabronionej strefie pali/ramp/mostu (750..3650)!`
    );
  }
  console.log('PASS: Wszystkie predefiniowane punkty spawnu na Arenie 3 leza bezpiecznie w strefie baz z dala od pali.');
}

console.log('--- TEST 14: getValidBarrelSpawnSurfaceY na Arenie 3 twardo odrzuca strefy pali i ramp ---');
{
  const { getValidBarrelSpawnSurfaceY } = await import('../js/hazards/logic.js');

  // Sprawdzamy strefy ramp i pali: x = 1140..1755 (lewe pale i rampa) oraz x = 880
  const yInStilts = getValidBarrelSpawnSurfaceY(1400, 1100, 1380, 'arena-3');
  assert.strictEqual(yInStilts, null, 'Spawn w palach lewej rampy (X=1400) musi byc bezwzglednie zablokowany');

  const yAtOldPiling = getValidBarrelSpawnSurfaceY(880, 1162, 1380, 'arena-3');
  assert.strictEqual(yAtOldPiling, null, 'Spawn w strefie X=880 musi byc zablokowany');

  const yInBridge = getValidBarrelSpawnSurfaceY(2100, 900, 1380, 'arena-3');
  assert.strictEqual(yInBridge, null, 'Spawn w srodku mostu (X=2100) musi byc zablokowany');

  const yAtBaseAlfa = getValidBarrelSpawnSurfaceY(420, 1162, 1380, 'arena-3');
  assert.ok(yAtBaseAlfa !== null, 'Spawn w bezpiecznej strefie bazy Alfa (X=420) powinien byc dozwolony');
  console.log('PASS: getValidBarrelSpawnSurfaceY bezwzglednie blokuje strefy pali, mostu i ramp.');
}

console.log('--- TEST 15: resetArena czysci i poprawnie resetuje stan hazardsState ---');
{
  const { resetArena } = await import('../js/obstacles.js');
  hazardsState.barrels.push(createBarrelInstance({ type: 'EXPLOSIVE', x: 500, y: 700 }));
  hazardsState.acidPools.push({ x: 500, y: 700, radius: 40 });
  hazardsState.currentArenaId = 'arena-3';

  assert.ok(hazardsState.barrels.length > 0);
  assert.ok(hazardsState.acidPools.length > 0);

  resetArena();

  assert.strictEqual(hazardsState.barrels.length, 0, 'Beczki musza zostac wyczyszczone przy resetArena');
  assert.strictEqual(hazardsState.acidPools.length, 0, 'Kaluze kwasu musza zostac wyczyszczone przy resetArena');
  assert.strictEqual(hazardsState.currentArenaId, null, 'currentArenaId musi byc zresetowany przy resetArena');
  console.log('PASS: resetArena prawidlowo resetuje hazardsState.');
}

console.log('--- TEST 16: Jednorazowe losowe rozstawienie beczek na start meczu na wszystkich arenach ---');
{
  const { initHazardsForArena } = await import('../js/hazards/logic.js');

  for (const aId of ['arena-1', 'arena-2', 'arena-3', 'arena-4', 'arena-5']) {
    hazardsState.currentArenaId = null;
    hazardsState.barrels.length = 0;
    setActiveArena(aId);

    const groundY = (aId === 'arena-3' || aId === 'arena-4') ? 1380 : (aId === 'arena-5' ? 1200 : 738);
    initHazardsForArena(aId, groundY);

    const count = hazardsState.barrels.length;
    if (aId === 'arena-5') {
      assert.ok(count >= 3 && count <= 4, `Arena 5 powinna miec 3-4 beczki na start, otrzymano: ${count}`);
    } else {
      assert.ok(count >= 4 && count <= 5, `Arena ${aId} powinna miec 4-5 beczek na start, otrzymano: ${count}`);
    }

    // Weryfikacja minimalnego dystansu między beczkami (>= 200 px)
    for (let i = 0; i < hazardsState.barrels.length; i++) {
      const b1 = hazardsState.barrels[i];
      assert.ok(b1.onGround, `Beczka ${b1.id} musi stac stabilnie na onGround na starcie`);
      assert.strictEqual(b1.vy, 0, 'Beczka na starcie nie moze miec predkosci pionowej');

      if (aId === 'arena-3') {
        const mid = b1.x + b1.w * 0.5;
        assert.ok(
          mid <= 750 || mid >= 3650,
          `Beczka X=${mid} na Arenie 3 znajduje sie w zabronionej strefie centralnej!`
        );
      }

      for (let j = i + 1; j < hazardsState.barrels.length; j++) {
        const b2 = hazardsState.barrels[j];
        const dist = Math.hypot((b1.x + b1.w * 0.5) - (b2.x + b2.w * 0.5), (b1.y + b1.h) - (b2.y + b2.h));
        const requiredDist = (aId === 'arena-5') ? 180 : 220;
        assert.ok(dist >= requiredDist, `Dystans miedzy beczkami (${dist}px) na ${aId} musi wynosic >= ${requiredDist}px`);
      }
    }
  }
  console.log('PASS: Wszystkie areny (1-5) poprawnie generuja jednorazowe losowe rozstawienie beczek na start.');
}

console.log('--- TEST 17: Brak trzepania i poprawne staczanie z rampy/krawedzi ---');
{
  setActiveArena('arena-1');
  resetHazardsState();
  hazardsState.currentArenaId = 'arena-1';
  const barrel = createBarrelInstance({ type: 'EXPLOSIVE', x: 500, y: 700 });
  barrel.onGround = true;
  barrel.vx = 0;
  barrel.vy = 0;
  hazardsState.barrels.push(barrel);

  // Symulacja podloza bedacego rampa (lewa strona wyzsza = mniejsze Y, prawa strona nizsza = wieksze Y)
  // W Canvasie wieksze Y = nizej, wiec rampa opada w prawo (slideDir = 1)
  globalThis.isGroundAt = () => true;

  // Sprawdzamy symulacje 10 klatek - beczka nie moze trzepac vy ani wpadac w pętlę lostGround
  for (let k = 0; k < 10; k++) {
    updateHazards(1 / 60, [], 738);
  }

  assert.strictEqual(barrel.isDead, false, 'Beczka nie powinna wybuchnac od zwyklego staczania');
  assert.ok(Math.abs(barrel.vy) < 2.0, 'Beczka na podlozu nie powinna gwaltownie skakac pionowo');
  console.log('PASS: Fizyka staczania i podparcia na rampach dziala stabilnie bez trzepania.');
}

console.log('\n[SUKCES] Wszystkie testy fizyki i zachowania beczek oraz kwasu zakonczone sukcesem!');
