// =========================================================================
// PICKUP/RENDERER.JS - RENDEROWANIE LEŻĄCEJ BRONI ORAZ INTERAKTYWNEGO PRZYCISKU
// Standard: Zero emojis, modularyzacja ES, strict DAG
// =========================================================================

import { getWeaponSprite } from '../loadout/weaponPreviews.js';
import { getCanvasLogicalWidth, getCanvasLogicalHeight } from '../camera.js';
import { pickupState, pickupPromptState } from './state.js';
import { getGroundSurfaceBelow } from './logic.js';

/**
 * Renderuje upuszczone bronie lezace w swiecie gry
 */
export function drawPickupsWorld(ctx, camera) {
  if (!ctx || pickupState.droppedWeapons.length === 0) return;

  const camW = typeof getCanvasLogicalWidth === 'function' ? getCanvasLogicalWidth() : 1920;
  const camH = typeof getCanvasLogicalHeight === 'function' ? getCanvasLogicalHeight() : 1080;
  const zoom = camera && camera.zoom ? camera.zoom : 1;
  const viewW = camera?.viewWidth || (camW / zoom);
  const viewH = camera?.viewHeight || (camH / zoom);
  const margin = 80;
  const minX = (camera?.x || 0) - margin;
  const maxX = (camera?.x || 0) + viewW + margin;
  const minY = (camera?.y || 0) - margin;
  const maxY = (camera?.y || 0) + viewH + margin;

  const now = performance.now();

  for (let i = 0; i < pickupState.droppedWeapons.length; i++) {
    const dw = pickupState.droppedWeapons[i];
    if (dw.x < minX || dw.x > maxX || dw.y < minY || dw.y > maxY) continue;

    // Miganie ostrzegawcze w ostatnich 4 sekundach trwania (z pelnych 15 sekund)
    if (dw.life < 4.0) {
      const blink = Math.sin(now * 0.02);
      if (blink < -0.2) continue;
    }

    // 1. Cien rzucany na podloze:
    // Jesli bron lezy (isGrounded) - cien jest tuz pod nia na plasko (bez rotacji broni).
    // Jesli bron opada w powietrzu - rzutujemy cien na powierzchnie ponizej ze stopniowym zanikaniem.
    if (dw.isGrounded) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(dw.x, dw.y + 4, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const surfaceBelowY = getGroundSurfaceBelow(dw.x, dw.y, dw.startY);
      if (surfaceBelowY >= dw.y) {
        const heightAbove = surfaceBelowY - dw.y;
        const shadowFactor = Math.max(0.15, Math.min(1.0, 1.0 - heightAbove / 250));
        ctx.fillStyle = `rgba(0, 0, 0, ${0.40 * shadowFactor})`;
        ctx.beginPath();
        ctx.ellipse(dw.x, surfaceBelowY, 18 * shadowFactor, 5 * shadowFactor, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. Taktyczny kolor poswiaty w zaleznosci od klasy uzbrojenia (tylko gdy bron lezy stabilnie)
    let badgeBorderColor = '#06b6d4';
    if (dw.isMelee) {
      badgeBorderColor = '#ef4444';
    } else if (dw.weaponId === 'GLOCK' || dw.weaponId === 'REVOLVER' || dw.weaponId === 'SAWED_OFF' || dw.weaponId === 'RPG7') {
      badgeBorderColor = '#f59e0b';
    }

    if (dw.isGrounded) {
      let glowColor = 'rgba(6, 182, 212, 0.22)';
      if (dw.isMelee) {
        glowColor = 'rgba(239, 68, 68, 0.22)';
      } else if (dw.weaponId === 'GLOCK' || dw.weaponId === 'REVOLVER' || dw.weaponId === 'SAWED_OFF' || dw.weaponId === 'RPG7') {
        glowColor = 'rgba(245, 158, 11, 0.22)';
      }
      const pulse = 0.5 + 0.5 * Math.sin(now * 0.005 + i);
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.ellipse(dw.x, dw.y + 2, 22 + pulse * 6, 8 + pulse * 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Rysowanie sprite'a broni lub realistycznej sylwetki
    ctx.save();
    ctx.translate(dw.x, dw.y);
    if (!dw.isGrounded) {
      ctx.rotate(dw.rot);
    }
    ctx.scale(dw.facing || 1, 1);

    const sprite = getWeaponSprite(dw.weaponId);
    let drewSprite = false;

    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      const isHandgun = (dw.weaponId === 'GLOCK' || dw.weaponId === 'REVOLVER' || dw.weaponId === 'SAWED_OFF');
      const targetW = dw.isMelee ? 28 : (isHandgun ? 24 : (dw.weaponId === 'RPG7' ? 52 : 44));
      const scale = targetW / sprite.naturalWidth;
      const targetH = sprite.naturalHeight * scale;
      ctx.drawImage(sprite, -targetW * 0.5, -targetH * 0.65, targetW, targetH);
      drewSprite = true;
    }

    if (!drewSprite) {
      // Rezerwowa sylwetka wektorowa
      if (dw.weaponId === 'AK47') {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-10, -1.5, 7, 3);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-3, -2, 16, 4);
        ctx.fillStyle = '#334155';
        ctx.fillRect(4, 2, 4, 5);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(13, -1, 10, 2);
      } else if (dw.weaponId === 'GLOCK') {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(-2, 0, 3.5, 5.5);
        ctx.fillStyle = '#27272a';
        ctx.fillRect(-4, -2.5, 12, 3.0);
        ctx.fillStyle = '#090d16';
        ctx.fillRect(8, -1.8, 2, 1.6);
      } else {
        ctx.fillStyle = '#3f2712';
        ctx.fillRect(-8, -1.5, 7, 3.5);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-1, -2.5, 13, 5);
        ctx.fillStyle = '#334155';
        ctx.fillRect(12, -2, 14, 3);
      }
    }
    ctx.restore();

    // 4. Miniaturowy taktyczny identyfikator amunicji nad lezaca bronia (tylko gdy uziemiona)
    if (dw.isGrounded) {
      ctx.save();
      ctx.translate(dw.x, dw.y - 16);
      ctx.font = 'bold 9px monospace';
      const labelText = dw.isMelee ? (dw.name || 'BIAŁA') : `${dw.name || dw.weaponId} ${dw.currentAmmo}/${dw.reserveAmmo}`;
      const textMetrics = ctx.measureText(labelText);
      const badgeW = Math.max(46, textMetrics.width + 12);

      ctx.fillStyle = 'rgba(9, 9, 11, 0.88)';
      ctx.strokeStyle = badgeBorderColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-badgeW * 0.5, -9, badgeW, 16, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = dw.isMelee ? '#f87171' : '#38bdf8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, 0, -1);
      ctx.restore();
    }
  }
}

/**
 * Renderuje interaktywny plywajacy przycisk podnoszenia na ekranie
 */
export function drawPickupPrompt(ctx, camera, isTouchDevice = false) {
  const pState = pickupPromptState;
  const candidate = pState.currentInteractable;
  if (!ctx || !candidate || pState.promptAlpha <= 0.02) return;

  const btn = pState.touchButtonBounds;
  const alpha = pState.promptAlpha;
  const prog = Math.max(0, Math.min(1.0, candidate.progress || 0));

  ctx.save();
  ctx.globalAlpha = alpha;

  const cx = btn.x;
  const cy = btn.y;
  const r = btn.r || 21;

  // Kolorystyka i slowo akcji w zaleznosci od typu
  let mainColor = '#0891b2';
  let accentColor = '#22d3ee';
  let actionWord = 'ZAMIEŃ';

  if (candidate.type === 'CARE_PACKAGE') {
    mainColor = '#d97706';
    accentColor = '#fbbf24';
    actionWord = 'ZRZUT';
  } else if (candidate.type === 'TOMAHAWK') {
    mainColor = '#dc2626';
    accentColor = '#f87171';
    actionWord = 'ZŁAP';
  }

  // 1. Dyskretny pulsujacy pierscien zewnetrzny
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.008);
  ctx.strokeStyle = (candidate.type === 'CARE_PACKAGE')
    ? `rgba(245, 158, 11, ${0.18 + pulse * 0.18})`
    : `rgba(6, 182, 212, ${0.18 + pulse * 0.18})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2 + pulse * 2, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Tlo okraglego przycisku (Slate Glassmorphism)
  const isHolding = pState.isHoldingTouch || pState.isHoldingMouse;
  const bgGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
  bgGrad.addColorStop(0, isHolding ? 'rgba(30, 41, 59, 0.98)' : 'rgba(15, 23, 42, 0.92)');
  bgGrad.addColorStop(1, 'rgba(2, 6, 23, 0.96)');
  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Baza obrysu przycisku
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 3. Okragly pasek postepu przytrzymania (Hold Progress Ring)
  if (prog > 0.01) {
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 0.5, -Math.PI * 0.5, -Math.PI * 0.5 + prog * Math.PI * 2);
    ctx.stroke();
  }

  // 4. Wnetrze przycisku:
  if (!isTouchDevice) {
    // Widok PC: Klawisz [E] w srodku oraz mikro-etykieta pod spodem
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('E', cx, cy);

    // Mikro-badge akcji pod przyciskiem PC
    ctx.font = 'bold 9px monospace';
    const tagW = Math.max(50, ctx.measureText(actionWord).width + 12);
    const tagH = 15;
    const tagX = cx - tagW * 0.5;
    const tagY = cy + r + 3;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, tagW, tagH, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accentColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(actionWord, cx, tagY + tagH * 0.5);
  } else {
    // Widok Mobilny / Dotykowy: Napis akcji "ZAMIEŃ", "ZRZUT" lub "ZŁAP" bezposrednio w przycisku
    ctx.fillStyle = accentColor;
    ctx.font = '900 9.5px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(actionWord, cx, cy);
  }

  ctx.restore();
}
