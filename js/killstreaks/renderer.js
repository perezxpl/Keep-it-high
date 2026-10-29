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
  // Na telefonie: minimalistyczny mikro-chip w samej górnej krawędzi (obok pauzy), uwalniający ekran
  // Na PC: w prawym dolnym rogu (standard Call of Duty HUD)
  const hasReadyStreak = (killstreakState.availableStreaks && killstreakState.availableStreaks.length > 0);
  const readyStreakId = hasReadyStreak ? killstreakState.availableStreaks[0] : null;
  const readyDef = readyStreakId ? getKillstreakDef(readyStreakId) : null;

  const widgetW = isMobile ? (hasReadyStreak ? 88 : 74) : 156;
  const widgetH = isMobile ? (hasReadyStreak ? 22 : 18) : 48;
  const posX = isMobile ? (W - widgetW - 38) : (W - widgetW - 20);
  const posY = isMobile ? 8 : (H - widgetH - 24);

  // Proximity Ghosting dla prawego górnego rogu na telefonach
  if (isMobile && player && typeof player.x === 'number') {
    const camX = (globalCamera && typeof globalCamera.x === 'number') ? globalCamera.x : 0;
    const camY = (globalCamera && typeof globalCamera.y === 'number') ? globalCamera.y : 0;
    const camZoom = (globalCamera && typeof globalCamera.zoom === 'number') ? globalCamera.zoom : 1;
    const pScreenX = (player.x + (player.w || 24) * 0.5 - camX) * camZoom;
    const pScreenY = (player.y - camY) * camZoom;
    if (pScreenX > W - 140 && pScreenY < 100) {
      ctx.globalAlpha = 0.28;
    }
  }

  // Zapis granic klikalnego obszaru dla obsługi kliknięcia myszą lub dotyku (współrzędne CSS)
  killstreakState.hudButtonBounds = {
    x: posX,
    y: posY,
    w: widgetW,
    h: widgetH
  };

  // 1. TŁO WIDGETU (Modern Military Dark Glass)
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(posX, posY, widgetW, widgetH, isMobile ? 3.5 : 6);
  else ctx.rect(posX, posY, widgetW, widgetH);

  const isTargetingMortar = (readyStreakId === 'MORTAR_STRIKE' && killstreakState.mortarTargeting);

  if (isTargetingMortar) {
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.015);
    ctx.fillStyle = `rgba(60, 12, 18, ${0.90 + pulse * 0.08})`;
  } else if (hasReadyStreak) {
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.008);
    ctx.fillStyle = `rgba(8, 36, 56, ${0.88 + pulse * 0.10})`;
  } else {
    ctx.fillStyle = 'rgba(10, 18, 32, 0.85)';
  }
  ctx.fill();

  // 2. RAMKA WIDGETU
  let strokeColor = 'rgba(100, 116, 139, 0.45)';
  if (isTargetingMortar) {
    strokeColor = '#ef4444';
    ctx.lineWidth = isMobile ? 1.5 : 2.4;
  } else if (hasReadyStreak) {
    strokeColor = '#00e5ff';
    ctx.lineWidth = isMobile ? 1.2 : 2.0;
  } else {
    ctx.lineWidth = isMobile ? 0.8 : 1.2;
  }
  ctx.strokeStyle = strokeColor;
  ctx.stroke();

  // 3. TREŚĆ WIDGETU
  if (hasReadyStreak && readyDef) {
    // STAN: NAGRODA GOTOWA DO UŻYCIA
    if (isMobile) {
      // Wariant minimalistyczny mobilny: pojedyncza linijka z akcją
      ctx.font = 'bold 8.5px monospace';
      ctx.fillStyle = isTargetingMortar ? '#ef4444' : '#00e5ff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const chipLabel = isTargetingMortar ? '[CELUJ]' : `[${readyDef.short || readyDef.tag}] TAP`;
      ctx.fillText(chipLabel, posX + widgetW / 2, posY + widgetH / 2);
    } else {
      const keyHint = isTargetingMortar
        ? '[CELUJ MYSZĄ]'
        : '[KLAWISZ 4]';

      ctx.font = 'bold 11.5px monospace';
      ctx.fillStyle = isTargetingMortar ? '#ef4444' : '#00e5ff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${readyDef.tag} ${readyDef.short}`, posX + 10, posY + 8);

      ctx.font = 'bold 9.5px monospace';
      ctx.fillStyle = isTargetingMortar ? '#fca5a5' : '#f8fafc';
      ctx.fillText(keyHint, posX + 10, posY + 27);

      // Ikona taktyczna po prawej
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isTargetingMortar ? '#ef4444' : '#00e5ff';
      ctx.fillText(readyDef.icon || '◆', posX + widgetW - 12, posY + widgetH / 2);
    }
  } else {
    // STAN: POSTĘP W STRONĘ KOLEJNEGO KILLSTREAKA
    const streak = killstreakState.currentStreak || 0;
    const nextGoal = getNextKillstreakGoal(streak);
    const goalReq = nextGoal ? nextGoal.killsRequired : (streak + 1);
    const goalTag = nextGoal ? nextGoal.tag : '[MAX]';
    const goalShort = nextGoal ? nextGoal.short : '';

    if (isMobile) {
      // Wariant minimalistyczny mobilny: mikro-napis i cienki pasek
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`SERIA ${streak}/${goalReq}`, posX + widgetW / 2, posY + 2.5);

      const barX = posX + 4;
      const barY = posY + widgetH - 3.5;
      const barW = widgetW - 8;
      const barH = 1.8;
      const progress = Math.max(0, Math.min(1, streak / goalReq));

      ctx.fillStyle = 'rgba(51, 65, 85, 0.70)';
      ctx.fillRect(barX, barY, barW, barH);

      ctx.fillStyle = streak > 0 ? '#00e5ff' : 'rgba(148, 163, 184, 0.40)';
      ctx.fillRect(barX, barY, barW * progress, barH);
    } else {
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`SERIA: ${streak} / ${goalReq}`, posX + 10, posY + 7);

      ctx.font = 'bold 8.5px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`CEL: ${goalTag} ${goalShort}`, posX + 10, posY + 24);

      // Ikona po prawej
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#64748b';
      ctx.fillText(nextGoal ? nextGoal.icon : '◆', posX + widgetW - 10, posY + 20);

      // Pasek postępu
      const barX = posX + 10;
      const barY = posY + widgetH - 8;
      const barW = widgetW - 20;
      const barH = 3.0;
      const progress = Math.max(0, Math.min(1, streak / goalReq));

      ctx.fillStyle = 'rgba(51, 65, 85, 0.70)';
      ctx.fillRect(barX, barY, barW, barH);

      ctx.fillStyle = streak > 0 ? '#00e5ff' : 'rgba(148, 163, 184, 0.40)';
      ctx.fillRect(barX, barY, barW * progress, barH);
    }
  }

  // 4. WSKAŹNIK CZASU AKTYWNEGO UAV (jeśli aktualnie trwa)
  if (isKillstreakActive('UAV')) {
    const uavStreak = killstreakState.activeStreaks.find(s => s.id === 'UAV');
    if (uavStreak) {
      const timeLeft = Math.ceil(Math.max(0, uavStreak.timeRemaining));
      const badgeW = isMobile ? 74 : 120;
      const badgeH = isMobile ? 12 : 18;
      const badgeX = isMobile ? posX : (posX + (widgetW - badgeW) / 2);
      const badgeY = isMobile ? (posY + widgetH + 2) : (posY - badgeH - 6);

      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(badgeX, badgeY, badgeW, badgeH, isMobile ? 2.5 : 4);
      else ctx.rect(badgeX, badgeY, badgeW, badgeH);
      ctx.fillStyle = 'rgba(6, 24, 38, 0.94)';
      ctx.fill();

      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = isMobile ? 0.8 : 1.0;
      ctx.stroke();

      ctx.font = isMobile ? 'bold 7.5px monospace' : 'bold 8.5px monospace';
      ctx.fillStyle = '#00e5ff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`[UAV: ${timeLeft}S]`, badgeX + badgeW / 2, badgeY + badgeH / 2);
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

    ctx.font = 'bold 8.5px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(isMobile ? 'PRZECIĄGNIJ / STRZAŁKI = RUCH KAMERY // KLIKNIJ [POTWIERDŹ]' : '[A]/[D] LUB KRAWĘDŹ = RUCH KAMERY // LPM = ODPALENIE // [ESC] = ANULUJ', W / 2, bannerY + 29);

    // C. Przyciski taktyczne pod bannerem (ANULUJ, MOJA POZYCJA, POTWIERDŹ)
    const btnH = isMobile ? 30 : 28;
    const btnY = bannerY + bannerH + 7;

    const cancelW = isMobile ? 88 : 96;
    const playerW = isMobile ? 112 : 120;
    const confirmW = isMobile ? 134 : 144;
    const spacing = 8;
    const totalW = cancelW + playerW + confirmW + spacing * 2;
    const startX = Math.round((W - totalW) / 2);

    const cancelX = startX;
    const playerX = cancelX + cancelW + spacing;
    const confirmX = playerX + playerW + spacing;

    killstreakState.mortarCancelButtonBounds = { x: cancelX, y: btnY, w: cancelW, h: btnH };
    killstreakState.mortarPlayerButtonBounds = { x: playerX, y: btnY, w: playerW, h: btnH };
    killstreakState.mortarConfirmButtonBounds = { x: confirmX, y: btnY, w: confirmW, h: btnH };

    // 1. [ANULUJ X]
    ctx.fillStyle = 'rgba(30, 41, 59, 0.94)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cancelX, btnY, cancelW, btnH, 4);
    else ctx.rect(cancelX, btnY, cancelW, btnH);
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('[ANULUJ X]', cancelX + cancelW / 2, btnY + btnH / 2);

    // 2. [MOJA POZYCJA]
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(playerX, btnY, playerW, btnH, 4);
    else ctx.rect(playerX, btnY, playerW, btnH);
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('[MOJA POZYCJA]', playerX + playerW / 2, btnY + btnH / 2);

    // 3. [POTWIERDŹ NALOT]
    ctx.fillStyle = 'rgba(185, 28, 28, 0.94)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(confirmX, btnY, confirmW, btnH, 4);
    else ctx.rect(confirmX, btnY, confirmW, btnH);
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('[POTWIERDŹ NALOT]', confirmX + confirmW / 2, btnY + btnH / 2);

    // D. Boczne przyciski przewijania mapy (Flank Navigation)
    const navW = isMobile ? 62 : 54;
    const navH = isMobile ? 50 : 44;
    const navY = Math.round((H - navH) / 2);
    const leftNavX = 12;
    const rightNavX = W - 12 - navW;

    killstreakState.mortarLeftNavBounds = { x: leftNavX, y: navY, w: navW, h: navH };
    killstreakState.mortarRightNavBounds = { x: rightNavX, y: navY, w: navW, h: navH };

    // Przycisk [◄ LEWA]
    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(leftNavX, navY, navW, navH, 4);
    else ctx.rect(leftNavX, navY, navW, navH);
    ctx.fill();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.font = 'bold 9.5px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('[◄ LEWA]', leftNavX + navW / 2, navY + navH / 2);

    // Przycisk [PRAWA ►]
    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(rightNavX, navY, navW, navH, 4);
    else ctx.rect(rightNavX, navY, navW, navH);
    ctx.fill();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.font = 'bold 9.5px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('[PRAWA ►]', rightNavX + navW / 2, navY + navH / 2);
  } else {
    killstreakState.mortarCancelButtonBounds = null;
    killstreakState.mortarPlayerButtonBounds = null;
    killstreakState.mortarConfirmButtonBounds = null;
    killstreakState.mortarLeftNavBounds = null;
    killstreakState.mortarRightNavBounds = null;
  }

  ctx.restore();
}
