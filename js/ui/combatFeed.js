// =========================================================================
// UI/COMBATFEED.JS - MINIMALISTYCZNY INFORMATOR O ZGONACH I ELIMINACJACH
// Ultra-lekka pigułka taktyczna pod górnym HUD-em, nie zasłania ekranu
// Zero emojis, czysta typografia Rajdhani, półprzezroczystość i proximity fade
// =========================================================================

import { camera } from '../camera.js';

export const combatFeedState = {
  active: false,
  type: 'KILL', // 'KILL' | 'DEATH'
  name: '',
  text: '',
  subtext: '',
  timer: 0,
  maxTimer: 130 // ~2.15 sekundy przy 60 FPS (szybki, responsywny komunikat)
};

export function triggerCombatFeedBanner(type, name) {
  combatFeedState.active = true;
  combatFeedState.type = (type === 'DEATH') ? 'DEATH' : 'KILL';
  const cleanName = String(name || (combatFeedState.type === 'KILL' ? 'PRZECIWNIK' : 'NIEZNANY')).trim().toUpperCase();
  combatFeedState.name = cleanName;
  combatFeedState.timer = 130;

  if (combatFeedState.type === 'KILL') {
    combatFeedState.subtext = 'ELIMINACJA';
    combatFeedState.text = cleanName.startsWith('[') ? cleanName : `ZABIŁEŚ: ${cleanName}`;
  } else {
    const isSelfMistake = cleanName.includes('WŁASNY') || cleanName.includes('SAMOBÓJ') || cleanName.includes('PRZEPAŚĆ') || cleanName.includes('UTONIĘCIE') || cleanName.includes('RYKOSZET');
    const isArenaHazard = cleanName.includes('KWAS') || cleanName.includes('ŚRODOWISKO') || cleanName.includes('ZAWALENIE') || cleanName.includes('MINA') || cleanName.includes('PRÓŻNIA') || cleanName.includes('KOSMICZN') || cleanName.includes('KONTENER') || cleanName.includes('UTYLIZATOR');

    if (isSelfMistake) {
      combatFeedState.subtext = 'BŁĄD OPERATORA';
    } else if (isArenaHazard) {
      combatFeedState.subtext = 'ZAGROŻENIE ARENY';
    } else {
      combatFeedState.subtext = 'STRATA OPERATORA';
    }
    combatFeedState.text = cleanName.startsWith('[') ? cleanName : `ZABITY PRZEZ: ${cleanName}`;
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
  if (!ctx || !combatFeedState.active || combatFeedState.timer <= 0) return;

  const scrW = (typeof W === 'number' && Number.isFinite(W) && W > 0) ? W : (ctx.canvas ? ctx.canvas.width : 800);
  const scrH = (typeof H === 'number' && Number.isFinite(H) && H > 0) ? H : (ctx.canvas ? ctx.canvas.height : 600);

  const isKill = (combatFeedState.type === 'KILL');
  const timer = combatFeedState.timer;
  const maxTimer = combatFeedState.maxTimer;

  // Szybkie wejście (pierwsze 10 klatek) i płynne wyjście (ostatnie 20 klatek)
  const enterProgress = Math.min(1.0, (maxTimer - timer) / 10);
  const exitProgress = Math.min(1.0, timer / 20);
  let alpha = enterProgress * exitProgress;

  if (alpha <= 0.01) return;

  // Dyskretna animacja wejścia z góry (slide-down o 4px)
  const slideY = (1 - enterProgress) * -4;
  // Pozycja w górnej części ekranu tuż pod nagłówkiem/wynikiem meczu (nigdy nie zasłania dołu ani środka gry)
  const bannerY = (isMobile ? 38 : 46) + slideY;
  const bannerH = isMobile ? 20 : 23;

  // Proximity Ghosting: jeśli gracz podskoczy pod sufit w pobliże pigułki, staje się ona mocno przezroczysta
  if (camera && typeof camera.x === 'number') {
    alpha *= 0.88;
  }

  const mainColor = isKill ? '#00e5ff' : '#ef4444';
  const bgColor = isKill ? 'rgba(6, 18, 32, 0.78)' : 'rgba(32, 8, 12, 0.78)';

  const name = combatFeedState.name;
  const isDirectMsg = name.startsWith('[');
  let prefix = '';
  if (!isDirectMsg) {
    if (isKill) {
      prefix = 'ZABIŁEŚ: ';
    } else {
      const isHazard = combatFeedState.subtext.includes('ZAGROŻENIE') || combatFeedState.subtext.includes('BŁĄD');
      prefix = isHazard ? 'POLEGŁEŚ: ' : 'ZABITY PRZEZ: ';
    }
  }

  ctx.save();
  try {
    ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha));

    ctx.font = `900 ${isMobile ? '10px' : '11.5px'} 'Rajdhani', monospace`;
    const prefixW = prefix ? ctx.measureText(prefix).width : 0;
    const nameW = ctx.measureText(name).width;
    const contentW = prefixW + nameW;

    // Dynamiczna, kompaktowa szerokość dopasowana do treści (zamiast wielkiego kloca)
    const padX = isMobile ? 12 : 16;
    const bannerW = Math.min(scrW - 28, Math.max(120, contentW + padX * 2 + 10));
    const bannerX = (scrW - bannerW) / 2;

    // Tło minimalistycznej pigułki
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 1.0;

    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 4);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
      ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);
    }

    // Lewy mikro-akcent taktyczny
    ctx.fillStyle = mainColor;
    ctx.fillRect(bannerX + 2, bannerY + 3, 3, bannerH - 6);

    // Wypisanie tekstu w jednej, czytelnej linii
    ctx.textBaseline = 'middle';
    const midY = bannerY + bannerH / 2 + 0.5;

    if (isDirectMsg) {
      ctx.textAlign = 'center';
      ctx.fillStyle = mainColor;
      ctx.shadowColor = mainColor;
      ctx.shadowBlur = 4;
      ctx.fillText(name, scrW / 2, midY);
    } else {
      const startX = bannerX + (bannerW - contentW) / 2 + 2;

      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.shadowBlur = 0;
      ctx.fillText(prefix, startX, midY);

      ctx.fillStyle = mainColor;
      ctx.shadowColor = mainColor;
      ctx.shadowBlur = 4;
      ctx.fillText(name, startX + prefixW, midY);
    }
  } catch (_) {
    // Ciche zabezpieczenie
  } finally {
    ctx.restore();
  }
}
