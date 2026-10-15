/**
 * UI/RANKHUD.JS - Wizualna prezentacja stopni wojskowych i punktów XP
 * Rysowanie w HUD podczas gry oraz obsługa nagród XP za wygrany mecz.
 */

import { getCurrentRank, getNextRank, getPlayerXP, getRankProgress, addPlayerXP, recordMatchResult, XP_REWARDS, setXpNotificationCallback } from '../progression.js';

// Stan powiadomień XP i zwycięstwa w meczu
export const matchWinState = {
  won: false,
  winner: null, // 'CYAN' | 'ORANGE'
  timer: 0,
  maxTimer: 240, // ~4 sekundy przy 60 fps
  xpAwarded: false,
  rewardXp: XP_REWARDS?.MATCH_WIN || 40,
  previousRankName: '',
  newRankName: ''
};

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

/**
 * Sprawdza warunek zwycięstwa w meczu i przyznaje +40 XP dla gracza (drużyna CYAN)
 * - Arena 1 (Piłka / Neonowe Miasto): wygrana przy 3 bramkach
 * - Areny 2 i 3 (Deathmatch): 5-minutowy mecz rozliczany wyłącznie na koniec w module deathmatch
 */
export function checkMatchWin(arenaId, scoreObj) {
  if (!scoreObj || matchWinState.won) return;

  // Na Arenie 2 i Arenie 3 obowiązuje 5-minutowy Deathmatch – rozliczany wyłącznie na koniec w module deathmatch
  const isDeathmatch = (
    arenaId === 'ARENA_2' || arenaId === 'ARENA_2_PANDORA' || arenaId === 'arena-2' || arenaId === 'ARENA_2_SECTOR_X' ||
    arenaId === 'ARENA_3' || arenaId === 'arena-3' || arenaId === 'ARENA_FOUNDRY'
  );
  if (isDeathmatch) {
    return;
  }

  const winThreshold = 3;

  const cyanScore = scoreObj.cyan || 0;
  const orangeScore = scoreObj.orange || 0;

  if (cyanScore >= winThreshold) {
    const rankBefore = getCurrentRank();
    matchWinState.won = true;
    matchWinState.winner = 'CYAN';
    matchWinState.timer = matchWinState.maxTimer;
    matchWinState.xpAwarded = true;
    matchWinState.previousRankName = rankBefore.name;

    // Przyznanie +40 XP za wygrany mecz oraz zapis statystyki
    addPlayerXP(matchWinState.rewardXp);
    recordMatchResult('WIN');

    const rankAfter = getCurrentRank();
    matchWinState.newRankName = rankAfter.name;

    spawnXpPopup(`+${matchWinState.rewardXp} XP ZWYCIĘSTWO!`, matchWinState.rewardXp, '#4ade80');
  } else if (orangeScore >= winThreshold) {
    matchWinState.won = true;
    matchWinState.winner = 'ORANGE';
    matchWinState.timer = matchWinState.maxTimer;
    matchWinState.xpAwarded = false;
    recordMatchResult('LOSS');
  }
}

/**
 * Aktualizacja timera celebracji i reset wyniku meczu po zakończeniu
 */
export function updateMatchWinState(scoreObj) {
  if (!matchWinState.won) return;

  if (matchWinState.timer > 0) {
    matchWinState.timer--;
    if (matchWinState.timer <= 0) {
      matchWinState.won = false;
      matchWinState.winner = null;
      matchWinState.xpAwarded = false;
      if (scoreObj) {
        scoreObj.cyan = 0;
        scoreObj.orange = 0;
      }
    }
  }
}

export function resetMatchWinState() {
  matchWinState.won = false;
  matchWinState.winner = null;
  matchWinState.timer = 0;
  matchWinState.xpAwarded = false;
}

/**
 * Rysuje stopień wojskowy i pasek XP w lewym górnym rogu HUD
 */
export function drawRankHUD(ctx, x, y, width, isMobile) {
  const currentXp = getPlayerXP();
  const rank = getCurrentRank(currentXp);
  const nextRank = getNextRank(currentXp);
  const progress = getRankProgress(currentXp);

  ctx.save();

  const rankTextY = y;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // Ikona i stopień wojskowy
  ctx.font = isMobile ? 'bold 9.5px monospace' : 'bold 10.5px monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 3;
  ctx.fillText(`${rank.icon} ${rank.short.toUpperCase()}`, x, rankTextY);

  // Wartość XP po prawej stronie
  ctx.textAlign = 'right';
  ctx.font = isMobile ? 'bold 9px monospace' : 'bold 10px monospace';
  ctx.fillStyle = '#facc15';
  const xpStr = nextRank ? `${currentXp} / ${nextRank.minXp} XP` : `${currentXp} XP (MAX)`;
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
    ctx.fillStyle = p.color;
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(p.text, x + width, barY + p.yOffset - 6);
    ctx.restore();

    if (p.life <= 0) {
      floatingXpPopups.splice(i, 1);
    }
  }

  ctx.restore();
}

/**
 * Rysuje pełnoekranowy baner zwycięstwa w meczu z informacją o +40 XP
 */
export function drawMatchVictoryHUD(ctx, W, H, isMobile) {
  if (!matchWinState.won || matchWinState.timer <= 0) return;

  const isCyanWinner = (matchWinState.winner === 'CYAN');
  const alphaProgress = Math.min(1.0, (matchWinState.timer / 30));

  ctx.save();
  ctx.globalAlpha = alphaProgress * 0.92;

  // Ciemny overlay z kolorowym akcentem
  ctx.fillStyle = isCyanWinner ? 'rgba(8, 25, 45, 0.78)' : 'rgba(45, 15, 10, 0.78)';
  ctx.fillRect(0, 0, W, H);

  const bannerW = isMobile ? Math.min(W - 30, 360) : 480;
  const bannerH = isMobile ? 140 : 170;
  const bannerX = (W - bannerW) / 2;
  const bannerY = (H - bannerH) * 0.38;

  // Główna ramka baneru
  ctx.beginPath();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
  ctx.strokeStyle = isCyanWinner ? '#00e5ff' : '#ef4444';
  ctx.lineWidth = 2.0;
  if (ctx.roundRect) ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 12);
  else ctx.rect(bannerX, bannerY, bannerW, bannerH);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (isCyanWinner) {
    // Tytuł zwycięstwa
    ctx.font = isMobile ? '900 22px monospace' : '900 30px monospace';
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = 'rgba(250, 204, 21, 0.6)';
    ctx.shadowBlur = 12;
    ctx.fillText('ZWYCIĘSTWO W MECZU!', W / 2, bannerY + (isMobile ? 32 : 38));

    // Nagroda XP
    ctx.font = isMobile ? 'bold 15px monospace' : 'bold 18px monospace';
    ctx.fillStyle = '#4ade80';
    ctx.shadowColor = 'rgba(74, 222, 128, 0.6)';
    ctx.shadowBlur = 8;
    ctx.fillText(`+${matchWinState.rewardXp} XP PRESTIŻU ARENY`, W / 2, bannerY + (isMobile ? 64 : 76));

    // Stopień wojskowy
    const currentXp = getPlayerXP();
    const currentRank = getCurrentRank(currentXp);
    const leveledUp = matchWinState.previousRankName && matchWinState.previousRankName !== matchWinState.newRankName;

    ctx.font = isMobile ? 'bold 11px monospace' : 'bold 13px monospace';
    if (leveledUp) {
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#00e5ff';
      ctx.fillText(`AWANS: ${currentRank.icon} ${currentRank.name.toUpperCase()}`, W / 2, bannerY + (isMobile ? 95 : 112));
    } else {
      ctx.fillStyle = '#cbd5e1';
      ctx.shadowBlur = 0;
      ctx.fillText(`STOPIEŃ: ${currentRank.icon} ${currentRank.name.toUpperCase()} (${currentXp} XP)`, W / 2, bannerY + (isMobile ? 95 : 112));
    }
  } else {
    // Porażka
    ctx.font = isMobile ? '900 22px monospace' : '900 28px monospace';
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
    ctx.shadowBlur = 10;
    ctx.fillText('PRZEGRANA W MECZU', W / 2, bannerY + (isMobile ? 40 : 50));

    ctx.font = isMobile ? 'bold 12px monospace' : 'bold 14px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.shadowBlur = 0;
    ctx.fillText('DRUŻYNA ORANGE ZDOBYŁA PRZEWAGĘ', W / 2, bannerY + (isMobile ? 75 : 90));
  }

  // Odliczanie do nowej rundy
  const secondsLeft = Math.ceil(matchWinState.timer / 60);
  ctx.font = isMobile ? 'bold 9.5px monospace' : 'bold 11px monospace';
  ctx.fillStyle = '#64748b';
  ctx.shadowBlur = 0;
  ctx.fillText(`Restart rundy za: ${secondsLeft}s`, W / 2, bannerY + bannerH - (isMobile ? 16 : 20));

  ctx.restore();
}
