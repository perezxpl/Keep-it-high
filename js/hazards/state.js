// =========================================================================
// HAZARDS/STATE.JS - STAN, TYPY I ROZMIESZCZENIE ZAGROŻEŃ NA ARENACH
// Odpowiada za rejestr wybuchowych i toksycznych beczek oraz kałuż kwasu.
// Standard: Zero emojis, strict module safety, natywne moduły ES.
// =========================================================================

export const BARREL_TYPES = {
  EXPLOSIVE: {
    id: 'EXPLOSIVE',
    name: 'Beczka Paliwowa',
    color: '#dc2626',       // Karminowa czerwień
    rimColor: '#18181b',    // Ciemnostalowe obręcze
    hazardSign: 'FIRE',     // Piktogram płomienia
    maxHp: 25,
    radius: 155,            // Promień rażenia wybuchu (px)
    maxDamage: 95,          // Maksymalne obrażenia w epicentrum
    knockbackForce: 16.0,   // Siła odrzutu fali uderzeniowej
    screenShake: 18,
    soundType: 'EXPLOSION',
    glowColor: '#ef4444'
  },
  TOXIC: {
    id: 'TOXIC',
    name: 'Beczka Toksyczna',
    color: '#16a34a',       // Trucizna / zielony kwas
    rimColor: '#14532d',    // Ciemnozielone żebra
    hazardSign: 'SKULL',    // Piktogram czaszki / biohazard
    maxHp: 25,
    radius: 130,            // Promień fali uderzeniowej
    maxDamage: 45,          // Niższe obrażenia bezpośrednie, ale zostawia kałużę
    knockbackForce: 11.0,
    screenShake: 12,
    soundType: 'ACID_SPLASH',
    glowColor: '#22c55e',
    poolDuration: 8.0,      // Czas trwania kałuży kwasu (sekundy)
    poolRadius: 65,         // Szerokość rozlanej plamy (px)
    poolDps: 14.0           // Obrażenia na sekundę w kałuży
  },
  CRYO: {
    id: 'CRYO',
    name: 'Beczka Kriogeniczna',
    color: '#0284c7',
    rimColor: '#082f49',
    hazardSign: 'FROST',
    maxHp: 25,
    radius: 140,
    maxDamage: 55,
    knockbackForce: 13.0,
    screenShake: 14,
    soundType: 'CRYO_BURST',
    glowColor: '#38bdf8'
  },
  ORDNANCE: {
    id: 'ORDNANCE',
    name: 'Beczka Wojskowa HE',
    color: '#3f3f46',
    rimColor: '#18181b',
    hazardSign: 'BOMB',
    maxHp: 30,
    radius: 175,
    maxDamage: 110,
    knockbackForce: 18.0,
    screenShake: 22,
    soundType: 'EXPLOSION',
    glowColor: '#f59e0b'
  }
};

export const BARREL_CONFIG = {
  WIDTH: 26,
  HEIGHT: 38,
  RESPAWN_DELAY: 35.0,     // Czas do ponownego odrodzenia po wybuchu (sekundy)
  KICK_IMPULSE_X: 14.5,    // Prędkość pozioma po Spartan Kicku [E]
  KICK_IMPULSE_Y: -4.8,    // Lekkie uniesienie w powietrze przy wykopie
  SLIDE_IMPULSE_X: 12.0,   // Prędkość pozioma po wjechaniu wślizgiem
  SLIDE_IMPULSE_Y: -3.2,
  BOUNCE_RESTITUTION: 0.38,// Sprężystość odbić od ścian i podłoża
  FRICTION: 0.94           // Tarcie toczącej się beczki
};

/**
 * Predefiniowane taktyczne punkty spawnu beczek dla każdej areny
 * (Zasada: wąskie gardła, skraje pomostów, miejsca podwyższone - zero losowego chaosu)
 * Arena 5 (Tetris) ma pustą tablicę: beczki pojawiają się tam wyłącznie dynamicznie na klockach wieży!
 */
export const ARENA_BARREL_SPAWNS = {
  // Arena 1 - Soldat Night Ops / Baza Wojskowa
  'arena-1': [
    { type: 'EXPLOSIVE', x: 1040, y: 454, id: 'a1_barrel_overlook_w' }, // Wysoki pomost snajperski lewy
    { type: 'EXPLOSIVE', x: 2380, y: 454, id: 'a1_barrel_overlook_e' }, // Wysoki pomost snajperski prawy
    { type: 'EXPLOSIVE', x: 650,  y: 644, id: 'a1_barrel_gate_w' },     // Kładka podejściowa bramkowa lewa
    { type: 'EXPLOSIVE', x: 2950, y: 644, id: 'a1_barrel_gate_e' },     // Kładka podejściowa bramkowa prawa
    { type: 'EXPLOSIVE', x: 1800, y: 684, id: 'a1_barrel_center' }      // Za centralnym ołtarzem
  ],
  // Arena 2 - Toksyczna Rafineria / Sektor X
  'arena-2': [
    { type: 'TOXIC',     x: 450,  y: 384, id: 'a2_barrel_bastion_a' }, // Bastion Górny A (Lewy)
    { type: 'TOXIC',     x: 3550, y: 384, id: 'a2_barrel_bastion_b' }, // Bastion Górny B (Prawy)
    { type: 'EXPLOSIVE', x: 1750, y: 684, id: 'a2_barrel_hub_left' },  // Centralny Hub nad kwasem (skraj lewy)
    { type: 'EXPLOSIVE', x: 2250, y: 684, id: 'a2_barrel_hub_right' }, // Centralny Hub nad kwasem (skraj prawy)
    { type: 'TOXIC',     x: 2000, y: 944, id: 'a2_barrel_mid_catwalk' }// Pomost dolny
  ],
  // Arena 3 - Tajemnicza Dżungla
  'arena-3': [
    { type: 'EXPLOSIVE', x: 850,  y: 1164, id: 'a3_barrel_ledge_w' },  // Półka skalna zachodnia
    { type: 'EXPLOSIVE', x: 3550, y: 1164, id: 'a3_barrel_ledge_e' },  // Półka skalna wschodnia
    { type: 'EXPLOSIVE', x: 1600, y: 1034, id: 'a3_barrel_bridge_w' }, // Przęsło mostu drewnianego zachód
    { type: 'EXPLOSIVE', x: 2800, y: 1034, id: 'a3_barrel_bridge_e' }  // Przęsło mostu drewnianego wschód
  ],
  // Arena 4 - Obsidian Caldera (Wulkan)
  'arena-4': [
    { type: 'EXPLOSIVE', x: 920,  y: 674, id: 'a4_barrel_column_w' },  // Kolumna bazaltowa lewa
    { type: 'EXPLOSIVE', x: 2880, y: 674, id: 'a4_barrel_column_e' },  // Kolumna bazaltowa prawa
    { type: 'EXPLOSIVE', x: 1900, y: 574, id: 'a4_barrel_hanging_plat' } // Środek platformy na łańcuchach
  ],
  // Arena 5 - Prefabrykator Orbitalny (Tetris): CZYSTY SZYB (Zero stałych platform!)
  'arena-5': []
};

export const hazardsState = {
  barrels: [],
  acidPools: [],
  respawnQueue: [],
  currentArenaId: null
};

if (typeof window !== 'undefined') {
  window.hazardsBarrels = hazardsState.barrels;
}

/**
 * Tworzy nową instancję fizycznej beczki
 */
export function createBarrelInstance(spawnDef) {
  const typeDef = BARREL_TYPES[spawnDef.type] || BARREL_TYPES.EXPLOSIVE;
  const instanceId = spawnDef.id || `barrel_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  return {
    id: instanceId,
    spawnId: spawnDef.id || null,
    type: typeDef.id,
    typeDef: typeDef,
    x: spawnDef.x,
    y: spawnDef.y,
    w: BARREL_CONFIG.WIDTH,
    h: BARREL_CONFIG.HEIGHT,
    vx: 0,
    vy: 0,
    angle: 0,
    rotVel: 0,
    onGround: false,
    hp: typeDef.maxHp,
    maxHp: typeDef.maxHp,
    isDead: false,
    isExploding: false,
    explodeTimer: 0,
    fuseTimer: 0,        // Krótkie syczenie przy zniszczeniu przed detonacją (0.05-0.12s)
    lastAttacker: null,  // Gracz lub bot, który kopnął lub przestrzelił beczkę
    originalSpawn: {
      type: spawnDef.type,
      x: spawnDef.x,
      y: spawnDef.y,
      id: spawnDef.id
    }
  };
}

if (typeof window !== 'undefined') {
  window.createBarrelInstance = createBarrelInstance;
}

/**
 * Czyści wszystkie aktywne beczki i kałuże
 */
export function resetHazardsState() {
  hazardsState.barrels.length = 0;
  hazardsState.acidPools.length = 0;
  hazardsState.respawnQueue.length = 0;
}
