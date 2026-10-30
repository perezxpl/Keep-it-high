// =========================================================================
// INPUT/KEYBOARDMOUSE.JS - OBSŁUGA KLAWIATURY I MYSZY (PC INPUT)
// Wydzielony moduł z js/main.js
// =========================================================================

import { GAME_STATES } from '../config.js';
import {
  canvas, W, H, GROUND_Y, camera,
  isTouchDevice, weaponButtons, spawnGrass, dist,
  setCameraMouseScreenPos
} from '../world.js';
import {
  player, initiatePlayerJump, startKickCharge, executeReleaseKick,
  playerSlide, prepareGrenadeThrow, releaseGrenadeThrow,
  prepareTomahawkThrow, releaseTomahawkThrow,
  throwTacticalGrenade, isCeilingBlockingStand
} from '../player.js';
import { ball, resetBallToPlayer } from '../ball.js';
import {
  getObstacleDef, calculateObstaclePlacement, undoCustomObstacle
} from '../obstacles.js';
import { CLASSES } from '../classes/index.js';
import { bot, getActiveBots } from '../bot.js';
import { WEAPONS, reloadWeapon } from '../weapons.js';
import {
  remotePlayer, isChatActive, openChat, closeChat, updateCursorVisibility
} from '../network.js';
import { rightStick, pockets, handleMeleeButtonPress } from '../mobileControls.js';
import { uiManager, playUiClick, playUiPause, playUiResume } from '../uiManager.js';
import { getHoveredClassCard, isClassSelectBackClicked } from '../ui/classSelectModal.js';
import {
  editorState,
  updateEditorPaletteHighlight,
  placeSelectedObstacle,
  handleEditorRightClick
} from '../dev/obstacleEditor.js';
import { toggleTouchControls } from '../dev/devPanel.js';
import { toggleWeaponEditor } from '../dev/weaponEditor.js';
import {
  killstreakState,
  activateNextAvailableStreak,
  confirmMortarStrikeTarget,
  cancelMortarStrikeTargeting
} from '../killstreaks/index.js';
import { deathmatchState } from '../deathmatch/index.js';
import { matchWinState } from '../ui/rankHud.js';
import { equipPocket1Slot, cyclePocket1, quickSwitchPocket1 } from '../loadout/index.js';

export const mouseState = {
  lmbDown: false,
  rmbDown: false,
  semiFired: false,
  screenX: 640,
  screenY: 360
};

export const keys = {
  left: false,
  right: false,
  down: false,
  up: false,
  space: false,
  shift: false,
  slide: false,
  ctrl: false,
  crouch: false,
  KeyX: false,
  bootsCharge: false,
  KeyE: false,
  interact: false
};

if (typeof window !== 'undefined') {
  window.keys = keys;
  window.mouseState = mouseState;
}

export const inputSession = {
  jetpackAirborneSession: false,
  lastSPressTime: 0,
  jumpKeyPressed: false,
  lastWPressTime: 0,
  isJetpackActive: false,
  ctrlPressStartTime: 0,
  ctrlWasToggledOnKeyDown: false
};

export function resetInputState() {
  for (const k in keys) {
    keys[k] = false;
  }
  inputSession.jumpKeyPressed = false;
  inputSession.isJetpackActive = false;
  inputSession.ctrlPressStartTime = 0;
  inputSession.ctrlWasToggledOnKeyDown = false;
  if (player) {
    player.isJetpacking = false;
    player.crouchToggled = false;
    if (player.isCharging) {
      player.isCharging = false;
      player.chargePower = 0;
      player.kickPower = 0;
    }
    if (player.rocketBoots) {
      player.rocketBoots.isKeyCharging = false;
      player.rocketBoots.keyChargeRatio = 0;
      player.rocketBoots.keyChargePower = 0;
    }
  }
  mouseState.lmbDown = false;
  mouseState.rmbDown = false;
  mouseState.semiFired = false;
  if (typeof player !== 'undefined' && player) {
    player.meleeNeedRelease = false;
  }
}

// Obsługa Keyboard Lock API w trybie pełnoekranowym (pełna blokada skrótów systemowych, w tym Ctrl+W)
async function requestKeyboardLock() {
  if (typeof navigator !== 'undefined' && navigator.keyboard && typeof navigator.keyboard.lock === 'function') {
    try {
      await navigator.keyboard.lock(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight', 'Space']);
    } catch (_) { }
  }
}

export function initKeyboardMouseHandlers({
  GAME_STATE,
  setGameState,
  selectPlayerClass,
  teleportToDistance,
  BIOME_TELEPORT_TARGETS,
  devSetClass,
  toggleDevPanel,
  toggleArena
}) {
  window.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('blur', () => {
    resetInputState();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resetInputState();
    }
  });

  // Ochrona przed przypadkowym zamknięciem karty (skrót Ctrl+W, odświeżenie itp.) w trakcie gry
  window.addEventListener('beforeunload', (e) => {
    e.preventDefault();
    e.returnValue = '';
    return '';
  });

  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      requestKeyboardLock();
    }
  });

  mouseState.screenX = W * 0.65;
  mouseState.screenY = H * 0.45;

  window.addEventListener('keydown', (e) => {
    // Bezwzględna blokada skrótu Ctrl+W / Cmd+W (zamykanie karty w przeglądarce)
    if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyW' || e.key === 'w' || e.key === 'W')) {
      e.preventDefault();
    }

    // Obsługa otwierania czatu sieciowego klawiszem "T"
    if (e.code === 'KeyT' && !isChatActive && GAME_STATE.current === 'PLAYING') {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
      if (!isInput) {
        e.preventDefault();
        resetInputState();
        openChat();
        return;
      }
    }

    // Blokada klawiszy gry gdy czat jest aktywny lub fokus jest w polu tekstowym
    const activeEl = document.activeElement;
    const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
    if (isChatActive || isInputFocused) {
      if (e.code === 'Escape' && isChatActive) {
        e.preventDefault();
        closeChat();
      }
      return;
    }

    // Obsługa klawisza Escape oraz P dla Pauzy / Menu / Ustawień
    const isEscapeKey = (e.code === 'Escape' || e.key === 'Escape');
    if (isEscapeKey && killstreakState.mortarTargeting) {
      e.preventDefault();
      cancelMortarStrikeTargeting();
      return;
    }

    const isPauseKey = (e.code === 'KeyP' || e.key === 'p' || e.key === 'P');
    if (isEscapeKey || (isPauseKey && (GAME_STATE.current === 'PLAYING' || GAME_STATE.current === 'PAUSED'))) {
      const mpModal = document.getElementById('mp-modal');
      if (mpModal && !mpModal.classList.contains('mp-modal-hidden')) {
        e.preventDefault();
        mpModal.classList.add('mp-modal-hidden');
        updateCursorVisibility();
        return;
      }

      e.preventDefault();
      if (GAME_STATE.current === 'PLAYING') {
        playUiPause();
        setGameState('PAUSED');
      } else if (GAME_STATE.current === 'PAUSED') {
        playUiResume();
        setGameState('PLAYING');
      } else if (GAME_STATE.current === 'SETTINGS' || GAME_STATE.current === 'CREATOR') {
        playUiClick();
        setGameState(GAME_STATE.previous || 'MENU');
      } else if (GAME_STATE.current === 'ARENA_SELECT') {
        playUiClick();
        setGameState('MENU');
      } else if (GAME_STATE.current === 'CLASS_SELECT') {
        playUiClick();
        setGameState('ARENA_SELECT');
      }
      return;
    }

    // Obsługa klawiszy w Menu Głównym (Start: Spacja / Enter otwiera wybór areny)
    if (GAME_STATE.current === 'MENU') {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        playUiClick();
        setGameState('ARENA_SELECT');
        return;
      }
      return; // Blokada pozostałych klawiszy gry w Menu
    }

    // Obsługa klawiszy na ekranie wyboru areny (1-3 wybiera arenę, Spacja / Enter zatwierdza aktywną)
    if (GAME_STATE.current === 'ARENA_SELECT') {
      if (e.code === 'Digit1' || e.code === 'Numpad1' || e.key === '1') {
        e.preventDefault();
        playUiClick();
        if (typeof window.switchArena === 'function') window.switchArena('ARENA_1');
        setGameState('CLASS_SELECT');
        return;
      }
      if (e.code === 'Digit2' || e.code === 'Numpad2' || e.key === '2') {
        e.preventDefault();
        playUiClick();
        if (typeof window.switchArena === 'function') window.switchArena('ARENA_2');
        setGameState('CLASS_SELECT');
        return;
      }
      if (e.code === 'Digit3' || e.code === 'Numpad3' || e.key === '3') {
        e.preventDefault();
        playUiClick();
        if (typeof window.switchArena === 'function') window.switchArena('ARENA_3');
        setGameState('CLASS_SELECT');
        return;
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        playUiClick();
        const activeCard = document.querySelector('#screen-arena-select .arena-card.active');
        const chosenArena = activeCard?.dataset?.arena || window.activeArenaId || 'ARENA_2';
        if (typeof window.switchArena === 'function') window.switchArena(chosenArena);
        setGameState('CLASS_SELECT');
        return;
      }
      return; // Blokada pozostałych klawiszy gry na ekranie wyboru areny
    }

    // Blokada klawiszy gry gdy gra jest wstrzymana, w ustawieniach lub w kreatorze
    if (GAME_STATE.current === 'PAUSED' || GAME_STATE.current === 'SETTINGS' || GAME_STATE.current === 'CREATOR') {
      return;
    }

    // Tryb wyboru klasy na arenie (Klawisze 1-3 natychmiast zatwierdzają i spawnują postać)
    if (GAME_STATE.current === 'CLASS_SELECT' || GAME_STATE.current === GAME_STATES.CLASS_SELECT) {
      if (e.code === 'Digit1' || e.code === 'Numpad1' || e.key === '1') {
        e.preventDefault();
        playUiClick();
        selectPlayerClass(CLASSES.RAPTOR);
        return;
      } else if (e.code === 'Digit2' || e.code === 'Numpad2' || e.key === '2') {
        e.preventDefault();
        playUiClick();
        selectPlayerClass(CLASSES.STRIKER);
        return;
      } else if (e.code === 'Digit3' || e.code === 'Numpad3' || e.key === '3') {
        e.preventDefault();
        playUiClick();
        selectPlayerClass(CLASSES.ENFORCER);
        return;
      } else if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        playUiClick();
        const currentSelected = uiManager?.selectedClassId;
        const cls = currentSelected ? (CLASSES[currentSelected] || CLASSES.RAPTOR) : CLASSES.RAPTOR;
        selectPlayerClass(cls);
        return;
      } else if (e.code === 'Escape') {
        e.preventDefault();
        playUiClick();
        setGameState('MENU');
        return;
      }
      return;
    }

    // Blokada domyślnych skrótów przeglądarki (prevent default) w trakcie rozgrywki
    // Nie blokujemy klawiszy narzędziowych / odświeżania: F12 (DevTools), F5 (Refresh) itp.
    const isFunctionKey = e.code === 'F5' || e.key === 'F5' || e.code === 'F12' || e.key === 'F12' ||
      (typeof e.key === 'string' && /^F\d+$/.test(e.key));

    if (!isFunctionKey) {
      const isControlKey = (
        e.code === 'Space' || e.key === ' ' ||
        e.code === 'Tab' || e.key === 'Tab' ||
        e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight' ||
        e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'Shift' ||
        e.code === 'ControlLeft' || e.code === 'ControlRight' || e.key === 'Control' ||
        e.code === 'AltLeft' || e.code === 'AltRight' || e.key === 'Alt'
      );

      const hasModifier = e.ctrlKey || e.shiftKey || e.altKey || e.metaKey;
      const isGameKey = (
        e.code === 'KeyW' || e.code === 'KeyA' || e.code === 'KeyS' || e.code === 'KeyD' ||
        e.code === 'KeyC' || e.code === 'KeyR' || e.code === 'KeyG' || e.code === 'KeyE' ||
        e.code === 'KeyQ' || e.code === 'KeyB' || e.code === 'KeyZ' ||
        e.code === 'Space' ||
        (typeof e.code === 'string' && (e.code.startsWith('Arrow') || e.code.startsWith('Digit') || e.code.startsWith('Numpad')))
      );

      // Blokada kombinacji np. Ctrl+W/A/S/D oraz klawiszy modyfikatorów/sterujących (Spacja, Tab, Strzałki, Shift, Ctrl, Alt)
      if (isControlKey || (hasModifier && isGameKey)) {
        e.preventDefault();
      }
    }

    if (e.code === 'KeyE') {
      keys.KeyE = true;
      keys.interact = true;
    }

    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;

    if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.key === 'Control') {
      e.preventDefault();
      if (!e.repeat) {
        inputSession.ctrlPressStartTime = performance.now();
        inputSession.ctrlWasToggledOnKeyDown = !!player.crouchToggled;
      }
      keys.ctrl = true;
      keys.crouch = true;
    }

    if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      if (e.repeat) {
        keys.down = true;
        return;
      }
      const now = performance.now();
      const isDoublePress = (now - inputSession.lastSPressTime < 280);
      const isCurrentPlatDropThrough = !!(
        player.onGround &&
        player.currentPlatform &&
        player.currentPlatform.isDropThrough === true
      );

      if (isDoublePress && isCurrentPlatDropThrough) {
        player.dropThroughTimer = 22;
        player.dropThroughPlatform = player.currentPlatform || null;
        if (player.currentPlatform) {
          const platThick = player.currentPlatform.thickness || player.currentPlatform.h || 20;
          player.y += platThick + 12;
          player.currentPlatform = null;
          player.onGround = false;
          player.isJumping = true;
          player.isCrouching = false;
          player.vy = Math.max(player.vy || 0, 4.5);
        }
      }
      inputSession.lastSPressTime = now;
      keys.down = true;
    }

    if ((e.code === 'KeyW' || e.code === 'ArrowUp') && !inputSession.jumpKeyPressed) {
      inputSession.jumpKeyPressed = true;
      keys.up = true;

      // Klawisz W natychmiast podrywa postać do pionu
      player.isProne = false;
      player.isCrouching = false;
      player.crouchToggled = false;

      const canCoyoteJump = ((player.coyoteTimer || 0) > 0 && !player.isJumping && Math.abs(player.vy || 0) < 4.0);
      const isAirborne = (!player.onGround && !canCoyoteJump) || player.isJumping;

      if (isAirborne && player.jetpackKeyNeutralized && (player.jetFuel || 0) > 0) {
        // W POWIETRZU: uruchomienie jetpacka (tylko jeśli klawisz W został puszczony po wyskoku z ziemi)
        inputSession.isJetpackActive = true;
        player.isJetpacking = true;
        inputSession.jetpackAirborneSession = true;
      } else if (!player.isJumping && !player.isSliding && !player.isIntro && player.currentClass?.id !== 'ENFORCER') {
        // NA ZIEMI / KRAWĘDZI PLATFORMY (COYOTE TIME): normalny skok z podłoża (dla Raptora i Strikera; Enforcer skacze przy puszczeniu W)
        initiatePlayerJump(player, spawnGrass);
        player.jetpackKeyNeutralized = false; // Po wyskoku z ziemi wymagamy puszczenia klawisza W
      }
    }
    if (e.code === 'Space' && !e.repeat && !keys.space) {
      keys.space = true;
      // Spacja podrywa postać z leżenia/kucania do pionu i rozpoczyna wykop
      player.isProne = false;
      player.isCrouching = false;
      player.crouchToggled = false;
      const activeBots = (typeof getActiveBots === 'function') ? getActiveBots() : (bot.active ? [bot] : []);
      const meleeTargets = [...activeBots, remotePlayer.active ? remotePlayer : null].filter(Boolean);
      startKickCharge(player, meleeTargets);
    }
    if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') && !e.repeat && !keys.shift) {
      keys.slide = true;
      keys.shift = true;
      player.crouchToggled = false;
      if (player.onGround) {
        playerSlide(spawnGrass, GROUND_Y, player);
      }
    }
    if ((e.code === 'KeyX' || e.key === 'x' || e.key === 'X') && !e.repeat) {
      keys.KeyX = true;
      keys.bootsCharge = true;
    }
    if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') {
      if (!e.repeat && !player.isDead) {
        if (player.isHolstered) player.isHolstered = false;
        reloadWeapon(player, player.currentWeapon);
      }
    }
    if (e.code === 'KeyQ') {
      if ((GAME_STATE.current === 'PLAYING' || GAME_STATE.current === GAME_STATES.PLAYING) && !player.isDead) {
        quickSwitchPocket1(player);
      }
    }
    if (e.code === 'KeyG') {
      if ((GAME_STATE.current === 'PLAYING' || GAME_STATE.current === GAME_STATES.PLAYING) && !player.isDead) {
        if (!e.repeat) {
          prepareGrenadeThrow(player);
        }
      }
    }
    if (e.code === 'KeyB') {
      resetBallToPlayer(player, GROUND_Y);
    }

    if (e.code === 'Digit1' || e.code === 'Numpad1' || e.key === '1') {
      equipPocket1Slot(player, 0);
    } else if (e.code === 'Digit2' || e.code === 'Numpad2' || e.key === '2') {
      equipPocket1Slot(player, 1);
    } else if (e.code === 'Digit3' || e.code === 'Numpad3' || e.key === '3') {
      equipPocket1Slot(player, 2);
    } else if (e.code === 'Digit4' || e.code === 'Numpad4' || e.key === '4' || e.code === 'KeyK') {
      const activated = activateNextAvailableStreak();
      if (!activated && (e.code === 'Digit4' || e.code === 'Numpad4' || e.key === '4')) {
        teleportToDistance(BIOME_TELEPORT_TARGETS.JUNGLE);
      }
    } else if (e.code === 'Digit5' || e.code === 'Numpad5' || e.key === '5') {
      teleportToDistance(BIOME_TELEPORT_TARGETS.HELL);
    }

    if (e.code === 'Digit6' || e.code === 'Numpad6' || e.key === '6') devSetClass('RAPTOR');
    else if (e.code === 'Digit7' || e.code === 'Numpad7' || e.key === '7') devSetClass('STRIKER');
    else if (e.code === 'Digit8' || e.code === 'Numpad8' || e.key === '8') devSetClass('ENFORCER');

    if (e.code === 'Backquote' || e.key === '`' || e.key === '~') toggleDevPanel();
    if (e.code === 'F6') {
      e.preventDefault();
      toggleWeaponEditor();
    }

    if (e.code === 'KeyM' || e.code === 'F2' || e.code === 'Digit0' || e.code === 'Numpad0') {
      if (!isChatActive) {
        toggleArena();
      }
    }

    if (e.code === 'KeyP') {
      if (!isChatActive) {
        toggleTouchControls();
      }
    }

    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
      const isDmEnded = (deathmatchState.matchEnded && deathmatchState.endCelebrationTimer > 0);
      const isWinEnded = (matchWinState.won && matchWinState.timer > 0);
      if (isDmEnded || isWinEnded) {
        if (typeof window !== 'undefined' && typeof window.concludeMatchAndReturnToLobby === 'function') {
          window.concludeMatchAndReturnToLobby();
          return;
        }
      }
    }

    if (e.code === 'Escape') {
      if (killstreakState.mortarTargeting) {
        cancelMortarStrikeTargeting();
        return;
      }
      if (editorState.active) {
        if (editorState.selectedType) {
          editorState.selectedType = null;
          updateEditorPaletteHighlight();
        }
      }
    }
    if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) {
      if (editorState.active) {
        undoCustomObstacle();
      }
    }
  });

  window.addEventListener('wheel', (e) => {
    if (killstreakState.mortarTargeting) {
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      killstreakState.mortarCameraX = (killstreakState.mortarCameraX || (player?.x || 600)) + delta * 1.5;
    } else if (GAME_STATE.current === 'PLAYING' || GAME_STATE.current === GAME_STATES.PLAYING) {
      if (Math.abs(e.deltaY) > 5) {
        cyclePocket1(player, e.deltaY > 0 ? 1 : -1);
      }
    }
  }, { passive: false });

  window.addEventListener('keyup', (e) => {
    if (isChatActive) {
      resetInputState();
      return;
    }
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;

    if (e.code === 'KeyE') {
      keys.KeyE = false;
      keys.interact = false;
    }

    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;

    if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.key === 'Control') {
      const pressDuration = performance.now() - inputSession.ctrlPressStartTime;
      keys.ctrl = false;
      keys.crouch = false;

      // Krótkie kliknięcie klawisza Ctrl (< 320 ms) przełącza stan kucania (Toggle Crouch)
      if (pressDuration < 320 && !player.isProne && !player.isSliding && !player.isJumping) {
        if (inputSession.ctrlWasToggledOnKeyDown) {
          // Jeśli postać była już w trybie kucania, ponowne krótkie kliknięcie podrywa ją na nogi
          if (!isCeilingBlockingStand(player, GROUND_Y)) {
            player.crouchToggled = false;
            player.isCrouching = false;
            player.isProne = false;
            player.state = 'STAND';
            player.hitboxHeight = player.h || 70;
          }
        } else {
          // Krótkie kliknięcie aktywuje kucanie
          player.crouchToggled = true;
          player.isCrouching = true;
          player.isProne = false;
          player.state = 'CROUCH';
          player.hitboxHeight = 45;
        }
      } else {
        // Długie przytrzymanie (hold-to-crouch / hold-to-prone) - zwolnienie klawisza stawia postać
        if (!isCeilingBlockingStand(player, GROUND_Y)) {
          player.crouchToggled = false;
          player.isCrouching = false;
          player.isProne = false;
          player.state = 'STAND';
          player.hitboxHeight = player.h || 70;
        }
      }
    }
    if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      keys.down = false;
    }

    if (e.code === 'KeyW' || e.code === 'ArrowUp') {
      inputSession.jumpKeyPressed = false;
      keys.up = false;
      player.jetpackKeyNeutralized = true;
      inputSession.isJetpackActive = false;
      player.isJetpacking = false;
    }
    if (e.code === 'Space' || e.key === ' ') {
      keys.space = false;
      const activeBots = (typeof getActiveBots === 'function') ? getActiveBots() : (bot.active ? [bot] : []);
      const meleeTargets = [...activeBots, remotePlayer.active ? remotePlayer : null].filter(Boolean);
      executeReleaseKick(ball, player, 0, meleeTargets);
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC' || e.key === 'Shift') {
      keys.slide = false;
      keys.shift = false;
    }
    if (e.code === 'KeyX' || e.key === 'x' || e.key === 'X') {
      keys.KeyX = false;
      keys.bootsCharge = false;
    }
    if (e.code === 'KeyG') {
      if ((GAME_STATE.current === 'PLAYING' || GAME_STATE.current === GAME_STATES.PLAYING) && !player.isDead) {
        if (player.throwAnim && player.throwAnim.active) {
          releaseGrenadeThrow(player);
        } else {
          throwTacticalGrenade(player);
        }
      }
    }
  });

  window.addEventListener('mousemove', (e) => {
    mouseState.screenX = e.clientX;
    mouseState.screenY = e.clientY;
    setCameraMouseScreenPos(e.clientX, e.clientY);

    if (killstreakState.mortarTargeting) {
      killstreakState.mortarTargetX = camera.x + mouseState.screenX / camera.zoom;
    }

    if (GAME_STATE.current === 'CLASS_SELECT' || GAME_STATE.current === GAME_STATES.CLASS_SELECT) {
      const isBack = isClassSelectBackClicked(mouseState.screenX, mouseState.screenY);
      const card = getHoveredClassCard(mouseState.screenX, mouseState.screenY);
      canvas.style.cursor = (isBack || card) ? 'pointer' : 'default';
    }

    const isDmEnded = (deathmatchState.matchEnded && deathmatchState.endCelebrationTimer > 0);
    const isWinEnded = (matchWinState.won && matchWinState.timer > 0);
    if (isDmEnded || isWinEnded) {
      const b = isDmEnded ? deathmatchState.returnButtonBounds : matchWinState.returnButtonBounds;
      const isOverBtn = b && (mouseState.screenX >= b.x && mouseState.screenX <= b.x + b.w && mouseState.screenY >= b.y && mouseState.screenY <= b.y + b.h);
      canvas.style.cursor = isOverBtn ? 'pointer' : 'default';
    }

    if (editorState.active) {
      const worldX = camera.x + mouseState.screenX / camera.zoom;
      const worldY = camera.y + mouseState.screenY / camera.zoom;
      editorState.cursorWorldX = worldX;
      editorState.cursorWorldY = worldY;

      if (editorState.selectedType) {
        const def = getObstacleDef(editorState.selectedType);
        const placement = calculateObstaclePlacement(def, worldX, worldY, {
          snapToGrid: editorState.snapToGrid,
          gridSize: editorState.gridSize,
          groundY: GROUND_Y,
          surfaceSnapActive: editorState.surfaceSnap,
          snapThreshold: editorState.snapThreshold
        });
        editorState.hoverX = placement.x + placement.w / 2;
        editorState.hoverY = placement.y + placement.h / 2;
      } else {
        if (editorState.snapToGrid) {
          editorState.hoverX = Math.round(worldX / editorState.gridSize) * editorState.gridSize;
          editorState.hoverY = Math.round((worldY - GROUND_Y) / editorState.gridSize) * editorState.gridSize + GROUND_Y;
        } else {
          editorState.hoverX = Math.round(worldX);
          editorState.hoverY = Math.round(worldY);
        }
      }
    }
  });

  canvas.addEventListener('touchstart', (e) => {
    if (GAME_STATE.current !== 'PLAYING') {
      if ((GAME_STATE.current === 'CLASS_SELECT' || GAME_STATE.current === GAME_STATES.CLASS_SELECT) && e.touches && e.touches[0]) {
        const touch = e.touches[0];
        if (isClassSelectBackClicked(touch.clientX, touch.clientY)) {
          e.preventDefault();
          playUiClick();
          setGameState(GAME_STATE.previous === 'PLAYING' ? 'PLAYING' : 'ARENA_SELECT');
          return;
        }
        const card = getHoveredClassCard(touch.clientX, touch.clientY);
        if (card) {
          e.preventDefault();
          playUiClick();
          selectPlayerClass(card.classObj);
        }
      }
      return;
    }
  }, { passive: false });

  canvas.addEventListener('mousedown', (e) => {
    mouseState.screenX = e.clientX;
    mouseState.screenY = e.clientY;
    setCameraMouseScreenPos(e.clientX, e.clientY);

    if (GAME_STATE.current !== 'PLAYING') {
      if ((GAME_STATE.current === 'CLASS_SELECT' || GAME_STATE.current === GAME_STATES.CLASS_SELECT) && e.button === 0) {
        if (isClassSelectBackClicked(e.clientX, e.clientY)) {
          playUiClick();
          setGameState(GAME_STATE.previous === 'PLAYING' ? 'PLAYING' : 'ARENA_SELECT');
          return;
        }
        const card = getHoveredClassCard(e.clientX, e.clientY);
        if (card) {
          playUiClick();
          selectPlayerClass(card.classObj);
        }
      }
      return;
    }

    // Obsługa kliknięcia w przycisk "POWRÓT DO LOBBY" na ekranie zakończenia meczu
    const isDmEnded = (deathmatchState.matchEnded && deathmatchState.endCelebrationTimer > 0);
    const isWinEnded = (matchWinState.won && matchWinState.timer > 0);
    if ((isDmEnded || isWinEnded) && e.button === 0) {
      const b = isDmEnded ? deathmatchState.returnButtonBounds : matchWinState.returnButtonBounds;
      const isOverBtn = b && (e.clientX >= b.x && e.clientX <= b.x + b.w && e.clientY >= b.y && e.clientY <= b.y + b.h);
      const canSkip = isDmEnded
        ? ((deathmatchState.maxEndCelebrationTimer - deathmatchState.endCelebrationTimer) > 60)
        : ((matchWinState.maxTimer - matchWinState.timer) > 60);
      if (isOverBtn || canSkip) {
        if (typeof window !== 'undefined' && typeof window.concludeMatchAndReturnToLobby === 'function') {
          window.concludeMatchAndReturnToLobby();
          return;
        }
      }
    }

    if (isChatActive) return;
    const mpModal = document.getElementById('mp-modal');
    if (mpModal && !mpModal.classList.contains('mp-modal-hidden')) return;

    // 0a. Obsługa kieszeni broni palnej (oraz karty broni w lewym górnym rogu) dla myszy / pada dotykowego
    const isTouchOrMobile = (isTouchDevice || (typeof window !== 'undefined' && window.innerWidth <= 850));
    if (e.button === 0 && isTouchOrMobile && pockets.firearm) {
      const pFarm = pockets.firearm;
      const distToFarm = dist(e.clientX, e.clientY, pFarm.x, pFarm.y);
      const inTopCard = (e.clientX >= 10 && e.clientX <= 235 && e.clientY >= 28 && e.clientY <= 78);
      if (distToFarm < pFarm.r + 20 || inTopCard) {
        if (pFarm.holdTimerId) clearTimeout(pFarm.holdTimerId);
        rightStick.draggedSlot = null;
        pFarm.active = true;
        pFarm.id = 'mouse';
        pFarm.startX = e.clientX;
        pFarm.startY = e.clientY;
        pFarm.touchStartTime = performance.now();
        pFarm.isDragging = false;
        pFarm.reloadTriggered = false;
        pFarm.holdTimerId = setTimeout(() => {
          pFarm.holdTimerId = null;
          if (pFarm.active && !pFarm.isDragging && !pFarm.reloadTriggered) {
            pFarm.reloadTriggered = true;
            player.isHolstered = false;
            rightStick.armedMode = 'FIREARM';
            reloadWeapon(player, player.currentWeapon);
          }
        }, 500);
        return;
      }
    }

    // 0b. Obsługa dedykowanego przycisku broni białej dla myszy / pada dotykowego
    if (e.button === 0 && pockets.melee && pockets.melee.x > 0) {
      const pMel = pockets.melee;
      const distToMel = dist(e.clientX, e.clientY, pMel.x, pMel.y);
      if (distToMel < pMel.r + 18) {
        pMel.active = true;
        pMel.id = 'mouse';
        pMel.touchStartTime = performance.now();
        handleMeleeButtonPress(player);
        return;
      }
    }

    // 00. Obsługa celowania nalotu moździerzowego (kliknięcie lewym przyciskiem myszy)
    if (killstreakState.mortarTargeting && e.button === 0) {
      const cb = killstreakState.mortarCancelButtonBounds;
      const pb = killstreakState.mortarPlayerButtonBounds;
      const cfb = killstreakState.mortarConfirmButtonBounds;
      const lb = killstreakState.mortarLeftNavBounds;
      const rb = killstreakState.mortarRightNavBounds;
      const kb = killstreakState.hudButtonBounds;

      if (cb && e.clientX >= cb.x && e.clientX <= (cb.x + cb.w) &&
          e.clientY >= cb.y && e.clientY <= (cb.y + cb.h)) {
        cancelMortarStrikeTargeting();
        return;
      }

      if (pb && e.clientX >= pb.x && e.clientX <= (pb.x + pb.w) &&
          e.clientY >= pb.y && e.clientY <= (pb.y + pb.h)) {
        killstreakState.mortarCameraX = player?.x || 600;
        killstreakState.mortarTargetX = player?.x || 600;
        return;
      }

      if (cfb && e.clientX >= cfb.x && e.clientX <= (cfb.x + cfb.w) &&
          e.clientY >= cfb.y && e.clientY <= (cfb.y + cfb.h)) {
        confirmMortarStrikeTarget(killstreakState.mortarTargetX, player);
        return;
      }

      if (lb && e.clientX >= lb.x && e.clientX <= (lb.x + lb.w) &&
          e.clientY >= lb.y && e.clientY <= (lb.y + lb.h)) {
        killstreakState.mortarCameraX = (killstreakState.mortarCameraX || (player?.x || 600)) - 450;
        killstreakState.mortarTargetX = (killstreakState.mortarTargetX || (player?.x || 600)) - 450;
        return;
      }

      if (rb && e.clientX >= rb.x && e.clientX <= (rb.x + rb.w) &&
          e.clientY >= rb.y && e.clientY <= (rb.y + rb.h)) {
        killstreakState.mortarCameraX = (killstreakState.mortarCameraX || (player?.x || 600)) + 450;
        killstreakState.mortarTargetX = (killstreakState.mortarTargetX || (player?.x || 600)) + 450;
        return;
      }

      if (kb && e.clientX >= kb.x && e.clientX <= (kb.x + kb.w) &&
          e.clientY >= kb.y && e.clientY <= (kb.y + kb.h)) {
        cancelMortarStrikeTargeting();
        return;
      }

      const worldX = camera.x + e.clientX / camera.zoom;
      confirmMortarStrikeTarget(worldX, player);
      return;
    }

    // 0a. Obsługa kliknięcia myszą w widget serii zabójstw
    const kb = killstreakState.hudButtonBounds;
    if (kb && e.clientX >= kb.x && e.clientX <= kb.x + kb.w &&
      e.clientY >= kb.y && e.clientY <= kb.y + kb.h) {
      activateNextAvailableStreak();
      return;
    }

    // 0. Obsługa kliknięcia myszą w kafelki broni (dolny lewy róg)
    for (const btn of weaponButtons) {
      if (e.clientX >= btn.x && e.clientX <= btn.x + btn.w &&
        e.clientY >= btn.y && e.clientY <= btn.y + btn.h) {
        if (btn.id === 'GRENADE') {
          const throwAngle = -0.62;
          const throwDist = 320;
          const throwAimX = player.x + player.w / 2 + (player.facing || 1) * Math.cos(throwAngle) * throwDist;
          const throwAimY = player.y + player.h * 0.42 + Math.sin(throwAngle) * throwDist;
          throwTacticalGrenade(player, throwAimX, throwAimY);
        } else if (player.currentWeapon?.id === btn.id) {
          if (!player.isHolstered) {
            player.isHolstered = true;
          } else {
            player.isHolstered = false;
          }
        } else {
          const slotIdx = player.loadout?.pocket1?.slots?.indexOf(btn.id);
          if (typeof slotIdx === 'number' && slotIdx >= 0) {
            equipPocket1Slot(player, slotIdx);
          } else {
            player.currentWeapon = WEAPONS[btn.id] || WEAPONS.AK47;
            player.isHolstered = false;
          }
        }
        return;
      }
    }

    if (editorState.active) {
      if (e.button === 0 && editorState.selectedType) {
        placeSelectedObstacle(mouseState.screenX, mouseState.screenY);
        return;
      }
      if (e.button === 2) {
        handleEditorRightClick(mouseState.screenX, mouseState.screenY);
        return;
      }
    }

    if (e.button === 0) {
      if (player.throwAnim && player.throwAnim.active && player.throwAnim.throwType === 'TOMAHAWK') {
        releaseTomahawkThrow(player);
        return;
      }
      mouseState.lmbDown = true;
      mouseState.semiFired = false;
    } else if (e.button === 2) {
      mouseState.rmbDown = true;
      player.isProne = false;
      player.isCrouching = false;
      player.crouchToggled = false;
      if (player.currentWeapon?.id === 'AXE' && !player.axeThrown) {
        prepareTomahawkThrow(player);
      } else {
        const activeBots = (typeof getActiveBots === 'function') ? getActiveBots() : (bot.active ? [bot] : []);
        const meleeTargets = [...activeBots, remotePlayer.active ? remotePlayer : null].filter(Boolean);
        startKickCharge(player, meleeTargets);
      }
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0 && pockets.firearm && pockets.firearm.active && pockets.firearm.id === 'mouse') {
      if (pockets.firearm.holdTimerId) {
        clearTimeout(pockets.firearm.holdTimerId);
        pockets.firearm.holdTimerId = null;
      }
      const wasReloadTriggered = !!pockets.firearm.reloadTriggered;
      const touchStartTime = pockets.firearm.touchStartTime || 0;
      pockets.firearm.active = false;
      pockets.firearm.isDragging = false;
      pockets.firearm.id = null;
      pockets.firearm.reloadTriggered = false;

      if (!wasReloadTriggered) {
        const touchDur = performance.now() - touchStartTime;
        if (touchDur >= 500) {
          player.isHolstered = false;
          rightStick.armedMode = 'FIREARM';
          reloadWeapon(player, player.currentWeapon);
        } else {
          if (player.isHolstered || rightStick.armedMode !== 'FIREARM' || player.currentWeapon?.isMelee) {
            player.isHolstered = false;
            rightStick.armedMode = 'FIREARM';
            if (player.currentWeapon?.isMelee) {
              const curSlot = (player.loadout?.pocket1?.activeSlotIndex === 1) ? 1 : 0;
              equipPocket1Slot(player, curSlot);
            }
          } else {
            if (player.loadout) {
              cyclePocket1(player, 1);
            } else {
              const curId = player.currentWeapon?.id || 'AK47';
              if (curId === 'AK47') player.currentWeapon = WEAPONS.GLOCK || WEAPONS.SHOTGUN;
              else if (curId === 'GLOCK') player.currentWeapon = WEAPONS.SHOTGUN;
              else if (curId === 'SHOTGUN') player.currentWeapon = WEAPONS.SNIPER;
              else player.currentWeapon = WEAPONS.AK47;
            }
          }
        }
      }
      return;
    }

    if (e.button === 0 && pockets.melee && pockets.melee.active && pockets.melee.id === 'mouse') {
      pockets.melee.active = false;
      pockets.melee.id = null;
      player.meleeNeedRelease = false;
      return;
    }

    if (editorState.active) {
      mouseState.lmbDown = false;
      mouseState.rmbDown = false;
      return;
    }
    if (e.button === 0) {
      mouseState.lmbDown = false;
      mouseState.semiFired = false;
      player.meleeNeedRelease = false;
    } else if (e.button === 2) {
      mouseState.rmbDown = false;
      if (player.throwAnim && player.throwAnim.active && player.throwAnim.throwType === 'TOMAHAWK') {
        releaseTomahawkThrow(player);
      } else {
        const activeBots = (typeof getActiveBots === 'function') ? getActiveBots() : (bot.active ? [bot] : []);
        const meleeTargets = [...activeBots, remotePlayer.active ? remotePlayer : null].filter(Boolean);
        executeReleaseKick(ball, player, 0, meleeTargets);
      }
    }
  });
}
