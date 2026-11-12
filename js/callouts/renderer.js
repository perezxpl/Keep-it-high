// =============================================================================
// JS/CALLOUTS/RENDERER.JS - RENDEROWANIE EFEKTOWNYCH DYMKÓW MEDALI BOJOWYCH
// Kompaktowe dymki blisko miejsca eliminacji z dynamicznie pochylonymi słowami,
// ogonkiem kierunkowym oraz bez użycia shadowBlur i emoji (stałe 60 FPS).
// =============================================================================

import { calloutState } from './state.js';
import { isTouchDevice } from '../config.js';
import { W as stateW, H as stateH } from '../world/state.js';
import { camera as globalCamera, worldToScreen } from '../camera.js';

function getViewportSize(canvas) {
  let w = (typeof stateW === 'number' && stateW > 0) ? stateW : 0;
  let h = (typeof stateH === 'number' && stateH > 0) ? stateH : 0;
  if (!w && typeof window !== 'undefined') w = window.innerWidth;
  if (!h && typeof window !== 'undefined') h = window.innerHeight;
  if (!w && canvas && canvas.clientWidth) w = canvas.clientWidth;
  if (!h && canvas && canvas.clientHeight) h = canvas.clientHeight;
  return {
    W: w || 800,
    H: h || 600
  };
}

function clamp(val, min, max) {
  return val < min ? min : (val > max ? max : val);
}

function computePopScale(popAge) {
  if (popAge >= 0.24) return 1.0;
  if (popAge < 0.10) {
    const t = popAge / 0.10;
    return 0.48 + 0.68 * (1 - (1 - t) * (1 - t));
  }
  const t = (popAge - 0.10) / 0.14;
  return 1.16 - 0.16 * (1 - Math.pow(1 - t, 2));
}

function traceBubblePolygon(ctx, halfW, halfH, kind) {
  const c = kind === 'REVENGE' ? 10 : 8;
  const flare = kind === 'ONESHOT' ? 5 : (kind === 'REVENGE' ? 4 : 2.5);

  ctx.beginPath();
  // Lewy górny róg (lekko ścięty i dynamicznie rozszerzony)
  ctx.moveTo(-halfW + c, -halfH);
  if (kind === 'REVENGE' || kind === 'ONESHOT') {
    ctx.lineTo(-halfW * 0.25, -halfH - 2.5);
    ctx.lineTo(halfW * 0.18, -halfH + 1);
  }
  ctx.lineTo(halfW - c + flare * 0.4, -halfH - 1.5);
  ctx.lineTo(halfW + flare, -halfH + c);
  // Prawa krawędź z lekkim ostrym wcięciem
  ctx.lineTo(halfW - 2, 0);
  ctx.lineTo(halfW + flare * 0.6, halfH - c);
  ctx.lineTo(halfW - c, halfH + 1);
  // Dolna krawędź
  ctx.lineTo(-halfW + c - flare * 0.3, halfH - 1);
  ctx.lineTo(-halfW - flare * 0.5, halfH - c);
  // Lewa krawędź
  ctx.lineTo(-halfW + 1.5, -2);
  ctx.lineTo(-halfW - flare * 0.3, -halfH + c);
  ctx.closePath();
}

function drawPointerTail(ctx, bx, by, halfW, halfH, targetX, targetY, b) {
  const dx = targetX - bx;
  const dy = targetY - by;
  const dist = Math.hypot(dx, dy);
  if (dist < halfH * 0.85) return;

  // Przytnij długość ogonka do maksymalnie ~22px od krawędzi dymka
  const maxTailLen = 22;
  const scale = Math.min(1, (halfH + maxTailLen) / Math.max(1, dist));
  const tipX = bx + dx * scale;
  const tipY = by + dy * scale;

  const baseAnchorX = clamp(bx + dx * 0.28, bx - halfW * 0.55, bx + halfW * 0.55);
  const onTop = targetY < by;
  const baseY = onTop ? (by - halfH + 2) : (by + halfH - 2);
  const spread = 8;

  // Twardy cień ogonka
  ctx.fillStyle = 'rgba(4, 6, 12, 0.82)';
  ctx.beginPath();
  ctx.moveTo(baseAnchorX - spread + 3, baseY + 3);
  ctx.lineTo(tipX + 3, tipY + 3);
  ctx.lineTo(baseAnchorX + spread + 3, baseY + 3);
  ctx.closePath();
  ctx.fill();

  // Wypełnienie + podwójny obrys ogonka
  ctx.beginPath();
  ctx.moveTo(baseAnchorX - spread, baseY);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(baseAnchorX + spread, baseY);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#04060b';
  ctx.lineWidth = 4.0;
  ctx.stroke();
  ctx.strokeStyle = b.accentColor;
  ctx.lineWidth = 2.0;
  ctx.stroke();
  ctx.fillStyle = onTop ? b.bgTop : b.bgBottom;
  ctx.fill();
}

function layoutAndDrawBubble(ctx, b, cam, W, H, isMobile) {
  const remaining = b.lifetime - b.age;
  if (remaining <= 0) return;

  const fadeOut = remaining < 0.38 ? clamp(remaining / 0.38, 0, 1) : 1;
  const fadeIn = b.age < 0.08 ? clamp(b.age / 0.08, 0.2, 1) : 1;
  const alpha = fadeIn * fadeOut;

  const popScale = computePopScale(b.popAge);
  const baseScale = isMobile ? 0.78 : 0.94;
  const finalScale = baseScale * popScale;

  const baseFontPx = isMobile ? 14 : 16;
  const wordGap = 6;
  const rowGap = 3;

  // Podział wyrazów na wiersze i pomiar szerokości każdego wiersza
  const rows = [];
  for (const w of b.words) {
    const rIdx = w.row || 0;
    if (!rows[rIdx]) rows[rIdx] = [];
    rows[rIdx].push(w);
  }

  let maxRowW = 0;
  let totalH = 0;
  const measuredRows = rows.map((rowWords, idx) => {
    let rowW = 0;
    let rowMaxH = 0;
    const items = rowWords.map((w, wIdx) => {
      const px = Math.round(baseFontPx * (w.scale || 1));
      ctx.font = `900 ${px}px "Segoe UI", Roboto, "Arial Black", sans-serif`;
      const m = ctx.measureText(w.text);
      const tw = m.width;
      const th = px * 1.05;
      rowW += tw + (wIdx > 0 ? wordGap : 0);
      if (th > rowMaxH) rowMaxH = th;
      return { ...w, px, tw, th, idx: wIdx };
    });
    if (rowW > maxRowW) maxRowW = rowW;
    totalH += rowMaxH + (idx > 0 ? rowGap : 0);
    return { items, rowW, rowMaxH };
  });

  const padX = 16;
  const padY = 10;
  const boxW = Math.max(96, maxRowW + padX * 2);
  const boxH = Math.max(38, totalH + padY * 2);
  const halfW = boxW * 0.5;
  const halfH = boxH * 0.5;

  // Rzutowanie ze świata gry w pobliże miejsca eliminacji
  const anchor = worldToScreen(b.worldX + b.offsetX, b.worldY + b.offsetY, cam);
  const driftY = Math.min(26, b.age * 15);
  const rawX = anchor.x;
  const rawY = anchor.y - 46 - driftY;

  const safeMarginX = halfW * baseScale + (isMobile ? 14 : 20);
  const safeTop = halfH * baseScale + (isMobile ? 46 : 74);
  const safeBottom = H - halfH * baseScale - (isMobile ? 76 : 86);

  const bx = clamp(rawX, safeMarginX, Math.max(safeMarginX, W - safeMarginX));
  const by = clamp(rawY, safeTop, Math.max(safeTop, safeBottom));

  ctx.save();
  ctx.globalAlpha = alpha;

  // Ogon dymka wskazujący w stronę eliminacji
  drawPointerTail(ctx, bx, by, halfW * finalScale, halfH * finalScale, anchor.x, anchor.y, b);

  ctx.translate(bx, by);
  ctx.scale(finalScale, finalScale);
  ctx.rotate(b.tilt || 0);

  // 1. Twardy komiksowy cień bez shadowBlur
  ctx.save();
  ctx.translate(3.5, 4.5);
  traceBubblePolygon(ctx, halfW, halfH, b.kind);
  ctx.fillStyle = 'rgba(4, 6, 12, 0.85)';
  ctx.fill();
  ctx.restore();

  // 2. Gradientowe tło dymka
  traceBubblePolygon(ctx, halfW, halfH, b.kind);
  const grad = ctx.createLinearGradient(0, -halfH, 0, halfH);
  grad.addColorStop(0, b.bgTop);
  grad.addColorStop(1, b.bgBottom);
  ctx.fillStyle = grad;
  ctx.fill();

  // Subtelny skośny błysk u góry dymka
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.beginPath();
  ctx.moveTo(-halfW - 10, -halfH);
  ctx.lineTo(halfW + 10, -halfH);
  ctx.lineTo(halfW - 18, -halfH * 0.15);
  ctx.lineTo(-halfW - 10, -halfH * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 3. Podwójna ramka (ciemny zewnętrzny kontur + jasny akcent)
  traceBubblePolygon(ctx, halfW, halfH, b.kind);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#04060b';
  ctx.lineWidth = 4.2;
  ctx.stroke();

  ctx.strokeStyle = b.accentColor;
  ctx.lineWidth = 2.1;
  ctx.stroke();

  // 4. Wyrazy w dymku — każdy delikatnie pochylony i przesunięty w pionie (nie w płaskiej linii)
  let curY = -totalH * 0.5;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let r = 0; r < measuredRows.length; r++) {
    const row = measuredRows[r];
    if (!row || !row.items.length) continue;
    const rowCenterY = curY + row.rowMaxH * 0.5;
    let curX = -row.rowW * 0.5;

    for (let i = 0; i < row.items.length; i++) {
      const item = row.items[i];
      const wordCenterX = curX + item.tw * 0.5;
      const staggerY = (item.idx % 2 === 0 ? -1.6 : 2.1) + (r === 1 ? 0.5 : -0.5);

      ctx.save();
      ctx.translate(wordCenterX, rowCenterY + staggerY);
      ctx.rotate(item.tilt || 0);
      ctx.font = `900 ${item.px}px "Segoe UI", Roboto, "Arial Black", sans-serif`;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#05070c';
      ctx.lineWidth = Math.max(3, item.px * 0.24);
      ctx.strokeText(item.text, 0, 0);
      ctx.fillStyle = item.color || '#ffffff';
      ctx.fillText(item.text, 0, 0);
      ctx.restore();

      curX += item.tw + wordGap;
    }

    curY += row.rowMaxH + rowGap;
  }

  // 5. Kompaktowy znaczek bonusowego XP w rogu dymka
  if (b.xpText) {
    ctx.save();
    ctx.translate(halfW - 6, -halfH - 2);
    ctx.rotate(0.08);
    ctx.font = '900 10px "Segoe UI", Roboto, Arial, sans-serif';
    const xpW = Math.max(42, ctx.measureText(b.xpText).width + 12);
    const xpH = 16;

    ctx.fillStyle = '#090d16';
    ctx.strokeStyle = b.secondaryColor || '#fde047';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-xpW * 0.5, -xpH * 0.5, xpW, xpH, 4);
    else ctx.rect(-xpW * 0.5, -xpH * 0.5, xpW, xpH);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = b.secondaryColor || '#fde047';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.xpText, 0, 0.5);
    ctx.restore();
  }

  ctx.restore();
}

export function drawCallouts(ctx, camera, canvas) {
  if (!ctx || !calloutState.bubbles.length) return;
  const cam = camera || globalCamera;
  const { W, H } = getViewportSize(canvas);
  const isMobile = isTouchDevice || W < 820;

  for (let i = 0; i < calloutState.bubbles.length; i++) {
    layoutAndDrawBubble(ctx, calloutState.bubbles[i], cam, W, H, isMobile);
  }
}
