// =========================================================================
// ZOMBIE/STATE.JS - STAN, KONFIGURACJA I INSTANCJE TRYBU ZOMBIE
// Odpowiada za rejestr aktywnych zombie, leżących ciał do reanimacji oraz infekcję.
// =========================================================================

import { DEFAULT_VISUALS } from '../player/hair.js';
import { CLASSES } from '../classes/index.js';

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

const FALLBACK_OPERATOR_PRESETS = [
  {
    name: 'POLEGŁY SZTURMOWIEC',
    classKey: 'STRIKER',
    visuals: {
      torsoStyle: 'short_sleeve',
      torsoColor: '#18181b',
      pantsStyle: 'cargo_long',
      pantsColor: '#27272a',
      shoesStyle: 'combat_boots',
      hairStyle: 'buzzcut',
      headgearStyle: 'cap_forward',
      headgearColor: '#18181b',
      hasVest: true,
      vestColor: '#18181b'
    }
  },
  {
    name: 'POLEGŁY ZWIADOWCA',
    classKey: 'RAPTOR',
    visuals: {
      torsoStyle: 'long_sleeve',
      torsoColor: '#283618',
      pantsStyle: 'cargo_long',
      pantsColor: '#1b2a1a',
      shoesStyle: 'combat_boots',
      hairStyle: 'military_fade',
      headgearStyle: 'beret',
      headgearColor: '#283618',
      hasHelmet: true,
      helmetColor: '#283618'
    }
  },
  {
    name: 'POLEGŁY ENFORCER',
    classKey: 'ENFORCER',
    visuals: {
      torsoStyle: 'sleeveless',
      torsoColor: '#18181b',
      pantsStyle: 'cargo_long',
      pantsColor: '#18181b',
      shoesStyle: 'combat_boots',
      hairStyle: 'buzzcut',
      headgearStyle: 'marcus_bandana',
      headgearColor: '#18181b',
      hasVest: true,
      vestColor: '#27272a'
    }
  }
];

/**
 * Przekształca bazowy zestaw wizualny poległego operatora w lekko podgniłą, zakrwawioną wersję nieumarłego:
 * - zachowuje w 100% oryginalny mundur, kamuflaż, fason spodni, buty, kamizelkę, hełm, fryzurę i zarost
 * - nadaje skórze ziemisto-oliwkowy, blady odcień martwicy ("lekko podgnita")
 * - dodaje żółte martwe oczy, zbroczone krwią usta i dłonie oraz plamy krwi na mundurze ("zakrwawiona")
 */
export function createUndeadVisuals(baseVisuals = {}) {
  const v = {
    ...DEFAULT_VISUALS,
    ...baseVisuals
  };

  return {
    ...v,
    // Martwicza, ziemisto-oliwkowa podgniła skóra (necrotic cadaverous skin)
    skinLight: '#a3b89f',
    skinMid: '#788f75',
    skinDark: '#3f533c',
    skinBack: '#546751',

    // Cechy fizjonomiczne nieumarłego
    isZombieVisuals: true,
    eyeColor: '#facc15',
    eyeGlow: '#fef08a',
    bloodSplatter: true,

    // Zachowane oryginalne barwy munduru i kamuflażu poległego operatora
    jerseyFront0: v.jerseyFront0,
    jerseyFront1: v.jerseyFront1,
    jerseyFront2: v.jerseyFront2,
    jerseyFront3: v.jerseyFront3,
    jerseyBack0: v.jerseyBack0,
    jerseyBack1: v.jerseyBack1,
    jerseyBack2: v.jerseyBack2,
    jerseyStripe: v.jerseyStripe,

    shortsColor0: v.shortsColor0,
    shortsColor1: v.shortsColor1,
    shortsColor2: v.shortsColor2,

    armColorFront: v.armColorFront,
    armColorBack: v.armColorBack,
    legThighFront: v.legThighFront,
    legShinFront: v.legShinFront,
    legThighBack: v.legThighBack,
    legShinBack: v.legShinBack,

    bootColor: v.bootColor,
    bootBack: v.bootBack,
    bootAccent: v.bootAccent,

    hairStyle: v.hairStyle,
    hairColor: v.hairColor,
    beardStyle: v.beardStyle,
    beardColor: v.beardColor,
    headgearStyle: v.headgearStyle,
    headgearColor: v.headgearColor,
    maskStyle: v.maskStyle,
    maskColor: v.maskColor,
    torsoStyle: v.torsoStyle,
    torsoColor: v.torsoColor,
    pantsStyle: v.pantsStyle,
    pantsColor: v.pantsColor,
    shoesStyle: v.shoesStyle,
    shoesColor: v.shoesColor,

    hasVest: v.hasVest,
    vestColor: v.vestColor,
    vestStyle: v.vestStyle,
    hasHelmet: v.hasHelmet,
    helmetColor: v.helmetColor,
    helmetStyle: v.helmetStyle
  };
}

/**
 * Tworzy nową instancję wrogiego zombie NPC zachowującego model i tożsamość poległego operatora
 */
export function createZombieInstance(x, y, facing = 1, options = {}) {
  const instanceId = `zombie_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  let baseVisuals = options.charVisuals;
  let zClass = options.charClass;
  let origName = options.originalName;

  if (!baseVisuals) {
    const preset = FALLBACK_OPERATOR_PRESETS[Math.floor(Math.random() * FALLBACK_OPERATOR_PRESETS.length)];
    baseVisuals = {
      ...DEFAULT_VISUALS,
      ...(CLASSES[preset.classKey]?.visuals || {}),
      ...preset.visuals
    };
    zClass = CLASSES[preset.classKey] || CLASSES.STRIKER;
    origName = preset.name;
  }

  const undeadVisuals = options.customVisuals || createUndeadVisuals(baseVisuals);
  const zBody = options.charBody || (zClass?.body ? { ...zClass.body } : {
    w: 24, h: 70, thighLen: 25, shinLen: 24, upperArmLen: 14, forearmLen: 13
  });

  const f = facing || 1;

  return {
    id: instanceId,
    name: origName ? `ZOMBIE [${origName}]` : 'ZOMBIE',
    originalName: origName || 'POLEGŁY OPERATOR',
    isZombie: true,
    isBot: true,
    active: true,          // Flaga aktywności dla silnika kolizji i balistyki
    team: 'INFECTED',      // Neutralna wroga frakcja atakująca wszystkich

    x: x - (zBody.w || 24) * 0.5,
    y: y - (zBody.h || 70),
    w: zBody.w || 24,
    h: zBody.h || 70,
    vx: 0,
    vy: 0,
    knockbackVx: 0,
    knockbackVy: 0,
    hitStunTimer: 0,
    onGround: true,
    facing: f,
    yaw: (f < 0 ? Math.PI : 0),

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

    // Pancerz i wyposażenie
    hasVest: !!baseVisuals.hasVest,
    vestHp: 0,
    hasHelmet: !!baseVisuals.hasHelmet,
    currentWeapon: null,
    isWeaponHolstered: true,

    // Klasa i anatomia
    currentClass: zClass || CLASSES.STRIKER,
    charClass: zClass || CLASSES.STRIKER,
    body: zBody,
    charBody: zBody,
    thighLen: zBody.thighLen || 25,
    shinLen: zBody.shinLen || 24,
    upperArmLen: zBody.upperArmLen || 14,
    forearmLen: zBody.forearmLen || 13,

    // Cykl życia i animacja
    riseTimer: options.skipRise ? 0 : 1.4, // Czas wstawania z ziemi
    reviveTimer: 0,                        // Czas do powstania po powaleniu
    downedHp: 60,                          // Wytrzymałość powalonego ciała przed rozszarpaniem
    maxDownedHp: 60,
    jumpCooldown: 0,                       // Ochrona przed spamem skoków
    decayTimer: 0,                         // Czas rozkładu po permanentnej dekapitacji
    attackCooldown: 0.6,
    attackAnim: 0,
    walkAnim: Math.random() * 10,
    twitchTimer: 0,

    // Cechy wizualne
    charVisuals: baseVisuals,
    customVisuals: undeadVisuals,
    visuals: undeadVisuals,
    _cachedVisuals: undeadVisuals,
    _visualsDirty: false,

    // Kończyny (zgodność z silnikiem uszkodzeń)
    dismembered: {
      armFront: false,
      armBack: false,
      legFront: false,
      legBack: false
    }
  };
}

/**
 * Rejestruje leżące ciało do późniejszej reanimacji
 */
export function registerCorpseForReanimation(char, surfaceY) {
  if (!zombieState.enabled) return;
  if (!char) return;

  // Ciała pozbawione głowy (decapitated) oraz zmiażdżone (squashed/crushed/gibbed) NIGDY nie wstają jako zombie
  if (char.isSquashed || char.isCrushed || char.isGibbed || char.decapitated || !char.hasHead || (char.acidDeath && char.acidDeath.dissolved)) {
    return;
  }

  // Zabezpieczenie przed przekroczeniem limitu zombie na arenie
  if (zombieState.zombies.length + zombieState.corpses.length >= ZOMBIE_CONFIG.MAX_ZOMBIES) {
    return;
  }

  const corpseX = char.ragdoll?.pelvis?.x ?? (char.x + (char.w || 24) * 0.5);
  const floorY = (typeof surfaceY === 'number' && surfaceY < 1500 && surfaceY !== Infinity)
    ? surfaceY
    : (char.y + (char.h || 70));

  const rawVisuals = {
    ...DEFAULT_VISUALS,
    ...(char.currentClass?.visuals || {}),
    ...(char._cachedVisuals || {}),
    ...(char.customVisuals || {}),
    ...(char.visuals || {})
  };

  const undeadVisuals = createUndeadVisuals(rawVisuals);
  const charClass = char.currentClass || CLASSES.STRIKER || null;
  const charBody = char.body ? { ...char.body } : (charClass?.body ? { ...charClass.body } : {
    w: 24, h: 70, thighLen: 25, shinLen: 24, upperArmLen: 14, forearmLen: 13
  });

  const facing = char.facing || 1;

  zombieState.corpses.push({
    id: `corpse_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    isCorpse: true,
    isZombie: true,
    isBot: true,
    active: true,
    team: 'INFECTED',
    isDead: true,
    hasHead: true,
    decapitated: false,
    centerX: corpseX,
    feetY: floorY,
    x: corpseX - (charBody.w || 24) * 0.5,
    y: floorY - (charBody.h || 70),
    w: charBody.w || 24,
    h: charBody.h || 70,
    thighLen: charBody.thighLen || 25,
    shinLen: charBody.shinLen || 24,
    upperArmLen: charBody.upperArmLen || 14,
    forearmLen: charBody.forearmLen || 13,
    vx: 0,
    vy: 0,
    hp: 0,
    maxHp: ZOMBIE_CONFIG.MAX_HP,
    downedHp: 60,
    maxDownedHp: 60,
    jumpCooldown: 0,
    corpseX: corpseX,
    corpseY: floorY,
    facing: facing,
    yaw: (facing < 0 ? Math.PI : 0),
    groundY: floorY,
    timer: ZOMBIE_CONFIG.REANIMATE_DELAY,
    twitch: 0,
    originalName: char.name || (char.isBot ? 'BOT' : 'OPERATOR'),

    // Pełna tożsamość i model poległego
    charVisuals: rawVisuals,
    customVisuals: undeadVisuals,
    visuals: undeadVisuals,
    _cachedVisuals: undeadVisuals,
    _visualsDirty: false,
    charClass: charClass,
    currentClass: charClass,
    body: charBody,
    dismembered: {
      armFront: false,
      armBack: false,
      legFront: false,
      legBack: false
    },
    currentWeapon: null,
    isWeaponHolstered: true
  });
}
