/**
 * UI/RANKHUD.JS - Wizualna prezentacja stopni wojskowych i punktów XP
 * Rysowanie w HUD podczas gry oraz obsługa nagród XP za wygrany mecz.
 */

import { getCurrentRank, getNextRank, getPlayerXP, getRankProgress, setXpNotificationCallback, setRankUpCallback } from '../progression.js';
import { drawRankBadge } from './rankBadges.js';

// Pływające powiadomienia o zyskanym XP w HUD
const floatingXpPopups = [];

export function spawnXpPopup(text, amount, color = '#facc15') {
  floatingXpPopups.push({
    text: text || `+${amount} XP`,
    amount,
    color,
    yOffset: 0,
    alpha: 1.0,
    life: 90
  });
}

// Rejestracja callbacku do wyświetlania pływających powiadomień XP z modułu progresji
setXpNotificationCallback(spawnXpPopup);

// Stan powiadomienia o awansie na nowy stopień wojskowy
export const rankUpAlertState = {
  active: false,
  rankId: 'SZEREGOWY',
  rankName: '',
  rankIcon: '',
  rewardText: '',
  timer: 0,
  maxTimer: 180
};

export function triggerRankUpAlert(rank) {
  if (!rank) return;
  rankUpAlertState.active = true;
  rankUpAlertState.rankId = rank.id || 'SZEREGOWY';
  rankUpAlertState.rankName = rank.name;
  rankUpAlertState.rankIcon = rank.icon;
  const labels = Array.isArray(rank.unlocks)
    ? rank.unlocks.map(u => (typeof u === 'string' ? u : (u?.label || u?.name || ''))).filter(Boolean)
    : [];
  rankUpAlertState.rewardText = labels.length > 0
    ? `ODBLOKOWANO: ${labels.join(' • ').toUpperCase()}`
    : 'NOWY TYTUŁ WOJSKOWY';
  rankUpAlertState.timer = 180;
}

setRankUpCallback(triggerRankUpAlert);

/**
 * Rysuje stopień wojskowy i pasek XP w lewym górnym rogu HUD
 */
export function drawRankHUD(ctx, x, y, width, isMobile) {
  if (typeof window !== 'undefined' && window.isMenuShowcase) return;
  const currentXp = getPlayerXP();
  const rank = getCurrentRank(currentXp);
  const nextRank = getNextRank(currentXp);
  const progress = getRankProgress(currentXp);

  ctx.save();

  const rankTextY = y;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // Ikona i stopień wojskowy ze sprite sheetu
  const badgeSize = isMobile ? 13 : 15;
  const badgeY = Math.round(rankTextY - badgeSize / 2);
  drawRankBadge(ctx, rank.id, x, badgeY, badgeSize, badgeSize);

  ctx.font = isMobile ? 'bold 9.5px monospace' : 'bold 10.5px monospace';
  ctx.shadowBlur = 0;
  // Ciemny twardy cień tekstu (Zero kosztu shadowBlur, stałe 60 FPS na Safari i Mali GPU)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
  ctx.fillText(rank.short.toUpperCase(), x + badgeSize + 5, rankTextY + 1);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(rank.short.toUpperCase(), x + badgeSize + 4, rankTextY);

  // Wartość XP po prawej stronie
  ctx.textAlign = 'right';
  ctx.font = isMobile ? 'bold 9px monospace' : 'bold 10px monospace';
  const xpStr = nextRank ? `${currentXp} / ${nextRank.minXp} XP` : `${currentXp} XP (MAX)`;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
  ctx.fillText(xpStr, x + width + 1, rankTextY + 1);
  ctx.fillStyle = '#facc15';
  ctx.fillText(xpStr, x + width, rankTextY);

  // Cienki, taktyczny pasek postępu XP
  const barY = rankTextY + (isMobile ? 7 : 8);
  const barH = isMobile ? 3 : 3.5;

  ctx.beginPath();
  ctx.fillStyle = 'rgba(6, 9, 17, 0.90)';
  if (ctx.roundRect) ctx.roundRect(x, barY, width, barH, 1.5);
  else ctx.rect(x, barY, width, barH);
  ctx.fill();

  if (progress > 0) {
    const fillW = Math.max(2, width * Math.min(1, progress));
    const grad = ctx.createLinearGradient(x, barY, x + fillW, barY);
    grad.addColorStop(0.0, '#00e5ff');
    grad.addColorStop(0.65, '#38bdf8');
    grad.addColorStop(1.0, '#facc15');

    ctx.beginPath();
    ctx.fillStyle = grad;
    if (ctx.roundRect) ctx.roundRect(x, barY, fillW, barH, 1.5);
    else ctx.rect(x, barY, fillW, barH);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 0.8;
  if (ctx.roundRect) ctx.roundRect(x, barY, width, barH, 1.5);
  else ctx.rect(x, barY, width, barH);
  ctx.stroke();

  // Podgląd nagrody za następny awans (Call of Duty Style)
  if (nextRank && Array.isArray(nextRank.unlocks) && nextRank.unlocks.length > 0) {
    const rawPreview = nextRank.unlocks[0];
    const previewLabel = typeof rawPreview === 'string' ? rawPreview : (rawPreview?.label || rawPreview?.name || '');
    if (previewLabel) {
      const rewardY = barY + barH + (isMobile ? 7 : 8);
      ctx.font = isMobile ? 'bold 7.5px monospace' : 'bold 8.5px monospace';
      ctx.textAlign = 'left';
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillText(`NAGRODA: ${previewLabel.toUpperCase()}`, x + 1, rewardY + 1);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`NAGRODA: ${previewLabel.toUpperCase()}`, x, rewardY);
    }
  }

  // Animacja unoszących się powiadomień XP
  for (let i = floatingXpPopups.length - 1; i >= 0; i--) {
    const p = floatingXpPopups[i];
    p.life--;
    p.yOffset -= 0.6;
    p.alpha = Math.max(0, p.life / 90);

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.font = isMobile ? '900 11px monospace' : '900 13px monospace';
    ctx.textAlign = 'right';
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000000';
    ctx.fillText(p.text, x + width + 1, barY + p.yOffset - 5);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, x + width, barY + p.yOffset - 6);
    ctx.restore();

    if (p.life <= 0) {
      floatingXpPopups.splice(i, 1);
    }
  }

  // Animacja baneru awansu rangi w centrum ekranu
  if (rankUpAlertState.active && rankUpAlertState.timer > 0) {
    rankUpAlertState.timer--;
    if (rankUpAlertState.timer <= 0) {
      rankUpAlertState.active = false;
    } else {
      const sw = typeof window !== 'undefined' ? window.innerWidth : 800;
      const alpha = Math.min(1.0, rankUpAlertState.timer / 25);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (isMobile) {
        // Wariant mobilny: jednolinijkowa mikro-pigułka awansu na górze ekranu
        const bw = Math.min(250, sw - 40);
        const bh = 20;
        const bx = Math.round((sw - bw) / 2);
        const by = 28;

        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 4);
        else ctx.rect(bx, by, bw, bh);
        ctx.fillStyle = 'rgba(8, 20, 36, 0.85)';
        ctx.fill();

        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 0.9;
        ctx.stroke();

        const alertBadgeSize = 14;
        const alertBadgeX = bx + 6;
        const alertBadgeY = Math.round(by + (bh - alertBadgeSize) / 2);
        drawRankBadge(ctx, rankUpAlertState.rankId, alertBadgeX, alertBadgeY, alertBadgeSize, alertBadgeSize);

        ctx.font = '900 8.5px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillText(`AWANS: ${rankUpAlertState.rankName.toUpperCase()}`, alertBadgeX + alertBadgeSize + 6, by + bh / 2 + 1.5);
        ctx.fillStyle = '#facc15';
        ctx.fillText(`AWANS: ${rankUpAlertState.rankName.toUpperCase()}`, alertBadgeX + alertBadgeSize + 5, by + bh / 2 + 0.5);
      } else {
        // Wariant desktop: pełny baner z nagrodami i odznaką
        const bw = Math.min(380, sw - 32);
        const bh = 56;
        const bx = Math.round((sw - bw) / 2);
        const by = 96;

        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 6);
        else ctx.rect(bx, by, bw, bh);
        ctx.fillStyle = 'rgba(8, 20, 36, 0.95)';
        ctx.fill();

        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        const deskBadgeSize = 38;
        const deskBadgeX = bx + 12;
        const deskBadgeY = Math.round(by + (bh - deskBadgeSize) / 2);
        drawRankBadge(ctx, rankUpAlertState.rankId, deskBadgeX, deskBadgeY, deskBadgeSize, deskBadgeSize);

        ctx.font = '900 13px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillText(`AWANS NA STOPIEŃ: ${rankUpAlertState.rankName.toUpperCase()}`, deskBadgeX + deskBadgeSize + 13, by + 11);
        ctx.fillStyle = '#facc15';
        ctx.fillText(`AWANS NA STOPIEŃ: ${rankUpAlertState.rankName.toUpperCase()}`, deskBadgeX + deskBadgeSize + 12, by + 10);

        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(rankUpAlertState.rewardText, deskBadgeX + deskBadgeSize + 12, by + 31);
      }

      ctx.restore();
    }
  }

  ctx.restore();
}
