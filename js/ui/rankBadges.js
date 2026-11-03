// =========================================================================
// UI/RANKBADGES.JS - SYSTEM ODZNAK STOPNI WOJSKOWYCH ZE SPRITE SHEETEM
// Zarządza odznakami 12 rang Modern Military z wektorowego arkusza
// assets/ranks_spritesheet.svg (4x3 siatka, 128x128px na stopień)
// =========================================================================

export const SPRITE_SHEET_COLS = 4;
export const SPRITE_SHEET_ROWS = 3;
export const SPRITE_CELL_SIZE = 128;

export const RANK_BADGE_MAP = {
  SZEREGOWY: { col: 0, row: 0, bgX: '0%', bgY: '0%' },
  ST_SZEREGOWY: { col: 1, row: 0, bgX: '33.333%', bgY: '0%' },
  KAPRAL: { col: 2, row: 0, bgX: '66.666%', bgY: '0%' },
  ST_KAPRAL: { col: 3, row: 0, bgX: '100%', bgY: '0%' },
  PLUTONOWY: { col: 0, row: 1, bgX: '0%', bgY: '50%' },
  SIERZANT: { col: 1, row: 1, bgX: '33.333%', bgY: '50%' },
  CHORAZY: { col: 2, row: 1, bgX: '66.666%', bgY: '50%' },
  PODPORUCZNIK: { col: 3, row: 1, bgX: '100%', bgY: '50%' },
  KAPITAN: { col: 0, row: 2, bgX: '0%', bgY: '100%' },
  MAJOR: { col: 1, row: 2, bgX: '33.333%', bgY: '100%' },
  PULKOWNIK: { col: 2, row: 2, bgX: '66.666%', bgY: '100%' },
  GENERAL: { col: 3, row: 2, bgX: '100%', bgY: '100%' }
};

let _rankSpritesheetImg = null;
let _isLoaded = false;

/**
 * Inicjalizuje i wczytuje obraz sprite sheetu rang do pamięci podręcznej Canvas
 */
export function initRankBadges() {
  if (typeof Image === 'undefined') return;
  if (!_rankSpritesheetImg) {
    _rankSpritesheetImg = new Image();
    _rankSpritesheetImg.onload = () => {
      _isLoaded = true;
    };
    _rankSpritesheetImg.onerror = (err) => {
      console.warn('[RANK BADGES] Nie udalo sie zaladowac sprite sheetu:', err);
    };
    _rankSpritesheetImg.src = './assets/ranks_spritesheet.svg?v=v388_military_rank_spritesheet';
  }
}

/**
 * Zwraca instancję obrazu sprite sheetu
 */
export function getRankSpritesheetImage() {
  if (!_rankSpritesheetImg) {
    initRankBadges();
  }
  return _rankSpritesheetImg;
}

/**
 * Zwraca współrzędne w sprite sheecie dla danego identyfikatora rangi
 */
export function getRankBadgeCoords(rankId) {
  const normId = String(rankId || 'SZEREGOWY').toUpperCase();
  const cfg = RANK_BADGE_MAP[normId] || RANK_BADGE_MAP.SZEREGOWY;
  return {
    col: cfg.col,
    row: cfg.row,
    sx: cfg.col * SPRITE_CELL_SIZE,
    sy: cfg.row * SPRITE_CELL_SIZE,
    sw: SPRITE_CELL_SIZE,
    sh: SPRITE_CELL_SIZE,
    bgX: cfg.bgX,
    bgY: cfg.bgY
  };
}

/**
 * Rysuje profesjonalną odznakę stopnia na kontekście HTML5 Canvas
 */
export function drawRankBadge(ctx, rankId, dx, dy, dw = 32, dh = 32) {
  if (!ctx) return;
  const img = getRankSpritesheetImage();
  const coords = getRankBadgeCoords(rankId);

  if ((_isLoaded || (img && img.complete)) && img && (img.naturalWidth > 0 || img.width > 0)) {
    ctx.drawImage(
      img,
      coords.sx, coords.sy, coords.sw, coords.sh,
      dx, dy, dw, dh
    );
  } else {
    // Awaryjny podgląd proceduralny zanim wczyta się grafika SVG
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    if (ctx.roundRect) ctx.roundRect(dx, dy, dw, dh, 4);
    else ctx.rect(dx, dy, dw, dh);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Aktualizuje klasę i pozycję tła elementu DOM, by wyświetlał daną odznakę
 */
export function applyRankBadgeToElement(element, rankId) {
  if (!element) return;
  const normId = String(rankId || 'SZEREGOWY').toUpperCase();
  const coords = getRankBadgeCoords(normId);

  element.classList.add('rank-badge-sprite');
  // Usunięcie poprzednich klas rank-sprite-*
  Array.from(element.classList).forEach(c => {
    if (c.startsWith('rank-sprite-')) {
      element.classList.remove(c);
    }
  });
  element.classList.add(`rank-sprite-${normId}`);
  element.style.backgroundPosition = `${coords.bgX} ${coords.bgY}`;
}

/**
 * Tworzy gotowy element HTML ze sprite'em odznaki danej rangi
 */
export function createRankBadgeElement(rankId, extraClass = '') {
  if (typeof document === 'undefined') return null;
  const div = document.createElement('div');
  div.className = `rank-badge-sprite rank-sprite-${String(rankId).toUpperCase()} ${extraClass}`.trim();
  const coords = getRankBadgeCoords(rankId);
  div.style.backgroundPosition = `${coords.bgX} ${coords.bgY}`;
  return div;
}

// Automatyczna inicjalizacja przy imporcie w przeglądarce
if (typeof window !== 'undefined') {
  initRankBadges();
}
