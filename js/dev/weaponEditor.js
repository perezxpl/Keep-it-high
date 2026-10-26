// =========================================================================
// DEV/WEAPONEDITOR.JS - INTERAKTYWNY EDYTOR UŁOŻENIA I CHWYTU BRONI NA ŻYWO
// =========================================================================

import { player } from '../player.js';
import { WEAPONS, WEAPON_GRIP_CONFIGS, getWeaponLevelAimY } from '../weapons/transform.js';
import { WEAPON_SPRITE_PIVOTS } from '../weapons/renderer.js';

// Kopia wartości fabrycznych do resetowania
const DEFAULT_GRIP_CONFIGS = JSON.parse(JSON.stringify(WEAPON_GRIP_CONFIGS));
const DEFAULT_SPRITE_PIVOTS = JSON.parse(JSON.stringify(WEAPON_SPRITE_PIVOTS));

export const WEAPON_EDITOR_LIST = [
  { id: 'AK47', label: 'AK-47', category: 'GŁÓWNA' },
  { id: 'SHOTGUN', label: 'SPAS-12', category: 'GŁÓWNA' },
  { id: 'SNIPER', label: 'Barrett .50', category: 'GŁÓWNA' },
  { id: 'GLOCK', label: 'Glock 17', category: 'BOCZNA' },
  { id: 'REVOLVER', label: 'Magnum .44', category: 'BOCZNA' },
  { id: 'SAWED_OFF', label: 'Obrzyn 12G', category: 'BOCZNA' },
  { id: 'RPG7', label: 'RPG-7', category: 'BOCZNA' },
  { id: 'KNIFE', label: 'Nóż M9', category: 'BIAŁA' },
  { id: 'MACHETE', label: 'Maczeta Kukri', category: 'BIAŁA' },
  { id: 'AXE', label: 'Toporek Tomahawk', category: 'BIAŁA' }
];

export const weaponEditorState = {
  isOpen: false,
  selectedId: 'REVOLVER',
  freezeAim: true,
  previewPose: 'AIM', // 'AIM' | 'WALK' | 'RUN'
  aimFacing: 1, // 1 = prawo, -1 = lewo
  aimElevation: 0 // lekki kąt pionowy (0 = idealnie poziomo)
};

const STORAGE_KEY = 'kih_weapon_tuning_v17';

/**
 * Załadowanie zapisanych modyfikacji z localStorage
 */
export function loadSavedWeaponTuning() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.grips) {
      for (const [id, cfg] of Object.entries(data.grips)) {
        if (WEAPON_GRIP_CONFIGS[id]) {
          Object.assign(WEAPON_GRIP_CONFIGS[id], cfg);
        }
      }
    }
    if (data.pivots) {
      for (const [id, pvt] of Object.entries(data.pivots)) {
        if (WEAPON_SPRITE_PIVOTS[id]) {
          Object.assign(WEAPON_SPRITE_PIVOTS[id], pvt);
        }
      }
    }
  } catch (err) {
    console.warn('[WEAPON_EDITOR] Nie udało się załadować strojenia broni:', err);
  }
}

/**
 * Zapisanie bieżącego strojenia do localStorage
 */
function saveWeaponTuning() {
  try {
    const data = {
      grips: WEAPON_GRIP_CONFIGS,
      pivots: WEAPON_SPRITE_PIVOTS
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[WEAPON_EDITOR] Błąd zapisu do localStorage:', err);
  }
}

let editorContainer = null;
let devWeaponBtn = null;

/**
 * Inicjalizacja interfejsu edytora broni
 */
export function initWeaponEditorUI() {
  loadSavedWeaponTuning();

  const devMenu = document.getElementById('dev-menu');
  if (devMenu) {
    const sep = document.createElement('span');
    sep.style.cssText = 'color: rgba(255,255,255,0.25); margin: 0 3px;';
    sep.textContent = '|';
    devMenu.appendChild(sep);

    devWeaponBtn = document.createElement('button');
    devWeaponBtn.className = 'dev-btn';
    devWeaponBtn.id = 'dev-weapon-editor-btn';
    devWeaponBtn.title = 'Interaktywny Edytor Ułożenia Broni i Dłoni (F6)';
    devWeaponBtn.style.cssText = 'border-color: #06b6d4; color: #22d3ee; font-weight: 700;';
    devWeaponBtn.textContent = 'BRONIE [F6]';
    devWeaponBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      toggleWeaponEditor();
    });
    devMenu.appendChild(devWeaponBtn);
  }

  createEditorDOM();
}

/**
 * Przełączenie widoczności edytora
 */
export function toggleWeaponEditor() {
  weaponEditorState.isOpen = !weaponEditorState.isOpen;
  if (!editorContainer) createEditorDOM();
  if (editorContainer) {
    editorContainer.style.display = weaponEditorState.isOpen ? 'flex' : 'none';
  }
  if (devWeaponBtn) {
    if (weaponEditorState.isOpen) {
      devWeaponBtn.style.background = 'rgba(6, 182, 212, 0.25)';
      devWeaponBtn.style.boxShadow = '0 0 10px rgba(6, 182, 212, 0.5)';
    } else {
      devWeaponBtn.style.background = '';
      devWeaponBtn.style.boxShadow = '';
    }
  }

  if (weaponEditorState.isOpen) {
    equipWeaponToPlayer(weaponEditorState.selectedId);
    renderEditorValues();
  }
}

if (typeof window !== 'undefined') {
  window.toggleWeaponEditor = toggleWeaponEditor;
}

/**
 * Wyposażenie postaci gracza we wskazaną broń
 */
export function equipWeaponToPlayer(weaponId) {
  if (!player) return;
  const wep = WEAPONS[weaponId];
  if (wep) {
    player.currentWeapon = wep;
    player.weaponKickback = 0;
    player.muzzleRise = 0;
    player.shootPoseWeight = 1.0;
    player.isHolstered = false;
    player.holsterWeight = 0;
  }
}

/**
 * Aktualizacja zamrożonego celowania i podglądu pozy w pętli gry
 */
export function updateWeaponEditorFreeze() {
  if (!weaponEditorState.isOpen || !weaponEditorState.freezeAim || !player) return;
  player.facing = weaponEditorState.aimFacing;
  player.weaponKickback = 0;
  player.muzzleRise = 0;

  const levelAimY = getWeaponLevelAimY(player);
  const centerX = player.x + (player.w ? player.w * 0.5 : 15);

  if (weaponEditorState.previewPose === 'AIM') {
    player.isAiming = true;
    player.shootPoseTimer = 100;
    player.shootPoseWeight = 1.0;
    player.vx = 0;
    player.gaitMode = 'IDLE';
    player.aimX = centerX + (weaponEditorState.aimFacing * 300);
    player.aimY = levelAimY + (weaponEditorState.aimElevation || 0);
  } else if (weaponEditorState.previewPose === 'WALK') {
    player.isAiming = false;
    player.shootPoseTimer = 0;
    player.shootPoseWeight = 0.0;
    player.stridePhase = (player.stridePhase || 0) + 0.04;
    player.vx = weaponEditorState.aimFacing * 1.6;
    player.gaitMode = 'WALK';
    player.onGround = true;
    player.aimX = centerX + (weaponEditorState.aimFacing * 120);
    player.aimY = levelAimY + 80;
  } else if (weaponEditorState.previewPose === 'RUN') {
    player.isAiming = false;
    player.shootPoseTimer = 0;
    player.shootPoseWeight = 0.0;
    player.stridePhase = (player.stridePhase || 0) + 0.08;
    player.vx = weaponEditorState.aimFacing * 3.8;
    player.gaitMode = 'SPRINT';
    player.onGround = true;
    player.aimX = centerX + (weaponEditorState.aimFacing * 120);
    player.aimY = levelAimY + 80;
  }
}

/**
 * Tworzenie elementu DOM okna edytora
 */
function createEditorDOM() {
  if (document.getElementById('weapon-editor-container')) {
    editorContainer = document.getElementById('weapon-editor-container');
    return;
  }

  editorContainer = document.createElement('div');
  editorContainer.id = 'weapon-editor-container';
  editorContainer.style.cssText = `
    position: fixed;
    top: 50px;
    right: 16px;
    width: 360px;
    max-height: calc(100vh - 70px);
    background: rgba(15, 23, 42, 0.94);
    border: 1px solid rgba(6, 182, 212, 0.6);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 15px rgba(6, 182, 212, 0.25);
    border-radius: 8px;
    color: #f8fafc;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 11px;
    z-index: 99999;
    display: none;
    flex-direction: column;
    backdrop-filter: blur(8px);
    user-select: none;
  `;

  // Zapobieganie przechwytywaniu zdarzeń przez grę
  ['pointerdown', 'mousedown', 'keydown', 'keyup', 'wheel', 'touchstart'].forEach((evt) => {
    editorContainer.addEventListener(evt, (e) => e.stopPropagation());
  });

  editorContainer.innerHTML = `
    <!-- HEADER -->
    <div id="we-header" style="
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px; background: rgba(30, 41, 59, 0.85);
      border-bottom: 1px solid rgba(6, 182, 212, 0.3);
      cursor: grab; border-radius: 8px 8px 0 0;
    ">
      <div style="font-weight: 800; letter-spacing: 0.05em; color: #22d3ee; display: flex; align-items: center; gap: 6px;">
        <span style="display: inline-block; width: 6px; height: 6px; background: #22d3ee; border-radius: 50%;"></span>
        EDYTOR CHWYTU I POZYCJI BRONI
      </div>
      <button id="we-close-btn" type="button" style="
        background: transparent; border: none; color: #94a3b8; font-size: 16px;
        font-weight: 700; cursor: pointer; padding: 0 4px; line-height: 1;
      " title="Zamknij (F6)">✕</button>
    </div>

    <!-- BODY SCROLL -->
    <div style="padding: 12px 14px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;">
      
      <!-- WEAPON SELECTOR -->
      <div>
        <div style="font-weight: 700; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">Wybór Broni:</div>
        <div id="we-weapon-buttons" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;"></div>
      </div>

      <!-- POSE CONTROLS -->
      <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.08); padding: 8px 10px; border-radius: 6px; display: flex; flex-direction: column; gap: 6px;">
        <div style="font-weight: 700; color: #94a3b8; text-transform: uppercase; font-size: 10px;">Podgląd Pozy Operatora:</div>
        <div style="display: flex; gap: 4px;">
          <button id="we-pose-aim-btn" type="button" class="we-btn we-btn-active" style="flex: 1;">CELOWANIE</button>
          <button id="we-pose-walk-btn" type="button" class="we-btn" style="flex: 1;">CHÓD</button>
          <button id="we-pose-run-btn" type="button" class="we-btn" style="flex: 1;">BIEG</button>
        </div>
        <div style="display: flex; gap: 4px;">
          <button id="we-aim-right-btn" type="button" class="we-btn" style="flex: 1;">PATRZ W PRAWO</button>
          <button id="we-aim-left-btn" type="button" class="we-btn" style="flex: 1;">PATRZ W LEWO</button>
        </div>
        <div style="display: flex; gap: 4px;">
          <button id="we-freeze-btn" type="button" class="we-btn" style="flex: 1; border-color: #10b981; color: #34d399;">ZAMROŻENIE CELOWANIA: ON</button>
        </div>
      </div>

      <!-- PARAMETERS SECTION -->
      <div id="we-params-container" style="display: flex; flex-direction: column; gap: 10px;">
        <!-- Wypełniane dynamicznie przez renderEditorValues -->
      </div>

      <!-- ACTION BUTTONS -->
      <div style="display: flex; flex-direction: column; gap: 6px; padding-top: 6px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
        <button id="we-copy-btn" type="button" class="we-action-btn" style="
          background: #0284c7; color: #ffffff; font-weight: 700; padding: 7px 10px;
          border: 1px solid #38bdf8; border-radius: 4px; cursor: pointer;
        ">KOPIUJ CONFIG DO SCHOWKA</button>
        
        <div style="display: flex; gap: 4px;">
          <button id="we-reset-weapon-btn" type="button" class="we-btn" style="flex: 1;">RESET TEJ BRONI</button>
          <button id="we-reset-all-btn" type="button" class="we-btn" style="flex: 1; color: #f87171; border-color: rgba(248, 113, 113, 0.4);">RESET WSZYSTKICH</button>
        </div>
      </div>

      <!-- STATUS BAR -->
      <div id="we-status" style="
        font-size: 10px; color: #38bdf8; text-align: center; min-height: 14px;
        font-style: italic;
      ">Zapisano w pamięci lokalnej (localStorage)</div>

    </div>
  `;

  document.body.appendChild(editorContainer);

  // Dodaj podstawowe style CSS dla przycisków edytora
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .we-btn {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #e2e8f0;
      padding: 5px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.12s ease;
      text-align: center;
    }
    .we-btn:hover {
      background: rgba(51, 65, 85, 0.9);
      border-color: #38bdf8;
      color: #38bdf8;
    }
    .we-btn-active {
      background: rgba(6, 182, 212, 0.25) !important;
      border-color: #22d3ee !important;
      color: #22d3ee !important;
      font-weight: 700 !important;
    }
    .we-step-btn {
      background: rgba(30, 41, 59, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #e2e8f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 700;
      cursor: pointer;
    }
    .we-step-btn:hover {
      background: #334155;
      border-color: #38bdf8;
      color: #38bdf8;
    }
  `;
  document.head.appendChild(styleEl);

  // Zdarzenia przycisków nagłówka i pozy
  document.getElementById('we-close-btn').addEventListener('click', toggleWeaponEditor);
  
  const poseAimBtn = document.getElementById('we-pose-aim-btn');
  const poseWalkBtn = document.getElementById('we-pose-walk-btn');
  const poseRunBtn = document.getElementById('we-pose-run-btn');

  const setPose = (pose) => {
    weaponEditorState.previewPose = pose;
    [poseAimBtn, poseWalkBtn, poseRunBtn].forEach((b) => b.classList.remove('we-btn-active'));
    if (pose === 'AIM') poseAimBtn.classList.add('we-btn-active');
    else if (pose === 'WALK') poseWalkBtn.classList.add('we-btn-active');
    else if (pose === 'RUN') poseRunBtn.classList.add('we-btn-active');
    updateWeaponEditorFreeze();
  };

  poseAimBtn.addEventListener('click', () => setPose('AIM'));
  poseWalkBtn.addEventListener('click', () => setPose('WALK'));
  poseRunBtn.addEventListener('click', () => setPose('RUN'));

  document.getElementById('we-aim-right-btn').addEventListener('click', () => {
    weaponEditorState.aimFacing = 1;
    updateWeaponEditorFreeze();
  });
  document.getElementById('we-aim-left-btn').addEventListener('click', () => {
    weaponEditorState.aimFacing = -1;
    updateWeaponEditorFreeze();
  });
  
  const freezeBtn = document.getElementById('we-freeze-btn');
  freezeBtn.addEventListener('click', () => {
    weaponEditorState.freezeAim = !weaponEditorState.freezeAim;
    freezeBtn.textContent = weaponEditorState.freezeAim ? 'ZAMROŻENIE CELOWANIA: ON' : 'ZAMROŻENIE CELOWANIA: OFF';
    freezeBtn.style.borderColor = weaponEditorState.freezeAim ? '#10b981' : '#64748b';
    freezeBtn.style.color = weaponEditorState.freezeAim ? '#34d399' : '#94a3b8';
  });

  document.getElementById('we-copy-btn').addEventListener('click', copyConfigToClipboard);
  document.getElementById('we-reset-weapon-btn').addEventListener('click', resetCurrentWeapon);
  document.getElementById('we-reset-all-btn').addEventListener('click', resetAllWeapons);

  // Przeciąganie okna za nagłówek
  const header = document.getElementById('we-header');
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialLeft = 0;
  let initialTop = 0;

  header.addEventListener('pointerdown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    const rect = editorContainer.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    editorContainer.style.right = 'auto';
    editorContainer.style.left = `${initialLeft}px`;
    editorContainer.style.top = `${initialTop}px`;
    header.style.cursor = 'grabbing';
    header.setPointerCapture(e.pointerId);
  });

  header.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    editorContainer.style.left = `${Math.max(8, initialLeft + dx)}px`;
    editorContainer.style.top = `${Math.max(8, initialTop + dy)}px`;
  });

  const stopDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    header.style.cursor = 'grab';
    try { header.releasePointerCapture(e.pointerId); } catch (_) {}
  };
  header.addEventListener('pointerup', stopDrag);
  header.addEventListener('pointercancel', stopDrag);

  // Renderowanie kafelków wyboru broni
  renderWeaponButtons();
}

/**
 * Renderowanie przycisków wyboru broni
 */
function renderWeaponButtons() {
  const container = document.getElementById('we-weapon-buttons');
  if (!container) return;
  container.innerHTML = '';

  WEAPON_EDITOR_LIST.forEach((w) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'we-btn' + (w.id === weaponEditorState.selectedId ? ' we-btn-active' : '');
    btn.textContent = w.label;
    btn.title = `Kategoria: ${w.category}`;
    btn.addEventListener('click', () => {
      weaponEditorState.selectedId = w.id;
      equipWeaponToPlayer(w.id);
      renderWeaponButtons();
      renderEditorValues();
    });
    container.appendChild(btn);
  });
}

/**
 * Renderowanie suwaków i przycisków dla wybranej broni
 */
export function renderEditorValues() {
  const container = document.getElementById('we-params-container');
  if (!container) return;

  const wepId = weaponEditorState.selectedId;
  const grip = WEAPON_GRIP_CONFIGS[wepId] || {};
  const pivot = WEAPON_SPRITE_PIVOTS[wepId] || { x: 0, y: 0 };

  const paramDefs = [
    {
      key: 'pivotSpriteX',
      label: 'Ułożenie Broni X - Celowanie',
      desc: 'Poziome przesunięcie grafiki broni w pikselach sprite\'a podczas celowania.',
      val: pivot.x,
      min: -300, max: 600, step: 0.5,
      steps: [-5, -1, 1, 5],
      set: (v) => { pivot.x = v; saveWeaponTuning(); }
    },
    {
      key: 'walkPivotSpriteX',
      label: 'Ułożenie Broni X - Bieg',
      desc: 'Poziome przesunięcie grafiki broni w pikselach sprite\'a podczas chodu i biegu.',
      val: (typeof pivot.walkX === 'number') ? pivot.walkX : pivot.x,
      min: -300, max: 600, step: 0.5,
      steps: [-5, -1, 1, 5],
      set: (v) => { pivot.walkX = v; saveWeaponTuning(); }
    },
    {
      key: 'pivotSpriteY',
      label: 'Ułożenie Broni Y (Sprite Pivot Y)',
      desc: 'Pionowe przesunięcie grafiki broni w pikselach sprite\'a.',
      val: pivot.y,
      min: -200, max: 500, step: 0.5,
      steps: [-5, -1, 1, 5],
      set: (v) => { pivot.y = v; saveWeaponTuning(); }
    },
    {
      key: 'angleOffset',
      label: 'Kąt Celowania (°)',
      desc: 'Kąt nachylenia/obrotu broni przy celowaniu w dłoniach w stopniach.',
      unit: '°',
      val: Math.round(((grip.angleOffset || 0) * 180 / Math.PI) * 10) / 10,
      min: -45, max: 45, step: 0.5,
      steps: [-5, -1, 1, 5],
      set: (deg) => { grip.angleOffset = deg * (Math.PI / 180); saveWeaponTuning(); }
    },
    {
      key: 'walkAngleOffset',
      label: 'Kąt Chodu / Spoczynku (°)',
      desc: 'Kąt nachylenia/obrotu broni podczas chodu i biegu w stopniach.',
      unit: '°',
      val: Math.round(((typeof grip.walkAngleOffset === 'number' ? grip.walkAngleOffset : (grip.angleOffset || 0)) * 180 / Math.PI) * 10) / 10,
      min: -45, max: 45, step: 0.5,
      steps: [-5, -1, 1, 5],
      set: (deg) => { grip.walkAngleOffset = deg * (Math.PI / 180); saveWeaponTuning(); }
    },
    {
      key: 'rearGripX',
      label: 'Prawa Ręka X - Celowanie',
      desc: 'Pozycja prawej dłoni w osi lufy (+ w przód, - w tył) podczas celowania.',
      val: grip.rearGripX || 0,
      min: -15, max: 15, step: 0.1,
      steps: [-1, -0.1, 0.1, 1],
      set: (v) => { grip.rearGripX = v; saveWeaponTuning(); }
    },
    {
      key: 'walkRearGripX',
      label: 'Prawa Ręka X - Chód/Bieg',
      desc: 'Pozycja prawej dłoni w osi lufy (+ w przód, - w tył) podczas chodu i biegu.',
      val: (typeof grip.walkRearGripX === 'number') ? grip.walkRearGripX : (grip.rearGripX || 0),
      min: -15, max: 15, step: 0.1,
      steps: [-1, -0.1, 0.1, 1],
      set: (v) => { grip.walkRearGripX = v; saveWeaponTuning(); }
    },
    {
      key: 'rearGripY',
      label: 'Prawa Ręka Y (Chwyt główny pion)',
      desc: 'Wysokość prawej dłoni na rękojeści (+ w dół, - w górę).',
      val: grip.rearGripY || 0,
      min: -15, max: 15, step: 0.1,
      steps: [-1, -0.1, 0.1, 1],
      set: (v) => { grip.rearGripY = v; saveWeaponTuning(); }
    },
    {
      key: 'foreGripX',
      label: 'Lewa Ręka X (Łoże / Chwyt wspierający)',
      desc: 'Pozycja lewej dłoni podtrzymującej broń w poziomie.',
      val: grip.foreGripX || 0,
      min: -15, max: 25, step: 0.1,
      steps: [-1, -0.1, 0.1, 1],
      set: (v) => { grip.foreGripX = v; saveWeaponTuning(); }
    },
    {
      key: 'foreGripY',
      label: 'Lewa Ręka Y (Wysokość podparcia)',
      desc: 'Wysokość lewej dłoni pod/na łożu (+ to w dół).',
      val: grip.foreGripY || 0,
      min: -15, max: 15, step: 0.1,
      steps: [-1, -0.1, 0.1, 1],
      set: (v) => { grip.foreGripY = v; saveWeaponTuning(); }
    },
    {
      key: 'barrelLen',
      label: 'Długość Lufy (Muzzle X)',
      desc: 'Punkt wylotu pocisków i błysku wystrzału w osi lufy.',
      val: grip.barrelLen || 15,
      min: 5, max: 55, step: 0.2,
      steps: [-1, -0.2, 0.2, 1],
      set: (v) => { grip.barrelLen = v; saveWeaponTuning(); }
    },
    {
      key: 'barrelOffsetY',
      label: 'Wysokość Lufy (Muzzle Y)',
      desc: 'Pionowa pozycja wylotu lufy (- w górę ku lufie, + w dół).',
      val: (typeof grip.barrelOffsetY === 'number') ? grip.barrelOffsetY : 0,
      min: -15, max: 15, step: 0.1,
      steps: [-1, -0.1, 0.1, 1],
      set: (v) => { grip.barrelOffsetY = v; saveWeaponTuning(); }
    }
  ];

  container.innerHTML = '';

  paramDefs.forEach((p) => {
    const row = document.createElement('div');
    row.style.cssText = 'background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255, 255, 255, 0.06); padding: 7px 9px; border-radius: 5px;';

    const headerRow = document.createElement('div');
    headerRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;';

    const titleEl = document.createElement('span');
    titleEl.style.cssText = 'font-weight: 600; color: #cbd5e1;';
    titleEl.textContent = p.label;
    titleEl.title = p.desc;

    const formatVal = (val) => {
      const num = Number(val);
      const str = num.toFixed(p.step < 0.5 ? 2 : 1);
      return p.unit ? `${str}${p.unit}` : str;
    };

    const valEl = document.createElement('span');
    valEl.style.cssText = 'font-family: monospace; font-weight: 700; color: #22d3ee; font-size: 11px;';
    valEl.textContent = formatVal(p.val);

    headerRow.appendChild(titleEl);
    headerRow.appendChild(valEl);
    row.appendChild(headerRow);

    // Wiersz kontrolny: przyciski krokowe i suwak
    const ctrlRow = document.createElement('div');
    ctrlRow.style.cssText = 'display: flex; align-items: center; gap: 4px;';

    p.steps.forEach((st) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'we-step-btn';
      btn.textContent = (st > 0 ? `+${st}` : `${st}`);
      btn.addEventListener('click', () => {
        const newVal = Math.round((Number(p.val) + st) * 100) / 100;
        p.val = newVal;
        p.set(newVal);
        slider.value = newVal;
        valEl.textContent = formatVal(newVal);
      });
      ctrlRow.appendChild(btn);
    });

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = p.min;
    slider.max = p.max;
    slider.step = p.step;
    slider.value = p.val;
    slider.style.cssText = 'flex: 1; accent-color: #06b6d4; cursor: pointer;';
    slider.addEventListener('input', (e) => {
      const newVal = parseFloat(e.target.value);
      p.val = newVal;
      p.set(newVal);
      valEl.textContent = formatVal(newVal);
    });
    ctrlRow.appendChild(slider);

    row.appendChild(ctrlRow);
    container.appendChild(row);
  });
}

/**
 * Kopiowanie gotowego kodu do schowka
 */
export function copyConfigToClipboard() {
  const wepId = weaponEditorState.selectedId;
  const grip = WEAPON_GRIP_CONFIGS[wepId];
  const pivot = WEAPON_SPRITE_PIVOTS[wepId];

  const walkRearGripLine = (typeof grip.walkRearGripX === 'number')
    ? `\n  walkRearGripX: ${Number(grip.walkRearGripX).toFixed(2)},`
    : '';
  const walkLine = (typeof grip.walkAngleOffset === 'number')
    ? `\n  walkAngleOffset: ${Number(grip.walkAngleOffset).toFixed(3)},`
    : '';
  const offsetYLine = (typeof grip.barrelOffsetY === 'number')
    ? `\n  barrelOffsetY: ${Number(grip.barrelOffsetY).toFixed(2)},`
    : '';

  const walkPivotLine = (typeof pivot.walkX === 'number')
    ? `\n  walkX: ${Number(pivot.walkX).toFixed(1)},`
    : '';

  const code = `// Konfiguracja chwytu i pivotu dla ${wepId}:
WEAPON_GRIP_CONFIGS.${wepId} = {
  rearGripX: ${Number(grip.rearGripX || 0).toFixed(2)},${walkRearGripLine}
  rearGripY: ${Number(grip.rearGripY || 0).toFixed(2)},
  foreGripX: ${Number(grip.foreGripX || 0).toFixed(2)},
  foreGripY: ${Number(grip.foreGripY || 0).toFixed(2)},
  angleOffset: ${Number(grip.angleOffset || 0).toFixed(3)},${walkLine}
  barrelLen: ${Number(grip.barrelLen || 0).toFixed(2)},${offsetYLine}
  stockLen: ${Number(grip.stockLen || 0).toFixed(2)}
};
WEAPON_SPRITE_PIVOTS.${wepId} = {
  x: ${Number(pivot.x || 0).toFixed(1)},${walkPivotLine}
  y: ${Number(pivot.y || 0).toFixed(1)}
};`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(() => {
      showStatus('SKOPIOWANO CONFIG DO SCHOWKA!');
    }).catch(() => {
      showStatus('Błąd kopiowania - sprawdź konsolę');
      console.log(code);
    });
  } else {
    console.log(code);
    showStatus('Wypisano w konsoli przeglądarki (F12)');
  }
}

/**
 * Reset wybranej broni do fabrycznych wartości
 */
function resetCurrentWeapon() {
  const wepId = weaponEditorState.selectedId;
  if (DEFAULT_GRIP_CONFIGS[wepId]) {
    Object.assign(WEAPON_GRIP_CONFIGS[wepId], JSON.parse(JSON.stringify(DEFAULT_GRIP_CONFIGS[wepId])));
  }
  if (DEFAULT_SPRITE_PIVOTS[wepId]) {
    Object.assign(WEAPON_SPRITE_PIVOTS[wepId], JSON.parse(JSON.stringify(DEFAULT_SPRITE_PIVOTS[wepId])));
  }
  saveWeaponTuning();
  renderEditorValues();
  showStatus(`Przywrócono domyślne dla ${wepId}`);
}

/**
 * Reset wszystkich broni do fabrycznych
 */
function resetAllWeapons() {
  for (const [id, cfg] of Object.entries(DEFAULT_GRIP_CONFIGS)) {
    if (WEAPON_GRIP_CONFIGS[id]) {
      Object.assign(WEAPON_GRIP_CONFIGS[id], JSON.parse(JSON.stringify(cfg)));
    }
  }
  for (const [id, pvt] of Object.entries(DEFAULT_SPRITE_PIVOTS)) {
    if (WEAPON_SPRITE_PIVOTS[id]) {
      Object.assign(WEAPON_SPRITE_PIVOTS[id], JSON.parse(JSON.stringify(pvt)));
    }
  }
  localStorage.removeItem(STORAGE_KEY);
  renderEditorValues();
  showStatus('Przywrócono fabryczne dla wszystkich broni');
}

function showStatus(text) {
  const el = document.getElementById('we-status');
  if (!el) return;
  el.textContent = text;
  el.style.color = '#34d399';
  setTimeout(() => {
    if (el) {
      el.textContent = 'Zapisano w pamięci lokalnej (localStorage)';
      el.style.color = '#38bdf8';
    }
  }, 2500);
}
