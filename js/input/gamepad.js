// =========================================================================
// INPUT/GAMEPAD.JS - OBSŁUGA KONTROLERA / PADA (GAMEPAD API)
// Moduł przygotowany pod pełne wsparcie kontrolerów (Xbox / DualShock / DualSense)
// =========================================================================

export const gamepadState = {
  connected: false,
  index: null,
  id: '',
  deadzone: 0.16,
  leftStick: { x: 0, y: 0, magnitude: 0 },
  rightStick: { x: 0, y: 0, magnitude: 0 },
  triggers: { l2: 0, r2: 0 },
  buttons: {
    south: false,     // A / Cross (Skok / Zatwierdź)
    east: false,      // B / Circle (Wślizg / Kucanie / Wstecz)
    west: false,      // X / Square (Przeładuj / Kopniak)
    north: false,     // Y / Triangle (Zmiana broni)
    l1: false,        // LB / L1 (Granat / Kopniak)
    r1: false,        // RB / R1 (Kopniak / Strzał alternatywny)
    l2: false,        // LT / L2 (Celowanie / Jetpack)
    r2: false,        // RT / R2 (Strzał główny)
    select: false,    // Back / Share
    start: false,     // Start / Options (Pauza)
    l3: false,        // Wciśnięcie lewej gałki (Sprint / Kucanie)
    r3: false,        // Wciśnięcie prawej gałki (Schowanie broni)
    dpadUp: false,
    dpadDown: false,
    dpadLeft: false,
    dpadRight: false
  },
  prevButtons: {}
};

export function applyDeadzone(value, deadzone = gamepadState.deadzone) {
  if (Math.abs(value) < deadzone) return 0;
  const sign = Math.sign(value);
  return sign * ((Math.abs(value) - deadzone) / (1 - deadzone));
}

export function initGamepadHandlers() {
  if (typeof window === 'undefined') return;

  window.addEventListener('gamepadconnected', (e) => {
    const gp = e.gamepad;
    if (!gp) return;
    gamepadState.connected = true;
    gamepadState.index = gp.index;
    gamepadState.id = gp.id || 'Gamepad';
  });

  window.addEventListener('gamepaddisconnected', (e) => {
    const gp = e.gamepad;
    if (gp && gamepadState.index === gp.index) {
      gamepadState.connected = false;
      gamepadState.index = null;
      gamepadState.id = '';
      gamepadState.leftStick.x = 0;
      gamepadState.leftStick.y = 0;
      gamepadState.leftStick.magnitude = 0;
      gamepadState.rightStick.x = 0;
      gamepadState.rightStick.y = 0;
      gamepadState.rightStick.magnitude = 0;
      gamepadState.triggers.l2 = 0;
      gamepadState.triggers.r2 = 0;
      for (const k in gamepadState.buttons) {
        gamepadState.buttons[k] = false;
      }
    }
  });
}

export function pollGamepadInput() {
  if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return false;
  if (!gamepadState.connected && gamepadState.index === null) return false;

  const pads = navigator.getGamepads();
  const gp = (gamepadState.index !== null && pads[gamepadState.index]) || pads[0];
  if (!gp || !gp.connected) return false;

  // Zapis poprzedniego stanu przycisków (do wykrywania justPressed / justReleased)
  Object.assign(gamepadState.prevButtons, gamepadState.buttons);

  const lx = applyDeadzone(gp.axes[0] || 0);
  const ly = applyDeadzone(gp.axes[1] || 0);
  const rx = applyDeadzone(gp.axes[2] || 0);
  const ry = applyDeadzone(gp.axes[3] || 0);

  gamepadState.leftStick.x = lx;
  gamepadState.leftStick.y = ly;
  gamepadState.leftStick.magnitude = Math.min(1, Math.hypot(lx, ly));

  gamepadState.rightStick.x = rx;
  gamepadState.rightStick.y = ry;
  gamepadState.rightStick.magnitude = Math.min(1, Math.hypot(rx, ry));

  const btn = (idx) => !!(gp.buttons[idx] && gp.buttons[idx].pressed);
  const val = (idx) => (gp.buttons[idx] ? (gp.buttons[idx].value || 0) : 0);

  gamepadState.buttons.south = btn(0);
  gamepadState.buttons.east = btn(1);
  gamepadState.buttons.west = btn(2);
  gamepadState.buttons.north = btn(3);
  gamepadState.buttons.l1 = btn(4);
  gamepadState.buttons.r1 = btn(5);
  gamepadState.buttons.l2 = btn(6) || val(6) > 0.25;
  gamepadState.buttons.r2 = btn(7) || val(7) > 0.25;
  gamepadState.buttons.select = btn(8);
  gamepadState.buttons.start = btn(9);
  gamepadState.buttons.l3 = btn(10);
  gamepadState.buttons.r3 = btn(11);
  gamepadState.buttons.dpadUp = btn(12);
  gamepadState.buttons.dpadDown = btn(13);
  gamepadState.buttons.dpadLeft = btn(14);
  gamepadState.buttons.dpadRight = btn(15);

  gamepadState.triggers.l2 = val(6);
  gamepadState.triggers.r2 = val(7);

  return true;
}
