// =========================================================================
// ZOMBIE/RENDERER.JS - PROCEDURY RYSOWANIA ZOMBIE, CIAŁ I HUD-U INFEKCJI
// Pełna integracja z potokiem rysowania sylwetki postaci (drawPlayer).
// Zombie zachowują tożsamość poległego żołnierza (klasę, mundur, hełm,
// kamizelkę, buty, fryzurę), z martwiczym odcieniem skóry, ranami postrzałowymi,
// krwawiącą szczęką i żółtymi ślepiami.
// =========================================================================

import { zombieState, ZOMBIE_CONFIG } from './state.js';
import { drawPlayer } from '../player/renderer.js';

/**
 * Rysuje taktyczne wskaźniki statusu nad reanimującym się ciałem
 */
function drawCorpseOverlay(ctx, corpse, floorY) {
  const cx = corpse.x + (corpse.w || 24) * 0.5;

  // Drobne zarodniki/iskry nekrotyczne tuż przed powstaniem
  if (corpse.timer <= 1.2) {
    ctx.save();
    ctx.fillStyle = 'rgba(74, 222, 128, 0.65)';
    ctx.beginPath();
    ctx.arc(cx + Math.sin(Date.now() * 0.02) * 8, floorY - 18, 2.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Wskaźnik zbliżającej się reanimacji
  if (corpse.timer > 0) {
    ctx.save();
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 2.0;
    ctx.fillStyle = '#22c55e';
    const txt = `[INFEKCJA: ${Math.ceil(corpse.timer)}s]`;
    ctx.strokeText(txt, cx, floorY - 22);
    ctx.fillText(txt, cx, floorY - 22);
    ctx.restore();
  }
}

/**
 * Rysuje taktyczne wskaźniki statusu nad powalonym lub aktywnym zombie
 */
function drawZombieOverlay(ctx, z, floorY) {
  const cx = z.x + (z.w || 34) * 0.5;

  // Stan powalenia / oczekiwania na ponowne powstanie
  if (z.isDead) {
    if (z.hasHead && !z.decapitated && z.reviveTimer > 0) {
      ctx.save();
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#050810';
      ctx.lineWidth = 2.5;
      ctx.fillStyle = '#ef4444';
      const txt = `WSTANIE ZA: ${Math.ceil(z.reviveTimer)}s`;
      ctx.strokeText(txt, cx, floorY - 24);
      ctx.fillText(txt, cx, floorY - 24);

      // Pasek zdrowia powalonego ciała (downedHp) – widoczny feedback przy dobitce
      const curDownedHp = (typeof z.downedHp === 'number') ? z.downedHp : 60;
      const maxDownedHp = z.maxDownedHp || 60;
      if (curDownedHp < maxDownedHp) {
        const barW = 24;
        const barH = 3;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(cx - barW * 0.5, floorY - 18, barW, barH);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(cx - barW * 0.5, floorY - 18, Math.max(0, barW * (curDownedHp / maxDownedHp)), barH);
      }
      ctx.restore();
    }
    return;
  }

  // Pasek zdrowia rannego zombie (natychmiastowy feedback trafienia kulą)
  if (z.hp < z.maxHp && z.hp > 0) {
    ctx.save();
    const hpRatio = Math.max(0, z.hp / z.maxHp);
    const barW = 22;
    const barH = 3.5;
    const topY = z.y - 8;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(cx - barW * 0.5, topY, barW, barH);
    ctx.fillStyle = hpRatio > 0.4 ? '#22c55e' : '#ef4444';
    ctx.fillRect(cx - barW * 0.5, topY, barW * hpRatio, barH);
    ctx.restore();
  }
}

/**
 * Główna procedura rysowania jednostek zombie i ciał na świecie gry
 */
export function drawZombieSystem(ctx, camera) {
  if (!zombieState.enabled) return;

  const viewLeft = camera.x - 120;
  const viewRight = camera.x + (camera.viewWidth || (window.innerWidth / (camera.zoom || 0.6))) + 120;

  // 1. Rysowanie reanimujących się ciał poległych postaci
  for (const corpse of zombieState.corpses) {
    if (corpse.x < viewLeft || corpse.x > viewRight) continue;
    const floorY = corpse.feetY || corpse.groundY || (corpse.y + (corpse.h || 70));
    drawPlayer(ctx, floorY, corpse);
    drawCorpseOverlay(ctx, corpse, floorY);
  }

  // 2. Rysowanie aktywnych oraz powalonych zombie
  for (const z of zombieState.zombies) {
    if (z.x < viewLeft || z.x > viewRight) continue;
    const floorY = (typeof z.groundY === 'number') ? z.groundY : (z.y + (z.h || 68));
    drawPlayer(ctx, floorY, z);
    drawZombieOverlay(ctx, z, floorY);
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
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#052e16';
  ctx.strokeText(text, w / 2, 88);
  ctx.fillStyle = '#22c55e';
  ctx.fillText(text, w / 2, 88);

  ctx.restore();
}
