// =============================================================================
// JS/KILLSTREAKS/RENDERER.JS - RENDEROWANIE EFEKTÓW SERII ZABÓJSTW I WIDGETU HUD
// Czysty styl Modern Military (ZERO EMOJIS, wektorowe ramki taktyczne i wskaźniki)
// =============================================================================

import { killstreakState, getKillstreakDef, getNextKillstreakGoal } from './state.js';
import { isKillstreakActive } from './logic.js';
import { isTouchDevice } from '../config.js';
import { W as stateW, H as stateH } from '../world/state.js';
import { camera as globalCamera, worldToScreen } from '../camera.js';
import { drawCarePackages, getCarePackageSurfaceY } from './carePackage.js';
import { drawMortarStrikes, drawAttackDrones } from './supportStrikes.js';
import { drawSentryGuns } from './sentryGun.js';

function getScreenSize(canvas) {
  let sw = (typeof stateW === 'number' && stateW > 0) ? stateW : 0;
  let sh = (typeof stateH === 'number' && stateH > 0) ? stateH : 0;
  if (!sw && typeof window !== 'undefined') sw = window.innerWidth;
  if (!sh && typeof window !== 'undefined') sh = window.innerHeight;
  if (!sw && canvas?.clientWidth) sw = canvas.clientWidth;
  if (!sh && canvas?.clientHeight) sh = canvas.clientHeight;
  if (!sw) sw = 800;
  if (!sh) sh = 600;
  return { W: sw, H: sh };
}

/**
 * Renderuje wskaźnik i strefę rażenia nalotu moździerzowego w trybie celowania
 */
function drawMortarTargetingWorld(ctx, cam, player) {
  if (!killstreakState.mortarTargeting) return;

  const targetX = (typeof killstreakState.mortarTargetX === 'number' && !isNaN(killstreakState.mortarTargetX))
    ? killstreakState.mortarTargetX
    : ((player?.x || 600) + (player?.facing || 1) * 220);

  const surfaceY = getCarePackageSurfaceY(targetX);
  const now = performance.now();
  const pulse = 0.5 + 0.5 * Math.sin(now * 0.008);

  ctx.save();

  // A. Satelitarny promień celowniczy z nieba (pionowa kolumna światła laserowego)
  const skyY = surfaceY - 800;
  const beamGrad = ctx.createLinearGradient(targetX, skyY, targetX, surfaceY);
  beamGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
  beamGrad.addColorStop(0.3, 'rgba(239, 68, 68, 0.25)');
  beamGrad.addColorStop(1, 'rgba(239, 68, 68, 0.55)');

  ctx.fillStyle = beamGrad;
  ctx.fillRect(targetX - 6, skyY, 12, surfaceY - skyY);

  // Wewnętrzny biały rdzeń
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.75 + pulse * 0.25})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(targetX, skyY);
  ctx.lineTo(targetX, surfaceY);
  ctx.stroke();

  // B. Strefa rażenia na powierzchni (Blast Zone Ellipse R=130px)
  const radiusX = 130;
  const radiusY = 26;

  // Czerwona półprzezroczysta strefa zagrożenia
  ctx.fillStyle = `rgba(239, 68, 68, ${0.14 + pulse * 0.08})`;
  ctx.beginPath();
  ctx.ellipse(targetX, surfaceY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Przerywana krawędź strefy uderzenia
  ctx.strokeStyle = `rgba(239, 68, 68, ${0.8 + pulse * 0.2})`;
  ctx.lineWidth = 2.0;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.ellipse(targetX, surfaceY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // C. Celownik krzyżowy (Crosshair) w punkcie centralnym
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(targetX - 18, surfaceY); ctx.lineTo(targetX + 18, surfaceY);
  ctx.moveTo(targetX, surfaceY - 14); ctx.lineTo(targetX, surfaceY + 14);
  ctx.stroke();

  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(targetX, surfaceY, 6, 0, Math.PI * 2);
  ctx.stroke();

  // D. Wojskowe oznaczenie strefy
  ctx.font = '700 9px monospace';
  ctx.fillStyle = '#ef4444';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('[STREFA NALOTU // 130M]', targetX, surfaceY + radiusY + 8);

  ctx.restore();
}

/**
 * Renderuje efekty killstreaków w świecie gry (np. taktyczne ramki radaru UAV, wskaźniki celów)
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} camera - { x, y, zoom }
 * @param {Array} combatants - lista aktywnych uczestników (gracz, boty, zdalny gracz)
 * @param {object} player - lokalny gracz
 */
export function drawKillstreakWorld(ctx, camera, combatants, player) {
  const cam = camera || globalCamera || { x: 0, y: 0, zoom: 1 };
  const zoom = cam.zoom || 1;
  const { W, H } = getScreenSize(ctx?.canvas);

  // 1. OBIEKTY FIZYCZNE W ŚWIECIE GRY (Skrzynie zrzutowe, naloty artyleryjskie, drony)
  ctx.save();
  ctx.scale(zoom, zoom);
  ctx.translate(-cam.x, -cam.y);

  drawCarePackages(ctx, cam, player);
  drawMortarStrikes(ctx, cam);
  drawAttackDrones(ctx, cam);
  drawSentryGuns(ctx, cam);
  drawMortarTargetingWorld(ctx, cam, player);

  ctx.restore();

  if (!player || player.isDead) return;

  // 2. OBSŁUGA AKTYWNEGO RADARU UAV (Nakładki ekranowe)
  if (isKillstreakActive('UAV')) {
    ctx.save();

    // A. Efekt sonaru / siatki skanera taktycznego
    const scanPhase = killstreakState.uavScanPhase || 0;
    const scanY = (Math.sin(scanPhase) * 0.5 + 0.5) * H;

    // Pozioma linia skanowania radaru
    const grad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
    grad.addColorStop(0, 'rgba(0, 229, 255, 0)');
    grad.addColorStop(0.5, 'rgba(0, 229, 255, 0.09)');
    grad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, scanY - 30, W, 60);

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.28)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, scanY);
    ctx.lineTo(W, scanY);
    ctx.stroke();

    // B. Namierzanie i obrysowywanie każdego żywego wroga
    const list = Array.isArray(combatants) ? combatants : [];
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (!c || c === player || c.isDead || c.active === false) continue;

      // Sprawdzenie relacji drużynowej (oznaczamy wyłącznie wrogów)
      const isAlly = (c.team && player.team && c.team === player.team);
      if (isAlly) continue;

      const ew = (c.w || 32) * zoom;
      const eh = (c.h || 58) * zoom;
      const spos = worldToScreen(c.x, c.y, cam);
      const sx = spos.x;
      const sy = spos.y;

      const distPx = Math.hypot(c.x - player.x, c.y - player.y);
      const distM = Math.max(1, Math.round(distPx / 40));

      const margin = 40;
      const isOnScreen = (sx + ew >= -margin && sx <= W + margin && sy + eh >= -margin && sy <= H + margin);

      if (isOnScreen) {
        // --- CEL NA EKRANIE: Taktyczne narożniki [BRACKETS] i etykieta odległości ---
        const pad = 6;
        const bx = sx - pad;
        const by = sy - pad;
        const bw = ew + pad * 2;
        const bh = eh + pad * 2;
        const arm = Math.min(10, Math.floor(bw * 0.28));

        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'square';

        // 4 narożniki taktycznego celownika
        ctx.beginPath();
        // Lewy górny
        ctx.moveTo(bx, by + arm); ctx.lineTo(bx, by); ctx.lineTo(bx + arm, by);
        // Prawy górny
        ctx.moveTo(bx + bw - arm, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + arm);
        // Lewy dolny
        ctx.moveTo(bx, by + bh - arm); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + arm, by + bh);
        // Prawy dolny
        ctx.moveTo(bx + bw - arm, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - arm);
        ctx.stroke();

        // Etykieta namierzonego wroga nad głową
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#f43f5e';
        ctx.fillText(`[CEL // ${distM}m]`, bx + bw / 2, by - 3);

        // Subtelna kropka w centrum masy
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(bx + bw / 2, by + bh / 2, 2.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // --- CEL POZA EKRANEM: Wskaźnik krawędziowy (Edge Pointer) ---
        const cx = W / 2;
        const cy = H / 2;
        const centerWorldX = c.x + (c.w || 32) / 2;
        const centerWorldY = c.y + (c.h || 58) / 2;
        const centerPos = worldToScreen(centerWorldX, centerWorldY, cam);
        const dx = centerPos.x - cx;
        const dy = centerPos.y - cy;

        if (dx !== 0 || dy !== 0) {
          const angle = Math.atan2(dy, dx);
          const edgeMargin = 45;
          const minX = edgeMargin;
          const maxX = W - edgeMargin;
          const minY = edgeMargin;
          const maxY = H - edgeMargin;

          let t = Infinity;
          if (dx > 0) t = Math.min(t, (maxX - cx) / dx);
          else if (dx < 0) t = Math.min(t, (minX - cx) / dx);

          if (dy > 0) t = Math.min(t, (maxY - cy) / dy);
          else if (dy < 0) t = Math.min(t, (minY - cy) / dy);

          const ix = Math.max(minX, Math.min(maxX, cx + dx * t));
          const iy = Math.max(minY, Math.min(maxY, cy + dy * t));

          ctx.save();
          ctx.translate(ix, iy);

          // Rysowanie strzałki namiaru obróconej w stronę celu
          ctx.save();
          ctx.rotate(angle);
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.moveTo(11, 0);
          ctx.lineTo(-7, -6);
          ctx.lineTo(-4, 0);
          ctx.lineTo(-7, 6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Tekst z odległością w metrach
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#f43f5e';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const tagOffsetY = (iy > H - 60) ? -16 : 16;
          ctx.fillText(`[${distM}m]`, 0, tagOffsetY);

          ctx.restore();
        }
      }
    }

    ctx.restore();
  }
}

/**
 * Renderuje kompaktowy, wojskowy widget serii zabójstw na interfejsie HUD
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement} canvas
 * @param {object} player
 */
export function drawKillstreakHUD(ctx, canvas, player) {
  if (!player) return;

  const { W, H } = getScreenSize(canvas);
  const isMobile = !!(
    isTouchDevice ||
    (typeof window !== 'undefined' && (window.innerWidth <= 850 || ('ontouchstart' in window) || (navigator && navigator.maxTouchPoints > 0)))
  );

  ctx.save();

  // Wymiary i ergonomiczna pozycja widgetu:
  // Na telefonie: w prawym górnym rogu pod przyciskiem pauzy (z dala od drążków i kieszeni!)
  // Na PC: w prawym dolnym rogu (standard Call of Duty HUD)
  const widgetW = isMobile ? 134 : 156;
  const widgetH = isMobile ? 42 : 48;
  const posX = W - widgetW - (isMobile ? 14 : 20);
  const posY = isMobile ? 56 : (H - widgetH - 24);

  // Zapis granic klikalnego obszaru dla obsługi kliknięcia myszą lub dotyku (współrzędne CSS)
  killstreakState.hudButtonBounds = {
    x: posX,
    y: posY,
    w: widgetW,
    h: widgetH
  };

  const hasReadyStreak = (killstreakState.availableStreaks && killstreakState.availableStreaks.length > 0);
  const readyStreakId = hasReadyStreak ? killstreakState.availableStreaks[0] : null;
  const readyDef = readyStreakId ? getKillstreakDef(readyStreakId) : null;

  // 1. TŁO WIDGETU (Modern Military Dark Glass)
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(posX, posY, widgetW, widgetH, 6);
  else ctx.rect(posX, posY, widgetW, widgetH);

  const isTargetingMortar = (readyStreakId === 'MORTAR_STRIKE' && killstreakState.mortarTargeting);

  if (isTargetingMortar) {
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.015);
    ctx.fillStyle = `rgba(60, 12, 18, ${0.90 + pulse * 0.08})`;
  } else if (hasReadyStreak) {
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.008);
    ctx.fillStyle = `rgba(8, 36, 56, ${0.88 + pulse * 0.10})`;
  } else {
    ctx.fillStyle = 'rgba(10, 18, 32, 0.90)';
  }
  ctx.fill();

  // 2. RAMKA WIDGETU
  let strokeColor = 'rgba(100, 116, 139, 0.45)';
  if (isTargetingMortar) {
    strokeColor = '#ef4444';
    ctx.lineWidth = 2.4;
  } else if (hasReadyStreak) {
    strokeColor = '#00e5ff';
    ctx.lineWidth = 2.0;
  } else {
    ctx.lineWidth = 1.2;
  }
  ctx.strokeStyle = strokeColor;
  ctx.stroke();

  // 3. TREŚĆ WIDGETU
  if (hasReadyStreak && readyDef) {
    // STAN: NAGRODA GOTOWA DO UŻYCIA
    const keyHint = isTargetingMortar
      ? (isMobile ? '[CELOWANIE...]' : '[CELUJ MYSZĄ]')
      : (isMobile ? '[DOTKNIJ]' : '[KLAWISZ 4]');

    ctx.font = isMobile ? 'bold 10.5px monospace' : 'bold 11.5px monospace';
    ctx.fillStyle = isTargetingMortar ? '#ef4444' : '#00e5ff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${readyDef.tag} ${readyDef.short}`, posX + 10, posY + 8);

    ctx.font = isMobile ? 'bold 8.5px monospace' : 'bold 9.5px monospace';
    ctx.fillStyle = isTargetingMortar ? '#fca5a5' : '#f8fafc';
    ctx.fillText(keyHint, posX + 10, posY + (isMobile ? 24 : 27));

    // Ikona taktyczna po prawej
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isTargetingMortar ? '#ef4444' : '#00e5ff';
    ctx.fillText(readyDef.icon || '◆', posX + widgetW - 12, posY + widgetH / 2);
  } else {
    // STAN: POSTĘP W STRONĘ KOLEJNEGO KILLSTREAKA
    const streak = killstreakState.currentStreak || 0;
    const nextGoal = getNextKillstreakGoal(streak);
    const goalReq = nextGoal ? nextGoal.killsRequired : (streak + 1);
    const goalTag = nextGoal ? nextGoal.tag : '[MAX]';
    const goalShort = nextGoal ? nextGoal.short : '';

    ctx.font = isMobile ? 'bold 10px monospace' : 'bold 11px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`SERIA: ${streak} / ${goalReq}`, posX + 10, posY + 7);

    ctx.font = isMobile ? 'bold 8px monospace' : 'bold 8.5px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`CEL: ${goalTag} ${goalShort}`, posX + 10, posY + (isMobile ? 22 : 24));

    // Ikona po prawej
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#64748b';
    ctx.fillText(nextGoal ? nextGoal.icon : '◆', posX + widgetW - 10, posY + (isMobile ? 18 : 20));

    // Pasek postępu
    const barX = posX + 10;
    const barY = posY + widgetH - (isMobile ? 7 : 8);
    const barW = widgetW - 20;
    const barH = 3.0;
    const progress = Math.max(0, Math.min(1, streak / goalReq));

    ctx.fillStyle = 'rgba(51, 65, 85, 0.70)';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = streak > 0 ? '#00e5ff' : 'rgba(148, 163, 184, 0.40)';
    ctx.fillRect(barX, barY, barW * progress, barH);
  }

  // 4. WSKAŹNIK CZASU AKTYWNEGO UAV (jeśli aktualnie trwa)
  if (isKillstreakActive('UAV')) {
    const uavStreak = killstreakState.activeStreaks.find(s => s.id === 'UAV');
    if (uavStreak) {
      const timeLeft = Math.ceil(Math.max(0, uavStreak.timeRemaining));
      const badgeW = 120;
      const badgeH = 18;
      const badgeX = posX + (widgetW - badgeW) / 2;
      const badgeY = isMobile ? (posY + widgetH + 6) : (posY - badgeH - 6);

      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
      else ctx.rect(badgeX, badgeY, badgeW, badgeH);
      ctx.fillStyle = 'rgba(6, 24, 38, 0.94)';
      ctx.fill();

      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.font = 'bold 8.5px monospace';
      ctx.fillStyle = '#00e5ff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`[UAV AKTYWNY: ${timeLeft}S]`, badgeX + badgeW / 2, badgeY + badgeH / 2);
    }
  }

  // 5. BANNER POWIADOMIENIA (jeśli jest aktywne)
  if (killstreakState.recentNotification && killstreakState.notificationTimer > 0) {
    const notif = killstreakState.recentNotification;
    const alpha = Math.min(1.0, killstreakState.notificationTimer * 1.5);

    ctx.save();
    ctx.globalAlpha = alpha;

    const bannerW = Math.min(320, W - 32);
    const bannerH = 38;
    const bannerX = Math.round((W - bannerW) / 2);
    const bannerY = isMobile ? 42 : 54;

    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 4);
    else ctx.rect(bannerX, bannerY, bannerW, bannerH);
    ctx.fillStyle = 'rgba(10, 15, 26, 0.95)';
    ctx.fill();

    ctx.strokeStyle = notif.color || '#00e5ff';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.font = isMobile ? 'bold 10px monospace' : 'bold 11px monospace';
    ctx.fillStyle = notif.color || '#00e5ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(notif.title || 'WSPARCIE BOJOWE', bannerX + bannerW / 2, bannerY + 6);

    ctx.font = isMobile ? 'bold 9px monospace' : 'bold 9.5px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(notif.text || '', bannerX + bannerW / 2, bannerY + 20);

    ctx.restore();
  }

  // 6. NAKŁADKA TRYBU WYBORU CELU NALOTU (BANNER, PRZYCISK ANULUJ, RAMKI EKRANOWE)
  if (killstreakState.mortarTargeting) {
    // A. Narożniki taktyczne na krawędziach ekranu (czerwone/pomarańczowe HUD brackets)
    const bLen = 24;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    // Górny-lewy
    ctx.moveTo(12, 12 + bLen); ctx.lineTo(12, 12); ctx.lineTo(12 + bLen, 12);
    // Górny-prawy
    ctx.moveTo(W - 12 - bLen, 12); ctx.lineTo(W - 12, 12); ctx.lineTo(W - 12, 12 + bLen);
    // Dolny-lewy
    ctx.moveTo(12, H - 12 - bLen); ctx.lineTo(12, H - 12); ctx.lineTo(12 + bLen, H - 12);
    // Dolny-prawy
    ctx.moveTo(W - 12 - bLen, H - 12); ctx.lineTo(W - 12, H - 12); ctx.lineTo(W - 12, H - 12 - bLen);
    ctx.stroke();

    // B. Centralny górny baner dowodzenia
    const bannerW = Math.min(360, W - 40);
    const bannerH = 42;
    const bannerX = (W - bannerW) / 2;
    const bannerY = 12;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 6);
    else ctx.rect(bannerX, bannerY, bannerW, bannerH);
    ctx.fill();

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('[TRYB CELOWANIA NALOTU ARTYLERII]', W / 2, bannerY + 14);

    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(isMobile ? 'DOTKNIJ MIEJSCA NA EKRANIE, ABY WEZWAĆ SALWĘ' : 'KLIKNIJ NA EKRANIE, ABY WEZWAĆ SALWĘ', W / 2, bannerY + 29);

    // C. Przycisk [ANULUJ]
    const cancelW = 110;
    const cancelH = 30;
    const cancelX = (W - cancelW) / 2;
    const cancelY = bannerY + bannerH + 8;

    killstreakState.mortarCancelButtonBounds = {
      x: cancelX,
      y: cancelY,
      w: cancelW,
      h: cancelH
    };

    ctx.fillStyle = 'rgba(30, 41, 59, 0.92)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cancelX, cancelY, cancelW, cancelH, 4);
    else ctx.rect(cancelX, cancelY, cancelW, cancelH);
    ctx.fill();

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.font = 'bold 9.5px monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('[ANULUJ X]', W / 2, cancelY + cancelH / 2);
  } else {
    killstreakState.mortarCancelButtonBounds = null;
  }

  ctx.restore();
}
