// =========================================================================
// DEV/DEVPANEL.JS - NARZĘDZIA DEWELOPERSKIE (PANEL DEV, BOT, ARENA, ZOOM, PAD, PANCERZ)
// Wydzielony moduł z js/main.js
// =========================================================================

import {
  W,
  H,
  GROUND_Y,
  camera,
  clampCamera,
  devZoomLevel,
  setDevZoom,
  isTouchDevice,
  setTouchDevice,
  spawnKnockedHelmet,
  spawnVestShreds
} from '../world.js';
import { player } from '../player.js';
import { bot, isBotEnabled, setBotEnabled } from '../bot.js';
import { ball } from '../ball.js';
import { switchArena, activeArenaId } from '../obstacles.js';
import { getActiveArena, isDebugCollidersEnabled, toggleDebugColliders } from '../renderer.js';
import { sendArenaSwitch, updateCursorVisibility } from '../network.js';
import { uiManager } from '../uiManager.js';
import { updateButtonLayout } from '../mobileControls.js';
import { editorState, renderEditorPalette } from './obstacleEditor.js';

// =========================================================================
// PANEL DEWELOPERSKI (PRZECIĄGANIE, PRZEŁĄCZANIE, BOT, ARENA)
// =========================================================================
export function toggleDevPanel() {
  const devMenu = document.getElementById('dev-menu');
  const devToggleBtn = document.getElementById('dev-toggle-btn');
  if (!devMenu) return;
  const isHidden = devMenu.classList.toggle('dev-menu-hidden');
  if (devToggleBtn) {
    if (isHidden) devToggleBtn.classList.remove('active');
    else devToggleBtn.classList.add('active');
  }
  updateCursorVisibility();
}
if (typeof window !== 'undefined') {
  window.toggleDevPanel = toggleDevPanel;
}

export function syncDevBotButtonUI() {
  const btn = document.getElementById('dev-bot-toggle-btn');
  if (!btn) return;
  const active = (typeof isBotEnabled === 'function') ? isBotEnabled() : bot.active;
  if (active) {
    btn.textContent = 'BOT: ON';
    btn.style.background = 'rgba(168, 85, 247, 0.35)';
    btn.style.borderColor = '#c084fc';
    btn.style.color = '#ffffff';
    btn.style.boxShadow = '0 0 12px rgba(168, 85, 247, 0.6)';
  } else {
    btn.textContent = 'BOT: OFF';
    btn.style.background = '';
    btn.style.borderColor = '#a855f7';
    btn.style.color = '#c084fc';
    btn.style.boxShadow = '';
  }
}
if (typeof window !== 'undefined') {
  window.syncDevBotButtonUI = syncDevBotButtonUI;
}

export function syncDevArenaButtonUI() {
  const devArenaBtn = document.getElementById('dev-arena-btn');
  if (!devArenaBtn) return;
  const curArena = (typeof getActiveArena === 'function') ? getActiveArena() : null;
  const curId = (curArena && curArena.id) ? curArena.id : (activeArenaId || window.activeArenaId);
  if (curId === 'arena-5' || curId === 'ARENA_5' || curId === 'PREFAB_TOWER') {
    devArenaBtn.textContent = 'Arena: 5 (Prefab)';
    devArenaBtn.style.background = 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(249, 115, 22, 0.25))';
    devArenaBtn.style.borderColor = '#eab308';
    devArenaBtn.style.color = '#fef08a';
    devArenaBtn.style.boxShadow = '0 0 12px rgba(234, 179, 8, 0.45)';
  } else if (curId === 'arena-4' || curId === 'ARENA_4' || curId === 'ARMORED_TRAIN' || curId === 'SPACE_STATION' || curId === 'ARES') {
    devArenaBtn.textContent = 'Arena: 4 (Ares)';
    devArenaBtn.style.background = 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(14, 165, 233, 0.25))';
    devArenaBtn.style.borderColor = '#38bdf8';
    devArenaBtn.style.color = '#bae6fd';
    devArenaBtn.style.boxShadow = '0 0 12px rgba(56, 189, 248, 0.45)';
  } else if (curId === 'arena-3' || curId === 'ARENA_3' || curId === 'ARENA_FOUNDRY') {
    devArenaBtn.textContent = 'Arena: 3 (Dżungla)';
    devArenaBtn.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(16, 185, 129, 0.25))';
    devArenaBtn.style.borderColor = '#22c55e';
    devArenaBtn.style.color = '#86efac';
    devArenaBtn.style.boxShadow = '0 0 12px rgba(34, 197, 94, 0.45)';
  } else if (curId === 'arena-2' || curId === 'ARENA_2' || curId === 'ARENA_2_PANDORA' || curId === 'ARENA_2_SECTOR_X') {
    devArenaBtn.textContent = 'Arena: 2 (Sektor X)';
    devArenaBtn.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(16, 185, 129, 0.25))';
    devArenaBtn.style.borderColor = '#f59e0b';
    devArenaBtn.style.color = '#fde68a';
    devArenaBtn.style.boxShadow = '0 0 12px rgba(245, 158, 11, 0.55)';
  } else {
    devArenaBtn.textContent = 'Arena: 1';
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
  } else if (curId === 'arena-3' || curId === 'ARENA_3' || curId === 'ARENA_FOUNDRY') {
    nextArena = 'ARENA_4';
  } else if (curId === 'arena-4' || curId === 'ARENA_4' || curId === 'ARMORED_TRAIN' || curId === 'SPACE_STATION' || curId === 'ARES') {
    nextArena = 'ARENA_5';
  } else {
    nextArena = 'ARENA_1';
  }
  const currentBots = (typeof window !== 'undefined' && typeof window.getActiveBots === 'function') ? window.getActiveBots() : bot;
  switchArena(nextArena, player, currentBots, ball);
  window.activeArenaId = activeArenaId;
  sendArenaSwitch(nextArena);
  syncDevArenaButtonUI();
  if (typeof uiManager !== 'undefined' && uiManager && typeof uiManager.updateMpArenaUI === 'function') {
    uiManager.updateMpArenaUI(nextArena);
  }
  if (nextArena !== 'ARENA_5') {
    camera.targetX = player.x - (camera.viewWidth || (W / camera.zoom)) / 2;
    camera.x = camera.targetX;
    camera.targetY = player.y - (camera.viewHeight || (H / camera.zoom)) * 0.72;
    camera.y = camera.targetY;
    clampCamera();
  }
  if (editorState.active) {
    renderEditorPalette();
  }
};

export function initDevMainControls({ teleportToDistance, devSetClass }) {
  const devPanelContainer = document.getElementById('dev-panel-container');
  const devToggleBtn = document.getElementById('dev-toggle-btn');
  const devMenu = document.getElementById('dev-menu');

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
      try { devToggleBtn.setPointerCapture(e.pointerId); } catch (_) { }
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
      try { devToggleBtn.releasePointerCapture(e.pointerId); } catch (_) { }
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
      if (!isNaN(meters) && typeof teleportToDistance === 'function') teleportToDistance(meters);
    };
    btn.addEventListener('click', handler);
    btn.addEventListener('touchend', handler);
  });

  document.querySelectorAll('.dev-class-btn').forEach((btn) => {
    const handler = (e) => {
      e.stopPropagation(); e.preventDefault();
      const classId = btn.getAttribute('data-class');
      if (typeof devSetClass === 'function') devSetClass(classId);
    };
    btn.addEventListener('click', handler);
    btn.addEventListener('touchend', handler);
  });

  const devBotToggleBtn = document.getElementById('dev-bot-toggle-btn');
  let devBotFreezeBtn = document.getElementById('dev-bot-freeze-btn');

  if (devBotToggleBtn) {
    const toggleBot = (e) => {
      e.stopPropagation();
      e.preventDefault();
      const nextActive = (typeof isBotEnabled === 'function') ? !isBotEnabled() : !bot.active;
      if (typeof setBotEnabled === 'function') {
        setBotEnabled(nextActive);
      } else {
        bot.active = nextActive;
      }
      syncDevBotButtonUI();
      if (typeof uiManager !== 'undefined' && uiManager && typeof uiManager.syncBotActiveUI === 'function') {
        uiManager.syncBotActiveUI(nextActive);
      }
      if (nextActive) {
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
      }
    };
    devBotToggleBtn.addEventListener('click', toggleBot);
    devBotToggleBtn.addEventListener('touchend', toggleBot);
  }

  if (!devBotFreezeBtn && devMenu) {
    devBotFreezeBtn = document.createElement('button');
    devBotFreezeBtn.className = 'dev-btn';
    devBotFreezeBtn.id = 'dev-bot-freeze-btn';
    devBotFreezeBtn.style.cssText = 'border-color: #eab308; color: #facc15; font-weight: 600; margin-left: 2px;';
    devBotFreezeBtn.textContent = 'BOT: RUCH';

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
        devBotFreezeBtn.textContent = 'BOT: STOI';
        devBotFreezeBtn.style.background = 'rgba(234, 179, 8, 0.35)';
        devBotFreezeBtn.style.borderColor = '#facc15';
        devBotFreezeBtn.style.color = '#ffffff';
        devBotFreezeBtn.style.boxShadow = '0 0 10px rgba(234, 179, 8, 0.6)';
      } else {
        devBotFreezeBtn.textContent = 'BOT: RUCH';
        devBotFreezeBtn.style.background = '';
        devBotFreezeBtn.style.borderColor = '#eab308';
        devBotFreezeBtn.style.color = '#facc15';
        devBotFreezeBtn.style.boxShadow = '';
      }
    };
    devBotFreezeBtn.addEventListener('click', toggleFreeze);
    devBotFreezeBtn.addEventListener('touchend', toggleFreeze);
  }

  window.toggleArena = toggleArena;
  window.switchArena = (id) => {
    const currentBots = (typeof window !== 'undefined' && typeof window.getActiveBots === 'function') ? window.getActiveBots() : bot;
    switchArena(id, player, currentBots, ball);
    window.activeArenaId = activeArenaId;
    sendArenaSwitch(id);
    syncDevArenaButtonUI();
    if (typeof uiManager !== 'undefined' && uiManager && !uiManager._isSwitchingArena) {
      if (typeof uiManager.updateMpArenaUI === 'function') uiManager.updateMpArenaUI(id);
      const norm = (id === 'ARENA_5' || id === 'arena-5' || id === 'PREFAB_TOWER') ? 'ARENA_5' :
                   ((id === 'ARENA_4' || id === 'arena-4') ? 'ARENA_4' :
                   ((id === 'ARENA_3' || id === 'arena-3') ? 'ARENA_3' :
                   ((id === 'ARENA_2' || id === 'arena-2') ? 'ARENA_2' : 'ARENA_1')));
      const curSelected = uiManager.briefingArenas?.[uiManager.currentBriefingIndex]?.id;
      if (curSelected !== norm && typeof uiManager.updateArenaSelectUI === 'function') {
        uiManager.updateArenaSelectUI(id);
      }
    }
    if (id !== 'ARENA_5' && id !== 'arena-5' && id !== 'PREFAB_TOWER') {
      camera.targetX = player.x - (camera.viewWidth || (W / camera.zoom)) / 2;
      camera.x = camera.targetX;
      camera.targetY = player.y - (camera.viewHeight || (H / camera.zoom)) * 0.72;
      camera.y = camera.targetY;
      clampCamera();
    }
  };

  const devArenaBtn = document.getElementById('dev-arena-btn');
  if (devArenaBtn) {
    devArenaBtn.addEventListener('click', toggleArena);
    devArenaBtn.addEventListener('touchend', toggleArena);
    syncDevArenaButtonUI();
  }

  initDevCollisionUI();
}

// =========================================================================
// DEV COLLISION LINES VISUALIZER (PODGLĄD LINII KOLIZJI - BIAŁA PRZERYWANA)
// =========================================================================
export function syncDevCollisionButtonUI() {
  const btn = document.getElementById('dev-collision-btn');
  if (!btn) return;
  const isColActive = (typeof isDebugCollidersEnabled === 'function')
    ? isDebugCollidersEnabled()
    : (typeof window !== 'undefined' && !!window.DEBUG_COLLIDERS);

  if (isColActive) {
    btn.textContent = 'KOLIZJE: WŁ';
    btn.style.borderColor = '#ffffff';
    btn.style.color = '#ffffff';
    btn.style.background = 'rgba(255, 255, 255, 0.22)';
    btn.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.55)';
  } else {
    btn.textContent = 'KOLIZJE: WYŁ';
    btn.style.borderColor = 'rgba(255, 255, 255, 0.25)';
    btn.style.color = '#94a3b8';
    btn.style.background = 'transparent';
    btn.style.boxShadow = 'none';
  }
}
if (typeof window !== 'undefined') {
  window.syncDevCollisionButtonUI = syncDevCollisionButtonUI;
}

export function initDevCollisionUI() {
  let devCollisionBtn = document.getElementById('dev-collision-btn');
  const devMenu = document.getElementById('dev-menu');

  if (!devCollisionBtn && devMenu) {
    const sep = document.createElement('span');
    sep.style.cssText = 'color: rgba(255,255,255,0.25); margin: 0 3px;';
    sep.textContent = '|';
    devMenu.appendChild(sep);

    devCollisionBtn = document.createElement('button');
    devCollisionBtn.className = 'dev-btn';
    devCollisionBtn.id = 'dev-collision-btn';
    devCollisionBtn.title = 'Włącz / Wyłącz podgląd linii kolizji (przerywana biała linia) [Skrót: F1 / ~]';
    devMenu.appendChild(devCollisionBtn);
  }

  if (devCollisionBtn) {
    let lastToggleTime = 0;
    const handleToggle = (e) => {
      e.stopPropagation();
      e.preventDefault();
      const now = Date.now();
      if (now - lastToggleTime < 250) return;
      lastToggleTime = now;
      if (typeof toggleDebugColliders === 'function') {
        toggleDebugColliders();
      } else if (typeof window !== 'undefined' && typeof window.toggleDebugColliders === 'function') {
        window.toggleDebugColliders();
      }
      syncDevCollisionButtonUI();
    };
    devCollisionBtn.addEventListener('click', handleToggle);
    devCollisionBtn.addEventListener('touchend', handleToggle);
    syncDevCollisionButtonUI();
  }
}

// =========================================================================
// DEV ZOOM CONTROLS (PRZYBLIŻANIE / ODDALANIE KAMERY W MENU DEV)
// =========================================================================
let devZoomLabel = null;

export function updateDevZoomLabel() {
  if (!devZoomLabel) return;
  if (devZoomLevel !== null) {
    devZoomLabel.textContent = `ZOOM: ${devZoomLevel.toFixed(2)}x`;
    devZoomLabel.style.color = '#38bdf8';
    devZoomLabel.style.borderColor = 'rgba(56, 189, 248, 0.4)';
  } else {
    const liveVal = (typeof camera !== 'undefined' && camera && typeof camera.zoom === 'number')
      ? ` (${camera.zoom.toFixed(2)}x)`
      : '';
    devZoomLabel.textContent = `ZOOM: Auto${liveVal}`;
    devZoomLabel.style.color = '#94a3b8';
    devZoomLabel.style.borderColor = 'rgba(148, 163, 184, 0.2)';
  }
}

export function initDevZoomUI() {
  const devMenu = document.getElementById('dev-menu');
  if (!devMenu) return;

  const sep = document.createElement('span');
  sep.style.cssText = 'color: rgba(255,255,255,0.25); margin: 0 3px;';
  sep.textContent = '|';
  devMenu.appendChild(sep);

  devZoomLabel = document.createElement('span');
  devZoomLabel.className = 'dev-btn';
  devZoomLabel.id = 'dev-zoom-label';
  devZoomLabel.style.cssText = 'color: #94a3b8; font-weight: 700; cursor: default; user-select: none;';
  devZoomLabel.textContent = 'ZOOM: Auto';
  devMenu.appendChild(devZoomLabel);

  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.className = 'dev-btn';
  zoomOutBtn.id = 'dev-zoom-out-btn';
  zoomOutBtn.title = 'Oddal widok kamery (-0.25x)';
  zoomOutBtn.textContent = '- Oddal';
  const handleZoomOut = (e) => {
    e.stopPropagation(); e.preventDefault();
    const cur = devZoomLevel !== null ? devZoomLevel : camera.zoom;
    setDevZoom(cur - 0.25);
    updateDevZoomLabel();
  };
  zoomOutBtn.addEventListener('click', handleZoomOut);
  zoomOutBtn.addEventListener('touchend', handleZoomOut);
  devMenu.appendChild(zoomOutBtn);

  const zoomResetBtn = document.createElement('button');
  zoomResetBtn.className = 'dev-btn';
  zoomResetBtn.id = 'dev-zoom-reset-btn';
  zoomResetBtn.title = 'Ustaw zoom dokładnie na 1.0x (widok 1:1)';
  zoomResetBtn.textContent = 'Reset (1.0x)';
  const handleZoomReset = (e) => {
    e.stopPropagation(); e.preventDefault();
    setDevZoom(1.0);
    updateDevZoomLabel();
  };
  zoomResetBtn.addEventListener('click', handleZoomReset);
  zoomResetBtn.addEventListener('touchend', handleZoomReset);
  devMenu.appendChild(zoomResetBtn);

  const zoomInBtn = document.createElement('button');
  zoomInBtn.className = 'dev-btn';
  zoomInBtn.id = 'dev-zoom-in-btn';
  zoomInBtn.title = 'Przybliż widok kamery (+0.25x, max 2.5x)';
  zoomInBtn.textContent = '+ Przybliż';
  const handleZoomIn = (e) => {
    e.stopPropagation(); e.preventDefault();
    const cur = devZoomLevel !== null ? devZoomLevel : camera.zoom;
    setDevZoom(cur + 0.25);
    updateDevZoomLabel();
  };
  zoomInBtn.addEventListener('click', handleZoomIn);
  zoomInBtn.addEventListener('touchend', handleZoomIn);
  devMenu.appendChild(zoomInBtn);

  const zoomAutoBtn = document.createElement('button');
  zoomAutoBtn.className = 'dev-btn';
  zoomAutoBtn.id = 'dev-zoom-auto-btn';
  zoomAutoBtn.title = 'Przywróć domyślny automatyczny zoom kamery';
  zoomAutoBtn.textContent = 'Auto';
  const handleZoomAuto = (e) => {
    e.stopPropagation(); e.preventDefault();
    setDevZoom(null);
    updateDevZoomLabel();
  };
  zoomAutoBtn.addEventListener('click', handleZoomAuto);
  zoomAutoBtn.addEventListener('touchend', handleZoomAuto);
  devMenu.appendChild(zoomAutoBtn);

  updateDevZoomLabel();
}

let devTouchBtn = null;
export function updateDevTouchButtonUI() {
  if (!devTouchBtn) return;
  if (isTouchDevice) {
    devTouchBtn.textContent = 'PAD: WŁ';
    devTouchBtn.style.borderColor = '#0284c7';
    devTouchBtn.style.color = '#38bdf8';
    devTouchBtn.style.background = 'rgba(2, 132, 199, 0.22)';
    devTouchBtn.style.boxShadow = '0 0 10px rgba(56, 189, 248, 0.35)';
  } else {
    devTouchBtn.textContent = 'PAD: WYŁ';
    devTouchBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    devTouchBtn.style.color = '#94a3b8';
    devTouchBtn.style.background = 'transparent';
    devTouchBtn.style.boxShadow = 'none';
  }
}

export function toggleTouchControls(forceVal) {
  const nextVal = (typeof forceVal === 'boolean') ? forceVal : !isTouchDevice;
  setTouchDevice(nextVal);
  if (nextVal) {
    updateButtonLayout(W, H);
  }
  updateDevTouchButtonUI();
  const hudPauseBtn = document.getElementById('hud-pause-btn');
  if (hudPauseBtn) {
    const isOverlayOpen = document.getElementById('pause-overlay')?.style.display === 'flex' ||
                          document.getElementById('main-menu-overlay')?.style.display === 'flex' ||
                          document.getElementById('settings-overlay')?.style.display === 'flex' ||
                          document.getElementById('creator-overlay')?.style.display === 'flex';
    if (!isOverlayOpen) {
      hudPauseBtn.style.display = nextVal ? 'flex' : 'none';
    }
  }
}
window.toggleTouchControls = toggleTouchControls;

export function initTouchControlsDevUI() {
  const devMenu = document.getElementById('dev-menu');
  if (!devMenu) return;

  const sep = document.createElement('span');
  sep.style.cssText = 'color: rgba(255,255,255,0.25); margin: 0 3px;';
  sep.textContent = '|';
  devMenu.appendChild(sep);

  devTouchBtn = document.createElement('button');
  devTouchBtn.className = 'dev-btn';
  devTouchBtn.id = 'dev-touch-toggle-btn';
  devTouchBtn.title = 'Włącz / Wyłącz ekranowy pad dotykowy (Wirtualny joystick i przyciski akcji) [Skrót: P]';
  const handleToggle = (e) => {
    e.stopPropagation(); e.preventDefault();
    toggleTouchControls();
  };
  devTouchBtn.addEventListener('click', handleToggle);
  devTouchBtn.addEventListener('touchend', handleToggle);
  devMenu.appendChild(devTouchBtn);
  updateDevTouchButtonUI();
}

export function initModularGearDevUI() {
  const devMenu = document.getElementById('dev-menu');
  if (!devMenu) return;

  const sep = document.createElement('span');
  sep.style.cssText = 'color: rgba(255,255,255,0.25); margin: 0 3px;';
  sep.textContent = '|';
  devMenu.appendChild(sep);

  // Przełącznik modularnego hełmu (spada po strzałach w głowę)
  const helmBtn = document.createElement('button');
  helmBtn.className = 'dev-btn';
  helmBtn.id = 'dev-helmet-btn';
  helmBtn.title = 'Załóż / Zdejmij hełm balistyczny (chroni przed headshotem na krótko!)';
  const updateHelmUI = () => {
    const hasH = !!player.hasHelmet;
    helmBtn.textContent = hasH ? 'HEŁM: WŁ' : 'HEŁM: BRAK';
    helmBtn.style.borderColor = hasH ? '#06b6d4' : '#64748b';
    helmBtn.style.color = hasH ? '#22d3ee' : '#94a3b8';
    helmBtn.style.background = hasH ? 'rgba(6, 182, 212, 0.2)' : 'transparent';
  };
  const handleHelm = (e) => {
    e.stopPropagation(); e.preventDefault();
    if (player.hasHelmet) {
      // Jeśli miał założony hełm – strąć go fizycznie w powietrze!
      spawnKnockedHelmet(
        player.x + player.w / 2,
        player.y + 6,
        -(player.facing || 1) * 5.2,
        -7.0,
        player.customVisuals?.helmetColor || player.currentClass?.visuals?.helmetColor || '#27272a',
        '#00e5ff'
      );
      player.hasHelmet = false;
      player.helmetHits = 0;
    } else {
      player.hasHelmet = true;
      player.helmetHits = 1;
    }
    updateHelmUI();
  };
  helmBtn.addEventListener('click', handleHelm);
  helmBtn.addEventListener('touchend', handleHelm);
  devMenu.appendChild(helmBtn);
  updateHelmUI();

  // Przełącznik modularnej kamizelki (chroni tylko tors, posiada 60 HP)
  const vestBtn = document.createElement('button');
  vestBtn.className = 'dev-btn';
  vestBtn.id = 'dev-vest-btn';
  vestBtn.title = 'Załóż / Zdejmij kamizelkę kuloodporną (posiada własne 60 HP na tors!)';
  const updateVestUI = () => {
    const hasV = !!(player.hasVest && (player.vestHp || 0) > 0);
    const vhp = Math.ceil(player.vestHp || (player.hasVest ? 60 : 0));
    vestBtn.textContent = hasV ? `KAMIZELKA: ${vhp} HP` : 'KAMIZELKA: BRAK';
    vestBtn.style.borderColor = hasV ? '#10b981' : '#64748b';
    vestBtn.style.color = hasV ? '#34d399' : '#94a3b8';
    vestBtn.style.background = hasV ? 'rgba(16, 185, 129, 0.2)' : 'transparent';
  };
  const handleVest = (e) => {
    e.stopPropagation(); e.preventDefault();
    if (player.hasVest && (player.vestHp || 0) > 0) {
      spawnVestShreds(player.x + player.w / 2, player.y + player.h * 0.45, -(player.facing || 1) * 3.5);
      player.hasVest = false;
      player.vestHp = 0;
    } else {
      player.hasVest = true;
      player.vestHp = 60;
      player.vestMaxHp = 60;
    }
    updateVestUI();
  };
  vestBtn.addEventListener('click', handleVest);
  vestBtn.addEventListener('touchend', handleVest);
  devMenu.appendChild(vestBtn);
  updateVestUI();

  if (typeof window !== 'undefined') {
    window.syncArmorDevButtons = () => {
      updateHelmUI();
      updateVestUI();
    };
  }
}

window.addEventListener('wheel', (e) => {
  const devMenuEl = document.getElementById('dev-menu');
  const isDevOpen = devMenuEl && !devMenuEl.classList.contains('dev-menu-hidden');
  if (isDevOpen || e.altKey) {
    e.preventDefault();
    const current = devZoomLevel !== null ? devZoomLevel : camera.zoom;
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setDevZoom(current + delta);
    updateDevZoomLabel();
  }
}, { passive: false });
