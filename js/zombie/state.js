// =========================================================================
// ZOMBIE/STATE.JS - STAN, KONFIGURACJA I INSTANCJE TRYBU ZOMBIE
// Odpowiada za rejestr aktywnych zombie, leżących ciał do reanimacji oraz infekcję.
// =========================================================================

export const STORAGE_KEY_ZOMBIE_MODE = 'kih_zombie_mode_v1';

export const ZOMBIE_CONFIG = {
  SPEED: 1.35,              // Powolny, człapiący chód (~35% prędkości sprintu gracza)
  MAX_HP: 100,              // Wytrzymałość zombie
  BITE_RANGE: 36,           // Zasięg ugryzienia / ataku wręcz (px)
  BITE_DAMAGE: 12,          // Obrażenia od pojedynczego ugryzienia
  BITE_COOLDOWN: 1.3,       // Czas odnowienia ataku (sekundy)
  INFECTION_DURATION: 35,   // Czas trwania infekcji (sekundy)
  INFECTION_DPS: 2.2,       // Utrata życia na sekundę podczas infekcji
  REANIMATE_DELAY: 2.8,     // Czas leżenia ciała przed powstaniem jako zombie (sekundy)
  REVIVE_DELAY: 4.0,        // Czas po powaleniu bez dekapitacji przed ponownym wstaniem (sekundy)
  MAX_ZOMBIES: 35           // Limit jednoczesnych zombie na arenie
};

function getStoredZombieMode() {
  try {
    const val = localStorage.getItem(STORAGE_KEY_ZOMBIE_MODE);
    return val === 'true' || val === 'on';
  } catch (_) {
    return false;
  }
}

export const zombieState = {
  enabled: getStoredZombieMode(),
  zombies: [],
  corpses: [],
  stats: {
    totalSpawned: 0,
    killed: 0,
    decapitations: 0
  }
};

/**
 * Zwraca czy plaga zombie jest aktualnie włączona
 */
export function isZombieModeActive() {
  return !!zombieState.enabled;
}

/**
 * Przełącza stan aktywności trybu zombie i zapisuje w localStorage
 */
export function setZombieModeActive(active) {
  zombieState.enabled = !!active;
  try {
    localStorage.setItem(STORAGE_KEY_ZOMBIE_MODE, zombieState.enabled ? 'true' : 'false');
  } catch (_) {}
  if (!zombieState.enabled) {
    resetZombieState();
  }
}

/**
 * Czyści aktywne jednostki i zwłoki
 */
export function resetZombieState() {
  zombieState.zombies.length = 0;
  zombieState.corpses.length = 0;
}

/**
 * Tworzy nową instancję wrogiego zombie NPC
 */
export function createZombieInstance(x, y, facing = 1, options = {}) {
  const instanceId = `zombie_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  return {
    id: instanceId,
    name: 'ZOMBIE',
    isZombie: true,
    isBot: true,
    team: 'INFECTED',      // Neutralna wroga frakcja atakująca wszystkich

    x: x - 12,
    y: y - 70,
    w: 24,
    h: 70,
    vx: 0,
    vy: 0,
    facing: facing || 1,

    hp: ZOMBIE_CONFIG.MAX_HP,
    maxHp: ZOMBIE_CONFIG.MAX_HP,

    isDead: false,
    hasHead: true,
    decapitated: false,
    severedHead: null,
    neckFountainTimer: 0,
    bleedTimer: 0,

    isAcidDying: false,
    acidDeath: { active: false, timer: 0, dissolved: false },

    // Pancerz (zombie nie nosi kamizelek, ale właściwości wymagane dla zgodności z balistyką)
    hasVest: false,
    vestHp: 0,
    hasHelmet: false,

    // Cykl życia i animacja
    riseTimer: options.skipRise ? 0 : 1.4, // Czas wstawania z ziemi
    reviveTimer: 0,                        // Czas do powstania po powaleniu
    attackCooldown: 0.6,
    attackAnim: 0,
    walkAnim: Math.random() * 10,
    twitchTimer: 0,

    // Cechy wizualne nieumarłego
    visuals: {
      skinColor: options.skinColor || (Math.random() < 0.5 ? '#577259' : '#4d6850'),
      decayColor: '#344634',
      eyeColor: '#facc15',                 // Świecące, żółto-martwe oczy
      bloodSplatter: true,
      tatteredClothes: true,
      originalName: options.originalName || 'POLEGŁY OPERATOR',
      shirtColor: options.shirtColor || '#27272a',
      pantsColor: options.pantsColor || '#18181b',
      hairStyle: options.hairStyle || 'buzzcut',
      hairColor: options.hairColor || '#09090b'
    },

    // Kończyny (zgodność z silnikiem uszkodzeń)
    dismembered: {
      armFront: false,
      armBack: false,
      legFront: false,
      legBack: false
    },

    // Wymiary kończyn
    upperArmLen: 12,
    forearmLen: 12,
    thighLen: 16,
    shinLen: 16
  };
}

/**
 * Rejestruje leżące ciało do późniejszej reanimacji
 */
export function registerCorpseForReanimation(char, groundY) {
  if (!zombieState.enabled) return;
  if (!char) return;

  // Ciała pozbawione głowy (decapitated) NIGDY nie wstają jako zombie
  if (char.decapitated || !char.hasHead || char.isGibbed || (char.acidDeath && char.acidDeath.dissolved)) {
    return;
  }

  // Zabezpieczenie przed przekroczeniem limitu zombie na arenie
  if (zombieState.zombies.length + zombieState.corpses.length >= ZOMBIE_CONFIG.MAX_ZOMBIES) {
    return;
  }

  const corpseX = char.ragdoll?.pelvis?.x ?? (char.x + (char.w || 24) * 0.5);
  const corpseY = char.ragdoll?.pelvis?.y ?? (char.y + (char.h || 70) - 10);

  zombieState.corpses.push({
    id: `corpse_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    x: corpseX,
    y: corpseY,
    facing: char.facing || 1,
    groundY: groundY || (char.y + 70),
    timer: ZOMBIE_CONFIG.REANIMATE_DELAY,
    twitch: 0,
    decapitated: false,
    hasHead: true,
    originalName: char.name || (char.isBot ? 'BOT' : 'GRACZ'),
    visuals: {
      shirtColor: char.visuals?.shirtColor || '#3f3f46',
      pantsColor: char.visuals?.pantsColor || '#27272a',
      hairStyle: char.hairStyle || 'buzzcut',
      hairColor: char.hairColor || '#18181b'
    }
  });
}
