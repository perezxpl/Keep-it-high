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
  } else if (weapon.id === 'SHOTGUN') {
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
      // Czerwona łuska 12-gauge z mosiężną kryzą
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
  } else if (weapon.id === 'SNIPER') {
    // 1. Kolba precyzyjna (Tactical PRS sniper stock z baką policzkową i stopką)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, -1.0);
    ctx.lineTo(-11.5, 1.2);
    ctx.lineTo(-12.2, 6.5);
    ctx.lineTo(-5.5, 4.5);
    ctx.lineTo(0, 2.5);
    ctx.closePath();
    ctx.fill();

    // Gumowa stopka kolby amortyzująca odrzut .50 BMG (Buttpad)
    ctx.fillStyle = '#020617';
    ctx.fillRect(-13.0, 0.8, 1.8, 5.8);

    // Regulowana baka policzkowa (Cheek riser)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-10.8, -2.8, 7.8, 3.2);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-10.8, -2.8, 7.8, 0.9);

    // Chwyt pistoletowy (Ergonomic combat grip)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0.5, 2.0);
    ctx.lineTo(-1.5, 7.5);
    ctx.lineTo(1.8, 8.2);
    ctx.lineTo(3.8, 2.0);
    ctx.closePath();
    ctx.fill();

    // 2. Masywna komora zamkowa Barretta .50 (Upper & Lower receiver)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, -3.2, 18, 5.8);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, -2.5, 17, 4.4);
    // Suwadło i okno wyrzutnika łusek
    ctx.fillStyle = '#334155';
    ctx.fillRect(3, -1.5, 6, 2.2);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(4, -1.0, 4.5, 1.4);

    // Dźwignia zamka czterotaktowego (Bolt handle) poruszająca się w cyklu przeładowania
    const sniperBolt = hold.boltOffset || 0;
    ctx.fillStyle = '#475569';
    ctx.fillRect(4.5 + sniperBolt, -2.2, 2.0, 2.8);
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(5.5 + sniperBolt, -2.6, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Masywny magazynek pudełkowy 5-nabojowy .50 BMG (znika po wypięciu)
    if (hold.isMagInGun !== false) {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(6.5, 2.6, 6.0, 7.2);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.6;
      ctx.strokeRect(6.5, 2.6, 6.0, 7.2);
    }

    // Magazynek pudełkowy trzymany w lewej ręce i wsuwany do gniazda
    if (hold.heldMag && hold.heldMag.type === 'SNIPER') {
      ctx.save();
      ctx.translate(hold.heldMag.x, hold.heldMag.y);
      ctx.rotate(hold.heldMag.angle);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-3.0, -3.6, 6.0, 7.2);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.6;
      ctx.strokeRect(-3.0, -3.6, 6.0, 7.2);
      // Mosiężny wierzchołek pocisku .50 BMG wystający z warg magazynka
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-1.5, -4.5, 3.0, 1.2);
      ctx.restore();
    }

    // Szyna montażowa Picatinny (Top rail)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(-2, -4.2, 22, 1.2);

    // 3. Luneta celownicza (High-power optical sniper scope)
    // Montaże lunety (Scope mounting rings)
    ctx.fillStyle = '#334155';
    ctx.fillRect(2.5, -5.4, 2.0, 1.4);
    ctx.fillRect(11.5, -5.4, 2.0, 1.4);
    // Tubus lunety (Central tube)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0.5, -7.0, 15, 2.2);
    // Wieżyczka regulacji (Elevation turret)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(7, -8.4, 2.4, 1.6);
    // Okular tylny (Ocular eyepiece)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(-3, -7.8, 3.8, 3.6);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-3, -7.2, 1.2, 2.4);
    // Obiektyw przedni z osłoną przeciwsłoneczną (Objective bell & sunshade)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(15, -8.2, 4.5, 4.4);
    // Antyrefleksyjny błękitny błysk optyki (Glass optical reflection)
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(19.2, -7.5, 0.9, 3.0);

    // 4. Łoże z perforacją chłodzącą (Ventilated handguard)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(15.5, -2.6, 13.5, 4.2);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(17.5, -1.2, 2.0, 1.4);
    ctx.fillRect(21.5, -1.2, 2.0, 1.4);
    ctx.fillRect(25.5, -1.2, 2.0, 1.4);

    // Złożony dwójnóg pod łożem (Folded bipod)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(21, 2.0, 8, 1.3);

    // 5. Długa stalowa lufa ryflowana (Heavy fluted steel barrel)
    ctx.fillStyle = '#334155';
    ctx.fillRect(29, -1.7, 12, 2.4);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(29, -1.1, 12, 0.7); // chromowo-stalowy refleks na lufie

    // 6. Potężny hamulec wylotowy Barretta .50 (Arrowhead muzzle brake)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(41, -2.8, 4.5, 4.8);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(41, -2.2, 4.0, 3.6);
    // Szczeliny gazowe (Port vents)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(42.0, -2.4, 1.0, 4.0);
    ctx.fillRect(43.5, -2.4, 1.0, 4.0);

    if (p.muzzleFlashTimer > 0) {
      drawSniperMuzzleFlash(ctx, 45.5, -0.4, 20);
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

