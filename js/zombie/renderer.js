// =========================================================================
// ZOMBIE/RENDERER.JS - PROCEDURY RYSOWANIA ZOMBIE, CIAŁ I HUD-U INFEKCJI
// Stylistyka: zgniło-zielonkawa skóra, świecące żółte oczy, zgarbiona poza,
// wyciągnięte ramiona w stylu klasycznego horroru oraz kinowa winieta zakażenia.
// =========================================================================

import { zombieState, ZOMBIE_CONFIG } from './state.js';

/**
 * Rysuje pojedyncze leżące ciało przygotowujące się do reanimacji
 */
function drawReanimatingCorpse(ctx, corpse) {
  ctx.save();
  ctx.translate(corpse.x, corpse.y + (corpse.twitch || 0));

  // Kałuża krwi pod ciałem
  ctx.fillStyle = 'rgba(127, 29, 29, 0.7)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Leżący tułów
  ctx.fillStyle = corpse.visuals.shirtColor || '#3f3f46';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-16, -10, 32, 10, 3);
  } else {
    ctx.rect(-16, -10, 32, 10);
  }
  ctx.fill();

  // Leżące nogi
  ctx.fillStyle = corpse.visuals.pantsColor || '#27272a';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(corpse.facing > 0 ? -30 : 2, -7, 24, 7, 2);
  } else {
    ctx.rect(corpse.facing > 0 ? -30 : 2, -7, 24, 7);
  }
  ctx.fill();

  // Głowa
  if (corpse.hasHead && !corpse.decapitated) {
    ctx.fillStyle = '#4d6850';
    ctx.beginPath();
    ctx.arc(corpse.facing > 0 ? 18 : -18, -6, 7, 0, Math.PI * 2);
    ctx.fill();

    // Włosy
    ctx.fillStyle = corpse.visuals.hairColor || '#18181b';
    ctx.beginPath();
    ctx.arc(corpse.facing > 0 ? 18 : -18, -8, 7, Math.PI, Math.PI * 2);
    ctx.fill();
  }

  // Wskaźnik zbliżającej się reanimacji (drobny dym/iskry w ostatnich chwilach)
  if (corpse.timer <= 1.2) {
    ctx.fillStyle = 'rgba(74, 222, 128, 0.6)';
    ctx.beginPath();
    ctx.arc(Math.sin(Date.now() * 0.02) * 8, -14, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Rysuje sylwetkę aktywnego zombie (chód, ramiona wyciągnięte w przód, świecące oczy)
 */
function drawZombieSilhouette(ctx, z) {
  ctx.save();

  const centerX = z.x + z.w * 0.5;
  const feetY = z.y + z.h;
  const facing = z.facing || 1;

  // --- FAZA POWALENIA / ŚMIERCI ZOMBIE ---
  if (z.isDead) {
    ctx.translate(centerX, feetY);

    // Kałuża krwi pod powalonym ciałem
    ctx.fillStyle = 'rgba(127, 29, 29, 0.7)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Leżący tułów
    ctx.fillStyle = z.visuals.shirtColor || '#3f3f46';
    ctx.fillRect(-16, -10, 32, 10);

    // Leżące nogi
    ctx.fillStyle = z.visuals.pantsColor || '#27272a';
    ctx.fillRect(facing > 0 ? -30 : 2, -7, 24, 7);

    // Głowa (jeśli nie została odcięta)
    if (z.hasHead && !z.decapitated) {
      ctx.fillStyle = z.visuals.skinColor;
      ctx.beginPath();
      ctx.arc(facing > 0 ? 18 : -18, -6, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(facing > 0 ? 14 : -18, -8, 6, 4);
    }

    ctx.restore();
    return;
  }

  // --- FAZA WSTAWANIA Z ZIEMI ---
  if (z.riseTimer > 0) {
    const progress = 1 - (z.riseTimer / 1.4); // 0 -> leży, 1 -> stoi
    const curH = 20 + 50 * progress;
    ctx.translate(centerX, feetY);

    // Krew pod wstającym zombie
    ctx.fillStyle = 'rgba(120, 25, 25, 0.7)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Zgarbione ciało unoszące się w górę
    ctx.fillStyle = z.visuals.pantsColor;
    ctx.fillRect(-8, -curH * 0.5, 16, curH * 0.5);

    ctx.fillStyle = z.visuals.shirtColor;
    ctx.fillRect(-9, -curH, 18, curH * 0.55);

    // Głowa
    if (z.hasHead && !z.decapitated) {
      ctx.fillStyle = z.visuals.skinColor;
      ctx.beginPath();
      ctx.arc(facing * 3, -curH - 4, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // --- NORMALNY CZŁAPIĄCY ZOMBIE ---
  ctx.translate(centerX, feetY);

  const walkCycle = z.walkAnim || 0;
  const isMoving = Math.abs(z.vx || 0) > 0.1;

  // Asymetryczny, powłóczący krok zombie
  const legFrontAngle = isMoving ? Math.sin(walkCycle) * 0.45 : 0.1;
  const legBackAngle = isMoving ? -Math.sin(walkCycle) * 0.35 : -0.1;

  // 1. TYLNA NOGA
  ctx.save();
  ctx.translate(-4 * facing, -28);
  ctx.rotate(legBackAngle);
  ctx.fillStyle = z.visuals.pantsColor;
  ctx.fillRect(-3, 0, 6, 28);
  // But
  ctx.fillStyle = '#09090b';
  ctx.fillRect(-4, 25, 9 * facing, 5);
  ctx.restore();

  // 2. PRZEDNIA NOGA
  ctx.save();
  ctx.translate(4 * facing, -28);
  ctx.rotate(legFrontAngle);
  ctx.fillStyle = z.visuals.pantsColor;
  ctx.fillRect(-3.5, 0, 7, 28);
  // But
  ctx.fillStyle = '#09090b';
  ctx.fillRect(-4, 25, 10 * facing, 5);
  ctx.restore();

  // 3. TUŁÓW (Zgarbiony do przodu)
  const torsoTilt = 0.20 * facing;
  ctx.save();
  ctx.translate(0, -30);
  ctx.rotate(torsoTilt);

  ctx.fillStyle = z.visuals.shirtColor;
  ctx.fillRect(-8, -26, 16, 26);

  // Plamy krwi i rozdarcia na ubraniu
  ctx.fillStyle = 'rgba(127, 29, 29, 0.85)';
  ctx.fillRect(-4, -20, 8, 10);

  // 4. TYLNE RAMIĘ (Wyciągnięte do przodu)
  ctx.save();
  ctx.translate(-6 * facing, -23);
  const armBackSwing = 1.35 * facing + (z.attackAnim > 0 ? 0.35 * facing : 0);
  ctx.rotate(armBackSwing);
  ctx.fillStyle = z.visuals.shirtColor;
  ctx.fillRect(-3, 0, 6, 13);
  ctx.fillStyle = z.visuals.skinColor;
  ctx.fillRect(-2.5, 12, 5, 12);
  // Dłoń z pazurami
  ctx.fillStyle = '#344634';
  ctx.fillRect(-3, 23, 6, 4);
  ctx.restore();

  // 5. GŁOWA ZOMBIE
  if (z.hasHead && !z.decapitated) {
    ctx.save();
    ctx.translate(facing * 3, -28);
    ctx.rotate(0.15 * facing);

    // Twarz (zielonkawa martwa skóra)
    ctx.fillStyle = z.visuals.skinColor;
    ctx.beginPath();
    ctx.arc(0, -7, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // Włosy
    ctx.fillStyle = z.visuals.hairColor;
    ctx.beginPath();
    ctx.arc(0, -8, 7.5, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();

    // Szczęka / zakrwawione usta
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(facing > 0 ? 1 : -5, -4, 4, 3);

    // Świecące, żółte martwe oko
    ctx.fillStyle = z.visuals.eyeColor;
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(facing * 4, -7, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  } else {
    // Odcięta głowa (kikut szyi z krwią)
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(-4, -28, 8, 4);
  }

  // 6. PRZEDNIE RAMIĘ (Wyciągnięte agresywnie w przód)
  ctx.save();
  ctx.translate(6 * facing, -23);
  const armFrontSwing = 1.50 * facing + (z.attackAnim > 0 ? 0.40 * facing : 0);
  ctx.rotate(armFrontSwing);
  ctx.fillStyle = z.visuals.shirtColor;
  ctx.fillRect(-3.5, 0, 7, 14);
  ctx.fillStyle = z.visuals.skinColor;
  ctx.fillRect(-3, 13, 6, 13);
  // Dłoń / szpony
  ctx.fillStyle = '#344634';
  ctx.fillRect(-3.5, 25, 7, 5);
  ctx.restore();

  ctx.restore(); // Tułów
  ctx.restore(); // Całość
}

/**
 * Główna procedura rysowania jednostek zombie i ciał na świecie gry
 */
export function drawZombieSystem(ctx, camera) {
  if (!zombieState.enabled) return;

  const viewLeft = camera.x - 100;
  const viewRight = camera.x + (camera.viewWidth || (window.innerWidth / (camera.zoom || 0.6))) + 100;

  // 1. Rysowanie reanimujących się ciał
  for (const corpse of zombieState.corpses) {
    if (corpse.x < viewLeft || corpse.x > viewRight) continue;
    drawReanimatingCorpse(ctx, corpse);
  }

  // 2. Rysowanie aktywnych i powalonych zombie
  for (const z of zombieState.zombies) {
    if (z.x < viewLeft || z.x > viewRight) continue;
    drawZombieSilhouette(ctx, z);
  }
}

/**
 * Rysuje kinową winietę zakażenia i taktyczny licznik zarazy w HUD
 */
export function drawZombieHUD(ctx) {
  if (typeof window === 'undefined') return;

  const player = window.player;
  if (!player || !player.infected || player.isDead) return;

  const canvas = ctx.canvas;
  const w = canvas.width;
  const h = canvas.height;

  ctx.save();

  // Pulsująca zielona winieta na obrzeżach ekranu
  const pulse = Math.sin(Date.now() * 0.005) * 0.15 + 0.50;
  const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.85);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(0.65, `rgba(20, 83, 45, ${pulse * 0.45})`);
  grad.addColorStop(1.0, `rgba(5, 46, 22, ${pulse * 0.85})`);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Żyłki na krawędziach ekranu (efekt skażenia krwi)
  ctx.strokeStyle = `rgba(34, 197, 94, ${pulse * 0.35})`;
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, w - 8, h - 8);

  // Baner ostrzegawczy infekcji
  const timeLeft = Math.max(1, Math.ceil((player.hp || 10) / ZOMBIE_CONFIG.INFECTION_DPS));
  const text = `[ZAKAŻENIE WIRUSEM] ZEGAR ZARAZY: ${timeLeft}s | ZNAJDŹ ZRZUT ANTYDOTUM!`;

  ctx.font = 'bold 13px Rajdhani, monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#22c55e';
  ctx.shadowColor = '#15803d';
  ctx.shadowBlur = 8;
  ctx.fillText(text, w / 2, 88);

  ctx.restore();
}
