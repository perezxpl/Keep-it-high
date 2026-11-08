// =========================================================================
// HAZARDS/RENDERER.JS - PROCEDURY RENDEROWANIA WYBUCHOWYCH BECZEK I KAŁUŻ
// Architektura arkusza sprite'ów (Barrel Sprite Sheet 512x704, 4x4):
// - Kolumny (4 stany zniszczenia): Intact -> Damaged -> Leaking -> Critical/Fuse
// - Wiersze (4 typy beczek): Explosive, Toxic, Cryo, Ordnance
// - Wsparcie dla pełnej ciągłej rotacji 2D (rolling physics), iskier lontu,
//   rozbryzgów kwasu oraz akceleracji GPU za pomocą OffscreenCanvas.
// Standard: 60 FPS, zero shadowBlur w pętli renderowania.
// =========================================================================

import { hazardsState } from './state.js';

export const SPRITE_SHEET_URL = './assets/barrels_spritesheet.svg?v=v442_barrel_spritesheet';
export const SPRITE_CELL_W = 128;
export const SPRITE_CELL_H = 176;
export const SPRITE_BODY_W = 92;
export const SPRITE_BODY_H = 140;

export const BARREL_ROW_MAP = {
  EXPLOSIVE: 0,
  TOXIC: 1,
  CRYO: 2,
  ORDNANCE: 3
};

let _barrelSpritesheetImg = null;
let _isLoaded = false;
let _offscreenCanvas = null;

/**
 * Inicjalizuje i wczytuje arkusz sprite'ów beczek do pamięci podręcznej Canvas
 */
export function initBarrelSpritesheet() {
  if (typeof Image === 'undefined') return;
  if (!_barrelSpritesheetImg) {
    _barrelSpritesheetImg = new Image();
    _barrelSpritesheetImg.onload = () => {
      _isLoaded = true;
      try {
        if (typeof document !== 'undefined') {
          const off = document.createElement('canvas');
          off.width = 512;
          off.height = 704;
          const offCtx = off.getContext('2d');
          if (offCtx) {
            offCtx.drawImage(_barrelSpritesheetImg, 0, 0);
            _offscreenCanvas = off;
          }
        }
      } catch (e) {
        // Fallback: bezpośredni drawImage z _barrelSpritesheetImg
      }
    };
    _barrelSpritesheetImg.onerror = (err) => {
      console.warn('[HAZARDS] Nie udalo sie zaladowac sprite sheetu beczek:', err);
    };
    _barrelSpritesheetImg.src = SPRITE_SHEET_URL;
  }
}

/**
 * Zwraca instancję obrazu lub zbuforowanego płótna sprite sheetu
 */
export function getBarrelSpritesheet() {
  if (!_barrelSpritesheetImg) {
    initBarrelSpritesheet();
  }
  return _offscreenCanvas || _barrelSpritesheetImg;
}

/**
 * Określa kolumnę stanu zniszczenia w arkuszu sprite'ów (0-3)
 */
function getBarrelStateColumn(b) {
  // Stan 3: CRITICAL (lont syczący przed wybuchem lub HP <= 0)
  if (b.fuseTimer > 0 || b.isExploding || b.hp <= 0) {
    return 3;
  }
  // Stan 2: LEAKING / BURNING (HP poniżej 40%)
  if (b.hp <= b.maxHp * 0.4) {
    return 2;
  }
  // Stan 1: DAMAGED (HP poniżej 80%)
  if (b.hp < b.maxHp * 0.8) {
    return 1;
  }
  // Stan 0: INTACT (pełne lub prawie pełne HP)
  return 0;
}

/**
 * Rysuje dynamiczne iskry i syczący ogień lontu nad korkiem beczki w stanie krytycznym
 */
function drawDynamicFuseSparks(ctx, b, w, h) {
  const isToxic = (b.type === 'TOXIC');
  const bungX = -w * 0.22;
  const bungY = -h * 0.5 - 2;

  const now = performance.now();
  const pulse = Math.sin(now * 0.04);
  const sparkRadius = 3.5 + Math.abs(pulse) * 2.5;

  ctx.save();
  ctx.translate(bungX, bungY);

  // Rdzeń rozbłysku
  ctx.fillStyle = isToxic ? '#86efac' : '#fef08a';
  ctx.beginPath();
  ctx.arc(0, 0, sparkRadius * 0.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isToxic ? '#22c55e' : '#f97316';
  ctx.beginPath();
  ctx.arc(0, 0, sparkRadius, 0, Math.PI * 2);
  ctx.fill();

  // Wystrzeliwane losowe iglice iskier (zero shadowBlur)
  ctx.strokeStyle = isToxic ? '#bbf7d0' : '#ffffff';
  ctx.lineWidth = 1.4;
  for (let s = 0; s < 4; s++) {
    const ang = (now * 0.02 + s * 1.57) % (Math.PI * 2);
    const dist = 5 + ((s * 7 + (now * 0.05)) % 11);
    const ex = Math.cos(ang) * dist;
    const ey = -Math.abs(Math.sin(ang) * dist) - 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Proceduralny fallback, gdy arkusz SVG jest jeszcze w fazie asynchronicznego ładowania
 */
function drawProceduralFallbackBarrel(ctx, b, w, h) {
  const hw = w * 0.5;
  const hh = h * 0.5;
  const typeDef = b.typeDef;

  ctx.fillStyle = typeDef.color || '#dc2626';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-hw, -hh, w, h, 3);
  } else {
    ctx.rect(-hw, -hh, w, h);
  }
  ctx.fill();

  // Cieniowanie 3D
  const grad = ctx.createLinearGradient(-hw, 0, hw, 0);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
  grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
  grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = grad;
  ctx.fillRect(-hw, -hh, w, h);

  // Stalowe pierścienie
  ctx.fillStyle = typeDef.rimColor || '#18181b';
  ctx.fillRect(-hw - 1, -hh + 3, w + 2, 4);
  ctx.fillRect(-hw - 1, -2, w + 2, 4);
  ctx.fillRect(-hw - 1, hh - 7, w + 2, 4);

  // Centralny żółty pas ostrzegawczy
  ctx.fillStyle = '#eab308';
  ctx.fillRect(-hw, -hh * 0.35, w, hh * 0.7);
}

/**
 * Rysuje pojedynczą beczkę ze sprite sheetu z pełną obsługą kąta i stanów zniszczenia
 */
function drawSingleBarrel(ctx, b) {
  const w = b.w;
  const h = b.h;
  const typeKey = (b.type || 'EXPLOSIVE').toUpperCase();
  const rowIndex = BARREL_ROW_MAP[typeKey] ?? 0;
  const colIndex = getBarrelStateColumn(b);

  ctx.save();
  ctx.translate(b.x + w * 0.5, b.y + h * 0.5);

  if (b.angle) {
    ctx.rotate(b.angle);
  }

  const spriteSource = getBarrelSpritesheet();
  const canDrawSprite = (_isLoaded || (spriteSource && (spriteSource.naturalWidth > 0 || spriteSource.width > 0))) && spriteSource;

  if (canDrawSprite) {
    const sx = colIndex * SPRITE_CELL_W;
    const sy = rowIndex * SPRITE_CELL_H;
    const drawW = w * (SPRITE_CELL_W / SPRITE_BODY_W);
    const drawH = h * (SPRITE_CELL_H / SPRITE_BODY_H);

    ctx.drawImage(
      spriteSource,
      sx, sy, SPRITE_CELL_W, SPRITE_CELL_H,
      -drawW * 0.5, -drawH * 0.5, drawW, drawH
    );
  } else {
    drawProceduralFallbackBarrel(ctx, b, w, h);
  }

  // Dynamiczne cząsteczki i snopy iskier dla stanu krytycznego (lont)
  if (b.fuseTimer > 0 || b.isExploding) {
    drawDynamicFuseSparks(ctx, b, w, h);
  }

  ctx.restore();
}

/**
 * Rysuje kałuże rozlanego kwasu na podłożu
 */
function drawAcidPools(ctx) {
  for (const pool of hazardsState.acidPools) {
    const alpha = Math.min(1.0, pool.timer / 1.5) * 0.78;
    ctx.save();
    ctx.translate(pool.x, pool.y);

    // Zielona pulsująca plama kwasu (Radial Gradient)
    const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, pool.radius);
    grad.addColorStop(0, `rgba(74, 222, 128, ${alpha})`);
    grad.addColorStop(0.65, `rgba(22, 163, 74, ${alpha * 0.75})`);
    grad.addColorStop(1, 'rgba(20, 83, 45, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, pool.radius, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Drobne bąble kwasu na powierzchni z delikatnym pękaniem
    ctx.fillStyle = `rgba(187, 247, 208, ${alpha * 0.9})`;
    for (let j = 0; j < 5; j++) {
      const bx = Math.sin(pool.bubbleAnim + j * 1.6) * (pool.radius * 0.68);
      const by = Math.cos(pool.bubbleAnim * 0.8 + j) * 3.2;
      ctx.beginPath();
      ctx.arc(bx, by - 2, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

/**
 * Główna procedura renderowania zagrożeń na świecie gry
 */
export function drawHazards(ctx, camera) {
  const viewLeft = camera.x - 120;
  const viewRight = camera.x + (camera.viewWidth || (window.innerWidth / (camera.zoom || 0.6))) + 120;

  // 1. Kałuże kwasu na podłożu (renderowane pod beczkami)
  drawAcidPools(ctx);

  // 2. Aktywne beczki ze sprite sheetu
  for (const b of hazardsState.barrels) {
    if (b.x < viewLeft || b.x > viewRight) continue;
    drawSingleBarrel(ctx, b);
  }
}

// Inicjalizacja przy ładowaniu modułu w przeglądarce
if (typeof window !== 'undefined') {
  initBarrelSpritesheet();
}
