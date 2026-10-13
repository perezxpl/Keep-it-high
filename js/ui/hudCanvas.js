// =========================================================================
// UI/HUDCANVAS.JS - RYSOWANIE HUD, SLOTÓW BRONI I KONTROLEK DOTYKOWYCH
// Wydzielony moduł z js/world.js i zdeduplikowany z js/player/renderer.js
// =========================================================================

import { isTouchDevice } from '../config.js';
import { camera, worldToScreen } from '../camera.js';
import {
  W,
  H,
  weaponButtons,
  currentFps,
  updateFps,
  _worldArenaState,
  goalCelebration
} from '../world/state.js';
import { drawRankHUD, drawMatchVictoryHUD, checkMatchWin, updateMatchWinState } from './rankHud.js';
import { drawDeathmatchHUD, drawDeathmatchPodium } from '../deathmatch/index.js';
import { getJetpackFlamePalette } from '../player/jetpack.js';
import { getStrikerFlameColor } from '../classes/striker.js';

export function drawDynamicActionSymbol(ctx, mode, cx, cy, isPressed, player) {
  ctx.save();
  ctx.translate(cx, cy);

  const mainColor = isPressed ? 'rgba(255, 255, 255, 0.78)' : 'rgba(255, 255, 255, 0.48)';
  const faintColor = isPressed ? 'rgba(255, 255, 255, 0.48)' : 'rgba(255, 255, 255, 0.25)';

  // Ciemna mikro-otoczka (Dual-Stroke / Dark Halo): niewidoczna na ciemnym tle, daje ostry kontrast na bieli
  ctx.shadowColor = isPressed ? 'rgba(0, 0, 0, 0.62)' : 'rgba(0, 0, 0, 0.48)';
  ctx.shadowBlur = 2.5;

  ctx.strokeStyle = mainColor;
  ctx.fillStyle = mainColor;
  ctx.lineWidth = 2.0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (mode === 'SLIDE') {
    // 1. Wektorowa sylwetka wślizgu bojowego (Slide)
    ctx.beginPath();
    ctx.arc(-6, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-5, -1);
    ctx.lineTo(-2, 3);
    ctx.lineTo(8, 3);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-2, 3);
    ctx.lineTo(2, 0);
    ctx.stroke();

    ctx.strokeStyle = faintColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-9, 5);
    ctx.lineTo(10, 5);
    ctx.stroke();
  } else if (mode === 'PRONE') {
    // 2. Wektorowa sylwetka leżenia (Prone)
    const pFacing = player ? (player.facing || 1) : 1;
    ctx.beginPath();
    ctx.arc(pFacing * 6, -1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pFacing * 3, 1);
    ctx.lineTo(-pFacing * 8, 1);
    ctx.stroke();

    ctx.strokeStyle = faintColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-10, 4);
    ctx.lineTo(10, 4);
    ctx.stroke();
  } else if (mode === 'STAND') {
    // 3. Wektorowa sylwetka wstawania (Stand up)
    ctx.beginPath();
    ctx.arc(0, -6, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(0, 5);
    ctx.stroke();

    ctx.strokeStyle = faintColor;
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(0, -5);
    ctx.lineTo(5, 0);
    ctx.stroke();
  } else {
    // 4. Wektorowa sylwetka dynamicznego wykopu (Kick)
    ctx.beginPath();
    ctx.arc(-4, -6, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-3, -3);
    ctx.lineTo(-1, 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-1, 2);
    ctx.lineTo(-4, 7);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-1, 2);
    ctx.lineTo(5, -1);
    ctx.lineTo(9, -2);
    ctx.stroke();

    ctx.strokeStyle = faintColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 11, -0.6, 0.1);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawTouchControls(ctx, player, leftStick, btnCluster, rightStick, ball, inKickRange = null) {
  if (!isTouchDevice || !ctx || !player) return;

  ctx.save();
  // Zwiększona przezroczystość całego pada dotykowego
  ctx.globalAlpha = 0.62;
  const time = performance.now();

  // -------------------------------------------------------------------------
  // 1. LEWY DRĄŻEK: RUCH, SKOK, JETPACK (Dual-Stroke: ciemna mikro-otoczka + jasny rdzeń)
  // -------------------------------------------------------------------------
  if (leftStick && leftStick.baseX > 0) {
    const isStickActive = leftStick.active;
    const isJetActive = player.isJetpacking || leftStick.isJetpacking;
    const maxR = leftStick.maxRadius || 55;
    const bx = leftStick.baseX;
    const by = leftStick.baseY;

    // Baza drążka: subtelne przydymienie (niewidoczne na czerni, czytelne na śniegu/bieli)
    ctx.beginPath();
    ctx.arc(bx, by, maxR, 0, Math.PI * 2);
    ctx.fillStyle = isStickActive ? 'rgba(15, 23, 42, 0.11)' : 'rgba(15, 23, 42, 0.06)';
    ctx.fill();

    // Warstwa 1 (Dark Halo): ciemny kontur pod spodem dla kontrastu na jasnym tle
    ctx.strokeStyle = isStickActive ? 'rgba(0, 0, 0, 0.36)' : 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = isStickActive ? 3.2 : 2.5;
    ctx.stroke();

    // Warstwa 2 (Light Core): jasny kontur widoczny na ciemnym tle
    ctx.strokeStyle = isStickActive ? 'rgba(255, 255, 255, 0.24)' : 'rgba(255, 255, 255, 0.11)';
    ctx.lineWidth = isStickActive ? 1.5 : 1.1;
    ctx.stroke();

    // WIZUALIZACJA ŁADOWANIA ENERGII DASHA (Striker Rocket Boots Charge)
    const isStriker = (player.currentClass?.id === 'STRIKER');
    const chargeRatio = (isStriker && player.rocketBoots) ? (player.rocketBoots.touchChargeRatio || 0) : 0;

    if (chargeRatio > 0) {
      const flameCol = (typeof getStrikerFlameColor === 'function') ? getStrikerFlameColor(player) : (player.jetpackColor || 'CYAN');
      const flamePal = (typeof getJetpackFlamePalette === 'function') ? getJetpackFlamePalette(flameCol) : { base: '#00f0ff', glow: '#00d0ff', light: '#e0ffff' };

      // 1. Plazmowe wypełnienie wnętrza bazy drążka
      const energyR = maxR * Math.min(1.0, 0.22 + 0.78 * chargeRatio);
      const energyGrad = ctx.createRadialGradient(bx, by, 3, bx, by, energyR);
      energyGrad.addColorStop(0.0, flamePal.light || '#ffffff');
      energyGrad.addColorStop(0.55, flamePal.base || '#00f0ff');
      energyGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.globalAlpha = 0.28 + 0.45 * chargeRatio;
      ctx.beginPath();
      ctx.arc(bx, by, energyR, 0, Math.PI * 2);
      ctx.fillStyle = energyGrad;
      ctx.fill();

      // 2. Neonowy promienisty łuk naładowania wokół bazy drążka (Circular Gauge)
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + Math.PI * 2 * chargeRatio;
      ctx.beginPath();
      ctx.arc(bx, by, maxR + 1.5, startAngle, endAngle);
      ctx.strokeStyle = flamePal.base || '#00f0ff';
      ctx.lineWidth = 3.5 + 2.5 * chargeRatio;
      ctx.shadowColor = flamePal.glow || '#00d0ff';
      ctx.shadowBlur = 8 + 14 * chargeRatio;
      ctx.stroke();

      // 3. Efekt pełnego naładowania (Błysk MAX CHARGE)
      if (chargeRatio >= 0.96) {
        ctx.beginPath();
        ctx.arc(bx, by, maxR + 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = flamePal.light || '#ffffff';
        ctx.lineWidth = 2.0 + Math.sin(time * 0.02) * 1.0;
        ctx.shadowColor = flamePal.light || '#ffffff';
        ctx.shadowBlur = 18;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Pozycja gałki
    const knobX = bx + (leftStick.axisX * maxR);
    const knobY = by + (leftStick.axisY * maxR);

    // Dyskretna linia wychylenia (Dual-Stroke)
    if (isStickActive && (Math.abs(leftStick.axisX) > 0.05 || Math.abs(leftStick.axisY) > 0.05)) {
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(knobX, knobY);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Gałka lewego drążka (subtelne intuicyjne podświetlenie + przydymiona krawędź)
    const knobR = 22;
    const knobGrad = ctx.createRadialGradient(knobX - 3, knobY - 3, 2, knobX, knobY, knobR);
    if (isStickActive || isJetActive) {
      knobGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.30)');
      knobGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.12)');
      knobGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.14)');
    } else {
      knobGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.11)');
      knobGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.04)');
      knobGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.10)');
    }

    ctx.beginPath();
    ctx.arc(knobX, knobY, knobR, 0, Math.PI * 2);
    ctx.fillStyle = knobGrad;
    ctx.fill();

    // Warstwa 1 obrysu gałki (Dark Halo)
    ctx.strokeStyle = isStickActive ? 'rgba(0, 0, 0, 0.42)' : 'rgba(0, 0, 0, 0.26)';
    ctx.lineWidth = isStickActive ? 3.2 : 2.5;
    ctx.stroke();

    // Warstwa 2 obrysu gałki (Light Core)
    ctx.strokeStyle = isStickActive ? 'rgba(255, 255, 255, 0.40)' : 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = isStickActive ? 1.5 : 1.1;
    if (isStickActive) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.22)';
      ctx.shadowBlur = 6;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Subtelny centralny punkt gałki z ciemną otoczką
    ctx.beginPath();
    ctx.arc(knobX, knobY, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = isStickActive ? 'rgba(0, 0, 0, 0.36)' : 'rgba(0, 0, 0, 0.22)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(knobX, knobY, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = isStickActive ? 'rgba(255, 255, 255, 0.58)' : 'rgba(255, 255, 255, 0.28)';
    ctx.fill();

    // Dodatkowa aura na gałce podczas ładowania dasha
    if (chargeRatio > 0) {
      const flameCol = (typeof getStrikerFlameColor === 'function') ? getStrikerFlameColor(player) : (player.jetpackColor || 'CYAN');
      const flamePal = (typeof getJetpackFlamePalette === 'function') ? getJetpackFlamePalette(flameCol) : { base: '#00f0ff', glow: '#00d0ff', light: '#e0ffff' };

      ctx.save();
      ctx.beginPath();
      ctx.arc(knobX, knobY, knobR + 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = flamePal.base || '#00f0ff';
      ctx.lineWidth = 2.2 + 1.5 * chargeRatio;
      ctx.shadowColor = flamePal.glow || '#00d0ff';
      ctx.shadowBlur = 8 + 10 * chargeRatio;
      ctx.stroke();

      if (chargeRatio >= 0.96) {
        ctx.beginPath();
        ctx.arc(knobX, knobY, knobR + 3.0 + Math.sin(time * 0.025) * 1.8, 0, Math.PI * 2);
        ctx.strokeStyle = flamePal.light || '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.shadowColor = flamePal.light || '#ffffff';
        ctx.shadowBlur = 14;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // -------------------------------------------------------------------------
  // 2. PRAWY DRĄŻEK: CELOWANIE, OGIEŃ, RZUT (Dual-Stroke: ciemna mikro-otoczka + jasny rdzeń)
  // -------------------------------------------------------------------------
  if (rightStick && rightStick.baseX > 0) {
    const isStickActive = rightStick.active;
    const maxR = rightStick.maxRadius || 58;
    const bx = rightStick.baseX;
    const by = rightStick.baseY;
    const isGrenadeMode = (rightStick.armedMode === 'GRENADE');

    // Baza drążka: subtelne przydymienie dla kontrastu na jasnym tle
    ctx.beginPath();
    ctx.arc(bx, by, maxR, 0, Math.PI * 2);
    ctx.fillStyle = isStickActive ? 'rgba(15, 23, 42, 0.11)' : 'rgba(15, 23, 42, 0.06)';
    ctx.fill();

    const isDragHover = rightStick.draggedSlot && (Math.hypot((rightStick.draggedSlot.curX || 0) - bx, (rightStick.draggedSlot.curY || 0) - by) < maxR + 45 || (rightStick.draggedSlot.curX || 0) >= bx - 35);

    // Warstwa 1 (Dark Halo)
    ctx.strokeStyle = (isDragHover || isStickActive) ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = (isDragHover || isStickActive) ? 3.4 : 2.5;
    ctx.stroke();

    // Warstwa 2 (Light Core)
    ctx.strokeStyle = isDragHover
      ? `rgba(255, 255, 255, ${0.40 + 0.30 * Math.sin(time * 0.01)})`
      : (isStickActive ? 'rgba(255, 255, 255, 0.26)' : 'rgba(255, 255, 255, 0.11)');
    ctx.lineWidth = (isDragHover || isStickActive) ? 1.6 : 1.1;
    ctx.stroke();

    // Pozycja gałki
    let knobX = bx;
    let knobY = by;
    if (isStickActive) {
      const dx = rightStick.curX - bx;
      const dy = rightStick.curY - by;
      const rawDist = Math.hypot(dx, dy);
      const normX = rawDist > 0.001 ? dx / rawDist : 1;
      const normY = rawDist > 0.001 ? dy / rawDist : 0;
      const clampedDist = Math.min(rawDist, maxR);
      knobX = bx + normX * clampedDist;
      knobY = by + normY * clampedDist;

      // Przerywana linia wychylenia (Dual-Stroke)
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(knobX, knobY);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Gałka prawego drążka (subtelne podświetlenie + przydymiona krawędź)
    const knobR = 22;
    const knobGrad = ctx.createRadialGradient(knobX - 3, knobY - 3, 2, knobX, knobY, knobR);
    if (isStickActive) {
      knobGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.32)');
      knobGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.13)');
      knobGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.14)');
    } else {
      knobGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.11)');
      knobGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.04)');
      knobGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0.10)');
    }

    ctx.beginPath();
    ctx.arc(knobX, knobY, knobR, 0, Math.PI * 2);
    ctx.fillStyle = knobGrad;
    ctx.fill();

    // Warstwa 1 obrysu gałki (Dark Halo)
    ctx.strokeStyle = isStickActive ? 'rgba(0, 0, 0, 0.42)' : 'rgba(0, 0, 0, 0.26)';
    ctx.lineWidth = isStickActive ? 3.2 : 2.5;
    ctx.stroke();

    // Warstwa 2 obrysu gałki (Light Core)
    ctx.strokeStyle = isStickActive ? 'rgba(255, 255, 255, 0.42)' : 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = isStickActive ? 1.5 : 1.1;
    if (isStickActive) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.25)';
      ctx.shadowBlur = 6;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Dyskretna miniaturowa sylwetka broni na gałce wskazująca co założono na ręce
    ctx.save();
    ctx.translate(knobX, knobY);
    if (isGrenadeMode) {
      ctx.scale(0.65, 0.65);
      drawWeaponSilhouette(ctx, 'GRENADE', 0, 0, isStickActive);
    } else {
      const curId = player.currentWeapon?.id || 'AK47';
      ctx.scale(0.65, 0.65);
      drawWeaponSilhouette(ctx, curId, 0, 0, isStickActive);
    }
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // 3. KIESZENIE WOKÓŁ PRAWEGO DRĄŻKA (Dual-Stroke: ciemna mikro-otoczka + jasny rdzeń)
  const effPockets = (btnCluster && (btnCluster.firearm || btnCluster.action)) ? btnCluster : (window.pockets || btnCluster || {});
  const pFirearm = effPockets.firearm || window.pockets?.firearm;
  const pThrowable = effPockets.throwable || effPockets.grenade || window.pockets?.throwable;
  const pAction = effPockets.action || effPockets.kick || effPockets.slide || window.pockets?.action;

  // 3A. KIESZEŃ NA BROŃ PALNĄ – WYŻEJ
  if (pFirearm && pFirearm.x > 0) {
    const isEquipped = (rightStick.armedMode === 'FIREARM') && !player.isHolstered;
    const isPressed = pFirearm.active;
    const curWep = player.currentWeapon || { id: 'AK47', name: 'AK-47' };
    const curId = curWep.id || 'AK47';
    const ammoObj = player.ammo?.[curId];
    const isRel = !!(ammoObj?.isReloading || player.isReloading);

    // Baza kieszeni: szkło z gradientem i subtelnym przydymieniem na krawędzi
    const grad = ctx.createRadialGradient(pFirearm.x - 2, pFirearm.y - 2, 2, pFirearm.x, pFirearm.y, pFirearm.r);
    if (isEquipped || isPressed) {
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.18)');
      grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.07)');
      grad.addColorStop(1.0, 'rgba(15, 23, 42, 0.12)');
    } else {
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.09)');
      grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.03)');
      grad.addColorStop(1.0, 'rgba(15, 23, 42, 0.09)');
    }
    ctx.beginPath();
    ctx.arc(pFirearm.x, pFirearm.y, pFirearm.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Główny pierścień zewnętrzny – Warstwa 1 (Dark Halo)
    ctx.strokeStyle = (isEquipped || isPressed) ? 'rgba(0, 0, 0, 0.42)' : 'rgba(0, 0, 0, 0.26)';
    ctx.lineWidth = (isEquipped || isPressed) ? 3.3 : 2.5;
    ctx.stroke();

    // Główny pierścień zewnętrzny – Warstwa 2 (Light Core)
    ctx.strokeStyle = (isEquipped || isPressed)
      ? 'rgba(255, 255, 255, 0.44)'
      : 'rgba(255, 255, 255, 0.20)';
    ctx.lineWidth = (isEquipped || isPressed) ? 1.6 : 1.1;
    if (isEquipped || isPressed) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.22)';
      ctx.shadowBlur = 5;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Wewnętrzny pierścień w stylu drążka (Dual-Stroke)
    ctx.beginPath();
    ctx.arc(pFirearm.x, pFirearm.y, pFirearm.r - 4, 0, Math.PI * 2);
    ctx.strokeStyle = (isEquipped || isPressed) ? 'rgba(0, 0, 0, 0.24)' : 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.strokeStyle = (isEquipped || isPressed)
      ? 'rgba(255, 255, 255, 0.18)'
      : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Pierścień postępu 1-sekundowego przytrzymania (wyzwalającego przeładowanie)
    if (isPressed && !pFirearm.isDragging && !pFirearm.reloadTriggered && !isRel) {
      const holdProg = Math.max(0, Math.min(1, (time - (pFirearm.touchStartTime || time)) / 850));
      if (holdProg > 0.05) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pFirearm.x, pFirearm.y, pFirearm.r - 1.5, -Math.PI / 2, -Math.PI / 2 + holdProg * Math.PI * 2, false);
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
        ctx.lineWidth = 2.4;
        ctx.stroke();
        ctx.restore();
      }
    } else if (isRel && ammoObj) {
      const dur = ammoObj.reloadDuration || 120;
      const prog = Math.max(0, Math.min(1, 1 - (ammoObj.reloadTimer / dur)));
      ctx.save();
      ctx.beginPath();
      ctx.arc(pFirearm.x, pFirearm.y, pFirearm.r - 1.5, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2, false);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(pFirearm.x, pFirearm.y);
    ctx.scale(0.92, 0.92);
    drawWeaponSilhouette(ctx, curId, 0, 0, isEquipped || isPressed);
    ctx.restore();
  }

  // 3B. KIESZEŃ NA BROŃ MIOTANĄ (GRANAT) – PO ŚRODKU
  if (pThrowable && pThrowable.x > 0) {
    const isEquipped = (rightStick.armedMode === 'GRENADE');
    const isPressed = pThrowable.active;
    const cd = player.grenadeCooldown || 0;
    const maxCd = player.grenadeMaxCooldown || 3.5;
    const isReady = (cd <= 0);

    const grad = ctx.createRadialGradient(pThrowable.x - 2, pThrowable.y - 2, 2, pThrowable.x, pThrowable.y, pThrowable.r);
    if (isEquipped || isPressed) {
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.18)');
      grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.07)');
      grad.addColorStop(1.0, 'rgba(15, 23, 42, 0.12)');
    } else {
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.09)');
      grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.03)');
      grad.addColorStop(1.0, 'rgba(15, 23, 42, 0.09)');
    }
    ctx.beginPath();
    ctx.arc(pThrowable.x, pThrowable.y, pThrowable.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Warstwa 1 (Dark Halo)
    ctx.strokeStyle = (isEquipped || isPressed) ? 'rgba(0, 0, 0, 0.42)' : 'rgba(0, 0, 0, 0.26)';
    ctx.lineWidth = (isEquipped || isPressed) ? 3.3 : 2.5;
    ctx.stroke();

    // Warstwa 2 (Light Core)
    ctx.strokeStyle = (isEquipped || isPressed)
      ? 'rgba(255, 255, 255, 0.44)'
      : 'rgba(255, 255, 255, 0.20)';
    ctx.lineWidth = (isEquipped || isPressed) ? 1.6 : 1.1;
    if (isEquipped || isPressed) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.22)';
      ctx.shadowBlur = 5;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Wewnętrzny pierścień w stylu drążka (Dual-Stroke)
    ctx.beginPath();
    ctx.arc(pThrowable.x, pThrowable.y, pThrowable.r - 4, 0, Math.PI * 2);
    ctx.strokeStyle = (isEquipped || isPressed) ? 'rgba(0, 0, 0, 0.24)' : 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.strokeStyle = (isEquipped || isPressed)
      ? 'rgba(255, 255, 255, 0.18)'
      : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    if (!isReady && maxCd > 0) {
      const prog = Math.max(0, Math.min(1, cd / maxCd));
      ctx.save();
      ctx.beginPath();
      ctx.arc(pThrowable.x, pThrowable.y, pThrowable.r - 1.5, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2, false);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 3.4;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(pThrowable.x, pThrowable.y - (isReady ? 2 : 3));
    ctx.scale(0.85, 0.85);
    drawWeaponSilhouette(ctx, 'GRENADE', 0, 0, isReady && (isEquipped || isPressed));
    ctx.restore();

    if (!isReady) {
      ctx.save();
      ctx.font = 'bold 8px monospace';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowBlur = 2.5;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${cd.toFixed(1)}s`, pThrowable.x, pThrowable.y + pThrowable.r - 2);
      ctx.restore();
    }
  }

  // 3C. ZUNIFIKOWANY 1 PRZYCISK RUCHU / AKCJI (WŚLIZG / LEŻENIE / KOPNIAK) – NAJNIŻEJ
  if (pAction && pAction.x > 0) {
    const isPressed = pAction.active;
    const mode = pAction.currentMode || 'KICK';

    const grad = ctx.createRadialGradient(pAction.x - 2, pAction.y - 2, 2, pAction.x, pAction.y, pAction.r);
    if (isPressed) {
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.20)');
      grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.08)');
      grad.addColorStop(1.0, 'rgba(15, 23, 42, 0.12)');
    } else {
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.09)');
      grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.03)');
      grad.addColorStop(1.0, 'rgba(15, 23, 42, 0.09)');
    }
    ctx.beginPath();
    ctx.arc(pAction.x, pAction.y, pAction.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Warstwa 1 (Dark Halo)
    ctx.strokeStyle = isPressed ? 'rgba(0, 0, 0, 0.42)' : 'rgba(0, 0, 0, 0.26)';
    ctx.lineWidth = isPressed ? 3.3 : 2.5;
    ctx.stroke();

    // Warstwa 2 (Light Core)
    ctx.strokeStyle = isPressed ? 'rgba(255, 255, 255, 0.44)' : 'rgba(255, 255, 255, 0.20)';
    ctx.lineWidth = isPressed ? 1.6 : 1.1;
    if (isPressed) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.22)';
      ctx.shadowBlur = 5;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Wewnętrzny pierścień (Dual-Stroke)
    ctx.beginPath();
    ctx.arc(pAction.x, pAction.y, pAction.r - 4, 0, Math.PI * 2);
    ctx.strokeStyle = isPressed ? 'rgba(0, 0, 0, 0.24)' : 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.strokeStyle = isPressed ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    drawDynamicActionSymbol(ctx, mode, pAction.x, pAction.y, isPressed, player);
  }

  // -------------------------------------------------------------------------
  // 4. EFEKT PRZECIĄGANIA IKONY NA DRĄŻEK (DRAG & DROP "ZAŁÓŻ BROŃ NA RĘCE")
  // -------------------------------------------------------------------------
  if (rightStick.draggedSlot) {
    if (!pFirearm?.isDragging && !pThrowable?.isDragging) {
      rightStick.draggedSlot = null;
    } else {
      const ds = rightStick.draggedSlot;
      const cx = ds.curX || 0;
      const cy = ds.curY || 0;
      const sx = ds.startX || cx;
      const sy = ds.startY || cy;

      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo((sx + cx) / 2, (sy + cy) / 2 - 10, cx, cy);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 3.0;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 3.4;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.45)';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(0.9, 0.9);
      if (ds.type === 'GRENADE') {
        drawWeaponSilhouette(ctx, 'GRENADE', 0, 0, true);
      } else {
        const curId = player.currentWeapon?.id || 'AK47';
        drawWeaponSilhouette(ctx, curId, 0, 0, true);
      }
      ctx.restore();
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * Paski zdrowia i paliwa są renderowane bezpośrednio nad głową każdej postaci w js/player/renderer.js
 */
export function drawEntityHealthBar(ctx, entity, yOffset = 0) {
  // Zastąpione przez minimalistyczne paski HP i JET nad głową w drawPlayer
}

export function drawOffscreenBallIndicator(ctx, ball, camera, player) {
  if (!ball || !camera) return;

  const screenX = (ball.x - camera.x) * camera.zoom;
  const screenY = (ball.y - camera.y) * camera.zoom;

  const margin = 35;
  const minX = margin;
  const maxX = W - margin;
  const minY = margin;
  const maxY = H - margin;

  const isOffscreen = (screenX < minX || screenX > maxX || screenY < minY || screenY > maxY);
  if (!isOffscreen) return;

  const cx = W / 2;
  const cy = H / 2;
  const dx = screenX - cx;
  const dy = screenY - cy;
  if (dx === 0 && dy === 0) return;

  const angle = Math.atan2(dy, dx);
  let t = Infinity;

  if (dx > 0) {
    const tCandidate = (maxX - cx) / dx;
    if (tCandidate > 0 && tCandidate < t) t = tCandidate;
  } else if (dx < 0) {
    const tCandidate = (minX - cx) / dx;
    if (tCandidate > 0 && tCandidate < t) t = tCandidate;
  }

  if (dy > 0) {
    const tCandidate = (maxY - cy) / dy;
    if (tCandidate > 0 && tCandidate < t) t = tCandidate;
  } else if (dy < 0) {
    const tCandidate = (minY - cy) / dy;
    if (tCandidate > 0 && tCandidate < t) t = tCandidate;
  }

  const ix = Math.max(minX, Math.min(maxX, cx + dx * t));
  const iy = Math.max(minY, Math.min(maxY, cy + dy * t));

  ctx.save();
  ctx.translate(ix, iy);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-10, -9);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-10, 9);
  ctx.closePath();
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 0;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.restore();

  const pX = player ? (player.x + player.w / 2) : camera.x;
  const pY = player ? (player.y + player.h / 2) : camera.y;
  const distMeters = Math.round(Math.hypot(ball.x - pX, ball.y - pY) / 14);

  ctx.save();
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = '#facc15';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 0;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textDist = 24;
  const textX = ix - Math.cos(angle) * textDist;
  const textY = iy - Math.sin(angle) * textDist;
  ctx.fillText(`${distMeters}m`, textX, textY);
  ctx.restore();
}


/**
 * Rysuje sylwetkę broni w slocie HUD.
 */
export function drawWeaponSilhouette(ctx, type, cx, cy, isSelected, customColor = null) {
  ctx.save();
  ctx.translate(cx, cy);

  if (customColor) {
    ctx.fillStyle = customColor;
    ctx.shadowColor = customColor;
    ctx.shadowBlur = 4;
  } else if (isSelected) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.76)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.62)';
    ctx.shadowBlur = 2.8;
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.48)';
    ctx.shadowBlur = 2.5;
  }

  if (type === 'AK47') {
    // Kolba
    ctx.fillRect(-13, -1, 5, 2.5);
    // Komora i łoże
    ctx.fillRect(-8, -2, 12, 3.5);
    // Magazynek łukowy
    ctx.beginPath();
    ctx.moveTo(-4, 1.5);
    ctx.lineTo(-2, 5.5);
    ctx.lineTo(0.5, 5.5);
    ctx.lineTo(-1, 1.5);
    ctx.closePath();
    ctx.fill();
    // Lufa
    ctx.fillRect(4, -1, 8, 1.8);
  } else if (type === 'SHOTGUN') {
    // Kolba
    ctx.fillRect(-12, -1, 6, 3);
    // Komora zamkowa
    ctx.fillRect(-6, -2, 10, 4);
    // Długa lufa i podlufowy magazynek
    ctx.fillRect(4, -2, 9, 2.5);
    ctx.fillRect(4, 0.8, 7, 1.8);
  } else if (type === 'SNIPER') {
    // Kolba snajperska i baka
    ctx.fillRect(-13, -1, 6, 2.5);
    ctx.fillRect(-12, -2.5, 4, 1.5);
    // Komora zamkowa i magazynek pudełkowy
    ctx.fillRect(-7, -2.5, 10, 4);
    ctx.fillRect(-2, 1.5, 3.5, 4.2);
    // Luneta celownicza optyczna
    ctx.fillRect(-4, -5.2, 9, 1.8);
    ctx.fillRect(-5, -6.0, 2.2, 3.0);
    ctx.fillRect(4, -6.0, 2.5, 3.2);
    // Długa stalowa lufa ryflowana
    ctx.fillRect(3, -1.2, 11, 1.8);
    // Masywny hamulec wylotowy
    ctx.fillRect(14, -2.2, 3, 3.8);
  } else if (type === 'GRENADE') {
    // Korpus granatu odłamkowego
    ctx.beginPath();
    ctx.ellipse(0, 1.2, 5.0, 6.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Żebrowanie odłamkowe (siatka segmentów)
    ctx.strokeStyle = isSelected ? 'rgba(0, 0, 0, 0.45)' : 'rgba(15, 23, 42, 0.6)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-4.8, 1.2); ctx.lineTo(4.8, 1.2);
    ctx.moveTo(-4.0, -1.8); ctx.lineTo(4.0, -1.8);
    ctx.moveTo(-4.0, 4.2); ctx.lineTo(4.0, 4.2);
    ctx.moveTo(0, -5.2); ctx.lineTo(0, 7.6);
    ctx.stroke();

    // Szyjka zapalnika i łyżka (safety lever)
    ctx.fillStyle = isSelected ? '#fed7aa' : '#94a3b8';
    ctx.fillRect(-2, -6.5, 4, 2.2);
    ctx.fillRect(1.5, -6.5, 2, 7.0);

    // Zawleczka z kółkiem (pull ring)
    ctx.strokeStyle = isSelected ? '#ffffff' : '#cbd5e1';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(-3.5, -5.8, 1.8, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Rysuje pojedynczy, minimalistyczny kwadratowy kafelek broni w interfejsie HUD.
 */
export function drawWeaponSlot(ctx, btn, isSelected, player, isMobile = false) {
  // Specjalna obsługa slotu granatu taktycznego
  if (btn.id === 'GRENADE') {
    const cd = player.grenadeCooldown || 0;
    const maxCd = player.grenadeMaxCooldown || 3.5;
    const isReady = (cd <= 0);

    const tileSize = btn.w;
    const tileX = btn.x;
    const tileY = btn.y;

    ctx.save();
    ctx.globalAlpha = isMobile ? 0.85 : 0.90;

    // 1. Tło kafelka (Dark Glass)
    const radius = isMobile ? 5 : 6;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(tileX, tileY, tileSize, tileSize, radius);
    else ctx.rect(tileX, tileY, tileSize, tileSize);

    ctx.fillStyle = isReady
      ? 'rgba(30, 41, 59, 0.85)'
      : 'rgba(15, 23, 42, 0.80)';
    ctx.fill();

    // 2. Obrys kafelka i delikatny błysk gotowości
    let borderCol = isReady ? '#f97316' : 'rgba(100, 116, 139, 0.35)';
    if (isReady) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.006);
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = borderCol;
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 1.0;
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 3. Ikonka / sylwetka granatu (wyszarzona gdy cd > 0, pełna jasność gdy cd === 0)
    ctx.save();
    ctx.translate(tileX + tileSize / 2, tileY + tileSize / 2 - 3);
    ctx.scale(0.85, 0.85);
    if (!isReady) {
      ctx.globalAlpha = 0.30;
    }
    drawWeaponSilhouette(ctx, 'GRENADE', 0, 0, isReady);
    ctx.restore();

    // 4. Radialny overlay ładowania jeśli trwa cooldown
    if (!isReady && maxCd > 0) {
      const progress = Math.max(0, Math.min(1, cd / maxCd));
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(tileX + tileSize / 2, tileY + tileSize / 2 - 3);
      ctx.arc(tileX + tileSize / 2, tileY + tileSize / 2 - 3, tileSize * 0.40, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2, false);
      ctx.closePath();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fill();
      ctx.restore();
    }

    // 5. Wskaźnik cooldownu / statusu na dole kafelka
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const ammoY = tileY + tileSize - 2;

    if (!isReady) {
      ctx.font = 'bold 7.5px monospace';
      ctx.fillStyle = '#fb923c';
      ctx.fillText(`${cd.toFixed(1)}s`, tileX + tileSize / 2, ammoY);
    } else {
      ctx.font = 'bold 7.5px monospace';
      ctx.fillStyle = '#4ade80';
      ctx.fillText(isMobile ? 'READY' : '[G]', tileX + tileSize / 2, ammoY);
    }

    ctx.restore();
    return;
  }

  const isActive = isSelected;
  const accentCol = btn.id === 'SHOTGUN' ? '#fb923c' : (btn.id === 'SNIPER' ? '#38bdf8' : '#f59e0b');

  // Pobranie stanu amunicji z obiektu gracza
  const ammoObj = player.ammo?.[btn.id];
  const defMag = (btn.id === 'SHOTGUN' ? 8 : (btn.id === 'SNIPER' ? 5 : 30));
  const defRes = (btn.id === 'SHOTGUN' ? 64 : (btn.id === 'SNIPER' ? 25 : 90));
  const bCurrentAmmo = ammoObj ? ammoObj.currentAmmo : defMag;
  const bReserveAmmo = ammoObj ? ammoObj.reserveAmmo : defRes;
  const bMagSize = ammoObj ? (ammoObj.magSize || defMag) : defMag;
  const bIsReloading = !!ammoObj?.isReloading;
  const bIsNoAmmo = (bCurrentAmmo === 0 && bReserveAmmo === 0);
  const bIsLowAmmo = (!bIsNoAmmo && bCurrentAmmo <= Math.ceil(bMagSize * 0.25));

  const tileSize = btn.w;
  const tileX = btn.x;
  const tileY = btn.y;

  ctx.save();
  ctx.globalAlpha = isMobile ? 0.80 : 0.85;

  // 1. Tło kwadratowego kafelka (Dark Glass)
  const radius = isMobile ? 5 : 6;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(tileX, tileY, tileSize, tileSize, radius);
  } else {
    ctx.rect(tileX, tileY, tileSize, tileSize);
  }
  ctx.fillStyle = isActive
    ? 'rgba(30, 41, 59, 0.85)'
    : 'rgba(15, 23, 42, 0.80)';
  ctx.fill();

  // 2. Obrys ramki (akcent dla aktywnej, przygaszony szary dla nieaktywnej)
  let borderCol = isActive ? accentCol : 'rgba(148, 163, 184, 0.40)';
  if (isActive && bIsNoAmmo) borderCol = '#ef4444';
  else if (isActive && bIsLowAmmo) borderCol = '#f97316';

  ctx.strokeStyle = borderCol;
  ctx.lineWidth = isActive ? 1.6 : 1.0;
  if (isActive) {
    ctx.shadowColor = borderCol;
    ctx.shadowBlur = 0;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 3. Pasek postępu przeładowania na dolnej krawędzi kafelka
  if (bIsReloading && ammoObj) {
    const dur = ammoObj.reloadDuration || 120;
    const prog = Math.max(0, Math.min(1, 1 - (ammoObj.reloadTimer / dur)));
    ctx.save();
    ctx.fillStyle = accentCol;
    ctx.shadowColor = accentCol;
    ctx.shadowBlur = 0;
    ctx.fillRect(tileX + 3, tileY + tileSize - 3, (tileSize - 6) * prog, 2);
    ctx.restore();
  }

  // 4. Ikonka / sylwetka broni w centrum kafelka
  const iconScale = 0.85;
  ctx.save();
  ctx.translate(tileX + tileSize / 2, tileY + tileSize / 2 - 2);
  ctx.scale(iconScale, iconScale);
  drawWeaponSilhouette(ctx, btn.id, 0, 0, isActive);
  ctx.restore();

  // 5. Mały, dyskretny licznik amunicji na dolnej krawędzi kafelka
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const ammoY = tileY + tileSize - 2;

  if (bIsReloading) {
    ctx.font = 'bold 7.5px monospace';
    ctx.fillStyle = accentCol;
    ctx.fillText('RELOAD', tileX + tileSize / 2, ammoY);
  } else if (bIsNoAmmo) {
    ctx.font = 'bold 7.5px monospace';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('EMPTY', tileX + tileSize / 2, ammoY);
  } else {
    ctx.font = 'bold 7.5px monospace';
    ctx.fillStyle = isActive ? '#f8fafc' : '#94a3b8';
    ctx.fillText(`${bCurrentAmmo}/${bReserveAmmo}`, tileX + tileSize / 2, ammoY);
  }

  ctx.restore();
}

/**
 * Renderuje pojedynczą, zunifikowaną ikonę broni na ekranie dotykowym (dolny środek ekranu).
 * Dotknięcie kafelka natychmiast przełącza broń pomiędzy AK-47 a Shotgunem.
 */
export function drawSingleMobileWeaponIcon(ctx, x, y, size, player) {
  const curWep = player.currentWeapon || { id: 'AK47', name: 'AK-47' };
  const curWepId = curWep.id || 'AK47';
  const isShotgun = (curWepId === 'SHOTGUN');
  const isSniper = (curWepId === 'SNIPER');
  const accentCol = isShotgun ? '#fb923c' : (isSniper ? '#38bdf8' : '#f59e0b');

  const ammoObj = player.ammo?.[curWepId];
  const defMag = isShotgun ? 8 : (isSniper ? 5 : 30);
  const defRes = isShotgun ? 64 : (isSniper ? 25 : 90);
  const currentAmmo = ammoObj ? ammoObj.currentAmmo : defMag;
  const reserveAmmo = ammoObj ? ammoObj.reserveAmmo : defRes;
  const isReloading = !!ammoObj?.isReloading;
  const isNoAmmo = (currentAmmo === 0 && reserveAmmo === 0);
  const isLowAmmo = (!isNoAmmo && currentAmmo <= Math.ceil(defMag * 0.25));

  ctx.save();
  ctx.globalAlpha = 0.92;

  // 1. Tło Dark Glass ze stylowym zaokrągleniem
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, size, size, 10);
  } else {
    ctx.rect(x, y, size, size);
  }
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fill();

  // 2. Poświata i ramka kafelka
  let borderCol = isNoAmmo ? '#ef4444' : (isLowAmmo ? '#f97316' : accentCol);
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 2.0;
  ctx.shadowColor = borderCol;
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 3. Pasek przeładowania
  if (isReloading && ammoObj) {
    const dur = ammoObj.reloadDuration || 120;
    const prog = Math.max(0, Math.min(1, 1 - (ammoObj.reloadTimer / dur)));
    ctx.fillStyle = accentCol;
    ctx.shadowColor = accentCol;
    ctx.shadowBlur = 0;
    ctx.fillRect(x + 4, y + size - 4, (size - 8) * prog, 2.5);
    ctx.shadowBlur = 0;
  }

  // 4. Sylwetka broni w centrum
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2 - 4);
  ctx.scale(1.05, 1.05);
  drawWeaponSilhouette(ctx, curWepId, 0, 0, true);
  ctx.restore();

  // 5. Wskaźnik przełączania broni w prawym górnym rogu
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.70)';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('⇄', x + size - 5, y + 11);
  ctx.restore();

  // 6. Licznik amunicji na dole kafelka
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const ammoY = y + size - 3;
  ctx.font = 'bold 9px monospace';
  if (isReloading) {
    ctx.fillStyle = accentCol;
    ctx.fillText('RELOAD', x + size / 2, ammoY);
  } else if (isNoAmmo) {
    ctx.fillStyle = '#ef4444';
    ctx.fillText('EMPTY', x + size / 2, ammoY);
  } else {
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`${currentAmmo}/${reserveAmmo}`, x + size / 2, ammoY);
  }
  ctx.restore();

  ctx.restore();
}

export function drawHUD(ctx, player, leftStick, btnCluster, rightStick, ball, inKickRange = null, arenaInfo = null) {
  updateFps();

  ctx.save();

  // Wykrywanie urządzeń mobilnych / małych ekranów
  const isMobile = (typeof window !== 'undefined' && (window.innerWidth < 768 || isTouchDevice || ('ontouchstart' in window) || (navigator && navigator.maxTouchPoints > 0)));

  // =========================================================================
  // 1. STATYSTYKI GRY W LEWYM GÓRNYM ROGU (PASEK HP, WYBRANA BROŃ + AMUNICJA, KLASA / FPS)
  // =========================================================================
  ctx.save();

  const hudX = isMobile ? 12 : 20;
  const hudY = isMobile ? 14 : 18;
  const barW = isMobile ? 172 : 220;
  const barH = isMobile ? 16 : 18;
  const wepBoxH = isMobile ? 32 : 36;

  // Proximity Auto-Fade: automatyczne przenikanie HUD-u, gdy postać, wróg lub piłka zbliża się do lewego górnego rogu
  const hudRight = hudX + barW + 10;
  const hudBottom = hudY + barH + (player.hasVest ? 18 : 0) + 5 + wepBoxH + (isMobile ? 32 : 38);
  const fadeMargin = isMobile ? 55 : 70;

  let minHudDist = Infinity;
  const camZoom = (camera && camera.zoom) ? camera.zoom : 1;
  const camX = camera ? camera.x : 0;
  const camY = camera ? camera.y : 0;

  const checkEntityHudDist = (ent, padX = 14, padTop = 26, padBottom = 8) => {
    if (!ent) return;
    const ew = ent.w || (ent.r ? ent.r * 2 : 24);
    const eh = ent.h || (ent.r ? ent.r * 2 : 70);
    const ex = (ent.r !== undefined && ent.w === undefined) ? (ent.x - ent.r) : ent.x;
    const ey = (ent.r !== undefined && ent.h === undefined) ? (ent.y - ent.r) : ent.y;

    const sLeft = (ex - padX - camX) * camZoom;
    const sRight = (ex + ew + padX - camX) * camZoom;
    const sTop = (ey - padTop - camY) * camZoom;
    const sBottom = (ey + eh + padBottom - camY) * camZoom;

    if (sRight < 0 || sBottom < 0) return;

    const dx = Math.max(0, sLeft - hudRight);
    const dy = Math.max(0, sTop - hudBottom);
    const d = Math.hypot(dx, dy);
    if (d < minHudDist) minHudDist = d;
  };

  checkEntityHudDist(player, 16, 28, 10);
  if (arenaInfo?.bot && arenaInfo.bot.active && !arenaInfo.bot.isDead) {
    checkEntityHudDist(arenaInfo.bot, 14, 26, 8);
  }
  if (arenaInfo?.remotePlayer && arenaInfo.remotePlayer.active && !arenaInfo.remotePlayer.isDead) {
    checkEntityHudDist(arenaInfo.remotePlayer, 14, 26, 8);
  }
  if (ball && ball.active) {
    checkEntityHudDist(ball, 10, 10, 10);
  }

  const minHudAlpha = 0.22;
  let targetHudAlpha = 1.0;
  if (minHudDist <= 0) {
    targetHudAlpha = minHudAlpha;
  } else if (minHudDist < fadeMargin) {
    const t = minHudDist / fadeMargin;
    const smoothT = t * t * (3 - 2 * t);
    targetHudAlpha = minHudAlpha + (1.0 - minHudAlpha) * smoothT;
  }

  if (typeof player._topLeftHudAlpha !== 'number' || isNaN(player._topLeftHudAlpha)) {
    player._topLeftHudAlpha = targetHudAlpha;
  } else {
    player._topLeftHudAlpha += (targetHudAlpha - player._topLeftHudAlpha) * 0.20;
  }

  ctx.globalAlpha = Math.max(minHudAlpha, Math.min(1.0, player._topLeftHudAlpha));

  const maxHp = player.maxHp || 100;
  const curHp = Math.max(0, player.hp ?? 100);
  const hpRatio = Math.max(0, Math.min(1, curHp / maxHp));

  // Płynnie opróżniający się ślad otrzymanych obrażeń (damage trail)
  if (typeof player._hudTrailHp !== 'number' || isNaN(player._hudTrailHp) || player._hudTrailHp < curHp) {
    player._hudTrailHp = curHp;
  } else if (player._hudTrailHp > curHp) {
    player._hudTrailHp = Math.max(curHp, player._hudTrailHp - Math.max(0.35, (player._hudTrailHp - curHp) * 0.08));
  }
  const trailRatio = Math.max(hpRatio, Math.min(1, player._hudTrailHp / maxHp));

  let hpBorderCol = '#22c55e';
  if (hpRatio <= 0.25) hpBorderCol = '#ef4444';
  else if (hpRatio <= 0.55) hpBorderCol = '#facc15';

  const hasVest = !!(player.hasVest && (player.vestHp || 0) > 0);
  const vestHp = Math.max(0, player.vestHp || 0);
  const vestMaxHp = player.vestMaxHp || 60;
  const vestRatio = Math.max(0, Math.min(1.0, vestHp / vestMaxHp));

  const hasHelmet = !!(player.hasHelmet || player.visuals?.hasHelmet);
  const vestH = hasVest ? (isMobile ? 12 : 14) : (hasHelmet ? (isMobile ? 11 : 13) : 0);
  const vestGap = (hasVest || hasHelmet) ? 3 : 0;

  const vestY = hudY;
  const hpY = hudY + vestH + vestGap;

  // --- A0. PASEK PANCERZA KAMIZELKI I OCHRONY GŁOWY (HEŁM) ---
  if (hasVest) {
    ctx.beginPath();
    ctx.fillStyle = 'rgba(6, 9, 17, 0.94)';
    if (ctx.roundRect) ctx.roundRect(hudX, vestY, barW, vestH, 3.5);
    else ctx.rect(hudX, vestY, barW, vestH);
    ctx.fill();

    if (vestRatio > 0) {
      const vFillW = Math.max(2, (barW - 3) * vestRatio);
      const vestGrad = ctx.createLinearGradient(hudX + 1.5, vestY + 1.5, hudX + 1.5 + vFillW, vestY + 1.5);
      vestGrad.addColorStop(0.0, '#0284c7');
      vestGrad.addColorStop(0.5, '#0ea5e9');
      vestGrad.addColorStop(1.0, '#38bdf8');

      ctx.beginPath();
      ctx.fillStyle = vestGrad;
      if (ctx.roundRect) ctx.roundRect(hudX + 1.5, vestY + 1.5, vFillW, vestH - 3, 2);
      else ctx.rect(hudX + 1.5, vestY + 1.5, vFillW, vestH - 3);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.2;
    if (ctx.roundRect) ctx.roundRect(hudX, vestY, barW, vestH, 3.5);
    else ctx.rect(hudX, vestY, barW, vestH);
    ctx.stroke();

    ctx.save();
    ctx.font = isMobile ? 'bold 8.5px monospace' : 'bold 9.5px monospace';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.98)';
    ctx.shadowBlur = 3;
    ctx.fillStyle = '#e0f2fe';
    ctx.textBaseline = 'middle';

    ctx.textAlign = 'left';
    ctx.fillText('PANCERZ (TORS)', hudX + 5, vestY + vestH / 2 + 0.5);

    ctx.textAlign = 'right';
    const helmBadge = hasHelmet ? '[HEŁM] ' : '';
    ctx.fillText(`${helmBadge}${Math.round(vestHp)} / ${vestMaxHp}`, hudX + barW - 5, vestY + vestH / 2 + 0.5);
    ctx.restore();
  } else if (hasHelmet) {
    ctx.beginPath();
    ctx.fillStyle = 'rgba(6, 9, 17, 0.94)';
    if (ctx.roundRect) ctx.roundRect(hudX, vestY, barW, vestH, 3.5);
    else ctx.rect(hudX, vestY, barW, vestH);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.2;
    if (ctx.roundRect) ctx.roundRect(hudX, vestY, barW, vestH, 3.5);
    else ctx.rect(hudX, vestY, barW, vestH);
    ctx.stroke();

    ctx.save();
    ctx.font = isMobile ? 'bold 8.5px monospace' : 'bold 9.5px monospace';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.98)';
    ctx.shadowBlur = 3;
    ctx.fillStyle = '#22d3ee';
    ctx.textBaseline = 'middle';

    ctx.textAlign = 'left';
    ctx.fillText('HEŁM BALISTYCZNY', hudX + 5, vestY + vestH / 2 + 0.5);

    ctx.textAlign = 'right';
    ctx.fillText('OCHRONA GŁOWY', hudX + barW - 5, vestY + vestH / 2 + 0.5);
    ctx.restore();
  }

  // --- A. PASEK ZDROWIA (HP) ---
  // Ciemne, głębokie tło pustej części paska (wyraźny kontrast po utracie HP)
  ctx.beginPath();
  ctx.fillStyle = 'rgba(6, 9, 17, 0.94)';
  if (ctx.roundRect) ctx.roundRect(hudX, hpY, barW, barH, 4);
  else ctx.rect(hudX, hpY, barW, barH);
  ctx.fill();

  const innerX = hudX + 1.5;
  const innerY = hpY + 1.5;
  const innerW = barW - 3;
  const innerH = barH - 3;

  // Ślad świeżo utraconego zdrowia (czerwono-koralowy pasek spływający w dół)
  if (trailRatio > hpRatio + 0.005) {
    const trailW = Math.max(2, innerW * trailRatio);
    ctx.beginPath();
    ctx.fillStyle = '#fb7185';
    if (ctx.roundRect) ctx.roundRect(innerX, innerY, trailW, innerH, 2.5);
    else ctx.rect(innerX, innerY, trailW, innerH);
    ctx.fill();
  }

  // Właściwe wypełnienie aktualnego HP w żywych kolorach
  if (hpRatio > 0) {
    const fillW = Math.max(2, innerW * hpRatio);
    const hpGrad = ctx.createLinearGradient(innerX, innerY, innerX + fillW, innerY);
    if (hpRatio > 0.55) {
      hpGrad.addColorStop(0.0, '#10b981');
      hpGrad.addColorStop(0.5, '#22c55e');
      hpGrad.addColorStop(1.0, '#4ade80');
    } else if (hpRatio > 0.25) {
      hpGrad.addColorStop(0.0, '#d97706');
      hpGrad.addColorStop(0.5, '#f59e0b');
      hpGrad.addColorStop(1.0, '#fde047');
    } else {
      hpGrad.addColorStop(0.0, '#dc2626');
      hpGrad.addColorStop(0.5, '#ef4444');
      hpGrad.addColorStop(1.0, '#fb7185');
    }

    ctx.save();
    if (hpRatio <= 0.25) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.015);
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8 * pulse;
    }

    ctx.beginPath();
    ctx.fillStyle = hpGrad;
    if (ctx.roundRect) ctx.roundRect(innerX, innerY, fillW, innerH, 2.5);
    else ctx.rect(innerX, innerY, fillW, innerH);
    ctx.fill();
    ctx.restore();

    // Połysk na górnej krawędzi paska HP dla żywego efektu
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.26)';
    ctx.rect(innerX, innerY, fillW, innerH * 0.42);
    ctx.fill();
  }

  // Podziałki segmentowe co 25% szerokości paska HP
  ctx.save();
  ctx.strokeStyle = 'rgba(6, 9, 17, 0.45)';
  ctx.lineWidth = 1;
  for (let seg = 1; seg <= 3; seg++) {
    const sx = hudX + (barW * seg) / 4;
    ctx.beginPath();
    ctx.moveTo(sx, hpY + 1);
    ctx.lineTo(sx, hpY + barH - 1);
    ctx.stroke();
  }
  ctx.restore();

  // Wyraźna kolorowa ramka paska HP
  ctx.beginPath();
  ctx.strokeStyle = hpBorderCol;
  ctx.lineWidth = 1.4;
  if (ctx.roundRect) ctx.roundRect(hudX, hpY, barW, barH, 4);
  else ctx.rect(hudX, hpY, barW, barH);
  ctx.stroke();

  // Etykieta tekstu wewnątrz paska HP
  ctx.save();
  ctx.font = isMobile ? 'bold 10px monospace' : 'bold 11px monospace';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.98)';
  ctx.shadowBlur = 4;
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';

  ctx.textAlign = 'left';
  ctx.fillText('HP', hudX + 6, hpY + barH / 2 + 0.5);

  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(curHp)} / ${maxHp}`, hudX + barW - 6, hpY + barH / 2 + 0.5);
  ctx.restore();

  // --- B. WYBRANA BROŃ Z LICZBĄ AMUNICJI (POD PASEK HP) ---
  const curWep = player.currentWeapon || { id: 'AK47', name: 'AK-47' };
  const curWepId = curWep.id || 'AK47';
  const wepName = curWep.fullName || curWep.name || (curWepId === 'SHOTGUN' ? 'SHOTGUN' : (curWepId === 'SNIPER' ? 'BARRETT .50' : 'AK-47'));

  const wepAccent = curWepId === 'SHOTGUN'
    ? '#fb923c'
    : (curWepId === 'SNIPER' ? '#38bdf8' : (curWepId === 'GRENADE' ? '#4ade80' : '#f59e0b'));

  const curAmmoObj = player.ammo?.[curWepId];
  const defM = curWepId === 'SHOTGUN' ? 8 : (curWepId === 'SNIPER' ? 5 : (curWepId === 'GRENADE' ? 1 : 30));
  const defR = curWepId === 'SHOTGUN' ? 64 : (curWepId === 'SNIPER' ? 25 : (curWepId === 'GRENADE' ? 0 : 90));
  const cAmmo = curAmmoObj ? curAmmoObj.currentAmmo : defM;
  const rAmmo = curAmmoObj ? curAmmoObj.reserveAmmo : defR;
  const isRel = curAmmoObj ? curAmmoObj.isReloading : !!player.isReloading;
  const isNoAmmo = (cAmmo === 0 && rAmmo === 0);
  const isLow = (!isNoAmmo && cAmmo <= Math.ceil(defM * 0.25));

  const wepBoxY = hpY + barH + 5;
  const wepBoxW = barW;

  let cardBorderCol = wepAccent;
  if (isNoAmmo) cardBorderCol = '#ef4444';
  else if (isLow) cardBorderCol = '#f97316';
  else if (isRel) cardBorderCol = '#facc15';

  // Tło kafelka broni z wyraźnym kontrastem i kolorowym gradientem akcentu
  const cardGrad = ctx.createLinearGradient(hudX, wepBoxY, hudX + wepBoxW, wepBoxY);
  if (curWepId === 'SHOTGUN') {
    cardGrad.addColorStop(0.0, 'rgba(67, 20, 7, 0.94)');
    cardGrad.addColorStop(0.55, 'rgba(15, 23, 42, 0.94)');
    cardGrad.addColorStop(1.0, 'rgba(9, 13, 22, 0.95)');
  } else if (curWepId === 'SNIPER') {
    cardGrad.addColorStop(0.0, 'rgba(8, 47, 73, 0.94)');
    cardGrad.addColorStop(0.55, 'rgba(15, 23, 42, 0.94)');
    cardGrad.addColorStop(1.0, 'rgba(9, 13, 22, 0.95)');
  } else {
    cardGrad.addColorStop(0.0, 'rgba(69, 26, 3, 0.94)');
    cardGrad.addColorStop(0.55, 'rgba(15, 23, 42, 0.94)');
    cardGrad.addColorStop(1.0, 'rgba(9, 13, 22, 0.95)');
  }

  ctx.beginPath();
  ctx.fillStyle = cardGrad;
  if (ctx.roundRect) ctx.roundRect(hudX, wepBoxY, wepBoxW, wepBoxH, 4);
  else ctx.rect(hudX, wepBoxY, wepBoxW, wepBoxH);
  ctx.fill();

  // Boczny kolorowy pasek akcentu broni po lewej stronie kafelka
  ctx.beginPath();
  ctx.fillStyle = cardBorderCol;
  if (ctx.roundRect) ctx.roundRect(hudX + 1, wepBoxY + 1, 4, wepBoxH - 2, [3, 0, 0, 3]);
  else ctx.rect(hudX + 1, wepBoxY + 1, 4, wepBoxH - 2);
  ctx.fill();

  // Wyraźny kolorowy obrys kafelka broni
  ctx.beginPath();
  ctx.strokeStyle = cardBorderCol;
  ctx.lineWidth = 1.4;
  if (ctx.roundRect) ctx.roundRect(hudX, wepBoxY, wepBoxW, wepBoxH, 4);
  else ctx.rect(hudX, wepBoxY, wepBoxW, wepBoxH);
  ctx.stroke();

  // Rysowanie wyraźnej sylwetki broni po lewej stronie karty
  const silX = hudX + (isMobile ? 23 : 27);
  const silY = wepBoxY + wepBoxH / 2;
  drawWeaponSilhouette(ctx, curWepId, silX, silY, true, wepAccent);

  // Nazwa broni w wyrazistym kolorze
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = isMobile ? 'bold 10.5px monospace' : 'bold 11.5px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 4;
  ctx.fillText(wepName, hudX + (isMobile ? 44 : 52), wepBoxY + wepBoxH / 2);

  // Amunicja po prawej stronie karty
  ctx.textAlign = 'right';
  const ammoRightX = hudX + wepBoxW - 8;
  const ammoMidY = wepBoxY + wepBoxH / 2 + 0.5;

  if (curWepId === 'GRENADE') {
    const cd = (player.grenadeCooldownTimer || 0) / 60;
    const isReady = (cd <= 0);
    ctx.font = isMobile ? 'bold 10.5px monospace' : 'bold 11.5px monospace';
    ctx.fillStyle = isReady ? '#4ade80' : '#facc15';
    ctx.fillText(isReady ? 'READY' : `${cd.toFixed(1)}s`, ammoRightX, ammoMidY);
  } else if (isRel) {
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.012);
    ctx.font = isMobile ? 'bold 10.5px monospace' : 'bold 12px monospace';
    ctx.fillStyle = `rgba(250, 204, 21, ${0.65 + pulse * 0.35})`;
    ctx.fillText('RELOAD...', ammoRightX, ammoMidY);

    const dur = curAmmoObj?.reloadDuration || player.reloadDuration || 120;
    const tmr = curAmmoObj?.reloadTimer ?? player.reloadTimer ?? 0;
    const prog = Math.max(0, Math.min(1, 1 - (tmr / dur)));
    ctx.fillStyle = '#facc15';
    ctx.fillRect(hudX + 2, wepBoxY + wepBoxH - 3.5, (wepBoxW - 4) * prog, 2.5);
  } else if (isNoAmmo) {
    ctx.font = isMobile ? 'bold 11px monospace' : 'bold 12.5px monospace';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('NO AMMO', ammoRightX, ammoMidY);
  } else {
    ctx.font = isMobile ? 'bold 10.5px monospace' : 'bold 11.5px monospace';
    const resAmmoText = ` / ${rAmmo}`;
    const resW = ctx.measureText(resAmmoText).width;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(resAmmoText, ammoRightX, ammoMidY);

    ctx.font = isMobile ? 'bold 14px monospace' : 'bold 16px monospace';
    ctx.fillStyle = isLow ? '#f97316' : wepAccent;
    ctx.fillText(`${cAmmo}`, ammoRightX - resW, ammoMidY);
  }
  ctx.restore();

  // --- C. KLASA I FPS (DYSKRETNY PASEK POD KARTĄ BRONI) ---
  const metaY = wepBoxY + wepBoxH + (isMobile ? 11 : 13);
  ctx.textAlign = 'left';
  ctx.font = isMobile ? 'bold 8.5px monospace' : 'bold 9.5px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`KLASA: ${player.currentClass?.name || 'DOMYŚLNA'}   FPS: ${currentFps}`, hudX + 2, metaY);

  // --- D. RANGA WOJSKOWA & PROGRES XP ---
  const rankY = metaY + (isMobile ? 13 : 15);
  drawRankHUD(ctx, hudX + 2, rankY, barW - 4, isMobile);

  ctx.restore();

  // =========================================================================
  // 2. KAFELKI BRONI:
  // - PC: 4 kompaktowe sloty 38x38 px w lewym dolnym rogu ekranu
  // - EKRAN DOTYKOWY (MOBILE): Przeniesione na dolny środek ekranu w 1 ikonę
  // =========================================================================

  if (isTouchDevice) {
    // Na ekranie dotykowym sloty broni znajdują się w przezroczystych kieszeniach wokół prawego drążka (pockets)
    weaponButtons[0].x = -999;
    weaponButtons[0].y = -999;
    weaponButtons[1].x = -999;
    weaponButtons[1].y = -999;
    if (weaponButtons[2]) {
      weaponButtons[2].x = -999;
      weaponButtons[2].y = -999;
    }
    if (weaponButtons[3]) {
      weaponButtons[3].x = -999;
      weaponButtons[3].y = -999;
    }
  } else {
    const slotSize = 38;
    const slotGap = 8;
    const panelX = 14;
    const panelY = H - slotSize - 14;

    weaponButtons[0].x = panelX;
    weaponButtons[0].y = panelY;
    weaponButtons[0].w = slotSize;
    weaponButtons[0].h = slotSize;
    weaponButtons[0].id = 'AK47';

    weaponButtons[1].x = panelX + slotSize + slotGap;
    weaponButtons[1].y = panelY;
    weaponButtons[1].w = slotSize;
    weaponButtons[1].h = slotSize;
    weaponButtons[1].id = 'SHOTGUN';

    if (weaponButtons[2]) {
      weaponButtons[2].x = panelX + (slotSize + slotGap) * 2;
      weaponButtons[2].y = panelY;
      weaponButtons[2].w = slotSize;
      weaponButtons[2].h = slotSize;
      weaponButtons[2].id = 'SNIPER';
    }

    if (weaponButtons[3]) {
      weaponButtons[3].x = panelX + (slotSize + slotGap) * 3;
      weaponButtons[3].y = panelY;
      weaponButtons[3].w = slotSize;
      weaponButtons[3].h = slotSize;
      weaponButtons[3].id = 'GRENADE';
    }

    for (const btn of weaponButtons) {
      const isSelected = (curWepId === btn.id) && !player.isHolstered;
      drawWeaponSlot(ctx, btn, isSelected, player, false);
    }
  }

  // =========================================================================
  // 3. TABLICA WYNIKÓW (GÓRA EKRANU)
  // =========================================================================
  const aState = arenaInfo || _worldArenaState;
  const curArenaId = aState.activeArenaId;
  const curScore = aState.arenaScore || { cyan: 0, orange: 0 };
  const curA1State = aState.arena1State;
  const isDeathmatch = (curArenaId === 'ARENA_3' || curArenaId === 'arena-3' || curArenaId === 'ARENA_FOUNDRY');
  const isSectorXArena = (curArenaId === 'ARENA_2' || curArenaId === 'ARENA_2_PANDORA' || curArenaId === 'arena-2' || curArenaId === 'ARENA_2_SECTOR_X');
  const isJungleArena = isSectorXArena; // Wsteczna kompatybilność
  const isMatchArena = (curArenaId === 'ARENA_1');

  if (isSectorXArena) {
    drawDeathmatchHUD(ctx, W, H, isMobile, player);
  } else if (isDeathmatch) {
    const scoreBoxW = isMobile ? 210 : 270;
    const scoreBoxH = isMobile ? 26 : 34;
    const scoreBoxX = (W - scoreBoxW) / 2;
    const scoreBoxY = isMobile ? 6 : 8;

    let baseAlpha = isMobile ? 0.78 : 0.88;
    if (player && typeof player.x === 'number') {
      const camX = (camera && typeof camera.x === 'number') ? camera.x : 0;
      const camY = (camera && typeof camera.y === 'number') ? camera.y : 0;
      const camZoom = (camera && typeof camera.zoom === 'number') ? camera.zoom : 1;
      const pScreenX = (player.x + (player.w || 24) * 0.5 - camX) * camZoom;
      const pScreenY = (player.y - camY) * camZoom;
      if (Math.abs(pScreenX - W / 2) < (scoreBoxW * 0.5 + 40) && pScreenY < (scoreBoxY + scoreBoxH + 90)) {
        baseAlpha = 0.22;
      }
    }

    ctx.save();
    ctx.globalAlpha = baseAlpha;
    ctx.beginPath();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.80)';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.lineWidth = 1.2;
    if (ctx.roundRect) ctx.roundRect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, 6);
    else ctx.rect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH);
    ctx.fill();
    ctx.stroke();

    // Nagłówek trybu TDM
    ctx.font = isMobile ? '900 8px monospace' : '900 9.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.shadowBlur = 0;
    ctx.fillText('TEAM DEATHMATCH', scoreBoxX + scoreBoxW / 2, scoreBoxY + (isMobile ? 9.5 : 12));

    // Fragi obu drużyn
    ctx.font = isMobile ? '900 10.5px monospace' : 'bold 13px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#06b6d4';
    ctx.fillText(`CYAN ${curScore.cyan}`, scoreBoxX + scoreBoxW / 2 - (isMobile ? 10 : 14), scoreBoxY + (isMobile ? 20.5 : 27));

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(':', scoreBoxX + scoreBoxW / 2, scoreBoxY + (isMobile ? 20.5 : 26));

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f97316';
    ctx.fillText(`${curScore.orange} ORANGE`, scoreBoxX + scoreBoxW / 2 + (isMobile ? 10 : 14), scoreBoxY + (isMobile ? 20.5 : 27));

    ctx.restore();
  } else if (isMatchArena) {
    const scoreBoxW = isMobile ? 180 : 230;
    const scoreBoxH = isMobile ? 26 : 34;
    const scoreBoxX = (W - scoreBoxW) / 2;
    const scoreBoxY = isMobile ? 10 : 16;

    ctx.save();
    ctx.globalAlpha = isMobile ? 0.80 : 0.88;
    ctx.beginPath();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.2;
    if (ctx.roundRect) ctx.roundRect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, 6);
    else ctx.rect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH);
    ctx.fill();
    ctx.stroke();

    ctx.font = isMobile ? 'bold 10px monospace' : 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 0;
    ctx.fillText(`CYAN ${curScore.cyan}`, scoreBoxX + scoreBoxW / 2 - (isMobile ? 10 : 14), scoreBoxY + (isMobile ? 17 : 22));

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText(':', scoreBoxX + scoreBoxW / 2, scoreBoxY + (isMobile ? 16 : 21));

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 0;
    ctx.fillText(`${curScore.orange} ORANGE`, scoreBoxX + scoreBoxW / 2 + (isMobile ? 10 : 14), scoreBoxY + (isMobile ? 17 : 22));

    if (curArenaId === 'ARENA_1' && curA1State?.waitingForKickoff) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.005);
      ctx.textAlign = 'center';
      ctx.font = isMobile ? 'bold 8.5px monospace' : 'bold 10px monospace';
      ctx.fillStyle = `rgba(56, 189, 248, ${0.80 + pulse * 0.20})`;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 0;
      ctx.fillText('MECZ: PIŁKA NA OŁTARZU CENTRALNYM (X: 1800)', W / 2, scoreBoxY + scoreBoxH + (isMobile ? 12 : 16));
    }

    ctx.restore();
  }

  // 4. BANER CELEBRACJI GOLA (tylko w trybie meczowym z piłką)
  if (!isDeathmatch && !isSectorXArena && goalCelebration.active && goalCelebration.timer > 0) {
    goalCelebration.timer--;
    if (goalCelebration.timer <= 0) goalCelebration.active = false;

    ctx.save();
    ctx.fillStyle = goalCelebration.color;
    ctx.globalAlpha = Math.min(0.40, (goalCelebration.timer / 110) * 0.40);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 36px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = goalCelebration.color;
    ctx.shadowBlur = 0;
    ctx.fillText(`${goalCelebration.team} GOAL!`, W / 2, H * 0.32);
    ctx.restore();
  }

  // 5. OBSŁUGA ZWYCIĘSTWA W MECZU I NAGRODY +40 XP (TYLKO DLA ARENY 1 I ARENY 3)
  if (!isSectorXArena) {
    checkMatchWin(curArenaId, curScore);
    updateMatchWinState(curScore);
    drawMatchVictoryHUD(ctx, W, H, isMobile);
  } else {
    // 6. OBSŁUGA PODIUM I NAGRÓD DEATHMATCH (ARENA 2 - ROZLICZANE NA KONIEC BITWY 5:00)
    drawDeathmatchPodium(ctx, W, H, isMobile);
  }

  ctx.restore();

  if (ball && ball.active && !isDeathmatch && !isSectorXArena) {
    drawOffscreenBallIndicator(ctx, ball, camera, player);
  }

  if (isTouchDevice) {
    drawTouchControls(ctx, player, leftStick, btnCluster, rightStick, (isDeathmatch || isSectorXArena) ? null : ball, inKickRange);
  }
}

