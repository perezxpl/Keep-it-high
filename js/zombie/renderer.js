// =========================================================================
// ZOMBIE/RENDERER.JS - PROCEDURY RYSOWANIA ZOMBIE, CIAŁ I HUD-U INFEKCJI
// Pełna integracja z potokiem rysowania sylwetki postaci (drawPlayer).
// Zombie zachowują tożsamość poległego żołnierza (klasę, mundur, hełm,
// kamizelkę, buty, fryzurę), z martwiczym odcieniem skóry, ranami postrzałowymi,
// krwawiącą szczęką i żółtymi ślepiami.
// =========================================================================

import { zombieState, ZOMBIE_CONFIG, isZombieModeActive, resetZombieState } from './state.js';
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

  // Diagnostyka na żywo nad głową aktywnego zombie (?zdbg=1 w URL)
  const isZdbg = typeof window !== 'undefined' && window.location && window.location.search.includes('zdbg=1');
  if (isZdbg) {
    ctx.save();
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = '#facc15';
    const tag = `v505 R:${(z.reachBlend || 0).toFixed(1)} vx:${(z.vx || 0).toFixed(1)} A:${(z.pose?.armFrontSwing || 0).toFixed(2)}/${(z.pose?.armBackSwing || 0).toFixed(2)}`;
    const textY = z.y - 26;
    ctx.strokeText(tag, cx, textY);
    ctx.fillText(tag, cx, textY);
    ctx.restore();
  }
}

/**
 * Główna procedura rysowania jednostek zombie i ciał na świecie gry z pełnym Frustum Culling 2D
 */
export function drawZombieSystem(ctx, camera) {
  if (!isZombieModeActive()) {
    if (zombieState.zombies.length > 0 || zombieState.corpses.length > 0) {
      resetZombieState();
    }
    return;
  }

  if (zombieState.corpses.length === 0 && zombieState.zombies.length === 0) return;

  const viewWidth = camera.viewWidth || (window.innerWidth / (camera.zoom || 0.6));
  const viewHeight = camera.viewHeight || (window.innerHeight / (camera.zoom || 0.6));
  const viewLeft = camera.x - 60;
  const viewRight = camera.x + viewWidth + 60;
  const viewTop = camera.y - 60;
  const viewBottom = camera.y + viewHeight + 60;

  // 1. Rysowanie reanimujących się ciał poległych postaci z pełnym Frustum Culling 2D
  for (let i = 0; i < zombieState.corpses.length; i++) {
    const corpse = zombieState.corpses[i];
    const cw = corpse.w || 24;
    const ch = corpse.h || 70;
    if (corpse.x + cw < viewLeft || corpse.x > viewRight || corpse.y + ch < viewTop || corpse.y > viewBottom) {
      continue;
    }
    const floorY = corpse.feetY || corpse.groundY || (corpse.y + ch);
    drawPlayer(ctx, floorY, corpse);
    drawCorpseOverlay(ctx, corpse, floorY);
  }

  // 2. Rysowanie aktywnych oraz powalonych zombie z pełnym Frustum Culling 2D
  for (let i = 0; i < zombieState.zombies.length; i++) {
    const z = zombieState.zombies[i];
    const zw = z.w || 34;
    const zh = z.h || 70;
    if (z.x + zw < viewLeft || z.x > viewRight || z.y + zh < viewTop || z.y > viewBottom) {
      continue;
    }
    const floorY = (typeof z.groundY === 'number') ? z.groundY : (z.y + zh);
    drawPlayer(ctx, floorY, z);
    drawZombieOverlay(ctx, z, floorY);
  }
}

/**
 * Rysuje taktyczny licznik zarazy i winietę zakażenia w HUD bez dynamicznych gradientów
 */
export function drawZombieHUD(ctx) {
  if (!isZombieModeActive()) return;
  if (typeof window === 'undefined') return;

  const player = window.player;
  if (!player || !player.infected || player.isDead) return;

  const canvas = ctx.canvas;
  const w = canvas.width;
  const h = canvas.height;

  ctx.save();

  // Lekka winieta zakażenia obrysowa bez createRadialGradient
  const pulse = Math.sin(Date.now() * 0.005) * 0.15 + 0.50;
  ctx.strokeStyle = `rgba(20, 83, 45, ${pulse * 0.75})`;
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, w - 14, h - 14);

  // Żyłki na krawędziach ekranu (efekt skażenia krwi)
  ctx.strokeStyle = `rgba(34, 197, 94, ${pulse * 0.45})`;
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, w - 28, h - 28);

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
