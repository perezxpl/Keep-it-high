// =========================================================================
// INPUT/INDEX.JS - ZUNIFIKOWANY SYSTEM WEJŚCIA (PC / MOBILE TOUCH / GAMEPAD)
// Główny punkt dostępowy dla wszystkich urządzeń sterujących
// =========================================================================

import {
  keys,
  mouseState,
  inputSession,
  resetInputState,
  initKeyboardMouseHandlers
} from './keyboardMouse.js';
import {
  initTouchInputHandlers,
  updateDoubleFlickDetection
} from './touchHandlers.js';
import {
  gamepadState,
  applyDeadzone,
  initGamepadHandlers,
  pollGamepadInput
} from './gamepad.js';
import {
  triggerPlayerShoot,
  updatePlayerInputAndCombat
} from './playerController.js';

export {
  keys,
  mouseState,
  inputSession,
  resetInputState,
  initKeyboardMouseHandlers,
  initTouchInputHandlers,
  updateDoubleFlickDetection,
  gamepadState,
  applyDeadzone,
  initGamepadHandlers,
  pollGamepadInput,
  triggerPlayerShoot,
  updatePlayerInputAndCombat
};

export function initAllInputHandlers(options) {
  initKeyboardMouseHandlers(options);
  initTouchInputHandlers({
    GAME_STATE: options.GAME_STATE,
    setJetpackActive: (val) => { inputSession.isJetpackActive = val; },
    triggerPlayerShoot
  });
  initGamepadHandlers();
}
