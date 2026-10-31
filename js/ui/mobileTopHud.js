// =========================================================================
// UI/MOBILETOPHUD.JS - 1-LINIOWY ULTRA-KOMPAKTOWY STATUS BAR DLA URZĄDZEŃ MOBILNYCH
// Uwalnia ponad 100px pionowego pola widzenia w lewym górnym rogu ekranu!
// Zero emojis, czysta typografia militarna, wyłącznie wskaźnik HP + Pancerz
// =========================================================================

/**
 * Rysuje ultra-kompaktowy pasek statusu dla ekranów mobilnych (tylko HP + Pancerz)
 * Wysokość: zaledwie 15px na y = 6px.
 */
export function drawMobileTopLeftHUD(ctx, player, hudX, hudY, options = {}) {
  if (!ctx || !player) return;

  const maxHp = player.maxHp || 100;
  const curHp = Math.max(0, player.hp ?? 100);
  const hpRatio = Math.max(0, Math.min(1, curHp / maxHp));
  const trailRatio = options.trailRatio !== undefined ? options.trailRatio : hpRatio;
  const hpBorderCol = options.hpBorderCol || '#22c55e';

  const hasVest = !!(player.hasVest && (player.vestHp || 0) > 0);
  const vestHp = Math.max(0, player.vestHp || 0);
  const vestMaxHp = player.vestMaxHp || 60;
  const vestRatio = Math.max(0, Math.min(1.0, vestHp / vestMaxHp));
  const hasHelmet = !!(player.hasHelmet || player.visuals?.hasHelmet);

  const hpBoxX = hudX;
  const hpBoxW = 72;
  const hpBoxH = 15;

  // 1. TŁO I WYPEŁNIENIE MODUŁU HP
  ctx.beginPath();
  ctx.fillStyle = 'rgba(6, 12, 22, 0.70)';
  if (ctx.roundRect) ctx.roundRect(hpBoxX, hudY, hpBoxW, hpBoxH, 3);
  else ctx.rect(hpBoxX, hudY, hpBoxW, hpBoxH);
  ctx.fill();

  // Ślad obrażeń
  if (trailRatio > hpRatio + 0.005) {
    const trailW = Math.max(2, (hpBoxW - 2) * trailRatio);
    ctx.fillStyle = '#fb7185';
    ctx.fillRect(hpBoxX + 1, hudY + 1, trailW, hpBoxH - 2);
  }

  // Właściwe wypełnienie aktualnego HP
  if (hpRatio > 0) {
    const fillW = Math.max(2, (hpBoxW - 2) * hpRatio);
    let hpColor = '#22c55e';
    if (hpRatio <= 0.25) hpColor = '#ef4444';
    else if (hpRatio <= 0.55) hpColor = '#f59e0b';

    ctx.fillStyle = hpColor;
    ctx.fillRect(hpBoxX + 1, hudY + 1, fillW, hpBoxH - 2);
  }

  // Pancerz kamizelki: zintegrowany błękitny pasek (2px) na samej górze HP
  if (hasVest && vestRatio > 0) {
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(hpBoxX + 1, hudY + 1, (hpBoxW - 2) * vestRatio, 2);
  }

  // Obramowanie modułu HP
  ctx.strokeStyle = hasVest ? '#0284c7' : (hasHelmet ? '#06b6d4' : hpBorderCol);
  ctx.lineWidth = 1.0;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(hpBoxX, hudY, hpBoxW, hpBoxH, 3);
    ctx.stroke();
  } else {
    ctx.strokeRect(hpBoxX, hudY, hpBoxW, hpBoxH);
  }

  // Tekst HP wewnątrz
  ctx.save();
  ctx.font = '900 8.5px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 3;
  const vestIcon = hasVest ? '+' : (hasHelmet ? '^' : '');
  ctx.fillText(`HP ${Math.round(curHp)}${vestIcon}`, hpBoxX + 4, hudY + hpBoxH / 2 + 0.5);
  ctx.restore();
}
