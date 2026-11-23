// =========================================================================
// MENUFIGHT/RENDERER.JS - KINOWY POTOK RENDEROWANIA TŁA MENU GŁÓWNEGO
// Czysty kadr bez HUD-a, bez pasków zdrowia, bez celowników i bez colliderów
// Dynamiczna zmiana aren (Arena 2 -> 3 -> 5) z poziomym przejściem w bok (Horizontal Slide)
// ZERO ctx.shadowBlur - Gwarancja 60 FPS
// =========================================================================

import { menuBots, menuFightState, ARENA_METADATA } from './state.js';
import { renderArenaBackground, renderArenaForeground } from '../renderer.js';
import { drawGround } from '../world/terrain.js';
import { drawObstacles } from '../obstacles.js';
import { drawParticles, drawJetpackParticles } from '../world/state.js';
import { drawBloodDecals, drawGore } from '../world/gore.js';
import { drawBullets, drawBurningEffects } from '../weapons.js';
import { drawProjectiles } from '../projectiles.js';
import { drawPlayer } from '../player/renderer.js';
import { drawShockwaves, drawLighting, drawCinematicVignette } from '../lighting/index.js';
import { getCanvasLogicalWidth, getCanvasLogicalHeight } from '../camera.js';

let shouldCaptureSnapshot = false;
let snapshotCanvas = null;

export function prepareTransitionSnapshot() {
  shouldCaptureSnapshot = true;
}

/**
 * Renderuje właściwą scenę aktywnej areny w przestrzeni świata
 */
function renderLiveArenaScene(ctx, camera) {
  const logicalWidth = (typeof getCanvasLogicalWidth === 'function') ? getCanvasLogicalWidth() : (window.innerWidth || 1920);
  const currentArenaId = menuFightState.arenaId || 'ARENA_2';
  const meta = ARENA_METADATA[currentArenaId] || ARENA_METADATA.ARENA_2;
  const effectiveGroundY = meta.deathY + 100;

  // 1. Tło areny (automatycznie renderuje tło bieżącej mapy)
  renderArenaBackground(ctx, camera);

  // 2. Transformacja kamery w przestrzeni świata (statyczny, precyzyjny kadr)
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  const worldLeft = camera.x;
  const worldRight = camera.x + (camera.viewWidth || (logicalWidth / camera.zoom));
  const worldWidth = worldRight - worldLeft;

  // 3. Podłoże i platformy areny (rysowane przed postaciami, aby boty stały na widocznym podłożu)
  if (currentArenaId !== 'ARENA_2' && currentArenaId !== 'ARENA_3' && currentArenaId !== 'ARENA_5') {
    drawGround(ctx, worldLeft, worldWidth);
  }
  drawObstacles(ctx, effectiveGroundY);
  renderArenaForeground(ctx, camera);

  // 4. Cząsteczki otoczenia, dym, pył i plamy krwi na podłożu
  drawParticles(ctx);
  drawBloodDecals(ctx);

  // 5. Smugi pocisków i rakiety RPG z dymem silnika marszowego
  drawBullets(ctx);
  drawProjectiles(ctx);

  // 6. Postacie botów bojowych stojące stabilnie na platformach
  // ZAKAZ rysowania HUD-a, pasków HP, nicków ani znaczników
  for (let i = 0; i < menuBots.length; i++) {
    const b = menuBots[i];
    if (b && !b.isDead) {
      drawPlayer(ctx, effectiveGroundY, b);
    }
  }

  // Efekty płonących postaci w tle menu
  drawBurningEffects(ctx, menuBots, null);

  // 7. Cząsteczki krwi w locie, łuski i ogień jetpacka
  drawGore(ctx);
  drawJetpackParticles(ctx);

  // 8. Fale uderzeniowe eksplozji i dynamiczne rozbłyski wystrzałów (tryb lighter)
  drawShockwaves(ctx, camera);
  drawLighting(ctx, camera, currentArenaId);

  ctx.restore();
}

/**
 * Renderuje spektakularne, kinowe tło walki botów z płynnym przesunięciem w bok ekranu
 */
export function drawMenuFight(ctx, camera) {
  if (!ctx || !camera) return;

  const canvasWidth = (typeof getCanvasLogicalWidth === 'function') ? getCanvasLogicalWidth() : ctx.canvas.width;
  const canvasHeight = (typeof getCanvasLogicalHeight === 'function') ? getCanvasLogicalHeight() : ctx.canvas.height;

  // Przechwycenie klatki poprzedniej areny do zrzutu przejścia w bok
  if (shouldCaptureSnapshot) {
    if (!snapshotCanvas) {
      snapshotCanvas = document.createElement('canvas');
    }
    if (snapshotCanvas.width !== canvasWidth || snapshotCanvas.height !== canvasHeight) {
      snapshotCanvas.width = canvasWidth;
      snapshotCanvas.height = canvasHeight;
    }
    const sCtx = snapshotCanvas.getContext('2d');
    sCtx.drawImage(ctx.canvas, 0, 0, canvasWidth, canvasHeight);
    shouldCaptureSnapshot = false;
  }

  // Żelazna gwarancja 60 FPS w Chrome - całkowita eliminacja kosztownego shadowBlur
  ctx.shadowBlur = 0;

  if (menuFightState.transitionPhase === 'SLIDE' && snapshotCanvas) {
    // -----------------------------------------------------------------------
    // PŁYNNE PRZEJŚCIE W BOK EKRANU (HORIZONTAL SLIDE TRANSITION)
    // -----------------------------------------------------------------------
    const progress = Math.min(1.0, menuFightState.transitionTimer / menuFightState.transitionDuration);
    // Aksamitna, kinowa krzywa Ease-In-Out (Cosine) gwarantująca miękki start i hamowanie
    const ease = 0.5 * (1 - Math.cos(progress * Math.PI));

    const dir = menuFightState.slideDir || 1;
    // Współrzędna pionowej linii łączenia (seam)
    const seamX = (dir > 0) 
      ? (1 - ease) * canvasWidth 
      : ease * canvasWidth;

    // 1. Rysowanie wchodzącej, nowej areny na żywo w jej obszarze
    ctx.save();
    ctx.beginPath();
    if (dir > 0) {
      ctx.rect(seamX, 0, canvasWidth - seamX, canvasHeight);
      ctx.clip();
      ctx.translate(seamX, 0);
    } else {
      ctx.rect(0, 0, seamX, canvasHeight);
      ctx.clip();
      ctx.translate(seamX - canvasWidth, 0);
    }
    renderLiveArenaScene(ctx, camera);
    ctx.restore();

    // 2. Rysowanie ustępującej, starej areny (zrzut z bufora snapshotu)
    ctx.save();
    ctx.beginPath();
    if (dir > 0) {
      ctx.rect(0, 0, seamX, canvasHeight);
      ctx.clip();
      ctx.drawImage(snapshotCanvas, seamX - canvasWidth, 0, canvasWidth, canvasHeight);
    } else {
      ctx.rect(seamX, 0, canvasWidth - seamX, canvasHeight);
      ctx.clip();
      ctx.drawImage(snapshotCanvas, seamX, 0, canvasWidth, canvasHeight);
    }
    ctx.restore();

    // 3. Pionowy taktyczny promień laserowy na krawędzi przesuwania (Seam Line)
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#00e5ff';
    ctx.beginPath();
    ctx.moveTo(seamX, 0);
    ctx.lineTo(seamX, canvasHeight);
    ctx.stroke();

    // Poboczne subtelne linie poświaty
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(seamX - 2, 0);
    ctx.lineTo(seamX - 2, canvasHeight);
    ctx.moveTo(seamX + 2, 0);
    ctx.lineTo(seamX + 2, canvasHeight);
    ctx.stroke();

    // Holograficzny wskaźnik sektora na linii łączenia
    const badgeW = 220;
    const badgeH = 26;
    const badgeY = canvasHeight * 0.12;
    const badgeX = Math.max(10, Math.min(canvasWidth - badgeW - 10, seamX - badgeW * 0.5));
    ctx.fillStyle = 'rgba(8, 14, 26, 0.88)';
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
    ctx.strokeStyle = '#00e5ff';
    ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

    const currentMeta = ARENA_METADATA[menuFightState.arenaId] || ARENA_METADATA.ARENA_2;
    ctx.fillStyle = '#00e5ff';
    ctx.font = '700 9px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`SECTOR SWITCH // ${currentMeta.shortTag}`, badgeX + badgeW * 0.5, badgeY + badgeH * 0.5);
    ctx.restore();

  } else {
    // -----------------------------------------------------------------------
    // STANDARDOWY KADR WALKI NA ŻYWO
    // -----------------------------------------------------------------------
    renderLiveArenaScene(ctx, camera);
  }

  // Winieta kinowa na krawędziach ekranu
  ctx.shadowBlur = 0;
  drawCinematicVignette(ctx);
}
