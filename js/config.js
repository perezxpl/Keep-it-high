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
  SLIDE_DASH_SPEED: 13.5
};

export const FRAME_DURATION = 1000 / 60; // 16.666 ms (dokładnie 60 FPS)
export const START_X = 160;
export const ARENA_WIDTH = 3200;
export const ARENA_LEFT = START_X; // 160
export const ARENA_RIGHT = START_X + ARENA_WIDTH; // 3360