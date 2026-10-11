// =========================================================================
// DEV/DEVPANEL.JS - NARZĘDZIA DEWELOPERSKIE (ZOOM, PAD DOTYKOWY, PANCERZ)
// Wydzielony moduł z js/main.js
// =========================================================================

import {
  W,
  H,
  camera,
  devZoomLevel,
  setDevZoom,
  isTouchDevice,
  setTouchDevice,
  spawnKnockedHelmet,
  spawnVestShreds
} from '../world.js';
import { player } from '../player.js';
import { updateButtonLayout } from '../mobileControls.js';

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
    devZoomLabel.textContent = `ZOOM: Auto`;
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
  zoomOutBtn.textContent = '🔍 - Oddal';
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
  zoomResetBtn.textContent = '🔍 Reset (1.0x)';
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
  zoomInBtn.textContent = '🔍 + Przybliż';
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
  zoomAutoBtn.textContent = '🔍 Auto';
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
    devTouchBtn.textContent = '🕹️ PAD: WŁ';
    devTouchBtn.style.borderColor = '#0284c7';
    devTouchBtn.style.color = '#38bdf8';
    devTouchBtn.style.background = 'rgba(2, 132, 199, 0.22)';
    devTouchBtn.style.boxShadow = '0 0 10px rgba(56, 189, 248, 0.35)';
  } else {
    devTouchBtn.textContent = '🕹️ PAD: WYŁ';
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
  helmBtn.title = 'Załóż / Zdejmij hełm balistyczny (spada z głowy po trafieniach!)';
  const updateHelmUI = () => {
    const hasH = !!player.hasHelmet;
    const hits = player.helmetHits || 2;
    helmBtn.textContent = hasH ? `🪖 HEŁM (${hits})` : '🧑‍🦲 BEZ HEŁMU';
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
      player.helmetHits = 2;
    }
    updateHelmUI();
  };
  helmBtn.addEventListener('click', handleHelm);
  helmBtn.addEventListener('touchend', handleHelm);
  devMenu.appendChild(helmBtn);
  updateHelmUI();

  // Przełącznik modularnej kamizelki (znika po utracie HP)
  const vestBtn = document.createElement('button');
  vestBtn.className = 'dev-btn';
  vestBtn.id = 'dev-vest-btn';
  vestBtn.title = 'Załóż / Zniszcz kamizelkę kuloodporną (znika po zużyciu wytrzymałości!)';
  const updateVestUI = () => {
    const hasV = !!player.hasVest;
    const vhp = Math.ceil(player.vestHp || 50);
    vestBtn.textContent = hasV ? `🛡️ KAMIZELKA (${vhp})` : '👕 BEZ KAMIZELKI';
    vestBtn.style.borderColor = hasV ? '#10b981' : '#64748b';
    vestBtn.style.color = hasV ? '#34d399' : '#94a3b8';
    vestBtn.style.background = hasV ? 'rgba(16, 185, 129, 0.2)' : 'transparent';
  };
  const handleVest = (e) => {
    e.stopPropagation(); e.preventDefault();
    if (player.hasVest) {
      spawnVestShreds(player.x + player.w / 2, player.y + player.h * 0.45, -(player.facing || 1) * 3.5);
      player.hasVest = false;
      player.vestHp = 0;
    } else {
      player.hasVest = true;
      player.vestHp = 50;
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


