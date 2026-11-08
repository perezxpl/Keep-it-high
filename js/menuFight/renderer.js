// =========================================================================
// MENUFIGHT/RENDERER.JS - KINOWY POTOK RENDEROWANIA TŁA MENU GŁÓWNEGO
// Czysty kadr bez HUD-a, bez pasków zdrowia, bez celowników i bez colliderów
// Arena 2 (Toksyczna Rafineria): monumentalna turbina, rurociągi, platformy, tafla kwasu
// Pełne animacje postaci, smugi pocisków, łuski, dym, wybuchy i rozbłyski
// ZERO ctx.shadowBlur - Gwarancja 60 FPS
// =========================================================================

import { menuBots } from './state.js';
import { renderArenaBackground, renderArenaForeground } from '../renderer.js';
import { drawGround } from '../world/terrain.js';
import { drawObstacles } from '../obstacles.js';
import { drawParticles, drawJetpackParticles } from '../world/state.js';
import { drawBloodDecals, drawGore } from '../world/gore.js';
import { drawBullets } from '../weapons.js';
import { drawProjectiles } from '../projectiles.js';
import { drawPlayer } from '../player/renderer.js';
import { drawShockwaves, drawLighting, drawCinematicVignette } from '../lighting/index.js';
import { activeArenaId } from '../obstacles.js';

/**
 * Renderuje spektakularne, kinowe tło walki botów w czasie rzeczywistym
 */
export function drawMenuFight(ctx, camera) {
  if (!ctx || !camera) return;

  const canvas = ctx.canvas;
  const cWidth = canvas ? (canvas.width || 1920) : 1920;
  const cHeight = canvas ? (canvas.height || 1080) : 1080;
  const effectiveGroundY = 1600;

  // Żelazna gwarancja 60 FPS w Chrome - całkowita eliminacja kosztownego shadowBlur
  ctx.shadowBlur = 0;

  // 1. Tło areny (panorama, betonowo-stalowy bunkier, rurociągi, monumentalny wentylator)
  renderArenaBackground(ctx, camera);

  // 2. Transformacja kamery w przestrzeni świata (statyczny kadr)
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  const worldLeft = camera.x;
  const worldRight = camera.x + (camera.viewWidth || (cWidth / camera.zoom));
  const worldWidth = worldRight - worldLeft;

  // 3. Podłoże i platformy
  drawGround(ctx, worldLeft, worldWidth);
  drawObstacles(ctx, effectiveGroundY);

  // 4. Cząsteczki otoczenia, dym, pył i plamy krwi na podłożu
  drawParticles(ctx);
  drawBloodDecals(ctx);

  // 5. Smugi pocisków (tracers) i rakiety RPG z dymem silnika marszowego
  drawBullets(ctx);
  drawProjectiles(ctx);

  // 6. Postacie botów bojowych (pełne animacje Soldat 2.5D, IK, broń, jetpack)
  // ZAKAZ rysowania HUD-a, pasków HP, nicków ani znaczników
  for (let i = 0; i < menuBots.length; i++) {
    const b = menuBots[i];
    if (b) {
      drawPlayer(ctx, effectiveGroundY, b);
    }
  }

  // 7. Cząsteczki krwi w locie, łuski i ogień jetpacka
  drawGore(ctx);
  drawJetpackParticles(ctx);

  // 8. Elementy areny na pierwszym planie (kratownice, kładki, tafla kwasu i bąble)
  renderArenaForeground(ctx, camera);

  // 9. Fale uderzeniowe eksplozji i dynamiczne rozbłyski wystrzałów (tryb lighter)
  drawShockwaves(ctx, camera);
  drawLighting(ctx, camera, activeArenaId);

  ctx.restore();

  // 10. Kinowa winieta krawędzi ekranu
  ctx.shadowBlur = 0;
  drawCinematicVignette(ctx);
}
