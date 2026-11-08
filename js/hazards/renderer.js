// =========================================================================
// HAZARDS/RENDERER.JS - PROCEDURY RENDEROWANIA WYBUCHOWYCH BECZEK I KAŁUŻ
// Stylistyka: metalowe beczki przemysłowe z żebrami wzmacniającymi,
// pasami ostrzegawczymi, piktogramami ognia/toksyn oraz dymiącymi iskrami.
// Standard: 60 FPS, zero shadowBlur w pętli renderowania.
// =========================================================================

import { hazardsState } from './state.js';

/**
 * Rysuje piktogram ognia na beczce paliwowej
 */
function drawFlameIcon(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(size * 0.7, -size * 0.3, size * 0.5, size * 0.6);
  ctx.quadraticCurveTo(size * 0.2, size, 0, size);
  ctx.quadraticCurveTo(-size * 0.2, size, -size * 0.5, size * 0.6);
  ctx.quadraticCurveTo(-size * 0.7, -size * 0.3, 0, -size);
  ctx.fill();

  // Wewnętrzny rdzeń płomienia
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.5);
  ctx.quadraticCurveTo(size * 0.35, -size * 0.1, size * 0.25, size * 0.5);
  ctx.quadraticCurveTo(0, size * 0.8, 0, size * 0.8);
  ctx.quadraticCurveTo(-size * 0.25, size * 0.5, 0, -size * 0.5);
  ctx.fill();
  ctx.restore();
}

/**
 * Rysuje piktogram czaszki na beczce toksycznej
 */
function drawSkullIcon(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#f0fdf4';

  // Czerep
  ctx.beginPath();
  ctx.arc(0, -size * 0.2, size * 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Szczęka
  ctx.fillRect(-size * 0.35, size * 0.1, size * 0.7, size * 0.45);

  // Oczodoły
  ctx.fillStyle = '#14532d';
  ctx.beginPath();
  ctx.arc(-size * 0.25, -size * 0.15, size * 0.18, 0, Math.PI * 2);
  ctx.arc(size * 0.25, -size * 0.15, size * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Rysuje pojedynczą beczkę z obsługą rotacji
 */
function drawSingleBarrel(ctx, b) {
  const w = b.w;
  const h = b.h;
  const typeDef = b.typeDef;

  ctx.save();
  ctx.translate(b.x + w * 0.5, b.y + h * 0.5);
  if (b.angle) {
    ctx.rotate(b.angle);
  }

  const hw = w * 0.5;
  const hh = h * 0.5;

  // 1. Korpus beczki (lekko zaokrąglony po bokach)
  ctx.fillStyle = typeDef.color;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-hw, -hh, w, h, 3);
  } else {
    ctx.rect(-hw, -hh, w, h);
  }
  ctx.fill();

  // 2. Cieniowanie 3D (lewy jasny refleks, prawy ciemny cień)
  const grad = ctx.createLinearGradient(-hw, 0, hw, 0);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
  grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
  grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = grad;
  ctx.fillRect(-hw, -hh, w, h);

  // 3. Stalowe pierścienie wzmacniające (górny, środkowy, dolny)
  ctx.fillStyle = typeDef.rimColor || '#18181b';
  ctx.fillRect(-hw - 1, -hh + 3, w + 2, 4);
  ctx.fillRect(-hw - 1, -2, w + 2, 4);
  ctx.fillRect(-hw - 1, hh - 7, w + 2, 4);

  // 4. Centralny żółty pas ostrzegawczy z piktogramem
  ctx.fillStyle = '#eab308';
  ctx.fillRect(-hw, -hh * 0.35, w, hh * 0.7);

  // Skośne czarne paski ostrzegawcze na krawędziach
  ctx.fillStyle = '#09090b';
  ctx.fillRect(-hw + 1, -hh * 0.35, 4, hh * 0.7);
  ctx.fillRect(hw - 5, -hh * 0.35, 4, hh * 0.7);

  // Piktogram na środku
  if (typeDef.hazardSign === 'FIRE') {
    drawFlameIcon(ctx, 0, 0, 5);
  } else {
    drawSkullIcon(ctx, 0, 0, 4);
  }

  // 5. Pokrywa górna (korek wlewu paliwa)
  ctx.fillStyle = '#27272a';
  ctx.fillRect(-hw * 0.3, -hh - 2, hw * 0.6, 2);

  // 6. Efekt uszkodzenia / syczenia lontu przed detonacją
  if (b.fuseTimer > 0 || b.hp < b.maxHp) {
    const sparkPulse = Math.sin(Date.now() * 0.03);
    ctx.fillStyle = sparkPulse > 0 ? '#f97316' : '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -hh - 3, 2.5 + Math.abs(sparkPulse) * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Rysuje kałuże rozlanego kwasu na podłożu
 */
function drawAcidPools(ctx) {
  for (const pool of hazardsState.acidPools) {
    const alpha = Math.min(1.0, pool.timer / 1.5) * 0.75;
    ctx.save();
    ctx.translate(pool.x, pool.y);

    // Zielona pulsująca plama
    const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, pool.radius);
    grad.addColorStop(0, `rgba(74, 222, 128, ${alpha})`);
    grad.addColorStop(0.65, `rgba(22, 163, 74, ${alpha * 0.75})`);
    grad.addColorStop(1, 'rgba(20, 83, 45, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, pool.radius, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Drobne bąble kwasu na powierzchni
    ctx.fillStyle = `rgba(187, 247, 208, ${alpha * 0.9})`;
    for (let j = 0; j < 4; j++) {
      const bx = Math.sin(pool.bubbleAnim + j * 1.8) * (pool.radius * 0.65);
      const by = Math.cos(pool.bubbleAnim * 0.8 + j) * 3;
      ctx.beginPath();
      ctx.arc(bx, by - 2, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

/**
 * Główna procedura renderowania zagrożeń na świecie gry
 */
export function drawHazards(ctx, camera) {
  const viewLeft = camera.x - 120;
  const viewRight = camera.x + (camera.viewWidth || (window.innerWidth / (camera.zoom || 0.6))) + 120;

  // 1. Kałuże kwasu na podłożu (renderowane pod beczkami)
  drawAcidPools(ctx);

  // 2. Aktywne beczki
  for (const b of hazardsState.barrels) {
    if (b.x < viewLeft || b.x > viewRight) continue;
    drawSingleBarrel(ctx, b);
  }
}
