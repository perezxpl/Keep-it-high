/**
 * UI/RANKHUD.JS - Wizualna prezentacja stopni wojskowych i punktów XP
 * Rysowanie w HUD podczas gry oraz obsługa nagród XP za wygrany mecz.
 */

import { getCurrentRank, getNextRank, getPlayerXP, getRankProgress, addPlayerXP, recordMatchResult, XP_REWARDS, setXpNotificationCallback, setRankUpCallback } from '../progression.js';

// Stan powiadomień XP i zwycięstwa w meczu
export const matchWinState = {
  won: false,
  winner: null, // 'CYAN' | 'ORANGE'
  timer: 0,
  maxTimer: 240, // ~4 sekundy przy 60 fps
  xpAwarded: false,
  rewardXp: XP_REWARDS?.MATCH_WIN || 40,
  previousRankName: '',
  newRankName: '',
  returnButtonBounds: null
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

// Stan powiadomienia o awansie na nowy stopień wojskowy
export const rankUpAlertState = {
  active: false,
  rankName: '',
  rankIcon: '',
  rewardText: '',
  timer: 0,
  maxTimer: 180
};

export function triggerRankUpAlert(rank) {
  if (!rank) return;
  rankUpAlertState.active = true;
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
 * Sprawdza warunek zwycięstwa w meczu i przyznaje +40 XP dla gracza (drużyna CYAN)
 * - Arena 1 (Piłka / Neonowe Miasto): wygrana przy 3 bramkach
 * - Areny 2 i 3 (Deathmatch): 5-minutowy mecz rozliczany wyłącznie na koniec w module deathmatch
 */
export function checkMatchWin(arenaId, scoreObj) {
  if (!scoreObj || matchWinState.won) return;

  // Na Arenie 2 i Arenie 3 obowiązuje 5-minutowy Deathmatch – rozliczany wyłącznie na koniec w module deathmatch
  const isDeathmatch = (
    arenaId === 'ARENA_2' || arenaId === 'ARENA_2_PANDORA' || arenaId === 'arena-2' || arenaId === 'ARENA_2_SECTOR_X' ||
    arenaId === 'ARENA_3' || arenaId === 'arena-3' || arenaId === 'ARENA_FOUNDRY' ||
    arenaId === 'ARENA_4' || arenaId === 'arena-4'
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
      matchWinState.returnButtonBounds = null;
      if (scoreObj) {
        scoreObj.cyan = 0;
        scoreObj.orange = 0;
      }
      if (typeof window !== 'undefined' && typeof window.concludeMatchAndReturnToLobby === 'function') {
        window.concludeMatchAndReturnToLobby();
      }
    }
  }
}

export function resetMatchWinState() {
  matchWinState.won = false;
  matchWinState.winner = null;
  matchWinState.timer = 0;
  matchWinState.xpAwarded = false;
  matchWinState.returnButtonBounds = null;
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

  if (isMobile) {
    // Ultra-minimalistyczny wariant mobilny: pojedyncza, dyskretna mikro-linia XP
    const barY = y + 1;
    const barH = 2.0;

    // Cienki pasek postępu XP
    ctx.beginPath();
    ctx.fillStyle = 'rgba(6, 9, 17, 0.85)';
    if (ctx.roundRect) ctx.roundRect(x, barY, width, barH, 1.0);
    else ctx.rect(x, barY, width, barH);
    ctx.fill();

    if (progress > 0) {
      const fillW = Math.max(2, width * Math.min(1, progress));
      ctx.beginPath();
      ctx.fillStyle = '#00e5ff';
      if (ctx.roundRect) ctx.roundRect(x, barY, fillW, barH, 1.0);
      else ctx.rect(x, barY, fillW, barH);
      ctx.fill();
    }
  } else {
    // Pełny wariant desktopowy
    const rankTextY = y;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Ikona i stopień wojskowy
    ctx.font = 'bold 10.5px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 3;
    ctx.fillText(`${rank.icon} ${rank.short.toUpperCase()}`, x, rankTextY);

    // Wartość XP po prawej stronie
    ctx.textAlign = 'right';
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#facc15';
    const xpStr = nextRank ? `${currentXp} / ${nextRank.minXp} XP` : `${currentXp} XP (MAX)`;
    ctx.fillText(xpStr, x + width, rankTextY);

    // Cienki, taktyczny pasek postępu XP
    const barY = rankTextY + 8;
    const barH = 3.5;

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
        const rewardY = barY + barH + 8;
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#94a3b8';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 2;
        ctx.fillText(`NAGRODA: ${previewLabel.toUpperCase()}`, x, rewardY);
      }
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
    ctx.fillStyle = p.color;
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
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
      const bw = Math.min(360, sw - 32);
      const bh = 54;
      const bx = Math.round((sw - bw) / 2);
      const by = isMobile ? 80 : 96;

      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 6);
      else ctx.rect(bx, by, bw, bh);
      ctx.fillStyle = 'rgba(8, 20, 36, 0.95)';
      ctx.fill();

      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.font = isMobile ? '900 12px monospace' : '900 13px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = 'rgba(250, 204, 21, 0.6)';
      ctx.shadowBlur = 6;
      ctx.fillText(`AWANS NA STOPIEŃ: ${rankUpAlertState.rankIcon} ${rankUpAlertState.rankName.toUpperCase()}`, bx + bw / 2, by + 9);

      ctx.font = isMobile ? 'bold 9px monospace' : 'bold 10px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 2;
      ctx.fillText(rankUpAlertState.rewardText, bx + bw / 2, by + 29);

      ctx.restore();
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

  const leveledUp = matchWinState.previousRankName && matchWinState.previousRankName !== matchWinState.newRankName;
  const bannerW = isMobile ? Math.min(W - 30, 360) : 480;
  const bannerH = isMobile ? (leveledUp ? 172 : 156) : (leveledUp ? 204 : 184);
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
      ctx.fillText(`AWANS: ${currentRank.icon} ${currentRank.name.toUpperCase()}`, W / 2, bannerY + (isMobile ? 93 : 108));
      if (Array.isArray(currentRank.unlocks) && currentRank.unlocks.length > 0) {
        const uLabels = currentRank.unlocks.map(u => (typeof u === 'string' ? u : (u?.label || u?.name || ''))).filter(Boolean);
        if (uLabels.length > 0) {
          ctx.font = isMobile ? 'bold 8.5px monospace' : 'bold 10px monospace';
          ctx.fillStyle = '#00e5ff';
          ctx.fillText(`ODBLOKOWANO: ${uLabels.join(' • ').toUpperCase()}`, W / 2, bannerY + (isMobile ? 110 : 128));
        }
      }
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

  // Przycisk i odliczanie powrotu do lobby
  const secondsLeft = Math.ceil(matchWinState.timer / 60);
  const btnW = isMobile ? Math.min(bannerW - 40, 230) : 260;
  const btnH = isMobile ? 28 : 32;
  const btnX = (W - btnW) / 2;
  const btnY = bannerY + bannerH - btnH - (isMobile ? 8 : 12);

  matchWinState.returnButtonBounds = { x: btnX, y: btnY, w: btnW, h: btnH };

  const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.008);
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(btnX, btnY, btnW, btnH, 6);
  else ctx.rect(btnX, btnY, btnW, btnH);
  ctx.fillStyle = `rgba(14, 116, 144, ${0.45 + pulse * 0.15})`;
  ctx.fill();
  ctx.strokeStyle = `rgba(56, 189, 248, ${0.75 + pulse * 0.25})`;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = isMobile ? '900 10.5px monospace' : '900 12px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 6;
  ctx.fillText(`POWRÓT DO LOBBY (${secondsLeft}s)`, W / 2, btnY + btnH / 2);
  ctx.restore();

  ctx.restore();
}
