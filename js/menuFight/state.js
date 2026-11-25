// =========================================================================
// MENUFIGHT/STATE.JS - STAN DEMONSTRACYJNEJ WALKI W TLE MENU GŁÓWNEGO
// 3 boty bojowe o podwyższonej odporności (AK-47, RPG-7, Nano-Saber)
// Dynamiczna rotacja aren: ARENA 2 -> ARENA 3 -> ARENA 5 -> ARENA 3 -> ARENA 2
// Płynne przejścia w bok ekranu (Horizontal Slide Transition)
// ZERO ctx.shadowBlur, stałe 60 FPS
// =========================================================================

import { createPlayerInstance } from '../player/state.js';
import { CLASSES } from '../classes/index.js';
import { WEAPONS } from '../weapons/transform.js';

export const ARENA_ROTATION = ['ARENA_2', 'ARENA_3', 'ARENA_5'];

export const ARENA_METADATA = {
  ARENA_2: {
    name: 'SEKTOR 02 // TOKSYCZNA RAFINERIA',
    shortTag: 'C2 // SEKTOR 02 (RAFINERIA)',
    minX: 1560,
    maxX: 2440,
    deathY: 1500,
    safeFloorY: 720
  },
  ARENA_3: {
    name: 'SEKTOR 03 // MILITARNA DŻUNGLA',
    shortTag: 'C3 // SEKTOR 03 (DŻUNGLA)',
    minX: 1750,
    maxX: 2650,
    deathY: 1350,
    safeFloorY: 1000
  },
  ARENA_5: {
    name: 'SEKTOR 05 // PREFABRYKATOR ORBITALNY',
    shortTag: 'C5 // SEKTOR 05 (WIEŻA)',
    minX: 300,
    maxX: 1300,
    deathY: 1450,
    safeFloorY: 1200
  }
};

export const ARENA_SPAWN_POINTS = {
  ARENA_2: [
    { x: 1800, y: 648, facing: 1 },   // Środkowa platforma techniczna - lewa flanka
    { x: 2000, y: 648, facing: -1 },  // Środkowa platforma techniczna - centrum
    { x: 2200, y: 648, facing: -1 }   // Środkowa platforma techniczna - prawa flanka
  ],
  ARENA_3: [
    { x: 1980, y: 928, facing: 1 },   // Most na rzece - lewa flanka
    { x: 2200, y: 928, facing: 1 },   // Most na rzece - środek
    { x: 2420, y: 928, facing: -1 }   // Most na rzece - prawa flanka
  ],
  ARENA_5: [
    { x: 600, y: 1128, facing: 1 },   // Lewy sektor płyty fundamentowej
    { x: 800, y: 1128, facing: -1 },  // Centralny sektor płyty fundamentowej
    { x: 1000, y: 1128, facing: 1 }   // Prawy sektor płyty fundamentowej
  ]
};

// Kompatybilność wsteczna
export const MENU_SPAWN_POINTS = ARENA_SPAWN_POINTS.ARENA_2;

export const menuFightState = {
  active: false,
  initialized: false,
  arenaId: 'ARENA_2',
  time: 0,
  arenaTime: 0,
  rotationIndex: 0,
  rotationDir: 1, // 1: 2->3->5 (w prawo), -1: 5->3->2 (w lewo)
  transitionPhase: 'NONE', // 'NONE', 'SLIDE'
  transitionTimer: 0,
  transitionDuration: 2.2, // 2.2s kinowe, płynne przejście w bok ekranu
  slideDir: 1, // 1: w lewo (nowa mapa wjeżdża z prawej), -1: w prawo
  targetArenaId: null,
  respawnTimers: [0, 0, 0]
};

const MENU_BOT_PROFILES = [
  {
    name: 'SGT. STRIKER',
    team: 'CYAN',
    classKey: 'STRIKER',
    weapon: WEAPONS.AK47,
    facing: 1,
    spawnIdx: 0,
    visuals: {
      hasHelmet: true,
      helmetColor: '#1e293b',
      helmetVisorGlow: '#00e5ff',
      hasVest: true,
      vestColor: '#0f172a',
      torsoStyle: 'long_sleeve',
      torsoColor: '#1e293b',
      pantsStyle: 'cargo_long',
      pantsColor: '#0f172a',
      shoesStyle: 'combat_boots',
      shoesColor: '#090d16',
      jetpackStyle: 'striker',
      jetpackColor: '#00e5ff'
    }
  },
  {
    name: 'COL. ENFORCER',
    team: 'ORANGE',
    classKey: 'ENFORCER',
    weapon: WEAPONS.RPG7,
    facing: 1,
    spawnIdx: 1,
    visuals: {
      hasHelmet: true,
      helmetColor: '#331e11',
      helmetVisorGlow: '#f97316',
      hasVest: true,
      vestColor: '#2b180d',
      maskStyle: 'ballistic',
      maskColor: '#1a1009',
      torsoStyle: 'short_sleeve',
      torsoColor: '#451a03',
      pantsStyle: 'cargo_long',
      pantsColor: '#2b180d',
      shoesStyle: 'combat_boots',
      shoesColor: '#170e08',
      jetpackStyle: 'enforcer',
      jetpackColor: '#f97316'
    }
  },
  {
    name: 'CYBER REAPER',
    team: 'ROGUE',
    classKey: 'AERO',
    weapon: WEAPONS.NANO_SABER || WEAPONS.MACHETE,
    facing: -1,
    spawnIdx: 2,
    visuals: {
      hasHelmet: false,
      headgearStyle: 'bandana',
      headgearColor: '#090d16',
      maskStyle: 'ghost',
      maskColor: '#00e5ff',
      hasVest: true,
      vestColor: '#0f172a',
      torsoStyle: 'long_sleeve',
      torsoColor: '#0a0e17',
      pantsStyle: 'cargo_long',
      pantsColor: '#0a0e17',
      shoesStyle: 'sneakers',
      shoesColor: '#00e5ff',
      jetpackStyle: 'aero',
      jetpackColor: '#00e5ff'
    }
  }
];

export function createMenuBotInstance(index = 0, arenaId = null) {
  const profile = MENU_BOT_PROFILES[index % MENU_BOT_PROFILES.length];
  const botClass = (CLASSES && CLASSES[profile.classKey]) ? CLASSES[profile.classKey] : (CLASSES?.STRIKER || CLASSES?.RAPTOR);
  const targetArena = arenaId || menuFightState.arenaId || 'ARENA_2';
  const spawns = ARENA_SPAWN_POINTS[targetArena] || ARENA_SPAWN_POINTS.ARENA_2;
  const spawn = spawns[profile.spawnIdx % spawns.length];

  const instance = createPlayerInstance({
    isBot: true,
    isMenuBot: true,
    active: true,
    frozen: false,
    team: profile.team,
    facing: profile.facing,
    x: spawn.x,
    y: spawn.y,
    w: 24,
    h: 70,
    dropThroughTimer: 0,
    currentClass: botClass,
    name: profile.name,
    id: `menu_bot_${index + 1}`,
    botIndex: index,

    // Znacząco podwyższona wytrzymałość, by boty toczyły długie, widowiskowe starcia
    hp: 250,
    maxHp: 250,
    hasVest: true,
    vestHp: 150,
    vestMaxHp: 150,
    hasHelmet: true,
    helmetHits: 3,
    currentWeapon: profile.weapon,
    isHolstered: false,
    holsterWeight: 0.0,
    shootCooldown: 0,
    isDead: false,
    respawnTimer: 0,
    deathTilt: 0,
    deathRotVel: 0,
    isSettled: false,
    pelvisY: 0,
    burstShotsRemaining: 0,
    burstPauseTimer: 0,
    grenadeCooldown: 0,

    isJetpacking: false,
    jetpackPower: 0,
    jetFuel: 100,
    jetMax: 100,

    botKeys: {
      left: false,
      right: false,
      up: false,
      down: false,
      space: false,
      slide: false
    }
  });

  // Aplikacja unikalnego militarnego wyglądu
  if (instance.customVisuals) {
    Object.assign(instance.customVisuals, profile.visuals);
  }

  return instance;
}

export function resetMenuBot(bot, spawnIdx = null, arenaId = null) {
  if (!bot) return;
  const targetArena = arenaId || menuFightState.arenaId || 'ARENA_2';
  const spawns = ARENA_SPAWN_POINTS[targetArena] || ARENA_SPAWN_POINTS.ARENA_2;
  const sIdx = (typeof spawnIdx === 'number')
    ? (spawnIdx % spawns.length)
    : Math.floor(Math.random() * spawns.length);
  const spawn = spawns[sIdx];

  bot.x = spawn.x + (Math.random() - 0.5) * 30;
  bot.y = spawn.y;
  bot.vx = 0;
  bot.vy = 0;
  bot.facing = spawn.facing || 1;

  bot.hp = 250;
  bot.maxHp = 250;
  bot.hasVest = true;
  bot.vestHp = 150;
  bot.vestMaxHp = 150;
  bot.hasHelmet = true;
  bot.helmetHits = 3;
  bot.isDead = false;
  bot.burnTimer = 0;
  bot.burnIntensity = 0;
  bot.burnAttacker = null;
  bot.respawnTimer = 0;
  bot.deathTilt = 0;
  bot.deathRotVel = 0;
  bot.isSettled = false;
  bot.pelvisY = 0;
  bot.isAcidDying = false;
  if (bot.acidDeath) {
    bot.acidDeath.active = false;
    bot.acidDeath.timer = 0;
    bot.acidDeath.dissolved = false;
  }

  bot.isHolstered = false;
  bot.holsterWeight = 0.0;
  bot.isReloading = false;
  bot.reloadTimer = 0;
  bot.shootCooldown = 0;

  bot.jetFuel = 100;
  bot.isJetpacking = false;

  if (bot.ammo && bot.currentWeapon) {
    bot.ammo[bot.currentWeapon.id] = {
      currentAmmo: 99,
      reserveAmmo: 999,
      isReloading: false
    };
  }

  if (bot.botKeys) {
    bot.botKeys.left = false;
    bot.botKeys.right = false;
    bot.botKeys.up = false;
    bot.botKeys.down = false;
    bot.botKeys.space = false;
    bot.botKeys.slide = false;
  }
}

export const menuBots = [
  createMenuBotInstance(0),
  createMenuBotInstance(1),
  createMenuBotInstance(2)
];
