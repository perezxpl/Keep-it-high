// =========================================================================
// UI/CLASSSELECTMODAL.JS - MODAL WYBORU KLASY POSTACI NA CANVASIE
// Wydzielony moduł z js/main.js
// =========================================================================

import { GAME_STATES } from '../config.js';
import { W, H, mouseScreenPos } from '../world.js';
import { CLASSES } from '../classes/index.js';

export const CLASS_CARDS = [
  {
    id: 'RAPTOR',
    name: 'Raptor',
    key: '1',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    role: 'KLASA LEKKA • ZWIADOWCA / LOTNIK',
    attribute: '🦅 PLECAK ODRZUTOWY (JETPACK)',
    desc: 'Ekstremalna mobilność powietrzna, pełny ciąg jetpacka i zwinność w locie.',
    stats: ['Jetpack: 150 Pojemności', 'Najwyższa prędkość i kontrola w locie', 'Lekki pancerz zwiadowczy'],
    classObj: CLASSES.RAPTOR
  },
  {
    id: 'STRIKER',
    name: 'Striker',
    key: '2',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    role: 'KLASA ŚREDNIA • SZTURMOWIEC',
    attribute: '⚡ TURBO BUTY / PRECYZJA',
    desc: 'Dynamiczny szturmowiec z dopalaczami w butach, szybkim unikiem i precyzją ognia.',
    stats: ['Moduł ruchu: Turbo Buty', 'Zbalansowany pancerz (100 HP)', 'Wysoka precyzja i kontrola odrzutu'],
    classObj: CLASSES.STRIKER
  },
  {
    id: 'ENFORCER',
    name: 'Enforcer',
    key: '3',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.45)',
    role: 'KLASA CIĘŻKA • KOLOS / TARAN',
    attribute: '🛡️ ROCKET JUMP / PANCERZ',
    desc: 'Masywna sylwetka, potężna odporność na ogień i wybuchowe wejścia w zwarciu.',
    stats: ['Maksymalne Zdrowie: 160 HP', 'Moduł ruchu: Wybuchowy skok', 'Potężny Spartan Kick i taranowanie'],
    classObj: CLASSES.ENFORCER
  }
];

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      context.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line.trim(), x, curY);
  return curY + lineHeight;
}

export function getClassCardRects(modalW = Math.min(940, W - 32), modalH = Math.min(500, H - 32)) {
  const modalX = (W - modalW) / 2;
  const modalY = (H - modalH) / 2;
  const cardPadding = 18;
  const gap = 14;
  const totalGaps = gap * (CLASS_CARDS.length - 1);
  const availableW = modalW - (cardPadding * 2) - totalGaps;
  const cardW = Math.floor(availableW / CLASS_CARDS.length);
  const cardH = modalH - 114;
  const startY = modalY + 98;

  return CLASS_CARDS.map((card, i) => ({
    card,
    x: modalX + cardPadding + i * (cardW + gap),
    y: startY,
    w: cardW,
    h: cardH
  }));
}

export function getHoveredClassCard(screenX, screenY, currentGameState = (typeof window !== 'undefined' && window.GAME_STATE ? window.GAME_STATE.current : 'CLASS_SELECT')) {
  if (currentGameState !== GAME_STATES.CLASS_SELECT) return null;
  const rects = getClassCardRects();
  for (const item of rects) {
    if (screenX >= item.x && screenX <= item.x + item.w &&
      screenY >= item.y && screenY <= item.y + item.h) {
      return item.card;
    }
  }
  return null;
}

export function drawClassSelectModal(ctx, mouseScreenX = (mouseScreenPos ? mouseScreenPos.x : 640), mouseScreenY = (mouseScreenPos ? mouseScreenPos.y : 360)) {
  ctx.save();

  // 1. Półprzezroczyste ciemne tło (vignette / backdrop)
  ctx.fillStyle = 'rgba(5, 8, 18, 0.78)';
  ctx.fillRect(0, 0, W, H);

  // Radialny glow w tle modalu
  const bgGlow = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, Math.max(W, H) * 0.55);
  bgGlow.addColorStop(0, 'rgba(0, 229, 255, 0.10)');
  bgGlow.addColorStop(0.5, 'rgba(15, 23, 42, 0.25)');
  bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, W, H);

  // 2. Wymiary i pozycjonowanie modalu
  const modalW = Math.min(940, W - 32);
  const modalH = Math.min(500, H - 32);
  const modalX = (W - modalW) / 2;
  const modalY = (H - modalH) / 2;

  // Główny korpus okna modalu z neonową ramką
  ctx.save();
  ctx.shadowColor = 'rgba(0, 229, 255, 0.45)';
  ctx.shadowBlur = 24;

  const panelGrad = ctx.createLinearGradient(modalX, modalY, modalX, modalY + modalH);
  panelGrad.addColorStop(0, 'rgba(15, 23, 42, 0.96)');
  panelGrad.addColorStop(1, 'rgba(9, 14, 26, 0.98)');
  ctx.fillStyle = panelGrad;
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.65)';
  ctx.lineWidth = 1.8;

  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(modalX, modalY, modalW, modalH, 16);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.rect(modalX, modalY, modalW, modalH);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // Wewnętrzny pasek nagłówkowy
  ctx.save();
  ctx.textAlign = 'center';

  // Badge kategorii
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = '#00e5ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 6;
  ctx.fillText('⚡ PROTOKÓŁ ROZGRYWKI • WYBIERZ SPECJALIZACJĘ ⚡', W / 2, modalY + 34);
  ctx.shadowBlur = 0;

  // Główny nagłówek
  ctx.font = '900 24px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 229, 255, 0.8)';
  ctx.shadowBlur = 10;
  ctx.fillText('WYBIERZ SWOJĄ KLASĘ / SELECT YOUR CLASS', W / 2, modalY + 62);
  ctx.shadowBlur = 0;

  // Podtytuł z instrukcją
  ctx.font = '600 12px "Segoe UI", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('WYBIERZ KAFELEK KLASY [1-3] LUB KLIKNIJ KAFELEK MYSZKĄ ABY ROZPOCZĄĆ', W / 2, modalY + 82);

  // Linia podziału
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(modalX + 24, modalY + 92);
  ctx.lineTo(modalX + modalW - 24, modalY + 92);
  ctx.stroke();
  ctx.restore();

  // 3. Rysowanie 4 kafelków klas
  const cardRects = getClassCardRects(modalW, modalH);

  cardRects.forEach(({ card, x, y, w, h }) => {
    const isHovered = mouseScreenX >= x && mouseScreenX <= x + w &&
      mouseScreenY >= y && mouseScreenY <= y + h;

    ctx.save();

    // Tło kafelka
    const cardBg = ctx.createLinearGradient(x, y, x, y + h);
    if (isHovered) {
      cardBg.addColorStop(0, 'rgba(30, 41, 59, 0.95)');
      cardBg.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
      ctx.shadowColor = card.color;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = card.color;
      ctx.lineWidth = 2.4;
    } else {
      cardBg.addColorStop(0, 'rgba(15, 23, 42, 0.75)');
      cardBg.addColorStop(1, 'rgba(10, 15, 26, 0.88)');
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.2;
    }

    ctx.fillStyle = cardBg;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 12);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // Akcent górny kafelka w kolorze klasy
    ctx.save();
    ctx.fillStyle = card.color;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x + 12, y + 2, w - 24, 3, 2);
      ctx.fill();
    } else {
      ctx.fillRect(x + 12, y + 2, w - 24, 3);
    }
    ctx.restore();

    // Badge klawisza skrótu [ 1 ], [ 2 ], itd.
    ctx.save();
    const badgeW = 34;
    const badgeH = 22;
    const badgeX = x + w - badgeW - 12;
    const badgeY = y + 14;

    ctx.fillStyle = isHovered ? card.color : 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;

    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
      ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);
    }

    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isHovered ? '#0f172a' : '#f1f5f9';
    ctx.fillText(`[${card.key}]`, badgeX + badgeW / 2, badgeY + badgeH / 2);
    ctx.restore();

    // Nazwa klasy
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = '900 20px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = isHovered ? '#ffffff' : '#f8fafc';
    if (isHovered) {
      ctx.shadowColor = card.color;
      ctx.shadowBlur = 8;
    }
    ctx.fillText(card.name, x + 16, y + 32);
    ctx.shadowBlur = 0;

    // Atrybut główny
    ctx.font = 'bold 11px "Segoe UI", monospace';
    ctx.fillStyle = card.color;
    ctx.fillText(card.attribute, x + 16, y + 50);

    // Rola / kategoria
    ctx.font = '600 10px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(card.role, x + 16, y + 66);

    // Linia wewnątrz kafelka
    ctx.strokeStyle = isHovered ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 16, y + 76);
    ctx.lineTo(x + w - 16, y + 76);
    ctx.stroke();

    // Krótki opis roli
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#94a3b8';
    wrapText(ctx, card.desc, x + 16, y + 94, w - 32, 16);

    // Wypunktowane atrybuty / statystyki
    let statY = y + 155;
    for (const stat of card.stats) {
      ctx.font = 'bold 10px "Segoe UI", monospace';
      ctx.fillStyle = isHovered ? '#f1f5f9' : '#cbd5e1';
      ctx.fillText(`• ${stat}`, x + 16, statY);
      statY += 20;
    }

    // Dolny przycisk "WYBIERZ [klawisz]"
    const btnH = 34;
    const btnY = y + h - btnH - 14;
    const btnW = w - 32;
    const btnX = x + 16;

    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    if (isHovered) {
      btnGrad.addColorStop(0, card.color);
      btnGrad.addColorStop(1, card.color);
      ctx.shadowColor = card.color;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#ffffff';
    } else {
      btnGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      btnGrad.addColorStop(1, 'rgba(255, 255, 255, 0.03)');
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    }

    ctx.fillStyle = btnGrad;
    ctx.lineWidth = 1.2;

    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnW, btnH, 8);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.rect(btnX, btnY, btnW, btnH);
      ctx.fill();
      ctx.stroke();
    }

    ctx.font = 'bold 11px "Segoe UI", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isHovered ? '#0f172a' : '#f1f5f9';
    ctx.fillText(isHovered ? `▶ WYBIERZ KLASĘ [${card.key}]` : `WYBIERZ [${card.key}]`, btnX + btnW / 2, btnY + btnH / 2);

    ctx.restore();
  });

  ctx.restore();
}

