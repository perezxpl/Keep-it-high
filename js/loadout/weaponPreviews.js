// =========================================================================
// LOADOUT/WEAPONPREVIEWS.JS - WYŚWIETLANIE SPRITE'ÓW BRONI DLA ZBROJOWNI
// Fotorealistyczne modele rastrowe PNG uzbrojenia na tle taktycznego blueprintu
// =========================================================================

/**
 * Tło schematu taktycznego (siatka milimetrowa, narożniki, podziałka)
 */
function drawTacticalBackdrop(ctx, w, h, weaponId) {
  // 1. Gradient głębi tła
  const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
  bgGrad.addColorStop(0.0, 'rgba(15, 23, 42, 0.95)');
  bgGrad.addColorStop(0.65, 'rgba(10, 15, 30, 0.98)');
  bgGrad.addColorStop(1.0, 'rgba(3, 7, 18, 1.0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Siatka taktyczna blueprint
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.04)';
  ctx.lineWidth = 1.0;
  const gridSize = 16;
  ctx.beginPath();
  for (let x = 0; x <= w; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = 0; y <= h; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  // 3. Oś celownicza pozioma i pionowa
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.09)';
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(12, h * 0.5);
  ctx.lineTo(w - 12, h * 0.5);
  ctx.moveTo(w * 0.5, 8);
  ctx.lineTo(w * 0.5, h - 8);
  ctx.stroke();
  ctx.setLineDash([]);

  // 4. Taktyczne narożniki kadrujące [ ]
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.28)';
  ctx.lineWidth = 1.2;
  const bSize = 8;
  const pad = 6;
  // Lewy górny
  ctx.beginPath();
  ctx.moveTo(pad, pad + bSize); ctx.lineTo(pad, pad); ctx.lineTo(pad + bSize, pad);
  // Prawy górny
  ctx.moveTo(w - pad - bSize, pad); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad, pad + bSize);
  // Lewy dolny
  ctx.moveTo(pad, h - pad - bSize); ctx.lineTo(pad, h - pad); ctx.lineTo(pad + bSize, h - pad);
  // Prawy dolny
  ctx.moveTo(w - pad - bSize, h - pad); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad, h - pad - bSize);
  ctx.stroke();

  // 5. Dolna podziałka milimetrowa
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  const tickY = h - 7;
  for (let tx = 24; tx < w - 24; tx += 8) {
    const isMajor = (tx % 32 === 0);
    ctx.moveTo(tx, tickY);
    ctx.lineTo(tx, tickY - (isMajor ? 4 : 2));
  }
  ctx.stroke();

  // 6. Subtelny znak wodny z kodem modelu
  ctx.font = '700 8px monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.textAlign = 'right';
  ctx.fillText(`SPEC // ${weaponId || 'WEAPON'}`, w - 12, 14);

  ctx.restore();
}

// =========================================================================
// GŁÓWNA FUNKCJA RENDERUJĄCA SPRITE DLA KAFELKA / OKNA ZBROJOWNI
// =========================================================================

const WEAPON_SPRITE_PATHS = {
  AK47: './assets/weapons/ak47.png?v=v252_fix_picker_weapons_narrowing_and_card_height',
  SHOTGUN: './assets/weapons/shotgun.png?v=v252_fix_picker_weapons_narrowing_and_card_height',
  SNIPER: './assets/weapons/sniper.png?v=v252_fix_picker_weapons_narrowing_and_card_height',
  GLOCK: './assets/weapons/glock.png?v=v252_fix_picker_weapons_narrowing_and_card_height',
  REVOLVER: './assets/weapons/revolver.png?v=v252_fix_picker_weapons_narrowing_and_card_height',
  SAWED_OFF: './assets/weapons/sawed_off.png?v=v252_fix_picker_weapons_narrowing_and_card_height',
  RPG7: './assets/weapons/rpg7.png?v=v330_rpg7_rocket_launcher_secondary',
  KNIFE: './assets/weapons/knife.png?v=v252_fix_picker_weapons_narrowing_and_card_height',
  MACHETE: './assets/weapons/machete.png?v=v252_fix_picker_weapons_narrowing_and_card_height',
  AXE: './assets/weapons/axe.png?v=v252_fix_picker_weapons_narrowing_and_card_height',
  GRENADE: './assets/weapons/grenade.png?v=v252_fix_picker_weapons_narrowing_and_card_height',
  SMOKE: './assets/weapons/smoke.png?v=v252_fix_picker_weapons_narrowing_and_card_height',
  FLASH: './assets/weapons/flash.png?v=v252_fix_picker_weapons_narrowing_and_card_height'
};

const _spriteCache = {};

export function getWeaponSprite(weaponId) {
  const path = WEAPON_SPRITE_PATHS[weaponId];
  if (!path) return null;
  if (_spriteCache[weaponId]) return _spriteCache[weaponId];
  if (typeof window === 'undefined' || typeof Image === 'undefined') return null;

  const img = new Image();
  img.src = path;
  _spriteCache[weaponId] = img;
  return img;
}

// Natychmiastowe pre-loadowanie wszystkich sprite'ów uzbrojenia przy starcie gry
if (typeof window !== 'undefined') {
  for (const k of Object.keys(WEAPON_SPRITE_PATHS)) {
    getWeaponSprite(k);
  }
}

/**
 * Renderuje pełny rysunek broni na wskazanym elemencie canvas
 * Ściśle zachowuje proporcje rusznikarskie (uniform aspect ratio, brak rozciągania)
 * @param {HTMLCanvasElement} canvas - element canvas w DOM
 * @param {string} weaponId - ID broni (np. 'AK47', 'SHOTGUN', 'GLOCK', 'KNIFE')
 */
export function drawWeaponPreview(canvas, weaponId) {
  if (!canvas || !weaponId) return;

  // 0. Dopasowanie wewnętrznej rozdzielczości płótna do rzeczywistych wymiarów kontenera
  let rectW = 0;
  let rectH = 0;
  if (canvas.parentElement) {
    rectW = canvas.parentElement.clientWidth;
    rectH = canvas.parentElement.clientHeight;
    if ((!rectW || !rectH) && typeof canvas.parentElement.getBoundingClientRect === 'function') {
      const pRect = canvas.parentElement.getBoundingClientRect();
      if (pRect.width > 0) rectW = pRect.width;
      if (pRect.height > 0) rectH = pRect.height;
    }
  }
  if (!rectW && typeof canvas.getBoundingClientRect === 'function') {
    const rect = canvas.getBoundingClientRect();
    rectW = rect.width;
    rectH = rect.height;
  }
  const displayW = Math.max(160, Math.round(rectW || canvas.clientWidth || 300));
  const displayH = Math.max(50, Math.round(rectH || canvas.clientHeight || 84));
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? Math.min(window.devicePixelRatio, 2) : 1;

  const targetW = Math.round(displayW * dpr);
  const targetH = Math.round(displayH * dpr);

  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // 1. Rysowanie taktycznego tła schematu
  drawTacticalBackdrop(ctx, w, h, weaponId);

  // 2. Pre-renderowany sprite PNG wysokiej rozdzielczości
  const sprite = getWeaponSprite(weaponId);
  if (sprite) {
    if (sprite.complete && sprite.naturalWidth > 0) {
      let maxWFactor = 0.90;
      let maxHFactor = 0.82;

      if (weaponId === 'GLOCK' || weaponId === 'REVOLVER') {
        maxWFactor = 0.72; // Pistolety i rewolwery o naturalnej szerokości
        maxHFactor = 0.80;
      } else if (weaponId === 'SAWED_OFF') {
        maxWFactor = 0.82;
        maxHFactor = 0.80;
      } else if (weaponId === 'RPG7') {
        maxWFactor = 0.94;
        maxHFactor = 0.84;
      } else if (weaponId === 'KNIFE' || weaponId === 'MACHETE' || weaponId === 'AXE') {
        maxWFactor = 0.82;
        maxHFactor = 0.80;
      } else if (weaponId === 'GRENADE' || weaponId === 'SMOKE' || weaponId === 'FLASH') {
        maxWFactor = 0.52; // Pionowy granat
        maxHFactor = 0.84;
      } else {
        // Długa broń główna (AK47, SPAS-12, Barrett .50)
        maxWFactor = 0.92;
        maxHFactor = 0.82;
      }

      const maxW = w * maxWFactor;
      const maxH = h * maxHFactor;
      // Ścisłe zachowanie proporcji (uniform aspect ratio - scaleX === scaleY)
      const scale = Math.min(maxW / sprite.naturalWidth, maxH / sprite.naturalHeight);
      const drawW = Math.round(sprite.naturalWidth * scale);
      const drawH = Math.round(sprite.naturalHeight * scale);
      const dx = Math.round((w - drawW) * 0.50);
      const dy = Math.round((h - drawH) * 0.50);

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 3;
      ctx.drawImage(sprite, dx, dy, drawW, drawH);
      ctx.restore();
    } else if (!sprite.complete && !sprite._hasError) {
      sprite.addEventListener('load', () => {
        drawWeaponPreview(canvas, weaponId);
      }, { once: true });
      sprite.addEventListener('error', () => {
        sprite._hasError = true;
        drawWeaponPreview(canvas, weaponId);
      }, { once: true });
    }
  }
}
