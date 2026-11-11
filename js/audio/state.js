// =============================================================================
// JS/AUDIO/STATE.JS - KONFIGURACJA, KATALOG DŹWIĘKÓW I WSPÓŁDZIELONY STAN AUDIO
// =============================================================================

export const AUDIO_CONFIG = {
  MANIFEST_URL: './assets/audio/manifest.json',
  DEFAULT_BASE_PATH: './assets/audio/',
  MAX_ACTIVE_VOICES: 28,
  DEFAULT_HEARING_RADIUS: 1850,
  PAN_MAX: 0.88
};

export const WEAPON_FIRE_SOUND_MAP = {
  AK47: 'weapon_ak47',
  SHOTGUN: 'weapon_shotgun',
  SNIPER: 'weapon_sniper',
  GLOCK: 'weapon_glock',
  REVOLVER: 'weapon_revolver',
  SAWED_OFF: 'weapon_sawed_off',
  RPG7: 'weapon_rpg7'
};

/**
 * Katalog wszystkich identyfikatorów dźwiękowych (Etap 1 + UI + Syrena).
 * Każdy wpis może zostać nadpisany zewnętrznym plikiem w assets/audio/manifest.json.
 */
export const SOUND_CATALOG = {
  // --- Uzbrojenie ---
  weapon_ak47: { bus: 'sfx', volume: 0.44, pitchJitter: 0.06, cooldownMs: 40, spatial: true, maxDistance: 1950 },
  weapon_shotgun: { bus: 'sfx', volume: 0.62, pitchJitter: 0.05, cooldownMs: 80, spatial: true, maxDistance: 2050 },
  weapon_pump: { bus: 'sfx', volume: 0.34, pitchJitter: 0.05, cooldownMs: 70, spatial: true, maxDistance: 1100 },
  weapon_sniper: { bus: 'sfx', volume: 0.72, pitchJitter: 0.04, cooldownMs: 120, spatial: true, maxDistance: 2500 },
  weapon_glock: { bus: 'sfx', volume: 0.42, pitchJitter: 0.07, cooldownMs: 45, spatial: true, maxDistance: 1750 },
  weapon_revolver: { bus: 'sfx', volume: 0.58, pitchJitter: 0.05, cooldownMs: 70, spatial: true, maxDistance: 2100 },
  weapon_sawed_off: { bus: 'sfx', volume: 0.64, pitchJitter: 0.05, cooldownMs: 85, spatial: true, maxDistance: 2000 },
  weapon_rpg7: { bus: 'sfx', volume: 0.68, pitchJitter: 0.04, cooldownMs: 140, spatial: true, maxDistance: 2300 },
  weapon_melee_swing: { bus: 'sfx', volume: 0.36, pitchJitter: 0.09, cooldownMs: 60, spatial: true, maxDistance: 1000 },
  weapon_melee_hit: { bus: 'sfx', volume: 0.52, pitchJitter: 0.08, cooldownMs: 55, spatial: true, maxDistance: 1250 },
  weapon_dry_fire: { bus: 'sfx', volume: 0.38, pitchJitter: 0.05, cooldownMs: 90, spatial: true, maxDistance: 900 },
  weapon_reload_start: { bus: 'sfx', volume: 0.36, pitchJitter: 0.04, cooldownMs: 120, spatial: true, maxDistance: 950 },
  weapon_reload_end: { bus: 'sfx', volume: 0.40, pitchJitter: 0.04, cooldownMs: 120, spatial: true, maxDistance: 1000 },

  // --- Granaty i Eksplozje ---
  grenade_throw: { bus: 'sfx', volume: 0.40, pitchJitter: 0.07, cooldownMs: 90, spatial: true, maxDistance: 1200 },
  grenade_bounce: { bus: 'sfx', volume: 0.30, pitchJitter: 0.10, cooldownMs: 65, spatial: true, maxDistance: 1300 },
  explosion_grenade: { bus: 'sfx', volume: 0.78, pitchJitter: 0.06, cooldownMs: 70, spatial: true, maxDistance: 2600 },
  explosion_rpg: { bus: 'sfx', volume: 0.85, pitchJitter: 0.05, cooldownMs: 70, spatial: true, maxDistance: 2800 },
  explosion_heavy: { bus: 'sfx', volume: 0.88, pitchJitter: 0.05, cooldownMs: 60, spatial: true, maxDistance: 2800 },
  explosion_toxic: { bus: 'sfx', volume: 0.78, pitchJitter: 0.06, cooldownMs: 70, spatial: true, maxDistance: 2600 },

  // --- Trafienia, Pancerz i Rykoszety ---
  hit_flesh: { bus: 'sfx', volume: 0.42, pitchJitter: 0.10, cooldownMs: 42, spatial: true, maxDistance: 1350 },
  hit_headshot: { bus: 'sfx', volume: 0.56, pitchJitter: 0.07, cooldownMs: 50, spatial: true, maxDistance: 1500 },
  hit_armor: { bus: 'sfx', volume: 0.44, pitchJitter: 0.09, cooldownMs: 45, spatial: true, maxDistance: 1400 },
  hit_helmet_break: { bus: 'sfx', volume: 0.62, pitchJitter: 0.06, cooldownMs: 60, spatial: true, maxDistance: 1700 },
  hit_shield: { bus: 'sfx', volume: 0.40, pitchJitter: 0.08, cooldownMs: 60, spatial: true, maxDistance: 1300 },
  hit_ricochet: { bus: 'sfx', volume: 0.28, pitchJitter: 0.15, cooldownMs: 55, spatial: true, maxDistance: 1450 },

  // --- Klasy i Ruch Gracza ---
  jetpack_loop: { bus: 'sfx', volume: 0.28, pitchJitter: 0.0, cooldownMs: 0, spatial: true, maxDistance: 1500, loop: true },
  rocket_boots_dash: { bus: 'sfx', volume: 0.50, pitchJitter: 0.07, cooldownMs: 80, spatial: true, maxDistance: 1650 },
  enforcer_piston_jump: { bus: 'sfx', volume: 0.58, pitchJitter: 0.05, cooldownMs: 110, spatial: true, maxDistance: 1850 },
  enforcer_ground_slam: { bus: 'sfx', volume: 0.74, pitchJitter: 0.05, cooldownMs: 110, spatial: true, maxDistance: 2200 },
  player_jump: { bus: 'sfx', volume: 0.28, pitchJitter: 0.08, cooldownMs: 80, spatial: true, maxDistance: 1050 },
  player_land: { bus: 'sfx', volume: 0.34, pitchJitter: 0.10, cooldownMs: 75, spatial: true, maxDistance: 1150 },
  player_death: { bus: 'sfx', volume: 0.50, pitchJitter: 0.09, cooldownMs: 80, spatial: true, maxDistance: 1650 },
  gore_gib: { bus: 'sfx', volume: 0.52, pitchJitter: 0.10, cooldownMs: 65, spatial: true, maxDistance: 1600 },

  // --- Piłka i Bramki ---
  ball_kick: { bus: 'sfx', volume: 0.56, pitchJitter: 0.08, cooldownMs: 55, spatial: true, maxDistance: 1800 },
  ball_bounce: { bus: 'sfx', volume: 0.36, pitchJitter: 0.10, cooldownMs: 75, spatial: true, maxDistance: 1400 },
  ball_post_clang: { bus: 'sfx', volume: 0.60, pitchJitter: 0.06, cooldownMs: 90, spatial: true, maxDistance: 2100 },
  goal_horn: { bus: 'sfx', volume: 0.65, pitchJitter: 0.01, cooldownMs: 600, spatial: false, allowInAnyState: false },

  // --- Arena 2 i UI ---
  acid_siren: { bus: 'sfx', volume: 0.55, pitchJitter: 0.0, cooldownMs: 1200, spatial: false, allowInAnyState: false },
  ui_click: { bus: 'ui', volume: 0.40, pitchJitter: 0.02, cooldownMs: 25, spatial: false, allowInAnyState: true },
  ui_hover: { bus: 'ui', volume: 0.22, pitchJitter: 0.02, cooldownMs: 25, spatial: false, allowInAnyState: true },
  ui_pause: { bus: 'ui', volume: 0.45, pitchJitter: 0.0, cooldownMs: 50, spatial: false, allowInAnyState: true },
  ui_resume: { bus: 'ui', volume: 0.45, pitchJitter: 0.0, cooldownMs: 50, spatial: false, allowInAnyState: true },
  ui_test_tone: { bus: 'sfx', volume: 0.48, pitchJitter: 0.0, cooldownMs: 80, spatial: false, allowInAnyState: true }
};

/**
 * Współdzielony stan silnika audio (bez prymitywów export let między modułami ES).
 */
export const audioState = {
  ctx: null,
  masterGain: null,
  sfxGain: null,
  uiGain: null,
  compressor: null,
  noiseBuffer: null,
  unlockListenersBound: false,
  hasUserGesture: false,
  initialized: false,

  // Synchronizowane ustawienia użytkownika z uiManager
  masterVolume: 0.80,
  sfxVolume: 0.85,
  muted: false,
  acidSirenEnabled: true,

  // Aktualny stan ekranu gry ('MENU' wycisza walkę w tle, 'PLAYING' włącza dźwięki rozgrywki)
  gameState: 'MENU',

  // Ochrona przed przesterowaniem i spamem klatek
  activeVoiceCount: 0,
  lastPlayedAt: new Map(),

  // Zewnętrzne pliki audio z assets/audio/manifest.json i nadpisania w locie
  manifestLoaded: false,
  manifestLoading: false,
  manifestBasePath: AUDIO_CONFIG.DEFAULT_BASE_PATH,
  manifestOverrides: new Map(),
  runtimeOverrides: new Map(),
  decodedBuffers: new Map(),
  loadingUrls: new Map(),
  failedUrls: new Set(),

  // Aktywne głosy ciągłe (np. jetpack) i wykrywanie krawędzi stanów postaci
  jetpackVoices: new Map(),
  entityTrackers: new WeakMap()
};
