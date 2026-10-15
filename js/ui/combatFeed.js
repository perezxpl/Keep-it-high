// =========================================================================
// UI/COMBATFEED.JS - DOLNY BANER ELIMINACJI I ZGONÓW (ZABIŁEŚ / ZABITY PRZEZ)
// Profesjonalna typografia Orbitron/Rajdhani, styl militarny Soldat, ZERO EMOJIS
// =========================================================================

export const combatFeedState = {
  active: false,
  type: 'KILL', // 'KILL' | 'DEATH'
  name: '',
  text: '',
  subtext: '',
  timer: 0,
  maxTimer: 180 // 3 sekundy przy 60 FPS
};

export function triggerCombatFeedBanner(type, name) {
  combatFeedState.active = true;
  combatFeedState.type = (type === 'DEATH') ? 'DEATH' : 'KILL';
  const cleanName = String(name || (combatFeedState.type === 'KILL' ? 'PRZECIWNIK' : 'NIEZNANY')).trim().toUpperCase();
  combatFeedState.name = cleanName;
  combatFeedState.timer = 180;

  if (combatFeedState.type === 'KILL') {
    combatFeedState.subtext = 'ELIMINACJA // FRAG +1';
    combatFeedState.text = `ZABIŁEŚ: ${cleanName}`;
  } else {
    combatFeedState.subtext = 'STRATA OPERATORA // POLEGŁEŚ';
    combatFeedState.text = `ZABITY PRZEZ: ${cleanName}`;
  }
}

export function updateCombatFeed(dt) {
  if (!combatFeedState.active) return;
  if (combatFeedState.timer > 0) {
    combatFeedState.timer--;
    if (combatFeedState.timer <= 0) {
      combatFeedState.active = false;
    }
  }
}

export function drawCombatFeedBanner(ctx, W, H, isMobile) {
  if (!combatFeedState.active || combatFeedState.timer <= 0) return;

  const isKill = (combatFeedState.type === 'KILL');
  const timer = combatFeedState.timer;
  const maxTimer = combatFeedState.maxTimer;

  // Wejście (pierwsze 14 klatek) i wyjście (ostatnie 30 klatek)
  const enterProgress = Math.min(1.0, (maxTimer - timer) / 14);
  const exitProgress = Math.min(1.0, timer / 30);
  const alpha = enterProgress * exitProgress;

  if (alpha <= 0.01) return;

  // Płynne podjechanie w górę (slide-up)
  const slideY = (1 - enterProgress) * 20;
  const bannerY = (isMobile ? (H - 62) : (H - 78)) + slideY;
  const bannerW = isMobile ? Math.min(W - 32, 320) : 420;
  const bannerH = isMobile ? 42 : 48;
  const bannerX = (W - bannerW) / 2;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Kolory motywu
  const mainColor = isKill ? '#00e5ff' : '#ef4444';
  const bgColor = isKill ? 'rgba(6, 26, 44, 0.95)' : 'rgba(44, 10, 10, 0.95)';

  // Tło płytki
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 1.5;

  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 6);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
    ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);
  }

  // Boczne akcenty taktyczne
  ctx.fillStyle = mainColor;
  ctx.fillRect(bannerX, bannerY + 6, 4, bannerH - 12);
  ctx.fillRect(bannerX + bannerW - 4, bannerY + 6, 4, bannerH - 12);

  // 1. Górny mikro-nagłówek (Subtext)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `900 ${isMobile ? '8.5px' : '9.5px'} 'Rajdhani', monospace`;
  ctx.fillStyle = isKill ? 'rgba(0, 229, 255, 0.85)' : 'rgba(239, 68, 68, 0.85)';
  ctx.fillText(combatFeedState.subtext, W / 2, bannerY + (isMobile ? 5 : 6));

  // 2. Główny napis ZABIŁEŚ: / ZABITY PRZEZ:
  const prefix = isKill ? 'ZABIŁEŚ: ' : 'ZABITY PRZEZ: ';
  const name = combatFeedState.name;

  ctx.font = `900 ${isMobile ? '14px' : '17px'} 'Orbitron', 'Rajdhani', monospace`;
  ctx.textBaseline = 'middle';
  const midY = bannerY + (isMobile ? 27 : 31);

  const prefixW = ctx.measureText(prefix).width;
  const nameW = ctx.measureText(name).width;
  const totalW = prefixW + nameW;
  const startX = (W - totalW) / 2;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(prefix, startX, midY);

  ctx.fillStyle = mainColor;
  ctx.shadowColor = mainColor;
  ctx.shadowBlur = 6;
  ctx.fillText(name, startX + prefixW, midY);
  ctx.shadowBlur = 0;

  ctx.restore();
}
