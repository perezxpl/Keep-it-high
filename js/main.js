import { CONFIG, FRAME_DURATION, START_X, GAME_STATES, ARENA_LEFT, ARENA_RIGHT, ARENA_WIDTH, ARENA_CONFIGS } from './config.js';
import {
  canvas, ctx, W, H, GROUND_Y, camera, world,
  initCanvas, setupCanvas, resize, resizeCanvas, updateCamera, updateDistance, clampCamera,
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
  spawnKnockedHelmet, spawnVestShreds, triggerScreenShake
} from './world.js';
import {
  player, playerJump, initiatePlayerJump, playerSlide, startJumpCharge, executeReleaseJump,
  startKickCharge, executeReleaseKick, isBallInKickReach, findMeleeTarget,
  performKick, kick,
  updatePlayer, drawPlayer, drawPlayerMarker, setPlayerClass, getJetpackNozzlePos,
  throwTacticalGrenade, prepareGrenadeThrow, releaseGrenadeThrow,
  drawGrenadeTrajectory, isCeilingBlockingStand
} from './player.js';
import { updateProjectiles, drawProjectiles } from './projectiles.js';
import { renderArenaBackground, renderArenaForeground, getActiveArena, DEBUG_COLLIDERS, drawDebugColliders, isDebugCollidersEnabled } from './renderer.js';
import {
  ball, resetBallToPlayer, updateBall, checkBallPlayerCollisions, drawBall
} from './ball.js';
import {
  obstacles, checkObstacleCollisions, checkPlayerPlatformLanding, drawObstacles, resetObstacles,
  updateProceduralObstacles, updateProceduralBirds, switchArena, activeArenaId,
  customObstacles, OBSTACLE_PALETTE, getObstacleDef, clearCustomObstacles, undoCustomObstacle,
  drawSingleObstacleByType, arenaScore, arena1State, ARENA_PLATFORMS, setActiveBot,
  calculateObstaclePlacement, findSupportingSurface, isBottomAnchored, normalizeObstacleType,
  updateMovableObstacles, resetArena, spawnAltarShockwave
} from './obstacles.js';
import { CLASSES } from './classes/index.js';
import { bot, botKeys, updateBotBrain, getActiveBots, balanceBotClasses, isBotEnabled, setBotEnabled, getBotDifficulty, setBotDifficulty, getBotCount, setBotCount } from './bot.js';
import { triggerCombatFeedBanner, triggerCombatFeedEvent, updateCombatFeed, isHazardName } from './ui/combatFeed.js';
import { WEAPONS, updateBullets, drawBullets, shootWeapon, getMuzzlePosition, reloadWeapon, getWeaponAmmo, clearBulletCasings, drawSniperLaserSight, updateWeaponState } from './weapons.js';
import { initPlayerLoadout, initArmoryUI, openArmory, closeArmory } from './loadout/index.js';
import {
  remotePlayer, networkState, initNetwork, sendPlayerState, sendBallState, sendShootEvent,
  sendObstacleAdd, sendObstacleRemove, sendObstacleClear, sendObstacleUndo,
  sendArenaSwitch, updateRemotePlayer, sendBotsState, updateRemoteBots, sendReturnToLobby,
  isChatActive, openChat, closeChat, updateCursorVisibility, getActiveRemotePlayers,
  isMatchHost, isMatchClient, isMatchActive
} from './network.js';
import { flushNetworkQueue } from './networkQueue.js';
import { syncMpRosterUI } from './networkUI.js';
import {
  leftStick, rightStick, btnCluster, pockets,
  updateButtonLayout, updateMobileControlStates,
  handleDynamicActionButtonPress, handleSlideProneButtonPress, triggerRightStickKick,
  checkRightStickFlickOrTap
} from './mobileControls.js';
import { uiManager, playUiClick, playUiHover, playUiPause, playUiResume } from './uiManager.js';
import { initAudio, setAudioGameState, updateAudio } from './audio/index.js';
import { recordKill, recordDeath } from './progression.js';
import { updateDeathmatch, resetDeathmatchState, refreshDeathmatchParticipants, deathmatchState } from './deathmatch/index.js';
import { initKillstreaks, updateKillstreaks, drawKillstreakWorld, drawKillstreakHUD, registerKillstreakKill, resetKillstreak } from './killstreaks/index.js';
import { initPickups, resetPickups, updatePickups, drawPickupsWorld, drawPickupPrompt } from './pickup/index.js';
import { initLighting, updateLighting, drawLighting, drawShockwaves, drawCinematicVignette } from './lighting/index.js';
import { updateZombieSystem, drawZombieSystem, drawZombieHUD, getActiveZombies, isZombieModeActive, sendZombiesState } from './zombie/index.js';
import { updateHazards, drawHazards, initHazardsForArena, checkBarrelKickInteraction } from './hazards/index.js';
import { checkMatchWin, updateMatchWinState, resetMatchWinState } from './ui/rankHud.js';
import { CLASS_CARDS, getClassCardRects, getHoveredClassCard, drawClassSelectModal } from './ui/classSelectModal.js';
import { initMenuFight, updateMenuFight, drawMenuFight, stopMenuFight } from './menuFight/index.js';
import { initCallouts, resetCalloutMatchState, onPlayerDeathCallout, registerCalloutKill, updateCallouts, drawCallouts } from './callouts/index.js';
import {
  editorState,
  initObstacleEditorUI,
  renderEditorPalette,
  updateEditorPaletteHighlight,
  placeSelectedObstacle,
  handleEditorRightClick
} from './dev/obstacleEditor.js';
import {
  initWeaponEditorUI,
  updateWeaponEditorFreeze,
  weaponEditorState
} from './dev/weaponEditor.js';
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
  initModularGearDevUI,
  initCanvas,
  setupCanvas,
  resize,
  resizeCanvas
};

if (typeof window !== 'undefined') {
  window.updateButtonLayout = updateButtonLayout;
  window.leftStick = leftStick;
  window.rightStick = rightStick;
  window.btnCluster = btnCluster;
  window.initCanvas = initCanvas;
  window.setupCanvas = initCanvas;
  window.resize = resize;
  window.resizeCanvas = resize;
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
  window.isBotEnabled = isBotEnabled;
  window.setBotEnabled = setBotEnabled;
  window.getBotDifficulty = getBotDifficulty;
  window.setBotDifficulty = setBotDifficulty;
  window.getBotCount = getBotCount;
  window.setBotCount = setBotCount;
  window.refreshDeathmatchParticipants = refreshDeathmatchParticipants;
  window.deathmatchState = deathmatchState;
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
    player._droppedWeaponThisDeath = false;
    player._calloutDeathRecorded = false;
    player.killerBulletId = null;
    player.ragdoll = null;
    player.staggerTimer = 0;
    if (player.ammo) {
      const wepDefaults = {
        AK47: { currentAmmo: 30, reserveAmmo: 90 },
        SHOTGUN: { currentAmmo: 8, reserveAmmo: 64 },
        SNIPER: { currentAmmo: 5, reserveAmmo: 25 },
        GLOCK: { currentAmmo: 17, reserveAmmo: 68 },
        REVOLVER: { currentAmmo: 6, reserveAmmo: 36 },
        SAWED_OFF: { currentAmmo: 2, reserveAmmo: 18 },
        RPG7: { currentAmmo: 1, reserveAmmo: 3 }
      };
      for (const [wepId, def] of Object.entries(wepDefaults)) {
        if (player.ammo[wepId]) {
          player.ammo[wepId].currentAmmo = def.currentAmmo;
          player.ammo[wepId].reserveAmmo = def.reserveAmmo;
          player.ammo[wepId].isReloading = false;
          player.ammo[wepId].reloadTimer = 0;
        }
      }
    }
  }
  const activeBots = (typeof getActiveBots === 'function') ? getActiveBots() : (bot.active ? [bot] : []);
  for (const b of activeBots) {
    if (b.active) {
      b.hp = b.maxHp || b.currentClass?.stats?.hp || 100;
      b.isDead = false;
      b._droppedWeaponThisDeath = false;
      b.isAcidDying = false;
      if (b.acidDeath) b.acidDeath.active = false;
      b.ragdoll = null;
      b.staggerTimer = 0;
      b.respawnTimer = 0;
    }
  }
  resetBallToPlayer(player, GROUND_Y);
}
window.startRound = startRound;

let isMatchConcluding = false;
/**
 * Zakończenie rozgrywki i powrót do lobby (Odprawa taktyczna / Pokój meczu)
 */
export function concludeMatchAndReturnToLobby(options = {}) {
  if (isMatchConcluding) return;
  isMatchConcluding = true;

  // 1. Zakończenie rozgrywki i reset wszystkich stanów bitewnych
  resetMatchWinState();
  resetDeathmatchState();
  if (typeof resetKillstreak === 'function') {
    resetKillstreak();
  }
  resetCalloutMatchState();
  resetPickups();
  startRound();

  // 2. Obsługa trybu sieciowego P2P
  const netState = (typeof window !== 'undefined' && window.networkState) ? window.networkState : null;
  const isMultiplayer = !!(netState && netState.isConnected);

  if (isMultiplayer && !options.isRemoteTrigger && netState.isHost) {
    if (typeof sendReturnToLobby === 'function') {
      sendReturnToLobby();
    }
  }

  // 3. Przełączenie do widoku lobby (ODPRAWA TAKTYCZNA)
  setGameState('ARENA_SELECT');

  if (isMultiplayer) {
    const tabMultiBtn = document.getElementById('briefing-tab-multi');
    if (tabMultiBtn) tabMultiBtn.click();
    if (typeof syncMpRosterUI === 'function') {
      syncMpRosterUI();
    }
  } else {
    const tabSoloBtn = document.getElementById('briefing-tab-solo');
    if (tabSoloBtn) tabSoloBtn.click();
  }

  setTimeout(() => {
    isMatchConcluding = false;
  }, 400);
}
window.concludeMatchAndReturnToLobby = concludeMatchAndReturnToLobby;

// ==========================================
// STAN GRY I SYSTEM WYBORU KLAS POSTACI
// ==========================================
export const GAME_STATE = {
  current: 'MENU', // 'MENU' | 'PLAYING' | 'SETTINGS' | 'PAUSED' | 'ARENA_SELECT' | 'CLASS_SELECT' | 'CREATOR' | 'ARMORY'
  previous: 'MENU'
};

export let gameState = GAME_STATE.current;

export function setGameState(newState) {
  if (GAME_STATE.current === newState) return;
  const prevState = GAME_STATE.current;
  GAME_STATE.previous = prevState;
  GAME_STATE.current = newState;
  gameState = newState;
  setAudioGameState(newState);
  resetInputState();
  if (prevState === 'MENU' && newState !== 'MENU') {
    stopMenuFight();
  } else if (newState === 'MENU') {
    initMenuFight();
  }
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
initWeaponEditorUI();
initNetwork();
initKillstreaks();
initPickups();
initLighting();
initPlayerLoadout(player);
initArmoryUI(player);

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

  const isEditorActive = !!(weaponEditorState?.isOpen);

  if (!isEditorActive) {
    // Ukryj celownik podczas rzutu granatem lub gdy broń jest schowana
    if (player.throwAnim && player.throwAnim.active) return;
    if (player.isHolstered || !player.currentWeapon || (typeof player.holsterWeight === 'number' && player.holsterWeight >= 0.5)) return;

    // Ukryj celownik w walce w zwarciu (broń biała)
    const isMeleeWeapon = !!(player.currentWeapon?.isMelee || player.currentWeapon?.id === 'MACHETE' || player.currentWeapon?.id === 'KNIFE' || player.currentWeapon?.id === 'AXE' || player.meleeState);
    if (isMeleeWeapon) return;

    // Na urządzeniach dotykowych ukryj celownik każdej broni, gdy prawy drążek jest nieużywany lub w trybie granatu
    if (isTouchDevice) {
      const isAimingWithStick = rightStick && rightStick.active && (typeof rightStick.power === 'number' ? rightStick.power > 0.05 : true) && rightStick.armedMode !== 'GRENADE';
      if (!isAimingWithStick) return;
    }
  }

  const col = customCol || '#ef4444';

  const kick = player.weaponKickback || 0;
  const rise = player.muzzleRise || 0;
  const spreadGap = Math.min(18, 4 + kick * 1.5 + rise * 16);

  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.5;

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
  flushNetworkQueue();
  const currentArena = typeof getActiveArena === 'function' ? getActiveArena() : null;
  const gravMult = (typeof currentArena?.gravityMultiplier === 'number') ? currentArena.gravityMultiplier : 1.0;
  CONFIG.GRAVITY = 0.38 * gravMult;

  const isDeathmatch = (
    activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X' ||
    activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY' ||
    activeArenaId === 'ARENA_4' || activeArenaId === 'arena-4' || activeArenaId === 'ARMORED_TRAIN' ||
    activeArenaId === 'SPACE_STATION' || activeArenaId === 'ARES' ||
    activeArenaId === 'ARENA_5' || activeArenaId === 'arena-5' || activeArenaId === 'PREFAB_TOWER' ||
    (ball && !ball.active)
  );

  const isA5Active = (activeArenaId === 'ARENA_5' || activeArenaId === 'arena-5' || activeArenaId === 'PREFAB_TOWER');
  const isA4Active = (activeArenaId === 'ARENA_4' || activeArenaId === 'arena-4' || activeArenaId === 'OBSIDIAN_CALDERA' || activeArenaId === 'CALDERA' || activeArenaId === 'OBSIDIAN' || activeArenaId === 'KRATER' || activeArenaId === 'USS_TITAN' || activeArenaId === 'TITAN' || activeArenaId === 'LOTNISKOWIEC' || activeArenaId === 'ARMORED_TRAIN' || activeArenaId === 'SPACE_STATION' || activeArenaId === 'ARES');
  const isA3Active = (activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY');
  const isA2Active = (activeArenaId === 'ARENA_2' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'ARENA_2_SECTOR_X');
  const effectiveGroundY = isA5Active
    ? ((typeof window !== 'undefined' && typeof window.arena5State?.currentFloorY === 'number') ? window.arena5State.currentFloorY : 1200)
    : (isA2Active ? 1600 : (isA3Active ? 1200 : (isA4Active ? 1200 : GROUND_Y)));

  if (consumeHitstop()) {
    updateCamera(player, isDeathmatch ? null : ball);
    return;
  }

  // W grze sieciowej/online mecze toczą się bez zatrzymywania czasu (brak pauzy).
  // Wyświetlenie menu taktycznego (PAUSED) ani wejście w ustawienia w trakcie meczu nie wstrzymuje fizyki, botów ani odliczania.
  const isSettingsInLiveMatch = ((GAME_STATE.current === 'SETTINGS' || GAME_STATE.current === 'ARMORY') && (GAME_STATE.previous === 'PAUSED' || GAME_STATE.previous === 'PLAYING'));

  if (GAME_STATE.current === 'MENU') {
    mouseState.lmbDown = false;
    mouseState.rmbDown = false;
    updateMenuFight(1 / 60);
    return;
  }

  if (GAME_STATE.current === 'CREATOR' || (GAME_STATE.current === 'ARMORY' && !isSettingsInLiveMatch) || GAME_STATE.current === 'ARENA_SELECT' || (GAME_STATE.current === 'SETTINGS' && !isSettingsInLiveMatch)) {
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

  // Wymuszenie stanu kursora systemowego w menu DEV / MULTI / CZAT / MENU TAKTYCZNE (PAUZA) / USTAWIENIA
  const mpModalEl = document.getElementById('mp-modal');
  const devMenuEl = document.getElementById('dev-menu');
  const isMpOpen = mpModalEl && !mpModalEl.classList.contains('mp-modal-hidden');
  const isDevOpen = (devMenuEl && !devMenuEl.classList.contains('dev-menu-hidden')) || weaponEditorState.isOpen;
  const isPauseOrSettingsOverlay = (GAME_STATE.current === 'PAUSED' || isSettingsInLiveMatch);

  if (isMpOpen || isDevOpen || isChatActive || isPauseOrSettingsOverlay) {
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
  updateWeaponEditorFreeze();

  const activeRemotePlayers = (typeof getActiveRemotePlayers === 'function') ? getActiveRemotePlayers() : (remotePlayer?.active ? [remotePlayer] : []);
  if (activeRemotePlayers.length > 0) {
    updateRemotePlayer(GROUND_Y);
    for (const rp of activeRemotePlayers) {
      updateWeaponState(rp);
    }
  }

  const activeBots = (typeof getActiveBots === 'function') ? getActiveBots() : (bot.active ? [bot] : []);
  for (const b of activeBots) {
    if (b && b.active) {
      updateWeaponState(b);
    }
  }
  const activeZombies = (typeof getActiveZombies === 'function') ? getActiveZombies() : [];
  const mainMeleeTargets = [...activeBots, ...activeRemotePlayers, ...activeZombies].filter(Boolean);
  updateMobileControlStates(player, leftStick, btnCluster, { ball: isDeathmatch ? null : ball });
  updatePlayer(keys, leftStick, effectiveGroundY, isDeathmatch ? null : ball, spawnGrass, player, mainMeleeTargets);
  sendPlayerState(player);

  updateParticles();
  updateJetpackParticles();
  updateMovableObstacles(effectiveGroundY);
  updateGore(effectiveGroundY, ARENA_PLATFORMS, customObstacles);

  const headEntities = [player, ...activeBots, ...activeZombies, ...activeRemotePlayers];
  updateSeveredHeads(headEntities, effectiveGroundY, ARENA_PLATFORMS);

  // Aktualizacja cyklu życia specyficznego dla aktywnej areny (np. spadające skały, łańcuchy, wózki)
  const activeArena = getActiveArena();
  activeArena?.update?.((FRAME_DURATION / 1000) || (1 / 60), headEntities, isDeathmatch ? null : ball);

  if (!isDeathmatch) {
    if (!isMatchClient()) {
      if (activeArenaId === 'ARENA_1' && arena1State.waitingForKickoff) {
        // Piłka lewituje w powietrzu na środku areny w snopie światła i czeka na pierwszy kontakt
        const time = performance.now() * 0.003;
        ball.x = arena1State.altarX || 1800;
        ball.y = (arena1State.altarY || 570) + Math.sin(time) * 5;
        ball.prevX = ball.x;
        ball.prevY = ball.y;
        ball.vx = 0;
        ball.vy = 0;
        ball.spin = 0;
        ball.rotation += 0.015;
        ball.trail = [];
      } else {
        updateBall(effectiveGroundY);
      }
      checkBallPlayerCollisions(player, effectiveGroundY, spawnGrass);
      checkPlayerPlatformLanding(player, effectiveGroundY);
      for (const rp of activeRemotePlayers) {
        checkBallPlayerCollisions(rp, effectiveGroundY, spawnGrass);
      }
      if (activeArenaId === 'ARENA_1' && arena1State.waitingForKickoff && Math.hypot(ball.vx, ball.vy) > 0.5) {
        arena1State.waitingForKickoff = false;
        triggerScreenShake(7);
        spawnAltarShockwave(ball.x, ball.y);
      }
      checkObstacleCollisions(ball, effectiveGroundY, player, getActiveBots());
      if (isMatchActive()) {
        sendBallState(ball);
      }
    } else {
      // Klient – autorytatywna pozycja piłki z sieci P2P (zdalni gracze nie sa przepychami przez lokalna fizyke)
      checkBallPlayerCollisions(player, effectiveGroundY, spawnGrass);
      checkPlayerPlatformLanding(player, effectiveGroundY);
      checkObstacleCollisions(ball, effectiveGroundY, player, getActiveBots());
    }
    checkMatchWin(activeArenaId, arenaScore);
    updateMatchWinState(arenaScore);
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
    checkObstacleCollisions(null, effectiveGroundY, null, null);
  }

  // Zliczanie fragów i eliminacji poza dedykowanym modułem Deathmatch (Areny 2, 3, 4 i 5 są obsługiwane przez updateDeathmatch)
  if (!isA2Active && !isA3Active && !isA4Active && !isA5Active) {
    if (player.isDead) {
      if (!player._fragRecorded) {
        recordDeath();
        resetKillstreak();
        player._fragRecorded = true;
        if (!player._calloutDeathRecorded) {
          player._calloutDeathRecorded = true;
          const pKiller = player.killer || player.lastAttacker || null;
          onPlayerDeathCallout(pKiller, {
            killerName: (pKiller && pKiller.name) || null,
            killerPeerId: (pKiller && pKiller.peerId) || null,
            killerId: (pKiller && pKiller.id) || null,
            isHazard: !pKiller || typeof pKiller === 'string' || Boolean(pKiller.isHazard || pKiller.isSelf),
            isZombie: Boolean(pKiller && pKiller.isZombie)
          });
        }
        const kName = (typeof player.killer === 'string')
          ? player.killer
          : (player.killer?.name || (player.isAcidDying ? 'TOKSYCZNY KWAS' : 'ŚRODOWISKO'));
        const isHazard = isHazardName(kName) || player.killer?.isSelf || (player.killer?.cause);
        triggerCombatFeedEvent({
          type: 'PLAYER_DEATH',
          victim: player,
          killer: player.killer,
          killerName: kName,
          cause: isHazard ? kName : ''
        });
      }
    } else {
      player._fragRecorded = false;
      player._calloutDeathRecorded = false;
      player.killerBulletId = null;
    }

    for (const b of activeBots) {
      if (b.isDead) {
        if (!b._fragRecorded) {
          b._fragRecorded = true;
          const kRef = b.killer || b.lastAttacker;
          const isHaz = typeof kRef === 'string' || (kRef && (kRef.isSelf || kRef.isHazard || isHazardName(kRef.name || kRef)));
          if (kRef === player) {
            recordKill();
            registerKillstreakKill();
            registerCalloutKill(player, b, {
              bulletId: b.killerBulletId || null,
              victimId: b.id || null,
              victimName: b.name || null,
              isZombie: Boolean(b.isZombie),
              x: b.x,
              y: b.y - 52
            });
            triggerCombatFeedEvent({
              type: 'PLAYER_KILL',
              killer: player,
              victim: b,
              victimName: b.name || 'BOT',
              victimTeam: b.team
            });
          } else if (kRef && kRef !== b && !isHaz) {
            triggerCombatFeedEvent({
              type: 'COMBAT_KILL',
              killer: kRef,
              killerName: (typeof kRef === 'string') ? kRef : (kRef.name || 'OPERATOR'),
              killerTeam: kRef.team || null,
              victim: b,
              victimName: b.name || 'BOT',
              victimTeam: b.team
            });
          } else {
            const hName = (typeof b.killer === 'string') ? b.killer : (b.killer?.name || (b.killer?.cause || 'ŚRODOWISKO'));
            triggerCombatFeedEvent({
              type: 'COMBAT_HAZARD',
              victim: b,
              victimName: b.name || 'BOT',
              victimTeam: b.team,
              cause: hName
            });
          }
        }
      } else {
        b._fragRecorded = false;
        b.killerBulletId = null;
      }
    }

    for (const rp of activeRemotePlayers) {
      if (rp.isDead) {
        if (!rp._fragRecorded) {
          rp._fragRecorded = true;
          const kRef = rp.killer || rp.lastAttacker;
          const isHaz = typeof kRef === 'string' || (kRef && (kRef.isSelf || kRef.isHazard || isHazardName(kRef.name || kRef)));
          if (kRef === player) {
            recordKill();
            registerKillstreakKill();
            registerCalloutKill(player, rp, {
              bulletId: rp.killerBulletId || null,
              victimId: rp.peerId || rp.id || null,
              victimName: rp.name || null,
              isZombie: Boolean(rp.isZombie),
              x: rp.x,
              y: rp.y - 52
            });
            triggerCombatFeedEvent({
              type: 'PLAYER_KILL',
              killer: player,
              victim: rp,
              victimName: rp.name || 'GRACZ',
              victimTeam: rp.team
            });
          } else if (kRef && kRef !== rp && !isHaz) {
            triggerCombatFeedEvent({
              type: 'COMBAT_KILL',
              killer: kRef,
              killerName: (typeof kRef === 'string') ? kRef : (kRef.name || 'OPERATOR'),
              killerTeam: kRef.team || null,
              victim: rp,
              victimName: rp.name || 'GRACZ',
              victimTeam: rp.team
            });
          } else {
            const hName = (typeof rp.killer === 'string') ? rp.killer : (rp.killer?.name || (rp.killer?.cause || 'ŚRODOWISKO'));
            triggerCombatFeedEvent({
              type: 'COMBAT_HAZARD',
              victim: rp,
              victimName: rp.name || 'GRACZ',
              victimTeam: rp.team,
              cause: hName
            });
          }
        }
      } else {
        rp._fragRecorded = false;
      }
    }
  }

  // Aktualizacja logiki serii zabójstw (Killstreaks) oraz podnoszenia broni (Pickups)
  const curActiveBots = (typeof getActiveBots === 'function') ? getActiveBots() : (bot?.active ? [bot] : []);
  const curCombatants = [player, ...curActiveBots, ...activeRemotePlayers];
  updateKillstreaks((FRAME_DURATION / 1000) || (1 / 60), player, curCombatants);
  updatePickups((FRAME_DURATION / 1000) || (1 / 60), player, curCombatants, camera);

  // RESET SESJI POWIETRZNEJ JETPACKA DOPIERO PO WYLĄDOWANIU
  const curArenaObj = typeof getActiveArena === 'function' ? getActiveArena() : null;
  const hasNoFlatFloor = (curArenaObj?.id === 'arena-2' || activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X' || curArenaObj?.id === 'arena-3' || activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY' || curArenaObj?.id === 'arena-4' || activeArenaId === 'ARENA_4' || activeArenaId === 'arena-4' || activeArenaId === 'ARMORED_TRAIN');

  const currentFloor = player.currentGroundY || player.lastGroundedFloorY || (hasNoFlatFloor ? effectiveGroundY : GROUND_Y);
  const isPlayerGrounded = hasNoFlatFloor
    ? !!(player.onGround && !player.isJumping && player.currentPlatform)
    : (!player.isJumping && (player.y >= currentFloor - player.h - 3));

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

  const combatants = [player, ...activeBots, ...activeRemotePlayers];
  if (typeof getActiveZombies === 'function') {
    combatants.push(...getActiveZombies());
  }
  if (typeof window !== 'undefined') {
    window.combatants = combatants;
  }

  if (!isMatchClient()) {
    for (const b of activeBots) {
      updateBotBrain(isDeathmatch ? null : ball, player, effectiveGroundY, spawnGrass, b, combatants);
      if (!isDeathmatch) {
        checkBallPlayerCollisions(b, effectiveGroundY, spawnGrass);
      }
      checkPlayerPlatformLanding(b, effectiveGroundY);
    }
    if (isMatchHost() && isMatchActive() && activeBots.length > 0) {
      sendBotsState(activeBots);
    }
  } else {
    // Klient w grze sieciowej: odbiera autorytatywne pozycje botów od Hosta
    updateRemoteBots(activeBots, effectiveGroundY);
    for (const b of activeBots) {
      if (!isDeathmatch) {
        checkBallPlayerCollisions(b, effectiveGroundY, spawnGrass);
      }
      checkPlayerPlatformLanding(b, effectiveGroundY);
    }
  }

  if (isA5Active) {
    activeArena?.resolvePenetration?.(combatants);
  }

  updateBullets(effectiveGroundY, obstacles, isDeathmatch ? null : ball, combatants);
  updateProjectiles(effectiveGroundY, ARENA_PLATFORMS, customObstacles, combatants, isDeathmatch ? null : ball);
  updateLighting(1 / 60);
  updateZombieSystem(1 / 60, player, activeBots, effectiveGroundY);
  if (isMatchHost()) {
    sendZombiesState();
  }
  updateHazards((FRAME_DURATION / 1000) || (1 / 60), combatants, effectiveGroundY);
  updateAudio(1 / 60, { gameState: GAME_STATE.current, player, bots: activeBots, remotePlayers: activeRemotePlayers });

  updateCamera(player, isDeathmatch ? null : ball, {
    disableAimLead: !!(editorState?.active || isChatActive || isPauseOrSettingsOverlay)
  });
  if (isA2Active || isA3Active || isA4Active || isA5Active) {
    updateDeathmatch(1 / 60, player, activeBots, activeRemotePlayers, arenaScore);
  } else {
    updateCombatFeed(1 / 60);
  }
  updateCallouts(1 / 60);
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

  // Podczas pobytu w menu przed rozpoczęciem gry renderujemy widowiskową walkę botów w tle
  const isSettingsInLiveMatch = ((GAME_STATE.current === 'SETTINGS' || GAME_STATE.current === 'ARMORY') && (GAME_STATE.previous === 'PAUSED' || GAME_STATE.previous === 'PLAYING'));
  const isGameLive = (GAME_STATE.current === 'PLAYING' || GAME_STATE.current === 'PAUSED' || GAME_STATE.current === 'CLASS_SELECT' || isSettingsInLiveMatch);

  if (GAME_STATE.current === 'MENU') {
    drawMenuFight(ctx, camera);
    return;
  }

  if (!isGameLive) {
    if (ctx) {
      ctx.save();
      ctx.fillStyle = '#050810';
      ctx.fillRect(0, 0, (canvas && canvas.width) ? canvas.width : W, (canvas && canvas.height) ? canvas.height : H);
      ctx.restore();
    }
    return;
  }

  renderArenaBackground(ctx, camera);

  ctx.save();
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  const worldLeft = camera.x;
  const worldRight = camera.x + (camera.viewWidth || (W / camera.zoom));
  const worldWidth = worldRight - worldLeft;

  const isArena5Active = (activeArenaId === 'ARENA_5' || activeArenaId === 'arena-5' || activeArenaId === 'PREFAB_TOWER');
  const isArena4Active = (activeArenaId === 'ARENA_4' || activeArenaId === 'arena-4' || activeArenaId === 'OBSIDIAN_CALDERA' || activeArenaId === 'CALDERA' || activeArenaId === 'OBSIDIAN' || activeArenaId === 'KRATER' || activeArenaId === 'USS_TITAN' || activeArenaId === 'TITAN' || activeArenaId === 'LOTNISKOWIEC' || activeArenaId === 'ARMORED_TRAIN');
  const isArena2Active = (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X');
  const isArena3Active = (activeArenaId === 'ARENA_3' || activeArenaId === 'ARENA_FOUNDRY' || activeArenaId === 'arena-3');
  const effectiveDrawGroundY = isArena5Active
    ? ((typeof window !== 'undefined' && typeof window.arena5State?.currentFloorY === 'number') ? window.arena5State.currentFloorY : 1200)
    : (isArena2Active ? 1600 : (isArena3Active ? 1200 : (isArena4Active ? 1200 : GROUND_Y)));

  if (!isArena2Active && !isArena3Active && !isArena4Active && !isArena5Active) {
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
  const activeRemotePlayers = (typeof getActiveRemotePlayers === 'function') ? getActiveRemotePlayers() : (remotePlayer?.active ? [remotePlayer] : []);
  drawSeveredHeads(ctx, [player, ...activeBots, ...activeRemotePlayers]);
  drawJetpackParticles(ctx);

  // Celownik laserowy snajperki Barrett .50 w stylu Soldat
  const isAimingWithStick = rightStick && rightStick.active && (typeof rightStick.power === 'number' ? rightStick.power > 0.05 : true) && rightStick.armedMode !== 'GRENADE';
  const isThrowingGrenade = !!(player.throwAnim && player.throwAnim.active);
  const isWeaponHolstered = !!(player.isHolstered || !player.currentWeapon || (typeof player.holsterWeight === 'number' && player.holsterWeight >= 0.5));

  const shouldDrawPlayerSniperLaser = !isThrowingGrenade && !isWeaponHolstered && (!isTouchDevice || isAimingWithStick);

  if (shouldDrawPlayerSniperLaser) {
    drawSniperLaserSight(ctx, player);
  }
  // Celowniki snajperskie botow i zdalnego gracza niewidoczne dla lokalnego gracza

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
  drawPlayerMarker(ctx, player);

  const playerTeam = player.team || 'CYAN';

  for (const rp of activeRemotePlayers) {
    drawPlayer(ctx, GROUND_Y, rp);

    // Identyfikacja drużynowa: sojusznicy mają zawsze niebieski nick, rywale nie mają nic
    const remoteTeam = rp.team || (isMatchHost() ? 'ORANGE' : 'CYAN');
    const isAlly = (remoteTeam === playerTeam);

    if (isAlly) {
      ctx.save();
      ctx.font = 'bold 10px Rajdhani, monospace';
      ctx.textAlign = 'center';
      const allyColor = '#00e5ff';
      const allyName = rp.name || 'SOJUSZNIK';
      ctx.strokeStyle = '#050810';
      ctx.lineWidth = 2.5;
      ctx.fillStyle = allyColor;
      const tagX = rp.head ? rp.head.x : (rp.x + rp.w / 2);
      const tagY = rp.head ? (rp.head.y - 26) : (rp.y - 28);
      ctx.strokeText(allyName, tagX, tagY);
      ctx.fillText(allyName, tagX, tagY);
      ctx.restore();
    }
  }

  const tagCamL = camera.x - 80;
  const tagCamR = camera.x + (camera.viewWidth || (window.innerWidth / (camera.zoom || 0.6))) + 80;
  const tagCamT = camera.y - 80;
  const tagCamB = camera.y + (camera.viewHeight || (window.innerHeight / (camera.zoom || 0.6))) + 80;

  for (const b of activeBots) {
    drawPlayer(ctx, GROUND_Y, b);

    // Identyfikacja drużynowa: sojusznicy mają zawsze niebieski nick, rywale nie mają nic
    const botTeam = b.team || 'ORANGE';
    const isAlly = (botTeam === playerTeam);

    if (isAlly) {
      const botTagX = b.head ? b.head.x : (b.x + b.w / 2);
      const botTagY = b.head ? (b.head.y - 26) : (b.y - 26);
      if (botTagX >= tagCamL && botTagX <= tagCamR && botTagY >= tagCamT && botTagY <= tagCamB) {
        ctx.save();
        ctx.font = 'bold 10px Rajdhani, monospace';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#050810';
        ctx.lineWidth = 2.5;
        ctx.fillStyle = '#00e5ff';
        const allyName = b.name || 'SGT. STRIKER';
        ctx.strokeText(allyName, botTagX, botTagY);
        ctx.fillText(allyName, botTagX, botTagY);
        ctx.restore();
      }
    }
  }

  // Renderowanie efektów gore (krew w locie, odcięte głowy, urwane kończyny, upuszczona broń)
  drawGore(ctx);
  drawPickupsWorld(ctx, camera);
  drawZombieSystem(ctx, camera);
  drawHazards(ctx, camera);

  const isDeathmatch = (
    activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X' ||
    activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY' ||
    activeArenaId === 'ARENA_4' || activeArenaId === 'arena-4' || activeArenaId === 'ARMORED_TRAIN' ||
    activeArenaId === 'SPACE_STATION' || activeArenaId === 'ARES' ||
    activeArenaId === 'ARENA_5' || activeArenaId === 'arena-5' || activeArenaId === 'PREFAB_TOWER' ||
    (ball && !ball.active)
  );

  if (!isDeathmatch) {
    drawBall(ctx);
  }

  const devMenuEl = document.getElementById('dev-menu');
  const modalEl = document.getElementById('mp-modal') || mpModal;
  const isDevOpenForCrosshair = devMenuEl && !devMenuEl.classList.contains('dev-menu-hidden');
  const isMpOpenForCrosshair = modalEl && !modalEl.classList.contains('mp-modal-hidden');
  const isEditorActive = !!(weaponEditorState?.isOpen);
  const isEditorFreezeActive = !!(weaponEditorState?.isOpen && weaponEditorState?.freezeAim);

  let shouldDrawCrosshair = !player.isDead && !isDevOpenForCrosshair && !isMpOpenForCrosshair && !isChatActive && GAME_STATE.current === 'PLAYING';
  const isMeleeCombat = !!(player.currentWeapon?.isMelee || player.currentWeapon?.id === 'MACHETE' || player.currentWeapon?.id === 'KNIFE' || player.currentWeapon?.id === 'AXE' || player.meleeState);
  if (isThrowingGrenade || isWeaponHolstered || isMeleeCombat || (rightStick && rightStick.armedMode === 'GRENADE')) shouldDrawCrosshair = false;
  if (isTouchDevice && !isAimingWithStick) shouldDrawCrosshair = false;

  // Wymuś widoczność celownika w trybie edytora broni i zamrożonego celowania
  if (!player.isDead && isEditorActive) {
    if (isEditorFreezeActive) {
      // W zamrożonym celowaniu rysuj celownik w pozie celowania (AIM)
      shouldDrawCrosshair = (weaponEditorState.previewPose === 'AIM');
    } else {
      shouldDrawCrosshair = true;
    }
  }

  if (shouldDrawCrosshair) {
    if (isEditorFreezeActive && weaponEditorState?.previewPose === 'AIM') {
      const muzzle = getMuzzlePosition(player, player.currentWeapon);
      const chX = muzzle.muzzleX + Math.cos(muzzle.barrelAngle) * 300;
      const chY = muzzle.muzzleY + Math.sin(muzzle.barrelAngle) * 300;
      drawCrosshair(ctx, chX, chY);
    } else {
      drawCrosshair(ctx, player.aimX, player.aimY);
    }
  }

  // Renderowanie elementów areny na pierwszym planie (np. łańcuchy, ołtarz, stemple)
  renderArenaForeground(ctx, camera);

  const isDebugCol = (typeof isDebugCollidersEnabled === 'function') ? isDebugCollidersEnabled() : DEBUG_COLLIDERS;
  if (isDebugCol && typeof drawDebugColliders === 'function') {
    drawDebugColliders(ctx, effectiveDrawGroundY, player, { activeBots, remotePlayer, ball });
  }

  drawShockwaves(ctx, camera);
  drawLighting(ctx, camera, activeArenaId);

  ctx.restore();

  drawCinematicVignette(ctx);
  drawZombieHUD(ctx);

  if (isDebugCol && (typeof window !== 'undefined' && !!window.DEBUG_MODE)) {
    ctx.save();
    ctx.font = 'bold 11px monospace';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = '#ffffff';
    const dbgTxt = 'LINIE KOLIZJI: WŁ (PRZERYWANA BIAŁA LINIA) [F1 / ~ / DEV]';
    ctx.strokeText(dbgTxt, 16, 24);
    ctx.fillText(dbgTxt, 16, 24);
    ctx.restore();
  }

  const isMatchRunning = (GAME_STATE.current === 'PLAYING' || GAME_STATE.current === 'PAUSED' || (GAME_STATE.current === 'SETTINGS' && GAME_STATE.previous !== 'MENU'));
  if (isMatchRunning) {
    const inKickRange = (!isDeathmatch && ball && typeof isBallInKickReach === 'function') ? isBallInKickReach(player, ball) : false;
    drawHUD(ctx, player, leftStick, btnCluster, rightStick, isDeathmatch ? null : ball, inKickRange, { activeArenaId, arenaScore, arena1State, bot, remotePlayer });
    const currentActiveBots = (typeof getActiveBots === 'function') ? getActiveBots() : (bot.active ? [bot] : []);
    const activeRemotes = (typeof getActiveRemotePlayers === 'function') ? getActiveRemotePlayers() : (remotePlayer.active ? [remotePlayer] : []);
    const combatants = [player, ...currentActiveBots, ...activeRemotes];
    drawKillstreakWorld(ctx, camera, combatants, player);
    drawKillstreakHUD(ctx, canvas, player);
    drawCallouts(ctx, camera, canvas);
    drawPickupPrompt(ctx, camera, isTouchDevice);
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
    ctx.strokeStyle = '#050810';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = '#00e5ff';
    const currentToolLabel = editorState.selectedType ? `[NARZĘDZIE: ${getObstacleDef(editorState.selectedType)?.name || editorState.selectedType}]` : '[WYBIERZ PRZESZKODĘ Z MENU DEV]';
    const edTxt = `EDYTOR: ${currentToolLabel} | LPM: Postaw | PPM: Usuń/Anuluj | Ctrl+Z: Cofnij`;
    ctx.strokeText(edTxt, W / 2, bannerY + 17);
    ctx.fillText(edTxt, W / 2, bannerY + 17);
    ctx.restore();
  }
}

const TICK_MS = 1000 / 60; // 16.666667 ms (stały krok fizyki: dokładnie 60 Hz)
const MAX_DELTA = 75;      // Zabezpieczenie przed spiralą opóźnień przy lagach lub uśpieniu karty
let accumulator = 0;
let lastTime = 0;

// Automatyczna ciągła adaptacja do częstotliwości odświeżania monitora gracza (60Hz / 75Hz / 90Hz / 120Hz / 144Hz / 240Hz)
let detectedRefreshRate = 60;
let refreshSampleCount = 0;
let refreshSampleSum = 0;

function loop(now) {
  requestAnimationFrame(loop);
  const currentTime = (typeof now === 'number' && now > 0) ? now : performance.now();
  if (lastTime === 0) {
    lastTime = currentTime;
    update();
    draw();
    return;
  }

  let delta = currentTime - lastTime;
  lastTime = currentTime;

  // Ochrona przed skokami czasu (np. pauza GC w silniku przeglądarki lub wygaszenie ekranu)
  // Zapobiega "przeskakiwaniu" postaci i obiektów po chwilowym zacięciu
  if (delta > 100) {
    delta = TICK_MS;
    accumulator = 0;
  } else if (delta > MAX_DELTA) {
    delta = MAX_DELTA;
  }
  if (delta < 0) delta = 0;

  // Ciągła adaptacja do ekranów adaptacyjnych (iPhone ProMotion / Poco AdaptiveSync / Dynamic 120Hz <-> 60Hz)
  if (delta >= 3.0 && delta <= 30.0) {
    refreshSampleSum += delta;
    refreshSampleCount++;
    if (refreshSampleCount >= 60) {
      const avg = refreshSampleSum / refreshSampleCount;
      refreshSampleSum = 0;
      refreshSampleCount = 0;
      if (avg >= 15.0 && avg <= 18.2) {
        detectedRefreshRate = 60;
      } else if (avg >= 12.2 && avg <= 14.5) {
        detectedRefreshRate = 75;
      } else if (avg >= 10.0 && avg <= 12.0) {
        detectedRefreshRate = 90;
      } else if (avg >= 7.5 && avg <= 9.3) {
        detectedRefreshRate = 120;
      } else if (avg >= 6.4 && avg <= 7.4) {
        detectedRefreshRate = 144;
      } else if (avg >= 3.6 && avg <= 4.8) {
        detectedRefreshRate = 240;
      }
    }
  }

  // 1. Precyzyjne wygładzanie VSync dopasowane do częstotliwości (bez sztucznego zawyżania czasu klatki)
  if (detectedRefreshRate > 0) {
    const idealFrameMs = 1000 / detectedRefreshRate;
    const tolerance = detectedRefreshRate >= 120 ? 0.95 : (detectedRefreshRate >= 90 ? 1.1 : 1.4);
    if (Math.abs(delta - idealFrameMs) <= tolerance) {
      delta = idealFrameMs;
    }
  } else if (delta >= 15.2 && delta <= 18.0) {
    // Standardowe okno 60 Hz (16.67ms ± 1.4ms)
    delta = TICK_MS;
  }

  accumulator += delta;

  // Ochrona przed spiralą opóźnień: akumulator nie może przekroczyć 1.5 kroku fizyki
  if (accumulator > TICK_MS * 1.5) {
    accumulator = TICK_MS;
  }

  // 2. Krok fizyki o stałej częstotliwości 60 Hz (maksymalnie 2 kroki na klatkę renderowania)
  let steps = 0;
  while (accumulator >= TICK_MS - 0.9 && steps < 2) {
    try {
      update();
    } catch (err) {
      console.error('[GAME LOOP UPDATE ERROR]', err);
    }
    accumulator -= TICK_MS;
    steps++;
  }

  // Ochrona przed ujemnym dryfem akumulatora
  if (steps >= 2 || accumulator < -TICK_MS) {
    accumulator = 0;
  }

  // 3. Renderowanie ściśle zsynchronizowane z krokiem fizyki (dokładnie 60 FPS):
  // Na monitorach 60Hz: steps === 1 w każdej klatce -> idealne 60 FPS bez gubienia klatek.
  // Na monitorach 120Hz/144Hz/240Hz: renderujemy dokładnie wtedy, gdy fizyka wykonała krok (stabilne 60 FPS bez przeciążania GPU).
  if (steps > 0) {
    try {
      draw();
    } catch (err) {
      console.error('[GAME LOOP DRAW ERROR]', err);
    }
  }
}

let bgSimulationInterval = null;
let lastBgTickTime = 0;

function handleBackgroundSimulation() {
  if (typeof document === 'undefined') return;

  if (document.hidden) {
    // Karta zminimalizowana lub w tle: gra sieciowa toczy się nieprzerwanie w czasie rzeczywistym
    if (!bgSimulationInterval) {
      lastBgTickTime = performance.now();
      bgSimulationInterval = setInterval(() => {
        if (!document.hidden) {
          if (bgSimulationInterval) {
            clearInterval(bgSimulationInterval);
            bgSimulationInterval = null;
          }
          return;
        }

        const isMatchActive = (GAME_STATE.current === 'PLAYING' || GAME_STATE.current === 'PAUSED' || (GAME_STATE.current === 'SETTINGS' && GAME_STATE.previous !== 'MENU'));
        if (!isMatchActive) {
          lastBgTickTime = performance.now();
          return;
        }

        const now = performance.now();
        const elapsed = now - lastBgTickTime;
        lastBgTickTime = now;

        // Stały krok fizyki TICK_MS (60 Hz). Nadrabiamy upływający czas do max 60 kroków na cykl.
        const steps = Math.min(60, Math.max(1, Math.floor(elapsed / TICK_MS)));
        for (let i = 0; i < steps; i++) {
          try {
            update();
          } catch (err) {
            console.error('[BG UPDATE ERROR]', err);
          }
        }
      }, 1000 / 60);
    }
  } else {
    // Powrót do karty: zatrzymujemy interwał tła i płynnie wznawiamy pętlę renderowania
    if (bgSimulationInterval) {
      clearInterval(bgSimulationInterval);
      bgSimulationInterval = null;
    }

    const isMatchActive = (GAME_STATE.current === 'PLAYING' || GAME_STATE.current === 'PAUSED' || (GAME_STATE.current === 'SETTINGS' && GAME_STATE.previous !== 'MENU'));
    if (lastBgTickTime > 0 && isMatchActive) {
      const now = performance.now();
      const elapsed = now - lastBgTickTime;
      const steps = Math.min(30, Math.floor(elapsed / TICK_MS));
      for (let i = 0; i < steps; i++) {
        try {
          update();
        } catch (err) {
          console.error('[RESUME UPDATE ERROR]', err);
        }
      }
    }

    lastBgTickTime = 0;
    lastTime = performance.now();
    accumulator = 0;
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', handleBackgroundSimulation);
}

if (typeof window !== 'undefined') {
  window.player = player;
  window.camera = camera;
  window.pockets = pockets;
  window.rightStick = rightStick;
  window.leftStick = leftStick;

  // Inicjalizacja podsystemu audio (Web Audio API + opcjonalne pliki z assets/audio/)
  initAudio();

  // Inicjalizacja interfejsu Menu Głównego, Ustawień oraz Pauzy
  uiManager.init({
    onStartGame: () => {
      setGameState('ARENA_SELECT');
    },
    onSelectArena: (arenaId, classId) => {
      const activeBots = (typeof getActiveBots === 'function') ? getActiveBots() : [bot];
      try {
        if (typeof window.switchArena === 'function') {
          window.switchArena(arenaId, player, activeBots, ball);
        }
      } catch (err) {
        console.error('[ARENA SWITCH ERROR]', err);
      }
      const targetCls = (classId && CLASSES[classId]) ? CLASSES[classId] : (player.currentClass || CLASSES.STRIKER || CLASSES.RAPTOR);
      selectPlayerClass(targetCls);
      startRound();
      setGameState('PLAYING');
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
    onOpenArmory: () => {
      openArmory(player, () => {
        setGameState(GAME_STATE.previous || 'MENU');
      });
      setGameState('ARMORY');
    },
    onCloseArmory: () => {
      closeArmory();
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
      const arenaName = (activeArenaId === 'ARENA_5' || activeArenaId === 'arena-5' || activeArenaId === 'PREFAB_TOWER') ? 'Prefabrykator Orbitalny' :
                        (activeArenaId === 'ARENA_4' || activeArenaId === 'arena-4' || activeArenaId === 'OBSIDIAN_CALDERA' || activeArenaId === 'CALDERA' || activeArenaId === 'OBSIDIAN' || activeArenaId === 'KRATER' || activeArenaId === 'USS_TITAN' || activeArenaId === 'TITAN' || activeArenaId === 'LOTNISKOWIEC' || activeArenaId === 'OIL_RIG_TYPHOON' || activeArenaId === 'TYPHOON' || activeArenaId === 'TYFON' || activeArenaId === 'SPACE_STATION' || activeArenaId === 'ARES') ? 'Obsidian Caldera' :
                        (activeArenaId === 'ARENA_2' || activeArenaId === 'arena-2') ? 'Toksyczna Rafineria' :
                        (activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3') ? 'Tajemnicza Dżungla' :
                        (arena?.name || 'Neonowe Miasto');
      const isDm = (activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2' || activeArenaId === 'ARENA_2_SECTOR_X' ||
                    activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY' ||
                    activeArenaId === 'ARENA_4' || activeArenaId === 'arena-4' || activeArenaId === 'OBSIDIAN_CALDERA' || activeArenaId === 'CALDERA' || activeArenaId === 'OBSIDIAN' || activeArenaId === 'KRATER' ||
                    activeArenaId === 'ARENA_5' || activeArenaId === 'arena-5' || activeArenaId === 'PREFAB_TOWER');
      let goalText = '';
      if (isDm && deathmatchState && deathmatchState.active) {
        const cond = deathmatchState.winCondition || 'BOTH';
        const frags = deathmatchState.fragLimit || 25;
        const mins = Math.round((deathmatchState.matchDuration || 300) / 60);
        if (cond === 'FRAGS') goalText = `   CEL: ${frags} FRAGOW`;
        else if (cond === 'TIME') goalText = `   CZAS: ${mins} MIN`;
        else goalText = `   CEL: ${frags} FRAGOW / ${mins} MIN`;
      }
      return `ARENA: ${arenaName.toUpperCase()}   KLASA: ${player.currentClass?.name || 'PLAYMAKER'}${goalText}`;
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
