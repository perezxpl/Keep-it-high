// =========================================================================
// MENUFIGHT/STATE.JS - STAN DEMONSTRACYJNEJ WALKI W TLE MENU GŁÓWNEGO
// 3 boty bojowe w intensywnym starciu FFA (AK-47, RPG-7, Nano-Saber)
// =========================================================================

import { createPlayerInstance } from '../player/state.js';
import { CLASSES } from '../classes/index.js';
import { WEAPONS } from '../weapons/transform.js';

export const menuFightState = {
  active: false,
  initialized: false,
  arenaId: 'ARENA_1',
  time: 0,
  respawnTimers: [0, 0, 0]
};

export const MENU_SPAWN_POINTS = [
  { x: 950,  y: 760, facing: 1 },   // Lewa platforma
  { x: 2350, y: 760, facing: -1 },  // Prawa platforma
  { x: 1650, y: 640, facing: 1 },   // Centralna wysoka kładka
  { x: 1280, y: 920, facing: 1 },   // Parter lewa flanka
  { x: 2020, y: 920, facing: -1 }   // Parter prawa flanka
];

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
    facing: -1,
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
    facing: 1,
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

export function createMenuBotInstance(index = 0) {
  const profile = MENU_BOT_PROFILES[index % MENU_BOT_PROFILES.length];
  const botClass = (CLASSES && CLASSES[profile.classKey]) ? CLASSES[profile.classKey] : (CLASSES?.STRIKER || CLASSES?.RAPTOR);
  const spawn = MENU_SPAWN_POINTS[profile.spawnIdx % MENU_SPAWN_POINTS.length];

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

    hp: botClass?.stats?.hp || 100,
    maxHp: botClass?.stats?.hp || 100,
    hasVest: true,
    vestHp: 60,
    vestMaxHp: 60,
    hasHelmet: true,
    helmetHits: 1,
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
    jetFuel: botClass?.stats?.jetMax || 100,
    jetMax: botClass?.stats?.jetMax || 100,

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

export function resetMenuBot(bot, spawnIdx = null) {
  if (!bot) return;
  const sIdx = (typeof spawnIdx === 'number')
    ? (spawnIdx % MENU_SPAWN_POINTS.length)
    : Math.floor(Math.random() * MENU_SPAWN_POINTS.length);
  const spawn = MENU_SPAWN_POINTS[sIdx];

  bot.x = spawn.x + (Math.random() - 0.5) * 40;
  bot.y = spawn.y;
  bot.vx = 0;
  bot.vy = 0;
  bot.facing = spawn.facing || 1;

  bot.hp = bot.maxHp || 100;
  bot.hasVest = true;
  bot.vestHp = 60;
  bot.hasHelmet = true;
  bot.helmetHits = 1;
  bot.isDead = false;
  bot.respawnTimer = 0;
  bot.deathTilt = 0;
  bot.deathRotVel = 0;
  bot.isSettled = false;
  bot.pelvisY = 0;

  bot.isHolstered = false;
  bot.holsterWeight = 0.0;
  bot.isReloading = false;
  bot.reloadTimer = 0;
  bot.shootCooldown = 0;

  bot.jetFuel = bot.jetMax || 100;
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
