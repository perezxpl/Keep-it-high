// =========================================================================
// DEATHMATCH/RENDERER.JS - RENDEROWANIE HUD-U I EKRANU PODIUM BITWY
// Timer 5:00, ranking na żywo, polskie nazwy drużyn (Niebiescy / Czerwoni),
// nagrody 100/80/60/40 XP oraz pełne okno podium po wygranym meczu
// =========================================================================

import { deathmatchState, DEATHMATCH_MODES, TEAMS, DEATHMATCH_XP_REWARDS, DEATHMATCH_PHASES } from './state.js';
import { camera } from '../camera.js';

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
 * Rysuje główny HUD trybu Deathmatch na górze ekranu.
 * Zoptymalizowany pod kątem urządzeń mobilnych: ultra-kompaktowy rozmiar (26px),
 * zintegrowana pozycja gracza wewnątrz kontenera (brak zwisających tekstów)
 * oraz automatyczne przenikanie przezroczystości (proximity ghosting) przy suficie.
 */
export function drawDeathmatchHUD(ctx, W, H, isMobile, player = null) {
  if (!deathmatchState.active) return;

  const isTdm = (deathmatchState.mode === DEATHMATCH_MODES.TDM);
  const winCond = deathmatchState.winCondition || 'BOTH';
  const fragLimit = deathmatchState.fragLimit || 25;
  const checksFrags = (winCond === 'BOTH' || winCond === 'FRAGS');

  // Kompaktowy kontener ze zintegrowanymi statystykami
  const boxW = isMobile ? (checksFrags ? 240 : 220) : (checksFrags ? 330 : 310);
  const boxH = isMobile ? 26 : 33;
  const boxX = (W - boxW) / 2;
  const boxY = isMobile ? 6 : 8;

  const timeLeft = deathmatchState.timeRemaining;
  const isUrgent = (winCond !== 'FRAGS' && timeLeft <= 30 && timeLeft > 0);
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
  let pData = null;
  const parts = deathmatchState.participants;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].isPlayer) {
      pData = parts[i];
      break;
    }
  }
  const pKills = pData ? pData.kills : 0;
  const pDeaths = pData ? pData.deaths : 0;
  const placeColor = (place === 1) ? '#facc15' : ((place === 2) ? '#e2e8f0' : ((place === 3) ? '#f97316' : '#94a3b8'));

  // 1. Górny mikro-pasek: Czas (lewa strona) oraz Pozycja gracza (prawa strona)
  const topTextY = boxY + (isMobile ? 9.5 : 12);
  ctx.font = isMobile ? '900 8px monospace' : '900 9.5px monospace';

  // Timer (MM:SS) po lewej stronie
  ctx.textAlign = 'left';
  ctx.fillStyle = isUrgent ? '#ef4444' : '#facc15';
  const timerStr = (winCond === 'FRAGS')
    ? (isMobile ? formatTime(deathmatchState.elapsedTime || 0) : `CZAS ${formatTime(deathmatchState.elapsedTime || 0)}`)
    : formatTime(timeLeft);
  ctx.fillText(timerStr, boxX + (isMobile ? 8 : 12), topTextY);

  // Pozycja gracza po prawej stronie (zintegrowana wewnątrz pigułki HUD)
  ctx.textAlign = 'right';
  ctx.fillStyle = placeColor;
  const posText = isMobile ? `#${place} (${pKills}F/${pDeaths}Z)` : `POZ. #${place} (${pKills} F / ${pDeaths} Z)`;
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
    const cyanScoreDisplay = checksFrags ? `${cyanKills}/${fragLimit}` : `${cyanKills}`;
    const cyanLabel = `${cyanScoreDisplay} NIEBIESCY${isPlayerCyan ? ' [*]' : ''}`;
    ctx.fillText(cyanLabel, boxX + boxW / 2 - (isMobile ? 7 : 10), scoreY);

    // Dwukropek
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(':', boxX + boxW / 2, scoreY);

    // Czerwoni
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f97316';
    const orangeScoreDisplay = checksFrags ? `${orangeKills}/${fragLimit}` : `${orangeKills}`;
    const orangeLabel = `${isPlayerOrange ? '[*] ' : ''}CZERWONI ${orangeScoreDisplay}`;
    ctx.fillText(orangeLabel, boxX + boxW / 2 + (isMobile ? 7 : 10), scoreY);
  } else {
    // Tryb Każdy na Każdego
    const leader = deathmatchState.leaderboard[0];
    ctx.font = isMobile ? 'bold 9px monospace' : 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#facc15';
    const leaderName = leader ? leader.name : 'BRAK';
    const leaderKills = leader ? leader.kills : 0;
    const ffaScoreDisplay = checksFrags ? `${leaderKills}/${fragLimit}` : `${leaderKills}`;
    ctx.fillText(`LIDER: ${leaderName} (${ffaScoreDisplay} FRAGÓW)`, boxX + boxW / 2, scoreY);
  }

  ctx.restore();

  // 3. Odliczanie przedmeczowe (3.. 2.. 1.. WALKA!)
  drawDeathmatchCountdown(ctx, W, H, isMobile);
}

/**
 * Renderuje taktyczną nakładkę odliczania (Lockdown 3.. 2.. 1..) oraz baner WALKA!
 */
export function drawDeathmatchCountdown(ctx, W, H, isMobile) {
  if (!deathmatchState.active) return;
  const isCountdown = (deathmatchState.matchPhase === DEATHMATCH_PHASES.COUNTDOWN);
  const isBanner = (deathmatchState.fightBannerTimer > 0);
  if (!isCountdown && !isBanner) return;

  ctx.save();

  if (isCountdown) {
    const timer = Math.max(0, deathmatchState.countdownTimer);
    const secNum = Math.min(3, Math.max(1, Math.ceil(timer)));
    // Postęp w obrębie bieżącej sekundy: 0.0 (początek) -> 1.0 (koniec sekundy)
    const subSec = timer - Math.floor(timer);
    const frac = (subSec === 0 && timer > 0) ? 0 : (1.0 - subSec);
    const pop = Math.max(0, 1.0 - frac * 3.5);
    const scale = 1.0 + pop * 0.32;

    const cX = W / 2;
    const cY = isMobile ? (H * 0.38) : (H * 0.40);

    const cardW = isMobile ? 220 : 260;
    const cardH = isMobile ? 120 : 136;
    const cardX = cX - cardW / 2;
    const cardY = cY - cardH / 2;

    // Tło taktycznego okna odliczania
    ctx.fillStyle = 'rgba(10, 15, 29, 0.78)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1.5;
    if (ctx.roundRect) ctx.roundRect(cardX, cardY, cardW, cardH, 10);
    else ctx.rect(cardX, cardY, cardW, cardH);
    ctx.fill();
    ctx.stroke();

    // Paleta akcentowa dla poszczególnych sekund:
    // 3: Błękit taktyczny (#38bdf8), 2: Bursztyn (#f59e0b), 1: Czerwień bojowa (#ef4444)
    const themeColor = (secNum === 3) ? '#38bdf8' : (secNum === 2 ? '#f59e0b' : '#ef4444');

    // Narożne znaczniki celownika taktycznego (Corner brackets)
    const bLen = 14;
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    // Lewy górny
    ctx.moveTo(cardX + 6, cardY + 6 + bLen);
    ctx.lineTo(cardX + 6, cardY + 6);
    ctx.lineTo(cardX + 6 + bLen, cardY + 6);
    // Prawy górny
    ctx.moveTo(cardX + cardW - 6 - bLen, cardY + 6);
    ctx.lineTo(cardX + cardW - 6, cardY + 6);
    ctx.lineTo(cardX + cardW - 6, cardY + 6 + bLen);
    // Lewy dolny
    ctx.moveTo(cardX + 6, cardY + cardH - 6 - bLen);
    ctx.lineTo(cardX + 6, cardY + cardH - 6);
    ctx.lineTo(cardX + 6 + bLen, cardY + cardH - 6);
    // Prawy dolny
    ctx.moveTo(cardX + cardW - 6 - bLen, cardY + cardH - 6);
    ctx.lineTo(cardX + cardW - 6, cardY + cardH - 6);
    ctx.lineTo(cardX + cardW - 6, cardY + cardH - 6 - bLen);
    ctx.stroke();

    // Górny nagłówek taktyczny
    ctx.font = isMobile ? '900 9px monospace' : '900 10.5px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
    ctx.fillText('ODLICZANIE DO WALKI // LOCKDOWN', cX, cardY + 14);

    // Główna cyfra odliczania ze sprężystym skalowaniem
    const fontSize = Math.round((isMobile ? 54 : 64) * scale);
    ctx.font = `900 ${fontSize}px monospace`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = themeColor;
    ctx.fillText(String(secNum), cX, cY + (isMobile ? 4 : 6));

    // Dolny wskaźnik 3-segmentowy
    const segW = isMobile ? 24 : 32;
    const segH = 4;
    const segGap = 6;
    const totalSegW = 3 * segW + 2 * segGap;
    const segStartX = cX - totalSegW / 2;
    const segY = cardY + cardH - 16;

    for (let s = 1; s <= 3; s++) {
      const sx = segStartX + (s - 1) * (segW + segGap);
      const isLit = (s <= (4 - secNum));
      ctx.fillStyle = isLit ? themeColor : 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(sx, segY, segW, segH);
    }
  } else if (isBanner) {
    // Baner startu: "WALKA! // MISJA ROZPOCZĘTA"
    const timer = deathmatchState.fightBannerTimer; // 1.2 -> 0.0
    const alpha = Math.min(1.0, timer / 0.35); // Płynne wygaszanie pod koniec
    const pop = Math.max(0, timer - 0.9) / 0.3; // Punch wejścia
    const scale = 1.0 + pop * 0.22;

    const cX = W / 2;
    const cY = isMobile ? (H * 0.38) : (H * 0.40);

    const bannerW = isMobile ? 280 : 360;
    const bannerH = isMobile ? 85 : 98;
    const bannerX = cX - bannerW / 2;
    const bannerY = cY - bannerH / 2;

    ctx.globalAlpha = alpha;

    // Tło banera
    ctx.fillStyle = 'rgba(6, 26, 18, 0.88)';
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2.0;
    if (ctx.roundRect) ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 8);
    else ctx.rect(bannerX, bannerY, bannerW, bannerH);
    ctx.fill();
    ctx.stroke();

    // Podtytuł
    ctx.font = isMobile ? '900 10px monospace' : '900 11.5px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#86efac';
    ctx.fillText('MISJA ROZPOCZĘTA // CEL ZATWIERDZONY', cX, bannerY + 14);

    // Wielki napis WALKA!
    const fontSize = Math.round((isMobile ? 38 : 46) * scale);
    ctx.font = `900 ${fontSize}px monospace`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#22c55e';
    ctx.fillText('WALKA!', cX, cY + 12);
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
      teamWinnerText = `WYGRYWA DRUŻYNA NIEBIESCY! (${cyanKills} : ${orangeKills})`;
      teamWinnerColor = '#00e5ff';
      if (playerTeam === TEAMS.CYAN) {
        playerTeamStatus = 'TWÓJ SKŁAD ODNIÓSŁ ZWYCIĘSTWO!';
        playerTeamColor = '#4ade80';
      } else {
        playerTeamStatus = 'TWÓJ SKŁAD PONIOSŁ PORAŻKĘ';
        playerTeamColor = '#ef4444';
      }
    } else if (orangeKills > cyanKills) {
      teamWinnerText = `WYGRYWA DRUŻYNA CZERWONI! (${orangeKills} : ${cyanKills})`;
      teamWinnerColor = '#f97316';
      if (playerTeam === TEAMS.ORANGE) {
        playerTeamStatus = 'TWÓJ SKŁAD ODNIÓSŁ ZWYCIĘSTWO!';
        playerTeamColor = '#4ade80';
      } else {
        playerTeamStatus = 'TWÓJ SKŁAD PONIOSŁ PORAŻKĘ';
        playerTeamColor = '#ef4444';
      }
    } else {
      teamWinnerText = `REMIS DRUŻYNOWY! (${cyanKills} : ${orangeKills})`;
      teamWinnerColor = '#facc15';
      playerTeamStatus = 'ZACIĘTY REMIS NA POLU WALKI';
      playerTeamColor = '#cbd5e1';
    }
  } else {
    const leader = deathmatchState.leaderboard[0];
    const leaderName = leader ? leader.name : 'BRAK';
    const leaderKills = leader ? leader.kills : 0;
    teamWinnerText = `MISTRZ BITWY: ${leaderName} (${leaderKills} FRAGÓW)`;
    teamWinnerColor = '#facc15';
    if (deathmatchState.playerPlace === 1) {
      playerTeamStatus = 'JESTEŚ NIEPOKONANYM MISTRZEM ARENY!';
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

  // 1. Podtytuł z powodem zakończenia bitwy
  ctx.textAlign = 'center';
  ctx.font = isMobile ? 'bold 10px monospace' : 'bold 11px monospace';
  ctx.fillStyle = '#94a3b8';
  const reasonText = (deathmatchState.endReason === 'FRAG_LIMIT')
    ? `LIMIT FRAGÓW (${deathmatchState.fragLimit || 25})`
    : `LIMIT CZASU (${formatTime(deathmatchState.matchDuration || 300)})`;
  ctx.fillText(`BITWA ZAKOŃCZONA [ ${reasonText} ] // WYNIKI MECZU`, W / 2, cardY + (isMobile ? 22 : 26));

  // 2. Główny baner zwycięzcy (KTÓRA DRUŻYNA WYGRAŁA)
  ctx.font = isMobile ? '900 16px monospace' : '900 22px monospace';
  ctx.strokeStyle = '#050810';
  ctx.lineWidth = 3.0;
  ctx.strokeText(teamWinnerText, W / 2, cardY + (isMobile ? 46 : 56));
  ctx.fillStyle = teamWinnerColor;
  ctx.fillText(teamWinnerText, W / 2, cardY + (isMobile ? 46 : 56));

  // 3. Status składu gracza
  ctx.font = isMobile ? 'bold 11px monospace' : 'bold 13px monospace';
  ctx.fillStyle = playerTeamColor;
  ctx.fillText(playerTeamStatus, W / 2, cardY + (isMobile ? 68 : 80));

  // 4. Miejsce gracza i przyznana nagroda XP
  const place = deathmatchState.playerPlace;
  const xpAwarded = deathmatchState.awardedXpAmount || 40;

  ctx.font = isMobile ? '900 12.5px monospace' : '900 15px monospace';
  const xpTxt = `TWOJA POZYCJA: #${place} MIEJSCE  ->  +${xpAwarded} XP PREMII BOJOWEJ`;
  ctx.strokeStyle = '#050810';
  ctx.lineWidth = 2.5;
  ctx.strokeText(xpTxt, W / 2, cardY + (isMobile ? 92 : 108));
  ctx.fillStyle = '#4ade80';
  ctx.fillText(xpTxt, W / 2, cardY + (isMobile ? 92 : 108));

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
    const rankPrefix = `#${idx + 1}`;
    const nickText = isPlayer ? `${p.name} [TY]` : p.name;
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

  // Przycisk i odliczanie powrotu do lobby
  const secLeft = Math.ceil(timer / 60);
  const btnW = isMobile ? Math.min(cardW - 40, 240) : 280;
  const btnH = isMobile ? 30 : 34;
  const btnX = (W - btnW) / 2;
  const btnY = cardY + cardH - btnH - (isMobile ? 10 : 14);

  deathmatchState.returnButtonBounds = { x: btnX, y: btnY, w: btnW, h: btnH };

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
  ctx.font = isMobile ? '900 11px monospace' : '900 12.5px monospace';
  const lobbyTxt = `POWRÓT DO LOBBY (${secLeft}s)`;
  ctx.strokeStyle = '#050810';
  ctx.lineWidth = 2.5;
  ctx.strokeText(lobbyTxt, W / 2, btnY + btnH / 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(lobbyTxt, W / 2, btnY + btnH / 2);
  ctx.restore();

  ctx.restore();
}
