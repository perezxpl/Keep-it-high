// =========================================================================
// WEAPONS/RENDERER.JS - RENDEROWANIE POCISKÓW, LASERA I TRZYMANEJ BRONI
// Wydzielony moduł z js/weapons.js
// =========================================================================

import { drawBulletCasings } from '../particles.js';
import { camera, getCanvasLogicalWidth, getCanvasLogicalHeight } from '../camera.js';
import {
  bullets,
  bulletParticles,
  getWeaponHoldTransform,
  getMuzzlePosition
} from './transform.js';

export function drawBullets(ctx) {
  drawBulletCasings(ctx);

  const camW = typeof getCanvasLogicalWidth === 'function' ? getCanvasLogicalWidth() : 1920;
  const camH = typeof getCanvasLogicalHeight === 'function' ? getCanvasLogicalHeight() : 1080;
  const zoom = camera && camera.zoom ? camera.zoom : 1;
  const viewW = camera.viewWidth || (camW / zoom);
  const viewH = camera.viewHeight || (camH / zoom);
  const margin = 80;
  const minX = camera.x - margin;
  const maxX = camera.x + viewW + margin;
  const minY = camera.y - margin;
  const maxY = camera.y + viewH + margin;

  for (let i = 0; i < bulletParticles.length; i++) {
    const p = bulletParticles[i];
    if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) continue;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }

  ctx.save();
  // KROK 1: Rysowanie smug zwykłych pocisków (AK-47, Shotgun) w jednym przebiegu ścieżki
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  let hasStandardBullets = false;
  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    if (b.x < minX || b.x > maxX || b.y < minY || b.y > maxY) continue;
    if (b.isSniper || b.weaponId === 'SNIPER') continue;

    ctx.moveTo(b.x - b.vx * 0.7, b.y - b.vy * 0.7);
    ctx.lineTo(b.x, b.y);
    hasStandardBullets = true;
  }
  if (hasStandardBullets) {
    ctx.stroke();
  }

  // KROK 2: Rysowanie białych wierzchołków pocisków (zbiorczy fill)
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    if (b.x < minX || b.x > maxX || b.y < minY || b.y > maxY) continue;
    if (b.isSniper || b.weaponId === 'SNIPER') continue;
    ctx.fillRect(b.x - 1, b.y - 1, 2, 2);
  }

  // KROK 3: Rysowanie pocisków snajperskich (wysokowydajny tracer)
  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    if (b.x < minX || b.x > maxX || b.y < minY || b.y > maxY) continue;
    if (!b.isSniper && b.weaponId !== 'SNIPER') continue;

    // Długa, świecąca smuga energii balistycznej (Soldat Barrett .50 ballistic tracer line)
    const tailLen = 1.4;
    const tailX = b.x - b.vx * tailLen;
    const tailY = b.y - b.vy * tailLen;

    // 1. Szeroka zewnętrzna poświata energii
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.40)';
    ctx.lineWidth = 4.8;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    // 2. Środkowa smuga błękitna
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(tailX + b.vx * 0.25, tailY + b.vy * 0.25);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    // 3. Jaskrawy biały rdzeń pocisku
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(tailX + b.vx * 0.55, tailY + b.vy * 0.55);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    // 4. Świecący wierzchołek pocisku
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Rysuje przerywany czerwony promień lasera z lufy do punktu celowania (aimX, aimY)
 */
export function drawSniperLaserSight(ctx, playerObj) {
  if (!ctx || !playerObj || playerObj.isDead) return;
  const wep = playerObj.currentWeapon;
  if (!wep || wep.id !== 'SNIPER') return;

  // Jeśli broń jest schowana lub gracz rzuca granat, nie rysuj lasera
  if (playerObj.throwAnim && playerObj.throwAnim.active) return;
  const hWeight = (typeof playerObj.holsterWeight === 'number') ? playerObj.holsterWeight : (playerObj.isHolstered ? 1.0 : 0.0);
  if (hWeight >= 0.5) return;

  // Na urządzeniach dotykowych ukryj celownik laserowy gracza gdy prawy drążek jest nieużywany
  if (typeof window !== 'undefined' && window.isTouchDevice && window.player === playerObj) {
    const rs = window.rightStick;
    if (!rs || !rs.active || rs.armedMode === 'GRENADE' || (typeof rs.power === 'number' && rs.power <= 0.05)) {
      return;
    }
  }

  // Wyliczenie pozycji wylotu lufy (muzzle)
  const muzzle = getMuzzlePosition(playerObj, wep);
  const startX = muzzle.muzzleX;
  const startY = muzzle.muzzleY;

  const targetX = (typeof playerObj.aimX === 'number' && !isNaN(playerObj.aimX)) ? playerObj.aimX : (startX + (playerObj.facing || 1) * 350);
  const targetY = (typeof playerObj.aimY === 'number' && !isNaN(playerObj.aimY)) ? playerObj.aimY : startY;

  ctx.save();
  // Przerywana czerwona wiązka celownika laserowego w stylu Soldat (zero kosztu shadowBlur)
  ctx.setLineDash([5, 5]);
  ctx.lineDashOffset = (performance.now() * -0.03) % 10;

  // Zewnętrzna poświata lasera
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.28)';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();

  // Ostra linia rdzenia lasera
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Kropka lasera celowniczego w punkcie (aimX, aimY)
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
  ctx.beginPath();
  ctx.arc(targetX, targetY, 4.0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(targetX, targetY, 1.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// =========================================================================
// PRE-RENDEROWANE MODULARNE SPRITE'Y UZBROJENIA W ROZGRYWCE
// =========================================================================

const WEAPON_PARTS_PATHS = {
  AK47_BODY: './assets/weapons/ak47_body.png?v=v256_modular_melee_weapons',
  AK47_MAG: './assets/weapons/ak47_mag.png?v=v256_modular_melee_weapons',
  AK47_BOLT: './assets/weapons/ak47_bolt.png?v=v256_modular_melee_weapons',
  SHOTGUN_BODY: './assets/weapons/shotgun_body.png?v=v256_modular_melee_weapons',
  SHOTGUN_PUMP: './assets/weapons/shotgun_pump.png?v=v256_modular_melee_weapons',
  SHOTGUN_SHELL: './assets/weapons/shotgun_shell.png?v=v256_modular_melee_weapons',
  SNIPER_BODY: './assets/weapons/sniper_body.png?v=v256_modular_melee_weapons',
  SNIPER_MAG: './assets/weapons/sniper_mag.png?v=v256_modular_melee_weapons',
  SNIPER_BOLT: './assets/weapons/sniper_bolt.png?v=v256_modular_melee_weapons',
  GLOCK_FRAME: './assets/weapons/glock_frame.png?v=v256_modular_melee_weapons',
  GLOCK_SLIDE: './assets/weapons/glock_slide.png?v=v256_modular_melee_weapons',
  GLOCK_MAG: './assets/weapons/glock_mag.png?v=v256_modular_melee_weapons',
  REVOLVER_BODY: './assets/weapons/revolver_body.png?v=v256_modular_melee_weapons',
  REVOLVER_CYLINDER: './assets/weapons/revolver_cylinder.png?v=v256_modular_melee_weapons',
  SAWED_OFF_BODY: './assets/weapons/sawed_off_body.png?v=v256_modular_melee_weapons',
  SAWED_OFF_BARRELS: './assets/weapons/sawed_off_barrels.png?v=v256_modular_melee_weapons',
  KNIFE: './assets/weapons/knife.png?v=v256_modular_melee_weapons',
  MACHETE: './assets/weapons/machete.png?v=v256_modular_melee_weapons',
  AXE: './assets/weapons/axe.png?v=v256_modular_melee_weapons'
};

const _partSpriteCache = {};

export function getWeaponPartSprite(partId) {
  if (_partSpriteCache[partId]) return _partSpriteCache[partId];
  const p = WEAPON_PARTS_PATHS[partId];
  if (!p) return null;
  const img = new Image();
  img.src = p;
  _partSpriteCache[partId] = img;
  return img;
}

// Natychmiastowe pre-loadowanie sprite'ów w przeglądarce
if (typeof window !== 'undefined') {
  for (const k of Object.keys(WEAPON_PARTS_PATHS)) {
    getWeaponPartSprite(k);
  }
}

/**
 * Renderowanie broni w rękach strzelca
 */
export function drawHeldWeapon(ctx, p) {
  if (!p || !p.currentWeapon || p.isDead) return;
  const hWeight = (typeof p.holsterWeight === 'number') ? p.holsterWeight : (p.isHolstered ? 1.0 : 0.0);
  if (hWeight >= 0.99) return; // Całkowicie schowana

  const hold = getWeaponHoldTransform(p);
  const weapon = p.currentWeapon;

  ctx.save();
  if (hWeight > 0.01) {
    ctx.globalAlpha = Math.max(0, 1.0 - hWeight);
    ctx.translate(hold.pivotX, hold.pivotY + hWeight * 14);
    ctx.scale(hold.charFacing, 1);
    ctx.rotate(hold.angle + hWeight * 0.35);
  } else {
    ctx.translate(hold.pivotX, hold.pivotY);
    ctx.scale(hold.charFacing, 1);
    ctx.rotate(hold.angle);
  }

  if (weapon.id === 'AK47') {
    const imgBody = getWeaponPartSprite('AK47_BODY');
    const imgMag = getWeaponPartSprite('AK47_MAG');
    const imgBolt = getWeaponPartSprite('AK47_BOLT');

    if (imgBody && imgBody.complete && imgBody.naturalWidth > 0 &&
        imgMag && imgMag.complete && imgMag.naturalWidth > 0 &&
        imgBolt && imgBolt.complete && imgBolt.naturalWidth > 0) {
      
      const s = 44.8 / 1272; // Skala z pikseli sprite\'a do jednostek gry
      const pivotSpriteX = 306.6; // Punkt obrotu w pikselach sprite\'a
      const pivotSpriteY = 85.0;  // Oś lufy (boreline) w pikselach sprite\'a

      // 1. Rysowanie korpusu broni, magazynka i suwadła w osi broni
      ctx.save();
      ctx.scale(s, s);
      ctx.translate(-pivotSpriteX, -pivotSpriteY);

      // A. Magazynek wpięty w gnieździe broni (gdy nie jest wypięty)
      if (hold.isMagInGun !== false) {
        ctx.drawImage(imgMag, 546, 120);
      }

      // B. Korpus bazowy (kolba, komora, lufa, łoże, chwyt i przyrządy celownicze)
      ctx.drawImage(imgBody, 0, 0);

      // C. Suwadło zamka z rączką (ruchome blowback przy strzale oraz odciąganie przy przeładowaniu)
      const boltPx = (hold.boltOffset || 0) * (1272 / 44.8);
      ctx.drawImage(imgBolt, 556 + boltPx, 50);

      ctx.restore();

      // 2. Magazynek trzymany w lewej dłoni podczas przeładowania (IK lewej ręki)
      if (hold.heldMag && hold.heldMag.type === 'AK47') {
        ctx.save();
        ctx.translate(hold.heldMag.x, hold.heldMag.y);
        ctx.rotate(hold.heldMag.angle || 0);
        ctx.scale(s, s);
        // Środek chwytu dłoni na korpusie magazynka
        ctx.drawImage(imgMag, -90, -90);
        ctx.restore();
      }

      // 3. Płomień wylotowy ze szczelin kompensatora na końcu lufy
      if (p.muzzleFlashTimer > 0) {
        drawMuzzleFlash(ctx, 34.0, -0.2, 11, false);
      }
    } else {
      // Proceduralny fallback w trakcie ładowania assetów
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(0, -1);
      ctx.lineTo(-10.2, 1.5);
      ctx.lineTo(-10.2, 6.2);
      ctx.lineTo(-5.2, 4.5);
      ctx.lineTo(0, 2.5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-10.8, 1.5, 1.4, 4.8);

      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(1, 2);
      ctx.lineTo(-1, 7);
      ctx.lineTo(2.2, 7.5);
      ctx.lineTo(4, 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, -2.5, 14, 4.5);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, -1.8, 14, 3.5);

      if (hold.isMagInGun !== false) {
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(6.5, 2.0);
        ctx.quadraticCurveTo(8.5, 8.5, 13.5, 10.5);
        ctx.lineTo(11.2, 11.5);
        ctx.quadraticCurveTo(5.5, 9.5, 4.0, 2.0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      if (hold.heldMag && hold.heldMag.type === 'AK47') {
        ctx.save();
        ctx.translate(hold.heldMag.x, hold.heldMag.y);
        ctx.rotate(hold.heldMag.angle);
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(-1.0, -3.5);
        ctx.quadraticCurveTo(1.0, 3.0, 6.0, 5.0);
        ctx.lineTo(3.8, 6.0);
        ctx.quadraticCurveTo(-1.8, 3.8, -3.5, -3.5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 0.6;
        ctx.stroke();
        ctx.restore();
      }

      const akBolt = hold.boltOffset || 0;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4.0 + akBolt, -2.8, 3.2, 1.4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(4.0 + akBolt, -2.4, 2.2, 1.0);

      ctx.fillStyle = '#78350f';
      ctx.fillRect(14, -2.2, 8.5, 3.8);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(14, -2.2, 8.5, 1.0);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(22.5, -1.4, 11.5, 2.4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(22.5, -2.2, 4, 1.2);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(29.5, -3.2, 1.5, 2.0);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(32.5, -1.6, 1.5, 2.8);

      if (p.muzzleFlashTimer > 0) {
        drawMuzzleFlash(ctx, 34, -0.2, 11, false);
      }
    }
  } else if (weapon.id === 'SHOTGUN') {
    const imgBody = getWeaponPartSprite('SHOTGUN_BODY');
    const imgPump = getWeaponPartSprite('SHOTGUN_PUMP');
    const imgShell = getWeaponPartSprite('SHOTGUN_SHELL');

    if (imgBody && imgBody.complete && imgBody.naturalWidth > 0 &&
        imgPump && imgPump.complete && imgPump.naturalWidth > 0) {
      
      const s = 39.0 / 1334;
      const pivotSpriteX = 401.3;
      const pivotSpriteY = 65.0;

      // 1. Warstwy w osi komory zamkowej i lufy
      ctx.save();
      ctx.scale(s, s);
      ctx.translate(-pivotSpriteX, -pivotSpriteY);

      // A. Korpus bazowy (składana kolba z hakiem, komora, lufa z osłoną termiczną, magazynek rurowy)
      ctx.drawImage(imgBody, 0, 0);

      // B. Ruchome czółenko pump-action (ślizga się wzdłuż osi magazynka rurowego)
      const pumpShiftPx = (p.pumpOffset || 0) * (1334 / 39.0);
      ctx.drawImage(imgPump, 780 + pumpShiftPx, 65);

      ctx.restore();

      // 2. Łuska 12-gauge trzymana w dłoni podczas ręcznego ładowania do komory
      if (hold.heldMag && hold.heldMag.type === 'SHOTGUN_SHELL') {
        ctx.save();
        ctx.translate(hold.heldMag.x, hold.heldMag.y);
        ctx.rotate(hold.heldMag.angle || 0);
        if (imgShell && imgShell.complete && imgShell.naturalWidth > 0) {
          const shellScale = 6.4 / 140;
          ctx.scale(shellScale, shellScale);
          ctx.drawImage(imgShell, -70, -28);
        } else {
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-2.8, -1.2, 5.0, 2.4);
          ctx.fillStyle = '#eab308';
          ctx.fillRect(-4.0, -1.3, 1.4, 2.6);
        }
        ctx.restore();
      }

      // 3. Płomień wylotowy ze szczelin wylotowych strzelby
      if (p.muzzleFlashTimer > 0) {
        drawMuzzleFlash(ctx, 28.0, -0.9, 15, true);
      }
    } else {
      // Proceduralny fallback w trakcie ładowania assetów
      ctx.fillStyle = '#3f2712';
      ctx.beginPath();
      ctx.moveTo(0, -1);
      ctx.lineTo(-10.4, 1.8);
      ctx.lineTo(-10.4, 6.8);
      ctx.lineTo(-4.8, 4.8);
      ctx.lineTo(0, 3.0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-11.0, 1.8, 1.4, 5.0);

      ctx.fillStyle = '#3f2712';
      ctx.fillRect(0, 2.5, 3.2, 5);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, -2.6, 11, 5.4);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, -3.2, 11, 1.2);

      ctx.fillStyle = '#334155';
      ctx.fillRect(11, -2.4, 17, 3.0);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(11, 0.6, 14, 2.4);

      const pumpX = 13 + (p.pumpOffset || 0);
      ctx.fillStyle = '#3f2712';
      ctx.fillRect(pumpX, -0.2, 7.5, 3.8);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.7;
      ctx.strokeRect(pumpX, -0.2, 7.5, 3.8);

      if (hold.heldMag && hold.heldMag.type === 'SHOTGUN_SHELL') {
        ctx.save();
        ctx.translate(hold.heldMag.x, hold.heldMag.y);
        ctx.rotate(hold.heldMag.angle);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-2.8, -1.2, 5.0, 2.4);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-4.0, -1.3, 1.4, 2.6);
        ctx.restore();
      }

      ctx.fillStyle = '#090d16';
      ctx.fillRect(26.5, -2.6, 1.5, 3.4);

      if (p.muzzleFlashTimer > 0) {
        drawMuzzleFlash(ctx, 28, -0.9, 15, true);
      }
    }
  } else if (weapon.id === 'SNIPER') {
    const imgBody = getWeaponPartSprite('SNIPER_BODY');
    const imgMag = getWeaponPartSprite('SNIPER_MAG');
    const imgBolt = getWeaponPartSprite('SNIPER_BOLT');

    if (imgBody && imgBody.complete && imgBody.naturalWidth > 0 &&
        imgMag && imgMag.complete && imgMag.naturalWidth > 0 &&
        imgBolt && imgBolt.complete && imgBolt.naturalWidth > 0) {
      
      const s = 58.5 / 1353;
      const pivotSpriteX = 320.7;
      const pivotSpriteY = 138.5;

      // 1. Warstwy w osi komory zamkowej i lufy
      ctx.save();
      ctx.scale(s, s);
      ctx.translate(-pivotSpriteX, -pivotSpriteY);

      // A. Masywny magazynek pudełkowy 5-nabojowy .50 BMG (wpięty w gnieździe)
      if (hold.isMagInGun !== false) {
        ctx.drawImage(imgMag, 470, 160);
      }

      // B. Korpus bazowy (kolba PRS, komora, luneta snajperska, łoże, dwójnóg, lufa ryflowana, hamulec wylotowy)
      ctx.drawImage(imgBody, 0, 0);

      // C. Ruchoma dźwignia zamka czterotaktowego (ruch w tył przy przeładowaniu)
      const boltPx = (hold.boltOffset || 0) * (1353 / 58.5);
      ctx.drawImage(imgBolt, 480 + boltPx, 70);

      ctx.restore();

      // 2. Magazynek pudełkowy trzymany w lewej ręce i wsuwany do gniazda
      if (hold.heldMag && hold.heldMag.type === 'SNIPER') {
        ctx.save();
        ctx.translate(hold.heldMag.x, hold.heldMag.y);
        ctx.rotate(hold.heldMag.angle || 0);
        ctx.scale(s, s);
        // Środek chwytu dłoni na korpusie magazynka .50
        ctx.drawImage(imgMag, -80, -90);
        ctx.restore();
      }

      // 3. Potężny płomień wylotowy Barretta .50
      if (p.muzzleFlashTimer > 0) {
        drawSniperMuzzleFlash(ctx, 45.5, -0.4, 20);
      }
    } else {
      // Proceduralny fallback w trakcie ładowania assetów
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, -1.0);
      ctx.lineTo(-11.5, 1.2);
      ctx.lineTo(-12.2, 6.5);
      ctx.lineTo(-5.5, 4.5);
      ctx.lineTo(0, 2.5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#020617';
      ctx.fillRect(-13.0, 0.8, 1.8, 5.8);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-10.8, -2.8, 7.8, 3.2);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-10.8, -2.8, 7.8, 0.9);

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0.5, 2.0);
      ctx.lineTo(-1.5, 7.5);
      ctx.lineTo(1.8, 8.2);
      ctx.lineTo(3.8, 2.0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, -3.2, 18, 5.8);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, -2.5, 17, 4.4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(3, -1.5, 6, 2.2);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(4, -1.0, 4.5, 1.4);

      const sniperBolt = hold.boltOffset || 0;
      ctx.fillStyle = '#475569';
      ctx.fillRect(4.5 + sniperBolt, -2.2, 2.0, 2.8);
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(5.5 + sniperBolt, -2.6, 1.4, 0, Math.PI * 2);
      ctx.fill();

      if (hold.isMagInGun !== false) {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(6.5, 2.6, 6.0, 7.2);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 0.6;
        ctx.strokeRect(6.5, 2.6, 6.0, 7.2);
      }

      if (hold.heldMag && hold.heldMag.type === 'SNIPER') {
        ctx.save();
        ctx.translate(hold.heldMag.x, hold.heldMag.y);
        ctx.rotate(hold.heldMag.angle);
        ctx.fillStyle = '#090d16';
        ctx.fillRect(-3.0, -3.6, 6.0, 7.2);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 0.6;
        ctx.strokeRect(-3.0, -3.6, 6.0, 7.2);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-1.5, -4.5, 3.0, 1.2);
        ctx.restore();
      }

      ctx.fillStyle = '#090d16';
      ctx.fillRect(-2, -4.2, 22, 1.2);

      ctx.fillStyle = '#334155';
      ctx.fillRect(2.5, -5.4, 2.0, 1.4);
      ctx.fillRect(11.5, -5.4, 2.0, 1.4);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0.5, -7.0, 15, 2.2);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(7, -8.4, 2.4, 1.6);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-3, -7.8, 3.8, 3.6);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-3, -7.2, 1.2, 2.4);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(15, -8.2, 4.5, 4.4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(19.2, -7.5, 0.9, 3.0);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(15.5, -2.6, 13.5, 4.2);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(17.5, -1.2, 2.0, 1.4);
      ctx.fillRect(21.5, -1.2, 2.0, 1.4);
      ctx.fillRect(25.5, -1.2, 2.0, 1.4);

      ctx.fillStyle = '#090d16';
      ctx.fillRect(21, 2.0, 8, 1.3);

      ctx.fillStyle = '#334155';
      ctx.fillRect(29, -1.7, 12, 2.4);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(29, -1.1, 12, 0.7);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(41, -2.8, 4.5, 4.8);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(41, -2.2, 4.0, 3.6);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(42.0, -2.4, 1.0, 4.0);
      ctx.fillRect(43.5, -2.4, 1.0, 4.0);

      if (p.muzzleFlashTimer > 0) {
        drawSniperMuzzleFlash(ctx, 45.5, -0.4, 20);
      }
    }
  } else if (weapon.id === 'GLOCK') {
    // -------------------------------------------------------------
    // GLOCK 17 TACTICAL HANDGUN RENDERER
    // -------------------------------------------------------------
    const imgFrame = getWeaponPartSprite('GLOCK_FRAME');
    const imgSlide = getWeaponPartSprite('GLOCK_SLIDE');
    const imgMag = getWeaponPartSprite('GLOCK_MAG');

    const glockSlideOffset = hold.boltOffset || 0;
    const isSlideBack = (p.muzzleFlashTimer > 0) ? -2.2 : glockSlideOffset;

    if (imgFrame && imgFrame.complete && imgFrame.naturalWidth > 0 &&
        imgSlide && imgSlide.complete && imgSlide.naturalWidth > 0) {
      
      const s = 15.7 / 835;
      const pivotSpriteX = 161.4;
      const pivotSpriteY = 90.0;

      // 1. Warstwy pistoletu w osi broni
      ctx.save();
      ctx.scale(s, s);
      ctx.translate(-pivotSpriteX, -pivotSpriteY);

      // A. Polimerowy szkielet (chwyt, kabłąk, lufa wewnętrzna)
      ctx.drawImage(imgFrame, 2, 140);

      // B. Zamek stalowy (Tenifer Slide) z ruchem blowbacku
      const slideShiftPx = isSlideBack * (835 / 15.7);
      ctx.drawImage(imgSlide, 44 + slideShiftPx, 2);

      ctx.restore();

      // 2. Magazynek 9mm trzymany w lewej dłoni podczas przeładowania
      if (hold.heldMag && hold.heldMag.type === 'GLOCK') {
        ctx.save();
        ctx.translate(hold.heldMag.x, hold.heldMag.y);
        ctx.rotate(hold.heldMag.angle || 0);
        if (imgMag && imgMag.complete && imgMag.naturalWidth > 0) {
          const magScale = 7.5 / 220;
          ctx.scale(magScale, magScale);
          ctx.drawImage(imgMag, -50, -110);
        } else {
          ctx.fillStyle = '#18181b';
          ctx.fillRect(-1.8, -4.0, 3.5, 7.5);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(-1.0, -5.2, 2.2, 1.4);
          ctx.fillStyle = '#09090b';
          ctx.fillRect(-2.2, 3.2, 4.2, 1.2);
        }
        ctx.restore();
      }

      // 3. Płomień wylotowy
      if (p.muzzleFlashTimer > 0) {
        drawMuzzleFlash(ctx, 13.5, -0.6, 8, false);
      }
    } else {
      // Proceduralny fallback w trakcie ładowania assetów
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.moveTo(1.2, 0.5);
      ctx.lineTo(-2.2, 7.2);
      ctx.lineTo(1.8, 7.5);
      ctx.lineTo(4.2, 1.2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-0.2, 2.5); ctx.lineTo(2.8, 2.8);
      ctx.moveTo(-1.0, 4.5); ctx.lineTo(2.2, 4.8);
      ctx.moveTo(-1.8, 6.2); ctx.lineTo(1.5, 6.5);
      ctx.stroke();

      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(3.5, 1.2);
      ctx.lineTo(3.5, 3.8);
      ctx.lineTo(1.0, 3.8);
      ctx.stroke();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(2.4, 2.0);
      ctx.lineTo(1.8, 3.2);
      ctx.stroke();

      ctx.fillStyle = '#18181b';
      ctx.fillRect(4.0, -0.6, 7.0, 2.2);

      if (hold.isMagInGun !== false) {
        ctx.fillStyle = '#09090b';
        ctx.fillRect(-2.2, 7.0, 3.8, 1.2);
      }

      if (hold.heldMag && hold.heldMag.type === 'GLOCK') {
        ctx.save();
        ctx.translate(hold.heldMag.x, hold.heldMag.y);
        ctx.rotate(hold.heldMag.angle);
        ctx.fillStyle = '#18181b';
        ctx.fillRect(-1.8, -4.0, 3.5, 7.5);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-1.0, -5.2, 2.2, 1.4);
        ctx.fillStyle = '#09090b';
        ctx.fillRect(-2.2, 3.2, 4.2, 1.2);
        ctx.restore();
      }

      ctx.fillStyle = '#090d16';
      ctx.fillRect(8.5, -2.0, 4.5, 1.8);

      ctx.save();
      ctx.translate(isSlideBack, 0);

      ctx.fillStyle = '#27272a';
      ctx.fillRect(-2.0, -3.2, 14.5, 3.0);
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(-2.0, -3.2, 14.5, 0.8);

      ctx.fillStyle = '#18181b';
      ctx.fillRect(-1.0, -3.0, 0.8, 2.4);
      ctx.fillRect(0.6, -3.0, 0.8, 2.4);
      ctx.fillRect(2.2, -3.0, 0.8, 2.4);

      ctx.fillStyle = '#09090b';
      ctx.fillRect(4.5, -3.0, 3.2, 1.6);
      ctx.fillStyle = '#52525b';
      ctx.fillRect(7.2, -2.6, 0.8, 1.0);

      ctx.fillStyle = '#18181b';
      ctx.fillRect(-1.8, -4.2, 1.2, 1.2);
      ctx.fillRect(11.0, -4.2, 1.2, 1.2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1.5, -3.8, 0.6, 0.6);
      ctx.fillRect(11.3, -3.8, 0.6, 0.6);

      ctx.restore();

      if (p.muzzleFlashTimer > 0) {
        drawMuzzleFlash(ctx, 13.5, -0.6, 8, false);
      }
    }
  } else if (weapon.id === 'REVOLVER') {
    // -------------------------------------------------------------
    // MAGNUM .44 HEAVY REVOLVER RENDERER
    // -------------------------------------------------------------
    const imgBody = getWeaponPartSprite('REVOLVER_BODY');
    const imgCyl = getWeaponPartSprite('REVOLVER_CYLINDER');

    if (imgBody && imgBody.complete && imgBody.naturalWidth > 0) {
      const s = 20.2 / 1040;
      const pivotSpriteX = 374.7;
      const pivotSpriteY = 100.0;

      ctx.save();
      ctx.scale(s, s);
      ctx.translate(-pivotSpriteX, -pivotSpriteY);

      // Korpus ze stali nierdzewnej i lufą 6 cali z wentylowaną szyną
      ctx.drawImage(imgBody, 2, 2);

      // Bębenek 6-komorowy .44 Magnum
      if (imgCyl && imgCyl.complete && imgCyl.naturalWidth > 0) {
        ctx.drawImage(imgCyl, 380, 90);
      }

      ctx.restore();

      if (p.muzzleFlashTimer > 0) {
        drawMuzzleFlash(ctx, 17.0, -1.2, 12, false);
      }
    } else {
      // Proceduralny fallback w trakcie ładowania assetów
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(1.2, 0.5);
      ctx.lineTo(-2.8, 8.5);
      ctx.lineTo(-0.2, 8.8);
      ctx.lineTo(3.2, 1.8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-2.5, -2.5, 15.5, 3.2);

      ctx.fillStyle = '#64748b';
      ctx.fillRect(1.5, -3.2, 5.5, 4.8);
      ctx.fillStyle = '#334155';
      ctx.fillRect(2.5, -2.2, 3.5, 1.2);
      ctx.fillRect(2.5, -0.2, 3.5, 1.2);

      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(7.0, -2.4, 9.5, 2.6);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(7.0, -3.4, 8.5, 1.0);

      ctx.fillStyle = '#475569';
      ctx.fillRect(-3.2, -3.8, 1.6, 2.2);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(15.5, -3.6, 1.0, 1.4);

      if (p.muzzleFlashTimer > 0) {
        drawMuzzleFlash(ctx, 17.0, -1.2, 12, false);
      }
    }
  } else if (weapon.id === 'SAWED_OFF') {
    // -------------------------------------------------------------
    // SAWED-OFF 12G DOUBLE-BARREL RENDERER
    // -------------------------------------------------------------
    const imgBody = getWeaponPartSprite('SAWED_OFF_BODY');
    const imgBarrels = getWeaponPartSprite('SAWED_OFF_BARRELS');

    if (imgBody && imgBody.complete && imgBody.naturalWidth > 0 &&
        imgBarrels && imgBarrels.complete && imgBarrels.naturalWidth > 0) {
      
      const s = 23.0 / 1160;
      const pivotSpriteX = 226.5;
      const pivotSpriteY = 53.0;

      ctx.save();
      ctx.scale(s, s);
      ctx.translate(-pivotSpriteX, -pivotSpriteY);

      // A. Drewniany zaokrąglony chwyt birdshead i stalowa baskila
      ctx.drawImage(imgBody, 2, 2);

      // B. Skrócone podwójne lufy 12 Gauge z czółenkiem
      const isReloadBreak = p.isReloading && (p.reloadProgress > 0.2 && p.reloadProgress < 0.85);
      const breakAngle = isReloadBreak ? 0.38 : 0.0;

      if (breakAngle > 0.01) {
        ctx.save();
        ctx.translate(510, 140);
        ctx.rotate(breakAngle);
        ctx.drawImage(imgBarrels, -10, -130);
        ctx.restore();
      } else {
        ctx.drawImage(imgBarrels, 500, 10);
      }

      ctx.restore();

      if (p.muzzleFlashTimer > 0) {
        drawMuzzleFlash(ctx, 19.5, -1.0, 15, true);
      }
    } else {
      // Proceduralny fallback w trakcie ładowania assetów
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-3.5, 6.5);
      ctx.lineTo(-0.8, 7.2);
      ctx.lineTo(2.8, 1.5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#475569';
      ctx.fillRect(-1.5, -2.5, 7.5, 4.2);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(6.0, -2.8, 13.0, 3.8);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(6.0, -1.2, 13.0, 0.8);
      ctx.fillStyle = '#000000';
      ctx.fillRect(19.0, -2.6, 0.8, 3.4);

      ctx.fillStyle = '#92400e';
      ctx.fillRect(6.0, 1.0, 7.0, 1.8);

      if (p.muzzleFlashTimer > 0) {
        drawMuzzleFlash(ctx, 19.5, -1.0, 15, true);
      }
    }
  } else if (weapon.id === 'KNIFE') {
    // -------------------------------------------------------------
    // M9 BAYONET COMBAT KNIFE RENDERER
    // -------------------------------------------------------------
    const imgKnife = getWeaponPartSprite('KNIFE');
    if (imgKnife && imgKnife.complete && imgKnife.naturalWidth > 0) {
      const s = 24.7 / 1275;
      const pivotSpriteX = 268.4;
      const pivotSpriteY = 188.5;

      ctx.save();
      ctx.scale(s, s);
      ctx.translate(-pivotSpriteX, -pivotSpriteY);
      ctx.drawImage(imgKnife, 2, 2);
      ctx.restore();
    } else {
      // Proceduralny fallback w trakcie ładowania assetów
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-4.0, -1.6, 5.0, 3.2);
      ctx.fillStyle = '#292524';
      ctx.fillRect(-3.0, -1.6, 1.0, 3.2);
      ctx.fillRect(-1.5, -1.6, 1.0, 3.2);

      ctx.fillStyle = '#64748b';
      ctx.fillRect(-5.2, -2.0, 1.2, 4.0);

      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(1.0, -4.0, 1.5, 8.0);

      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(2.5, -2.2);
      ctx.lineTo(16.5, -2.2);
      ctx.lineTo(19.5, 0.5);
      ctx.lineTo(15.5, 2.2);
      ctx.lineTo(2.5, 2.2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#475569';
      ctx.fillRect(4.5, -0.6, 9.0, 1.2);
      ctx.fillStyle = '#64748b';
      for (let s = 4; s < 12; s += 2) {
        ctx.fillRect(s, -3.0, 1.0, 0.9);
      }
    }
  } else if (weapon.id === 'MACHETE') {
    // -------------------------------------------------------------
    // TACTICAL KUKRI MACHETE RENDERER
    // -------------------------------------------------------------
    const imgMachete = getWeaponPartSprite('MACHETE');
    if (imgMachete && imgMachete.complete && imgMachete.naturalWidth > 0) {
      const s = 28.0 / 1242;
      const pivotSpriteX = 266.0;
      const pivotSpriteY = 100.0;

      ctx.save();
      ctx.scale(s, s);
      ctx.translate(-pivotSpriteX, -pivotSpriteY);
      ctx.drawImage(imgMachete, 2, 2);
      ctx.restore();
    } else {
      // Proceduralny fallback w trakcie ładowania assetów
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-5.0, -1.5, 6.0, 3.0);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-6.0, -2.2, 1.2, 4.4);

      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(1.0, -1.8);
      ctx.lineTo(12.0, -3.5);
      ctx.lineTo(22.0, 1.0);
      ctx.lineTo(16.0, 4.5);
      ctx.lineTo(6.0, 2.2);
      ctx.lineTo(1.0, 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.fillRect(3.0, -0.4, 11.0, 1.0);
    }
  } else if (weapon.id === 'AXE') {
    // -------------------------------------------------------------
    // TACTICAL TOMAHAWK AXE RENDERER
    // -------------------------------------------------------------
    const imgAxe = getWeaponPartSprite('AXE');
    if (imgAxe && imgAxe.complete && imgAxe.naturalWidth > 0) {
      const s = 19.5 / 1115;
      const pivotSpriteX = 228.7;
      const pivotSpriteY = 206.0;

      ctx.save();
      ctx.scale(s, s);
      ctx.translate(-pivotSpriteX, -pivotSpriteY);
      ctx.drawImage(imgAxe, 2, 2);
      ctx.restore();
    } else {
      // Proceduralny fallback w trakcie ładowania assetów
      ctx.fillStyle = '#27272a';
      ctx.fillRect(-4.0, -1.8, 16.0, 2.6);
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(11.0, -7.0);
      ctx.lineTo(15.5, -5.5);
      ctx.lineTo(14.0, 6.5);
      ctx.lineTo(9.5, 5.0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(10.0, -1.5);
      ctx.lineTo(5.5, -1.0);
      ctx.lineTo(10.0, 0.5);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawMuzzleFlash(ctx, mx, my, size, isShotgun) {
  ctx.save();
  ctx.translate(mx, my);

  // Zewnętrzny obłok żaru (zastępuje ciężki shadowBlur)
  ctx.fillStyle = 'rgba(251, 146, 60, 0.35)';
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.55);
  ctx.lineTo(size * 1.2, -size * 0.22);
  ctx.lineTo(size * 1.6, 0);
  ctx.lineTo(size * 1.2, size * 0.22);
  ctx.lineTo(0, size * 0.55);
  ctx.lineTo(size * 0.35, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.35);
  ctx.lineTo(size * 0.9, -size * 0.15);
  ctx.lineTo(size * 1.3, 0);
  ctx.lineTo(size * 0.9, size * 0.15);
  ctx.lineTo(0, size * 0.35);
  ctx.lineTo(size * 0.25, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.5);
  ctx.lineTo(size * 0.7, 0);
  ctx.lineTo(0, size * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(2, 0, size * 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSniperMuzzleFlash(ctx, mx, my, size) {
  ctx.save();
  ctx.translate(mx, my);

  // Zewnętrzna poświata energii balistycznej (zastępuje shadowBlur)
  ctx.fillStyle = 'rgba(56, 189, 248, 0.30)';
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.55);
  ctx.lineTo(size * 1.4, -size * 0.18);
  ctx.lineTo(size * 1.9, 0);
  ctx.lineTo(size * 1.4, size * 0.18);
  ctx.lineTo(0, size * 0.55);
  ctx.lineTo(size * 0.4, 0);
  ctx.closePath();
  ctx.fill();

  // Potężny błysk centralny z lufy .50 BMG
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.35);
  ctx.lineTo(size * 1.1, -size * 0.12);
  ctx.lineTo(size * 1.6, 0);
  ctx.lineTo(size * 1.1, size * 0.12);
  ctx.lineTo(0, size * 0.35);
  ctx.lineTo(size * 0.3, 0);
  ctx.closePath();
  ctx.fill();

  // Wyrzut płomienia i gazów w bok/tył ze szczelin hamulca wylotowego (Muzzle brake side vents)
  ctx.fillStyle = '#fb923c';
  ctx.beginPath();
  ctx.moveTo(-2, -2);
  ctx.lineTo(-size * 0.45, -size * 0.65);
  ctx.lineTo(-size * 0.15, -size * 0.4);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-2, 2);
  ctx.lineTo(-size * 0.45, size * 0.65);
  ctx.lineTo(-size * 0.15, size * 0.4);
  ctx.closePath();
  ctx.fill();

  // Biały rdzeń wybuchu
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(2, 0, size * 0.26, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

