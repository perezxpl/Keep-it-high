// =========================================================================
// DEV/OBSTACLEEDITOR.JS - INTERAKTYWNY EDYTOR PRZESZKÓD NA ŻYWO
// Wydzielony moduł z js/main.js
// =========================================================================

import { camera, GROUND_Y, spawnJetpackSparks, mouseScreenPos } from '../world.js';
import {
  obstacles,
  customObstacles,
  OBSTACLE_PALETTE,
  getObstacleDef,
  clearCustomObstacles,
  undoCustomObstacle,
  calculateObstaclePlacement,
  normalizeObstacleType,
  activeArenaId
} from '../obstacles.js';
import {
  sendObstacleAdd,
  sendObstacleRemove,
  sendObstacleClear,
  sendObstacleUndo
} from '../network.js';

// =========================================================================
// EDYTOR PRZESZKÓD (OBSTACLE EDITOR)
// =========================================================================
export const editorState = {
  active: false,
  selectedType: null,
  snapToGrid: true,
  gridSize: 20,
  surfaceSnap: true,
  snapThreshold: 16,
  hoverX: 0,
  hoverY: 0,
  cursorWorldX: 0,
  cursorWorldY: 0
};

let devEditorBtn = null;
let devEditorSubpanel = null;
let devGridBtn = null;
let devMagnetBtn = null;
let devPaletteContainer = null;

export function initObstacleEditorUI() {
  const devMenu = document.getElementById('dev-menu');
  if (!devMenu) return;

  const sep = document.createElement('span');
  sep.style.cssText = 'color: rgba(255,255,255,0.25); margin: 0 3px;';
  sep.textContent = '|';
  devMenu.appendChild(sep);

  devEditorBtn = document.createElement('button');
  devEditorBtn.className = 'dev-btn';
  devEditorBtn.id = 'dev-editor-toggle-btn';
  devEditorBtn.title = 'Włącz / Wyłącz interaktywny Edytor Przeszkód na żywo';
  devEditorBtn.style.cssText = 'border-color: #10b981; color: #34d399; font-weight: 700;';
  devEditorBtn.textContent = 'EDYTOR: OFF';
  devMenu.appendChild(devEditorBtn);

  devEditorSubpanel = document.createElement('div');
  devEditorSubpanel.id = 'dev-editor-subpanel';
  devEditorSubpanel.style.cssText = 'display: none; align-items: center; gap: 4px; flex-wrap: wrap; margin-left: 2px;';

  devGridBtn = document.createElement('button');
  devGridBtn.className = 'dev-btn';
  devGridBtn.id = 'dev-grid-btn';
  devGridBtn.title = 'Włącz/Wyłącz przyciąganie do siatki (20px)';
  devGridBtn.style.cssText = 'border-color: #06b6d4; color: #22d3ee;';
  devGridBtn.textContent = 'SIATKA: 20px';
  devGridBtn.addEventListener('click', (e) => {
    e.stopPropagation(); e.preventDefault();
    editorState.snapToGrid = !editorState.snapToGrid;
    devGridBtn.textContent = editorState.snapToGrid ? 'SIATKA: 20px' : 'SIATKA: WYŁ';
    devGridBtn.style.color = editorState.snapToGrid ? '#22d3ee' : '#94a3b8';
  });
  devEditorSubpanel.appendChild(devGridBtn);

  devMagnetBtn = document.createElement('button');
  devMagnetBtn.className = 'dev-btn';
  devMagnetBtn.id = 'dev-magnet-btn';
  devMagnetBtn.title = 'Włącz/Wyłącz inteligentne przyciąganie do powierzchni platform i gruntu (Surface Magnet 16px)';
  devMagnetBtn.style.cssText = 'border-color: #10b981; color: #34d399; font-weight: 600;';
  devMagnetBtn.textContent = 'MAGNET: 16px';
  devMagnetBtn.addEventListener('click', (e) => {
    e.stopPropagation(); e.preventDefault();
    editorState.surfaceSnap = !editorState.surfaceSnap;
    devMagnetBtn.textContent = editorState.surfaceSnap ? 'MAGNET: 16px' : 'MAGNET: WYŁ';
    devMagnetBtn.style.color = editorState.surfaceSnap ? '#34d399' : '#94a3b8';
    devMagnetBtn.style.borderColor = editorState.surfaceSnap ? '#10b981' : 'rgba(148, 163, 184, 0.3)';
  });
  devEditorSubpanel.appendChild(devMagnetBtn);

  devPaletteContainer = document.createElement('div');
  devPaletteContainer.style.cssText = 'display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap;';
  devEditorSubpanel.appendChild(devPaletteContainer);

  const undoBtn = document.createElement('button');
  undoBtn.className = 'dev-btn';
  undoBtn.title = 'Cofnij ostatnio postawiony obiekt (Ctrl+Z)';
  undoBtn.textContent = 'COFNIJ OSTATNIĄ';
  undoBtn.addEventListener('click', (e) => {
    e.stopPropagation(); e.preventDefault();
    undoCustomObstacle();
    sendObstacleUndo();
  });
  devEditorSubpanel.appendChild(undoBtn);

  const clearBtn = document.createElement('button');
  clearBtn.className = 'dev-btn';
  clearBtn.title = 'Wyczyść wszystkie postawione przeszkody';
  clearBtn.style.cssText = 'border-color: rgba(239, 68, 68, 0.4); color: #ef4444;';
  clearBtn.textContent = 'WYCZYŚĆ WSZYSTKO';
  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation(); e.preventDefault();
    clearCustomObstacles();
    sendObstacleClear();
  });
  devEditorSubpanel.appendChild(clearBtn);

  const copyBtn = document.createElement('button');
  copyBtn.className = 'dev-btn';
  copyBtn.title = 'Skopiuj aktualny układ postawionych przeszkód do schowka jako JSON';
  copyBtn.style.cssText = 'border-color: #a855f7; color: #c084fc; font-weight: 600;';
  copyBtn.textContent = 'KOPIUJ UKŁAD (JSON)';
  copyBtn.addEventListener('click', (e) => {
    e.stopPropagation(); e.preventDefault();
    const jsonStr = JSON.stringify(customObstacles, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(jsonStr).then(() => {
        copyBtn.textContent = 'SKOPIOWANO!';
        copyBtn.style.color = '#34d399';
        setTimeout(() => {
          copyBtn.textContent = 'KOPIUJ UKŁAD (JSON)';
          copyBtn.style.color = '#c084fc';
        }, 1800);
      }).catch(() => {
        prompt('Skopiuj JSON układu przeszkód:', jsonStr);
      });
    } else {
      prompt('Skopiuj JSON układu przeszkód:', jsonStr);
    }
  });
  devEditorSubpanel.appendChild(copyBtn);

  devMenu.appendChild(devEditorSubpanel);

  const toggleEditor = (e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    editorState.active = !editorState.active;
    if (editorState.active) {
      devEditorBtn.textContent = 'EDYTOR: ON';
      devEditorBtn.style.background = 'rgba(168, 85, 247, 0.3)';
      devEditorBtn.style.borderColor = '#c084fc';
      devEditorBtn.style.color = '#ffffff';
      devEditorBtn.style.boxShadow = '0 0 12px rgba(168, 85, 247, 0.55)';
      devEditorSubpanel.style.display = 'inline-flex';
      renderEditorPalette();
    } else {
      devEditorBtn.textContent = 'EDYTOR: OFF';
      devEditorBtn.style.background = '';
      devEditorBtn.style.borderColor = '#10b981';
      devEditorBtn.style.color = '#34d399';
      devEditorBtn.style.boxShadow = '';
      devEditorSubpanel.style.display = 'none';
      editorState.selectedType = null;
    }
  };

  devEditorBtn.addEventListener('click', toggleEditor);
  devEditorBtn.addEventListener('touchend', toggleEditor);

  renderEditorPalette();
}

export function renderEditorPalette() {
  if (!devPaletteContainer) return;
  devPaletteContainer.innerHTML = '';

  const arenaKey = (activeArenaId === 'ARENA_3' || activeArenaId === 'arena-3' || activeArenaId === 'ARENA_FOUNDRY') ? 'ARENA_3' : ((activeArenaId === 'ARENA_2' || activeArenaId === 'ARENA_2_PANDORA' || activeArenaId === 'arena-2') ? 'ARENA_2' : 'ARENA_1');
  const palette = OBSTACLE_PALETTE[arenaKey] || OBSTACLE_PALETTE.ARENA_1;

  const catTitles = (arenaKey === 'ARENA_2' || arenaKey === 'ARENA_2_PANDORA' || arenaKey === 'ARENA_2_SECTOR_X') ? {
    platforms: 'Belki / Pomosty',
    defense: 'Osłony / Barykady',
    traps: 'Zbiorniki Kwasu / Para'
  } : {
    platforms: 'Kładki / Wieże',
    defense: 'Mury / Osłony',
    traps: 'Interaktywne / Pułapki'
  };

  const categories = ['platforms', 'defense', 'traps'];

  for (const cat of categories) {
    const items = palette.filter(p => p.category === cat);
    if (items.length === 0) continue;

    const catGroup = document.createElement('div');
    catGroup.style.cssText = 'display: inline-flex; align-items: center; gap: 3px; background: rgba(15, 23, 42, 0.65); padding: 2px 5px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.08); margin: 1px 2px;';

    const catBadge = document.createElement('span');
    catBadge.style.cssText = 'font-size: 8.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-right: 2px; white-space: nowrap;';
    catBadge.textContent = catTitles[cat] || cat;
    catGroup.appendChild(catBadge);

    for (const item of items) {
      const btn = document.createElement('button');
      btn.className = 'dev-btn dev-tool-btn';
      btn.dataset.tool = item.type;
      btn.title = item.name + ` (${item.w}x${item.h})`;
      btn.textContent = item.label || item.name;

      btn.addEventListener('click', (e) => {
        e.stopPropagation(); e.preventDefault();
        if (editorState.selectedType === item.type) {
          editorState.selectedType = null;
        } else {
          editorState.selectedType = item.type;
        }
        updateEditorPaletteHighlight();
      });

      catGroup.appendChild(btn);
    }

    devPaletteContainer.appendChild(catGroup);
  }

  updateEditorPaletteHighlight();
}

export function updateEditorPaletteHighlight() {
  if (!devPaletteContainer) return;
  const buttons = devPaletteContainer.querySelectorAll('.dev-tool-btn');
  const selNorm = normalizeObstacleType(editorState.selectedType);
  buttons.forEach(btn => {
    const btnTool = btn.dataset.tool;
    const btnNorm = normalizeObstacleType(btnTool);
    if (btnTool === editorState.selectedType || (selNorm && btnNorm === selNorm)) {
      btn.style.background = 'rgba(0, 229, 255, 0.35)';
      btn.style.borderColor = '#00e5ff';
      btn.style.color = '#ffffff';
      btn.style.boxShadow = '0 0 10px rgba(0, 229, 255, 0.6)';
    } else {
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
      btn.style.boxShadow = '';
    }
  });
}

export function placeSelectedObstacle(mouseScreenX = (mouseScreenPos ? mouseScreenPos.x : 640), mouseScreenY = (mouseScreenPos ? mouseScreenPos.y : 360)) {
  if (!editorState.selectedType) return;
  const def = getObstacleDef(editorState.selectedType);
  if (!def) return;

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
  const normType = normalizeObstacleType(def.type);
  let w = placement.w;
  let h = placement.h;
  if (!w || w <= 0) {
    w = normType === 'ammo_depot' ? 32 : (normType === 'sandbags' ? 48 : (def.w || 40));
  }
  if (!h || h <= 0) {
    h = normType === 'ammo_depot' ? 24 : (normType === 'sandbags' ? 24 : (def.h || 20));
  }

  const newObs = {
    id: 'custom_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    type: def.type,
    name: def.name,
    x: px,
    y: py,
    w: w,
    h: h,
    size: def.size || w,
    relY: GROUND_Y - py,
    thickness: h,
    isPlatform: def.isPlatform || false,
    solid: def.solid || false,
    isPickup: def.isPickup !== undefined ? def.isPickup : (normType === 'ammo_depot'),
    isInteractable: def.isInteractable !== undefined ? def.isInteractable : (normType === 'ammo_depot')
  };

  customObstacles.push(newObs);
  obstacles.push(newObs);
  spawnJetpackSparks(px + w / 2, py + h / 2, 0, 4);
  sendObstacleAdd(newObs);
}

export function handleEditorRightClick(mouseScreenX = (mouseScreenPos ? mouseScreenPos.x : 640), mouseScreenY = (mouseScreenPos ? mouseScreenPos.y : 360)) {
  const worldX = camera.x + mouseScreenX / camera.zoom;
  const worldY = camera.y + mouseScreenY / camera.zoom;

  for (let i = customObstacles.length - 1; i >= 0; i--) {
    const obs = customObstacles[i];
    const topY = obs.y !== undefined ? obs.y : (GROUND_Y - obs.relY);
    if (worldX >= obs.x - 10 && worldX <= obs.x + obs.w + 10 &&
      worldY >= topY - 10 && worldY <= topY + obs.h + 10) {
      spawnJetpackSparks(obs.x + obs.w / 2, topY + obs.h / 2, 0, 6);
      sendObstacleRemove(obs);
      customObstacles.splice(i, 1);
      const obsIdx = obstacles.indexOf(obs);
      if (obsIdx >= 0) obstacles.splice(obsIdx, 1);
      return;
    }
  }

  editorState.selectedType = null;
  updateEditorPaletteHighlight();
}


