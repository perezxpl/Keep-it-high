// =============================================================================
// JS/KILLSTREAKS/RENDERER.JS - RENDEROWANIE EFEKTÓW SERII ZABÓJSTW I WIDGETU HUD
// Czysty styl Modern Military (ZERO EMOJIS, wektorowe ramki taktyczne i wskaźniki)
// =============================================================================

import { killstreakState, getKillstreakDef, getEquippedKillstreakDefs, getNextKillstreakGoal } from './state.js';
import { isKillstreakActive } from './logic.js';
import { isTouchDevice } from '../config.js';
import { W as stateW, H as stateH } from '../world/state.js';
import { camera as globalCamera, worldToScreen } from '../camera.js';
import { drawCarePackages, getCarePackageSurfaceY } from './carePackage.js';
import { drawMortarStrikes, drawAttackDrones, activeAttackDrones } from './supportStrikes.js';
import { drawSentryGuns, activeSentryGuns } from './sentryGun.js';
import { drawForegroundShipDrones } from './droneTransports.js';
import { isGamepadPrimaryInput } from '../input/gamepad.js';

export function drawKillstreakVectorIcon(ctx, streakId, cx, cy, radius = 8, color = '#00e5ff') {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.1, radius * 0.16);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (streakId === 'UAV') {
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.88, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-radius, 0); ctx.lineTo(-radius * 0.45, 0);
    ctx.moveTo(radius * 0.45, 0); ctx.lineTo(radius, 0);
    ctx.moveTo(0, -radius); ctx.lineTo(0, -radius * 0.45);
    ctx.moveTo(0, radius * 0.45); ctx.lineTo(0, radius);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.24, 0, Math.PI * 2);
    ctx.fill();
  } else if (streakId === 'CARE_PACKAGE') {
    ctx.beginPath();
    ctx.arc(0, -radius * 0.2, radius * 0.78, Math.PI, 0);
    ctx.stroke();
    ctx.lineWidth = Math.max(0.9, radius * 0.11);
    ctx.beginPath();
    ctx.moveTo(-radius * 0.72, -radius * 0.2); ctx.lineTo(-radius * 0.35, radius * 0.28);
    ctx.moveTo(radius * 0.72, -radius * 0.2); ctx.lineTo(radius * 0.35, radius * 0.28);
    ctx.stroke();
    ctx.fillRect(-radius * 0.42, radius * 0.28, radius * 0.84, radius * 0.56);
  } else if (streakId === 'MORTAR_STRIKE') {
    ctx.beginPath();
    ctx.moveTo(0, radius * 0.55);
    ctx.lineTo(-radius * 0.36, -radius * 0.05);
    ctx.lineTo(-radius * 0.36, -radius * 0.78);
    ctx.lineTo(radius * 0.36, -radius * 0.78);
    ctx.lineTo(radius * 0.36, -radius * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, radius * 0.72, radius * 0.68, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else if (streakId === 'SENTRY_GUN') {
    ctx.beginPath();
    ctx.moveTo(-radius * 0.65, radius * 0.78);
    ctx.lineTo(0, radius * 0.12);
    ctx.lineTo(radius * 0.65, radius * 0.78);
    ctx.stroke();
    ctx.fillRect(-radius * 0.42, -radius * 0.48, radius * 0.68, radius * 0.52);
    ctx.fillRect(radius * 0.24, -radius * 0.34, radius * 0.68, radius * 0.22);
  } else if (streakId === 'ATTACK_DRONE') {
    ctx.fillRect(-radius * 0.88, -radius * 0.42, radius * 0.48, radius * 0.18);
    ctx.fillRect(radius * 0.40, -radius * 0.42, radius * 0.48, radius * 0.18);
    ctx.beginPath();
    ctx.moveTo(-radius * 0.64, -radius * 0.24);
    ctx.lineTo(0, -radius * 0.02);
    ctx.lineTo(radius * 0.64, -radius * 0.24);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, radius * 0.06, radius * 0.42, radius * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, radius * 0.56, radius * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (streakId === 'JUGGERNAUT') {
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.85);
    ctx.lineTo(radius * 0.72, -radius * 0.48);
    ctx.lineTo(radius * 0.58, radius * 0.42);
    ctx.lineTo(0, radius * 0.88);
    ctx.lineTo(-radius * 0.58, radius * 0.42);
    ctx.lineTo(-radius * 0.72, -radius * 0.48);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-radius * 0.32, -radius * 0.14);
    ctx.lineTo(radius * 0.32, -radius * 0.14);
    ctx.lineTo(0, radius * 0.36);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.75);
    ctx.lineTo(radius * 0.75, 0);
    ctx.lineTo(0, radius * 0.75);
    ctx.lineTo(-radius * 0.75, 0);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function collectActiveTimedStreaks(player) {
  const list = [];
  if (isKillstreakActive('UAV')) {
    const uavStreak = killstreakState.activeStreaks.find(s => s.id === 'UAV');
    if (uavStreak && uavStreak.timeRemaining > 0) {
      list.push({
        id: 'UAV',
        short: 'UAV',
        timeRemaining: uavStreak.timeRemaining,
        duration: uavStreak.duration || 20,
        color: '#00e5ff'
      });
    }
  }
  if (Array.isArray(activeAttackDrones)) {
    const pDrone = activeAttackDrones.find(d => d && d.owner === player && !d.leaving && d.life > 0);
    if (pDrone) {
      list.push({
        id: 'ATTACK_DRONE',
        short: 'DRON',
        timeRemaining: pDrone.life,
        duration: pDrone.totalLife || 25,
        color: '#10b981'
      });
    }
  }
  if (Array.isArray(activeSentryGuns)) {
    const pSentry = activeSentryGuns.find(s => s && s.owner === player && s.state === 'ACTIVE' && s.life > 0);
    if (pSentry) {
      list.push({
        id: 'SENTRY_GUN',
        short: 'SENTRY',
        timeRemaining: pSentry.life,
        duration: pSentry.totalLife || 30,
        color: '#38bdf8'
      });
    }
  }
  return list;
}

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
 * Renderuje wskaźnik i strefę rażenia nalotu moździerzowego w świecie gry
 */
function drawMortarTargetingWorld(ctx, cam, player) {
  const isTargeting = !!killstreakState.mortarTargeting;
  const pending = killstreakState.mortarPendingLaunch;
  if (!isTargeting && !pending) return;

  const targetX = pending
    ? pending.targetX
    : ((typeof killstreakState.mortarTargetX === 'number' && !isNaN(killstreakState.mortarTargetX))
      ? killstreakState.mortarTargetX
      : ((player?.x || 600) + (player?.facing || 1) * 220));

  const surfaceY = getCarePackageSurfaceY(targetX);
  const now = performance.now();
  const pulse = 0.5 + 0.5 * Math.sin(now * (pending ? 0.022 : 0.008));

  ctx.save();

  // A. Linia namiaru łącząca celownik z punktem uderzenia na powierzchni
  if (isTargeting && typeof killstreakState.mortarCrosshairScreenX === 'number' && typeof killstreakState.mortarCrosshairScreenY === 'number') {
    const zoom = cam?.zoom || 1;
    const crossWorldX = (cam?.x || 0) + killstreakState.mortarCrosshairScreenX / zoom;
    const crossWorldY = (cam?.y || 0) + killstreakState.mortarCrosshairScreenY / zoom;

    ctx.strokeStyle = `rgba(239, 68, 68, ${killstreakState.mortarDragging ? 0.65 : 0.40})`;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(crossWorldX, crossWorldY);
    ctx.lineTo(targetX, surfaceY);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (pending) {
    // Pionowy promień blokady celu przed wystrzałem
    const skyY = surfaceY - 800;
    const beamGrad = ctx.createLinearGradient(targetX, skyY, targetX, surfaceY);
    beamGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
    beamGrad.addColorStop(0.4, 'rgba(239, 68, 68, 0.28)');
    beamGrad.addColorStop(1, 'rgba(239, 68, 68, 0.65)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(targetX - 5, skyY, 10, surfaceY - skyY);
  }

  // B. Strefa rażenia na powierzchni (Blast Zone Ellipse R=130px)
  const radiusX = 130;
  const radiusY = 26;

  ctx.fillStyle = `rgba(239, 68, 68, ${(pending ? 0.22 : 0.14) + pulse * 0.10})`;
  ctx.beginPath();
  ctx.ellipse(targetX, surfaceY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(239, 68, 68, ${0.82 + pulse * 0.18})`;
  ctx.lineWidth = pending ? 2.6 : 2.0;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.ellipse(targetX, surfaceY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // C. Znaczniki upadku 5 pocisków salwy na ziemi/platformach
  const shellOffsets = [-116, -58, 0, 58, 116];
  for (let i = 0; i < shellOffsets.length; i++) {
    const sx = targetX + shellOffsets[i];
    const sy = getCarePackageSurfaceY(sx);
    ctx.strokeStyle = i === 2 ? '#ffffff' : `rgba(252, 165, 165, ${0.50 + pulse * 0.35})`;
    ctx.lineWidth = i === 2 ? 1.8 : 1.2;
    ctx.beginPath();
    ctx.moveTo(sx - 6, sy - 8);
    ctx.lineTo(sx, sy - 1);
    ctx.lineTo(sx + 6, sy - 8);
    ctx.stroke();
  }

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(targetX - 18, surfaceY); ctx.lineTo(targetX + 18, surfaceY);
  ctx.moveTo(targetX, surfaceY - 14); ctx.lineTo(targetX, surfaceY + 14);
  ctx.stroke();

  ctx.font = '700 9.5px monospace';
  ctx.fillStyle = pending ? '#fecaca' : '#ef4444';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(pending ? '[CEL ZABLOKOWANY // SALWA]' : '[STREFA RAŻENIA // 130M]', targetX, surfaceY + radiusY + 8);

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
  drawForegroundShipDrones(ctx);
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
      const isAlly = (!c.isZombie && c.team && player.team && c.team === player.team);
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

function drawKillstreakNotificationBanner(ctx, W, H, isMobile, uiAnim) {
  if (!killstreakState.recentNotification || !(killstreakState.notificationTimer > 0)) return;
  const notif = killstreakState.recentNotification;
  const rawFade = Math.min(1.0, killstreakState.notificationTimer * 1.6);
  const enterT = Math.max(0, Math.min(1, (uiAnim && typeof uiAnim.notifEnter === 'number') ? uiAnim.notifEnter : 1));
  const easeOut = 1 - Math.pow(1 - enterT, 3);
  const slideY = (1 - easeOut) * (isMobile ? -8 : -12);
  const alpha = rawFade * Math.min(1, easeOut * 1.15);
  const accent = notif.color || '#00e5ff';
  const totalDur = Math.max(0.5, notif.duration || 3.5);
  const timeFrac = Math.max(0, Math.min(1, killstreakState.notificationTimer / totalDur));

  ctx.save();
  ctx.globalAlpha = alpha;

  if (isMobile) {
    const bannerH = 18;
    const bannerW = Math.min(238, W - 40);
    const bannerX = Math.round((W - bannerW) / 2);
    const bannerY = 36 + slideY;

    ctx.fillStyle = 'rgba(10, 15, 26, 0.80)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 3);
    else ctx.rect(bannerX, bannerY, bannerW, bannerH);
    ctx.fill();

    ctx.strokeStyle = accent;
    ctx.lineWidth = 0.9;
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.fillRect(bannerX + 1, bannerY + 2, 2.5, bannerH - 4);
    ctx.fillRect(bannerX + 4, bannerY + bannerH - 2, (bannerW - 8) * timeFrac, 1.3);

    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${notif.title || 'WSPARCIE'}: ${notif.text || ''}`, bannerX + bannerW / 2 + 2, bannerY + bannerH / 2 - 0.5);
  } else {
    const bannerW = Math.min(350, W - 32);
    const bannerH = 42;
    const bannerX = Math.round((W - bannerW) / 2);
    const bannerY = 58 + slideY;

    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 5);
    else ctx.rect(bannerX, bannerY, bannerW, bannerH);
    ctx.fillStyle = 'rgba(10, 15, 26, 0.94)';
    ctx.fill();

    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Lewy pasek akcentu + dolny wskaźnik wygasania
    ctx.fillStyle = accent;
    ctx.fillRect(bannerX + 1.5, bannerY + 3, 3.5, bannerH - 6);
    ctx.fillRect(bannerX + 6, bannerY + bannerH - 3.2, (bannerW - 12) * timeFrac, 1.8);

    const textOffsetX = notif.streakId ? 10 : 0;
    if (notif.streakId) {
      drawKillstreakVectorIcon(ctx, notif.streakId, bannerX + 20, bannerY + bannerH / 2 - 1, 8.5, accent);
    }

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(notif.title || 'WSPARCIE BOJOWE', bannerX + bannerW / 2 + textOffsetX, bannerY + 6);

    ctx.font = 'bold 9.5px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(notif.text || '', bannerX + bannerW / 2 + textOffsetX, bannerY + 21);
  }

  ctx.restore();
}

/**
 * Renderuje kompaktowy, wojskowy widget serii zabójstw na interfejsie HUD
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement} canvas
 * @param {object} player
 */
export function drawKillstreakHUD(ctx, canvas, player) {
  if (typeof window !== 'undefined' && window.isMenuShowcase) return;
  if (!player) return;

  const { W, H } = getScreenSize(canvas);
  const isMobile = !!(
    isTouchDevice ||
    (typeof window !== 'undefined' && (window.innerWidth <= 850 || ('ontouchstart' in window) || (navigator && navigator.maxTouchPoints > 0)))
  );

  ctx.save();

  const hasReadyStreak = (killstreakState.availableStreaks && killstreakState.availableStreaks.length > 0);
  const readyStreakId = hasReadyStreak ? killstreakState.availableStreaks[0] : null;
  const readyDef = readyStreakId ? getKillstreakDef(readyStreakId) : null;
  const uiAnim = killstreakState.uiAnim || {};
  const activeTimers = collectActiveTimedStreaks(player);

  // -------------------------------------------------------------------------
  // SMART-HIDE NA EKRANACH MOBILNYCH:
  // Jeśli gracz nie posiada odblokowanego wsparcia (0/3, 1/3, 2/3 fragów),
  // widget w prawym górnym rogu jest CAŁKOWICIE UKRYTY (uwalnia 100% pola gry).
  // Pojawia się WYŁĄCZNIE wtedy, gdy nagroda jest gotowa do kliknięcia (READY TAP)
  // wraz ze stosikiem kolejnych zakolejkowanych nagród poniżej.
  // -------------------------------------------------------------------------
  if (isMobile && !hasReadyStreak) {
    killstreakState.hudButtonBounds = null;

    // Kompaktowe pigułki aktywnych systemów wsparcia obok przycisku pauzy
    let pillXCursor = W - 36;
    for (let tIdx = 0; tIdx < activeTimers.length; tIdx++) {
      const tItem = activeTimers[tIdx];
      const timeLeft = Math.ceil(Math.max(0, tItem.timeRemaining));
      const ratio = Math.max(0, Math.min(1, tItem.timeRemaining / Math.max(1, tItem.duration)));
      const badgeW = 68;
      const badgeH = 16;
      const badgeX = pillXCursor - badgeW;
      const badgeY = 6;
      pillXCursor = badgeX - 5;

      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3);
      else ctx.rect(badgeX, badgeY, badgeW, badgeH);
      ctx.fillStyle = 'rgba(6, 20, 34, 0.72)';
      ctx.fill();

      ctx.strokeStyle = tItem.color;
      ctx.lineWidth = 0.9;
      ctx.stroke();

      ctx.fillStyle = tItem.color;
      ctx.fillRect(badgeX + 2, badgeY + badgeH - 2.5, (badgeW - 4) * ratio, 1.5);

      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = tItem.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${tItem.short} ${timeLeft}s`, badgeX + badgeW / 2, badgeY + 7);
    }

    drawKillstreakNotificationBanner(ctx, W, H, true, uiAnim);
    ctx.restore();
    return;
  }

  // Wymiary i ergonomiczna pozycja głównego widgetu:
  // Na telefonie: kompaktowy, pulsujący chip obok pauzy (y = 5px, h = 22px)
  // Na PC: w prawym dolnym rogu ze stosem zakolejkowanych kart nad nim
  const widgetW = isMobile ? 86 : 176;
  const widgetH = isMobile ? 22 : 52;
  const posX = isMobile ? (W - widgetW - 36) : (W - widgetW - 20);
  const posY = isMobile ? 5 : (H - widgetH - 22);

  // Zapis granic klikalnego obszaru dla obsługi kliknięcia myszą lub dotyku (współrzędne CSS)
  killstreakState.hudButtonBounds = {
    x: posX,
    y: posY,
    w: widgetW,
    h: widgetH
  };

  const isTargetingMortar = (readyStreakId === 'MORTAR_STRIKE' && killstreakState.mortarTargeting);
  const nowMs = performance.now();
  const unlockPop = Math.max(0, uiAnim.unlockPop || 0);
  const killBump = Math.max(0, uiAnim.killBump || 0);
  const activateFlash = Math.max(0, uiAnim.activateFlash || 0);
  const popScale = hasReadyStreak
    ? (1 + Math.sin(unlockPop * Math.PI) * 0.13 - activateFlash * 0.05)
    : (1 + Math.sin(killBump * Math.PI) * 0.07);

  ctx.save();
  const cx = posX + widgetW / 2;
  const cy = posY + widgetH / 2;
  ctx.translate(cx, cy);
  ctx.scale(popScale, popScale);
  ctx.translate(-cx, -cy);

  const primaryAccent = isTargetingMortar ? '#ef4444' : (readyDef?.accent || '#00e5ff');
  const primaryBgTint = isTargetingMortar
    ? 'rgba(60, 12, 18, 0.94)'
    : (readyDef?.bgTint || 'rgba(8, 36, 56, 0.92)');

  // 1. TŁO WIDGETU (Modern Military Dark Glass)
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(posX, posY, widgetW, widgetH, isMobile ? 4 : 6);
  else ctx.rect(posX, posY, widgetW, widgetH);

  if (hasReadyStreak) {
    ctx.fillStyle = isMobile ? 'rgba(6, 24, 38, 0.84)' : primaryBgTint;
  } else {
    ctx.fillStyle = 'rgba(10, 18, 32, 0.90)';
  }
  ctx.fill();

  // Pasek akcentowy po lewej stronie głównej karty + diagonalny błysk przy odblokowaniu
  if (hasReadyStreak) {
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(posX, posY, widgetW, widgetH, isMobile ? 4 : 6);
    else ctx.rect(posX, posY, widgetW, widgetH);
    ctx.clip();

    ctx.fillStyle = primaryAccent;
    ctx.fillRect(posX, posY, isMobile ? 3 : 4, widgetH);

    const shimmerPos = uiAnim.shimmerPos;
    if (typeof shimmerPos === 'number' && shimmerPos >= -0.35 && shimmerPos <= 1.35) {
      const sx = posX + shimmerPos * widgetW;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.beginPath();
      ctx.moveTo(sx - 12, posY + widgetH);
      ctx.lineTo(sx + 6, posY);
      ctx.lineTo(sx + 22, posY);
      ctx.lineTo(sx + 4, posY + widgetH);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // 2. RAMKA WIDGETU
  const pulse = 0.55 + 0.45 * Math.sin(nowMs * (isTargetingMortar ? 0.015 : 0.008));
  if (hasReadyStreak) {
    ctx.strokeStyle = primaryAccent;
    ctx.globalAlpha = isMobile ? (0.78 + pulse * 0.22) : (0.82 + pulse * 0.18);
    ctx.lineWidth = isMobile ? 1.3 : 1.9;
  } else if (killBump > 0) {
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.6;
  } else {
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)';
    ctx.lineWidth = 1.2;
  }
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(posX, posY, widgetW, widgetH, isMobile ? 4 : 6);
  else ctx.rect(posX, posY, widgetW, widgetH);
  ctx.stroke();
  ctx.globalAlpha = 1.0;

  // 3. TREŚĆ WIDGETU
  if (hasReadyStreak && readyDef) {
    const queueCount = killstreakState.availableStreaks.length;
    if (isMobile) {
      drawKillstreakVectorIcon(ctx, readyDef.id, posX + 14, posY + widgetH / 2, 5.5, primaryAccent);

      ctx.font = '900 8.5px monospace';
      ctx.fillStyle = isTargetingMortar ? '#fca5a5' : '#f8fafc';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const chipText = isTargetingMortar ? 'CELUJ' : `${readyDef.short}`;
      ctx.fillText(chipText, posX + 24, posY + widgetH / 2 + 0.5);

      ctx.font = 'bold 7.5px monospace';
      ctx.fillStyle = primaryAccent;
      ctx.textAlign = 'right';
      ctx.fillText(queueCount > 1 ? `x${queueCount}` : 'TAP', posX + widgetW - 6, posY + widgetH / 2 + 0.5);
    } else {
      const usingPad = (typeof isGamepadPrimaryInput === 'function' && isGamepadPrimaryInput());
      const keyHint = isTargetingMortar
        ? '[PRZECIĄGNIJ I PUŚĆ]'
        : (usingPad ? '[D-PAD GÓRA / KLIK]' : '[KLAWISZ 4 / KLIK]');

      drawKillstreakVectorIcon(ctx, readyDef.id, posX + 22, posY + widgetH / 2, 10.5, primaryAccent);

      ctx.font = 'bold 11.5px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${readyDef.tag} ${readyDef.short}`, posX + 41, posY + 8);

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = primaryAccent;
      ctx.fillText(keyHint, posX + 41, posY + 28);

      if (queueCount > 1) {
        const pillText = `1/${queueCount}`;
        ctx.font = 'bold 8.5px monospace';
        ctx.fillStyle = '#facc15';
        ctx.textAlign = 'right';
        ctx.fillText(pillText, posX + widgetW - 8, posY + 9);
      }
    }
  } else {
    // STAN: POSTĘP W STRONĘ KOLEJNEGO WYBRANEGO KILLSTREAKA (SEGMENTOWY WSKAŹNIK)
    const streak = killstreakState.currentStreak || 0;
    const equippedDefs = getEquippedKillstreakDefs();
    const nextGoal = getNextKillstreakGoal(streak);
    const hasEquipped = equippedDefs.length > 0;
    const goalReq = nextGoal ? nextGoal.killsRequired : (hasEquipped ? Math.max(1, streak) : 0);
    const goalTag = nextGoal ? nextGoal.tag : (hasEquipped ? '[MAX]' : '[0/3]');
    const goalShort = nextGoal ? nextGoal.short : (hasEquipped ? 'SERIA' : 'BRAK');
    const goalAccent = nextGoal?.accent || '#38bdf8';

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = killBump > 0.15 ? '#ffffff' : '#38bdf8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(hasEquipped ? `SERIA: ${streak} / ${goalReq}` : `SERIA: ${streak}`, posX + 11, posY + 7);

    ctx.font = 'bold 8.5px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`CEL: ${goalTag} ${goalShort}`, posX + 11, posY + 23);

    drawKillstreakVectorIcon(ctx, nextGoal?.id || 'UAV', posX + widgetW - 20, posY + 19, 8.5, '#64748b');

    // Segmentowy pasek postępu z płynnym dopełnieniem
    const barX = posX + 11;
    const barY = posY + widgetH - 10;
    const barW = widgetW - 22;
    const barH = 4.0;
    const smoothProg = (typeof uiAnim.smoothProgress === 'number')
      ? uiAnim.smoothProgress
      : (goalReq > 0 ? Math.max(0, Math.min(1, streak / goalReq)) : 0);

    ctx.fillStyle = 'rgba(51, 65, 85, 0.72)';
    ctx.fillRect(barX, barY, barW, barH);

    if (smoothProg > 0.005) {
      ctx.fillStyle = killBump > 0.2 ? '#ffffff' : goalAccent;
      ctx.fillRect(barX, barY, barW * smoothProg, barH);
    }

    // Podziałki segmentów odpowiadające liczbie wymaganych fragów
    if (goalReq > 1 && goalReq <= 12) {
      ctx.fillStyle = 'rgba(10, 18, 32, 0.90)';
      for (let seg = 1; seg < goalReq; seg++) {
        const sx = Math.round(barX + (barW * seg) / goalReq);
        ctx.fillRect(sx - 0.5, barY, 1, barH);
      }
    }
  }

  // Impuls błysku aktywacji na obramowaniu widgetu
  if (activateFlash > 0.02) {
    ctx.save();
    ctx.globalAlpha = activateFlash * 0.45;
    ctx.fillStyle = uiAnim.activateColor || '#ffffff';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(posX, posY, widgetW, widgetH, isMobile ? 4 : 6);
    else ctx.rect(posX, posY, widgetW, widgetH);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();

  // 3B. WIZUALNY STOS KART KOLEJNYCH GOTOWYCH NAGRÓD (gdy availableStreaks.length > 1)
  let topOfStackY = posY;
  if (hasReadyStreak && killstreakState.availableStreaks.length > 1 && !(isMobile && isTargetingMortar)) {
    const queued = killstreakState.availableStreaks.slice(1);
    const maxVisibleCards = isMobile ? 2 : 3;
    const visibleSlice = queued.slice(0, maxVisibleCards);
    const hiddenCount = Math.max(0, queued.length - maxVisibleCards);

    if (isMobile) {
      let curY = posY + widgetH + 3;
      for (let qIdx = 0; qIdx < visibleSlice.length; qIdx++) {
        const qDef = getKillstreakDef(visibleSlice[qIdx]);
        if (!qDef) continue;
        const cardW = widgetW - 4;
        const cardH = 15;
        const cardX = posX + 4;
        const qColor = qDef.accent || '#00e5ff';

        ctx.fillStyle = 'rgba(10, 18, 32, 0.80)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cardX, curY, cardW, cardH, 3);
        else ctx.rect(cardX, curY, cardW, cardH);
        ctx.fill();

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.fillStyle = qColor;
        ctx.fillRect(cardX + 1, curY + 2, 2.5, cardH - 4);

        drawKillstreakVectorIcon(ctx, qDef.id, cardX + 11, curY + cardH / 2, 3.8, qColor);

        ctx.font = 'bold 7.5px monospace';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`#${qIdx + 2} ${qDef.short}`, cardX + 19, curY + cardH / 2 + 0.5);

        if (qIdx === visibleSlice.length - 1 && hiddenCount > 0) {
          ctx.fillStyle = '#facc15';
          ctx.textAlign = 'right';
          ctx.fillText(`+${hiddenCount}`, cardX + cardW - 4, curY + cardH / 2 + 0.5);
        }
        curY += cardH + 2;
      }
    } else {
      let curY = posY - 4;
      for (let qIdx = 0; qIdx < visibleSlice.length; qIdx++) {
        const qDef = getKillstreakDef(visibleSlice[qIdx]);
        if (!qDef) continue;
        const stepShrink = (qIdx + 1) * 7;
        const cardW = widgetW - stepShrink * 2;
        const cardH = 21;
        const cardX = posX + stepShrink;
        const cardY = curY - cardH;
        const qColor = qDef.accent || '#00e5ff';

        ctx.fillStyle = 'rgba(10, 18, 32, 0.88)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cardX, cardY, cardW, cardH, 4);
        else ctx.rect(cardX, cardY, cardW, cardH);
        ctx.fill();

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.42)';
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // Kolorowy lewy pasek karty w kolejce
        ctx.fillStyle = qColor;
        ctx.fillRect(cardX + 1, cardY + 2, 3, cardH - 4);

        drawKillstreakVectorIcon(ctx, qDef.id, cardX + 14, cardY + cardH / 2, 5.5, qColor);

        ctx.font = 'bold 9.5px monospace';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`#${qIdx + 2} ${qDef.short}`, cardX + 24, cardY + cardH / 2 + 0.5);

        if (qIdx === visibleSlice.length - 1 && hiddenCount > 0) {
          ctx.fillStyle = '#facc15';
          ctx.textAlign = 'right';
          ctx.fillText(`+${hiddenCount}`, cardX + cardW - 7, cardY + cardH / 2 + 0.5);
        } else {
          ctx.font = 'bold 8px monospace';
          ctx.fillStyle = qColor;
          ctx.textAlign = 'right';
          ctx.fillText('KOLEJKA', cardX + cardW - 7, cardY + cardH / 2 + 0.5);
        }

        curY = cardY - 3;
      }
      topOfStackY = curY + 1;
    }
  }

  // 4. WSKAŹNIKI CZASU AKTYWNYCH SYSTEMÓW WSPARCIA (UAV / DRON / SENTRY)
  if (activeTimers.length > 0 && !(isMobile && isTargetingMortar)) {
    if (isMobile) {
      let pillRight = posX - 5;
      for (let tIdx = 0; tIdx < activeTimers.length; tIdx++) {
        const tItem = activeTimers[tIdx];
        const timeLeft = Math.ceil(Math.max(0, tItem.timeRemaining));
        const ratio = Math.max(0, Math.min(1, tItem.timeRemaining / Math.max(1, tItem.duration)));
        const badgeW = 62;
        const badgeH = 16;
        const badgeX = pillRight - badgeW;
        const badgeY = 8;
        pillRight = badgeX - 4;

        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3);
        else ctx.rect(badgeX, badgeY, badgeW, badgeH);
        ctx.fillStyle = 'rgba(6, 20, 34, 0.78)';
        ctx.fill();

        ctx.strokeStyle = tItem.color;
        ctx.lineWidth = 0.9;
        ctx.stroke();

        ctx.fillStyle = tItem.color;
        ctx.fillRect(badgeX + 2, badgeY + badgeH - 2.5, (badgeW - 4) * ratio, 1.5);

        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = tItem.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${tItem.short} ${timeLeft}s`, badgeX + badgeW / 2, badgeY + 7);
      }
    } else {
      let badgeBottomY = topOfStackY - 6;
      for (let tIdx = 0; tIdx < activeTimers.length; tIdx++) {
        const tItem = activeTimers[tIdx];
        const timeLeft = Math.ceil(Math.max(0, tItem.timeRemaining));
        const ratio = Math.max(0, Math.min(1, tItem.timeRemaining / Math.max(1, tItem.duration)));
        const badgeW = 148;
        const badgeH = 18;
        const badgeX = posX + (widgetW - badgeW) / 2;
        const badgeY = badgeBottomY - badgeH;

        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
        else ctx.rect(badgeX, badgeY, badgeW, badgeH);
        ctx.fillStyle = 'rgba(6, 20, 34, 0.92)';
        ctx.fill();

        ctx.strokeStyle = tItem.color;
        ctx.lineWidth = 1.0;
        ctx.stroke();

        ctx.fillStyle = tItem.color;
        ctx.fillRect(badgeX + 3, badgeY + badgeH - 3, (badgeW - 6) * ratio, 1.6);

        ctx.font = 'bold 8.5px monospace';
        ctx.fillStyle = tItem.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`[${tItem.short} AKTYWNY: ${timeLeft}S]`, badgeX + badgeW / 2, badgeY + badgeH / 2 - 1);

        badgeBottomY = badgeY - 4;
      }
    }
  }

  // 5. BANNER POWIADOMIENIA (ukryty w trakcie trybu celowania, by nie zasłaniał przycisku [ANULUJ X])
  if (!killstreakState.mortarTargeting) {
    drawKillstreakNotificationBanner(ctx, W, H, isMobile, uiAnim);
  }

  // 6. DUŻY CZERWONY CELOWNIK NALOTU + NAKŁADKA TRYBU CELOWANIA
  const pendingLaunch = killstreakState.mortarPendingLaunch;
  if (pendingLaunch && !killstreakState.mortarTargeting) {
    const spos = worldToScreen(pendingLaunch.targetX, pendingLaunch.targetY, globalCamera);
    const lockProg = 1 - Math.max(0, Math.min(1, pendingLaunch.timer / Math.max(0.01, pendingLaunch.totalDelay || 0.45)));
    drawBigRedMortarCrosshair(ctx, spos.x, spos.y, false, true, lockProg, pendingLaunch.targetX, W, H, isMobile);
  }

  if (killstreakState.mortarTargeting) {
    const cx = (typeof killstreakState.mortarCrosshairScreenX === 'number' && !isNaN(killstreakState.mortarCrosshairScreenX))
      ? killstreakState.mortarCrosshairScreenX
      : (W * 0.5);
    const cy = (typeof killstreakState.mortarCrosshairScreenY === 'number' && !isNaN(killstreakState.mortarCrosshairScreenY))
      ? killstreakState.mortarCrosshairScreenY
      : (H * 0.5);
    drawBigRedMortarCrosshair(ctx, cx, cy, !!killstreakState.mortarDragging, false, 0, killstreakState.mortarTargetX, W, H, isMobile);

    // A. Narożniki taktyczne na krawędziach ekranu (czerwone HUD brackets)
    const bLen = 22;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.72)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(12, 12 + bLen); ctx.lineTo(12, 12); ctx.lineTo(12 + bLen, 12);
    ctx.moveTo(W - 12 - bLen, 12); ctx.lineTo(W - 12, 12); ctx.lineTo(W - 12, 12 + bLen);
    ctx.moveTo(12, H - 12 - bLen); ctx.lineTo(12, H - 12); ctx.lineTo(12 + bLen, H - 12);
    ctx.moveTo(W - 12 - bLen, H - 12); ctx.lineTo(W - 12, H - 12); ctx.lineTo(W - 12, H - 12 - bLen);
    ctx.stroke();

    // B. Kompaktowy górny baner dowodzenia
    const bannerW = Math.min(350, W - 40);
    const bannerH = 38;
    const bannerX = (W - bannerW) / 2;
    const bannerY = 12;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 6);
    else ctx.rect(bannerX, bannerY, bannerW, bannerH);
    ctx.fill();

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.font = 'bold 10.5px monospace';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('[NAMIERZANIE NALOTU MOŹDZIERZOWEGO]', W / 2, bannerY + 13);

    ctx.font = 'bold 8.5px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(
      isMobile
        ? 'PRZYTRZYMAJ CELOWNIK, PRZESUŃ I PUŚĆ ABY ODPALIĆ'
        : 'PRZYTRZYMAJ LPM I PRZESUŃ CELOWNIK • PUŚĆ = ODPALENIE • [ESC] = ANULUJ',
      W / 2,
      bannerY + 27
    );

    // C. Dyskretny przycisk [ANULUJ X] pod bannerem
    const cancelW = isMobile ? 96 : 104;
    const cancelH = isMobile ? 28 : 26;
    const cancelX = Math.round((W - cancelW) / 2);
    const cancelY = bannerY + bannerH + 6;

    killstreakState.mortarCancelButtonBounds = { x: cancelX, y: cancelY, w: cancelW, h: cancelH };
    killstreakState.mortarPlayerButtonBounds = null;
    killstreakState.mortarConfirmButtonBounds = null;
    killstreakState.mortarLeftNavBounds = null;
    killstreakState.mortarRightNavBounds = null;

    ctx.fillStyle = 'rgba(30, 41, 59, 0.92)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cancelX, cancelY, cancelW, cancelH, 4);
    else ctx.rect(cancelX, cancelY, cancelW, cancelH);
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.72)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('[ANULUJ X]', cancelX + cancelW / 2, cancelY + cancelH / 2);
  } else {
    killstreakState.mortarCancelButtonBounds = null;
    killstreakState.mortarPlayerButtonBounds = null;
    killstreakState.mortarConfirmButtonBounds = null;
    killstreakState.mortarLeftNavBounds = null;
    killstreakState.mortarRightNavBounds = null;
  }

  ctx.restore();
}

function drawBigRedMortarCrosshair(ctx, cx, cy, isDragging, isLocked, lockProgress, targetX, W, H, isMobile) {
  const now = performance.now() * 0.001;
  const idlePulse = isDragging ? 0 : Math.sin(now * 5.0) * 3.0;
  const lockShrink = isLocked ? (1 - lockProgress * 0.26) : (isDragging ? 0.92 : 1.0);
  const outerR = ((isMobile ? 44 : 52) + idlePulse) * lockShrink;
  const innerR = ((isMobile ? 24 : 28) + idlePulse * 0.4) * lockShrink;
  const rot = isLocked ? (now * 4.2) : (isDragging ? (now * 1.4) : (now * 0.55));
  const mainRed = isLocked ? '#ff3b3b' : (isDragging ? '#ef4444' : '#f87171');

  ctx.save();
  ctx.translate(cx, cy);

  // Delikatne czerwone przyciemnienie wnętrza celownika
  ctx.fillStyle = isLocked ? 'rgba(239, 68, 68, 0.22)' : (isDragging ? 'rgba(239, 68, 68, 0.14)' : 'rgba(239, 68, 68, 0.08)');
  ctx.beginPath();
  ctx.arc(0, 0, outerR, 0, Math.PI * 2);
  ctx.fill();

  // Zewnętrzny segmentowany pierścień z ciemnym konturem (Dual-Stroke)
  ctx.save();
  ctx.rotate(rot);
  for (let pass = 0; pass < 2; pass++) {
    ctx.strokeStyle = pass === 0 ? 'rgba(10, 15, 26, 0.85)' : mainRed;
    ctx.lineWidth = pass === 0 ? 5.2 : 2.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let q = 0; q < 4; q++) {
      const a0 = q * (Math.PI / 2) + 0.22;
      const a1 = (q + 1) * (Math.PI / 2) - 0.22;
      ctx.moveTo(Math.cos(a0) * outerR, Math.sin(a0) * outerR);
      ctx.arc(0, 0, outerR, a0, a1);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Wewnętrzny cienki okrąg i krzyż celowniczy
  for (let pass = 0; pass < 2; pass++) {
    ctx.strokeStyle = pass === 0 ? 'rgba(10, 15, 26, 0.85)' : (isLocked ? '#ffffff' : mainRed);
    ctx.lineWidth = pass === 0 ? 4.2 : 2.0;
    ctx.beginPath();
    ctx.arc(0, 0, innerR, 0, Math.PI * 2);

    const armOuter = outerR + 12;
    const armInner = 11;
    // 4 ramiona krzyża
    ctx.moveTo(-armOuter, 0); ctx.lineTo(-armInner, 0);
    ctx.moveTo(armInner, 0); ctx.lineTo(armOuter, 0);
    ctx.moveTo(0, -armOuter); ctx.lineTo(0, -armInner);
    ctx.moveTo(0, armInner); ctx.lineTo(0, armOuter);
    ctx.stroke();
  }

  // Jasny punkt centralny
  ctx.fillStyle = '#0a0f1a';
  ctx.beginPath();
  ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(0, 0, 4.0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Etykieta pod celownikiem
  const labelY = (cy + outerR + 28 > H) ? -(outerR + 22) : (outerR + 20);
  const labelText = isLocked
    ? '[CEL ZABLOKOWANY // ODPALANIE]'
    : (isDragging
      ? `[CEL: ${Math.round((targetX || 0) / 40)}m • PUŚĆ ABY ODPALIĆ]`
      : '[PRZYTRZYMAJ I PRZESUŃ]');

  ctx.font = 'bold 9.5px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = 'rgba(5, 8, 16, 0.92)';
  ctx.lineWidth = 3.0;
  ctx.strokeText(labelText, 0, labelY);
  ctx.fillStyle = isLocked ? '#fecaca' : '#fca5a5';
  ctx.fillText(labelText, 0, labelY);

  ctx.restore();
}
