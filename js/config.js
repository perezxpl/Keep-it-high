export const GAME_STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  SETTINGS: 'SETTINGS',
  PAUSED: 'PAUSED',
  CLASS_SELECT: 'CLASS_SELECT',
  ARENA_SELECT: 'ARENA_SELECT'
};

export const CONFIG = {
  GRAVITY: 0.38,
  JUMP_FORCE: 9.8,
  ACCEL: 0.24,
  DECEL: 0.84,
  SLIDE_DECEL: 0.978,
  CROUCH_SPEED: 1.6,
  WALK_MAX: 2.2,
  JOG_MAX: 4.2,
  SPRINT_MAX: 6.8,
  SLIDE_DASH_SPEED: 13.5,
  MIN_RUN_SPEED: 2.5,         // Minimalna prędkość biegu do wykonania ślizgu (~150 px/s przy 60 FPS)

  // SYSTEM EFEKTÓW GORE / ROZCZŁONKOWANIA
  GORE_ENABLED: true,
  MAX_BLOOD_DECALS: 120,

  // SYSTEM BALANSU KOPNIĘCIA (GLOBAL NERF ~45-50% I BAZOWE SIŁY)
  BASE_KICK_FORCE: 19.5,      // Bazowa siła wykopu piłki (osłabienie o ~45% z 36)
  BASE_KNOCKBACK: 10.5,       // Bazowy knockback dla postaci (osłabienie o ~50% z 22)
  BASE_BARREL_IMPULSE: 9.5,   // Bazowy impuls dla ruchomych przeszkód (beczek)

  // SYSTEM OGRANICZENIA KAMERY (CAMERA CLAMPING) I CELOWANIA (SOLDAT STYLE LOOK-AHEAD)
  CAMERA_CLAMPING: true,
  CAMERA_SMOOTH_SPEED: 0.08,
  CAMERA_AIM_LEAD_ENABLED: true,
  CAMERA_AIM_MAX_LEAD_X: 180,
  CAMERA_AIM_MAX_LEAD_Y: 110,
  CAMERA_AIM_MOBILE_MAX_LEAD_X: 340,
  CAMERA_AIM_MOBILE_MAX_LEAD_Y: 140,
  CAMERA_SNIPER_ZOOM_MULT: 0.88,
  CAMERA_SNIPER_LEAD_MULT: 1.40
};

// =========================================================================
// STATYSTYKI KOPNIĘCIA PRZYPISANE DO RÓL KLAS
// =========================================================================
export const KICK_CONFIG = {
  BASE_KICK_FORCE: 19.5,
  BASE_KNOCKBACK: 10.5,
  BASE_BARREL_IMPULSE: 9.5,
  CLASSES: {
    AERO: {
      kickForce: 0.85,      // Lekkie, szybkie podanie
      knockback: 0.70,      // Niski odrzut
      cooldown: 0.35        // Najkrótszy cooldown: 0.35s (~21 klatek)
    },
    ENFORCER: {
      kickForce: 1.15,      // Ciężki wykop
      knockback: 1.50,      // Najwyższy knockback / taranowanie
      cooldown: 0.70        // Najdłuższy cooldown: 0.70s (~42 klatki)
    },
    PLAYMAKER: {
      kickForce: 1.30,      // Najwyższa siła i precyzja
      knockback: 1.00,      // Umiarkowany odrzut
      cooldown: 0.50        // Zbalansowany cooldown: 0.50s (~30 klatek)
    },
    SWEEPER: {
      kickForce: 1.25,      // Daleki wykop obronny
      knockback: 1.25,      // Wysoki odrzut defensywny
      cooldown: 0.55        // Cooldown: 0.55s (~33 klatki)
    }
  }
};

export const FRAME_DURATION = 1000 / 60; // 16.666 ms (dokładnie 60 FPS)
export const START_X = 0;
export const ARENA_WIDTH = 3600;
export const ARENA_HEIGHT = 1300;
export const MAP_WIDTH = ARENA_WIDTH;
export const MAP_HEIGHT = ARENA_HEIGHT;
export const ARENA_LEFT = START_X; // 0
export const ARENA_RIGHT = START_X + ARENA_WIDTH; // 3600

// =========================================================================
// DEFINICJA ARENY 2: SEKTOR X // INDUSTRIAL FOUNDRY & WASTE FACILITY
// Turniejowy układ „X / Klepsydra” w stylu SOLDAT (3600x1400 PX)
// =========================================================================
export const ARENA_2_SECTOR_X = {
  id: 'ARENA_2',
  alias: 'ARENA_2_SECTOR_X',
  name: 'Sektor X',
  subtitle: 'Industrial Foundry & Waste Facility',
  width: 3600,
  height: 1400,
  bounds: { minX: 0, maxX: 3600, minY: 0, maxY: 1400 },
  hazardZoneY: 1260, // Poziom lustra toksycznego kwasu
  abyssDeathY: 1350,
  spawns: [
    { x: 520,  y: 390, facing: 1 },  // Platforma A (Góra-Lewo)
    { x: 3080, y: 390, facing: -1 }, // Platforma B (Góra-Prawo)
    { x: 520,  y: 970, facing: 1 },  // Platforma C (Dół-Lewo)
    { x: 3080, y: 970, facing: -1 }  // Platforma D (Dół-Prawo)
  ]
};
export const ARENA_2_CONFIG = ARENA_2_SECTOR_X;
export const ARENA_2_PANDORA = ARENA_2_SECTOR_X; // Alias wstecznej kompatybilności


// =========================================================================
// KONFIGURACJA AMUNICJI I PRZEŁADOWANIA BRONI GRACZA
// =========================================================================
export const WEAPON_CONFIG = {
  AK47: {
    magSize: 30,
    currentAmmo: 30,
    reserveAmmo: 90,
    reloadTime: 2.0 // ok. 2.0s (~120 klatek przy 60 FPS)
  },
  SHOTGUN: {
    magSize: 8,
    currentAmmo: 8,
    reserveAmmo: 64,
    reloadTime: 2.5 // ok. 2.5s (~150 klatek przy 60 FPS)
  },
  SNIPER: {
    magSize: 5,
    currentAmmo: 5,
    reserveAmmo: 25,
    reloadTime: 2.8 // ok. 2.8s (~168 klatek przy 60 FPS)
  }
};

// =========================================================================
// URZĄDZENIA DOTYKOWE (STEROWANIE MOBILNE / VIRTUAL JOYSTICK)
// =========================================================================
export let isTouchDevice = (typeof window !== 'undefined' && (
  'ontouchstart' in window ||
  (navigator && navigator.maxTouchPoints > 0) ||
  (window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(any-pointer: coarse)').matches)) ||
  (window.location && (new URLSearchParams(window.location.search).has('touch') || new URLSearchParams(window.location.search).has('mobile')))
));
if (typeof window !== 'undefined') {
  window.isTouchDevice = isTouchDevice;
}
export function setTouchDevice(val) {
  isTouchDevice = !!val;
  if (typeof window !== 'undefined') {
    window.isTouchDevice = isTouchDevice;
  }
}

