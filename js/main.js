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
import { renderArenaBackground, renderArenaForeground, getActiveArena } from './renderer.js';
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
import { bot, botKeys, updateBotBrain } from './bot.js';
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
import { DEBUG_COLLIDERS, drawDebugColliders } from './renderer.js';
import { uiManager, playUiClick, playUiHover, playUiPause, playUiResume } from './uiManager.js';

export function triggerPlayerShoot(p, wep) {
  const muzzle = getMuzzlePosition(p, wep);
  const targetAimX = (typeof p.aimX === 'number' && !isNaN(p.aimX)) ? p.aimX : muzzle.aimX;
  const targetAimY = (typeof p.aimY === 'number' && !isNaN(p.aimY)) ? p.aimY : muzzle.aimY;
  const shootAngle = Math.atan2(targetAimY - muzzle.muzzleY, targetAimX - muzzle.muzzleX);
  p.aimAngle = shootAngle;
  const fired = shootWeapon(p, wep, muzzle.muzzleX, muzzle.muzzleY, shootAngle);
  if (fired) {
    sendShootEvent(wep.id, muzzle.muzzleX, muzzle.muzzleY, shootAngle);
  }
}

// =========================================================================
// STAN MYSZY I BLOKADA MENU KONTEKSTOWEGO
// =========================================================================
export const mouseState = {
  lmbDown: false,
  rmbDown: false,
  semiFired: false
};

window.addEventListener('contextmenu', (e) => e.preventDefault());

let jetpackAirborneSession = false;
let lastSPressTime = 0;

export { leftStick, rightStick, btnCluster, updateButtonLayout };
if (typeof window !== 'undefined') {
  window.updateButtonLayout = updateButtonLayout;
  window.leftStick = leftStick;
  window.rightStick = rightStick;
  window.btnCluster = btnCluster;
}

export const keys = {
  left: false,
  right: false,
  down: false,
  up: false,
  space: false,
  shift: false,
  slide: false,
  ctrl: false,
  crouch: false
};

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
// Pełna inicjalizacja aktywnej areny ze startowego adresu URL (?arena=3 / ?arena=2 / arena-1)
const initialArena = getActiveArena();
const initialArenaId = initialArena?.id || 'arena-1';
switchArena(initialArenaId, player, bot, ball);
window.activeArenaId = activeArenaId;
if (typeof syncDevArenaButtonUI === 'function') {
  syncDevArenaButtonUI();
}
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

import { initTouchInputHandlers } from './input/touchHandlers.js';

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
  isJetpackActive = false;
  jetpackAirborneSession = false;
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
    const keys = Object.keys(CLASSES);
    targetClass = CLASSES[keys[target % keys.length]];
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
    player.hp = 100;
    player.isDead = false;
  }
  if (bot && bot.active) {
    bot.hp = 100;
    bot.isDead = false;
  }
  resetBallToPlayer(player, GROUND_Y);
}
window.startRound = startRound;


// ==========================================
// STAN GRY I SYSTEM WYBORU KLAS POSTACI
// ==========================================
let mouseScreenX = 640;
let mouseScreenY = 360;

export const GAME_STATE = {
  current: 'MENU', // 'MENU' | 'PLAYING' | 'SETTINGS' | 'PAUSED' | 'ARENA_SELECT' | 'CLASS_SELECT'
  previous: 'MENU'
};

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

export let gameState = GAME_STATE.current;

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
  updateDevZoomLabel,
  initDevZoomUI,
  updateDevTouchButtonUI,
  toggleTouchControls,
  initTouchControlsDevUI,
  initModularGearDevUI
} from './dev/devPanel.js';

export {
  CLASS_CARDS,
  getClassCardRects,
  getHoveredClassCard,
  drawClassSelectModal,
  editorState,
  initObstacleEditorUI,
  renderEditorPalette,
  updateEditorPaletteHighlight,
  updateDevZoomLabel,
  initDevZoomUI,
  updateDevTouchButtonUI,
  toggleTouchControls,
  initTouchControlsDevUI,
  initModularGearDevUI
};

export function selectPlayerClass(targetClass) {
  let cls = targetClass;
  if (typeof targetClass === 'string') {
    cls = CLASSES[targetClass.toUpperCase()] || CLASSES[targetClass];
  }
  if (!cls) cls = CLASSES.AERO;

  setPlayerClass(cls, player);
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

const devPanelContainer = document.getElementById('dev-panel-container');
const devToggleBtn = document.getElementById('dev-toggle-btn');
const devMenu = document.getElementById('dev-menu');
const mpModal = document.getElementById('mp-modal') || document.getElementById('multi-panel') || document.querySelector('.mp-modal');

export function toggleDevPanel() {
  if (!devMenu) return;
  const isHidden = devMenu.classList.toggle('dev-menu-hidden');
  if (devToggleBtn) {
    if (isHidden) devToggleBtn.classList.remove('active');
    else devToggleBtn.classList.add('active');
  }
  updateCursorVisibility();
}
window.toggleDevPanel = toggleDevPanel;

let isDraggingDev = false;
let devDragStartX = 0;
let devDragStartY = 0;
let devPanelStartLeft = 0;
let devPanelStartTop = 0;
let devHasMoved = false;

if (devToggleBtn && devPanelContainer) {
  devToggleBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    isDraggingDev = true;
    devHasMoved = false;
    devDragStartX = e.clientX;
    devDragStartY = e.clientY;
    devPanelStartLeft = devPanelContainer.offsetLeft;
    devPanelStartTop = devPanelContainer.offsetTop;
    try { devToggleBtn.setPointerCapture(e.pointerId); } catch (err) { }
  });

  devToggleBtn.addEventListener('pointermove', (e) => {
    if (!isDraggingDev) return;
    e.stopPropagation();
    const dx = e.clientX - devDragStartX;
    const dy = e.clientY - devDragStartY;
    if (!devHasMoved && Math.hypot(dx, dy) >= 6) {
      devHasMoved = true;
    }
    if (devHasMoved) {
      const newLeft = devPanelStartLeft + dx;
      const newTop = devPanelStartTop + dy;
      const maxLeft = Math.max(10, window.innerWidth - devToggleBtn.offsetWidth - 10);
      const maxTop = Math.max(10, window.innerHeight - devToggleBtn.offsetHeight - 10);
      devPanelContainer.style.left = Math.max(8, Math.min(maxLeft, newLeft)) + 'px';
      devPanelContainer.style.top = Math.max(8, Math.min(maxTop, newTop)) + 'px';
    }
  });

  const handleDevPointerUp = (e) => {
    if (!isDraggingDev) return;
    e.stopPropagation();
    isDraggingDev = false;
    try { devToggleBtn.releasePointerCapture(e.pointerId); } catch (err) { }
    if (!devHasMoved) {
      toggleDevPanel();
    }
  };

  devToggleBtn.addEventListener('pointerup', handleDevPointerUp);
  devToggleBtn.addEventListener('pointercancel', handleDevPointerUp);

  devPanelContainer.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
}

document.querySelectorAll('.dev-btn[data-meters]').forEach((btn) => {
  const handler = (e) => {
    e.stopPropagation(); e.preventDefault();
    const meters = parseInt(btn.getAttribute('data-meters'), 10);
    if (!isNaN(meters)) teleportToDistance(meters);
  };
  btn.addEventListener('click', handler);
  btn.addEventListener('touchend', handler);
});

document.querySelectorAll('.dev-class-btn').forEach((btn) => {
  const handler = (e) => {
    e.stopPropagation(); e.preventDefault();
    const classId = btn.getAttribute('data-class');
    devSetClass(classId);
  };
  btn.addEventListener('click', handler);
  btn.addEventListener('touchend', handler);
});

// =========================================================================
// WŁĄCZANIE BOTA ORAZ PRZYCISK ZAMRAŻANIA BOTA (STANDSTILL)
// =========================================================================
const devBotToggleBtn = document.getElementById('dev-bot-toggle-btn');
let devBotFreezeBtn = document.getElementById('dev-bot-freeze-btn');

if (devBotToggleBtn) {
  const toggleBot = (e) => {
    e.stopPropagation();
    e.preventDefault();
    bot.active = !bot.active;
    if (bot.active) {
      devBotToggleBtn.textContent = '🤖 BOT: ON';
      devBotToggleBtn.style.background = 'rgba(168, 85, 247, 0.35)';
      devBotToggleBtn.style.borderColor = '#c084fc';
      devBotToggleBtn.style.color = '#ffffff';
      devBotToggleBtn.style.boxShadow = '0 0 12px rgba(168, 85, 247, 0.6)';

      bot.x = player.x + (player.facing || 1) * 350;
      bot.y = GROUND_Y - bot.h;
      bot.vx = 0;
      bot.vy = 0;
      bot.facing = -(player.facing || 1);
      bot.isJumping = false;
      bot.isSliding = false;
      bot.isCharging = false;
      bot.kickState = 'IDLE';
      bot.gaitMode = 'IDLE';
      bot.dropThroughTimer = 0;
      bot.airVx = 0;
    } else {
      devBotToggleBtn.textContent = '🤖 BOT: OFF';
      devBotToggleBtn.style.background = '';
      devBotToggleBtn.style.borderColor = '#a855f7';
      devBotToggleBtn.style.color = '#c084fc';
      devBotToggleBtn.style.boxShadow = '';
    }
  };
  devBotToggleBtn.addEventListener('click', toggleBot);
  devBotToggleBtn.addEventListener('touchend', toggleBot);
}

export function syncDevBotButtonUI() {
  const btn = document.getElementById('dev-bot-toggle-btn');
  if (!btn) return;
  if (bot.active) {
    btn.textContent = '🤖 BOT: ON';
    btn.style.background = 'rgba(168, 85, 247, 0.35)';
    btn.style.borderColor = '#c084fc';
    btn.style.color = '#ffffff';
    btn.style.boxShadow = '0 0 12px rgba(168, 85, 247, 0.6)';
  } else {
    btn.textContent = '🤖 BOT: OFF';
    btn.style.background = '';
    btn.style.borderColor = '#a855f7';
    btn.style.color = '#c084fc';
    btn.style.boxShadow = '';
  }
}

// Dynamiczne utworzenie przycisku zamrażania bota w panelu deweloperskim
if (!devBotFreezeBtn && devMenu) {
  devBotFreezeBtn = document.createElement('button');
  devBotFreezeBtn.className = 'dev-btn';
  devBotFreezeBtn.id = 'dev-bot-freeze-btn';
  devBotFreezeBtn.style.cssText = 'border-color: #eab308; color: #facc15; font-weight: 600; margin-left: 2px;';
  devBotFreezeBtn.textContent = '⏸️ BOT: RUCH';

  if (devBotToggleBtn && devBotToggleBtn.parentNode) {
    devBotToggleBtn.parentNode.insertBefore(devBotFreezeBtn, devBotToggleBtn.nextSibling);
  } else {
    devMenu.appendChild(devBotFreezeBtn);
  }
}

if (devBotFreezeBtn) {
  const toggleFreeze = (e) => {
    e.stopPropagation();
    e.preventDefault();
    bot.frozen = !bot.frozen;
    if (bot.frozen) {
      devBotFreezeBtn.textContent = '🛑 BOT: STOI';
      devBotFreezeBtn.style.background = 'rgba(234, 179, 8, 0.35)';
      devBotFreezeBtn.style.borderColor = '#facc15';
      devBotFreezeBtn.style.color = '#ffffff';
      devBotFreezeBtn.style.boxShadow = '0 0 10px rgba(234, 179, 8, 0.6)';
    } else {
      devBotFreezeBtn.textContent = '⏸️ BOT: RUCH';
      devBotFreezeBtn.style.background = '';
      devBotFreezeBtn.style.borderColor = '#eab308';
      devBotFreezeBtn.style.color = '#facc15';
      devBotFreezeBtn.style.boxShadow = '';
    }
  };
  devBotFreezeBtn.addEventListener('click', toggleFreeze);
  devBotFreezeBtn.addEventListener('touchend', toggleFreeze);
}

export function syncDevArenaButtonUI() {
  const devArenaBtn = document.getElementById('dev-arena-btn');
  if (!devArenaBtn) return;
  const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
  const curId = (curArena && curArena.id) ? curArena.id : (activeArenaId || window.activeArenaId);
  if (curId === 'arena-3' || curId === 'ARENA_3' || curId === 'ARENA_FOUNDRY') {
    devArenaBtn.textContent = '🌴 Arena: 3 (Dżungla)';
    devArenaBtn.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(16, 185, 129, 0.25))';
    devArenaBtn.style.borderColor = '#22c55e';
    devArenaBtn.style.color = '#86efac';
    devArenaBtn.style.boxShadow = '0 0 12px rgba(34, 197, 94, 0.45)';
  } else if (curId === 'arena-2' || curId === 'ARENA_2' || curId === 'ARENA_2_PANDORA' || curId === 'ARENA_2_SECTOR_X') {
    devArenaBtn.textContent = '🏭 Arena: 2 (Sektor X)';
    devArenaBtn.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(16, 185, 129, 0.25))';
    devArenaBtn.style.borderColor = '#f59e0b';
    devArenaBtn.style.color = '#fde68a';
    devArenaBtn.style.boxShadow = '0 0 12px rgba(245, 158, 11, 0.55)';
  } else {
    devArenaBtn.textContent = '🏟️ Arena: 1';
    devArenaBtn.style.background = '';
    devArenaBtn.style.borderColor = '#06b6d4';
    devArenaBtn.style.color = '#22d3ee';
    devArenaBtn.style.boxShadow = '';
  }
}

let lastArenaToggleTime = 0;
export const toggleArena = (e) => {
  if (e) {
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
    if (typeof e.preventDefault === 'function') e.preventDefault();
  }
  const now = performance.now();
  if (now - lastArenaToggleTime < 300) return;
  lastArenaToggleTime = now;

  let nextArena = 'ARENA_1';
  const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
  const curId = (curArena && curArena.id) ? curArena.id : (activeArenaId || window.activeArenaId);
  if (curId === 'arena-1' || curId === 'ARENA_1') {
    nextArena = 'ARENA_2';
  } else if (curId === 'arena-2' || curId === 'ARENA_2' || curId === 'ARENA_2_PANDORA' || curId === 'ARENA_2_SECTOR_X') {
    nextArena = 'ARENA_3';
  } else {
    nextArena = 'ARENA_1';
  }
  switchArena(nextArena, player, bot, ball);
  window.activeArenaId = activeArenaId;
  sendArenaSwitch(nextArena);
  syncDevArenaButtonUI();
  if (typeof uiManager !== 'undefined' && uiManager && typeof uiManager.updateMpArenaUI === 'function') {
    uiManager.updateMpArenaUI(nextArena);
  }
  camera.targetX = player.x - (camera.viewWidth || (W / camera.zoom)) / 2;
  camera.x = camera.targetX;
  camera.targetY = player.y - (camera.viewHeight || (H / camera.zoom)) * 0.72;
  camera.y = camera.targetY;
  clampCamera();
  if (editorState.active) {
    renderEditorPalette();
  }
};
window.toggleArena = toggleArena;
window.switchArena = (id) => {
  switchArena(id, player, bot, ball);
  window.activeArenaId = activeArenaId;
  sendArenaSwitch(id);
  syncDevArenaButtonUI();
  if (typeof uiManager !== 'undefined' && uiManager) {
    if (typeof uiManager.updateMpArenaUI === 'function') uiManager.updateMpArenaUI(id);
    if (typeof uiManager.updateArenaSelectUI === 'function') uiManager.updateArenaSelectUI(id);
  }
  camera.targetX = player.x - (camera.viewWidth || (W / camera.zoom)) / 2;
  camera.x = camera.targetX;
  camera.targetY = player.y - (camera.viewHeight || (H / camera.zoom)) * 0.72;
  camera.y = camera.targetY;
  clampCamera();
};

const devArenaBtn = document.getElementById('dev-arena-btn');
if (devArenaBtn) {
  devArenaBtn.addEventListener('click', toggleArena);
  devArenaBtn.addEventListener('touchend', toggleArena);
  syncDevArenaButtonUI();
}

initObstacleEditorUI();
initDevZoomUI();
initTouchControlsDevUI();
initModularGearDevUI();
initNetwork();

let jumpKeyPressed = false;
let lastWPressTime = 0;
let isJetpackActive = false;
const DOUBLE_TAP_WINDOW_MS = 300;
let ctrlPressStartTime = 0;
let ctrlWasToggledOnKeyDown = false;

export function resetInputState() {
  for (const k in keys) {
    keys[k] = false;
  }
  jumpKeyPressed = false;
  isJetpackActive = false;
  ctrlPressStartTime = 0;
  ctrlWasToggledOnKeyDown = false;
  if (player) {
    player.isJetpacking = false;
    player.crouchToggled = false;
    if (player.isCharging) {
      player.isCharging = false;
      player.chargePower = 0;
      player.kickPower = 0;
    }
  }
  mouseState.lmbDown = false;
  mouseState.rmbDown = false;
  mouseState.semiFired = false;
}

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

// Obsługa Keyboard Lock API w trybie pełnoekranowym (pełna blokada skrótów systemowych, w tym Ctrl+W)
async function requestKeyboardLock() {
  if (typeof navigator !== 'undefined' && navigator.keyboard && typeof navigator.keyboard.lock === 'function') {
    try {
      await navigator.keyboard.lock(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight', 'Space']);
    } catch (_) { }
  }
}

document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    requestKeyboardLock();
  }
});

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
  if (e.code === 'Escape' || (e.code === 'KeyP' && (GAME_STATE.current === 'PLAYING' || GAME_STATE.current === 'PAUSED'))) {
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
  if (GAME_STATE.current === 'CLASS_SELECT' || gameState === GAME_STATES.CLASS_SELECT) {
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
      e.code === 'KeyC' || e.code === 'KeyR' || e.code === 'KeyG' ||
      e.code === 'KeyB' || e.code === 'KeyZ' ||
      e.code === 'Space' ||
      (typeof e.code === 'string' && (e.code.startsWith('Arrow') || e.code.startsWith('Digit') || e.code.startsWith('Numpad')))
    );

    // Blokada kombinacji np. Ctrl+W/A/S/D oraz klawiszy modyfikatorów/sterujących (Spacja, Tab, Strzałki, Shift, Ctrl, Alt)
    if (isControlKey || (hasModifier && isGameKey)) {
      e.preventDefault();
    }
  }

  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;

  if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.key === 'Control') {
    e.preventDefault();
    if (!e.repeat) {
      ctrlPressStartTime = performance.now();
      ctrlWasToggledOnKeyDown = !!player.crouchToggled;
    }
    keys.ctrl = true;
    keys.crouch = true;
  }

  if (e.code === 'KeyS' || e.code === 'ArrowDown') {
    const now = performance.now();
    if (now - lastSPressTime < 280) {
      player.dropThroughTimer = 18;
    }
    lastSPressTime = now;
    keys.down = true;
  }

  if ((e.code === 'KeyW' || e.code === 'ArrowUp') && !jumpKeyPressed) {
    jumpKeyPressed = true;
    keys.up = true;

    // Klawisz W natychmiast podrywa postać do pionu
    player.isProne = false;
    player.isCrouching = false;
    player.crouchToggled = false;

    const isAirborne = (!player.onGround || player.isJumping || Math.abs(player.vy) > 0.5);

    if (isAirborne && player.jetpackKeyNeutralized && (player.jetFuel || 0) > 0) {
      // W POWIETRZU: uruchomienie jetpacka (tylko jeśli klawisz W został puszczony po wyskoku z ziemi)
      isJetpackActive = true;
      player.isJetpacking = true;
      jetpackAirborneSession = true;
    } else if (!player.isJumping && !player.isSliding && !player.isIntro) {
      // NA ZIEMI: normalny skok z podłoża (natychmiastowy)
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
    const meleeTargets = [bot.active ? bot : null, remotePlayer.active ? remotePlayer : null].filter(Boolean);
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
  if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') {
    if (!e.repeat && !player.isDead) {
      if (player.isHolstered) player.isHolstered = false;
      reloadWeapon(player, player.currentWeapon);
    }
  }
  if (e.code === 'KeyG') {
    if (gameState === GAME_STATES.PLAYING && !player.isDead) {
      if (!e.repeat) {
        prepareGrenadeThrow(player);
      }
    }
  }
  if (e.code === 'KeyB') {
    resetBallToPlayer(player, GROUND_Y);
  }

  if (e.code === 'Digit1' || e.code === 'Numpad1' || e.key === '1') {
    if (player.currentWeapon?.id === 'AK47' && !player.isHolstered) {
      player.isHolstered = true;
    } else {
      player.currentWeapon = WEAPONS.AK47;
      player.isHolstered = false;
    }
  } else if (e.code === 'Digit2' || e.code === 'Numpad2' || e.key === '2') {
    if (player.currentWeapon?.id === 'SHOTGUN' && !player.isHolstered) {
      player.isHolstered = true;
    } else {
      player.currentWeapon = WEAPONS.SHOTGUN;
      player.isHolstered = false;
    }
  } else if (e.code === 'Digit3' || e.code === 'Numpad3' || e.key === '3') {
    if (player.currentWeapon?.id === 'SNIPER' && !player.isHolstered) {
      player.isHolstered = true;
    } else {
      player.currentWeapon = WEAPONS.SNIPER;
      player.isHolstered = false;
    }
  } else if (e.code === 'Digit4' || e.code === 'Numpad4' || e.key === '4') {
    teleportToDistance(BIOME_TELEPORT_TARGETS.JUNGLE);
  } else if (e.code === 'Digit5' || e.code === 'Numpad5' || e.key === '5') {
    teleportToDistance(BIOME_TELEPORT_TARGETS.HELL);
  }

  if (e.code === 'Digit6' || e.code === 'Numpad6' || e.key === '6') devSetClass('RAPTOR');
  else if (e.code === 'Digit7' || e.code === 'Numpad7' || e.key === '7') devSetClass('STRIKER');
  else if (e.code === 'Digit8' || e.code === 'Numpad8' || e.key === '8') devSetClass('ENFORCER');

  if (e.code === 'Backquote' || e.key === '`' || e.key === '~') toggleDevPanel();

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

  if (e.code === 'Escape') {
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

window.addEventListener('keyup', (e) => {
  if (isChatActive) {
    resetInputState();
    return;
  }
  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;

  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;

  if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.key === 'Control') {
    const pressDuration = performance.now() - ctrlPressStartTime;
    keys.ctrl = false;
    keys.crouch = false;

    // Krótkie kliknięcie klawisza Ctrl (< 320 ms) przełącza stan kucania (Toggle Crouch)
    if (pressDuration < 320 && !player.isProne && !player.isSliding && !player.isJumping) {
      if (ctrlWasToggledOnKeyDown) {
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
    jumpKeyPressed = false;
    keys.up = false;
    player.jetpackKeyNeutralized = true;
    isJetpackActive = false;
    player.isJetpacking = false;
  }
  if (e.code === 'Space' || e.key === ' ') {
    keys.space = false;
    const meleeTargets = [bot.active ? bot : null, remotePlayer.active ? remotePlayer : null].filter(Boolean);
    executeReleaseKick(ball, player, 0, meleeTargets);
  }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC' || e.key === 'Shift') {
    keys.slide = false;
    keys.shift = false;
  }
  if (e.code === 'KeyG') {
    if (gameState === GAME_STATES.PLAYING && !player.isDead) {
      if (player.throwAnim && player.throwAnim.active) {
        releaseGrenadeThrow(player);
      } else {
        throwTacticalGrenade(player);
      }
    }
  }
});

mouseScreenX = W * 0.65;
mouseScreenY = H * 0.45;

window.addEventListener('mousemove', (e) => {
  mouseScreenX = e.clientX;
  mouseScreenY = e.clientY;
  setCameraMouseScreenPos(e.clientX, e.clientY);

  if (gameState === GAME_STATES.CLASS_SELECT) {
    const card = getHoveredClassCard(mouseScreenX, mouseScreenY);
    canvas.style.cursor = card ? 'pointer' : 'default';
  }

  if (editorState.active) {
    const worldX = camera.x + mouseScreenX / camera.zoom;
    const worldY = camera.y + mouseScreenY / camera.zoom;
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
    if ((gameState === GAME_STATES.CLASS_SELECT || GAME_STATE.current === 'CLASS_SELECT') && e.touches && e.touches[0]) {
      const touch = e.touches[0];
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
  mouseScreenX = e.clientX;
  mouseScreenY = e.clientY;
  setCameraMouseScreenPos(e.clientX, e.clientY);

  if (GAME_STATE.current !== 'PLAYING') {
    if ((gameState === GAME_STATES.CLASS_SELECT || GAME_STATE.current === 'CLASS_SELECT') && e.button === 0) {
      const card = getHoveredClassCard(e.clientX, e.clientY);
      if (card) {
        playUiClick();
        selectPlayerClass(card.classObj);
      }
    }
    return;
  }

  if (isChatActive) return;
  const mpModal = document.getElementById('mp-modal');
  if (mpModal && !mpModal.classList.contains('mp-modal-hidden')) return;

  // 0a. Obsługa kieszeni broni palnej (oraz karty broni w lewym górnym rogu) dla myszy / pada dotykowego
  if (e.button === 0 && isTouchDevice && pockets.firearm) {
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
      }, 850);
      return;
    }
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
        player.currentWeapon = WEAPONS[btn.id];
        player.isHolstered = false;
      }
      return;
    }
  }

  if (editorState.active) {
    if (e.button === 0 && editorState.selectedType) {
      placeSelectedObstacle(mouseScreenX, mouseScreenY);
      return;
    }
    if (e.button === 2) {
      handleEditorRightClick(mouseScreenX, mouseScreenY);
      return;
    }
  }

  if (e.button === 0) {
    mouseState.lmbDown = true;
    mouseState.semiFired = false;
  } else if (e.button === 2) {
    mouseState.rmbDown = true;
    player.isProne = false;
    player.isCrouching = false;
    player.crouchToggled = false;
    const meleeTargets = [bot.active ? bot : null, remotePlayer.active ? remotePlayer : null].filter(Boolean);
    startKickCharge(player, meleeTargets);
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
      if (touchDur >= 850) {
        player.isHolstered = false;
        rightStick.armedMode = 'FIREARM';
        reloadWeapon(player, player.currentWeapon);
      } else {
        if (player.isHolstered || rightStick.armedMode !== 'FIREARM') {
          player.isHolstered = false;
          rightStick.armedMode = 'FIREARM';
        } else {
          const curId = player.currentWeapon?.id || 'AK47';
          if (curId === 'AK47') player.currentWeapon = WEAPONS.SHOTGUN;
          else if (curId === 'SHOTGUN') player.currentWeapon = WEAPONS.SNIPER;
          else player.currentWeapon = WEAPONS.AK47;
        }
      }
    }
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
  } else if (e.button === 2) {
    mouseState.rmbDown = false;
    const meleeTargets = [bot.active ? bot : null, remotePlayer.active ? remotePlayer : null].filter(Boolean);
    executeReleaseKick(ball, player, 0, meleeTargets);
  }
});

initTouchInputHandlers({
  GAME_STATE,
  setJetpackActive: (val) => { isJetpackActive = val; },
  triggerPlayerShoot
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
    const hoveredCard = getHoveredClassCard(mouseScreenX, mouseScreenY);
    canvas.style.cursor = hoveredCard ? 'pointer' : 'default';

    mouseState.lmbDown = false;
    mouseState.rmbDown = false;

    // Ambientowe tło i ruch kamery bez symulacji fizyki
    updateCamera(player, isDeathmatch ? null : ball, { disableAimLead: true });
    updateParticles();
    return;
  }

  // Wymuszenie stanu kursora systemowego w menu DEV / MULTI / CZAT
  const mpModal = document.getElementById('mp-modal');
  const devMenu = document.getElementById('dev-menu');
  const isMpOpen = mpModal && !mpModal.classList.contains('mp-modal-hidden');
  const isDevOpen = devMenu && !devMenu.classList.contains('dev-menu-hidden');

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

  if (!isTouchDevice) {
    const worldMouseX = camera.x + mouseScreenX / camera.zoom;
    const worldMouseY = camera.y + mouseScreenY / camera.zoom;
    player.aimX = worldMouseX;
    player.aimY = worldMouseY;
  }

  // CELOWNIK ZAWSZE PODĄŻAJĄCY ZA POSTACIĄ
  if (isTouchDevice && !player.isDead) {
    const hipX = player.x + player.w / 2;
    const hipY = player.y + player.h / 2;

    if (typeof player.aimOffsetX !== 'number' || isNaN(player.aimOffsetX)) {
      player.aimOffsetX = (player.facing || 1) * 180;
      player.aimOffsetY = -20;
    }

    if (!rightStick.active && !player.isShooting && !player.isAiming) {
      if (player.facing === 1 && player.aimOffsetX < 0) {
        player.aimOffsetX = Math.abs(player.aimOffsetX);
      } else if (player.facing === -1 && player.aimOffsetX > 0) {
        player.aimOffsetX = -Math.abs(player.aimOffsetX);
      }
    }

    player.aimX = hipX + player.aimOffsetX;
    player.aimY = hipY + player.aimOffsetY;
  }

  // OBSŁUGA OKIEN CZASOWYCH DRĄŻKÓW (300 MS)
  if (leftStick.jetpackWindowTimer > 0) {
    leftStick.jetpackWindowTimer -= FRAME_DURATION;
    if (leftStick.jetpackWindowTimer <= 0) {
      leftStick.jetpackWindowTimer = 0;
      leftStick.waitingForJetpackTap = false;
    }
  }

  if (rightStick.windowTimer > 0) {
    rightStick.windowTimer -= FRAME_DURATION;
    rightStick.lingerAlpha = 1.0;
    if (rightStick.windowTimer <= 0) {
      rightStick.windowTimer = 0;
      rightStick.waitingForSecondTap = false;
      rightStick.lingerAlpha = 0;
    }
  }

  // 1-SEKUNDOWE PRZYTRZYMANIE KIESZENI BRONI PALNEJ NA EKRANIE DOTYKOWYM -> PRZEŁADOWANIE
  if (pockets.firearm && pockets.firearm.active && !pockets.firearm.isDragging && !pockets.firearm.reloadTriggered) {
    const holdElapsed = performance.now() - (pockets.firearm.touchStartTime || 0);
    if (holdElapsed >= 850) {
      if (pockets.firearm.holdTimerId) {
        clearTimeout(pockets.firearm.holdTimerId);
        pockets.firearm.holdTimerId = null;
      }
      pockets.firearm.reloadTriggered = true;
      player.isHolstered = false;
      rightStick.armedMode = 'FIREARM';
      reloadWeapon(player, player.currentWeapon);
    }
  }

  // OBSŁUGA STRZELANIA GRACZA I AUTOMATYCZNEGO PRZEŁADOWANIA W BOJU
  window.activeArenaId = activeArenaId;
  const curWep = player.currentWeapon || WEAPONS.AK47;
  const isTouchFiring = rightStick.active && rightStick.isShooting && (rightStick.power >= 0.90) && (rightStick.armedMode === 'FIREARM') && !player.isDead && !player.isHolstered;
  const isHoldingFire = (mouseState.lmbDown || isTouchFiring) && !player.isDead && !player.isHolstered;

  if (curWep.auto) {
    player.isShooting = isHoldingFire;
  } else {
    player.isShooting = (!player.isHolstered) && (isTouchFiring || (player.shootPoseTimer > 0));
  }

  const curAmmoObj = player.ammo?.[curWep.id];
  const isOutOfAmmo = curAmmoObj && curAmmoObj.currentAmmo <= 0;
  const isReloading = curAmmoObj ? curAmmoObj.isReloading : !!player.isReloading;

  if (isTouchFiring) {
    // Automatyczne przeładowanie w boju, gdy amunicja spadnie do 0
    if (isOutOfAmmo && !isReloading && curAmmoObj.reserveAmmo > 0) {
      reloadWeapon(player, curWep);
    } else if (!isReloading && player.shootCooldown <= 0 && (!curAmmoObj || curAmmoObj.currentAmmo > 0)) {
      triggerPlayerShoot(player, curWep);
    }
  } else if (mouseState.lmbDown && !player.isDead) {
    if (isOutOfAmmo && !isReloading && curAmmoObj.reserveAmmo > 0) {
      reloadWeapon(player, curWep);
    } else if (!isReloading && player.shootCooldown <= 0 && (!curAmmoObj || curAmmoObj.currentAmmo > 0)) {
      if (curWep.auto) {
        triggerPlayerShoot(player, curWep);
      } else if (!mouseState.semiFired) {
        triggerPlayerShoot(player, curWep);
        mouseState.semiFired = true;
      }
    }
  }

  // SILNIK JETPACKA (Działa w powietrzu po uprzednim puszczeniu / odchyleniu drążka po skoku z ziemi)
  const isAirborne = (!player.onGround || player.isJumping || Math.abs(player.vy) > 0.5);

  if (player.onGround && !player.isJumping) {
    leftStick.jumpTriggered = false;
    leftStick.jetpackNeutralized = true;
    player.jetpackKeyNeutralized = true;
  } else if (isAirborne) {
    if (!leftStick.active || leftStick.axisY > -0.12) {
      leftStick.jetpackNeutralized = true;
    }
  }

  const isStickRaised = !!(leftStick && leftStick.active && leftStick.axisY < -0.16 && leftStick.jetpackNeutralized);
  const isTouchFlight = !!(isStickRaised && isAirborne);
  const isKeyFlight = !!(keys && (keys.up || keys.KeyW) && isAirborne && player.jetpackKeyNeutralized);
  const isFlightActive = (isKeyFlight || isTouchFlight) && !player.isDead && (player.jetFuel > 0) && !player.isSliding;
  if (isFlightActive) {
    player.isJetpacking = true;

    let sparkCount = 4;
    if (isTouchFlight && !isKeyFlight) {
      // Wersja mobilna: siła ciągu płynnie dostosowana do wychylenia drążka (umożliwia zawis w powietrzu)
      const stickUp = Math.min(1.0, Math.max(0.0, (-leftStick.axisY - 0.15) / (0.90 - 0.15)));
      player.jetpackPower = stickUp;

      const grav = CONFIG.GRAVITY || 0.38;
      if (stickUp < 0.28) {
        // Lekkie wychylenie: wyhamowywanie opadania (miękkie szybowanie w dół)
        const cushion = stickUp / 0.28;
        player.vy -= grav * (0.35 + cushion * 0.65);
        if (player.vy > 1.2) {
          player.vy *= (1.0 - cushion * 0.18);
        }
      } else if (stickUp <= 0.52) {
        // Środkowa strefa drążka (~połowa wychylenia w górę): stabilny ZAWIS W POWIETRZU (Hover)
        player.vy -= grav;
        player.vy *= 0.76;
        if (Math.abs(player.vy) < 0.06) {
          player.vy = 0;
        }
      } else {
        // Wyższe wychylenie drążka (> 52%): płynne wznoszenie proporcjonalne do wychylenia aż do pełnej mocy
        const climbT = (stickUp - 0.52) / (1.0 - 0.52);
        const netUpThrust = 0.12 + climbT * ((0.95 - grav) - 0.12);
        const maxClimbVy = -(1.2 + climbT * 7.3);
        player.vy -= (grav + netUpThrust);
        if (player.vy < maxClimbVy) {
          player.vy += (maxClimbVy - player.vy) * 0.28;
        }
      }

      const fuelDrain = 0.38 + stickUp * 0.57;
      player.jetFuel = Math.max(0, player.jetFuel - fuelDrain);
      sparkCount = Math.max(1, Math.round(1 + stickUp * 3));
    } else {
      // Klawiatura: klasyczna pełna siła ciągu
      player.jetpackPower = 1.0;
      player.jetFuel = Math.max(0, player.jetFuel - 0.95);
      player.vy = Math.max(-8.5, player.vy - 0.95);
    }

    let inputAxisX = 0;
    if (keys.left) inputAxisX -= 1;
    if (keys.right) inputAxisX += 1;
    if (leftStick && leftStick.active && isStickRaised) {
      inputAxisX = Math.abs(leftStick.axisX) > 0.04 ? leftStick.axisX : 0;
    }

    const maxAirVx = (player.currentClass?.stats?.sprintMax || CONFIG.SPRINT_MAX) * 1.1;
    if (Math.abs(inputAxisX) > 0.04) {
      if (isTouchFlight && !isKeyFlight) {
        // Na drążku prędkość pozioma lotu płynnie dąży do proporcji wychylenia gałki
        const targetJetVx = inputAxisX * maxAirVx;
        player.vx += (targetJetVx - player.vx) * 0.16;
      } else {
        player.vx += inputAxisX * 0.42;
      }
      player.vx = Math.max(-maxAirVx, Math.min(maxAirVx, player.vx));
      player.airVx = player.vx;
      const isAimingNow = player.isAiming || player.isShooting || (player.shootPoseTimer > 0);
      if (!isAimingNow) {
        if (inputAxisX > 0.1) player.facing = 1;
        else if (inputAxisX < -0.1) player.facing = -1;
      }
    } else if (isTouchFlight) {
      // W zawisie pionowym na drążku płynnie wygaszaj boczny dryf
      player.vx *= 0.90;
      if (Math.abs(player.vx) < 0.04) player.vx = 0;
      player.airVx = player.vx;
    }

    player.isJumping = true;
    player.isCrouching = false;
    player.isProne = false;

    // Zabezpieczenie przed wylotem ponad najwyższą granicę nieba
    if (player.y < 20) {
      player.y = 20;
      if (player.vy < 0) player.vy = 0;
    }

    const nozzle = getJetpackNozzlePos(player);
    const myJetColors = networkState.isHost
      ? ['#00e5ff', '#38bdf8', '#0284c7', '#ffffff']
      : ['#f97316', '#fb923c', '#fdba74', '#ffffff'];
    spawnJetpackSparks(nozzle.x, nozzle.y, player.facing, sparkCount, myJetColors, player.vx, player.vy, nozzle.angle);
  } else {
    isJetpackActive = false;
    if (leftStick) leftStick.isJetpacking = false;
    player.isJetpacking = false;
    player.jetpackPower = 0;
  }

  if (leftStick && leftStick.active) {
    updateDoubleFlickDetection(leftStick.axisY);
  }

  if (remotePlayer && remotePlayer.active) {
    remotePlayer.groundY = GROUND_Y;
    remotePlayer.currentGroundY = GROUND_Y;

    const rSpeed = Math.abs(remotePlayer.vx || 0);
    if (rSpeed > 0.1 && !remotePlayer.isJumping) {
      remotePlayer.stridePhase = (remotePlayer.stridePhase || 0) + rSpeed * 0.04;
    }
    updateRemotePlayer(GROUND_Y);
  }

  const mainMeleeTargets = [bot.active ? bot : null, remotePlayer.active ? remotePlayer : null].filter(Boolean);
  updateMobileControlStates(player, leftStick, btnCluster);
  updatePlayer(keys, leftStick, GROUND_Y, isDeathmatch ? null : ball, spawnGrass, player, mainMeleeTargets);
  sendPlayerState(player);

  updateParticles();
  updateJetpackParticles();
  updateMovableObstacles(GROUND_Y);
  updateGore(GROUND_Y, ARENA_PLATFORMS, customObstacles);

  const headEntities = [player];
  if (bot.active) headEntities.push(bot);
  if (remotePlayer.active) headEntities.push(remotePlayer);
  updateSeveredHeads(headEntities, GROUND_Y, ARENA_PLATFORMS);

  // Aktualizacja cyklu życia specyficznego dla aktywnej areny (np. spadające skały, łańcuchy, wózki)
  const activeArena = getActiveArena();
  activeArena?.update?.((FRAME_DURATION / 1000) || (1 / 60), headEntities, isDeathmatch ? null : ball);

  if (!isDeathmatch) {
    if (networkState.isHost || !networkState.isConnected) {
      updateBall(GROUND_Y);
      checkBallPlayerCollisions(player, GROUND_Y, spawnGrass);
      if (remotePlayer.active) {
        checkBallPlayerCollisions(remotePlayer, GROUND_Y, spawnGrass);
        checkPlayerPlatformLanding(remotePlayer, GROUND_Y);
      }
      checkObstacleCollisions(ball, GROUND_Y, player, bot);
      if (remotePlayer.active) checkObstacleCollisions(ball, GROUND_Y, remotePlayer, bot);
      sendBallState(ball);
    } else {
      // Klient – autorytatywna pozycja piłki z sieci P2P
      checkBallPlayerCollisions(player, GROUND_Y, spawnGrass);
      if (remotePlayer.active) {
        checkBallPlayerCollisions(remotePlayer, GROUND_Y, spawnGrass);
        checkPlayerPlatformLanding(remotePlayer, GROUND_Y);
      }
      checkObstacleCollisions(ball, GROUND_Y, player, bot);
    }
  } else {
    // W trybie Team Deathmatch (Arena 3) piłka jest całkowicie wycofana z gry
    if (ball.active) {
      ball.active = false;
      ball.x = -9999;
      ball.y = -9999;
      ball.vx = 0;
      ball.vy = 0;
    }
    checkObstacleCollisions(null, GROUND_Y, player, bot);
    if (remotePlayer.active) {
      checkPlayerPlatformLanding(remotePlayer, GROUND_Y);
    }

    // Zliczanie fragów w trybie Team Deathmatch
    if (player.isDead) {
      if (!player._fragRecorded) {
        arenaScore.orange++;
        player._fragRecorded = true;
      }
    } else {
      player._fragRecorded = false;
    }

    if (bot.active) {
      if (bot.isDead) {
        if (!bot._fragRecorded) {
          arenaScore.cyan++;
          bot._fragRecorded = true;
        }
      } else {
        bot._fragRecorded = false;
      }
    }

    if (remotePlayer.active) {
      if (remotePlayer.isDead) {
        if (!remotePlayer._fragRecorded) {
          arenaScore.cyan++;
          remotePlayer._fragRecorded = true;
        }
      } else {
        remotePlayer._fragRecorded = false;
      }
    }
  }

  // RESET SESJI POWIETRZNEJ JETPACKA DOPIERO PO WYLĄDOWANIU
  const currentFloor = player.currentGroundY || GROUND_Y;
  const isPlayerGrounded = !player.isJumping && (player.y >= currentFloor - player.h - 3);

  if (isPlayerGrounded || player.isDead) {
    jetpackAirborneSession = false;
    if (leftStick) {
      leftStick.jetpackAirborneSession = false;
      leftStick.isJetpacking = false;
      leftStick.waitingForJetpackTap = false;
      leftStick.jetpackWindowTimer = 0;
    }
    isJetpackActive = false;
    player.isJetpacking = false;
  }

  if (bot.active) {
    updateBotBrain(isDeathmatch ? null : ball, player, GROUND_Y, spawnGrass);
    if (!isDeathmatch) {
      checkBallPlayerCollisions(bot, GROUND_Y, spawnGrass);
    }
    checkPlayerPlatformLanding(bot, GROUND_Y);
  }

  const combatants = [player];
  if (bot.active) combatants.push(bot);
  if (remotePlayer.active) combatants.push(remotePlayer);
  const isA3Combat = (activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY');
  const effectiveGroundY = isA3Combat ? 1200 : GROUND_Y;
  updateBullets(effectiveGroundY, obstacles, isDeathmatch ? null : ball, combatants);
  updateProjectiles(effectiveGroundY, ARENA_PLATFORMS, customObstacles, combatants, isDeathmatch ? null : ball);

  updateCamera(player, isDeathmatch ? null : ball, {
    disableAimLead: !!(editorState?.active || isChatActive)
  });
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
        const worldX = camera.x + mouseScreenX / camera.zoom;
        const worldY = camera.y + mouseScreenY / camera.zoom;
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
        const magnetBadge = isSnapped ? ` [🧲 ${placement.surfaceName || 'POWIERZCHNIA'}]` : '';
        ctx.fillText(`${def.name} (${w}x${h})${magnetBadge}`, px + w / 2, py - 6);
        ctx.restore();
      }
    }
  }

  drawBullets(ctx);
  drawProjectiles(ctx);
  drawGore(ctx);
  drawSeveredHeads(ctx, remotePlayer.active ? [player, bot, remotePlayer] : [player, bot]);
  drawJetpackParticles(ctx);

  // Celownik laserowy snajperki Barrett .50 w stylu Soldat
  const isAimingWithStick = rightStick && rightStick.active && (typeof rightStick.power === 'number' ? rightStick.power > 0.05 : true) && rightStick.armedMode !== 'GRENADE';
  const isThrowingGrenade = !!(player.throwAnim && player.throwAnim.active);
  const isWeaponHolstered = !!(player.isHolstered || !player.currentWeapon || (typeof player.holsterWeight === 'number' && player.holsterWeight >= 0.5));

  const shouldDrawPlayerSniperLaser = !isThrowingGrenade && !isWeaponHolstered && (!isTouchDevice || isAimingWithStick);

  if (shouldDrawPlayerSniperLaser) {
    drawSniperLaserSight(ctx, player);
  }
  if (bot.active) {
    drawSniperLaserSight(ctx, bot);
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

  if (remotePlayer.active) {
    drawPlayer(ctx, GROUND_Y, remotePlayer);

    ctx.save();
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    const tagColor = networkState.isHost ? '#f97316' : '#06b6d4';
    const tagName = networkState.isHost ? '[P2: CLIENT]' : '[P1: HOST]';
    ctx.fillStyle = tagColor;
    ctx.shadowColor = tagColor;
    ctx.shadowBlur = 6;
    const tagX = remotePlayer.head ? remotePlayer.head.x : (remotePlayer.x + remotePlayer.w / 2);
    const tagY = remotePlayer.head ? (remotePlayer.head.y - 26) : (remotePlayer.y - 28);
    ctx.fillText(tagName, tagX, tagY);
    ctx.restore();
  }

  if (bot.active) {
    drawPlayer(ctx, GROUND_Y, bot);

    ctx.save();
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c084fc';
    ctx.shadowColor = 'rgba(168, 85, 247, 0.8)';
    ctx.shadowBlur = 4;
    const botTagX = bot.head ? bot.head.x : (bot.x + bot.w / 2);
    const botTagY = bot.head ? (bot.head.y - 26) : (bot.y - 26);
    ctx.fillText(bot.frozen ? '[BOT: STOP]' : '[BOT]', botTagX, botTagY);
    ctx.restore();
  }

  const isDeathmatch = (
    activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X' ||
    activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY' ||
    (ball && !ball.active)
  );

  if (!isDeathmatch) {
    drawBall(ctx);
  }

  const modalEl = document.getElementById('mp-modal') || mpModal;
  const isDevOpenForCrosshair = devMenu && !devMenu.classList.contains('dev-menu-hidden');
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
    ctx.fillText('⚡ DEBUG COLLIDERS ON [F1 / ~ to toggle]', 16, 24);
    ctx.restore();
  }

  if (GAME_STATE.current === 'PLAYING') {
    const inKickRange = (!isDeathmatch && ball && typeof isBallInKickReach === 'function') ? isBallInKickReach(player, ball) : false;
    drawHUD(ctx, player, leftStick, btnCluster, rightStick, isDeathmatch ? null : ball, inKickRange, { activeArenaId, arenaScore, arena1State, bot, remotePlayer });
  } else if (GAME_STATE.current === 'PAUSED') {
    drawHUD(ctx, player, leftStick, btnCluster, rightStick, isDeathmatch ? null : ball, false, { activeArenaId, arenaScore, arena1State, bot, remotePlayer });
  } else if (gameState === GAME_STATES.CLASS_SELECT) {
    drawClassSelectModal(ctx, mouseScreenX, mouseScreenY);
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
    ctx.fillText(`🏗️ EDYTOR: ${currentToolLabel} | LPM: Postaw | PPM: Usuń/Anuluj | Ctrl+Z: Cofnij`, W / 2, bannerY + 17);
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
      if (typeof window.switchArena === 'function') {
        window.switchArena(arenaId);
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

