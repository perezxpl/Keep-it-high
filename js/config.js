export const GAME_STATES = {
  CLASS_SELECT: 'CLASS_SELECT',
  PLAYING: 'PLAYING'
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

  // SYSTEM EFEKTÓW GORE / ROZCZŁONKOWANIA
  GORE_ENABLED: true,
  MAX_BLOOD_DECALS: 120
};

export const FRAME_DURATION = 1000 / 60; // 16.666 ms (dokładnie 60 FPS)
export const START_X = 160;
export const ARENA_WIDTH = 3200;
export const ARENA_LEFT = START_X; // 160
export const ARENA_RIGHT = START_X + ARENA_WIDTH; // 3360

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
  }
};
