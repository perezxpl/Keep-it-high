// =========================================================================
// DEATHMATCH/RENDERER.JS - RENDEROWANIE HUD-U I EKRANU PODIUM BITWY
// Timer 5:00, ranking na żywo, polskie nazwy drużyn (Niebiescy / Czerwoni),
// nagrody 100/80/60/40 XP oraz pełne okno podium po wygranym meczu
// =========================================================================

import { deathmatchState, DEATHMATCH_MODES, TEAMS, DEATHMATCH_XP_REWARDS } from './state.js';

/**
 * Formatowanie sekund do postaci MM:SS (np. 04:59)
 */
function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
import { camera } from '../camera.js';

/**
 * Rysuje główny HUD trybu Deathmatch na górze ekranu.
 * Zoptymalizowany pod kątem urządzeń mobilnych: ultra-kompaktowy rozmiar (26px),
 * zintegrowana pozycja gracza wewnątrz kontenera (brak zwisających tekstów)
 * oraz automatyczne przenikanie przezroczystości (proximity ghosting) przy suficie.
 */
export function drawDeathmatchHUD(ctx, W, H, isMobile, player = null) {
  if (!deathmatchState.active) return;

  const isTdm = (deathmatchState.mode === DEATHMATCH_MODES.TDM);
  // Kompaktowy kontener ze zintegrowanymi statystykami
  const boxW = isMobile ? 220 : 310;
  const boxH = isMobile ? 26 : 33;
  const boxX = (W - boxW) / 2;
  const boxY = isMobile ? 6 : 8;

  const timeLeft = deathmatchState.timeRemaining;
  const isUrgent = (timeLeft <= 30 && timeLeft > 0);
  const pulse = isUrgent ? (0.6 + 0.4 * Math.sin(performance.now() * 0.012)) : 1.0;

  // Proximity Ghosting: jeśli postać gracza znajduje się blisko góry/sufitu pod HUD-em,
  // HUD automatycznie staje się półprzezroczysty, by nie zasłaniać postaci ani celownika
  let baseAlpha = isMobile ? 0.78 : 0.86;
  if (player && typeof player.x === 'number') {
    const camX = (camera && typeof camera.x === 'number') ? camera.x : 0;
    const camY = (camera && typeof camera.y === 'number') ? camera.y : 0;
    const camZoom = (camera && typeof camera.zoom === 'number') ? camera.zoom : 1;
    const pScreenX = (player.x + (player.w || 24) * 0.5 - camX) * camZoom;
    const pScreenY = (player.y - camY) * camZoom;
    const nearX = Math.abs(pScreenX - W / 2) < (boxW * 0.5 + 45);
    const nearY = pScreenY < (boxY + boxH + 95);
    if (nearX && nearY) {
      const distRatio = Math.max(0, Math.min(1, (pScreenY - boxY) / (boxH + 95)));
      baseAlpha = 0.20 + distRatio * 0.20; // 0.20 do 0.40 gdy postać jest pod sufitem
    }
  }

  ctx.save();
  ctx.globalAlpha = baseAlpha;

  // Główny kontener HUD
  ctx.beginPath();
  ctx.fillStyle = 'rgba(11, 19, 36, 0.78)';
  ctx.strokeStyle = isUrgent ? `rgba(239, 68, 68, ${pulse})` : 'rgba(250, 204, 21, 0.45)';
  ctx.lineWidth = isUrgent ? 1.8 : 1.2;
  if (ctx.roundRect) ctx.roundRect(boxX, boxY, boxW, boxH, isMobile ? 6 : 7);
  else ctx.rect(boxX, boxY, boxW, boxH);
  ctx.fill();
  ctx.stroke();

  // Dane pozycji i fragów gracza
  const place = deathmatchState.playerPlace || 1;
  const pData = deathmatchState.participants.find(p => p.isPlayer);
  const pKills = pData ? pData.kills : 0;
  const pDeaths = pData ? pData.deaths : 0;
  const medalIcon = (place === 1) ? '🥇' : ((place === 2) ? '🥈' : ((place === 3) ? '🥉' : '🎖️'));
  const placeColor = (place === 1) ? '#facc15' : ((place === 2) ? '#e2e8f0' : ((place === 3) ? '#f97316' : '#94a3b8'));

  // 1. Górny mikro-pasek: Czas (lewa strona) oraz Pozycja gracza (prawa strona)
  const topTextY = boxY + (isMobile ? 9.5 : 12);
  ctx.font = isMobile ? '900 8px monospace' : '900 9.5px monospace';

  // Timer (MM:SS) po lewej stronie
  ctx.textAlign = 'left';
  ctx.fillStyle = isUrgent ? '#ef4444' : '#facc15';
  ctx.fillText(`⏱️ ${formatTime(timeLeft)}`, boxX + (isMobile ? 8 : 12), topTextY);

  // Pozycja gracza po prawej stronie (zintegrowana wewnątrz pigułki HUD)
  ctx.textAlign = 'right';
  ctx.fillStyle = placeColor;
  const posText = isMobile ? `${medalIcon} #${place} (${pKills}F/${pDeaths}Z)` : `${medalIcon} POZ. #${place} (${pKills} F / ${pDeaths} Z)`;
  ctx.fillText(posText, boxX + boxW - (isMobile ? 8 : 12), topTextY);

  // 2. Dolny pasek: Wynik punktowy drużyn lub FFA
  const scoreY = boxY + (isMobile ? 20.5 : 26);
  if (isTdm) {
    const cyanKills = deathmatchState.teamScores[TEAMS.CYAN] || 0;
    const orangeKills = deathmatchState.teamScores[TEAMS.ORANGE] || 0;
    const isPlayerCyan = (deathmatchState.playerTeam === TEAMS.CYAN);
    const isPlayerOrange = (deathmatchState.playerTeam === TEAMS.ORANGE);

    ctx.font = isMobile ? '900 10px monospace' : '900 12.5px monospace';

    // Niebiescy
    ctx.textAlign = 'right';
    ctx.fillStyle = '#00e5ff';
    const cyanLabel = `${cyanKills} NIEBIESCY${isPlayerCyan ? ' ★' : ''}`;
    ctx.fillText(cyanLabel, boxX + boxW / 2 - (isMobile ? 7 : 10), scoreY);

    // Dwukropek
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(':', boxX + boxW / 2, scoreY);

    // Czerwoni
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f97316';
    const orangeLabel = `${isPlayerOrange ? '★ ' : ''}CZERWONI ${orangeKills}`;
    ctx.fillText(orangeLabel, boxX + boxW / 2 + (isMobile ? 7 : 10), scoreY);
  } else {
    // Tryb Każdy na Każdego
    const leader = deathmatchState.leaderboard[0];
    ctx.font = isMobile ? 'bold 9px monospace' : 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#facc15';
    const leaderName = leader ? leader.name : 'BRAK';
    const leaderKills = leader ? leader.kills : 0;
    ctx.fillText(`👑 LIDER: ${leaderName} (${leaderKills} FRAGÓW)`, boxX + boxW / 2, scoreY);
  }

  ctx.restore();
}

/**
 * Rysuje ekran zakończenia bitwy i ceremonię podium:
 * Pokazuje która drużyna wygrała, nagrodę XP (100 / 80 / 60 / 40 XP) oraz kto zajął jakie miejsce w tabeli
 */
export function drawDeathmatchPodium(ctx, W, H, isMobile) {
  if (!deathmatchState.matchEnded || deathmatchState.endCelebrationTimer <= 0) return;

  const timer = deathmatchState.endCelebrationTimer;
  const alpha = Math.min(1.0, timer / 25);

  ctx.save();
  ctx.globalAlpha = alpha * 0.96;

  // Ciemny overlay z tłem
  ctx.fillStyle = 'rgba(6, 11, 23, 0.90)';
  ctx.fillRect(0, 0, W, H);

  const cardW = isMobile ? Math.min(W - 20, 440) : 600;
  const cardH = isMobile ? 380 : 430;
  const cardX = (W - cardW) / 2;
  const cardY = (H - cardH) / 2;

  const isTdm = (deathmatchState.mode === DEATHMATCH_MODES.TDM);
  const cyanKills = deathmatchState.teamScores[TEAMS.CYAN] || 0;
  const orangeKills = deathmatchState.teamScores[TEAMS.ORANGE] || 0;
  const playerTeam = deathmatchState.playerTeam;

  // Ustalenie zwycięzcy drużynowego lub indywidualnego
  let teamWinnerText = '';
  let teamWinnerColor = '#facc15';
  let playerTeamStatus = '';
  let playerTeamColor = '#cbd5e1';

  if (isTdm) {
    if (cyanKills > orangeKills) {
      teamWinnerText = `🔵 WYGRYWA DRUŻYNA NIEBIESCY! (${cyanKills} : ${orangeKills})`;
      teamWinnerColor = '#00e5ff';
      if (playerTeam === TEAMS.CYAN) {
        playerTeamStatus = '★ TWÓJ SKŁAD ODNIÓSŁ ZWYCIĘSTWO! ★';
        playerTeamColor = '#4ade80';
      } else {
        playerTeamStatus = 'TWÓJ SKŁAD PONIOSŁ PORAŻKĘ';
        playerTeamColor = '#ef4444';
      }
    } else if (orangeKills > cyanKills) {
      teamWinnerText = `🔴 WYGRYWA DRUŻYNA CZERWONI! (${orangeKills} : ${cyanKills})`;
      teamWinnerColor = '#f97316';
      if (playerTeam === TEAMS.ORANGE) {
        playerTeamStatus = '★ TWÓJ SKŁAD ODNIÓSŁ ZWYCIĘSTWO! ★';
        playerTeamColor = '#4ade80';
      } else {
        playerTeamStatus = 'TWÓJ SKŁAD PONIOSŁ PORAŻKĘ';
        playerTeamColor = '#ef4444';
      }
    } else {
      teamWinnerText = `🤝 REMIS DRUŻYNOWY! (${cyanKills} : ${orangeKills})`;
      teamWinnerColor = '#facc15';
      playerTeamStatus = 'ZACIĘTY REMIS NA POLU WALKI';
      playerTeamColor = '#cbd5e1';
    }
  } else {
    const leader = deathmatchState.leaderboard[0];
    const leaderName = leader ? leader.name : 'BRAK';
    const leaderKills = leader ? leader.kills : 0;
    teamWinnerText = `👑 MISTRZ BITWY: ${leaderName} (${leaderKills} FRAGÓW)`;
    teamWinnerColor = '#facc15';
    if (deathmatchState.playerPlace === 1) {
      playerTeamStatus = '★ JESTEŚ NIEPOKONANYM MISTRZEM ARENY! ★';
      playerTeamColor = '#4ade80';
    } else {
      playerTeamStatus = 'BITWA KAŻDY NA KAŻDEGO ZAKOŃCZONA';
      playerTeamColor = '#94a3b8';
    }
  }

  // Główna ramka okna podium
  ctx.beginPath();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.98)';
  ctx.strokeStyle = teamWinnerColor;
  ctx.lineWidth = 2.2;
  if (ctx.roundRect) ctx.roundRect(cardX, cardY, cardW, cardH, 14);
  else ctx.rect(cardX, cardY, cardW, cardH);
  ctx.fill();
  ctx.stroke();

  // 1. Podtytuł: Koniec Bitwy 5:00
  ctx.textAlign = 'center';
  ctx.font = isMobile ? 'bold 10px monospace' : 'bold 11px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('⏱️ BITWA ZAKOŃCZONA (5:00) // WYNIKI MECZU', W / 2, cardY + (isMobile ? 22 : 26));

  // 2. Główny baner zwycięzcy (KTÓRA DRUŻYNA WYGRAŁA)
  ctx.font = isMobile ? '900 16px monospace' : '900 22px monospace';
  ctx.fillStyle = teamWinnerColor;
  ctx.shadowColor = teamWinnerColor;
  ctx.shadowBlur = 12;
  ctx.fillText(teamWinnerText, W / 2, cardY + (isMobile ? 46 : 56));
  ctx.shadowBlur = 0;

  // 3. Status składu gracza
  ctx.font = isMobile ? 'bold 11px monospace' : 'bold 13px monospace';
  ctx.fillStyle = playerTeamColor;
  ctx.fillText(playerTeamStatus, W / 2, cardY + (isMobile ? 68 : 80));

  // 4. Miejsce gracza i przyznana nagroda XP
  const place = deathmatchState.playerPlace;
  const xpAwarded = deathmatchState.awardedXpAmount || 40;

  ctx.font = isMobile ? '900 12.5px monospace' : '900 15px monospace';
  ctx.fillStyle = '#4ade80';
  ctx.shadowColor = 'rgba(74, 222, 128, 0.6)';
  ctx.shadowBlur = 8;
  ctx.fillText(`TWOJA POZYCJA: #${place} MIEJSCE  ➤  +${xpAwarded} XP PREMII BOJOWEJ`, W / 2, cardY + (isMobile ? 92 : 108));
  ctx.shadowBlur = 0;

  // 5. Nagłówek tabeli wyników (KTO ZAJĄŁ JAKIE MIEJSCE)
  const tableY = cardY + (isMobile ? 122 : 144);
  const rowH = isMobile ? 28 : 34;

  ctx.font = isMobile ? 'bold 9px monospace' : 'bold 11px monospace';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'left';
  ctx.fillText('POZ.  UCZESTNIK', cardX + 22, tableY);
  ctx.textAlign = 'center';
  ctx.fillText('DRUŻYNA', cardX + cardW * 0.56, tableY);
  ctx.textAlign = 'right';
  ctx.fillText('FRAGI / ZGONY', cardX + cardW - 22, tableY);

  // Linia rozdzielająca
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 16, tableY + 6);
  ctx.lineTo(cardX + cardW - 16, tableY + 6);
  ctx.stroke();

  // Wiersze tabeli wyników (Leaderboard: 1., 2., 3., 4. miejsce)
  const list = deathmatchState.leaderboard.slice(0, 4);
  list.forEach((p, idx) => {
    const ry = tableY + 12 + (idx + 1) * rowH;
    const isPlayer = p.isPlayer;

    // Podświetlenie wiersza gracza
    if (isPlayer) {
      ctx.fillStyle = 'rgba(0, 229, 255, 0.16)';
      ctx.fillRect(cardX + 14, ry - (rowH - 6), cardW - 28, rowH - 2);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
      ctx.strokeRect(cardX + 14, ry - (rowH - 6), cardW - 28, rowH - 2);
    }

    // Pozycja i Nick
    ctx.textAlign = 'left';
    ctx.font = isPlayer ? (isMobile ? '900 11px monospace' : '900 13px monospace') : (isMobile ? 'bold 10px monospace' : 'bold 12px monospace');
    ctx.fillStyle = isPlayer ? '#00e5ff' : '#cbd5e1';
    const rankPrefix = (idx === 0) ? '🥇 #1' : (idx === 1 ? '🥈 #2' : (idx === 2 ? '🥉 #3' : `   #${idx + 1}`));
    const nickText = isPlayer ? `${p.name} ★ [TY]` : p.name;
    ctx.fillText(`${rankPrefix}  ${nickText}`, cardX + 22, ry - 4);

    // Drużyna (zawsze polska nazwa: NIEBIESCY lub CZERWONI)
    ctx.textAlign = 'center';
    ctx.font = isMobile ? 'bold 9px monospace' : 'bold 11px monospace';
    const teamLabel = (p.team === TEAMS.CYAN) ? 'NIEBIESCY' : 'CZERWONI';
    ctx.fillStyle = (p.team === TEAMS.CYAN) ? '#00e5ff' : '#f97316';
    ctx.fillText(teamLabel, cardX + cardW * 0.56, ry - 4);

    // Fragi / Zgony
    ctx.textAlign = 'right';
    ctx.font = isMobile ? 'bold 10px monospace' : 'bold 12px monospace';
    ctx.fillStyle = '#facc15';
    ctx.fillText(`${p.kills} F / ${p.deaths} Z`, cardX + cardW - 22, ry - 4);
  });

  // Odliczanie do nowej bitwy
  const secLeft = Math.ceil(timer / 60);
  ctx.textAlign = 'center';
  ctx.font = isMobile ? 'bold 9px monospace' : 'bold 11px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`Restart nowej rundy za: ${secLeft}s`, W / 2, cardY + cardH - (isMobile ? 14 : 18));

  ctx.restore();
}
