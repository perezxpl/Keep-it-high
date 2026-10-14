import { CONFIG, FRAME_DURATION, START_X, GAME_STATES, ARENA_LEFT, ARENA_RIGHT, ARENA_WIDTH, ARENA_CONFIGS } from './config.js';
import {
  canvas, ctx, W, H, GROUND_Y, camera, world,
  initCanvas, resize, updateCamera, updateDistance, clampCamera,
  spawnGrass, updateParticles, dist,
  drawSky, drawGround, drawParticles, drawDistanceMarkers, drawHUD,
  clearDesertSandstorm, clearWinterBlizzard,
  isTouchDevice, setTouchDevice,
  jetpackParticles, spawnJetpackSparks, updateJetpackParticles, drawJetpackParticles,
  consumeHitstop, updateGore, drawBloodDecals, drawGore, clearGore,
  updateSeveredHeads, drawSeveredHeads,
  weaponButtons,
  devZoomLevel, setDevZoom,
  getCaveCeilingY,
  setCameraMouseScreenPos,
  spawnKnockedHelmet, spawnVestShreds
} from './world.js';
import {
  player, playerJump, initiatePlayerJump, playerSlide, startJumpCharge, executeReleaseJump,
  startKickCharge, executeReleaseKick, isBallInKickReach, findMeleeTarget,
  performKick, kick,
  updatePlayer, drawPlayer, setPlayerClass, getJetpackNozzlePos,
  throwTacticalGrenade, prepareGrenadeThrow, releaseGrenadeThrow,
  drawGrenadeTrajectory, isCeilingBlockingStand
} from './player.js';
import { updateProjectiles, drawProjectiles } from './projectiles.js';
import { renderArenaBackground, renderArenaForeground, getActiveArena, DEBUG_COLLIDERS, drawDebugColliders } from './renderer.js';
import {
  ball, resetBallToPlayer, updateBall, checkBallPlayerCollisions, drawBall
} from './ball.js';
import {
  obstacles, checkObstacleCollisions, checkPlayerPlatformLanding, drawObstacles, resetObstacles,
  updateProceduralObstacles, updateProceduralBirds, switchArena, activeArenaId,
  customObstacles, OBSTACLE_PALETTE, getObstacleDef, clearCustomObstacles, undoCustomObstacle,
  drawSingleObstacleByType, arenaScore, arena1State, ARENA_PLATFORMS, setActiveBot,
  calculateObstaclePlacement, findSupportingSurface, isBottomAnchored, normalizeObstacleType,
  updateMovableObstacles, resetArena
} from './obstacles.js';
import { CLASSES } from './classes/index.js';
import { bot, botKeys, updateBotBrain, getActiveBots, balanceBotClasses } from './bot.js';
import { WEAPONS, updateBullets, drawBullets, shootWeapon, getMuzzlePosition, reloadWeapon, getWeaponAmmo, clearBulletCasings, drawSniperLaserSight } from './weapons.js';
import {
  remotePlayer, networkState, initNetwork,
  sendPlayerState, sendBallState, sendShootEvent,
  sendObstacleAdd, sendObstacleRemove, sendObstacleClear, sendObstacleUndo,
  sendArenaSwitch, updateRemotePlayer,
  isChatActive, openChat, closeChat, updateCursorVisibility
} from './network.js';
import {
  leftStick, rightStick, btnCluster, pockets,
  updateButtonLayout, updateMobileControlStates,
  handleDynamicActionButtonPress, handleSlideProneButtonPress, triggerRightStickKick,
  checkRightStickFlickOrTap
} from './mobileControls.js';
import { uiManager, playUiClick, playUiHover, playUiPause, playUiResume } from './uiManager.js';
import { recordKill, recordDeath } from './progression.js';
import { updateDeathmatch } from './deathmatch/index.js';
import { CLASS_CARDS, getClassCardRects, getHoveredClassCard, drawClassSelectModal } from './ui/classSelectModal.js';
import {
  editorState,
  initObstacleEditorUI,
  renderEditorPalette,
  updateEditorPaletteHighlight,
  placeSelectedObstacle,
  handleEditorRightClick
} from './dev/obstacleEditor.js';
import {
  toggleDevPanel,
  syncDevBotButtonUI,
  syncDevArenaButtonUI,
  toggleArena,
  initDevMainControls,
  updateDevZoomLabel,
  initDevZoomUI,
  updateDevTouchButtonUI,
  toggleTouchControls,
  initTouchControlsDevUI,
  initModularGearDevUI
} from './dev/devPanel.js';
import {
  keys,
  mouseState,
  inputSession,
  resetInputState,
  gamepadState,
  triggerPlayerShoot,
  updatePlayerInputAndCombat,
  initAllInputHandlers
} from './input/index.js';

export {
  leftStick,
  rightStick,
  btnCluster,
  updateButtonLayout,
  keys,
  mouseState,
  inputSession,
  resetInputState,
  gamepadState,
  triggerPlayerShoot,
  CLASS_CARDS,
  getClassCardRects,
  getHoveredClassCard,
  drawClassSelectModal,
  editorState,
  initObstacleEditorUI,
  renderEditorPalette,
  updateEditorPaletteHighlight,
  toggleDevPanel,
  syncDevBotButtonUI,
  syncDevArenaButtonUI,
  toggleArena,
  updateDevZoomLabel,
  initDevZoomUI,
  updateDevTouchButtonUI,
  toggleTouchControls,
  initTouchControlsDevUI,
  initModularGearDevUI
};

if (typeof window !== 'undefined') {
  window.updateButtonLayout = updateButtonLayout;
  window.leftStick = leftStick;
  window.rightStick = rightStick;
  window.btnCluster = btnCluster;
}

const canvasEl = document.getElementById('game');
initCanvas(canvasEl);
if (canvas) {
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
} else if (canvasEl) {
  canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());
}
resize(player);
updateButtonLayout(W, H);
setActiveBot(bot);
if (typeof window !== 'undefined') {
  window.getActiveBots = getActiveBots;
}
// Pełna inicjalizacja aktywnej areny ze startowego adresu URL (?arena=3 / ?arena=2 / arena-1)
const initialArena = getActiveArena();
const initialArenaId = initialArena?.id || 'arena-1';
switchArena(initialArenaId, player, getActiveBots(), ball);
window.activeArenaId = activeArenaId;
syncDevArenaButtonUI();
syncDevBotButtonUI();
camera.targetX = player.x - (camera.viewWidth || (W / camera.zoom)) / 2;
camera.x = camera.targetX;
camera.targetY = player.y - (camera.viewHeight || (H / camera.zoom)) * 0.72;
camera.y = camera.targetY;
clampCamera();

window.addEventListener('resize', () => {
  resize(player);
  updateButtonLayout(W, H);
});

export const BIOME_TELEPORT_TARGETS = {
  STADIUM: 0,
  DESERT: 800,
  WINTER: 1600,
  JUNGLE: 2400,
  HELL: 3200
};

export function teleportToDistance(meters) {
  const targetX = START_X + (meters * 14);
  const isA3 = (activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY');
  const floorY = isA3 ? 1200 : GROUND_Y;

  player.x = targetX;
  player.y = floorY - player.h;
  player.onGround = true;
  player.currentGroundY = floorY;
  player.vx = 0;
  player.vy = 0;
  player.isJumping = false;
  player.isSliding = false;
  player.isIntro = false;
  player.isCharging = false;
  player.isStickCharging = false;
  player.isJumpCharging = false;
  player.kickState = 'IDLE';
  player.gaitMode = 'IDLE';
  inputSession.isJetpackActive = false;
  inputSession.jetpackAirborneSession = false;
  leftStick.jetpackAirborneSession = false;

  ball.x = targetX + (30 * (player.facing || 1));
  ball.y = floorY - ball.radius;
  ball.vx = 0;
  ball.vy = 0;
  ball.spin = 0;
  ball.trail = [];

  camera.targetX = player.x - (camera.viewWidth || (W / camera.zoom)) / 2;
  camera.x = camera.targetX;
  camera.targetY = GROUND_Y - (camera.viewHeight || (H / camera.zoom)) * 0.72;
  camera.y = camera.targetY;
  clampCamera();

  clearDesertSandstorm();
  clearWinterBlizzard();
  clearGore();
  clearBulletCasings();

  resetObstacles();
  updateProceduralObstacles(targetX);
  updateProceduralBirds(targetX, GROUND_Y);
  updateDistance(targetX);
}

export function devSetClass(target) {
  let targetClass = null;
  if (typeof target === 'object') targetClass = target;
  else if (typeof target === 'string') targetClass = CLASSES[target.toUpperCase()];
  else if (typeof target === 'number') {
    const classKeys = Object.keys(CLASSES);
    targetClass = CLASSES[classKeys[target % classKeys.length]];
  }

  if (targetClass) {
    setPlayerClass(targetClass);
  }
}

// Bezpieczne pobieranie granic areny z fallbackiem (Safe Arena Bounds Clamping Fallback)
export const arenaLeft = (typeof world !== 'undefined' && world?.bounds?.minX !== undefined)
  ? world.bounds.minX
  : (typeof ARENA_LEFT !== 'undefined' ? ARENA_LEFT : 0);

export const arenaRight = (typeof world !== 'undefined' && world?.bounds?.maxX !== undefined)
  ? world.bounds.maxX
  : (typeof ARENA_RIGHT !== 'undefined' ? ARENA_RIGHT : (typeof ARENA_WIDTH !== 'undefined' ? ARENA_WIDTH : 2400));

window.teleportToDistance = teleportToDistance;
window.devSetClass = devSetClass;
window.setPlayerClass = setPlayerClass;
window.arenaLeft = arenaLeft;
window.arenaRight = arenaRight;
window.world = (typeof world !== 'undefined' && world) ? world : {
  bounds: { minX: arenaLeft, maxX: arenaRight, arenaWidth: arenaRight - arenaLeft }
};
window.camera = (typeof camera !== 'undefined') ? camera : null;
window.resetArena = resetArena;
window.throwTacticalGrenade = () => throwTacticalGrenade(player);

export function startRound() {
  resetArena();
  if (player) {
    player.hp = player.maxHp || player.currentClass?.stats?.hp || 100;
    player.isDead = false;
  }
  if (bot && bot.active) {
    bot.hp = bot.maxHp || bot.currentClass?.stats?.hp || 100;
    bot.isDead = false;
  }
  resetBallToPlayer(player, GROUND_Y);
}
window.startRound = startRound;

// ==========================================
// STAN GRY I SYSTEM WYBORU KLAS POSTACI
// ==========================================
export const GAME_STATE = {
  current: 'MENU', // 'MENU' | 'PLAYING' | 'SETTINGS' | 'PAUSED' | 'ARENA_SELECT' | 'CLASS_SELECT'
  previous: 'MENU'
};

export let gameState = GAME_STATE.current;

export function setGameState(newState) {
  if (GAME_STATE.current === newState) return;
  GAME_STATE.previous = GAME_STATE.current;
  GAME_STATE.current = newState;
  gameState = newState;
  resetInputState();
  if (typeof window !== 'undefined' && window.uiManager) {
    window.uiManager.syncUI(newState);
  }
  updateCursorVisibility();
}
if (typeof window !== 'undefined') {
  window.setGameState = setGameState;
  window.GAME_STATE = GAME_STATE;
  window.ARENA_CONFIGS = ARENA_CONFIGS;
}

export function selectPlayerClass(targetClass) {
  let cls = targetClass;
  if (typeof targetClass === 'string') {
    cls = CLASSES[targetClass.toUpperCase()] || CLASSES[targetClass];
  }
  if (!cls) cls = CLASSES.AERO;

  setPlayerClass(cls, player);
  if (typeof uiManager !== 'undefined' && typeof uiManager.applyAppearanceForClass === 'function') {
    uiManager.applyAppearanceForClass(cls.id, player);
  }
  const activeBots = (typeof getActiveBots === 'function') ? getActiveBots() : (bot.active ? [bot] : []);
  balanceBotClasses(player, activeBots);
  setGameState('PLAYING');

  // Reset i respawn gracza po zatwierdzeniu wyboru klasy
  player.isDead = false;
  player.deathTimer = 0;
  player.hp = player.currentClass?.stats?.hp || 100;
  player.maxHp = player.hp;

  const currentArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
  if (currentArena && Array.isArray(currentArena.spawns) && currentArena.spawns[0]) {
    player.x = currentArena.spawns[0].x;
    player.y = currentArena.spawns[0].y;
  } else {
    player.x = START_X;
    player.y = GROUND_Y - player.h;
  }
  if (typeof window !== 'undefined' && window.location) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('spawnX')) player.x = Number(urlParams.get('spawnX'));
    if (urlParams.has('spawnY')) player.y = Number(urlParams.get('spawnY'));
  }

  player.vx = 0;
  player.vy = 0;
  player.airVx = 0;
  player.isJumping = false;
  player.isSliding = false;
  player.isIntro = false;
  player.onGround = true;
  player.currentGroundY = player.y + player.h;
  player.jetFuel = player.jetMax || 100;

  resetBallToPlayer(player, GROUND_Y);

  if (canvas && canvas.parentElement) {
    canvas.parentElement.classList.remove('cursor-visible');
  }
  if (canvas) canvas.style.cursor = 'none';

  if (camera) {
    camera.targetX = player.x - (camera.viewWidth || (W / (camera.zoom || 1))) / 2;
    camera.x = camera.targetX;
    camera.targetY = player.y - (camera.viewHeight || (H / (camera.zoom || 1))) * 0.72;
    camera.y = camera.targetY;
  }
}
window.selectPlayerClass = selectPlayerClass;

export function openClassSelect() {
  setGameState('CLASS_SELECT');
  if (canvas && canvas.parentElement) {
    canvas.parentElement.classList.add('cursor-visible');
  }
  if (canvas) canvas.style.cursor = 'default';
}
window.openClassSelect = openClassSelect;

const mpModal = document.getElementById('mp-modal') || document.getElementById('multi-panel') || document.querySelector('.mp-modal');

// Inicjalizacja narzędzi deweloperskich, sieci i urządzeń wejścia
initDevMainControls({ teleportToDistance, devSetClass });
initObstacleEditorUI();
initDevZoomUI();
initTouchControlsDevUI();
initModularGearDevUI();
initNetwork();

initAllInputHandlers({
  GAME_STATE,
  setGameState,
  selectPlayerClass,
  teleportToDistance,
  BIOME_TELEPORT_TARGETS,
  devSetClass,
  toggleDevPanel,
  toggleArena
});

function drawCrosshair(ctx, x, y, customCol) {
  if (typeof x !== 'number' || isNaN(x)) return;

  // Ukryj celownik podczas rzutu granatem lub gdy broń jest schowana
  if (player.throwAnim && player.throwAnim.active) return;
  if (player.isHolstered || !player.currentWeapon || (typeof player.holsterWeight === 'number' && player.holsterWeight >= 0.5)) return;

  // Na urządzeniach dotykowych ukryj celownik każdej broni, gdy prawy drążek jest nieużywany lub w trybie granatu
  if (isTouchDevice) {
    const isAimingWithStick = rightStick && rightStick.active && (typeof rightStick.power === 'number' ? rightStick.power > 0.05 : true) && rightStick.armedMode !== 'GRENADE';
    if (!isAimingWithStick) return;
  }

  const col = customCol || '#ef4444';

  const kick = player.weaponKickback || 0;
  const rise = player.muzzleRise || 0;
  const spreadGap = Math.min(18, 4 + kick * 1.5 + rise * 16);

  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
  ctx.shadowBlur = 4;

  ctx.beginPath();
  ctx.arc(x, y, 7 + spreadGap * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - spreadGap - 7, y); ctx.lineTo(x - spreadGap, y);
  ctx.moveTo(x + spreadGap, y); ctx.lineTo(x + spreadGap + 7, y);
  ctx.moveTo(x, y - spreadGap - 7); ctx.lineTo(x, y - spreadGap);
  ctx.moveTo(x, y + spreadGap); ctx.lineTo(x, y + spreadGap + 7);
  ctx.stroke();

  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function update() {
  const isDeathmatch = (
    activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X' ||
    activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY' ||
    (ball && !ball.active)
  );

  const isA3Active = (activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY');
  const isA2Active = (activeArenaId === 'ARENA_2' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'ARENA_2_SECTOR_X');
  const effectiveGroundY = isA2Active ? 1600 : (isA3Active ? 1200 : GROUND_Y);

  if (consumeHitstop()) {
    updateCamera(player, isDeathmatch ? null : ball);
    return;
  }

  // Obsługa maszyny stanów: PAUSED, MENU, SETTINGS
  if (GAME_STATE.current === 'PAUSED') {
    return; // Pełna pauza fizyki i animacji gry
  }

  if (GAME_STATE.current === 'MENU' || GAME_STATE.current === 'SETTINGS' || GAME_STATE.current === 'CREATOR' || GAME_STATE.current === 'ARENA_SELECT') {
    mouseState.lmbDown = false;
    mouseState.rmbDown = false;
    updateCamera(player, isDeathmatch ? null : ball, { disableAimLead: true });
    updateParticles();
    return;
  }

  // Stan wyboru klasy: pauzujemy fizykę gracza, botów i piłki (kompatybilność wsteczna)
  if (gameState === GAME_STATES.CLASS_SELECT) {
    if (canvas.parentElement && !canvas.parentElement.classList.contains('cursor-visible')) {
      canvas.parentElement.classList.add('cursor-visible');
    }
    const hoveredCard = getHoveredClassCard(mouseState.screenX, mouseState.screenY);
    canvas.style.cursor = hoveredCard ? 'pointer' : 'default';

    mouseState.lmbDown = false;
    mouseState.rmbDown = false;

    // Ambientowe tło i ruch kamery bez symulacji fizyki
    updateCamera(player, isDeathmatch ? null : ball, { disableAimLead: true });
    updateParticles();
    return;
  }

  // Wymuszenie stanu kursora systemowego w menu DEV / MULTI / CZAT
  const mpModalEl = document.getElementById('mp-modal');
  const devMenuEl = document.getElementById('dev-menu');
  const isMpOpen = mpModalEl && !mpModalEl.classList.contains('mp-modal-hidden');
  const isDevOpen = devMenuEl && !devMenuEl.classList.contains('dev-menu-hidden');

  if (isMpOpen || isDevOpen || isChatActive) {
    if (canvas.style.cursor !== 'default') canvas.style.cursor = 'default';
    if (canvas.parentElement && !canvas.parentElement.classList.contains('cursor-visible')) {
      canvas.parentElement.classList.add('cursor-visible');
    }
    mouseState.lmbDown = false;
    mouseState.rmbDown = false;
  } else {
    if (canvas.style.cursor !== 'none') canvas.style.cursor = 'none';
    if (canvas.parentElement && canvas.parentElement.classList.contains('cursor-visible')) {
      canvas.parentElement.classList.remove('cursor-visible');
    }
  }

  // Przetwarzanie wejścia gracza (celowanie, strzał, przeładowanie, jetpack, timery drążków, pad)
  updatePlayerInputAndCombat(activeArenaId);

  if (remotePlayer && remotePlayer.active) {
    remotePlayer.groundY = GROUND_Y;
    remotePlayer.currentGroundY = GROUND_Y;

    const rSpeed = Math.abs(remotePlayer.vx || 0);
    if (rSpeed > 0.1 && !remotePlayer.isJumping) {
      remotePlayer.stridePhase = (remotePlayer.stridePhase || 0) + rSpeed * 0.04;
    }
    updateRemotePlayer(GROUND_Y);
  }

  const activeBots = (typeof getActiveBots === 'function') ? getActiveBots() : (bot.active ? [bot] : []);
  const mainMeleeTargets = [...activeBots, remotePlayer.active ? remotePlayer : null].filter(Boolean);
  updateMobileControlStates(player, leftStick, btnCluster);
  updatePlayer(keys, leftStick, effectiveGroundY, isDeathmatch ? null : ball, spawnGrass, player, mainMeleeTargets);
  sendPlayerState(player);

  updateParticles();
  updateJetpackParticles();
  updateMovableObstacles(effectiveGroundY);
  updateGore(effectiveGroundY, ARENA_PLATFORMS, customObstacles);

  const headEntities = [player, ...activeBots];
  if (remotePlayer.active) headEntities.push(remotePlayer);
  updateSeveredHeads(headEntities, effectiveGroundY, ARENA_PLATFORMS);

  // Aktualizacja cyklu życia specyficznego dla aktywnej areny (np. spadające skały, łańcuchy, wózki)
  const activeArena = getActiveArena();
  activeArena?.update?.((FRAME_DURATION / 1000) || (1 / 60), headEntities, isDeathmatch ? null : ball);

  if (!isDeathmatch) {
    if (networkState.isHost || !networkState.isConnected) {
      updateBall(effectiveGroundY);
      checkBallPlayerCollisions(player, effectiveGroundY, spawnGrass);
      checkPlayerPlatformLanding(player, effectiveGroundY);
      if (remotePlayer.active) {
        checkBallPlayerCollisions(remotePlayer, effectiveGroundY, spawnGrass);
        checkPlayerPlatformLanding(remotePlayer, effectiveGroundY);
      }
      checkObstacleCollisions(ball, effectiveGroundY, null, null);
      sendBallState(ball);
    } else {
      // Klient – autorytatywna pozycja piłki z sieci P2P
      checkBallPlayerCollisions(player, effectiveGroundY, spawnGrass);
      checkPlayerPlatformLanding(player, effectiveGroundY);
      if (remotePlayer.active) {
        checkBallPlayerCollisions(remotePlayer, effectiveGroundY, spawnGrass);
        checkPlayerPlatformLanding(remotePlayer, effectiveGroundY);
      }
      checkObstacleCollisions(ball, effectiveGroundY, null, null);
    }
  } else {
    // W trybie Team Deathmatch (Arena 2 & 3) piłka jest całkowicie wycofana z gry
    if (ball.active) {
      ball.active = false;
      ball.x = -9999;
      ball.y = -9999;
      ball.vx = 0;
      ball.vy = 0;
    }
    checkPlayerPlatformLanding(player, effectiveGroundY);
    if (remotePlayer.active) {
      checkPlayerPlatformLanding(remotePlayer, effectiveGroundY);
    }
    checkObstacleCollisions(null, effectiveGroundY, null, null);

    // Zliczanie fragów poza dedykowanym modułem Deathmatch (Areny 2 i 3 są obsługiwane przez updateDeathmatch)
    if (!isA2Active && !isA3Active) {
      if (player.isDead) {
        if (!player._fragRecorded) {
          arenaScore.orange++;
          recordDeath();
          player._fragRecorded = true;
        }
      } else {
        player._fragRecorded = false;
      }

      for (const b of activeBots) {
        if (b.isDead) {
          if (!b._fragRecorded) {
            arenaScore.cyan++;
            recordKill();
            b._fragRecorded = true;
          }
        } else {
          b._fragRecorded = false;
        }
      }

      if (remotePlayer.active) {
        if (remotePlayer.isDead) {
          if (!remotePlayer._fragRecorded) {
            arenaScore.cyan++;
            recordKill();
            remotePlayer._fragRecorded = true;
          }
        } else {
          remotePlayer._fragRecorded = false;
        }
      }
    }
  }

  // Rejestracja zgonu gracza poza trybem Deathmatch (np. kwas w Arenie 2)
  if (!isDeathmatch) {
    if (player.isDead) {
      if (!player._fragRecorded) {
        recordDeath();
        player._fragRecorded = true;
      }
    } else {
      player._fragRecorded = false;
    }
  }

  // RESET SESJI POWIETRZNEJ JETPACKA DOPIERO PO WYLĄDOWANIU
  const currentFloor = player.currentGroundY || GROUND_Y;
  const isPlayerGrounded = !player.isJumping && (player.y >= currentFloor - player.h - 3);

  if (isPlayerGrounded || player.isDead) {
    inputSession.jetpackAirborneSession = false;
    if (leftStick) {
      leftStick.jetpackAirborneSession = false;
      leftStick.isJetpacking = false;
      leftStick.waitingForJetpackTap = false;
      leftStick.jetpackWindowTimer = 0;
    }
    inputSession.isJetpackActive = false;
    player.isJetpacking = false;
  }

  const combatants = [player, ...activeBots];
  if (remotePlayer.active) combatants.push(remotePlayer);

  for (const b of activeBots) {
    updateBotBrain(isDeathmatch ? null : ball, player, effectiveGroundY, spawnGrass, b, combatants);
    if (!isDeathmatch) {
      checkBallPlayerCollisions(b, effectiveGroundY, spawnGrass);
    }
    checkPlayerPlatformLanding(b, effectiveGroundY);
  }

  updateBullets(effectiveGroundY, obstacles, isDeathmatch ? null : ball, combatants);
  updateProjectiles(effectiveGroundY, ARENA_PLATFORMS, customObstacles, combatants, isDeathmatch ? null : ball);

  updateCamera(player, isDeathmatch ? null : ball, {
    disableAimLead: !!(editorState?.active || isChatActive)
  });
  if (isA2Active || isA3Active) {
    updateDeathmatch(1 / 60, player, activeBots, remotePlayer, arenaScore);
  }
  if (!isDeathmatch) {
    updateDistance(ball.x);
  }
}

let hasDismissedLoading = false;
function dismissLoadingOverlay() {
  if (hasDismissedLoading) return;
  hasDismissedLoading = true;
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.display = 'none';
    try { overlay.remove(); } catch (_) {}
  }
}

function draw() {
  dismissLoadingOverlay();
  ctx.clearRect(0, 0, W, H);
  renderArenaBackground(ctx, camera);

  ctx.save();
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  const worldLeft = camera.x;
  const worldRight = camera.x + (camera.viewWidth || (W / camera.zoom));
  const worldWidth = worldRight - worldLeft;

  const isArena2Active = (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X');
  const isArena3Active = (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3');
  if (!isArena2Active && !isArena3Active) {
    drawGround(ctx, worldLeft, worldWidth);
  }
  drawParticles(ctx);
  drawDistanceMarkers(ctx, worldLeft, worldRight);
  drawObstacles(ctx, GROUND_Y);

  drawBloodDecals(ctx);

  if (editorState.active) {
    if (editorState.snapToGrid) {
      ctx.save();
      const step = editorState.gridSize;
      const startX = Math.floor(worldLeft / step) * step;
      const endX = Math.ceil(worldRight / step) * step;
      const startY = Math.floor((camera.y - H / camera.zoom - GROUND_Y) / step) * step + GROUND_Y;
      const endY = Math.ceil((camera.y + H / camera.zoom - GROUND_Y) / step) * step + GROUND_Y;

      // Punkty siatki wyrównane do linii bazowej gruntu (GROUND_Y)
      ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
      for (let gx = startX; gx <= endX; gx += step) {
        for (let gy = startY; gy <= endY; gy += step) {
          if (gy === GROUND_Y) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.50)';
            ctx.fillRect(gx - 1.5, gy - 1.5, 3, 3);
            ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
          } else {
            ctx.fillRect(gx - 1, gy - 1, 2, 2);
          }
        }
      }
      ctx.restore();
    }

    if (editorState.selectedType) {
      const def = getObstacleDef(editorState.selectedType);
      if (def) {
        const worldX = camera.x + mouseState.screenX / camera.zoom;
        const worldY = camera.y + mouseState.screenY / camera.zoom;
        const placement = calculateObstaclePlacement(def, worldX, worldY, {
          snapToGrid: editorState.snapToGrid,
          gridSize: editorState.gridSize,
          groundY: GROUND_Y,
          surfaceSnapActive: editorState.surfaceSnap,
          snapThreshold: editorState.snapThreshold
        });

        const px = placement.x;
        const py = placement.y;
        const w = placement.w;
        const h = placement.h;
        const isSnapped = placement.isSnappedToSurface;

        ctx.save();
        ctx.globalAlpha = 0.65;
        drawSingleObstacleByType(ctx, def.type, px, py, w, h, GROUND_Y);

        ctx.strokeStyle = isSnapped ? '#10b981' : '#00e5ff';
        ctx.shadowColor = isSnapped ? '#10b981' : '#00e5ff';
        ctx.shadowBlur = isSnapped ? 12 : 8;
        ctx.lineWidth = isSnapped ? 2.2 : 1.8;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(px - 2, py - 2, w + 4, h + 4);
        ctx.setLineDash([]);

        // Efekt podglądu przylegania do podłoża / platformy (Bottom Anchor Contact)
        if (isSnapped) {
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(px - 3, py + h);
          ctx.lineTo(px + w + 3, py + h);
          ctx.stroke();
        }

        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = isSnapped ? '#34d399' : '#00e5ff';
        ctx.textAlign = 'center';
        const magnetBadge = isSnapped ? ` [SNAP: ${placement.surfaceName || 'POWIERZCHNIA'}]` : '';
        ctx.fillText(`${def.name} (${w}x${h})${magnetBadge}`, px + w / 2, py - 6);
        ctx.restore();
      }
    }
  }

  drawBullets(ctx);
  drawProjectiles(ctx);
  const activeBots = (typeof getActiveBots === 'function') ? getActiveBots() : (bot.active ? [bot] : []);
  drawSeveredHeads(ctx, [player, ...activeBots, ...(remotePlayer.active ? [remotePlayer] : [])]);
  drawJetpackParticles(ctx);

  // Celownik laserowy snajperki Barrett .50 w stylu Soldat
  const isAimingWithStick = rightStick && rightStick.active && (typeof rightStick.power === 'number' ? rightStick.power > 0.05 : true) && rightStick.armedMode !== 'GRENADE';
  const isThrowingGrenade = !!(player.throwAnim && player.throwAnim.active);
  const isWeaponHolstered = !!(player.isHolstered || !player.currentWeapon || (typeof player.holsterWeight === 'number' && player.holsterWeight >= 0.5));

  const shouldDrawPlayerSniperLaser = !isThrowingGrenade && !isWeaponHolstered && (!isTouchDevice || isAimingWithStick);

  if (shouldDrawPlayerSniperLaser) {
    drawSniperLaserSight(ctx, player);
  }
  for (const b of activeBots) {
    drawSniperLaserSight(ctx, b);
  }
  if (remotePlayer.active) {
    drawSniperLaserSight(ctx, remotePlayer);
  }

  // Trajektoria balistyczna rzutu bronią miotaną (granatem) - białe kropki Soldat
  const isStickGrenadeAim = !!(rightStick && rightStick.active && rightStick.armedMode === 'GRENADE' && (typeof rightStick.power === 'number' ? rightStick.power > 0.03 : true));
  const isAnimGrenadeAim = !!(player.throwAnim && player.throwAnim.active && player.throwAnim.aiming);

  if (!player.isDead && (isStickGrenadeAim || isAnimGrenadeAim)) {
    const throwPower = isAnimGrenadeAim
      ? (player.throwAnim.power || 1.0)
      : Math.min(1.8, Math.max(0.6, (rightStick.power || 0.5) * 1.3));
    drawGrenadeTrajectory(ctx, player, player.aimX, player.aimY, throwPower, GROUND_Y);
  }

  drawPlayer(ctx, GROUND_Y, player);

  const playerTeam = player.team || 'CYAN';

  if (remotePlayer.active) {
    drawPlayer(ctx, GROUND_Y, remotePlayer);

    // Identyfikacja drużynowa: sojusznicy mają zawsze niebieski nick, rywale nie mają nic
    const remoteTeam = remotePlayer.team || (networkState.isHost ? 'ORANGE' : 'CYAN');
    const isAlly = (remoteTeam === playerTeam);

    if (isAlly) {
      ctx.save();
      ctx.font = 'bold 10px Rajdhani, monospace';
      ctx.textAlign = 'center';
      const allyColor = '#00e5ff';
      const allyName = remotePlayer.name || (networkState.isHost ? 'GRACZ 2' : 'HOST');
      ctx.fillStyle = allyColor;
      ctx.shadowColor = 'rgba(0, 229, 255, 0.6)';
      ctx.shadowBlur = 4;
      const tagX = remotePlayer.head ? remotePlayer.head.x : (remotePlayer.x + remotePlayer.w / 2);
      const tagY = remotePlayer.head ? (remotePlayer.head.y - 26) : (remotePlayer.y - 28);
      ctx.fillText(allyName, tagX, tagY);
      ctx.restore();
    }
  }

  for (const b of activeBots) {
    drawPlayer(ctx, GROUND_Y, b);

    // Identyfikacja drużynowa: sojusznicy mają zawsze niebieski nick, rywale nie mają nic
    const botTeam = b.team || 'ORANGE';
    const isAlly = (botTeam === playerTeam);

    if (isAlly) {
      ctx.save();
      ctx.font = 'bold 10px Rajdhani, monospace';
      ctx.textAlign = 'center';
      const allyColor = '#00e5ff';
      const allyName = b.name || 'SGT. STRIKER';
      ctx.fillStyle = allyColor;
      ctx.shadowColor = 'rgba(0, 229, 255, 0.6)';
      ctx.shadowBlur = 4;
      const botTagX = b.head ? b.head.x : (b.x + b.w / 2);
      const botTagY = b.head ? (b.head.y - 26) : (b.y - 26);
      ctx.fillText(allyName, botTagX, botTagY);
      ctx.restore();
    }
  }

  const isDeathmatch = (
    activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X' ||
    activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY' ||
    (ball && !ball.active)
  );

  if (!isDeathmatch) {
    drawBall(ctx);
  }

  const devMenuEl = document.getElementById('dev-menu');
  const modalEl = document.getElementById('mp-modal') || mpModal;
  const isDevOpenForCrosshair = devMenuEl && !devMenuEl.classList.contains('dev-menu-hidden');
  const isMpOpenForCrosshair = modalEl && !modalEl.classList.contains('mp-modal-hidden');

  let shouldDrawCrosshair = !player.isDead && !isDevOpenForCrosshair && !isMpOpenForCrosshair && !isChatActive && GAME_STATE.current === 'PLAYING';
  if (isThrowingGrenade || isWeaponHolstered || (rightStick && rightStick.armedMode === 'GRENADE')) shouldDrawCrosshair = false;
  if (isTouchDevice && !isAimingWithStick) shouldDrawCrosshair = false;

  if (shouldDrawCrosshair) {
    drawCrosshair(ctx, player.aimX, player.aimY);
  }

  // Renderowanie elementów areny na pierwszym planie (np. łańcuchy, ołtarz, stemple)
  renderArenaForeground(ctx, camera);

  if (DEBUG_COLLIDERS && typeof drawDebugColliders === 'function') {
    drawDebugColliders(ctx, GROUND_Y, player);
  }

  ctx.restore();

  if (DEBUG_COLLIDERS) {
    ctx.save();
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText('DEBUG COLLIDERS ON [F1 / ~ to toggle]', 16, 24);
    ctx.restore();
  }

  if (GAME_STATE.current === 'PLAYING') {
    const inKickRange = (!isDeathmatch && ball && typeof isBallInKickReach === 'function') ? isBallInKickReach(player, ball) : false;
    drawHUD(ctx, player, leftStick, btnCluster, rightStick, isDeathmatch ? null : ball, inKickRange, { activeArenaId, arenaScore, arena1State, bot, remotePlayer });
  } else if (GAME_STATE.current === 'PAUSED') {
    drawHUD(ctx, player, leftStick, btnCluster, rightStick, isDeathmatch ? null : ball, false, { activeArenaId, arenaScore, arena1State, bot, remotePlayer });
  } else if (gameState === GAME_STATES.CLASS_SELECT) {
    drawClassSelectModal(ctx, mouseState.screenX, mouseState.screenY);
  }

  if (editorState.active) {
    ctx.save();
    const bannerW = 500;
    const bannerH = 26;
    const bannerX = (W - bannerW) / 2;
    const bannerY = H - 38;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
    ctx.lineWidth = 1.2;
    if (ctx.roundRect) ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 6);
    else ctx.rect(bannerX, bannerY, bannerW, bannerH);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 6;
    const currentToolLabel = editorState.selectedType ? `[NARZĘDZIE: ${getObstacleDef(editorState.selectedType)?.name || editorState.selectedType}]` : '[WYBIERZ PRZESZKODĘ Z MENU DEV]';
    ctx.fillText(`EDYTOR: ${currentToolLabel} | LPM: Postaw | PPM: Usuń/Anuluj | Ctrl+Z: Cofnij`, W / 2, bannerY + 17);
    ctx.restore();
  }
}

let lastTime = performance.now();
function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  const delta = now - lastTime;

  if (delta < FRAME_DURATION - 0.5) return;
  if (delta > 250) {
    lastTime = now;
  } else {
    lastTime += FRAME_DURATION;
    if (now - lastTime > FRAME_DURATION) lastTime = now;
  }

  update();
  draw();
}

if (typeof window !== 'undefined') {
  window.player = player;
  window.camera = camera;
  window.pockets = pockets;
  window.rightStick = rightStick;
  window.leftStick = leftStick;

  // Inicjalizacja interfejsu Menu Głównego, Ustawień oraz Pauzy
  uiManager.init({
    onStartGame: () => {
      setGameState('ARENA_SELECT');
    },
    onSelectArena: (arenaId) => {
      try {
        if (typeof window.switchArena === 'function') {
          window.switchArena(arenaId);
        }
      } catch (err) {
        console.error('[ARENA SWITCH ERROR]', err);
      }
      setGameState('CLASS_SELECT');
    },
    onBackToMenu: () => {
      setGameState('MENU');
    },
    onSelectClass: (classId) => {
      const cls = CLASSES[classId] || CLASSES.PLAYMAKER;
      selectPlayerClass(cls);
    },
    onOpenSettings: () => {
      setGameState('SETTINGS');
    },
    onCloseSettings: () => {
      setGameState(GAME_STATE.previous || 'MENU');
    },
    onOpenCreator: () => {
      setGameState('CREATOR');
    },
    onCloseCreator: () => {
      setGameState(GAME_STATE.previous || 'MENU');
    },
    onPause: () => {
      setGameState('PAUSED');
    },
    onResume: () => {
      setGameState('PLAYING');
    },
    onRestartRound: () => {
      startRound();
      setGameState('PLAYING');
    },
    onChangeClass: () => {
      setGameState('CLASS_SELECT');
    },
    onReturnToMenu: () => {
      startRound();
      setGameState('MENU');
    },
    getMatchInfo: () => {
      const arena = getActiveArena();
      const arenaName = (activeArenaId === 'ARENA_2' || activeArenaId === 'arena-2') ? 'Toksyczna Rafineria' :
                        (activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3') ? 'Tajemnicza Dżungla' :
                        (arena?.name || 'Neonowe Miasto');
      return `ARENA: ${arenaName.toUpperCase()} • KLASA: ${player.currentClass?.name || 'PLAYMAKER'}`;
    }
  });

  balanceBotClasses(player, (typeof getActiveBots === 'function') ? getActiveBots() : [bot]);

  if (window.location) {
    const urlParams = new URLSearchParams(window.location.search);
    const autostartClass = urlParams.get('class') || urlParams.get('autostart');
    if (autostartClass) {
      selectPlayerClass(CLASSES[String(autostartClass).toUpperCase()] || CLASSES.PLAYMAKER);
    } else {
      setGameState('MENU');
    }
    if (urlParams.has('breach')) {
      const bx = Number(urlParams.get('breach')) || 1400;
      setTimeout(() => {
        if (typeof window.carveBreach === 'function') {
          window.carveBreach(bx);
        }
      }, 300);
    }
  } else {
    setGameState('MENU');
  }
}

requestAnimationFrame(loop);
