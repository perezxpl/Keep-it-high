// =============================================================================
// JS/KILLSTREAKS/SELECTORUI.JS - WYBÓR NAGRÓD ZA SERIĘ ZABÓJSTW (DO 3 / CoD)
// Współdzielony komponent DOM dla Zbrojowni oraz Lobby / Odprawy Taktycznej.
// Obsługa myszy i dotyku, wektorowe ikony z HUD, ZERO EMOJIS.
// =============================================================================

import {
  KILLSTREAKS,
  MAX_EQUIPPED_KILLSTREAKS,
  getKillstreakDef,
  getEquippedKillstreaks,
  toggleEquippedKillstreak,
  subscribeKillstreakLoadout
} from './state.js';
import { drawKillstreakVectorIcon } from './renderer.js';
import { playUiClick, playUiHover } from '../uiManager.js';

const HOST_IDS = [
  'armory-killstreak-loadout-host',
  'briefing-killstreak-loadout-host',
  'mp-killstreak-loadout-host'
];

let _initialized = false;
let _lastTouchTapAt = 0;

function formatFragCount(count) {
  if (count === 1) return '1 FRAG';
  if (count >= 2 && count <= 4) return `${count} FRAGI`;
  return `${count} FRAGÓW`;
}

function bindTapAction(el, onActivate) {
  if (!el) return;
  let startX = 0;
  let startY = 0;
  let moved = false;

  el.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length > 0) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      moved = false;
    }
  }, { passive: true });

  el.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length > 0) {
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > 10 || dy > 10) moved = true;
    }
  }, { passive: true });

  el.addEventListener('touchend', (e) => {
    if (moved) {
      moved = false;
      return;
    }
    _lastTouchTapAt = Date.now();
    if (typeof e.preventDefault === 'function') e.preventDefault();
    e.stopPropagation();
    onActivate(e);
  }, { passive: false });

  el.addEventListener('click', (e) => {
    if (Date.now() - _lastTouchTapAt < 450) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    onActivate(e);
  });
}

function setAccentVar(el, accent) {
  if (!el || !el.style) return;
  if (typeof el.style.setProperty === 'function') {
    el.style.setProperty('--ks-accent', accent || '#00e5ff');
  } else {
    el.style['--ks-accent'] = accent || '#00e5ff';
  }
}

function paintCanvasIcon(canvas, streakId, color) {
  if (!canvas || typeof canvas.getContext !== 'function') return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width || 36;
  const h = canvas.height || 36;
  ctx.clearRect(0, 0, w, h);
  drawKillstreakVectorIcon(ctx, streakId, w / 2, h / 2, Math.min(w, h) * 0.34, color);
}

function buildSelectorHostDOM(hostEl, equippedIds) {
  const isCompact = hostEl.classList.contains('ks-selector-compact');
  const equippedSet = new Set(equippedIds);

  hostEl.innerHTML = '';

  // 1. Nagłówek sekcji + licznik 0..3 / 3 + pasek 3 wybranych slotów
  const header = document.createElement('div');
  header.className = 'ks-selector-header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'ks-selector-title-wrap';

  const badge = document.createElement('span');
  badge.className = 'ks-selector-kicker';
  badge.textContent = 'SYSTEM WSPARCIA BOJOWEGO';

  const title = document.createElement('h3');
  title.className = 'ks-selector-title';
  title.textContent = 'SERIE ZABÓJSTW (WYBIERZ DO 3)';

  titleWrap.appendChild(badge);
  titleWrap.appendChild(title);

  const counterPill = document.createElement('span');
  counterPill.className = 'ks-selector-counter';
  if (equippedIds.length >= MAX_EQUIPPED_KILLSTREAKS) {
    counterPill.classList.add('is-full');
  }
  counterPill.textContent = `WYBRANO: ${equippedIds.length} / ${MAX_EQUIPPED_KILLSTREAKS}`;

  header.appendChild(titleWrap);
  header.appendChild(counterPill);
  hostEl.appendChild(header);

  // 2. Pasek 3 aktywnych slotów (jak w Call of Duty — posortowane od najniższego progu fragów)
  const slotsBar = document.createElement('div');
  slotsBar.className = 'ks-active-slots-bar';

  for (let slotIdx = 0; slotIdx < MAX_EQUIPPED_KILLSTREAKS; slotIdx++) {
    const streakId = equippedIds[slotIdx] || null;
    const def = streakId ? getKillstreakDef(streakId) : null;

    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = def ? 'ks-slot-pill is-filled' : 'ks-slot-pill is-empty';

    if (def) {
      setAccentVar(pill, def.accent || '#00e5ff');
      pill.title = `Kliknij, aby zdjąć: ${def.name} (${formatFragCount(def.killsRequired)})`;

      const iconBox = document.createElement('canvas');
      iconBox.className = 'ks-slot-pill-icon';
      iconBox.width = 28;
      iconBox.height = 28;

      const textCol = document.createElement('div');
      textCol.className = 'ks-slot-pill-info';

      const meta = document.createElement('span');
      meta.className = 'ks-slot-pill-meta';
      meta.textContent = `SLOT ${slotIdx + 1} // ${formatFragCount(def.killsRequired)}`;

      const name = document.createElement('span');
      name.className = 'ks-slot-pill-name';
      name.textContent = def.name.toUpperCase();

      textCol.appendChild(meta);
      textCol.appendChild(name);

      const remTag = document.createElement('span');
      remTag.className = 'ks-slot-pill-remove';
      remTag.textContent = '×';

      pill.appendChild(iconBox);
      pill.appendChild(textCol);
      pill.appendChild(remTag);

      paintCanvasIcon(iconBox, def.id, def.accent || '#00e5ff');
      pill.addEventListener('mouseenter', () => playUiHover());
      bindTapAction(pill, () => {
        playUiClick();
        toggleEquippedKillstreak(def.id);
      });
    } else {
      pill.disabled = true;
      const textCol = document.createElement('div');
      textCol.className = 'ks-slot-pill-info';
      const meta = document.createElement('span');
      meta.className = 'ks-slot-pill-meta';
      meta.textContent = `SLOT ${slotIdx + 1}`;
      const name = document.createElement('span');
      name.className = 'ks-slot-pill-name';
      name.textContent = 'WOLNY SLOT';
      textCol.appendChild(meta);
      textCol.appendChild(name);
      pill.appendChild(textCol);
    }

    slotsBar.appendChild(pill);
  }
  hostEl.appendChild(slotsBar);

  // 3. Siatka wszystkich 6 dostępnych nagród za serie
  const grid = document.createElement('div');
  grid.className = isCompact ? 'ks-cards-grid is-compact' : 'ks-cards-grid';

  for (const ks of KILLSTREAKS) {
    const isEquipped = equippedSet.has(ks.id);
    const slotNum = isEquipped ? (equippedIds.indexOf(ks.id) + 1) : 0;

    const card = document.createElement('button');
    card.type = 'button';
    card.className = isEquipped ? 'ks-card is-equipped' : 'ks-card';
    card.dataset.streakId = ks.id;
    setAccentVar(card, ks.accent || '#00e5ff');
    card.title = isEquipped
      ? `Odznacz ${ks.name}`
      : `Wybierz ${ks.name} (${formatFragCount(ks.killsRequired)})`;

    const topRow = document.createElement('div');
    topRow.className = 'ks-card-top';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'ks-card-icon-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'ks-card-canvas';
    canvas.width = 40;
    canvas.height = 40;
    iconWrap.appendChild(canvas);

    const headInfo = document.createElement('div');
    headInfo.className = 'ks-card-head-info';

    const costLine = document.createElement('div');
    costLine.className = 'ks-card-cost-line';

    const costBadge = document.createElement('span');
    costBadge.className = 'ks-card-cost';
    costBadge.textContent = formatFragCount(ks.killsRequired);

    const statusBadge = document.createElement('span');
    statusBadge.className = isEquipped ? 'ks-card-status is-on' : 'ks-card-status';
    statusBadge.textContent = isEquipped ? `SLOT #${slotNum}` : 'WYBIERZ';

    costLine.appendChild(costBadge);
    costLine.appendChild(statusBadge);

    const titleEl = document.createElement('div');
    titleEl.className = 'ks-card-name';
    titleEl.textContent = ks.name.toUpperCase();

    headInfo.appendChild(costLine);
    headInfo.appendChild(titleEl);

    topRow.appendChild(iconWrap);
    topRow.appendChild(headInfo);
    card.appendChild(topRow);

    if (!isCompact) {
      const descEl = document.createElement('div');
      descEl.className = 'ks-card-desc';
      descEl.textContent = ks.desc;
      card.appendChild(descEl);
    }

    paintCanvasIcon(canvas, ks.id, isEquipped ? (ks.accent || '#00e5ff') : '#94a3b8');

    card.addEventListener('mouseenter', () => playUiHover());
    bindTapAction(card, () => {
      playUiClick();
      toggleEquippedKillstreak(ks.id);
    });

    grid.appendChild(card);
  }

  hostEl.appendChild(grid);
}

/**
 * Odświeża wszystkie zamontowane w DOM panele wyboru serii zabójstw
 */
export function renderKillstreakSelectors() {
  if (typeof document === 'undefined') return;
  const equippedIds = getEquippedKillstreaks();

  for (const hostId of HOST_IDS) {
    const hostEl = document.getElementById(hostId);
    if (hostEl) {
      buildSelectorHostDOM(hostEl, equippedIds);
    }
  }
}

/**
 * Inicjalizuje komponent wyboru nagród za serie zabójstw i subskrybuje zmiany
 */
export function initKillstreakSelectorUI() {
  if (!_initialized) {
    _initialized = true;
    subscribeKillstreakLoadout(() => {
      renderKillstreakSelectors();
    });
  }
  renderKillstreakSelectors();
}

if (typeof window !== 'undefined') {
  window.renderKillstreakSelectors = renderKillstreakSelectors;
}
